// İstiflenebilir eşyalar: materyaller ve iksirler — belge §9.
// sell: NPC'ye satış fiyatı (tek adet). Bütün satış fiyatları üretim maliyetinin altında tutulur.

const mat = (id, name, sell, look, desc, extra = {}) => ({ id, name, cat: 'material', sell, look, desc, ...extra });

export const MATERIAL_LIST = [
  // Orman
  mat('small_fur', 'Küçük Post', 1, { type: 'fur', c: '#a08a6a' }, 'Çayır Sıçanından. Tüccara satılabilir.'),
  mat('wolf_tooth', 'Kurt Dişi', 2, { type: 'tooth', c: '#efe6cf' }, 'Boz Kurttan. Av sözleşmeleri için değerli.'),
  mat('wolf_pelt', 'Kurt Postu', 2, { type: 'fur', c: '#7a7468' }, 'Boz Kurttan kalın post.'),
  mat('root_essence', 'Kök Özü', 2, { type: 'vial', c: '#7ad050' }, 'Diken Kökçüsünden. Kök Değneği üretiminde kullanılır.'),
  mat('hard_wood', 'Sert Odun', 2, { type: 'log', c: '#7a5432' }, 'Diken Kökçüsünden. Üretim materyali.'),
  mat('hunter_cloth', 'Avcı Bezi', 3, { type: 'cloth', c: '#6f8a4a' }, 'Orman Yağmacısından. Avcı Palası üretiminde kullanılır.'),
  mat('healing_herb', 'Şifa Otu', 1, { type: 'herb', c: '#5fd068' }, 'Ormanda toplanır. HP iksiri tariflerinde kullanılır.'),
  // Maden
  mat('iron_scrap', 'Demir Parçası', 2, { type: 'scrap', c: '#8a8f96' }, 'Kazmacı Goblinden. Demirci 3 parçayı 1 Demir yapar.'),
  mat('iron_ore', 'Demir Cevheri', 2, { type: 'ore', c: '#9a7a6a', s: '#c0c0c8' }, 'Maden damarlarından. 2 cevher = 1 Demir.'),
  mat('hard_ore', 'Sert Cevher', 3, { type: 'ore', c: '#5a5a66', s: '#e0e0f0' }, 'Sert cevher damarlarından. Sertleştirme Taşı materyali.'),
  mat('bat_wing', 'Yarasa Kanadı', 3, { type: 'wing', c: '#5a4a5a' }, 'Mağara Yarasasından. Orta MP iksiri tarifinde.'),
  mat('hard_shell', 'Sert Kabuk', 4, { type: 'shell', c: '#6a7480' }, 'Demir Kabuklu Böcekten. Sertleştirme Taşı ve Madenci Zırhı.'),
  mat('magic_ore', 'Büyülü Cevher', 5, { type: 'ore', c: '#3a4a8a', s: '#7ab8ff' }, 'Cevher Rahibinden. Büyük MP iksiri ve Cevher Cübbesi.'),
  // Bataklık
  mat('leech_essence', 'Balçık Özü', 4, { type: 'vial', c: '#b04a4a' }, 'Bataklık Balçığından. Orta/Büyük HP iksiri.'),
  mat('swamp_mud', 'Bataklık Çamuru', 4, { type: 'blob', c: '#5a4a32' }, 'Çamur Cücesinden. Tüccara satılabilir.'),
  mat('toxic_crystal', 'Zehirli Kristal', 6, { type: 'crystal', c: '#7ad050' }, 'Sis Cadısından. Sunak Kristali üretiminde.'),
  mat('old_armor_scrap', 'Eski Zırh Parçası', 6, { type: 'plate', c: '#7a8070' }, 'Çürük Muhafızdan. Tüccara satılabilir.'),
  mat('mana_herb', 'Mana Otu', 2, { type: 'herb', c: '#5aa0ff' }, 'Bataklıkta toplanır. MP iksiri tariflerinde.'),
  // Elit / boss
  mat('captain_badge', 'Kaptan Nişanı', 25, { type: 'badge', c: '#c0a040' }, 'Haydut Kaptanının nişanı (garantili).'),
  mat('watcher_seal', 'Gözcü Mührü', 35, { type: 'seal', c: '#d04a3a' }, 'Kızıl Damar Gözcüsünden. Gözcünün Baltası üretiminde.'),
  mat('executioner_brand', 'Cellat Damgası', 50, { type: 'badge', c: '#6a2a3a' }, 'Bataklık Celladından (garantili).'),
  mat('alpha_claw', 'Alfa Pençesi', 60, { type: 'claw', c: '#efe6cf' }, 'Alfa Kurt ganimeti (garantili).'),
  mat('golem_shard', 'Golem Parçası', 90, { type: 'shard', c: '#8a8a96', s: '#5ae0ff' }, 'Maden Golemi ganimeti (garantili).'),
  mat('ancient_core', 'Kadim Çekirdek', 150, { type: 'core', c: '#ffcf5a' }, 'Maden Golemi %25. +4→+5 yükseltmesi için.'),
  // V2 — Kül Yaylaları
  mat('ash_dust', 'Kül Tozu', 6, { type: 'dust', c: '#8a8480' }, 'Kül Cininden. Büyük iksirler ve Kül Çeliği için.'),
  mat('crimson_hide', 'Kızıl Deri', 7, { type: 'cloth', c: '#9a3a2a' }, 'Kül Avcısından. Kül Runası Asası ve Kızıl Zırh üretiminde.'),
  mat('scorpion_stinger', 'Akrep İğnesi', 8, { type: 'tooth', c: '#d04a2a' }, 'Kızıl Akrepten. Akrep Biçici ve Panzehirli iksir için.'),
  mat('burnt_chain', 'Yanık Zincir', 9, { type: 'scrap', c: '#5a4a44' }, 'Yanık Savaşçıdan. Kül Çeliği ve zırh üretiminde.'),
  mat('ash_ore', 'Kül Cevheri', 5, { type: 'ore', c: '#4a4040', s: '#ff7a2a' }, 'Kül Yaylalarında toplanır. 2 cevher + 1 Demir = Kül Çeliği.'),
  // V2 — Ayaz Geçidi
  mat('frost_pelt', 'Ayaz Postu', 9, { type: 'fur', c: '#d8e8f0' }, 'Ayaz Kurdundan. Buz Kalesi Kalkanı ve sözleşmeler için.'),
  mat('pure_ice', 'Saf Buz Tanesi', 10, { type: 'crystal', c: '#9fe8ff' }, 'Buz Ruhçuktan. Ayaz Özü ve MP iksiri için.'),
  mat('ice_armor_shard', 'Buz Zırh Parçası', 11, { type: 'plate', c: '#a8c8e0' }, 'Buz Zırhlı Nöbetçiden. Buz Kalesi Kalkanı ve Ayaz Küresi.'),
  mat('snow_seal', 'Kar Mührü', 12, { type: 'seal', c: '#c8e8ff' }, 'Kar Şamanından. Ayaz Küresi ve Ustalık Kitabı üretiminde.'),
  mat('frost_crystal', 'Ayaz Kristali', 6, { type: 'crystal', c: '#7ad8ff' }, 'Ayaz Geçidinde toplanır. 2 kristal + 1 Sunak Tozu = Ayaz Özü.'),
  // V2 — elit / boss
  mat('butcher_mark', 'Kül Kasabı Nişanı', 70, { type: 'badge', c: '#c85a2a' }, 'Kül Kasabından (garantili).'),
  mat('warden_seal', 'Buz Gardiyanı Mührü', 95, { type: 'seal', c: '#7ad8ff' }, 'Buz Gardiyanından (garantili).'),
  mat('giant_ember', 'Dev Kor Parçası', 120, { type: 'shard', c: '#4a3a34', s: '#ff8a3a' }, 'Kül Devi ganimeti (garantili). Kor Çekirdeği üretiminde.'),
  mat('frozen_core', 'Donmuş Çekirdek', 200, { type: 'core', c: '#9fe8ff' }, 'Donmuş Muhafız ganimeti (garantili). Kor Çekirdeği üretiminde.'),
  // V2 — işlenmiş
  mat('ash_steel', 'Kül Çeliği', 12, { type: 'ingot', c: '#6a5a54' }, 'Lv.21+ eşyaların +1/+2 yükseltmesi için.'),
  mat('frost_essence', 'Ayaz Özü', 35, { type: 'essence', c: '#7ad8ff' }, 'Lv.21+ eşyaların +3/+4 yükseltmesi için.'),
  mat('ember_core', 'Kor Çekirdeği', 220, { type: 'core', c: '#ff8a3a' }, 'Lv.21+ Rare/Epic/Legendary eşyaların +4→+5 yükseltmesi için.'),
  mat('mastery_book', 'Ustalık Kitabı', 150, { type: 'book', c: '#c070ff' }, 'Lv.30 ve Rank 5 bir becerinin küçük özel geliştirmesini açar (Beceriler ekranı). Her beceriye bir kez.'),
  // Sunak / işlenmiş
  mat('altar_dust', 'Sunak Tozu', 8, { type: 'dust', c: '#c8b0ff' }, 'Sunak tamamlamaktan. 4 toz + 1 Zehirli Kristal = Sunak Kristali.'),
  mat('altar_crystal', 'Sunak Kristali', 40, { type: 'crystal', c: '#c070ff' }, '+3→+4 yükseltmesi için.'),
  mat('iron', 'Demir', 3, { type: 'ingot', c: '#a8b0b8' }, '+1 ve +2 yükseltmeleri için.'),
  mat('hardening_stone', 'Sertleştirme Taşı', 30, { type: 'stone', c: '#6a8aa0' }, '+2→+3 yükseltmesi için.'),
  mat('empty_bottle', 'Boş Şişe', 1, { type: 'bottle', c: '#c8e0e8' }, 'İksir üretiminde kullanılır.'),
  // Parçalama ürünleri
  mat('scrap', 'Hurda', 1, { type: 'scrap', c: '#7a6a5a' }, 'Parçalanan Normal/Uncommon eşyalardan. 4 Hurda = 1 Demir.'),
  mat('weak_essence', 'Zayıf Öz', 4, { type: 'essence', c: '#5fd068' }, 'Uncommon parçalamadan. 3 öz = 1 Sunak Tozu.'),
  mat('rare_essence', 'Nadir Öz', 20, { type: 'essence', c: '#4f9bff' }, 'Rare parçalamadan. 1 öz = 1 Sunak Tozu.'),
  mat('epic_remnant', 'Epic Kalıntısı', 60, { type: 'essence', c: '#c070ff' }, 'Epic parçalamadan. 1 kalıntı = 3 Sunak Tozu.'),
  // V3 — Ölü Krallık
  mat('shroud_cloth', 'Kefen Parçası', 12, { type: 'cloth', c: '#c8c0a8' }, 'Kefen Sürüngeninden. Kefen Başlığı ve arındırma üretiminde.'),
  mat('bone_tip', 'Kemik Uç', 13, { type: 'tooth', c: '#e8e0c8' }, 'Kemik Okçudan. Yas Zırhı ve Kemik Asası tariflerinde.'),
  mat('cursed_metal', 'Lanetli Metal', 14, { type: 'scrap', c: '#5a6a5a' }, 'Lanetli Muhafızdan. Kara Çelik ve Ölü Nöbet ekipmanında.'),
  mat('grave_dust', 'Mezar Tozu', 15, { type: 'dust', c: '#8a8a7a' }, 'Mezar Büyücüsünden. Ruh Özü ve Kraliyet Mürekkebi üretiminde.'),
  // V3 — Kara Taht
  mat('obsidian_shard', 'Obsidyen Kırığı', 17, { type: 'shard', c: '#2a2630', s: '#8a7aff' }, 'Obsidyen Nöbetçiden. Obsidyen ekipmanında.'),
  mat('shadow_essence', 'Gölge Özü', 18, { type: 'essence', c: '#4a3a6a' }, 'Gölge Avcısından. Siyah Dua Değneği ve Ruh Özü üretiminde.'),
  mat('executioner_chain', 'Cellat Zinciri', 19, { type: 'scrap', c: '#4a4040' }, 'Taht Celladından. Kara Çelik ve Taht Çekirdeği üretiminde.'),
  mat('void_crystal', 'Hiçlik Kristali', 20, { type: 'crystal', c: '#8a5ad0' }, 'Hiçlik Rahibinden. Hiçlik Odağı ve Taht Çekirdeği üretiminde.'),
  // V3 — elit / boss (garantili)
  mat('hunter_brand', 'Avcı Damgası', 110, { type: 'badge', c: '#a8a090' }, 'Kefen Avcısından (garantili).'),
  mat('executioner_seal', 'Cellat Mührü', 160, { type: 'seal', c: '#3a3040' }, 'Obsidyen Celladından (garantili). Obsidyen Duvarı ve Hiçlik Odağı tariflerinde.'),
  mat('commander_crest', 'Komutan Arması', 240, { type: 'badge', c: '#6a7a8a' }, 'Mezar Komutanı ganimeti (garantili). Taht Çekirdeği üretiminde.'),
  mat('crown_shard', 'Kırık Taç Parçası', 320, { type: 'shard', c: '#c8a040', s: '#ffe070' }, 'Kayıp Kral ganimeti (garantili). Taht Çekirdeği ve Epic üretiminde; Legendary üretim parçası değildir.'),
  // V3 — toplama
  mat('dark_ore', 'Karanlık Cevher', 8, { type: 'ore', c: '#2e2a34', s: '#9a7aff' }, 'Ölü Krallık\'ta toplanır. 2 cevher + 1 Kül Çeliği = Kara Çelik.'),
  mat('mourning_herb', 'Yas Otu', 6, { type: 'herb', c: '#8a9aa0' }, 'Ölü Krallık mezarlıklarında toplanır. Kadim iksirler ve Temizleyici Merhem için.'),
  mat('soul_crystal', 'Ruh Kristali', 10, { type: 'crystal', c: '#9ad8e8' }, 'Kara Taht\'ta toplanır. 2 kristal + 1 Sunak Tozu = Ruh Özü.'),
  mat('obsidian_ore', 'Obsidyen Damarı', 9, { type: 'ore', c: '#1e1a22', s: '#c070ff' }, 'Kara Taht\'taki obsidyen damarlarından. Obsidyen ekipmanında.'),
  // V3 — işlenmiş
  mat('dark_steel', 'Kara Çelik', 20, { type: 'ingot', c: '#3a3644' }, 'Lv.31+ eşyaların +1/+2 yükseltmesi için.'),
  mat('soul_essence', 'Ruh Özü', 55, { type: 'essence', c: '#9ad8e8' }, 'Lv.31+ eşyaların +3/+4 yükseltmesi için.'),
  mat('throne_core', 'Taht Çekirdeği', 300, { type: 'core', c: '#c070ff' }, 'Lv.31+ Rare/Epic/Legendary eşyaların +4→+5 yükseltmesi için.'),
  // V4 — Gökyarık Ovası
  mat('storm_pelt', 'Fırtına Postu', 20, { type: 'fur', c: '#6a7a9a' }, 'Fırtına Tazısından. Fırtına Çeliği ve okçu zırhlarında.'),
  mat('rift_feather', 'Çatlak Tüy', 21, { type: 'wing', c: '#8aa0d0' }, 'Çatlak Kanattan. Yay ve sadak tariflerinde.'),
  mat('lightning_shard', 'Şimşek Parçası', 22, { type: 'shard', c: '#3a4a6a', s: '#ffe070' }, 'Şimşek Yağmacısından. Fırtına Çeliği ve Tiran Özü üretiminde.'),
  mat('meteor_dust', 'Göktaşı Tozu', 23, { type: 'dust', c: '#9a8a7a' }, 'Gökgürültüsü Goleminden. Yıldız Özü ve zırh tariflerinde.'),
  // V4 — Yıldız Mezarı
  mat('star_essence', 'Yıldız Özü', 25, { type: 'essence', c: '#ffe8a0' }, 'Yıldız Parazitinden. Astral Öz ve büyü silahlarında.'),
  mat('astral_hide', 'Astral Deri', 26, { type: 'cloth', c: '#5a6ab0' }, 'Astral Avcıdan. Okçu ve ölü çağıran zırhlarında.'),
  mat('void_plate', 'Boşluk Zırhı Parçası', 27, { type: 'plate', c: '#3a3456' }, 'Boşluk Zırhlısından. Ağır zırh ve Gök Çekirdeği üretiminde.'),
  mat('oracle_seal', 'Kadim Kâhin Mührü', 28, { type: 'seal', c: '#c8b0ff' }, 'Yıldız Kâhininden. Grimuar ve Gök Çekirdeği üretiminde.'),
  // V4 — elit / boss (garantili)
  mat('storm_brand', 'Fırtına Damgası', 180, { type: 'badge', c: '#4a6aa0' }, 'Fırtına Celladından (garantili).'),
  mat('void_sigil', 'Hiçlik Simgesi', 240, { type: 'seal', c: '#2a2040' }, 'Hiçlik Muhafızından (garantili).'),
  mat('tyrant_core', 'Tiran Çekirdeği', 380, { type: 'core', c: '#5a8aff' }, 'Fırtına Tiranı ganimeti (garantili). Epic üretimi ve Gök Çekirdeği için; Legendary üretim parçası değildir.'),
  mat('prisoner_chain', 'Mahkûmun Zinciri', 450, { type: 'scrap', c: '#c8c0e0' }, 'Göğün Mahkûmu ganimeti (garantili). Epic üretimi ve Gök Çekirdeği için; Legendary üretim parçası değildir.'),
  // V4 — toplama
  mat('storm_ore', 'Fırtına Cevheri', 11, { type: 'ore', c: '#3a4458', s: '#9ad0ff' }, 'Gökyarık Ovası\'nda toplanır. 2 cevher + 1 Kara Çelik = Fırtına Çeliği.'),
  mat('astral_crystal', 'Astral Kristal', 13, { type: 'crystal', c: '#b0a0ff' }, 'Yıldız Mezarı\'nda toplanır. 2 kristal + 1 Sunak Tozu = Astral Öz.'),
  mat('star_flower', 'Yıldız Çiçeği', 9, { type: 'herb', c: '#ffe8a0' }, 'Gökyarık bölgelerinde toplanır. Yıldız iksirleri için.'),
  // V4 — işlenmiş
  mat('storm_steel', 'Fırtına Çeliği', 28, { type: 'ingot', c: '#4a5a7a' }, 'Lv.41+ eşyaların +1/+2 yükseltmesi için.'),
  mat('astral_essence', 'Astral Öz', 75, { type: 'essence', c: '#b0a0ff' }, 'Lv.41+ eşyaların +3/+4 yükseltmesi için.'),
  mat('sky_core', 'Gök Çekirdeği', 420, { type: 'core', c: '#8ab0ff' }, 'Lv.41+ Rare/Epic/Legendary eşyaların +4→+5 yükseltmesi için.'),
];

