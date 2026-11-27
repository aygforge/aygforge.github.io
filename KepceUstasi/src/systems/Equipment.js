// Equipment (Alpha 0.4B) — 4 yuva × Common/Uncommon/Rare, garantili (rastgelesiz) crafting.
// Sayılar data/alpha04_progression_economy.json -> equipment'tan; metin etkileri buradaki EFFECTS ile koda bağlanır.
// Etkiler gerçek mekaniğe bağlıdır ve yeteneklerle/kalıcı upgrade'lerle ayrı ayrı (çarpım/ayrı sayaç) yığılır:
//  weapon: her N. GERÇEK normal atış +1 (kendi sayacı)   ladle: fiziksel ağız +%3 / +%6 (gerçek çarpıştırıcı)
//  apron : maks can +1 / +2                               pan  : her N. tekil öldürme -> sonraki salvoya 1 bonus yağ (proc etmez)
import { ECONOMY04 } from '../data/stages.js';

export const EQUIP = ECONOMY04.equipment;
// V1.0: Epic (after L35) and Legendary (after L70) on top of the unchanged Common/Uncommon/Rare.
export const RARITIES = [...EQUIP.raritiesAlpha04, 'epic', 'legendary'];
export const RARITY_LABEL = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
export const RARITY_COLOR = { common: '#fff4dc', uncommon: '#8be07a', rare: '#7fb0ff', epic: '#d08bff', legendary: '#ffb35a' };
export const V1_CRAFT = {
  epic: { parts: 140, seals: 2, tips: 900, gateLevel: 35 },
  legendary: { parts: 280, seals: 6, tips: 4000, gateLevel: 70 },
};
// SG item power (UI guide only). Epic/Legendary and enhancement levels are real effects (below).
export const V1_POWER = {
  epic: { weapon: 55, ladle: 45, apron: 50, pan: 45 },
  legendary: { weapon: 130, ladle: 105, apron: 115, pan: 105 },
  perEnhance: { weapon: 14, ladle: 9, apron: 9, pan: 7 },
};
export const ENHANCE_MAX = 30;
export const SLOT_LABEL = Object.fromEntries(EQUIP.items.map((i) => [i.slot, i.name]));
export const EFFECTS = {
  weapon: { common: null, uncommon: { every: 6, bonus: 1 }, rare: { every: 4, bonus: 1 }, epic: { every: 4, bonus: 1, base: 1 }, legendary: { every: 4, bonus: 1, base: 2 } },
  ladle: { common: 0, uncommon: 0.03, rare: 0.06, epic: 0.09, legendary: 0.12 },
  apron: { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 },
  pan: { common: null, uncommon: 7, rare: 5, epic: 4, legendary: 3 },
};
export const EFFECT_TEXT = {
  weapon: { common: 'Temel', uncommon: 'Her 6. gerçek normal atış +1 hasar', rare: 'Her 4. gerçek normal atış +1 hasar' },
  ladle: { common: 'Temel', uncommon: 'Kepçe ağzı +%3 (fiziksel)', rare: 'Kepçe ağzı +%6 (fiziksel)' },
  apron: { common: 'Temel', uncommon: 'Maks can +1', rare: 'Maks can +2' },
  pan: { common: 'Temel', uncommon: 'Her 7. öldürme: sonraki salvoya +1 bonus yağ', rare: 'Her 5. öldürme: sonraki salvoya +1 bonus yağ' },
};
Object.assign(EFFECT_TEXT.weapon, { epic: 'Normal yağ taban hasarı +1 · her 4. atış +1', legendary: 'Normal yağ taban hasarı +2 · her 4. atış +1' });
Object.assign(EFFECT_TEXT.ladle, { epic: 'Kepçe ağzı +%9 (fiziksel)', legendary: 'Kepçe ağzı +%12 (fiziksel)' });
Object.assign(EFFECT_TEXT.apron, { epic: 'Maks can +3', legendary: 'Maks can +4' });
Object.assign(EFFECT_TEXT.pan, { epic: 'Her 4. öldürme: +1 bonus yağ', legendary: 'Her 3. öldürme: +1 bonus yağ' });
export const ENHANCE_TEXT = {
  weapon: (l) => `+${Math.floor(l / 5)} normal yağ hasarı (her 5 seviye)`,
  ladle: (l) => `+${Math.floor(l / 10)} kepçe kapasitesi (her 10 seviye, en çok 15)`,
  apron: (l) => `+${Math.floor(l / 10)} maks can (her 10 seviye)`,
  pan: (l) => `bonus sıklığı -${Math.floor(l / 15)} öldürme (her 15 seviye, en az 2)`,
};

