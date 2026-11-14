// Veri odaklı event illüstrasyonu: art = { sky, sea, obj[], fx[] } katmanları birleştirilir.
// Belirli bir event için özel çizim gerekirse CUSTOM_ART[id] ile değiştirilebilir.
import { rect, px, hline, vline, line, disc, ellipse, hash2 } from './pixel.js';
import { drawShipSilhouette } from './ShipArt.js';
import { petFrame } from './Characters.js';

export const CUSTOM_ART = {}; // { EVT_ID: (ctx, W, H, t) => void }

const OBJ = {};

OBJ.pirateShip = (c, W, H, hz, t) => {
  const bob = Math.sin(t * 1.3) * 1;
  drawShipSilhouette(c, W * 0.42, hz + 16 + bob, 1.7, { hull: '#1c181e', sail: '#2b2a32', mast: '#120e10', flagColor: '#050505', skull: true, masts: 2, ports: 4, trim: '#5a3a2a' });
  if (Math.sin(t * 0.9) > 0.85) disc(c, W * 0.5, hz + 10, 3, 'rgba(230,230,230,0.7)');
};
OBJ.pirateFleet = (c, W, H, hz, t) => {
  drawShipSilhouette(c, W * 0.18, hz + 5, 0.8, { hull: '#1c181e', sail: '#2b2a32', flagColor: '#000', masts: 2 });
  drawShipSilhouette(c, W * 0.72, hz + 7, 1.0, { hull: '#1c181e', sail: '#33303a', flagColor: '#000', masts: 2, flip: true });
  drawShipSilhouette(c, W * 0.45, hz + 18 + Math.sin(t) * 1, 1.6, { hull: '#18141a', sail: '#26252c', flagColor: '#000', skull: true, masts: 3, ports: 5 });
};
OBJ.merchantShip = (c, W, H, hz, t) => {
  drawShipSilhouette(c, W * 0.48, hz + 14 + Math.sin(t * 1.2), 1.5, { hull: '#6a4424', trim: '#e8c45a', sail: (y) => (Math.floor(y / 3) % 2 ? '#c8423b' : '#f4ead5'), flagColor: '#f2c14e', masts: 2, ports: 2 });
};
OBJ.warship = (c, W, H, hz, t) => {
  drawShipSilhouette(c, W * 0.6, hz + 12 + Math.sin(t) * 0.8, 1.5, { hull: '#2a3448', trim: '#e0b84a', sail: '#eef0f4', flagColor: '#3b6ea5', masts: 3, ports: 6, flip: true });
};
OBJ.ghostShip = (c, W, H, hz, t) => {
  c.globalAlpha = 0.55 + Math.sin(t * 2) * 0.15;
  drawShipSilhouette(c, W * 0.5, hz + 12 + Math.sin(t * 0.8) * 2, 1.7, { hull: '#3a7a62', sail: '#9affd0', mast: '#2a5a4a', masts: 3, torn: true, broken: true });
  c.globalAlpha = 1;
  for (let i = 0; i < 6; i++) px(c, W * 0.5 + Math.sin(t + i) * 20, hz - 10 - i * 4 + Math.cos(t * 2 + i) * 2, '#c8ffe8');
};
OBJ.wreck = (c, W, H, hz, t) => {
  const x = W * 0.55, y = hz + 22;
  line(c, x, y, x + 8, y - 26, '#3a2414');
  line(c, x + 1, y, x + 9, y - 26, '#5a3a20');
  hline(c, x + 2, x + 16, y - 20, '#3a2414');
  rect(c, x + 6, y - 19, 7, 6, 'rgba(220,210,190,0.7)');
  for (let i = 0; i < 6; i++) {
    const px0 = W * 0.3 + hash2(i, 5) * W * 0.5;
    const py = hz + 10 + hash2(i, 6) * 40 + Math.sin(t + i) * 1;
    rect(c, px0, py, 6 + (i % 3) * 3, 2, i % 2 ? '#6a4424' : '#4a2e18');
  }
};
OBJ.halfSunk = (c, W, H, hz, t) => {
  const x = W * 0.5, y = hz + 22;
  for (let r = 0; r < 26; r++) {
    const len = 50 - r * 0.8;
    hline(c, x - len / 2 + r * 0.7, x + len / 2 + r * 0.7, y - 20 + r - Math.round((r / 26) * 6), r % 3 ? '#5a3a20' : '#3e2612');
  }
  line(c, x - 6, y - 20, x - 22, y - 50, '#3a2414');
  rect(c, x - 26, y - 46, 10, 8, 'rgba(230,220,200,0.8)');
  rect(c, x - 40, y, 90, 12, 'rgba(36,80,110,0.85)');
  if (Math.sin(t * 3) > 0) { px(c, x + 2, y - 12, '#f4ead5'); px(c, x + 3, y - 13, '#c8423b'); }
};
OBJ.rocks = (c, W, H, hz, t) => {
  const spots = [[0.2, 30, 16], [0.38, 18, 26], [0.62, 26, 20], [0.82, 14, 30]];
  for (const [fx, h, yy] of spots) {
    const x = W * fx;
    const y = hz + yy;
    for (let r = 0; r < h; r++) {
      const w = Math.round((r / h) * 10 + 2 + hash2(r, fx * 100) * 3);
      hline(c, x - w, x + w * 0.8, y - h + r, r < 3 ? '#8a8a92' : r % 4 ? '#4a4a52' : '#3a3a42');
    }
    hline(c, x - 14, x + 12, y + Math.sin(t * 2 + fx * 9) * 1, '#e8f4fa');
  }
};
OBJ.island = (c, W, H, hz, t) => {
  const x = W * 0.55, y = hz + 4;
  ellipse(c, x, y, 60, 14, '#3f6f3a');
  ellipse(c, x - 8, y - 4, 40, 12, '#4f8a44');
  hline(c, x - 62, x + 62, y + 2, '#e6d6a0');
  hline(c, x - 64, x + 64, y + 4, '#f4ead5');
  for (const px0 of [x - 30, x + 6, x + 30]) {
    line(c, px0, y - 8, px0 + 3, y - 26, '#6a4424');
    for (let k = 0; k < 4; k++) line(c, px0 + 3, y - 26, px0 + 3 + Math.cos(k * 1.6 + t * 0.6) * 10, y - 26 + Math.sin(k * 1.6) * 5 + 3, '#2f6a32');
  }
};
OBJ.villagers = (c, W, H, hz, t) => {
  const x = W * 0.55, y = hz + 1;
  for (let i = 0; i < 5; i++) {
    const vx = x - 30 + i * 12;
    rect(c, vx, y - 6, 3, 5, i % 2 ? '#c8423b' : '#e8c45a');
    rect(c, vx, y - 9, 3, 3, '#8a5a37');
    if (i % 2 === 0 && Math.sin(t * 3 + i) > 0) px(c, vx + 3, y - 9, '#8a5a37');
  }
  rect(c, x + 30, y + 10, 16, 3, '#6a4424');
  rect(c, x + 34, y + 7, 3, 3, '#8a5a37');
};
OBJ.ruins = (c, W, H, hz, t) => {
  const x = W * 0.5, y = hz - 4;
  for (let i = 0; i < 4; i++) {
    const cx = x - 24 + i * 16;
    const h = 14 + (i % 2) * 8 - (i === 3 ? 8 : 0);
    rect(c, cx, y - h, 4, h, '#cfc6b0');
    vline(c, cx + 3, y - h, y, '#9a927e');
    rect(c, cx - 1, y - h - 2, 6, 2, '#e0d8c4');
  }
  hline(c, x - 26, x + 30, y - 22, '#cfc6b0');
};
OBJ.sunkenCity = (c, W, H, hz, t) => {
  for (let i = 0; i < 7; i++) {
    const x = W * 0.15 + i * W * 0.11;
    const base = H - 8;
    const h = 20 + (i % 3) * 12;
    c.fillStyle = 'rgba(180,220,230,0.45)';
    c.fillRect(Math.round(x), base - h, 6, h);
    if (i % 3 === 1) ellipse(c, x + 3, base - h, 9, 6, 'rgba(180,220,230,0.45)');
  }
  for (let i = 0; i < 5; i++) {
    const x = W * 0.2 + i * W * 0.15 + Math.sin(t * 0.5 + i) * 4;
    line(c, x, hz + 2, x - 10, H, 'rgba(255,255,220,0.12)');
  }
};
OBJ.lighthouse = (c, W, H, hz, t) => {
  const x = W * 0.6, y = hz;
  ellipse(c, x, y + 2, 30, 6, '#4a4a52');
  for (let r = 0; r < 34; r++) {
    const w = 5 - Math.floor(r / 12);
    hline(c, x - w, x + w, y - r, Math.floor(r / 5) % 2 ? '#e8e4dc' : '#c8423b');
  }
  rect(c, x - 4, y - 40, 9, 6, '#f2e090');
  rect(c, x - 5, y - 41, 11, 1, '#2a2a2a');
  const a = (Math.sin(t * 0.8) + 1) / 2;
  c.fillStyle = 'rgba(255,240,160,0.18)';
  c.beginPath();
  c.moveTo(x, y - 37);
  c.lineTo(x - 120 + a * 240, y - 60);
  c.lineTo(x - 110 + a * 240, y - 20);
  c.fill();
};
OBJ.bell = (c, W, H, hz, t) => {
  const x = W * 0.5, y = hz + 20 + Math.sin(t * 1.5) * 2;
  rect(c, x - 8, y, 17, 4, '#8a3a2a');
  vline(c, x, y - 18, y, '#3a3a42');
  const sw = Math.sin(t * 3) * 2;
  for (let r = 0; r < 9; r++) hline(c, x - 2 - r / 2 + sw, x + 2 + r / 2 + sw, y - 16 + r, r % 3 ? '#c8a040' : '#a07a20');
  if (Math.sin(t * 3) > 0.9) for (let i = 0; i < 3; i++) px(c, x + 10 + i * 3, y - 12 - i, '#f4ead5');
};
OBJ.bottle = (c, W, H, hz, t) => {
  const x = W * 0.45, y = H * 0.78 + Math.sin(t * 1.6) * 2;
  for (let r = 0; r < 6; r++) hline(c, x - 8 + r, x + 6, y - r, '#3a8a5a');
  rect(c, x + 6, y - 4, 5, 2, '#3a8a5a');
  rect(c, x + 11, y - 4, 2, 2, '#c8a060');
  rect(c, x - 4, y - 4, 5, 2, '#f4ead5');
  hline(c, x - 12, x + 14, y + 1, '#e8f6fb');
};
OBJ.chest = (c, W, H, hz, t) => {
  const x = W * 0.48, y = H * 0.74 + Math.sin(t * 1.4) * 2;
  rect(c, x - 10, y - 10, 20, 10, '#7a4a24');
  rect(c, x - 10, y - 13, 20, 4, '#5a3418');
  hline(c, x - 10, x + 9, y - 9, '#e0b040');
  rect(c, x - 1, y - 8, 3, 3, '#e0b040');
  hline(c, x - 14, x + 14, y, '#e8f6fb');
  for (let i = 0; i < 4; i++) px(c, x - 6 + i * 4, y - 14 - (i % 2), '#5a8a3a');
};
OBJ.barrels = (c, W, H, hz, t) => {
  for (let i = 0; i < 4; i++) {
    const x = W * (0.3 + i * 0.12);
    const y = H * (0.68 + (i % 2) * 0.06) + Math.sin(t * 1.5 + i) * 1.5;
    ellipse(c, x, y, 5, 4, '#8a5a2b');
    hline(c, x - 5, x + 5, y - 2, '#3a2414');
    hline(c, x - 5, x + 5, y + 2, '#3a2414');
  }
};
OBJ.timber = (c, W, H, hz, t) => {
  for (let i = 0; i < 6; i++) {
    const x = W * (0.25 + hash2(i, 2) * 0.5);
    const y = H * (0.62 + hash2(i, 3) * 0.25) + Math.sin(t * 1.2 + i) * 1.5;
    rect(c, x, y, 18 + (i % 3) * 4, 3, '#a87a4a');
    hline(c, x, x + 18, y + 2, '#6a4424');
  }
};
OBJ.tentacles = (c, W, H, hz, t) => {
  const base = hz + 30;
  const spots = [0.22, 0.38, 0.6, 0.78];
  spots.forEach((fx, i) => {
    let x = W * fx;
    let y = base;
    const len = 46 + (i % 2) * 18;
    for (let s = 0; s < len; s++) {
      const w = Math.max(1, Math.round(6 - (s / len) * 5));
      const ang = Math.sin(t * 1.5 + i + s * 0.08) * 0.9;
      x += Math.sin(ang) * 0.9;
      y -= 1;
      hline(c, x - w, x + w, y, s % 6 < 3 ? '#8a2a4a' : '#7a1f3e');
      if (s % 5 === 0 && w > 2) px(c, x + w - 1, y, '#e8a0b0');
    }
  });
};
OBJ.seaSerpent = (c, W, H, hz, t) => {
  const x0 = W * 0.38, y0 = hz + 24;
  for (let s = 0; s < 80; s++) {
    const f = s / 80;
    const x = x0 + f * 70;
    const y = y0 - Math.sin(f * Math.PI) * 55 + Math.sin(t * 2 + f * 6) * 2;
    const w = Math.round(7 - f * 3);
    rect(c, x, y - w / 2, 2, w, s % 4 < 2 ? '#2f7a5a' : '#256a4a');
    if (s % 6 === 0) px(c, x, y - w / 2, '#8ae0a0');
  }
  const hx = x0 + 74, hy = y0 - 6 + Math.sin(t * 2 + 6) * 2;
  ellipse(c, hx, hy, 8, 5, '#2f7a5a');
  rect(c, hx + 4, hy - 1, 6, 3, '#2f7a5a');
  px(c, hx + 2, hy - 2, '#f2e040');
  px(c, hx + 9, hy + 1, '#c8423b');
  hline(c, x0 - 8, x0 + 10, y0 + 2, '#e8f6fb');
};
OBJ.wave = (c, W, H, hz, t) => {
  const x0 = W * 0.4;
  for (let x = x0; x < W; x++) {
    const f = (x - x0) / (W - x0);
    const h = Math.round(Math.sin(f * Math.PI * 0.9) * 70 + 10);
    rect(c, x, hz + 20 - h, 1, h, f < 0.15 ? '#5aa0c8' : '#2a6088');
    if (f > 0.05 && f < 0.5) px(c, x, hz + 20 - h, '#e8f6fb');
  }
  for (let i = 0; i < 12; i++) px(c, x0 + 20 + Math.sin(t * 3 + i) * 10 + i * 4, hz - 50 + Math.cos(t * 2 + i) * 6, '#ffffff');
};
OBJ.tsunami = (c, W, H, hz, t) => {
  for (let x = 0; x < W; x++) {
    const h = Math.round(80 + Math.sin(x * 0.03 + t * 0.5) * 8 + Math.sin(x * 0.11) * 3);
    rect(c, x, hz - h + 20, 1, h, '#0e1a26');
    if (Math.sin(x * 0.2 + t * 2) > 0.6) px(c, x, hz - h + 20, '#c8d8e4');
  }
};
OBJ.iceberg = (c, W, H, hz, t) => {
  const bergs = [[0.3, 40, 30], [0.62, 60, 46], [0.85, 24, 18]];
  for (const [fx, w, h] of bergs) {
    const x = W * fx;
    for (let r = 0; r < h; r++) {
      const ww = Math.round((r / h) * w * 0.5 + 3 + Math.sin(r * 0.7 + fx) * 2);
      hline(c, x - ww, x + ww * 0.7, hz - h + r + 4, r % 7 === 0 ? '#bfe3ef' : '#f4fbff');
      px(c, x + ww * 0.7, hz - h + r + 4, '#8ac0d8');
    }
  }
};
OBJ.volcano = (c, W, H, hz, t) => {
  const x = W * 0.55, y = hz + 2;
  for (let r = 0; r < 50; r++) {
    const w = Math.round(6 + r * 1.2);
    hline(c, x - w, x + w, y - 50 + r, r % 5 ? '#2a1e1e' : '#3a2828');
  }
  for (let i = 0; i < 4; i++) line(c, x - 3 + i * 2, y - 50, x - 10 + i * 6, y - 30 + i * 6, '#ff6a2a');
  for (let i = 0; i < 10; i++) {
    const a = t * 0.6 + i;
    disc(c, x + Math.sin(a) * 8 + i * 2, y - 56 - ((t * 12 + i * 9) % 50), 4 + (i % 3), 'rgba(70,60,60,0.7)');
  }
  for (let i = 0; i < 6; i++) px(c, x + Math.sin(t * 4 + i) * 12, y - 52 - ((t * 30 + i * 13) % 30), '#ffb040');
};
OBJ.turtle = (c, W, H, hz, t) => {
  const x = W * 0.48 + Math.sin(t * 0.4) * 6, y = H * 0.72;
  ellipse(c, x, y, 18, 7, '#3f7a4a');
  for (let i = -2; i <= 2; i++) ellipse(c, x + i * 6, y - 1, 2, 2, '#5a9a5a');
  ellipse(c, x + 20, y - 1, 5, 3, '#6aa060');
  px(c, x + 22, y - 2, '#000');
  line(c, x - 10, y + 5, x - 16, y + 9 + Math.sin(t * 2) * 2, '#5a8a50');
  line(c, x + 10, y + 5, x + 16, y + 9 - Math.sin(t * 2) * 2, '#5a8a50');
};
OBJ.fishSchool = (c, W, H, hz, t) => {
  for (let i = 0; i < 70; i++) {
    const x = (W * 0.2 + hash2(i, 1) * W * 0.6 + Math.sin(t * 1.5 + i) * 6 + t * 6) % W;
    const y = hz + 12 + hash2(i, 2) * (H - hz - 20) + Math.cos(t * 2 + i) * 2;
    hline(c, x, x + 2, y, Math.sin(t * 4 + i) > 0 ? '#e8f4fa' : '#a8c8d8');
  }
};
OBJ.flyingFish = (c, W, H, hz, t) => {
  for (let i = 0; i < 9; i++) {
    const f = ((t * 0.5 + i * 0.11) % 1);
    const x = W * 0.1 + f * W * 0.8;
    const y = hz + 10 - Math.sin(f * Math.PI) * (30 + (i % 3) * 10) + i * 3;
    hline(c, x, x + 3, y, '#c8e0ec');
    px(c, x + 1, y - 1, '#e8f6fb');
  }
};
OBJ.rainbow = (c, W, H, hz) => {
  const cols = ['#c8423b', '#e07b39', '#f2c14e', '#5a9e4b', '#3b6ea5', '#8b5bb5'];
  const cx = W * 0.5, cy = hz + 10;
  cols.forEach((col, i) => {
    const r = W * 0.42 - i * 3;
    for (let a = 0; a <= 180; a += 0.6) {
      const rad = (a * Math.PI) / 180;
      px(c, cx + Math.cos(rad) * r, cy - Math.sin(rad) * r * 0.6, col);
    }
  });
};
OBJ.lightOrb = (c, W, H, hz, t) => {
  const x = W * 0.5, y = hz + 30 + Math.sin(t) * 3;
  const r = 8 + Math.sin(t * 2) * 2;
  disc(c, x, y, r + 6, 'rgba(140,255,200,0.12)');
  disc(c, x, y, r + 2, 'rgba(180,255,220,0.3)');
  disc(c, x, y, r - 3, '#e8fff4');
};
OBJ.shrine = (c, W, H, hz, t) => {
  const x = W * 0.5, y = hz + 4;
  ellipse(c, x, y, 34, 8, '#5a5a62');
  rect(c, x - 10, y - 14, 20, 12, '#8a8a92');
  rect(c, x - 14, y - 16, 28, 3, '#a8a8b0');
  for (let i = 0; i < 6; i++) px(c, x - 12 + i * 5, y - 2, '#f4c8a0');
  OBJ.idol(c, W, H, hz, t, x, y - 16);
};
OBJ.idol = (c, W, H, hz, t, ix, iy) => {
  const x = ix ?? W * 0.5, y = iy ?? hz;
  rect(c, x - 3, y - 10, 6, 10, '#f2c14e');
  rect(c, x - 4, y - 13, 8, 4, '#f2c14e');
  px(c, x - 2, y - 12, '#7a4a10'); px(c, x + 1, y - 12, '#7a4a10');
  if (Math.sin(t * 3) > 0.5) px(c, x + 4, y - 14, '#fff6c0');
};
OBJ.boat = (c, W, H, hz, t) => {
  const x = W * 0.42, y = hz + 26 + Math.sin(t * 1.6) * 1.5;
  for (let r = 0; r < 4; r++) hline(c, x - 12 + r, x + 12 - r, y + r, r === 0 ? '#a87a4a' : '#6a4424');
  rect(c, x - 2, y - 7, 4, 7, '#3a4a5a');
  rect(c, x - 2, y - 10, 4, 3, '#d9b48f');
  line(c, x + 2, y - 4, x + 12, y + 4, '#6a4424');
};
OBJ.raft = (c, W, H, hz, t) => {
  const x = W * 0.46, y = hz + 24 + Math.sin(t * 1.4) * 1.5;
  for (let i = 0; i < 6; i++) rect(c, x - 12 + i * 4, y, 3, 3, i % 2 ? '#8a5a2b' : '#6a4424');
  vline(c, x + 6, y - 12, y, '#5a3a20');
  const fl = Math.sin(t * 8) > 0;
  rect(c, x + 5, y - 15, 3, 3, fl ? '#ffb040' : '#ff7020');
  rect(c, x - 6, y - 6, 3, 6, '#4a5a6a');
  rect(c, x - 6, y - 9, 3, 3, '#c89060');
};
OBJ.plagueShip = (c, W, H, hz, t) => {
  drawShipSilhouette(c, W * 0.5, hz + 14 + Math.sin(t) * 1, 1.6, { hull: '#3a3428', sail: '#7a7258', flagColor: '#e8d040', masts: 2, torn: true });
  for (let i = 0; i < 5; i++) disc(c, W * 0.42 + i * 8, hz - 4 - ((t * 6 + i * 7) % 20), 3, 'rgba(160,170,90,0.25)');
};
OBJ.shipyard = (c, W, H, hz) => {
  const x = W * 0.52, y = hz;
  ellipse(c, x, y + 2, 56, 10, '#6a5a42');
  for (let i = 0; i < 9; i++) {
    const rx = x - 26 + i * 6;
    const h = 10 + Math.sin((i / 8) * Math.PI) * 6;
    line(c, rx, y - 2, rx - 2, y - 2 - h, '#a87a4a');
    line(c, rx, y - 2, rx + 2, y - 2 - h, '#a87a4a');
  }
  hline(c, x - 28, x + 26, y - 2, '#6a4424');
  vline(c, x + 34, y - 30, y, '#5a3a20');
  hline(c, x + 26, x + 40, y - 28, '#5a3a20');
};
OBJ.fire = (c, W, H, hz, t) => {
  for (let i = 0; i < 26; i++) {
    const x = W * 0.38 + hash2(i, 4) * W * 0.3;
    const h = 10 + hash2(i, 5) * 30 + Math.sin(t * 9 + i) * 5;
    const base = H * 0.78;
    for (let y = 0; y < h; y += 2) {
      const f = y / h;
      px(c, x + Math.sin(t * 6 + i + y * 0.2) * 2, base - y, f < 0.3 ? '#fff0a0' : f < 0.6 ? '#ffb040' : '#e0502a');
      px(c, x + 1 + Math.sin(t * 6 + i + y * 0.2) * 2, base - y, f < 0.5 ? '#ffb040' : '#c8382a');
    }
  }
};
OBJ.deckView = (c, W, H, hz, t) => {
  const deckY = H * 0.78;
  rect(c, 0, deckY, W, H - deckY, '#8a5a2b');
  for (let y = deckY; y < H; y += 4) hline(c, 0, W, y, '#5c3a1e');
  for (let i = 0; i < 12; i++) vline(c, (i * 37 + 10) % W, deckY, H, '#6a4424');
  rect(c, 0, deckY - 10, W, 3, '#5c3a1e');
  for (let x = 4; x < W; x += 14) rect(c, x, deckY - 8, 2, 8, '#5c3a1e');
  rect(c, W * 0.12, 0, 5, deckY, '#5a3a20');
  vline(c, W * 0.12 + 1, 0, deckY, '#7a5030');
  for (let i = 0; i < 3; i++) {
    const bx = W * 0.8 + i * 12;
    ellipse(c, bx, deckY - 6, 5, 6, '#8a5a2b');
    hline(c, bx - 5, bx + 5, deckY - 9, '#3a2414');
    hline(c, bx - 5, bx + 5, deckY - 3, '#3a2414');
  }
  line(c, W * 0.12, 6, W * 0.5, deckY - 10, 'rgba(60,40,20,0.7)');
};
OBJ.whirlpool = (c, W, H, hz, t) => {
  const cx = W * 0.5, cy = hz + 34;
  for (let a = 0; a < 40; a += 0.08) {
    const r = a * 2.2;
    const ang = a + t * 2;
    px(c, cx + Math.cos(ang) * r * 1.6, cy + Math.sin(ang) * r * 0.45, a % 1 < 0.5 ? '#e8f6fb' : '#6aa8c8');
  }
  disc(c, cx, cy, 3, '#05101a');
};
OBJ.moon = (c, W, H, hz) => {
  disc(c, W * 0.78, hz * 0.3, 16, 'rgba(230,236,255,0.15)');
  disc(c, W * 0.78, hz * 0.3, 11, '#eef2fa');
  disc(c, W * 0.75, hz * 0.27, 2, '#cfd6e6');
  disc(c, W * 0.81, hz * 0.34, 3, '#cfd6e6');
  for (let y = hz + 2; y < hz + 50; y += 3) hline(c, W * 0.78 - 6 + Math.sin(y) * 3, W * 0.78 + 6 + Math.sin(y) * 3, y, 'rgba(230,236,255,0.35)');
};
OBJ.birds = (c, W, H, hz, t) => {
  for (let i = 0; i < 7; i++) {
    const x = (W * hash2(i, 9) + t * (10 + i * 2)) % W;
    const y = hz * (0.2 + hash2(i, 8) * 0.5) + Math.sin(t * 2 + i) * 3;
    const f = Math.sin(t * 8 + i) > 0 ? 1 : 0;
    px(c, x - 2, y - f, '#f4ead5'); px(c, x - 1, y, '#f4ead5'); px(c, x, y, '#2a2a2a'); px(c, x + 1, y, '#f4ead5'); px(c, x + 2, y - f, '#f4ead5');
  }
};
OBJ.catBoat = (c, W, H, hz, t) => {
  const x = W * 0.5, y = hz + 30 + Math.sin(t * 1.2) * 1.5;
  for (let r = 0; r < 5; r++) hline(c, x - 16 + r, x + 16 - r, y + r, r === 0 ? '#a87a4a' : '#6a4424');
  const cat = petFrame('PET_ZIPIR', 'sit');
  c.drawImage(cat, Math.round(x - 7), Math.round(y - 11));
  for (let i = 0; i < 4; i++) hline(c, x - 20 - i * 6, x - 14 - i * 6, y + 6 + i, 'rgba(230,236,255,0.4)');
};
OBJ.dogRocks = (c, W, H, hz, t) => {
  const x = W * 0.55, y = hz + 18;
  for (let r = 0; r < 16; r++) hline(c, x - 10 - r, x + 12 + r * 0.6, y - 16 + r, r < 2 ? '#7a7a82' : '#4a4a52');
  const dog = petFrame('PET_TARCIN', Math.sin(t * 2) > 0.7 ? 'wag1' : 'sit');
  c.drawImage(dog, Math.round(x - 6), Math.round(y - 27));
};
OBJ.dockPets = (c, W, H, hz, t) => {
  const deck = H * 0.74;
  rect(c, 0, deck, W, 8, '#7a5030');
  for (let x = 0; x < W; x += 9) vline(c, x, deck, deck + 7, '#4a2e18');
  for (let x = 10; x < W; x += 60) rect(c, x, deck + 8, 5, H - deck, '#4a2e18');
  hline(c, 0, W, deck, '#a07040');
  const dog = petFrame('PET_TARCIN', Math.sin(t * 5) > 0 ? 'wag1' : 'wag0');
  const cat = petFrame('PET_ZIPIR', 'sit');
  c.save();
  c.translate(Math.round(W * 0.47), Math.round(deck - 22));
  c.scale(2, 2);
  c.drawImage(dog, 0, 0);
  c.restore();
  c.save();
  c.translate(Math.round(W * 0.47 + 30), Math.round(deck - 22));
  c.scale(-2, 2);
  c.drawImage(cat, -14, 0);
  c.restore();
};
OBJ.dock = (c, W, H, hz) => {
  const x = W * 0.6, y = hz + 4;
  for (let i = 0; i < 5; i++) {
    const bx = x - 30 + i * 16;
    const h = 10 + (i % 3) * 5;
    rect(c, bx, y - h, 13, h, ['#c8a07a', '#b07a5a', '#d8c4a0'][i % 3]);
    for (let r = 0; r < 5; r++) hline(c, bx - 1 + r, bx + 13 - r, y - h - r, '#8a3a2a');
  }
  rect(c, x - 40, y, 100, 3, '#6a4424');
  for (let i = 0; i < 6; i++) vline(c, x - 38 + i * 18, y, y + 8, '#4a2e18');
};
OBJ.monkey = (c, W, H, hz, t) => {
  const img = petFrame('PET_CUCE', Math.sin(t * 3) > 0 ? 'hold' : 'sit');
  c.save();
  c.translate(Math.round(W * 0.12 - 4), Math.round(H * 0.32));
  c.scale(2, 2);
  c.drawImage(img, 0, 0);
  c.restore();
};
OBJ.parrot = (c, W, H, hz, t) => {
  const img = petFrame('PET_KIRMIZI', Math.sin(t * 2) > 0 ? 'perch0' : 'perch1');
  c.save();
  c.translate(Math.round(W * 0.3), Math.round(H * 0.42));
  c.scale(2, 2);
  c.drawImage(img, 0, 0);
  c.restore();
  hline(c, W * 0.26, W * 0.4, H * 0.42 + 24, '#5c3a1e');
};
OBJ.oldSailor = (c, W, H, hz, t) => {
  const x = W * 0.42, y = hz + 26 + Math.sin(t * 1.6) * 1.5;
  rect(c, x - 3, y - 13, 6, 3, '#e8e8e8');
  for (let i = 0; i < 4; i++) disc(c, x + 6 + i * 2, y - 14 - i * 3 - ((t * 4) % 3), 1, 'rgba(220,220,220,0.6)');
};
OBJ.passenger = (c, W, H, hz, t) => {
  const x = W * 0.5, y = H * 0.76;
  for (let r = 0; r < 34; r++) hline(c, x - 4 - r * 0.35, x + 4 + r * 0.35, y - 34 + r, r < 9 ? '#1e1e2a' : '#26263a');
  rect(c, x - 2, y - 29, 5, 4, '#0a0a10');
  if (Math.sin(t * 2) > 0.7) { px(c, x - 1, y - 28, '#e8e0a0'); px(c, x + 2, y - 28, '#e8e0a0'); }
  disc(c, x + 12, y - 18, 2, Math.sin(t * 5) > 0 ? '#ffe080' : '#f0a040');
};
OBJ.mine = (c, W, H, hz, t) => {
  for (let i = 0; i < 5; i++) {
    const x = W * (0.2 + i * 0.15);
    const y = hz + 16 + (i % 2) * 18 + Math.sin(t * 1.4 + i) * 1.5;
    disc(c, x, y, 4, '#3a3a40');
    for (let k = 0; k < 6; k++) px(c, x + Math.cos(k) * 6, y + Math.sin(k) * 6, '#5a5a62');
    hline(c, x - 7, x + 7, y + 4, '#d8e8f0');
  }
};
OBJ.mapScroll = (c, W, H, hz, t) => {
  const x = W * 0.42, y = H * 0.5 + Math.sin(t) * 2;
  rect(c, x, y, 50, 30, '#e8d8a8');
  rect(c, x - 3, y - 2, 4, 34, '#c8a870');
  rect(c, x + 49, y - 2, 4, 34, '#c8a870');
  line(c, x + 6, y + 22, x + 20, y + 10, '#8a6a3a');
  line(c, x + 20, y + 10, x + 34, y + 18, '#8a6a3a');
  px(c, x + 36, y + 17, '#c8423b'); px(c, x + 38, y + 19, '#c8423b'); px(c, x + 38, y + 17, '#c8423b'); px(c, x + 36, y + 19, '#c8423b');
  ellipse(c, x + 12, y + 8, 6, 3, '#a8c8a0');
};
OBJ.crate = (c, W, H, hz, t) => {
  const x = W * 0.42, y = hz + 22 + Math.sin(t * 1.6) * 1.5;
  for (let i = 0; i < 3; i++) { rect(c, x - 10 + i * 7, y - 8 - (i % 2) * 4, 6, 6, '#a87a4a'); hline(c, x - 10 + i * 7, x - 5 + i * 7, y - 6 - (i % 2) * 4, '#6a4424'); }
};
OBJ.smoke = (c, W, H, hz, t) => {
  for (let i = 0; i < 14; i++) disc(c, W * (0.3 + (i % 5) * 0.1) + Math.sin(t + i) * 4, hz - ((t * 8 + i * 9) % 60), 4 + (i % 3) * 2, 'rgba(50,46,48,0.45)');
};
OBJ.dog = (c, W, H, hz, t) => {
  const img = petFrame('PET_TARCIN', Math.sin(t * 6) > 0 ? 'wag0' : 'wag1');
  c.save(); c.translate(Math.round(W * 0.5), Math.round(H * 0.78 - 24)); c.scale(2, 2); c.drawImage(img, 0, 0); c.restore();
};
OBJ.cat = (c, W, H, hz, t) => {
  const img = petFrame('PET_ZIPIR', 'sit');
  c.save(); c.translate(Math.round(W * 0.6), Math.round(H * 0.78 - 24)); c.scale(2, 2); c.drawImage(img, 0, 0); c.restore();
};

