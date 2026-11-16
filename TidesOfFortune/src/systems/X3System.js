// GENİŞLEME PAKETİ 3 — EFSANEVİ DENİZLER VE RAKİP KAPTANLAR
// Durum (run.x3 / meta.x3), rakip kaptan ilişkileri (−2..+2), karşılaşma bekleme süresi, efsane kuralları,
// tek kullanımlık haklar, Codex "Denizci Kroniği" kayıtları ve fx.x3 etkileri.
// x1 / x2 / eğitim alt-durumlarına dokunmaz; yalnızca kendi alanlarını ekler. Yeni Math.random yok.
import { hasUpgrade } from '../core/GameState.js';
import * as X1 from './X1System.js';
import * as X2 from './X2System.js';

export const CAPTAINS = {
  liora: { id: 'liora', name: 'Liora', gen: "Liora'nın", ship: 'Turkuaz Kırlangıç', style: 'liora', color: '#3fc2c0' },
  boran: { id: 'boran', name: 'Boran', gen: "Boran'ın", ship: 'Kızıl Örs', style: 'boran', color: '#a8322a' },
  neris: { id: 'neris', name: 'Neris', gen: "Neris'in", ship: 'Kül Pusulası', style: 'neris', color: '#c87a3c' },
};
export const CAPTAIN_IDS = Object.keys(CAPTAINS);
export const LEGENDS = ['EVT_X3_L01', 'EVT_X3_L02', 'EVT_X3_L03'];
export const X3_CHAIN_IDS = ['CH_X3_COUNCIL', 'CH_X3_ARMADA', 'CH_X3_ATLAS', 'CH_X3_FLAGS'];
const LEGEND_ACH = { EVT_X3_L01: 'ACH_X3_FROZEN_ARMADA', EVT_X3_L02: 'ACH_X3_STONE_CAUSEWAY', EVT_X3_L03: 'ACH_X3_LIVING_ISLAND' };
const LEGEND_HINT = { EVT_X3_L01: 'CH_X3_ARMADA', EVT_X3_L02: 'CH_X3_ATLAS', EVT_X3_L03: 'CH_X3_COUNCIL' };
export const COOLDOWN = 2; // aynı kaptan son görüldüğü limandan en az 2 liman sonra
export const REL_MIN = -2;
export const REL_MAX = 2;

// ───────────────────────── Durum ─────────────────────────
const capBase = () => ({ rep: 0, seen: 0, lastPort: -99, owedFavor: false, offerOnce: false, rescueOnce: false, hostileCooldown: 0 });
export function initRunX3(run) {
  const x = run.x3 || {};
  const caps = {};
  for (const id of CAPTAIN_IDS) caps[id] = { ...capBase(), ...((x.captains || {})[id] || {}) };
  run.x3 = {
    legendSeg: -1, // Sonsuz Deniz: son efsanenin görüldüğü 4 limanlık dilim
    legendFound: [], // bu run'da tamamlanan efsaneler
    flags: {}, // run içi kanıt/ipucu bayrakları (armadaEvidence, atlasHint…)
    once: {}, // tek kullanımlık haklar (sternBrace, preCheck, prism, liaison, envoy, epilogue…)
    chainsDone: [],
    pendingCourier: null, // { due, tx }
    friendlyHelp: 0, // Konsey ittifak finali: sonraki seferde bir kez dost kaptan yardımı
    pursuit: null, // rakip takibi olayındaki kaptan
    tx: [],
    ...x,
    captains: caps,
  };
  run.x3.flags = { ...(x.flags || {}) };
  run.x3.once = { ...(x.once || {}) };
  run.x3.legendFound = [...(x.legendFound || [])];
  run.x3.chainsDone = [...(x.chainsDone || [])];
  run.x3.tx = [...(x.tx || [])];
  return run.x3;
}
export function initMetaX3(meta) {
  const x = meta.x3 || {};
  const hist = {};
  for (const id of CAPTAIN_IDS) hist[id] = { met: false, best: 0, worst: 0, endings: [], ...((x.captainHistory || {})[id] || {}) };
  meta.x3 = {
    legendDiscovered: { ...(x.legendDiscovered || {}) },
    chainFinals: { ...(x.chainFinals || {}) },
    subs: { ...(x.subs || {}) },
    outcomes: { ...(x.outcomes || {}) },
    captainHistory: hist,
    echoes: { ...(x.echoes || {}) },
    chronicle: { epilogue: 0, longestEndless: 0, ...(x.chronicle || {}) },
  };
  return meta.x3;
}
export const X = (run) => run.x3 || initRunX3(run);
export const M = (meta) => meta.x3 || initMetaX3(meta);

