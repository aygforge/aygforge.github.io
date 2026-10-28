// Hand-drawn props, sets and characters.

// ---------------- characters ----------------
const CAST = {
  guard: { skin: COL.skin, hair: 'short', hairCol: '#4a3a30', hat: 'kepi', hatCol: COL.navyD, coat: 'uniform', coatCol: COL.navy, pantsCol: COL.navyD, mous: 'big' },
  guard2: { skin: '#eec09a', hair: 'short', hairCol: '#2f2a2a', hat: 'kepi', hatCol: COL.navyD, coat: 'uniform', coatCol: COL.navy, pantsCol: COL.navyD, mous: 'handlebar' },
  inspector: { skin: '#efc39c', hair: 'short', hairCol: '#3b302a', hat: 'bowler', hatCol: COL.black, coat: 'overcoat', coatCol: '#5b5560', pantsCol: '#3d3a44', mous: 'handlebar', tie: COL.burg },
  gendarme: { skin: COL.skin, hair: 'short', hairCol: '#3a2e28', hat: 'kepi', hatCol: COL.navyD, coat: 'uniform', coatCol: COL.navyD, pantsCol: COL.navyD, mous: 'thin', cape: true },
  apollinaire: { skin: '#f1c9a3', hair: 'side', hairCol: '#4b3a2c', hat: null, coat: 'suit', coatCol: '#6a5a4a', pantsCol: '#4f4338', mous: 'thin', tie: '#2f3b6a', round: true },
  picasso: { skin: '#e9b98f', hair: 'fringe', hairCol: '#1f1a1e', hat: null, coat: 'shirt', coatCol: '#f3efe4', pantsCol: '#3b4f7a', scarf: COL.red, bigEyes: true },
  peruggia: { skin: '#ecbf95', hair: 'short', hairCol: '#2a2224', hat: 'cap', hatCol: '#6e6252', coat: 'smock', coatCol: COL.white, pantsCol: '#4a4038', mous: 'big' },
  dealer: { skin: '#efc6a2', hair: 'bald', hairCol: '#9a948e', hat: null, coat: 'waistcoat', coatCol: '#6d4a3a', pantsCol: '#3e3530', mous: 'big', beard: true, glasses: true, tie: COL.navy },
  lady: { skin: '#f2cdb0', hair: 'bun', hairCol: '#6a4630', hat: 'ladyhat', hatCol: '#9b6f8a', coat: 'dress', coatCol: '#8a9bb5', pantsCol: '#333' },
  lady2: { skin: '#f0c8a6', hair: 'bun', hairCol: '#3a2a22', hat: 'ladyhat', hatCol: '#c9a24a', coat: 'dress', coatCol: '#b77a6a', pantsCol: '#333' },
  gent: { skin: '#eec39e', hair: 'short', hairCol: '#5a4434', hat: 'boater', hatCol: COL.ochre, coat: 'suit', coatCol: '#7a7466', pantsCol: '#55504a', mous: 'thin', tie: COL.red },
  official: { skin: '#efc6a2', hair: 'side', hairCol: '#8a8580', hat: null, coat: 'suit', coatCol: COL.black, pantsCol: '#2f2b33', mous: 'big', tie: COL.white },
};

function person(c, P, q = {}) {
  q = Object.assign({ look: 0, lookY: 0, mouth: 'flat', brow: 0, blink: false, armL: [0.12, 0.1], armR: [0.12, 0.1], walk: null, tilt: 0, bob: 0, worried: 0, sweat: 0, shock: 0 }, q);
  const sil = P.sil || G.mode === 'sil';
  c.save();
  c.translate(0, q.bob);
  const hipY = -300;
  // legs
  if (P.coat !== 'dress') {
    for (const s of [-1, 1]) {
      const sw = q.walk !== null ? Math.sin(q.walk) * 0.32 * s : 0;
      const hx = s * 26, fx = hx + Math.sin(sw) * 290 + s * 4, fy = hipY + Math.cos(sw) * 290;
      const kx = (hx + fx) / 2 + Math.abs(sw) * 18, ky = (hipY + fy) / 2;
      tube(c, [[hx, hipY], [kx, ky], [fx, fy - 10]], 42, P.pantsCol, { k: 11 + s });
      blob(c, E(fx + 12, fy - 6, 30, 13, 18), COL.black, { k: 12 + s, gap: 5 });
    }
  } else {
    for (const s of [-1, 1]) blob(c, E(s * 40 + 10, -6, 26, 11, 16), COL.black, { k: 12 + s });
  }
  // neck
  blob(c, R(-15, -505, 30, 42), P.skin, { k: 21 });
  // cape behind
  if (P.cape) blob(c, spline([[-80, -470], [-112, -330], [-118, -205], [0, -195], [118, -205], [112, -330], [80, -470], [0, -488]], true, 6), P.coatCol, { k: 22, gap: 6 });
  // body
  const bodies = {
    suit: [[-76, -468], [-82, -400], [-68, -320], [-74, -250], [0, -238], [74, -250], [68, -320], [82, -400], [76, -468], [28, -488], [-28, -488]],
    uniform: [[-78, -468], [-84, -400], [-68, -320], [-76, -232], [0, -224], [76, -232], [68, -320], [84, -400], [78, -468], [28, -488], [-28, -488]],
    smock: [[-76, -468], [-84, -390], [-80, -300], [-96, -160], [0, -150], [96, -160], [80, -300], [84, -390], [76, -468], [28, -488], [-28, -488]],
    overcoat: [[-80, -468], [-88, -390], [-82, -300], [-100, -120], [0, -110], [100, -120], [82, -300], [88, -390], [80, -468], [28, -488], [-28, -488]],
    shirt: [[-74, -468], [-82, -400], [-70, -320], [-72, -262], [0, -255], [72, -262], [70, -320], [82, -400], [74, -468], [26, -486], [-26, -486]],
    waistcoat: [[-74, -468], [-80, -400], [-68, -320], [-72, -255], [0, -246], [72, -255], [68, -320], [80, -400], [74, -468], [26, -486], [-26, -486]],
    dress: [[-70, -468], [-62, -400], [-46, -345], [-88, -200], [-134, -6], [0, 0], [134, -6], [88, -200], [46, -345], [62, -400], [70, -468], [26, -484], [-26, -484]],
  };
  const body = spline(bodies[P.coat], true, 5);
  if (P.coat === 'waistcoat') { blob(c, body, COL.white, { k: 23 }); }
  blob(c, body, P.coat === 'waistcoat' ? null : P.coatCol, { k: 23, gap: P.coat === 'smock' ? 9 : 6, base: P.coat === 'smock' ? 0.35 : 0.55 });
  if (!sil) {
    if (P.coat === 'suit' || P.coat === 'overcoat') {
      fill(c, [[-22, -486], [22, -486], [0, -420]], COL.white, { k: 24 });
      if (P.tie) blob(c, [[-6, -480], [6, -480], [9, -430], [0, -412], [-9, -430]], P.tie, { k: 25, w: 3 });
      stroke(c, [[-30, -486], [-14, -400], [0, -380]], { w: 3.5, k: 26 });
      stroke(c, [[30, -486], [14, -400], [0, -380]], { w: 3.5, k: 27 });
      for (let i = 0; i < 3; i++) dot(c, 4, -360 + i * 40, 4);
    }
    if (P.coat === 'uniform') {
      for (let i = 0; i < 5; i++) { dot(c, -14, -455 + i * 40, 4.5, COL.gold); dot(c, 14, -455 + i * 40, 4.5, COL.gold); }
      blob(c, R(-72, -300, 144, 18), COL.black, { k: 28, w: 3 });
      stroke(c, [[-22, -486], [0, -470], [22, -486]], { w: 3 });
    }
    if (P.coat === 'smock') {
      stroke(c, [[0, -470], [0, -160]], { w: 3, a: 0.7, k: 29 });
      for (let i = 0; i < 4; i++) dot(c, 8, -440 + i * 55, 4);
      stroke(c, R(-70, -300, 40, 36), { closed: true, w: 3, a: 0.7, k: 30 });
      stroke(c, [[-22, -486], [0, -462], [22, -486]], { w: 3 });
    }
    if (P.coat === 'shirt') {
      stroke(c, [[0, -470], [0, -270]], { w: 2.5, a: 0.6, k: 31 });
      if (P.scarf) blob(c, [[-24, -488], [24, -488], [18, -466], [6, -452], [12, -420], [-2, -424], [-4, -452], [-20, -466]], P.scarf, { k: 32, w: 3.5 });
      for (let i = 0; i < 3; i++) stroke(c, [[-60 + i * 4, -420 + i * 50], [-30, -415 + i * 50]], { w: 2, a: 0.25 });
    }
    if (P.coat === 'waistcoat') {
      blob(c, spline([[-62, -460], [-20, -486], [0, -400], [20, -486], [62, -460], [66, -260], [0, -246], [-66, -260]], true, 4), P.coatCol, { k: 33 });
      if (P.tie) blob(c, [[-12, -484], [12, -484], [0, -470]], P.tie, { k: 34 });
      for (let i = 0; i < 4; i++) dot(c, 4, -380 + i * 30, 3.5, COL.gold);
      stroke(c, [[10, -350], [40, -335], [60, -350]], { w: 2.5, col: COL.goldD });
    }
    if (P.coat === 'dress') {
      stroke(c, spline([[-46, -345], [0, -335], [46, -345]], false, 5), { w: 3, k: 35 });
      for (let i = 0; i < 4; i++) stroke(c, [[-50 + i * 34, -300], [-90 + i * 60, -20]], { w: 2.5, a: 0.4, k: 36 + i });
      blob(c, E(0, -478, 26, 10, 14), COL.white, { k: 37, w: 3 });
    }
  }
  // arms
  const arm = (s, a) => {
    const sx = s * 66, sy = -455;
    const ex = sx + s * Math.sin(a[0]) * 112, ey = sy + Math.cos(a[0]) * 112;
    const hx = ex + s * Math.sin(a[0] + a[1]) * 104, hy = ey + Math.cos(a[0] + a[1]) * 104;
    const sleeve = P.coat === 'waistcoat' ? COL.white : P.coatCol;
    tube(c, [[sx, sy], [ex, ey], [hx, hy]], 34, sleeve, { k: 40 + s });
    return [hx, hy];
  };
  const hl = arm(-1, q.armL), hr = arm(1, q.armR);
  if (q.holdL) { c.save(); c.translate(hl[0], hl[1]); q.holdL(c); c.restore(); }
  if (q.holdR) { c.save(); c.translate(hr[0], hr[1]); q.holdR(c); c.restore(); }
  blob(c, E(hl[0], hl[1], 16, 17, 14), P.skin, { k: 43, w: 3.5 });
  blob(c, E(hr[0], hr[1], 16, 17, 14), P.skin, { k: 44, w: 3.5 });
  // head
  c.save();
  c.translate(0, -490); c.rotate(q.tilt); c.translate(0, 490);
  head(c, P, q, sil);
  c.restore();
  c.restore();
  return { hl, hr };
}

