// systems/MapBuilder.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { Art, TT } from '../core/Art.js';
import { COLS, RNG, TILE, clamp } from '../core/util.js';
import { CONFIG } from '../data/config.js';
import { SEGS } from '../data/segments.js';
import { Nav } from './Nav.js';

/* ========================= Map builder ========================= */
export const MapBuilder = (() => {
  const CHAR = { '#': TT.WALL, C: TT.COUNTER, M: TT.MACHINE, T: TT.TABLE, B: TT.BOX, P: TT.PLANT, V: TT.VENT, s: TT.SPILL, z: TT.SAFE, g: TT.GRATE, D: TT.DROP, K: TT.SAFE, H: TT.SAFE };
  /** Combat-segment variants: A = canonical, B = mirrored columns, C = mirrored rows. First/last rows of every
   *  segment are open floor, so entrance/exit anchors and clearance are identical for all variants. */
  const VARIANT_SAFE = name => !/^(START|END_|CHECK|CUSTOMER|BOSS_)/.test(name);
  function variantRows(rows, v) {
    if (v === 1) return rows.map(r => r.split('').reverse().join(''));
    if (v === 2) return rows.slice().reverse();
    return rows;
  }
  /** Seeded variant choice per segment (0 for tutorial chapters / non-combat segments / when disabled). */
  function chooseVariants(ch, seed) {
    if (seed == null || !CONFIG.routeVariants || ch.n < CONFIG.variantFromChapter) return ch.layout.map(() => 0);
    const rng = RNG((seed ^ 0xA5A5F00D) >>> 0);
    return ch.layout.map(([name, en]) => (en && VARIANT_SAFE(name)) ? Math.floor(rng.next() * 3) : 0);
  }
  /** Build a world for chapter ch. Throws on malformed layout data (caught by validation tests).
   *  opts.variants: explicit per-segment variant array; opts.seed: pick variants from the run seed. */
  function build(ch, opts = {}) {
    const variants = opts.variants || chooseVariants(ch, opts.seed);
    if (opts.seed != null && !opts.variants && variants.some(Boolean)) {
      try { const w = build(ch, { variants }); const v = validateWorld(w); if (v.ok) return w; console.warn('[MapBuilder] variant layout failed validation, using canonical', ch.id, v.errors); }
      catch (e) { console.warn('[MapBuilder] variant build failed, using canonical', ch.id, e.message); }
      return build(ch, { variants: ch.layout.map(() => 0) });
    }
    const lines = [], segs = [];
    ch.layout.forEach(([name, en], i) => {
      const s0 = SEGS[name]; if (!s0) throw new Error('Unknown segment ' + name);
      const s = variantRows(s0, variants[i] || 0);
      const r0 = lines.length; s.forEach(row => { if (row.length !== COLS) throw new Error(`Segment ${name} row width ${row.length}`); lines.push(row); });
      segs.push({ name, idx: i, r0, r1: lines.length, variant: variants[i] || 0, enemies: en.split(/\s+/).filter(Boolean), slots: [], eslots: [], floor: [] });
    });
    const rows = lines.length;
    const w = { ch, rows, h: rows * TILE, tile: new Uint8Array(rows * COLS), flag: new Uint8Array(rows * COLS), ventDir: new Int8Array(rows * COLS), block: new Uint8Array(rows * COLS),
      rowStyle: new Uint8Array(rows), rowSeg: new Int16Array(rows), segs, variants, jets: [], grates: [], carts: [], heals: [], pickup: null, start: null, drop: null, drops: [], checkpoint: null,
      gates: { entry: [], exit: [], entryRow: -1, exitRow: -1 }, arena: null, chunks: new Map() };
    segs.forEach(s => { for (let r = s.r0; r < s.r1; r++) { w.rowSeg[r] = s.idx; w.rowStyle[r] = (s.idx + ch.n) % 3; } });
    const dz = {}; // drop tiles grouped per segment
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
        case 'x': w.gates.exit.push(i); w.gates.exitRow = r; break;
        case 'y': w.gates.entry.push(i); w.gates.entryRow = r; break;
        case 'D': { const z = dz[seg.idx] = dz[seg.idx] || { c0: 99, r0: 1e9, c1: -1, r1: -1, seg: seg.idx }; z.c0 = Math.min(z.c0, c); z.r0 = Math.min(z.r0, r); z.c1 = Math.max(z.c1, c); z.r1 = Math.max(z.r1, r); break; }
      }
      if (w.tile[i] === TT.FLOOR && ch2 !== '@' && ch2 !== 'U' && ch2 !== 'x' && ch2 !== 'y') seg.floor.push({ x: cx, y: cy, c, r });
    }
    const zones = Object.values(dz).sort((a, b) => b.r0 - a.r0); // bottom (first reached) -> top (final customer)
    if (!w.pickup || !w.start || !zones.length) throw new Error('Chapter ' + ch.n + ' missing pickup/start/drop');
    w.drops = zones.map((z, k) => ({ x0: z.c0 * TILE, y0: z.r0 * TILE, x1: (z.c1 + 1) * TILE, y1: (z.r1 + 1) * TILE, cx: (z.c0 + z.c1 + 1) * TILE / 2, cy: (z.r0 + z.r1 + 1) * TILE / 2,
      c0: z.c0, c1: z.c1, r0: z.r0, r1: z.r1, seg: z.seg, idx: k, final: k === zones.length - 1, done: false }));
    w.drop = w.drops[0];
    if (w.gates.entry.length) {
      const aSeg = segs[w.rowSeg[w.gates.entryRow]];
      w.arena = { seg: aSeg.idx, top: (w.gates.exitRow + 1) * TILE, bottom: w.gates.entryRow * TILE, left: 2 * TILE, right: (COLS - 2) * TILE, cx: COLS * TILE / 2 };
    }
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
    // nav fields (computed with all gates open; gates are applied afterwards through w.block)
    w.drops.forEach(d => { const src = []; for (let r = d.r0; r <= d.r1; r++) for (let c = d.c0; c <= d.c1; c++) src.push([c, r]); d.field = Nav.bfs(src, false); });
    w.dropField = w.drops[0].field;
    w.pickField = Nav.bfs([[Math.floor(w.pickup.x / TILE), Math.floor(w.pickup.y / TILE)]], false);
    // route length: pickup -> drop 1 -> ... -> final drop
    let len = Nav.fieldAt(w.drops[0].field, w.pickup.x, w.pickup.y);
    for (let k = 1; k < w.drops.length; k++) len += Nav.fieldAt(w.drops[k].field, w.drops[k - 1].cx, w.drops[k - 1].cy);
    w.pathLen = len;
    w.gates.exit.forEach(i => { w.block[i] = 1; }); // exit gate starts closed
    return w;
  }
  /** Map validation: start->pickup, pickup->each drop in order, checkpoint, arena gates, spawn clearance. */
  function validateWorld(w) {
    const errors = [], at = (f, x, y) => Nav.fieldAt(f, x, y);
    if (!(at(w.pickField, w.start.x, w.start.y) >= 0)) errors.push('pickup unreachable');
    if (!(at(w.drops[0].field, w.pickup.x, w.pickup.y) > 0)) errors.push('drop 1 unreachable');
    for (let k = 1; k < w.drops.length; k++) if (!(at(w.drops[k].field, w.drops[k - 1].cx, w.drops[k - 1].cy) > 0)) errors.push('drop ' + (k + 1) + ' unreachable');
    if (w.checkpoint && !(at(w.drops[w.drops.length - 1].field, w.checkpoint.x, w.checkpoint.y) >= 0)) errors.push('checkpoint unreachable');
    w.segs.forEach(s => { if (s.enemies.length && s.slots.length + s.eslots.length + s.floor.length < s.enemies.length) errors.push('spawn clearance ' + s.name); });
    if (w.arena && !(w.gates.entry.length && w.gates.exit.length)) errors.push('arena gates');
    return { ok: !errors.length, errors };
  }
  /** Lazily render and cache 16-row chunks of the static map. */
  const CH_ROWS = 16;
  function chunk(w, k) { let c = w.chunks.get(k); if (!c) { c = Art.renderChunk(w, k * CH_ROWS, Math.min(w.rows, (k + 1) * CH_ROWS)); w.chunks.set(k, c); } return c; }
  return { build, chunk, CH_ROWS, validateWorld, chooseVariants, variantRows };
})();
