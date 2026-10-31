// ---------- environment ----------
function skyFill(ctx, cols, a = 1) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, VIEW.t, 0, VIEW.b);
  cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a * 0.16; ctx.fillStyle = pats(ctx).l; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a * 0.25; ctx.fillStyle = pats(ctx).d; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
const NIGHT = [C.sky0, C.sky1, C.sky2, C.sky3];

function stars(ctx, seed, n, ox = 0, oy = 0, t = 0, a = 1, region = null) {
  const r = mulberry(seed);
  const R = region || { l: VIEW.l, t: VIEW.t, w: VIEW.r - VIEW.l, h: VIEW.b - VIEW.t };
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < n; i++) {
    let x = r() * R.w, y = r() * R.h; const s = r(), ph = r() * 6.28, big = r() < 0.12;
    x = ((x + ox) % R.w + R.w) % R.w + R.l; y = ((y + oy) % R.h + R.h) % R.h + R.t;
    const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + s * 2) + ph);
    ctx.globalAlpha = a * tw * (0.5 + s * 0.5);
    if (big) {
      ctx.strokeStyle = '#FFF4D6'; ctx.lineWidth = 1.6; const L = 5 + s * 5;
      ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke();
      circleFill(ctx, x, y, 1.8, '#FFF8E6');
    } else circleFill(ctx, x, y, 0.8 + s * 1.4, '#F4EEDC');
  }
  ctx.restore();
}

function moon(ctx, x, y, r, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  glow(ctx, x, y, r * 3.2, 'rgba(230,220,190,0.30)');
  glow(ctx, x, y, r * 1.7, 'rgba(240,230,200,0.35)');
  shape(ctx, ell(x, y, r, r, 22), { fill: C.moon, id: 401, lw: 3, hatch: 0.08, amp: 1.2 });
  ctx.globalAlpha *= 0.35;
  shape(ctx, ell(x - r * .3, y - r * .2, r * .22, r * .18, 10), { fill: '#D8CCAA', ink: null, hatch: 0 });
  shape(ctx, ell(x + r * .32, y + r * .25, r * .16, r * .13, 10), { fill: '#D8CCAA', ink: null, hatch: 0 });
  shape(ctx, ell(x + r * .1, y - r * .45, r * .1, r * .08, 8), { fill: '#D8CCAA', ink: null, hatch: 0 });
  ctx.restore();
}

function cloud(ctx, x, y, s, seed, col = '#3A3F6A', a = 1, inkCol = null) {
  const r = mulberry(seed); const n = 5 + Math.floor(r() * 3); const cs = [];
  for (let i = 0; i < n; i++) { const f = i / (n - 1) - 0.5; cs.push([x + f * 260 * s + (r() - .5) * 30 * s, y - (1 - Math.abs(f) * 1.6) * 30 * s + (r() - .5) * 14 * s, (38 + r() * 34) * s * (1 - Math.abs(f) * 0.6)]); }
  ctx.save(); ctx.globalAlpha *= a;
  const lw = 3.2 * Math.min(1, s * 1.2);
  ctx.fillStyle = inkCol || 'rgba(20,18,50,0.85)';
  for (let i = 0; i < cs.length; i++) { const [cx, cy, cr] = cs[i]; const p = rpath(ell(cx, cy, cr + lw, cr * 0.82 + lw, 14), true, 1.2 * s, seed + i); ctx.fill(p); }
  const base = new Path2D(); for (let i = 0; i < cs.length; i++) { const [cx, cy, cr] = cs[i]; base.addPath(rpath(ell(cx, cy, cr, cr * 0.82, 14), true, 1.2 * s, seed + i)); }
  ctx.fillStyle = col; ctx.fill(base);
  ctx.globalAlpha *= 0.35; ctx.fillStyle = pats(ctx).l; ctx.fill(base);
  ctx.globalAlpha = a * 0.25; ctx.fillStyle = pats(ctx).d; ctx.fill(base);
  ctx.restore();
}

