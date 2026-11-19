// Procedural loot: item generation, affix rolls, drop tables, reforge/polish.
import * as R from './rng.js';
import { BALANCE } from './data/balance.js';
import { RARITIES, maxRarityForLevel } from './data/rarities.js';
import { BASES, BASE_BY_ID, FAMILIES, RANDOM_BASES, UNIQUE_BASES, SET_BASES, baseAllowedForClass } from './data/items.js';
import { AFFIXES, AFFIX_BY_ID, affixLevelFactor, affixRarityFactor } from './data/affixes.js';
import { REGION_BY_ID } from './data/regions.js';

export const UNIQUE_SOURCES = {
  u_millstone: { bosses: ['broken_horn'], regions: ['broken_meadows'] },
  u_seal: { bosses: ['broken_horn', 'lord_of_roots', 'forge_warden', 'rot_heart'], regions: [] },
  u_crimson: { bosses: ['lord_of_roots', 'rot_heart'], regions: ['greenshade'] },
  u_viper: { bosses: ['rot_heart'], regions: ['greenshade'] },
  u_roots: { bosses: ['lord_of_roots', 'rot_heart'], regions: [] },
  u_storm: { bosses: ['forge_warden'], regions: ['rusted_forges'] },
  u_ember: { bosses: ['forge_warden'], regions: ['rusted_forges'], champions: ['molten_core'] },
  u_grip: { bosses: ['forge_warden'], regions: [] },
};

export function itemKind(base) {
  const f = FAMILIES[base.family];
  return f.kind;
}

function affixAllowed(a, base) {
  const kind = itemKind(base);
  if (!(a.kinds.includes(kind) || a.kinds.includes(base.slot))) return false;
  if (a.classes && base.classes && !base.anyClass) {
    if (!base.classes.some((c) => a.classes.includes(c))) return false;
  }
  return true;
}

export function affixPool(base, existing) {
  const ids = new Set(existing.map((x) => x.id));
  const groups = new Set(existing.map((x) => AFFIX_BY_ID[x.id]?.group).filter(Boolean));
  return AFFIXES.filter((a) => affixAllowed(a, base) && !ids.has(a.id) && !(a.group && groups.has(a.group)));
}

export function affixValue(affixId, q, itemLevel, rarity) {
  const a = AFFIX_BY_ID[affixId];
  const v = (a.min + q * (a.max - a.min)) * affixLevelFactor(itemLevel) * affixRarityFactor(rarity);
  return Math.round(v * 10000) / 10000;
}

export function rollAffix(rng, base, existing, itemLevel, rarity) {
  const pool = affixPool(base, existing);
  if (!pool.length) return null;
  const a = R.pick(rng, pool);
  const q = Math.round(R.next(rng) * 1000) / 1000;
  return { id: a.id, q, v: affixValue(a.id, q, itemLevel, rarity) };
}

export function generateItem(rng, baseId, itemLevel, rarity) {
  const base = BASE_BY_ID[baseId];
  if (base.fixedRarity != null) rarity = base.fixedRarity;
  const lvl = Math.max(base.reqLevel, itemLevel);
  let n = RARITIES[rarity].affixes;
  if (base.unique) n = 3;
  if (base.set) n = 2;
  const affixes = [];
  for (let i = 0; i < n; i++) {
    const a = rollAffix(rng, base, affixes, lvl, rarity);
    if (a) affixes.push(a);
  }
  return { base_id: baseId, rarity, item_level: lvl, upgrade: 0, affixes, reforge_count: 0, polish_count: 0 };
}

export function rollRarity(rng, { minRarity = 0, maxRarity = 4, lootBonus = 0 }) {
  const w = BALANCE.RARITY_WEIGHTS.map((x, i) => (i >= 2 ? x * (1 + lootBonus) : x));
  const entries = [];
  for (let i = minRarity; i <= maxRarity; i++) entries.push([i, w[i]]);
  return R.weighted(rng, entries);
}

function pickBase(rng, itemLevel, tiers, cls) {
  const useClass = cls && R.chance(rng, 0.6);
  let pool = RANDOM_BASES.filter((b) => b.reqLevel <= itemLevel && (!tiers || tiers.includes(b.tier)));
  if (useClass) {
    const cp = pool.filter((b) => !b.classes || b.classes.includes(cls));
    if (cp.length) pool = cp;
  }
  if (!pool.length) pool = RANDOM_BASES.filter((b) => b.reqLevel <= Math.max(1, itemLevel));
  return R.pick(rng, pool).id;
}

function pickUnique(rng, ctx) {
  const ok = UNIQUE_BASES.filter((b) => {
    const s = UNIQUE_SOURCES[b.unique];
    if (!s) return false;
    if (b.reqLevel > ctx.level + 2) return false;
    if (ctx.bossId && s.bosses.includes(ctx.bossId)) return true;
    if (ctx.championId && s.champions?.includes(ctx.championId)) return true;
    return ctx.region && s.regions.includes(ctx.region);
  });
  return ok.length ? R.pick(rng, ok).id : null;
}

function pickSet(rng, cls) {
  const pool = SET_BASES.filter((b) => !cls || R.chance(rng, 0.35) || b.classes.includes(cls));
  return R.pick(rng, pool.length ? pool : SET_BASES).id;
}

