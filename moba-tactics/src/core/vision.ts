import { BALANCE } from './config';
import { CELL, GH, GW, walkable } from './map';
import type { Unit } from './unit';
import type { World } from './world';

/** Per-team visibility grid. Vision is the authority for both rendering and AI perception. */
export class Vision {
  grids: [Uint8Array, Uint8Array] = [new Uint8Array(GW * GH), new Uint8Array(GW * GH)];

  update(w: World) {
    for (const team of [0, 1] as const) {
      const g = this.grids[team];
      g.fill(0);
      for (const u of w.units) {
        if (!u.alive || u.team !== team) continue;
        let r = 0, los = false;
        switch (u.kind) {
          case 'champion': r = BALANCE.championVision; los = true; break;
          case 'minion': r = BALANCE.minionVision; break;
          case 'tower': r = BALANCE.towerVision; break;
          case 'crystal': r = BALANCE.crystalVision; break;
          case 'summon': r = BALANCE.summonVision; los = true; break;
        }
        if (r > 0) stamp(g, u.x, u.y, r, los);
      }
      for (const z of w.zones) if (z.vision && z.team === team) stamp(g, z.x, z.y, z.r, false);
    }
  }

  cellVisible(team: 0 | 1, x: number, y: number): boolean {
    const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
    if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return false;
    return this.grids[team][gy * GW + gx] === 1;
  }
}

function losClear(x0: number, y0: number, x1: number, y1: number): boolean {
  // grid walk between cells, forest cells block (the target cell itself may be forest edge)
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0, y = y0;
  for (;;) {
    if (x === x1 && y === y1) return true;
    if (!(x === x0 && y === y0) && !walkable[y * GW + x]) return false;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function stamp(g: Uint8Array, x: number, y: number, r: number, los: boolean) {
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  const rc = Math.ceil(r / CELL);
  const r2 = (r / CELL) ** 2;
  for (let dy = -rc; dy <= rc; dy++) {
    const gy = cy + dy;
    if (gy < 0 || gy >= GH) continue;
    for (let dx = -rc; dx <= rc; dx++) {
      const gx = cx + dx;
      if (gx < 0 || gx >= GW) continue;
      if (dx * dx + dy * dy > r2) continue;
      const i = gy * GW + gx;
      if (g[i]) continue;
      if (los && !losClear(cx, cy, gx, gy)) continue;
      g[i] = 1;
    }
  }
}

export function unitVisibleTo(w: World, u: Unit, team: 0 | 1): boolean {
  if (u.team === team) return true;
  if (!u.alive) return false;
  if (u.isStructure) return true; // map structures are always known
  if (u.stealthUntil > w.time) return false;
  return w.vision.cellVisible(team, u.x, u.y);
}
