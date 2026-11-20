// SaveService — şema versiyonlu yerel kayıt, sağlama toplamı, yedek ve kontrollü sıfırlama.
export const SCHEMA_VERSION = 1;
export const SAVE_KEY = 'kepceUstasi.save.v1';
export const BACKUP_KEY = 'kepceUstasi.save.v1.bak';

export function defaultSave() {
  return {
    schemaVersion: SCHEMA_VERSION,
    tips: 0,
    upgrades: { capacity: 1, width: 1, toughness: 1, mastery: 1, pan: 1, spice: 1 },
    highestUnlocked: 1,
    chapters: {},
    settings: { sound: true, volume: 0.8, music: true, vibration: true, lowMotion: false, animSpeed: 1 },
    tutorialDone: false,
    claimedRuns: [],
    activeRun: null,
    stats: { runs: 0, wins: 0 },
  };
}

function checksum(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function validate(s) {
  if (!s || typeof s !== 'object') return false;
  if (s.schemaVersion !== SCHEMA_VERSION) return false;
  if (!Number.isFinite(s.tips) || s.tips < 0) return false;
  if (!s.upgrades || typeof s.upgrades !== 'object') return false;
  for (const v of Object.values(s.upgrades)) if (!Number.isInteger(v) || v < 1 || v > 6) return false;
  if (!Array.isArray(s.claimedRuns)) return false;
  return true;
}

function merge(s) {
  const d = defaultSave();
  return {
    ...d,
    ...s,
    upgrades: { ...d.upgrades, ...s.upgrades },
    settings: { ...d.settings, ...s.settings },
    stats: { ...d.stats, ...s.stats },
    chapters: { ...s.chapters },
  };
}

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

export class SaveService {
  constructor(storage) {
    this.storage = storage || SaveService.defaultStorage();
    this.notice = null;
  }

  static defaultStorage() {
    try {
      const ls = globalThis.localStorage;
      const t = '__kepce_test__';
      ls.setItem(t, '1');
      ls.removeItem(t);
      return ls;
    } catch {
      return memoryStorage();
    }
  }

  _read(key) {
    try {
      const raw = this.storage.getItem(key);
      if (!raw) return null;
      const env = JSON.parse(raw);
      if (!env || typeof env.data !== 'string' || checksum(env.data) !== env.sum) return { corrupt: true };
      const s = JSON.parse(env.data);
      return validate(s) ? { save: merge(s) } : { corrupt: true };
    } catch {
      return { corrupt: true };
    }
  }

  load() {
    const main = this._read(SAVE_KEY);
    if (main && main.save) return main.save;
    const bak = this._read(BACKUP_KEY);
    if (bak && bak.save) {
      this.notice = 'Kayıt bozuktu; son geçerli yedek yüklendi.';
      return bak.save;
    }
    if (main && main.corrupt) this.notice = 'Kayıt okunamadı; yeni kayıt başlatıldı.';
    return defaultSave();
  }

  // Atomic write: serialize fully first, keep the previous good copy as backup, then replace.
  save(s) {
    const data = JSON.stringify(s);
    const env = JSON.stringify({ sum: checksum(data), data });
    try {
      const prev = this.storage.getItem(SAVE_KEY);
      if (prev) this.storage.setItem(BACKUP_KEY, prev);
      this.storage.setItem(SAVE_KEY, env);
      return true;
    } catch {
      return false;
    }
  }

  reset() {
    try {
      this.storage.removeItem(SAVE_KEY);
      this.storage.removeItem(BACKUP_KEY);
    } catch {
      /* ignore */
    }
    return defaultSave();
  }
}
