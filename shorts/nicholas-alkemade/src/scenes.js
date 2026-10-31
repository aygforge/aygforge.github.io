// All scene functions draw in screen space; local helpers set cameras.
// view-local coords: origin at view centre, x in ±506, y in ±681

function local(ctx, z = 1, r = 0, cx = 0, cy = 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); cam(ctx, cx, cy, z, r); }

function fallPose(t, k = 1) {
  return {
    a: 0.3, h: 0.25,
    la: [-1.1 + Math.sin(t * 3.1) * 0.25 * k, -0.5 + Math.sin(t * 2.3) * 0.25 * k], ra: [0.6 + Math.sin(t * 2.7 + 1) * 0.25 * k, 0.6 + Math.sin(t * 3.3) * 0.25 * k],
    ll: [0.55 + Math.sin(t * 2.2 + 2) * 0.15 * k, -0.6 + Math.sin(t * 2.9) * 0.2 * k], rl: [-0.55 + Math.sin(t * 2.5 + 3) * 0.15 * k, 0.7 + Math.sin(t * 3.4) * 0.2 * k], look: 0.9,
  };
}

// ============ SCENE 1 : the hook ============
function scene1(ctx, tau, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  skyFill(ctx, NIGHT);
  const drift = tau * 4;
  stars(ctx, 11, 150, 0, -drift * 0.4, t);
  local(ctx, 1.02 + tau * 0.006, Math.sin(tau * 0.4) * 0.015, 0, 0);
  moon(ctx, 20, -40, 150);
  // clouds streaming upward (we fall)
  for (let i = 0; i < 6; i++) {
    const y = ((560 - (tau * 70 + i * 260)) % 1560 + 1560) % 1560 - 780; const x = (i % 2 ? -1 : 1) * (220 + (i * 53) % 140);
    cloud(ctx, x, y, 0.75 + (i % 3) * 0.15, 30 + i, i % 2 ? '#3E4370' : '#4A4F7C', 0.9);
  }
  // burning Lancaster far above
  const px = -170 + tau * 7, py = -505 + Math.sin(tau * 0.7) * 6;
  smoke(ctx, px + 60, py + 10, t, 51, { n: 10, rise: -200, dx: 330, r0: 10, r1: 60, a: 0.6, rate: 0.5, col: '#5A5468' });
  glow(ctx, px + 60, py + 6, 200, 'rgba(255,140,60,0.4)');
  lancasterBelow(ctx, px, py, 0.5, 1.85, { col: '#4A5244' });
  fire(ctx, px + 70, py + 22, 70, 20, t * 1.3, 61, { n: 3, lean: 0.6 });
  embers(ctx, px + 70, py + 20, t, 71, 10, 60, -160);
  // forest far below
  forestBand(ctx, 520, -560, 560, 81, { sc: 0.9, rows: 3 });
  glow(ctx, 0, 560, 500, 'rgba(220,230,245,0.12)');
  // falling figure — silhouette in front of moon
  const rot = Math.sin(tau * 0.8) * 0.35 + tau * 0.05;
  windStreaks(ctx, 5, 18, t, 20, -20, 520, 0.7, 700, 90);
  ctx.save(); ctx.translate(20, -10 + Math.sin(tau * 1.3) * 8); ctx.rotate(rot);
  person(ctx, Object.assign({ x: 0, y: 0, s: 2.3 }, fallPose(t)), { sil: true, silCol: '#191634' });
  ctx.restore();
}

// ============ SCENE 2 : rear gunner ============
function scene2(ctx, tau, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  skyFill(ctx, ['#0E1433', '#1A2150', '#2A2E5C', '#3B3A68']);
  stars(ctx, 21, 120, -tau * 6, 0, t);
  // zoom: start close, slow pull back; end fast pull back to hand over to scene 3
  const z = lerp(1.18, 1.0, easeIO(tau / 6.4)) * lerp(1, 0.55, easeIn(prog(tau, 6.6, 7.6)));
  local(ctx, z, Math.sin(tau * 0.5) * 0.01, 0, 0);
  // cloud deck below
  for (let i = 0; i < 5; i++) cloud(ctx, ((i * 300 - tau * 40) % 1500 + 1500) % 1500 - 750, 560 + (i % 2) * 40, 1.1, 120 + i, '#474C7A', 0.95);
  // distant formation
  for (let i = 0; i < 3; i++) {
    const fx = -360 + i * 150 + Math.sin(tau * 0.6 + i) * 8, fy = -470 + i * 50 + Math.sin(tau * 0.8 + i * 2) * 5;
    glow(ctx, fx, fy, 30, 'rgba(255,170,90,0.25)');
    lancasterSide(ctx, fx, fy, 0.16 - i * 0.02, { flip: true, sil: true, silCol: '#262840', exhaust: false });
  }
  // tail fin (left, behind) & fuselage tail coming from left
  const bob = Math.sin(tau * 1.1) * 6;
  ctx.save(); ctx.translate(0, bob);
  shape(ctx, [[-430, -420], [-330, -440], [-290, -360], [-280, 240], [-320, 300], [-440, 280]], { fill: C.green, id: 1201, lw: 5, hatch: 0.3 });
  shape(ctx, [[-560, 20], [-250, 0], [-230, 30], [-560, 60]], { fill: C.greenD, id: 1202, lw: 5, poly: true });
  shape(ctx, [[-560, -120], [-200, -70], [-60, -40], [-40, 160], [-200, 190], [-560, 220]], { fill: C.green, id: 1203, lw: 5, hatch: 0.3 });
  ctx.save(); ctx.globalAlpha = 0.9; shape(ctx, [[-560, 80], [-200, 90], [-50, 100], [-40, 160], [-200, 190], [-560, 220]], { fill: C.belly, ink: null, id: 1204 }); ctx.restore();
  // turret
  const tr = Math.sin(tau * 0.7) * 0.06; // traverse
  ctx.save(); ctx.translate(110, 30); ctx.rotate(tr);
  const dome = ell(0, 0, 270, 250, 26);
  const dp = shape(ctx, dome, { fill: '#141A30', id: 1230, lw: 6, hatch: 0.3 });
  ctx.save(); ctx.clip(dp);
  // Alkemade inside
  const look = Math.sin(tau * 0.9) * 0.8;
  airmanBust(ctx, -10, 30, 1.6, { turn: 0.15 + look * 0.1, lookX: look, lookY: -0.3, brow: 0.2, mouth: -0.3 });
  // glass tint and reflections
  ctx.fillStyle = 'rgba(150,180,210,0.13)'; ctx.fill(dp);
  ctx.globalAlpha = 0.35; ctx.strokeStyle = '#E8F0F8'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-170, -150); ctx.quadraticCurveTo(-120, -200, -40, -205); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-190, -90); ctx.quadraticCurveTo(-170, -140, -130, -165); ctx.stroke();
  ctx.restore();
  // framing bars
  line(ctx, ell(0, 0, 250, 90, 20, 0, Math.PI, Math.PI * 2), { lw: 7, ink: '#2B2F38', id: 1240 });
  line(ctx, ell(0, 0, 120, 230, 20, 0, -Math.PI / 2, Math.PI / 2), { lw: 7, ink: '#2B2F38', id: 1241 });
  line(ctx, ell(0, 0, 120, 230, 20, 0, Math.PI / 2, Math.PI * 1.5), { lw: 7, ink: '#2B2F38', id: 1242 });
  shape(ctx, [[-262, 170], [262, 170], [240, 262], [-240, 262]], { fill: C.metalD, id: 1243, lw: 5 });
  for (let g = 0; g < 4; g++) {
    const gy = 196 + (g % 2) * 26, gx = g < 2 ? -40 : 90;
    shape(ctx, [[gx, gy - 8], [gx + 470, gy - 4], [gx + 470, gy + 5], [gx, gy + 8]], { fill: '#2A2E35', id: 1210 + g, lw: 3.5, poly: true, hatch: 0.2 });
    line(ctx, [[gx + 440, gy - 8], [gx + 440, gy + 9]], { lw: 3, id: 1220 + g });
  }
  ctx.restore();
  ctx.restore();
}

