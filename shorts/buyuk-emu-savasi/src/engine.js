// Hand-drawn colored-pencil rendering engine (Node + @napi-rs/canvas)
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

const W = 1080, H = 1920, FPS = 30;

// ---------- fonts ----------
const F = path.join(__dirname, 'node_modules/@fontsource/');
for (const w of [400, 700]) {
  GlobalFonts.registerFromPath(F + `kalam/files/kalam-latin-${w}-normal.woff2`, 'KalL' + w);
  GlobalFonts.registerFromPath(F + `kalam/files/kalam-latin-ext-${w}-normal.woff2`, 'KalX' + w);
}
const font = (w, px) => `${w} ${px}px KalL${w}, KalX${w}`;

// ---------- random ----------
function hash(a, b = 0, c = 0) {
  let h = 2166136261 ^ (a * 374761393) ^ (b * 668265263) ^ (c * 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise1(x, seed = 0) { // smooth value noise
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u;
}

// ---------- math / easing ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const ease = {
  io: t => (t = clamp(t), t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  o: t => (t = clamp(t), 1 - Math.pow(1 - t, 3)),
  i: t => (t = clamp(t), t * t * t),
  back: t => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  sine: t => (t = clamp(t), -(Math.cos(Math.PI * t) - 1) / 2),
};
function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }

// ---------- palette ----------
const C = {
  paper: '#F2E8D3', paperLight: '#F8F1E2', ink: '#2A2552', inkSoft: '#4B4577',
  sky: '#C9DFE3', skyWarm: '#F4DDB5', hill: '#A7A2C2', hillFar: '#C2BDD6',
  ground: '#DDB66E', groundDark: '#C4954F', redEarth: '#C9784A', dust: '#E6CFA2', dustDark: '#CFAE7C',
  grass: '#B9A256', saltbush: '#9FAE8C', gumLeaf: '#8DA477', gumTrunk: '#E3DACB',
  emu: '#6E5038', emuDark: '#4C3727', emuLight: '#8C6A4A', emuNeck: '#6F86A6', beak: '#3B3433', emuLeg: '#7D7468',
  khaki: '#B29C5E', khakiDark: '#857140', hat: '#8E7548', hatBand: '#5E4B2E', skin: '#EBBE93', boot: '#5A4030',
  olive: '#71804A', oliveDark: '#535F35', wheel: '#3E3B3A', tyre: '#4A4645',
  gun: '#55585E', gunDark: '#3A3C42', gunWood: '#8E5C36',
  flash: '#F7CF4A', flash2: '#F28C3B',
  wheat: '#E7C66C', wheatDark: '#C9A04B', wheatGreen: '#BDB863', fence: '#9A7650',
  farmerShirt: '#7FA3C2', farmerPants: '#6D6A78', red: '#C8573E', sun: '#F5B944', white: '#FBF6EA',
};

// ---------- textures ----------
const TEX = 512;
const grainAlpha = (() => { // directional pencil grain alpha map
  const r = rng(7), a = new Float32Array(TEX * TEX);
  for (let i = 0; i < a.length; i++) a[i] = 0.82 + (r() - 0.5) * 0.22;
  // diagonal streaks
  for (let s = 0; s < 2600; s++) {
    let x = r() * TEX, y = r() * TEX; const len = 8 + r() * 40, d = (r() - 0.5) * 0.5;
    for (let k = 0; k < len; k++) {
      const xi = ((Math.floor(x + k * 0.86) % TEX) + TEX) % TEX, yi = ((Math.floor(y - k * 0.5) % TEX) + TEX) % TEX;
      a[yi * TEX + xi] = clamp(a[yi * TEX + xi] + d * 0.5, 0.4, 1);
    }
  }
  for (let s = 0; s < 9000; s++) { const i = Math.floor(r() * a.length); a[i] = 0.25 + r() * 0.3; } // paper tooth gaps
  return a;
})();
const patCache = new Map();
function texCanvas(color) {
  const c = createCanvas(TEX, TEX), x = c.getContext('2d'), img = x.createImageData(TEX, TEX);
  const [r, g, b] = hexToRgb(color);
  for (let i = 0; i < TEX * TEX; i++) {
    const v = grainAlpha[i];
    img.data[i * 4] = r * (0.93 + 0.07 * v); img.data[i * 4 + 1] = g * (0.93 + 0.07 * v); img.data[i * 4 + 2] = b * (0.93 + 0.07 * v);
    img.data[i * 4 + 3] = 255 * v;
  }
  x.putImageData(img, 0, 0); return c;
}
const patObj = new Map();
function tex(ctx, color) {
  let p = patObj.get(color);
  if (p && p.ctx === ctx) return p.pat;
  let c = patCache.get(color);
  if (!c) { c = texCanvas(color); patCache.set(color, c); }
  const pat = ctx.createPattern(c, 'repeat');
  patObj.set(color, { ctx, pat });
  return pat;
}

function makePaper() {
  const c = createCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = C.paper; x.fillRect(0, 0, W, H);
  // low-frequency blotches
  const small = createCanvas(54, 96), sx = small.getContext('2d'), si = sx.createImageData(54, 96), r = rng(11);
  for (let i = 0; i < 54 * 96; i++) { const v = r(); si.data[i * 4] = 120; si.data[i * 4 + 1] = 90; si.data[i * 4 + 2] = 50; si.data[i * 4 + 3] = v * 22; }
  sx.putImageData(si, 0, 0);
  x.imageSmoothingEnabled = true; x.drawImage(small, 0, 0, W, H);
  // fine grain
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < W * H; i++) { const n = (r() - 0.5) * 14; d[i * 4] += n; d[i * 4 + 1] += n; d[i * 4 + 2] += n * 0.9; }
  x.putImageData(img, 0, 0);
  // fibers
  for (let i = 0; i < 1400; i++) {
    const px = r() * W, py = r() * H, a = r() * Math.PI * 2, l = 6 + r() * 26;
    x.strokeStyle = r() < 0.5 ? 'rgba(120,95,60,0.10)' : 'rgba(255,252,240,0.35)'; x.lineWidth = 0.8 + r();
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + (r() - .5) * 6, py + Math.sin(a) * l * .5 + (r() - .5) * 6, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  // vignette
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, 'rgba(90,60,30,0)'); g.addColorStop(1, 'rgba(90,60,30,0.16)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return c;
}
function makeTooth() { // overlay: paper tooth specks showing through all pigment + pencil grain
  const c = createCanvas(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data, r = rng(23);
  const [pr, pg, pb] = hexToRgb(C.paperLight);
  for (let i = 0; i < W * H; i++) {
    const v = r();
    if (v < 0.035) { d[i * 4] = pr; d[i * 4 + 1] = pg; d[i * 4 + 2] = pb; d[i * 4 + 3] = 70 + r() * 90; }
    else if (v < 0.05) { d[i * 4] = 60; d[i * 4 + 1] = 45; d[i * 4 + 2] = 40; d[i * 4 + 3] = 18; }
  }
  x.putImageData(img, 0, 0); return c;
}

// ---------- hand-drawn primitives ----------
let BOIL = 0; // changes ~10x/sec for line boil
function setBoil(b) { BOIL = b; }
function jit(pts, amt, seed) {
  return pts.map((p, i) => [p[0] + (hash(seed, i, BOIL) - 0.5) * 2 * amt, p[1] + (hash(seed, i + 999, BOIL) - 0.5) * 2 * amt]);
}
function tracePath(ctx, pts, closed = true, smooth = true) {
  const n = pts.length;
  ctx.beginPath();
  if (n < 2) return;
  if (!smooth || n < 3) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
    return;
  }
  const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  ctx.moveTo(pts[0][0], pts[0][1]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}
function bbox(pts) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  return [x0, y0, x1, y1];
}
function hatchIn(ctx, pts, o) {
  const [x0, y0, x1, y1] = bbox(pts);
  const ang = o.angle ?? -0.9, gap = o.gap ?? 9, seed = o.seed ?? 1;
  ctx.save(); tracePath(ctx, pts, true, o.smooth !== false); ctx.clip();
  if (o.clip) { o.clip(ctx); ctx.clip(); }
  ctx.strokeStyle = o.color; ctx.globalAlpha *= (o.alpha ?? 0.5); ctx.lineWidth = o.lw ?? 2.2; ctx.lineCap = 'round';
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  ctx.beginPath();
  let k = 0;
  for (let d = -R; d <= R; d += gap, k++) {
    const j = (hash(seed, k, BOIL) - 0.5) * gap * 0.5;
    const ox = cx - sa * (d + j), oy = cy + ca * (d + j);
    const L = R * (0.75 + 0.25 * hash(seed, k + 50, 0));
    ctx.moveTo(ox - ca * L, oy - sa * L);
    ctx.lineTo(ox + ca * L, oy + sa * L + (hash(seed, k, 3) - .5) * 3);
  }
  ctx.stroke(); ctx.restore();
}
// shape: fill with crayon texture + optional hatch + pencil outline
function shape(ctx, pts, o = {}) {
  const seed = o.seed ?? 1, closed = o.closed !== false, smooth = o.smooth !== false;
  const j = o.jit ?? 1.6;
  if (o.fill && closed) {
    const fp = jit(pts, j * 0.6, seed + 7);
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    tracePath(ctx, fp, true, smooth);
    if (o.solid !== false) { ctx.fillStyle = mix(o.fill, C.paper, o.tint ?? 0.35); ctx.fill(); }
    ctx.fillStyle = tex(ctx, o.fill); ctx.fill();
    ctx.restore();
    if (o.hatch) hatchIn(ctx, fp, Object.assign({ seed: seed + 3, smooth }, o.hatch));
  }
  if (o.stroke !== null && o.stroke !== false) {
    const lw = o.lw ?? 4.5;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = o.stroke || C.ink;
    const p1 = jit(pts, j, seed + 11);
    ctx.lineWidth = lw; ctx.globalAlpha *= 0.92; tracePath(ctx, p1, closed, smooth); ctx.stroke();
    if (o.double !== false) {
      const p2 = jit(pts, j * 1.3, seed + 23);
      ctx.lineWidth = lw * 0.45; ctx.globalAlpha *= 0.55; tracePath(ctx, p2, closed, smooth); ctx.stroke();
    }
    ctx.restore();
  }
}
function line(ctx, pts, o = {}) { shape(ctx, pts, Object.assign({ closed: false }, o)); }
// limb: thick colored stroke with ink outline (open path)
function limb(ctx, pts, w, color, o = {}) {
  const seed = o.seed ?? 5, j = o.jit ?? 1.2;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const p = jit(pts, j, seed);
  ctx.strokeStyle = o.stroke || C.ink; ctx.lineWidth = w + (o.olw ?? 7); tracePath(ctx, p, false, o.smooth !== false); ctx.stroke();
  ctx.strokeStyle = mix(color, C.paper, 0.2); ctx.lineWidth = w; tracePath(ctx, p, false, o.smooth !== false); ctx.stroke();
  ctx.strokeStyle = tex(ctx, color); ctx.stroke();
  ctx.restore();
}
function ellipsePts(cx, cy, rx, ry, n = 16, rot = 0, wob = 0, seed = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, w = 1 + (wob ? (hash(seed, i) - 0.5) * wob : 0);
    const x = Math.cos(a) * rx * w, y = Math.sin(a) * ry * w;
    out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return out;
}
function rectPts(x, y, w, h, n = 2) { // rectangle with subdivided edges
  const out = [], c = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  for (let k = 0; k < 4; k++) { const a = c[k], b = c[(k + 1) % 4]; for (let i = 0; i < n; i++) out.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]); }
  return out;
}
function circle(ctx, x, y, r, o = {}) { shape(ctx, ellipsePts(x, y, r, r, Math.max(8, Math.min(22, Math.round(r / 3)))), o); }
// pencil scribble strokes (grass, sky hatch, etc.)
function strokes(ctx, list, color, lw = 2.5, alpha = 0.7) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.globalAlpha *= alpha;
  ctx.beginPath();
  for (const s of list) { ctx.moveTo(s[0], s[1]); if (s.length === 4) ctx.lineTo(s[2], s[3]); else ctx.quadraticCurveTo(s[2], s[3], s[4], s[5]); }
  ctx.stroke(); ctx.restore();
}
// rough color wash band (sky etc) clipped to polygon
function wash(ctx, pts, color, o = {}) {
  ctx.save(); tracePath(ctx, pts, true, o.smooth ?? false);
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.fillStyle = mix(color, C.paper, o.tint ?? 0.45); ctx.fill();
  ctx.fillStyle = tex(ctx, color); ctx.globalAlpha *= o.texAlpha ?? 0.55; ctx.fill();
  ctx.restore();
  if (o.hatch) hatchIn(ctx, pts, Object.assign({ smooth: o.smooth ?? false }, o.hatch));
}

// 2-bone IK (returns joint point). bend = +1/-1 chooses side
function ik(a, b, l1, l2, bend) {
  let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
  d = Math.min(d, l1 + l2 - 0.01); d = Math.max(d, Math.abs(l1 - l2) + 0.01);
  const ang = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const A = Math.acos(clamp(cosA, -1, 1));
  const t = ang + bend * A;
  return [a[0] + Math.cos(t) * l1, a[1] + Math.sin(t) * l1];
}

module.exports = { W, H, FPS, C, font, hash, rng, noise1, clamp, lerp, inv, ease, mix, hexToRgb, tex, makePaper, makeTooth, setBoil, jit, tracePath, bbox, hatchIn, shape, line, limb, ellipsePts, rectPts, circle, strokes, wash, ik, createCanvas, getBoil: () => BOIL };
