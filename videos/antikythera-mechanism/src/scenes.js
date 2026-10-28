'use strict';
// ---------------------------------------------------------------------------
// Scene timeline (seconds). Overlaps are transitions.
// ---------------------------------------------------------------------------
const POOL = [];
function layer(i) { if (!POOL[i]) POOL[i] = mkCanvas(W, H); const c = POOL[i]; const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); return x; }
let LAYER_DEPTH = 2;
// draw fn into an offscreen layer then composite with alpha
function withLayer(ctx, alpha, fn) {
  if (alpha <= 0) return; if (alpha >= 1) { fn(ctx); return; }
  const lx = layer(LAYER_DEPTH++); fn(lx); LAYER_DEPTH--;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(lx.canvas, 0, 0); ctx.restore();
}
// camera: world point (fx,fy) lands at screen (sx,sy), scale s, with gentle drift
function cam(ctx, fx, fy, s, sx = W / 2, sy = 1190, rot = 0) {
  const t = TIME;
  ctx.translate(sx + Math.sin(t * 0.37) * 5, sy + Math.cos(t * 0.29) * 5);
  ctx.rotate(rot + Math.sin(t * 0.23) * 0.004);
  ctx.scale(s, s); ctx.translate(-fx, -fy);
}

// ============================ SCENE 1 — HOOK ===============================
// Diver reaches for a corroded lump; it cracks open into turning gears.
const S1 = { frag: [470, 1440], fs: 175 };
function scene1(ctx, t) {
  water(ctx, t);
  ctx.save();
  cam(ctx, 640, 1340, 1.32 + 0.06 * ease(t / 5.4), W / 2, 1230);
  seabedWreck(ctx, t, 1560);
  const xr = easeOut(prog(t, 0.08, 0.7)) * (1 - ease(prog(t, 3.9, 4.6)));
  fragment(ctx, S1.frag[0], S1.frag[1], S1.fs, -0.1, t, { xray: xr, spin: t * 1.6, gearVis: 0.6 });
  sparks(ctx, S1.frag[0], S1.frag[1], S1.fs * 1.1, S1.fs * 1.45, 9, Math.sin(clamp(prog(t, 0.35, 1.5)) * Math.PI), C.foam, 3);
  const reach = lerp(0.55, 1, easeOut(prog(t, 0, 1.1)));
  diver(ctx, 940, 1398, 0.95, t, { reach });
  bubbles(ctx, t, 884, 1070, 7, 1, 900, 26);
  bubbles(ctx, t, S1.frag[0] + 40, S1.frag[1] - 150, 4, 9, 600, 60, 0.7);
  ctx.restore();
  marineSnow(ctx, t, 36, 1);
  // escaping bubble that becomes the transition iris
  const bp = prog(t, 4.35, 4.9);
  if (bp > 0) { const [bx, by, br] = irisS1(0, bp); bubble(ctx, bx, by, br, 1, 77); }
}
function irisS1(p, pre = 1) { // centre and radius of the growing bubble
  const x = lerp(S1.frag[0] + 20, 540, ease(pre)) , y = lerp(S1.frag[1] - 120, 1180, ease(pre));
  const r = lerp(14, 70, pre) + easeIn(p) * 1500;
  return [x, y, r];
}
function seabedWreck(ctx, t, y0) {
  wreck(ctx, 250, y0 - 40, 1.1, -0.12);
  amphora(ctx, 120, y0 + 120, 95, -1.2, 3);
  seabed(ctx, t, y0 + 40);
  amphora(ctx, 850, y0 + 70, 120, 1.35, 1, { barn: true });
  amphora(ctx, 1000, y0 + 20, 100, 1.75, 2);
  amphora(ctx, 690, y0 + 130, 80, -1.45, 4, { barn: true });
  weed(ctx, t, 50, y0 + 140, 230, 1);
  weed(ctx, t, 1030, y0 + 160, 260, 2, '#4f7d55');
  weed(ctx, t, 330, y0 + 170, 160, 3, '#6b9660');
}

