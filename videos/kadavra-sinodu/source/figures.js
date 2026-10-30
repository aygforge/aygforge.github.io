// ---------- characters & props ----------

function blinkClosed(t, ph) { const k = ((t * 0.37 + ph * 0.61) % 1 + 1) % 1; return k < 0.035; }

function head(o) {
  const r = o.r || 34; const t = o.t || 0;
  const side = o.side ?? 1; const look = o.look || 0;
  const fx = side * 9 + look * 5;
  const skin = o.skin || C.skin;
  const hat = o.hat;
  // things behind head
  if (hat === 'hood') S(cr([[-r - 14, r * 1.2], [-r - 16, -r * 0.2], [-r * 0.7, -r - 16], [0, -r - 20], [r * 0.7, -r - 16], [r + 14, -r * 0.2], [r + 12, r * 1.2]]), { fill: o.hoodCol || C.robeBrown, lw: 3, amp: 1 });
  if (hat === 'tiara' || hat === 'mitre') {
    // lappets
    S(rectP(-r * 0.7 - 8, -r * 0.4, 12, r * 1.7), { fill: o.hatTrim || C.gold, lw: 2, amp: 0.8, hatch: false });
    S(rectP(r * 0.7 - 4, -r * 0.4, 12, r * 1.7), { fill: o.hatTrim || C.gold, lw: 2, amp: 0.8, hatch: false });
  }
  // ears
  if (side) S(ell(-r * 0.55 + look * 3, 3, 7, 10, 14), { fill: skin, lw: 2.2, hatch: false, amp: 0.5 });
  else { S(ell(-r * 0.97, 3, 6, 10, 14), { fill: skin, lw: 2.2, hatch: false, amp: 0.5 }); S(ell(r * 0.97, 3, 6, 10, 14), { fill: skin, lw: 2.2, hatch: false, amp: 0.5 }); }
  // face
  S(ell(0, 0, r, r * 1.06, 30), { fill: skin, lw: 3, amp: 0.7, hgap: 8, halpha: 0.16 });
  if (!o.corpse && o.blush !== false) alphaDo(0.22, () => {
    CTX.fillStyle = '#d8746a';
    CTX.beginPath(); CTX.arc(fx + 15, 11, 6, 0, 7); CTX.fill();
    if (side === 0) { CTX.beginPath(); CTX.arc(-15, 11, 6, 0, 7); CTX.fill(); }
  });
  // hair
  if (hat === 'tonsure' || hat === 'hair') {
    const hc = o.hair || C.brownD;
    S(cr([[-r - 2, 4], [-r * 1.02, -r * 0.6], [-r * 0.62, -r - 4], [0, -r - 6], [r * 0.62, -r - 4], [r * 1.02, -r * 0.6], [r + 2, 4], [r * 0.82, -r * 0.3], [r * 0.4, -r * 0.6], [0, -r * 0.66], [-r * 0.4, -r * 0.6], [-r * 0.82, -r * 0.3]]), { fill: hc, lw: 2.6, amp: 0.8, hgap: 5, halpha: 0.4 });
    if (hat === 'tonsure') S(ell(fx * 0.3, -r * 0.82, r * 0.42, r * 0.17, 20), { fill: skin, lw: 2, amp: 0.4, hatch: false });
  }
  // beard
  if (o.beard) S(cr([[-r * 0.9, 2], [-r * 0.75, r * 0.75], [-r * 0.4, r * 1.35], [fx * 0.4, r * 1.62], [r * 0.4 + fx * 0.3, r * 1.35], [r * 0.75, r * 0.75], [r * 0.9, 2], [r * 0.55, r * 0.42], [fx * 0.4, r * 0.55], [-r * 0.5, r * 0.42]]), { fill: o.beard, lw: 2.4, amp: 0.7, hgap: 5, halpha: 0.35 });
  // eyes
  const ey = -3, ex = 12;
  let eyes = o.eyes || 'dot';
  if (eyes !== 'closed' && blinkClosed(t, o.ph || 0)) eyes = 'blink';
  const c = CTX;
  const eyePos = side ? [fx - 6, fx + 16] : [-ex + look * 4, ex + look * 4];
  for (const exx of eyePos) {
    if (eyes === 'closed' || eyes === 'blink') {
      L(ell(exx, ey + 1, 5.5, 3, 8, 0.15, Math.PI - 0.15), { lw: 2.3, amp: 0.3, stroke: o.corpse ? C.inkSoft : C.ink });
    } else if (eyes === 'wide') {
      S(ell(exx, ey, 7, 8, 14), { fill: '#fbf6ea', lw: 2, amp: 0.3, hatch: false });
      c.fillStyle = C.ink; c.beginPath(); c.arc(exx + look * 2.5 + side * 1.5, ey + 1, 3.4, 0, 7); c.fill();
    } else {
      c.fillStyle = C.ink; c.beginPath(); c.arc(exx + look * 1.5, ey, 3.6, 0, 7); c.fill();
    }
  }
  // brows
  const expr = o.expr || 'neutral';
  for (let i = 0; i < 2; i++) {
    const bx = eyePos[i]; const inner = (i === 0) ? 1 : -1; // inner direction toward face center
    let y0 = -13, y1 = -13;
    if (expr === 'shock') { y0 = -22; y1 = -23; }
    if (expr === 'stern') { y0 = -16; y1 = -10; }
    if (expr === 'worry') { y0 = -12; y1 = -19; }
    if (expr === 'calm') { y0 = -14; y1 = -14; }
    // y1 = inner end
    const a = [bx - 6 * inner, y0], b = [bx + 6 * inner, y1];
    if (eyes !== 'closed' || !o.corpse) L([a, [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 2.5], b], { lw: 2.6, amp: 0.3, stroke: o.beard === '#efe9dc' ? C.inkL : C.ink });
  }
  // nose
  if (!o.corpse) L([[fx + 4, 2], [fx + 8 * (side || 0.2), 9], [fx + 2, 11]], { lw: 2, amp: 0.3, salpha: 0.6 });
  // mouth
  const m = o.mouth || 'line'; const my = 19, mx = fx + 3;
  if (m === 'o') S(ell(mx, my + 1, 4.5, 6.5, 12), { fill: '#5b2a32', lw: 2, amp: 0.3, hatch: false });
  else if (m === 'talk') { const k = Math.abs(Math.sin(t * 13 + (o.ph || 0))) * (0.5 + 0.5 * Math.abs(Math.sin(t * 5.3))); S(ell(mx, my, 6, 1.5 + 5 * k, 12), { fill: '#5b2a32', lw: 2, amp: 0.3, hatch: false }); }
  else if (m === 'frown') L([[mx - 7, my + 3], [mx, my - 1], [mx + 7, my + 3]], { lw: 2.4, amp: 0.3 });
  else if (m === 'smile') L([[mx - 7, my - 2], [mx, my + 3], [mx + 7, my - 2]], { lw: 2.4, amp: 0.3 });
  else if (m === 'wavy') L([[mx - 8, my], [mx - 4, my - 2], [mx, my + 1], [mx + 4, my - 2], [mx + 8, my]], { lw: 2.2, amp: 0.3 });
  else if (m === 'line') L([[mx - 5, my], [mx + 5, my]], { lw: 2.2, amp: 0.3, salpha: o.corpse ? 0.4 : 0.85 });
  // veil over corpse face
  if (o.veil) {
    S(cr([[-r * 1.08, -r * 0.8], [0, -r * 0.92], [r * 1.08, -r * 0.8], [r * 1.18, r * 0.3], [r * 1.3, r * 1.35], [0, r * 1.62], [-r * 1.3, r * 1.35], [-r * 1.18, r * 0.3]]),
      { fill: '#f4efe3', alpha: o.veil * 0.42, lw: 2, salpha: 0.5, amp: 0.8, hgap: 6, halpha: 0.2, hang: 80 });
  }
  // sweat drop
  if (o.sweat) {
    const sy = -14 + ((t * 0.9) % 1) * 22;
    alphaDo(o.sweat, () => S(cr([[fx + r * 0.95, sy - 9], [fx + r * 0.95 + 5, sy + 2], [fx + r * 0.95, sy + 6], [fx + r * 0.95 - 5, sy + 2]]), { fill: '#b9d3e3', lw: 1.6, amp: 0.2, hatch: false }));
  }
  // hats on top
  if (hat === 'mitre') {
    const mt = o.hatCol || C.white;
    S([[-r * 0.86, -r * 0.5], [-r * 0.92, -r * 1.35], [0, -r * 2.35], [r * 0.92, -r * 1.35], [r * 0.86, -r * 0.5]], { fill: mt, lw: 2.8, amp: 0.8, hgap: 7, halpha: 0.2 });
    S(rectP(-r * 0.88, -r * 0.78, r * 1.76, r * 0.3), { fill: o.hatTrim || C.gold, lw: 2, amp: 0.6, hatch: false });
    S(rectP(-r * 0.13, -r * 2.15, r * 0.26, r * 1.4), { fill: o.hatTrim || C.gold, lw: 2, amp: 0.6, hatch: false });
  }
  if (hat === 'tiara') {
    const mt = o.hatCol || C.white;
    S(cr([[-r * 0.86, -r * 0.5], [-r * 0.95, -r * 1.25], [-r * 0.65, -r * 1.95], [0, -r * 2.3], [r * 0.65, -r * 1.95], [r * 0.95, -r * 1.25], [r * 0.86, -r * 0.5], [0, -r * 0.45]]), { fill: mt, lw: 2.8, amp: 0.8, hgap: 7, halpha: 0.2, hang: 70 });
    S(cr([[-r * 0.9, -r * 0.82], [0, -r * 0.92], [r * 0.9, -r * 0.82], [r * 0.9, -r * 0.5], [0, -r * 0.42], [-r * 0.9, -r * 0.5]]), { fill: o.hatTrim || C.gold, lw: 2, amp: 0.6, hatch: false });
    L(cr([[-r * 0.78, -r * 1.5], [0, -r * 1.62], [r * 0.78, -r * 1.5]], false), { lw: 5, stroke: C.goldD, amp: 0.5, salpha: 0.8 });
    S(ell(0, -r * 2.38, r * 0.17, r * 0.17, 12), { fill: o.hatTrim || C.gold, lw: 2, amp: 0.3, hatch: false });
  }
}

