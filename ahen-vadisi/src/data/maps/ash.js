// Kül Yaylaları — 112×80 (V2, Lv.20–25): 4 farm kampı, Kül Kasabı (elit), Kül Devi arenası,
// Kor Kampı (güvenli), 2 gizli sandık, Kül Cevheri damarları, Ayaz Geçidi'ne çıkış.
const ashVeins = [[24, 30], [40, 26], [20, 14], [48, 40], [30, 50], [44, 70], [60, 48], [70, 30], [88, 44], [76, 70], [100, 56]];
export default {
  id: 'ash', name: 'Kül Yaylaları', w: 112, h: 80, seed: 2121,
  rec: 'Lv. 20–25', theme: 'ash', ambient: 'ash', music: 'ash', dark: 0.12, particles: 'ash',
  base: 'ash', mass: 'ash_mass',
  border: { thick: 3, noise: 3.5 },
  massNoise: { scale: 9, threshold: 0.8 },
  areas: [
    { id: 'entry', x: 6, y: 40, r: 5 },
    { id: 'ember_camp', name: 'Kor Kampı', x: 16, y: 44, r: 5, ground: 'dirt', safePocket: true },
    { id: 'ash_flats', name: 'Küllü Düzlük', x: 30, y: 20, r: 10, ground: 'ash', camp: true, keepRatio: 0.55, spawns: [{ enemy: 'ash_imp', max: 8 }] },
    { id: 'caravan_road', name: 'Yanmış Kervan Yolu', x: 60, y: 16, r: 9, ground: 'dirt', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'ash_hunter', max: 7 }] },
    { id: 'scorpion_rifts', name: 'Akrep Yarıkları', x: 34, y: 62, r: 10, ground: 'scorched', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'crimson_scorpion', max: 7 }] },
    { id: 'crimson_ruins', name: 'Kızıl Harabeler', x: 80, y: 58, r: 10, ground: 'basalt', camp: true, keepRatio: 0.45, spawns: [{ enemy: 'burnt_warrior', max: 6 }], elite: 'ash_butcher' },
    { id: 'ember_caldera', name: 'Kor Kalderası', x: 94, y: 22, r: 9, ground: 'scorched', boss: 'ash_giant', keepRatio: 0.85 },
    { id: 'center', x: 56, y: 40, r: 5, ground: 'dirt' },
    { id: 'east_gate', x: 106, y: 44, r: 4 },
    { id: 'hidden_n', x: 8, y: 8, r: 3 },
    { id: 'hidden_s', x: 104, y: 74, r: 3 },
  ],
  paths: [
    { pts: [[0, 40], [8, 40], [16, 44]], w: 3, tile: 'dirt' },
    { pts: [[16, 44], [26, 40], [40, 40], [56, 40]], w: 3, tile: 'dirt' },
    { pts: [[26, 40], [28, 30], [30, 20]], w: 3, tile: 'dirt' },
    { pts: [[40, 40], [48, 28], [60, 16]], w: 3, tile: 'dirt' },
    { pts: [[60, 16], [74, 16], [86, 20], [94, 22]], w: 3, tile: 'basalt' },
    { pts: [[26, 44], [30, 54], [34, 62]], w: 3, tile: 'dirt' },
    { pts: [[56, 40], [68, 48], [80, 58]], w: 3, tile: 'dirt' },
    { pts: [[56, 40], [76, 40], [92, 42], [106, 44], [111, 44]], w: 3, tile: 'basalt' },
    { pts: [[30, 20], [18, 12], [8, 8]], w: 2, tile: 'ash' },
    { pts: [[80, 58], [92, 66], [104, 74]], w: 2, tile: 'ash' },
    { pts: [[34, 62], [48, 70], [60, 66], [68, 54]], w: 2, tile: 'dirt' },
  ],
  ponds: [
    { x: 46, y: 56, rx: 4, ry: 2.5, terrain: 'lava' },
    { x: 70, y: 28, rx: 3.5, ry: 2.2, terrain: 'lava' },
    { x: 100, y: 34, rx: 3, ry: 2, terrain: 'lava' },
    { x: 22, y: 70, rx: 3.5, ry: 2, terrain: 'lava' },
  ],
  stamps: [
    // Kor Kampı
    { s: 'tent', x: 11, y: 40 }, { s: 'crate', x: 20, y: 41 }, { s: 'barrel', x: 21, y: 41 }, { s: 'sign', x: 9, y: 37 },
    // Kervan yolu: yanmış arabalar
    { s: 'burnt_wagon', x: 54, y: 13 }, { s: 'burnt_wagon', x: 64, y: 19 }, { s: 'burnt_wagon', x: 58, y: 21 },
    // Kızıl Harabeler
    { s: 'ruin_tower', x: 74, y: 50 }, { s: 'ash_ruin_wall', x: 84, y: 51 }, { s: 'ash_ruin_wall', x: 88, y: 60 },
    { s: 'ruin_pillar', x: 72, y: 61 }, { s: 'ruin_pillar', x: 86, y: 66 }, { s: 'ash_ruin_wall', x: 76, y: 66 },
    // Kaldera
    { s: 'obsidian_spire', x: 86, y: 14 }, { s: 'obsidian_spire', x: 102, y: 15 }, { s: 'obsidian_spire', x: 87, y: 29 },
    { s: 'obsidian_spire', x: 101, y: 28 }, { s: 'lava_vent', x: 90, y: 18 }, { s: 'lava_vent', x: 98, y: 26 },
    // gizli sandık köşeleri
    { s: 'basalt_rock', x: 10, y: 11 }, { s: 'ash_ruin_wall', x: 100, y: 70 },
  ],
  scatter: [
    { s: 'charred_tree', d: 0.022 }, { s: 'basalt_rock', d: 0.006 }, { s: 'rock', d: 0.008 },
    { s: 'obsidian_spire', d: 0.004 }, { s: 'lava_vent', d: 0.003, on: ['scorched'] },
  ],
  decor: [
    { tiles: ['ash_pile', 'cinder', 'embers', 'pebbles'], d: 0.11, on: ['ash'] },
    { tiles: ['lava_crack', 'embers', 'cinder'], d: 0.14, on: ['scorched'], salt: 2 },
    { tiles: ['charred_bones', 'cracks', 'rubble'], d: 0.06, on: ['basalt', 'dirt'], salt: 3 },
  ],
  objects: [
    { type: 'portal', id: 'a_to_mine', x: 0, y: 40, to: 'mine', entry: 'from_ash', label: 'Kırık Damar Madeni' },
    { type: 'portal', id: 'a_to_frost', x: 111, y: 44, to: 'frost', entry: 'from_ash', label: 'Ayaz Geçidi',
      requires: { quest: 'm33', msg: 'Kar fırtınası geçidi kapatıyor. Kül Devi\'ni yendikten sonra Kor Kampı\'ndaki Kâşif Demre\'den yolu öğren.' } },
    { type: 'waystone', id: 'ws_ash', x: 20, y: 48 },
    { type: 'npc', npc: 'demre', x: 14, y: 46 },
    { type: 'npc', npc: 'yaren', x: 19, y: 44 },
    { type: 'fx', fx: 'campfire', x: 16, y: 45 },
    ...ashVeins.map(([x, y], i) => ({ type: 'gather', id: `ash_v${i}`, kind: 'ash_ore', x, y, clear: 0.6 })),
    // görev nesneleri
    { type: 'qobj', group: 'lost_caravan', id: 'caravan', x: 62, y: 18, label: 'Kayıp kervanın enkazı' },
    { type: 'qobj', group: 'ember_relic', id: 'relic', x: 80, y: 55, label: 'Kor Kalıntısı' },
    { type: 'qobj', group: 'scout_tracks', id: 'tr1', x: 44, y: 48, label: 'Gözcü izleri' },
    { type: 'qobj', group: 'scout_tracks', id: 'tr2', x: 52, y: 66, label: 'Gözcü izleri' },
    { type: 'qobj', group: 'lost_scout', id: 'tr3', x: 66, y: 70, label: 'Yaralı gözcü Tamer' },
    // gizli sandıklar (tek seferlik, karakter başına)
    { type: 'chest', id: 'chest_ash_n', x: 8, y: 8, gold: [450, 650], loot: [{ id: 'ash_steel', qty: [2, 3] }, { id: 'hp_xl', qty: [2, 2] }] },
    { type: 'chest', id: 'chest_ash_s', x: 104, y: 74, gold: [500, 700], loot: [{ id: 'frost_essence', qty: [1, 1] }, { id: 'altar_dust', qty: [2, 3] }, { id: 'mp_xl', qty: [2, 2] }] },
    { type: 'fx', fx: 'brazier', x: 90, y: 20 }, { type: 'fx', fx: 'brazier', x: 98, y: 20 },
  ],
  entries: {
    from_mine: { x: 3, y: 40 },
    from_frost: { x: 108, y: 44 },
    waystone: { x: 20, y: 50 },
    respawn: { x: 16, y: 47 },
  },
  locations: [
    { id: 'loc_ash_entrance', name: 'Kül Yaylaları girişi', x: 6, y: 40, r: 5 },
    { id: 'loc_ash_east', name: 'Doğu geçidi', x: 106, y: 44, r: 4 },
  ],
};
