// ---------- scenes ----------
const SC = TL.SCENES;
const rel = (abs, i) => abs - SC[i];
function drift(a = 5) { ctx.translate(Math.sin(T * 0.5) * a, Math.cos(T * 0.37) * a * 0.8); }
function shake(amp) { if (amp > 0) ctx.translate((h1(BOIL * 3.1 + T) - 0.5) * amp * 2, (h1(BOIL * 5.7 + T * 2) - 0.5) * amp * 2); }
function zoomAt(cx, cy, z) { ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); }
function flashSum(list, i, u, dur = 0.25) { let s = 0; for (const e of list) { const a = u - rel(e[0] ?? e, i); if (a >= 0 && a < dur) s += 1 - a / dur; } return clamp(s); }
function moon(x, y, r, al = 1) { glowAt(x, y, r * 4, '230,226,200', 0.25 * al); ctx.save(); ctx.globalAlpha = al; shape(ell(x, y, r, r, 18, 1), '#efe7c8', 1, 2.5, '#b9b49a', 0.3); ctx.restore(); }
function ground(y, col = '#151931', y1 = 2600) { fillP(R(-300, y, W + 600, y1 - y, 1), col, 1, 0.5); }
function hills(y, col, seed = 2, amp = 60) { const r = mulberry(seed); const pts = [[-300, 2600], [-300, y]]; for (let x = -300; x <= W + 300; x += 120) pts.push([x, y - r() * amp]); pts.push([W + 300, y], [W + 300, 2600]); fillP(PS(pts, true, 1.5), col, 1, 0.5); }

// ===== A: HOOK =====
const A_BASES = [80, 250, 430, 650, 840, 1010], A_ANG = [0.40, 0.16, -0.06, 0.12, -0.20, -0.42];
function sA(u) {
  const camY = 720 * ease(seg(u, 1.85, 3.5)) + 60 * ease(seg(u, 4.5, 8.6));
  ctx.save(); drift(4); ctx.translate(0, camY);
  nightSky(-1800, 2300);
  stars(70, -1600, 1000, 0.55, 4);
  const conv = ease(seg(u, 4.6, 7.6)), by = 1650;
  A_BASES.forEach((bx, i) => {
    const a0 = A_ANG[i] + 0.13 * Math.sin(T * 0.6 + i * 1.7);
    const tg = Math.atan2(540 - bx, by - 60) + 0.035 * Math.sin(T * 0.9 + i);
    beam(bx, by, lerp(a0, tg, conv), 2900, 16, 175, 1);
  });
  TL.A_FLAK.forEach(([t, x, y, s], i) => flak(x, y, u - t, s * 1.15, 1, i));
  TL.A_MUZZLE.forEach(([t, x], i) => tracer(x, 1560, x + (540 - x) * 0.45, -500, (u - t) / 1.0, 0.95));
  skyline(1720, { col: '#232742', lit: () => 0 });
  ground(1715, '#141830');
  palm(70, 1730, 230); palm(1010, 1730, 260);
  TL.A_MUZZLE.forEach(([t, x]) => { const a = u - t; if (a >= 0 && a < 0.3) glowAt(x, 1580, 220, '242,170,90', 1 - a / 0.3); });
  ctx.restore();
}

// ===== B: PEARL HARBOR -> COAST ON ALERT =====
function harborPic(x, y, w, h) {
  ctx.fillStyle = '#cfc8b4'; ctx.fillRect(x, y, w, h);
  const wy = y + h * 0.68;
  fillP(R(x - 10, wy, w + 20, h, 1), '#8f9aa0', 1, 0.6);
  // smoke columns (non-graphic)
  [[0.25, 0.9], [0.55, 1.2], [0.8, 0.8]].forEach(([fx, s], i) => {
    const p = new Path2D(); for (let k = 0; k < 6; k++) { const yy = wy - 20 - k * h * 0.11 * s, rr = (16 + k * 7) * s; p.addPath(ell(x + w * fx + Math.sin(k + T + i) * 6 + k * 6, yy, rr, rr * 0.8, 12, 1.2)); }
    fillP(p, '#4c4f5c', 0.85, 0.7);
  });
  // ship silhouettes
  [[0.12, 0.34], [0.46, 0.4], [0.74, 0.3]].forEach(([fx, fw]) => {
    const sx = x + w * fx, sw = w * fw;
    shape(P([[sx, wy - 6], [sx + sw, wy - 6], [sx + sw * 0.92, wy + 10], [sx + sw * 0.06, wy + 10]], true, 1), '#3c4152', 1, 2.5);
    shape(R(sx + sw * 0.3, wy - 30, sw * 0.35, 24, 1), '#3c4152', 1, 2.5);
    strokeLine(sx + sw * 0.4, wy - 30, sx + sw * 0.4, wy - 62, 3); strokeLine(sx + sw * 0.6, wy - 30, sx + sw * 0.6, wy - 54, 3);
  });
}
const COAST = [[560, 470], [548, 560], [530, 640], [520, 700], [540, 760], [560, 820], [575, 880], [600, 940], [612, 1000], [640, 1060], [680, 1120], [700, 1170], [690, 1210], [730, 1240], [800, 1268], [860, 1300], [900, 1350], [925, 1420], [950, 1500], [975, 1580], [1000, 1660], [1010, 1760], [1020, 1900]];
function caMap(k, alert, al = 1) {
  ctx.save(); ctx.globalAlpha = al;
  const sea = [[-50, 380], ...COAST, [-50, 1980]], land = [[1150, 380], ...COAST, [1150, 1980]];
  fillP(P(sea, true, 1.5), C.mapsea, 1, 0.75);
  fillP(P(land, true, 1.5), C.land, 1, 0.6);
  // grid
  ctx.save(); ctx.globalAlpha = al * 0.25; ctx.strokeStyle = C.navy; ctx.lineWidth = 1.5;
  for (let x = 100; x < W; x += 180) { ctx.beginPath(); ctx.moveTo(x, 430); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 520; y < H; y += 180) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
  const n = Math.max(2, Math.floor(COAST.length * k)); line(PS(COAST.slice(0, n), false, 1.5), 5, C.navy, 1);
  // waves marks
  for (let i = 0; i < 14; i++) { const wx = 80 + (i % 4) * 120 + (i > 7 ? 60 : 0), wy = 700 + Math.floor(i / 4) * 230; line(PS([[wx, wy], [wx + 18, wy - 8], [wx + 36, wy], [wx + 54, wy - 8]], false, 1), 2.5, '#4e6577', 0.7); }
  // alert rings along the coast
  if (alert > 0) [[548, 600], [690, 1200], [900, 1350], [1000, 1660]].forEach(([x, y], i) => {
    for (let r = 0; r < 2; r++) { const ph = (T * 0.8 + i * 0.25 + r * 0.5) % 1; ctx.save(); ctx.globalAlpha = alert * (1 - ph) * 0.9; ctx.strokeStyle = C.red; ctx.lineWidth = 5; ctx.stroke(ell(x, y, 20 + ph * 90, 20 + ph * 90, 18, 1.5)); ctx.restore(); }
    shape(ell(x, y, 11, 11, 10, 1), C.red, alert, 2);
  });
  ctx.restore();
}
function sB(u) {
  paperBG();
  const mapK = ease(seg(u, 2.4, 3.6));
  if (mapK > 0) { ctx.save(); drift(3); caMap(easeOut(seg(u, 2.5, 4.0)), seg(u, 3.4, 3.9), mapK); ctx.restore(); }
  const nf = 1 - ease(seg(u, 0, 0.9));
  if (nf > 0) { ctx.save(); nightSky(-200, 2200, C.sky1, C.sky2, nf); ctx.restore(); }
  ctx.save(); drift(3);
  const sheets = [
    { f: [380, 900], to: [270, 900], r: -0.14, w: 560, h: 720, d: 0.0 },
    { f: [700, 820], to: [820, 1150], r: 0.12, w: 560, h: 720, d: 0.12 },
    { f: [540, 1150], to: [540, 1080], r: -0.035, w: 780, h: 1000, d: 0.24, main: 1 }];
  const away = ease(seg(u, 2.5, 3.6));
  sheets.forEach((s, i) => {
    const k = easeOut(seg(u, 0.05 + s.d, 1.05 + s.d));
    if (k <= 0) { flak(s.f[0], s.f[1], 0.6 + u, 1.2, nf, i); return; }
    let x = lerp(s.f[0], s.to[0], k), y = lerp(s.f[1], s.to[1], k), sc = lerp(0.07, 1, k), r = lerp(s.r + 2.4, s.r, k), al = 1;
    if (s.main) { x = lerp(x, 250, away); y = lerp(y, 800, away); sc *= lerp(1, 0.4, away); r = lerp(r, -0.09, away); }
    else { x += (i ? 900 : -900) * easeIn(seg(u, 2.3, 3.2)); }
    if (k < 0.3) flak(s.f[0], s.f[1], 0.6 + u, 1.2, nf * (1 - k / 0.3), i);
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    newspaper(0, 0, s.w, s.h, r + Math.sin(T * 0.7 + i) * 0.01, { pic: s.main ? harborPic : (px, py, pw, ph) => { ctx.fillStyle = '#bdb6a2'; ctx.fillRect(px, py, pw, ph); fillP(ell(px + pw / 2, py + ph / 2, pw * 0.3, ph * 0.3), '#6d6a64', 1, 0.6); }, headline: s.main ? 2 : 1 });
    ctx.restore();
  });
  ctx.restore();
}

