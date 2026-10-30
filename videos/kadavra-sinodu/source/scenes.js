// ---------- the nine scenes ----------
// scene boundaries (seconds), derived from the narration's sentence pauses
const END = 59.4;
const B = [0, 5.50, 10.82, 16.76, 25.69, 33.85, 41.43, 49.18, 53.90, END];

function quill(x, y, s = 1, rot = -0.6) {
  withT(x, y, s, () => {
    const old = SEED; SEED = 17;
    S(cr([[0, 0], [10, -40], [22, -110], [10, -150], [-6, -112], [-6, -40]]), { fill: '#f3eee0', lw: 2.4, amp: 0.5, hgap: 4, halpha: 0.3 });
    L([[0, 0], [8, -140]], { lw: 2, salpha: 0.7, amp: 0.3 });
    SEED = old;
  }, rot);
}

// ---------- scene 1: the dead pope is already on trial ----------
function cam1(lt) { const k = ease(lt / 6); return [lerp(1.12, 1.24, k), 540, lerp(1175, 1145, k)]; }
function scene1(lt) {
  courtroom({
    formosus: {},
    react: (i, cg) => {
      const r = { expr: 'shock', eyes: 'wide', mouth: [0, 3, 6, 9].includes(i) ? 'o' : 'line', look: 0.7 };
      if (i === 4) r.pose = 'mouth';
      if (i === 8) r.pose = 'shock';
      if (i === 1 || i === 7) { r.pose = 'down'; r.mouth = 'o'; }
      if (i === 10 && lt > 2.2) { r.look = -0.6; r.mouth = 'talk'; r.pose = 'mouth'; }
      if (i === 5 && lt > 2.4) { r.look = 0.8; r.pose = 'point'; }
      return r;
    },
  });
  dust(TIME, 40, 300, 700, 800, 1450, 3, 0.55);
}

// ---------- scene 2: he had been dead for months ----------
function cam2(lt) { return [1.0 + 0.03 * ease(lt / 5.4), 540, 1200 - 10 * ease(lt / 5.4)]; }
function scene2(lt) {
  crypt();
  const flips = Math.floor(clamp((lt - 3.25) / 0.2, 0, 9));
  const cand = seg(lt, 1.5, 1.9);
  if (cand > 0) alphaDo(cand, () => { candle(230, 1660, 1.0, { ph: 0.2 }); candle(850, 1660, 1.0, { ph: 1.1 }); });
  tomb(540, 1640, 1.15, { lid: 0.9 * (1 - seg(lt, 2.3, 3.1)), lily: seg(lt, 1.8, 2.3), tally: flips, dust: clamp(flips / 9), ivy: clamp((lt - 3.3) / 2.0) });
  // the living pope, remembered in a gilded roundel
  const mIn = seg(lt, 0.0, 0.35), mOut = seg(lt, 2.0, 2.6);
  if (mIn > 0 && mOut < 1) alphaDo(mIn * (1 - mOut), () => {
    const sc = lerp(0.88, 1, easeOut(mIn));
    withT(540, 900, sc, () => {
      const c = CTX; const old = SEED; SEED = 44;
      S(ell(0, 0, 250, 250, 48), { fill: '#efdcaa', lw: 3, hgap: 8, halpha: 0.18 });
      glow(0, -40, 240, '255,214,130', 0.35);
      c.save(); pathP(ell(0, 0, 246, 246, 48), true); c.clip();
      figure({ x: 0, y: 225, s: 0.92, dir: 1, front: true, robe: C.white, garment: 'chasuble', gcol: C.burg, pallium: true, hat: 'tiara', beard: '#efe9dc', expr: 'calm', mouth: 'smile', pose: 'bless', ph: 1, seed: 5, noShadow: true });
      c.restore();
      L(ell(0, 0, 250, 250, 48), { lw: 16, stroke: C.goldD, amp: 1.2 });
      L(ell(0, 0, 250, 250, 48), { lw: 8, stroke: C.gold, amp: 1.2 });
      SEED = old;
    });
  });
  // calendar pages for the passing months
  const cIn = seg(lt, 2.85, 3.2);
  if (cIn > 0) alphaDo(cIn, () => withT(540, 880, lerp(0.85, 1, easeOut(cIn)), () => {
    const done = clamp((lt - 3.25) / 0.2, 0, 9.999);
    const cur = Math.floor(done), f = done - cur;
    if (cur < 9) calPage(0, 0, 380, 450, ((cur + 1) * 0.31) % 1, { seed: cur + 1 });
    if (cur < 9 && lt > 3.25) calPage(0, 0, 380, 450, (cur * 0.31) % 1, { flip: ease(f), seed: cur });
    if (lt <= 3.25) calPage(0, 0, 380, 450, 0, { seed: 0 });
    if (cur >= 9) calPage(0, 0, 380, 450, (9 * 0.31) % 1, { seed: 9 });
  }));
  dust(TIME, 30, 200, 800, 880, 1600, 7, 0.4);
}

