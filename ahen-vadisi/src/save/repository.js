// SaveRepository — IndexedDB birincil saklama, tek transaction'da atomik yazım,
// iki önceki sağlam snapshot, localStorage yedek yolu.
import { wrap, unwrap } from './serialize.js';
import { SCHEMA_VERSION } from '../data/constants.js';

const DB_NAME = 'ahen-vadisi';
const STORE = 'kv';
const SNAPSHOT_INTERVAL = 120000; // ms
const LS_KEY = 'ahen-vadisi:profile';

export class SaveRepository {
  constructor(idb = (typeof indexedDB !== 'undefined' ? indexedDB : null)) {
    this.idb = idb;
    this.db = null;
    this.mode = 'none';
    this.lastSnapshotAt = 0;
    this.failNext = 0; // geliştirici: kayıt hatası testi
    this.lastError = null;
  }

  async open() {
    if (this.db || this.mode === 'local') return this.mode;
    if (this.idb) {
      try {
        this.db = await new Promise((resolve, reject) => {
          const req = this.idb.open(DB_NAME, 1);
          req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
          req.onblocked = () => reject(new Error('blocked'));
        });
        this.mode = 'idb';
        return this.mode;
      } catch (e) {
        this.lastError = e;
      }
    }
    this.mode = typeof localStorage !== 'undefined' ? 'local' : 'memory';
    this.mem = this.mem || {};
    return this.mode;
  }

  _get(tx, key) {
    return new Promise((resolve, reject) => {
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  // Profil zarfını atomik yaz; gerekirse snapshot döndür
  async save(profile, { forceSnapshot = false } = {}) {
    await this.open();
    if (this.failNext > 0) {
      this.failNext--;
      const err = new Error('Simüle edilmiş kayıt hatası');
      this.lastError = err;
      throw err;
    }
    profile.commit = (profile.commit || 0) + 1;
    const env = wrap(profile);
    const now = Date.now();
    const doSnap = forceSnapshot || now - this.lastSnapshotAt > SNAPSHOT_INTERVAL;
    if (this.mode === 'idb') {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE, 'readwrite');
        const st = tx.objectStore(STORE);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('abort'));
        if (doSnap) {
          const g0 = st.get('profile');
          g0.onsuccess = () => {
            const prev = g0.result;
            if (prev && unwrap(prev).ok) {
              const g1 = st.get('snap_0');
              g1.onsuccess = () => {
                if (g1.result) st.put(g1.result, 'snap_1');
                st.put(prev, 'snap_0');
                st.put(env, 'profile');
              };
            } else st.put(env, 'profile');
          };
        } else {
          st.put(env, 'profile');
        }
      });
    } else {
      const store = this._ls();
      if (doSnap) {
        const prev = store.get('profile');
        if (prev && unwrap(prev).ok) {
          const s0 = store.get('snap_0');
          if (s0) store.set('snap_1', s0);
          store.set('snap_0', prev);
        }
      }
      store.set('profile', env);
    }
    if (doSnap) this.lastSnapshotAt = now;
    this.lastError = null;
    return env;
  }

  _ls() {
    const mem = this.mem || (this.mem = {});
    const ok = this.mode === 'local';
    return {
      get: (k) => {
        if (!ok) return mem[k];
        try { const v = localStorage.getItem(`${LS_KEY}:${k}`); return v ? JSON.parse(v) : null; } catch { return null; }
      },
      set: (k, v) => {
        if (!ok) { mem[k] = v; return; }
        localStorage.setItem(`${LS_KEY}:${k}`, JSON.stringify(v));
      },
    };
  }

  async readRaw(key) {
    await this.open();
    if (this.mode === 'idb') {
      const tx = this.db.transaction(STORE, 'readonly');
      return this._get(tx, key);
    }
    return this._ls().get(key);
  }

  async writeRaw(key, env) {
    await this.open();
    if (this.mode === 'idb') {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE).put(env, key);
      });
    } else this._ls().set(key, env);
  }

  // Yükle: ana kayıt bozuksa snapshot'lardan kurtar.
  // Eski sürüm kaydı ilk kez açılırken dokunulmamış zarf 'v<N>_backup' anahtarına bir kez kopyalanır.
  async load() {
    const tried = [];
    for (const key of ['profile', 'snap_0', 'snap_1']) {
      const env = await this.readRaw(key);
      if (!env) { tried.push({ key, msg: 'yok' }); continue; }
      const r = unwrap(env);
      if (r.ok && env.schemaVersion < SCHEMA_VERSION) {
        const bkey = `v${env.schemaVersion}_backup`;
        try { if (!(await this.readRaw(bkey))) await this.writeRaw(bkey, env); } catch (e) { this.lastError = e; }
        return { profile: r.profile, source: key, tried, savedAt: env.savedAt, migratedFrom: env.schemaVersion };
      }
      if (r.ok) return { profile: r.profile, source: key, tried, savedAt: env.savedAt };
      tried.push({ key, msg: r.msg });
    }
    return { profile: null, source: null, tried };
  }

  async listSnapshots() {
    const out = [];
    for (const key of ['profile', 'snap_0', 'snap_1', 'v1_backup']) {
      const env = await this.readRaw(key);
      if (!env) continue;
      const r = unwrap(env);
      out.push({ key, savedAt: env.savedAt, ok: r.ok, msg: r.msg, chars: r.ok ? r.profile.characters.filter(Boolean).map((c) => `${c.name} Lv.${c.level}`) : [] });
    }
    return out;
  }

  async restoreSnapshot(key) {
    const env = await this.readRaw(key);
    const r = unwrap(env);
    if (!r.ok) return r;
    await this.save(r.profile, { forceSnapshot: true });
    return { ok: true, profile: r.profile };
  }
}