// pine tree, base at (x,y), height h
function pine(ctx, x, y, h, o = {}) {
  const id = o.id ?? 0, sway = o.sway ?? 0, col = o.col || C.pine, snowy = o.snow ?? true;
  const tiers = o.tiers || 5; const w = h * (o.wf ?? 0.42);
  ctx.save();
  if (o.sil) {
    // simple silhouette for far trees
    const pts = [[x - w * 0.5, y]]; for (let i = 0; i < tiers; i++) { const f = i / tiers; const f2 = (i + 0.7) / tiers; pts.push([x - w * 0.5 * (1 - f2) - 2, y - h * f2 + h * 0.06]); pts.push([x - w * 0.18 * (1 - f2) + sway * f2, y - h * (f2 + 0.08)]); }
    pts.push([x + sway, y - h]);
    for (let i = tiers - 1; i >= 0; i--) { const f2 = (i + 0.7) / tiers; pts.push([x + w * 0.18 * (1 - f2) + sway * f2, y - h * (f2 + 0.08)]); pts.push([x + w * 0.5 * (1 - f2) + 2, y - h * f2 + h * 0.06]); }
    pts.push([x + w * 0.5, y]);
    shape(ctx, pts, { fill: col, ink: o.ink === undefined ? null : o.ink, lw: 1.5, id, poly: true, hatch: 0.15, amp: 0.6 });
    if (snowy) { ctx.globalAlpha *= 0.85; for (let i = 0; i < tiers; i++) { const f2 = (i + 0.7) / tiers; const cx = x + sway * f2, cy = y - h * f2 + h * 0.03, ww = w * 0.45 * (1 - f2) + 2; shape(ctx, [[cx - ww, cy], [cx, cy - h * 0.05], [cx + ww, cy], [cx, cy - h * 0.02]], { fill: C.snowS, ink: null, hatch: 0, amp: 0.4, id: id + i }); } }
    ctx.restore(); return;
  }
  // trunk
  shape(ctx, [[x - h * 0.03, y + 4], [x - h * 0.02, y - h * 0.3], [x + h * 0.02, y - h * 0.3], [x + h * 0.03, y + 4]], { fill: '#3A2A20', id: id + 7, lw: 2.5, poly: true });
  for (let i = 0; i < tiers; i++) {
    const f0 = 0.12 + i / tiers * 0.82, f1 = f0 + 1.35 / tiers;
    const by = y - h * f0, ty = y - h * Math.min(1, f1), ww = w * (1 - i / tiers * 0.82) * 0.55;
    const sx = sway * (f0 + f1) / 2, tx = sway * Math.min(1, f1);
    const pts = [[x + sx - ww, by], [x + sx - ww * 0.55, by - h * 0.02], [x + sx - ww * 0.35, by + h * 0.015], [x + sx, by - h * 0.01], [x + sx + ww * 0.35, by + h * 0.015], [x + sx + ww * 0.55, by - h * 0.02], [x + sx + ww, by], [x + tx + ww * 0.1, ty], [x + tx, ty - h * 0.02], [x + tx - ww * 0.1, ty]];
    shape(ctx, pts, { fill: i % 2 ? col : (o.col2 || C.pineL), id: id + i * 3, lw: o.lw ?? 3, hatch: 0.3, amp: h * 0.004 + 0.5 });
    if (snowy) {
      const sp = [[x + sx - ww * 0.92, by - h * 0.012], [x + sx - ww * 0.5, by - h * 0.045], [x + sx - ww * 0.1, by - h * 0.03], [x + sx + ww * 0.4, by - h * 0.05], [x + sx + ww * 0.9, by - h * 0.012], [x + sx + ww * 0.45, by - h * 0.025], [x + sx, by - h * 0.014], [x + sx - ww * 0.5, by - h * 0.022]];
      shape(ctx, sp, { fill: C.snow, ink: C.snowB, lw: 1.5, id: id + i * 5 + 1, hatch: 0.05, amp: 0.8 });
    }
  }
  ctx.restore();
}

// row(s) of far forest on snow ground; y = ground line
function forestBand(ctx, y, x0, x1, seed, o = {}) {
  const r = mulberry(seed); const sc = o.sc ?? 1;
  // ground snow
  const gp = []; for (let x = x0 - 40; x <= x1 + 40; x += 60) gp.push([x, y + snoise(x / 140 + seed) * 10 * sc]);
  gp.push([x1 + 40, y + (o.depth ?? 1400)]); gp.push([x0 - 40, y + (o.depth ?? 1400)]);
  shape(ctx, gp, { fill: o.snowCol || '#D9E1EA', ink: C.ink, lw: 3 * sc, id: seed, hatch: 0.12, light: 0.2, amp: 1 });
  const rows = o.rows ?? 3;
  for (let row = 0; row < rows; row++) {
    const yy = y + row * 26 * sc - 8 * sc; const n = Math.floor((x1 - x0) / ((24 - row * 3) * sc));
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + r()) * (x1 - x0) / n; const h = (40 + r() * 50 + row * 14) * sc * (o.hs ?? 1);
      if (r() < 0.25) continue;
      pine(ctx, x, yy + r() * 10 * sc, h, { sil: true, col: row % 2 ? C.pineD : C.pine, id: seed + i * 13 + row * 101, snow: true, ink: row === rows - 1 ? C.ink : null });
    }
  }
}

function snowfall(ctx, seed, n, t, a = 1, speed = 40, size = 1) {
  const r = mulberry(seed);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const w = VIEW.r - VIEW.l, h = VIEW.b - VIEW.t;
  for (let i = 0; i < n; i++) {
    const x0 = r() * w, y0 = r() * h, s = 0.5 + r(), ph = r() * 6.28;
    const y = ((y0 + t * speed * s) % h + h) % h + VIEW.t; const x = ((x0 + Math.sin(t * 0.8 + ph) * 18 + t * 8) % w + w) % w + VIEW.l;
    ctx.globalAlpha = a * (0.5 + 0.5 * s); circleFill(ctx, x, y, (1.4 + s * 2.2) * size, '#F6F8FA');
  }
  ctx.restore();
}

