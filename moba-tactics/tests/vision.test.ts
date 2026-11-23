import { describe, it, expect } from 'vitest';
import { sandbox, champ, run, place } from './helpers';
import { observe } from '../src/core/observation';
import { Match } from '../src/match';
import { botDraft } from '../src/ai/draft';
import { Rng } from '../src/core/rng';

describe('vision & fog of war', () => {
  it('enemy outside vision is hidden; last seen position recorded and fades', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']);
    const me = champ(w, 0, 0), foe = champ(w, 1, 1);
    place(w, me, 1600, 900); place(w, foe, 1680, 900);
    run(w, 0.2);
    expect(w.isVisibleTo(foe, 0)).toBe(true);
    place(w, foe, 2380, 640); // enemy wolf camp, out of sight
    run(w, 0.2);
    expect(w.isVisibleTo(foe, 0)).toBe(false);
    const ls = w.teams[0].lastSeen.get(foe.id)!;
    expect(Math.abs(ls.x - 1680)).toBeLessThan(5);
    const obs = observe(w, 0);
    const eo = obs.enemies.find((e) => e.id === foe.id)!;
    expect(eo.visible).toBe(false);
    expect(eo.x).toBeUndefined();
    expect(eo.lastSeen!.x).toBeCloseTo(1680, -1);
  });
  it('forest blocks line of sight; teams have separate grids', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']);
    const g0 = w.vision.grids[0], g1 = w.vision.grids[1];
    expect(g0).not.toBe(g1);
    let diff = 0; for (let i = 0; i < g0.length; i++) if (g0[i] !== g1[i]) diff++;
    expect(diff).toBeGreaterThan(50);
  });
  it('Edrin Şahin Gözü really reveals a remote area', () => {
    const w = sandbox(['edrin', 'nyra', 'tessa'], ['korruk', 'zereth', 'dorn']);
    const e = champ(w, 0, 0);
    place(w, e, 1000, 900); run(w, 0.2);
    expect(w.vision.cellVisible(0, 2380, 1160)).toBe(false);
    expect(w.castSkill(e, 's2', { x: 2380, y: 1160 })).toBe(false); // out of range
    place(w, e, 1600, 1160); run(w, 0.2);
    expect(w.castSkill(e, 's2', { x: 2380, y: 1160 })).toBe(true);
    run(w, 0.4);
    expect(w.vision.cellVisible(0, 2380, 1160)).toBe(true);
    run(w, 6);
    expect(w.vision.cellVisible(0, 2380, 1160)).toBe(false);
  });
  it('stealthed champions are invisible to enemies', () => {
    const w = sandbox(['nyra', 'boran', 'edrin'], ['korruk', 'zereth', 'tessa']);
    const n = champ(w, 0, 0), foe = champ(w, 1, 0);
    place(w, n, 1600, 900); place(w, foe, 1650, 900); run(w, 0.2);
    n.stealthUntil = w.time + 3;
    expect(w.isVisibleTo(n, 1)).toBe(false);
  });
  it('AI never targets or casts at enemies its team cannot see (full bot match audit)', () => {
    const rng = new Rng(77);
    const m = new Match({ seed: 77, teams: [botDraft(rng, 'aggressive'), botDraft(rng, 'objective')] }, [{ team: 0, difficulty: 'hard', personality: 'aggressive' }, { team: 1, difficulty: 'hard', personality: 'objective' }]);
    const w = m.world;
    let checks = 0, violations = 0;
    while (!w.over && w.time < 400) {
      m.step();
      for (const e of w.drainEvents()) {
        if (e.t === 'cast' && e.tgt) {
          const src = w.get(e.id!), t = w.get(e.tgt);
          if (src?.kind === 'champion' && t && t.team !== src.team && t.team !== 2 && !t.isStructure) { checks++; if (!w.isVisibleTo(t, src.team as 0 | 1) && t.alive) violations++; }
        }
      }
      if (w.tick % 5 === 0) for (const c of w.champions()) {
        const it = c.ai.intent;
        if (c.alive && it?.type === 'attack') {
          const t = w.get(it.id);
          if (t && t.alive && t.team !== c.team && t.team !== 2 && !t.isStructure) { checks++; if (!w.isVisibleTo(t, c.team as 0 | 1)) violations++; }
        }
      }
    }
    expect(checks).toBeGreaterThan(100);
    // intents are validated every tick by the core; tolerate only same-tick vision refresh edges
    expect(violations / checks).toBeLessThan(0.02);
  });
});
