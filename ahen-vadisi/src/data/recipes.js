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
  // V2 işleme (Demirci) — eski materyaller de kullanılır (Demir, Sunak Tozu, Kadim Çekirdek)
  { id: 'r_ash_steel', station: 'blacksmith', name: 'Kül Çeliği', out: { id: 'ash_steel', qty: 1 }, gold: 40, inputs: [{ id: 'ash_ore', qty: 2 }, { id: 'iron', qty: 1 }] },
  { id: 'r_ash_steel_chain', station: 'blacksmith', name: 'Kül Çeliği (Yanık Zincirden)', out: { id: 'ash_steel', qty: 1 }, gold: 40, inputs: [{ id: 'burnt_chain', qty: 2 }, { id: 'ash_dust', qty: 2 }] },
  { id: 'r_frost_essence', station: 'blacksmith', name: 'Ayaz Özü', out: { id: 'frost_essence', qty: 1 }, gold: 250, inputs: [{ id: 'frost_crystal', qty: 2 }, { id: 'altar_dust', qty: 1 }] },
  { id: 'r_frost_essence_ice', station: 'blacksmith', name: 'Ayaz Özü (Saf Buzdan)', out: { id: 'frost_essence', qty: 1 }, gold: 250, inputs: [{ id: 'pure_ice', qty: 3 }, { id: 'altar_dust', qty: 1 }] },
  { id: 'r_ember_core', station: 'blacksmith', name: 'Kor Çekirdeği', out: { id: 'ember_core', qty: 1 }, gold: 3000, inputs: [{ id: 'giant_ember', qty: 3 }, { id: 'ancient_core', qty: 1 }] },
  { id: 'r_ember_core_frost', station: 'blacksmith', name: 'Kor Çekirdeği (Donmuş Çekirdekten)', out: { id: 'ember_core', qty: 1 }, gold: 3000, inputs: [{ id: 'frozen_core', qty: 1 }, { id: 'ancient_core', qty: 1 }] },
  // V2 ekipman (Demirci) — Rare ve Epic; Legendary üretilemez
  { id: 'r_w10', station: 'blacksmith', name: 'Akrep Biçici', out: { id: 'W10', qty: 1, equip: true }, gold: 9000, inputs: [{ id: 'scorpion_stinger', qty: 20 }, { id: 'ash_steel', qty: 10 }, { id: 'hardening_stone', qty: 2 }] },
  { id: 'r_m10', station: 'blacksmith', name: 'Kül Runası Asası', out: { id: 'M10', qty: 1, equip: true }, gold: 9000, inputs: [{ id: 'crimson_hide', qty: 18 }, { id: 'magic_ore', qty: 10 }, { id: 'ash_steel', qty: 6 }] },
  { id: 'r_c09', station: 'blacksmith', name: 'Kızıl Zırh', out: { id: 'C09', qty: 1, equip: true }, gold: 8000, inputs: [{ id: 'crimson_hide', qty: 14 }, { id: 'ash_steel', qty: 12 }, { id: 'hard_shell', qty: 6 }] },
  { id: 'r_c11', station: 'blacksmith', name: 'Kül Dokuma Cübbesi', out: { id: 'C11', qty: 1, equip: true }, gold: 8000, inputs: [{ id: 'ash_dust', qty: 20 }, { id: 'crimson_hide', qty: 10 }, { id: 'toxic_crystal', qty: 4 }] },
  { id: 'r_o08', station: 'blacksmith', name: 'Buz Kalesi Kalkanı', out: { id: 'O08', qty: 1, equip: true }, gold: 22000, inputs: [{ id: 'warden_seal', qty: 25 }, { id: 'ice_armor_shard', qty: 20 }, { id: 'golem_shard', qty: 4 }, { id: 'frost_essence', qty: 4 }] },
  { id: 'r_o10', station: 'blacksmith', name: 'Ayaz Küresi', out: { id: 'O10', qty: 1, equip: true }, gold: 22000, inputs: [{ id: 'warden_seal', qty: 25 }, { id: 'snow_seal', qty: 20 }, { id: 'watcher_seal', qty: 6 }, { id: 'frost_essence', qty: 4 }] },
  // V3 işleme (Demirci / Muhafız Eren) — V1/V2 materyalleri de kullanılır (Kül Çeliği, Demir, Sunak Tozu, Kadim Çekirdek)
  { id: 'r_dark_steel', station: 'blacksmith', name: 'Kara Çelik', out: { id: 'dark_steel', qty: 1 }, gold: 70, inputs: [{ id: 'dark_ore', qty: 2 }, { id: 'ash_steel', qty: 1 }] },
  { id: 'r_dark_steel_metal', station: 'blacksmith', name: 'Kara Çelik (Lanetli Metalden)', out: { id: 'dark_steel', qty: 1 }, gold: 70, inputs: [{ id: 'cursed_metal', qty: 2 }, { id: 'iron', qty: 2 }] },
  { id: 'r_soul_essence', station: 'blacksmith', name: 'Ruh Özü', out: { id: 'soul_essence', qty: 1 }, gold: 400, inputs: [{ id: 'soul_crystal', qty: 2 }, { id: 'altar_dust', qty: 1 }] },
  { id: 'r_soul_essence_shadow', station: 'blacksmith', name: 'Ruh Özü (Gölge Özünden)', out: { id: 'soul_essence', qty: 1 }, gold: 400, inputs: [{ id: 'shadow_essence', qty: 2 }, { id: 'grave_dust', qty: 1 }, { id: 'altar_dust', qty: 1 }] },
  { id: 'r_throne_core', station: 'blacksmith', name: 'Taht Çekirdeği', out: { id: 'throne_core', qty: 1 }, gold: 5000, inputs: [{ id: 'commander_crest', qty: 2 }, { id: 'void_crystal', qty: 3 }, { id: 'ancient_core', qty: 1 }] },
  { id: 'r_throne_core_crown', station: 'blacksmith', name: 'Taht Çekirdeği (Kırık Taçtan)', out: { id: 'throne_core', qty: 1 }, gold: 5000, inputs: [{ id: 'crown_shard', qty: 1 }, { id: 'executioner_chain', qty: 3 }, { id: 'ancient_core', qty: 1 }] },
  // V3 ekipman — Rare ve Epic; Legendary üretilemez (Kırık Taç Parçası yalnız Epic tariflerinde)
  { id: 'r_w15', station: 'blacksmith', name: 'Lanet Biçici', out: { id: 'W15', qty: 1, equip: true }, gold: 16000, inputs: [{ id: 'cursed_metal', qty: 20 }, { id: 'bone_tip', qty: 10 }, { id: 'dark_steel', qty: 8 }, { id: 'hardening_stone', qty: 2 }] },
  { id: 'r_m15', station: 'blacksmith', name: 'Kemik Asası', out: { id: 'M15', qty: 1, equip: true }, gold: 16000, inputs: [{ id: 'grave_dust', qty: 18 }, { id: 'bone_tip', qty: 12 }, { id: 'soul_crystal', qty: 6 }, { id: 'magic_ore', qty: 6 }] },
  { id: 'r_c13', station: 'blacksmith', name: 'Yas Zırhı', out: { id: 'C13', qty: 1, equip: true }, gold: 14000, inputs: [{ id: 'cursed_metal', qty: 16 }, { id: 'dark_steel', qty: 10 }, { id: 'ash_steel', qty: 8 }] },
  { id: 'r_c15', station: 'blacksmith', name: 'Ruh Dokuma Cübbesi', out: { id: 'C15', qty: 1, equip: true }, gold: 14000, inputs: [{ id: 'shroud_cloth', qty: 20 }, { id: 'grave_dust', qty: 10 }, { id: 'frost_essence', qty: 2 }] },
  { id: 'r_o12', station: 'blacksmith', name: 'Obsidyen Duvarı', out: { id: 'O12', qty: 1, equip: true }, gold: 38000, inputs: [{ id: 'executioner_seal', qty: 25 }, { id: 'obsidian_shard', qty: 20 }, { id: 'obsidian_ore', qty: 10 }, { id: 'crown_shard', qty: 1 }] },
  { id: 'r_o14', station: 'blacksmith', name: 'Hiçlik Odağı', out: { id: 'O14', qty: 1, equip: true }, gold: 38000, inputs: [{ id: 'executioner_seal', qty: 25 }, { id: 'void_crystal', qty: 18 }, { id: 'soul_essence', qty: 4 }, { id: 'crown_shard', qty: 1 }] },
  { id: 'r_w05', station: 'blacksmith', name: 'Gözcünün Baltası', out: { id: 'W05', qty: 1, equip: true }, gold: 12000, inputs: [{ id: 'watcher_seal', qty: 40 }, { id: 'hardening_stone', qty: 8 }] },
  // V4: yeni sınıfların erken ve orta seviye ekipmanı — eski bölge materyalleriyle (orman/maden/bataklık/kül/ayaz)
  { id: 'r_y02', station: 'blacksmith', name: 'Avcı Yayı', out: { id: 'Y02', qty: 1, equip: true }, gold: 320, inputs: [{ id: 'hard_wood', qty: 6 }, { id: 'hunter_cloth', qty: 4 }, { id: 'iron', qty: 2 }] },
  { id: 'r_k02', station: 'blacksmith', name: 'Mezar Değneği', out: { id: 'K02', qty: 1, equip: true }, gold: 300, inputs: [{ id: 'root_essence', qty: 6 }, { id: 'wolf_tooth', qty: 4 }] },
  { id: 'r_yc02', station: 'blacksmith', name: 'İzci Yeleği', out: { id: 'YC02', qty: 1, equip: true }, gold: 3500, inputs: [{ id: 'hard_shell', qty: 12 }, { id: 'hunter_cloth', qty: 10 }, { id: 'iron', qty: 8 }] },
  { id: 'r_kc02', station: 'blacksmith', name: 'Mezar Dokuma Cübbesi', out: { id: 'KC02', qty: 1, equip: true }, gold: 3500, inputs: [{ id: 'leech_essence', qty: 10 }, { id: 'magic_ore', qty: 8 }, { id: 'swamp_mud', qty: 6 }] },
  { id: 'r_y05', station: 'blacksmith', name: 'Bataklık Yayı', out: { id: 'Y05', qty: 1, equip: true }, gold: 6000, inputs: [{ id: 'hard_wood', qty: 10 }, { id: 'toxic_crystal', qty: 6 }, { id: 'iron', qty: 12 }, { id: 'hardening_stone', qty: 1 }] },
  { id: 'r_k05', station: 'blacksmith', name: 'Bataklık Kemik Asası', out: { id: 'K05', qty: 1, equip: true }, gold: 6000, inputs: [{ id: 'toxic_crystal', qty: 10 }, { id: 'magic_ore', qty: 8 }, { id: 'leech_essence', qty: 6 }] },
  { id: 'r_y07', station: 'blacksmith', name: 'Ayaz Yayı', out: { id: 'Y07', qty: 1, equip: true }, gold: 11000, inputs: [{ id: 'frost_pelt', qty: 16 }, { id: 'pure_ice', qty: 8 }, { id: 'ash_steel', qty: 8 }, { id: 'hardening_stone', qty: 2 }] },
  { id: 'r_k07', station: 'blacksmith', name: 'Ayaz Kemik Değneği', out: { id: 'K07', qty: 1, equip: true }, gold: 11000, inputs: [{ id: 'pure_ice', qty: 16 }, { id: 'snow_seal', qty: 8 }, { id: 'magic_ore', qty: 6 }] },
  { id: 'r_yc03', station: 'blacksmith', name: 'Ayaz Avcısı Zırhı', out: { id: 'YC03', qty: 1, equip: true }, gold: 9000, inputs: [{ id: 'frost_pelt', qty: 14 }, { id: 'ice_armor_shard', qty: 10 }, { id: 'ash_steel', qty: 8 }] },
  { id: 'r_kc03', station: 'blacksmith', name: 'Donmuş Ritüel Cübbesi', out: { id: 'KC03', qty: 1, equip: true }, gold: 9000, inputs: [{ id: 'pure_ice', qty: 14 }, { id: 'snow_seal', qty: 8 }, { id: 'crimson_hide', qty: 6 }] },
  { id: 'r_yo04', station: 'blacksmith', name: 'Obsidyen Sadak', out: { id: 'YO04', qty: 1, equip: true }, gold: 38000, inputs: [{ id: 'executioner_seal', qty: 25 }, { id: 'obsidian_shard', qty: 16 }, { id: 'shadow_essence', qty: 10 }, { id: 'crown_shard', qty: 1 }] },
  { id: 'r_ko04', station: 'blacksmith', name: 'Hiçlik Kemik Mührü', out: { id: 'KO04', qty: 1, equip: true }, gold: 38000, inputs: [{ id: 'executioner_seal', qty: 25 }, { id: 'void_crystal', qty: 16 }, { id: 'soul_essence', qty: 4 }, { id: 'crown_shard', qty: 1 }] },
  // V4 işleme — V3 materyalleri de kullanılır (Kara Çelik, Sunak Tozu, Kadim Çekirdek)
  { id: 'r_storm_steel', station: 'blacksmith', name: 'Fırtına Çeliği', out: { id: 'storm_steel', qty: 1 }, gold: 90, inputs: [{ id: 'storm_ore', qty: 2 }, { id: 'dark_steel', qty: 1 }] },
  { id: 'r_storm_steel_shard', station: 'blacksmith', name: 'Fırtına Çeliği (Şimşek Parçasından)', out: { id: 'storm_steel', qty: 1 }, gold: 90, inputs: [{ id: 'lightning_shard', qty: 2 }, { id: 'storm_pelt', qty: 1 }, { id: 'iron', qty: 2 }] },
  { id: 'r_astral_essence', station: 'blacksmith', name: 'Astral Öz', out: { id: 'astral_essence', qty: 1 }, gold: 550, inputs: [{ id: 'astral_crystal', qty: 2 }, { id: 'altar_dust', qty: 1 }] },
  { id: 'r_astral_essence_star', station: 'blacksmith', name: 'Astral Öz (Yıldız Özünden)', out: { id: 'astral_essence', qty: 1 }, gold: 550, inputs: [{ id: 'star_essence', qty: 2 }, { id: 'meteor_dust', qty: 1 }, { id: 'altar_dust', qty: 1 }] },
  { id: 'r_sky_core', station: 'blacksmith', name: 'Gök Çekirdeği', out: { id: 'sky_core', qty: 1 }, gold: 7000, inputs: [{ id: 'tyrant_core', qty: 1 }, { id: 'oracle_seal', qty: 3 }, { id: 'ancient_core', qty: 1 }] },
  { id: 'r_sky_core_chain', station: 'blacksmith', name: 'Gök Çekirdeği (Mahkûmun Zincirinden)', out: { id: 'sky_core', qty: 1 }, gold: 7000, inputs: [{ id: 'prisoner_chain', qty: 1 }, { id: 'void_plate', qty: 3 }, { id: 'ancient_core', qty: 1 }] },
  // V4 Epic ekipman — boss materyalleriyle; Legendary üretilemez
  { id: 'r_yb04', station: 'blacksmith', name: 'Fırtına Koşucusu Çizmesi', out: { id: 'YB04', qty: 1, equip: true }, gold: 42000, inputs: [{ id: 'storm_brand', qty: 20 }, { id: 'astral_hide', qty: 16 }, { id: 'tyrant_core', qty: 1 }, { id: 'storm_steel', qty: 8 }] },
  { id: 'r_kb04', station: 'blacksmith', name: 'Ruh Yolcusu Çizmesi', out: { id: 'KB04', qty: 1, equip: true }, gold: 42000, inputs: [{ id: 'storm_brand', qty: 20 }, { id: 'oracle_seal', qty: 14 }, { id: 'tyrant_core', qty: 1 }, { id: 'astral_essence', qty: 3 }] },
  { id: 'r_yc05', station: 'blacksmith', name: 'Fırtına Avcısı Yeleği', out: { id: 'YC05', qty: 1, equip: true }, gold: 40000, inputs: [{ id: 'rift_feather', qty: 18 }, { id: 'astral_hide', qty: 12 }, { id: 'tyrant_core', qty: 1 }, { id: 'storm_steel', qty: 6 }] },
  { id: 'r_kh05', station: 'blacksmith', name: 'Ruh Tacı', out: { id: 'KH05', qty: 1, equip: true }, gold: 40000, inputs: [{ id: 'oracle_seal', qty: 12 }, { id: 'star_essence', qty: 16 }, { id: 'tyrant_core', qty: 1 }, { id: 'astral_essence', qty: 3 }] },
  // İksirler (Şifacı)
  { id: 'r_hp_s', station: 'healer', name: 'Küçük HP İksiri', out: { id: 'hp_s', qty: 1 }, gold: 5, inputs: [{ id: 'healing_herb', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_hp_m', station: 'healer', name: 'Orta HP İksiri', out: { id: 'hp_m', qty: 1 }, gold: 15, inputs: [{ id: 'healing_herb', qty: 3 }, { id: 'leech_essence', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_hp_l', station: 'healer', name: 'Büyük HP İksiri', out: { id: 'hp_l', qty: 1 }, gold: 35, inputs: [{ id: 'healing_herb', qty: 5 }, { id: 'leech_essence', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_mp_s', station: 'healer', name: 'Küçük MP İksiri', out: { id: 'mp_s', qty: 1 }, gold: 5, inputs: [{ id: 'mana_herb', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  // Orman alternatifi (belge §9.3 açık denge maddesi): erken MP erişimi
  { id: 'r_mp_s_forest', station: 'healer', name: 'Küçük MP İksiri (Orman tarifi)', out: { id: 'mp_s', qty: 1 }, gold: 8, inputs: [{ id: 'root_essence', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_mp_m', station: 'healer', name: 'Orta MP İksiri', out: { id: 'mp_m', qty: 1 }, gold: 15, inputs: [{ id: 'mana_herb', qty: 3 }, { id: 'bat_wing', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_hp_xl', station: 'healer', name: 'Yoğun HP İksiri', out: { id: 'hp_xl', qty: 1 }, gold: 60, inputs: [{ id: 'healing_herb', qty: 5 }, { id: 'ash_dust', qty: 2 }, { id: 'leech_essence', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_mp_xl', station: 'healer', name: 'Yoğun MP İksiri', out: { id: 'mp_xl', qty: 1 }, gold: 60, inputs: [{ id: 'mana_herb', qty: 5 }, { id: 'pure_ice', qty: 1 }, { id: 'magic_ore', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  // V2: Ustalık Kitabı — pahalı alternatif üretim (Gezgin Bilge değil Demirci; boss/elit düşüşüne ek yol)
  { id: 'r_mastery_book', station: 'blacksmith', name: 'Ustalık Kitabı', out: { id: 'mastery_book', qty: 1 }, gold: 30000, inputs: [{ id: 'giant_ember', qty: 4 }, { id: 'warden_seal', qty: 6 }, { id: 'snow_seal', qty: 15 }, { id: 'altar_crystal', qty: 2 }] },
  { id: 'r_mp_l', station: 'healer', name: 'Büyük MP İksiri', out: { id: 'mp_l', qty: 1 }, gold: 40, inputs: [{ id: 'mana_herb', qty: 5 }, { id: 'magic_ore', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  // V3: kadim iksirler (Şifacı / Simyacı)
  { id: 'r_hp_xxl', station: 'healer', name: 'Kadim HP İksiri', out: { id: 'hp_xxl', qty: 1 }, gold: 90, inputs: [{ id: 'mourning_herb', qty: 4 }, { id: 'grave_dust', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_mp_xxl', station: 'healer', name: 'Kadim MP İksiri', out: { id: 'mp_xxl', qty: 1 }, gold: 90, inputs: [{ id: 'mourning_herb', qty: 3 }, { id: 'soul_crystal', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  // V4: yıldız iksirleri
  { id: 'r_hp_star', station: 'healer', name: 'Yıldız HP İksiri', out: { id: 'hp_star', qty: 1 }, gold: 130, inputs: [{ id: 'star_flower', qty: 4 }, { id: 'meteor_dust', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_mp_star', station: 'healer', name: 'Yıldız MP İksiri', out: { id: 'mp_star', qty: 1 }, gold: 130, inputs: [{ id: 'star_flower', qty: 3 }, { id: 'astral_crystal', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  // V3: Simya (Simyacı Nisa) — kullanım eşyaları ve görev eşyaları. Hiçbiri ganimet şansını etkilemez.
  { id: 'r_purify_salt', station: 'alchemy', name: 'Arındırma Tuzu ×2', out: { id: 'purify_salt', qty: 2 }, gold: 10, inputs: [{ id: 'weak_essence', qty: 1 }, { id: 'healing_herb', qty: 1 }] },
  { id: 'r_cleansing_salve', station: 'alchemy', name: 'Temizleyici Merhem ×2', out: { id: 'cleansing_salve', qty: 2 }, gold: 15, inputs: [{ id: 'healing_herb', qty: 2 }, { id: 'root_essence', qty: 1 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_camp_ration', station: 'alchemy', name: 'Kamp Erzağı', out: { id: 'camp_ration', qty: 1 }, gold: 10, inputs: [{ id: 'small_fur', qty: 2 }, { id: 'healing_herb', qty: 1 }] },
  { id: 'r_seal_ink', station: 'alchemy', name: 'Mühür Mürekkebi (görev)', out: { id: 'seal_ink', qty: 1 }, gold: 60, inputs: [{ id: 'magic_ore', qty: 2 }, { id: 'bat_wing', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_warming_tonic', station: 'alchemy', name: 'Isıtıcı Tonik', out: { id: 'warming_tonic', qty: 1 }, gold: 80, inputs: [{ id: 'ash_dust', qty: 2 }, { id: 'crimson_hide', qty: 1 }, { id: 'healing_herb', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
  { id: 'r_holy_symbol', station: 'alchemy', name: 'Arındırılmış Sembol (görev)', out: { id: 'holy_symbol', qty: 1 }, gold: 400, inputs: [{ id: 'shroud_cloth', qty: 3 }, { id: 'mourning_herb', qty: 2 }, { id: 'purify_salt', qty: 1 }] },
  { id: 'r_royal_ink', station: 'alchemy', name: 'Kraliyet Mürekkebi', out: { id: 'royal_ink', qty: 1 }, gold: 250, inputs: [{ id: 'grave_dust', qty: 2 }, { id: 'mourning_herb', qty: 2 }, { id: 'empty_bottle', qty: 1 }] },
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
// V2: Lv.21+ eşyalar — aynı başarı oranları, aynı "asla kırılmaz/düşmez" kuralı; daha yüksek maliyet.
// V1 materyalleri (Sertleştirme Taşı, Sunak Kristali) değerini korur; +5 için Kor Çekirdeği (Kadim Çekirdek içerir).
export const V2_UPGRADE_MIN_LEVEL = 21;
export const V2_UPGRADE_GOLD_MULT = 1.8;
export const UPGRADE_STEPS_V2_MATS = [
  [{ id: 'ash_steel', qty: 2 }],
  [{ id: 'ash_steel', qty: 4 }],
  [{ id: 'hardening_stone', qty: 2 }, { id: 'frost_essence', qty: 1 }],
  [{ id: 'altar_crystal', qty: 1 }, { id: 'frost_essence', qty: 2 }],
  [{ id: 'ember_core', qty: 1 }],
];
export const UPGRADE_NU_FINAL_V2 = [{ id: 'altar_crystal', qty: 3 }, { id: 'frost_essence', qty: 2 }];
// V3: Lv.31+ eşyalar — aynı başarı oranları ve kırılmazlık; Kara Çelik / Ruh Özü / Taht Çekirdeği (V1/V2 materyalleri de kullanılır)
export const V3_UPGRADE_MIN_LEVEL = 31;
export const V3_UPGRADE_GOLD_MULT = 2.6;
export const UPGRADE_STEPS_V3_MATS = [
  [{ id: 'dark_steel', qty: 2 }],
  [{ id: 'dark_steel', qty: 4 }],
  [{ id: 'hardening_stone', qty: 2 }, { id: 'soul_essence', qty: 1 }],
  [{ id: 'altar_crystal', qty: 1 }, { id: 'soul_essence', qty: 2 }],
  [{ id: 'throne_core', qty: 1 }],
];
export const UPGRADE_NU_FINAL_V3 = [{ id: 'altar_crystal', qty: 3 }, { id: 'soul_essence', qty: 2 }];
// V4: Lv.41+ eşyalar — aynı başarı oranları ve kırılmazlık (+5 sınırı, başarısızlıkta seviye düşmez);
// Fırtına Çeliği / Astral Öz / Gök Çekirdeği (eski materyaller değerini korur: Sertleştirme Taşı, Sunak Kristali, Kadim Çekirdek)
export const V4_UPGRADE_MIN_LEVEL = 41;
export const V4_UPGRADE_GOLD_MULT = 3.6;
export const UPGRADE_STEPS_V4_MATS = [
  [{ id: 'storm_steel', qty: 2 }],
  [{ id: 'storm_steel', qty: 4 }],
  [{ id: 'hardening_stone', qty: 2 }, { id: 'astral_essence', qty: 1 }],
  [{ id: 'altar_crystal', qty: 1 }, { id: 'astral_essence', qty: 2 }],
  [{ id: 'sky_core', qty: 1 }],
];
export const UPGRADE_NU_FINAL_V4 = [{ id: 'altar_crystal', qty: 3 }, { id: 'astral_essence', qty: 2 }];
export const UPGRADE_BONUS_PER_LEVEL = 0.06; // +1 → +%6 ... +5 → +%30 (temel değere toplamsal)
export const UPGRADE_SLOT_MULT = { weapon: 1, offhand: 0.6, helm: 0.5, chest: 0.7, gloves: 0.45, boots: 0.45 };
export const LOW_LEVEL_UPGRADE_MULT = 0.5; // Lv.1–9 eşyalar
