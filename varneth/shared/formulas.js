// Central, testable formulas for combat and economy.
import { BALANCE } from './data/balance.js';
import { RARITIES } from './data/rarities.js';
import { FAMILIES } from './data/items.js';

// ---- level scaling table (built by repeated multiplication: deterministic across JS engines)
const SCALE = [0];
{
  let g = 1;
  for (let L = 1; L <= 120; L++) {
    SCALE[L] = (1 + 0.15 * (L - 1)) * g;
    g *= 1.035;
  }
}
export function scale(level) {
  const L = Math.max(1, Math.min(120, level | 0));
  return SCALE[L];
}

// ---- experience
const KILL_XP = [0];
const XP_TO_NEXT = [0];
for (let L = 1; L <= 120; L++) {
  KILL_XP[L] = Math.round(6 + 4 * Math.pow(L, 1.2));
  XP_TO_NEXT[L] = Math.round(14 * Math.pow(L, 1.45) * KILL_XP[L]);
}
export function killXp(monsterLevel) { return KILL_XP[Math.max(1, Math.min(120, monsterLevel))]; }
export function xpToNext(level) { return XP_TO_NEXT[Math.max(1, Math.min(120, level))]; }

// XP falloff for farming far-below-level monsters
export function xpLevelFactor(playerLevel, monsterLevel) {
  const d = playerLevel - monsterLevel;
  if (d <= 4) return d < -3 ? 1.15 : 1;
  return Math.max(0.1, 1 - (d - 4) * 0.12);
}

export function killGold(monsterLevel) {
  return Math.max(1, Math.round(1 + 0.3 * Math.pow(monsterLevel, 1.12)));
}

// Apply XP with the Alpha cap. Returns { level, xp, levelsGained }
export function applyXp(level, xp, gain, cap = BALANCE.ALPHA_LEVEL_CAP) {
  let L = level, X = xp + Math.max(0, Math.floor(gain)), gained = 0;
  while (L < cap && X >= xpToNext(L)) { X -= xpToNext(L); L++; gained++; }
  if (L >= cap) X = 0; // progress stops at the version cap; no banking for later
  return { level: L, xp: X, levelsGained: gained };
}

// ---- reference stats at a level
export const REF = {
  weaponDps: (L) => 10 * scale(L),
  playerHp: (L) => 120 * scale(L),
  armorPiece: (L) => 9 * scale(L),
  enemyHp: (L) => 55 * scale(L),
  enemyDps: (L) => 5.2 * scale(L),
};

// damage mitigation from armor (vs attacker level)
export function armorReduction(armor, attackerLevel) {
  const k = 60 * scale(attackerLevel);
  return Math.min(BALANCE.CAPS.damageReduction, armor / (armor + k));
}
export function resistReduction(resist) {
  return Math.min(BALANCE.CAPS.resist, resist);
}

// ---- item base stats
export function itemBaseStats(base, itemLevel, rarity, upgrade = 0) {
  const f = FAMILIES[base.family];
  const r = RARITIES[rarity];
  const up = 1 + 0.08 * upgrade;
  const m = r.statMult * base.tierMult * up;
  const out = {};
  if (f.kind === 'weapon') {
    let dps = REF.weaponDps(itemLevel) * m * (f.hands === 2 ? 1.35 : 1);
    out.dps = Math.round(dps * 10) / 10;
    out.speed = f.speed;
    out.hit = Math.round((dps / f.speed) * 10) / 10;
  } else if (base.family === 'shield') {
    out.armor = Math.round(REF.armorPiece(itemLevel) * 2.2 * m);
    out.block = 0.1;
  } else if (base.family === 'tome' || base.family === 'orb') {
    out.spellPower = Math.round(REF.weaponDps(itemLevel) * 0.3 * m * 10) / 10;
    out.resourceRegen = base.family === 'orb' ? 0.1 : 0.05;
  } else if (f.kind === 'armor') {
    const slotMult = { head: 0.9, chest: 1.5, gloves: 0.7, legs: 1.2, boots: 0.7 }[base.slot] || 1;
    out.armor = Math.round(REF.armorPiece(itemLevel) * slotMult * f.armorMult * m);
  } else if (f.kind === 'belt') {
    out.armor = Math.round(REF.armorPiece(itemLevel) * 0.6 * m);
    out.hpPct = Math.round(0.03 * r.statMult * up * 1000) / 1000;
  } else if (f.kind === 'amulet') {
    out.hpPct = Math.round(0.04 * r.statMult * up * 1000) / 1000;
  } else if (f.kind === 'ring') {
    out.critChance = Math.round(0.015 * r.statMult * up * 1000) / 1000;
  }
  return out;
}

// ---- economy
export function npcSellValue(item) {
  const r = RARITIES[item.rarity];
  return Math.max(1, Math.round(3 * scale(item.item_level) * r.valueMult * (1 + 0.15 * (item.upgrade || 0))));
}

const UPG_GOLD = [1, 1.6, 2.4, 3.4, 4.6, 6, 7.8, 10, 12.8, 16];
export function upgradeCost(item) {
  const u = item.upgrade || 0;
  if (u >= 10) return null;
  const gold = Math.round(60 * scale(item.item_level) * UPG_GOLD[u] * (1 + 0.15 * item.rarity));
  let mats;
  if (u < 3) mats = { arcane_dust: 2 + u };
  else if (u < 6) mats = { arcane_dust: 3, mystic_essence: u - 2 };
  else if (u < 9) mats = { mystic_essence: 2, void_crystal: u < 8 ? 1 : 2 };
  else mats = { void_crystal: 2, starfire_shard: 1 };
  return { gold, mats };
}

export function reforgeCost(item) {
  const n = item.reforge_count || 0;
  const g = Math.round(40 * scale(item.item_level) * Math.sqrt(RARITIES[item.rarity].valueMult) * (1 + 0.25 * n));
  const mats = item.rarity >= 3 ? { mystic_essence: 1 + Math.floor(n / 3), void_crystal: 1 } : { mystic_essence: 1 + Math.floor(n / 3) };
  return { gold: g, mats };
}

export function polishCost(item) {
  const n = item.polish_count || 0;
  const g = Math.round(15 * scale(item.item_level) * Math.sqrt(RARITIES[item.rarity].valueMult) * (1 + 0.15 * n));
  return { gold: g, mats: { arcane_dust: 2 + Math.floor(n / 4) } };
}

export function skillResetCost(level) {
  return BALANCE.SKILL_RESET_GOLD_PER_LEVEL * level;
}

export function marketFees(price) {
  return {
    listingFee: Math.max(1, Math.floor(price * BALANCE.MARKET_LISTING_FEE)),
    commission: Math.floor(price * BALANCE.MARKET_COMMISSION),
  };
}

export function enemyStats(tpl, level, mods = {}) {
  const hpMult = mods.hpMult || 1, dmgMult = mods.dmgMult || 1;
  const hp = Math.round(REF.enemyHp(level) * tpl.hp * hpMult);
  // damage per hit: dps / attackspeed
  const hit = (REF.enemyDps(level) * tpl.dmg * dmgMult) / tpl.as;
  return {
    hp, maxHp: hp,
    hit: Math.round(hit * 10) / 10,
    armor: Math.round(REF.armorPiece(level) * 3 * tpl.armor),
    level,
  };
}
