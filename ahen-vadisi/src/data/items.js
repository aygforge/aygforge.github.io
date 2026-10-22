// 60 ekipman şablonu (V1, belge §7) + 30 V2 şablonu (Kül ve Ayaz, Lv.21–30) + 36 V3 şablonu (Lv.31–40) = 126.
// V4 (Gökyarık): +84 şablon = 210 (Okçu/Ölü Çağıran Lv.1–50, Warrior/Mage Lv.44–50, ortak aksesuar). Değerler +0 sabit temel değerlerdir.
// base: yükseltmeden etkilenen temel değerler (atk/mag aralığı, def, mdef, focus büyü gücü)
// fixed: sabit bonuslar (yükseltmeden etkilenmez)
// look: procedural pixel-art parametreleri

const W = (id, name, lv, rarity, hand, atk, sources, look, extra = {}) => ({
  id, name, slot: 'weapon', cls: 'warrior', lv, rarity, hand, base: { atkMin: atk[0], atkMax: atk[1] }, fixed: {}, sources, look, ...extra,
});
const M = (id, name, lv, rarity, hand, mag, sources, look, extra = {}) => ({
  id, name, slot: 'weapon', cls: 'mage', lv, rarity, hand, base: { magMin: mag[0], magMax: mag[1] }, fixed: {}, sources, look, ...extra,
});
const A = (id, name, slot, cls, lv, rarity, base, fixed, sources, look) => ({
  id, name, slot, cls, lv, rarity, base, fixed, sources, look,
});
// V4: Okçu yayı (fiziksel menzilli; sadakla birlikte kullanılır — 'bow' iki elli sayılmaz) ve Ölü Çağıran silahı (büyü gücü)
const Y = (id, name, lv, rarity, atk, sources, look, extra = {}) => ({
  id, name, slot: 'weapon', cls: 'archer', lv, rarity, hand: 'bow', base: { atkMin: atk[0], atkMax: atk[1] }, fixed: {}, sources, look: { type: 'bow', ...look }, ...extra,
});
const K = (id, name, lv, rarity, hand, mag, sources, look, extra = {}) => ({
  id, name, slot: 'weapon', cls: 'necromancer', lv, rarity, hand, base: { magMin: mag[0], magMax: mag[1] }, fixed: {}, sources, look, ...extra,
});

