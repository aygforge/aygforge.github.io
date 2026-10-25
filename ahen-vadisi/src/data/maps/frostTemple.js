// Buz Mabedi — 100×76 solo dungeon (V2, Lv.28–30). 4 bölüm:
// Buzdan Geçit → Donuk Salon → Mühür Galerisi (3 mühür, her biri kısa bir karşılaşma başlatır) → Donmuş Muhafız.
const SEALS = [
  { id: 'seal_a', x: 41, y: 28, name: 'Ayaz Mührü', wave: [['frost_wolf', 2], ['ice_wisp', 1]] },
  { id: 'seal_b', x: 59, y: 30, name: 'Kar Mührü', wave: [['snow_shaman', 1], ['frost_sentinel', 1]] },
  { id: 'seal_c', x: 48, y: 42, name: 'Buz Mührü', wave: [['ice_wisp', 2], ['snow_shaman', 1]] },
];
export default {
  id: 'frost_temple', name: 'Buz Mabedi', w: 100, h: 76, seed: 8484, dungeon: true,
  rec: 'Lv. 28–30', theme: 'temple', ambient: 'dungeon', music: 'temple', dark: 0.4, particles: 'snow_light',
  base: 'temple_floor', mass: 'ice_mass', carve: true,
  boss: 'frozen_guardian',
  areas: [
    { id: 't_stage1', name: 'Buzdan Geçit', x: 14, y: 62, r: 9, ground: 'ice_floor', stage: 1, keepRatio: 0.6 },
    { id: 't_stage2', name: 'Donuk Salon', rect: [30, 55, 66, 69], stage: 2 },
    { id: 't_stage3', name: 'Mühür Galerisi', x: 50, y: 33, r: 11, stage: 3, keepRatio: 0.7 },
    { id: 't_ante', name: 'Kontrol Noktası', x: 66, y: 24, r: 3 },
    { id: 't_stage4', name: 'Donmuş Taht', x: 84, y: 16, r: 12, ground: 'ice_floor', stage: 4, keepRatio: 0.85 },
  ],
  paths: [
    { pts: [[3, 71], [8, 68], [14, 62]], w: 3 },
    { pts: [[14, 62], [22, 62], [31, 62]], w: 3 },
    { pts: [[62, 56], [62, 48], [56, 42]], w: 3 },
    { pts: [[58, 28], [62, 24], [66, 24]], w: 3 },
    { pts: [[66, 24], [74, 24], [76, 18], [84, 16]], w: 4 },
  ],
  gates: [
    { id: 'g1', x0: 25, y0: 56, x1: 25, y1: 68, opensAfter: 1 },
    { id: 'g2', x0: 56, y0: 51, x1: 67, y1: 51, opensAfter: 2 },
    { id: 'g3', x0: 70, y0: 19, x1: 70, y1: 29, opensAfter: 3, bossDoor: true },
  ],
  stages: {
    1: [['frost_wolf', 4], ['ice_wisp', 3]],
    2: [['frost_sentinel', 3], ['snow_shaman', 3]],
    3: [['frost_sentinel', 1], ['snow_shaman', 1]],
    4: [['frozen_guardian', 1]],
  },
  // Mühür Galerisi: her mühre dokunmak kısa bir karşılaşma başlatır; karşılaşma temizlenince mühür kırılır.
  seals: SEALS,
  bossSpawn: { x: 86, y: 14 },
  crystalSpawns: [{ x: 76, y: 9 }, { x: 94, y: 23 }],
  stamps: [
    { s: 'ice_pillar', x: 41, y: 22 }, { s: 'ice_pillar', x: 59, y: 22 }, { s: 'ice_pillar', x: 40, y: 39 }, { s: 'ice_pillar', x: 60, y: 39 },
    { s: 'frozen_statue', x: 50, y: 23 }, { s: 'brazier', x: 62, y: 21 }, { s: 'brazier', x: 68, y: 21 },
    { s: 'ice_crystal_big', x: 9, y: 56 }, { s: 'ice_crystal_big', x: 19, y: 56 },
    { s: 'ice_pillar', x: 34, y: 56 }, { s: 'ice_pillar', x: 46, y: 56 }, { s: 'ice_pillar', x: 54, y: 66 },
    { s: 'ice_pillar', x: 76, y: 6 }, { s: 'ice_pillar', x: 92, y: 6 }, { s: 'ice_pillar', x: 74, y: 25 }, { s: 'ice_pillar', x: 95, y: 25 },
  ],
  scatter: [
    { s: 'ice_crystal_big', d: 0.018, on: ['ice_floor'] }, { s: 'ice_boulder', d: 0.003 },
  ],
  decor: [
    { tiles: ['ice_crack', 'ice_shards', 'frost_crystal_small'], d: 0.09, on: ['ice_floor'] },
    { tiles: ['rune_ice', 'cracks', 'ice_shards'], d: 0.05, on: ['temple_floor'], salt: 2 },
    { tiles: ['skull', 'cobweb'], d: 0.01, on: ['temple_floor'], salt: 3 },
  ],
  objects: [
    { type: 'portal', id: 't_exit', x: 3, y: 72, to: 'frost', entry: 'from_temple', label: 'Ayaz Geçidi\'ne dön (koşuyu bitir)', dungeonExit: true },
    { type: 'checkpoint', id: 't_checkpoint', x: 66, y: 24 },
    ...SEALS.map((sl) => ({ type: 'seal', id: sl.id, x: sl.x, y: sl.y, label: sl.name, clear: 1.2 })),
    { type: 'fx', fx: 'brazier', x: 62, y: 21 }, { type: 'fx', fx: 'brazier', x: 68, y: 21 },
    { type: 'fx', fx: 'torch', x: 8, y: 66 }, { type: 'fx', fx: 'torch', x: 20, y: 60 },
  ],
  entries: {
    entrance: { x: 5, y: 70 },
    cp1: { x: 28, y: 62 },
    cp2: { x: 62, y: 47 },
    checkpoint: { x: 65, y: 24 },
    respawn: { x: 5, y: 70 },
  },
  locations: [],
};
