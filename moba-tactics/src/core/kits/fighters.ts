import type { Kit } from './types';
import { R, abil, aoe, vfx, pointToward, dirTo } from './helpers';
import { dealDamage, heal, slow } from '../combat';
import { dist } from '../math';

const rovan: Kit = {
  onAttackHit(w, u) {
    const c = u.champ!;
    c.passive.rage = Math.min(10, (c.passive.rage ?? 0) + 1);
  },
  onDamaged(w, u) {
    const c = u.champ!;
    if ((c.passive.rageCd ?? 0) > w.time) return;
    c.passive.rageCd = w.time + 0.4;
    c.passive.rage = Math.min(10, (c.passive.rage ?? 0) + 1);
  },
  onTick(w, u) {
    const c = u.champ!;
    if (w.time - c.lastCombat > 3 && (c.passive.rage ?? 0) > 0 && w.tick % 20 === 0) c.passive.rage = Math.max(0, c.passive.rage - 1);
  },
  statMods(w, u, s) {
    const c = u.champ!;
    s.as *= 1 + 0.04 * (c.passive.rage ?? 0);
    if ((c.passive.ultUntil ?? 0) > w.time) s.as *= 1 + (c.passive.ultAs ?? 0.5);
  },
  onDealDamage(w, u, t, amt, o) {
    const c = u.champ!;
    if ((c.passive.ultUntil ?? 0) > w.time && !o.dot) heal(w, u, amt * (c.passive.ultLs ?? 0.2) * (t.kind === 'minion' ? 0.5 : 1), u);
  },
  s1: {
    cd: () => 6, castTime: 0.3, range: 160,
    exec({ w, u, L }, p) {
      const tx = p.tgt ? p.tgt.x : p.x ?? u.x, ty = p.tgt ? p.tgt.y : p.y ?? u.y;
      const c = pointToward(u, tx, ty, 90);
      vfx(w, 'axeCleave', c.x, c.y, { r: 170, x2: u.x, y2: u.y });
      aoe(w, u, c.x, c.y, 170, (t) => abil(w, u, t, 55 + 17 * L + 0.8 * u.stats.ad, 'phys', 's1', true));
    },
  },
  s2: {
    cd: () => 11, castTime: 0.1, range: 420, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      const end = pointToward(u, t.x, t.y, Math.max(0, dist(u.x, u.y, t.x, t.y) - (u.radius + t.radius)));
      w.dashUnit(u, end.x, end.y, 850, () => {
        if (!t.alive || dist(u.x, u.y, t.x, t.y) > 150) return;
        abil(w, u, t, 40 + 14 * L + 0.5 * u.stats.ad, 'phys', 's2');
        slow(w, t, 0.35, 1.5);
        vfx(w, 'bloodSlash', t.x, t.y);
      });
    },
  },
  ult: {
    cd: () => 55, castTime: 0.3, range: 0,
    exec({ w, u, rank }) {
      const c = u.champ!;
      c.passive.ultUntil = w.time + 6;
      c.passive.ultAs = R(rank, 0.5, 0.8);
      c.passive.ultLs = R(rank, 0.2, 0.3);
      vfx(w, 'frenzy', u.x, u.y, { id: u.id, dur: 6 });
    },
  },
};