export const ITEM_LIST = [
  // ------------------------------------------------ Warrior silahları (8)
  W('W01', 'Köylü Kılıcı', 1, 'N', 'one', [5, 7], ['starter', 'merchant'], { type: 'sword', blade: '#b9c0c6', guard: '#7a5a32', grip: '#5b3a1f', len: 9 }),
  W('W02', 'Avcı Palası', 5, 'U', 'two', [15, 20], ['forest_raider', 'craft'], { type: 'machete', blade: '#c9c2a8', guard: '#4f6b3a', grip: '#4a3020', len: 12 }),
  W('W03', 'Çelik Kılıç', 10, 'R', 'one', [28, 37], ['pick_goblin'], { type: 'sword', blade: '#e1e8ef', guard: '#9aa4ad', grip: '#3b3b55', len: 12, gem: '#4f9bff' }),
  W('W04', 'Alfa Dişi Kılıcı', 11, 'R', 'one', [34, 44], ['alpha_wolf'], { type: 'fang', blade: '#efe6cf', guard: '#6b5a4a', grip: '#3a2a20', len: 12 }, { unique: true }),
  W('W05', 'Gözcünün Baltası', 15, 'E', 'two', [49, 64], ['red_vein_watcher', 'craft'], { type: 'axe', blade: '#d04a3a', guard: '#5a3a2a', grip: '#3a2618', len: 14, gem: '#ff6a5a' }, { unique: true }),
  W('W06', 'Bataklık Kılıcı', 18, 'R', 'one', [48, 62], ['rotten_guard'], { type: 'sword', blade: '#8fb49a', guard: '#5a5a3a', grip: '#2f3a2a', len: 13, gem: '#6ad08a' }),
  W('W07', 'Golemin Yumruğu', 19, 'E', 'two', [67, 87], ['mine_golem'], { type: 'maul', blade: '#8a8a96', guard: '#5e5e6a', grip: '#4a3828', len: 14, gem: '#5ae0ff' }, { unique: true }),
  W('W08', 'Kızıl Hüküm', 20, 'L', 'two', [90, 115], ['mine_golem'], { type: 'greatsword', blade: '#e0383a', guard: '#f0c050', grip: '#2a1010', len: 16, gem: '#ffd060', glow: '#ff5030' },
    { unique: true, legendaryFixed: { str: 14, crit: 0.08 }, effect: 'crimson_strike' }),

  // ------------------------------------------------ Mage silahları (8)
  M('M01', 'Çırak Asası', 1, 'N', 'two', [6, 9], ['starter', 'merchant'], { type: 'staff', shaft: '#8a6238', head: 'orb', orb: '#7ab8ff', len: 15 }),
  M('M02', 'Kök Değneği', 5, 'U', 'one', [13, 19], ['thorn_rootling', 'craft'], { type: 'wand', shaft: '#5d4a2a', head: 'root', orb: '#8be06a', len: 10 }),
  M('M03', 'Cevher Asası', 12, 'R', 'two', [32, 42], ['ore_priest'], { type: 'staff', shaft: '#6c6c78', head: 'crystal', orb: '#ff9a3a', len: 15 }),
  M('M04', 'Kurt Ruhu Asası', 11, 'R', 'two', [35, 45], ['alpha_wolf'], { type: 'staff', shaft: '#d8ccb0', head: 'skull', orb: '#9fe0ff', len: 15 }, { unique: true }),
  M('M05', 'Çatlak Yıldız Asası', 15, 'E', 'two', [52, 66], ['red_vein_watcher'], { type: 'staff', shaft: '#3a2a4a', head: 'star', orb: '#ffe070', len: 16 }, { unique: true }),
  M('M06', 'Sis Değneği', 17, 'R', 'one', [45, 56], ['mist_witch'], { type: 'wand', shaft: '#cfd6d0', head: 'orb', orb: '#6fe0c8', len: 10 }),
  M('M07', 'Kristal Asa', 19, 'E', 'two', [72, 92], ['mine_golem'], { type: 'staff', shaft: '#5a6a8a', head: 'crystal', orb: '#5ae0ff', len: 16 }, { unique: true }),
  M('M08', 'Kadim Ruh Asası', 20, 'L', 'two', [97, 123], ['mine_golem'], { type: 'staff', shaft: '#f0e0b0', head: 'flame', orb: '#b0f0ff', len: 17, glow: '#80e0ff' },
    { unique: true, legendaryFixed: { int: 16, mp: 60 }, effect: 'spirit_echo' }),

  // ------------------------------------------------ Yardımcı el (6)
  A('O01', 'Tahta Kalkan', 'offhand', 'warrior', 1, 'N', { def: 4 }, {}, ['merchant'], { type: 'shield', main: '#8a6238', rim: '#5a4024', boss: '#9a9a9a' }),
  A('O02', 'Madenci Kalkanı', 'offhand', 'warrior', 10, 'U', { def: 11 }, { hp: 12 }, ['pick_goblin'], { type: 'shield', main: '#6a6e78', rim: '#3e4048', boss: '#c08040' }),
  A('O03', 'Golem Kalkanı', 'offhand', 'warrior', 19, 'E', { def: 26 }, { hp: 40 }, ['mine_golem'], { type: 'shield', main: '#7a7a86', rim: '#4a4a56', boss: '#5ae0ff' }),
  A('O04', 'Yontulmuş Odak', 'offhand', 'mage', 1, 'N', { mag: 3 }, {}, ['merchant'], { type: 'focus', main: '#9ab0c0', orb: '#7ab8ff' }),
  A('O05', 'Cevher Odağı', 'offhand', 'mage', 10, 'U', { mag: 10 }, { mp: 12 }, ['ore_priest'], { type: 'focus', main: '#8a6a4a', orb: '#ff9a3a' }),
  A('O06', 'Sis Aynası', 'offhand', 'mage', 17, 'R', { mag: 17 }, { mp: 25 }, ['mist_witch'], { type: 'mirror', main: '#b0c0c0', orb: '#6fe0c8' }),

  // ------------------------------------------------ Başlık (6)
  A('H01', 'Eskimiş Miğfer', 'helm', 'warrior', 1, 'N', { def: 3 }, {}, ['merchant'], { type: 'helm', main: '#8a8f96', trim: '#6a5a3a' }),
  A('H02', 'Avcı Miğferi', 'helm', 'warrior', 8, 'U', { def: 7 }, {}, ['forest_raider'], { type: 'helm', main: '#7a6040', trim: '#4f6b3a', horn: true }),
  A('H03', 'Bataklık Miğferi', 'helm', 'warrior', 17, 'R', { def: 12 }, {}, ['rotten_guard'], { type: 'greathelm', main: '#5e7a68', trim: '#c0b070' }),
  A('H04', 'Kumaş Başlık', 'helm', 'mage', 1, 'N', { def: 1, mdef: 2 }, {}, ['merchant'], { type: 'hood', main: '#6a5a8a', trim: '#d0c090' }),
  A('H05', 'Kök Başlığı', 'helm', 'mage', 8, 'U', { def: 3, mdef: 5 }, {}, ['thorn_rootling'], { type: 'hat', main: '#4f6b3a', trim: '#8be06a' }),
  A('H06', 'Sis Başlığı', 'helm', 'mage', 17, 'R', { def: 6, mdef: 10 }, {}, ['mist_witch'], { type: 'hat', main: '#3f6f72', trim: '#6fe0c8' }),

  // ------------------------------------------------ Göğüs (8)
  A('C01', 'Köylü Zırhı', 'chest', 'warrior', 1, 'N', { def: 5 }, {}, ['starter', 'merchant'], { type: 'armor', main: '#8a6a44', trim: '#5a4024', tier: 0 }),
  A('C02', 'Avcı Yeleği', 'chest', 'warrior', 6, 'U', { def: 11 }, {}, ['forest_raider'], { type: 'armor', main: '#5f7a42', trim: '#7a5a32', tier: 1 }),
  A('C03', 'Madenci Zırhı', 'chest', 'warrior', 13, 'R', { def: 20 }, {}, ['ironshell_beetle', 'craft'], { type: 'armor', main: '#8a929c', trim: '#5a606a', tier: 2 }),
  A('C04', 'Golemin Göğüslüğü', 'chest', 'warrior', 19, 'E', { def: 33 }, { hp: 30 }, ['mine_golem'], { type: 'armor', main: '#6e7280', trim: '#5ae0ff', tier: 4 }, ),
  A('C05', 'Çırak Cübbesi', 'chest', 'mage', 1, 'N', { def: 2, mdef: 3 }, {}, ['starter', 'merchant'], { type: 'robe', main: '#4a5a9a', trim: '#d0c090', tier: 0 }),
  A('C06', 'Kök Dokuma Cübbe', 'chest', 'mage', 6, 'U', { def: 6, mdef: 7 }, {}, ['thorn_rootling'], { type: 'robe', main: '#4f6b3a', trim: '#a0d070', tier: 1 }),
  A('C07', 'Cevher Cübbesi', 'chest', 'mage', 13, 'R', { def: 12, mdef: 18 }, {}, ['ore_priest', 'craft'], { type: 'robe', main: '#8a4a2a', trim: '#ff9a3a', tier: 2 }),
  A('C08', 'Kristal Cübbe', 'chest', 'mage', 19, 'E', { def: 19, mdef: 29 }, {}, ['mine_golem'], { type: 'robe', main: '#3a5a8a', trim: '#5ae0ff', tier: 4 }),

  // ------------------------------------------------ Eldiven (6)
  A('G01', 'İşçi Eldiveni', 'gloves', 'warrior', 1, 'N', { def: 1 }, {}, ['merchant'], { type: 'gloves', main: '#8a6a44' }),
  A('G02', 'Avcı Eldiveni', 'gloves', 'warrior', 9, 'U', { def: 4 }, { str: 1 }, ['forest_raider'], { type: 'gloves', main: '#5f7a42' }),
  A('G03', 'Muhafız Eldiveni', 'gloves', 'warrior', 18, 'R', { def: 8 }, { dex: 2 }, ['rotten_guard'], { type: 'gauntlet', main: '#7a8a80' }),
  A('G04', 'Bez Eldiven', 'gloves', 'mage', 1, 'N', { def: 1 }, {}, ['merchant'], { type: 'gloves', main: '#c8b890' }),
  A('G05', 'Mühür Eldiveni', 'gloves', 'mage', 10, 'U', { def: 2 }, { mp: 10 }, ['ore_priest'], { type: 'gloves', main: '#8a4a2a', gem: '#ff9a3a' }),
  A('G06', 'Sis Dokunuşu', 'gloves', 'mage', 18, 'R', { def: 5, mdef: 6 }, {}, ['mist_witch'], { type: 'gloves', main: '#3f6f72', gem: '#6fe0c8' }),

  // ------------------------------------------------ Bot (6)
  A('B01', 'Eski Çizme', 'boots', 'warrior', 1, 'N', { def: 2 }, {}, ['merchant'], { type: 'boots', main: '#6a4a2a' }),
  A('B02', 'Deri Çizme', 'boots', 'warrior', 8, 'U', { def: 4 }, { hp: 12 }, ['forest_raider'], { type: 'boots', main: '#8a5a32' }),
  A('B03', 'Bataklık Çizmesi', 'boots', 'warrior', 17, 'R', { def: 7 }, { vit: 2 }, ['swamp_leech'], { type: 'greaves', main: '#4f6a52' }),
  A('B04', 'Hafif Pabuç', 'boots', 'mage', 1, 'N', { def: 1 }, {}, ['merchant'], { type: 'boots', main: '#7a6a8a' }),
  A('B05', 'Orman Adımı', 'boots', 'mage', 8, 'U', { def: 3 }, { mp: 12 }, ['thorn_rootling'], { type: 'boots', main: '#4f6b3a' }),
  A('B06', 'Sis Yürüyüşü', 'boots', 'mage', 17, 'R', { def: 5, mdef: 5 }, { vit: 1 }, ['mist_witch'], { type: 'boots', main: '#3f6f72' }),

  // ------------------------------------------------ Yüzük (6)
  A('R01', 'Bakır Yüzük', 'ring', 'any', 1, 'N', {}, { hp: 10 }, ['merchant'], { type: 'ring', band: '#c07a3a', gem: null }),
  A('R02', 'Avcı Yüzüğü', 'ring', 'any', 6, 'U', {}, { str: 1 }, ['forest_raider'], { type: 'ring', band: '#9a8a6a', gem: '#5fd068' }),
  A('R03', 'Kök Yüzüğü', 'ring', 'any', 7, 'U', {}, { vit: 1 }, ['thorn_rootling'], { type: 'ring', band: '#6a5a3a', gem: '#8be06a' }),
  A('R04', 'Kurt Dişi Halkası', 'ring', 'any', 11, 'R', {}, { dex: 2 }, ['alpha_wolf'], { type: 'ring', band: '#efe6cf', gem: '#9fe0ff' }),
  A('R05', 'Cevher Halkası', 'ring', 'any', 15, 'R', {}, { int: 2, mp: 20 }, ['ore_priest'], { type: 'ring', band: '#9aa4ad', gem: '#ff9a3a' }),
  A('R06', 'Bataklık Mührü', 'ring', 'any', 19, 'E', {}, { vit: 3, hp: 35 }, ['swamp_executioner'], { type: 'ring', band: '#4f6a52', gem: '#c070ff' }),

  // ------------------------------------------------ Kolye (6)
  A('A01', 'Deri İp Kolye', 'amulet', 'any', 1, 'N', {}, { mp: 8 }, ['merchant'], { type: 'amulet', chain: '#7a5a32', gem: '#9ab0c0' }),
  A('A02', 'Orman Tılsımı', 'amulet', 'any', 6, 'U', {}, { hp: 18 }, ['thorn_rootling'], { type: 'amulet', chain: '#6a5a3a', gem: '#5fd068' }),
  A('A03', 'Avcı Madalyonu', 'amulet', 'any', 10, 'E', {}, { crit: 0.03, dex: 2 }, ['bandit_captain'], { type: 'medal', chain: '#c0a040', gem: '#e0c060' }),
  A('A04', 'Ay Işığı Kolyesi', 'amulet', 'any', 11, 'E', {}, { vit: 2, hp: 25 }, ['alpha_wolf'], { type: 'amulet', chain: '#d0d8e0', gem: '#b0e0ff' }),
  A('A05', 'Zehir Kıran Muska', 'amulet', 'any', 18, 'R', {}, { poisonRes: 0.15 }, ['mist_witch'], { type: 'amulet', chain: '#4f6a52', gem: '#8be06a' }),
  A('A06', 'Kristal Kalp Kolyesi', 'amulet', 'any', 19, 'E', {}, { int: 3, mp: 35 }, ['mine_golem'], { type: 'amulet', chain: '#9aa4ad', gem: '#5ae0ff' }),

  // ================================================ V2.0 — KÜL VE AYAZ (30)
  // Warrior silahları (5)
  W('W09', 'Kül Çeliği Kılıcı', 21, 'U', 'one', [66, 83], ['ash_imp'], { type: 'sword', blade: '#8a8480', guard: '#c85a2a', grip: '#2a2222', len: 12, gem: '#ff8a3a' }),
  W('W10', 'Akrep Biçici', 23, 'R', 'two', [80, 103], ['crimson_scorpion', 'craft'], { type: 'machete', blade: '#c83a2a', guard: '#5a2a1a', grip: '#2a1a14', len: 14, gem: '#ffb040' }),
  W('W11', 'Kor Kıranı', 25, 'E', 'two', [97, 125], ['ash_giant'], { type: 'maul', blade: '#3a3030', guard: '#ff7a2a', grip: '#2a1a14', len: 15, gem: '#ffd060', glow: '#ff7a2a' }, { unique: true }),
  W('W12', 'Ayaz Keseri', 28, 'R', 'one', [111, 137], ['frost_sentinel'], { type: 'axe', blade: '#bfe8ff', guard: '#5a6a80', grip: '#2a3040', len: 13, gem: '#7ad8ff' }),
  W('W13', 'Buzun Hükmü', 30, 'L', 'two', [148, 185], ['frozen_guardian'], { type: 'greatsword', blade: '#c8f0ff', guard: '#5a8ad0', grip: '#1a2440', len: 17, gem: '#ffffff', glow: '#7ad8ff' },
    { unique: true, legendaryFixed: { str: 16, crit: 0.08 }, effect: 'frost_verdict' }),
  // Mage silahları (5)
  M('M09', 'Köz Değneği', 21, 'U', 'one', [69, 88], ['ash_imp'], { type: 'wand', shaft: '#3a2a24', head: 'flame', orb: '#ff8a3a', len: 10 }),
  M('M10', 'Kül Runası Asası', 23, 'R', 'two', [85, 109], ['ash_hunter', 'craft'], { type: 'staff', shaft: '#4a3a34', head: 'star', orb: '#ff6a2a', len: 16 }),
  M('M11', 'Korun Sesi', 25, 'E', 'two', [105, 132], ['ash_giant'], { type: 'staff', shaft: '#2a1a1a', head: 'flame', orb: '#ffd060', len: 17, glow: '#ff7a2a' }, { unique: true }),
  M('M12', 'Ayaz Mührü', 28, 'R', 'one', [116, 147], ['snow_shaman'], { type: 'wand', shaft: '#d8e8f0', head: 'crystal', orb: '#9fe8ff', len: 11 }),
  M('M13', 'Sonsuz Kış Asası', 30, 'L', 'two', [158, 196], ['frozen_guardian'], { type: 'staff', shaft: '#e0f4ff', head: 'crystal', orb: '#ffffff', len: 18, glow: '#9fe8ff' },
    { unique: true, legendaryFixed: { int: 18, mp: 75 }, effect: 'endless_winter' }),
  // Yardımcı el (4)
  A('O07', 'Kül Siperi', 'offhand', 'warrior', 22, 'R', { def: 30 }, { hp: 30 }, ['burnt_warrior'], { type: 'shield', main: '#4a4040', rim: '#2a2222', boss: '#ff7a2a' }),
  A('O08', 'Buz Kalesi Kalkanı', 'offhand', 'warrior', 27, 'E', { def: 43 }, { hp: 65 }, ['ice_warden', 'craft'], { type: 'shield', main: '#9ac8e0', rim: '#4a6a8a', boss: '#e0faff' }),
  A('O09', 'Köz Prizması', 'offhand', 'mage', 22, 'R', { mag: 22 }, { mp: 35 }, ['ash_hunter'], { type: 'focus', main: '#5a3a2a', orb: '#ff7a2a' }),
  A('O10', 'Ayaz Küresi', 'offhand', 'mage', 27, 'E', { mag: 33 }, { mp: 55 }, ['ice_warden', 'craft'], { type: 'mirror', main: '#c8e8f8', orb: '#7ad8ff' }),
  // Başlık (4)
  A('H07', 'Kül Muhafız Miğferi', 'helm', 'warrior', 22, 'U', { def: 16 }, {}, ['ash_hunter'], { type: 'greathelm', main: '#5a5050', trim: '#c85a2a' }),
  A('H08', 'Donmuş Çelik Miğferi', 'helm', 'warrior', 28, 'R', { def: 23 }, {}, ['frost_sentinel'], { type: 'helm', main: '#a8d0e8', trim: '#4a6a8a', horn: true }),
  A('H09', 'Köz Başlığı', 'helm', 'mage', 22, 'U', { def: 8, mdef: 14 }, {}, ['ash_imp'], { type: 'hood', main: '#5a2a1e', trim: '#ff8a3a' }),
  A('H10', 'Ayaz Tacı', 'helm', 'mage', 28, 'R', { def: 12, mdef: 24 }, {}, ['ice_wisp'], { type: 'hat', main: '#5a8ab0', trim: '#e0faff' }),
  // Göğüs (4)
  A('C09', 'Kızıl Zırh', 'chest', 'warrior', 23, 'R', { def: 44 }, { hp: 35 }, ['crimson_scorpion', 'craft'], { type: 'armor', main: '#8a2a22', trim: '#e0a040', tier: 2 }),
  A('C10', 'Donmuş Plaka', 'chest', 'warrior', 29, 'E', { def: 62 }, { hp: 70 }, ['ice_warden'], { type: 'armor', main: '#a8c8e0', trim: '#5ae0ff', tier: 4 }),
  A('C11', 'Kül Dokuma Cübbesi', 'chest', 'mage', 23, 'R', { def: 26, mdef: 38 }, {}, ['burnt_warrior', 'craft'], { type: 'robe', main: '#4a3a3a', trim: '#ff7a2a', tier: 2 }),
  A('C12', 'Buz İpliği Cübbesi', 'chest', 'mage', 29, 'E', { def: 33, mdef: 55 }, {}, ['ice_warden'], { type: 'robe', main: '#c8e0f0', trim: '#5a8ad0', tier: 4 }),
  // Eldiven (2)
  A('G07', 'Kor Eldivenleri', 'gloves', 'warrior', 26, 'R', { def: 14 }, { str: 3 }, ['burnt_warrior'], { type: 'gauntlet', main: '#5a3a30' }),
  A('G08', 'Ayaz Parmaklıkları', 'gloves', 'mage', 26, 'R', { def: 8, mdef: 14 }, { int: 3 }, ['frost_wolf'], { type: 'gloves', main: '#a8d0e8', gem: '#7ad8ff' }),
  // Bot (2)
  A('B07', 'Kül İzleri', 'boots', 'warrior', 27, 'R', { def: 13 }, { vit: 3 }, ['frost_wolf'], { type: 'greaves', main: '#4a4040' }),
  A('B08', 'Donmuş Adımlar', 'boots', 'mage', 27, 'R', { def: 9, mdef: 17 }, { mp: 35 }, ['ice_wisp'], { type: 'boots', main: '#8ab8d8' }),
  // Yüzük (2)
  A('R07', 'Kızıl Halka', 'ring', 'any', 24, 'R', {}, { str: 3, vit: 2 }, ['crimson_scorpion'], { type: 'ring', band: '#8a2a22', gem: '#ff6a3a' }),
  A('R08', 'Ayaz Yüzüğü', 'ring', 'any', 29, 'E', {}, { int: 4, mp: 65 }, ['ice_warden'], { type: 'ring', band: '#c8e0f0', gem: '#7ad8ff' }),
  // Kolye (2) — Kül Nişanı: Kül Devi; Kül Kasabı'nın Epic havuzunu da paylaşır (elit Epic havuzu boş kalmasın)
  A('A07', 'Kül Nişanı', 'amulet', 'any', 25, 'E', {}, { hp: 70, crit: 0.03 }, ['ash_giant', 'ash_butcher'], { type: 'medal', chain: '#5a4a40', gem: '#ff7a2a' }),
  A('A08', 'Kristal Kış Madalyonu', 'amulet', 'any', 30, 'E', {}, { mdef: 20, vit: 4 }, ['frozen_guardian'], { type: 'medal', chain: '#c8e0f0', gem: '#e0faff' }),

  // ================================================ V3.0 — KAYIP KRALLIĞIN MİRASI (36, Lv.31–40)
  // Kaynaklar: normal yaratık (kanonik Rare/U), elit (Epic %0,75 havuzu), boss (Komutan: 2 özel Epic silah; Kral: Epic + 2 Legendary)
  // ve 'craft' (Demirci / Muhafız Eren). Legendary yalnız Kayıp Kral'ın Legendary havuzunda.
  // Warrior silahları (6)
  W('W14', 'Mezar Kılıcı', 31, 'U', 'one', [128, 157], ['shroud_crawler'], { type: 'sword', blade: '#a8a4b0', guard: '#5a5462', grip: '#2a2430', len: 12, gem: '#c080ff' }),
  W('W15', 'Lanet Biçici', 33, 'R', 'two', [161, 202], ['cursed_guard', 'craft'], { type: 'machete', blade: '#7a8a7a', guard: '#3a3a34', grip: '#2a2420', len: 14, gem: '#9ae08a' }),
  W('W16', 'Komutanın İnfazı', 35, 'E', 'two', [198, 247], ['grave_commander'], { type: 'greatsword', blade: '#b8b8c8', guard: '#b8903a', grip: '#2a1e24', len: 16, gem: '#c080ff' }, { unique: true }),
  W('W17', 'Obsidyen Kılıç', 37, 'R', 'one', [210, 258], ['obsidian_sentinel'], { type: 'sword', blade: '#2a2434', guard: '#6a5a82', grip: '#14101a', len: 13, gem: '#a070e0' }),
  W('W18', 'Gölge Satırı', 39, 'E', 'two', [265, 319], ['lost_king', 'obsidian_executioner'], { type: 'axe', blade: '#3a3446', guard: '#a070e0', grip: '#14101a', len: 15, gem: '#e0c8ff', glow: '#a070e0' }, { unique: true }),
  W('W19', 'Kralın Son Emri', 40, 'L', 'two', [315, 380], ['lost_king'], { type: 'greatsword', blade: '#1e1428', guard: '#c8a050', grip: '#14101a', len: 18, gem: '#e0c8ff', glow: '#a070e0' },
    { unique: true, legendaryFixed: { str: 22, crit: 0.08 }, effect: 'kings_command' }),
  // Mage silahları (6)
  M('M14', 'Mezar Kıvılcımı', 31, 'U', 'one', [135, 170], ['bone_archer'], { type: 'wand', shaft: '#5a5462', head: 'skull', orb: '#c080ff', len: 10 }),
  M('M15', 'Kemik Asası', 33, 'R', 'two', [172, 211], ['grave_mage', 'craft'], { type: 'staff', shaft: '#d8d0bc', head: 'skull', orb: '#a070e0', len: 16 }),
  M('M16', 'Ruh Zinciri Asası', 35, 'E', 'two', [215, 266], ['grave_commander'], { type: 'staff', shaft: '#4a4a52', head: 'star', orb: '#9ad8e8', len: 17, glow: '#9ad8e8' }, { unique: true }),
  M('M17', 'Siyah Dua Değneği', 37, 'R', 'one', [225, 281], ['void_priest'], { type: 'wand', shaft: '#1e1428', head: 'orb', orb: '#a070e0', len: 11 }),
  M('M18', 'Taht Asası', 39, 'E', 'two', [280, 341], ['lost_king', 'obsidian_executioner'], { type: 'staff', shaft: '#26202e', head: 'crystal', orb: '#e0c8ff', len: 17, glow: '#a070e0' }, { unique: true }),
  M('M19', 'Sonsuz Hüküm', 40, 'L', 'two', [340, 410], ['lost_king'], { type: 'staff', shaft: '#c8a050', head: 'flame', orb: '#e0c8ff', len: 18, glow: '#c080ff' },
    { unique: true, legendaryFixed: { int: 24, mp: 120 }, effect: 'eternal_verdict' }),
  // Yardımcı el (4)
  A('O11', 'Ölü Nöbet Kalkanı', 'offhand', 'warrior', 32, 'R', { def: 50 }, { hp: 70 }, ['cursed_guard'], { type: 'shield', main: '#5a5a52', rim: '#3a3a34', boss: '#9ae08a' }),
  A('O12', 'Obsidyen Duvarı', 'offhand', 'warrior', 38, 'E', { def: 72 }, { hp: 110 }, ['obsidian_executioner', 'craft'], { type: 'shield', main: '#26202e', rim: '#46405a', boss: '#a070e0' }),
  A('O13', 'Ruh Aynası', 'offhand', 'mage', 32, 'R', { mag: 40 }, { mp: 60 }, ['grave_mage'], { type: 'mirror', main: '#8a8494', orb: '#9ad8e8' }),
  A('O14', 'Hiçlik Odağı', 'offhand', 'mage', 38, 'E', { mag: 60 }, { mp: 100 }, ['obsidian_executioner', 'craft'], { type: 'focus', main: '#1e1428', orb: '#a070e0' }),
  // Başlık (4)
  A('H11', 'Yas Miğferi', 'helm', 'warrior', 32, 'R', { def: 30 }, {}, ['bone_archer'], { type: 'greathelm', main: '#6a6670', trim: '#3a3446' }),
  A('H12', 'Taht Miğferi', 'helm', 'warrior', 38, 'E', { def: 44 }, {}, ['obsidian_executioner'], { type: 'helm', main: '#26202e', trim: '#c8a050', horn: true }),
  A('H13', 'Kefen Başlığı', 'helm', 'mage', 32, 'R', { def: 17, mdef: 32 }, {}, ['shroud_crawler'], { type: 'hood', main: '#b8b0a0', trim: '#6a6458' }),
  A('H14', 'Gece Tacı', 'helm', 'mage', 38, 'E', { def: 23, mdef: 47 }, {}, ['obsidian_executioner'], { type: 'hat', main: '#1e1428', trim: '#c8a050' }),
  // Göğüs (4)
  A('C13', 'Yas Zırhı', 'chest', 'warrior', 33, 'R', { def: 80 }, { hp: 90 }, ['cursed_guard', 'craft'], { type: 'armor', main: '#4a4a52', trim: '#8a7a4a', tier: 4 }),
  A('C14', 'Kralın Muhafız Zırhı', 'chest', 'warrior', 39, 'E', { def: 112 }, { hp: 150 }, ['lost_king', 'obsidian_executioner'], { type: 'armor', main: '#26202e', trim: '#c8a050', tier: 4 }),
  A('C15', 'Ruh Dokuma Cübbesi', 'chest', 'mage', 33, 'R', { def: 45, mdef: 63 }, {}, ['grave_mage', 'craft'], { type: 'robe', main: '#3a2a4a', trim: '#9ad8e8', tier: 2 }),
  A('C16', 'Kara Taht Cübbesi', 'chest', 'mage', 39, 'E', { def: 58, mdef: 90 }, {}, ['lost_king', 'obsidian_executioner'], { type: 'robe', main: '#1e1428', trim: '#c8a050', tier: 4 }),
  // Eldiven (2)
  A('G09', 'Mezar Eldivenleri', 'gloves', 'warrior', 36, 'R', { def: 20 }, { str: 4 }, ['obsidian_sentinel'], { type: 'gauntlet', main: '#4a4a52' }),
  A('G10', 'Ruh Eldivenleri', 'gloves', 'mage', 36, 'R', { def: 14, mdef: 20 }, { int: 4 }, ['shadow_hunter'], { type: 'gloves', main: '#3a2a4a', gem: '#9ad8e8' }),
  // Bot (2)
  A('B09', 'Obsidyen Adımlar', 'boots', 'warrior', 36, 'R', { def: 19 }, { vit: 4 }, ['shadow_hunter'], { type: 'greaves', main: '#26202e' }),
  A('B10', 'Sessiz Adımlar', 'boots', 'mage', 36, 'R', { def: 13, mdef: 25 }, { mp: 55 }, ['throne_executioner'], { type: 'boots', main: '#2a2434' }),
  // Yüzük (4)
  A('R09', 'Mezar Halkası', 'ring', 'any', 32, 'R', {}, { vit: 4 }, ['shroud_crawler'], { type: 'ring', band: '#6a6670', gem: '#c080ff' }),
  A('R10', 'Komutan Yüzüğü', 'ring', 'any', 35, 'E', {}, { str: 4, dex: 4 }, ['grave_commander', 'shroud_hunter'], { type: 'ring', band: '#b8903a', gem: '#e0d8c4' }),
  A('R11', 'Hiçlik Yüzüğü', 'ring', 'any', 37, 'R', {}, { int: 5, mp: 85 }, ['void_priest'], { type: 'ring', band: '#26202e', gem: '#a070e0' }),
  A('R12', 'Kraliyet Yüzüğü', 'ring', 'any', 40, 'E', {}, { crit: 0.05, hp: 100 }, ['lost_king'], { type: 'ring', band: '#c8a050', gem: '#ff6a6a' }),
  // Kolye (4)
  A('A09', 'Yas Tılsımı', 'amulet', 'any', 32, 'R', {}, { hp: 70, mdef: 15 }, ['cursed_guard'], { type: 'amulet', chain: '#6a6670', gem: '#e0d8c4' }),
  A('A10', 'Lanet Kıran Kolye', 'amulet', 'any', 35, 'E', {}, { crit: 0.04, mdef: 30 }, ['grave_commander', 'shroud_hunter'], { type: 'medal', chain: '#b8903a', gem: '#9ae08a' }),
  A('A11', 'Obsidyen Muska', 'amulet', 'any', 38, 'R', {}, { vit: 5, hp: 100 }, ['throne_executioner'], { type: 'amulet', chain: '#26202e', gem: '#a070e0' }),
  A('A12', 'Kayıp Taç Madalyonu', 'amulet', 'any', 40, 'E', {}, { vit: 5, mp: 100, mdef: 45 }, ['lost_king'], { type: 'medal', chain: '#c8a050', gem: '#e0c8ff' }),

  // ================================================ V4.0 — GÖKYARIK (84)
  // Okçu yayları (14): temel Lv.1/5/10/15/20/25/30/35/40/45 + boss Legendary Lv.20/30/40/50 (yalnız Legendary havuzlarından).
  // Y10/K10 Lv.45 Uncommon temel şablondur: Gökyarık yaratıklarının N/U/R varyant havuzu bunlarla dolar.
  Y('Y01', 'Köy Yayı', 1, 'N', [5, 8], ['starter', 'merchant'], { wood: '#8a6238', string: '#e8e0c8', len: 13 }),
  Y('Y02', 'Avcı Yayı', 5, 'U', [14, 19], ['gray_wolf', 'craft'], { wood: '#6a4a2a', string: '#e8e0c8', len: 14, grip: '#4f6b3a' }),
  Y('Y03', 'Maden Yayı', 10, 'R', [29, 38], ['pick_goblin'], { wood: '#5a5a66', string: '#d8d8e0', len: 14, gem: '#4f9bff' }),
  Y('Y04', 'Kızıl Damar Yayı', 15, 'E', [47, 61], ['red_vein_watcher'], { wood: '#7a2a22', string: '#ffd0a0', len: 15, gem: '#ff6a5a' }, { unique: true }),
  Y('Y05', 'Bataklık Yayı', 20, 'R', [60, 77], ['rotten_guard', 'craft'], { wood: '#4f6a52', string: '#c8e0c0', len: 15, gem: '#6ad08a' }),
  Y('Y06', 'Kor Yayı', 25, 'E', [92, 118], ['ash_giant', 'ash_butcher'], { wood: '#3a2a24', string: '#ffb070', len: 16, gem: '#ff8a3a', glow: '#ff7a2a' }, { unique: true }),
  Y('Y07', 'Ayaz Yayı', 30, 'R', [118, 150], ['snow_shaman', 'craft'], { wood: '#a8c8e0', string: '#ffffff', len: 16, gem: '#7ad8ff' }),
  Y('Y08', 'Mezar Avcısı Yayı', 35, 'E', [185, 232], ['grave_commander', 'shroud_hunter'], { wood: '#4a4a52', string: '#e0d8c4', len: 16, gem: '#c080ff' }, { unique: true }),
  Y('Y09', 'Obsidyen Yay', 40, 'R', [235, 290], ['void_priest'], { wood: '#26202e', string: '#c8a0ff', len: 17, gem: '#a070e0' }),
  Y('Y10', 'Fırtına Yayı', 45, 'U', [300, 368], ['astral_hunter'], { wood: '#3a4a6a', string: '#ffe070', len: 17, gem: '#9ad0ff' }),
  Y('Y11', 'Cevher Yayı', 20, 'L', [86, 110], ['mine_golem'], { wood: '#6e7280', string: '#b0f0ff', len: 17, gem: '#5ae0ff', glow: '#5ae0ff' },
    { unique: true, legendaryFixed: { dex: 14, crit: 0.06 }, effect: 'ore_volley' }),
  Y('Y12', 'Ayaz Avcısı Yayı', 30, 'L', [142, 178], ['frozen_guardian'], { wood: '#c8f0ff', string: '#ffffff', len: 18, gem: '#ffffff', glow: '#7ad8ff' },
    { unique: true, legendaryFixed: { dex: 16, crit: 0.06 }, effect: 'frost_hunt' }),
  Y('Y13', 'Kral Avcısı Yayı', 40, 'L', [300, 362], ['lost_king'], { wood: '#1e1428', string: '#e0c8ff', len: 18, gem: '#c8a050', glow: '#a070e0' },
    { unique: true, legendaryFixed: { dex: 22, crit: 0.06 }, effect: 'king_hunt' }),
  Y('Y14', 'Fırtına Yemini', 50, 'L', [432, 520], ['sky_prisoner'], { wood: '#2a3a6a', string: '#fff4b0', len: 19, gem: '#ffffff', glow: '#9ad0ff' },
    { unique: true, legendaryFixed: { dex: 28, crit: 0.07 }, effect: 'storm_oath' }),

  // Ölü Çağıran silahları (14): kemik asa, büyü kitabı, lanetli değnek, grimuar
  K('K01', 'Çırak Kemik Asası', 1, 'N', 'two', [5, 8], ['starter', 'merchant'], { type: 'staff', shaft: '#d8d0bc', head: 'skull', orb: '#8ad0a0', len: 15 }),
  K('K02', 'Mezar Değneği', 5, 'U', 'one', [12, 17], ['thorn_rootling', 'craft'], { type: 'wand', shaft: '#5a4a3a', head: 'skull', orb: '#9ae08a', len: 10 }),
  K('K03', 'Ruh Kitabı', 10, 'R', 'one', [29, 38], ['cave_bat'], { type: 'tome', cover: '#3a4a3a', page: '#e8e0c8', gem: '#8ad0a0' }),
  K('K04', 'Lanetli Grimuar', 15, 'E', 'two', [50, 63], ['red_vein_watcher'], { type: 'tome', cover: '#5a1e2a', page: '#e8d8c0', gem: '#ff6a5a', big: true }, { unique: true }),
  K('K05', 'Bataklık Kemik Asası', 20, 'R', 'two', [62, 80], ['mist_witch', 'craft'], { type: 'staff', shaft: '#8a9a7a', head: 'skull', orb: '#6fe0c8', len: 16 }),
  K('K06', 'Kor Grimuarı', 25, 'E', 'two', [100, 126], ['ash_giant', 'ash_butcher'], { type: 'tome', cover: '#3a2420', page: '#ffd8a0', gem: '#ff8a3a', big: true, glow: '#ff7a2a' }, { unique: true }),
  K('K07', 'Ayaz Kemik Değneği', 30, 'R', 'one', [112, 140], ['ice_wisp', 'craft'], { type: 'wand', shaft: '#d8e8f0', head: 'skull', orb: '#9fe8ff', len: 11 }),
  K('K08', 'Komutanın Ruh Kitabı', 35, 'E', 'two', [195, 242], ['grave_commander', 'shroud_hunter'], { type: 'tome', cover: '#4a4a52', page: '#e0d8c4', gem: '#9ad8e8', big: true }, { unique: true }),
  K('K09', 'Hiçlik Grimuarı', 40, 'R', 'one', [215, 268], ['throne_executioner'], { type: 'tome', cover: '#1e1428', page: '#c8b8e0', gem: '#a070e0' }),
  K('K10', 'Yıldız Kemik Asası', 45, 'U', 'two', [300, 368], ['star_oracle'], { type: 'staff', shaft: '#e8e0c8', head: 'skull', orb: '#ffe8a0', len: 17 }),
  K('K11', 'Maden Ruhları Kitabı', 20, 'L', 'two', [92, 117], ['mine_golem'], { type: 'tome', cover: '#4a5a6a', page: '#e0f4ff', gem: '#5ae0ff', big: true, glow: '#5ae0ff' },
    { unique: true, legendaryFixed: { int: 16, mp: 60 }, effect: 'mine_souls' }),
  K('K12', 'Donmuş Kemikler Kitabı', 30, 'L', 'two', [150, 186], ['frozen_guardian'], { type: 'tome', cover: '#a8c8e0', page: '#ffffff', gem: '#7ad8ff', big: true, glow: '#9fe8ff' },
    { unique: true, legendaryFixed: { int: 18, mp: 75 }, effect: 'frozen_bones' }),
  K('K13', 'Kayıp Ruhlar Kitabı', 40, 'L', 'two', [322, 390], ['lost_king'], { type: 'tome', cover: '#26202e', page: '#e0c8ff', gem: '#c8a050', big: true, glow: '#c080ff' },
    { unique: true, legendaryFixed: { int: 24, mp: 120 }, effect: 'lost_souls' }),
  K('K14', 'Ruhların Son Çağrısı', 50, 'L', 'two', [460, 552], ['sky_prisoner'], { type: 'staff', shaft: '#e8e0c8', head: 'skull', orb: '#b0a0ff', len: 19, glow: '#b0a0ff' },
    { unique: true, legendaryFixed: { int: 30, mp: 160 }, effect: 'last_call' }),

  // Okçu zırhları (16): hafif deri / avcı — başlık, göğüs, eldiven, bot (Lv.1–5, ~15, ~30, ~45)
  A('YH01', 'Avcı Başlığı', 'helm', 'archer', 1, 'N', { def: 2, mdef: 1 }, {}, ['starter', 'merchant'], { type: 'hood', main: '#5a6a3a', trim: '#3a4020' }),
  A('YH02', 'İzci Kapişonu', 'helm', 'archer', 15, 'R', { def: 9, mdef: 4 }, {}, ['cave_bat'], { type: 'hood', main: '#4a5a3a', trim: '#c0a060' }),
  A('YH03', 'Ayaz İzcisi Başlığı', 'helm', 'archer', 30, 'R', { def: 20, mdef: 10 }, {}, ['frost_wolf'], { type: 'hood', main: '#a8c8d8', trim: '#4a6a8a' }),
  A('YH04', 'Fırtına Kartalı Başlığı', 'helm', 'archer', 45, 'E', { def: 40, mdef: 22 }, {}, ['storm_executioner', 'sky_prisoner'], { type: 'hood', main: '#3a4a6a', trim: '#ffe070' }),
  A('YC01', 'Deri Yelek', 'chest', 'archer', 1, 'N', { def: 4, mdef: 1 }, {}, ['starter', 'merchant'], { type: 'armor', main: '#8a6a44', trim: '#4f6b3a', tier: 0 }),
  A('YC02', 'İzci Yeleği', 'chest', 'archer', 15, 'R', { def: 16, mdef: 6 }, {}, ['ironshell_beetle', 'craft'], { type: 'armor', main: '#5a6a3a', trim: '#8a6a44', tier: 1 }),
  A('YC03', 'Ayaz Avcısı Zırhı', 'chest', 'archer', 30, 'R', { def: 42, mdef: 18 }, { hp: 50 }, ['frost_sentinel', 'craft'], { type: 'armor', main: '#8ab0c8', trim: '#e0f0ff', tier: 2 }),
  A('YC04', 'Gökyarık Avcı Zırhı', 'chest', 'archer', 45, 'E', { def: 100, mdef: 45 }, { hp: 120 }, ['storm_tyrant', 'storm_executioner'], { type: 'armor', main: '#3a4a6a', trim: '#ffe070', tier: 4 }),
  A('YG01', 'Okçu Bilekliği', 'gloves', 'archer', 3, 'N', { def: 1 }, {}, ['merchant', 'meadow_rat'], { type: 'gloves', main: '#8a6a44' }),
  A('YG02', 'Gergin Kiriş Eldiveni', 'gloves', 'archer', 15, 'U', { def: 4 }, { dex: 1 }, ['swamp_leech'], { type: 'gloves', main: '#5a6a3a' }),
  A('YG03', 'Akrep Derisi Eldiven', 'gloves', 'archer', 30, 'R', { def: 11, mdef: 4 }, { dex: 3 }, ['crimson_scorpion'], { type: 'gloves', main: '#9a3a2a' }),
  A('YG04', 'Hiçlik Avcısı Eldiveni', 'gloves', 'archer', 45, 'E', { def: 20, mdef: 10 }, { dex: 5 }, ['void_warden'], { type: 'gloves', main: '#2a2440', gem: '#b0a0ff' }),
  A('YB01', 'Patika Çizmesi', 'boots', 'archer', 5, 'U', { def: 3 }, {}, ['gray_wolf'], { type: 'boots', main: '#6a4a2a' }),
  A('YB02', 'Sessiz Adım Çizmesi', 'boots', 'archer', 15, 'R', { def: 6 }, { dex: 1 }, ['mud_dwarf'], { type: 'boots', main: '#4f5a3a' }),
  A('YB03', 'Kar İzi Çizmesi', 'boots', 'archer', 30, 'R', { def: 12, mdef: 6 }, { vit: 3 }, ['ice_wisp'], { type: 'boots', main: '#8ab0c8' }),
  A('YB04', 'Fırtına Koşucusu Çizmesi', 'boots', 'archer', 45, 'E', { def: 22, mdef: 12 }, { vit: 5 }, ['void_warden', 'craft'], { type: 'boots', main: '#3a4a6a' }),

  // Ölü Çağıran zırhları (16): karanlık kumaş / ritüel
  A('KH01', 'Ritüel Başlığı', 'helm', 'necromancer', 1, 'N', { def: 1, mdef: 2 }, {}, ['starter', 'merchant'], { type: 'hood', main: '#3a3a3a', trim: '#8ad0a0' }),
  A('KH02', 'Mezar Kukuletası', 'helm', 'necromancer', 15, 'R', { def: 5, mdef: 9 }, {}, ['ore_priest'], { type: 'hood', main: '#2e3a2e', trim: '#9ae08a' }),
  A('KH03', 'Kar Ruhu Başlığı', 'helm', 'necromancer', 30, 'R', { def: 12, mdef: 25 }, {}, ['snow_shaman'], { type: 'hood', main: '#c8d8e0', trim: '#5a7a9a' }),
  A('KH04', 'Hiçlik Ritüel Tacı', 'helm', 'necromancer', 45, 'E', { def: 26, mdef: 55 }, {}, ['void_warden', 'sky_prisoner'], { type: 'hat', main: '#1e1428', trim: '#b0a0ff' }),
  A('KC01', 'Ölü Çağıran Cübbesi', 'chest', 'necromancer', 1, 'N', { def: 2, mdef: 3 }, {}, ['starter', 'merchant'], { type: 'robe', main: '#2e3030', trim: '#8ad0a0', tier: 0 }),
  A('KC02', 'Mezar Dokuma Cübbesi', 'chest', 'necromancer', 15, 'R', { def: 11, mdef: 17 }, {}, ['swamp_leech', 'craft'], { type: 'robe', main: '#2a3a2e', trim: '#9ae08a', tier: 1 }),
  A('KC03', 'Donmuş Ritüel Cübbesi', 'chest', 'necromancer', 30, 'R', { def: 32, mdef: 52 }, {}, ['ice_wisp', 'craft'], { type: 'robe', main: '#3a4a5a', trim: '#9fe8ff', tier: 2 }),
  A('KC04', 'Yıldız Ritüeli Cübbesi', 'chest', 'necromancer', 45, 'E', { def: 70, mdef: 110 }, { mp: 120 }, ['storm_tyrant', 'void_warden'], { type: 'robe', main: '#1e1a2e', trim: '#b0a0ff', tier: 4 }),
  A('KG01', 'Kefen Sargısı', 'gloves', 'necromancer', 3, 'N', { def: 1 }, {}, ['merchant', 'meadow_rat'], { type: 'gloves', main: '#c8c0a8' }),
  A('KG02', 'Mezar Eldiveni', 'gloves', 'necromancer', 15, 'U', { def: 2 }, { mp: 10 }, ['mud_dwarf'], { type: 'gloves', main: '#3a4a3a', gem: '#9ae08a' }),
  A('KG03', 'Kor Ritüel Eldiveni', 'gloves', 'necromancer', 30, 'R', { def: 8, mdef: 14 }, { int: 3 }, ['burnt_warrior'], { type: 'gloves', main: '#4a3a3a', gem: '#ff8a3a' }),
  A('KG04', 'Fırtına Ruhu Eldiveni', 'gloves', 'necromancer', 45, 'E', { def: 16, mdef: 26 }, { int: 5 }, ['storm_executioner'], { type: 'gloves', main: '#2a3450', gem: '#9ad0ff' }),
  A('KB01', 'Mezarcı Pabucu', 'boots', 'necromancer', 5, 'U', { def: 2 }, { mp: 10 }, ['meadow_rat'], { type: 'boots', main: '#3a3a3a' }),
  A('KB02', 'Sis Adımları', 'boots', 'necromancer', 15, 'R', { def: 4, mdef: 5 }, {}, ['cave_bat'], { type: 'boots', main: '#3a4a4a' }),
  A('KB03', 'Ayaz Kefeni Çizmesi', 'boots', 'necromancer', 30, 'R', { def: 9, mdef: 17 }, { mp: 35 }, ['frost_wolf'], { type: 'boots', main: '#8a9aa8' }),
  A('KB04', 'Ruh Yolcusu Çizmesi', 'boots', 'necromancer', 45, 'E', { def: 17, mdef: 32 }, { mp: 80 }, ['storm_executioner', 'craft'], { type: 'boots', main: '#2a2440' }),

  // Yardımcı el (8): Okçu sadağı (yay + sadak geçerli kombinasyon), Ölü Çağıran tılsımı/odağı/mührü
  A('YO01', 'Deri Sadak', 'offhand', 'archer', 1, 'N', { atkMin: 1, atkMax: 2 }, {}, ['merchant'], { type: 'quiver', main: '#8a6238', fletch: '#e0e0e0' }),
  A('YO02', 'Avcı Sadağı', 'offhand', 'archer', 12, 'U', { atkMin: 4, atkMax: 6 }, { dex: 1 }, ['pick_goblin'], { type: 'quiver', main: '#5a6a3a', fletch: '#c0a060' }),
  A('YO03', 'Kızıl Tüylü Sadak', 'offhand', 'archer', 25, 'R', { atkMin: 11, atkMax: 14 }, { crit: 0.02 }, ['ash_hunter'], { type: 'quiver', main: '#7a2a22', fletch: '#ff8a3a' }),
  A('YO04', 'Obsidyen Sadak', 'offhand', 'archer', 40, 'E', { atkMin: 22, atkMax: 28 }, { dex: 4, crit: 0.02 }, ['obsidian_executioner', 'craft'], { type: 'quiver', main: '#26202e', fletch: '#a070e0' }),
  A('KO01', 'Kemik Tılsımı', 'offhand', 'necromancer', 1, 'N', { mag: 3 }, {}, ['merchant'], { type: 'talisman', main: '#e8e0c8', orb: '#8ad0a0' }),
  A('KO02', 'Ruh Odağı', 'offhand', 'necromancer', 12, 'U', { mag: 10 }, { mp: 12 }, ['cave_bat'], { type: 'focus', main: '#3a4a3a', orb: '#9ae08a' }),
  A('KO03', 'Kor Mührü', 'offhand', 'necromancer', 25, 'R', { mag: 24 }, { mp: 40 }, ['crimson_scorpion'], { type: 'talisman', main: '#4a2a22', orb: '#ff8a3a' }),
  A('KO04', 'Hiçlik Kemik Mührü', 'offhand', 'necromancer', 40, 'E', { mag: 58 }, { mp: 100 }, ['obsidian_executioner', 'craft'], { type: 'talisman', main: '#26202e', orb: '#a070e0' }),

  // Warrior / Mage Lv.40–50 (8)
  W('W20', 'Fırtına Çeliği Kılıcı', 44, 'R', 'one', [282, 344], ['thunder_golem'], { type: 'sword', blade: '#c8d8f0', guard: '#3a4a6a', grip: '#1e2430', len: 13, gem: '#9ad0ff' }),
  W('W21', 'Gökyarık Baltası', 47, 'E', 'two', [372, 452], ['void_warden', 'sky_prisoner'], { type: 'axe', blade: '#b0a0ff', guard: '#2a2440', grip: '#14101a', len: 15, gem: '#ffe070', glow: '#9ad0ff' }, { unique: true }),
  W('W22', 'Göğün Hükmü', 50, 'L', 'two', [432, 520], ['sky_prisoner'], { type: 'greatsword', blade: '#e8f0ff', guard: '#ffe070', grip: '#1e2440', len: 19, gem: '#ffffff', glow: '#9ad0ff' },
    { unique: true, legendaryFixed: { str: 28, crit: 0.08 }, effect: 'sky_verdict' }),
  A('C17', 'Fırtına Hükümdarı Zırhı', 'chest', 'warrior', 46, 'E', { def: 150 }, { hp: 200 }, ['storm_tyrant', 'void_warden'], { type: 'armor', main: '#3a4a6a', trim: '#ffe070', tier: 4 }),
  M('M20', 'Çatlak Gök Değneği', 44, 'R', 'one', [296, 362], ['rift_wing'], { type: 'wand', shaft: '#3a4a6a', head: 'crystal', orb: '#9ad0ff', len: 11 }),
  M('M21', 'Yıldız Kâhini Asası', 47, 'E', 'two', [392, 476], ['void_warden', 'sky_prisoner'], { type: 'staff', shaft: '#2a2440', head: 'star', orb: '#ffe8a0', len: 18, glow: '#b0a0ff' }, { unique: true }),
  M('M22', 'Astral Kıyamet Asası', 50, 'L', 'two', [460, 556], ['sky_prisoner'], { type: 'staff', shaft: '#e8e0f8', head: 'star', orb: '#ffffff', len: 19, glow: '#b0a0ff' },
    { unique: true, legendaryFixed: { int: 30, mp: 160 }, effect: 'astral_doom' }),
  A('C18', 'Göğün Dokuma Cübbesi', 'chest', 'mage', 46, 'E', { def: 78, mdef: 120 }, { mp: 120 }, ['storm_tyrant', 'void_warden'], { type: 'robe', main: '#2a3a6a', trim: '#ffe070', tier: 4 }),

  // Dört sınıfa uygun aksesuarlar (4)
  A('R13', 'Fırtına Halkası', 'ring', 'any', 44, 'R', {}, { dex: 5, hp: 90 }, ['storm_hound'], { type: 'ring', band: '#3a4a6a', gem: '#9ad0ff' }),
  A('R14', 'Yıldız Yüzüğü', 'ring', 'any', 49, 'E', {}, { crit: 0.04, vit: 5, mp: 90 }, ['sky_prisoner', 'void_warden'], { type: 'ring', band: '#e8e0f8', gem: '#ffe8a0' }),
  A('A13', 'Gökyarık Tılsımı', 'amulet', 'any', 45, 'R', {}, { vit: 6, hp: 130 }, ['star_parasite'], { type: 'amulet', chain: '#3a4a6a', gem: '#b0a0ff' }),
  A('A14', 'Mahkûmun Madalyonu', 'amulet', 'any', 50, 'E', {}, { str: 5, dex: 5, int: 5, mdef: 45 }, ['sky_prisoner'], { type: 'medal', chain: '#c8c0e0', gem: '#ffffff' }),

  // İki yeni sınıfa özel ara seviye ekipman (4): Lv.28 ve Lv.43
  A('YH05', 'Kartal Gözü Başlığı', 'helm', 'archer', 28, 'R', { def: 18, mdef: 8 }, { crit: 0.02 }, ['burnt_warrior'], { type: 'hood', main: '#7a5a32', trim: '#ffd060' }),
  A('YC05', 'Fırtına Avcısı Yeleği', 'chest', 'archer', 43, 'E', { def: 88, mdef: 40 }, { dex: 4, hp: 90 }, ['storm_tyrant', 'craft'], { type: 'armor', main: '#4a5a7a', trim: '#9ad0ff', tier: 4 }),
  A('KG05', 'Kemik Parmaklık', 'gloves', 'necromancer', 28, 'R', { def: 8, mdef: 12 }, { int: 3 }, ['ash_hunter'], { type: 'gloves', main: '#d8d0bc', gem: '#8ad0a0' }),
  A('KH05', 'Ruh Tacı', 'helm', 'necromancer', 43, 'E', { def: 24, mdef: 52 }, { int: 4 }, ['storm_tyrant', 'craft'], { type: 'hat', main: '#2a2440', trim: '#9ad8e8' }),
];

