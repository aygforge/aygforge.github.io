// ===== scenes & compositor =====
const TA = mk(W, H), TAX = TA.getContext('2d');
const TB = mk(W, H), TBX = TB.getContext('2d');
const MA = mk(W, H), MAX = MA.getContext('2d');
const MB = mk(W, H), MBX = MB.getContext('2d');
const CX = 540, CY = 1150;

function bursts(lt, times, d = 0.24) { let v = 0; for (const b of times) if (lt >= b && lt < b + d) v = Math.max(v, 1 - (lt - b) / d); return v; }
function cam(c, z = 1, fx = CX, fy = CY, amp = 1) {
  c.translate(CX + Math.sin(T * 0.5) * 6 * amp, CY + Math.cos(T * 0.41) * 5 * amp); c.rotate(Math.sin(T * 0.3) * 0.004 * amp); c.scale(z, z); c.translate(-fx, -fy);
}
function shake(c, a) { c.translate((hash(FR * 1.3) - 0.5) * a, (hash(FR * 2.1 + 5) - 0.5) * a); }
function drawTVc(c, scx, scy, w, img, o) { // position by screen centre
  const h = w * (o && o.kind === 'console' ? 0.78 : 0.8);
  const cx = scx + 0.105 * w, cy = scy - (0.1 * h + 0.2475 * w) + h / 2;
  return drawTV(c, cx, cy, w, img, o);
}
function stand(c, x, y, w, h, seed = 521) { P(c, 'rectangle', [x - w / 2, y, w, h], { fill: '#4b3226', sw: 3, seed, gap: 6 }); }
function pirFX(lt, extra = 0) {
  const b = bursts(lt, [0.9, 2.3, 3.4, 4.6, 5.9, 7.1, 8.3]);
  return { tear: 0.18 + b * 1.1 + extra, ghost: 0.5, rgb: 1.6 + b * 4 + extra * 3, noise: 0.42, bleed: 0.55, wobble: 1.2, staticA: b * 0.35 };
}
function wave(c, x0, x1, y, amp, lt, mode, col = AGREEN) {
  const pts = []; for (let x = x0; x <= x1; x += 5) {
    const u = (x - x0) / (x1 - x0); let v;
    if (mode === 'calm') v = Math.sin(u * 40 + lt * 9) * 0.5 * (0.6 + 0.4 * Math.sin(u * 7 - lt * 3)) * Math.abs(Math.sin(lt * 3 + u * 5));
    else { v = (hash(Math.floor(x / 10) + FR * 0.7) * 2 - 1) * (hash(Math.floor(x / 60) + Math.floor(lt * 6)) > 0.5 ? 1 : 0.15); }
    pts.push([x, y + v * amp]);
  }
  c.save(); c.shadowColor = col; c.shadowBlur = 12;
  if (mode === 'broken') { for (let i = 0; i < pts.length - 1; i++) { if (hash(Math.floor(i / 6) * 1.7 + Math.floor(lt * 5)) > 0.62) continue; pencilLine(c, [pts[i], [pts[i + 1][0], pts[i + 1][1] + (hash(i + FR) - 0.5) * 14]], col, 4); } }
  else pencilLine(c, pts, col, 4);
  c.restore();
}
function wavePanel(c, x, y, w, h, lt, mode) {
  P(c, 'path', [rrPath(x, y, w, h, 24)], { fill: '#14251c', hfill: '#0c1912', sw: 3.5, seed: 940, gap: 4, solid: 0.9 });
  for (let i = 1; i < 4; i++) P(c, 'line', [x + 16, y + h * i / 4, x + w - 16, y + h * i / 4], { sw: 1, stroke: '#2e5a3c', seed: 941 + i, r: 0.5 });
  wave(c, x + 24, x + w - 24, y + h / 2, h * 0.36, lt, mode);
}

