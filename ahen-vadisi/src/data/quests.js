// 18 ana hikâye + 8 yan görev — belge §6.1 / §6.2. Ayrıca Gezgin Bilge sınıf görevleri (Lv.10 / Lv.20)
// Görev hedef tipleri:
//  kill     { enemy | enemies[], count, minLevel? }
//  qitem    { item, name, from[], chance, count }   (görev nesnesi; nadir ekipman RNG'sinden bağımsız)
//  reach    { loc }
//  interact { group, count }                        (haritadaki görev nesneleri)
//  deliver  { item, count }                         (teslimde envanterden tüketilir)
//  dungeon  { stage }                               (Derin Ocak bölümünü temizle)
//  talk     { npc }

const Q = (o) => ({ repeatable: false, rewardItems: [], ...o });

export const QUESTS = [
  // ============================================================ ANA HİKÂYE (18)
  Q({ id: 'm01', main: true, order: 1, name: 'İlk Adımlar', giver: 'muhtar', turnIn: 'muhtar', minLevel: 1, rec: '1–2',
    text: 'Köy meydanındaki eğitim alanında Saman Kuklalarıyla savaşı öğren. Kuklaya dokun, karakterin yaklaşıp saldıracak.',
    objectives: [{ type: 'kill', enemy: 'training_dummy', count: 3, label: 'Saman Kukla kır' }],
    exp: 60, gold: 25, rewardItems: [{ id: 'hp_s', qty: 3 }, { id: 'mp_s', qty: 2 }],
    hint: { map: 'village', x: 20, y: 30, r: 4 } }),
  Q({ id: 'm02', main: true, order: 2, name: 'Bozulan Denge', giver: 'muhtar', turnIn: 'muhtar', minLevel: 1, rec: '2–3', prereq: ['m01'],
    text: 'Köyün doğusundaki Yeşil Çayır\'da sıçanlar ürünlerimizi yiyor. Onları avla. Ödülündeki 2 Demir ile Demirci Boran\'da ilk +1 yükseltmeni yap.',
    objectives: [{ type: 'kill', enemy: 'meadow_rat', count: 6, label: 'Çayır Sıçanı avla' }],
    exp: 90, gold: 40, rewardItems: [{ id: 'iron', qty: 2 }],
    hint: { map: 'forest', x: 22, y: 46, r: 9 } }),
  Q({ id: 'm03', main: true, order: 3, name: 'Kaybolan Avcı', giver: 'muhtar', turnIn: 'muhtar', minLevel: 2, rec: '3–4', prereq: ['m02'],
    text: 'Avcımız Doran ormanda kayboldu. Son görüldüğü terk edilmiş avcı kampına ulaş.',
    objectives: [{ type: 'reach', loc: 'loc_hunter_camp', label: 'Terk Edilmiş Avcı Kampı\'na ulaş' }],
    exp: 140, gold: 60, hint: { map: 'forest', x: 44, y: 22, r: 5 } }),
  Q({ id: 'm04', main: true, order: 4, name: 'Kurtların İzinde', giver: 'muhtar', turnIn: 'muhtar', minLevel: 3, rec: '4–5', prereq: ['m03'],
    text: 'Kampta kurt izleri var. Kurt Patikası\'nda kurtları avla ve pençe izlerini incele.',
    objectives: [
      { type: 'kill', enemy: 'gray_wolf', count: 8, label: 'Boz Kurt avla' },
      { type: 'interact', group: 'wolf_track', count: 4, label: 'Kurt izini incele' },
    ],
    exp: 180, gold: 70, hint: { map: 'forest', x: 50, y: 40, r: 9 } }),
  Q({ id: 'm05', main: true, order: 5, name: 'Lanetli Kökler', giver: 'muhtar', turnIn: 'muhtar', minLevel: 4, rec: '5–7', prereq: ['m04'],
    text: 'Kadim Kökler\'de kökçüler uyandı. Lanetin kaynağını anlamak için Lanetli Kök Özü topla.',
    objectives: [{ type: 'qitem', item: 'q_cursed_root', name: 'Lanetli Kök Özü', from: ['thorn_rootling'], chance: 0.6, count: 6, label: 'Lanetli Kök Özü topla' }],
    exp: 240, gold: 90, hint: { map: 'forest', x: 74, y: 62, r: 9 } }),
  Q({ id: 'm06', main: true, order: 6, name: 'Terk Edilmiş Kamp', giver: 'muhtar', turnIn: 'muhtar', minLevel: 6, rec: '7–9', prereq: ['m05'],
    text: 'Haydutlar eski oduncu kampını ele geçirdi. Haydut Kampı\'nı temizle.',
    objectives: [{ type: 'kill', enemy: 'forest_raider', count: 10, label: 'Orman Yağmacısı yen' }],
    exp: 300, gold: 110, hint: { map: 'forest', x: 92, y: 30, r: 9 } }),
  Q({ id: 'm07', main: true, order: 7, name: 'Alfa\'nın İni', giver: 'muhtar', turnIn: 'muhtar', minLevel: 8, rec: '9–11', prereq: ['m06'],
    text: 'Kurtları yöneten dev Alfa Kurt, ormanın kuzeyindeki inde. Onu yen ve sürüyü dağıt.',
    objectives: [{ type: 'kill', enemy: 'alpha_wolf', count: 1, label: 'Alfa Kurt\'u yen' }],
    exp: 450, gold: 180, hint: { map: 'forest', x: 100, y: 64, r: 7 } }),
  Q({ id: 'm08', main: true, order: 8, name: 'Maden Yolculuğu', giver: 'muhtar', turnIn: 'muhtar', minLevel: 9, rec: '10–11', prereq: ['m07'],
    text: 'Kırık Damar Madeni\'nden haber alamıyoruz. Ormanın doğu geçidinden madene ulaş.',
    objectives: [{ type: 'reach', loc: 'loc_mine_entrance', label: 'Kırık Damar Madeni\'ne ulaş' }],
    exp: 550, gold: 140, hint: { map: 'mine', x: 6, y: 40, r: 5 } }),
  Q({ id: 'm09', main: true, order: 9, name: 'Çalınan Cevher', giver: 'muhtar', turnIn: 'muhtar', minLevel: 10, rec: '11–12', prereq: ['m08'],
    text: 'Goblinler köyün cevher kesesini çaldı. Eski Kazı Alanı\'nda keseleri geri al.',
    objectives: [{ type: 'qitem', item: 'q_ore_pouch', name: 'Çalınan Cevher Kesesi', from: ['pick_goblin'], chance: 0.5, count: 6, label: 'Cevher kesesi topla' }],
    exp: 650, gold: 180, rewardItems: [{ id: 'iron', qty: 4 }], hint: { map: 'mine', x: 24, y: 22, r: 9 } }),
  Q({ id: 'm10', main: true, order: 10, name: 'Sert Kabuk', giver: 'muhtar', turnIn: 'muhtar', minLevel: 11, rec: '12–13', prereq: ['m09'],
    text: 'Demir Kabuklu Böcekler galerileri çökertiyor. Sert Kabuk Yuvası\'nda onları avla.',
    objectives: [{ type: 'kill', enemy: 'ironshell_beetle', count: 10, label: 'Demir Kabuklu Böcek avla' }],
    exp: 970, gold: 220, rewardItems: [{ id: 'hardening_stone', qty: 1 }], hint: { map: 'mine', x: 30, y: 60, r: 9 } }),
  Q({ id: 'm11', main: true, order: 11, name: 'Kayıp Mühür', giver: 'muhtar', turnIn: 'muhtar', minLevel: 12, rec: '13–15', prereq: ['m10'],
    text: 'Derin Ocak\'ı kapatan mühür kırıldı; parçaları Cevher Rahiplerinin elinde. Kristal Odaları\'nda parçaları bul.',
    objectives: [{ type: 'qitem', item: 'q_seal_piece', name: 'Mühür Parçası', from: ['ore_priest'], chance: 0.4, count: 3, label: 'Mühür parçası bul' }],
    exp: 1120, gold: 250, hint: { map: 'mine', x: 78, y: 22, r: 9 } }),
  Q({ id: 'm12', main: true, order: 12, name: 'Sislerin Ardında', giver: 'muhtar', turnIn: 'muhtar', minLevel: 14, rec: '15–16', prereq: ['m11'],
    text: 'Mühür parçaları bataklıktan gelen bir enerjiyle titreşiyor. Madenin güney geçidinden Sis Bataklığı\'na ulaş.',
    objectives: [{ type: 'reach', loc: 'loc_swamp_entrance', label: 'Sis Bataklığı\'na ulaş' }],
    exp: 1350, gold: 300, hint: { map: 'swamp', x: 56, y: 6, r: 5 } }),
  Q({ id: 'm13', main: true, order: 13, name: 'Zehirli Öz', giver: 'muhtar', turnIn: 'muhtar', minLevel: 15, rec: '16–17', prereq: ['m12'],
    text: 'Bataklık sularını zehirleyen özü incelemeliyiz. Sülüklerden Zehirli Öz topla.',
    objectives: [{ type: 'qitem', item: 'q_toxic_essence', name: 'Zehirli Öz', from: ['swamp_leech'], chance: 0.5, count: 6, label: 'Zehirli Öz topla' }],
    exp: 1500, gold: 350, hint: { map: 'swamp', x: 26, y: 26, r: 9 } }),
  Q({ id: 'm14', main: true, order: 14, name: 'Kirlenmiş Sular', giver: 'muhtar', turnIn: 'muhtar', minLevel: 16, rec: '17–18', prereq: ['m13'],
    text: 'Bataklıktaki üç kadim arındırma taşını etkinleştir; zehrin akışı yavaşlasın.',
    objectives: [{ type: 'interact', group: 'purify_stone', count: 3, label: 'Arındırma taşı etkinleştir' }],
    exp: 1850, gold: 450, rewardItems: [{ id: 'altar_dust', qty: 2 }], hint: { map: 'swamp', x: 56, y: 44, r: 30 } }),
  Q({ id: 'm15', main: true, order: 15, name: 'Mührün Gücü', giver: 'muhtar', turnIn: 'muhtar', minLevel: 17, rec: '18–19', prereq: ['m14'],
    text: 'Mühür, ölümsüz muhafızların enerjisiyle yeniden bağlanabilir. Çürük Muhafızları yen, ardından madendeki Derin Ocak kapısında mührü etkinleştir.',
    objectives: [
      { type: 'kill', enemy: 'rotten_guard', count: 5, label: 'Çürük Muhafız yen', hint: { map: 'swamp', x: 86, y: 62, r: 10 } },
      { type: 'interact', group: 'dungeon_gate', count: 1, after: [0], label: 'Derin Ocak kapısını aç' },
    ],
    exp: 2000, gold: 500, unlocksDungeon: true, hint: { map: 'mine', x: 52, y: 6, r: 5 } }),
  Q({ id: 'm16', main: true, order: 16, name: 'Derinlere İniş', giver: 'muhtar', turnIn: 'muhtar', minLevel: 18, rec: '19', prereq: ['m15'],
    text: 'Derin Ocak\'a gir; Eski Maden Girişi, Kristal Koridoru ve Gözcünün Salonu\'nu geç.',
    objectives: [{ type: 'dungeon', stage: 3, label: 'Gözcünün Salonu\'nu temizle' }],
    exp: 2350, gold: 600, hint: { map: 'dungeon', x: 52, y: 40, r: 30 } }),
  Q({ id: 'm17', main: true, order: 17, name: 'Madenin Kalbi', giver: 'muhtar', turnIn: 'muhtar', minLevel: 18, rec: '19–20', prereq: ['m16'],
    text: 'Vadinin uğultusunun kaynağı Maden Golemi. Derin Ocak\'ın kalbinde onu durdur.',
    objectives: [{ type: 'kill', enemy: 'mine_golem', count: 1, label: 'Maden Golemi\'ni yen' }],
    exp: 2750, gold: 800, rewardItems: [{ id: 'altar_crystal', qty: 1 }], hint: { map: 'dungeon', x: 82, y: 18, r: 10 } }),
  Q({ id: 'm18', main: true, order: 18, name: 'Vadinin Koruyucusu', giver: 'muhtar', turnIn: 'muhtar', minLevel: 19, rec: '20', prereq: ['m17'],
    text: 'Köye dön ve Muhtar\'a vadinin kurtulduğunu haber ver.',
    objectives: [{ type: 'talk', npc: 'muhtar', label: 'Köy Muhtarı ile konuş' }],
    exp: 0, gold: 1000, title: 'Vadinin Koruyucusu' }),

  // ============================================================ YAN GÖREVLER (8)
  Q({ id: 's01', main: false, name: 'Avcının İlk Sözleşmesi', giver: 'hunter', turnIn: 'hunter', minLevel: 3, rec: '3',
    text: 'Çayırdaki sıçan sürüsü hızla büyüyor. 8 tanesini avla, sonra sana tekrarlanabilir av sözleşmelerini öğreteyim.',
    objectives: [{ type: 'kill', enemy: 'meadow_rat', count: 8, label: 'Çayır Sıçanı avla' }],
    exp: 150, gold: 45, hint: { map: 'forest', x: 22, y: 46, r: 9 } }),
  Q({ id: 's02', main: false, name: 'Şifacının Otları', giver: 'elin', turnIn: 'elin', minLevel: 5, rec: '5',
    text: 'İksir stoklarım azaldı. Ormandan 6 Şifa Otu topla ve bana getir.',
    objectives: [{ type: 'deliver', item: 'healing_herb', count: 6, label: 'Şifa Otu getir' }],
    exp: 250, gold: 70, rewardItems: [{ id: 'hp_s', qty: 3 }], hint: { map: 'forest', x: 40, y: 56, r: 20 } }),
  Q({ id: 's03', main: false, name: 'Kayıp Avcı Eşyaları', giver: 'hunter', turnIn: 'hunter', minLevel: 7, rec: '7',
    text: 'Doran\'ın saklı av sandıkları ormanda dağılmış. Üçünü bul.',
    objectives: [{ type: 'interact', group: 'hunter_cache', count: 3, label: 'Avcı sandığı bul' }],
    exp: 350, gold: 90, hint: { map: 'forest', x: 70, y: 40, r: 30 } }),
  Q({ id: 's04', main: false, name: 'Demircinin İhtiyacı', giver: 'boran', turnIn: 'boran', minLevel: 10, rec: '10',
    text: 'Örsüm aç! Madendeki damarlardan 8 Demir Cevheri getir.',
    objectives: [{ type: 'deliver', item: 'iron_ore', count: 8, label: 'Demir Cevheri getir' }],
    exp: 450, gold: 140, rewardItems: [{ id: 'iron', qty: 3 }], hint: { map: 'mine', x: 24, y: 22, r: 12 } }),
  Q({ id: 's05', main: false, name: 'Yarasa Yuvası', giver: 'hunter', turnIn: 'hunter', minLevel: 12, rec: '12',
    text: 'Karanlık Galeri yarasalarla dolup taştı. 12 tanesini avla.',
    objectives: [{ type: 'kill', enemy: 'cave_bat', count: 12, label: 'Mağara Yarasası avla' }],
    exp: 600, gold: 180, hint: { map: 'mine', x: 66, y: 48, r: 9 } }),
  Q({ id: 's06', main: false, name: 'Kayıp Madenci', giver: 'keeper', turnIn: 'keeper', minLevel: 14, rec: '14',
    text: 'Kardeşim Kadir Kristal Odaları\'nın derinliklerinde kayboldu. Onu bul.',
    objectives: [{ type: 'interact', group: 'lost_miner', count: 1, label: 'Kayıp madenciyi bul' }],
    exp: 800, gold: 240, hint: { map: 'mine', x: 92, y: 30, r: 6 } }),
  Q({ id: 's07', main: false, name: 'Bataklık Kalıntıları', giver: 'sage', turnIn: 'sage', minLevel: 17, rec: '17',
    text: 'Sisli Harabeler\'deki eski yazıtları incele; vadinin tarihini öğrenmeliyim.',
    objectives: [{ type: 'interact', group: 'swamp_ruin', count: 4, label: 'Yazıtı incele' }],
    exp: 1100, gold: 325, hint: { map: 'swamp', x: 88, y: 26, r: 9 } }),
  Q({ id: 's08', main: false, name: 'Son Muhafızın İzleri', giver: 'sage', turnIn: 'sage', minLevel: 19, rec: '19',
    text: 'Unutulmuş Mezarlık\'ta son muhafızın celladı dolaşıyor. Muhafızları ve Celladı yen.',
    objectives: [
      { type: 'kill', enemy: 'rotten_guard', count: 8, label: 'Çürük Muhafız yen' },
      { type: 'kill', enemy: 'swamp_executioner', count: 1, label: 'Bataklık Celladı\'nı yen' },
    ],
    exp: 1800, gold: 500, hint: { map: 'swamp', x: 86, y: 62, r: 10 } }),
];

