'use strict';
let SCENES = [], OVERLAYS = [];

// ---------- shared character presets ----------
const CUTLAR = { coat: C.madder, sleeve: C.madder, pants: '#6f6457', hat: 'slouch', beard: '#7a5238', hair: '#7a5238', suspenders: '#5a4030', seed: 40 };
const HBCMAN = { coat: C.shirt, sleeve: C.shirt, vest: '#5f6b58', pants: '#4f4a52', hat: 'flatcap', hatColor: '#6f6a5c', scarf: C.red, whiskers: '#9a6a44', hair: '#9a6a44', seed: 140 };
const USSOL = { coat: C.usBlue, sleeve: C.usBlue, pants: C.usLight, hat: 'kepi', buttons: C.gold, belt: '#2f2e3a', seed: 240 };
const USOFF = { coat: C.usBlueD, sleeve: C.usBlueD, pants: C.usLight, hat: 'hardee', buttons: C.gold, tails: true, epaulets: C.gold, hair: '#5a3e2a', mustache: '#5a3e2a', seed: 340 };
const RM = { coat: C.brRed, sleeve: C.brRed, pants: '#3d405a', hat: 'shako', belts: C.white, stripe: C.brRed, seed: 440 };
const RNOFF = { coat: C.navyCoat, sleeve: C.navyCoat, pants: C.navyCoat, hat: 'naval', buttons: C.gold, epaulets: C.gold, tails: true, whiskers: '#8a8580', hair: '#8a8580', seed: 540 };
const DIPUS = { coat: '#3a3946', sleeve: '#3a3946', pants: '#4a4956', lapels: '#55545f', cravat: C.white, mustache: '#7a6a5a', hair: '#7a6a5a', seed: 640 };
const DIPGB = { coat: '#3b4058', sleeve: '#3b4058', pants: '#4a4956', lapels: '#55596f', cravat: C.white, whiskers: '#bfb6aa', hair: '#bfb6aa', seed: 740 };
const P = (base, o) => Object.assign({}, base, o);

// soldier with shouldered musket
function usSoldier(x, y, s, o = {}) {
  return person(P(USSOL, Object.assign({ x, y, s, look: o.look ?? 0, armR: [0.15, -0.35], armL: [0.12, 0.1], brows: o.brows, mouth: o.mouth,
    holdBehind: h => rifle([h.R[0] - 2, h.R[1] + 10], [h.R[0] + 14, h.R[1] - 230], 760 + (o.seed || 0)) }, o)));
}
function marine(x, y, s, o = {}) {
  return person(P(RM, Object.assign({ x, y, s, look: o.look ?? 0, armR: [0.15, -0.35], armL: [0.12, 0.1],
    holdBehind: h => rifle([h.R[0] - 2, h.R[1] + 10], [h.R[0] + 14, h.R[1] - 230], 860 + (o.seed || 0)) }, o)));
}

// ---------- garden pieces (shared by scenes 1, 3, 9, 10) ----------
function gardenGround(y0, o = {}) {
  shape([[-400, y0], [1480, y0 - 10], [1480, 2300], [-400, 2300]], { fill: C.grass, seed: 2001, hatchColor: C.grassD, hatchAlpha: .25, j: 2 });
  const rows = o.rows || [1320, 1470, 1630, 1800];
  rows.forEach((ry, i) => shape([[-300, ry - 22], [1380, ry - 28], [1380, ry + 26], [-300, ry + 30]], { fill: C.soil, seed: 2010 + i, hatchColor: C.soilD, j: 2.5 }));
}
const PLANTS = [];
function initPlants() {
  const r = rng(77); const rows = [1320, 1470, 1630, 1800];
  rows.forEach((ry, i) => { for (let x = -120 + (i % 2) * 60; x < 1250; x += 125) PLANTS.push({ x: x + (r() - .5) * 30, y: ry + 8, s: 0.9 + i * 0.12 + r() * .15, seed: 3000 + PLANTS.length, row: i }); });
}
function gardenPlants(o = {}) {
  for (const p of PLANTS) {
    const near = o.hole && Math.abs(p.x - o.hole[0]) < o.hole[2] && Math.abs(p.y - o.hole[1]) < 90;
    if (near && o.skipNear) continue;
    plant(p.x, p.y, p.s * (o.scale || 1), p.seed, { damaged: near || (o.damagedAll && p.seed % 3 === 0), bend: near ? 0.5 : 0 });
  }
}
function skyBand(y0, y1, col = C.sky) {
  shape([[-500, y0], [1580, y0], [1580, y1], [-500, y1]], { fill: col, seed: 2100, stroke: false, hatchColor: '#c9dad6', hatchAlpha: .35, hatchGap: 14 });
}
function hill(pts, col = C.hill, sd = 2200) { shape(pts, { fill: col, seed: sd, hatchColor: shade(col, -0.18), j: 2 }); }
function seaBand(x0, x1, y0, y1, sd = 2300) {
  shape([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], { fill: C.sea, seed: sd, hatchColor: C.seaD, hatchAlpha: .3, hatchAngle: -0.2, hatchGap: 12, j: 1.5 });
}

