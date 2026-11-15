// Sahne kiti çizimleri (event imza sahneleri için ek nesneler). Hepsi DRAW sözlüğüne eklenir:
// (ctx, x, y, t, opts) — x,y nesne merkezi (tampon pikseli).
import { rect, px, hline, vline, line, disc, ellipse, hash2 } from '../pixel.js';
import { DRAW, cargoSprite } from './Props.js';
import { npcSprite, petSprite } from './TopChars.js';

const ring = (c, x, y, r, t, a = 0.7) => { for (let ang = 0; ang < 6.28; ang += 0.4) px(c, x + Math.cos(ang + t) * r, y + Math.sin(ang + t) * r * 0.7, `rgba(230,245,250,${a})`); };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// ───────── Gökyüzü / ışık katmanları (ekran ölçekli) ─────────
DRAW.rainbow = (c, x, y, t, o = {}) => {
  const cols = ['#e04040', '#f08a30', '#f2d040', '#5cc85c', '#4a9ae0', '#7a5ad8'];
  const R = o.r || 240;
  const a = o.a ?? 0.35;
  for (let i = 0; i < cols.length; i++) {
    c.fillStyle = rgba(cols[i], a);
    for (let ang = Math.PI * 1.05; ang < Math.PI * 1.95; ang += 0.004) c.fillRect(Math.round(x + Math.cos(ang) * (R - i * 4)), Math.round(y + Math.sin(ang) * (R - i * 4) * 0.55), 2, 4);
  }
};
DRAW.aurora = (c, x, y, t, o = {}) => {
  const W = o.W || 640;
  for (let band = 0; band < 3; band++) {
    const col = ['#5af0a0', '#7ac8ff', '#c87aff'][band];
    for (let xx = 0; xx < W; xx += 2) {
      const yy = y + band * 16 + Math.sin(xx * 0.02 + t * 0.6 + band) * 14 + Math.sin(xx * 0.05 - t) * 4;
      const h = 18 + Math.sin(xx * 0.03 + t + band) * 8;
      c.fillStyle = rgba(col, 0.12 + 0.06 * Math.sin(t * 2 + xx * 0.04));
      c.fillRect(xx, Math.round(yy), 2, Math.round(h));
    }
  }
};
DRAW.stars = (c, x, y, t, o = {}) => {
  const W = o.W || 640, H = o.H || 220;
  for (let i = 0; i < (o.n || 70); i++) {
    const sx = hash2(i, 31) * W, sy = hash2(i, 32) * H;
    const tw = Math.sin(t * 3 + i * 1.7);
    if (tw > -0.2) px(c, sx, sy, tw > 0.7 ? '#ffffff' : '#c8d8ff');
  }
  if (o.lines) {
    // takımyıldız: parlak yıldızlar ve aralarında çizgi
    const pts = o.lines.map(([a, b]) => ({ x: x + a, y: y + b }));
    for (let i = 1; i < pts.length; i++) { c.globalAlpha = 0.35 + 0.25 * Math.sin(t * 2); line(c, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, '#f2e080'); c.globalAlpha = 1; }
    for (const p of pts) { disc(c, p.x, p.y, 2, '#fff6c0'); px(c, p.x, p.y, '#ffffff'); }
  }
};
DRAW.moon = (c, x, y, t) => {
  // suya düşen ay yansıması (yukarıdan bakış)
  for (let i = 0; i < 26; i++) {
    const yy = y - 40 + i * 3.2;
    const w = 4 + Math.sin(i * 0.9 + t * 2) * 3 + (13 - Math.abs(i - 13)) * 0.6;
    c.fillStyle = `rgba(240,240,210,${0.18 + 0.12 * Math.sin(t * 3 + i)})`;
    c.fillRect(Math.round(x - w / 2 + Math.sin(t + i) * 2), Math.round(yy), Math.round(w), 1);
  }
  disc(c, x, y - 52, 9, 'rgba(250,250,225,0.18)');
};
DRAW.birds = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 7); i++) {
    const a = t * (0.6 + (i % 3) * 0.1) + i * 0.9;
    const bx = x + Math.cos(a) * (30 + (i % 4) * 9), by = y + Math.sin(a) * (16 + (i % 3) * 6);
    const f = Math.sin(t * 10 + i) > 0;
    px(c, bx + 2, by + 6, 'rgba(0,0,0,0.2)');
    hline(c, bx - 2, bx + 2, by, '#f4f4f0');
    px(c, bx - 2, by + (f ? -1 : 1), '#f4f4f0'); px(c, bx + 2, by + (f ? -1 : 1), '#f4f4f0'); px(c, bx, by, '#5a5a62');
  }
};
DRAW.sparkles = (c, x, y, t, o = {}) => {
  const r = o.r || 60;
  for (let i = 0; i < (o.n || 26); i++) {
    const a = hash2(i, 41) * 6.28 + t * 0.3, d = hash2(i, 42) * r;
    const tw = Math.sin(t * 4 + i * 2.1);
    if (tw > 0.2) { const sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d * 0.7 - ((t * 6 + i * 5) % 20); px(c, sx, sy, o.col || '#fff6c0'); if (tw > 0.85) { px(c, sx - 1, sy, o.col || '#fff6c0'); px(c, sx + 1, sy, o.col || '#fff6c0'); px(c, sx, sy - 1, o.col || '#fff6c0'); px(c, sx, sy + 1, o.col || '#fff6c0'); } }
  }
};
DRAW.glowRing = (c, x, y, t, o = {}) => {
  const col = o.col || '#a0ffd0';
  for (let k = 0; k < 3; k++) {
    const r = ((t * 22 + k * 14) % 42) + 4;
    c.globalAlpha = Math.max(0, 1 - r / 46) * 0.8;
    for (let a = 0; a < 6.28; a += 0.12) px(c, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, col);
  }
  c.globalAlpha = 1;
};
DRAW.glowPatch = (c, x, y, t, o = {}) => {
  const cols = o.cols || ['#5af0c0', '#c87aff', '#f2e060', '#5ab8ff'];
  for (let i = 0; i < (o.n || 9); i++) {
    const gx = x + (hash2(i, 51) - 0.5) * (o.w || 260), gy = y + (hash2(i, 52) - 0.5) * (o.h || 220) + ((t * 8) % 40);
    const r = 10 + hash2(i, 53) * 16 + Math.sin(t * 1.5 + i) * 3;
    ellipse(c, gx, gy, r, r * 0.6, rgba(cols[(i + Math.floor(t * 0.5)) % cols.length], 0.18));
  }
};
DRAW.mist = (c, x, y, t, o = {}) => {
  const col = o.col || '#a8c890';
  for (let i = 0; i < 10; i++) {
    const fx = x + (hash2(i, 61) - 0.5) * (o.r || 120) * 2 + Math.sin(t * 0.4 + i) * 10, fy = y + (hash2(i, 62) - 0.5) * (o.r || 120);
    disc(c, fx, fy, (o.r || 120) * 0.28, rgba(col, o.a ?? 0.16));
  }
};
DRAW.lightBeam = (c, x, y, t, o = {}) => {
  const a0 = t * (o.speed || 0.8);
  for (let k = 0; k < 2; k++) {
    const a = a0 + k * Math.PI;
    for (let d = 6; d < (o.len || 160); d += 2) {
      const w = d * 0.12;
      c.fillStyle = `rgba(255,240,170,${0.22 * (1 - d / (o.len || 160))})`;
      c.fillRect(Math.round(x + Math.cos(a) * d - w / 2), Math.round(y + Math.sin(a) * d * 0.8 - w / 2), Math.ceil(w), Math.ceil(w));
    }
  }
};

