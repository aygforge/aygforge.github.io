// BoatDB — 10 seviye (GDD §12.2 "önerilen" 1–10 bandı bu sürümde uygulama parametresi olarak seçildi).
// Bölge açılımı GDD §12.3 sırası: Sazlık→Sanayi→Yakamoz→Buzul→Korsan→Delta→Bermuda.
// Bir bölgeyi açan seviye, YALNIZ önceki bölgelerden toplanabilen materyal ister (deadlock yok — testler doğrular).
(function (D) {
  'use strict';
  const L = (level, o) => Object.assign({ level, permit: false, materials: [], unlocks: [], cost: 0 }, o);
  D.BoatDB = D.deepFreeze([
    L(1, { name: 'Eski Sandal', band: 'Eski küçük sandal', cost: 0, stats: { capacity: 12, specialSlots: 2, treasure: 0, rareMult: 1, waitMult: 1, tolerance: [] },
      visual: { hull: 'dinghy', len: 300, color: '#9a6a3a', patches: 3, oars: true }, desc: 'Sızdırıyor ama seni seviyor.' }),
    L(2, { name: 'Yamalı Kayık', band: 'Onarılmış balıkçı teknesi', cost: 250, materials: [{ id: 'MAT_08', n: 3 }, { id: 'MAT_03', n: 2 }], unlocks: ['TS'],
      stats: { capacity: 16, specialSlots: 2, treasure: 0, rareMult: 1, waitMult: 1, tolerance: [] },
      visual: { hull: 'fishing', len: 340, color: '#3d8fe0', patches: 1, oars: true, bench: true }, desc: 'Yamaları renkli, gururu tam.' }),
    L(3, { name: 'Onarılmış Balıkçı Teknesi', band: 'Onarılmış balıkçı teknesi', cost: 700, materials: [{ id: 'MAT_03', n: 6 }, { id: 'MAT_07', n: 3 }, { id: 'MAT_SCRAP', n: 4 }], unlocks: ['PSK'],
      stats: { capacity: 20, specialSlots: 2, treasure: 0.01, rareMult: 1, waitMult: 1, tolerance: [] },
      visual: { hull: 'fishing', len: 370, color: '#2f7fc4', cabin: 'small', mast: true, oars: false }, desc: 'Gövde güçlendirildi; pas sularına dayanır.' }),
    L(4, { name: 'Motorlu Tekne', band: 'Motorlu ve sağlam tekne', cost: 1600, materials: [{ id: 'MAT_02', n: 8 }, { id: 'MAT_05', n: 5 }, { id: 'MAT_04', n: 3 }], unlocks: ['YK'],
      stats: { capacity: 24, specialSlots: 2, treasure: 0.01, rareMult: 1, waitMult: 0.95, tolerance: ['rust'] },
      visual: { hull: 'motor', len: 400, color: '#e0453d', cabin: 'small', mast: true, motor: 1, lamp: true }, desc: 'Motor ve navigasyon lambası: gece sularına hazır.' }),
    L(5, { name: 'Sağlam Motorlu Tekne', band: 'Motorlu ve sağlam tekne', cost: 2900, materials: [{ id: 'MAT_12', n: 5 }, { id: 'MAT_09', n: 4 }, { id: 'MAT_06', n: 2 }], unlocks: ['TB'],
      stats: { capacity: 28, specialSlots: 3, treasure: 0.015, rareMult: 1.02, waitMult: 0.93, tolerance: ['rust'] },
      visual: { hull: 'motor', len: 420, color: '#c9302c', cabin: 'big', mast: true, motor: 1, lamp: true, heater: true }, desc: 'Kabin ısıtıcısı: buzullara hazır. +1 özel eşya yuvası.' }),
    L(6, { name: 'Bölgesel Ekipmanlı Tekne', band: 'Bölgesel ekipmanlı tekne', cost: 4600, permit: true, materials: [{ id: 'MAT_10', n: 8 }, { id: 'MAT_15', n: 1 }, { id: 'MAT_04', n: 4 }], unlocks: ['BKM'],
      stats: { capacity: 32, specialSlots: 3, treasure: 0.02, rareMult: 1.03, waitMult: 0.9, tolerance: ['rust'] },
      visual: { hull: 'regional', len: 450, color: '#2a6a5a', cabin: 'big', mast: true, motor: 2, lamp: true, heater: true, iceplate: true, radar: true }, desc: 'Buz kaplaması ve radar: batık gemilerin arasında yön bulur.' }),
    L(7, { name: 'Korsan Takviyeli Tekne', band: 'Bölgesel ekipmanlı tekne', cost: 6800, permit: true, materials: [{ id: 'MAT_13', n: 6 }, { id: 'MAT_06', n: 4 }, { id: 'MAT_05', n: 6 }],
      stats: { capacity: 36, specialSlots: 3, treasure: 0.03, rareMult: 1.05, waitMult: 0.9, tolerance: ['rust', 'cold'] },
      visual: { hull: 'regional', len: 470, color: '#1f4a5a', cabin: 'big', mast: true, sail: true, motor: 2, lamp: true, heater: true, iceplate: true, radar: true, goldtrim: true }, desc: 'Altın pul işlemeli küpeşte. Soğuk artık sarmanı yavaşlatmaz.' }),
    L(8, { name: 'İleri Keşif Teknesi', band: 'İleri keşif teknesi', cost: 9500, permit: true, materials: [{ id: 'MAT_13', n: 8 }, { id: 'MAT_10', n: 8 }, { id: 'MAT_09', n: 6 }], unlocks: ['KKD'],
      stats: { capacity: 42, specialSlots: 3, treasure: 0.03, rareMult: 1.07, waitMult: 0.88, tolerance: ['rust', 'cold'] },
      visual: { hull: 'expedition', len: 500, color: '#e8e0d0', cabin: 'bridge', mast: true, motor: 2, lamp: true, radar: true, heatshield: true, antenna: true }, desc: 'Isı kalkanı: kaynar sulara girebilir.' }),
    L(9, { name: 'Derin Keşif Teknesi', band: 'İleri keşif teknesi', cost: 13500, permit: true, materials: [{ id: 'MAT_11', n: 10 }, { id: 'MAT_16', n: 1 }, { id: 'MAT_06', n: 6 }],
      stats: { capacity: 48, specialSlots: 4, treasure: 0.035, rareMult: 1.1, waitMult: 0.85, tolerance: ['rust', 'cold', 'heat'] },
      visual: { hull: 'expedition', len: 520, color: '#3a4a6a', cabin: 'bridge', mast: true, motor: 3, lamp: true, radar: true, heatshield: true, antenna: true, sonar: true }, desc: 'Sonar ve soğutma: sıcaklık gerilimi artık sorun değil. +1 yuva.' }),
    L(10, { name: 'Altın Dümen', band: 'Absürt ve gösterişli endgame teknesi', cost: 20000, permit: true, materials: [{ id: 'MAT_11', n: 14 }, { id: 'MAT_13', n: 10 }, { id: 'MAT_15', n: 2 }, { id: 'MAT_16', n: 2 }], unlocks: ['BG'],
      stats: { capacity: 60, specialSlots: 4, treasure: 0.045, rareMult: 1.15, waitMult: 0.8, tolerance: ['rust', 'cold', 'heat'] },
      visual: { hull: 'absurd', len: 560, color: '#f0c040', cabin: 'bridge', mast: true, sail: true, motor: 3, lamp: true, radar: true, heatshield: true, antenna: true, sonar: true, figurehead: true, disco: true, goldtrim: true }, desc: 'Altın kaplama, disko topu, bir de martı heykeli. Bermuda bile şaşırır.' })
  ]);
  D.boatLevel = (n) => D.BoatDB[n - 1];
})(globalThis.DUMEN);
