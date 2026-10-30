// Hand-drawn rendering primitives: paper, crayon fills, wobbly pencil lines.
const { createCanvas, GlobalFonts, DOMMatrix } = require('@napi-rs/canvas');
const path = require('path');

const W = 1080, H = 1920, FPS = 30;

for (const w of [400, 500, 600, 700]) {
  GlobalFonts.registerFromPath(path.join(__dirname, 'fonts', `Caveat-${w}.ttf`), `Cav${w}`);
}

// ---------------------------------------------------------------- palette
const C = {
  paper: '#f3ead8', ink: '#25284c', inkSoft: '#3a3a64', purple: '#2f2347',
  blue: '#7f9fbf', blueDeep: '#5b7da3', sky: '#d3e2ea', skyHi: '#e6eef0', skyDeep: '#a9c4d6',
  red: '#c4574b', redDeep: '#a8443b', green: '#86bf8e', greenHi: '#b5e3b0', panel: '#454b5c',
  panelDark: '#2f3442', white: '#fbf7ee', grey: '#bfc1c6', greyDark: '#8d9097',
  parch: '#e9d7ae', parchDark: '#cdb27c', grass: '#a9b779', grassDark: '#8a9c62', field: '#d9c47f',
  asphalt: '#8e8b87', asphaltDark: '#6f6c6a', amber: '#e3a640', skin: '#e8b998', hair: '#6b4a35',
  cloud: '#fdfaf3', cloudShade: '#d9e4ec', fuel: '#d7a44a', water: '#9cbcd0', sun: '#f2cf7d',
  shirt: '#f4f1ea', navyCloth: '#3d4568', tan: '#c9a77a', yellow: '#e8c65a', orange: '#d98a4a',
};

// ---------------------------------------------------------------- hashing / noise
function h32(n) {
  n |= 0; n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4;
  n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296;
}
const h2 = (a, b) => h32(Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + 1013904223);
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (h2(i, seed) * (1 - u) + h2(i + 1, seed) * u) * 2 - 1;
}
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------------------------------------------------------------- easing / helpers
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const smooth = (t, a, b) => ease(prog(t, a, b));

// ---------------------------------------------------------------- frame state
const S = { t: 0, boil: 0, seed: 0 };
function beginFrame(t) { S.t = t; S.boil = Math.floor(t * 8); S.seed = 0; }

function ctmScale(ctx) {
  const m = ctx.getTransform();
  return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
}