// ===== C: I-17 SHELLS ELLWOOD (context, restrained) =====
function sub(x, y, s, gunFlash = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const col = '#3a3e52';
  shape(PS([[-280, 0], [-240, -20], [-120, -28], [120, -28], [240, -16], [300, 0], [240, 16], [-230, 16]], true, 1.4), col, 1, 3.5, '#10121f');
  shape(P([[-70, -26], [-58, -105], [42, -105], [64, -26]], true, 1.2), col, 1, 3.5, '#10121f');
  strokeLine(-30, -105, -30, -150, 4, '#10121f'); strokeLine(-10, -105, -8, -135, 3, '#10121f');
  shape(R(118, -46, 22, 20, 1), col, 1, 3, '#10121f');
  ctx.save(); ctx.translate(130, -44); ctx.rotate(-0.32); shape(R(0, -5, 90, 10, 1), col, 1, 3, '#10121f');
  if (gunFlash > 0) { glowAt(110, 0, 90 * gunFlash + 10, '255,190,110', gunFlash); }
  ctx.restore(); ctx.restore();
}
function derrick(x, y, h) {
  const p = P([[x - h * 0.22, y], [x, y - h], [x + h * 0.22, y]], false, 1);
  line(p, 3, '#151829', 1); strokeLine(x - h * 0.15, y - h * 0.3, x + h * 0.15, y - h * 0.3, 2, '#151829'); strokeLine(x - h * 0.08, y - h * 0.62, x + h * 0.08, y - h * 0.62, 2, '#151829');
}
function sC(u) {
  ctx.save(); drift(4); zoomAt(540, 1150, 1 + 0.04 * u / 7.85);
  nightSky(-300, 1300, '#0e132d', '#2c3460');
  stars(50, 450, 1100, 0.5, 9);
  moon(250, 640, 34);
  // distant coast (right)
  fillP(PS([[600, 1240], [660, 1200], [760, 1170], [900, 1150], [1000, 1120], [1200, 1110], [1200, 1260]], true, 1.2), '#1b1f37', 1, 0.5);
  [790, 840, 905, 960, 1015].forEach((x, i) => derrick(x, 1185 - i * 6, 64 + (i % 2) * 14));
  shape(ell(880, 1186, 26, 9, 12, 1), '#1b1f37', 1, 2, '#0f1222'); shape(ell(1050, 1166, 24, 8, 12, 1), '#1b1f37', 1, 2, '#0f1222');
  // ocean
  fillP(R(-300, 1215, W + 600, 1200, 1), C.ocean, 1, 0.7);
  glowAt(250, 1300, 160, '220,215,190', 0.12);
  for (let i = 0; i < 26; i++) { const r = mulberry(i + 40); const wx = ((r() * 1300 + T * 22 * (0.5 + r())) % 1300) - 100, wy = 1240 + r() * 650; line(PS([[wx, wy], [wx + 24, wy - 7], [wx + 48, wy]], false, 0.8), 2.5, '#5e7590', 0.55); }
  // shells
  TL.C_SHOTS.forEach((abs, i) => {
    const a = u - rel(abs, 2); if (a < 0) return;
    const x0 = 690, y0 = 1170, x1 = 940 + i * 45, y1 = 1165, k = a / 1.3;
    if (k < 1) {
      for (let j = 0; j < 14; j++) { const q = k - j * 0.03; if (q < 0) break; const qx = lerp(x0, x1, q), qy = lerp(y0, y1, q) - Math.sin(q * Math.PI) * 230; ctx.fillStyle = `rgba(255,200,130,${0.9 - j * 0.06})`; ctx.beginPath(); ctx.arc(qx, qy, j ? 2.5 : 5, 0, 7); ctx.fill(); }
    } else { const b = a - 1.3; glowAt(x1, y1, 70, '242,150,70', clamp(1 - b / 0.6)); flak(x1, y1 - 10, b, 0.45, 0.8, i + 50); }
  });
  // submarine surfacing
  const k = easeOut(seg(u, 0.2, 2.6)); const sy = 1262 + lerp(70, 0, k) + Math.sin(T * 1.4) * 3;
  const gf = Math.max(0, ...TL.C_SHOTS.map(a => { const d = u - rel(a, 2); return d >= 0 && d < 0.25 ? 1 - d / 0.25 : 0; }));
  sub(380, sy, 1.35, gf);
  // water line in front of the hull
  fillP(R(-300, 1262, W + 600, 900, 1), C.ocean, 0.92, 0.6);
  for (let i = 0; i < 6; i++) { const wx = 180 + i * 72 + Math.sin(T * 2 + i) * 6; line(PS([[wx, 1268], [wx + 20, 1262], [wx + 40, 1268]], false, 0.8), 3, '#c9d4dc', 0.7 * (1 - seg(u, 2.0, 4.0) * 0.6)); }
  ctx.restore();
}

// ===== D: EVERYONE EXPECTS ANOTHER ATTACK =====
function wallClock(x, y, r, t) {
  shape(ell(x, y, r, r, 20, 1), '#efe4c8', 1, 4);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; strokeLine(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, 2.5); }
  const sec = Math.floor(t * 2) / 2, m = 24 + sec / 60 * 4, hA = (2 + m / 60) / 12 * 6.283 - 1.5708, mA = m / 60 * 6.283 - 1.5708, sA_ = sec * 6.283 / 60 * 6 - 1.5708;
  strokeLine(x, y, x + Math.cos(hA) * r * 0.5, y + Math.sin(hA) * r * 0.5, 6); strokeLine(x, y, x + Math.cos(mA) * r * 0.75, y + Math.sin(mA) * r * 0.75, 4);
  strokeLine(x, y, x + Math.cos(sA_) * r * 0.8, y + Math.sin(sA_) * r * 0.8, 2, C.red);
}
function sD(u) {
  ctx.save(); drift(4);
  const tilt = 70 * ease(seg(u, 3.0, 4.6)); ctx.translate(0, tilt);
  nightSky(-400, 1800);
  [[220, 0.25], [760, -0.2], [980, -0.5]].forEach(([x, a], i) => beam(x, 1500, a + 0.25 * Math.sin(T * 0.4 + i * 2), 1700, 12, 120, 0.55));
  // facade
  shape(R(-40, 520, 600, 1100, 1.6), '#3a3150', 1, 4, '#16152a', 0.6);
  const look = [0, -4 * ease(seg(u, 2.8, 3.6))];
  // window
  ctx.save(); const win = R(90, 760, 380, 360); fillP(win, '#f0c77a', 1, 0.35); ctx.clip(win);
  glowAt(280, 940, 260, '255,220,150', 0.5);
  fillP(R(80, 1030, 400, 30), '#6b4630', 1, 0.6);
  radio(370, 1030, 0.75, Math.sin(T * 9) * 0.25 + 0.5);
  soundArcs(370, 920, 1, T, '#7a4b2e', 0.6, -1.57);
  person(180, 1200, 1.05, { col: '#5a4a6a', hair: '#3a2a20', look, worried: 1, arm: 'radio' });
  person(275, 1210, 0.72, { col: '#a05a4a', hair: '#6b4a2a', look, worried: 1 });
  ctx.restore();
  line(win, 6, '#16152a'); strokeLine(280, 760, 280, 1120, 5, '#16152a'); strokeLine(90, 940, 470, 940, 5, '#16152a');
  // curtains drawn halfway
  fillP(P([[90, 760], [150, 760], [140, 1120], [90, 1120]]), '#2b2442', 1, 0.6); fillP(P([[410, 760], [470, 760], [470, 1120], [420, 1120]]), '#2b2442', 1, 0.6);
  wallClock(440, 640, 62, T);
  // ground / street
  ground(1560, '#1a1d36');
  shape(R(-40, 1560, 1200, 30, 1), '#2b2f4c', 1, 3);
  // warden
  person(810, 1580, 1.55, { col: '#3f4a3a', helmet: 'warden', look: [0, -5 * ease(seg(u, 2.6, 3.4))], arm: u > 2.6 ? 'up' : 'down', worried: 1 });
  shape(ell(866, 1452, 18, 7, 10, 1), '#e7e2cf', 1, 2.5); // armband
  // newspaper on the street
  newspaper(930, 1640 + Math.sin(T * 3) * 2, 220, 280, 0.35 + Math.sin(T * 2) * 0.03, { headline: 1 });
  // AA emplacement foreground
  aaGun(560, 1950, 1.05, 1.0, { col: C.green, dark: C.green2 });
  person(330, 1900, 1.25, { col: '#55603f', helmet: 'brodie', look: [3, -5 * ease(seg(u, 2.9, 3.7))] });
  person(780, 1910, 1.25, { col: '#55603f', helmet: 'brodie', look: [-2, -5 * ease(seg(u, 3.1, 3.9))], flip: 1 });
  sandbags(40, 1905, 1050, 3);
  ctx.restore();
}

