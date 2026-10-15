// Characters & props, all drawn facing RIGHT in local coords, origin at ground contact.
const E = require('./engine');
const { C, shape, line, limb, ellipsePts, rectPts, circle, hash, lerp, clamp, ik, strokes, mix, noise1 } = E;
const TAU = Math.PI * 2;

// ================= EMU =================
// o: {x,y,s,face,phase,run(0..1),peck(0..1),look(-1..1 head turn), seed, t, blink, alpha, sil(silhouette color)}
function emu(ctx, o) {
  const s = o.s ?? 1, face = o.face ?? 1, run = o.run ?? 0, ph = o.phase ?? 0, seed = o.seed ?? 1, t = o.t ?? 0;
  const peck = o.peck ?? 0;
  const sil = o.sil; // silhouette mode
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * face, s);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const bob = run > 0 ? -Math.abs(Math.sin(ph * TAU)) * 10 * run : Math.sin(t * 2 + seed) * 1.5;
  const bodyTilt = run * -0.08 + peck * 0.18;
  const hip = [8, -198 + bob];
  // ---- legs ----
  const legs = [];
  for (let k = 0; k < 2; k++) {
    const p = (ph + k * 0.5) % 1;
    let fx, fy;
    if (run > 0) {
      const stride = 70;
      if (p < 0.5) { fx = lerp(stride, -stride, p / 0.5); fy = 0; }
      else { const q = (p - 0.5) / 0.5; fx = lerp(-stride, stride, q); fy = -Math.sin(q * Math.PI) * 70; }
      fx = lerp(k ? -8 : 10, fx, run); fy = fy * run;
    } else { fx = k ? -14 : 16; fy = 0; }
    const foot = [fx, fy];
    const ankle = ik(hip, foot, 100, 104, 1);
    legs.push({ foot, ankle, k, p });
  }
  const legCol = sil || C.emuLeg;
  const drawLeg = (L, back) => {
    const w = 11;
    ctx.save(); if (back && !sil) ctx.globalAlpha *= 0.9;
    const col = back && !sil ? mix(legCol, C.ink, 0.25) : legCol;
    limb(ctx, [hip, L.ankle, L.foot], w, col, { seed: seed * 7 + L.k, olw: 6, smooth: false });
    // toes
    const lift = L.foot[1] < -4;
    const tx = L.foot[0], ty = L.foot[1];
    const toes = lift ? [[tx + 16, ty + 14], [tx + 22, ty + 6], [tx + 10, ty + 16]] : [[tx + 26, ty + 1], [tx + 20, ty - 3], [tx + 14, ty + 2]];
    ctx.lineCap = 'round'; ctx.strokeStyle = sil || C.ink; ctx.lineWidth = 6;
    ctx.beginPath(); for (const q of toes) { ctx.moveTo(tx, ty); ctx.lineTo(q[0], q[1]); } ctx.moveTo(tx, ty); ctx.lineTo(tx - 9, ty + 1); ctx.stroke();
    ctx.restore();
  };
  // back leg first, then front leg (both tucked under the body)
  const order = legs.slice().sort((a, b) => (a.k === 1 ? -1 : 1));
  drawLeg(order[0], true);
  drawLeg(order[1], false);
  // feathered thighs ("drumsticks") at top of legs
  if (!sil) {
    shape(ctx, ellipsePts(hip[0] - 4, hip[1] - 14, 26, 30, 12, 0.3), { fill: C.emuDark, seed: seed * 3 + 9, lw: 3, stroke: mix(C.ink, C.emuDark, 0.3) });
  }
  // ---- neck & head ----
  const neckBase = [82, -268 + bob];
  const pump = run > 0 ? Math.sin(ph * TAU * 2) * 8 * run : 0;
  const idleBob = run > 0 ? 0 : Math.sin(t * 1.7 + seed * 2) * 4;
  let head = [lerp(lerp(102, 172, run), 172, peck) + pump, lerp(lerp(-414, -378, run), -40, peck) + idleBob + bob * 0.5];
  const ctrl = [lerp(lerp(94, 142, run), 176, peck), lerp(lerp(-340, -322, run), -230, peck) + bob];
  // tapered neck polygon
  const NS = 10, L = [], R = [];
  for (let i = 0; i <= NS; i++) {
    const u = i / NS;
    const x = (1 - u) * (1 - u) * neckBase[0] + 2 * (1 - u) * u * ctrl[0] + u * u * head[0];
    const y = (1 - u) * (1 - u) * neckBase[1] + 2 * (1 - u) * u * ctrl[1] + u * u * head[1];
    const dx = 2 * (1 - u) * (ctrl[0] - neckBase[0]) + 2 * u * (head[0] - ctrl[0]);
    const dy = 2 * (1 - u) * (ctrl[1] - neckBase[1]) + 2 * u * (head[1] - ctrl[1]);
    const dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl;
    const w = lerp(30, 12, u);
    L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]);
  }
  const neck = L.concat(R.reverse());
  shape(ctx, neck, { fill: sil || C.emuDark, seed: seed * 5 + 2, lw: 4.5, hatch: sil ? null : { color: C.emuNeck, angle: 0.4, gap: 7, alpha: 0.7, clip: c => { c.beginPath(); c.rect(-50, head[1] - 30, 300, (neckBase[1] - head[1]) * 0.55 + 30); } } });
  // ---- body ----
  ctx.save(); ctx.translate(0, -238 + bob); ctx.rotate(bodyTilt);
  const body = [];
  const N = 30;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU; // 0 = front
    let rx = 108, ry = 60;
    let x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    if (Math.cos(a) < 0) { x *= 1.08; } // rear larger
    if (Math.sin(a) > 0 && Math.cos(a) < 0.3) y += 22 * Math.sin(a) * (0.6 - 0.4 * Math.cos(a)); // shaggy droop
    if (Math.sin(a) < 0 && Math.cos(a) > 0) { y -= 10 * Math.sin(a) * Math.cos(a) * -1; }
    // feather tips on lower + rear edge
    const isEdge = (Math.sin(a) > -0.2 && Math.cos(a) < 0.55);
    if (isEdge && i % 2 === 0) {
      const sway = Math.sin(t * 6 + i * 1.7 + seed) * (3 + run * 6);
      x += Math.cos(a) * 12 + sway; y += Math.sin(a) * 16;
    }
    body.push([x, y]);
  }
  shape(ctx, body, { fill: sil || C.emu, seed: seed * 13 + 1, lw: 5, smooth: true, hatch: sil ? null : { color: C.emuDark, angle: 1.1, gap: 8, alpha: 0.55, clip: c => { c.beginPath(); c.rect(-140, -10, 290, 120); } }, stroke: sil ? sil : undefined });
  if (!sil) {
    // feather texture strokes
    const fs = [];
    for (let i = 0; i < 16; i++) {
      const px = -90 + (i % 8) * 24 + hash(seed, i) * 10, py = -30 + Math.floor(i / 8) * 34 + hash(seed, i, 2) * 10;
      const sw = Math.sin(t * 5 + i) * 2 * (1 + run);
      fs.push([px, py, px - 8 + sw, py + 14, px - 4 + sw, py + 26]);
    }
    strokes(ctx, fs, C.emuDark, 2.6, 0.75);
  }
  ctx.restore();
  // head
  const ha = Math.atan2(head[1] - ctrl[1], head[0] - ctrl[0]) + Math.PI / 2;
  ctx.save(); ctx.translate(head[0], head[1]);
  const headRot = peck > 0.5 ? 0.9 : (run > 0 ? 0.15 : 0) + (o.headRot ?? 0);
  ctx.rotate(headRot);
  const look = o.look ?? 1; // 1 = forward; -1 = looking back
  ctx.scale(look >= 0 ? 1 : -1, 1);
  shape(ctx, [[30, -6], [44, 2], [30, 6]], { fill: sil || C.beak, seed: seed + 41, lw: 3.5, smooth: false });
  shape(ctx, ellipsePts(6, -2, 22, 15, 12, -0.15), { fill: sil || C.emuDark, seed: seed + 43, lw: 4 });
  if (!sil) {
    // bluish face skin
    shape(ctx, ellipsePts(12, -3, 9, 7, 10), { fill: '#7F93AE', stroke: null, seed: seed + 45, alpha: 0.75 });
    const blink = o.blink ? 0.15 : 1;
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(12, -4, 3.6, 3.6 * blink, 0, 0, TAU); ctx.fill();
    if (blink > 0.5) { ctx.fillStyle = '#fff8e6'; ctx.beginPath(); ctx.arc(13.1, -5.2, 1.2, 0, TAU); ctx.fill(); }
    // shaggy crown
    strokes(ctx, [[-8, -16, -14, -24, -20, -20], [0, -18, -4, -27, -10, -26]], C.emuDark, 3, 0.9);
  }
  ctx.restore();
  ctx.restore();
}

