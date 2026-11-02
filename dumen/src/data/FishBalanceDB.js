// FishBalanceDB — 88 FishDB kaydı için TÜRETİLMİŞ denge/görsel/davranış katmanı.
// Kaynak FishDBSource değiştirilmez. Kaynakta rarity=null olanlar için "derivedRarity" burada atanır;
// kaynakta teyitli 'legendary' / 'boss' etiketleri aynen korunur (sourceRarity alanı).
// Satır biçimi: [id, derivedRarity, behavior, sizeMin, sizeMax, shape, renk1, renk2, desen, aksesuarlar, açıklama]
(function (D) {
  'use strict';
  const ROWS = [
    // Eski Liman (EL)
    ['EL_01', 'common', 'wiggler', 8, 14, 'fish', '#b8c7d1', '#6c8496', 'plain', ['badge'], 'İlk iş gününde suya düştü; hâlâ oryantasyon sunumunda.'],
    ['EL_02', 'common', 'calm', 12, 20, 'fish', '#9fb3c0', '#4e6a7c', 'stripes', ['cap'], 'Vergisini öder, sırasını bekler, kimseye bulaşmaz.'],
    ['EL_03', 'common', 'calm', 20, 34, 'fish', '#a6a89a', '#5d6153', 'plain', ['tie', 'glasses'], 'Mesai 17:00\'de biter. 16:59\'da oltaya gelmez.'],
    ['EL_04', 'common', 'calm', 10, 18, 'fish', '#dfe6ea', '#9aa8b2', 'scales', ['nightcap', 'sleepy'], 'Isırmayı unutur, uyanınca kibarca özür diler.'],
    ['EL_05', 'uncommon', 'heavy', 30, 52, 'fish', '#8fa3a8', '#46585d', 'scales', ['glasses', 'mustache'], 'Kırk yıl çalıştı; şimdi dalgaların arasında tavla oynuyor.'],
    ['EL_06', 'uncommon', 'berserk', 9, 20, 'crab', '#e0623a', '#8c2c16', 'plain', ['angry'], 'Her şeye itirazı var. Özellikle oltaya.'],
    ['EL_07', 'rare', 'runner', 7, 13, 'fish', '#ff8a2b', '#ffffff', 'bands', ['clownnose'], 'Annesini arıyor. Ya da sirki. Ya da çıkışı.'],
    ['EL_08', 'uncommon', 'wiggler', 14, 22, 'flat', '#d8452f', '#f3d9a4', 'rim', ['tea'], 'Sırtında ince belli bardak taşır; bir damla dökmez.'],
    ['EL_09', 'rare', 'trickster', 25, 40, 'fish', '#f5f5f0', '#c9b48a', 'plain', ['wings', 'simit'], 'Yarısı martı, yarısı balık, tamamı simit düşkünü.'],
    ['EL_10', 'epic', 'trickster', 22, 36, 'round', '#c77dab', '#7a3c64', 'spots', ['curlers', 'earrings'], 'Yakalandığını herkese o anlatacak. Hem de abartarak.'],
    ['EL_11', 'legendary', 'heavy', 60, 95, 'fish', '#7a5a3a', '#3b2a1a', 'scales', ['bigmustache', 'cap'], 'Limanın gerçek sahibi. Bıyığı rüzgârın yönünü belirler.'],
    // Tembel Sazlıklar (TS)
    ['TS_01', 'common', 'calm', 25, 45, 'fish', '#6f9bd1', '#e7eef8', 'stripes', ['nightcap'], 'Günün her saati yatma saati.'],
    ['TS_02', 'common', 'trickster', 8, 15, 'frog', '#6e8b3d', '#3e5221', 'camo', [], 'Onu gördüğünü sanıyorsun. Görmüyorsun.'],
    ['TS_03', 'uncommon', 'heavy', 40, 80, 'fish', '#6b5a42', '#3a2e20', 'spots', ['whiskers'], 'Spa\'ya para vermez; çamuru burada bedava.'],
    ['TS_04', 'common', 'runner', 20, 35, 'fish', '#a5b56a', '#e88a7b', 'spots', ['fly'], 'Sineğe atlar, oltaya atlar, hayata atlar.'],
    ['TS_05', 'common', 'calm', 18, 30, 'fish', '#8fae8a', '#d7c7a5', 'spots', ['leaf', 'sleepy'], 'Fotosentez yapmaya çalışıyor. Henüz başaramadı.'],
    ['TS_06', 'rare', 'trickster', 6, 11, 'frog', '#3d4a3a', '#c9302c', 'plain', ['headband'], 'Sessiz, hızlı ve ödev yapmaktan kaçıyor.'],
    ['TS_07', 'uncommon', 'wiggler', 6, 14, 'leech', '#4a3f5c', '#8a7aa8', 'plain', ['raincloud'], 'Seni değil, hayatı emiyor.'],
    ['TS_08', 'uncommon', 'calm', 9, 16, 'frog', '#8bc26a', '#f2c75a', 'plain', ['zen'], 'Namaste. Ama oltan aurasını bozdu.'],
    ['TS_09', 'legendary', 'heavy', 30, 55, 'serpent', '#3e7a5e', '#1d4031', 'spots', ['humps'], 'Efsaneye göre dev bir canavar. Gerçekte avuç kadar ama özgüveni dev.'],
    ['TS_10', 'legendary', 'trickster', 40, 70, 'fish', '#4c2f5c', '#9fd36a', 'spots', ['witchhat'], 'Pazartesileri büyü, salıları dedikodu yapar.'],
    // Paslı Sanayi Kanalı (PSK)
    ['PSK_01', 'common', 'wiggler', 18, 30, 'fish', '#8b8f94', '#c26b2d', 'bolts', ['bolt'], 'Gıcırdar ama çalışır.'],
    ['PSK_02', 'common', 'heavy', 30, 50, 'can', '#c9ccd0', '#d8402f', 'plain', ['label'], 'Son kullanma tarihi: belirsiz.'],
    ['PSK_03', 'uncommon', 'runner', 30, 48, 'fish', '#4c8bc4', '#c8e2f5', 'stripes', ['wifi'], 'Şifresi 12345678. Ama çekmiyor.'],
    ['PSK_04', 'common', 'berserk', 20, 34, 'fish', '#5c6670', '#2c3136', 'plain', ['smoke'], 'Muayenesi geçmiş; hiç umursamıyor.'],
    ['PSK_05', 'uncommon', 'berserk', 35, 60, 'fish', '#8ef24a', '#3d7a1c', 'glow', ['glow'], 'Karanlıkta parlar. Aydınlıkta da. Fazla düşünme.'],
    ['PSK_06', 'rare', 'trickster', 30, 55, 'octo', '#9aa7b2', '#5fd3ff', 'plain', ['antenna', 'visor'], 'Sekiz kolunun her biri ayrı güncelleme istiyor.'],
    ['PSK_07', 'rare', 'runner', 120, 180, 'dolphin', '#3a3f45', '#8a6dc9', 'oil', [], 'Benzin istasyonu görse duygulanır.'],
    ['PSK_08', 'uncommon', 'trickster', 9, 14, 'fish', '#2d2d2d', '#3cff6c', 'plain', ['hood', 'greenglasses'], 'Oltanı çoktan hack\'ledi. Sadece canı sıkıldığı için yakalanıyor.'],
    ['PSK_09', 'common', 'berserk', 18, 28, 'fish', '#b84a3a', '#f2d14a', 'plain', ['teeth', 'bolt'], 'Kalem pille başladı; şimdi araba aküsü istiyor.'],
    ['PSK_10', 'epic', 'wiggler', 6, 10, 'usb', '#3c5fd1', '#c9ccd0', 'plain', [], 'İçinde 2007\'den kalma tatil fotoğrafları var.'],
    ['PSK_11', 'legendary', 'berserk', 140, 220, 'shark', '#8a949e', '#e04a3a', 'plates', ['visor'], 'Prototip. Garantisi bitti, ısırması bitmedi.'],
    // Yakamoz Koyu (YK)
    ['YK_01', 'common', 'wiggler', 15, 25, 'round', '#d9dde6', '#b07cff', 'mirror', ['sparkle'], 'Her gece 70\'ler gecesi.'],
    ['YK_02', 'uncommon', 'trickster', 20, 35, 'round', '#3d2f6b', '#ffd36b', 'plain', ['lure', 'phone'], 'Fenerini ring light olarak kullanıyor.'],
    ['YK_03', 'common', 'calm', 22, 34, 'fish', '#ff4fb3', '#3ff2ff', 'neon', ['glow'], 'Kendi kendine parlıyor; elektrik faturası ödemiyor.'],
    ['YK_04', 'common', 'runner', 14, 22, 'fish', '#4fd3ff', '#ff5a8a', 'plain', ['sign'], 'Sırtında "24 SAAT AÇIK" yazıyor. Gerçekten hiç uyumuyor.'],
    ['YK_05', 'uncommon', 'trickster', 8, 16, 'seahorse', '#c9d8ff', '#7f8cff', 'ghost', [], 'Bazen orada. Bazen değil. Genelde değil.'],
    ['YK_06', 'rare', 'berserk', 35, 60, 'octo', '#4a1f3d', '#d2304a', 'plain', ['fangs', 'cape'], 'Kan değil, mürekkep emer. Diyette.'],
    ['YK_07', 'uncommon', 'wiggler', 14, 22, 'fish', '#2a2f6b', '#fff2a8', 'stars', ['sparkle'], 'Bir dilek tut. Ama oltayı bırakma.'],
    ['YK_08', 'common', 'runner', 9, 14, 'fish', '#8a8ea0', '#2a2a30', 'plain', ['camera'], 'Flaşı patlatıp kaçar. Her seferinde.'],
    ['YK_09', 'epic', 'berserk', 10, 18, 'shrimp', '#ff7a5c', '#ff2a2a', 'plain', ['laser'], 'Küçük ama tehlikeli. Gözlerine uzun süre bakma.'],
    ['YK_10', 'legendary', 'heavy', 180, 260, 'whale', '#c9d6ff', '#6f7fd1', 'glow', ['moon'], 'Annesi gökyüzünde; ay olarak çalışıyor.'],
    // Titrek Buzullar (TB)
    ['TB_01', 'common', 'runner', 40, 70, 'fish', '#e8846a', '#c9302c', 'plain', ['scarf'], 'Annesi ördü. Çıkarmıyor.'],
    ['TB_02', 'common', 'calm', 10, 18, 'can', '#cfefff', '#8fd3f5', 'ice', ['ice'], 'Bardağa girmekten çok korkuyor.'],
    ['TB_03', 'uncommon', 'heavy', 300, 480, 'whale', '#7f93a8', '#c9d6e0', 'plain', ['scarf', 'sneeze'], 'Hapşırdığında sahil boyunca dalga uyarısı veriliyor.'],
    ['TB_04', 'common', 'calm', 40, 70, 'fish', '#9aa49a', '#e8e0c9', 'spots', ['blank'], 'Bakar. Sadece bakar. Sonsuza dek.'],
    ['TB_05', 'uncommon', 'runner', 45, 70, 'penguin', '#2a2f3a', '#ffffff', 'plain', ['scarf'], 'Teknik puanı 9.8, sanatsal puanı 10.'],
    ['TB_06', 'rare', 'heavy', 200, 320, 'mammoth', '#8a5a3a', '#e8dcc0', 'fur', [], 'Buzdan çıktı; kira ödemeyi reddediyor.'],
    ['TB_07', 'uncommon', 'berserk', 20, 38, 'crab', '#f2f5f8', '#9fb3c4', 'fur', [], 'Fotoğrafı hep bulanık çıkar.'],
    ['TB_08', 'common', 'wiggler', 90, 140, 'seal', '#8a8f9a', '#5a3a2a', 'spots', ['mug'], 'Marşmelov yoksa konuşmuyor.'],
    ['TB_09', 'epic', 'trickster', 25, 40, 'can', '#c94a3a', '#e8c94a', 'plain', ['steam'], 'İçi hep sıcak, dışı hep demli.'],
    ['TB_10', 'legendary', 'heavy', 280, 420, 'serpent', '#9fe2ff', '#2b6d94', 'ice', ['icecrown'], 'Buzul çağından kalma; hâlâ ısınamadı.'],
    // Batık Korsan Mezarlığı (BKM)
    ['BKM_01', 'common', 'wiggler', 25, 40, 'fish', '#3fbf6f', '#f2d14a', 'plain', ['eyepatch'], 'Duyduğunu tekrar eder: "Altın! Altın!"'],
    ['BKM_02', 'uncommon', 'berserk', 20, 32, 'fish', '#6a7a3a', '#f0c040', 'plain', ['goldteeth'], 'Diş hekimine hâlâ borcu var.'],
    ['BKM_03', 'common', 'trickster', 20, 35, 'fish', '#c9b8a0', '#5a4a3a', 'spikes', ['skull'], 'Korkutucu görünür ama aslında çok duygusal.'],
    ['BKM_04', 'common', 'runner', 30, 50, 'fish', '#5a6a7a', '#c9ccd0', 'plain', ['hooktail'], 'Kendi oltası var. Asıl sen onun oltasındasın.'],
    ['BKM_05', 'rare', 'heavy', 25, 45, 'crab', '#8a5a2a', '#f0c040', 'plain', ['chest'], 'Sırtındaki sandık boş. Bunu kimseye söyleme.'],
    ['BKM_06', 'uncommon', 'berserk', 120, 200, 'fish', '#3a5a8a', '#c9d6e0', 'plain', ['sword', 'nosesword'], 'Kılıcı yetmedi, bir de kılıç kuşandı.'],
    ['BKM_07', 'uncommon', 'trickster', 25, 40, 'fish', '#2f4a5a', '#7dffc8', 'ghost', ['curse'], 'Onu yiyen yedi yıl hıçkırık tutar.'],
    ['BKM_08', 'common', 'calm', 30, 50, 'ghost', '#e8f5f0', '#7dffc8', 'ghost', ['bandana'], 'Gemi battı; o hâlâ güverteyi siliyor.'],
    ['BKM_09', 'epic', 'trickster', 40, 70, 'octo', '#8a6a4a', '#e8d8b0', 'map', [], 'Hazinenin yerini biliyor. Ama haritayı yuttu.'],
    ['BKM_10', 'legendary', 'berserk', 90, 150, 'octo', '#8a2a4a', '#f08aa8', 'spots', ['captain'], 'Amcası gibi olmak istiyor. Henüz cep boy.'],
    // Kaynar Kazan Deltası (KKD)
    ['KKD_01', 'common', 'wiggler', 25, 40, 'lobster', '#e8402a', '#ffb08a', 'plain', ['steam'], 'Sauna biraz fazla geldi.'],
    ['KKD_02', 'common', 'berserk', 15, 25, 'fish', '#e8502a', '#ffd04a', 'flames', ['pepper'], 'Seni ısırırsa ağzın yanar. Mantığı sorma.'],
    ['KKD_03', 'uncommon', 'calm', 100, 150, 'seal', '#9a6a5a', '#ffffff', 'plain', ['towel'], 'Havlusu hep başında, keyfi hep yerinde.'],
    ['KKD_04', 'common', 'berserk', 18, 28, 'fish', '#b8642a', '#f0c040', 'crispy', ['teeth'], 'Kıtır kıtır ama hâlâ sinirli.'],
    ['KKD_05', 'uncommon', 'trickster', 25, 38, 'fish', '#8a8a90', '#2a2a2a', 'plain', ['coaleyes'], 'Bakışları közden.'],
    ['KKD_06', 'uncommon', 'heavy', 60, 100, 'turtle', '#4a3a3a', '#ff6a2a', 'lava', [], 'Kabuğunda mangal yapılır; kendisi izin vermez.'],
    ['KKD_07', 'rare', 'runner', 10, 16, 'fish', '#c9302c', '#ffd04a', 'plain', ['dragonwings'], 'Ateş püskürmeye çalışıyor. Hıçkırık çıkıyor.'],
    ['KKD_08', 'common', 'runner', 25, 40, 'fish', '#2a2a2a', '#ff6a2a', 'cracks', ['ember'], 'Biraz fazla pişti. Kendini hâlâ taze sanıyor.'],
    ['KKD_09', 'rare', 'wiggler', 30, 50, 'round', '#e8e0d0', '#c9d6e0', 'plain', ['towel', 'steam'], 'Kese ister, köpük ister, huzur ister.'],
    ['KKD_10', 'epic', 'heavy', 80, 130, 'turtle', '#1a1a22', '#7a5aff', 'glass', [], 'Kabuğu ayna gibi; kendine hayran.'],
    ['KKD_11', 'legendary', 'berserk', 70, 110, 'phoenix', '#ff6a2a', '#ffd04a', 'flames', ['flamecrown'], 'Her yakalanışında küllerinden yeniden doğar. Fiyatı da.'],
    // Bermuda Girdabı (BG)
    ['BG_01', 'common', 'heavy', 80, 140, 'fish', '#8a3a3a', '#c9ccd0', 'plain', ['magnet'], 'Pusulaların neden çıldırdığını açıklıyor.'],
    ['BG_02', 'uncommon', 'wiggler', 80, 140, 'long', '#3a4a8a', '#f2f25a', 'plain', ['sparks'], 'Saçlarını diker; kalbini değil.'],
    ['BG_03', 'uncommon', 'trickster', 50, 80, 'ghost', '#c9fff0', '#3fd2c7', 'ghost', ['captain'], 'Gemi kayıp; mürettebat hâlâ mesaide.'],
    ['BG_04', 'rare', 'trickster', 30, 50, 'fish', '#4a6a8a', '#f0c040', 'plain', ['clock'], 'Yarın yakalanacağını dün biliyordu.'],
    ['BG_05', 'common', 'runner', 30, 45, 'lobster', '#ff5a3a', '#ffd0b0', 'plain', ['wings'], 'Bermuda\'da fizik izinde.'],
    ['BG_06', 'common', 'wiggler', 20, 35, 'round', '#c9a04a', '#3a2a1a', 'plain', ['compass'], 'Kuzey nerede? Ona sorma.'],
    ['BG_07', 'uncommon', 'trickster', 60, 100, 'ray', '#5a4a6a', '#3fd2c7', 'camo', [], 'Burada. Hayır, şurada. Hayır...'],
    ['BG_08', 'rare', 'berserk', 160, 240, 'shark', '#5a6a7a', '#c9d6e0', 'plain', ['twohead'], 'İki başı var; ikisi de aynı fikirde değil.'],
    ['BG_09', 'epic', 'runner', 25, 40, 'fish', '#3fd2c7', '#ff4fb3', 'split', ['twin'], 'O evrende seni o yakalıyor.'],
    ['BG_10', 'epic', 'trickster', 30, 50, 'fish', '#8a8aa0', '#f0c040', 'plain', ['catears', 'box'], 'Hem yakalandı hem yakalanmadı. Kutuya bak.'],
    ['BG_11', 'common', 'calm', 400, 600, 'whale', '#8fb3ff', '#3fd2c7', 'plain', ['bubbles'], 'Yukarı doğru yüzer, aşağı doğru düşünür.'],
    ['BG_12', 'uncommon', 'runner', 20, 40, 'fish', '#ff4fb3', '#3fd2c7', 'glitch', ['error'], 'Bu balık bulunamadı. Yine de oltanda.'],
    ['BG_13', 'common', 'calm', 350, 520, 'whale', '#6a6a8a', '#e8e0c9', 'plain', ['monocle'], 'Su mu balığı taşır, balık mı suyu?'],
    ['BG_14', 'legendary', 'trickster', 40, 70, 'fish', '#2a2f3a', '#5ff5e0', 'plain', ['headphones', 'glasses'], 'Bu oyunu o yazdı. Hatalar özellik.'],
    ['BG_15', 'boss', 'boss', 900, 1400, 'kraken', '#5a1f4a', '#c94a8a', 'spots', [], 'Bermuda\'nın sahibi. "Uyandırma" dediler. Uyandırdın.']
  ];

  const order = Object.fromEntries(D.REGION_ORDER.map((c, i) => [c, i + 1]));
  const RAR_HP = { common: 1, uncommon: 1.25, rare: 1.55, epic: 1.9, legendary: 2.6, boss: 4.6 };
  const RAR_STR = { common: 0, uncommon: 0.06, rare: 0.12, epic: 0.2, legendary: 0.32, boss: 0.45 };
  const RAR_W = { common: 60, uncommon: 26, rare: 10, epic: 3.4, legendary: 2.2, boss: 4 };
  // Davranış aileleri: her biri ayrı hamle seti kullanır (systems/Fishing.js → MOVESETS).
  const BEH = {
    calm: { hp: 0.9, str: 0.0, tens: 0.85, esc: 0.8, dist: 0, moveEvery: [3.6, 5.2] },
    wiggler: { hp: 0.95, str: 0.03, tens: 1.0, esc: 0.9, dist: 0, moveEvery: [1.3, 2.0] },
    runner: { hp: 0.9, str: 0.04, tens: 0.95, esc: 1.45, dist: 6, moveEvery: [2.6, 3.8] },
    heavy: { hp: 1.35, str: 0.12, tens: 1.15, esc: 0.75, dist: 2, moveEvery: [3.0, 4.2] },
    trickster: { hp: 1.0, str: 0.05, tens: 1.05, esc: 1.05, dist: 2, moveEvery: [2.2, 4.6] },
    berserk: { hp: 1.05, str: 0.1, tens: 1.25, esc: 1.0, dist: 0, moveEvery: [1.8, 2.6] },
    boss: { hp: 1.0, str: 0.12, tens: 1.15, esc: 1.0, dist: 10, moveEvery: [1.8, 3.0] }
  };

  const out = {};
  for (const r of ROWS) {
    const [id, dr, beh, smin, smax, shape, c1, c2, pattern, acc, desc] = r;
    const src = D.FishDBSource.FishDB[id];
    if (!src) throw new Error('FishBalanceDB: kaynakta olmayan ID ' + id);
    const sourceRarity = src.rarity; // null | 'legendary' | 'boss'
    const rarity = sourceRarity || dr;
    const t = order[src.regionCode];
    const b = BEH[beh];
    const jitter = 0.9 + (D.RNG.hashStr(id) % 1000) / 1000 * 0.2; // ±%10 deterministik
    const stamina = Math.round(36 * (1 + 0.3 * (t - 1)) * RAR_HP[rarity] * b.hp * jitter);
    out[id] = {
      id, regionCode: src.regionCode, sourceRarity, rarity, rarityDerived: sourceRarity == null,
      behavior: beh, sizeMin: smin, sizeMax: smax, shape, colors: [c1, c2], pattern, acc, collectionText: desc,
      basePrice: Math.max(1, Math.round(D.EconomyConfig.regionBase[src.regionCode] * D.EconomyConfig.rarityMult[rarity] * jitter)),
      stamina,
      strength: Math.round((0.42 + 0.055 * (t - 1) + RAR_STR[rarity] + b.str) * 1000) / 1000,
      tensionSensitivity: Math.round(b.tens * (1 + 0.03 * (t - 1)) * 1000) / 1000,
      escapeRate: Math.round((1.6 + 0.12 * (t - 1)) * b.esc * 1000) / 1000, // m/sn gevşeklikte uzaklaşma
      escapePressure: Math.round(b.esc * 100) / 100,
      startDistance: Math.round(16 + t * 1.5 + b.dist + (rarity === 'legendary' ? 4 : 0)),
      moveEvery: b.moveEvery,
      spawnWeight: RAR_W[rarity],
      tier: t
    };
  }
  D.FishBalanceDB = D.deepFreeze(out);
  D.FISH_BEHAVIOR_PARAMS = D.deepFreeze(BEH);
  D.RARITY_SPAWN_WEIGHT = D.deepFreeze(RAR_W);
})(globalThis.DUMEN);
