// Scenes 6–10: heading for Gimli, the race-day runway, the landing, everyone safe, ending.
const Lb = require('./lib');
const { C, S, P, L, hatch, ell, rect, rrect, clamp, lerp, prog, ease, easeOut, easeIn, smooth, noise1, h2, rng, W, H, crayon } = Lb;
const Pt = require('./parts');
const { jetSide, jetTop, cloud, person, carSide, carRear, tent, camper, flag, sailplaneTop, scribble, TAU } = Pt;
const A = require('./scenes_a');
const { cockpit, pilotBack, arm, skyWash, windLines, bubble } = A;

const EVE_TOP = '#f2dcc0', EVE_BOT = '#c9dbe3';

// ================================================================= map
const LAKE = [[690, 520], [760, 540], [800, 620], [790, 720], [830, 800], [860, 900], [840, 1000], [800, 1050],
  [760, 1110], [720, 1180], [700, 1260], [690, 1330], [660, 1360], [640, 1320], [650, 1250], [660, 1170],
  [690, 1090], [720, 1010], [740, 920], [720, 830], [700, 740], [680, 640]];
const GIMLI = [612, 1190];
const WPG = [560, 1560];
function parchMap(ctx, t, o = {}) {
  const sheet = [[60, 470], [1020, 486], [1030, 1760], [70, 1748]];
  P(ctx, [[74, 486], [1036, 500], [1044, 1776], [84, 1764]], { fill: '#bba06b', stroke: false, alpha: 0.6 });
  P(ctx, sheet, { fill: C.parch, lw: 4, smooth: false, subLen: 30, j: 2.2 });
  hatch(ctx, sheet, { color: C.parchDark, gap: 14, alpha: 0.25, angle: 0.6 });
  // grid
  for (let i = 1; i < 6; i++) L(ctx, [[60 + i * 160, 480], [70 + i * 160, 1750]], { stroke: C.parchDark, lw: 2, alpha: 0.6, sketch: false });
  for (let i = 1; i < 8; i++) L(ctx, [[64, 470 + i * 160], [1026, 484 + i * 160]], { stroke: C.parchDark, lw: 2, alpha: 0.6, sketch: false });
  P(ctx, LAKE, { fill: C.water, lw: 3.5 });
  L(ctx, [[560, 1560], [600, 1460], [640, 1380], [660, 1360]], { stroke: C.blueDeep, lw: 3.5 });
  L(ctx, [[200, 1500], [330, 1520], [460, 1550], [560, 1560]], { stroke: C.blueDeep, lw: 3 });
  // Winnipeg (dot) and the old airfield at Gimli (runway symbol)
  P(ctx, ell(WPG[0], WPG[1], 14, 14, 12), { fill: C.ink, lw: 2 });
  ctx.save(); ctx.translate(GIMLI[0], GIMLI[1]); ctx.rotate(-0.75);
  P(ctx, rect(-60, -24, 120, 14), { fill: C.asphaltDark, lw: 2.4, smooth: false });
  P(ctx, rect(-60, 10, 120, 14), { fill: C.asphaltDark, lw: 2.4, smooth: false });
  ctx.restore();
  // compass rose
  ctx.save(); ctx.translate(210, 640);
  P(ctx, [[0, -70], [14, 0], [0, 70], [-14, 0]], { fill: C.red, lw: 2.5, smooth: false });
  P(ctx, [[-70, 0], [0, -12], [70, 0], [0, 12]], { fill: C.parchDark, lw: 2.5, smooth: false });
  P(ctx, ell(0, 0, 44, 44, 20), { stroke: C.ink, lw: 2, fill: null, alpha: 0.6 });
  ctx.restore();
}
// flight path: from the east, first toward Winnipeg, then redirected to Gimli
const PATH_IN = [[1040, 860], [940, 920], [840, 1010], [760, 1130], [700, 1250]];
const PATH_WPG = [[700, 1250], [640, 1380], [590, 1490], [565, 1545]];
const PATH_GIMLI = [[700, 1250], [672, 1214], [645, 1200], [628, 1194]];
function mapPaths(ctx, t, o) {
  L(ctx, PATH_IN, { stroke: C.red, lw: 6, dash: [20, 14], reveal: o.inP, sketch: false });
  if (o.wpg > 0) L(ctx, PATH_WPG, { stroke: C.red, lw: 5, dash: [16, 14], alpha: o.wpg, sketch: false });
  if (o.cross > 0) { L(ctx, [[590, 1420], [660, 1480]], { stroke: C.ink, lw: 6, reveal: o.cross }); L(ctx, [[660, 1420], [590, 1480]], { stroke: C.ink, lw: 6, reveal: clamp(o.cross * 2 - 1) }); }
  if (o.gim > 0) L(ctx, PATH_GIMLI, { stroke: C.red, lw: 7, reveal: o.gim });
  if (o.icon != null) {
    const pts = o.icon < 1 ? PATH_IN : PATH_GIMLI, u = o.icon < 1 ? o.icon : o.icon - 1;
    const i = Math.min(pts.length - 2, Math.floor(u * (pts.length - 1))), f = u * (pts.length - 1) - i;
    const p = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
    const ang = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]);
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang + Math.PI / 2); ctx.scale(0.13, 0.13);
    jetTop(ctx, { exhaust: [0, 0], lw: 14 });
    ctx.restore();
  }
}

