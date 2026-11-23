import type { Unit } from '../core/unit';
import type { World } from '../core/world';
import type { TeamId } from '../core/map';
import { dist } from '../core/math';
import { structureAttackable } from '../core/combat';

/**
 * Team-filtered perception. AI code must read enemy information exclusively through this class,
 * so it can never use the true location of an unseen enemy.
 */
export class Perception {
  private cacheTick = -1;
  private _enemies: Unit[] = [];
  constructor(public w: World, public team: TeamId) {}

  private refresh() {
    if (this.cacheTick === this.w.tick) return;
    this.cacheTick = this.w.tick;
    this._enemies = this.w.units.filter((u) => u.alive && u.team !== this.team && this.w.isVisibleTo(u, this.team));
  }
  /** visible hostile units incl. neutrals */
  get enemies(): Unit[] {
    this.refresh();
    return this._enemies;
  }
  enemiesNear(x: number, y: number, r: number, filter?: (u: Unit) => boolean): Unit[] {
    return this.enemies.filter((u) => u.team !== 2 && dist(u.x, u.y, x, y) <= r && (!filter || filter(u)));
  }
  neutralsNear(x: number, y: number, r: number): Unit[] {
    return this.enemies.filter((u) => u.team === 2 && dist(u.x, u.y, x, y) <= r);
  }
  enemyChampsNear(x: number, y: number, r: number): Unit[] {
    return this.enemiesNear(x, y, r, (u) => u.kind === 'champion');
  }
  alliesNear(x: number, y: number, r: number, kind?: string): Unit[] {
    return this.w.units.filter((u) => u.alive && u.team === this.team && (!kind || u.kind === kind) && dist(u.x, u.y, x, y) <= r);
  }
  allyChamps(): Unit[] {
    return this.w.champions(this.team);
  }
  /** enemy champion ids are known (draft is public) but positions only via vision/last seen */
  enemyChampIds(): number[] {
    return this.w.teams[(1 - this.team) as TeamId].champIds;
  }
  lastSeen(id: number) {
    const ls = this.w.teams[this.team].lastSeen.get(id);
    if (!ls) return null;
    const age = this.w.time - ls.t;
    return { ...ls, age };
  }
  visible(u: Unit): boolean {
    return this.w.isVisibleTo(u, this.team);
  }
  enemyTowers(): Unit[] {
    return this.w.units.filter((u) => u.alive && u.isStructure && u.team !== this.team);
  }
  ownTowers(): Unit[] {
    return this.w.units.filter((u) => u.alive && u.isStructure && u.team === this.team);
  }
  /** enemy structure whose range covers the point */
  enemyTowerCovering(x: number, y: number, pad = 0): Unit | null {
    for (const t of this.enemyTowers()) if (dist(t.x, t.y, x, y) <= t.stats.range + pad) return t;
    return null;
  }
  attackable(s: Unit) {
    return structureAttackable(this.w, s);
  }
  /** enemy champion is known dead (death is public information through kill feed) */
  enemyDead(id: number): boolean {
    const u = this.w.get(id);
    return !!u && !u.alive;
  }
}

const cache = new WeakMap<World, Perception[]>();
export function perceptionFor(w: World, team: TeamId): Perception {
  let arr = cache.get(w);
  if (!arr) { arr = [new Perception(w, 0), new Perception(w, 1)]; cache.set(w, arr); }
  return arr[team];
}