function windStreaks(ctx, seed, n, t, cx, cy, spread, a = 1, speed = 900, len = 90) {
  const r = mulberry(seed); ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ox = (r() - 0.5) * spread, ph = r(), s = 0.6 + r() * 0.8;
    const yy = ((ph * 1400 - t * speed * s) % 1400 + 1400) % 1400 - 700;
    const fade = Math.sin(clamp((yy + 700) / 1400) * Math.PI);
    ctx.globalAlpha = a * fade * 0.55; ctx.strokeStyle = '#DCE4F0'; ctx.lineWidth = 1.5 + r() * 1.5;
    ctx.beginPath(); ctx.moveTo(cx + ox, cy + yy); ctx.quadraticCurveTo(cx + ox + 4, cy + yy + len * s * 0.5, cx + ox + jv(i, 3, 3), cy + yy + len * s); ctx.stroke();
  }
  ctx.restore();
}

// ---------- fire & smoke ----------
function flameTongue(ctx, x, y, h, w, t, seed, col, lean = 0) {
  const n = 9, L = [], R = [];
  const sway = snoise(t * 2.2 + seed) * w * 0.6 + lean * h;
  for (let k = 0; k <= n; k++) {
    const f = k / n; const hw = w * Math.pow(1 - f, 0.75) * (1 + 0.18 * Math.sin(f * 9 - t * 9 + seed));
    const cx = x + sway * Math.pow(f, 1.6) + snoise(f * 3 - t * 4 + seed * 3) * w * 0.35 * f;
    L.push([cx - hw, y - h * f]); R.unshift([cx + hw, y - h * f]);
  }
  shape(ctx, L.concat(R), { fill: col, ink: null, hatch: 0.12, amp: 0.8, id: seed });
}
function fire(ctx, x, y, h, w, t, seed, o = {}) {
  const k = o.n ?? 3; const lean = o.lean ?? 0; const a = o.a ?? 1;
  ctx.save(); ctx.globalAlpha *= a;
  if (o.glow !== false) glow(ctx, x, y - h * 0.4, h * 1.6 + w, 'rgba(255,150,60,0.45)', 1);
  for (let i = 0; i < k; i++) {
    const ox = (i - (k - 1) / 2) * w * 0.9; const hh = h * (0.7 + 0.35 * noise(t * 3 + i * 7 + seed));
    flameTongue(ctx, x + ox, y, hh, w * 0.7, t, seed + i * 11, C.fire0, lean);
  }
  for (let i = 0; i < k; i++) { const ox = (i - (k - 1) / 2) * w * 0.8; flameTongue(ctx, x + ox, y, h * (0.5 + 0.25 * noise(t * 4 + i * 5 + seed)), w * 0.5, t * 1.2, seed + i * 17 + 3, C.fire1, lean); }
  for (let i = 0; i < Math.max(1, k - 1); i++) { const ox = (i - (k - 2) / 2) * w * 0.7; flameTongue(ctx, x + ox, y, h * (0.3 + 0.15 * noise(t * 5 + i + seed)), w * 0.32, t * 1.4, seed + i * 23 + 5, C.fire2, lean); }
  flameTongue(ctx, x, y, h * 0.16, w * 0.18, t * 1.6, seed + 41, C.fire3, lean);
  ctx.restore();
}
function smoke(ctx, x, y, t, seed, o = {}) {
  const n = Math.round((o.n ?? 8) * 1.5), rise = o.rise ?? 260, dx = o.dx ?? 40, r0 = o.r0 ?? 20, r1 = o.r1 ?? 70, a = (o.a ?? 0.45) * 0.6, rate = o.rate ?? 0.35;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const age = ((t * rate + i / n + hash(seed + i) * 0.3) % 1);
    const px = x + dx * age + snoise(seed + i * 3 + t * 0.5) * 20 * age, py = y - rise * age;
    const rr = lerp(r0, r1, age);
    ctx.globalAlpha = a * Math.sin(age * Math.PI) * (o.alpha ?? 1);
    shape(ctx, ell(px, py, rr, rr * 0.85, 12), { fill: o.col || '#4A4858', ink: null, hatch: 0.45, light: 0.15, amp: rr * 0.12, id: seed + i });
  }
  ctx.restore();
}
function embers(ctx, x, y, t, seed, n = 12, spread = 80, rise = 220, a = 1) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const age = (t * 0.6 + hash(seed + i)) % 1; const px = x + (hash(seed + i * 2) - .5) * spread + Math.sin(t * 3 + i) * 10 * age, py = y - rise * age;
    ctx.globalAlpha = a * (1 - age); circleFill(ctx, px, py, 2 + 2 * hash(i + seed), i % 2 ? C.fire2 : C.fire3);
  }
  ctx.restore();
}

