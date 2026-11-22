const L = require('./lib');
const O = require('./objects');
const fs = require('fs');
const { S, P, shape, line, plainCurve, C, NAVY, shade, mix, rng, lerp, clamp, ease, prog, W, H } = L;
const X = () => S.ctx;
const T = JSON.parse(fs.readFileSync(__dirname + '/times.json'));
const SENT = fs.readFileSync(__dirname + '/sentences.txt', 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const ST = T.map(x => x[0]);
const NARR_END = T[22][1];

function bg(top = C.skyTop, bot = C.skyPale, key) { X().drawImage(L.wash(key || (top + bot), top, bot), 0, 0); }
function paperBg() { X().drawImage(L.paper(), 0, 0); }
function cam(cx, cy, z, fx = 540, fy = 960) { const c = X(); c.translate(fx, fy); c.scale(z, z); c.translate(-cx, -cy); }

// ---------- landscape seen from altitude (precomputed) ----------
let LAND = null;
function land() {
  if (LAND) return LAND;
  const w = 2600, h = 620; const cv = L.createCanvas(w, h); const keep = { ...S };
  L.begin(cv, 0); const c = cv.getContext('2d');
  c.drawImage(L.wash('land', '#c9cfb2', '#c7b98f', w, h, 6, -20), 0, 0);
  const r = rng(77);
  for (let i = 0; i < 160; i++) { const y = Math.pow(r(), 0.8) * h, sy = 0.25 + y / h, x = r() * w; const ww = (60 + r() * 140) * sy, hh = (20 + r() * 40) * sy;
    shape(P.R(x, y, ww, hh), ['#b9c28f', '#d2c48e', '#a9bb84', '#cdb98a', '#bfc7a3'][i % 5], { size: 200, lw: 1.2, gap: 6, alpha: 0.8 }); }
  // city grid patch
  for (let i = 0; i < 520; i++) { const y = h * 0.18 + Math.pow(r(), 1.1) * h * 0.8, sy = 0.3 + y / h; const x = w * 0.28 + (r() - 0.5) * w * 0.42 * (0.6 + y / h);
    c.fillStyle = ['#a7a9b4', '#c2b7a5', '#b5a99b', '#9ea8b8', '#d9d0bd'][i % 5]; c.fillRect(x, y, (6 + r() * 12) * sy * 1.6, (4 + r() * 6) * sy * 1.6); }
  c.strokeStyle = 'rgba(90,85,100,0.35)'; c.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) { const y = h * 0.15 + i / 26 * h * 0.85; c.beginPath(); c.moveTo(w * 0.05, y); c.lineTo(w * 0.6, y + 6); c.stroke(); }
  for (let i = 0; i < 30; i++) { const x = w * 0.08 + i / 30 * w * 0.5; c.beginPath(); c.moveTo(x + (x - w * 0.3) * -0.4, 0); c.lineTo(x + (x - w * 0.3) * 0.35, h); c.stroke(); }
  // hills at far edge
  shape(`M0 70 Q300 -30 650 50 Q1000 -40 1400 40 Q1800 -50 2200 50 Q2450 0 2600 40 L2600 110 L0 110Z`, '#a9a588', { size: 900, gap: 8 });
  // haze
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(205,222,234,0.85)'); g.addColorStop(0.5, 'rgba(205,222,234,0.35)'); g.addColorStop(1, 'rgba(205,222,234,0.12)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  Object.assign(S, keep);
  return LAND = cv;
}
const CLOUDBAND = (() => { const r = rng(5), a = []; for (let i = 0; i < 22; i++) a.push([-1100 + i * 105 + r() * 40, r() * 90 - 20, 1.1 + r() * 0.7]); return a; })();

// ---------- high altitude composition ----------
// o: Z, focus [x,y] (world), at [sx,sy] screen, alt (0..1 extra height), pale, jet {x,y,s,flip}, mood, look, rem(i), drop (vertical bg offset), extra(fn)
function highSky(o = {}) {
  const c = X(); const Z = o.Z ?? 1, f = o.focus || [540, 1060], at = o.at || [540, 1060];
  const pale = o.pale || 0, alt = o.alt || 0, drop = o.drop || 0;
  bg(mix(C.skyTop, '#b7c9da', pale * 0.6), mix('#d6e4ec', '#e7edf0', pale), 'hs' + Math.round(pale * 4));
  const layer = (d, fn) => { const zl = 1 + (Z - 1) * d; c.save(); c.translate(at[0], at[1]); c.scale(zl, zl); c.translate(-f[0], -f[1]); fn(); c.restore(); };
  // ground
  layer(0.25, () => { const gy = 1500 + alt * 260 - drop; const sc = 1 - alt * 0.35; c.save(); c.translate(540, gy); c.scale(sc, sc); c.drawImage(land(), -1300, 0); c.restore(); });
  // high wisps
  layer(0.45, () => { for (const [x, y, s] of [[160, 420, 0.9], [930, 620, 0.7], [-120, 900, 1], [1250, 300, 1.1]]) O.cloud(x + Math.sin(S.t * 0.1) * 20 + (S.t * 6) % 40, y - drop * 0.6 + alt * 120, s, { alpha: 0.85 }); });
  if (o.jet && o.jetBehind !== false) layer(o.jet.d ?? 0.7, () => { const j = o.jet; if (j.trail) O.contrail(j.x + 300 * j.s, j.y - 10 * j.s, j.x + 300 * j.s + 900, j.y - 40 * j.s, j.trail); O.jet(j.x, j.y, j.s, j.flip ?? 1); });
  // cloud band below
  layer(0.6, () => { const cy = 1400 + alt * 330 - drop; for (const [x, y, s] of CLOUDBAND) O.cloud(x + Math.sin(S.t * 0.2 + x) * 10, cy + y, s * (1 - alt * 0.3)); });
  if (o.vline) layer(1, () => { const a = o.vline; c.save(); c.globalAlpha = a; c.setLineDash([14, 12]); c.strokeStyle = NAVY; c.lineWidth = 3 / Z; c.beginPath(); c.moveTo(f[0] + 230, 1080); c.lineTo(f[0] + 230, 1080 + 600 * a); c.stroke(); c.setLineDash([]); c.restore(); });
  // larry
  layer(1, () => {
    O.at(540, 1060 + Math.sin(S.t * 1.4) * 6, 0.42, Math.sin(S.t * 1.1) * 0.025, () => {
      c.save(); c.translate(0, -150); O.balloons({ R: 380, height: 700, n: o.n ?? 42, remove: o.rem, pale: pale * 0.5 }); c.restore();
      O.larrySeated({ mood: o.mood || 'calm', look: o.look || [0, 0], armsUp: o.armsUp || 0 });
    });
    if (o.wind) { c.save(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; for (let i = 0; i < 7; i++) { const x = ((S.t * 500 + i * 230) % 1400) - 200, y = 700 + i * 90; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 60, y - 14, x + 130, y); c.stroke(); } c.restore(); }
  });
  if (o.jet && o.jetBehind === false) layer(o.jet.d ?? 1, () => { const j = o.jet; O.jet(j.x, j.y, j.s, j.flip ?? 1); });
  if (o.extra) layer(1, o.extra);
}

