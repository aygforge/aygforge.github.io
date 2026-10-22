// Karanlık Mahzen — 100×76 solo dungeon (V3, Lv.38–40). Kara Taht'ın altında. 4 bölüm:
// Kırık Taç Kapısı (temizle) → Sessiz Zindan (dar koridorlar + 2 kapı mekanizması) →
// Kraliyet Mühürleri (3 mühür, her biri kısa bir savunma karşılaşması) → Kayıp Kral'ın Tahtı.
// Mekanizmalar ve mühürler aynı `seals` listesinde tutulur; `stage` hangi bölümün kapısını tuttuğunu söyler.
const SEALS = [
  { id: 'lever_a', stage: 2, kind: 'lever', x: 39, y: 67, name: 'Doğu Kapı Mekanizması', wave: [] },
  { id: 'lever_b', stage: 2, kind: 'lever', x: 57, y: 57, name: 'Batı Kapı Mekanizması', wave: [] },
  { id: 'crown_seal_a', x: 41, y: 28, name: 'Taç Mührü', wave: [['shadow_hunter', 2], ['cursed_guard', 1]] },
  { id: 'crown_seal_b', x: 59, y: 30, name: 'Kılıç Mührü', wave: [['throne_executioner', 1], ['void_priest', 1]] },
  { id: 'crown_seal_c', x: 48, y: 42, name: 'Yemin Mührü', wave: [['obsidian_sentinel', 1], ['grave_mage', 2]] },
];
export default {
  id: 'dark_crypt', name: 'Karanlık Mahzen', w: 100, h: 76, seed: 4040, dungeon: true,
  rec: 'Lv. 38–40', theme: 'crypt', ambient: 'dungeon', music: 'crypt', dark: 0.45, particles: 'void',
  base: 'crypt_floor', mass: 'crypt_mass', carve: true,
  boss: 'lost_king',
  areas: [
    { id: 'c_stage1', name: 'Kırık Taç Kapısı', x: 14, y: 62, r: 9, ground: 'grave_soil', stage: 1, keepRatio: 0.6 },
    { id: 'c_stage2', name: 'Sessiz Zindan', rect: [30, 60, 66, 64], stage: 2 },
    { id: 'c_treasure', name: 'Saklı Oda', x: 47, y: 73, r: 2 },
    { id: 'c_stage3', name: 'Kraliyet Mühürleri', x: 50, y: 33, r: 11, ground: 'royal_floor', stage: 3, keepRatio: 0.7 },
    { id: 'c_ante', name: 'Kontrol Noktası', x: 66, y: 24, r: 3 },
    { id: 'c_stage4', name: 'Kayıp Kral\'ın Tahtı', x: 84, y: 16, r: 12, ground: 'royal_floor', stage: 4, keepRatio: 0.85 },
  ],
  paths: [
    { pts: [[3, 71], [8, 68], [14, 62]], w: 3 },
    { pts: [[14, 62], [22, 62], [31, 62]], w: 3 },
    // Sessiz Zindan: dar yan koridorlar (mekanizmalar, saklı oda) ve kuzeye çıkış
    { pts: [[39, 62], [39, 68]], w: 2 },
    { pts: [[57, 62], [57, 56]], w: 2 },
    { pts: [[47, 64], [47, 73]], w: 2 },
    { pts: [[62, 62], [62, 56]], w: 3 },
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
    1: [['cursed_guard', 3], ['shadow_hunter', 3], ['shroud_crawler', 2]],
    2: [['grave_mage', 2], ['void_priest', 2], ['obsidian_sentinel', 2]],
    3: [['throne_executioner', 1], ['void_priest', 1]],
    4: [['lost_king', 1]],
  },
  seals: SEALS,
  bossSpawn: { x: 86, y: 14 },
  // Kırık Taç aşamasında (II) beliren iki kadim mühür
  crystalSpawns: [{ x: 76, y: 9 }, { x: 94, y: 23 }],
  stamps: [
    // Kırık Taç Kapısı
    { s: 'royal_statue', x: 9, y: 56 }, { s: 'royal_statue', x: 19, y: 56 }, { s: 'bone_heap', x: 8, y: 64 }, { s: 'coffin', x: 17, y: 67 },
    // Sessiz Zindan
    { s: 'coffin', x: 43, y: 60 }, { s: 'coffin', x: 51, y: 64 }, { s: 'bone_heap', x: 33, y: 64 },
    // Kraliyet Mühürleri
    { s: 'dark_obelisk', x: 41, y: 22 }, { s: 'dark_obelisk', x: 59, y: 22 }, { s: 'royal_statue', x: 40, y: 39 }, { s: 'royal_statue', x: 60, y: 39 },
    { s: 'broken_monument', x: 49, y: 22 }, { s: 'throne_banner', x: 62, y: 21 }, { s: 'throne_banner', x: 68, y: 21 },
    // Taht
    { s: 'throne_banner', x: 76, y: 6 }, { s: 'throne_banner', x: 92, y: 6 }, { s: 'dark_obelisk', x: 74, y: 25 }, { s: 'dark_obelisk', x: 95, y: 25 },
  ],
  scatter: [
    { s: 'bone_heap', d: 0.006, on: ['crypt_floor'] },
  ],
  decor: [
    { tiles: ['cracks', 'bone_pile', 'cobweb', 'grave_candle'], d: 0.07, on: ['crypt_floor'] },
    { tiles: ['cursed_rune', 'void_crack', 'cracks'], d: 0.05, on: ['royal_floor'], salt: 2 },
    { tiles: ['skull', 'bone_pile'], d: 0.06, on: ['grave_soil'], salt: 3 },
  ],
  objects: [
    { type: 'portal', id: 'c_exit', x: 3, y: 72, to: 'black_throne', entry: 'from_crypt', label: 'Kara Taht\'a dön (koşuyu bitir)', dungeonExit: true },
    { type: 'checkpoint', id: 'c_checkpoint', x: 66, y: 24 },
    ...SEALS.map((sl) => ({ type: 'seal', id: sl.id, x: sl.x, y: sl.y, label: sl.name, clear: 1.2 })),
    // Tahtın Kayıp Hazinesi (s42)
    { type: 'qobj', group: 'crypt_treasure', id: 'crypt_treasure', x: 47, y: 74, label: 'Saklı kraliyet sandığı', sprite: 'royal_chest', say: 'Sandıkta kraliyet hazinesinin envanter defteri ve Veysel\'in aradığı mühürlü kese.' },
    { type: 'fx', fx: 'brazier', x: 62, y: 21 }, { type: 'fx', fx: 'brazier', x: 68, y: 21 },
    { type: 'fx', fx: 'torch', x: 8, y: 66 }, { type: 'fx', fx: 'torch', x: 20, y: 60 },
    { type: 'fx', fx: 'brazier', x: 80, y: 8 }, { type: 'fx', fx: 'brazier', x: 88, y: 8 },
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
