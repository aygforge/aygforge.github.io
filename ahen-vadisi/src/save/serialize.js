// Kayıt şeması, bütünlük kontrolü, doğrulama ve sürüm geçişi.
import { SCHEMA_VERSION, CHAR_SLOTS, SLOTS, MAX_LEVEL, STORAGE_START, BAG_STEPS, STORAGE_MAX } from '../data/constants.js';
import { ITEMS } from '../data/items.js';
import { STACKABLES } from '../data/materials.js';
import { CLASSES } from '../data/classes.js';
import { MAPS } from '../data/maps/index.js';
import { makeContainer } from '../systems/inventory.js';
import { makeUid } from '../core/rng.js';
import { ensureV2Fields } from '../systems/character.js';
import { CLASS_SKILLS } from '../data/skills.js';

export const APP_ID = 'ahen-vadisi';

export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function newProfile() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profileId: makeUid('p'),
    characters: new Array(CHAR_SLOTS).fill(null),
    storage: makeContainer(STORAGE_START),
    settings: defaultSettings(),
    commit: 0,
  };
}

export function defaultSettings() {
  return {
    sound: true, sfxVol: 0.8, musicVol: 0.45, ambientVol: 0.5, music: true,
    lowPerf: false, zoom: 'normal', damageNumbers: true, shake: true, fullscreen: true,
    joystickSize: 'normal', showFps: false, questGuide: true, heroLook: 'sprite',
  };
}

export function wrap(profile) {
  const data = JSON.stringify(profile);
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    savedAt: Date.now(),
    commit: profile.commit,
    checksum: fnv1a(data),
    data,
  };
}

export function unwrap(env) {
  if (!env || env.app !== APP_ID) return { ok: false, msg: 'Ahen Vadisi kaydı değil' };
  if (typeof env.data !== 'string') return { ok: false, msg: 'Bozuk kayıt' };
  if (fnv1a(env.data) !== env.checksum) return { ok: false, msg: 'Bütünlük kontrolü başarısız (checksum)' };
  let profile;
  try { profile = JSON.parse(env.data); } catch { return { ok: false, msg: 'JSON çözümlenemedi' }; }
  const mig = migrate(profile, env.schemaVersion);
  if (!mig.ok) return mig;
  const v = validateProfile(mig.profile);
  if (!v.ok) return { ok: false, msg: 'Geçersiz kayıt: ' + v.errors.slice(0, 3).join('; ') };
  return { ok: true, profile: mig.profile };
}

export function migrate(profile, fromVersion) {
  if (fromVersion > SCHEMA_VERSION) return { ok: false, msg: 'Kayıt daha yeni bir oyun sürümünden' };
  if (!isNum(fromVersion) || fromVersion < 1) return { ok: false, msg: 'Kayıt sürümü okunamadı' };
  profile.settings = { ...defaultSettings(), ...(profile.settings || {}) };
  // V1 → V2: karakterlere yeni alanlar eklenir (beceri çubuğu, Av Geçmişi, zindan koşuları, dünya bayrakları).
  // Hiçbir V1 alanı silinmez ya da değiştirilmez; geçişten önceki kayıt depoda 'v1_backup' olarak saklanır.
  if (Array.isArray(profile.characters)) {
    for (const ch of profile.characters) if (ch && CLASS_SKILLS[ch.cls]) ensureV2Fields(ch, false);
  }
  if (fromVersion < 2) profile.migratedFrom = fromVersion;
  profile.schemaVersion = SCHEMA_VERSION;
  return { ok: true, profile };
}

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

function validateItem(it, errors, where) {
  if (!it || typeof it !== 'object') { errors.push(`${where}: boş`); return; }
  if (typeof it.uid !== 'string') errors.push(`${where}: uid`);
  if (it.q !== undefined) {
    if (!STACKABLES[it.tid]) errors.push(`${where}: bilinmeyen istif ${it.tid}`);
    if (!isNum(it.q) || it.q < 1 || it.q > 99) errors.push(`${where}: miktar`);
    return;
  }
  const t = ITEMS[it.tid];
  if (!t) { errors.push(`${where}: bilinmeyen eşya ${it.tid}`); return; }
  if (!t.allowedRarities.includes(it.r)) errors.push(`${where}: nadirlik`);
  if (!isNum(it.p) || it.p < 0 || it.p > 5) errors.push(`${where}: yükseltme`);
  if (!isNum(it.d) || it.d < 0 || it.d > 100) errors.push(`${where}: dayanıklılık`);
  if (!Array.isArray(it.b)) errors.push(`${where}: bonus`);
}

function validateContainer(c, errors, where, sizes) {
  if (!c || !Array.isArray(c.slots) || !isNum(c.size)) { errors.push(`${where}: konteyner`); return; }
  if (sizes && !sizes.includes(c.size)) errors.push(`${where}: boyut`);
  c.slots.forEach((s, i) => { if (s) validateItem(s, errors, `${where}[${i}]`); });
}

export function validateChar(ch, errors, where = 'karakter') {
  if (!ch || typeof ch !== 'object') { errors.push(where); return; }
  if (!CLASSES[ch.cls]) errors.push(`${where}: sınıf`);
  if (!isNum(ch.level) || ch.level < 1 || ch.level > MAX_LEVEL) errors.push(`${where}: seviye`);
  if (!isNum(ch.exp) || ch.exp < 0) errors.push(`${where}: exp`);
  if (!isNum(ch.gold) || ch.gold < 0) errors.push(`${where}: gold`);
  if (typeof ch.name !== 'string' || !ch.name) errors.push(`${where}: isim`);
  for (const s of SLOTS) if (ch.equipment?.[s]) validateItem(ch.equipment[s], errors, `${where}.${s}`);
  validateContainer(ch.bag, errors, `${where}.çanta`, BAG_STEPS);
  if (!Array.isArray(ch.pending)) errors.push(`${where}: bekleyen`);
  else ch.pending.forEach((p, i) => validateItem(p, errors, `${where}.bekleyen[${i}]`));
  if (!ch.world || !MAPS[ch.world.map]) errors.push(`${where}: dünya`);
  if (ch.skillBar !== undefined) {
    const acts = CLASS_SKILLS[ch.cls]?.actives || [];
    if (!Array.isArray(ch.skillBar) || ch.skillBar.length !== 4 || ch.skillBar.some((id) => !acts.includes(id)) || new Set(ch.skillBar).size !== 4) errors.push(`${where}: beceri çubuğu`);
  }
  // benzersiz uid
  const seen = new Set();
  const all = [...(ch.bag?.slots || []), ...Object.values(ch.equipment || {}), ...(ch.pending || [])].filter(Boolean);
  for (const it of all) {
    if (seen.has(it.uid)) errors.push(`${where}: çift uid ${it.uid}`);
    seen.add(it.uid);
  }
}

export function validateProfile(p) {
  const errors = [];
  if (!p || typeof p !== 'object') return { ok: false, errors: ['profil yok'] };
  if (!Array.isArray(p.characters) || p.characters.length !== CHAR_SLOTS) errors.push('karakter yuvaları');
  else p.characters.forEach((c, i) => { if (c) validateChar(c, errors, `yuva${i + 1}`); });
  validateContainer(p.storage, errors, 'depo', [STORAGE_START, STORAGE_MAX]);
  return { ok: errors.length === 0, errors };
}

export function exportJson(profile) {
  return JSON.stringify(wrap(profile), null, 0);
}

export function importJson(text) {
  let env;
  try { env = JSON.parse(text); } catch { return { ok: false, msg: 'Dosya JSON değil' }; }
  return unwrap(env);
}
