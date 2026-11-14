// Tek liman sahnesi: arka plan liman tipine ve bölgeye göre değişir (GDD: "Sahne az, event çok").
import { rect, px, hline, vline, line, disc, ellipse, hash2 } from './pixel.js';
import { SeededRNG } from '../core/SeededRNG.js';

export const HARBOR_SKY = { fishing: 'day', trade: 'day', military: 'day', pirate: 'dusk', fog: 'fog', mystery: 'eerie', volcanic: 'ash', ice: 'aurora', final: 'dawn' };
export const HARBOR_SEA = { fishing: 'calm', trade: 'calm', military: 'choppy', pirate: 'dark', fog: 'calm', mystery: 'eerie', volcanic: 'lava', ice: 'ice', final: 'calm' };

const STYLE = {
  fishing: { walls: ['#a87a4a', '#8a5a2b', '#b8885a'], roofs: ['#5c3a1e', '#7a5a2a', '#4a3a20'], h: [8, 14], w: [10, 16] },
  trade: { walls: ['#e8d8b8', '#d8b88a', '#f0e4c8', '#c89a6a'], roofs: ['#b8482b', '#c86a3a', '#3b6ea5'], h: [14, 30], w: [10, 18] },
  military: { walls: ['#8a8a92', '#9a9aa2', '#7a7a82'], roofs: ['#3a4a6a', '#4a4a52'], h: [16, 28], w: [12, 20] },
  pirate: { walls: ['#4a3424', '#3a2a1e', '#5a4030'], roofs: ['#2a1e16', '#3a2a20'], h: [8, 16], w: [10, 16] },
  fog: { walls: ['#6a7480', '#5a6470', '#7a8490'], roofs: ['#3a4450', '#4a5460'], h: [10, 20], w: [10, 16] },
  mystery: { walls: ['#7a8a6a', '#6a7a5a', '#8a9a7a'], roofs: ['#3a5a3a', '#4a6a3a'], h: [8, 16], w: [10, 14] },
  volcanic: { walls: ['#3a3032', '#4a3a3a', '#2a2224'], roofs: ['#1a1414', '#5a2a1e'], h: [8, 16], w: [10, 16] },
  ice: { walls: ['#c8d8e4', '#a8bccc', '#d8e4ec'], roofs: ['#f4fbff', '#e8f4fa'], h: [10, 18], w: [10, 16] },
  final: { walls: ['#f0e4c8', '#e8d8b8', '#f8f0dc'], roofs: ['#e0b040', '#3b6ea5', '#b8482b'], h: [18, 44], w: [12, 22] },
};

const sceneCache = new Map();

/** Statik arka planı önbelleğe alır, hareketli öğeleri her karede çizer. */
export function drawHarbor(ctx, W, H, harbor, t, sea, opts = {}) {
  const type = harbor.final ? 'final' : harbor.type;
  const sky = HARBOR_SKY[type];
  const seaP = HARBOR_SEA[type];
  const hz = Math.round(H * 0.5);
  sea.drawSky(ctx, W, hz, t, sky);
  // statik şehir katmanı
  const key = `${harbor.id}|${W}|${H}`;
  let city = sceneCache.get(key);
  if (!city) {
    city = document.createElement('canvas');
    city.width = W;
    city.height = H;
    drawCity(city.getContext('2d'), W, H, hz, harbor, type);
    if (sceneCache.size > 6) sceneCache.clear();
    sceneCache.set(key, city);
  }
  ctx.drawImage(city, 0, 0, W, hz + 6, 0, 0, W, hz + 6);
  sea.drawSea(ctx, W, hz + 6, H, t, seaP, 0.25, sky);
  // canlı detaylar
  if (type === 'volcanic') {
    for (let i = 0; i < 8; i++) disc(ctx, W * 0.72 + Math.sin(t * 0.5 + i) * 5 + i * 2, hz - 60 - ((t * 6 + i * 11) % 50), 4 + (i % 3), 'rgba(60,50,50,0.6)');
  }
  if (type === 'fog' || type === 'mystery') sea.drawWeather(ctx, W, H, ['mist']);
  // lambalar
  for (let i = 0; i < 6; i++) {
    const lx = W * (0.3 + i * 0.12);
    const flick = Math.sin(t * 6 + i * 2) > -0.6;
    if (flick && (sky === 'dusk' || sky === 'fog' || sky === 'aurora' || sky === 'eerie' || sky === 'ash')) px(ctx, lx, hz - 4 - (i % 3) * 3, '#ffd870');
  }
  // martılar
  for (let i = 0; i < 4; i++) {
    const x = (W * hash2(i, 33) + t * (8 + i * 3)) % W;
    const y = hz * (0.25 + hash2(i, 34) * 0.3) + Math.sin(t * 2 + i) * 2;
    const f = Math.sin(t * 7 + i) > 0 ? 1 : 0;
    px(ctx, x - 1, y - f, '#f4ead5'); px(ctx, x, y, '#f4ead5'); px(ctx, x + 1, y - f, '#f4ead5');
  }
  return { hz };
}

