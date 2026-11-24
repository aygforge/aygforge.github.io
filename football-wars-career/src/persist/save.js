// Career saves: 3 independent slots in IndexedDB (localStorage fallback), checksummed envelope,
// previous good save kept as backup, JSON export/import with schema validation.
import { SAVE_VERSION, ENGINE_VERSION } from '../data/balance.js';
import { hashStr } from '../career/util.js';

const DB = 'football-wars-career', STORE = 'slots';
export const SLOTS = [1, 2, 3];
let dbp = null, backend = 'none';
function openDB() {
  if (dbp) return dbp;
  dbp = new Promise(resolve => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const rq = indexedDB.open(DB, 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => resolve(null);
      rq.onblocked = () => resolve(null);
    } catch (e) { resolve(null); }
  });
  return dbp;
}
async function idb(mode, fn) {
  const db = await openDB(); if (!db) throw new Error('no-idb');
  return new Promise((res, rej) => { const tx = db.transaction(STORE, mode); const st = tx.objectStore(STORE); const r = fn(st); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
}
const ls = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } };
async function rawGet(key) {
  try { const v = await idb('readonly', st => st.get(key)); backend = 'indexeddb'; return v == null ? null : v; }
  catch (e) { const L = ls(); if (!L) { backend = 'none'; return null; } backend = 'localstorage'; return L.getItem('fwc:' + key); }
}
async function rawPut(key, val) {
  try { await idb('readwrite', st => st.put(val, key)); backend = 'indexeddb'; return true; }
  catch (e) { const L = ls(); if (!L) { backend = 'none'; return false; } try { L.setItem('fwc:' + key, val); backend = 'localstorage'; return true; } catch (e2) { return false; } }
}
async function rawDel(key) { try { await idb('readwrite', st => st.delete(key)); } catch (e) { const L = ls(); if (L) L.removeItem('fwc:' + key); } }
export const storageBackend = () => backend;

export function envelope(state) {
  const data = JSON.stringify(state);
  return JSON.stringify({ format: 'fw-career-save', version: SAVE_VERSION, engine: ENGINE_VERSION, savedAt: new Date().toISOString(), checksum: hashStr(data).toString(16), size: data.length, data });
}
export function openEnvelope(text) {
  let env; try { env = typeof text === 'string' ? JSON.parse(text) : text; } catch (e) { throw new Error('Not a valid JSON file.'); }
  if (!env || env.format !== 'fw-career-save' || typeof env.data !== 'string') throw new Error('Not a Football Wars career save.');
  if (hashStr(env.data).toString(16) !== env.checksum) throw new Error('Save is corrupted (checksum mismatch).');
  if (env.version > SAVE_VERSION) throw new Error('Save was made by a newer version of the game.');
  const state = migrate(JSON.parse(env.data), env.version);
  const v = validateState(state); if (!v.ok) throw new Error('Invalid save: ' + v.reason);
  return { state, meta: { savedAt: env.savedAt, version: env.version, engine: env.engine } };
}
export function migrate(state, fromVersion) { /* v1 is the first release; future migrations go here */ void fromVersion; return state; }
export function validateState(S) {
  const t = (c, r) => { if (!c) throw new Error(r); };
  try {
    t(S && S.format === 'fw-career', 'format'); t(Number.isInteger(S.season) && S.season >= 1, 'season'); t(Number.isInteger(S.week) && S.week >= 1 && S.week <= 39, 'week');
    t(S.clubs && typeof S.clubs === 'object', 'clubs'); const ids = Object.keys(S.clubs); t(ids.length === 200, 'club count');
    t(S.clubs[S.playerId] && !S.clubs[S.playerId].ai, 'player club');
    for (let d = 1; d <= 10; d++) t(Array.isArray(S.divisions[d]) && S.divisions[d].length === 20, 'division ' + d);
    t(new Set(Object.values(S.divisions).flat()).size === 200, 'division membership');
    for (const c of Object.values(S.clubs)) {
      t(typeof c.name === 'string' && c.name.length > 0 && c.name.length <= 40, 'club name');
      t(Number.isFinite(c.budget), 'budget'); t(Array.isArray(c.groups) && Array.isArray(c.stars), 'squad');
      const n = c.groups.reduce((a, g) => a + g.count, 0); t(n >= 100 && n <= 104, 'standard squad size ' + c.id);
      t(c.stars.length <= 8, 'star limit'); for (const id of c.stars) t(S.stars[id] && S.stars[id].clubId === c.id, 'star ownership ' + id);
    }
    t(S.fixtures && typeof S.fixtures === 'object' && S.cups && typeof S.cups === 'object', 'competitions');
    return { ok: true };
  } catch (e) { return { ok: false, reason: e.message }; }
}
export async function saveSlot(slot, state) {
  const text = envelope(state);
  const prev = await rawGet('slot' + slot);
  if (prev) { try { openEnvelope(prev); await rawPut('slot' + slot + '.prev', prev); } catch (e) { /* never back up a broken save over a good backup */ } }
  const ok = await rawPut('slot' + slot, text);
  if (!ok) throw new Error('Storage is not available in this browser context. Use "Export JSON" to keep your career.');
  await rawPut('meta' + slot, JSON.stringify(slotMeta(state)));
  return { ok: true, backend };
}
export function slotMeta(S) { const P = S.clubs[S.playerId]; return { club: P.name, short: P.short, season: S.season, week: S.week, div: P.division, budget: P.budget, savedAt: new Date().toISOString(), kit: P.kit }; }
export async function loadSlot(slot) {
  const text = await rawGet('slot' + slot);
  if (!text) return null;
  try { return { ...openEnvelope(text), slot, recovered: false }; }
  catch (e) {
    const prev = await rawGet('slot' + slot + '.prev');
    if (prev) { const r = openEnvelope(prev); return { ...r, slot, recovered: true, error: e.message }; }
    throw e;
  }
}
export async function slotInfo(slot) { const m = await rawGet('meta' + slot); try { return m ? JSON.parse(m) : null; } catch (e) { return null; } }
export async function deleteSlot(slot) { await rawDel('slot' + slot); await rawDel('slot' + slot + '.prev'); await rawDel('meta' + slot); }
export function exportJSON(state) { return envelope(state); }
export function importJSON(text) { return openEnvelope(text); }
