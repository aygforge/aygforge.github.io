'use strict';
// ---------- core drawing library: colored-pencil look on paper ----------
const W = 1080, H = 1920, FPS = 30;
const INK = '#2b2950';
let T = 0, BOIL = 0, CTX = null;

const C = {
  paper: '#f3ead7', sky: '#e6eee6', sky2: '#d6e6e2', sea: '#95bfb8', seaD: '#6e9e9e', seaL: '#bcd8cf',
  grass: '#a3c07f', grassD: '#73a062', hill: '#8db57a', fir: '#4f7d5e', firD: '#3d6650',
  soil: '#bf9870', soilD: '#9a7452', wood: '#bd9060', woodD: '#8c6642',
  pig: '#f2b4a8', pigD: '#de9289', usBlue: '#4f6190', usBlueD: '#3c4b74', usLight: '#97aac6',
  brRed: '#b8574d', brRedD: '#90433c', skin: '#f2cba4', skinD: '#dba980', hatBrown: '#7c5b40',
  cream: '#f7f1e3', white: '#fbf7ee', gray: '#a8a5a2', smoke: '#d3cec6', black: '#3b3a4a',
  gold: '#d9b45c', leaf: '#82b06a', leafD: '#5e8d53', flowerW: '#f6f1e8', flowerL: '#cfb8de',
  potato: '#c9a06a', shirt: '#e9dcc0', madder: '#c8866a', vest: '#6e5c4a', mountain: '#bccad0',
  bronze: '#8d7048', red: '#c45c4e', navyCoat: '#34406a', table: '#9c7350', parchment: '#efe2c4',
  ledgerLine: '#9fb3cc', hair: '#6a4a35', hairGray: '#8a8580', blush: '#e99a8a'
};

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOut = t => 1 - Math.pow(1 - t, 3);
const eIn = t => t * t * t;
const eBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const sm = (a, b, t) => ease(prog(t, a, b));
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function boilR(seed) { return rng(((seed * 2654435761) ^ (BOIL * 40503 + 17)) >>> 0); }

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function shade(h, f) { const [r, g, b] = hexRgb(h); return f < 0 ? rgbHex(r * (1 + f), g * (1 + f), b * (1 + f)) : rgbHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f); }
function mix(h1, h2, t) { const a = hexRgb(h1), b = hexRgb(h2); return rgbHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)); }

// ---------- textures ----------
let NOISE = null, FINE = null;
function initNoise() {
  const N = 256, r = rng(4242), base = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) base[i] = r();
  NOISE = new Float32Array(N * N); FINE = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let s = 0; for (let k = 0; k < 9; k++) s += base[((y - k + N * 4) % N) * N + ((x + k * 2) % N)];
    NOISE[y * N + x] = s / 9;
    FINE[y * N + x] = base[((y * 7 + 13) % N) * N + ((x * 3 + 5) % N)];
  }
  let mn = 1, mx = 0; for (const v of NOISE) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
  for (let i = 0; i < NOISE.length; i++) NOISE[i] = (NOISE[i] - mn) / (mx - mn);
}
const PAT = {};
function crayon(hex) {
  if (PAT[hex]) return PAT[hex];
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), im = g.createImageData(N, N), [r, gg, b] = hexRgb(hex);
  for (let i = 0; i < N * N; i++) {
    const n = NOISE[i], f = FINE[i];
    let a = 0.80 + (n - 0.5) * 0.42; if (f < 0.09) a *= 0.45; else if (f > 0.96) a = Math.min(1, a + 0.12);
    const k = 1 + (n - 0.5) * 0.13;
    im.data[i * 4] = r * k; im.data[i * 4 + 1] = gg * k; im.data[i * 4 + 2] = b * k; im.data[i * 4 + 3] = clamp(a) * 255;
  }
  g.putImageData(im, 0, 0);
  PAT[hex] = CTX.createPattern(c, 'repeat');
  return PAT[hex];
}