// ===== E: RADAR =====
function radarScope(cx, cy, r, ang, blips, o = {}) {
  shape(ell(cx, cy, r + 26, r + 26, 32, 1), '#2f342b', 1, 5, '#121510');
  ctx.save(); const scr = ell(cx, cy, r, r, 32, 0.8); ctx.fillStyle = '#0f1a10'; ctx.fill(scr); ctx.clip(scr);
  ctx.globalAlpha = 0.5; ctx.fillStyle = hatch('#1f3420'); ctx.fill(scr); ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(150,200,120,0.35)'; ctx.lineWidth = 2;
  for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, r * k / 3.3, 0, 7); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
  if (o.coast) { ctx.strokeStyle = 'rgba(170,215,130,0.75)'; ctx.lineWidth = 4; ctx.stroke(PS([[cx + r * 0.25, cy - r], [cx + r * 0.2, cy - r * 0.5], [cx + r * 0.32, cy], [cx + r * 0.45, cy + r * 0.4], [cx + r * 0.7, cy + r * 0.8], [cx + r * 0.8, cy + r]], false, 1.2)); }
  const g = ctx.createConicGradient(ang - 1.4, cx, cy);
  g.addColorStop(0, 'rgba(160,220,120,0)'); g.addColorStop(0.2228, 'rgba(160,220,120,0.45)'); g.addColorStop(0.223, 'rgba(160,220,120,0)'); g.addColorStop(1, 'rgba(160,220,120,0)');
  ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.strokeStyle = 'rgba(210,250,170,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); ctx.stroke();
  blips.forEach(([bx, by, br, bal]) => {
    const ba = Math.atan2(by - cy, bx - cx); let d = (ang - ba) % 6.283; if (d < 0) d += 6.283;
    const glow = Math.exp(-d * 1.1) * bal; glowAt(bx, by, br * 3.2, '200,250,150', glow); ctx.fillStyle = `rgba(225,255,190,${glow})`; ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill();
  });
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const gg = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.15); gg.addColorStop(0, 'rgba(120,180,100,0.10)'); gg.addColorStop(1, 'rgba(120,180,100,0)'); ctx.fillStyle = gg; ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4); ctx.restore();
}
function qMark(x, y, size, col, al = 1, outline = C.navy) {
  ctx.save(); ctx.globalAlpha = al; ctx.font = `700 ${size}px Caveat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = size * 0.06; ctx.strokeStyle = outline; ctx.lineJoin = 'round'; ctx.strokeText('?', x, y); ctx.fillStyle = col; ctx.fillText('?', x, y); ctx.restore();
}
function sE(u) {
  ctx.save(); drift(3); zoomAt(540, 1060, 1 + 0.06 * ease(seg(u, 0, 6.2)));
  fillP(R(-200, -200, W + 400, H + 400, 1), '#4a5240', 1, 0.7);
  // panel rivets & knobs
  for (let i = 0; i < 9; i++) { shape(ell(60 + i * 120, 470, 6, 6, 8, 0.6), '#30352a', 1, 2); shape(ell(60 + i * 120, 1700, 6, 6, 8, 0.6), '#30352a', 1, 2); }
  [[260, 1600], [540, 1610], [820, 1600]].forEach(([x, y], i) => { shape(ell(x, y, 44, 44, 16, 1), '#2b2f26', 1, 4); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(T * 0.7 + i) * 0.8); strokeLine(0, 0, 0, -36, 5, C.cream); ctx.restore(); });
  const ang = T * 6.283 / 2.4 - 1.57;
  const cx = 540, cy = 1060, r = 380;
  const bk = seg(u, 1.0, 5.9), bx = lerp(cx - r * 0.85, cx + r * 0.05, bk), by = lerp(cy - r * 0.15, cy + r * 0.02, bk);
  radarScope(cx, cy, r, ang, u > 1.0 ? [[bx, by, 9, 1]] : [], { coast: 1 });
  const q = easeOut(seg(u, 3.4, 3.9));
  if (q > 0) { ctx.save(); ctx.translate(bx + 30, by - 90); ctx.scale(q, q); qMark(0, 0, 170, C.yellow, 1, '#121510'); ctx.restore(); }
  // operator silhouette (foreground)
  person(110, 2110, 2.3, { col: '#202421', skin: '#7d6650', helmet: 'phones', look: [6, -2], lc: '#0d0f0c' });
  ctx.restore();
}

// ===== F: SIRENS =====
function siren(x, y, s, rot, on) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(R(-8, 0, 16, 260, 1), '#3c3f52', 1, 3);
  shape(R(-30, -18, 60, 22, 1), '#555a6e', 1, 3);
  const c = Math.cos(rot);
  shape(P([[-42 * c - 10, -24], [42 * c + 10, -24], [36 * c + 10, -80], [-36 * c - 10, -80]], true, 1), '#9c9a8c', 1, 3.5);
  shape(ell(0, -84, 40 * Math.abs(c) + 12, 10, 14, 1), '#7a786c', 1, 3);
  for (let i = -2; i <= 2; i++) strokeLine(i * 12 * c, -30, i * 12 * c, -74, 2.5, '#3c3f52', 0.7);
  ctx.restore();
  if (on > 0) { soundArcs(x - 60 * s, y - 50 * s, 2.2 * s, T, C.cream, 0.8 * on, Math.PI); soundArcs(x + 60 * s, y - 50 * s, 2.2 * s, T + 0.3, C.cream, 0.8 * on, 0); }
}
function curtainWindow(x, y, w, h, close, lit = 1) {
  const wp = R(x, y, w, h, 1.2);
  fillP(wp, lit > 0.05 ? '#f0c77a' : '#1b1d33', 1, 0.4);
  if (lit > 0.05) { ctx.save(); ctx.clip(wp); glowAt(x + w / 2, y + h / 2, w, '255,220,150', 0.4 * lit); ctx.restore(); }
  const cw = w / 2 * clamp(0.18 + close * 0.82);
  fillP(P([[x, y], [x + cw, y], [x + cw - 4, y + h], [x, y + h]], true, 1), '#2b2442', 1, 0.6);
  fillP(P([[x + w - cw, y], [x + w, y], [x + w, y + h], [x + w - cw + 4, y + h]], true, 1), '#2b2442', 1, 0.6);
  line(wp, 4, '#13122a');
}
function sF(u) {
  ctx.save(); drift(4); shake(1.5);
  nightSky(-300, 1700);
  stars(30, 450, 900, 0.4, 12);
  // buildings left & right
  shape(R(-40, 700, 380, 1000), '#3b3152', 1, 4, '#13122a');
  shape(R(740, 640, 400, 1060), '#2f3550', 1, 4, '#13122a');
  shape(R(330, 980, 420, 720), '#352f4a', 1, 4, '#13122a');
  const wins = [[20, 780], [180, 780], [20, 980], [180, 980], [20, 1180], [180, 1180], [800, 720], [960, 720], [800, 920], [960, 920], [800, 1120], [960, 1120], [380, 1060], [560, 1060], [380, 1250], [560, 1250]];
  wins.forEach(([x, y], i) => { const c0 = 0.9 + h1(i * 3.3) * 2.6, cl = ease(seg(u, c0, c0 + 0.7)); curtainWindow(x, y, 120, 140, cl, 1 - cl * 0.85); });
  siren(560, 760, 1.7, T * 7, ease(seg(u, 0.1, 0.5)));
  ground(1560, '#1b1e36'); shape(R(-40, 1560, 1200, 34, 1), '#2b2f4c', 1, 3);
  // car stopping
  const cx = lerp(-260, 420, easeOut(seg(u, 0, 2.2)));
  ctx.save(); ctx.translate(cx, 1690);
  shape(PS([[-150, 0], [-150, -50], [-90, -60], [-60, -110], [60, -110], [100, -60], [160, -50], [160, 0]], true, 1.2), '#2c2a3a', 1, 4, '#0f0e1c');
  shape(ell(-90, 0, 32, 32, 14, 1), '#151423', 1, 3); shape(ell(100, 0, 32, 32, 14, 1), '#151423', 1, 3);
  ctx.restore();
  // pedestrians stop & look up
  [[640, 1820, 1.35, 0.6, '#5a4a6a'], [830, 1830, 1.45, 0.9, '#3f4a3a'], [1000, 1815, 1.3, 1.2, '#6a4a3a']].forEach(([x, y, s, lt, col], i) => {
    const lu = ease(seg(u, lt, lt + 0.6));
    person(x + (1 - lu) * 30 * Math.sin(T * 6 + i), y, s, { col, hair: '#2a2020', look: [0, -5 * lu], worried: lu > 0.5 ? 1 : 0, arm: i === 1 && lu > 0.5 ? 'point' : 'down' });
  });
  ctx.restore();
}

// ===== G: BLACKOUT =====
function lamp(x, y, on) {
  strokeLine(x, y, x, y - 230, 6, '#11132a'); strokeLine(x, y - 230, x + 40, y - 240, 5, '#11132a');
  shape(ell(x + 44, y - 236, 12, 8, 10, 1), on > 0.05 ? '#ffe7a8' : '#2a2c40', 1, 2.5, '#11132a');
  if (on > 0.05) { glowAt(x + 44, y - 230, 160, '255,226,150', 0.55 * on); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,226,150,${0.12 * on})`; ctx.beginPath(); ctx.moveTo(x + 36, y - 228); ctx.lineTo(x - 30, y); ctx.lineTo(x + 120, y); ctx.lineTo(x + 52, y - 228); ctx.fill(); ctx.restore(); }
}
function sG(u) {
  ctx.save(); drift(3); zoomAt(540, 1300, 1 + 0.03 * u / 2.5);
  const dark = ease(seg(u, 0.3, 2.0));
  nightSky(-300, 2000, '#121733', '#2c3260');
  moon(820, 640, 40, ease(seg(u, 1.4, 2.2)));
  stars(60, 430, 1100, 0.15 + 0.5 * dark, 21);
  const off = (bi, i, k, hh) => { const to = 0.25 + h1(bi * 7.1 + i * 1.3 + k * 0.7) * 1.55; return u < to ? 1 : clamp(1 - (u - to) / 0.06); };
  // glow over the city before blackout
  glowAt(540, 1400, 700, '242,200,120', 0.28 * (1 - dark));
  skyline(1640, { col: '#262a46', lit: off });
  // rooftop sign
  const signOn = u < 1.0 ? 1 : clamp(1 - (u - 1.0) / 0.08);
  shape(R(780, 1130, 180, 70, 1), signOn > 0.05 ? '#f2a64a' : '#2c2a3a', 1, 4, '#13122a', 0.4);
  if (signOn > 0.05) { glowAt(870, 1165, 200, '242,166,74', 0.6 * signOn); for (let i = 0; i < 4; i++) strokeLine(800 + i * 40, 1150, 820 + i * 40, 1180, 5, '#fff0c8', signOn); }
  ground(1635, '#151831');
  [90, 330, 570, 810, 1040].forEach((x, i) => { const to = 1.2 + i * 0.1; lamp(x, 1880, u < to ? 1 : clamp(1 - (u - to) / 0.06)); });
  ctx.restore();
}