/** Aynı karar ikinci kez uygulanmaz (idempotency) */
export function once(run, txId) {
  const x = X(run);
  if (x.tx.includes(txId)) return false;
  x.tx.push(txId);
  if (x.tx.length > 300) x.tx.splice(0, x.tx.length - 300);
  return true;
}

// ───────────────────────── Kaptan ilişkileri ─────────────────────────
export const rel = (run, cap) => X(run).captains[cap]?.rep ?? 0;
export function relTone(v) { return v >= 1 ? 'friend' : v <= -1 ? 'rival' : 'neutral'; }
export const relName = (v) => ({ 2: 'Müttefik', 1: 'Dost', 0: 'Tarafsız', '-1': 'Gergin', '-2': 'Husumetli' })[v];
const harbors = (run) => run.stats?.harborsReached ?? run.idx ?? 0;

/**
 * İlişki değişimi. soft: yanlış anlaşılmadan doğan düşüş (Tayfa Elçisi bir kez önler; saldırı/hile değil).
 * Sonuç −2..+2 sınırında kalır.
 */
export function changeRel(G, cap, d, lines, { soft = false, deps = null } = {}) {
  const run = G.run;
  const c = X(run).captains[cap];
  if (!c || !d) return 0;
  if (d < 0 && soft && hasUpgrade(G.meta, 'UPG_X3_CREW_LIAISON') && !X(run).once.liaison) {
    X(run).once.liaison = true;
    lines?.push({ kind: 'info', text: `Tayfa Elçisi yanlış anlaşılmayı düzeltti: ${CAPTAINS[cap].name} ile ilişki bozulmadı.` });
    return 0;
  }
  const before = c.rep;
  c.rep = Math.max(REL_MIN, Math.min(REL_MAX, c.rep + d));
  const delta = c.rep - before;
  const h = M(G.meta).captainHistory[cap];
  h.met = true;
  h.best = Math.max(h.best, c.rep);
  h.worst = Math.min(h.worst, c.rep);
  if (delta) lines?.push({ kind: delta > 0 ? 'buff' : 'warn', text: `${CAPTAINS[cap].name} ile ilişki: ${relName(c.rep)} (${delta > 0 ? '+' : ''}${delta})` });
  else lines?.push({ kind: 'info', text: `${CAPTAINS[cap].name} ile ilişki zaten ${relName(c.rep).toLowerCase()} sınırında.` });
  if (CAPTAIN_IDS.filter((k) => X(run).captains[k].rep >= 2).length >= 2) deps?.unlockAchievement(G, 'ACH_X3_TWO_ALLIES');
  return delta;
}

/** Olayın içerdiği kaptanlar (ev.x3cap) — takip olayında run'daki takipçi */
export function capsOf(run, ev) {
  if (!ev) return [];
  if (ev.x3pursuit) return X(run).pursuit ? [X(run).pursuit] : [];
  return ev.x3cap || [];
}

// ───────────────────────── Havuz uygunluğu ─────────────────────────
/**
 * ev: aday olay; exclude: bu seferin kuyruğundaki olay kimlikleri; byId: olay sözlüğü.
 * - aynı kaptan bir seferde en fazla bir karşılaşma
 * - aynı kaptan son görüldüğü limandan sonra en az 2 liman bekler
 * - efsaneler: bu run'da tekrar yok; Sonsuz Deniz'de 4 limanlık dilimde en fazla bir; kuyrukta tek efsane
 */