// =====================================================================
// SCENE 1 — hook: pig in garden -> two military forces (0 – 7.3)
// =====================================================================
function s1Forces(t, grow) {
  // US soldiers on the left hill
  const n = 5 + Math.round(grow * 3);
  for (let i = 0; i < n; i++) {
    const app = sm(0.25 + i * 0.07, 0.75 + i * 0.07, t) * (i >= 5 ? sm(3.5 + (i - 5) * 0.25, 3.9 + (i - 5) * 0.25, t) : 1);
    if (app <= 0) continue;
    const s = lerp(0.3, 0.38, grow);
    usSoldier(40 + i * 62 * lerp(1, 0.92, grow) + grow * 10, 985 - Math.abs(i - 3) * 6, s, { alpha: app, seed: i * 3, look: 1 });
  }
  flag(470 - grow * 10, 990, 90 * lerp(1, 1.2, grow), 56 * lerp(1, 1.2, grow), 'us', 11, { pole: 170 * lerp(1, 1.15, grow), alpha: sm(0.5, 1.0, t) });
  // British warships on the right sea
  ship({ x: lerp(820, 790, grow), y: 1048, s: lerp(0.42, 0.52, grow), flip: true, seed: 1010, p: sm(0.3, 1.1, t), guns: 0 });
  ship({ x: lerp(1040, 1000, grow), y: 1030, s: lerp(0.34, 0.42, grow), flip: true, seed: 1020, p: sm(0.5, 1.3, t) });
  if (grow > 0) ship({ x: lerp(1250, 1120, grow), y: 1010, s: 0.3, flip: true, seed: 1030, p: sm(4.2, 5.0, t) });
}
function farmerPose(t, x, y, s, o = {}) {
  // angry -> raise rifle -> fire puff -> lower
  const raise = sm(o.rAt, o.rAt + 0.45, t) * (1 - sm(o.lowAt, o.lowAt + 0.5, t));
  const shake = Math.sin(t * 16) * 0.25 * (1 - raise) * (o.angry ? 1 : 0);
  const armR = [lerp(2.0 + shake, 1.0, raise), lerp(3.0 + shake, 3.6, raise)];
  const armL = [lerp(0.75, -1.5, raise), lerp(-1.0, -1.65, raise)];
  const recoil = (t > o.fire && t < o.fire + 0.25) ? (1 - (t - o.fire) / 0.25) * 10 : 0;
  person(P(CUTLAR, { x, y, s, look: 1, brows: 'angry', mouth: raise > 0.5 ? 'flat' : (o.angry ? 'shout' : 'frown'), armR, armL, headTilt: 0.04,
    hold: h => { if (raise > 0.05) G(0, 0, 1, () => rifle([-15 - recoil, -238], [225 - recoil, -248], 700), { alpha: clamp(raise * 2) }); } }));
  return raise;
}
function scene1(t) {
  const z = lerp(1.55, 1.0, eOut(prog(t, 0, 1.25))) * lerp(1, 1.1, sm(3.3, 6.3, t));
  const cx = lerp(470, 540, eOut(prog(t, 0, 1.25))), cy = lerp(1490, 1200, eOut(prog(t, 0, 1.25))) - sm(3.3, 6.3, t) * 60;
  cam(cx, cy, z);
  const grow = sm(3.3, 6.0, t);
  skyBand(300, 1080);
  cloud(250 + t * 6, 640, 0.9, 5); cloud(820 - t * 4, 560, 0.7, 6);
  seaBand(-500, 1600, 960, 1090);
  waves(-400, 1600, 990, 1080, { gap: 34, alpha: .4 });
  hill([[-300, 1080], [-200, 960], [80, 920], [360, 935], [600, 1000], [700, 1080]], C.hill, 2201);
  s1Forces(t, grow);
  gardenGround(1080);
  if (t < 6.45) fence(-40, 1140, 1190, { h: 115 });
  // tension connectors pig -> both forces
  const cp = sm(0.55, 1.25, t) * (1 - sm(2.0, 2.4, t));
  if (cp > 0) {
    line([[560, 1400], [420, 1180], [300, 1000]], { stroke: C.usBlueD, lw: 5, dash: [18, 14], p: cp, double: false, seed: 2401 });
    line([[600, 1400], [720, 1180], [800, 1010]], { stroke: C.brRedD, lw: 5, dash: [18, 14], p: cp, double: false, seed: 2402 });
  }
  const fireT = 2.3;
  gardenPlants({ hole: [480, 1630, 120], damagedAll: false });
  // pig (rooting until shot)
  if (t < fireT + 0.06) pig({ x: 600, y: 1600, s: 1.45, flip: true, rooting: true, root: t * 7, seed: 510 });
  const raise = farmerPose(t, 190, 1890, 1.75, { rAt: 1.35, fire: fireT, lowAt: 2.9, angry: true });
  // shot: muzzle puff + dust poof hides pig (no impact detail)
  puff(190 + 225 * 1.75, 1890 - 248 * 1.75, 1.0, prog(t, fireT, fireT + 1.0), 11);
  puff(600, 1540, 1.9, prog(t, fireT + 0.04, fireT + 1.1), 12, '#e2d8c4');
  if (t > fireT + 0.3) { // empty dug patch
    shape(ell(600, 1590, 110, 22, 22), { fill: C.soilD, seed: 2450, hatch: false, alpha: sm(fireT + 0.3, fireT + 0.9, t) * 0.8 });
  }
}

// ---------- transition morph: fence <-> island coastline ----------
let ISLAND = null; // screen-space island outline in scene 2
function islandPts() {
  // San Juan Island-ish outline (portrait orientation), centered ~ (560,1240)
  const raw = [[440, 820], [520, 800], [600, 840], [640, 900], [700, 940], [760, 1010], [790, 1100], [770, 1180], [800, 1260], [790, 1350], [740, 1420], [700, 1500], [720, 1580], [680, 1650], [600, 1680], [520, 1660], [470, 1600], [400, 1560], [340, 1480], [330, 1400], [370, 1320], [350, 1240], [380, 1160], [360, 1080], [390, 1000], [400, 900]];
  return resample(raw, true, 120);
}
function fenceLoop() { return resample(fencePath(-40, 1140, 1190, 115), true, 120); }
function morphShape(from, to, u, col0, col1, sd = 2500) {
  // rotate 'to' start index so the morph is smooth
  const pts = from.map((p, i) => [lerp(p[0], to[i][0], u), lerp(p[1], to[i][1], u)]);
  shape(pts, { fill: mix(col0, col1, u), seed: sd, sub: 0, lw: 5, hatchColor: shade(mix(col0, col1, u), -0.2) });
}

// =====================================================================
// SCENE 2 — disputed San Juan Island map (6.9 – 12.6)
// =====================================================================
function scene2(t, noIsland) {
  const z = lerp(1.0, 1.05, prog(t, 7, 11.4));
  cam(560, 1230, z);
  const a = sm(6.45, 7.0, t);
  CTX.globalAlpha = a;
  shape([[-200, 330], [1300, 330], [1300, 2200], [-200, 2200]], { fill: C.seaL, seed: 2600, stroke: false, hatchColor: C.seaD, hatchAlpha: .25, hatchAngle: -0.25, hatchGap: 14 });
  waves(-100, 1250, 560, 1950, { gap: 70, alpha: .35, speed: 10 });
  // Vancouver Island (west, British) and mainland (east, American)
  shape([[-200, 500], [70, 520], [120, 700], [90, 900], [150, 1100], [110, 1350], [160, 1560], [100, 1800], [-200, 1900]], { fill: C.hill, seed: 2601, hatchColor: C.grassD });
  shape([[1300, 450], [980, 520], [940, 760], [990, 980], [930, 1200], [990, 1450], [950, 1700], [1010, 1900], [1300, 1950]], { fill: C.hill, seed: 2602, hatchColor: C.grassD });
  fir(40, 760, 0.45, 2610); fir(60, 1480, 0.4, 2611); fir(1040, 700, 0.45, 2612); fir(1050, 1600, 0.42, 2613);
  flag(40, 1120, 70, 44, 'union', 2620, { pole: 120, alpha: sm(7.6, 8.2, t) });
  flag(1010, 1130, 70, 44, 'us', 2621, { pole: 120, alpha: sm(7.8, 8.4, t) });
  CTX.globalAlpha = 1;
  // overlapping claims: US line (Haro Strait, west) / British line (Rosario Strait, east)
  const cb = sm(8.4, 9.6, t), cr = sm(9.0, 10.2, t);
  const usLine = [[250, 480], [235, 800], [270, 1100], [240, 1400], [270, 1700], [250, 2000]];
  const brLine = [[880, 480], [870, 800], [850, 1100], [880, 1400], [850, 1700], [870, 2000]];
  if (cb > 0) shape([[250, 480], [1300, 480], [1300, 2000], [250, 2000]].map((p, i) => i === 0 || i === 3 ? p : [lerp(250, p[0], cb), p[1]]), { fill: C.usBlue, fillAlpha: 0.22, stroke: false, seed: 2630, hatchColor: C.usBlueD, hatchAlpha: .5, hatchAngle: -0.8 });
  if (cr > 0) shape([[880, 480], [-200, 480], [-200, 2000], [880, 2000]].map((p, i) => i === 0 || i === 3 ? p : [lerp(880, p[0], cr), p[1]]), { fill: C.brRed, fillAlpha: 0.2, stroke: false, seed: 2631, hatchColor: C.brRedD, hatchAlpha: .5, hatchAngle: 0.8 });
  if (!noIsland) islandDraw(t);
  if (cb > 0) line(usLine, { stroke: C.usBlueD, lw: 7, dash: [22, 16], p: cb, double: false, seed: 2640, dashOff: -t * 30 });
  if (cr > 0) line(brLine, { stroke: C.brRedD, lw: 7, dash: [22, 16], p: cr, double: false, seed: 2641, dashOff: t * 30 });
}
function islandDraw(t) {
  const pulse = 1 + 0.05 * Math.sin(prog(t, 9.6, 10.6) * Math.PI);
  G(560, 1240, pulse, () => {
    CTX.translate(-560, -1240);
    shape(ISLAND, { fill: C.grass, seed: 2500, sub: 0, lw: 5, hatchColor: C.grassD });
    const d = sm(7.4, 8.4, t);
    fir(520, 980, 0.38 * d, 2650); fir(600, 1030, 0.32 * d, 2651); fir(690, 1300, 0.34 * d, 2652); fir(430, 1250, 0.3 * d, 2653); fir(560, 1480, 0.3 * d, 2654);
    // American settlement (west/left side) and HBC farm (east/right side)
    cabin(420, 1430, 0.42 * d, 2660); flag(470, 1440, 46, 28, 'us', 2661, { pole: 95, alpha: d });
    cabin(680, 1150, 0.4 * d, 2662, { col: '#c7a072' }); cabin(620, 1180, 0.3 * d, 2663, { col: '#c7a072' }); flag(730, 1160, 46, 28, 'red', 2664, { pole: 95, alpha: d });
    sheep(620, 1260, 0.35 * d, 2665); sheep(660, 1275, 0.32 * d, 2666, true);
  });
}