let PAPER = null, TOPPAPER = null, GRAIN = null;
function initPaper() {
  const r = rng(99);
  PAPER = document.createElement('canvas'); PAPER.width = W; PAPER.height = H;
  const g = PAPER.getContext('2d');
  g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() * H, rad = 80 + r() * 260;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const col = r() < .5 ? '255,250,238' : '214,196,160';
    gr.addColorStop(0, `rgba(${col},${0.10 + r() * 0.12})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.strokeStyle = 'rgba(150,120,80,0.10)'; g.lineWidth = 1;
  for (let i = 0; i < 500; i++) {
    const x = r() * W, y = r() * H, a = r() * 6.28, l = 6 + r() * 20;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + (r() - .5) * 6, y + Math.sin(a) * l * .5 + (r() - .5) * 6, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(120,90,50,0)'); vg.addColorStop(1, 'rgba(120,90,50,0.16)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  // top paper (caption zone) with soft fade
  TOPPAPER = document.createElement('canvas'); TOPPAPER.width = W; TOPPAPER.height = 600;
  const t = TOPPAPER.getContext('2d'); t.drawImage(PAPER, 0, 0);
  t.globalCompositeOperation = 'destination-in';
  const lg = t.createLinearGradient(0, 0, 0, 600);
  lg.addColorStop(0, 'rgba(0,0,0,1)'); lg.addColorStop(0.70, 'rgba(0,0,0,1)'); lg.addColorStop(0.86, 'rgba(0,0,0,0.55)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  t.fillStyle = lg; t.fillRect(0, 0, W, 600);
  // multiply grain
  GRAIN = document.createElement('canvas'); GRAIN.width = W / 2; GRAIN.height = H / 2;
  const gg = GRAIN.getContext('2d'), im = gg.createImageData(W / 2, H / 2);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = 255 - Math.pow(r(), 3) * 34 - r() * 8;
    im.data[i] = v; im.data[i + 1] = v - 1; im.data[i + 2] = v - 4; im.data[i + 3] = 255;
  }
  gg.putImageData(im, 0, 0);
}

// ---------- geometry helpers ----------
function curScale() { const m = CTX.getTransform(); return Math.max(0.05, Math.hypot(m.a, m.b)); }
function subdiv(pts, closed, step) {
  const out = [], n = pts.length, segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(3, Math.ceil(d / step));
    for (let j = 0; j < k; j++) { const u = j / k; out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
function jit(pts, amp, r) { return pts.map(p => [p[0] + (r() - .5) * 2 * amp, p[1] + (r() - .5) * 2 * amp]); }
function buildPath(pts, closed, smooth) {
  const p = new Path2D(), n = pts.length; if (n < 2) return p;
  if (!smooth) { p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) p.lineTo(pts[i][0], pts[i][1]); if (closed) p.closePath(); return p; }
  if (closed) {
    const m = mid(pts[n - 1], pts[0]); p.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    p.closePath();
  } else {
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) { const a = pts[i], b = pts[i + 1]; p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    p.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
  return p;
}
function plen(pts, closed) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (closed) L += Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]); return L; }
function bbox(pts) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } return [a, b, c, d]; }
function ell(cx, cy, rx, ry, n = 30, rot = 0) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return o; }
function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function xf(pts, tx, ty, s = 1, rot = 0, fx = 1) { const c = Math.cos(rot), sn = Math.sin(rot); return pts.map(p => { const x = p[0] * s * fx, y = p[1] * s; return [tx + x * c - y * sn, ty + x * sn + y * c]; }); }
function resample(pts, closed, n) {
  const P = closed ? pts.concat([pts[0]]) : pts; const L = plen(P, false); const out = [];
  let seg = 0, acc = 0;
  for (let i = 0; i < n; i++) {
    const target = L * i / (closed ? n : n - 1);
    while (seg < P.length - 2 && acc + Math.hypot(P[seg + 1][0] - P[seg][0], P[seg + 1][1] - P[seg][1]) < target) { acc += Math.hypot(P[seg + 1][0] - P[seg][0], P[seg + 1][1] - P[seg][1]); seg++; }
    const a = P[seg], b = P[seg + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u = clamp((target - acc) / d);
    out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
  }
  return out;
}

// ---------- primitives ----------
function hatch(path, col, ang, gap, alpha, bb) {
  const ctx = CTX, sc = curScale();
  ctx.save(); ctx.clip(path); ctx.strokeStyle = col; ctx.globalAlpha *= alpha; ctx.lineWidth = 1.7 / sc;
  const g = gap / sc;
  const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, R = Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) / 2 + 4;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  ctx.beginPath(); const r = rng(Math.round(R * 13 + cx));
  for (let k = -R; k <= R; k += g * (0.75 + r() * 0.5)) {
    const ox = cx + nx * k, oy = cy + ny * k, w = (r() - .5) * g * 0.8;
    ctx.moveTo(ox - dx * R, oy - dy * R); ctx.quadraticCurveTo(ox + nx * w, oy + ny * w, ox + dx * R, oy + dy * R);
  }
  ctx.stroke(); ctx.restore();
}

// shape: closed/open polyline with crayon fill + double pencil outline
function shape(pts, o = {}) {
  const ctx = CTX, closed = o.closed !== false, seed = o.seed || 1;
  const P = o.p === undefined ? 1 : o.p; if (P <= 0.001) return;
  const a = o.alpha === undefined ? 1 : o.alpha; if (a <= 0.003) return;
  const sc = curScale();
  const base = o.sub === 0 ? pts : subdiv(pts, closed, (o.sub || 22));
  const r = boilR(seed), j = (o.j === undefined ? 1.5 : o.j) / sc;
  ctx.save(); ctx.globalAlpha *= a;
  const fa = P >= 1 ? 1 : clamp((P - 0.5) / 0.5);
  if (o.fill && closed && fa > 0) {
    const fp = buildPath(jit(base, j * 1.7, r), true, true);
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * fa * (o.fillAlpha ?? 1);
    if (!o.flat && o.fillAlpha === undefined && !o.noUnder) { ctx.fillStyle = shade(o.fill, 0.3); ctx.fill(fp); }
    ctx.fillStyle = o.flat ? o.fill : crayon(o.fill); ctx.fill(fp);
    if (o.hatch !== false) hatch(fp, o.hatchColor || shade(o.fill, -0.2), o.hatchAngle ?? -1.0, o.hatchGap || 9, o.hatchAlpha ?? 0.3, bbox(base));
    ctx.globalAlpha = ga;
  }
  if (o.stroke !== false) {
    const sp = buildPath(jit(base, j, r), closed, true);
    const lw = (o.lw || 4) / Math.pow(sc, 0.8);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = o.stroke || INK;
    if (P < 1) { const L = plen(base, closed); ctx.setLineDash([L * P, L * 2]); }
    if (o.dash) { ctx.setLineDash(o.dash.map(d => d / sc)); ctx.lineDashOffset = (o.dashOff || 0) / sc; }
    ctx.lineWidth = lw; ctx.globalAlpha *= (o.inkAlpha ?? 0.92); ctx.stroke(sp);
    if (o.double !== false) { const sp2 = buildPath(jit(base, j * 1.4, r), closed, true); ctx.lineWidth = lw * 0.5; ctx.globalAlpha *= 0.5; ctx.stroke(sp2); }
  }
  ctx.restore();
}
function line(pts, o = {}) { shape(pts, Object.assign({ closed: false, fill: null }, o)); }

// thick outlined tube (limbs, masts, rifles)
function tube(pts, w, col, o = {}) {
  const ctx = CTX, sc = curScale(), r = boilR(o.seed || 3);
  const jp = jit(o.sub === 0 ? pts : subdiv(pts, false, o.sub || 20), (o.j ?? 1.1) / sc, r);
  const p = buildPath(jp, false, true);
  ctx.save(); ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  const olw = (o.lw ?? 3.6) / Math.pow(sc, 0.8);
  if (o.outline !== false) { ctx.strokeStyle = o.ink || INK; ctx.lineWidth = w + olw * 2; ctx.globalAlpha *= 0.95; ctx.stroke(p); ctx.globalAlpha /= 0.95; }
  ctx.strokeStyle = shade(col, 0.3); ctx.lineWidth = w; ctx.stroke(p);
  ctx.strokeStyle = crayon(col); ctx.lineWidth = w; ctx.stroke(p);
  ctx.restore();
}
function dot(x, y, r, col = INK, a = 1) { const ctx = CTX; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); ctx.restore(); }
function pencil(pts, o = {}) { // plain pencil line, no double
  line(pts, Object.assign({ double: false, lw: 3 }, o));
}

// group transform helper
function G(x, y, s, fn, o = {}) {
  const ctx = CTX; ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(s * (o.flip ? -1 : 1), s);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  fn(); ctx.restore();
}