const POSES = {
  down: [[[-40, -222], [-56, -160], [-46, -102]], [[40, -222], [56, -160], [48, -100]]],
  clasp: [[[-40, -222], [-34, -165], [6, -140]], [[40, -222], [52, -170], [14, -142]]],
  point: [[[-40, -222], [-56, -160], [-46, -102]], [[40, -222], [92, -214], [142, -224]]],
  shock: [[[-40, -222], [-80, -212], [-58, -292]], [[40, -222], [82, -216], [62, -298]]],
  mouth: [[[-40, -222], [-56, -160], [-46, -102]], [[40, -222], [66, -196], [36, -262]]],
  bless: [[[-40, -222], [-34, -165], [6, -140]], [[40, -222], [80, -238], [88, -302]]],
  hold: [[[-40, -222], [-6, -182], [58, -178]], [[40, -222], [72, -190], [98, -184]]],
  raise: [[[-40, -222], [-56, -160], [-46, -102]], [[40, -222], [64, -284], [70, -350]]],
  raise2: [[[-40, -222], [-62, -284], [-60, -352]], [[40, -222], [64, -284], [70, -350]]],
  write: [[[-40, -222], [-6, -182], [50, -160]], [[40, -222], [72, -176], [104, -156]]],
  open: [[[-40, -222], [-70, -170], [-86, -140]], [[40, -222], [74, -172], [92, -142]]],
};