// ---------- scene 3: the new pope orders the tomb opened ----------
function cam3(lt) { return [1.26 + 0.05 * ease(lt / 6), 540, 1330]; }
function scene3(lt) {
  chamber();
  // attendants
  const give = seg(lt, 3.9, 4.4);
  figure({ x: 735, y: 1680, s: 1.05, dir: -1, robe: C.robeBrown, hat: 'tonsure', pose: give > 0.5 ? 'hold' : 'clasp', expr: 'worry', ph: 0.6, rot: -0.06 * bell(lt, 3.9, 4.9), seed: 31, look: 0.3 });
  figure({ x: 860, y: 1690, s: 1.0, dir: -1, robe: C.robeGray, hat: 'hood', hoodCol: C.robeGray, pose: 'clasp', expr: 'worry', ph: 1.6, rot: -0.05 * bell(lt, 4.0, 5.0), seed: 32, look: 0.3 });
  // Stephen VI behind the desk
  const pk = seg(lt, 2.55, 2.95) * (1 - seg(lt, 3.7, 4.0));
  const writing = lt < 2.6;
  figure({ x: 380, y: 1660, s: 1.2, dir: 1, robe: C.white, garment: 'cape', gcol: C.plum, hat: 'tiara', beard: '#4a3528', expr: 'stern', mouth: lt > 2.7 && lt < 3.7 ? 'talk' : 'frown', pose: 'write', pose2: 'point', poseK: pk, ph: 0.4, seed: 88, look: 0.5,
    held: writing ? (h) => { quill(h[0] + 6 + Math.sin(TIME * 9) * 3, h[1] + 4, 0.9, -0.35); } : null });
  // desk
  const old = SEED; SEED = 51;
  S(rectP(150, 1500, 780, 50), { fill: C.brownL, lw: 3.4, hgap: 6 });
  S(rectP(170, 1550, 740, 420), { fill: C.brown, lw: 3.4, hgap: 6, hatch2: true });
  S(archP(230, 1610, 140, 260), { fill: C.brownD, lw: 2.4, alpha: 0.5 });
  S(archP(710, 1610, 140, 260), { fill: C.brownD, lw: 2.4, alpha: 0.5 });
  SEED = old;
  // the written order
  const mv = seg(lt, 3.95, 4.4);
  const px = lerp(530, 680, mv), py = lerp(1470, 1345, mv);
  parchment(px, py, 220, 140, { lines: 5, reveal: seg(lt, 0.25, 2.4), seal: lt > 3.45 ? clamp((lt - 3.45) / 0.25) : 0, rot: lerp(-0.05, -0.12, mv), seed: 3 });
  // inset panel: the tomb of Formosus
  const pin = seg(lt, 2.6, 3.0);
  if (pin > 0) {
    const g = seg(lt, 4.4, 4.9);
    const cx = lerp(735, 540, g), cy = lerp(1000, 990, g), sc = lerp(0.85, 1.55, g) * lerp(0.8, 1, easeOut(pin));
    if (g > 0) alphaDo(g * 0.4, () => { CTX.fillStyle = '#2b2448'; CTX.fillRect(-100, 200, 1300, 1900); });
    alphaDo(pin, () => withT(cx, cy, sc, () => {
      const c = CTX; const o2 = SEED; SEED = 66;
      const fr = rrP(-190, -150, 380, 300, 26);
      S(fr, { fill: '#8a8279', lw: 3, hgap: 7 });
      c.save(); pathP(fr, true); c.clip();
      floorDraw(90, '#7d6c57');
      const tk = 1 - seg(lt, 5.1, 5.35);
      if (tk > 0) alphaDo(tk, () => tomb(0, 110, 0.6, { lid: seg(lt, 4.75, 5.15) * 0.7 }));
      const pp = bell(lt, 5.1, 5.6);
      if (pp > 0) alphaDo(pp, () => calPage(0, 0, 180, 220, 0.5, { flip: seg(lt, 5.3, 5.6), col: C.parch, seed: 4 }));
      const dk = seg(lt, 5.3, 5.45);
      if (dk > 0) alphaDo(dk, () => { door(0, 145, 0.62, seg(lt, 5.45, 5.95)); });
      c.restore();
      L(fr, { lw: 12, stroke: C.goldD, amp: 1 }); L(fr, { lw: 6, stroke: C.gold, amp: 1 });
      SEED = o2;
    }));
  }
  dust(TIME, 26, 160, 800, 700, 1500, 11, 0.45);
}

