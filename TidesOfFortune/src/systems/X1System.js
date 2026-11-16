// YAŞAYAN DENİZLER & SONSUZ DENİZ (genişleme X1).
// Sonsuz Deniz, Deniz Derinliği, Deniz Koşulları, kilometre taşları, rekorlar, kozmetikler, fraksiyon itibarı,
// liman sözleşmeleri, Dünya Hafızası, Denizci Günlüğü ve yeni kalıcı yükseltmelerin kural tarafı burada.
// Mevcut sistemlere yalnızca küçük kancalarla bağlanır; tüm yeni alanlar run.x1 / meta.x1 altında durur.
import { BALANCE } from '../config/balance.js';
import { HARBORS, HARBOR_BY_ID, GRAND_HARBOR_ID } from '../data/harbors.js';
import { GOOD_BY_ID, TRADE_GOODS } from '../data/goods.js';
import { SeededRNG } from '../core/SeededRNG.js';
import * as X2 from './X2System.js';
import { hasUpgrade } from '../core/GameState.js';

// ───────────────────────── Sabitler ─────────────────────────
export const DEPTHS = [
  null,
  { id: 1, name: 'I — Açık Deniz', dmg: 1.0, pen: 0, gold: 0 },
  { id: 2, name: 'II — Tehlikeli Akıntılar', dmg: 1.12, pen: 3, gold: 0.05 },
  { id: 3, name: 'III — Karanlık Sular', dmg: 1.25, pen: 6, gold: 0.1 },
  { id: 4, name: 'IV — Unutulmuş Denizler', dmg: 1.4, pen: 9, gold: 0.15 },
  { id: 5, name: 'V — Sonsuz Ufuk', dmg: 1.55, pen: 12, gold: 0.2 },
];
/** DENGE: V'ten sonra deniz durmadan sertleşir (her 4 ek limanda bir "Uçurum" kademesi) */
export const ABYSS = { dmg: 0.18, pen: 3, cap: 2 }; // Paket 2: V sonrası büyüme en fazla 2 kademe (hasar ≤ ×1,91, risk ≤ −18, onarım ≤ ×1,7)
/** DENGE: Sonsuz Deniz'de büyük gemiler daha büyük tehditleri çeker (seviye 3 üstü her seviye +%10 hasar) */
export const SHIP_THREAT = 0.1;
/** DENGE: Sonsuz Deniz'de tersane ve onarım ekonomisi */
export const ENDLESS_ECON = { upgradeMult: 1.5, repairPerStage: 0.1 };

export const CONDITIONS = {
  fog: { id: 'fog', name: 'Sis Çağı', desc: 'Sis yoğun; gizemli karşılaşmalar artar, rota bilgisi bulanıklaşır.', w: { mystery: 5 }, tags: { fog: 1.6 }, intelPenalty: 15 },
  pirates: { id: 'pirates', name: 'Korsanların Yükselişi', desc: 'Korsan gemileri her yerde; tehlike de fırsat da büyür.', w: { danger: 5 }, tags: { pirate: 1.8 } },
  storms: { id: 'storms', name: 'Büyük Fırtınalar', desc: 'Fırtınalar ve doğal felaketler artar; onarım fırsatları önem kazanır.', w: { disaster: 3, repair: 3 }, tags: { storm: 1.6, wave: 1.6 } },
  trade: { id: 'trade', name: 'Ticaretin Altın Çağı', desc: 'Konvoylar, müzayedeler ve yüzer pazarlar sık görülür.', w: { fortune: 5 }, tags: { trade: 1.8 }, sellBonus: 0.05 },
  forgotten: { id: 'forgotten', name: 'Unutulmuş Sular', desc: 'Gizemler ve nadir keşifler öne çıkar.', w: { mystery: 6 }, tags: { deep: 1.5 }, rareMystery: 1.5 },
};

export const MILESTONES = [
  { at: 4, name: 'Açık Deniz Yolcusu', xp: 30 },
  { at: 8, name: 'Tehlikeli Suların Kaptanı', xp: 45 },
  { at: 12, name: 'Karanlığın Denizcisi', xp: 60 },
  { at: 16, name: 'Unutulmuş Denizlerin Fatihi', xp: 75 },
  { at: 20, name: 'Sonsuz Ufuk Kaptanı', xp: 90 },
];

export const FACTIONS = {
  guild: { id: 'guild', name: 'Altın Pusula Loncası', short: 'Lonca', color: '#e0b040', flag: '#e0b040', icon: 'compass' },
  crown: { id: 'crown', name: 'Kraliyet Deniz Muhafızları', short: 'Muhafızlar', color: '#3b6ea5', flag: '#24426b', icon: 'crown' },
  red: { id: 'red', name: 'Kızıl Yelken Kardeşliği', short: 'Kızıl Yelken', color: '#c8423b', flag: '#8e2a2a', icon: 'flag' },
};
export const REP_NAMES = { '-3': 'Aranan Düşman', '-2': 'Düşman', '-1': 'Güvenilmeyen', 0: 'Tarafsız', 1: 'Tanınan', 2: 'Dost', 3: 'Müttefik' };