// ---------- S1 hook ----------
function s1(c, lt) {
  c.save(); cam(c, 1 + 0.05 * ss(0, 7, lt));
  c.drawImage(layer('room1', livingRoom), 0, 0); stand(c, 540, 1600, 640, 130);
  let name = 'pirate', fx;
  if (lt < 0.33) { name = 'news'; fx = { noise: 0.12 }; }
  else if (lt < 0.85) { name = lt > 0.62 ? 'pirate' : 'news'; fx = { staticA: lt < 0.7 ? 1 : 0.65, tear: 1.3, roll: (lt - 0.33) * 320, rgb: 4 }; }
  else { fx = pirFX(lt); fx.staticA = Math.max(fx.staticA, (1 - ss(0.85, 1.5, lt)) * 0.6); fx.tear += (1 - ss(0.85, 1.4, lt)) * 0.8; }
  const img = screen(name, lt, fx);
  const r = drawTV(c, 540, 1150, 900, img, { seed: 300 });
  screenGlow(c, r, lt < 0.33 ? 'rgba(120,160,230,1)' : 'rgba(111,201,207,1)', lt < 0.85 && lt > 0.33 ? 0.55 : 0.32);
  glow(c, 930, 950, 160, 'rgba(255,190,110,1)', 0.18);
  viewer(c, 250, 1800, 1.25, CYAN, 0.02 * Math.sin(lt * 0.8) + (lt > 0.9 ? -0.04 : 0), 700);
  c.restore();
}
// ---------- S2 WGN interruption ----------
function wall2(c) {
  P(c, 'rectangle', [-20, -20, W + 40, H + 40], { fill: '#d8c7a2', hfill: '#c4ae84', solid: 0.75, gap: 9, sw: 0, stroke: 'none', seed: 560, r: 1.5 });
  for (let i = 0; i < 6; i++) for (let j = 0; j < 10; j++) P(c, 'circle', [80 + i * 190 + (j % 2) * 95, 480 + j * 150, 26], { fill: '#b98f6a', sw: 1.5, seed: 561 + i * 10 + j, hatch: false, alpha: 0.45 });
  P(c, 'rectangle', [-20, 1480, W + 40, 500], { fill: '#6a4a36', hfill: '#4f3626', sw: 3, seed: 570, gap: 7, angle: 15 });
}
function s2(c, lt) {
  c.save(); cam(c, 1 + 0.06 * ss(0, 6.4, lt));
  c.drawImage(layer('wall2', wall2), 0, 0);
  let name = 'news', fx = { noise: 0.1 };
  if (lt > 4.35 && lt < 4.95) fx = { bend: ss(4.35, 4.9, lt) * 1.3, tear: 0.4, noise: 0.3, rgb: 2 };
  else if (lt >= 4.95 && lt < 5.5) fx = { staticA: 1, tear: 1.4, bend: 0.4 };
  else if (lt >= 5.5) { name = 'pirate'; fx = pirFX(lt, 0.5); fx.staticA = 0.45 * (1 - ss(5.5, 6.2, lt)); }
  const img = screen(name, lt, fx);
  const r = drawTVc(c, 540, 1000, 820, img, { seed: 320, kind: 'classic', body: '#7a6a5a' });
  stand(c, 540, r.y + r.h + 100, 700, 70, 571);
  screenGlow(c, r, name === 'pirate' ? 'rgba(111,201,207,1)' : 'rgba(150,180,230,1)', 0.25);
  wavePanel(c, 110, 1560, 860, 210, lt, lt < 4.35 ? 'calm' : 'broken');
  c.restore();
}
// ---------- S3 the masked figure ----------
function s3(c, lt) {
  c.save(); navyWash(c, -20, -20, W + 40, H + 40, '#1f2250', 580, 5);
  cam(c, 1.0 + 0.04 * ss(0, 4.7, lt)); if (FR % 2 === 0 || true) shake(c, 9 + 14 * bursts(lt, [1.2, 2.6, 3.9]));
  c.rotate(noise1(lt * 2) * 0.012);
  const fx = pirFX(lt + 0.4); fx.ghost = 0.75; fx.rgb += 1.5; fx.bleed = 0.8; fx.wobble = 2.5;
  const img = screen('pirate', lt + 2, fx, {});
  const r = drawTVc(c, 540, 1130, 1480, img, { seed: 330 });
  screenGlow(c, r, 'rgba(196,106,158,1)', 0.25);
  c.restore();
}
// ---------- S4 recovery: split ----------
function ctrlRoom(c) {
  P(c, 'rectangle', [540, -20, 560, H + 40], { fill: '#56637a', hfill: '#465268', solid: 0.9, gap: 6, sw: 0, stroke: 'none', seed: 590 });
  P(c, 'rectangle', [570, 620, 480, 420], { fill: '#2c3242', sw: 3.5, seed: 591, gap: 5 });
  P(c, 'polygon', [[[560, 1360], [1100, 1300], [1100, 1700], [560, 1720]]], { fill: '#8a8f99', hfill: '#6c717c', sw: 3.5, seed: 592, gap: 6 });
  P(c, 'rectangle', [560, 1720, 540, 220], { fill: '#3d4352', sw: 3, seed: 593, gap: 6 });
  for (let i = 0; i < 4; i++) P(c, 'line', [800 + i * 60, 1420, 800 + i * 60, 1600], { sw: 6, seed: 594 + i, stroke: '#2b2f3a' });
}
function s4(c, lt) {
  const rec = lt >= 3.85, st = lt >= 3.45 && lt < 3.85;
  c.save(); cam(c, 1, CX, CY, 0.6);
  c.drawImage(layer('ctrl', ctrlRoom), 0, 0);
  // left: home TV
  c.save(); c.beginPath(); c.rect(-40, -40, 580, H + 80); c.clip();
  navyWash(c, -20, -20, 580, H + 40, '#262a58', 600, 5);
  let img = screen(st ? 'static' : rec ? 'news' : 'pirate', lt + 4, st ? { staticA: 1, tear: 1.3 } : rec ? { noise: 0.1 } : pirFX(lt));
  let r = drawTVc(c, 280, 1050, 470, img, { seed: 340 });
  stand(c, 300, r.y + r.h + 60, 420, 80, 601);
  screenGlow(c, r, rec ? 'rgba(150,180,230,1)' : 'rgba(111,201,207,1)', 0.35);
  c.restore();
  // right: monitors
  const mons = [[640, 700], [820, 700], [640, 860], [820, 860]];
  for (let i = 0; i < 4; i++) {
    const [mx, my] = mons[i]; let nm, f;
    if (i === 0) { nm = st ? 'static' : rec ? 'news' : 'pirate'; f = st ? { staticA: 1 } : rec ? {} : { tear: 0.3, noise: 0.4 }; }
    else if (i === 1) { nm = 'news'; f = { noise: 0.1, dark: rec ? 0 : 0.3 }; }
    else if (i === 2) { nm = 'static'; f = { staticA: rec ? 0.2 : 0.8, dark: rec ? 0.6 : 0 }; }
    else { nm = rec ? 'news' : 'static'; f = rec ? { noise: 0.2 } : { staticA: 0.7 }; }
    const im = screen(nm, lt + i, f);
    P(c, 'rectangle', [mx - 6, my - 6, 172, 132], { fill: '#1a1d26', sw: 3, seed: 610 + i, hatch: false });
    blitScreen(c, im, mx, my, 160, 120, 10);
  }
  // buttons
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
    const on = hash(i * 7 + j * 3 + Math.floor(lt * (rec ? 1.5 : 6))) > 0.45;
    const col = rec ? (on ? '#7fd07a' : '#3c6a3a') : (on ? '#ff6050' : '#6a2a26');
    c.fillStyle = col; c.beginPath(); c.arc(610 + i * 75, 1385 + j * 40 - i * 6, 11, 0, 7); c.fill();
    if (on) glow(c, 610 + i * 75, 1385 + j * 40 - i * 6, 26, col, 0.5);
  }
  for (let i = 0; i < 4; i++) { const ky = 1440 + 120 * (0.5 + 0.5 * Math.sin(lt * (i === 1 ? 7 : 1.3) + i * 2)) * (rec ? 0.3 : 1); P(c, 'rectangle', [786 + i * 60, ky, 28, 30], { fill: '#e8e2d2', sw: 2, seed: 620 + i, hatch: false }); }
  // technicians
  const reach = rec ? -0.4 : -0.55 + 0.35 * Math.sin(lt * 8);
  person(c, 700, 1470, 1.0, '#c96f4a', reach, 630, { headset: true });
  person(c, 960, 1170, 0.95, '#5a7fb0', rec ? -0.2 : -1.7 + 0.2 * Math.sin(lt * 6), 640, { hairC: '#2a1c14' });
  c.restore();
  P(c, 'linearPath', [[[540, 470], [544, 900], [537, 1400], [542, 1900]]], { sw: 7, seed: 650, r: 1.4 });
}
// ---------- S5 false end + S6 clock / second channel ----------
function roomQuiet(c, lt, gt, o = {}) {
  c.drawImage(layer('room1', livingRoom), 0, 0); stand(c, 540, 1480, 600, 120);
  const ma = -Math.PI / 2 + 0.9 + (o.spin || 0) * Math.PI * 4, ha = -Math.PI / 2 + 2.2 + (o.spin || 0) * Math.PI / 3;
  clockFace(c, 860, 690, 92, ma, ha, { sec: -Math.PI / 2 + Math.floor(gt * 2) * 0.1047 + (o.spin || 0) * 40 });
  const img = screen('news', gt, { noise: 0.08, corner: o.corner || 0 });
  const r = drawTVc(c, 520, 1200, 560, img, { seed: 350 });
  screenGlow(c, r, 'rgba(255,210,150,1)', 0.25);
  glow(c, 930, 950, 200, 'rgba(255,190,110,1)', 0.22);
  viewer(c, 520, 1775, 1.15, 'rgba(255,220,170,1)', -0.035 * ss(0, 1.2, lt), 710);
}
function s5(c, lt, gt) { c.save(); cam(c, 1.0, CX, CY, 0.5); roomQuiet(c, lt, gt, { corner: ss(1.15, 2.0, lt) * 0.55 }); c.restore(); }
function room2View(c, lt, gt, glitch) {
  c.drawImage(layer('room2', room2), 0, 0);
  const g = glitch;
  let name = 'scifi', fx = { noise: 0.1 };
  if (g > 0) {
    const flash = gt > 31.25 && hash(Math.floor(gt * 11)) > 0.5;
    name = flash ? 'pirate' : 'scifi';
    fx = { roll: Math.pow(Math.max(0, gt - 30.6), 1.7) * 380, tear: 0.6 + g * 1.4, rgb: 3 + g * 6, staticA: 0.35 + 0.6 * Math.abs(Math.sin(gt * 13)), ghost: 0.6, bleed: 1 };
  }
  const img = screen(name, gt, fx);
  const r = drawTVc(c, 520, 1140, 760, img, { seed: 360, kind: 'console', body: '#8a5a34' });
  P(c, 'rectangle', [r.x + 30, r.y + r.h, r.w - 60, 90], { fill: '#6a4226', sw: 3, seed: 365, gap: 6 });
  screenGlow(c, r, g > 0 ? 'rgba(111,201,207,1)' : 'rgba(110,220,200,1)', 0.3 + g * 0.3);
  viewer(c, 330, 1810, 0.9, CYAN, 0.03 + g * 0.06, 720);
  viewer(c, 760, 1820, 0.95, CYAN, -0.03 - g * 0.06, 730);
}
function s6(c, lt, gt) {
  const m = ss(2.35, 3.2, lt);
  if (m < 1) { // phase A: zoom into clock, hands race forward
    MAX.save(); MAX.setTransform(1, 0, 0, 1, 0, 0);
    const z = 1 + 2.3 * ss(0.05, 1.5, lt);
    cam(MAX, z, lerp(CX, 860, ss(0.05, 1.5, lt)), lerp(CY, 690, ss(0.05, 1.5, lt)), 0.5);
    roomQuiet(MAX, 2 + lt, gt, { spin: ss(0.4, 2.3, lt), corner: 0.55 * (1 - ss(0, 0.6, lt)) });
    MAX.restore();
  }
  if (m > 0) {
    MBX.save(); MBX.setTransform(1, 0, 0, 1, 0, 0);
    const g = ss(4.6, 5.2, lt);
    cam(MBX, lerp(1.9, 1, m), CX, CY, 1); if (g > 0) shake(MBX, 18 * g);
    room2View(MBX, lt, gt, g);
    MBX.restore();
  }
  if (m <= 0) c.drawImage(MA, 0, 0);
  else if (m >= 1) c.drawImage(MB, 0, 0);
  else {
    c.drawImage(MB, 0, 0);
    c.save(); c.globalAlpha = 1 - m; c.translate(CX, CY); c.scale(1 - 0.6 * m, 1 - 0.6 * m); c.rotate(m * 0.5); c.translate(-CX, -CY); c.drawImage(MA, 0, 0); c.restore();
  }
}
// ---------- S7 Doctor Who interruption ----------
function s7(c, lt, gt) {
  c.save();
  c.save(); c.translate(CX, CY); c.scale(1.5, 1.5); c.translate(-CX, -CY); c.drawImage(layer('room2', room2), 0, 0); c.restore();
  c.fillStyle = 'rgba(20,10,30,0.35)'; c.fillRect(0, 0, W, H);
  cam(c, 1 + 0.05 * ss(0, 5, lt));
  let name = 'scifi', fx = { noise: 0.12, staticA: 0.8 * (1 - ss(0, 0.5, lt)), tear: 0.4 * (1 - ss(0, 0.6, lt)) };
  if (lt > 2.2) {
    const roll = 3 * SH * ss(2.2, 3.7, lt);
    name = lt > 2.85 ? 'pirate' : 'scifi';
    fx = name === 'pirate' ? pirFX(lt) : { noise: 0.3, tear: 0.3 };
    fx.roll = roll; fx.staticA = Math.max(fx.staticA || 0, 0.4 * (1 - ss(2.9, 3.6, lt)) * ss(2.2, 2.6, lt));
    if (lt > 2.75 && lt < 2.95) fx.staticA = 1;
  }
  if (name === 'pirate') shake(c, 8);
  const img = screen(name, gt, fx);
  const r = drawTVc(c, 540, 1110, 1220, img, { seed: 370, kind: 'console' });
  screenGlow(c, r, name === 'pirate' ? 'rgba(196,106,158,1)' : 'rgba(110,220,200,1)', 0.32);
  const lean = ss(3.0, 3.6, lt);
  viewer(c, 260, 1830 - lean * 30, 1.1, CYAN, 0.04 + lean * 0.08, 720);
  viewer(c, 830, 1840 - lean * 30, 1.15, CYAN, -0.04 - lean * 0.08, 730);
  c.restore();
}
// ---------- S8 90 seconds ----------
function stopwatch(c, x, y, r, lt) {
  P(c, 'rectangle', [x - 26, y - r - 70, 52, 50], { fill: '#b9bcc2', sw: 3, seed: 660, gap: 4 });
  P(c, 'rectangle', [x - 40, y - r - 92, 80, 26], { fill: '#d1d4d9', sw: 3, seed: 661, gap: 4 });
  P(c, 'circle', [x, y, r * 2.2], { fill: '#a7abb3', hfill: '#8c919a', sw: 4, seed: 662, gap: 5 });
  P(c, 'circle', [x, y, r * 1.9], { fill: '#f4eedf', hfill: '#e4dac4', sw: 3, seed: 663, gap: 8 });
  const prog = ss(0, 3.9, lt) * 1.75 * Math.PI;
  c.save(); c.globalAlpha = 0.45; c.fillStyle = MAG; c.beginPath(); c.moveTo(x, y); c.arc(x, y, r * 0.86, -Math.PI / 2, -Math.PI / 2 + prog); c.closePath(); c.fill(); c.restore();
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; const l = i % 5 ? 0.88 : 0.8; c.strokeStyle = INK; c.lineWidth = i % 5 ? 2 : 4; c.beginPath(); c.moveTo(x + Math.cos(a) * r * l, y + Math.sin(a) * r * l); c.lineTo(x + Math.cos(a) * r * 0.93, y + Math.sin(a) * r * 0.93); c.stroke(); }
  P(c, 'circle', [x, y + r * 0.42, r * 0.5], { sw: 2.5, seed: 664 });
  const sa = -Math.PI / 2 + lt * Math.PI * 2 / 1.25; const sub = -Math.PI / 2 + prog;
  P(c, 'line', [x, y + r * 0.42, x + Math.cos(sub) * r * 0.2, y + r * 0.42 + Math.sin(sub) * r * 0.2], { sw: 4, seed: 665, r: 0.4 });
  P(c, 'line', [x - Math.cos(sa) * r * 0.15, y - Math.sin(sa) * r * 0.15, x + Math.cos(sa) * r * 0.86, y + Math.sin(sa) * r * 0.86], { sw: 5, stroke: '#b8312f', seed: 666, r: 0.4 });
  P(c, 'circle', [x, y, 22], { fill: INK, sw: 2, seed: 667, hatch: false });
}
function s8(c, lt, gt) {
  c.save(); navyWash(c, -20, -20, W + 40, H + 40, '#2a2556', 680, 5);
  glow(c, 540, 900, 700, 'rgba(196,106,158,1)', 0.18 + 0.06 * Math.sin(lt * 5));
  cam(c, 1, CX, CY, 0.8);
  c.save(); shake(c, 10); c.rotate(noise1(lt * 3) * 0.015);
  const fx = pirFX(lt + 1.1); fx.bleed = 1; fx.rgb += 1.5 * Math.abs(Math.sin(lt * 4));
  const img = screen('pirate', gt, fx, { perf: 0.45 });
  const r = drawTVc(c, 540, 860, 760, img, { seed: 380 });
  screenGlow(c, r, 'rgba(111,201,207,1)', 0.32); c.restore();
  stopwatch(c, 540, 1590, 215, lt);
  c.restore();
}
// ---------- S9 bizarre performance ----------
function s9(c, lt, gt) {
  c.save(); navyWash(c, -20, -20, W + 40, H + 40, '#1f2250', 690, 5);
  cam(c, 1 + 0.04 * ss(0, 6.3, lt));
  const st = lt >= 6.35 && lt < 6.62, back = lt >= 6.62;
  let name = back ? 'scifi' : st ? 'static' : 'pirate', fx;
  if (st) fx = { staticA: 1, tear: 1.5, rgb: 6 };
  else if (back) fx = { noise: 0.06 };
  else { fx = pirFX(lt + 2.3); fx.rgb += 1; shake(c, 7); }
  const turn = Math.tanh(4 * Math.sin(lt * 1.9)) * 0.9;
  const img = screen(name, gt, fx, { perf: 1, turn });
  const r = drawTVc(c, 540, 1060, 1300, img, { seed: 390 });
  screenGlow(c, r, back ? 'rgba(110,220,200,1)' : 'rgba(196,106,158,1)', 0.3);
  c.restore();
  wavePanel(c, 120, 1700, 840, 130, lt, back ? 'calm' : 'broken');
}
// ---------- S10 FCC investigation ----------
function paper(c, x, y, w, h, rot, seed, inner) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = 'rgba(40,30,20,0.18)'; c.fillRect(-w / 2 + 8, -h / 2 + 10, w, h);
  P(c, 'rectangle', [-w / 2, -h / 2, w, h], { fill: '#fbf6ea', sw: 2.5, seed, gap: 14, hatchA: 0.3 });
  inner && inner(c, w, h); c.restore();
}
function inTower(c, w, h) {
  for (let i = 0; i < 9; i++) P(c, 'line', [-w / 2 + 10, -h / 2 + i * h / 8, w / 2 - 10, -h / 2 + i * h / 8], { sw: 1, stroke: '#9fc0d8', seed: 1000 + i, r: 0.4 });
  tower(c, -w * 0.15, h * 0.4, h * 0.75, '#2c4a7a', 1010, false);
  signalArcs(c, -w * 0.15, -h * 0.35, 4, '#c94a6a', 0.9, T * 0.6, 0);
}
function inMap(c, w, h) {
  P(c, 'polygon', [[[w * 0.22, -h / 2 + 6], [w / 2 - 6, -h / 2 + 6], [w / 2 - 6, h / 2 - 6], [w * 0.15, h / 2 - 6], [w * 0.2, 0]]], { fill: '#8fc0d8', sw: 2, seed: 1020, gap: 5 });
  for (let i = 0; i < 6; i++) P(c, 'line', [-w / 2 + 10, -h / 2 + 20 + i * 40, w * 0.18, -h / 2 + 20 + i * 40], { sw: 1.2, stroke: '#a89c88', seed: 1021 + i, r: 0.5 });
  for (let i = 0; i < 6; i++) P(c, 'line', [-w / 2 + 20 + i * 45, -h / 2 + 8, -w / 2 + 20 + i * 45, h / 2 - 8], { sw: 1.2, stroke: '#a89c88', seed: 1030 + i, r: 0.5 });
  const pts = [[-w * 0.3, -h * 0.25], [w * 0.05, h * 0.2], [-w * 0.1, -h * 0.05]];
  c.save(); c.setLineDash([8, 7]); c.strokeStyle = '#c94a6a'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[2][0], pts[2][1]); c.lineTo(pts[1][0], pts[1][1]); c.stroke(); c.restore();
  for (const p of pts) P(c, 'polygon', [[[p[0] - 9, p[1] + 12], [p[0], p[1] - 14], [p[0] + 9, p[1] + 12]]], { fill: '#2c4a7a', sw: 2, seed: 1040, hatch: false });
}
function inDiagram(c, w, h) {
  const bx = [[-w * 0.36, -h * 0.15], [-w * 0.05, -h * 0.15], [w * 0.26, -h * 0.15], [-w * 0.05, h * 0.22]];
  for (let i = 0; i < bx.length; i++) P(c, 'rectangle', [bx[i][0] - 34, bx[i][1] - 26, 68, 52], { fill: i === 3 ? '#cfe6c8' : '#e8e2f0', sw: 2.2, seed: 1050 + i, gap: 6 });
  P(c, 'line', [bx[0][0] + 34, bx[0][1], bx[1][0] - 34, bx[1][1]], { sw: 2.2, seed: 1060 }); P(c, 'line', [bx[1][0] + 34, bx[1][1], bx[2][0] - 34, bx[2][1]], { sw: 2.2, seed: 1061 });
  P(c, 'line', [bx[1][0], bx[1][1] + 26, bx[3][0], bx[3][1] - 26], { sw: 2.2, seed: 1062 });
  const pts = []; for (let i = 0; i <= 20; i++) pts.push([bx[3][0] - 28 + i * 2.8, bx[3][1] + Math.sin(i * 0.9 + T * 4) * 12]); pencilLine(c, pts, '#3a7a3a', 2.5);
}
function inPhoto(c, w, h) {
  P(c, 'rectangle', [-w / 2 + 14, -h / 2 + 14, w - 28, h * 0.68], { fill: '#5a6a80', sw: 2, seed: 1070, gap: 5 });
  P(c, 'rectangle', [-w * 0.3, -h * 0.05, w * 0.36, h * 0.2], { fill: '#2c3242', sw: 2, seed: 1071, gap: 4 });
  const pts = []; for (let i = 0; i <= 16; i++) pts.push([-w * 0.27 + i * w * 0.019, h * 0.05 + Math.sin(i * 1.1 + T * 5) * 8]); pencilLine(c, pts, AGREEN, 2.5);
  person(c, w * 0.18, -h * 0.02, 0.38, '#c96f4a', -0.6, 1080); person(c, -w * 0.33, -h * 0.12, 0.3, '#e0d8c8', -0.2, 1090);
}
function s10(c, lt) {
  c.save(); c.drawImage(layer('desk', (d) => { P(d, 'rectangle', [-20, -20, W + 40, H + 40], { fill: '#bf9f72', hfill: '#a8875a', solid: 0.85, gap: 8, sw: 0, stroke: 'none', seed: 1100, angle: 5, r: 1.6 }); for (let i = 0; i < 14; i++) P(d, 'line', [-20, 480 + i * 105 + hash(i) * 30, W + 20, 470 + i * 105], { sw: 2, stroke: '#8a6a44', seed: 1101 + i, alpha: 0.5, r: 2 }); }), 0, 0);
  cam(c, 1.02 - 0.02 * ss(0, 3.7, lt));
  const open = ss(0.15, 0.7, lt);
  const items = [
    [0.45, -195, -130, 320, 250, -0.06, 1200, inTower, -700, -300],
    [0.95, 190, -140, 330, 260, 0.05, 1201, inMap, 800, -200],
    [1.45, -180, 150, 320, 230, 0.04, 1202, inDiagram, -800, 500],
    [2.35, 60, 30, 230, 250, 0.13, 1203, inPhoto, 300, 900],
  ];
  folder(c, 540, 1180, 880, open, -0.03, {
    inside: (d) => {
      for (const it of items) { const p = ss(it[0], it[0] + 0.5, lt); if (p <= 0) continue; paper(d, lerp(it[8], it[1], p), lerp(it[9], it[2], p), it[3], it[4], it[5] + (1 - p) * 0.6, it[6], it[7]); }
      const pv = ss(1.9, 2.4, lt); if (pv > 0) vhsTape(d, lerp(700, 220, pv), lerp(700, 170, pv), 250, -0.12 + (1 - pv), 1210);
    }
  });
  c.restore();
}
// ---------- S11 never identified ----------
function s11(c, lt, gt) {
  c.save(); navyWash(c, -20, -20, W + 40, H + 40, '#1b1d45', 1300, 5);
  cam(c, 1.03 - 0.03 * ss(0, 7, lt), CX, CY, 0.6);
  // dim striped backdrop remnant
  c.save(); c.beginPath(); c.roundRect(110, 560, 860, 980, 60); c.clip(); c.globalAlpha = 0.22 * (1 - ss(4, 6.5, lt));
  c.translate(540, 1050); c.rotate(0.3 * Math.sin(lt * 0.6)); for (let x = -900, i = 0; x < 900; x += 60, i++) { c.fillStyle = i % 2 ? '#8fa4b0' : '#2d3450'; c.fillRect(x, -900, 61, 1800); } c.restore();
  // silhouette body
  const fade = 1 - 0.5 * ss(4.5, 6.5, lt);
  c.save(); c.globalAlpha = fade; c.translate(540, 1560); c.scale(3, 3);
  P(c, 'polygon', [[[-125, 0], [-108, -98], [-46, -126], [46, -126], [108, -98], [125, 0]]], { fill: '#0e0f2a', sw: 1.4, seed: 1310, gap: 3, stroke: '#8f93c9', solid: 0.95 });
  P(c, 'rectangle', [-17, -150, 34, 30], { fill: '#0e0f2a', sw: 1.2, seed: 1311, stroke: '#8f93c9', solid: 0.95, hatch: false });
  // empty head: dashed outline, no face
  const em = ss(1.6, 2.6, lt);
  c.save(); c.translate(0, -152); c.globalAlpha = fade * (0.4 + 0.6 * em);
  c.setLineDash([6, 5]); c.strokeStyle = '#a6aadb'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, -30, 60, 72, 0, 0, 7); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(14,15,42,0.9)'; c.beginPath(); c.ellipse(0, -30, 58, 70, 0, 0, 7); c.fill();
  c.restore(); c.restore();
  // question-like pencil hooks drifting
  for (let i = 0; i < 6; i++) {
    const a = ss(1.9 + i * 0.25, 2.6 + i * 0.25, lt) * (1 - ss(5.5, 6.5, lt)); if (a <= 0) continue;
    const ang = i * 1.05 + lt * 0.15, rad = 300 + 30 * Math.sin(lt + i);
    const x = 540 + Math.cos(ang) * rad, y = 1040 + Math.sin(ang) * rad * 0.8, s = 0.7 + hash(i) * 0.5;
    c.save(); c.translate(x, y); c.rotate(Math.sin(lt * 0.8 + i) * 0.3); c.scale(s, s); c.globalAlpha = a * 0.45;
    pencilLine(c, [[-22, -30], [-10, -46], [12, -46], [24, -30], [20, -12], [4, 0], [0, 18]], '#b9bce6', 4); c.beginPath(); c.fillStyle = '#b9bce6'; c.arc(0, 36, 4, 0, 7); c.fill(); c.restore();
  }
  // floating mask
  const mf = ss(1.5, 4.8, lt);
  c.save(); c.translate(540 + mf * 230, 1560 - 152 * 3 + 0 - mf * 330 + Math.sin(lt * 1.3) * 10 * mf); c.rotate(mf * 0.5 + Math.sin(lt) * 0.05 * mf); c.scale(3 - mf * 0.9, 3 - mf * 0.9);
  c.globalAlpha = 1 - 0.55 * ss(3.5, 6.5, lt);
  pirateHead(c, 0.6, { noPos: true, maskOnly: true }, 0); c.restore();
  // towers + signal paths fading out
  const tw = [[150, 1830, 300, 3.1], [930, 1830, 330, 3.8], [560, 1880, 180, 4.5]];
  for (let i = 0; i < 3; i++) { const [x, yb, h, tf] = tw[i]; const a = 1 - ss(tf, tf + 0.8, lt); c.save(); c.globalAlpha = 0.35 + 0.65 * a; tower(c, x, yb, h, '#6a6fae', 1320 + i * 40, a > 0.3); c.restore(); if (a > 0) signalArcs(c, x, yb - h, 4, CYAN, a * 0.7, lt, -Math.PI / 2 + (i - 1) * 0.4); }
  c.restore();
  // folder closes with ? stamp
  const fi = ss(4.6, 5.2, lt);
  if (fi > 0) { c.save(); c.translate(0, (1 - fi) * 700); folder(c, 540, 1420, 600, 1 - ss(5.0, 5.6, lt), -0.05, { stamp: ss(5.85, 6.05, lt), inside: (d, w, h) => { paper(d, -60, -20, 300, 220, -0.05, 1340, inMap); paper(d, 120, 20, 260, 200, 0.06, 1341, inTower); } }); c.restore(); }
}
// ---------- S12 across decades ----------
function devCRT(c, img) { const r = drawTVc(c, 540, 1110, 880, img, { seed: 400 }); stand(c, 540, r.y + r.h + 85, 760, 80, 401); screenGlow(c, r, 'rgba(111,201,207,1)', 0.25); }
function devVHS(c, img, lt) {
  const r = drawTVc(c, 540, 1030, 700, img, { seed: 410 });
  c.save(); rrClip(c, r.sx, r.sy, r.sw, r.sh, 30); c.globalAlpha = 0.55; c.imageSmoothingEnabled = false;
  const by = r.sy + r.sh * (0.7 + 0.15 * Math.sin(lt * 2)); c.drawImage(staticFrame(3), 0, 0, 180, 20, r.sx, by, r.sw, 40); c.restore();
  P(c, 'rectangle', [300, r.y + r.h + 70, 480, 90], { fill: '#2b2a33', sw: 3, seed: 411, gap: 4 });
  P(c, 'rectangle', [340, r.y + r.h + 95, 260, 22], { fill: '#111', sw: 2, seed: 412, hatch: false });
  c.fillStyle = AGREEN; c.fillRect(650, r.y + r.h + 100, 70, 14);
  const ins = ss(0.2, 1.0, lt); vhsTape(c, lerp(470, 470, ins), lerp(r.y + r.h + 290, r.y + r.h + 140, ins), 230, 0, 1220);
  for (let i = 0; i < 4; i++) vhsTape(c, 150 + (i % 2) * 6, 1720 - i * 70, 200, (hash(i) - 0.5) * 0.12, 1230 + i * 10);
  for (let i = 0; i < 3; i++) vhsTape(c, 930 - (i % 2) * 8, 1720 - i * 70, 200, (hash(i + 5) - 0.5) * 0.12, 1270 + i * 10);
  screenGlow(c, r, 'rgba(111,201,207,1)', 0.22);
}
function devPC(c, img, lt) {
  P(c, 'path', [rrPath(160, 700, 760, 660, 40)], { fill: '#d9cfb4', hfill: '#bfb394', sw: 3.5, seed: 420, gap: 6 });
  P(c, 'polygon', [[[420, 1360], [660, 1360], [700, 1430], [380, 1430]]], { fill: '#cfc4a6', sw: 3, seed: 421, gap: 6 });
  P(c, 'path', [rrPath(220, 760, 640, 480, 26)], { fill: '#1d4a4a', sw: 3, seed: 422, gap: 5 });
  P(c, 'rectangle', [270, 800, 540, 400], { fill: '#c9c9cf', sw: 2.5, seed: 423, gap: 8 });
  P(c, 'rectangle', [270, 800, 540, 30], { fill: '#3a4a8a', sw: 2, seed: 424, gap: 3 });
  for (let i = 0; i < 3; i++) P(c, 'rectangle', [732 + i * 24, 806, 16, 16], { fill: '#d9d9de', sw: 1.5, seed: 425 + i, hatch: false });
  blitScreen(c, img, 290, 840, 500, 320, 4);
  P(c, 'rectangle', [290, 1170, 500, 14], { fill: '#8a8a92', sw: 1.5, seed: 430, hatch: false });
  c.fillStyle = '#3a4a8a'; c.fillRect(292, 1172, 496 * (0.2 + 0.5 * ss(0, 2.3, lt)), 10);
  P(c, 'polygon', [[[150, 1520], [930, 1520], [990, 1650], [90, 1650]]], { fill: '#d9cfb4', sw: 3, seed: 431, gap: 6 });
  for (let j = 0; j < 3; j++) for (let i = 0; i < 14; i++) P(c, 'rectangle', [150 + i * 55 - j * 10, 1540 + j * 34, 44, 24], { fill: '#efe8d4', sw: 1.5, seed: 432 + i + j * 14, hatch: false, r: 0.6 });
  glow(c, 540, 1000, 500, 'rgba(111,201,207,1)', 0.18);
}
function devPhone(c, img, lt) {
  glow(c, 540, 1180, 600, 'rgba(196,106,158,1)', 0.2);
  P(c, 'path', [rrPath(305, 640, 470, 1000, 64)], { fill: '#15151d', sw: 4, seed: 440, gap: 4, solid: 0.95 });
  P(c, 'path', [rrPath(325, 670, 430, 940, 44)], { fill: '#26263a', sw: 2, seed: 441, gap: 6 });
  blitScreen(c, img, 325, 860, 430, 322, 6);
  P(c, 'rectangle', [345, 1205, 390, 8], { fill: '#55556a', sw: 1, seed: 442, hatch: false }); c.fillStyle = MAG; c.fillRect(346, 1206, 388 * ss(0, 2.8, lt), 6);
  for (let i = 0; i < 3; i++) { const a = ss(0.4 + i * 0.5, 0.8 + i * 0.5, lt); if (a <= 0) continue; c.save(); c.globalAlpha = a; P(c, 'path', [rrPath(345, 1240 + i * 110, 300, 84, 24)], { fill: '#3a3a55', sw: 2, seed: 443 + i, gap: 5 }); for (let k = 0; k < 2; k++) P(c, 'line', [370, 1268 + i * 110 + k * 26, 370 + 220 - k * 80, 1268 + i * 110 + k * 26], { sw: 3, stroke: '#9a9ac0', seed: 446 + i * 2 + k, r: 0.8 }); c.restore(); }
  for (let i = 0; i < 6; i++) { const p = ((lt * 0.6 + i / 6) % 1); const x = 700 + Math.sin(p * 9 + i) * 18, y = 1560 - p * 520; c.save(); c.globalAlpha = Math.sin(p * Math.PI) * 0.9; c.translate(x, y); c.scale(0.8 + 0.4 * hash(i), 0.8 + 0.4 * hash(i)); P(c, 'path', ['M0,10 C-26,-8 -14,-28 0,-14 C14,-28 26,-8 0,10 Z'], { fill: '#e2546a', sw: 2, seed: 450 + i, gap: 3 }); c.restore(); }
}
function s12(c, lt, gt) {
  c.save();
  c.drawImage(layer('s12bg', (d) => { d.drawImage(PAPER, 0, 0); P(d, 'circle', [540, 1150, 1300], { fill: '#d9d2e6', solid: 0.4, gap: 10, sw: 0, stroke: 'none', seed: 1400, hatchA: 0.4 }); }), 0, 0);
  cam(c, 1, CX, CY, 0.7);
  const fx = { noise: 0.35, ghost: 0.4, rgb: 1.5, tear: 0.1 + bursts(lt, [1.9, 4.1, 6.4], 0.3) * 1.2, bleed: 0.4, staticA: bursts(lt, [1.9, 4.1, 6.4], 0.3) * 0.6 };
  const img = screen('pirate', gt, fx);
  const ph = [0, 1.9, 4.1, 6.4], fns = [(d) => devCRT(d, img), (d) => devVHS(d, img, lt - 1.9), (d) => devPC(d, img, lt - 4.1), (d) => devPhone(d, img, lt - 6.4)];
  let k = 0; for (let i = 0; i < 4; i++) if (lt >= ph[i]) k = i;
  const tm = k < 3 ? ss(ph[k + 1] - 0.25, ph[k + 1] + 0.25, lt) : 0;
  const prevM = k > 0 ? ss(ph[k] - 0.25, ph[k] + 0.25, lt) : 1;
  const drawDev = (i, a, s) => { if (a <= 0) return; c.save(); c.globalAlpha = 1; c.translate(CX, CY); c.scale(s, s); c.translate(-CX, -CY);
    MAX.save(); MAX.setTransform(1, 0, 0, 1, 0, 0); MAX.clearRect(0, 0, W, H); fns[i](MAX); MAX.restore(); c.globalAlpha = a; c.drawImage(MA, 0, 0); c.restore(); };
  if (prevM < 1) { drawDev(k - 1, 1 - prevM, 1 - 0.08 * prevM); drawDev(k, prevM, 1.08 - 0.08 * prevM); }
  else drawDev(k, 1, 1 + 0.03 * Math.sin(lt));
  c.restore();
}
// ---------- S13 final ----------
function night(d) {
  navyWash(d, -20, -20, W + 40, H + 40, '#23265a', 1500, 5);
  for (let i = 0; i < 70; i++) { d.fillStyle = 'rgba(255,250,230,0.8)'; d.fillRect(hash(i * 2.3) * W, 460 + hash(i * 4.1) * 600, 2.5, 2.5); }
  skyline(d, -30, 1520, 1.12, '#151838', true, 1510);
  P(d, 'rectangle', [-20, 1600, W + 40, 400], { fill: '#3b2a24', hfill: '#2a1d18', sw: 3.5, seed: 1550, gap: 6 });
}
function s13(c, lt, gt) {
  c.save(); cam(c, 1.06 - 0.06 * ss(0, 6.5, lt), CX, CY, 0.6);
  c.drawImage(layer('night', night), 0, 0);
  tower(c, 950, 1520, 640, '#0f1130', 1560);
  signalArcs(c, 950, 880, 4, CYAN, 0.35, lt, -Math.PI / 2);
  const img = screen('pirate', 3.3, { noise: 0.55, ghost: 0.35, rgb: 1.8, staticA: 0.12 + bursts(lt, [0.3, 2.0, 3.7], 0.3) * 0.5, tear: 0.08 + bursts(lt, [0.3, 2.0, 3.7], 0.3) * 0.8, bleed: 0.4 });
  const r = drawTVc(c, 520, 1180, 700, img, { seed: 1570 });
  screenGlow(c, r, 'rgba(111,201,207,1)', 0.4);
  folder(c, 150, 1730, 520, 0, -0.2, { stamp: 1 });
  vhsTape(c, 800, 1690, 230, 0.12, 1580);
  c.restore();
}

