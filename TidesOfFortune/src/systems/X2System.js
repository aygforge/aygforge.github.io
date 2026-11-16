// GENİŞLEME PAKETİ 2 — KAPTANLARIN HİKÂYELERİ
// Durum (run.x2 / meta.x2), tek kullanımlık haklar, zincir kotası ve ipucu ağırlıkları, kişisel zincir
// kuralları, Codex finalleri (+ başarılı/başarısız alt sonuçlar), başarımlar ve fx.x2 etkileri.
// x1 alt-durumuna dokunmaz; yalnızca kendi alanlarını ekler.
import { hasUpgrade } from '../core/GameState.js';
import { GOOD_BY_ID } from '../data/goods.js';
import * as X1 from './X1System.js';

// ───────────────────────── Durum ─────────────────────────
export function initRunX2(run) {
  const base = {
    flags: {}, // run içi hikâye/dünya bayrakları (reefMapped, fishermanFriend…)
    hints: {}, // zincir → çarpan (bir kez)
    hintUsed: {}, // aynı ipucu run'da bir defa
    once: {}, // tek kullanımlık haklar (lookoutBell, contractGuarantee, signalLamps, sharedWatch…)
    helped: [], // Kaptanların Dostu: farklı gemiler
    personalDone: [], // run'da tamamlanan kişisel zincirler
    chanceOnce: [], // {add, tags|cats, label, voyages} tek kullanımlık şans desteği
    laneIntel: 0, // sonraki N rota seçiminde daha güvenilir ipucu
    tradeBoost: 0, // sonraki liman ziyaretinde satışa +%5 (bir ziyaret)
    nextRisk: 0, // sonraki yolculuğun ilk riskli seçimine tek seferlik ceza
    tx: [],
  };
  const x = run.x2 || {};
  run.x2 = { ...base, ...x, flags: { ...base.flags, ...(x.flags || {}) }, once: { ...base.once, ...(x.once || {}) }, hints: { ...(x.hints || {}) }, hintUsed: { ...(x.hintUsed || {}) } };
  return run.x2;
}
export function initMetaX2(meta) {
  const base = { finals: {}, subs: {}, outcomes: {}, echoes: {}, races: 0 };
  const x = meta.x2 || {};
  meta.x2 = { ...base, ...x, finals: { ...(x.finals || {}) }, subs: { ...(x.subs || {}) }, outcomes: { ...(x.outcomes || {}) }, echoes: { ...(x.echoes || {}) } };
  return meta.x2;
}
export const X = (run) => run.x2 || initRunX2(run);

/** Aynı karar ikinci kez uygulanmaz (idempotency) */
export function once(run, txId) {
  const x = X(run);
  if (x.tx.includes(txId)) return false;
  x.tx.push(txId);
  if (x.tx.length > 300) x.tx.splice(0, x.tx.length - 300);
  return true;
}

// ───────────────────────── Zincir kuralları ─────────────────────────
/** Kişisel tayfa zinciri mi (Groot dahil) */
export const isPersonal = (chain) => !!(chain.personal || chain.needCrew);

/** Zincir başlatma izni: en fazla 2 aktif/sıradaki zincir, en fazla 1 kişisel; normal run'da kalan seyir sayısı yeterli olmalı */
export function chainStartAllowed(G, chain, toIdx, CHAINS) {
  const run = G.run;
  const live = Object.entries(run.chains).filter(([, c]) => c.status === 'active' || c.status === 'queued');
  if (live.length >= 2) return false;
  if (isPersonal(chain) && live.some(([id]) => CHAINS[id] && isPersonal(CHAINS[id]))) return false;
  if (chain.minLegs && !X1.endlessOn(run) && run.totalHarbors && run.totalHarbors - toIdx < chain.minLegs) return false;
  if (chain.needCrew && !run.crew.includes(chain.needCrew)) return false;
  return true;
}

/** Zincir başlangıç ağırlığı: bağımsız ipucu eventi (bir kez) ve Tayfa Bağları */
export function chainWeight(G, chain) {
  const x = X(G.run);
  let w = 1;
  if (x.hints[chain.id]) w *= x.hints[chain.id];
  if (isPersonal(chain) && hasUpgrade(G.meta, 'UPG_X2_CREW_BONDS')) w *= 1.25;
  return w;
}

