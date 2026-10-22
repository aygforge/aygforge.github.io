// Gökyarık Ovası — 124×88 (V4, Lv.40–45): kuru fırtına bozkırları, göğe yükselen taş sütunlar, çatlamış yollar,
// fırtına kristalleri, elektrik yüklü harabeler, eski gözcü kuleleri. 4 farm noktası, Fırtına Celladı (elit),
// Fırtına Tiranı (açık dünya bossu), Keşif Kampı (güvenli), Kırık Gözcü Kulesi, 2 gizli sandık,
// Fırtına Cevheri / Yıldız Çiçeği, Yol Taşı, Yıldız Mezarı geçidi.
const stormOre = [[30, 50], [52, 12], [70, 40], [96, 46], [104, 12], [58, 78], [20, 76]];
const starFlower = [[26, 30], [46, 54], [64, 66], [90, 76], [14, 60], [80, 8]];
export default {
  id: 'sky_rift', name: 'Gökyarık Ovası', w: 124, h: 88, seed: 7171,
  rec: 'Lv. 40–45', theme: 'storm', ambient: 'storm', music: 'storm', dark: 0.12, particles: 'storm',
  base: 'storm_steppe', mass: 'storm_mass',
  border: { thick: 3, noise: 3.5 },
  massNoise: { scale: 8, threshold: 0.8 },
  areas: [
    { id: 'entry', x: 6, y: 44, r: 5 },
    { id: 'scout_camp', name: 'Keşif Kampı', x: 18, y: 44, r: 6, ground: 'cracked_road', safePocket: true },
    { id: 'storm_meadow', name: 'Fırtına Çayırı', x: 38, y: 68, r: 10, ground: 'storm_steppe', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'storm_hound', max: 8 }] },
    { id: 'rift_hills', name: 'Yarık Tepeleri', x: 40, y: 20, r: 10, ground: 'storm_rock', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'rift_wing', max: 7 }] },
    { id: 'raider_road', name: 'Yağmacı Yolu', x: 78, y: 60, r: 10, ground: 'cracked_road', camp: true, keepRatio: 0.45, spawns: [{ enemy: 'lightning_raider', max: 7 }], elite: 'storm_executioner' },
    { id: 'thunder_forge', name: 'Yıldırım Ocağı', x: 84, y: 22, r: 10, ground: 'storm_rock', camp: true, keepRatio: 0.45, spawns: [{ enemy: 'thunder_golem', max: 6 }] },
    { id: 'broken_tower', name: 'Kırık Gözcü Kulesi', x: 60, y: 36, r: 6, ground: 'cracked_road' },
    { id: 'tyrant_arena', name: 'Fırtına Tiranı\'nın Çemberi', x: 106, y: 70, r: 10, ground: 'storm_rock', boss: 'storm_tyrant', keepRatio: 0.85 },
    { id: 'star_pass', name: 'Yıldız Mezarı Geçidi', x: 114, y: 32, r: 5, ground: 'cracked_road' },
    { id: 'hidden_nw', x: 8, y: 8, r: 3 },
    { id: 'hidden_se', x: 116, y: 84, r: 3 },
  ],
  paths: [
    { pts: [[0, 44], [8, 44], [18, 44]], w: 3, tile: 'cracked_road' },
    { pts: [[18, 44], [32, 42], [46, 40], [60, 36]], w: 3, tile: 'cracked_road' },
    { pts: [[32, 42], [36, 30], [40, 20]], w: 3, tile: 'cracked_road' },
    { pts: [[30, 46], [34, 58], [38, 68]], w: 3, tile: 'cracked_road' },
    { pts: [[60, 36], [72, 28], [84, 22]], w: 3, tile: 'cracked_road' },
    { pts: [[60, 36], [70, 48], [78, 60]], w: 3, tile: 'cracked_road' },
    { pts: [[60, 36], [80, 36], [100, 34], [114, 32], [123, 30]], w: 3, tile: 'cracked_road' },
    { pts: [[78, 60], [92, 66], [106, 70]], w: 3, tile: 'cracked_road' },
    { pts: [[40, 20], [24, 12], [8, 8]], w: 2, tile: 'storm_rock' },
    { pts: [[106, 70], [112, 80], [116, 84]], w: 2, tile: 'storm_rock' },
    { pts: [[38, 68], [50, 74], [58, 78]], w: 2, tile: 'storm_steppe' },
    { pts: [[40, 20], [60, 12], [84, 22]], w: 2, tile: 'storm_rock' },
  ],
  ponds: [
    { x: 54, y: 56, rx: 4, ry: 2.5, terrain: 'sky_void' },
    { x: 96, y: 52, rx: 3.5, ry: 2.2, terrain: 'sky_void' },
    { x: 24, y: 26, rx: 3, ry: 2, terrain: 'sky_void' },
    { x: 70, y: 8, rx: 3, ry: 1.8, terrain: 'sky_void' },
  ],
  stamps: [
    // Keşif Kampı
    { s: 'storm_tent', x: 12, y: 36 }, { s: 'storm_tent', x: 21, y: 36 }, { s: 'crate', x: 10, y: 47 }, { s: 'barrel', x: 11, y: 48 },
    { s: 'sign', x: 9, y: 41 },
    // Fırtına Çayırı
    { s: 'stone_column', x: 31, y: 61 }, { s: 'stone_column', x: 46, y: 62 }, { s: 'storm_crystal_big', x: 36, y: 74 }, { s: 'storm_crystal_big', x: 43, y: 75 },
    // Yarık Tepeleri
    { s: 'stone_column', x: 33, y: 12 }, { s: 'stone_column', x: 47, y: 12 }, { s: 'storm_crystal_big', x: 38, y: 27 }, { s: 'charged_ruin', x: 44, y: 24 },
    // Yağmacı Yolu
    { s: 'charged_ruin', x: 70, y: 52 }, { s: 'charged_ruin', x: 84, y: 52 }, { s: 'broken_bridge', x: 74, y: 66 }, { s: 'storm_tent', x: 80, y: 63 },
    // Yıldırım Ocağı
    { s: 'storm_crystal_big', x: 78, y: 14 }, { s: 'storm_crystal_big', x: 90, y: 14 }, { s: 'charged_ruin', x: 77, y: 27 }, { s: 'charged_ruin', x: 89, y: 27 },
    { s: 'stone_column', x: 84, y: 11 },
    // Kırık Gözcü Kulesi
    { s: 'watchtower', x: 58, y: 29 }, { s: 'ruin_wall', x: 54, y: 38 }, { s: 'ruin_wall', x: 64, y: 38 },
    // Tiran'ın Çemberi
    { s: 'stone_column', x: 98, y: 62 }, { s: 'stone_column', x: 114, y: 62 }, { s: 'stone_column', x: 98, y: 76 }, { s: 'stone_column', x: 114, y: 76 },
    // Yıldız Mezarı geçidi
    { s: 'stone_column', x: 112, y: 25 }, { s: 'stone_column', x: 116, y: 25 }, { s: 'fallen_star', x: 108, y: 36 },
    // gizli köşeler
    { s: 'storm_crystal_big', x: 11, y: 5 }, { s: 'charged_ruin', x: 117, y: 80 },
  ],
  scatter: [
    { s: 'stone_column', d: 0.006 }, { s: 'basalt_rock', d: 0.008 }, { s: 'storm_crystal_big', d: 0.004, on: ['storm_rock'] },
    { s: 'rock', d: 0.006 }, { s: 'dead_tree', d: 0.004, on: ['storm_steppe'], salt: 2 },
  ],
  decor: [
    { tiles: ['dry_grass', 'dry_grass', 'pebbles', 'storm_crack', 'tuft'], d: 0.11, on: ['storm_steppe'] },
    { tiles: ['storm_shard', 'storm_crack', 'pebbles', 'cracks'], d: 0.07, on: ['storm_rock'], salt: 2 },
    { tiles: ['cracks', 'rubble', 'storm_crack'], d: 0.05, on: ['cracked_road'], salt: 3 },
  ],
  objects: [
    { type: 'portal', id: 'sr_to_throne', x: 0, y: 44, to: 'black_throne', entry: 'from_rift', label: 'Kara Taht' },
    { type: 'portal', id: 'sr_to_star', x: 123, y: 30, to: 'star_grave', entry: 'from_rift', label: 'Yıldız Mezarı',
      requires: { flag: 'star_grave_open', msg: 'Yıldız Mezarı geçidi fırtına perdesiyle kapalı. "Düşen Yıldız" görevinde perdeyi aç.' } },
    { type: 'waystone', id: 'ws_rift', group: 'ws_rift', x: 22, y: 42 },
    { type: 'npc', npc: 'atlas', x: 16, y: 41 },
    { type: 'fx', fx: 'campfire', x: 17, y: 46 }, { type: 'fx', fx: 'torch', x: 24, y: 44 }, { type: 'fx', fx: 'brazier', x: 12, y: 44 },
    // Fırtına İzleri (m48): üç ipucu
    { type: 'qobj', group: 'storm_clue', id: 'sclue_1', x: 30, y: 40, label: 'Fırtına izi', sprite: 'royal_clue', say: 'Yanık bir yön taşı: oklar hep yarığın merkezini gösteriyor.' },
    { type: 'qobj', group: 'storm_clue', id: 'sclue_2', x: 44, y: 30, label: 'Fırtına izi', sprite: 'royal_clue', say: 'Kristalleşmiş kum: yıldırım burada aynı noktaya defalarca düşmüş.' },
    { type: 'qobj', group: 'storm_clue', id: 'sclue_3', x: 52, y: 48, label: 'Fırtına izi', sprite: 'royal_clue', say: 'Bir sefer mührü: "Gökyarık Seferi — üçüncü kamp".' },
    // Yitik Sefer (m49): kayıp keşif ekibinin izleri
    { type: 'qobj', group: 'lost_expedition', id: 'exp_1', x: 26, y: 58, label: 'Sefer kalıntısı', sprite: 'broken_wagon', say: 'Devrilmiş bir araba; haritalar ıslak ama okunuyor.' },
    { type: 'qobj', group: 'lost_expedition', id: 'exp_2', x: 66, y: 72, label: 'Sefer kalıntısı', sprite: 'old_tools', say: 'Gözlem aletleri — biri hâlâ göğe doğru ayarlı.' },
    { type: 'qobj', group: 'lost_expedition', id: 'exp_3', x: 92, y: 40, label: 'Sefer kalıntısı', sprite: 'old_record', say: 'Seferin son notu: "Yarık bir kapı değil, bir hapishane."' },
    // Kırık Gözcü Kulesi (m50): mekanizma onarımı + savunma
    { type: 'qobj', group: 'tower_mechanism', id: 'tower_mech', x: 60, y: 33, label: 'Kule mekanizması', sprite: 'mine_mechanism', say: 'Dişliler yeniden döndü; kulenin fenerinde mavi bir ışık yandı. Fırtına yaratıkları ışığa saldırıyor!' },
    { type: 'defense', id: 'def_tower', x: 61, y: 35, name: 'Gözcü Kulesi feneri', sprite: 'royal_seal', hp: 14000, ring: [5, 7],
      intro: 'Kulenin fenerini koru! Fırtına yaratıkları ışığı söndürmeye çalışacak.',
      waves: [[['storm_hound', 2], ['rift_wing', 1]], [['lightning_raider', 2], ['storm_hound', 1]]] },
    // Gözcünün Son Notları (s43)
    { type: 'qobj', group: 'watcher_note', id: 'wn1', x: 56, y: 26, label: 'Gözcü notu', sprite: 'old_record', say: '"Birinci gün: yarık açıldı, kuş sesi kesildi."' },
    { type: 'qobj', group: 'watcher_note', id: 'wn2', x: 74, y: 40, label: 'Gözcü notu', sprite: 'old_record', say: '"Üçüncü gün: yıldırım hep aynı taşa düşüyor; taş şarkı söylüyor."' },
    { type: 'qobj', group: 'watcher_note', id: 'wn3', x: 100, y: 28, label: 'Gözcü notu', sprite: 'old_record', say: '"Son gün: yarığın ötesinde bir şey zincirlerini çekiştiriyor."' },
    // Fırtınada Kaybolanlar (s44): iz sürme (sıralı)
    { type: 'qobj', group: 'storm_track', id: 'st1', order: 1, x: 34, y: 52, label: 'Ayak izi', sprite: 'fire_trace', say: 'İzler kuzeydoğuya dönüyor.' },
    { type: 'qobj', group: 'storm_track', id: 'st2', order: 2, x: 48, y: 50, label: 'Ayak izi', sprite: 'fire_trace', say: 'Biri burada dinlenmiş; yanık bir pelerin parçası.' },
    { type: 'qobj', group: 'storm_track', id: 'st3', order: 3, x: 66, y: 46, label: 'Ayak izi', sprite: 'fire_trace', say: 'İzler kayaların arasına, bir sığınağa giriyor — kayıp çobanlar burada!' },
    // Çatlayan Yol (s45): yol onarımı (Fırtına Çeliği)
    { type: 'qobj', group: 'cracked_road_seg', id: 'cr1', x: 40, y: 40, label: 'Çatlamış yol', sprite: 'stone_tablet', say: 'Çatlak çelik kenetlerle kapatıldı.' },
    { type: 'qobj', group: 'cracked_road_seg', id: 'cr2', x: 86, y: 35, label: 'Çatlamış yol', sprite: 'stone_tablet', say: 'Yolun bu bölümü yeniden geçilebilir.' },
    { type: 'qobj', group: 'cracked_road_seg', id: 'cr3', x: 104, y: 33, label: 'Çatlamış yol', sprite: 'stone_tablet', say: 'Geçide giden yol onarıldı.' },
    // Son Kervan (s46): kervanı geçide ulaştır
    { type: 'escort', id: 'last_caravan', x: 24, y: 45, name: 'Son Kervan', sprite: 'caravan', hp: 16000, speed: 1.9,
      route: [[34, 42], [48, 40], [62, 37], [80, 36], [100, 34]],
      ambushes: [{ at: 0.35, wave: [['lightning_raider', 2]], say: 'Şimşek Yağmacıları kervanın peşinde!' },
        { at: 0.75, wave: [['storm_hound', 2], ['rift_wing', 1]], say: 'Fırtına sürüsü yolu kesti!' }] },
    ...stormOre.map(([x, y], i) => ({ type: 'gather', id: `storm_ore${i}`, kind: 'storm_ore', x, y, clear: 0.6 })),
    ...starFlower.map(([x, y], i) => ({ type: 'gather', id: `star_flower_r${i}`, kind: 'star_flower', x, y, clear: 0.6 })),
    { type: 'chest', id: 'chest_rift_nw', x: 8, y: 8, gold: [1600, 2000], loot: [{ id: 'lightning_shard', qty: [2, 3] }, { id: 'hp_star', qty: [2, 2] }] },
    { type: 'chest', id: 'chest_rift_se', x: 116, y: 84, gold: [1700, 2100], loot: [{ id: 'meteor_dust', qty: [2, 3] }, { id: 'altar_crystal', qty: [1, 1] }, { id: 'mp_star', qty: [2, 2] }] },
    { type: 'fx', fx: 'brazier', x: 102, y: 68 }, { type: 'fx', fx: 'brazier', x: 110, y: 68 },
    { type: 'fx', fx: 'torch', x: 110, y: 29 }, { type: 'fx', fx: 'torch', x: 118, y: 29 },
  ],
  entries: {
    from_throne: { x: 3, y: 44 },
    from_star: { x: 119, y: 30 },
    waystone: { x: 22, y: 44 },
    respawn: { x: 18, y: 45 },
  },
  locations: [
    { id: 'loc_rift_entrance', name: 'Gökyarık Ovası girişi', x: 8, y: 44, r: 5 },
    { id: 'loc_star_pass', name: 'Yıldız Mezarı Geçidi', x: 114, y: 32, r: 4 },
  ],
};
