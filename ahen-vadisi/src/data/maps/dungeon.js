// Derin Ocak — 104×80 solo dungeon. 4 bölüm: Eski Maden Girişi → Kristal Koridoru → Gözcünün Salonu → Maden Golemi Odası
export default {
  id: 'dungeon', name: 'Derin Ocak', w: 104, h: 80, seed: 6060, dungeon: true,
  rec: 'Lv. 19–20', theme: 'dungeon', ambient: 'dungeon', music: 'dungeon', dark: 0.62,
  base: 'dungeon', mass: 'dungeon_mass', carve: true,
  areas: [
    { id: 'd_stage1', name: 'Eski Maden Girişi', x: 14, y: 64, r: 9, ground: 'cave', stage: 1, keepRatio: 0.6 },
    { id: 'd_stage2', name: 'Kristal Koridoru', rect: [30, 58, 64, 66], ground: 'crystal_floor', stage: 2 },
    { id: 'd_stage3', name: 'Gözcünün Salonu', x: 54, y: 38, r: 9, stage: 3, keepRatio: 0.6 },
    { id: 'd_ante', name: 'Kontrol Noktası', x: 64, y: 30, r: 3 },
    { id: 'd_stage4', name: 'Maden Golemi Odası', x: 84, y: 18, r: 12, ground: 'crystal_floor', stage: 4, keepRatio: 0.85 },
  ],
  paths: [
    { pts: [[3, 72], [8, 70], [14, 64]], w: 3 },
    { pts: [[14, 64], [20, 62], [31, 62]], w: 3 },
    { pts: [[62, 63], [62, 46], [56, 42]], w: 3 },
    { pts: [[54, 38], [58, 32], [64, 30]], w: 3 },
    { pts: [[64, 30], [74, 30], [74, 24], [84, 18]], w: 4 },
  ],
  // Bölüm kapıları: bölüm temizlenince açılır (çalışma zamanında çarpışma)
  gates: [
    { id: 'g1', x0: 24, y0: 57, x1: 24, y1: 67, opensAfter: 1 },
    { id: 'g2', x0: 57, y0: 52, x1: 67, y1: 52, opensAfter: 2 },
    { id: 'g3', x0: 69, y0: 25, x1: 69, y1: 35, opensAfter: 3, bossDoor: true },
  ],
  stages: {
    1: [['ironshell_beetle', 3], ['cave_bat', 3], ['ore_priest', 2]],
    2: [['ore_priest', 3], ['rotten_guard', 3], ['cave_bat', 2]],
    3: [['watcher_empowered', 1], ['rotten_guard', 2]],
    4: [['mine_golem', 1]],
  },
  bossSpawn: { x: 86, y: 16 },
  crystalSpawns: [{ x: 76, y: 10 }, { x: 93, y: 25 }],
  stamps: [
    { s: 'pillar', x: 46, y: 31 }, { s: 'pillar', x: 61, y: 31 }, { s: 'pillar', x: 46, y: 43 }, { s: 'pillar', x: 61, y: 43 },
    { s: 'statue', x: 53, y: 30 }, { s: 'brazier', x: 60, y: 28 }, { s: 'brazier', x: 67, y: 28 },
    { s: 'support', x: 9, y: 58 }, { s: 'support', x: 19, y: 58 }, { s: 'cart', x: 10, y: 68 },
    { s: 'pillar', x: 76, y: 7 }, { s: 'pillar', x: 92, y: 7 }, { s: 'pillar', x: 74, y: 27 }, { s: 'pillar', x: 95, y: 27 },
  ],
  scatter: [
    { s: 'crystal_big', d: 0.02, on: ['crystal_floor'] }, { s: 'rock', d: 0.008 }, { s: 'pillar', d: 0.003 },
  ],
  decor: [
    { tiles: ['cracks', 'rubble', 'bones', 'pebbles'], d: 0.08, on: ['dungeon', 'cave'] },
    { tiles: ['crystal_small', 'cracks'], d: 0.12, on: ['crystal_floor'], salt: 2 },
    { tiles: ['skull', 'cobweb'], d: 0.015, on: ['dungeon', 'cave'], salt: 3 },
  ],
  objects: [
    { type: 'portal', id: 'd_exit', x: 3, y: 73, to: 'mine', entry: 'from_dungeon', label: 'Madene dön (koşuyu bitir)', dungeonExit: true },
    { type: 'checkpoint', id: 'd_checkpoint', x: 64, y: 30 },
    { type: 'fx', fx: 'torch', x: 8, y: 66 }, { type: 'fx', fx: 'torch', x: 20, y: 60 }, { type: 'fx', fx: 'torch', x: 50, y: 34 },
    { type: 'fx', fx: 'torch', x: 58, y: 34 }, { type: 'fx', fx: 'brazier', x: 60, y: 28 }, { type: 'fx', fx: 'brazier', x: 67, y: 28 },
  ],
  entries: {
    entrance: { x: 5, y: 71 },
    cp1: { x: 27, y: 62 },
    cp2: { x: 62, y: 49 },
    checkpoint: { x: 63, y: 30 },
    respawn: { x: 5, y: 71 },
  },
  locations: [],
};
