// RecipeDB (Hurdacı Hasan craft + dönüşümler), FactoryDB (Geri Dönüşüm), ShopDB (Market + Zıpırleone + Arka Oda), WheelDB.
// Tüm sayılar TÜRETİLMİŞTİR (GDD §16'daki 500 coin örneği yalnız teknik örnektir).
(function (D) {
  'use strict';
  const m = (id, n) => ({ id, n });
  const R = (id, o) => Object.assign({ id, coin: 0, scrap: 0, materials: [], unlock: null, oneTime: false, out: [] }, o);
  D.RecipeDB = D.deepFreeze({
    // 4 kanonik craft oltası (GDD §10, §16)
    R_ROD_08: R('R_ROD_08', { group: 'rod', out: [m('ROD_08', 1)], coin: 600, scrap: 30, materials: [m('MAT_17', 2), m('MAT_05', 4), m('MAT_02', 6)], unlock: { region: 'PSK' }, oneTime: true, hint: 'Pas Yiyen Çekirdek: Paslı Sanayi\'nin Nadir+ balıkları fabrikada.' }),
    R_ROD_09: R('R_ROD_09', { group: 'rod', out: [m('ROD_09', 1)], coin: 1500, scrap: 50, materials: [m('MAT_18', 2), m('MAT_12', 5), m('MAT_09', 4)], unlock: { region: 'YK' }, oneTime: true, hint: 'Yakamoz Fısıltı Taşı: Yakamoz Koyu\'nun Nadir+ balıkları fabrikada.' }),
    R_ROD_06: R('R_ROD_06', { group: 'rod', out: [m('ROD_06', 1)], coin: 2600, scrap: 70, materials: [m('MAT_15', 2), m('MAT_10', 6), m('MAT_04', 4)], unlock: { region: 'TB' }, oneTime: true, hint: 'Buzkıran Dişi: Titrek Buzullar\'ın Nadir+ balıkları fabrikada.' }),
    R_ROD_07: R('R_ROD_07', { group: 'rod', out: [m('ROD_07', 1)], coin: 4200, scrap: 100, materials: [m('MAT_16', 2), m('MAT_11', 6), m('MAT_06', 4)], unlock: { region: 'KKD' }, oneTime: true, hint: 'Kızıl Isırgan Tohumu: Kaynar Kazan\'ın Nadir+ balıkları fabrikada.' }),
    // Ekipman
    R_LINE_03: R('R_LINE_03', { group: 'gear', out: [m('LINE_03', 1)], coin: 700, scrap: 20, materials: [m('MAT_12', 3), m('MAT_09', 2)], unlock: { region: 'YK' }, oneTime: true }),
    R_LINE_04: R('R_LINE_04', { group: 'gear', out: [m('LINE_04', 1)], coin: 1200, scrap: 30, materials: [m('MAT_10', 4), m('MAT_04', 2)], unlock: { region: 'TB' }, oneTime: true }),
    R_HOOK_04: R('R_HOOK_04', { group: 'gear', out: [m('HOOK_04', 1)], coin: 1400, scrap: 30, materials: [m('MAT_13', 4), m('MAT_SCRAP', 3)], unlock: { region: 'BKM' }, oneTime: true }),
    // Hasan'ın özel işleri (özel eşya)
    R_SPC_11: R('R_SPC_11', { group: 'special', out: [m('SPC_11', 1)], coin: 450, scrap: 25, materials: [m('MAT_04', 3), m('MAT_03', 2)], unlock: { region: 'PSK' }, oneTime: true }),
    R_SPC_16: R('R_SPC_16', { group: 'special', out: [m('SPC_16', 1)], coin: 900, scrap: 30, materials: [m('MAT_09', 3), m('MAT_12', 2)], unlock: { region: 'YK' }, oneTime: true }),
    R_SPC_18: R('R_SPC_18', { group: 'special', out: [m('SPC_18', 1)], coin: 300, scrap: 20, materials: [m('MAT_SCRAP', 8)], unlock: { region: 'TS' }, oneTime: true }),
    // Anahtarlar (tekrarlanabilir)
    R_KEY_01: R('R_KEY_01', { group: 'key', out: [m('KEY_01', 1)], coin: 40, scrap: 10, materials: [m('MAT_SCRAP', 3)], unlock: null }),
    R_KEY_02: R('R_KEY_02', { group: 'key', out: [m('KEY_02', 1)], coin: 150, scrap: 30, materials: [m('MAT_13', 3), m('MAT_SCRAP', 2)], unlock: { region: 'BKM' } }),
    R_KEY_03: R('R_KEY_03', { group: 'key', out: [m('KEY_03', 1)], coin: 90, scrap: 20, materials: [m('MAT_12', 2), m('MAT_09', 1)], unlock: { region: 'YK' } }),
    R_KEY_04: R('R_KEY_04', { group: 'key', out: [m('KEY_04', 1)], coin: 120, scrap: 25, materials: [m('MAT_10', 3), m('MAT_04', 1)], unlock: { region: 'TB' } }),
    R_KEY_05: R('R_KEY_05', { group: 'key', out: [m('KEY_05', 1)], coin: 260, scrap: 40, materials: [m('MAT_14', 2), m('MAT_09', 2)], unlock: { region: 'BG' } }),
    // Dönüşüm tarifleri (kötü şansın kilitlenmeye dönmemesi için deterministik yollar)
    R_MELT: R('R_MELT', { group: 'convert', out: [], scrapOut: 12, materials: [m('MAT_SCRAP', 5)], unlock: null, note: 'Hurda Metal (MAT_SCRAP, materyal) → Scrap (CUR_SCRAP, para birimi). Ayrı kalemlerdir.' }),
    R_PLATE: R('R_PLATE', { group: 'convert', out: [m('MAT_02', 1)], scrap: 10, materials: [m('MAT_SCRAP', 3)], unlock: { region: 'PSK' } }),
    R_GEARS: R('R_GEARS', { group: 'convert', out: [m('MAT_05', 1)], scrap: 15, materials: [m('MAT_SCRAP', 2), m('MAT_03', 2)], unlock: { region: 'PSK' } }),
    R_SPRING: R('R_SPRING', { group: 'convert', out: [m('MAT_04', 1)], scrap: 12, materials: [m('MAT_SCRAP', 2)], unlock: { region: 'PSK' } }),
    R_MOTOR: R('R_MOTOR', { group: 'convert', out: [m('MAT_06', 1)], scrap: 25, materials: [m('MAT_05', 2), m('MAT_SCRAP', 3)], unlock: { region: 'PSK' } }),
    R_PROP: R('R_PROP', { group: 'convert', out: [m('MAT_07', 1)], scrap: 6, materials: [m('MAT_08', 2), m('MAT_SCRAP', 1)], unlock: null }),
    R_CABLE: R('R_CABLE', { group: 'convert', out: [m('MAT_09', 1)], scrap: 14, materials: [m('MAT_SCRAP', 2), m('MAT_08', 1)], unlock: { region: 'PSK' } })
  });

  // Geri Dönüşüm Fabrikası: bölge → materyal (deterministik; oyuncu sonucu önceden görür).
  D.FactoryDB = D.deepFreeze({
    fishToMaterial: {
      EL: { base: [m('MAT_03', 1)], rareBonus: [m('MAT_07', 1)] },
      TS: { base: [m('MAT_08', 1)], rareBonus: [m('MAT_03', 1)] },
      PSK: { base: [m('MAT_02', 1)], rareBonus: [m('MAT_17', 1)] },
      YK: { base: [m('MAT_12', 1)], rareBonus: [m('MAT_18', 1)] },
      TB: { base: [m('MAT_10', 1)], rareBonus: [m('MAT_15', 1)] },
      BKM: { base: [m('MAT_13', 1)], rareBonus: [m('MAT_06', 1)] },
      KKD: { base: [m('MAT_11', 1)], rareBonus: [m('MAT_16', 1)] },
      BG: { base: [m('MAT_14', 1)], rareBonus: [m('MAT_09', 1)] }
    },
    rareThreshold: 'rare', // Nadir ve üstü rareBonus da verir
    trashScrapEach: 2
  });

  // Mağazalar
  D.ShopDB = D.deepFreeze({
    market: {
      rods: ['ROD_02', 'ROD_03', 'ROD_04', 'ROD_05'],
      gear: ['LINE_02', 'HOOK_02', 'HOOK_03', 'FLOAT_02', 'FLOAT_03'],
      baits: ['BAIT_01', 'BAIT_02', 'BAIT_03', 'BAIT_04', 'BAIT_05', 'BAIT_06', 'BAIT_07', 'BAIT_08', 'BAIT_09', 'BAIT_10', 'BAIT_11', 'BAIT_12', 'BAIT_13', 'BAIT_14'],
      specials: ['SPC_01', 'SPC_02', 'SPC_08', 'SPC_10', 'SPC_21', 'SPC_23', 'SPC_24'],
      materials: [{ id: 'MAT_03', price: 14 }, { id: 'MAT_08', price: 8 }, { id: 'MAT_SCRAP', price: 12 }]
    },
    zipirleone: { // Miyav ile
      parts: ['BM_01', 'BM_02', 'BM_03', 'BM_04', 'BM_05', 'BM_06'],
      specials: ['SPC_19', 'SPC_20', 'SPC_25'],
      baits: [{ id: 'BAIT_13', miyav: 4 }]
    },
    secretVenue: { // Arka Oda: Miyav kozmetik + yenilenen özel eşyalar
      cosmetics: [{ id: 'COS_FLAG_CAT', miyav: 60 }, { id: 'COS_PAINT_NAVY', miyav: 50 }, { id: 'COS_HAT_FEZ', miyav: 40 }, { id: 'COS_PAINT_MINT', miyav: 45 }],
      specials: [{ id: 'SPC_19', miyav: 20 }, { id: 'SPC_20', miyav: 16 }, { id: 'SPC_25', miyav: 14 }]
    },
    boatyard: { permit: { id: 'TCK_BOATYARD_PERMIT', coin: 1600, materials: [m('MAT_03', 5)], requiresBoat: 5 } }
  });

  // Kara Pazar Çarkı (GDD §22) — ağırlıklar normalize edilir.
  D.WheelDB = D.deepFreeze({
    segments: [
      { id: 'W_COIN_S', label: '80 Coin', w: 20, reward: { type: 'coin', n: 80 }, color: '#f0c040' },
      { id: 'W_MIYAV_S', label: '15 Miyav', w: 15, reward: { type: 'miyav', n: 15 }, color: '#ff8ab8' },
      { id: 'W_BAIT_RARE', label: 'Parlak Yem ×3', w: 12, reward: { type: 'item', id: 'BAIT_05', n: 3 }, color: '#ff9a7a' },
      { id: 'W_MAT', label: 'Bölge Materyali ×3', w: 12, reward: { type: 'regionMaterial', n: 3 }, color: '#9aa7b2' },
      { id: 'W_COIN_L', label: '220 Coin', w: 10, reward: { type: 'coin', n: 220 }, color: '#e8a020' },
      { id: 'W_SUCUK', label: 'Yasaklı Sucuk ×2', w: 8, reward: { type: 'item', id: 'BAIT_13', n: 2 }, color: '#a33a2a' },
      { id: 'W_CHEST', label: 'Kilitli Kasa', w: 7, reward: { type: 'chest', id: 'CHEST_08' }, color: '#6a5a4a' },
      { id: 'W_CODE', label: 'Şifreli Kasa', w: 4, reward: { type: 'chest', id: 'CHEST_09' }, color: '#2a2f3a' },
      { id: 'W_MIYAV_L', label: '40 Miyav', w: 4, reward: { type: 'miyav', n: 40 }, color: '#ff5a9a' },
      { id: 'W_LEG', label: 'Efsane Sosu', w: 4, reward: { type: 'item', id: 'BAIT_12', n: 1 }, color: '#f0a81c' },
      { id: 'W_COS', label: 'Kozmetik', w: 3, reward: { type: 'cosmetic', pool: ['COS_FLAG_CAT', 'COS_PAINT_MINT'] }, color: '#5fd3a8' },
      { id: 'W_SPC', label: 'Özel Eşya!', w: 1.5, reward: { type: 'special', pool: ['SPC_19', 'SPC_20', 'SPC_24', 'SPC_25', 'SPC_13'] }, color: '#a35ee0' }
    ]
  });
})(globalThis.DUMEN);
