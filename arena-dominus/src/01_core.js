'use strict';
/* =========================================================================
   ARENA DOMINUS — core: utilities, seeded RNG, static game data
   ========================================================================= */

const GAME_VERSION = '1.0.0';
const SAVE_VERSION = 1;

// ---------- small utils ----------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const num = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);
const r1 = v => Math.round(v * 10) / 10;
const fmtInt = v => {
  v = Math.round(num(v));
  const s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (v < 0 ? '-' : '') + s;
};
const fmtGold = v => fmtInt(v) + ' ₳';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// deterministic 0..1 from integer seed values (does not touch RNG state)
function hash01(a, b = 0) {
  let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// ---------- seeded RNG (sfc32), state is serialisable ----------
class RNG {
  constructor(seed) {
    if (Array.isArray(seed) && seed.length === 4) this.s = seed.map(x => x >>> 0);
    else {
      const n = (typeof seed === 'number' ? seed : hashStr(String(seed))) >>> 0;
      this.s = [0x9e3779b9, 0x243f6a88, 0xb7e15162, n];
      for (let i = 0; i < 16; i++) this.next();
    }
  }
  next() {
    const s = this.s;
    let a = s[0], b = s[1], c = s[2], d = s[3];
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    s[0] = a >>> 0; s[1] = b >>> 0; s[2] = c >>> 0; s[3] = d >>> 0;
    return (t >>> 0) / 4294967296;
  }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  normal(m = 0, sd = 1) {
    let u = this.next(); if (u < 1e-9) u = 1e-9;
    const v = this.next();
    return m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  weighted(items, wfn) {
    let tot = 0; for (const it of items) tot += Math.max(0, wfn(it));
    if (tot <= 0) return items[0];
    let r = this.next() * tot;
    for (const it of items) { r -= Math.max(0, wfn(it)); if (r <= 0) return it; }
    return items[items.length - 1];
  }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }
  seed32() { return Math.floor(this.next() * 4294967296) >>> 0; }
  state() { return this.s.slice(); }
}

// ---------- world data ----------
const REGIONS = [
  {
    id: 'valeria', name: 'Valeria', sym: 'laurel',
    desc: 'Merkezi imparatorluk bölgesi. Disiplinli okullar, kalkan ve savunma kültürü.',
    pal: { a: '#9e2a22', b: '#d4ad52', c: '#efe6d6', d: '#5a1712', floor: '#d9c39a', wall: '#e8dfcf' },
    bias: { str: 0, end: 1, agi: -1, tec: 3, dis: 5 },
    cls: { murmillo: 1.6, secutor: 1.4, hoplomachus: 1.3, thraex: 0.8, retiarius: 0.7, dimachaerus: 0.6 }
  },
  {
    id: 'theskara', name: 'Theskara', sym: 'mountain',
    desc: 'Dağlık bölge. Güçlü ve dayanıklı gladyatörler, sert mücadele kültürü.',
    pal: { a: '#2f4a32', b: '#8a8f93', c: '#d4d2c8', d: '#1b2a1d', floor: '#b9ad92', wall: '#8c8a80' },
    bias: { str: 3, end: 5, agi: -2, tec: 0, dis: 1 },
    cls: { murmillo: 1.3, secutor: 1.5, hoplomachus: 0.9, thraex: 0.9, retiarius: 0.6, dimachaerus: 1.1 }
  },
  {
    id: 'nemeris', name: 'Nemeris', sym: 'sun',
    desc: 'Çöl ve sıcak iklim bölgesi. Hızlı, çevik dövüşçüler ve hafif zırh geleneği.',
    pal: { a: '#b8682c', b: '#2a9d8f', c: '#f2dfb4', d: '#6b3a16', floor: '#e6c88a', wall: '#d8b47a' },
    bias: { str: -1, end: -1, agi: 6, tec: 2, dis: 0 },
    cls: { murmillo: 0.6, secutor: 0.8, hoplomachus: 0.8, thraex: 1.6, retiarius: 1.1, dimachaerus: 1.5 }
  },
  {
    id: 'aegion', name: 'Aegion', sym: 'wave',
    desc: 'Kıyı bölgesi. Mızrak, ağ ve kontrollü dövüş stilleri; deniz ticaretiyle zengin.',
    pal: { a: '#25507a', b: '#b0793a', c: '#e4e8e6', d: '#14304c', floor: '#d6cbb0', wall: '#cfd6d4' },
    bias: { str: -1, end: 0, agi: 2, tec: 5, dis: 2 },
    cls: { murmillo: 0.8, secutor: 0.8, hoplomachus: 1.6, thraex: 0.9, retiarius: 1.7, dimachaerus: 0.7 }
  },
  {
    id: 'dravok', name: 'Dravok', sym: 'axes',
    desc: 'Sınır bölgesi. Saldırgan dövüş kültürü; güçlü fakat riskli taktikler.',
    pal: { a: '#6e1414', b: '#5c5f63', c: '#d8cfc6', d: '#1a1212', floor: '#bfa98a', wall: '#6b625c' },
    bias: { str: 6, end: 2, agi: 0, tec: -1, dis: -4 },
    cls: { murmillo: 0.8, secutor: 1.3, hoplomachus: 0.7, thraex: 1.0, retiarius: 0.7, dimachaerus: 1.6 }
  }
];
const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));