function head(c, P, q, sil) {
  const hy = -555;
  if (P.hair === 'bun') blob(c, E(-30, -612, 30, 26, 18), P.hairCol, { k: 50 });
  blob(c, E(-50, hy + 4, 9, 15, 12), P.skin, { k: 51, w: 3.5 });
  blob(c, E(50, hy + 4, 9, 15, 12), P.skin, { k: 52, w: 3.5 });
  blob(c, E(0, hy, P.round ? 54 : 50, 60, 30), P.skin, { k: 53, gap: 8, base: 0.6 });
  const hairs = {
    short: [[-52, -556], [-51, -600], [-25, -622], [10, -626], [42, -610], [54, -572], [48, -560], [32, -592], [0, -598], [-32, -590]],
    fringe: [[-54, -552], [-53, -602], [-22, -628], [24, -624], [53, -596], [52, -556], [44, -572], [24, -582], [6, -572], [-14, -584], [-34, -578]],
    side: [[-54, -560], [-50, -598], [-20, -616], [16, -618], [44, -604], [55, -572], [46, -566], [36, -590], [-10, -598], [-40, -584]],
    bun: [[-52, -548], [-52, -600], [-20, -624], [20, -622], [52, -598], [52, -548], [40, -580], [0, -594], [-40, -580]],
  };
  if (hairs[P.hair]) blob(c, spline(hairs[P.hair], true, 4), P.hairCol, { k: 54, gap: 5 });
  if (P.hair === 'bald') {
    blob(c, spline([[-53, -540], [-52, -575], [-44, -582], [-46, -548]], true, 4), P.hairCol, { k: 55 });
    blob(c, spline([[53, -540], [52, -575], [44, -582], [46, -548]], true, 4), P.hairCol, { k: 56 });
  }
  if (!sil) {
    // eyes
    const lx = q.look * 6, ly = q.lookY * 4;
    for (const s of [-1, 1]) {
      const ex = s * 19 + lx * 0.4, ey = -560;
      if (P.bigEyes && !q.blink) { blob(c, E(ex, ey, 11, 9, 14), COL.white, { k: 57 + s, w: 2.5 }); }
      if (q.blink) stroke(c, [[ex - 7, ey], [ex + 7, ey]], { w: 3.5 });
      else {
        const r = P.bigEyes ? 6.5 : 5;
        dot(c, ex + lx * 0.6, ey + ly, r);
        dot(c, ex + lx * 0.6 + 2, ey + ly - 2.5, 1.6, COL.white);
      }
      const by = -582 - q.brow * 7 - q.shock * 6;
      const inner = q.worried * 6;
      stroke(c, [[ex - s * 11, by - (s < 0 ? 0 : inner)], [ex + s * 11, by - (s < 0 ? inner : 0)]].map(p => p), { w: P.bigEyes ? 5 : 3.5, k: 60 + s });
    }
    stroke(c, [[2, -560], [7, -538], [-3, -534]], { w: 3, k: 62 });
    fill(c, E(-30, -532, 11, 7), COL.cheek, { a: 0.35, hatch: false, base: 1 });
    fill(c, E(30, -532, 11, 7), COL.cheek, { a: 0.35, hatch: false, base: 1 });
    if (P.beard) blob(c, spline([[-49, -548], [-46, -512], [-28, -488], [0, -480], [28, -488], [46, -512], [49, -548], [34, -526], [0, -518], [-34, -526]], true, 4), P.hairCol, { k: 63 });
    // mouth
    const my = -514;
    const m = q.mouth === 'talk' ? (Math.sin(G.t * 21) > 0 ? 'o' : 'flat') : q.mouth;
    if (m === 'o') blob(c, E(0, my + 2, 7 + q.shock * 3, 9 + q.shock * 4, 14), '#7a2f35', { k: 64, w: 3 });
    else if (m === 'smile') stroke(c, spline([[-14, my - 3], [0, my + 6], [14, my - 3]], false, 5), { w: 3.5 });
    else if (m === 'frown') stroke(c, spline([[-12, my + 4], [0, my - 3], [12, my + 4]], false, 5), { w: 3.5 });
    else if (m === 'wobbly') stroke(c, [[-12, my], [-6, my - 3], [0, my + 1], [6, my - 3], [12, my]], { w: 3.2 });
    else stroke(c, [[-10, my], [10, my + 1]], { w: 3.5 });
    if (P.mous === 'big') {
      for (const s of [-1, 1]) blob(c, spline([[0, -531], [s * 14, -536], [s * 32, -527], [s * 38, -516], [s * 24, -520], [s * 6, -524]], true, 4), P.hairCol, { k: 65 + s, w: 3 });
    } else if (P.mous === 'handlebar') {
      for (const s of [-1, 1]) blob(c, spline([[0, -530], [s * 18, -534], [s * 34, -528], [s * 40, -540], [s * 44, -532], [s * 36, -520], [s * 18, -522]], true, 4), P.hairCol, { k: 67 + s, w: 3 });
    } else if (P.mous === 'thin') {
      for (const s of [-1, 1]) stroke(c, [[s * 3, -529], [s * 16, -531], [s * 26, -524]], { w: 5, col: P.hairCol, k: 69 + s });
    }
    if (P.glasses) {
      for (const s of [-1, 1]) stroke(c, E(s * 19, -560, 13, 12, 18), { closed: true, w: 2.8 });
      stroke(c, [[-6, -562], [6, -562]], { w: 2.5 });
    }
    if (q.sweat > 0) W_(c, () => blob(c, spline([[56, -610], [64, -592], [60, -582], [52, -582], [49, -592]], true, 4), '#9fc3dc', { k: 70, w: 2.5 }), { alpha: q.sweat, y: q.sweat * 10 });
  }
  hat(c, P, sil);
}

