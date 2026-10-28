'use strict';
// ---------------------------------------------------------------------------
// Hand-drawn colored-pencil rendering primitives for "Bu Gerçekten Yaşandı".
// Everything is deterministic in time so any frame can be rendered alone.
// ---------------------------------------------------------------------------
const W = 1080, H = 1920, TAU = Math.PI * 2;

const C = {
  paper: '#f3ead6', paperLt: '#f8f1df', paperDk: '#e6d9bb',
  ink: '#25223f', inkSoft: '#4a4370', inkLight: '#7a7299', purple: '#3a2a52',
  bronze: '#6d8f76', bronzeDk: '#48695a', bronzeLt: '#9cbfa3', verd: '#86b8a0', verdDk: '#3e6655',
  rust: '#8a6a45',
  brass: '#c39b4a', brassDk: '#93702f', brassLt: '#e0c271', gold: '#d9a93c',
  sea: '#5b86a6', seaDk: '#3d6683', seaDeep: '#2b4b66', seaLt: '#a2c4d4', foam: '#e9f2f1',
  parch: '#e9d6a9', parchDk: '#cfb27b', parchLt: '#f2e4c0',
  sand: '#d8c497', sandDk: '#b49d6d', wood: '#7d5737', woodDk: '#583b26', woodLt: '#a67a4f',
  terra: '#bf7351', terraDk: '#8d4f36', sun: '#e8b23e', sunLt: '#f4d57e', moon: '#ebe6d3', moonDk: '#2f2c4a',
  earth: '#5f8fb0', land: '#88a86c', marble: '#ece6da', marbleDk: '#c9c0b0',
  suit: '#cdb88f', suitDk: '#a8936b', rubber: '#4b4038', red: '#b5523b', night: '#33416a',
};

let BOIL = 0;          // changes ~8x per second -> stop-motion line boil
let TIME = 0;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => Math.pow(clamp(t), 3);
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const backOut = t => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const fr = x => x - Math.floor(x);
const h1 = n => fr(Math.sin(n * 127.1 + 17.31) * 43758.5453);
const h2 = (a, b) => fr(Math.sin(a * 127.1 + b * 311.7 + 0.53) * 43758.5453);
function vn(x, seed) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(h2(i, seed), h2(i + 1, seed), u) * 2 - 1; }
function rngf(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ------------------------------- textures ----------------------------------
const PAT = { tex: [], pencil: {} };
let PAPER = null, GRAIN = [];

function buildTextures(ctx) {
  for (let v = 0; v < 3; v++) {
    const S = 256, c = mkCanvas(S, S), x = c.getContext('2d'), R = rngf(100 + v);
    x.lineCap = 'round';
    for (let i = 0; i < 560; i++) {
      const px = R() * S, py = R() * S, len = 12 + R() * 44, ang = -0.62 + (R() - 0.5) * 0.4, lw = 0.8 + R() * 2.3;
      const light = R() < 0.6;
      x.strokeStyle = light ? `rgba(255,251,238,${0.035 + R() * 0.1})` : `rgba(28,22,48,${0.025 + R() * 0.06})`;
      x.lineWidth = lw;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        x.beginPath(); x.moveTo(px + ox, py + oy); x.lineTo(px + ox + Math.cos(ang) * len, py + oy + Math.sin(ang) * len); x.stroke();
      }
    }
    for (let i = 0; i < 2400; i++) { x.fillStyle = `rgba(250,244,226,${0.1 + R() * 0.28})`; const s = 0.6 + R() * 1.5; x.fillRect(R() * S, R() * S, s, s); }
    PAT.tex.push(ctx.createPattern(c, 'repeat'));
  }
  // paper background
  PAPER = mkCanvas(W, H);
  { const x = PAPER.getContext('2d'), R = rngf(7);
    x.fillStyle = C.paper; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const gx = R() * W, gy = R() * H, r = 80 + R() * 320, g = x.createRadialGradient(gx, gy, 0, gx, gy, r);
      const dark = R() < 0.5;
      g.addColorStop(0, dark ? `rgba(170,140,90,${0.03 + R() * 0.04})` : `rgba(255,252,240,${0.05 + R() * 0.06})`);
      g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(gx - r, gy - r, 2 * r, 2 * r);
    }
    x.lineCap = 'round';
    for (let i = 0; i < 1400; i++) {
      const px = R() * W, py = R() * H, l = 6 + R() * 22, a = R() * TAU;
      x.strokeStyle = `rgba(120,95,60,${0.04 + R() * 0.06})`; x.lineWidth = 0.6 + R();
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.4) * l * 0.5, py + Math.sin(a + 0.4) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
    const vg = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,90,50,0.16)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
  }
  // grain overlay (applied over everything so all colors sit "on paper")
  for (let v = 0; v < 3; v++) {
    const c = mkCanvas(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data, R = rngf(900 + v);
    for (let i = 0; i < d.length; i += 4) {
      const n = R();
      if (n < 0.1) { d[i] = 70; d[i + 1] = 55; d[i + 2] = 40; d[i + 3] = (0.1 - n) * 420; }
      else if (n > 0.9) { d[i] = 255; d[i + 1] = 250; d[i + 2] = 235; d[i + 3] = (n - 0.9) * 480; }
    }
    x.putImageData(img, 0, 0);
    GRAIN.push(c);
  }
}

