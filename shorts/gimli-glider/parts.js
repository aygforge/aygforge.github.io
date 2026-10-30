// Illustrated building blocks, drawn in local coordinates.
const L0 = require('./lib');
const { C, S, P, L, hatch, ell, rect, rrect, tracePath, clamp, lerp, noise1, h2, rng, prog, ease, easeOut } = L0;

const TAU = Math.PI * 2;

// ================================================================= Boeing 767, side view (nose → +x)
const FUSE = [
  [-250, -38], [-120, -41], [40, -41], [175, -41], [224, -37], [260, -28], [288, -14], [304, 2],
  [302, 16], [286, 30], [252, 39], [150, 42], [-120, 42], [-190, 36], [-245, 18], [-292, -4],
  [-324, -16], [-320, -27], [-290, -35],
];
const FIN = [[-205, -38], [-282, -172], [-326, -174], [-334, -154], [-320, -26]];
const STAB = [[-250, -9], [-338, -33], [-348, -27], [-300, -1]];
const WING = [[78, 26], [-60, 33], [-182, 74], [-150, 78], [-30, 50]];
const NACELLE = rrect(6, 46, 112, 38, 15);
const PYLON = [[22, 44], [76, 30], [90, 38], [40, 50]];
const NOSEWIN = [[246, -31], [268, -23], [282, -15], [260, -17], [244, -23]];

function leaf(ctx, x, y, r, color) {
  // simplified maple leaf: an 11-point star
  const pts = [];
  for (let i = 0; i < 22; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 11, rr = i % 2 ? r * 0.46 : r * (i % 4 === 0 ? 1 : 0.8);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.95]);
  }
  P(ctx, pts, { fill: color, stroke: false, smooth: false, j: 0.4, sub: false });
  P(ctx, [[x - 1.5, y + r * 0.3], [x + 1.5, y + r * 0.3], [x + 1.5, y + r * 1.1], [x - 1.5, y + r * 1.1]], { fill: color, stroke: false, sub: false, j: 0.3 });
}

