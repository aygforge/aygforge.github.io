// ---------- core drawing library: colored-pencil look ----------
const W = 1080, H = 1920;
const C = {
  navy: '#1d2142', ink: '#232646', purple: '#2c2445', charcoal: '#3b3c45',
  cream: '#f1e8d4', cream2: '#e8dcc2', paper: '#f4ecda',
  yellow: '#f3dc92', beam: '255,238,190', green: '#66724a', green2: '#4f5a39',
  orange: '#e8843a', orange2: '#f2a64a', smoke: '#6b6e7c', brass: '#c9a55a',
  sky1: '#11162f', sky2: '#262c55', night: '#1a1f3d', skin: '#dcb791', red: '#b9533f',
  ocean: '#1b2a45', mapsea: '#9fb3bf', land: '#e3d3a8'
};
let ctx = null;          // current target context
let BOIL = 0;            // hand-drawn "boil" frame (changes 8x / second)
let T = 0;               // absolute time

function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function h1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function h2(x, y, b) { const s = Math.sin(x * 12.9898 + y * 78.233 + b * 37.719) * 43758.5453; return s - Math.floor(s); }
function J(x, y, a) { return (h2(x * 0.37, y * 0.29, BOIL) - 0.5) * 2 * a; }
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const easeOut = k => { k = clamp(k); return 1 - (1 - k) * (1 - k) * (1 - k); };
const easeIn = k => { k = clamp(k); return k * k * k; };
const seg = (t, a, b) => clamp((t - a) / (b - a));

// ---- paths ----
function subdiv(pts, closed, step = 70) {
  const out = []; const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
    const d = Math.hypot(x1 - x0, y1 - y0), k = Math.max(1, Math.round(d / step));
    for (let j = 0; j < k; j++) out.push([x0 + (x1 - x0) * j / k, y0 + (y1 - y0) * j / k]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
function P(pts, closed = true, a = 1.8, step = 70) {
  const q = subdiv(pts, closed, step), p = new Path2D();
  q.forEach(([x, y], i) => { const jx = x + J(x, y, a), jy = y + J(y + 7.7, x, a); i ? p.lineTo(jx, jy) : p.moveTo(jx, jy); });
  if (closed) p.closePath(); return p;
}
function PS(pts, closed = true, a = 1.8) { // smooth
  const q = pts.map(([x, y]) => [x + J(x, y, a), y + J(y + 7.7, x, a)]); const p = new Path2D(); const n = q.length;
  if (closed) {
    const m = (i) => [(q[i % n][0] + q[(i + 1) % n][0]) / 2, (q[i % n][1] + q[(i + 1) % n][1]) / 2];
    let s = m(0); p.moveTo(s[0], s[1]);
    for (let i = 1; i <= n; i++) { const c = q[i % n], e = m(i); p.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
    p.closePath();
  } else {
    p.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < n - 1; i++) { const e = [(q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2]; p.quadraticCurveTo(q[i][0], q[i][1], e[0], e[1]); }
    p.lineTo(q[n - 1][0], q[n - 1][1]);
  }
  return p;
}
function ell(cx, cy, rx, ry, n = 20, a = 1.5) { const pts = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); } return PS(pts, true, a); }
function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function R(x, y, w, h, a = 1.6) { return P(rectPts(x, y, w, h), true, a); }

// ---- pencil hatch patterns ----
const _hatch = {};
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = clamp(Math.round(r * k), 0, 255); g = clamp(Math.round(g * k), 0, 255); b = clamp(Math.round(b * k), 0, 255); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
function hatch(col) {
  if (_hatch[col]) return _hatch[col];
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const r = mulberry(col.length * 99 + parseInt(col.slice(1), 16) % 997);
  g.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const x = r() * 256, y = r() * 256, L = 6 + r() * 20, a = -1.05 + (r() - 0.5) * 0.7;
    g.strokeStyle = r() < 0.6 ? shade(col, 0.8) : shade(col, 1.15); g.globalAlpha = 0.12 + r() * 0.3; g.lineWidth = 1 + r() * 1.8;
    for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) { g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(a) * L, y + dy + Math.sin(a) * L); g.stroke(); }
  }
  return (_hatch[col] = ctx.createPattern(c, 'repeat'));
}
function fillP(path, col, al = 1, h = 0.6) {
  ctx.save(); ctx.globalAlpha = al * 0.88; ctx.fillStyle = col; ctx.fill(path);
  if (h > 0) { ctx.globalAlpha = al * h; ctx.fillStyle = hatch(col); ctx.fill(path); }
  ctx.restore();
}
function line(path, w = 4, col = C.navy, al = 0.92) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.globalAlpha = al; ctx.lineWidth = w; ctx.stroke(path);
  ctx.globalAlpha = al * 0.45; ctx.lineWidth = Math.max(1, w * 0.4); ctx.translate(1.6, -1.2); ctx.stroke(path); ctx.restore();
}
function shape(path, col, al = 1, w = 4, lc = C.navy, h = 0.6) { fillP(path, col, al, h); if (w > 0) line(path, w, lc, al * 0.92); }
function strokeLine(x0, y0, x1, y1, w = 4, col = C.navy, al = 0.9) { line(P([[x0, y0], [x1, y1]], false, 1.4, 50), w, col, al); }