function hat(c, P, sil) {
  const hc = P.hatCol;
  if (P.hat === 'kepi') {
    blob(c, [[-46, -598], [-41, -660], [41, -660], [46, -598]], hc, { k: 71, gap: 6 });
    blob(c, E(0, -660, 41, 8, 18), hc, { k: 72, w: 3 });
    if (!sil) stroke(c, [[-45, -612], [45, -612]], { w: 5, col: COL.gold, a: 0.9 });
    blob(c, spline([[-48, -600], [0, -590], [56, -594], [52, -604], [0, -603]], true, 4), COL.black, { k: 73, w: 3 });
  } else if (P.hat === 'bowler') {
    blob(c, E(0, -606, 46, 44, 24, Math.PI, Math.PI * 2), hc, { k: 74 });
    blob(c, spline([[-72, -604], [-40, -614], [40, -614], [72, -604], [40, -596], [-40, -596]], true, 4), hc, { k: 75, w: 3.5 });
    if (!sil) stroke(c, [[-44, -612], [44, -612]], { w: 4, col: COL.burg, a: 0.7 });
  } else if (P.hat === 'cap') {
    blob(c, spline([[-56, -588], [-50, -624], [-10, -638], [40, -632], [64, -606], [80, -596], [56, -588], [0, -598]], true, 4), hc, { k: 76, gap: 6 });
    stroke(c, [[-30, -628], [30, -600]], { w: 2.5, a: 0.5 });
  } else if (P.hat === 'ladyhat') {
    blob(c, E(0, -614, 98, 20, 30), hc, { k: 77, gap: 6 });
    blob(c, E(0, -620, 54, 34, 20, Math.PI, Math.PI * 2), hc, { k: 78 });
    if (!sil) { blob(c, E(-36, -636, 14, 12, 12), COL.cheek, { k: 79, w: 3 }); blob(c, E(-18, -644, 11, 10, 12), COL.white, { k: 80, w: 3 }); }
  } else if (P.hat === 'boater') {
    blob(c, E(0, -608, 84, 15, 28), hc, { k: 81 });
    blob(c, [[-48, -610], [-46, -650], [46, -650], [48, -610]], hc, { k: 82 });
    if (!sil) blob(c, R(-48, -628, 96, 12), COL.navy, { k: 83, w: 2.5 });
  }
}

// ---------------- props ----------------
function goldFrame(c, x, y, w, h, o = {}) {
  const b = o.band ?? 44;
  const outer = R(x, y, w, h), inner = R(x + b, y + b, w - 2 * b, h - 2 * b);
  ring(c, outer, inner, COL.gold, { gap: 6, ang: -0.8, k: 90, base: 0.6 });
  // inner shadow band
  ring(c, R(x + b * 0.55, y + b * 0.55, w - b * 1.1, h - b * 1.1), inner, COL.goldD, { gap: 5, ang: 0.7, k: 91, a: 0.6 });
  stroke(c, outer, { closed: true, w: 5, k: 92 });
  stroke(c, inner, { closed: true, w: 4.5, k: 93 });
  stroke(c, R(x + b * 0.55, y + b * 0.55, w - b * 1.1, h - b * 1.1), { closed: true, w: 2.5, a: 0.6, k: 94 });
  if (o.simple) return;
  // highlights
  stroke(c, [[x + 10, y + h - 20], [x + 10, y + 10], [x + w - 20, y + 10]], { w: 4, col: COL.goldL, a: 0.9, k: 95 });
  // corner scrolls
  for (const [cx, cy] of [[x + b * 0.28, y + b * 0.28], [x + w - b * 0.28, y + b * 0.28], [x + b * 0.28, y + h - b * 0.28], [x + w - b * 0.28, y + h - b * 0.28]]) {
    const r = b * 0.3;
    stroke(c, spline([[cx - r, cy], [cx, cy - r], [cx + r, cy], [cx, cy + r * 0.6], [cx - r * 0.3, cy]], false, 5), { w: 3, col: COL.goldD, k: 96 });
    dot(c, cx, cy, 4, COL.goldD);
  }
  // crest
  const cx = x + w / 2;
  const crest = spline([[cx - 60, y + 6], [cx - 40, y - 26], [cx, y - 40], [cx + 40, y - 26], [cx + 60, y + 6]], false, 6);
  blob(c, crest.concat([[cx, y + 14]]), COL.gold, { k: 97 });
  for (let i = -2; i <= 2; i++) stroke(c, [[cx, y + 8], [cx + i * 22, y - 24 + Math.abs(i) * 6]], { w: 2.5, col: COL.goldD });
  blob(c, spline([[cx - 34, y + h - 4], [cx, y + h + 22], [cx + 34, y + h - 4]], false, 6).concat([[cx, y + h - 10]]), COL.gold, { k: 98 });
  // beading
  for (let i = 0; i < (w - 2 * b) / 24; i++) { dot(c, x + b + 12 + i * 24, y + b - 7, 3, COL.goldD); dot(c, x + b + 12 + i * 24, y + h - b + 7, 3, COL.goldD); }
  for (let i = 0; i < (h - 2 * b) / 24; i++) { dot(c, x + b - 7, y + b + 12 + i * 24, 3, COL.goldD); dot(c, x + w - b + 7, y + b + 12 + i * 24, 3, COL.goldD); }
}

function monaLisa(c, x, y, w, h) {
  c.save(); c.translate(x, y);
  fill(c, R(0, 0, w, h), '#8f9a72', { k: 100, gap: 6, ang: -0.3 });
  fill(c, R(0, 0, w, h * 0.32), '#b4bc9a', { k: 101, gap: 7, ang: 0.2 });
  // mountains & winding road
  stroke(c, [[0, h * 0.34], [w * 0.12, h * 0.26], [w * 0.22, h * 0.31], [w * 0.3, h * 0.24]], { w: 3, col: COL.greenD, a: 0.7 });
  stroke(c, [[w * 0.7, h * 0.24], [w * 0.8, h * 0.3], [w * 0.9, h * 0.22], [w, h * 0.28]], { w: 3, col: COL.greenD, a: 0.7 });
  stroke(c, spline([[w * 0.05, h * 0.55], [w * 0.15, h * 0.48], [w * 0.08, h * 0.42], [w * 0.2, h * 0.38]], false, 6), { w: 5, col: COL.ochre, a: 0.8 });
  fill(c, R(0, h * 0.62, w, h * 0.38), '#5c5a3c', { k: 102, gap: 6 });
  // hair behind
  blob(c, spline([[w * 0.32, h * 0.22], [w * 0.5, h * 0.12], [w * 0.68, h * 0.22], [w * 0.72, h * 0.5], [w * 0.76, h * 0.66], [w * 0.24, h * 0.66], [w * 0.28, h * 0.5]], true, 6), '#2f2622', { k: 103, gap: 5, w: 3 });
  // body / dress
  blob(c, spline([[w * 0.06, h * 1.0], [w * 0.12, h * 0.7], [w * 0.3, h * 0.6], [w * 0.5, h * 0.66], [w * 0.7, h * 0.6], [w * 0.88, h * 0.7], [w * 0.94, h * 1.0]], false, 6).concat([[w * 0.94, h], [w * 0.06, h]]), '#3e3127', { k: 104, gap: 5, w: 3.5 });
  // chest skin
  blob(c, spline([[w * 0.36, h * 0.6], [w * 0.5, h * 0.71], [w * 0.64, h * 0.6], [w * 0.5, h * 0.57]], true, 6), '#d9ad78', { k: 105, w: 3 });
  // face
  blob(c, E(w * 0.5, h * 0.36, w * 0.135, h * 0.165, 28), '#dcb07a', { k: 106, w: 3.5, gap: 6 });
  // veil / hair parting
  stroke(c, spline([[w * 0.36, h * 0.3], [w * 0.5, h * 0.19], [w * 0.64, h * 0.3]], false, 6), { w: 3, col: '#2f2622', a: 0.8 });
  blob(c, spline([[w * 0.37, h * 0.27], [w * 0.5, h * 0.19], [w * 0.63, h * 0.27], [w * 0.6, h * 0.22], [w * 0.5, h * 0.2], [w * 0.4, h * 0.22]], true, 5), '#2f2622', { k: 107, w: 2.5 });
  // features
  stroke(c, [[w * 0.43, h * 0.345], [w * 0.47, h * 0.342]], { w: 3.5 });
  stroke(c, [[w * 0.53, h * 0.342], [w * 0.57, h * 0.345]], { w: 3.5 });
  stroke(c, [[w * 0.505, h * 0.35], [w * 0.512, h * 0.395], [w * 0.495, h * 0.4]], { w: 2.5, a: 0.7 });
  stroke(c, spline([[w * 0.455, h * 0.428], [w * 0.5, h * 0.436], [w * 0.548, h * 0.424]], false, 5), { w: 3, col: '#6a3a2a' });
  // hands
  blob(c, spline([[w * 0.36, h * 0.9], [w * 0.5, h * 0.86], [w * 0.68, h * 0.88], [w * 0.7, h * 0.95], [w * 0.5, h * 0.96], [w * 0.38, h * 0.96]], true, 5), '#d9ad78', { k: 108, w: 3 });
  stroke(c, [[w * 0.5, h * 0.88], [w * 0.62, h * 0.92]], { w: 2.5, a: 0.6 });
  // varnish
  fill(c, R(0, 0, w, h), '#b08a3a', { a: 0.18, hatch: false, base: 1 });
  stroke(c, R(0, 0, w, h), { closed: true, w: 3.5 });
  c.restore();
}

