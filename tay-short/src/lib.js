'use strict';
// ---------- hand-drawn / colored-pencil drawing toolkit ----------
const W = 1080, H = 1920;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let g = ctx;      // current drawing context
let BOIL = 0;     // line-boil frame (8 fps)
let NOW = 0;

const C = {
  paper: '#f3ead7', white: '#fdf9ee', ink: '#2a2750', inkSoft: '#5b5788',
  cyan: '#62bccb', cyanL: '#c3e6e8', mag: '#d6789f', magL: '#f2c6d8',
  blue: '#4f7dd0', blueL: '#bccff0', yellow: '#efc75e', yellowL: '#f6e2a6',
  orange: '#e8955a', green: '#74b872', red: '#d75f58', grey: '#b4b1c0',
  greyL: '#dcd9e3', greyD: '#6f6b82', dark: '#2f2a45', body: '#454070',
  skin: '#f6dcc0', hair: '#5a4a8a',
};

function rng(seed) {
  let a = (Math.floor(seed * 1000) * 2654435761) >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const hsh = (i, k = 0) => rng(i * 131.7 + k * 17.3 + 0.5)();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const eo = x => 1 - Math.pow(1 - x, 3);
const lin = x => x;
const back = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const pop = (t, t0, d = .38) => { const x = seg(t, t0, t0 + d); return x <= 0 ? 0 : back(x); };
function kf(t, keys, e = eio) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, e(seg(t, t0, t1))); }
  }
  return keys[keys.length - 1][1];
}
// fade window: in over [a,a+fi], out over [b,b+fo]
const win = (t, a, b, fi = .35, fo = .35) => Math.min(seg(t, a, a + fi), 1 - seg(t, b, b + fo));
function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(c1, c2, t) { const a = hex(c1), b = hex(c2); t = clamp(t); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join(''); }

function A(alpha, fn) { if (alpha <= 0.004) return; g.save(); g.globalAlpha *= clamp(alpha); fn(); g.restore(); }
function TR(cx, cy, sc, rot, fn) { g.save(); g.translate(cx, cy); if (rot) g.rotate(rot); g.scale(sc, sc); g.translate(-cx, -cy); fn(); g.restore(); }

