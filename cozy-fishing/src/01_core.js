'use strict';
/* =====================================================================
   COZY FISHING — Tam Sürüm (tek dosya, çevrimdışı)
   01_core.js : Config / FishDB bağlantısı, yardımcılar, RNG, içerik verisi, GameState
   ===================================================================== */
const DB = window.FISHDB_DATA, CFG = window.GAMECONFIG_DATA, EXP = window.EXPANSION_DATA;
Object.assign(CFG.npc_dialogues, EXP.npc_dialogues);
const LW = CFG.platform.logical_resolution[0], LH = CFG.platform.logical_resolution[1];
const SCHEMA = 2;

/* ---------- Config: veri kaynaklarından türetilmiş tablolar ---------- */
const FISH_LIST = DB.fish;
const FISH = Object.fromEntries(DB.fish.map(f => [f.id, f]));
const SPOT_LIST = DB.spots;
const SPOTS = Object.fromEntries(DB.spots.map(s => [s.id, s]));
const REGIONS = DB.regions.map((r, i) => Object.assign({ idx: i }, CFG.regions.find(c => c.id === r.id), r));
const REGION = Object.fromEntries(REGIONS.map(r => [r.id, r]));
const RODS = CFG.shop.rods, LINES = CFG.shop.lines, REELS = CFG.shop.reels, HOOKS = CFG.shop.hooks, BAITS = CFG.shop.bait;
const GEAR = { rod: RODS, line: LINES, reel: REELS, hook: HOOKS };
const GEAR_TR = { rod: 'Olta', line: 'Misina', reel: 'Makara', hook: 'İğne' };
const BOATS = CFG.boats, BOAT = Object.fromEntries(BOATS.map(b => [b.id, b]));
const AUTOS = CFG.automation, AUTO = Object.fromEntries(AUTOS.map(a => [a.id, a]));
const CUSTOMERS = CFG.customers, CUST = Object.fromEntries(CUSTOMERS.map(c => [c.id, c]));
const EVENTS = CFG.events, EVENT = Object.fromEntries(EVENTS.map(e => [e.id, e]));
const ACHS = CFG.achievements.concat(EXP.achievements);
const FESTIVALS = EXP.festivals, RIVALS = EXP.rivals, SNACKS = EXP.snacks, COMP = EXP.competition;
const FEST = Object.fromEntries(FESTIVALS.map(f => [f.id, f]));
{ const a = ACHS.find(x => x.id === 'species42'); if (a) a.condition_tr = 'Tüm ' + DB.fish.length + ' türü keşfet'; }
const RC = CFG.reeling, CORE = CFG.core, INVC = CFG.inventory, K = DB.constants;
const STACK = INVC.fish_stack_per_slot;
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_TR = { spring: 'İlkbahar', summer: 'Yaz', autumn: 'Sonbahar', winter: 'Kış' };
const WEATHER_TR = { sunny: 'Güneşli', cloudy: 'Bulutlu', rain: 'Yağmurlu', fog: 'Sisli', wind: 'Rüzgârlı' };
const BAND_TR = { near: 'Yakın', mid: 'Orta', far: 'Uzak' };
const BAIT = Object.fromEntries(BAITS.map(b => [b.id, b]));
const PAID_BAITS = BAITS.filter(b => b.id !== 'basic').map(b => b.id);
const BAIT_HINT = { basic: 'Nötr, sınırsız; otomatikte kullanılamaz', worm: 'Küçük kıyı türleri', shrimp: 'Çipura, levrek ve dip türleri', fish: 'Yırtıcı türler', lure: 'Akıntı / açık su türleri', deep: 'Güçlü / derin türler' };
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
const ROMAN_S = ['', 'I', 'II', 'III', 'IV', 'V'];

/* Bölge erişim gereksinimleri — GameConfig.regions[].requirements metninin sayısal karşılığı (GDD 4.1) */
const REGION_REQ = {
  sakin_liman: { tier: 0, motor: 0, nav: 0 },
  yesil_koy: { tier: 1, motor: 1, nav: 0 },
  kayalik_adalar: { tier: 1, motor: 2, nav: 0 },
  serin_akintilar: { tier: 2, motor: 2, nav: 0 },
  sisli_kuzey: { tier: 2, motor: 3, nav: 1 },
  gunes_adalari: { tier: 3, motor: 4, nav: 1 },
  derin_mavi: { tier: 4, motor: 5, nav: 2 }
};
/* Teknelerin hazır navigasyon seviyesi (GameConfig yükseltme ağacından çıkarım: navigasyon_I olmayan tekneler I ile gelir) */
const BOAT_NAV0 = { coastal_skiff: 0, motorboat: 0, cabin: 1, offshore: 1 };
const UPG_TR = { motor: 'Motor', storage: 'Depo', navigation: 'Navigasyon', hull: 'Gövde' };