const TIERS = [null,
  { n: 'Altın Kolezyum Ligi', s: 'Altın Kolezyum', eco: 6.4, ovr: 71, rep: 80, fans: [3200, 6500], fac: [3, 5], staff: [58, 78] },
  { n: 'İmparatorluk Ligi', s: 'İmparatorluk', eco: 5.0, ovr: 64.5, rep: 68, fans: [2400, 4800], fac: [2, 4], staff: [48, 68] },
  { n: 'Eyalet Şampiyonası', s: 'Eyalet', eco: 3.5, ovr: 58, rep: 56, fans: [1900, 3800], fac: [2, 3], staff: [40, 58] },
  { n: 'Şehir Arenaları Birliği', s: 'Şehir Arenaları', eco: 2.85, ovr: 52, rep: 44, fans: [1300, 2700], fac: [1, 3], staff: [32, 50] },
  { n: 'Taş Çember Ligi', s: 'Taş Çember', eco: 2.0, ovr: 46, rep: 32, fans: [850, 1800], fac: [1, 2], staff: [25, 42] },
  { n: 'Kum Arenası', s: 'Kum Arenası', eco: 1.3, ovr: 40, rep: 20, fans: [450, 980], fac: [1, 1], staff: [18, 34] }
];

// attribute keys
const ATTRS = ['str', 'end', 'agi', 'tec', 'dis', 'cha'];
const ATTR_NAMES = { str: 'Güç', end: 'Dayanıklılık', agi: 'Çeviklik', tec: 'Teknik', dis: 'Disiplin', cha: 'Karizma' };