// ---------- point generators ----------
function rrectPts(x, y, w, h, r, step = 26) {
  const pts = []; r = Math.max(1, Math.min(r, w / 2, h / 2));
  const line = (x1, y1, x2, y2) => { const L = Math.hypot(x2 - x1, y2 - y1); const n = Math.max(1, Math.round(L / step)); for (let i = 0; i < n; i++) pts.push([lerp(x1, x2, i / n), lerp(y1, y2, i / n)]); };
  const arc = (cx, cy, a0) => { const n = Math.max(2, Math.round(r * Math.PI / 2 / step) + 1); for (let i = 0; i < n; i++) { const a = a0 + Math.PI / 2 * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  line(x + r, y, x + w - r, y); arc(x + w - r, y + r, -Math.PI / 2);
  line(x + w, y + r, x + w, y + h - r); arc(x + w - r, y + h - r, 0);
  line(x + w - r, y + h, x + r, y + h); arc(x + r, y + h - r, Math.PI / 2);
  line(x, y + h - r, x, y + r); arc(x + r, y + r, Math.PI);
  return pts;
}
function ellPts(cx, cy, rx, ry, n) { n = n || Math.max(10, Math.round((rx + ry) * Math.PI / 30)); const p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return p; }
function linePts(x1, y1, x2, y2, step = 28) { const L = Math.hypot(x2 - x1, y2 - y1); const n = Math.max(1, Math.round(L / step)); const p = []; for (let i = 0; i <= n; i++) p.push([lerp(x1, x2, i / n), lerp(y1, y2, i / n)]); return p; }
function quadPts(x1, y1, cx, cy, x2, y2, prog = 1, n = 18) { const p = []; const m = Math.max(1, Math.round(n * prog)); for (let i = 0; i <= m; i++) { const u = i / n; p.push([(1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2, (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2]); } return p; }
function jit(pts, amp, seed) { const r = rng(seed); return pts.map(p => [p[0] + (r() - .5) * 2 * amp, p[1] + (r() - .5) * 2 * amp]); }

function trace(pts, closed, sharp) {
  const n = pts.length; if (n < 2) return;
  g.beginPath();
  if (sharp) { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) g.lineTo(pts[i][0], pts[i][1]); if (closed) g.closePath(); return; }
  if (closed) {
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = m(pts[n - 1], pts[0]); g.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; const e = m(p, q); g.quadraticCurveTo(p[0], p[1], e[0], e[1]); }
    g.closePath();
  } else {
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) { const p = pts[i], q = pts[i + 1]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    g.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
}
function stroke(pts, o = {}) {
  const { color = C.ink, w = 5, closed = false, amp = 1.5, seed = 1, alpha = 1, sharp = false, dash = null } = o;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = color;
  if (dash) g.setLineDash(dash);
  g.globalAlpha *= alpha * .93; g.lineWidth = w;
  trace(jit(pts, amp, seed + BOIL * 7.13), closed, sharp); g.stroke();
  g.globalAlpha *= .42; g.lineWidth = w * .5;
  trace(jit(pts, amp * 1.7, seed + BOIL * 3.71 + 99), closed, sharp); g.stroke();
  g.restore();
}
function fill(pts, color, o = {}) {
  const { seed = 1, alpha = 1, amp = 1.5, hatch = true, ang = -0.62, gap = 10, solid = false, sharp = false, base = .6 } = o;
  const P = jit(pts, amp, seed + BOIL * 7.13);
  g.save(); g.globalAlpha *= alpha;
  trace(P, true, sharp);
  if (solid) { g.fillStyle = C.white; g.fill(); }
  g.fillStyle = color;
  g.save(); g.globalAlpha *= base; g.fill(); g.restore();
  if (hatch) {
    g.clip();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, d = Math.hypot(x1 - x0, y1 - y0) / 2 + 6;
    const r = rng(seed + Math.floor(BOIL / 2) * 5.31 + 7);
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    g.strokeStyle = color; g.lineCap = 'round';
    const a0 = g.globalAlpha;
    for (let s = -d; s <= d; s += gap) {
      const o1 = (r() - .5) * 6, o2 = (r() - .5) * 6, e1 = d * (.75 + r() * .3), e2 = d * (.75 + r() * .3);
      g.globalAlpha = a0 * (.16 + r() * .34);
      g.lineWidth = gap * (.55 + r() * .5);
      g.beginPath();
      g.moveTo(cx + nx * (s + o1) - dx * e1, cy + ny * (s + o1) - dy * e1);
      g.lineTo(cx + nx * (s + o2) + dx * e2, cy + ny * (s + o2) + dy * e2);
      g.stroke();
    }
  }
  g.restore();
}
function shape(pts, color, o = {}) {
  if (color) fill(pts, color, o);
  if (o.w !== 0) stroke(pts, { color: o.stroke || C.ink, w: o.w || 5, closed: true, amp: o.amp, seed: o.seed, sharp: o.sharp, alpha: o.salpha });
}
function txt(s, x, y, size, weight = 700, color = C.ink, align = 'center') {
  g.save(); g.font = `${weight} ${size}px Kalam`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'alphabetic';
  g.fillText(s, x, y); g.restore();
}

// ---------- icons ----------
function heart(cx, cy, s, color = C.mag, seed = 3) {
  const p = []; for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; p.push([cx + s / 34 * 16 * Math.pow(Math.sin(a), 3), cy - s / 34 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]); }
  shape(p, color, { seed, w: Math.max(2.5, s * .07), gap: 7, amp: 1 });
}
function star(cx, cy, s, color = C.yellow, seed = 4, rot = 0) {
  const p = []; for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .22 : s * .5; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  shape(p, color, { seed, w: Math.max(2.5, s * .07), sharp: true, gap: 7, amp: 1 });
}
function smiley(cx, cy, s, seed = 5) {
  shape(ellPts(cx, cy, s * .5, s * .5, 14), C.yellow, { seed, w: Math.max(2.5, s * .07), gap: 7, amp: 1 });
  g.fillStyle = C.ink; g.beginPath(); g.arc(cx - s * .17, cy - s * .1, s * .06, 0, 7); g.arc(cx + s * .17, cy - s * .1, s * .06, 0, 7); g.fill();
  stroke(quadPts(cx - s * .22, cy + s * .1, cx, cy + s * .36, cx + s * .22, cy + s * .1, 1, 6), { w: Math.max(2.5, s * .07), seed: seed + 1, amp: .6 });
}
function note(cx, cy, s, color = C.blue, seed = 6) {
  shape(ellPts(cx - s * .15, cy + s * .28, s * .2, s * .15, 8), color, { seed, w: 3, gap: 6, amp: .7 });
  stroke([[cx + s * .04, cy + s * .26], [cx + s * .04, cy - s * .4], [cx + s * .34, cy - s * .22]], { w: Math.max(3, s * .09), seed: seed + 1, sharp: true, amp: .8 });
}
function warn(cx, cy, s, seed = 7) {
  const p = [[cx, cy - s * .52], [cx + s * .56, cy + s * .42], [cx - s * .56, cy + s * .42]];
  shape(p, C.yellow, { seed, w: Math.max(3, s * .075), sharp: true, solid: true, gap: 8, base: .85 });
  stroke([[cx, cy - s * .2], [cx, cy + s * .1]], { w: Math.max(3.5, s * .1), seed: seed + 1, amp: .6 });
  g.fillStyle = C.ink; g.beginPath(); g.arc(cx, cy + s * .27, Math.max(2.5, s * .06), 0, 7); g.fill();
}
function scribLine(x, y, len, seed, color = C.inkSoft, w = 4) {
  const r = rng(seed); const p = []; const ph = r() * 6;
  for (let d = 0; d <= len; d += 9) p.push([x + d, y + Math.sin(d * .21 + ph) * 4.5 + (r() - .5) * 5]);
  stroke(p, { color, w, seed, amp: .8, alpha: .85 });
}
function darkScrib(cx, cy, rx, ry, seed, color = C.dark, w = 6) {
  const r = rng(seed + Math.floor(BOIL / 2) * 1.91); const p = [];
  const n = 26;
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, q = Math.sqrt(r()); p.push([cx + Math.cos(a) * rx * q * (i % 3 ? 1 : .5), cy + Math.sin(a) * ry * q]); }
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = color; g.lineWidth = w; g.globalAlpha *= .9;
  trace(p, false); g.stroke();
  g.lineWidth = w * .5; g.globalAlpha *= .6; trace(jit(p, 5, seed + 3), false); g.stroke();
  g.restore();
}
function corrupt(cx, cy, w, h, seed) {
  const r = rng(seed + Math.floor(BOIL / 2) * 2.3);
  const cols = [C.dark, C.dark, C.mag, C.cyan, C.greyD];
  const rows = 3, rh = h / rows;
  for (let j = 0; j < rows; j++) {
    let x = cx - w / 2 + (r() - .5) * 14;
    while (x < cx + w / 2 - 12) {
      const bw = 12 + r() * 46, bh = rh * (.45 + r() * .4);
      const c = cols[Math.floor(r() * cols.length)];
      g.save(); g.globalAlpha *= .85; g.fillStyle = c;
      g.fillRect(x, cy - h / 2 + j * rh + (rh - bh) / 2 + (r() - .5) * 6, Math.min(bw, cx + w / 2 - x), bh);
      g.restore();
      x += bw + 6 + r() * 10;
    }
  }
}
function arrow(pts, o = {}) {
  const { color = C.ink, w = 5, seed = 1, head = 22, alpha = 1, dash = null } = o;
  if (pts.length < 2) return;
  stroke(pts, { color, w, seed, alpha, dash, amp: 1.2 });
  const a = pts[pts.length - 1], b = pts[Math.max(0, pts.length - 3)];
  const an = Math.atan2(a[1] - b[1], a[0] - b[0]);
  stroke([[a[0] - head * Math.cos(an - .5), a[1] - head * Math.sin(an - .5)], a, [a[0] - head * Math.cos(an + .5), a[1] - head * Math.sin(an + .5)]], { color, w, seed: seed + 1, alpha, sharp: true, amp: .8 });
}

// chat bubble with unreadable content
function bubble(cx, cy, w, h, o = {}) {
  const { col = C.white, side = 'l', content = 'lines', seed = 1, tail = true, sw = 4.5 } = o;
  const x = cx - w / 2, y = cy - h / 2;
  if (tail) {
    const tx = side === 'l' ? x + w * .2 : x + w * .8, d = side === 'l' ? -1 : 1;
    shape([[tx - h * .14, y + h - 8], [tx + h * .14, y + h - 8], [tx + d * h * .2, y + h + h * .24]], col, { seed: seed + 5, w: sw, sharp: true, solid: true });
  }
  shape(rrectPts(x, y, w, h, Math.min(h * .42, 36), 22), col, { seed, w: sw, solid: true });
  const ic = h * .56, lx = x + h * .22;
  const lines = (f1, f2) => { scribLine(lx, cy - h * .14, w * f1, seed + 11, C.inkSoft, Math.max(3, h * .04)); scribLine(lx, cy + h * .16, w * f2, seed + 12, C.inkSoft, Math.max(3, h * .04)); };
  switch (content) {
    case 'lines': lines(.68, .45); break;
    case 'heart': lines(.42, .3); heart(x + w - h * .5, cy, ic, C.mag, seed + 2); break;
    case 'smile': lines(.42, .3); smiley(x + w - h * .5, cy, ic, seed + 2); break;
    case 'star': lines(.42, .3); star(x + w - h * .5, cy, ic * 1.1, C.yellow, seed + 2); break;
    case 'note': lines(.42, .3); note(x + w - h * .5, cy, ic, C.blue, seed + 2); break;
    case 'tri': scribLine(lx, cy, w * .36, seed + 11, C.inkSoft, Math.max(3, h * .04));
      shape([[x + w - h * .55, cy - ic * .45], [x + w - h * .2, cy + ic * .4], [x + w - h * .9, cy + ic * .4]], C.blue, { seed: seed + 2, w: 3.5, sharp: true, gap: 7 }); break;
    case 'dark': darkScrib(cx, cy, w * .38, h * .3, seed + 20, C.dark, Math.max(4, h * .06)); break;
    case 'warn': darkScrib(cx - w * .16, cy, w * .25, h * .28, seed + 20, C.dark, Math.max(4, h * .06)); warn(cx + w * .29, cy, h * .64, seed + 21); break;
    case 'corrupt': corrupt(cx, cy, w * .78, h * .58, seed + 22); break;
    default: break;
  }
}

// anonymous user silhouette
const UCOL = [['#c3e6e8', '#4d9aa6'], ['#f2c6d8', '#b85f8a'], ['#f6e2a6', '#c79a2e'], ['#bccff0', '#3f66b5'], ['#cfe6c0', '#5f9a5c'], ['#f6cfae', '#c9773d'], ['#d9c8ec', '#7a5fb0'], ['#c3e6e8', '#3f66b5']];
function user(cx, cy, r, o = {}) {
  const { ci = 0, troll = 0, seed = 1, eyes = false, look = [0, 0], phone = false } = o;
  const bg = mix(UCOL[ci % 8][0], '#aeabbb', troll), fg = mix(UCOL[ci % 8][1], '#3c3852', troll);
  const circ = ellPts(cx, cy, r, r, 16);
  fill(circ, bg, { seed, solid: true, gap: 9 });
  g.save(); g.beginPath(); g.arc(cx, cy, r - 1, 0, 7); g.clip();
  fill(ellPts(cx, cy + r * .82, r * .68, r * .5, 12), fg, { seed: seed + 1, gap: 8, base: .8 });
  fill(ellPts(cx, cy - r * .16, r * .36, r * .38, 12), fg, { seed: seed + 2, gap: 8, base: .8 });
  g.restore();
  if (eyes) {
    const ex = clamp(look[0], -1, 1) * r * .07, ey = clamp(look[1], -1, 1) * r * .07;
    g.fillStyle = C.white; g.beginPath(); g.arc(cx - r * .14, cy - r * .2, r * .095, 0, 7); g.arc(cx + r * .14, cy - r * .2, r * .095, 0, 7); g.fill();
    g.fillStyle = C.ink; g.beginPath(); g.arc(cx - r * .14 + ex, cy - r * .2 + ey, r * .05, 0, 7); g.arc(cx + r * .14 + ex, cy - r * .2 + ey, r * .05, 0, 7); g.fill();
  }
  stroke(circ, { closed: true, w: Math.max(3.5, r * .07), seed });
  if (phone) {
    const px = cx + r * .62, py = cy + r * .5, pw = r * .42, ph = r * .7;
    shape(rrectPts(px - pw / 2, py - ph / 2, pw, ph, 6, 14), C.body, { seed: seed + 4, w: 3, gap: 6, solid: true, base: .9 });
    g.fillStyle = C.white; g.fillRect(px - pw * .32, py - ph * .32, pw * .64, ph * .56);
  }
}

// ---------- chatbot avatar (generic, original design) ----------
const avC = document.createElement('canvas'); avC.width = 440; avC.height = 440;
const avX = avC.getContext('2d');
function avatarRaw(mood, offline, blink) {
  const G = g; g = avX; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, 440, 440);
  shape(rrectPts(22, 22, 396, 396, 74), mix(C.blueL, '#cfccd8', offline), { seed: 41, w: 8, solid: true });
  // pixel decorations (digital feel)
  const pr = rng(77);
  for (let i = 0; i < 9; i++) { const s = 16 + pr() * 16; g.save(); g.globalAlpha = .75; g.fillStyle = [C.cyan, C.mag, C.blue][i % 3]; g.fillRect(i < 5 ? 330 + pr() * 50 : 44 + pr() * 40, 60 + pr() * 300, s, s); g.restore(); }
  fill(ellPts(220, 205, 138, 146, 18), C.hair, { seed: 42, gap: 9, base: .85 });
  shape(ellPts(220, 240, 100, 112, 18), C.skin, { seed: 43, w: 6, solid: true, base: .8 });
  shape([[112, 205], [130, 130], [190, 92], [262, 92], [318, 132], [330, 205], [296, 170], [246, 150], [196, 152], [150, 172]], C.hair, { seed: 44, w: 6, gap: 9, base: .9, solid: true });
  stroke([[176, 112], [196, 146]], { color: C.cyan, w: 9, seed: 45 });
  A(.55, () => { fill(ellPts(160, 272, 20, 13, 8), C.mag, { seed: 46, gap: 6 }); fill(ellPts(280, 272, 20, 13, 8), C.mag, { seed: 47, gap: 6 }); });
  const ey = 238;
  if (offline > .5 || blink) {
    stroke(quadPts(166, ey, 184, ey + 12, 202, ey, 1, 5), { w: 6, seed: 48, amp: .8 });
    stroke(quadPts(238, ey, 256, ey + 12, 274, ey, 1, 5), { w: 6, seed: 49, amp: .8 });
  } else if (mood > .72) {
    stroke(ellPts(184, ey, 20, 21, 9), { closed: true, w: 5.5, seed: 48 });
    g.fillStyle = C.ink; g.beginPath(); g.arc(187, ey + 2, 6, 0, 7); g.fill();
    stroke([[244, ey - 14], [270, ey + 12]], { w: 6, seed: 50 }); stroke([[270, ey - 14], [244, ey + 12]], { w: 6, seed: 51 });
  } else {
    g.fillStyle = C.ink;
    g.beginPath(); g.ellipse(184, ey, 11, 15, 0, 0, 7); g.ellipse(256, ey, 11, 15, 0, 0, 7); g.fill();
    g.fillStyle = C.white; g.beginPath(); g.arc(188, ey - 5, 4, 0, 7); g.arc(260, ey - 5, 4, 0, 7); g.fill();
    if (mood > .3) { stroke([[164, ey - 34], [200, ey - 26]], { w: 5, seed: 52 }); stroke([[276, ey - 34], [240, ey - 26]], { w: 5, seed: 53 }); }
  }
  if (offline > .5) stroke([[204, 300], [236, 300]], { w: 6, seed: 54 });
  else if (mood > .72) stroke([[182, 300], [198, 288], [212, 304], [228, 288], [244, 304], [258, 292]], { w: 6, seed: 54, sharp: true });
  else if (mood > .3) stroke([[190, 298], [205, 292], [220, 300], [235, 293], [250, 298]], { w: 6, seed: 54 });
  else stroke(quadPts(186, 286, 220, 322, 254, 286, 1, 8), { w: 6.5, seed: 54, amp: .8 });
  g = G;
}
function avatar(cx, cy, size, o = {}) {
  const { mood = 0, glitch = 0, offline = 0, blink = false, alpha = 1 } = o;
  if (alpha <= 0.004 || size < 2) return;
  avatarRaw(mood, offline, blink);
  const S = size * 1.1, x0 = cx - S / 2, y0 = cy - S / 2;
  g.save(); g.globalAlpha *= alpha;
  if (offline > 0.02) g.filter = `grayscale(${(offline * .92).toFixed(2)})`;
  if (glitch < 0.03) g.drawImage(avC, x0, y0, S, S);
  else {
    const r = rng(900 + BOIL * 3.3); const n = 11;
    for (let i = 0; i < n; i++) {
      const dx = r() < glitch * .75 ? (r() - .5) * 2 * glitch * size * .22 : 0;
      g.drawImage(avC, 0, i * 440 / n, 440, 440 / n, x0 + dx, y0 + i * S / n, S, S / n + .6);
    }
    g.filter = 'none';
    for (let i = 0; i < Math.round(glitch * 6); i++) {
      g.save(); g.globalAlpha *= .5; g.fillStyle = [C.cyan, C.mag, C.blue][i % 3];
      const bw = size * (.2 + r() * .6), bh = size * (.02 + r() * .05);
      g.fillRect(cx - size * .6 + r() * (size * 1.2 - bw), cy - size * .5 + r() * size, bw, bh);
      g.restore();
    }
    for (let i = 0; i < Math.round(glitch * 7); i++) {
      g.save(); g.globalAlpha *= .8; g.fillStyle = [C.dark, C.mag, C.cyan][i % 3];
      const s = size * (.04 + r() * .05);
      g.fillRect(cx - size * .62 + r() * size * 1.24, cy - size * .6 + r() * size * 1.2, s, s);
      g.restore();
    }
  }
  g.restore();
}

