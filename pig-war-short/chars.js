'use strict';
// ---------- characters & props (local coords, feet / waterline at y=0) ----------

const PIG_SIL = [[-85, -70], [-62, -98], [-10, -108], [40, -104], [60, -100], [70, -130], [86, -104], [102, -98], [118, -84], [130, -74], [138, -58], [131, -42], [112, -35], [92, -28], [74, -22], [74, 0], [56, 0], [54, -18], [20, -14], [-30, -14], [-38, -18], [-40, 0], [-60, 0], [-63, -22], [-86, -36], [-93, -55]];

// pig. mode: 'color' | 'sil' (flat ink silhouette) | 'outline' (dashed memorial outline)
function pig(o) {
  const ctx = CTX; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s * (o.flip ? -1 : 1), o.s);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  const sd = o.seed || 500;
  if (o.mode === 'sil') {
    shape(PIG_SIL, { fill: o.silCol || INK, seed: sd, hatch: false, lw: 3, j: 1.2, p: o.p });
    tube(spiral(-90, -62, 13, 1.6), 5, o.silCol || INK, { outline: false, seed: sd + 9 });
    ctx.restore(); return;
  }
  if (o.mode === 'outline') {
    shape(PIG_SIL, { fill: null, seed: sd, lw: 4.5, dash: [16, 12], p: o.p, double: false, j: 1.0, stroke: o.col || INK });
    if ((o.p ?? 1) > 0.9) line(spiral(-92, -60, 12, 1.5), { seed: sd + 5, lw: 3.5, dash: [8, 7], double: false, stroke: o.col || INK });
    ctx.restore(); return;
  }
  const root = o.root || 0; // rooting phase radians
  const dip = o.rooting ? (Math.sin(root) * 0.5 + 0.5) : 0;
  ctx.rotate(o.rooting ? 0.05 + dip * 0.06 : 0);
  ctx.translate(0, o.rooting ? -dip * 2 : 0);
  // far legs
  tube([[48, -24], [50, -2]], 15, C.pigD, { seed: sd + 1 });
  tube([[-45, -24], [-48, -2]], 15, C.pigD, { seed: sd + 2 });
  // body
  shape(PIG_SIL, { fill: C.pig, seed: sd + 3, hatchColor: C.pigD, hatchAlpha: 0.35 });
  // spots
  shape(ell(-30, -76, 20, 13, 14, 0.3), { fill: '#9a7468', seed: sd + 4, stroke: false, hatch: false, alpha: 0.55 });
  shape(ell(18, -88, 13, 8, 12, -0.2), { fill: '#9a7468', seed: sd + 5, stroke: false, hatch: false, alpha: 0.5 });
  // ear inner
  shape([[66, -104], [72, -122], [80, -104]], { fill: C.pigD, seed: sd + 6, stroke: false, hatch: false });
  // snout disk
  shape(ell(133, -57, 7, 14, 16), { fill: C.pigD, seed: sd + 7, lw: 3 });
  dot(133, -62, 2.3); dot(133, -52, 2.3);
  // eye + blush
  const blink = (Math.sin(T * 1.3 + sd) > 0.985);
  if (blink) line([[96, -78], [104, -78]], { lw: 3, seed: sd + 8, double: false }); else dot(100, -78, 4.2);
  dot(108, -60, 8, C.blush, 0.45);
  // tail
  const tw = Math.sin(T * 9 + sd) * 0.25;
  ctx.save(); ctx.translate(-90, -62); ctx.rotate(tw);
  line(spiral(0, 0, 12, 1.6), { lw: 4, seed: sd + 10, double: false });
  ctx.restore();
  ctx.restore();
}
function spiral(cx, cy, r, turns) { const o = []; const n = 22; for (let i = 0; i <= n; i++) { const u = i / n, a = Math.PI + u * turns * Math.PI * 2, rr = r * (1 - u * 0.65); o.push([cx + Math.cos(a) * rr - (1 - u) * 8, cy + Math.sin(a) * rr]); } return o; }

