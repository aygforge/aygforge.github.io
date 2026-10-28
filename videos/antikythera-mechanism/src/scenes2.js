'use strict';
// ======================= SCENE 3 — LOOKED LIKE JUNK ========================
const S3 = { fx: 520, fy: 1390, fs: 200, rot: -0.1 };
function s3Tooth() { const lx = 0.48 * S3.fs, ly = 0.3 * S3.fs, c = Math.cos(S3.rot), s = Math.sin(S3.rot); return [S3.fx + lx * c - ly * s, S3.fy + lx * s + ly * c]; }
function scene3(ctx, t) {
  paperBg(ctx);
  const [tx, ty] = s3Tooth();
  const zp = ease(prog(t, 13.2, 16.6)), zf = easeIn(prog(t, 16.75, 17.55));
  const s = lerp(1.0, 1.9, zp) * (1 + 5 * zf);
  ctx.save();
  cam(ctx, lerp(560, tx, zp), lerp(1250, ty, zp), s, W / 2, lerp(1200, 1150, zp));
  studyRoom(ctx, t);
  fragment(ctx, 250, 1260, 70, 0.5, t, { shape: FRAG_C, seed: 141 });
  fragment(ctx, 800, 1250, 85, -0.3, t, { shape: FRAG_B, seed: 151 });
  fragment(ctx, 820, 1570, 38, 1.1, t, { shape: FRAG_C, seed: 161 });
  fragment(ctx, 300, 1560, 30, 2.1, t, { shape: FRAG_B, seed: 171 });
  const tooth = easeOut(prog(t, 15.2, 15.9));
  fragment(ctx, S3.fx, S3.fy, S3.fs, S3.rot, t, { gearVis: 0.12, tooth });
  sparks(ctx, tx, ty, 34, 62, 7, Math.sin(clamp(prog(t, 15.4, 16.6)) * Math.PI), C.brassDk, 5);
  researcher(ctx, t);
  magnifier(ctx, t, tooth);
  ctx.restore();
}
function studyRoom(ctx, t) {
  // shelf with finds on the wall
  draw(ctx, rr(-200, 640, 1480, 26, 6), { fill: C.woodLt, seed: 610 });
  amphora(ctx, 150, 560, 70, 0, 8);
  amphora(ctx, 300, 575, 55, 0.1, 9, { color: '#c98a64' });
  draw(ctx, rr(420, 560, 70, 80, 10), { fill: '#9fb8a8', seed: 611 });
  draw(ctx, rr(510, 590, 110, 50, 8), { fill: C.parchDk, seed: 612 });
  // warm lamp light
  const g = ctx.createRadialGradient(330, 1200, 40, 330, 1200, 900);
  g.addColorStop(0, 'rgba(255,214,130,0.28)'); g.addColorStop(1, 'rgba(255,214,130,0)');
  // table
  const top = [[-300, 1010], [1380, 1010], [1500, 2400], [-420, 2400]];
  draw(ctx, top, { fill: C.woodLt, seed: 613, lw: 5 });
  for (let i = 0; i < 8; i++) line(ctx, [[-300, 1060 + i * 120], [300, 1070 + i * 120 + Math.sin(i) * 10], [1380, 1055 + i * 125]], { stroke: C.wood, lw: 2.5, seed: 614 + i, single: true, alpha: 0.55 });
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(-500, 600, 2200, 1800); ctx.restore();
  // felt tray
  draw(ctx, [[120, 1110], [960, 1100], [990, 1700], [90, 1715]], { fill: '#56705f', seed: 622, lw: 4.5, shade: [0, -10, 'rgba(20,30,20,0.2)'] });
  // notebook with a sketch
  ctx.save(); ctx.translate(150, 1820); ctx.rotate(-0.12);
  draw(ctx, rr(-150, -110, 300, 220, 10), { fill: C.paperLt, seed: 630 });
  for (let i = 0; i < 6; i++) line(ctx, [[-120, -70 + i * 30], [-10 - h1(i) * 40, -70 + i * 30]], { lw: 2, seed: 631 + i, single: true, alpha: 0.5 });
  gear(ctx, 70, -10, 55, t * 0.2, { fill: 'rgba(0,0,0,0)', lw: 2.5, teeth: 18, noShade: true, single: true, spokes: 4 });
  ctx.restore();
  // brush
  tube(ctx, [[930, 1880], [1080, 1760]], 14, C.woodDk, { seed: 640 });
}
function researcher(ctx, t) {
  const lean = Math.sin(t * 0.9) * 0.02 + 0.06;
  ctx.save(); ctx.translate(980, 1010); ctx.rotate(-lean);
  draw(ctx, [[-170, 0], [-90, -120], [40, -150], [200, -120], [260, 200], [-200, 200]], { fill: '#5a4a5e', seed: 650 });
  draw(ctx, [[-70, -130], [10, -95], [50, -150], [-20, -170]], { fill: '#f1ece0', seed: 651 });
  draw(ctx, [[-10, -110], [12, -112], [20, -30], [0, -10], [-12, -32]], { fill: C.red, seed: 652, lw: 3 });
  // head in profile, facing left
  ctx.translate(-20, -290);
  draw(ctx, [[-20, 110], [40, 100], [50, 160], [-10, 170]], { fill: '#d8a986', seed: 653 });
  const head = [[-80, -60], [-30, -110], [50, -110], [100, -50], [105, 30], [80, 100], [20, 130], [-45, 110], [-70, 70], [-78, 40], [-110, 10], [-82, -5], [-86, -30]];
  draw(ctx, head, { fill: '#e2b48f', seed: 654, shade: [12, 0, 'rgba(120,60,30,0.15)'] });
  draw(ctx, [[-85, -45], [-40, -120], [60, -125], [110, -60], [100, 10], [70, -40], [10, -70], [-60, -55]], { fill: '#5b4a3a', seed: 655 });
  draw(ctx, ellAt(55, 15, 20, 28, 12), { fill: '#d39f7c', seed: 656 });
  draw(ctx, [[-95, 30], [-60, 22], [-35, 40], [-60, 52], [-92, 46]], { fill: '#5b4a3a', seed: 657 });
  draw(ctx, circAt(-50, -10, 26, 14), { fill: 'rgba(220,235,240,0.5)', tex: false, seed: 658, lw: 4 });
  line(ctx, [[-24, -12], [45, -5]], { lw: 3.5, seed: 659 });
  dot(ctx, -58, -8, 5, C.ink);
  line(ctx, [[-70, -40], [-40, -44]], { lw: 3.5, seed: 660, single: true });
  ctx.restore();
}
function magnifier(ctx, t, tooth) {
  const [tx, ty] = s3Tooth();
  const p = ease(prog(t, 13.4, 15.6));
  const lx = lerp(760, tx + 10, p) + Math.sin(t * 1.3) * 12, ly = lerp(1500, ty - 10, p) + Math.cos(t * 1.1) * 10, R = 105;
  // arm and hand from bottom right
  tube(ctx, [[1250, 2150], [lx + 260, ly + 300], [lx + 150, ly + 165]], 90, '#5a4a5e', { seed: 670 });
  draw(ctx, circAt(lx + 130, ly + 150, 46, 14), { fill: '#e2b48f', seed: 671 });
  tube(ctx, [[lx + 120, ly + 135], [lx + R * 0.72, ly + R * 0.72]], 22, C.woodDk, { seed: 672 });
  // magnified view
  ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, R, 0, TAU); ctx.clip();
  ctx.translate(lx, ly); ctx.scale(1.9, 1.9); ctx.translate(-lx, -ly);
  draw(ctx, rr(lx - 200, ly - 200, 400, 400, 2), { fill: '#56705f', stroke: null, lw: 0, seed: 673 });
  fragment(ctx, S3.fx, S3.fy, S3.fs, S3.rot, t, { gearVis: 0.12, tooth, shadow: false });
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#e8f4f6'; ctx.beginPath(); ctx.arc(lx, ly, R, 0, TAU); ctx.fill(); ctx.restore();
  line(ctx, arcPts(lx, ly, R * 0.7, -2.5, -1.7, 5), { stroke: '#ffffff', lw: 5, seed: 674, single: true, alpha: 0.8 });
  draw(ctx, circAt(lx, ly, R, 30), { fill: null, stroke: C.brassDk, lw: 16, seed: 675, single: true });
  draw(ctx, circAt(lx, ly, R + 8, 30), { fill: null, lw: 4, seed: 676, single: true });
  draw(ctx, circAt(lx, ly, R - 8, 30), { fill: null, lw: 3, seed: 677, single: true });
}

