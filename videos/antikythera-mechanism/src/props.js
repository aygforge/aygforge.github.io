'use strict';
// ----------------------------- environment ---------------------------------
function paperBg(ctx) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(PAPER, 0, 0); ctx.restore(); }

function water(ctx, t, o = {}) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, o.top || '#86adc2'); g.addColorStop(0.55, o.mid || C.sea); g.addColorStop(1, o.bot || C.seaDeep);
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = (o.alpha ?? 1) * 0.45; ctx.fillStyle = texPat(ctx); ctx.fillRect(0, 0, W, H);
  // light shafts
  for (let i = 0; i < 6; i++) {
    const x0 = 80 + i * 190 + Math.sin(t * 0.5 + i * 1.7) * 40, w0 = 50 + h1(i) * 70;
    ctx.globalAlpha = (o.alpha ?? 1) * (0.07 + 0.04 * Math.sin(t * 0.8 + i * 2.1));
    ctx.fillStyle = '#fbf6df';
    ctx.beginPath(); ctx.moveTo(x0, -20); ctx.lineTo(x0 + w0, -20); ctx.lineTo(x0 + w0 * 2.6 - 320, H * 0.95); ctx.lineTo(x0 - 360, H * 0.95); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function marineSnow(ctx, t, n = 40, seed = 1, alpha = 0.6) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < n; i++) {
    const x = fr(h1(i + seed) + t * 0.004 * (h1(i * 3) - .5)) * W + Math.sin(t * 0.7 + i) * 12;
    const y = fr(h1(i * 7 + seed) - t * 0.012 * (0.4 + h1(i * 5))) * H;
    dot(ctx, x, y, 1.5 + h1(i * 9) * 2.5, '#eef4ee', alpha * (0.35 + 0.4 * h1(i * 11)));
  }
  ctx.restore();
}
function bubbles(ctx, t, x0, y0, n, seed = 1, rise = 700, spread = 30, size = 1) {
  for (let i = 0; i < n; i++) {
    const sp = 0.35 + h1(i + seed) * 0.35;
    const ph = fr(t * sp + h1(i * 3.3 + seed));
    const y = y0 - ph * rise, x = x0 + Math.sin(t * 3 + i * 2.1) * 8 * ph + (h1(i * 5 + seed) - .5) * spread;
    const r = (5 + h1(i * 7 + seed) * 12) * (0.6 + ph * 0.6) * size;
    const a = ph < 0.1 ? ph / 0.1 : ph > 0.85 ? (1 - ph) / 0.15 : 1;
    bubble(ctx, x, y, r, a, i + seed);
  }
}
function bubble(ctx, x, y, r, a = 1, seed = 1) {
  draw(ctx, circAt(x, y, r, 12), { fill: 'rgba(230,243,245,0.18)', tex: false, stroke: '#eef6f4', lw: 3, alpha: a, seed, single: true, amp: 1.2 });
  line(ctx, arcPts(x, y, r * 0.55, -2.6, -1.6, 4), { stroke: '#ffffff', lw: 2.5, alpha: a, single: true, seed });
}
function seabed(ctx, t, y0, o = {}) {
  const pts = [[-200, H + 400]];
  for (let i = 0; i <= 16; i++) { const x = -200 + i * 95; pts.push([x, y0 + Math.sin(i * 1.3 + (o.seed || 0)) * 26 + vn(i * 0.7, 5 + (o.seed || 0)) * 22]); }
  pts.push([1350, H + 400]);
  draw(ctx, pts, { fill: o.color || C.sand, lw: 5, seed: 11 + (o.seed || 0), shade: [0, 18, 'rgba(255,250,230,0.25)'], alpha: o.alpha });
  const R = rngf(31 + (o.seed || 0));
  for (let i = 0; i < 9; i++) {
    const x = -80 + R() * 1240, y = y0 + 40 + R() * 220, r = 14 + R() * 26;
    draw(ctx, ellAt(x, y, r, r * 0.6, 12), { fill: R() < .5 ? '#a99a80' : '#8f8a7a', lw: 3.5, seed: i + 70, alpha: o.alpha });
  }
}
function weed(ctx, t, x, y, h, seed = 1, color = '#5d8a5a', alpha = 1) {
  for (let b = 0; b < 3; b++) {
    const pts = []; const n = 7;
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x + (b - 1) * 14 + Math.sin(t * 1.6 + seed + i * 0.6 + b) * 16 * u, y - u * h * (0.75 + b * 0.15)]); }
    tube(ctx, pts, 11 - b * 2, color, { seed: seed * 3 + b, lw: 3.5, alpha });
  }
}
function rope(ctx, pts, alpha = 1) { tube(ctx, pts, 7, '#b59a6a', { lw: 3, seed: 21, alpha }); }

