import type { Dir } from './math';
import type { ChampState, Dot, Shield, Side, UnitKind, UnitStats } from './types';
import type { LaneId } from './map';

export class Unit {
  id: number;
  kind: UnitKind;
  team: Side;
  /** sub type key: champion def id, 'melee'/'ranged'/'siege', 'tower', 'wolf', ... */
  sub: string;
  x: number; y: number;
  px: number; py: number; // previous tick position (render interpolation)
  radius: number;
  hp: number;
  alive = true;
  stats: UnitStats;
  base: UnitStats;
  facing: Dir = 'down';
  moving = false;
  targetId = 0;
  attackReadyAt = 0;
  windupUntil = 0;
  windupTarget = 0;
  castUntil = 0;
  castSkill = '';
  deathTime = 0;
  removeAt = 0;
  spawnTime = 0;
  // status
  stunUntil = 0;
  rootUntil = 0;
  knockupUntil = 0;
  stealthUntil = 0;
  untargetableUntil = 0;
  slows: { amt: number; until: number }[] = [];
  msBuffs: { amt: number; until: number; key: string }[] = [];
  asBuffs: { amt: number; until: number; key: string }[] = [];
  dmgRed: { amt: number; until: number; key: string }[] = [];
  shields: Shield[] = [];
  dots: Dot[] = [];
  grievous: { amt: number; until: number }[] = [];
  armorShred: { amt: number; until: number; key: string }[] = [];
  mrShred: { amt: number; until: number; key: string }[] = [];
  marks: Record<string, number> = {}; // key -> until / stacks
  lastHitBy = 0;
  lastHitAt = -99;
  lastAttackedChampAt = -99; // for tower aggro
  // forced movement (dash/pull/knockback)
  dash: { tx: number; ty: number; speed: number; onEnd?: () => void } | null = null;
  // misc
  lane: LaneId | null = null;
  laneDir = 1;
  ownerId = 0; // summons
  expireAt = 0;
  leashX = 0; leashY = 0; // monsters/bosses
  campId = -1;
  tier = '';
  champ: ChampState | null = null;
  ai: any = {};
  path: { x: number; y: number }[] = [];
  pathGoalX = -1; pathGoalY = -1; pathAt = -99;
  hpMul = 1; // e.g., titan minion buff
  data: Record<string, number> = {};

  constructor(id: number, kind: UnitKind, team: Side, sub: string, x: number, y: number, radius: number, stats: UnitStats) {
    this.id = id; this.kind = kind; this.team = team; this.sub = sub;
    this.x = this.px = x; this.y = this.py = y; this.radius = radius;
    this.base = { ...stats };
    this.stats = { ...stats };
    this.hp = stats.maxHp;
  }

  isCC(now: number): boolean {
    return this.stunUntil > now || this.knockupUntil > now;
  }
  isRooted(now: number): boolean {
    return this.rootUntil > now || this.isCC(now);
  }
  isSlowed(now: number): boolean {
    return this.slows.some((s) => s.until > now);
  }
  isControlled(now: number): boolean {
    return this.isRooted(now) || this.isSlowed(now) || (this.marks.pulledUntil ?? 0) > now;
  }
  get hpPct(): number {
    return this.hp / this.stats.maxHp;
  }
  get shieldTotal(): number {
    let s = 0;
    for (const sh of this.shields) s += sh.amount;
    return s;
  }
  get isStructure(): boolean {
    return this.kind === 'tower' || this.kind === 'crystal';
  }
  get isChampion(): boolean {
    return this.kind === 'champion';
  }
}

export function emptyStats(): UnitStats {
  return { maxHp: 1, ad: 0, ap: 0, armor: 0, mr: 0, as: 1, range: 100, ms: 100, cdr: 0, armorPen: 0, mrPen: 0, lifesteal: 0, regen: 0 };
}