function poseArms(o) {
  let P = POSES[o.pose] || POSES.down;
  if (o.pose2 && o.poseK != null) {
    const Q = POSES[o.pose2]; const k = ease(o.poseK);
    P = P.map((arm, i) => arm.map((p, j) => [lerp(p[0], Q[i][j][0], k), lerp(p[1], Q[i][j][1], k)]));
  }
  if (o.pose === 'talk' || o.talkHand) {
    const t = o.t || 0; const w = Math.sin(t * 6 + (o.ph || 0));
    P = [P[0], [[40, -222], [80, -196 + w * 4], [114 + w * 6, -214 + w * 10]]];
  }
  if (o.handShake) {
    const t = o.t || 0; P = P.map(arm => arm.map((p, j) => j === 2 ? [p[0] + Math.sin(t * 40) * 1.6 * o.handShake, p[1] + Math.cos(t * 37) * 1.4 * o.handShake] : p));
  }
  return P;
}

function arm(A, col, skin, o, front) {
  S(tube(A, 26, 32), { fill: col, lw: 2.8, amp: 1, hgap: 6, halpha: 0.3 });
  const h = A[2];
  S(ell(h[0] + 4, h[1] + 2, 10, 10.5, 14), { fill: skin, lw: 2.4, amp: 0.5, hatch: false });
  if (front && (o.pose === 'point' || o.finger)) L([[h[0] + 10, h[1] + 1], [h[0] + 26, h[1] - 1]], { lw: 5.5, stroke: C.ink, amp: 0.3 }) && L([[h[0] + 10, h[1] + 1], [h[0] + 25, h[1] - 1]], { lw: 3, stroke: skin, amp: 0.3 });
  if (front && o.pose === 'bless') { L([[h[0] + 2, h[1] - 6], [h[0] + 1, h[1] - 20]], { lw: 4, stroke: C.ink, amp: 0.2 }); L([[h[0] + 8, h[1] - 6], [h[0] + 8, h[1] - 19]], { lw: 4, stroke: C.ink, amp: 0.2 }); }
}

// standing figure, feet at origin, ~330 units tall, facing right (+x) unless dir=-1
function figure(o) {
  const c = CTX; const t = o.t ?? TIME; o.t = t;
  c.save(); c.translate(o.x, o.y);
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  const sway = o.sway ?? 1;
  c.rotate(Math.sin(t * 1.25 + (o.ph || 0)) * 0.012 * sway + (o.rot || 0));
  c.scale(o.s * (o.dir < 0 ? -1 : 1), o.s);
  const oldSeed = SEED; SEED = o.seed ?? (o.x * 0.131 + o.y * 0.071);
  const robe = o.robe || C.robeBrown; const skin = o.skin || C.skin;
  const gcol = o.gcol || C.burg;
  const sleeve = o.sleeve || (o.garment === 'dalmatic' ? gcol : (o.garment === 'cape' ? robe : robe));
  const A = poseArms(o);
  if (!o.noShadow) shadowEll(0, 2, 88, 14, 0.18);
  arm(A[0], shade(sleeve, -0.12), skin, o, false);
  // feet
  S(ell(-26, -4, 22, 10, 14), { fill: C.brownD, lw: 2.4, amp: 0.5, hatch: false });
  S(ell(30, -4, 24, 10, 14), { fill: C.brownD, lw: 2.4, amp: 0.5, hatch: false });
  // robe
  S(cr([[-24, -252], [24, -252], [58, -232], [66, -150], [74, -60], [84, -10], [42, 0], [0, 2], [-42, 0], [-84, -10], [-74, -60], [-66, -150], [-58, -232]]), { fill: robe, lw: 3.2, hgap: 6.5, halpha: 0.32, hatch2: o.dark });
  // robe fold lines
  L(cr([[18, -150], [24, -80], [30, -8]], false), { lw: 2, salpha: 0.45 });
  L(cr([[-20, -140], [-28, -70], [-36, -6]], false), { lw: 2, salpha: 0.45 });
  if (o.trim) S(rectP(-9, -246, 18, 244), { fill: o.trim, lw: 2, amp: 0.8, hatch: false });
  if (o.garment === 'cape') S(cr([[-30, -252], [30, -252], [64, -230], [76, -180], [66, -146], [0, -136], [-66, -146], [-76, -180], [-64, -230]]), { fill: gcol, lw: 3, hgap: 6 });
  if (o.garment === 'chasuble') {
    S(cr([[-28, -252], [28, -252], [66, -228], [76, -150], [74, -64], [32, -40], [0, -36], [-32, -40], [-74, -64], [-76, -150], [-66, -228]]), { fill: gcol, lw: 3, hgap: 6 });
    L(cr([[-74, -64], [-32, -42], [0, -38], [32, -42], [74, -64]], false), { lw: 5, stroke: C.gold, amp: 0.8, salpha: 0.9 });
    if (o.pallium) {
      S(cr([[-50, -238], [0, -205], [50, -238], [52, -224], [6, -190], [6, -60], [-6, -60], [-6, -190], [-52, -224]]), { fill: C.white, lw: 2.2, amp: 0.6, hatch: false });
      for (const yy of [-170, -120, -80]) { L([[-5, yy], [5, yy]], { lw: 2.5, amp: 0.2 }); L([[0, yy - 5], [0, yy + 5]], { lw: 2.5, amp: 0.2 }); }
    } else S(rectP(-8, -248, 16, 208), { fill: C.gold, lw: 2, amp: 0.6, hatch: false });
  }
  if (o.garment === 'dalmatic') {
    S(cr([[-30, -252], [30, -252], [70, -226], [78, -120], [80, -64], [0, -58], [-80, -64], [-78, -120], [-70, -226]]), { fill: gcol, lw: 3, hgap: 6 });
    S(rectP(-30, -246, 12, 186), { fill: C.burgL, lw: 1.8, amp: 0.5, hatch: false });
    S(rectP(18, -246, 12, 186), { fill: C.burgL, lw: 1.8, amp: 0.5, hatch: false });
  }
  // neck
  S(rectP(-12, -262, 24, 16), { fill: skin, lw: 2, amp: 0.4, hatch: false });
  arm(A[1], sleeve, skin, o, true);
  if (o.held) o.held(A[1][2], A[0][2]);
  // head
  c.save();
  const hb = Math.sin(t * 1.7 + (o.ph || 0) * 2) * 1.2 * sway;
  c.translate((o.look || 0) * 2, -287 + hb + (o.headDy || 0));
  c.rotate(o.tilt || 0);
  head(Object.assign({}, o, { r: 34, side: o.front ? 0 : 1 }));
  c.restore();
  SEED = oldSeed;
  c.restore();
}

