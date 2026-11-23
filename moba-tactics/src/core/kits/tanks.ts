import type { Kit } from './types';
import { R, abil, aoe, vfx, pointToward, dirTo, pullTo } from './helpers';
import { addShield, knockup, slow, stun } from '../combat';
import { dist } from '../math';
import { addShred } from '../combat';

const FACE: Record<string, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

const boran: Kit = {
  incomingMul(w, u, src) {
    const [fx, fy] = FACE[u.facing];
    const d = dist(u.x, u.y, src.x, src.y) || 1;
    const dot = (fx * (src.x - u.x) + fy * (src.y - u.y)) / d;
    let m = 1;
    if (dot > 0.3) m *= 1 - (0.12 + 0.01 * Math.floor((u.champ!.level - 1) / 2));
    // Boran + Edrin synergy: reduced damage near Edrin
    if (u.data.edrinNear) m *= 0.97;
    return m;
  },
  onTick(w, u) {
    if (w.tick % 10 !== 0) return;
    const t = w.teams[u.team as 0 | 1];
    const ed = t.champIds.map((id) => w.get(id)!).find((x) => x.champ!.defId === 'edrin');
    u.data.edrinNear = ed && ed.alive && dist(ed.x, ed.y, u.x, u.y) < 600 ? 1 : 0;
  },
  s1: {
    cd: () => 10, castTime: 0.15, range: 0,
    exec({ w, u, L }) {
      addShield(w, u, 80 + 12 * L + u.stats.maxHp * 0.08, 3, 'boran_s1');
      vfx(w, 'shieldWall', u.x, u.y, { id: u.id, dur: 3 });
    },
  },
  s2: {
    cd: () => 12, castTime: 0.1, range: 400, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      const end = pointToward(u, t.x, t.y, Math.max(0, dist(u.x, u.y, t.x, t.y) - (u.radius + t.radius)));
      w.dashUnit(u, end.x, end.y, 900, () => {
        if (!t.alive || dist(u.x, u.y, t.x, t.y) > 140) return;
        abil(w, u, t, 50 + 15 * L + 0.6 * u.stats.ad, 'phys', 's2');
        stun(w, t, 0.9);
        vfx(w, 'impact', t.x, t.y, { r: 60 });
      });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 60, 50), castTime: 0.35, range: 0,
    exec({ w, u, rank }) {
      const red = R(rank, 0.25, 0.35);
      addShield(w, u, R(rank, 150, 250), 5, 'boran_ult');
      w.spawnZone({
        kind: 'fortress', team: u.team, ownerId: u.id, x: u.x, y: u.y, r: 300, until: w.time + 5, every: 0.2, followId: u.id,
        onTick(w2, z) {
          for (const a of w2.alliesInRadius(z.team, z.x, z.y, z.r)) {
            if (a.isStructure) continue;
            const ex = a.dmgRed.find((d) => d.key === 'fortress');
            if (ex) ex.until = w2.time + 0.3;
            else a.dmgRed.push({ amt: red, until: w2.time + 0.3, key: 'fortress' });
          }
        },
      });
    },
  },
};

const korruk: Kit = {
  onDamaged(w, u, src) {
    if (!(src.kind === 'champion' || src.kind === 'boss' || src.kind === 'summon' || src.isStructure)) return;
    const c = u.champ!;
    if ((c.passive.stackCd ?? 0) > w.time) return;
    c.passive.stackCd = w.time + 0.5;
    c.passive.stacks = Math.min(6, (c.passive.stacks ?? 0) + 1);
    c.passive.stackUntil = w.time + 4;
  },
  statMods(w, u, s) {
    const c = u.champ!;
    if ((c.passive.stackUntil ?? 0) < w.time) c.passive.stacks = 0;
    const st = c.passive.stacks ?? 0;
    s.armor += st * 4;
    s.mr += st * 4;
  },
  s1: {
    cd: () => 8, castTime: 0.3, range: 0,
    exec({ w, u, L }) {
      vfx(w, 'quake', u.x, u.y, { r: 220 });
      aoe(w, u, u.x, u.y, 220, (t) => {
        abil(w, u, t, 60 + 18 * L + 0.4 * u.stats.ad, 'magic', 's1', true);
        slow(w, t, 0.3, 1.5);
      });
    },
  },
  s2: {
    cd: () => 14, castTime: 0.1, range: 0,
    exec({ w, u }) {
      u.dmgRed.push({ amt: 0.4, until: w.time + 2.5, key: 'rockskin' });
      vfx(w, 'rockskin', u.x, u.y, { id: u.id, dur: 2.5 });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 65, 55), castTime: 0.45, range: 0,
    exec({ w, u, rank }) {
      vfx(w, 'tectonic', u.x, u.y, { r: 320 });
      aoe(w, u, u.x, u.y, 320, (t) => {
        abil(w, u, t, R(rank, 140, 240) + 0.6 * u.stats.ad, 'magic', 'ult', true);
        knockup(w, t, R(rank, 0.75, 1.0));
      });
    },
  },
};

const tharok: Kit = {
  outgoingMul(w, u, t) {
    return t.isControlled(w.time) ? 1.15 : 1;
  },
  s1: {
    cd: () => 11, castTime: 0.25, range: 520,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      const { dx, dy } = dirTo(u, tx, ty);
      w.spawnProjectile({
        kind: 'hook', team: u.team, ownerId: u.id, x: u.x, y: u.y - 10, speed: 950, dirX: dx, dirY: dy, maxDist: 540, width: 22, pierce: false,
        onHit(w2, t) {
          abil(w2, u, t, 60 + 18 * L + 0.5 * u.stats.ad, 'phys', 's1');
          if (t.alive && !t.isStructure) {
            const end = pointToward(t, u.x, u.y, Math.max(0, dist(t.x, t.y, u.x, u.y) - (u.radius + t.radius + 6)));
            pullTo(w2, t, end.x, end.y, 1000);
            stun(w2, t, 0.5);
            vfx(w2, 'chainPull', u.x, u.y, { x2: t.x, y2: t.y, tgt: t.id, id: u.id });
          }
        },
      });
    },
  },
  s2: {
    cd: () => 9, castTime: 0.2, range: 380, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      abil(w, u, t, 40 + 12 * L + 0.2 * u.stats.ad, 'magic', 's2');
      slow(w, t, 0.4, 2);
      vfx(w, 'curseBind', t.x, t.y, { id: t.id, tgt: u.id, dur: 2 });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 70, 55), castTime: 0.35, range: 0,
    exec({ w, u, rank }) {
      vfx(w, 'ironCircle', u.x, u.y, { r: 380 });
      aoe(w, u, u.x, u.y, 380, (t) => {
        const end = pointToward(t, u.x, u.y, Math.max(0, dist(t.x, t.y, u.x, u.y) - 50));
        pullTo(w, t, end.x, end.y, 1100);
        abil(w, u, t, R(rank, 100, 170) + 0.5 * u.stats.ad, 'phys', 'ult', true);
        stun(w, t, R(rank, 0.6, 0.9));
      });
    },
  },
};
void addShred;

export const TANK_KITS: Record<string, Kit> = { boran, korruk, tharok };
