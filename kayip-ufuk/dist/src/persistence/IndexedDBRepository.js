// IndexedDB save repository (SaveSchema v5): 3 slots, immutable revisions with checksum, 2 backup revisions,
// single-transaction commit, lease-based single writer per slot, JSON export/import, v1–v4 → v5 migration.
import { checksum, deepClone } from '../core/util.js';

export const DB_NAME = 'kayip_ufuk_saves';
export const DB_VERSION = 5;
export const SLOTS = ['slot-1', 'slot-2', 'slot-3'];
const STORES = ['saves', 'snapshots', 'pendingTransactions', 'backups', 'leases'];
const LEASE_MS = 15000;

function req(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function txDone(tx) { return new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('tx aborted')); }); }

/** Strip runtime-only keys (prefixed with "_") so snapshots are clean. */
export function cleanState(state) {
  return JSON.parse(JSON.stringify(state, (k, v) => (k.startsWith('_') ? undefined : v)));
}

export class IndexedDBRepository {
  constructor(idb = globalThis.indexedDB) { this.idb = idb; this.db = null; this.ownerId = `tab_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`; }

  async open() {
    if (this.db) return this.db;
    if (!this.idb) throw new Error('IndexedDB desteklenmiyor');
    const r = this.idb.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => { const db = r.result; for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: s === 'saves' || s === 'leases' ? 'saveSlotId' : 'id' }); };
    this.db = await req(r);
    return this.db;
  }

  async listSlots() {
    const db = await this.open(); const tx = db.transaction(['saves'], 'readonly');
    const all = await req(tx.objectStore('saves').getAll());
    return SLOTS.map((id) => all.find((s) => s.saveSlotId === id) || { saveSlotId: id, empty: true });
  }

  // ---------- lease (multi-tab single writer) ----------
  async acquireLease(slotId, force = false) {
    const db = await this.open(); const tx = db.transaction(['leases'], 'readwrite'); const st = tx.objectStore('leases');
    const cur = await req(st.get(slotId)); const now = Date.now();
    if (cur && cur.ownerId !== this.ownerId && now - cur.heartbeat < LEASE_MS && !force) { await txDone(tx).catch(() => {}); return { ok: false, ownerId: cur.ownerId }; }
    st.put({ saveSlotId: slotId, ownerId: this.ownerId, heartbeat: now });
    await txDone(tx);
    this.leaseSlot = slotId;
    return { ok: true };
  }
  async heartbeat() {
    if (!this.leaseSlot) return true;
    const db = await this.open(); const tx = db.transaction(['leases'], 'readwrite'); const st = tx.objectStore('leases');
    const cur = await req(st.get(this.leaseSlot));
    if (cur && cur.ownerId !== this.ownerId && Date.now() - cur.heartbeat < LEASE_MS) { await txDone(tx).catch(() => {}); this.leaseLost = true; return false; }
    st.put({ saveSlotId: this.leaseSlot, ownerId: this.ownerId, heartbeat: Date.now() });
    await txDone(tx);
    return true;
  }
  async releaseLease() {
    if (!this.leaseSlot) return;
    const db = await this.open(); const tx = db.transaction(['leases'], 'readwrite'); const st = tx.objectStore('leases');
    const cur = await req(st.get(this.leaseSlot));
    if (cur && cur.ownerId === this.ownerId) st.delete(this.leaseSlot);
    await txDone(tx); this.leaseSlot = null;
  }

  // ---------- save (one readwrite transaction for snapshot + slot pointer + backup) ----------
  async save(state, reason = 'manual', { requireLease = true } = {}) {
    if (requireLease && this.leaseSlot !== state.saveSlotId) throw new Error('LEASE_REQUIRED');
    if (requireLease && this.leaseLost) throw new Error('LEASE_LOST');
    const db = await this.open();
    const snap = cleanState(state);
    snap.revision = (snap.revision || 0) + 1;
    snap.lastSavedUtc = new Date().toISOString();
    const body = deepClone(snap);
    const sum = checksum(body);
    const id = `${snap.saveSlotId}:${snap.revision}`;
    const tx = db.transaction(['saves', 'snapshots', 'backups'], 'readwrite');
    const saves = tx.objectStore('saves'), snaps = tx.objectStore('snapshots'), backups = tx.objectStore('backups');
    const prev = await req(saves.get(snap.saveSlotId));
    snaps.put({ id, saveSlotId: snap.saveSlotId, revision: snap.revision, checksum: sum, reason, data: body });
    const keep = [snap.revision];
    if (prev && prev.revision) {
      const prevSnap = await req(snaps.get(`${snap.saveSlotId}:${prev.revision}`));
      if (prevSnap) backups.put({ ...prevSnap, id: `${snap.saveSlotId}:backup:${prev.revision}` });
      keep.push(prev.revision);
    }
    saves.put({ saveSlotId: snap.saveSlotId, revision: snap.revision, checksum: sum, slotDisplayName: snap.slotDisplayName, lastSavedUtc: snap.lastSavedUtc, day: snap.clock.dayIndex, scene: snap.player.sceneId, endings: snap.story.endingAchievements, reason, previousRevision: prev?.revision || null });
    await txDone(tx);
    await this.prune(snap.saveSlotId, keep);
    state.revision = snap.revision; state.lastSavedUtc = snap.lastSavedUtc;
    return { revision: snap.revision, checksum: sum };
  }

  async prune(slotId, keepRevs) {
    const db = await this.open(); const tx = db.transaction(['snapshots', 'backups'], 'readwrite');
    const snaps = tx.objectStore('snapshots'), backups = tx.objectStore('backups');
    const all = await req(snaps.getAll());
    for (const s of all) if (s.saveSlotId === slotId && !keepRevs.includes(s.revision)) snaps.delete(s.id);
    const bs = (await req(backups.getAll())).filter((b) => b.saveSlotId === slotId).sort((a, b) => b.revision - a.revision);
    for (const b of bs.slice(2)) backups.delete(b.id); // backupRevisions: 2
    await txDone(tx);
  }

  /** Load newest valid snapshot; if corrupt, fall back to newest valid backup and report it. */
  async load(slotId) {
    const db = await this.open(); const tx = db.transaction(['saves', 'snapshots', 'backups'], 'readonly');
    const meta = await req(tx.objectStore('saves').get(slotId));
    if (!meta) return { ok: false, code: 'EMPTY' };
    const cur = await req(tx.objectStore('snapshots').get(`${slotId}:${meta.revision}`));
    const backups = (await req(tx.objectStore('backups').getAll())).filter((b) => b.saveSlotId === slotId).sort((a, b) => b.revision - a.revision);
    const prevSnap = meta.previousRevision ? await req(tx.objectStore('snapshots').get(`${slotId}:${meta.previousRevision}`)) : null;
    const candidates = [cur, prevSnap, ...backups].filter(Boolean);
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (c.data && checksum(c.data) === c.checksum) return { ok: true, state: deepClone(c.data), recovered: i > 0, revision: c.revision };
    }
    return { ok: false, code: 'ALL_CORRUPT' };
  }

  async deleteSlot(slotId) {
    const db = await this.open(); const tx = db.transaction(STORES, 'readwrite');
    tx.objectStore('saves').delete(slotId);
    for (const s of ['snapshots', 'backups']) { const st = tx.objectStore(s); for (const r of await req(st.getAll())) if (r.saveSlotId === slotId) st.delete(r.id); }
    await txDone(tx);
  }

  /** Test helper for AT_PERSIST_02: corrupt newest snapshot body. */
  async corruptLatest(slotId) {
    const db = await this.open(); const tx = db.transaction(['saves', 'snapshots'], 'readwrite');
    const meta = await req(tx.objectStore('saves').get(slotId));
    const s = await req(tx.objectStore('snapshots').get(`${slotId}:${meta.revision}`));
    s.data.player.health = -999; tx.objectStore('snapshots').put(s);
    await txDone(tx);
  }

  exportJSON(state) {
    const body = cleanState(state);
    return JSON.stringify({ format: 'KAYIP_UFUK_SAVE', saveVersion: body.saveVersion, exportedUtc: new Date().toISOString(), checksum: checksum(body), data: body });
  }
  static parseImport(text) {
    let o; try { o = JSON.parse(text); } catch { return { ok: false, code: 'BAD_JSON' }; }
    if (o.format !== 'KAYIP_UFUK_SAVE' || !o.data) return { ok: false, code: 'BAD_FORMAT' };
    if (checksum(o.data) !== o.checksum) return { ok: false, code: 'CHECKSUM_MISMATCH' };
    return { ok: true, state: o.data };
  }
}