// =====================================================================
// SCENE 3 — Lyman Cutlar, the garden, the shot (11.9 – 18.1)
// =====================================================================
function scene3(t) {
  // camera path: farmer -> pig -> farmer raising -> fence & birds
  const keys = [[11.9, 540, 1200, 1.0], [12.6, 540, 1200, 1.0], [14.2, 360, 1430, 1.2], [14.8, 360, 1430, 1.2], [15.7, 760, 1520, 1.25], [16.0, 760, 1520, 1.25], [16.4, 470, 1420, 1.05], [16.6, 470, 1420, 1.05], [16.95, 900, 1150, 1.45], [18.2, 930, 1100, 1.5]];
  let k = 0; while (k < keys.length - 2 && t > keys[k + 1][0]) k++;
  const a = keys[k], b = keys[k + 1], u = ease(prog(t, a[0], b[0]));
  const shotT = 16.85;
  SHAKE = shakeAt(t, [[shotT, 0.3, 9]]);
  cam(lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u));
  skyBand(300, 1100);
  cloud(300 + t * 5, 640, 0.8, 7); cloud(900 - t * 3, 720, 0.6, 8);
  hill([[-300, 1100], [-100, 900], [200, 870], [520, 940], [800, 900], [1100, 950], [1400, 1100]], C.hill, 2700);
  fir(80, 1000, 0.7, 2710); fir(170, 1020, 0.55, 2711); fir(980, 990, 0.65, 2712); fir(1080, 1010, 0.5, 2713);
  cabin(120, 1090, 0.75, 2720, { chimney: true });
  gardenGround(1090);
  if (t > 12.38) fence(-40, 1140, 1190, { h: 115 });
  // birds on fence, fly away after the shot
  for (let i = 0; i < 4; i++) {
    const bx = 850 + i * 55, by = 1190 - 115 * 0.75 - 4;
    const fu = prog(t, shotT + 0.05 + i * 0.06, shotT + 1.4 + i * 0.06);
    if (fu <= 0) bird(bx, by, 0.9, 0, 2730 + i, true);
    else bird(bx + fu * (200 + i * 60), by - eOut(fu) * (420 + i * 40) + Math.sin(fu * 9) * 8, 1.0, t * 22 + i, 2730 + i);
  }
  // garden with damaged plants around the pig
  for (const p of PLANTS) {
    const near = Math.abs(p.x - 760) < 260 && p.row >= 1 && p.row <= 2;
    plant(p.x, p.y, p.s, p.seed, { damaged: near, bend: near ? (p.seed % 2 ? 0.6 : -0.5) : 0 });
  }
  // dug holes and scattered potatoes
  [[690, 1560], [850, 1640], [760, 1700]].forEach(([x, y], i) => shape(ell(x, y, 45, 14, 16), { fill: C.soilD, seed: 2740 + i, hatch: false, lw: 3 }));
  [[640, 1600], [905, 1590], [700, 1720], [820, 1730]].forEach(([x, y], i) => shape(ell(x, y, 15, 11, 12, i), { fill: C.potato, seed: 2750 + i, lw: 3, hatch: false }));
  if (t < shotT + 0.1) pig({ x: 780, y: 1660, s: 1.3, flip: false, rooting: true, root: t * 7, seed: 520 });
  // Cutlar
  const raise = sm(15.95, 16.4, t);
  const frust = 1 - raise;
  const hs = Math.sin(t * 5) * 0.1;
  const armR = [lerp(2.3 + hs, 1.0, raise), lerp(3.9, 3.6, raise)];
  const armL = [lerp(2.3 - hs, -1.5, raise), lerp(3.9, -1.65, raise)];
  person(P(CUTLAR, { x: 300, y: 1900, s: 1.9, look: t > 14.6 ? 1 : 0.3, brows: t < 14.3 ? 'worried' : 'angry', mouth: t < 14.3 ? 'frown' : 'flat', armR, armL,
    hold: h => { if (raise > 0.05) rifle([-15, -238], [225, -248], 701); } }));
  puff(300 + 225 * 1.9, 1900 - 248 * 1.9, 1.2, prog(t, shotT, shotT + 1.2), 21);
  puff(820, 1150, 1.0, prog(t, shotT + 0.1, shotT + 1.3), 22);
}

