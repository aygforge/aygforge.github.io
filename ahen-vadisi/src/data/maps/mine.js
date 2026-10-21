// Kırık Damar Madeni — 104×78: 4 farm kampı, cevher damarları, Bataklık geçidi ve Derin Ocak kapısı
const ironVeins = [[18, 18], [28, 16], [30, 27], [17, 27], [22, 33], [36, 38], [44, 40], [12, 37], [20, 48], [58, 40]];
const hardVeins = [[24, 56], [36, 56], [26, 66], [38, 64], [48, 66], [67, 56], [62, 70], [84, 26]];
export default {
  id: 'mine', name: 'Kırık Damar Madeni', w: 104, h: 78, seed: 9090,
  rec: 'Lv. 10–15', theme: 'mine', ambient: 'mine', music: 'cave', dark: 0.5,
  base: 'cave', mass: 'rock_mass', carve: true,
  areas: [
    { id: 'entry_hall', x: 8, y: 40, r: 5 },
    { id: 'excavation', name: 'Eski Kazı Alanı', x: 24, y: 22, r: 9, ground: 'dirt', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'pick_goblin', max: 7 }] },
    { id: 'dark_gallery', name: 'Karanlık Galeri', x: 66, y: 48, r: 9, camp: true, keepRatio: 0.5, spawns: [{ enemy: 'cave_bat', max: 7 }] },
    { id: 'shell_nest', name: 'Sert Kabuk Yuvası', x: 30, y: 60, r: 9, camp: true, keepRatio: 0.5, spawns: [{ enemy: 'ironshell_beetle', max: 6 }] },
    { id: 'crystal_rooms', name: 'Kristal Odaları', x: 78, y: 22, r: 9, ground: 'crystal_floor', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'ore_priest', max: 6 }], elite: 'red_vein_watcher' },
    { id: 'gate_hall', name: 'Derin Ocak Kapısı', x: 52, y: 10, r: 5, ground: 'crystal_floor' },
    { id: 'miner_nook', x: 92, y: 30, r: 3 },
    { id: 'south_pass', x: 60, y: 72, r: 4 },
    { id: 'junction', x: 52, y: 34, r: 4 },
  ],
  paths: [
    { pts: [[0, 40], [14, 40], [24, 30], [24, 22]], w: 4 },
    { pts: [[14, 40], [22, 50], [30, 60]], w: 4 },
    { pts: [[14, 40], [40, 40], [52, 34], [66, 48]], w: 4 },
    { pts: [[52, 34], [52, 10], [52, 2]], w: 4 },
    { pts: [[52, 34], [66, 26], [78, 22], [92, 30]], w: 4 },
    { pts: [[66, 48], [64, 64], [60, 77]], w: 4 },
    { pts: [[30, 60], [46, 66], [64, 64]], w: 3 },
  ],
  stamps: [
    { s: 'cart', x: 20, y: 25 }, { s: 'support', x: 13, y: 37 }, { s: 'support', x: 17, y: 37 },
    { s: 'support', x: 50, y: 13 }, { s: 'support', x: 55, y: 13 }, { s: 'crate', x: 29, y: 19 }, { s: 'barrel', x: 30, y: 19 },
    { s: 'crystal_big', x: 47, y: 7 }, { s: 'crystal_big', x: 57, y: 7 }, { s: 'cart', x: 60, y: 66 },
    { s: 'sign', x: 10, y: 37 },
  ],
  scatter: [
    { s: 'pillar', d: 0.006 }, { s: 'crystal_big', d: 0.012, on: ['crystal_floor'] }, { s: 'rock', d: 0.012 },
    { s: 'rock_big', d: 0.004 }, { s: 'support', d: 0.003 }, { s: 'crystal_big', d: 0.002, salt: 5 },
  ],
  decor: [
    { tiles: ['rubble', 'pebbles', 'cracks', 'ore_specks'], d: 0.10, on: ['cave', 'dirt'] },
    { tiles: ['crystal_small', 'crystal_small', 'cracks'], d: 0.12, on: ['crystal_floor'], salt: 2 },
    { tiles: ['bones', 'cobweb'], d: 0.012, on: ['cave'], salt: 3 },
  ],
  decorAt: [
    { x: 20, y: 22, t: 'rail_h' }, { x: 21, y: 22, t: 'rail_h' }, { x: 22, y: 22, t: 'rail_h' }, { x: 23, y: 22, t: 'rail_h' },
    { x: 24, y: 22, t: 'rail_h' }, { x: 25, y: 22, t: 'rail_h' }, { x: 26, y: 22, t: 'rail_h' }, { x: 27, y: 22, t: 'rail_h' },
  ],
  objects: [
    { type: 'portal', id: 'm_to_forest', x: 0, y: 40, to: 'forest', entry: 'from_mine', label: 'Fısıldayan Orman' },
    { type: 'portal', id: 'm_to_swamp', x: 60, y: 77, to: 'swamp', entry: 'from_mine', label: 'Sis Bataklığı' },
    { type: 'dungeon_gate', id: 'dungeon_gate', group: 'dungeon_gate', x: 52, y: 4, to: 'dungeon', entry: 'entrance', label: 'Derin Ocak' },
    { type: 'waystone', id: 'ws_mine', x: 8, y: 36 },
    ...ironVeins.map(([x, y], i) => ({ type: 'gather', id: `iron_v${i}`, kind: 'iron_ore', x, y, clear: 0.6 })),
    ...hardVeins.map(([x, y], i) => ({ type: 'gather', id: `hard_v${i}`, kind: 'hard_ore', x, y, clear: 0.6 })),
    { type: 'qobj', group: 'lost_miner', id: 'lost_miner', x: 93, y: 30, label: 'Kayıp Madenci Kadir' },
    { type: 'fx', fx: 'torch', x: 10, y: 38 }, { type: 'fx', fx: 'torch', x: 50, y: 32 }, { type: 'fx', fx: 'torch', x: 22, y: 20 },
    { type: 'fx', fx: 'torch', x: 64, y: 62 }, { type: 'fx', fx: 'torch', x: 54, y: 8 }, { type: 'fx', fx: 'torch', x: 32, y: 58 },
  ],
  entries: {
    from_forest: { x: 3, y: 40 },
    from_swamp: { x: 60, y: 74 },
    from_dungeon: { x: 52, y: 8 },
    waystone: { x: 8, y: 38 },
    respawn: { x: 8, y: 38 },
  },
  locations: [
    { id: 'loc_mine_entrance', name: 'Kırık Damar Madeni girişi', x: 6, y: 40, r: 4 },
  ],
};