export function eligible(G, ev, exclude, byId) {
  const run = G.run;
  const x = X(run);
  if (ev.x3cap) {
    for (const cap of ev.x3cap) {
      if (harbors(run) - x.captains[cap].lastPort < COOLDOWN) return false;
      for (const id of exclude) if (capsOf(run, byId[id]).includes(cap)) return false;
    }
  }
  if (ev.legend) {
    if (x.legendFound.includes(ev.id)) return false;
    for (const id of exclude) if (byId[id]?.legend) return false;
    if (X1.endlessOn(run) && Math.floor(harbors(run) / 4) === x.legendSeg) return false;
  }
  return true;
}
/** Efsaneler Sonsuz Deniz'de bölge yerine derinlikle açılır (L01 II+, L02/L03 III+) */
export function regionBypass(G, ev) {
  if (!ev.legend || !X1.endlessOn(G.run)) return false;
  return X1.depthOf(G.run) >= (ev.legend.minDepth || 2);
}
export function chainRegionOk(G, chain, region) {
  if (chain.regions.includes(region)) return true;
  return !!(chain.x3 && chain.minDepth && X1.endlessOn(G.run) && X1.depthOf(G.run) >= chain.minDepth);
}
/** Ağırlık: Sonsuz Deniz'de kaptan karşılaşmaları daha seyrek (1,5× görülmemiş ağırlığı X1'de) */
export function weightMult(G, ev) {
  return ev.x3cap && X1.endlessOn(G.run) ? 0.6 : 1;
}

/** Olay tetiklendiğinde: kaptanlar görüldü, efsane dilimi işaretlendi */
export function onTrigger(G, ev) {
  const run = G.run;
  const x = X(run);
  for (const cap of capsOf(run, ev)) {
    const c = x.captains[cap];
    c.seen += 1;
    c.lastPort = harbors(run);
    M(G.meta).captainHistory[cap].met = true;
  }
  if (ev.legend && X1.endlessOn(run)) x.legendSeg = Math.floor(harbors(run) / 4);
}

// ───────────────────────── Rakip takibi (ilişki −2) ─────────────────────────
/** İlişkisi −2 olan bir kaptan, bekleme süresi dolduysa %30 ihtimalle takibe çıkar (normal bir slotun yerine) */
export function pickPursuit(G, rng, queueIds, byId) {
  const run = G.run;
  const x = X(run);
  const cands = CAPTAIN_IDS.filter((k) => {
    const c = x.captains[k];
    if (c.rep > -2 || harbors(run) < c.hostileCooldown || harbors(run) - c.lastPort < COOLDOWN) return false;
    return !queueIds.some((id) => (byId[id]?.x3cap || []).includes(k));
  });
  if (!cands.length || !rng.chance(X1.endlessOn(run) ? 20 : 30)) return null;
  const cap = rng.pick(cands);
  x.pursuit = cap;
  x.captains[cap].hostileCooldown = harbors(run) + 3;
  return { id: 'EVT_X3_PURSUIT', src: 'x3pursuit', cap };
}