// combat classes. w = weights for overall rating (charisma excluded)
const CLASSES = {
  murmillo: {
    id: 'murmillo', name: 'Murmillo', role: 'Tank / Savunma', gear: 'Kısa kılıç ve büyük kalkan',
    w: { str: 0.18, end: 0.31, agi: 0.07, tec: 0.16, dis: 0.28 },
    range: 1.25, atk: 1.62, dmg: 7.0, armor: 13, block: 0.26, eva: 0.0, spd: 0.90, hp: 17, crit: 0,
    sp: { id: 'shieldwall', name: 'Kalkan Siperliği', cd: 14, en: 14, desc: 'Kalkanını kaldırıp siper alır; 4 saniye boyunca aldığı hasar büyük ölçüde azalır, yakındaki takım arkadaşlarını da korur.' },
    tank: true, ai: 'guard'
  },
  retiarius: {
    id: 'retiarius', name: 'Retiarius', role: 'Kontrol', gear: 'Üç dişli mızrak ve ağ',
    w: { str: 0.12, end: 0.14, agi: 0.30, tec: 0.32, dis: 0.12 },
    range: 2.3, atk: 1.45, dmg: 7.6, armor: 6, block: 0, eva: 0.07, spd: 1.08, hp: 12, crit: 0,
    sp: { id: 'net', name: 'Ağ Atışı', cd: 12, en: 15, desc: 'Ağını fırlatır; isabet ederse rakip kısa süre hareket edemez, ardından yavaşlar.' },
    ai: 'kite'
  },
  thraex: {
    id: 'thraex', name: 'Thraex', role: 'Çevik Saldırgan', gear: 'Eğri kılıç ve küçük kalkan',
    w: { str: 0.20, end: 0.12, agi: 0.32, tec: 0.24, dis: 0.12 },
    range: 1.15, atk: 1.2, dmg: 7.0, armor: 7, block: 0.12, eva: 0.06, spd: 1.08, hp: 0, crit: 0.06,
    sp: { id: 'agile', name: 'Çevik Darbe', cd: 9, en: 12, desc: 'Hızla atılıp sert bir eğri kılıç darbesi indirir, ardından geri sıçrayıp yeniden pozisyon alır.' },
    ai: 'skirmish'
  },
  secutor: {
    id: 'secutor', name: 'Secutor', role: 'Baskıcı Savaşçı', gear: 'Kılıç ve kalkan',
    w: { str: 0.24, end: 0.24, agi: 0.16, tec: 0.18, dis: 0.18 },
    range: 1.25, atk: 1.42, dmg: 7.5, armor: 11, block: 0.22, eva: 0.0, spd: 1.0, hp: 10, crit: 0,
    sp: { id: 'pursuit', name: 'Amansız Takip', cd: 12, en: 14, desc: 'Hedefine hızla koşar ve birkaç saniye boyunca daha isabetli, daha sert saldırır.' },
    ai: 'chase'
  },
  dimachaerus: {
    id: 'dimachaerus', name: 'Dimachaerus', role: 'Yüksek Hasar', gear: 'Çift kılıç',
    w: { str: 0.32, end: 0.10, agi: 0.30, tec: 0.18, dis: 0.10 },
    range: 1.1, atk: 1.04, dmg: 7.0, armor: 7, block: 0, eva: 0.08, spd: 1.1, hp: 18, crit: 0.03,
    sp: { id: 'combo', name: 'Çift Kılıç Serisi', cd: 6.5, en: 12, desc: 'Arka arkaya iki hızlı kılıç darbesi indirir.' },
    ai: 'striker'
  },
  hoplomachus: {
    id: 'hoplomachus', name: 'Hoplomachus', role: 'Dengeli Mızrakçı', gear: 'Mızrak ve kalkan',
    w: { str: 0.18, end: 0.18, agi: 0.16, tec: 0.30, dis: 0.18 },
    range: 2.0, atk: 1.45, dmg: 7.0, armor: 9, block: 0.14, eva: 0.0, spd: 1.0, hp: 4, crit: 0,
    sp: { id: 'lunge', name: 'Mızrak Hamlesi', cd: 10, en: 13, desc: 'Mesafeden sert bir mızrak hamlesi yapar, rakibi geri iter ve kısa süre dengesini bozar.' },
    ai: 'spacing'
  }
};
const CLASS_IDS = Object.keys(CLASSES);

const TACTICS = {
  balanced: { id: 'balanced', name: 'Dengeli', desc: 'Standart davranış; ne fazla risk ne fazla temkin.' },
  aggressive: { id: 'aggressive', name: 'Saldırgan', desc: 'Verilen hasar +%15, alınan hasar +%10, enerji tüketimi +%25. Geri çekilme yok.' },
  defensive: { id: 'defensive', name: 'Savunmacı', desc: 'Alınan hasar -%13, verilen hasar -%10, enerji tüketimi -%20. Zayıflayan geri çekilir.' },
  focus: { id: 'focus', name: 'Odaklı Av', desc: 'Takım, en kırılgan rakibe ortak hedef önceliği verir.' },
  guard: { id: 'guard', name: 'Koruma Düzeni', desc: 'Tanklar kırılgan arkadaşlarının önünde durur; takım dağılmadan savaşır.' }
};

const POSITIONS = ['Ön Hat', 'Sol Kanat', 'Sağ Kanat'];

// season calendar
const SEASON_WEEKS = 30;
const LEAGUE_WEEKS = [2, 4, 6, 8, 10, 12, 14, 17, 19, 21, 23, 25, 27, 29];
const RCUP_WEEKS = [3, 7, 11, 18, 24, 28];
const ICUP_WEEKS = [5, 9, 20, 26];
const WINDOW_WEEKS = [0, 1, 15, 16];
const RCUP_ROUNDS = ['1. Tur', '2. Tur', 'Son 16', 'Çeyrek Final', 'Yarı Final', 'Final'];
const ICUP_ROUNDS = ['Ön Eleme', 'Çeyrek Final', 'Yarı Final', 'Final'];

