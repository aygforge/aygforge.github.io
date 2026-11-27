// SaveService — şema versiyonlu yerel kayıt, sağlama toplamı, yedek ve kontrollü sıfırlama.
export const SCHEMA_VERSION = 1;
export const SAVE_KEY = 'kepceUstasi.save.v1';
export const BACKUP_KEY = 'kepceUstasi.save.v1.bak';

import { defaultEnergy } from './EnergyService.js';

// Alpha 0.4A fields (data/alpha04_progression_economy.json -> saveMigration.newSaveFields)
function alpha04Fields(now = Date.now()) {
  return {
    dataVersion: 5,
    stageProgress: { highestUnlocked: 1, levels: {} }, // new 20-level track always starts at L1
    energy: defaultEnergy(now),
    equipment: { weapon: 'common', ladle: 'common', apron: 'common', pan: 'common' }, // 0.4B uses these
    dungeonDaily: { day: '', fullUsed: {}, cleared: {} },
    currencyParts: 0,
    legacyCompletedChapters: [],
    unlockEvents: [], // [{ id, level, at }] recorded once (L7 gold_kitchen, L10, L15 depot, L16 rare_crafting, L20)
    pendingGrants: [], // e.g. materials_starter_grant_18 -> paid out by settleGrants (0.4B)
    paidGrants: [],
    // V1.0 (dataVersion 6): added with defaults, never overwriting stored values
    equipLevels: { weapon: 0, ladle: 0, apron: 0, pan: 0 },
    bossSeals: 0,
    bossKitchen: { week: '', wins: 0, total: 0 },
    tower: { best: 0, milestones: [] },
    quests: { day: '', week: '', daily: {}, weekly: {}, claimed: [] },
    iap: { entitlements: [], tokens: [] },
    monet: { completedRuns: 0, sinceInterstitial: 0, lastInterstitialAt: 0, adRewardIds: [], tipBonusRuns: [] },
  };
}

// Idempotent Alpha 0.1–0.3 -> 0.4A migration: never touches tips/upgrades/settings/legacy chapter stars.
export function migrateToAlpha04(s, now = Date.now()) {
  const f = alpha04Fields(now);
  for (const k of Object.keys(f)) if (s[k] === undefined) s[k] = f[k];
  s.stageProgress.levels ||= {};
  s.stageProgress.highestUnlocked ||= 1;
  // Alpha 0.5A: a save that already cleared L20 (old track end) opens L21 — nothing else changes
  if (s.stageProgress.levels[20]?.cleared) s.stageProgress.highestUnlocked = Math.max(s.stageProgress.highestUnlocked, 21);
  const e = s.energy;
  for (const [k, v] of Object.entries(defaultEnergy(now))) if (e[k] === undefined) e[k] = v;
  const legacy = Object.entries(s.chapters || {}).filter(([, c]) => c && c.cleared).map(([id]) => id);
  for (const id of legacy) if (!s.legacyCompletedChapters.includes(id)) s.legacyCompletedChapters.push(id);
  // Alpha 0.4B: fill equipment slots, dungeon daily object; pay grants recorded by a 0.4A save (once)
  s.equipment = { weapon: 'common', ladle: 'common', apron: 'common', pan: 'common', ...(s.equipment || {}) };
  s.dungeonDaily = { day: '', fullUsed: {}, cleared: {}, ...(s.dungeonDaily || {}) };
  s.paidGrants ||= [];
  for (const id of s.pendingGrants || []) {
    if (s.paidGrants.includes(id)) continue;
    const m = /_grant_(\d+)$/.exec(id);
    if (m) s.currencyParts += Number(m[1]);
    s.paidGrants.push(id);
  }
  s.pendingGrants = [];
  s.settings.language ||= 'tr';
  s.dataVersion = 6; // V1.0
  return s;
}

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
    ...alpha04Fields(),
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
    // keep the stored Alpha 0.4 objects (or let migration create them) instead of the fresh defaults
    stageProgress: s.stageProgress,
    energy: s.energy,
    equipment: s.equipment,
    dungeonDaily: s.dungeonDaily,
    currencyParts: s.currencyParts,
    legacyCompletedChapters: s.legacyCompletedChapters,
    unlockEvents: s.unlockEvents,
    pendingGrants: s.pendingGrants,
    paidGrants: s.paidGrants,
    dataVersion: s.dataVersion,
    // V1.0 objects: stored value or (missing) filled by migration
    equipLevels: s.equipLevels, bossSeals: s.bossSeals, bossKitchen: s.bossKitchen, tower: s.tower, quests: s.quests, iap: s.iap, monet: s.monet,
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
      return validate(s) ? { save: migrateToAlpha04(merge(s)) } : { corrupt: true };
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
