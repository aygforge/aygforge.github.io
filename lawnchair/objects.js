const L = require('./lib');
const { S, P, shape, line, plainCurve, C, BAL, NAVY, shade, mix, rng, lerp, clamp, ease } = L;
const X = () => S.ctx;
function at(x, y, s, rot, fn) { const c = X(); c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(s, s); fn(); c.restore(); }

// ---------- head ----------
// mood: calm, wow, shiver, worried, resigned, happy, look
function head(mood = 'calm', look = [0, 0], o = {}) {
  const skin = o.skin || C.skin, hair = o.hair || C.hair;
  shape(P.E(-27, 2, 6, 9), skin, { size: 20, hatch: false });
  shape(P.E(27, 2, 6, 9), skin, { size: 20, hatch: false });
  shape(P.E(0, 0, 27, 31), skin, { size: 60, gap: 9 });
  if (!o.noHair) shape('M-29 -6 Q-32 -38 0 -36 Q31 -38 29 -6 Q24 -22 4 -22 Q-14 -24 -29 -6Z', hair, { size: 60, gap: 5 });
  if (o.cap) { shape('M-30 -12 Q-30 -42 0 -42 Q30 -42 30 -12Z', o.cap, { size: 60 }); shape(P.R(-31, -16, 62, 7), o.capBand || '#d8b24c', { size: 40, hatch: false }); shape('M-30 -12 L-42 -6 L-26 -6Z', o.cap, { size: 20, hatch: false }); }
  if (o.helmet) shape('M-31 -4 Q-31 -44 0 -44 Q31 -44 31 -4 L36 -2 L-36 -2Z', o.helmet, { size: 60 });
  const ex = look[0] * 3, ey = look[1] * 3;
  const c = X();
  // brows
  const br = mood === 'wow' ? -6 : mood === 'worried' ? -3 : 0;
  if (mood === 'worried' || mood === 'shiver') { line([[-15, -10 + br], [-6, -13 + br]], NAVY, 2.2, { plain: true }); line([[6, -13 + br], [15, -10 + br]], NAVY, 2.2, { plain: true }); }
  else if (mood === 'resigned') { line([[-15, -12], [-6, -10]], NAVY, 2.2, { plain: true }); line([[6, -10], [15, -12]], NAVY, 2.2, { plain: true }); }
  else { line([[-15, -11 + br], [-6, -12 + br]], NAVY, 2.2, { plain: true }); line([[6, -12 + br], [15, -11 + br]], NAVY, 2.2, { plain: true }); }
  c.fillStyle = NAVY;
  if (mood === 'resigned') { line([[-14, -2], [-6, -2]], NAVY, 2.4, { plain: true }); line([[6, -2], [14, -2]], NAVY, 2.4, { plain: true }); }
  else if (mood === 'wow') { c.fillStyle = '#fff'; c.beginPath(); c.arc(-10, -3, 5.5, 0, 7); c.arc(10, -3, 5.5, 0, 7); c.fill(); c.fillStyle = NAVY; c.beginPath(); c.arc(-10 + ex, -3 + ey, 2.8, 0, 7); c.arc(10 + ex, -3 + ey, 2.8, 0, 7); c.fill(); }
  else { c.beginPath(); c.arc(-10 + ex, -2 + ey, 3.2, 0, 7); c.arc(10 + ex, -2 + ey, 3.2, 0, 7); c.fill(); }
  if (!o.noMustache) shape('M-13 13 Q0 6 13 13 Q7 17 0 15 Q-7 17 -13 13Z', o.hair || C.hair, { size: 20, hatch: false, lw: 1.5 });
  // mouth
  const my = o.noMustache ? 14 : 20;
  if (mood === 'calm' || mood === 'happy' || mood === 'look') line([[-8, my], [0, my + (mood === 'happy' ? 6 : 3)], [8, my]], NAVY, 2.2, { plain: true });
  else if (mood === 'wow') { c.fillStyle = '#7a3b3b'; c.beginPath(); c.ellipse(0, my + 3, 5, 6.5, 0, 0, 7); c.fill(); }
  else if (mood === 'shiver') { const w = Math.sin(S.t * 40) * 1.5; line([[-9, my + 1], [-4, my - 1 + w], [0, my + 1], [4, my - 1 - w], [9, my + 1]], NAVY, 2, { plain: true }); }
  else if (mood === 'worried') line([[-8, my + 3], [0, my - 1], [8, my + 3]], NAVY, 2.2, { plain: true });
  else if (mood === 'resigned') line([[-8, my + 2], [8, my + 1]], NAVY, 2.2, { plain: true });
  // cheeks
  c.fillStyle = 'rgba(214,120,100,0.22)'; c.beginPath(); c.arc(-17, 8, 6, 0, 7); c.arc(17, 8, 6, 0, 7); c.fill();
}

