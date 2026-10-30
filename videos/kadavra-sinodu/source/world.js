// ---------- environments ----------

function camera(z, cx, cy, dx = 0, dy = 0) { const c = CTX; c.translate(540 + dx, 1200 + dy); c.scale(z, z); c.translate(-cx, -cy); }

function beam(x0, y0, x1, y1, w0, w1, a) {
  const c = CTX; c.save(); c.globalCompositeOperation = 'screen';
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, `rgba(255,226,160,${a})`); g.addColorStop(1, 'rgba(255,226,160,0)');
  c.fillStyle = g; c.beginPath();
  c.moveTo(x0 - w0 / 2, y0); c.lineTo(x0 + w0 / 2, y0); c.lineTo(x1 + w1 / 2, y1); c.lineTo(x1 - w1 / 2, y1); c.closePath(); c.fill(); c.restore();
}

function dust(t, n, x0, y0, x1, y1, seed = 1, a = 0.5) {
  const c = CTX; c.save();
  for (let i = 0; i < n; i++) {
    const hx = hash(i * 3.1 + seed), hy = hash(i * 7.7 + seed);
    const x = x0 + ((hx * (x1 - x0) + Math.sin(t * 0.3 + i) * 30 + t * 6) % (x1 - x0) + (x1 - x0)) % (x1 - x0);
    const y = y0 + ((hy * (y1 - y0) - t * (8 + hash(i) * 10)) % (y1 - y0) + (y1 - y0)) % (y1 - y0);
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.8 + hash(i + 2)) + i));
    c.globalAlpha = a * tw; c.fillStyle = '#fff3cf';
    c.beginPath(); c.arc(x, y, 1.6 + hash(i + 5) * 2.4, 0, 7); c.fill();
  }
  c.restore();
}

function basilica(o = {}) {
  const old = SEED; SEED = 3.3;
  const wall = o.wall || C.stone;
  S(rectP(-60, 280, 1200, 1080), { fill: wall, lw: 0, stroke: false, hang: -80, hgap: 9, halpha: 0.22, amp: 0 });
  // stone courses
  for (let r = 0; r < 16; r++) {
    const y = 330 + r * 64;
    L([[-40, y], [1120, y + (hash(r) - 0.5) * 6]], { lw: 2, salpha: 0.22, amp: 2 });
    for (let q = 0; q < 9; q++) { const x = (r % 2 ? 60 : 0) + q * 130 + hash(r * 9 + q) * 20; L([[x, y], [x, y + 64]], { lw: 2, salpha: 0.18, amp: 1 }); }
  }
  // side arcades
  for (const [ax, sgn] of [[40, -1], [830, 1]]) {
    S(archP(ax, 660, 210, 690), { fill: C.stoneDD, lw: 3.4, hgap: 7, hatch2: true, halpha: 0.3 });
    S(archP(ax + 80, 760, 50, 150), { fill: '#f2dca0', lw: 2.6, hatch: false });
    // banner
    const bx = ax + 105;
    S(cr([[bx - 52, 900], [bx + 52, 900], [bx + 50, 1160], [bx, 1200], [bx - 50, 1160]]), { fill: C.burg, lw: 3, hgap: 6, hatch2: true });
    L([[bx - 50, 912], [bx + 50, 912]], { lw: 6, stroke: C.gold, amp: 0.8 });
    S(rectP(bx - 6, 960, 12, 150), { fill: C.gold, lw: 2, amp: 0.6, hatch: false });
    S(rectP(bx - 34, 1000, 68, 12), { fill: C.gold, lw: 2, amp: 0.6, hatch: false });
  }
  // pillars
  for (const px of [252, 788]) {
    S(rectP(px - 22, 610, 44, 740), { fill: C.stoneL, lw: 3.2, hgap: 7, light: true });
    S(rectP(px - 34, 590, 68, 28), { fill: C.stoneD, lw: 3, hgap: 6 });
    S(rectP(px - 34, 1320, 68, 28), { fill: C.stoneD, lw: 3, hgap: 6 });
  }
  // apse
  S(archP(300, 500, 480, 860), { fill: o.apse || '#93806c', lw: 3.6, hgap: 7, hatch2: true, halpha: 0.25 });
  // gold semi-dome mosaic band
  const c = CTX; c.save(); pathP(archP(318, 518, 444, 840), true); c.clip();
  S(ell(540, 740, 230, 230, 40, Math.PI, Math.PI * 2).concat([[770, 760], [310, 760]]), { fill: C.gold, lw: 2.6, hgap: 6, light: true, alpha: 0.85 });
  for (let i = 0; i < 9; i++) { const a = Math.PI + Math.PI * (i + 0.5) / 9; L([[540, 740], [540 + Math.cos(a) * 230, 740 + Math.sin(a) * 230]], { lw: 2, salpha: 0.3, amp: 1 }); }
  S(ell(540, 650, 40, 40, 20), { fill: C.goldL, lw: 2.6, amp: 0.6, hatch: false });
  L([[540, 622], [540, 678]], { lw: 4, stroke: C.burg, amp: 0.4 }); L([[516, 644], [564, 644]], { lw: 4, stroke: C.burg, amp: 0.4 });
  c.restore();
  if (o.glowK !== 0) glow(540, 1050, 420, '255,190,110', 0.22 * (o.glowK ?? 1));
  // high windows
  for (const wx of [150, 930]) S(archP(wx - 18, 390, 36, 90), { fill: '#f5e2ad', lw: 2.4, hatch: false });
  if (o.beams !== false) {
    beam(150, 430, 360, 1500, 30, 200, 0.22);
    beam(930, 430, 720, 1500, 30, 200, 0.22);
  }
  SEED = old;
}