// =====================================================================
// SCENE 4/5 — ledger, HBC farm argument, escalation (17.6 – 26.6)
// =====================================================================
function farmWorld(t) {
  skyBand(300, 1120);
  cloud(200 + t * 5, 650, 0.8, 9); cloud(860 - t * 4, 600, 0.7, 10);
  hill([[-400, 1120], [-200, 940], [200, 900], [600, 960], [1000, 900], [1500, 1120]], C.hill, 2800);
  fir(-60, 1030, 0.7, 2810); fir(1100, 1020, 0.7, 2811); fir(1180, 1050, 0.55, 2812);
  // HBC farm buildings + red ensign + sheep
  cabin(760, 1120, 0.85, 2820, { col: '#c7a072', chimney: true }); cabin(1000, 1110, 0.6, 2821, { col: '#c7a072' });
  flag(600, 1130, 120, 72, 'red', 2822, { pole: 260 });
  shape([[-400, 1120], [1500, 1110], [1500, 2300], [-400, 2300]], { fill: C.grass, seed: 2830, hatchColor: C.grassD, hatchAlpha: .25, j: 2 });
  fence(450, 1300, 1230, { h: 95, gap: 110 });
  sheep(880, 1300, 0.8, 2840); sheep(1020, 1320, 0.7, 2841, true); sheep(760, 1330, 0.65, 2842);
  // Cutlar's damaged garden on the left
  for (let i = 0; i < 4; i++) plant(-60 + i * 90, 1350 + (i % 2) * 30, 1.0, 2850 + i, { damaged: true, bend: i % 2 ? .5 : -.4 });
}
function scene45(t) {
  // camera: start close on argument, zoom out as dispute grows, then whip-pan left (scene 5 shore)
  const zo = sm(22.0, 25.5, t);
  const z = lerp(1.0, 0.78, zo), cy = lerp(1300, 1340, zo);
  cam(540, cy, z);
  SHAKE = [0, 0];
  farmWorld(t);
  const argue = t > 19.6;
  const g1 = Math.sin(t * 6), g2 = Math.sin(t * 6 + Math.PI);
  const ap = sm(19.0, 19.8, t);
  // extra settlers / HBC men join (escalation)
  const j1 = sm(22.4, 23.2, t), j2 = sm(22.9, 23.7, t);
  if (j1 > 0) { person(P(CUTLAR, { x: lerp(-260, -60, j1), y: 1830, s: 1.4, coat: '#8a9a6a', sleeve: '#8a9a6a', hat: 'slouch', hatColor: '#5a5048', beard: null, mustache: '#4a3a2a', seed: 60, look: 1, brows: 'angry', mouth: 'shout', armR: [2.4 + g1 * .2, 2.8], armL: [0.3, 0.2], walk: t * 8, walkAmp: 1 - j1 })); }
  if (j2 > 0) { person(P(CUTLAR, { x: lerp(-300, 60, j2), y: 1900, s: 1.3, coat: '#a38c6a', sleeve: '#a38c6a', hat: 'slouch', hatColor: '#3f3a40', beard: '#3f3a40', seed: 70, look: 1, brows: 'angry', mouth: 'frown', armR: [0.6, -0.8], armL: [0.6, -0.8], walk: t * 8, walkAmp: 1 - j2 })); }
  if (j1 > 0) person(P(HBCMAN, { x: lerp(1360, 1110, j1), y: 1830, s: 1.4, coat: '#d9cfb5', vest: '#6a5a48', hatColor: '#4a5058', scarf: '#5a6a8a', whiskers: '#5a4030', hair: '#5a4030', seed: 160, look: -1, brows: 'angry', mouth: 'shout', armL: [2.4 + g2 * .2, 2.8], armR: [0.3, 0.2], walk: t * 8, walkAmp: 1 - j1 }));
  if (j2 > 0) person(P(HBCMAN, { x: lerp(1400, 1010, j2), y: 1900, s: 1.3, coat: C.shirt, vest: '#4f5a4a', hat: 'slouch', hatColor: '#6a5a48', scarf: C.red, seed: 170, look: -1, brows: 'angry', mouth: 'frown', armL: [0.6, -0.8], armR: [0.6, -0.8], walk: t * 8, walkAmp: 1 - j2 }));
  // Cutlar (left) points toward his garden / argues
  person(P(CUTLAR, { x: 260, y: 1880, s: 1.75, look: 1, brows: 'angry', mouth: argue && g1 > 0 ? 'shout' : 'frown',
    armR: argue ? [1.6 + g1 * 0.35, 1.9 + g1 * 0.3] : [0.3, 0.2], armL: argue ? [1.3, 1.4] : [0.75, -1.0] }));
  // HBC worker (right) holds the ledger, points at it
  const ledgerHeld = t > 19.75;
  person(P(HBCMAN, { x: 820, y: 1880, s: 1.75, look: -1, brows: 'angry', mouth: argue && g2 > 0 ? 'shout' : 'frown',
    armL: argue ? [1.5 + g2 * 0.3, 2.0 + g2 * 0.3] : [0.4, 0.2], armR: [-0.35, -1.5],
    hold: h => { if (ledgerHeld) { ledgerSmall(h.R[0] - 30, h.R[1] - 20, 0.24, -0.2); } } }));
  // scribble cloud of the dispute grows
  const sc = sm(23.0, 25.6, t);
  if (sc > 0) scribbleCloud(540, 1080 - sc * 60, lerp(0.6, 1.6, sc), sc, 2900);
  // boundary claim dashes on the ground between them
  const bl = sm(22.3, 23.3, t);
  if (bl > 0) { line([[540, 1260], [520, 1500], [560, 1750], [530, 1980]], { stroke: C.usBlueD, lw: 7, dash: [22, 16], p: bl, double: false, seed: 2910 }); line([[560, 1260], [585, 1500], [520, 1750], [575, 1980]], { stroke: C.brRedD, lw: 7, dash: [22, 16], p: bl, double: false, seed: 2911 }); }
  // military messenger runs off to the left with a letter
  const mm = prog(t, 24.3, 25.9);
  if (mm > 0 && mm < 1) {
    usSoldier(lerp(300, -500, eIn(mm) * 0.4 + mm * 0.6), 1700, 1.15, { walk: t * 14, walkAmp: 1, look: -1, mouth: 'flat', brows: 'normal', seed: 31, armR: [0.15, -0.35], armL: [1.9, 2.3],
      hold: h => shape(rect(h.L[0] - 34, h.L[1] - 30, 46, 30), { fill: C.cream, seed: 2920, lw: 3, hatch: false }) });
  }
}
function ledgerSmall(x, y, s, rot) {
  ledger({ x, y, s, rot });
  G(x, y, s, () => { pigStamp(170, 40, 0.9, 1); }, { rot });
}
function pigStamp(x, y, s, a) {
  G(x, y, s, () => {
    shape(ell(0, 0, 110, 110, 34), { fill: null, stroke: C.brRedD, lw: 7, seed: 2950, double: false, alpha: a });
    shape(ell(0, 0, 92, 92, 30), { fill: null, stroke: C.brRedD, lw: 3, seed: 2951, double: false, alpha: a, dash: [6, 8] });
    CTX.save(); CTX.globalAlpha *= a; CTX.translate(-40, 42); CTX.scale(0.62, 0.62);
    shape(PIG_SIL, { fill: C.brRedD, stroke: C.brRedD, seed: 2952, hatch: false, lw: 3 });
    CTX.restore();
  });
}
// ledger close-up stage (17.6 – 20.2)
function scene4ledger(t) {
  cam(540, 1200, 1);
  const shrink = sm(19.05, 19.85, t);
  // ledger flies from center into worker's hand position (in the farm scene's screen coords)
  const lx = lerp(540, 668, shrink), ly = lerp(1220, 1472, shrink);
  const ls = lerp(1.15, 0.24 * 1.75, shrink), rot = lerp(-0.04, -0.2, shrink);
  ledger({ x: lx, y: ly, s: ls, rot });
  const st = sm(18.45, 18.6, t);
  if (st > 0) G(lx, ly, ls, () => pigStamp(170, 40, lerp(1.4, 0.9, eOut(prog(t, 18.45, 18.65))), st), { rot });
}