export const defaultEquipment = () => Object.fromEntries(EQUIP.slots.map((s) => [s, 'common']));
const r = (equip, slot) => (equip && RARITIES.includes(equip[slot]) ? equip[slot] : 'common');
const lv = (levels, slot) => Math.max(0, Math.min(ENHANCE_MAX, levels?.[slot] || 0));
export const weaponEffect = (equip) => EFFECTS.weapon[r(equip, 'weapon')];
// real normal-oil base damage bonus: rarity (Epic +1 / Legendary +2) + 1 per 5 enhance levels
export const weaponBaseBonus = (equip, levels) => (EFFECTS.weapon[r(equip, 'weapon')]?.base || 0) + Math.floor(lv(levels, 'weapon') / 5);
export const ladleWidthBonus = (equip) => EFFECTS.ladle[r(equip, 'ladle')];
export const ladleCapacityBonus = (levels) => Math.floor(lv(levels, 'ladle') / 10);
export const apronHpBonus = (equip, levels) => EFFECTS.apron[r(equip, 'apron')] + Math.floor(lv(levels, 'apron') / 10);
// every Nth unique kill -> 1 non-proc bonus oil; enhancement only shortens an EXISTING interval (min 2)
export const panEvery = (equip, levels) => {
  const base = EFFECTS.pan[r(equip, 'pan')];
  return base ? Math.max(2, base - Math.floor(lv(levels, 'pan') / 15)) : null;
};
export const defaultEquipLevels = () => Object.fromEntries(EQUIP.slots.map((s) => [s, 0]));

// Enhancement 0–30 per slot: tips round(45*1.16^lvl) + parts ceil((lvl+1)/3)*5. Atomic.
export function enhanceCost(level) {
  return { tips: Math.round(45 * 1.16 ** level), parts: Math.ceil((level + 1) / 3) * 5 };
}
export function enhanceInfo(save, slot) {
  const level = lv(save.equipLevels, slot);
  if (level >= ENHANCE_MAX) return { slot, level, max: true };
  const cost = enhanceCost(level);
  return { slot, level, cost, affordable: save.tips >= cost.tips && save.currencyParts >= cost.parts };
}
export function enhance(save, slot) {
  if (!EQUIP.slots.includes(slot)) return { ok: false, reason: 'slot' };
  save.equipLevels ||= defaultEquipLevels();
  const info = enhanceInfo(save, slot);
  if (info.max) return { ok: false, reason: 'max' };
  if (!info.affordable) return { ok: false, reason: 'funds' };
  save.tips -= info.cost.tips;
  save.currencyParts -= info.cost.parts;
  save.equipLevels[slot] = info.level + 1;
  return { ok: true, level: info.level + 1, cost: info.cost };
}

// Craft gate: Uncommon after L15 cleared, Rare after L16 cleared (JSON unlock*AfterLevel).
export function craftInfo(save, slot) {
  const cur = r(save.equipment, slot);
  const idx = RARITIES.indexOf(cur);
  if (idx >= RARITIES.length - 1) return { slot, cur, next: null };
  const next = RARITIES[idx + 1];
  const c = EQUIP.crafting;
  const v1 = V1_CRAFT[next];
  const cost = v1 ? { parts: v1.parts, tips: v1.tips, seals: v1.seals } : next === 'uncommon' ? c.commonToUncommon : c.uncommonToRare;
  const gateLevel = v1 ? v1.gateLevel : next === 'uncommon' ? c.unlockUncommonAfterLevel : c.unlockRareAfterLevel;
  const unlocked = !!save.stageProgress?.levels?.[gateLevel]?.cleared;
  const affordable = save.currencyParts >= cost.parts && save.tips >= cost.tips && (save.bossSeals || 0) >= (cost.seals || 0);
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
  if (info.cost.seals) save.bossSeals -= info.cost.seals;
  save.equipment[slot] = info.next;
  return { ok: true, rarity: info.next, cost: info.cost };
}
