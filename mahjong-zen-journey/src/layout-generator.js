/*
 * Mahjong: Zen Journey — LayoutGenerator (development-time).
 * 20 parametric layout families rasterised onto a half-tile grid with real
 * stacking rules (no same-layer overlap, every raised tile fully supported).
 * The generated, verified levels are embedded into the game as data.
 */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MJCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MJLayout = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';

  const ASPECT = 0.75; // tile width / height
  const TAU = Math.PI * 2;

  function rngTools(rng) {
    return {
      r: rng,
      f: (a, b) => a + (b - a) * rng(),
      i: (a, b) => a + Math.floor(rng() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(rng() * arr.length)],
      chance: (p) => rng() < p
    };
  }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  class Builder {
    constructor(Wt, Ht) {
      this.Wt = Wt; this.Ht = Ht;
      this.maxX = 2 * Wt - 2; this.maxY = 2 * Ht - 2;
      this.RX = Wt * ASPECT / 2; this.RY = Ht / 2;
      this.tiles = [];
      this.cells = new Map();
    }
    ck(cx, cy, z) { return (z * 64 + cy) * 64 + cx; }
    occ(cx, cy, z) { return this.cells.has(this.ck(cx, cy, z)); }
    canPlace(x, y, z) {
      if (x < 0 || y < 0 || x > this.maxX || y > this.maxY || z < 0 || z > Core.GRID.maxZ) return false;
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) {
        if (this.occ(x + dx, y + dy, z)) return false;
        if (z > 0 && !this.occ(x + dx, y + dy, z - 1)) return false;
      }
      return true;
    }
    add(x, y, z) {
      x = Math.round(x); y = Math.round(y);
      if (!this.canPlace(x, y, z)) return false;
      const t = { x, y, z };
      this.tiles.push(t);
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) this.cells.set(this.ck(x + dx, y + dy, z), t);
      return true;
    }
    has(x, y, z) { const t = this.cells.get(this.ck(x, y, z)); return !!t && t.x === x && t.y === y; }
    isTop(t) {
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) if (this.occ(t.x + dx, t.y + dy, t.z + 1)) return false;
      return true;
    }
    removeTile(t) {
      const i = this.tiles.indexOf(t);
      if (i < 0 || !this.isTop(t)) return false;
      this.tiles.splice(i, 1);
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) this.cells.delete(this.ck(t.x + dx, t.y + dy, t.z));
      return true;
    }
    // physical coordinates of a tile centre (tile-height units, origin at board centre)
    X(x) { return (x + 1 - this.Wt) * 0.5 * ASPECT; }
    Y(y) { return (y + 1 - this.Ht) * 0.5; }
    // fn(u, v, X, Y, x, y): u,v normalised to [-1,1] by board half-extent
    fill(z, fn, ox, oy) {
      ox = ox || 0; oy = oy || 0;
      for (let y = oy; y <= this.maxY; y += 2) {
        for (let x = ox; x <= this.maxX; x += 2) {
          const X = this.X(x), Y = this.Y(y);
          if (fn(X / this.RX, Y / this.RY, X, Y, x, y)) this.add(x, y, z);
        }
      }
    }
    // horizontally centred row of w tiles (half offsets appear automatically)
    row(z, y, w, shift) {
      w = Math.min(w, this.Wt);
      const x0 = this.Wt - w + (shift || 0);
      for (let i = 0; i < w; i++) this.add(x0 + 2 * i, y, z);
    }
    stackAll(zFrom, pred) {
      const src = this.tiles.filter(t => t.z === zFrom);
      for (const t of src) if (!pred || pred(t, this.X(t.x) / this.RX, this.Y(t.y) / this.RY)) this.add(t.x, t.y, zFrom + 1);
    }
    centerApex(z) {
      const cx = this.Wt - 1, cy = this.Ht - 1;
      const opts = [[cx, cy], [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1], [cx - 1, cy - 1], [cx + 1, cy + 1]];
      for (const [x, y] of opts) if (this.add(x, y, z)) return true;
      return false;
    }
    count() { return this.tiles.length; }
    maxZ() { let m = 0; for (const t of this.tiles) if (t.z > m) m = t.z; return m; }
  }

  const supE = (a, b, p) => Math.pow(Math.abs(a), p) + Math.pow(Math.abs(b), p);
  function inPoly(px, py, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function rotPt(x, y, a) { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }

  // Each family: build(b, R, P) where P = { L: layer budget, diff, final, s }.
  const FAMILY_BUILDERS = [
    // 0 Classic Turtle
    function turtle(b, R, P) {
      const flank = b.Wt >= 7 && R.chance(0.65);
      const p = R.f(2.2, 5.5);
      const ix = flank ? 1 : 0;
      const bodyU = (b.Wt - 2 * ix) / b.Wt;
      const brick = R.chance(0.45);
      const shrink = R.f(0.2, 0.3);
      b.fill(0, (u, v, X, Y, x) => x >= 2 * ix && x <= b.maxX - 2 * ix && supE(u / bodyU, v, p) <= 1.12);
      for (let z = 1; z < P.L; z++) {
        const k = 1 - z * shrink;
        b.fill(z, (u, v) => supE(u / (bodyU * k), v / k, p) <= 1.05, brick ? z % 2 : 0, 0);
      }
      if (P.L >= 3 && R.chance(0.75)) b.centerApex(P.L);
      if (flank) {
        const yc = b.Ht - 1;
        const ys = R.chance(0.4) && b.Ht >= 8 ? [yc - 2, yc + 2] : [yc];
        for (const y of ys) { b.add(0, y, 0); b.add(b.maxX, y, 0); }
      }
      if (R.chance(0.4)) { b.add(b.Wt - 1, 0, 1); b.add(b.Wt - 1, b.maxY, 1); }
    },
    // 1 Pyramid
    function pyramid(b, R, P) {
      const mode = R.pick(['step', 'nested', 'brick']);
      const cut = R.chance(0.5) ? 1 : 0;
      const hollow = P.diff > 0.25 && R.chance(0.3);
      const W = b.Wt, H = b.Ht;
      b.fill(0, (u, v, X, Y, x, y) => {
        const c = x / 2, r = y / 2;
        if (cut && (c < cut || c >= W - cut) && (r < cut || r >= H - cut)) return false;
        if (hollow && Math.abs(u) < 0.25 && Math.abs(v) < 0.2) return false;
        return true;
      });
      for (let z = 1; z < P.L; z++) {
        if (mode === 'step') b.fill(z, (u, v, X, Y, x, y) => x >= 2 * z && x <= b.maxX - 2 * z && y >= 2 * z && y <= b.maxY - 2 * z);
        else if (mode === 'nested') b.fill(z, (u, v, X, Y, x, y) => x >= z && x <= b.maxX - z && y >= z && y <= b.maxY - z, z % 2, z % 2);
        else b.fill(z, (u, v, X, Y, x, y) => x >= z && x <= b.maxX - z && y >= 2 * z && y <= b.maxY - 2 * z, z % 2, 0);
      }
      if (R.chance(0.5)) b.centerApex(P.L);
    },
    // 2 Butterfly
    function butterfly(b, R, P) {
      const cx = R.f(0.42, 0.56), cy1 = -R.f(0.25, 0.42), cy2 = R.f(0.3, 0.48);
      const ax = R.f(0.4, 0.56), ay1 = R.f(0.3, 0.45), ay2 = R.f(0.22, 0.36);
      const tilt = R.f(-0.5, 0.5);
      const inWing = (u, v, sc) => {
        for (const s of [-1, 1]) {
          let [a, c] = rotPt(u - s * cx, v - cy1, tilt * s);
          if ((a / (ax * sc)) ** 2 + (c / (ay1 * sc)) ** 2 <= 1) return true;
          [a, c] = rotPt(u - s * cx * 0.9, v - cy2, -tilt * s * 0.7);
          if ((a / (ax * 0.85 * sc)) ** 2 + (c / (ay2 * sc)) ** 2 <= 1) return true;
        }
        return false;
      };
      const odd = b.Wt % 2 === 1;
      const bodyLen = R.f(0.55, 0.8);
      const body = (u, v, X, Y, x) => odd && x === b.Wt - 1 && Math.abs(v) < bodyLen;
      b.fill(0, (u, v, X, Y, x, y) => inWing(u, v, 1) || body(u, v, X, Y, x, y));
      for (let z = 1; z < P.L; z++) {
        const sc = 1 - z * R.f(0.3, 0.4);
        b.fill(z, (u, v, X, Y, x, y) => inWing(u, v, sc) || (z <= 2 && body(u, v * 1.4, X, Y, x, y)), 0, R.chance(0.3) ? 1 : 0);
      }
      if (R.chance(0.6) && odd) { b.add(b.Wt - 3, 0, 0); b.add(b.Wt + 1, 0, 0); }
    },
    // 3 Pagoda
    function pagoda(b, R, P) {
      const tiers = R.i(2, 4);
      const W = b.Wt, H = b.Ht;
      const widths = new Array(H).fill(0);
      const spire = R.i(1, 2);
      const tierH = Math.max(2, Math.floor((H - spire) / tiers));
      for (let r = 0; r < H; r++) {
        if (r < spire) { widths[r] = 1; continue; }
        const t = Math.min(tiers - 1, Math.floor((r - spire) / tierH));
        const inTier = (r - spire) - t * tierH;
        const wmax = Math.round(3 + (W - 3) * (t + 1) / tiers);
        widths[r] = inTier === 0 ? wmax : Math.max(1, wmax - 2 - (R.chance(0.3) ? 1 : 0));
      }
      widths[H - 1] = W;
      for (let r = 0; r < H; r++) b.row(0, 2 * r, widths[r]);
      for (let z = 1; z < P.L; z++) {
        for (let r = 0; r < H; r++) {
          const w = widths[r] - 2 * z + (R.chance(0.25) ? 1 : 0);
          if (w > 0) b.row(z, 2 * r, w);
        }
      }
      if (R.chance(0.5)) for (let r = 0; r < H; r++) b.add(W - 1, 2 * r, P.L);
    },
    // 4 Twin Towers
    function twinTowers(b, R, P) {
      const W = b.Wt, H = b.Ht;
      const tw = W >= 7 ? R.i(2, 3) : 2;
      const g0 = W - 2 * tw >= 3 && R.chance(0.5) ? 1 : 0;
      const top = R.i(0, 1);
      const towerCol = (c) => (c >= g0 && c < g0 + tw) || (c >= W - g0 - tw && c < W - g0);
      const bridges = new Set();
      const nb = R.i(1, 3);
      for (let k = 0; k < nb; k++) bridges.add(R.i(top + 1, H - 1));
      const baseRow = R.chance(0.6);
      b.fill(0, (u, v, X, Y, x, y) => {
        const c = x / 2, r = y / 2;
        if (r < top) return false;
        if (towerCol(c)) return true;
        if (bridges.has(r)) return true;
        return baseRow && r === H - 1;
      });
      for (let z = 1; z < P.L; z++) {
        const cut = top + z * R.i(0, 1);
        b.fill(z, (u, v, X, Y, x, y) => {
          const c = x / 2, r = y / 2;
          if (r < cut || r > H - 1 - z) return false;
          if (tw === 3 && z >= 2) return c === g0 + 1 || c === W - g0 - 2;
          return towerCol(c);
        });
      }
      if (R.chance(0.6)) {
        const l = b.tiles.filter(t => t.z === P.L - 1 && t.x / 2 < W / 2);
        if (l.length) { const t = l[0]; b.add(t.x + 1, t.y, P.L); b.add(b.maxX - t.x - 1, t.y, P.L); }
      }
    },
    // 5 Spiral
    function spiral(b, R, P) {
      const W = b.Wt, H = b.Ht;
      const grid = [];
      for (let r = 0; r < H; r++) grid.push(new Array(W).fill(false));
      let top = 0, left = 0, bottom = H - 1, right = W - 1;
      const path = [];
      const mark = (c, r) => { if (r >= 0 && r < H && c >= 0 && c < W && !grid[r][c]) { grid[r][c] = true; path.push([c, r]); } };
      while (left <= right && top <= bottom) {
        for (let c = left; c <= right; c++) mark(c, top);
        for (let r = top + 1; r <= bottom; r++) mark(right, r);
        if (bottom > top) for (let c = right - 1; c >= left; c--) mark(c, bottom);
        if (right > left) for (let r = bottom - 1; r >= top + 2; r--) mark(left, r);
        if (left + 1 <= right - 2) mark(left + 1, top + 2);
        top += 2; left += 2; bottom -= 2; right -= 2;
      }
      const flip = R.chance(0.5), vflip = R.chance(0.5);
      const pos = path.map(([c, r]) => [flip ? W - 1 - c : c, vflip ? H - 1 - r : r]);
      for (const [c, r] of pos) b.add(2 * c, 2 * r, 0);
      const segStart = R.f(0.3, 0.6);
      for (let z = 1; z < P.L; z++) {
        const from = Math.floor(pos.length * Math.min(0.92, segStart + z * 0.12));
        for (let k = from; k < pos.length; k++) b.add(2 * pos[k][0], 2 * pos[k][1], z);
      }
      if (R.chance(0.6)) {
        const corners = [0, W - 1].flatMap(c => [0, H - 1].map(r => [c, r]));
        for (const [c, r] of corners) b.add(2 * c, 2 * r, 1);
      }
    },
    // 6 Diamond
    function diamond(b, R, P) {
      const W = b.Wt, H = b.Ht;
      const q = R.f(0.8, 1.6);
      const minW = R.i(1, 2);
      const hollow = P.diff > 0.3 && R.chance(0.35);
      const widths = [];
      for (let r = 0; r < H; r++) {
        const v = Math.abs((2 * r + 1 - H) / H);
        widths.push(Math.max(minW, Math.round(minW + (W - minW) * (1 - Math.pow(v, q)))));
      }
      for (let r = 0; r < H; r++) {
        if (hollow && widths[r] >= 5 && Math.abs(2 * r + 1 - H) < H * 0.35) {
          const w = widths[r], x0 = W - w;
          for (let i = 0; i < w; i++) if (i < 2 || i >= w - 2) b.add(x0 + 2 * i, 2 * r, 0);
        } else b.row(0, 2 * r, widths[r]);
      }
      const brick = R.chance(0.5);
      for (let z = 1; z < P.L; z++) {
        for (let r = 0; r < H; r++) {
          const w = widths[r] - (brick ? z : 2 * z);
          if (w > 0) b.row(z, 2 * r, w);
        }
      }
      if (R.chance(0.5)) b.centerApex(P.L);
    },
    // 7 Bridge
    function bridge(b, R, P) {
      const W = b.Wt, H = b.Ht;
      const vertical = R.chance(0.4);
      if (!vertical) {
        const pw = R.i(1, 2);
        const deck = R.i(Math.floor(H * 0.3), Math.floor(H * 0.55));
        const deckRows = R.i(1, 2);
        const banks = R.chance(0.6);
        b.fill(0, (u, v, X, Y, x, y) => {
          const c = x / 2, r = y / 2;
          if (r >= deck && r < deck + deckRows) return true;
          if ((c < pw || c >= W - pw) && r >= deck - (banks ? 2 : 0)) return true;
          if (banks && r >= H - 2 && (c < pw + 1 || c >= W - pw - 1)) return true;
          if (r === H - 1 && R.chance(0.15)) return true;
          return false;
        });
        for (let z = 1; z < P.L; z++) {
          b.fill(z, (u, v, X, Y, x, y) => {
            const r = y / 2;
            if (r >= deck && r < deck + deckRows) return Math.abs(u) < 1 - z * 0.22 && Math.abs(u) > (z === 1 ? 0 : 0.1 * z);
            return Math.abs(u) > 1 - pw * 2 / W - 0.01 && r >= deck - 2 + z && r < H - z;
          });
        }
      } else {
        const bw = R.i(2, 3);
        const land = R.i(2, 3);
        b.fill(0, (u, v, X, Y, x, y) => {
          const c = x / 2, r = y / 2;
          if (r < land || r >= H - land) return Math.abs(u) < R.f(0.7, 1.0) || r === 0 || r === H - 1;
          return c >= Math.floor((W - bw) / 2) && c < Math.floor((W - bw) / 2) + bw;
        });
        for (let z = 1; z < P.L; z++) {
          b.fill(z, (u, v, X, Y, x, y) => {
            const r = y / 2;
            if (r < land || r >= H - land) return Math.abs(u) < 0.75 - z * 0.2;
            return Math.abs(v) < 0.6 - z * 0.15;
          }, R.chance(0.3) ? 1 : 0, 0);
        }
      }
    },
    // 8 Lotus
    function lotus(b, R, P) {
      const k = R.pick([4, 5, 6, 8]);
      const depth = R.f(0.25, 0.5);
      const rot = R.f(0, TAU / k);
      const pw = R.f(1, 3);
      const rose = (u, v, scale, rr) => {
        const rho = Math.hypot(u, v);
        const th = Math.atan2(v, u);
        const r = 1 - depth * (1 - Math.pow(Math.abs(Math.cos(k * (th - rr) / 2)), pw));
        return rho <= r * scale;
      };
      b.fill(0, (u, v) => rose(u, v, 1.04, rot));
      for (let z = 1; z < P.L; z++) {
        const sc = 1 - z * R.f(0.22, 0.3);
        b.fill(z, (u, v) => rose(u, v, sc, rot + (z % 2) * Math.PI / k), R.chance(0.3) ? 1 : 0, R.chance(0.3) ? 1 : 0);
      }
      b.centerApex(P.L);
    },
    // 9 Temple
    function temple(b, R, P) {
      const W = b.Wt, H = b.Ht;
      const roofRows = R.i(2, 3);
      const baseRows = R.i(1, 2);
      const pillarEvery = R.pick([2, 2, 3]);
      const off = R.i(0, 1);
      for (let r = 0; r < roofRows; r++) b.row(0, 2 * r, Math.max(1, W - 2 * (roofRows - 1 - r) - (R.chance(0.3) ? 1 : 0)));
      for (let r = roofRows; r < H - baseRows; r++) {
        for (let c = 0; c < W; c++) {
          const m = Math.min(c, W - 1 - c);
          if ((m + off) % pillarEvery === 0) b.add(2 * c, 2 * r, 0);
        }
      }
      for (let r = H - baseRows; r < H; r++) b.row(0, 2 * r, W);
      for (let z = 1; z < P.L; z++) {
        for (let r = 0; r < roofRows; r++) b.row(z, 2 * r, W - 2 * (roofRows - 1 - r) - 2 * z);
        for (let r = H - baseRows; r < H; r++) b.row(z, 2 * r, W - 2 * z - (R.chance(0.5) ? 1 : 0));
        if (z === 1 && R.chance(0.5)) for (let r = roofRows; r < H - baseRows; r++) { b.add(0, 2 * r, 1); b.add(b.maxX, 2 * r, 1); }
      }
      if (R.chance(0.6)) b.add(W - 1, 0, P.L);
    },
    // 10 Mountain
    function mountain(b, R, P) {
      const peaks = [];
      const np = R.i(1, 3);
      for (let k = 0; k < np; k++) {
        peaks.push({ u: R.f(-0.6, 0.6), v: R.f(-0.5, 0.4), h: R.f(P.L * 0.7, P.L + 0.6), s: R.f(2.2, 4.0) });
      }
      const foot = R.f(0.0, 0.45);
      const ridge = R.f(-0.2, 0.3);
      const height = (u, v) => {
        let h = v > ridge ? 1 : 0;
        for (const p of peaks) h = Math.max(h, p.h - Math.hypot((u - p.u) * 1.1, v - p.v) * p.s * 1.2 + foot);
        return h;
      };
      for (let z = 0; z <= Math.min(Core.GRID.maxZ, P.L); z++) b.fill(z, (u, v) => height(u, v) >= z + 0.5 && z < P.L + 1);
    },
    // 11 Crescent
    function crescent(b, R, P) {
      const ang = R.f(0, TAU);
      const d = R.f(0.3, 0.55), ri = R.f(0.55, 0.85);
      const dx = Math.cos(ang) * d, dy = Math.sin(ang) * d;
      const inC = (u, v, grow) => Math.hypot(u, v) <= 1.06 - grow * 0.1 && Math.hypot(u - dx, v - dy) >= ri + grow * 0.1;
      b.fill(0, (u, v) => inC(u, v, 0));
      for (let z = 1; z < P.L; z++) b.fill(z, (u, v) => inC(u, v, z), R.chance(0.3) ? 1 : 0, 0);
      const stars = R.i(0, 2);
      for (let s = 0; s < stars; s++) {
        const su = dx * R.f(0.9, 1.2), sv = dy * R.f(0.9, 1.2);
        const x = Math.round((su * b.RX / ASPECT * 2) + b.Wt - 1), y = Math.round(sv * b.RY * 2 + b.Ht - 1);
        if (b.add(x, y, 0) && R.chance(0.5)) b.add(x, y, 1);
      }
    },
    // 12 Cross
    function cross(b, R, P) {
      const kind = R.pick(['greek', 'latin', 'saltire', 'double']);
      const tx = R.f(0.18, 0.36), ty = R.f(0.12, 0.26);
      const barV = kind === 'latin' ? R.f(-0.45, -0.2) : 0;
      const inX = (u, v, s) => {
        if (kind === 'saltire') return Math.abs(Math.abs(u) - Math.abs(v)) < tx * 1.2 * s;
        if (kind === 'double') return Math.abs(u) < tx * s || Math.abs(v + 0.4) < ty * s || Math.abs(v - 0.35) < ty * s;
        return Math.abs(u) < tx * s || Math.abs(v - barV) < ty * s;
      };
      b.fill(0, (u, v) => inX(u, v, 1));
      for (let z = 1; z < P.L; z++) {
        const lim = 1 - z * R.f(0.18, 0.3);
        b.fill(z, (u, v) => inX(u, v, 1) && Math.abs(u) < lim && Math.abs(v) < lim);
      }
      if (R.chance(0.6)) {
        const ends = b.tiles.filter(t => t.z === 0 && b.isTop(t) && (t.x === 0 || t.x === b.maxX || t.y === 0 || t.y === b.maxY));
        for (const t of ends) if (R.chance(0.5)) b.add(t.x, t.y, 1);
      }
      b.centerApex(P.L);
    },
    // 13 Hourglass
    function hourglass(b, R, P) {
      const W = b.Wt, H = b.Ht;
      const waist = R.i(1, 2);
      const q = R.f(0.9, 1.6);
      const frame = W >= 7 && R.chance(0.5);
      const inner = frame ? W - 2 : W;
      const widths = [];
      for (let r = 0; r < H; r++) {
        const v = Math.abs((2 * r + 1 - H) / H);
        widths.push(Math.max(waist, Math.round(waist + (inner - waist) * Math.pow(v, q))));
      }
      widths[0] = W; widths[H - 1] = W;
      for (let r = 0; r < H; r++) b.row(0, 2 * r, widths[r]);
      if (frame) for (let r = 1; r < H - 1; r++) { b.add(0, 2 * r, 0); b.add(b.maxX, 2 * r, 0); }
      const sand = R.f(0.3, 0.7);
      for (let z = 1; z < P.L; z++) {
        for (let r = 0; r < H; r++) {
          const v = (2 * r + 1 - H) / H;
          let w = widths[r] - 2 * z;
          if (v < 0 && -v < sand * 0.6) w -= 2;
          if (v > 0 && v > 1 - sand) w += 1;
          if (r === 0 || r === H - 1) w = W - 2 * z;
          if (w > 0) b.row(z, 2 * r, w);
        }
      }
    },
    // 14 Dragon
    function dragon(b, R, P) {
      const A = R.f(0.2, 0.5) * b.RX;
      const om = R.f(1.0, 2.2) / b.RY * Math.PI / 2;
      const ph = R.f(0, TAU);
      const th = R.f(0.8, 1.3) * ASPECT;
      const headTop = R.chance(0.5);
      const headV = headTop ? -0.68 : 0.68;
      const headR = R.f(0.26, 0.38);
      const center = (Y) => A * Math.sin(om * Y + ph);
      const headU = center(headV * b.RY) / b.RX;
      // large boards get twin intertwined dragons
      const twin = P.target > 66 ? R.chance(0.85) : R.chance(0.15);
      const body = (u, v, X, Y, s) => {
        const taper = headTop ? (v + 1) / 2 : (1 - v) / 2; // 0 at head, 1 at tail
        const w = th * s * (1.1 - 0.35 * taper);
        return Math.abs(X - center(Y)) <= w || (twin && Math.abs(X + center(Y)) <= w * 0.85);
      };
      const head = (u, v, s) => Math.hypot((u - headU) * b.RX / b.RY, v - headV) <= headR * s;
      b.fill(0, (u, v, X, Y) => body(u, v, X, Y, 1) || head(u, v, 1.2));
      const spineOff = R.chance(0.4) ? 1 : 0;
      for (let z = 1; z < P.L; z++) {
        b.fill(z, (u, v, X, Y) => head(u, v, 1.2 - z * 0.25) || (z <= 3 && body(u, v, X, Y, 0.75 - z * 0.14)), z === 1 ? spineOff : 0, 0);
      }
      b.fill(P.L, (u, v) => head(u, v, 0.45), 1, 1);
    },
    // 15 Fortress
    function fortress(b, R, P) {
      const W = b.Wt, H = b.Ht;
      const gate = R.chance(0.6);
      const ts = W >= 7 && R.chance(0.6) ? 2 : 1;
      const kw = R.i(1, Math.max(1, W - 4)), kh = R.i(2, Math.max(2, H - 4));
      const kx0 = W - kw, ky0 = H - kh;
      const ring = R.chance(0.5) ? 1 : 0;
      b.fill(0, (u, v, X, Y, x, y) => {
        const c = x / 2, r = y / 2;
        const edge = c === 0 || c === W - 1 || r === 0 || r === H - 1;
        if (edge) return !(gate && r === H - 1 && Math.abs(2 * c + 1 - W) <= 1);
        if (c < ts || c >= W - ts) { if (r < ts || r >= H - ts) return true; }
        if (x >= kx0 && x < kx0 + 2 * kw && y >= ky0 && y < ky0 + 2 * kh) return true;
        if (ring && (c === 2 || c === W - 3) && r > 1 && r < H - 2 && W >= 7) return R.chance(0.6);
        return false;
      });
      const towers = (x, y) => (x < 2 * ts || x > b.maxX - 2 * ts) && (y < 2 * ts || y > b.maxY - 2 * ts);
      for (let z = 1; z < P.L; z++) {
        b.fill(z, (u, v, X, Y, x, y) => towers(x, y) || (x >= kx0 + z - 1 && x < kx0 + 2 * kw - z + 1 && y >= ky0 + z - 1 && y < ky0 + 2 * kh - z + 1), 0, 0);
      }
      if (R.chance(0.5)) b.centerApex(P.L);
    },
    // 16 Wave
    function wave(b, R, P) {
      const W = b.Wt, H = b.Ht;
      const bands = R.i(2, Math.max(2, Math.min(4, Math.floor(H / 2.5))));
      const amp = R.f(0.6, 1.6);
      const om = R.f(0.5, 1.2);
      const thick = R.i(1, 2);
      const ph = R.f(0, TAU);
      const cols = [];
      for (let k = 0; k < bands; k++) {
        const base = (k + 0.5) * (2 * H - 2 - thick * 2 + 2) / bands;
        for (let c = 0; c < W; c++) {
          const y = Math.round(base - 1 + amp * Math.sin(om * c + ph + k * R.f(0.4, 1.2)));
          for (let t = 0; t < thick; t++) {
            const yy = clamp(y + 2 * t, 0, b.maxY);
            if (b.add(2 * c, yy, 0)) cols.push([c, yy, Math.sin(om * c + ph + k)]);
          }
        }
      }
      for (let z = 1; z < P.L; z++) {
        for (const [c, y, s] of cols) if (s > -0.2 + z * 0.35) b.add(2 * c, y, z);
      }
    },
    // 17 Four Islands
    function fourIslands(b, R, P) {
      const sym = R.chance(0.6);
      const au = R.f(0.45, 0.6), av = R.f(0.42, 0.58);
      const isl = [];
      for (const su of [-1, 1]) for (const sv of [-1, 1]) {
        isl.push({ u: su * au, v: sv * av, r: sym ? 0.42 : R.f(0.32, 0.5), h: sym ? P.L : R.i(Math.max(1, P.L - 1), P.L + 1), sq: R.chance(0.4) });
      }
      const center = R.chance(0.5);
      const dist = (I, u, v) => (I.sq ? Math.max(Math.abs(u - I.u), Math.abs(v - I.v) * 1.1) : Math.hypot(u - I.u, (v - I.v) * 1.1));
      b.fill(0, (u, v) => isl.some(I => dist(I, u, v) <= I.r) || (center && Math.hypot(u, v) < 0.18));
      for (let z = 1; z <= P.L; z++) {
        b.fill(z, (u, v) => isl.some(I => z < I.h && dist(I, u, v) <= I.r * (1 - z * 0.3)), R.chance(0.25) ? 1 : 0, 0);
      }
      if (R.chance(0.4)) b.fill(0, (u, v) => Math.abs(v) < 0.08 && Math.abs(u) < 0.9);
    },
    // 18 Star
    function star(b, R, P) {
      const k = R.pick([4, 5, 6, 8]);
      const ri = R.f(0.45, 0.66);
      const rot = R.f(0, TAU / k) - Math.PI / 2;
      const pts = (s) => {
        const out = [];
        for (let i = 0; i < 2 * k; i++) {
          const r = (i % 2 === 0 ? 1.12 : ri) * s;
          const a = rot + i * Math.PI / k;
          out.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
        return out;
      };
      const p0 = pts(1);
      b.fill(0, (u, v) => inPoly(u, v, p0));
      for (let z = 1; z < P.L; z++) {
        const p = pts(1 - z * R.f(0.16, 0.24));
        b.fill(z, (u, v) => inPoly(u, v, p), R.chance(0.3) ? 1 : 0, 0);
      }
      b.centerApex(P.L);
    },
    // 19 Grand Palace
    function grandPalace(b, R, P) {
      const W = b.Wt, H = b.Ht;
      const hallW = R.i(3, Math.max(3, W - 4)), hallH = R.i(3, Math.max(3, H - 4));
      const hx0 = W - hallW, hy0 = R.i(2, Math.max(2, 2 * H - 2 * hallH - 2));
      const wingW = Math.max(1, Math.floor((W - hallW) / 2));
      const wingTop = R.i(2, 4) * 2, wingBot = b.maxY - R.i(0, 2) * 2;
      const towers = R.chance(0.7);
      const stairs = R.chance(0.6);
      b.fill(0, (u, v, X, Y, x, y) => {
        const c = x / 2;
        if (x >= hx0 && x < hx0 + 2 * hallW && y >= hy0 && y < hy0 + 2 * hallH) return true;
        if ((c < wingW || c >= W - wingW) && y >= wingTop && y <= wingBot) return true;
        if (towers && (c < 1 || c >= W - 1) && y <= 2) return true;
        if (stairs && y > hy0 + 2 * hallH - 2 && Math.abs(2 * c + 1 - W) <= 1) return true;
        if (y === b.maxY && R.chance(0.5)) return true;
        return false;
      });
      for (let z = 1; z < P.L; z++) {
        b.fill(z, (u, v, X, Y, x, y) => {
          const c = x / 2;
          if (x >= hx0 + z - 1 && x < hx0 + 2 * hallW - z + 1 && y >= hy0 + z - 1 && y < hy0 + 2 * hallH - z + 1) return true;
          if (z <= 2 && (c < wingW || c >= W - wingW) && y >= wingTop + 2 * z && y <= wingBot - 2 * z) return true;
          if (towers && z <= 3 && (c < 1 || c >= W - 1) && y <= 2) return true;
          return false;
        }, (hx0 + 1) % 2 === 0 ? 0 : 0, 0);
      }
      b.centerApex(P.L);
    }
  ];

  // --------------------------------------------------------------- level planning
  function familyFor(n) {
    const m = Core.levelMeta(n);
    if (n <= 5) return [1, 6, 12, 17, 0][n - 1];
    if (m.isFinal) return m.world === Core.WORLD_COUNT - 1 ? 14 : [0, 19, 14, 15, 3, 9, 8, 18, 2, 10][m.world % 10]; // the journey ends on a Dragon
    return (m.index + m.world * 7) % 20;
  }

  function targetWindow(n, rng) {
    const { lo, hi, seg } = Core.tileRange(n);
    const m = Core.levelMeta(n);
    if (n <= 5) { const t = [24, 24, 26, 28, 30][n - 1]; return { lo: t, hi: t + 2, target: t }; }
    if (m.isFinal) return { lo: Math.max(lo, hi - 8), hi, target: hi - 2 };
    const segT = (n - seg[0]) / Math.max(1, seg[1] - seg[0]);
    const worldT = m.index / (Core.WORLD_SIZE - 1);
    let t = lo + (hi - lo) * (0.55 * segT + 0.35 * worldT + 0.1 * rng());
    t = clamp(Math.round(t / 2) * 2, lo, hi);
    return { lo: Math.max(lo, t - 6), hi: Math.min(hi, t + 6), target: t };
  }

  function layerBudget(n, R) {
    const m = Core.levelMeta(n);
    const d = (n - 1) / (Core.LEVEL_COUNT - 1);
    if (n <= 2) return 1;
    if (n <= 5) return 2;
    let L = 2 + Math.round(d * 2.6 + R.f(-0.6, 0.6));
    if (m.isFinal) L += 1;
    return clamp(L, 2, 5);
  }

  // Remove top tiles (mirrored pairs first) until the count fits.
  function trimTo(b, hi, R) {
    let guard = 0;
    while (b.count() > hi && guard++ < 200) {
      const tops = b.tiles.filter(t => b.isTop(t));
      if (!tops.length) break;
      const mz = Math.max(...tops.map(t => t.z));
      const cand = tops.filter(t => t.z === mz);
      const t = R.pick(cand);
      const mx = b.maxX - t.x;
      const mirror = mx !== t.x ? b.tiles.find(o => o.x === mx && o.y === t.y && o.z === t.z) : null;
      b.removeTile(t);
      if (mirror && b.count() > hi && b.isTop(mirror)) b.removeTile(mirror);
    }
  }
  function fixParity(b, R) {
    if (b.count() % 2 === 0) return;
    const axis = b.Wt - 1;
    const tops = b.tiles.filter(t => b.isTop(t) && t.x === axis);
    if (tops.length) { tops.sort((p, q) => q.z - p.z); b.removeTile(tops[0]); return; }
    for (let z = b.maxZ() + 1; z >= 0; z--) for (let y = 0; y <= b.maxY; y++) if (b.add(axis, y, z)) return;
    const any = b.tiles.filter(t => b.isTop(t));
    if (any.length) b.removeTile(R.pick(any));
  }

  function setSimilarity(A, B) {
    // Jaccard similarity of two tile sets aligned at their top-left corners
    let inter = 0;
    for (const k of A) if (B.has(k)) inter++;
    return inter / (A.size + B.size - inter);
  }
  function alignedSet(tiles) {
    const bd = Core.layoutBounds(tiles);
    return new Set(tiles.map(t => ((t.z * 64 + t.y - bd.minY) * 64) + t.x - bd.minX));
  }

  function generateLayout(n, ctx) {
    const seed = Core.levelSeed(n);
    const rng = Core.mulberry32(seed);
    const R = rngTools(rng);
    const fam = familyFor(n);
    const win = targetWindow(n, rng);
    const m = Core.levelMeta(n);
    const diff = (n - 1) / (Core.LEVEL_COUNT - 1);
    let L = layerBudget(n, R);
    let s = clamp((win.target - 20) / 80, 0.05, 0.95);
    for (let attempt = 0; attempt < 3000; attempt++) {
      const sj = clamp(s + R.f(-0.08, 0.08), 0, 1);
      let Wt = clamp(Math.round(4 + sj * 5 + R.f(-0.6, 0.6)), 4, Core.GRID.maxCols);
      let Ht = clamp(Math.round(5 + sj * 5 + R.f(-0.6, 0.6)), 5, Core.GRID.maxRows);
      if (n <= 5) { Wt = clamp(Wt, 4, 7); Ht = clamp(Ht, 5, 8); }
      if (fam === 2 && Wt % 2 === 0) Wt = Wt === Core.GRID.maxCols ? Wt - 1 : Wt + 1;
      const b = new Builder(Wt, Ht);
      const P = { L, diff, final: m.isFinal, s: sj, target: win.target };
      FAMILY_BUILDERS[fam](b, R, P);
      const c0 = b.count();
      const why = (k) => { ctx.reasons = ctx.reasons || {}; ctx.reasons[k] = (ctx.reasons[k] || 0) + 1; };
      if (c0 < win.lo) {
        why('small');
        s = Math.min(1, s + 0.04 + R.f(0, 0.04));
        if (s >= 1 && R.chance(0.3) && L < 6) L++;
        continue;
      }
      if (c0 > win.hi * 1.3 + 4) {
        why('large');
        s = Math.max(0, s - 0.04 - R.f(0, 0.04));
        if (s <= 0 && R.chance(0.3) && L > 1) L--;
        continue;
      }
      trimTo(b, win.hi, R);
      fixParity(b, R);
      const c = b.count();
      if (c < win.lo || c > win.hi || c % 2) { why('trim'); continue; }
      if (b.maxZ() > Core.GRID.maxZ) { why('tall'); continue; }
      if (n > 5 && b.maxZ() < 1) { why('flat'); continue; }
      // geometry must use the half-unit grid inside limits
      const tiles = b.tiles.map(t => ({ x: t.x, y: t.y, z: t.z }));
      const bd = Core.layoutBounds(tiles);
      if (bd.spanX > 2 * Core.GRID.maxCols || bd.spanY > 2 * Core.GRID.maxRows) { why('bounds'); continue; }
      // normalise to origin
      for (const t of tiles) { t.x -= bd.minX; t.y -= bd.minY; }
      const sig = Core.layoutSignature(tiles);
      if (ctx.signatures.has(sig.canonical)) { why('dup'); continue; }
      const aset = alignedSet(tiles);
      let tooSimilar = false;
      for (const prev of ctx.sets) { if (setSimilarity(aset, prev) > ctx.maxSimilarity) { tooSimilar = true; break; } }
      if (tooSimilar) { why('similar'); continue; }
      const geom = Core.buildGeometry(tiles);
      if (geom.overlaps.length || Core.checkSupport(tiles).length) { why('rules'); continue; }
      // later levels must keep fewer tiles open at the start
      const freeFrac = new Core.BoardState(geom, null).freeList().length / tiles.length;
      const maxFree = n <= 25 ? 1 : 0.62 - 0.2 * diff;
      if (freeFrac > maxFree) { why('open'); continue; }
      const order = Core.findRemovalOrder(geom, null, rng, { restarts: 40, budget: 6000 });
      if (!order) { ctx.rejectedUnsolvable++; why('unsolvable'); continue; }
      ctx.signatures.add(sig.canonical);
      ctx.sets.push(aset);
      return { n, family: fam, tiles, order, attempts: attempt + 1, layers: bd.layers, hash: sig.hash, rng };
    }
    throw new Error('Could not generate level ' + n + ' (family ' + Core.FAMILIES[fam] + ') ' + JSON.stringify(ctx.reasons) + ' window ' + JSON.stringify(win) + ' L=' + L);
  }

  return { ASPECT, Builder, FAMILY_BUILDERS, familyFor, targetWindow, layerBudget, generateLayout, setSimilarity, alignedSet };
}));