// seated frontal figure (popes on thrones). origin at seat center, y=0 is seat surface.
function seated(o) {
  const c = CTX; const t = o.t ?? TIME; o.t = t;
  c.save(); c.translate(o.x, o.y);
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  if (o.rot) c.rotate(o.rot);
  c.scale(o.s, o.s);
  const oldSeed = SEED; SEED = o.seed ?? 77.7;
  const skin = o.corpse ? C.pale : (o.skin || C.skin);
  const alb = o.shroud ? '#e9e1cd' : C.white;
  const breathe = o.corpse ? 0 : Math.sin(t * 1.6) * 1.2;
  if (o.silhouette) {
    const sil = o.silCol || '#2e2740';
    S(cr([[-26, -172], [26, -172], [66, -150], [84, -60], [90, 30], [86, 145], [0, 155], [-86, 145], [-90, 30], [-84, -60], [-66, -150]]), { fill: sil, lw: 3, hcol: '#4a3f63', halpha: 0.5 });
    c.save(); c.translate(0, -205); c.rotate(-0.2);
    S(ell(0, 0, 34, 36, 24), { fill: sil, lw: 3, hcol: '#4a3f63', halpha: 0.5 });
    S(cr([[-29, -17], [-32, -42], [-22, -66], [0, -78], [22, -66], [32, -42], [29, -17], [0, -15]]), { fill: sil, lw: 3, hcol: '#4a3f63', halpha: 0.5 });
    c.restore();
    SEED = oldSeed; c.restore(); return;
  }
  // feet
  S(ell(-32, 146, 24, 11, 14), { fill: C.burgD, lw: 2.4, amp: 0.5, hatch: false });
  S(ell(32, 146, 24, 11, 14), { fill: C.burgD, lw: 2.4, amp: 0.5, hatch: false });
  // lower robe & torso
  S(cr([[-66, -12], [66, -12], [76, 50], [84, 138], [40, 150], [0, 152], [-40, 150], [-84, 138], [-76, 50]]), { fill: alb, lw: 3, hgap: 6, halpha: 0.28 });
  L(cr([[-20, 20], [-26, 80], [-30, 146]], false), { lw: 2, salpha: 0.45 }); L(cr([[22, 20], [28, 80], [32, 146]], false), { lw: 2, salpha: 0.45 });
  S(cr([[-24, -172 + breathe], [24, -172 + breathe], [60, -155], [72, -90], [72, -8], [-72, -8], [-72, -90], [-60, -155]]), { fill: alb, lw: 3, hgap: 6, halpha: 0.28 });
  // chasuble
  const dk = o.dressed ?? 1;
  if (dk > 0) alphaDo(clamp(dk * 1.6), () => {
    c.save(); c.translate(0, -(1 - ease(dk)) * 420);
    S(cr([[-28, -176], [28, -176], [68, -150], [82, -60], [86, 22], [62, 72], [0, 88], [-62, 72], [-86, 22], [-82, -60], [-68, -150]]), { fill: o.gcol || C.burg, lw: 3.2, hgap: 6, hatch2: true, halpha2: 0.12 });
    L(cr([[-86, 22], [-62, 72], [0, 88], [62, 72], [86, 22]], false), { lw: 6, stroke: C.gold, amp: 0.8 });
    L(cr([[-28, -176], [-10, -120], [0, -40], [0, 84]], false), { lw: 5, stroke: C.goldD, amp: 0.6, salpha: 0.5 });
    c.restore();
  });
  const pk = o.pallium ?? 1;
  if (pk > 0) alphaDo(pk, () => {
    S(cr([[-50, -164], [0, -130], [50, -164], [52, -150], [7, -112], [7, 60], [-7, 60], [-7, -112], [-52, -150]]), { fill: C.white, lw: 2.2, amp: 0.6, hatch: false });
    for (const yy of [-95, -40, 15]) { L([[-5, yy], [5, yy]], { lw: 2.6, amp: 0.2 }); L([[0, yy - 6], [0, yy + 6]], { lw: 2.6, amp: 0.2 }); }
  });
  // arms resting
  const sl = dk > 0.5 ? (o.gcol || C.burg) : alb;
  const lh = o.limp ? 8 : 0;
  const armsP = o.arms || [[[-58, -150], [-86, -80], [-98, -26 + lh]], [[58, -150], [86, -80], [98, -26 + lh]]];
  for (const A of armsP) {
    S(tube(A, 28, 30), { fill: sl, lw: 2.8, amp: 0.9, hgap: 6, halpha: 0.3 });
    S(ell(A[2][0], A[2][1] + 6, 12, 13, 14), { fill: o.corpse ? '#ece6d8' : skin, lw: 2.4, amp: 0.5, hatch: false });
  }
  // neck & head
  S(rectP(-12, -186, 24, 18), { fill: skin, lw: 2, amp: 0.4, hatch: false });
  c.save(); c.translate(o.corpse ? 4 : 0, -205); c.rotate(o.tilt ?? (o.corpse ? 0.3 : 0));
  const tk = o.tiaraK ?? 1;
  const ho = Object.assign({}, o, { r: 34, side: 0, skin, beard: o.beard, hat: tk >= 0.999 ? (o.hat ?? 'tiara') : (o.baseHat || null) });
  head(ho);
  if (tk < 0.999 && tk > 0) {
    c.save(); c.translate(0, -(1 - ease(tk)) * 260); c.globalAlpha *= clamp(tk * 3);
    head(Object.assign({}, ho, { faceless: true }));
    c.restore();
  }
  c.restore();
  SEED = oldSeed; c.restore();
}
// draws only the hat portion (used to lower a tiara onto a head)
const _head = head;
head = function (o) {
  if (o.faceless) {
    const r = o.r || 34; const save = CTX.globalAlpha;
    if (o.hat === 'tiara' || (o.hat == null)) {
      S(cr([[-r * 0.86, -r * 0.5], [-r * 0.95, -r * 1.25], [-r * 0.65, -r * 1.95], [0, -r * 2.3], [r * 0.65, -r * 1.95], [r * 0.95, -r * 1.25], [r * 0.86, -r * 0.5], [0, -r * 0.45]]), { fill: C.white, lw: 2.8, amp: 0.8, hgap: 7, halpha: 0.2, hang: 70 });
      S(cr([[-r * 0.9, -r * 0.82], [0, -r * 0.92], [r * 0.9, -r * 0.82], [r * 0.9, -r * 0.5], [0, -r * 0.42], [-r * 0.9, -r * 0.5]]), { fill: C.gold, lw: 2, amp: 0.6, hatch: false });
      L(cr([[-r * 0.78, -r * 1.5], [0, -r * 1.62], [r * 0.78, -r * 1.5]], false), { lw: 5, stroke: C.goldD, amp: 0.5, salpha: 0.8 });
      S(ell(0, -r * 2.38, r * 0.17, r * 0.17, 12), { fill: C.gold, lw: 2, amp: 0.3, hatch: false });
    }
    CTX.globalAlpha = save; return;
  }
  _head(o);
};

