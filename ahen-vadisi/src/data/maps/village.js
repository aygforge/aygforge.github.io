// Karaağaç Köyü — 64×48, güvenli bölge, 7 NPC, eğitim alanı, Orman çıkışı (doğu)
export default {
  id: 'village', name: 'Karaağaç Köyü', w: 64, h: 48, seed: 1701, safe: true,
  rec: 'Güvenli bölge', theme: 'village', ambient: 'village', music: 'village',
  base: 'grass', mass: 'forest_mass',
  border: { thick: 3, noise: 2.5 },
  areas: [
    { id: 'plaza', x: 30, y: 24, r: 6, ground: 'cobble' },
    { id: 'training', x: 18, y: 27, r: 4, ground: 'dirt', spawns: [{ enemy: 'training_dummy', max: 3 }], noRespawnDelay: true },
    { id: 'east_gate', x: 56, y: 24, r: 4 },
  ],
  paths: [
    { pts: [[4, 24], [24, 24], [36, 24], [63, 24]], w: 3, tile: 'cobble' },
    { pts: [[30, 16], [30, 42]], w: 3, tile: 'cobble' },
    { pts: [[30, 18], [41, 18]], w: 2, tile: 'dirt' },
    { pts: [[30, 30], [38, 31], [43, 39]], w: 2, tile: 'dirt' },
    { pts: [[24, 24], [18, 32], [18, 38]], w: 2, tile: 'dirt' },
    { pts: [[24, 24], [13, 21]], w: 2, tile: 'dirt' },
    { pts: [[48, 24], [53, 22]], w: 2, tile: 'dirt' },
  ],
  stamps: [
    { s: 'house_red', x: 28, y: 11 },      // Muhtar evi
    { s: 'house_blue', x: 20, y: 11 },
    { s: 'smithy', x: 38, y: 12 },
    { s: 'anvil', x: 43, y: 18 },
    { s: 'stall_red', x: 35, y: 28 },
    { s: 'stall_blue', x: 40, y: 28 },
    { s: 'house_green', x: 15, y: 32 },    // Şifahane
    { s: 'tent', x: 52, y: 18 },           // Avcı çadırı
    { s: 'big_tree', x: 10, y: 14 },       // Bilge çınarı
    { s: 'warehouse', x: 40, y: 34 },      // Depo
    { s: 'house_brown', x: 48, y: 33 },
    { s: 'house_red', x: 47, y: 8 },
    { s: 'well', x: 25, y: 20 },
    { s: 'barrel', x: 37, y: 17 }, { s: 'barrel', x: 44, y: 17 }, { s: 'crate', x: 45, y: 17 },
    { s: 'crate', x: 34, y: 30 }, { s: 'barrel', x: 43, y: 30 }, { s: 'haystack', x: 22, y: 38 },
    { s: 'haystack', x: 9, y: 31 }, { s: 'crate', x: 39, y: 39 }, { s: 'barrel', x: 46, y: 39 },
    { s: 'fence_h', x: 13, y: 23 }, { s: 'fence_h', x: 14, y: 23 }, { s: 'fence_h', x: 15, y: 23 },
    { s: 'fence_h', x: 13, y: 31 }, { s: 'fence_h', x: 14, y: 31 }, { s: 'fence_h', x: 22, y: 31 }, { s: 'fence_h', x: 23, y: 31 },
    { s: 'sign', x: 59, y: 22 }, { s: 'sign', x: 26, y: 29 },
  ],
  scatter: [
    { s: 'tree_oak', d: 0.018 }, { s: 'tree_birch', d: 0.012 }, { s: 'bush', d: 0.012 }, { s: 'rock', d: 0.004 },
  ],
  decor: [
    { tiles: ['flower_red', 'flower_yellow', 'flower_white', 'flower_blue'], d: 0.05, on: ['grass'] },
    { tiles: ['tuft', 'tuft2', 'clover'], d: 0.12, on: ['grass'] },
    { tiles: ['pebbles'], d: 0.03, on: ['dirt', 'cobble'] },
  ],
  objects: [
    { type: 'npc', npc: 'muhtar', x: 30, y: 17 },
    { type: 'npc', npc: 'boran', x: 41, y: 19 },
    { type: 'npc', npc: 'mira', x: 38, y: 31 },
    { type: 'npc', npc: 'elin', x: 18, y: 38 },
    { type: 'npc', npc: 'hunter', x: 54, y: 22 },
    { type: 'npc', npc: 'sage', x: 12, y: 21 },
    { type: 'npc', npc: 'keeper', x: 43, y: 40 },
    { type: 'waystone', id: 'ws_village', x: 34, y: 21 },
    { type: 'portal', id: 'v_to_forest', x: 63, y: 24, to: 'forest', entry: 'from_village', label: 'Fısıldayan Orman' },
    { type: 'fx', fx: 'forge', x: 39, y: 15 },
    { type: 'fx', fx: 'chimney', x: 29, y: 11 },
    { type: 'fx', fx: 'chimney', x: 48, y: 8 },
  ],
  entries: {
    start: { x: 30, y: 26 },
    from_forest: { x: 59, y: 24 },
    waystone: { x: 34, y: 23 },
    respawn: { x: 30, y: 26 },
  },
  locations: [],
};
