// ---------- core colored-pencil drawing engine ----------
const W = 1080, H = 1920;
let CTX = null, BOIL = 0, SEED = 0, TIME = 0;

const C = {
  paper: '#f2e8d3', paperD: '#e6d8bb',
  ink: '#2b2448', inkSoft: '#544b72', inkL: '#7a7194',
  burg: '#7e2f3d', burgL: '#a5505b', burgD: '#5a1f2a',
  gold: '#c9a24e', goldL: '#e2c57f', goldD: '#987832',
  parch: '#e0cb9f', parchD: '#bf9f66', brown: '#8a6844', brownD: '#5e452c', brownL: '#a98660',
  stone: '#b2aca2', stoneL: '#c9c3b8', stoneD: '#8b857c', stoneDD: '#68635c',
  skin: '#e8c3a0', skinD: '#c99a78', pale: '#cfcabb', paleD: '#aaa392',
  white: '#efe8d8', whiteD: '#d4cab4',
  flame: '#f4bb4c', flameL: '#fde7a6',
  slate: '#5d6385', blueGray: '#71809e', olive: '#7f8a5c', robeBrown: '#8f6c50',
  robeGray: '#8e8884', plum: '#5d4a6b', terra: '#a3624d', wax: '#9b2c2c', sky: '#e9dfc8',
};

function clamp(x, a = 0, b = 1) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, k) { return a + (b - a) * k; }
function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
function easeOut(x) { x = clamp(x); return 1 - (1 - x) * (1 - x) * (1 - x); }
function easeIn(x) { x = clamp(x); return x * x * x; }
function seg(t, a, b) { return ease((t - a) / (b - a)); }
function lin(t, a, b) { return clamp((t - a) / (b - a)); }
function bell(t, a, b) { const k = lin(t, a, b); return Math.sin(Math.PI * k); }

function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return s - Math.floor(s); }
function hash2(x, y) { return hash(x * 157.31 + y * 113.97 + 0.123); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function n1(x, s = 0) { return vnoise(x, s + 0.5); }

function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgbToHex(r) { return '#' + r.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
function shade(h, k) { const r = hexToRgb(h); return rgbToHex(r.map(v => k < 0 ? v * (1 + k) : v + (255 - v) * k)); }
function mix(a, b, k) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * k)); }

// ---- point helpers
function densify(P, closed, step = 12) {
  const out = []; const n = P.length; const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]); const k = Math.max(1, Math.ceil(d / step));
    for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  if (!closed) out.push(P[n - 1]);
  return out;
}
function jit(P, amp) {
  if (!amp) return P;
  const s = SEED * 3.17 + BOIL * 11.31;
  return P.map(p => [
    p[0] + (vnoise(p[0] * 0.04 + s, p[1] * 0.04) - 0.5) * 2 * amp,
    p[1] + (vnoise(p[0] * 0.04 + 37.7, p[1] * 0.04 + s) - 0.5) * 2 * amp]);
}
function cr(Cp, closed = true, seg = 8) {
  const out = []; const n = Cp.length; const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = Cp[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)], p1 = Cp[i], p2 = Cp[(i + 1) % n], p3 = Cp[closed ? (i + 2) % n : Math.min(i + 2, n - 1)];
    for (let j = 0; j < seg; j++) {
      const t = j / seg, t2 = t * t, t3 = t2 * t;
      const f = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  if (!closed) out.push(Cp[n - 1]);
  return out;
}
function ell(cx, cy, rx, ry, n = 36, a0 = 0, a1 = Math.PI * 2) {
  const o = []; const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const N = full ? n : n + 1;
  for (let i = 0; i < N; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return o;
}
function rectP(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function rrP(x, y, w, h, r) {
  const o = []; const q = Math.PI / 2;
  const cs = [[x + w - r, y + r, -q], [x + w - r, y + h - r, 0], [x + r, y + h - r, q], [x + r, y + r, 2 * q]];
  for (const [cx, cy, a] of cs) for (let i = 0; i <= 5; i++) { const b = a + q * i / 5; o.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r]); }
  return o;
}
function archP(x, y, w, h) { // arch opening: bottom-left at (x, y+h), round top
  const r = w / 2; const o = [[x, y + h]];
  for (let i = 0; i <= 16; i++) { const a = Math.PI + Math.PI * i / 16; o.push([x + r + Math.cos(a) * r, y + r + Math.sin(a) * r]); }
  o.push([x + w, y + h]); return o;
}
function tube(pts, w0, w1) { // closed polygon around polyline
  const P = cr(pts, false, 6); const L = [], R = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(w0, w1, i / (P.length - 1)) / 2;
    L.push([P[i][0] - dy * w, P[i][1] + dx * w]); R.push([P[i][0] + dy * w, P[i][1] - dx * w]);
  }
  return L.concat(R.reverse());
}
function tf(P, dx, dy, sx = 1, sy = sx, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return P.map(p => { const x = p[0] * sx, y = p[1] * sy; return [x * c - y * s + dx, x * s + y * c + dy]; });
}
function bbox(P) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of P) { if (p[0] < a) a = p[0]; if (p[1] < b) b = p[1]; if (p[0] > c) c = p[0]; if (p[1] > d) d = p[1]; } return [a, b, c, d]; }
function centroid(P) { let x = 0, y = 0; for (const p of P) { x += p[0]; y += p[1]; } return [x / P.length, y / P.length]; }