// ---------- furniture & props ----------
function throne(x, y, s, o = {}) {
  withT(x, y, s, () => {
    const old = SEED; SEED = o.seed ?? 12.3;
    const k = o.k ?? 1;
    const g = o.plain ? C.brownL : C.gold, gd = o.plain ? C.brown : C.goldD;
    alphaDo(k, () => {
      if (!o.plain) {
        S(cr([[-118, 0], [-120, -200], [-112, -300], [-82, -362], [0, -390], [82, -362], [112, -300], [120, -200], [118, 0]]), { fill: g, lw: 3.4, hgap: 6, halpha: 0.3, light: true });
        S(cr([[-92, -6], [-94, -200], [-86, -290], [-62, -336], [0, -356], [62, -336], [86, -290], [94, -200], [92, -6]]), { fill: o.panel || C.burg, lw: 2.8, hgap: 6, hatch2: true });
        // ornament diamonds on panel
        for (const [px, py] of [[0, -290], [0, -200], [0, -110]]) S([[px, py - 18], [px + 14, py], [px, py + 18], [px - 14, py]], { fill: C.goldL, lw: 2, amp: 0.5, hatch: false, alpha: 0.85 });
        S(ell(0, -402, 14, 14, 14), { fill: C.goldL, lw: 2.4, amp: 0.4, hatch: false });
        S(ell(-116, -306, 11, 11, 12), { fill: C.goldL, lw: 2.2, amp: 0.4, hatch: false });
        S(ell(116, -306, 11, 11, 12), { fill: C.goldL, lw: 2.2, amp: 0.4, hatch: false });
      } else {
        S(rectP(-100, -300, 200, 300), { fill: g, lw: 3.2, hgap: 7 });
        for (let i = -2; i <= 2; i++) L([[i * 36, -285], [i * 36, -10]], { lw: 2.2, salpha: 0.5 });
        S(rectP(-112, -320, 224, 30), { fill: gd, lw: 3, hgap: 7 });
      }
      // seat & front
      S(rectP(-128, -8, 256, 30), { fill: gd, lw: 3, hgap: 6 });
      S(rectP(-118, 22, 236, 128), { fill: o.plain ? C.brown : C.brownL, lw: 3, hgap: 6, hatch2: true });
      if (!o.plain) {
        S(archP(-92, 40, 70, 96), { fill: C.brownD, lw: 2.2, amp: 0.8, alpha: 0.7 });
        S(archP(22, 40, 70, 96), { fill: C.brownD, lw: 2.2, amp: 0.8, alpha: 0.7 });
        L([[-118, 26], [118, 26]], { lw: 5, stroke: C.gold, amp: 0.6 });
      }
      // armrests
      for (const sx of [-1, 1]) {
        S(rectP(sx > 0 ? 104 : -140, -78, 36, 90), { fill: g, lw: 3, hgap: 6 });
        S(ell(sx * 122, -82, 22, 12, 14), { fill: o.plain ? C.brown : C.goldL, lw: 2.6, amp: 0.6, hatch: false });
      }
    });
    SEED = old;
  });
}

