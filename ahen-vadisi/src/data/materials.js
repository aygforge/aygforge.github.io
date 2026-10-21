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
];
for (const p of POTION_LIST) p.desc = `+${p.amount} ${p.kind.toUpperCase()} anında. Bekleme ${10} sn. Seviye ${p.lv}+.`;

export const STACKABLES = Object.fromEntries([...MATERIAL_LIST, ...POTION_LIST].map((m) => [m.id, m]));
export const MATERIALS = Object.fromEntries(MATERIAL_LIST.map((m) => [m.id, m]));
export const POTIONS = Object.fromEntries(POTION_LIST.map((p) => [p.id, p]));

export function isStackable(tid) {
  return !!STACKABLES[tid];
}
