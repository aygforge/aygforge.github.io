// Yıldız Mezarı — 128×92 (V4, Lv.45–50): göğe açılmış yarıklar, havada asılı taş parçaları, kırık yıldız kalıntıları,
// mor-mavi kristaller, eski gözlemevi yapıları, Gökyarık Mabedi'nin dış girişi. 4 farm noktası, Hiçlik Muhafızı (elit),
// Gözlemci Kampı (güvenli), 3 gözlem noktası, 2 gizli sandık, Astral Kristal / Yıldız Çiçeği, Yol Taşı.
const astralCrystal = [[30, 36], [50, 14], [72, 44], [100, 16], [108, 68], [60, 84], [22, 78]];
const starFlower = [[26, 58], [48, 52], [66, 70], [92, 82], [76, 8]];
export default {
  id: 'star_grave', name: 'Yıldız Mezarı', w: 128, h: 92, seed: 8282,
  rec: 'Lv. 45–50', theme: 'star', ambient: 'star', music: 'star', dark: 0.3, particles: 'star',
  base: 'star_dust', mass: 'star_mass',
  border: { thick: 3, noise: 3.5 },
  massNoise: { scale: 8, threshold: 0.8 },
  areas: [
    { id: 'entry', x: 6, y: 46, r: 5 },
    { id: 'watcher_camp', name: 'Gözlemci Kampı', x: 18, y: 46, r: 6, ground: 'astral_stone', safePocket: true },
    { id: 'fallen_stones', name: 'Düşen Taşlar', x: 38, y: 70, r: 10, ground: 'star_dust', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'star_parasite', max: 7 }] },
    { id: 'astral_trails', name: 'Astral İzler', x: 40, y: 22, r: 10, ground: 'astral_stone', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'astral_hunter', max: 7 }] },
    { id: 'void_square', name: 'Boşluk Meydanı', x: 82, y: 64, r: 10, ground: 'astral_stone', camp: true, keepRatio: 0.45, spawns: [{ enemy: 'void_armor', max: 6 }], elite: 'void_warden' },
    { id: 'oracle_ruins', name: 'Kâhin Harabeleri', x: 86, y: 24, r: 10, ground: 'astral_stone', camp: true, keepRatio: 0.45, spawns: [{ enemy: 'star_oracle', max: 6 }] },
    { id: 'obs_west', name: 'Batı Gözlem Noktası', x: 28, y: 46, r: 3, ground: 'astral_stone' },
    { id: 'obs_north', name: 'Kuzey Gözlem Noktası', x: 64, y: 12, r: 3, ground: 'astral_stone' },
    { id: 'obs_south', name: 'Güney Gözlem Noktası', x: 64, y: 80, r: 3, ground: 'astral_stone' },
    { id: 'star_field', name: 'Yıldız Avlusu', x: 62, y: 46, r: 7, ground: 'astral_stone' },
    { id: 'sanctum_steps', name: 'Mabet Basamakları', x: 112, y: 46, r: 7, ground: 'sanctum_floor' },
    { id: 'hidden_nw', x: 8, y: 8, r: 3 },
    { id: 'hidden_se', x: 120, y: 86, r: 3 },
  ],
  paths: [
    { pts: [[0, 46], [8, 46], [18, 46]], w: 3, tile: 'astral_stone' },
    { pts: [[18, 46], [28, 46], [44, 46], [62, 46]], w: 3, tile: 'astral_stone' },
    { pts: [[28, 46], [34, 34], [40, 22]], w: 3, tile: 'astral_stone' },
    { pts: [[28, 46], [34, 58], [38, 70]], w: 3, tile: 'astral_stone' },
    { pts: [[62, 46], [74, 36], [86, 24]], w: 3, tile: 'astral_stone' },
    { pts: [[62, 46], [72, 56], [82, 64]], w: 3, tile: 'astral_stone' },
    { pts: [[62, 46], [80, 46], [96, 46], [112, 46]], w: 4, tile: 'sanctum_floor' },
    { pts: [[62, 46], [64, 28], [64, 12]], w: 2, tile: 'astral_stone' },
    { pts: [[62, 46], [64, 64], [64, 80]], w: 2, tile: 'astral_stone' },
    { pts: [[40, 22], [24, 14], [8, 8]], w: 2, tile: 'star_dust' },
    { pts: [[82, 64], [102, 76], [120, 86]], w: 2, tile: 'star_dust' },
  ],
  ponds: [
    { x: 50, y: 32, rx: 4, ry: 2.5, terrain: 'sky_void' },
    { x: 96, y: 34, rx: 3.5, ry: 2.2, terrain: 'sky_void' },
    { x: 50, y: 62, rx: 3.5, ry: 2.2, terrain: 'sky_void' },
    { x: 100, y: 58, rx: 3, ry: 2, terrain: 'sky_void' },
    { x: 18, y: 26, rx: 3, ry: 2, terrain: 'sky_void' },
  ],
  stamps: [
    // Gözlemci Kampı
    { s: 'storm_tent', x: 13, y: 38 }, { s: 'astro_dome', x: 21, y: 37 }, { s: 'crate', x: 10, y: 50 }, { s: 'barrel', x: 11, y: 51 }, { s: 'sign', x: 9, y: 43 },
    // Düşen Taşlar
    { s: 'fallen_star', x: 31, y: 63 }, { s: 'fallen_star', x: 44, y: 64 }, { s: 'astral_pillar', x: 34, y: 77 }, { s: 'astral_pillar', x: 43, y: 77 },
    // Astral İzler
    { s: 'astral_pillar', x: 33, y: 14 }, { s: 'astral_pillar', x: 47, y: 14 }, { s: 'star_altar', x: 38, y: 29 },
    // Boşluk Meydanı
    { s: 'astral_pillar', x: 74, y: 56 }, { s: 'astral_pillar', x: 90, y: 56 }, { s: 'astral_pillar', x: 74, y: 71 }, { s: 'astral_pillar', x: 90, y: 71 },
    { s: 'fallen_star', x: 81, y: 72 },
    // Kâhin Harabeleri
    { s: 'astro_dome', x: 84, y: 14 }, { s: 'charged_ruin', x: 78, y: 28 }, { s: 'charged_ruin', x: 92, y: 28 }, { s: 'star_altar', x: 85, y: 31 },
    // gözlem noktaları
    { s: 'astro_dome', x: 26, y: 41 }, { s: 'astro_dome', x: 62, y: 7 }, { s: 'astro_dome', x: 62, y: 75 },
    // Yıldız Avlusu
    { s: 'star_altar', x: 61, y: 40 }, { s: 'astral_pillar', x: 56, y: 50 }, { s: 'astral_pillar', x: 68, y: 50 },
    // Mabet basamakları
    { s: 'astral_pillar', x: 106, y: 38 }, { s: 'astral_pillar', x: 118, y: 38 }, { s: 'astral_pillar', x: 106, y: 53 }, { s: 'astral_pillar', x: 118, y: 53 },
    // gizli köşeler
    { s: 'fallen_star', x: 10, y: 4 }, { s: 'astral_pillar', x: 122, y: 82 },
  ],
  scatter: [
    { s: 'astral_pillar', d: 0.005 }, { s: 'fallen_star', d: 0.003, on: ['star_dust'] }, { s: 'basalt_rock', d: 0.006 },
    { s: 'rock', d: 0.005, salt: 2 },
  ],
  decor: [
    { tiles: ['star_glint', 'meteor_pebble', 'pebbles', 'cracks'], d: 0.1, on: ['star_dust'] },
    { tiles: ['astral_rune', 'star_glint', 'cracks', 'rubble'], d: 0.06, on: ['astral_stone'], salt: 2 },
    { tiles: ['astral_rune', 'cracks'], d: 0.04, on: ['sanctum_floor'], salt: 3 },
  ],
  objects: [
    { type: 'portal', id: 'sg_to_rift', x: 0, y: 46, to: 'sky_rift', entry: 'from_star', label: 'Gökyarık Ovası' },
    { type: 'dungeon_gate', id: 'sanctum_gate', group: 'sanctum_gate', x: 112, y: 42, to: 'astral_sanctum', entry: 'entrance', label: 'Gökyarık Mabedi', dungeon: 'astral_sanctum' },
    { type: 'waystone', id: 'ws_star', group: 'ws_star', x: 22, y: 44 },
    { type: 'npc', npc: 'leyla', x: 16, y: 43 },
    { type: 'npc', npc: 'tufan', x: 108, y: 48 },
    { type: 'fx', fx: 'brazier', x: 12, y: 46 }, { type: 'fx', fx: 'campfire', x: 17, y: 48 },
    // Astral Hatıralar (m54): dört kalıntı
    { type: 'qobj', group: 'astral_relic', id: 'ar1', x: 36, y: 64, label: 'Astral kalıntı', sprite: 'astral_relic', say: 'Kalıntıda bir zincir halkası: yıldızın kendisi değil, onu bağlayan şey düşmüş.' },
    { type: 'qobj', group: 'astral_relic', id: 'ar2', x: 42, y: 26, label: 'Astral kalıntı', sprite: 'astral_relic', say: 'Taşta bir yüz kabartması; gözleri göğe değil, yere bakıyor.' },
    { type: 'qobj', group: 'astral_relic', id: 'ar3', x: 88, y: 30, label: 'Astral kalıntı', sprite: 'astral_relic', say: 'Kâhinlerin yazısı: "Mahkûm uyanırsa gök yeniden yarılır."' },
    { type: 'qobj', group: 'astral_relic', id: 'ar4', x: 84, y: 70, label: 'Astral kalıntı', sprite: 'astral_relic', say: 'Kırık bir mühür taşı — mabedin kapısındaki mühürlerle aynı işaret.' },
    // Düşen Işık (s48): üç gözlem noktası
    { type: 'qobj', group: 'star_lens', id: 'obs_w', x: 28, y: 44, label: 'Gözlem merceği', sprite: 'star_lens', say: 'Mercek batıdaki yarığı gösteriyor: ışık oradan düşmüş.' },
    { type: 'qobj', group: 'star_lens', id: 'obs_n', x: 64, y: 10, label: 'Gözlem merceği', sprite: 'star_lens', say: 'Kuzey merceği: düşen ışık tek bir noktada toplanıyor — mabette.' },
    { type: 'qobj', group: 'star_lens', id: 'obs_s', x: 64, y: 78, label: 'Gözlem merceği', sprite: 'star_lens', say: 'Güney merceği: gökteki yarık her gece biraz daha genişliyor.' },
    // Astral Savunma (s49): Yıldız Avlusu sunağını koru
    { type: 'defense', id: 'def_astral', x: 62, y: 44, name: 'Yıldız Avlusu sunağı', sprite: 'royal_seal', hp: 18000, ring: [5, 7],
      intro: 'Yıldız Avlusu sunağını koru! Astral yaratıklar ışığı yutmaya geliyor.',
      waves: [[['star_parasite', 2], ['astral_hunter', 1]], [['void_armor', 1], ['star_oracle', 1], ['star_parasite', 1]]] },
    // Eski Kâhin (s50): kâhinin üç yazıtı
    { type: 'qobj', group: 'oracle_script', id: 'os1', x: 80, y: 20, label: 'Kâhin yazıtı', sprite: 'stone_tablet', say: '"Yıldızları saydık; biri eksikti."' },
    { type: 'qobj', group: 'oracle_script', id: 'os2', x: 92, y: 20, label: 'Kâhin yazıtı', sprite: 'stone_tablet', say: '"Eksik yıldız düşmedi; indirildi ve zincirlendi."' },
    { type: 'qobj', group: 'oracle_script', id: 'os3', x: 86, y: 34, label: 'Kâhin yazıtı', sprite: 'stone_tablet', say: '"Ona Göğün Mahkûmu dedik ve adını unuttuk."' },
    // Mabet Mühürleri (m56): giriş mühürleri — sırayla
    { type: 'qobj', group: 'sanctum_entry_seal', id: 'ses1', order: 1, x: 106, y: 44, label: 'Giriş mührü (Doğuş)', sprite: 'royal_seal', say: 'Doğuş mührü parladı. Sıradaki: Zenit.' },
    { type: 'qobj', group: 'sanctum_entry_seal', id: 'ses2', order: 2, x: 112, y: 38, label: 'Giriş mührü (Zenit)', sprite: 'royal_seal', say: 'Zenit mührü parladı. Sıradaki: Batış.' },
    { type: 'qobj', group: 'sanctum_entry_seal', id: 'ses3', order: 3, x: 118, y: 44, label: 'Giriş mührü (Batış)', sprite: 'royal_seal', say: 'Üç mühür aynı anda yandı; mabedin kapısı uğuldamaya başladı.' },
    ...astralCrystal.map(([x, y], i) => ({ type: 'gather', id: `astral_c${i}`, kind: 'astral_crystal', x, y, clear: 0.6 })),
    ...starFlower.map(([x, y], i) => ({ type: 'gather', id: `star_flower_g${i}`, kind: 'star_flower', x, y, clear: 0.6 })),
    { type: 'chest', id: 'chest_star_nw', x: 8, y: 8, gold: [2000, 2500], loot: [{ id: 'star_essence', qty: [2, 3] }, { id: 'hp_star', qty: [3, 3] }] },
    { type: 'chest', id: 'chest_star_se', x: 120, y: 86, gold: [2100, 2600], loot: [{ id: 'astral_hide', qty: [2, 2] }, { id: 'altar_crystal', qty: [1, 1] }, { id: 'mp_star', qty: [3, 3] }] },
    { type: 'fx', fx: 'brazier', x: 109, y: 45 }, { type: 'fx', fx: 'brazier', x: 115, y: 45 },
    { type: 'fx', fx: 'torch', x: 60, y: 46 }, { type: 'fx', fx: 'torch', x: 65, y: 46 },
  ],
  entries: {
    from_rift: { x: 3, y: 46 },
    from_sanctum: { x: 112, y: 47 },
    waystone: { x: 22, y: 46 },
    respawn: { x: 18, y: 47 },
  },
  locations: [
    { id: 'loc_star_entrance', name: 'Yıldız Mezarı girişi', x: 8, y: 46, r: 5 },
    { id: 'loc_sanctum_steps', name: 'Mabet Basamakları', x: 112, y: 46, r: 5 },
  ],
};