// ───────── Su yüzeyi / altı ─────────
DRAW.bubbles = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 14); i++) {
    const bx = x + (hash2(i, 71) - 0.5) * (o.w || 40), ph = (t * (0.6 + hash2(i, 72)) + hash2(i, 73)) % 1;
    const by = y + (o.h || 20) * (0.5 - ph);
    if (ph < 0.85) { px(c, bx, by, '#e8f8ff'); if (i % 3 === 0) { px(c, bx + 1, by, '#bfe3ef'); px(c, bx, by - 1, '#bfe3ef'); } }
  }
};
DRAW.sunkenCity = (c, x, y, t, o = {}) => {
  // dalgaların altında belli belirsiz sütunlar, kubbeler ve sokaklar
  const a = o.a ?? 0.35;
  c.globalAlpha = a;
  const w = o.w || 200;
  for (let i = 0; i < 9; i++) {
    const bx = x - w / 2 + (i * w) / 9 + Math.sin(t * 0.8 + i) * 1.5, by = y + (hash2(i, 81) - 0.5) * 90;
    const kind = i % 3;
    if (kind === 0) { rect(c, bx, by - 14, 10, 28, '#1f5a6a'); rect(c, bx + 1, by - 14, 8, 2, '#3a8a9a'); rect(c, bx + 1, by + 12, 8, 2, '#3a8a9a'); }
    else if (kind === 1) { disc(c, bx + 6, by, 11, '#1f5a6a'); disc(c, bx + 6, by, 7, '#2a6a7a'); px(c, bx + 6, by, '#5ab0c0'); }
    else { rect(c, bx - 4, by - 6, 22, 12, '#1a4a5a'); for (let k = 0; k < 4; k++) vline(c, bx - 2 + k * 5, by - 6, by + 5, '#3a8a9a'); }
  }
  hline(c, x - w / 2, x + w / 2, y + 40, '#1f5a6a'); hline(c, x - w / 2, x + w / 2, y - 40, '#1f5a6a');
  c.globalAlpha = 1;
  DRAW.bubbles(c, x, y - 10, t, { n: 10, w, h: 60 });
};
DRAW.net = (c, x, y, t, o = {}) => {
  const r = o.r || 18;
  ring(c, x, y, r + 3, t);
  c.globalAlpha = 0.85;
  for (let k = -r; k <= r; k += 4) { line(c, x + k, y - r * 0.7, x + k * 0.8, y + r * 0.7, '#d8c8a0'); line(c, x - r, y + k * 0.7, x + r, y + k * 0.6, '#d8c8a0'); }
  c.globalAlpha = 1;
  for (let i = 0; i < (o.fish || 0); i++) { const fx = x + (hash2(i, 91) - 0.5) * r * 1.4, fy = y + (hash2(i, 92) - 0.5) * r + Math.sin(t * 9 + i) * 1.5; hline(c, fx, fx + 3, fy, '#c8e0ea'); px(c, fx + 4, fy, '#7aa0b4'); }
  for (let a = 0; a < 6.28; a += 0.5) disc(c, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, 1, '#c8423b');
};
DRAW.wreck = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 9); i++) {
    const dx = (hash2(i, 101) - 0.5) * (o.w || 120), dy = (hash2(i, 102) - 0.5) * (o.h || 90) + Math.sin(t * 1.3 + i);
    const ang = hash2(i, 103) * 3, L = 10 + (i % 4) * 5;
    const ex = Math.cos(ang) * L / 2, ey = Math.sin(ang) * L / 2;
    ring(c, x + dx, y + dy, L * 0.5, t * 0.7, 0.45);
    line(c, x + dx - ex, y + dy - ey + 1, x + dx + ex, y + dy + ey + 1, '#2a1608');
    line(c, x + dx - ex, y + dy - ey, x + dx + ex, y + dy + ey, i % 3 ? '#8a5a2b' : '#5c3a1e');
  }
  // kırık direk ve yelken parçası
  line(c, x - 30, y + 10, x + 14, y - 16, '#3a2412'); line(c, x - 30, y + 9, x + 14, y - 17, '#6a4424');
  for (let k = 0; k < 7; k++) hline(c, x - 20 + k * 3, x - 8 + k * 3, y - 8 + k, k % 2 ? '#d8ccb0' : '#c8b898');
  if (o.barrels) for (let i = 0; i < o.barrels; i++) DRAW.barrel(c, x + 40 - i * 18, y + 26 + (i % 2) * 8, t + i);
};
DRAW.tavern = (c, x, y, t) => {
  // yüzen meyhane: büyük sal, fener dizisi, fıçılar, masada iki figür
  ring(c, x, y, 30, t * 0.5, 0.5);
  rect(c, x - 30, y - 22, 60, 44, '#3a2412');
  for (let i = 0; i < 10; i++) rect(c, x - 29 + i * 6, y - 21, 5, 42, i % 2 ? '#8a5a2b' : '#7a4a24');
  rect(c, x - 8, y - 4, 16, 8, '#5c3a1e'); px(c, x - 3, y - 1, '#f2c14e'); px(c, x + 3, y, '#f4ead5');
  for (const [dx, dy] of [[-22, -14], [-22, 12], [22, 14]]) { disc(c, x + dx, y + dy, 4, '#2a1608'); disc(c, x + dx, y + dy, 3, '#8a5a2b'); }
  for (let i = 0; i < 7; i++) { const lx = x - 27 + i * 9, ly = y - 24 + Math.sin(i) * 2; px(c, lx, ly, Math.sin(t * 4 + i) > -0.3 ? '#ffd060' : '#c88a30'); disc(c, lx, ly, 3, 'rgba(255,200,90,0.12)'); }
  c.drawImage(npcSprite('pirate', 'right', 'sit'), x - 22, y - 11);
  c.drawImage(npcSprite('oldSailor', 'left', 'sit'), x + 0, y - 11);
};
DRAW.merchantBoat = (c, x, y, t, o = {}) => {
  ring(c, x, y, 18, t);
  for (let r = 0; r < 34; r++) { const a = Math.round(Math.min(9, 2 + r * 0.8, (34 - r) * 0.7)); hline(c, x - a, x + a, y - 17 + r, r % 8 ? '#8a5a2b' : '#5c3a1e'); }
  const goods = o.goods || ['GOOD_SPICE', 'GOOD_SILK', 'GOOD_WINE'];
  goods.slice(0, 3).forEach((g, i) => c.drawImage(cargoSprite(g), Math.round(x - 5), Math.round(y - 4 + i * 8)));
  c.drawImage(npcSprite(o.npc || 'merchant', 'up', 'sit'), x - 11, y - 22);
  rect(c, x - 1, y - 16, 1, 6, '#5c3a1e'); rect(c, x, y - 16, 6, 3, '#e07b39');
};
DRAW.smoke = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 14); i++) {
    const ph = (t * 0.25 + i / (o.n || 14)) % 1;
    const sx = x + Math.sin(ph * 6 + i) * 6 + ph * (o.drift || 30), sy = y - ph * (o.h || 70);
    disc(c, sx, sy, 3 + ph * 9, `rgba(70,66,70,${0.45 * (1 - ph)})`);
  }
};
DRAW.lava = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 8); i++) {
    const lx = x + (hash2(i, 111) - 0.5) * (o.w || 200), ly = y + (hash2(i, 112) - 0.5) * (o.h || 160);
    const r = 6 + hash2(i, 113) * 10;
    ellipse(c, lx, ly, r + 3, (r + 3) * 0.6, 'rgba(60,20,10,0.6)');
    ellipse(c, lx, ly, r, r * 0.6, Math.sin(t * 2 + i) > 0 ? '#e0502a' : '#c83a1e');
    px(c, lx, ly, '#fff0a0');
    if (Math.sin(t * 3 + i * 2) > 0.8) disc(c, lx + 2, ly - 4, 2, 'rgba(200,200,200,0.5)');
  }
};
DRAW.volcano = (c, x, y, t, o = {}) => {
  const r = o.r || 50;
  ellipse(c, x, y, r + 6, (r + 6) * 0.8, 'rgba(120,80,70,0.5)');
  ellipse(c, x, y, r, r * 0.8, '#3a3032');
  ellipse(c, x, y, r * 0.65, r * 0.52, '#4a3a38');
  ellipse(c, x, y, r * 0.32, r * 0.26, '#2a1a18');
  ellipse(c, x, y, r * 0.22, r * 0.18, Math.sin(t * 3) > 0 ? '#e0502a' : '#f08030');
  for (let k = 0; k < 5; k++) { const a = k * 1.3; line(c, x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.2, x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.72, '#c83a1e'); }
  DRAW.smoke(c, x, y - 4, t, { n: 16, h: 90, drift: 26 });
};
DRAW.tsunami = (c, x, y, t, o = {}) => {
  const W = o.W || 640;
  for (let xx = -40; xx < W + 40; xx++) {
    const h = 46 + Math.sin(xx * 0.03 + t * 2) * 8 + Math.sin(xx * 0.11 - t * 3) * 3;
    for (let k = 0; k < h; k++) {
      const col = k < 5 ? '#ffffff' : k < 12 ? '#d8eef4' : k < h * 0.45 ? '#4a96bc' : k < h * 0.8 ? '#2a6a96' : '#1f5a82';
      if (k > 5 && (xx * 3 + k) % 7 === 0 && k < 18) continue;
      px(c, xx, y - h + k, col);
    }
    if (Math.sin(xx * 0.4 + t * 6) > 0.6) { px(c, xx, y - h - 3, '#ffffff'); px(c, xx + 1, y - h - 5, '#e8f6fb'); }
  }
};
DRAW.iceFloes = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 14); i++) {
    const fx = x + (hash2(i, 121) - 0.5) * (o.w || 300), fy = y + (hash2(i, 122) - 0.5) * (o.h || 260);
    const r = 5 + hash2(i, 123) * 12;
    ellipse(c, fx + 1, fy + 2, r, r * 0.7, '#5a8aa8');
    ellipse(c, fx, fy, r, r * 0.7, '#e8f4fa');
    px(c, fx - r * 0.3, fy - r * 0.2, '#ffffff');
  }
};
DRAW.buoyLight = (c, x, y, t) => { ring(c, x, y, 6, t); disc(c, x, y, 3, '#c8423b'); if (Math.sin(t * 4) > 0) { disc(c, x, y, 9, 'rgba(255,90,60,0.25)'); px(c, x, y - 1, '#ffe0a0'); } };
DRAW.lantern = (c, x, y, t) => { disc(c, x, y, 10, `rgba(255,210,120,${0.12 + 0.06 * Math.sin(t * 5)})`); rect(c, x - 2, y - 3, 4, 5, '#3a2a1a'); rect(c, x - 1, y - 2, 2, 3, Math.sin(t * 7) > -0.4 ? '#ffd060' : '#f0a030'); };
DRAW.cave = (c, x, y, t, o = {}) => {
  DRAW.island(c, x, y, t, { r: o.r || 50, palms: 2, ground: '#6a6a62' });
  ellipse(c, x - 4, y + 6, 12, 8, '#1a1a1e'); ellipse(c, x - 4, y + 7, 9, 5, '#0a0a10');
  for (let i = 0; i < 3; i++) disc(c, x + 16 + i * 6, y - 10 + i * 3, 4, '#8a8a82');
  if (o.glint && Math.sin(t * 3) > 0.4) { px(c, x - 4, y + 6, '#f2c14e'); px(c, x - 3, y + 5, '#fff6c0'); }
};
DRAW.treasureIsle = (c, x, y, t, o = {}) => {
  DRAW.island(c, x, y, t, { r: o.r || 54, palms: 5 });
  // X işareti ve kazı
  line(c, x - 5, y - 5, x + 5, y + 5, '#c8423b'); line(c, x + 5, y - 5, x - 5, y + 5, '#c8423b');
  if (o.dug) { ellipse(c, x, y, 7, 5, '#5a3a1e'); ellipse(c, x, y, 5, 3, '#3a2412'); }
  if (o.chest) { rect(c, x - 5, y - 4, 10, 7, '#2a1608'); rect(c, x - 4, y - 3, 8, 5, '#7a4a24'); hline(c, x - 4, x + 3, y - 1, '#f2c14e'); if (Math.sin(t * 4) > 0) { px(c, x - 6, y - 7, '#fff6c0'); px(c, x + 6, y - 6, '#fff6c0'); } }
};
DRAW.temple = (c, x, y, t, o = {}) => {
  DRAW.island(c, x, y, t, { r: o.r || 56, palms: 2, ground: '#5a6a52' });
  rect(c, x - 16, y - 12, 32, 22, '#8a8a7e'); rect(c, x - 14, y - 10, 28, 18, '#b8b0a0');
  for (let i = 0; i < 5; i++) vline(c, x - 13 + i * 6, y - 10, y + 7, '#8a8a7e');
  rect(c, x - 4, y - 4, 8, 8, '#3a2a40');
  disc(c, x, y, 2, Math.sin(t * 3) > 0 ? '#c8a0ff' : '#8af0ff');
  if (o.glow) DRAW.glowRing(c, x, y, t, { col: '#c8a0ff' });
};
DRAW.whale = (c, x, y, t) => {
  // yüzeye yaklaşan balina sırtı ve fıskiye
  ring(c, x, y, 22, t * 0.6, 0.5);
  ellipse(c, x, y, 12, 24, '#2a4a62'); ellipse(c, x - 2, y - 2, 9, 20, '#3a5a72');
  for (let i = 0; i < 6; i++) px(c, x - 3 + (i % 3) * 3, y - 12 + i * 4, '#5a7a8a');
  if (Math.sin(t * 1.5) > 0.3) for (let i = 0; i < 10; i++) px(c, x + Math.sin(i * 2) * (2 + i * 0.5), y - 22 - i * 1.5, '#e8f6fb');
};
DRAW.dolphins = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 4); i++) {
    const ph = (t * 0.7 + i * 0.27) % 1;
    const dx = x + (i - 1.5) * 12, dy = y + 30 - ph * 80;
    if (ph > 0.2 && ph < 0.8) { ellipse(c, dx, dy, 2, 5, '#5a7a92'); px(c, dx, dy - 4, '#8aa0b4'); px(c, dx + 2, dy, '#3a5a72'); }
    else ring(c, dx, dy, 4, t, 0.6);
  }
};
DRAW.spray = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 30); i++) {
    const ph = (t * 1.6 + hash2(i, 131)) % 1;
    const sx = x + (hash2(i, 132) - 0.5) * (o.w || 120), sy = y - ph * 20 + (hash2(i, 133) - 0.5) * (o.h || 30);
    px(c, sx, sy, ph < 0.5 ? '#ffffff' : '#bfe3ef');
  }
};
DRAW.cloudShadow = (c, x, y, t, o = {}) => { for (let i = 0; i < 6; i++) disc(c, x + (hash2(i, 141) - 0.5) * 120, y + (hash2(i, 142) - 0.5) * 60, 26, `rgba(10,20,35,${o.a ?? 0.18})`); };
DRAW.figure = (c, x, y, t, o = {}) => c.drawImage(npcSprite(o.npc || 'sailor', o.dir || 'down', o.state || 'idle', Math.floor(t * 6) % 4), Math.round(x - 11), Math.round(y - 11));
DRAW.petFig = (c, x, y, t, o = {}) => c.drawImage(petSprite(o.id || 'PET_TARCIN', o.dir || 'down', o.pose || 'sit'), Math.round(x - 11), Math.round(y - 11));
DRAW.rowboat = (c, x, y, t, o = {}) => {
  ring(c, x, y, 12, t);
  for (let r = 0; r < 24; r++) { const a = Math.round(Math.min(6, 1 + r * 0.7, (24 - r) * 0.6)); hline(c, x - a, x + a, y - 12 + r, r % 6 ? '#8a5a2b' : '#5c3a1e'); }
  const ppl = o.npcs || ['sailor'];
  ppl.slice(0, 2).forEach((n, i) => c.drawImage(npcSprite(n, o.dir || 'up', 'sit'), x - 11, y - 14 + i * 9));
  // kürekler
  const k = Math.sin(t * 6) * 3;
  line(c, x - 6, y - 2, x - 13, y - 2 + k, '#c8a070'); line(c, x + 6, y - 2, x + 13, y - 2 - k, '#c8a070');
  if (o.cargo) o.cargo.slice(0, 2).forEach((g, i) => c.drawImage(cargoSprite(g), Math.round(x - 5), Math.round(y + 2 + i * 4)));
};
DRAW.reef = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 12); i++) {
    const rx = x + (hash2(i, 151) - 0.5) * (o.w || 160), ry = y + (hash2(i, 152) - 0.5) * (o.h || 90), r = 3 + hash2(i, 153) * 5;
    ring(c, rx, ry, r + 2, t * 0.5, 0.4);
    disc(c, rx, ry, r, '#4a4a52'); px(c, rx - 1, ry - 1, '#8a8a92');
  }
};