// facilities
const FACILITIES = {
  train: { id: 'train', name: 'Eğitim Alanı', desc: 'Gladyatörlerin maçlardan kazandığı deneyimi gelişime dönüştürme hızını artırır.' },
  med: { id: 'med', name: 'Revir', desc: 'Kondisyon yenilenmesini hızlandırır, sakatlık iyileşmesini ve riskini iyileştirir.' },
  scout: { id: 'scout', name: 'Keşif Merkezi', desc: 'Transfer raporlarının doğruluğunu, haftalık rapor sayısını ve izlenen bölgeleri artırır.' },
  arena: { id: 'arena', name: 'Arena', desc: 'Seyirci kapasitesini ve bilet gelirini artırır.' }
};
const FAC_IDS = ['train', 'med', 'scout', 'arena'];
const FAC = {
  trainMult: [1, 1.0, 1.1, 1.21, 1.33, 1.46],
  medCond: [0, 0, 3, 6, 9, 12],
  medHeal: [0, 0, 0.15, 0.3, 0.45, 0.6],
  medInj: [0, 0, 0.04, 0.08, 0.12, 0.16],
  scoutRegions: [0, 1, 2, 3, 4, 5],
  scoutReports: [0, 1, 2, 3, 4, 5],
  scoutAcc: [0, 0, 0.1, 0.2, 0.3, 0.4],
  capacity: [0, 1000, 2200, 4500, 8000, 13000],
  ticketBonus: [0, 0, 0.04, 0.08, 0.12, 0.16],
  cost: [0, 0, 4000, 12000, 32000, 75000],
  upkeep: [0, 0, 25, 60, 150, 320]
};

const STAFF = {
  coach: { id: 'coach', name: 'Baş Eğitmen', desc: 'Gelişim hızını artırır.' },
  healer: { id: 'healer', name: 'Şifacı', desc: 'İyileşmeyi ve kondisyon yenilenmesini artırır.' },
  scout: { id: 'scout', name: 'Kaşif', desc: 'Keşif raporlarının doğruluğunu artırır.' }
};
const STAFF_IDS = ['coach', 'healer', 'scout'];

// economy constants (tuned with headless multi-season simulation)
const ECON = {
  valueBase: 50, valueGrowth: 1.08,
  wageRate: 0.045,
  sponsorBase: 230,
  ticketPrice: 1.6,
  opsBase: 45,
  winPrize: 120, lossPrize: 40,
  rankPrize: [0, 3200, 2400, 1800, 1400, 1100, 900, 700, 550],
  rcupPrize: [300, 450, 700, 1100, 1700, 2600],
  rcupFinalLoser: 1200,
  icupPrize: [15000, 26000, 45000, 110000],
  icupFinalLoser: 50000,
  startCash: 12000
};

