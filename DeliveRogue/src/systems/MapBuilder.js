// systems/MapBuilder.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { Art, TT } from '../core/Art.js';
import { COLS, TILE, clamp } from '../core/util.js';
import { SEGS } from '../data/segments.js';
import { Nav } from './Nav.js';

/* ========================= Map builder ========================= */
export const MapBuilder = (() => {
  const CHAR = { '#': TT.WALL, C: TT.COUNTER, M: TT.MACHINE, T: TT.TABLE, B: TT.BOX, P: TT.PLANT, V: TT.VENT, s: TT.SPILL, z: TT.SAFE, g: TT.GRATE, D: TT.DROP, K: TT.SAFE, H: TT.SAFE };
  /** Build a world for chapter ch. Throws on malformed layout data (caught by validation tests). */
  function build(ch) {
    const lines = [], segs = [];
    ch.layout.forEach(([name, en], i) => {
      const s = SEGS[name]; if (!s) throw new Error('Unknown segment ' + name);
      const r0 = lines.length; s.forEach(row => { if (row.length !== COLS) throw new Error(`Segment ${name} row width ${row.length}`); lines.push(row); });
      segs.push({ name, idx: i, r0, r1: lines.length, enemies: en.split(/\s+/).filter(Boolean), slots: [], eslots: [], floor: [] });
    });
    const rows = lines.length;
    const w = { ch, rows, h: rows * TILE, tile: new Uint8Array(rows * COLS), flag: new Uint8Array(rows * COLS), ventDir: new Int8Array(rows * COLS),
      rowStyle: new Uint8Array(rows), rowSeg: new Int16Array(rows), segs, jets: [], grates: [], carts: [], heals: [], pickup: null, start: null, drop: null, checkpoint: null, chunks: new Map() };
    segs.forEach(s => { for (let r = s.r0; r < s.r1; r++) { w.rowSeg[r] = s.idx; w.rowStyle[r] = (s.idx + ch.n) % 3; } });
    let dx0 = 1e9, dy0 = 1e9, dx1 = -1, dy1 = -1;
    for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) {
      const ch2 = lines[r][c], i = r * COLS + c, cx = c * TILE + TILE / 2, cy = r * TILE + TILE / 2, seg = segs[w.rowSeg[r]];
      w.tile[i] = CHAR[ch2] !== undefined ? CHAR[ch2] : TT.FLOOR;
      switch (ch2) {
        case 'U': w.pickup = { x: cx, y: cy }; break;
        case '@': w.start = { x: cx, y: cy }; break;
        case 'H': w.heals.push({ x: cx, y: cy, used: false }); break;
        case 'K': w.checkpoint = { x: cx, y: cy, row: r, used: false }; break;
        case 'e': seg.slots.push({ x: cx, y: cy }); break;
        case 'E': seg.eslots.push({ x: cx, y: cy }); break;
        case 'm': w.carts.push({ x: cx, y: cy, row: r }); break;
        case 'r': w.flag[i] |= 1; break;
        case 'q': w.flag[i] |= 2; break;
        case 'g': w.grates.push({ x: cx, y: cy, r: 22 }); break;
        case 'D': dx0 = Math.min(dx0, c); dy0 = Math.min(dy0, r); dx1 = Math.max(dx1, c); dy1 = Math.max(dy1, r); break;
      }
      if (w.tile[i] === TT.FLOOR && ch2 !== '@' && ch2 !== 'U') seg.floor.push({ x: cx, y: cy, c, r });
    }
    if (!w.pickup || !w.start || dx1 < 0) throw new Error('Chapter ' + ch.n + ' missing pickup/start/drop');
    w.drop = { x0: dx0 * TILE, y0: dy0 * TILE, x1: (dx1 + 1) * TILE, y1: (dy1 + 1) * TILE, cx: (dx0 + dx1 + 1) * TILE / 2, cy: (dy0 + dy1 + 1) * TILE / 2, c0: dx0, c1: dx1, r0: dy0, r1: dy1 };
    Nav.setWorld(w);
    // vents -> horizontal steam jets crossing the corridor
    for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) {
      if (w.tile[r * COLS + c] !== TT.VENT) continue;
      const dir = !Nav.isSolidT(Nav.tileAt(c + 1, r)) ? 1 : -1; w.ventDir[r * COLS + c] = dir;
      let e = c + dir; while (!Nav.isSolidT(Nav.tileAt(e, r)) && e >= 0 && e < COLS) e += dir;
      const a = dir > 0 ? (c + 1) * TILE : (e + 1) * TILE, b = dir > 0 ? e * TILE : c * TILE;
      w.jets.push({ x0: a, x1: b, y: r * TILE + TILE / 2, dir, vx: dir > 0 ? (c + 1) * TILE : c * TILE });
    }
    // carts: compute patrol bounds along their row
    w.carts.forEach(k => {
      const c = Math.floor(k.x / TILE); let a = c, b = c;
      while (!Nav.isSolidT(Nav.tileAt(a - 1, k.row))) a--; while (!Nav.isSolidT(Nav.tileAt(b + 1, k.row))) b++;
      k.minX = a * TILE + 21; k.maxX = (b + 1) * TILE - 21; k.x = clamp(k.x, k.minX, k.maxX);
    });
    // nav fields
    const dropSrc = []; for (let r = dy0; r <= dy1; r++) for (let c = dx0; c <= dx1; c++) dropSrc.push([c, r]);
    w.dropField = Nav.bfs(dropSrc, false);
    w.pickField = Nav.bfs([[Math.floor(w.pickup.x / TILE), Math.floor(w.pickup.y / TILE)]], false);
    w.pathLen = Nav.fieldAt(w.dropField, w.pickup.x, w.pickup.y);
    return w;
  }
  /** Lazily render and cache 16-row chunks of the static map. */
  const CH_ROWS = 16;
  function chunk(w, k) { let c = w.chunks.get(k); if (!c) { c = Art.renderChunk(w, k * CH_ROWS, Math.min(w.rows, (k + 1) * CH_ROWS)); w.chunks.set(k, c); } return c; }
  return { build, chunk, CH_ROWS };
})();
