// Colored-pencil drawing engine: wobbly strokes, crayon hatching, paper + tooth textures.
const W = 1080, H = 1920;

const COL = {
  ink: '#25204a', inkSoft: '#4a4470', paper: '#f4ecdb',
  burg: '#7f2a36', burgD: '#5e1d28', burgL: '#a34a52',
  gold: '#c9a046', goldD: '#8f6c26', goldL: '#ead08a',
  beige: '#dccaa6', beigeD: '#b9a27a', char: '#3a3540', charL: '#6d6772',
  skin: '#f0c7a0', skinD: '#d9a27a', cheek: '#e58f86',
  navy: '#34406f', navyD: '#232c52', red: '#b4423a', white: '#fbf7ee',
  wood: '#8a5a34', woodD: '#5e3b20', woodL: '#b98352', cork: '#cfa66d',
  news: '#ebe4d2', newsD: '#cfc6b0', green: '#6f7d4b', greenD: '#4d5a33',
  sky: '#cfd8d0', terra: '#c0643e', ochre: '#d7a752', zinc: '#8794a8', zincD: '#5f6b80',
  brown: '#6b4a2e', black: '#2a2630',
};

const G = { t: 0, boil: 0, amp: 2.2, alpha: 1, rev: 1, mode: 'normal' };

function clamp(x, a = 0, b = 1) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function seg(t, a, b) { return clamp((t - a) / (b - a)); }
function ease(t) { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOut(t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); }
function easeIn(t) { t = clamp(t); return t * t * t; }
function back(t) { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function pulse(t, a, b) { return Math.sin(Math.PI * seg(t, a, b)); }

function h2(x, y, s) { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); }
function h1(n) { const v = Math.sin(n * 91.345 + 17.17) * 43758.5453; return v - Math.floor(v); }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// jitter offset for a local-space point; stable within one boil step
function jit(x, y, k, amp) {
  const s = (G.boil % 3) * 13.7 + k;
  const a = amp * G.amp;
  return [
    (vnoise(x * 0.012, y * 0.012, s) - 0.5) * 2 * a + (vnoise(x * 0.004, y * 0.004, 500 + k) - 0.5) * 3 * a,
    (vnoise(x * 0.012 + 31.4, y * 0.012 + 17.1, s) - 0.5) * 2 * a + (vnoise(x * 0.004 + 9, y * 0.004 + 3, 700 + k) - 0.5) * 3 * a,
  ];
}

function plen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; }
function resample(P, step) {
  if (P.length < 2) return P.slice();
  const out = [P[0]];
  for (let i = 1; i < P.length; i++) {
    const [x0, y0] = P[i - 1], [x1, y1] = P[i];
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / step));
    for (let j = 1; j <= n; j++) out.push([x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n]);
  }
  return out;
}
function truncate(P, f) {
  if (f >= 1) return P;
  if (f <= 0) return [];
  const L = plen(P) * f; let acc = 0; const out = [P[0]];
  for (let i = 1; i < P.length; i++) {
    const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    if (acc + d >= L) { const r = (L - acc) / d; out.push([lerp(P[i - 1][0], P[i][0], r), lerp(P[i - 1][1], P[i][1], r)]); break; }
    acc += d; out.push(P[i]);
  }
  return out;
}
function smoothPath(c, P) {
  c.moveTo(P[0][0], P[0][1]);
  if (P.length === 2) { c.lineTo(P[1][0], P[1][1]); return; }
  for (let i = 1; i < P.length - 1; i++) {
    const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
    c.quadraticCurveTo(P[i][0], P[i][1], mx, my);
  }
  const l = P[P.length - 1]; c.lineTo(l[0], l[1]);
}

