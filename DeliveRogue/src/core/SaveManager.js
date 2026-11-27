// core/SaveManager.js — Save System 2.0 (Phase 05).
//
// Storage: two slots (A/B) + a commit pointer. Every save is an envelope
//   { schema: 'deliverogue', v: 2, rev, ts, checksum, data }
// written to the INACTIVE slot, read back and verified, and only then committed by moving the pointer.
// Loading picks the valid envelope with the highest revision (pointer slot preferred), so a corrupt slot, a
// corrupt pointer or a crash between "write slot" and "move pointer" falls back to the last valid revision.
// The checksum is corruption detection, not security. A write failure never destroys the in-memory state or
// the last valid slot; callers are told (return value + onError hook) and transactional changes roll back.
//
// Migration (only when no valid v2 save exists, idempotent because the v2 result is written immediately):
//   1) HTML5 v1 `deliverogue_save` (runtime authority)  2) GDevelop `DR_SAVE_V1` (level/xp/coins/skins).
//   If both exist the HTML5 save is chosen explicitly (no automatic merge) and the GDevelop presence is recorded.
//   Raw legacy saves are backed up first and never deleted.
import { StorageAdapter } from '../platform/StorageAdapter.js';
import { MYSTERY_POOL } from '../data/packages.js';
import { clamp, hashStr } from './util.js';
import { CHAPTERS } from '../data/chapters.js';
import { SKIN_IDS, DEFAULT_SKIN, LEGACY_SKINS } from '../data/cosmetics.js';
import { ENEMY_ORDER } from '../data/enemies.js';
import { GARAGE_MAX, GARAGE_ORDER } from '../data/garage.js';
import { MILESTONES, QUESTS } from '../data/quests.js';

export const SAVE_SCHEMA = 'deliverogue', SAVE_VERSION = 2;

