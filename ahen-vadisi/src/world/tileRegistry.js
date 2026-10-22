// Tile kaydı: her tile adı → tileset indeksi. Saf veri; sanat modülü bu tanımlara göre çizer,
// harita üreticisi (Node testlerinde de) indeksleri buradan alır.

export const TERRAINS = [
  'grass', 'forest_floor', 'dirt', 'cobble', 'swamp', 'mud', 'water', 'swamp_water',
  'cave', 'crystal_floor', 'dungeon', 'plank', 'sand',
  // V2: Kül Yaylaları / Ayaz Geçidi / Buz Mabedi
  'ash', 'scorched', 'basalt', 'lava', 'snow', 'ice', 'frost_stone', 'frozen_water', 'temple_floor', 'ice_floor',
  // V3: Ölü Krallık / Kara Taht / Karanlık Mahzen
  'dead_grass', 'grave_soil', 'ruin_cobble', 'void_pool', 'obsidian', 'royal_floor', 'crypt_floor',
];
export const TERRAIN_VARIANTS = 4;
export const WATER_TERRAINS = new Set(['water', 'swamp_water', 'lava', 'frozen_water', 'void_pool']);

// Geçiş çiftleri (üst terrain / taban terrain) — 4-bit maske ile 15 kenar varyantı
export const TRANSITIONS = [
  ['dirt', 'grass'], ['dirt', 'forest_floor'], ['cobble', 'grass'], ['water', 'grass'],
  ['water', 'forest_floor'], ['mud', 'swamp'], ['swamp_water', 'swamp'], ['sand', 'grass'],
  ['crystal_floor', 'cave'], ['dirt', 'cave'], ['plank', 'swamp_water'], ['dirt', 'swamp'], ['crystal_floor', 'dungeon'], ['grass', 'forest_floor'], ['cave', 'dungeon'], ['cobble', 'dirt'],
  // V2
  ['scorched', 'ash'], ['basalt', 'ash'], ['lava', 'scorched'], ['lava', 'ash'], ['basalt', 'scorched'], ['dirt', 'ash'], ['ash', 'cave'],
  ['ice', 'snow'], ['frost_stone', 'snow'], ['frozen_water', 'snow'], ['frozen_water', 'ice'], ['snow', 'ash'], ['frost_stone', 'ash'],
  ['ice_floor', 'temple_floor'], ['snow', 'temple_floor'],
  // V3
  ['grave_soil', 'dead_grass'], ['ruin_cobble', 'dead_grass'], ['ruin_cobble', 'grave_soil'], ['void_pool', 'dead_grass'], ['void_pool', 'grave_soil'],
  ['snow', 'dead_grass'], ['frost_stone', 'dead_grass'],
  ['royal_floor', 'obsidian'], ['ruin_cobble', 'obsidian'], ['grave_soil', 'obsidian'], ['void_pool', 'obsidian'], ['royal_floor', 'ruin_cobble'], ['dead_grass', 'obsidian'],
  ['royal_floor', 'crypt_floor'], ['void_pool', 'crypt_floor'], ['grave_soil', 'crypt_floor'],
];

export const MASSES = ['forest_mass', 'rock_mass', 'swamp_mass', 'dungeon_mass', 'hedge_mass', 'ash_mass', 'snow_mass', 'ice_mass', 'dead_mass', 'obsidian_mass', 'crypt_mass'];
export const MASS_FILL_VARIANTS = 3;
export const MASS_FACE_VARIANTS = 2;

export const DECOR = [
  'flower_red', 'flower_yellow', 'flower_white', 'flower_blue', 'tuft', 'tuft2', 'pebbles', 'mushroom', 'leaves',
  'bones', 'rubble', 'crystal_small', 'reeds', 'lily', 'skull', 'puddle', 'roots', 'rail_h', 'rail_v',
  'cracks', 'moss', 'ore_specks', 'cobweb', 'fern', 'clover',
  // V2
  'embers', 'ash_pile', 'lava_crack', 'charred_bones', 'cinder', 'snow_tuft', 'frost_crystal_small', 'ice_shards', 'footprints', 'frozen_grass', 'ice_crack', 'rune_ice',
  // V3
  'dead_tuft', 'bone_pile', 'cursed_rune', 'grave_candle', 'obsidian_shards', 'void_crack', 'fog_wisp',
];