// ========================= SCENE 4 — HIDDEN GEARS ==========================
const GEARS4 = (() => {
  const R = rngf(4242), gs = [];
  const add = g => { gs.push(g); return g; };
  const root = add({ x: 0, y: 0, r: 220, L: 1, w: 0.35, k: 0, spokes: 4, fill: C.brass });
  const cols = [C.brass, C.brassLt, C.gold, '#b9a35a', C.brassLt];
  function grow(layer, count, seedGear, bounds) {
    let tries = 0, made = 0;
    while (made < count && tries < 600) {
      tries++;
      const pool = gs.filter(g => g.L === layer); const par = pool[Math.floor(R() * pool.length)];
      const r = 42 + R() * 95, a = R() * TAU, d = par.r + r - Math.min(par.r, r) * 0.12;
      const x = par.x + Math.cos(a) * d, y = par.y + Math.sin(a) * d;
      if (Math.abs(x) + r > bounds[0] || Math.abs(y) + r > bounds[1]) continue;
      if (pool.some(g => g !== par && Math.hypot(g.x - x, g.y - y) < g.r + r + 8)) continue;
      add({ x, y, r, L: layer, w: -par.w * par.r / r, k: gs.length, spokes: r > 75 ? 4 : 0, fill: cols[gs.length % cols.length] }); made++;
    }
  }
  grow(1, 12, root, [500, 430]);
  // other layers start coaxial with existing gears
  for (const L of [0, 2]) {
    const base = gs.filter(g => g.L === 1)[L === 0 ? 3 : 6];
    add({ x: base.x, y: base.y, r: base.r * 0.6 + 30, L, w: base.w, k: gs.length, spokes: 0, fill: C.brassLt, axle: true });
    add({ x: 0, y: 0, r: L === 0 ? 150 : 120, L, w: root.w, k: gs.length, spokes: 4, fill: C.gold, axle: true });
    grow(L, 7, null, [480, 380]);
  }
  gs.forEach((g, i) => g.seed = 700 + i * 7);
  return gs;
})();
function scene4(ctx, t) {
  paperBg(ctx);
  // the corroded surface we zoom through
  const sp = prog(t, 17.05, 18.1);
  if (sp < 1) fragment(ctx, 540, 1180, 900 * (1 + 3 * easeIn(sp)), 0.2, t, { alpha: 1 - sp, shadow: false, seed: 120 });
  const iso = ease(prog(t, 19.8, 21.6)), pull = ease(prog(t, 19.6, 22.0));
  const k = lerp(1.0, 0.68, pull), sy = lerp(1, 0.5, iso), spread = 300 * iso;
  const cx = 540, cy = lerp(1170, 1230, pull);
  const appear = g => g.L === 1 ? (g.k === 0 ? prog(t, 17.2, 17.7) : prog(t, 17.6 + g.k * 0.14, 17.9 + g.k * 0.14)) : prog(t, 20.2 + (g.k % 9) * 0.12, 20.5 + (g.k % 9) * 0.12);
  const lyOff = L => (1 - L) * spread;
  // dashed axles between coaxial gears
  for (const g of GEARS4) if (g.axle) {
    const a = appear(g); if (a <= 0) continue;
    const y1 = cy + g.y * k * sy + lyOff(g.L), y2 = cy + g.y * k * sy + lyOff(1);
    line(ctx, [[cx + g.x * k, y1], [cx + g.x * k, y2]], { lw: 3.5, dash: [12, 10], seed: g.seed, single: true, alpha: a });
  }
  for (const L of [0, 1, 2]) for (const g of GEARS4) {
    if (g.L !== L) continue;
    const a = appear(g); if (a <= 0) continue;
    const r = g.r * k * backOut(a);
    gear(ctx, cx + g.x * k, cy + g.y * k * sy + lyOff(L), r, g.w * (t - 17) * 0.9 + g.k, { fill: g.fill, spokes: g.spokes, sy, seed: g.seed, teeth: Math.round(g.r * 0.3), depth: clamp(r * 0.11, 5, 15), alpha: clamp(a * 2), corr: g.k === 0 ? 0.25 : 0 });
  }
  sparks(ctx, cx, cy, 250, 300, 12, Math.sin(clamp(prog(t, 17.3, 18.2)) * Math.PI), C.brassDk, 9);
}