// ───────────────────────── Şans düzeltmeleri ─────────────────────────
/** Paket 2 yükseltmeleri ve tek kullanımlık destekler. Aynı etikete iki kez bonus yazılmaz. */
export function chanceMods(G, ev, o, add, flags = {}) {
  const run = G.run;
  const x = X(run);
  const tags = o.tags || [];
  // aynı fiziksel manevra için tek çekme/kaldırma bonusu: kanca önceliklidir
  if (hasUpgrade(G.meta, 'UPG_X2_TOW_HOOK') && tags.includes('tow')) add('Gemi Çekme Kancası', 15);
  else if (hasUpgrade(G.meta, 'UPG_X2_DECK_CRANE') && tags.includes('lift')) add('Güverte Vinci', 10);
  if (hasUpgrade(G.meta, 'UPG_X2_HONEST_SCALES') && tags.includes('scales')) add('Dürüst Terazi', 10);
  if (hasUpgrade(G.meta, 'UPG_X2_RACE_MAPS') && tags.includes('race')) add('Yarış Haritaları', 10);
  if (o.duo && hasUpgrade(G.meta, 'UPG_X2_SHARED_WATCH') && !x.once.sharedWatch && o.duo.every((c) => run.crew.includes(c))) add('Ortak Nöbet', 10);
  for (const b of o.bonus || []) if (b.x2flag && x.flags[b.x2flag]) add(b.label || 'Önceki keşif', b.add);
  // Sonsuz Deniz varyantı
  const v = variantOf(run, ev);
  if (v?.chanceAdd) for (const [t, d] of Object.entries(v.chanceAdd)) if (tags.includes(t)) add(v.label || 'Sonsuz Deniz', d);
  // tek kullanımlık destekler (Bağışlama finali, Büyük Şölen)
  for (const c of x.chanceOnce) if (matchesOnce(c, ev, o)) { add(c.label, c.add); break; }
  // İkinci Kuzey başarısızlığı: sonraki yolculuğun ilk riskli seçimine tek seferlik ceza
  if (x.nextRisk && (tags.includes('escape') || tags.includes('navigate') || tags.includes('maneuver') || tags.includes('explore') || tags.includes('reckless'))) add('Şaşmış pusula', -x.nextRisk);
}
function matchesOnce(c, ev, o) {
  const tags = o.tags || [];
  if (c.cats && !c.cats.includes(ev.cat)) return false;
  if (c.tags && !c.tags.some((t) => tags.includes(t))) return false;
  return true;
}
/** Seçim uygulandığında tek kullanımlık hakları tüket (yalnızca etkisi gerçekten kullanıldıysa) */
export function consumeOnChoice(G, ev, o, view) {
  const run = G.run;
  const x = X(run);
  const used = (label) => (view.breakdown || []).some((b) => b.label === label && b.v !== 0);
  if (o.duo && used('Ortak Nöbet')) x.once.sharedWatch = true;
  const ix = x.chanceOnce.findIndex((c) => used(c.label));
  if (ix >= 0) x.chanceOnce.splice(ix, 1);
  if (x.nextRisk && used('Şaşmış pusula')) x.nextRisk = 0;
}
/** Şans sınırı: riskli seçenekler %5–95 (özel garantili çözümler korunur) */
export function clampChance(c, hadOverride) {
  if (hadOverride) return Math.max(0, Math.min(100, c));
  return Math.max(5, Math.min(95, c));
}

// ───────────────────────── Hasar: Gözcü Çanı ─────────────────────────
export function damageMods(G, d, ev, notes) {
  const x = X(G.run);
  if (d > 0 && ev.cat === 'disaster' && hasUpgrade(G.meta, 'UPG_X2_LOOKOUT_BELL') && !x.once.lookoutBell) {
    x.once.lookoutBell = true;
    notes.push('Gözcü Çanı −10');
    return Math.max(0, d - 10);
  }
  return d;
}

// ───────────────────────── Sözleşme Teminatı ─────────────────────────
/** İstem dışı sözleşme başarısızlığında fraksiyon itibar cezası (−1); teminat run başına bir kez önler */
export function involuntaryFailPenalty(G, faction, lines) {
  if (!faction) return;
  const x = X(G.run);
  if (hasUpgrade(G.meta, 'UPG_X2_CONTRACT_GUARANTEE') && !x.once.contractGuarantee) {
    x.once.contractGuarantee = true;
    lines.push({ kind: 'info', text: 'Sözleşme Teminatı devreye girdi: itibar cezası uygulanmadı.' });
    return;
  }
  X1.addRep(G, faction, -1, lines);
}

// ───────────────────────── Sonsuz Deniz varyantları ─────────────────────────
/** Olayın derinliğe bağlı özel varyantı (bağımsız event sayılmaz) */
export function variantOf(run, ev) {
  if (!ev?.x2variant || !X1.endlessOn(run)) return null;
  const d = X1.depthOf(run);
  return d >= ev.x2variant.minDepth ? ev.x2variant : null;
}

// ───────────────────────── Codex ─────────────────────────
export function recordOutcome(G, evId, key, success) {
  const m = initMetaX2(G.meta);
  const o = (m.outcomes[evId] = m.outcomes[evId] || {});
  o[`${key}|${success ? 'w' : 'l'}`] = true;
}
export function recordFinal(G, chain, id, sub = null) {
  const m = initMetaX2(G.meta);
  const f = (m.finals[chain] = m.finals[chain] || []);
  if (!f.includes(id)) f.push(id);
  if (sub) { const k = `${chain}:${id}`; const s = (m.subs[k] = m.subs[k] || []); if (!s.includes(sub)) s.push(sub); }
}

// ───────────────────────── fx.x2 ─────────────────────────
/**
 * fx.x2: { hint:{chain,mult}, flag:{k:v}, helped:'gemiAnahtarı', final:{chain,id,sub}, chainDone, personal,
 *          ach, chanceOnce:{add,label,tags,cats}, laneIntel:n, tradeBoost:true, nextRisk:n, cargoUseFood:n,
 *          cargoUseCheap:n, rareItem:true, theatre:true }
 */