// Damga (stamp): çok tile'lı nesneler. upper satırları varlıkların üstünde çizilir,
// solid satırları çarpışma üretir.
export const STAMPS = {
  tree_oak: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  tree_pine: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  tree_birch: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  big_tree: { w: 4, h: 5, upper: [0, 1, 2, 3], solid: [4] },
  bush: { w: 1, h: 1, upper: [], solid: [0] },
  rock: { w: 1, h: 1, upper: [], solid: [0] },
  rock_big: { w: 2, h: 2, upper: [0], solid: [1] },
  stump: { w: 1, h: 1, upper: [], solid: [0] },
  log: { w: 2, h: 1, upper: [], solid: [0] },
  house_red: { w: 5, h: 5, upper: [0, 1, 2], solid: [3, 4] },
  house_blue: { w: 5, h: 5, upper: [0, 1, 2], solid: [3, 4] },
  house_brown: { w: 5, h: 5, upper: [0, 1, 2], solid: [3, 4] },
  house_green: { w: 5, h: 5, upper: [0, 1, 2], solid: [3, 4] },
  smithy: { w: 6, h: 5, upper: [0, 1, 2], solid: [3, 4] },
  warehouse: { w: 6, h: 5, upper: [0, 1, 2], solid: [3, 4] },
  stall_red: { w: 3, h: 2, upper: [0], solid: [1] },
  stall_blue: { w: 3, h: 2, upper: [0], solid: [1] },
  well: { w: 2, h: 2, upper: [0], solid: [1] },
  fence_h: { w: 1, h: 1, upper: [], solid: [0] },
  fence_v: { w: 1, h: 1, upper: [], solid: [0] },
  barrel: { w: 1, h: 1, upper: [], solid: [0] },
  crate: { w: 1, h: 1, upper: [], solid: [0] },
  haystack: { w: 1, h: 1, upper: [], solid: [0] },
  anvil: { w: 1, h: 1, upper: [], solid: [0] },
  tent: { w: 3, h: 3, upper: [0, 1], solid: [2] },
  pillar: { w: 1, h: 2, upper: [0], solid: [1] },
  crystal_big: { w: 1, h: 2, upper: [0], solid: [1] },
  support: { w: 1, h: 2, upper: [0], solid: [1] },
  cart: { w: 2, h: 1, upper: [], solid: [0] },
  dead_tree: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  mangrove: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  tombstone: { w: 1, h: 1, upper: [], solid: [0] },
  tombstone2: { w: 1, h: 1, upper: [], solid: [0] },
  ruin_pillar: { w: 1, h: 2, upper: [0], solid: [1] },
  ruin_wall: { w: 2, h: 2, upper: [0], solid: [1] },
  statue: { w: 1, h: 2, upper: [0], solid: [1] },
  brazier: { w: 1, h: 1, upper: [], solid: [0] },
  sign: { w: 1, h: 1, upper: [], solid: [0] },
  // V2
  charred_tree: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  basalt_rock: { w: 2, h: 2, upper: [0], solid: [1] },
  lava_vent: { w: 1, h: 1, upper: [], solid: [0] },
  burnt_wagon: { w: 2, h: 1, upper: [], solid: [0] },
  ash_ruin_wall: { w: 2, h: 2, upper: [0], solid: [1] },
  ruin_tower: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  obsidian_spire: { w: 1, h: 2, upper: [0], solid: [1] },
  frozen_pine: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  ice_crystal_big: { w: 1, h: 2, upper: [0], solid: [1] },
  ice_boulder: { w: 2, h: 2, upper: [0], solid: [1] },
  frozen_statue: { w: 1, h: 2, upper: [0], solid: [1] },
  ice_pillar: { w: 1, h: 2, upper: [0], solid: [1] },
  snow_tent: { w: 3, h: 3, upper: [0, 1], solid: [2] },
  watchtower: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  frozen_bush: { w: 1, h: 1, upper: [], solid: [0] },
  // V3
  ruined_house: { w: 5, h: 5, upper: [0, 1, 2], solid: [3, 4] },
  mausoleum: { w: 3, h: 3, upper: [0, 1], solid: [2] },
  broken_monument: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  dead_oak: { w: 2, h: 3, upper: [0, 1], solid: [2] },
  grave_cross: { w: 1, h: 1, upper: [], solid: [0] },
  iron_fence: { w: 1, h: 1, upper: [], solid: [0] },
  obsidian_wall: { w: 2, h: 2, upper: [0], solid: [1] },
  royal_statue: { w: 1, h: 2, upper: [0], solid: [1] },
  dark_obelisk: { w: 1, h: 2, upper: [0], solid: [1] },
  throne_banner: { w: 1, h: 2, upper: [0], solid: [1] },
  bone_heap: { w: 1, h: 1, upper: [], solid: [0] },
  coffin: { w: 2, h: 1, upper: [], solid: [0] },
};

const defs = [];
const index = {};
function add(name, def) {
  index[name] = defs.length;
  defs.push({ name, ...def });
}

for (const t of TERRAINS) for (let v = 0; v < TERRAIN_VARIANTS; v++) add(`${t}_${v}`, { kind: 'terrain', terrain: t, v });
for (const [over, base] of TRANSITIONS) {
  for (let m = 0; m < 15; m++) add(`${over}/${base}_${m}`, { kind: 'trans', over, base, mask: m });
}
for (const m of MASSES) {
  for (let v = 0; v < MASS_FILL_VARIANTS; v++) add(`${m}_fill_${v}`, { kind: 'mass', mass: m, part: 'fill', v });
  for (let v = 0; v < MASS_FACE_VARIANTS; v++) add(`${m}_face_${v}`, { kind: 'mass', mass: m, part: 'face', v });
}
for (const d of DECOR) add(d, { kind: 'decor' });
for (const [s, sd] of Object.entries(STAMPS)) {
  for (let r = 0; r < sd.h; r++) for (let c = 0; c < sd.w; c++) add(`${s}#${r}_${c}`, { kind: 'stamp', stamp: s, r, c });
}

export const TILE_DEFS = defs;
export const TILE_COUNT = defs.length;
export function T(name) {
  const i = index[name];
  if (i === undefined) throw new Error(`Bilinmeyen tile: ${name}`);
  return i;
}
export function hasTile(name) {
  return index[name] !== undefined;
}
