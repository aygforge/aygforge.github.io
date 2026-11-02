// EconomyConfig — TÜRETİLMİŞ (derived) denge parametreleri. GDD kanonu DEĞİLDİR; gerekçeler CANON_GAPS.md'de.
(function (D) {
  'use strict';
  D.EconomyConfig = D.deepFreeze({
    version: 1,
    startCoins: 60,
    // Balık fiyatı = temelDeğer × nadirlik × boy × tazelik × özel bonus  (GDD §14.3)
    regionBase: { EL: 10, TS: 16, PSK: 26, YK: 40, TB: 60, BKM: 85, KKD: 120, BG: 170 },
    rarityMult: { common: 1, uncommon: 1.8, rare: 3.4, epic: 6.5, legendary: 18, boss: 60 },
    sizeMultRange: [0.8, 1.25], // boy aralığı içinde doğrusal
    // Tazelik: AKTİF oyun saatine bağlı (saniye). Sahne değişimi / kapalı oyun bozulma yapmaz.
    freshness: {
      FRESH: { maxAge: 10 * 60, mult: 1.0, label: 'Taze' },
      NORMAL: { maxAge: 25 * 60, mult: 0.78, label: 'Normal' },
      STALE: { maxAge: Infinity, mult: 0.0, label: 'Bayat' } // Rüstem bayat almaz → fabrika
    },
    rustemAcceptsStale: false,
    factory: { coinMult: { FRESH: 0.22, NORMAL: 0.26, STALE: 0.32 } }, // her zaman Rüstem fiyatının altında
    trashScrap: 2, // çöp başına CUR_SCRAP (fabrika ayrıştırma)
    meltScrap: { MAT_SCRAP: 5, CUR_SCRAP: 12 }, // Hasan: 5 Hurda Metal → 12 Scrap (açık tarif)
    sizeLabels: [ { t: 0.0, label: 'Küçük' }, { t: 0.3, label: 'Normal' }, { t: 0.65, label: 'Büyük' }, { t: 0.88, label: 'Dev' } ],
    boardSlots: 4,
    boardRefreshSec: 8 * 60,
    dailyCount: 3,
    donJobCooldownSec: 6 * 60,
    roundingRule: 'Math.round, en az 1 coin (satılabilir örnekler için)',
    rewardedAdsPerDay: 2,
    freeSpinsPerDay: 1
  });

  // Tek yuvarlama noktası.
  D.roundCoin = (x) => Math.max(0, Math.round(x));
})(globalThis.DUMEN);
