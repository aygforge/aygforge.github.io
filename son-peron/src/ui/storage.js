// IndexedDB tabanlı sürümlü kayıt deposu (birincil). Erişilemezse bellek içi yedeğe düşer.
const DB = 'son-peron', STORE = 'saves';
let mem = {};
function open() {
  return new Promise((res, rej) => { try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
}
async function tx(mode, fn) { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(STORE, mode); const rq = fn(t.objectStore(STORE)); t.oncomplete = () => res(rq?.result); t.onerror = () => rej(t.error); }); }
export async function put(slot, text) { try { await tx('readwrite', (s) => s.put(text, slot)); } catch { mem[slot] = text; } }
export async function get(slot) { try { return (await tx('readonly', (s) => s.get(slot))) ?? mem[slot] ?? null; } catch { return mem[slot] ?? null; } }
export async function del(slot) { try { await tx('readwrite', (s) => s.delete(slot)); } catch { delete mem[slot]; } }
export function getSettings() { try { return JSON.parse(localStorage.getItem('son-peron-settings')) || {}; } catch { return {}; } }
export function setSettings(o) { try { localStorage.setItem('son-peron-settings', JSON.stringify(o)); } catch { /* yoksay */ } }