function dais(x, y, w, s = 1) {
  const old = SEED; SEED = 4.4;
  S(rectP(x - w / 2 - 50 * s, y + 34 * s, w + 100 * s, 44 * s), { fill: C.stoneD, lw: 3, hgap: 8 });
  S(rectP(x - w / 2, y, w, 36 * s), { fill: C.stone, lw: 3, hgap: 8, light: true });
  SEED = old;
}

function candle(x, y, s, o = {}) {
  const t = TIME + (o.ph || 0);
  withT(x, y, s, () => {
    const old = SEED; SEED = x * 0.3;
    // tripod base
    S([[-36, 0], [0, -40], [36, 0], [24, 2], [0, -22], [-24, 2]], { fill: C.goldD, lw: 2.6, amp: 0.6, hatch: false });
    S(rectP(-6, -250, 12, 214), { fill: C.goldD, lw: 2.6, amp: 0.6, hgap: 5 });
    S(ell(0, -120, 12, 8, 12), { fill: C.gold, lw: 2.2, amp: 0.3, hatch: false });
    S(cr([[-34, -258], [34, -258], [24, -246], [-24, -246]]), { fill: C.gold, lw: 2.6, amp: 0.5, hatch: false });
    S(rectP(-12, -330, 24, 74), { fill: '#f1ead6', lw: 2.6, amp: 0.6, hgap: 6, halpha: 0.2 });
    L(cr([[8, -330], [10, -310], [7, -296]], false), { lw: 3, stroke: '#e7dcc0', salpha: 0.9, amp: 0.3 });
    if (o.lit !== false) {
      const f = 0.85 + 0.25 * (n1(t * 6.3, x) - 0.5) * 2;
      const sw = (n1(t * 3.1, x + 9) - 0.5) * 8;
      S(cr([[0, -332], [8, -342], [sw * 0.7 + 3, -360 - 16 * f], [-8, -342]]), { fill: C.flame, lw: 1.8, stroke: '#a8642a', amp: 0.4, hatch: false });
      S(cr([[0, -334], [4, -341], [sw * 0.5 + 1, -352 - 8 * f], [-4, -341]]), { fill: C.flameL, lw: 0, stroke: false, amp: 0.3, hatch: false });
      glow(sw * 0.5, -350, 130 * f, '255,190,90', 0.32 * (o.glow ?? 1));
    }
    SEED = old;
  });
}

function parchment(x, y, w, h, o = {}) {
  withT(x, y, 1, () => {
    const old = SEED; SEED = o.seed ?? (x * 0.17 + 3);
    const gray = o.gray || 0;
    const base = mix(C.parch, '#cfc9bd', gray);
    S(cr([[-w / 2, -h / 2 + 8], [0, -h / 2 - 4], [w / 2, -h / 2 + 8], [w / 2 + 4, 0], [w / 2, h / 2 - 8], [0, h / 2 + 4], [-w / 2, h / 2 - 8], [-w / 2 - 4, 0]], true, 6), { fill: base, lw: 3, hgap: 7, halpha: 0.22 });
    if (o.scroll) {
      S(rrP(-w / 2 - 14, -h / 2 - 16, w + 28, 26, 12), { fill: shade(base, -0.12), lw: 2.8, hgap: 5 });
      S(rrP(-w / 2 - 14, h / 2 - 10, w + 28, 26, 12), { fill: shade(base, -0.12), lw: 2.8, hgap: 5 });
    }
    let top = -h / 2 + h * 0.1;
    if (o.emblem) { emblem(0, -h / 2 + h * 0.15, Math.min(w, h) * 0.0032 * (o.emblemS || 1), o.emblem); top = -h / 2 + h * 0.28; }
    const lines = o.lines ?? 6;
    if (lines) scribbleLines(-w / 2 + w * 0.14, top, w * 0.72, h * (o.seal != null ? 0.48 : 0.68) - (top + h / 2 - h * 0.1), lines, o.reveal ?? 1, mix(C.inkSoft, '#9a948a', gray), Math.max(1.6, w / 150));
    if (o.seal) seal(w * 0.22, h / 2 - h * 0.17, Math.min(w, h) * 0.12, o.seal);
    if (o.cross) {
      const k1 = clamp(o.cross * 2), k2 = clamp(o.cross * 2 - 1);
      const m = Math.min(w, h) * 0.42;
      if (k1 > 0) L([[-m, -m * 1.1], [lerp(-m, m, k1), lerp(-m * 1.1, m * 1.1, k1)]], { lw: Math.max(6, w / 28), stroke: C.burg, amp: 2, salpha: 0.92 });
      if (k2 > 0) L([[m, -m * 1.1], [lerp(m, -m, k2), lerp(-m * 1.1, m * 1.1, k2)]], { lw: Math.max(6, w / 28), stroke: C.burg, amp: 2, salpha: 0.92 });
    }
    SEED = old;
  }, o.rot || 0);
}

