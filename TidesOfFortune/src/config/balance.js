// Tides of Fortune — merkezi denge ve konfigürasyon parametreleri.
// GDD'de kesinleşmiş değerler "GDD" yorumuyla işaretlidir. GDD'de açık bırakılmış
// (veya HTML5 sürümü için eklenen) değerler "KARAR" yorumuyla işaretlidir ve
// docs/DESIGN_DECISIONS.md içinde açıklanır.

export const SAVE_VERSION = 5;

export const BALANCE = {
  start: {
    gold: 100, // GDD
    shipLevel: 1, // GDD
    freeStarterItems: true, // KARAR: ilk limanda 3 ücretsiz başlangıç itemi
    starterItemCount: 3, // GDD (3 item seçilir)
  },

  route: {
    minHarbors: 6, // GDD
    maxHarbors: 10, // GDD
    distances: [
      { id: 'short', weight: 35, events: [2, 2] }, // GDD
      { id: 'medium', weight: 45, events: [3, 4] }, // GDD
      { id: 'long', weight: 20, events: [5, 6] }, // GDD
    ],
    minEventsPerRoute: 1, // KARAR: event azaltıcılar bir rotayı 0'a indiremez
    fogHarborExtraEvent: 1, // KARAR: "Sis limanı: olaylar sık" → sis limanına giden rota +1 event
  },

  // GDD: bölgeye göre event ağırlıkları (yüzde)
  regionWeights: {
    1: { danger: 15, fortune: 55, mystery: 20, disaster: 0, chain: 10 },
    2: { danger: 30, fortune: 35, mystery: 20, disaster: 5, chain: 10 },
    3: { danger: 35, fortune: 25, mystery: 25, disaster: 5, chain: 10 },
    4: { danger: 45, fortune: 15, mystery: 20, disaster: 10, chain: 10 },
    5: { danger: 40, fortune: 10, mystery: 25, disaster: 15, chain: 10 },
  },
  repairWeightBase: 3, // KARAR: tamir eventlerinin normal ağırlığı
  repairWeightCriticalBonus: 15, // GDD
  dangerWeightCriticalPenalty: 10, // GDD
  mysteryIslandDangerBonus: 10, // KARAR: "Gizemli Ada: tehlikeli yol"
  zipirFortuneBonus: 10, // GDD (+%10 → puan olarak)
  zipirOldFriendsFortuneBonus: 15, // GDD (toplam %15)
  tarcinSkipFortunePenalty: 5, // GDD

  // Bölgeye göre event hasar çarpanı. KARAR: gemi büyüdükçe olaylar da sertleşir.
  regionDamageMult: { 1: 0.9, 2: 1.2, 3: 1.6, 4: 2.2, 5: 2.8 },
  regionGoldMult: { 1: 1.1, 2: 1.35, 3: 1.65, 4: 2.0, 5: 2.4 },

  hull: {
    // GDD: yüzde eşikleri (alt sınırlar)
    categories: [
      { id: 'healthy', min: 76 },
      { id: 'damaged', min: 51 },
      { id: 'critical', min: 26 },
      { id: 'sinking', min: 1 },
    ],
    escapePenalty: { healthy: 0, damaged: 5, critical: 15, sinking: 25 }, // GDD
    cargoPenalty: { healthy: 0, damaged: 0, critical: 1, sinking: 2 }, // GDD
    leakDamage: 3, // GDD
  },

  repair: {
    partialCost: { sinking: 80, critical: 120, damaged: 160 }, // GDD
    fullCostPerHp: 3, // GDD
    patchHp: 20, // GDD
    patchCost: 60, // GDD
    repairKitHp: 30, // GDD
    grootRouteHp: 10, // GDD
    docArrivalHp: 15, // GDD
    esperanzaBonusHp: 15, // GDD
  },

  // KARAR: GDD'de yükseltme fiyatı yok. Simülasyonla "2–3 limanda bir" hedefine göre ayarlandı.
  shipUpgradeCost: { 2: 180, 3: 420, 4: 800, 5: 1350 },
  shipUpgradeKeepsDamage: true, // KARAR: yükseltmede hasar oranı korunmaz; eksik HP aynı kalır

  trade: {
    priceJitter: 0.2, // DENGE: seed kaynaklı ±%20 fiyat sapması (limanlar arası fark)
    valueFactor: 0.92, // DENGE: malın piyasa değeri = baz satış × 0.92 × liman çarpanı
    spread: 0.1, // DENGE: alış değerin %5 üstünde, satış %5 altında → aynı fiyat bölgesinde al-sat zararlı
    saturationPerUnit: 0.05, // DENGE: aynı ziyarette aynı maldan her satılan birim sonraki fiyatı %5 düşürür
    saturationFloor: 0.7,
    harborMultJitter: 0.05, // KARAR: liman çarpanlarına ±%5 sapma
    marketGoods: [5, 7], // KARAR: limanda alınabilir mal çeşidi
    marketStock: [2, 6], // KARAR: mal başına stok
    spoiledSellFactor: 0.4, // GDD
    xpPerProfit: 10, // GDD: her 10 altın kâr = 1 XP
    distanceSpoilMult: { short: 0.6, medium: 1.0, long: 1.4 }, // KARAR
    contrabandStatusMult: 1.2, // GDD (kaçak statüsü: fiyatlar %20 pahalı)
    fineSellMult: 0.8, // GDD (fiyat cezası %20)
    heroBuyMult: 0.8, // GDD (kahraman: fiyatlar %20 ucuz)
    damagedHarborStockMult: 0.5, // GDD
    friendlyTraderBonus: 0.2, // GDD (Dostane Tüccar +%20)
    regionDemandRange: [0.72, 1.38], // DENGE: run başına bölge × mal arz-talep çarpanı (bölgeler arası belirgin fark)
  },

  // KARAR (rework): belirsiz deniz yolları
  lanes: {
    baseTypeAccuracy: 60, // liman tipi ipucunun doğru olma şansı (%)
    baseRumorAccuracy: 65, // ticaret söylentisinin doğru olma şansı (%)
    dangerWeightPerLevel: 4, // yol tehlike seviyesi başına tehlike ağırlığı
  },

  // KARAR (rework): gerçek zamanlı seyir
  voyage: {
    duration: { short: [90, 150], medium: [130, 190], long: [170, 240] }, // saniye
    minGap: 22, // eventler arası en az normal seyir (sn)
    firstEventMin: 20,
    approachTime: 5, // karşılaşma yaklaşma animasyonu (sn)
    dockTime: 7, // limana yanaşma animasyonu (sn)
    sailRate: 3, // sakin seyirde yolculuk zamanının akış hızı (eskiden isteğe bağlı ×3; artık varsayılan, düğme kaldırıldı)
    fastForward: 3, // (eski) uyumluluk
  },

  items: {
    offers: [8, 9], // GDD
    swapFee: 30, // KARAR: slot doluyken değiştirme ücreti
    travelingMerchantDiscount: 0.2, // GDD
    rareChanceByRegion: { 1: 0.0, 2: 0.08, 3: 0.2, 4: 0.3, 5: 0.4 }, // KARAR
  },

  crew: {
    offers: [2, 3], // GDD
    pitaMult: 1.1, // GDD
    pitaTarcinMult: 1.15, // GDD (moral +%5)
  },

  pets: {
    offerChance: { default: 30, fishing: 40, mystery: 50 }, // GDD
    biscuitCost: 10, // GDD
    biscuitBonus: 1.08, // GDD
    biscuitCrateTarcinBonus: 1.15, // GDD
    tarcinWarnBaseChance: 70, // KARAR: Tarçın'ın ekstra seçeneğinin temel başarı şansı
    deckEventChance: 35, // yüzde: gemide hayvan varken bir yolculukta hayvana özel gemi içi olay (normal slotun yerine)
    monkeyTheftChance: 0.12, // KARAR: Cüce Kaptan'ın komik hırsızlık eventi (rota başına)
  },

  special: {
    firstWithinHarbors: 3, // ilk karşılaşma olursa ilk 3 limandan birinde
    firstChance: 40, // yüzde; // DENGE: Zıpır/Tarçın'dan biriyle karşılaşma artık garanti değil (run'ların ~%40'ı)
    secondChance: 30, // yüzde; // DENGE: biri gemideyken diğeriyle de karşılaşma (Eski Dostlar ≈ run'ların %12'si)
    secondAfterHarbors: [2, 4], // GDD
  },

  xp: {
    arrival: 10, // GDD
    eventSuccess: 5, // GDD
    exploration: 15, // GDD
    newHarborType: 25, // GDD
    runComplete: 100, // GDD
    grandHarborMult: 2, // GDD
    solaraBonus: 0.2, // GDD
    sunGraceBonus: 0.1, // GDD
    explorerSpiritBonus: 0.5, // GDD
    fishingVillageArrivalMult: 0.5, // KARAR: "Balıkçı Köyü: düşük XP"
  },

  harborEconomy: {
    // KARAR: liman tipine göre genel alış/satış eğilimleri (mal çarpanlarına ek)
    fishing: { buy: 0.9, sell: 0.95 },
    trade: { buy: 1.1, sell: 1.12 },
    military: { buy: 1.0, sell: 1.0 },
    pirate: { buy: 1.05, sell: 1.05 },
    fog: { buy: 0.85, sell: 0.95 },
    mystery: { buy: 1.0, sell: 1.05 },
    volcanic: { buy: 1.0, sell: 1.0 },
    ice: { buy: 1.1, sell: 1.1 },
  },

  render: {
    pixelScale: 2, // dünya sahnesi 1/2 çözünürlükte (640×360) çizilir ve büyütülür
    maxDpr: 2,
  },
};

export const XP_SOURCES = ['arrival', 'trade', 'events', 'exploration', 'discovery', 'complete', 'other'];