// ---------------------------------------------------------------- Sınıf görevleri (Gezgin Bilge)
// 26 görev sayımına dahil değildir; Lv.10 ve Lv.20'de +1'er beceri puanı verir.
export const CLASS_QUESTS = [
  Q({ id: 'c10', classQuest: true, name: 'Yolun Sınavı', giver: 'sage', turnIn: 'sage', minLevel: 10, rec: '10',
    text: 'Sınıfının yolunda ilerlemek için Lv.8 ve üzeri 15 yaratık yen.',
    objectives: [{ type: 'kill', enemies: '*', minLevel: 8, count: 15, label: 'Lv.8+ yaratık yen' }],
    exp: 0, gold: 0, skillPoint: 1 }),
  Q({ id: 'c20', classQuest: true, name: 'Ustalık I', giver: 'sage', turnIn: 'sage', minLevel: 20, rec: '20', prereq: ['c10'],
    text: 'Ustalığa ulaşmak için Unutulmuş Mezarlık\'ın ölümsüzlerini yen.',
    objectives: [
      { type: 'kill', enemy: 'rotten_guard', count: 15, label: 'Çürük Muhafız yen' },
      { type: 'kill', enemy: 'swamp_executioner', count: 1, label: 'Bataklık Celladı\'nı yen' },
    ],
    exp: 0, gold: 0, skillPoint: 1, mastery: true }),
];

export const ALL_QUESTS = [...QUESTS, ...CLASS_QUESTS];
export const QUEST_MAP = Object.fromEntries(ALL_QUESTS.map((q) => [q.id, q]));

// ---------------------------------------------------------------- Av Sözleşmeleri (tekrarlanabilir)
export const CONTRACT_KILLS = 12;
export const CONTRACT_EXP_FACTOR = 0.25;   // öldürme EXP toplamının %25'i ek EXP
export const CONTRACT_GOLD_FACTOR = 0.6;
export const CONTRACT_LEVEL_WINDOW = [-4, 3];