// ================= SOLDIER / FARMER =================
// o: {x,y,s,face, pose:'stand'|'walk'|'kneel'|'run', phase, look(±1), hands:{l:[x,y],r:[x,y]}, outfit:'soldier'|'farmer', brow, seed, t, binoc, carry}
function person(ctx, o) {
  const s = o.s ?? 1, face = o.face ?? 1, seed = o.seed ?? 3, t = o.t ?? 0, ph = o.phase ?? 0;
  const farmer = o.outfit === 'farmer';
  const top = farmer ? C.farmerShirt : C.khaki, topDark = farmer ? mix(C.farmerShirt, C.ink, 0.3) : C.khakiDark;
  const pants = farmer ? C.farmerPants : C.khaki;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * face, s);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const pose = o.pose || 'stand';
  const breathe = Math.sin(t * 2.2 + seed) * 1.5;
  let hip = [0, -150], shoulder, footL, footR, kneeBendL = -1, kneeBendR = -1;
  let bob = 0;
  if (pose === 'walk' || pose === 'run') {
    const amp = pose === 'run' ? 40 : 26;
    bob = -Math.abs(Math.sin(ph * TAU)) * (pose === 'run' ? 8 : 4);
    footL = [Math.sin(ph * TAU) * amp, -Math.max(0, Math.cos(ph * TAU)) * 14];
    footR = [-Math.sin(ph * TAU) * amp, -Math.max(0, -Math.cos(ph * TAU)) * 14];
  } else if (pose === 'kneel') {
    hip = [0, -92]; footL = [40, 0]; footR = [-58, 0];
  } else if (pose === 'crouch') {
    hip = [-6, -112]; footL = [26, 0]; footR = [-24, 0];
  } else { footL = [14, 0]; footR = [-14, 0]; }
  hip = [hip[0], hip[1] + bob + (pose === 'stand' ? 0 : 0)];
  const lean = o.lean ?? (pose === 'run' ? 0.25 : pose === 'kneel' ? 0.12 : 0);
  shoulder = [hip[0] + Math.sin(lean) * 108, hip[1] - Math.cos(lean) * 108 + breathe * 0.3];
  const neck = [shoulder[0] + Math.sin(lean) * 10, shoulder[1] - 12];
  // legs
  const legDraw = (foot, back) => {
    let knee;
    if (pose === 'kneel' && back) knee = [-30, -6];
    else if (pose === 'kneel') knee = [44, -72];
    else knee = ik([hip[0] + (back ? -6 : 6), hip[1]], foot, 76, 76, -1);
    const col = back ? mix(pants, C.ink, 0.18) : pants;
    const hp = [hip[0] + (back ? -6 : 6), hip[1]];
    if (pose === 'kneel' && back) { limb(ctx, [hp, knee, [foot[0], foot[1] - 6]], 24, col, { seed: seed + (back ? 1 : 2), smooth: false }); }
    else limb(ctx, [hp, knee, foot], 24, col, { seed: seed + (back ? 1 : 2), smooth: false });
    if (!farmer && !(pose === 'kneel' && back)) { // puttees
      const a = knee, b = foot; const ls = [];
      for (let i = 1; i < 5; i++) { const u = 0.35 + i * 0.13; const x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); ls.push([x - 11, y + 3, x + 11, y - 3]); }
      strokes(ctx, ls, C.khakiDark, 2.2, 0.8);
    }
    // boot
    const bx = foot[0], by = foot[1];
    if (pose === 'kneel' && back) shape(ctx, [[bx - 6, by - 14], [bx - 34, by - 12], [bx - 34, by + 1], [bx - 4, by]], { fill: C.boot, seed: seed + 9, lw: 3.5 });
    else shape(ctx, [[bx - 12, by - 14], [bx + 14, by - 12], [bx + 28, by - 4], [bx + 28, by + 2], [bx - 12, by + 2]], { fill: C.boot, seed: seed + (back ? 7 : 8), lw: 3.5 });
  };
  legDraw(footR, true);
  legDraw(footL, false);
  // arms helper
  const hands = o.hands || {};
  const defL = pose === 'walk' || pose === 'run' ? [shoulder[0] - Math.sin(ph * TAU) * 34, shoulder[1] + 92] : [shoulder[0] + 16, shoulder[1] + 110];
  const defR = pose === 'walk' || pose === 'run' ? [shoulder[0] + Math.sin(ph * TAU) * 34, shoulder[1] + 92] : [shoulder[0] - 14, shoulder[1] + 110];
  const hL = hands.l ? hands.l : defL, hR = hands.r ? hands.r : defR;
  const arm = (h, back) => {
    const sh = [shoulder[0] + (back ? -10 : 8), shoulder[1] + 10];
    const el = ik(sh, h, 58, 58, back ? 1 : 1);
    limb(ctx, [sh, el, h], 20, back ? mix(top, C.ink, 0.15) : top, { seed: seed + (back ? 21 : 22), smooth: false });
    circle(ctx, h[0], h[1], 9, { fill: C.skin, seed: seed + (back ? 31 : 32), lw: 3.5 });
  };
  arm(hR, true);
  // torso
  const tw = 34;
  const torso = [
    [hip[0] - tw, hip[1] + 6], [hip[0] + tw, hip[1] + 6],
    [shoulder[0] + tw + 2, shoulder[1] + 12], [shoulder[0] + 18, shoulder[1] - 4], [shoulder[0] - 22, shoulder[1] - 4], [shoulder[0] - tw - 2, shoulder[1] + 12]];
  shape(ctx, torso, { fill: top, seed: seed + 41, lw: 4.5, hatch: { color: topDark, angle: -1.0, gap: 9, alpha: 0.45, clip: c => { c.beginPath(); c.rect(hip[0] - 60, shoulder[1] + 50, 30, 120); } } });
  // belt + pockets
  if (!farmer) {
    shape(ctx, [[hip[0] - tw - 1, hip[1] - 14], [hip[0] + tw + 1, hip[1] - 14], [hip[0] + tw + 1, hip[1] - 2], [hip[0] - tw - 1, hip[1] - 2]], { fill: C.khakiDark, seed: seed + 43, lw: 3, smooth: false });
    const mx = lerp(hip[0], shoulder[0], 0.62), my = lerp(hip[1], shoulder[1], 0.62);
    line(ctx, [[mx + 4, my], [mx + 24, my - 1], [mx + 24, my + 16], [mx + 4, my + 17]], { lw: 2.5, seed: seed + 44, smooth: false });
  } else {
    // overall straps
    line(ctx, [[shoulder[0] + 12, shoulder[1]], [hip[0] + 14, hip[1] - 20]], { lw: 3, seed: seed + 45, smooth: false });
  }
  // head
  const lk = o.look ?? 1;
  const hx = neck[0] + 4 * lk, hy = neck[1] - 30;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate((o.headTilt ?? 0) + breathe * 0.004); ctx.scale(lk, 1);
  shape(ctx, [[-8, 22], [8, 22], [8, 38], [-8, 38]], { fill: C.skin, seed: seed + 50, lw: 3.5, smooth: false });
  shape(ctx, ellipsePts(0, 0, 25, 30, 14, 0, 0.06, seed), { fill: C.skin, seed: seed + 51, lw: 4.2 });
  circle(ctx, -18, 4, 7, { fill: C.skin, seed: seed + 52, lw: 3 });
  // face (right side)
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(12, -2, 3.6, 0, TAU); ctx.fill();
  line(ctx, [[22, 2], [27, 12], [21, 13]], { lw: 3, seed: seed + 53, smooth: false, double: false });
  const brow = o.brow ?? 0; // 0 neutral, 1 raised
  line(ctx, [[6, -12 - brow * 5], [18, -13 - brow * 7]], { lw: 3.2, seed: seed + 54, double: false });
  if (o.mouth === 'o') { ctx.beginPath(); ctx.ellipse(16, 20, 3, 4, 0, 0, TAU); ctx.fill(); }
  else line(ctx, [[12, 21], [20, 20]], { lw: 3, seed: seed + 55, double: false });
  // hat
  if (farmer) {
    shape(ctx, [[-42, -14], [44, -14], [36, -6], [-36, -6]], { fill: '#C9A86A', seed: seed + 60, lw: 4 });
    shape(ctx, [[-24, -14], [-20, -42], [20, -42], [24, -14]], { fill: '#C9A86A', seed: seed + 61, lw: 4, hatch: { color: '#9C7C45', gap: 8, alpha: 0.5 } });
    line(ctx, [[-23, -20], [23, -20]], { lw: 5, stroke: '#7A4E35', seed: seed + 62 });
  } else {
    // slouch hat: brim with left side turned up
    shape(ctx, [[-30, -14], [-38, -40], [-30, -44], [-20, -22], [48, -18], [50, -10], [-26, -6]], { fill: C.hat, seed: seed + 60, lw: 4 });
    shape(ctx, [[-22, -16], [-18, -44], [-2, -50], [20, -44], [24, -16]], { fill: C.hat, seed: seed + 61, lw: 4, hatch: { color: C.hatBand, gap: 8, alpha: 0.45 } });
    shape(ctx, [[-22, -24], [24, -24], [24, -15], [-22, -15]], { fill: C.hatBand, seed: seed + 62, lw: 3, smooth: false });
    circle(ctx, -32, -34, 4, { fill: '#D9C38A', seed: seed + 63, lw: 2 });
  }
  ctx.restore();
  // front arm
  arm(hL, false);
  if (o.binoc) { // binoculars at hand
    shape(ctx, rectPts(hL[0] - 6, hL[1] - 14, 26, 18), { fill: C.gunDark, seed: seed + 70, lw: 3 });
  }
  if (o.carry === 'crate') {
    shape(ctx, rectPts(hL[0] - 34, hL[1] - 30, 70, 46), { fill: C.olive, seed: seed + 71, lw: 4, hatch: { color: C.oliveDark, gap: 10, alpha: 0.5 } });
  }
  ctx.restore();
  return { shoulder, hip };
}

