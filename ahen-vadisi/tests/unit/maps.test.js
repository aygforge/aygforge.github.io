import { describe, it, expect } from 'vitest';
import { MAPS } from '../../src/data/maps/index.js';
import { buildMap, collectTargets, bfs, nearReachable } from '../../src/world/mapBuilder.js';
import { ENEMIES } from '../../src/data/enemies.js';

const sizes = { village: [64, 48], forest: [120, 88], mine: [104, 78], swamp: [112, 80], dungeon: [104, 80] };

describe('Haritalar', () => {
  const built = Object.fromEntries(Object.entries(MAPS).map(([k, d]) => [k, buildMap(d)]));
  it('belge ölçüleri', () => {
    for (const [k, [w, h]] of Object.entries(sizes)) { expect(built[k].w).toBe(w); expect(built[k].h).toBe(h); }
  });
  it('onarım gerektirmeden tüm hedefler girişten erişilebilir', () => {
    for (const [k, m] of Object.entries(built)) {
      expect(m.repairs, k).toBe(0);
      const def = MAPS[k];
      for (const [ename, e] of Object.entries(def.entries)) {
        const reach = bfs(m.solid, m.w, m.h, e.x, e.y);
        for (const t of collectTargets(def)) expect(nearReachable(reach, m.w, m.h, t.x, t.y), `${k}:${ename}→${t.what}`).toBe(true);
      }
    }
  });
  it('açık dünya haritalarında 4 farm kampı ve spawn hücreleri', () => {
    for (const k of ['forest', 'mine', 'swamp']) {
      const camps = MAPS[k].areas.filter((a) => a.camp);
      expect(camps.length, k).toBe(4);
      for (const c of camps) {
        expect(built[k].areaCells[c.id].length).toBeGreaterThan(40);
        for (const s of c.spawns) expect(ENEMIES[s.enemy].kind).toBe('normal');
      }
      expect(MAPS[k].areas.filter((a) => a.elite).length).toBe(1);
    }
  });
  it('harita bağlantıları çift yönlü', () => {
    for (const [k, def] of Object.entries(MAPS)) {
      for (const o of def.objects.filter((x) => x.type === 'portal' || x.type === 'dungeon_gate')) {
        expect(MAPS[o.to], `${k}→${o.to}`).toBeTruthy();
        expect(MAPS[o.to].entries[o.entry], `${k}→${o.to}.${o.entry}`).toBeTruthy();
      }
    }
    const links = (a, b) => MAPS[a].objects.some((o) => o.to === b);
    expect(links('village', 'forest') && links('forest', 'village')).toBe(true);
    expect(links('forest', 'mine') && links('mine', 'forest')).toBe(true);
    expect(links('mine', 'swamp') && links('swamp', 'mine')).toBe(true);
    expect(links('mine', 'dungeon') && links('dungeon', 'mine')).toBe(true);
  });
  it('dungeon 4 bölüm, kapılar gerçek koridorları kapatır', () => {
    const d = MAPS.dungeon, m = built.dungeon;
    expect(Object.keys(d.stages).length).toBe(4);
    for (const g of d.gates) {
      const solid = new Uint8Array(m.solid);
      for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) solid[y * m.w + x] = 1;
      const reach = bfs(solid, m.w, m.h, d.entries.entrance.x, d.entries.entrance.y);
      expect(reach[d.bossSpawn.y * m.w + d.bossSpawn.x], g.id).toBe(0);
    }
  });
});
