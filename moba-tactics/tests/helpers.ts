import { World, MatchSetup, PickSetup } from '../src/core/world';
import { DEFAULT_BUILDS } from '../src/data/builds';
import type { Unit } from '../src/core/unit';
import type { Position } from '../src/data/champions';
import { championThink } from '../src/ai/championAI';
import { BALANCE } from '../src/core/config';

export function pick(id: string, position: Position): PickSetup {
  return { champId: id, position, style: 'balanced', build: [...DEFAULT_BUILDS[id].attack] };
}
export function setup(a: string[], b: string[], seed = 1): MatchSetup {
  const pos: Position[] = ['top', 'jungle', 'bot'];
  return {
    seed,
    teams: [
      { picks: a.map((id, i) => pick(id, pos[i])), jungleStrategy: 'balanced', controller: 'player' },
      { picks: b.map((id, i) => pick(id, pos[i])), jungleStrategy: 'balanced', controller: 'bot' },
    ],
  };
}
/** World without AI: units stand still unless scripted. */
export function sandbox(a: string[], b: string[], opts: { ai?: boolean; seed?: number } = {}): World {
  const w = new World(setup(a, b, opts.seed ?? 1));
  if (opts.ai) w.hooks.champThink = championThink;
  return w;
}
export function place(w: World, u: Unit, x: number, y: number) {
  u.x = u.px = x; u.y = u.py = y; u.path = [];
}
export function setLevel(w: World, u: Unit, lvl: number) {
  const need = BALANCE.xpTable[lvl - 1] - u.champ!.xp;
  if (need > 0) w.giveXp(u, need + 0.01);
  u.hp = u.stats.maxHp;
}
export function run(w: World, seconds: number, each?: () => void) {
  const n = Math.round(seconds * 20);
  for (let i = 0; i < n && !w.over; i++) { w.step(); w.drainEvents(); each?.(); }
}
export function runCollect(w: World, seconds: number) {
  const all: any[] = [];
  const n = Math.round(seconds * 20);
  for (let i = 0; i < n && !w.over; i++) { w.step(); all.push(...w.drainEvents()); }
  return all;
}
export const champ = (w: World, team: 0 | 1, slot: number) => w.get(w.teams[team].champIds[slot])!;
/** Put two champions face to face in the open jungle centre, away from structures and camps */
export function duel(w: World, a: Unit, b: Unit, gap = 120) {
  place(w, a, 1600 - gap / 2, 900);
  place(w, b, 1600 + gap / 2, 900);
  a.facing = 'right'; b.facing = 'left';
  for (const u of w.units) if (u.kind === 'champion' && u !== a && u !== b) place(w, u, u.team === 0 ? 120 : 3080, 900 + (u.id % 3) * 40);
  w.step(); w.step(); w.drainEvents();
}