// person, front view. Arms: angle 0 = down, + = outward, PI/2 horizontal outward.
function armPts(side, a1, a2, sx, sy, l1 = 74, l2 = 68) {
  const e = [sx + side * Math.sin(a1) * l1, sy + Math.cos(a1) * l1];
  const h = [e[0] + side * Math.sin(a2) * l2, e[1] + Math.cos(a2) * l2];
  return [[sx, sy], e, h];
}
function person(o) {
  const ctx = CTX; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s * (o.flip ? -1 : 1), o.s);
  if (o.rot) ctx.rotate(o.rot);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  const sd = o.seed || 10, pants = o.pants || C.vest, coat = o.coat || C.shirt, sleeve = o.sleeve || coat;
  const wk = o.walk || 0, wa = o.walkAmp || 0;
  const lx = Math.sin(wk) * wa * 16, ly1 = -Math.max(0, Math.sin(wk)) * wa * 12, ly2 = -Math.max(0, -Math.sin(wk)) * wa * 12;
  // legs
  tube([[-15, -142], [-17 + lx * .5, -72], [-19 + lx, -6 + ly1]], 27, pants, { seed: sd + 1 });
  tube([[15, -142], [17 - lx * .5, -72], [19 - lx, -6 + ly2]], 27, pants, { seed: sd + 2 });
  if (o.stripe) { line([[-26, -130], [-29 + lx, -14 + ly1]], { stroke: o.stripe, lw: 4, double: false, seed: sd + 40 }); line([[26, -130], [29 - lx, -14 + ly2]], { stroke: o.stripe, lw: 4, double: false, seed: sd + 41 }); }
  shape(ell(-24 + lx, -5 + ly1, 19, 9, 16), { fill: o.boots || C.black, seed: sd + 3, sub: 0, hatch: false, lw: 3 });
  shape(ell(24 - lx, -5 + ly2, 19, 9, 16), { fill: o.boots || C.black, seed: sd + 4, sub: 0, hatch: false, lw: 3 });
  ctx.translate(0, o.bob || 0);
  // torso
  const bottom = o.tails ? -92 : -136;
  const torso = [[-40, -238], [-20, -244], [20, -244], [40, -238], [36, -190], [33, bottom], [-33, bottom], [-36, -190]];
  shape(torso, { fill: coat, seed: sd + 5 });
  if (o.vest) shape([[-20, -238], [20, -238], [22, -150], [0, -146], [-22, -150]], { fill: o.vest, seed: sd + 6, lw: 3 });
  if (o.suspenders) { line([[-20, -240], [-16, -140]], { stroke: o.suspenders, lw: 6, double: false, seed: sd + 7 }); line([[20, -240], [16, -140]], { stroke: o.suspenders, lw: 6, double: false, seed: sd + 8 }); }
  if (o.belts) { line([[-34, -236], [30, -150]], { stroke: o.belts, lw: 9, double: false, seed: sd + 9 }); line([[34, -236], [-30, -150]], { stroke: o.belts, lw: 9, double: false, seed: sd + 10 }); }
  if (o.belt) line([[-34, -150], [34, -150]], { stroke: o.belt, lw: 8, double: false, seed: sd + 11 });
  if (o.buttons) for (let i = 0; i < 5; i++) dot(0, -228 + i * 18, 3.6, o.buttons);
  if (o.lapels) { shape([[-20, -242], [0, -200], [-8, -238]], { fill: o.lapels, seed: sd + 12, lw: 2.5, hatch: false }); shape([[20, -242], [0, -200], [8, -238]], { fill: o.lapels, seed: sd + 13, lw: 2.5, hatch: false }); }
  if (o.cravat) shape([[-9, -244], [9, -244], [4, -226], [-4, -226]], { fill: o.cravat, seed: sd + 14, lw: 2.5, hatch: false });
  if (o.scarf) shape([[-18, -244], [18, -244], [10, -230], [3, -214], [-3, -230]], { fill: o.scarf, seed: sd + 15, lw: 2.5, hatch: false });
  if (o.epaulets) { shape(ell(-38, -238, 14, 6, 12), { fill: o.epaulets, seed: sd + 16, lw: 2.5, hatch: false }); shape(ell(38, -238, 14, 6, 12), { fill: o.epaulets, seed: sd + 17, lw: 2.5, hatch: false }); }
  // arms
  const aL = o.armL || [0.18, 0.1], aR = o.armR || [0.18, 0.1];
  const L = armPts(-1, aL[0], aL[1], -36, -230), R = armPts(1, aR[0], aR[1], 36, -230);
  const hands = { L: L[2], R: R[2] };
  if (o.holdBehind) o.holdBehind(hands);
  tube(L, 19, sleeve, { seed: sd + 18 });
  tube(R, 19, sleeve, { seed: sd + 19 });
  shape(ell(L[2][0], L[2][1], 11, 11, 12), { fill: o.skin || C.skin, seed: sd + 25, lw: 3, hatch: false });
  shape(ell(R[2][0], R[2][1], 11, 11, 12), { fill: o.skin || C.skin, seed: sd + 26, lw: 3, hatch: false });
  // head
  tube([[0, -244], [0, -252]], 18, o.skin || C.skin, { seed: sd + 20, outline: false });
  const hx = o.headTilt || 0;
  ctx.save(); ctx.translate(0, -270); ctx.rotate(hx);
  shape(ell(-30, 2, 6, 9, 10), { fill: o.skin || C.skin, seed: sd + 21, lw: 2.5, hatch: false });
  shape(ell(30, 2, 6, 9, 10), { fill: o.skin || C.skin, seed: sd + 22, lw: 2.5, hatch: false });
  if (o.hairBack) shape(ell(0, -10, 32, 26, 20), { fill: o.hairBack, seed: sd + 23, lw: 3, hatch: false });
  shape(ell(0, 0, 30, 33, 26), { fill: o.skin || C.skin, seed: sd + 24, hatchColor: C.skinD, hatchAlpha: 0.2 });
  face(o, sd);
  hat(o, sd);
  ctx.restore();
  if (o.hold) o.hold(hands);
  ctx.restore();
  return hands;
}
function face(o, sd) {
  const lk = (o.look || 0) * 6, lky = o.lookY || 0;
  dot(-11 + lk, -3 + lky, 3.8); dot(11 + lk, -3 + lky, 3.8);
  const br = o.brows || 'normal';
  const B = { angry: [[-19, -16], [-5, -10], [5, -10], [19, -16]], worried: [[-18, -11], [-6, -16], [6, -16], [18, -11]], surprise: [[-18, -17], [-6, -19], [6, -19], [18, -17]], normal: [[-18, -13], [-6, -14], [6, -14], [18, -13]] }[br];
  line([[B[0][0] + lk, B[0][1]], [B[1][0] + lk, B[1][1]]], { lw: 3.5, double: false, seed: sd + 30, sub: 30 });
  line([[B[2][0] + lk, B[2][1]], [B[3][0] + lk, B[3][1]]], { lw: 3.5, double: false, seed: sd + 31, sub: 30 });
  line([[lk * 1.2, 3], [lk * 1.2 + 4, 9], [lk * 1.2, 11]], { lw: 2.6, double: false, seed: sd + 32, sub: 30 });
  if (o.blush !== false) { dot(-17 + lk, 9, 6, C.blush, 0.4); dot(17 + lk, 9, 6, C.blush, 0.4); }
  if (o.beard) shape([[-29, 0], [-26, 18], [-12, 32], [0, 35], [12, 32], [26, 18], [29, 0], [20, 12], [0, 15], [-20, 12]], { fill: o.beard, seed: sd + 33, lw: 3, hatch: true, hatchAlpha: .4 });
  if (o.whiskers) { shape([[-30, -6], [-30, 20], [-20, 22], [-22, -2]], { fill: o.whiskers, seed: sd + 34, lw: 2.5, hatch: false }); shape([[30, -6], [30, 20], [20, 22], [22, -2]], { fill: o.whiskers, seed: sd + 35, lw: 2.5, hatch: false }); }
  if (o.mustache) shape([[-14 + lk, 15], [0 + lk, 12], [14 + lk, 15], [6 + lk, 18], [-6 + lk, 18]], { fill: o.mustache, seed: sd + 36, lw: 2.5, hatch: false });
  const m = o.mouth || 'flat', my = 21;
  if (m === 'frown') line([[-9 + lk, my + 3], [lk, my - 2], [9 + lk, my + 3]], { lw: 3, double: false, seed: sd + 37, sub: 30 });
  else if (m === 'smile') line([[-9 + lk, my - 2], [lk, my + 3], [9 + lk, my - 2]], { lw: 3, double: false, seed: sd + 37, sub: 30 });
  else if (m === 'o') shape(ell(lk, my + 1, 5, 6, 12), { fill: '#7a4a4a', seed: sd + 37, lw: 2.5, hatch: false });
  else if (m === 'shout') shape(ell(lk, my + 1, 9, 7, 14), { fill: '#7a4a4a', seed: sd + 37, lw: 2.5, hatch: false });
  else line([[-7 + lk, my], [7 + lk, my]], { lw: 3, double: false, seed: sd + 37, sub: 30 });
}
function hat(o, sd) {
  const h = o.hat; if (!h) { if (o.hair) shape([[-31, -8], [-28, -26], [-10, -36], [12, -36], [28, -26], [31, -8], [18, -22], [-18, -22]], { fill: o.hair, seed: sd + 50, lw: 3 }); return; }
  if (o.hair) { shape([[-31, -2], [-31, -18], [-22, -20], [-24, 2]], { fill: o.hair, seed: sd + 51, lw: 2.5, hatch: false }); shape([[31, -2], [31, -18], [22, -20], [24, 2]], { fill: o.hair, seed: sd + 52, lw: 2.5, hatch: false }); }
  const hc = o.hatColor;
  if (h === 'slouch') {
    shape([[-30, -22], [-27, -50], [-10, -58], [10, -58], [27, -50], [30, -22]], { fill: hc || C.hatBrown, seed: sd + 53 });
    shape(ell(0, -22, 54, 10, 24), { fill: hc || C.hatBrown, seed: sd + 54, hatch: false });
    line([[-29, -30], [29, -30]], { lw: 6, stroke: '#4a3a2c', double: false, seed: sd + 55 });
  } else if (h === 'kepi') {
    shape([[-29, -20], [-24, -58], [24, -54], [29, -20]], { fill: hc || C.usBlueD, seed: sd + 53 });
    shape([[-28, -20], [28, -20], [22, -11], [-22, -11]], { fill: C.black, seed: sd + 54, hatch: false, lw: 3 });
    dot(0, -34, 4, C.gold);
  } else if (h === 'hardee') {
    shape([[-28, -22], [-24, -62], [0, -68], [24, -62], [28, -22]], { fill: hc || '#3a3a44', seed: sd + 53 });
    shape(ell(0, -22, 58, 11, 24), { fill: hc || '#3a3a44', seed: sd + 54, hatch: false });
    line([[-27, -30], [27, -30]], { lw: 5, stroke: C.gold, double: false, seed: sd + 55 });
  } else if (h === 'shako') {
    shape([[-27, -20], [-24, -70], [24, -70], [27, -20]], { fill: hc || '#33334a', seed: sd + 53 });
    shape(ell(0, -70, 24, 6, 16), { fill: hc || '#33334a', seed: sd + 56, hatch: false, lw: 3 });
    shape([[-28, -20], [28, -20], [22, -11], [-22, -11]], { fill: C.black, seed: sd + 54, hatch: false, lw: 3 });
    shape(ell(0, -42, 8, 10, 12), { fill: C.gold, seed: sd + 55, hatch: false, lw: 2.5 });
  } else if (h === 'naval') {
    shape([[-30, -20], [-34, -46], [0, -54], [34, -46], [30, -20]], { fill: hc || C.navyCoat, seed: sd + 53 });
    line([[-30, -26], [30, -26]], { lw: 7, stroke: C.gold, double: false, seed: sd + 55 });
    shape([[-28, -20], [28, -20], [22, -10], [-22, -10]], { fill: C.black, seed: sd + 54, hatch: false, lw: 3 });
  } else if (h === 'flatcap') {
    shape([[-31, -16], [-30, -40], [0, -48], [32, -38], [44, -20], [30, -14]], { fill: hc || '#7d7466', seed: sd + 53 });
  } else if (h === 'tophat') {
    shape([[-24, -24], [-26, -92], [26, -92], [24, -24]], { fill: hc || '#33323e', seed: sd + 53 });
    shape(ell(0, -24, 42, 8, 20), { fill: hc || '#33323e', seed: sd + 54, hatch: false });
    line([[-24, -34], [24, -34]], { lw: 6, stroke: '#55545e', double: false, seed: sd + 55 });
  }
}

