// GDD Bölüm 7: 15 ticari mal ve liman tipi fiyat çarpanları.
export const GOOD_GROUPS = {
  basic: 'Temel',
  valuable: 'Değerli',
  rare: 'Nadir',
  special: 'Özel',
};

const G = (id, name, group, buy, sell, spoil, extra = {}) => ({ id, name, group, buy, sell, spoil, ...extra });

export const GOODS = [
  G('GOOD_GRAIN', 'Tahıl', 'basic', 30, 50, 10),
  G('GOOD_SALT', 'Tuz', 'basic', 25, 45, 5),
  G('GOOD_FISH', 'Balık', 'basic', 20, 40, 30, { note: 'Çabuk bozulur' }),
  G('GOOD_TIMBER', 'Kereste', 'basic', 40, 65, 5),
  G('GOOD_SANDSTONE', 'Kum Taşı', 'basic', 30, 50, 2),
  G('GOOD_SPICE', 'Baharat', 'valuable', 80, 140, 15),
  G('GOOD_SILK', 'İpek', 'valuable', 120, 200, 20),
  G('GOOD_OLIVE_OIL', 'Zeytinyağı', 'valuable', 70, 120, 10),
  G('GOOD_WINE', 'Şarap', 'valuable', 90, 150, 15),
  G('GOOD_PORCELAIN', 'Porselen', 'valuable', 110, 180, 25, { note: 'Kırılgan' }),
  G('GOOD_GOLD_BAR', 'Altın Külçe', 'rare', 300, 500, 0, { contraband: true, note: 'Askerî limanlarda kaçak sayılır' }),
  G('GOOD_ANTIQUE', 'Antika', 'rare', 200, 380, 10),
  G('GOOD_EXOTIC_ANIMAL', 'Egzotik Hayvan', 'rare', 250, 420, 20, { contraband: true, note: 'Askerî limanlarda kaçak sayılır' }),
  G('GOOD_CHARM_DUST', 'Tılsım Tozu', 'rare', 180, 300, 5, { contraband: true, note: 'Askerî limanlarda kaçak sayılır' }),
  G('GOOD_BISCUIT_CRATE', 'Bisküvi Kasası', 'special', 15, 20, 5, { note: "Kargodaysa Tarçın'ın tüm becerileri +%15" }),
  // Zincir eventlerine özel, satılamaz kargo
  G('GOOD_PIRATE_CHEST', 'Kilitli Korsan Sandığı', 'special', 0, 0, 0, { questItem: true, contraband: true, note: 'Korsanın Teklifi zinciri. Satılamaz.' }),
  // Liman sözleşmeleri (X1): görev kargoları kapasite kullanır, normal ticarette satılamaz
  G('GOOD_X1_SEALED_SPICE', 'Mühürlü Baharat Kasası', 'special', 0, 0, 0, { questItem: true, contract: true, note: 'Lonca sözleşmesi. Satılamaz.' }),
  G('GOOD_X1_RELIEF', 'Yardım Sandığı', 'special', 0, 0, 0, { questItem: true, contract: true, note: 'Muhafız yardım sözleşmesi. Satılamaz.' }),
  G('GOOD_X1_BLACK_CARGO', 'Kara Yelken Sandığı', 'special', 0, 0, 0, { questItem: true, contract: true, contraband: true, note: 'Kaçak sözleşme yükü. Denetimde el konabilir.' }),
  G('GOOD_X1_RECORDS', 'Kayıp Kayıt Sandığı', 'special', 0, 0, 0, { questItem: true, contract: true, note: 'Lonca kurtarma sözleşmesi. Satılamaz.' }),
];

export const TRADE_GOODS = GOODS.filter((g) => !g.questItem);
export const GOOD_BY_ID = Object.fromEntries(GOODS.map((g) => [g.id, g]));

// GDD: liman tipine göre fiyat çarpanları
export const HARBOR_PRICE_MULT = {
  fishing: { GOOD_FISH: 0.5, GOOD_SALT: 0.7, GOOD_SILK: 1.4 },
  trade: { GOOD_SPICE: 1.3, GOOD_SILK: 1.2, GOOD_GRAIN: 0.9 },
  military: { GOOD_GRAIN: 1.2, GOOD_TIMBER: 1.3, GOOD_GOLD_BAR: 0.8 },
  pirate: { GOOD_GOLD_BAR: 1.5, GOOD_EXOTIC_ANIMAL: 1.4, GOOD_CHARM_DUST: 1.3 },
  fog: { GOOD_CHARM_DUST: 1.5, GOOD_ANTIQUE: 1.4 },
  mystery: { GOOD_ANTIQUE: 1.6, GOOD_CHARM_DUST: 1.5 },
  volcanic: { GOOD_SALT: 1.4, GOOD_SANDSTONE: 0.6 },
  ice: { GOOD_SILK: 1.5, GOOD_WINE: 1.4, GOOD_FISH: 1.3 },
};

// KARAR: liman tipine göre pazarda bulunma olasılığı yüksek mallar
export const HARBOR_MARKET_BIAS = {
  fishing: ['GOOD_FISH', 'GOOD_SALT', 'GOOD_GRAIN', 'GOOD_TIMBER', 'GOOD_BISCUIT_CRATE'],
  trade: ['GOOD_SPICE', 'GOOD_SILK', 'GOOD_WINE', 'GOOD_PORCELAIN', 'GOOD_OLIVE_OIL', 'GOOD_GRAIN'],
  military: ['GOOD_GRAIN', 'GOOD_TIMBER', 'GOOD_SALT', 'GOOD_OLIVE_OIL', 'GOOD_BISCUIT_CRATE'],
  pirate: ['GOOD_GOLD_BAR', 'GOOD_EXOTIC_ANIMAL', 'GOOD_CHARM_DUST', 'GOOD_WINE', 'GOOD_ANTIQUE'],
  fog: ['GOOD_CHARM_DUST', 'GOOD_ANTIQUE', 'GOOD_FISH', 'GOOD_SALT'],
  mystery: ['GOOD_ANTIQUE', 'GOOD_CHARM_DUST', 'GOOD_EXOTIC_ANIMAL', 'GOOD_SPICE'],
  volcanic: ['GOOD_SANDSTONE', 'GOOD_GOLD_BAR', 'GOOD_SALT', 'GOOD_TIMBER'],
  ice: ['GOOD_FISH', 'GOOD_TIMBER', 'GOOD_SALT', 'GOOD_ANTIQUE'],
};
