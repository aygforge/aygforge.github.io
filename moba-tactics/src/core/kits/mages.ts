import type { Kit } from './types';
import { R, abil, aoe, vfx, pointToward, dirTo } from './helpers';
import { dealDamage, root, slow, stun } from '../combat';
import { dist } from '../math';
import { isWalkable } from '../map';

const asira: Kit = {
  onAbilityHit(w, u, t, key) {
    if (key !== 's1' && key !== 's2' && key !== 'ult') return;
    const mk = 'kor_' + u.id;
    t.marks[mk] = (t.marks[mk] ?? 0) + 1;
    if (t.marks[mk] >= 3) {
      t.marks[mk] = 0;
      const L = u.champ!.level - 1;
      vfx(w, 'emberBurst', t.x, t.y, { r: 150 });
      for (const e of w.enemiesInRadius(u.team, t.x, t.y, 150)) dealDamage(w, u, e, 50 + 15 * L + 0.35 * u.stats.ap, 'magic', { ability: 'passive', aoe: true });
    }
  },
  s1: {
    cd: () => 6, castTime: 0.3, range: 540,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      w.spawnProjectile({
        kind: 'fireball', team: u.team, ownerId: u.id, x: u.x, y: u.y - 16, speed: 760, toX: tx, toY: ty, width: 0, pierce: false,
        onArrive(w2, pr) {
          vfx(w2, 'fireExplosion', pr.x, pr.y, { r: 130 });
          aoe(w2, u, pr.x, pr.y, 130, (t) => abil(w2, u, t, 70 + 22 * L + 0.6 * u.stats.ap, 'magic', 's1', true));
        },
      });
    },
  },
  s2: {
    cd: () => 10, castTime: 0.3, range: 520,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      const touched = new Set<number>();
      w.spawnZone({
        kind: 'flameRoad', team: u.team, ownerId: u.id, x: tx, y: ty, r: 150, until: w.time + 3, every: 0.5,
        onTick(w2, z) {
          for (const t of w2.enemiesInRadius(z.team, z.x, z.y, z.r)) {
            const first = !touched.has(t.id);
            touched.add(t.id);
            dealDamage(w2, u, t, 16 + 5 * L + 0.12 * u.stats.ap, 'magic', { ability: 's2', aoe: true, noProc: !first });
            if (first) w2.emit({ t: 'vfx', k: 'burn', id: t.id, x: t.x, y: t.y });
          }
        },
      });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 60, 50), castTime: 0.45, range: 620,
    exec({ w, u, rank }, p) {
      const cx = p.tgt ? p.tgt.x : p.x!, cy = p.tgt ? p.tgt.y : p.y!;
      const n = R(rank, 6, 8);
      vfx(w, 'crimsonRainArea', cx, cy, { r: 260, dur: 2.1 });
      for (let i = 0; i < n; i++) {
        w.schedule(0.25 + i * 0.28, () => {
          const a = w.rng.next() * Math.PI * 2, rr = Math.sqrt(w.rng.next()) * 200;
          // bias meteors toward visible enemies in area
          let mx = cx + Math.cos(a) * rr, my = cy + Math.sin(a) * rr;
          const foes = w.enemiesInRadius(u.team, cx, cy, 260);
          if (foes.length && i % 2 === 0) { const f = foes[i % foes.length]; mx = f.x + (w.rng.next() - 0.5) * 40; my = f.y + (w.rng.next() - 0.5) * 40; }
          vfx(w, 'meteor', mx, my, { r: 110 });
          aoe(w, u, mx, my, 110, (t) => abil(w, u, t, R(rank, 45, 60) + 0.25 * u.stats.ap, 'magic', 'ult', true));
        });
      }
    },
  },
};

