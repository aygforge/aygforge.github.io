// Monetizasyon yapılandırması — GERÇEK kimlikler kullanıcı tarafından girilir; burada UYDURULMUŞ ID YOKTUR.
// Google'ın herkese açık AdMob TEST kimlikleri yalnız debug/test derlemeleri içindir (gerçek gelir üretmez).
export const MONETIZATION = {
  admob: {
    // Play Console / AdMob hesabından: ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY ve birim ID'leri. null = yapılandırılmadı.
    appId: null,
    units: { rewarded: null, interstitial: null },
    // Google's public test ad units (documented by Google for development)
    testAppId: 'ca-app-pub-3940256099942544~3347511713',
    testUnits: { rewarded: 'ca-app-pub-3940256099942544/5224354917', interstitial: 'ca-app-pub-3940256099942544/1033173712' },
    useTestAds: true, // set false only with real IDs above
  },
  billing: {
    // Play Console'da oluşturulacak ürün kimlikleri (öneri; mağazada aynı adla açılmalı)
    products: {
      remove_ads: { type: 'non_consumable' },
      starter_pack: { type: 'non_consumable', grant: { tips: 500, parts: 60 } },
      tip_pack: { type: 'consumable', grant: { tips: 1500 } },
      apron_cosmetic: { type: 'non_consumable' },
    },
  },
};
export const needsConfiguration = () => !MONETIZATION.admob.appId || !MONETIZATION.admob.units.rewarded;