function hooks(c, x, y, w, h) {
  for (const [hx, hy] of [[x + 20, y + 20], [x + w - 20, y + 20], [x + 20, y + h - 20], [x + w - 20, y + h - 20]]) {
    stroke(c, [[hx - 4, hy - 14], [hx - 4, hy + 6], [hx + 2, hy + 12], [hx + 9, hy + 6]], { w: 5.5, col: COL.black });
    dot(c, hx - 4, hy - 16, 5, COL.black);
  }
}

function emptyFrame(c, cx, cy, w, h, o = {}) {
  const x = cx - w / 2, y = cy - h / 2, b = o.band ?? 44;
  if (!o.noMark) {
    fill(c, R(x + b + 16, y + b + 16, w - 2 * b - 32, h - 2 * b - 32), '#a95560', { a: 0.5, k: 110, gap: 9 });
    stroke(c, R(x + b + 16, y + b + 16, w - 2 * b - 32, h - 2 * b - 32), { closed: true, w: 2.5, a: 0.4, k: 111 });
    hooks(c, x + b + 16, y + b + 16, w - 2 * b - 32, h - 2 * b - 32);
  }
  goldFrame(c, x, y, w, h, { band: b });
}

function wall(c, x0, y0, x1, y1, o = {}) {
  fill(c, R(x0, y0, x1 - x0, y1 - y0), o.col ?? COL.burg, { k: 120, gap: 9, ang: -1.3, base: 0.62 });
  // damask
  const dx = 150, dy = 170;
  for (let gy = Math.floor(y0 / dy); gy * dy < y1; gy++) for (let gx = Math.floor(x0 / dx) - 1; gx * dx < x1; gx++) {
    const px = gx * dx + (gy % 2 ? dx / 2 : 0), py = gy * dy + 60;
    if (px < x0 - 40 || px > x1 + 40 || py < y0 || py > y1 - 20) continue;
    stroke(c, spline([[px, py + 30], [px - 18, py], [px, py - 30], [px + 18, py], [px, py + 30]], false, 5), { w: 2.5, col: o.dcol ?? COL.burgL, a: 0.45, k: 121 });
    stroke(c, [[px - 26, py + 6], [px - 10, py + 2]], { w: 2.5, col: o.dcol ?? COL.burgL, a: 0.4 });
    stroke(c, [[px + 26, py + 6], [px + 10, py + 2]], { w: 2.5, col: o.dcol ?? COL.burgL, a: 0.4 });
  }
}
function wainscot(c, x0, x1, y0, y1) {
  fill(c, R(x0, y0, x1 - x0, y1 - y0), COL.beige, { k: 130, gap: 8 });
  blob(c, R(x0, y0 - 12, x1 - x0, 20), COL.woodL, { k: 131 });
  for (let px = Math.floor(x0 / 210) * 210 + 20; px < x1; px += 210) stroke(c, R(px, y0 + 26, 170, y1 - y0 - 50), { closed: true, w: 3, a: 0.6, k: 132 });
  stroke(c, [[x0, y1], [x1, y1]], { w: 4 });
}
function floor(c, x0, x1, y0, y1, col = '#b88b5c') {
  fill(c, R(x0, y0, x1 - x0, y1 - y0), col, { k: 140, gap: 8, ang: -0.2 });
  for (let i = -10; i < 30; i++) {
    const px = x0 + i * 90;
    stroke(c, [[px, y0], [px - 160, y1]], { w: 2.5, a: 0.35, k: 141 + i });
  }
  for (let j = 1; j < 4; j++) stroke(c, [[x0, y0 + (y1 - y0) * j / 4], [x1, y0 + (y1 - y0) * j / 4]], { w: 2, a: 0.25 });
}
function smallPainting(c, x, y, w, h, kind = 0) {
  if (kind === 0) {
    fill(c, R(x, y, w, h), '#a9b7c4', { k: 150 });
    fill(c, R(x, y + h * 0.6, w, h * 0.4), COL.green, { k: 151 });
    blob(c, E(x + w * 0.7, y + h * 0.25, w * 0.1, w * 0.1), COL.ochre, { k: 152, w: 3 });
    stroke(c, [[x, y + h * 0.62], [x + w * 0.3, y + h * 0.5], [x + w * 0.6, y + h * 0.6], [x + w, y + h * 0.52]], { w: 3 });
  } else if (kind === 1) {
    fill(c, R(x, y, w, h), '#5d4a3c', { k: 153 });
    blob(c, E(x + w / 2, y + h * 0.42, w * 0.18, h * 0.16), '#d8b48a', { k: 154, w: 3 });
    blob(c, spline([[x + w * 0.2, y + h], [x + w * 0.3, y + h * 0.65], [x + w * 0.7, y + h * 0.65], [x + w * 0.8, y + h]], false, 5).concat([[x + w * 0.8, y + h]]), '#7a3a3a', { k: 155, w: 3 });
  } else {
    fill(c, R(x, y, w, h), '#c9b48a', { k: 156 });
    blob(c, E(x + w * 0.5, y + h * 0.55, w * 0.25, h * 0.2), '#b5543c', { k: 157, w: 3 });
    blob(c, E(x + w * 0.35, y + h * 0.5, w * 0.12, h * 0.1), '#e1b44e', { k: 158, w: 3 });
  }
  goldFrame(c, x - 26, y - 26, w + 52, h + 52, { band: 26, simple: true });
}

// standard Louvre gallery set. frame centred at (540, 1010)
const FR = { cx: 540, cy: 1010, w: 470, h: 640 };
function gallery(c, o = {}) {
  wall(c, -260, 300, 1340, 1520);
  // cornice
  blob(c, R(-260, 360, 1600, 26), COL.goldD, { k: 160, w: 3.5 });
  wainscot(c, -260, 1340, 1520, 1650);
  floor(c, -260, 1340, 1650, 2000);
  if (!o.noSide) {
    smallPainting(c, -170, 760, 220, 280, 0);
    smallPainting(c, 1030, 740, 220, 300, 1);
  }
  // rope barrier posts
  if (o.rope) {
    for (const px of [230, 850]) { blob(c, R(px - 9, 1560, 18, 150), COL.gold, { k: 161 }); blob(c, E(px, 1556, 16, 12), COL.gold, { k: 162 }); }
    stroke(c, spline([[230, 1570], [540, 1640], [850, 1570]], false, 8), { w: 9, col: COL.burgD, a: 0.9 });
  }
}

