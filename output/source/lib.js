// ---------- core drawing library: colored-pencil look ----------
const W = 1080, H = 1920;
const C = {
  cream: '#f4ead5', cream2: '#ecdcbc', navy: '#23264a', purple: '#3b2f57', navyL: '#5d5f88',
  brick: '#b4533c', brickD: '#8a3a2b', brickL: '#cf7a5c', orange: '#e2742a', amber: '#e39a2a',
  amberL: '#f7c860', amberD: '#93530f', char: '#4b4747', charL: '#7d7876', smoke: '#9a9592',
  blue: '#6d8fbc', blueL: '#a9c6e8', wood: '#a0663a', woodD: '#6b3f20', woodL: '#c48b56',
  skin: '#ecbd98', green: '#6e8a5c', red: '#b5352b', redcoat: '#b8392e', brass: '#c9a043',
  pink: '#e9a3a0', grey: '#a7a39c', slate: '#5a6273', roof: '#6b5a58', cob: '#d9cbb0', yellow: '#ffd76a'
};
let ctx, T = 0, BOIL = 0, SEEDC = 0;

function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const eout = k => { k = clamp(k); return 1 - Math.pow(1 - k, 3); };
const ein = k => { k = clamp(k); return k * k * k; };
const prog = (t, a, b) => clamp((t - a) / (b - a));
function seed() { SEEDC++; return mulberry(SEEDC * 7919 + BOIL * 104729); }
function staticRng(s) { return mulberry(s * 9973 + 17); }

// subdivide polyline so jitter makes wobble
function subdiv(pts, closed, step = 34) {
  const out = []; const n = pts.length; const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]); const k = Math.max(1, Math.round(d / step));
    for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
