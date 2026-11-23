import { BALANCE } from './config';
import { CHAMP_BY_ID, CLASS_STATS } from '../data/champions';
import { COMPONENTS, ITEM_BY_ID, StatBlock } from '../data/items';
import type { Unit } from './unit';
import type { World } from './world';
import type { UnitStats } from './types';
import { getKit } from './kits/registry';

export function champBaseStats(defId: string, level: number): UnitStats {
  const d = CHAMP_BY_ID[defId];
  const b = CLASS_STATS[d.cls];
  const L = level - 1;
  return {
    maxHp: b.hp + b.hpL * L,
    ad: b.ad + b.adL * L,
    ap: b.ap + b.apL * L,
    armor: b.armor + b.armorL * L,
    mr: b.mr + b.mrL * L,
    as: b.as * (1 + b.asL * L),
    range: d.range,
    ms: b.ms,
    cdr: 0, armorPen: 0, mrPen: 0, lifesteal: 0,
    regen: b.regen + 0.4 * L,
  };
}

export function inventoryStats(u: Unit): StatBlock {
  const out: Required<StatBlock> = { ad: 0, ap: 0, as: 0, cdr: 0, armor: 0, mr: 0, hp: 0, ms: 0, armorPen: 0, mrPen: 0, lifesteal: 0 };
  if (!u.champ) return out;
  for (const s of u.champ.inventory) {
    const st = s.kind === 'comp' ? COMPONENTS[s.code!].stats : ITEM_BY_ID[s.itemId!].stats;
    for (const k in st) (out as any)[k] += (st as any)[k];
  }
  return out;
}

export function hasItem(u: Unit, id: number): boolean {
  return !!u.champ && u.champ.inventory.some((s) => s.kind === 'item' && s.itemId === id);
}

/** Recompute derived stats for a champion each tick. */
export function recomputeChampion(w: World, u: Unit) {
  const c = u.champ!;
  const base = champBaseStats(c.defId, c.level);
  const inv = inventoryStats(u);
  const now = w.time;
  const s: UnitStats = { ...base };
  s.maxHp += inv.hp!;
  s.ad += inv.ad!;
  s.ap += inv.ap!;
  s.armor += inv.armor!;
  s.mr += inv.mr!;
  let asBonus = inv.as!;
  for (const b of u.asBuffs) if (b.until > now) asBonus += b.amt;
  s.as = base.as * (1 + asBonus);
  s.cdr = Math.min(BALANCE.cdrCap, inv.cdr!);
  s.armorPen = inv.armorPen!;
  s.mrPen = inv.mrPen!;
  s.lifesteal = inv.lifesteal!;
  let msBonus = inv.ms!;
  const outOfCombat = now - c.lastCombat > BALANCE.combatTimeout;
  if (hasItem(u, 13)) msBonus += outOfCombat ? 0.16 : 0.06;
  for (const b of u.msBuffs) if (b.until > now) msBonus += b.amt;
  s.ms = base.ms * (1 + msBonus);
  const kit = getKit(c.defId);
  kit.statMods?.(w, u, s);
  applySlows(u, s, now);
  s.as = Math.min(s.as, 2.6);
  // keep hp ratio when max hp changes
  if (s.maxHp !== u.stats.maxHp && u.alive) {
    const ratio = u.hp / u.stats.maxHp;
    u.hp = Math.max(1, ratio * s.maxHp);
  }
  u.stats = s;
}

export function applySlows(u: Unit, s: UnitStats, now: number) {
  let slow = 0;
  for (const sl of u.slows) if (sl.until > now) slow = Math.max(slow, sl.amt);
  s.ms *= 1 - Math.min(0.75, slow);
}

export function recomputeGeneric(w: World, u: Unit) {
  const s: UnitStats = { ...u.base };
  s.maxHp = u.base.maxHp * u.hpMul;
  let asBonus = 0;
  for (const b of u.asBuffs) if (b.until > w.time) asBonus += b.amt;
  s.as = u.base.as * (1 + asBonus);
  let msBonus = 0;
  for (const b of u.msBuffs) if (b.until > w.time) msBonus += b.amt;
  s.ms = u.base.ms * (1 + msBonus);
  applySlows(u, s, w.time);
  if (s.maxHp !== u.stats.maxHp && u.alive) {
    const ratio = u.hp / u.stats.maxHp;
    u.hp = ratio * s.maxHp;
  }
  u.stats = s;
}