// -------------------------------- props ------------------------------------
const AMPH = [[0.13, -1], [0.12, -0.78], [0.36, -0.6], [0.44, -0.38], [0.4, 0.05], [0.26, 0.6], [0.1, 0.92], [0, 1.02], [-0.1, 0.92], [-0.26, 0.6], [-0.4, 0.05], [-0.44, -0.38], [-0.36, -0.6], [-0.12, -0.78], [-0.13, -1]];
function amphora(ctx, x, y, s, rot, seed = 1, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  for (const sx of [1, -1]) tube(ctx, [[0.1 * sx, -0.86], [0.3 * sx, -0.9], [0.36 * sx, -0.66]], 0.07, o.color || C.terra, { seed: seed + sx, lw: 3.5 });
  draw(ctx, AMPH, { fill: o.color || C.terra, seed, lw: 4.5, shade: [0.12, 0, 'rgba(70,30,20,0.25)'] });
  line(ctx, [[-0.4, -0.3], [0.4, -0.3]], { lw: 2, alpha: 0.4, seed: seed + 5, single: true });
  if (o.barn) for (let i = 0; i < 7; i++) dot(ctx, (h1(i + seed) - .5) * 0.6, (h1(i * 3 + seed) - .3) * 1.2, 0.03 + h1(i * 5) * 0.03, C.verd, 0.8);
  ctx.restore();
}
function wreck(ctx, x, y, s, rot, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const hull = [[-300, -40], [-250, -10], [-170, -60], [-90, -20], [-20, -70], [60, -30], [140, -80], [220, -40], [300, -110], [330, -60], [290, 40], [170, 110], [0, 140], [-170, 110], [-290, 50]];
  draw(ctx, hull, { fill: o.color || C.woodDk, lw: 5, seed: 41, shade: [0, -18, 'rgba(20,15,30,0.3)'], alpha: o.alpha });
  for (let i = 0; i < 4; i++) { const yy = -10 + i * 32; line(ctx, [[-280 + i * 10, yy + 10], [-100, yy + 25], [100, yy + 18], [290 - i * 20, yy - 20]], { lw: 2.5, alpha: 0.55 * (o.alpha ?? 1), seed: 42 + i, single: true }); }
  for (let i = 0; i < 6; i++) {
    const bx = -240 + i * 95, top = -150 - h1(i * 3) * 90;
    tube(ctx, [[bx, 60], [bx - 12, -30], [bx + 4, top]], 18, o.rib || C.wood, { seed: 50 + i, lw: 4, alpha: o.alpha });
  }
  ctx.restore();
}
function statueArm(ctx, x, y, s, rot, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  tube(ctx, [[0, 40], [-10, -60], [20, -150], [60, -210]], 46, '#5f7a63', { seed: 61, lw: 4.5 });
  draw(ctx, ellAt(72, -228, 34, 26, 14, -0.7), { fill: '#5f7a63', seed: 62 });
  for (let f = 0; f < 4; f++) tube(ctx, [[80 + f * 6, -240 + f * 8], [110 + f * 10, -268 + f * 12], [130 + f * 8, -280 + f * 16]], 12, '#5f7a63', { seed: 63 + f, lw: 3.5 });
  for (let i = 0; i < 6; i++) dot(ctx, -10 + h1(i) * 60, -160 + h1(i * 7) * 150, 6 + h1(i * 3) * 8, C.verd, 0.75);
  ctx.restore();
}
function marbleHead(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const head = [[-60, -70], [0, -95], [55, -70], [75, -20], [70, 30], [88, 45], [72, 60], [60, 90], [20, 115], [-30, 105], [-65, 60], [-80, 0]];
  draw(ctx, head, { fill: C.marble, seed: 71, shade: [-14, 0, 'rgba(80,70,90,0.18)'] });
  for (let i = 0; i < 9; i++) draw(ctx, circAt(-55 + i * 13, -78 + Math.sin(i) * 8, 14, 8), { fill: C.marbleDk, seed: 72 + i, lw: 2.5 });
  line(ctx, [[30, 10], [55, 8]], { lw: 3, seed: 81 });
  line(ctx, [[52, 75], [68, 72]], { lw: 3, seed: 82 });
  ctx.restore();
}