const selda: Kit = {
  armorIgnore(w, u, t) {
    const c = u.champ!;
    return c.passive.wpTarget === t.id ? 0.06 * (c.passive.wpStacks ?? 0) : 0;
  },
  onAttackHit(w, u, t) {
    const c = u.champ!;
    if (c.passive.wpTarget === t.id) c.passive.wpStacks = Math.min(5, (c.passive.wpStacks ?? 0) + 1);
    else { c.passive.wpTarget = t.id; c.passive.wpStacks = 1; }
  },
  incomingMul(w, u, src, o) {
    const c = u.champ!;
    let m = 1;
    if ((c.passive.parryUntil ?? 0) > w.time && !o.dot && src.team !== u.team) {
      c.passive.parryUntil = 0;
      const L = c.level - 1;
      vfx(w, 'parry', u.x, u.y, { id: u.id });
      if (src.alive && dist(u.x, u.y, src.x, src.y) < 320) {
        w.schedule(0.05, () => {
          if (src.alive) dealDamage(w, u, src, 50 + 18 * L + 0.8 * u.stats.ad, 'phys', { ability: 's1' });
        });
      }
      return 0;
    }
    if ((c.passive.duelUntil ?? 0) > w.time && c.passive.duelTarget === src.id) m *= 0.8;
    return m;
  },
  outgoingMul(w, u, t) {
    const c = u.champ!;
    if ((c.passive.duelUntil ?? 0) > w.time && c.passive.duelTarget === t.id) return 1 + (c.passive.duelAmp ?? 0.25);
    return 1;
  },
  s1: {
    cd: () => 10, castTime: 0.05, range: 0,
    exec({ w, u }) {
      u.champ!.passive.parryUntil = w.time + 1.2;
      vfx(w, 'parryStance', u.x, u.y, { id: u.id, dur: 1.2 });
    },
  },
  s2: {
    cd: () => 7, castTime: 0.1, range: 330, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      const end = pointToward(u, t.x, t.y, Math.min(250, Math.max(0, dist(u.x, u.y, t.x, t.y) - (u.radius + t.radius))));
      w.dashUnit(u, end.x, end.y, 1000, () => {
        if (t.alive && dist(u.x, u.y, t.x, t.y) < 160) {
          abil(w, u, t, 70 + 20 * L + 0.9 * u.stats.ad, 'phys', 's2');
          vfx(w, 'thrust', t.x, t.y, { x2: u.x, y2: u.y });
        }
      });
    },
  },
  ult: {
    cd: () => 60, castTime: 0.2, range: 400, needsTarget: true,
    exec({ w, u, rank }, p) {
      const c = u.champ!;
      c.passive.duelTarget = p.tgt!.id;
      c.passive.duelUntil = w.time + 6;
      c.passive.duelAmp = R(rank, 0.25, 0.35);
      vfx(w, 'duelMark', p.tgt!.x, p.tgt!.y, { id: p.tgt!.id, tgt: u.id, dur: 6 });
    },
  },
};

const malvek: Kit = {
  outgoingMul(w, u) {
    const miss = 1 - u.hp / u.stats.maxHp;
    return 1 + 0.4 * Math.max(0, Math.min(1, miss / 0.7));
  },
  onDealDamage(w, u, t, amt, o) {
    const c = u.champ!;
    let h = 0;
    if ((t.marks['leech_' + u.id] ?? 0) > w.time && !o.dot) h += 0.25;
    if ((c.passive.ultUntil ?? 0) > w.time) h += c.passive.ultHeal ?? 0.45;
    if (h > 0) heal(w, u, amt * h * (t.kind === 'minion' ? 0.4 : 1), u);
  },
  s1: {
    cd: () => 7, castTime: 0.2, range: 200, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      u.hp = Math.max(1, u.hp - u.hp * 0.06);
      abil(w, u, t, 55 + 18 * L + 0.7 * u.stats.ad, 'phys', 's1');
      if (t.alive) w.dot(u, t, 20 + 6 * L, 3, 'phys', 'malvek_bleed_' + u.id);
      vfx(w, 'bloodSlash', t.x, t.y);
    },
  },
  s2: {
    cd: () => 12, castTime: 0.2, range: 350, needsTarget: true,
    exec({ w, u, L }, p) {
      const t = p.tgt!;
      t.marks['leech_' + u.id] = w.time + 4;
      const d = abil(w, u, t, 40 + 12 * L, 'magic', 's2');
      heal(w, u, d, u);
      vfx(w, 'lifeDrain', t.x, t.y, { x2: u.x, y2: u.y, id: t.id, tgt: u.id, dur: 4 });
    },
  },
  ult: {
    cd: () => 60, castTime: 0.35, range: 0,
    exec({ w, u, rank }) {
      const c = u.champ!;
      c.passive.ultUntil = w.time + 7;
      c.passive.ultHeal = R(rank, 0.45, 0.65);
      vfx(w, 'bloodRite', u.x, u.y, { id: u.id, dur: 7, r: 120 });
    },
  },
};
void dirTo;

export const FIGHTER_KITS: Record<string, Kit> = { rovan, selda, malvek };