// ===================== SCENE 5 — WHAT IT COULD DO ==========================
const D5 = { x: 540, y: 990, R: 280 };
const DRIVE5 = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => [D5.x + sx * 262, D5.y + sy * 262]);
function s5Angles(t) {
  const sunA = -Math.PI / 2 - 0.5 + (t - 23) * 0.22;
  const moonA = sunA + 4.726 + (t - 24.3) * 1.4;
  return [sunA, moonA];
}
function scene5(ctx, t) {
  paperBg(ctx);
  stars(ctx, t, 20, 40, 480, 1000, 1400, 33, 0.6, C.brassLt);
  ctx.save();
  cam(ctx, 540, 1180, 1 + 0.04 * prog(t, 22.8, 32.7), W / 2, 1180);
  const big = 300, wBig = 0.25;
  gear(ctx, D5.x, D5.y, big, (t - 22) * wBig, { fill: C.brassDk, teeth: 72, depth: 16, spokes: 4, seed: 801 });
  const gTimes = [23.7, 24.3, 26.9, 29.2];
  DRIVE5.forEach(([x, y], i) => {
    const a = backOut(prog(t, gTimes[i] - 0.4, gTimes[i]));
    if (a > 0) gear(ctx, x, y, 72 * a, -(t - 22) * wBig * big / 72 + i, { fill: [C.gold, C.brassLt, C.brass, '#b9a35a'][i], teeth: 18, depth: 11, seed: 810 + i });
  });
  const [sunA, moonA] = s5Angles(t);
  const plate = smooth(prog(t, 22.8, 23.4));
  const moonMorph = ease(prog(t, 24.3, 24.9)), calMorph = ease(prog(t, 26.9, 27.5));
  frontDial(ctx, D5.x, D5.y, D5.R, t, {
    alpha: plate, sunA, moonA, sunVis: easeOut(prog(t, 23.7, 24.1)), moonVis: easeOut(prog(t, 24.7, 25.1)),
    earthVis: easeOut(prog(t, 23.2, 23.6)), zod: smooth(prog(t, 25.4, 26.2)), nightA: 1,
    cal: smooth(prog(t, 27.3, 27.8)), calDraw: prog(t, 27.4, 28.8), ringRot: (t - 27) * 0.05, orbit: smooth(prog(t, 24.8, 25.2)) * (1 - smooth(prog(t, 25.4, 26.2))),
  });
  // gear -> moon orbit morph
  if (moonMorph > 0 && moonMorph < 1) { const [gx, gy] = DRIVE5[1]; draw(ctx, circAt(lerp(gx, D5.x, moonMorph), lerp(gy, D5.y, moonMorph), lerp(72, D5.R * 0.5, moonMorph), 36), { fill: null, stroke: C.moon, lw: 5, dash: [12, 10], seed: 830, alpha: 1 - moonMorph * 0.3 }); }
  // gear -> calendar ring morph
  if (calMorph > 0 && calMorph < 1) { const [gx, gy] = DRIVE5[2]; draw(ctx, circAt(lerp(gx, D5.x, calMorph), lerp(gy, D5.y, calMorph), lerp(72, D5.R * 0.9, calMorph), 50), { fill: null, stroke: C.brassDk, lw: 9, seed: 831 }); }
  // drive arrows from each gear to what it moves
  const targets = [
    [D5.x + Math.cos(sunA) * D5.R * 0.74, D5.y + Math.sin(sunA) * D5.R * 0.74],
    [D5.x + Math.cos(moonA) * D5.R * 0.5, D5.y + Math.sin(moonA) * D5.R * 0.5],
    [D5.x - D5.R * 0.62, D5.y + D5.R * 0.62],
    [D5.x + 120, 1430],
  ];
  DRIVE5.forEach(([x, y], i) => {
    const a = prog(t, gTimes[i], gTimes[i] + 0.5) * (1 - prog(t, gTimes[i] + 2.2, gTimes[i] + 2.8));
    if (a <= 0) return;
    const [ex, ey] = targets[i], mx = (x + ex) / 2 + (y - ey) * 0.15, my = (y + ey) / 2 + (ex - x) * 0.15;
    const pts = []; for (let k = 0; k <= 12 * Math.min(1, a * 2); k++) { const u = k / 12; pts.push([(1 - u) * (1 - u) * x + 2 * u * (1 - u) * mx + u * u * ex, (1 - u) * (1 - u) * y + 2 * u * (1 - u) * my + u * u * ey]); }
    if (pts.length > 1) line(ctx, pts, { lw: 4.5, dash: [12, 10], stroke: C.red, seed: 840 + i, single: true, alpha: Math.min(1, a * 3) });
  });
  // eclipse: pointers align -> eclipse symbol -> eclipse spiral dial
  const sx = D5.x + Math.cos(sunA) * D5.R * 0.74, sy2 = D5.y + Math.sin(sunA) * D5.R * 0.74;
  const ep = prog(t, 29.6, 30.1), fly = ease(prog(t, 30.4, 31.1));
  const spiralA = smooth(prog(t, 29.2, 29.8));
  if (spiralA > 0) spiralDial(ctx, D5.x, lerp(1780, 1560, spiralA), 190, t, { alpha: spiralA, draw: prog(t, 29.3, 30.3), glyphs: prog(t, 31.0, 32.4), ptr: -Math.PI / 2 + (t - 29) * 0.9 });
  if (ep > 0 && fly < 1) {
    const ex = lerp(sx, D5.x, fly), ey = lerp(sy2, 1560, fly), er = lerp(48, 30, fly) * backOut(ep);
    eclipseGlyph(ctx, ex, ey, er, 1, 850, lerp(0.55, 1.0, ep));
    sparks(ctx, ex, ey, er * 1.3, er * 2.0, 10, Math.sin(clamp(ep) * Math.PI) * (1 - fly), C.ink, 11);
  }
  ctx.restore();
}