// equipment
const QUALITIES = [
  { id: 0, n: 'Sıradan', c: '#9a9184', price: 160, mult: 1 },
  { id: 1, n: 'Kaliteli', c: '#5f9e57', price: 560, mult: 2 },
  { id: 2, n: 'Usta İşi', c: '#4f7fc4', price: 1700, mult: 3 },
  { id: 3, n: 'Nadir', c: '#9b59c6', price: 5200, mult: 4 },
  { id: 4, n: 'Efsanevi', c: '#d9a520', price: 15500, mult: 5 }
];
// item templates. slot: w (weapon), a (armour), x (auxiliary)
const ITEM_TYPES = {
  gladius: { n: 'Gladius', slot: 'w', cls: ['murmillo', 'secutor'], dmg: 1.0, desc: 'Kısa düz kılıç.' },
  spatha: { n: 'Spatha', slot: 'w', cls: ['secutor', 'murmillo'], dmg: 1.15, acc: -0.01, desc: 'Daha uzun ve ağır kılıç.' },
  sica: { n: 'Sica', slot: 'w', cls: ['thraex'], dmg: 1.0, crit: 0.006, desc: 'Eğri Thraex kılıcı.' },
  fuscina: { n: 'Fuscina', slot: 'w', cls: ['retiarius'], dmg: 1.0, acc: 0.006, desc: 'Üç dişli mızrak.' },
  twin: { n: 'Çift Kılıç Takımı', slot: 'w', cls: ['dimachaerus'], dmg: 0.95, crit: 0.004, desc: 'Dengeli bir çift kılıç.' },
  hasta: { n: 'Hasta', slot: 'w', cls: ['hoplomachus'], dmg: 1.0, acc: 0.006, desc: 'Uzun savaş mızrağı.' },
  leather: { n: 'Deri Koruma', slot: 'a', cls: CLASS_IDS, armor: 0.8, hp: 3, eva: 0.002, desc: 'Hafif, hareketi kısıtlamaz.' },
  scale: { n: 'Pullu Zırh', slot: 'a', cls: ['murmillo', 'secutor', 'hoplomachus', 'thraex'], armor: 1.2, hp: 5, desc: 'Orta ağırlıkta pullu koruma.' },
  heavy: { n: 'Ağır Göğüslük', slot: 'a', cls: ['murmillo', 'secutor'], armor: 1.5, hp: 7, spd: -0.004, desc: 'Ağır bronz göğüslük.' },
  galerus: { n: 'Galerus Omuzluk', slot: 'a', cls: ['retiarius', 'dimachaerus'], armor: 1.0, hp: 4, eva: 0.002, desc: 'Omuz ve kolu koruyan metal levha.' },
  scutum: { n: 'Scutum', slot: 'x', cls: ['murmillo'], block: 0.012, armor: 0.4, desc: 'Büyük kavisli kalkan.' },
  oval: { n: 'Secutor Kalkanı', slot: 'x', cls: ['secutor'], block: 0.011, armor: 0.3, desc: 'Uzun oval kalkan.' },
  parma: { n: 'Parma', slot: 'x', cls: ['thraex', 'hoplomachus'], block: 0.01, eva: 0.002, desc: 'Küçük yuvarlak/kare kalkan.' },
  rete: { n: 'Rete (Ağ)', slot: 'x', cls: ['retiarius'], special: 0.03, desc: 'Ağırlıklı dövüş ağı; ağ atışını güçlendirir.' },
  manica: { n: 'Manica Kol Zırhı', slot: 'x', cls: ['dimachaerus', 'retiarius', 'thraex'], armor: 0.5, eva: 0.002, hp: 2, desc: 'Kolu saran parçalı koruma.' },
  galea: { n: 'Galea Miğfer', slot: 'x', cls: ['murmillo', 'secutor', 'thraex', 'hoplomachus', 'dimachaerus'], armor: 0.7, hp: 3, desc: 'Sağlam savaş miğferi.' }
};
const SLOT_NAMES = { w: 'Silah', a: 'Zırh', x: 'Yardımcı' };

// sponsors
const SPONSOR_TYPES = {
  merchant: { n: 'Tüccar Loncası', wk: 1.15, bonus: 0.6, goals: ['wins'], dur: [1, 2] },
  noble: { n: 'Soylu Aile', wk: 0.9, bonus: 1.5, goals: ['rank', 'title', 'promo'], dur: [1, 1] },
  governor: { n: 'Askerî Vali', wk: 1.0, bonus: 1.1, goals: ['kos', 'wins'], dur: [1, 2] },
  arenas: { n: 'Arenalar Birliği', wk: 0.95, bonus: 1.2, goals: ['cup', 'rank'], dur: [1, 2] },
  people: { n: 'Halk Meclisi', wk: 0.85, bonus: 0.9, goals: ['homewins', 'rank'], dur: [2, 3] }
};

const POLICIES = {
  rich: { n: 'Zengin Kulüp', desc: 'Pahalı ve güçlü gladyatörleri hedefler.' },
  talent: { n: 'Yetenek Avcısı', desc: 'Genç ve potansiyelli isimlere yönelir.' },
  econ: { n: 'Ekonomik Kulüp', desc: 'Serbest ve uygun maliyetli gladyatörleri tercih eder.' },
  def: { n: 'Savunmacı Kulüp', desc: 'Savunma ağırlıklı kadro kurar.' },
  agg: { n: 'Agresif Kulüp', desc: 'Saldırı ağırlıklı sınıflara öncelik verir.' }
};

