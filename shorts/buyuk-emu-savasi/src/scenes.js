// Scene timeline for "Büyük Emu Savaşı" — narration is the master clock.
const E = require('./engine');
const Ch = require('./chars');
const { W, H, C, hash, lerp, clamp, inv, ease, mix, shape, line, strokes, wash, ellipsePts, rectPts, circle, font } = E;
const TAU = Math.PI * 2;

// ---------------- narration master timeline ----------------
const SENT = [
  { t: 0.00, text: 'Avustralya ordusu 1932’de, devekuşuna benzeyen kuşlara makineli tüfeklerle savaş açtı… ve baş edemedi.' },
  { t: 9.17, text: 'Bu kuşların adı emuydu.' },
  { t: 11.61, text: 'Binlerce emu Batı Avustralya’daki çiftliklere zarar verince askerler bölgeye gönderildi.' },
  { t: 18.12, text: 'Askerler makineli tüfeklerle ateş açtı ama emular gruplara ayrılıp hızla kaçtı.' },
  { t: 24.33, text: 'Silahlar sık sık tutukluk yaptı ve operasyon beklenen sonucu vermedi.' },
  { t: 29.57, text: 'Günler süren çabaya rağmen emuların büyük kısmı bölgede kalmaya devam etti.' },
  { t: 35.38, text: 'Bu olay tarihe Büyük Emu Savaşı olarak geçti.' },
  { t: 39.36, text: 'İnanması güç ama bu gerçekten yaşandı.', l1: 'İnanması güç ama', l2: 'bu gerçekten yaşandı.', t2: 40.72 },
];
const DUR = 44.04;

// gun bursts (shared with audio)
const BURSTS = [[1.10, 1.80], [4.90, 5.70], [19.88, 20.80], [24.38, 24.92]];
const firing = t => BURSTS.some(([a, b]) => t >= a && t < b);
const flashOn = t => firing(t) && (Math.floor(t * 30) % 3 !== 2);

// ---------------- helpers ----------------
function cam(ctx, c) {
  ctx.translate(W / 2, H / 2);
  if (c.r) ctx.rotate(c.r);
  ctx.scale(c.z ?? 1, c.z ?? 1);
  ctx.translate(-(c.x ?? W / 2), -(c.y ?? H / 2));
}
function shake(t, amt, seed = 1) { return [(E.noise1(t * 25, seed) - 0.5) * 2 * amt, (E.noise1(t * 25, seed + 9) - 0.5) * 2 * amt]; }
function handheld(t, amt = 4) { return [(E.noise1(t * 0.6, 3) - 0.5) * amt * 2, (E.noise1(t * 0.6, 8) - 0.5) * amt * 2]; }

// perspective scale for ground objects
const ps = (y, hor, ref = 1500) => clamp(0.1 + 0.9 * (y - hor) / (ref - hor), 0.04, 3);

// sky + far hills + ground. o: {hor, skyCol, groundCol, x0,x1, t, seed, hills}
function landscape(ctx, o) {
  const hor = o.hor, x0 = o.x0 ?? -900, x1 = o.x1 ?? W + 900, seed = o.seed ?? 1, t = o.t ?? 0;
  const skyCol = o.skyCol || C.sky;
  wash(ctx, [[x0, -1400], [x1, -1400], [x1, hor + 10], [x0, hor + 10]], skyCol, { tint: 0.5, texAlpha: 0.5 });
  // sky pencil strokes
  const ss = [];
  for (let i = 0; i < 46; i++) {
    const y = lerp(-300, hor - 40, hash(seed, i)), x = lerp(x0, x1, hash(seed, i, 1)), l = 80 + hash(seed, i, 2) * 220;
    ss.push([x, y, x + l, y - 6 + hash(seed, i, 3) * 12]);
  }
  strokes(ctx, ss, mix(skyCol, C.ink, 0.12), 2.4, 0.35);
  if (o.sunPos) Ch.sun(ctx, o.sunPos[0], o.sunPos[1], o.sunR ?? 60, seed + 5, o.sunCol);
  if (o.clouds !== false) {
    for (let i = 0; i < (o.nClouds ?? 3); i++) {
      const cx = ((lerp(x0, x1, hash(seed, i, 7)) + t * (o.cloudSpeed ?? 12) * (0.6 + hash(seed, i, 8))) - x0) % (x1 - x0) + x0;
      const cy = lerp(o.cloudY0 ?? 520, o.cloudY1 ?? hor - 140, hash(seed, i, 9));
      Ch.cloud(ctx, cx, cy, 0.7 + hash(seed, i, 10) * 0.5, seed + i * 3);
    }
  }
  if (o.hills !== false) {
    const hp = [[x0, hor + 10]];
    for (let i = 0; i <= 24; i++) { const x = lerp(x0, x1, i / 24); hp.push([x, hor - 26 - 40 * E.noise1(i * 0.7, seed + 2) - 30 * E.noise1(i * 0.23, seed + 4)]); }
    hp.push([x1, hor + 10]);
    shape(ctx, hp, { fill: o.hillCol || C.hillFar, seed: seed + 30, lw: 3.5, stroke: mix(C.inkSoft, C.paper, 0.3), tint: 0.45 });
  }
  const gc = o.groundCol || C.ground;
  shape(ctx, [[x0, hor], [x1, hor], [x1, 3200], [x0, 3200]], { fill: gc, seed: seed + 40, lw: 4, smooth: false, tint: 0.3, hatch: { color: mix(gc, C.groundDark, 0.6), angle: -0.25, gap: 14, alpha: 0.3 } });
  // red-earth patches + ground strokes
  for (let i = 0; i < (o.patches ?? 7); i++) {
    const py = lerp(hor + 30, hor + 1100, Math.pow(hash(seed, i, 20), 1.4)), sc = ps(py, hor);
    const px = lerp(x0, x1, hash(seed, i, 21));
    shape(ctx, ellipsePts(px, py, 160 * sc + 20, 26 * sc + 4, 14, 0, 0.3, seed + i), { fill: C.redEarth, stroke: null, seed: seed + 50 + i, alpha: 0.45 });
  }
  const gs = [];
  for (let i = 0; i < 160; i++) {
    const py = lerp(hor + 6, 2400, Math.pow(hash(seed, i, 30), 1.6)), sc = ps(py, hor);
    const px = lerp(x0, x1, hash(seed, i, 31)), l = (20 + 40 * hash(seed, i, 32)) * sc;
    gs.push([px, py, px + l, py + (hash(seed, i, 33) - 0.5) * 4]);
  }
  strokes(ctx, gs, C.groundDark, 2.4, 0.55);
}