// ===== H: GUNS OPEN FIRE =====
function sH(u) {
  const fg = flashSum(TL.H_SHOTS.filter(s => s[1] === 0).map(s => s[0]), 7, u, 0.3);
  ctx.save(); drift(3); shake(fg * 10);
  nightSky(-300, 1500);
  stars(40, 420, 1000, 0.5, 31);
  [[150, 0.35], [520, -0.1], [930, -0.4]].forEach(([x, a], i) => beam(x, 1260, a + 0.2 * Math.sin(T * 0.5 + i * 2), 1800, 12, 140, 0.8));
  // background batteries on a ridge
  hills(1270, '#1d2140', 5, 50);
  const bat = [[200, 1262], [520, 1250], [860, 1262]];
  bat.forEach(([x, y], i) => {
    const fl = flashSum(TL.H_SHOTS.filter(s => s[1] === i + 1).map(s => s[0]), 7, u, 0.25);
    aaGun(x, y, 0.32, 1.0, { flash: fl, col: '#3a4232', dark: '#2a3024', lc: '#0e1020' });
    if (fl > 0) glowAt(x + 60, y - 120, 260, '242,160,80', fl * 0.7);
  });
  TL.H_SHOTS.forEach(([t, b], i) => { if (b === 0) return; const [x, y] = bat[b - 1]; tracer(x + 50, y - 110, x + 50 + 300 * (b - 2), y - 1400, (u - rel(t, 7)) / 0.8); });
  ground(1340, '#171a33');
  // foreground gun
  const elev = lerp(0.22, 0.95, ease(seg(u, 0.15, 1.9)));
  let rec = 0; TL.H_SHOTS.forEach(([t, b]) => { if (b) return; const a = u - rel(t, 7); if (a >= 0 && a < 0.5) rec = Math.max(rec, Math.sin(clamp(a / 0.5) * Math.PI) * (a < 0.08 ? a / 0.08 : 1)); });
  sandbags(-20, 1905, 1150, 2, '#6f6448');
  aaGun(400, 1800, 1.55, elev, { flash: fg, recoil: rec });
  const tipX = 400 + Math.cos(elev) * 318 * 1.55, tipY = 1800 - 84 * 1.55 - Math.sin(elev) * 318 * 1.55;
  TL.H_SHOTS.forEach(([t, b], i) => { if (b) return; const a = u - rel(t, 7); tracer(tipX, tipY, tipX + Math.cos(elev) * 1600, tipY - Math.sin(elev) * 1600, a / 0.7); flak(tipX + 20, tipY - 10, a - 0.05, 1.0, 0.6, i + 70); });
  if (fg > 0) glowAt(tipX, tipY, 520, '242,160,80', fg * 0.55);
  person(880, 1880, 1.45, { col: '#55603f', helmet: 'brodie', arm: u > 1.9 ? 'ears' : 'down', look: [0, -4], flip: 1 });
  person(120, 1900, 1.4, { col: '#55603f', helmet: 'brodie', look: [4, -3] });
  ctx.restore();
}

// ===== I: ICONIC SEARCHLIGHT CONVERGENCE =====
const I_BASES = [-60, 100, 240, 380, 520, 660, 800, 940, 1120];
function sI(u) {
  ctx.save(); drift(3); zoomAt(540, 760, 1 + 0.08 * ease(seg(u, 0, 7.4)));
  nightSky(-300, 2000, '#0f132c', '#262c55');
  stars(40, 400, 1200, 0.35, 41);
  const cx = 540 + Math.sin(T * 0.4) * 25, cy = 760 + Math.cos(T * 0.33) * 15;
  I_BASES.forEach((bx, i) => { const by = 1560, a = Math.atan2(cx - bx, by - cy) + 0.025 * Math.sin(T * 0.9 + i * 1.3); const d = Math.hypot(cx - bx, by - cy); beam(bx, by, a, d * 1.45, 14, 130, ease(seg(u, i * 0.06, 0.3 + i * 0.06)) * 0.95 + 0.05); });
  // haze from accumulated smoke
  glowAt(cx, cy, 380, '150,150,170', 0.12 * ease(seg(u, 1, 6)));
  TL.I_FLAK.forEach(([t, x, y, s], i) => flak(x, y, u - rel(t, 8), s * 1.05, 1, i + 100));
  // distant tracers
  for (let i = 0; i < 16; i++) { const t0 = i * 0.46 + 0.1, x = 100 + (i * 173) % 880; tracer(x, 1520, x + (cx - x) * 0.7, cy + 80, (u - t0) / 0.8, 0.8); }
  skyline(1640, { col: '#1f2340', lit: () => 0 });
  ground(1635, '#12152b');
  palm(160, 1650, 200); palm(930, 1650, 230);
  ctx.restore();
}