function floorDraw(y0 = 1340, col = '#b0916b') {
  const old = SEED; SEED = 8.8;
  S(rectP(-60, y0, 1200, 700), { fill: col, lw: 3, hgap: 8, hang: -20, halpha: 0.25, amp: 0.6 });
  const vx = 540, vy = y0 - 520;
  for (let i = -9; i <= 9; i++) { const xb = 540 + i * 150; L([[vx + (xb - vx) * ((y0 - vy) / (1960 - vy)), y0], [xb, 1960]], { lw: 2, salpha: 0.3, amp: 1.5 }); }
  let y = y0; let g = 26;
  while (y < 1960) { y += g; g *= 1.32; L([[-60, y], [1140, y]], { lw: 2, salpha: 0.28, amp: 1.5 }); }
  SEED = old;
}

function rug(top = 1440) {
  const old = SEED; SEED = 9.1;
  S([[482, top], [598, top], [700, 1960], [380, 1960]], { fill: C.burg, lw: 3, hgap: 6, hatch2: true, halpha2: 0.15 });
  L([[494, top + 8], [394, 1960]], { lw: 5, stroke: C.gold, amp: 1 }); L([[586, top + 8], [686, 1960]], { lw: 5, stroke: C.gold, amp: 1 });
  SEED = old;
}

function pew(x0, x1, top, bottom) {
  const old = SEED; SEED = x0 * 0.1 + top * 0.01;
  S(rectP(x0, top + 14, x1 - x0, bottom - top), { fill: C.brown, lw: 3.2, hgap: 6, hatch2: true });
  S(rectP(x0 - 8, top, x1 - x0 + 16, 22), { fill: C.brownL, lw: 3, hgap: 5 });
  const n = Math.max(2, Math.round((x1 - x0) / 110));
  for (let i = 1; i < n; i++) { const x = x0 + (x1 - x0) * i / n; L([[x, top + 30], [x, bottom]], { lw: 2.2, salpha: 0.45 }); }
  for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + 0.5) / n; S(archP(x - 26, top + 46, 52, Math.min(110, bottom - top - 60)), { fill: C.brownD, lw: 2, alpha: 0.5, amp: 0.8 }); }
  SEED = old;
}

