// Random affix pool. Values are fractions (0.05 = %5). `group` prevents conflicting combos
// on the same item; `kinds` restricts which item kinds may roll it; `classes` hides
// affixes that would be useless for the item's class.
const W = ['weapon'];
const ARM = ['armor', 'offhand', 'belt'];
const JEW = ['amulet', 'ring'];
const UTIL = ['amulet', 'ring', 'belt', 'head', 'gloves'];

export const AFFIXES = [
  { id: 'phys_dmg',      name: 'Fiziksel Hasar',     stat: 'physDmg',       min: 0.04, max: 0.12, kinds: [...W, ...JEW, 'gloves'], classes: ['warrior', 'ranger'], group: 'dmgtype' },
  { id: 'spell_dmg',     name: 'Büyü Hasarı',        stat: 'spellDmg',      min: 0.04, max: 0.12, kinds: [...W, 'offhand', ...JEW, 'gloves'], classes: ['mage'], group: 'dmgtype' },
  { id: 'crit_chance',   name: 'Kritik Şansı',       stat: 'critChance',    min: 0.015, max: 0.04, kinds: [...W, ...JEW, 'gloves', 'head'] },
  { id: 'crit_dmg',      name: 'Kritik Hasarı',      stat: 'critDamage',    min: 0.08, max: 0.2, kinds: [...W, ...JEW, 'gloves'] },
  { id: 'attack_speed',  name: 'Saldırı Hızı',       stat: 'attackSpeed',   min: 0.03, max: 0.08, kinds: [...W, 'gloves', 'ring'] },
  { id: 'max_hp',        name: 'Maksimum Can',       stat: 'hpPct',         min: 0.03, max: 0.09, kinds: [...ARM, 'armor', 'amulet', 'head', 'chest', 'legs'] },
  { id: 'armor',         name: 'Zırh',               stat: 'armorPct',      min: 0.05, max: 0.15, kinds: [...ARM] },
  { id: 'elem_res',      name: 'Element Direnci',    stat: 'resist',        min: 0.03, max: 0.08, kinds: [...ARM, ...JEW] },
  { id: 'evasion',       name: 'Kaçınma',            stat: 'evasion',       min: 0.015, max: 0.045, kinds: ['armor', 'ring', 'belt'] },
  { id: 'lifesteal',     name: 'Can Çalma',          stat: 'lifesteal',     min: 0.005, max: 0.015, kinds: [...W, 'amulet', 'ring'] },
  { id: 'resource_regen',name: 'Kaynak Yenilenmesi', stat: 'resourceRegen', min: 0.08, max: 0.2, kinds: [...W, 'offhand', ...JEW, 'head'] },
  { id: 'elem_dmg',      name: 'Element Hasarı',     stat: 'elemDmg',       min: 0.04, max: 0.1, kinds: [...W, 'offhand', ...JEW], classes: ['mage', 'ranger'] },
  { id: 'boss_dmg',      name: 'Boss Hasarı',        stat: 'bossDmg',       min: 0.04, max: 0.12, kinds: [...W, ...JEW] },
  { id: 'elite_dmg',     name: 'Elit Hasarı',        stat: 'eliteDmg',      min: 0.04, max: 0.12, kinds: [...W, ...JEW, 'gloves'] },
  { id: 'xp_bonus',      name: 'XP Bonusu',          stat: 'xpBonus',       min: 0.02, max: 0.06, kinds: UTIL },
  { id: 'gold_bonus',    name: 'Altın Bonusu',       stat: 'goldBonus',     min: 0.03, max: 0.08, kinds: UTIL },
  { id: 'loot_chance',   name: 'Ganimet Şansı',      stat: 'lootBonus',     min: 0.02, max: 0.06, kinds: UTIL },
];
export const AFFIX_BY_ID = Object.fromEntries(AFFIXES.map((a) => [a.id, a]));

// Affix magnitude scales gently with item level (Lv30 => 1.0, Lv100 => ~1.93)
export function affixLevelFactor(itemLevel) {
  return 0.6 + 0.4 * (itemLevel / 30);
}
// Higher rarities roll in a higher band
export function affixRarityFactor(rarity) {
  return [1, 1, 1.05, 1.1, 1.18, 1.26, 1.35][rarity] || 1;
}
