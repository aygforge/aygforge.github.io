/* =====================================================================
   02_art_base.js : SpriteAtlas, piksel tampon, renk yardımcıları, bitmap yazı tipi
   ===================================================================== */
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }

/* ---- renk ---- */
const _colCache = new Map();
function hex2rgb(h) {
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  const n = parseInt(h.slice(1, 7), 16); const a = h.length >= 9 ? parseInt(h.slice(7, 9), 16) : 255;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}
function rgb2hex(r, g, b) { return '#' + ((1 << 24) | (clamp(r | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(b | 0, 0, 255)).toString(16).slice(1); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
const dark = (c, t) => mix(c, '#1a1426', t == null ? 0.35 : t);
const light = (c, t) => mix(c, '#fff8e8', t == null ? 0.35 : t);
function U32(c) {
  if (typeof c === 'number') return c;
  let v = _colCache.get(c); if (v !== undefined) return v;
  const [r, g, b, a] = hex2rgb(c); v = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0; _colCache.set(c, v); return v;
}
function u32hex(v) { return rgb2hex(v & 255, (v >>> 8) & 255, (v >>> 16) & 255); }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (x, y, t) => t * 16 > BAYER[((y & 3) << 2) | (x & 3)];
function ihash(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s | 0) * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, s) { const i = Math.floor(x), f = x - i; const a = ihash(i, 0, s), b = ihash(i + 1, 0, s); const t = f * f * (3 - 2 * f); return a + (b - a) * t; }
function fbm(x, s, oct) { let v = 0, amp = 0.5, fr = 1; for (let i = 0; i < (oct || 3); i++) { v += vnoise(x * fr, s + i * 17) * amp; amp *= 0.5; fr *= 2; } return v; }
function vnoise2(x, y, s) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const a = ihash(i, j, s), b = ihash(i + 1, j, s), c = ihash(i, j + 1, s), d = ihash(i + 1, j + 1, s);
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

/* ---- Piksel tamponu ---- */
class PB {
  constructor(w, h) { this.w = w | 0; this.h = h | 0; this.d = new Uint32Array(this.w * this.h); }
  set(x, y, c) { if (c == null) return; x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = U32(c); }
  get(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.d[y * this.w + x]; }
  has(x, y) { return (this.get(x, y) >>> 24) > 0; }
  rect(x, y, w, h, c) { const v = U32(c); x |= 0; y |= 0; for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) this.d[j * this.w + i] = v; }
  hline(x0, x1, y, c) { if (x1 < x0) [x0, x1] = [x1, x0]; this.rect(x0, y, x1 - x0 + 1, 1, c); }
  vline(x, y0, y1, c) { if (y1 < y0) [y0, y1] = [y1, y0]; this.rect(x, y0, 1, y1 - y0 + 1, c); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (let n = 0; n < 4000; n++) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  ellipse(cx, cy, rx, ry, c, f) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, f ? f(x, y, dx, dy) : c);
    }
  }
  poly(pts, c, f) {
    let minY = 1e9, maxY = -1e9; for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, f ? f(x, y) : c);
    }
  }
  /* seçici dış hat: boş piksele komşu dolu pikselin koyusu */
  outline(fixed, amt) {
    const w = this.w, h = this.h, src = this.d.slice(), t = amt == null ? 0.55 : amt;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if ((src[i] >>> 24) > 0) continue;
      let n = 0;
      if (y > 0 && (src[i - w] >>> 24)) n = src[i - w]; else if (y < h - 1 && (src[i + w] >>> 24)) n = src[i + w];
      else if (x > 0 && (src[i - 1] >>> 24)) n = src[i - 1]; else if (x < w - 1 && (src[i + 1] >>> 24)) n = src[i + 1];
      if (n) this.d[i] = U32(fixed || dark(u32hex(n), t));
    }
  }
  /* silüet: tüm dolu pikseller tek renk */
  silhouette(c) { const p = new PB(this.w, this.h); const v = U32(c); for (let i = 0; i < this.d.length; i++) if (this.d[i] >>> 24) p.d[i] = v; return p; }
  flipX() { const p = new PB(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x]; return p; }
  blit(src, ox, oy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const v = src.d[y * src.w + x]; if (v >>> 24) { const X = x + ox, Y = y + oy; if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.d[Y * this.w + X] = v; } } }
  canvas() { const [c, x] = mkCanvas(this.w, this.h); const id = x.createImageData(this.w, this.h); new Uint32Array(id.data.buffer).set(this.d); x.putImageData(id, 0, 0); return c; }
}

