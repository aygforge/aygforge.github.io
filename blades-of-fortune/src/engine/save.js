// Kayıt yöneticisi — Tides'ın Oi sınıfı (yedekli .bak yazım, sürümlü yükleme, dışa/içe aktarma) Blades'e özgü anahtarlarla.
export const SAVE_KEYS = { meta: 'bof.meta', run: 'bof.run', settings: 'bof.settings' };
export const SAVE_VERSION = 1;

export function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _map: m };
}
export function pickStorage() {
  try {
    const k = '__bof_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch { return memoryStorage(); }
}

export class SaveManager {
  constructor(storage, { migrateMeta, migrateRun, defaultSettings }) {
    this.s = storage; this.lastError = null;
    this.migrateMeta = migrateMeta; this.migrateRun = migrateRun; this.defaultSettings = defaultSettings;
  }
  _read(key) {
    for (const k of [key, key + '.bak']) {
      try {
        const raw = this.s.getItem(k);
        if (!raw) continue;
        const v = JSON.parse(raw);
        if (v && typeof v === 'object') return v;
      } catch (e) { this.lastError = e; }
    }
    return null;
  }
  _write(key, v) {
    try {
      const raw = JSON.stringify(v), old = this.s.getItem(key);
      if (old) this.s.setItem(key + '.bak', old);
      this.s.setItem(key, raw);
      return true;
    } catch (e) { this.lastError = e; return false; }
  }
  loadMeta() { return this.migrateMeta(this._read(SAVE_KEYS.meta)); }
  loadRun() {
    const r = this._read(SAVE_KEYS.run);
    if (!r) return null;
    try { return this.migrateRun(r); } catch (e) { this.lastError = e; return null; }
  }
  loadSettings() { return { ...this.defaultSettings(), ...(this._read(SAVE_KEYS.settings) || {}) }; }
  saveMeta(m) { return this._write(SAVE_KEYS.meta, m); }
  saveRun(r) {
    if (r) return this._write(SAVE_KEYS.run, r);
    this.s.removeItem(SAVE_KEYS.run); this.s.removeItem(SAVE_KEYS.run + '.bak');
    return true;
  }
  saveSettings(s) { return this._write(SAVE_KEYS.settings, s); }
  wipeAll() { for (const k of Object.values(SAVE_KEYS)) { this.s.removeItem(k); this.s.removeItem(k + '.bak'); } }
  exportString(meta, run, settings) {
    const payload = { game: 'BladesOfFortune', v: SAVE_VERSION, at: new Date().toISOString(), meta, run, settings };
    return 'BOF1:' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }
  parseImport(text) {
    try {
      const t = text.trim(), body = t.startsWith('BOF1:') ? t.slice(5) : t;
      const json = body.startsWith('{') ? body : decodeURIComponent(escape(atob(body)));
      const p = JSON.parse(json);
      if (p.game !== 'BladesOfFortune' || !p.meta) return { ok: false, reason: 'Bu bir Blades of Fortune kaydı değil.' };
      return { ok: true, meta: this.migrateMeta(p.meta), run: p.run ? this.migrateRun(p.run) : null, settings: p.settings || null };
    } catch { return { ok: false, reason: 'Kayıt metni okunamadı.' }; }
  }
}