// ===== J: 1,400+ SHELLS =====
const CASINGS = (() => { const r = mulberry(1400), a = []; for (let i = 0; i < 320; i++) { const k = i / 320; const x = 40 + r() * 470, h = 260 * Math.sqrt(k + 0.02); a.push([x, r(), r() * 3.1, k]); } return a; })();
function casing(x, y, rot, s = 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); shape(R(-8, -24, 16, 48, 0.8), C.brass, 1, 2.2, '#4a3a1c', 0.4); ctx.fillStyle = 'rgba(255,240,190,0.55)'; ctx.fillRect(-4, -20, 3, 36); ctx.restore(); }
function sJ(u) {
  const fl = flashSum(TL.J_FLAK.map(e => e[0]), 9, u, 0.22);
  ctx.save(); drift(3); shake(4 + fl * 6 + 4 * seg(u, 0, 4.8));
  nightSky(-300, 2000, '#120f2a', '#2a2a55');
  [[100, 0.4], [330, 0.1], [740, -0.15], [980, -0.4]].forEach(([x, a], i) => beam(x, 1560, a + 0.18 * Math.sin(T * 0.9 + i), 1900, 12, 120, 0.8));
  TL.J_TRACERS.forEach(([t, x, dx], i) => tracer(x, 1560, x + dx * 1500, -200, (u - rel(t, 9)) / 0.65, 0.9));
  TL.J_FLAK.forEach(([t, x, y, s], i) => flak(x, y, u - rel(t, 9), s * 0.85, 0.8, i + 300));
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(242,150,70,${0.16 * fl})`; ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
  skyline(1640, { col: '#232542', lit: () => 0 });
  ground(1635, '#14162d');
  // pile of casings growing
  const n = Math.floor(30 + 290 * ease(seg(u, 0, 4.7)));
  const hgt = 60 + 240 * ease(seg(u, 0, 4.7));
  fillP(PS([[-40, 1960], [-40, 1920 - hgt * 0.8], [150, 1920 - hgt], [380, 1920 - hgt * 0.7], [600, 1960]], true, 2), '#8a6d33', 1, 0.7);
  for (let i = 0; i < n; i++) { const [x, a, rot, k] = CASINGS[i]; const yy = 1935 - hgt * (1 - Math.abs(x - 170) / 520) * (0.15 + a * 0.85); casing(x, yy, rot, 0.95); }
  // casings falling in
  for (let i = 0; i < 6; i++) { const ph = (u * 1.8 + i / 6) % 1, x = 520 - ph * 260 + i * 12, y = 1500 + ph * ph * 300; casing(x, y, ph * 9 + i, 1); }
  ctx.restore();
}

// ===== K: PEOPLE BELIEVE IT IS AN ATTACK =====
function sK(u) {
  const fl = flashSum(TL.K_BOOMS, 10, u, 0.45);
  const camX = -640 * ease(seg(u, 2.6, 4.9));
  ctx.save(); drift(3); shake(fl * 2); ctx.translate(camX, 0);
  // room
  fillP(R(-200, -200, 1300, 2400, 1), '#2e2840', 1, 0.7);
  // window to the night
  const win = R(250, 520, 560, 520, 1.5);
  ctx.save(); ctx.clip(win);
  nightSky(400, 1100, '#0e1230', '#2a2f5a');
  [[330, 0.3], [600, -0.1], [760, -0.4]].forEach(([x, a], i) => beam(x, 1100, a + 0.2 * Math.sin(T * 0.6 + i), 900, 8, 90, 0.9));
  TL.K_BOOMS.forEach((t, i) => flak(320 + (i * 137) % 420, 620 + (i * 89) % 260, u - rel(t, 10), 0.8, 1, i + 500));
  ctx.save(); ctx.translate(250, 1040); ctx.scale(0.52, 0.52); skyline(0, { col: '#191c34', lit: () => 0 }); ctx.restore();
  ctx.restore();
  line(win, 8, '#141024'); strokeLine(530, 520, 530, 1040, 7, '#141024'); strokeLine(250, 780, 810, 780, 7, '#141024');
  fillP(P([[200, 480], [300, 480], [280, 1120], [190, 1120]]), '#4a2f45', 1, 0.6); fillP(P([[760, 480], [860, 480], [870, 1120], [780, 1120]]), '#4a2f45', 1, 0.6);
  // flash light spilling in
  glowAt(530, 900, 900, '242,170,100', 0.25 + fl * 0.35);
  // floor & table
  fillP(R(-200, 1580, 1300, 600, 1), '#211d30', 1, 0.6);
  shape(R(80, 1380, 520, 40, 1), '#5a3b2a', 1, 4, '#120f1e'); strokeLine(110, 1420, 110, 1640, 8, '#120f1e'); strokeLine(570, 1420, 570, 1640, 8, '#120f1e');
  radio(470, 1380, 0.8, 0.5 + Math.sin(T * 7) * 0.2, 1);
  // family sheltering under table
  person(230, 1720, 1.55, { sit: 1, col: '#6a5070', hair: '#2d211a', arm: 'hug', look: [0, -4], worried: 1 });
  person(380, 1730, 1.1, { sit: 1, col: '#a0604c', hair: '#5a3b20', look: [-3, -4], worried: 1 });
  // parent at the window
  person(860, 1760, 2.0, { col: '#3e4660', hair: '#262020', look: [-4, -6], worried: 1, flip: 1 });
  // --- outside: warden + radio operator (revealed by pan)
  ctx.save(); ctx.translate(0, 0);
  const ox = 1080;
  fillP(R(ox, -200, 900, 2400, 1), '#161a36', 1, 0.6);
  ctx.save(); ctx.beginPath(); ctx.rect(ox, -200, 900, 2400); ctx.clip();
  ctx.translate(ox, 0); nightSky(380, 1500, '#0e1230', '#2a2f5a');
  [[120, 0.3], [520, -0.2]].forEach(([x, a], i) => beam(x, 1400, a + 0.2 * Math.sin(T * 0.7 + i), 1200, 10, 110, 0.9));
  TL.K_BOOMS.forEach((t, i) => flak(150 + (i * 151) % 500, 600 + (i * 71) % 300, u - rel(t, 10) - 0.1, 0.9, 1, i + 600));
  ground(1450, '#171a32');
  person(250, 1700, 1.6, { col: '#3f4a3a', helmet: 'warden', arm: 'up', look: [2, -6], worried: 1 });
  sandbags(380, 1760, 420, 3, '#6f6448');
  shape(R(430, 1520, 200, 110, 1), '#3c4436', 1, 3); radio(530, 1620, 0.45, 0.5 + Math.sin(T * 11) * 0.3);
  person(650, 1720, 1.3, { col: '#55603f', helmet: 'phones', look: [-4, -3], arm: 'radio', flip: 1 });
  glowAt(400, 900, 700, '242,170,100', fl * 0.3);
  ctx.restore(); ctx.restore();
  // wall between room and outside
  fillP(R(1040, -200, 70, 2400, 1), '#1d1830', 1, 0.6);
  ctx.restore();
}

// ===== L: MORNING — NOTHING =====
function cloud(x, y, s, col = '#f4ece0', al = 1) { const pts = []; const bl = [[0, 0, 60], [55, -22, 52], [112, -4, 56], [160, 10, 40], [70, 18, 60], [-40, 14, 40]]; for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283; let best = 0; for (const [dx, dy, r] of bl) { const ex = dx + Math.cos(a) * r, ey = dy + Math.sin(a) * r * 0.7; best = Math.max(best, Math.hypot(ex - 60, ey)); } pts.push([x + (60 + Math.cos(a) * best) * s, y + Math.sin(a) * best * 0.55 * s]); } shape(PS(pts, true, 1.5), col, al, 2.5, '#9aa0b0', 0.35); }
function daySky(y0, y1, al = 1, top = '#b9cfdc', bot = '#f3d6a8') { ctx.save(); ctx.globalAlpha = al; const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(-500, y0, W + 1000, y1 - y0); ctx.globalAlpha = al * 0.35; ctx.fillStyle = hatch('#c8d4dc'); ctx.fillRect(-500, y0, W + 1000, y1 - y0); ctx.restore(); }
function sL(u) {
  const day = ease(seg(u, 0.1, 1.8));
  const camX = 160 - 320 * ease(seg(u, 1.4, 3.4)), camY = -640 * ease(seg(u, 3.3, 5.1));
  ctx.save(); drift(3); ctx.translate(camX * 0.5, camY);
  nightSky(-600, 2700, C.sky1, C.sky2, 1);
  daySky(-600, 1760, day);
  // sun rising
  const sy = lerp(1820, 1400, ease(seg(u, 0.2, 3.0)));
  glowAt(200, sy, 520, '255,210,140', 0.6 * day); shape(ell(200, sy, 70, 70, 18, 1), '#f7cf7e', day, 3, '#d99a4a', 0.4);
  ctx.translate(camX, 0);
  [[-200, 700, 1.2], [520, 560, 0.9], [1050, 820, 1.1], [1500, 640, 1.0]].forEach(([x, y, s], i) => cloud(x + T * 6, y, s, '#f6efe2', day * 0.9));
  // beams switching off
  [[-100, 0.35], [180, 0.1], [500, -0.08], [820, -0.2], [1150, -0.42]].forEach(([x, a], i) => beam(x, 1760, a, 2000, 14, 150, 1 - ease(seg(u, 0.25 + i * 0.22, 0.45 + i * 0.22))));
  // leftover smoke dissolving
  for (let i = 0; i < 9; i++) flak(-150 + i * 160, 650 + (i * 97) % 500, 1.2 + u * 0.75, 1.3, 1, i + 700);
  ctx.translate(-camX, 0);
  // ground revealed by tilt
  ctx.save(); ctx.translate(camX * 0.5 * 0, 0);
  hills(1780, '#9a9c7c', 8, 60);
  fillP(R(-300, 1800, W + 600, 900, 1), '#b9b08a', 1, 0.55);
  skyline(1810, { col: '#8d8aa0', win: '#d7d0c0', lit: () => 0.25, outline: '#3a3a55', al: 0.9 });
  fillP(R(-300, 1805, W + 600, 900, 1), '#c2b994', 1, 0.6);
  palm(120, 2150, 260, '#4a5a3a'); palm(980, 2180, 280, '#4a5a3a');
  // houses
  [[220, 2300], [520, 2330], [800, 2290]].forEach(([x, y], i) => { shape(R(x - 90, y - 110, 180, 110), ['#e7d7b6', '#d8c3a0', '#e3cfae'][i], 1, 3.5); shape(P([[x - 110, y - 108], [x, y - 190], [x + 110, y - 108]], true, 1), '#b3644a', 1, 3.5); shape(R(x - 20, y - 60, 40, 60, 1), '#6b4b36', 1, 3); });
  sandbags(520, 2470, 460, 2, '#9c8a62');
  aaGun(760, 2440, 0.95, 0.9, { col: '#7a8558', dark: '#5f6a45' });
  person(470, 2470, 1.2, { col: '#7a8558', helmet: 'brodie', look: [0, -5] });
  ctx.restore();
  ctx.restore();
}

// ===== M: NO JAPANESE AIR RAID — MAP =====
const JAPAN = [[150, 640], [185, 655], [205, 715], [232, 780], [262, 838], [272, 880], [252, 902], [216, 890], [190, 858], [174, 818], [160, 760], [140, 700]];
function sM(u) {
  paperBG();
  ctx.save(); drift(3); zoomAt(540, 1000, 1.04 - 0.04 * ease(seg(u, 0, 5.7)));
  shape(R(40, 470, 1000, 1180, 2), C.mapsea, 1, 5, C.navy, 0.7);
  ctx.save(); ctx.clip(R(40, 470, 1000, 1180, 0));
  ctx.globalAlpha = 0.22; ctx.strokeStyle = C.navy; ctx.lineWidth = 1.5;
  for (let x = 140; x < 1040; x += 150) { ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x, 1650); ctx.stroke(); }
  for (let y = 560; y < 1650; y += 150) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(1040, y); ctx.stroke(); }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 18; i++) { const wx = 140 + (i % 6) * 140 + (Math.floor(i / 6) % 2) * 60 + Math.sin(T + i) * 4, wy = 1150 + Math.floor(i / 6) * 150; line(PS([[wx, wy], [wx + 18, wy - 8], [wx + 36, wy], [wx + 54, wy - 8]], false, 1), 2.5, '#4e6577', 0.6); }
  // Japan
  shape(PS(JAPAN, true, 1.2), C.land, 1, 4); shape(PS([[120, 905], [150, 900], [160, 935], [130, 955], [110, 932]], true, 1), C.land, 1, 3.5); shape(PS([[190, 560], [240, 572], [252, 612], [212, 632], [180, 606]], true, 1), C.land, 1, 3.5);
  // North America west coast
  shape(PS([[1100, 400], [880, 520], [862, 640], [856, 720], [870, 800], [892, 880], [906, 940], [930, 1000], [962, 1060], [986, 1120], [1004, 1200], [1100, 1300]], true, 1.2), C.land, 1, 4);
  shape(ell(966, 1062, 12, 12, 10, 1), C.navy, 1, 2); // Los Angeles dot
  // compass rose
  ctx.save(); ctx.translate(170, 1480); ctx.rotate(Math.sin(T * 0.3) * 0.05); shape(P([[0, -70], [14, 0], [0, 70], [-14, 0]]), '#e8dcc0', 1, 3); shape(P([[-70, 0], [0, -14], [70, 0], [0, 14]]), '#e8dcc0', 1, 3); ctx.restore();
  // expected route (dotted) — fades before reaching California
  const p0 = [262, 840], pc = [600, 520], p1 = [950, 1050];
  const reach = 0.74 * easeOut(seg(u, 0.3, 2.4));
  for (let s = 0; s < reach; s += 0.022) {
    const x = (1 - s) * (1 - s) * p0[0] + 2 * (1 - s) * s * pc[0] + s * s * p1[0], y = (1 - s) * (1 - s) * p0[1] + 2 * (1 - s) * s * pc[1] + s * s * p1[1];
    const fade = 1 - ease(seg(u, 2.7 + (0.74 - s) * 2.2, 3.1 + (0.74 - s) * 2.2));
    if (fade <= 0) continue;
    ctx.globalAlpha = fade * (0.6 + 0.4 * (s / 0.74)); ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(x + J(s * 100, 1, 1), y + J(1, s * 100, 1), 6, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();
}

// ===== N: NAVY STATEMENT — FALSE ALARM CAUSAL CHAIN =====
function anchor(x, y, s, col = C.navy) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); line(ell(0, -60, 12, 12, 10, 1), 5, col); strokeLine(0, -48, 0, 50, 6, col); strokeLine(-30, -30, 30, -30, 5, col); line(PS([[-48, 18], [-30, 48], [0, 56], [30, 48], [48, 18]], false, 1), 6, col); ctx.restore(); }
function card(x, y, r, k, draw) {
  if (k <= 0) return;
  const s = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.12 : 1; ctx.save(); ctx.translate(x, y); ctx.scale(s * easeOut(k), s * easeOut(k));
  const c = ell(0, 0, r, r, 24, 1.5); shape(c, '#efe5cc', 1, 5);
  ctx.save(); ctx.clip(c); draw(r); ctx.restore(); line(c, 5); ctx.restore();
}
function arrowDown(x, y, k) { if (k <= 0) return; const L = 90 * k; strokeLine(x, y - 45, x, y - 45 + L, 6); if (k > 0.8) line(P([[x - 22, y + 18], [x, y + 45], [x + 22, y + 18]], false, 1), 6); }
function plus(x, y, k) { if (k <= 0) return; ctx.save(); ctx.globalAlpha = k; strokeLine(x - 30, y, x + 30, y, 8); strokeLine(x, y - 30, x, y + 30, 8); ctx.restore(); }
function iconNight(r, dense) { nightSky(-r, r, C.sky1, C.sky2); [-0.5, -0.15, 0.2, 0.5].forEach((a, i) => beam(-r * 0.6 + i * r * 0.4, r, a + Math.sin(T + i) * 0.08, r * 2.2, 6, 60, 1)); if (dense) for (let i = 0; i < 6; i++) flak(-r * 0.5 + (i * 71) % (r), -r * 0.5 + (i * 53) % (r * 0.8), ((T * 1.1 + i * 0.37) % 1.6), 0.55, 1, 800 + i); }
function sN(u) {
  paperBG();
  ctx.save(); drift(3);
  // document
  const dIn = easeOut(seg(u, 0, 0.7)), dOut = easeIn(seg(u, 1.8, 2.5));
  if (dOut < 1) {
    ctx.save(); ctx.translate(540 - 1100 * dOut, lerp(1500, 1080, dIn)); ctx.rotate(-0.04 + dOut * -0.3);
    shape(R(-320, -430, 640, 860, 1.5), '#f6f0e0', 1, 4, C.navy, 0.3);
    anchor(0, -310, 0.9);
    for (let i = 0; i < 12; i++) strokeLine(-250, -180 + i * 42, 250 - 120 * h1(i), -180 + i * 42, 3, '#5b5d72', 0.7);
    const st = easeOut(seg(u, 0.75, 0.95)); if (st > 0) { ctx.save(); ctx.translate(170, 300); ctx.rotate(-0.25); ctx.scale(2 - st, 2 - st); ctx.globalAlpha = st * 0.8; line(ell(0, 0, 90, 90, 22, 2), 7, C.red); line(ell(0, 0, 68, 68, 20, 2), 3, C.red); anchor(0, 0, 0.6, C.red); ctx.restore(); }
    ctx.restore();
  }
  // causal chain
  card(320, 650, 140, seg(u, 2.0, 2.5), r => { fillP(R(-r, -r, 2 * r, 2 * r, 1), '#d6c8a8', 1, 0.5); person(0, r * 1.25, 1.0, { col: '#55603f', helmet: 'phones', look: [3, -3], worried: 1 }); });
  plus(540, 650, seg(u, 2.5, 2.8));
  card(760, 650, 140, seg(u, 2.7, 3.2), r => { radarScope(0, 0, r * 0.9, T * 2.6, [[-r * 0.35, -r * 0.2, 7, 1]], {}); qMark(r * 0.25, -r * 0.35, 110, C.yellow, 1, '#121510'); });
  arrowDown(540, 840, seg(u, 3.2, 3.5));
  card(540, 1010, 130, seg(u, 3.5, 4.0), r => { nightSky(-r, r); siren(0, r * 0.2, 0.95, T * 7, 1); });
  arrowDown(540, 1190, seg(u, 4.0, 4.3));
  card(540, 1390, 175, seg(u, 4.3, 4.8), r => iconNight(r, 1));
  arrowDown(540, 1610, seg(u, 5.0, 5.3));
  card(540, 1760, 115, seg(u, 5.3, 5.8), r => { daySky(-r, r); shape(ell(-r * 0.4, r * 0.3, 30, 30, 14, 1), '#f7cf7e', 1, 3); fillP(R(-r, r * 0.45, 2 * r, r, 1), '#b9b08a', 1, 0.5); });
  ctx.restore();
}

// ===== O: WHAT STARTED IT? =====
function dashedRing(x, y, r, al) { ctx.save(); ctx.globalAlpha = al; ctx.setLineDash([18, 14]); ctx.lineDashOffset = -T * 20; ctx.strokeStyle = C.cream; ctx.lineWidth = 4; ctx.stroke(ell(x, y, r, r, 26, 1.5)); ctx.restore(); }
function sO(u) {
  ctx.save(); drift(3);
  nightSky(-300, 2200, '#1a1f3e', '#2e2a50');
  stars(50, 420, 1900, 0.35, 61);
  const cx = 540, cy = 1080;
  const items = [[270, 690, 0.4], [810, 690, 1.3], [270, 1500, 2.2], [810, 1500, 3.1]];
  items.forEach(([x, y, t0], i) => {
    const k = easeOut(seg(u, t0, t0 + 0.6)); if (k <= 0) return;
    const fx = x + Math.sin(T * 0.8 + i) * 8, fy = y + Math.cos(T * 0.7 + i) * 8;
    ctx.save(); ctx.globalAlpha = 0.6 * k; ctx.setLineDash([10, 14]); ctx.strokeStyle = C.cream; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + (fx - cx) * 0.35, cy + (fy - cy) * 0.35); ctx.lineTo(cx + (fx - cx) * 0.72, cy + (fy - cy) * 0.72); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(fx, fy); ctx.scale(k, k); ctx.globalAlpha = 1;
    const r = 150; const c = ell(0, 0, r, r, 24, 1.5);
    fillP(c, '#262b52', 1, 0.6);
    ctx.save(); ctx.clip(c);
    if (i === 0) { radarScope(0, 0, r * 0.85, T * 2.4, [[-40, -30, 7, 0.7], [20, -55, 6, 0.5], [-10, 30, 5, 0.4]], {}); }
    if (i === 1) { cloud(-90, -10, 1.0, '#d9dde6', 1); for (let j = 0; j < 3; j++) line(PS([[-110, 60 + j * 26], [-60, 50 + j * 26], [-10, 64 + j * 26], [40, 50 + j * 26], [100, 62 + j * 26]], false, 1), 3.5, '#bcc6d8', 0.9); }
    if (i === 2) { const by = Math.sin(T * 0.9) * 10; strokeLine(0, 20 + by, 6, 110, 2.5, C.cream); shape(PS([[0, 26 + by], [-48, -30 + by], [-40, -80 + by], [0, -100 + by], [40, -80 + by], [48, -30 + by]], true, 1.2), '#c9c4b4', 1, 3, C.navy); shape(R(-10, 108, 20, 18, 1), '#8a7a5a', 1, 2.5); }
    if (i === 3) { shape(PS([[-100, 0], [-50, -42], [0, -52], [50, -42], [100, 0], [50, 42], [0, 52], [-50, 42]], true, 1.2), '#efe6d0', 1, 4); shape(ell(4, -12, 28, 28, 14, 1), '#4a5a7a', 1, 3); ctx.fillStyle = '#121528'; ctx.beginPath(); ctx.arc(6, -16, 12, 0, 7); ctx.fill(); flak(70, -95, 1.4 + (T % 2), 0.5, 1, 900); }
    ctx.restore();
    dashedRing(0, 0, r, 0.9);
    qMark(r * 0.72, -r * 0.72, 90, C.yellow, 1, '#1a1d36');
    ctx.restore();
  });
  // central question mark
  const qk = easeOut(seg(u, 0, 0.5)), bob = Math.sin(T * 1.2) * 10;
  ctx.save(); ctx.translate(cx, cy + bob); ctx.scale(qk, qk); ctx.rotate(Math.sin(T * 0.6) * 0.04);
  glowAt(0, 0, 330, '243,220,146', 0.18);
  qMark(0, 0, 440, C.cream, 1, C.navy);
  ctx.restore();
  ctx.restore();
}

// ===== P: THE NAME =====
const NP_PIECES = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]];
function beamsPic(x, y, w, h) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#3d3f4c'; ctx.fillRect(0, 0, w, h); [[0.1, 0.5], [0.3, 0.2], [0.5, 0], [0.7, -0.2], [0.9, -0.5]].forEach(([fx, a]) => beam(w * fx, h, a, h * 1.2, 4, 40, 0.9)); fillP(R(0, h * 0.85, w, h, 1), '#22232e', 1, 0.4); ctx.restore(); }
function sP(u) {
  ctx.save(); drift(3);
  nightSky(-300, 2200);
  stars(40, 420, 1200, 0.45, 71);
  const xk = ease(seg(u, 0.1, 1.4));
  beam(-60, 1650, lerp(0.05, Math.atan2(540 + 60, 1650 - 860), xk), 2400, 18, 190, 1);
  beam(1140, 1650, lerp(-0.05, Math.atan2(540 - 1140, 1650 - 860), xk), 2400, 18, 190, 1);
  beam(300, 1650, 0.12 + Math.sin(T * 0.5) * 0.1, 1800, 10, 110, 0.45); beam(800, 1650, -0.15 + Math.sin(T * 0.6) * 0.1, 1800, 10, 110, 0.45);
  for (let i = 0; i < 5; i++) flak(380 + (i * 97) % 340, 700 + (i * 61) % 300, 2.4 + i * 0.3 + u * 0.4, 0.9, 0.6, 950 + i);
  skyline(1660, { col: '#222641', lit: () => 0 });
  ground(1655, '#13162d');
  // newspaper assembling from pieces
  const NW = 700, NH = 780, nx = 540, ny = 1300;
  NP_PIECES.forEach(([c, r], i) => {
    const k = easeOut(seg(u, 0.05 + i * 0.08, 0.75 + i * 0.08)); if (k <= 0) return;
    const rr = mulberry(i * 31 + 5); const sx = (rr() - 0.5) * 1600, sy = (rr() - 0.5) * 1400 - 400, srot = (rr() - 0.5) * 3;
    ctx.save(); ctx.translate(nx + sx * (1 - k), ny + sy * (1 - k)); ctx.rotate(-0.03 + srot * (1 - k));
    const px = -NW / 2 + c * NW / 3, py = -NH / 2 + r * NH / 3;
    ctx.beginPath(); ctx.rect(px - 1, py - 1, NW / 3 + 2, NH / 3 + 2); ctx.clip();
    newspaper(0, 0, NW, NH, 0, { pic: beamsPic, headline: 2 });
    ctx.restore();
  });
  ctx.restore();
}

// ===== Q: FINAL IRONY 1 — TENSION =====
function sQ(u) {
  const fl = flashSum(TL.Q_FLAK.map(e => e[0]), 16, u, 0.22), gs = flashSum(TL.Q_SHOTS, 16, u, 0.25);
  ctx.save(); drift(3); shake(3 + 7 * seg(u, 0, 3.8) + gs * 6); zoomAt(540, 900, 1 + 0.07 * ease(seg(u, 0, 3.84)));
  nightSky(-300, 2000);
  [[60, 0.45], [300, 0.15], [620, -0.1], [900, -0.35], [1060, -0.5]].forEach(([x, a], i) => beam(x, 1560, a + 0.3 * Math.sin(T * 1.3 + i * 1.7), 1900, 14, 140, 0.9));
  TL.Q_FLAK.forEach(([t, x, y, s], i) => flak(x, y, u - rel(t, 16), s, 1, i + 1000));
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(242,150,70,${0.14 * fl})`; ctx.fillRect(-200, -200, W + 400, H + 400); ctx.restore();
  skyline(1620, { col: '#232742', lit: () => 0 });
  ground(1615, '#14162e');
  // sheltering family in a window (left)
  const win = R(60, 1260, 380, 330, 1.5);
  ctx.save(); ctx.clip(win); fillP(R(40, 1240, 420, 380, 1), '#2e2840', 1, 0.6); glowAt(250, 1300, 400, '242,170,100', 0.2 + fl * 0.5);
  person(190, 1640, 1.15, { sit: 1, col: '#6a5070', hair: '#2d211a', arm: 'hug', look: [3, -5], worried: 1 }); person(300, 1650, 0.8, { sit: 1, col: '#a0604c', hair: '#5a3b20', look: [-2, -5], worried: 1 });
  ctx.restore(); line(win, 7, '#120f20'); strokeLine(250, 1260, 250, 1590, 6, '#120f20');
  // gun (right foreground)
  let rec = 0; TL.Q_SHOTS.forEach(t => { const a = u - rel(t, 16); if (a >= 0 && a < 0.3) rec = Math.max(rec, Math.sin(a / 0.3 * Math.PI)); });
  aaGun(830, 1880, 1.25, 0.95, { flip: 1, flash: gs, recoil: rec });
  if (gs > 0) glowAt(560, 1300, 520, '242,160,80', gs * 0.5);
  ctx.restore();
}

