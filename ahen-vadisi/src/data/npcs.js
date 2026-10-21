// Karaağaç Köyü NPC'leri — belge §10. services: NPC panelinde açılan gerçek işlemler.
export const NPCS = {
  muhtar: {
    id: 'muhtar', name: 'Köy Muhtarı', title: 'Karaağaç Köyü', sprite: 'npc_muhtar',
    services: ['quests'],
    greet: 'Hoş geldin evlat. Vadi huzursuz; ormandan gelen uğultular her gece artıyor.',
  },
  boran: {
    id: 'boran', name: 'Demirci Boran', title: 'Demirci', sprite: 'npc_boran',
    services: ['quests', 'upgrade', 'craft_blacksmith', 'repair', 'dismantle'],
    greet: 'Örs sıcak, çekiç hazır. Ekipmanını getir, birlikte güçlendirelim.',
  },
  mira: {
    id: 'mira', name: 'Tüccar Mira', title: 'Pazar', sprite: 'npc_mira',
    services: ['shop', 'sell', 'bag'],
    greet: 'Pazarın en iyi tezgâhı burası! Al, sat, çantanı genişlet.',
  },
  elin: {
    id: 'elin', name: 'Şifacı Elin', title: 'Şifahane', sprite: 'npc_elin',
    services: ['quests', 'potions', 'craft_healer'],
    greet: 'Yaraların için iksir, otların için tarif. Ne lazım?',
  },
  hunter: {
    id: 'hunter', name: 'Usta Avcı', title: 'Köy girişi', sprite: 'npc_hunter',
    services: ['quests', 'contracts', 'bestiary'],
    greet: 'İzleri okumayı bilen, ormanda yaşar. Bir sözleşmeye ne dersin?',
  },
  sage: {
    id: 'sage', name: 'Gezgin Bilge', title: 'Çınar altı', sprite: 'npc_sage',
    services: ['quests', 'class_quests', 'reset_skills', 'reset_stats'],
    greet: 'Yol uzun, bilgi ağırdır. Becerilerini yeniden düşünmek istersen buradayım.',
  },
  keeper: {
    id: 'keeper', name: 'Depocu', title: 'Ortak depo', sprite: 'npc_keeper',
    services: ['storage', 'storage_expand'],
    greet: 'Bu depo bütün karakterlerine açıktır. Eşyalarını güvenle bırakabilirsin.',
  },
  // ---------------- V2: Kor Kampı (Kül Yaylaları) ve Ayaz Konağı (Ayaz Geçidi)
  demre: {
    id: 'demre', name: 'Kâşif Demre', title: 'Kor Kampı', sprite: 'npc_demre', region: 'ash',
    services: ['quests'],
    greet: 'Göçükten geçen ilk kişi sen misin? Bu yaylalar küle bulanmış ama içinde hâlâ kor var.',
  },
  yaren: {
    id: 'yaren', name: 'Seyyar Demirci Yaren', title: 'Kor Kampı', sprite: 'npc_yaren', region: 'ash',
    services: ['quests', 'upgrade', 'craft_blacksmith', 'repair', 'potions', 'sell'],
    greet: 'Kül Çeliği ateşe dayanır. Örsümü buraya taşıdım; köye dönmene gerek yok.',
  },
  ilgar: {
    id: 'ilgar', name: 'Komutan İlgar', title: 'Ayaz Konağı', sprite: 'npc_ilgar', region: 'frost',
    services: ['quests'],
    greet: 'Mabedin mühürleri çatlıyor. Burada nöbet tutan son birlik biziz.',
  },
  sena: {
    id: 'sena', name: 'Avcı Sena', title: 'Ayaz Konağı', sprite: 'npc_sena', region: 'frost',
    services: ['quests', 'potions', 'sell', 'repair', 'contracts'],
    greet: 'Karda iz sürmek sabır ister. İksir ve sözleşme bende.',
  },
};
export const NPC_IDS = Object.keys(NPCS);
