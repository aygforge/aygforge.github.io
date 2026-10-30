// Scenes 1–5: hook, fuel gauges, fuel calculation, engines stop, giant glider.
const { C, S, P, L, hatch, ell, rect, rrect, clamp, lerp, prog, ease, easeOut, easeIn, smooth, noise1, h2, rng, W, H } = require('./lib');
const Pt = require('./parts');
const { jetSide, jetTop, fan, cloud, person, scribble, TAU } = Pt;

// ---------------------------------------------------------------- shared backdrops
function skyWash(ctx, y0, y1, top, bot, o = {}) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.save();
  const ga = ctx.globalAlpha;
  ctx.globalAlpha = ga * (o.alpha == null ? 0.92 : o.alpha);
  ctx.fillStyle = g; ctx.fillRect(-200, y0, W + 400, y1 - y0);
  ctx.globalAlpha = ga * 0.35;
  ctx.fillStyle = require('./lib').crayon(ctx, bot); ctx.fillRect(-200, y0, W + 400, y1 - y0);
  ctx.restore();
  // a few long pencil streaks for texture
  const R = rng(o.seed || 3);
  for (let i = 0; i < (o.streaks == null ? 7 : o.streaks); i++) {
    const y = lerp(y0 + 60, y1 - 40, R()), x = R() * W, l = 120 + R() * 260;
    L(ctx, [[x, y], [x + l * 0.5, y - 3], [x + l, y + 1]], { stroke: C.blueDeep, lw: 2, alpha: 0.13, sketch: false });
  }
}
function cloudBank(ctx, y, offset, seed, o = {}) {
  const sp = 150, first = Math.floor(offset / sp) - 2, pts = [];
  const puffs = [];
  for (let i = first; i < first + Math.ceil(W / sp) + 5; i++) {
    const r1 = h2(i, seed), r2 = h2(i, seed + 1);
    puffs.push([i * sp - offset + r1 * 40, sp * (0.7 + r2 * 0.4), 40 + r1 * 70]);
  }
  for (let x = -60; x <= W + 60; x += 12) {
    let yy = 0;
    for (const [mx, rx, top] of puffs) { const d = (x - mx) / rx; if (Math.abs(d) < 1) yy = Math.min(yy, -top * Math.sqrt(1 - d * d)); }
    pts.push([x, y + yy]);
  }
  pts.push([W + 60, H + 100], [-60, H + 100]);
  P(ctx, pts, { fill: o.fill || C.cloud, stroke: C.inkSoft, lw: 2.2, sa: 0.55, sub: false, smooth: false, j: 0.8 });
  hatch(ctx, pts.map(([px, py]) => [px, py + 60]), { color: C.blueDeep, gap: 9, alpha: 0.10, angle: -0.25 });
}
function windLines(ctx, t, n, alpha, o = {}) {
  const R = rng(o.seed || 9);
  for (let i = 0; i < n; i++) {
    const sp = 900 + R() * 700, y = (o.y0 || 560) + R() * ((o.y1 || 1850) - (o.y0 || 560));
    const len = 140 + R() * 200, x = W + 300 - ((t * sp + R() * 4000) % (W + 900));
    const pts = []; for (let k = 0; k <= 6; k++) pts.push([x + k * len / 6, y + Math.sin(k + t * 3 + i) * 4]);
    L(ctx, pts, { stroke: o.color || C.blueDeep, lw: 2.2, alpha: alpha * (0.4 + 0.6 * R()), sketch: false, j: 0.6 });
  }
}
function bubble(ctx, x, y, r, drawInside, o = {}) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.closePath();
  ctx.save(); ctx.clip();
  ctx.fillStyle = o.bg || C.paper; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.translate(x, y);
  drawInside(ctx);
  ctx.restore();
  P(ctx, ell(x, y, r, r, 40), { stroke: C.ink, lw: 5, fill: null });
  ctx.restore();
}

// ================================================================= SCENE 1 — the hook
// fan rotation: integrate speed so the fans visibly wind down
const FAN_ANG = (() => {
  const arr = [0]; let a = 0;
  for (let i = 1; i <= 9 * 240; i++) { const t = i / 240; a += fanSpeed(t) / 240; arr.push(a); }
  return arr;
})();
function fanSpeed(t) { return 32 * (1 - easeOut(prog(t, 0.15, 1.9))); }
const fanAngle = (t) => FAN_ANG[clamp(Math.round(t * 240), 0, FAN_ANG.length - 1)];