// ---------- shape builders ----------
function R(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function E(cx, cy, rx, ry, n = 32, a0 = 0, a1 = Math.PI * 2) {
  const out = []; const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const m = full ? n : n + 1;
  for (let i = 0; i < m; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
function spline(C, closed = false, n = 8) {
  const out = []; const L = C.length;
  const get = i => closed ? C[(i + L) % L] : C[clamp(i, 0, L - 1)];
  const last = closed ? L : L - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  if (!closed) out.push(C[L - 1]);
  return out;
}
function xf(P, dx, dy, s = 1, rot = 0) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  return P.map(([x, y]) => [dx + (x * c - y * sn) * s, dy + (x * sn + y * c) * s]);
}

// ---------- strokes & fills ----------
function stroke(c, pts, o = {}) {
  const w = o.w ?? 4.5, col = o.col ?? COL.ink, closed = o.closed ?? false, amp = o.amp ?? 1, k = o.k ?? 0;
  let a = (o.a ?? 0.92) * G.alpha;
  let rev = (o.rev ?? 1) * clamp(G.rev / 0.75);
  if (G.mode === 'sketch') a *= 0.75;
  if (a <= 0.003 || rev <= 0 || pts.length < 2) return;
  let P = closed ? pts.concat([pts[0]]) : pts;
  P = resample(P, 9);
  if (rev < 1) P = truncate(P, rev);
  if (P.length < 2) return;
  const kk = k + (P[0][0] * 0.37 + P[0][1] * 0.11) % 50;
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col;
  for (let pass = 0; pass < 2; pass++) {
    const J = P.map(([x, y]) => { const d = jit(x, y, kk + pass * 7.3, amp * (pass ? 1.25 : 1)); return [x + d[0], y + d[1]]; });
    c.beginPath(); smoothPath(c, J);
    c.lineWidth = pass ? w * 0.5 : w; c.globalAlpha = a * (pass ? 0.5 : 1);
    c.stroke();
  }
  c.globalAlpha = 1;
}

function fillRevAlpha() { return clamp((G.rev - 0.45) / 0.55); }

function shapePath(pts, amp, k) {
  const P = resample(pts.concat([pts[0]]), 14);
  const p = new Path2D();
  P.forEach(([x, y], i) => { const d = jit(x, y, k + 50, amp * 0.7); i ? p.lineTo(x + d[0], y + d[1]) : p.moveTo(x + d[0], y + d[1]); });
  p.closePath();
  return p;
}
function bbox(pts) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
}

// crayon fill clipped to a path: base wash + hatching strokes
function crayon(c, path, bb, col, o = {}) {
  let a = (o.a ?? 0.9) * G.alpha * fillRevAlpha();
  if (G.mode === 'sketch') a *= 0.0;
  if (G.mode === 'sil') { col = COL.char; }
  if (a <= 0.003) return;
  const base = o.base ?? 0.55, gap = o.gap ?? 7, ang = o.ang ?? -0.62, hw = o.hw ?? 3.2, k = o.k ?? 0;
  const hcol = G.mode === 'sil' ? COL.char : (o.hcol ?? col);
  c.save(); c.clip(path, o.rule ?? 'nonzero');
  const [x0, y0, x1, y1] = bb;
  c.globalAlpha = a * base; c.fillStyle = col; c.fillRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12);
  if (o.hatch !== false) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rad = Math.hypot(x1 - x0, y1 - y0) / 2 + 8;
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const n = Math.ceil(rad * 2 / gap);
    const kk = k + (x0 * 0.13 + y0 * 0.07) % 40 + (G.boil % 3) * 3.1;
    c.strokeStyle = hcol; c.lineCap = 'round';
    for (let b = 0; b < 3; b++) {
      c.beginPath();
      for (let i = 0; i < n; i++) {
        if (Math.floor(h1(i * 3.1 + kk) * 3) !== b) continue;
        const off = -rad + i * gap + (h1(i + kk * 1.7) - 0.5) * gap * 0.6;
        const ox = cx + px * off, oy = cy + py * off;
        const l0 = rad * (0.9 + h1(i * 1.3 + kk) * 0.2), l1 = rad * (0.9 + h1(i * 2.3 + kk) * 0.2);
        c.moveTo(ox - dx * l0, oy - dy * l0);
        c.lineTo(ox + dx * l1 + px * (h1(i * 5.1 + kk) - 0.5) * 3, oy + dy * l1 + py * (h1(i * 5.1 + kk) - 0.5) * 3);
      }
      c.lineWidth = hw * (0.8 + b * 0.25); c.globalAlpha = a * (0.32 + b * 0.2);
      c.stroke();
    }
  }
  c.restore(); c.globalAlpha = 1;
}

