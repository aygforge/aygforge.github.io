// Düşük çözünürlüklü pixel tamponu: çizim primitifleri, otomatik dış hat, gölgeleme ve ölçekli canvas çıktısı.

const cache = new Map();
export function rgba(hex, a = 255) {
  if (typeof hex === 'number') return hex;
  const key = hex + a;
  let v = cache.get(key);
  if (v !== undefined) return v;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  v = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  cache.set(key, v);
  return v;
}

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
// amt > 0 aç, < 0 koyulaştır
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class PB {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.d = new Uint32Array(w * h);
  }
  set(x, y, c, a = 255) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || c == null) return;
    this.d[y * this.w + x] = rgba(c, a);
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  }
  opaque(x, y) { return (this.get(x, y) >>> 24) > 0; }
  rect(x, y, w, h, c, a) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a);
  }
  clear(x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const xx = x + i, yy = y + j;
      if (xx >= 0 && yy >= 0 && xx < this.w && yy < this.h) this.d[yy * this.w + xx] = 0;
    }
  }
  hline(x0, x1, y, c, a) { for (let x = Math.round(Math.min(x0, x1)); x <= Math.max(x0, x1); x++) this.set(x, y, c, a); }
  vline(x, y0, y1, c, a) { for (let y = Math.round(Math.min(y0, y1)); y <= Math.max(y0, y1); y++) this.set(x, y, c, a); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  thick(x0, y0, x1, y1, c, t = 2) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      this.disc(x, y, t / 2, c);
    }
  }
  ellipse(cx, cy, rx, ry, c, a) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c, a);
      }
    }
  }
  disc(cx, cy, r, c, a) { this.ellipse(cx, cy, r, r, c, a); }
  ring(cx, cy, r, c, w = 1) {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r && d > r - w) this.set(x, y, c);
    }
  }
  poly(pts, c) {
    let minY = Infinity, maxY = -Infinity;
    for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        const yy = y + 0.5;
        if ((y0 <= yy && y1 > yy) || (y1 <= yy && y0 > yy)) xs.push(x0 + (yy - y0) * (x1 - x0) / (y1 - y0));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
    }
  }
  // Tek renk dış hat (opak pikselin şeffaf komşularına)
  outline(c = '#1a1420', diag = false) {
    const out = [];
    const col = rgba(c);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.opaque(x, y)) continue;
      let near = this.opaque(x - 1, y) || this.opaque(x + 1, y) || this.opaque(x, y - 1) || this.opaque(x, y + 1);
      if (!near && diag) near = this.opaque(x - 1, y - 1) || this.opaque(x + 1, y - 1) || this.opaque(x - 1, y + 1) || this.opaque(x + 1, y + 1);
      if (near) out.push(y * this.w + x);
    }
    for (const i of out) this.d[i] = col;
    return this;
  }
  // Basit noise ile renk varyasyonu
  speckle(x, y, w, h, colors, density, seed = 0) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (hash(x + i, y + j, seed) < density) this.set(x + i, y + j, colors[Math.floor(hash(x + i, y + j, seed + 7) * colors.length)]);
    }
  }
  // Sadece mevcut opak piksellere uygula
  recolorWhere(fn) {
    for (let i = 0; i < this.d.length; i++) {
      if ((this.d[i] >>> 24) === 0) continue;
      const r = fn(i % this.w, (i / this.w) | 0, this.d[i]);
      if (r !== undefined) this.d[i] = rgba(r);
    }
  }
  blit(src, dx, dy, flip = false) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const v = src.d[y * src.w + (flip ? src.w - 1 - x : x)];
      if ((v >>> 24) === 0) continue;
      const tx = dx + x, ty = dy + y;
      if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
      this.d[ty * this.w + tx] = v;
    }
  }
  clone() {
    const p = new PB(this.w, this.h);
    p.d.set(this.d);
    return p;
  }
  toCanvas(scale = 2) {
    const c = document.createElement('canvas');
    c.width = this.w * scale; c.height = this.h * scale;
    const ctx = c.getContext('2d');
    if (scale === 1) {
      const id = ctx.createImageData(this.w, this.h);
      new Uint32Array(id.data.buffer).set(this.d);
      ctx.putImageData(id, 0, 0);
      return c;
    }
    const tmp = this.toCanvas(1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, c.width, c.height);
    return c;
  }
  drawTo(ctx, x, y, scale = 2) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.toCanvas(1), x, y, this.w * scale, this.h * scale);
  }
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export const OUTLINE = '#1c1420';