const CLERGY = [
  // left side (face right): back row then front row
  { x: 70, y: 1570, s: 0.78, robe: C.robeBrown, hat: 'tonsure', side: 'L', row: 0, ph: 0.3 },
  { x: 165, y: 1570, s: 0.78, robe: C.robeGray, hat: 'mitre', gcol: C.slate, garment: 'cape', side: 'L', row: 0, ph: 1.1, beard: '#d9d2c2' },
  { x: 262, y: 1570, s: 0.78, robe: C.white, hat: 'mitre', gcol: C.olive, garment: 'cape', side: 'L', row: 0, ph: 2.3 },
  { x: 30, y: 1850, s: 1.02, robe: C.white, hat: 'mitre', gcol: C.burgL, garment: 'cape', side: 'L', row: 1, ph: 0.8, beard: '#7a5a3e' },
  { x: 165, y: 1850, s: 1.02, robe: C.plum, hat: 'tonsure', side: 'L', row: 1, ph: 1.9 },
  { x: 300, y: 1850, s: 1.02, robe: C.robeGray, hat: 'hood', hoodCol: C.robeGray, side: 'L', row: 1, ph: 2.7 },
  // right side (face left)
  { x: 1010, y: 1570, s: 0.78, robe: C.slate, hat: 'tonsure', side: 'R', row: 0, ph: 0.5 },
  { x: 915, y: 1570, s: 0.78, robe: C.white, hat: 'mitre', gcol: C.burg, garment: 'cape', side: 'R', row: 0, ph: 1.7, beard: '#d9d2c2' },
  { x: 1050, y: 1850, s: 1.02, robe: C.white, hat: 'mitre', gcol: C.slate, garment: 'cape', side: 'R', row: 1, ph: 2.1 },
  { x: 915, y: 1850, s: 1.02, robe: C.robeBrown, hat: 'tonsure', side: 'R', row: 1, ph: 0.2, beard: '#6b4b33' },
  { x: 780, y: 1850, s: 1.02, robe: C.olive, hat: 'hood', hoodCol: C.olive, side: 'R', row: 1, ph: 3.1 },
];

function clergyGroup(row, side, o) {
  for (let i = 0; i < CLERGY.length; i++) {
    const cg = CLERGY[i]; if (cg.row !== row || cg.side !== side) continue;
    const r = o.react ? o.react(i, cg) : {};
    const a = o.build ? o.build(cg) : 1;
    if (a <= 0) continue;
    figure(Object.assign({}, cg, { dir: side === 'L' ? 1 : -1, t: TIME, alpha: a, noShadow: true, expr: 'neutral', look: 0.5, seed: i * 13.7 }, r));
  }
  const a = o.build ? o.build({ row, side, pew: true }) : 1;
  if (a > 0) alphaDo(a, () => {
    if (row === 0) side === 'L' ? pew(-30, 320, 1450, 1640) : pew(760, 1110, 1450, 1640);
    else side === 'L' ? pew(-40, 370, 1690, 1990) : pew(710, 1120, 1690, 1990);
  });
}

// the court: the shared stage for scenes 1,4,5,8,9
function courtroom(o = {}) {
  basilica(o.bas || {});
  floorDraw();
  rug();
  dais(540, 1425, 620);
  if (o.shadowSil) alphaDo(o.shadowSil, () => seated({ x: 640, y: 1180, s: 1.25, silhouette: true, silCol: '#3c3150', seed: 5 }));
  const ca = o.candles ?? 1;
  if (ca > 0) alphaDo(ca, () => { candle(o.candleL ?? 362, 1428, 0.95, { ph: 0.3 }); candle(o.candleR ?? 718, 1428, 0.95, { ph: 1.7 }); });
  if (o.stephen) {
    const st = o.stephen;
    alphaDo(st.alpha ?? 1, () => {
      const old = SEED; SEED = 2.2;
      S(rectP(80, 1390, 250, 40), { fill: C.stoneD, lw: 3, hgap: 7 });
      SEED = old;
      figure(Object.assign({ x: 205, y: 1400, s: 0.98, dir: 1, robe: C.white, garment: 'cape', gcol: C.plum, hat: 'tiara', hatTrim: C.gold, beard: '#4a3528', hair: '#4a3528', expr: 'stern', mouth: 'frown', pose: 'down', ph: 0.4, seed: 88, look: 0.4 }, st));
    });
  }
  if (!o.noThrone) {
    if (o.throneK == null || o.throneK > 0) throne(540, 1270, 1.1, { k: o.throneK ?? 1 });
  }
  if (o.stool) alphaDo(o.stool, () => { const old = SEED; SEED = 6; S(rectP(450, 1262, 180, 24), { fill: C.brownL, lw: 3 }); S(rectP(462, 1286, 18, 140), { fill: C.brown, lw: 3 }); S(rectP(600, 1286, 18, 140), { fill: C.brown, lw: 3 }); SEED = old; });
  if (o.formosus) seated(Object.assign({ x: 540, y: 1270 + (o.fDy || 0), s: 1.1, corpse: true, veil: 1, beard: '#efe9dc', expr: 'calm', eyes: 'closed', mouth: 'none', limp: true, seed: 77 }, o.formosus));
  if (o.deacon) figure(Object.assign({ x: 800, y: 1450, s: 0.95, dir: -1, robe: C.white, garment: 'dalmatic', gcol: C.blueGray, hat: 'tonsure', hair: '#6b4a2e', expr: 'worry', mouth: 'wavy', pose: 'clasp', sweat: 1, handShake: 1, ph: 2.2, seed: 99 }, o.deacon));
  if (o.extra) o.extra();
  if (o.clergy !== false) {
    const g = { react: o.react, build: o.build };
    clergyGroup(0, 'L', g); clergyGroup(0, 'R', g);
    clergyGroup(1, 'L', g); clergyGroup(1, 'R', g);
  }
}

