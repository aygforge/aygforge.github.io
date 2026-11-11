// Gökyarık Mabedi — 112×80 solo dungeon (V4, Lv.48–50). Yıldız Mezarı'nın doğusunda. 5 bölüm:
// Mabet Kapısı (temizle + kapı mührü) → Enerji Düğümleri (2 gerçek düğüm; sönük düğümler zararsız ipucu verir) →
// Yıldız Koridorları (koridor savaşları) → Gök Mühürleri (3 mühür, her biri 2 dalgalı savunma) → Göğün Mahkûmu.
// Mühür/düğüm/mekanizmalar aynı `seals` listesinde; `stage` hangi bölüm kapısını tuttuğunu söyler, 'decoy' sayılmaz.
const SEALS = [
  { id: 'gate_seal', stage: 1, kind: 'lever', x: 16, y: 59, name: 'Mabet Kapı Mührü', wave: [] },
  { id: 'node_a', stage: 2, kind: 'lever', x: 33, y: 63, name: 'Enerji Düğümü', wave: [] },
  { id: 'node_b', stage: 2, kind: 'lever', x: 55, y: 69, name: 'Enerji Düğümü', wave: [] },
  { id: 'node_x', stage: 2, kind: 'decoy', x: 55, y: 63, name: 'Enerji Düğümü', wave: [],
    hint: 'Düğüm sönük ve soğuk. Zemindeki çatlaklar ışığı çapraz köşelere taşıyor — parlayan iki düğümü ara.' },
  { id: 'node_y', stage: 2, kind: 'decoy', x: 33, y: 69, name: 'Enerji Düğümü', wave: [],
    hint: 'Bu düğüm boş bir kabuk. Enerji batı kapısının yanındaki ve doğu köşedeki düğümlerden akıyor.' },
  { id: 'sky_seal_a', stage: 4, x: 82, y: 22, name: 'Doğuş Mührü',
    waves: [[['astral_hunter', 2]], [['star_oracle', 1], ['star_parasite', 2]]] },
  { id: 'sky_seal_b', stage: 4, x: 98, y: 22, name: 'Zenit Mührü',
    waves: [[['star_parasite', 2], ['astral_hunter', 1]], [['void_armor', 1], ['star_oracle', 1]]] },
  { id: 'sky_seal_c', stage: 4, x: 90, y: 34, name: 'Batış Mührü',
    waves: [[['void_armor', 1], ['star_parasite', 1]], [['void_armor', 1], ['astral_hunter', 2]]] },
];
export default {
  id: 'astral_sanctum', name: 'Gökyarık Mabedi', w: 112, h: 80, seed: 5050, dungeon: true,
  rec: 'Lv. 48–50', theme: 'sanctum', ambient: 'dungeon', music: 'sanctum', dark: 0.38, particles: 'star',
  base: 'sanctum_floor', mass: 'sanctum_mass', carve: true,
  boss: 'sky_prisoner',
  areas: [
    { id: 'a_stage1', name: 'Mabet Kapısı', x: 16, y: 66, r: 9, ground: 'astral_stone', stage: 1, keepRatio: 0.6 },
    { id: 'a_stage2', name: 'Enerji Düğümleri', rect: [30, 62, 58, 70], stage: 2 },
    { id: 'a_stage3', name: 'Yıldız Koridorları', rect: [62, 64, 92, 68], stage: 3 },
    { id: 'a_stage4', name: 'Gök Mühürleri', x: 90, y: 28, r: 11, ground: 'astral_stone', stage: 4, keepRatio: 0.7 },
    { id: 'a_ante', name: 'Kontrol Noktası', x: 68, y: 22, r: 3 },
    { id: 'a_stage5', name: 'Mahkûmun Çemberi', x: 40, y: 22, r: 13, ground: 'astral_stone', stage: 5, keepRatio: 0.85 },
  ],
  paths: [
    { pts: [[3, 71], [8, 69], [16, 66]], w: 3 },
    { pts: [[16, 66], [24, 66], [30, 66]], w: 3 },
    { pts: [[58, 66], [62, 66]], w: 3 },
    { pts: [[90, 66], [90, 52], [90, 39]], w: 3 },
    { pts: [[79, 22], [72, 22], [66, 22]], w: 4 },
    { pts: [[66, 22], [58, 22], [52, 22]], w: 4 },
  ],
  gates: [
    { id: 'g1', x0: 27, y0: 60, x1: 27, y1: 72, opensAfter: 1 },
    { id: 'g2', x0: 60, y0: 60, x1: 60, y1: 72, opensAfter: 2 },
    { id: 'g3', x0: 85, y0: 45, x1: 95, y1: 45, opensAfter: 3 },
    { id: 'g4', x0: 76, y0: 16, x1: 76, y1: 28, opensAfter: 4, bossDoor: true },
  ],
  stages: {
    1: [['astral_hunter', 2], ['star_parasite', 3]],
    2: [['star_oracle', 2], ['void_armor', 1], ['astral_hunter', 2]],
    3: [['void_armor', 2], ['star_parasite', 3], ['star_oracle', 2]],
    4: [['astral_hunter', 1], ['star_oracle', 1]],
    5: [['sky_prisoner', 1]],
  },
  seals: SEALS,
  bossSpawn: { x: 38, y: 20 },
  // Kırılan Mühürler aşamasında (II) beliren iki gök mührü
  crystalSpawns: [{ x: 30, y: 13 }, { x: 50, y: 31 }],
  stamps: [
    // Mabet Kapısı
    { s: 'astral_pillar', x: 10, y: 60 }, { s: 'astral_pillar', x: 22, y: 60 }, { s: 'fallen_star', x: 9, y: 70 },
    // Enerji Düğümleri
    { s: 'astral_pillar', x: 44, y: 61 }, { s: 'astral_pillar', x: 44, y: 70 },
    // Gök Mühürleri
    { s: 'star_altar', x: 89, y: 18 }, { s: 'astral_pillar', x: 80, y: 30 }, { s: 'astral_pillar', x: 100, y: 30 },
    // Mahkûmun Çemberi
    { s: 'astral_pillar', x: 28, y: 10 }, { s: 'astral_pillar', x: 52, y: 10 }, { s: 'astral_pillar', x: 28, y: 33 }, { s: 'astral_pillar', x: 52, y: 33 },
  ],
  scatter: [
    { s: 'astral_pillar', d: 0.004, on: ['sanctum_floor'] },
  ],
  decor: [
    { tiles: ['astral_rune', 'cracks', 'star_glint'], d: 0.07, on: ['sanctum_floor'] },
    { tiles: ['astral_rune', 'star_glint', 'meteor_pebble'], d: 0.05, on: ['astral_stone'], salt: 2 },
  ],
  objects: [
    { type: 'portal', id: 'a_exit', x: 3, y: 72, to: 'star_grave', entry: 'from_sanctum', label: 'Yıldız Mezarı\'na dön (koşuyu bitir)', dungeonExit: true },
    { type: 'checkpoint', id: 'a_checkpoint', x: 68, y: 22 },
    ...SEALS.map((sl) => ({ type: 'seal', id: sl.id, x: sl.x, y: sl.y, label: sl.name, clear: 1.2 })),
    // Zincirleri Kır (m57): koridorlardaki zincir bağları
    { type: 'qobj', group: 'sanctum_chain', id: 'chain1', x: 70, y: 64, label: 'Gök zinciri', sprite: 'astral_relic', say: 'Zincirin halkası kırıldı; mabedin derinliklerinden bir inilti yükseldi.' },
    { type: 'qobj', group: 'sanctum_chain', id: 'chain2', x: 84, y: 68, label: 'Gök zinciri', sprite: 'astral_relic', say: 'İkinci zincir de koptu. Mahkûm uyanıyor.' },
    // Son Yıldız (s52): mabedin saklı gözlem odası
    { type: 'qobj', group: 'last_star', id: 'last_star', x: 90, y: 56, label: 'Son yıldızın parçası', sprite: 'star_lens', say: 'Parçanın içinde küçük, sönmeyen bir ışık: kayıp yıldızın kalbi.' },
    { type: 'fx', fx: 'brazier', x: 62, y: 21 }, { type: 'fx', fx: 'brazier', x: 72, y: 21 },
    { type: 'fx', fx: 'torch', x: 8, y: 66 }, { type: 'fx', fx: 'torch', x: 22, y: 64 },
    { type: 'fx', fx: 'brazier', x: 34, y: 12 }, { type: 'fx', fx: 'brazier', x: 46, y: 12 },
  ],
  entries: {
    entrance: { x: 5, y: 70 },
    cp1: { x: 29, y: 66 },
    cp2: { x: 62, y: 66 },
    cp3: { x: 90, y: 47 },
    checkpoint: { x: 67, y: 22 },
    respawn: { x: 5, y: 70 },
  },
  locations: [],
};
