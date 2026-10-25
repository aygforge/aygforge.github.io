// Kurt ailesi (Boz Kurt, Sürü Kurdu, Alfa Kurt, Ayaz Kurdu): eklemli bacaklarla procedural piksel çizim.
// Yandan görünüm, sağa bakar. Koşu 6 karelik tırıs döngüsüdür (çapraz bacak çiftleri birlikte adım atar);
// saldırı çömel → sıçra → ısır → toparlan, ölüm sendele → yığıl → yan yatmış.
import { PB, shade, OUTLINE } from './pixel.js';

// Yerel koordinatlar: x kuyruktan buruna, y yerden yukarı negatif (zemin y = 0). s ölçeği ile tuvale taşınır.
const HIP = { near: [10.6, -10.6], far: [9.6, -10.9] };
const SHOULDER = { near: [22.6, -10.2], far: [21.6, -10.5] };
const STAND = { nh: 10.6, fh: 9.2, nf: 23.2, ff: 21.6 };     // ayakta pençe x konumları
const LEG = { hind: [5.9, 6.7], front: [5.6, 6.5] };          // üst / alt bacak boyu
const LIFT = -1.5;                                            // gövdenin yerden yüksekliği (bacak boyu)

export const WOLF_VARIANTS = {
  // Boz Kurt (Sürü Kurdu aynı çizimi renk tonuyla kullanır)
  wolf: {
    s: 0.92,
    pal: { base: '#837d76', dark: '#55504c', saddle: '#5f5955', light: '#b8b0a5', cream: '#ddd4c4', tailTip: '#3e3a38', eye: '#f0c840', ear: '#8a5e58', nose: '#1a1418' },
  },
  // Alfa Kurt (boss): iri, koyu, diken yeleli, yaralı, kızıl gözlü
  alpha: {
    s: 1.45, mane: '#2c2832', scars: '#9a3030',
    pal: { base: '#4c4852', dark: '#2e2a34', saddle: '#36323c', light: '#6e6a76', cream: '#8a8490', tailTip: '#1e1a24', eye: '#ff3a2a', glow: '#ffa060', ear: '#5a2a30', nose: '#120e14' },
  },
  // Ayaz Kurdu (V2): buz beyazı post, sırtta buz kristalleri
  frost_wolf: {
    s: 1.08, ice: '#7ad8ff',
    pal: { base: '#c2d4e0', dark: '#8aa2b4', saddle: '#a6bccc', light: '#e6f0f6', cream: '#f6fbfd', tailTip: '#8aa2b4', eye: '#1a2a40', glow: '#7ad8ff', ear: '#9ab0c4', nose: '#1a2a40' },
  },
};

// Kare adı → poz
function poses() {
  const P = {};
  for (let k = 0; k < 4; k++) P['idle' + k] = { kind: 'stand', breath: [0, 0.5, 1, 0.5][k], tail: [0, 0.6, 1, 0.6][k], ear: k === 3 ? 1 : 0 };
  for (let k = 0; k < 6; k++) P['walk' + k] = { kind: 'run', p: k / 6 };
  P.atk0 = { kind: 'atk', bx: -1, by: 1.2, hx: -0.5, hy: 1.6, jaw: 0, ear: -1, feet: { nf: 0.5, ff: 0.5, nh: -0.5, fh: -0.5 } };
  P.atk1 = { kind: 'atk', bx: 3, by: -1.6, hx: 1.5, hy: -0.4, jaw: 0.35, ear: -1, feet: { nf: 5, ff: 4, nh: -3, fh: -2.5 }, air: { nf: 2.2, ff: 1.6 } };
  P.atk2 = { kind: 'atk', bx: 3.6, by: -0.4, hx: 2.6, hy: 1, jaw: 1, ear: -1, feet: { nf: 4.6, ff: 3.8, nh: -1.5, fh: -1.2 } };
  P.atk3 = { kind: 'atk', bx: 1.2, by: 0, hx: 0.8, hy: 0.3, jaw: 0.3, ear: 0, feet: { nf: 1.2, ff: 1, nh: 0.4, fh: 0.2 } };
  P.hurt0 = { kind: 'atk', bx: -2, by: 0.4, hx: -1.2, hy: -1.6, jaw: 0.25, ear: -1, squint: true, tail: 3, feet: { nf: 1.6, ff: 1.2, nh: -0.6, fh: -0.4 } };
  P.die0 = { kind: 'atk', bx: -1.2, by: 2.4, hx: 0.4, hy: 3.2, jaw: 0.4, ear: -1, squint: true, tail: 3, feet: { nf: 1.8, ff: 1.4, nh: -1.2, fh: -1 } };
  P.die1 = { kind: 'down', t: 0.55 };
  P.die2 = { kind: 'down', t: 1 };
  P.die3 = { kind: 'down', t: 1, still: true };
  return P;
}