// ───────────────────────── Şans ve hasar ─────────────────────────
export function chanceMods(G, ev, o, add) {
  const run = G.run;
  const tags = o.tags || [];
  const etags = ev.tags || [];
  const meta = G.meta;
  if (hasUpgrade(meta, 'UPG_X3_SOUNDINGS') && (tags.includes('sound') || etags.includes('shallows') || etags.includes('pillars') || etags.includes('depth')) && !tags.includes('pass')) add('İskandil Takımı', 10);
  if (hasUpgrade(meta, 'UPG_X3_CAPTAIN_PARLEY') && tags.includes('parley')) add('Kaptanlar Masası', 10);
  if (hasUpgrade(meta, 'UPG_X3_RESCUE_WALKWAY') && (tags.includes('rescue') || tags.includes('bridge'))) {
    const tow = tags.includes('tow') && hasUpgrade(meta, 'UPG_X2_TOW_HOOK');
    const lift = tags.includes('lift') && hasUpgrade(meta, 'UPG_X2_DECK_CRANE');
    if (!tow && !lift) add('Kurtarma İskelesi', 10);
  }
  // Gergin ilişki (−1 ve altı): o kaptanın olayındaki riskli seçimlere −5
  for (const b of o.bonus || []) if (b.x3flag && X(run).flags[b.x3flag]) add(b.label || 'Önceki keşif', b.add);
  const caps = capsOf(run, ev);
  if (caps.some((k) => rel(run, k) <= -1) && !tags.includes('pass')) add('Gergin ilişki', -5);
  if (caps.length && caps.every((k) => rel(run, k) >= 1) && tags.includes('parley')) add('Eski tanışıklık', 5);
}

export function damageMods(G, d, ev, opt, notes) {
  const x = X(G.run);
  const tags = [...(ev.tags || []), ...((opt && opt.tags) || [])];
  if (d > 0 && hasUpgrade(G.meta, 'UPG_X3_STERN_BRACE') && !x.once.sternBrace && (tags.includes('collision') || tags.includes('keel'))) {
    x.once.sternBrace = true;
    notes.push('Kıç Destek Kirişi −12');
    d = Math.max(0, d - 12);
  }
  if (d > 0 && x.once.preCheck === 'armed') {
    x.once.preCheck = 'used';
    notes.push('Gövde altı kontrolü −8');
    d = Math.max(0, d - 8);
  }
  return d;
}

// ───────────────────────── Enjekte seçenekler ─────────────────────────
export function injectedOptions(G, ev) {
  const run = G.run;
  const x = X(run);
  const list = [];
  const caps = ev.chain || ev.x3pursuit ? [] : capsOf(run, ev);
  for (const k of caps) {
    const c = x.captains[k];
    const n = CAPTAINS[k].name;
    if (c.rep >= 2 && !c.offerOnce) {
      list.push({ key: `__x3ally_${k}`, injected: true, opt: { label: `${n} ile işbirliği`, icon: 'hand', tags: ['pass'], hint: `${n} müttefikin: run başına bir kez güvenli ortak çözüm`,
        win: { text: `${n} sana işaret verdi; iki gemi birlikte hareket etti ve sorun kimse zarar görmeden çözüldü. ${n} kısa bir selamla yoluna devam etti.`, fx: { xp: 10, gold: 30, x3: { capOnce: k } } } } });
    } else if (c.rep >= 1) {
      list.push({ key: `__x3talk_${k}`, injected: true, opt: { label: `${n} ile eski günleri an`, icon: 'talk', chance: 80, tags: ['parley'], hint: `${n} ile dostluğun ek bir konuşma açıyor`,
        win: { text: `${n} güldü: "Seninle tartışmak bile keyifli." Konuşma iki tarafa da iyi geldi.`, fx: { xp: 10, x3: { rel: { [k]: 1 } } } },
        lose: { text: `${n} bugün sohbet havasında değildi; yine de nazikçe ayrıldınız.`, fx: { xp: 5 } } } });
    }
  }
  // Konsey ittifakı: sonraki seferde bir kez dost kaptan yardımı (tehlike olaylarında)
  if (x.friendlyHelp > 0 && (ev.cat === 'danger' || ev.cat === 'disaster') && !ev.x3pursuit) {
    list.push({ key: '__x3help', injected: true, opt: { label: 'Dost kaptanları çağır', icon: 'flag', tags: ['pass'], hint: 'Konsey ittifakı: bir kez dost kaptan yardımı',
      win: { text: `İşaret fişeği yükseldi. Ufukta turkuaz, koyu kırmızı ve bakır çizgili yelkenler belirdi; tehlike onları görünce dağıldı.`, fx: { xp: 5, x3: { useHelp: true } } } } });
  }
  // İşaret Prizması: efsanevi / çok gemili işaret olaylarında run başına bir kez
  if (ev.prism && hasUpgrade(G.meta, 'UPG_X3_SIGNAL_PRISM') && !x.once.prism) {
    list.push({ key: '__prism', injected: true, opt: { label: 'İşaret prizmasıyla konuş', icon: 'lantern', tags: ['pass'], hint: 'İşaret Prizması: run başına bir kez güvenli işaret',
      win: { text: ev.prism.text, fx: { ...(ev.prism.fx || {}), x3: { ...(ev.prism.fx?.x3 || {}), useOnce: 'prism' } } } } });
  }
  return list;
}