// ========================== SCENE 2 — DISCOVERY ============================
function scene2(ctx, t) {
  const aA = 1 - smooth(prog(t, 8.9, 9.4));
  const aC = smooth(prog(t, 11.15, 11.6));
  if (aA > 0 && aC < 1) scene2Dive(ctx, t);
  if (aA < 1 && aC < 1) withLayer(ctx, 1 - aA, x => scene2Map(x, t));
  if (aC > 0) withLayer(ctx, aC, x => scene2Lift(x, t));
  // ocean current -> map route
  const cp = prog(t, 8.1, 9.5);
  if (cp > 0 && cp < 1) currents(ctx, t, cp);
}
function currents(ctx, t, p) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 6; i++) {
    const y = 760 + i * 150, pts = [];
    const head = lerp(-300, 1500, ease(p) ) - i * 60, tail = head - 700;
    for (let k = 0; k <= 14; k++) { const x = lerp(tail, head, k / 14); pts.push([x, y + Math.sin(x * 0.008 + t * 2 + i) * 40]); }
    line(ctx, pts, { stroke: i % 2 ? '#e8f1ef' : '#cfe2e8', lw: 6, seed: 400 + i, alpha: Math.sin(p * Math.PI) * 0.9 });
  }
  ctx.restore();
}
function scene2Dive(ctx, t) {
  paperBg(ctx);
  ctx.save();
  const fy = lerp(830, 1980, ease(prog(t, 5.2, 8.4)));
  cam(ctx, 540, fy, 1, W / 2, 1190);
  // sea body (world space)
  const g = ctx.createLinearGradient(0, 560, 0, 2600);
  g.addColorStop(0, '#8fb5c8'); g.addColorStop(0.45, C.sea); g.addColorStop(1, C.seaDeep);
  const surf = []; for (let i = 0; i <= 24; i++) surf.push([-200 + i * 62, 560 + Math.sin(i * 0.9 + t * 2.2) * 9]);
  draw(ctx, surf.concat([[1300, 2900], [-200, 2900]]), { fill: g, seed: 410, lw: 5, step: 30 });
  for (let i = 0; i < 6; i++) line(ctx, [[-50 + i * 220, 590 + (i % 2) * 18], [40 + i * 220, 596 + (i % 2) * 18]], { stroke: C.foam, lw: 4, seed: 411 + i, single: true, alpha: 0.8 });
  // light rays in world
  ctx.save(); for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.07; ctx.fillStyle = '#fff9e2'; const x0 = 100 + i * 230 + Math.sin(t * 0.6 + i) * 30; ctx.beginPath(); ctx.moveTo(x0, 570); ctx.lineTo(x0 + 70, 570); ctx.lineTo(x0 - 120, 2300); ctx.lineTo(x0 - 300, 2300); ctx.fill(); } ctx.restore();
  // sun in the sky + gulls
  sunBody(ctx, 900, 470, 40, t, { lw: 3 });
  for (let i = 0; i < 3; i++) { const gx = 200 + i * 110 + Math.sin(t + i) * 10, gy = 430 + i * 20; line(ctx, [[gx - 22, gy], [gx - 8, gy - 10], [gx, gy], [gx + 8, gy - 10], [gx + 22, gy]], { lw: 3.5, seed: 420 + i, single: true }); }
  const hand = caique(ctx, 400, 575, 0.95, t);
  // seabed + wreck
  const y0 = 2240;
  wreck(ctx, 560, y0, 1.3, 0.08, { color: '#4f3726' });
  statueArm(ctx, 860, y0 + 60, 0.9, 0.25, t);
  seabed(ctx, t, y0 + 50, { seed: 3 });
  marbleHead(ctx, 230, y0 + 120, 0.75, 1.5);
  amphora(ctx, 420, y0 + 110, 90, 1.2, 5, { barn: true });
  amphora(ctx, 650, y0 + 150, 75, -1.3, 6);
  amphora(ctx, 1010, y0 + 120, 85, 1.6, 7, { barn: true });
  weed(ctx, t, 90, y0 + 160, 210, 4);
  weed(ctx, t, 980, y0 + 180, 180, 5, '#4f7d55');
  // basket of bronze lifted by rope
  const by = lerp(y0 + 30, y0 - 420, ease(prog(t, 6.6, 9.2)));
  rope(ctx, [hand, [hand[0] + 20, 900], [430, by - 110]]);
  basket(ctx, 430, by, t);
  // descending diver on a guide line
  const dy = lerp(1080, 1820, ease(prog(t, 4.9, 8.6)));
  line(ctx, [[hand[0] + 160, 600], [700, 2300]], { stroke: '#b59a6a', lw: 3, seed: 430, single: true, alpha: 0.8 });
  diver(ctx, 760, dy, 0.6, t + 1, { reach: 0.25, rot: 0.15, hoseEnd: [hand[0] + 140, 600] });
  bubbles(ctx, t, 730, dy - 210, 6, 3, 600, 20, 0.8);
  ctx.restore();
  marineSnow(ctx, t, 26, 5, 0.5);
}
function basket(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.3) * 0.06);
  line(ctx, [[-70, -20], [0, -110], [70, -20]], { lw: 3.5, seed: 440 });
  fragment(ctx, -15, -30, 48, 0.3, t, { gearVis: 0.4, shadow: false, seed: 120 });
  fragment(ctx, 35, -18, 30, -0.4, t, { shape: FRAG_B, shadow: false, seed: 131 });
  const bk = [[-80, -20], [80, -20], [64, 70], [-64, 70]];
  draw(ctx, bk, { fill: '#a98a58', seed: 441, lw: 4 });
  for (let i = 0; i < 5; i++) line(ctx, [[-76 + i * 3, -2 + i * 16], [76 - i * 3, -2 + i * 16]], { lw: 2, seed: 442 + i, single: true, alpha: 0.6 });
  for (let i = 0; i < 6; i++) line(ctx, [[-70 + i * 28, -18], [-56 + i * 22, 68]], { lw: 2, seed: 450 + i, single: true, alpha: 0.6 });
  ctx.restore();
}