// ---------------- motion tracks ----------------
// keys: [[t,x,y],...] catmull-rom path; returns sampler with face/phase from integrated motion
function track(keys, o = {}) {
  const dt = 1 / 60, t0 = keys[0][0], t1 = keys[keys.length - 1][0];
  const P = (i) => keys[clamp(i, 0, keys.length - 1)];
  const pos = (t) => {
    if (t <= t0) return [keys[0][1], keys[0][2]];
    if (t >= t1) { const k = keys[keys.length - 1]; return [k[1], k[2]]; }
    let i = 0; while (keys[i + 1][0] < t) i++;
    const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    return [cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
  };
  const n = Math.ceil((t1 - t0) / dt) + 2, X = [], Y = [], D = [], F = [], V = [];
  let d = 0, f = o.face ?? 1;
  for (let i = 0; i < n; i++) {
    const t = t0 + i * dt, p = pos(t), q = pos(t + dt);
    const vx = (q[0] - p[0]) / dt, vy = (q[1] - p[1]) / dt, sp = Math.hypot(vx, vy);
    if (Math.abs(vx) > 25) f = Math.sign(vx);
    X.push(p[0]); Y.push(p[1]); F.push(f); V.push(sp);
    const sc = o.scaleAt ? o.scaleAt(p[1]) : 1;
    d += sp * dt / Math.max(0.05, sc);
    D.push(d);
  }
  return (t) => {
    const i = clamp(Math.round((t - t0) / dt), 0, n - 1);
    const sc = o.scaleAt ? o.scaleAt(Y[i]) : 1;
    const sp = V[i] / Math.max(0.05, sc);
    const run = clamp(sp / 150);
    return { x: X[i], y: Y[i], face: F[i], phase: (D[i] / 280) % 1, run: run > 0.08 ? Math.max(run, 0.45) : 0, speed: sp };
  };
}

// dust trail behind a track (spawn puffs at feet)
function dustTrail(ctx, tr, t, t0, o = {}) {
  const every = o.every ?? 0.22, life = o.life ?? 1.1;
  const start = Math.max(t0, Math.floor((t - life) / every) * every);
  for (let ts = start; ts <= t; ts += every) {
    const age = t - ts; if (age < 0 || age > life) continue;
    const p = tr(ts); if (p.run < 0.3) continue;
    const sc = (o.scaleAt ? o.scaleAt(p.y) : 1) * (o.s ?? 1);
    const k = age / life;
    Ch.dustPuff(ctx, p.x - p.face * 50 * sc - p.face * age * 20, p.y - 10 * sc - age * 30 * sc, (18 + 50 * ease.o(k)) * sc, { seed: Math.floor(ts * 100) + (o.seed ?? 0), alpha: (1 - k) * 0.85, n: 4 });
  }
}

// dust kicked by bullets hitting ground (never on birds)
function impacts(ctx, t, spots, burst, seed) {
  const [a, b] = burst;
  for (let k = 0; k < spots.length; k++) {
    const ts = a + (b - a) * (k / spots.length);
    const age = t - ts; if (age < 0 || age > 0.75) continue;
    const [x, y, s] = spots[k], q = age / 0.75;
    Ch.dustPuff(ctx, x, y - 30 * s * q, (14 + 46 * ease.o(q)) * s, { seed: seed + k, alpha: 1 - q, n: 4 });
    if (age < 0.12) { // little spray
      strokes(ctx, [[x, y, x - 14 * s, y - 40 * s], [x, y, x + 12 * s, y - 44 * s], [x, y, x + 2 * s, y - 52 * s]], C.dustDark, 3 * s, 0.9);
    }
  }
}
function casings(ctx, t, burst, origin, dir, s) {
  const [a, b] = burst;
  for (let ts = a; ts < b; ts += 0.11) {
    const age = t - ts; if (age < 0 || age > 0.6) continue;
    const x = origin[0] + dir * (-40 - 160 * age) * s, y = origin[1] + (-120 * age + 520 * age * age) * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(age * 20);
    shape(ctx, rectPts(-6 * s, -3 * s, 12 * s, 6 * s, 1), { fill: '#D8A84A', lw: 1.6, seed: Math.floor(ts * 100), smooth: false, double: false });
    ctx.restore();
  }
}
function smokePuffs(ctx, t, burst, at, s) {
  const [a, b] = burst;
  for (let ts = a; ts < b + 0.01; ts += 0.18) {
    const age = t - ts; if (age < 0 || age > 1.4) continue;
    const q = age / 1.4;
    ctx.save(); ctx.globalAlpha *= (1 - q) * 0.55;
    shape(ctx, ellipsePts(at[0] + 40 * s * q + 30 * s * age, at[1] - 60 * s * q, (14 + 40 * q) * s, (12 + 30 * q) * s, 12, 0, 0.2, Math.floor(ts * 50)), { fill: '#D9D4CB', stroke: mix(C.inkSoft, C.paper, 0.5), lw: 2, seed: Math.floor(ts * 50), double: false });
    ctx.restore();
  }
}

// big dust wipe: p in [0,1] coverage
function dustWipe(ctx, p, seed, dir = 1) {
  if (p <= 0) return;
  const cols = 4, rows = 7;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = r * cols + c;
    const delay = (dir > 0 ? c / cols : (cols - 1 - c) / cols) * 0.35 + hash(seed, k) * 0.15;
    const q = ease.o(clamp((p - delay) / (1 - 0.5)));
    if (q <= 0) continue;
    const x = (c + 0.5) * W / cols + (hash(seed, k, 1) - 0.5) * 120, y = (r + 0.5) * H / rows + (hash(seed, k, 2) - 0.5) * 120;
    Ch.dustPuff(ctx, x, y, 260 * q + 10, { seed: seed + k, n: 6 });
  }
}
function whip(ctx, p, dir = 1, seed = 1) { // whip-pan transition overlay, p 0..1 (peak at .5)
  const a = Math.sin(clamp(p) * Math.PI);
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a * 0.92; ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  const st = [];
  for (let i = 0; i < 90; i++) {
    const y = hash(seed, i) * H, x = (hash(seed, i, 1) * 1.6 - 0.3) * W + dir * (p - 0.5) * 900, l = 200 + hash(seed, i, 2) * 600;
    st.push([x, y, x + l, y + (hash(seed, i, 3) - 0.5) * 8]);
  }
  strokes(ctx, st.slice(0, 45), mix(C.groundDark, C.paper, 0.2), 3, 0.7);
  strokes(ctx, st.slice(45), mix(C.inkSoft, C.paper, 0.3), 2.2, 0.55);
  ctx.restore();
}
function fadeTo(ctx, a, col = C.paper) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }

// grip point of the Lewis gun in world coords (gun-local point gl)
function gunPoint(g, o, gl) {
  const s = o.s ?? 1, face = o.face ?? 1, a = -(o.aim ?? 0);
  const pv = o.mount === 'tripod' || !o.mount ? [0, -120] : o.mount === 'bipod' ? [60, -40] : [0, 0];
  const lx = pv[0] + Math.cos(a) * gl[0] - Math.sin(a) * gl[1], ly = pv[1] + Math.sin(a) * gl[0] + Math.cos(a) * gl[1];
  return [o.x + lx * s * face, o.y + ly * s];
}
const toLocal = (P, w) => [(w[0] - P.x) / ((P.s ?? 1) * (P.face ?? 1)), (w[1] - P.y) / (P.s ?? 1)];

// draw a list of {y, draw} sorted by depth
function depthDraw(list) { list.sort((a, b) => a.y - b.y); for (const d of list) d.draw(); }

// ===================================================================
// SCENE 1 — hook: soldiers + Lewis gun vs running emus (0 – 9.17)
// ===================================================================
const S1 = (() => {
  const hor = 820, sc = y => ps(y, hor) * 1.18;
  // a stream of emus running left→right across the mid-ground; at ~7.3s they split in all directions
  const lanes = [1010, 1150, 1060, 1260, 1110, 1200, 1300, 1040, 1180, 1090, 1240, 1020];
  const split = [[1.0, -0.5], [0.3, 1.0], [-1, -0.25], [1, 0.5], [-0.6, -0.6], [-1, 0.6], [0.2, 1], [1, -0.6], [-0.4, 0.9], [-1, -0.1], [0.9, 0.9], [0.5, -0.8]];
  const tracks = lanes.map((y, i) => {
    const sp = 108 + 22 * hash(i, 3);
    const x0 = -720 + i * 150 + (hash(i, 5) - 0.5) * 60;
    const ts = 7.3 + hash(i, 4) * 0.25;
    const xs = x0 + sp * ts;
    const [dx, dy] = split[i];
    const k = [[-2.5, x0 - sp * 2.5, y], [ts, xs, y]];
    k.push([ts + 0.5, xs + dx * 230 + 60, clamp(y + dy * 150, hor + 40, 2100)]);
    k.push([ts + 2.2, xs + dx * 1050 + 120, clamp(y + dy * 650, hor + 30, 2400)]);
    return track(k, { scaleAt: sc });
  });
  const gun = { x: 300, y: 1640, s: 1.35, face: 1, mount: 'tripod' };
  return { hor, sc, tracks, gun };
})();
function scene1(ctx, t) {
  const { hor, sc, tracks, gun } = S1;
  const hh = handheld(t, 5);
  const sh = firing(t) ? shake(t, 4) : [0, 0];
  const z = lerp(1.04, 1.0, ease.sine(t / 9));
  ctx.save();
  cam(ctx, { x: 540 + hh[0] + sh[0], y: 990 + hh[1] + sh[1], z });
  landscape(ctx, { hor, t, seed: 11, nClouds: 3, cloudY0: 520, cloudY1: 660, patches: 4 });
  Ch.gumTree(ctx, 1010, hor + 8, 0.42, 4, t);
  Ch.gumTree(ctx, 120, hor + 4, 0.34, 9, t);
  Ch.grassTufts(ctx, -300, 1500, hor + 20, 2000, 120, 3, t, null, y => sc(y));
  const list = [];
  tracks.forEach((tr, i) => {
    const p = tr(t), s = sc(p.y);
    if (p.x < -300 || p.x > 1400) return;
    list.push({ y: p.y, draw: () => { dustTrail(ctx, tr, t, -2, { scaleAt: sc, seed: i * 1000 }); Ch.emu(ctx, { x: p.x, y: p.y, s, face: p.face, run: Math.max(p.run, 0.8), phase: p.phase, t, seed: 20 + i }); } });
  });
  list.push({ y: 1215, draw: () => Ch.bush(ctx, 1150, 1215, 0.6, 31) });
  list.push({ y: 980, draw: () => Ch.bush(ctx, 560, 980, 0.38, 32) });
  // gun aim tracks the visible flock
  let cx = 0, cy = 0, n = 0;
  tracks.forEach(tr => { const p = tr(Math.min(t, 7.3)); if (p.x > 450 && p.x < 1150) { cx += p.x; cy += p.y; n++; } });
  if (n) { cx /= n; cy /= n; } else { cx = 800; cy = 1150; }
  const pivot = [gun.x, gun.y - 120 * gun.s];
  let aim = clamp(Math.atan2(pivot[1] - (cy - 120), cx - pivot[0]) * 0.8, 0.12, 0.62);
  if (t > 7.3) aim += Math.sin((t - 7.3) * 7) * 0.16 * clamp((t - 7.3) * 3);
  const G = Object.assign({}, gun, { aim, firing: firing(t), t, seed: 9 });
  // bullet dust hits the ground near — never on — the birds
  const spots1 = [[700, 1395, 0.7], [960, 1380, 0.7], [820, 1440, 0.8], [600, 1330, 0.6], [1060, 1420, 0.75], [760, 1350, 0.65]];
  const spots2 = [[880, 1400, 0.75], [1030, 1360, 0.7], [700, 1420, 0.8], [1150, 1390, 0.75], [940, 1450, 0.85], [800, 1330, 0.65], [1080, 1450, 0.85]];
  list.push({ y: 1330, draw: () => { impacts(ctx, t, spots1, BURSTS[0], 100); impacts(ctx, t, spots2, BURSTS[1], 200); } });
  const gunnerP = { x: gun.x - 150 * 1.3, y: gun.y + 6, s: 1.3, face: 1 };
  const grip = gunPoint(null, G, [-58, 40]), stock = gunPoint(null, G, [-20, 18]);
  list.push({
    y: 1650, draw: () => {
      Ch.person(ctx, Object.assign({}, gunnerP, { pose: 'kneel', t, seed: 41, hands: { l: toLocal(gunnerP, stock), r: toLocal(gunnerP, grip) }, brow: t > 7.4 ? 1 : 0 }));
      const L = Ch.lewis(ctx, G);
      if (flashOn(t)) Ch.muzzleFlash(ctx, L.muzzle[0], L.muzzle[1], -aim, 54, Math.floor(t * 30));
      smokePuffs(ctx, t, BURSTS[0], L.muzzle, 1.2); smokePuffs(ctx, t, BURSTS[1], L.muzzle, 1.2);
      casings(ctx, t, BURSTS[0], gunPoint(null, G, [-10, -10]), -1, 1.3); casings(ctx, t, BURSTS[1], gunPoint(null, G, [-10, -10]), -1, 1.3);
    }
  });
  // spotter with binoculars; when the birds split he looks left and right
  const spP = { x: 830, y: 1830, s: 1.3, face: 1 };
  const split = t > 7.35;
  const look = split ? (Math.floor((t - 7.35) * 2.6) % 2 ? -1 : 1) : 1;
  list.push({ y: 1830, draw: () => Ch.person(ctx, Object.assign({}, spP, { t, seed: 42, look, brow: split ? 1 : 0, binoc: !split, hands: !split ? { l: [44, -272], r: [30, -264] } : { l: [70, -230], r: [-40, -160] } })) });
  depthDraw(list);
  ctx.restore();
  if (t > 8.35) dustWipe(ctx, inv(8.35, 9.17, t), 77, 1);
}