// ───────────────────────── Gereksinimler ─────────────────────────
/** req.x3: { relAtLeast:{n,min}, orFlag, anyFlag:[], cap:'boran' (tanışıklık) } */
export function reqReasons(G, r, flags, reasons) {
  if (!r) return;
  const run = G.run;
  if (r.relAtLeast) {
    const n = CAPTAIN_IDS.filter((k) => rel(run, k) >= r.relAtLeast.min).length;
    const alt = r.orFlag && (flags[r.orFlag] || X(run).flags[r.orFlag]);
    if (n < r.relAtLeast.n && !alt) reasons.push(`En az ${r.relAtLeast.n} kaptanla dostluk ya da kanıt gerekli (${n}/${r.relAtLeast.n})`);
  }
  if (r.anyFlag && !r.anyFlag.some((f) => flags[f] || X(run).flags[f])) reasons.push('Gerekli kanıt yok');
  if (r.minFlags && r.minFlags.of.filter((f) => flags[f]).length < r.minFlags.n) reasons.push(`En az ${r.minFlags.n} kanıt gerekli (${r.minFlags.of.filter((f) => flags[f]).length}/${r.minFlags.n})`);
  if (r.capSeen && !X(run).captains[r.capSeen].seen) reasons.push(`${CAPTAINS[r.capSeen].name} ile henüz tanışmadın`);
  const hasIt = (id) => run.items.some((i) => i.id === id);
  const hasGood = (g) => run.cargo.some((l) => l.good === g && l.qty > 0 && !l.contract);
  if (r.repOr) {
    const ok = X1.rep(run, r.repOr.faction) >= r.repOr.min || (r.repOr.items || []).some(hasIt);
    if (!ok) reasons.push('Muhafız itibarı +2 ya da tüccar mührü gerekli');
  }
  if (r.anyOf) {
    const a = r.anyOf;
    const ok = (a.items || []).some(hasIt) || (a.goods || []).some(hasGood) || (a.upgrades || []).some((u) => hasUpgrade(G.meta, u));
    if (!ok) reasons.push('Gerekli eşya yok');
  }
}
/** when.x3: { capSeen, relMin:{cap,v}, flag, noFlag } */
export function checkWhen(G, w) {
  const run = G.run;
  if (w.capSeen && !X(run).captains[w.capSeen].seen) return false;
  if (w.relMin && rel(run, w.relMin.cap) < w.relMin.v) return false;
  if (w.flag && !X(run).flags[w.flag]) return false;
  if (w.noFlag && X(run).flags[w.noFlag]) return false;
  return true;
}

// ───────────────────────── Codex ─────────────────────────
export function recordOutcome(G, evId, key, success) {
  const m = M(G.meta);
  const o = (m.outcomes[evId] = m.outcomes[evId] || {});
  o[`${key}|${success ? 'w' : 'l'}`] = true;
}
export function recordFinal(G, chain, id, sub = null) {
  const m = M(G.meta);
  const f = (m.chainFinals[chain] = m.chainFinals[chain] || []);
  if (!f.includes(id)) f.push(id);
  if (sub) { const k = `${chain}:${id}`; const s = (m.subs[k] = m.subs[k] || []); if (!s.includes(sub)) s.push(sub); }
}