// ===== R: FINAL IRONY 2 — EMPTY MORNING =====
function sR(u) {
  ctx.save(); drift(2);
  daySky(-300, 1700, 1, '#c9d3d8', '#efe4cc');
  [[100, 720, 1.1], [640, 600, 0.8], [900, 900, 1.0]].forEach(([x, y, s]) => cloud(x + T * 4, y, s, '#f3eee4', 0.75));
  // mist
  glowAt(540, 1450, 900, '245,240,230', 0.35);
  hills(1640, '#a7a68a', 4, 70);
  fillP(R(-300, 1640, W + 600, 600, 1), '#b8b28f', 1, 0.55);
  // one searchlight shuts off
  const on = TL.R_CLICK - SC[17] > u ? 1 : clamp(1 - (u - (TL.R_CLICK - SC[17])) / 0.12);
  beam(230, 1600, 0.18, 1700, 12, 120, 0.55 * on);
  lightUnit(230, 1640, 0.18, 1.3, on);
  // AA gun lowers
  const elev = lerp(1.0, 0.1, ease(seg(u, 1.4, 3.9)));
  sandbags(560, 1840, 480, 2, '#9c8a62');
  aaGun(760, 1800, 1.15, elev, { col: '#7a8558', dark: '#5f6a45' });
  ctx.restore();
}