// ---------- aircraft ----------
// side view, facing right, fuselage spans x -300..300 (+turret), centred on wing
function lancasterSide(ctx, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s * (o.flip ? -1 : 1), s);
  const lw = (o.lw ?? 3.2) / Math.max(0.35, Math.min(1, s)); const id = 600;
  const sil = o.sil; const F = c => sil ? (o.silCol || C.belly) : c;
  // far side tail fin + far wing/engines
  shape(ctx, [[-312, -86], [-286, -92], [-270, -60], [-272, 26], [-292, 34], [-314, 20]], { fill: F(C.greenD), lw, id: id + 1 });
  shape(ctx, [[60, -6], [150, -10], [158, 4], [60, 6]], { fill: F(C.greenD), lw, id: id + 2, poly: true });
  shape(ctx, ell(118, -10, 34, 9, 12), { fill: F(C.belly), lw, id: id + 3 });
  // tailplane
  shape(ctx, [[-318, -12], [-230, -14], [-200, -6], [-318, -2]], { fill: F(C.green), lw, id: id + 4, poly: true });
  // fuselage
  const fus = [[300, 6], [292, -12], [262, -24], [228, -30], [210, -34], [196, -48], [168, -53], [140, -47], [120, -36], [40, -33], [-60, -34], [-150, -28], [-230, -20], [-282, -14], [-298, -10], [-298, 8], [-252, 13], [-150, 22], [0, 30], [150, 30], [240, 26], [282, 18]];
  const fp = shape(ctx, fus, { fill: F(C.green), lw, id: id + 5, amp: 1.2 });
  if (!sil) {
    ctx.save(); ctx.clip(fp); ctx.fillStyle = C.belly; ctx.globalAlpha = 0.95;
    ctx.beginPath(); ctx.moveTo(-320, 2); for (let i = -320; i <= 320; i += 40) ctx.lineTo(i, 4 + Math.sin(i * .05) * 2); ctx.lineTo(320, 60); ctx.lineTo(-320, 60); ctx.fill();
    ctx.globalAlpha = 0.18; ctx.fillStyle = pats(ctx).l; ctx.fill(fp); ctx.restore();
    // camo patches
    ctx.save(); ctx.clip(fp); ctx.globalAlpha = 0.55;
    shape(ctx, [[-180, -40], [-90, -40], [-120, -18], [-200, -16]], { fill: '#5E5236', ink: null, hatch: 0.2, id: id + 6 });
    shape(ctx, [[20, -40], [110, -40], [90, -20], [10, -18]], { fill: '#5E5236', ink: null, hatch: 0.2, id: id + 7 });
    ctx.restore();
    // canopy glazing
    shape(ctx, [[198, -46], [170, -51], [142, -46], [150, -35], [205, -34]], { fill: '#7E95A8', lw: lw * 0.8, id: id + 8 });
    line(ctx, [[176, -50], [176, -35]], { lw: lw * 0.6, id: id + 9 }); line(ctx, [[158, -48], [160, -35]], { lw: lw * 0.6, id: id + 10 });
    // nose blister
    shape(ctx, ell(286, 8, 18, 14, 12, 0, -1.4, 1.9), { fill: '#7E95A8', lw: lw * 0.8, id: id + 11, closed: true });
    // mid upper turret
    shape(ctx, ell(-60, -38, 18, 12, 12, 0, Math.PI, Math.PI * 2), { fill: '#7E95A8', lw: lw * 0.8, id: id + 12 });
    // roundel
    shape(ctx, ell(-130, -6, 15, 15, 14), { fill: '#2D3E6E', lw: lw * 0.6, id: id + 13, hatch: 0.1 });
    shape(ctx, ell(-130, -6, 7, 7, 10), { fill: '#9C3A32', ink: null, id: id + 14, hatch: 0.1 });
  }
  // near wing + engines
  shape(ctx, [[40, 0], [150, -4], [168, 8], [40, 12]], { fill: F(C.greenL), lw, id: id + 15, poly: true });
  shape(ctx, [[70, -8], [150, -14], [168, -6], [166, 12], [140, 18], [70, 12]], { fill: F(C.belly), lw, id: id + 16 });
  if (!sil) {
    // prop blur
    ctx.save(); ctx.globalAlpha *= 0.35; shape(ctx, ell(172, 2, 5, 34, 12), { fill: '#9AA4B0', ink: null, hatch: 0, id: id + 17 }); ctx.restore();
    line(ctx, [[172, -30], [172, 34]], { lw: lw * 0.5, ink: '#9AA4B0', id: id + 18 });
    // exhaust glow
    if (o.exhaust !== false) glow(ctx, 120, -8, 30, 'rgba(255,170,80,0.5)');
  }
  // near tail fin
  shape(ctx, [[-312, -96], [-282, -102], [-266, -66], [-268, 30], [-288, 40], [-314, 24]], { fill: F(C.green), lw, id: id + 19 });
  // rear turret
  shape(ctx, ell(-310, -2, 20, 16, 14), { fill: F('#7E95A8'), lw: lw * 0.8, id: id + 20 });
  if (!sil) for (let g = 0; g < 2; g++) line(ctx, [[-318, -6 + g * 8], [-352, -8 + g * 8]], { lw: lw * 0.7, id: id + 21 + g });
  ctx.restore();
}

