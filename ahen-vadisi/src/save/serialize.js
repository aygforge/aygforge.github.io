// Kayıt şeması, bütünlük kontrolü, doğrulama ve sürüm geçişi.
import { SCHEMA_VERSION, CHAR_SLOTS, SLOTS, MAX_LEVEL, STORAGE_START, BAG_STEPS, STORAGE_MAX, MAX_STACK } from '../data/constants.js';
import { ITEMS } from '../data/items.js';
import { STACKABLES } from '../data/materials.js';
import { CLASSES } from '../data/classes.js';
import { MAPS } from '../data/maps/index.js';
import { makeContainer } from '../systems/inventory.js';
import { makeUid } from '../core/rng.js';
import { ensureV2Fields, defaultSkillBar } from '../systems/character.js';
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

// meta: bütünlük alanının dışında küçük özet (karakter kimliği/seviyesi, bilinçli silinenler) — depo, yeni kaydın
// önceki kayda göre karakter kaybettirip kaybettirmediğini veriyi çözmeden denetler. Okumada yok sayılır.
export function wrap(profile) {
  const data = JSON.stringify(profile);
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    savedAt: Date.now(),
    commit: profile.commit,
    checksum: fnv1a(data),
    meta: {
      chars: (profile.characters || []).map((c) => (c ? { id: c.id, name: c.name, level: c.level, cls: c.cls } : null)),
      deleted: profile.deletedChars || [],
    },
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
  // V1 → V2 → V3: karakterlere yalnız yeni alanlar eklenir (beceri çubuğu, Av Geçmişi, zindan koşuları, dünya bayrakları;
  // V3: görev takip listesi, Ustalık II, kullanım eşyası etkileri). Hiçbir eski alan silinmez ya da değiştirilmez;
  // geçişten önceki kayıt depoda 'v<N>_backup' olarak bir kez saklanır (geri dönüş için).
  if (Array.isArray(profile.characters)) {
    for (const ch of profile.characters) if (ch && CLASS_SKILLS[ch.cls]) ensureV2Fields(ch, false);
  }
  if (fromVersion < SCHEMA_VERSION) profile.migratedFrom = fromVersion;
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

// ---------------------------------------------------------------------------------------------------------------
// Kurtarma (salvage): bütünlüğü sağlam ama doğrulamayı geçemeyen bir kayıt artık bütünüyle atılmaz.
// Yalnız sorunlu alan onarılır (sayı sınırları, bilinmeyen eşya, çift uid, beceri çubuğu, konteyner boyutu…);
// oynanamayacak durumdaki karakter (bilinmeyen sınıf / isimsiz) profilden çıkarılır ama ham kopyası depoda kalır.
// Döner: { ok, profile, fixes: [metin] }
export function repairProfile(profile) {
  const fixes = [];
  const fixItem = (it, where) => {
    if (!it || typeof it !== 'object') return null;
    if (it.q !== undefined) {
      if (!STACKABLES[it.tid]) { fixes.push(`${where}: bilinmeyen istif ${it.tid} çıkarıldı`); return null; }
      const q = Math.floor(Number(it.q));
      if (!Number.isFinite(q) || q < 1) { fixes.push(`${where}: boş istif çıkarıldı`); return null; }
      if (q > MAX_STACK) { fixes.push(`${where}: istif ${MAX_STACK}'a indirildi`); it.q = MAX_STACK; } else it.q = q;
      if (typeof it.uid !== 'string') it.uid = makeUid('s');
      return it;
    }
    const t = ITEMS[it.tid];
    if (!t) { fixes.push(`${where}: bilinmeyen eşya ${it.tid} çıkarıldı`); return null; }
    if (typeof it.uid !== 'string') it.uid = makeUid('i');
    if (!t.allowedRarities.includes(it.r)) { fixes.push(`${where}: nadirlik düzeltildi`); it.r = t.rarity; }
    const clamp = (v, lo, hi, d) => (isNum(v) ? Math.min(hi, Math.max(lo, v)) : d);
    it.p = clamp(it.p, 0, 5, 0); it.d = clamp(it.d, 0, 100, 100);
    if (!Array.isArray(it.b)) it.b = [];
    return it;
  };
  const fixContainer = (c, where, sizes) => {
    const items = (c && Array.isArray(c.slots) ? c.slots : []).map((x, i) => (x ? fixItem(x, `${where}[${i}]`) : null)).filter(Boolean);
    let size = isNum(c?.size) ? c.size : sizes[0];
    if (!sizes.includes(size)) { size = sizes.find((z) => z >= items.length) || sizes[sizes.length - 1]; fixes.push(`${where}: boyut ${size}`); }
    const slots = new Array(size).fill(null);
    const orig = c && Array.isArray(c.slots) ? c.slots : [];
    const placed = new Set();
    // eşyalar mümkünse eski yuvalarında kalır
    orig.forEach((x, i) => { if (x && i < size && items.includes(x)) { slots[i] = x; placed.add(x); } });
    const over = items.filter((x) => !placed.has(x));
    for (const x of over) { const fi = slots.indexOf(null); if (fi >= 0) slots[fi] = x; else { fixes.push(`${where}: yer olmayan eşya bekleyen listesine`); return { c: { size, slots }, overflow: over.slice(over.indexOf(x)) }; } }
    return { c: { size, slots }, overflow: [] };
  };
  if (!profile || typeof profile !== 'object') return { ok: false, fixes: ['profil yok'] };
  if (!Array.isArray(profile.characters)) { profile.characters = []; fixes.push('karakter listesi yeniden kuruldu'); }
  const chars = profile.characters.slice(0, CHAR_SLOTS);
  while (chars.length < CHAR_SLOTS) chars.push(null);
  profile.characters = chars;
  profile.characters.forEach((ch, idx) => {
    if (!ch) return;
    const where = `yuva${idx + 1}`;
    if (typeof ch !== 'object' || !CLASSES[ch.cls] || typeof ch.name !== 'string' || !ch.name) {
      fixes.push(`${where}: okunamayan karakter çıkarıldı (ham kopyası kurtarma kaydında)`);
      profile.characters[idx] = null;
      return;
    }
    if (!isNum(ch.level) || ch.level < 1) { ch.level = 1; fixes.push(`${where}: seviye`); }
    if (ch.level > MAX_LEVEL) { ch.level = MAX_LEVEL; fixes.push(`${where}: seviye ${MAX_LEVEL}`); }
    if (!isNum(ch.exp) || ch.exp < 0) { ch.exp = 0; fixes.push(`${where}: exp`); }
    if (!isNum(ch.gold) || ch.gold < 0) { ch.gold = 0; fixes.push(`${where}: gold`); }
    ch.equipment = ch.equipment && typeof ch.equipment === 'object' ? ch.equipment : {};
    const pending = Array.isArray(ch.pending) ? ch.pending.map((x, i) => fixItem(x, `${where}.bekleyen[${i}]`)).filter(Boolean) : [];
    for (const sl of SLOTS) {
      const it = ch.equipment[sl];
      if (!it) { ch.equipment[sl] = null; continue; }
      const f = fixItem(it, `${where}.${sl}`);
      if (f && f.q === undefined && ITEMS[f.tid].slot === sl) ch.equipment[sl] = f;
      else { ch.equipment[sl] = null; if (f) pending.push(f); }
    }
    const bag = fixContainer(ch.bag, `${where}.çanta`, BAG_STEPS);
    ch.bag = bag.c;
    pending.push(...bag.overflow.filter((x) => x.q === undefined));
    ch.pending = pending;
    if (!ch.world || typeof ch.world !== 'object') { ch.world = {}; fixes.push(`${where}: dünya`); }
    if (!MAPS[ch.world.map]) { const e = MAPS.village.entries.respawn; ch.world.map = 'village'; ch.world.x = e.x; ch.world.y = e.y; fixes.push(`${where}: konum köye alındı`); }
    if (ch.skillBar !== undefined) {
      const acts = CLASS_SKILLS[ch.cls]?.actives || [];
      if (!Array.isArray(ch.skillBar) || ch.skillBar.length !== 4 || ch.skillBar.some((id) => !acts.includes(id)) || new Set(ch.skillBar).size !== 4) {
        ch.skillBar = defaultSkillBar(ch); fixes.push(`${where}: beceri çubuğu varsayılana alındı`);
      }
    }
    // çift uid: eşya silinmez, yalnız yeni kimlik alır
    const seen = new Set();
    const all = [...ch.bag.slots, ...Object.values(ch.equipment), ...ch.pending].filter(Boolean);
    for (const it of all) {
      if (seen.has(it.uid)) { it.uid = makeUid(it.q !== undefined ? 's' : 'i'); fixes.push(`${where}: çift uid yenilendi`); }
      seen.add(it.uid);
    }
  });
  const st = fixContainer(profile.storage, 'depo', [STORAGE_START, STORAGE_MAX]);
  profile.storage = st.c;
  if (st.overflow.length) fixes.push(`depo: ${st.overflow.length} eşya sığmadı`);
  const v = validateProfile(profile);
  return { ok: v.ok, profile, fixes, errors: v.errors };
}

// Kurtarıcı açma: bütünlük (checksum) sağlamsa ve JSON okunuyorsa önce sıkı doğrulama, olmazsa onarım.
// Checksum tutmuyorsa (yarım yazım vb.) yine de JSON okunabiliyorsa onarım denenir ve bu durum bildirilir.
export function salvage(env) {
  if (!env || env.app !== APP_ID || typeof env.data !== 'string') return { ok: false, msg: 'Ahen Vadisi kaydı değil' };
  if (isNum(env.schemaVersion) && env.schemaVersion > SCHEMA_VERSION) return { ok: false, newer: true, msg: 'Kayıt daha yeni bir oyun sürümünden' };
  const strict = unwrap(env);
  if (strict.ok) return { ...strict, fixes: [] };
  let profile;
  try { profile = JSON.parse(env.data); } catch { return { ok: false, msg: 'JSON çözümlenemedi' }; }
  const checksumOk = fnv1a(env.data) === env.checksum;
  const mig = migrate(profile, isNum(env.schemaVersion) ? env.schemaVersion : 1);
  if (!mig.ok) return mig;
  const r = repairProfile(mig.profile);
  if (!r.ok) return { ok: false, msg: 'Onarılamadı: ' + r.errors.slice(0, 3).join('; ') };
  return { ok: true, profile: r.profile, fixes: checksumOk ? r.fixes : ['bütünlük kontrolü tutmadı; okunabilen veri kurtarıldı', ...r.fixes], repaired: true, checksumBad: !checksumOk };
}

export function exportJson(profile) {
  return JSON.stringify(wrap(profile), null, 0);
}

// İçe aktarma: bütünlüğü sağlam yedek kabul edilir (gerekirse küçük onarımla); değiştirilmiş (checksum tutmayan) yedek reddedilir.
export function importJson(text) {
  let env;
  try { env = JSON.parse(text); } catch { return { ok: false, msg: 'Dosya JSON değil' }; }
  const r = salvage(env);
  if (r.newer) return { ok: false, newer: true, msg: 'Bu yedek oyunun daha yeni bir sürümünden. Önce sayfayı yenileyip oyunu güncelle.' };
  if (r.ok && r.checksumBad) return { ok: false, msg: 'Bütünlük kontrolü başarısız (checksum)' };
  return r;
}

// ------------------------------------------------------------------ yedek kodu (kopyala / yapıştır)
// Biçim: "AHV1g:" + base64(gzip(JSON zarf)) ya da sıkıştırma yoksa "AHV1:" + base64(JSON zarf).
// itch.io gibi iframe ortamlarında dosya indirme engellenebildiği için metin olarak taşınabilir yedek.
const CODE_GZ = 'AHV1g:';
const CODE_RAW = 'AHV1:';

function bytesToB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function pipeBytes(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export async function encodeBackupCode(profile) {
  const bytes = new TextEncoder().encode(exportJson(profile));
  if (typeof CompressionStream !== 'undefined') {
    try { return CODE_GZ + bytesToB64(await pipeBytes(bytes, new CompressionStream('gzip'))); } catch { /* sıkıştırmasız */ }
  }
  return CODE_RAW + bytesToB64(bytes);
}

// Yedek kodu ya da düz JSON metni kabul eder; importJson ile aynı sonuç biçimini döndürür.
export async function decodeBackupCode(text) {
  const t = String(text || '').trim().replace(/\s+/g, '');
  if (!t) return { ok: false, msg: 'Kod boş' };
  if (t.startsWith('{')) return importJson(String(text).trim());
  try {
    if (t.startsWith(CODE_GZ)) {
      if (typeof DecompressionStream === 'undefined') return { ok: false, msg: 'Bu tarayıcı sıkıştırılmış kodu açamıyor' };
      return importJson(new TextDecoder().decode(await pipeBytes(b64ToBytes(t.slice(CODE_GZ.length)), new DecompressionStream('gzip'))));
    }
    if (t.startsWith(CODE_RAW)) return importJson(new TextDecoder().decode(b64ToBytes(t.slice(CODE_RAW.length))));
  } catch { return { ok: false, msg: 'Kod eksik ya da bozuk (tamamını kopyaladığından emin ol)' }; }
  return { ok: false, msg: 'Bu bir Ahen Vadisi yedek kodu değil' };
}