// V3: görev eşyaları — satılamaz, parçalanamaz; görev bırakılınca geri alınır.
const qitem = (id, name, look, desc) => ({ id, name, cat: 'quest', questItem: true, sell: 0, look, desc });
export const QUEST_ITEM_LIST = [
  qitem('q_sealed_package', 'Mühürlü Paket', { type: 'badge', c: '#c8a060' }, 'Kervancı Rauf\'un Şifacı Elin\'e gönderdiği paket.'),
  qitem('seal_ink', 'Mühür Mürekkebi', { type: 'vial', c: '#3a4a8a' }, 'Simyacı Nisa için üretilen özel mürekkep. Yalnız görevde kullanılır.'),
  qitem('holy_symbol', 'Arındırılmış Sembol', { type: 'seal', c: '#e8e0c0' }, 'Rahibe Seher için üretilen arındırma sembolü.'),
  qitem('q_urgent_letter', 'Gecikmiş Mektup', { type: 'badge', c: '#e8dcb8' }, 'Haritacı Lale\'nin Ölü Krallık\'a gönderdiği mektup.'),
];

// V3: kullanılabilir eşyalar (envanterden "Kullan"). combatOk: savaşta kullanılabilir mi. Hiçbiri ganimet şansını etkilemez.
const usable = (id, name, buy, use, look, desc, extra = {}) => ({ id, name, cat: 'usable', buy, sell: Math.max(1, Math.round(buy * 0.2)), use, look, desc, ...extra });
export const USABLE_LIST = [
  usable('cleansing_salve', 'Temizleyici Merhem', 40, { kind: 'cure_poison' }, { type: 'vial', c: '#8be06a' }, 'Zehir etkisini hemen giderir. Savaşta kullanılabilir.', { combatOk: true }),
  usable('warming_tonic', 'Isıtıcı Tonik', 120, { kind: 'cold_resist', dur: 120, pct: 0.5 }, { type: 'vial', c: '#ff8a3a' }, '2 dk boyunca soğuk/yavaşlatma etkilerinin gücünü ve süresini yarıya indirir.', { combatOk: true }),
  usable('return_scroll', 'Dönüş Parşömeni', 150, { kind: 'return' }, { type: 'book', c: '#e8dcb8' }, 'Savaş dışında, keşfettiğin bir Yol Taşı\'na ücretsiz döner.'),
  usable('camp_ration', 'Kamp Erzağı', 35, { kind: 'ration', dur: 10, pct: 0.6 }, { type: 'herb', c: '#c8a060' }, 'Savaş dışında 10 sn içinde HP ve MP\'nin %60\'ını yeniler (hasar alınca kesilir).'),
  usable('miner_lamp', 'Maden Lambası', 60, { kind: 'lamp', dur: 90 }, { type: 'core', c: '#ffd060' }, '90 sn boyunca bu haritadaki cevher ve ot düğümlerini mini haritada işaretler.'),
  usable('scout_compass', 'İzci Pusulası', 80, { kind: 'compass', dur: 120 }, { type: 'stone', c: '#8ab0d0' }, '2 dk boyunca takip ettiğin görevin yaklaşık arama alanını mini haritada gösterir.'),
  usable('purify_salt', 'Arındırma Tuzu', 25, { kind: 'quest' }, { type: 'dust', c: '#e8f0f8' }, 'Lanetli kaynakları ve görev nesnelerini arındırmakta kullanılır (nesneye dokun).'),
  usable('royal_ink', 'Kraliyet Mürekkebi', 400, { kind: 'quest' }, { type: 'vial', c: '#6a2a8a' }, 'Kadim yazıt ve antlaşma tabletlerini okumakta kullanılır (nesneye dokun).'),
];