// o: color (0..1 fill strength), power (exhaust shimmer), gear (0..1), noseGear (0..1), outline alpha, doors (0..1 open)
function jetSide(ctx, o = {}) {
  const col = o.color == null ? 1 : o.color, line = o.line == null ? 1 : o.line;
  const lw = o.lw || 3.4;
  ctx.save();
  // far engine (peeks out behind the near one)
  P(ctx, rrect(30, 40, 104, 34, 14), { fill: C.greyDark, fa: col, lw: lw * 0.8, alpha: line });
  // exhaust shimmer
  const pw = o.power || 0;
  if (pw > 0.01) {
    for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let i = 0; i < 14; i++) {
        const x = 4 - i * 16, y = 54 + k * 9 + Math.sin(i * 0.9 + S.t * 18 + k) * (2 + i * 0.35);
        pts.push([x, y]);
      }
      L(ctx, pts, { stroke: k === 1 ? C.blueDeep : C.skyDeep, lw: 2.2, alpha: pw * (0.55 - k * 0.1), sketch: false, j: 0.6 });
    }
  }
  // fin + stabiliser
  P(ctx, FIN, { fill: C.red, fa: col, lw, alpha: line });
  hatch(ctx, FIN, { color: C.redDeep, gap: 10, alpha: 0.18 * col, angle: -1.2 });
  P(ctx, ell(-290, -106, 22, 23, 22), { fill: C.white, fa: col, stroke: C.redDeep, lw: 1.6, alpha: line });
  if (col > 0.05) { ctx.save(); ctx.globalAlpha *= col; leaf(ctx, -290, -110, 15, C.red); ctx.restore(); }
  P(ctx, STAB, { fill: C.grey, fa: col, lw: lw * 0.85, alpha: line });
  // fuselage
  P(ctx, FUSE, { fill: C.white, fa: col, lw: 0.01, stroke: false });
  if (col > 0.02) {
    ctx.save();
    tracePath(ctx, FUSE, true, true); ctx.clip();
    ctx.globalAlpha *= col;
    P(ctx, rect(-340, 14, 660, 40), { fill: C.grey, stroke: false, sub: false, j: 0 });
    hatch(ctx, rect(-340, 22, 660, 30), { color: C.ink, gap: 8, alpha: 0.12, angle: -0.5 });
    // cheatline
    P(ctx, [[-330, -7], [300, -9], [300, 3], [-330, 3]], { fill: C.red, stroke: false, sub: false, j: 0.5 });
    ctx.restore();
    // windows
    ctx.save(); ctx.globalAlpha *= col * 0.85; ctx.fillStyle = C.ink;
    ctx.beginPath();
    for (let x = -228; x < 214; x += 11.5) {
      if (Math.abs(x - 118) < 12 || Math.abs(x + 150) < 12 || Math.abs(x - 216) < 10) continue;
      ctx.rect(x, -21, 5, 8);
    }
    ctx.fill(); ctx.restore();
  }
  P(ctx, FUSE, { stroke: C.ink, lw, alpha: line });
  P(ctx, NOSEWIN, { fill: C.ink, fa: col * 0.9, lw: lw * 0.6, alpha: line, smooth: false });
  // doors
  const dOpen = o.doors || 0;
  for (const dx of [224, 118, -150, -244]) {
    if (dOpen > 0.02) {
      P(ctx, rrect(dx - 7, -30, 15, 40, 4), { fill: C.ink, fa: 0.85 * dOpen, lw: 1.4, alpha: line });
      P(ctx, rrect(dx + 8, -30, 15 * dOpen, 40, 4), { fill: C.white, lw: 1.4, alpha: line * dOpen });
    } else P(ctx, rrect(dx - 7, -30, 15, 40, 4), { stroke: C.inkSoft, lw: 1.3, alpha: line * 0.7 });
  }
  // wing + engine (near side)
  P(ctx, WING, { fill: C.grey, fa: col, lw, alpha: line });
  hatch(ctx, WING, { color: C.ink, gap: 7, alpha: 0.14 * col, angle: 0.4 });
  P(ctx, PYLON, { fill: C.greyDark, fa: col, lw: lw * 0.8, alpha: line });
  P(ctx, NACELLE, { fill: C.white, fa: col, lw, alpha: line });
  hatch(ctx, rrect(8, 64, 108, 16, 6), { color: C.ink, gap: 6, alpha: 0.16 * col, angle: -0.3 });
  P(ctx, ell(118, 65, 7, 19, 16), { fill: C.panelDark, fa: col, lw: lw * 0.8, alpha: line });
  P(ctx, [[6, 50], [-10, 56], [-10, 74], [6, 80]], { fill: C.greyDark, fa: col, lw: lw * 0.7, alpha: line });
  // landing gear
  const g = o.gear || 0;
  if (g > 0.01) {
    const len = 46 * g;
    L(ctx, [[-45, 40], [-45, 40 + len]], { lw: lw * 1.3, alpha: line });
    P(ctx, ell(-58, 44 + len, 13, 13, 14), { fill: C.panelDark, fa: col, lw: lw * 0.9, alpha: line });
    P(ctx, ell(-32, 44 + len, 13, 13, 14), { fill: C.panelDark, fa: col, lw: lw * 0.9, alpha: line });
    const ng = (o.noseGear == null ? 1 : o.noseGear) * g;
    if (ng > 0.02) {
      const nl = 40 * ng;
      L(ctx, [[232, 36], [232, 36 + nl]], { lw: lw * 1.1, alpha: line });
      P(ctx, ell(232, 40 + nl, 10, 10, 12), { fill: C.panelDark, fa: col, lw: lw * 0.8, alpha: line });
    }
  }
  ctx.restore();
}

// ================================================================= Boeing 767, top view (nose → -y)
function jetTop(ctx, o = {}) {
  const lw = o.lw || 3.4, col = o.color == null ? 1 : o.color;
  const ex = o.exhaust || [1, 1];
  // exhaust trails
  for (let s = 0; s < 2; s++) {
    const x0 = s ? 98 : -98, a = ex[s];
    if (a < 0.01) continue;
    for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let i = 0; i < 18; i++) {
        const y = 92 + i * 22, x = x0 + (k - 1) * 6 + Math.sin(i * 0.8 - S.t * 16 + k * 2) * (1.5 + i * 0.5);
        pts.push([x, y]);
      }
      L(ctx, pts, { stroke: k === 1 ? C.white : C.skyDeep, lw: k === 1 ? 7 : 2.4, alpha: a * (k === 1 ? 0.75 : 0.6), sketch: false, j: 0.8 });
    }
  }
  const wingR = [[18, -18], [282, 100], [286, 122], [18, 66]];
  const wingL = wingR.map(([x, y]) => [-x, y]);
  const stabR = [[14, 218], [112, 262], [114, 276], [14, 262]];
  const stabL = stabR.map(([x, y]) => [-x, y]);
  for (const w of [wingL, wingR]) { P(ctx, w, { fill: C.grey, fa: col, lw }); hatch(ctx, w, { gap: 8, alpha: 0.12, angle: 0.5 }); }
  for (const w of [stabL, stabR]) P(ctx, w, { fill: C.grey, fa: col, lw: lw * 0.85 });
  // engines
  for (let s = 0; s < 2; s++) {
    const x = s ? 98 : -98, on = ex[s];
    P(ctx, rrect(x - 15, -6, 30, 92, 12), { fill: C.white, fa: col, lw });
    P(ctx, ell(x, -4, 13, 5, 14), { fill: C.panelDark, lw: lw * 0.6 });
    // little status glow on pod
    P(ctx, ell(x, 40, 5, 5, 10), { fill: on > 0.5 ? C.green : C.greyDark, stroke: false, j: 0.3 });
  }
  const fus = [[0, -300], [16, -280], [22, -240], [22, 200], [14, 280], [4, 318], [-4, 318], [-14, 280], [-22, 200], [-22, -240], [-16, -280]];
  P(ctx, fus, { fill: C.white, fa: col, lw });
  P(ctx, [[-4, 200], [4, 200], [5, 312], [-5, 312]], { fill: C.red, fa: col, lw: 1.6 });
  P(ctx, [[-12, -262], [12, -262], [9, -252], [-9, -252]], { fill: C.ink, lw: 1.2, smooth: false });
}