// ---------- compositor ----------
const SCN = [[0, s1], [7.45, s2], [13.85, s3], [18.6, s4], [23.95, s5], [25.95, s6], [33.1, s7], [38.15, s8], [42.05, s9], [50.0, s10], [53.7, s11], [60.7, s12], [69.9, s13]];
const TRN = [null, 'static', 'zoom', 'static', 'iris', 'cut', 'zoom', 'static', 'zoom', 'static', 'iris', 'static', 'iris'];
const TD = 0.3;
function drawScene(c, i, gt) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; SCN[i][1](c, Math.max(0, gt - SCN[i][0]), gt); c.restore(); }
function fullStatic(c, a, tear) {
  c.save(); c.globalAlpha = a; c.imageSmoothingEnabled = false;
  for (let y = 0; y < H; y += 384) { const off = tear ? (hash(y + FR) - 0.5) * 120 * tear : 0; for (let x = -540; x < W + 540; x += 540) c.drawImage(staticFrame(y / 384), x + off, y, 540, 384); }
  c.restore();
}
function render(frame) {
  FR = frame; T = frame / FPS; BOIL = Math.floor(T * 6) % 3;
  const gt = T; let i = 0; for (let k = 0; k < SCN.length; k++) if (gt >= SCN[k][0]) i = k;
  let a = -1, b = -1, m = 0;
  if (i + 1 < SCN.length && gt > SCN[i + 1][0] - TD && TRN[i + 1] !== 'cut') { a = i; b = i + 1; m = (gt - (SCN[b][0] - TD)) / (2 * TD); }
  else if (i > 0 && gt < SCN[i][0] + TD && TRN[i] !== 'cut') { a = i - 1; b = i; m = (gt - (SCN[b][0] - TD)) / (2 * TD); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (a < 0) drawScene(ctx, i, gt);
  else {
    const typ = TRN[b];
    drawScene(TAX, a, gt); drawScene(TBX, b, gt);
    if (typ === 'static') {
      const e = ss(0.4, 0.6, m); ctx.drawImage(e < 0.5 ? TA : TB, 0, 0);
      fullStatic(ctx, Math.sin(Math.PI * m) * 0.9, 1);
    } else if (typ === 'zoom') {
      ctx.save(); ctx.globalAlpha = 1; ctx.translate(CX, CY); const sb = 0.75 + 0.25 * ss(0, 1, m); ctx.scale(sb, sb); ctx.translate(-CX, -CY); ctx.drawImage(TB, 0, 0); ctx.restore();
      ctx.save(); ctx.globalAlpha = 1 - ss(0.25, 0.95, m); ctx.translate(CX, CY); const sa = 1 + 1.8 * m * m; ctx.scale(sa, sa); ctx.translate(-CX, -CY); ctx.drawImage(TA, 0, 0); ctx.restore();
      fullStatic(ctx, Math.sin(Math.PI * m) * 0.25, 0.5);
    } else {
      ctx.drawImage(TA, 0, 0);
      const R = ss(0, 1, m) * 1500; ctx.save(); ctx.beginPath();
      for (let k = 0; k <= 48; k++) { const ang = k / 48 * Math.PI * 2, rr = R * (1 + 0.06 * noise1(k * 0.7 + BOIL * 3)); const x = CX + Math.cos(ang) * rr, y = CY + Math.sin(ang) * rr; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.save(); ctx.clip(); ctx.drawImage(TB, 0, 0); ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.globalAlpha = 0.7 * (1 - m); ctx.stroke(); ctx.restore();
    }
  }
  // paper grain over everything
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.drawImage(GRAIN, -(BOIL * 13 % 40), -(BOIL * 7 % 40)); ctx.restore();
  // soft vignette
  ctx.save(); const vg = ctx.createRadialGradient(CX, 1200, 500, CX, 1200, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,30,0.35)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); ctx.restore();
  drawCaption(ctx, gt);
  watermark(ctx, gt);
  ctx.restore();
}
window.renderFrame = (f, q = 0.92) => { render(f); return cv.toDataURL('image/jpeg', q); };
window.ready = (async () => {
  await Promise.all(['700 60px Kalam', '400 60px Kalam', '400 60px Caveat', '700 60px Caveat'].map(f => document.fonts.load(f, 'İğşçöüıâ’…')));
  await document.fonts.ready; buildPaper(); buildStatic(); buildScan(); return true;
})();
