import type { Unit } from '../core/unit';
import type { World } from '../core/world';
import type { CastPlan } from '../core/kits/types';
import type { Style } from '../core/types';
import type { Perception } from './perception';
import { dist } from '../core/math';
import { DT } from '../core/config';
import { CHAMP_BY_ID } from '../data/champions';
import { FOUNTAIN_POS } from '../core/map';

export type AIMode = 'fight' | 'farm' | 'push' | 'defend' | 'jungle' | 'boss' | 'retreat' | 'idle';
export interface SkillAICtx {
  w: World; u: Unit; P: Perception; focus?: Unit; fight: boolean; mode: AIMode; style: Style; hpPct: number; L: number;
}
type Fn = (c: SkillAICtx) => CastPlan | null;

const now = (c: SkillAICtx) => c.w.time;
const agg = (c: SkillAICtx) => c.style === 'aggressive';
const def = (c: SkillAICtx) => c.style === 'defensive';

/** visible hostile non-structure units near u (neutrals only when jungling / they fight us) */
function foes(c: SkillAICtx, r: number): Unit[] {
  const { u } = c;
  return c.P.enemies.filter((e) => {
    if (e.isStructure) return false;
    if (dist(e.x, e.y, u.x, u.y) > r) return false;
    if (e.team === 2) return c.mode === 'jungle' || c.mode === 'boss' || e.targetId === u.id || c.focus === e;
    return true;
  });
}
const champs = (c: SkillAICtx, r: number) => foes(c, r).filter((e) => e.kind === 'champion');
const squishy = (e: Unit) => e.kind === 'champion' && ['mage', 'marksman', 'summoner'].includes(CHAMP_BY_ID[e.sub].cls);

function focusIn(c: SkillAICtx, r: number, champOnly = false): Unit | null {
  const f = c.focus;
  if (f && f.alive && !f.isStructure && dist(f.x, f.y, c.u.x, c.u.y) <= r + f.radius && (!champOnly || f.kind === 'champion')) {
    if (f.team === 2 || c.P.visible(f)) return f;
  }
  if (c.fight) {
    const ch = champs(c, r);
    if (ch.length) return ch.sort((a, b) => a.hp - b.hp || a.id - b.id)[0];
  }
  return null;
}
function bigFocus(c: SkillAICtx, r: number): Unit | null {
  const f = focusIn(c, r);
  if (!f) return null;
  if (f.kind === 'champion' || f.kind === 'boss' || (f.kind === 'monster' && f.stats.maxHp > 400) || (f.kind === 'summon' && f.stats.maxHp > 500)) return f;
  return null;
}
function predict(e: Unit, t: number) {
  const vx = (e.x - e.px) / DT, vy = (e.y - e.py) / DT;
  return { x: e.x + vx * t, y: e.y + vy * t };
}
/** best AoE point among visible enemies. weights: champion 3, boss 3, others 1 */
function cluster(c: SkillAICtx, range: number, radius: number, min: number, opts: { needChamp?: boolean; lead?: number } = {}): CastPlan | null {
  const list = foes(c, range + radius);
  let best: CastPlan | null = null, bestS = 0;
  for (const p of list) {
    const pt = opts.lead ? predict(p, opts.lead) : { x: p.x, y: p.y };
    if (dist(pt.x, pt.y, c.u.x, c.u.y) > range) continue;
    let s = 0, hasChamp = false;
    for (const q of list) {
      if (dist(q.x, q.y, pt.x, pt.y) <= radius + q.radius * 0.5) {
        const wgt = q.kind === 'champion' || q.kind === 'boss' ? 3 : q.kind === 'monster' && q.stats.maxHp > 500 ? 2 : 1;
        s += wgt;
        if (q.kind === 'champion') hasChamp = true;
      }
    }
    if (opts.needChamp && !hasChamp) continue;
    if (s > bestS) { bestS = s; best = { x: pt.x, y: pt.y }; }
  }
  return bestS >= min ? best : null;
}
function selfCount(c: SkillAICtx, r: number) {
  let s = 0;
  for (const q of foes(c, r)) s += q.kind === 'champion' || q.kind === 'boss' ? 3 : 1;
  return s;
}
function awayPoint(c: SkillAICtx, d: number): CastPlan | null {
  const th = champs(c, 500)[0];
  const f = FOUNTAIN_POS[c.u.team as 0 | 1];
  let dx = f.x - c.u.x, dy = f.y - c.u.y;
  if (th) { dx = c.u.x - th.x + dx * 0.3; dy = c.u.y - th.y + dy * 0.3; }
  const l = Math.hypot(dx, dy) || 1;
  return { x: c.u.x + (dx / l) * d, y: c.u.y + (dy / l) * d };
}
const recentlyHit = (c: SkillAICtx, s = 1.2) => now(c) - c.u.lastHitAt < s;
const farmAoE = (c: SkillAICtx) => c.mode === 'push' || c.mode === 'jungle' || c.mode === 'defend' || (c.mode === 'farm' && !def(c));
const lowEscape = (c: SkillAICtx) => c.hpPct < (def(c) ? 0.4 : 0.28) && champs(c, 450).length > 0;
const engageOK = (c: SkillAICtx) => c.fight;