// ================ SCENE 6 — AHEAD OF ITS TIME (timeline) ===================
const TL = { y: 1290, x0: 330, x1: 3800 };
function scene6(ctx, t) {
  paperBg(ctx);
  const pan = ease(prog(t, 33.5, 39.0)), out = ease(prog(t, 40.2, 42.0));
  const fx = lerp(lerp(TL.x0, TL.x1, pan), (TL.x0 + TL.x1) / 2, out);
  const s = lerp(lerp(1.1, 1.0, Math.sin(pan * Math.PI)) * lerp(1, 1.08, prog(t, 39, 40.2)), 0.265, out);
  ctx.save();
  cam(ctx, fx, 1110, s, W / 2, 1180);
  const band = [];
  for (let i = 0; i <= 40; i++) band.push([-300 + i * 115, 840 + vn(i * 0.8, 3) * 14]);
  for (let i = 40; i >= 0; i--) band.push([-300 + i * 115, 1440 + vn(i * 0.8, 7) * 14]);
  draw(ctx, band, { fill: C.parch, seed: 900, lw: 5, step: 40 });
  // faint passing eras along the empty stretch
  eraRuins(ctx, t);
  // timeline line with century ticks, drawn ahead of the camera
  const head = Math.max(TL.x0 + 200, Math.min(TL.x1, fx + 700 / s));
  line(ctx, [[TL.x0, TL.y], [(TL.x0 + head) / 2, TL.y + 6], [head, TL.y]], { lw: 7, seed: 901, step: 40 });
  for (let x = TL.x0 + 150; x < head; x += 150) line(ctx, [[x, TL.y - 22], [x, TL.y + 22]], { lw: 4, seed: 902 + x, single: true });
  // the mechanism at the start
  ctx.save(); ctx.translate(TL.x0, 1040);
  woodCase(ctx, 0, 0, 280, 330);
  const [sa, ma] = s5Angles(t);
  frontDial(ctx, 0, -10, 105, t, { sunA: sa, moonA: ma });
  crank(ctx, 165, 40, 0.8, t * 2);
  ctx.restore();
  // later medieval astronomical clock at the far end
  clockTower(ctx, TL.x1, TL.y, 1, t);
  // overview: the long gap
  if (out > 0) {
    const ga = smooth(prog(t, 40.9, 41.5));
    const ar = []; for (let i = 0; i <= 20; i++) ar.push([lerp(TL.x0 + 200, TL.x1 - 200, i / 20), 760 - Math.sin(i / 20 * Math.PI) * 140]);
    line(ctx, ar.slice(0, Math.max(2, Math.ceil(21 * ga))), { lw: 7, stroke: C.red, seed: 905, dash: [22, 16] });
    if (ga > 0.95) {
      for (const [x, d] of [[TL.x0 + 200, -1], [TL.x1 - 200, 1]]) line(ctx, [[x + d * 60, 720], [x, 760], [x + d * 70, 790]], { lw: 7, stroke: C.red, seed: 906 + d });
    }
    draw(ctx, ellAt(TL.x0, 1060, 260, 300, 30), { fill: null, stroke: C.brassDk, lw: 6, seed: 907, alpha: ga });
    draw(ctx, ellAt(TL.x1, 1010, 260, 380, 30), { fill: null, stroke: C.brassDk, lw: 6, seed: 908, alpha: ga });
  }
  ctx.restore();
  // centuries passing: hourglass + sun and moon racing across the sky
  const ov = smooth(prog(t, 33.3, 33.9)) * (1 - smooth(prog(t, 39.0, 39.8)));
  if (ov > 0) {
    ctx.save(); ctx.globalAlpha = ov;
    hourglass(ctx, 150, 1650, 0.85, t - 33.3, 1.5);
    for (let i = 0; i < 2; i++) {
      const ph = fr((t - 33.3) / 1.5 + i * 0.5), x = lerp(-60, W + 60, ph), y = 720 - Math.sin(ph * Math.PI) * 160;
      if (i === 0) sunBody(ctx, x, y, 34, t); else moonBody(ctx, x, y, 30, 0.35);
    }
    ctx.restore();
  }
}
function eraRuins(ctx, t) {
  ctx.save(); ctx.globalAlpha *= 0.38;
  // roman arch
  ctx.save(); ctx.translate(1150, TL.y - 6);
  draw(ctx, [[-110, 0], [-110, -200], [110, -200], [110, 0], [55, 0], [55, -90], [40, -125], [0, -140], [-40, -125], [-55, -90], [-55, 0]], { fill: C.parchDk, seed: 920 });
  ctx.restore();
  // domed basilica
  ctx.save(); ctx.translate(2050, TL.y - 6);
  draw(ctx, [[-130, 0], [-130, -110], [130, -110], [130, 0]], { fill: C.parchDk, seed: 921 });
  draw(ctx, arcPts(0, -110, 95, Math.PI, TAU, 14).concat([[95, -110]]), { fill: C.parchDk, seed: 922 });
  line(ctx, [[0, -205], [0, -250]], { lw: 4, seed: 923 }); line(ctx, [[-15, -235], [15, -235]], { lw: 4, seed: 924 });
  ctx.restore();
  // castle
  ctx.save(); ctx.translate(2900, TL.y - 6);
  const cs = [[-150, 0], [-150, -170], [-120, -170], [-120, -150], [-95, -150], [-95, -170], [-65, -170], [-65, -110], [65, -110], [65, -170], [95, -170], [95, -150], [120, -150], [120, -170], [150, -170], [150, 0]];
  draw(ctx, cs, { fill: C.parchDk, seed: 925, sharp: true });
  ctx.restore();
  ctx.restore();
  // scattered dust where nothing comparable survives
  for (let i = 0; i < 40; i++) dot(ctx, 600 + h1(i) * 2900, 900 + h1(i * 7) * 500 + Math.sin(t + i) * 6, 2 + h1(i * 3) * 3, C.parchDk, 0.6);
}
function clockTower(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  draw(ctx, [[-150, 0], [-150, -520], [150, -520], [150, 0]], { fill: '#cdb68e', seed: 940, lw: 5 });
  for (let i = 0; i < 9; i++) line(ctx, [[-150, -40 - i * 55], [150, -40 - i * 55]], { lw: 2, seed: 941 + i, single: true, alpha: 0.35 });
  draw(ctx, [[-175, -520], [0, -760], [175, -520]], { fill: '#5d5a78', seed: 950, sharp: true, lw: 5 });
  draw(ctx, [[-60, -640], [-30, -640], [-30, -600], [-60, -600]], { fill: '#f1d68c', sharp: true, seed: 951, lw: 3 });
  // astronomical dial (blue and gold)
  const dy = -330, R = 120;
  draw(ctx, circAt(0, dy, R + 14, 36), { fill: C.brass, seed: 952 });
  draw(ctx, circAt(0, dy, R, 36), { fill: '#3f5f93', seed: 953 });
  draw(ctx, ellAt(0, dy + 30, R * 0.62, R * 0.62, 30), { fill: null, stroke: C.brassLt, lw: 4, seed: 954 });
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; line(ctx, [[Math.cos(a) * R * 0.9, dy + Math.sin(a) * R * 0.9], [Math.cos(a) * R, dy + Math.sin(a) * R]], { stroke: C.brassLt, lw: 3, seed: 955 + i, single: true }); }
  const ha = t * 0.6, ma = t * 1.3;
  line(ctx, [[0, dy], [Math.cos(ha) * R * 0.85, dy + Math.sin(ha) * R * 0.85]], { stroke: C.gold, lw: 7, seed: 980 });
  sunBody(ctx, Math.cos(ha) * R * 0.6, dy + Math.sin(ha) * R * 0.6, 14, t, { lw: 2.5 });
  line(ctx, [[0, dy], [Math.cos(ma) * R * 0.75, dy + Math.sin(ma) * R * 0.75]], { stroke: C.moon, lw: 5, seed: 981 });
  moonBody(ctx, Math.cos(ma) * R * 0.75, dy + Math.sin(ma) * R * 0.75, 12, 0.3);
  // gear room window below the dial
  draw(ctx, rr(-95, -170, 190, 150, 16), { fill: '#3a2f27', seed: 982 });
  ctx.save(); ctx.beginPath(); ctx.rect(-95, -170, 190, 150); ctx.clip();
  gear(ctx, -40, -95, 55, t * 0.8, { teeth: 14, depth: 10, seed: 983 });
  gear(ctx, 42, -110, 38, -t * 0.8 * 55 / 38, { teeth: 10, depth: 9, fill: C.brassLt, seed: 984 });
  ctx.restore();
  ctx.restore();
}