function crypt() {
  const old = SEED; SEED = 21;
  S(rectP(-60, 280, 1200, 1300), { fill: '#9e978d', lw: 0, stroke: false, hgap: 9, halpha: 0.25, amp: 0 });
  for (let r = 0; r < 18; r++) { const y = 330 + r * 70; L([[-40, y], [1120, y]], { lw: 2, salpha: 0.2, amp: 2 }); for (let q = 0; q < 8; q++) { const x = (r % 2 ? 70 : 0) + q * 150; L([[x, y], [x, y + 70]], { lw: 2, salpha: 0.16 }); } }
  S(archP(130, 560, 820, 1100), { fill: '#7b7369', lw: 3.6, hgap: 7, hatch2: true });
  S(archP(170, 600, 740, 1060), { fill: '#6c655c', lw: 2.6, hgap: 8, alpha: 0.8 });
  glow(540, 1350, 520, '255,190,110', 0.16);
  floorDraw(1600, '#8f7b62');
  SEED = old;
}

function chamber() {
  const old = SEED; SEED = 41;
  S(rectP(-60, 280, 1200, 1300), { fill: '#c0ab8a', lw: 0, stroke: false, hgap: 9, halpha: 0.22, amp: 0 });
  for (let r = 0; r < 18; r++) { const y = 330 + r * 70; L([[-40, y], [1120, y]], { lw: 2, salpha: 0.16, amp: 2 }); }
  // tapestry
  S(rectP(330, 540, 420, 560), { fill: C.burgD, lw: 3.4, hgap: 6, hatch2: true });
  S(rectP(350, 560, 380, 520), { fill: C.burg, lw: 2.4, hgap: 6 });
  for (const [x, y] of [[440, 680], [640, 680], [540, 830], [440, 980], [640, 980]]) S([[x, y - 26], [x + 20, y], [x, y + 26], [x - 20, y]], { fill: C.gold, lw: 2.2, amp: 0.5, hatch: false });
  // window
  S(archP(110, 620, 120, 300), { fill: '#f5e2ad', lw: 3, hatch: false });
  L([[170, 640], [170, 920]], { lw: 3, salpha: 0.6 }); L([[115, 770], [225, 770]], { lw: 3, salpha: 0.6 });
  beam(170, 760, 380, 1600, 100, 320, 0.25);
  // curtains
  S(cr([[-40, 300], [120, 300], [90, 700], [130, 1200], [60, 1560], [-40, 1560]]), { fill: C.burg, lw: 3.2, hgap: 6, hatch2: true });
  S(cr([[1120, 300], [960, 300], [990, 700], [950, 1200], [1020, 1560], [1120, 1560]]), { fill: C.burg, lw: 3.2, hgap: 6, hatch2: true });
  L([[-40, 310], [1120, 310]], { lw: 10, stroke: C.goldD, amp: 1 });
  floorDraw(1520, '#a1825d');
  SEED = old;
}

function hands(x, y, s, dir = 1) { // attendant hand reaching down from above to (x,y)
  withT(x, y, s, () => {
    S(tube([[dir * 60, -420], [dir * 40, -160], [0, -14]], 34, 30), { fill: C.robeBrown, lw: 3, hgap: 6 });
    S(ell(0, 0, 13, 14, 14), { fill: C.skin, lw: 2.4, amp: 0.4, hatch: false });
  });
}

function papers(t, n, seed, cx, cy, rx, ry, k = 1, size = 1) {
  for (let i = 0; i < n; i++) {
    const ph = hash(i * 1.7 + seed) * 10, sp = 0.35 + hash(i * 2.3 + seed) * 0.5;
    const a = t * sp + ph;
    const x = cx + Math.cos(a) * rx * (0.5 + hash(i + seed) * 0.6) + Math.sin(a * 2.3) * 40;
    const y = cy + Math.sin(a * 1.3) * ry * (0.5 + hash(i * 3 + seed) * 0.6);
    const r = a * 1.9 + i;
    const sc = size * (0.75 + hash(i * 5 + seed) * 0.5);
    alphaDo(k * clamp(n * k - i), () => withT(x, y, sc, () => {
      const old = SEED; SEED = i * 3 + seed;
      S(rectP(-22, -28, 44, 56), { fill: i % 3 ? C.parch : '#ece2c9', lw: 2.4, hgap: 6, halpha: 0.2 });
      scribbleLines(-15, -20, 30, 36, 4, 1, C.inkSoft, 1.6);
      SEED = old;
    }, r, Math.cos(a * 2.1) * 0.8 + 0.2));
  }
}