function pill(cx, cy, s, label, o = {}) {
  const { col = C.greyL, dot = C.greyD } = o;
  g.save(); g.font = `700 ${46 * s}px Kalam`; const tw = g.measureText(label).width; g.restore();
  const w = tw + 110 * s, h = 82 * s;
  shape(rrectPts(cx - w / 2, cy - h / 2, w, h, h / 2, 22), col, { seed: 61, w: 4.5, solid: true, base: .8 });
  shape(ellPts(cx - w / 2 + 42 * s, cy, 14 * s, 14 * s, 8), dot, { seed: 62, w: 3, gap: 5, base: .9 });
  txt(label, cx + 24 * s, cy + 15 * s, 46 * s, 700, C.ink);
}

function clock(cx, cy, r, hours, o = {}) {
  const { flash = 0, seed = 70, ghost = 0 } = o;
  shape(ellPts(cx, cy, r, r, 22), mix(C.white, C.magL, flash), { seed, w: Math.max(5, r * .05), solid: true, hatch: flash > .1 });
  stroke(ellPts(cx, cy, r * .9, r * .9, 20), { closed: true, w: 2.5, color: C.cyan, seed: seed + 1, alpha: .8 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const r1 = r * (i % 3 ? .8 : .72); stroke([[cx + Math.cos(a) * r1, cy + Math.sin(a) * r1], [cx + Math.cos(a) * r * .88, cy + Math.sin(a) * r * .88]], { w: i % 3 ? 3 : 5, seed: seed + 2 + i, amp: .5 }); }
  const ha = hours / 12 * Math.PI * 2 - Math.PI / 2, ma = hours * Math.PI * 2 - Math.PI / 2;
  for (let k = 3; k >= 1; k--) if (ghost > .05) { const a = ma - k * .35 * ghost; A(.18 * ghost, () => stroke([[cx, cy], [cx + Math.cos(a) * r * .74, cy + Math.sin(a) * r * .74]], { w: Math.max(3.5, r * .03), color: C.blue, seed: seed + 30 + k })); }
  stroke([[cx, cy], [cx + Math.cos(ma) * r * .74, cy + Math.sin(ma) * r * .74]], { w: Math.max(3.5, r * .032), color: C.blue, seed: seed + 20, amp: .6 });
  stroke([[cx, cy], [cx + Math.cos(ha) * r * .5, cy + Math.sin(ha) * r * .5]], { w: Math.max(5.5, r * .055), color: C.mag, seed: seed + 21, amp: .6 });
  g.fillStyle = C.ink; g.beginPath(); g.arc(cx, cy, Math.max(5, r * .055), 0, 7); g.fill();
  // little bells on top
  shape(ellPts(cx - r * .62, cy - r * .86, r * .16, r * .12, 8), C.cyan, { seed: seed + 40, w: 3.5, gap: 6 });
  shape(ellPts(cx + r * .62, cy - r * .86, r * .16, r * .12, 8), C.cyan, { seed: seed + 41, w: 3.5, gap: 6 });
}
function counter(cx, cy, s, n, o = {}) {
  const w = 300 * s, h = 110 * s;
  shape(rrectPts(cx - w / 2, cy - h / 2, w, h, 26 * s, 24), mix(C.cyanL, C.magL, o.flash || 0), { seed: 81, w: 5, solid: true });
  txt(`${n} saat`, cx, cy + 24 * s, 70 * s, 700, C.ink);
}
function toggle(cx, cy, s, pos) { // pos 0 = on (right), 1 = off (left)
  const w = 460 * s, h = 210 * s;
  shape(rrectPts(cx - w / 2, cy - h / 2, w, h, h / 2, 26), mix(C.cyan, C.grey, pos), { seed: 91, w: 8, solid: true, base: .85 });
  const kx = lerp(cx + w / 2 - h / 2, cx - w / 2 + h / 2, pos), kr = h * .4;
  shape(ellPts(kx, cy, kr, kr, 16), C.white, { seed: 92, w: 7, solid: true, hatch: false });
  // power symbol
  const pc = mix(C.green, C.greyD, pos);
  const arc = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + .6 + i / 14 * (Math.PI * 2 - 1.2); arc.push([kx + Math.cos(a) * kr * .5, cy + Math.sin(a) * kr * .5]); }
  stroke(arc, { color: pc, w: 8 * s + 2, seed: 93, amp: .8 });
  stroke([[kx, cy - kr * .66], [kx, cy - kr * .1]], { color: pc, w: 8 * s + 2, seed: 94, amp: .6 });
}
function badge(cx, cy, s, ci, seed, rot = 0) {
  TR(cx, cy, 1, rot, () => {
    shape(rrectPts(cx - s / 2, cy - s / 2, s, s, s * .26, 20), [C.magL, C.cyanL, C.blueL, C.yellowL][ci % 4], { seed, w: 4, solid: true, base: .85 });
    if (ci % 3 === 0) heart(cx, cy + 2, s * .5, C.mag, seed + 1); else if (ci % 3 === 1) scribLine(cx - s * .28, cy, s * .56, seed + 1, C.inkSoft, 4); else star(cx, cy, s * .55, C.yellow, seed + 1);
    shape(ellPts(cx + s * .42, cy - s * .42, s * .17, s * .17, 8), C.red, { seed: seed + 2, w: 3, gap: 5, base: .95, solid: true });
  });
}