// planform (seen from below), nose pointing up (-y), span ±300
function lancasterBelow(ctx, x, y, s, rot, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s * (o.squash ?? 1));
  const lw = (o.lw ?? 3) / Math.max(0.12, Math.min(1, s)); const id = 700; const col = o.col || '#2A2C34';
  shape(ctx, [[-95, 170], [95, 170], [92, 196], [-92, 196]], { fill: col, lw, id: id + 1, poly: true });
  for (const sx of [-1, 1]) shape(ctx, [[sx * 92, 158], [sx * 98, 158], [sx * 98, 206], [sx * 92, 206]], { fill: col, lw, id: id + 2 + sx, poly: true });
  shape(ctx, [[-30, -12], [-295, -2], [-302, 10], [-298, 18], [-120, 36], [-30, 52], [30, 52], [120, 36], [298, 18], [302, 10], [295, -2], [30, -12]], { fill: col, lw, id: id + 4, amp: 1 });
  for (const ex of [-150, -72, 72, 150]) { shape(ctx, [[ex - 11, -48], [ex + 11, -48], [ex + 13, 26], [ex - 13, 26]], { fill: '#1A1B22', lw, id: id + 10 + ex }); if (!o.noProp) { ctx.save(); ctx.globalAlpha *= .3; shape(ctx, ell(ex, -52, 30, 5, 10), { fill: '#A0A8B4', ink: null, hatch: 0, id: id + 20 + ex }); ctx.restore(); } }
  shape(ctx, [[0, -118], [14, -100], [17, -20], [15, 120], [9, 196], [0, 208], [-9, 196], [-15, 120], [-17, -20], [-14, -100]], { fill: col, lw, id: id + 30 });
  shape(ctx, ell(0, -108, 10, 9, 10), { fill: '#7E95A8', lw: lw * .7, id: id + 31 });
  ctx.restore();
}

function fighterSide(ctx, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s * (o.flip ? -1 : 1), s); const col = '#4A4E62'; const lw = 3 / Math.min(1, s);
  shape(ctx, [[-120, -30], [-104, -32], [-96, -4], [-118, -2]], { fill: col, lw, id: 801, poly: true });
  shape(ctx, [[130, 0], [118, -12], [80, -16], [60, -24], [30, -24], [10, -14], [-110, -6], [-118, 2], [-100, 8], [0, 12], [100, 10], [126, 6]], { fill: col, lw, id: 802 });
  shape(ctx, [[-20, 0], [70, -2], [76, 6], [-20, 8]], { fill: '#30323E', lw, id: 803, poly: true });
  shape(ctx, ell(40, 2, 30, 9, 10), { fill: '#1A1B22', lw, id: 804 });
  shape(ctx, [[30, -22], [58, -22], [62, -14], [28, -14]], { fill: '#5D6E80', lw: lw * .7, id: 805 });
  ctx.restore();
}