// ================ SCENE 7 — THE "ANCIENT ANALOG COMPUTER" ==================
const F7 = { x: 540, y: 1150, s: 300 };
const RECON7 = [[15, -6, 186, 4, 0], [235, -195, 82, 0, 0], [215, 205, 96, 4, 0], [-235, 170, 72, 0, 0], [-205, -205, 62, 0, 0], [395, 20, 66, 0, 1], [-390, -30, 78, 0, 1], [60, 345, 58, 0, 1], [-60, -360, 60, 0, 1]];
function scene7(ctx, t) {
  paperBg(ctx);
  const zo = ease(prog(t, 50.3, 52.6));
  // cosmos behind (screen space), appears with the zoom out
  if (zo > 0) cosmos(ctx, t, zo);
  ctx.save();
  cam(ctx, F7.x, F7.y, lerp(1 + 0.04 * prog(t, 42, 50), 0.5, zo), W / 2, lerp(1180, 1490, zo));
  const ghost = 1 - 0.55 * smooth(prog(t, 44.6, 45.4));
  const caseA = smooth(prog(t, 47.9, 48.6)), dialA = smooth(prog(t, 48.4, 49.2));
  const crankA = (t - 47.9) * 2.4;
  const sunA = -Math.PI / 2 + 0.4 + crankA * 0.06, moonA = sunA + 1.2 + crankA * 0.55;
  if (caseA > 0) { woodCase(ctx, F7.x, F7.y, 820, 960, { alpha: caseA }); crank(ctx, F7.x + 450, F7.y + 120, 1.3, crankA, { alpha: caseA }); }
  const fragA = 1 - smooth(prog(t, 48.4, 49.2));
  if (fragA > 0) fragment(ctx, F7.x, F7.y, F7.s, -0.08, t, { gearVis: 0.75, alpha: ghost * fragA + (1 - fragA) * 0 });
  RECON7.forEach(([gx, gy, r, sp, outside], i) => {
    const a = prog(t, 44.7 + i * 0.32, 45.2 + i * 0.32);
    if (a <= 0) return;
    const w = (i % 2 ? -1 : 1) * 0.3 * 186 / r * 0.5;
    const shrink = 1 - 0.25 * dialA;
    gear(ctx, F7.x + gx * shrink, F7.y + gy * shrink, r * backOut(a) * shrink, w * (t - 44) + i, {
      fill: outside ? 'rgba(0,0,0,0)' : [C.brass, C.brassLt, C.gold][i % 3], spokes: sp, teeth: Math.round(r * 0.3), depth: clamp(r * 0.1, 6, 14),
      dash: outside ? [10, 9] : null, noShade: !!outside, single: !!outside, seed: 1000 + i * 5, alpha: clamp(a * 2) * (1 - dialA * 0.6),
    });
  });
  if (dialA > 0) frontDial(ctx, F7.x, F7.y - 20, 330, t, { alpha: dialA, sunA, moonA });
  // pointer -> sky links
  if (zo > 0.3) {
    const la = smooth(prog(zo, 0.6, 1));
    ctx.restore();
    const m = cosmosPos(t, sunA, moonA);
    const toScr = (wx, wy) => { const s = lerp(1.04, 0.5, zo); return [W / 2 + (wx - F7.x) * s, lerp(1180, 1490, zo) + (wy - F7.y) * s]; };
    const sTip = toScr(F7.x + Math.cos(sunA) * 330 * 0.74, F7.y - 20 + Math.sin(sunA) * 330 * 0.74), mTip = toScr(F7.x + Math.cos(moonA) * 330 * 0.5, F7.y - 20 + Math.sin(moonA) * 330 * 0.5);
    line(ctx, [sTip, m.sun], { lw: 4, dash: [12, 10], stroke: C.brassDk, seed: 1100, single: true, alpha: la });
    line(ctx, [mTip, m.moon], { lw: 4, dash: [12, 10], stroke: C.inkSoft, seed: 1101, single: true, alpha: la });
    ctx.save();
  }
  ctx.restore();
}
const CZ = { x: 540, y: 960 };
function cosmosPos(t, sunA, moonA) {
  const earth = [CZ.x, CZ.y];
  const sun = [CZ.x + Math.cos(sunA) * 330, CZ.y + Math.sin(sunA) * 330 * 0.55];
  const moon = [CZ.x + Math.cos(moonA) * 150, CZ.y + Math.sin(moonA) * 150 * 0.55];
  return { earth, sun, moon };
}
function cosmos(ctx, t, a) {
  ctx.save(); ctx.globalAlpha *= a;
  stars(ctx, t, 34, 30, 480, 1020, 760, 71, 0.9, C.brassLt);
  // constellation lines (star-chart feel)
  const cons = [[[120, 560], [190, 610], [260, 590], [300, 660]], [[800, 600], [860, 560], [930, 620], [900, 690], [960, 730]]];
  cons.forEach((c, i) => { line(ctx, c, { lw: 2.5, stroke: C.inkLight, seed: 1110 + i, single: true, alpha: 0.7 }); c.forEach(([x, y], j) => star(ctx, x, y, 9, 1, C.brassLt, 1120 + i * 9 + j)); });
  // calendar cycle ring
  draw(ctx, ellAt(CZ.x, CZ.y, 450, 250, 60), { fill: null, stroke: C.brassDk, lw: 5, seed: 1130 });
  for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU + t * 0.05; const x = CZ.x + Math.cos(ang) * 450, y = CZ.y + Math.sin(ang) * 250; dot(ctx, x, y, 7, C.brassDk); }
  draw(ctx, ellAt(CZ.x, CZ.y, 330, 330 * 0.55, 50), { fill: null, stroke: C.gold, lw: 3.5, dash: [12, 10], seed: 1131 });
  draw(ctx, ellAt(CZ.x, CZ.y, 150, 150 * 0.55, 30), { fill: null, stroke: C.inkSoft, lw: 3.5, dash: [10, 9], seed: 1132 });
  const crankA = (t - 47.9) * 2.4, sunA = -Math.PI / 2 + 0.4 + crankA * 0.06, moonA = sunA + 1.2 + crankA * 0.55;
  const m = cosmosPos(t, sunA, moonA);
  earthBody(ctx, m.earth[0], m.earth[1], 40, t);
  sunBody(ctx, m.sun[0], m.sun[1], 52, t);
  moonBody(ctx, m.moon[0], m.moon[1], 30, fr((moonA - sunA) / TAU));
  ctx.restore();
}