// ================= LEWIS GUN =================
// o: {x,y,s,face,aim(rad),firing(bool),t,seed, mount:'tripod'|'bipod'|'none', recoil, flashSeed, sil}
function lewis(ctx, o) {
  const s = o.s ?? 1, face = o.face ?? 1, seed = o.seed ?? 9, t = o.t ?? 0;
  const sil = o.sil;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * face, s);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const mount = o.mount || 'tripod';
  const pivot = mount === 'tripod' ? [0, -120] : mount === 'bipod' ? [60, -40] : [0, 0];
  if (mount === 'tripod') {
    const legs = [[[0, -120], [-70, 0]], [[0, -120], [64, 0]], [[0, -120], [8, 12]]];
    for (const [i, L] of legs.entries()) limb(ctx, L, 9, sil || C.gunDark, { seed: seed + i, olw: 5 });
    shape(ctx, rectPts(-14, -136, 28, 22), { fill: sil || C.gunDark, seed: seed + 5, lw: 3.5 });
  }
  ctx.save(); ctx.translate(pivot[0], pivot[1]);
  ctx.rotate(-(o.aim ?? 0));
  const rec = o.firing ? (hash(seed, Math.floor(t * 30)) - 0.5) * 6 : 0;
  ctx.translate(rec, rec * 0.4);
  if (mount === 'bipod') { // bipod legs near muzzle end
    limb(ctx, [[150, 6], [128, 40]], 6, sil || C.gunDark, { seed: seed + 6, olw: 4 });
    limb(ctx, [[150, 6], [168, 40]], 6, sil || C.gunDark, { seed: seed + 7, olw: 4 });
  }
  // butt stock
  shape(ctx, [[-60, -8], [-160, 4], [-168, 30], [-150, 34], [-60, 14]], { fill: sil || C.gunWood, seed: seed + 10, lw: 4.5, hatch: sil ? null : { color: '#6A4026', gap: 8, alpha: 0.5, angle: 0.2 } });
  // pistol grip + trigger guard
  shape(ctx, [[-56, 10], [-74, 52], [-58, 56], [-40, 14]], { fill: sil || C.gunWood, seed: seed + 11, lw: 4 });
  line(ctx, [[-36, 12], [-30, 32], [-48, 34]], { lw: 3.5, seed: seed + 12, stroke: sil, smooth: true });
  // receiver
  shape(ctx, rectPts(-64, -18, 90, 34, 3), { fill: sil || C.gunDark, seed: seed + 13, lw: 4.5 });
  // cooling shroud (fat cylinder) + fins
  const shroud = [[20, -24], [196, -20], [206, -12], [206, 12], [196, 18], [20, 22]];
  shape(ctx, shroud, { fill: sil || C.gun, seed: seed + 14, lw: 5, smooth: false, hatch: sil ? null : { color: C.gunDark, angle: 0, gap: 7, alpha: 0.6, clip: c => { c.beginPath(); c.rect(0, 6, 220, 20); } } });
  if (!sil) strokes(ctx, [[40, -14, 190, -12], [40, -2, 192, -1], [40, 9, 190, 9]], C.gunDark, 2.2, 0.8);
  // muzzle cone + barrel tip
  shape(ctx, [[206, -12], [236, -6], [236, 6], [206, 12]], { fill: sil || C.gunDark, seed: seed + 15, lw: 4, smooth: false });
  // pan magazine (flat drum on top)
  const spin = o.firing ? t * 9 : 0;
  shape(ctx, ellipsePts(-18, -36, 58, 15, 18), { fill: sil || C.gunDark, seed: seed + 16, lw: 4.5 });
  shape(ctx, ellipsePts(-18, -42, 58, 15, 18), { fill: sil || C.gun, seed: seed + 17, lw: 4.5 });
  if (!sil) {
    const r = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + spin; r.push([-18, -42, -18 + Math.cos(a) * 52, -42 + Math.sin(a) * 13]); }
    strokes(ctx, r, C.gunDark, 2, 0.7);
    circle(ctx, -18, -43, 8, { fill: C.gunDark, seed: seed + 18, lw: 2.5 });
  }
  // cocking handle (moves when cocked)
  const ck = o.cock ?? 0;
  shape(ctx, rectPts(-6 - ck * 40, 14, 14, 12), { fill: sil || C.gunDark, seed: seed + 19, lw: 3 });
  // sight
  shape(ctx, [[180, -20], [184, -34], [190, -20]], { fill: sil || C.gunDark, seed: seed + 20, lw: 3, smooth: false });
  const muzzle = [236, 0];
  ctx.restore();
  ctx.restore();
  // muzzle world position
  const a = -(o.aim ?? 0);
  const mx = pivot[0] + Math.cos(a) * muzzle[0] - Math.sin(a) * muzzle[1];
  const my = pivot[1] + Math.sin(a) * muzzle[0] + Math.cos(a) * muzzle[1];
  return { muzzle: [o.x + mx * s * face, o.y + my * s], angle: face > 0 ? a : Math.PI - a, pivot: [o.x + pivot[0] * s * face, o.y + pivot[1] * s] };
}
function muzzleFlash(ctx, x, y, ang, size, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const pts = [], n = 9;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * TAU;
    let r = (i % 2 === 0 ? 1 : 0.38) * size * (0.7 + hash(seed, i) * 0.6);
    if (i % 2 === 0 && Math.cos(a) > 0.8) r *= 1.8;
    pts.push([Math.cos(a) * r + size * 0.45, Math.sin(a) * r * 0.75]);
  }
  shape(ctx, pts, { fill: C.flash, seed, lw: 3, smooth: false, stroke: '#9A4A2A' });
  shape(ctx, ellipsePts(size * 0.45, 0, size * 0.32, size * 0.22, 10), { fill: '#FFF2B8', stroke: null, seed: seed + 1 });
  ctx.restore();
}

