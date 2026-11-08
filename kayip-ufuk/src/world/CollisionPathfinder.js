// Foot-point collision, 8-neighbour A* without diagonal corner cutting, 4-neighbour flood fill.
import { TILE } from './TerrainSystem.js';

export const FOOT_W = 18, FOOT_H = 14; // collisionFootPx
const COSTS = { trail: 0.9, grass: 1.0, mountain: 1.3, swamp: 1.4, ford: 1.6 };

export class CollisionPathfinder {
  constructor(terrain) { this.terrain = terrain; }

  /** Is tile enterable from neighbour (elevation step ≤ 1). */
  canStep(g, x0, y0, x1, y1, mode) {
    if (!this.terrain.passable(g, x1, y1, mode)) return false;
    if (mode === 'WALK' || mode === 'ANIMAL') return this.terrain.heightStep(g, x0, y0, x1, y1) <= 1;
    return true;
  }

  tileCost(g, x, y) {
    if (g.isCave) return 1;
    const i = g.i(x, y);
    if (g.road[i]) return COSTS.trail;
    const code = g.tiles[i];
    if (code === 13) return COSTS.ford;
    if (code === 6 || code === 11) return COSTS.swamp;
    if (code === 7 || code === 8) return COSTS.mountain;
    return COSTS.grass;
  }

  /** Box collision test in pixels: feet box centered at (px,py). */
  boxFree(g, px, py, mode, prevTile) {
    const x0 = Math.floor((px - FOOT_W / 2) / TILE), x1 = Math.floor((px + FOOT_W / 2 - 0.01) / TILE);
    const y0 = Math.floor((py - FOOT_H / 2) / TILE), y1 = Math.floor((py + FOOT_H / 2 - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (!this.terrain.passable(g, tx, ty, mode)) return false;
      if (prevTile && (mode === 'WALK') && this.terrain.heightStep(g, prevTile[0], prevTile[1], tx, ty) > 1) return false;
    }
    return true;
  }

  /** Slide-along-walls movement. Returns new [x,y]. */
  move(g, px, py, dx, dy, mode) {
    const prev = [Math.floor(px / TILE), Math.floor(py / TILE)];
    let nx = px, ny = py;
    if (dx !== 0 && this.boxFree(g, px + dx, py, mode, prev)) nx = px + dx;
    if (dy !== 0 && this.boxFree(g, nx, py + dy, mode, prev)) ny = py + dy;
    return [nx, ny];
  }

  /**
   * A* on tiles. goal can be [x,y] or a predicate; `adjacentOk` accepts any tile within Chebyshev 1 of goal
   * (tap-to-approach "astar_to_valid_adjacent_tile"). Returns array of [x,y] or null.
   */
  findPath(g, start, goal, { mode = 'WALK', adjacentOk = false, maxNodes = 60000 } = {}) {
    const [sx, sy] = start, [gx, gy] = goal;
    if (!g.inb(sx, sy)) return null;
    const isGoal = (x, y) => (adjacentOk ? Math.max(Math.abs(x - gx), Math.abs(y - gy)) <= 1 && this.terrain.passable(g, x, y, mode) : x === gx && y === gy);
    const W = g.w;
    const open = new MinHeap();
    const gScore = new Map();
    const came = new Map();
    const startKey = sy * W + sx;
    gScore.set(startKey, 0);
    open.push(startKey, this.h(sx, sy, gx, gy));
    let expanded = 0;
    while (open.size) {
      const cur = open.pop();
      const cx = cur % W, cy = (cur / W) | 0;
      if (isGoal(cx, cy)) return this.reconstruct(came, cur, W);
      if (++expanded > maxNodes) return null;
      const cg = gScore.get(cur);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!this.canStep(g, cx, cy, nx, ny, mode)) continue;
        if (dx && dy) { // no diagonal corner cutting
          if (!this.canStep(g, cx, cy, cx + dx, cy, mode) || !this.canStep(g, cx, cy, cx, cy + dy, mode)) continue;
        }
        const step = (dx && dy ? 1.4142 : 1) * (mode === 'WALK' ? this.tileCost(g, nx, ny) : 1);
        const nk = ny * W + nx;
        const ng = cg + step;
        const old = gScore.get(nk);
        if (old === undefined || ng < old) {
          gScore.set(nk, ng); came.set(nk, cur);
          open.push(nk, ng + this.h(nx, ny, gx, gy));
        }
      }
    }
    return null;
  }

  h(x, y, gx, gy) { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return 0.9 * (dx + dy + (1.4142 - 2) * Math.min(dx, dy)); }

  reconstruct(came, cur, W) {
    const path = [[cur % W, (cur / W) | 0]];
    while (came.has(cur)) { cur = came.get(cur); path.push([cur % W, (cur / W) | 0]); }
    return path.reverse();
  }

  /** 4-neighbour reachable set from start (strict connectivity test). Returns Uint8Array mask. */
  floodFill(g, start, mode = 'WALK', { staticOnly = true } = {}) {
    const mask = new Uint8Array(g.w * g.h);
    const q = [start[1] * g.w + start[0]];
    mask[q[0]] = 1;
    const ok = (x0, y0, x, y) => {
      if (!g.inb(x, y)) return false;
      if (staticOnly ? !this.terrain.footWalkableStatic(g, x, y) : !this.terrain.passable(g, x, y, mode)) return false;
      return this.terrain.heightStep(g, x0, y0, x, y) <= 1;
    };
    while (q.length) {
      const i = q.pop(); const x = i % g.w, y = (i / g.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; const ni = ny * g.w + nx;
        if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h || mask[ni]) continue;
        if (ok(x, y, nx, ny)) { mask[ni] = 1; q.push(ni); }
      }
    }
    return mask;
  }

  /** Nearest tile satisfying pred via BFS ring search. */
  nearestTile(g, x, y, pred, maxR = 12) {
    if (pred(x, y)) return [x, y];
    for (let r = 1; r <= maxR; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (pred(x + dx, y + dy)) return [x + dx, y + dy];
      }
    }
    return null;
  }
}

class MinHeap {
  constructor() { this.k = []; this.p = []; }
  get size() { return this.k.length; }
  push(key, pri) {
    const k = this.k, p = this.p; let i = k.length; k.push(key); p.push(pri);
    while (i > 0) { const pa = (i - 1) >> 1; if (p[pa] <= p[i]) break; [k[pa], k[i]] = [k[i], k[pa]]; [p[pa], p[i]] = [p[i], p[pa]]; i = pa; }
  }
  pop() {
    const k = this.k, p = this.p; const top = k[0]; const lk = k.pop(), lp = p.pop();
    if (k.length) {
      k[0] = lk; p[0] = lp; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < k.length && p[l] < p[m]) m = l; if (r < k.length && p[r] < p[m]) m = r;
        if (m === i) break; [k[m], k[i]] = [k[i], k[m]]; [p[m], p[i]] = [p[i], p[m]]; i = m;
      }
    }
    return top;
  }
}
