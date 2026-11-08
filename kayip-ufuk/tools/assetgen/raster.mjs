// Minimal RGBA raster + PNG encoder for the original pixel-art generator (no external deps).
import { deflateSync } from 'node:zlib';

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

export function hex(c, a = 255) {
  if (Array.isArray(c)) return c.length === 4 ? c : [...c, a];
  const s = c.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16), s.length >= 8 ? parseInt(s.slice(6, 8), 16) : a];
}
export function shade(c, f) { const [r, g, b, a] = hex(c); const k = (v) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))); return [k(r), k(g), k(b), a]; }
export function mix(c1, c2, t) { const a = hex(c1), b = hex(c2); return [0, 1, 2, 3].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)); }

/** deterministic small PRNG for art variation */
export function prng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function strHash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { if (!this.inb(x, y)) return [0, 0, 0, 0]; const i = (y * this.w + x) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]]; }
  alpha(x, y) { return this.inb(x, y) ? this.d[(y * this.w + x) * 4 + 3] : 0; }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y); if (!this.inb(x, y)) return;
    if (c === 'CLEAR') { this.d[(y * this.w + x) * 4 + 3] = 0; return; }
    const [r, g, b, a] = hex(c); const i = (y * this.w + x) * 4;
    if (a >= 255) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255; return; }
    if (a <= 0) return;
    const da = this.d[i + 3] / 255, sa = a / 255, oa = sa + da * (1 - sa);
    this.d[i] = (r * sa + this.d[i] * da * (1 - sa)) / oa; this.d[i + 1] = (g * sa + this.d[i + 1] * da * (1 - sa)) / oa; this.d[i + 2] = (b * sa + this.d[i + 2] * da * (1 - sa)) / oa; this.d[i + 3] = oa * 255;
  }
  clear(x, y) { if (this.inb(x, y)) this.d[(y * this.w + x) * 4 + 3] = 0; }
  rect(x, y, w, h, c) { for (let yy = Math.round(y); yy < Math.round(y + h); yy++) for (let xx = Math.round(x); xx < Math.round(x + w); xx++) this.set(xx, yy, c); return this; }
  frame(x, y, w, h, c) { this.rect(x, y, w, 1, c); this.rect(x, y + h - 1, w, 1, c); this.rect(x, y, 1, h, c); this.rect(x + w - 1, y, 1, h, c); return this; }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / Math.max(0.5, rx), dy = (y + 0.5 - cy) / Math.max(0.5, ry);
      if (dx * dx + dy * dy <= 1) this.set(x, y, c);
    }
    return this;
  }
  circle(cx, cy, r, c) { return this.ellipse(cx, cy, r, r, c); }
  line(x0, y0, x1, y1, c, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (t <= 1) this.set(x, y, c); else this.rect(Math.round(x - t / 2), Math.round(y - t / 2), t, t, c); }
    return this;
  }
  poly(pts, c) {
    let minY = Infinity, maxY = -Infinity; for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs = []; const yy = y + 0.5;
      for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; if ((y0 <= yy && y1 > yy) || (y1 <= yy && y0 > yy)) xs.push(x0 + (yy - y0) / (y1 - y0) * (x1 - x0)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
    }
    return this;
  }
  /** 1px outline around opaque pixels */
  outline(c = '#243238', diag = false) {
    const o = hex(c); const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.alpha(x, y) > 40) continue;
      const n = this.alpha(x + 1, y) > 100 || this.alpha(x - 1, y) > 100 || this.alpha(x, y + 1) > 100 || this.alpha(x, y - 1) > 100 ||
        (diag && (this.alpha(x + 1, y + 1) > 100 || this.alpha(x - 1, y - 1) > 100 || this.alpha(x + 1, y - 1) > 100 || this.alpha(x - 1, y + 1) > 100));
      if (n) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, o);
    return this;
  }
  /** top-left rim light and bottom-right shadow inside shape */
  rimShade(light = 0.25, dark = -0.25) {
    const copy = this.d.slice();
    const a = (x, y) => (x >= 0 && y >= 0 && x < this.w && y < this.h ? copy[(y * this.w + x) * 4 + 3] : 0);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = (y * this.w + x) * 4; if (copy[i + 3] < 200) continue;
      const c = [copy[i], copy[i + 1], copy[i + 2], 255];
      if (a(x - 1, y) < 100 || a(x, y - 1) < 100) { const s = shade(c, light); this.d.set(s, i); }
      else if (a(x + 1, y) < 100 || a(x, y + 1) < 100) { const s = shade(c, dark); this.d.set(s, i); }
    }
    return this;
  }
  blit(src, dx, dy, { flipX = false, alphaMul = 1, tint = null } = {}) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const sx = flipX ? src.w - 1 - x : x; const i = (y * src.w + sx) * 4;
      let a = src.d[i + 3]; if (!a) continue;
      let c = [src.d[i], src.d[i + 1], src.d[i + 2], Math.round(a * alphaMul)];
      if (tint) c = [...mix(c, tint, tint[3] / 255 * 0.6).slice(0, 3), c[3]];
      this.set(dx + x, dy + y, c);
    }
    return this;
  }
  /** noise speckles inside existing opaque area */
  speckle(rand, density, colors, area = null) {
    const [x0, y0, x1, y1] = area || [0, 0, this.w, this.h];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (this.alpha(x, y) > 200 && rand() < density) this.set(x, y, colors[Math.floor(rand() * colors.length)]);
    return this;
  }
  map(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const i = (y * this.w + x) * 4; if (!this.d[i + 3]) continue; const r = fn([this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]], x, y); if (r) this.d.set(r, i); } return this; }
  clone() { const p = new Pix(this.w, this.h); p.d.set(this.d); return p; }
  /** ghost (placement preview) version: cool translucent */
  ghost() { return this.clone().map(([r, g, b, a]) => { const l = (r + g + b) / 3; return [Math.round(l * 0.5 + 60), Math.round(l * 0.6 + 120), Math.round(l * 0.5 + 170), Math.round(a * 0.62)]; }); }
  countOpaque() { let n = 0; for (let i = 3; i < this.d.length; i += 4) if (this.d[i] > 0) n++; return n; }
}
