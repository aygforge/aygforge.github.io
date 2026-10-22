// Ayaz Geçidi — 116×88 (V2, Lv.25–30): 4 farm kampı, Buz Gardiyanı (elit), Ayaz Konağı (güvenli),
// donmuş göl, 2 gizli sandık, Ayaz Kristalleri, Buz Mabedi girişi.
const frostCrystals = [[22, 20], [36, 30], [18, 34], [30, 44], [50, 20], [56, 52], [62, 34], [86, 34], [94, 48], [70, 78], [100, 70], [44, 74]];
export default {
  id: 'frost', name: 'Ayaz Geçidi', w: 116, h: 88, seed: 7272,
  rec: 'Lv. 25–30', theme: 'frost', ambient: 'frost', music: 'frost', dark: 0.08, particles: 'snow',
  base: 'snow', mass: 'snow_mass',
  border: { thick: 3, noise: 3.5 },
  massNoise: { scale: 8, threshold: 0.79 },
  areas: [
    { id: 'entry', x: 6, y: 70, r: 5 },
    { id: 'frost_lodge', name: 'Ayaz Konağı', x: 16, y: 64, r: 5, ground: 'frost_stone', safePocket: true },
    { id: 'white_trail', name: 'Beyaz Patika', x: 38, y: 60, r: 10, ground: 'snow', camp: true, keepRatio: 0.55, spawns: [{ enemy: 'frost_wolf', max: 8 }] },
    { id: 'crystal_vale', name: 'Kristal Vadisi', x: 28, y: 24, r: 10, ground: 'ice', camp: true, keepRatio: 0.55, spawns: [{ enemy: 'ice_wisp', max: 7 }] },
    { id: 'frozen_outpost', name: 'Donuk Karakol', x: 78, y: 64, r: 10, ground: 'frost_stone', camp: true, keepRatio: 0.45, spawns: [{ enemy: 'frost_sentinel', max: 6 }], elite: 'ice_warden' },
    { id: 'shaman_hills', name: 'Şaman Tepeleri', x: 82, y: 26, r: 10, ground: 'snow', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'snow_shaman', max: 6 }] },
    { id: 'temple_gate', name: 'Buz Mabedi Kapısı', x: 104, y: 10, r: 5, ground: 'frost_stone' },
    { id: 'center', x: 58, y: 44, r: 5, ground: 'frost_stone' },
    { id: 'hidden_w', x: 8, y: 8, r: 3 },
    { id: 'hidden_e', x: 110, y: 82, r: 3 },
  ],
  paths: [
    { pts: [[0, 70], [8, 70], [16, 64]], w: 3, tile: 'frost_stone' },
    { pts: [[16, 64], [28, 62], [38, 60]], w: 3, tile: 'frost_stone' },
    { pts: [[28, 62], [40, 50], [58, 44]], w: 3, tile: 'frost_stone' },
    { pts: [[40, 50], [32, 36], [28, 24]], w: 3, tile: 'frost_stone' },
    { pts: [[58, 44], [70, 54], [78, 64]], w: 3, tile: 'frost_stone' },
    { pts: [[58, 44], [70, 34], [82, 26]], w: 3, tile: 'frost_stone' },
    { pts: [[82, 26], [94, 18], [104, 10], [104, 2]], w: 3, tile: 'frost_stone' },
    { pts: [[28, 24], [16, 14], [8, 8]], w: 2, tile: 'snow' },
    { pts: [[78, 64], [94, 74], [110, 82]], w: 2, tile: 'snow' },
    { pts: [[38, 60], [48, 74], [70, 78]], w: 2, tile: 'snow' },
  ],
  ponds: [
    { x: 58, y: 26, rx: 7, ry: 4.5, terrain: 'frozen_water' },
    { x: 96, y: 52, rx: 5, ry: 3, terrain: 'frozen_water' },
    { x: 20, y: 46, rx: 4, ry: 2.5, terrain: 'frozen_water' },
  ],
  stamps: [
    // Ayaz Konağı
    { s: 'snow_tent', x: 11, y: 59 }, { s: 'crate', x: 20, y: 61 }, { s: 'barrel', x: 21, y: 61 }, { s: 'sign', x: 9, y: 66 },
    // Donuk Karakol
    { s: 'watchtower', x: 72, y: 56 }, { s: 'watchtower', x: 84, y: 57 }, { s: 'ice_pillar', x: 74, y: 68 }, { s: 'ice_pillar', x: 83, y: 69 },
    { s: 'snow_tent', x: 76, y: 72 },
    // Şaman Tepeleri
    { s: 'frozen_statue', x: 76, y: 20 }, { s: 'frozen_statue', x: 88, y: 21 }, { s: 'frozen_statue', x: 80, y: 31 }, { s: 'ice_crystal_big', x: 86, y: 30 },
    // Mabet kapısı
    { s: 'ice_pillar', x: 100, y: 6 }, { s: 'ice_pillar', x: 108, y: 6 }, { s: 'frozen_statue', x: 98, y: 11 }, { s: 'frozen_statue', x: 110, y: 11 },
    // Kristal Vadisi
    { s: 'ice_crystal_big', x: 22, y: 18 }, { s: 'ice_crystal_big', x: 34, y: 20 }, { s: 'ice_crystal_big', x: 26, y: 31 },
    // gizli köşeler
    { s: 'ice_boulder', x: 10, y: 11 }, { s: 'frozen_pine', x: 104, y: 78 },
  ],
  scatter: [
    { s: 'frozen_pine', d: 0.026 }, { s: 'ice_boulder', d: 0.005 }, { s: 'frozen_bush', d: 0.01 },
    { s: 'ice_crystal_big', d: 0.012, on: ['ice'] },
  ],
  decor: [
    { tiles: ['snow_tuft', 'frozen_grass', 'footprints', 'pebbles'], d: 0.10, on: ['snow'] },
    { tiles: ['ice_crack', 'frost_crystal_small', 'ice_shards'], d: 0.12, on: ['ice'], salt: 2 },
    { tiles: ['ice_shards', 'snow_tuft', 'rune_ice'], d: 0.04, on: ['frost_stone'], salt: 3 },
  ],
  objects: [
    { type: 'portal', id: 'fr_to_ash', x: 0, y: 70, to: 'ash', entry: 'from_frost', label: 'Kül Yaylaları' },
    { type: 'dungeon_gate', id: 'frost_gate', group: 'frost_gate', x: 104, y: 4, to: 'frost_temple', entry: 'entrance', label: 'Buz Mabedi', dungeon: 'frost_temple' },
    { type: 'waystone', id: 'ws_frost', group: 'ws_frost', x: 20, y: 68 },
    { type: 'npc', npc: 'ilgar', x: 14, y: 66 },
    { type: 'npc', npc: 'sena', x: 19, y: 63 },
    // V3 NPC'si, görev nesneleri ve olay
    { type: 'npc', npc: 'kaya', x: 12, y: 64 },
    { type: 'qobj', group: 'frost_manuscript', id: 'fm1', x: 40, y: 26, label: 'Donmuş el yazması', sprite: 'frost_manuscript', say: 'Sayfada mabet kapısının eski bir çizimi var.' },
    { type: 'qobj', group: 'frost_manuscript', id: 'fm2', x: 92, y: 70, label: 'Donmuş el yazması', sprite: 'frost_manuscript', say: '"Ölü Krallık\'ın mührü buzun altında uyur..."' },
    { type: 'escort', id: 'expedition', x: 21, y: 61, name: 'Keşif Ekibi', look: 'npc_expedition', hp: 3200, speed: 2.0,
      route: [[28, 62], [40, 50], [58, 44], [70, 34], [82, 26], [94, 18], [103, 12]],
      ambushes: [{ at: 0.25, wave: [['frost_wolf', 3]], say: 'Ayaz Kurtları ekibi kuşattı!' },
        { at: 0.55, wave: [['ice_wisp', 2], ['frost_wolf', 1]], say: 'Buz ruhçukları yolu kesti!' },
        { at: 0.8, wave: [['snow_shaman', 2], ['frost_sentinel', 1]], say: 'Şamanlar mabet yolunu tutmuş!' }] },
    { type: 'fx', fx: 'campfire', x: 16, y: 65 },
    ...frostCrystals.map(([x, y], i) => ({ type: 'gather', id: `frost_c${i}`, kind: 'frost_crystal', x, y, clear: 0.6 })),
    { type: 'qobj', group: 'winter_relic', id: 'wr1', x: 30, y: 36, label: 'Donmuş hatıra' },
    { type: 'qobj', group: 'winter_relic', id: 'wr2', x: 64, y: 40, label: 'Donmuş hatıra' },
    { type: 'qobj', group: 'winter_relic', id: 'wr3', x: 92, y: 40, label: 'Donmuş hatıra' },
    { type: 'qobj', group: 'winter_relic', id: 'wr4', x: 56, y: 76, label: 'Donmuş hatıra' },
    { type: 'chest', id: 'chest_frost_w', x: 8, y: 8, gold: [650, 850], loot: [{ id: 'frost_essence', qty: [2, 2] }, { id: 'hp_xl', qty: [3, 3] }] },
    { type: 'chest', id: 'chest_frost_e', x: 110, y: 82, gold: [700, 900], loot: [{ id: 'ash_steel', qty: [3, 4] }, { id: 'altar_crystal', qty: [1, 1] }, { id: 'mp_xl', qty: [3, 3] }] },
    { type: 'fx', fx: 'brazier', x: 101, y: 9 }, { type: 'fx', fx: 'brazier', x: 107, y: 9 },
  ],
  entries: {
    from_ash: { x: 3, y: 70 },
    from_temple: { x: 104, y: 8 },
    waystone: { x: 20, y: 70 },
    respawn: { x: 16, y: 67 },
  },
  locations: [
    { id: 'loc_frost_entrance', name: 'Ayaz Geçidi girişi', x: 6, y: 70, r: 5 },
  ],
};
