export const MATERIALS = {
  // salvage materials
  arcane_dust:    { name: 'Kadim Toz', tier: 0, color: '#a7a1c9' },
  mystic_essence: { name: 'Mistik Öz', tier: 1, color: '#4f8dff' },
  void_crystal:   { name: 'Boşluk Kristali', tier: 2, color: '#b25cff' },
  starfire_shard: { name: 'Yıldız Ateşi Parçası', tier: 3, color: '#ffad33' },
  // region materials
  meadow_fang:    { name: 'Çayır Dişi', tier: 0, region: 'broken_meadows', color: '#d8cfa8' },
  chitin_shard:   { name: 'Kabuk Parçası', tier: 0, region: 'broken_meadows', color: '#7f8a5a' },
  venom_sac:      { name: 'Zehir Kesesi', tier: 1, region: 'greenshade', color: '#7ad04f' },
  heartwood:      { name: 'Özağaç', tier: 1, region: 'greenshade', color: '#8a5a2b' },
  rust_gear:      { name: 'Paslı Dişli', tier: 2, region: 'rusted_forges', color: '#b0603a' },
  ember_core:     { name: 'Kor Çekirdeği', tier: 2, region: 'rusted_forges', color: '#ff7a2a' },
  // herbs (alchemy)
  bloodroot:      { name: 'Kan Kökü', tier: 0, herb: true, color: '#c43b4a' },
  moonpetal:      { name: 'Ay Yaprağı', tier: 1, herb: true, color: '#c7d7ff' },
  // consumables (elixirs) — stored as stackable balances
  elixir_hunter:  { name: 'Avcı İksiri', consumable: true, buff: { id: 'xp', stat: 'xpBonus', value: 0.1, durationS: 1800 }, color: '#4fd06a' },
  elixir_fury:    { name: 'Öfke İksiri', consumable: true, buff: { id: 'dmg', stat: 'dmgPct', value: 0.08, durationS: 1800 }, color: '#ff5a3a' },
  elixir_stone:   { name: 'Taş Deri İksiri', consumable: true, buff: { id: 'armor', stat: 'armorPct', value: 0.12, durationS: 1800 }, color: '#9aa0a8' },
};

// Salvage yields by rarity: [materialId, min, max]
export const SALVAGE_YIELD = [
  [['arcane_dust', 1, 2]],
  [['arcane_dust', 2, 3]],
  [['arcane_dust', 2, 3], ['mystic_essence', 1, 1]],
  [['mystic_essence', 2, 2], ['void_crystal', 1, 1]],
  [['void_crystal', 2, 2], ['starfire_shard', 1, 1]],
  [['void_crystal', 3, 3], ['starfire_shard', 2, 2]],
  [['void_crystal', 4, 4], ['starfire_shard', 3, 3]],
];