/** Rıhtım ön planı (gemi çizildikten sonra) */
export function drawDockFront(ctx, W, H, t) {
  const y = Math.round(H * 0.86);
  rect(ctx, 0, y, W, H - y, '#6a4424');
  for (let x = 0; x < W; x += 7) vline(ctx, x, y, H, '#4a2e18');
  hline(ctx, 0, W, y, '#a07040');
  hline(ctx, 0, W, y + 1, '#8a5a30');
  for (let i = 0; i < 6; i++) {
    const x = 20 + i * 70;
    rect(ctx, x, y - 6, 4, 8, '#3a2414');
    hline(ctx, x - 1, x + 4, y - 6, '#5a3a20');
  }
  // sandıklar ve halat
  rect(ctx, W * 0.42, y - 8, 9, 8, '#a87a4a');
  hline(ctx, W * 0.42, W * 0.42 + 8, y - 5, '#6a4424');
  rect(ctx, W * 0.42 + 10, y - 6, 7, 6, '#8a5a2b');
  ellipse(ctx, W * 0.36, y - 2, 5, 2, '#c8a060');
  ellipse(ctx, W * 0.36, y - 2, 2, 1, '#6a4424');
}

function drawCity(c, W, H, hz, harbor, type) {
  const rng = new SeededRNG(harbor.id);
  const st = STYLE[type];
  // arka tepeler / dağlar
  const hill = { fishing: '#5a8a5a', trade: '#7a8a5a', military: '#6a7a6a', pirate: '#2a2a30', fog: '#7a8490', mystery: '#2f5a3a', volcanic: '#2a1e1e', ice: '#dfe9f0', final: '#7a9a6a' }[type];
  for (let x = 0; x < W; x++) {
    const h = 18 + Math.sin(x * 0.02 + rng.next() * 0.001) * 8 + Math.sin(x * 0.055) * 5;
    rect(c, x, hz - h, 1, h + 6, hill);
  }
  if (type === 'volcanic' || type === 'pirate') {
    const vx = W * 0.72;
    for (let r = 0; r < 60; r++) hline(c, vx - 8 - r * 1.1, vx + 8 + r * 1.1, hz - 70 + r, type === 'volcanic' ? (r % 6 ? '#2e2224' : '#3e2e30') : '#22222a');
    if (type === 'volcanic') { for (let i = 0; i < 5; i++) line(c, vx - 4 + i * 2, hz - 70, vx - 12 + i * 6, hz - 46 + i * 4, '#ff6a2a'); }
  }
  if (type === 'ice') {
    for (let i = 0; i < 4; i++) {
      const bx = W * (0.15 + i * 0.25);
      for (let r = 0; r < 26; r++) hline(c, bx - r * 0.7, bx + r * 0.9, hz - 26 + r, r % 6 ? '#f4fbff' : '#bfe3ef');
    }
  }
  if (type === 'mystery') {
    for (let i = 0; i < 18; i++) {
      const tx = rng.range(0, W);
      const th = rng.range(10, 26);
      vline(c, tx, hz - th, hz, '#3a2a1a');
      ellipse(c, tx, hz - th, 6, 4, i % 2 ? '#2f6a3a' : '#3f7a42');
    }
    // taş başlar
    for (let i = 0; i < 3; i++) {
      const sx = W * (0.25 + i * 0.22);
      rect(c, sx, hz - 16, 7, 14, '#7a7a72');
      rect(c, sx + 1, hz - 13, 2, 2, '#3a3a36');
      rect(c, sx + 4, hz - 13, 2, 2, '#3a3a36');
      rect(c, sx + 2, hz - 8, 3, 1, '#3a3a36');
    }
  }
  // binalar
  let x = 2;
  while (x < W) {
    const w = rng.int(st.w[0], st.w[1]);
    const h = rng.int(st.h[0], st.h[1]);
    const wall = rng.pick(st.walls);
    const roof = rng.pick(st.roofs);
    const by = hz + 2;
    rect(c, x, by - h, w, h, wall);
    vline(c, x + w - 1, by - h, by, 'rgba(0,0,0,0.18)');
    // pencereler
    for (let wy = by - h + 3; wy < by - 3; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) {
      if (rng.next() < 0.7) rect(c, wx, wy, 2, 2, rng.next() < 0.4 ? '#ffd870' : '#2a2a34');
    }
    // çatı
    if (type === 'military') {
      for (let k = 0; k < w; k += 3) rect(c, x + k, by - h - 3, 2, 3, wall);
      if (rng.next() < 0.3) { vline(c, x + w / 2, by - h - 12, by - h - 3, '#3a3a3a'); rect(c, x + w / 2 + 1, by - h - 12, 6, 4, '#3b6ea5'); }
    } else if ((type === 'trade' || type === 'final') && rng.next() < 0.25) {
      ellipse(c, x + w / 2, by - h, w / 2, w / 3, roof === '#3b6ea5' ? '#3b6ea5' : '#e0b040');
      vline(c, x + w / 2, by - h - w / 3 - 4, by - h - w / 3, '#e0b040');
    } else if (type === 'ice') {
      for (let r = 0; r < 5; r++) hline(c, x - 1 + r, x + w - r, by - h - r, '#f4fbff');
    } else {
      for (let r = 0; r < Math.ceil(w / 2); r++) hline(c, x - 1 + r, x + w - r, by - h - r, roof);
    }
    if (type === 'pirate' && rng.next() < 0.3) {
      vline(c, x + 2, by - h - 16, by - h, '#2a1e16');
      rect(c, x + 3, by - h - 16, 7, 5, '#0a0a0a');
      px(c, x + 6, by - h - 14, '#f4ead5');
    }
    if (type === 'fishing' && rng.next() < 0.35) {
      for (let k = 0; k < 8; k += 2) { vline(c, x + w + 2 + k, by - 10, by, '#c8b890'); hline(c, x + w + 2, x + w + 10, by - 10 + k, '#c8b890'); }
      x += 10;
    }
    if (type === 'trade' && rng.next() < 0.3) {
      for (let k = 0; k < w + 6; k++) px(c, x + k - 3, by - 6, k % 4 < 2 ? '#c8423b' : '#f4ead5');
    }
    x += w + rng.int(1, 5);
  }
  if (type === 'final') {
    // büyük kule ve saray kubbesi
    const tx = W * 0.6;
    rect(c, tx, hz - 62, 12, 64, '#f0e4c8');
    for (let r = 0; r < 8; r++) hline(c, tx - 2 + r, tx + 13 - r, hz - 62 - r, '#e0b040');
    ellipse(c, W * 0.75, hz - 26, 22, 14, '#e0b040');
    rect(c, W * 0.75 - 22, hz - 26, 44, 28, '#f8f0dc');
    for (let i = 0; i < 4; i++) { vline(c, W * 0.2 + i * 60, hz - 44, hz - 30, '#5a3a20'); rect(c, W * 0.2 + i * 60 + 1, hz - 44, 8, 5, i % 2 ? '#8b5bb5' : '#c8423b'); }
  }
  // liman duvarı
  rect(c, 0, hz + 2, W, 4, type === 'ice' ? '#a8bccc' : '#6a5a4a');
  hline(c, 0, W, hz + 2, type === 'ice' ? '#f4fbff' : '#8a7a6a');
}