// ================================================================= perspective runway world (scenes 6c, 7)
function proj(cam, X, Z, Y = 0) {
  const d = Z - cam.z; if (d < 2) return null;
  return [cam.cx + cam.f * (X - cam.x) / d, cam.yh + cam.f * (cam.h - Y) / d, cam.f / d];
}
function quad(ctx, cam, X0, X1, Z0, Z1, o) {
  const zn = cam.z + 3; if (Z1 <= zn) return;
  Z0 = Math.max(Z0, zn);
  const a = proj(cam, X0, Z0), b = proj(cam, X1, Z0), c = proj(cam, X1, Z1), d = proj(cam, X0, Z1);
  if (o.raw) {
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
    ctx.fillStyle = crayon(ctx, o.fill); const ga = ctx.globalAlpha; ctx.globalAlpha = ga * (o.alpha || 1); ctx.fill(); ctx.globalAlpha = ga;
    return;
  }
  P(ctx, [a, b, c, d].map(p => [p[0], p[1]]), Object.assign({ smooth: false }, o));
}
// world objects: [kind, X, Z, extra]
const WORLD = (() => {
  const R = rng(2024), o = [];
  // drag-race section with guard rail down the middle of the runway
  o.push(['carR', -9, 1430, C.red], ['carR', 9, 1440, C.blue], ['flag', -30, 1400]);
  o.push(['carR', -9, 1640, C.yellow], ['carR', 9, 1660, C.green]);
  for (let z = 1140; z < 1900; z += 55) {
    o.push(['person', -28 - R() * 14, z + R() * 30, R()], ['person', 27 + R() * 14, z + R() * 30, R()]);
    if (R() < 0.5) o.push(['person', -44 - R() * 16, z + 20, R()]);
  }
  for (let z = 1200; z < 1900; z += 150) o.push(['tent', -82, z, [C.red, C.blue, C.yellow, C.green][Math.floor(R() * 4)]]);
  for (let z = 1260; z < 1900; z += 210) o.push(['camper', -112, z]);
  for (let z = 1120; z < 1900; z += 60) o.push(['carS', 66 + (Math.floor(z / 60) % 2) * 16, z, [C.blue, C.red, C.white, C.yellow, C.green, C.orange][Math.floor(R() * 6)]]);
  // kids on bicycles out on the runway
  o.push(['bike', -4, 1230], ['bike', 6, 1262]);
  return o.sort((a, b) => b[2] - a[2]);
})();
function bike(ctx, x, y, pxm, t, seed) {
  // pxm: pixels per metre (already exaggerated)
  const s = pxm / 40;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  P(ctx, ell(-22, -12, 12, 12, 12), { stroke: C.ink, lw: 3, fill: null });
  P(ctx, ell(22, -12, 12, 12, 12), { stroke: C.ink, lw: 3, fill: null });
  L(ctx, [[-22, -12], [-2, -12], [10, -32], [22, -12]], { lw: 3, smooth: false, sketch: false });
  ctx.restore();
  person(ctx, x, y - 0.45 * pxm, 1.5 * pxm, { seed, shirt: seed % 2 ? C.yellow : C.red, wave: 1, phase: seed });
}
function runwayWorld(ctx, cam, t, o = {}) {
  const yh = cam.yh;
  skyWash(ctx, 380, yh + 4, EVE_TOP, EVE_BOT, { seed: 61, streaks: 4 });
  for (let i = 0; i < 3; i++) cloud(ctx, ((i * 400 - t * 14) % 1400 + 1400) % 1400 - 200, yh - 120 - i * 70, 240, 610 + i, { alpha: 0.65, lw: 1.5 });
  // ground: patchwork prairie
  ctx.fillStyle = crayon(ctx, C.field); ctx.fillRect(-100, yh, W + 200, H - yh + 100);
  const cols = [C.grass, C.field, C.grassDark, '#c4b46e', C.grass];
  for (let zi = 0; zi < 26; zi++) for (let xi = -9; xi <= 9; xi++) {
    const Z0 = zi * 400 - 2000, X0 = xi * 400 - 200;
    if (Z0 + 400 < cam.z + 3) continue;
    quad(ctx, cam, X0, X0 + 400, Z0, Z0 + 400, { raw: true, fill: cols[Math.floor(h2(xi, zi) * 5)], alpha: 0.85 });
  }
  for (let xi = -9; xi <= 9; xi++) { const a = proj(cam, xi * 400 - 200, Math.max(cam.z + 20, -2000)), b = proj(cam, xi * 400 - 200, 9000); if (a && b) L(ctx, [[a[0], a[1]], [b[0], b[1]]], { stroke: C.grassDark, lw: 1.6, alpha: 0.4, sketch: false, j: 0.4 }); }
  // the second (parallel) runway, far right
  quad(ctx, cam, 300, 345, 0, 2400, { fill: C.asphalt, lw: 2 });
  // runway 32L
  quad(ctx, cam, -24, 24, -100, 2300, { fill: C.asphalt, lw: 3, stroke: C.ink });
  for (let z = 0; z < 60; z += 12) for (const x of [-20, -14, -8, 4, 10, 16]) quad(ctx, cam, x, x + 4, z, z + 9, { raw: true, fill: C.white });
  for (let z = 120; z < 1100; z += 60) quad(ctx, cam, -0.8, 0.8, z, z + 30, { raw: true, fill: C.white, alpha: o.centerline == null ? 1 : o.centerline });
  // guard rail down the middle of the drag-strip section
  const gr = [];
  for (let z = 1120; z <= 2000; z += 20) { const p = proj(cam, 0, z, 0.8); if (p) gr.push([p[0], p[1]]); }
  if (gr.length > 1) L(ctx, gr, { stroke: C.white, lw: 3, sketch: false });
  if (gr.length > 1) L(ctx, gr.map(p => [p[0], p[1] + 2]), { stroke: C.ink, lw: 1.6, alpha: 0.6, sketch: false });
  // race-day objects, revealed as they grow big enough to see
  const reveal = o.reveal == null ? 1 : o.reveal;
  for (const ob of WORLD) {
    const [k, X, Z] = ob;
    let mv = 0;
    if (k === 'carR' && Z < 1500) mv = Math.max(0, t - 44.2) * 14;
    const p = proj(cam, X, Z + mv); if (!p) continue;
    const s = p[2], vis = clamp((s - 0.3) / 0.5) * reveal;
    if (vis <= 0.02 || p[1] > H + 200) continue;
    ctx.save(); ctx.globalAlpha *= vis;
    // illustration exaggeration so tiny far-off things still read on a phone
    const ex = Math.max(1.8, 6 / Math.sqrt(s));
    if (k === 'carR') carRear(ctx, p[0], p[1], 2.2 * s * ex * 1.3, ob[3]);
    else if (k === 'carS') carSide(ctx, p[0], p[1], 4.6 * s * ex, ob[3], { flip: true });
    else if (k === 'tent') tent(ctx, p[0], p[1], 6 * s * ex, ob[3]);
    else if (k === 'camper') camper(ctx, p[0], p[1], 7 * s * ex);
    else if (k === 'flag') flag(ctx, p[0], p[1], 4 * s * ex);
    else if (k === 'person') {
      const look = o.lookUp || 0, seed = Math.floor(ob[3] * 1000);
      const run = (o.scatter || 0) * (ob[3] > 0.5 ? 1 : 0);
      const dx = run * (X < 0 ? -1 : 1) * 6 * s * Math.max(0, t - 48.2);
      person(ctx, p[0] + dx, p[1], 1.75 * s * ex * 1.4, { seed, wave: look > 0.5 && ob[3] < 0.35, point: look > 0.5 && ob[3] > 0.7, phase: ob[3] * 5, run });
    } else if (k === 'bike') bike(ctx, p[0], p[1], s * ex, t, Z);
    ctx.restore();
  }
}
function windshieldFrame(ctx, k) {
  // k: 1 = window frame visible, 0 = pushed out of view (we lean in)
  if (k <= 0.001) return;
  const off = (1 - k) * 500;
  P(ctx, [[-60 - off, 380], [70 - off, 380], [110 - off, 1640], [-60 - off, 1700]], { fill: C.panelDark, lw: 4, smooth: false });
  P(ctx, [[1010 + off, 380], [1140 + off, 380], [1140 + off, 1700], [970 + off, 1640]], { fill: C.panelDark, lw: 4, smooth: false });
  P(ctx, [[-60, 1700 + off], [540, 1660 + off], [1140, 1700 + off], [1140, 2100], [-60, 2100]], { fill: '#2c303b', lw: 4 });
}