// ============ SCENE 3 : attack & fire ============
function scene3(ctx, tau, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  skyFill(ctx, NIGHT);
  stars(ctx, 31, 140, -tau * 20, 0, t);
  const P = { x: 10, y: -80, s: 1.55 };
  const tail = [P.x + 310 * P.s, P.y - 2 * P.s]; const fireP = [P.x + 170 * P.s, P.y - 8 * P.s];
  // camera: from tail close-up out to full, then push into fire
  const out = easeOut(prog(tau, 0, 1.2)); const inn = easeIn(prog(tau, 3.7, 5.0));
  let z = lerp(2.3, 1.0, out); let cx = lerp(tail[0], 0, out), cy = lerp(tail[1], 0, out);
  z = lerp(z, 4.2, inn); cx = lerp(cx, fireP[0], inn); cy = lerp(cy, fireP[1] - 30, inn);
  const shake = tau > 1.9 && tau < 3.2 ? Math.sin(tau * 60) * 2.5 * (1 - prog(tau, 1.9, 3.2)) : 0;
  local(ctx, z, 0, cx + shake, cy);
  for (let i = 0; i < 5; i++) cloud(ctx, ((i * 330 + tau * 160) % 1650 + 1650) % 1650 - 820, 470 + (i % 2) * 60, 1.0, 140 + i, '#474C7A', 0.95);
  // fighter: approaches from lower-right, fires brief bursts, peels away
  const fa = prog(tau, 0.2, 2.2), fb = prog(tau, 2.2, 3.6);
  if (tau < 3.6) {
    const fx = lerp(560, 380, easeOut(fa)) + fb * 300, fy = lerp(420, 230, easeOut(fa)) + fb * 260;
    fighterSide(ctx, fx, fy, 0.5, { flip: true, rot: -0.35 + fb * 0.5 });
    if (tau > 1.5 && tau < 2.3) {
      for (let k = 0; k < 4; k++) { const f = ((tau * 5 + k * 0.25) % 1); const x0 = lerp(fx - 50, tail[0] - 70, f), y0 = lerp(fy - 20, tail[1] + 30, f);
        ctx.save(); ctx.globalAlpha = 0.8; ctx.strokeStyle = C.fire2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - 26, y0 - 14); ctx.stroke(); ctx.restore(); }
      glow(ctx, fx - 60, fy - 20, 40, 'rgba(255,220,140,0.7)', 0.6 + 0.4 * Math.sin(tau * 40));
    }
  }
  // flashes at the bomber
  for (const [ft, fxo, fyo] of [[1.9, 250, 10], [2.15, 200, -14], [2.4, 150, 4]]) {
    const k = prog(tau, ft, ft + 0.35); if (k > 0 && k < 1) { const a = Math.sin(k * Math.PI); glow(ctx, P.x + fxo * P.s, P.y + fyo * P.s, 90 * a + 20, 'rgba(255,230,160,0.9)', a); }
  }
  // fire grows on rear fuselage
  const fg = ease(prog(tau, 2.3, 4.0));
  if (fg > 0) {
    smoke(ctx, fireP[0] + 20, fireP[1] - 20, t, 301, { n: 12, rise: 80, dx: 520, r0: 14, r1: 80, a: 0.55 * fg, rate: 0.6, col: '#4D4A5A' });
    glow(ctx, fireP[0], fireP[1], 260 * fg, 'rgba(255,140,50,0.5)');
  }
  // bomber (flying left)
  ctx.save(); ctx.translate(0, Math.sin(tau * 1.3) * 5);
  lancasterSide(ctx, P.x, P.y, P.s, { flip: true });
  if (fg > 0) {
    ctx.save(); ctx.translate(P.x, P.y); ctx.scale(P.s, P.s);
    fire(ctx, 170, 0, 90 * fg, 26 * fg + 4, t * 1.3, 311, { n: 3, lean: 1.1 });
    fire(ctx, 230, 10, 60 * fg, 18 * fg + 3, t * 1.3, 321, { n: 2, lean: 1.3 });
    if (fg > 0.5) fire(ctx, 120, -10, 50 * (fg - .5) * 2, 14, t * 1.2, 331, { n: 2, lean: 1.2 });
    embers(ctx, 200, 0, t, 341, 14, 90, 120, fg);
    ctx.restore();
  }
  ctx.restore();
  // orange wash when pushing into flames
  if (inn > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = inn * 0.85;
    const g = ctx.createRadialGradient(VX, VY, 50, VX, VY, 900); g.addColorStop(0, C.fire3); g.addColorStop(0.5, C.fire1); g.addColorStop(1, C.fire0);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  }
}