// ===================================================================
// SCENE 2 — "Bu kuşların adı emuydu." isolate one emu (9.17 – 11.61)
// ===================================================================
function scene2(ctx, t) {
  const lt = t - 9.17;
  const z = lerp(1.0, 1.05, ease.sine(lt / 2.4));
  ctx.save(); cam(ctx, { x: 540, y: 1080, z });
  // spotlight oval frame on clean paper
  const sp = ellipsePts(540, 1160, 470, 520, 36, 0, 0.03, 5);
  wash(ctx, sp, C.skyWarm, { smooth: true, tint: 0.55, texAlpha: 0.45, hatch: { color: mix(C.skyWarm, C.groundDark, 0.4), gap: 13, alpha: 0.25, angle: -0.8 } });
  shape(ctx, sp, { stroke: C.inkSoft, lw: 3.5, seed: 6, fill: null });
  shape(ctx, ellipsePts(540, 1590, 380, 50, 20, 0, 0.1, 7), { fill: C.ground, seed: 8, lw: 3, tint: 0.35 });
  Ch.grassTufts(ctx, 200, 880, 1570, 1610, 18, 12, t);
  // the emu: stands, blinks, looks, then runs off left
  let x = 470, face = 1, run = 0, phase = 0;
  if (t > 10.85) { const q = t - 10.85; face = -1; run = clamp(q * 3); x = 470 - 900 * q * q * 0.9 - 200 * q; phase = (q * 2.6) % 1; }
  const blink = (lt > 0.75 && lt < 0.85) || (lt > 1.7 && lt < 1.78);
  const look = 1;
  ctx.save();
  shape(ctx, ellipsePts(x + 10, 1588, 140, 20, 16), { fill: mix(C.groundDark, C.ink, 0.2), stroke: null, alpha: 0.35, seed: 9 });
  Ch.emu(ctx, { x, y: 1590, s: 2.05, face, run, phase, t, seed: 7, blink, look, headRot: Math.sin(lt * 2.2) * 0.08 });
  ctx.restore();
  ctx.restore();
  // dust cloud clearing from scene 1, then forming for the map
  if (lt < 0.55) dustWipe(ctx, 1 - ease.io(lt / 0.55), 77, -1);
  if (t > 10.95) {
    const q = inv(10.95, 11.61, t);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + q * 2;
      Ch.dustPuff(ctx, 540 + Math.cos(a) * 260 * (1 - q * 0.3), 1150 + Math.sin(a) * 300 * (1 - q * 0.3), 60 + 140 * ease.o(q), { seed: 300 + i, alpha: Math.min(1, q * 2), n: 5 });
    }
  }
}

