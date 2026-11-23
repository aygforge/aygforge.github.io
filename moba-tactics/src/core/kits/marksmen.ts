import type { Kit } from './types';
import { R, abil, aoe, vfx, dirTo } from './helpers';
import { dealDamage } from '../combat';
import { dist } from '../math';
import { isWalkable } from '../map';

const edrin: Kit = {
  statMods(w, u, s) {
    if (w.time - u.champ!.stillSince >= 1.0) s.range *= 1.15;
  },
  attackBonus(w, u, t, base) {
    return w.time - u.champ!.stillSince >= 1.0 ? base * 0.1 : 0;
  },
  s1: {
    cd: () => 8, castTime: 0.3, range: 700,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      const { dx, dy } = dirTo(u, tx, ty);
      w.spawnProjectile({
        kind: 'pierceArrow', team: u.team, ownerId: u.id, x: u.x, y: u.y - 14, speed: 1300, dirX: dx, dirY: dy, maxDist: 720, width: 24, pierce: true,
        onHit(w2, t) { abil(w2, u, t, 60 + 20 * L + 0.8 * u.stats.ad, 'phys', 's1'); },
      });
    },
  },
  s2: {
    cd: () => 18, castTime: 0.2, range: 1100,
    exec({ w, u }, p) {
      const tx = p.x ?? p.tgt!.x, ty = p.y ?? p.tgt!.y;
      vfx(w, 'hawk', u.x, u.y, { x2: tx, y2: ty });
      w.spawnZone({ kind: 'hawkEye', team: u.team, ownerId: u.id, x: tx, y: ty, r: 400, until: w.time + 5, every: 1, vision: true });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 60, 50), castTime: 0.6, range: 1600,
    exec({ w, u, rank }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      const { dx, dy } = dirTo(u, tx, ty);
      w.spawnProjectile({
        kind: 'dawnArrow', team: u.team, ownerId: u.id, x: u.x, y: u.y - 14, speed: 1700, dirX: dx, dirY: dy, maxDist: 1650, width: 34, pierce: true, stopAtChampion: true,
        onHit(w2, t) {
          const dmg = R(rank, 160, 260) + 1.2 * u.stats.ad;
          abil(w2, u, t, t.kind === 'champion' ? dmg : dmg * 0.5, 'phys', 'ult');
          vfx(w2, 'dawnHit', t.x, t.y, { r: 80 });
        },
      });
    },
  },
};

const tessa: Kit = {
  onAttackHit(w, u) {
    const c = u.champ!;
    if (w.time - (c.passive.lastAtk ?? -9) < 2) c.passive.rapid = Math.min(6, (c.passive.rapid ?? 0) + 1);
    else c.passive.rapid = 1;
    c.passive.lastAtk = w.time;
  },
  statMods(w, u, s) {
    const c = u.champ!;
    if (w.time - (c.passive.lastAtk ?? -9) < 2.5) s.as *= 1 + 0.06 * (c.passive.rapid ?? 0);
  },
  attackBonus(w, u, t, base) {
    const c = u.champ!;
    if ((c.passive.rollBuff ?? 0) > w.time) { c.passive.rollBuff = 0; return base * 0.3; }
    return 0;
  },
  onTick(w, u) {
    u.data.kite = (u.champ!.passive.ultUntil ?? 0) > w.time ? 1 : 0;
  },
  s1: {
    cd: () => 6, castTime: 0.15, range: 420, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      for (let i = 0; i < 2; i++) {
        w.schedule(i * 0.15, () => {
          if (!t.alive || !u.alive) return;
          w.spawnProjectile({
            kind: 'bolt2', team: u.team, ownerId: u.id, x: u.x + (i ? 6 : -6), y: u.y - 12, speed: 1200, homing: t.id, width: 0, pierce: false,
            onHit(w2, tt) { abil(w2, u, tt, 35 + 11 * L + 0.5 * u.stats.ad, 'phys', 's1'); },
          });
        });
      }
    },
  },
  s2: {
    cd: () => 10, castTime: 0, range: 600,
    exec({ w, u }, p) {
      const tx = p.x ?? u.x, ty = p.y ?? u.y;
      const { dx, dy } = dirTo(u, tx, ty);
      let ex = u.x + dx * 220, ey = u.y + dy * 220;
      if (!isWalkable(ex, ey)) { ex = u.x + dx * 110; ey = u.y + dy * 110; }
      w.dashUnit(u, ex, ey, 900);
      u.champ!.passive.rollBuff = w.time + 3;
      vfx(w, 'roll', u.x, u.y);
    },
  },
  ult: {
    cd: () => 60, castTime: 0.2, range: 0,
    exec({ w, u, rank }) {
      u.asBuffs.push({ amt: R(rank, 0.8, 1.2), until: w.time + 5, key: 'arrowStorm' });
      u.champ!.passive.ultUntil = w.time + 5;
      vfx(w, 'arrowStorm', u.x, u.y, { id: u.id, dur: 5 });
    },
  },
};