function newspaper(c, x, y, w, h, o = {}) {
  c.save(); c.translate(x, y);
  blob(c, R(0, 0, w, h), COL.news, { k: 170 + (o.k ?? 0), gap: 9, base: 0.8, w: 3.5 });
  const m = w * 0.06;
  // masthead: abstract heavy scribble bar
  const mh = h * 0.08;
  fill(c, R(m + w * 0.1, m, w - 2 * m - w * 0.2, mh), COL.black, { k: 171, gap: 4, ang: 1.2, base: 0.75, a: 0.85 });
  stroke(c, [[m, m + mh + 10], [w - m, m + mh + 10]], { w: 3.5 });
  stroke(c, [[m, m + mh + 18], [w - m, m + mh + 18]], { w: 2 });
  // headline bar (abstract print block)
  fill(c, R(m, m + mh + 30, w - 2 * m, h * 0.045), COL.inkSoft, { k: 172, gap: 4, ang: 1.3, base: 0.6, a: 0.8 });
  const top = m + mh + 30 + h * 0.07;
  // picture box
  const pw = w * 0.5, ph = h * 0.34, px = m, py = top;
  blob(c, R(px, py, pw, ph), '#ddd5c2', { k: 173, w: 3 });
  if (o.img === 'mona') { W_(c, () => monaLisa(c, px + pw * 0.22, py + ph * 0.08, pw * 0.56, ph * 0.84)); }
  else if (o.img !== 'none') {
    goldFrame(c, px + pw * 0.25, py + ph * 0.12, pw * 0.5, ph * 0.76, { band: Math.max(8, pw * 0.06), simple: true });
    hand(c, '?', px + pw * 0.5, py + ph * 0.5, ph * 0.35, { col: COL.inkSoft, a: 0.6 });
  }
  // text columns (squiggles)
  const lines = (x0, y0, x1, y1) => {
    for (let ly = y0; ly < y1; ly += 16) {
      const pts = []; const L = x1 - x0 - h1(ly + (o.k ?? 0)) * 30;
      for (let lx = 0; lx <= L; lx += 12) pts.push([x0 + lx, ly + Math.sin(lx * 0.5 + ly) * 2]);
      stroke(c, pts, { w: 2.2, a: 0.42, amp: 0.6, k: ly });
    }
  };
  lines(px + pw + 16, top, w - m, top + ph);
  lines(m, top + ph + 20, w / 2 - 8, h - m);
  lines(w / 2 + 8, top + ph + 20, w - m, h - m);
  stroke(c, [[w / 2, top + ph + 20], [w / 2, h - m]], { w: 2, a: 0.5 });
  c.restore();
}

function questionMark(c, x, y, s, o = {}) { hand(c, '?', x, y, s, Object.assign({ col: COL.ink, a: 0.85 }, o)); }

function shockLines(c, x, y, r, a = 1) {
  for (let i = 0; i < 7; i++) {
    const an = -Math.PI * 0.9 + i * (Math.PI * 0.8 / 6);
    stroke(c, [[x + Math.cos(an) * r, y + Math.sin(an) * r], [x + Math.cos(an) * (r + 34), y + Math.sin(an) * (r + 34)]], { w: 4.5, a: 0.8 * a, k: 180 + i });
  }
}

function notebook(c, w = 90, h = 120, o = {}) {
  blob(c, R(-w / 2, -h, w, h), o.col ?? '#f6f1e2', { k: 190, w: 3.5 });
  for (let i = 1; i < 6; i++) stroke(c, [[-w / 2 + 10, -h + i * h / 6], [w / 2 - 10, -h + i * h / 6]], { w: 1.8, a: 0.35, col: '#5a6fa0' });
  stroke(c, [[-w / 2, -h], [-w / 2, 0]], { w: 6, col: COL.burg });
}
function pencilProp(c, len = 80, rot = -0.6) {
  c.save(); c.rotate(rot);
  blob(c, R(-6, -len, 12, len - 14), COL.ochre, { k: 195, w: 3 });
  blob(c, [[-6, -14], [6, -14], [0, 4]], COL.beige, { k: 196, w: 3 });
  c.restore();
}
function magnifier(c, r = 34, rot = 0.6) {
  c.save(); c.rotate(rot);
  tube(c, [[0, 0], [0, 70]], 12, COL.woodD, { k: 197 });
  blob(c, E(0, -r, r, r, 26), '#d6e6ec', { k: 198, w: 5, a: 0.5, base: 0.4 });
  stroke(c, E(0, -r, r - 8, r - 8, 20, -2.4, -1.4), { w: 3, col: COL.white, a: 0.9 });
  c.restore();
}
function wrappedPainting(c, w = 150, h = 200) {
  blob(c, spline([[-w / 2, -h / 2], [0, -h / 2 - 6], [w / 2, -h / 2], [w / 2 + 4, 0], [w / 2, h / 2], [0, h / 2 + 5], [-w / 2, h / 2], [-w / 2 - 4, 0]], true, 4), COL.white, { k: 200, gap: 10, base: 0.35, w: 4 });
  for (let i = 0; i < 4; i++) stroke(c, [[-w / 2 + 20 + i * 30, -h / 2 + 10], [-w / 2 + 40 + i * 25, h / 2 - 15]], { w: 2.5, a: 0.4, k: 201 + i });
  stroke(c, [[-w / 2, -10], [w / 2, 10]], { w: 4, col: COL.brown });
}

function trunk(c, x, y, w, h, lid = 0) {
  c.save(); c.translate(x, y);
  blob(c, R(-w / 2, -h, w, h), COL.wood, { k: 210, gap: 6 });
  for (const fx of [-w / 2 + 30, w / 2 - 30]) blob(c, R(fx - 9, -h, 18, h), COL.woodD, { k: 211, w: 3 });
  blob(c, R(-14, -h + 6, 28, 30), COL.gold, { k: 212, w: 3 });
  // lid
  c.save(); c.translate(-w / 2, -h); c.rotate(-lid * 1.6);
  blob(c, spline([[0, 0], [0, -h * 0.35], [w * 0.5, -h * 0.48], [w, -h * 0.35], [w, 0]], false, 5).concat([[w, 0]]), COL.woodL, { k: 213, gap: 6 });
  blob(c, R(20, -h * 0.4, 18, h * 0.4), COL.woodD, { k: 214, w: 3 });
  blob(c, R(w - 38, -h * 0.4, 18, h * 0.4), COL.woodD, { k: 215, w: 3 });
  c.restore();
  c.restore();
}

function crowdRow(c, x0, x1, y, o = {}) {
  const n = o.n ?? 6, sp = (x1 - x0) / n, s = o.s ?? 1;
  const kinds = [CAST.gent, CAST.lady, CAST.inspector, CAST.lady2, Object.assign({}, CAST.gent, { hat: 'bowler', hatCol: COL.black, coatCol: '#5a5a6a' }), Object.assign({}, CAST.lady, { coatCol: '#9a7a5a', hatCol: '#6a7a5a' })];
  for (let i = 0; i < n; i++) {
    const P = Object.assign({}, kinds[(i + (o.off ?? 0)) % kinds.length]);
    if (o.back) P.backView = true;
    const bx = x0 + sp * (i + 0.5) + Math.sin(i * 7.3 + (o.off ?? 0)) * sp * 0.15;
    const bob = Math.sin(G.t * 3 + i * 1.7) * 4;
    W_(c, () => {
      if (o.back) backFigure(c, P, bob); else person(c, P, Object.assign({ bob, look: Math.sin(i * 3.3) * 0.6, mouth: o.mouth ?? 'o', brow: 1 }, o.pose ? o.pose(i) : {}));
    }, { x: bx, y, s: s * (0.92 + h1(i * 4.1) * 0.12) });
  }
}
// figure seen from behind (for crowds staring at the wall)
function backFigure(c, P, bob = 0) {
  c.save(); c.translate(0, bob);
  const body = P.coat === 'dress'
    ? spline([[-70, -468], [-62, -400], [-46, -345], [-88, -200], [-134, -6], [134, -6], [88, -200], [46, -345], [62, -400], [70, -468], [0, -488]], true, 5)
    : spline([[-78, -468], [-84, -390], [-80, -260], [-78, -200], [78, -200], [80, -260], [84, -390], [78, -468], [0, -488]], true, 5);
  if (P.coat !== 'dress') for (const s of [-1, 1]) tube(c, [[s * 26, -220], [s * 30, -10]], 42, P.pantsCol, { k: 300 + s });
  blob(c, body, P.coatCol, { k: 301 });
  for (const s of [-1, 1]) tube(c, [[s * 66, -455], [s * 76, -350], [s * 72, -260]], 32, P.coatCol, { k: 302 + s });
  blob(c, E(0, -555, 50, 60), P.skin, { k: 304 });
  blob(c, spline([[-52, -540], [-50, -600], [0, -624], [50, -600], [52, -540], [30, -520], [-30, -520]], true, 4), P.hairCol, { k: 305 });
  if (P.hair === 'bun') blob(c, E(0, -585, 26, 22), P.hairCol, { k: 306 });
  hat(c, P, true);
  c.restore();
}

