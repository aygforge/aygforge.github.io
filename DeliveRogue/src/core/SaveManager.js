// core/SaveManager.js — migrated from DeliveRogue.html (Phase 01 Core Migration).
// Legacy v1 schema + key kept so existing HTML5 saves load unchanged. Debug builds (?debug=1) use a
// separate namespace. A/B slots, ledger and migrations arrive in Phase 05 (Save System 2.0).
import { StorageAdapter } from '../platform/StorageAdapter.js';
import { MYSTERY_POOL } from '../data/packages.js';
import { clamp, hashStr } from './util.js';
import { CHAPTERS } from '../data/chapters.js';
import { COSMETICS } from '../data/cosmetics.js';
import { ENEMY_ORDER } from '../data/enemies.js';
import { GARAGE_MAX, GARAGE_ORDER } from '../data/garage.js';
import { MILESTONES, QUESTS } from '../data/quests.js';

/* ============================ Save ============================ */
/** Centralised, versioned save manager. All persistent state lives in Save.data. */
export const Save = (() => {
  const KEY = StorageAdapter.key('deliverogue_save'), VERSION = 1, NCH = CHAPTERS.length;
  function defaults() {
    const book = {}; ENEMY_ORDER.forEach(id => book[id] = { seen: false, enc: 0, def: 0 });
    return {
      v: VERSION, level: 1, xp: 0, coins: 0,
      garage: { motor: 0, helmet: 0, jacket: 0, pos: 0 },
      unlocked: 1, stars: Array(NCH).fill(0), bestTime: Array(NCH).fill(0), completed: Array(NCH).fill(false),
      episodes: { coffee: false },
      stats: { deliveries: 0, failures: 0, kills: 0, eliteKills: 0, pkg70: 0, fragileDone: 0, heavyDone: 0, threeStarRuns: 0, runs: 0, mastery: 0, bossKills: 0 },
      book, quests: { claimed: {} }, milestones: { unlocked: {}, claimed: {} }, mastery: {},
      cosmetics: { owned: ['classic'], selected: 'classic' },
      settings: { master: true, music: true, sfx: true, shake: true, vibe: true, reducedMotion: false, lowGfx: false, leftHanded: false, joySize: 1, fireSize: 1, ctrlOpacity: 1 },
      tutorial: {}, settled: [], runCounter: 0,
      bossClears: { COF: false }, legacyFinalClear: false, mysteries: {}, mysteryAttempts: 0,
    };
  }
  const num = (v, d, lo = -Infinity, hi = Infinity) => (typeof v === 'number' && isFinite(v)) ? clamp(v, lo, hi) : d;
  const bool = (v, d) => typeof v === 'boolean' ? v : d;
  const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  /** Validate + repair a loaded save, field by field. Unknown/invalid values fall back to defaults. */
  function validate(raw) {
    const d = defaults(), r = obj(raw);
    d.level = Math.floor(num(r.level, 1, 1, 999)); d.xp = Math.floor(num(r.xp, 0, 0, 1e9)); d.coins = Math.floor(num(r.coins, 0, 0, 1e9));
    const g = obj(r.garage); GARAGE_ORDER.forEach(k => d.garage[k] = Math.floor(num(g[k], 0, 0, GARAGE_MAX)));
    d.unlocked = Math.floor(num(r.unlocked, 1, 1, NCH));
    for (let i = 0; i < NCH; i++) {
      d.stars[i] = Math.floor(num(Array.isArray(r.stars) ? r.stars[i] : 0, 0, 0, 3));
      d.bestTime[i] = num(Array.isArray(r.bestTime) ? r.bestTime[i] : 0, 0, 0, 9999);
      d.completed[i] = bool(Array.isArray(r.completed) ? r.completed[i] : false, false);
      if (d.completed[i] && i + 2 > d.unlocked) d.unlocked = Math.min(NCH, i + 2);
    }
    // Phase 04: episode completion requires the mandatory boss + delivery. A legacy HTML5 C12 clear (no boss flag)
    // is kept as a legacy record; the new final must be replayed — no boss victory is invented from old data.
    const bc = obj(r.bossClears); d.bossClears.COF = bool(bc.COF, false);
    const legacyDone = bool(obj(r.episodes).coffee, false) || d.completed[NCH - 1];
    d.legacyFinalClear = bool(r.legacyFinalClear, false) || (!d.bossClears.COF && legacyDone && !('bossClears' in r));
    d.episodes.coffee = d.bossClears.COF;
    const my = obj(r.mysteries); for (const k in my) { const m = obj(my[k]); if (/^campaign:[A-Z]{3}:C\d\d$/.test(k) && MYSTERY_POOL.includes(m.rule)) d.mysteries[k] = { rule: m.rule, attempt: Math.floor(num(m.attempt, 1, 1, 1e9)) }; }
    d.mysteryAttempts = Math.floor(num(r.mysteryAttempts, 0, 0, 1e9));
    const st = obj(r.stats); for (const k in d.stats) d.stats[k] = Math.floor(num(st[k], 0, 0, 1e9));
    const bk = obj(r.book); ENEMY_ORDER.forEach(id => { const e = obj(bk[id]); d.book[id] = { seen: bool(e.seen, false), enc: Math.floor(num(e.enc, 0, 0, 1e9)), def: Math.floor(num(e.def, 0, 0, 1e9)) }; });
    const q = obj(obj(r.quests).claimed); QUESTS.forEach(x => { if (q[x.id] === true) d.quests.claimed[x.id] = true; });
    const ms = obj(r.milestones), mu = obj(ms.unlocked), mc = obj(ms.claimed);
    MILESTONES.forEach(x => { if (mu[x.id] === true) d.milestones.unlocked[x.id] = true; if (mc[x.id] === true) d.milestones.claimed[x.id] = true; });
    const ma = obj(r.mastery); for (const k in ma) if (ma[k] === true && /^C\d\d_\d$/.test(k)) d.mastery[k] = true;
    const co = obj(r.cosmetics), ids = COSMETICS.map(c => c.id);
    d.cosmetics.owned = Array.from(new Set(['classic'].concat(Array.isArray(co.owned) ? co.owned.filter(x => ids.includes(x)) : [])));
    d.cosmetics.selected = d.cosmetics.owned.includes(co.selected) ? co.selected : 'classic';
    const se = obj(r.settings), RANGE = { joySize: [0.8, 1.3], fireSize: [0.8, 1.3], ctrlOpacity: [0.4, 1] };
    for (const k in d.settings) d.settings[k] = typeof d.settings[k] === 'number' ? num(se[k], d.settings[k], RANGE[k][0], RANGE[k][1]) : bool(se[k], d.settings[k]);
    const tu = obj(r.tutorial); for (const k in tu) if (tu[k] === true) d.tutorial[k] = true;
    d.settled = Array.isArray(r.settled) ? r.settled.filter(x => typeof x === 'string').slice(-40) : [];
    d.runCounter = Math.floor(num(r.runCounter, 0, 0, 1e12));
    return d;
  }
  let data = defaults(), storageOk = true, loadStatus = 'new';
  /** Load + validate. A corrupt (unparseable) save is never silently discarded: the raw text is copied
   *  to KEY + '_corrupt_backup' before defaults are used. Status: 'new' | 'loaded' | 'recovered' | 'unavailable'. */
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { data = defaults(); loadStatus = 'unavailable'; return data; }
    if (!raw) { data = defaults(); loadStatus = 'new'; return data; }
    try { data = validate(JSON.parse(raw)); loadStatus = 'loaded'; }
    catch (e) {
      try { localStorage.setItem(KEY + '_corrupt_backup', raw); } catch (_) {}
      data = defaults(); loadStatus = 'recovered';
    }
    return data;
  }
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); storageOk = true; } catch (e) { storageOk = false; }
    return storageOk;
  }
  function reset() { data = defaults(); write(); return data; }
  const checksum = obj => hashStr(JSON.stringify(obj)).toString(16);
  /** Export bundle (JSON-serialisable). Checksum = corruption detection, not security. */
  function exportBundle() { const d = JSON.parse(JSON.stringify(data)); return { schema: 'deliverogue_save', v: VERSION, exportedAt: new Date().toISOString(), checksum: checksum(d), data: d }; }
  /** Parse + validate an export bundle WITHOUT applying it. */
  function inspectBundle(text) {
    let b; try { b = JSON.parse(text); } catch (e) { return { ok: false, reason: 'parse' }; }
    if (!b || b.schema !== 'deliverogue_save' || typeof b.data !== 'object') return { ok: false, reason: 'schema' };
    return { ok: true, checksumOk: checksum(b.data) === b.checksum, data: validate(b.data) };
  }
  /** Apply a validated import. The current save is kept under KEY + '_backup' first. */
  function applyImport(validated) {
    try { localStorage.setItem(KEY + '_backup', JSON.stringify(data)); } catch (e) {}
    data = validate(validated); return write();
  }
  return { load, write, reset, defaults, validate, exportBundle, inspectBundle, applyImport, get data() { return data; }, get ok() { return storageOk; }, get loadStatus() { return loadStatus; } };
})();
