// Kayıt sistemi: kalıcı veri + aktif run + ayarlar. Sürüm numaralı, yedekli, dışa/içe aktarılabilir.
import { SAVE_VERSION } from '../config/balance.js';
import { createMeta, createSettings } from './GameState.js';
import { initRunX1, initMetaX1 } from '../systems/X1System.js';
import { initRunX2, initMetaX2 } from '../systems/X2System.js';

const KEYS = {
  meta: 'tof.meta',
  run: 'tof.run',
  settings: 'tof.settings',
};

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

export function browserStorage() {
  try {
    const t = '__tof_test__';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    return memoryStorage();
  }
}

function migrateMeta(m) {
  const base = createMeta();
  const out = { ...base, ...m, codex: { ...base.codex, ...(m.codex || {}) }, stats: { ...base.stats, ...(m.stats || {}) } };
  initMetaX1(out); // v5: genişleme alanları varsayılanlarla
  initMetaX2(out); // v6: Kaptanların Hikâyeleri (x1 alanlarına dokunmaz)
  out.v = SAVE_VERSION;
  return out;
}

function migrateRun(r) {
  if (!r || typeof r !== 'object') return null;
  if (r.v !== SAVE_VERSION) {
    // Eski sürüm aktif run'lar güvenli şekilde taşınamazsa düşürülür (kalıcı ilerleme korunur).
    if (r.v < 3) return null;
  }
  r.buffs = { luck: null, lucky: false, biscuit: false, nextRouteEvents: 0, rareNext: false, ...(r.buffs || {}) };
  r.pendingRoute ||= [];
  r.pendingArrival ||= [];
  r.pendingStatus ||= [];
  initRunX1(r); // v5: fraksiyon/sözleşme/Sonsuz Deniz alanları (eski pirateRep taşınır)
  initRunX2(r); // v6: Paket 2 run alanları
  r.v = SAVE_VERSION;
  return r;
}

export class SaveManager {
  constructor(storage) {
    this.s = storage;
    this.lastError = null;
  }

  _read(key) {
    for (const k of [key, key + '.bak']) {
      try {
        const raw = this.s.getItem(k);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') return data;
      } catch (e) {
        this.lastError = e;
      }
    }
    return null;
  }

  _write(key, value) {
    try {
      const json = JSON.stringify(value);
      const prev = this.s.getItem(key);
      if (prev) this.s.setItem(key + '.bak', prev);
      this.s.setItem(key, json);
      return true;
    } catch (e) {
      this.lastError = e;
      return false;
    }
  }

  loadMeta() {
    const m = this._read(KEYS.meta);
    return m ? migrateMeta(m) : createMeta();
  }

  loadRun() {
    const r = this._read(KEYS.run);
    return r ? migrateRun(r) : null;
  }

  loadSettings() {
    return { ...createSettings(), ...(this._read(KEYS.settings) || {}) };
  }

  saveMeta(meta) {
    return this._write(KEYS.meta, meta);
  }

  saveRun(run) {
    if (!run) {
      this.s.removeItem(KEYS.run);
      this.s.removeItem(KEYS.run + '.bak');
      return true;
    }
    return this._write(KEYS.run, run);
  }

  saveSettings(settings) {
    return this._write(KEYS.settings, settings);
  }

  wipeAll() {
    for (const k of Object.values(KEYS)) {
      this.s.removeItem(k);
      this.s.removeItem(k + '.bak');
    }
  }

  exportString(meta, run, settings) {
    const payload = { game: 'TidesOfFortune', v: SAVE_VERSION, at: new Date().toISOString(), meta, run, settings };
    const json = JSON.stringify(payload);
    return 'TOF1:' + btoa(unescape(encodeURIComponent(json)));
  }

  parseImport(str) {
    try {
      const s = str.trim();
      const body = s.startsWith('TOF1:') ? s.slice(5) : s;
      const json = body.startsWith('{') ? body : decodeURIComponent(escape(atob(body)));
      const p = JSON.parse(json);
      if (p.game !== 'TidesOfFortune' || !p.meta) return { ok: false, reason: 'Bu bir Tides of Fortune kaydı değil.' };
      return { ok: true, meta: migrateMeta(p.meta), run: p.run ? migrateRun(p.run) : null, settings: p.settings || null };
    } catch {
      return { ok: false, reason: 'Kayıt metni okunamadı.' };
    }
  }
}