// ================================================================= SCENE 6 — heading for Gimli
function scene6(ctx, t) {
  const toMap = smooth(t, 36.7, 37.5), toRunway = smooth(t, 38.6, 39.5);
  if (toMap < 1) {
    ctx.save();
    const z = lerp(1, 2.6, toMap);
    const fx = 690, fy = 1410;
    ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy);
    cockpit(ctx, t, { dim: 0.85, skyTop: EVE_TOP, skyBot: EVE_BOT, horizon: 820 });
    pilotBack(ctx, 250, 1580, 1.0, { hair: '#7a6a5c', stripes: 4 });
    pilotBack(ctx, 840, 1580, 1.0, { hair: '#4c3526', stripes: 3 });
    // F/O holds the chart, the captain points at it
    ctx.save(); ctx.translate(690, 1410); ctx.rotate(-0.06 + Math.sin(t * 0.9) * 0.01); ctx.scale(0.34, 0.34); ctx.translate(-540, -1120);
    parchMap(ctx, t); mapPaths(ctx, t, { inP: 1, wpg: 1, cross: 0, gim: 0, icon: 0.8 });
    ctx.restore();
    arm(ctx, [860, 1800], [800, 1700], [800, 1560], {});
    arm(ctx, [370, 1780], [430, 1640], [560, 1470 + Math.sin(t * 3) * 6], { finger: [26, -14] });
    // the captain's gliding experience: a small sailplane sketch drifts up like a thought
    const th = smooth(t, 34.4, 35.1) * (1 - smooth(t, 36.4, 36.8));
    if (th > 0) {
      ctx.save(); ctx.globalAlpha *= th;
      for (let i = 0; i < 3; i++) P(ctx, ell(240 + i * 24, 1400 - i * 46, 9 + i * 5, 9 + i * 5, 12), { fill: C.white, lw: 2.5 });
      P(ctx, ell(250, 1180, 170, 110, 26), { fill: C.white, lw: 3.5 });
      ctx.translate(250, 1180 + Math.sin(t * 2) * 6); ctx.rotate(-0.25); ctx.scale(0.34, 0.34);
      sailplaneTop(ctx, { lw: 8, fill: C.white });
      ctx.restore();
    }
    ctx.restore();
  }
  if (toMap > 0 && toRunway < 1) {
    ctx.save(); ctx.globalAlpha *= toMap;
    const z2 = lerp(1, 4.5, easeIn(prog(t, 38.4, 39.5)));
    ctx.translate(GIMLI[0], GIMLI[1]); ctx.scale(z2, z2); ctx.translate(-GIMLI[0], -GIMLI[1]);
    const zin = lerp(1.25, 1, toMap);
    ctx.translate(540, 1120); ctx.scale(zin, zin); ctx.translate(-540, -1120);
    parchMap(ctx, t);
    mapPaths(ctx, t, { inP: 1, wpg: 1 - prog(t, 37.6, 38.0) * 0.6, cross: prog(t, 37.4, 37.8), gim: prog(t, 37.8, 38.5), icon: 0.8 + prog(t, 37.5, 37.8) * 0.2 + prog(t, 37.8, 38.6) * 0.9 });
    ctx.restore();
  }
  if (toRunway > 0) {
    ctx.save(); ctx.globalAlpha *= toRunway;
    const cam = { x: 0, z: -5200 + (t - 38.6) * 140, h: 700 - (t - 38.6) * 40, f: 1000, cx: 540, yh: 820 };
    runwayWorld(ctx, cam, t, { reveal: 0, centerline: 1 });
    // the map line becomes the runway centreline
    const p0 = proj(cam, 0, -100), p1 = proj(cam, 0, 2200);
    if (p0 && p1) L(ctx, [[p0[0], p0[1]], [p1[0], p1[1]]], { stroke: C.red, lw: lerp(9, 3, toRunway), dash: [20, 14], alpha: 1 - smooth(t, 39.5, 40.4), sketch: false });
    // the aircraft, gliding in steadily, losing height
    const k = prog(t, 38.6, 40.8);
    ctx.save(); ctx.translate(lerp(260, 420, k), lerp(590, 700, k)); ctx.rotate(0.06); ctx.scale(0.42, 0.42);
    jetSide(ctx, {});
    ctx.restore();
    L(ctx, [[lerp(260, 420, k) + 130, lerp(590, 700, k) + 20], [p0 ? p0[0] : 540, p0 ? p0[1] - 30 : 900]], { lw: 3, dash: [10, 12], alpha: 0.55, sketch: false });
    ctx.restore();
  }
}