function parseUpg(key) {
  const i = key.indexOf('_'); const type = key.slice(0, i), v = key.slice(i + 1);
  return { type, val: ROMAN[v] != null ? ROMAN[v] : parseInt(v, 10) };
}
const BOAT_INFO = {};
BOATS.forEach((b, i) => {
  const ups = Object.entries(b.upgrades).map(([key, price]) => Object.assign({ key, price }, parseUpg(key)));
  ups.sort((a, c) => a.type < c.type ? -1 : a.type > c.type ? 1 : a.val - c.val);
  ups.forEach(u => { const prev = ups.filter(x => x.type === u.type && x.val < u.val).sort((a, c) => c.val - a.val)[0]; u.req = prev ? prev.key : null; });
  BOAT_INFO[b.id] = { tier: i + 1, nav0: BOAT_NAV0[b.id] || 0, ups };
});

/* İklim ağırlıkları (bölgesel hava, deterministik günlük) */
const CLIMATE = {
  sakin_liman: { sunny: 40, cloudy: 25, rain: 15, fog: 8, wind: 12 },
  yesil_koy: { sunny: 45, cloudy: 24, rain: 15, fog: 6, wind: 10 },
  kayalik_adalar: { sunny: 36, cloudy: 24, rain: 12, fog: 8, wind: 20 },
  serin_akintilar: { sunny: 24, cloudy: 26, rain: 14, fog: 6, wind: 30 },
  sisli_kuzey: { sunny: 12, cloudy: 25, rain: 18, fog: 35, wind: 10 },
  gunes_adalari: { sunny: 56, cloudy: 18, rain: 16, fog: 2, wind: 8 },
  derin_mavi: { sunny: 36, cloudy: 24, rain: 12, fog: 10, wind: 18 }
};
const SEASON_WX = {
  spring: { rain: 1.15 }, summer: { sunny: 1.4, rain: 0.6, fog: 0.7 },
  autumn: { wind: 1.3, cloudy: 1.2 }, winter: { rain: 1.35, fog: 1.3, sunny: 0.6, wind: 1.15 }
};
/* Olumsuz hava eşlemesi (GDD 4.2: olumlu ×1,10 / olumsuz ×0,90) */
const WX_BAD = { sunny: 'rain', cloudy: 'sunny', rain: 'sunny', fog: 'wind', wind: 'fog' };