// ===== S: FINAL CHANNEL ENDING COMPOSITION =====
// photo geometry (archival image 600x372 shown at 920 px wide)
const PH = { x: 80, y: 775, w: 920, h: 570, apex: [205, 90], ends: [[0, 133], [10, 262], [98, 281], [214, 292], [256, 306], [333, 302], [540, 290], [600, 277]] };
const phX = px => PH.x + px * PH.w / 600, phY = py => PH.y + py * PH.h / 372;
const S_BASES = [[-60, 1600], [120, 1640], [300, 1640], [470, 1640], [600, 1650], [760, 1640], [960, 1630], [1140, 1600]];
function sS(u, morph = 0) {
  ctx.save(); drift(3 * (1 - morph));
  nightSky(-300, 2200);
  stars(50, 420, 1300, 0.45 * (1 - morph), 81);
  moon(880, 560, 30, 1 - morph);
  const ax = lerp(470 + Math.sin(T * 0.4) * 20, phX(PH.apex[0]), morph), ay = lerp(820, phY(PH.apex[1]), morph);
  S_BASES.forEach(([bx, by], i) => {
    const ex = phX(PH.ends[i][0]), ey = phY(PH.ends[i][1]);
    const x0 = lerp(bx, ex, morph), y0 = lerp(by, ey, morph);
    const a = Math.atan2(ax - x0, y0 - ay) + (1 - morph) * 0.03 * Math.sin(T * 0.8 + i);
    const d = Math.hypot(ax - x0, y0 - ay);
    beam(x0, y0, a, d * lerp(1.25, 1.06, morph), lerp(14, 8, morph), lerp(130, 60, morph), 1);
  });
  for (let i = 0; i < 6; i++) flak(330 + (i * 113) % 420, 640 + (i * 67) % 320, 1.6 + i * 0.25 + u * 0.5, 1.1, 1 - morph, 1200 + i);
  ctx.save(); ctx.globalAlpha = 1 - morph * 0.6;
  skyline(1690, { col: '#202440', lit: () => 0 });
  ground(1685, '#12152b');
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 1 - morph;
  aaGun(170, 1880, 1.05, 0.9, { col: '#2f3828', dark: '#232a1e', lc: '#0c0e18' });
  newspaper(830, 1730, 400, 470, 0.16, { pic: beamsPic, headline: 2 });
  ctx.restore();
  ctx.restore();
}