// ───────────────────────── fx.x3 ─────────────────────────
/**
 * fx.x3: { rel:{cap|all|best:n}, relSoft:{cap:n}, relIfKnown:{cap:n}, flag:{k:v}, final:{chain,id,sub}, chainDone,
 *          ach, useOnce, capOnce, useHelp, courier, preCheck, envoy, friendlyHelp, routeBonus }
 * full: olayın fx'i (Elçi Sandığı için altın miktarı)
 */
export function applyX3(G, fx, ctx, lines, deps, full = {}) {
  const run = G.run;
  const x = X(run);
  const tx = `${ctx.ev.id}|${ctx.opt?.label ?? ''}|${run.idx}|${run.voyage?.fromIdx ?? ''}|${ctx.host?.pos ?? ''}`;
  if (!once(run, tx)) return; // aynı karar iki kez işlenmez
  const relMap = (m, opts) => {
    for (const [k, d] of Object.entries(m)) {
      if (k === 'all') CAPTAIN_IDS.forEach((c) => changeRel(G, c, d, lines, { ...opts, deps }));
      else if (k === 'best') {
        const c = CAPTAIN_IDS.slice().sort((a, b) => rel(run, b) - rel(run, a))[0];
        changeRel(G, c, d, lines, { ...opts, deps });
      } else if (k === 'pursuit') { if (x.pursuit) changeRel(G, x.pursuit, d, lines, { ...opts, deps }); }
      else changeRel(G, k, d, lines, { ...opts, deps });
    }
  };
  if (fx.rel) relMap(fx.rel, {});
  if (fx.relSoft) relMap(fx.relSoft, { soft: true });
  if (fx.relIfKnown) for (const [k, d] of Object.entries(fx.relIfKnown)) if (x.captains[k].seen) changeRel(G, k, d, lines, { deps });
  if (fx.flag) Object.assign(x.flags, fx.flag);
  if (fx.useOnce) x.once[fx.useOnce] = true;
  if (fx.tradeMap) {
    // eski harita takası: önce antika malı, yoksa harita itemi verilir
    const lot = run.cargo.find((l) => l.good === 'GOOD_ANTIQUE' && l.qty > 0 && !l.contract);
    if (lot) { lot.qty -= 1; run.cargo = run.cargo.filter((l) => l.qty > 0); lines.push({ kind: 'cargo', text: '1 Antika takas edildi' }); }
    else {
      const ix = run.items.findIndex((i) => i.id === 'ITEM_ANCIENT_MAP' || i.id === 'ITEM_SEA_CHART');
      if (ix >= 0) { run.items.splice(ix, 1); lines.push({ kind: 'item', text: 'Eski harita takas edildi' }); }
    }
  }
  if (fx.capOnce) x.captains[fx.capOnce].offerOnce = true;
  if (fx.useHelp) x.friendlyHelp = Math.max(0, x.friendlyHelp - 1);
  if (fx.friendlyHelp) { x.friendlyHelp = 1; x.friendlyHelpArmed = false; lines.push({ kind: 'buff', text: 'Sonraki seferde bir kez dost kaptanları yardıma çağırabilirsin.' }); }
  if (fx.courier && !x.pendingCourier) { x.pendingCourier = { due: harbors(run) + 1, tx }; lines.push({ kind: 'route', text: 'Mektup sende: bir sonraki limanda teslim edince 70 altın.' }); }
  if (fx.preCheck && !x.once.preCheck) { x.once.preCheck = 'armed'; lines.push({ kind: 'buff', text: 'Gövde altı kontrol edildi: bir sonraki gövde hasarı 8 azalacak.' }); }
  if (fx.envoy && ctx.success && hasUpgrade(G.meta, 'UPG_X3_ENVOY_CHEST') && !x.once.envoy) {
    const base = (full.gold || 0) + (full.goldR || 0);
    const b = Math.min(40, Math.round(base * 0.2));
    if (b > 0) { x.once.envoy = true; run.gold += b; run.stats.goldEarned += b; lines.push({ kind: 'gold', text: `Elçi Sandığı: +${b} altın` }); }
  }
  if (fx.final) {
    recordFinal(G, fx.final.chain, fx.final.id, fx.final.sub || null);
    lines.push({ kind: 'chain', text: 'Hikâyenin sonu Denizci Kroniği\'ne yazıldı.' });
    const m = M(G.meta);
    if (X3_CHAIN_IDS.every((c) => (m.chainFinals[c] || []).length)) deps.unlockAchievement(G, 'ACH_X3_CHRONICLER');
    if (fx.final.chain === 'CH_X3_COUNCIL') for (const c of CAPTAIN_IDS) { const h = m.captainHistory[c]; if (!h.endings.includes(fx.final.id)) h.endings.push(fx.final.id); }
  }
  if (fx.chainDone && !x.chainsDone.includes(fx.chainDone)) { x.chainsDone.push(fx.chainDone); maybeEpilogue(G); }
  if (fx.ach) deps.unlockAchievement(G, fx.ach);
}