function seal(x, y, r, k = 1) {
  const kk = easeOut(k);
  withT(x, y, kk * (1 + 0.25 * bell(k, 0, 1)), () => {
    const P = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; const rr = r * (1 + 0.13 * Math.sin(i * 2.7) + 0.07 * Math.cos(i * 5.1)); P.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    S(cr(P, true, 3), { fill: C.wax, lw: 2.6, amp: 0.6, hgap: 5, halpha: 0.3 });
    S(ell(0, 0, r * 0.62, r * 0.62, 20), { fill: shade(C.wax, -0.15), lw: 2, amp: 0.4, hatch: false });
    L([[0, -r * 0.4], [0, r * 0.4]], { lw: Math.max(2, r * 0.12), stroke: '#e4a59a', amp: 0.2, salpha: 0.8 });
    L([[-r * 0.3, -r * 0.1], [r * 0.3, -r * 0.1]], { lw: Math.max(2, r * 0.12), stroke: '#e4a59a', amp: 0.2, salpha: 0.8 });
  });
}

// small iconographic emblems for documents
function emblem(x, y, s, type) {
  withT(x, y, s, () => {
    if (type === 'tiara') {
      S(cr([[-26, 30], [-30, 0], [-20, -26], [0, -36], [20, -26], [30, 0], [26, 30], [0, 32]]), { fill: C.white, lw: 3, amp: 0.6, hatch: false });
      S(rectP(-28, 16, 56, 14), { fill: C.gold, lw: 2.4, amp: 0.5, hatch: false });
      S(ell(0, -40, 6, 6, 10), { fill: C.gold, lw: 2, amp: 0.3, hatch: false });
    } else if (type === 'mitre') {
      S([[-26, 32], [-28, -4], [0, -40], [28, -4], [26, 32]], { fill: C.white, lw: 3, amp: 0.6, hatch: false });
      S(rectP(-5, -30, 10, 60), { fill: C.gold, lw: 2, amp: 0.4, hatch: false });
    } else if (type === 'ordain') { // bishop's hand over kneeling cleric
      S(ell(-6, 10, 16, 16, 14), { fill: C.skin, lw: 2.4, amp: 0.4, hatch: false });
      S(cr([[-30, 46], [-24, 22], [12, 22], [22, 46]]), { fill: C.robeBrown, lw: 2.4, amp: 0.5, hatch: false });
      S(ell(16, -18, 14, 9, 12), { fill: C.skin, lw: 2.4, amp: 0.4, hatch: false });
      S(tube([[48, -40], [34, -26], [22, -18]], 14, 12), { fill: C.burg, lw: 2.4, amp: 0.5, hatch: false });
    } else if (type === 'church') {
      S([[-28, 34], [-28, -6], [0, -34], [28, -6], [28, 34]], { fill: C.stoneL, lw: 3, amp: 0.6, hatch: false });
      S(archP(-8, 8, 16, 26), { fill: C.brownD, lw: 2, amp: 0.4, hatch: false });
      L([[0, -34], [0, -50]], { lw: 3, amp: 0.2 }); L([[-7, -44], [7, -44]], { lw: 3, amp: 0.2 });
    } else if (type === 'keys') {
      for (const d of [-1, 1]) withT(0, 0, 1, () => {
        L([[-26, 26], [22, -22]], { lw: 6, stroke: d < 0 ? C.goldD : '#8a8a92', amp: 0.4 });
        S(ell(-28, 28, 9, 9, 12), { fill: d < 0 ? C.gold : '#b8b8c0', lw: 2.4, amp: 0.3, hatch: false });
      }, d * 0.45);
    }
  });
}

function tomb(x, y, s, o = {}) {
  withT(x, y, s, () => {
    const old = SEED; SEED = 31.4;
    shadowEll(0, 8, 260, 22, 0.25);
    S(rectP(-232, -20, 464, 32), { fill: C.stoneD, lw: 3.2, hgap: 7, hatch2: true });
    S(rectP(-205, -190, 410, 172), { fill: C.stone, lw: 3.4, hgap: 7, light: true });
    // carved panels
    S(archP(-180, -160, 100, 122), { fill: C.stoneD, lw: 2.4, alpha: 0.55, amp: 1 });
    S(archP(80, -160, 100, 122), { fill: C.stoneD, lw: 2.4, alpha: 0.55, amp: 1 });
    // central cross relief + tiara
    S(rectP(-9, -168, 18, 130), { fill: C.goldD, lw: 2.4, amp: 0.6, hatch: false, alpha: 0.8 });
    S(rectP(-42, -134, 84, 18), { fill: C.goldD, lw: 2.4, amp: 0.6, hatch: false, alpha: 0.8 });
    // tally marks (months)
    const n = o.tally || 0;
    for (let i = 0; i < n; i++) {
      const gi = Math.floor(i / 5), ii = i % 5;
      const bx = 100 + gi * 52 + ii * 9;
      if (ii < 4) L([[bx, -142], [bx - 2, -92]], { lw: 3.4, stroke: C.ink, amp: 0.6, salpha: 0.75 });
      else L([[bx - 40, -100], [bx - 2, -136]], { lw: 3.4, stroke: C.ink, amp: 0.6, salpha: 0.75 });
    }
    // open interior
    const lk = o.lid ?? 0;
    if (lk > 0.01) S(rectP(-190, -200, 380, 16), { fill: '#3b3446', lw: 2, amp: 0.6, hatch: false });
    // lid
    withT(lk * 150, -lk * 12, 1, () => {
      S(cr([[-222, -190], [222, -190], [214, -224], [0, -240], [-214, -224]], true, 4), { fill: C.stoneL, lw: 3.4, hgap: 7, light: true });
      if (o.dust) alphaDo(o.dust, () => { for (let i = 0; i < 46; i++) { CTX.fillStyle = '#8a8478'; CTX.globalAlpha = 0.5; CTX.fillRect(-200 + hash(i) * 400, -232 + hash(i + 9) * 38, 3 + hash(i + 3) * 3, 2); } });
    }, lk * 0.1);
    // flowers
    if (o.lily) alphaDo(o.lily, () => {
      withT(-60, -238 + lk * 0, 1, () => {
        L(cr([[-60, 0], [0, -6], [60, -2]], false), { lw: 4, stroke: '#5f7a45', amp: 0.6 });
        for (const fx of [-50, -10, 34]) { S(cr([[fx, -4], [fx + 12, -22], [fx + 24, -6], [fx + 12, 2]]), { fill: '#f5f0e2', lw: 2.2, amp: 0.4, hatch: false }); }
      });
    });
    if (o.ivy) {
      const P = []; const n2 = Math.floor(o.ivy * 30);
      for (let i = 0; i <= n2; i++) P.push([-215 + Math.sin(i * 0.6) * 10 + i * 2, 10 - i * 7.5]);
      if (P.length > 1) L(P, { lw: 3.5, stroke: '#4f6b3c', amp: 0.6 });
      for (let i = 3; i <= n2; i += 3) S(ell(P[i][0] + (i % 2 ? 12 : -12), P[i][1], 10, 6, 10), { fill: '#7f9a5a', lw: 1.8, amp: 0.4, hatch: false });
    }
    SEED = old;
  });
}