// ===== T: ARCHIVAL TRANSITION =====
let PHOTO = null; let TOOTH_AL = 1;
function sT(u) {
  const morph = ease(seg(u, 0, 1.3));
  sS(u + 4.0, morph);
  const outA = ease(seg(u, 0.5, 1.5)), inA = ease(seg(u, 1.0, 2.0));
  TOOTH_AL = 1 - inA * 0.85;
  // paper outside the frame
  if (outA > 0) { ctx.save(); ctx.globalAlpha = outA; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(PH.x - 26, PH.y - 26, PH.w + 52, PH.h + 52); ctx.clip('evenodd'); ctx.drawImage(PAPER, 0, 0); ctx.restore(); }
  // frame
  if (outA > 0) { ctx.save(); ctx.globalAlpha = outA; ctx.shadowColor = 'rgba(40,30,20,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; ctx.fillStyle = '#f7f1e3'; ctx.beginPath(); ctx.rect(PH.x - 26, PH.y - 26, PH.w + 52, PH.h + 52); ctx.rect(PH.x, PH.y, PH.w, PH.h); ctx.fill('evenodd'); ctx.restore(); }
  if (inA > 0 && PHOTO) {
    const z = 1 + 0.035 * ease(seg(u, 1.0, 5.4)), dx = 6 * Math.sin(seg(u, 1, 5.4) * 1.5);
    ctx.save(); ctx.beginPath(); ctx.rect(PH.x, PH.y, PH.w, PH.h); ctx.clip(); ctx.globalAlpha = inA;
    ctx.translate(PH.x + PH.w / 2 + dx, PH.y + PH.h / 2); ctx.scale(z, z); ctx.drawImage(PHOTO, -PH.w / 2, -PH.h / 2, PH.w, PH.h); ctx.restore();
  }
}

const SCENE_FN = [sA, sB, sC, sD, sE, sF, sG, sH, sI, sJ, sK, sL, sM, sN, sO, sP, sQ, sR, sS, sT];
const TRANS = [0, 0.5, 0.5, 0.5, 0.5, 0.45, 0.4, 0.4, 0.5, 0.35, 0.45, 0.6, 0.6, 0.5, 0.6, 0.5, 0.4, 0, 0.6, 0];