// ======================= SCENE 8 — CHANNEL ENDING ==========================
function scene8(ctx, t) {
  paperBg(ctx);
  water(ctx, t, { alpha: 0.42, top: '#a9c6d2', mid: '#7fa3bb', bot: '#5e86a2' });
  const lt = t - 54;
  ctx.save();
  cam(ctx, 540, 1250, 1.0 + 0.03 * clamp(lt / 5), W / 2, 1250);
  // distant wreck silhouette
  wreck(ctx, 790, 1610, 1.05, 0.1, { color: '#58738a', rib: '#6a859b', alpha: 0.45 });
  amphora(ctx, 300, 1640, 70, 1.2, 9, { color: '#8b95a3' });
  // orbits of Sun and Moon
  stars(ctx, t, 26, 40, 470, 1000, 650, 81, 0.85, C.brassLt);
  draw(ctx, ellAt(540, 1060, 470, 190, 60, -0.12), { fill: null, stroke: C.brassDk, lw: 4, dash: [14, 10], seed: 1200 });
  draw(ctx, ellAt(540, 1060, 330, 120, 50, 0.18), { fill: null, stroke: C.inkSoft, lw: 3.5, dash: [10, 9], seed: 1201 });
  // reconstructed bronze gears behind the fragment
  gear(ctx, 360, 1060, 230, lt * 0.18, { fill: C.brass, teeth: 64, depth: 14, seed: 1210, alpha: 0.9 });
  gear(ctx, 700, 930, 145, -lt * 0.18 * 230 / 145, { fill: C.brassLt, teeth: 40, depth: 13, seed: 1211, alpha: 0.9 });
  gear(ctx, 735, 1290, 125, -lt * 0.18 * 230 / 125 + 0.3, { fill: C.gold, teeth: 34, depth: 12, seed: 1212, alpha: 0.9 });
  const sa = -0.12, ang1 = lt * 0.35, ang2 = lt * 0.9 + 2;
  const sp = [540 + Math.cos(ang1) * 470 * Math.cos(sa) - Math.sin(ang1) * 190 * Math.sin(sa), 1060 + Math.cos(ang1) * 470 * Math.sin(sa) + Math.sin(ang1) * 190 * Math.cos(sa)];
  const mp = [540 + Math.cos(ang2) * 330 * Math.cos(0.18) - Math.sin(ang2) * 120 * Math.sin(0.18), 1060 + Math.cos(ang2) * 330 * Math.sin(0.18) + Math.sin(ang2) * 120 * Math.cos(0.18)];
  const behind = p => true; // keep Sun and Moon behind the fragment
  if (behind(sp)) sunBody(ctx, sp[0], sp[1], 44, t);
  if (behind(mp)) moonBody(ctx, mp[0], mp[1], 28, 0.3);
  // seabed
  seabed(ctx, t, 1690, { seed: 6 });
  weed(ctx, t, 70, 1840, 240, 7);
  weed(ctx, t, 1010, 1860, 200, 8, '#4f7d55');
  // the corroded fragment itself, front and centre
  fragment(ctx, 520, 1260 + Math.sin(t * 0.9) * 6, 225, -0.1 + Math.sin(t * 0.5) * 0.015, t, { gearVis: 0.6 });
  if (!behind(sp)) sunBody(ctx, sp[0], sp[1], 44, t);
  if (!behind(mp)) moonBody(ctx, mp[0], mp[1], 28, 0.3);
  bubbles(ctx, t, 520, 1100, 6, 41, 650, 280, 0.8);
  ctx.restore();
  marineSnow(ctx, t, 20, 12, 0.45);
}
