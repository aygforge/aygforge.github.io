import type { Kit } from './types';
import type { Unit } from '../unit';
import type { World } from '../world';
import { R, abil, aoe, vfx, pointToward, dirTo } from './helpers';
import { dealDamage } from '../combat';
import { dist } from '../math';
import { isWalkable, nearestWalkable } from '../map';

const nyra: Kit = {
  attackBonus(w, u, t) {
    const c = u.champ!;
    const L = c.level - 1;
    let unseen = !!u.data.fromStealth;
    if (!unseen && t.team < 2 && !w.isVisibleTo(u, t.team as 0 | 1)) unseen = true;
    if (unseen && (c.passive.shadowCd ?? 0) <= w.time) {
      c.passive.shadowCd = w.time + 5;
      vfx(w, 'shadowStrike', t.x, t.y);
      return 40 + 12 * L;
    }
    return 0;
  },
  s1: {
    cd: () => 8, castTime: 0.05, range: 450, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      const end = pointToward(u, t.x, t.y, Math.max(0, dist(u.x, u.y, t.x, t.y) - (u.radius + t.radius)));
      vfx(w, 'shadowPuff', u.x, u.y);
      w.dashUnit(u, end.x, end.y, 1300, () => {
        if (t.alive && dist(u.x, u.y, t.x, t.y) < 150) abil(w, u, t, 60 + 18 * L + 0.7 * u.stats.ad, 'phys', 's1');
      });
    },
  },
  s2: {
    cd: () => 16, castTime: 0.1, range: 0,
    exec({ w, u }) {
      u.stealthUntil = w.time + 2.5;
      u.msBuffs.push({ amt: 0.3, until: w.time + 2.5, key: 'smoke' });
      vfx(w, 'smoke', u.x, u.y, { r: 110, dur: 1.2 });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 50, 40), castTime: 0.25, range: 400, needsTarget: true,
    exec({ w, u, rank }, p) {
      const t = p.tgt!;
      const end = pointToward(u, t.x, t.y, Math.max(0, dist(u.x, u.y, t.x, t.y) - (u.radius + t.radius)));
      u.x = end.x; u.y = end.y;
      vfx(w, 'lastWhisper', t.x, t.y, { id: t.id });
      abil(w, u, t, R(rank, 120, 200) + 1.0 * u.stats.ad, 'phys', 'ult');
      if (t.alive) dealDamage(w, u, t, (t.stats.maxHp - t.hp) * 0.25, 'phys', { ability: 'ult', percent: true, noProc: true });
    },
  },
};

function addPoison(w: World, u: Unit, t: Unit, n: number) {
  if (!t.alive || t.isStructure) return;
  const L = u.champ!.level - 1;
  if ((t.marks.poisonUntil ?? 0) < w.time) t.marks.poison = 0;
  t.marks.poison = Math.min(5, (t.marks.poison ?? 0) + n);
  t.marks.poisonUntil = w.time + 4;
  t.marks.poisonSrc = u.id;
  const ex = t.dots.find((d) => d.key === 'zpoison_' + u.id);
  const ps = t.marks.poison * (4 + 1.5 * L);
  if (ex) { ex.perSec = ps; ex.until = w.time + 4; }
  else t.dots.push({ srcId: u.id, perSec: ps, type: 'magic', until: w.time + 4, key: 'zpoison_' + u.id, tickAcc: 0, abil: true });
}

const zereth: Kit = {
  onAttackHit(w, u, t) { addPoison(w, u, t, 1); },
  s1: {
    cd: () => 7, castTime: 0.2, range: 500, needsTarget: true,
    exec({ w, u, L }, p) {
      w.spawnProjectile({
        kind: 'poisonDagger', team: u.team, ownerId: u.id, x: u.x, y: u.y - 12, speed: 1100, homing: p.tgt!.id, width: 0, pierce: false,
        onHit(w2, t) { abil(w2, u, t, 55 + 17 * L + 0.6 * u.stats.ad, 'phys', 's1'); addPoison(w2, u, t, 2); },
      });
    },
  },
  s2: {
    cd: () => 13, castTime: 0.25, range: 420,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      const touched = new Set<number>();
      w.spawnZone({
        kind: 'poisonCloud', team: u.team, ownerId: u.id, x: tx, y: ty, r: 170, until: w.time + 4, every: 0.5,
        onTick(w2, z) {
          z.data.n = (z.data.n ?? 0) + 1;
          for (const t of w2.enemiesInRadius(z.team, z.x, z.y, z.r)) {
            const first = !touched.has(t.id);
            touched.add(t.id);
            dealDamage(w2, u, t, 18 + 5 * L + 0.1 * u.stats.ad, 'magic', { ability: 's2', aoe: true, noProc: !first });
            if (z.data.n % 2 === 1) addPoison(w2, u, t, 1);
          }
        },
      });
    },
  },
  ult: {
    cd: () => 45, castTime: 0.3, range: 0,
    exec({ w, u, rank }) {
      vfx(w, 'plagueHarvest', u.x, u.y, { r: 700 });
      for (const t of w.units) {
        if (!t.alive || t.team === u.team || dist(t.x, t.y, u.x, u.y) > 700) continue;
        if ((t.marks.poisonUntil ?? 0) < w.time || !(t.marks.poison > 0)) continue;
        if (t.team < 2 && !w.isVisibleTo(t, u.team as 0 | 1)) continue;
        const st = t.marks.poison;
        t.marks.poison = 0;
        t.dots = t.dots.filter((d) => d.key !== 'zpoison_' + u.id);
        vfx(w, 'poisonBurst', t.x, t.y, { r: 80 });
        abil(w, u, t, st * (R(rank, 30, 45) + 0.15 * u.stats.ad), 'magic', 'ult');
      }
    },
  },
};