// ---------- characters ----------
const dirv = a => [Math.sin(a), -Math.cos(a)];
function limb(ctx, a, b, w, fill, ink, lw, bend = 0, id = 0) {
  const mx = (a[0] + b[0]) / 2 + bend * (b[1] - a[1]) * 0.12 + jv(id, 1, 0.8), my = (a[1] + b[1]) / 2 - bend * (b[0] - a[0]) * 0.12 + jv(id, 2, 0.8);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = new Path2D(); path.moveTo(a[0], a[1]); path.quadraticCurveTo(mx, my, b[0], b[1]);
  if (ink) { ctx.strokeStyle = ink; ctx.lineWidth = w + lw * 2; ctx.stroke(path); }
  ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke(path);
  ctx.save(); ctx.globalAlpha *= 0.25; ctx.strokeStyle = pats(ctx).d; ctx.stroke(path); ctx.restore();
}
// P: x,y (hip), s, a (torso angle, 0 up), h (head tilt), la/ra/ll/rl: [upper, lower] relative angles
function person(ctx, P, o = {}) {
  const s = P.s || 1; const sil = o.sil; const lw = (o.lw ?? 2.6);
  const K = Object.assign({ jacket: C.jacket, collar: C.collar, legs: C.trousers, boot: C.boot, glove: '#3A2A20', head: C.helmet, face: C.skin }, o.pal || {});
  const col = k => sil ? (o.silCol || C.ink) : K[k];
  const ink = sil ? (o.silCol || C.ink) : C.ink;
  ctx.save(); ctx.translate(P.x, P.y); ctx.scale(s, s);
  const a = P.a || 0; const hip = [0, 0]; const dv = dirv(a);
  const neck = [dv[0] * 32, dv[1] * 32]; const sh = [dv[0] * 28, dv[1] * 28];
  const pt = (o0, ang, len) => [o0[0] + Math.sin(ang) * len, o0[1] - Math.cos(ang) * len];
  const arm = (r, side) => { const e = pt(sh, a + r[0], 17); const h2 = pt(e, a + r[0] + r[1], 16); return [e, h2]; };
  const leg = (r) => { const k = pt(hip, a + Math.PI + r[0], 22); const f = pt(k, a + Math.PI + r[0] + r[1], 22); return [k, f]; };
  const [le, lh] = arm(P.la || [2.6, 0.3]), [re, rh] = arm(P.ra || [-2.6, -0.3]);
  const [lk, lf] = leg(P.ll || [0.25, 0]), [rk, rf] = leg(P.rl || [-0.25, 0]);
  const LW = o.coat ? 14 : 11;
  // far limbs
  limb(ctx, sh, le, 9.5, col('jacket'), ink, lw, 0.3, 1); limb(ctx, le, lh, 8.5, col('jacket'), ink, lw, 0, 2); circleFill(ctx, lh[0], lh[1], 5, col('glove'));
  limb(ctx, hip, lk, LW, col('legs'), ink, lw, 0, 3); limb(ctx, lk, lf, 10, col('legs'), ink, lw, 0, 4); limb(ctx, lf, pt(lf, a + Math.PI + (P.ll || [0.25, 0])[0] + (P.ll || [0, 0])[1] + 1.4, 6), 9, col('boot'), ink, lw, 0, 5);
  // torso
  if (o.coat) {
    const L = 46; const cb = pt(hip, a + Math.PI, 20);
    const pts = [pt(neck, a - 1.4, 9), pt(neck, a + 1.4, 9), pt(cb, a + 1.75, 15), pt(cb, a - 1.75, 15)];
    shape(ctx, pts, { fill: col('jacket'), lw, id: 11, amp: 0.5 });
  } else limb(ctx, hip, neck, 22, col('jacket'), ink, lw, 0, 6);
  if (!sil && o.blanket) { const pts = [pt(neck, a - 1.6, 14), pt(neck, a + 1.6, 14), pt(hip, a + 1.9, 16), pt(hip, a - 1.9, 16)]; shape(ctx, pts, { fill: C.blanket, lw, id: 12, amp: 0.6, hatch: 0.35 }); }
  if (!sil && !o.coat && !o.blanket) { const c0 = pt(neck, a, -1); shape(ctx, ell(c0[0], c0[1], 12, 6, 10, a), { fill: col('collar'), lw: lw * 0.8, id: 7, amp: 0.8 }); }
  // near limbs
  limb(ctx, hip, rk, LW, col('legs'), ink, lw, 0, 8); limb(ctx, rk, rf, 10, col('legs'), ink, lw, 0, 9); limb(ctx, rf, pt(rf, a + Math.PI + (P.rl || [-0.25, 0])[0] + (P.rl || [0, 0])[1] - 1.4, 6), 9, col('boot'), ink, lw, 0, 10);
  // head
  const hc = pt(neck, a + (P.h || 0), 10);
  shape(ctx, ell(hc[0], hc[1], 9, 10, 12, a), { fill: col('face'), lw, id: 20, amp: 0.4 });
  if (!sil) {
    if (o.cap === 'field') shape(ctx, [pt(hc, a - 1.6, 9.5), pt(hc, a - 0.5, 11.5), pt(hc, a + 0.4, 11), pt(hc, a + 1.6, 9.5)], { fill: C.cap, lw, id: 21, amp: 0.4 });
    else if (o.cap === 'none') { }
    else { shape(ctx, ell(hc[0], hc[1], 9.6, 10.6, 12, a, Math.PI * 0.95, Math.PI * 2.05), { fill: col('head'), lw, id: 22, amp: 0.4 }); }
    const ey = pt(hc, a + (P.look ?? 0.6), 4.5); circleFill(ctx, ey[0], ey[1], 1.3, C.ink);
  }
  limb(ctx, sh, re, 9.5, col('jacket'), ink, lw, -0.3, 13); limb(ctx, re, rh, 8.5, col('jacket'), ink, lw, 0, 14); circleFill(ctx, rh[0], rh[1], 5, col('glove'));
  ctx.restore();
}