export const SKILL_AI: Record<string, { s1: Fn; s2: Fn; ult: Fn }> = {
  boran: {
    s1: (c) => ((c.fight || c.mode === 'jungle' || c.mode === 'boss') && recentlyHit(c) && c.hpPct < 0.9 ? {} : null),
    s2: (c) => { const t = engageOK(c) ? focusIn(c, 400, !agg(c) && c.mode !== 'jungle') : bigFocus(c, 350); return t ? { tgt: t } : null; },
    ult: (c) => (c.fight && (champs(c, 320).length >= 2 || (champs(c, 320).length >= 1 && c.hpPct < 0.6)) ? {} : null),
  },
  korruk: {
    s1: (c) => (selfCount(c, 220) >= (c.fight ? 1 : 3) ? {} : null),
    s2: (c) => ((c.fight || c.mode === 'boss') && recentlyHit(c) && c.hpPct < 0.75 ? {} : null),
    ult: (c) => (c.fight && (champs(c, 300).length >= 2 || (champs(c, 300).length >= 1 && (c.hpPct < 0.5 || agg(c)))) ? {} : null),
  },
  tharok: {
    s1: (c) => {
      if (!c.fight) return null;
      const list = champs(c, 500).sort((a, b) => (squishy(b) ? 1 : 0) - (squishy(a) ? 1 : 0) || a.hp - b.hp);
      const t = list.find((e) => agg(c) || !c.P.enemyTowerCovering(e.x, e.y));
      return t ? { x: predict(t, 0.35).x, y: predict(t, 0.35).y } : null;
    },
    s2: (c) => { const t = focusIn(c, 380, c.mode !== 'jungle') ?? bigFocus(c, 380); return t ? { tgt: t } : null; },
    ult: (c) => (c.fight && (champs(c, 360).length >= 2 || (champs(c, 300).length === 1 && agg(c))) ? {} : null),
  },
  rovan: {
    s1: (c) => { const t = focusIn(c, 160); return t ? { tgt: t } : (selfCount(c, 200) >= 3 && farmAoE(c) ? { x: c.u.x, y: c.u.y } : null); },
    s2: (c) => { const t = engageOK(c) ? focusIn(c, 420, true) : bigFocus(c, 420); return t && dist(t.x, t.y, c.u.x, c.u.y) > 120 ? { tgt: t } : null; },
    ult: (c) => ((c.fight && champs(c, 300).length > 0) || (c.mode === 'boss' && c.focus?.kind === 'boss') ? {} : null),
  },
  selda: {
    s1: (c) => (c.fight && champs(c, 260).length > 0 && recentlyHit(c, 0.8) ? {} : null),
    s2: (c) => { const t = focusIn(c, 330); return t && (t.kind === 'champion' || t.stats.maxHp > 300 || farmAoE(c)) ? { tgt: t } : null; },
    ult: (c) => {
      if (!c.fight) return null;
      const near = champs(c, 700);
      if (near.length >= 3 && !agg(c)) return null;
      const t = focusIn(c, 400, true);
      return t ? { tgt: t } : null;
    },
  },
  malvek: {
    s1: (c) => { const t = focusIn(c, 200); return t && c.hpPct > 0.22 ? { tgt: t } : null; },
    s2: (c) => { const t = focusIn(c, 350, c.mode !== 'jungle' && c.mode !== 'boss') ?? bigFocus(c, 350); return t ? { tgt: t } : null; },
    ult: (c) => ((c.fight && champs(c, 350).length > 0 && c.hpPct < 0.8) || (c.mode === 'boss' && c.hpPct < 0.6) ? {} : null),
  },
  asira: {
    s1: (c) => { const ch = focusIn(c, 540, true); if (ch && c.fight) return predict(ch, 0.45); return farmAoE(c) ? cluster(c, 540, 130, 3) : null; },
    s2: (c) => (c.fight ? cluster(c, 520, 150, 3, { needChamp: true, lead: 0.4 }) : farmAoE(c) ? cluster(c, 520, 150, 4) : null),
    ult: (c) => (c.fight ? cluster(c, 620, 230, agg(c) ? 3 : 4, { needChamp: true, lead: 0.5 }) ?? (champs(c, 620).some((e) => e.hpPct < 0.45) ? cluster(c, 620, 230, 3, { needChamp: true }) : null) : c.mode === 'boss' ? cluster(c, 620, 230, 3) : null),
  },
  liris: {
    s1: (c) => { const ch = focusIn(c, 600, true); if (ch && c.fight) return predict(ch, 0.3); return farmAoE(c) ? cluster(c, 560, 60, 3) : null; },
    s2: (c) => { const th = champs(c, 420)[0]; if (th) return predict(th, 0.4); return farmAoE(c) ? cluster(c, 520, 170, 4) : null; },
    ult: (c) => (c.fight ? cluster(c, 600, 220, 3, { needChamp: true, lead: 0.6 }) : null),
  },
  orun: {
    s1: (c) => { const ch = focusIn(c, 560, true); if (ch && c.fight) { const p = predict(ch, 1.0); return dist(p.x, p.y, c.u.x, c.u.y) < 560 ? p : { x: ch.x, y: ch.y }; } return farmAoE(c) ? cluster(c, 540, 130, 3) : null; },
    s2: (c) => { const ch = champs(c, 480)[0]; if (ch && (c.fight || lowEscape(c))) return { x: ch.x, y: ch.y }; return farmAoE(c) && c.mode !== 'farm' ? cluster(c, 480, 60, 3) : null; },
    ult: (c) => {
      const marked = c.P.enemies.filter((e) => (e.marks['rift_' + c.u.id] ?? 0) > now(c) && dist(e.x, e.y, c.u.x, c.u.y) < 900);
      const mc = marked.filter((e) => e.kind === 'champion').length;
      return mc >= 1 || (marked.length >= 4 && c.mode === 'push') || (c.mode === 'boss' && marked.some((e) => e.kind === 'boss')) ? {} : null;
    },
  },
  nyra: {
    s1: (c) => { const t = engageOK(c) ? focusIn(c, 450, c.mode !== 'jungle') : bigFocus(c, 450); return t && dist(t.x, t.y, c.u.x, c.u.y) > 110 ? { tgt: t } : null; },
    s2: (c) => (lowEscape(c) || (c.fight && c.u.stealthUntil <= now(c) && champs(c, 700).some((e) => dist(e.x, e.y, c.u.x, c.u.y) > 250)) ? {} : null),
    ult: (c) => {
      const L = c.u.champ!.level;
      const t = champs(c, 400).find((e) => e.hpPct < 0.45 || e.hp < (L >= 9 ? 200 : 120) + c.u.stats.ad + (e.stats.maxHp - e.hp) * 0.25);
      return t ? { tgt: t } : null;
    },
  },
  zereth: {
    s1: (c) => { const t = focusIn(c, 500, c.mode === 'farm') ?? bigFocus(c, 500); return t ? { tgt: t } : null; },
    s2: (c) => (c.fight ? cluster(c, 420, 170, 3, { needChamp: true, lead: 0.3 }) : farmAoE(c) ? cluster(c, 420, 170, 3) : null),
    ult: (c) => {
      let stacks = 0, kill = false;
      for (const e of champs(c, 700)) {
        const st = (e.marks.poisonUntil ?? 0) > now(c) ? e.marks.poison ?? 0 : 0;
        stacks += st;
        if (st > 0 && e.hp < st * 40) kill = true;
      }
      return stacks >= 5 || kill ? {} : null;
    },
  },
  vaelis: {
    s1: (c) => {
      if (lowEscape(c)) return awayPoint(c, 260);
      const t = c.fight ? focusIn(c, 600, true) : null;
      return t && dist(t.x, t.y, c.u.x, c.u.y) > 180 ? { x: t.x, y: t.y } : null;
    },
    s2: (c) => { const t = focusIn(c, 160); return t ? { tgt: t } : null; },
    ult: (c) => { if (!c.fight) return null; const t = focusIn(c, 450, true); return t ? { tgt: t } : null; },
  },
  edrin: {
    s1: (c) => { const ch = focusIn(c, 680, true); if (ch && c.fight) return predict(ch, 0.3); return farmAoE(c) ? cluster(c, 650, 40, 3) : null; },
    s2: (c) => {
      if (champs(c, 900).length) return null;
      let best: CastPlan | null = null, age = 99;
      for (const id of c.P.enemyChampIds()) {
        const ls = c.P.lastSeen(id);
        if (!ls || ls.age > 14 || ls.age < 2 || c.P.enemyDead(id)) continue;
        if (dist(ls.x, ls.y, c.u.x, c.u.y) > 1100) continue;
        if (ls.age < age) { age = ls.age; best = { x: ls.x, y: ls.y }; }
      }
      if (best) return best;
      if (c.mode === 'boss' && c.focus) return { x: c.focus.x, y: c.focus.y };
      return null;
    },
    ult: (c) => {
      const L = c.u.champ!.level;
      const dmg = (L >= 9 ? 260 : 160) + 1.2 * c.u.stats.ad;
      const t = champs(c, 1500).find((e) => e.hp < dmg * 0.8 || (c.fight && e.hpPct < 0.35));
      return t ? predict(t, dist(t.x, t.y, c.u.x, c.u.y) / 1700) : null;
    },
  },
  tessa: {
    s1: (c) => { const t = focusIn(c, 420, c.mode === 'farm') ?? bigFocus(c, 420); return t ? { tgt: t } : null; },
    s2: (c) => {
      const th = champs(c, 220).find((e) => !CHAMP_BY_ID[e.sub].ranged);
      if (th || lowEscape(c)) return awayPoint(c, 220);
      return null;
    },
    ult: (c) => ((c.fight && champs(c, 450).length > 0) || (c.mode === 'boss' && c.focus?.kind === 'boss') ? {} : null),
  },
  dorn: {
    s1: (c) => (c.fight ? cluster(c, 480, 150, 3, { needChamp: true, lead: 1.2 }) : farmAoE(c) ? cluster(c, 480, 150, 3) : null),
    s2: (c) => {
      if (c.mode === 'push' || c.mode === 'farm') {
        const tw = c.P.enemyTowers().find((t) => c.P.attackable(t) && dist(t.x, t.y, c.u.x, c.u.y) < 450 && c.P.alliesNear(t.x, t.y, 420, 'minion').length > 0);
        if (tw) return { tgt: tw };
      }
      const t = focusIn(c, 450, c.mode === 'farm') ?? bigFocus(c, 450);
      return t ? { tgt: t } : null;
    },
    ult: (c) => (c.fight ? cluster(c, 560, 250, 3, { needChamp: true, lead: 1.3 }) : c.mode === 'boss' && c.focus?.kind === 'boss' ? { x: c.focus.x, y: c.focus.y } : null),
  },
  rughan: {
    s1: (c) => {
      const wolf = c.w.units.find((s) => s.alive && s.ownerId === c.u.id && s.sub === 'wolf');
      if (!wolf) return null;
      const t = focusIn(c, 560, c.mode === 'farm') ?? bigFocus(c, 560);
      return t ? { tgt: t } : null;
    },
    s2: (c) => ((c.fight && champs(c, 400).length) || ((c.mode === 'jungle' || c.mode === 'boss') && c.focus && dist(c.focus.x, c.focus.y, c.u.x, c.u.y) < 250) ? {} : null),
    ult: (c) => ((c.fight && champs(c, 500).length > 0) || (c.mode === 'boss' && c.focus?.kind === 'boss') ? {} : null),
  },
  nekmar: {
    s1: (c) => {
      const n = c.w.units.filter((s) => s.alive && s.ownerId === c.u.id && s.sub === 'skeleton').length;
      if (n >= 2 && !c.fight) return null;
      return c.fight || foes(c, 600).length > 0 ? {} : null;
    },
    s2: (c) => { const t = focusIn(c, 450, c.mode === 'farm') ?? bigFocus(c, 450); return t ? { tgt: t } : null; },
    ult: (c) => ((c.fight && champs(c, 550).length > 0) || (c.mode === 'boss' && c.focus?.kind === 'boss') || (c.mode === 'push' && c.P.enemyTowers().some((t) => c.P.attackable(t) && dist(t.x, t.y, c.u.x, c.u.y) < 600)) ? {} : null),
  },
  ilvara: {
    s1: (c) => {
      const { u } = c;
      if (c.mode === 'defend') {
        const tw = c.P.ownTowers().filter((t) => t.kind === 'tower' && dist(t.x, t.y, u.x, u.y) < 600)[0];
        if (tw) return { x: (tw.x + u.x) / 2, y: (tw.y + u.y) / 2 };
      }
      const e = c.focus && c.focus.alive ? c.focus : foes(c, 600)[0];
      if (!e) return null;
      if (!(c.fight || c.mode === 'push' || c.mode === 'jungle' || c.mode === 'boss' || c.mode === 'farm')) return null;
      const d = dist(e.x, e.y, u.x, u.y) || 1;
      const k = Math.min(1, 200 / d);
      return { x: u.x + (e.x - u.x) * k, y: u.y + (e.y - u.y) * k };
    },
    s2: (c) => { const ch = focusIn(c, 540, true); if (ch && c.fight) return predict(ch, 0.3); return farmAoE(c) ? cluster(c, 540, 40, 3) : null; },
    ult: (c) => {
      const s = c.w.units.filter((x) => x.alive && x.ownerId === c.u.id && x.sub === 'sentry');
      const busy = s.some((x) => foes(c, 2000).some((e) => dist(e.x, e.y, x.x, x.y) < 400 && (e.kind === 'champion' || e.kind === 'boss')));
      return busy ? {} : null;
    },
  },
};
