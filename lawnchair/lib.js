// Hand-drawn colored-pencil drawing kit (skia canvas + rough.js)
const { createCanvas, GlobalFonts, Path2D } = require('@napi-rs/canvas');
const rough = require('roughjs');
const path = require('path');

for (const f of ['caveat/700Bold/Caveat_700Bold.ttf', 'caveat/400Regular/Caveat_400Regular.ttf', 'caveat/600SemiBold/Caveat_600SemiBold.ttf', 'kalam/700Bold/Kalam_700Bold.ttf'])
  GlobalFonts.registerFromPath(path.join(__dirname, 'node_modules/@expo-google-fonts', f));

const W = 1080, H = 1920;
const NAVY = '#2b2d5c', NAVY2 = '#3a3168';
const C = {
  cream: '#f3ead7', sky: '#9cc3e0', skyTop: '#7fa9d1', skyPale: '#cfe0ea', yellow: '#e8c766', red: '#c55d4b',
  green: '#8db27a', green2: '#6f9a63', skin: '#eec39c', hair: '#4a3426', jeans: '#506d9b', shirt: '#c55d4b',
  alu: '#b5bcc9', web1: '#86b277', web2: '#f1e8d2', web3: '#e8c35a', brown: '#8a6748', grey: '#a8adb8',
};
const BAL = ['#c95e4e', '#e6c45e', '#8fb47a', '#6fa3c9', '#e09a5c', '#a68fc6', '#d98da1', '#efe5cf', '#5f9e9a', '#d4b36a'];