// ---------- scene 4: dressed, seated, and a court convened ----------
function cam4(lt) {
  const a = seg(lt, 3.6, 5.2), b = seg(lt, 5.3, 7.2);
  const z = lerp(lerp(1.72 + 0.06 * ease(lt / 3.6), 1.32, a), 1.0, b);
  return [z, 540, lerp(lerp(1120, 1160, a), 1200, b)];
}
function scene4(lt) {
  const dk = seg(lt, 0.15, 1.4), pal = seg(lt, 1.35, 1.8), tk = seg(lt, 1.9, 3.0);
  const thK = seg(lt, 3.65, 4.5);
  const rowA = r => r === 0 ? seg(lt, 5.45, 5.95) : seg(lt, 5.85, 6.35);
  courtroom({
    bas: { glowK: lerp(0.4, 1, seg(lt, 3.6, 6)) },
    throneK: thK, stool: 1 - seg(lt, 3.6, 4.2),
    fDy: -16 * bell(lt, 3.7, 4.4),
    formosus: { dressed: dk, pallium: pal, tiaraK: tk, shroud: dk < 0.5, hat: 'tiara' },
    stephen: { alpha: seg(lt, 6.3, 6.8), pose: 'down', expr: 'stern', mouth: 'frown' },
    build: (cg) => cg.pew ? rowA(cg.row) : clamp(rowA(cg.row) * 1.3 - (cg.x % 3) * 0.05),
    react: (i, cg) => ({ expr: 'stern', look: 0.6, pose: i % 2 ? 'clasp' : 'down' }),
    candles: seg(lt, 4.6, 5.2),
  });
  // attendants' hands dressing the body
  const hk = bell(lt, 0.05, 1.6);
  if (hk > 0) alphaDo(hk, () => { const yy = 1105 - (1 - ease(dk)) * 420 * 1.1; hands(462, yy, 1.1, -1); hands(618, yy, 1.1, 1); });
  const tkh = bell(lt, 1.8, 3.2);
  if (tkh > 0) alphaDo(tkh, () => { const yy = 1000 - (1 - ease(tk)) * 260 * 1.1; hands(500, yy, 1.0, -1); hands(588, yy, 1.0, 1); });
  dust(TIME, 30, 320, 700, 760, 1400, 5, 0.45);
}

