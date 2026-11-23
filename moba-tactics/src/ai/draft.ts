import { Rng } from '../core/rng';
import { CHAMPIONS, Position } from '../data/champions';
import { DEFAULT_BUILDS, BuildKind } from '../data/builds';
import type { PickSetup, TeamSetup } from '../core/world';
import type { Style, JungleStrategy } from '../core/types';
import type { Personality } from './botCommander';

const fitScore = { high: 3, mid: 2, low: 1 } as const;

/** Draft three distinct champions for a bot team with sensible positions. */
export function botDraft(rng: Rng, personality: Personality, getBuild?: (id: string, kind: BuildKind) => number[]): TeamSetup {
  const order: Position[] = rng.shuffle(['jungle', 'top', 'bot'] as Position[]);
  const picks: Record<Position, PickSetup> = {} as Record<Position, PickSetup>;
  const used = new Set<string>();
  for (const pos of order) {
    const pool = CHAMPIONS.filter((c) => !used.has(c.id) && (c.pos[pos] === 'high' || (c.pos[pos] === 'mid' && rng.chance(0.25))));
    const list = pool.length ? pool : CHAMPIONS.filter((c) => !used.has(c.id));
    const ch = rng.pick(list);
    used.add(ch.id);
    const styles: Style[] = personality === 'aggressive' ? ['aggressive', 'aggressive', 'balanced'] : personality === 'controlled' ? ['balanced', 'defensive', 'balanced'] : ['balanced', 'aggressive', 'balanced'];
    const kinds: BuildKind[] = ch.cls === 'tank' ? ['defense', 'hybrid', 'attack'] : ['attack', 'hybrid', 'attack', 'defense'];
    const kind = rng.pick(kinds);
    picks[pos] = { champId: ch.id, position: pos, style: rng.pick(styles), build: getBuild ? getBuild(ch.id, kind) : [...DEFAULT_BUILDS[ch.id][kind]] };
  }
  const js: JungleStrategy = personality === 'aggressive' ? 'aggressive' : personality === 'controlled' ? rng.pick(['farm', 'balanced'] as JungleStrategy[]) : 'balanced';
  return { picks: [picks.top, picks.jungle, picks.bot], jungleStrategy: js, controller: 'bot' };
}

export function positionFit(champId: string, pos: Position): number {
  const c = CHAMPIONS.find((x) => x.id === champId)!;
  return fitScore[c.pos[pos]];
}