function scene1(ctx, t) {
  skyWash(ctx, 380, 1920, C.skyHi, C.skyDeep, { seed: 11 });
  // high, thin clouds + a sea of clouds far below (12 km up)
  const drift = t * 60;
  for (let i = 0; i < 4; i++) cloud(ctx, ((i * 380 - drift * 0.4) % 1500 + 1500) % 1500 - 200, 640 + (i % 2) * 70, 220, 40 + i, { alpha: 0.55, lw: 1.6 });
  cloudBank(ctx, 1730, drift * 1.3, 61, { shade: C.cloudShade });
  cloudBank(ctx, 1840, drift * 2.1, 62, {});
  const power = 1 - prog(t, 0.2, 1.7);
  windLines(ctx, t, 12, 0.5 * power + 0.35 * prog(t, 2, 4), { y0: 760, y1: 1400 });

  // the aircraft — large, high above the clouds
  const bob = Math.sin(t * 1.4) * 6, sink = smooth(t, 1.8, 8) * 40;
  ctx.save();
  ctx.translate(560 + Math.sin(t * 0.6) * 8, 1040 + bob + sink);
  ctx.rotate(-0.01 + smooth(t, 1.8, 6) * 0.035);
  ctx.scale(1.42, 1.42);
  jetSide(ctx, { power, lw: 3.2 });
  ctx.restore();

  // engine bubbles: spinning → slowing → stopped
  const ang = fanAngle(t), sp = fanSpeed(t);
  const engX = 560 + 62 * 1.42, engY = 1040 + bob + sink + 65 * 1.42;
  const pulse = 1 + 0.05 * Math.sin(prog(t, 5.8, 6.6) * Math.PI);
  const bubbles = [[290, 1490], [790, 1490]];
  bubbles.forEach(([bx, by], k) => {
    L(ctx, [[engX - 20 + k * 30, engY + 20], [bx + (k ? -60 : 60), by - 140]], { lw: 2.4, dash: [10, 12], alpha: 0.6, sketch: false });
    bubble(ctx, bx, by, 160 * pulse, (c) => {
      c.fillStyle = C.skyHi; c.fillRect(-170, -170, 340, 340);
      fan(c, 138, ang * (k ? 1 : 1.03) + k * 0.4, sp, { dim: prog(t, 1.6, 2.4) });
      if (t > 1.6) { c.save(); c.globalAlpha *= 0.25 * prog(t, 1.6, 2.6); c.fillStyle = C.ink; c.fillRect(-170, -170, 340, 340); c.restore(); }
    });
    // status lamp under each bubble: green while running, dark once stopped
    const on = sp > 2;
    P(ctx, ell(bx, by + 190, 14, 14, 14), { fill: on ? C.green : C.greyDark, lw: 2.4 });
    if (on) P(ctx, ell(bx, by + 190, 24, 24, 16), { stroke: C.green, lw: 2, alpha: 0.5, sketch: false });
  });
}

// ================================================================= cockpit (scenes 2 & 6)
function crt(ctx, x, y, w, h, kind, on, t) {
  P(ctx, rrect(x, y, w, h, 10), { fill: '#1d222c', lw: 3 });
  if (on <= 0.02) return;
  ctx.save(); ctx.globalAlpha *= on;
  const cx = x + w / 2, cy = y + h / 2;
  if (kind === 'adi') {
    ctx.save(); ctx.beginPath(); ctx.rect(x + 12, y + 12, w - 24, h - 24); ctx.clip();
    ctx.translate(cx, cy); ctx.rotate(Math.sin(t * 0.7) * 0.03);
    P(ctx, rect(-w, -h, 2 * w, h), { fill: C.blueDeep, stroke: false, sub: false, j: 0 });
    P(ctx, rect(-w, 0, 2 * w, h), { fill: '#9a6b48', stroke: false, sub: false, j: 0 });
    L(ctx, [[-w, 0], [w, 0]], { stroke: C.white, lw: 2.5, sketch: false });
    ctx.restore();
    L(ctx, [[cx - 40, cy], [cx - 12, cy], [cx, cy + 10], [cx + 12, cy], [cx + 40, cy]], { stroke: C.amber, lw: 4, sketch: false, smooth: false });
  } else if (kind === 'hsi') {
    L(ctx, ell(cx, cy + 30, w * 0.38, w * 0.38, 20, 0, Math.PI * 1.1, Math.PI * 1.9), { stroke: C.greenHi, lw: 2.5, sketch: false });
    L(ctx, [[cx, cy + 30], [cx, cy - 40]], { stroke: C.white, lw: 3, sketch: false });
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.1 + i * 0.1); L(ctx, [[cx + Math.cos(a) * w * 0.38, cy + 30 + Math.sin(a) * w * 0.38], [cx + Math.cos(a) * w * 0.33, cy + 30 + Math.sin(a) * w * 0.33]], { stroke: C.greenHi, lw: 2, sketch: false }); }
  } else if (kind === 'eicas') {
    for (const k of [-1, 1]) {
      const gx = cx + k * w * 0.24, gy = cy;
      L(ctx, ell(gx, gy, w * 0.17, w * 0.17, 14, 0, Math.PI * 0.8, Math.PI * 2.2), { stroke: C.white, lw: 2.5, sketch: false });
      const v = 0.7 + Math.sin(t * 2 + k) * 0.02, a = Math.PI * (0.8 + 1.4 * v);
      L(ctx, [[gx, gy], [gx + Math.cos(a) * w * 0.15, gy + Math.sin(a) * w * 0.15]], { stroke: C.greenHi, lw: 3, sketch: false });
    }
  }
  ctx.restore();
}
function gauge(ctx, x, y, r, v, on = 1) {
  P(ctx, ell(x, y, r, r, 20), { fill: '#262b35', lw: 2.6 });
  for (let i = 0; i < 8; i++) { const a = Math.PI * (0.75 + i * 0.21); L(ctx, [[x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8], [x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62]], { stroke: C.white, lw: 1.6, alpha: 0.4 + 0.5 * on, sketch: false, j: 0.3 }); }
  const a = Math.PI * (0.75 + 1.5 * v);
  L(ctx, [[x, y], [x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72]], { stroke: C.amber, lw: 3, sketch: false, j: 0.3 });
}
function pilotBack(ctx, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const torso = [[-190, 470], [-200, 290], [-160, 175], [-60, 130], [60, 130], [160, 175], [200, 290], [190, 470]];
  P(ctx, torso, { fill: C.shirt, lw: 4 });
  hatch(ctx, torso, { gap: 11, alpha: 0.10, angle: 1.0 });
  // epaulettes
  for (const k of [-1, 1]) {
    ctx.save(); ctx.translate(k * 120, 168); ctx.rotate(k * 0.28);
    P(ctx, rrect(-42, -14, 84, 28, 6), { fill: C.navyCloth, lw: 2.5 });
    for (let i = 0; i < (o.stripes || 4); i++) L(ctx, [[-30 + i * 17, -10], [-30 + i * 17, 10]], { stroke: C.yellow, lw: 4, sketch: false });
    ctx.restore();
  }
  P(ctx, rrect(-42, 40, 84, 110, 20), { fill: C.skin, lw: 3 });
  P(ctx, ell(-80, 0, 16, 26, 12), { fill: C.skin, lw: 3 });
  P(ctx, ell(80, 0, 16, 26, 12), { fill: C.skin, lw: 3 });
  P(ctx, ell(0, -10, 80, 96, 28), { fill: o.hair || C.hair, lw: 4 });
  hatch(ctx, ell(0, -10, 80, 96, 20), { color: C.ink, gap: 7, alpha: 0.2, angle: 1.3 });
  // headset
  L(ctx, ell(0, -14, 92, 104, 20, 0, Math.PI * 1.05, Math.PI * 1.95), { stroke: C.panelDark, lw: 12, sketch: false });
  for (const k of [-1, 1]) P(ctx, ell(k * 88, 4, 20, 32, 14), { fill: C.panelDark, lw: 3 });
  ctx.restore();
}
function arm(ctx, from, elbow, hand, o = {}) {
  L(ctx, [from, elbow, hand], { stroke: C.ink, lw: 64, alpha: 1, sketch: false, j: 0.8 });
  L(ctx, [from, elbow, hand], { stroke: C.shirt, lw: 56, sketch: false, j: 0.8 });
  P(ctx, ell(hand[0], hand[1], 28, 24, 14, o.handRot || 0), { fill: C.skin, lw: 3.5 });
  if (o.finger) L(ctx, [hand, [hand[0] + o.finger[0], hand[1] + o.finger[1]]], { stroke: C.skin, lw: 13, sketch: false });
}
function clipboard(ctx, x, y, w, h, rot, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  P(ctx, rrect(-w / 2, -h / 2, w, h, 10), { fill: C.tan, lw: 3.5 });
  P(ctx, rect(-w / 2 + 14, -h / 2 + 24, w - 28, h - 38), { fill: C.white, lw: 2.5, smooth: false });
  P(ctx, rrect(-34, -h / 2 - 8, 68, 26, 6), { fill: C.greyDark, lw: 2.5 });
  for (let i = 0; i < 6; i++) scribble(ctx, -w / 2 + 34, -h / 2 + 70 + i * 34, w - 80 - (i % 3) * 30, 14, seed + i, 1, { lw: 2.4, color: C.inkSoft });
  ctx.restore();
}

