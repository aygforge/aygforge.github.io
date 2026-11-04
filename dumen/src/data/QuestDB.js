// QuestDB — Ana görevler, 3 NPC hikâye zinciri (5 + 5 + 3), pano sipariş şablonları, günlük görevler, koleksiyon ödülleri.
// Bölüm adları ve sonuçları kanonik (GDD §19–21); adımlar/ödüller/sayılar türetilmiştir.
(function (D) {
  'use strict';
  const it = (id, n) => ({ type: 'item', id, n: n || 1 });
  const coin = (n) => ({ type: 'coin', n });
  const miyav = (n) => ({ type: 'miyav', n });
  const scrap = (n) => ({ type: 'scrap', n });
  const cos = (id) => ({ type: 'cosmetic', id });
  const rel = (npc, n) => ({ type: 'rel', npc, n });
  const chest = (id) => ({ type: 'chest', id });

  // ---------- ANA GÖREVLER ----------
  const MQ = (id, title, desc, cond, rewards, after) => ({ id, title, desc, cond, rewards, after: after || null });
  const main = [
    MQ('MQ_01', 'İlk Av', 'Teknene bin, Balığa Çık ve bir balık yakala.', { stat: 'fishCaught', gte: 1 }, [coin(40), it('BAIT_02', 3)]),
    MQ('MQ_02', 'Rüstem\'le Tanış', 'Balık Pazarı\'nda Rüstem\'e bir balık sat.', { stat: 'fishSold', gte: 1 }, [coin(30)], 'MQ_01'),
    MQ('MQ_03', 'Panoya Göz At', 'Evinin yanındaki ilan panosundan bir sipariş kabul et.', { stat: 'ordersAccepted', gte: 1 }, [it('BAIT_01', 5)], 'MQ_02'),
    MQ('MQ_04', 'Yamalı Kayık', 'Tekne Atölyesi\'nde tekneni Seviye 2\'ye yükselt. (Liman Sokağı)', { boat: 2 }, [coin(80)], 'MQ_02'),
    MQ('MQ_05', 'Hazine Kokusu', 'Oltayla bir sandık yakala (zamanlama barı).', { stat: 'chestsCaught', gte: 1 }, [it('MAT_03', 2)], 'MQ_01'),
    MQ('MQ_06', 'Sandık Açılışı', 'Envanterden bir sandık aç.', { stat: 'chestsOpened', gte: 1 }, [coin(50)], 'MQ_05'),
    MQ('MQ_07', 'Hurdacıyla Tanış', 'Hurdacı Hasan\'da bir şey üret ya da erit.', { stat: 'crafted', gte: 1 }, [scrap(20)], 'MQ_04'),
    MQ('MQ_08', 'Paslı Sulara', 'Paslı Sanayi Kanalı\'nı aç (Tekne Sv.3).', { region: 'PSK' }, [coin(150)], 'MQ_04'),
    MQ('MQ_09', 'Rüstem\'in Eldiveni', 'Rüstem\'e toplam 40 balık sat.', { stat: 'fishSold', gte: 40 }, [it('SPC_09', 1), rel('rustem', 10)], 'MQ_02'),
    MQ('MQ_10', 'Özel Olta', 'Hurdacı Hasan\'dan bir özel olta üret.', { ownsAny: ['ROD_06', 'ROD_07', 'ROD_08', 'ROD_09'] }, [coin(300)], 'MQ_08'),
    MQ('MQ_11', 'Yakamoz Işıkları', 'Yakamoz Koyu\'nu aç (Tekne Sv.4).', { region: 'YK' }, [coin(300), it('BAIT_08', 3)], 'MQ_08'),
    MQ('MQ_12', 'Buz Gibi', 'Titrek Buzullar\'ı aç (Tekne Sv.5).', { region: 'TB' }, [coin(500)], 'MQ_11'),
    MQ('MQ_13', 'Korsan Rotası', 'Batık Korsan Mezarlığı\'nı aç (Tekne Sv.6 + Tersane İzni).', { region: 'BKM' }, [coin(700), it('KEY_02', 1)], 'MQ_12'),
    MQ('MQ_14', 'Efsane Peşinde', 'Herhangi bir Efsanevi balık yakala.', { stat: 'legendaryCaught', gte: 1 }, [coin(500), it('BAIT_12', 1)], 'MQ_08'),
    MQ('MQ_15', 'Kaynar Sular', 'Kaynar Kazan Deltası\'nı aç (Tekne Sv.8).', { region: 'KKD' }, [coin(900)], 'MQ_13'),
    MQ('MQ_16', 'Altın Dümen', 'Tekneni Seviye 10\'a çıkar.', { boat: 10 }, [cos('COS_HAT_CAPTAIN'), coin(1000)], 'MQ_15'),
    MQ('MQ_17', 'Bermuda Girdabı', 'Bermuda Girdabı\'nı aç (Sv.10 + koordinatlar).', { region: 'BG' }, [coin(1500)], 'MQ_16'),
    MQ('MQ_18', 'Son Av: Antik Kraken', 'Bermuda\'nın sahibini, Antik Kraken\'i yakala.', { stat: 'bossCaught', gte: 1 }, [coin(5000), miyav(100)], 'MQ_17'),
    MQ('MQ_19', 'Dört Özel Olta', 'Dört özel oltanın hepsine sahip ol.', { ownsAll: ['ROD_06', 'ROD_07', 'ROD_08', 'ROD_09'] }, [coin(2000)], 'MQ_10')
  ];

  // ---------- HİKÂYE ZİNCİRLERİ ----------
  const C = (id, chain, no, title, summary, unlock, steps, rewards, onComplete) => ({ id, chain, no, title, summary, unlock, steps, rewards, onComplete: onComplete || {} });
  const talk = (npc, dlg, text) => ({ t: 'talk', npc, dlg, text });
  const inspect = (spot, scene, label, dlg, text) => ({ t: 'inspect', spot, scene, label, dlg, text });
  const story = [
    // Tarçov × Zıpırleone — erken (sonuç: ÇARK açılır, mahzen açılmaz; Tarçov kalıcı ayrılır)
    C('T1', 'tarcov', 1, 'Rozetin Gölgesi', 'Müfettiş Tarçov kasabaya geldi ve Don Zıpırleone hakkında soruşturma başlattı.',
      [{ quest: 'MQ_02' }],
      [talk('tarcov', 'T1_tarcov', 'Kasabada Müfettiş Tarçov ile konuş (Belediye önünde).'), inspect('zip_crates', 'zip', 'Şüpheli Sandıklar', 'T1_inspect', 'Liman Sokağı\'ndaki Karanlık Mahalle\'de (Zıpırleone\'nin Mekanı) şüpheli sandıkları incele.'), talk('zip', 'T1_zip', 'Zıpırleone\'nin Mekanı\'nda Don ile konuş.')],
      [it('SPC_04', 1), rel('zip', 10), rel('tarcov', 10)]),
    C('T2', 'tarcov', 2, 'Miyav Puanı Meselesi', 'Miyav Puanı nedir? Herkes başka şey söylüyor.',
      [{ chapter: 'T1' }],
      [talk('tarcov', 'T2_tarcov', 'Tarçov ile konuş.'), talk('rustem', 'T2_rustem', 'Rüstem Aga\'ya Miyav Puanı\'nı sor (sahil).'), talk('hasan', 'T2_hasan', 'Hurdacı Hasan\'a sor.'), talk('kaya', 'T2_kaya', 'Kaya Usta\'ya sor (Belediye Binası, Denizin Defteri arşivi).'), talk('zip', 'T2_zip', 'Zıpırleone ile konuş.'),
        { t: 'deliver', npc: 'zip', filter: { rarityMin: 'rare' }, n: 1, dlg: 'T2_zip_done', text: 'Don\'a 1 Nadir veya daha iyi balık götür.' }],
      [miyav(12), it('SPC_03', 1), rel('zip', 10)]),
    C('T3', 'tarcov', 3, 'Resmi Uyarı', 'Tarçov, Komplo Teorisyeni\'ni resmen uyarır.',
      [{ chapter: 'T2' }, { boat: 2 }],
      [talk('tarcov', 'T3_tarcov', 'Tarçov ile konuş.'), talk('komplo', 'T3_komplo', 'Komplo Teorisyeni\'nin yanında uyarıya tanık ol.')],
      [it('SPC_07', 1), rel('zip', 10), rel('komplo', 10)]),
    C('T4', 'tarcov', 4, 'Kanıt Yok', 'Şüphe büyür ama somut kanıt bulunamaz.',
      [{ chapter: 'T3' }, { region: 'PSK' }],
      [talk('tarcov', 'T4_tarcov', 'Tarçov ile konuş.'), { t: 'chest', filter: { region: 'PSK' }, n: 1, text: 'Paslı Sanayi Kanalı\'nda oltayla bir sandık yakala.' }, talk('tarcov', 'T4_return', 'Bulduğunu Tarçov\'a göster.')],
      [chest('CHEST_10'), rel('zip', 10)]),
    C('T5', 'tarcov', 5, 'Çark Döner', 'Tarçov kasabadan ayrılır; Kara Pazar Çarkı açılır.',
      [{ chapter: 'T4' }],
      [talk('tarcov', 'T5_tarcov', 'Tarçov\'a veda et.'), talk('zip', 'T5_zip', 'Zıpırleone\'nin Mekanı\'na git.')],
      [it('SPC_14', 1), rel('zip', 10)], { flags: { tarcovLeft: true, wheelUnlocked: true } }),
    // Komplo Teorisyeni — 3 bölüm (3.'de dördüncü duvar)
    C('K1', 'komplo', 1, 'Balıklar Normal Değil', 'Balıklar bir veritabanından kaçmış olabilir mi?',
      [{ species: 3 }],
      [talk('komplo', 'K1_komplo', 'Komplo Teorisyeni ile konuş (sahildeki evi).'), { t: 'catch', filter: { region: 'TS' }, n: 1, text: 'Tembel Sazlıklar\'dan 1 balık yakala.' }, talk('komplo', 'K1_done', 'Kanıtı Komplo Teorisyeni\'ne göster.')],
      [it('SPC_06', 1), rel('komplo', 10)]),
    C('K2', 'komplo', 2, 'Kasabanın Açısı Yanlış', 'Kasabanın fizik mantığıyla ilgili absürt bir teori.',
      [{ chapter: 'K1' }, { chapter: 'T3' }, { region: 'YK' }],
      [talk('komplo', 'K2_komplo', 'Komplo Teorisyeni ile konuş.'), inspect('lamp', 'town', 'Eğri Anten', 'K2_lamp', 'Komplo Teorisyeni\'nin çatısındaki eğri anteni incele.'), inspect('cloud', 'town', 'Durmuş Saat', 'K2_cloud', 'Belediyenin hiç ilerlemeyen saatini incele.'), inspect('facade', 'town', 'Düz Cephe', 'K2_facade', 'Belediyenin arkası olmayan yan cephesini incele.'), talk('komplo', 'K2_done', 'Bulgularını anlat.')],
      [it('SPC_19', 1), rel('komplo', 10)]),
    C('K3', 'komplo', 3, 'Bizi İzliyorlar', 'Kontrollü bir dördüncü duvar kırılması.',
      [{ chapter: 'K2' }, { region: 'TB' }],
      [talk('komplo', 'K3_komplo', 'Komplo Teorisyeni ile konuş.')],
      [it('SPC_13', 1), cos('COS_HAT_FOIL'), rel('komplo', 10)], { flags: { bermudaCoords: true, fourthWall: true } }),
    // Don Zıpırleone — orta oyun 5 bölüm (sonuç: GİZLİ MEKAN; balıkçılık bölgesi değildir)
    C('Z1', 'zip', 1, 'Sessiz Miyav Anlaşması', 'Bir güven testi.',
      [{ chapter: 'T5' }, { rel: { npc: 'zip', gte: 40 } }, { region: 'YK' }],
      [talk('zip', 'Z1_zip', 'Don ile konuş.'), { t: 'deliver', npc: 'zip', filter: { region: 'YK' }, n: 2, dlg: 'Z1_done', text: 'Don\'a Yakamoz Koyu\'ndan 2 balık götür.' }],
      [it('SPC_05', 1), miyav(15), rel('zip', 10)]),
    C('Z2', 'zip', 2, 'Yanlışlıkla Gizli Toplantı', 'Aşırı ciddi bir toplantı, saçma bir gündem.',
      [{ chapter: 'Z1' }, { region: 'TB' }],
      [talk('zip', 'Z2_zip', 'Don ile konuş.'), { t: 'catch', filter: { region: 'TB' }, n: 1, text: 'Titrek Buzullar\'dan 1 balık yakala ("soğuk delil").' }, talk('zip', 'Z2_meeting', 'Toplantıya katıl.')],
      [it('SPC_17', 1), miyav(15), rel('zip', 10)]),
    C('Z3', 'zip', 3, 'Eksik Defter', 'Kayıp bir defter; içinde utanç verici balık şiirleri.',
      [{ chapter: 'Z2' }, { region: 'BKM' }],
      [talk('zip', 'Z3_zip', 'Don ile konuş.'), { t: 'chest', filter: { region: 'BKM' }, n: 1, text: 'Batık Korsan Mezarlığı\'nda oltayla bir sandık yakala.' }, talk('zip', 'Z3_done', 'Defteri Don\'a geri ver.')],
      [it('SPC_12', 1), miyav(20), rel('zip', 10)], { flags: { poemsFound: true } }),
    C('Z4', 'zip', 4, 'Miyav Borcu', 'Geçmişten gelen daha ciddi bir problem.',
      [{ chapter: 'Z3' }],
      [talk('zip', 'Z4_zip', 'Don ile konuş.'), { t: 'deliver', npc: 'zip', filter: { rarityMin: 'epic' }, n: 1, miyav: 40, dlg: 'Z4_done', text: 'Don\'a 40 Miyav ve 1 Epik veya daha iyi balık götür.' }],
      [it('SPC_25', 3), rel('zip', 10)]),
    C('Z5', 'zip', 5, 'Kapının Arkasındaki Mekan', 'Birkaç sistemi birleştiren final görev.',
      [{ chapter: 'Z4' }, { region: 'KKD' }],
      [talk('zip', 'Z5_zip', 'Don ile konuş.'), { t: 'catch', filter: { region: 'KKD' }, n: 1, text: 'Kaynar Kazan Deltası\'ndan 1 balık yakala.' }, { t: 'green', n: 1, text: 'Bir hazineyi YEŞİL bölgede yakala.' }, { t: 'installed', n: 1, text: 'Tekneye en az 1 Kara Pazar parçası tak (Tekne Atölyesi).' },
        { t: 'deliver', npc: 'zip', filter: null, n: 0, coin: 1500, dlg: 'Z5_done', text: 'Don\'a kapı tamiri için 1.500 coin ver.' }],
      [it('SPC_22', 1), miyav(30), rel('zip', 20)], { flags: { secretVenue: true } })
  ];

  // ---------- PANO SİPARİŞ ŞABLONLARI (34) ----------
  // kind: fish | rarity | regionSet | size | behavior | chest | trash | green | noBait | legendary
  // reg: gereken açık bölge; timed: saniye (oyun saati) veya null.
  const O = (id, client, title, kind, spec, reg, coinR, extra, timed) => ({ id, client, title, kind, spec, reg, rewards: [coin(coinR)].concat(extra || []), timed: timed || null });
  const orders = [
    O('O_01', 'Lokanta Şefi', 'Akşam menüsüne 3 Vatandaş İstavrit', 'fish', { fishId: 'EL_02', n: 3 }, 'EL', 70, [it('BAIT_01', 3)]),
    O('O_02', 'Mahalle Muhtarı', 'Memur Kefal (resmî yemek için)', 'fish', { fishId: 'EL_03', n: 2 }, 'EL', 80, [], 8 * 60),
    O('O_03', 'Simitçi Amca', 'Simit Seven Martı-Balığı ile tanışmak istiyor', 'fish', { fishId: 'EL_09', n: 1 }, 'EL', 160, [it('BAIT_06', 3)]),
    O('O_04', 'Kasaba Çocukları', 'Herhangi 5 balık (akvaryum hayali)', 'rarity', { rarityMin: 'common', n: 5 }, 'EL', 75, [it('BAIT_02', 2)]),
    O('O_05', 'Sirk Müdürü', 'Kaybolmuş Palyaço Balığı\'nı bulun!', 'fish', { fishId: 'EL_07', n: 1 }, 'EL', 200, [], 15 * 60),
    O('O_06', 'Komşu Teyze', 'Dedikoducu Teyze Balığı (eski arkadaşı)', 'fish', { fishId: 'EL_10', n: 1 }, 'EL', 320, [it('MAT_03', 3)]),
    O('O_07', 'Lokanta Şefi', 'Eski Liman\'dan 4 farklı tür', 'regionSet', { region: 'EL', n: 4 }, 'EL', 140, []),
    O('O_08', 'Çevreci Gönüllü', 'Denizden 3 çöp temizle ve teslim et', 'trash', { n: 3 }, 'EL', 60, [it('MAT_08', 2)]),
    O('O_09', 'Uyku Kliniği', 'Pijamalı Sazan (araştırma amaçlı)', 'fish', { fishId: 'TS_01', n: 2 }, 'TS', 130, []),
    O('O_10', 'Yoga Hocası', 'Yoga Yapan Kurbağa ile ortak seans', 'fish', { fishId: 'TS_08', n: 1 }, 'TS', 170, [], 12 * 60),
    O('O_11', 'Ninja Kulübü', 'Ninja Kurbağa (Yavru) — gizlice', 'fish', { fishId: 'TS_06', n: 1 }, 'TS', 280, [it('BAIT_03', 4)]),
    O('O_12', 'Doğa Belgeselcisi', 'Tembel Sazlıklar\'dan 4 farklı tür', 'regionSet', { region: 'TS', n: 4 }, 'TS', 220, []),
    O('O_13', 'Hazine Avcıları Derneği', 'Herhangi 2 sandık yakala', 'chest', { n: 2 }, 'TS', 150, [it('KEY_01', 1)]),
    O('O_14', 'Sinema Kulübü', 'Kamuflaj Kurbağa (görünmezlik sahnesi)', 'fish', { fishId: 'TS_02', n: 2 }, 'TS', 150, [], 10 * 60),
    O('O_15', 'Teknoloji Mağazası', 'USB Bellek Balığı (veri kurtarma)', 'fish', { fishId: 'PSK_10', n: 1 }, 'PSK', 520, [scrap(20)]),
    O('O_16', 'İnternet Kafe', 'Wi-Fi Sinyali Yayan Palamut ×2', 'fish', { fishId: 'PSK_03', n: 2 }, 'PSK', 300, [], 15 * 60),
    O('O_17', 'Geri Dönüşüm Gönüllüsü', '6 çöp teslim et', 'trash', { n: 6 }, 'PSK', 140, [it('MAT_SCRAP', 3)]),
    O('O_18', 'Robotik Kulübü', 'Paslı Sanayi\'den 2 Nadir+ balık', 'rarity', { rarityMin: 'rare', n: 2, region: 'PSK' }, 'PSK', 420, [it('MAT_05', 2)]),
    O('O_19', 'Hasan\'ın Yeğeni', 'Ağır (Heavy) davranışlı 2 balık', 'behavior', { behavior: 'heavy', n: 2 }, 'PSK', 260, []),
    O('O_20', 'Gece Kulübü', 'Disko Topu Balığı ×2 (dekorasyon)', 'fish', { fishId: 'YK_01', n: 2 }, 'YK', 300, [it('BAIT_08', 2)]),
    O('O_21', 'Sosyal Medya Ajansı', 'Influencer Fener Balığı', 'fish', { fishId: 'YK_02', n: 1 }, 'YK', 380, [], 15 * 60),
    O('O_22', 'Gökbilimci', 'Yakamoz Koyu\'ndan 5 farklı tür', 'regionSet', { region: 'YK', n: 5 }, 'YK', 520, [it('MAT_12', 2)]),
    O('O_23', 'Usta Zamanlamacı', '2 hazineyi YEŞİL bölgede yakala', 'green', { n: 2 }, 'YK', 360, [it('KEY_03', 1)]),
    O('O_24', 'Kafe Sahibi', 'Sıcak Çikolata İsteyen Fok (müşteri olarak)', 'fish', { fishId: 'TB_08', n: 1 }, 'TB', 420, [it('SPC_02', 1)]),
    O('O_25', 'Buz Pateni Federasyonu', 'Buz Pateni Yapan Penguen ×2', 'fish', { fishId: 'TB_05', n: 2 }, 'TB', 620, [], 15 * 60),
    O('O_26', 'Müze Müdürü', 'Dev boyda bir Titrek Buzullar balığı', 'size', { region: 'TB', label: 'Dev', n: 1 }, 'TB', 700, [it('MAT_10', 3)]),
    O('O_27', 'Korsan Tiyatrosu', 'Korsan Papağan Balığı ×2', 'fish', { fishId: 'BKM_01', n: 2 }, 'BKM', 520, []),
    O('O_28', 'Kartograf', 'Harita Yutan Mürekkep Balığı (haritayı geri istiyor)', 'fish', { fishId: 'BKM_09', n: 1 }, 'BKM', 1400, [it('MAT_13', 3)], 20 * 60),
    O('O_29', 'Hazine Avcıları Derneği', 'Korsan Mezarlığı\'nda 2 sandık', 'chest', { n: 2, region: 'BKM' }, 'BKM', 900, [it('KEY_02', 1)]),
    O('O_30', 'Hamam Müdürü', 'Buharlı Hamam Balığı (yeni maskot)', 'fish', { fishId: 'KKD_09', n: 1 }, 'KKD', 1100, [], 20 * 60),
    O('O_31', 'Acı Sos Festivali', 'Çılgın (Berserk) davranışlı 3 balık', 'behavior', { behavior: 'berserk', n: 3 }, 'KKD', 1000, [it('BAIT_10', 3)]),
    O('O_32', 'Fizik Profesörü', 'Yerçekimsiz Balina (kanıt olarak)', 'fish', { fishId: 'BG_11', n: 1 }, 'BG', 1500, [it('MAT_14', 2)]),
    O('O_33', 'Filozoflar Kahvesi', 'Bermuda\'dan 6 farklı tür', 'regionSet', { region: 'BG', n: 6 }, 'BG', 2600, [it('BAIT_12', 1)]),
    O('O_34', 'Efsane Koleksiyoncusu', 'Herhangi bir Efsanevi balık', 'rarity', { rarityMin: 'legendary', n: 1 }, 'YK', 1800, [miyav(20)], 30 * 60),
    O('O_35', 'Minimalist Balıkçı', 'Yem kullanmadan 3 balık yakala', 'noBait', { n: 3 }, 'EL', 90, [it('BAIT_05', 1)]),
    O('O_36', 'Sakin Günler Derneği', 'Sakin (Calm) davranışlı 3 balık', 'behavior', { behavior: 'calm', n: 3 }, 'EL', 90, [])
  ];

  // ---------- GÜNLÜK GÖREVLER ----------
  const DQ = (id, title, kind, spec, rewards, reg) => ({ id, title, kind, spec, rewards, reg: reg || 'EL' });
  const daily = [
    DQ('DQ_CATCH', 'Bugün 8 balık yakala', 'catch', { n: 8 }, [coin(60), miyav(3)]),
    DQ('DQ_REGION', '{region} bölgesinde 4 balık yakala', 'catchRegion', { n: 4 }, [coin(90), miyav(3)]),
    DQ('DQ_SELL', 'Rüstem\'e 250 coin\'lik balık sat', 'sellCoin', { n: 250 }, [coin(50), miyav(2)]),
    DQ('DQ_GREEN', 'Bir hazineyi YEŞİL bölgede yakala', 'green', { n: 1 }, [it('KEY_01', 1), miyav(3)]),
    DQ('DQ_CHEST', '1 sandık aç', 'openChest', { n: 1 }, [coin(70), miyav(2)]),
    DQ('DQ_RECYCLE', 'Fabrikada 3 şey geri dönüştür', 'recycle', { n: 3 }, [scrap(25), miyav(2)]),
    DQ('DQ_BAIT', '5 kez yemle atış yap', 'useBait', { n: 5 }, [it('BAIT_05', 2), miyav(2)]),
    DQ('DQ_RARE', 'Nadir veya daha iyi 1 balık yakala', 'rarity', { rarityMin: 'rare', n: 1 }, [coin(120), miyav(4)]),
    DQ('DQ_TRICK', 'Hilebaz (Trickster) davranışlı 2 balık yakala', 'behavior', { behavior: 'trickster', n: 2 }, [coin(90), miyav(3)]),
    DQ('DQ_NORED', 'Gerilimi hiç kırmızıya sokmadan 2 balık yakala', 'noRed', { n: 2 }, [it('SPC_21', 1), miyav(3)])
  ];

  // ---------- KOLEKSİYON (Denizin Defteri) ----------
  const collection = {
    thresholds: [25, 50, 75, 100],
    rewards: {
      EL: { 25: [coin(60)], 50: [cos('COS_FLAG_GULL')], 75: [it('BAIT_05', 3)], 100: [coin(400), it('SPC_08', 1)] },
      TS: { 25: [coin(100)], 50: [it('BAIT_03', 5)], 75: [it('MAT_07', 3)], 100: [coin(600), cos('COS_PAINT_CORAL')] },
      PSK: { 25: [coin(150)], 50: [it('MAT_05', 4)], 75: [it('MAT_17', 1)], 100: [coin(900), it('SPC_21', 1)] },
      YK: { 25: [coin(220)], 50: [it('MAT_12', 4)], 75: [it('MAT_18', 1)], 100: [coin(1300), it('BAIT_12', 2)] },
      TB: { 25: [coin(300)], 50: [it('MAT_10', 5)], 75: [it('MAT_15', 1)], 100: [coin(1800), it('SPC_20', 1)] },
      BKM: { 25: [coin(400)], 50: [it('MAT_13', 5)], 75: [chest('CHEST_03')], 100: [coin(2400), it('SPC_19', 1)] },
      KKD: { 25: [coin(550)], 50: [it('MAT_11', 5)], 75: [it('MAT_16', 1)], 100: [coin(3200), it('SPC_24', 2)] },
      BG: { 25: [coin(750)], 50: [it('MAT_14', 4)], 75: [chest('CHEST_07')], 100: [coin(5000), miyav(60)] }
    },
    all: [cos('COS_FLAG_GOLD'), coin(10000)]
  };

  // Kaya Usta'nın davranış yorumları (Fishpedia)
  const kayaComments = {
    calm: 'Sakin balık acele etmez; sen de etme. Uzun ve dengeli sar, gerilimi yeşilde tut.',
    wiggler: 'Kıpır kıpırdır; sık ama küçük çekişler yapar. Kısa kısa sar, ritmini yakala.',
    runner: 'Kaçaktır. Ani uzaklaşır; mesafeye göz kulak ol, gevşek bırakırsan gider.',
    heavy: 'Ağır ve inatçıdır. Gerilim çabuk birikir; sarıda sabırla sar, kırmızıda bırak.',
    trickster: 'Hilebazdır. Sakin görünür, sonra ani hamle yapar. Uyarıyı görünce elini çek.',
    berserk: 'Çılgındır. Kısa ama yoğun ataklar yapar. Soğukkanlı ol; atak bitince sar.',
    boss: 'Bu bir balık değil, bir efsanenin kendisi. Evreleri var; her evrede başka bir oyun oynar.'
  };

  D.QuestDB = D.deepFreeze({ main, story, orders, daily, collection, kayaComments });
  D.storyById = Object.fromEntries(story.map((c) => [c.id, c]));
  D.mainById = Object.fromEntries(main.map((q) => [q.id, q]));
  D.orderTplById = Object.fromEntries(orders.map((o) => [o.id, o]));
  D.dailyTplById = Object.fromEntries(daily.map((o) => [o.id, o]));
  D.CHAIN_TR = { tarcov: 'Tarçov × Zıpırleone', komplo: 'Komplo Teorisyeni', zip: 'Don Zıpırleone (orta oyun)' };
})(globalThis.DUMEN);