function door(x, y, s, k) { // origin bottom center
  withT(x, y, s, () => {
    const old = SEED; SEED = 55;
    S(archP(-170, -460, 340, 460), { fill: C.stoneD, lw: 3.4, hgap: 8, hatch2: true });
    const inner = archP(-128, -420, 256, 420);
    S(inner, { fill: '#f6d78f', lw: 3, hatch: false });
    glow(0, -150, 260 * (0.3 + k), '255,205,120', 0.5 * k);
    const c = CTX; c.save(); pathP(inner, true); c.clip();
    const w = 1 - 0.86 * ease(k);
    S(rectP(-128, -430, 128 * w, 430), { fill: C.brown, lw: 3, hgap: 6, hatch2: true });
    S(rectP(128 - 128 * w, -430, 128 * w, 430), { fill: C.brown, lw: 3, hgap: 6, hatch2: true });
    for (let i = 1; i < 3; i++) { L([[-128 + 128 * w * i / 3, -420], [-128 + 128 * w * i / 3, 0]], { lw: 2, salpha: 0.5 }); L([[128 - 128 * w * i / 3, -420], [128 - 128 * w * i / 3, 0]], { lw: 2, salpha: 0.5 }); }
    for (const yy of [-330, -200, -80]) { L([[-128, yy], [-128 + 128 * w, yy]], { lw: 6, stroke: '#3d3533', amp: 0.6 }); L([[128 - 128 * w, yy], [128, yy]], { lw: 6, stroke: '#3d3533', amp: 0.6 }); }
    c.restore();
    SEED = old;
  });
}

function calPage(x, y, w, h, phase, o = {}) {
  withT(x, y, 1, () => {
    const old = SEED; SEED = o.seed ?? phase * 31;
    const flip = o.flip ?? 0; // 0 flat, 1 flipped away (upwards)
    const c = CTX; c.save();
    c.translate(0, -h / 2); c.scale(1, Math.cos(flip * Math.PI / 2) * (1 - flip * 0.05) + 0.001); c.translate(0, h / 2);
    if (flip > 0) c.globalAlpha *= 1 - flip * 0.4;
    S(rrP(-w / 2, -h / 2, w, h, 10), { fill: o.col || '#ece0c4', lw: 3, hgap: 8, halpha: 0.2 });
    S(rectP(-w / 2, -h / 2, w, h * 0.09), { fill: C.burg, lw: 2.6, hgap: 6 });
    // moon
    const mr = w * 0.17, mx = 0, my = -h / 2 + h * 0.3;
    S(ell(mx, my, mr, mr, 26), { fill: '#3e3a58', lw: 2.6, amp: 0.6, hatch: false });
    c.save(); pathP(ell(mx, my, mr - 1, mr - 1, 26), true); c.clip();
    const off = (phase - 0.5) * 2 * mr * 2.1;
    S(ell(mx + off, my, mr, mr, 26), { fill: '#f6e9b8', lw: 0, stroke: false, amp: 0.4, hgap: 6, halpha: 0.2 });
    c.restore();
    // day dots grid
    for (let r = 0; r < 5; r++) for (let q = 0; q < 6; q++) {
      const dx = -w * 0.33 + q * w * 0.133, dy = -h / 2 + h * 0.55 + r * h * 0.085;
      c.fillStyle = C.inkSoft; c.globalAlpha = 0.6 * (o.alpha ?? 1); c.beginPath(); c.arc(dx, dy, Math.max(2.5, w * 0.012), 0, 7); c.fill();
    }
    c.restore();
    // rings
    for (const rx of [-w * 0.28, w * 0.28]) S(ell(rx, -h / 2 + 2, 9, 14, 12), { fill: false, lw: 3.2, stroke: C.stoneDD, amp: 0.4 });
    SEED = old;
  });
}
