import type { Unit } from '../unit';
import type { World } from '../world';
import type { DmgType, UnitStats } from '../types';

export interface CastPlan { tgt?: Unit; x?: number; y?: number }
export interface SkillCtx { w: World; u: Unit; L: number; rank: number }
export interface SkillDef {
  cd: (L: number, rank: number) => number;
  castTime: number;
  range: number;
  /** needsTarget: plan must contain a target unit */
  needsTarget?: boolean;
  exec(c: SkillCtx, plan: CastPlan): void;
}
export interface DmgOpts {
  attack?: boolean;
  ability?: string; // 's1','s2','ult','passive','item'
  aoe?: boolean;
  dot?: boolean;
  noProc?: boolean;
  percent?: boolean; // percent-of-hp based (capped vs bosses)
  srcX?: number; srcY?: number;
  srcSummon?: boolean;
}
export interface Kit {
  s1: SkillDef; s2: SkillDef; ult: SkillDef;
  onSpawn?(w: World, u: Unit): void;
  onRespawn?(w: World, u: Unit): void;
  onTick?(w: World, u: Unit): void;
  /** bonus damage added to a basic attack (before mitigation) */
  attackBonus?(w: World, u: Unit, tgt: Unit, base: number): number;
  onAttackHit?(w: World, u: Unit, tgt: Unit): void;
  outgoingMul?(w: World, u: Unit, tgt: Unit, o: DmgOpts, type: DmgType): number;
  /** u is the damaged unit; may return 0 to fully block */
  incomingMul?(w: World, u: Unit, src: Unit, o: DmgOpts, type: DmgType): number;
  onDamaged?(w: World, u: Unit, src: Unit, amount: number, o: DmgOpts): void;
  onDealDamage?(w: World, u: Unit, tgt: Unit, amount: number, o: DmgOpts): void;
  onAbilityHit?(w: World, u: Unit, tgt: Unit, key: string): void;
  onNearbyDeath?(w: World, u: Unit, dead: Unit): void;
  statMods?(w: World, u: Unit, s: UnitStats): void;
  armorIgnore?(w: World, u: Unit, tgt: Unit): number;
}
