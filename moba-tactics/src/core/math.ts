export interface Vec { x: number; y: number }
export const dist2 = (ax: number, ay: number, bx: number, by: number) => (ax - bx) ** 2 + (ay - by) ** 2;
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.sqrt(dist2(ax, ay, bx, by));
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export type Dir = 'down' | 'up' | 'left' | 'right';
export function dirFrom(dx: number, dy: number, prev: Dir): Dir {
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return prev;
  if (Math.abs(dx) > Math.abs(dy) * 0.9) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
/** Distance from point p to segment ab */
export function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay;
  const l2 = vx * vx + vy * vy;
  let t = l2 > 0 ? ((px - ax) * vx + (py - ay) * vy) / l2 : 0;
  t = clamp(t, 0, 1);
  return dist(px, py, ax + vx * t, ay + vy * t);
}
