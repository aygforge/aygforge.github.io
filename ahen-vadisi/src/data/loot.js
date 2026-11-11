// Drop oranları ve rastgele bonus havuzları — belge §8.
// Oranlar yüzde cinsindendir; her tablo için N+U+R+E+L+boş = 100.

export const LOOT_TABLES = {
  normal: { N: 4, U: 1.2, R: 0.25, E: 0, L: 0, materialChance: 0.28, potionChance: 0.03 },
  elite: { N: 35, U: 25, R: 5, E: 0.75, L: 0, materialChance: 0.28, potionChance: 0.03 },
  alpha: { N: 20, U: 25, R: 18, E: 1.5, L: 0, materialChance: 0, potionChance: 0 },
  golem: { N: 0, U: 0, R: 28, E: 6, L: 0.4, materialChance: 0, potionChance: 0 },
  // V2 bossları: kanonik Rare listesi olmayan boss Rare havuzu = bölgenin seviye aralığındaki Rare şablonlar
  ash_giant: { N: 0, U: 0, R: 22, E: 2, L: 0, materialChance: 0, potionChance: 0 },
  frost_keeper: { N: 0, U: 0, R: 30, E: 7, L: 0.4, materialChance: 0, potionChance: 0 },
  // V3 bossları (belge): Mezar Komutanı R25/E3/L0 (açık dünya), Kayıp Kral R33/E8/L0,4 (Karanlık Mahzen)
  grave_commander: { N: 0, U: 0, R: 25, E: 3, L: 0, materialChance: 0, potionChance: 0 },
  lost_king: { N: 0, U: 0, R: 33, E: 8, L: 0.4, materialChance: 0, potionChance: 0 },
  // V4 bossları (belge): Fırtına Tiranı R26/E3,5/L0 (açık dünya), Göğün Mahkûmu R34/E9/L0,4 (Gökyarık Mabedi)
  storm_tyrant: { N: 0, U: 0, R: 26, E: 3.5, L: 0, materialChance: 0, potionChance: 0 },
  sky_prisoner: { N: 0, U: 0, R: 34, E: 9, L: 0.4, materialChance: 0, potionChance: 0 },
};
for (const t of Object.values(LOOT_TABLES)) {
  t.none = +(100 - t.N - t.U - t.R - t.E - t.L).toFixed(4);
}

// Legendary yalnız bu tablolardan çıkabilir. Değiştirilemez kural.
// V1: Maden Golemi. V2: Donmuş Muhafız (Buz Mabedi). V3: Kayıp Kral (Karanlık Mahzen). V4: Göğün Mahkûmu (Gökyarık Mabedi).
// Elitler, normal yaratıklar, Kül Devi, Mezar Komutanı, Fırtına Tiranı, sunak, görev ve üretim asla.
// V4: her izinli boss havuzunda dört sınıfın birer Legendary'si vardır; toplam oran yine %0,4 (eşya seçimi çekilişten sonra).
export const LEGENDARY_SOURCE_TABLES = ['golem', 'frost_keeper', 'lost_king', 'sky_prisoner'];
// Boss tabloları varyant (N/U temel şablon) üretmez; Rare havuzu seviye aralığındaki kanonik Rare'lerdir.
// golem 13–20: V1 havuzu aynen korunur (V2 Rare'leri Golem'den düşmez).
export const BOSS_RARE_POOL = { golem: [13, 20], ash_giant: [21, 26], frost_keeper: [26, 30], grave_commander: [31, 35], lost_king: [35, 40], storm_tyrant: [40, 45], sky_prisoner: [44, 50] };
// Donmuş Muhafız Epic havuzu: kanonik Kristal Kış Madalyonu + Buz Mabedi temalı (Buz Gardiyanı) Epic'ler varyant ağırlığında
export const BOSS_EXTRA_EPIC_SOURCES = { frost_keeper: ['ice_warden'] };
// V3: Mezar Komutanı'nın Epic havuzu = 2 özel silah + Komutan Yüzüğü / Lanet Kıran Kolye (kanonik); Kral'ınki kanonik listesi
// Legendary mevcut sınıfa %80 ağırlıklı (belge §8.4); kalan %20 diğer üç sınıfın eşyalarına eşit dağılır (V4)
export const LEGENDARY_CLASS_WEIGHT = 0.8;

// Varyant havuzu için seviye bandı: şablon seviyesi ∈ [kaynakLv - BAND_BELOW, kaynakLv + BAND_ABOVE]
export const VARIANT_BAND_BELOW = 9;
export const VARIANT_BAND_ABOVE = 1;

// Mevcut sınıf (ve her sınıf) eşyalarına ağırlık
export const CLASS_POOL_WEIGHT = { own: 2, other: 1 };
// Kanonik kaynak eşyası, varyant eşyasına göre ağırlık
export const CANONICAL_WEIGHT = 3;

// Rastgele bonus aralıkları (U / R / E)
// V4: dört sınıf. STR Warrior/Okçu, INT Mage/Ölü Çağıran; DEX, VIT ve diğerleri bütün sınıflar.
const ALL = ['warrior', 'mage', 'archer', 'necromancer'];
export const BONUS_TYPES = {
  str: { name: 'STR', U: [1, 2], R: [2, 4], E: [4, 7], cls: ['warrior', 'archer'], slots: 'all', fmt: 'flat' },
  dex: { name: 'DEX', U: [1, 2], R: [2, 4], E: [4, 7], cls: ALL, slots: 'all', fmt: 'flat' },
  int: { name: 'INT', U: [1, 2], R: [2, 4], E: [4, 7], cls: ['mage', 'necromancer'], slots: 'all', fmt: 'flat' },
  vit: { name: 'VIT', U: [1, 2], R: [2, 4], E: [4, 7], cls: ALL, slots: 'all', fmt: 'flat' },
  crit: { name: 'Kritik şansı', U: [1, 2], R: [2, 4], E: [4, 6], cls: ALL, slots: ['weapon', 'gloves', 'ring', 'amulet', 'helm'], fmt: 'pct' },
  atkspd: { name: 'Saldırı hızı', U: [2, 3], R: [3, 5], E: [5, 8], cls: ALL, slots: ['weapon', 'gloves', 'ring', 'amulet'], fmt: 'pct' },
  hp: { name: 'HP', U: [8, 15], R: [20, 35], E: [35, 60], cls: ALL, slots: ['offhand', 'helm', 'chest', 'gloves', 'boots', 'ring', 'amulet'], fmt: 'flat' },
  mp: { name: 'MP', U: [10, 18], R: [20, 40], E: [40, 70], cls: ALL, slots: ['offhand', 'helm', 'chest', 'gloves', 'boots', 'ring', 'amulet'], fmt: 'flat' },
  species: { name: 'Tür hasarı', U: [2, 4], R: [4, 7], E: [7, 10], cls: ALL, slots: ['weapon', 'ring', 'amulet'], fmt: 'pct' },
};