// ============ SCENE 4 : parachute unusable ============
function interior(ctx, t, warm = 1, vp = [-40, -140]) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); skyFill(ctx, ['#1B1F22', '#262B2A', '#2D3330', '#1A1D1F']);
  local(ctx, 1, 0, 0, 0);
  glow(ctx, vp[0], vp[1], 700, `rgba(255,130,50,${0.35 * warm})`);
  for (let i = 0; i < 9; i++) {
    const k = Math.pow(1.38, i); const rx = 70 * k, ry = 80 * k;
    ctx.save(); ctx.globalAlpha = clamp(0.3 + i * 0.09);
    line(ctx, ell(vp[0], vp[1], rx, ry, 26, 0, Math.PI * 0.08, Math.PI * 0.92 + Math.PI * 1.0), { lw: 3 + i * 1.6, ink: i % 2 ? '#3E4943' : '#49544C', id: 1400 + i, closed: false, amp: 1.5 + i * 0.3 });
    ctx.restore();
  }
  // floor walkway
  shape(ctx, [[vp[0] - 50, vp[1] + 70], [vp[0] + 50, vp[1] + 70], [620, 720], [-620, 720]], { fill: '#2C2D2A', id: 1420, lw: 3, hatch: 0.35, inkA: 0.4 });
  for (let i = 1; i < 7; i++) { const f = Math.pow(i / 7, 1.8); line(ctx, [[lerp(vp[0] - 50, -620, f), lerp(vp[1] + 70, 720, f)], [lerp(vp[0] + 50, 620, f), lerp(vp[1] + 70, 720, f)]], { lw: 2 + f * 3, id: 1430 + i, inkA: 0.45 }); }
}
function scene4(ctx, tau, t) {
  const pack = [-250, -30];
  const flare = ease(prog(tau, 2.9, 3.5));
  const pushK = easeIO(prog(tau, 3.2, 5.0));
  const z = lerp(1, 1.75, pushK), cx = lerp(0, pack[0] + 40, pushK), cy = lerp(0, pack[1] + 20, pushK);
  interior(ctx, t, 1 + flare);
  local(ctx, z, Math.sin(tau * 0.7) * 0.01, cx, cy);
  // background fires down the fuselage
  fire(ctx, 20, -60, 110, 30, t, 1501, { n: 3, a: 0.9 });
  fire(ctx, 150, 0, 80, 24, t * 1.1, 1511, { n: 2, a: 0.85 });
  smoke(ctx, 40, -180, t, 1571, { n: 8, rise: 300, dx: -120, r0: 30, r1: 130, a: 0.45, rate: 0.25, col: '#4A4852' });
  // flames behind the pack
  fire(ctx, pack[0] + 120, pack[1] + 95, lerp(90, 230, flare), lerp(26, 52, flare), t * 1.2, 1531, { n: 3 });
  fire(ctx, pack[0] - 130, pack[1] + 95, lerp(50, 170, flare), lerp(18, 40, flare), t * 1.3, 1541, { n: 2 });
  // stowage rack + pack
  shape(ctx, [[pack[0] - 130, pack[1] + 85], [pack[0] + 130, pack[1] + 85], [pack[0] + 130, pack[1] + 102], [pack[0] - 130, pack[1] + 102]], { fill: C.metal, id: 1520, lw: 4, poly: true });
  line(ctx, [[pack[0] - 120, pack[1] + 100], [pack[0] - 140, pack[1] + 240]], { lw: 6, ink: C.metalD, id: 1521 });
  line(ctx, [[pack[0] + 120, pack[1] + 100], [pack[0] + 140, pack[1] + 240]], { lw: 6, ink: C.metalD, id: 1522 });
  const dmg = ease(prog(tau, 3.0, 6.0));
  parachutePack(ctx, pack[0], pack[1], 0.95, { dmg, t, strapDrop: ease(prog(tau, 4.8, 5.6)) });
  // small flames licking the bottom edge
  for (let i = 0; i < 4; i++) fire(ctx, pack[0] - 75 + i * 50, pack[1] + 88, lerp(30, 70, flare) * (0.7 + 0.3 * noise(t * 2 + i)), 14, t * 1.4, 1581 + i * 7, { n: 2, glow: i === 1 });
  embers(ctx, pack[0], pack[1] + 40, t, 1551, 18, 220, 340, 0.6 + flare * 0.4);
  smoke(ctx, pack[0] + 10, pack[1] - 60, t, 1561, { n: 10, rise: 440, dx: 140, r0: 24, r1: 120, a: 0.25 + dmg * 0.35, rate: 0.4, col: '#5A5762' });
  // Alkemade: three-quarter view facing the pack, arm reaching
  const reach = easeOut(prog(tau, 0.2, 2.4)) * (1 - 0.4 * ease(prog(tau, 3.0, 3.5)));
  const recoil = ease(prog(tau, 3.0, 3.4));
  const bx = 250 + recoil * 30, by = 250;
  airmanBust(ctx, bx, by, 1.1, { turn: -0.9, lookX: -1.2, lookY: -0.4, brow: lerp(0.5, 1.2, recoil), mouth: tau > 3.1 && tau < 4.4 ? 0.8 : -0.5, eyeOpen: lerp(1, 1.25, recoil) });
  const sh = [bx - 130, by + 175];
  const hand = [lerp(sh[0] - 60, pack[0] + 115, reach), lerp(sh[1] - 20, pack[1] + 70, reach) + Math.sin(t * 8) * 2 * reach];
  const el = [lerp(sh[0], hand[0], 0.45) + 10, lerp(sh[1], hand[1], 0.45) + 60];
  limb(ctx, sh, el, 64, C.jacket, C.ink, 4, 0.2, 1590);
  limb(ctx, el, hand, 54, C.jacket, C.ink, 4, 0, 1591);
  shape(ctx, ell(hand[0] + 8, hand[1], 36, 26, 12, -0.3), { fill: '#3A2A20', id: 1592, lw: 4 });
  shape(ctx, [[hand[0] - 20, hand[1] - 14], [hand[0] - 52, hand[1] - 22], [hand[0] - 54, hand[1] - 8], [hand[0] - 22, hand[1] + 4]], { fill: '#3A2A20', id: 1593, lw: 3.5 });
  // warm rim light
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, pack[0], pack[1] + 60, 460, `rgba(255,120,40,${0.16 + flare * 0.18})`); glow(ctx, bx - 60, by - 40, 260, `rgba(255,120,40,${0.08 + flare * 0.1})`); ctx.restore();
}