// rifle/musket as tube pieces, from stock point a to muzzle point b
function rifle(a, b, sd = 700) {
  const s = [lerp(a[0], b[0], 0.42), lerp(a[1], b[1], 0.42)];
  tube([a, s], 13, C.woodD, { seed: sd });
  tube([s, b], 6, '#6d6c74', { seed: sd + 1 });
}

// ---------- props ----------
function fir(x, y, s, sd = 1, col = C.fir) {
  G(x, y, s, () => {
    const sw = Math.sin(T * 0.9 + sd) * 2;
    tube([[0, 0], [0, -40]], 12, C.woodD, { seed: sd });
    shape([[-55, -30], [55, -30], [sw, -120]], { fill: col, seed: sd + 1, hatchColor: C.firD });
    shape([[-45, -80], [45, -80], [sw * 1.4, -165]], { fill: col, seed: sd + 2, hatchColor: C.firD });
    shape([[-32, -125], [32, -125], [sw * 1.8, -205]], { fill: col, seed: sd + 3, hatchColor: C.firD });
  });
}
function plant(x, y, s, sd = 1, o = {}) { // potato plant
  G(x, y, s, () => {
    const sw = Math.sin(T * 1.6 + sd * 1.7) * 0.06 + (o.bend || 0);
    CTX.rotate(sw);
    const r = rng(sd * 31 + 7);
    const leaves = o.damaged ? 4 : 7;
    for (let i = 0; i < leaves; i++) {
      const a = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.42 + (r() - .5) * 0.2, d = 26 + r() * 16;
      const lx = Math.cos(a) * d, ly = Math.sin(a) * d - 8;
      shape(ell(lx, ly, 17, 10, 14, a), { fill: i % 2 ? C.leaf : C.leafD, seed: sd * 10 + i, lw: 3, hatchAlpha: .25 });
    }
    if (!o.damaged) { dot(-6, -48, 5, C.flowerW); dot(8, -52, 5, C.flowerL); dot(1, -44, 2.4, C.gold); }
  });
}
function cabbage(x, y, s, sd = 1) {
  G(x, y, s, () => {
    shape(ell(0, -18, 30, 20, 18), { fill: C.leaf, seed: sd, lw: 3 });
    shape(ell(0, -22, 17, 13, 14), { fill: '#a9c98c', seed: sd + 1, lw: 3, hatch: false });
  });
}
function fence(x0, x1, y, o = {}) {
  const posts = []; const gap = o.gap || 120;
  for (let x = x0; x <= x1 + 1; x += gap) posts.push(x);
  const h = o.h || 110, alpha = o.alpha ?? 1, P = o.p ?? 1;
  CTX.save(); CTX.globalAlpha *= alpha;
  posts.forEach((x, i) => { const pp = clamp(P * posts.length - i); if (pp > 0) shape(rect(x - 9, y - h * pp, 18, h * pp), { fill: C.wood, seed: 300 + i, lw: 3.5, hatchColor: C.woodD }); });
  if (P > 0.3) {
    const e = lerp(x0, x1, clamp((P - 0.3) / 0.7));
    tube([[x0 - 10, y - h * 0.72], [e, y - h * 0.75]], 12, C.wood, { seed: 390 });
    tube([[x0 - 10, y - h * 0.32], [e, y - h * 0.34]], 12, C.wood, { seed: 391 });
  }
  CTX.restore();
}
function fencePath(x0, x1, y, h = 110) { // loop around both rails (for morph)
  return [[x0, y - h * 0.78], [x1, y - h * 0.8], [x1, y - h * 0.28], [x0, y - h * 0.28]];
}
function cloud(x, y, s, sd = 1, a = 1) {
  G(x, y, s, () => {
    const r = rng(sd), pts = [];
    for (let i = 0; i < 26; i++) { const t = i / 26 * Math.PI * 2; const bump = 1 + 0.2 * Math.abs(Math.sin(t * 3.5 + r() * 2)); pts.push([Math.cos(t) * 110 * bump, Math.sin(t) * 42 * bump * (Math.sin(t) > 0 ? 0.6 : 1)]); }
    shape(pts, { fill: C.white, seed: sd, sub: 0, lw: 2.5, stroke: '#9aa7b8', hatchColor: '#d7dfe6', hatchAlpha: .4, alpha: a });
  });
}
function waves(x0, x1, y0, y1, o = {}) {
  const ctx = CTX; const gap = o.gap || 46, sp = o.speed ?? 18;
  ctx.save(); ctx.globalAlpha *= (o.alpha ?? 0.55);
  let row = 0;
  for (let y = y0; y < y1; y += gap, row++) {
    const off = ((T * sp * (row % 2 ? 1 : -0.7)) % 180 + 180) % 180;
    for (let x = x0 - 180 + off + (row % 3) * 50; x < x1; x += 180) {
      const w = 34 + (row % 2) * 10;
      line([[x - w, y + 3], [x - w * 0.5, y - 5], [x, y], [x + w * 0.5, y - 5], [x + w, y + 3]], { lw: 3, stroke: o.col || '#5d8f95', double: false, seed: 900 + row * 37 + Math.round(x), sub: 40 });
    }
  }
  ctx.restore();
}
function puff(x, y, s, t, sd = 1, col = C.smoke) { // t: 0..1 life
  if (t <= 0 || t >= 1) return;
  const r = rng(sd);
  for (let i = 0; i < 7; i++) {
    const a = r() * 6.28, d = (20 + r() * 40) * eOut(t), rr = (20 + r() * 22) * (0.5 + eOut(t) * 0.9);
    shape(ell(x + Math.cos(a) * d * s, y + Math.sin(a) * d * s * 0.7 - t * 30 * s, rr * s, rr * 0.85 * s, 16), { fill: col, seed: sd + i, lw: 2.5, stroke: '#8a8794', hatch: false, alpha: 1 - eIn(t) });
  }
}
function smokeTrail(x, y, s, sd = 1, dir = 1) { // continuous funnel smoke
  for (let i = 0; i < 6; i++) {
    const u = ((T * 0.35 + i / 6 + sd * 0.13) % 1);
    const px = x + dir * u * 120 * s + Math.sin(u * 6 + i) * 8 * s, py = y - u * 150 * s, rr = (14 + u * 30) * s;
    shape(ell(px, py, rr, rr * 0.8, 14), { fill: '#bdb8b3', seed: sd * 10 + i, lw: 2.2, stroke: '#7d7a86', hatch: false, alpha: 0.85 * (1 - u) });
  }
}
function bird(x, y, s, flap, sd = 1, sitting = false) {
  G(x, y, s, () => {
    if (sitting) {
      shape(ell(0, -12, 14, 10, 14), { fill: '#7d8494', seed: sd, lw: 2.5, hatch: false });
      shape(ell(11, -22, 7, 7, 10), { fill: '#7d8494', seed: sd + 1, lw: 2.5, hatch: false });
      line([[17, -22], [23, -20]], { lw: 2.5, double: false, seed: sd + 2 });
      return;
    }
    const f = Math.sin(flap) * 14;
    line([[-24, -f], [-10, -2], [0, 3], [10, -2], [24, -f]], { lw: 3.5, double: false, seed: sd, sub: 30 });
  });
}
function sheep(x, y, s, sd = 1, flip = false) {
  G(x, y, s, () => {
    tube([[-22, -16], [-22, 0]], 7, C.black, { seed: sd }); tube([[20, -16], [20, 0]], 7, C.black, { seed: sd + 1 });
    const r = rng(sd), pts = [];
    for (let i = 0; i < 20; i++) { const t = i / 20 * 6.28; const b = 1 + 0.12 * Math.abs(Math.sin(t * 5)); pts.push([Math.cos(t) * 40 * b, -32 + Math.sin(t) * 22 * b]); }
    shape(pts, { fill: C.white, seed: sd + 2, sub: 0, lw: 3, hatchColor: '#d6d0c4' });
    const bob = Math.sin(T * 2 + sd) * 2;
    shape(ell(42, -36 + bob, 11, 14, 14, 0.4), { fill: '#4a4652', seed: sd + 3, lw: 3, hatch: false });
  }, { flip });
}

