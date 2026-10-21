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
};
export const NPC_IDS = Object.keys(NPCS);