function texPat(ctx) {
  const p = PAT.tex[BOIL % 3];
  p.setTransform(ctx.getTransform().inverse().multiply(new DOMMatrix([1, 0, 0, 1, (BOIL % 5) * 37, (BOIL % 7) * 23])));
  return p;
}
function pencil(ctx, color) {
  let p = PAT.pencil[color];
  if (!p) {
    const S = 128, c = mkCanvas(S, S), x = c.getContext('2d'), R = rngf(color.length * 13 + color.charCodeAt(1));
    x.fillStyle = color; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${0.15 + R() * 0.5})`; x.fillRect(R() * S, R() * S, 1 + R() * 1.5, 1 + R() * 1.5); }
    p = PAT.pencil[color] = ctx.createPattern(c, 'repeat');
  }
  p.setTransform(ctx.getTransform().inverse().multiply(new DOMMatrix([1, 0, 0, 1, (BOIL % 3) * 41, (BOIL % 4) * 29])));
  return p;
}

// ------------------------------- geometry ----------------------------------
function curScale(ctx) { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) || 1; }

// resample polyline and perturb (smooth noise + boil jitter)
function wob(ctx, pts, closed, amp, seed, step) {
  const sc = curScale(ctx), a = amp / sc, st = step / sc;
  const out = []; let idx = 0; const n = pts.length; const segs = closed ? n : n - 1;
  for (let s = 0; s < segs; s++) {
    const p = pts[s], q = pts[(s + 1) % n];
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1e-6;
    const k = Math.max(1, Math.min(60, Math.ceil(L / st))); const nx = -dy / L, ny = dx / L;
    for (let j = 0; j < k; j++) {
      const u = j / k;
      const d = a * (vn(idx * 0.37, seed) * 0.85 + (h2(idx + seed * 31.7, BOIL * 1.37) - 0.5) * 0.6);
      out.push([p[0] + dx * u + nx * d, p[1] + dy * u + ny * d]); idx++;
    }
  }
  if (!closed) { const p = pts[n - 1]; out.push([p[0] + (h2(seed, BOIL) - .5) * a, p[1] + (h2(seed + 3, BOIL) - .5) * a]); }
  return out;
}
function jit(ctx, pts, amp, seed) {
  const a = amp / curScale(ctx);
  return pts.map((p, i) => [p[0] + (h2(i + seed * 7.1, BOIL * 1.7) - .5) * a, p[1] + (h2(i + seed * 3.3 + 99, BOIL * 1.3) - .5) * a]);
}
function tr(ctx, pts, closed, sharp) {
  const n = pts.length; if (n < 2) return;
  if (sharp) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (closed) ctx.closePath(); return; }
  if (!closed) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  } else {
    ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    ctx.closePath();
  }
}
function circ(r, n) { n = n || Math.max(14, Math.min(90, Math.round(r * 0.35))); const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return o; }
function circAt(x, y, r, n) { return circ(r, n).map(p => [p[0] + x, p[1] + y]); }
function ellAt(x, y, rx, ry, n, rot = 0) { n = n || Math.max(16, Math.round(Math.max(rx, ry) * 0.3)); const o = [], c = Math.cos(rot), s = Math.sin(rot); for (let i = 0; i < n; i++) { const a = i / n * TAU, px = Math.cos(a) * rx, py = Math.sin(a) * ry; o.push([x + px * c - py * s, y + px * s + py * c]); } return o; }
function rr(x, y, w, h, r) { const o = []; const k = 5; const cs = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]]; for (const [cx, cy, a0] of cs) for (let i = 0; i <= k; i++) { const a = a0 + i / k * Math.PI / 2; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; }
function arcPts(x, y, r, a0, a1, n) { n = n || Math.max(6, Math.ceil(Math.abs(a1 - a0) * r / 14)); const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return o; }
function xf(pts, x, y, s = 1, rot = 0, sy) { const c = Math.cos(rot), sn = Math.sin(rot), ky = sy == null ? s : sy; return pts.map(p => [x + (p[0] * s) * c - (p[1] * ky) * sn, y + (p[0] * s) * sn + (p[1] * ky) * c]); }

// ------------------------------- drawing -----------------------------------
// Closed or open shape with crayon fill + double pencil outline.
function draw(ctx, pts, o = {}) {
  const closed = o.closed !== false, seed = o.seed || 1, amp = o.amp ?? 2.0, step = o.step ?? 18;
  const P = o.sharp ? jit(ctx, pts, amp, seed) : wob(ctx, pts, closed, amp, seed, step);
  const Hs = (o.holes || []).map((h, i) => o.sharp ? jit(ctx, h, amp, seed + i * 7 + 3) : wob(ctx, h, true, amp, seed + i * 7 + 3, step));
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.fill && closed) {
    ctx.beginPath(); tr(ctx, P, true, o.sharp); for (const h of Hs) tr(ctx, h, true, o.sharp);
    ctx.fillStyle = o.fill; ctx.fill('evenodd');
    if (o.tex !== false) { ctx.globalAlpha *= (o.texA ?? 1); ctx.fillStyle = texPat(ctx); ctx.fill('evenodd'); ctx.globalAlpha /= (o.texA ?? 1); }
  }
  if (o.shade) { // crescent shading on one side
    ctx.save(); ctx.beginPath(); tr(ctx, P, true, o.sharp); ctx.clip('evenodd');
    ctx.beginPath(); ctx.rect(-1e4, -1e4, 2e4, 2e4); tr(ctx, P.map(p => [p[0] + o.shade[0], p[1] + o.shade[1]]), true, o.sharp);
    ctx.fillStyle = o.shade[2] || 'rgba(30,25,50,0.22)'; ctx.fill('evenodd'); ctx.restore();
  }
  if (o.stroke !== null && o.lw !== 0) {
    const sc = curScale(ctx), lw = (o.lw ?? 4.5) / sc, col = o.stroke || C.ink;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash.map(d => d / sc));
    ctx.strokeStyle = pencil(ctx, col); ctx.lineWidth = lw;
    ctx.beginPath(); tr(ctx, P, closed, o.sharp); for (const h of Hs) tr(ctx, h, true, o.sharp); ctx.stroke();
    if (!o.single) {
      const P2 = o.sharp ? jit(ctx, pts, amp * 1.4, seed + 50) : wob(ctx, pts, closed, amp * 1.2, seed + 50, step * 1.3);
      ctx.globalAlpha *= 0.5; ctx.lineWidth = lw * 0.45;
      ctx.beginPath(); tr(ctx, P2, closed, o.sharp); ctx.stroke();
    }
  }
  ctx.restore();
}
function line(ctx, pts, o = {}) { draw(ctx, pts, Object.assign({ closed: false, fill: null }, o)); }
// a limb / rope / hose: outlined tube
function tube(ctx, pts, w, fill, o = {}) {
  const seed = o.seed || 3, amp = o.amp ?? 1.6;
  const P = wob(ctx, pts, false, amp, seed, o.step ?? 16);
  const sc = curScale(ctx);
  ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); tr(ctx, P, false);
  if (o.outline !== false) { ctx.strokeStyle = pencil(ctx, o.stroke || C.ink); ctx.lineWidth = w + (o.lw ?? 4.5) * 2 / sc; ctx.stroke(); }
  ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke();
  if (o.tex !== false) { ctx.strokeStyle = texPat(ctx); ctx.stroke(); }
  ctx.restore();
}
function dot(ctx, x, y, r, color, alpha = 1) { ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); }

// pencil "emphasis" strokes around a point
function sparks(ctx, x, y, r0, r1, n, a, color = C.ink, seed = 1) {
  if (a <= 0) return;
  for (let i = 0; i < n; i++) {
    const ang = i / n * TAU + h1(i + seed) * 0.3 + seed;
    line(ctx, [[x + Math.cos(ang) * r0, y + Math.sin(ang) * r0], [x + Math.cos(ang) * lerp(r0, r1, a), y + Math.sin(ang) * lerp(r0, r1, a)]], { lw: 4, stroke: color, seed: i + seed, single: true, alpha: a });
  }
}

// ------------------------------- gears -------------------------------------
const GCACHE = {};
function gearPts(r, teeth, depth) {
  const k = r.toFixed(1) + '_' + teeth + '_' + depth.toFixed(1);
  if (GCACHE[k]) return GCACHE[k];
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i / teeth * TAU, a2 = (i + 0.5) / teeth * TAU, w = 0.12 / teeth * TAU;
    pts.push([Math.cos(a - w) * (r - depth), Math.sin(a - w) * (r - depth)]);
    pts.push([Math.cos(a + w) * (r - depth), Math.sin(a + w) * (r - depth)]);
    pts.push([Math.cos(a2) * r, Math.sin(a2) * r]); // triangular teeth, as on the real mechanism
  }
  return (GCACHE[k] = pts);
}
function sectorPts(ri, ro, a0, a1) { const o = arcPts(0, 0, ro, a0, a1, Math.max(5, Math.ceil((a1 - a0) * ro / 22))); return o.concat(arcPts(0, 0, ri, a1, a0, Math.max(3, Math.ceil((a1 - a0) * ri / 22)))); }
// o: fill, teeth, spokes, ang, alpha, corr, dash, lw, sy (vertical squash for isometric)
function gear(ctx, x, y, r, ang, o = {}) {
  const teeth = o.teeth || Math.max(10, Math.round(r * 0.42));
  const depth = o.depth || clamp(r * 0.1, 5, 16);
  const spokes = o.spokes ?? (r > 70 ? 4 : 0);
  ctx.save(); ctx.translate(x, y); if (o.sy) ctx.scale(1, o.sy); ctx.rotate(ang);
  const holes = [];
  if (spokes > 0) {
    const ri = r * 0.24, ro = r - depth - r * 0.1, sw = (o.spokeW || 0.16);
    for (let i = 0; i < spokes; i++) { const a0 = i / spokes * TAU + sw, a1 = (i + 1) / spokes * TAU - sw; holes.push(sectorPts(ri, ro, a0, a1)); }
  } else if (r > 30) holes.push(circ(r * 0.12, 10));
  const fill = o.fill || C.brass;
  draw(ctx, gearPts(r, teeth, depth), { fill, holes, sharp: true, amp: o.amp ?? 1.6, seed: o.seed || 5, lw: o.lw ?? 4, alpha: o.alpha, dash: o.dash, stroke: o.stroke, shade: o.noShade ? null : [-r * 0.06, -r * 0.06, 'rgba(60,40,10,0.18)'], single: o.single });
  if (spokes > 0 && !o.dash) {
    draw(ctx, circ(r * 0.12, 12), { fill: o.hub || C.brassDk, lw: 3, alpha: o.alpha, seed: (o.seed || 5) + 2 });
    draw(ctx, circ(r - depth - r * 0.04, 40), { closed: true, fill: null, lw: 2, alpha: (o.alpha ?? 1) * 0.5, seed: (o.seed || 5) + 9, single: true });
  } else if (!o.dash && r > 30) {
    draw(ctx, circ(r * 0.2, 10), { fill: null, lw: 2.5, alpha: (o.alpha ?? 1) * 0.7, seed: 4, single: true });
  }
  if (o.corr) corrosion(ctx, gearPts(r, teeth, depth), r, o.corr, o.seed || 5, o.alpha);
  ctx.restore();
}
function corrosion(ctx, clipPts, r, a, seed, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= a * (alpha ?? 1);
  ctx.beginPath(); tr(ctx, clipPts, true, true); ctx.clip();
  const R = rngf(seed * 11 + 3);
  const cols = [C.verd, C.verdDk, C.bronzeLt, C.rust, C.bronze];
  for (let i = 0; i < 14; i++) {
    const bx = (R() - .5) * 2 * r, by = (R() - .5) * 2 * r, br = r * (0.12 + R() * 0.35);
    draw(ctx, ellAt(bx, by, br, br * (0.6 + R() * 0.5), 14, R() * 3), { fill: cols[i % cols.length], stroke: null, lw: 0, seed: i + seed, alpha: 0.55 + R() * 0.35 });
  }
  ctx.restore();
}

// ------------------------------- text --------------------------------------
function font(size, weight = 700) { return `${weight} ${size}px Kalam`; }
// draws a string with small per-word wobble (hand lettering)
function hand(ctx, s, x, y, size, color, weight = 700, align = 'left', seed = 1) {
  ctx.save(); ctx.font = font(size, weight); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align;
  const j = (h2(seed, BOIL) - .5) * 1.2, k = (h2(seed + 5, BOIL) - .5) * 0.01;
  ctx.translate(x + j, y + j * 0.6); ctx.rotate(k);
  ctx.fillText(s, 0, 0); ctx.restore();
}
