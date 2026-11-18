// ---------- timeline ----------
const CAPS = [
  [0.07, '1875’te Dublin sokaklarından gerçekten yanan viski aktı.'],
  [5.50, '18 Haziran gecesi Dublin’in The Liberties bölgesindeki büyük bir içki deposunda yangın çıktı.'],
  [12.41, 'Depolarda binlerce fıçı viski ve başka içkiler bulunuyordu.'],
  [17.10, 'Alevler fıçılara ulaştığında bazıları parçalandı.'],
  [20.52, 'Ve içlerindeki alkol yanarak sokaklara akmaya başladı.'],
  [24.48, 'Kısa süre içinde Dublin’in dar sokaklarından alevler içindeki bir viski nehri geçiyordu.'],
  [30.62, 'Bazı yerlerde bu akış yüzlerce metre boyunca ilerledi.'],
  [35.15, 'İtfaiye, polis ve askerler yangını kontrol altına almaya çalışırken çevrede yaşayan insanlar tahliye edildi.'],
  [43.14, 'Ama sonra olay daha da garipleşti.'],
  [46.12, 'Bazı insanlar sokaklardan akan viskiyi kaplarla toplamaya başladı.'],
  [50.86, 'Hatta dönemin gazeteleri, bazı kişilerin ayakkabılarını çıkarıp viskiyi onların içine doldurarak içtiğini bile yazdı.'],
  [59.05, 'Yangın sonunda kontrol altına alındı.'],
  [61.89, 'Ama olayda hayatını kaybeden 13 kişinin hiçbiri alevlerden ya da dumandan ölmedi.'],
  [68.43, 'Ölümlerin nedeni, sokaktan topladıkları güçlü içkileri aşırı miktarda içmeleri sonucu oluşan alkol zehirlenmesiydi.'],
  [77.05, 'Yani Dublin’de yanan bir viski nehri sokaklardan geçti…'],
  [81.31, 'ama insanları öldüren şey yangın değil, viskinin kendisi oldu.'],
];
const END17A = 86.56, END17B = 87.94, NARR_END = 89.49;
const ARCH_IN = 90.75, VIDEO_END = 94.4;

function applyCam(cx, cy, z, ax = 540, ay = 1150) { ctx.translate(ax, ay); ctx.scale(z, z); ctx.translate(-cx, -cy); }
function bg(col) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(PAPER, 0, 0); if (col) { ctx.globalAlpha = col[1]; ctx.fillStyle = col[0]; ctx.fillRect(0, 0, W, H); } ctx.restore(); }
function wash(x, y, w, h, col, a) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(x, y, w, h); ctx.globalAlpha = a * .6; ctx.fillStyle = GRAINPAT; ctx.fillRect(x, y, w, h); ctx.restore(); }

// ---------- STREET (perspective lane): scenes 1, 15, 16, 17 ----------
const LF = [[-80, 260], [420, 850], [420, 1150], [-80, 1780]];
const RF = [[660, 850], [1160, 260], [1160, 1780], [660, 1150]];
function qmap(q, u, v) { const t = [lerp(q[0][0], q[1][0], u), lerp(q[0][1], q[1][1], u)], b = [lerp(q[3][0], q[2][0], u), lerp(q[3][1], q[2][1], u)]; return [lerp(t[0], b[0], v), lerp(t[1], b[1], v)]; }
function qrect(q, u0, u1, v0, v1) { return [qmap(q, u0, v0), qmap(q, u1, v0), qmap(q, u1, v1), qmap(q, u0, v1)]; }
const STREET_PATH = { pts: [[150, 1355], [250, 1385], [360, 1440], [460, 1520], [530, 1620], [560, 1740], [545, 1860], [520, 2000]] };
function streetWidth(s) { return lerp(46, 230, Math.pow(s, 1.25)); }
function streetScene(o) {
  const lightK = o.glow ?? 1;
  // sky
  wash(0, 0, W, 1200, '#f2c48a', .35 * lightK);
  glow(540, 900, 650, 'rgba(240,120,40,1)', .22 * lightK);
  // far smoke
  smokeColumn(540, 760, 8, 260, -5, .35, .8, 11);
  // far building
  building(420, 1150, 240, 420, C.brickL, { cols: 2, rows: 2, ww: 40, wh: 58, lit: (i, j) => .6 + .4 * Math.sin(T * 5 + i + j), chimney: .3 });
  // facades
  const fac = (q, col, flip) => {
    shape(q, col, { lw: 3.5, step: 40 });
    ctx.save(); ctx.globalAlpha = .2; for (let v = .06; v < 1; v += .05) line([qmap(q, 0, v), qmap(q, 1, v)], C.brickD, 2, { amp: 1 }); ctx.restore();
    const us = [[.04, .2], [.32, .44], [.55, .62], [.8, .86]];
    us.forEach((u, i) => [[.12, .26], [.4, .52]].forEach((v, j) => {
      if (!flip && i === 2) return; // alley on left
      const lit = .55 + .45 * Math.sin(T * 4 + i * 2 + j);
      shape(qrect(q, u[0], u[1], v[0], v[1]), mix('#3c3d5e', '#f1b84f', lit * lightK), { lw: 2.6 });
      line([qmap(q, (u[0] + u[1]) / 2, v[0]), qmap(q, (u[0] + u[1]) / 2, v[1])], C.navy, 2);
    }));
    // doors
    [[.16, .27], [.68, .74]].forEach((u, i) => { if (!flip && i === 1) return; shape(qrect(q, u[0], u[1], .66, 1), '#5b3a2a', { lw: 3 }); });
    line([qmap(q, 0, .6), qmap(q, 1, .6)], C.char, 5);
  };
  fac(LF, '#c0644a', false); fac(RF, '#a9503c', true);
  // alley gap on left facade
  shape(qrect(LF, .55, .63, .2, 1), '#3b2a2a', { lw: 3 });
  glow(qmap(LF, .59, .9)[0], qmap(LF, .59, .9)[1], 140, 'rgba(255,140,40,1)', .4 * lightK);
  // ground
  const ground = [[420, 1150], [660, 1150], [1160, 1780], [1160, 1990], [-80, 1990], [-80, 1780]];
  shape(ground, C.cob, { lw: 3, step: 60 });
  const r = staticRng(21);
  ctx.save(); ctx.globalAlpha = .45;
  for (let i = 0; i < 140; i++) { const v = Math.pow(r(), .7); const y = lerp(1160, 1960, v); const half = lerp(120, 640, v); const x = 540 + (r() - .5) * 2 * half; const s = lerp(.25, 1.3, v); ell(x, y, 22 * s, 9 * s, null, { stroke: '#8a7a68', lw: 2 * s, n: 8 }); }
  ctx.restore();
  if (o.extras) o.extras('back');
  stream(STREET_PATH, { reveal: o.reveal ?? 1, burn: o.burn ?? 1, fl: o.fl ?? 1, wfn: streetWidth, w: 120, dark: o.dark || 0, alpha: o.alpha ?? 1, flameScale: .9, speed: 200, seed: 4 });
  if (o.extras) o.extras('front');
}