/* ---------- Özgün kozmetik içerik (GDD 12.3, 13.2) ---------- */
const SKINS = [['#f6d7c0', '#e3b89d'], ['#eec4a2', '#d6a27f'], ['#d9a37c', '#bd845e'], ['#b97f58', '#9a6342'], ['#8d5a3b', '#71462d'], ['#5e3b27', '#4a2d1d']];
const HAIR_COLORS = [['#2a2226', '#45383d', 'Siyah'], ['#4a2f22', '#6b4632', 'Koyu Kahve'], ['#7a4a2a', '#9c6538', 'Kestane'], ['#b0502a', '#d0703e', 'Bakır'], ['#d8b45a', '#f0d27c', 'Sarı'], ['#9a7a52', '#b89a6a', 'Kumral'], ['#9a9aa2', '#c4c4ca', 'Gri'], ['#2c3e6e', '#44609a', 'Lacivert']];
const HAIR_STYLES = ['Kısa', 'Dikenli', 'Yana Taralı', 'Uzun', 'At Kuyruğu', 'Topuz', 'Kıvırcık', 'Küt'];
const BODY_TYPES = ['İnce', 'Geniş'];
const OUTFITS = [
  { id: 'tisort', name: 'Mavi Tişört', start: true, shirt: '#4f86c6', shirt2: '#3a6aa2', pants: '#3b4656', shoes: '#5a3b2a', pat: 'plain' },
  { id: 'ekose', name: 'Kırmızı Ekose Gömlek', start: true, shirt: '#c4473f', shirt2: '#8e2f2b', pants: '#4d5a3b', shoes: '#3a2a22', pat: 'plaid' },
  { id: 'yelek', name: 'Balıkçı Yeleği', start: true, shirt: '#e8dcc0', shirt2: '#5f7a4a', pants: '#5a4a3a', shoes: '#3a2a22', pat: 'vest' },
  { id: 'kazak', name: 'Bej Kazak', start: true, shirt: '#d8c39a', shirt2: '#b49f76', pants: '#3e4a5e', shoes: '#4a3428', pat: 'knit' },
  { id: 'yagmurluk', name: 'Yağmurluk', price: 650, shirt: '#f2c230', shirt2: '#c8961c', pants: '#3b4656', shoes: '#2a2f3a', pat: 'rain' },
  { id: 'denizci', name: 'Denizci Montu', price: 1200, shirt: '#2a3a66', shirt2: '#1c2848', pants: '#e8e4da', shoes: '#2a2226', pat: 'buttons' },
  { id: 'kuzey', name: 'Kuzey Kazağı', unlock: 'visit:sisli_kuzey', unlockTr: 'Sisli Kuzey keşfi', shirt: '#9a2f34', shirt2: '#f0eadc', pants: '#3a3a44', shoes: '#3a2a22', pat: 'nordic' },
  { id: 'tropik', name: 'Tropik Gömlek', unlock: 'visit:gunes_adalari', unlockTr: 'Güneş Adaları keşfi', shirt: '#2fa39a', shirt2: '#f2d04a', pants: '#e0d2b0', shoes: '#8a5a3a', pat: 'flower' },
  { id: 'cizgili', name: 'Çizgili Denizci Tişörtü', price: 450, shirt: '#f4f0e4', shirt2: '#2a4a8a', pants: '#3b4656', shoes: '#2a2226', pat: 'stripes' },
  { id: 'tulum', name: 'Kot Tulum', price: 800, shirt: '#e8dcc0', shirt2: '#c8b898', pants: '#3a5a8a', shoes: '#5a3b2a', pat: 'overalls', apron: '#3a5a8a' },
  { id: 'keten', name: 'Keten Gömlek', price: 950, shirt: '#e8e0c8', shirt2: '#c8bca0', pants: '#8a7a5a', shoes: '#6a4a32', pat: 'buttons' },
  { id: 'festival_tisort', name: 'Festival Tişörtü', fest: 'yaz_festivali', shirt: '#f28a3a', shirt2: '#f2d030', pants: '#3a4a6a', shoes: '#2a2226', pat: 'logo' },
  { id: 'orgu_hirka', name: 'Örgü Hırka', fest: 'hasat_senligi', shirt: '#9a5a3a', shirt2: '#c8844a', pants: '#4a3a3a', shoes: '#3a2a22', pat: 'knit' }
];
const HATS = [
  { id: 'none', name: 'Şapkasız', start: true },
  { id: 'klasik', name: 'Klasik Şapka', start: true },
  { id: 'bere', name: 'Yün Bere', start: true },
  { id: 'hasir', name: 'Hasır Şapka', price: 300 },
  { id: 'usta', name: 'Usta Balıkçı Şapkası', unlock: 'ach:species42', unlockTr: 'tüm türleri keşfet' },
  { id: 'kaptan', name: 'Kaptan Şapkası', unlock: 'ach:all_boats', unlockTr: '4 tekneye sahip ol' },
  { id: 'kasket', name: 'Kasket', price: 250 },
  { id: 'denizci_bere', name: 'Denizci Beresi', price: 400 },
  { id: 'cicek_taci', name: 'Çiçek Tacı', fest: 'bahar_senligi' },
  { id: 'fener_beresi', name: 'Fenerli Bere', fest: 'fener_senligi' }
];
const BOAT_COLORS = [
  { id: 'sea_green', name: 'Deniz Yeşili', price: 0, c: ['#3f9a86', '#2c7466', '#6cc2ac'] },
  { id: 'navy', name: 'Lacivert', price: 750, c: ['#2e4a7a', '#1f3358', '#4c6ea6'] },
  { id: 'coral', name: 'Mercan Kırmızısı', price: 750, c: ['#d45a4a', '#a33f34', '#ec8a76'] },
  { id: 'sand', name: 'Kum Sarısı', unlock: 'species30', unlockTr: '30 tür keşfi', c: ['#e2c27a', '#b89650', '#f2dc9e'] }
];
const DECOR_SLOTS = { wall: 'Duvar', shelf: 'Raf', table: 'Masa', window: 'Pencere Kenarı', board: 'Koleksiyon Panosu' };
const DECOR = [
  { id: 'tablo_deniz', name: 'Deniz Manzarası Tablosu', slot: 'wall', price: 300 },
  { id: 'cerceve_balik', name: 'Çerçeveli İlk Balık', slot: 'wall', ach: 'first_catch' },
  { id: 'altin_olta', name: 'Altın Olta Plaketi', slot: 'wall', ach: 'thousand_manual' },
  { id: 'dumen', name: 'Eski Dümen', slot: 'wall', ach: 'all_boats' },
  { id: 'takvim', name: 'Dört Mevsim Takvimi', slot: 'wall', ach: 'all_seasons' },
  { id: 'fener_maket', name: 'Deniz Feneri Maketi', slot: 'shelf', price: 450 },
  { id: 'sise_gemi', name: 'Şişede Gemi', slot: 'shelf', ach: 'first_boat' },
  { id: 'kitaplar', name: 'Balık Kitapları', slot: 'shelf', ach: 'species20' },
  { id: 'cicek', name: 'Kır Çiçekleri', slot: 'table', price: 120 },
  { id: 'cay_seti', name: 'Çay Seti', slot: 'table', price: 200 },
  { id: 'pusula', name: 'Pirinç Pusula', slot: 'table', ach: 'first_trip' },
  { id: 'saksi', name: 'Saksıda Fesleğen', slot: 'window', price: 150 },
  { id: 'kabuklar', name: 'Deniz Kabukları', slot: 'window', ach: 'visit3' },
  { id: 'mercan_parca', name: 'Cam Şamandıra', slot: 'window', ach: 'visit7' },
  { id: 'rekor_pano', name: 'Rekor Panosu', slot: 'board', ach: 'records10' },
  { id: 'harita_pano', name: 'Av Noktaları Haritası', slot: 'board', ach: 'spots10' },
  { id: 'kartpostal', name: 'Müşteri Kartpostalları', slot: 'board', ach: 'buyers5' },
  { id: 'ahsap_saat', name: 'Ahşap Duvar Saati', slot: 'wall', price: 350 },
  { id: 'gemi_maketi', name: 'Yelkenli Maketi', slot: 'shelf', price: 600 },
  { id: 'gaz_lambasi', name: 'Gaz Lambası', slot: 'table', price: 260 },
  { id: 'ruzgar_cani', name: 'Rüzgâr Çanı', slot: 'window', price: 180 },
  { id: 'balik_posteri', name: 'Balık Türleri Posteri', slot: 'board', price: 220 },
  { id: 'sampiyon_flama', name: 'Şampiyonluk Flaması', slot: 'wall', ach: 'gold_trophy' }
];
const DECOR_BY = Object.fromEntries(DECOR.map(d => [d.id, d]));
/* Başarım → kozmetik ödül eşlemesi */
const ACH_REWARD = {};
DECOR.forEach(d => { if (d.ach) ACH_REWARD[d.ach] = { type: 'decor', id: d.id, name: d.name }; });
ACH_REWARD.species42 = { type: 'hat', id: 'usta', name: 'Usta Balıkçı Şapkası' };
ACH_REWARD.all_boats2 = null;

