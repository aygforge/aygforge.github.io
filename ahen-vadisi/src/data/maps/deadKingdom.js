// Ölü Krallık — 120×88 (V3, Lv.30–35): terk edilmiş sokaklar, yıkık evler, harap mezarlık, sisli meydan.
// 4 farm kampı, Kefen Avcısı (elit), Mezar Komutanı (açık dünya bossu), Yas Şapeli (güvenli), 2 gizli sandık,
// Karanlık Cevher / Yas Otu, Yol Taşı, Kara Taht'a açılan Siyah Kapı.
const darkOre = [[30, 34], [52, 12], [66, 30], [92, 36], [100, 52], [60, 76], [24, 80]];
const mourningHerb = [[28, 54], [46, 50], [70, 50], [88, 80], [14, 62], [60, 58], [96, 12], [36, 6]];
export default {
  id: 'dead_kingdom', name: 'Ölü Krallık', w: 120, h: 88, seed: 9393,
  rec: 'Lv. 30–35', theme: 'dead', ambient: 'dead', music: 'dead', dark: 0.18, particles: 'gloom',
  base: 'dead_grass', mass: 'dead_mass',
  border: { thick: 3, noise: 3.5 },
  massNoise: { scale: 8, threshold: 0.8 },
  areas: [
    { id: 'entry', x: 6, y: 44, r: 5 },
    { id: 'mourning_chapel', name: 'Yas Şapeli', x: 18, y: 42, r: 6, ground: 'ruin_cobble', safePocket: true },
    { id: 'mourning_graves', name: 'Yas Mezarlığı', x: 38, y: 64, r: 10, ground: 'grave_soil', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'shroud_crawler', max: 8 }], elite: 'shroud_hunter' },
    { id: 'archer_post', name: 'Kırık Okçular Mevzii', x: 40, y: 20, r: 10, ground: 'ruin_cobble', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'bone_archer', max: 7 }] },
    { id: 'ruined_garrison', name: 'Harap Garnizon', x: 80, y: 62, r: 10, ground: 'ruin_cobble', camp: true, keepRatio: 0.45, spawns: [{ enemy: 'cursed_guard', max: 7 }] },
    { id: 'silent_chapel', name: 'Sessiz Şapel', x: 82, y: 22, r: 10, ground: 'grave_soil', camp: true, keepRatio: 0.5, spawns: [{ enemy: 'grave_mage', max: 6 }] },
    { id: 'misty_square', name: 'Sisli Meydan', x: 58, y: 42, r: 6, ground: 'ruin_cobble' },
    { id: 'commander_tomb', name: 'Komutanın Mezarı', x: 104, y: 72, r: 9, ground: 'grave_soil', boss: 'grave_commander', keepRatio: 0.85 },
    { id: 'black_gate', name: 'Siyah Kapı', x: 110, y: 34, r: 5, ground: 'ruin_cobble' },
    { id: 'hidden_nw', x: 8, y: 8, r: 3 },
    { id: 'hidden_sw', x: 8, y: 80, r: 3 },
  ],
  paths: [
    { pts: [[0, 44], [8, 44], [18, 42]], w: 3, tile: 'ruin_cobble' },
    { pts: [[18, 42], [32, 42], [46, 42], [58, 42]], w: 3, tile: 'ruin_cobble' },
    { pts: [[32, 42], [36, 32], [40, 20]], w: 3, tile: 'ruin_cobble' },
    { pts: [[30, 44], [34, 54], [38, 64]], w: 3, tile: 'grave_soil' },
    { pts: [[58, 42], [68, 32], [82, 22]], w: 3, tile: 'ruin_cobble' },
    { pts: [[58, 42], [70, 52], [80, 62]], w: 3, tile: 'ruin_cobble' },
    { pts: [[58, 42], [76, 40], [94, 38], [110, 34], [119, 32]], w: 3, tile: 'ruin_cobble' },
    { pts: [[80, 62], [92, 68], [104, 72]], w: 3, tile: 'grave_soil' },
    { pts: [[40, 20], [24, 12], [8, 8]], w: 2, tile: 'grave_soil' },
    { pts: [[38, 64], [22, 74], [8, 80]], w: 2, tile: 'grave_soil' },
    { pts: [[40, 20], [60, 14], [82, 22]], w: 2, tile: 'grave_soil' },
    { pts: [[58, 42], [58, 60], [60, 76]], w: 2, tile: 'grave_soil' },
  ],
  ponds: [
    { x: 66, y: 66, rx: 4, ry: 2.5, terrain: 'void_pool' },
    { x: 96, y: 52, rx: 3.5, ry: 2.2, terrain: 'void_pool' },
    { x: 22, y: 26, rx: 3, ry: 2, terrain: 'void_pool' },
  ],
  stamps: [
    // Yas Şapeli
    { s: 'mausoleum', x: 15, y: 33 }, { s: 'grave_cross', x: 12, y: 38 }, { s: 'grave_cross', x: 24, y: 38 }, { s: 'coffin', x: 22, y: 47 },
    { s: 'sign', x: 10, y: 46 },
    // Sisli Meydan çevresindeki terk edilmiş evler (Sessiz Evler)
    { s: 'ruined_house', x: 48, y: 31 }, { s: 'ruined_house', x: 63, y: 31 }, { s: 'ruined_house', x: 47, y: 46 }, { s: 'ruined_house', x: 64, y: 46 },
    { s: 'broken_monument', x: 57, y: 37 },
    // Yas Mezarlığı
    { s: 'mausoleum', x: 36, y: 56 }, { s: 'grave_cross', x: 31, y: 61 }, { s: 'tombstone', x: 33, y: 66 }, { s: 'tombstone2', x: 44, y: 61 },
    { s: 'grave_cross', x: 45, y: 67 }, { s: 'tombstone', x: 30, y: 69 }, { s: 'tombstone2', x: 41, y: 71 }, { s: 'grave_cross', x: 36, y: 72 },
    { s: 'iron_fence', x: 29, y: 56 }, { s: 'iron_fence', x: 30, y: 56 }, { s: 'iron_fence', x: 46, y: 56 }, { s: 'iron_fence', x: 47, y: 56 },
    // Kırık Okçular Mevzii
    { s: 'watchtower', x: 33, y: 13 }, { s: 'watchtower', x: 46, y: 13 }, { s: 'ruin_wall', x: 36, y: 26 }, { s: 'ruin_wall', x: 44, y: 25 },
    { s: 'bone_heap', x: 40, y: 15 },
    // Harap Garnizon
    { s: 'ruin_tower', x: 72, y: 54 }, { s: 'ruin_tower', x: 86, y: 54 }, { s: 'ruin_wall', x: 74, y: 68 }, { s: 'ruin_wall', x: 85, y: 69 },
    { s: 'throne_banner', x: 79, y: 55 }, { s: 'bone_heap', x: 82, y: 66 },
    // Sessiz Şapel
    { s: 'mausoleum', x: 81, y: 13 }, { s: 'broken_monument', x: 74, y: 19 }, { s: 'broken_monument', x: 89, y: 19 },
    { s: 'tombstone', x: 77, y: 28 }, { s: 'tombstone2', x: 87, y: 28 }, { s: 'dark_obelisk', x: 82, y: 27 },
    // Komutanın Mezarı
    { s: 'mausoleum', x: 103, y: 62 }, { s: 'dark_obelisk', x: 97, y: 68 }, { s: 'dark_obelisk', x: 111, y: 68 },
    { s: 'throne_banner', x: 98, y: 77 }, { s: 'throne_banner', x: 110, y: 77 },
    // Siyah Kapı
    { s: 'obsidian_wall', x: 113, y: 27 }, { s: 'obsidian_wall', x: 113, y: 37 }, { s: 'dark_obelisk', x: 108, y: 29 }, { s: 'dark_obelisk', x: 108, y: 38 },
    // gizli köşeler
    { s: 'dead_oak', x: 11, y: 5 }, { s: 'bone_heap', x: 11, y: 82 },
  ],
  scatter: [
    { s: 'dead_oak', d: 0.022 }, { s: 'dead_tree', d: 0.008 }, { s: 'grave_cross', d: 0.004, on: ['grave_soil'] },
    { s: 'tombstone', d: 0.004, on: ['grave_soil'], salt: 2 }, { s: 'rock', d: 0.004 },
  ],
  decor: [
    { tiles: ['dead_tuft', 'dead_tuft', 'fog_wisp', 'pebbles', 'bones'], d: 0.11, on: ['dead_grass'] },
    { tiles: ['bone_pile', 'grave_candle', 'skull', 'dead_tuft'], d: 0.08, on: ['grave_soil'], salt: 2 },
    { tiles: ['cracks', 'rubble', 'cursed_rune', 'fog_wisp'], d: 0.05, on: ['ruin_cobble'], salt: 3 },
  ],
  objects: [
    { type: 'portal', id: 'dk_to_frost', x: 0, y: 44, to: 'frost', entry: 'from_dead', label: 'Ayaz Geçidi' },
    { type: 'portal', id: 'dk_to_throne', x: 119, y: 32, to: 'black_throne', entry: 'from_dead', label: 'Kara Taht',
      requires: { flag: 'black_gate_open', msg: 'Siyah Kapı mühürlü. Mezar Komutanı\'nın armasıyla kapının kilidini açmak gerek.' } },
    { type: 'waystone', id: 'ws_dead', group: 'ws_dead', x: 22, y: 40 },
    { type: 'npc', npc: 'seher', x: 16, y: 39 },
    { type: 'npc', npc: 'hamit', x: 21, y: 45 },
    { type: 'fx', fx: 'brazier', x: 14, y: 42 }, { type: 'fx', fx: 'torch', x: 24, y: 43 },
    // Sessiz Evler (m38)
    { type: 'qobj', group: 'silent_house', id: 'house_nw', x: 50, y: 37, label: 'Terk edilmiş ev', sprite: 'house_door', say: 'Masada yarım kalmış bir yemek; ev halkı aceleyle çıkmış.' },
    { type: 'qobj', group: 'silent_house', id: 'house_ne', x: 65, y: 37, label: 'Terk edilmiş ev', sprite: 'house_door', say: 'Duvara kazınmış bir taç ve altında "ONU UYANDIRMAYIN".' },
    { type: 'qobj', group: 'silent_house', id: 'house_sw', x: 49, y: 52, label: 'Terk edilmiş ev', sprite: 'house_door', say: 'Beşikte toz; kapının iç tarafında tırnak izleri.' },
    { type: 'qobj', group: 'silent_house', id: 'house_se', x: 66, y: 52, label: 'Terk edilmiş ev', sprite: 'house_door', say: 'Bir muhafız günlüğü: "Komutan mezardan kalkınca kimse nöbeti bırakamadı."' },
    // Kaybolan Tacın İzleri (m40)
    { type: 'qobj', group: 'royal_clue', id: 'clue_archer', x: 40, y: 24, label: 'Kraliyet ipucu', sprite: 'royal_clue', say: 'Kırık bir okluk: üstünde kraliyet mührü, içinde taçtan kopmuş bir altın parça.' },
    { type: 'qobj', group: 'royal_clue', id: 'clue_chapel', x: 84, y: 25, label: 'Kraliyet ipucu', sprite: 'royal_clue', say: 'Şapel defteri: "Taç, kralla birlikte Kara Taht\'ın altına indirildi."' },
    { type: 'qobj', group: 'royal_clue', id: 'clue_garrison', x: 80, y: 66, label: 'Kraliyet ipucu', sprite: 'royal_clue', say: 'Garnizon emri: "Siyah Kapı\'nın anahtarı Komutan\'ın armasıdır."' },
    // Ölülerin Kayıtları (s37)
    { type: 'qobj', group: 'old_record', id: 'rec1', x: 12, y: 30, label: 'Eski kayıt', sprite: 'old_record', say: 'Doğum ve ölüm defteri — son sayfa kan lekeli.' },
    { type: 'qobj', group: 'old_record', id: 'rec2', x: 28, y: 66, label: 'Eski kayıt', sprite: 'old_record', say: 'Mezar listesi: komutanın adı silinmiş.' },
    { type: 'qobj', group: 'old_record', id: 'rec3', x: 54, y: 22, label: 'Eski kayıt', sprite: 'old_record', say: 'Okçu birliğinin yoklama kâğıdı: herkes "mevcut" işaretlenmiş.' },
    { type: 'qobj', group: 'old_record', id: 'rec4', x: 94, y: 30, label: 'Eski kayıt', sprite: 'old_record', say: 'Rahiplerin yas duası, yarım bırakılmış.' },
    { type: 'qobj', group: 'old_record', id: 'rec5', x: 92, y: 74, label: 'Eski kayıt', sprite: 'old_record', say: 'Komutan\'ın yemini: "Taht düşse de nöbet düşmez."' },
    // Siyah Kapının Anahtarı (m42)
    { type: 'qobj', group: 'black_gate_lock', id: 'black_lock', x: 112, y: 33, label: 'Siyah Kapı kilidi', sprite: 'black_lock', say: 'Arma kilide oturdu. Siyah Kapı gıcırdayarak açılıyor!' },
    ...darkOre.map(([x, y], i) => ({ type: 'gather', id: `dark_ore${i}`, kind: 'dark_ore', x, y, clear: 0.6 })),
    ...mourningHerb.map(([x, y], i) => ({ type: 'gather', id: `mourn_herb${i}`, kind: 'mourning_herb', x, y, clear: 0.6 })),
    { type: 'chest', id: 'chest_dead_nw', x: 8, y: 8, gold: [900, 1200], loot: [{ id: 'grave_dust', qty: [2, 3] }, { id: 'hp_xxl', qty: [2, 2] }] },
    { type: 'chest', id: 'chest_dead_sw', x: 8, y: 80, gold: [950, 1250], loot: [{ id: 'cursed_metal', qty: [2, 3] }, { id: 'altar_crystal', qty: [1, 1] }, { id: 'mp_xxl', qty: [2, 2] }] },
    { type: 'fx', fx: 'brazier', x: 100, y: 70 }, { type: 'fx', fx: 'brazier', x: 108, y: 70 },
    { type: 'fx', fx: 'torch', x: 106, y: 31 }, { type: 'fx', fx: 'torch', x: 106, y: 37 },
  ],
  entries: {
    from_frost: { x: 3, y: 44 },
    from_throne: { x: 115, y: 32 },
    waystone: { x: 22, y: 42 },
    respawn: { x: 18, y: 43 },
  },
  locations: [
    { id: 'loc_dead_entrance', name: 'Ölü Krallık girişi', x: 8, y: 44, r: 5 },
  ],
};