// ---------- lawn chair (front view). origin = seat centre ----------
function chairBack(o = {}) {
  line([[-54, -8], [-58, 80]], C.alu, 6, { rough: 0.4 }); line([[54, -8], [58, 80]], C.alu, 6, { rough: 0.4 });
  shape(P.R(-56, -152, 112, 144), C.alu, { size: 140, hatch: false });
  const cols = [C.web1, C.web2, C.web3, C.web1, C.web2];
  for (let i = 0; i < 5; i++) shape(P.R(-50, -146 + i * 27.5, 100, 25), cols[i], { size: 100, lw: 1.6, gap: 5 });
  for (let i = -2; i <= 2; i++) line([[i * 20, -148], [i * 20, -10]], '#4a3029', 5, { plain: true, alpha: 0.7 });
}
function chairSeat() {
  shape(P.poly([[-60, -14], [60, -14], [72, 22], [-72, 22]]), C.web1, { size: 140, ha: 50 });
  for (let i = -2; i <= 2; i++) line([[i * 24, -14], [i * 29, 22]], '#4a3029', 5, { plain: true, alpha: 0.7 });
}
function chairFront(o = {}) {
  shape(P.R(-76, 16, 10, 76), C.alu, { size: 80, hatch: false, lw: 2 });
  shape(P.R(66, 16, 10, 76), C.alu, { size: 80, hatch: false, lw: 2 });
  shape(P.poly([[-86, -62], [-56, -64], [-56, -54], [-84, -50]]), C.alu, { size: 40, hatch: false, lw: 2 });
  shape(P.poly([[86, -62], [56, -64], [56, -54], [84, -50]]), C.alu, { size: 40, hatch: false, lw: 2 });
  line([[-80, -52], [-72, 18]], C.alu, 6, { rough: 0.4 }); line([[80, -52], [72, 18]], C.alu, 6, { rough: 0.4 });
  if (o.jugs) {
    for (const s of [-1, 1]) for (const jy of [-70]) { line([[s * 82, jy - 8], [s * 90, jy]], '#6b5a4a', 1.6, { plain: true }); shape(P.RR(s * 96 - 18, jy, 36, 50, 9), '#e6eef1', { size: 50, alpha: 0.95, hatchColor: '#c3d3da' }); shape(P.R(s * 96 - 6, jy - 6, 12, 8), '#e9e9e9', { size: 14, hatch: false }); }
    for (const s of [-1, 1]) {
      line([[s * 70, 24], [s * 74, 44]], '#6b5a4a', 1.6, { plain: true });
      shape(P.RR(s * 74 - 18, 44, 36, 50, 9), '#e6eef1', { size: 50, alpha: 0.95, hatchColor: '#c3d3da' });
      shape(P.R(s * 74 - 6, 38, 12, 8), '#e9e9e9', { size: 14, hatch: false });
      shape(P.R(s * 74 - 14, 70, 28, 20), '#bcd2dd', { size: 30, hatch: false, stroke: false, alpha: 0.6 });
    }
  }
}
function chair(o = {}) { chairBack(o); chairSeat(); chairFront(o); }