/* ---- Önbellekli sprite atlası ---- */
const Atlas = {
  cache: new Map(), urls: new Map(),
  get(key, make) { let c = this.cache.get(key); if (!c) { c = make(); if (c instanceof PB) c = c.canvas(); this.cache.set(key, c); } return c; },
  url(key, make, scale) {
    const k = key + '@' + (scale || 1); let u = this.urls.get(k); if (u) return u;
    const c = this.get(key, make); let out = c;
    if (scale && scale !== 1) { const [o, x] = mkCanvas(c.width * scale, c.height * scale); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, o.width, o.height); out = o; }
    u = out.toDataURL(); this.urls.set(k, u); return u;
  },
  drop(prefix) { for (const k of [...this.cache.keys()]) if (k.startsWith(prefix)) this.cache.delete(k); for (const k of [...this.urls.keys()]) if (k.startsWith(prefix)) this.urls.delete(k); }
};

/* ---- 3×5 bitmap yazı tipi (aksan + alt satır, Türkçe karakterler) ---- */
const FONT = (() => {
  const g = {
    A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3],
    H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7], M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5],
    O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7],
    V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5], Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
    '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [6, 1, 2, 4, 7], '3': [6, 1, 2, 1, 6], '4': [5, 5, 7, 1, 1], '5': [7, 4, 6, 1, 6],
    '6': [3, 4, 6, 5, 2], '7': [7, 1, 2, 2, 2], '8': [2, 5, 2, 5, 2], '9': [2, 5, 3, 1, 6], '.': [0, 0, 0, 0, 2], ',': [0, 0, 0, 2, 2],
    '!': [2, 2, 2, 0, 2], '?': [6, 1, 2, 0, 2], '-': [0, 0, 7, 0, 0], ':': [0, 2, 0, 2, 0], "'": [2, 2, 0, 0, 0], '/': [1, 1, 2, 4, 4],
    '+': [0, 2, 7, 2, 0], '%': [5, 1, 2, 4, 5], ' ': [0, 0, 0, 0, 0], '×': [0, 5, 2, 5, 0], '(': [1, 2, 2, 2, 1], ')': [4, 2, 2, 2, 4], '&': [2, 5, 2, 5, 3]
  };
  const out = {};
  for (const k in g) out[k] = [0].concat(g[k], [0]);
  const acc = (base, a, d) => { const r = out[base].slice(); if (a != null) r[0] = a; if (d != null) r[6] = d; return r; };
  out['Ç'] = acc('C', null, 2); out['Ş'] = acc('S', null, 2); out['Ğ'] = acc('G', 5, null); out['Ö'] = acc('O', 5, null);
  out['Ü'] = acc('U', 5, null); out['İ'] = acc('I', 2, null); out['Â'] = acc('A', 2, null); out['Î'] = acc('I', 2, null); out['Û'] = acc('U', 2, null);
  return out;
})();
function textWidth(str, sc) { return upTR(str).length * 4 * (sc || 1) - (sc || 1); }
/* metni piksel tampona veya canvas bağlamına çiz */
const TXT = new Map();
function drawText(target, str, x, y, color, sc, shadow) {
  sc = sc || 1; str = upTR(str);
  const isPB = target instanceof PB;
  if (!isPB) {
    const key = str + '|' + color + '|' + sc + '|' + (shadow || ''); let c = TXT.get(key);
    if (!c) { const pb = new PB(str.length * 4 * sc + sc, 8 * sc + sc); drawText(pb, str, 0, sc, color, sc, shadow); c = pb.canvas(); if (TXT.size > 600) TXT.clear(); TXT.set(key, c); }
    target.drawImage(c, Math.round(x), Math.round(y - sc)); return;
  }
  const put = (px, py, c) => { if (isPB) { for (let j = 0; j < sc; j++) for (let i = 0; i < sc; i++) target.set(px + i, py + j, c); } else { target.fillStyle = c; target.fillRect(px, py, sc, sc); } };
  for (let pass = shadow ? 0 : 1; pass < 2; pass++) {
    let cx = x;
    for (const ch of str) {
      const gl = FONT[ch] || FONT['?'];
      for (let r = 0; r < 7; r++) { const bits = gl[r]; for (let b = 0; b < 3; b++) if (bits & (4 >> b)) { if (pass === 0) put(cx + b * sc + sc, y + (r - 1) * sc + sc, shadow); else put(cx + b * sc, y + (r - 1) * sc, color); } }
      cx += 4 * sc;
    }
  }
}
/* ---- sık kullanılan çizim yardımcıları (PB) ---- */
function ditherRect(pb, x, y, w, h, c1, c2, vertical) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const t = vertical ? j / Math.max(1, h - 1) : i / Math.max(1, w - 1); pb.set(x + i, y + j, dith(x + i, y + j, t) ? c2 : c1); }
}
function bandGradient(pb, x, y, w, h, stops) {
  /* stops: [[t,color],...] — dithered geçişlerle yatay bantlar */
  for (let j = 0; j < h; j++) {
    const t = j / Math.max(1, h - 1);
    let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k], [t1, c1] = stops[k + 1]; const f = clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1);
    for (let i = 0; i < w; i++) pb.set(x + i, y + j, dith(x + i, y + j, f) ? c1 : c0);
  }
}
function roundRect(pb, x, y, w, h, c) { pb.rect(x + 1, y, w - 2, h, c); pb.rect(x, y + 1, w, h - 2, c); }
