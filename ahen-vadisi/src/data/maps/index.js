import village from './village.js';
import forest from './forest.js';
import mine from './mine.js';
import swamp from './swamp.js';
import dungeon from './dungeon.js';
import ash from './ash.js';
import frost from './frost.js';
import frostTemple from './frostTemple.js';
import deadKingdom from './deadKingdom.js';
import blackThrone from './blackThrone.js';
import darkCrypt from './darkCrypt.js';

export const MAPS = { village, forest, mine, swamp, dungeon, ash, frost, frost_temple: frostTemple, dead_kingdom: deadKingdom, black_throne: blackThrone, dark_crypt: darkCrypt };
export const MAP_ORDER = ['village', 'forest', 'mine', 'swamp', 'dungeon', 'ash', 'frost', 'frost_temple', 'dead_kingdom', 'black_throne', 'dark_crypt'];
export const DUNGEON_MAPS = ['dungeon', 'frost_temple', 'dark_crypt'];

// Yol Taşı hızlı seyahat ücretleri (belge §9.5). Köy ücretsizdir.
export const WAYSTONES = {
  ws_village: { map: 'village', cost: 0, name: 'Karaağaç Köyü' },
  ws_forest: { map: 'forest', cost: 40, name: 'Fısıldayan Orman' },
  ws_mine: { map: 'mine', cost: 80, name: 'Kırık Damar Madeni' },
  ws_swamp: { map: 'swamp', cost: 120, name: 'Sis Bataklığı' },
  ws_ash: { map: 'ash', cost: 180, name: 'Kül Yaylaları' },
  ws_frost: { map: 'frost', cost: 240, name: 'Ayaz Geçidi' },
  ws_dead: { map: 'dead_kingdom', cost: 300, name: 'Ölü Krallık' },
  ws_throne: { map: 'black_throne', cost: 360, name: 'Kara Taht' },
};

// Elit doğma kuralı: haritadaki öldürme katkısı + aktif süre alt sınırı (bekleyerek istismar edilemez)
export const ELITE_RULE = { killsNeeded: 25, minActiveSec: 120 };
export const ALTAR_COOLDOWN = 300;   // sn aktif oyun süresi
export const GATHER_RESPAWN = [60, 90];
