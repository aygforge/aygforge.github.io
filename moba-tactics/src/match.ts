import { World, MatchSetup } from './core/world';
import { championThink } from './ai/championAI';
import { BotCommander, Difficulty, Personality } from './ai/botCommander';
import type { TeamId } from './core/map';

export interface BotConfig { team: TeamId; difficulty: Difficulty; personality: Personality }

/** Wires the deterministic core with the AI layers. */
export class Match {
  world: World;
  commanders: BotCommander[] = [];
  constructor(public setup: MatchSetup, bots: BotConfig[]) {
    this.world = new World(setup);
    this.world.hooks.champThink = championThink;
    for (const b of bots) this.commanders.push(new BotCommander(b.team, b.difficulty, b.personality, setup.seed + b.team * 7919));
    this.world.hooks.preTick = (w) => { for (const c of this.commanders) c.update(w); };
  }
  step() {
    this.world.step();
  }
}

export interface HeadlessResult { winner: number; time: number; ticks: number; kills: [number, number]; towers: [number, number]; hash: number; levels: number[]; gold: number[] }

export function runHeadless(setup: MatchSetup, bots: BotConfig[], maxSeconds = 1800, onTick?: (m: Match) => void): HeadlessResult {
  const m = new Match(setup, bots);
  const w = m.world;
  const maxTicks = maxSeconds * 20;
  while (!w.over && w.tick < maxTicks) {
    m.step();
    onTick?.(m);
    w.drainEvents();
  }
  return {
    winner: w.winner, time: w.time, ticks: w.tick,
    kills: [w.teams[0].kills, w.teams[1].kills], towers: [w.teams[0].towersKilled, w.teams[1].towersKilled],
    hash: w.stateHash(), levels: w.champions().map((c) => c.champ!.level), gold: w.champions().map((c) => Math.round(c.champ!.totalGold)),
  };
}