// ---------- naming data ----------
const NAMES = {
  valeria: {
    f: ['Aurelan', 'Cassor', 'Decimar', 'Varrus', 'Lucian', 'Severin', 'Tibran', 'Quintar', 'Marcen', 'Octavar', 'Rufio', 'Corvin', 'Galeran', 'Albinus', 'Florian', 'Crassor', 'Vitran', 'Maxen', 'Septor', 'Junian', 'Drusan', 'Felixar', 'Hadran', 'Nervan', 'Pollion', 'Sabin', 'Titor', 'Valen', 'Brutar', 'Caelan'],
    l: ['Ferrox', 'Calvinus', 'Aurex', 'Strabon', 'Laevinus', 'Marcellan', 'Vettor', 'Sulvan', 'Quirinus', 'Tarvinius', 'Corvalis', 'Domitar', 'Flavor', 'Gratian', 'Lentar', 'Magnar', 'Novian', 'Petrax', 'Rutilan', 'Severan', 'Tullar', 'Vibran', 'Aemilan', 'Celsar', 'Duran']
  },
  theskara: {
    f: ['Brask', 'Dorvan', 'Kerzo', 'Tharos', 'Mavrik', 'Zoltar', 'Bardak', 'Grezan', 'Hrodan', 'Ivrak', 'Radov', 'Skelan', 'Tarvos', 'Vesko', 'Drazen', 'Boran', 'Kordak', 'Mirzan', 'Stavor', 'Torek', 'Vulkar', 'Zelan', 'Ardanos', 'Bresko', 'Kalvar', 'Nikor', 'Orsan', 'Peltar', 'Ruskan', 'Tsevan'],
    l: ['Kragos', 'Dravanos', 'Zeltar', 'Morovik', 'Skarnos', 'Velkan', 'Torvos', 'Breshik', 'Kalden', 'Ostravan', 'Grumov', 'Hrastek', 'Kordava', 'Lomvar', 'Pernik', 'Radovan', 'Stenik', 'Tharsek', 'Uzdrik', 'Vrennik', 'Zagorin', 'Belgor', 'Dumrak', 'Fersik', 'Kolvar']
  },
  nemeris: {
    f: ['Sekhar', 'Nebun', 'Zahir', 'Imhar', 'Tamun', 'Rashet', 'Kassar', 'Hanu', 'Amenor', 'Basir', 'Djeser', 'Farin', 'Haddar', 'Ithar', 'Jabar', 'Kemhet', 'Lusar', 'Menkar', 'Nasir', 'Omaren', 'Petah', 'Qadir', 'Saru', 'Tahar', 'Usir', 'Wadjen', 'Yamun', 'Zefar', 'Akhen', 'Barakh'],
    l: ['Sahrani', 'Kadarim', 'Ankhar', 'Dunari', 'Mefis', 'Hattun', 'Senuret', 'Kharsis', 'Zaphar', 'Tamesh', 'Ubaris', 'Nehet', 'Isfaran', 'Kemara', 'Rashetu', 'Baharim', 'Djedar', 'Sobekan', 'Taweret', 'Hesiran', 'Menefer', 'Qarun', 'Seteph', 'Wahet', 'Zaidun']
  },
  aegion: {
    f: ['Lykon', 'Dorian', 'Nereas', 'Thalos', 'Ikarion', 'Phaedor', 'Kallias', 'Theron', 'Nikandros', 'Melas', 'Zenon', 'Ariston', 'Damon', 'Euphor', 'Glaukos', 'Hermon', 'Iason', 'Kleon', 'Leandor', 'Myron', 'Orestor', 'Pyrros', 'Straton', 'Timaios', 'Xanthor', 'Agathon', 'Brison', 'Kyros', 'Lysan', 'Philon'],
    l: ['Thalassor', 'Kymaris', 'Delphon', 'Akroteri', 'Nausikos', 'Pelagion', 'Korallis', 'Halkyros', 'Myrtides', 'Ephyron', 'Lykandros', 'Peiridis', 'Sidaros', 'Tirynthos', 'Amphiros', 'Egeirides', 'Kalymnos', 'Lemnides', 'Naxion', 'Parion', 'Rhodion', 'Skyrides', 'Thasion', 'Zakyntos', 'Chiorides']
  },
  dravok: {
    f: ['Brannoc', 'Gorm', 'Vargo', 'Skarn', 'Drogan', 'Hakon', 'Ulfar', 'Torvald', 'Raskel', 'Brokk', 'Ketil', 'Morvan', 'Arnulf', 'Barek', 'Druss', 'Fenrik', 'Grimvar', 'Haldor', 'Ivor', 'Jarek', 'Karsk', 'Ludvar', 'Ragnor', 'Sigvar', 'Tormek', 'Ulrak', 'Vidar', 'Wulfan', 'Yrsk', 'Zorvak'],
    l: ['Varkhul', 'Skorrin', 'Tharnak', 'Grumvald', 'Hrothar', 'Ulvarr', 'Kordrak', 'Merrovic', 'Thurgan', 'Voskar', 'Askeldr', 'Brandur', 'Drekkar', 'Fjornak', 'Gaskvar', 'Holmrik', 'Jarnvik', 'Kolbrand', 'Ravnok', 'Skjaldar', 'Torgrim', 'Ulmskar', 'Vargen', 'Yrvald', 'Zornik']
  }
};
const CITIES = {
  valeria: ['Aurelia', 'Castra Magna', 'Veridium', 'Solenta', 'Marmora', 'Corvinum', 'Tibera', 'Lucentum', 'Albara', 'Severa', 'Pallantia', 'Vexilla', 'Quirina', 'Augusta Nova', 'Flaminia', 'Novalis'],
  theskara: ['Kragmor', 'Durvassa', 'Kordava', 'Skalvos', 'Tharsa', 'Vrennik', 'Ostrel', 'Haldra', 'Morvik', 'Grenvas', 'Pelkor', 'Brezna', 'Kalvaros', 'Tsorna', 'Velmira', 'Orvask'],
  nemeris: ['Sahrun', 'Qadira', 'Tamesh', 'Ankhara', 'Dunar', 'Zephyra', 'Hattun', 'Mefira', 'Kharsis', 'Sennara', 'Ubaris', 'Nehet', 'Isfara', 'Kemara', 'Rasheta', 'Baharim'],
  aegion: ['Thalassa', 'Kymara', 'Delphira', 'Akrotos', 'Nausika', 'Pelagia', 'Korallis', 'Halkyra', 'Myrtos', 'Ephyra', 'Lykandra', 'Peiros', 'Sidaros', 'Tirynthos', 'Amphira', 'Egeira'],
  dravok: ['Vargholm', 'Skarnhold', 'Gorvik', 'Drovna', 'Ulvmark', 'Hraskel', 'Brokkar', 'Kethra', 'Morvain', 'Rasvald', 'Thurna', 'Velgrim', 'Zorvan', 'Askeld', 'Fennrik', 'Grimhal']
};
const LUDUS_STEMS = ['Ferrum', 'Aquila', 'Leonis', 'Magnus', 'Victor', 'Fortis', 'Aurum', 'Gladius', 'Scutum', 'Taurus', 'Lupus', 'Ursus', 'Solaris', 'Lunaris', 'Petra', 'Corvus', 'Draconis', 'Invictus', 'Maximus', 'Valor', 'Bellator', 'Imperium', 'Tonans', 'Vulpes', 'Falco', 'Serpens', 'Aper', 'Rubrum', 'Nox', 'Aes', 'Silex', 'Fulgur', 'Ventus', 'Unda', 'Arena', 'Gloria', 'Honos', 'Fides', 'Virtus', 'Triumphus'];
const CLUB_SUFFIX = ['Kılıçları', 'Arslanları', 'Kartalları', 'Kurtları', 'Kalkanları', 'Boğaları', 'Mızrakları', 'Demirleri', 'Şahinleri', 'Akrepleri', 'Gladyatör Okulu', 'Savaşçıları'];

