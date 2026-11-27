// systems/Nav.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { TT } from '../core/Art.js';
import { COLS, TAU, TILE, dist } from '../core/util.js';

/* ========================= Nav / collision =========================
   One shared grid coordinate system for player, enemies, projectiles,
   hazards and camera. Entities are AABBs centred on (x, y) with .half.
   =================================================================== */
export const Nav = (() => {
  let W = null;
  const isSolidT = t => t >= TT.WALL && t <= TT.VENT;
  function setWorld(w) { W = w; }
  function tileAt(c, r) { if (c < 0 || c >= COLS || r < 0 || r >= W.rows) return TT.WALL; return W.tile[r * COLS + c]; }
  function solid(c, r, enemy) { const t = tileAt(c, r); return isSolidT(t) || (enemy && t === TT.SAFE); }
  function blocked(x, y, half, enemy) {
    const c0 = Math.floor((x - half) / TILE), c1 = Math.floor((x + half - 0.001) / TILE);
    const r0 = Math.floor((y - half) / TILE), r1 = Math.floor((y + half - 0.001) / TILE);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solid(c, r, enemy)) return true;
    return false;
  }
  /** Axis-separated swept movement with sub-steps (no tunnelling). Returns {hx, hy} hit flags. */
  function move(e, dx, dy, enemy, cornerAssist) {
    let hx = false, hy = false;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
    const sx = dx / steps, sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      if (sx) {
        const ox = e.x; e.x += sx;
        if (blocked(e.x, e.y, e.half, enemy)) {
          if (sx > 0) { const c = Math.floor((e.x + e.half) / TILE); e.x = Math.max(ox, c * TILE - e.half - 0.01); }
          else { const c = Math.floor((e.x - e.half) / TILE); e.x = Math.min(ox, (c + 1) * TILE + e.half + 0.01); }
          if (blocked(e.x, e.y, e.half, enemy)) e.x = ox;
          hx = true;
          if (cornerAssist && Math.abs(sy) < Math.abs(sx) * 0.5) nudge(e, sx, 0, enemy);
        }
      }
      if (sy) {
        const oy = e.y; e.y += sy;
        if (blocked(e.x, e.y, e.half, enemy)) {
          if (sy > 0) { const r = Math.floor((e.y + e.half) / TILE); e.y = Math.max(oy, r * TILE - e.half - 0.01); }
          else { const r = Math.floor((e.y - e.half) / TILE); e.y = Math.min(oy, (r + 1) * TILE + e.half + 0.01); }
          if (blocked(e.x, e.y, e.half, enemy)) e.y = oy;
          hy = true;
          if (cornerAssist && Math.abs(sx) < Math.abs(sy) * 0.5) nudge(e, 0, sy, enemy);
        }
      }
    }
    if (blocked(e.x, e.y, e.half, enemy)) unstick(e, enemy);
    return { hx, hy };
  }
  /** Corner correction: if blocked by a corner edge, slide around it when nearly aligned with a gap. */
  function nudge(e, sx, sy, enemy) {
    for (let k = 1; k <= 7; k++) for (const s of [1, -1]) {
      const ox = sy ? s * k : 0, oy = sx ? s * k : 0;
      if (!blocked(e.x + ox + sx, e.y + oy + sy, e.half, enemy) && !blocked(e.x + ox, e.y + oy, e.half, enemy)) { e.x += Math.sign(ox) * Math.min(1.2, Math.abs(ox)); e.y += Math.sign(oy) * Math.min(1.2, Math.abs(oy)); return; }
    }
  }
  /** Last-resort: push an entity out of solids to the nearest free spot. */
  function unstick(e, enemy) {
    for (let rad = 2; rad <= 40; rad += 2) for (let a = 0; a < 8; a++) {
      const nx = e.x + Math.cos(a / 8 * TAU) * rad, ny = e.y + Math.sin(a / 8 * TAU) * rad;
      if (!blocked(nx, ny, e.half, enemy)) { e.x = nx; e.y = ny; return; }
    }
  }
  /** Line of sight through the tile grid (walls & furniture block). */
  function los(x0, y0, x1, y1) {
    const d = dist(x0, y0, x1, y1), n = Math.ceil(d / 6);
    for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; if (isSolidT(tileAt(Math.floor(x / TILE), Math.floor(y / TILE)))) return false; }
    return true;
  }
  /** Multi-source BFS distance field over walkable tiles. */
  function bfs(sources, enemy, maxD = 9999, out = null) {
    const n = W.rows * COLS, f = out || new Int16Array(n); f.fill(-1);
    const q = new Int32Array(n); let h = 0, t = 0;
    for (const [c, r] of sources) { if (c < 0 || c >= COLS || r < 0 || r >= W.rows) continue; const i = r * COLS + c; if (f[i] === -1) { f[i] = 0; q[t++] = i; } }
    while (h < t) {
      const i = q[h++], c = i % COLS, r = (i - c) / COLS, d = f[i]; if (d >= maxD) continue;
      if (c > 0 && f[i - 1] === -1 && !solid(c - 1, r, enemy)) { f[i - 1] = d + 1; q[t++] = i - 1; }
      if (c < COLS - 1 && f[i + 1] === -1 && !solid(c + 1, r, enemy)) { f[i + 1] = d + 1; q[t++] = i + 1; }
      if (r > 0 && f[i - COLS] === -1 && !solid(c, r - 1, enemy)) { f[i - COLS] = d + 1; q[t++] = i - COLS; }
      if (r < W.rows - 1 && f[i + COLS] === -1 && !solid(c, r + 1, enemy)) { f[i + COLS] = d + 1; q[t++] = i + COLS; }
    }
    return f;
  }
  /** Direction (unit vector) towards decreasing field value from world pos, 8-neighbour without corner cutting. */
  function flowDir(f, x, y) {
    const c = Math.floor(x / TILE), r = Math.floor(y / TILE), i = r * COLS + c;
    if (c < 0 || c >= COLS || r < 0 || r >= W.rows) return null;
    let best = f[i] >= 0 ? f[i] : 9999, bx = 0, by = 0, found = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nc = c + dx, nr = r + dy; if (nc < 0 || nc >= COLS || nr < 0 || nr >= W.rows) continue;
      const v = f[nr * COLS + nc]; if (v < 0) continue;
      if (dx && dy && (f[r * COLS + nc] < 0 || f[nr * COLS + c] < 0)) continue;
      const vv = v + (dx && dy ? 0.4 : 0);
      if (vv < best) { best = vv; bx = dx; by = dy; found = true; }
    }
    if (!found) return null;
    const tx = (c + bx) * TILE + TILE / 2, ty = (r + by) * TILE + TILE / 2, m = Math.hypot(tx - x, ty - y) || 1;
    return { x: (tx - x) / m, y: (ty - y) / m };
  }
  function fieldAt(f, x, y) { const c = Math.floor(x / TILE), r = Math.floor(y / TILE); if (c < 0 || c >= COLS || r < 0 || r >= W.rows) return -1; return f[r * COLS + c]; }
  return { setWorld, tileAt, solid, blocked, move, los, bfs, flowDir, fieldAt, unstick, isSolidT };
})();