// =====================================================================
// SCENE 5b/6 — shore: boat lands, soldiers; British warships appear (25.9 – 34.2)
// =====================================================================
function shoreWorld(t) {
  skyBand(300, 1060);
  cloud(300 + t * 4, 640, 0.8, 11); cloud(820 - t * 3, 560, 0.6, 12);
  shape([[-1000, 820], [-400, 880], [200, 840], [700, 900], [1600, 860], [1600, 1060], [-1000, 1060]], { fill: C.mountain, seed: 3100, stroke: '#8e9cab', lw: 3, hatchColor: '#a3b2bc', alpha: 0.7 });
  seaBand(-1200, 1800, 1000, 2300, 3101);
  waves(-1200, 1800, 1030, 2100, { gap: 44, alpha: .45, speed: 16 });
}
function scene5shore(t) {
  // world: sea everywhere, beach in lower right
  const sixZ = sm(29.3, 30.4, t);
  const z = lerp(1.0, 0.82, sixZ), cx = lerp(540, 470, sixZ), cy = lerp(1300, 1230, sixZ);
  cam(cx, cy, z);
  shoreWorld(t);
  // ships appear one after another
  const sh = [[29.7, 230, 1190, 0.9, 1101], [30.85, 800, 1110, 0.72, 1102], [31.95, 470, 1040, 0.55, 1103]];
  sh.slice().reverse().forEach(([t0, x, y, s, sd]) => {
    const u = prog(t, t0, t0 + 0.9); if (u <= 0) return;
    ship({ x: x - (1 - eOut(u)) * 300, y, s: s, flip: false, seed: sd, p: clamp(u * 1.4), guns: 0 });
  });
  // beach
  shape([[1600, 1380], [1000, 1420], [640, 1560], [380, 1700], [200, 1900], [180, 2300], [1600, 2300]], { fill: '#e2cf9e', seed: 3110, hatchColor: '#c7b07c' });
  shape([[1600, 1330], [1150, 1350], [900, 1420], [1600, 1440]], { fill: C.grass, seed: 3111, hatchColor: C.grassD });
  fir(1180, 1360, 0.8, 3120); fir(1300, 1350, 0.9, 3121);
  // rowboat approaches and lands
  const bu = eOut(prog(t, 25.9, 27.4));
  if (t < 28.6) rowboat(lerp(-300, 470, bu), lerp(1430, 1640, bu), 1.05, { seed: 1500, n: t < 27.5 ? 5 : Math.max(0, 5 - Math.floor((t - 27.5) / 0.22)), flag: true });
  else rowboat(470, 1640, 1.05, { seed: 1500, n: 0 });
  // soldiers step out and form a line, then look out to sea
  const look = sm(29.4, 29.9, t);
  for (let i = 0; i < 6; i++) {
    const app = sm(27.5 + i * 0.2, 27.9 + i * 0.2, t); if (app <= 0) continue;
    const x = lerp(520, 700 + i * 95, app), y = lerp(1640, 1820 - (i % 2) * 70, app);
    const wow = t > 31.0 && i % 2 === 0;
    usSoldier(x, y, 0.9, { seed: i * 5, look: lerp(1, -1, look), brows: t > 30.2 ? (wow ? 'surprise' : 'worried') : 'normal', mouth: t > 30.4 ? (wow ? 'o' : 'flat') : 'flat', walk: t * 10, walkAmp: 1 - app });
  }
  if (t > 28.0) flag(1180, 1700, 110, 68, 'us', 3130, { pole: 280, alpha: sm(28.0, 28.4, t) });
}

// =====================================================================
// SCENE 7 — wide standoff (33.6 – 43.4)
// =====================================================================
function scene7(t) {
  const z = lerp(1.0, 1.06, prog(t, 34, 42.4)) * lerp(1, 1.12, sm(39.6, 42.4, t));
  cam(540, lerp(1240, 1300, sm(39.6, 42.4, t)), z);
  skyBand(300, 1000);
  cloud(200 + t * 3, 620, 0.7, 13); cloud(860 - t * 2, 680, 0.6, 14);
  shape([[-300, 860], [100, 800], [400, 850], [800, 790], [1400, 860], [1400, 1000], [-300, 1000]], { fill: C.mountain, seed: 3200, stroke: '#8e9cab', lw: 3, hatchColor: '#a3b2bc', alpha: 0.7 });
  seaBand(-400, 1500, 950, 2300, 3201);
  waves(-400, 1500, 980, 2100, { gap: 52, alpha: .4, speed: 12 });
  ship({ x: 900, y: 1010, s: 0.42, flip: true, seed: 1201, guns: sm(35.8, 36.6, t) });
  ship({ x: 130, y: 1000, s: 0.36, flip: false, seed: 1202, guns: sm(35.9, 36.7, t) });
  // the island in the middle
  shape([[90, 1330], [180, 1180], [330, 1090], [520, 1040], [700, 1080], [860, 1180], [960, 1330]], { fill: C.grass, seed: 3210, hatchColor: C.grassD });
  shape([[70, 1340], [990, 1340], [960, 1370], [100, 1370]], { fill: '#e2cf9e', seed: 3211, hatch: false });
  fir(250, 1180, 0.45, 3220); fir(820, 1190, 0.45, 3221); fir(760, 1150, 0.38, 3222); fir(310, 1150, 0.35, 3223);
  tent(380, 1150, 0.55, 3230); tent(470, 1120, 0.5, 3231); tent(640, 1125, 0.5, 3232);
  flag(560, 1060, 80, 50, 'us', 3240, { pole: 150 });
  // troops multiply ("hundreds")
  const many = sm(34.2, 36.2, t);
  const N = Math.round(lerp(6, 22, many));
  for (let i = 0; i < N; i++) { const row = i % 2, x = 230 + (i >> 1) * 55 + row * 26, y = 1265 + row * 45 - Math.abs(x - 530) * 0.08; usSoldier(x, y, 0.36 + row * 0.04, { seed: i, look: x < 530 ? -1 : 1, alpha: i < 6 ? 1 : sm(34.2 + i * 0.08, 34.6 + i * 0.08, t) }); }
  cannon(250, 1305, 0.42, { flip: true, seed: 1210 }); cannon(810, 1305, 0.42, { seed: 1211 });
  // British warships in the foreground water, guns run out
  const g = sm(35.8, 36.6, t);
  ship({ x: 160, y: 1640, s: 0.95, flip: false, seed: 1203, guns: g, ensign: 'white',
    crew: () => { for (let k = 0; k < 5; k++) marine(-120 + k * 50, -84, 0.3, { seed: 50 + k, look: 1 }); } });
  ship({ x: 900, y: 1560, s: 0.85, flip: true, seed: 1204, guns: g, ensign: 'white',
    crew: () => { for (let k = 0; k < 5; k++) marine(-120 + k * 50, -84, 0.3, { seed: 60 + k, look: 1 }); } });
  // marines' longboat holding position
  G(560, 1830, 1, () => {
    for (let i = 0; i < 5; i++) { const sx = -100 + i * 52; shape([[sx - 20, -30], [sx - 18, -78], [sx + 18, -78], [sx + 20, -30]], { fill: C.brRed, seed: 3250 + i * 3, lw: 3 }); shape(ell(sx, -96, 16, 17, 16), { fill: C.skin, seed: 3251 + i * 3, lw: 3, hatch: false }); shape([[sx - 14, -104], [sx - 13, -134], [sx + 13, -134], [sx + 14, -104]], { fill: '#33334a', seed: 3252 + i * 3, lw: 2.5, hatch: false }); dot(sx, -96, 2.4); }
    shape([[-190, -52], [-150, -20], [-100, 0], [100, 0], [160, -18], [200, -56], [140, -38], [-140, -36]], { fill: C.wood, seed: 3270, hatchColor: C.woodD });
  }, { rot: Math.sin(t * 2) * 0.03 });
  // two commanders look toward each other through scopes
  const cm = sm(39.7, 40.5, t);
  if (cm > 0) {
    person(P(USOFF, { x: lerp(-260, 150, cm), y: 2050, s: 1.6, look: 1, brows: 'angry', mouth: 'flat', armR: [1.75, 1.6], armL: [-0.4, -1.5],
      hold: h => tube([[h.R[0] - 60, -276], [h.R[0] + 60, -262]], 16, C.gold, { seed: 3280 }) }));
    person(P(RNOFF, { x: lerp(1340, 930, cm), y: 2050, s: 1.6, flip: true, look: 1, brows: 'angry', mouth: 'flat', armR: [1.75, 1.6], armL: [-0.4, -1.5],
      hold: h => tube([[h.R[0] - 60, -276], [h.R[0] + 60, -262]], 16, C.gold, { seed: 3281 }) }));
  }
}