// ================================================================= SCENE 7 — the runway is not empty
function cam7(t) {
  // far & empty-looking → telephoto approach reveals race day → close enough to see people
  const a = smooth(t, 40.4, 43.2), b = smooth(t, 43.1, 46.6), c = smooth(t, 46.8, 49.6);
  return {
    x: lerp(0, 3, b) + Math.sin(t * 0.7) * 1.2,
    z: lerp(-3500, -2500, a) + lerp(0, 3350, b) + lerp(0, 230, c),
    h: lerp(380, 300, a) + lerp(0, -210, b) + lerp(0, -62, c),
    f: lerp(1000, 1100, a) + lerp(0, 900, b) + lerp(0, 500, c),
    cx: 540, yh: 790 + Math.sin(t * 0.9) * 4,
  };
}
function scene7(ctx, t) {
  const cam = cam7(t);
  const reveal = smooth(t, 43.4, 44.6);
  runwayWorld(ctx, cam, t, { reveal, lookUp: prog(t, 47.4, 47.8), scatter: prog(t, 48.0, 48.6) });
  // pencil circle around the problem as it becomes visible
  const ring = prog(t, 44.5, 45.1) * (1 - prog(t, 46.2, 46.6));
  if (ring > 0) {
    const p = proj(cam, 0, 1480);
    if (p) P(ctx, ell(p[0], p[1] - 30, 300, 120, 30, -0.04), { stroke: C.red, lw: 7, fill: null, reveal: ring, closed: false });
  }
  windshieldFrame(ctx, 1 - smooth(t, 45.6, 46.8));
  // close-up: people out on the old runway, looking up at the silent jet
  const pb = prog(t, 47.3, 47.7) * (1 - prog(t, 49.6, 50.0));
  if (pb > 0) {
    bubble(ctx, 560, 1390, 290 * easeOut(pb), (c) => {
      c.fillStyle = EVE_BOT; c.fillRect(-300, -300, 600, 600);
      P(c, [[-310, -40], [310, -52], [310, 310], [-310, 310]], { fill: C.grass, stroke: false, sub: false, j: 0 });
      P(c, [[-120, -44], [130, -48], [260, 310], [-240, 310]], { fill: C.asphalt, lw: 3, smooth: false });
      L(c, [[4, -46], [10, 310]], { stroke: C.white, lw: 5, sketch: false });
      tent(c, -230, -40, 90, C.red); carSide(c, 210, -36, 120, C.blue, { stripe: 1 });
      // the airliner overhead, small and silent
      c.save(); c.translate(-120 + (t - 47.3) * 40, -200 + (t - 47.3) * 12); c.rotate(0.06); c.scale(0.28, 0.28); jetSide(c, { gear: 1, noseGear: 0.55 }); c.restore();
      const look = prog(t, 47.7, 48.1);
      bike(c, -40, 150, 70, t, 3);
      bike(c, 60, 190, 76, t, 4);
      person(c, -190, 210, 170, { seed: 51, shirt: C.orange, pants: C.navyCloth, point: look > 0.5, phase: 1 });
      person(c, -120, 225, 120, { seed: 52, shirt: C.green, pants: C.tan, wave: look > 0.5, phase: 2 });
      person(c, 190, 220, 165, { seed: 53, shirt: C.white, pants: C.blueDeep, point: look > 0.5, phase: 3 });
      person(c, 250, 240, 110, { seed: 54, shirt: C.yellow, pants: C.navyCloth, phase: 4, run: prog(t, 48.4, 48.6) });
    });
  }
}