// --- parchment map of the southern Aegean (no labels) ---
const MAPF = (lon, lat) => [90 + (lon - 20.8) * 140, 560 + (39.2 - lat) * 175];
const GEO = {
  pelop: [[21.35, 38.2], [21.9, 38.3], [22.5, 38.1], [22.9, 37.95], [23.2, 37.7], [23.1, 37.5], [22.8, 37.55], [22.75, 37.05], [23.05, 36.45], [22.8, 36.75], [22.6, 36.65], [22.5, 36.4], [22.35, 36.8], [22.1, 36.95], [21.95, 36.75], [21.7, 36.8], [21.6, 37.15], [21.65, 37.6], [21.3, 37.7], [21.1, 37.85]],
  main: [[20.4, 39.6], [20.6, 39.2], [20.9, 38.85], [21.15, 38.4], [21.8, 38.4], [22.5, 38.3], [22.9, 38.08], [23.2, 38.02], [23.55, 38.0], [23.7, 37.9], [24.05, 37.66], [24.05, 38.15], [23.6, 38.5], [23.2, 38.75], [22.7, 38.9], [23.0, 39.1], [22.8, 39.4], [22.6, 39.7]],
  euboea: [[22.9, 38.95], [23.5, 38.75], [24.15, 38.6], [24.6, 38.1], [24.45, 37.98], [23.9, 38.35], [23.3, 38.58], [22.82, 38.82]],
  crete: [[23.55, 35.57], [24.0, 35.52], [24.3, 35.37], [25.0, 35.43], [25.75, 35.3], [26.3, 35.28], [26.25, 35.0], [25.5, 34.98], [24.8, 34.93], [24.2, 35.16], [23.6, 35.25]],
  asia: [[26.6, 39.7], [26.6, 39.3], [26.95, 38.75], [26.45, 38.4], [26.85, 38.3], [27.2, 37.95], [27.25, 37.4], [27.55, 37.0], [27.7, 36.6], [28.4, 36.6], [28.4, 39.7]],
};
const ISLES = [[23.0, 36.25, 0.14], [24.42, 36.7, 0.12], [25.45, 37.05, 0.14], [25.15, 37.08, 0.09], [25.4, 36.42, 0.07], [24.85, 37.85, 0.12], [25.15, 37.6, 0.08], [24.92, 37.44, 0.06], [24.33, 37.62, 0.07], [24.47, 37.15, 0.06], [25.3, 36.72, 0.06], [25.85, 36.84, 0.08], [26.95, 37.7, 0.12], [26.1, 38.35, 0.22], [27.9, 36.25, 0.2]];
const ANTIKY = MAPF(23.3, 35.87);
function scene2Map(ctx, t) {
  paperBg(ctx);
  ctx.save();
  const z = 1 + 0.18 * ease(prog(t, 9.3, 11.0)) + 3.2 * easeIn(prog(t, 10.9, 11.7));
  cam(ctx, lerp(540, ANTIKY[0], ease(prog(t, 9.3, 11.3))), lerp(1050, ANTIKY[1], ease(prog(t, 9.3, 11.3))), z, W / 2, 1180);
  const sheet = [[70, 500], [300, 486], [600, 498], [1012, 480], [1000, 900], [1018, 1300], [1004, 1590], [600, 1604], [300, 1590], [64, 1600], [80, 1200], [62, 800]];
  draw(ctx, xf(sheet, 10, 14), { fill: 'rgba(60,40,30,0.25)', stroke: null, lw: 0, tex: false, seed: 460 });
  draw(ctx, sheet, { fill: C.parch, seed: 461, lw: 5, step: 24 });
  ctx.save(); ctx.beginPath(); tr(ctx, sheet, true, true); ctx.clip();
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#8fb3c4'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = texPat(ctx); ctx.fillRect(0, 0, W, H); ctx.restore();
  for (let i = 0; i < 9; i++) { const yy = 600 + i * 110; line(ctx, [[120, yy], [300, yy + 8], [520, yy - 6], [760, yy + 6], [980, yy]], { stroke: '#7c9db0', lw: 2, seed: 470 + i, single: true, alpha: 0.4 }); }
  const landStyle = { fill: '#d9c08a', lw: 4, step: 14, amp: 1.6, shade: [6, 6, 'rgba(120,90,40,0.2)'] };
  for (const k of ['main', 'pelop', 'euboea', 'crete', 'asia']) draw(ctx, GEO[k].map(p => MAPF(p[0], p[1])), Object.assign({ seed: 480 + k.length }, landStyle));
  ISLES.forEach(([lo, la, r], i) => { const [x, y] = MAPF(lo, la); draw(ctx, ellAt(x, y, r * 140, r * 110, 9, i), Object.assign({}, landStyle, { seed: 490 + i, lw: 3 })); });
  // mountains on mainland
  for (let i = 0; i < 6; i++) { const [x, y] = MAPF(21.6 + i * 0.35, 38.75 + (i % 2) * 0.25); line(ctx, [[x - 18, y + 10], [x, y - 14], [x + 18, y + 10]], { lw: 2.5, seed: 500 + i, single: true, alpha: 0.6 }); }
  ctx.restore();
  // compass rose
  compass(ctx, 900, 1460, 60, t);
  // route of the ship from the east, ending at Antikythera
  const route = []; const p = ease(prog(t, 9.0, 10.5));
  const R0 = [[1040, 1070], [920, 1120], [800, 1080], [680, 1170], [560, 1150], [ANTIKY[0] + 16, ANTIKY[1] + 4]];
  const N = 40; for (let i = 0; i <= N * p; i++) { const u = i / N * (R0.length - 1), k = Math.min(R0.length - 2, Math.floor(u)), f = u - k; route.push([lerp(R0[k][0], R0[k + 1][0], f), lerp(R0[k][1], R0[k + 1][1], f) + Math.sin(u * 2) * 8]); }
  if (route.length > 1) line(ctx, route, { stroke: C.red, lw: 5, dash: [16, 12], seed: 510, single: true });
  draw(ctx, ellAt(ANTIKY[0], ANTIKY[1], 12, 8, 10), { fill: '#d9c08a', lw: 3, seed: 511 });
  const xp = prog(t, 10.4, 10.8);
  if (xp > 0) {
    const [x, y] = ANTIKY, r = 18 * backOut(xp);
    line(ctx, [[x - r, y - r], [x + r, y + r]], { stroke: C.red, lw: 7, seed: 512 });
    line(ctx, [[x + r, y - r], [x - r, y + r]], { stroke: C.red, lw: 7, seed: 513 });
    const pr = fr((t - 10.4) / 0.9);
    draw(ctx, circAt(x, y, 20 + pr * 50, 18), { fill: null, stroke: C.red, lw: 3, alpha: (1 - pr) * 0.8, seed: 514, single: true });
    // tiny sunken ship
    ctx.save(); ctx.translate(x + 44, y + 36); ctx.rotate(0.5); ctx.globalAlpha *= xp;
    draw(ctx, [[-24, 0], [24, 0], [16, 12], [-16, 12]], { fill: C.woodDk, lw: 2.5, seed: 515 }); line(ctx, [[0, 0], [0, -26]], { lw: 2.5, seed: 516 });
    ctx.restore();
  }
  ctx.restore();
}
function compass(ctx, x, y, r, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.8) * 0.05);
  draw(ctx, circ(r, 20), { fill: C.parchLt, lw: 3, seed: 520 });
  draw(ctx, [[0, -r * 1.3], [r * 0.2, 0], [0, r * 1.3], [-r * 0.2, 0]], { fill: C.brass, sharp: true, lw: 3, seed: 521 });
  draw(ctx, [[-r * 1.1, 0], [0, r * 0.18], [r * 1.1, 0], [0, -r * 0.18]], { fill: C.parchDk, sharp: true, lw: 3, seed: 522 });
  draw(ctx, [[0, -r * 1.3], [r * 0.2, 0], [-r * 0.2, 0]], { fill: C.red, sharp: true, lw: 3, seed: 523 });
  ctx.restore();
}
function scene2Lift(ctx, t) {
  water(ctx, t, { top: '#9cc0cf', mid: '#6f97b2' });
  ctx.save();
  cam(ctx, 540, 1250, 1.0 + 0.04 * prog(t, 11.2, 13.1), W / 2, 1250);
  const y = lerp(1420, 1270, ease(prog(t, 11.2, 13.1)));
  // rope net cradling the fragment
  rope(ctx, [[400, 300], [460, y - 200], [430, y - 120]]);
  rope(ctx, [[700, 300], [640, y - 200], [660, y - 120]]);
  fragment(ctx, 540, y, 175, -0.1, t, { gearVis: 0.55 });
  for (let i = 0; i < 6; i++) line(ctx, [[380 + i * 10, y - 130 + i * 50], [700 - i * 6, y - 120 + i * 52]], { stroke: '#b59a6a', lw: 4, seed: 530 + i, single: true, alpha: 0.85 });
  for (let i = 0; i < 6; i++) line(ctx, [[400 + i * 60, y - 140], [420 + i * 50, y + 180]], { stroke: '#b59a6a', lw: 4, seed: 540 + i, single: true, alpha: 0.85 });
  bubbles(ctx, t, 540, y + 120, 10, 21, 900, 300);
  ctx.restore();
  marineSnow(ctx, t, 30, 8, 0.6);
}
