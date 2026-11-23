import type { Kit } from './types';
import type { Unit } from '../unit';
import type { World } from '../world';
import { R, abil, vfx, pointToward } from './helpers';
import { slow } from '../combat';
import { dist } from '../math';
import { emptyStats } from '../unit';
import { hasItem } from '../stats';

function liveSummons(w: World, owner: Unit, sub: string): Unit[] {
  return w.units.filter((s) => s.alive && s.kind === 'summon' && s.ownerId === owner.id && s.sub === sub);
}

function wolfStats(u: Unit) {
  return { ...emptyStats(), maxHp: 140 + u.stats.maxHp * 0.4, ad: 8 + u.stats.ad * 0.5, as: 1.0, range: 70, armor: u.stats.armor * 0.8, mr: u.stats.mr * 0.8, ms: u.stats.ms + 25 };
}

function spawnWolf(w: World, u: Unit) {
  if (liveSummons(w, u, 'wolf').length) return;
  const s = w.spawnSummon(u, 'wolf', u.x + 30, u.y + 20, wolfStats(u), { radius: 16, living: true });
  vfx(w, 'summonPuff', s.x, s.y);
}

const rughan: Kit = {
  onSpawn(w, u) { spawnWolf(w, u); },
  onRespawn(w, u) { spawnWolf(w, u); },
  onTick(w, u) {
    if (w.tick % 20 !== 0) return;
    for (const wolf of liveSummons(w, u, 'wolf')) {
      const st = wolfStats(u);
      const ratio = wolf.hp / wolf.stats.maxHp;
      wolf.base = { ...st, maxHp: st.maxHp * (hasItem(u, 21) ? 1.12 : 1) };
      wolf.stats.maxHp = wolf.base.maxHp;
      wolf.hp = ratio * wolf.base.maxHp;
    }
  },
  s1: {
    cd: () => 8, castTime: 0.15, range: 600, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      const wolf = liveSummons(w, u, 'wolf')[0];
      if (!wolf) return;
      const end = pointToward(wolf, t.x, t.y, Math.max(0, dist(wolf.x, wolf.y, t.x, t.y) - (wolf.radius + t.radius)));
      wolf.data.forceTarget = t.id;
      wolf.data.forceUntil = w.time + 4;
      wolf.targetId = t.id;
      w.emit({ t: 'cast', id: wolf.id, k: 's1', x: t.x, y: t.y, dur: 0.3 });
      w.dashUnit(wolf, end.x, end.y, 1000, () => {
        if (!t.alive || dist(wolf.x, wolf.y, t.x, t.y) > 140) return;
        abil(w, u, t, 50 + 16 * L + 0.5 * u.stats.ad, 'phys', 's1');
        slow(w, t, 0.25, 2);
        vfx(w, 'wolfBite', t.x, t.y);
      });
    },
  },
  s2: {
    cd: () => 14, castTime: 0.3, range: 0,
    exec({ w, u }) {
      u.asBuffs.push({ amt: 0.35, until: w.time + 5, key: 'howl' });
      for (const s of w.units) if (s.alive && s.ownerId === u.id) s.asBuffs.push({ amt: 0.35, until: w.time + 5, key: 'howl' });
      vfx(w, 'howl', u.x, u.y, { r: 160, id: u.id });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 70, 60), castTime: 0.45, range: 0,
    exec({ w, u, rank }) {
      const st = { ...emptyStats(), maxHp: R(rank, 600, 900) + u.stats.maxHp * 0.25, ad: R(rank, 60, 90) + u.stats.ad * 0.3, as: 0.8, range: 85, armor: 30, mr: 25, ms: 200 };
      const b = w.spawnSummon(u, 'beast', u.x - 30, u.y + 10, st, { duration: 12, radius: 26, living: true });
      vfx(w, 'summonBig', b.x, b.y, { r: 90 });
    },
  },
};