// ===================================================================
// SCENE 3 — map → farm damage → soldiers sent (11.61 – 18.12)
// ===================================================================
const AUS = [[142.5, -10.7], [143.6, -14.0], [145.3, -15.5], [145.8, -16.9], [146.3, -18.8], [148.8, -20.4], [149.6, -22.3], [150.8, -23.5], [152.8, -25.3], [153.4, -27.5], [153.6, -28.9], [153.0, -31.0], [152.0, -32.8], [151.2, -33.9], [150.2, -35.8], [149.9, -37.5], [148.0, -37.9], [146.4, -39.1], [144.9, -38.2], [143.5, -38.8], [141.6, -38.4], [139.8, -37.0], [139.0, -35.6], [138.1, -35.6], [138.5, -34.6], [137.8, -32.6], [137.1, -34.0], [135.9, -34.8], [135.2, -33.6], [134.0, -32.6], [131.2, -31.5], [129.0, -31.7], [126.0, -32.3], [124.0, -33.0], [121.9, -33.9], [119.0, -34.5], [117.9, -35.1], [115.1, -34.4], [115.6, -33.3], [115.7, -32.0], [115.0, -30.0], [114.6, -28.8], [113.4, -26.2], [113.6, -24.6], [113.6, -22.6], [114.1, -21.8], [116.7, -20.6], [118.6, -20.3], [121.0, -19.5], [122.2, -18.0], [123.5, -16.6], [124.8, -15.0], [126.9, -13.8], [128.1, -15.0], [129.6, -14.8], [129.5, -13.5], [130.8, -12.4], [132.4, -11.5], [134.5, -12.0], [136.8, -12.2], [135.9, -13.4], [135.5, -14.8], [137.2, -16.0], [139.3, -17.4], [140.8, -17.5], [141.6, -15.0], [141.6, -12.6], [142.5, -10.7]];
const TAS = [[144.7, -40.7], [146.6, -41.1], [148.3, -40.9], [148.3, -42.2], [147.9, -43.2], [146.9, -43.6], [145.9, -43.4], [145.2, -42.2]];
const WAi = AUS.findIndex(p => p[0] === 129.0); // south border point
const WA = (() => { const out = []; for (let i = WAi; i < AUS.length; i++) { out.push(AUS[i]); if (AUS[i][0] === 129.6 && AUS[i][1] === -14.8) break; } out.push([129.0, -14.9]); return out; })();
const mapXY = (p) => [540 + (p[0] - 133.5) * 22.5, 1170 - (p[1] + 26.5) * 24.5];
function drawMap(ctx, t) {
  const lt = t - 11.61;
  const draw = ease.io(lt / 0.75);
  const pts = AUS.map(mapXY);
  // land fill fades in after outline
  ctx.save(); ctx.globalAlpha *= ease.o(inv(0.35, 0.9, lt));
  shape(ctx, pts, { fill: C.dust, stroke: null, seed: 3, smooth: false, tint: 0.4, hatch: { color: C.dustDark, gap: 12, alpha: 0.3 } });
  shape(ctx, TAS.map(mapXY), { fill: C.dust, stroke: null, seed: 4, smooth: false, tint: 0.4 });
  ctx.restore();
  // Western Australia highlight ("Batı Avustralya'daki" ≈ 12.7s)
  const wa = ease.o(inv(12.55, 13.05, t));
  if (wa > 0) {
    ctx.save(); ctx.globalAlpha *= wa;
    shape(ctx, WA.map(mapXY), { fill: C.redEarth, seed: 5, smooth: false, lw: 3, stroke: C.inkSoft, hatch: { color: '#9C5233', gap: 9, alpha: 0.45 } });
    ctx.restore();
  }
  // outline drawn progressively
  ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const jp = E.jit(pts, 1.4, 12);
  const n = Math.max(2, Math.floor(jp.length * draw));
  ctx.beginPath(); ctx.moveTo(jp[0][0], jp[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(jp[i][0], jp[i][1]); ctx.stroke();
  if (draw > 0.95) { const tp = E.jit(TAS.map(mapXY), 1.2, 13); ctx.beginPath(); tp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
  // "binlerce" — streams of tiny emus moving into the south-west wheatbelt
  const target = mapXY([117.2, -31.6]);
  for (let i = 0; i < 70; i++) {
    const st = 11.75 + hash(i, 1) * 1.2, q = clamp((t - st) / 1.6);
    if (q <= 0) continue;
    const src = mapXY([lerp(119, 128, hash(i, 2)), lerp(-22, -31, hash(i, 3))]);
    const e = ease.io(q);
    const x = lerp(src[0], target[0] + (hash(i, 4) - 0.5) * 120, e), y = lerp(src[1], target[1] + (hash(i, 5) - 0.5) * 90, e);
    Ch.emu(ctx, { x, y, s: 0.075, face: -1, run: q < 1 ? 1 : 0, phase: (t * 3 + hash(i, 6)) % 1, t, seed: i, sil: C.emuDark });
  }
}
const S3 = (() => {
  const hor = 760, sc = y => ps(y, hor, 1500);
  // flock moving right→left through crops, eating
  const flock = [];
  for (let i = 0; i < 18; i++) {
    const y = lerp(840, 1330, (i * 0.618) % 1), x0 = lerp(120, 1450, (i / 18) + (hash(i, 12) - 0.5) * 0.08);
    const sp = lerp(40, 90, hash(i, 13)) * sc(y);
    flock.push({ y, tr: track([[13.0, x0, y], [15.6, x0 - sp * 2.6, y + 10], [18.2, x0 - sp * 5.2, y]], { scaleAt: sc }), seed: 60 + i, peckOff: hash(i, 14) * 5 });
  }
  const truckTr = track([[15.2, -520, 1250], [16.35, 260, 1250], [16.75, 330, 1250], [18.2, 330, 1250]], { scaleAt: sc });
  return { hor, sc, flock, truckTr };
})();
function crops(ctx, t, hor, sc, flock) {
  // wheat rows parallel to horizon; damaged where the flock has passed
  for (let r = 0; r < 14; r++) {
    const y = hor + 30 + Math.pow(r / 13, 1.5) * 620, s = sc(y);
    const st = [], dmg = [];
    for (let x = -300; x < 1500; x += 16 * s + 3) {
      let damaged = false;
      if (x > -300) for (const f of flock) {
        const p0 = f.tr(13.0), p = f.tr(t);
        if (Math.abs(f.y - y) < 60 && x < p0.x + 40 && x > p.x - 30) { damaged = true; break; }
      }
      if (r % 4 === 1 && x > 300 && x < 520) damaged = true; // already flattened patch
      const h = (46 + 16 * hash(r, Math.floor(x))) * s, sw = Math.sin(t * 2.2 + x * 0.02) * 5 * s;
      if (damaged) dmg.push([x, y, x + 18 * s, y - 6 * s * hash(r, x, 1)]);
      else st.push([x, y, x + sw * 0.5, y - h * 0.6, x + sw, y - h]);
    }
    strokes(ctx, [[-300, y + 2 * s, 1500, y + 2 * s]], '#8E6238', 5 * s, 0.5);
    strokes(ctx, st, '#8C7A32', 2.6 * Math.max(0.6, s), 0.9);
    strokes(ctx, st.map(a => [a[4] - 2 * s, a[5] - 2 * s, a[4] + 1 * s, a[5] + 11 * s]), '#F1CF6E', 7 * Math.max(0.5, s), 0.95);
    strokes(ctx, st.map(a => [a[4] - 2 * s, a[5] - 2 * s, a[4] + 1 * s, a[5] + 11 * s]), '#B98D34', 1.6 * Math.max(0.5, s), 0.7);
    strokes(ctx, dmg, '#D9C08A', 3.5 * Math.max(0.6, s), 0.9);
    strokes(ctx, dmg.map(a => [a[0] + 4 * s, a[1] - 3 * s, a[2] - 6 * s, a[3] + 4 * s]), '#9C7A45', 1.8 * Math.max(0.6, s), 0.8);
  }
}
function scene3(ctx, t) {
  const lt = t - 11.61;
  if (t < 13.85) {
    // map phase
    const zq = ease.i(inv(13.15, 13.85, t));
    const target = mapXY([117.2, -31.6]);
    ctx.save(); cam(ctx, { x: lerp(540, target[0], zq), y: lerp(1150, target[1], zq), z: lerp(1.0, 7, zq) });
    drawMap(ctx, t);
    ctx.restore();
    // remnants of dust swirl dissolving into the outline
    if (lt < 0.6) { const q = lt / 0.6; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 2 + q; Ch.dustPuff(ctx, 540 + Math.cos(a) * 190, 1150 + Math.sin(a) * 210, 200 * (1 - ease.o(q)) + 1, { seed: 300 + i, alpha: 1 - q, n: 5 }); } }
    if (t > 13.55) fadeTo(ctx, inv(13.55, 13.85, t) * 0.9, C.dust);
    return;
  }
  const { hor, sc, flock, truckTr } = S3;
  const pan = ease.io(inv(15.5, 16.8, t));
  const push = ease.i(inv(17.35, 18.12, t));
  const intro = ease.o(inv(13.85, 14.6, t));
  const hh = handheld(t, 4);
  ctx.save();
  cam(ctx, { x: lerp(560, 430, pan) + hh[0] + lerp(0, -40, push), y: 1000 + hh[1] + lerp(0, 180, push), z: lerp(1.25, 1.0, intro) * lerp(1, 1.06, pan) * lerp(1, 1.9, push) });
  landscape(ctx, { hor, t, seed: 21, nClouds: 3, cloudY0: 520, cloudY1: 620, patches: 0, groundCol: '#C69A62' });
  Ch.farmhouse(ctx, 930, hor + 14, 0.55, 5);
  Ch.windmill(ctx, 760, hor + 16, 0.6, t, 6);
  Ch.gumTree(ctx, 1120, hor + 10, 0.5, 8, t);
  // dirt road
  shape(ctx, [[-700, 1225], [1500, 1215], [1500, 1290], [-700, 1300]], { fill: mix(C.redEarth, C.dust, 0.4), stroke: null, seed: 7, smooth: false, alpha: 0.85 });
  crops(ctx, t, hor, sc, flock);
  Ch.grassTufts(ctx, -500, 1500, 1420, 2100, 90, 23, t, '#8C7A32', y => sc(y));
  const list = [];
  for (const f of flock) {
    const p = f.tr(t), s = sc(p.y);
    const pk = (Math.sin((t + f.peckOff) * 2.4) > 0.55) ? 1 : 0;
    list.push({ y: p.y, draw: () => Ch.emu(ctx, { x: p.x, y: p.y, s, face: -1, run: p.run * 0.6, phase: p.phase, peck: p.run < 0.6 ? pk : 0, t, seed: f.seed }) });
  }
  // fence with broken sections; one post toppled by a passing emu at ~14.3s
  const topple = ease.back(inv(14.2, 14.7, t)) * 0.95;
  const posts = [];
  for (let i = 0; i < 11; i++) posts.push({ x: -260 + i * 150, y: 1395, h: 120, w: 15, lean: i === 6 ? -topple : (i === 3 ? -0.5 : 0) });
  list.push({ y: 1395, draw: () => Ch.fence(ctx, posts, { broken: [3, 6], cut: [2, 3, 5, 6] }) });
  if (t > 14.2 && t < 15.6) list.push({ y: 1400, draw: () => Ch.dustPuff(ctx, 680, 1390, 40 + 70 * ease.o(inv(14.2, 15.0, t)), { seed: 41, alpha: 1 - inv(14.4, 15.6, t) }) });
  // farmers (frustrated, not desperate)
  const fA = { x: 860, y: 1610, s: 1.1, face: -1 }, fB = { x: 1000, y: 1640, s: 1.12, face: -1 };
  const turn = t > 15.9 ? -1 : 1; // turn to look at arriving truck
  list.push({ y: 1610, draw: () => Ch.person(ctx, Object.assign({}, fA, { outfit: 'farmer', t, seed: 51, look: 1, brow: 1, hands: { l: [36, -165], r: [-34, -160] }, headTilt: Math.sin(t * 3) * 0.05 })) });
  list.push({ y: 1640, draw: () => Ch.person(ctx, Object.assign({}, fB, { outfit: 'farmer', t, seed: 52, look: turn, brow: 1, hands: { l: [10 + Math.sin(t * 9) * 4, -330], r: [-30, -160] } })) });
  // truck arrives, soldiers deploy
  const tp = truckTr(t);
  if (t > 15.1) {
    const moving = tp.speed > 5;
    list.push({ y: 1255, draw: () => { if (moving) dustTrail(ctx, truckTr, t, 15.2, { scaleAt: sc, s: 2, seed: 900 }); Ch.truck(ctx, { x: tp.x, y: tp.y, s: sc(tp.y) * 0.95, t, wheelRot: tp.x / 40, driver: true, bounce: moving ? 1 : 0.4 }); } });
    if (t > 16.7) {
      const q = t - 16.7, s = sc(1300) * 1.0;
      // soldier 1 jumps down from the bed and walks carrying the Lewis gun
      const j = clamp(q / 0.35), y1 = lerp(1150, 1300, ease.i(j)) - Math.sin(j * Math.PI) * 30;
      const x1 = lerp(250, 250 + 90 * Math.max(0, q - 0.4), 1);
      list.push({ y: 1300, draw: () => {
        const P = { x: x1, y: y1, s, face: 1 };
        Ch.person(ctx, Object.assign({}, P, { pose: q > 0.4 ? 'walk' : 'crouch', phase: q * 1.6, t, seed: 61, hands: { l: [60, -170], r: [-10, -160] } }));
        Ch.lewis(ctx, { x: x1 + 60 * s, y: y1 - 160 * s, s: s * 0.55, mount: 'none', aim: 0.05, t, seed: 62 });
      } });
      // soldier 2 surveys with binoculars
      list.push({ y: 1310, draw: () => Ch.person(ctx, { x: 470, y: 1310, s, face: 1, t, seed: 63, binoc: true, hands: { l: [44, -270], r: [30, -262] }, alpha: clamp(q * 4) }) });
      // soldier 3 unloads ammunition crate
      list.push({ y: 1290, draw: () => Ch.person(ctx, { x: 170, y: 1290, s, face: -1, t, seed: 64, carry: 'crate', hands: { l: [40, -190], r: [30, -180] }, alpha: clamp((q - 0.3) * 4) }) });
    }
  }
  depthDraw(list);
  ctx.restore();
  if (t > 17.85) whip(ctx, inv(17.85, 18.4, t), 1, 5);
}

// ===================================================================
// SCENE 4 — fire → scatter → empty line → confusion → far away (18.12 – 24.33)
// ===================================================================
const S4 = (() => {
  const hor = 830, sc = y => ps(y, hor, 1500);
  const group = [];
  const cx = 760, cy = 1190;
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * TAU + hash(i, 21) * 0.4, r = 60 + hash(i, 22) * 200;
    const x = cx + Math.cos(a) * r * 1.55, y = cy + Math.sin(a) * r * 0.5;
    // scatter direction: radially outward, some behind bushes, some to the horizon
    let dx = Math.cos(a), dy = Math.sin(a) * 0.5;
    if (i % 4 === 0) { dx *= 0.4; dy = -0.35; }
    const spd = lerp(800, 1250, hash(i, 23));
    const ex = x + dx * spd * 1.7, ey = clamp(y + dy * spd * 1.0, hor + 10, 1900);
    const tr = track([[18.0, x, y], [21.25, x, y], [21.35, x + dx * 30, y + dy * 15], [22.3, lerp(x, ex, 0.75), lerp(y, ey, 0.75)], [23.0, ex, ey]], { scaleAt: sc });
    group.push({ tr, seed: 80 + i, x, y, peckOff: hash(i, 24) * 6, face0: hash(i, 25) < 0.5 ? -1 : 1 });
  }
  const spots = [[560, 1330, 0.6], [980, 1350, 0.6], [470, 1120, 0.45], [1120, 1110, 0.45], [680, 1420, 0.7], [900, 1440, 0.72], [420, 1240, 0.55], [1200, 1230, 0.55], [780, 1470, 0.75]];
  return { hor, sc, group, spots };
})();
function scene4(ctx, t) {
  const { hor, sc, group, spots } = S4;
  // ---- shot A: setup, fire, scatter (18.12 – 21.95)
  if (t < 22.0) {
    const hh = handheld(t, 4);
    const sh = firing(t) ? shake(t, 6) : (t > 21.25 && t < 21.6 ? shake(t, 5, 4) : [0, 0]);
    const z = lerp(1.08, 1.0, ease.o(inv(18.12, 19.0, t))) * lerp(1, 1.06, ease.io(inv(19.0, 19.85, t))) * lerp(1, 0.94, ease.o(inv(21.2, 21.9, t)));
    ctx.save(); cam(ctx, { x: 560 + hh[0] + sh[0], y: 1020 + hh[1] + sh[1], z });
    landscape(ctx, { hor, t, seed: 31, nClouds: 2, cloudY0: 500, cloudY1: 640 });
    Ch.gumTree(ctx, 1110, hor + 8, 0.45, 3, t);
    Ch.grassTufts(ctx, -300, 1400, hor + 20, 2000, 110, 7, t, null, y => sc(y));
    const list = [];
    list.push({ y: 1060, draw: () => Ch.bush(ctx, 380, 1060, 0.5, 33) });
    list.push({ y: 1210, draw: () => Ch.bush(ctx, 1180, 1210, 0.75, 34) });
    list.push({ y: 990, draw: () => Ch.bush(ctx, 1000, 990, 0.42, 35) });
    group.forEach((g, i) => {
      const p = g.tr(t), s = sc(p.y);
      const calm = t < 21.25;
      const alert = clamp((t - 20.0) * 4);
      const pk = calm && Math.sin((t + g.peckOff) * 2.0) > 0.4 ? 1 - alert : 0;
      list.push({ y: p.y, draw: () => {
        if (!calm) dustTrail(ctx, g.tr, t, 21.25, { scaleAt: sc, seed: i * 77, every: 0.12, life: 0.9 });
        Ch.emu(ctx, { x: p.x, y: p.y, s, face: calm ? g.face0 : p.face, run: calm ? 0 : Math.max(p.run, 1), phase: calm ? 0 : p.phase, peck: pk, t, seed: g.seed });
      } });
    });
    list.push({ y: 1250, draw: () => impacts(ctx, t, spots, BURSTS[2], 400) });
    // scatter dust burst
    if (t > 21.2) list.push({ y: 1240, draw: () => { const q = inv(21.2, 22.0, t); for (let k = 0; k < 6; k++) Ch.dustPuff(ctx, 820 + (k - 2.5) * 110, 1150 + (k % 2) * 60, (60 + 120 * ease.o(q)) * 0.9, { seed: 500 + k, alpha: (1 - q) * 0.9, n: 5 }); } });
    // crew
    const gun = { x: 330, y: 1730, s: 1.45, face: 1, mount: 'tripod' };
    const aimT = 0.34;
    let aim = lerp(-0.05, aimT, ease.io(inv(18.5, 19.7, t)));
    if (t > 21.25) aim += Math.sin((t - 21.25) * 9) * 0.18 * clamp((t - 21.25) * 4);
    const G = Object.assign({}, gun, { aim, firing: firing(t), t, seed: 19 });
    const gunner = { x: gun.x - 200, y: gun.y + 6, s: 1.4, face: 1 };
    list.push({ y: 1700, draw: () => {
      Ch.person(ctx, Object.assign({}, gunner, { pose: 'kneel', t, seed: 71, brow: t > 21.3 ? 1 : 0, hands: { l: toLocal(gunner, gunPoint(null, G, [-20, 18])), r: toLocal(gunner, gunPoint(null, G, [-58, 40])) } }));
      const L = Ch.lewis(ctx, G);
      if (flashOn(t)) Ch.muzzleFlash(ctx, L.muzzle[0], L.muzzle[1], -aim, 62, Math.floor(t * 30) + 7);
      smokePuffs(ctx, t, BURSTS[2], L.muzzle, 1.3);
      casings(ctx, t, BURSTS[2], gunPoint(null, G, [-10, -10]), -1, 1.4);
    } });
    const loader = { x: 860, y: 1840, s: 1.35, face: -1 };
    list.push({ y: 1840, draw: () => {
      Ch.person(ctx, Object.assign({}, loader, { pose: 'kneel', t, seed: 72, look: t > 21.4 ? (Math.floor(t * 3) % 2 ? -1 : 1) : -1, brow: t > 21.3 ? 1 : 0, hands: { l: [70, -150], r: [40, -140] } }));
      shape(ctx, ellipsePts(loader.x - 70 * 1.35, loader.y - 150 * 1.35, 60, 15, 16), { fill: C.gun, seed: 73, lw: 3.5 });
    } });
    depthDraw(list);
    ctx.restore();
  }
  // ---- shot B: empty firing line (21.95 – 22.6)
  else if (t < 22.6) {
    const lt = t - 21.95;
    ctx.save(); cam(ctx, { x: 540, y: 1000, z: lerp(1.0, 1.04, lt / 0.65) });
    landscape(ctx, { hor: 900, t, seed: 31, nClouds: 2, cloudY0: 520, cloudY1: 680 });
    Ch.grassTufts(ctx, -100, 1200, 920, 1900, 70, 9, t, null, y => ps(y, 900));
    Ch.bush(ctx, 900, 1060, 0.6, 36);
    for (let k = 0; k < 5; k++) Ch.dustPuff(ctx, 300 + k * 140, 1000 + (k % 2) * 40, 70 + lt * 50, { seed: 520 + k, alpha: 0.7 - lt * 0.8, n: 4 });
    const G = { x: 330, y: 1840, s: 2.0, face: 1, mount: 'tripod', aim: 0.16, t, seed: 19 };
    Ch.lewis(ctx, G);
    smokePuffs(ctx, t, [21.6, 21.7], gunPoint(null, G, [236, 0]), 1.6);
    ctx.restore();
  }
  // ---- shot C: soldiers confused (22.6 – 23.2)
  else if (t < 23.22) {
    const lt = t - 22.6;
    ctx.save(); cam(ctx, { x: 540, y: 1000, z: 1 });
    landscape(ctx, { hor: 980, t, seed: 32, nClouds: 2, cloudY0: 560, cloudY1: 720 });
    Ch.grassTufts(ctx, -100, 1200, 1000, 1900, 50, 10, t, null, y => ps(y, 980));
    const l1 = lt < 0.3 ? -1 : 1, l2 = lt < 0.3 ? 1 : -1;
    Ch.person(ctx, { x: 330, y: 2180, s: 2.3, face: 1, t, seed: 74, look: l1, brow: 1, hands: { l: [70, -270], r: [-30, -150] } });
    Ch.person(ctx, { x: 780, y: 2230, s: 2.35, face: -1, t, seed: 75, look: l2, brow: 1, hands: { l: [40, -170], r: [-36, -160] } });
    ctx.restore();
  }
  // ---- shot D: emus already far away (23.22 – 24.33)
  else {
    const lt = t - 23.22;
    ctx.save(); cam(ctx, { x: 540, y: 1000, z: lerp(1.0, 0.97, lt) });
    landscape(ctx, { hor: 900, t, seed: 33, nClouds: 3, cloudY0: 500, cloudY1: 700 });
    Ch.grassTufts(ctx, -100, 1200, 920, 1900, 80, 11, t, null, y => ps(y, 900));
    for (let i = 0; i < 9; i++) {
      const x = 200 + i * 90 + (lt * 120) * (i % 2 ? 1 : -0.6) + hash(i, 3) * 40, y = 905 + hash(i, 4) * 25;
      Ch.dustPuff(ctx, x - (i % 2 ? 20 : -20), y - 6, 16, { seed: 700 + i + Math.floor(lt * 8), alpha: 0.7, n: 3 });
      Ch.emu(ctx, { x, y, s: 0.17, face: i % 2 ? 1 : -1, run: 1, phase: (t * 3.2 + hash(i, 5)) % 1, t, seed: 90 + i });
    }
    Ch.person(ctx, { x: 820, y: 1880, s: 1.6, face: -1, t, seed: 76, look: -1, brow: 1, hands: { l: [36, -300], r: [-30, -160] } });
    Ch.person(ctx, { x: 980, y: 1940, s: 1.65, face: -1, t, seed: 77, look: -1, brow: 1, hands: { l: [40, -170], r: [-34, -160] } });
    Ch.lewis(ctx, { x: 640, y: 1860, s: 1.0, face: -1, mount: 'tripod', aim: 0.05, t, seed: 19 });
    ctx.restore();
  }
  // cut transitions
  for (const [tc, d] of [[21.95, 1], [22.6, -1], [23.22, 1]]) if (Math.abs(t - tc) < 0.12) whip(ctx, (t - tc + 0.12) / 0.24, d, Math.floor(tc));
  if (t > 24.1) whip(ctx, inv(24.1, 24.56, t), -1, 9);
}

// ===================================================================
// SCENE 5 — jams; operation struggles (24.33 – 29.57)
// ===================================================================
function scene5(ctx, t) {
  if (t < 26.5) {
    // close-up of the Lewis gun
    const lt = t - 24.33;
    const sh = firing(t) ? shake(t, 7) : [0, 0];
    ctx.save(); cam(ctx, { x: 600 + sh[0], y: 1160 + sh[1], z: lerp(1.1, 1.16, lt / 2.2) });
    landscape(ctx, { hor: 980, t, seed: 41, nClouds: 2, cloudY0: 560, cloudY1: 760, hillCol: C.hill });
    // background: emus still running away, unbothered
    for (let i = 0; i < 4; i++) {
      const x = 1100 - ((t - 24.33) * 140 + i * 210) % 1300, y = 1010 + i * 12;
      Ch.emu(ctx, { x, y, s: 0.22, face: -1, run: 1, phase: (t * 3 + i * 0.3) % 1, t, seed: 110 + i });
    }
    const cock = t > 25.38 && t < 25.8 ? Math.sin(inv(25.38, 25.8, t) * Math.PI) : 0;
    const G = { x: 430, y: 1520, s: 2.3, face: 1, mount: 'none', aim: 0.03, t, firing: firing(t), seed: 29, cock };
    // close-up: the soldier's sleeved arms reach in from off-frame (grip + cocking handle)
    const grip = gunPoint(null, G, [-58, 40]);
    const handle = gunPoint(null, G, [-cock * 40, 22]);
    const leftHand = t > 25.15 && t < 26.05 ? handle : gunPoint(null, G, [70, 26]);
    const L0 = Ch.lewis(ctx, G);
    const arm = (from, el, h, seed) => { E.limb(ctx, [from, el, [h[0], h[1] + 30]], 120, C.khaki, { seed, smooth: true, olw: 10 }); strokes(ctx, [[el[0] - 40, el[1] + 30, el[0] + 30, el[1] + 10]], C.khakiDark, 4, 0.7); shape(ctx, ellipsePts(h[0], h[1] + 8, 46, 38, 14, 0.2), { fill: C.skin, seed: seed + 1, lw: 5 }); };
    arm([120, 2060], [150, 1860], grip, 501);
    arm([840, 2080], [lerp(720, 640, cock), 1860], leftHand, 511);
    const L = L0;
    if (flashOn(t)) Ch.muzzleFlash(ctx, L.muzzle[0], L.muzzle[1], -0.03, 90, Math.floor(t * 30) + 3);
    casings(ctx, t, BURSTS[3], gunPoint(null, G, [-10, -10]), -1, 2);
    smokePuffs(ctx, t, [24.95, 25.0], L.muzzle, 1.6);
    smokePuffs(ctx, t, [25.95, 26.0], L.muzzle, 1.1);
    // jam emphasis: small pencil "spark" lines at the receiver when the click happens
    for (const tc of [24.98, 25.95]) {
      const q = (t - tc) / 0.3;
      if (q > 0 && q < 1) {
        const c = gunPoint(null, G, [-20, -10]);
        const st = []; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.4; st.push([c[0] + Math.cos(a) * 60, c[1] + Math.sin(a) * 60, c[0] + Math.cos(a) * (80 + 40 * q), c[1] + Math.sin(a) * (80 + 40 * q)]); }
        strokes(ctx, st, C.ink, 5, 1 - q);
      }
    }
    ctx.restore();
    if (t < 24.56) whip(ctx, inv(24.1, 24.56, t), -1, 9);
    if (t > 26.38) whip(ctx, inv(26.38, 26.62, t), 1, 12);
    return;
  }
  // wide: one soldier works the gun, another watches emus roam the horizon
  const lt = t - 26.5;
  const hor = 900, sc = y => ps(y, hor, 1500);
  const toLine = ease.io(inv(28.6, 29.25, t));
  const gun = { x: 470, y: 1520, s: 1.05, face: 1, mount: 'tripod', aim: lerp(0.06, 0, toLine), t, seed: 39, cock: (Math.floor(t * 1.5) % 2) ? 0.6 : 0 };
  const muz = gunPoint(null, gun, [120, -2]);
  ctx.save();
  cam(ctx, { x: lerp(540, muz[0], toLine), y: lerp(1010, muz[1], toLine), z: lerp(1.0, 5.5, ease.i(toLine)) });
  landscape(ctx, { hor, t, seed: 42, nClouds: 3, cloudY0: 520, cloudY1: 720 });
  Ch.gumTree(ctx, 120, hor + 8, 0.4, 13, t);
  Ch.grassTufts(ctx, -300, 1400, hor + 20, 2000, 100, 13, t, null, y => sc(y));
  Ch.truck(ctx, { x: 260, y: 1150, s: sc(1150) * 0.95, t, face: 1, bounce: 0, cargo: true });
  // emus roam freely across the horizon; one pauses to look back
  for (let i = 0; i < 6; i++) {
    let x = -150 + ((t - 26.5) * 150 + i * 230) % 1500, run = 1, look = 1;
    const y = 960 + (i % 3) * 30;
    if (i === 2) { // the one that looks back
      const stop = clamp((t - 27.2) / 0.1) * (1 - clamp((t - 27.95) / 0.1));
      x = -150 + (Math.min(t, 27.2) - 26.5) * 150 + i * 230 + Math.max(0, t - 27.95) * 150;
      run = 1 - stop; look = stop > 0.5 ? -1 : 1;
    }
    Ch.dustPuff(ctx, x - 30, y - 4, 22 * sc(y) * 2, { seed: 800 + i + Math.floor(t * 6), alpha: run * 0.6, n: 3 });
    Ch.emu(ctx, { x, y, s: sc(y) * 0.9, face: 1, run, phase: (t * 2.6 + i * 0.37) % 1, t, seed: 120 + i, look });
  }
  // watcher shading eyes
  Ch.person(ctx, { x: 130, y: 1640, s: 1.12, face: 1, t, seed: 82, hands: { l: [56, -300], r: [-20, -150] }, brow: 0 });
  // mechanic kneeling at gun
  const P = { x: gun.x - 150, y: gun.y + 4, s: 1.05, face: 1 };
  Ch.person(ctx, Object.assign({}, P, { pose: 'kneel', t, seed: 83, brow: 1, hands: { l: toLocal(P, gunPoint(null, gun, [-(gun.cock) * 40, 20])), r: toLocal(P, gunPoint(null, gun, [-58, 40])) } }));
  Ch.lewis(ctx, gun);
  ctx.restore();
  if (t < 26.62) whip(ctx, inv(26.38, 26.62, t), 1, 12);
  // barrel → horizon line
  if (t > 29.05) {
    const q = inv(29.05, 29.57, t);
    fadeTo(ctx, ease.io(q));
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.globalAlpha = ease.io(q); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-20, H / 2); ctx.lineTo(W + 20, H / 2 + 2); ctx.stroke(); ctx.restore();
  }
}

