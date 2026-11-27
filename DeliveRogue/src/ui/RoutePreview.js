// ui/RoutePreview.js — real route preview for a chapter: renders the actual built world (tiles, hazards,
// pickup, checkpoint, heal, drop) into a small cached canvas, and pans it from start to drop.
import { MapBuilder } from '../systems/MapBuilder.js';
import { TT } from '../core/Art.js';
import { COLS, TILE } from '../core/util.js';

const TS = 4, cache = new Map(); // px per tile in the preview, cache by chapter id
const COL = { [TT.FLOOR]: '#cfd9e8', [TT.WALL]: '#1c2a44', [TT.COUNTER]: '#7b5a3c', [TT.MACHINE]: '#3a4a66', [TT.TABLE]: '#8a6a44', [TT.BOX]: '#b5824c',
  [TT.PLANT]: '#3f8f4f', [TT.VENT]: '#5d6b82', [TT.SPILL]: '#8a5a2e', [TT.SAFE]: '#7fe3c8', [TT.GRATE]: '#8e99a8', [TT.DROP]: '#6ee06a' };

/** Builds (once) the chapter world and returns { world, img, info }. Must not be called during an active run. */
export function routeData(ch) {
  let d = cache.get(ch.id); if (d) return d;
  const w = MapBuilder.build(ch); // canonical layout (variants are rolled per run seed)
  const c = document.createElement('canvas'); c.width = COLS * TS * 2; c.height = w.rows * TS * 2;
  const g = c.getContext('2d'); g.scale(2, 2);
  for (let r = 0; r < w.rows; r++) for (let k = 0; k < COLS; k++) { g.fillStyle = COL[w.tile[r * COLS + k]] || '#cfd9e8'; g.fillRect(k * TS, r * TS, TS, TS); }
  const dot = (x, y, col, rad = 3.2) => { g.fillStyle = '#14203a'; g.beginPath(); g.arc(x / TILE * TS, y / TILE * TS, rad + 1.2, 0, 6.3); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x / TILE * TS, y / TILE * TS, rad, 0, 6.3); g.fill(); };
  w.jets.forEach(j => { g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(j.x0 / TILE * TS, j.y / TILE * TS - 1, (j.x1 - j.x0) / TILE * TS, 2); });
  w.grates.forEach(q => dot(q.x, q.y, '#e7f6ff', 2.2));
  w.carts.forEach(q => dot(q.x, q.y, '#ffd166', 2.2));
  w.heals.forEach(q => dot(q.x, q.y, '#ef5350'));
  if (w.checkpoint) dot(w.checkpoint.x, w.checkpoint.y, '#5fd3ff', 3.6);
  dot(w.pickup.x, w.pickup.y, '#f2a541', 3.6);
  w.drops.forEach(d => dot(d.cx, d.cy, d.final ? '#6ee06a' : '#5fd3ff', d.final ? 4.2 : 3.4));
  if (w.arena) { g.fillStyle = 'rgba(255,90,60,.35)'; g.fillRect(0, w.arena.top / TILE * TS, COLS * TS, (w.arena.bottom - w.arena.top) / TILE * TS); }
  // enemy pressure: segments with enemies get a red edge mark
  w.segs.forEach(s => { if (s.enemies.length) { g.fillStyle = 'rgba(239,83,80,.85)'; g.fillRect(0, s.r0 * TS, 2, (s.r1 - s.r0) * TS); g.fillRect(COLS * TS - 2, s.r0 * TS, 2, (s.r1 - s.r0) * TS); } });
  let spill = 0; for (let i = 0; i < w.tile.length; i++) if (w.tile[i] === TT.SPILL) spill++;
  const info = { rows: w.rows, segs: w.segs.length, combatSegs: w.segs.filter(s => s.enemies.length).length, jets: w.jets.length, grates: w.grates.length, carts: w.carts.length,
    heals: w.heals.length, checkpoint: !!w.checkpoint, spill, drops: w.drops.length, arena: !!w.arena, risky: w.flag.some(f => f & 1), pathLen: w.pathLen };
  d = { img: c, info, h: w.rows * TS, startY: w.start.y / TILE * TS, dropY: w.drop.cy / TILE * TS };
  cache.set(ch.id, d); return d;
}

/** Draw a vertical window of the route into canvas `cv` (logical w×h), panned by t∈[0,1] start->drop. */
export function drawRoute(cv, d, t) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, s = W / (COLS * TS * 2);
  const viewH = H / s; // in route px*2 space
  const startC = d.startY * 2, dropC = d.dropY * 2;
  const centre = startC + (dropC - startC) * t;
  const y0 = Math.max(0, Math.min(d.img.height - viewH, centre - viewH / 2));
  g.clearRect(0, 0, W, H); g.drawImage(d.img, 0, y0, d.img.width, viewH, 0, 0, W, H);
}