// Larry seated in chair. origin seat centre
function larrySeated(o = {}) {
  const mood = o.mood || 'calm', look = o.look || [0, 0];
  const shake = mood === 'shiver' ? Math.sin(S.t * 55) * 1.4 : 0;
  chairBack(o);
  chairSeat();
  const c = X(); c.save(); c.translate(shake, 0);
  // torso
  shape('M-40 -6 L-42 -100 Q-40 -120 -18 -122 L18 -122 Q40 -120 42 -100 L40 -6Z', o.shirt || C.shirt, { size: 120 });
  line([[-10, -121], [0, -104], [10, -121]], NAVY, 2, { plain: true });
  shape(P.R(-8, -134, 16, 16), o.skin || C.skin, { size: 20, hatch: false });
  // thighs + shins
  shape(P.RR(-38, -14, 34, 38, 10), C.jeans, { size: 50 }); shape(P.RR(4, -14, 34, 38, 10), C.jeans, { size: 50 });
  shape(P.RR(-36, 18, 28, 70, 8), C.jeans, { size: 70 }); shape(P.RR(8, 18, 28, 70, 8), C.jeans, { size: 70 });
  shape(P.E(-24, 92, 19, 9), '#5d4232', { size: 30, hatch: false }); shape(P.E(24, 92, 19, 9), '#5d4232', { size: 30, hatch: false });
  // arms
  const armUp = o.armsUp || 0;
  for (const s of [-1, 1]) {
    shape(P.poly([[s * 40, -116], [s * 54, -98], [s * 46, -84], [s * 34, -96]]), o.shirt || C.shirt, { size: 30, hatch: false });
    const hx = s * lerp(68, 60, armUp), hy = lerp(-54, -150, armUp);
    line([[s * 48, -90], [hx, hy]], o.skin || C.skin, 13, { rough: 0.3 });
  }
  c.save(); c.translate(0, -152); c.rotate(o.headRot || 0); head(mood, look, o); c.restore();
  c.restore();
  chairFront(o);
  const c2 = X(); c2.fillStyle = o.skin || C.skin;
  for (const s of [-1, 1]) { const hx = s * lerp(68, 60, armUp), hy = lerp(-54, -150, armUp); shape(P.E(hx, hy, 8, 8), o.skin || C.skin, { size: 16, hatch: false, lw: 1.6 }); }
}

// ---------- standing person. origin = feet ----------
function person(o = {}) {
  const shirt = o.shirt || C.shirt, pants = o.pants || C.jeans;
  shape(P.RR(-26, -96, 23, 92, 6), pants, { size: 90 }); shape(P.RR(3, -96, 23, 92, 6), pants, { size: 90 });
  shape(P.E(-15, -3, 17, 8), '#5d4232', { size: 30, hatch: false }); shape(P.E(15, -3, 17, 8), '#5d4232', { size: 30, hatch: false });
  shape('M-40 -88 L-42 -190 Q-40 -208 -18 -210 L18 -210 Q40 -208 42 -190 L40 -88Z', shirt, { size: 120 });
  if (o.vest) shape('M-40 -88 L-41 -190 L-14 -208 L-10 -88Z M40 -88 L41 -190 L14 -208 L10 -88Z', o.vest, { size: 80, hatch: false });
  shape(P.R(-8, -222, 16, 16), o.skin || C.skin, { size: 20, hatch: false });
  const pose = o.pose || 'down';
  for (const s of [-1, 1]) {
    let hand;
    if (pose === 'hold') hand = [s * 26, -138]; else if (pose === 'wave' && s === 1) hand = [62, -250 + Math.sin(S.t * 9) * 8]; else if (pose === 'reach' ) hand = [s * 60 + 20, -175]; else hand = [s * 52, -100];
    line([[s * 40, -196], [s * 52, -150], hand], o.skin || C.skin, 12, { rough: 0.3 });
    line([[s * 40, -198], [s * 50, -160]], shirt, 15, { rough: 0.3 });
    shape(P.E(hand[0], hand[1], 8, 8), o.skin || C.skin, { size: 16, hatch: false, lw: 1.6 });
  }
  const c = X(); c.save(); c.translate(0, -246); c.rotate(o.headRot || 0); head(o.mood || 'calm', o.look || [0, 0], o); c.restore();
}