// ================================================================= Engine fan face
function fan(ctx, r, angle, speed, o = {}) {
  const dim = o.dim || 0;
  P(ctx, ell(0, 0, r, r, 40), { fill: C.white, lw: 5 });
  P(ctx, ell(0, 0, r * 0.88, r * 0.88, 40), { fill: C.panelDark, lw: 3.5 });
  const blur = clamp(speed / 14);
  const blades = 20;
  const copies = blur > 0.05 ? 4 : 1;
  for (let c = 0; c < copies; c++) {
    const a0 = angle - c * 0.045 * blur * 2;
    const alpha = copies > 1 ? (c === 0 ? 0.85 - blur * 0.35 : 0.30 - blur * 0.05) : 1;
    ctx.save(); ctx.globalAlpha *= alpha;
    for (let i = 0; i < blades; i++) {
      const a = a0 + i * TAU / blades;
      const pts = [];
      for (let k = 0; k <= 4; k++) { const rr = lerp(r * 0.24, r * 0.85, k / 4); const aa = a + k * 0.07; pts.push([Math.cos(aa) * rr, Math.sin(aa) * rr]); }
      for (let k = 4; k >= 0; k--) { const rr = lerp(r * 0.24, r * 0.85, k / 4); const aa = a + 0.17 + k * 0.1; pts.push([Math.cos(aa) * rr, Math.sin(aa) * rr]); }
      P(ctx, pts, { fill: dim > 0.5 ? C.greyDark : C.grey, lw: 1.6, stroke: C.ink, sketch: false, j: 0.5, sub: false });
    }
    ctx.restore();
  }
  if (blur > 0.05) {
    ctx.save(); ctx.globalAlpha *= blur * 0.45;
    P(ctx, ell(0, 0, r * 0.84, r * 0.84, 36), { fill: C.grey, stroke: false });
    ctx.restore();
    // motion arcs
    for (let k = 0; k < 3; k++) {
      const rr = r * (0.45 + k * 0.15);
      L(ctx, ell(0, 0, rr, rr, 12, 0, angle * 0.3 + k, angle * 0.3 + k + 1.4), { stroke: C.white, lw: 3, alpha: blur * 0.6, sketch: false });
    }
  }
  // spinner with spiral mark (shows rotation even when blurred)
  P(ctx, ell(0, 0, r * 0.22, r * 0.22, 24), { fill: C.white, lw: 3 });
  const sp = [];
  for (let k = 0; k <= 16; k++) { const rr = r * 0.2 * k / 16, a = angle * 0.9 + k * 0.32; sp.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  L(ctx, sp, { stroke: C.ink, lw: 3.2, j: 0.3, sketch: false });
}

// ================================================================= Clouds
function cloudPts(w, h, seed) {
  // cumulus: flat base, top = envelope of overlapping round puffs
  const R = rng(seed), n = 4 + Math.floor(R() * 3), puffs = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, mx = -w / 2 + w * u + (R() - 0.5) * w / n * 0.3;
    const rx = w / n * (0.75 + R() * 0.35), top = h * (0.35 + 0.65 * Math.sin(Math.PI * u)) * (0.8 + R() * 0.3);
    puffs.push([mx, rx, top]);
  }
  const pts = [], N = 48;
  for (let k = 0; k <= N; k++) {
    const x = -w / 2 + w * k / N;
    let y = 0;
    for (const [mx, rx, top] of puffs) {
      const d = (x - mx) / rx;
      if (Math.abs(d) < 1) y = Math.min(y, -top * Math.sqrt(1 - d * d) - h * 0.08);
    }
    pts.push([x, Math.min(y, -2)]);
  }
  pts.push([w / 2, 0], [w * 0.25, h * 0.08], [-w * 0.25, h * 0.08], [-w / 2, 0]);
  return pts;
}
function cloud(ctx, x, y, w, seed, o = {}) {
  ctx.save(); ctx.translate(x, y);
  const pts = cloudPts(w, w * 0.36, seed);
  P(ctx, pts, { fill: o.fill || C.cloud, stroke: o.stroke || C.inkSoft, lw: o.lw || 2.2, alpha: o.alpha == null ? 1 : o.alpha, sa: 0.5 });
  hatch(ctx, pts, { color: C.blueDeep, gap: 8, alpha: 0.13 * (o.alpha == null ? 1 : o.alpha), angle: -0.3 });
  ctx.restore();
}