// ---------- scene 5: a deacon answers for the dead ----------
function s5k(lt) {
  return {
    point: clamp(seg(lt, 0.3, 0.7) - seg(lt, 3.0, 3.5) + seg(lt, 4.6, 5.0)),
    push: seg(lt, 2.1, 2.9) * (1 - seg(lt, 3.2, 3.8)) + seg(lt, 5.35, 5.8) * (1 - seg(lt, 6.0, 6.5)),
  };
}
function cam5(lt) { const k = s5k(lt); return [1.3 + 0.16 * k.push, lerp(510, 545, k.push), lerp(1235, 1150, k.push)]; }
function scene5(lt) {
  const k = s5k(lt);
  const stTalk = (lt > 0.5 && lt < 2.1) || (lt > 4.75 && lt < 5.35);
  const dIn = seg(lt, 3.3, 4.6);
  const dTalk = lt > 6.05 && lt < 8.0;
  const watchingDeacon = seg(lt, 6.1, 6.6);
  courtroom({
    formosus: {},
    stephen: { pose: 'down', pose2: 'point', poseK: k.point, mouth: stTalk ? 'talk' : 'frown', expr: 'stern', look: 0.5 },
    deacon: dIn > 0 ? {
      x: lerp(1180, 790, dIn), y: 1450 - Math.abs(Math.sin(lt * 9)) * 6 * (dIn < 1 ? 1 : 0),
      mouth: dTalk ? 'talk' : (lt > 5.4 ? 'wavy' : 'line'), talkHand: dTalk, pose: dTalk ? 'down' : 'clasp',
      look: dTalk ? 0.4 : (lt > 5.3 ? -0.9 : 0.2), tilt: lt > 5.3 && !dTalk ? 0.12 : 0, sweat: dIn,
    } : null,
    react: (i, cg) => {
      const toD = watchingDeacon;
      const r = { expr: toD > 0.5 ? 'shock' : 'stern', look: cg.side === 'L' ? 0.7 : lerp(0.6, -0.4, toD), pose: i % 2 ? 'clasp' : 'down' };
      if (toD > 0.5 && [1, 4, 7, 9].includes(i)) { r.mouth = 'o'; r.eyes = 'wide'; }
      return r;
    },
  });
  dust(TIME, 30, 320, 700, 760, 1400, 9, 0.45);
}