export function applyX2(G, fx, ctx, lines, deps) {
  const run = G.run;
  const x = X(run);
  const tx = `${ctx.ev.id}|${ctx.host?.pos ?? ''}|${run.idx}|${run.voyage?.fromIdx ?? ''}`;
  if (fx.hint && !x.hintUsed[fx.hint.chain]) { x.hintUsed[fx.hint.chain] = true; x.hints[fx.hint.chain] = fx.hint.mult; }
  if (fx.flag) Object.assign(x.flags, fx.flag);
  if (fx.helped && !x.helped.includes(fx.helped)) {
    x.helped.push(fx.helped);
    if (x.helped.length >= 3) deps.unlockAchievement(G, 'ACH_X2_CAPTAINS_FRIEND');
  }
  if (fx.final) { recordFinal(G, fx.final.chain, fx.final.id, fx.final.sub || null); lines.push({ kind: 'chain', text: 'Hikâyenin sonu Denizci Günlüğü\'ne yazıldı.' }); }
  if (fx.chainDone && fx.personal && !x.personalDone.includes(fx.chainDone)) {
    x.personalDone.push(fx.chainDone);
    if (x.personalDone.length >= 2) deps.unlockAchievement(G, 'ACH_X2_LIVING_MEMORIES');
  }
  if (fx.ach) deps.unlockAchievement(G, fx.ach);
  if (fx.useOnce) x.once[fx.useOnce] = true;
  if (fx.chanceOnce) x.chanceOnce.push({ ...fx.chanceOnce });
  if (fx.laneIntel) { x.laneIntel += fx.laneIntel; lines.push({ kind: 'route', text: `Sonraki ${fx.laneIntel} rota seçiminde daha güvenilir yön bilgisi.` }); }
  if (fx.tradeBoost) { x.tradeBoost = 1; lines.push({ kind: 'gold', text: 'Sonraki limanda satışlara +%5 avantaj.' }); }
  if (fx.nextRisk) { x.nextRisk = fx.nextRisk; lines.push({ kind: 'warn', text: 'Pusula şaştı: sonraki yolculukta ilk riskli seçime küçük ceza.' }); }
  // gıda/ucuz kargo tüketimi (görev sandıkları asla)
  const useCargo = (n, pref) => {
    for (let k = 0; k < n; k++) {
      const ok = (l) => l.qty > 0 && !l.contract && !GOOD_BY_ID[l.good].questItem;
      const lot = run.cargo.find((l) => ok(l) && pref.includes(l.good)) || (pref === CHEAP ? run.cargo.filter(ok).sort((a, b) => GOOD_BY_ID[a.good].buy - GOOD_BY_ID[b.good].buy)[0] : null);
      if (!lot) return false;
      lot.qty -= 1;
      lines.push({ kind: 'cargo', text: `1 ${GOOD_BY_ID[lot.good].name} kullanıldı` });
    }
    run.cargo = run.cargo.filter((l) => l.qty > 0);
    return true;
  };
  if (fx.cargoUseFood) useCargo(fx.cargoUseFood, FOOD);
  if (fx.cargoUseCheap) useCargo(fx.cargoUseCheap, CHEAP);
  void tx;
}
export const FOOD = ['GOOD_FISH', 'GOOD_GRAIN', 'GOOD_BISCUIT_CRATE', 'GOOD_OLIVE_OIL', 'GOOD_SPICE', 'GOOD_SALT'];
export const CHEAP = ['GOOD_SALT', 'GOOD_SANDSTONE', 'GOOD_GRAIN', 'GOOD_FISH', 'GOOD_TIMBER'];
export const TIMBER_FOOD = ['GOOD_TIMBER', 'GOOD_FISH', 'GOOD_GRAIN', 'GOOD_BISCUIT_CRATE', 'GOOD_OLIVE_OIL'];

/** Uzun seferin gerçek istatistikleri (Derinlik V tiyatro varyantı) — uydurma yok */
export function theatreText(run) {
  const e = run.x1?.endless || {};
  const s = run.stats || {};
  return `Oyuncular bu kez seni oynadı: ${run.idx + 1}. limana kadar yelken açan, ${e.extra || 0} ek limanı geride bırakan, ${s.eventsResolved || 0} olayı atlatıp ${s.goldEarned || 0} altın kazanan bir kaptanı.`;
}

/** Satış avantajı (Gezgin Aşevi finali): bir liman ziyareti */
export function sellMult(run) { return run.x2?.tradeBoost === 2 ? 1.05 : 1; }
export function onHarborVisit(run) { const x = X(run); if (x.tradeBoost) x.tradeBoost = x.tradeBoost === 1 ? 2 : 0; }
/** Rota ipucu güvenilirliği: kalan hak varsa +20 yüzde puan ve bir hak tüketilir */
export function laneIntelBonus(run, consume = false) {
  const x = X(run);
  if (!x.laneIntel) return 0;
  if (consume) x.laneIntel -= 1;
  return 20;
}