// crest options
const CREST_SHAPES = ['Kalkan', 'Parma', 'Scutum', 'Oval', 'Sancak', 'Defne', 'Uçurtma', 'Altıgen'];
const CREST_SYMBOLS = ['Çapraz Kılıç', 'Mızrak', 'Miğfer', 'Defne', 'Güneş', 'Dağ', 'Dalga', 'Kule', 'Boğa', 'Kanat', 'Yıldız', 'Balta'];
const CREST_COLORS = ['#9e2a22', '#6e1414', '#d4ad52', '#b0793a', '#2f4a32', '#25507a', '#2a9d8f', '#3b2f5c', '#1f1a17', '#e9e1cf', '#7a7f85', '#c9682c'];

// ---------- misc helpers depending on data ----------
function tierEco(t) { return TIERS[clamp(t | 0, 1, 6)].eco; }
function ovrOf(g) {
  const w = CLASSES[g.cls].w;
  return clamp(g.str * w.str + g.end * w.end + g.agi * w.agi + g.tec * w.tec + g.dis * w.dis, 1, 99);
}
function weekLabel(w) { return w === 0 ? 'Sezon Öncesi' : (w >= SEASON_WEEKS ? 'Sezon Sonu' : w + '. Hafta'); }
const nextTick = () => new Promise(r => (typeof setTimeout !== 'undefined' ? setTimeout(r, 0) : r()));