export const WOLF_ANIMS = {
  idle: { frames: ['idle0', 'idle1', 'idle2', 'idle3'], fps: 4 },
  walk: { frames: ['walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5'], fps: 12 },
  atk: { frames: ['atk0', 'atk1', 'atk2', 'atk3'], fps: 11, repeat: 0 },
  hurt: { frames: ['hurt0'], fps: 6, repeat: 0 },
  die: { frames: ['hurt0', 'die0', 'die1', 'die2', 'die3'], fps: 9, repeat: 0 },
};

// İki kemikli bacak: kök → diz → pençe. bend: +1 diz öne, −1 diz arkaya bükülür.
function ik(rx, ry, fx, fy, l1, l2, bend) {
  let dx = fx - rx, dy = fy - ry;
  let d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.05;
  if (d > max) { fx = rx + dx / d * max; fy = ry + dy / d * max; dx = fx - rx; dy = fy - ry; d = max; }
  const a = Math.atan2(dy, dx);
  const c = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const off = Math.acos(c);
  const j1 = [rx + Math.cos(a + off) * l1, ry + Math.sin(a + off) * l1];
  const j2 = [rx + Math.cos(a - off) * l1, ry + Math.sin(a - off) * l1];
  const j = (j1[0] - j2[0]) * bend >= 0 ? j1 : j2;
  return { j, f: [fx, fy] };
}