function speech(c, x, y, w, h, tailX, tailY, o = {}) {
  const pts = spline([[x - w / 2, y], [x - w / 2 + 10, y - h / 2], [x, y - h / 2 - 6], [x + w / 2 - 10, y - h / 2], [x + w / 2, y], [x + w / 2 - 10, y + h / 2], [x + 20, y + h / 2 + 4], [tailX, tailY], [x - 10, y + h / 2 + 2], [x - w / 2 + 10, y + h / 2]], true, 4);
  blob(c, pts, COL.white, { k: 220, w: 4, base: 0.9, gap: 12 });
}

function deskLamp(c, x, y, on = 1) {
  c.save(); c.translate(x, y);
  if (on > 0) fill(c, [[-30, -150], [30, -150], [130, 40], [-130, 40]], '#f2d77a', { a: 0.35 * on, hatch: false, base: 1 });
  blob(c, R(-40, -12, 80, 12), COL.gold, { k: 230 });
  tube(c, [[0, -12], [0, -130]], 8, COL.gold, { k: 231 });
  blob(c, spline([[-60, -150], [-50, -185], [50, -185], [60, -150]], false, 4).concat([[60, -150]]), '#3f7a5a', { k: 232 });
  c.restore();
}
function desk(c, x, y, w) {
  blob(c, R(x, y, w, 24), COL.woodL, { k: 240 });
  blob(c, R(x + 10, y + 24, w - 20, 160), COL.wood, { k: 241, gap: 6 });
  for (let i = 0; i < 2; i++) blob(c, R(x + 30 + i * (w - 200), y + 50, 140, 50), COL.woodD, { k: 242 + i, w: 3, a: 0.6 });
}
function filePile(c, x, y, n = 4) {
  for (let i = 0; i < n; i++) blob(c, R(x - 70 + (i % 2) * 6, y - (i + 1) * 16, 140, 16), i % 2 ? '#d9c08a' : '#c8a96a', { k: 250 + i, w: 3 });
}
function folder(c, x, y, w, h, open = 0, col = '#c8a96a') {
  c.save(); c.translate(x, y);
  blob(c, R(-w / 2, -h, w, h), col, { k: 260 });
  blob(c, R(-w / 2 + 14, -h - 16, w * 0.3, 18), col, { k: 261, w: 3 });
  // front flap
  c.save(); c.scale(1, Math.cos(open * Math.PI * 0.85));
  blob(c, R(-w / 2, -h * 0.92, w, h * 0.92), '#d9c08a', { k: 262 });
  stroke(c, [[-w / 2 + 30, -h * 0.5], [w / 2 - 30, -h * 0.5]], { w: 3, col: COL.red, a: 0.7 });
  c.restore();
  c.restore();
}

// police investigation board
function board(c, x, y, w, h) {
  blob(c, R(x - 26, y - 26, w + 52, h + 52), COL.woodD, { k: 270 });
  blob(c, R(x, y, w, h), COL.cork, { k: 271, gap: 8 });
  for (let i = 0; i < 90; i++) dot(c, x + h1(i * 1.7) * w, y + h1(i * 2.9) * h, 2.5, COL.brown, 0.4);
}
function pin(c, x, y, col = COL.red) { dot(c, x, y, 9, col); dot(c, x - 3, y - 3, 3, COL.white, 0.8); }
function note(c, x, y, w, h, rot = 0, k = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  blob(c, R(-w / 2, -h / 2, w, h), '#f5efdc', { k: 280 + k, w: 3 });
  for (let i = 1; i < 5; i++) stroke(c, [[-w / 2 + 12, -h / 2 + i * h / 5], [w / 2 - 12 - h1(i + k) * 30, -h / 2 + i * h / 5]], { w: 2, a: 0.45, k: i + k });
  pin(c, 0, -h / 2 + 10);
  c.restore();
}
function stringLine(c, a, b, rev = 1, col = COL.red) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 26;
  stroke(c, spline([a, [mx, my], b], false, 10), { w: 4, col, a: 0.95, rev });
}
// photo/portrait card on the board
function portraitCard(c, x, y, w, h, P, q = {}, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  blob(c, R(-w / 2, -h / 2, w, h), '#efe6cf', { k: 290, w: 3.5 });
  const iw = w - 24, ih = h - 40;
  c.save();
  const clip = new Path2D(); clip.rect(-iw / 2, -h / 2 + 12, iw, ih); c.clip(clip);
  fill(c, R(-iw / 2, -h / 2 + 12, iw, ih), '#d8c9a8', { k: 291, gap: 9 });
  W_(c, () => person(c, P, q), { x: 0, y: -h / 2 + 12 + ih * 1.75, s: ih / 360 });
  c.restore();
  stroke(c, R(-iw / 2, -h / 2 + 12, iw, ih), { closed: true, w: 3 });
  pin(c, 0, -h / 2 + 4);
  c.restore();
}

function calendar(c, x, y, year, tear = 0, nextYear = null) {
  c.save(); c.translate(x, y);
  blob(c, R(-80, -20, 160, 24), COL.burg, { k: 310 });
  const page = (yr, k) => {
    blob(c, R(-74, 4, 148, 170), '#f8f3e6', { k: 311 + k, w: 3.5 });
    hand(c, yr, 0, 60, 52, { col: COL.ink });
    for (let r = 0; r < 3; r++) for (let q = 0; q < 5; q++) dot(c, -50 + q * 25, 110 + r * 20, 3, COL.inkSoft, 0.6);
  };
  if (nextYear && tear > 0) page(nextYear, 1);
  if (tear < 1) W_(c, () => { page(year, 0); }, { rot: tear * 0.6, x: tear * 60, y: tear * tear * 260, alpha: 1 - tear * tear });
  dot(c, -40, -8, 6, COL.black); dot(c, 40, -8, 6, COL.black);
  c.restore();
}

function curtains(c, x, y, w, h, t) {
  for (const s of [-1, 1]) {
    const sw = Math.sin(t * 1.4 + s) * 12;
    const ex = s < 0 ? x : x + w;
    const pts = s < 0
      ? spline([[ex - 20, y - 10], [ex + 70 + sw * 0.3, y], [ex + 60 + sw, y + h * 0.5], [ex + 90 + sw * 1.3, y + h + 10], [ex - 20, y + h + 10]], true, 5)
      : spline([[ex + 20, y - 10], [ex - 70 + sw * 0.3, y], [ex - 60 + sw, y + h * 0.5], [ex - 90 + sw * 1.3, y + h + 10], [ex + 20, y + h + 10]], true, 5);
    blob(c, pts, '#b55a52', { k: 320 + s, gap: 6 });
    for (let i = 1; i < 3; i++) stroke(c, [[ex - s * -20 * i, y + 20], [ex - s * -24 * i + sw, y + h]], { w: 2.5, a: 0.4 });
  }
  blob(c, R(x - 40, y - 24, w + 80, 16), COL.woodD, { k: 323 });
}

