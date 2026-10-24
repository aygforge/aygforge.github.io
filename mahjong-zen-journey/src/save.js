/*
 * Mahjong: Zen Journey — SaveManager.
 * IndexedDB is the primary store with localStorage as a synchronous mirror
 * and fallback. Every record is a versioned JSON document; on load the newest
 * valid copy wins. Export/import uses plain JSON files.
 */
(function (root) {
  'use strict';
  const P = root.MJProgress;
  const LS_KEY = 'mahjong-zen-journey/save';
  const LS_BACKUP = 'mahjong-zen-journey/save.bak';
  const DB_NAME = 'mahjong-zen-journey';
  const STORE = 'kv';

  function lsGet(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { root.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { root.localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }

  class SaveManager {
    constructor() {
      this.db = null;
      this.data = P.defaultSave();
      this.timer = null;
      this.status = { idb: false, ls: false };
    }
    _openDB() {
      return new Promise((resolve) => {
        let req;
        try { req = root.indexedDB && root.indexedDB.open(DB_NAME, 1); } catch (e) { req = null; }
        if (!req) return resolve(null);
        const done = setTimeout(() => resolve(null), 2500); // some iframes hang
        req.onupgradeneeded = () => { try { req.result.createObjectStore(STORE); } catch (e) { /* exists */ } };
        req.onsuccess = () => { clearTimeout(done); resolve(req.result); };
        req.onerror = () => { clearTimeout(done); resolve(null); };
        req.onblocked = () => { clearTimeout(done); resolve(null); };
      });
    }
    _idbGet() {
      return new Promise((resolve) => {
        if (!this.db) return resolve(null);
        try {
          const r = this.db.transaction(STORE, 'readonly').objectStore(STORE).get('save');
          r.onsuccess = () => resolve(r.result || null);
          r.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }
    _idbPut(json) {
      return new Promise((resolve) => {
        if (!this.db) return resolve(false);
        try {
          const tx = this.db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(json, 'save');
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (e) { resolve(false); }
      });
    }
    async load() {
      this.db = await this._openDB();
      const candidates = [];
      const tryParse = (txt, src) => {
        if (!txt) return;
        try { candidates.push({ save: P.sanitizeSave(txt), src }); } catch (e) { /* ignore corrupt copy */ }
      };
      tryParse(await this._idbGet(), 'idb');
      tryParse(lsGet(LS_KEY), 'ls');
      tryParse(lsGet(LS_BACKUP), 'backup');
      candidates.sort((a, b) => b.save.updatedAt - a.save.updatedAt);
      if (candidates.length) this.data = candidates[0].save;
      this.status.idb = !!this.db;
      this.status.ls = lsSet(LS_KEY + '.probe', '1');
      lsDel(LS_KEY + '.probe');
      this.loadedFrom = candidates.length ? candidates[0].src : 'new';
      return this.data;
    }
    get persistent() { return this.status.idb || this.status.ls; }
    // Debounced write for frequent changes; flush() for critical moments.
    save(immediate) {
      this.data.updatedAt = Date.now();
      if (immediate) return this.flush();
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 400);
      return Promise.resolve();
    }
    flush() {
      clearTimeout(this.timer); this.timer = null;
      this.data.updatedAt = Date.now();
      const json = JSON.stringify(this.data);
      const prev = lsGet(LS_KEY);
      if (prev && prev !== json) lsSet(LS_BACKUP, prev);
      lsSet(LS_KEY, json);
      return this._idbPut(json);
    }
    exportJSON() {
      const copy = JSON.parse(JSON.stringify(this.data));
      copy.exportedAt = new Date().toISOString();
      return JSON.stringify(copy, null, 1);
    }
    exportFileName() {
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      return `mahjong-zen-journey-save-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
    }
    // Returns sanitized data or throws Error(message).
    parseImport(text) {
      if (typeof text !== 'string' || text.length > 5e6) throw new Error('The file is too large to be a save.');
      return P.sanitizeSave(text);
    }
    replace(data) {
      this.data = data;
      return this.flush();
    }
    reset() {
      const keep = this.data.settings;
      this.data = P.defaultSave();
      this.data.settings = keep;
      lsDel(LS_BACKUP);
      return this.flush();
    }
  }

  root.MJSave = { SaveManager };
}(typeof globalThis !== 'undefined' ? globalThis : this));