function fill(c, pts, col, o = {}) {
  const amp = o.amp ?? 1, k = o.k ?? 0;
  const path = shapePath(pts, amp, k);
  // knock out what is underneath so overlapping drawings read as solid paper + crayon
  const ko = (o.ko ?? (o.hatch !== false)) && G.mode !== 'sketch';
  if (ko) {
    const a = (o.koa ?? 1) * G.alpha * fillRevAlpha();
    if (a > 0.003) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = a; c.fill(path); c.restore(); }
  }
  crayon(c, path, bbox(pts), col, o);
}
// fill + outline
function blob(c, pts, col, o = {}) {
  if (col) fill(c, pts, col, o);
  if (o.line !== false) stroke(c, pts, { closed: true, w: o.w ?? 4.5, a: o.la ?? 0.92, k: o.k ?? 0, col: o.lc ?? COL.ink, amp: o.amp ?? 1 });
}
// ring fill (outer minus inner)
function ring(c, outer, inner, col, o = {}) {
  const p = new Path2D();
  p.addPath(shapePath(outer, 1, o.k ?? 0)); p.addPath(shapePath(inner.slice().reverse(), 1, (o.k ?? 0) + 3));
  if (G.mode !== 'sketch' && o.ko !== false) { const a = G.alpha * fillRevAlpha(); if (a > 0.003) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = a; c.fill(p, 'evenodd'); c.restore(); } }
  crayon(c, p, bbox(outer), col, Object.assign({ rule: 'evenodd' }, o));
}
// limb tube: ink outline then crayon body
function tube(c, P, w, col, o = {}) {
  let a = G.alpha;
  const rev = clamp(G.rev / 0.75);
  if (rev <= 0) return;
  let Q = resample(P, 10); if (rev < 1) Q = truncate(Q, rev);
  if (Q.length < 2) return;
  const k = o.k ?? 3;
  const J = Q.map(([x, y]) => { const d = jit(x, y, k, 1); return [x + d[0], y + d[1]]; });
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (G.mode === 'sketch') {
    for (const s of [-1, 1]) {
      const O = J.map((p, i) => {
        const q0 = J[Math.max(0, i - 1)], q1 = J[Math.min(J.length - 1, i + 1)];
        const dx = q1[0] - q0[0], dy = q1[1] - q0[1], l = Math.hypot(dx, dy) || 1;
        return [p[0] - dy / l * s * w / 2, p[1] + dx / l * s * w / 2];
      });
      c.beginPath(); smoothPath(c, O); c.strokeStyle = COL.ink; c.globalAlpha = a * 0.6; c.lineWidth = 3.5; c.stroke();
    }
    c.globalAlpha = 1; return;
  }
  c.beginPath(); smoothPath(c, J);
  c.strokeStyle = o.lc ?? COL.ink; c.globalAlpha = a * 0.9; c.lineWidth = w + 9; c.stroke();
  {
    c.beginPath(); smoothPath(c, J);
    c.strokeStyle = G.mode === 'sil' ? COL.char : col; c.globalAlpha = a * fillRevAlpha(); c.lineWidth = w; c.stroke();
    // a few crayon streaks
    c.globalAlpha = a * fillRevAlpha() * 0.35; c.lineWidth = w * 0.35; c.strokeStyle = o.sc ?? COL.ink;
    c.beginPath(); smoothPath(c, J.map(([x, y]) => [x + w * 0.22, y])); c.stroke();
  }
  c.globalAlpha = 1;
}
function dot(c, x, y, r, col = COL.ink, a = 1) {
  if (G.mode === 'sketch' && col !== COL.ink) return;
  const d = jit(x, y, 9, 0.5);
  c.globalAlpha = a * G.alpha * clamp(G.rev / 0.75); c.fillStyle = G.mode === 'sil' ? COL.char : col;
  c.beginPath(); c.ellipse(x + d[0], y + d[1], r, r * 1.05, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
}
function hand(c, text, x, y, size, o = {}) {
  c.save();
  c.font = `${o.weight ?? 700} ${size}px ${o.font ?? 'Kalam'}`;
  c.textAlign = o.align ?? 'center'; c.textBaseline = 'middle';
  c.globalAlpha = (o.a ?? 0.92) * G.alpha * clamp(G.rev / 0.75);
  c.fillStyle = o.col ?? COL.ink;
  const d = jit(x, y, 4, 0.6);
  c.translate(x + d[0], y + d[1]); c.rotate(o.rot ?? 0);
  c.fillText(text, 0, 0);
  c.restore();
}
// with-state helper
function W_(c, fn, o = {}) {
  const sv = { alpha: G.alpha, rev: G.rev, mode: G.mode };
  c.save();
  if (o.x !== undefined || o.y !== undefined) c.translate(o.x ?? 0, o.y ?? 0);
  if (o.rot) c.rotate(o.rot);
  if (o.s !== undefined) { if (Array.isArray(o.s)) c.scale(o.s[0], o.s[1]); else c.scale(o.s, o.s); }
  if (o.alpha !== undefined) G.alpha *= o.alpha;
  if (o.rev !== undefined) G.rev = Math.min(G.rev, o.rev);
  if (o.mode) G.mode = o.mode;
  if (G.alpha > 0.003 && G.rev > 0) fn();
  c.restore();
  G.alpha = sv.alpha; G.rev = sv.rev; G.mode = sv.mode;
}

// ---------- textures ----------
function makePaper() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'); const img = c.createImageData(W, H); const d = img.data;
  const base = [244, 236, 219];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const blot = (vnoise(x * 0.004, y * 0.004, 3) - 0.5) * 14 + (vnoise(x * 0.02, y * 0.02, 5) - 0.5) * 5;
    const grain = (Math.random() - 0.5) * 10;
    const fib = (vnoise(x * 0.15, y * 0.015, 8) > 0.82 ? -4 : 0);
    const vx = (x / W - 0.5), vy = (y / H - 0.5);
    const vig = -Math.pow(vx * vx * 1.6 + vy * vy * 1.1, 1.4) * 60;
    const v = blot + grain + fib + vig;
    d[i] = base[0] + v; d[i + 1] = base[1] + v * 0.98; d[i + 2] = base[2] + v * 0.9 - 2; d[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  // faint fibres
  c.strokeStyle = 'rgba(160,130,90,0.08)'; c.lineWidth = 1;
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * W, y = Math.random() * H, a = Math.random() * 6.28, l = 10 + Math.random() * 30;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  return cv;
}
function makeTooth() {
  const w = W + 64, h = H + 64;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d'); const img = c.createImageData(w, h); const d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const r = Math.random();
    const n = vnoise(x * 0.35, y * 0.35, 2);
    const v = n * 0.6 + r * 0.4;
    d[i] = d[i + 1] = d[i + 2] = 0;
    d[i + 3] = v > 0.62 ? Math.min(255, (v - 0.62) * 2.6 * 255 * 0.55) : 0;
  }
  c.putImageData(img, 0, 0);
  return cv;
}

// two-bone IK for person() arms: hand target in person-local coords -> [shoulderAngle, elbowAngle]
function ik(s, hx, hy, pref = 'out') {
  const Sx = s * 66, Sy = -455, L1 = 112, L2 = 104;
  const dx = hx - Sx, dy = hy - Sy, D = Math.hypot(dx, dy) || 1;
  const d = Math.min(D, L1 + L2 - 1), ux = dx / D, uy = dy / D;
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const px = Sx + ux * a, py = Sy + uy * a;
  const c1 = [px - uy * h, py + ux * h], c2 = [px + uy * h, py - ux * h];
  let e;
  if (pref === 'down') e = c1[1] > c2[1] ? c1 : c2;
  else if (pref === 'in') e = s * c1[0] < s * c2[0] ? c1 : c2;
  else e = s * c1[0] > s * c2[0] ? c1 : c2;
  const Hx = Sx + ux * d, Hy = Sy + uy * d;
  const a1 = Math.atan2(s * (e[0] - Sx), e[1] - Sy);
  const a12 = Math.atan2(s * (Hx - e[0]), Hy - e[1]);
  return [a1, a12 - a1];
}
function lerpArm(A, B, p) { return [lerp(A[0], B[0], p), lerp(A[1], B[1], p)]; }
