// Tile kaydı: her tile adı → tileset indeksi. Saf veri; sanat modülü bu tanımlara göre çizer,
// harita üreticisi (Node testlerinde de) indeksleri buradan alır.

export const TERRAINS = [
  'grass', 'forest_floor', 'dirt', 'cobble', 'swamp', 'mud', 'water', 'swamp_water',
  'cave', 'crystal_floor', 'dungeon', 'plank', 'sand',
];
export const TERRAIN_VARIANTS = 4;
export const WATER_TERRAINS = new Set(['water', 'swamp_water']);

// Geçiş çiftleri (üst terrain / taban terrain) — 4-bit maske ile 15 kenar varyantı
export const TRANSITIONS = [
  ['dirt', 'grass'], ['dirt', 'forest_floor'], ['cobble', 'grass'], ['water', 'grass'],
  ['water', 'forest_floor'], ['mud', 'swamp'], ['swamp_water', 'swamp'], ['sand', 'grass'],
  ['crystal_floor', 'cave'], ['dirt', 'cave'], ['plank', 'swamp_water'], ['dirt', 'swamp'], ['crystal_floor', 'dungeon'], ['grass', 'forest_floor'], ['cave', 'dungeon'], ['cobble', 'dirt'],
];

export const MASSES = ['forest_mass', 'rock_mass', 'swamp_mass', 'dungeon_mass', 'hedge_mass'];
export const MASS_FILL_VARIANTS = 3;
export const MASS_FACE_VARIANTS = 2;

export const DECOR = [
  'flower_red', 'flower_yellow', 'flower_white', 'flower_blue', 'tuft', 'tuft2', 'pebbles', 'mushroom', 'leaves',
  'bones', 'rubble', 'crystal_small', 'reeds', 'lily', 'skull', 'puddle', 'roots', 'rail_h', 'rail_v',
  'cracks', 'moss', 'ore_specks', 'cobweb', 'fern', 'clover',
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