export const POTION_LIST = [
  { id: 'hp_s', name: 'Küçük HP İksiri', cat: 'potion', kind: 'hp', lv: 1, amount: 60, buy: 30, sell: 6, look: { type: 'potion', c: '#e04848', size: 0 } },
  { id: 'hp_m', name: 'Orta HP İksiri', cat: 'potion', kind: 'hp', lv: 8, amount: 140, buy: 75, sell: 15, look: { type: 'potion', c: '#e04848', size: 1 } },
  { id: 'hp_l', name: 'Büyük HP İksiri', cat: 'potion', kind: 'hp', lv: 15, amount: 250, buy: 140, sell: 28, look: { type: 'potion', c: '#e04848', size: 2 } },
  { id: 'mp_s', name: 'Küçük MP İksiri', cat: 'potion', kind: 'mp', lv: 1, amount: 45, buy: 30, sell: 6, look: { type: 'potion', c: '#4878e0', size: 0 } },
  { id: 'mp_m', name: 'Orta MP İksiri', cat: 'potion', kind: 'mp', lv: 8, amount: 110, buy: 75, sell: 15, look: { type: 'potion', c: '#4878e0', size: 1 } },
  { id: 'mp_l', name: 'Büyük MP İksiri', cat: 'potion', kind: 'mp', lv: 15, amount: 190, buy: 145, sell: 29, look: { type: 'potion', c: '#4878e0', size: 2 } },
  // V2: Lv.22+ yoğun iksirler (Kül/Ayaz bölgeleri)
  { id: 'hp_xl', name: 'Yoğun HP İksiri', cat: 'potion', kind: 'hp', lv: 22, amount: 420, buy: 230, sell: 46, look: { type: 'potion', c: '#ff5a3a', size: 3 } },
  { id: 'mp_xl', name: 'Yoğun MP İksiri', cat: 'potion', kind: 'mp', lv: 22, amount: 320, buy: 235, sell: 47, look: { type: 'potion', c: '#5ab0ff', size: 3 } },
  // V3: Lv.32+ kadim iksirler (Ölü Krallık / Kara Taht)
  { id: 'hp_xxl', name: 'Kadim HP İksiri', cat: 'potion', kind: 'hp', lv: 32, amount: 640, buy: 380, sell: 76, look: { type: 'potion', c: '#d02a5a', size: 3 } },
  { id: 'mp_xxl', name: 'Kadim MP İksiri', cat: 'potion', kind: 'mp', lv: 32, amount: 480, buy: 390, sell: 78, look: { type: 'potion', c: '#7a5aff', size: 3 } },
  // V4: Lv.42+ yıldız iksirleri (Gökyarık)
  { id: 'hp_star', name: 'Yıldız HP İksiri', cat: 'potion', kind: 'hp', lv: 42, amount: 900, buy: 560, sell: 112, look: { type: 'potion', c: '#ff6a8a', size: 3 } },
  { id: 'mp_star', name: 'Yıldız MP İksiri', cat: 'potion', kind: 'mp', lv: 42, amount: 680, buy: 570, sell: 114, look: { type: 'potion', c: '#8a9aff', size: 3 } },
];
for (const p of POTION_LIST) p.desc = `+${p.amount} ${p.kind.toUpperCase()} anında. Bekleme ${10} sn. Seviye ${p.lv}+.`;

export const STACKABLES = Object.fromEntries([...MATERIAL_LIST, ...POTION_LIST, ...USABLE_LIST, ...QUEST_ITEM_LIST].map((m) => [m.id, m]));
export const USABLES = Object.fromEntries(USABLE_LIST.map((u) => [u.id, u]));
export const MATERIALS = Object.fromEntries(MATERIAL_LIST.map((m) => [m.id, m]));
export const POTIONS = Object.fromEntries(POTION_LIST.map((p) => [p.id, p]));

export function isStackable(tid) {
  return !!STACKABLES[tid];
}