// ---------------------------------------------------------------- textures
function periodicNoise(px, py, period, seed) {
  // value noise on a periodic lattice (period in lattice cells)
  const xi = Math.floor(px), yi = Math.floor(py), fx = px - xi, fy = py - yi;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const g = (x, y) => h2(((x % period) + period) % period + seed * 977, ((y % period) + period) % period);
  const a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const patCache = new Map();
function crayonTile(color) {
  const T = 256, cv = createCanvas(T, T), x = cv.getContext('2d');
  const img = x.createImageData(T, T), [r, g, b] = hexRgb(color);
  const seed = parseInt(color.slice(1), 16) % 97;
  for (let y = 0; y < T; y++) for (let xx = 0; xx < T; xx++) {
    // streaky crayon: noise stretched along a diagonal (periodic on the tile)
    const u = (xx + y) / T * 64, v = (xx - y + T) / T * 6;
    const streak = periodicNoise(u, v, 64, seed) * 0.6 + periodicNoise(u * 0.5, v * 2, 32, seed + 3) * 0.4;
    const fine = h2(xx + seed * 31, y * 7 + 3);
    let a = 0.70 + (streak - 0.5) * 0.45 + (fine - 0.5) * 0.22;
    if (fine > 0.93) a -= 0.35;               // paper tooth showing through
    a = clamp(a, 0.18, 1);
    const shade = 1 + (streak - 0.5) * 0.10;
    const i = (y * T + xx) * 4;
    img.data[i] = clamp(r * shade, 0, 255); img.data[i + 1] = clamp(g * shade, 0, 255);
    img.data[i + 2] = clamp(b * shade, 0, 255); img.data[i + 3] = a * 255;
  }
  x.putImageData(img, 0, 0);
  return cv;
}
function crayon(ctx, color) {
  let e = patCache.get(color);
  if (!e) { e = ctx.createPattern(crayonTile(color), 'repeat'); patCache.set(color, e); }
  // keep the grain in screen space so zooming never blows it up
  const m = ctx.getTransform().inverse();
  const j = S.boil % 3;
  e.setTransform(new DOMMatrix([m.a, m.b, m.c, m.d, m.e + j * 37, m.f + j * 23]));
  return e;
}

function makePaper() {
  const cv = createCanvas(W + 80, H + 80), x = cv.getContext('2d');
  const img = x.createImageData(cv.width, cv.height);
  const [r, g, b] = hexRgb(C.paper);
  for (let y = 0; y < cv.height; y++) for (let xx = 0; xx < cv.width; xx++) {
    const mott = periodicNoise(xx / 140, y / 140, 64, 5) * 0.6 + periodicNoise(xx / 40, y / 40, 256, 9) * 0.4;
    const gr = h2(xx, y) - 0.5;
    const fib = periodicNoise(xx / 3, y / 60, 4096, 11);
    let k = 1 + (mott - 0.5) * 0.05 + gr * 0.035 + (fib > 0.82 ? -0.02 : 0);
    const dx = (xx - cv.width / 2) / cv.width, dy = (y - cv.height / 2) / cv.height;
    k -= (dx * dx + dy * dy) * 0.10;
    const i = (y * cv.width + xx) * 4;
    img.data[i] = clamp(r * k, 0, 255); img.data[i + 1] = clamp(g * k, 0, 255);
    img.data[i + 2] = clamp(b * (k - 0.01), 0, 255); img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // a few fibres
  const R = rng(77);
  x.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    const px = R() * cv.width, py = R() * cv.height, a = R() * Math.PI, l = 6 + R() * 22;
    x.strokeStyle = R() < 0.5 ? 'rgba(120,100,70,0.07)' : 'rgba(255,255,255,0.18)';
    x.lineWidth = 0.8 + R();
    x.beginPath(); x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + R() * 4, py + Math.sin(a) * l * 0.5 + R() * 4, px + Math.cos(a) * l, py + Math.sin(a) * l);
    x.stroke();
  }
  return cv;
}

