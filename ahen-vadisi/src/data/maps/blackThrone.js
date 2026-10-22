// Kara Taht — 124×92 (V3, Lv.35–40): obsidyen kale duvarları, harap kraliyet avluları, kırık heykeller,
// kara büyü kaynakları. 4 farm kampı, Obsidyen Celladı (elit), üç kraliyet mührü, Son Nöbet Yeri (güvenli),
// Karanlık Mahzen girişi, 2 gizli sandık, Ruh Kristali / Obsidyen Damarı.
const soulCrystal = [[30, 40], [52, 18], [96, 14], [104, 36], [70, 82], [20, 80]];
const obsidianOre = [[46, 54], [60, 30], [74, 62], [112, 62], [90, 86], [26, 10]];
// Kanlı Yemin (m44): her mühür önce onarılır, sonra kısa bir savunma karşılaşması
const ROYAL_SEALS = [
  { id: 'rs_west', x: 30, y: 26, name: 'Batı Kraliyet Mührü', wave: [['shadow_hunter', 2]], wave2: [['shadow_hunter', 2], ['void_priest', 1]] },
  { id: 'rs_south', x: 58, y: 70, name: 'Güney Kraliyet Mührü', wave: [['obsidian_sentinel', 2]], wave2: [['obsidian_sentinel', 1], ['shadow_hunter', 2]] },
  { id: 'rs_east', x: 100, y: 26, name: 'Doğu Kraliyet Mührü', wave: [['void_priest', 2]], wave2: [['throne_executioner', 1], ['void_priest', 2]] },
];
export default {
  id: 'black_throne', name: 'Kara Taht', w: 124, h: 92, seed: 6161,
  rec: 'Lv. 35–40', theme: 'throne', ambient: 'throne', music: 'throne', dark: 0.24, particles: 'void',
  base: 'obsidian', mass: 'obsidian_mass',
  border: { thick: 3, noise: 3.5 },
  massNoise: { scale: 8, threshold: 0.8 },
  areas: [
    { id: 'entry', x: 6, y: 60, r: 5 },
    { id: 'last_watch', name: 'Son Nöbet Yeri', x: 16, y: 56, r: 6, ground: 'royal_floor', safePocket: true },
    { id: 'black_watch', name: 'Kara Nöbet Avlusu', x: 36, y: 74, r: 10, ground: 'royal_floor', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'obsidian_sentinel', max: 7 }] },
    { id: 'shadow_pass', name: 'Gölgeli Geçit', x: 40, y: 28, r: 10, ground: 'grave_soil', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'shadow_hunter', max: 7 }] },
    { id: 'executioner_square', name: 'Cellat Meydanı', x: 82, y: 66, r: 10, ground: 'ruin_cobble', camp: true, keepRatio: 0.45, spawns: [{ enemy: 'throne_executioner', max: 6 }], elite: 'obsidian_executioner' },
    { id: 'void_temple', name: 'Hiçlik Mabedi', x: 84, y: 24, r: 10, ground: 'royal_floor', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'void_priest', max: 6 }] },
    { id: 'royal_court', name: 'Kraliyet Avlusu', x: 62, y: 46, r: 7, ground: 'royal_floor' },
    { id: 'throne_steps', name: 'Taht Basamakları', x: 108, y: 48, r: 7, ground: 'royal_floor' },
    { id: 'marker_stone', name: 'İşaret Taşı', x: 62, y: 60, r: 3, ground: 'ruin_cobble' },
    ...ROYAL_SEALS.map((s) => ({ id: s.id, x: s.x, y: s.y, r: 3, ground: 'royal_floor', keepRatio: 0.9 })),
    { id: 'hidden_nw', x: 8, y: 8, r: 3 },
    { id: 'hidden_se', x: 116, y: 84, r: 3 },
  ],
  paths: [
    { pts: [[0, 60], [8, 60], [16, 56]], w: 3, tile: 'royal_floor' },
    { pts: [[16, 56], [30, 52], [46, 48], [62, 46]], w: 3, tile: 'ruin_cobble' },
    { pts: [[30, 52], [34, 64], [36, 74]], w: 3, tile: 'ruin_cobble' },
    { pts: [[30, 52], [34, 40], [40, 28]], w: 3, tile: 'ruin_cobble' },
    { pts: [[62, 46], [72, 36], [84, 24]], w: 3, tile: 'ruin_cobble' },
    { pts: [[62, 46], [72, 56], [82, 66]], w: 3, tile: 'ruin_cobble' },
    { pts: [[62, 46], [80, 46], [96, 48], [108, 48]], w: 4, tile: 'royal_floor' },
    { pts: [[62, 46], [62, 60], [58, 70]], w: 2, tile: 'ruin_cobble' },
    { pts: [[40, 28], [32, 26], [30, 26]], w: 2, tile: 'ruin_cobble' },
    { pts: [[84, 24], [94, 24], [100, 26]], w: 2, tile: 'ruin_cobble' },
    { pts: [[40, 28], [24, 16], [8, 8]], w: 2, tile: 'grave_soil' },
    { pts: [[82, 66], [100, 76], [116, 84]], w: 2, tile: 'grave_soil' },
    { pts: [[36, 74], [24, 82], [20, 80]], w: 2, tile: 'grave_soil' },
  ],
  ponds: [
    { x: 76, y: 14, rx: 4, ry: 2.5, terrain: 'void_pool' },
    { x: 92, y: 32, rx: 3, ry: 2, terrain: 'void_pool' },
    { x: 50, y: 62, rx: 3.5, ry: 2.2, terrain: 'void_pool' },
    { x: 96, y: 60, rx: 3, ry: 2, terrain: 'void_pool' },
  ],
  stamps: [
    // Son Nöbet Yeri
    { s: 'throne_banner', x: 11, y: 50 }, { s: 'throne_banner', x: 21, y: 50 }, { s: 'snow_tent', x: 18, y: 59 }, { s: 'crate', x: 10, y: 59 },
    { s: 'barrel', x: 11, y: 60 }, { s: 'sign', x: 9, y: 63 },
    // Kara Nöbet Avlusu
    { s: 'obsidian_wall', x: 27, y: 67 }, { s: 'obsidian_wall', x: 44, y: 67 }, { s: 'royal_statue', x: 32, y: 80 }, { s: 'royal_statue', x: 41, y: 80 },
    { s: 'watchtower', x: 26, y: 76 },
    // Gölgeli Geçit
    { s: 'dead_oak', x: 33, y: 20 }, { s: 'dead_oak', x: 46, y: 20 }, { s: 'obsidian_spire', x: 38, y: 34 }, { s: 'obsidian_spire', x: 45, y: 33 },
    // Cellat Meydanı
    { s: 'ruin_tower', x: 74, y: 58 }, { s: 'ruin_tower', x: 88, y: 58 }, { s: 'bone_heap', x: 80, y: 70 }, { s: 'throne_banner', x: 82, y: 59 },
    { s: 'coffin', x: 76, y: 72 }, { s: 'coffin', x: 86, y: 72 },
    // Hiçlik Mabedi
    { s: 'dark_obelisk', x: 79, y: 18 }, { s: 'dark_obelisk', x: 89, y: 18 }, { s: 'dark_obelisk', x: 79, y: 29 }, { s: 'dark_obelisk', x: 89, y: 29 },
    { s: 'mausoleum', x: 83, y: 13 },
    // Kraliyet Avlusu (Tahtın Suskunları — heykeller)
    { s: 'royal_statue', x: 56, y: 40 }, { s: 'royal_statue', x: 68, y: 40 }, { s: 'royal_statue', x: 56, y: 51 }, { s: 'royal_statue', x: 68, y: 51 },
    { s: 'broken_monument', x: 61, y: 39 },
    // Taht basamakları / Mahzen kapısı
    { s: 'obsidian_wall', x: 104, y: 38 }, { s: 'obsidian_wall', x: 112, y: 38 }, { s: 'throne_banner', x: 103, y: 47 }, { s: 'throne_banner', x: 113, y: 47 },
    { s: 'dark_obelisk', x: 102, y: 54 }, { s: 'dark_obelisk', x: 114, y: 54 },
    // mühür kaideleri
    { s: 'royal_statue', x: 26, y: 23 }, { s: 'royal_statue', x: 54, y: 67 }, { s: 'royal_statue', x: 104, y: 23 },
    // gizli köşeler
    { s: 'obsidian_spire', x: 11, y: 5 }, { s: 'bone_heap', x: 118, y: 86 },
  ],
  scatter: [
    { s: 'obsidian_spire', d: 0.012 }, { s: 'dead_oak', d: 0.01 }, { s: 'basalt_rock', d: 0.006 },
    { s: 'obsidian_wall', d: 0.003, on: ['obsidian'], salt: 4 },
  ],
  decor: [
    { tiles: ['obsidian_shards', 'void_crack', 'pebbles', 'cracks'], d: 0.08, on: ['obsidian'] },
    { tiles: ['cursed_rune', 'cracks', 'rubble'], d: 0.04, on: ['royal_floor'], salt: 2 },
    { tiles: ['bone_pile', 'dead_tuft', 'skull'], d: 0.07, on: ['grave_soil'], salt: 3 },
    { tiles: ['rubble', 'void_crack', 'bones'], d: 0.05, on: ['ruin_cobble'], salt: 4 },
  ],
  objects: [
    { type: 'portal', id: 'bt_to_dead', x: 0, y: 60, to: 'dead_kingdom', entry: 'from_throne', label: 'Ölü Krallık' },
    { type: 'dungeon_gate', id: 'crypt_gate', group: 'crypt_gate', x: 108, y: 42, to: 'dark_crypt', entry: 'entrance', label: 'Karanlık Mahzen', dungeon: 'dark_crypt' },
    { type: 'waystone', id: 'ws_throne', group: 'ws_throne', x: 20, y: 54 },
    { type: 'npc', npc: 'eren', x: 14, y: 54 },
    { type: 'npc', npc: 'veysel', x: 19, y: 57 },
    { type: 'fx', fx: 'brazier', x: 12, y: 57 }, { type: 'fx', fx: 'campfire', x: 16, y: 58 },
    // Tahtın Suskunları (m43): dört kırık heykel
    { type: 'qobj', group: 'silent_statue', id: 'st_nw', x: 57, y: 43, label: 'Suskun heykel', say: 'Kaidede: "Birinci Muhafız — tahtı ilk o terk etti."' },
    { type: 'qobj', group: 'silent_statue', id: 'st_ne', x: 69, y: 43, label: 'Suskun heykel', say: 'Kaidede: "Kraliçe — tacı yeraltına o indirdi."' },
    { type: 'qobj', group: 'silent_statue', id: 'st_sw', x: 57, y: 54, label: 'Suskun heykel', say: 'Kaidede: "Kral\'ın Kılıcı — Son Emir\'i o taşıdı."' },
    { type: 'qobj', group: 'silent_statue', id: 'st_se', x: 69, y: 54, label: 'Suskun heykel', say: 'Kaidede silinmiş bir ad ve taze bir yemin: "Hüküm sonsuzdur."' },
    // Kanlı Yemin (m44): onarım + savunma
    ...ROYAL_SEALS.map((s) => ({ type: 'qobj', group: 'royal_seal', id: s.id, x: s.x, y: s.y + 2, label: s.name, sprite: 'royal_seal', say: `${s.name} onarıldı. Tahtın lanetli muhafızları uyanıyor!` })),
    ...ROYAL_SEALS.map((s) => ({ type: 'defense', id: `def_${s.id}`, x: s.x + 2, y: s.y + 2, name: s.name, sprite: 'royal_seal', hp: 9000, ring: 9,
      intro: `${s.name}nü koru! Muhafızlar mührü kırmaya çalışacak.`,
      waves: [s.wave, s.wave2] })),
    // Kapının Son Nöbeti (s40): Eren'in muhafızı işaret taşına
    { type: 'escort', id: 'last_guard', x: 22, y: 55, name: 'Muhafız Selim', look: 'npc_guard', hp: 9000, speed: 2.0,
      route: [[30, 52], [46, 48], [58, 50], [62, 58]],
      ambushes: [{ at: 0.35, wave: [['shadow_hunter', 2]], say: 'Gölge Avcıları muhafızın peşinde!' },
        { at: 0.75, wave: [['obsidian_sentinel', 1], ['void_priest', 1]], say: 'Taht nöbetçileri yolu kesti!' }] },
    { type: 'qobj', group: 'marker_stone', id: 'marker', x: 64, y: 60, label: 'İşaret taşı', sprite: 'marker_stone', say: 'Eski muhafız yemini taşa kazınmış.' },
    // Küllü Antlaşma (s41)
    { type: 'qobj', group: 'ash_tablet', id: 'tab1', x: 44, y: 36, label: 'Antlaşma tableti', sprite: 'stone_tablet', say: '"Kül halkı ile Taht arasında: ateş yakılmayacak, kılıç çekilmeyecek."' },
    { type: 'qobj', group: 'ash_tablet', id: 'tab2', x: 90, y: 74, label: 'Antlaşma tableti', sprite: 'stone_tablet', say: '"...ve Kral sözünü bozarsa, külden bir dev uyanacak."' },
    { type: 'qobj', group: 'ash_tablet', id: 'tab3', x: 112, y: 70, label: 'Antlaşma tableti', sprite: 'stone_tablet', say: 'Tabletin yarısı kırık; altında Kor Kampı\'nın eski mührü.' },
    ...soulCrystal.map(([x, y], i) => ({ type: 'gather', id: `soul_c${i}`, kind: 'soul_crystal', x, y, clear: 0.6 })),
    ...obsidianOre.map(([x, y], i) => ({ type: 'gather', id: `obs_ore${i}`, kind: 'obsidian_ore', x, y, clear: 0.6 })),
    { type: 'chest', id: 'chest_throne_nw', x: 8, y: 8, gold: [1200, 1500], loot: [{ id: 'shadow_essence', qty: [2, 3] }, { id: 'hp_xxl', qty: [3, 3] }] },
    { type: 'chest', id: 'chest_throne_se', x: 116, y: 84, gold: [1300, 1600], loot: [{ id: 'executioner_chain', qty: [2, 2] }, { id: 'altar_crystal', qty: [1, 1] }, { id: 'mp_xxl', qty: [3, 3] }] },
    { type: 'fx', fx: 'brazier', x: 105, y: 45 }, { type: 'fx', fx: 'brazier', x: 111, y: 45 },
    { type: 'fx', fx: 'torch', x: 60, y: 46 }, { type: 'fx', fx: 'torch', x: 65, y: 46 },
  ],
  entries: {
    from_dead: { x: 3, y: 60 },
    from_crypt: { x: 108, y: 46 },
    waystone: { x: 20, y: 56 },
    respawn: { x: 16, y: 57 },
  },
  locations: [
    { id: 'loc_throne_entrance', name: 'Kara Taht girişi', x: 8, y: 60, r: 5 },
  ],
};
