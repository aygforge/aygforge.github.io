// ChestDB + KeyRules + TrashDB + CosmeticDB — TÜRETİLMİŞ ödül/kilit tabloları.
// TrashDB ve CosmeticDB ItemDB'ye satır EKLEMEZ; ayrı türetilmiş kataloglardır (ItemDB 102 kalır).
(function (D) {
  'use strict';
  const coin = (min, max, w) => ({ type: 'coin', min, max, w });
  const item = (id, min, max, w) => ({ type: 'item', id, min, max, w });
  const miyav = (min, max, w) => ({ type: 'miyav', min, max, w });
  const scrap = (min, max, w) => ({ type: 'scrap', min, max, w });
  const cosmetic = (id, w) => ({ type: 'cosmetic', id, w });
  const SPC_COMMON = ['SPC_01', 'SPC_02', 'SPC_08', 'SPC_10', 'SPC_21', 'SPC_23', 'SPC_24'];
  const spcPool = (w, list) => (list || SPC_COMMON).map((id) => item(id, 1, 1, w / (list || SPC_COMMON).length));

  D.ChestDB = D.deepFreeze({
    CHEST_01: { regions: ['EL', 'TS'], key: null, req: null, theme: 'karton', rolls: 2, color: '#b08a5a',
      pool: [coin(15, 40, 30), item('BAIT_01', 2, 4, 14), item('BAIT_02', 1, 3, 10), item('BAIT_04', 1, 3, 8), item('MAT_03', 1, 3, 14), item('MAT_08', 1, 3, 12), item('MAT_07', 1, 2, 8), item('KEY_01', 1, 1, 4)] },
    CHEST_02: { regions: ['TS', 'PSK'], key: null, req: null, theme: 'teneke', rolls: 2, color: '#9aa7b2',
      pool: [coin(40, 90, 26), item('MAT_SCRAP', 2, 4, 16), item('MAT_02', 1, 3, 14), item('MAT_05', 1, 2, 12), item('MAT_04', 1, 2, 10), item('MAT_17', 1, 1, 3), item('KEY_01', 1, 1, 5), item('BAIT_07', 1, 3, 8)] },
    CHEST_03: { regions: ['BKM'], key: 'KEY_02', req: null, theme: 'korsan', rolls: 3, color: '#7a4a2a',
      pool: [coin(250, 520, 30), item('MAT_13', 2, 4, 22), item('MAT_06', 1, 2, 12), item('BAIT_11', 2, 3, 10), cosmetic('COS_FLAG_PIRATE', 3), ...spcPool(4, ['SPC_16', 'SPC_11', 'SPC_24'])] },
    CHEST_04: { regions: ['YK'], key: 'KEY_03', req: null, theme: 'yakamoz', rolls: 3, color: '#5a3a9a',
      pool: [coin(120, 260, 30), item('MAT_12', 2, 3, 22), item('MAT_18', 1, 1, 6), item('MAT_09', 1, 2, 12), item('BAIT_08', 2, 3, 10), cosmetic('COS_PAINT_NEON', 2), ...spcPool(4)] },
    CHEST_05: { regions: ['TB'], key: 'KEY_04', req: null, theme: 'buz', rolls: 3, color: '#8fd3f5',
      pool: [coin(180, 340, 30), item('MAT_10', 2, 4, 24), item('MAT_15', 1, 1, 6), item('BAIT_09', 2, 3, 10), item('MAT_04', 1, 2, 10), ...spcPool(4)] },
    CHEST_06: { regions: ['KKD'], key: null, req: { item: 'MAT_10', n: 1, text: 'Soğutmak için 1 Buz Kristali Parçası gerekir.' }, theme: 'lava', rolls: 3, color: '#c9302c',
      pool: [coin(350, 650, 30), item('MAT_11', 2, 4, 24), item('MAT_16', 1, 1, 6), item('BAIT_10', 2, 3, 10), item('MAT_06', 1, 2, 10), ...spcPool(4, ['SPC_24', 'SPC_21', 'SPC_11'])] },
    CHEST_07: { regions: ['BG'], key: 'KEY_05', req: null, theme: 'bermuda', rolls: 4, color: '#3fd2c7',
      pool: [coin(600, 1100, 28), item('MAT_14', 2, 3, 22), item('BAIT_12', 1, 2, 10), item('BAIT_14', 2, 3, 10), miyav(10, 25, 8), cosmetic('COS_FLAG_DISCO', 3), ...spcPool(5, ['SPC_16', 'SPC_11', 'SPC_13', 'SPC_18'])] },
    CHEST_08: { regions: ['*'], key: 'KEY_01', req: null, theme: 'kilitli', rolls: 3, color: '#6a5a4a',
      pool: [coin(80, 220, 26), item('MAT_06', 1, 2, 14), item('MAT_04', 1, 3, 14), item('KEY_02', 1, 1, 4), item('KEY_03', 1, 1, 4), item('KEY_04', 1, 1, 4), scrap(10, 30, 12), ...spcPool(6)] },
    CHEST_09: { regions: ['BKM', 'KKD', 'BG'], key: null, req: { puzzle: 'code', text: 'Şifre çözülmeli (3 haneli kod, ipuçlu).' }, theme: 'sifreli', rolls: 3, color: '#2a2f3a',
      pool: [coin(400, 900, 28), miyav(10, 25, 18), scrap(20, 50, 12), cosmetic('COS_HAT_FEZ', 3), cosmetic('COS_PAINT_NAVY', 3), ...spcPool(8, ['SPC_16', 'SPC_11', 'SPC_13', 'SPC_18', 'SPC_19', 'SPC_20'])] },
    CHEST_10: { regions: [], key: null, req: { flag: 'tarcovLeft', text: 'Mühür, Müfettiş Tarçov kasabadan ayrılınca geçersiz olur.' }, theme: 'tarcov', rolls: 0, color: '#2a2a2a',
      guaranteed: [item('SPC_15', 1, 1), coin(300, 300), miyav(15, 15)], pool: [] }
  });

  // Anahtar kuralları: bir anahtar = bir sandık açar ve tüketilir.
  D.KeyRules = D.deepFreeze({
    KEY_01: { opens: 'CHEST_08', consumed: true },
    KEY_02: { opens: 'CHEST_03', consumed: true },
    KEY_03: { opens: 'CHEST_04', consumed: true },
    KEY_04: { opens: 'CHEST_05', consumed: true },
    KEY_05: { opens: 'CHEST_07', consumed: true }
  });

  // ---- TrashDB (türetilmiş) ----
  const T = (id, name, regions, w, out, extra) => Object.assign({ id, name, regions, w, out }, extra || {});
  // Kullanıcının çizdiği 9 çöp ikonu (assets/trash/<ID>.webp). Ayrıştırma çıktıları materyal bölgelerine göre.
  D.TrashDB = D.deepFreeze({
    T_BOLT: T('T_BOLT', 'Paslı Cıvata & Somun', ['EL', 'TS', 'PSK'], 10, [{ id: 'MAT_03', n: 1 }], { quip: 'Somun cıvatasını hiç bırakmamış. Pas bile ayıramamış.' }),
    T_GEAR: T('T_GEAR', 'Dişli Çark', ['TS', 'PSK', 'KKD'], 8, [{ id: 'MAT_05', n: 1 }, { id: 'MAT_SCRAP', n: 1 }], { quip: 'Hâlâ dönmeye çalışıyor. Saygı duy.' }),
    T_BELL: T('T_BELL', 'Eski Gemi Çanı', ['EL', 'BKM', 'TB'], 6, [{ id: 'MAT_SCRAP', n: 2 }, { id: 'MAT_04', n: 1 }], { quip: 'Çaldın mı? Çalma. Hayaletler geliyor.' }),
    T_CABLE: T('T_CABLE', 'Kopuk Kablo', ['PSK', 'YK', 'BG'], 9, [{ id: 'MAT_09', n: 1 }], { quip: 'Kırmızı mı mavi mi? İkisi de ıslak.' }),
    T_LID: T('T_LID', 'Paslı Kapak', ['*'], 10, [{ id: 'MAT_SCRAP', n: 1 }], { quip: 'Neyin kapağı olduğunu kimse bilmiyor. Kapak da bilmiyor.' }),
    T_MOTOR: T('T_MOTOR', 'Paslı Motor', ['PSK', 'BKM', 'KKD'], 6, [{ id: 'MAT_06', n: 1 }, { id: 'MAT_SCRAP', n: 1 }], { quip: 'Bir zamanlar bir teknenin hayaliydi. Şimdi senin ambarının yükü.' }),
    T_BAG: T('T_BAG', 'Plastik Poşet', ['*'], 12, [{ id: 'MAT_08', n: 1 }], { quip: 'Denizanası sandın, değil. Neyse ki.' }),
    T_SOCK: T('T_SOCK', 'Tek Çorap', ['EL', 'TS', 'YK', 'TB'], 9, [{ id: 'MAT_08', n: 1 }], { quip: 'Diğer teki muhtemelen Bermuda\'da.' }),
    T_BOTTLE: T('T_BOTTLE', 'Şişede Mesaj', ['*'], 6, [{ id: 'MAT_08', n: 1 }], { coin: 15, quip: '"Kim okuyorsa: Martıya simit verme." — İmza: Rüstem' })
  });
  // Eski kayıtlardaki çöp kimlikleri → yeni katalog (Save.migrate kullanır). T_KEYRING içindeki anahtar anahtar olarak verilir.
  D.TRASH_LEGACY = Object.freeze({ T_BOOT: 'T_SOCK', T_CAN: 'T_LID', T_UMBRELLA: 'T_BAG', T_DUCK: 'T_BAG', T_SLIPPER: 'T_SOCK', T_PIPE: 'T_LID', T_GEARBOX: 'T_GEAR', T_REMOTE: 'T_CABLE', T_FAN: 'T_MOTOR', T_MAGNET: 'T_LID', T_GLOBE: 'T_BOTTLE', T_ANCHOR: 'T_BELL', T_PAN: 'T_LID', T_GRILL: 'T_BOLT', T_CD: 'T_CABLE', T_EARBUDS: 'T_CABLE', T_PIXELS: 'T_CABLE', T_KEYRING: 'KEY_01' });

  // ---- CosmeticDB (türetilmiş; GDD §30 "tekne kozmetikleri" açık madde) ----
  const C = (id, name, slot, value, source) => ({ id, name, slot, value, source });
  D.CosmeticDB = D.deepFreeze({
    COS_FLAG_GULL: C('COS_FLAG_GULL', 'Martı Bayrağı', 'flag', { color: '#ffffff', mark: 'gull' }, 'Koleksiyon: Eski Liman %50'),
    COS_FLAG_PIRATE: C('COS_FLAG_PIRATE', 'Korsan Bayrağı', 'flag', { color: '#1a1a1a', mark: 'skull' }, 'Korsan Sandığı'),
    COS_FLAG_CAT: C('COS_FLAG_CAT', 'Pati Bayrağı', 'flag', { color: '#c9302c', mark: 'paw' }, 'Kara Pazar Çarkı / Arka Oda'),
    COS_FLAG_DISCO: C('COS_FLAG_DISCO', 'Disko Bayrağı', 'flag', { color: '#b07cff', mark: 'star' }, 'Bermuda Mührü Sandığı'),
    COS_FLAG_GOLD: C('COS_FLAG_GOLD', 'Altın Dümen Bayrağı', 'flag', { color: '#f0c040', mark: 'wheel' }, 'Koleksiyon 88/88'),
    COS_PAINT_MINT: C('COS_PAINT_MINT', 'Nane Yeşili Boya', 'paint', { color: '#5fd3a8' }, 'Kara Pazar Çarkı'),
    COS_PAINT_NAVY: C('COS_PAINT_NAVY', 'Lacivert Boya', 'paint', { color: '#1f3a6a' }, 'Şifreli Kasa / Arka Oda'),
    COS_PAINT_CORAL: C('COS_PAINT_CORAL', 'Mercan Boya', 'paint', { color: '#ff7a5c' }, 'Koleksiyon: Tembel Sazlıklar %100'),
    COS_PAINT_NEON: C('COS_PAINT_NEON', 'Neon Boya', 'paint', { color: '#ff4fb3' }, 'Yakamoz Sandığı'),
    COS_HAT_CAPTAIN: C('COS_HAT_CAPTAIN', 'Kaptan Şapkası', 'hat', { color: '#ffffff', kind: 'captain' }, 'Ana görev: Altın Dümen'),
    COS_HAT_FEZ: C('COS_HAT_FEZ', 'Fes', 'hat', { color: '#c9302c', kind: 'fez' }, 'Şifreli Kasa / Arka Oda'),
    COS_HAT_FOIL: C('COS_HAT_FOIL', 'Folyo Şapka', 'hat', { color: '#d9dde6', kind: 'foil' }, 'Komplo Teorisyeni, 3. bölüm')
  });
})(globalThis.DUMEN);
