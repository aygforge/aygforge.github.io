// Equipment (Alpha 0.4B) — 4 yuva × Common/Uncommon/Rare, garantili (rastgelesiz) crafting.
// Sayılar data/alpha04_progression_economy.json -> equipment'tan; metin etkileri buradaki EFFECTS ile koda bağlanır.
// Etkiler gerçek mekaniğe bağlıdır ve yeteneklerle/kalıcı upgrade'lerle ayrı ayrı (çarpım/ayrı sayaç) yığılır:
//  weapon: her N. GERÇEK normal atış +1 (kendi sayacı)   ladle: fiziksel ağız +%3 / +%6 (gerçek çarpıştırıcı)
//  apron : maks can +1 / +2                               pan  : her N. tekil öldürme -> sonraki salvoya 1 bonus yağ (proc etmez)
import { ECONOMY04 } from '../data/stages.js';

export const EQUIP = ECONOMY04.equipment;
export const RARITIES = EQUIP.raritiesAlpha04; // common, uncommon, rare
export const RARITY_LABEL = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare' };
export const SLOT_LABEL = Object.fromEntries(EQUIP.items.map((i) => [i.slot, i.name]));
export const EFFECTS = {
  weapon: { common: null, uncommon: { every: 6, bonus: 1 }, rare: { every: 4, bonus: 1 } },
  ladle: { common: 0, uncommon: 0.03, rare: 0.06 },
  apron: { common: 0, uncommon: 1, rare: 2 },
  pan: { common: null, uncommon: 7, rare: 5 },
};
export const EFFECT_TEXT = {
  weapon: { common: 'Temel', uncommon: 'Her 6. gerçek normal atış +1 hasar', rare: 'Her 4. gerçek normal atış +1 hasar' },
  ladle: { common: 'Temel', uncommon: 'Kepçe ağzı +%3 (fiziksel)', rare: 'Kepçe ağzı +%6 (fiziksel)' },
  apron: { common: 'Temel', uncommon: 'Maks can +1', rare: 'Maks can +2' },
  pan: { common: 'Temel', uncommon: 'Her 7. öldürme: sonraki salvoya +1 bonus yağ', rare: 'Her 5. öldürme: sonraki salvoya +1 bonus yağ' },
};

export const defaultEquipment = () => Object.fromEntries(EQUIP.slots.map((s) => [s, 'common']));
const r = (equip, slot) => (equip && RARITIES.includes(equip[slot]) ? equip[slot] : 'common');
export const weaponEffect = (equip) => EFFECTS.weapon[r(equip, 'weapon')];
export const ladleWidthBonus = (equip) => EFFECTS.ladle[r(equip, 'ladle')];
export const apronHpBonus = (equip) => EFFECTS.apron[r(equip, 'apron')];
export const panEvery = (equip) => EFFECTS.pan[r(equip, 'pan')];

// Craft gate: Uncommon after L15 cleared, Rare after L16 cleared (JSON unlock*AfterLevel).
export function craftInfo(save, slot) {
  const cur = r(save.equipment, slot);
  const idx = RARITIES.indexOf(cur);
  if (idx >= RARITIES.length - 1) return { slot, cur, next: null };
  const next = RARITIES[idx + 1];
  const c = EQUIP.crafting;
  const cost = next === 'uncommon' ? c.commonToUncommon : c.uncommonToRare;
  const gateLevel = next === 'uncommon' ? c.unlockUncommonAfterLevel : c.unlockRareAfterLevel;
  const unlocked = !!save.stageProgress?.levels?.[gateLevel]?.cleared;
  const affordable = save.currencyParts >= cost.parts && save.tips >= cost.tips;
  return { slot, cur, next, cost, gateLevel, unlocked, affordable };
}

// Atomic: check -> subtract parts & tips -> rarity up. Caller persists once.
export function craft(save, slot) {
  if (!EQUIP.slots.includes(slot)) return { ok: false, reason: 'slot' };
  const info = craftInfo(save, slot);
  if (!info.next) return { ok: false, reason: 'max' };
  if (!info.unlocked) return { ok: false, reason: 'locked' };
  if (!info.affordable) return { ok: false, reason: 'funds' };
  save.currencyParts -= info.cost.parts;
  save.tips -= info.cost.tips;
  save.equipment[slot] = info.next;
  return { ok: true, rarity: info.next, cost: info.cost };
}