// flag with waving strips. type: 'us' | 'union' | 'red' (HBC/red ensign) | 'white'
function flag(x, y, w, h, type, sd = 1, o = {}) {
  const ctx = CTX; const pole = o.pole ?? h * 2.4;
  ctx.save(); ctx.translate(x, y); if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  if (pole > 0) tube([[0, 0], [0, -pole]], 7, C.woodD, { seed: sd });
  const top = -pole;
  const N = 10, amp = o.amp ?? h * 0.09, sp = o.speed ?? 5;
  const wave = u => Math.sin(u * 5 - T * sp + sd) * amp * u;
  const outlineTop = [], outlineBot = [];
  for (let i = 0; i <= N; i++) { const u = i / N; outlineTop.push([u * w, top + wave(u)]); outlineBot.push([u * w, top + h + wave(u)]); }
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N;
    ctx.save(); ctx.beginPath(); ctx.rect(u0 * w - 0.6, top - amp * 2 - 2, (u1 - u0) * w + 1.2, h + amp * 4 + 4); ctx.clip();
    ctx.translate(0, wave((u0 + u1) / 2)); flagContent(type, w, h, top);
    ctx.restore();
  }
  line(outlineTop.concat(outlineBot.reverse()), { closed: true, lw: 3, seed: sd + 2, sub: 0 });
  ctx.restore();
}
function flagContent(type, w, h, top) {
  const ctx = CTX;
  const R = (x, y, ww, hh, c) => { ctx.fillStyle = crayon(c); ctx.fillRect(x, top + y, ww, hh); };
  const union = (cw, ch) => {
    R(0, 0, cw, ch, '#4b5c8f');
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, cw, ch); ctx.clip();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = crayon(C.white); ctx.lineWidth = ch * 0.2; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(cw, top + ch); ctx.moveTo(cw, top); ctx.lineTo(0, top + ch); ctx.stroke();
    ctx.strokeStyle = crayon(C.red); ctx.lineWidth = ch * 0.07; ctx.stroke();
    ctx.strokeStyle = crayon(C.white); ctx.lineWidth = ch * 0.33; ctx.beginPath(); ctx.moveTo(cw / 2, top); ctx.lineTo(cw / 2, top + ch); ctx.moveTo(0, top + ch / 2); ctx.lineTo(cw, top + ch / 2); ctx.stroke();
    ctx.strokeStyle = crayon(C.red); ctx.lineWidth = ch * 0.2; ctx.stroke();
    ctx.restore();
  };
  if (type === 'us') {
    for (let i = 0; i < 13; i++) R(0, i * h / 13, w, h / 13 + 0.5, i % 2 ? C.white : C.red);
    const cw = w * 0.42, ch = h * 7 / 13; R(0, 0, cw, ch, '#4b5c8f');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) dot(cw * (0.12 + c * 0.19) + (r % 2) * cw * 0.09, top + ch * (0.16 + r * 0.22), Math.max(1.2, h * 0.025), C.white);
  } else if (type === 'union') union(w, h);
  else if (type === 'red') { R(0, 0, w, h, C.red); union(w * 0.45, h * 0.5); }
  else if (type === 'white') {
    R(0, 0, w, h, C.white); R(w * 0.45 + (w * 0.55) * 0.35, 0, w * 0.1, h, C.red); R(0, h * 0.43, w, h * 0.14, C.red); union(w * 0.45, h * 0.5);
  }
}