/* Deniz haritasında bölge konumları (640×360) */
const MAP_POS = {
  sakin_liman: [62, 262], yesil_koy: [112, 168], kayalik_adalar: [196, 290], serin_akintilar: [228, 112],
  sisli_kuzey: [300, 58], gunes_adalari: [318, 232], derin_mavi: [376, 158]
};

/* NPC tanımları */
const NPCS = {
  zeynep: { name: 'Zeynep', role: 'Olta Dükkânı', look: { skin: 1, hair: 4, hairColor: 2, body: 0, outfit: { shirt: '#4a8a6a', shirt2: '#2f6a4e', pants: '#3a3a4a', shoes: '#4a3428', pat: 'apron', apron: '#e8d8b0' }, hat: 'none', glasses: false } },
  nihat: { name: 'Nihat', role: 'Balık Hali', look: { skin: 2, hair: 0, hairColor: 6, body: 1, outfit: { shirt: '#6a8aa8', shirt2: '#4a6a88', pants: '#2f3a4a', shoes: '#2a2226', pat: 'apron', apron: '#f0f0ea' }, hat: 'flat', mustache: true } },
  bora: { name: 'Bora', role: 'Tekne Atölyesi', look: { skin: 3, hair: 1, hairColor: 0, body: 1, outfit: { shirt: '#c8643a', shirt2: '#9a4a2a', pants: '#3a5a8a', shoes: '#3a2a22', pat: 'overalls', apron: '#3a5a8a' }, hat: 'bandana', beard: true } },
  bahar: { name: 'Bahar', role: 'Bahar Lokantası', look: { skin: 0, hair: 5, hairColor: 3, body: 0, outfit: { shirt: '#f0eadc', shirt2: '#d8cfb8', pants: '#5a3a4a', shoes: '#3a2a22', pat: 'apron', apron: '#c8423a' }, hat: 'none', scarf: '#c8423a' } },
  efe: { name: 'Efe', role: 'Deneyimli Balıkçı', look: { skin: 2, hair: 0, hairColor: 6, body: 0, outfit: { shirt: '#3a4e6a', shirt2: '#26364e', pants: '#4a4a3a', shoes: '#2a2226', pat: 'buttons' }, hat: 'klasik', beard: true, beardColor: '#e8e8e8' } },
  fatma: { name: 'Fatma Teyze', role: 'Fırın', look: { skin: 1, hair: 5, hairColor: 6, body: 1, outfit: { shirt: '#c86a5a', shirt2: '#a84a3a', pants: '#4a3a4a', shoes: '#3a2a22', pat: 'apron', apron: '#f4f0e4' }, hat: 'none', scarf: '#e8b830' } },
  selin: { name: 'Selin', role: 'Butik', look: { skin: 0, hair: 7, hairColor: 0, body: 0, outfit: { shirt: '#c85a9a', shirt2: '#a83a7a', pants: '#2a2a3a', shoes: '#1a1a22', pat: 'plain' }, hat: 'none' } },
  kerem: { name: 'Kerem', role: 'Ev Eşyaları', look: { skin: 2, hair: 2, hairColor: 2, body: 1, outfit: { shirt: '#6a8a4a', shirt2: '#4a6a32', pants: '#4a3a2a', shoes: '#3a2a22', pat: 'apron', apron: '#a8743e' }, hat: 'none', mustache: true } },
  hasan: { name: 'Muhtar Hasan', role: 'Şenlik Meydanı', look: { skin: 3, hair: 0, hairColor: 6, body: 1, outfit: { shirt: '#4a3a5a', shirt2: '#2e2440', pants: '#2a2a3a', shoes: '#1a1a22', pat: 'buttons' }, hat: 'flat', mustache: true } },
  halil: { name: 'Halil Usta', role: 'Çay Bahçesi', look: { skin: 4, hair: 0, hairColor: 0, body: 1, outfit: { shirt: '#f0eadc', shirt2: '#d8cfb8', pants: '#3a3a3a', shoes: '#2a2226', pat: 'vest' }, hat: 'none', mustache: true } },
  ali: { name: 'Ali Dayı', role: 'İskele balıkçısı', look: { skin: 3, hair: 0, hairColor: 6, body: 0, outfit: { shirt: '#5a6a4a', shirt2: '#3e4a32', pants: '#3a3a44', shoes: '#2a2226', pat: 'vest' }, hat: 'klasik', beard: true, beardColor: '#c8c8c8' } },
  mert: { name: 'Mert', role: 'İskele balıkçısı', look: { skin: 1, hair: 1, hairColor: 1, body: 0, outfit: { shirt: '#e86a3a', shirt2: '#c84a2a', pants: '#3a4a6a', shoes: '#2a2226', pat: 'plain' }, hat: 'none' } },
  elif: { name: 'Elif', role: 'İskele balıkçısı', look: { skin: 2, hair: 4, hairColor: 3, body: 0, outfit: { shirt: '#5ab8c8', shirt2: '#3a98a8', pants: '#4a3a5a', shoes: '#2a2226', pat: 'plain' }, hat: 'hasir' } }
};