// ---------- scene 6: the verdict ----------
function cam6(lt) { return [1.0 + 0.04 * ease(lt / 7.6), 540, 1200]; }
function scene6(lt) {
  basilica({ glowK: 0.7 });
  floorDraw();
  alphaDo(0.5, () => seated({ x: 540, y: 1270, s: 1.1, silhouette: true, seed: 3 }));
  alphaDo(0.35, () => { CTX.fillStyle = C.paper; CTX.fillRect(-100, 200, 1300, 1900); });
  const offK = seg(lt, 3.0, 3.5);
  // officials
  if (offK < 1) alphaDo(1 - offK, () => {
    figure({ x: 200, y: 1700, s: 1.25, dir: 1, robe: C.white, garment: 'cape', gcol: C.slate, hat: 'mitre', beard: '#d9d2c2', pose: 'write', expr: 'stern', ph: 0.2, seed: 61, look: 0.6 });
    figure({ x: 880, y: 1700, s: 1.25, dir: -1, robe: C.robeGray, hat: 'tonsure', pose: 'hold', expr: 'stern', mouth: 'frown', ph: 1.4, seed: 62, look: 0.6 });
  });
  // table
  const old = SEED; SEED = 81;
  S(rectP(60, 1560, 960, 56), { fill: C.brownL, lw: 3.4, hgap: 6 });
  S(rectP(80, 1616, 920, 400), { fill: C.brown, lw: 3.4, hgap: 6, hatch2: true });
  SEED = old;
  // verdict parchment
  const mv = seg(lt, 3.1, 3.8);
  const vx = lerp(540, 540, mv), vy = lerp(1300, 770, mv), vs = lerp(1, 0.42, mv);
  const sealK = lt > 2.55 ? clamp((lt - 2.55) / 0.22) : 0;
  const shake = bell(lt, 2.55, 2.75) * 5;
  withT(vx + Math.sin(TIME * 70) * shake, vy, vs, () => parchment(0, 0, 460, 560, { scroll: true, lines: 8, reveal: seg(lt, 0.4, 2.2), seal: sealK, seed: 21, emblem: 'tiara', emblemS: 1.3 }));
  if (mv < 1) {
    // quill writing
    const rv = seg(lt, 0.4, 2.2); const line = Math.min(7, Math.floor(rv * 8)); const fx = (rv * 8) % 1;
    if (lt < 2.4) quill(540 - 230 + 64 + fx * 330, 1300 - 280 + 156 + line * 33, 1.0, -0.45);
    // seal stamp coming down
    const sd = seg(lt, 2.2, 2.55) * (1 - seg(lt, 2.75, 3.1));
    if (lt > 2.0 && lt < 3.2) withT(641, lerp(1250, 1470, sd), 1, () => {
      const o3 = SEED; SEED = 12;
      S(ell(0, 0, 40, 12, 18), { fill: C.goldD, lw: 3, amp: 0.4 });
      S(rectP(-14, -110, 28, 104), { fill: C.brown, lw: 3, amp: 0.5 });
      S(ell(0, -120, 26, 20, 16), { fill: C.brownL, lw: 3, amp: 0.4 });
      SEED = o3;
    });
  }
  // Formosus' papal acts — some declared invalid
  const docs = [[215, 1130, 'tiara'], [540, 1130, 'ordain'], [865, 1130, 'mitre'], [215, 1480, 'church'], [540, 1480, 'ordain'], [865, 1480, 'mitre']];
  const crossed = [1, 2, 4, 5];
  docs.forEach(([x, y, em], j) => {
    const a = seg(lt, 3.45 + j * 0.12, 3.75 + j * 0.12);
    if (a <= 0) return;
    const ci = crossed.indexOf(j);
    const ck = ci >= 0 ? clamp((lt - (4.6 + ci * 0.55)) / 0.35) : 0;
    const gk = ci >= 0 ? seg(lt, 4.8 + ci * 0.55, 5.3 + ci * 0.55) : 0;
    alphaDo(a * (1 - gk * 0.35), () => withT(x, y, lerp(0.7, 1, easeOut(a)), () => parchment(0, 0, 240, 290, { lines: 4, emblem: em, emblemS: 1.4, seal: 1, cross: ck, gray: gk, seed: j * 5 + 1, rot: (hash(j) - 0.5) * 0.08 })));
  });
}