function pathP(P, closed) { const c = CTX; c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); if (closed) c.closePath(); }

// main shape primitive: crayon fill + hatching + wobbly double pencil outline
function S(P, o = {}) {
  const c = CTX; const closed = o.closed !== false;
  const amp = o.amp ?? 1.5;
  const D = jit(densify(P, closed, o.step || 11), amp);
  c.save();
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  if (o.fill && closed) {
    pathP(D, true); c.fillStyle = o.fill; c.fill();
    if (o.hatch !== false) {
      c.save(); c.clip();
      hatchBox(bbox(D), o.hcol || shade(o.fill, -0.25), o.hang ?? -58, o.hgap ?? 7, o.halpha ?? 0.32, o.hlw ?? 1.7);
      if (o.hatch2) hatchBox(bbox(D), o.hcol2 || shade(o.fill, -0.35), (o.hang ?? -58) + 75, o.hgap2 ?? 9, o.halpha2 ?? 0.22, 1.5);
      if (o.light) hatchBox(bbox(D), shade(o.fill, 0.35), (o.hang ?? -58) + 20, 11, 0.25, 2.2);
      c.restore();
    }
  }
  if (o.stroke !== false && o.lw !== 0) {
    const lw = o.lw ?? 3.2;
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = o.stroke || C.ink;
    const ga = c.globalAlpha;
    c.globalAlpha = ga * (o.salpha ?? 0.88); c.lineWidth = lw; pathP(D, closed); c.stroke();
    SEED += 7.7; const D2 = jit(D, amp * 0.9); SEED -= 7.7;
    c.globalAlpha = ga * 0.4 * (o.salpha ?? 1); c.lineWidth = lw * 0.5; pathP(D2, closed); c.stroke();
  }
  c.restore();
  return D;
}
function L(P, o = {}) { return S(P, Object.assign({ closed: false }, o)); }

function hatchBox(bb, col, angDeg, gap, alpha, lw) {
  const c = CTX; const ang = angDeg * Math.PI / 180;
  c.save(); c.strokeStyle = col; c.globalAlpha *= alpha; c.lineWidth = lw; c.lineCap = 'round';
  const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2; const R = Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) / 2 + 4;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  c.beginPath(); let k = 0;
  for (let d = -R; d <= R; d += gap) {
    k++;
    const j = (hash(k * 1.73 + SEED * 0.31 + BOIL * 0.37) - 0.5) * gap * 0.7;
    const dd = d + j; const r0 = R * (0.8 + 0.2 * hash(k + 3.1 + BOIL));
    const px = cx - sa * dd, py = cy + ca * dd;
    c.moveTo(px - ca * r0, py - sa * r0); c.lineTo(px + ca * r0, py + sa * r0);
  }
  c.stroke(); c.restore();
}

function glow(x, y, r, col, a) {
  const c = CTX; c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.45, `rgba(${col},${a * 0.35})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
}
function shadowEll(x, y, rx, ry, a = 0.22) {
  const c = CTX; c.save(); c.globalAlpha *= a; c.fillStyle = C.ink;
  pathP(jit(ell(x, y, rx, ry, 30), 1.2), true); c.fill(); c.restore();
}
function withT(x, y, s, fn, rot = 0, sy) { const c = CTX; c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(s, sy ?? s); fn(); c.restore(); }
function alphaDo(a, fn) { if (a <= 0.002) return; const c = CTX; c.save(); c.globalAlpha *= a; fn(); c.restore(); }
function seeded(s, fn) { const o = SEED; SEED = s; fn(); SEED = o; }

// scribble text lines (illegible handwriting marks for documents)
function scribbleLines(x, y, w, h, n, reveal = 1, col = C.inkSoft, lw = 2.2) {
  const c = CTX; c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.globalAlpha *= 0.75;
  const gap = h / n;
  for (let i = 0; i < n; i++) {
    const lr = clamp(reveal * n - i); if (lr <= 0) break;
    const lw2 = w * (i === n - 1 ? 0.6 : (0.82 + 0.18 * hash(i + SEED)));
    const yy = y + i * gap + gap * 0.5;
    c.beginPath();
    const steps = Math.floor(lw2 / 5 * lr);
    for (let k = 0; k <= steps; k++) {
      const xx = x + k * 5;
      const wy = Math.sin(k * 1.9 + i * 3 + SEED) * gap * 0.16 + (hash(k * 0.7 + i * 13 + SEED) - 0.5) * gap * 0.18;
      if (k === 0) c.moveTo(xx, yy + wy); else c.lineTo(xx, yy + wy);
    }
    c.stroke();
  }
  c.restore();
}
