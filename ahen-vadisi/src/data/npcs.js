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

// ---------------- V3: Kayıp Krallığın Mirası — 13 yeni NPC (görev verir/alır, kısa konuşmaları vardır)
// supplies: NPC'nin sattığı kullanım eşyaları (SUPPLY_STOCK)
Object.assign(NPCS, {
  rauf: {
    id: 'rauf', name: 'Kervancı Rauf', title: 'Kervan avlusu', sprite: 'npc_rauf', region: 'village',
    services: ['quests', 'supplies', 'sell'],
    greet: 'Yollar güvenli olsaydı kervanlarım kendi kendine giderdi. Bir el yardım eder misin?',
    lines: ['Yük ağır, yol uzun; ama ödeme peşin.', 'Ormanın girişinde fareler bile kervan kokusunu alır.'],
  },
  lale: {
    id: 'lale', name: 'Haritacı Lale', title: 'Harita masası', sprite: 'npc_lale', region: 'village',
    services: ['quests', 'supplies'],
    greet: 'Vadinin haritası yarım kaldı. Her işaret, her kayıp yol bir çizgi daha demek.',
    lines: ['Pusula yalan söylemez; ama yollar değişir.', 'Eski bir harita, yeni bir yolun başlangıcıdır.'],
  },
  nisa: {
    id: 'nisa', name: 'Simyacı Nisa', title: 'Simya tezgâhı', sprite: 'npc_nisa', region: 'village',
    services: ['quests', 'craft_alchemy', 'craft_healer', 'supplies'],
    greet: 'Ot, tuz, biraz sabır... Doğru karışım her yarayı kapatır. Ya da her şeyi patlatır.',
    lines: ['Arındırma Tuzu bende; lanetli sular için birkaç tane al.', 'Karışımı karıştırma, sabırla bekle.'],
  },
  doruk: {
    id: 'doruk', name: 'İzci Doruk', title: 'İzci noktası', sprite: 'npc_doruk', region: 'forest',
    services: ['quests'],
    greet: 'Ağaç kabuğundaki çizik, toprağa düşmüş tüy... Orman her şeyi anlatır, yeter ki bak.',
  },
  nil: {
    id: 'nil', name: 'Korucu Nil', title: 'Korucu korusu', sprite: 'npc_nil', region: 'forest',
    services: ['quests', 'potions'],
    greet: 'Bu fidanlar yüz yıl sonra orman olacak. Bugün onları korumazsak yarın gölge olmaz.',
  },
  fikret: {
    id: 'fikret', name: 'Madenci Fikret', title: 'Maden girişi', sprite: 'npc_fikret', region: 'mine',
    services: ['quests', 'supplies', 'repair'],
    greet: 'Kırk yıl kazma salladım bu damarlarda. Ocak gürlüyorsa bir şey bozulmuştur, bilirim.',
  },
  isil: {
    id: 'isil', name: 'Arındırıcı Işıl', title: 'Arındırma kampı', sprite: 'npc_isil', region: 'swamp',
    services: ['quests', 'supplies', 'potions'],
    greet: 'Sis yalnız gözü değil, ruhu da bulandırır. Suları arındırırsak lanet de çözülür.',
  },
  beril: {
    id: 'beril', name: 'Kervan Gözcüsü Beril', title: 'Yol karakolu', sprite: 'npc_beril', region: 'ash',
    services: ['quests', 'potions', 'repair', 'sell'],
    greet: 'Kül yolunda kervan sürmek delilik. Ama biri sürmezse kamplar aç kalır.',
  },
  kaya: {
    id: 'kaya', name: 'Arşivci Kaya', title: 'Ayaz Konağı arşivi', sprite: 'npc_kaya', region: 'frost',
    services: ['quests'],
    greet: 'Buz, sayfaları da saklar. Bu geçitte kaybolan her yazı, bir krallığın hafızasıdır.',
  },
  seher: {
    id: 'seher', name: 'Rahibe Seher', title: 'Yas Şapeli', sprite: 'npc_seher', region: 'dead',
    services: ['quests', 'potions', 'craft_alchemy', 'supplies'],
    greet: 'Bu krallığın ölüleri uyuyamıyor. Lanet, kayıp tacın etrafında dönüyor.',
  },
  hamit: {
    id: 'hamit', name: 'Mezar Bekçisi Hamit', title: 'Mezarlık kulübesi', sprite: 'npc_hamit', region: 'dead',
    services: ['quests', 'repair', 'sell'],
    greet: 'Elli yıldır mezar bekliyorum. İlk kez ölüler benden önce uyanıyor.',
  },
  eren: {
    id: 'eren', name: 'Muhafız Eren', title: 'Kara Taht nöbet yeri', sprite: 'npc_eren', region: 'throne',
    services: ['quests', 'upgrade', 'craft_blacksmith', 'repair', 'potions'],
    greet: 'Bu kapılar bir kez kapandı. Ben burada kaldım, emir hâlâ geçerli.',
  },
  veysel: {
    id: 'veysel', name: 'Kronikçi Veysel', title: 'Kara Taht kalıntıları', sprite: 'npc_veysel', region: 'throne',
    services: ['quests', 'sell'],
    greet: 'Kayıp Kral\'ın son yılı hiçbir kitapta yazmaz. Ben yazacağım — sen yaşarsan.',
  },
});

// V3 tedarik dükkânları (kullanım eşyaları, istiflenebilir)
export const SUPPLY_STOCK = {
  rauf: ['camp_ration', 'return_scroll', 'scout_compass'],
  lale: ['scout_compass', 'return_scroll'],
  nisa: ['purify_salt', 'cleansing_salve', 'warming_tonic', 'empty_bottle'],
  fikret: ['miner_lamp', 'camp_ration'],
  isil: ['purify_salt', 'cleansing_salve'],
  seher: ['purify_salt', 'cleansing_salve', 'warming_tonic', 'royal_ink'],
};

export const NPC_IDS = Object.keys(NPCS);