// ---------- balloon cluster ----------
const CL = (() => { const r = rng(42), out = []; for (let i = 0; i < 42; i++) { const rr = Math.sqrt((i + 0.5) / 42), th = i * 2.39996 + 0.4; out.push({ x: Math.cos(th) * rr, y: Math.sin(th) * rr * 0.82, s: 0.85 + r() * 0.3, c: BAL[(i * 7 + (r() * 3 | 0)) % BAL.length], ph: r() * 6.28, z: r() }); } out.sort((a, b) => a.z - b.z); return out; })();
// anchor at (0,0) ; cluster centre at (0,-height). R cluster radius. opts.n visible, opts.pop array for appear progress, opts.gone set
function balloons(o = {}) {
  const R = o.R || 220, Hh = o.height || 420, n = o.n ?? 42, t = S.t; const c = X();
  const sway = Math.sin(t * 0.9) * 0.035 + (o.tilt || 0);
  c.save(); c.rotate(sway);
  const vis = [];
  for (let i = 0; i < 42; i++) {
    const b = CL[i]; const idx = CL.indexOf(b);
    let k = o.appear ? clamp(o.appear(i)) : (i < n ? 1 : 0);
    if (o.remove) k *= 1 - clamp(o.remove(i));
    if (k <= 0.001) continue;
    const bx = b.x * R + Math.sin(t * 1.3 + b.ph) * R * 0.03, by = -Hh + b.y * R + Math.cos(t * 1.1 + b.ph) * R * 0.025;
    vis.push({ b, k, bx, by, i });
  }
  // strings
  for (const v of vis) { const br = R * 0.27 * v.b.s * ease.back(Math.min(1, v.k)); plainCurve([[o.ax || 0, o.ay || 0], [v.bx * 0.35, (v.by + br) * 0.55], [v.bx, v.by + br]], '#5a5470', 1.5, 0.75 * Math.min(1, v.k * 2)); }
  for (const v of vis) {
    const br = R * 0.27 * v.b.s * ease.back(Math.min(1, v.k));
    const col = o.pale ? mix(v.b.c, '#dfe6ee', o.pale) : v.b.c;
    shape(P.E(v.bx, v.by, br, br * 1.1), col, { size: br * 2, gap: 6, lw: 2.2 });
    shape(P.poly([[v.bx - br * 0.12, v.by + br * 1.16], [v.bx + br * 0.12, v.by + br * 1.16], [v.bx, v.by + br * 1.06]]), shade(col, -0.2), { size: 10, hatch: false, lw: 1.4 });
    if (br * L.scl() > 10) { c.save(); c.strokeStyle = 'rgba(255,252,240,0.75)'; c.lineWidth = br * 0.12; c.lineCap = 'round'; c.beginPath(); c.arc(v.bx, v.by, br * 0.68, Math.PI * 1.1, Math.PI * 1.45); c.stroke(); c.restore(); }
  }
  c.restore();
}