// ============ SCENE 5 : impossible choice ============
function scene5(ctx, tau, t) {
  // divider position (screen x local): starts 0, sky takes over at end
  const take = easeIO(prog(tau, 5.4, 6.4));
  const d = lerp(0, -620, take);
  const lookL = win(tau, 2.4, 3.8, 0.35), lookR = win(tau, 4.1, 99, 0.35);
  // left: burning interior
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.rect(0, 0, VX + d + 6, H); ctx.clip();
  interior(ctx, t, 1.6, [-200, -160]);
  local(ctx, 1, 0, 0, 0);
  fire(ctx, -330, 330, 260 + lookL * 80, 70, t, 1601, { n: 3 });
  fire(ctx, -120, 120, 160 + lookL * 50, 44, t * 1.1, 1611, { n: 3 });
  fire(ctx, -380, -40, 120, 34, t * 1.2, 1621, { n: 2 });
  smoke(ctx, -250, -100, t, 1631, { n: 10, rise: 500, dx: 60, r0: 30, r1: 140, a: 0.5, rate: 0.3, col: '#5A5560' });
  embers(ctx, -250, 300, t, 1641, 20, 300, 500);
  ctx.restore();
  // right: open night sky through turret doors
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.rect(VX + d - 6, 0, W, H); ctx.clip();
  skyFill(ctx, ['#05081A', '#0A1030', '#141A42', '#1E2350']);
  stars(ctx, 51, 160, -tau * 3, 0, t, 1);
  local(ctx, 1, 0, 0, 0);
  for (let i = 0; i < 4; i++) cloud(ctx, 200 + ((i * 260 - tau * 30) % 1000 + 1000) % 1000 - 500, 520 + (i % 2) * 50, 0.9, 170 + i, '#262B55', 0.9);
  windStreaks(ctx, 61, 18, t, 260 - d * 0.3, 0, 500, 0.5 + lookR * 0.5, 500, 80);
  ctx.restore();
  // divider: jagged ink line + door frame edge
  local(ctx, 1, 0, 0, 0);
  const dp = []; for (let i = 0; i <= 24; i++) dp.push([d + Math.sin(i * 2.1) * 10 + jv(1650, i, 3), -700 + i * 60]);
  line(ctx, dp, { lw: 9, ink: '#2B2F38', id: 1651 }); line(ctx, dp.map(p => [p[0] + 14, p[1]]), { lw: 3, ink: '#7D848C', id: 1652 });
  // Alkemade between them
  const turn = lerp(0, -0.75, lookL) + lerp(0, 0.75, lookR);
  const bx = d * 0.15, by = 330 + take * 60;
  airmanBust(ctx, bx, by, 1.45 - take * 0.15, { turn, lookX: turn * 1.3, lookY: 0.1, brow: 0.8, mouth: -0.6, eyeOpen: 1 });
  // split lighting on face: warm left, cool right
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-atop';
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, bx - 260, by - 40, 380, `rgba(255,110,30,${0.22 + lookL * 0.15})`);
  glow(ctx, bx + 260, by - 40, 380, `rgba(70,110,200,${0.12 + lookR * 0.12})`);
  ctx.restore();
}

// ============ SCENE 6 : the fall ============
function scene6(ctx, tau, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  skyFill(ctx, NIGHT);
  const leave = prog(tau, 1.5, 2.7);       // leaving aircraft
  const rev = easeIO(prog(tau, 2.3, 6.4));  // scale reveal
  stars(ctx, 61, 160, 0, -tau * 10, t);
  const rot = Math.sin(tau * 0.55) * 0.05 * rev;
  local(ctx, 1, rot, 0, 0);
  moon(ctx, 230, -330 + rev * 120, 90 + rev * 20, 0.9);
  // clouds stream upward with increasing speed
  for (let i = 0; i < 7; i++) {
    const sp = 120 + i * 30; const y = ((700 - (Math.max(0, tau - 1.6) * sp * (0.5 + rev) + i * 230)) % 1600 + 1600) % 1600 - 800;
    cloud(ctx, (i % 2 ? -1 : 1) * (150 + (i * 71) % 220), y, 0.6 + (i % 3) * 0.25, 220 + i, i % 2 ? '#353A64' : '#41466F', 0.85);
  }
  // forest rises from below
  forestBand(ctx, lerp(900, 540, rev), -560, 560, 91, { sc: 0.85 });
  // the bomber: big tail at top initially, then recedes upward
  const ps = lerp(2.0, 0.11, easeIO(prog(tau, 1.3, 5.2)));
  const py = lerp(-250, -560, easeIO(prog(tau, 1.3, 4.6))), pxx = lerp(-460, -70, easeIO(prog(tau, 1.3, 5.2)));
  if (ps > 0.4) {
    glow(ctx, pxx + 120 * ps, py, 300 * ps, 'rgba(255,140,50,0.4)');
    lancasterSide(ctx, pxx, py, ps, { flip: true, rot: 0.04 });
    ctx.save(); ctx.translate(pxx, py); ctx.scale(ps, ps);
    fire(ctx, 170, 0, 90, 30, t * 1.3, 1711, { n: 3, lean: 1.1 }); fire(ctx, 240, 8, 60, 20, t * 1.3, 1721, { n: 2, lean: 1.3 });
    ctx.restore();
  } else {
    smoke(ctx, pxx, py, t, 1731, { n: 8, rise: -120, dx: 200, r0: 6, r1: 34, a: 0.5, rate: 0.5, col: '#555064' });
    glow(ctx, pxx, py, 90, 'rgba(255,140,60,0.45)');
    lancasterBelow(ctx, pxx, py, ps * 1.5, 1.9, { col: '#2B2D35' });
    fire(ctx, pxx + 10, py + 8, 36, 10, t * 1.3, 1741, { n: 2, lean: 0.6 });
  }
  // falling figure
  const tx = pxx + 318 * ps, ty = py + 6 * ps;
  const fx = lerp(tx, 0, ease(leave)), fy = lerp(ty, 20, easeOut(leave));
  const fr = tau < 1.5 ? Math.sin(tau * 3) * 0.04 : lerp(0, -2.6, easeOut(leave)) + Math.sin(tau * 0.7) * 0.3 * rev + (tau - 2.7 > 0 ? (tau - 2.7) * 0.12 : 0);
  const fs = lerp(1.6, 2.0, easeOut(leave)) - rev * 0.3;
  windStreaks(ctx, 71, 34, t, fx, fy, 560, 0.25 + rev * 0.8, 900, 130);
  ctx.save(); ctx.translate(fx, fy + Math.sin(tau * 1.5) * 6); ctx.rotate(fr);
  person(ctx, Object.assign({ x: 0, y: 0, s: fs }, tau < 1.5 ? { a: -0.25, la: [2.2, 0.8], ra: [-2.0, -0.9], ll: [1.7, -1.6], rl: [1.4, -1.4], h: 0.2, look: 0.8 } : fallPose(t, 0.6)), { sil: rev > 0.35, silCol: '#191634' });
  ctx.restore();
}

