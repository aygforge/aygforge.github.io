export const RARITIES = [
  { id: 0, key: 'common',    name: 'Sıradan',   nameEn: 'Common',    color: '#9a9a9a', affixes: 0, statMult: 1.0,  valueMult: 1,  minLevel: 1 },
  { id: 1, key: 'uncommon',  name: 'Gelişmiş',  nameEn: 'Uncommon',  color: '#4fd06a', affixes: 1, statMult: 1.1,  valueMult: 2,  minLevel: 1 },
  { id: 2, key: 'rare',      name: 'Nadir',     nameEn: 'Rare',      color: '#4f8dff', affixes: 2, statMult: 1.22, valueMult: 4,  minLevel: 1 },
  { id: 3, key: 'epic',      name: 'Epik',      nameEn: 'Epic',      color: '#b25cff', affixes: 3, statMult: 1.36, valueMult: 8,  minLevel: 4 },
  { id: 4, key: 'legendary', name: 'Efsanevi',  nameEn: 'Legendary', color: '#ffad33', affixes: 4, statMult: 1.52, valueMult: 16, minLevel: 8 },
  { id: 5, key: 'mythic',    name: 'Mitik',     nameEn: 'Mythic',    color: '#ff3b3b', affixes: 5, statMult: 1.7,  valueMult: 32, minLevel: 40 },
  { id: 6, key: 'ancient',   name: 'Kadim',     nameEn: 'Ancient',   color: '#f3e3a8', affixes: 5, statMult: 1.9,  valueMult: 64, minLevel: 60 },
];

// Natural drop rarity cap by monster level — Mythic/Ancient are defined but cannot
// drop in Alpha level ranges (spec section 11).
export function maxRarityForLevel(level, isBoss = false) {
  if (level >= 60 && isBoss) return 6;
  if (level >= 40) return 5;
  if (level >= 8 || isBoss) return 4;
  if (level >= 4) return 3;
  return 2;
}