const dorn: Kit = {
  onAttackHit(w, u, t) {
    const c = u.champ!;
    if (c.attackCount % 3 === 0) {
      vfx(w, 'smallBoom', t.x, t.y, { r: 110 });
      for (const e of w.enemiesInRadius(u.team, t.x, t.y, 110)) if (e !== t) dealDamage(w, u, e, u.stats.ad * 0.6, 'phys', { ability: 'passive', aoe: true });
    }
  },
  s1: {
    cd: () => 8, castTime: 0.3, range: 480,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      w.spawnProjectile({
        kind: 'bomb', team: u.team, ownerId: u.id, x: u.x, y: u.y - 16, speed: 650, toX: tx, toY: ty, width: 0, pierce: false,
        onArrive(w2, pr) {
          vfx(w2, 'bombFuse', pr.x, pr.y, { r: 150, dur: 1.0 });
          w2.schedule(1.0, () => {
            vfx(w2, 'explosion', pr.x, pr.y, { r: 150 });
            aoe(w2, u, pr.x, pr.y, 150, (t) => abil(w2, u, t, 80 + 24 * L + 0.7 * u.stats.ad, 'phys', 's1', true), true);
          });
        },
      });
    },
  },
  s2: {
    cd: () => 10, castTime: 0.2, range: 450, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      w.spawnZone({
        kind: 'fuse', team: u.team, ownerId: u.id, x: t.x, y: t.y, r: 130, until: w.time + 2, every: 5, followId: t.id, delayFirst: true,
        onEnd(w2, z) {
          vfx(w2, 'explosion', z.x, z.y, { r: 130 });
          const dmg = 70 + 22 * L + 0.6 * u.stats.ad;
          aoe(w2, u, z.x, z.y, 130, (e) => abil(w2, u, e, e.isStructure ? dmg * 1.5 : dmg, 'phys', 's2', true), true);
        },
      });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 65, 55), castTime: 0.4, range: 560,
    exec({ w, u, rank }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      w.spawnProjectile({
        kind: 'barrel', team: u.team, ownerId: u.id, x: u.x, y: u.y - 16, speed: 600, toX: tx, toY: ty, width: 0, pierce: false,
        onArrive(w2, pr) {
          vfx(w2, 'bombFuse', pr.x, pr.y, { r: 280, dur: 1.2 });
          w2.schedule(1.2, () => {
            vfx(w2, 'bigExplosion', pr.x, pr.y, { r: 280 });
            aoe(w2, u, pr.x, pr.y, 280, (t) => {
              abil(w2, u, t, R(rank, 180, 300) + 1.0 * u.stats.ad, 'phys', 'ult', true);
              if (t.alive && !t.isStructure && t.kind !== 'boss') {
                const d = dist(t.x, t.y, pr.x, pr.y) || 1;
                const nx = t.x + ((t.x - pr.x) / d) * 100, ny = t.y + ((t.y - pr.y) / d) * 100;
                if (isWalkable(nx, ny)) w2.dashUnit(t, nx, ny, 700);
              }
            }, true);
          });
        },
      });
    },
  },
};

export const MARKSMAN_KITS: Record<string, Kit> = { edrin, tessa, dorn };