function rome(t) {
  const old = SEED; SEED = 61;
  S(rectP(-60, 280, 1200, 1300), { fill: C.sky, lw: 0, stroke: false, hgap: 10, halpha: 0.15, amp: 0 });
  // distant hills
  S(cr([[-60, 1120], [140, 1040], [360, 1090], [560, 1010], [780, 1080], [980, 1020], [1140, 1080], [1140, 1300], [-60, 1300]]), { fill: '#c8c2a6', lw: 2.6, hgap: 9, halpha: 0.2 });
  // aqueduct-like arches far
  S(rectP(-40, 1060, 420, 30), { fill: C.stoneL, lw: 2.4, hatch: false });
  for (let i = 0; i < 7; i++) S(rectP(-30 + i * 60, 1090, 14, 110), { fill: C.stoneL, lw: 2, hatch: false });
  // campanile
  S(rectP(800, 640, 110, 680), { fill: '#c7a98a', lw: 3.2, hgap: 7, light: true });
  S([[790, 645], [855, 540], [920, 645]], { fill: C.terra, lw: 3, hgap: 6 });
  for (let r = 0; r < 4; r++) { S(archP(818, 690 + r * 140, 30, 70), { fill: C.ink, lw: 2, alpha: 0.75, hatch: false }); S(archP(862, 690 + r * 140, 30, 70), { fill: C.ink, lw: 2, alpha: 0.75, hatch: false }); }
  // basilica facade
  S(rectP(160, 860, 420, 460), { fill: C.stoneL, lw: 3.2, hgap: 7, light: true });
  S([[140, 870], [370, 720], [600, 870]], { fill: C.terra, lw: 3.2, hgap: 6 });
  S(ell(370, 960, 48, 48, 24), { fill: C.burgD, lw: 3, hgap: 6 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; L([[370, 960], [370 + Math.cos(a) * 46, 960 + Math.sin(a) * 46]], { lw: 2.2, stroke: C.gold, amp: 0.5 }); }
  for (const ax of [200, 330, 460]) S(archP(ax, 1080, 80, 240), { fill: C.stoneDD, lw: 2.8, hgap: 6 });
  // houses
  const hs = [[-30, 1000, 170, 'B'], [600, 960, 190, 'A'], [930, 980, 170, 'B'], [1000, 1040, 110, 'A']];
  for (const [x, y, w, k] of hs) {
    S(rectP(x, y, w, 1340 - y), { fill: k === 'A' ? '#d6c09a' : '#c9b08c', lw: 3, hgap: 7 });
    S([[x - 14, y + 4], [x + w / 2, y - 60], [x + w + 14, y + 4]], { fill: C.terra, lw: 3, hgap: 6 });
    S(archP(x + w * 0.3, y + 70, w * 0.16, 70), { fill: C.ink, lw: 2, alpha: 0.7, hatch: false });
    S(archP(x + w * 0.6, y + 70, w * 0.16, 70), { fill: C.ink, lw: 2, alpha: 0.7, hatch: false });
  }
  // street
  S(rectP(-60, 1330, 1200, 700), { fill: '#a99474', lw: 3, hgap: 8, halpha: 0.25 });
  for (let r = 0; r < 9; r++) { const y = 1350 + r * r * 9 + r * 20; L([[-60, y], [1140, y]], { lw: 2, salpha: 0.2, amp: 2 }); }
  SEED = old;
}

const CROWD_COLS = [C.robeBrown, C.olive, C.slate, C.terra, C.robeGray, C.plum, C.brownL, C.blueGray];
const HAIR = ['#4a3528', '#6b4b33', '#2f2a2a', '#8a6d4f', '#5d4637'];
function crowdRow(t, y, s, xs, seed, agit = 1, darken = 0) {
  xs.forEach((x, i) => {
    const h = hash(i * 4.1 + seed);
    const poses = ['raise', 'raise2', 'shock', 'open', 'down', 'mouth', 'raise'];
    const p = poses[Math.floor(hash(i * 2.9 + seed) * poses.length)];
    const active = hash(i * 6.3 + seed) < agit;
    const robe = darken ? mix(CROWD_COLS[i % CROWD_COLS.length], '#3a3150', darken) : CROWD_COLS[(i + Math.floor(seed)) % CROWD_COLS.length];
    figure({ x, y: y + Math.abs(Math.sin(t * 5 + i)) * -6 * (active ? 1 : 0), s: s * (0.92 + h * 0.16), dir: x < 540 ? 1 : -1, robe, hat: h < 0.3 ? 'hood' : 'hair', hoodCol: robe, hair: HAIR[i % HAIR.length],
      pose: active ? p : 'down', expr: active ? 'shock' : 'worry', mouth: active ? 'talk' : 'line', eyes: active ? 'wide' : 'dot', ph: i * 1.3 + seed, sway: 2.5, noShadow: true, seed: i * 7 + seed, skin: darken ? mix(C.skin, '#5b4f6e', darken) : C.skin, look: 0.6 });
  });
}

// illuminated manuscript transformation over the scene buffer
function illuminate(k, t) {
  if (k <= 0) return;
  const c = CTX;
  const win = archP(120, 560, 840, 1170);
  // margins
  alphaDo(clamp(k * 1.4), () => {
    c.save();
    c.beginPath(); c.rect(-20, 300, 1120, 1700);
    const D = jit(densify(win, true, 14), 1.2);
    c.moveTo(D[0][0], D[0][1]); for (let i = D.length - 1; i >= 0; i--) c.lineTo(D[i][0], D[i][1]); c.closePath();
    c.fillStyle = '#e8d6ab'; c.fill('evenodd');
    c.restore();
    // vines in margins
    const old = SEED; SEED = 71;
    const vine = (P, col) => { const Q = cr(P, false, 8); const n = Math.floor(Q.length * clamp(k * 1.3 - 0.1)); if (n > 2) L(Q.slice(0, n), { lw: 4.5, stroke: col, amp: 0.8 }); return Q.slice(0, n); };
    const v1 = vine([[60, 1820], [40, 1600], [80, 1400], [44, 1180], [84, 960], [48, 760], [92, 600]], C.burg);
    const v2 = vine([[1020, 1820], [1040, 1600], [1000, 1400], [1036, 1180], [996, 960], [1032, 760], [988, 600]], '#3f5a8a');
    for (const V of [v1, v2]) for (let i = 6; i < V.length; i += 9) { S(ell(V[i][0] + (i % 2 ? 16 : -16), V[i][1], 13, 7, 10), { fill: i % 3 ? '#7f9a5a' : C.burgL, lw: 2, amp: 0.4, hatch: false }); c.fillStyle = C.gold; c.beginPath(); c.arc(V[i][0] + (i % 2 ? -14 : 14), V[i][1] + 10, 5, 0, 7); c.fill(); }
    // bottom band ornaments
    for (let i = 0; i < 9; i++) { const x = 180 + i * 90; if (i / 9 < k * 1.2 - 0.2) S(ell(x, 1800, 12, 12, 12), { fill: i % 2 ? C.gold : C.burg, lw: 2.2, amp: 0.4, hatch: false }); }
    SEED = old;
  });
  // gold frame drawing in
  const D = densify(win, true, 10); const n = Math.floor(D.length * clamp(k * 1.25));
  if (n > 2) {
    const P = D.slice(0, n);
    L(P, { lw: 26, stroke: C.goldD, amp: 1.2, salpha: 0.95 });
    L(P, { lw: 16, stroke: C.gold, amp: 1.2, salpha: 0.95 });
    L(P, { lw: 5, stroke: C.goldL, amp: 1.2, salpha: 0.9 });
    for (let i = 0; i < n; i += 9) { c.fillStyle = C.burg; c.beginPath(); c.arc(P[i][0], P[i][1], 4, 0, 7); c.fill(); }
  }
  // corner rosettes
  for (const [x, y] of [[120, 1730], [960, 1730]]) alphaDo(seg(k, 0.6, 0.9), () => { S(ell(x, y, 36, 36, 20), { fill: C.burg, lw: 3, amp: 0.6 }); S(ell(x, y, 18, 18, 14), { fill: C.gold, lw: 2.4, amp: 0.4, hatch: false }); });
  // warm parchment tint inside
  alphaDo(k * 0.28, () => { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#e3c58e'; c.fillRect(0, 300, 1080, 1700); c.restore(); });
}