/** Olay çözümünden sonra: efsane ilk keşfi, başarım, Efsane Bekçisi */
export function afterResolve(G, ev, lines, deps) {
  if (!ev.legend) return;
  const run = G.run;
  const x = X(run);
  const m = M(G.meta);
  if (!x.legendFound.includes(ev.id)) x.legendFound.push(ev.id);
  const first = !m.legendDiscovered[ev.id];
  if (first) {
    m.legendDiscovered[ev.id] = true;
    lines.push({ kind: 'codex', text: 'İlk keşif! Efsane Denizci Kroniği\'ne yazıldı.' });
    const got = deps.addXp(G, 10, 'discovery');
    lines.push({ kind: 'xp', text: `İlk keşif: +${got} XP` });
    if (hasUpgrade(G.meta, 'UPG_X3_LEGEND_KEEPER')) {
      const g2 = deps.addXp(G, 15, 'discovery');
      lines.push({ kind: 'xp', text: `Efsane Bekçisi: +${g2} XP` });
      X2.applyX2(G, { hint: { chain: LEGEND_HINT[ev.id], mult: 2 } }, { ev, host: null }, lines, deps);
      lines.push({ kind: 'chain', text: 'Efsane Bekçisi bir hikâyenin izini buldu.' });
    }
  }
  deps.unlockAchievement(G, LEGEND_ACH[ev.id]);
  maybeEpilogue(G);
}

/** "Denizcilerin Mirası" epiloğu: üç efsane keşfedilmiş + bu run'da en az iki yeni hikâye bitmiş → sonraki güvenli limanda kısa kutlama */
function maybeEpilogue(G) {
  const run = G.run;
  const x = X(run);
  const m = M(G.meta);
  if (x.once.epilogue) return;
  if (LEGENDS.every((id) => m.legendDiscovered[id]) && x.chainsDone.length >= 2) {
    x.once.epilogue = 'queued';
    run.pendingArrival.push({ id: 'EVT_X3_EPILOGUE', src: 'special' });
  }
}

/** Limana varış: mektup teslimi, Otuz İki Liman, en uzun Sonsuz Deniz kaydı */
export function onArrival(G, lines, deps) {
  const run = G.run;
  const x = X(run);
  const m = M(G.meta);
  if (x.pendingCourier && harbors(run) >= x.pendingCourier.due) {
    x.pendingCourier = null;
    run.gold += 70;
    run.stats.goldEarned += 70;
    const got = deps.addXp(G, 10, 'events');
    lines.push({ kind: 'gold', text: `Mektup teslim edildi: +70 altın, +${got} XP` });
  }
  const extra = run.x1?.endless?.on ? run.x1.endless.extra || 0 : 0;
  if (extra > m.chronicle.longestEndless) m.chronicle.longestEndless = extra;
  if (extra >= 32) deps.unlockAchievement(G, 'ACH_X3_THIRTY_TWO');
  if (x.friendlyHelp > 0 && x.friendlyHelpArmed) x.friendlyHelp = 0; // yalnızca bir sonraki sefer
  if (x.friendlyHelp > 0) x.friendlyHelpArmed = true;
}