// ---- paper ----
let PAPER, GRAIN, TOOTH;
function buildPaper() {
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  PAPER = mk(); let g = PAPER.getContext('2d');
  g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
  const r = mulberry(5);
  // soft blotches
  for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, rr = 80 + r() * 260; const gr = g.createRadialGradient(x, y, 0, x, y, rr); const cc = r() < 0.5 ? '228,212,180' : '252,247,234'; gr.addColorStop(0, `rgba(${cc},0.14)`); gr.addColorStop(1, `rgba(${cc},0)`); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  // fibers
  g.lineCap = 'round';
  for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, L = 4 + r() * 16; g.strokeStyle = r() < 0.5 ? 'rgba(160,140,105,0.22)' : 'rgba(255,255,250,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  // grain (multiply)
  GRAIN = mk(); g = GRAIN.getContext('2d'); let id = g.createImageData(W, H); let d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = 222 + Math.floor(r() * 34); d[i] = v; d[i + 1] = v - 2; d[i + 2] = v - 8; d[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  // tooth (screen): paper peeking through pencil
  TOOTH = mk(); g = TOOTH.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 30000; i++) { const x = r() * W, y = r() * H; g.fillStyle = `rgba(240,228,200,${0.1 + r() * 0.35})`; g.fillRect(x, y, 1 + r() * 1.4, 1 + r()); }
  for (let i = 0; i < 2500; i++) { const x = r() * W, y = r() * H, a = -1.0 + r() * 0.3, L = 6 + r() * 18; g.strokeStyle = `rgba(236,224,196,${0.12 + r() * 0.25})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
}
function paperBG() { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(PAPER, 0, 0); ctx.restore(); }

// full-screen night sky in pencil (drawn in current transform, generous bounds)
function nightSky(y0 = -1200, y1 = 2400, top = C.sky1, bot = C.sky2, al = 1) {
  ctx.save(); ctx.globalAlpha = al;
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(-400, y0, W + 800, y1 - y0);
  ctx.globalAlpha = al * 0.35; ctx.fillStyle = hatch(C.navy); ctx.fillRect(-400, y0, W + 800, y1 - y0);
  ctx.restore();
}
function stars(n, y0, y1, al = 0.7, seed = 3) {
  const r = mulberry(seed); ctx.save();
  for (let i = 0; i < n; i++) { const x = r() * W, y = y0 + r() * (y1 - y0), s = 1 + r() * 2.4; ctx.globalAlpha = al * (0.4 + 0.6 * Math.abs(Math.sin(T * 1.3 + i))); ctx.fillStyle = '#efe4c4'; ctx.fillRect(x, y, s, s); }
  ctx.restore();
}

// ---- searchlight beam ----
function beam(x0, y0, ang, len, w0 = 14, w1 = 150, al = 1) {
  if (al <= 0.01) return;
  const sx = Math.sin(ang), cy = -Math.cos(ang), ex = x0 + sx * len, ey = y0 + cy * len, px = -cy, py = sx;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  // halo
  let g = ctx.createLinearGradient(x0, y0, ex, ey);
  g.addColorStop(0, `rgba(${C.beam},${0.20 * al})`); g.addColorStop(1, `rgba(${C.beam},0)`);
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(x0 + px * w0 * 1.6, y0 + py * w0 * 1.6); ctx.lineTo(ex + px * w1 * 1.5, ey + py * w1 * 1.5);
  ctx.lineTo(ex - px * w1 * 1.5, ey - py * w1 * 1.5); ctx.lineTo(x0 - px * w0 * 1.6, y0 - py * w0 * 1.6); ctx.fill();
  // core
  g = ctx.createLinearGradient(x0, y0, ex, ey);
  g.addColorStop(0, `rgba(${C.beam},${0.62 * al})`); g.addColorStop(0.5, `rgba(${C.beam},${0.26 * al})`); g.addColorStop(1, `rgba(${C.beam},0)`);
  ctx.fillStyle = g; ctx.beginPath();
  const j = J(x0, ang * 100, 2);
  ctx.moveTo(x0 + px * w0 / 2, y0 + py * w0 / 2); ctx.lineTo(ex + px * (w1 / 2 + j), ey + py * (w1 / 2 + j));
  ctx.lineTo(ex - px * (w1 / 2 - j), ey - py * (w1 / 2 - j)); ctx.lineTo(x0 - px * w0 / 2, y0 - py * w0 / 2); ctx.fill();
  // pencil strokes along the beam
  ctx.lineCap = 'round';
  const rs = mulberry(Math.floor(x0 * 7 + 13) + BOIL * 101);
  for (let k = 0; k < 7; k++) {
    const f = (rs() - 0.5) * 0.8, a0 = 0.05 + rs() * 0.35, a1 = a0 + 0.15 + rs() * 0.35;
    const qx = (q) => x0 + sx * len * q + px * (w0 + (w1 - w0) * q) * f, qy = (q) => y0 + cy * len * q + py * (w0 + (w1 - w0) * q) * f;
    ctx.strokeStyle = `rgba(${C.beam},${(0.12 + rs() * 0.22) * al})`; ctx.lineWidth = 1.5 + rs() * 2;
    ctx.beginPath(); ctx.moveTo(qx(a0), qy(a0)); ctx.lineTo(qx(a1), qy(a1)); ctx.stroke();
  }
  ctx.restore();
}
function lightUnit(x, y, ang, s = 1, on = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(P([[-30, 6], [30, 6], [18, -16], [-18, -16]], true, 1), C.green2, 1, 3);
  ctx.save(); ctx.translate(0, -24); ctx.rotate(ang);
  shape(R(-22, -26, 44, 40, 1), C.green, 1, 3);
  shape(ell(0, -28, 22, 7, 14, 1), on > 0 ? '#fff2c4' : '#7c7f6a', 1, 2.5);
  ctx.restore(); ctx.restore();
}

// ---- flak burst ----
function flak(x, y, age, s = 1, smoke = 1, seed = 0) {
  if (age < 0 || age > 4.5) return;
  ctx.save(); ctx.translate(x, y);
  // smoke
  if (age > 0.06 && smoke > 0) {
    const a = smoke * 0.75 * (1 - clamp((age - 0.4) / 4.1)) * clamp((age - 0.06) / 0.2);
    const rr = s * (16 + Math.sqrt(age) * 22), r = mulberry(seed * 13 + 7);
    const pts = [];
    ctx.translate(age * 9 * s, -age * 4 * s);
    for (let i = 0; i < 7; i++) { const ang = r() * 6.28, d = r() * rr * 0.8; pts.push([Math.cos(ang) * d, Math.sin(ang) * d * 0.7, rr * (0.55 + r() * 0.45)]); }
    const p = new Path2D(); pts.forEach(([px, py, pr]) => p.addPath(ell(px, py, pr, pr * 0.85, 12, 1.4)));
    fillP(p, '#5a5d6e', a * 0.85, 0.8);
    const hp = new Path2D(); pts.slice(0, 4).forEach(([px, py, pr]) => hp.addPath(ell(px - pr * 0.2, py - pr * 0.25, pr * 0.6, pr * 0.45, 10, 1.2)));
    fillP(hp, '#8d8f9c', a * 0.55, 0.8);
    ctx.save(); ctx.globalAlpha = a * 0.3; ctx.strokeStyle = '#2a2c3d'; ctx.lineWidth = 2; ctx.stroke(p); ctx.restore();
    ctx.translate(-age * 9 * s, age * 4 * s);
  }
  // flash
  if (age < 0.3) {
    const k = age / 0.3, rad = s * (45 + 95 * easeOut(k)), al = 1 - k * k;
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
    g.addColorStop(0, `rgba(255,240,190,${al})`); g.addColorStop(0.35, `rgba(240,150,70,${0.9 * al})`); g.addColorStop(1, 'rgba(232,132,58,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rad, 0, 7); ctx.fill();
    ctx.strokeStyle = `rgba(255,200,120,${al})`; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
    const r = mulberry(seed + 3);
    for (let i = 0; i < 9; i++) { const a = r() * 6.28, l0 = rad * 0.25, l1 = rad * (0.7 + r() * 0.5); ctx.beginPath(); ctx.moveTo(Math.cos(a) * l0, Math.sin(a) * l0); ctx.lineTo(Math.cos(a) * l1, Math.sin(a) * l1); ctx.stroke(); }
  }
  ctx.restore();
}
function glowAt(x, y, r, col = '240,150,70', al = 1) {
  if (al <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'screen';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${al})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function tracer(x0, y0, x1, y1, k, al = 1) { // k: 0..1 progress
  if (k <= 0 || k >= 1.3) return;
  const a = clamp(k), b = clamp(k - 0.18);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(lerp(x0, x1, b), lerp(y0, y1, b), lerp(x0, x1, a), lerp(y0, y1, a));
  g.addColorStop(0, 'rgba(242,166,74,0)'); g.addColorStop(1, `rgba(255,214,140,${al * (k > 1 ? 1.3 - k : 1) / 1})`);
  ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lerp(x0, x1, b), lerp(y0, y1, b)); ctx.lineTo(lerp(x0, x1, a), lerp(y0, y1, a)); ctx.stroke();
  ctx.restore();
}

// ---- 1942 skyline ----
const BLD = [];
(function () {
  const r = mulberry(1942); let x = -80;
  while (x < 1160) {
    const w = 62 + r() * 100, h = 110 + r() * 230;
    if (x > 400 && x < 640) { x = 640; continue; }
    BLD.push({ x, w, h, type: r() < 0.33 ? 'step' : r() < 0.5 ? 'tank' : 'flat', s: Math.floor(r() * 1000) }); x += w + r() * 10 - 2;
  }
})();
function skyline(baseY, o = {}) {
  const col = o.col || '#262a45', win = o.win || '#f2d47c', lit = o.lit || (() => 1), al = o.al ?? 1, outline = o.outline ?? '#14172c';
  ctx.save(); ctx.translate(0, baseY); ctx.globalAlpha = al;
  // back layer
  const r = mulberry(77);
  const back = []; let x = -60; while (x < 1140) { const w = 50 + r() * 80, h = 160 + r() * 260; back.push([x, h, w]); x += w; }
  const bp = new Path2D(); back.forEach(([bx, bh, bw]) => bp.addPath(R(bx, -bh, bw, bh + 4, 1.2)));
  fillP(bp, shade(col, 1.25), 1, 0.4);
  const all = BLD.slice();
  const drawB = (b, i) => {
    const p = new Path2D(); p.addPath(R(b.x, -b.h, b.w, b.h + 6));
    if (b.type === 'step') p.addPath(R(b.x + b.w * 0.2, -b.h - 50, b.w * 0.6, 54));
    shape(p, col, 1, 3, outline, 0.55);
    if (b.type === 'tank') { shape(P([[b.x + b.w * 0.55, -b.h - 46], [b.x + b.w * 0.85, -b.h - 46], [b.x + b.w * 0.85, -b.h - 18], [b.x + b.w * 0.55, -b.h - 18]]), col, 1, 2.5, outline); strokeLine(b.x + b.w * 0.58, -b.h - 18, b.x + b.w * 0.58, -b.h, 2, outline); strokeLine(b.x + b.w * 0.82, -b.h - 18, b.x + b.w * 0.82, -b.h, 2, outline); }
    windows(b.x, -b.h, b.w, b.h, b.s, lit, win, i);
  };
  all.forEach(drawB);
  // City Hall (center)
  const ch = new Path2D();
  ch.addPath(R(455, -330, 170, 336)); ch.addPath(R(485, -455, 110, 128)); ch.addPath(R(505, -545, 70, 94));
  ch.addPath(P([[500, -545], [540, -640], [580, -545]], true, 1.2));
  shape(ch, shade(col, 0.95), 1, 3.2, outline, 0.55);
  windows(455, -330, 170, 330, 11, lit, win, 900); windows(485, -455, 110, 120, 12, lit, win, 901); windows(505, -540, 70, 80, 13, lit, win, 902);
  ctx.restore();
}
function windows(x, y, w, h, s, lit, win, bi) {
  const cols = Math.max(1, Math.floor((w - 12) / 22)), rows = Math.max(1, Math.floor((h - 20) / 30));
  const ox = x + (w - cols * 22) / 2 + 6;
  for (let i = 0; i < cols; i++) for (let k = 0; k < rows; k++) {
    const hh = h2(i + s, k * 3.1, 0.5);
    if (hh > 0.62) continue;
    const L = lit(bi, i, k, hh);
    if (L <= 0.02) { ctx.fillStyle = 'rgba(10,12,30,0.35)'; ctx.fillRect(ox + i * 22, y + 14 + k * 30, 10, 14); continue; }
    ctx.globalAlpha = L * 0.92; ctx.fillStyle = win; ctx.fillRect(ox + i * 22 + J(i, k, 0.6), y + 14 + k * 30, 10, 14); ctx.globalAlpha = 1;
  }
}
function palm(x, y, h, col = '#1b1e33', sway = 0) {
  const tx = x + h * 0.12 + sway, ty = y - h;
  line(PS([[x, y], [x + h * 0.06, y - h * 0.5], [tx, ty]], false, 1), 7, col, 1);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.48 + Math.sin(T * 1.2 + i) * 0.04, L = h * 0.38;
    const mx = tx + Math.cos(a) * L * 0.6, my = ty + Math.sin(a) * L * 0.6 - 14;
    line(PS([[tx, ty], [mx, my], [tx + Math.cos(a) * L, ty + Math.sin(a) * L + 34]], false, 1), 5, col, 1);
  }
}

// ---- anti-aircraft gun (3-inch style) ----
function aaGun(x, y, s, elev, o = {}) { // elev radians above horizontal; faces right unless flip
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  const col = o.col || C.green, dk = o.dark || C.green2, lc = o.lc || C.navy;
  // outriggers
  shape(P([[-170, 0], [170, 0], [150, -16], [-150, -16]]), dk, 1, 3, lc);
  shape(P([[-60, -12], [60, -12], [42, -60], [-42, -60]]), col, 1, 3.5, lc);
  shape(ell(0, -68, 46, 16, 16, 1), dk, 1, 3, lc);
  // cradle + barrel
  ctx.save(); ctx.translate(0, -84); ctx.rotate(-elev);
  const rc = -(o.recoil || 0) * 26;
  shape(R(-70 + rc, -20, 120, 40), col, 1, 3.5, lc);
  shape(R(-40 + rc, 14, 140, 16), dk, 1, 3, lc);
  shape(R(40 + rc, -9, 250, 18), shade(col, 0.9), 1, 3.5, lc);
  shape(R(282 + rc, -13, 30, 26), dk, 1, 3, lc);
  if (o.flash > 0) {
    const f = o.flash; ctx.save(); ctx.translate(318 + rc, 0);
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(40, 0, 0, 40, 0, 120 * f + 20); g.addColorStop(0, `rgba(255,240,190,${f})`); g.addColorStop(0.4, `rgba(242,150,60,${0.9 * f})`); g.addColorStop(1, 'rgba(232,132,58,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(50, 0, 130 * f + 20, 60 * f + 10, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // shield seat
  shape(P([[-30, -60], [-55, -60], [-60, -95], [-36, -95]]), dk, 1, 2.5, lc);
  ctx.restore();
}
function sandbags(x, y, w, rows = 3, col = '#8d7a55', lc = C.navy) {
  for (let r = 0; r < rows; r++) {
    const n = Math.floor(w / 62); const off = (r % 2) * 31;
    for (let i = 0; i < n; i++) shape(ell(x + off + i * 62, y - r * 28, 34, 16, 12, 1.4), col, 1, 2.5, lc, 0.7);
  }
}

// ---- people ----
function person(x, y, s, o = {}) {
  const col = o.col || '#3d4466', skin = o.skin || C.skin, lc = o.lc || C.navy, look = o.look || [0, 0];
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  if (!o.sit) {
    shape(P([[-18, 0], [-15, -78], [-2, -78], [-3, 0]]), o.legs || '#2b2e45', 1, 3, lc);
    shape(P([[3, 0], [2, -78], [15, -78], [18, 0]]), o.legs || '#2b2e45', 1, 3, lc);
  }
  const by = o.sit ? 60 : 0;
  shape(PS([[-30, -70 + by], [-28, -130 + by], [-14, -150 + by], [14, -150 + by], [28, -130 + by], [30, -70 + by]], true, 1.2), col, 1, 3.5, lc);
  // arms
  const arm = o.arm || 'down';
  const armPts = {
    down: [[[-24, -138], [-36, -100], [-34, -72]], [[24, -138], [36, -100], [34, -72]]],
    up: [[[-24, -138], [-36, -100], [-34, -72]], [[24, -138], [48, -175], [62, -215]]],
    ears: [[[-24, -138], [-44, -160], [-24, -178]], [[24, -138], [44, -160], [24, -178]]],
    hug: [[[-24, -138], [-10, -110], [16, -112]], [[24, -138], [30, -112], [10, -100]]],
    radio: [[[-24, -138], [-6, -112], [22, -110]], [[24, -138], [40, -112], [58, -108]]],
    point: [[[-24, -138], [-36, -100], [-34, -72]], [[24, -138], [60, -150], [96, -170]]],
  }[arm];
  armPts.forEach(a => line(PS(a.map(([ax, ay]) => [ax, ay + by]), false, 1), 13, col, 1));
  armPts.forEach(a => line(PS(a.map(([ax, ay]) => [ax, ay + by]), false, 1), 3, lc, 0.8));
  // head
  const hy = -172 + by;
  shape(ell(0, hy, 21, 23, 14, 1), skin, 1, 3, lc, 0.45);
  if (o.hair) shape(PS([[-21, hy - 2], [-18, hy - 20], [0, hy - 26], [18, hy - 20], [21, hy - 2], [12, hy - 14], [-12, hy - 14]], true, 1), o.hair, 1, 2.5, lc);
  if (o.helmet === 'brodie') { shape(ell(0, hy - 14, 38, 8, 14, 1), C.green2, 1, 3, lc); shape(ell(0, hy - 20, 20, 13, 12, 1), C.green, 1, 3, lc); }
  if (o.helmet === 'warden') { shape(ell(0, hy - 14, 32, 7, 14, 1), '#e8e2cf', 1, 3, lc); shape(ell(0, hy - 20, 19, 13, 12, 1), '#e8e2cf', 1, 3, lc); }
  if (o.helmet === 'phones') { line(PS([[-22, hy], [-18, hy - 26], [18, hy - 26], [22, hy]], false, 1), 4, lc); shape(ell(-22, hy + 2, 7, 10, 10, 1), '#333', 1, 2, lc); shape(ell(22, hy + 2, 7, 10, 10, 1), '#333', 1, 2, lc); }
  // eyes
  ctx.fillStyle = lc;
  ctx.beginPath(); ctx.arc(-8 + look[0], hy - 1 + look[1], 3, 0, 7); ctx.arc(8 + look[0], hy - 1 + look[1], 3, 0, 7); ctx.fill();
  if (o.worried) { ctx.strokeStyle = lc; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-13, hy - 11); ctx.lineTo(-4, hy - 8); ctx.moveTo(13, hy - 11); ctx.lineTo(4, hy - 8); ctx.stroke(); }
  ctx.restore();
}

// ---- props ----
function radio(x, y, s, needle = 0, glow = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(PS([[-70, 0], [-70, -110], [-55, -160], [0, -185], [55, -160], [70, -110], [70, 0]], true, 1.2), '#8a5a3a', 1, 3.5);
  shape(PS([[-48, -70], [-48, -120], [0, -150], [48, -120], [48, -70]], true, 1), '#c9a26e', 1, 2.5);
  for (let i = -3; i <= 3; i++) strokeLine(i * 12, -140 + Math.abs(i) * 4, i * 12, -74, 2, '#5a3a22', 0.8);
  shape(ell(0, -38, 30, 14, 14, 1), '#f1d9a0', 1, 2.5);
  glowAt(0, -38, 50, '242,200,120', 0.35 * glow);
  strokeLine(-6 + needle * 18, -48, -6 + needle * 18, -28, 2.5, C.red);
  shape(ell(-46, -24, 8, 8, 10, 1), '#3a2a1e', 1, 2); shape(ell(46, -24, 8, 8, 10, 1), '#3a2a1e', 1, 2);
  ctx.restore();
}
function soundArcs(x, y, s, t, col = C.navy, al = 0.8, dir = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(dir);
  for (let i = 0; i < 3; i++) { const k = (t * 1.2 + i / 3) % 1; ctx.globalAlpha = al * (1 - k); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, s * (20 + k * 60), -0.6, 0.6); ctx.stroke(); }
  ctx.restore();
}
function newspaper(x, y, w, h, rot, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = o.al ?? 1;
  ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = '#000'; ctx.fill(R(-w / 2 + 10, -h / 2 + 14, w, h)); ctx.restore();
  shape(R(-w / 2, -h / 2, w, h, 1.4), o.paper || '#efe6cf', 1, 3.5, C.navy, 0.35);
  const m = w * 0.06;
  // masthead (gothic scribble)
  line(PS([[-w / 2 + m, -h / 2 + h * 0.07], ...Array.from({ length: 14 }, (_, i) => [-w / 2 + m + (i + 1) * (w - 2 * m) / 15, -h / 2 + h * 0.07 + (i % 2 ? -h * 0.02 : h * 0.02)])], false, 1), Math.max(3, w * 0.012), C.navy, 0.85);
  strokeLine(-w / 2 + m, -h / 2 + h * 0.12, w / 2 - m, -h / 2 + h * 0.12, 2.5, C.navy, 0.7);
  // headline bars
  const hb = o.headline ?? 2;
  for (let i = 0; i < hb; i++) shape(R(-w / 2 + m, -h / 2 + h * (0.16 + i * 0.075), (w - 2 * m) * (i ? 0.7 : 1), h * 0.05, 1.2), C.navy, 0.9, 0, C.navy, 0.5);
  // picture box
  const py = -h / 2 + h * (0.17 + hb * 0.075), ph = h * 0.36;
  ctx.save(); const box = R(-w / 2 + m, py, (w - 2 * m) * 0.62, ph); shape(box, o.picBg || '#d9d2bf', 1, 3); ctx.clip(box);
  if (o.pic) o.pic(-w / 2 + m, py, (w - 2 * m) * 0.62, ph);
  ctx.restore();
  // text columns
  const cx0 = -w / 2 + m + (w - 2 * m) * 0.66, cw = (w - 2 * m) * 0.34;
  for (let k = 0; k < 9; k++) strokeLine(cx0, py + 10 + k * ph / 9, cx0 + cw * (0.7 + 0.3 * h1(k)), py + 10 + k * ph / 9, 2, '#6b6a78', 0.6);
  const ty = py + ph + h * 0.04;
  for (let c = 0; c < 3; c++) for (let k = 0; k < Math.floor((h / 2 - ty - m) / 22); k++) { const cxx = -w / 2 + m + c * (w - 2 * m) / 3; strokeLine(cxx + 4, ty + k * 22, cxx + (w - 2 * m) / 3 - 14 - 20 * h1(c * 9 + k), ty + k * 22, 2, '#6b6a78', 0.55); }
  ctx.restore();
}