/** Sözleşme türleri. dest: teslim edilebilecek liman tipleri. cargo: kullanılan görev kargosu. */
export const CONTRACTS = {
  CONTRACT_X1_SPICE: { id: 'CONTRACT_X1_SPICE', name: 'Mühürlü Baharat Kasası', faction: 'guild', icon: 'crate', cargo: 'GOOD_X1_SEALED_SPICE', arrivals: 3, dest: ['trade', 'military'], gold: [100, 160], xp: 15, desc: 'Lonca mühürlü baharat kasasını bir ticaret veya askerî limana ulaştır.' },
  CONTRACT_X1_ESCORT: { id: 'CONTRACT_X1_ESCORT', name: 'Kraliyet Konvoyuna Eşlik', faction: 'crown', icon: 'shield', cargo: null, arrivals: 1, escort: true, dest: null, gold: [100, 180], xp: 15, desc: 'Bir yolculuk boyunca küçük bir kraliyet nakliye gemisine eşlik et.' },
  CONTRACT_X1_SALVAGE: { id: 'CONTRACT_X1_SALVAGE', name: 'Batıktaki Kayıp Kayıtlar', faction: 'guild', icon: 'dive', cargo: null, arrivals: 3, salvage: true, dest: ['trade', 'military', 'fishing'], gold: [80, 140], xp: 20, desc: 'Denizde batan lonca gemisinin kayıt sandığını bul ve bir limana getir.' },
  CONTRACT_X1_RELIEF: { id: 'CONTRACT_X1_RELIEF', name: 'Salgın Adasına Yardım', faction: 'crown', icon: 'heart', cargo: 'GOOD_X1_RELIEF', arrivals: 2, dest: ['fishing', 'mystery', 'fog'], gold: [80, 130], xp: 25, desc: 'Yardım sandığını salgınla boğuşan bir balıkçı, sisli ya da ada limanına götür.' },
  CONTRACT_X1_SMUGGLE: { id: 'CONTRACT_X1_SMUGGLE', name: 'Kara Yelkenin Gizli Yükü', faction: 'red', icon: 'hold', cargo: 'GOOD_X1_BLACK_CARGO', arrivals: 3, dest: ['pirate', 'fog'], gold: [160, 250], xp: 15, desc: 'Kaçak sandığı bir korsan ya da sisli limana ulaştır. Denetimlere dikkat.' },
  CONTRACT_X1_LETTER: { id: 'CONTRACT_X1_LETTER', name: 'Kayıp Seyyahın Mektubu', faction: null, icon: 'scroll', cargo: null, arrivals: 3, dest: ['trade', 'military', 'fishing'], gold: [60, 100], xp: 10, letter: true, desc: 'Mektubu bir ticaret, askerî ya da balıkçı limanındaki temsilciye teslim et. Kargo yeri kaplamaz.' },
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ───────────────────────── Durum ─────────────────────────
export function initRunX1(run) {
  const base = {
    rep: { guild: 0, crown: 0, red: 0 },
    contracts: [], contractSeq: 1, contractsDone: 0, contractEncounterVoyage: -1,
    mem: { flags: {} },
    once: {},
    tx: [],
    endless: { on: false, normalDone: false, startIdx: null, extra: 0, cond: null, condSeg: -1, condHist: [], recent: [], milestones: [], score: 0, visits: {} },
    escort: null,
    celebrate: null,
    echoesShown: [],
    x1ChainsDone: 0,
    mysteryHinted: false,
  };
  const x = run.x1 || {};
  run.x1 = { ...base, ...x, rep: { ...base.rep, ...(x.rep || {}) }, mem: { ...base.mem, ...(x.mem || {}) }, endless: { ...base.endless, ...(x.endless || {}) } };
  // eski korsan itibarı (pirateRep) yeni Kızıl Yelken itibarına bir kez taşınır
  if (run.pirateRep && !run.x1.repMigrated) run.x1.rep.red = clamp(Math.max(run.x1.rep.red, run.pirateRep), -3, 3);
  run.x1.repMigrated = true;
  return run.x1;
}

export function initMetaX1(meta) {
  const base = {
    outcomes: {}, finals: {}, echoes: {}, contractTypes: {}, cosmetics: { flag: false, stern: false }, mysteryChains: {},
    records: { longestHarbors: 0, bestScore: 0, maxExtra: 0, maxDepth: 0, mostContracts: 0, bestProfit: 0, mostChains: 0, endlessSafe: 0, endlessSunk: 0 },
  };
  const x = meta.x1 || {};
  meta.x1 = { ...base, ...x, records: { ...base.records, ...(x.records || {}) }, cosmetics: { ...base.cosmetics, ...(x.cosmetics || {}) } };
  return meta.x1;
}

export const X = (run) => run.x1 || initRunX1(run);

/** İşlem kimliği: aynı sonuç iki kez uygulanmaz (idempotency). true → ilk kez. */
export function once(run, txId) {
  const x = X(run);
  if (x.tx.includes(txId)) return false;
  x.tx.push(txId);
  if (x.tx.length > 400) x.tx.splice(0, x.tx.length - 400);
  return true;
}

// ───────────────────────── Fraksiyonlar ─────────────────────────
export function rep(run, f) { return X(run).rep[f] || 0; }
export function addRep(G, f, d, lines = null) {
  const x = X(G.run);
  const before = x.rep[f] || 0;
  x.rep[f] = clamp(before + d, -3, 3);
  if (f === 'red') G.run.pirateRep = Math.max(0, x.rep.red); // eski gösterim alanı ile uyum
  const delta = x.rep[f] - before;
  if (delta && lines) lines.push({ kind: 'status', text: `${FACTIONS[f].name}: ${delta > 0 ? '+' : ''}${delta} itibar (${REP_NAMES[x.rep[f]]})` });
  return delta;
}

/** Ticaret çarpanları (tek kaynak: çift uygulama yok) */
export function sellMult(G, harbor, good) {
  let m = 1;
  if (rep(G.run, 'guild') >= 2 && good && good.group !== 'special') m *= 1.03;
  const c = endlessCond(G.run);
  if (c && CONDITIONS[c].sellBonus) m *= 1 + CONDITIONS[c].sellBonus;
  return m;
}
export function pirateHarborMult(G) {
  const r = rep(G.run, 'red');
  return r >= 2 ? 1.15 : r >= 1 ? 1.1 : 1;
}

// ───────────────────────── Sonsuz Deniz ─────────────────────────
export const endlessOn = (run) => !!run?.x1?.endless?.on;
export function isFinalStop(run, harbor) { return !!harbor.final && !endlessOn(run); }
export function depthOf(run) {
  const e = run?.x1?.endless;
  if (!e || !e.on || e.extra < 1) return 0;
  return Math.min(5, 1 + Math.floor((e.extra - 1) / 4));
}
export function endlessCond(run) { return endlessOn(run) ? run.x1.endless.cond : null; }
/** V'i aşan kademe sayısı (V+1, V+2…) */
export function abyssOf(run) {
  const e = run?.x1?.endless;
  if (!e || !e.on || e.extra < 1) return 0;
  return Math.min(ABYSS.cap, Math.max(0, Math.floor((e.extra - 1) / 4) - 4));
}
export function depthLabel(run) { const d = depthOf(run); const a = abyssOf(run); return d ? DEPTHS[d].name + (a ? ` +${a}` : '') : ''; }
export function damageMult(run) {
  const d = depthOf(run);
  if (!d) return 1;
  const threat = 1 + Math.max(0, (run.ship?.level || 1) - 3) * SHIP_THREAT;
  return (DEPTHS[d].dmg + abyssOf(run) * ABYSS.dmg) * threat;
}
export function riskPenalty(run) { const d = depthOf(run); return d ? DEPTHS[d].pen + abyssOf(run) * ABYSS.pen : 0; }
/** Sonsuz Deniz'de onarım ve gemi yükseltme maliyet çarpanları */
export function repairCostMult(run) { return endlessOn(run) ? 1 + (depthOf(run) + abyssOf(run)) * ENDLESS_ECON.repairPerStage : 1; }
export function upgradeCostMult(run) { return endlessOn(run) ? ENDLESS_ECON.upgradeMult : 1; }
export function goldBonus(run) { const d = depthOf(run); return d ? DEPTHS[d].gold : 0; }

/** Büyük Liman'da "Sonsuz Denize Açıl": normal başarı ödülü bir kez verilir, run kapanmaz. */
export function enterEndless(G, addXp, unlockAchievement, generateLanes) {
  const run = G.run;
  const x = X(run);
  if (x.endless.on) return { ok: false, reason: 'Zaten Sonsuz Deniz\'desin.' };
  const harbor = HARBOR_BY_ID[run.visit?.harborId];
  if (!harbor?.final) return { ok: false, reason: 'Sonsuz Deniz\'e yalnızca Büyük Liman\'dan açılabilirsin.' };
  const lines = [];
  if (!x.endless.normalDone) {
    x.endless.normalDone = true;
    const got = addXp(G, BALANCE.xp.runComplete, 'complete');
    unlockAchievement(G, 'ACH_GRAND_HARBOR');
    G.meta.stats.completed += 1;
    lines.push({ kind: 'xp', text: `Büyük Liman başarısı: +${got} XP (bir kez)` });
  }
  x.endless.on = true;
  x.endless.startIdx = run.idx;
  x.endless.extra = 0;
  pushRecent(run, harbor.id);
  pickCondition(run, 0);
  run.visit.lanes = generateLanes(G, run.idx);
  return { ok: true, lines };
}

function pushRecent(run, id) {
  const e = X(run).endless;
  e.recent = e.recent.filter((h) => h !== id);
  e.recent.push(id);
  if (e.recent.length > 6) e.recent.splice(0, e.recent.length - 6);
}

/** Her dört ek limanlık bölümde bir Deniz Koşulu (seed tabanlı, art arda tekrar etmez) */
function pickCondition(run, seg) {
  const e = X(run).endless;
  if (e.condSeg === seg && e.cond) return e.cond;
  const rng = SeededRNG.derive(run.seed, 'x1cond', seg);
  const ids = Object.keys(CONDITIONS).filter((c) => c !== e.cond);
  e.cond = rng.pick(ids);
  e.condSeg = seg;
  e.condHist.push(e.cond);
  if (e.condHist.length > 12) e.condHist.splice(0, e.condHist.length - 12);
  return e.cond;
}

/** Sonsuz Deniz'de limana varış: ek liman sayacı, derinlik, koşul, kilometre taşı */
export function onEndlessArrival(G, harborId, addXp, unlockAchievement) {
  const run = G.run;
  const e = X(run).endless;
  if (!e.on) return [];
  const lines = [];
  e.extra = run.idx - e.startIdx;
  pushRecent(run, harborId);
  e.visits[harborId] = (e.visits[harborId] || 0) + 1;
  const seg = Math.floor((e.extra - 1) / 4);
  if (e.extra >= 1 && seg !== e.condSeg) {
    const prev = e.cond;
    const c = pickCondition(run, seg);
    if (c !== prev) lines.push({ kind: 'route', text: `Deniz Koşulu: ${CONDITIONS[c].name}. ${CONDITIONS[c].desc}` });
  }
  if (e.extra > 0 && e.extra % 4 === 0 && !e.milestones.includes(e.extra)) {
    e.milestones.push(e.extra);
    const ms = MILESTONES.find((m) => m.at === e.extra) || { at: e.extra, name: 'Sonsuz Ufuk Ustalığı', xp: 90 };
    const got = addXp(G, ms.xp, 'other');
    lines.push({ kind: 'xp', text: `Kilometre taşı: ${ms.name} (+${got} XP)` });
    X(run).celebrate = { name: ms.name, xp: got, at: e.extra };
  }
  const achAt = { 4: 'ACH_X1_BEYOND', 8: 'ACH_X1_KNOWN', 16: 'ACH_X1_NORETURN', 24: 'ACH_X1_LEGEND' };
  if (achAt[e.extra]) unlockAchievement(G, achAt[e.extra]);
  const cos = G.meta.x1.cosmetics;
  if (e.extra >= 12 && !cos.flag) { cos.flag = true; lines.push({ kind: 'info', text: 'Kozmetik açıldı: Özel kaptan bayrağı!' }); }
  if (e.extra >= 20 && !cos.stern) { cos.stern = true; lines.push({ kind: 'info', text: 'Kozmetik açıldı: Dekoratif kıç süsü!' }); }
  const d = depthOf(run);
  G.meta.x1.records.maxExtra = Math.max(G.meta.x1.records.maxExtra, e.extra);
  G.meta.x1.records.maxDepth = Math.max(G.meta.x1.records.maxDepth, d);
  G.meta.x1.records.maxAbyss = Math.max(G.meta.x1.records.maxAbyss || 0, abyssOf(run));
  e.score = endlessScore(run);
  return lines;
}

export function endlessScore(run, safe = false) {
  const x = X(run);
  const e = x.endless;
  if (!e.on) return 0;
  const profit = Math.max(0, run.stats.profit || 0);
  let s = e.extra * 100 + x.contractsDone * 100 + x.x1ChainsDone * 200 + Math.min(Math.round(profit / 10), (e.extra + 1) * 50);
  if (safe) s = Math.round(s * 1.15);
  return s;
}

/** Sonsuz Deniz rotası: 45 liman tükenmez, son 6 ziyaret edilen liman hariç, bölgeler 1–5 arası serbest */
export function endlessLanes(G, idx, ctx) {
  const { pickHarborFrom, LANE_TYPES, intelAccuracy, harborRelativeSell, harborUnlocked } = ctx;
  const run = G.run;
  const e = X(run).endless;
  const rng = SeededRNG.derive(run.seed, 'x1lanes', idx);
  const used = new Set(e.recent);
  const acc = intelAccuracy(G);
  const lanes = [];
  const typeIds = rng.sample(Object.keys(LANE_TYPES), rng.int(2, 3));
  const depth = Math.max(1, Math.min(5, 1 + Math.floor(e.extra / 4)));
  for (const lt of typeIds) {
    const L = LANE_TYPES[lt];
    const region = clamp(Math.round(rng.weighted([1, 2, 3, 4, 5].map((r) => ({ r, weight: r === depth ? 3 : Math.abs(r - depth) === 1 ? 2 : 1 }))).r + L.regionShift * rng.next()), 1, 5);
    let pool = HARBORS.filter((h) => !used.has(h.id) && harborUnlocked(G.meta, h) && Math.abs(h.region - region) <= 1);
    if (L.prefer && rng.chance(60)) { const p = pool.filter((h) => L.prefer.includes(h.type)); if (p.length) pool = p; }
    if (!pool.length) pool = HARBORS.filter((h) => !used.has(h.id) && harborUnlocked(G.meta, h));
    const harbor = pickHarborFrom(rng, pool);
    if (!harbor) continue;
    used.add(harbor.id);
    const distance = rng.weighted(Object.entries(L.dist).map(([id, w]) => ({ id, weight: w }))).id;
    const danger = clamp(Math.round(harbor.region * 0.8 + L.danger + (harbor.type === 'pirate' ? 1 : 0) + (distance === 'long' ? 0.5 : 0) + depthOf(run) * 0.3), 1, 5);
    const pirates = clamp((L.pirates ? 2 : 0) + (harbor.type === 'pirate' ? 1 : 0) + (harbor.region >= 3 ? 1 : 0) + (endlessCond(run) === 'pirates' ? 1 : 0) - (L.danger < 0 ? 1 : 0), 0, 3);
    const typeAcc = (L.uncertain ? acc.type - 25 : acc.type) - (endlessCond(run) === 'fog' ? CONDITIONS.fog.intelPenalty : 0);
    const typeTrue = rng.chance(typeAcc);
    const plausible = [...new Set(HARBORS.filter((h) => Math.abs(h.region - harbor.region) <= 1 && harborUnlocked(G.meta, h)).map((h) => h.type))].filter((t) => t !== harbor.type && t !== undefined);
    const hType = harbor.final ? 'trade' : harbor.type;
    const hintType = typeTrue || !plausible.length ? hType : rng.pick(plausible);
    const scored = TRADE_GOODS.filter((g) => g.group !== 'special').map((g) => ({ g, m: harborRelativeSell(run.seed, harbor, g.id) })).sort((a, b) => b.m - a.m);
    const rumors = [];
    const n = 1 + (rng.chance(40 + (L.rumorBoost || 0)) ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const truthful = rng.chance(acc.trade - (L.uncertain ? 20 : 0));
      rumors.push({ good: (truthful ? scored[k].g : rng.pick(scored.slice(6)).g).id, truthful });
    }
    lanes.push({ type: lt, harborId: harbor.id, distance, danger, pirates, region: harbor.region, hintType, typeTrue, rumors, uncertainty: L.uncertain ? 3 : typeAcc >= 95 ? 1 : 2, final: false });
  }
  return lanes;
}

/** Rota ipuçlarına yükseltme katkıları (Fener Ağı: tehlike ipucu, Pazar İstihbaratı: talep ipucu) */
export function decorateLanes(G, lanes, idx) {
  const run = G.run;
  const rng = SeededRNG.derive(run.seed, 'x1lanehint', idx);
  for (const l of lanes) {
    if (hasUpgrade(G.meta, 'UPG_X1_LIGHTHOUSE_NETWORK')) {
      const h = HARBOR_BY_ID[l.harborId];
      l.hazard = l.pirates >= 2 ? 'Korsan devriyeleri' : h.type === 'ice' || h.type === 'volcanic' ? 'Doğal felaket riski' : h.region >= 4 ? 'Fırtına ve kayalık' : l.danger >= 3 ? 'Dar ve kayalık geçitler' : 'Sakin sular';
    }
    if (hasUpgrade(G.meta, 'UPG_X1_MARKET_INTEL')) {
      const groups = { food: 'Erzak', luxury: 'Lüks mallar', basic: 'Temel mallar', special: 'Özel mallar' };
      const g = GOOD_BY_ID[l.rumors[0]?.good];
      if (g) l.demand = `${groups[g.group] || 'Mallar'} talep görüyor`;
    }
    if (run.x1?.mem?.flags?.pirateIntel) { l.pirateIntel = true; }
    // Paket 2 — Akıntı Günlüğü: rota riskine ek ipucu (hedef liman açılmaz)
    if (hasUpgrade(G.meta, 'UPG_X2_CURRENT_JOURNAL')) l.current = l.danger >= 4 ? 'Akıntı sert, girdap izleri var' : l.danger >= 3 ? 'Akıntı değişken' : l.distance === 'long' ? 'Uzun ama düzenli akıntı' : 'Akıntı yumuşak';
    void rng;
  }
  if (run.x1?.mem?.flags?.pirateIntel) run.x1.mem.flags.pirateIntel = false;
  return lanes;
}

// ───────────────────────── Event havuzu kancaları ─────────────────────────
/** Kategori ağırlıkları: Deniz Koşulu kontrollü katkı */
export function adjustWeights(G, w) {
  const c = endlessCond(G.run);
  if (!c) return w;
  for (const [k, v] of Object.entries(CONDITIONS[c].w || {})) w[k] = (w[k] || 0) + v;
  return w;
}

/** Tek eventin seçim ağırlığı çarpanı: keşfedilmemiş ×1,5, koşul etiketleri, Efsane Avcısı */
export function eventWeightMult(G, ev) {
  let m = 1;
  if (!G.meta.codex.events[ev.id]) m *= 1.5;
  const c = endlessCond(G.run);
  if (c) for (const [t, k] of Object.entries(CONDITIONS[c].tags || {})) if ((ev.tags || []).includes(t)) m *= k;
  if (ev.cat === 'mystery' && (ev.tier || 1) >= 2) {
    if (hasUpgrade(G.meta, 'UPG_X1_LEGEND_HUNTER')) m *= 1.25;
    if (c === 'forgotten') m *= CONDITIONS.forgotten.rareMystery;
  }
  return m;
}

/** En fazla iki aktif uzun zincir; run sonuna az kaldıysa uzun zincir başlamaz */
export function chainStartAllowed(G, chain, toIdx) {
  const run = G.run;
  const active = Object.values(run.chains).filter((c) => c.status === 'active' || c.status === 'queued').length;
  if (active >= 2) return false;
  if (!endlessOn(run) && run.totalHarbors && chain.steps >= 3 && run.totalHarbors - toIdx < 2) return false;
  if (chain.needCrew && !run.crew.includes(chain.needCrew)) return false;
  return true;
}

/** Şans düzeltmeleri (yüzde puan): derinlik cezası, Güçlendirilmiş Dümen, Muhafız itibarı, Usta Aletler, Derin Araştırma */
export function chanceMods(G, ev, o, add) {
  const run = G.run;
  const tags = o.tags || [];
  const etags = ev.tags || [];
  const r = o.req || {};
  const certainCrewItem = r.crew || r.item;
  if (hasUpgrade(G.meta, 'UPG_X1_RUDDER') && (tags.includes('navigate') || tags.includes('escape') || tags.includes('reckless') || tags.includes('maneuver'))) add('Güçlendirilmiş Dümen', 10);
  if (rep(run, 'crown') >= 2 && etags.includes('inspection')) add('Muhafız itibarı', 10);
  if (hasUpgrade(G.meta, 'UPG_X1_MASTER_TOOLS') && tags.includes('repair')) add('Usta Tamirci Aletleri', 10);
  if (hasUpgrade(G.meta, 'UPG_X1_DEEP_RESEARCH') && etags.includes('deep') && !X(run).once.deepDone) add('Derin Deniz Araştırmaları', 10);
  const pen = riskPenalty(run);
  if (pen && !certainCrewItem && (tags.includes('reckless') || tags.includes('escape') || tags.includes('navigate') || tags.includes('maneuver') || tags.includes('explore'))) add(`Deniz Derinliği ${DEPTHS[depthOf(run)].name.split(' ')[0]}`, -pen);
}

/** Olay altını: derinlik bonusu */
export function eventGold(run, g) { return g > 0 ? Math.round(g * (1 + goldBonus(run))) : g; }

/** Hasar: derinlik çarpanı (hullRaw/doğrudan tanımlı özel sonuçlar hariç) + Yedek Halatlar */
export function damageMods(G, d, ev, raw, notes) {
  const run = G.run;
  if (!raw) d *= damageMult(run);
  if (X(run).once.hullGuard && d > 0) { X(run).once.hullGuard = false; d = Math.max(0, d - 10); notes.push('Gövde kaplaması −10'); }
  if (hasUpgrade(G.meta, 'UPG_X1_ROPES') && (ev.tags || []).some((t) => t === 'mast' || t === 'rigging') && !X(run).once.ropesUsed) {
    X(run).once.ropesUsed = true;
    d *= 0.5;
    notes.push('Yedek Halatlar');
  }
  return d;
}

/** Tüccar Sigortası: ilk düşmanca hırsızlıkta 1 birim korunur */
export function insuranceProtect(G, ev, opt) {
  const run = G.run;
  if (!hasUpgrade(G.meta, 'UPG_X1_CARGO_INSURANCE') || X(run).once.insurance) return false;
  const et = ev.tags || [];
  if (!(et.includes('pirate') || et.includes('thief'))) return false;
  X(run).once.insurance = true;
  return true;
}

// ───────────────────────── Dünya Hafızası & Günlük ─────────────────────────
export function memFlag(run, k) { return !!X(run).mem.flags[k]; }
export function setMem(run, k, v = true) { X(run).mem.flags[k] = v; }

/** Denizci Günlüğü: görülen seçim sonuçları kalıcı kaydedilir */
export function recordOutcome(G, evId, key, success, auto = false) {
  const m = G.meta.x1;
  const o = (m.outcomes[evId] ||= {});
  o[auto ? 'auto' : `${key}|${success ? 'w' : 'l'}`] = true;
}

export function recordFinal(G, chainId, finalId) {
  const f = (G.meta.x1.finals[chainId] ||= []);
  if (!f.includes(finalId)) f.push(finalId);
}

// ───────────────────────── Sözleşmeler ─────────────────────────
export function contractCap(run) { return run.ship.level >= 3 ? 2 : 1; }

/** Limana girişte 0–2 teklif (ziyaret numarası ile seed: aynı limanda tekrar üretilemez) */
export function generateContractOffers(G, idx, harbor) {
  const run = G.run;
  const visitNo = (X(run).endless.visits[harbor.id] || 0);
  const rng = SeededRNG.derive(run.seed, 'x1contract', idx, harbor.id, visitNo);
  const n = rng.weighted([{ n: 0, weight: 3 }, { n: 1, weight: 5 }, { n: 2, weight: 3 }]).n;
  const pool = Object.values(CONTRACTS).filter((c) => {
    if (c.faction && rep(run, c.faction) <= -2) return false;
    if (c.faction === 'guild' && rep(run, 'guild') <= -1) return false;
    if (c.id === 'CONTRACT_X1_SMUGGLE' && harbor.type === 'military') return false;
    if (c.id === 'CONTRACT_X1_SMUGGLE' && rep(run, 'red') < 0) return false;
    return true;
  });
  const out = rng.sample(pool, Math.min(n, pool.length)).map((c) => ({ type: c.id, gold: rng.int(c.gold[0], c.gold[1]), taken: false }));
  return out;
}

export function acceptContract(G, i, cargoFree, addCargoLot) {
  const run = G.run;
  const v = run.visit;
  const x = X(run);
  const off = v?.contracts?.[i];
  if (!off || off.taken) return { ok: false, reason: 'Bu teklif artık yok.' };
  if (x.contracts.length >= contractCap(run)) return { ok: false, reason: `Gemin aynı anda en fazla ${contractCap(run)} sözleşme taşıyabilir.` };
  const def = CONTRACTS[off.type];
  if (def.cargo && cargoFree(G) < 1) return { ok: false, reason: 'Görev kargosu için ambarda 1 boş yer gerekli.' };
  if (def.escort && x.escort) return { ok: false, reason: 'Zaten bir konvoya eşlik ediyorsun.' };
  const id = `C${x.contractSeq++}`;
  const c = { id, type: def.id, gold: off.gold, deadline: run.stats.harborsReached + def.arrivals, from: v.harborId, state: 'active', cargo: def.cargo || null };
  if (def.cargo) addCargoLot(G, def.cargo, id);
  if (def.escort) x.escort = { contract: id, hp: 3 };
  if (def.salvage) c.needFind = true;
  x.contracts.push(c);
  off.taken = true;
  return { ok: true, contract: c };
}

export function contractCargoPresent(run, c) {
  if (!c.cargo) return true;
  return run.cargo.some((l) => l.good === c.cargo && l.contract === c.id && l.qty > 0);
}

/** Varışta kontrol: teslim edilecek / başarısız olan sözleşmeler → varış sahneleri */
export function arrivalContracts(G, harbor) {
  const run = G.run;
  const x = X(run);
  const queue = [];
  const lines = [];
  for (const c of x.contracts) {
    if (c.state !== 'active') continue;
    const def = CONTRACTS[c.type];
    if (def.escort) { queue.push({ id: 'CT_X1_ESCORT_DONE', src: 'contract', contract: c.id }); continue; }
    if (!contractCargoPresent(run, c)) { c.state = 'failed'; lines.push({ kind: 'info', text: `Sözleşme başarısız: ${def.name} (görev kargosu kayboldu).` }); X2.involuntaryFailPenalty(G, def.faction, lines); continue; }
    if (def.salvage && c.needFind) { if (run.stats.harborsReached >= c.deadline) { c.state = 'failed'; lines.push({ kind: 'info', text: `Sözleşme süresi doldu: ${def.name}.` }); X2.involuntaryFailPenalty(G, def.faction, lines); } continue; }
    const okDest = !def.dest || def.dest.includes(harbor.type) || (harbor.final && def.dest.includes('trade'));
    if (okDest) { queue.push({ id: 'CT_X1_DELIVER', src: 'contract', contract: c.id }); continue; }
    if (run.stats.harborsReached >= c.deadline) { c.state = 'failed'; lines.push({ kind: 'info', text: `Sözleşme süresi doldu: ${def.name}.` }); X2.involuntaryFailPenalty(G, def.faction, lines); }
  }
  x.contracts = x.contracts.filter((c) => c.state === 'active' || c.state === 'delivering');
  // süresi dolan görev kargoları ambardan kalkar
  run.cargo = run.cargo.filter((l) => !l.contract || x.contracts.some((c) => c.id === l.contract));
  return { queue, lines };
}

/** Yolculuk kuyruğuna sözleşme karşılaşması (yolculukta en fazla bir tane): kurtarma ya da buluşma */
export function contractVoyageEntry(G) {
  const run = G.run;
  const x = X(run);
  if (x.contractEncounterVoyage === run.idx) return null;
  for (const c of x.contracts) {
    if (c.state !== 'active') continue;
    const def = CONTRACTS[c.type];
    if (def.salvage && c.needFind) { x.contractEncounterVoyage = run.idx; return { id: 'CT_X1_SALVAGE', src: 'contract', contract: c.id }; }
    // esnek teslimat: süre bir sonraki varışta doluyor ve teslim edilebilir değilse fraksiyon gemisiyle buluşma
    if (!def.escort && run.stats.harborsReached + 1 >= c.deadline && contractCargoPresent(run, c)) {
      x.contractEncounterVoyage = run.idx;
      return { id: 'CT_X1_RENDEZVOUS', src: 'contract', contract: c.id };
    }
  }
  return null;
}

/** Sözleşmeyi tamamla (oran: 1 normal, 0.7 alternatif teslimat). Aynı sözleşme iki kez ödül vermez. */
export function completeContract(G, cid, ratio, lines, addXp) {
  const run = G.run;
  const x = X(run);
  const c = x.contracts.find((q) => q.id === cid);
  if (!c || c.state === 'done') return false;
  if (!once(run, `contract:${cid}`)) return false;
  const def = CONTRACTS[c.type];
  c.state = 'done';
  const gold = Math.round(c.gold * ratio);
  run.gold += gold;
  run.stats.goldEarned += gold;
  lines.push({ kind: 'gold', text: `Sözleşme ödülü: +${gold} altın` });
  const got = addXp(G, Math.round(def.xp * ratio), 'other');
  lines.push({ kind: 'xp', text: `+${got} XP` });
  if (def.faction) addRep(G, def.faction, 1, lines);
  if (def.letter) lines.push({ kind: 'route', text: 'Temsilci bir ticari talep ipucu verdi: bir sonraki rotada söylentiler daha güvenilir.' });
  if (def.letter) setMem(run, 'letterTip');
  if (c.cargo) run.cargo = run.cargo.filter((l) => l.contract !== c.id);
  if (def.escort) x.escort = null;
  x.contractsDone += 1;
  G.meta.x1.contractTypes[def.id] = (G.meta.x1.contractTypes[def.id] || 0) + 1;
  x.contracts = x.contracts.filter((q) => q.id !== cid);
  return true;
}

export function failContract(G, cid, lines, repLoss = 0) {
  const x = X(G.run);
  const c = x.contracts.find((q) => q.id === cid);
  if (!c) return;
  const def = CONTRACTS[c.type];
  c.state = 'failed';
  if (repLoss && def.faction) addRep(G, def.faction, -repLoss, lines);
  // gönüllü vazgeçme: Sözleşme Teminatı uygulanmaz (yalnızca istem dışı başarısızlıklar)
  if (def.escort) x.escort = null;
  G.run.cargo = G.run.cargo.filter((l) => l.contract !== c.id);
  x.contracts = x.contracts.filter((q) => q.id !== cid);
  lines.push({ kind: 'info', text: `Sözleşme başarısız: ${def.name}.` });
}

// ───────────────────────── X1 olay etkileri (fx.x1) ─────────────────────────
/** fx.x1: { rep:{f:d}, mem:{k:v}, unmem:[k], final:{chain,id}, ach, contract:'deliver'|'deliverAlt'|'found'|'escortDone'|'escortFail'|'fail', once, echo, chainDone, cargoUse:n, slowdown, mysteryChain } */
export function applyX1(G, fx, ctx, lines, deps) {
  const run = G.run;
  const x = X(run);
  const cur = ctx.host?.current;
  const entry = cur ? (ctx.host.queue[ctx.host.pos - 1] || {}) : {};
  if (fx.rep) for (const [f, d] of Object.entries(fx.rep)) addRep(G, f, d, lines);
  if (fx.mem) for (const [k, v] of Object.entries(fx.mem)) setMem(run, k, v);
  if (fx.unmem) for (const k of fx.unmem) delete x.mem.flags[k];
  if (fx.final) { recordFinal(G, fx.final.chain, fx.final.id); lines.push({ kind: 'chain', text: 'Alternatif son Denizci Günlüğü\'ne yazıldı.' }); }
  if (fx.echo) { G.meta.x1.echoes[fx.echo] = true; lines.push({ kind: 'codex', text: 'Hikâye Yankısı Denizci Günlüğü\'ne eklendi.' }); }
  if (fx.chainDone) { x.x1ChainsDone += 1; if (fx.mysteryChain) G.meta.x1.mysteryChains[fx.chainDone] = true; }
  if (fx.once) x.once[fx.once] = true;
  if (fx.ach) deps.unlockAchievement(G, fx.ach);
  if (fx.cargoUse) {
    // gönüllü olarak 1 birim (erzak/balık öncelikli) kullanılır/denize atılır
    for (let n = 0; n < fx.cargoUse; n++) {
      const lot = run.cargo.find((l) => !l.contract && !GOOD_BY_ID[l.good].questItem && ['GOOD_FISH', 'GOOD_GRAIN', 'GOOD_BISCUIT_CRATE'].includes(l.good)) || run.cargo.find((l) => !l.contract && !GOOD_BY_ID[l.good].questItem);
      if (!lot) break;
      lot.qty -= 1;
      lines.push({ kind: 'cargo', text: `1 ${GOOD_BY_ID[lot.good].name} kullanıldı` });
    }
    run.cargo = run.cargo.filter((l) => l.qty > 0);
  }
  const cid = entry.contract;
  if (fx.contract && cid) {
    if (fx.contract === 'deliver') completeContract(G, cid, 1, lines, deps.addXp);
    else if (fx.contract === 'deliverAlt') completeContract(G, cid, 0.7, lines, deps.addXp);
    else if (fx.contract === 'escortDone') completeContract(G, cid, x.escort && x.escort.hp <= 1 ? 0.7 : 1, lines, deps.addXp);
    else if (fx.contract === 'found') {
      const c = x.contracts.find((q) => q.id === cid);
      if (c && c.needFind && once(run, `found:${cid}`)) { c.needFind = false; c.cargo = 'GOOD_X1_RECORDS'; deps.addCargoLot(G, 'GOOD_X1_RECORDS', cid); lines.push({ kind: 'cargo', text: 'Kayıt sandığı ambara alındı.' }); }
    } else if (fx.contract === 'fail') failContract(G, cid, lines, fx.repLoss || 0);
  }
  if (fx.delay && run.voyage) { run.voyage.duration = (run.voyage.duration || 0) + fx.delay; lines.push({ kind: 'route', text: `Seyir gecikti (+${fx.delay} sn)` }); }
  if (fx.later) { run.pendingRoute.push({ id: fx.later, src: 'memory' }); }
  if (fx.personal && hasUpgrade(G.meta, 'UPG_X1_CREW_JOURNALS') && !x.once.personalXp) { x.once.personalXp = true; const g = deps.addXp(G, 10, 'other'); lines.push({ kind: 'xp', text: `Mürettebat Günlükleri: +${g} XP` }); }
  if (fx.swap && ctx.rng) {
    const lots = run.cargo.filter((l) => !l.contract && !GOOD_BY_ID[l.good].questItem && l.qty > 0);
    if (lots.length) {
      const lot = lots.reduce((a, b) => (GOOD_BY_ID[a.good].buy <= GOOD_BY_ID[b.good].buy ? a : b));
      const better = TRADE_GOODS.filter((g) => g.group !== 'special' && g.buy > GOOD_BY_ID[lot.good].buy).sort((a, b) => a.buy - b.buy);
      const pick = better.length ? better[Math.min(better.length - 1, ctx.rng.int(0, 2))] : null;
      if (pick) { lot.qty -= 1; run.cargo.push({ id: run.lotSeq++, good: pick.id, qty: 1, cost: GOOD_BY_ID[lot.good].buy, spoiled: false, boughtVisit: 'event' }); lines.push({ kind: 'cargo', text: `Takas: 1 ${GOOD_BY_ID[lot.good].name} → 1 ${pick.name}` }); }
      run.cargo = run.cargo.filter((l) => l.qty > 0);
    }
  }
  if (fx.buyAt) {
    const g = GOOD_BY_ID[fx.buyAt.good];
    const unit = Math.max(1, Math.round((g.buy * fx.buyAt.pct) / 100));
    const free = run.ship ? deps.cargoFree?.(G) ?? fx.buyAt.qty : fx.buyAt.qty;
    const n = Math.min(fx.buyAt.qty, Math.floor(run.gold / unit), free);
    if (n > 0) { run.gold -= unit * n; run.cargo.push({ id: run.lotSeq++, good: g.id, qty: n, cost: unit, spoiled: false, boughtVisit: 'event' }); lines.push({ kind: 'cargo', text: `${n} ${g.name} alındı (birim ${unit} altın)` }); }
    else lines.push({ kind: 'info', text: 'Yeterli altın ya da yer yoktu.' });
  }
  if (fx.sellBest) {
    const lots = run.cargo.filter((l) => !l.contract && !GOOD_BY_ID[l.good].questItem && l.qty > 0 && !l.spoiled);
    if (lots.length) {
      const lot = lots.reduce((a, b) => (GOOD_BY_ID[a.good].sell >= GOOD_BY_ID[b.good].sell ? a : b));
      const price = Math.round(GOOD_BY_ID[lot.good].sell * fx.sellBest);
      lot.qty -= 1; run.gold += price; run.stats.goldEarned += price; run.stats.profit = (run.stats.profit || 0) + Math.max(0, price - (lot.cost || 0));
      run.cargo = run.cargo.filter((l) => l.qty > 0);
      lines.push({ kind: 'gold', text: `1 ${GOOD_BY_ID[lot.good].name} satıldı: +${price} altın` });
    }
  }
  if (fx.cargoUseValuable) {
    const lots = run.cargo.filter((l) => !l.contract && !GOOD_BY_ID[l.good].questItem && l.qty > 0);
    if (lots.length) { const lot = lots.reduce((a, b) => (GOOD_BY_ID[a.good].sell >= GOOD_BY_ID[b.good].sell ? a : b)); lot.qty -= 1; run.cargo = run.cargo.filter((l) => l.qty > 0); lines.push({ kind: 'cargo', text: `Hediye: 1 ${GOOD_BY_ID[lot.good].name}` }); }
  }
  if (fx.escortHit && x.escort) { x.escort.hp -= 1; lines.push({ kind: 'info', text: 'Eskort ettiğin nakliye gemisi hasar aldı.' }); }
}

/** Çalınan/el konan görev kargosu: ilgili sözleşme başarısız sayılır (varışta) — ek işlem gerekmez. */

/** Hikâye Avcısı: 25 bağımsız eventin en az 15'i keşfedildi mi */
export function checkStoryHunter(G, unlockAchievement) {
  if (G.meta.achievements.includes('ACH_X1_STORY_HUNTER')) return;
  const n = Object.keys(G.meta.codex.events).filter((id) => /^EVT_X1_(D|F|M|DIS|REPAIR|CREW|PET)\d+$/.test(id)).length;
  if (n >= 15) unlockAchievement(G, 'ACH_X1_STORY_HUNTER');
}

export { clamp, GRAND_HARBOR_ID };