// Helmet ("standard dress") sponge diver, facing left. reach 0..1
function diver(ctx, x, y, s, t, o = {}) {
  const reach = o.reach ?? 0.5, bob = Math.sin(t * 1.3) * 6;
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(s, s); ctx.rotate(o.rot || 0);
  // air hose
  const hx = 40, hy = -260;
  if (o.hoseEnd) { // run the hose up to a world-space point (e.g. the boat)
    const ex = (o.hoseEnd[0] - x) / s, ey = (o.hoseEnd[1] - y - bob) / s;
    tube(ctx, [[hx, hy], [hx + 40, hy - 100], [lerp(hx, ex, 0.5) + Math.sin(t) * 30, lerp(hy, ey, 0.5)], [ex, ey]], 16, C.rubber, { seed: 91 });
  } else tube(ctx, [[hx, hy], [90, -360], [60 + Math.sin(t) * 20, -520], [120 + Math.sin(t * 0.8) * 30, -760], [80, -1100]], 16, C.rubber, { seed: 91 });
  // back leg
  tube(ctx, [[20, 0], [110, 70], [120, 175]], 52, C.suitDk, { seed: 92 });
  draw(ctx, rr(85, 160, 85, 46, 16), { fill: '#3e3a3c', seed: 93 });
  // front leg (kneeling)
  tube(ctx, [[-10, 10], [-90, 90], [-20, 170]], 56, C.suit, { seed: 94 });
  draw(ctx, rr(-60, 158, 90, 48, 16), { fill: '#3e3a3c', seed: 95 });
  // back arm (holding hose)
  tube(ctx, [[-10, -150], [40, -90], [30, -40]], 40, C.suitDk, { seed: 96 });
  // torso
  const torso = [[-120, -170], [-40, -205], [40, -170], [60, -60], [40, 20], [-40, 30], [-90, -40]];
  draw(ctx, torso, { fill: C.suit, seed: 97, shade: [14, 0, 'rgba(60,45,30,0.22)'] });
  draw(ctx, rr(-60, -20, 115, 30, 10), { fill: '#5a4636', seed: 98 }); // weight belt
  // corselet + helmet
  draw(ctx, ellAt(-55, -175, 95, 42, 22), { fill: C.brass, seed: 99, shade: [0, -8, 'rgba(80,50,10,0.25)'] });
  for (let i = 0; i < 6; i++) dot(ctx, -135 + i * 32, -170 + Math.sin(i) * 6, 5, C.brassDk);
  draw(ctx, circAt(-60, -255, 88, 26), { fill: C.brass, seed: 100, shade: [16, 10, 'rgba(90,60,10,0.3)'] });
  draw(ctx, circAt(-128, -252, 40, 16), { fill: C.brassDk, seed: 101 });
  draw(ctx, circAt(-130, -252, 30, 14), { fill: '#3b5a6e', seed: 102 });
  line(ctx, [[-130, -282], [-130, -222]], { lw: 3.5, seed: 103 }); line(ctx, [[-160, -252], [-100, -252]], { lw: 3.5, seed: 104 });
  line(ctx, arcPts(-130, -252, 20, -2.6, -1.8, 4), { stroke: '#ffffff', lw: 3, seed: 105, single: true, alpha: 0.8 });
  draw(ctx, circAt(-55, -330, 18, 10), { fill: C.brassDk, seed: 106 });
  draw(ctx, circAt(-40, -262, 20, 10), { fill: '#3b5a6e', seed: 107 });
  // reaching arm
  const sh = [-110, -150], el = [lerp(-170, -230, reach), lerp(-90, -110, reach)], hd = [lerp(-200, -330, reach), lerp(-20, -60, reach)];
  tube(ctx, [sh, el, hd], 44, C.suit, { seed: 108 });
  draw(ctx, circAt(hd[0] - 8, hd[1] + 4, 27, 12), { fill: '#6b4b34', seed: 109 });
  tube(ctx, [[hd[0] - 8, hd[1] - 12], [hd[0] - 34, hd[1] - 18]], 14, '#6b4b34', { seed: 110, lw: 3.5 });
  ctx.restore();
  return [x + hd[0] * s, y + bob + hd[1] * s];
}