// ───────── Güverte üstü küçük nesneler (gemiye bağlı, local koordinat) ─────────
DRAW.puddle = (c, x, y, t, o = {}) => { const r = o.r || 10; ellipse(c, x, y, r, r * 0.6, 'rgba(90,170,220,0.45)'); px(c, x - r * 0.4, y - 1, 'rgba(230,250,255,0.8)'); if (o.jet) for (let i = 0; i < 6; i++) px(c, x + Math.sin(t * 9 + i) * 2, y - 2 - ((t * 20 + i * 3) % 8), '#bfe3ef'); };
DRAW.fishPile = (c, x, y, t, o = {}) => { for (let i = 0; i < (o.n || 8); i++) { const fx = x + (hash2(i, 161) - 0.5) * 16, fy = y + (hash2(i, 162) - 0.5) * 10; const flop = Math.sin(t * 12 + i * 3) > 0.7 ? -1 : 0; hline(c, fx, fx + 3, fy + flop, '#c8e0ea'); px(c, fx + 4, fy + flop, '#7aa0b4'); px(c, fx, fy + flop, '#3a3a42'); } };
DRAW.cauldron = (c, x, y, t) => { disc(c, x, y, 5, '#2a2a2e'); disc(c, x, y, 4, '#5d6470'); disc(c, x, y, 3, '#c8a050'); for (let i = 0; i < 3; i++) px(c, x - 2 + i * 2, y - 6 - ((t * 8 + i * 3) % 6), 'rgba(240,240,240,0.7)'); px(c, x + 2, y + 5, Math.sin(t * 9) > 0 ? '#ffb040' : '#e05020'); };
DRAW.dice = (c, x, y, t) => { rect(c, x - 6, y - 4, 12, 8, '#5c3a1e'); for (const [dx, f] of [[-3, 0], [2, 1]]) { const k = Math.floor(t * 6 + f) % 6 + 1; rect(c, x + dx - 1, y - 2, 4, 4, '#f4f0e0'); px(c, x + dx, y - 1, k > 3 ? '#1a1a1a' : '#c8423b'); if (k % 2 === 0) px(c, x + dx + 1, y, '#1a1a1a'); } };
DRAW.idolDeck = (c, x, y, t) => { disc(c, x, y, 7, `rgba(242,193,78,${0.15 + 0.1 * Math.sin(t * 3)})`); DRAW.idol(c, x, y, t); };
DRAW.medallion = (c, x, y, t) => { disc(c, x, y, 8, `rgba(160,255,210,${0.15 + 0.1 * Math.sin(t * 3)})`); disc(c, x, y, 3, '#c8a040'); px(c, x, y, '#8affd0'); line(c, x, y - 3, x - 3, y - 8, '#c8a040'); };
DRAW.moonStone = (c, x, y, t) => { disc(c, x, y, 9, `rgba(180,200,255,${0.2 + 0.12 * Math.sin(t * 4)})`); disc(c, x, y, 3, '#d8e0ff'); px(c, x - 1, y - 1, '#ffffff'); };
DRAW.mapTable = (c, x, y, t) => { rect(c, x - 9, y - 6, 18, 12, '#5c3a1e'); rect(c, x - 8, y - 5, 16, 10, '#e8d8a8'); for (let i = 0; i < 4; i++) px(c, x - 5 + i * 3, y - 2 + (i % 2) * 2, '#8a6a3a'); px(c, x + 4, y + 2, '#c8423b'); if (Math.sin(t * 4) > 0.5) px(c, x + 5, y + 1, '#fff6c0'); };
DRAW.sackOpen = (c, x, y, t) => { disc(c, x, y, 5, '#2a1608'); disc(c, x, y, 4, '#d8b878'); px(c, x - 1, y - 1, '#f4ead5'); px(c, x + 1, y, '#f4ead5'); };
DRAW.chestOpen = (c, x, y, t) => { rect(c, x - 6, y - 4, 12, 8, '#2a1608'); rect(c, x - 5, y - 3, 10, 6, '#7a4a24'); rect(c, x - 5, y - 7, 10, 3, '#5a3418'); rect(c, x - 4, y - 2, 8, 3, '#f2c14e'); if (Math.sin(t * 5) > 0) { px(c, x - 3, y - 5, '#fff6c0'); px(c, x + 3, y - 4, '#fff6c0'); } };
DRAW.bedroll = (c, x, y) => { rect(c, x - 7, y - 3, 14, 6, '#a89870'); rect(c, x - 7, y - 3, 4, 6, '#e8e0c8'); };
DRAW.ropeCoil = (c, x, y) => { for (let r = 5; r > 1; r -= 1.5) for (let a = 0; a < 6.28; a += 0.3) px(c, x + Math.cos(a) * r, y + Math.sin(a) * r, '#c8a070'); };
DRAW.bucket = (c, x, y) => { disc(c, x, y, 3, '#5c3a1e'); disc(c, x, y, 2, '#5aa8d8'); };
DRAW.scorch = (c, x, y, t, o = {}) => { ellipse(c, x, y, o.r || 9, (o.r || 9) * 0.6, 'rgba(30,20,14,0.55)'); };
DRAW.skull = (c, x, y, t) => { disc(c, x, y, 3, '#e8e4d8'); px(c, x - 1, y, '#1a1a1a'); px(c, x + 1, y, '#1a1a1a'); };
DRAW.patch = (c, x, y) => { rect(c, x - 4, y - 3, 8, 6, '#c8a070'); rect(c, x - 4, y - 3, 8, 1, '#8a5a2b'); px(c, x - 3, y, '#3a3a3a'); px(c, x + 2, y, '#3a3a3a'); };
DRAW.cloak = (c, x, y, t) => { disc(c, x, y, 9, `rgba(80,60,120,${0.15 + 0.08 * Math.sin(t * 2)})`); };