// ================= TRUCK (1930s military lorry) =================
// o: {x,y,s,face,wheelRot,t,seed,driver,bounce}
function wheel(ctx, x, y, r, rot, seed, sil) {
  shape(ctx, ellipsePts(x, y, r, r, 20), { fill: sil || C.tyre, seed, lw: 4.5 });
  shape(ctx, ellipsePts(x, y, r * 0.62, r * 0.62, 16), { fill: sil || '#8C8F6A', seed: seed + 1, lw: 3.5 });
  if (!sil) {
    const sp = [];
    for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU; sp.push([x + Math.cos(a) * r * 0.16, y + Math.sin(a) * r * 0.16, x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6]); }
    strokes(ctx, sp, C.ink, 4, 0.9);
    circle(ctx, x, y, r * 0.17, { fill: C.oliveDark, seed: seed + 2, lw: 3 });
  }
}
function truck(ctx, o) {
  const s = o.s ?? 1, face = o.face ?? 1, seed = o.seed ?? 77, t = o.t ?? 0, rot = o.wheelRot ?? 0, sil = o.sil;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * face, s);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const vib = (o.bounce ?? 1) * Math.sin(t * 40) * 1.5;
  ctx.translate(0, vib);
  const R = 46;
  // chassis
  shape(ctx, rectPts(-250, -78, 470, 20, 4), { fill: sil || C.oliveDark, seed: seed + 1, lw: 4 });
  // flatbed with slat sides
  shape(ctx, rectPts(-262, -160, 260, 84, 4), { fill: sil || C.olive, seed: seed + 2, lw: 5, hatch: sil ? null : { color: C.oliveDark, angle: -1.1, gap: 10, alpha: 0.4 } });
  if (!sil) strokes(ctx, [[-258, -132, -6, -132], [-258, -104, -6, -104], [-180, -158, -180, -78], [-100, -158, -100, -78]], C.oliveDark, 3, 0.85);
  // cargo: crates
  if (o.cargo !== false) {
    shape(ctx, rectPts(-240, -200, 70, 44), { fill: sil || '#A88B55', seed: seed + 3, lw: 4 });
    shape(ctx, rectPts(-160, -194, 64, 38), { fill: sil || C.oliveDark, seed: seed + 4, lw: 4 });
  }
  // cab
  const cab = [[0, -78], [0, -232], [16, -248], [96, -248], [108, -232], [116, -150], [116, -78]];
  shape(ctx, cab, { fill: sil || C.olive, seed: seed + 5, lw: 5, smooth: false, hatch: sil ? null : { color: C.oliveDark, gap: 10, alpha: 0.35 } });
  shape(ctx, [[18, -226], [92, -226], [100, -164], [18, -164]], { fill: sil || C.sky, seed: seed + 6, lw: 4, smooth: false });
  if (o.driver && !sil) { // simple driver head + slouch hat
    circle(ctx, 62, -186, 18, { fill: C.skin, seed: seed + 7, lw: 3.5 });
    shape(ctx, [[36, -200], [90, -198], [84, -192], [40, -192]], { fill: C.hat, seed: seed + 8, lw: 3 });
    shape(ctx, [[46, -200], [50, -216], [76, -216], [80, -200]], { fill: C.hat, seed: seed + 9, lw: 3 });
  }
  // hood
  shape(ctx, [[116, -170], [214, -160], [222, -150], [222, -78], [116, -78]], { fill: sil || C.olive, seed: seed + 10, lw: 5, smooth: false });
  if (!sil) strokes(ctx, [[140, -150, 140, -92], [156, -152, 156, -92], [172, -154, 172, -92]], C.oliveDark, 3, 0.8);
  // grille + lamp
  shape(ctx, rectPts(214, -158, 16, 80), { fill: sil || C.gunDark, seed: seed + 11, lw: 3.5 });
  circle(ctx, 206, -176, 13, { fill: sil || '#E8DFA8', seed: seed + 12, lw: 3.5 });
  // fenders
  shape(ctx, [[110, -78], [128, -116], [190, -122], [236, -96], [244, -66], [228, -66], [212, -92], [176, -102], [136, -96], [126, -70]], { fill: sil || C.oliveDark, seed: seed + 13, lw: 4 });
  shape(ctx, [[-200, -76], [-188, -106], [-110, -110], [-92, -76]], { fill: sil || C.oliveDark, seed: seed + 14, lw: 4 });
  // wheels
  wheel(ctx, 170, -R + 2, R, rot, seed + 20, sil);
  wheel(ctx, -150, -R + 2, R, rot, seed + 25, sil);
  ctx.restore();
}