// ---------- neighbourhood world (ascent / descent) ----------
const HOUSES = (() => { const r = rng(21), a = []; for (let x = -26000; x < 26000; x += 250 + r() * 60) { if (Math.abs(x) < 520) continue; a.push([x, r() < 0.5 ? 1 : 0.85 + r() * 0.2, (r() * 6) | 0, r() < 0.3]); } return a; })();
const HIGHCLOUDS = (() => { const r = rng(8), a = []; for (let i = 0; i < 26; i++) a.push([(r() - 0.5) * 22000, -6200 - r() * 9000, 4 + r() * 5]); return a; })();
let GRID = null;
function grid() { if (GRID) return GRID; const cv = L.createCanvas(2400, 400), c = cv.getContext('2d'); const r = rng(4);
  c.fillStyle = '#c3c79c'; c.fillRect(0, 0, 2400, 400);
  for (let i = 0; i < 2600; i++) { c.fillStyle = ['#b2a99c', '#d8cdb5', '#a9aeb9', '#cbb99a', '#e5dccb'][i % 5]; c.fillRect(r() * 2400, r() * 400, 8 + r() * 14, 6 + r() * 8); }
  c.strokeStyle = 'rgba(80,80,95,0.5)'; c.lineWidth = 2; for (let x = 0; x < 2400; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 400); c.stroke(); } for (let y = 0; y < 400; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(2400, y); c.stroke(); }
  return GRID = cv; }
// o: h (seat altitude world), k zoom, sy (screen y of seat), neighbors, mood, look, mast, plan, n, rem, poles
function hood(o) {
  const c = X(); const k = o.k, h = o.h, sy = o.sy ?? 1150;
  const skyk = clamp(h / 9000);
  bg(mix('#8fb8da', '#6f9cc8', skyk), mix('#e9e3cf', '#cddfea', clamp(h / 2000)), 'hood' + Math.round(skyk * 3) + Math.round(clamp(h / 2000) * 3));
  c.save(); c.translate(540, sy); c.scale(k, k); c.translate(0, h);
  const vw = 560 / k, top = -h - sy / k, bot = -h + (1920 - sy) / k;
  // far hills (parallax)
  c.save(); c.translate(0, 0); const hs = Math.max(1, 0.6 / k); c.scale(hs, hs); O.hills(-40, '#c9c49a', '#b3bb8f', 2600); c.restore();
  // downtown skyline
  O.skyline(5200, 0, 3.2, 3, '#9fb0c6', 20);
  O.skyline(-7000, 0, 2.6, 9, '#a9b3c2', 14);
  // ground
  shape(P.R(-vw * 1.2, 0, vw * 2.4, Math.max(400, bot + 50)), '#a9c084', { size: 2000, gap: 9, stroke: false });
  if (k < 0.55) { c.save(); c.globalAlpha = clamp((0.55 - k) / 0.35) * 0.9; const depth = Math.max(10, bot); c.drawImage(grid(), -vw * 1.3, 4, vw * 2.6, depth); c.restore(); }
  line([[-vw * 1.2, 0], [vw * 1.2, 0]], NAVY, 2.5, { plain: true });
  // street
  if (k > 0.25) { shape(P.R(-vw * 1.2, 120, vw * 2.4, 90), '#b8b3a8', { size: 900, stroke: false, gap: 10 }); }
  // houses
  for (const [x, s, v, p] of HOUSES) { if (x < -vw - 400 || x > vw + 400) continue; if (Math.abs(x) < 900 && o.yard) continue; O.house(x, 0, s, v); if (p && k > 0.15) O.palm(x + 130, 0, 0.9); }
  if (o.mast) { const mh = 5200; shape(P.poly([[1100, 0], [1140, -mh], [1160, -mh], [1200, 0]]), '#d9d2c4', { size: mh, gap: 12 }); for (let y = -400; y > -mh; y -= 400) line([[1104 + (-y / mh) * 36, y], [1196 - (-y / mh) * 36, y - 200]], C.red, 4, { plain: true }); shape(P.E(1150, -mh - 20, 22, 22), C.red, { size: 50 }); }
  if (o.yard) {
    O.house(-420, 0, 1.6, 3); O.palm(-130, 0, 1.3); O.fence(-1200, -620, 0, 80); O.fence(300, 1200, 0, 80); O.bush(380, 0, 1.1); O.car(720, 0, 1.15, '#b98b57');
  }
  if (o.neighbors) for (const nb of o.neighbors) O.at(nb.x, 0, nb.s || 0.95, 0, () => O.person(nb));
  if (o.plan) o.plan();
  // clouds above
  for (const [x, y, s] of HIGHCLOUDS) { if (y < top - 800 || y > bot + 800) continue; O.cloud(x, y, s); }
  if (o.poles) for (const p of o.poles) O.pole(p, 0, 760);
  if (o.poles) O.wires(o.poles[0], o.poles[1], -760 + 50, 40);
  // larry
  const sway = Math.sin(S.t * 1.3) * 0.02;
  O.at(0, -h, 1, sway, () => {
    c.save(); c.translate(0, -150); O.balloons({ R: 380, height: 700, n: o.n ?? 42, remove: o.rem }); c.restore();
    O.larrySeated({ mood: o.mood || 'calm', look: o.look || [0, 0] });
  });
  if (o.after) o.after(top, bot, vw);
  c.restore();
}

// ---------- scenes ----------
const B = i => ST[i] - 0.3;
const SC = [];
function add(a, b, fn, xf = 0.4) { SC.push({ a, b, fn, xf }); }

