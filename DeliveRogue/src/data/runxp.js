// data/runxp.js — Hybrid Run XP budget (Master Prompt §8 table). Run XP is separate from Courier XP.
// Sources: unique segment entry (route), checkpoint (route share), normal/elite kills (combat), one limited
// risky-route bonus. No XP for re-entering a segment, re-killing, or re-using a checkpoint.
import { ENEMY_DB, ENEMY_SHORT } from './enemies.js';

export const RUN_XP_PER_LEVEL = 100;
export const RUN_XP_TABLE = [
  { from: 1, to: 3, route: 120, combat: 80, firstPicks: 1, target: [2, 3] },
  { from: 4, to: 6, route: 140, combat: 60, firstPicks: 2, target: [3, 4] },
  { from: 7, to: 9, route: 220, combat: 80, firstPicks: 2, target: [4, 5] },
  { from: 10, to: 11, route: 300, combat: 100, firstPicks: 2, target: [5, 6] },
  { from: 12, to: 12, route: 400, combat: 100, firstPicks: 2, target: [6, 7] },
];
export const MID_DROP_SHARE = 0.15, CHECKPOINT_SHARE = 0.25, RISKY_BONUS = 0.10, ELITE_WEIGHT = 3;
export const xpRow = n => RUN_XP_TABLE.find(r => n >= r.from && n <= r.to);

/** Per-source XP values for a built world + chapter (pure). */
export function xpPlan(ch, world) {
  // route segments: everything between start (bottom) and the final drop (top), excluding the boss arena
  const row = xpRow(ch.n), routeSegs = world.segs.filter((s, i) => i > 0 && i < world.segs.length - 1 && s.name !== 'BOSS_ARENA');
  const cp = world.checkpoint ? Math.round(row.route * CHECKPOINT_SHARE) : 0;
  const mids = (world.drops || []).length - 1, drop = mids > 0 ? row.route * MID_DROP_SHARE / mids : 0;
  const seg = (row.route - cp - drop * mids) / Math.max(1, routeSegs.length);
  const weight = world.segs.reduce((a, s) => a + s.enemies.reduce((b, sh) => b + (ENEMY_DB[ENEMY_SHORT[sh]].elite ? ELITE_WEIGHT : 1), 0), 0);
  return { row, seg, cp, drop, risky: Math.round(row.route * RISKY_BONUS), killUnit: weight ? row.combat / weight : 0, routeSegIdx: new Set(routeSegs.map(s => s.idx)) };
}
