// Ahen Vadisi — merkezi sabitler. Tüm modüller değerleri buradan okur.

export const GAME_TITLE = 'Ahen Vadisi';
export const SCHEMA_VERSION = 4;      // V1 = 1, V2.0 (Kül ve Ayaz) = 2, V3.0 (Kayıp Krallığın Mirası) = 3, V4.0 (Gökyarık) = 4
export const GAME_VERSION = '4.1.1';

export const TILE = 32;          // dünya pikseli / tile
export const ART_SCALE = 2;      // 1 sanat pikseli = 2 dünya pikseli
export const MAX_LEVEL = 50;
export const V3_MAX_LEVEL = 40;      // V3 hikâye sonu (V4 içeriği bunun üzerine kurulur)
export const V2_MAX_LEVEL = 30;      // V2 hikâye sonu (V3 içeriği bunun üzerine kurulur)
export const V1_MAX_LEVEL = 20;      // V1 hikâye sonu (V2 içeriği bunun üzerine kurulur)
export const SKILL_BAR_SIZE = 4;     // ekrandaki aktif beceri düğmesi sayısı
export const STAT_POINTS_PER_LEVEL = 3;
export const CHAR_SLOTS = 5;          // V4: 3 → 5 (eski üç yuva aynı sırada korunur)
export const V3_CHAR_SLOTS = 3;

export const BAG_START = 36;
export const BAG_STEPS = [36, 42, 48];
export const STORAGE_START = 60;
export const STORAGE_MAX = 90;
export const MAX_STACK = 99;
export const PENDING_LOOT_MAX = 60;

export const CRIT_BASE = 0.03;
export const CRIT_PER_DEX = 0.0015;
export const CRIT_CAP = 0.45;
export const CRIT_MULT = 1.5;
export const ATKSPD_PER_DEX = 0.002;
export const ATKSPD_CAP = 0.35;
export const NORMAL_VARIANCE = 0.05;
export const EVADE_CAP = 0.2;           // V4 Okçu: kaçınma (yalnız telegrafsız normal saldırılara) en çok %20

export const REGEN_DELAY = 5;           // sn, son hasardan sonra
export const REGEN_HP_PCT = 0.015;      // saniyede maks HP
export const MP_REGEN_COMBAT = 0.008;
export const WARRIOR_MP_ON_HIT = 2;      // Savaş Nefesi: Warrior normal vuruşu MP yeniler
export const MP_REGEN_IDLE = 0.02;
export const POTION_CD = 10;
export const GLOBAL_SKILL_CD = 0.5;

export const PLAYER_DR_CAP = 0.6;       // V3: oyuncunun toplam hasar azaltması (beceri + ustalık + eşya) en çok %60
export const TG_SQUASH = 0.75;          // daire telegraflarının dikey basıklığı (çizim = isabet alanı)
export const PLAYER_SPEED_TILES = 3.6;  // tile / sn
export const DEATH_DURABILITY_LOSS = 10;
export const DURABILITY_WARN = 20;
export const BROKEN_PENALTY = 0.75;     // 0 dayanıklılıkta temel değer çarpanı

export const RARITIES = ['N', 'U', 'R', 'E', 'L'];
export const RARITY_INFO = {
  N: { name: 'Normal', color: '#d6d2c4', bonusCount: 0, upMult: 0.6 },
  U: { name: 'Uncommon', color: '#5fd068', bonusCount: 1, upMult: 0.8 },
  R: { name: 'Rare', color: '#4f9bff', bonusCount: 2, upMult: 1.0 },
  E: { name: 'Epic', color: '#c070ff', bonusCount: 3, upMult: 1.5 },
  L: { name: 'Legendary', color: '#ff9b2e', bonusCount: 0, upMult: 2.2 },
};

export const SLOTS = ['weapon', 'offhand', 'helm', 'chest', 'gloves', 'boots', 'ring', 'amulet'];
export const SLOT_NAMES = {
  weapon: 'Ana El', offhand: 'Yardımcı El', helm: 'Başlık', chest: 'Göğüs',
  gloves: 'Eldiven', boots: 'Bot', ring: 'Yüzük', amulet: 'Kolye',
};

export const SPECIES = {
  beast: 'Hayvan', plant: 'Bitki', humanoid: 'İnsansı', insect: 'Böcek',
  undead: 'Ölümsüz', construct: 'Yapı', elemental: 'Element',
};

// Sonraki seviye için EXP = en yakın 10'a yuvarlanan (80 + 2.4 L^3)
// V2: aynı formül 20→30 için 19280 … 58610 değerlerini verir (toplam 368.300; birim testte sabitlenmiştir).
// V3: aynı formül 30→40 için 64880 … 142450 değerlerini verir (toplam 1.006.820; birim testte sabitlenmiştir).
// V4: aynı formül 40→50 için 153680 … 282440 değerlerini verir (toplam 2.142.150; birim testte sabitlenmiştir).
export function xpToNext(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.round((80 + 2.4 * level ** 3) / 10) * 10;
}

export function cumulativeXp(level) {
  let t = 0;
  for (let l = 1; l < level; l++) t += xpToNext(l);
  return t;
}

// Seviye farkı EXP çarpanı (yaratık seviyesi - oyuncu seviyesi)
export function expMultiplier(playerLv, mobLv) {
  const d = mobLv - playerLv;
  if (d >= 4) return 1.15;
  if (d >= 1) return 1.05;
  if (d >= -2) return 1.0;
  if (d >= -5) return 0.65;
  if (d >= -8) return 0.25;
  return 0.10;
}

// Düşman başına temel gold aralığı
export function goldRangeForLevel(lv) {
  if (lv < 5) return [1, 3];
  if (lv < 10) return [3, 6];
  if (lv < 15) return [7, 10];
  if (lv < 21) return [11, 16];
  if (lv < 25) return [16, 23];
  if (lv < 31) return [20, 29];
  if (lv < 36) return [26, 38];   // V3: Ölü Krallık
  if (lv < 41) return [32, 46];   // V3: Kara Taht
  if (lv < 46) return [40, 56];   // V4: Gökyarık Ovası
  return [48, 66];                // V4: Yıldız Mezarı / Gökyarık Mabedi
}

export const RESET_COST = (level) => (level <= 10 ? 0 : level <= 14 ? 1000 : level <= 20 ? 2500 : level <= 30 ? 5000 : level <= 40 ? 7500 : 10000);
// Stat sıfırlama: karakter başına ilk sıfırlama ücretsiz, sonrakiler seviyeye göre (Lv.5 375 · Lv.10 1.000 · Lv.20 3.000 · Lv.30 6.000)
export const STAT_RESET_COST = (level) => 50 * level + 5 * level * level;