// ================================================================= People
function person(ctx, x, y, h, o = {}) {
  const R = rng(o.seed || 1);
  const shirt = o.shirt || [C.red, C.blue, C.yellow, C.green, C.orange, C.white][Math.floor(R() * 6)];
  const pants = o.pants || [C.navyCloth, C.tan, C.blueDeep][Math.floor(R() * 3)];
  const s = h / 100, lw = Math.max(1.4, 3 * s);
  const t = S.t + (o.phase || 0);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const run = o.run || 0, step = Math.sin(t * 12) * run;
  // legs
  L(ctx, [[-6, -46], [-8 - step * 14, 0]], { stroke: pants, lw: 11, sketch: false, j: 0.6 });
  L(ctx, [[6, -46], [8 + step * 14, 0]], { stroke: pants, lw: 11, sketch: false, j: 0.6 });
  // body
  P(ctx, rrect(-15, -84, 30, 42, 9), { fill: shirt, lw: lw / s });
  // arms
  const wave = o.wave ? Math.sin(t * 9) * 0.5 : 0;
  const up = o.point ? 1 : 0;
  L(ctx, [[-13, -78], [-26 - up * 4, -54 - up * 52 + wave * 30]], { stroke: shirt, lw: 8, sketch: false, j: 0.6 });
  L(ctx, [[13, -78], [26 + step * 8, -52 + (o.wave ? -54 - wave * 30 : 0)]], { stroke: shirt, lw: 8, sketch: false, j: 0.6 });
  // head
  P(ctx, ell(0, -98, 12, 13, 14), { fill: C.skin, lw: lw / s * 0.9 });
  P(ctx, ell(0, -105, 12, 7, 12, 0, Math.PI, TAU), { fill: o.hair || C.hair, stroke: false });
  ctx.restore();
}