function parisRoofs(c, x0, x1, yb, o = {}) {
  // distant Eiffel tower
  if (o.eiffel !== false) {
    const ex = o.ex ?? 820, ey = yb - 80;
    stroke(c, [[ex - 60, ey], [ex - 8, ey - 360], [ex, ey - 420]], { w: 3.5, col: COL.zincD, a: 0.7 });
    stroke(c, [[ex + 60, ey], [ex + 8, ey - 360], [ex, ey - 420]], { w: 3.5, col: COL.zincD, a: 0.7 });
    stroke(c, [[ex - 36, ey - 140], [ex + 36, ey - 140]], { w: 3, col: COL.zincD, a: 0.6 });
    stroke(c, [[ex - 18, ey - 260], [ex + 18, ey - 260]], { w: 3, col: COL.zincD, a: 0.6 });
    stroke(c, spline([[ex - 50, ey], [ex, ey - 60], [ex + 50, ey]], false, 6), { w: 3, col: COL.zincD, a: 0.6 });
  }
  // back row
  let px = x0; let i = 0;
  while (px < x1) {
    const bw = 150 + h1(i * 3.3) * 110, bh = 140 + h1(i * 5.1) * 100;
    blob(c, [[px, yb], [px, yb - bh], [px + 22, yb - bh - 50], [px + bw - 22, yb - bh - 50], [px + bw, yb - bh], [px + bw, yb]], i % 2 ? '#c9b89a' : '#d6c4a2', { k: 330 + i, gap: 9 });
    blob(c, [[px + 18, yb - bh - 2], [px + 22, yb - bh - 50], [px + bw - 22, yb - bh - 50], [px + bw - 18, yb - bh - 2]], COL.zinc, { k: 340 + i, gap: 6 });
    blob(c, R(px + bw * 0.3, yb - bh - 80, 22, 36), COL.terra, { k: 350 + i, w: 3 });
    for (let wx = px + 24; wx < px + bw - 30; wx += 46) for (let wy = yb - bh + 30; wy < yb - 30; wy += 70) blob(c, R(wx, wy, 22, 40), '#6d7a94', { k: 360 + wx, w: 2.5, a: 0.7 });
    px += bw; i++;
  }
}

function press(c, x, y, t) {
  c.save(); c.translate(x, y);
  // frame
  blob(c, [[-300, 0], [-280, -460], [280, -460], [300, 0]], COL.char, { k: 400, gap: 6, base: 0.45 });
  blob(c, R(-250, -420, 500, 380), '#8b8792', { k: 401, gap: 8, a: 0.5 });
  const wheel = (cx, cy, r, sp, col) => {
    blob(c, E(cx, cy, r, r, 30), col, { k: 402 + r, gap: 6 });
    for (let i = 0; i < 6; i++) { const a = t * sp + i * Math.PI / 3; stroke(c, [[cx, cy], [cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9]], { w: 5 }); }
    dot(c, cx, cy, r * 0.15, COL.black);
  };
  wheel(-150, -250, 120, 4, COL.zincD);
  wheel(110, -300, 80, -6, COL.zinc);
  wheel(130, -130, 60, 8, COL.zinc);
  // gear teeth on big wheel
  for (let i = 0; i < 16; i++) { const a = t * 4 + i * Math.PI / 8; dot(c, -150 + Math.cos(a) * 128, -250 + Math.sin(a) * 128, 8, COL.char); }
  // paper web
  stroke(c, spline([[-150, -370], [20, -380], [110, -380], [190, -300], [190, -130], [320, -60]], false, 8), { w: 12, col: COL.news, a: 1 });
  stroke(c, spline([[-150, -370], [20, -380], [110, -380], [190, -300], [190, -130], [320, -60]], false, 8), { w: 3 });
  c.restore();
}

function corridor(c, ox, t) {
  // perspective gallery corridor, vanishing point (540, 1060)
  const vx = 540, vy = 1060;
  fill(c, R(-100, 300, 1280, 1700), '#d9c3a0', { k: 500, gap: 9 });
  fill(c, [[-100, 1900], [1180, 1900], [vx + 120, vy + 130], [vx - 120, vy + 130]], '#b48a5e', { k: 501, gap: 8 });
  for (let i = 0; i < 9; i++) {
    const z = ((i + (ox % 1)) / 9);
    const f = Math.pow(z, 1.8);
    const hw = lerp(720, 120, f), top = lerp(320, vy - 170, f), bot = lerp(1900, vy + 130, f);
    stroke(c, [[vx - hw, bot], [vx - hw, top + hw * 0.3]], { w: lerp(5, 2, f), a: 0.8, k: 510 + i });
    stroke(c, [[vx + hw, bot], [vx + hw, top + hw * 0.3]], { w: lerp(5, 2, f), a: 0.8, k: 520 + i });
    stroke(c, spline([[vx - hw, top + hw * 0.3], [vx, top], [vx + hw, top + hw * 0.3]], false, 8), { w: lerp(5, 2, f), a: 0.8, k: 530 + i });
    if (i % 2 === 0 && f < 0.7) {
      const ph = hw * 0.35;
      fill(c, R(vx - hw + hw * 0.06, (top + bot) / 2 - ph, hw * 0.18, ph * 1.2), COL.gold, { a: 0.7, k: 540 + i });
      fill(c, R(vx + hw - hw * 0.24, (top + bot) / 2 - ph, hw * 0.18, ph * 1.2), COL.gold, { a: 0.7, k: 550 + i });
    }
  }
  fill(c, E(vx, vy, 90, 140), '#fff3cf', { a: 0.6, hatch: false, base: 1 });
  for (let i = -6; i <= 6; i++) stroke(c, [[vx + i * 20, vy + 130], [vx + i * 200, 1900]], { w: 2, a: 0.3, k: 560 + i });
}

function apartment(c, t, o = {}) {
  // wallpaper
  fill(c, R(-100, 300, 1280, 1400), '#e3d2ad', { k: 600, gap: 9 });
  for (let x = -60; x < 1180; x += 70) stroke(c, [[x, 300], [x, 1460]], { w: 3, col: '#c4a87a', a: 0.5, k: 601 + x });
  floor(c, -100, 1180, 1460, 2000, '#a0754c');
  stroke(c, [[-100, 1460], [1180, 1460]], { w: 5 });
  // window
  const wx = o.wx ?? 120, wy = o.wy ?? 600, ww = 300, wh = 420;
  W_(c, () => {
    fill(c, R(wx, wy, ww, wh), '#c9d6dc', { k: 610, gap: 9 });
    W_(c, () => parisRoofs(c, wx, wx + ww, wy + wh, { eiffel: true, ex: wx + 200 }), {});
  });
  blob(c, R(wx - 12, wy - 12, ww + 24, wh + 24), null, { w: 5 });
  stroke(c, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], { w: 7, col: COL.white, a: 1 });
  stroke(c, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], { w: 3 });
  stroke(c, [[wx, wy + wh * 0.45], [wx + ww, wy + wh * 0.45]], { w: 3 });
  curtains(c, wx, wy, ww, wh, t);
}

function trainInterior(c, t, o = {}) {
  fill(c, R(-100, 300, 1280, 1600), '#8a5a3a', { k: 700, gap: 7 });
  for (let x = -60; x < 1180; x += 110) stroke(c, [[x, 300], [x, 1900]], { w: 3, col: COL.woodD, a: 0.5 });
  const wx = 190, wy = 640, ww = 700, wh = 560;
  c.save();
  const clip = new Path2D(); clip.roundRect(wx, wy, ww, wh, 50); c.clip(clip);
  fill(c, R(wx, wy, ww, wh), '#d7e0d8', { k: 701, gap: 9 });
  const sc = t * 160;
  // far hills
  const hills = []; for (let x = -100; x <= 900; x += 50) hills.push([wx + x, wy + wh * 0.55 - Math.sin((x + sc * 0.3) * 0.01) * 40 - Math.sin((x + sc * 0.3) * 0.023) * 20]);
  fill(c, hills.concat([[wx + 900, wy + wh], [wx - 100, wy + wh]]), '#9fb08a', { k: 702, gap: 8 });
  // cypress trees moving fast
  for (let i = 0; i < 8; i++) {
    const tx = wx + ((i * 170 - sc) % 1360 + 1360) % 1360 - 200;
    blob(c, spline([[tx, wy + wh * 0.72], [tx - 22, wy + wh * 0.55], [tx, wy + wh * 0.3], [tx + 22, wy + wh * 0.55]], true, 5), COL.greenD, { k: 703 + i });
  }
  fill(c, R(wx, wy + wh * 0.72, ww, wh * 0.28), '#c2a868', { k: 712, gap: 7 });
  // telegraph poles
  for (let i = 0; i < 3; i++) { const tx = wx + ((i * 480 - sc * 2.2) % 1440 + 1440) % 1440 - 300; stroke(c, [[tx, wy + 40], [tx, wy + wh]], { w: 8, col: COL.woodD }); }
  c.restore();
  const fr = [];
  blob(c, R(wx - 30, wy - 30, ww + 60, 30), COL.woodD, { k: 713 });
  blob(c, R(wx - 30, wy + wh, ww + 60, 40), COL.woodD, { k: 714 });
  stroke(c, R(wx, wy, ww, wh), { closed: true, w: 6 });
  // seat back
  blob(c, R(-80, 1330, 1240, 300), '#4f6b5a', { k: 715, gap: 7 });
  for (let x = 0; x < 1100; x += 120) stroke(c, [[x, 1340], [x, 1620]], { w: 3, a: 0.4 });
}