// o: dim (0..1 screens off), skyTop, skyBot, horizon (y or null), t
function cockpit(ctx, t, o = {}) {
  const dim = o.dim || 0;
  // windshield view
  skyWash(ctx, 470, 900, o.skyTop || C.skyHi, o.skyBot || C.sky, { streaks: 3, seed: 21 });
  if (o.horizon) {
    P(ctx, [[-50, o.horizon], [1130, o.horizon - 6], [1130, 920], [-50, 920]], { fill: C.grass, stroke: false, sub: false, j: 0 });
    for (let i = 0; i < 6; i++) L(ctx, [[-50, o.horizon + 12 + i * 14], [1130, o.horizon + 8 + i * 16]], { stroke: C.grassDark, lw: 2, alpha: 0.35, sketch: false });
  }
  for (let i = 0; i < 3; i++) cloud(ctx, ((i * 420 - t * 25) % 1400 + 1400) % 1400 - 200, 640 + i * 60, 260, 120 + i, { alpha: 0.75, lw: 1.6 });
  // frame posts
  const post = (pts) => P(ctx, pts, { fill: C.panelDark, lw: 4, smooth: false });
  post([[-40, 470], [120, 470], [180, 900], [-40, 900]]);
  post([[960, 470], [1120, 470], [1120, 900], [900, 900]]);
  post([[505, 470], [575, 470], [565, 900], [515, 900]]);
  post([[-40, 440], [1120, 440], [1120, 500], [540, 530], [-40, 500]]);
  // glareshield + panel
  const panel = [[-40, 930], [1120, 930], [1120, 1500], [-40, 1500]];
  P(ctx, panel, { fill: C.panel, lw: 4 });
  hatch(ctx, panel, { color: '#000', gap: 10, alpha: 0.12, angle: 0.3 });
  P(ctx, [[-40, 880], [1120, 880], [1100, 950], [-20, 950]], { fill: '#2c303b', lw: 4 });
  const on = 1 - dim;
  crt(ctx, 110, 980, 200, 170, 'adi', on, t);
  crt(ctx, 110, 1170, 200, 170, 'hsi', on, t);
  crt(ctx, 770, 980, 200, 170, 'adi', on, t);
  crt(ctx, 770, 1170, 200, 170, 'hsi', on, t);
  crt(ctx, 430, 975, 220, 150, 'eicas', on, t);
  gauge(ctx, 362, 1010, 34, 0.5 + Math.sin(t * 1.1) * 0.02, 1);
  gauge(ctx, 718, 1010, 34, 0.35 + Math.sin(t * 0.9 + 1) * 0.02, 1);
  gauge(ctx, 362, 1100, 30, 0.6 + Math.sin(t * 1.3 + 2) * 0.03, 1);
  gauge(ctx, 718, 1100, 30, 0.45, 1);
  // fuel quantity unit: three blank windows — no usable reading
  fuelUnit(ctx, 540, 1250, t, o.fuelFault || 0);
  // pedestal + thrust levers
  P(ctx, [[440, 1500], [640, 1500], [680, 1920], [400, 1920]], { fill: '#3a3f4c', lw: 4 });
  for (const k of [-1, 1]) {
    L(ctx, [[540 + k * 38, 1640], [540 + k * 34, 1540]], { stroke: C.greyDark, lw: 14, sketch: false });
    P(ctx, rrect(540 + k * 34 - 26, 1510, 52, 34, 10), { fill: C.white, lw: 3 });
  }
}
function fuelUnit(ctx, x, y, t, fault) {
  P(ctx, rrect(x - 125, y - 70, 250, 140, 14), { fill: '#2a2f3a', lw: 4 });
  for (let i = 0; i < 3; i++) {
    const wx = x - 100 + i * 70;
    P(ctx, rrect(wx, y - 34, 60, 46, 6), { fill: '#131820', lw: 2.5 });
    // dashes flicker in, then nothing — the reading cannot be trusted
    const flick = fault > 0 && Math.floor(t * 6 + i) % 4 === 0;
    if (fault < 0.5 || flick) for (let d = 0; d < 2; d++) L(ctx, [[wx + 10 + d * 24, y - 11], [wx + 26 + d * 24, y - 11]], { stroke: C.greenHi, lw: 4, alpha: fault < 0.5 ? 0.9 : 0.5, sketch: false });
  }
  // fault lamp
  const blink = fault > 0 && Math.floor(t * 2.5) % 2 === 0;
  P(ctx, ell(x, y + 42, 11, 11, 12), { fill: blink ? C.amber : '#5a4a2a', lw: 2.4 });
  if (blink) P(ctx, ell(x, y + 42, 22, 22, 14), { stroke: C.amber, lw: 2, alpha: 0.6, sketch: false });
}

