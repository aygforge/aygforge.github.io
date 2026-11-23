export type RGBA = [number, number, number, number];

export function hex(h: string, a = 255): RGBA {
  const v = h.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), a];
}
function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  const f = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
}
/** shift lightness with hue shift (shadows cooler, highlights warmer) */
export function shade(c: RGBA, dl: number): RGBA {
  const [h, s, l] = rgb2hsl(c[0], c[1], c[2]);
  let nh = h;
  const target = dl < 0 ? 0.7 : 0.13; // blue-violet / warm yellow
  let diff = target - h;
  if (diff > 0.5) diff -= 1; if (diff < -0.5) diff += 1;
  nh = h + diff * Math.min(0.25, Math.abs(dl) * 0.6) * (s > 0.05 ? 1 : 0);
  if (nh < 0) nh += 1; if (nh > 1) nh -= 1;
  const ns = Math.min(1, s * (dl < 0 ? 1.05 : 0.95));
  const [r, g, b] = hsl2rgb(nh, ns, Math.max(0, Math.min(1, l + dl)));
  return [Math.round(r), Math.round(g), Math.round(b), c[3]];
}
export interface Ramp { d: RGBA; m: RGBA; l: RGBA; dd: RGBA; ll: RGBA }
export function ramp(h: string | RGBA): Ramp {
  const m = typeof h === 'string' ? hex(h) : h;
  return { dd: shade(m, -0.3), d: shade(m, -0.14), m, l: shade(m, 0.12), ll: shade(m, 0.24) };
}
export function mix(a: RGBA, b: RGBA, t: number): RGBA {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t), Math.round(a[3] + (b[3] - a[3]) * t)];
}

