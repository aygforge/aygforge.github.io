// 60 ekipman şablonu (V1, belge §7) + 30 V2 şablonu (Kül ve Ayaz, Lv.21–30) = 90. Değerler +0 sabit temel değerlerdir.
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