// close-up bust of the airman. x,y = chin-ish centre, s scale. o: turn (-1..1), lookX, lookY, brow, mouth, light ('fire'|'cool'|null)
function airmanBust(ctx, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.tilt || 0);
  const turn = o.turn || 0, id = 900;
  // shoulders / jacket
  shape(ctx, [[-170, 300], [-150, 150], [-90, 95], [90, 95], [150, 150], [170, 300]], { fill: o.blanket ? C.blanket : C.jacket, id: id + 1, lw: 4, hatch: 0.32 });
  if (o.blanket) shape(ctx, [[-130, 300], [-110, 170], [-60, 110], [-30, 300]], { fill: C.blanketD, id: id + 30, lw: 3, hatch: 0.3 });
  // collar fleece
  if (!o.blanket) {
    const cp = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (1.05 + i / 16 * 0.9); cp.push([Math.cos(a) * (120 + (i % 2) * 10), 140 + Math.sin(a) * 60]); }
    cp.push([95, 150], [40, 195], [0, 150], [-40, 195], [-95, 150]);
    shape(ctx, cp, { fill: C.collar, id: id + 2, lw: 3.5, hatch: 0.15, amp: 2 });
  }
  // neck
  shape(ctx, [[-30 + turn * 10, 60], [30 + turn * 10, 60], [34 + turn * 10, 130], [-34 + turn * 10, 130]], { fill: C.skinS, id: id + 3, lw: 3.5 });
  const fx = turn * 34;
  // ear flaps / helmet back
  shape(ctx, ell(fx * 0.3, -20, 68, 78, 20), { fill: C.helmet, id: id + 4, lw: 4, hatch: 0.3 });
  // face
  const facePts = ell(fx, 0, 52 - Math.abs(turn) * 6, 64, 20);
  shape(ctx, facePts, { fill: C.skin, id: id + 5, lw: 3.8, hatch: 0.12 });
  // helmet top + flaps over face sides
  shape(ctx, [[-70 + fx * 0.3, -10], [-66 + fx * .3, -60], [-30 + fx * .3, -96], [30 + fx * .3, -96], [66 + fx * .3, -60], [70 + fx * .3, -10], [55 + fx, -34], [0 + fx, -46], [-55 + fx, -34]], { fill: C.helmet, id: id + 6, lw: 4, hatch: 0.3 });
  line(ctx, [[fx * 0.6, -94], [fx * 0.9, -48]], { lw: 2, id: id + 7, ink: '#2C1E14' });
  // ear phones
  const side = turn > 0 ? -1 : 1;
  shape(ctx, ell(-62 + fx * 0.3 + (turn > 0.3 ? 8 : 0), 4, 15, 20, 12), { fill: C.helmetL, id: id + 8, lw: 3 });
  if (Math.abs(turn) < 0.45) shape(ctx, ell(62 + fx * 0.3, 4, 15, 20, 12), { fill: C.helmetL, id: id + 9, lw: 3 });
  // goggles on forehead
  if (o.goggles !== false) {
    line(ctx, [[-66 + fx * .3, -52], [-40 + fx, -60], [40 + fx, -60], [66 + fx * .3, -52]], { lw: 8, ink: '#3A2C22', id: id + 10, sketch: false });
    for (const gx of [-22, 22]) { shape(ctx, ell(gx + fx, -62, 20, 15, 14), { fill: C.glass, id: id + 11 + gx, lw: 3.5, hatch: 0.1 }); circleFill(ctx, gx + fx - 6, -66, 4, 'rgba(255,255,255,0.7)'); }
  }
  // brows
  const br = o.brow || 0; // positive = worried
  line(ctx, [[-36 + fx, -26 + br * 2], [-14 + fx, -30 - br * 4]], { lw: 4.5, id: id + 14 });
  line(ctx, [[14 + fx, -30 - br * 4], [36 + fx, -26 + br * 2]], { lw: 4.5, id: id + 15 });
  // eyes
  const lx = (o.lookX || 0) * 4, ly = (o.lookY || 0) * 3; const eo = o.eyeOpen ?? 1;
  for (const ex of [-24, 24]) {
    shape(ctx, ell(ex + fx, -12, 9, 7 * eo + 0.5, 12), { fill: '#FBF6EC', id: id + 16 + ex, lw: 2.2, hatch: 0 });
    if (eo > 0.25) { circleFill(ctx, ex + fx + lx, -12 + ly, 4.6, C.ink); circleFill(ctx, ex + fx + lx + 1.5, -14 + ly, 1.4, '#fff'); }
  }
  // nose
  line(ctx, [[fx + turn * 8 + 2, -6], [fx + turn * 14 + 6, 16], [fx + turn * 6 - 4, 20]], { lw: 3, id: id + 20 });
  // mouth
  const m = o.mouth || 0; // 0 neutral, 1 open O, -1 tight
  if (m > 0.5) shape(ctx, ell(fx + turn * 4, 36, 8, 10 * m, 10), { fill: '#5A2E2A', lw: 2.6, id: id + 21, hatch: 0 });
  else line(ctx, [[fx - 14, 36 + Math.abs(m) * 2], [fx, 34], [fx + 14, 37]], { lw: 3, id: id + 22 });
  // cheeks firelight etc.
  if (o.light) {
    ctx.save(); ctx.globalCompositeOperation = 'source-atop';
    ctx.restore();
  }
  ctx.restore();
}