// ctx: { level, tier, region, bossId, championId, lootBonus, cls, setChance, minRarity, difficultyBonus }
export function rollEquipmentDrop(rng, ctx) {
  const isBoss = ctx.tier === 'boss';
  const maxR = maxRarityForLevel(ctx.level, isBoss);
  let minR = ctx.minRarity ?? (ctx.tier === 'champion' ? 2 : isBoss ? 2 : 0);
  const rarity = rollRarity(rng, { minRarity: Math.min(minR, maxR), maxRarity: maxR, lootBonus: (ctx.lootBonus || 0) + (ctx.difficultyBonus || 0) });
  const region = ctx.region ? REGION_BY_ID[ctx.region] : null;
  // set pieces
  if (ctx.setChance && ctx.level >= 18 && R.chance(rng, ctx.setChance)) {
    return generateItem(rng, pickSet(rng, ctx.cls), ctx.level, 3);
  }
  if (rarity === 4) {
    const chanceUnique = isBoss ? 0.5 : 0.25;
    if (R.chance(rng, chanceUnique)) {
      const u = pickUnique(rng, ctx);
      if (u) return generateItem(rng, u, ctx.level, 4);
    }
  }
  const baseId = pickBase(rng, ctx.level, region?.lootTiers, ctx.cls);
  return generateItem(rng, baseId, ctx.level, rarity);
}

// Rolled per kill inside the deterministic sim (loot stream)
export function rollKillLoot(rng, ctx) {
  const out = [];
  const lb = Math.min(BALANCE.CAPS.lootBonus, ctx.lootBonus || 0);
  const region = ctx.region ? REGION_BY_ID[ctx.region] : null;
  if (ctx.tier === 'normal') {
    if (R.chance(rng, BALANCE.NORMAL_DROP_CHANCE * (1 + lb))) out.push({ t: 'item', item: rollEquipmentDrop(rng, ctx) });
    if (region && R.chance(rng, BALANCE.MATERIAL_DROP_CHANCE)) out.push({ t: 'mat', id: R.pick(rng, region.materials), n: 1 });
    if (region && R.chance(rng, BALANCE.HERB_DROP_CHANCE)) out.push({ t: 'mat', id: R.pick(rng, region.herbs), n: 1 });
  } else if (ctx.tier === 'elite') {
    if (R.chance(rng, BALANCE.ELITE_DROP_CHANCE * (1 + lb))) out.push({ t: 'item', item: rollEquipmentDrop(rng, { ...ctx, minRarity: 1 }) });
    if (region) out.push({ t: 'mat', id: R.pick(rng, region.materials), n: R.int(rng, 2, 3) });
    if (R.chance(rng, 0.3)) out.push({ t: 'mat', id: 'mystic_essence', n: 1 });
  } else if (ctx.tier === 'champion') {
    out.push({ t: 'item', item: rollEquipmentDrop(rng, { ...ctx, championId: ctx.championId }) });
    if (R.chance(rng, 0.5)) out.push({ t: 'item', item: rollEquipmentDrop(rng, { ...ctx, minRarity: 1 }) });
    if (region) out.push({ t: 'mat', id: R.pick(rng, region.materials), n: R.int(rng, 3, 5) });
    out.push({ t: 'mat', id: 'mystic_essence', n: R.int(rng, 1, 2) });
  } else if (ctx.tier === 'boss') {
    const n = 2 + (ctx.difficultyBonus ? 1 : 0);
    for (let i = 0; i < n; i++) out.push({ t: 'item', item: rollEquipmentDrop(rng, ctx) });
    if (R.chance(rng, 0.15 + 0.1 * (ctx.difficultyBonus || 0))) out.push({ t: 'item', item: rollEquipmentDrop(rng, { ...ctx, minRarity: 3 }) });
    if (region) out.push({ t: 'mat', id: region.materials[0], n: R.int(rng, 4, 6) }, { t: 'mat', id: region.materials[1], n: R.int(rng, 4, 6) });
    out.push({ t: 'mat', id: 'mystic_essence', n: R.int(rng, 2, 3) });
    if (R.chance(rng, 0.35)) out.push({ t: 'mat', id: 'void_crystal', n: 1 });
  }
  return out;
}

export function reforgeAffix(rng, item, index) {
  const base = BASE_BY_ID[item.base_id];
  const others = item.affixes.filter((_, i) => i !== index);
  const pool = affixPool(base, others).filter((a) => a.id !== item.affixes[index].id);
  if (!pool.length) return null;
  const a = R.pick(rng, pool);
  const q = Math.round(R.next(rng) * 1000) / 1000;
  return { id: a.id, q, v: affixValue(a.id, q, item.item_level, item.rarity) };
}

export function polishAffix(rng, item, index) {
  const old = item.affixes[index];
  const q = Math.round(R.next(rng) * 1000) / 1000;
  return { id: old.id, q, v: affixValue(old.id, q, item.item_level, item.rarity) };
}

export function itemDisplayName(item) {
  const b = BASE_BY_ID[item.base_id];
  return (b ? b.name : item.base_id) + (item.upgrade ? ` +${item.upgrade}` : '');
}

export { BASES };