DRAW.shoal = (c, x, y, t, o = {}) => {
  // gümüş balık sürüsü: parlayan su lekesi + belirgin balıklar + sıçramalar
  const w = o.w || 70, h = o.h || 50;
  ellipse(c, x, y, w * 0.6, h * 0.5, 'rgba(200,230,240,0.18)');
  for (let i = 0; i < (o.n || 40); i++) {
    const a = t * (0.9 + (i % 5) * 0.1) + i * 0.7;
    const fx = x + Math.cos(a + i) * w * 0.5 * hash2(i, 171), fy = y + Math.sin(a * 1.3 + i) * h * 0.45 * hash2(i, 172);
    const dx = -Math.sin(a + i) > 0 ? 1 : -1;
    px(c, fx + 1, fy + 1, 'rgba(10,30,50,0.35)');
    hline(c, fx - 2, fx + 1, fy, Math.sin(t * 6 + i) > 0.2 ? '#f4fbff' : '#a8c8d8');
    px(c, fx + (dx > 0 ? 2 : -3), fy, '#6a90a8');
  }
  for (let i = 0; i < 4; i++) { const ph = (t * 0.9 + i * 0.25) % 1; if (ph < 0.25) { const sx = x + (hash2(i, 173) - 0.5) * w, sy = y + (hash2(i, 174) - 0.5) * h; px(c, sx, sy - ph * 16, '#ffffff'); px(c, sx - 1, sy, '#e8f6fb'); px(c, sx + 1, sy, '#e8f6fb'); } }
};

export { DRAW };