/* ---------- yardımcılar ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const roundHalfUp = x => Math.floor(x + 0.5);
const round2 = x => Math.round(x * 100) / 100;
const fmt = n => { const s = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return n < 0 ? '-' + s : s; };
const fmtKg = n => (n < 10 ? n.toFixed(2) : n.toFixed(1)).replace('.', ',');
const upTR = s => String(s).toLocaleUpperCase('tr-TR');
const pct = x => '%' + Math.round(x * 100);
const deepClone = o => JSON.parse(JSON.stringify(o));
const sum = a => a.reduce((x, y) => x + y, 0);

/* ---------- RNG ---------- */
function hash32() {
  let h = 0x811c9dc5 >>> 0;
  for (let k = 0; k < arguments.length; k++) {
    const s = String(arguments[k]);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    h ^= 0x7f; h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
function mulberry(seed) {
  let a = seed | 0;
  return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* Kalıcı oyun RNG akışı: yalnızca tanımlı oyun işlemlerinde tüketilir, durumu kayda yazılır */
function rand() {
  let a = S.rng | 0; a = (a + 0x6D2B79F5) | 0; S.rng = a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const hrand = (...a) => hash32(S.seed, ...a) / 4294967296;
function wpick(list, wf, r) { const tot = sum(list.map(wf)); let x = r * tot; for (const it of list) { x -= wf(it); if (x < 0) return it; } return list[list.length - 1]; }

/* ---------- GameState ---------- */
let S = null;
function newToday(s) {
  return { day: s.day, manualCatches: 0, autoCatches: 0, casts: 0, marketIncome: 0, orderIncome: 0, expenses: 0, expBy: {}, newSpecies: [], records: [], achievements: [], startCash: s.cash, released: 0 };
}
function newState(look) {
  const seed = (Math.random() * 4294967296) >>> 0;
  const s = {
    schemaVersion: SCHEMA, saveId: 'cf' + Date.now().toString(36) + (seed % 46656).toString(36), revision: 0, savedAt: 0,
    seed, rng: (seed ^ 0x5bd1e995) | 0, txSeq: 0, lastTx: '',
    day: 1, energy: CORE.daily_energy, cash: CORE.start_cash,
    scene: 'Town', regionId: 'sakin_liman', spotId: 'liman_iskele', townX: 330,
    player: Object.assign({ name: 'Balıkçı', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' }, look || {}),
    wardrobe: { outfits: OUTFITS.filter(o => o.start).map(o => o.id), hats: HATS.filter(h => h.start).map(h => h.id) },
    gear: { owned: { rod: ['old_bamboo'], line: ['thin'], reel: ['basic'], hook: ['standard'] }, rod: 'old_bamboo', line: 'thin', reel: 'basic', hook: 'standard', bait: 'basic' },
    baitStock: { worm: 0, shrimp: 0, fish: 0, lure: 0, deep: 0 },
    bagLevel: 0, chestLevel: 0, bag: [], chest: [], favorites: {},
    boats: { owned: [], active: null, byId: {} },
    auto: { devices: {}, globals: {}, dailyCaught: 0, dailyDay: 1, total: 0, attempts: 0 },
    orders: [], orderSeq: 1, customers: {},
    ency: {}, ach: {}, npc: {},
    world: { unlocked: { sakin_liman: true }, weather: {}, eventId: null, eventHist: [], seasonsSeen: {} },
    stats: {
      manualCasts: 0, manualCatches: 0, autoCatches: 0, released: 0, lineBreaks: 0, escapes: 0, missed: 0, noBite: 0, cancels: 0,
      totalSales: 0, marketSales: 0, orderSales: 0, fishSoldMarket: 0, ordersDelivered: 0, buyers: {}, records: 0,
      daysCompleted: 0, trips: 0, fuelSpent: 0, baitUsed: 0, regionsVisited: {}, spotsVisited: {}, gearBought: 0, spent: 0,
      biggestCm: 0, biggestId: null, power4: 0, power5: 0, autoAttempts: 0, autoFails: 0, prizes: 0, comps: 0, festSeasons: {}, snacks: 0, teaSold: 0
    },
    today: null,
    home: { decor: { wall: null, shelf: null, table: null, window: null, board: null }, owned: [] },
    cosmetics: { boatColors: ['sea_green'] },
    tutorial: { step: 0, skipped: false },
    pendingCast: null, trophies: [], fest: {}, comp: null, buff: null, tea: { day: 0, n: 0 },
    flags: {}
  };
  s.today = newToday(s);
  return s;
}