function germanBust(ctx, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s); ctx.rotate(o.tilt || 0);
  const id = o.id ?? 950;
  shape(ctx, [[-170, 300], [-150, 150], [-95, 100], [95, 100], [150, 150], [170, 300]], { fill: C.gray, id: id + 1, lw: 4, hatch: 0.3 });
  shape(ctx, [[-60, 100], [0, 175], [60, 100], [40, 92], [0, 140], [-40, 92]], { fill: C.grayD, id: id + 2, lw: 3.5 });
  for (let b = 0; b < 3; b++) circleFill(ctx, 0, 190 + b * 38, 6, '#9C9A86');
  shape(ctx, [[-28, 60], [28, 60], [32, 120], [-32, 120]], { fill: C.skinS, id: id + 3, lw: 3.5 });
  shape(ctx, ell(0, 0, 54, 64, 20), { fill: C.skin, id: id + 4, lw: 3.8, hatch: 0.12 });
  shape(ctx, ell(-54, 6, 10, 16, 10), { fill: C.skin, id: id + 5, lw: 3 }); shape(ctx, ell(54, 6, 10, 16, 10), { fill: C.skin, id: id + 6, lw: 3 });
  if (o.cap === 'peaked') {
    shape(ctx, [[-70, -50], [-60, -92], [0, -112], [60, -92], [70, -50], [0, -56]], { fill: C.cap, id: id + 7, lw: 4, hatch: 0.3 });
    shape(ctx, [[-62, -50], [62, -50], [56, -34], [0, -28], [-56, -34]], { fill: '#1E1E22', id: id + 8, lw: 3.5 });
    line(ctx, [[-64, -58], [64, -58]], { lw: 3, ink: '#3B3E33', id: id + 9 });
  } else {
    shape(ctx, [[-58, -38], [-50, -74], [0, -84], [50, -76], [58, -38], [0, -50]], { fill: C.cap, id: id + 7, lw: 4, hatch: 0.3 });
  }
  const br = o.brow || 0, br2 = o.brow2 ?? br;
  line(ctx, [[-36, -20 - br * 6], [-12, -24 - br * 2]], { lw: 5, id: id + 10 });
  line(ctx, [[12, -24 - br2 * 2], [36, -20 - br2 * 9]], { lw: 5, id: id + 11 });
  const lx = (o.lookX || 0) * 4, ly = (o.lookY || 0) * 3; const eo = o.eyeOpen ?? 1;
  for (const ex of [-24, 24]) { shape(ctx, ell(ex, -6, 9, 7 * eo + 0.5, 12), { fill: '#FBF6EC', id: id + 12 + ex, lw: 2.2, hatch: 0 }); circleFill(ctx, ex + lx, -6 + ly, eo > 1.1 ? 3.6 : 4.6, C.ink); }
  line(ctx, [[2, 0], [8, 22], [-2, 26]], { lw: 3, id: id + 14 });
  const m = o.mouth || 0;
  if (m > 0.5) shape(ctx, ell(0, 42, 9, 11 * m, 10), { fill: '#5A2E2A', lw: 2.6, id: id + 15, hatch: 0 });
  else line(ctx, [[-16, 40 + m * 3], [0, 40 - m * 2], [16, 40 + m * 4]], { lw: 3, id: id + 16 });
  if (o.moustache) shape(ctx, [[-18, 30], [0, 26], [18, 30], [10, 34], [-10, 34]], { fill: '#5A4634', lw: 2, id: id + 17 });
  ctx.restore();
}

function parachutePack(ctx, x, y, s, o = {}) {
  const dmg = o.dmg || 0, t = o.t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.rot || 0);
  const id = 1000;
  // straps behind
  const drop = o.strapDrop || 0;
  line(ctx, [[-60, -70], [-74, 20], [-70 - drop * 10, 120 + drop * 60], [-84 - drop * 20, 170 + drop * 90]], { lw: 16, ink: C.ink, id: id + 1, sketch: false });
  line(ctx, [[-60, -70], [-74, 20], [-70 - drop * 10, 120 + drop * 60], [-84 - drop * 20, 170 + drop * 90]], { lw: 10, ink: C.strap, id: id + 1, sketch: false });
  line(ctx, [[60, -70], [78, 30], [74, 140]], { lw: 16, ink: C.ink, id: id + 2, sketch: false });
  line(ctx, [[60, -70], [78, 30], [74, 140]], { lw: 10, ink: C.strap, id: id + 2, sketch: false });
  // pack body
  const body = [[-80, -70], [80, -70], [86, -60], [86, 66], [78, 76], [-78, 76], [-86, 66], [-86, -60]];
  const bp = shape(ctx, body, { fill: C.pack, id: id + 3, lw: 4.5, hatch: 0.3 });
  shape(ctx, [[-80, -70], [80, -70], [86, -60], [84, -14], [0, 0], [-84, -14], [-86, -60]], { fill: '#A39D78', id: id + 4, lw: 3.5, hatch: 0.25 });
  line(ctx, [[-60, 30], [60, 30]], { lw: 2, id: id + 5, inkA: 0.6 });
  // handle & clips
  shape(ctx, [[-22, -10], [22, -10], [26, 6], [-26, 6]], { fill: '#C9483A', id: id + 6, lw: 3 });
  for (const cx of [-72, 72]) { shape(ctx, [[cx - 12, 70], [cx + 12, 70], [cx + 12, 92], [cx - 12, 92]], { fill: '#B7BEC4', id: id + 7 + cx, lw: 3, poly: true }); }
  // damage: char patches
  if (dmg > 0) {
    ctx.save(); ctx.clip(bp);
    const spots = [[30, 40, 1], [-40, 50, 0.85], [60, -20, 0.6], [-10, -40, 0.5], [-70, -10, 0.7], [0, 10, 0.4]];
    spots.forEach(([sx, sy, w], i) => { const r = 70 * clamp(dmg * 1.4 - i * 0.12) * w; if (r <= 0) return;
      ctx.globalAlpha = 0.85; shape(ctx, ell(sx, sy, r, r * 0.8, 12), { fill: '#3A2A22', ink: null, hatch: 0.5, amp: r * 0.15, id: id + 20 + i });
      ctx.globalAlpha = 0.9 * (0.6 + 0.4 * Math.sin(t * 6 + i)); shape(ctx, ell(sx, sy, r * 1.03, r * 0.83, 12), { ink: C.fire1, lw: 3, amp: r * 0.15, id: id + 20 + i, closed: true, sketch: false, fill: null }); });
    ctx.restore();
  }
  ctx.restore();
}
