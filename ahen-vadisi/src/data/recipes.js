// Üretim tarifleri — belge §9.3. Her tarif: girdiler, gold ve tek bir çıktı.
// station: hangi NPC panelinde görünür (blacksmith = Demirci Boran, healer = Şifacı Elin)

export const RECIPES = [
  // İşleme (Demirci)
  { id: 'r_iron', station: 'blacksmith', name: 'Demir', out: { id: 'iron', qty: 1 }, gold: 10, inputs: [{ id: 'iron_ore', qty: 2 }] },
  { id: 'r_iron_scrap', station: 'blacksmith', name: 'Demir (Demir Parçasından)', out: { id: 'iron', qty: 1 }, gold: 10, inputs: [{ id: 'iron_scrap', qty: 3 }] },
  { id: 'r_iron_junk', station: 'blacksmith', name: 'Demir (Hurdadan)', out: { id: 'iron', qty: 1 }, gold: 10, inputs: [{ id: 'scrap', qty: 4 }] },
  { id: 'r_hardening', station: 'blacksmith', name: 'Sertleştirme Taşı', out: { id: 'hardening_stone', qty: 1 }, gold: 200, inputs: [{ id: 'hard_shell', qty: 3 }, { id: 'hard_ore', qty: 2 }] },
  { id: 'r_altar_crystal', station: 'blacksmith', name: 'Sunak Kristali', out: { id: 'altar_crystal', qty: 1 }, gold: 400, inputs: [{ id: 'altar_dust', qty: 4 }, { id: 'toxic_crystal', qty: 1 }] },
  { id: 'r_dust_weak', station: 'blacksmith', name: 'Sunak Tozu (Zayıf Özden)', out: { id: 'altar_dust', qty: 1 }, gold: 20, inputs: [{ id: 'weak_essence', qty: 3 }] },
  { id: 'r_dust_rare', station: 'blacksmith', name: 'Sunak Tozu (Nadir Özden)', out: { id: 'altar_dust', qty: 1 }, gold: 30, inputs: [{ id: 'rare_essence', qty: 1 }] },
  { id: 'r_dust_epic', station: 'blacksmith', name: 'Sunak Tozu ×3 (Epic Kalıntısından)', out: { id: 'altar_dust', qty: 3 }, gold: 50, inputs: [{ id: 'epic_remnant', qty: 1 }] },
  // Ekipman (Demirci)
  { id: 'r_w02', station: 'blacksmith', name: 'Avcı Palası', out: { id: 'W02', qty: 1, equip: true }, gold: 350, inputs: [{ id: 'hunter_cloth', qty: 6 }, { id: 'iron', qty: 4 }] },
  { id: 'r_m02', station: 'blacksmith', name: 'Kök Değneği', out: { id: 'M02', qty: 1, equip: true }, gold: 300, inputs: [{ id: 'root_essence', qty: 8 }, { id: 'hard_wood', qty: 4 }] },
  { id: 'r_c03', station: 'blacksmith', name: 'Madenci Zırhı', out: { id: 'C03', qty: 1, equip: true }, gold: 4000, inputs: [{ id: 'hard_shell', qty: 24 }, { id: 'iron', qty: 20 }] },
  { id: 'r_c07', station: 'blacksmith', name: 'Cevher Cübbesi', out: { id: 'C07', qty: 1, equip: true }, gold: 5000, inputs: [{ id: 'magic_ore', qty: 16 }, { id: 'hard_ore', qty: 8 }] },
  { id: 'r_w05', station: 'blacksmith', name: 'Gözcünün Baltası', out: { id: 'W05', qty: 1, equip: true }, gold: 12000, inputs: [{ id: 'watcher_seal', qty: 40 }, { id: 'hardening_stone', qty: 8 }] },
  // İksirler (Şifacı)
  { id: 'r_hp_s', station: 'healer', name: 'Küçük HP İksiri', out: { id: 'hp_s', qty: 1 }, gold: 5, inputs: [{ id: 'healing_herb', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_hp_m', station: 'healer', name: 'Orta HP İksiri', out: { id: 'hp_m', qty: 1 }, gold: 15, inputs: [{ id: 'healing_herb', qty: 3 }, { id: 'leech_essence', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_hp_l', station: 'healer', name: 'Büyük HP İksiri', out: { id: 'hp_l', qty: 1 }, gold: 35, inputs: [{ id: 'healing_herb', qty: 5 }, { id: 'leech_essence', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_mp_s', station: 'healer', name: 'Küçük MP İksiri', out: { id: 'mp_s', qty: 1 }, gold: 5, inputs: [{ id: 'mana_herb', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  // Orman alternatifi (belge §9.3 açık denge maddesi): erken MP erişimi
  { id: 'r_mp_s_forest', station: 'healer', name: 'Küçük MP İksiri (Orman tarifi)', out: { id: 'mp_s', qty: 1 }, gold: 8, inputs: [{ id: 'root_essence', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_mp_m', station: 'healer', name: 'Orta MP İksiri', out: { id: 'mp_m', qty: 1 }, gold: 15, inputs: [{ id: 'mana_herb', qty: 3 }, { id: 'bat_wing', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_mp_l', station: 'healer', name: 'Büyük MP İksiri', out: { id: 'mp_l', qty: 1 }, gold: 40, inputs: [{ id: 'mana_herb', qty: 5 }, { id: 'magic_ore', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
];

export const RECIPE_MAP = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Yükseltme tablosu — belge §9.4 (Rare silah taban ücreti)
export const UPGRADE_STEPS = [
  { to: 1, chance: 1.00, gold: 150, mats: [{ id: 'iron', qty: 2 }] },
  { to: 2, chance: 0.90, gold: 450, mats: [{ id: 'iron', qty: 4 }] },
  { to: 3, chance: 0.75, gold: 1200, mats: [{ id: 'hardening_stone', qty: 2 }] },
  { to: 4, chance: 0.55, gold: 3600, mats: [{ id: 'altar_crystal', qty: 1 }] },
  { to: 5, chance: 0.35, gold: 9000, mats: [{ id: 'ancient_core', qty: 1 }] },
];
// Normal/Uncommon eşyalarda +5 için Kadim Çekirdek yerine 3 Sunak Kristali (belgedeki alternatif kaynak kuralı)
export const UPGRADE_NU_FINAL = [{ id: 'altar_crystal', qty: 3 }];
export const UPGRADE_BONUS_PER_LEVEL = 0.06; // +1 → +%6 ... +5 → +%30 (temel değere toplamsal)
export const UPGRADE_SLOT_MULT = { weapon: 1, offhand: 0.6, helm: 0.5, chest: 0.7, gloves: 0.45, boots: 0.45 };
export const LOW_LEVEL_UPGRADE_MULT = 0.5; // Lv.1–9 eşyalar