function florence(c, t) {
  fill(c, R(-100, 300, 1280, 1100), '#f1d9b0', { k: 800, gap: 10 });
  // Duomo
  const dx = 560, dy = 1060;
  blob(c, R(dx - 230, dy, 460, 220), '#efe3cc', { k: 801 });
  blob(c, R(dx - 160, dy - 70, 320, 80), '#efe3cc', { k: 802 });
  blob(c, spline([[dx - 170, dy - 70], [dx - 150, dy - 230], [dx - 60, dy - 330], [dx, dy - 345], [dx + 60, dy - 330], [dx + 150, dy - 230], [dx + 170, dy - 70]], false, 6).concat([[dx + 170, dy - 70]]), COL.terra, { k: 803, gap: 6 });
  for (const f of [-0.6, -0.25, 0.25, 0.6]) stroke(c, spline([[dx + f * 170, dy - 70], [dx + f * 140, dy - 220], [dx + f * 40, dy - 335]], false, 6), { w: 4, col: COL.white, a: 0.9 });
  blob(c, R(dx - 22, dy - 400, 44, 60), '#efe3cc', { k: 804 });
  blob(c, [[dx - 26, dy - 400], [dx, dy - 440], [dx + 26, dy - 400]], COL.zincD, { k: 805 });
  for (let i = 0; i < 6; i++) stroke(c, R(dx - 200 + i * 70, dy + 40, 30, 60), { closed: true, w: 2.5, a: 0.6 });
  // campanile
  blob(c, R(dx + 270, dy - 300, 90, 520), '#efe3cc', { k: 806 });
  for (let i = 0; i < 5; i++) stroke(c, [[dx + 270, dy - 280 + i * 100], [dx + 360, dy - 280 + i * 100]], { w: 3, col: '#5d8a6a' });
  blob(c, R(dx + 290, dy - 260, 50, 70), '#6d7a94', { k: 807, w: 3 });
  // houses
  let x = -100, i = 0;
  while (x < 1180) {
    const bw = 170 + h1(i * 7.1) * 80, bh = 260 + h1(i * 3.9) * 120;
    const cols = ['#e3b067', '#d98f5c', '#e7c88a', '#c97d55'];
    blob(c, R(x, 1420 - bh, bw, bh), cols[i % 4], { k: 810 + i, gap: 8 });
    blob(c, [[x - 10, 1420 - bh], [x + bw + 10, 1420 - bh], [x + bw, 1420 - bh - 30], [x, 1420 - bh - 30]], COL.terra, { k: 820 + i });
    for (let wy = 1420 - bh + 40; wy < 1380; wy += 90) for (let wx = x + 30; wx < x + bw - 40; wx += 64) { blob(c, R(wx, wy, 26, 46), '#4f6b5a', { k: 830 + wx + wy, w: 2.5 }); }
    x += bw; i++;
  }
  fill(c, R(-100, 1420, 1280, 600), '#c7b294', { k: 840, gap: 8 });
  for (let j = 0; j < 8; j++) stroke(c, [[-100, 1460 + j * 60], [1180, 1460 + j * 60]], { w: 2, a: 0.3 });
}

function shop(c, t) {
  fill(c, R(-100, 300, 1280, 1300), '#d8b98a', { k: 900, gap: 9 });
  // arched shop window behind (street view)
  const ax = 160, ay = 560, aw = 380, ah = 520;
  const arch = spline([[ax, ay + ah], [ax, ay + 140], [ax + aw / 2, ay], [ax + aw, ay + 140], [ax + aw, ay + ah]], false, 8);
  fill(c, arch.concat([[ax + aw, ay + ah]]), '#e9dcc0', { k: 901 });
  stroke(c, arch.concat([[ax + aw, ay + ah], [ax, ay + ah]]), { closed: true, w: 6 });
  stroke(c, [[ax + aw / 2, ay], [ax + aw / 2, ay + ah]], { w: 4 });
  // shelves with antiques
  for (let s = 0; s < 3; s++) {
    const sy = 700 + s * 220;
    blob(c, R(640, sy, 400, 18), COL.woodD, { k: 902 + s });
    blob(c, spline([[690, sy], [672, sy - 60], [700, sy - 110], [728, sy - 60], [710, sy]], true, 5), ['#5f8aa0', '#b5543c', COL.gold][s], { k: 905 + s });
    goldFrame(c, 780, sy - 120, 90, 110, { band: 14, simple: true });
    blob(c, E(960, sy - 50, 40, 40), ['#e7d9b8', '#8a9a6a', '#c9a24a'][s], { k: 908 + s });
    if (s === 0) { stroke(c, [[960, sy - 50], [960, sy - 75]], { w: 3 }); stroke(c, [[960, sy - 50], [978, sy - 45]], { w: 3 }); }
  }
  // counter
  blob(c, R(-60, 1330, 1200, 40), COL.woodL, { k: 911 });
  blob(c, R(-40, 1370, 1160, 560), COL.wood, { k: 912, gap: 6 });
  for (let i = 0; i < 4; i++) stroke(c, R(10 + i * 280, 1420, 220, 300), { closed: true, w: 3, a: 0.5 });
}

function postcard(c, x, y, w, h, rot = 0, k = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  blob(c, R(-w / 2, -h / 2, w, h), '#f6efdd', { k: 920 + k, w: 3.5 });
  W_(c, () => monaLisa(c, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24));
  c.restore();
}
function flash(c, x, y, r, a) {
  if (a <= 0) return;
  W_(c, () => {
    for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; stroke(c, [[x + Math.cos(an) * r * 0.4, y + Math.sin(an) * r * 0.4], [x + Math.cos(an) * r, y + Math.sin(an) * r]], { w: 5, col: COL.gold }); }
    fill(c, E(x, y, r * 0.35, r * 0.35), '#fff2b0', { hatch: false, base: 1 });
  }, { alpha: a });
}
function boxCamera(c, x, y, s = 1) {
  W_(c, () => {
    for (const a of [-0.25, 0, 0.25]) stroke(c, [[0, 0], [Math.sin(a) * 260, 260]], { w: 6, col: COL.woodD });
    blob(c, R(-60, -110, 120, 110), COL.woodD, { k: 930 });
    blob(c, R(60, -90, 50, 70), COL.black, { k: 931 });
    blob(c, E(120, -55, 22, 30), COL.char, { k: 932 });
    blob(c, R(-70, -20, 140, 18), COL.black, { k: 933 });
  }, { x, y, s });
}
function sparkle(c, x, y, r, a = 1) {
  W_(c, () => {
    stroke(c, [[x - r, y], [x + r, y]], { w: 4, col: COL.gold });
    stroke(c, [[x, y - r], [x, y + r]], { w: 4, col: COL.gold });
    stroke(c, [[x - r * 0.5, y - r * 0.5], [x + r * 0.5, y + r * 0.5]], { w: 2.5, col: COL.goldD });
    stroke(c, [[x + r * 0.5, y - r * 0.5], [x - r * 0.5, y + r * 0.5]], { w: 2.5, col: COL.goldD });
  }, { alpha: a });
}
function scribbleX(c, x, y, r, rev) {
  stroke(c, [[x - r, y - r * 0.8], [x + r, y + r * 0.8]], { w: 7, col: COL.ink, rev: clamp(rev * 2) });
  stroke(c, [[x + r, y - r * 0.8], [x - r, y + r * 0.8]], { w: 7, col: COL.ink, rev: clamp(rev * 2 - 1) });
}