/** Deterministic value noise */
export function hash2(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class PC {
  d: Uint8ClampedArray;
  constructor(public w: number, public h: number) {
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  inb(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x: number, y: number, c: RGBA) {
    x = Math.round(x); y = Math.round(y);
    if (!this.inb(x, y) || c[3] === 0) return;
    const i = (y * this.w + x) * 4;
    if (c[3] >= 255) { this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = 255; return; }
    const a = c[3] / 255, ba = this.d[i + 3] / 255;
    const oa = a + ba * (1 - a);
    if (oa <= 0) return;
    for (let k = 0; k < 3; k++) this.d[i + k] = (c[k] * a + this.d[i + k] * ba * (1 - a)) / oa;
    this.d[i + 3] = oa * 255;
  }
  get(x: number, y: number): RGBA {
    if (!this.inb(x, y)) return [0, 0, 0, 0];
    const i = (y * this.w + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  }
  alpha(x: number, y: number) { return this.inb(x, y) ? this.d[(y * this.w + x) * 4 + 3] : 0; }
  clear() { this.d.fill(0); }
  rect(x: number, y: number, w: number, h: number, c: RGBA) {
    for (let j = Math.round(y); j < Math.round(y + h); j++) for (let i = Math.round(x); i < Math.round(x + w); i++) this.set(i, j, c);
  }
  /** shaded rect: highlight top-left, shadow bottom-right */
  rectS(x: number, y: number, w: number, h: number, r: Ramp, flat = false) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const nx = w > 1 ? (i / (w - 1)) * 2 - 1 : 0, ny = h > 1 ? (j / (h - 1)) * 2 - 1 : 0;
      const v = flat ? ny : nx * 0.6 + ny * 0.8;
      this.set(x + i, y + j, v < -0.55 ? r.l : v > 0.55 ? r.d : r.m);
    }
  }
  ell(cx: number, cy: number, rx: number, ry: number, c: RGBA) {
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
      const dx = (i - cx) / (rx + 0.35), dy = (j - cy) / (ry + 0.35);
      if (dx * dx + dy * dy <= 1) this.set(i, j, c);
    }
  }
  ellS(cx: number, cy: number, rx: number, ry: number, r: Ramp, lightX = -0.5, lightY = -0.6) {
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
      const dx = (i - cx) / (rx + 0.35), dy = (j - cy) / (ry + 0.35);
      const dd = dx * dx + dy * dy;
      if (dd > 1) continue;
      const v = dx * -lightX + dy * -lightY;
      const lit = -(dx * lightX + dy * lightY);
      void v;
      this.set(i, j, lit > 0.45 && dd < 0.5 ? r.ll : lit > 0.15 ? r.l : lit < -0.45 || dd > 0.8 && lit < 0 ? r.d : r.m);
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGBA, th = 1) {
    const d = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    const steps = Math.ceil(d * 1.5);
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (th <= 1) this.set(x, y, c);
      else this.ell(x, y, (th - 1) / 2, (th - 1) / 2, c);
    }
  }
  /** shaded thick limb: light on one side */
  limb(x0: number, y0: number, x1: number, y1: number, r: Ramp, th: number) {
    this.line(x0, y0, x1, y1, r.m, th);
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    const o = (th - 1) / 2;
    // light side faces up-left
    const s = nx * -0.6 + ny * -0.8 > 0 ? 1 : -1;
    if (th >= 3) {
      this.line(x0 + nx * o * s, y0 + ny * o * s, x1 + nx * o * s, y1 + ny * o * s, r.l, 1);
      this.line(x0 - nx * o * s, y0 - ny * o * s, x1 - nx * o * s, y1 - ny * o * s, r.d, 1);
    }
  }
  poly(pts: [number, number][], c: RGBA) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const yy = y + 0.5;
        if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + ((yy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
    }
  }
  polyS(pts: [number, number][], r: Ramp) {
    const tmp = new PC(this.w, this.h);
    tmp.poly(pts, [255, 255, 255, 255]);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(this.h - 1, Math.ceil(maxY)); y++) for (let x = Math.max(0, Math.floor(minX)); x <= Math.min(this.w - 1, Math.ceil(maxX)); x++) {
      if (!tmp.alpha(x, y)) continue;
      const nx = ((x - minX) / Math.max(1, maxX - minX)) * 2 - 1, ny = ((y - minY) / Math.max(1, maxY - minY)) * 2 - 1;
      const v = nx * 0.55 + ny * 0.8;
      this.set(x, y, v < -0.5 ? r.l : v > 0.5 ? r.d : r.m);
    }
  }
  ring(cx: number, cy: number, rx: number, ry: number, c: RGBA, th = 1) {
    for (let j = Math.floor(cy - ry - th); j <= Math.ceil(cy + ry + th); j++) for (let i = Math.floor(cx - rx - th); i <= Math.ceil(cx + rx + th); i++) {
      const dx = (i - cx) / Math.max(0.5, rx), dy = (j - cy) / Math.max(0.5, ry);
      const d = Math.sqrt(dx * dx + dy * dy);
      const edge = th / Math.max(1, Math.min(rx, ry));
      if (d <= 1 + edge / 2 && d >= 1 - edge / 2) this.set(i, j, c);
    }
  }
  /** soft radial glow */
  glow(cx: number, cy: number, r: number, c: RGBA, strength = 1) {
    for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) {
      const d = Math.hypot(i - cx, j - cy) / r;
      if (d > 1) continue;
      const a = Math.round((1 - d) * (1 - d) * c[3] * strength);
      // quantise for pixel look
      const q = Math.round(a / 40) * 40;
      if (q > 0) this.set(i, j, [c[0], c[1], c[2], Math.min(255, q)]);
    }
  }
  blit(src: PC, dx: number, dy: number, opt: { flipX?: boolean; alpha?: number; tint?: RGBA; tintAmt?: number; sx?: number; sy?: number; sw?: number; sh?: number } = {}) {
    const sx = opt.sx ?? 0, sy = opt.sy ?? 0, sw = opt.sw ?? src.w, sh = opt.sh ?? src.h;
    for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
      const xi = opt.flipX ? sx + sw - 1 - i : sx + i;
      let c = src.get(xi, sy + j);
      if (!c[3]) continue;
      if (opt.tint) c = mix(c, [opt.tint[0], opt.tint[1], opt.tint[2], c[3]], opt.tintAmt ?? 0.5);
      if (opt.alpha !== undefined) c = [c[0], c[1], c[2], Math.round(c[3] * opt.alpha)];
      this.set(dx + i, dy + j, c);
    }
  }
  /** add 1px outline around opaque pixels */
  outline(c: RGBA, diag = false) {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.alpha(x, y) > 40) continue;
      const n = this.alpha(x - 1, y) > 100 || this.alpha(x + 1, y) > 100 || this.alpha(x, y - 1) > 100 || this.alpha(x, y + 1) > 100 ||
        (diag && (this.alpha(x - 1, y - 1) > 100 || this.alpha(x + 1, y + 1) > 100 || this.alpha(x + 1, y - 1) > 100 || this.alpha(x - 1, y + 1) > 100));
      if (n) add.push(x, y);
    }
    for (let k = 0; k < add.length; k += 2) this.set(add[k], add[k + 1], c);
  }
  /** nearest-neighbour rotation around pivot, returns new canvas */
  rotated(angle: number, px: number, py: number): PC {
    const out = new PC(this.w, this.h);
    const ca = Math.cos(-angle), sa = Math.sin(-angle);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const dx = x - px, dy = y - py;
      const sx = Math.round(px + dx * ca - dy * sa), sy = Math.round(py + dx * sa + dy * ca);
      const c = this.get(sx, sy);
      if (c[3]) out.set(x, y, c);
    }
    return out;
  }
  scaled(k: number): PC {
    const out = new PC(this.w * k, this.h * k);
    for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) out.set(x, y, this.get(Math.floor(x / k), Math.floor(y / k)));
    return out;
  }
  /** silhouette tint (e.g. white hit flash) */
  tinted(c: RGBA, amt: number): PC {
    const out = new PC(this.w, this.h);
    out.blit(this, 0, 0, { tint: c, tintAmt: amt });
    return out;
  }
  withAlpha(a: number): PC {
    const out = new PC(this.w, this.h);
    out.blit(this, 0, 0, { alpha: a });
    return out;
  }
  isEmpty(): boolean {
    for (let i = 3; i < this.d.length; i += 4) if (this.d[i] > 0) return false;
    return true;
  }
  /** count opaque pixels */
  coverage(): number {
    let n = 0;
    for (let i = 3; i < this.d.length; i += 4) if (this.d[i] > 0) n++;
    return n;
  }
}