// warship, local coords facing right, waterline y=0, length ~470
const HULL = [[-238, -82], [-120, -76], [0, -72], [120, -74], [222, -82], [248, -66], [236, -30], [212, 0], [-206, 0], [-226, -30]];
function ship(o) {
  const ctx = CTX; ctx.save(); ctx.translate(o.x, o.y);
  const rock = Math.sin(T * 1.1 + (o.seed || 1)) * 0.022;
  ctx.rotate(rock); ctx.scale(o.s * (o.flip ? -1 : 1), o.s);
  ctx.translate(0, Math.sin(T * 1.3 + (o.seed || 1)) * 3);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  const sd = o.seed || 1000, P = o.p ?? 1;
  const pp = k => clamp(P * 4 - k);
  // masts & rigging behind hull
  const masts = [[-140, 300], [-10, 335], [118, 292]];
  if (pp(1) > 0) {
    line([[240, -76], [345, -128]], { lw: 5, seed: sd + 1, p: pp(1) });
    masts.forEach(([mx, mh], i) => {
      line([[mx, -76], [mx + (i == 0 ? -110 : i == 2 ? 150 : -60), -76]], { lw: 1.6, seed: sd + 60 + i, double: false, p: pp(1), alpha: .55 });
      line([[mx, -mh], [mx + (i == 2 ? 220 : 120), -76]], { lw: 1.6, seed: sd + 70 + i, double: false, p: pp(1), alpha: .55 });
      tube([[mx, -70], [mx, -70 - (mh - 70) * pp(1)]], 9, C.woodD, { seed: sd + 2 + i });
    });
  }
  if (pp(2) > 0) masts.forEach(([mx, mh], i) => {
    const yards = [mh * 0.5, mh * 0.72, mh * 0.9];
    yards.forEach((yy, k) => {
      const yw = (1 - k * 0.22) * 62;
      if (o.sails !== false && k < 2) {
        const bell = Math.sin(T * 1.5 + i + k) * 3;
        const sh = (yards[k] - (k ? yards[k - 1] : 82)) * 0.92;
        shape([[mx - yw, -yy], [mx + yw, -yy], [mx + yw * 0.92 + bell, -yy + sh], [mx - yw * 0.92 + bell, -yy + sh]], { fill: C.cream, seed: sd + 10 + i * 5 + k, lw: 2.8, hatchColor: '#d9ceb6', alpha: pp(2) });
      }
      line([[mx - yw, -yy], [mx + yw, -yy]], { lw: 4.5, seed: sd + 30 + i * 5 + k, double: false, alpha: pp(2) });
    });
    if (i === 1 && o.pennant !== false) flag(mx, -mh + 4, 46, 12, 'red', sd + 41, { pole: 0, amp: 3, alpha: pp(2) });
  });
  // funnel
  if (o.funnel !== false && pp(2) > 0) {
    shape(rect(42, -160, 34, 88), { fill: C.black, seed: sd + 50, lw: 3, alpha: pp(2) });
    line([[42, -146], [76, -146]], { lw: 6, stroke: C.gold, double: false, seed: sd + 51, alpha: pp(2) });
    if (o.smoke !== false) smokeTrail(60, -170, 1, sd, -1);
  }
  // hull
  shape(HULL, { fill: '#3e3e50', seed: sd + 52, p: pp(0), hatchColor: '#2a2a38' });
  if (pp(0) > 0.6) {
    const ha = clamp((pp(0) - 0.6) / 0.4);
    shape([[-226, -56], [236, -56], [240, -44], [-222, -44]], { fill: C.cream, seed: sd + 53, lw: 2.5, hatch: false, alpha: ha });
    line([[-200, -10], [205, -10]], { stroke: C.brRedD, lw: 5, double: false, seed: sd + 54, alpha: ha * .7 });
    const g = o.guns ?? 0;
    for (let k = 0; k < 9; k++) {
      const gx = -180 + k * 44;
      shape(rect(gx - 7, -55, 14, 10), { fill: '#24232e', flat: true, seed: sd + 80 + k, lw: 2, hatch: false, alpha: ha });
      if (g > 0) tube([[gx, -50], [gx + 2, -50 + 22 * g]], 7, '#55545e', { seed: sd + 90 + k, lw: 2.5 });
    }
  }
  // stern ensign
  if (pp(3) > 0) flag(-236, -82, 64, 40, o.ensign || 'white', sd + 99, { pole: 70, alpha: pp(3) });
  if (o.crew) o.crew();
  ctx.restore();
}