// ---------- scenery ----------
const PUFFS = [[-70, 6, 42], [-25, -22, 55], [35, -12, 50], [78, 10, 36], [-110, 18, 28], [5, 14, 40]];
function cloud(x, y, s, o = {}) {
  at(x, y, s, 0, () => {
    const col = o.color || '#fbf8f0', c = X();
    const sc = L.scl();
    if (sc * 200 > 30) for (const p of PUFFS) shape(P.E(p[0], p[1], p[2], p[2] * 0.92), null, { size: 90, sc: o.outline || '#8496b8', lw: 2.2, alpha: o.alpha });
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.fillStyle = col;
    for (const p of PUFFS) { c.beginPath(); c.ellipse(p[0], p[1], p[2] - 2.5, p[2] * 0.92 - 2.5, 0, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(150,175,205,0.18)'; for (const p of PUFFS) { c.beginPath(); c.ellipse(p[0] + 4, p[1] + p[2] * 0.4, p[2] * 0.8, p[2] * 0.35, 0, 0, 7); c.fill(); }
    c.restore();
  });
}
const WALLS = ['#f1e2b8', '#e9c9b0', '#d9e3c4', '#f4ead2', '#e6d3a5', '#d7d9e8'], ROOFS = ['#b9654f', '#9c7356', '#c27b5b', '#8f6a5a'];
function house(x, y, s, v = 0) {
  at(x, y, s, 0, () => {
    const wall = WALLS[v % WALLS.length], roof = ROOFS[v % ROOFS.length];
    shape(P.R(-95, -95, 190, 95), wall, { size: 190 });
    shape(P.poly([[-112, -92], [0, -150], [112, -92]]), roof, { size: 200, ha: 20 });
    shape(P.R(-20, -60, 34, 60), '#8a6450', { size: 60, hatch: false });
    shape(P.R(-80, -70, 44, 34), '#a9cbe1', { size: 50, hatch: false }); shape(P.R(40, -70, 44, 34), '#a9cbe1', { size: 50, hatch: false });
    if (v % 2 === 0) shape(P.R(100, -60, 80, 60), shade(wall, -0.06), { size: 80 });
  });
}
function palm(x, y, s) {
  at(x, y, s, Math.sin(S.t * 0.8) * 0.015, () => {
    line([[0, 0], [6, -80], [14, -170], [10, -250]], '#8a6748', 12, { curve: true, rough: 0.5 });
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5 + Math.sin(S.t * 1.2 + i) * 0.04; const ex = 10 + Math.cos(a) * 95, ey = -250 + Math.sin(a) * 50 + 40 * Math.abs(i - 3) / 3;
      shape(`M10 -250 Q${10 + Math.cos(a) * 50} ${-270 + Math.sin(a) * 40} ${ex} ${ey} Q${10 + Math.cos(a) * 45} ${-250 + Math.sin(a) * 20} 10 -250Z`, i % 2 ? C.green : C.green2, { size: 100, lw: 1.8 }); }
  });
}
function bush(x, y, s, col = C.green2) { at(x, y, s, 0, () => { shape('M-50 0 Q-60 -40 -25 -45 Q-10 -70 20 -50 Q55 -55 52 0Z', col, { size: 100 }); }); }
function car(x, y, s, col = '#c9a25a') {
  at(x, y, s, 0, () => {
    shape(P.poly([[-120, -20], [-118, -55], [-60, -60], [-35, -95], [55, -95], [80, -60], [120, -55], [122, -20]]), col, { size: 240 });
    shape(P.poly([[-28, -88], [-2, -88], [-2, -62], [-50, -62]]), '#b6d2e3', { size: 40, hatch: false });
    shape(P.poly([[6, -88], [50, -88], [70, -62], [6, -62]]), '#b6d2e3', { size: 40, hatch: false });
    shape(P.R(-122, -32, 244, 8), '#9aa0aa', { size: 60, hatch: false, lw: 1.6 });
    for (const wx of [-70, 72]) { shape(P.E(wx, -18, 24, 24), '#3a3a48', { size: 50, hatch: false }); shape(P.E(wx, -18, 10, 10), '#b9bec8', { size: 20, hatch: false }); }
  });
}
function fence(x0, x1, y, h = 90) {
  shape(P.R(x0, y - h, x1 - x0, h), '#d7b98e', { size: 400, ha: 90, gap: 22, hatchColor: '#b8946a' });
  line([[x0, y - h + 20], [x1, y - h + 20]], '#a88560', 3); line([[x0, y - 25], [x1, y - 25]], '#a88560', 3);
}
function jet(x, y, s, flip = 1, o = {}) {
  at(x, y, s, o.rot || 0, () => {
    const c = X(); c.scale(flip, 1);
    shape(P.poly([[210, -32], [250, -140], [292, -140], [292, -30]]), C.red, { size: 120 });
    shape(P.poly([[-40, 10], [40, 6], [150, -60], [120, -62]]), '#9aa3b5', { size: 120, alpha: 0.9 }); // far wing
    shape('M-250 -34 L240 -34 L300 -22 L300 6 L240 34 L-250 34 Q-306 30 -306 4 Q-304 -28 -250 -34Z', '#f5f1e8', { size: 600, gap: 9 });
    shape(P.R(-260, 2, 500, 9), '#4c76a6', { size: 300, hatch: false, lw: 1.5 });
    for (let wx = -215; wx < 200; wx += 21) { c.fillStyle = '#3d4f72'; c.beginPath(); c.ellipse(wx, -12, 4.5, 6, 0, 0, 7); c.fill(); }
    shape(P.poly([[-282, -18], [-255, -26], [-246, -10], [-276, -6]]), '#3d4f72', { size: 40, hatch: false });
    shape(P.poly([[-70, 14], [40, 14], [170, 118], [128, 122]]), '#b8bfcc', { size: 200 });
    shape(P.RR(-20, 42, 100, 34, 14), '#c9cfda', { size: 100 });
    shape(P.poly([[238, -6], [312, -18], [322, -6], [262, 12]]), '#b8bfcc', { size: 80 });
  });
}
function contrail(x0, y0, x1, y1, a = 1) { const c = X(); c.save(); c.globalAlpha *= 0.55 * a; c.strokeStyle = '#ffffff'; c.lineCap = 'round'; c.lineWidth = 9 * L.scl() > 0 ? 9 : 9; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore(); }
function skyline(x, y, s, seedv = 3, col = '#9fb0c6', n = 16) {
  at(x, y, s, 0, () => {
    const r = rng(seedv); let bx = -n * 30;
    for (let i = 0; i < n; i++) { const w = 40 + r() * 40, h = 80 + r() * (i > n * 0.35 && i < n * 0.7 ? 300 : 140); shape(P.R(bx, -h, w, h), mix(col, '#c7d3e0', r() * 0.5), { size: Math.max(w, h), lw: 1.8, gap: 8 }); bx += w + 4; }
  });
}
function hills(y, col1 = '#b9b88a', col2 = '#9fae7e', w = 1300) {
  shape(`M${-w / 2} ${y} Q${-w / 4} ${y - 160} 0 ${y - 70} Q${w / 4} ${y - 200} ${w / 2} ${y - 60} L${w / 2} ${y + 300} L${-w / 2} ${y + 300}Z`, col1, { size: 800, gap: 9 });
  shape(`M${-w / 2} ${y + 40} Q${-w / 5} ${y - 60} ${w / 8} ${y + 10} Q${w / 3} ${y - 70} ${w / 2} ${y + 20} L${w / 2} ${y + 300} L${-w / 2} ${y + 300}Z`, col2, { size: 800, gap: 9 });
}
function pole(x, y, h = 700, s = 1) {
  at(x, y, s, 0, () => {
    shape(P.poly([[-10, 0], [-7, -h], [7, -h], [10, 0]]), '#8a6a4a', { size: h, ha: 85, gap: 9 });
    shape(P.R(-90, -h + 50, 180, 14), '#7a5c40', { size: 180, hatch: false });
    for (const ix of [-75, 0, 75]) shape(P.RR(ix - 6, -h + 28, 12, 24, 4), '#cfd6dd', { size: 20, hatch: false, lw: 1.5 });
  });
}
function wires(x0, x1, y, sag = 60, color = '#2f2f3f') { for (const ox of [-75, 0, 75]) { const c = X(); c.save(); c.strokeStyle = color; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x0 + ox, y); c.quadraticCurveTo((x0 + x1) / 2 + ox, y + sag * 2, x1 + ox, y); c.stroke(); c.restore(); } }
function tower(x, y, s) {
  at(x, y, s, 0, () => {
    shape(P.poly([[-46, 0], [-34, -470], [34, -470], [46, 0]]), '#dcd6c8', { size: 470, gap: 9 });
    shape(P.poly([[-60, -470], [60, -470], [118, -540], [-118, -540]]), '#cfc8b8', { size: 240 });
    shape(P.poly([[-118, -540], [118, -540], [104, -620], [-104, -620]]), '#3f5a7a', { size: 240, hatchColor: '#5b7a9c' });
    for (let i = -3; i <= 3; i++) line([[i * 30, -540], [i * 27, -620]], '#cfc8b8', 3);
    shape(P.poly([[-120, -620], [120, -620], [90, -650], [-90, -650]]), '#cfc8b8', { size: 240 });
    line([[0, -650], [0, -720]], NAVY, 3); shape(P.E(0, -722, 6, 6), C.red, { size: 10, hatch: false });
  });
}
function sparkleStars(x, y, r, n = 6, col = '#ffffff') { const c = X(); c.save(); c.strokeStyle = col; c.lineWidth = 3; for (let i = 0; i < n; i++) { const a = i / n * 6.28 + S.t; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke(); } c.restore(); }

module.exports = { at, head, chair, chairBack, chairSeat, chairFront, larrySeated, person, balloons, cloud, house, palm, bush, car, fence, jet, contrail, skyline, hills, pole, wires, tower, sparkleStars, CL };