// ---------- scene 7: backlash in Rome ----------
function cam7(lt) { return lt < 3.3 ? [1.03 + 0.03 * ease(lt / 3.3), 540, 1200] : [1.04 + 0.05 * ease((lt - 3.3) / 4.4), 540, 1180]; }
function blobPath(cx, cy, r, seed) {
  const P = []; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; const rr = r * (1 + 0.13 * (vnoise(Math.cos(a) * 1.8 + seed, Math.sin(a) * 1.8 + BOIL * 0.7) - 0.5) * 2); P.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return P;
}
function scene7(lt) {
  const c = CTX;
  const wipe = seg(lt, 3.0, 3.7);
  if (wipe < 1) {
    rome(TIME);
    const ag = 0.25 + 0.75 * seg(lt, 0, 2.6);
    crowdRow(TIME, 1500, 0.55, [40, 130, 220, 300, 390, 470, 560, 640, 720, 810, 900, 990, 1060], 3, ag);
    const sw = Math.floor(lt / 0.8) % 2;
    figure({ x: 380, y: 1610, s: 1.08, dir: 1, robe: C.white, garment: 'cape', gcol: C.slate, hat: 'mitre', beard: '#d9d2c2', pose: sw ? 'open' : 'talk', talkHand: !sw, mouth: sw ? 'frown' : 'talk', expr: 'stern', ph: 0.3, seed: 71, look: 0.5 });
    figure({ x: 700, y: 1610, s: 1.08, dir: -1, robe: C.robeBrown, hat: 'tonsure', pose: sw ? 'talk' : 'point', talkHand: !!sw, mouth: sw ? 'talk' : 'frown', expr: 'stern', ph: 1.3, seed: 72, look: 0.5 });
    crowdRow(TIME, 1720, 0.72, [20, 150, 280, 820, 950, 1070], 9, ag);
    crowdRow(TIME, 1990, 0.98, [60, 250, 470, 640, 840, 1030], 13, ag * 0.8);
    papers(TIME, 22, 5, 540, 900, 560, 380, seg(lt, 0.2, 2.8), 1.1);
  }
  if (wipe > 0) {
    c.save();
    if (wipe < 1) { pathP(blobPath(540, 1150, wipe * 1500, 3), true); c.clip(); }
    basilica({ glowK: 0.5 });
    floorDraw(); rug(); dais(540, 1425, 620);
    const pk = seg(lt, 6.3, 7.1);
    if (pk < 1) throne(540, 1270, 1.1, { k: 1 - pk });
    if (pk > 0) throne(540, 1270, 1.1, { k: pk, plain: true });
    const fk = seg(lt, 5.6, 6.6);
    const shock = lt > 5.0;
    if (fk < 1) seated({ x: 540 - 560 * easeIn(fk), y: 1270 - 30 * Math.sin(fk * 3), rot: -0.7 * fk, alpha: 1 - seg(lt, 6.2, 6.7), s: 1.1, gcol: C.plum, beard: '#4a3528', hat: lt > 5.75 ? 'none' : 'tiara', expr: shock ? 'shock' : 'stern', eyes: shock ? 'wide' : 'dot', mouth: shock ? 'o' : 'frown', tilt: 0, pallium: 0, seed: 88 });
    if (lt > 5.75) {
      const tf = seg(lt, 5.75, 6.25);
      alphaDo(1 - seg(lt, 6.9, 7.4), () => emblem(lerp(540, 600, tf), lerp(1000, 1238, easeIn(tf)), 1.3, 'tiara'));
    }
    papers(TIME, 30, 9, 540, 1150, 470, 340, seg(lt, 3.6, 4.6) * (1 - 0.6 * seg(lt, 6.8, 7.6)), 1.2);
    crowdRow(TIME, 2010, 1.0, [40, 230, 420, 660, 850, 1040], 21, 0.9, 0.55);
    c.restore();
    if (wipe < 1) L(blobPath(540, 1150, wipe * 1500, 3), { lw: 6, salpha: 0.6 * (1 - wipe), amp: 2 });
  }
}

// ---------- scene 8: history names it the Cadaver Synod ----------
function cam8(lt) { return [1.0 + 0.04 * ease(lt / 4.7), 540, 1195]; }
function scene8(lt) {
  courtroom({
    formosus: { silhouette: true },
    stephen: { pose: 'down', expr: 'stern', mouth: 'frown' },
    react: (i, cg) => ({ expr: 'neutral', look: 0.6, pose: i % 2 ? 'clasp' : 'down' }),
    extra: () => {
      const old = SEED; SEED = 91;
      S(rectP(420, 1560, 240, 34), { fill: C.brownL, lw: 3, hgap: 6 });
      S(rectP(440, 1594, 200, 200), { fill: C.brown, lw: 3, hgap: 6 });
      parchment(540, 1535, 170, 70, { lines: 3, seal: 1, seed: 7, rot: 0.03 });
      quill(612, 1540, 0.6, 0.5);
      SEED = old;
    },
  });
}
function post8(lt) { illuminate(seg(lt, 0.8, 2.9), TIME); }