// ---------- scene functions ----------
function sc1(t) { // hook
  bg();
  const k = ease(prog(t, 0.9, 2.4));
  const z = lerp(1.55, 1, k), cx = lerp(380, 540, k), cy = lerp(1420, 1150, k);
  ctx.save(); applyCam(cx, cy, z);
  streetScene({ reveal: lerp(.3, 1, eout(prog(t, 0, 3.4))), burn: eout(prog(t, .45, 1.6)), fl: eout(prog(t, .45, 1.1)), glow: .4 + .6 * prog(t, .5, 1.5) });
  ctx.restore();
}
function cityMap(t, amberK) {
  bg(['#e9d9b6', .4]);
  const r = staticRng(31);
  // blocks
  for (let i = -2; i < 9; i++) for (let j = -2; j < 13; j++) {
    const x = i * 150 + (j % 2) * 30 - 40, y = j * 170 + 40; if (Math.abs(y - 880) < 90) continue;
    const pts = [[x + 12, y + 12], [x + 138, y + 18], [x + 132, y + 152], [x + 16, y + 146]];
    shape(pts, r() < .5 ? '#e3b79c' : '#dcc7a6', { lw: 2.2, ga: .5, stroke: '#6a6080' });
  }
  // river Liffey
  const riv = { pts: [[-100, 920], [200, 860], [420, 900], [640, 860], [880, 890], [1200, 850]] };
  ctx.save(); ctx.lineCap = 'round';
  const rs = resample(smoothPts(riv.pts, 3), 12);
  ctx.strokeStyle = mix(C.amber, C.blue, amberK); ctx.lineWidth = 80; ctx.globalAlpha = .85; ctx.beginPath(); rs.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  ctx.strokeStyle = mix(C.amberL, C.blueL, amberK); ctx.lineWidth = 6; ctx.setLineDash([30, 50]); ctx.lineDashOffset = -T * 60; ctx.stroke(); ctx.restore();
  line(rs.map(p => [p[0], p[1] - 40]), C.navy, 3); line(rs.map(p => [p[0], p[1] + 40]), C.navy, 3);
  // compass
  ctx.save(); ctx.globalAlpha = .7; ell(930, 1700, 60, 60, null, { lw: 2.5 }); line([[930, 1620], [930, 1780]], C.navy, 3); line([[850, 1700], [1010, 1700]], C.navy, 2); shape([[930, 1610], [945, 1650], [915, 1650]], C.red, { lw: 2 }); ctx.restore();
}
function sc2map(t) {
  const k = ease(prog(t, 6.3, 8.3));
  ctx.save(); applyCam(lerp(540, 380, k), lerp(1150, 1240, k), lerp(1, 2.5, k));
  cityMap(t, eout(prog(t, 5.0, 6.4)));
  // Liberties highlight
  const a = eout(prog(t, 5.9, 6.6));
  if (a > 0) {
    glow(380, 1240, 260, 'rgba(240,120,40,1)', .45 * a);
    ctx.save(); ctx.translate(380, 1240); ctx.rotate(T * .4); ctx.setLineDash([22, 16]);
    ell(0, 0, 175 * a, 150 * a, null, { stroke: C.orange, lw: 7 }); ctx.restore();
    // tiny warehouse icon
    if (t > 6.8) { const b = eout(prog(t, 6.8, 7.4)); rect(340, 1200 - 50 * b, 80, 60 * b, C.brick, { lw: 2 }); flame(395, 1200 - 50 * b, 30 * b, 10, 1); }
  }
  ctx.restore();
}
function warehouseExt(t, push) {
  bg(); wash(0, 0, W, 1400, '#e7b07a', .35); glow(540, 700, 700, 'rgba(240,110,40,1)', .18 + .2 * prog(t, 10, 12));
  // malt house kiln at right
  building(760, 1560, 360, 620, C.brickL, { cols: 2, rows: 3, ww: 40, wh: 60, lit: (i, j) => prog(t, 10.6 + j * .3, 11.4 + j * .3) * (.7 + .3 * Math.sin(T * 6 + i)) });
  shape([[760, 940], [940, 760], [1120, 940]], '#7d6a62', { lw: 3 }); rect(910, 700, 60, 70, '#6a5a52', { lw: 2.5 });
  // main bonded warehouse
  building(-20, 1600, 820, 940, '#b7563d', { cols: 5, rows: 5, ww: 52, wh: 70, lit: (i, j) => prog(t, 9.8 + (4 - j) * .25 + i * .08, 10.6 + (4 - j) * .25 + i * .08) * (.6 + .4 * Math.sin(T * 7 + i * 3 + j)), chimney: .2 });
  // arched doors
  [120, 470].forEach(x => { shape([[x, 1600], [x, 1440], [x + 70, 1390], [x + 140, 1440], [x + 140, 1600]], '#4d3426', { lw: 3.5 }); line([[x + 70, 1395], [x + 70, 1600]], C.navy, 2.5); });
  // roof smoke + flames
  smokeColumn(330, 660, 9, 340, 9.4, .55, 1, 41); smokeColumn(620, 660, 7, 200, 10.2, .5, .8, 43);
  const fk = prog(t, 10.6, 12.2); if (fk > 0) for (let i = 0; i < 7; i++) flame(120 + i * 95, 660, (70 + 40 * Math.sin(i * 2)) * fk, 26, i);
  // street
  shape([[-50, 1600], [1130, 1560], [1130, 1990], [-50, 1990]], C.cob, { lw: 3 });
  ctx.save(); ctx.globalAlpha = .4; const r = staticRng(7); for (let i = 0; i < 60; i++) ell(r() * W, 1620 + r() * 300, 26, 10, null, { stroke: '#8a7a68', lw: 2, n: 8 }); ctx.restore();
  // horse cart parked
  horse(820, 1800, .85, { dir: -1, walk: 0 }); rect(870, 1640, 200, 90, C.wood, { lw: 3 }); caskSide(920, 1610, 70, 80, {}); caskSide(1010, 1610, 70, 80, {}); wheel(900, 1760, 42, .3); wheel(1040, 1760, 42, .3);
}
function sc2ext(t) { const k = prog(t, 8.2, 12.6); ctx.save(); applyCam(lerp(560, 480, k), lerp(1240, 1180, k), lerp(1.05, 1.18, k)); warehouseExt(t); ctx.restore(); }
function sc3(t) { // interior casks, vertical camera rise
  bg(['#7a5235', .55]);
  const k = ease(prog(t, 12.3, 16.9));
  const z = lerp(1, .78, ease(prog(t, 15.2, 17))); const cy = lerp(3150, 1250, k);
  ctx.save(); applyCam(540, cy, z);
  // posts
  for (let x = -260; x < 1400; x += 330) rect(x, -300, 34, 3900, '#5e3a20', { lw: 3, step: 80 });
  for (let tier = 0; tier < 11; tier++) {
    const y = 3400 - tier * 330; if (Math.abs(y - cy) > 1400 / z) continue;
    rect(-300, y + 70, 1700, 30, '#6d4426', { lw: 3, step: 80 });
    for (let i = -2; i < 9; i++) caskEnd(i * 150 + 40 + (tier % 2) * 70, y - 6 - 70 + 40, 66, { col: tier % 3 ? C.wood : C.woodL });
  }
  // worker with lantern for scale at floor
  person(300, 3500, .9, { coat: '#4a4d63', hat: 'cap', hold: 'lantern', armR: 40, look: [1, -1] });
  rect(-300, 3500, 1700, 400, '#5b3c26', { lw: 3 });
  ctx.restore();
  // dim vignette with lantern warmth
  glow(540, 1300, 900, 'rgba(255,190,110,1)', .15);
}
function sc4(t) { // fire reaches casks
  bg(['#6e4a30', .55]);
  ctx.save(); applyCam(540, 1150, lerp(1, 1.08, prog(t, 16.9, 20.6)));
  const fr = lerp(-100, 1250, ease(prog(t, 17.0, 19.4)));
  glow(fr - 200, 820, 700, 'rgba(255,120,40,1)', .35);
  // posts & beam
  [80, 1000].forEach(x => rect(x - 18, 600, 36, 1400, '#5e3a20', { lw: 3 }));
  rect(-100, 790, 1300, 60, '#6d4426', { lw: 3.4 });
  rect(-100, 1560, 1300, 40, '#6d4426', { lw: 3 });
  for (let x = -60; x < fr; x += 46) flame(x, 800, 80 + 30 * Math.sin(x), 26, x * .1);
  // smoke under ceiling
  for (let i = 0; i < 8; i++) smokePuff(i * 160 + Math.sin(T + i) * 30, 640 + Math.sin(T * .7 + i) * 15, 110, .35 * prog(t, 17, 18.5));
  const wob = prog(t, 17.6, 18.6);
  const s1 = eout(prog(t, 18.55, 19.0)), s2 = eout(prog(t, 19.55, 20.0));
  const casks = [[270, 1350, s2], [560, 1350, s1], [850, 1350, 0]];
  casks.forEach(c => caskSide(c[0], c[1], 260, 330, { wob: c[2] > 0 ? 0 : wob, split: c[2] }));
  // whiskey escaping
  [[560, s1, 18.6], [270, s2, 19.6]].forEach(([x, s, t0]) => {
    if (s <= 0) return; const rv = eout(prog(t, t0, t0 + .9));
    stream({ pts: [[x + 20, 1350], [x + 26, 1460], [x - 10, 1580], [x + 40, 1700], [x + 160, 1800], [x + 320, 1880]] }, { reveal: rv, w: 70, wfn: q => lerp(30, 110, q), fl: 0, speed: 260 });
    for (let k = 0; k < 6; k++) { const ph = (T * 1.4 + k / 6) % 1; ell(x + Math.sin(k * 3) * 30, 1330 + ph * 260, 8, 12, C.amber, { lw: 1.5, n: 8 }); }
  });
  ctx.restore();
}
function sc5(t) { // pouring out & igniting
  bg(); wash(0, 0, W, 1300, '#e8b27c', .3); glow(380, 1050, 500, 'rgba(255,120,40,1)', .3);
  ctx.save(); applyCam(lerp(520, 600, ease(prog(t, 20.4, 24.6))), lerp(1150, 1280, ease(prog(t, 20.4, 24.6))), lerp(1.05, .95, prog(t, 20.4, 24.6)));
  shape([[-60, 420], [1140, 420], [1140, 1250], [-60, 1250]], '#b7563d', { lw: 3.5 });
  ctx.save(); ctx.globalAlpha = .22; for (let y = 440; y < 1240; y += 24) line([[-60, y], [1140, y]], C.brickD, 2, { amp: 1.2 }); ctx.restore();
  [[740, 560], [900, 560], [740, 800], [900, 800]].forEach(([x, y], i) => windowPane(x, y, 70, 100, .7 + .3 * Math.sin(T * 6 + i)));
  shape([[180, 1250], [180, 960], [380, 840], [580, 960], [580, 1250]], '#2b1c18', { lw: 4 });
  glow(380, 1100, 260, 'rgba(255,150,50,1)', .7);
  for (let i = 0; i < 6; i++) flame(220 + i * 64, 1240, 120 + 40 * Math.sin(i * 1.7), 30, i);
  smokeColumn(380, 860, 8, 200, 18, .5, .8, 51);
  // street sloping
  shape([[-60, 1250], [1140, 1250], [1140, 2000], [-60, 2000]], C.cob, { lw: 3 });
  ctx.save(); ctx.globalAlpha = .4; const r = staticRng(8); for (let i = 0; i < 70; i++) ell(r() * W, 1280 + r() * 700, 24, 9, null, { stroke: '#8a7a68', lw: 2, n: 8 }); ctx.restore();
  building(-40, 2000, 420, 480, C.brickL, { cols: 2, rows: 2, ww: 46, wh: 64, door: true, doorX: .7 });
  const p = { pts: [[380, 1235], [430, 1330], [540, 1420], [690, 1510], [830, 1630], [930, 1790], [1010, 2000]] };
  if (!sc5.p) sc5.p = p;
  stream(sc5.p, { reveal: eout(prog(t, 20.3, 22.7)), burn: ease(prog(t, 21.3, 23.8)), fl: 1, w: 140, wfn: q => lerp(100, 190, q), speed: 220, seed: 9 });
  ctx.restore();
}
// top-down city
const CITY = (() => {
  const P = [[520, -300], [520, 1040], [1560, 1040], [1560, 2080], [520, 2080], [520, 3120], [1560, 3120], [1560, 4400]];
  return { path: { pts: P } };
})();
function cityTop(t, reveal, burn) {
  bg(['#d8c9ad', .5]);
  // blocks w/ terraced roofs
  for (let i = -2; i < 6; i++) for (let j = -2; j < 10; j++) {
    const bx = i * 520 + 65, by = j * 520 + 65, bs = 390;
    for (let k = 0; k < 5; k++) {
      const r = staticRng(i * 100 + j * 10 + k); const col = [C.roof, '#8b5a4a', C.brickD, '#6f6466'][Math.floor(r() * 4)];
      const y = by + k * 78; rect(bx, y, bs, 78, col, { lw: 2.6, step: 60 }); line([[bx + 10, y + 39], [bx + bs - 10, y + 39]], '#2f2a33', 2.5, { amp: .8 });
      rect(bx + 40 + r() * 280, y + 10, 18, 18, '#4a3a38', { lw: 1.6 });
    }
  }
  // cobbles in lanes: texture dots
  stream(CITY.path, { reveal, burn, fl: 1, w: 92, wfn: () => 92, flameScale: 1.25, flameStep: 6, speed: 240, seed: 12 });
}
function sc6(t) {
  // follow front, then pull up high
  const rv = lerp(.06, .52, ease(prog(t, 24.0, 30.4))) + lerp(0, .48, ease(prog(t, 30.4, 34.9)));
  const pts = CITY.path.rs || (stream && resample(smoothPts(CITY.path.pts, 3), 10));
  CITY.path.rs = pts;
  const fi = Math.min(pts.length - 1, Math.floor(rv * (pts.length - 1))); const front = pts[fi];
  const k = ease(prog(t, 30.2, 34.4));
  const z = lerp(1.25, .42, k);
  const cx = lerp(front[0] - 60, 1040, k), cy = lerp(front[1] - 150, 2050, k);
  ctx.save(); applyCam(cx, cy, z, 540, 1200);
  cityTop(t, rv, clamp((rv - .015) / rv));
  // extras: horse cart, pigs, residents
  const pg = (t - 25.2) * 210;
  if (t > 24.6) { for (let i = 0; i < 3; i++) pig(1560 + (i - 1) * 40 + 30, 1300 + pg + i * 70, .9, 1, T * 14 + i); }
  horse(1300, 1050, .6, { dir: 1, walk: T * 6 }); rect(1080, 950, 150, 80, C.wood, { lw: 2.4 }); caskEnd(1120, 990, 28); caskEnd(1185, 990, 28);
  [[440, 700, 1], [600, 1600, -1], [1460, 1500, 1], [1640, 2350, -1], [450, 2500, 1]].forEach(([x, y, d], i) => {
    person(x + (d > 0 ? -20 : 20), y, .55, { dir: d, coat: ['#5d6a8a', '#7a4f5f', '#5b6b52'][i % 3], hat: i % 2 ? 'bonnet' : 'cap', expr: 'shock', look: [d, 0] });
  });
  ctx.restore();
}
// street level wide (emergency)
function rowHouses(x0, x1, base) {
  const r = staticRng(61);
  for (let x = x0; x < x1;) { const w = 260 + Math.floor(r() * 3) * 60; const h = 640 + r() * 220; building(x, base, w, h, [C.brickL, '#b8664c', '#a85a48', '#c98a6a'][Math.floor(r() * 4)], { cols: 2, rows: 3, ww: 46, wh: 66, door: true, doorX: .5, lit: (i, j) => .3 + .3 * Math.sin(T * 3 + x + j), chimney: .25 }); x += w + 8; }
}
function emergencyStreet(t, cx, o = {}) {
  bg(); wash(0, 0, W, 1300, '#e9b985', .3);
  ctx.save(); applyCam(cx, 1560, 1.55, 540, 1250);
  glow(2900, 800, 900, 'rgba(240,110,40,1)', o.glowA ?? .35);
  smokeColumn(2700, 900, 10, 500, 30, o.smokeA ?? .5, 1.2, 71); smokeColumn(1900, 900, 6, 300, 30, (o.smokeA ?? .5) * .8, 1, 73);
  rowHouses(-700, 3600, 1450);
  shape([[-800, 1450], [3700, 1450], [3700, 2000], [-800, 2000]], C.cob, { lw: 3, step: 80 });
  ctx.save(); ctx.globalAlpha = .4; const r = staticRng(5); for (let i = 0; i < 160; i++) ell(-700 + r() * 4300, 1480 + r() * 440, 26, 10, null, { stroke: '#8a7a68', lw: 2, n: 8 }); ctx.restore();
  if (o.fn) o.fn();
  ctx.restore();
}
function sc8(t) {
  const cx = t < 37.2 ? lerp(-100, 820, ease(prog(t, 34.8, 37.2))) : t < 39.2 ? lerp(820, 1480, ease(prog(t, 37.2, 39.0))) : t < 40.8 ? lerp(1480, 2060, ease(prog(t, 39.2, 40.6))) : lerp(2060, 2600, ease(prog(t, 40.8, 42.4)));
  emergencyStreet(t, cx, {
    fn: () => {
      stream(sc8.bs || (sc8.bs = { pts: [[1150, 1520], [1600, 1495], [2100, 1525], [2600, 1490], [3100, 1515], [3600, 1500]] }), { fl: 1, w: 80, wfn: () => 80, speed: 150, seed: 21, flameScale: 1.1 });
      for (let i = 0; i < 6; i++) smokePuff(1500 + i * 380 + Math.sin(T * .6 + i) * 40, 1300 - Math.sin(i * 1.3) * 60, 120, .35);
      const ex = lerp(-700, 760, eout(prog(t, 34.8, 37.0))); const mv = prog(t, 34.8, 37.0) < 1;
      // hose spray toward fire
      if (t > 37) { ctx.save(); ctx.globalAlpha = .55; ctx.strokeStyle = '#9fc0e6'; ctx.lineWidth = 10; ctx.setLineDash([20, 18]); ctx.lineDashOffset = -T * 300; ctx.beginPath(); ctx.moveTo(1020, 1560); ctx.quadraticCurveTo(1300, 1100, 1600, 1250); ctx.stroke(); ctx.restore(); }
      horse(ex + 330, 1800, .95, { walk: mv ? T * 9 : 0 }); horse(ex + 250, 1760, .9, { walk: mv ? T * 9 + 1 : 0, col: '#5e4532' });
      fireEngine(ex, 1810, 1, mv ? T * 6 : 0);
      person(ex - 170, 1820, 1, { hat: 'fire', coat: '#2e3557', walk: mv ? T * 9 : null, armR: 30 });
      person(ex + 600, 1780, 1, { hat: 'fire', coat: '#2e3557', hold: 'hose', armR: 70, walk: mv ? T * 9 : null, dir: 1 });
      person(ex + 500, 1850, 1.05, { hat: 'fire', coat: '#2e3557', hold: 'axe', armR: 20, walk: mv ? T * 9 + 2 : null });
      // police
      person(1330, 1800, 1.05, { hat: 'police', coat: '#1f2340', belt: '#111', armR: 95 + 8 * Math.sin(T * 3), armL: -10, dir: -1 });
      person(1560, 1760, 1, { hat: 'police', coat: '#1f2340', belt: '#111', armR: 80, dir: 1, look: [1, 0] });
      // residents moving left past police
      for (let i = 0; i < 4; i++) { const x = 2500 - (t - 36) * 120 - i * 130; person(x, 1850 - (i % 2) * 40, .95, { dir: -1, walk: T * 8 + i, coat: ['#6e5a7e', '#5d6a8a', '#7a4f5f', '#5b6b52'][i], hat: ['shawl', 'cap', 'bonnet', 'cap'][i], skirt: i % 2 ? null : '#6a4e5e', hold: i === 1 ? 'bundle' : null, armR: 40, expr: 'shock' }); }
      // soldiers
      [1960, 2090, 2220].forEach((x, i) => person(x, 1820 + (i % 2) * 30, 1, { hat: 'shako', coat: C.redcoat, trou: '#2a2a3a', belt: '#efe6d2', armR: 85, armL: -85, dir: -1 }));
      // residents leaving homes
      [[2500, 'shawl', '#7a4f5f'], [2700, 'cap', '#5d6a8a'], [2860, 'bonnet', '#5b6b52']].forEach(([x0, h, c], i) => {
        const k = prog(t, 40.3 + i * .4, 42.8); const x = x0 - k * 260; person(x, 1520 + k * 260, .9 + k * .1, { dir: -1, walk: T * 8 + i, coat: c, hat: h, skirt: i === 0 ? '#5a4060' : null, hold: 'bundle', armR: 50, expr: 'shock' });
      });
      person(2640 - prog(t, 40.6, 42.8) * 240, 1560 + prog(t, 40.6, 42.8) * 240, .6, { dir: -1, walk: T * 10, coat: '#a7804e' });
    }
  });
}
// close street for scenes 9-11
function closeStreet(t, o = {}) {
  bg(); wash(0, 0, W, 1300, '#e6b17c', .3);
  smokeColumn(900, 700, 6, 300, 30, .4, 1, 81);
  building(-40, 1400, 560, 900, '#b9614a', { cols: 2, rows: 3, ww: 56, wh: 80, door: true, doorX: .75, lit: () => .4 });
  building(530, 1400, 600, 820, '#a65644', { cols: 2, rows: 3, ww: 56, wh: 80, door: true, doorX: .3, lit: () => .3, chimney: .7 });
  shape([[-60, 1400], [1140, 1400], [1140, 2150], [-60, 2150]], C.cob, { lw: 3 });
  ctx.save(); ctx.globalAlpha = .4; const r = staticRng(15); for (let i = 0; i < 60; i++) ell(r() * W, 1430 + r() * 460, 26, 10, null, { stroke: '#8a7a68', lw: 2, n: 8 }); ctx.restore();
  const sp = { pts: [[-140, 1870], [200, 1842], [520, 1872], [820, 1838], [1240, 1862]] };
  if (!closeStreet.p) closeStreet.p = sp;
  // distant flames on right only: stream unburnt near, plus far flames
  stream(closeStreet.p, { fl: 0, w: 120, wfn: () => 125, speed: 150, alpha: o.alpha ?? 1, dark: o.dark || 0 });
  if ((o.fl ?? 1) > 0) for (let i = 0; i < 4; i++) flame(890 + i * 40, 1860 + (i % 2) * 14, (110 + i * 12) * (o.fl ?? 1), 26, i);
}
function sc9(t) {
  const z = lerp(1.62, 1.75, ease(prog(t, 42.7, 46)));
  ctx.save(); applyCam(550, 1600, z, 540, 1250);
  closeStreet(t);
  const up = ease(prog(t, 43.6, 45.3));
  const ppl = [[300, '#5d6a8a', 'cap', 'n'], [460, '#7a4f5f', 'shawl', 'n'], [630, '#5b6b52', 'top', 'sly'], [790, '#6e5a7e', 'bonnet', 'n']];
  ppl.forEach(([x, c, h, e], i) => person(x, 1700, 1.15, { coat: c, hat: h, expr: e, look: i === 2 ? [lerp(0, .5, up), lerp(1, -.5, up)] : [0, 1], skirt: (i === 1 || i === 3) ? '#5a4060' : null, armR: i === 2 ? lerp(10, 150, up) : 8, hold: i === 2 ? 'cup' : null, armL: -6, dir: i < 2 ? 1 : -1 }));
  ctx.restore();
  // spotlight vignette
  ctx.save(); const g = ctx.createRadialGradient(540, 1400, 300, 540, 1400, 1100); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,25,30,.35)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function kneeler(x, y, s, o) { // crouched person: body low
  const d = o.dir || 1;
  line([[x - 20 * s * d, y - 70 * s], [x + 30 * s * d, y - 60 * s], [x + 30 * s * d, y]], o.trou || '#4a4258', 15 * s);
  line([[x - 20 * s * d, y - 70 * s], [x - 40 * s * d, y - 10 * s], [x - 10 * s * d, y]], o.trou || '#4a4258', 15 * s);
  return person(x, y + 30 * s, s, Object.assign({ seated: true, lean: 30 * d }, o));
}
function sc10(t) {
  const cx = lerp(500, 570, prog(t, 45.7, 50.7));
  ctx.save(); applyCam(cx, 1630, 1.62, 540, 1250);
  closeStreet(t);
  const sc = (ph) => .5 - .5 * Math.cos(T * 2.4 + ph);
  const items = [['cup', 300, '#5d6a8a', 'cap'], ['bowl', 460, '#7a4f5f', 'shawl'], ['jug', 640, '#5b6b52', 'top'], ['cup', 800, '#6e5a7e', 'bonnet']];
  items.forEach(([it, x, c, h], i) => {
    const a = sc(i * 1.7); const app = eout(prog(t, 45.9 + i * .35, 46.6 + i * .35));
    if (app <= 0) return;
    ctx.save(); ctx.globalAlpha = 1; ctx.translate(0, (1 - app) * 60);
    kneeler(x, 1848, 1.05, { coat: c, hat: h, expr: 'sly', look: [i % 2 ? -1 : 1, a > .5 ? 1 : 0], armLen: 100, armR: lerp(25, 70, a), armL: -20, hold: it, cupFill: a < .4, dir: i % 2 ? -1 : 1, skirt: i === 1 ? '#5a4060' : null });
    ctx.restore();
  });
  ctx.restore();
}
function bootScene(t) {
  const z = lerp(1.62, 1.52, prog(t, 52, 58.5));
  ctx.save(); applyCam(530, 1660, z, 540, 1250);
  closeStreet(t);
  // seated man on curb
  const off = ease(prog(t, 52.0, 53.3));   // boot removal
  const lookB = prog(t, 53.3, 54.1), lookS = prog(t, 54.1, 54.9);
  const dip = ease(prog(t, 54.9, 55.7)) - ease(prog(t, 56.1, 56.6));
  const sip = ease(prog(t, 56.7, 57.1)) - ease(prog(t, 57.4, 57.9));
  const mx = 420, my = 1790;
  rect(280, my - 78, 300, 60, '#a9a39a', { lw: 3 }); rect(280, my - 18, 300, 20, '#8d877e', { lw: 2.5 });
  // legs: extended forward toward the stream
  line([[mx - 6, my - 80], [mx + 90, my - 92], [mx + 110, my + 6]], '#4a4258', 17);
  line([[mx + 10, my - 76], [mx + 120, my - 74], [mx + 160, my + 10]], '#4a4258', 17);
  ell(mx + 172, my + 12, 18, 9, '#d9c9ad', { lw: 2, n: 10 }); ell(mx + 122, my + 8, 18, 9, '#2f2a2a', { lw: 2, n: 10 });
  let bx, by, ba = 0;
  const handBase = [mx + 75, my - 170];
  let armAng;
  if (t < 52.0) { bx = mx + 165; by = my + 10; ba = 1.45; armAng = 60; }
  else if (off < 1) { bx = lerp(mx + 165, handBase[0], off); by = lerp(my + 10, handBase[1], off); ba = lerp(1.5, .2, off); armAng = lerp(60, 70, off); }
  else { bx = handBase[0] + dip * 150 - sip * 60; by = handBase[1] + dip * 160 - sip * 100; ba = .2 + dip * .9 - sip * 1.0; armAng = 70 + dip * 20 + sip * 50; }
  const look = t < 53.3 ? [1, 1] : lookS > 0 ? [lerp(1, .2, lookS), lerp(-1, 1, lookS)] : [1, lerp(1, -1, lookB)];
  person(mx, my, 1.1, { seated: true, coat: '#5b6b52', hat: 'cap', look: dip > .1 ? [1, 1] : look, armR: armAng, armL: 30, expr: 'sly' });
  boot(bx, by, .85, ba, dip > .6 || (t > 56 && t < 58.2));
  
  // disbelief reactor
  const rx = 800, rr = ease(prog(t, 53.6, 54.3));
  person(240, 1700, 1.2, { coat: '#5d6a8a', hat: 'top', expr: t > 54.8 ? 'shock' : 'n', look: [1, 0], dir: 1, armR: 15 });
  person(rx, 1930, 1.5, { coat: '#7a4f5f', hat: 'bonnet', skirt: '#5a4060', expr: 'shock', look: [-1, 0], dir: -1, armR: lerp(10, 180, rr), armL: lerp(-10, 180, rr), armLen: lerp(74, 38, rr), handsFront: rr > .6 });
  ctx.restore();
}
function sc11(t) {
  // newspaper intro then push into panel -> boot scene
  if (t < 52.3) {
    const k = eout(prog(t, 50.4, 51.5)); const p = ease(prog(t, 51.5, 52.3));
    sc10(t);
    ctx.save(); ctx.fillStyle = 'rgba(244,234,213,' + (.55 * k) + ')'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); const z = lerp(1, 2.6, p); ctx.translate(540, 1200); ctx.scale(z, z); ctx.translate(-540 + 0 * p, -1200 + 150 * p);
    newspaper(lerp(1300, 540, k), lerp(700, 1200, k), 760, 1000, lerp(.5, -.03, k), { panel: true, panelFn: (px, py, pw, ph) => { ctx.fillStyle = '#e3d5b4'; ctx.fillRect(px, py, pw, ph); ctx.save(); ctx.globalAlpha = .9; boot(px + pw / 2 - 20, py + ph * .62, 1.6, .15); ctx.restore(); line([[px + 20, py + ph - 40], [px + pw - 20, py + ph - 48]], C.amber, 18); } });
    ctx.restore();
    if (p > .55) {
      if (!sc11.buf) sc11.buf = makeBuf();
      const bc = sc11.buf.getContext('2d'); bc.setTransform(1, 0, 0, 1, 0, 0);
      const keep = SEEDC; renderScene(bootScene, t, bc); SEEDC = keep;
      ctx.save(); ctx.globalAlpha = (p - .55) / .45; ctx.drawImage(sc11.buf, 0, 0); ctx.restore();
    }
    return;
  }
  bootScene(t);
}
function makeBuf() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
function sc12(t) {
  const k = prog(t, 58.8, 61.2);
  emergencyStreet(t, 1100, {
    glowA: .35 * (1 - k), smokeA: .55, fn: () => {
      stream({ pts: [[300, 1640], [700, 1700], [1100, 1660], [1500, 1720], [1900, 1680]] }, { fl: 1 - ease(k), w: 120, wfn: () => lerp(120, 60, k), alpha: 1 - ease(prog(t, 59.6, 61.4)) * .85, dark: k * .7, speed: 90, seed: 31 });
      person(820, 1830, 1.05, { hat: 'fire', coat: '#2e3557', hold: 'hose', armR: lerp(70, 30, k), look: [1, 1], expr: 'sad' });
      person(1000, 1860, 1.05, { hat: 'fire', coat: '#2e3557', armR: 10, expr: 'sad', dir: -1 });
      person(1300, 1820, 1.05, { hat: 'police', coat: '#1f2340', belt: '#111', armR: 10, expr: 'sad', dir: -1 });
      person(1450, 1840, 1, { hat: 'shako', coat: C.redcoat, trou: '#2a2a3a', belt: '#efe6d2', armR: 8, dir: -1, expr: 'sad' });
      for (let i = 0; i < 8; i++) smokePuff(500 + i * 170 + Math.sin(T * .5 + i) * 30, 1250 + Math.sin(i * 2) * 120, 120, .4);
    }
  });
  ctx.save(); ctx.globalAlpha = .15 * k; ctx.fillStyle = '#6f6a70'; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function sc13(t) {
  bg(['#d9cfc0', .45]);
  ctx.save(); const g = ctx.createRadialGradient(540, 1150, 200, 540, 1150, 1100); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,35,50,.28)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  for (let i = 0; i < 13; i++) {
    const row = i < 7 ? 0 : 1; const col = row ? i - 7 : i; const n = row ? 6 : 7;
    const x = 540 + (col - (n - 1) / 2) * 128, y = 980 + row * 230;
    const a = eout(prog(t, 62.1 + i * .17, 62.5 + i * .17)); if (a <= 0) continue;
    candle(x, y, 1.25, a, a);
  }
  const f = eout(prog(t, 64.9, 65.3)), sm = eout(prog(t, 65.7, 66.1));
  if (f > 0) { ctx.save(); ctx.globalAlpha = f; ell(320, 1570, 130, 130, '#efe2c6', { lw: 4 }); flame(320, 1640, 150, 50, 1); ctx.restore(); crossOut(320, 1570, 110, prog(t, 65.35, 65.95)); }
  if (sm > 0) { ctx.save(); ell(760, 1570, 130, 130, '#efe2c6', { lw: 4, alpha: sm }); [[720, 1600, 50], [790, 1590, 56], [760, 1530, 52], [800, 1520, 38], [730, 1650, 30]].forEach(([x, y, r]) => smokePuff(x, y - Math.sin(T) * 6, r, .85 * sm, '#8d8a88')); ctx.restore(); crossOut(760, 1570, 110, prog(t, 66.15, 66.75)); }
}
function sc14(t) {
  bg(['#d9cfc0', .45]);
  const ys = [650, 980, 1310, 1660]; const ts = [68.5, 70.1, 72.0, 73.9];
  const a = ts.map(t0 => eout(prog(t, t0, t0 + .5)));
  // 1 street whiskey puddle
  if (a[0] > 0) { ctx.save(); ctx.translate(540, ys[0]); ctx.scale(a[0] * 1.25, a[0] * 1.25); shape([[-200, 20], [-120, -40], [40, -30], [190, -50], [220, 10], [120, 50], [-90, 55]], C.amber, { lw: 3.5, step: 30 }); ctx.save(); ctx.globalAlpha = .5; for (let k = 0; k < 9; k++) ell(-180 + k * 46, 80, 18, 7, null, { stroke: '#8a7a68', lw: 2, n: 8 }); ctx.restore(); ctx.restore(); }
  arrow(540, ys[0] + 90, 540, ys[1] - 110, prog(t, 69.6, 70.1));
  if (a[1] > 0) { ctx.save(); ctx.translate(540, ys[1]); ctx.scale(a[1] * 4.5, a[1] * 4.5); cup(0, 0, 1, true); ctx.restore(); }
  arrow(540, ys[1] + 90, 540, ys[2] - 120, prog(t, 71.4, 71.9));
  if (a[2] > 0) { ctx.save(); ctx.translate(540, ys[2]); ctx.scale(a[2], a[2]); shape([[0, -120], [130, 100], [-130, 100]], '#f0c24a', { lw: 6, step: 40 }); rect(-10, -50, 20, 90, C.navy, { lw: 2 }); ell(0, 70, 12, 12, C.navy, { n: 8 }); ctx.restore(); }
  arrow(540, ys[2] + 120, 540, ys[3] - 150, prog(t, 73.3, 73.8));
  if (a[3] > 0) {
    ctx.save(); ctx.translate(540, ys[3]); ctx.scale(a[3], a[3]);
    shape([[-260, 120], [-260, -80], [260, -80], [260, 120]], '#e2d3b8', { lw: 3.4 }); shape([[-290, -80], [0, -200], [290, -80]], '#b9a88e', { lw: 3.4 });
    for (let k = -2; k <= 2; k++) if (k) windowPane(k * 100 - 22, -40, 44, 64, .2);
    shape([[-40, 120], [-40, 30], [0, 0], [40, 30], [40, 120]], '#5b3a2a', { lw: 3 });
    rect(-24, -170, 48, 48, '#f6f0e2', { lw: 2.5 }); rect(-6, -164, 12, 36, C.red, { stroke: false }); rect(-18, -152, 36, 12, C.red, { stroke: false });
    ctx.restore();
  }
}
function sc15(t) {
  // final irony: beautiful stream, then flames fade, liquid darkens, forms 13 markers
  bg();
  const fade = ease(prog(t, 81.5, 83.2)); const dk = ease(prog(t, 82.0, 83.6)); const mk = ease(prog(t, 83.7, 85.4));
  const z = lerp(1.0, 1.12, prog(t, 76.5, 86.4));
  ctx.save(); applyCam(540, lerp(1150, 1300, prog(t, 76.5, 86.4)), z);
  streetScene({ fl: 1 - fade, glow: 1 - fade * .8, dark: dk * .85, alpha: 1 - mk });
  // 13 markers along path
  if (mk > 0) {
    const pts = STREET_PATH.rs; const n = pts.length;
    for (let i = 0; i < 13; i++) {
      const s = .18 + i / 12 * .72; const p = pts[Math.floor(s * (n - 1))]; const w = streetWidth(s);
      const side = (i % 2 ? 1 : -1) * w * .22; const r = (14 + w * .13) * clamp(mk * 1.4 - i * .03);
      if (r > 0) ell(p[0] + side, p[1], r, r * .9, '#2c1c14', { lw: 2.5, stroke: '#140c08', n: 14 });
    }
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = .18 * fade; ctx.fillStyle = '#5a5560'; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function finalComp(t) {
  bg();
  ctx.save(); applyCam(540, lerp(1180, 1140, prog(t, 86, 92)), lerp(1.0, 1.04, prog(t, 86, 92)));
  streetScene({ fl: .8, extras: (l) => {
    if (l !== 'front') return;
    // firefighter silhouette right
    person(880, 1880, 2.1, { hat: 'fire', coat: '#1e2142', trou: '#1e2142', sleeve: '#1e2142', armR: 15, look: [-1, 0], dir: -1, expr: 'n' });
    caskSide(170, 1720, 230, 290, {});
    newspaper(330, 1860, 380, 300, -.18, {});
  } });
  ctx.restore();
}
function archive(t) {
  // newspaper enters over the final comp, camera pushes into its illustration, then the authentic engraving
  const enter = eout(prog(t, 89.4, 90.2)); const push = ease(prog(t, 90.1, 90.75));
  const showReal = ease(prog(t, 90.45, 90.95));
  if (showReal < 1) {
    finalComp(t);
    ctx.save(); ctx.fillStyle = `rgba(244,234,213,${.5 * enter})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); const z = lerp(1, 1.45, push); ctx.translate(540, 1150); ctx.scale(z, z); ctx.translate(-540, -1150 + 180 * push);
    newspaper(540, lerp(2600, 1260, enter), 980, 1240, lerp(.18, 0, enter), { panel: true, panelFn: (px, py, pw, ph) => { ctx.save(); ctx.translate(px, py); ctx.scale(pw / W, ph / 1000); ctx.translate(0, -800); streetScene({ fl: .8, glow: .8 }); ctx.restore(); } });
    ctx.restore();
  }
  if (showReal > 0) {
    ctx.save(); ctx.globalAlpha = showReal;
    ctx.drawImage(PAPER, 0, 0);
    const img = ARCH; const iw = 1000, ih = iw * img.height / img.width;
    const zz = 1 + .035 * prog(t, 90.9, VIDEO_END); const dx = Math.sin(t * .4) * 4;
    const cx = 540 + dx, cy = 1180;
    // frame
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.006); ctx.scale(zz, zz);
    ctx.fillStyle = 'rgba(60,40,20,.18)'; ctx.fillRect(-iw / 2 - 16 + 10, -ih / 2 - 16 + 14, iw + 32, ih + 32);
    ctx.fillStyle = '#f7f0df'; ctx.fillRect(-iw / 2 - 18, -ih / 2 - 18, iw + 36, ih + 36);
    ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
    ctx.restore();
    ctx.restore();
  }
}

// ---------- scene table [fn, start, end] with crossfades on overlaps ----------
const SCENES = [
  [sc1, 0, 5.4], [sc2map, 5.0, 8.55], [sc2ext, 8.2, 12.6], [sc3, 12.25, 17.1], [sc4, 16.85, 20.7], [sc5, 20.4, 24.7],
  [sc6, 24.35, 35.2], [sc8, 34.85, 42.9], [sc9, 42.6, 45.95], [sc10, 45.65, 50.45], [sc11, 50.4, 58.8], [sc12, 58.5, 62.0],
  [sc13, 61.55, 68.3, 'x'], [sc14, 67.9, 76.95, 'x'], [sc15, 76.5, 86.4, 'x'], [finalComp, 86.0, 89.45, 'x'], [archive, 89.4, 99]
];

// ---------- captions ----------
function wrapLines(text, size, maxW, weight) {
  ctx.font = `${weight} ${size}px Caveat`; const words = text.split(' '); const lines = []; let cur = '';
  words.forEach(w => { const tr = cur ? cur + ' ' + w : w; if (ctx.measureText(tr).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tr; });
  if (cur) lines.push(cur); return lines;
}
function fitText(text) {
  for (let s = 112; s >= 60; s -= 2) { const L = wrapLines(text, s, 980, 700); if (L.length * s * .98 <= 405) return [s, L]; }
  return [52, wrapLines(text, 52, 960, 700)];
}
const CAPFIT = {};
function drawStrip() {
  // paper strip with wobbly hand-drawn edge
  const r = staticRng(BOIL % 3 + 200);
  const pts = [[-20, -20], [W + 20, -20]]; for (let x = W + 20; x >= -20; x -= 60) pts.push([x, 455 + Math.sin(x * .013) * 7 + (r() - .5) * 4]);
  ctx.save(); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.clip(); ctx.drawImage(PAPER, 0, 0); ctx.restore();
  ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = '#5a3a20'; ctx.fillRect(0, 456, W, 10); ctx.restore();
  line(pts.slice(2).reverse(), C.navy, 3.4, { amp: 1 });
}
function writeText(lines, size, weight, col, cx, y0, k, lh) {
  ctx.save(); ctx.font = `${weight} ${size}px Caveat`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = col;
  const n = lines.length;
  lines.forEach((ln, i) => {
    const lk = clamp(k * n - i); if (lk <= 0) return; const w = ctx.measureText(ln).width;
    const y = y0 + i * lh;
    ctx.save(); ctx.beginPath(); ctx.rect(cx - w / 2 - 20, y - size * 1.1, (w + 40) * lk, size * 1.5); ctx.clip();
    const j = Math.sin(BOIL * 1.7 + i) * .6;
    ctx.fillText(ln, cx + j, y); ctx.restore();
  });
  ctx.restore();
}
function drawCaption(t) {
  drawStrip();
  // regular captions
  for (let i = 0; i < CAPS.length; i++) {
    const [st, text] = CAPS[i]; const en = i + 1 < CAPS.length ? CAPS[i + 1][0] - .12 : END17A - .12;
    if (t < st - .08 || t > en) continue;
    if (!CAPFIT[i]) CAPFIT[i] = fitText(text);
    const [s, L] = CAPFIT[i]; const lh = s * .98;
    const blockH = L.length * lh; const y0 = 22 + (425 - blockH) / 2 + s * .74;
    const k = clamp((t - st + .08) / Math.min(.9, .25 + .12 * L.length));
    const out = clamp((en - t) / .15);
    ctx.save(); ctx.globalAlpha = out; writeText(L, s, 700, C.navy, 540, y0, k, lh); ctx.restore();
  }
  // final two-part line
  if (t >= END17A - .05 && t < 89.75) {
    const out = clamp((89.75 - t) / .3);
    ctx.save(); ctx.globalAlpha = out;
    writeText(['İnanması güç ama'], 112, 400, '#6a6c97', 540, 185, clamp((t - END17A + .05) / .5), 0);
    if (t > END17B - .05) writeText(['bu gerçekten yaşandı.'], 128, 700, '#171a3d', 540, 345, clamp((t - END17B + .05) / .7), 0);
    ctx.restore();
  }
  if (t > ARCH_IN - .2) {
    const a = clamp((t - ARCH_IN + .2) / .4);
    writeText(['1875’te yayımlanan gerçek çizim'], 96, 700, C.navy, 540, 255, a, 0);
  }
}
function drawHandle() {
  ctx.save(); ctx.font = '700 44px Caveat'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(244,234,213,.85)';
  ctx.fillText('@bugercektenyasandi', 1043, 1873); ctx.fillStyle = C.navy; ctx.fillText('@bugercektenyasandi', 1040, 1870); ctx.restore();
}

// ---------- frame renderer ----------
let BUFS = [];
let MAINCTX;
function renderScene(fn, t, target) { const prev = ctx; ctx = target; SEEDC = 0; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(PAPER, 0, 0); fn(t); ctx.restore(); ctx = prev; }
function renderFrame(t) {
  T = t; BOIL = Math.floor(t * 8);
  ctx = MAINCTX; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const act = SCENES.filter(s => t >= s[1] && t < s[2]);
  if (act.length === 1) renderScene(act[0][0], t, MAINCTX);
  else {
    const [a, b] = act; const k = ease((t - b[1]) / (a[2] - b[1]));
    renderScene(a[0], t, BUFS[0].getContext('2d')); renderScene(b[0], t, BUFS[1].getContext('2d'));
    if (b[3] === 'x') { ctx.drawImage(BUFS[0], 0, 0); ctx.save(); ctx.globalAlpha = k; ctx.drawImage(BUFS[1], 0, 0); ctx.restore(); }
    else {
      const za = lerp(1, 1.35, k), zb = lerp(1.18, 1, k);
      ctx.save(); ctx.translate(540, 1250); ctx.scale(za, za); ctx.translate(-540, -1250); ctx.drawImage(BUFS[0], 0, 0); ctx.restore();
      ctx.save(); ctx.globalAlpha = clamp(k * 1.3); ctx.translate(540, 1250); ctx.scale(zb, zb); ctx.translate(-540, -1250); ctx.drawImage(BUFS[1], 0, 0); ctx.restore();
    }
  }
  // special: newspaper->boot crossfade buffer
  SEEDC = 5000;
  // unify grain over everything
  ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = GRAINPAT; ctx.fillRect(0, 0, W, H); ctx.restore();
  drawCaption(t); drawHandle();
  // final fade
  const fo = prog(t, VIDEO_END - .55, VIDEO_END - .05);
  if (fo > 0) { ctx.save(); ctx.globalAlpha = fo; ctx.drawImage(PAPER, 0, 0); ctx.restore(); }
}