function drawWolf(pb, pose, V) {
  const { s, pal } = V;
  const ox = pb.w / 2 - 17.5 * s, gy = pb.h - 1;
  const T = (x, y) => [ox + x * s, gy + y * s];
  const poly = (pts, c, dx = 0, dy = 0) => pb.poly(pts.map(([x, y]) => T(x + dx, y + dy)), c);
  const thick = (a, b, c, w) => { const [x0, y0] = T(...a), [x1, y1] = T(...b); pb.thick(x0, y0, x1, y1, c, Math.max(1.2, w * s)); };
  const px = (x, y, c) => { const [X, Y] = T(x, y); pb.set(Math.round(X), Math.round(Y), c); };
  const ell = (x, y, rx, ry, c) => { const [X, Y] = T(x, y); pb.ellipse(X, Y, rx * s, ry * s, c); };

  // --- poz parametreleri
  let bx = 0, by = 0, hx = 0, hy = 0, jaw = 0, earT = 0, tail = 0, squint = false, closed = false;
  let feet = null, air = {}, legMode = 'plant', down = 0;
  if (pose.kind === 'stand') {
    by = pose.breath * 0.45; hy = pose.breath * 0.3; tail = pose.tail; earT = pose.ear;
  } else if (pose.kind === 'run') {
    by = -0.75 * Math.cos(4 * Math.PI * pose.p) + 0.2; hy = 0.5 * Math.cos(4 * Math.PI * pose.p) + 0.6; hx = 0.4;
    tail = 1.2 * Math.sin(2 * Math.PI * pose.p); earT = -0.6; legMode = 'run';
  } else if (pose.kind === 'atk') {
    ({ bx, by, hx, hy, jaw } = pose); earT = pose.ear; tail = pose.tail || 0; squint = !!pose.squint;
    feet = pose.feet; air = pose.air || {};
  } else if (pose.kind === 'down') {
    down = pose.t; closed = true; jaw = 0.15;
    bx = -1.2 + 0.4 * down; by = 2.4 + 4.8 * down; hx = 0.4 + 1.4 * down; hy = 3.2 + 3.0 * down; tail = 3 + 1.5 * down;
    legMode = 'down';
  }

  if (pose.kind !== 'down') { by += LIFT; hy += 0; }
  // --- bacak hesapları
  const legs = [];
  const mk = (id, root, standX, l, bend, far) => {
    const rx = root[0] + bx, ry = root[1] + by;
    let fx = standX + bx * 0.25, fy = 0;
    if (legMode === 'run') {
      const ph = { nf: 0, fh: 0, ff: 0.5, nh: 0.5 }[id];
      const u = (pose.p + ph) % 1, stride = id[1] === 'f' ? 3.4 : 3.1, lift = id[1] === 'f' ? 2.8 : 2.3;
      if (u < 0.5) { fx = standX + stride - (u / 0.5) * 2 * stride; fy = 0; }
      else { const v = (u - 0.5) / 0.5; fx = standX - stride + (0.5 - 0.5 * Math.cos(Math.PI * v)) * 2 * stride; fy = -lift * Math.sin(Math.PI * v); }
    } else if (legMode === 'down') {
      // yığılırken bacaklar öne doğru uzanır, sonunda yere yatar
      const t = down, reach = id[1] === 'f' ? 6 : 5;
      const sx = standX + (id[1] === 'f' ? 1.8 : -1.2);
      fx = sx * (1 - t) + (rx + reach) * t;
      fy = Math.min(0, (ry + 1.4 - (far ? 0.8 : 0)) * t);
    } else if (feet) {
      fx = standX + bx * 0.3 + (feet[id] || 0);
      fy = -(air[id] || 0);
    }
    const r = ik(rx, ry, fx, Math.min(0, fy), l[0], l[1], bend);
    legs.push({ id, far, root: [rx, ry], ...r, front: id[1] === 'f' });
  };
  mk('fh', HIP.far, STAND.fh, LEG.hind, -1, true);
  mk('ff', SHOULDER.far, STAND.ff, LEG.front, 1, true);
  mk('nh', HIP.near, STAND.nh, LEG.hind, -1, false);
  mk('nf', SHOULDER.near, STAND.nf, LEG.front, 1, false);

  const drawLeg = (L) => {
    const col = L.far ? shade(pal.base, -0.32) : shade(pal.base, -0.06);
    const low = L.far ? shade(pal.dark, -0.15) : pal.dark;
    if (!L.front) ell(L.root[0] + (L.far ? 0 : 0.2), L.root[1] + 0.8, 2.3, 3.0, col);   // uyluk kası
    thick(L.root, L.j, col, L.front ? 2.0 : 2.4);
    thick(L.j, L.f, L.far ? low : shade(pal.base, -0.18), 1.35);
    // pençe
    const [fx, fy] = L.f;
    thick([fx - 0.3, fy - 0.2], [fx + 1.3, fy - 0.2], low, 1.4);
    if (!L.far) px(fx + 1.3, fy - 0.2, shade(low, -0.3));
  };

  // --- arka planda kalan bacaklar
  legs.filter((L) => L.far).forEach(drawLeg);

  // --- kuyruk (gür, aşağı doğru kıvrık)
  const tw = Math.min(4, tail);
  const tailPts = [];
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    tailPts.push([7.4 - 5.8 * t + bx * (1 - t * 0.4) - tw * 0.3 * t, -13.0 + by + 6.4 * t * (down ? 0.5 : 1) + tw * t * t * 0.8 - 0.9 * Math.sin(t * Math.PI), 2.1 - 0.55 * t]);
  }
  for (const [x, y, r] of tailPts) ell(x, y, r, r * 0.95, pal.base);
  for (const [x, y, r] of tailPts) ell(x - 0.2, y + 0.55, r * 0.7, r * 0.45, shade(pal.base, -0.14));
  const tip = tailPts[tailPts.length - 1];
  ell(tip[0] - 0.2, tip[1] + 0.3, 1.35, 1.25, pal.tailTip);

  // --- gövde (göğüs derin, bel ince)
  const torso = [[6.8, -12.4], [9.4, -14.4], [15, -14.5], [20, -15.6], [23.4, -15.2], [25.6, -12.6], [24.8, -9.6], [21.2, -8.7], [16.2, -9.7], [12.2, -10.3], [8.2, -9.7], [6.4, -10.9]];
  poly(torso, pal.base, bx, by);
  // sırt eyeri ve açık karın/göğüs
  poly([[9.6, -14.2], [15, -14.3], [20, -15.4], [22.2, -14.8], [18, -13.6], [12.5, -13.2], [9.4, -13.1]], pal.saddle, bx, by);
  poly([[15.5, -10.1], [20.8, -9.4], [24.6, -10.1], [24.9, -9.7], [21.2, -8.8], [16.2, -9.6]], pal.light, bx, by);
  poly([[23.2, -14.6], [25.5, -12.6], [24.8, -9.7], [22.6, -9.5], [22.8, -12.4]], pal.cream, bx, by);
  // sırttaki parlak çizgi ve post dokusu
  for (let x = 10; x <= 21; x += 1) px(x + bx, (x < 15 ? -14.2 : -14.2 - (x - 15) * 0.22) + by, shade(pal.saddle, 0.22));
  for (const [x, y] of [[12, -12.2], [14.5, -11.6], [17.2, -12.4], [19.4, -11.4], [11, -11.2], [16, -10.8]]) px(x + bx, y + by, shade(pal.base, -0.16));
  if (V.scars) {   // iki paralel pençe izi
    for (const o of [0, 1.6]) { const [x0, y0] = T(15.6 + o + bx, -13 + by), [x1, y1] = T(18 + o + bx, -10.8 + by); pb.line(x0, y0, x1, y1, V.scars); }
  }

  // --- boyun ve baş
  const H = [28.6 + bx + hx, -16.6 + by + hy];   // kafatası merkezi
  poly([[20.6, -15.6], [H[0] - 3.6 - bx, H[1] - 1.2 - by], [H[0] - 0.2 - bx, H[1] + 1.4 - by], [26.4, -11.2], [23, -10.4]], pal.base, bx, by);
  poly([[23.6, -14.2], [H[0] - 1.6 - bx, H[1] + 0.8 - by], [H[0] - 0.6 - bx, H[1] + 2.4 - by], [25.8, -11], [24.2, -11.2]], pal.cream, bx, by);
  if (V.mane) {
    for (let i = 0; i < 6; i++) {
      const x = 17.5 + i * 1.6 + bx, y = -15 - i * 0.35 + by;
      poly([[x - 1.1, y + 0.8], [x - 0.2 + (i % 2) * 0.4, y - 2.6 - (i % 2)], [x + 1.1, y + 0.8]], V.mane);
    }
  }
  if (V.ice) {
    for (let i = 0; i < 5; i++) {
      const x = 11 + i * 2.6 + bx, y = -14.5 - (i > 2 ? (i - 2) * 0.5 : 0) + by;
      poly([[x - 0.9, y + 0.6], [x, y - 2.4 - (i % 2) * 1.2], [x + 0.9, y + 0.6]], V.ice);
      px(x, y - 1, '#ffffff');
    }
  }
  // kulaklar (koşarken / saldırırken geriye yatık)
  const eb = earT < 0 ? -0.9 : 0, eu = earT > 0 ? -0.6 : 0;
  poly([[H[0] - 3.6, H[1] - 1.8], [H[0] - 3.1 + eb * 1.6, H[1] - 5.8 - eu], [H[0] - 1.9, H[1] - 2.1]], shade(pal.base, -0.26));
  poly([[H[0] - 2.4, H[1] - 2.2], [H[0] - 1.6 + eb * 1.8, H[1] - 6.8 + eu], [H[0] - 0.1, H[1] - 2.5]], shade(pal.base, -0.06));
  px(H[0] - 1.4 + eb, H[1] - 3.6, pal.ear); px(H[0] - 1.5 + eb * 1.2, H[1] - 4.5, pal.ear);
  // kafatası
  ell(H[0], H[1], 3.5, 2.9, pal.base);
  ell(H[0] - 0.3, H[1] - 1.2, 2.6, 1.3, shade(pal.base, 0.12));
  // namlu: üst çene (açılınca hafif yukarı), alt çene aşağı döner
  const ja = jaw * 0.55, ua = -jaw * 0.12;
  const rot = (x, y, cx, cy, a) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
  const pivot = [H[0] + 0.6, H[1] + 1.2];
  const upper = [[H[0] + 0.6, H[1] - 1.6], [H[0] + 6.2, H[1] + 0.2], [H[0] + 6.4, H[1] + 1.4], [H[0] + 0.8, H[1] + 1.7]].map(([x, y]) => rot(x, y, ...pivot, ua));
  const lower = [[H[0] + 0.8, H[1] + 1.5], [H[0] + 5.4, H[1] + 1.6], [H[0] + 5.1, H[1] + 2.5], [H[0] + 0.4, H[1] + 2.9]].map(([x, y]) => rot(x, y, ...pivot, ja));
  if (jaw > 0.2) poly([pivot, upper[2], lower[1], lower[2]], '#5a1a1e');
  poly(lower, shade(pal.light, -0.05));
  poly(upper, pal.light);
  if (jaw > 0.2) {
    for (let i = 1; i <= 3; i++) { const t = i / 4; px(upper[3][0] + (upper[2][0] - upper[3][0]) * t, upper[3][1] + (upper[2][1] - upper[3][1]) * t + 0.4, '#f6f2e6'); }
    px(lower[1][0] - 0.6, lower[1][1] - 0.5, '#f6f2e6');
    px(lower[0][0] + 1.4, lower[0][1] - 0.4, '#f6f2e6');
  } else {
    thick([upper[3][0] + 0.6, upper[3][1] + 0.1], [upper[2][0] - 0.6, upper[2][1] + 0.1], shade(pal.dark, -0.1), 0.6);
  }
  px(upper[1][0] - 0.1, upper[1][1] + 0.1, pal.nose);
  px(upper[1][0] - 0.1, upper[1][1] + 0.9, pal.nose);
  // yanak tüyü
  px(H[0] - 1.6, H[1] + 1.8, pal.cream); px(H[0] - 2.4, H[1] + 1.4, pal.cream);
  // göz
  const ex = H[0] + 1.2, ey = H[1] - 0.9;
  if (closed) { px(ex - 0.6, ey + 0.3, pal.dark); px(ex + 0.4, ey + 0.3, pal.dark); }
  else if (squint) { px(ex, ey, '#f6f2e6'); px(ex - 0.8, ey - 0.4, pal.dark); }
  else { px(ex, ey, pal.eye); px(ex + 0.9, ey, pal.glow || pal.dark); px(ex - 0.9, ey - 0.8, pal.dark); }
  if (V.ice && jaw > 0.6) { ell(upper[1][0] + 2.2, upper[1][1] + 1, 1.3, 1.1, '#e0faff'); px(upper[1][0] + 3.2, upper[1][1] + 0.4, '#ffffff'); }

  // --- ön planda kalan bacaklar
  legs.filter((L) => !L.far).forEach(drawLeg);
}

export function wolfSheet(id) {
  const V = WOLF_VARIANTS[id];
  const w = Math.ceil(48 * V.s) + 2, h = Math.ceil(28 * V.s) + 2;
  const P = poses();
  const names = Object.keys(P);
  const frames = names.map((n) => { const pb = new PB(w, h); drawWolf(pb, P[n], V); return pb.outline(OUTLINE); });
  return { w, h, names, frames, anims: WOLF_ANIMS };
}