function blink(w: World, u: Unit, tx: number, ty: number) {
  const p = isWalkable(tx, ty) ? { x: tx, y: ty } : nearestWalkable(tx, ty);
  vfx(w, 'riftOut', u.x, u.y);
  u.x = p.x; u.y = p.y;
  u.path = [];
  vfx(w, 'riftIn', u.x, u.y);
  u.champ!.passive.empowered = w.time + 3;
}

const vaelis: Kit = {
  attackBonus(w, u) {
    const c = u.champ!;
    if ((c.passive.empowered ?? 0) > w.time) {
      c.passive.empowered = 0;
      return 40 + 14 * (c.level - 1) + 0.4 * u.stats.ad;
    }
    return 0;
  },
  s1: {
    cd: () => 9, castTime: 0.05, range: 600,
    exec({ w, u }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      let e = pointToward(u, tx, ty, 260);
      if (p.tgt) e = pointToward(u, tx, ty, Math.min(260, Math.max(0, dist(u.x, u.y, tx, ty) - 60)));
      blink(w, u, e.x, e.y);
    },
  },
  s2: {
    cd: () => 8, castTime: 0.15, range: 160, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      const dmg = 50 + 15 * L + 0.6 * u.stats.ad;
      abil(w, u, t, dmg, 'phys', 's2');
      vfx(w, 'echoSlash', t.x, t.y);
      w.schedule(0.8, () => {
        if (t.alive && u.alive && dist(u.x, u.y, t.x, t.y) < 230) {
          vfx(w, 'echoSlash2', t.x, t.y);
          dealDamage(w, u, t, dmg * 0.7, 'phys', { ability: 's2', noProc: true });
        }
      });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 60, 50), castTime: 0.1, range: 450, needsTarget: true,
    exec({ w, u, rank }, p) {
      const hitIds: number[] = [];
      let cur: Unit | undefined = p.tgt;
      for (let i = 0; i < 3; i++) {
        w.schedule(i * 0.28, () => {
          if (!u.alive) return;
          const cands = w.enemiesInRadius(u.team, u.x, u.y, 450).filter((t) => !t.isStructure && (t.team === 2 || w.isVisibleTo(t, u.team as 0 | 1)));
          cands.sort((a, b) => {
            const sa = (a.kind === 'champion' ? -1000 : 0) + (hitIds.includes(a.id) ? 500 : 0) + dist(u.x, u.y, a.x, a.y);
            const sb = (b.kind === 'champion' ? -1000 : 0) + (hitIds.includes(b.id) ? 500 : 0) + dist(u.x, u.y, b.x, b.y);
            return sa - sb || a.id - b.id;
          });
          const t = i === 0 && cur && cur.alive ? cur : cands[0];
          cur = undefined;
          if (!t) return;
          hitIds.push(t.id);
          const { dx, dy } = dirTo(u, t.x, t.y);
          const e = { x: t.x + dx * (t.radius + 20), y: t.y + dy * (t.radius + 20) };
          vfx(w, 'riftDash', u.x, u.y, { x2: e.x, y2: e.y });
          blink(w, u, e.x, e.y);
          u.untargetableUntil = w.time + 0.3;
          abil(w, u, t, R(rank, 70, 110) + 0.6 * u.stats.ad, 'phys', 'ult');
        });
      }
    },
  },
};
void aoe;

export const ASSASSIN_KITS: Record<string, Kit> = { nyra, zereth, vaelis };