function makeTooth() {
  // multiply overlay: gives every crayon fill a paper-tooth grain
  const T = 512, cv = createCanvas(T, T), x = cv.getContext('2d'), img = x.createImageData(T, T);
  for (let y = 0; y < T; y++) for (let xx = 0; xx < T; xx++) {
    const n = h2(xx * 3 + 1, y * 5 + 2), s = periodicNoise((xx + y) / 3, (xx - y + T) / 24, 512, 21);
    let v = 255 - (n > 0.72 ? (n - 0.72) * 55 : 0) - (s > 0.62 ? (s - 0.62) * 16 : 0);
    const i = (y * T + xx) * 4;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v - 2; img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return cv;
}

// ---------------------------------------------------------------- shapes
function ell(cx, cy, rx, ry, n = 28, rot = 0, a0 = 0, a1 = Math.PI * 2) {
  const p = [], full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const cnt = full ? n : n + 1;
  for (let i = 0; i < cnt; i++) {
    const a = a0 + (a1 - a0) * i / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    p.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return p;
}
function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function rrect(x, y, w, h, r, n = 5) {
  const p = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  return p;
}
function subdiv(pts, closed, maxLen) {
  const out = [], n = pts.length, segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(1, Math.ceil(d / maxLen));
    for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

function jitter(pts, amp, seed) {
  if (amp <= 0) return pts;
  const B = S.boil;
  return pts.map((p, i) => [
    p[0] + noise1(i * 0.45 + B * 3.7, seed * 2 + 1) * amp,
    p[1] + noise1(i * 0.45 + B * 3.7 + 50, seed * 2 + 2) * amp,
  ]);
}

function tracePath(ctx, pts, closed, smoothCurve) {
  ctx.beginPath();
  const n = pts.length;
  if (n < 2) return;
  if (!smoothCurve || n < 3) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
    return;
  }
  const g = (i) => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  ctx.moveTo(pts[0][0], pts[0][1]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}

function polyLen(pts, closed) {
  let L = 0; const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const a = pts[i], b = pts[(i + 1) % n]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  return L;
}

// Main drawing primitive.
// o: fill (color), fa (fill alpha), stroke (color|false), lw, closed, smooth, j (px jitter on screen),
//    reveal (0..1 stroke draw-on), sketch (second pencil pass), alpha, dash
function P(ctx, pts, o = {}) {
  const seed = ++S.seed * 7 + (o.seed || 0);
  const closed = o.closed !== false, sm = o.smooth !== false;
  const sc = ctmScale(ctx);
  const jamp = (o.j == null ? 1.3 : o.j) / sc;
  const ga = ctx.globalAlpha;
  const alpha = (o.alpha == null ? 1 : o.alpha) * ga;
  if (alpha <= 0.002) return;
  const base = o.sub === false ? pts : subdiv(pts, closed, (o.subLen || 40) / sc);
  const jp = jitter(base, jamp, seed);
  ctx.save();
  if (o.fill && (o.reveal == null || o.reveal > 0)) {
    tracePath(ctx, jp, true, sm);
    ctx.globalAlpha = alpha * (o.fa == null ? 1 : o.fa) * (o.reveal == null ? 1 : clamp(o.reveal * 1.6 - 0.4));
    ctx.fillStyle = o.flat ? o.fill : crayon(ctx, o.fill);
    ctx.fill();
  }
  const st = o.stroke === undefined ? C.ink : o.stroke;
  if (st) {
    const lw = Math.max(o.lwScreen ? (o.lw || 3.2) / sc : (o.lw || 3.2), 1.3 / sc);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = st;
    const L = (o.reveal != null && o.reveal < 1) ? polyLen(jp, closed) * 1.15 : 0;
    const drawStroke = (pp, w, a) => {
      tracePath(ctx, pp, closed, sm);
      ctx.lineWidth = w; ctx.globalAlpha = alpha * a;
      if (o.dash) ctx.setLineDash(o.dash.map(d => d));
      else if (L) ctx.setLineDash([L * clamp(o.reveal), L * 2]);
      else ctx.setLineDash([]);
      if (o.dashOff != null) ctx.lineDashOffset = o.dashOff;
      ctx.stroke();
    };
    if (o.reveal == null || o.reveal > 0) {
      drawStroke(jp, lw, o.sa == null ? 0.9 : o.sa);
      if (o.sketch !== false) drawStroke(jitter(base, jamp * 1.6, seed + 991), lw * 0.45, (o.sa == null ? 0.9 : o.sa) * 0.45);
    }
  }
  ctx.restore();
}

// pencil hatching clipped to a polygon
function hatch(ctx, pts, o = {}) {
  const color = o.color || C.ink, gap = o.gap || 9, ang = o.angle == null ? -0.9 : o.angle;
  const alpha = o.alpha == null ? 0.22 : o.alpha, lw = o.lw || 1.6;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  ctx.save();
  tracePath(ctx, pts, true, true); ctx.clip();
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha *= alpha; ctx.lineCap = 'round';
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const seed = ++S.seed;
  let k = 0;
  for (let s = -R; s <= R; s += gap, k++) {
    const w = noise1(k * 0.7 + S.boil, seed) * gap * 0.25;
    const ax = cx + nx * (s + w) - dx * R, ay = cy + ny * (s + w) - dy * R;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    ctx.lineTo(ax + dx * 2 * R + noise1(k, seed + 5) * 2, ay + dy * 2 * R);
    ctx.stroke();
  }
  ctx.restore();
}

// simple open pencil line
function L(ctx, pts, o = {}) { P(ctx, pts, Object.assign({ closed: false }, o)); }

module.exports = {
  W, H, FPS, C, S, h32, h2, noise1, rng, clamp, lerp, prog, ease, easeOut, easeIn, smooth,
  beginFrame, makePaper, makeTooth, crayon, ell, rect, rrect, P, L, hatch, tracePath, ctmScale, subdiv,
};