// =====================================================================
// SCENE 8 — nobody fires; cannon barrel -> pen; diplomacy (42.9 – 48.9)
// =====================================================================
function scene8a(t) {
  // strip: cannon crew | soldier | naval officer ; camera pans across, pause, weapons lower
  const pan = ease(prog(t, 43.0, 44.4));
  const back = ease(prog(t, 45.3, 45.85));
  const cx = lerp(lerp(330, 1450, pan), 330, back), z = lerp(1.25, lerp(1.25, 1.6, back), 1);
  cam(cx, 1500, z);
  shape([[-800, 300], [2600, 300], [2600, 1260], [-800, 1260]], { fill: C.sky, seed: 2100, stroke: false, hatchColor: '#c9dad6', hatchAlpha: .35, hatchGap: 14 });
  seaBand(-800, 2600, 1180, 2400, 3301);
  waves(-800, 2600, 1210, 2300, { gap: 50, alpha: .4 });
  ship({ x: 300, y: 1250, s: 0.3, flip: true, seed: 1330 });
  shape([[-800, 1330], [700, 1320], [1000, 1400], [1150, 2400], [-800, 2400]], { fill: C.grass, seed: 3300, hatchColor: C.grassD });
  const low = sm(44.95, 45.4, t);
  // cannon crew ready
  cannon(330, 1700, 1.25, { seed: 1220, elev: lerp(0.12, -0.12, low), alpha: 1 - sm(45.9, 46.3, t) });
  person(P(USSOL, { x: 120, y: 1760, s: 0.95, look: 1, brows: t > 44.5 && t < 45.4 ? 'worried' : 'angry', mouth: 'flat', armR: [0.9, 0.2], armL: [0.3, 0.1], seed: 260, alpha: 1 - back,
    holdBehind: h => tube([[h.R[0], h.R[1] + 40], [h.R[0] + 10, h.R[1] - 180]], 9, C.woodD, { seed: 3310 }) }));
  person(P(USSOL, { x: 560, y: 1780, s: 0.95, look: -1, brows: 'angry', mouth: 'flat', armR: [0.3, 0.1], armL: [0.6, -0.4], seed: 270, alpha: 1 - back }));
  // soldier waiting with musket at the ready (not aimed)
  const sx = 860;
  person(P(USSOL, { x: sx, y: 1800, s: 1.15, look: 1, lookY: 0, brows: 'angry', mouth: 'flat', seed: 280,
    armR: [lerp(0.9, 0.15, low), lerp(1.9, -0.35, low)], armL: [lerp(-0.4, 0.12, low), lerp(-1.2, 0.1, low)],
    holdBehind: h => rifle([h.R[0] - 10, h.R[1] + 30], [lerp(h.R[0] + 120, h.R[0] + 14, low), lerp(h.R[1] - 190, h.R[1] - 230, low)], 790) }));
  // naval officer on a warship's deck, watching
  ship({ x: 1560, y: 1960, s: 1.7, flip: true, seed: 1340, guns: 1, smoke: false, sails: false, funnel: false,
    crew: () => person(P(RNOFF, { x: 30, y: -82, s: 0.68, look: 1, brows: 'angry', mouth: 'flat', seed: 545,
      armR: [lerp(1.75, 0.3, low), lerp(1.6, 0.6, low)], armL: [lerp(-0.4, 0.2, low), lerp(-1.5, 0.1, low)],
      hold: h => tube([[h.R[0] - 60, lerp(-276, h.R[1], low)], [h.R[0] + 60, lerp(-262, h.R[1] + 40, low)]], 16, C.gold, { seed: 3330 }) })) });
  // seagull crossing during the pause
  const gu = prog(t, 44.3, 45.3); if (gu > 0 && gu < 1) bird(lerp(1700, 1000, gu), 1180 + Math.sin(gu * 6) * 10, 1.2, t * 14, 3340);
}
const PEN_SCREEN = { x: 600, y: 1500, s: 1.5, rot: -0.55 };
function scene8table(t) {
  cam(540, 1200, 1);
  // diplomats' room: warm wall, table, documents
  shape([[-100, 300], [1180, 300], [1180, 1500], [-100, 1500]], { fill: '#e7dcc4', seed: 3400, stroke: false, hatchColor: '#d4c4a4', hatchAlpha: .3 });
  shape(rect(380, 640, 320, 380), { fill: '#c7d7d7', seed: 3401, lw: 5, hatchColor: '#a9c0c0' }); line([[540, 640], [540, 1020]], { lw: 5, seed: 3402 }); line([[380, 830], [700, 830]], { lw: 5, seed: 3403 });
  ship({ x: 520, y: 960, s: 0.18, flip: true, seed: 1301, smoke: false });
  flag(150, 1300, 120, 72, 'us', 3404, { pole: 520, amp: 2, speed: 2 });
  flag(930, 1300, 120, 72, 'union', 3405, { pole: 520, amp: 2, speed: 2 });
  const sh = sm(47.7, 48.3, t);
  person(P(DIPUS, { x: 270, y: 1900, s: 1.7, look: 1, brows: 'normal', mouth: sh > 0.5 ? 'smile' : 'flat', armR: [lerp(0.5, 1.45, sh), lerp(0.3, 1.75, sh)], armL: [0.3, 0.1] }));
  person(P(DIPGB, { x: 810, y: 1900, s: 1.7, look: -1, brows: 'normal', mouth: sh > 0.5 ? 'smile' : 'flat', armL: [lerp(0.5, 1.45, sh), lerp(0.3, 1.75, sh)], armR: [0.3, 0.1] }));
  shape([[-60, 1540], [1140, 1540], [1180, 1700], [-100, 1700]], { fill: C.table, seed: 3410, hatchColor: '#7a5a3e' });
  shape(rect(-100, 1700, 1280, 300), { fill: '#8a6646', seed: 3411, hatchColor: '#6a4c34' });
  // documents
  shape([[330, 1555], [760, 1550], [790, 1690], [300, 1695]], { fill: C.parchment, seed: 3420, hatchColor: '#dccba4', hatchAlpha: .2 });
  for (let k = 0; k < 4; k++) { const r = rng(k + 9), pts = []; for (let x = 350; x < 700 - k * 30; x += 10) pts.push([x, 1580 + k * 24 + (r() - .5) * 8]); line(pts, { lw: 2.2, sub: 0, double: false, seed: 3430 + k, alpha: .6 }); }
  // signature being written
  const sg = prog(t, 46.8, 47.5);
  if (sg > 0) { const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([520 + u * 160, 1668 + Math.sin(u * 18) * 8 - u * 6]); } line(pts, { lw: 3, sub: 0, double: false, seed: 3440, p: sg }); }
  shape(ell(240, 1600, 34, 14, 16), { fill: '#3a3546', seed: 3450, lw: 3, hatch: false });
}
function penPose(t) { // pen position in screen coords during signing
  const sg = prog(t, 46.8, 47.5);
  const x = 520 + sg * 160, y = 1668 + Math.sin(sg * 18) * 8 - sg * 6;
  return { x: x - Math.cos(-0.9) * 196 * 0.9, y: y - Math.sin(-0.9) * 196 * 0.9, s: 0.9, rot: -0.9 };
}