const S = { ctx: null, rc: null, t: 0, i: 0, boil: 0 };
function begin(canvas, t) { S.ctx = canvas.getContext('2d'); S.rc = rough.canvas(canvas); S.t = t; S.i = 0; S.boil = Math.floor(t * 6) % 3; }
function seed() { S.i++; return ((S.i * 7919 + S.boil * 104729) % 2147483646) + 1; }
function scl() { const m = S.ctx.getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1e-4; }
function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
function rgb2hex(r) { return '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(h, a) { const c = hex2rgb(h); return rgb2hex(c.map(v => a < 0 ? v * (1 + a) : v + (255 - v) * a)); }
function mix(h1, h2, k) { const a = hex2rgb(h1), b = hex2rgb(h2); return rgb2hex(a.map((v, i) => v + (b[i] - v) * k)); }

// path builders
const P = {
  E: (cx, cy, rx, ry = rx) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`,
  R: (x, y, w, h) => `M${x} ${y}L${x + w} ${y}L${x + w} ${y + h}L${x} ${y + h}Z`,
  RR: (x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); return `M${x + r} ${y}L${x + w - r} ${y}Q${x + w} ${y} ${x + w} ${y + r}L${x + w} ${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}L${x + r} ${y + h}Q${x} ${y + h} ${x} ${y + h - r}L${x} ${y + r}Q${x} ${y} ${x + r} ${y}Z`; },
  poly: pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z',
  open: pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'),
};

// filled crayon shape with wobbly navy outline
function shape(d, fill, o = {}) {
  const ctx = S.ctx, sc = scl();
  const small = (o.size || 120) * sc < 26;
  const s1 = seed(), s2 = seed();
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const p = new Path2D(d);
  if (fill) {
    ctx.save(); ctx.globalAlpha *= small ? 1 : 0.86; ctx.fillStyle = fill; ctx.fill(p); ctx.restore();
    if (!small && o.hatch !== false) {
      S.rc.path(d, { seed: s1, stroke: 'none', fill: o.hatchColor || shade(fill, -0.16), fillStyle: o.fs || 'hachure', hachureGap: (o.gap || 6.5) / sc, fillWeight: 1.25 / sc, hachureAngle: o.ha ?? -41, roughness: 1.3 });
    }
  }
  if (o.stroke !== false) {
    const lw = Math.max(0.7, Math.min(6, (o.lw || 2.6) * Math.pow(sc, 0.65))) / sc;
    if (small) { ctx.strokeStyle = o.sc || NAVY; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(p); }
    else S.rc.path(d, { seed: s2, stroke: o.sc || NAVY, strokeWidth: lw, roughness: o.rough ?? 1.0, bowing: 1.1, disableMultiStroke: !!o.single });
  }
  ctx.restore();
}
function line(pts, color = NAVY, lw = 2.4, o = {}) {
  const sc = scl(); const s1 = seed();
  const w = Math.max(0.6, Math.min(8, lw * Math.pow(sc, 0.65))) / sc;
  if ((o.size || 100) * sc < 20 || o.plain) {
    const c = S.ctx; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.restore(); return;
  }
  S.ctx.save(); if (o.alpha != null) S.ctx.globalAlpha *= o.alpha;
  if (pts.length > 2 && o.curve) S.rc.curve(pts, { seed: s1, stroke: color, strokeWidth: w, roughness: o.rough ?? 0.8 });
  else S.rc.path(P.open(pts), { seed: s1, stroke: color, strokeWidth: w, roughness: o.rough ?? 0.8, bowing: 1.5 });
  S.ctx.restore();
}
function plainCurve(pts, color, lw, alpha = 1) { // smooth plain line (strings)
  const c = S.ctx; c.save(); c.globalAlpha *= alpha; c.strokeStyle = color; c.lineWidth = lw / scl() * Math.pow(scl(), 0.6); c.lineCap = 'round';
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 3) c.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else pts.slice(1).forEach(p => c.lineTo(p[0], p[1]));
  c.stroke(); c.restore();
}

function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ease = { io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, o: x => 1 - Math.pow(1 - x, 3), i: x => x * x * x, back: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }, sine: x => -(Math.cos(Math.PI * x) - 1) / 2 };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));

// ---------- textures ----------
const texCache = {};
function noiseCanvas(w, h, seedv, fn) {
  const cv = createCanvas(w, h), c = cv.getContext('2d'); const id = c.createImageData(w, h); const r = rng(seedv);
  fn(id.data, w, h, r); c.putImageData(id, 0, 0); return cv;
}
function paper() {
  if (texCache.paper) return texCache.paper;
  // low-frequency blotches
  const lw = 54, lh = 96; const low = [];
  const r0 = rng(11); for (let i = 0; i < lw * lh; i++) low.push(r0());
  const cv = noiseCanvas(W, H, 5, (d, w, h, r) => {
    const base = hex2rgb(C.cream);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const lx = x / w * (lw - 1), ly = y / h * (lh - 1); const ix = lx | 0, iy = ly | 0, fx = lx - ix, fy = ly - iy;
      const v = low[iy * lw + ix] * (1 - fx) * (1 - fy) + low[iy * lw + ix + 1] * fx * (1 - fy) + low[(iy + 1) * lw + ix] * (1 - fx) * fy + low[(iy + 1) * lw + ix + 1] * fx * fy;
      const n = (v - 0.5) * 14 + (r() - 0.5) * 12; const k = (y * w + x) * 4;
      const vig = Math.pow(Math.hypot(x / w - 0.5, y / h - 0.5) * 1.3, 2.5) * 22;
      d[k] = base[0] + n - vig; d[k + 1] = base[1] + n - vig; d[k + 2] = base[2] + n * 0.9 - vig * 1.1; d[k + 3] = 255;
    }
  });
  return texCache.paper = cv;
}
function grain() {
  if (texCache.grain) return texCache.grain;
  const cv = noiseCanvas(W, H, 9, (d, w, h, r) => {
    for (let i = 0; i < w * h; i++) { let v = 255 - Math.pow(r(), 6) * 70 - r() * 18; d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v - 3; d[i * 4 + 3] = 255; }
  });
  // fibers
  const c = cv.getContext('2d'); const r = rng(3); c.strokeStyle = 'rgba(120,100,80,0.10)'; c.lineWidth = 1;
  for (let i = 0; i < 1400; i++) { const x = r() * W, y = r() * H, a = r() * 6.28, l = 4 + r() * 16; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  return texCache.grain = cv;
}
// crayon wash: vertical gradient colors over paper, with pencil strokes
function wash(key, top, bottom, w = W, h = H, gap = 7, angle = -38) {
  const k = key + w + 'x' + h; if (texCache[k]) return texCache[k];
  const cv = createCanvas(w, h), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.globalAlpha = 0.82; c.fillStyle = g; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
  const r = rng(key.length * 77 + w);
  const a = angle * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
  c.lineCap = 'round';
  for (let i = 0; i < (w * h) / 900; i++) {
    const x = r() * w, y = r() * h, l = 30 + r() * 70; const col = mix(top, bottom, y / h);
    c.strokeStyle = r() < 0.6 ? shade(col, -0.1) : shade(col, 0.25); c.globalAlpha = 0.18 + r() * 0.2; c.lineWidth = 1 + r() * 1.6;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx * l, y + dy * l); c.stroke();
  }
  return texCache[k] = cv;
}

module.exports = { W, H, NAVY, NAVY2, C, BAL, S, begin, seed, scl, shade, mix, P, shape, line, plainCurve, rng, ease, clamp, lerp, prog, paper, grain, wash, createCanvas, Path2D };