// ================= ENVIRONMENT =================
function dustPuff(ctx, x, y, r, o = {}) {
  const seed = o.seed ?? 1, n = o.n ?? 7, alpha = o.alpha ?? 1;
  if (alpha <= 0.01 || r < 1) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  for (let i = 0; i < n; i++) {
    const a = hash(seed, i) * TAU, d = r * 0.55 * hash(seed, i, 1);
    const rr = r * (0.45 + 0.4 * hash(seed, i, 2));
    shape(ctx, ellipsePts(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, rr, rr * 0.8, 12, 0, 0.12, seed + i), { fill: i % 2 ? C.dust : mix(C.dust, C.paper, 0.35), seed: seed * 17 + i, lw: 2.6, stroke: o.stroke ?? mix(C.dustDark, C.ink, 0.2), tint: 0.3, double: false });
  }
  ctx.restore();
}
function cloud(ctx, x, y, s, seed) {
  const pts = [];
  const bumps = 6;
  for (let i = 0; i <= bumps; i++) { const u = i / bumps; pts.push([lerp(-110, 110, u) * s, (-26 - Math.sin(u * Math.PI) * 50 - hash(seed, i) * 18) * s]); }
  pts.push([110 * s, 8 * s], [-110 * s, 8 * s]);
  ctx.save(); ctx.translate(x, y);
  shape(ctx, pts, { fill: C.white, seed, lw: 3.5, stroke: mix(C.inkSoft, C.paper, 0.35), tint: 0.1 });
  ctx.restore();
}
function sun(ctx, x, y, r, seed, col) {
  shape(ctx, ellipsePts(x, y, r, r, 18), { fill: col || C.sun, seed, lw: 4, stroke: '#B8742E', hatch: { color: '#E79A35', gap: 8, alpha: 0.5 } });
}
function bush(ctx, x, y, s, seed, col) {
  const pts = [];
  const n = 9;
  for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; const r = (52 + hash(seed, i) * 22) * s; pts.push([x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 0.9]); }
  shape(ctx, pts, { fill: col || C.saltbush, seed, lw: 4, hatch: { color: mix(col || C.saltbush, C.ink, 0.35), gap: 8, alpha: 0.4 } });
}
function gumTree(ctx, x, y, s, seed, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, [[-14, 0], [-8, -150], [-30, -230], [-20, -234], [0, -170], [16, -240], [26, -236], [10, -150], [14, 0]], { fill: C.gumTrunk, seed, lw: 4, hatch: { color: '#B9AE9C', gap: 9, alpha: 0.4, angle: 1.4 } });
  const sway = Math.sin(t * 1.3 + seed) * 4;
  for (const [cx, cy, r, k] of [[-40, -250, 62, 1], [36, -262, 70, 2], [0, -300, 66, 3], [-70, -215, 42, 4], [70, -222, 46, 5]]) {
    shape(ctx, ellipsePts(cx + sway, cy, r, r * 0.62, 14, 0, 0.25, seed + k), { fill: C.gumLeaf, seed: seed + k * 7, lw: 4, hatch: { color: '#5E7A55', gap: 8, alpha: 0.45 } });
  }
  ctx.restore();
}
function grassTufts(ctx, x0, x1, y0, y1, n, seed, t = 0, col, scaleFn) {
  const st = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(seed, i)), y = lerp(y0, y1, hash(seed, i, 1));
    const sc = scaleFn ? scaleFn(y) : 1;
    const h = (10 + hash(seed, i, 2) * 16) * sc, sw = Math.sin(t * 2 + x * 0.01) * 3 * sc;
    st.push([x, y, x - 4 * sc + sw, y - h * 0.6, x - 6 * sc + sw, y - h]);
    st.push([x + 4 * sc, y, x + 6 * sc + sw, y - h * 0.5, x + 9 * sc + sw, y - h * 0.8]);
  }
  strokes(ctx, st, col || C.grass, 2.6, 0.85);
}
function windmill(ctx, x, y, s, t, seed) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  limb(ctx, [[-30, 0], [-6, -220]], 5, C.gunDark, { seed, olw: 4 });
  limb(ctx, [[30, 0], [6, -220]], 5, C.gunDark, { seed: seed + 1, olw: 4 });
  strokes(ctx, [[-24, -60, 24, -60], [-18, -120, 18, -120], [-12, -170, 12, -170], [-24, -60, 18, -120], [18, -60, -18, -120]], C.ink, 3, 0.8);
  ctx.translate(0, -230);
  const r = t * 2.5;
  for (let i = 0; i < 12; i++) { const a = r + i / 12 * TAU; shape(ctx, [[0, 0], [Math.cos(a - 0.12) * 70, Math.sin(a - 0.12) * 70], [Math.cos(a + 0.12) * 70, Math.sin(a + 0.12) * 70]], { fill: C.white, seed: seed + i, lw: 2.5, smooth: false }); }
  circle(ctx, 0, 0, 9, { fill: C.gunDark, seed: seed + 20, lw: 3 });
  shape(ctx, [[-6, -6], [-70, -14], [-74, 10], [-6, 6]], { fill: C.red, seed: seed + 21, lw: 3, smooth: false });
  ctx.restore();
}
function farmhouse(ctx, x, y, s, seed) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, rectPts(-110, -110, 220, 110), { fill: '#E8D9B8', seed, lw: 4, hatch: { color: '#C2AE88', gap: 9, alpha: 0.4 } });
  shape(ctx, [[-130, -104], [0, -180], [130, -104]], { fill: C.red, seed: seed + 1, lw: 4, smooth: false, hatch: { color: '#93402E', gap: 8, alpha: 0.45, angle: 0.3 } });
  shape(ctx, rectPts(-70, -80, 40, 40), { fill: C.sky, seed: seed + 2, lw: 3 });
  shape(ctx, rectPts(20, -70, 34, 70), { fill: C.fence, seed: seed + 3, lw: 3 });
  shape(ctx, [[-130, -60], [130, -60], [130, -52], [-130, -52]], { fill: C.fence, seed: seed + 4, lw: 3, smooth: false, alpha: 0 });
  ctx.restore();
}
// fence post + wires; broken: index set of posts leaning/fallen
function fence(ctx, posts, o = {}) {
  const seed = o.seed ?? 5;
  const top = [];
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]; // {x,y,h,lean}
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.lean || 0);
    shape(ctx, [[-p.w / 2, 0], [-p.w / 2, -p.h], [0, -p.h - p.w * 0.3], [p.w / 2, -p.h], [p.w / 2, 0]], { fill: C.fence, seed: seed + i, lw: Math.max(2.5, p.w * 0.2), smooth: false, hatch: { color: '#6E5236', gap: 6, alpha: 0.5, angle: 1.45 } });
    ctx.restore();
    const a = p.lean || 0;
    top.push(k => [p.x + Math.sin(a) * p.h * k, p.y - Math.cos(a) * p.h * k]);
  }
  // wires
  ctx.save(); ctx.strokeStyle = C.inkSoft; ctx.lineCap = 'round';
  for (const k of [0.85, 0.6, 0.35]) {
    for (let i = 0; i < posts.length - 1; i++) {
      if (o.broken && (o.broken.includes(i) || o.broken.includes(i + 1)) && k > 0.4 && (o.cut || []).includes(i)) continue;
      const a = top[i](k), b = top[i + 1](k);
      const sag = (o.broken && (o.broken.includes(i) || o.broken.includes(i + 1))) ? 30 * k : 6;
      ctx.lineWidth = Math.max(1.5, posts[i].w * 0.12);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]); ctx.stroke();
    }
  }
  ctx.restore();
}
function footprint(ctx, x, y, s, rot, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const col = o.color || mix(C.dustDark, C.ink, 0.35);
  ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = o.lw ?? 14;
  const p = o.progress ?? 1;
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.beginPath();
  for (const a of [-0.62, 0, 0.62]) { const L = a === 0 ? 92 : 74; ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.sin(a) * L * 0.5 * p, -Math.cos(a) * L * 0.55 * p, Math.sin(a * 1.1) * L * p, -Math.cos(a) * L * p); }
  ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 4, 17 * p, 14 * p, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

module.exports = { emu, person, lewis, muzzleFlash, truck, wheel, dustPuff, cloud, sun, bush, gumTree, grassTufts, windmill, farmhouse, fence, footprint };