// ================================================================= SCENE 2 — gauges can't be trusted
const S2_FOCUS = { x: 540, y: 1250, r: 125 };
function scene2(ctx, t) {
  const z = lerp(1.22, 1.0, smooth(t, 8.0, 11.0));
  ctx.save();
  ctx.translate(540, 1250); ctx.scale(z, z); ctx.translate(-540, -1250);
  ctx.translate(Math.sin(t * 0.5) * 6, Math.cos(t * 0.4) * 4);
  cockpit(ctx, t, { fuelFault: prog(t, 8.6, 9.0) });
  // question mark doodle beside the blank fuel unit
  const q = prog(t, 10.4, 11.0);
  if (q > 0) {
    ctx.save(); ctx.translate(705, 1180); ctx.rotate(0.12 + Math.sin(t * 2) * 0.04);
    L(ctx, [[-18, -30], [-12, -46], [8, -50], [22, -36], [16, -18], [2, -8], [0, 10]], { stroke: C.red, lw: 7, reveal: q, sketch: true });
    if (q > 0.9) P(ctx, ell(0, 30, 5, 5, 8), { fill: C.red, stroke: C.red, lw: 2 });
    ctx.restore();
    ctx.save(); ctx.translate(375, 1180); ctx.rotate(-0.15);
    L(ctx, [[-18, -30], [-12, -46], [8, -50], [22, -36], [16, -18], [2, -8], [0, 10]], { stroke: C.red, lw: 6, reveal: prog(t, 10.8, 11.4) });
    if (t > 11.4) P(ctx, ell(0, 30, 5, 5, 8), { fill: C.red, stroke: C.red, lw: 2 });
    ctx.restore();
  }
  // pilots seen from behind; the captain taps the fuel unit, the F/O checks the paperwork
  const tap = Math.max(0, Math.sin(t * 9)) * 10 * prog(t, 11.3, 11.6) * (1 - prog(t, 12.8, 13.1));
  const reach = smooth(t, 9.6, 11.2);
  pilotBack(ctx, 250, 1560, 1.0, { hair: '#7a6a5c', stripes: 4 });
  arm(ctx, [370, 1760], [lerp(420, 400, reach), lerp(1760, 1560, reach)], [lerp(400, 455, reach), lerp(1720, 1300 + tap, reach)], { finger: [26 * reach, -20 * reach] });
  pilotBack(ctx, 840, 1560, 1.0, { hair: '#4c3526', stripes: 3 });
  const look = Math.sin(t * 1.3) * 0.04;
  clipboard(ctx, 660 + Math.sin(t * 0.8) * 4, 1640, 230, 300, -0.22 + look, 31);
  arm(ctx, [730, 1800], [680, 1760], [640, 1740], {});
  // loose paperwork on the glareshield
  ctx.save(); ctx.translate(230, 905); ctx.rotate(-0.05);
  P(ctx, rect(-70, -22, 140, 34), { fill: C.white, lw: 2.2, smooth: false });
  scribble(ctx, -55, 0, 100, 10, 7, 1, { lw: 2, color: C.inkSoft });
  ctx.restore();
  ctx.restore();
}

