// Run ve meta durumu, kahraman istatistikleri, envanter yardımcıları.
import { CFG, clamp } from '../config.js';
import { ITEMS, QUEST_ITEMS } from '../data/items.js';
import { UPG } from '../data/meta.js';

export const META_VERSION = 1, RUN_VERSION = 1;

export function newMeta() {
  return {
    v: META_VERSION, xp: 0, xpTotal: 0, upgrades: {}, runs: 0, wins: 0, deaths: 0,
    records: { maxTowns: 0, kills: 0, quests: 0, score: 0, maxEndless: 0, chains: 0 },
    codex: { events: {}, chains: {} },
  };
}
export function migrateMeta(m) {
  const d = newMeta();
  if (!m || typeof m !== 'object') return d;
  return { ...d, ...m, records: { ...d.records, ...(m.records || {}) }, codex: { events: { ...((m.codex || {}).events || {}) }, chains: { ...((m.codex || {}).chains || {}) } }, upgrades: { ...(m.upgrades || {}) }, v: META_VERSION };
}
export const defaultSettings = () => ({ master: 0.8, music: 0.6, sfx: 0.8, muted: false, skipAnim: false, fast: false });

export function migrateRun(r) {
  if (!r || typeof r !== 'object' || r.v !== RUN_VERSION || !r.hero || !r.towns) return null;
  r.bag = (r.bag || []).filter((b) => b && ITEMS[b.id]);
  r.overflow = (r.overflow || []).filter((id) => ITEMS[id]);
  r.flags = r.flags || {};
  r.chains = r.chains || {};
  r.pendingRoute = r.pendingRoute || [];
  r.pendingArrival = r.pendingArrival || [];
  r.contracts = r.contracts || [];
  r.recent = r.recent || [];
  r.seen = r.seen || {};
  r.qitems = r.qitems || {};
  r.stats = { kills: 0, events: 0, towns: 0, quests: 0, chainsDone: 0, goldEarned: 0, ...(r.stats || {}) };
  return r;
}

export const hasUpg = (meta, id) => !!(meta && meta.upgrades && meta.upgrades[id]);

// ——— Kahraman istatistikleri ———
export function buffSum(run, k) { return (run.hero.buffs || []).reduce((s, b) => s + (b[k] || 0), 0); }
export function heroStats(G) {
  const r = G.run, h = r.hero, eq = r.equip;
  const w = ITEMS[eq.weapon] || {}, a = ITEMS[eq.armor] || {}, x = ITEMS[eq.acc] || {};
  const st = {
    maxHp: h.baseHp + (h.perm.maxHp || 0) + (x.hp || 0),
    atk: h.baseAtk + (h.perm.atk || 0) + (w.atk || 0) + (a.atk || 0) + (x.atk || 0) + buffSum(r, 'atk'),
    def: h.baseDef + (h.perm.def || 0) + (w.def || 0) + (a.def || 0) + (x.def || 0) + buffSum(r, 'def'),
    agi: h.baseAgi + (h.perm.agi || 0) + (w.agi || 0) + (a.agi || 0) + (x.agi || 0) + buffSum(r, 'agi'),
    luck: (x.luck || 0) + buffSum(r, 'luck'),
    talk: Math.round(6 + ((h.baseAgi + (h.perm.agi || 0)) * 0.3) + (x.talk ? 4 : 0)),
  };
  st.maxHp = Math.max(20, st.maxHp);
  st.atk = Math.max(1, st.atk); st.def = Math.max(0, st.def); st.agi = Math.max(1, st.agi);
  st.fam = w.fam || 'sword';
  return st;
}
export function opensKeys(G) {
  const r = G.run, s = new Set();
  for (const slot of ['weapon', 'armor', 'acc']) { const it = ITEMS[r.equip[slot]]; if (it && it.opens) it.opens.forEach((k) => s.add(k)); }
  return s;
}
export function clampHp(G) { const m = heroStats(G).maxHp; G.run.hero.hp = clamp(Math.round(G.run.hero.hp), 0, m); }

// ——— Envanter ———
export const bagCount = (run) => run.bag.length;
export function countItem(run, id) {
  let n = 0;
  for (const b of run.bag) if (b.id === id) n += b.n || 1;
  for (const s of ['weapon', 'armor', 'acc']) if (run.equip[s] === id) n++;
  return n;
}
export const hasItem = (run, id) => countItem(run, id) > 0;
export function hasInBag(run, id) { return run.bag.some((b) => b.id === id); }
// Çantaya ekle: kuşanılabilir eşyalar boş yuvaya otomatik kuşanılmaz; aynı tüketilebilirler 3'e kadar istiflenir.
export function addItem(run, id) {
  const it = ITEMS[id];
  if (!it) return false;
  if (it.kind === 'cons') {
    const st = run.bag.find((b) => b.id === id && (b.n || 1) < CFG.bag.stack);
    if (st) { st.n = (st.n || 1) + 1; return true; }
  }
  if (it.slot !== 'bag' && !run.equip[it.slot]) { run.equip[it.slot] = id; return true; }
  if (run.bag.length >= CFG.bag.slots) { run.overflow.push(id); return 'overflow'; }
  run.bag.push({ id, n: 1 });
  if (it.combat && run.quick.length < CFG.bag.quick && !run.quick.includes(id)) run.quick.push(id);
  return true;
}
export function removeOne(run, id) {
  const i = run.bag.findIndex((b) => b.id === id);
  if (i < 0) return false;
  const b = run.bag[i];
  if ((b.n || 1) > 1) b.n--; else { run.bag.splice(i, 1); if (!hasInBag(run, id)) run.quick = run.quick.filter((q) => q !== id); }
  return true;
}
export function addQItem(run, id) { run.qitems[id] = (run.qitems[id] || 0) + 1; }
export function removeQItem(run, id) { if (run.qitems[id]) { run.qitems[id]--; if (!run.qitems[id]) delete run.qitems[id]; return true; } return false; }
export const qitemName = (id) => QUEST_ITEMS[id] || id;

export function newRunState(meta, seed) {
  const s = CFG.start, up = (id) => hasUpg(meta, id);
  return {
    v: RUN_VERSION, seed, rngState: 0, created: Date.now(),
    hero: { hp: 0, baseHp: s.hp + (up('U_TOUGH') ? 5 : 0) + (up('U_IRON') ? 5 : 0), baseAtk: s.atk + (up('U_SHARP') ? 1 : 0), baseDef: s.def + (up('U_STANCE') ? 1 : 0), baseAgi: s.agi, perm: {}, buffs: [] },
    gold: s.gold + (up('U_PURSE') ? 20 : 0),
    equip: { weapon: s.weapon, armor: s.armor, acc: s.acc },
    bag: [], quick: [], qitems: {}, overflow: [],
    flags: {}, chains: {}, pendingRoute: [], pendingArrival: [], contracts: [],
    towns: {}, route: [], idx: 0, legsTotal: 0, phase: 'town', visit: null, voyage: null, arrival: null,
    recent: [], seen: {}, xp: 0, xpBanked: false,
    stats: { kills: 0, events: 0, towns: 1, quests: 0, chainsDone: 0, goldEarned: 0 },
    endless: null, capitalWon: false, ended: null, senseUsed: false, instinctUsed: false, townTypesSeen: {},
  };
}