function tent(x, y, s, sd = 1, col = C.cream) {
  G(x, y, s, () => {
    shape([[-70, 0], [0, -95], [70, 0]], { fill: col, seed: sd, hatchColor: '#d6c9ab' });
    shape([[0, -95], [70, 0], [95, -6], [30, -98]], { fill: shade(col, -0.12), seed: sd + 1, hatchColor: '#bfb294' });
    line([[0, -95], [-6, 0]], { lw: 3, seed: sd + 2, double: false });
    tube([[0, -95], [0, -112]], 4, C.woodD, { seed: sd + 3, lw: 2 });
  });
}
const BARREL = [[-8, -15], [150, -10], [158, -12], [162, 0], [158, 12], [150, 10], [-8, 15], [-22, 8], [-26, 0], [-22, -8]];
function cannon(x, y, s, o = {}) {
  const sd = o.seed || 1200;
  G(x, y, s, () => {
    tube([[-110, -10], [10, -52]], 18, C.woodD, { seed: sd });
    // barrel with elevation
    CTX.save(); CTX.translate(0, -62); CTX.rotate(-(o.elev ?? 0.08));
    shape(BARREL, { fill: o.barrelCol || C.bronze, seed: sd + 1, hatchColor: '#5f4a2f' });
    line([[30, -13], [30, 13]], { lw: 3, seed: sd + 2, double: false }); line([[110, -11], [110, 11]], { lw: 3, seed: sd + 3, double: false });
    CTX.restore();
    // wheel
    shape(ell(0, -42, 42, 42, 28), { fill: C.wood, seed: sd + 4, hatch: false, lw: 4 });
    shape(ell(0, -42, 30, 30, 24), { fill: null, seed: sd + 5, lw: 2.5, double: false });
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; line([[Math.cos(a) * 32, -42 + Math.sin(a) * 32], [-Math.cos(a) * 32, -42 - Math.sin(a) * 32]], { lw: 3, seed: sd + 10 + k, double: false }); }
    dot(0, -42, 7, INK);
  }, { flip: o.flip, alpha: o.alpha });
}
function cabin(x, y, s, sd = 1, o = {}) {
  G(x, y, s, () => {
    shape(rect(-90, -110, 180, 110), { fill: o.col || C.wood, seed: sd, hatchColor: C.woodD });
    for (let k = 1; k < 5; k++) line([[-90, -110 + k * 22], [90, -110 + k * 22]], { lw: 2.2, seed: sd + k, double: false, alpha: .7 });
    shape([[-108, -106], [0, -178], [108, -106]], { fill: o.roof || '#8c6a4c', seed: sd + 6, hatchColor: '#6e5038' });
    shape(rect(-22, -70, 44, 70), { fill: '#6a4e36', seed: sd + 7, hatch: false, lw: 3 });
    shape(rect(40, -82, 34, 30), { fill: '#e8dfb0', seed: sd + 8, hatch: false, lw: 3 });
    if (o.chimney) { shape(rect(48, -190, 22, 50), { fill: '#9a8a7a', seed: sd + 9, lw: 3 }); smokeTrail(59, -195, 0.5, sd + 3, 1); }
  });
}
function rowboat(x, y, s, o = {}) {
  const sd = o.seed || 1500;
  G(x, y, s, () => {
    CTX.rotate(Math.sin(T * 2.2) * 0.03);
    // seated soldiers
    const n = o.n ?? 5;
    for (let i = 0; i < n; i++) {
      const sx = -110 + i * 52, bob = Math.sin(T * 3 + i) * 2;
      tube([[sx + 18, -40], [sx + 24, -150]], 4, '#6d6c74', { seed: sd + 40 + i, lw: 2 });
      shape([[sx - 20, -30], [sx - 18, -78 + bob], [sx + 18, -78 + bob], [sx + 20, -30]], { fill: C.usBlue, seed: sd + i * 3, lw: 3 });
      shape(ell(sx, -96 + bob, 16, 17, 16), { fill: C.skin, seed: sd + i * 3 + 1, lw: 3, hatch: false });
      shape([[sx - 15, -104 + bob], [sx - 12, -124 + bob], [sx + 14, -122 + bob], [sx + 16, -104 + bob]], { fill: C.usBlueD, seed: sd + i * 3 + 2, lw: 2.5, hatch: false });
      dot(sx + 5, -97 + bob, 2.4);
    }
    if (o.flag) flag(-150, -40, 48, 30, 'us', sd + 70, { pole: 110 });
    // oars
    const oa = Math.sin(T * 3.2) * 0.35;
    line([[-40, -30], [-40 - Math.cos(oa) * 120, 20 + Math.sin(oa) * 30]], { lw: 5, seed: sd + 60, double: false });
    line([[60, -30], [60 - Math.cos(oa) * 120, 20 + Math.sin(oa) * 30]], { lw: 5, seed: sd + 61, double: false });
    shape([[-190, -52], [-150, -20], [-100, 0], [100, 0], [160, -18], [200, -56], [140, -38], [-140, -36]], { fill: C.wood, seed: sd + 62, hatchColor: C.woodD });
    line([[-165, -40], [178, -42]], { lw: 3, seed: sd + 63, double: false });
  });
}
function ledger(o) { // open book, local center
  G(o.x, o.y, o.s, () => {
    shape([[-330, -230], [0, -250], [330, -230], [330, 230], [0, 250], [-330, 230]], { fill: '#8c5a46', seed: 1700, hatchColor: '#6e4636' });
    shape([[-312, -214], [-4, -232], [-4, 232], [-312, 214]], { fill: C.parchment, seed: 1701, hatchColor: '#dccba4', hatchAlpha: .2 });
    shape([[4, -232], [312, -214], [312, 214], [4, 232]], { fill: C.parchment, seed: 1702, hatchColor: '#dccba4', hatchAlpha: .2 });
    for (let k = 0; k < 10; k++) {
      const yy = -170 + k * 40;
      line([[-290, yy], [-24, yy - 2]], { stroke: C.ledgerLine, lw: 2, double: false, seed: 1710 + k, alpha: .8 });
      line([[24, yy - 2], [290, yy]], { stroke: C.ledgerLine, lw: 2, double: false, seed: 1730 + k, alpha: .8 });
      if (k < 8) { // scribbled (illegible) entries
        const r = rng(k * 17 + 3), pts = []; const x0 = -280, x1 = -60 - r() * 90;
        for (let x = x0; x <= x1; x += 9) pts.push([x, yy - 10 + (r() - .5) * 12]);
        line(pts, { lw: 2.4, double: false, seed: 1750 + k, sub: 0, alpha: .75 });
        if (k < 3 || k > 5) { const p2 = []; for (let x = 40; x <= 170 + r() * 80; x += 9) p2.push([x, yy - 10 + (r() - .5) * 12]); line(p2, { lw: 2.4, double: false, seed: 1770 + k, sub: 0, alpha: .75 }); }
      }
    }
    line([[0, -248], [0, 248]], { lw: 3, seed: 1790 });
  }, { rot: o.rot || 0, alpha: o.alpha });
}
function pen(x, y, s, rot, o = {}) {
  G(x, y, s, () => { shape(PEN, { fill: '#3a3546', seed: 1800, hatchColor: '#222' }); shape([[150, -6], [196, 0], [150, 6]], { fill: C.gold, seed: 1801, lw: 2.5, hatch: false }); line([[60, -10], [60, 10]], { stroke: C.gold, lw: 5, double: false, seed: 1802 }); }, { rot, alpha: o.alpha });
}
const PEN = [[-8, -12], [150, -9], [158, -6], [162, 0], [158, 6], [150, 9], [-8, 12], [-20, 7], [-24, 0], [-20, -7]];

function scribbleCloud(x, y, s, t, sd = 1) { // argument scribble (no text)
  G(x, y, s, () => {
    const r = rng(sd + Math.floor(T * 8)), pts = [];
    for (let i = 0; i < 26; i++) { const a = i / 26 * 6.28 * 2.2; const rr = 60 + r() * 30; pts.push([Math.cos(a) * rr * 1.5, Math.sin(a) * rr * 0.7]); }
    line(pts, { lw: 3.5, sub: 0, double: false, seed: sd, alpha: t });
    for (let k = 0; k < 3; k++) { const a = -0.6 + k * 0.6; line([[Math.cos(a) * 140, -Math.sin(a + 1.6) * 70 - 20], [Math.cos(a) * 175, -Math.sin(a + 1.6) * 90 - 30]], { lw: 4, seed: sd + 10 + k, double: false, alpha: t }); }
  });
}