// ===================================================================
// SCENE 6 — days pass, emus remain (29.57 – 35.38)
// ===================================================================
function skyAt(ph) { // ph: 0..1 within a day (0 dawn, .5 noon, 1 dusk->night)
  const keys = [[0, '#F2C9A5'], [0.2, '#CFE0E2'], [0.75, '#D7DDE0'], [0.9, '#F0B98E'], [1.0, '#8E86B5']];
  for (let i = 0; i < keys.length - 1; i++) if (ph <= keys[i + 1][0]) return mix(keys[i][1], keys[i + 1][1], (ph - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
  return keys[keys.length - 1][1];
}
function scene6(ctx, t) {
  const lt = t - 29.57, hor = 1010, sc = y => ps(y, hor, 1600);
  const dayLen = 1.75, day = Math.floor(lt / dayLen), ph = (lt % dayLen) / dayLen;
  const settle = ease.o(clamp(lt / 0.7));
  const down = ease.io(inv(33.9, 34.6, t));
  ctx.save();
  cam(ctx, { x: 540 + lt * 22 + down * 60, y: lerp(H / 2 + (hor - H / 2) * (1 - settle), 1000, settle) + down * 260, z: lerp(1.15, 1.0, settle) * lerp(1, 1.35, down) });
  const sky = skyAt(ph);
  const sunX = lerp(-80, 1160 + lt * 22, ph), sunY = hor - Math.sin(ph * Math.PI) * 420 - 20;
  landscape(ctx, { hor, t, seed: 51, nClouds: 4, cloudSpeed: 260, cloudY0: 520, cloudY1: 820, skyCol: sky, sunPos: [sunX, sunY], sunR: 56, sunCol: ph > 0.8 ? '#F08A3C' : C.sun, x0: -900, x1: 2200 });
  // night tint between days
  const night = clamp((ph - 0.9) / 0.1) + clamp((0.06 - ph) / 0.06);
  if (night > 0) { ctx.save(); ctx.globalAlpha = night * 0.13; ctx.fillStyle = '#3E3A78'; ctx.fillRect(-900, -1400, 3100, 4600); ctx.restore(); for (let i = 0; i < 14; i++) circle(ctx, hash(i, 1) * 1600 - 100, 520 + hash(i, 2) * 300, 3, { fill: '#FFF2C0', stroke: null, seed: i, alpha: night }); }
  Ch.windmill(ctx, 1450, hor + 12, 0.5, t, 3);
  Ch.gumTree(ctx, 180, hor + 10, 0.45, 15, t);
  Ch.grassTufts(ctx, -500, 2000, hor + 20, 2400, 150, 17, t * 3, null, y => sc(y));
  const list = [];
  // emus wander freely; more appear as time goes on
  const nE = Math.min(16, 7 + day * 3);
  const fpZone = t > 33.9; // keep the footprint lane clear
  for (let i = 0; i < nE; i++) {
    const bx = lerp(-200, 1700, hash(i, 31)), by = lerp(hor + 40, 1750, Math.pow(hash(i, 32), 1.3));
    const wx = bx + Math.sin(lt * 0.9 + i) * 140 + (hash(i, 33) - 0.5) * day * 120, wy = by + Math.cos(lt * 0.7 + i * 2) * 30;
    const vx = Math.cos(lt * 0.9 + i);
    const appear = clamp((lt - Math.max(0, (i - 7) / 3) * dayLen) * 3);
    if (fpZone && wy > 1380) continue;
    list.push({ y: wy, draw: () => Ch.emu(ctx, { x: wx, y: wy, s: sc(wy) * 0.95, face: vx >= 0 ? 1 : -1, run: Math.abs(vx) > 0.5 ? 0.6 : 0, phase: (t * 2.2 + i * 0.3) % 1, peck: Math.abs(vx) <= 0.5 && Math.sin(t * 3 + i) > 0 ? 1 : 0, t, seed: 140 + i, alpha: appear }) });
  }
  // soldiers & truck reposition each day (time-lapse)
  const spots = [[200, 1250], [760, 1180], [1300, 1300], [520, 1400]];
  const d = Math.min(day, spots.length - 1), q = ph;
  const [sx, sy] = spots[d];
  const nx = spots[Math.min(d + 1, spots.length - 1)][0];
  const truckX = q > 0.72 ? lerp(sx - 120, nx - 120, ease.io((q - 0.72) / 0.28)) : sx - 120;
  const truckMoving = q > 0.72 && d < spots.length - 1;
  list.push({ y: sy - 10, draw: () => { if (truckMoving) Ch.dustPuff(ctx, truckX - 200 * sc(sy), sy - 20, 60 * sc(sy), { seed: Math.floor(t * 8), alpha: 0.7, n: 4 }); Ch.truck(ctx, { x: truckX, y: sy - 10, s: sc(sy) * 0.9, t, wheelRot: truckX / 30, bounce: truckMoving ? 1 : 0, face: 1 }); } });
  if (q < 0.72) {
    list.push({ y: sy + 40, draw: () => {
      const s = sc(sy + 40);
      Ch.lewis(ctx, { x: sx + 140 * s, y: sy + 40, s: s * 0.9, mount: 'tripod', aim: 0.1, t, seed: 49 });
      Ch.person(ctx, { x: sx, y: sy + 44, s, face: 1, pose: 'kneel', t, seed: 91, hands: { l: [120, -170], r: [80, -150] } });
      Ch.person(ctx, { x: sx + 280 * s, y: sy + 30, s, face: 1, t, seed: 92, hands: { l: [56, -300], r: [-20, -150] } });
    } });
  }
  depthDraw(list);
  // transition: a trail of fresh emu footprints appears in the foreground dust
  if (t > 34.0) {
    for (let k = 0; k < 5; k++) {
      const tk = 34.05 + k * 0.13, q = clamp((t - tk) / 0.12);
      if (q <= 0) continue;
      const fx = 1240 - k * 120 + lt * 22, fy = 1560 + (k % 2) * 60;
      Ch.footprint(ctx, fx, fy, 0.95, -1.35, { progress: ease.o(q), lw: 15 });
      Ch.dustPuff(ctx, fx, fy, 30 + 30 * q, { seed: 950 + k, alpha: (1 - q) * 0.8, n: 3 });
    }
  }
  ctx.restore();
  // zoom into the footprint
  if (t > 34.85) {
    const q = inv(34.85, 35.38, t);
    fadeTo(ctx, ease.io(q) * 0.95);
    Ch.footprint(ctx, 540, lerp(1150, 1180, q), lerp(1.4, 3.0, ease.io(q)), lerp(-1.35, 0, ease.io(q)), { lw: lerp(15, 9, q), alpha: ease.o(q) });
  }
}

// ===================================================================
// SCENE 7 — notebook page (35.38 – 39.36)
// ===================================================================
function drawOn(ctx, prog, x0, x1, fn, py) { // reveal by sweeping clip (pencil drawing on)
  if (prog <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 50, -2000, (x1 - x0 + 100) * clamp(prog), 6000); ctx.clip(); fn(); ctx.restore();
  if (py != null && prog < 1) pencil(ctx, x0 - 50 + (x1 - x0 + 100) * prog, py + Math.sin(prog * 40) * 30);
}
function pencil(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.75);
  shape(ctx, [[0, 0], [26, -11], [26, 11]], { fill: '#E8C9A0', seed: 1, lw: 3, smooth: false });
  shape(ctx, [[0, 0], [9, -4], [9, 4]], { fill: C.ink, seed: 2, lw: 2, smooth: false, stroke: null });
  shape(ctx, rectPts(26, -11, 190, 22, 3), { fill: '#F2B73A', seed: 3, lw: 3.5 });
  shape(ctx, rectPts(216, -11, 22, 22, 1), { fill: '#B9B2A4', seed: 4, lw: 3 });
  shape(ctx, rectPts(238, -11, 26, 22, 1), { fill: '#E58C8C', seed: 5, lw: 3 });
  ctx.restore();
}
function notebook(ctx, t, o = {}) {
  const lt = t - 35.38;
  ctx.save();
  ctx.translate(540, 1150); ctx.rotate(-0.025);
  // page grows out of the footprint lines
  const grow = ease.o(clamp(lt / 0.55));
  const PWh = 470 * lerp(0.15, 1, grow), PHh = 560 * lerp(0.15, 1, grow);
  // shadow + page
  shape(ctx, rectPts(-PWh + 12, -PHh + 16, PWh * 2, PHh * 2, 6), { fill: '#BBA88A', stroke: null, seed: 1, alpha: 0.35 });
  shape(ctx, rectPts(-PWh, -PHh, PWh * 2, PHh * 2, 6), { fill: C.paperLight, seed: 2, lw: 3.5, tint: 0.1, stroke: C.inkSoft });
  if (grow > 0.9) {
    ctx.save(); ctx.globalAlpha *= inv(0.9, 1, grow);
    const rl = []; for (let y = -PHh + 70; y < PHh - 20; y += 52) rl.push([-PWh + 14, y, PWh - 14, y]);
    strokes(ctx, rl, '#9DB7D3', 2, 0.55);
    strokes(ctx, [[-PWh + 90, -PHh + 6, -PWh + 90, PHh - 6]], '#D88B84', 2.6, 0.75);
    // spiral holes
    for (let y = -PHh + 50; y < PHh - 20; y += 70) circle(ctx, -PWh + 40, y, 9, { fill: C.paper, seed: Math.floor(y), lw: 2.5, stroke: C.inkSoft });
    // tape
    shape(ctx, [[PWh - 120, -PHh - 22], [PWh - 10, -PHh - 30], [PWh - 4, -PHh + 18], [PWh - 116, -PHh + 26]], { fill: '#EADFB8', seed: 3, lw: 2, stroke: mix(C.inkSoft, C.paper, 0.5), alpha: 0.85 });
    ctx.restore();
  }
  // landscape strip (draws on)
  const land = inv(0.25, 1.1, lt);
  drawOn(ctx, land, -PWh + 100, PWh - 30, () => {
    const y0 = 120;
    shape(ctx, [[-PWh + 100, y0], [-200, y0 - 40], [0, y0 - 20], [200, y0 - 55], [PWh - 30, y0 - 25], [PWh - 30, y0 + 160], [-PWh + 100, y0 + 160]], { fill: C.ground, seed: 11, lw: 4, smooth: false, tint: 0.3, hatch: { color: C.groundDark, gap: 10, alpha: 0.4 } });
    shape(ctx, [[-PWh + 100, y0 + 2], [-260, y0 - 70], [-120, y0 - 30], [60, y0 - 90], [PWh - 30, y0 - 30]], { stroke: C.inkSoft, seed: 12, lw: 3, closed: false, fill: null });
    Ch.sun(ctx, 300, -330, 52, 13);
    Ch.gumTree(ctx, -220, y0 - 30, 0.55, 14, t);
    Ch.grassTufts(ctx, -PWh + 110, PWh - 40, y0 + 20, y0 + 150, 30, 15, t);
  }, 150);
  // music hit ~36.5s ("Büyük"): emu + Lewis gun silhouettes pop in
  const pop = ease.back(inv(36.45, 36.85, t));
  if (pop > 0) {
    ctx.save(); ctx.translate(170, 230); ctx.scale(pop, pop);
    Ch.emu(ctx, { x: 0, y: 0, s: 0.95, face: -1, run: 1, phase: (t * 1.4) % 1, t, seed: 160, sil: C.ink });
    for (let k = 0; k < 3; k++) Ch.dustPuff(ctx, 120 + k * 40, -10 - k * 6, 26 + k * 6, { seed: 170 + k + Math.floor(t * 5), n: 3, alpha: 0.85 });
    ctx.restore();
    ctx.save(); ctx.translate(-250, 250); ctx.scale(pop, pop);
    Ch.lewis(ctx, { x: 0, y: 0, s: 0.62, face: 1, mount: 'tripod', aim: 0.08, t, seed: 59, sil: C.ink });
    ctx.restore();
  }
  // the footprint that started it, now a mark on the page
  Ch.footprint(ctx, lerp(0, PWh - 90, ease.io(inv(0.0, 0.7, lt))), lerp(0, -PHh + 130, ease.io(inv(0.0, 0.7, lt))), lerp(3.0, 0.7, ease.io(inv(0.0, 0.7, lt))), 0, { lw: lerp(9, 10, 0.5), color: mix(C.redEarth, C.ink, 0.25) });
  // little pencil underline doodles on the page (no text)
  const dd = inv(37.1, 37.9, t);
  if (dd > 0) drawOn(ctx, dd, -PWh + 110, PWh - 60, () => line(ctx, [[-PWh + 110, 460], [-100, 452], [100, 462], [PWh - 60, 455]], { lw: 4, seed: 16, stroke: C.redEarth }));
  ctx.restore();
}
function scene7(ctx, t) {
  const push = ease.i(inv(38.55, 39.36, t));
  const hh = handheld(t, 3);
  ctx.save();
  cam(ctx, { x: lerp(540, 520, push) + hh[0], y: lerp(1110, 1250, push) + hh[1], z: lerp(1.0, 2.6, push) * lerp(1.0, 1.04, inv(35.4, 38.5, t)) });
  notebook(ctx, t);
  ctx.restore();
  if (t > 39.0) fadeTo(ctx, ease.io(inv(39.0, 39.36, t)) * 0.85, mix(C.ground, C.paper, 0.4));
}

// ===================================================================
// SCENE 8 — permanent channel ending (39.36 – end)
// ===================================================================
function scene8(ctx, t) {
  const lt = t - 39.36, hor = 980, sc = y => ps(y, hor, 1600);
  const z = lerp(1.08, 1.0, ease.o(clamp(lt / 1.0))) * lerp(1.0, 1.04, clamp(lt / 4.5));
  const hh = handheld(t, 3);
  ctx.save(); cam(ctx, { x: 540 + hh[0], y: 1000 + hh[1], z });
  landscape(ctx, { hor, t, seed: 61, nClouds: 3, cloudY0: 520, cloudY1: 760, skyCol: '#E9D9BF', sunPos: [860, 760], sunR: 58, sunCol: '#F4A84A', patches: 5 });
  Ch.gumTree(ctx, 980, hor + 8, 0.42, 17, t);
  Ch.grassTufts(ctx, -300, 1400, hor + 20, 2100, 120, 19, t, null, y => sc(y));
  // far background: truck & soldiers
  Ch.truck(ctx, { x: 150, y: 1085, s: 0.36, t, face: 1, bounce: 0.2 });
  for (let i = 0; i < 3; i++) Ch.person(ctx, { x: 285 + i * 50, y: 1092 + (i % 2) * 8, s: 0.34, face: i === 1 ? -1 : 1, t, seed: 95 + i, hands: i === 0 ? { l: [56, -300], r: [-20, -150] } : null });
  // machine gun silhouette off to the side
  Ch.lewis(ctx, { x: 90, y: 1420, s: 0.75, face: 1, mount: 'tripod', aim: 0.12, t, seed: 69, sil: mix(C.ink, C.paper, 0.15), alpha: 0.9 });
  // drifting dust
  for (let i = 0; i < 6; i++) {
    const x = ((hash(i, 1) * 1400 + lt * (30 + 20 * hash(i, 2))) % 1400) - 150, y = 1250 + hash(i, 3) * 500;
    Ch.dustPuff(ctx, x, y, 30 + 30 * hash(i, 4), { seed: 600 + i, alpha: 0.35 + 0.2 * Math.sin(lt + i), n: 3 });
  }
  Ch.bush(ctx, 1040, 1520, 0.8, 37);
  // foreground emu
  shape(ctx, ellipsePts(720, 1792, 190, 26, 16), { fill: mix(C.groundDark, C.ink, 0.25), stroke: null, alpha: 0.35, seed: 9 });
  const blink = (lt % 2.6) > 2.45;
  Ch.emu(ctx, { x: 710, y: 1790, s: 2.0, face: -1, t, seed: 7, blink, headRot: Math.sin(lt * 1.6) * 0.07 });
  ctx.restore();
  if (lt < 0.45) fadeTo(ctx, (1 - ease.io(lt / 0.45)) * 0.85, mix(C.ground, C.paper, 0.4));
}

// ---------------- captions ----------------
function wrap(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (ctx.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; }
  if (cur) lines.push(cur); return lines;
}
function captionLines(ctx, text) {
  for (let px = 74; px >= 50; px -= 2) {
    ctx.font = font(700, px);
    const lines = wrap(ctx, text, 940);
    if (lines.length * px * 1.2 <= 330) return { px, lines };
  }
  ctx.font = font(700, 50); return { px: 50, lines: wrap(ctx, text, 940) };
}
const capCache = new Map();
function drawCaption(ctx, t) {
  let idx = 0; for (let i = 0; i < SENT.length; i++) if (t >= SENT[i].t) idx = i;
  const S = SENT[idx];
  const reveal = idx === 0 ? 1 : clamp((t - S.t) / 0.4);
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const block = [];
  if (S.l1) {
    block.push({ text: S.l1, f: font(400, 70), col: '#7C7499', y: 222, rev: clamp((t - S.t) / 0.35) });
    block.push({ text: S.l2, f: font(700, 96), col: '#17143C', y: 330, rev: clamp((t - S.t2) / 0.45), bold: true });
  } else {
    let L = capCache.get(idx); if (!L) { L = captionLines(ctx, S.text); capCache.set(idx, L); }
    const lh = L.px * 1.2, top = 285 - (L.lines.length - 1) * lh / 2;
    const n = L.lines.length;
    L.lines.forEach((ln, i) => block.push({ text: ln, f: font(700, L.px), col: C.ink, y: top + i * lh, rev: clamp(reveal * n - i) }));
  }
  for (const b of block) {
    if (b.rev <= 0) continue;
    ctx.font = b.f;
    const w = ctx.measureText(b.text).width;
    ctx.save();
    ctx.beginPath(); ctx.rect(540 - w / 2 - 20, b.y - 80, (w + 40) * b.rev, 160); ctx.clip();
    // soft paper halo for legibility over any sky
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(248,241,226,0.80)'; ctx.lineWidth = b.bold ? 18 : 14; ctx.strokeText(b.text, 540, b.y);
    ctx.fillStyle = b.col; ctx.fillText(b.text, 540, b.y);
    if (b.bold) { ctx.globalAlpha = 0.35; ctx.fillText(b.text, 541.5, b.y + 1); } // extra ink weight
    ctx.restore();
  }
  ctx.restore();
}
function watermark(ctx) {
  ctx.save(); ctx.font = font(400, 30); ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 0.62; ctx.fillStyle = C.ink; ctx.fillText('@bugercektenyasandi', 1040, 1872); ctx.restore();
}

// ---------------- frame ----------------
let PAPER = null, TOOTH = null;
function renderFrame(ctx, t) {
  if (!PAPER) { PAPER = E.makePaper(); TOOTH = E.makeTooth(); }
  E.setBoil(Math.floor(t * 10));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(PAPER, 0, 0);
  ctx.save();
  if (t < 9.17) scene1(ctx, t);
  else if (t < 11.61) scene2(ctx, t);
  else if (t < 18.12) scene3(ctx, t);
  else if (t < 24.33) scene4(ctx, t);
  else if (t < 29.57) scene5(ctx, t);
  else if (t < 35.38) scene6(ctx, t);
  else if (t < 39.36) scene7(ctx, t);
  else scene8(ctx, t);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(TOOTH, 0, 0);
  drawCaption(ctx, t);
  watermark(ctx);
}

module.exports = { renderFrame, DUR, SENT, BURSTS };