// ---------- scene 9: permanent channel ending ----------
function cam9(lt) { return [lerp(1.1, 1.2, ease(lt / 5.5)), 540, lerp(1205, 1185, ease(lt / 5.5))]; }
function scene9(lt) {
  courtroom({
    shadowSil: 0.32,
    candleL: 330, candleR: 750,
    build: (cg) => cg.pew ? 1 : 0,
    extra: () => {
      // papal robe left draped on the empty throne
      const old = SEED; SEED = 93;
      S(cr([[470, 1180], [610, 1180], [640, 1262], [600, 1300], [480, 1300], [440, 1262]]), { fill: C.burg, lw: 3, hgap: 6, hatch2: true });
      L(cr([[440, 1262], [480, 1300], [600, 1300], [640, 1262]], false), { lw: 5, stroke: C.gold, amp: 0.8 });
      // stack of parchment records at the foot of the dais
      for (let i = 0; i < 4; i++) parchment(540 + (i % 2 ? 14 : -10), 1530 - i * 16, 260, 70, { lines: 0, seed: 40 + i, rot: (hash(i) - 0.5) * 0.12 });
      parchment(546, 1470, 230, 80, { lines: 3, seal: 1, seed: 50, rot: -0.04 });
      S(rrP(330, 1490, 120, 34, 16), { fill: shade(C.parch, -0.1), lw: 2.8, hgap: 5 });
      S(rrP(640, 1500, 110, 30, 14), { fill: shade(C.parch, -0.1), lw: 2.8, hgap: 5 });
      SEED = old;
    },
  });
  dust(TIME, 50, 260, 640, 820, 1480, 13, 0.6);
}

const SCENES = [null, scene1, scene2, scene3, scene4, scene5, scene6, scene7, scene8, scene9];
const CAMS = [null, cam1, cam2, cam3, cam4, cam5, cam6, cam7, cam8, cam9];
const POSTS = { 8: post8 };

// transformations between scenes: blob wipe + morphing key object
function toScreen(P, cam) { const [z, cx, cy] = cam; return P.map(p => [540 + (p[0] - cx) * z, 1200 + (p[1] - cy) * z]); }
const THRONE_OUT = [[-118, 0], [-120, -200], [-112, -300], [-82, -362], [0, -390], [82, -362], [112, -300], [120, -200], [118, -10], [142, -10], [140, 20], [118, 150], [-118, 150], [-140, 20], [-142, -10], [-118, -10]];
const TOMB_OUT = [[-232, 12], [-232, -20], [-205, -20], [-205, -190], [-222, -190], [-214, -224], [0, -240], [214, -224], [222, -190], [205, -190], [205, -20], [232, -20], [232, 12]];
const CHAS_OUT = [[-28, -176], [28, -176], [68, -150], [82, -60], [86, 22], [62, 72], [0, 88], [-62, 72], [-86, 22], [-82, -60], [-68, -150]];
const TR = {
  1: { c: [540, 1250], A: () => toScreen(tf(THRONE_OUT, 540, 1270, 1.1), cam1(5.5)), B: () => toScreen(tf(TOMB_OUT, 540, 1640, 1.15), cam2(0.4)), fa: C.gold, fb: C.stone },
  2: { c: [540, 900], A: () => toScreen(rrP(350, 655, 380, 450, 10), cam2(5.4)), B: () => toScreen(rectP(420, 1400, 220, 140), cam3(0.4)), fa: '#ece0c4', fb: C.parch },
  3: { c: [540, 1050], A: () => toScreen(tf(archP(-170, -460, 340, 460), 540, 990 + 145 * 1.55, 0.62 * 1.55), cam3(5.9)), B: () => toScreen(tf(CHAS_OUT, 540, 1270 - 150, 1.1), cam4(0.45)), fa: C.brown, fb: C.burg },
  4: { c: [540, 1050] },
  5: { c: [560, 1150], A: () => toScreen(tf(CHAS_OUT, 540, 1270, 1.1), cam5(0)), B: () => toScreen(rectP(310, 1020, 460, 560), cam6(0.45)), fa: C.burg, fb: C.parch },
  6: { c: [540, 1250] },
  7: { c: [540, 1150], A: () => toScreen(tf(THRONE_OUT, 540, 1270, 1.1), cam7(7.9)), B: () => toScreen(tf(THRONE_OUT, 540, 1270, 1.1), cam8(0.4)), fa: C.brownL, fb: C.gold },
  8: { c: [540, 1150] },
};
const TD = 0.9;