// ================================================================= Cars
function carSide(ctx, x, y, w, color, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, w / 100);
  if (o.flip) ctx.scale(-1, 1);
  const body = [[-50, -8], [-48, -24], [-22, -26], [-12, -40], [22, -40], [34, -26], [50, -22], [50, -8]];
  P(ctx, body, { fill: color, lw: 2.6, smooth: false });
  P(ctx, [[-8, -36], [18, -36], [27, -26], [-15, -26]], { fill: C.skyHi, lw: 1.6, smooth: false });
  if (o.stripe) P(ctx, rect(-48, -20, 98, 4), { fill: C.white, stroke: false, sub: false });
  for (const wx of [-30, 30]) P(ctx, ell(wx, -6, 10, 10, 12), { fill: C.panelDark, lw: 2 });
  ctx.restore();
}
function carRear(ctx, x, y, w, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, w / 100);
  P(ctx, rect(-46, -48, 10, 22), { fill: C.panelDark, lw: 1.5, smooth: false });
  P(ctx, rect(36, -48, 10, 22), { fill: C.panelDark, lw: 1.5, smooth: false });
  P(ctx, [[-44, -30], [-40, -60], [-28, -82], [28, -82], [40, -60], [44, -30]], { fill: color, lw: 2.6, smooth: false });
  P(ctx, [[-24, -78], [24, -78], [32, -62], [-32, -62]], { fill: C.skyHi, lw: 1.5, smooth: false });
  P(ctx, rect(-38, -50, 12, 6), { fill: C.red, stroke: false, sub: false });
  P(ctx, rect(26, -50, 12, 6), { fill: C.red, stroke: false, sub: false });
  ctx.restore();
}
function tent(ctx, x, y, w, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, w / 100);
  L(ctx, [[-44, 0], [-44, -60]], { lw: 3 }); L(ctx, [[44, 0], [44, -60]], { lw: 3 });
  P(ctx, [[-54, -56], [0, -86], [54, -56]], { fill: color, lw: 2.6, smooth: false });
  P(ctx, [[-54, -56], [54, -56], [54, -46], [-54, -46]], { fill: C.white, lw: 2, smooth: false });
  ctx.restore();
}
function camper(ctx, x, y, w) {
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, w / 100);
  P(ctx, rrect(-50, -56, 100, 48, 8), { fill: C.white, lw: 2.6 });
  P(ctx, rect(-50, -30, 100, 8), { fill: C.orange, stroke: false, sub: false });
  P(ctx, rect(-36, -48, 22, 12), { fill: C.skyHi, lw: 1.5, smooth: false });
  P(ctx, rect(10, -48, 22, 12), { fill: C.skyHi, lw: 1.5, smooth: false });
  for (const wx of [-26, 26]) P(ctx, ell(wx, -6, 9, 9, 12), { fill: C.panelDark, lw: 2 });
  ctx.restore();
}
function flag(ctx, x, y, h) {
  L(ctx, [[x, y], [x, y - h]], { lw: Math.max(1.5, h * 0.03) });
  const fw = h * 0.42, fh = h * 0.26, wv = Math.sin(S.t * 6) * h * 0.03;
  ctx.save(); ctx.translate(x, y - h);
  P(ctx, [[0, 0], [fw, wv], [fw, fh + wv], [0, fh]], { fill: C.white, lw: Math.max(1.2, h * 0.02), smooth: false });
  ctx.fillStyle = C.ink; ctx.globalAlpha *= 0.85;
  const n = 4, m = 3;
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) if ((i + j) % 2 === 0) {
    const x0 = fw * i / n, y0 = fh * j / m + wv * i / n;
    ctx.fillRect(x0, y0, fw / n, fh / m);
  }
  ctx.restore();
}

// ================================================================= Sailplane (plan view)
function sailplaneTop(ctx, o = {}) {
  const lw = o.lw || 3, alpha = o.alpha == null ? 1 : o.alpha;
  const fill = o.fill === undefined ? C.white : o.fill;
  const wing = [[-330, 0], [-20, -10], [20, -10], [330, 0], [330, 10], [20, 12], [-20, 12], [-330, 10]];
  P(ctx, wing, { fill, lw, alpha, dash: o.dash, smooth: false });
  P(ctx, [[0, -90], [9, -70], [8, 40], [3, 170], [-3, 170], [-8, 40], [-9, -70]], { fill, lw, alpha, dash: o.dash });
  P(ctx, [[-60, 160], [60, 160], [60, 170], [-60, 170]], { fill, lw, alpha, dash: o.dash, smooth: false });
}

// ================================================================= Scribbles (unreadable handwriting marks)
function scribble(ctx, x, y, w, h, seed, reveal = 1, o = {}) {
  const R = rng(seed), pts = [];
  const n = Math.max(3, Math.round(w / (h * 0.55)));
  for (let i = 0; i < n; i++) {
    const cx = x + (i + 0.5) * w / n, kind = Math.floor(R() * 4);
    const hw = w / n * 0.42;
    if (kind === 0) { for (let k = 0; k <= 8; k++) { const a = -Math.PI / 2 + k / 8 * TAU; pts.push([cx + Math.cos(a) * hw, y - h / 2 + Math.sin(a) * h / 2]); } }
    else if (kind === 1) { pts.push([cx - hw * 0.6, y - h * 0.7], [cx + hw * 0.2, y - h], [cx, y]); }
    else if (kind === 2) { pts.push([cx - hw, y - h * 0.8], [cx + hw, y - h * 0.9], [cx - hw * 0.4, y - h * 0.3], [cx + hw, y]); }
    else { pts.push([cx - hw, y - h], [cx - hw * 0.3, y - h * 0.4], [cx + hw * 0.5, y - h * 0.95], [cx + hw * 0.6, y]); }
  }
  L(ctx, pts, { reveal, lw: o.lw || 4, stroke: o.color || C.ink, j: 0.8, smooth: true, sub: false, sketch: false });
}

module.exports = { jetSide, jetTop, fan, cloud, person, carSide, carRear, tent, camper, flag, sailplaneTop, scribble, leaf, FUSE, TAU };
