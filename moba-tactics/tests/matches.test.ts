import { describe, it, expect } from 'vitest';
import { runHeadless, Match } from '../src/match';
import { botDraft } from '../src/ai/draft';
import { Rng } from '../src/core/rng';
import type { Difficulty, Personality } from '../src/ai/botCommander';
import { World } from '../src/core/world';
import { setup } from './helpers';
import { championThink } from '../src/ai/championAI';
import { isWalkable } from '../src/core/map';

const PERS: Personality[] = ['aggressive', 'controlled', 'objective'];
const DIFF: Difficulty[] = ['easy', 'normal', 'hard'];

describe('full headless bot matches', () => {
  const durations: number[] = [];
  for (let i = 0; i < 10; i++) {
    it(`match #${i + 1} ends by crystal destruction without stalls`, () => {
      const seed = 9000 + i * 31;
      const rng = new Rng(seed);
      const p0 = PERS[i % 3], p1 = PERS[(i + 2) % 3];
      const s = { seed, teams: [botDraft(rng, p0), botDraft(rng, p1)] as [any, any] };
      const lifetimes = new Map<number, number>();
      let stuck = 0, offmap = 0;
      const r = runHeadless(s, [{ team: 0, difficulty: DIFF[i % 3], personality: p0 }, { team: 1, difficulty: DIFF[(i + 1) % 3], personality: p1 }], 1800, (m) => {
        const w = m.world;
        if (w.tick % 100 !== 0) return;
        for (const u of w.units) {
          if (!u.alive) continue;
          if (!isWalkable(u.x, u.y) && u.kind !== 'tower' && u.kind !== 'crystal') offmap++;
          if (u.kind === 'minion') {
            const born = lifetimes.get(u.id) ?? w.time;
            lifetimes.set(u.id, born);
            if (w.time - born > 240) stuck++;
          }
        }
      });
      durations.push(r.time);
      expect(r.winner === 0 || r.winner === 1).toBe(true);
      expect(r.time).toBeLessThan(1800);
      expect(stuck).toBe(0);
      expect(offmap).toBe(0);
      // every champion progressed
      expect(Math.min(...r.levels)).toBeGreaterThanOrEqual(4);
    });
  }
  it('average duration is in a sensible band (balance target 6-8 min)', () => {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length / 60;
    console.log('match durations (min):', durations.map((d) => (d / 60).toFixed(1)).join(', '), 'avg', avg.toFixed(2));
    expect(avg).toBeGreaterThan(4);
    expect(avg).toBeLessThan(14);
  });
});

describe('determinism', () => {
  it('same seed + same command sequence gives identical results', () => {
    const runOnce = () => {
      const rng = new Rng(4242);
      const s = { seed: 4242, teams: [botDraft(rng, 'aggressive'), botDraft(rng, 'objective')] as [any, any] };
      s.teams[0].controller = 'player';
      const m = new Match(s, [{ team: 1, difficulty: 'hard', personality: 'objective' }]);
      const script: [number, any][] = [[200, { type: 'order', team: 0, slot: 0, order: 'push' }], [600, { type: 'order', team: 0, slot: 1, order: 'raid_bot' }], [1500, { type: 'setBuild', team: 0, slot: 2, build: [3, 1, 2, 19] }], [2400, { type: 'order', team: 0, slot: 2, order: 'defend' }]];
      const hashes: number[] = [];
      while (!m.world.over && m.world.tick < 20 * 400) {
        for (const [t, c] of script) if (m.world.tick === t) m.world.submit(c);
        m.step(); m.world.drainEvents();
        if (m.world.tick % 400 === 0) hashes.push(m.world.stateHash());
      }
      return { hashes, final: m.world.stateHash(), log: m.world.commandLog.length };
    };
    const a = runOnce(), b = runOnce();
    expect(a.hashes).toEqual(b.hashes);
    expect(a.final).toBe(b.final);
    expect(a.log).toBe(b.log);
  });
  it('different seeds produce different matches', () => {
    const go = (seed: number) => { const w = new World(setup(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], seed)); w.hooks.champThink = championThink; for (let i = 0; i < 20 * 120; i++) { w.step(); w.drainEvents(); } return w.stateHash(); };
    expect(go(1)).not.toBe(go(2));
  });
});
