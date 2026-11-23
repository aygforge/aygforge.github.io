import type { World } from './world';
import type { TeamId } from './map';
import { CAMPS } from './map';
import { structureAttackable } from './combat';
import { dist } from './math';
import { inBase } from './shop';

/**
 * Team observation: the only information a commander (bot or a future remote player) may receive.
 * Enemy positions are present only for currently visible units.
 */
export interface ChampObs {
  id: number; slot: number; defId: string; position: string; alive: boolean; respawnIn: number;
  x: number; y: number; hp: number; maxHp: number; level: number; gold: number; order: string; baseOrder: string; style: string;
  items: number[]; comps: string[]; build: number[]; recalling: boolean; inBase: boolean; autoRetreat: boolean;
}
export interface EnemyObs {
  id: number; defId: string; position: string; alive: boolean; visible: boolean;
  x?: number; y?: number; hp?: number; maxHp?: number; level?: number; items?: number[];
  lastSeen?: { x: number; y: number; age: number };
}
export interface TeamObservation {
  time: number; team: TeamId; tp: number; kills: [number, number]; towersKilled: [number, number];
  buffs: { blood: number; titan: number; enemyBlood: boolean; enemyTitan: boolean };
  jungleStrategy: string;
  allies: ChampObs[];
  enemies: EnemyObs[];
  structures: { id: number; team: number; kind: string; lane: string | null; tier: string; hp: number; maxHp: number; alive: boolean; attackable: boolean; threatened: boolean; x: number; y: number }[];
  camps: { id: number; side: number; kind: string; knownAlive: boolean; respawnAt: number }[];
  bosses: { sub: string; alive: boolean; visible: boolean; hp?: number; maxHp?: number; x: number; y: number; spawnAt: number; contestedBy?: number }[];
  visibleEnemyMinions: { id: number; x: number; y: number; lane: string | null }[];
}

export function observe(w: World, team: TeamId): TeamObservation {
  const T = w.teams[team];
  const E = w.teams[(1 - team) as TeamId];
  const now = w.time;
  const allies: ChampObs[] = w.champions(team).map((u) => {
    const c = u.champ!;
    return {
      id: u.id, slot: c.slot, defId: c.defId, position: c.position, alive: u.alive, respawnIn: u.alive ? 0 : Math.max(0, c.respawnAt - now),
      x: u.x, y: u.y, hp: u.hp, maxHp: u.stats.maxHp, level: c.level, gold: Math.floor(c.gold), order: c.order, baseOrder: c.baseOrder, style: c.style,
      items: c.inventory.filter((s) => s.kind === 'item').map((s) => s.itemId!), comps: c.inventory.filter((s) => s.kind === 'comp').map((s) => s.code!),
      build: [...c.build], recalling: c.recallUntil > 0, autoRetreat: !!u.ai?.retreating,
      inBase: inBase(u),
    };
  });
  const enemies: EnemyObs[] = w.champions((1 - team) as TeamId).map((u) => {
    const vis = w.isVisibleTo(u, team);
    const ls = T.lastSeen.get(u.id);
    const o: EnemyObs = { id: u.id, defId: u.champ!.defId, position: u.champ!.position, alive: u.alive, visible: vis };
    if (vis) {
      o.x = u.x; o.y = u.y; o.hp = u.hp; o.maxHp = u.stats.maxHp; o.level = u.champ!.level;
      o.items = u.champ!.inventory.filter((s) => s.kind === 'item').map((s) => s.itemId!);
    } else if (ls) o.lastSeen = { x: ls.x, y: ls.y, age: now - ls.t };
    return o;
  });
  const structures = w.units.filter((u) => u.isStructure).map((s) => {
    const threatened = s.alive && w.units.some((e) => e.alive && e.team !== s.team && e.team !== 2 && (e.kind === 'champion' || e.kind === 'minion') && dist(e.x, e.y, s.x, s.y) < s.stats.range + 80 && w.isVisibleTo(e, team));
    return { id: s.id, team: s.team as number, kind: s.kind, lane: s.lane, tier: s.tier, hp: s.hp, maxHp: s.stats.maxHp, alive: s.alive, attackable: structureAttackable(w, s), threatened, x: s.x, y: s.y };
  });
  const camps = CAMPS.map((c) => ({ id: c.id, side: c.side, kind: c.kind, knownAlive: T.campKnown[c.id].alive, respawnAt: T.campKnown[c.id].respawnAt }));
  const bosses = w.bosses.map((b) => {
    const u = b.unitId ? w.get(b.unitId) : undefined;
    const vis = !!u && w.isVisibleTo(u, team);
    const p = b.sub === 'blood' ? { x: 1600, y: 640 } : { x: 1600, y: 1160 };
    let contestedBy: number | undefined;
    if (u && vis && u.targetId) { const t = w.get(u.targetId); if (t) contestedBy = t.team as number; }
    return { sub: b.sub, alive: !!u && u.alive, visible: vis, hp: vis ? u!.hp : undefined, maxHp: vis ? u!.stats.maxHp : undefined, x: p.x, y: p.y, spawnAt: b.spawnAt, contestedBy };
  });
  const visibleEnemyMinions = w.units.filter((u) => u.alive && u.kind === 'minion' && u.team !== team && w.isVisibleTo(u, team)).map((u) => ({ id: u.id, x: u.x, y: u.y, lane: u.lane }));
  return {
    time: now, team, tp: T.tp, kills: [T.kills, E.kills], towersKilled: [T.towersKilled, E.towersKilled],
    buffs: { blood: Math.max(0, T.buffs.blood - now), titan: Math.max(0, T.buffs.titan - now), enemyBlood: E.buffs.blood > now, enemyTitan: E.buffs.titan > now },
    jungleStrategy: T.jungleStrategy, allies, enemies, structures, camps, bosses, visibleEnemyMinions,
  };
}