// ============ SCENE 7 : trees + snow ============
function scene7(ctx, tau, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (tau < 4.55) {
    skyFill(ctx, ['#111838', '#1E2550', '#323566', '#4A4775']);
    stars(ctx, 71, 100, 0, -tau * 30, t, 0.8);
    // camera descends through world. world y increases downward; canopy around y=0..1600, ground y=1900
    const camY = tau < 0.8 ? lerp(-900, -300, easeOut(tau / 0.8)) : tau < 3.6 ? lerp(-300, 1300, (tau - 0.8) / 2.8) - Math.sin((tau - 0.8) / 2.8 * Math.PI) * 60 : lerp(1300, 1800, easeOut((tau - 3.6) / 0.9));
    const z = tau < 0.8 ? lerp(0.6, 1.25, easeOut(tau / 0.8)) : 1.25;
    local(ctx, z, Math.sin(tau * 0.8) * 0.03, 0, camY);
    // background trees (parallax)
    ctx.save(); ctx.translate(0, camY * 0.4);
    for (let i = 0; i < 6; i++) pine(ctx, -500 + i * 200 + (i % 2) * 40, 1700, 1500 + (i % 3) * 200, { sil: true, col: '#1A2E2A', id: 1800 + i, snow: true, tiers: 8 });
    ctx.restore();
    // figure world position
    const figY = camY + 20 + Math.sin(tau * 2) * 10;
    // branches: each bends when the figure passes
    const B = [[300, -1, 1.7], [700, 1, 2.4], [1100, -1, 3.1], [1450, 1, 3.55]];
    B.forEach(([by, side, tc], i) => {
      const dt = tau - tc; const bend = dt > 0 ? Math.exp(-dt * 2.2) * Math.sin(dt * 9 + 0.6) * 0.28 + Math.exp(-dt * 1.2) * 0.12 : 0;
      branch(ctx, side * 560, by, side, 620, bend, 1810 + i * 7, t);
      if (dt > 0 && dt < 2) snowDrop(ctx, side * 200, by - 20, dt, 1830 + i, side);
    });
    // trunk edges
    shape(ctx, [[-600, -1000], [-520, -1000], [-500, 2200], [-600, 2200]], { fill: '#3A2A20', id: 1850, lw: 5, poly: true });
    shape(ctx, [[600, -1000], [520, -1000], [500, 2200], [600, 2200]], { fill: '#3A2A20', id: 1851, lw: 5, poly: true });
    // deep snow surface
    const gy = 1980; const gp = []; for (let x = -600; x <= 600; x += 50) gp.push([x, gy + Math.sin(x / 90) * 18]); gp.push([600, 3000], [-600, 3000]);
    shape(ctx, gp, { fill: C.snow, id: 1860, lw: 4, hatch: 0.08, light: 0.2, ink: C.snowB });
    // figure
    const slow = clamp(1 - (tau - 1.7) * 0.15);
    ctx.save(); ctx.translate(0, figY); ctx.rotate(Math.sin(tau * 1.2) * 0.4 * slow + 0.2);
    person(ctx, Object.assign({ x: 0, y: 0, s: 2.2 }, fallPose(t, slow)), {});
    ctx.restore();
    windStreaks(ctx, 81, 14, t, 0, figY, 400, 0.4 * slow, 800, 110);
  }
  // soft snow burst -> white
  const burst = prog(tau, 4.0, 4.6);
  if (burst > 0 && tau < 4.9) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); local(ctx, 1, 0, 0, 0);
    const cx = 0, cy = 520 - burst * 200;
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + (hash(i * 3.1) - 0.5) * 2.6; const d = easeOut(burst) * (300 + hash(i) * 600);
      const r = 60 + easeOut(burst) * (180 + hash(i + 9) * 220);
      shape(ctx, ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8 + 200, r, r * 0.85, 14), { fill: '#F7F9FB', ink: C.snowB, lw: 3, id: 1870 + i, hatch: 0.05, amp: 4 });
    }
  }
  const white = ease(prog(tau, 4.35, 4.75)) * (1 - ease(prog(tau, 4.8, 5.7)));
  // reveal: alive in snow
  if (tau >= 4.55) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    skyFill(ctx, ['#1A2148', '#2A3060', '#40467A', '#5B5F8C']);
    stars(ctx, 72, 90, 0, 0, t, 0.8);
    const z = lerp(1.0, 1.12, prog(tau, 4.6, 7.0));
    local(ctx, z, 0, 0, 40);
    moon(ctx, 300, -520, 70);
    for (let i = 0; i < 7; i++) pine(ctx, -520 + i * 170 + (i % 2) * 30, 260 - (i % 2) * 30, 520 + (i % 3) * 120, { id: 1880 + i * 9, tiers: 6, sway: Math.sin(t * 0.8 + i) * 4 });
    // snow ground
    const gp = []; for (let x = -600; x <= 600; x += 50) gp.push([x, 200 + Math.sin(x / 120) * 20]); gp.push([600, 900], [-600, 900]);
    shape(ctx, gp, { fill: '#E6ECF1', id: 1890, lw: 4, hatch: 0.08, light: 0.25, ink: C.snowB });
    // hollow
    // Alkemade half-buried in deep snow, alive
    const up = easeIO(prog(tau, 5.3, 6.6));
    const open = tau < 5.4 ? 0.08 : (Math.abs(tau - 6.3) < 0.08 ? 0.1 : 1);
    const look = tau < 6.0 ? 0 : Math.sin((tau - 6.0) * 2.2) * 0.9;
    airmanBust(ctx, 0, lerp(420, 300, up), 0.95, { tilt: lerp(-0.35, 0, up), turn: look * 0.3, lookX: look, lookY: -0.2, brow: 0.9, mouth: up > 0.5 ? 0.6 : -0.2, eyeOpen: open });
    ctx.save(); ctx.globalAlpha = 0.6; shape(ctx, ell(-40, lerp(330, 220, up), 26, 10, 10), { fill: C.snow, ink: null, hatch: 0, id: 1895 }); ctx.restore();
    // snow in front covering him to the chest
    shape(ctx, [[-560, 470], [-300, 420], [-170, 450], [-60, 432], [80, 440], [200, 425], [330, 455], [560, 430], [560, 760], [-560, 760]], { fill: '#EEF2F5', id: 1892, lw: 4, ink: C.snowB, hatch: 0.06, light: 0.15 });
    // breath
    const br = (tau * 0.7) % 1; if (up > 0.5) { ctx.save(); ctx.globalAlpha = 0.55 * Math.sin(br * Math.PI); shape(ctx, ell(-60 - br * 70, 300 - br * 50, 18 + br * 30, 12 + br * 18, 10), { fill: '#F3F6F9', ink: null, hatch: 0, id: 1893 }); ctx.restore(); }
    snowfall(ctx, 1894, 70, t, 0.9, 35, 1);
  }
  if (white > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(250,251,252,${white})`; ctx.fillRect(0, 0, W, H); }
}
function branch(ctx, x0, y0, side, len, bend, id, t) {
  const ang = bend * side; const pts = []; const N = 12;
  for (let i = 0; i <= N; i++) { const f = i / N; const a = (0.06 + ang * f * 1.4) * side; pts.push([x0 - side * len * f * Math.cos(a * f), y0 + len * f * Math.sin(Math.abs(a) * f) * 1.2 + f * f * 50 + Math.sin(t * 1.5 + id) * 4 * f]); }
  ctx.save();
  line(ctx, pts, { lw: 24, ink: '#3A2A20', id: id + 20, sketch: false });
  for (let i = 1; i <= N; i++) {
    const [px, py] = pts[i]; const s = 2.0 * (1 - i / (N + 4));
    shape(ctx, [[px - 60 * s, py + 4], [px - 40 * s, py - 46 * s], [px - 10 * s, py - 12], [px + 14 * s, py - 52 * s], [px + 36 * s, py - 8], [px + 64 * s, py - 30 * s], [px + 70 * s, py + 10], [px + 40 * s, py + 50 * s], [px + 10 * s, py + 22], [px - 20 * s, py + 56 * s], [px - 40 * s, py + 26]], { fill: i % 2 ? C.pine : C.pineL, id: id + i, lw: 3, hatch: 0.35, amp: 2 });
  }
  const sl = bend > 0.05 ? 0.35 : 1;
  for (let i = 1; i <= N; i += 1) { const [px, py] = pts[i]; const s = 2.0 * (1 - i / (N + 4)) * sl; shape(ctx, [[px - 56 * s, py - 20 * s], [px - 20 * s, py - 50 * s], [px + 30 * s, py - 46 * s], [px + 62 * s, py - 24 * s], [px, py - 30 * s]], { fill: C.snow, ink: C.snowB, lw: 2, id: id + 40 + i, hatch: 0.05 }); }
  ctx.restore();
}
function snowDrop(ctx, x, y, dt, id, side) {
  for (let i = 0; i < 14; i++) {
    const vx = (hash(id + i) - 0.5) * 200, vy = -60 + hash(id + i * 2) * 120; const px = x + vx * dt - side * hash(i + id) * 200, py = y + vy * dt + 500 * dt * dt;
    ctx.save(); ctx.globalAlpha = clamp(1 - dt / 2); const r = 8 + hash(i + id * 3) * 16 + dt * 10;
    shape(ctx, ell(px, py, r, r * 0.8, 10), { fill: '#F2F5F8', ink: C.snowB, lw: 1.5, id: id * 10 + i, hatch: 0 });
    ctx.restore();
  }
}

// ============ SCENE 8a : nobody believes him ============
function scene8a(ctx, tau, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  skyFill(ctx, ['#4A3626', '#5A4430', '#4A3828', '#3A2C20']);
  local(ctx, lerp(1.05, 1.12, prog(tau, 0, 4.3)), 0, 0, 0);
  // planks
  for (let i = 0; i < 9; i++) { const x = -560 + i * 130; shape(ctx, [[x, -720], [x + 126, -720], [x + 126, 720], [x, 720]], { fill: i % 2 ? C.wood : C.woodL, id: 2000 + i, lw: 3, poly: true, hatch: 0.4, amp: 2 }); }
  // window
  shape(ctx, [[-430, -560], [-170, -560], [-170, -280], [-430, -280]], { fill: '#1B2346', id: 2010, lw: 6, poly: true, hatch: 0.3 });
  ctx.save(); ctx.beginPath(); ctx.rect(-430, -560, 260, 280); ctx.clip(); for (let i = 0; i < 18; i++) { const sx = -430 + hash(i) * 260, sy = -560 + ((hash(i + 5) * 280 + t * 30 * (0.5 + hash(i + 2))) % 280); circleFill(ctx, sx, sy, 2.5, '#E8EEF6'); } ctx.restore();
  line(ctx, [[-300, -560], [-300, -280]], { lw: 6, ink: C.woodD, id: 2011 }); line(ctx, [[-430, -420], [-170, -420]], { lw: 6, ink: C.woodD, id: 2012 });
  // lamp
  const sw = Math.sin(t * 1.2) * 0.05;
  ctx.save(); ctx.translate(40, -720); ctx.rotate(sw);
  line(ctx, [[0, 0], [0, 230]], { lw: 3, id: 2013 });
  shape(ctx, [[-60, 290], [-24, 230], [24, 230], [60, 290]], { fill: '#3B4A3E', id: 2014, lw: 4, poly: true });
  circleFill(ctx, 0, 292, 14, '#FFE6A6');
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 40 + sw * 400, -400, 700, 'rgba(255,200,120,0.22)'); ctx.restore();
  // standing soldier behind, arms crossed, shaking head
  const shake = win(tau, 1.9, 4.2, 0.3) * Math.sin(t * 7) * 0.09;
  germanBust(ctx, -90, -150, 0.95, { tilt: shake, cap: 'field', brow: 0.6, brow2: 0.2, mouth: -0.8, id: 2100, lookX: 0.6 });
  // arms crossed
  shape(ctx, [[-240, 120], [60, 110], [70, 160], [-250, 170]], { fill: C.grayL, id: 2110, lw: 4, hatch: 0.35 });
  // table
  shape(ctx, [[-600, 330], [600, 330], [600, 400], [-600, 400]], { fill: C.woodD, id: 2120, lw: 5, poly: true, hatch: 0.4 });
  shape(ctx, [[-600, 400], [600, 400], [600, 720], [-600, 720]], { fill: '#3A2A1E', id: 2121, lw: 4, poly: true, hatch: 0.4 });
  // officer seated (left)
  const lookUp = ease(prog(tau, 1.6, 2.0));
  germanBust(ctx, -280, 110, 1.15, { cap: 'peaked', brow: lerp(0, 0.2, lookUp), brow2: lerp(0, 1.4, lookUp), mouth: -0.5, lookX: lerp(0.3, 1, lookUp), lookY: lerp(1, 0, lookUp), id: 2200, moustache: true });
  // Alkemade seated (right), blanket, gesturing up
  airmanBust(ctx, 290, 120, 1.1, { turn: -0.35, lookX: -0.9, lookY: lerp(0, -0.6, win(tau, 0.5, 1.8)), brow: 0.6, mouth: tau % 0.6 < 0.3 && tau < 3.6 ? 0.6 : 0, blanket: true, goggles: false });
  const g = win(tau, 0.2, 2.6, 0.3); const up = Math.sin(t * 5) * 0.08;
  const elb = [lerp(400, 400, g), lerp(330, 60, g)], hnd = [lerp(330, 330, g), lerp(320, -150, g) + up * 80];
  limb(ctx, [420, 300], elb, 62, C.blanket, C.ink, 4, 0.3, 2300);
  limb(ctx, elb, hnd, 52, C.jacket, C.ink, 4, 0, 2301);
  shape(ctx, ell(hnd[0], hnd[1] - 14, 30, 30, 12), { fill: C.skin, id: 2302, lw: 4 });
  if (g > 0.5) { line(ctx, [[hnd[0] - 4, hnd[1] - 36], [hnd[0] - 12, hnd[1] - 92]], { lw: 21, ink: C.ink, id: 2303, sketch: false }); line(ctx, [[hnd[0] - 4, hnd[1] - 36], [hnd[0] - 12, hnd[1] - 92]], { lw: 14, ink: C.skin, id: 2303, sketch: false }); }
  // notebook + papers on table
  const flip = Math.sin(t * 2.3) * 3;
  shape(ctx, [[-430, 300], [-180, 290], [-170, 360], [-440, 370]], { fill: '#F4EEDF', id: 2310, lw: 3.5, hatch: 0.08 });
  line(ctx, [[-305, 294], [-305, 364]], { lw: 2.5, id: 2311 });
  for (let i = 0; i < 4; i++) line(ctx, [[-420, 310 + i * 13], [-320, 305 + i * 13]], { lw: 1.5, ink: '#8A8AA8', id: 2312 + i, sketch: false });
  // writing hand with pencil
  const wr = (1 - lookUp) * Math.sin(t * 9) * 12;
  shape(ctx, ell(-250 + wr, 315, 24, 20, 10), { fill: C.skin, id: 2320, lw: 3.5 });
  line(ctx, [[-240 + wr, 310], [-215 + wr, 270]], { lw: 6, ink: '#C99A3A', id: 2321, sketch: false });
  limb(ctx, [-380, 200], [-260 + wr, 318], 40, C.gray, C.ink, 4, 0.2, 2322);
  shape(ctx, [[40, 310 + flip], [200, 300], [220, 360], [50, 372]], { fill: '#EFE8D6', id: 2330, lw: 3, hatch: 0.08 });
  shape(ctx, [[90, 296], [240, 288 - flip], [250, 340], [100, 350]], { fill: '#F6F1E4', id: 2331, lw: 3, hatch: 0.08 });
}

// ============ SCENE 8b : the wreckage ============
function scene8b(ctx, tau, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  skyFill(ctx, ['#141B3E', '#222A56', '#353A68', '#4B4C78']);
  stars(ctx, 81, 90, 0, 0, t, 0.8);
  const pk = [40, 180];
  const push = easeIO(prog(tau, 2.0, 3.4));
  const z = lerp(1, 1.6, push), cx = lerp(0, pk[0] - 60, push), cy = lerp(0, pk[1] - 40, push);
  local(ctx, z, 0, cx, cy);
  moon(ctx, -330, -540, 60);
  for (let i = 0; i < 8; i++) pine(ctx, -560 + i * 150, -60 + (i % 3) * 20, 560 + (i % 3) * 120, { id: 2400 + i * 9, tiers: 6, col: C.pineD, sway: Math.sin(t * 0.7 + i) * 3 });
  const gp = []; for (let x = -700; x <= 700; x += 50) gp.push([x, -40 + Math.sin(x / 140) * 18]); gp.push([700, 1200], [-700, 1200]);
  shape(ctx, gp, { fill: '#DDE4EB', id: 2420, lw: 4, hatch: 0.1, light: 0.2, ink: C.snowB });
  // tail fin standing up
  shape(ctx, [[300, -260], [380, -280], [400, 80], [320, 100]], { fill: C.green, id: 2430, lw: 5, hatch: 0.35 });
  // broken fuselage, open end facing camera-left
  shape(ctx, [[-60, 80], [400, 40], [440, 120], [420, 300], [-40, 330]], { fill: C.green, id: 2431, lw: 5, hatch: 0.35 });
  shape(ctx, [[-40, 200], [420, 190], [420, 300], [-40, 330]], { fill: C.belly, id: 2432, ink: null });
  // jagged open end
  const je = [[-60, 80], [-20, 110], [-70, 140], [-30, 175], [-80, 210], [-30, 250], [-70, 290], [-40, 330], [-140, 300], [-150, 120]];
  shape(ctx, je, { fill: '#121418', id: 2433, lw: 5, poly: true, hatch: 0.3 });
  // wing piece in snow
  shape(ctx, [[-480, 260], [-180, 200], [-160, 240], [-470, 320]], { fill: C.greenD, id: 2434, lw: 5, poly: true, hatch: 0.3 });
  // snow on top
  shape(ctx, [[-50, 84], [200, 60], [400, 40], [420, 56], [200, 80], [-40, 100]], { fill: C.snow, ink: C.snowB, lw: 2, id: 2435 });
  smoke(ctx, 240, 60, t, 2440, { n: 7, rise: 380, dx: 60, r0: 14, r1: 70, a: 0.3, rate: 0.25, col: '#6A6878' });
  // parachute pack inside the wreck (revealed by torch)
  const found = ease(prog(tau, 1.6, 2.2));
  ctx.save(); ctx.globalAlpha = 0.35 + found * 0.65; parachutePack(ctx, pk[0], pk[1], 0.62, { dmg: 0.5, t: 0, rot: -0.15 }); ctx.restore();
  // soldiers with torches
  const walk = easeOut(prog(tau, 0, 1.5));
  const sx = lerp(-700, -330, walk);
  const beam = lerp(-0.3, 0.0, ease(prog(tau, 0.9, 1.8)));
  const tip = [pk[0] + Math.sin(t * 3) * 6 * (1 - found), pk[1] + Math.cos(t * 2.7) * 6 * (1 - found)];
  const torch = [sx + 80, 160];
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const bt = [lerp(torch[0] + 300, tip[0], ease(prog(tau, 0.9, 1.8))), lerp(torch[1] + 260 + beam * 200, tip[1], ease(prog(tau, 0.9, 1.8)))];
  const ang = Math.atan2(bt[1] - torch[1], bt[0] - torch[0]); const L = Math.hypot(bt[0] - torch[0], bt[1] - torch[1]) + 60;
  ctx.fillStyle = 'rgba(255,236,170,0.22)'; ctx.beginPath(); ctx.moveTo(torch[0], torch[1]); ctx.lineTo(torch[0] + Math.cos(ang - 0.16) * L, torch[1] + Math.sin(ang - 0.16) * L); ctx.lineTo(torch[0] + Math.cos(ang + 0.16) * L, torch[1] + Math.sin(ang + 0.16) * L); ctx.fill();
  glow(ctx, bt[0], bt[1], 120 + found * 60, 'rgba(255,236,170,0.5)');
  ctx.restore();
  person(ctx, { x: sx - 120, y: 210, s: 2.6, a: 0.05, h: 0.1, la: [Math.PI * 0.9, 0.1], ra: [-Math.PI * 0.9, -0.1], ll: [0.25 + Math.sin(t * 6) * 0.2 * (1 - walk), 0], rl: [-0.25 - Math.sin(t * 6) * 0.2 * (1 - walk), 0.1], look: 1.3 }, { coat: true, cap: 'field', pal: { jacket: C.gray, legs: C.grayD, head: C.cap } });
  person(ctx, { x: sx, y: 220, s: 2.9, a: 0.05, h: 0.1, la: [Math.PI * 0.85, 0.1], ra: [-1.7, -0.3], ll: [0.25 + Math.sin(t * 6 + 1) * 0.2 * (1 - walk), 0], rl: [-0.25 - Math.sin(t * 6 + 1) * 0.2 * (1 - walk), 0.1], look: 1.3 }, { coat: true, cap: 'field', pal: { jacket: C.gray, legs: C.grayD, head: C.cap } });
  shape(ctx, [[torch[0] - 14, torch[1] - 10], [torch[0] + 14, torch[1] - 8], [torch[0] + 14, torch[1] + 10], [torch[0] - 14, torch[1] + 10]], { fill: '#2E3036', id: 2450, lw: 3, poly: true });
  // astonished close-up: soldier face in foreground
  const ast = ease(prog(tau, 3.0, 3.6));
  if (ast > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); local(ctx, 1, 0, 0, 0);
    const bx = lerp(-760, -300, ast);
    germanBust(ctx, bx, 420, 1.25, { cap: 'field', brow: 1.6, brow2: 1.8, eyeOpen: 1.5, mouth: 1.1, lookX: 1, lookY: -0.4, id: 2500 });
    // surprise strokes
    for (let i = 0; i < 6; i++) { const a = -2.2 + i * 0.32; const r0 = 150, r1 = 200 + Math.sin(t * 12 + i) * 10; ctx.save(); ctx.globalAlpha = ast; line(ctx, [[bx + Math.cos(a) * r0, 380 + Math.sin(a) * r0], [bx + Math.cos(a) * r1, 380 + Math.sin(a) * r1]], { lw: 5, id: 2510 + i, sketch: false }); ctx.restore(); }
  }
}

// ============ SCENE 9 + 10 : he really survived / ending ============
const ALT = -2700;
function scene9(ctx, tau, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  skyFill(ctx, ['#0B1130', '#151C46', '#262B5A', '#3A3B6A']);
  const pull = easeIO(prog(tau, 1.5, 5.0));
  const zA = 2.1, zB = 0.47;
  const z = Math.exp(lerp(Math.log(zA), Math.log(zB), pull)) * (1 - 0.02 * prog(tau, 5, 11));
  const cy = lerp(-120, -1310, pull);
  stars(ctx, 91, 170, 0, pull * 300, t, 0.4 + pull * 0.6);
  local(ctx, z, Math.sin(tau * 0.3) * 0.006, 0, cy);
  // clouds band
  for (let i = 0; i < 5; i++) cloud(ctx, -900 + i * 450 + Math.sin(t * 0.1 + i) * 30, -1150 - (i % 2) * 160, 1.4, 260 + i, '#2F3462', 0.85);
  // plane far above
  const pl = [70, ALT + Math.sin(t * 0.6) * 10];
  glow(ctx, pl[0], pl[1], 260, 'rgba(255,150,60,0.35)');
  smoke(ctx, pl[0] + 80, pl[1] + 30, t, 2601, { n: 9, rise: -300, dx: 600, r0: 20, r1: 110, a: 0.6, rate: 0.35, col: '#56526A' });
  lancasterBelow(ctx, pl[0], pl[1], 0.85, 1.75, { col: '#4A5244' });
  fire(ctx, pl[0] + 90, pl[1] + 45, 110, 30, t * 1.3, 2611, { n: 3, lean: 0.5 });
  // trajectory line (dashed, hand drawn) from ground up to plane
  const draw = ease(prog(tau, 2.0, 5.2));
  if (draw > 0) {
    const pts = []; const N = 40; for (let i = 0; i <= N; i++) { const f = i / N; pts.push([lerp(0, pl[0], f) + Math.sin(f * 9) * 40 * (1 - f) + Math.sin(f * 23) * 10, lerp(-40, pl[1] + 70, f)]); }
    const n = Math.max(2, Math.floor(pts.length * draw));
    ctx.save(); ctx.setLineDash([26, 22]); ctx.lineDashOffset = -t * 30; ctx.globalAlpha = 0.75;
    line(ctx, pts.slice(0, n), { lw: 5, ink: '#E9DFC8', id: 2620, sketch: false, amp: 2 });
    ctx.restore();
  }
  // ground & forest
  const gp = []; for (let x = -1400; x <= 1400; x += 60) gp.push([x, Math.sin(x / 160) * 14]); gp.push([1400, 1600], [-1400, 1600]);
  for (let i = 0; i < 16; i++) { const x = -1350 + i * 180 + (i % 3) * 25; if (Math.abs(x) < 90) continue; pine(ctx, x, 10 - (i % 2) * 20, 360 + (i % 4) * 90, { id: 2700 + i * 9, tiers: 6, col: i % 2 ? C.pine : C.pineD, sway: Math.sin(t * 0.8 + i) * 4 }); }
  shape(ctx, gp, { fill: '#E3E9EF', id: 2710, lw: 4, hatch: 0.1, light: 0.2, ink: C.snowB });
  // lantern glow
  const helperA = 1 - ease(prog(tau, 4.4, 5.4));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, -200, -10, 300, `rgba(255,190,110,${0.35 * helperA + 0.08})`); ctx.restore();
  // Alkemade + helper
  const sway = Math.sin(t * 1.6) * 0.04;
  person(ctx, { x: 0, y: -62, s: 2.35, a: -0.1 + sway, h: 0.2, la: [-1.15, -0.4], ra: [-2.85, -0.2], ll: [0.15, 0.05], rl: [-0.2, 0.1], look: -0.6 }, { blanket: true });
  if (helperA > 0) {
    ctx.save(); ctx.globalAlpha = helperA;
    person(ctx, { x: -120, y: -64, s: 2.45, a: 0.08, h: 0.2, la: [2.75, 0.2], ra: [1.3, 0.25], ll: [0.2, 0], rl: [-0.2, 0.05], look: 1.2 }, { coat: true, cap: 'field', pal: { jacket: C.gray, legs: C.grayD, head: C.cap } });
    shape(ctx, [[-225, -14], [-199, -14], [-195, 22], [-229, 22]], { fill: '#3B3A30', id: 2720, lw: 2.5, poly: true });
    circleFill(ctx, -212, 4, 8, '#FFE3A0');
    ctx.restore();
  }
  // footprints / snow hollow
  shape(ctx, ell(60, 40, 120, 18, 14), { fill: C.snowS, ink: C.snowB, lw: 2, id: 2730, hatch: 0.1 });
  snowfall(ctx, 2740, 60, t, 0.75, 30, 0.8);
}