// =====================================================================
// SCENE 9 — the only casualty (48.6 – 55.4)
// =====================================================================
function crisisTableau(t, alpha) {
  CTX.save(); CTX.globalAlpha *= alpha;
  ship({ x: 1250, y: 1150, s: 0.7, flip: true, seed: 1401, guns: 1 });
  ship({ x: -170, y: 1120, s: 0.6, flip: false, seed: 1402, guns: 1 });
  for (let i = 0; i < 4; i++) usSoldier(-260 + i * 70, 1500 + (i % 2) * 30, 0.75, { seed: 90 + i, look: 1 });
  for (let i = 0; i < 4; i++) marine(1100 + i * 70, 1500 + (i % 2) * 30, 0.75, { seed: 95 + i, look: -1 });
  cannon(-140, 1720, 0.7, { seed: 1410 }); cannon(1220, 1720, 0.7, { seed: 1411, flip: true });
  tent(-330, 1300, 0.7, 3500); tent(-180, 1290, 0.6, 3501);
  CTX.restore();
}
function scene9(t) {
  // 48.9-50.4: forces fade into background; 50.3+: garden, empty spot, memorial outline; 52.3+: zoom out to tableau
  const back = sm(49.6, 50.6, t);
  const zoomIn = sm(50.4, 51.6, t), zoomOut = sm(52.25, 53.9, t);
  const z = lerp(1.0, 2.0, zoomIn) * lerp(1, 0.42, zoomOut);
  const cx = lerp(540, 600, zoomIn), cy = lerp(1300, 1520, zoomIn) * (1 - zoomOut) + 1350 * zoomOut;
  cam(cx, cy, z);
  // garden world (same as scene 1)
  skyBand(300, 1080);
  cloud(250 + t * 6, 640, 0.9, 5); cloud(820 - t * 4, 560, 0.7, 6);
  seaBand(-500, 1600, 960, 1090);
  waves(-400, 1600, 990, 1080, { gap: 34, alpha: .4 });
  hill([[-300, 1080], [-200, 960], [80, 920], [360, 935], [600, 1000], [700, 1080]], C.hill, 2201);
  gardenGround(1080);
  fence(-40, 1140, 1190, { h: 115 });
  gardenPlants({ hole: [480, 1630, 120] });
  shape(ell(600, 1590, 110, 22, 22), { fill: C.soilD, seed: 2450, hatch: false, alpha: 0.8 });
  const op = prog(t, 50.9, 51.8);
  if (op > 0) {
    pig({ x: 600, y: 1600, s: 1.45, flip: true, mode: 'outline', p: op, seed: 530 });
    const fl = sm(51.6, 52.0, t);
    if (fl > 0) G(470, 1600, fl, () => { line([[0, 0], [0, -50]], { lw: 4, stroke: C.leafD, double: false, seed: 3510 }); shape(ell(-10, -30, 10, 5, 10, 0.5), { fill: C.leaf, seed: 3511, lw: 2.5, hatch: false }); for (let k = 0; k < 5; k++) shape(ell(Math.cos(k * 1.256) * 9, -56 + Math.sin(k * 1.256) * 9, 7, 7, 10), { fill: C.flowerW, seed: 3512 + k, lw: 2.2, hatch: false }); dot(0, -56, 5, C.gold); });
  }
  // the whole crisis tableau around the empty spot (ghosted) on zoom out
  if (zoomOut > 0) {
    CTX.save(); CTX.globalAlpha *= 0.6 * zoomOut;
    s1Forces(10, 1);
    for (let i = 0; i < 3; i++) marine(940 + i * 90, 1330 + i * 8, 0.62, { seed: 130 + i, look: -1 });
    cannon(60, 1780, 0.75, { seed: 1510 }); cannon(1010, 1780, 0.75, { seed: 1511, flip: true });
    usSoldier(-90, 1960, 0.8, { seed: 120, look: 1 }); usSoldier(10, 2010, 0.8, { seed: 121, look: 1 });
    marine(1080, 1980, 0.8, { seed: 131, look: -1 }); marine(1170, 2020, 0.8, { seed: 132, look: -1 });
    CTX.restore();
  }
}
function scene9front(t) { // forces in front, fading into background
  cam(540, 1300, lerp(1, 0.9, sm(48.6, 50.6, t)));
  const a = 1 - sm(49.6, 50.6, t);
  skyBand(300, 1050);
  seaBand(-400, 1500, 980, 1300, 3600);
  waves(-400, 1500, 1010, 1290, { gap: 44, alpha: .4 });
  ship({ x: 780, y: 1150, s: 0.75, flip: true, seed: 1601, guns: 0.2 });
  ship({ x: 260, y: 1110, s: 0.55, flip: false, seed: 1602, guns: 0.2 });
  shape([[-400, 1300], [1500, 1290], [1500, 2300], [-400, 2300]], { fill: C.grass, seed: 3610, hatchColor: C.grassD });
  for (let i = 0; i < 4; i++) usSoldier(80 + i * 105, 1700 + (i % 2) * 60, 1.0, { seed: 150 + i, look: 1, alpha: a });
  for (let i = 0; i < 4; i++) marine(640 + i * 105, 1700 + (i % 2) * 60, 1.0, { seed: 160 + i, look: -1, alpha: a });
}