// ================================================================= SCENE 3 — the fuel calculation
function fuelTruck(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  P(ctx, rrect(-200, -150, 280, 110, 40), { fill: C.white, lw: 4 });
  P(ctx, rect(-200, -112, 280, 16), { fill: C.red, stroke: false, sub: false });
  P(ctx, [[90, -40], [90, -140], [150, -140], [190, -90], [190, -40]], { fill: C.yellow, lw: 4, smooth: false });
  P(ctx, [[110, -128], [148, -128], [176, -94], [110, -94]], { fill: C.skyHi, lw: 2.5, smooth: false });
  P(ctx, rect(-215, -48, 410, 16), { fill: C.greyDark, lw: 3, smooth: false });
  for (const wx of [-150, -60, 140]) P(ctx, ell(wx, -26, 26, 26, 16), { fill: C.panelDark, lw: 3 });
  ctx.restore();
}
function tank(ctx, x, y, w, h, level, need, t, o = {}) {
  const body = rrect(x - w / 2, y - h / 2, w, h, 40);
  P(ctx, body, { fill: C.white, lw: 5 });
  // what was needed: ghosted dashed level
  const yNeed = y + h / 2 - h * need;
  ctx.save();
  ctx.beginPath(); ctx.rect(x - w / 2 + 8, yNeed, w - 16, h / 2 - (yNeed - y) - 8); ctx.clip();
  hatch(ctx, rrect(x - w / 2, y - h / 2, w, h, 40), { color: C.fuel, gap: 12, alpha: 0.35 * (o.ghost == null ? 1 : o.ghost), angle: -0.8, lw: 2.4 });
  ctx.restore();
  // what was actually loaded
  if (level > 0.001) {
    const yl = y + h / 2 - h * level;
    const wave = [];
    for (let i = 0; i <= 12; i++) wave.push([x - w / 2 + 10 + (w - 20) * i / 12, yl + Math.sin(i * 0.9 + t * 4) * 5]);
    const fuel = [...wave, [x + w / 2 - 10, y + h / 2 - 10], [x - w / 2 + 10, y + h / 2 - 10]];
    P(ctx, fuel, { fill: C.fuel, lw: 3, stroke: C.redDeep, sa: 0.6 });
  }
  if (o.ghost !== 0) L(ctx, [[x - w / 2 - 30, yNeed], [x + w / 2 + 30, yNeed]], { lw: 4, dash: [18, 14], alpha: o.ghost == null ? 1 : o.ghost, sketch: false });
  // gauge ticks on the side
  for (let i = 1; i < 10; i++) L(ctx, [[x + w / 2 - 22, y + h / 2 - h * i / 10], [x + w / 2 - 8, y + h / 2 - h * i / 10]], { lw: 2, alpha: 0.5, sketch: false });
  P(ctx, rrect(x - 30, y - h / 2 - 28, 60, 30, 8), { fill: C.greyDark, lw: 3 });
}
const notepadPos = (t) => {
  const inP = smooth(t, 16.4, 17.0), outP = smooth(t, 19.4, 20.2);
  return { x: lerp(540, 300, outP), y: lerp(2400, 1150, inP) + lerp(0, -330, outP), s: lerp(1, 0.48, outP), r: lerp(-0.04, -0.09, outP) };
};
function notepad(ctx, t) {
  const np = notepadPos(t);
  const vis = 1 - smooth(t, 21.6, 22.1);
  if (np.y > 2300 || vis <= 0) return;
  ctx.save(); ctx.globalAlpha *= vis; ctx.translate(np.x, np.y); ctx.rotate(np.r); ctx.scale(np.s, np.s);
  const page = rect(-370, -380, 740, 760);
  P(ctx, rect(-356, -366, 740, 760), { fill: '#cbbd9c', stroke: false, smooth: false, alpha: 0.7 });
  P(ctx, page, { fill: C.white, lw: 4, smooth: false });
  for (let i = 0; i < 12; i++) L(ctx, [[-350, -300 + i * 58], [350, -300 + i * 58]], { stroke: C.blue, lw: 1.6, alpha: 0.45, sketch: false, j: 0.4 });
  L(ctx, [[-280, -380], [-280, 380]], { stroke: C.red, lw: 1.8, alpha: 0.5, sketch: false });
  // row 1: dipstick + measured quantity
  const r1 = prog(t, 16.9, 17.4), r2 = prog(t, 17.45, 17.85), circ = prog(t, 17.7, 18.3), cross = prog(t, 18.35, 18.75);
  const r3a = prog(t, 18.6, 18.8), r3 = prog(t, 18.8, 19.25), ul = prog(t, 19.25, 19.6);
  if (r1 > 0) {
    P(ctx, rrect(-250, -282, 22, 120, 6), { fill: C.grey, lw: 2.6, reveal: r1 });
    for (let i = 0; i < 5; i++) L(ctx, [[-250, -270 + i * 22], [-238, -270 + i * 22]], { lw: 1.6, reveal: r1, sketch: false });
    scribble(ctx, -190, -194, 300, 56, 101, r1, { lw: 6 });
  }
  if (r2 > 0) {
    L(ctx, [[-200, -110], [-160, -70]], { lw: 6, reveal: r2 }); L(ctx, [[-160, -110], [-200, -70]], { lw: 6, reveal: r2 });
    scribble(ctx, -110, -68, 190, 56, 202, r2, { lw: 6 });
  }
  if (circ > 0) P(ctx, ell(-15, -96, 140, 66, 26, -0.05), { stroke: C.red, lw: 7, reveal: circ, closed: false });
  if (cross > 0) { L(ctx, [[160, -150], [230, -60]], { stroke: C.red, lw: 9, reveal: cross }); L(ctx, [[230, -150], [160, -60]], { stroke: C.red, lw: 9, reveal: clamp(cross * 2 - 1) }); }
  if (r3a > 0) { L(ctx, [[-200, 40], [-150, 40]], { lw: 6, reveal: r3a }); L(ctx, [[-200, 62], [-150, 62]], { lw: 6, reveal: r3a }); }
  if (r3 > 0) scribble(ctx, -100, 80, 220, 56, 303, r3, { lw: 6 });
  if (ul > 0) { L(ctx, [[-110, 110], [140, 106]], { lw: 5, reveal: ul }); L(ctx, [[-104, 124], [146, 121]], { lw: 4, reveal: ul }); }
  ctx.restore();
  // pencil following the writing
  const writing = t > 16.9 && t < 19.6;
  if (writing && np.s > 0.9) {
    const k = t < 17.4 ? [lerp(-190, 110, r1), -200] : t < 17.85 ? [lerp(-110, 80, r2), -80] : t < 18.3 ? [lerp(-150, 120, circ), -96 + Math.sin(circ * TAU) * 60] : t < 18.8 ? [200, -100] : t < 19.25 ? [lerp(-100, 120, r3), 70] : [lerp(-110, 140, ul), 112];
    const px = np.x + k[0], py = np.y + k[1] + Math.sin(t * 40) * 4;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.6);
    P(ctx, [[0, 0], [14, -30], [26, -30], [40, 0]], { fill: C.tan, lw: 3, smooth: false });
    P(ctx, rect(14, -230, 12, 200), { fill: C.yellow, lw: 3, smooth: false });
    P(ctx, [[0, 0], [7, -14], [13, 0]], { fill: C.ink, stroke: false, smooth: false });
    ctx.restore();
  }
}
function scene3(ctx, t) {
  // (a) fuelling on the ground
  const fade = 1 - smooth(t, 16.6, 17.2), tk = smooth(t, 19.4, 20.4), takeoff = smooth(t, 21.6, 22.3);
  if (fade > 0) {
    ctx.save(); ctx.globalAlpha *= 1;
    skyWash(ctx, 400, 1260, C.skyHi, C.sky, { seed: 31 });
    P(ctx, [[-40, 1250], [1120, 1250], [1120, 1940], [-40, 1940]], { fill: C.asphalt, lw: 3 });
    for (let i = 0; i < 8; i++) L(ctx, [[-40 + i * 160, 1500], [120 + i * 160, 1490]], { stroke: C.yellow, lw: 6, alpha: 0.5, sketch: false });
    const z = lerp(1.0, 1.08, prog(t, 14, 17));
    ctx.translate(540, 1200); ctx.scale(z, z); ctx.translate(-540, -1200);
    ctx.save(); ctx.translate(560, 1010); ctx.scale(1.3, 1.3); jetSide(ctx, { gear: 1 }); ctx.restore();
    // hose from truck to the wing refuelling point
    const wx = 560 - 70 * 1.3, wy = 1010 + 40 * 1.3;
    const hose = [[300, 1300], [360, 1200], [wx - 30, wy + 70], [wx, wy]];
    L(ctx, hose, { lw: 9, stroke: C.panelDark, sketch: false });
    for (let i = 0; i < 6; i++) {
      const u = ((t * 0.9 + i / 6) % 1), a = Math.floor(u * 3), f = u * 3 - a;
      const p = [lerp(hose[a][0], hose[a + 1][0], f), lerp(hose[a][1], hose[a + 1][1], f)];
      P(ctx, ell(p[0], p[1], 6, 6, 8), { fill: C.fuel, stroke: false });
    }
    fuelTruck(ctx, 330, 1470, 1.05, t);
    person(ctx, 740, 1470, 150, { seed: 12, shirt: C.orange, pants: C.navyCloth });
    ctx.restore();
    if (fade < 1) { ctx.save(); ctx.globalAlpha *= 1 - fade; ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  // (c) the result → a tank far less full than intended
  if (t > 19.3 && takeoff < 1) {
    ctx.save();
    const sc = lerp(1, 0.16, takeoff);
    const tx = lerp(640, 470, takeoff), ty = lerp(1250, 1180, takeoff);
    ctx.globalAlpha *= tk;
    ctx.translate(tx, ty); ctx.scale(sc, sc); ctx.translate(-640, -1250);
    tank(ctx, 640, 1250, 400, 560, 0.42 * easeOut(prog(t, 19.7, 20.8)), 0.9, t);
    // the gap between needed and loaded
    const gp = prog(t, 20.9, 21.5);
    if (gp > 0) {
      const y1 = 1250 + 280 - 560 * 0.9, y2 = 1250 + 280 - 560 * 0.42;
      L(ctx, [[910, y1 + 6], [910, y2 - 6]], { stroke: C.red, lw: 7, reveal: gp });
      L(ctx, [[892, y1 + 26], [910, y1 + 6], [928, y1 + 26]], { stroke: C.red, lw: 7, reveal: gp, smooth: false });
      L(ctx, [[892, y2 - 26], [910, y2 - 6], [928, y2 - 26]], { stroke: C.red, lw: 7, reveal: gp, smooth: false });
    }
    ctx.restore();
    // pencil arrow from the result on the notepad to the tank
    if (takeoff < 0.1) {
      const ap = prog(t, 19.9, 20.4);
      L(ctx, [[400, 900], [430, 960], [440, 1030]], { lw: 5, reveal: ap, alpha: 1 - takeoff * 10 });
    }
  }
  // (d) take-off with too little fuel
  if (takeoff > 0) {
    ctx.save();
    ctx.globalAlpha *= takeoff;
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
    skyWash(ctx, 400, 1920, C.skyHi, C.sky, { seed: 33 });
    const climb = smooth(t, 22.0, 23.8);
    P(ctx, [[-40, 1560 + climb * 200], [1120, 1560 + climb * 200], [1120, 1960], [-40, 1960]], { fill: C.grass, lw: 3 });
    P(ctx, [[-40, 1600 + climb * 200], [1120, 1600 + climb * 200], [1120, 1690 + climb * 200], [-40, 1690 + climb * 200]], { fill: C.asphalt, lw: 3 });
    const px = lerp(330, 640, climb), py = lerp(1470, 1080, climb);
    ctx.save(); ctx.translate(px, py); ctx.rotate(lerp(-0.02, -0.2, smooth(t, 21.9, 22.8))); ctx.scale(0.85, 0.85);
    jetSide(ctx, { gear: 1 - smooth(t, 23.0, 23.6), power: 1 });
    ctx.restore();
    // a small tank badge stays attached to the wing: still low
    const bx = px + 120, by = py - 250;
    L(ctx, [[px - 30, py + 30], [bx - 40, by + 70]], { lw: 2.4, dash: [8, 10], alpha: 0.7, sketch: false });
    ctx.save(); ctx.translate(bx, by); ctx.scale(0.3, 0.3); ctx.translate(-640, -1250);
    tank(ctx, 640, 1250, 400, 560, 0.42, 0.9, t, { ghost: 0.7 });
    ctx.restore();
    ctx.restore();
  }
  notepad(ctx, t);
}

// ================================================================= SCENE 4 — one engine, then the other
function pilotFace(ctx, t, o = {}) {
  const look = o.look || 0, tense = o.tense || 0;
  P(ctx, ell(0, 20, 78, 96, 26), { fill: C.skin, lw: 4 });
  P(ctx, ell(0, -40, 82, 56, 20, 0, Math.PI, TAU), { fill: o.hair || '#7a6a5c', lw: 3.5 });
  // headset + boom mic
  L(ctx, ell(0, 0, 92, 100, 18, 0, Math.PI * 1.08, Math.PI * 1.92), { stroke: C.panelDark, lw: 12, sketch: false });
  P(ctx, ell(-88, 18, 20, 32, 12), { fill: C.panelDark, lw: 3 });
  P(ctx, ell(88, 18, 20, 32, 12), { fill: C.panelDark, lw: 3 });
  L(ctx, [[-84, 40], [-60, 90], [-22, 100]], { stroke: C.panelDark, lw: 6, sketch: false });
  // eyes glance toward the engine display, brows tighten
  const ex = look * 12;
  for (const k of [-1, 1]) {
    P(ctx, ell(k * 30, 6, 15, 10 + tense * 2, 12), { fill: C.white, lw: 2.5 });
    P(ctx, ell(k * 30 + ex, 7, 6, 6, 8), { fill: C.ink, stroke: false });
    L(ctx, [[k * 30 - 18, -18 - (k > 0 ? 0 : tense * 4)], [k * 30 + 16, -20 + k * tense * 6]], { lw: 5, sketch: false });
  }
  L(ctx, [[-4, 18], [-8, 46], [4, 50]], { lw: 3, sketch: false });
  L(ctx, [[-24, 74], [24, 74 - tense * 2]], { lw: 4, sketch: false });
}
function scene4(ctx, t) {
  // looking down on the aircraft; clouds slide past underneath
  P(ctx, [[-40, 380], [1120, 380], [1120, 1960], [-40, 1960]], { fill: C.sky, stroke: false, sub: false, j: 0 });
  const scroll = t * 140;
  for (let i = 0; i < 9; i++) {
    const R = rng(400 + i);
    const y = ((i * 260 + scroll) % 2340) - 200, x = 100 + R() * 880;
    cloud(ctx, x, y, 300 + R() * 200, 410 + i, { alpha: 0.85, lw: 1.8 });
  }
  const e1 = 1 - prog(t, 24.55, 25.5), e2 = 1 - prog(t, 27.55, 28.6);
  const quiet = prog(t, 28.6, 29.3);
  windLines(ctx, t, 10, 0.4 * quiet, { y0: 900, y1: 1850 });
  ctx.save();
  ctx.translate(540 + Math.sin(t * 0.7) * 10, 1240 + Math.sin(t * 0.5) * 8);
  ctx.rotate(Math.sin(t * 0.6) * 0.02);
  ctx.scale(1.08, 1.08);
  jetTop(ctx, { exhaust: [e1, e2] });
  ctx.restore();
  // engine display bubble: two thrust bars; the left one drops first
  bubble(ctx, 820, 700, 150, (c) => {
    c.fillStyle = '#1d222c'; c.fillRect(-160, -160, 320, 320);
    for (let k = 0; k < 2; k++) {
      const v = k ? e2 : e1, bx = k ? 40 : -90;
      P(c, rect(bx, -100, 50, 200), { stroke: C.white, lw: 2.5, fill: null, smooth: false });
      if (v > 0.01) P(c, rect(bx + 6, 94 - 188 * v * (0.9 + Math.sin(t * 7 + k) * 0.02), 38, 188 * v * 0.9), { fill: C.green, stroke: false, sub: false, j: 0.5 });
      else P(c, rect(bx + 6, 80, 38, 14), { fill: C.amber, stroke: false, sub: false, j: 0.4, alpha: Math.floor(t * 3) % 2 ? 1 : 0.4 });
    }
    if (quiet > 0) { c.save(); c.globalAlpha *= 0.45 * quiet; c.fillStyle = '#000'; c.fillRect(-160, -160, 320, 320); c.restore(); }
  }, { bg: '#1d222c' });
  // the captain stays calm and focused
  bubble(ctx, 260, 700, 150, (c) => {
    c.fillStyle = C.skyHi; c.fillRect(-160, -160, 320, 320);
    c.save(); c.translate(0, 34); c.scale(1.05, 1.05);
    const look = Math.max(prog(t, 24.8, 25.2) * (1 - prog(t, 26.3, 26.8)), prog(t, 27.8, 28.2));
    pilotFace(c, t, { look, tense: Math.max(prog(t, 24.8, 25.6) * 0.6, prog(t, 27.8, 28.6)) });
    c.restore();
    if (quiet > 0) { c.save(); c.globalAlpha *= 0.3 * quiet; c.fillStyle = C.blueDeep; c.fillRect(-160, -160, 320, 320); c.restore(); }
  });
  // which engine went first: a small pencil arrow on the left pod
  const a1 = prog(t, 24.8, 25.3) * (1 - prog(t, 26.8, 27.2));
  if (a1 > 0) L(ctx, [[220, 1060], [300, 1120], [390, 1150]], { stroke: C.red, lw: 6, alpha: a1, reveal: a1 });
  const a2 = prog(t, 27.8, 28.3);
  if (a2 > 0) L(ctx, [[860, 1060], [780, 1120], [690, 1150]], { stroke: C.red, lw: 6, alpha: a2, reveal: a2 });
  if (quiet > 0) { ctx.save(); ctx.globalAlpha *= 0.10 * quiet; ctx.fillStyle = C.blueDeep; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

// ================================================================= SCENE 5 — the giant glider
function scene5(ctx, t) {
  const HZ = 1330;
  skyWash(ctx, 380, HZ, '#f0e2c6', C.sky, { seed: 51 });
  // distant prairie + lake sliver on the horizon
  P(ctx, [[-40, HZ], [1120, HZ - 8], [1120, 1960], [-40, 1960]], { fill: C.field, stroke: C.ink, lw: 2.5 });
  P(ctx, [[600, HZ - 3], [1120, HZ - 8], [1120, HZ + 40], [740, HZ + 34]], { fill: C.water, lw: 2 });
  for (let i = 0; i < 9; i++) L(ctx, [[-40, HZ + 30 + i * i * 9], [1120, HZ + 22 + i * i * 9.5]], { stroke: C.grassDark, lw: 2.2, alpha: 0.35, sketch: false });
  for (let i = 0; i < 11; i++) L(ctx, [[i * 120 - 60, HZ], [i * 300 - 1000, 1960]], { stroke: C.grassDark, lw: 2, alpha: 0.25, sketch: false });
  for (let i = 0; i < 4; i++) cloud(ctx, ((i * 360 - t * 18) % 1500 + 1500) % 1500 - 200, HZ - 90 + (i % 2) * 40, 200, 520 + i, { alpha: 0.7, lw: 1.5 });
  // the long glide toward the horizon
  const k = smooth(t, 29.5, 33.6);
  const px = lerp(330, 440, k), py = lerp(900, 950, k);
  const path = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30; path.push([lerp(px + 290, 1180, u), lerp(py + 60, HZ - 30, u)]); }
  const draw = prog(t, 30.0, 31.6);
  const thick = 1 + 1.4 * Math.sin(prog(t, 30.6, 32.4) * Math.PI);
  L(ctx, path, { lw: 4 * thick, dash: [22, 16], dashOff: -t * 40, alpha: 0.8 * draw, sketch: false });
  L(ctx, path, { lw: 3, reveal: draw, alpha: 0.35 });
  const back = []; for (let i = 0; i <= 12; i++) { const u = i / 12; back.push([lerp(px - 280, -80, u), lerp(py - 10, py - 160, u)]); }
  L(ctx, back, { lw: 3, dash: [14, 16], alpha: 0.35, sketch: false });
  // gulls gliding alongside, wings still
  for (let g = 0; g < 2; g++) {
    const gx = 820 - g * 90 + Math.sin(t * 0.5 + g) * 10 - k * 40, gy = 700 + g * 60 + Math.sin(t * 0.8 + g) * 6;
    L(ctx, [[gx - 22, gy - 4], [gx - 10, gy - 8], [gx, gy], [gx + 10, gy - 8], [gx + 22, gy - 4]], { lw: 3, sketch: false });
  }
  // the 767: colour drains to a bare ink outline (a glider shape), then comes back
  const ghost = Math.sin(prog(t, 30.6, 32.6) * Math.PI);
  ctx.save();
  ctx.translate(px, py + Math.sin(t * 1.1) * 5); ctx.rotate(0.12); ctx.scale(0.9, 0.9);
  jetSide(ctx, { color: 1 - 0.85 * ghost, lw: 3.4 + ghost * 1.5 });
  ctx.restore();
  windLines(ctx, t, 10, 0.45, { y0: 700, y1: 1300 });
}

module.exports = { scene1, scene2, scene3, scene4, scene5, cockpit, pilotBack, arm, clipboard, skyWash, windLines, bubble, tank, S2_FOCUS };