// ================================================================= SCENES 8 & 9a — the landing, then everyone off
// plane world x (metres-ish units), camera follows
function landingState(t) {
  const td = 51.9, stop = 54.3;
  let xw;
  const v0 = 520; // px per second at approach
  if (t < td) xw = (t - td) * v0;
  else { const u = clamp((t - td) / (stop - td)); xw = v0 * (stop - td) * (u - u * u / 2); }
  const alt = t < td ? 560 * Math.pow(1 - prog(t, 49.3, td), 1.35) : 0;
  const flare = smooth(t, 51.2, 51.8) * (1 - smooth(t, 52.4, 53.6));
  const noseDown = smooth(t, 52.5, 53.7);
  const pitch = -0.04 * flare + 0.075 * noseDown + (t < 51.2 ? 0.015 : 0);
  return { xw, alt, pitch, noseDown, td, stop };
}
function sideGround(ctx, camX, t, o = {}) {
  const gy = 1500;
  skyWash(ctx, 380, gy, EVE_TOP, EVE_BOT, { seed: 81, streaks: 4 });
  for (let i = 0; i < 4; i++) cloud(ctx, ((i * 420 - camX * 0.08 - t * 10) % 1600 + 1600) % 1600 - 260, 700 + (i % 2) * 90, 260, 810 + i, { alpha: 0.65, lw: 1.5 });
  // far fields
  P(ctx, [[-60, 1290], [1140, 1284], [1140, gy], [-60, gy]], { fill: C.field, lw: 2.5 });
  for (let i = 0; i < 4; i++) L(ctx, [[-60, 1310 + i * 40], [1140, 1306 + i * 44]], { stroke: C.grassDark, lw: 2, alpha: 0.35, sketch: false });
  // background race-day stuff, slow parallax
  const bx = (x) => x - camX * 0.35;
  for (let i = 0; i < 6; i++) tent(ctx, bx(1500 + i * 230), 1330, 70, [C.red, C.blue, C.yellow][i % 3]);
  for (let i = 0; i < 5; i++) camper(ctx, bx(1620 + i * 260), 1350, 80);
  // guard rail (mid-ground) on the far half of the runway
  const mx = (x) => x - camX * 0.7;
  const r0 = mx(1700), r1 = mx(4200);
  if (r1 > -100 && r0 < 1200) {
    L(ctx, [[Math.max(-60, r0), 1440], [Math.min(1140, r1), 1440]], { stroke: C.white, lw: 6, sketch: false });
    L(ctx, [[Math.max(-60, r0), 1446], [Math.min(1140, r1), 1446]], { stroke: C.ink, lw: 2, sketch: false });
    for (let x = 1700; x < 4200; x += 60) { const sx = mx(x); if (sx > -20 && sx < 1100) L(ctx, [[sx, 1440], [sx, 1462]], { lw: 2, sketch: false, j: 0.3 }); }
  }
  for (let i = 0; i < 6; i++) carSide(ctx, mx(2050 + i * 170), 1420, 90, [C.red, C.blue, C.yellow, C.green, C.white, C.orange][i], { stripe: i % 2 });
  // runway band
  P(ctx, [[-60, 1450], [1140, 1450], [1140, 1560], [-60, 1560]], { fill: C.asphalt, lw: 3 });
  const off = ((-camX) % 220 + 220) % 220;
  for (let x = -220; x < 1300; x += 220) L(ctx, [[x + off, 1505], [x + off + 110, 1505]], { stroke: C.white, lw: 6, alpha: 0.85, sketch: false });
  P(ctx, [[-60, 1560], [1140, 1560], [1140, 1960], [-60, 1960]], { fill: C.grass, lw: 3 });
  for (let i = 0; i < 6; i++) L(ctx, [[-60, 1600 + i * 60], [1140, 1594 + i * 64]], { stroke: C.grassDark, lw: 2, alpha: 0.3, sketch: false });
  // people near the far end of the runway, moving clear
  const fx = (x) => x - camX;
  const R = rng(88);
  for (let i = 0; i < 16; i++) {
    const wx = 1200 + i * 75 + R() * 40, side = i % 2 ? -1 : 1;
    const run = o.scatter ? clamp((t - 50.4 - R() * 0.6) / 1.6) : 1;
    const y = lerp(1500, side > 0 ? 1640 : 1420, run), sx = fx(wx);
    if (sx < -60 || sx > 1150) continue;
    person(ctx, sx, y, side > 0 ? 70 : 50, { seed: 900 + i, run: run < 1 && run > 0 ? 1 : 0, wave: run >= 1 && i % 3 === 0, phase: i });
  }
}
function smokePuffs(ctx, t, t0, x, y, n, o = {}) {
  for (let i = 0; i < n; i++) {
    const age = t - t0 - i * 0.08; if (age < 0 || age > 1.6) continue;
    const r = 14 + age * 50, a = (1 - age / 1.6) * 0.55;
    P(ctx, ell(x - age * (o.drift || 160) - i * 10, y - age * 30 - i * 3, r, r * 0.7, 16), { fill: C.white, stroke: C.greyDark, lw: 2, alpha: a });
  }
}
const PLANE_X = 470, PLANE_SCALE = 1.05;
function planeOnGround(ctx, t, st, o = {}) {
  const wheelY = 1505; // contact point
  const py = wheelY - (44 + 46 + 13) * PLANE_SCALE - st.alt;
  ctx.save();
  ctx.translate(o.x == null ? PLANE_X : o.x, py);
  // rotate about the main gear so the nose comes down onto the runway
  ctx.translate(-45 * PLANE_SCALE, (90 + 13) * PLANE_SCALE); ctx.rotate(st.pitch); ctx.translate(45 * PLANE_SCALE, -(90 + 13) * PLANE_SCALE);
  ctx.scale(PLANE_SCALE, PLANE_SCALE);
  jetSide(ctx, { gear: 1, noseGear: t < 52.4 ? 0.55 : lerp(0.55, 0, prog(t, 52.4, 53.2)), doors: o.doors || 0 });
  if (o.pilots) {
    for (const [hx, hc] of [[255, '#7a6a5c'], [266, '#4c3526']]) P(ctx, ell(hx, -20, 5, 6, 8), { fill: hc, stroke: false, alpha: o.pilots });
  }
  ctx.restore();
  return py;
}
function scene8(ctx, t) {
  const st = landingState(t);
  const camX = st.xw;
  sideGround(ctx, camX, t, { scatter: true });
  windLines(ctx, t, 8, 0.35 * (1 - prog(t, 52.5, 54)), { y0: 700, y1: 1300 });
  const tr = 1 - smooth(t, 52.4, 53.6);
  if (tr > 0) {
    const wy = 1505 - st.alt - 40;
    L(ctx, [[-60, wy - 520 * 0.55], [PLANE_X - 330, wy - 70], [PLANE_X - 200, wy - 10]], { lw: 4, dash: [18, 16], dashOff: -t * 40, alpha: 0.45 * tr, sketch: false });
  }
  const py = planeOnGround(ctx, t, st);
  // tyre smoke at touchdown, a little dust where the nose meets the runway
  const gx = PLANE_X - 45 * PLANE_SCALE;
  smokePuffs(ctx, t, st.td, gx, 1495, 5);
  smokePuffs(ctx, t, 53.4, PLANE_X + 232 * PLANE_SCALE, 1490, 4, { drift: 120 });
  // tyre close-up at touchdown
  const tb = prog(t, 51.7, 52.0) * (1 - prog(t, 53.4, 53.8));
  if (tb > 0) {
    const r = 150 * easeOut(tb);
    bubble(ctx, 800, 820, r, (c) => {
      c.fillStyle = EVE_BOT; c.fillRect(-160, -160, 320, 320);
      P(c, [[-170, 70], [170, 70], [170, 170], [-170, 170]], { fill: C.asphalt, lw: 3 });
      const spin = (t - 51.9) * 14;
      P(c, ell(0, -10, 80, 80, 28), { fill: C.panelDark, lw: 4 });
      P(c, ell(0, -10, 40, 40, 20), { fill: C.grey, lw: 3 });
      for (let k = 0; k < 5; k++) { const a = spin + k * TAU / 5; L(c, [[0, -10], [Math.cos(a) * 34, -10 + Math.sin(a) * 34]], { lw: 3, sketch: false }); }
      for (let i = 0; i < 4; i++) { const age = ((t - 51.9) * 1.4 + i * 0.25) % 1; P(c, ell(-60 - age * 140, 50 - age * 50, 20 + age * 40, 14 + age * 28, 14), { fill: C.white, stroke: C.greyDark, lw: 2, alpha: (1 - age) * 0.8 }); }
      for (let i = 0; i < 3; i++) L(c, [[60 + i * 20, 66], [150 + i * 10, 66]], { lw: 3, alpha: 0.6, sketch: false });
    });
  }
}
function scene9(ctx, t) {
  const news = smooth(t, 57.5, 58.4);
  if (news < 1) {
    ctx.save();
    if (news > 0) ctx.globalAlpha = 1;
    drawStopped(ctx, t);
    ctx.restore();
  }
  if (news > 0) newspaper(ctx, t, news);
}
function drawStopped(ctx, t) {
  const st = landingState(Math.min(t, 54.3));
  const st2 = Object.assign({}, st, { pitch: 0.075, alt: 0 });
  sideGround(ctx, st.xw, t, { scatter: true });
  smokePuffs(ctx, t, 53.4, PLANE_X + 232 * PLANE_SCALE, 1490, 4, { drift: 120 });
  const doors = smooth(t, 54.6, 55.3);
  planeOnGround(ctx, t, st2, { doors, pilots: 1 - smooth(t, 56.5, 57.2) * 0.4 });
  // escape slides + passengers walking away from the aircraft
  const slide = smooth(t, 54.9, 55.5);
  const doorScreen = (dx) => {
    // approximate screen position of a door on the nose-down aircraft
    const ang = 0.075, s = PLANE_SCALE, ox = PLANE_X, oy = 1505 - 103 * s;
    const px = -45 * s, py = 103 * s;
    const lx = dx * s - px, ly = 8 * s - py;
    return [ox + px + lx * Math.cos(ang) - ly * Math.sin(ang), oy + py + lx * Math.sin(ang) + ly * Math.cos(ang)];
  };
  for (const dx of [224, 118, -244]) {
    const d = doorScreen(dx), top = d[1] + 30, gx = d[0] + lerp(10, 120, slide), gy = lerp(top, 1520, slide);
    if (slide <= 0) continue;
    P(ctx, [[d[0] - 10, top], [d[0] + 14, top], [gx + 18, gy], [gx - 16, gy + 6]], { fill: C.yellow, lw: 2.6, smooth: false });
    L(ctx, [[d[0] - 10, top], [gx - 16, gy + 6]], { lw: 4, sketch: false });
  }
  const R = rng(99);
  for (let i = 0; i < 14; i++) {
    const t0 = 55.4 + i * 0.12 + R() * 0.2; if (t < t0) continue;
    const door = [224, 118, -244][i % 3], d = doorScreen(door);
    const u = (t - t0);
    const x = d[0] + 130 + u * (60 + R() * 50) * (i % 3 === 2 ? -1 : 1) + (i % 3 === 2 ? -150 : 0);
    const y = 1540 + R() * 70 + u * 16;
    person(ctx, x, y, 62, { seed: 300 + i, run: 0.5, phase: i });
  }
}
function newspaper(ctx, t, k) {
  // the scene becomes a photograph in the paper of record
  const page = [[110, 520], [990, 540], [975, 1830], [95, 1812]];
  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = C.paper; ctx.fillRect(0, 380, W, H);
  ctx.translate(540, 1170); ctx.rotate(-0.02 + Math.sin(t * 0.4) * 0.004); ctx.translate(-540, -1170);
  P(ctx, page.map(([x, y]) => [x + 16, y + 18]), { fill: '#b9ab8c', stroke: false, alpha: 0.5 });
  P(ctx, page, { fill: '#eee6d2', lw: 3.5, smooth: false });
  L(ctx, [[150, 600], [950, 614]], { lw: 7, sketch: false }); L(ctx, [[150, 620], [950, 634]], { lw: 2, sketch: false });
  // photograph: the stopped aircraft in sepia
  const ph = { x: 160, y: 660, w: 760, h: 520 };
  ctx.save();
  ctx.beginPath(); ctx.rect(ph.x, ph.y, ph.w, ph.h); ctx.clip();
  ctx.translate(ph.x, ph.y); ctx.scale(ph.w / 1080, ph.w / 1080); ctx.translate(0, -1030);
  drawStopped(ctx, Math.max(t, 57.3));
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = '#a58a62'; ctx.fillRect(ph.x, ph.y, ph.w, ph.h); ctx.restore();
  ctx.save(); ctx.globalAlpha *= 0.22 * k; ctx.fillStyle = '#7a6040'; ctx.fillRect(ph.x, ph.y, ph.w, ph.h); ctx.restore();
  P(ctx, rect(ph.x, ph.y, ph.w, ph.h), { stroke: C.ink, lw: 4, fill: null, smooth: false });
  // body copy: unreadable pencil lines only
  for (let c = 0; c < 2; c++) for (let i = 0; i < 9; i++) {
    const x0 = c ? 690 : 160, y = 1240 + i * 30 + c * 2;
    L(ctx, [[x0, y], [x0 + (i === 8 ? 120 : 230), y + 2]], { stroke: C.inkSoft, lw: 5, alpha: 0.35, sketch: false });
  }
  // 767 outline → simple glider silhouette
  const box = { x: 410, y: 1225, w: 260, h: 520 };
  const g = smooth(t, 59.1, 60.4);
  ctx.save();
  ctx.translate(540, 1510);
  ctx.save(); ctx.globalAlpha *= k * (1 - g); ctx.scale(0.62, 0.62); jetTop(ctx, { exhaust: [0, 0], color: 0.25, lw: 5 }); ctx.restore();
  ctx.save(); ctx.globalAlpha *= k * g; ctx.rotate(0); ctx.scale(0.58 + 0.04 * g, 0.58 + 0.04 * g);
  sailplaneTop(ctx, { lw: 6, fill: C.white });
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

// ================================================================= SCENE 10 — the channel ending
function scene10(ctx, t) {
  const gy = 1500;
  skyWash(ctx, 380, gy, '#f4d9b8', '#c8d9e2', { seed: 101, streaks: 5 });
  P(ctx, ell(560, 1262, 64, 64, 26), { fill: C.sun, stroke: C.orange, lw: 2.5, alpha: 0.8 });
  for (let i = 0; i < 4; i++) cloud(ctx, ((i * 380 + 120 - t * 9) % 1500 + 1500) % 1500 - 220, 700 + (i % 2) * 120, 240, 1010 + i, { alpha: 0.6, lw: 1.5 });
  P(ctx, [[-60, 1290], [1140, 1284], [1140, gy], [-60, gy]], { fill: C.field, lw: 2.5 });
  for (let i = 0; i < 4; i++) L(ctx, [[-60, 1310 + i * 40], [1140, 1306 + i * 44]], { stroke: C.grassDark, lw: 2, alpha: 0.35, sketch: false });
  // race day carries on in the distance
  for (let i = 0; i < 3; i++) tent(ctx, 780 + i * 110, 1330, 66, [C.red, C.blue, C.yellow][i]);
  L(ctx, [[640, 1440], [1140, 1440]], { stroke: C.white, lw: 6, sketch: false });
  L(ctx, [[640, 1446], [1140, 1446]], { stroke: C.ink, lw: 2, sketch: false });
  carSide(ctx, 880 + Math.sin(t * 0.6) * 16, 1418, 80, C.red, { stripe: 1 });
  carSide(ctx, 1010 + Math.sin(t * 0.5 + 1) * 12, 1418, 80, C.blue);
  flag(ctx, 760, 1430, 90);
  P(ctx, [[-60, 1450], [1140, 1450], [1140, 1560], [-60, 1560]], { fill: C.asphalt, lw: 3 });
  for (let x = 0; x < 1100; x += 220) L(ctx, [[x, 1505], [x + 110, 1505]], { stroke: C.white, lw: 6, alpha: 0.85, sketch: false });
  P(ctx, [[-60, 1560], [1140, 1560], [1140, 1960], [-60, 1960]], { fill: C.grass, lw: 3 });
  // the glide path, drawn in the sky down to the aircraft
  const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([lerp(-40, 430, u), lerp(930, 1470, Math.pow(u, 1.3))]); }
  L(ctx, pts, { lw: 4, dash: [18, 16], dashOff: -t * 30, alpha: 0.55 * prog(t, 61.4, 62.4), sketch: false });
  L(ctx, pts, { lw: 2.4, reveal: prog(t, 61.4, 62.8), alpha: 0.35 });
  // the aircraft, safe at Gimli, nose resting on the runway
  const st = { alt: 0, pitch: 0.075 };
  planeOnGround(ctx, t, st, { x: 520, doors: 1 });
  for (let i = 0; i < 7; i++) person(ctx, 700 + i * 44 + Math.sin(t + i) * 4, 1600 + (i % 2) * 18, 58, { seed: 700 + i, phase: i, wave: i === 3 });
  // foreground: a family watching from the grass, and tufts swaying in the breeze
  for (let i = 0; i < 26; i++) {
    const x = (i * 97) % 1100, y = 1640 + (i * 53) % 260, sw = Math.sin(t * 2 + i) * 4;
    L(ctx, [[x, y], [x + 4 + sw, y - 26], [x + 8, y]], { stroke: C.grassDark, lw: 3, sketch: false, smooth: false });
  }
  person(ctx, 150, 1830, 170, { seed: 41, shirt: C.blue, pants: C.navyCloth, phase: 1 });
  person(ctx, 250, 1840, 150, { seed: 42, shirt: C.red, pants: C.tan, phase: 2, point: true });
  person(ctx, 330, 1835, 105, { seed: 43, shirt: C.yellow, pants: C.blueDeep, phase: 3, wave: true });
}

module.exports = { scene6, scene7, scene8, scene9, scene10, landingState };
