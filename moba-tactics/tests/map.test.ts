import { describe, it, expect } from 'vitest';
import { BOSS_POS, CAMPS, FOUNTAIN_POS, TOWERS, CRYSTAL_POS, findPath, isWalkable, lineWalkable } from '../src/core/map';

describe('map & navigation', () => {
  it('8 towers, 2 crystals, 6 camps, 2 bosses', () => {
    expect(TOWERS.length).toBe(8);
    expect(CRYSTAL_POS.length).toBe(2);
    expect(CAMPS.length).toBe(6);
    expect(CAMPS.filter((c) => c.side === 0).map((c) => c.kind).sort()).toEqual(['golem', 'spirit', 'wolf']);
    expect(Object.keys(BOSS_POS).length).toBe(2);
  });
  it('all key locations are walkable and reachable from both fountains', () => {
    const targets = [...CAMPS.map((c) => c.pos), BOSS_POS.blood, BOSS_POS.titan, ...TOWERS.map((t) => ({ x: t.pos.x, y: t.pos.y + 60 })), ...CRYSTAL_POS];
    for (const f of FOUNTAIN_POS) for (const t of targets) {
      const p = findPath(f.x, f.y, t.x, t.y);
      const end = p[p.length - 1];
      expect(Math.hypot(end.x - t.x, end.y - t.y)).toBeLessThan(80);
      let px = f.x, py = f.y;
      for (const q of p) { expect(lineWalkable(px, py, q.x, q.y) || !isWalkable(q.x, q.y)).toBe(true); px = q.x; py = q.y; }
    }
  });
});