export const Save = (() => {
  const K = { a: StorageAdapter.key('dr2_slot_a'), b: StorageAdapter.key('dr2_slot_b'), ptr: StorageAdapter.key('dr2_ptr'),
    legacy: StorageAdapter.key('deliverogue_save'), gdev: StorageAdapter.key('DR_SAVE_V1'), corrupt: StorageAdapter.key('dr2_corrupt_backup'),
    v1Backup: StorageAdapter.key('deliverogue_save_v1_backup'), gdevBackup: StorageAdapter.key('DR_SAVE_V1_backup'), importBackup: StorageAdapter.key('dr2_import_backup') };
  const NCH = CHAPTERS.length;
  function defaults() {
    const book = {}; ENEMY_ORDER.forEach(id => book[id] = { seen: false, enc: 0, def: 0 });
    const garage = {}; GARAGE_ORDER.forEach(k => garage[k] = 0);
    return {
      v: SAVE_VERSION, level: 1, xp: 0, coins: 0, garage,
      unlocked: 1, stars: Array(NCH).fill(0), bestTime: Array(NCH).fill(0), completed: Array(NCH).fill(false),
      episodes: { coffee: false },
      stats: { deliveries: 0, failures: 0, kills: 0, eliteKills: 0, pkg70: 0, fragileDone: 0, heavyDone: 0, threeStarRuns: 0, runs: 0, mastery: 0, bossKills: 0, upgrades: 0 },
      book, quests: { claimed: {} }, milestones: { unlocked: {}, claimed: {} }, mastery: {},
      cosmetics: { owned: [DEFAULT_SKIN], selected: DEFAULT_SKIN },
      settings: { master: true, music: true, sfx: true, shake: true, vibe: true, reducedMotion: false, lowGfx: false, leftHanded: false, joySize: 1, fireSize: 1, ctrlOpacity: 1 },
      tutorial: {}, settled: [], runCounter: 0,
      bossClears: { COF: false }, legacyFinalClear: false, mysteries: {}, mysteryAttempts: 0,
      ledger: { grants: {}, runSeq: 0, log: [] },
      legacy: { source: null, gdevelopDetected: false, cosmetics: [], refunded: {}, migratedAt: null },
    };
  }
  const num = (v, d, lo = -Infinity, hi = Infinity) => (typeof v === 'number' && isFinite(v)) ? clamp(v, lo, hi) : d;
  const bool = (v, d) => typeof v === 'boolean' ? v : d;
  const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const str = (v, d) => typeof v === 'string' ? v : d;
  /** Validate + repair v2-shaped data field by field. Unknown/invalid values fall back to defaults. */
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
    // Episode completion requires the mandatory boss + delivery (Phase 04). A legacy C12 clear without a boss flag
    // stays a legacy record; no boss victory is invented from old data.
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
    const co = obj(r.cosmetics);
    d.cosmetics.owned = Array.from(new Set([DEFAULT_SKIN].concat(Array.isArray(co.owned) ? co.owned.filter(x => SKIN_IDS.includes(x)) : []))).sort((a, b) => SKIN_IDS.indexOf(a) - SKIN_IDS.indexOf(b));
    d.cosmetics.selected = d.cosmetics.owned.includes(co.selected) ? co.selected : DEFAULT_SKIN;
    const se = obj(r.settings), RANGE = { joySize: [0.8, 1.3], fireSize: [0.8, 1.3], ctrlOpacity: [0.4, 1] };
    for (const k in d.settings) d.settings[k] = typeof d.settings[k] === 'number' ? num(se[k], d.settings[k], RANGE[k][0], RANGE[k][1]) : bool(se[k], d.settings[k]);
    const tu = obj(r.tutorial); for (const k in tu) if (tu[k] === true) d.tutorial[k] = true;
    d.settled = Array.isArray(r.settled) ? r.settled.filter(x => typeof x === 'string').slice(-40) : [];
    d.runCounter = Math.floor(num(r.runCounter, 0, 0, 1e12));
    // ledger: unique grant keys (one-time rewards) + settled run sequence high-water mark (no pruning needed)
    const L = obj(r.ledger), gr = obj(L.grants);
    for (const k in gr) if (/^[a-z]+:[A-Za-z0-9_:#.-]+$/.test(k) && typeof gr[k] === 'number' && isFinite(gr[k])) d.ledger.grants[k] = Math.floor(gr[k]);
    d.ledger.runSeq = Math.floor(num(L.runSeq, 0, 0, 1e12));
    d.ledger.log = Array.isArray(L.log) ? L.log.filter(x => x && typeof x.k === 'string').slice(-60).map(x => ({ k: x.k, a: Math.floor(num(x.a, 0, -1e9, 1e9)), t: Math.floor(num(x.t, 0, 0, 1e13)) })) : [];
    // already-paid one-time rewards from before the ledger existed are recorded, so they can never pay twice
    QUESTS.forEach(x => { if (d.quests.claimed[x.id] && d.ledger.grants['quest:' + x.id] == null) d.ledger.grants['quest:' + x.id] = x.reward; });
    MILESTONES.forEach(x => { if (d.milestones.claimed[x.id] && d.ledger.grants['ms:' + x.id] == null) d.ledger.grants['ms:' + x.id] = x.reward; });
    if (d.bossClears.COF && d.ledger.grants['boss:COF'] == null) d.ledger.grants['boss:COF'] = 0;
    if (d.runCounter > d.ledger.runSeq && d.settled.length) d.ledger.runSeq = d.runCounter;
    const lg = obj(r.legacy);
    d.legacy.source = ['html5_v1', 'gdevelop_v1'].includes(lg.source) ? lg.source : null; d.legacy.gdevelopDetected = bool(lg.gdevelopDetected, false);
    d.legacy.cosmetics = Array.isArray(lg.cosmetics) ? lg.cosmetics.filter(x => typeof x === 'string' && x.length < 32).slice(0, 10) : [];
    const rf = obj(lg.refunded); for (const k in rf) if (LEGACY_SKINS[k] && typeof rf[k] === 'number') d.legacy.refunded[k] = Math.floor(rf[k]);
    d.legacy.migratedAt = str(lg.migratedAt, null);
    return d;
  }

  /** HTML5 v1 -> v2. Temporary legacy skins: classic -> default; purchased others refunded once at original price. */
  function migrateHtml5(raw) {
    const r = obj(raw), co = obj(r.cosmetics), legacyOwned = Array.isArray(co.owned) ? co.owned.filter(x => typeof x === 'string') : [];
    const d = validate(Object.assign({}, r, { cosmetics: { owned: legacyOwned.filter(x => SKIN_IDS.includes(x)), selected: co.selected } }));
    d.legacy.source = 'html5_v1'; d.legacy.cosmetics = legacyOwned.slice(0, 10); d.legacy.migratedAt = new Date().toISOString();
    for (const id of legacyOwned) {
      const L = LEGACY_SKINS[id]; if (!L || !L.price || d.legacy.refunded[id] != null) continue;
      const key = 'legacySkin:' + id; if (d.ledger.grants[key] != null) continue;
      d.legacy.refunded[id] = L.price; d.ledger.grants[key] = L.price; d.coins += L.price; d.ledger.log.push({ k: key, a: L.price, t: Date.now() });
    }
    return d;
  }
  /** GDevelop DR_SAVE_V1 -> v2 (fields: PlayerLevel, PlayerXP, Coin, EquippedSkinId, OwnedSkinsJson). */
  function migrateGdevelop(raw) {
    const r = obj(raw); let owned = [];
    try { owned = JSON.parse(str(r.OwnedSkinsJson, '[]')); } catch (e) { owned = []; }
    const d = validate({ level: r.PlayerLevel, xp: r.PlayerXP, coins: r.Coin, cosmetics: { owned: Array.isArray(owned) ? owned : [], selected: r.EquippedSkinId } });
    d.legacy.source = 'gdevelop_v1'; d.legacy.migratedAt = new Date().toISOString();
    return d;
  }

  const checksum = o => hashStr(JSON.stringify(o)).toString(16);
  const envelope = (d, rev) => ({ schema: SAVE_SCHEMA, v: SAVE_VERSION, rev, ts: Date.now(), checksum: checksum(d), data: d });
  function readEnv(key) {
    const raw = StorageAdapter.get(key); if (raw == null) return { raw: null, ok: false };
    try { const e = JSON.parse(raw); const ok = e && e.schema === SAVE_SCHEMA && e.v === SAVE_VERSION && typeof e.rev === 'number' && obj(e.data) === e.data && checksum(e.data) === e.checksum; return { raw, ok, env: e }; }
    catch (err) { return { raw, ok: false }; }
  }

  let data = defaults(), storageOk = true, loadStatus = 'new', rev = 0, slot = null, info = {}, onError = null;
  /** Status: 'new' | 'loaded' | 'recovered' (fell back to an older valid revision / corrupt data backed up)
   *  | 'migrated' (from a legacy save) | 'unavailable' (no storage). */
  function load() {
    info = {};
    try { localStorage.getItem('__probe__'); } catch (e) { data = defaults(); loadStatus = 'unavailable'; return data; }
    let ptr = null; try { ptr = JSON.parse(StorageAdapter.get(K.ptr) || 'null'); } catch (e) { ptr = null; }
    const A = readEnv(K.a), B = readEnv(K.b);
    const valid = [['a', A], ['b', B]].filter(([, x]) => x.ok).sort((x, y) => y[1].env.rev - x[1].env.rev);
    if (valid.length) {
      const prefer = ptr && valid.find(([s]) => s === ptr.slot);
      const [s, pick] = (prefer && prefer[1].env.rev >= valid[0][1].env.rev) ? prefer : valid[0];
      data = validate(pick.env.data); rev = pick.env.rev; slot = s;
      const ptrOk = ptr && ptr.slot === s && ptr.rev === rev;
      const bad = [['a', A], ['b', B]].filter(([, x]) => x.raw != null && !x.ok);
      if (bad.length) { StorageAdapter.set(K.corrupt, JSON.stringify(bad.map(([sl, x]) => ({ slot: sl, raw: x.raw })))); info.corruptSlots = bad.map(([sl]) => sl); }
      loadStatus = (!ptrOk || bad.some(([sl]) => sl === (ptr && ptr.slot))) ? 'recovered' : 'loaded';
      if (loadStatus === 'recovered') write();
      return data;
    }
    // no valid v2: corrupt v2 data is backed up, then legacy migration
    const anyV2 = A.raw != null || B.raw != null;
    if (anyV2) StorageAdapter.set(K.corrupt, JSON.stringify([{ slot: 'a', raw: A.raw }, { slot: 'b', raw: B.raw }]));
    const html = StorageAdapter.get(K.legacy), gd = StorageAdapter.get(K.gdev);
    if (html != null || gd != null) {
      let migrated = null;
      if (html != null) { StorageAdapter.set(K.v1Backup, html); try { migrated = migrateHtml5(JSON.parse(html)); } catch (e) { migrated = null; } }
      if (!migrated && gd != null) { StorageAdapter.set(K.gdevBackup, gd); try { migrated = migrateGdevelop(JSON.parse(gd)); } catch (e) { migrated = null; } }
      if (migrated) {
        if (html != null && gd != null) { migrated.legacy.gdevelopDetected = true; StorageAdapter.set(K.gdevBackup, gd); }
        data = migrated; rev = 0; slot = null; loadStatus = 'migrated'; info.source = migrated.legacy.source; write(); return data;
      }
      data = defaults(); loadStatus = 'recovered'; info.legacyCorrupt = true; return data;
    }
    data = defaults(); rev = 0; slot = null; loadStatus = anyV2 ? 'recovered' : 'new';
    return data;
  }
  /** Write to the inactive slot, verify, then commit the pointer. Returns false (and keeps everything valid) on failure. */
  function write() {
    const target = slot === 'a' ? 'b' : 'a', nextRev = rev + 1, env = envelope(data, nextRev), text = JSON.stringify(env);
    let ok = StorageAdapter.set(K[target], text);
    if (ok) { const back = readEnv(K[target]); ok = back.ok && back.env.rev === nextRev; }
    if (ok) ok = StorageAdapter.set(K.ptr, JSON.stringify({ slot: target, rev: nextRev }));
    if (ok) { rev = nextRev; slot = target; storageOk = true; }
    else { storageOk = false; if (onError) try { onError(); } catch (e) {} }
    return ok;
  }
  /** Transaction: apply fn to the live data; if fn returns false or the save fails, roll back completely. */
  function transact(fn) {
    const snap = JSON.stringify(data);
    let res;
    try { res = fn(data); } catch (e) { data = JSON.parse(snap); throw e; }
    if (res === false) { data = JSON.parse(snap); return false; }
    if (!write()) { data = JSON.parse(snap); return false; }
    return res === undefined ? true : res;
  }
  function reset() { data = defaults(); write(); return data; }
  /** Export bundle (JSON-serialisable). */
  function exportBundle() { const d = JSON.parse(JSON.stringify(data)); return { schema: 'deliverogue_save', v: SAVE_VERSION, exportedAt: new Date().toISOString(), checksum: checksum(d), data: d }; }
  /** Parse + validate an export bundle WITHOUT applying it (v1 bundles are migrated). */
  function inspectBundle(text) {
    let b; try { b = JSON.parse(text); } catch (e) { return { ok: false, reason: 'parse' }; }
    if (!b || b.schema !== 'deliverogue_save' || typeof b.data !== 'object' || !b.data) return { ok: false, reason: 'schema' };
    const v1 = b.v === 1 || (b.data.cosmetics && Array.isArray(b.data.cosmetics.owned) && b.data.cosmetics.owned.includes('classic'));
    return { ok: true, checksumOk: checksum(b.data) === b.checksum, data: v1 ? migrateHtml5(b.data) : validate(b.data), migrated: !!v1 };
  }
  /** Apply a validated import. The current save is kept as a backup first. */
  function applyImport(validated) {
    StorageAdapter.set(K.importBackup, JSON.stringify(data));
    const prev = data; data = validate(validated);
    if (!write()) { data = prev; return false; }
    return true;
  }
  return {
    load, write, transact, reset, defaults, validate, migrateHtml5, migrateGdevelop, exportBundle, inspectBundle, applyImport, KEYS: K,
    set onError(f) { onError = f; },
    get data() { return data; }, get ok() { return storageOk; }, get loadStatus() { return loadStatus; },
    get meta() { return { rev, slot, ...info, source: data.legacy.source, gdevelopDetected: data.legacy.gdevelopDetected }; },
  };
})();
