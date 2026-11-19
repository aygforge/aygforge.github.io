// Blacksmith (equipment) and alchemist (elixir) recipes.
// Equipment recipes ONLY consume account-scope (tradeable-economy) materials.
// Alchemy recipes may consume character-bound offline materials; the output is then bound.

export const SMITH_RECIPES = [
  { id: 'craft_t1', name: 'Çayır Dökümü', tier: 1, itemLevel: 10, reqLevel: 5, gold: 200,
    mats: { meadow_fang: 6, chitin_shard: 4, arcane_dust: 4 }, rarityWeights: [0, 60, 32, 7.5, 0.5] },
  { id: 'craft_t2', name: 'Koru Dökümü', tier: 2, itemLevel: 20, reqLevel: 15, gold: 1500,
    mats: { venom_sac: 6, heartwood: 6, mystic_essence: 2 }, rarityWeights: [0, 50, 38, 11, 1] },
  { id: 'craft_t3', name: 'Ocak Dökümü', tier: 3, itemLevel: 30, reqLevel: 25, gold: 6000,
    mats: { rust_gear: 8, ember_core: 6, void_crystal: 1 }, rarityWeights: [0, 40, 42, 16, 2] },
];
export const SMITH_BY_ID = Object.fromEntries(SMITH_RECIPES.map((r) => [r.id, r]));

export const ALCHEMY_RECIPES = [
  { id: 'brew_hunter', name: 'Avcı İksiri', output: 'elixir_hunter', mats: { bloodroot: 4, meadow_fang: 2 }, gold: 40 },
  { id: 'brew_fury', name: 'Öfke İksiri', output: 'elixir_fury', mats: { bloodroot: 3, venom_sac: 2 }, gold: 120 },
  { id: 'brew_stone', name: 'Taş Deri İksiri', output: 'elixir_stone', mats: { moonpetal: 3, chitin_shard: 3 }, gold: 120 },
];
export const ALCHEMY_BY_ID = Object.fromEntries(ALCHEMY_RECIPES.map((r) => [r.id, r]));