const liris: Kit = {
  onAbilityHit(w, u, t, key) {
    if (key !== 's1' && key !== 's2' && key !== 'ult') return;
    const mk = 'frost_' + u.id;
    t.marks[mk] = (t.marks[mk] ?? 0) + 1;
    if (t.marks[mk] >= 3 && (t.marks[mk + '_cd'] ?? 0) <= w.time) {
      t.marks[mk] = 0;
      t.marks[mk + '_cd'] = w.time + 6;
      root(w, t, 1.0);
      vfx(w, 'frostRoot', t.x, t.y, { id: t.id, dur: 1 });
    }
  },
  s1: {
    cd: () => 6, castTime: 0.3, range: 600,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      const { dx, dy } = dirTo(u, tx, ty);
      w.spawnProjectile({
        kind: 'iceLance', team: u.team, ownerId: u.id, x: u.x, y: u.y - 14, speed: 1000, dirX: dx, dirY: dy, maxDist: 620, width: 26, pierce: true,
        onHit(w2, t) { abil(w2, u, t, 65 + 20 * L + 0.55 * u.stats.ap, 'magic', 's1'); },
      });
    },
  },
  s2: {
    cd: () => 11, castTime: 0.3, range: 520,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      const touched = new Set<number>();
      w.spawnZone({
        kind: 'frozenGround', team: u.team, ownerId: u.id, x: tx, y: ty, r: 170, until: w.time + 3, every: 0.5,
        onTick(w2, z) {
          for (const t of w2.enemiesInRadius(z.team, z.x, z.y, z.r)) {
            const first = !touched.has(t.id);
            touched.add(t.id);
            slow(w2, t, 0.4, 0.6);
            dealDamage(w2, u, t, 10 + 3 * L + 0.08 * u.stats.ap, 'magic', { ability: 's2', aoe: true, noProc: !first });
          }
        },
      });
    },
  },
  ult: {
    cd: () => 65, castTime: 0.45, range: 600,
    exec({ w, u, rank }, p) {
      const cx = p.tgt ? p.tgt.x : p.x!, cy = p.tgt ? p.tgt.y : p.y!;
      w.spawnZone({
        kind: 'winterPrison', team: u.team, ownerId: u.id, x: cx, y: cy, r: 240, until: w.time + 4, every: 0.25,
        onTick(w2, z) { for (const t of w2.enemiesInRadius(z.team, z.x, z.y, z.r)) slow(w2, t, 0.6, 0.35); },
      });
      w.schedule(1.5, () => {
        vfx(w, 'freezeBurst', cx, cy, { r: 240 });
        aoe(w, u, cx, cy, 240, (t) => {
          abil(w, u, t, R(rank, 100, 170) + 0.5 * u.stats.ap, 'magic', 'ult', true);
          stun(w, t, R(rank, 1.0, 1.5));
          vfx(w, 'frozen', t.x, t.y, { id: t.id, dur: R(rank, 1.0, 1.5) });
        });
      });
    },
  },
};

function orunEcho(w: any, u: any, t: any, key: string) {
  const mk = 'echo_' + u.id;
  const lastK = t.marks[mk + 'k'] ?? 0;
  const lastT = t.marks[mk + 't'] ?? -99;
  const kn = key === 's1' ? 1 : key === 's2' ? 2 : 3;
  if (lastK && lastK !== kn && w.time - lastT < 3 && (t.marks[mk + 'cd'] ?? 0) <= w.time) {
    t.marks[mk + 'cd'] = w.time + 4;
    const L = u.champ.level - 1;
    w.schedule(0.1, () => {
      if (!t.alive) return;
      vfx(w, 'echoSeal', t.x, t.y);
      dealDamage(w, u, t, 40 + 12 * L + 0.25 * u.stats.ap, 'magic', { ability: 'passive' });
    });
  }
  t.marks[mk + 'k'] = kn;
  t.marks[mk + 't'] = w.time;
}

const orun: Kit = {
  onAbilityHit(w, u, t, key) {
    if (key === 's1' || key === 's2' || key === 'ult') orunEcho(w, u, t, key);
  },
  s1: {
    cd: () => 7, castTime: 0.3, range: 540,
    exec({ w, u, L }, p) {
      const tx = p.x ?? p.tgt!.x, ty = p.y ?? p.tgt!.y;
      vfx(w, 'riftMarkGround', tx, ty, { r: 130, dur: 1.2 });
      w.schedule(1.2, () => {
        if (!u.alive && false) return;
        vfx(w, 'riftBurst', tx, ty, { r: 130 });
        aoe(w, u, tx, ty, 130, (t) => {
          abil(w, u, t, 80 + 24 * L + 0.6 * u.stats.ap, 'magic', 's1', true);
          t.marks['rift_' + u.id] = w.time + 6;
        });
      });
    },
  },
  s2: {
    cd: () => 10, castTime: 0.3, range: 500,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      const { dx, dy } = dirTo(u, tx, ty);
      w.spawnProjectile({
        kind: 'voidWave', team: u.team, ownerId: u.id, x: u.x, y: u.y - 10, speed: 800, dirX: dx, dirY: dy, maxDist: 520, width: 45, pierce: true,
        onHit(w2, t) {
          abil(w2, u, t, 45 + 14 * L + 0.4 * u.stats.ap, 'magic', 's2', true);
          slow(w2, t, 0.35, 1.5);
          if (t.alive && !t.isStructure && t.kind !== 'boss') {
            const nx = t.x + dx * 80, ny = t.y + dy * 80;
            if (isWalkable(nx, ny)) w2.dashUnit(t, nx, ny, 600);
          }
        },
      });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 50, 40), castTime: 0.4, range: 0,
    exec({ w, u, rank }) {
      const marked = w.units.filter((t) => t.alive && t.team !== u.team && (t.marks['rift_' + u.id] ?? 0) > w.time && dist(t.x, t.y, u.x, u.y) < 950);
      for (const m of marked) {
        m.marks['rift_' + u.id] = 0;
        vfx(w, 'sealBreak', m.x, m.y, { r: 160 });
        aoe(w, u, m.x, m.y, 160, (t) => abil(w, u, t, R(rank, 120, 200) + 0.6 * u.stats.ap, 'magic', 'ult', true));
      }
    },
  },
};
void pointToward;

export const MAGE_KITS: Record<string, Kit> = { asira, liris, orun };
