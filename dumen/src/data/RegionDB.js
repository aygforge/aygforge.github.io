// RegionDB — 8 kanonik bölge (GDD §8). Ad ve sıra kaynaktan; görsel/ses/çevre/kilit parametreleri türetilmiştir.
(function (D) {
  'use strict';
  const src = D.FishDBSource;
  const byCode = Object.fromEntries(src.regions.map((r) => [r.code, r]));
  const R = (code, o) => Object.assign({ code, name: byCode[code].name, fishIds: src.RegionFishIndex[code].slice() }, o);

  D.RegionDB = D.deepFreeze({
    EL: R('EL', {
      order: 1, role: 'Başlangıç', biome: 'Ahşap iskele, sakin deniz', danger: 1, unlock: { boatLevel: 1 },
      unlockText: 'Başlangıçta açık.', recommended: 'Tahta Olta, Ekmek Topu',
      chestPool: [{ id: 'CHEST_01', w: 80 }, { id: 'CHEST_08', w: 6 }], trashRate: 0.14, treasureRate: 0.09,
      env: null, envText: 'Sakin sular. Öğrenmek için ideal.',
      palette: { sky: ['#8fd3f5', '#ffe3b0'], sea: ['#2e9ac4', '#14587e'], deep: ['#1d6f93', '#0b3249'], accent: '#f2b84b' },
      music: { scale: [0, 2, 4, 7, 9], root: 60, tempo: 92, wave: 'triangle', mood: 'sakin' }
    }),
    TS: R('TS', {
      order: 2, role: 'Erken oyun', biome: 'Saz, sis, kurbağalar', danger: 2, unlock: { boatLevel: 2 },
      unlockText: 'Tekne Seviye 2 (erken geliştirme).', recommended: 'Dengeli Olta, Mısır Tanesi',
      chestPool: [{ id: 'CHEST_01', w: 55 }, { id: 'CHEST_02', w: 30 }, { id: 'CHEST_08', w: 7 }], trashRate: 0.13, treasureRate: 0.09,
      env: { type: 'fog', text: 'Sis: siluetler daha geç belirir.' },
      palette: { sky: ['#b9d3a8', '#e8eccd'], sea: ['#5c8a52', '#2f5434'], deep: ['#3b6640', '#16301c'], accent: '#c4d65e' },
      music: { scale: [0, 3, 5, 7, 10], root: 57, tempo: 78, wave: 'sine', mood: 'uykulu' }
    }),
    PSK: R('PSK', {
      order: 3, role: 'Erken/orta', biome: 'Boru, fabrika, pas', danger: 3, unlock: { boatLevel: 3 },
      unlockText: 'Tekne Seviye 3 (gövde dayanıklılığı).', recommended: 'Sağlam Olta, Paslı Cıvata Yemi',
      chestPool: [{ id: 'CHEST_02', w: 70 }, { id: 'CHEST_08', w: 12 }], trashRate: 0.22, treasureRate: 0.1,
      env: { type: 'rust', text: 'Pas: misina dayanımı %15 düşer (Pas Yiyen Olta / Tekne Sv.4 korur).', lineStrengthMult: 0.85, counterRods: ['ROD_08'], counterBoat: 4 },
      palette: { sky: ['#c9a27a', '#e8cfa6'], sea: ['#7a6040', '#3b2a1a'], deep: ['#5a4630', '#21170d'], accent: '#d9762b' },
      music: { scale: [0, 1, 5, 7, 8], root: 52, tempo: 104, wave: 'square', mood: 'metalik' }
    }),
    YK: R('YK', {
      order: 4, role: 'Orta', biome: 'Parlayan gece suyu', danger: 4, unlock: { boatLevel: 4 },
      unlockText: 'Tekne Seviye 4 (navigasyon).', recommended: 'Usta Oltası, Yakamoz Jölesi, Neon Şamandıra',
      chestPool: [{ id: 'CHEST_04', w: 60 }, { id: 'CHEST_02', w: 20 }, { id: 'CHEST_08', w: 10 }], trashRate: 0.1, treasureRate: 0.1,
      env: { type: 'dark', text: 'Karanlık: sahte parıltılar silueti karıştırır (Yakamoz Fısıldayan / Neon Şamandıra / Yakamoz Misina gösterir).', counterRods: ['ROD_09'], counterFloat: 'FLOAT_03', counterLine: 'LINE_03' },
      palette: { sky: ['#140f3a', '#3b2a78'], sea: ['#26206b', '#0c0a2c'], deep: ['#1a1550', '#05041a'], accent: '#c48cff' },
      music: { scale: [0, 2, 3, 7, 9], root: 62, tempo: 70, wave: 'sine', mood: 'mistik' }
    }),
    TB: R('TB', {
      order: 5, role: 'Orta/ileri', biome: 'Buz, soğuk rüzgâr', danger: 5, unlock: { boatLevel: 5 },
      unlockText: 'Tekne Seviye 5 (soğuk hazırlığı).', recommended: 'Buzkıran Olta, Buz Kıran Misina, Buzlu Hamsi Küpü',
      chestPool: [{ id: 'CHEST_05', w: 60 }, { id: 'CHEST_08', w: 12 }], trashRate: 0.1, treasureRate: 0.1,
      env: { type: 'cold', text: 'Soğuk: sarma hızı %22 düşer (Buzkıran Olta / Buz Kıran Misina / Tekne Sv.7 korur).', reelMult: 0.78, counterRods: ['ROD_06'], counterLine: 'LINE_04', counterBoat: 7 },
      palette: { sky: ['#cfe9f7', '#f5fbff'], sea: ['#6db3d6', '#2b6d94'], deep: ['#4f94bb', '#173f5c'], accent: '#9fe2ff' },
      music: { scale: [0, 2, 7, 9, 11], root: 67, tempo: 66, wave: 'sine', mood: 'soğuk' }
    }),
    BKM: R('BKM', {
      order: 6, role: 'İleri', biome: 'Batık gemiler', danger: 6, unlock: { boatLevel: 6 },
      unlockText: 'Tekne Seviye 6 (motor + navigasyon; Tersane İzni gerekir).', recommended: 'Korsan Çengeli, Hayalet Sardalya',
      chestPool: [{ id: 'CHEST_03', w: 55 }, { id: 'CHEST_08', w: 14 }, { id: 'CHEST_09', w: 8 }], trashRate: 0.12, treasureRate: 0.16,
      env: { type: 'ghost', text: 'Hayaletler: bazı hamleler sinyalsiz gelir (Korsan Çengeli sinyali geri getirir).', counterHook: 'HOOK_04' },
      palette: { sky: ['#4f6b6a', '#9fb5a6'], sea: ['#2c5650', '#0f2523'], deep: ['#1f403c', '#07120f'], accent: '#7dffc8' },
      music: { scale: [0, 2, 3, 5, 7, 8, 10], root: 50, tempo: 96, wave: 'sawtooth', mood: 'macera' }
    }),
    KKD: R('KKD', {
      order: 7, role: 'İleri', biome: 'Buhar, sıcak akıntılar', danger: 7, unlock: { boatLevel: 8 },
      unlockText: 'Tekne Seviye 8 (ısı kalkanı).', recommended: 'Kızıl Isırgan Olta, Acı Lava Çekirdeği',
      chestPool: [{ id: 'CHEST_06', w: 55 }, { id: 'CHEST_08', w: 12 }, { id: 'CHEST_09', w: 8 }], trashRate: 0.1, treasureRate: 0.11,
      env: { type: 'heat', text: 'Sıcaklık: gerilim %18 hızlı dolar (Kızıl Isırgan Olta / Tekne Sv.9 korur).', tensionMult: 1.18, counterRods: ['ROD_07'], counterBoat: 9 },
      palette: { sky: ['#5a1a12', '#e0662e'], sea: ['#9a3a1c', '#3b0f07'], deep: ['#6a2410', '#1a0502'], accent: '#ff9a3c' },
      music: { scale: [0, 1, 4, 5, 7, 8, 11], root: 55, tempo: 126, wave: 'square', mood: 'hareketli' }
    }),
    BG: R('BG', {
      order: 8, role: 'Endgame', biome: 'Gerçeküstü dönen sular', danger: 8, unlock: { boatLevel: 10, flag: 'bermudaCoords' },
      unlockText: 'Tekne Seviye 10 + Bermuda koordinatları (Komplo Teorisyeni, 3. bölüm).', recommended: 'Yakamoz Fısıldayan Olta, Alüminyum Folyo Böceği, Efsane Sosu',
      chestPool: [{ id: 'CHEST_07', w: 55 }, { id: 'CHEST_09', w: 12 }, { id: 'CHEST_08', w: 8 }], trashRate: 0.08, treasureRate: 0.12,
      env: { type: 'anomaly', text: 'Anomali: gerilim rastgele dalgalanır, silüetler bozulur (Yakamoz Fısıldayan Olta dengeler).', wobble: 0.06, counterRods: ['ROD_09'] },
      palette: { sky: ['#1b0f33', '#3fd2c7'], sea: ['#25145a', '#060312'], deep: ['#1a0c40', '#020108'], accent: '#5ff5e0' },
      music: { scale: [0, 1, 3, 6, 7, 10], root: 48, tempo: 84, wave: 'sawtooth', mood: 'sürreal' }
    })
  });
})(globalThis.DUMEN);