const nekmar: Kit = {
  onNearbyDeath(w, u, dead) {
    if (dead.team === u.team || dead.kind === 'summon') return;
    const c = u.champ!;
    c.cds.s1 = Math.max(w.time, c.cds.s1 - 1);
    c.cds.ult = Math.max(w.time, c.cds.ult - 1);
    c.passive.souls = (c.passive.souls ?? 0) + 1;
    w.emit({ t: 'vfx', k: 'soulGather', x: dead.x, y: dead.y, x2: u.x, y2: u.y, tgt: u.id });
  },
  s1: {
    cd: () => 14, castTime: 0.4, range: 0,
    exec({ w, u, L }) {
      const cur = liveSummons(w, u, 'skeleton');
      for (const s of cur) s.expireAt = w.time + 20;
      for (let i = cur.length; i < 2; i++) {
        const st = { ...emptyStats(), maxHp: 220 + 25 * L, ad: 18 + 3 * L + 0.1 * u.stats.ap, as: 0.85, range: 70, armor: 12, mr: 8, ms: 175 };
        const s = w.spawnSummon(u, 'skeleton', u.x + (i ? 40 : -40), u.y + 30, st, { duration: 20, radius: 15, living: true });
        vfx(w, 'boneRise', s.x, s.y);
      }
    },
  },
  s2: {
    cd: () => 10, castTime: 0.3, range: 450, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      t.armorShred.push({ amt: 0.2, until: w.time + 4, key: 'grave_' + u.id });
      t.mrShred.push({ amt: 0.2, until: w.time + 4, key: 'grave_' + u.id });
      abil(w, u, t, 40 + 12 * L + 0.3 * u.stats.ap, 'magic', 's2');
      vfx(w, 'graveCurse', t.x, t.y, { id: t.id, dur: 4 });
    },
  },
  ult: {
    cd: (_L, r) => R(r, 75, 60), castTime: 0.6, range: 0,
    exec({ w, u, rank }) {
      const sk = liveSummons(w, u, 'skeleton');
      let x = u.x + 40, y = u.y;
      for (const s of sk) {
        x = s.x; y = s.y;
        s.alive = false; s.deathTime = w.time; s.removeAt = w.time + 1;
        w.emit({ t: 'death', id: s.id, k: 'consume' });
        vfx(w, 'boneConsume', s.x, s.y, { x2: u.x, y2: u.y });
      }
      const st = { ...emptyStats(), maxHp: R(rank, 900, 1400) + 250 * sk.length, ad: R(rank, 55, 85) + 0.3 * u.stats.ap, as: 0.7, range: 95, armor: 35, mr: 25, ms: 165 };
      const g = w.spawnSummon(u, 'bonegiant', x, y, st, { duration: 15, radius: 30, living: true });
      vfx(w, 'summonBig', g.x, g.y, { r: 100 });
    },
  },
};

function sentryStats(u: Unit, L: number) {
  return { ...emptyStats(), maxHp: 300 + 30 * L, ad: 25 + 6 * L + 0.25 * u.stats.ap, as: 0.9, range: 380, armor: 25, mr: 25, ms: 0 };
}

function placeSentry(w: World, u: Unit, x: number, y: number) {
  const L = u.champ!.level - 1;
  const cur = liveSummons(w, u, 'sentry');
  if (cur.length >= 2) {
    const old = cur.sort((a, b) => a.spawnTime - b.spawnTime)[0];
    old.alive = false; old.deathTime = w.time; old.removeAt = w.time + 1;
    w.emit({ t: 'death', id: old.id, k: 'expire' });
  }
  const s = w.spawnSummon(u, 'sentry', x, y, sentryStats(u, L), { duration: 15, radius: 18, structure: true });
  vfx(w, 'runeBuild', s.x, s.y);
  return s;
}

const ilvara: Kit = {
  s1: {
    cd: () => 12, castTime: 0.4, range: 320,
    exec({ w, u }, p) {
      placeSentry(w, u, p.x ?? u.x, p.y ?? u.y);
    },
  },
  s2: {
    cd: () => 7, castTime: 0.25, range: 550,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x!, ty = p.tgt ? p.tgt.y : p.y!;
      const d = dist(u.x, u.y, tx, ty) || 1;
      const c = u.champ!;
      let mul = 1;
      if ((c.passive.energy ?? 0) >= 5) { mul = 1.4; c.passive.energy -= 5; }
      w.spawnProjectile({
        kind: mul > 1 ? 'diskBig' : 'disk', team: u.team, ownerId: u.id, x: u.x, y: u.y - 12, speed: 850, dirX: (tx - u.x) / d, dirY: (ty - u.y) / d, maxDist: 560, width: 30, pierce: true,
        onHit(w2, t) { abil(w2, u, t, (60 + 18 * L + 0.5 * u.stats.ap) * mul, 'magic', 's2', true); },
      });
    },
  },
  ult: {
    cd: () => 55, castTime: 0.4, range: 0,
    exec({ w, u, rank }) {
      let cur = liveSummons(w, u, 'sentry');
      if (!cur.length) cur = [placeSentry(w, u, u.x + 30, u.y)];
      for (const s of cur) {
        s.asBuffs.push({ amt: R(rank, 1.0, 1.5), until: w.time + 6, key: 'overload' });
        s.base.ad *= 1.3;
        s.expireAt = Math.max(s.expireAt, w.time + 6.5);
        w.schedule(6, () => { s.base.ad /= 1.3; });
        vfx(w, 'overload', s.x, s.y, { id: s.id, dur: 6 });
      }
    },
  },
};

export const SUMMONER_KITS: Record<string, Kit> = { rughan, nekmar, ilvara };