function jit(pts, amp, r) { return pts.map(p => [p[0] + (r() - .5) * 2 * amp, p[1] + (r() - .5) * 2 * amp]); }
function tracePath(pts, closed) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]); if (closed) ctx.closePath();
}
let GRAIN, PAPER, GRAINPAT;
function makeTextures() {
  GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 320;
  const g = GRAIN.getContext('2d'); const r = staticRng(5);
  for (let i = 0; i < 2600; i++) {
    const x = r() * 320, y = r() * 320, l = 3 + r() * 9, a = -0.9 + r() * .3;
    g.strokeStyle = r() < .72 ? `rgba(250,244,228,${.25 + r() * .45})` : `rgba(30,25,45,${.05 + r() * .1})`;
    g.lineWidth = .8 + r() * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  PAPER = document.createElement('canvas'); PAPER.width = W; PAPER.height = H;
  const p = PAPER.getContext('2d'); p.fillStyle = C.cream; p.fillRect(0, 0, W, H);
  const r2 = staticRng(9);
  for (let i = 0; i < 26000; i++) { p.fillStyle = r2() < .5 ? `rgba(120,95,60,${r2() * .06})` : `rgba(255,252,240,${r2() * .25})`; p.fillRect(r2() * W, r2() * H, 1 + r2() * 2.5, 1 + r2() * 2.5); }
  for (let i = 0; i < 500; i++) { p.strokeStyle = `rgba(140,110,70,${r2() * .07})`; p.lineWidth = .7; p.beginPath(); const x = r2() * W, y = r2() * H; p.moveTo(x, y); p.quadraticCurveTo(x + r2() * 30 - 15, y + r2() * 30 - 15, x + r2() * 60 - 30, y + r2() * 60 - 30); p.stroke(); }
  const vg = p.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(110,80,40,.18)');
  p.fillStyle = vg; p.fillRect(0, 0, W, H);
}
// filled crayon shape with pencil outline
function shape(pts, fill, o = {}) {
  const closed = o.open ? false : true;
  const r = seed();
  const sp = jit(subdiv(pts, closed, o.step || 34), o.amp ?? 1.6, r);
  ctx.save(); ctx.globalAlpha = (o.alpha ?? 1);
  if (fill) {
    tracePath(sp, closed); ctx.fillStyle = fill; ctx.globalAlpha = (o.alpha ?? 1) * (o.fa ?? .93); ctx.fill();
    if (o.grain !== false) { ctx.save(); ctx.clip(); ctx.globalAlpha = (o.alpha ?? 1) * (o.ga ?? .55); ctx.fillStyle = GRAINPAT; ctx.fill(); ctx.restore(); }
  }
  if (o.stroke !== false) {
    ctx.globalAlpha = (o.alpha ?? 1) * (o.sa ?? .9); ctx.strokeStyle = o.stroke || C.navy; ctx.lineWidth = o.lw || 3.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sp2 = jit(sp, (o.amp ?? 1.6) * .8, r); tracePath(sp2, closed); ctx.stroke();
    ctx.globalAlpha *= .45; ctx.lineWidth *= .55; tracePath(jit(sp, (o.amp ?? 1.6) * 1.3, r), closed); ctx.stroke();
  }
  ctx.restore();
}
function line(pts, col = C.navy, lw = 3, o = {}) { shape(pts, null, Object.assign({ open: true, stroke: col, lw }, o)); }
function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function ellPts(cx, cy, rx, ry, n = 22, a0 = 0) { const o = []; for (let i = 0; i < n; i++) { const a = a0 + i / n * Math.PI * 2; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
function rect(x, y, w, h, fill, o) { shape(rectPts(x, y, w, h), fill, o); }
function ell(cx, cy, rx, ry, fill, o = {}) { shape(ellPts(cx, cy, rx, ry, o.n || Math.max(10, Math.round((rx + ry) / 6))), fill, Object.assign({ step: 1000 }, o)); }
function hatch(pts, col, spacing = 14, ang = -0.8, alpha = .25, lw = 1.6) {
  ctx.save(); tracePath(pts, true); ctx.clip(); ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = lw;
  let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9; pts.forEach(p => { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
  const r = seed(); const d = Math.hypot(maxx - minx, maxy - miny); const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let s = -d; s < d; s += spacing) { const j = (r() - .5) * spacing * .5; ctx.beginPath(); ctx.moveTo(cx - ca * d - sa * (s + j), cy - sa * d + ca * (s + j)); ctx.lineTo(cx + ca * d - sa * (s + j), cy + sa * d + ca * (s + j)); ctx.stroke(); }
  ctx.restore();
}
// soft glow
function glow(x, y, r, col, a) { ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }

// ---------- fire ----------
function flame(x, y, h, w, ph, o = {}) {
  if (h < 3) return;
  const s1 = Math.sin(T * 7 + ph), s2 = Math.sin(T * 9.3 + ph * 1.7), s3 = Math.sin(T * 6.1 + ph * 2.3);
  const hh = h * (0.86 + 0.14 * Math.sin(T * 11 + ph * 3));
  const a = o.alpha ?? 1;
  const base = (k, yk) => [[x - w * k, y], [x - w * k, y - hh * .22 * yk], [x - w * .78 * k + s2 * w * .2 * k, y - hh * .62 * yk], [x - w * .4 * k, y - hh * .45 * yk], [x + s1 * w * .4 * k, y - hh * yk], [x + w * .3 * k, y - hh * .52 * yk], [x + w * .62 * k + s3 * w * .25 * k, y - hh * .76 * yk], [x + w * .92 * k, y - hh * .3 * yk], [x + w * k, y], [x, y + w * .22 * k]];
  if (o.blue !== false) {
    const bb = [[x - w * 1.15, y + 2], [x - w * .9, y - hh * .2], [x - w * .45, y - hh * .34 + s3 * 4], [x, y - hh * .28], [x + w * .5, y - hh * .36 + s2 * 4], [x + w * .95, y - hh * .18], [x + w * 1.15, y + 2], [x, y + w * .25]];
    shape(bb, '#5a8fdc', { stroke: '#30559a', lw: 1.6, amp: .7, step: 18, alpha: a * .8, ga: .35 });
  }
  const yb = o.blue !== false ? hh * .1 : 0;
  ctx.save(); ctx.translate(0, -yb);
  shape(base(1, 1), o.col || '#e9652a', { stroke: '#a3381c', lw: 2.2, amp: .9, step: 22, alpha: a * .95, ga: .3 });
  shape(base(.72, .78), '#f6a13a', { stroke: false, amp: .9, step: 22, alpha: a * .95, ga: .25 });
  shape(base(.42, .5), '#ffe08a', { stroke: false, amp: .8, step: 22, alpha: a, ga: .2 });
  ctx.restore();
}
function smokePuff(x, y, r, a = .5, col = C.smoke) { ell(x, y, r, r * .8, col, { alpha: a, stroke: C.charL, lw: 2, sa: .5, ga: .6 }); }
function smokeColumn(x, y, n, spread, t0, a = .5, scale = 1, seedN = 1) {
  const r = staticRng(seedN);
  for (let i = 0; i < n; i++) {
    const ph = r(); const life = ((T - t0) * .22 + ph) % 1; if (T < t0) continue;
    const yy = y - life * 900 * scale; const xx = x + (r() - .5) * spread + Math.sin(T * .8 + i) * 30 * life + life * 120 * scale;
    smokePuff(xx, yy, (40 + life * 110) * scale * (0.8 + r() * .4), a * (1 - life) * clamp((T - t0) * 1.5));
  }
}

// ---------- whiskey stream (ribbon with varying width) ----------
function polyLen(pts) { let L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
function resample(pts, step = 12) {
  const L = polyLen(pts); const tot = L[L.length - 1]; const out = [];
  let j = 0; for (let s = 0; s <= tot; s += step) { while (j < L.length - 2 && L[j + 1] < s) j++; const k = (s - L[j]) / (L[j + 1] - L[j] || 1); out.push([lerp(pts[j][0], pts[j + 1][0], k), lerp(pts[j][1], pts[j + 1][1], k)]); }
  return out;
}
function smoothPts(pts, it = 2) { for (let n = 0; n < it; n++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } o.push(pts[pts.length - 1]); pts = o; } return pts; }
// opts: reveal(0-1), burn (0-1 frontier from start), fl (flame intensity), wfn(s)->width, dark (0-1 darkened liquid), flameScale
function stream(path, o = {}) {
  const pts = path.rs || (path.rs = resample(smoothPts(path.pts, 3), 10));
  const n = pts.length; const reveal = o.reveal ?? 1; const m = Math.max(2, Math.floor(n * reveal));
  const wf = o.wfn || (() => o.w || 60);
  const left = [], right = [];
  for (let i = 0; i < m; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const s = i / (n - 1); let w = wf(s) * (1 + .08 * Math.sin(i * .7 + T * 3));
    if (i > m - 8) w *= Math.sqrt((m - i) / 8) * .9 + .1;
    left.push([pts[i][0] - dy * w / 2, pts[i][1] + dx * w / 2]); right.push([pts[i][0] + dy * w / 2, pts[i][1] - dx * w / 2]);
  }
  const poly = left.concat(right.reverse());
  const dk = o.dark || 0; const fl = o.fl ?? 0; const a = o.alpha ?? 1;
  // glow
  if (fl > 0 && !o.noGlow) { for (let i = 0; i < m; i += 6) glow(pts[i][0], pts[i][1], wf(i / (n - 1)) * 2.2, 'rgba(255,150,40,1)', .09 * fl * a); }
  const liq = dk > 0 ? mix(C.amber, '#4a2a10', dk) : C.amber;
  ctx.save(); ctx.globalAlpha = a;
  shape(poly, liq, { stroke: dk > .5 ? '#2a1a10' : C.amberD, lw: 3, amp: 1.2, step: 1000, ga: .45, alpha: a });
  // flow highlights
  const sub = pts.slice(0, m);
  ctx.save(); tracePath(poly, true); ctx.clip();
  ctx.strokeStyle = dk > 0 ? mix(C.amberL, '#6b4220', dk) : C.amberL; ctx.lineCap = 'round';
  for (let k = -1; k <= 1; k++) {
    ctx.beginPath(); sub.forEach((p, i) => { const q = pts[Math.min(n - 1, i + 1)]; let dx = q[0] - p[0], dy = q[1] - p[1]; const d = Math.hypot(dx, dy) || 1; const off = k * wf(i / (n - 1)) * .26; const x = p[0] - dy / d * off, y = p[1] + dx / d * off; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineWidth = Math.max(2, (o.w || 40) * .07); ctx.setLineDash([26 + k * 6, 46]); ctx.lineDashOffset = -T * (o.speed || 160) + k * 30; ctx.globalAlpha = .75 * a; ctx.stroke();
  }
  ctx.restore(); ctx.restore();
  // flames
  if (fl > 0) {
    const burnN = Math.floor(m * (o.burn ?? 1)); const fs = o.flameScale || 1; const items = [];
    const r = staticRng(o.seed || 3); const step = o.flameStep || 4;
    for (let i = 0; i < burnN; i += step) {
      const s = i / (n - 1); const w = wf(s); const lat = (r() - .5) * w * .8;
      const p = pts[i], q = pts[Math.min(n - 1, i + 1)]; let dx = q[0] - p[0], dy = q[1] - p[1]; const d = Math.hypot(dx, dy) || 1;
      const edge = clamp((burnN - i) / 10); // just-ignited region small
      items.push([p[0] - dy / d * lat, p[1] + dx / d * lat, (w * 1.15 + 40) * fs * fl * (0.6 + r() * .7) * (0.35 + 0.65 * edge), (w * .3 + 10) * fs * (0.75 + r() * .5), r() * 9]);
    }
    items.sort((A, B) => A[1] - B[1]).forEach(f => flame(f[0], f[1], f[2], f[3], f[4], { alpha: a }));
  }
  return pts;
}
function mix(c1, c2, k) { const p = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; const a = p(c1), b = p(c2); return 'rgb(' + a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',') + ')'; }

// ---------- objects ----------
function windowPane(x, y, w, h, lit, o = {}) {
  rect(x, y, w, h, lit ? mix('#f1b84f', '#ffe39a', lit * .5) : (o.dark || '#3c3d5e'), { lw: 2.4 });
  line([[x + w / 2, y], [x + w / 2, y + h]], C.navy, 2); line([[x, y + h / 2], [x + w, y + h / 2]], C.navy, 2);
  line([[x - 6, y + h + 4], [x + w + 6, y + h + 4]], C.navy, 3);
}
function building(x, by, w, h, col, o = {}) {
  const y = by - h; rect(x, y, w, h, col, { lw: 3.4 });
  if (o.bricks !== false) { ctx.save(); ctx.globalAlpha = .22; for (let yy = y + 18; yy < by - 6; yy += 22) { const r = staticRng(Math.floor(yy + x)); for (let k = 0; k < 4; k++) { const xx = x + r() * (w - 40); line([[xx, yy], [xx + 20 + r() * 30, yy]], C.brickD, 2, { amp: .5 }); } } ctx.restore(); }
  const cols = o.cols || Math.max(1, Math.floor(w / 110)), rows = o.rows || Math.max(1, Math.floor((h - 120) / 150));
  const ww = o.ww || 50, wh = o.wh || 74;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const wx = x + (i + .5) * w / cols - ww / 2, wy = y + 40 + j * ((h - 140) / rows);
    const lit = o.lit ? o.lit(i, j) : 0; windowPane(wx, wy, ww, wh, lit, o);
  }
  if (o.door) { const dx = x + w * (o.doorX ?? .5) - 32; shape([[dx, by], [dx, by - 100], [dx + 32, by - 124], [dx + 64, by - 100], [dx + 64, by]], o.doorCol || '#5b3a2a', { lw: 3 }); }
  rect(x - 10, y - 14, w + 20, 18, C.char, { lw: 2.5 });
  if (o.chimney) { const cx = x + w * o.chimney; rect(cx, y - 70, 36, 58, C.brickD, { lw: 2.5 }); rect(cx - 5, y - 78, 46, 12, C.char, { lw: 2 }); }
}
// end-on cask (round)
function caskEnd(x, y, r, o = {}) {
  ell(x, y, r, r, o.col || C.wood, { lw: 3, n: 20 });
  ell(x, y, r * .78, r * .78, null, { stroke: C.woodD, lw: 2.2, sa: .7, n: 18 });
  ell(x, y, r * .12, r * .12, C.woodD, { lw: 1.6, n: 8 });
  ctx.save(); ctx.globalAlpha = .35; for (let k = -2; k <= 2; k++) line([[x + k * r * .3, y - r * .7], [x + k * r * .3, y + r * .7]], C.woodD, 1.5, { amp: .5 }); ctx.restore();
}
// side-view cask; split 0..1 opens a crack, staves splay
function caskSide(x, y, w, h, o = {}) {
  const wob = o.wob || 0; const sp = o.split || 0; const b = w * .14;
  const pts = [[x - w / 2 + b, y - h / 2], [x + w / 2 - b, y - h / 2], [x + w / 2, y], [x + w / 2 - b, y + h / 2], [x - w / 2 + b, y + h / 2], [x - w / 2, y]];
  shape(pts, o.col || C.wood, { lw: 3.4, step: 20 });
  ctx.save(); ctx.globalAlpha = .45; for (let k = 1; k < 5; k++) { const yy = y - h / 2 + k * h / 5; line([[x - w / 2 + b * .4, yy], [x + w / 2 - b * .4, yy]], C.woodD, 1.8); } ctx.restore();
  if (sp > 0) {
    const g = sp * w * .16;
    shape([[x - 6, y - h * .42], [x + g * .4, y - h * .2], [x - g * .3, y], [x + g * .5, y + h * .22], [x + 4, y + h * .42], [x + g * .9, y + h * .1], [x + g, y - h * .15]], '#2a170c', { lw: 2.5, step: 14 });
    shape([[x + g * .2, y - h * .1], [x + g * .7, y - h * .05], [x + g * .6, y + h * .2], [x + g * .1, y + h * .15]], C.amber, { stroke: false, step: 14 });
    // splayed staves
    [[1, -.25], [-1, .2]].forEach(([d, yy], i) => { ctx.save(); ctx.translate(x + d * (w * .1 + sp * 50), y + yy * h); ctx.rotate(d * sp * .5); rect(-12, -h * .22, 24, h * .44, C.woodL, { lw: 2.5 }); ctx.restore(); });
  }
  [-.36, -.18, .18, .36].forEach((f, i) => { const xx = x + f * w; const ww = Math.sin(T * 9 + i * 2) * wob * 7; if (sp > 0 && Math.abs(f) < .2) return; shape([[xx + ww, y - h / 2 + 4], [xx + w * .03 - ww, y], [xx - ww * .5, y + h / 2 - 4]], null, { open: true, stroke: '#3a3a44', lw: 7 + wob * 2, step: 14 }); });
  if (sp > 0) [-.18, .18].forEach((f, i) => { const xx = x + f * w + (f > 0 ? 1 : -1) * sp * 30; line([[xx, y - h / 2 + 4], [xx + (f > 0 ? 1 : -1) * sp * 40, y - h * .1], [xx + (f > 0 ? 1 : -1) * sp * 18, y + h / 2 - 4]], '#3a3a44', 7); });
}
// person; y = feet
function person(x, y, s, o = {}) {
  const d = o.dir || 1; const ph = o.walk ?? null;
  const coat = o.coat || C.slate; const trou = o.trou || '#4a4258';
  const sw = ph !== null ? Math.sin(ph) * 16 * s : 0;
  const hipY = y - 92 * s, shY = y - 168 * s, hx = x + (o.lean || 0) * s;
  const headY = shY - 30 * s - (o.crouch ? 0 : 0);
  // legs
  if (!o.seated) {
    line([[x - 10 * s, hipY], [x - 12 * s + sw, y - 4 * s]], trou, 15 * s, { amp: .8 });
    line([[x + 10 * s, hipY], [x + 12 * s - sw, y - 4 * s]], trou, 15 * s, { amp: .8 });
    ell(x - 12 * s + sw + d * 6 * s, y - 2 * s, 14 * s, 6 * s, '#2f2a2a', { lw: 2, n: 10 });
    if (!o.bootless) ell(x + 12 * s - sw + d * 6 * s, y - 2 * s, 14 * s, 6 * s, '#2f2a2a', { lw: 2, n: 10 }); else ell(x + 12 * s - sw + d * 6 * s, y - 2 * s, 11 * s, 5 * s, '#d9c9ad', { lw: 2, n: 10 });
  }
  // body
  shape([[hx - 24 * s, shY], [hx + 24 * s, shY], [x + 30 * s, hipY + 22 * s], [x - 30 * s, hipY + 22 * s]], coat, { lw: 3 * Math.max(.6, s), step: 26 });
  if (o.apron) shape([[x - 18 * s, hipY - 30 * s], [x + 18 * s, hipY - 30 * s], [x + 26 * s, hipY + 22 * s], [x - 26 * s, hipY + 22 * s]], '#e8dcc0', { lw: 2 * s, step: 26 });
  if (o.skirt) shape([[x - 22 * s, hipY - 6 * s], [x + 22 * s, hipY - 6 * s], [x + 36 * s, y - 8 * s], [x - 36 * s, y - 8 * s]], o.skirt, { lw: 3 * Math.max(.6, s), step: 26 });
  if (o.belt) line([[x - 26 * s, hipY], [x + 26 * s, hipY]], o.belt, 6 * s);
  // arms
  const arm = (side, ang, len = o.armLen || 74) => {
    const sx = hx + side * 22 * s, sy = shY + 6 * s; const a = ang * Math.PI / 180;
    const ex = sx + Math.sin(a) * len * s * side * d, ey = sy + Math.cos(a) * len * s;
    line([[sx, sy], [ex, ey]], o.sleeve || mix(coat, '#1a1830', .3), 13 * s, { amp: .8 }); ell(ex, ey, 8 * s, 8 * s, C.skin, { lw: 2 * Math.max(.6, s), n: 8 }); return [ex, ey];
  };
  const hL = arm(-1, o.armL ?? 10), hR = arm(1, o.armR ?? 10);
  // head
  const lk = o.look || [0, 0];
  ell(hx + 2 * d * s, headY, 22 * s, 24 * s, C.skin, { lw: 2.6 * Math.max(.6, s), n: 14 });
  const ex = hx + (6 * d + lk[0] * 5) * s, ey = headY - 3 * s + lk[1] * 4 * s; const e = o.expr || 'n';
  const er = e === 'shock' ? 4.2 : 2.6;
  ell(ex - 7 * s, ey, er * s, er * s, C.navy, { stroke: false, n: 6 }); ell(ex + 7 * s, ey, er * s, er * s, C.navy, { stroke: false, n: 6 });
  if (e === 'sly') { line([[ex - 12 * s, ey - 9 * s], [ex - 3 * s, ey - 6 * s]], C.navy, 2 * s); line([[ex + 3 * s, ey - 6 * s], [ex + 12 * s, ey - 9 * s]], C.navy, 2 * s); line([[ex - 6 * s, ey + 12 * s], [ex + 6 * s, ey + 10 * s]], C.navy, 2 * s); }
  else if (e === 'shock') { line([[ex - 12 * s, ey - 12 * s], [ex - 3 * s, ey - 14 * s]], C.navy, 2 * s); line([[ex + 3 * s, ey - 14 * s], [ex + 12 * s, ey - 12 * s]], C.navy, 2 * s); ell(ex, ey + 13 * s, 4 * s, 6 * s, '#4a2a2a', { lw: 1.5 * s, n: 8 }); }
  else if (e === 'sad') { line([[ex - 6 * s, ey + 13 * s], [ex, ey + 11 * s], [ex + 6 * s, ey + 13 * s]], C.navy, 2 * s); }
  else line([[ex - 5 * s, ey + 12 * s], [ex + 5 * s, ey + 12 * s]], C.navy, 2 * s);
  if (o.handsFront) { ell(hL[0], hL[1], 9 * s, 10 * s, C.skin, { lw: 2.4, n: 8 }); ell(hR[0], hR[1], 9 * s, 10 * s, C.skin, { lw: 2.4, n: 8 }); }
  // hats
  const h = o.hat; const hy = headY - 18 * s;
  if (h === 'cap') { shape([[hx - 22 * s, hy + 4 * s], [hx - 18 * s, hy - 12 * s], [hx + 20 * s, hy - 12 * s], [hx + 24 * s, hy + 2 * s], [hx + 24 * s + d * 12 * s, hy + 6 * s]], '#4d4a55', { lw: 2.4 * s, step: 20 }); }
  else if (h === 'top') { rect(hx - 17 * s, hy - 38 * s, 34 * s, 40 * s, '#2c2a33', { lw: 2.4 * s }); rect(hx - 27 * s, hy, 54 * s, 7 * s, '#2c2a33', { lw: 2 * s }); }
  else if (h === 'bonnet') { shape([[hx - 26 * s, hy + 24 * s], [hx - 24 * s, hy - 12 * s], [hx + 4 * s, hy - 18 * s], [hx + 26 * s, hy - 4 * s], [hx + 18 * s, hy + 10 * s]], o.hatCol || '#7a5c7a', { lw: 2.4 * s, step: 20 }); }
  else if (h === 'fire') { shape([[hx - 26 * s, hy + 10 * s], [hx - 20 * s, hy - 14 * s], [hx, hy - 24 * s], [hx + 20 * s, hy - 14 * s], [hx + 26 * s, hy + 10 * s], [hx + 36 * s, hy + 14 * s], [hx - 36 * s, hy + 14 * s]], C.brass, { lw: 2.6 * s, step: 16 }); line([[hx, hy - 24 * s], [hx, hy + 8 * s]], '#8a6a20', 3 * s); }
  else if (h === 'police') { shape([[hx - 22 * s, hy + 10 * s], [hx - 20 * s, hy - 24 * s], [hx, hy - 38 * s], [hx + 20 * s, hy - 24 * s], [hx + 22 * s, hy + 10 * s]], '#1f2340', { lw: 2.4 * s, step: 16 }); ell(hx, hy - 6 * s, 5 * s, 6 * s, '#c9c9d6', { stroke: false, n: 6 }); }
  else if (h === 'shako') { shape([[hx - 20 * s, hy + 8 * s], [hx - 18 * s, hy - 26 * s], [hx + 18 * s, hy - 26 * s], [hx + 20 * s, hy + 8 * s]], '#2a2a35', { lw: 2.4 * s, step: 16 }); rect(hx - 20 * s, hy + 2 * s, 40 * s, 6 * s, C.red, { lw: 1.5 * s, stroke: false }); }
  else if (h === 'shawl') { shape([[hx - 30 * s, shY + 20 * s], [hx - 26 * s, hy - 6 * s], [hx, hy - 16 * s], [hx + 26 * s, hy - 6 * s], [hx + 30 * s, shY + 20 * s], [hx + 18 * s, headY + 4 * s], [hx - 18 * s, headY + 4 * s]], o.hatCol || '#5d4a6e', { lw: 2.4 * s, step: 16 }); }
  // held items
  const it = o.hold; const hp = o.holdHand === 'L' ? hL : hR;
  if (it === 'cup') cup(hp[0], hp[1] - 8 * s, s, o.cupFill);
  if (it === 'bowl') { shape([[hp[0] - 22 * s, hp[1] - 10 * s], [hp[0] + 22 * s, hp[1] - 10 * s], [hp[0] + 14 * s, hp[1] + 8 * s], [hp[0] - 14 * s, hp[1] + 8 * s]], '#c9b79a', { lw: 2.2 * s, step: 14 }); if (o.cupFill) ell(hp[0], hp[1] - 10 * s, 20 * s, 4 * s, C.amber, { stroke: false, n: 10 }); }
  if (it === 'jug') { shape([[hp[0] - 14 * s, hp[1] - 40 * s], [hp[0] + 14 * s, hp[1] - 40 * s], [hp[0] + 22 * s, hp[1] - 10 * s], [hp[0] + 18 * s, hp[1] + 14 * s], [hp[0] - 18 * s, hp[1] + 14 * s], [hp[0] - 22 * s, hp[1] - 10 * s]], '#8c7a6a', { lw: 2.4 * s, step: 14 }); }
  if (it === 'bundle') ell(hp[0], hp[1] - 14 * s, 30 * s, 24 * s, '#b9a37c', { lw: 2.4 * s });
  if (it === 'boot') boot(hp[0], hp[1], s * .9, o.bootAng || 0, o.cupFill);
  if (it === 'lantern') { line([[hp[0], hp[1]], [hp[0], hp[1] + 14 * s]], C.navy, 2); rect(hp[0] - 9 * s, hp[1] + 14 * s, 18 * s, 24 * s, '#f6c860', { lw: 2 }); glow(hp[0], hp[1] + 26 * s, 60 * s, 'rgba(255,200,90,1)', .35); }
  if (it === 'hose') { line([[hp[0], hp[1]], [hp[0] + d * 50 * s, hp[1] - 20 * s]], '#3a3330', 9 * s); rect(hp[0] + d * 48 * s - 6 * s, hp[1] - 26 * s, 14 * s, 12 * s, C.brass, { lw: 2 }); }
  if (it === 'axe') { line([[hp[0], hp[1] + 20 * s], [hp[0], hp[1] - 60 * s]], C.woodD, 6 * s); shape([[hp[0], hp[1] - 60 * s], [hp[0] + d * 26 * s, hp[1] - 66 * s], [hp[0] + d * 26 * s, hp[1] - 42 * s], [hp[0], hp[1] - 48 * s]], '#9aa0aa', { lw: 2 }); }
  return { hL, hR, head: [hx, headY] };
}
function cup(x, y, s, fill) { shape([[x - 13 * s, y - 16 * s], [x + 13 * s, y - 16 * s], [x + 10 * s, y + 12 * s], [x - 10 * s, y + 12 * s]], '#b8bcc4', { lw: 2.4 * Math.max(.7, s), step: 14 }); ell(x + 15 * s, y - 2 * s, 6 * s, 8 * s, null, { lw: 2.2 * s, n: 10 }); if (fill) ell(x, y - 15 * s, 12 * s, 3 * s, C.amber, { stroke: false, n: 8 }); }
function boot(x, y, s, ang = 0, fill) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const p = [[-16, -70], [16, -70], [18, -10], [52, 0], [58, 18], [54, 26], [-18, 26], [-20, -10]].map(q => [q[0] * s, q[1] * s]);
  shape(p, '#6b4428', { lw: 3 * Math.max(.6, s), step: 16 });
  line([[-16 * s, -54 * s], [16 * s, -54 * s]], '#3d2516', 2 * s); line([[-18 * s, 14 * s], [54 * s, 14 * s]], '#3d2516', 2.5 * s);
  ell(0, -70 * s, 16 * s, 5 * s, fill ? C.amber : '#2b1a10', { lw: 2 * s, n: 10 });
  ctx.restore();
}
function horse(x, y, s, o = {}) {
  const d = o.dir || 1, ph = o.walk ?? 0, col = o.col || '#7a5638';
  ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
  for (let k = 0; k < 4; k++) { const lx = [-60, -40, 50, 70][k] * s; const sw = Math.sin(ph + k * Math.PI / 2 + (k > 1 ? 1 : 0)) * 18 * s; line([[lx, -80 * s], [lx + sw, -4 * s]], '#4d3523', 12 * s, { amp: .6 }); }
  ell(0, -110 * s, 92 * s, 42 * s, col, { lw: 3 * s });
  shape([[60 * s, -130 * s], [95 * s, -195 * s], [128 * s, -190 * s], [138 * s, -160 * s], [100 * s, -150 * s], [85 * s, -100 * s]], col, { lw: 3 * s, step: 18 });
  ell(126 * s, -186 * s, 22 * s, 14 * s, col, { lw: 2.5 * s, n: 10 }); ell(128 * s, -192 * s, 3 * s, 3 * s, C.navy, { stroke: false, n: 5 });
  shape([[70 * s, -150 * s], [96 * s, -200 * s], [86 * s, -196 * s], [62 * s, -140 * s]], '#3a2818', { lw: 2, step: 14 });
  line([[-88 * s, -120 * s], [-112 * s, -80 * s + Math.sin(T * 4) * 6 * s]], '#3a2818', 10 * s);
  ctx.restore();
}
function wheel(x, y, r, rot, col = '#6b3f20') { ell(x, y, r, r, null, { lw: 6 * r / 50, stroke: '#3a2a20', n: 18 }); for (let k = 0; k < 8; k++) { const a = rot + k * Math.PI / 4; line([[x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r]], col, 3 * r / 50); } ell(x, y, r * .15, r * .15, C.brass, { lw: 2, n: 8 }); }
function fireEngine(x, y, s, rot) {
  rect(x - 110 * s, y - 120 * s, 220 * s, 60 * s, C.red, { lw: 3 });
  shape([[x - 30 * s, y - 120 * s], [x - 30 * s, y - 250 * s], [x + 40 * s, y - 250 * s], [x + 40 * s, y - 120 * s]], C.brass, { lw: 3, step: 22 });
  rect(x - 10 * s, y - 300 * s, 30 * s, 52 * s, '#3a3a3f', { lw: 2.5 });
  smokeColumn(x + 5 * s, y - 300 * s, 6, 30, 0, .45, .35 * s, 77);
  wheel(x - 75 * s, y - 50 * s, 48 * s, rot); wheel(x + 75 * s, y - 50 * s, 48 * s, rot);
  rect(x + 60 * s, y - 160 * s, 50 * s, 40 * s, '#2f2f38', { lw: 2.5 });
}
function pig(x, y, s, d = 1, ph = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
  for (let k = 0; k < 4; k++) { const lx = [-28, -14, 16, 30][k] * s; line([[lx, -20 * s], [lx + Math.sin(ph + k * 1.6) * 8 * s, 0]], '#c97f80', 7 * s); }
  ell(0, -38 * s, 44 * s, 26 * s, C.pink, { lw: 2.6 * s }); ell(44 * s, -40 * s, 9 * s, 11 * s, '#f0b4b0', { lw: 2.2 * s, n: 10 });
  shape([[22 * s, -60 * s], [30 * s, -76 * s], [36 * s, -58 * s]], C.pink, { lw: 2, step: 10 }); ell(30 * s, -46 * s, 3 * s, 3 * s, C.navy, { stroke: false, n: 5 });
  ctx.restore();
}
function newspaper(x, y, w, h, rot, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  shape(rectPts(-w / 2, -h / 2, w, h), '#efe4c8', { lw: 3, ga: .4 });
  ctx.save(); ctx.globalAlpha = .55;
  rect(-w / 2 + 30, -h / 2 + 24, w - 60, 46, null, { stroke: C.char, lw: 2 });
  for (let k = 0; k < 9; k++) { const xx = -w / 2 + 50 + k * ((w - 100) / 9); const r = staticRng(k + 3); line([[xx, -h / 2 + 34 + r() * 10], [xx + (w - 100) / 9 * .7, -h / 2 + 40 + r() * 8]], C.char, 6, { amp: 1 }); }
  const cols = 3, cw = (w - 80) / cols;
  for (let c = 0; c < cols; c++) for (let l = 0; l < Math.floor((h - 140) / 22); l++) {
    const yy = -h / 2 + 100 + l * 22; const xx = -w / 2 + 40 + c * cw;
    if (o.panel && c >= 1 && yy > -h / 2 + 100 && yy < -h / 2 + 100 + h * .42) continue;
    const r = staticRng(c * 100 + l); line([[xx, yy], [xx + cw * (0.65 + r() * .25), yy]], C.char, 2.2, { amp: .9 });
  }
  ctx.restore();
  if (o.panel) { const px = -w / 2 + 40 + cw, py = -h / 2 + 96, pw = cw * 2 - 10, ph = h * .42; rect(px, py, pw, ph, '#e3d5b4', { lw: 2.5 }); if (o.panelFn) { ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip(); o.panelFn(px, py, pw, ph); ctx.restore(); } }
  ctx.restore();
}
function candle(x, y, s, lit = 1, a = 1) {
  rect(x - 9 * s, y - 60 * s, 18 * s, 60 * s, '#efe6d2', { lw: 2.4, alpha: a });
  if (lit > 0) { glow(x, y - 78 * s, 50 * s, 'rgba(255,190,90,1)', .35 * lit * a); flame(x, y - 62 * s, 26 * s * lit, 6 * s, x, { blue: false, alpha: a }); }
}
function crossOut(x, y, r, k) {
  if (k <= 0) return; const a = eout(clamp(k * 2)), b = eout(clamp(k * 2 - 1));
  line([[x - r, y - r], [lerp(x - r, x + r, a), lerp(y - r, y + r, a)]], C.red, 12);
  if (b > 0) line([[x + r, y - r], [lerp(x + r, x - r, b), lerp(y - r, y + r, b)]], C.red, 12);
}
function arrow(x1, y1, x2, y2, k, col = C.navy) { if (k <= 0) return; const x = lerp(x1, x2, k), y = lerp(y1, y2, k); line([[x1, y1], [x, y]], col, 5); if (k > .9) { const a = Math.atan2(y2 - y1, x2 - x1); line([[x - Math.cos(a - .5) * 26, y - Math.sin(a - .5) * 26], [x, y], [x - Math.cos(a + .5) * 26, y - Math.sin(a + .5) * 26]], col, 5); } }