export const ITEMS = Object.fromEntries(ITEM_LIST.map((t) => [t.id, t]));

// Kanonik N/U temel şablonlar düşük seviyeli havuzlarda N/U/R varyantı olabilir.
// Boss adı taşıyan, R/E/L kanonik eşyalar kanonik nadirliğinde kalır.
for (const t of ITEM_LIST) {
  t.allowedRarities = (t.rarity === 'N' || t.rarity === 'U') && !t.unique ? ['N', 'U', 'R'] : [t.rarity];
}

export function isTwoHanded(t) {
  return t.slot === 'weapon' && t.hand === 'two';
}

// V4: yay iki elle tutulur ama sadakla (yardımcı el) birlikte kullanılır — yalnız Okçu eşyası
export function isBow(t) {
  return t.slot === 'weapon' && t.hand === 'bow';
}

export function canClassUse(t, cls) {
  return t.cls === 'any' || t.cls === cls;
}

export function isUpgradeable(t) {
  return t.slot !== 'ring' && t.slot !== 'amulet';
}

// NPC tüccarın sattığı temel ekipman fiyatı (25–90 G, slot bazlı)
export const MERCHANT_PRICE = {
  weapon: 90, offhand: 45, helm: 35, chest: 55, gloves: 25, boots: 28, ring: 50, amulet: 50,
};

// V4: eşya sayıları (belge): 126 eski + 84 yeni = 210
export const V4_ITEM_IDS = ITEM_LIST.slice(126).map((t) => t.id);