// 1 HOOK
add(0, B(2), t => {
  const z1 = t < 0.5 ? 5.2 : t < 2.2 ? lerp(5.2, 1.0, ease.io(prog(t, 0.45, 2.2))) : t < 7.2 ? lerp(1.0, 0.86, prog(t, 2.2, 7.2)) : lerp(0.86, 2.6, ease.i(prog(t, 7.2, 8.6)));
  const fy = t < 0.5 ? 1000 : t < 1.1 ? lerp(1000, 820, ease.io(prog(t, 0.45, 1.1))) : t < 2.2 ? lerp(820, 1000, ease.io(prog(t, 1.1, 2.2))) : lerp(1000, 1000, 0) - (t > 7.2 ? 60 * prog(t, 7.2, 8.6) : 0);
  const jx = lerp(1500, -700, prog(t, 1.2, 6.5));
  highSky({ Z: z1, focus: [540, fy], at: [540, t > 7.2 ? lerp(960, 1100, prog(t, 7.2, 8.6)) : 960 + (fy - 1000) * 0], jet: { x: jx, y: 620, s: 0.32, flip: 1, d: 0.55, trail: 1 }, mood: t > 5 ? 'calm' : 'calm', look: [Math.sin(t) * 0.3, 0.3], vline: clamp((t - 5.2) / 1.2) * (t > 7.4 ? 1 - prog(t, 7.4, 8) : 1) });
});
// 2 PORTRAIT
add(B(2), B(3), t => {
  paperBg();
  const z = t < 0.9 ? lerp(2.5, 2.35, t / 0.9) : lerp(2.35, 1.0, ease.io(prog(t, 0.9, 2.2)));
  const c = X(); c.save(); cam(540, lerp(1215, 1290, ease.io(prog(t, 0.9, 2.2))), z, 540, 1080);
  c.save(); c.globalAlpha = clamp((t - 0.6) / 0.8); bg('#9cc3e0', '#efe6cf', 'yardsky'); c.restore();
  c.save(); c.globalAlpha = clamp((t - 0.6) / 0.8); shape(P.R(-600, 1640, 2300, 600), '#a9c084', { size: 2000, stroke: false }); O.house(560, 1640, 2.2, 0); O.palm(170, 1640, 1.6); O.bush(900, 1640, 1.2); c.restore();
  O.at(540, 1640 + 0, 1.75, 0, () => O.person({ mood: 'calm', look: [0, 0.2], shirt: C.shirt }));
  // sketch frame around head
  c.save(); c.globalAlpha = 1 - clamp((t - 0.8) / 0.6); shape(P.R(440, 1085, 200, 250), null, { size: 300, lw: 2 }); shape(P.R(510, 1072, 60, 24), '#e8d9a8', { size: 60, alpha: 0.8, hatch: false, stroke: false }); c.restore();
  c.restore();
});
// 3 DREAM
add(B(3), B(4), t => {
  bg('#93bfe0', '#f0e4c8', 'dream');
  const c = X(); c.save(); cam(540, 1000, lerp(1.05, 1.0, t / 4), 540, 960);
  O.cloud(760, 760, 1.2);
  O.jet(lerp(1400, -500, prog(t, 0, 3.5)), 600, 0.35, 1);
  shape(P.R(-200, 1500, 1500, 600), '#a9c084', { size: 2000, stroke: false, gap: 9 });
  O.house(780, 1500, 1.5, 1); O.fence(-200, 520, 1500, 90); O.palm(1000, 1500, 1.2);
  O.at(330, 1600, 1.6, 0, () => O.person({ mood: 'happy', look: [0.6, -1], headRot: -0.18 }));
  // dream bubble from cloud
  const k = ease.o(prog(t, 1.2, 2.4));
  if (k > 0) { c.save(); c.globalAlpha = k; for (const [x, y, r] of [[420, 1140, 12], [470, 1060, 18]]) shape(P.E(x, y, r, r), '#fbf8f0', { size: 30, hatch: false });
    shape(P.E(620, 870, 230 * k, 150 * k), '#fbf8f0', { size: 300, hatch: false, lw: 2.4, sc: '#8496b8' });
    O.at(620, 900, 0.5 * k, -0.25 + Math.sin(t * 2) * 0.08, () => { O.person({ mood: 'happy', pose: 'reach' }); });
    for (let i = 0; i < 3; i++) { const bx = 520 + i * 90 + Math.sin(t * 2 + i) * 10, by = 820 + i * 20; line([[bx - 16, by], [bx - 6, by - 8], [bx, by], [bx + 6, by - 8], [bx + 16, by]], NAVY, 2.2, { plain: true }); }
    c.restore(); }
  c.restore();
});
// 4 NOT AN AIRPLANE
add(B(4), B(5), t => {
  paperBg();
  const c = X(); const k = ease.io(prog(t, 0.55, 1.15));
  c.save(); c.globalAlpha = 1 - k; c.setLineDash([16, 10]);
  O.jet(540, 1050, 1.35, 1); c.restore(); c.setLineDash([]);
  if (k > 0) { c.save(); c.globalAlpha = k; const bounce = t > 1.1 ? Math.max(0, Math.sin((t - 1.1) * 9) * Math.exp(-(t - 1.1) * 3)) * 0.06 : 0; O.at(540, 1250, 2.6 * (1 + bounce), 0, () => O.chair()); shape('M240 1500 Q540 1470 840 1500', null, { size: 300, lw: 2 }); c.restore(); }
});
// 5 42 BALLOONS
add(B(5), B(6), t => {
  paperBg();
  const c = X(); const zz = lerp(1.0, 0.82, ease.io(prog(t, 0.4, 3.8)));
  c.save(); cam(540, 1250, zz, 540, 1320);
  O.at(540, 1400, 1.5, 0, () => {
    c.save(); c.translate(0, -150);
    O.balloons({ R: 380, height: 700, appear: i => { const tt = i === 0 ? 0.5 : i < 6 ? 1.3 + i * 0.12 : 2.0 + (i - 6) * 0.055; return (t - tt) / 0.35; } });
    c.restore(); O.chair();
  });
  shape('M100 1550 Q540 1520 980 1550', null, { size: 300, lw: 2 });
  c.restore();
});
// 6 BACKYARD JULY 2
const NB = [{ x: -760, s: 0.95, shirt: '#8fb47a', mood: 'happy', look: [1, -0.5] }, { x: -900, s: 0.8, shirt: '#e6c45e', pants: '#7a6a8a', mood: 'happy', look: [1, -0.5], noMustache: true, hair: '#8a5a3a' }, { x: 560, s: 0.9, shirt: '#6fa3c9', mood: 'calm', look: [-1, -0.4], noMustache: true, hair: '#2f2a28' }];
add(B(6), B(7), t => {
  hood({ k: lerp(0.62, 0.6, t / 4), h: 0, sy: 1380, yard: true, neighbors: NB, mood: 'happy', look: [0.2, -0.2] });
});
// 7 PLAN
add(B(7), B(8), t => {
  const k = lerp(0.6, 0.45, ease.io(prog(t, 0, 1.2)));
  hood({ k, h: 0, sy: lerp(1380, 1420, prog(t, 0, 1.2)), yard: true, neighbors: NB, mood: 'calm', look: [0, -0.4], after: () => {
    const a = ease.o(prog(t, 0.6, 1.8)); const c = X();
    c.save(); c.globalAlpha = a; c.setLineDash([22, 16]); c.strokeStyle = NAVY; c.lineWidth = 5; c.beginPath(); c.moveTo(250, -40); c.lineTo(250, -40 - 560 * a); c.stroke();
    c.beginPath(); c.moveTo(-500, -640); c.lineTo(900, -640); c.stroke(); c.setLineDash([]);
    shape(P.poly([[226, -40 - 560 * a + 10], [274, -40 - 560 * a + 10], [250, -40 - 560 * a - 30]]), C.red, { size: 50, hatch: false });
    c.globalAlpha = a * 0.35; O.at(0, -640 + 100, 0.5, 0, () => { O.chair(); }); c.restore();
  } });
});
// 8-10 ASCENT (one continuous world)
function ascentH(t) { // t global
  const t0 = B(8) + 1.0, t1 = B(9), t2 = B(10), t3 = ST[10] + 0.55, t4 = B(11) + 0.3;
  if (t < t0) return 0;
  if (t < t1) return 1600 * Math.pow(prog(t, t0, t1), 2.2);
  if (t < t2) return lerp(1600, 4300, ease.o(prog(t, t1, t2)) * 0.6 + prog(t, t1, t2) * 0.4);
  if (t < t3) return lerp(4300, 5170, ease.o(prog(t, t2, t3)));
  return lerp(5170, 5400, ease.i(prog(t, t3, t4)));
}
add(B(8), B(11), (t, g) => {
  const h = ascentH(g); const k = Math.min(0.6, 640 / Math.max(h, 1));
  const sy = lerp(1380, 1050, ease.io(clamp(h / 900)));
  const nbs = NB.map(n => ({ ...n, mood: h > 30 ? 'wow' : n.mood, look: [n.x < 0 ? 0.6 : -0.6, -1], headRot: n.x < 0 ? 0.25 : -0.25 }));
  const shake = g < B(8) + 1.0 ? Math.sin(g * 50) * 2 * prog(g, B(8) + 0.3, B(8) + 1.0) : 0;
  X().save(); X().translate(shake, 0);
  hood({ k, h, sy, yard: true, neighbors: nbs, mast: true, mood: h > 30 ? 'wow' : 'worried', look: [0, h > 3000 ? 1 : 0.3], after: () => {
    const c = X(); const ref = prog(g, ST[10] - 0.1, ST[10] + 0.3) * (1 - prog(g, ST[11] - 0.5, ST[11] - 0.25));
    if (ref > 0) { c.save(); c.globalAlpha = ref; c.setLineDash([60, 40]); c.strokeStyle = NAVY; c.lineWidth = 3 / k; c.beginPath(); c.moveTo(-1400, -5220); c.lineTo(1500, -5220); c.stroke(); c.restore(); }
    // speed lines
    const sp = clamp((h - 200) / 600) * (g < ST[10] + 0.3 ? 1 : 0.3);
    if (sp > 0) { c.save(); c.globalAlpha = 0.5 * sp; c.strokeStyle = '#fff'; c.lineWidth = 4 / k; for (let i = 0; i < 6; i++) { const x = (-500 + i * 200) / 1, y0 = -h + 300 + ((g * 900 + i * 140) % 500); c.beginPath(); c.moveTo(x / k * 0.6, -h + (y0 + h) / k * 0.6); c.lineTo(x / k * 0.6, -h + (y0 + h + 160) / k * 0.6); c.stroke(); } c.restore(); }
  } });
  X().restore();
});
// 11 BINLERCE METRE
add(B(11), B(12), t => {
  const k = ease.o(prog(t, 0, 0.75));
  highSky({ Z: lerp(2.4, 0.62, k), focus: [540, 1000], at: [540, lerp(1000, 900, k)], alt: k, mood: 'wow', look: [0, 1], jet: { x: 1100 - t * 120, y: 1250, s: 0.2, d: 0.4 } });
}, 0.12);
// 12 4880 m – vertical pan city -> hills -> clouds -> Larry
add(B(12), B(13), t => {
  const c = X(); const k = ease.io(prog(t, 0.1, 3.4)); const oy = lerp(-3400, 0, k);
  c.save(); c.translate(0, oy);
  const g = c.createLinearGradient(0, -100, 0, 5400); g.addColorStop(0, '#a9c0d6'); g.addColorStop(0.45, '#bcd3e6'); g.addColorStop(1, '#efe4c9');
  c.fillStyle = g; c.fillRect(0, -100, W, 5500); c.drawImage(L.wash('pan', '#ffffff', '#ffffff', W, H), 0, -100, W, 5500);
  c.globalAlpha = 1;
  O.skyline(560, 5120, 1.1, 12, '#9fb0c6', 18); shape(P.R(-50, 5120, 1200, 300), '#a9c084', { size: 1200, stroke: false });
  c.save(); c.translate(540, 0); O.hills(4700, '#c4bf92', '#a9b689', 1400); c.restore();
  for (const [x, y, s] of [[100, 3000, 1.6], [420, 3060, 1.9], [800, 2990, 1.7], [1100, 3080, 1.4], [250, 3150, 1.3], [650, 3170, 1.5]]) O.cloud(x, y, s);
  for (const [x, y, s] of [[150, 1900, 0.8], [900, 1500, 0.7]]) O.cloud(x + t * 10, y, s, { alpha: 0.8 });
  O.at(540, 1150 + Math.sin(t * 1.5) * 8, 0.55, Math.sin(t * 1.2) * 0.03, () => { c.save(); c.translate(0, -150); O.balloons({ R: 380, height: 700, pale: 0.35 }); c.restore(); O.larrySeated({ mood: 'shiver', look: [0, 0.6] }); });
  c.restore();
  // cold air + pale
  c.save(); c.fillStyle = `rgba(225,235,242,${0.12 + 0.18 * k})`; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3; for (let i = 0; i < 8; i++) { const x = ((t * 420 + i * 190) % 1500) - 250, y = 620 + i * 110 + Math.sin(i) * 30; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 70, y - 16, x + 150, y); c.stroke(); }
  // breath puffs
  if (k > 0.8) { const ph = (t * 1.2) % 1; c.globalAlpha = (1 - ph) * 0.8; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(570 + ph * 40, 1150 - 0.55 * 130 - ph * 20, 8 + ph * 14, 0, 7); c.fill(); }
  c.restore();
});
// 13 COMMERCIAL JET
add(B(13), B(14), t => {
  const dur = B(14) - B(13);
  if (t < 2.3) {
    const jx = lerp(1700, 1010, ease.o(prog(t, 0, 2.3)));
    highSky({ Z: 1.25, focus: [540, 1000], at: [330, 1240], jet: { x: jx, y: 650, s: lerp(0.7, 0.55, prog(t, 0, 2.3)), flip: 1, d: 0.95, trail: 0.8 }, mood: 'wow', look: [0.8, -0.6] });
  } else if (t < 4.2) { cockpit(t - 2.3, 'jet'); }
  else { const jx = lerp(900, 1500, prog(t, 4.2, dur)); highSky({ Z: 1.25, focus: [540, 1000], at: [330, 1240], jet: { x: jx, y: 700, s: 0.45, flip: 1, d: 0.9, trail: 1 }, mood: 'happy', look: [-0.8, -0.4], armsUp: 0 }); }
});
function cockpit(u, mode) {
  const c = X(); bg('#7fa9d1', '#d6e4ec', 'ck');
  O.cloud(250, 1700, 1.8); O.cloud(850, 1640, 2); O.cloud(800, 820, 0.7);
  // tiny larry far away, upper right
  O.at(800 - u * 30, 700, 0.16, 0, () => { c.save(); c.translate(0, -150); O.balloons({ R: 380, height: 700 }); c.restore(); O.larrySeated({ mood: 'wow' }); });
  const s = 6.2, jx = 40 + 305 * s + u * 30, jy = 1250;
  // pilot behind cockpit glass (drawn first, glass over it)
  let look = [1, -0.6], mood = 'calm', rot = 0;
  if (u > 0.45) look = [-1, 0]; if (u > 0.8) { look = [1, -0.8]; mood = 'wow'; rot = 0.12; }
  const wx0 = jx + s * -282, wx1 = jx + s * -246, wy0 = jy + s * -26, wy1 = jy + s * -6;
  O.jet(jx, jy, s, 1);
  c.save(); c.beginPath(); c.moveTo(jx + s * -282, jy + s * -18); c.lineTo(jx + s * -255, jy + s * -26); c.lineTo(jx + s * -246, jy + s * -10); c.lineTo(jx + s * -276, jy + s * -6); c.closePath(); c.clip();
  c.fillStyle = '#9fc1dc'; c.fillRect(wx0 - 20, wy0 - 20, wx1 - wx0 + 40, wy1 - wy0 + 40);
  O.at((wx0 + wx1) / 2 + 10, (wy0 + wy1) / 2 + 22, 1.45, rot, () => { shape(P.R(-50, 30, 100, 60), '#2d3a5c', { size: 100 }); O.head(mood, look, { cap: '#2d3a5c', noMustache: true, hair: '#3b3330' }); });
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(wx0 - 20, wy0 - 20, wx1 - wx0 + 40, wy1 - wy0 + 40);
  c.restore();
  if (mode === 'radio') { c.save(); c.strokeStyle = NAVY; c.lineWidth = 5; for (let i = 0; i < 4; i++) { const r = ((u * 300 + i * 90) % 360); c.globalAlpha = 1 - r / 360; c.beginPath(); c.arc(wx1 + 40, wy0 - 40, r, -0.9, 0.3); c.stroke(); } c.restore(); }
}
// 14 ATC
add(B(14), B(15), t => {
  const c = X();
  if (t < 1.7) {
    // radio waves travelling from cockpit to tower
    const k = ease.io(prog(t, 0.6, 1.7));
    c.save(); c.translate(-k * 1080, 0); cockpit(1.9 + t * 0.2, 'radio'); c.restore();
    c.save(); c.translate(1080 - k * 1080, 0); bg('#8fb8da', '#efe3c6', 'atcsky'); shape(P.R(-50, 1560, 1200, 400), '#b9b88a', { size: 1200, stroke: false }); O.tower(540, 1600, 1.45); O.cloud(200, 700, 0.9); c.restore();
    c.save(); c.strokeStyle = NAVY; c.lineWidth = 5; for (let i = 0; i < 4; i++) { const r = ((t * 350 + i * 100) % 400); c.globalAlpha = (1 - r / 400) * 0.9; c.beginPath(); c.arc(540 - k * 300 + 300, 690, r, Math.PI - 0.6, Math.PI + 0.6); c.stroke(); } c.restore();
    return;
  }
  // interior
  paperBg();
  const u = t - 1.7;
  c.save(); cam(540, 1100, lerp(1.0, 1.06, u / 4.5), 540, 1100);
  c.drawImage(L.wash('atcwin', '#86b2d8', '#e5e3d2', 1080, 420), 0, 500);
  for (let i = 0; i < 5; i++) shape(P.R(i * 270 - 10, 490, 22, 440), '#5d6573', { size: 440, hatch: false });
  shape(P.R(-20, 490, 1120, 22), '#5d6573', { size: 1000, hatch: false }); shape(P.R(-20, 920, 1120, 30), '#5d6573', { size: 1000, hatch: false });
  O.cloud(300 + u * 12, 700, 0.6); O.cloud(860 - u * 8, 610, 0.5);
  // tiny dot in window
  O.at(680, 760, 0.06, 0, () => { c.save(); c.translate(0, -150); O.balloons({ R: 380, height: 700 }); c.restore(); O.chair(); });
  shape(P.R(-20, 950, 1120, 980), '#d8cdb5', { size: 1000, gap: 10 });
  // controller 2 standing looking up
  O.at(860, 1650, 1.25, 0, () => O.person({ shirt: '#8fb3a0', pants: '#5b5f75', mood: u > 1.6 ? 'wow' : 'calm', look: [-0.4, -1], headRot: -0.15, noMustache: true, hair: '#2f2a28' }));
  // desk
  shape(P.R(-20, 1420, 1120, 70), '#9a7a5c', { size: 1000 });
  // radar
  const rx = 470, ry = 1250, R = 210;
  shape(P.RR(rx - R - 30, ry - R - 30, 2 * R + 60, 2 * R + 60, 30), '#6d7484', { size: 400 });
  c.save(); c.fillStyle = '#20413a'; c.beginPath(); c.arc(rx, ry, R, 0, 7); c.fill();
  c.strokeStyle = 'rgba(120,220,160,0.35)'; c.lineWidth = 2; for (const r of [70, 140, 205]) { c.beginPath(); c.arc(rx, ry, r, 0, 7); c.stroke(); }
  c.beginPath(); c.moveTo(rx - R, ry); c.lineTo(rx + R, ry); c.moveTo(rx, ry - R); c.lineTo(rx, ry + R); c.stroke();
  const a = t * 2.2; for (let i = 0; i < 20; i++) { c.strokeStyle = `rgba(140,240,170,${0.5 * (1 - i / 20)})`; c.lineWidth = 6; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(a - i * 0.04) * R, ry + Math.sin(a - i * 0.04) * R); c.stroke(); }
  c.fillStyle = '#9ef0b8'; for (const [bx, by] of [[-120, -60], [90, 110], [140, -130]]) { c.beginPath(); c.moveTo(rx + bx, ry + by - 8); c.lineTo(rx + bx + 7, ry + by + 6); c.lineTo(rx + bx - 7, ry + by + 6); c.fill(); }
  // unconventional icon: little balloon cluster + chair
  const bl = 0.6 + 0.4 * Math.sin(t * 8); c.globalAlpha = bl; c.fillStyle = '#f2d36b';
  for (const [dx, dy] of [[0, -14], [-7, -20], [7, -20], [0, -26], [-9, -11], [9, -11]]) { c.beginPath(); c.arc(rx + 40 + dx, ry + 20 + dy, 5, 0, 7); c.fill(); }
  c.fillRect(rx + 34, ry + 22, 12, 9); c.globalAlpha = 1; c.strokeStyle = '#f2d36b'; c.lineWidth = 2; c.beginPath(); c.arc(rx + 40, ry + 8, 34 + 6 * Math.sin(t * 6), 0, 7); c.stroke();
  c.restore();
  // controller 1 seated with headset leaning to radar
  O.at(140, 1900, 1.55, 0.12, () => { O.person({ shirt: '#d6a46a', pants: '#4f5670', mood: u > 0.8 ? 'worried' : 'calm', look: [1, 0.5], headRot: 0.1 }); });
  O.at(140 + 1.55 * 0 + 50, 1900 - 1.55 * 246 - 10, 1.55, 0.12, () => { c.save(); c.strokeStyle = '#2a2a33'; c.lineWidth = 6; c.beginPath(); c.arc(0, -10, 34, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.restore(); shape(P.E(-31, 0, 8, 12), '#2a2a33', { size: 20, hatch: false }); line([[-31, 8], [-10, 26]], '#2a2a33', 3, { plain: true }); });
  // confused swirl
  if (u > 1.0) { c.save(); c.globalAlpha = clamp(u - 1.0); c.strokeStyle = NAVY; c.lineWidth = 4; c.beginPath(); for (let i = 0; i < 40; i++) { const aa = i * 0.35, r = 4 + i * 0.7; const x = 260 + Math.cos(aa + t * 3) * r, y = 1350 + Math.sin(aa + t * 3) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore(); }
  c.restore();
});
// 15 DESCENT – a few balloons go
const REMOVED = [3, 17, 29, 36, 11, 24];
add(B(15), B(16), t => {
  const rem = i => { const j = REMOVED.indexOf(i); if (j < 0) return 0; return (t - (0.5 + j * 0.42)) / 0.35; };
  const d = ease.i(prog(t, 2.6, 4.2)) * 120 + Math.max(0, t - 4.2) * 70;
  highSky({ Z: 1.55, focus: [540, 940], at: [540, 1000], rem, drop: -d, mood: t > 2.8 ? 'calm' : 'worried', look: [0, t > 2.8 ? 0.8 : -0.8], extra: () => {
    // puffs where balloons vanish
    const c = X(); for (let j = 0; j < REMOVED.length; j++) { const p = prog(t, 0.5 + j * 0.42 + 0.2, 0.5 + j * 0.42 + 0.9); if (p <= 0 || p >= 1) continue; const b = O.CL[REMOVED[j]];
      const x = 540 + b.x * 380 * 0.42, y = 1060 - 0.42 * (150 + 700 - b.y * 380); c.save(); c.globalAlpha = 1 - p; c.strokeStyle = '#fff'; c.lineWidth = 3; for (let q = 0; q < 6; q++) { const a = q * 1.05; c.beginPath(); c.moveTo(x + Math.cos(a) * 20 * p, y + Math.sin(a) * 20 * p); c.lineTo(x + Math.cos(a) * 45 * p, y + Math.sin(a) * 45 * p); c.stroke(); } c.restore(); }
    // down arrow
    const a = prog(t, 2.8, 3.4) * (1 - prog(t, 4.6, 5)); if (a > 0) { c.save(); c.globalAlpha = a; c.setLineDash([16, 12]); c.strokeStyle = NAVY; c.lineWidth = 5; c.beginPath(); c.moveTo(780, 880); c.lineTo(780, 1120); c.stroke(); c.setLineDash([]); c.restore(); shape(P.poly([[756, 1110], [804, 1110], [780, 1150]]), C.red, { size: 50, hatch: false, alpha: a }); }
  } });
});
const rem6 = i => (REMOVED.includes(i) ? 1 : 0);
// 16 ANOTHER PROBLEM – city closer, power lines enter
add(B(16), B(17), t => {
  const u = prog(t, 0, B(17) - B(16));
  const h = lerp(5200, 900, ease.io(u)); const k = Math.min(0.6, 640 / Math.max(h, 1));
  hood({ k, h, sy: lerp(1050, 980, u), mood: u > 0.3 ? 'worried' : 'calm', look: [0, 1], rem: rem6, poles: [-520, 560] });
});
// 17 POWER LINES
add(B(17), B(18), t => {
  const c = X(); bg('#93bede', '#eee3c6', 'pl');
  c.save(); cam(540, 1100, lerp(1.0, 1.08, t / 4.4), 540, 1100);
  shape(P.R(-100, 1640, 1300, 400), '#a9c084', { size: 1200, stroke: false }); shape(P.R(-100, 1720, 1300, 90), '#b8b3a8', { size: 1200, stroke: false });
  O.house(250, 1640, 1.2, 2); O.house(880, 1640, 1.1, 4); O.palm(560, 1640, 1.1);
  O.pole(80, 1660, 1050, 1); O.pole(1000, 1660, 1050, 1);
  const wy = 1660 - 1050 + 50; O.wires(80, 1000, wy, 38);
  const hook = [560, wy + 76 + 2];
  // balloons above wire, anchored at hook
  O.at(hook[0], hook[1], 0.55, Math.sin(t * 0.8) * 0.02, () => { O.balloons({ R: 380, height: 760, rem: rem6, remove: i => (REMOVED.includes(i) || i % 5 === 0 ? 1 : 0) }); });
  // chair dangling
  const sw = Math.sin(t * 1.6) * 0.06; const L2 = 340;
  const cx = hook[0] + Math.sin(sw) * L2, cy = hook[1] + Math.cos(sw) * L2;
  line([[hook[0] - 6, hook[1]], [cx - 20, cy - 70]], '#5a5470', 2.2, { plain: true }); line([[hook[0] + 6, hook[1]], [cx + 20, cy - 70]], '#5a5470', 2.2, { plain: true });
  O.at(cx, cy, 0.62, sw, () => O.larrySeated({ mood: 'worried', look: [0, 1] }));
  // tangle scribble
  c.save(); c.strokeStyle = '#5a5470'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 18; i++) { const a = i * 1.7; const x = hook[0] + Math.cos(a) * (6 + i % 4 * 3), y = hook[1] + Math.sin(a) * (5 + i % 3 * 2); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore();
  // onlookers below
  O.at(170, 1700, 0.62, 0, () => O.person({ shirt: '#e6c45e', mood: 'wow', look: [0.6, -1], headRot: 0.2, noMustache: true }));
  O.at(930, 1700, 0.62, 0, () => O.person({ shirt: '#8fb47a', mood: 'worried', look: [-0.6, -1], headRot: -0.2 }));
  c.restore();
});
// 18 SAFE
add(B(18), B(19), t => {
  const c = X(); bg('#9cc3e0', '#efe4c9', 'safe');
  const land = ease.o(prog(t, 0, 0.8));
  c.save(); cam(540, 1250, lerp(1.04, 1.0, t / 3.5), 540, 1250);
  shape(P.R(-100, 1560, 1300, 500), '#a9c084', { size: 1200, stroke: false, gap: 9 });
  O.pole(120, 1580, 900); O.house(860, 1560, 1.1, 5);
  O.at(720, 1470, 0.95, 0, () => { c.save(); c.translate(0, -150); O.balloons({ R: 330, height: 520, remove: i => (i % 2 === 0 || REMOVED.includes(i) ? 1 : 0) }); c.restore(); O.chair(); });
  O.at(470, 1600 - (1 - land) * 60, 1.05, 0, () => O.person({ mood: 'happy', look: [0.3, 0] }));
  O.at(220, 1640, 1.0, 0, () => O.person({ shirt: '#d9b24a', pants: '#3f4660', vest: '#c55d4b', helmet: '#c55d4b', noMustache: true, hair: '#3b3330', pose: 'reach', mood: 'happy', look: [1, 0] }));
  O.at(960, 1660, 0.95, 0, () => O.person({ shirt: '#d9b24a', pants: '#3f4660', helmet: '#c55d4b', noMustache: true, hair: '#6b4a30', mood: 'calm', look: [-1, -0.3] }));
  c.restore();
});
// 19 FAA
add(B(19), B(20), t => {
  const c = X(); paperBg();
  c.save(); c.fillStyle = 'rgba(150,170,190,0.18)'; c.fillRect(0, 0, W, H); c.restore();
  O.at(300, 1980, 2.4, 0, () => O.person({ mood: 'resigned', pose: 'reach', look: [0.6, 0.6], shirt: C.shirt }));
  const fl = Math.sin(t * 2.2) * 0.015;
  O.at(760, 1320, 1, -0.05 + fl, () => {
    shape(P.R(-250, -330, 500, 660), '#fbf7ec', { size: 600, gap: 14, hatchColor: '#e9e1cc' });
    shape(P.R(-210, -290, 420, 30), '#7f9cc0', { size: 300, hatch: false, lw: 1.5 });
    for (let i = 0; i < 11; i++) { const w = 380 - (i % 3) * 60 - (i === 10 ? 200 : 0); line([[-200, -220 + i * 40], [-200 + w, -220 + i * 40 + 2]], '#9aa0b8', 2.4); }
    line([[30, 250], [190, 248]], NAVY, 2);
    // stamp mark
    const sp = prog(t, 1.75, 1.85);
    if (sp > 0) { c.save(); c.globalAlpha = 0.85; c.rotate(-0.25); c.translate(-60, 230); c.strokeStyle = '#b8443a'; c.lineWidth = 9; c.beginPath(); c.arc(0, 0, 80, 0, 7); c.stroke(); c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 62, 0, 7); c.stroke();
      c.fillStyle = '#b8443a'; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 16 : 36, a = i * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.restore(); }
  });
  // stamp tool
  const down = t < 1.75 ? ease.i(prog(t, 0.9, 1.75)) : 1 - ease.o(prog(t, 1.9, 2.6));
  if (t > 0.6 && t < 2.8) O.at(700 + 0, lerp(600, 1450, down), 1.3, -0.2, () => { shape(P.RR(-70, -40, 140, 40, 8), '#7a4a3a', { size: 140 }); shape(P.R(-16, -150, 32, 112), '#a5764f', { size: 120 }); shape(P.E(0, -170, 40, 30), '#7a4a3a', { size: 80 }); });
  if (t > 1.75 && t < 2.1) { c.save(); c.strokeStyle = NAVY; c.lineWidth = 4; for (let i = 0; i < 8; i++) { const a = i * 0.785; c.beginPath(); c.moveTo(700 + Math.cos(a) * 120, 1450 + Math.sin(a) * 60); c.lineTo(700 + Math.cos(a) * 170, 1450 + Math.sin(a) * 90); c.stroke(); } c.restore(); }
});
// 20 MUSEUM
function museumBg(a, drift) {
  const c = X(); c.save(); c.globalAlpha = a;
  c.drawImage(L.wash('muswall', '#d9d0bd', '#cfc4ad'), 0, 0);
  // hanging aircraft silhouettes (NASM style)
  for (const [x, y, s, f] of [[260, 600, 0.22, 1], [800, 680, 0.18, -1]]) { line([[x, 470], [x, y - 20]], '#6b6a70', 1.5, { plain: true }); line([[x + 40, 470], [x + 40, y - 20]], '#6b6a70', 1.5, { plain: true }); O.at(x + drift * 10, y, s, 0, () => { c.save(); c.globalAlpha *= 0.55; O.jet(0, 0, 1, f); c.restore(); }); }
  shape(P.R(-20, 1520, 1120, 420), '#b9a888', { size: 1000, gap: 12 });
  line([[-20, 1520], [1100, 1520]], NAVY, 2.5);
  const g = c.createRadialGradient(540, 1250, 50, 540, 1250, 620); g.addColorStop(0, 'rgba(255,248,225,0.55)'); g.addColorStop(1, 'rgba(255,248,225,0)'); c.fillStyle = g; c.fillRect(0, 500, W, 1400);
  shape(P.poly([[300, 1560], [780, 1560], [840, 1640], [240, 1640]]), '#8c8a94', { size: 600 });
  shape(P.R(240, 1640, 600, 50), '#76747e', { size: 600, hatch: false });
  for (const sx of [130, 950]) { shape(P.R(sx - 6, 1500, 12, 230), '#b59a52', { size: 230, hatch: false }); shape(P.E(sx, 1500, 14, 14), '#b59a52', { size: 30, hatch: false }); shape(P.E(sx, 1735, 40, 12), '#b59a52', { size: 80, hatch: false }); }
  c.strokeStyle = '#9c3b3b'; c.lineWidth = 10; c.beginPath(); c.moveTo(130, 1510); c.quadraticCurveTo(240, 1600, 300, 1560); c.moveTo(950, 1510); c.quadraticCurveTo(840, 1600, 780, 1560); c.stroke();
  // placard
  O.at(870, 1760, 1, -0.05, () => { shape(P.R(-6, -80, 12, 80), '#6c6a74', { size: 80, hatch: false }); shape(P.poly([[-80, -140], [80, -140], [90, -80], [-90, -80]]), '#efe8d6', { size: 180, hatch: false }); for (let i = 0; i < 3; i++) line([[-60, -125 + i * 15], [50 - i * 20, -125 + i * 15]], '#9aa0b8', 2, { plain: true }); });
  // visitors silhouettes
  c.globalAlpha = a * 0.5; O.at(70, 1900, 1.3, 0, () => O.person({ shirt: '#8d8fa6', pants: '#6a6c80', look: [1, 0], noMustache: true, hair: '#555' }));
  c.restore();
}
add(B(20), B(21), t => {
  const c = X(); const dur = B(21) - B(20);
  const m = ease.io(prog(t, 0.9, 2.2));
  if (m < 1) { c.save(); c.globalAlpha = 1 - m; bg('#9cc3e0', '#efe4c9', 'safe'); shape(P.R(-100, 1560, 1300, 500), '#a9c084', { size: 1200, stroke: false }); c.restore(); }
  c.save(); cam(540, 1250, lerp(1.0, 1.07, t / dur), 540, 1250);
  museumBg(m, t / dur);
  const rot = t < 2.2 ? Math.cos(ease.io(prog(t, 0.2, 2.2)) * Math.PI * 2) : 1;
  O.at(540, lerp(1470, 1390, m), lerp(1.6, 2.1, m), 0, () => { c.save(); c.scale(Math.max(0.15, Math.abs(rot)), 1); O.chair({ jugs: m > 0.5 }); c.restore(); });
  if (m > 0.9 && t > 2.6) { const p = (t * 0.7) % 1; c.save(); c.globalAlpha = Math.sin(p * Math.PI) * 0.8; O.sparkleStars(700, 1100, 50); c.restore(); }
  c.restore();
});
// 21 SPLIT -> MERGE
add(B(21), B(22), t => {
  const c = X(); const m = ease.io(prog(t, 3.2, 5.0)); const split = 540 * (1 - m);
  // right: chair above clouds (full canvas behind)
  c.save(); c.beginPath(); c.rect(split, 0, W, H); c.clip();
  highSky({ Z: lerp(1.25, 1.05, m), focus: [540, 1000], at: [lerp(810, 540, m), 1080], mood: 'happy', look: [-0.5, 0], jet: { x: 1300 - t * 100, y: 560, s: 0.22, d: 0.5, trail: 1 } });
  c.restore();
  if (split > 2) {
    c.save(); c.beginPath(); c.rect(0, 0, split, H); c.clip();
    bg('#9cc3e0', '#efe4c9', 'safe'); shape(P.R(-100, 1380, 700, 600), '#a9c084', { size: 700, stroke: false, gap: 9 }); O.fence(-60, 600, 1380, 90); O.palm(80, 1380, 1);
    O.at(lerp(270, 540, m), 1420, 1.25, 0, () => O.chair());
    c.restore();
    line([[split, 470], [split + 6, 1200], [split - 4, 1920]], NAVY, 4, { alpha: 1 - m });
  }
});
// 22 FINAL
add(B(22), NARR_END + 0.25, t => {
  highSky({ Z: lerp(1.12, 1.0, ease.o(prog(t, 0, 3.6))), focus: [540, 1000], at: [540, 1060], mood: 'happy', look: [0, 0.2], jet: { x: 1200 - t * 140, y: 640, s: 0.26, d: 0.5, trail: 1 }, extra: () => {
    const c = X(); c.save(); c.globalAlpha = 0.22; c.lineWidth = 7; c.strokeStyle = '#8a6b3a'; c.strokeRect(150, 500, 780, 1050); c.lineWidth = 2; c.strokeRect(175, 525, 730, 1000);
    c.fillStyle = '#8a6b3a'; c.fillRect(470, 1575, 140, 40); c.restore(); } });
});
// END: descend, land, rotate, (photo)
const HAS_PHOTO = fs.existsSync(__dirname + '/archive.jpg');
const END0 = NARR_END + 0.25;
const PHOTO_IN = END0 + 1.1, TOTAL = HAS_PHOTO ? PHOTO_IN + 3.3 : END0 + 2.3;
add(END0, TOTAL + 1, (t, g) => {
  const c = X();
  const d = ease.io(prog(t, 0, 0.75));
  if (d < 1) { c.save(); c.globalAlpha = 1 - d; highSky({ Z: 1.0, focus: [540, 1000], at: [540, 1060 + d * 500], mood: 'happy', drop: -d * 600 }); c.restore(); }
  if (d > 0) {
    c.save(); c.globalAlpha = d; museumBg(1, 0); c.restore();
    const rot = Math.cos(ease.io(prog(t, 0.6, 1.1)) * Math.PI);
    O.at(540, lerp(900, 1390, d), 2.1, 0, () => { c.save(); c.scale(Math.max(0.15, Math.abs(rot)), 1); O.chair({ jugs: true }); c.restore(); });
  }
}, 0.25);

const SENT_LAST = SENT[22];
module.exports = { SC, ST, T, SENT, NARR_END, TOTAL, HAS_PHOTO, PHOTO_IN, END0 };
