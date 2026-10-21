// Drop oranları ve rastgele bonus havuzları — belge §8.
// Oranlar yüzde cinsindendir; her tablo için N+U+R+E+L+boş = 100.

export const LOOT_TABLES = {
  normal: { N: 4, U: 1.2, R: 0.25, E: 0, L: 0, materialChance: 0.28, potionChance: 0.03 },
  elite: { N: 35, U: 25, R: 5, E: 0.75, L: 0, materialChance: 0.28, potionChance: 0.03 },
  alpha: { N: 20, U: 25, R: 18, E: 1.5, L: 0, materialChance: 0, potionChance: 0 },
  golem: { N: 0, U: 0, R: 28, E: 6, L: 0.4, materialChance: 0, potionChance: 0 },
};
for (const t of Object.values(LOOT_TABLES)) {
  t.none = +(100 - t.N - t.U - t.R - t.E - t.L).toFixed(4);
}

// Legendary yalnız bu tablodan çıkabilir. Değiştirilemez kural.
export const LEGENDARY_SOURCE_TABLE = 'golem';
// Legendary mevcut sınıfa %80 ağırlıklı (belge §8.4)
export const LEGENDARY_CLASS_WEIGHT = 0.8;

// Varyant havuzu için seviye bandı: şablon seviyesi ∈ [kaynakLv - BAND_BELOW, kaynakLv + BAND_ABOVE]
export const VARIANT_BAND_BELOW = 9;
export const VARIANT_BAND_ABOVE = 1;
// Boss Rare havuzu (kanonik Rare listesi olmayan Golem için): üst seviye Rare şablonlar
export const GOLEM_RARE_MIN_LEVEL = 13;

// Mevcut sınıf (ve her sınıf) eşyalarına ağırlık
export const CLASS_POOL_WEIGHT = { own: 2, other: 1 };
// Kanonik kaynak eşyası, varyant eşyasına göre ağırlık
export const CANONICAL_WEIGHT = 3;

// Rastgele bonus aralıkları (U / R / E)
export const BONUS_TYPES = {
  str: { name: 'STR', U: [1, 2], R: [2, 4], E: [4, 7], cls: ['warrior'], slots: 'all', fmt: 'flat' },
  dex: { name: 'DEX', U: [1, 2], R: [2, 4], E: [4, 7], cls: ['warrior', 'mage'], slots: 'all', fmt: 'flat' },
  int: { name: 'INT', U: [1, 2], R: [2, 4], E: [4, 7], cls: ['mage'], slots: 'all', fmt: 'flat' },
  vit: { name: 'VIT', U: [1, 2], R: [2, 4], E: [4, 7], cls: ['warrior', 'mage'], slots: 'all', fmt: 'flat' },
  crit: { name: 'Kritik şansı', U: [1, 2], R: [2, 4], E: [4, 6], cls: ['warrior', 'mage'], slots: ['weapon', 'gloves', 'ring', 'amulet', 'helm'], fmt: 'pct' },
  atkspd: { name: 'Saldırı hızı', U: [2, 3], R: [3, 5], E: [5, 8], cls: ['warrior', 'mage'], slots: ['weapon', 'gloves', 'ring', 'amulet'], fmt: 'pct' },
  hp: { name: 'HP', U: [8, 15], R: [20, 35], E: [35, 60], cls: ['warrior', 'mage'], slots: ['offhand', 'helm', 'chest', 'gloves', 'boots', 'ring', 'amulet'], fmt: 'flat' },
  mp: { name: 'MP', U: [10, 18], R: [20, 40], E: [40, 70], cls: ['warrior', 'mage'], slots: ['offhand', 'helm', 'chest', 'gloves', 'boots', 'ring', 'amulet'], fmt: 'flat' },
  species: { name: 'Tür hasarı', U: [2, 4], R: [4, 7], E: [7, 10], cls: ['warrior', 'mage'], slots: ['weapon', 'ring', 'amulet'], fmt: 'pct' },
};
