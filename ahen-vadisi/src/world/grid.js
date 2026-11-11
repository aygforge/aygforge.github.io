// Izgara yardımcıları: çarpışmalı hareket, görüş hattı (duvar arkasından saldırı yok) ve sınırlı A* yol bulma.
import { TILE } from '../data/constants.js';

export class Grid {
  constructor(built) {
    this.w = built.w; this.h = built.h;
    this.solid = new Uint8Array(built.solid);      // hareket
    this.sight = new Uint8Array(built.sight || built.solid); // görüş (su görüşü kesmez)
    this.dyn = new Uint8Array(this.w * this.h);    // dinamik engeller (dungeon kapıları)
  }
  blocked(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return true;
    const i = ty * this.w + tx;
    return this.solid[i] === 1 || this.dyn[i] === 1;
  }
  opaque(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return true;
    const i = ty * this.w + tx;
    return this.sight[i] === 1 || this.dyn[i] === 1;
  }
  blockedAt(px, py) { return this.blocked(Math.floor(px / TILE), Math.floor(py / TILE)); }

  // Dünya pikseli dikdörtgeni (ayak kutusu) serbest mi?
  boxFree(x, y, r) {
    const rx = r, ry = r * 0.6;
    const x0 = Math.floor((x - rx) / TILE), x1 = Math.floor((x + rx) / TILE);
    const y0 = Math.floor((y - ry) / TILE), y1 = Math.floor((y + ry) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.blocked(tx, ty)) return false;
    return true;
  }

  // Eksen ayrık kayma ile hareket
  move(ent, dx, dy) {
    const r = ent.radius;
    let moved = false;
    if (dx) {
      if (this.boxFree(ent.x + dx, ent.y, r)) { ent.x += dx; moved = true; }
      else {
        // köşeye takılmayı önle: küçük dikey kaydırma
        for (const s of [3, -3, 6, -6]) {
          if (this.boxFree(ent.x + dx, ent.y + s, r) && this.boxFree(ent.x, ent.y + s, r)) { ent.y += s * 0.5; break; }
        }
      }
    }
    if (dy) {
      if (this.boxFree(ent.x, ent.y + dy, r)) { ent.y += dy; moved = true; }
      else {
        for (const s of [3, -3, 6, -6]) {
          if (this.boxFree(ent.x + s, ent.y + dy, r) && this.boxFree(ent.x + s, ent.y, r)) { ent.x += s * 0.5; break; }
        }
      }
    }
    return moved;
  }

  // Görüş hattı (tile supercover)
  los(ax, ay, bx, by) {
    let x0 = Math.floor(ax / TILE), y0 = Math.floor(ay / TILE);
    const x1 = Math.floor(bx / TILE), y1 = Math.floor(by / TILE);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let n = dx + dy;
    while (n-- > 0) {
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      else { err += dx; y0 += sy; }
      if (x0 === x1 && y0 === y1) break;
      if (this.opaque(x0, y0)) return false;
    }
    return true;
  }

  // Hareket hattı: düz çizgide yürünebilir mi (atılma, kestirme)
  walkLine(ax, ay, bx, by, r) {
    const d = Math.hypot(bx - ax, by - ay);
    const steps = Math.ceil(d / 8);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (!this.boxFree(ax + (bx - ax) * t, ay + (by - ay) * t, r)) return false;
    }
    return true;
  }

  // Sınırlı A*: tile yolu (dünya pikseli merkezleri) veya null
  findPath(ax, ay, bx, by, maxNodes = 2600) {
    const W = this.w;
    const sx = Math.floor(ax / TILE), sy = Math.floor(ay / TILE);
    let gx = Math.floor(bx / TILE), gy = Math.floor(by / TILE);
    if (this.blocked(gx, gy)) {
      // hedef bloklu (ör. NPC bir eşyanın önünde): en yakın açık komşu
      let best = null, bd = Infinity;
      for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
        if (this.blocked(gx + ox, gy + oy)) continue;
        const d = Math.hypot(ox, oy) + Math.hypot(gx + ox - sx, gy + oy - sy) * 0.01;
        if (d < bd) { bd = d; best = [gx + ox, gy + oy]; }
      }
      if (!best) return null;
      [gx, gy] = best;
    }
    if (sx === gx && sy === gy) return [];
    const key = (x, y) => y * W + x;
    const open = new MinHeap();
    const g = new Map(), came = new Map();
    const startK = key(sx, sy), goalK = key(gx, gy);
    g.set(startK, 0);
    open.push(startK, 0);
    const h = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    let expanded = 0;
    const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    while (open.size) {
      const cur = open.pop();
      if (cur === goalK) break;
      if (++expanded > maxNodes) return null;
      const cx = cur % W, cy = (cur / W) | 0;
      const cg = g.get(cur);
      for (const [dx, dy, cost] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (this.blocked(nx, ny)) continue;
        if (dx && dy && (this.blocked(cx + dx, cy) || this.blocked(cx, cy + dy))) continue;
        const nk = key(nx, ny);
        const ng = cg + cost;
        if (ng < (g.get(nk) ?? Infinity)) {
          g.set(nk, ng);
          came.set(nk, cur);
          open.push(nk, ng + h(nx, ny));
        }
      }
    }
    if (!came.has(goalK)) return null;
    const path = [];
    let k = goalK;
    while (k !== startK) {
      path.push({ x: (k % W) * TILE + TILE / 2, y: ((k / W) | 0) * TILE + TILE / 2 });
      k = came.get(k);
    }
    path.reverse();
    return path;
  }
}

class MinHeap {
  constructor() { this.k = []; this.p = []; }
  get size() { return this.k.length; }
  push(k, p) {
    this.k.push(k); this.p.push(p);
    let i = this.k.length - 1;
    while (i > 0) {
      const pa = (i - 1) >> 1;
      if (this.p[pa] <= this.p[i]) break;
      [this.k[pa], this.k[i]] = [this.k[i], this.k[pa]];
      [this.p[pa], this.p[i]] = [this.p[i], this.p[pa]];
      i = pa;
    }
  }
  pop() {
    const top = this.k[0];
    const lk = this.k.pop(), lp = this.p.pop();
    if (this.k.length) {
      this.k[0] = lk; this.p[0] = lp;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < this.k.length && this.p[l] < this.p[m]) m = l;
        if (r < this.k.length && this.p[r] < this.p[m]) m = r;
        if (m === i) break;
        [this.k[m], this.k[i]] = [this.k[i], this.k[m]];
        [this.p[m], this.p[i]] = [this.p[i], this.p[m]];
        i = m;
      }
    }
    return top;
  }
}