// =====================================================================
// SCENE 10 — permanent ending (54.6 – end)
// =====================================================================
function scene10(t) {
  cam(540, 1220, lerp(1.04, 1.0, sm(54.6, 57.5, t)));
  skyBand(300, 1120);
  cloud(230 + t * 4, 640, 0.85, 15); cloud(840 - t * 3, 720, 0.6, 16); cloud(560 + t * 2, 560, 0.45, 17);
  shape([[-300, 960], [100, 900], [450, 940], [800, 880], [1400, 950], [1400, 1100], [-300, 1100]], { fill: C.mountain, seed: 3700, stroke: '#8e9cab', lw: 3, hatchColor: '#a3b2bc', alpha: 0.7 });
  seaBand(-400, 1500, 1050, 1340, 3701);
  waves(-400, 1500, 1080, 1330, { gap: 50, alpha: .32, speed: 7 });
  ship({ x: 860, y: 1230, s: 0.62, flip: true, seed: 1701, guns: 0, ensign: 'white' });
  // island landscape: left hill with American camp
  shape([[-300, 1340], [-200, 1150], [60, 1080], [300, 1110], [480, 1220], [560, 1340]], { fill: C.hill, seed: 3710, hatchColor: C.grassD });
  fir(40, 1150, 0.5, 3720); fir(110, 1130, 0.42, 3721);
  tent(200, 1210, 0.55, 3730); tent(320, 1235, 0.5, 3731);
  flag(420, 1250, 80, 50, 'us', 3740, { pole: 150, speed: 3 });
  usSoldier(260, 1290, 0.32, { seed: 170, look: 1 });
  bird(380 + Math.sin(t * 0.5) * 60, 820, 0.8, t * 10, 3750); bird(450 + Math.sin(t * 0.5) * 60, 850, 0.6, t * 10 + 1, 3751);
  // foreground garden with the memorial pig outline
  gardenGround(1340, { rows: [1460, 1600, 1760] });
  fence(-40, 1140, 1400, { h: 100 });
  for (const p of PLANTS) if (p.row > 0 && !(Math.abs(p.x - 540) < 170 && p.row === 2)) plant(p.x, p.y - 30 + (p.row - 1) * 0, p.s, p.seed);
  pig({ x: 560, y: 1700, s: 1.25, flip: true, mode: 'outline', seed: 530 });
  G(420, 1700, 1, () => { line([[0, 0], [0, -50]], { lw: 4, stroke: C.leafD, double: false, seed: 3510 }); shape(ell(-10, -30, 10, 5, 10, 0.5), { fill: C.leaf, seed: 3511, lw: 2.5, hatch: false }); for (let k = 0; k < 5; k++) shape(ell(Math.cos(k * 1.256) * 9, -56 + Math.sin(k * 1.256) * 9, 7, 7, 10), { fill: C.flowerW, seed: 3512 + k, lw: 2.2, hatch: false }); dot(0, -56, 5, C.gold); });
}

// =====================================================================
// timeline assembly
// =====================================================================
function scenesInit() {
  initPlants();
  ISLAND = islandPts();
  const FENCE = fenceLoop();
  SCENES = [
    { t0: 0, t1: 6.95, draw: scene1, comp: t => ({ alpha: 1 - sm(6.35, 6.9, t) }), shake: [[2.3, 0.32, 14]] },
    { t0: 6.4, t1: 12.4, draw: t => scene2(t, t < 7.42 || t > 11.55), comp: t => ({ alpha: 1 - sm(11.75, 12.3, t) }) },
    { t0: 11.5, t1: 18.0, draw: scene3, comp: t => ({ alpha: sm(11.55, 12.1, t) * (1 - sm(17.5, 17.95, t)) }) },
    { t0: 17.55, t1: 20.25, draw: scene4ledger, comp: t => ({ alpha: sm(17.6, 18.0, t) * (1 - sm(19.75, 20.2, t)) }) },
    { t0: 19.0, t1: 26.7, draw: scene45, comp: t => ({ alpha: sm(19.05, 19.75, t), dx: sm(25.9, 26.55, t) * 1080 }) },
    { t0: 25.9, t1: 34.2, draw: scene5shore, comp: t => ({ alpha: 1 - sm(33.5, 34.15, t), dx: -(1 - sm(25.9, 26.55, t)) * 1080, scale: lerp(1, 0.75, sm(33.4, 34.15, t)) }) },
    { t0: 33.4, t1: 43.3, draw: scene7, comp: t => ({ alpha: sm(33.45, 34.1, t) * (1 - sm(42.75, 43.25, t)), scale: lerp(1.25, 1, eOut(prog(t, 33.4, 34.3))) }) },
    { t0: 42.75, t1: 46.5, draw: scene8a, comp: t => ({ alpha: sm(42.75, 43.2, t) * (1 - sm(46.0, 46.45, t)) }) },
    { t0: 46.0, t1: 49.6, draw: scene8table, comp: t => ({ alpha: sm(46.05, 46.5, t) * (1 - sm(49.0, 49.55, t)) }) },
    { t0: 48.9, t1: 50.8, draw: scene9front, comp: t => ({ alpha: sm(48.95, 49.5, t) * (1 - sm(50.2, 50.75, t)) }) },
    { t0: 49.9, t1: 55.5, draw: scene9, comp: t => ({ alpha: sm(50.0, 50.6, t) * (1 - sm(54.75, 55.4, t)) }) },
    { t0: 54.7, t1: 99, draw: scene10, comp: t => ({ alpha: sm(54.75, 55.4, t) }) },
  ];
  OVERLAYS = [
    // fence -> island coastline
    { t0: 6.35, t1: 7.45, draw: t => { const u = ease(prog(t, 6.45, 7.4)); morphShape(FENCE, ISLAND, u, C.wood, C.grass); } },
    // island coastline -> garden fence
    { t0: 11.5, t1: 12.45, draw: t => { const u = ease(prog(t, 11.55, 12.4)); morphShape(ISLAND, FENCE, u, C.grass, C.wood); } },
    // pig silhouette appears after the shot and becomes the ownership stamp
    { t0: 17.35, t1: 18.62, draw: t => { const ap = eBack(prog(t, 17.35, 17.7)), mv = ease(prog(t, 17.95, 18.5));
        pig({ x: lerp(560, 694, mv), y: lerp(1360, 1309, mv), s: lerp(1.6, 0.64, mv) * ap, flip: false, mode: 'sil', seed: 540, silCol: mix(INK, C.brRedD, mv), alpha: 1 - sm(18.5, 18.62, t) }); } },
    // cannon barrel -> pen
    { t0: 45.85, t1: 46.9, draw: t => {
        const u = ease(prog(t, 45.9, 46.6));
        // barrel start pose in screen space (scene8a camera at end of pullback)
        const z = 1.6, b0 = { x: 540 + (330 - 330) * z, y: 1200 + (1700 - 62 * 1.25 - 1500) * z, s: 1.25 * z, rot: 0.12 };
        const p1 = penPose(46.8);
        const x = lerp(b0.x, p1.x, u), y = lerp(b0.y, p1.y, u), s = lerp(b0.s, p1.s, u), rot = lerp(b0.rot, p1.rot, u);
        const pts = BARREL.map((p, i) => [lerp(p[0], PEN[i][0], u), lerp(p[1], PEN[i][1], u)]);
        G(x, y, s, () => { shape(pts, { fill: mix(C.bronze, '#3a3546', u), seed: 1800, hatchColor: '#2a2530' }); if (u > 0.6) shape([[150, -6], [196, 0], [150, 6]], { fill: C.gold, seed: 1801, lw: 2.5, hatch: false, alpha: (u - 0.6) / 0.4 }); }, { rot });
      } },
    // pen in hand while signing
    { t0: 46.9, t1: 49.55, draw: t => { const p = penPose(t); pen(p.x, p.y, p.s, p.rot, { alpha: 1 - sm(49.0, 49.5, t) }); } },
  ];
}