const ONBOARD = new Set(['deckView', 'dockPets']);

/** İllüstrasyonu çizer. pan: yavaş kaydırma animasyonu */
export function drawEventArt(ctx, W, H, art, t, sea, eventId = null, reduceMotion = false, dt = 1 / 60) {
  if (eventId && CUSTOM_ART[eventId]) return CUSTOM_ART[eventId](ctx, W, H, t);
  const sky = art.sky || 'day';
  const seaPreset = art.sea || (sky === 'storm' ? 'rough' : sky === 'night' ? 'dark' : 'calm');
  const hz = Math.round(H * 0.5);
  const tt = reduceMotion ? 0 : t;
  sea.drawSky(ctx, W, hz, tt, sky);
  const onboard = (art.obj || []).some((o) => ONBOARD.has(o));
  sea.drawSea(ctx, W, hz, H, tt, seaPreset, 0.5, sky);
  ctx.save();
  const pan = reduceMotion ? 0 : Math.round(Math.sin(t * 0.12) * 5);
  ctx.translate(pan, 0);
  for (const o of art.obj || []) {
    const fn = OBJ[o];
    if (fn) fn(ctx, W, H, hz, tt);
  }
  ctx.restore();
  if (!onboard) {
    // ön planda kendi pruvamız
    const by = H - 6 + Math.round(Math.sin(tt * 1.5));
    for (let r = 0; r < 18; r++) hline(ctx, W - 70 + r * 2.4, W, by - 18 + r, r === 0 ? '#c88a5a' : r % 4 ? '#6a3a26' : '#4a2618');
    line(ctx, W - 70, by - 19, W - 110, by - 34, '#4a3018');
  }
  sea.updateWeather(dt, W, H, art.fx || []);
  sea.drawWeather(ctx, W, H, art.fx || []);
  // vinyet
  ctx.fillStyle = 'rgba(10,6,14,0.25)';
  ctx.fillRect(0, 0, W, 4);
  ctx.fillRect(0, H - 4, W, 4);
}
