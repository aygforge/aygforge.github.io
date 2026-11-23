import type { Unit } from '../unit';
import type { World } from '../world';
import type { DmgType } from '../types';
import { dealDamage } from '../combat';
import { dist } from '../math';

export const R = (rank: number, a: number, b: number) => (rank >= 2 ? b : a);

export function abil(w: World, u: Unit, tgt: Unit, amt: number, type: DmgType, key: string, aoe = false) {
  return dealDamage(w, u, tgt, amt, type, { ability: key, aoe, srcX: u.x, srcY: u.y });
}

export function aoe(w: World, u: Unit, x: number, y: number, r: number, fn: (t: Unit) => void, structures = false) {
  const list = w.enemiesInRadius(u.team, x, y, r, { structures });
  for (const t of list) fn(t);
  return list.length;
}

export function vfx(w: World, k: string, x: number, y: number, extra: { r?: number; dur?: number; id?: number; x2?: number; y2?: number; tgt?: number } = {}) {
  w.emit({ t: 'vfx', k, x, y, ...extra });
}

export function pointToward(u: Unit, x: number, y: number, maxD: number) {
  const d = dist(u.x, u.y, x, y) || 1;
  const k = Math.min(1, maxD / d);
  return { x: u.x + (x - u.x) * k, y: u.y + (y - u.y) * k };
}

export function dirTo(u: Unit, x: number, y: number) {
  const d = dist(u.x, u.y, x, y) || 1;
  return { dx: (x - u.x) / d, dy: (y - u.y) / d };
}

export function pullTo(w: World, t: Unit, x: number, y: number, speed = 900) {
  if (t.isStructure || t.kind === 'boss') return;
  t.marks.pulledUntil = w.time + 0.6;
  w.dashUnit(t, x, y, speed);
}
