// ItemBalanceDB — ItemDB'deki 102 kaydın TÜRETİLMİŞ oyun verisi (fiyat, stat, etki parametresi, ikon, edinim).
// Kaynak ItemDBSource'taki null fiyat "bilinmiyor" demektir; burada önerilen denge fiyatı atanır (0'a çevrilmez).
// BM_01..06 için kaynakta verilen Miyav fiyatları (30/45/65/90/120/160) aynen kullanılır.
(function (D) {
  'use strict';
  const B = {};
  const set = (id, o) => { B[id] = Object.assign({ id }, o); };

  // ---- 9 OLTA (GDD §10) ----
  // ls: ip dayanımı (kırmızı bölge toleransı), rs: sarma hızı, ct: kontrol (gerilim birikimini azaltır),
  // sd: İnat hasarı, tb: hazine zamanlama bonusu (yeşil/sarı genişler), rh: nadir balık desteği, reelTension: sarma gerilim çarpanı
  const rod = (id, o) => set(id, Object.assign({ slot: 'rod', icon: 'rod', ls: 1, rs: 1, ct: 0, sd: 1, tb: 0, rh: 0, reelTension: 1, regionBonus: {} }, o));
  rod('ROD_01', { price: 0, source: 'starter', color: '#a8743a', role: 'Başlangıç' });
  rod('ROD_02', { price: 380, source: 'market', color: '#3d8fe0', ls: 1.12, rs: 1.1, ct: 0.1, sd: 1.15, tb: 0.04, rh: 0.05, role: 'Dengeli genel performans' });
  rod('ROD_03', { price: 950, source: 'market', color: '#6b6f74', ls: 1.45, rs: 0.95, ct: 0.14, sd: 1.2, tb: 0.03, rh: 0.1, role: 'Daha iyi ip dayanımı', unlockRegion: 'TS' });
  rod('ROD_04', { price: 1500, source: 'market', color: '#e0453d', ls: 1.05, rs: 1.6, ct: 0.04, sd: 1.38, tb: 0.08, rh: 0.05, reelTension: 1.22, role: 'Hızlı sarma, riskli agresif oyun', unlockRegion: 'PSK' });
  rod('ROD_05', { price: 3600, source: 'market', color: '#f0a81c', ls: 1.5, rs: 1.32, ct: 0.24, sd: 1.5, tb: 0.1, rh: 0.2, role: 'İleri seviye genel kullanım', unlockRegion: 'YK' });
  // Craft oltaları: kendi bölgelerinde açıkça üstün, dışarıda Usta'dan biraz zayıf (GDD §10.3).
  rod('ROD_06', { price: null, source: 'craft', color: '#9fe2ff', ls: 1.38, rs: 1.22, ct: 0.2, sd: 1.38, tb: 0.06, rh: 0.15, regionBonus: { TB: { sd: 1.45, ls: 1.2, envImmune: true } }, role: 'Titrek Buzullar avantajı' });
  rod('ROD_07', { price: null, source: 'craft', color: '#ff6a2a', ls: 1.4, rs: 1.25, ct: 0.18, sd: 1.45, tb: 0.06, rh: 0.15, regionBonus: { KKD: { sd: 1.45, ct: 0.15, envImmune: true } }, role: 'Kaynar Kazan Deltası avantajı' });
  rod('ROD_08', { price: null, source: 'craft', color: '#c26b2d', ls: 1.35, rs: 1.15, ct: 0.16, sd: 1.32, tb: 0.06, rh: 0.1, regionBonus: { PSK: { sd: 1.4, ls: 1.25, envImmune: true } }, role: 'Paslı Sanayi Kanalı avantajı' });
  rod('ROD_09', { price: null, source: 'craft', color: '#b07cff', ls: 1.42, rs: 1.25, ct: 0.22, sd: 1.4, tb: 0.08, rh: 0.25, regionBonus: { YK: { sd: 1.35, rh: 0.2, envImmune: true }, BG: { sd: 1.35, ct: 0.12, envImmune: true } }, role: 'Yakamoz Koyu ve Bermuda Girdabı avantajı' });

  // ---- 4 MİSİNA / 4 KANCA / 3 ŞAMANDIRA ----
  const gear = (slot, id, o) => set(id, Object.assign({ slot, icon: slot, mods: {} }, o));
  gear('line', 'LINE_01', { price: 0, source: 'starter', color: '#e8e8e0', mods: {}, role: 'Standart misina' });
  gear('line', 'LINE_02', { price: 650, source: 'market', color: '#8a949e', mods: { ls: 0.25, ct: -0.04 }, role: 'Kopmaya dayanıklı, biraz sert', unlockRegion: 'TS' });
  gear('line', 'LINE_03', { price: null, source: 'craft', color: '#b07cff', mods: { ls: 0.1, clarity: true }, role: 'Karanlıkta parlar; sahte siluetleri ayırt ettirir' });
  gear('line', 'LINE_04', { price: null, source: 'craft', color: '#9fe2ff', mods: { ls: 0.15, coldImmune: true }, role: 'Soğukta donmaz (Titrek Buzullar sarma cezası yok)' });
  gear('hook', 'HOOK_01', { price: 0, source: 'starter', color: '#8a8a80', mods: { escapeSlip: 0.06 }, role: 'Körelmiş; balık ara sıra kayar' });
  gear('hook', 'HOOK_02', { price: 260, source: 'market', color: '#d9dde6', mods: { sd: 0.1 }, role: 'İnat hasarı +%10' });
  gear('hook', 'HOOK_03', { price: 820, source: 'market', color: '#c9ccd0', mods: { treasure: 0.04, trash: -0.03 }, role: 'Hazineye takılma +%4, çöp −%3', unlockRegion: 'PSK' });
  gear('hook', 'HOOK_04', { price: null, source: 'craft', color: '#f0c040', mods: { treasure: 0.07, ghostReveal: true, sd: 0.05 }, role: 'Hazine +%7; Korsan Mezarlığı\'nda sinyalsiz hamleleri gösterir' });
  gear('float', 'FLOAT_01', { price: 0, source: 'starter', color: '#e0453d', mods: {}, role: 'Klasik şamandıra' });
  gear('float', 'FLOAT_02', { price: 320, source: 'market', color: '#5a5f66', mods: { wait: -0.15, heavyBias: 1.25 }, role: 'Derine iner: bekleme −%15, Ağır balık ağırlığı ×1.25' });
  gear('float', 'FLOAT_03', { price: 950, source: 'market', color: '#3ff2ff', mods: { clarity: true, rarityHint: true }, role: 'Siluetlerin nadirlik çerçevesini gösterir; karanlık sularda net', unlockRegion: 'YK' });

  // ---- 14 YEM (GDD §11) — atış başına 1 adet tüketilir ----
  // wait: bekleme çarpanı, rare: Nadir+ ağırlık çarpanı, leg: Efsanevi/Boss çarpanı, region: bölge balığı çarpanı
  const bait = (id, o) => set(id, Object.assign({ slot: 'bait', icon: 'bait', wait: 1, rare: 1, leg: 1, region: null, regionMult: 1, behaviorBias: null, trash: 1, treasure: 1 }, o));
  bait('BAIT_01', { price: 6, color: '#e8d2a0', wait: 0.9, common: 1.15, role: 'Basit yem: Yaygın/Sıradışı küçük avantaj' });
  bait('BAIT_02', { price: 9, color: '#c97a6a', wait: 0.62, role: 'Kokulu yem: bekleme −%38' });
  bait('BAIT_03', { price: 9, color: '#f2d14a', region: 'TS', regionMult: 1.4, behaviorBias: { calm: 1.3 }, role: 'Tembel Sazlıklar bölge yemi' });
  bait('BAIT_04', { price: 12, color: '#6a5a8a', region: 'EL', regionMult: 1.3, uncommon: 1.3, role: 'Eski Liman bölge yemi; Sıradışı ×1.3' });
  bait('BAIT_05', { price: 20, color: '#ff9a7a', rare: 1.28, role: 'Parlak yem: Nadir ve üstü ×1.28' });
  bait('BAIT_06', { price: 16, color: '#d9a05a', wait: 0.8, favorite: 'EL_09', favoriteMult: 3, role: 'Simit Seven Martı-Balığı ×3, bekleme −%20' });
  bait('BAIT_07', { price: 24, color: '#c26b2d', region: 'PSK', regionMult: 1.4, trash: 0.8, role: 'Paslı Sanayi bölge yemi; çöp −%20', unlockRegion: 'PSK' });
  bait('BAIT_08', { price: 38, color: '#b07cff', region: 'YK', regionMult: 1.35, rare: 1.15, role: 'Yakamoz bölge yemi; Nadir+ ×1.15', unlockRegion: 'YK' });
  bait('BAIT_09', { price: 48, color: '#9fe2ff', region: 'TB', regionMult: 1.4, role: 'Titrek Buzullar bölge yemi', unlockRegion: 'TB' });
  bait('BAIT_10', { price: 64, color: '#ff6a2a', region: 'KKD', regionMult: 1.4, behaviorBias: { berserk: 1.2 }, role: 'Kaynar Kazan bölge yemi', unlockRegion: 'KKD' });
  bait('BAIT_11', { price: 58, color: '#c9fff0', region: 'BKM', regionMult: 1.4, treasure: 1.25, role: 'Korsan Mezarlığı bölge yemi; hazine ×1.25', unlockRegion: 'BKM' });
  bait('BAIT_12', { price: 260, color: '#f0a81c', leg: 2.1, role: 'Efsanevi yem: Efsanevi/Boss ×2.1 (garanti değil)', unlockRegion: 'YK' });
  bait('BAIT_13', { price: 45, color: '#a33a2a', suspicious: true, role: 'Şüpheli kara pazar yemi: her atışta rastgele etki', unlockFlag: 'wheelUnlocked' });
  bait('BAIT_14', { price: 85, color: '#d9dde6', region: 'BG', regionMult: 1.35, treasure: 1.2, role: 'Bermuda bölge yemi; parlar, hazine ×1.2', unlockRegion: 'BG' });

  // ---- 25 ÖZEL EŞYA — kaynak effect metni aynen gösterilir; mekanik parametreleri türetilmiştir ----
  // kind: passive (takılıyken sürekli), charge (takılıyken av başına/sefer başına 1 kullanım, tükenmez), consumable (kullanınca 1 adet düşer)
  const spc = (id, o) => set(id, Object.assign({ slot: 'special', icon: 'spc_' + id.slice(4) }, o));
  spc('SPC_01', { kind: 'passive', price: 140, params: { asilmaDelay: 2.0 }, mech: 'Asılma hamlesinin uyarı + başlangıcı 2 sn gecikir (oyuncu hazırlanır).' });
  spc('SPC_02', { kind: 'passive', price: 160, params: { sonCirpinisTensionMult: 0.6 }, mech: 'Son Çırpınış evresinde gerilim artışı ×0.6.' });
  spc('SPC_03', { kind: 'passive', price: null, params: { revealFirst: true }, mech: 'Mücadele başlarken ilk hamlenin türü ve zamanı ekranda yazılır.' });
  spc('SPC_04', { kind: 'passive', price: null, params: { warnAhead: 0.9 }, mech: 'Gerilim 0,9 sn içinde dolacaksa yanıp sönen uyarı.' });
  spc('SPC_05', { kind: 'passive', price: null, params: { behaviorBias: { calm: 1.5, wiggler: 1.3 } }, mech: 'Sakin (tembel) ×1.5 ve Kıpır (dengeli) ×1.3 karşılaşma ağırlığı.' });
  spc('SPC_06', { kind: 'passive', price: null, params: { telegraphBonus: 0.3 }, mech: 'Her hamlenin görsel uyarısı 0,3 sn daha erken gelir.' });
  spc('SPC_07', { kind: 'passive', price: null, params: { mistakeSpikeMult: 0.5 }, mech: 'Hata (kırmızı bölge girişi / erken Çek) sonrası ani gerilim sıçraması %50 azalır.' });
  spc('SPC_08', { kind: 'passive', price: 180, params: { inputLag: 0.06 }, mech: 'Sarma tepki süresi 0,22 sn → 0,06 sn.' });
  spc('SPC_09', { kind: 'passive', price: null, params: { dipFreeze: true }, mech: 'Dip Yapma süresince gerilim değeri sabit kalır.' });
  spc('SPC_10', { kind: 'passive', price: 120, params: { trashMult: 0.5, hpMult: 1.1 }, mech: 'Çöp ihtimali ×0.5; gelen balığın İnat (HP) değeri ×1.10.' });
  spc('SPC_11', { kind: 'passive', price: null, params: { snapSave: 0.25 }, mech: 'İp kopacağı anda %25 ihtimalle kurtarır (av başına 1 kez denenir).' });
  spc('SPC_12', { kind: 'passive', price: null, params: { rareMult: 1.35, extraMoves: 1 }, mech: 'Nadir+ ağırlık ×1.35; balığın her hamle döngüsüne +1 hamle eklenir.' });
  spc('SPC_13', { kind: 'passive', price: null, params: { escapeSave: 0.15 }, mech: 'Balık kaçacağı anda %15 ihtimalle tutar (av başına 1 kez denenir).' });
  spc('SPC_14', { kind: 'charge', price: null, params: { perTrip: true }, mech: 'Seferin ilk karşılaşmasında siluetleri bir kez yeniden zarlatır.' });
  spc('SPC_15', { kind: 'charge', price: null, params: { perFight: true }, mech: 'Mücadele sırasında kalan hamle dizilimini bir kez yeniden karıştırır.' });
  spc('SPC_16', { kind: 'passive', price: null, params: { asilmaTensionMult: 0.55, dipDurationMult: 1.6 }, mech: 'Asılma gerilimi ×0.55; Dip Yapma süresi ×1.6 (ödünleşim).' });
  spc('SPC_17', { kind: 'passive', price: null, params: { regular: true }, mech: 'Hamle aralıkları eşit ve tahmin edilebilir olur.' });
  spc('SPC_18', { kind: 'passive', price: null, params: { behaviorBias: { heavy: 1.7 }, tensionMult: 1.1 }, mech: 'Ağır/İnatçı balık ×1.7; genel gerilim +%10.' });
  spc('SPC_19', { kind: 'consumable', price: null, miyavPrice: 25, params: { tensionCut: 0.4 }, mech: 'Gerilim %40 düşer; balık hemen Son Çırpınış evresine geçer (İnat eşik değerine iner).' });
  spc('SPC_20', { kind: 'consumable', price: null, miyavPrice: 20, params: { noAsilma: 20 }, mech: '20 sn Asılma hamlesi gelmez; Son Çırpınış evresi etkilenmez.' });
  spc('SPC_21', { kind: 'passive', price: 150, params: { tensionMult: 0.85 }, mech: 'Gerilim dolum hızı ×0.85.' });
  spc('SPC_22', { kind: 'charge', price: null, params: { perFight: true }, mech: 'Uyarısı görünen / süren bir hamleyi iptal eder (av başına 1).' });
  spc('SPC_23', { kind: 'passive', price: 130, params: { mistakePause: 1.4 }, mech: 'Hata sonrası balık 1,4 sn duraklar.' });
  spc('SPC_24', { kind: 'consumable', price: 90, params: { duration: 10, hpLossMult: 1.8, tensionMult: 1.35 }, mech: '10 sn İnat kaybı ×1.8, gerilim dolumu ×1.35.' });
  spc('SPC_25', { kind: 'consumable', price: null, miyavPrice: 18, params: { legMult: 2.0, forceHircin: true, perCast: true }, mech: 'Atışta tüketilir: Efsanevi ağırlık ×2; gelen balık Hırçın (hamleler daha sık/güçlü).' });

  // ---- 18 MATERYAL ----
  const mat = (id, icon, color, sources, sell) => set(id, { slot: 'material', icon, color, sources, sell });
  mat('MAT_SCRAP', 'scrapmetal', '#8a8f94', 'Her bölgenin çöpü (fabrika ayrıştırma), Teneke Sandık', 3);
  mat('MAT_02', 'plate', '#c26b2d', 'Paslı Sanayi çöpü, Teneke Sandık, PSK balık geri dönüşümü', 5);
  mat('MAT_03', 'bolts', '#9aa7b2', 'Eski Liman/Sazlık/Sanayi çöpü, Islak Karton Sandık', 3);
  mat('MAT_04', 'spring', '#b8c0c8', 'Teneke Sandık, Kilitli Kasa, Sanayi çöpü', 6);
  mat('MAT_05', 'gears', '#d9a05a', 'Paslı Sanayi çöpü ve sandıkları', 6);
  mat('MAT_06', 'motor', '#5a5f66', 'Korsan Mezarlığı / Sanayi çöpü, Kilitli Kasa', 12);
  mat('MAT_07', 'propeller', '#e8c94a', 'Eski Liman / Sazlık / Korsan çöpü', 4);
  mat('MAT_08', 'plastic', '#5fb0e0', 'Hemen her bölgenin çöpü', 2);
  mat('MAT_09', 'cable', '#e0453d', 'Sanayi ve Bermuda çöpü, Yakamoz Sandığı', 7);
  mat('MAT_10', 'crystal', '#9fe2ff', 'Titrek Buzullar: Buzlu Sandık, TB balık geri dönüşümü, çöp', 10);
  mat('MAT_11', 'lavacore', '#ff6a2a', 'Kaynar Kazan: Lava Kasası, KKD balık geri dönüşümü', 14);
  mat('MAT_12', 'pearl', '#e8e0ff', 'Yakamoz Koyu: Yakamoz Sandığı, YK balık geri dönüşümü', 9);
  mat('MAT_13', 'goldscale', '#f0c040', 'Korsan Mezarlığı: Korsan Sandığı, BKM balık geri dönüşümü', 12);
  mat('MAT_14', 'magnet', '#c94a4a', 'Bermuda: Bermuda Mührü Sandığı, BG balık geri dönüşümü', 18);
  mat('MAT_15', 'tooth', '#e8f5ff', 'Titrek Buzullar: Nadir+ balık geri dönüşümü, Buzlu Sandık', 20);
  mat('MAT_16', 'seed', '#c9302c', 'Kaynar Kazan: Nadir+ balık geri dönüşümü, Lava Kasası', 24);
  mat('MAT_17', 'rustcore', '#8a5a2a', 'Paslı Sanayi: Nadir+ balık geri dönüşümü, Teneke Sandık (nadir)', 14);
  mat('MAT_18', 'whisper', '#b07cff', 'Yakamoz Koyu: Nadir+ balık geri dönüşümü, Yakamoz Sandığı (nadir)', 18);

  // ---- 10 SANDIK / 5 ANAHTAR ----
  for (let i = 1; i <= 10; i++) set('CHEST_' + D.pad2(i), { slot: 'chest', icon: 'chest', chestNo: i });
  const key = (id, color, chest) => set(id, { slot: 'key', icon: 'key', color, opens: chest });
  key('KEY_01', '#a86a3a', 'CHEST_08');
  key('KEY_02', '#f0c040', 'CHEST_03');
  key('KEY_03', '#b07cff', 'CHEST_04');
  key('KEY_04', '#9fe2ff', 'CHEST_05');
  key('KEY_05', '#3fd2c7', 'CHEST_07');

  // ---- 6 KARA PAZAR PARÇASI — Zıpırleone'den Miyav ile (kaynak fiyatı), Tekne Atölyesi'nde tekneye takılır ----
  const bm = (id, bonus, text) => {
    const src = D.ItemDBSource.ItemDB[id];
    set(id, { slot: 'black_market_part', icon: 'bmpart', miyavPrice: src.buyPrice, priceSource: 'ItemDB.buyPrice (Miyav)', bonus, mech: text });
  };
  bm('BM_01', { waitMult: 0.85 }, 'Takılınca: atış bekleme süresi −%15.');
  bm('BM_02', { capacity: 6 }, 'Takılınca: ambar kapasitesi +6 balık.');
  bm('BM_03', { grace: 0.25 }, 'Takılınca: kırmızı bölge düzeltme süresi +0,25 sn.');
  bm('BM_04', { rareMult: 1.12 }, 'Takılınca: Nadir+ karşılaşma ×1.12.');
  bm('BM_05', { treasure: 0.03 }, 'Takılınca: hazine karşılaşması +%3.');
  bm('BM_06', { specialSlots: 1 }, 'Takılınca: +1 özel eşya yuvası. (Zıpırleone orta zincir finalinde gerekir.)');

  // ---- 3 PARA BİRİMİ + 1 İZİN ----
  set('CUR_COIN', { slot: 'currency', icon: 'coin', color: '#f0c040', walletKey: 'CUR_COIN', short: 'Coin' });
  set('CUR_SCRAP', { slot: 'currency', icon: 'scrapcur', color: '#9aa7b2', walletKey: 'CUR_SCRAP', short: 'Scrap' });
  set('CUR_MIYAV', { slot: 'currency', icon: 'miyav', color: '#ff8ab8', walletKey: 'CUR_MIYAV', short: 'Miyav' });
  set('TCK_BOATYARD_PERMIT', { slot: 'permit', icon: 'permit', color: '#e8dcc0', price: 1600, mech: 'Tekne Seviye 6 ve üstü tersane işleri için gerekir. Tekne Sv.5 olduktan sonra Tekne Atölyesi\'nden alınır; tüketilmez.' });

  // Kaynak ad/kategori bilgisini birleştir (salt okunur kopya).
  for (const [id, src] of Object.entries(D.ItemDBSource.ItemDB)) {
    if (!B[id]) throw new Error('ItemBalanceDB eksik: ' + id);
    B[id].name = src.name;
    B[id].category = src.category;
    B[id].sourceEffect = src.effect;
  }
  D.ItemBalanceDB = D.deepFreeze(B);
  D.itemName = (id) => (D.ItemDBSource.ItemDB[id] ? D.ItemDBSource.ItemDB[id].name : id);
  D.CATEGORY_TR = { special: 'Özel Eşya', bait: 'Yem', rod: 'Olta', line: 'Misina', hook: 'Kanca', float: 'Şamandıra', material: 'Materyal', chest: 'Sandık', key: 'Anahtar', black_market_part: 'Kara Pazar Parçası', currency: 'Para Birimi', permit: 'İzin' };
})(globalThis.DUMEN);