// Fragment A outline (unit coords)
const FRAG = [[-0.98, -0.42], [-0.78, -0.72], [-0.52, -0.66], [-0.36, -0.9], [0.02, -0.96], [0.22, -0.82], [0.5, -0.88], [0.8, -0.62], [0.9, -0.3], [1.0, -0.08], [0.86, 0.18], [0.94, 0.42], [0.7, 0.72], [0.38, 0.8], [0.22, 0.95], [-0.12, 0.88], [-0.42, 0.92], [-0.66, 0.66], [-0.92, 0.5], [-0.86, 0.18], [-1.02, -0.06]];
const FRAG_B = [[-0.9, -0.5], [-0.3, -0.9], [0.4, -0.75], [0.95, -0.2], [0.7, 0.55], [0.1, 0.9], [-0.6, 0.6], [-1.0, 0.1]];
const FRAG_C = [[-0.8, -0.7], [0.2, -0.95], [0.9, -0.4], [0.75, 0.4], [0.1, 0.85], [-0.7, 0.55], [-0.95, -0.1]];
// o: xray 0..1 (cutaway with working gears), gearVis 0..1 (ghost of the big 4-spoke wheel),
//    tooth 0..1 (tiny gear teeth peeking in a crack), alpha, shape, seed
function fragment(ctx, x, y, s, rot, t, o = {}) {
  const shape = o.shape || FRAG, seed = o.seed || 120;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.shadow !== false) draw(ctx, xf(shape, 0.06, 0.1, 1.02), { fill: 'rgba(30,25,45,0.25)', tex: false, stroke: null, lw: 0, seed: seed + 1 });
  draw(ctx, shape, { fill: o.color || C.bronze, seed, lw: 5, step: 14, amp: 2.4 });
  ctx.save(); ctx.beginPath(); tr(ctx, shape, true, true); ctx.clip();
  const R = rngf(seed);
  const cols = [C.verd, C.verdDk, C.bronzeLt, C.rust, '#57755f', C.verd];
  for (let i = 0; i < 16; i++) {
    const bx = (R() - .5) * 1.9, by = (R() - .5) * 1.8, br = 0.08 + R() * 0.28;
    draw(ctx, ellAt(bx, by, br, br * (0.55 + R() * 0.5), 14, R() * 3), { fill: cols[i % cols.length], stroke: null, lw: 0, seed: seed + 10 + i, alpha: 0.5 + R() * 0.35 });
  }
  if (o.gearVis) { // the great four-spoked wheel visible on the face of fragment A
    gear(ctx, 0.05, -0.02, 0.62, 0.3, { fill: 'rgba(0,0,0,0)', teeth: 60, depth: 0.03, lw: 3.5, stroke: C.verdDk, alpha: o.gearVis * 0.85, seed: seed + 40, noShade: true, single: true, spokeW: 0.2 });
  }
  for (let i = 0; i < 5; i++) {
    const a = R() * TAU, r0 = 0.15 + R() * 0.4, pts = [];
    for (let k = 0; k < 5; k++) pts.push([Math.cos(a + k * 0.15) * (r0 + k * 0.13) + (R() - .5) * 0.06, Math.sin(a + k * 0.15) * (r0 + k * 0.13) + (R() - .5) * 0.06]);
    line(ctx, pts, { lw: 2.2, seed: seed + 60 + i, single: true, alpha: 0.7 });
  }
  if (o.xray > 0) {
    const xr = o.xray, cx = 0.08, cy = -0.02, rad = 0.68 * easeOut(xr);
    const hole = []; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; hole.push([cx + Math.cos(a) * rad * (0.88 + h1(i * 3 + seed) * 0.2), cy + Math.sin(a) * rad * (0.88 + h1(i * 7 + seed) * 0.2)]); }
    draw(ctx, hole, { fill: '#5b4634', sharp: true, lw: 4, seed: seed + 80 });
    ctx.save(); ctx.beginPath(); tr(ctx, hole, true, true); ctx.clip();
    const sp = o.spin ?? t;
    gear(ctx, cx - 0.1, cy + 0.06, 0.4, sp * 0.5, { teeth: 18, depth: 0.07, fill: C.brass, seed: 300, lw: 4.5, spokes: 4 });
    gear(ctx, cx + 0.42, cy - 0.3, 0.24, -sp * 0.5 * 0.4 / 0.24 + 0.2, { teeth: 11, depth: 0.065, fill: C.brassLt, seed: 301, lw: 4 });
    gear(ctx, cx + 0.36, cy + 0.4, 0.2, -sp * 0.5 * 0.4 / 0.2, { teeth: 9, depth: 0.06, fill: C.gold, seed: 302, lw: 4 });
    gear(ctx, cx - 0.5, cy - 0.42, 0.2, sp * 1.0, { teeth: 9, depth: 0.06, fill: C.brassLt, seed: 303, lw: 4 });
    ctx.restore();
  }
  if (o.tooth > 0) { // a crack opens on a buried gear rim
    const tx = 0.48, ty = 0.3, k = o.tooth;
    const crack = [[tx - 0.24, ty - 0.02], [tx - 0.12, ty - 0.07 * k], [tx - 0.02, ty - 0.03 - 0.06 * k], [tx + 0.1, ty - 0.08 * k], [tx + 0.24, ty - 0.03], [tx + 0.14, ty + 0.05 * k], [tx + 0.02, ty + 0.03 + 0.05 * k], [tx - 0.12, ty + 0.06 * k]];
    draw(ctx, crack, { fill: '#4a3a2c', lw: 2.5, seed: seed + 90, sharp: true });
    ctx.save(); ctx.beginPath(); tr(ctx, crack, true, true); ctx.clip();
    gear(ctx, tx, ty + 0.42, 0.44, 0.05, { teeth: 34, depth: 0.05, fill: C.brassLt, seed: seed + 91, lw: 2.5, spokes: 0, noShade: true });
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

// Greek fishing caique with crew hauling a rope
function caique(ctx, x, y, s, t) {
  const bob = Math.sin(t * 1.4) * 5, roll = Math.sin(t * 1.1) * 0.03;
  ctx.save(); ctx.translate(x, y + bob); ctx.rotate(roll); ctx.scale(s, s);
  line(ctx, [[0, -10], [-6, -260]], { lw: 6, seed: 131 });
  draw(ctx, [[-4, -250], [-150, -40], [-10, -40]], { fill: '#efe3c8', seed: 132 });
  draw(ctx, [[-230, -60], [230, -70], [260, -110], [200, 20], [-190, 25], [-260, -100]], { fill: '#efe6d2', seed: 133 });
  draw(ctx, [[-215, -40], [235, -48], [215, -10], [-200, -6]], { fill: '#4f7fa6', seed: 134, lw: 3 });
  for (const [px, c] of [[90, '#b5523b'], [160, '#4f6b8c']]) {
    tube(ctx, [[px, -70], [px - 8, -140]], 34, c, { seed: px });
    draw(ctx, circAt(px - 10, -170, 20, 12), { fill: '#c99a74', seed: px + 1 });
    tube(ctx, [[px - 6, -130], [px - 40, -110], [px - 60, -90]], 14, c, { seed: px + 2 });
  }
  ctx.restore();
  return [x - 60 * s, y + bob - 90 * s];
}

// ------------------------------ astronomy ----------------------------------
function sunBody(ctx, x, y, r, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.15);
  const n = 12, rays = [];
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr2 = i % 2 ? r * 1.0 : r * (1.45 + 0.08 * Math.sin(t * 3 + i)); rays.push([Math.cos(a) * rr2, Math.sin(a) * rr2]); }
  draw(ctx, rays, { fill: C.sunLt, seed: 141, sharp: true, lw: o.lw ?? 3.5, alpha: o.alpha });
  draw(ctx, circ(r * 0.92, 20), { fill: C.sun, seed: 142, lw: o.lw ?? 4, alpha: o.alpha, shade: [r * 0.12, r * 0.12, 'rgba(160,90,10,0.22)'] });
  ctx.restore();
}
function moonBody(ctx, x, y, r, phase = 0.5, o = {}) {
  ctx.save(); ctx.translate(x, y); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  draw(ctx, circ(r, 16), { fill: C.moonDk, seed: 151, lw: o.lw ?? 3.5 });
  const ph = fr(phase), k = Math.cos(ph * TAU);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - 1, 0, TAU); ctx.clip();
  ctx.fillStyle = C.moon;
  ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, ph >= 0.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, Math.abs(k) * r + 0.1, r, 0, 0, TAU);
  ctx.fillStyle = (ph < 0.25 || ph > 0.75) ? C.moonDk : C.moon; ctx.fill();
  ctx.fillStyle = texPat(ctx); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  if (r > 25) for (let i = 0; i < 4; i++) dot(ctx, (h1(i) - .5) * r, (h1(i * 3) - .5) * r, r * 0.12, 'rgba(120,115,100,0.35)');
  ctx.restore();
  draw(ctx, circ(r, 16), { fill: null, seed: 152, lw: o.lw ?? 3.5 });
  ctx.restore();
}
function earthBody(ctx, x, y, r, t) {
  draw(ctx, circAt(x, y, r, 16), { fill: C.earth, seed: 161 });
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 2, 0, TAU); ctx.clip();
  const off = (t * 8) % (r * 4);
  for (let i = -1; i < 3; i++) draw(ctx, ellAt(x - r * 2 + off + i * r * 2, y - r * 0.2 + i * 3, r * 0.45, r * 0.32, 10, 0.4), { fill: C.land, seed: 162 + i, lw: 2.5 });
  ctx.restore();
}
function stars(ctx, t, n, x0, y0, w, h, seed = 1, alpha = 1, color = '#f6eccb') {
  for (let i = 0; i < n; i++) {
    const x = x0 + h1(i + seed) * w, y = y0 + h1(i * 7 + seed) * h, s = 3 + h1(i * 3 + seed) * 6;
    const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + h1(i)) + i);
    star(ctx, x, y, s * (0.8 + 0.25 * tw), alpha * tw, color, i + seed);
  }
}
function star(ctx, x, y, s, a, color = '#f6eccb', seed = 1) {
  draw(ctx, [[x, y - s], [x + s * 0.28, y - s * 0.28], [x + s, y], [x + s * 0.28, y + s * 0.28], [x, y + s], [x - s * 0.28, y + s * 0.28], [x - s, y], [x - s * 0.28, y - s * 0.28]], { fill: color, sharp: true, lw: 1.8, alpha: a, seed, tex: false, single: true, amp: 0.8 });
}
function eclipseGlyph(ctx, x, y, r, a = 1, seed = 1, cover = 0.7) {
  ctx.save(); ctx.globalAlpha *= a;
  draw(ctx, circAt(x, y, r, 12), { fill: C.sun, seed, lw: 3 });
  draw(ctx, circAt(x + r * (1 - cover) * 1.6, y - r * (1 - cover) * 0.4, r * 0.95, 12), { fill: C.moonDk, seed: seed + 1, lw: 3 });
  ctx.restore();
}

