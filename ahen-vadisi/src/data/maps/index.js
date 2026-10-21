import village from './village.js';
import forest from './forest.js';
import mine from './mine.js';
import swamp from './swamp.js';
import dungeon from './dungeon.js';

export const MAPS = { village, forest, mine, swamp, dungeon };
export const MAP_ORDER = ['village', 'forest', 'mine', 'swamp', 'dungeon'];

// Yol Taşı hızlı seyahat ücretleri (belge §9.5). Köy ücretsizdir.
export const WAYSTONES = {
  ws_village: { map: 'village', cost: 0, name: 'Karaağaç Köyü' },
  ws_forest: { map: 'forest', cost: 40, name: 'Fısıldayan Orman' },
  ws_mine: { map: 'mine', cost: 80, name: 'Kırık Damar Madeni' },
  ws_swamp: { map: 'swamp', cost: 120, name: 'Sis Bataklığı' },
};

// Elit doğma kuralı: haritadaki öldürme katkısı + aktif süre alt sınırı (bekleyerek istismar edilemez)
export const ELITE_RULE = { killsNeeded: 25, minActiveSec: 120 };
export const ALTAR_COOLDOWN = 300;   // sn aktif oyun süresi
export const GATHER_RESPAWN = [60, 90];