// Front dial of the mechanism. o: sunA, moonA, cal, zod, sunVis, moonVis, earthVis, ringRot, alpha
function frontDial(ctx, x, y, R, t, o = {}) {
  ctx.save(); ctx.translate(x, y); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  draw(ctx, circ(R * 1.04, 56), { fill: C.brassDk, seed: 171, lw: 5 });
  draw(ctx, circ(R, 56), { fill: C.brass, seed: 172, lw: 4, shade: [R * 0.03, R * 0.03, 'rgba(90,60,10,0.25)'] });
  // calendar ring (365-day Egyptian calendar ring)
  const cal = o.cal ?? 1, rot = o.ringRot || 0;
  if (cal > 0) {
    ctx.save(); ctx.globalAlpha *= cal; ctx.rotate(rot);
    draw(ctx, circ(R * 0.96, 56), { fill: C.parchLt, seed: 173, lw: 3.5 });
    draw(ctx, circ(R * 0.83, 50), { fill: null, seed: 174, lw: 3 });
    const nT = 73, shown = Math.floor(nT * clamp(o.calDraw ?? 1));
    for (let i = 0; i < shown; i++) { const a = i / nT * TAU, l = i % 6 === 0 ? 0.1 : 0.05; line(ctx, [[Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95], [Math.cos(a) * R * (0.95 - l), Math.sin(a) * R * (0.95 - l)]], { lw: i % 6 ? 1.6 : 3, seed: 175 + i, single: true }); }
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; if (i / 12 < (o.calDraw ?? 1)) dot(ctx, Math.cos(a) * R * 0.875, Math.sin(a) * R * 0.875, 4, C.brassDk); }
    ctx.restore();
  }
  // zodiac ring
  const zod = o.zod ?? 1;
  if (zod > 0) {
    ctx.save(); ctx.globalAlpha *= zod;
    draw(ctx, circ(R * 0.82, 50), { fill: '#d8b866', seed: 176, lw: 3 });
    draw(ctx, circ(R * 0.68, 44), { fill: C.night, seed: 177, lw: 3.5 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(ctx, [[Math.cos(a) * R * 0.68, Math.sin(a) * R * 0.68], [Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82]], { lw: 2.5, seed: 180 + i, single: true }); }
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; for (let k = 0; k < 3; k++) dot(ctx, Math.cos(a + (k - 1) * 0.07) * R * (0.75 + (k % 2) * 0.03), Math.sin(a + (k - 1) * 0.07) * R * (0.75 + (k % 2) * 0.03), 3.2, C.ink, 0.8); }
    stars(ctx, t, 26, -R * 0.5, -R * 0.5, R, R, 9, 0.85);
    ctx.restore();
  } else {
    draw(ctx, circ(R * 0.68, 44), { fill: C.night, seed: 177, lw: 3.5, alpha: 0.0001 + (o.nightA ?? 0) });
  }
  // pointers
  if ((o.moonVis ?? 1) > 0) {
    const a = o.moonA ?? 0, mv = o.moonVis ?? 1;
    if (o.orbit) draw(ctx, circ(R * 0.5, 40), { fill: null, seed: 185, lw: 3, dash: [10, 12], stroke: C.moon, alpha: o.orbit });
    ctx.save(); ctx.globalAlpha *= mv;
    line(ctx, [[0, 0], [Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5]], { lw: 7, stroke: C.ink, seed: 186 });
    line(ctx, [[0, 0], [Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5]], { lw: 3, stroke: '#cfd3d6', seed: 187, single: true });
    moonBody(ctx, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, R * 0.085, fr((a - (o.sunA ?? 0)) / TAU));
    ctx.restore();
  }
  if ((o.sunVis ?? 1) > 0) {
    const a = o.sunA ?? 0, sv = o.sunVis ?? 1;
    ctx.save(); ctx.globalAlpha *= sv;
    line(ctx, [[0, 0], [Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74]], { lw: 8, stroke: C.ink, seed: 188 });
    line(ctx, [[0, 0], [Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74]], { lw: 3.5, stroke: C.gold, seed: 189, single: true });
    sunBody(ctx, Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74, R * 0.07, t, { lw: 2.5 });
    ctx.restore();
  }
  if ((o.earthVis ?? 1) > 0) { ctx.save(); ctx.globalAlpha *= o.earthVis ?? 1; earthBody(ctx, 0, 0, R * 0.09, t); ctx.restore(); }
  ctx.restore();
}
// Saros-style spiral dial with eclipse glyphs
function spiralDial(ctx, x, y, R, t, o = {}) {
  ctx.save(); ctx.translate(x, y); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  draw(ctx, circ(R * 1.08, 44), { fill: C.brass, seed: 191, lw: 4.5, shade: [R * 0.03, R * 0.03, 'rgba(90,60,10,0.25)'] });
  const turns = 4, r0 = R * 0.22, pts = [], N = 200, d = clamp(o.draw ?? 1);
  for (let i = 0; i <= N * d; i++) { const u = i / N, a = u * turns * TAU - Math.PI / 2; const r = lerp(r0, R * 0.98, u); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  if (pts.length > 2) line(ctx, pts, { lw: 3.5, seed: 192 });
  const cells = 30;
  for (let i = 0; i < cells; i++) {
    const u = (i + 0.5) / cells, a = u * turns * TAU - Math.PI / 2 + 0.6, r = lerp(r0, R * 0.98, u) - R * 0.09;
    if (h1(i * 13) < 0.55) { const ap = clamp(((o.glyphs ?? 1) * cells - i) / 2); if (ap > 0) eclipseGlyph(ctx, Math.cos(a) * r, Math.sin(a) * r, R * 0.045 * backOut(ap), ap, 200 + i, h1(i) > .5 ? 0.9 : 0.6); }
  }
  const pa = (o.ptr ?? 0), pr = R * 0.98;
  line(ctx, [[0, 0], [Math.cos(pa) * pr, Math.sin(pa) * pr]], { lw: 6, seed: 196, alpha: o.ptrA ?? 1 });
  draw(ctx, circ(R * 0.07, 10), { fill: C.brassDk, seed: 197, lw: 3 });
  ctx.restore();
}

// --------------------------- scholarly / interiors -------------------------
function woodCase(ctx, x, y, w, h, o = {}) {
  ctx.save(); ctx.translate(x, y); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  draw(ctx, xf(rr(-w / 2, -h / 2, w, h, 18), 14, 18), { fill: 'rgba(30,25,45,0.25)', stroke: null, lw: 0, tex: false, seed: 210 });
  draw(ctx, rr(-w / 2, -h / 2, w, h, 18), { fill: C.wood, seed: 211, lw: 5, shade: [-10, -10, 'rgba(255,230,180,0.15)'] });
  for (let i = 0; i < 7; i++) line(ctx, [[-w / 2 + 12, -h / 2 + 30 + i * h / 7], [-w / 6, -h / 2 + 34 + i * h / 7 + Math.sin(i) * 6], [w / 2 - 12, -h / 2 + 28 + i * h / 7]], { lw: 2, stroke: C.woodDk, alpha: 0.6, seed: 212 + i, single: true });
  draw(ctx, rr(-w / 2 + 36, -h / 2 + 36, w - 72, h - 72, 10), { fill: C.brassDk, seed: 220, lw: 4 });
  ctx.restore();
}
function crank(ctx, x, y, s, a, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  draw(ctx, circ(26, 12), { fill: C.brassDk, seed: 231 });
  const ex = Math.cos(a) * 60, ey = Math.sin(a) * 60;
  tube(ctx, [[0, 0], [ex, ey]], 14, C.brass, { seed: 232 });
  draw(ctx, circAt(ex, ey, 18, 10), { fill: C.woodLt, seed: 233 });
  ctx.restore();
}
function hourglass(ctx, x, y, s, t, period = 2.2) {
  const ph = fr(t / period), flip = Math.floor(t / period);
  const rot = ph > 0.85 ? ease((ph - 0.85) / 0.15) * Math.PI : 0;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  draw(ctx, rr(-70, -120, 140, 22, 8), { fill: C.woodLt, seed: 241 });
  draw(ctx, rr(-70, 98, 140, 22, 8), { fill: C.woodLt, seed: 242 });
  const glass = [[-55, -98], [55, -98], [12, 0], [55, 98], [-55, 98], [-12, 0]];
  draw(ctx, glass, { fill: 'rgba(225,238,240,0.5)', tex: false, seed: 243, lw: 3.5 });
  const sand = ph > 0.85 ? 1 : ph / 0.85;
  const topH = 80 * (1 - sand), botH = 80 * sand;
  if (topH > 2) draw(ctx, [[-12 - 43 * topH / 98, -topH], [12 + 43 * topH / 98, -topH], [6, -4], [-6, -4]], { fill: C.sand, seed: 244, lw: 2.5, sharp: true });
  if (botH > 2) draw(ctx, [[-50, 96], [50, 96], [0, 96 - botH]], { fill: C.sand, seed: 245, lw: 2.5 });
  if (ph < 0.85) line(ctx, [[0, -2], [0, 92]], { stroke: C.sandDk, lw: 3, seed: 246, single: true });
  ctx.restore();
}
