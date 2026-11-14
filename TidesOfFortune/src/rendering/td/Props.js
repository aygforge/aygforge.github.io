// TOP-DOWN sahne nesneleri: kargo görselleri, yüzen nesneler, yaratıklar, adalar, kıyı/liman, dalga.
// Her çizici (ctx, x, y, t, o) imzasına sahiptir; x,y nesnenin merkezi (tampon pikseli).
import { makeCanvas, rect, px, hline, vline, line, disc, ellipse, hash2 } from '../pixel.js';
import { petSprite, npcSprite } from './TopChars.js';

const cache = new Map();
function cached(key, w, h, fn) {
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(w, h);
  fn(c.getContext('2d'));
  cache.set(key, c);
  return c;
}

// ───────── Kargo (güvertede istiflenen mallar) ─────────
const CARGO_STYLE = {
  GOOD_GRAIN: 'sack:#d8b878', GOOD_SALT: 'sack:#eeeae0', GOOD_FISH: 'basket:#a8c8d8', GOOD_TIMBER: 'logs:#8a5a2b', GOOD_SANDSTONE: 'stone:#d4b48a',
  GOOD_SPICE: 'crate:#e07b39', GOOD_SILK: 'bolt:#8b5bb5', GOOD_OLIVE_OIL: 'barrel:#5a8a3a', GOOD_WINE: 'barrel:#8e2a2a', GOOD_PORCELAIN: 'crate:#3b6ea5',
  GOOD_GOLD_BAR: 'chest:#f2c14e', GOOD_ANTIQUE: 'chest:#a8805c', GOOD_EXOTIC_ANIMAL: 'cage:#c8423b', GOOD_CHARM_DUST: 'crate:#a56de2', GOOD_BISCUIT_CRATE: 'crate:#d9b48f',
  GOOD_PIRATE_CHEST: 'chest:#2a2026',
};

export function cargoSprite(goodId, spoiled = false) {
  const [kind, col] = (CARGO_STYLE[goodId] || 'crate:#a87a4a').split(':');
  return cached(`cargo|${goodId}|${spoiled}`, 10, 10, (c) => {
    const k = '#2a1608';
    switch (kind) {
      case 'sack': disc(c, 5, 5, 4, k); disc(c, 5, 5, 3, col); px(c, 5, 2, '#6a4a2a'); px(c, 4, 6, 'rgba(0,0,0,0.15)'); break;
      case 'basket': disc(c, 5, 5, 4, '#6a4424'); disc(c, 5, 5, 3, '#a87a4a'); for (const [x, y] of [[4, 4], [6, 5], [5, 6], [4, 6]]) px(c, x, y, col); break;
      case 'logs': for (let i = 0; i < 3; i++) { rect(c, 1, 1 + i * 3, 8, 3, k); rect(c, 1, 2 + i * 3, 8, 1, col); px(c, 8, 2 + i * 3, '#d8b080'); } break;
      case 'stone': rect(c, 1, 1, 8, 8, k); rect(c, 2, 2, 3, 3, col); rect(c, 5, 2, 3, 3, col); rect(c, 2, 5, 6, 3, col); break;
      case 'barrel': disc(c, 5, 5, 4, k); disc(c, 5, 5, 3, '#8a5a2b'); disc(c, 5, 5, 2, col); px(c, 5, 5, k); break;
      case 'bolt': rect(c, 1, 2, 8, 6, k); rect(c, 2, 3, 6, 4, col); hline(c, 2, 7, 4, '#c8a0e8'); break;
      case 'chest': rect(c, 1, 2, 8, 7, k); rect(c, 2, 3, 6, 5, col === '#2a2026' ? '#3a2a30' : '#7a4a24'); hline(c, 2, 7, 5, col); rect(c, 4, 4, 2, 2, col); break;
      case 'cage': rect(c, 1, 1, 8, 8, k); rect(c, 2, 2, 6, 6, '#8a5a2b'); for (let x = 2; x < 8; x += 2) vline(c, x, 2, 7, '#3a2412'); px(c, 5, 4, col); break;
      default: rect(c, 1, 1, 8, 8, k); rect(c, 2, 2, 6, 6, '#a87a4a'); line(c, 2, 2, 7, 7, '#6a4424'); line(c, 7, 2, 2, 7, '#6a4424'); rect(c, 3, 3, 4, 1, col); rect(c, 3, 6, 4, 1, col);
    }
    if (spoiled) { c.fillStyle = 'rgba(90,140,40,0.45)'; c.fillRect(1, 1, 8, 8); px(c, 2, 0, '#2a2a2a'); px(c, 7, 1, '#2a2a2a'); }
  });
}

// ───────── Su yüzeyi nesneleri ─────────
export const DRAW = {};

const ring = (c, x, y, r, t) => { for (let a = 0; a < 6.28; a += 0.4) px(c, x + Math.cos(a + t) * r, y + Math.sin(a + t) * r * 0.7, 'rgba(230,245,250,0.7)'); };

DRAW.crate = (c, x, y, t) => { ring(c, x, y, 7, t); const s = cargoSprite('GOOD_SPICE'); c.drawImage(s, Math.round(x - 5), Math.round(y - 5 + Math.sin(t * 2))); };
DRAW.chest = (c, x, y, t) => {
  ring(c, x, y, 9, t);
  const yy = Math.round(y + Math.sin(t * 2));
  rect(c, x - 6, yy - 5, 12, 10, '#2a1608'); rect(c, x - 5, yy - 4, 10, 8, '#7a4a24'); hline(c, x - 5, x + 4, yy - 1, '#e0b040'); rect(c, x - 1, yy - 2, 2, 3, '#e0b040');
  px(c, x - 4, yy - 4, '#5a8a3a'); px(c, x + 3, yy + 3, '#5a8a3a');
};
DRAW.barrel = (c, x, y, t) => { ring(c, x, y, 6, t); disc(c, x, y + Math.sin(t * 2.3), 4, '#2a1608'); disc(c, x, y + Math.sin(t * 2.3), 3, '#8a5a2b'); hline(c, x - 3, x + 3, y + Math.sin(t * 2.3), '#3a2412'); };
DRAW.timber = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 4); i++) {
    const dx = (hash2(i, 3) - 0.5) * 30, dy = (hash2(i, 4) - 0.5) * 24 + Math.sin(t * 1.5 + i);
    const ang = hash2(i, 5) * 3;
    const L = 12 + (i % 3) * 3;
    const ex = Math.cos(ang) * L / 2, ey = Math.sin(ang) * L / 2;
    line(c, x + dx - ex, y + dy - ey + 1, x + dx + ex, y + dy + ey + 1, '#3a2412');
    line(c, x + dx - ex, y + dy - ey, x + dx + ex, y + dy + ey, '#b08050');
  }
};
DRAW.bottle = (c, x, y, t) => { ring(c, x, y, 5, t); rect(c, x - 2, y - 4 + Math.sin(t * 2), 4, 7, '#3a8a5a'); rect(c, x - 1, y - 6 + Math.sin(t * 2), 2, 2, '#c8a060'); px(c, x, y - 1, '#f4ead5'); };
DRAW.raft = (c, x, y, t) => { ring(c, x, y, 13, t); for (let i = 0; i < 5; i++) rect(c, x - 10 + i * 4, y - 8, 3, 16, i % 2 ? '#8a5a2b' : '#6a4424'); hline(c, x - 10, x + 9, y - 4, '#3a2412'); hline(c, x - 10, x + 9, y + 4, '#3a2412'); c.drawImage(npcSprite('sailor', 'down', 'sit'), x - 11, y - 11); if (Math.sin(t * 6) > 0) disc(c, x + 6, y - 6, 2, '#ffb040'); };
DRAW.boat = (c, x, y, t, o = {}) => {
  ring(c, x, y, 12, t);
  for (let r = 0; r < 22; r++) { const a = Math.round(Math.min(5, 1 + r * 0.7, (22 - r) * 0.6)); hline(c, x - a, x + a, y - 11 + r, r % 7 ? '#8a5a2b' : '#5c3a1e'); }
  c.drawImage(npcSprite(o.npc || 'sailor', 'up', 'sit'), x - 11, y - 12);
};
DRAW.mapScroll = (c, x, y, t) => { rect(c, x - 7, y - 4, 14, 8, '#e8d8a8'); rect(c, x - 8, y - 5, 2, 10, '#c8a870'); rect(c, x + 6, y - 5, 2, 10, '#c8a870'); px(c, x + 2, y, '#c8423b'); };
DRAW.mine = (c, x, y, t) => { for (let i = 0; i < 4; i++) { const mx = x + (hash2(i, 7) - 0.5) * 60, my = y + (hash2(i, 8) - 0.5) * 50 + Math.sin(t + i); ring(c, mx, my, 6, t); disc(c, mx, my, 4, '#2a2a30'); for (let k = 0; k < 6; k++) px(c, mx + Math.cos(k) * 6, my + Math.sin(k) * 6, '#5a5a62'); } };
DRAW.rocks = (c, x, y, t) => { for (let i = 0; i < 5; i++) { const rx = x + (hash2(i, 9) - 0.5) * 90, ry = y + (hash2(i, 10) - 0.5) * 70, r = 6 + hash2(i, 11) * 8; ring(c, rx, ry, r + 3, t * 0.6); disc(c, rx + 1, ry + 2, r, '#2a2a30'); disc(c, rx, ry, r, '#5a5a62'); disc(c, rx - r * 0.3, ry - r * 0.3, r * 0.5, '#8a8a92'); } };
DRAW.iceberg = (c, x, y, t) => { for (let i = 0; i < 4; i++) { const rx = x + (hash2(i, 12) - 0.5) * 100, ry = y + (hash2(i, 13) - 0.5) * 70, r = 8 + hash2(i, 14) * 14; ellipse(c, rx + 2, ry + 3, r, r * 0.8, '#5a8aa8'); ellipse(c, rx, ry, r, r * 0.8, '#e8f4fa'); ellipse(c, rx - r * 0.25, ry - r * 0.25, r * 0.5, r * 0.4, '#ffffff'); } };
DRAW.island = (c, x, y, t, o = {}) => {
  const r = o.r || 34;
  ellipse(c, x, y, r + 6, (r + 6) * 0.8, 'rgba(120,200,210,0.6)');
  ellipse(c, x, y, r + 2, (r + 2) * 0.78, '#e6d6a0');
  ellipse(c, x, y, r - 4, (r - 4) * 0.72, o.ground || '#4f8a44');
  for (let i = 0; i < (o.palms ?? 5); i++) {
    const px0 = x + (hash2(i, 15) - 0.5) * r * 1.1, py0 = y + (hash2(i, 16) - 0.5) * r * 0.8;
    for (let k = 0; k < 5; k++) line(c, px0, py0, px0 + Math.cos(k * 1.25 + t * 0.3) * 7, py0 + Math.sin(k * 1.25) * 6, '#2f6a32');
    disc(c, px0, py0, 1, '#6a4424');
  }
  if (o.ruins) for (let i = 0; i < 4; i++) { rect(c, x - 14 + i * 8, y - 6 + (i % 2) * 5, 5, 5, '#cfc6b0'); px(c, x - 13 + i * 8, y - 5 + (i % 2) * 5, '#9a927e'); }
  if (o.huts) for (let i = 0; i < 3; i++) { const hx = x - 12 + i * 11, hy = y + 6; rect(c, hx, hy, 8, 7, '#8a5a2b'); line(c, hx, hy, hx + 4, hy - 3, '#c8a050'); line(c, hx + 8, hy, hx + 4, hy - 3, '#c8a050'); }
  if (o.lighthouse) { disc(c, x + 10, y - 8, 5, '#e8e4dc'); disc(c, x + 10, y - 8, 3, '#c8423b'); disc(c, x + 10, y - 8, 1, '#ffe080'); }
  if (o.shipyard) { for (let i = 0; i < 7; i++) line(c, x - 12 + i * 4, y - 10, x - 12 + i * 4, y + 10, '#c8a070'); hline(c, x - 14, x + 14, y, '#8a5a2b'); }
  if (o.villagers) for (let i = 0; i < 4; i++) c.drawImage(npcSprite('villager', 'down', 'idle', i % 2), Math.round(x - 20 + i * 10), Math.round(y + r * 0.55 - 6));
  if (o.shrine) { rect(c, x - 6, y - 6, 12, 12, '#8a8a92'); rect(c, x - 3, y - 3, 6, 6, '#f2c14e'); }
};
DRAW.lightOrb = (c, x, y, t) => { const r = 6 + Math.sin(t * 2) * 2; disc(c, x, y, r + 8, 'rgba(120,255,190,0.12)'); disc(c, x, y, r + 3, 'rgba(160,255,210,0.35)'); disc(c, x, y, r - 2, '#e8fff4'); };
DRAW.whirlpool = (c, x, y, t) => { for (let a = 0; a < 40; a += 0.07) { const r = a * 1.8; const ang = a + t * 2; px(c, x + Math.cos(ang) * r, y + Math.sin(ang) * r, a % 1 < 0.5 ? '#e8f6fb' : '#6aa8c8'); } disc(c, x, y, 4, '#05101a'); };
DRAW.fishSchool = (c, x, y, t, o = {}) => {
  const n = o.n || 26;
  for (let i = 0; i < n; i++) {
    const a = t * 1.4 + i * 0.6;
    const fx = x + Math.cos(a * 0.7 + i) * (8 + (i % 5) * 4), fy = y + Math.sin(a + i * 1.7) * (6 + (i % 4) * 3);
    px(c, fx, fy, Math.sin(t * 6 + i) > 0.3 ? '#e8f4fa' : '#9ac0d0'); px(c, fx + 1, fy, '#7aa0b4');
  }
};
DRAW.shadow = (c, x, y, t, o = {}) => {
  // suyun altında büyük gölge (balina, canavar)
  const s = o.s || 1;
  c.fillStyle = `rgba(5,15,30,${o.a ?? 0.35})`;
  for (let i = -20; i <= 20; i++) {
    const w = Math.round(Math.sqrt(400 - i * i) * 0.9 * s);
    c.fillRect(Math.round(x - w / 2 + Math.sin(t + i * 0.2) * 2), Math.round(y + i * 2 * s), w, Math.ceil(2 * s));
  }
};
DRAW.serpent = (c, x, y, t, o = {}) => {
  // yüzeyden çıkan halkalar + baş
  const segs = 5;
  for (let i = 0; i < segs; i++) {
    const sx = x - 50 + i * 22, sy = y + Math.sin(t * 2 + i) * 6;
    ring(c, sx, sy, 10, t);
    ellipse(c, sx, sy, 8, 5, '#1f5a42'); ellipse(c, sx, sy - 1, 7, 4, '#2f7a5a');
    for (let k = -5; k <= 5; k += 3) px(c, sx + k, sy - 2, '#8ae0a0');
  }
  const hx = x + 66, hy = y - 10 + Math.sin(t * 2) * 4;
  ellipse(c, hx, hy, 10, 8, '#1f5a42'); ellipse(c, hx, hy - 1, 9, 7, '#2f7a5a');
  rect(c, hx + 6, hy - 3, 8, 6, '#2f7a5a');
  px(c, hx + 2, hy - 4, '#f2e040'); px(c, hx + 2, hy + 3, '#f2e040');
  if (o.roar) for (let i = 0; i < 3; i++) px(c, hx + 16 + i * 2, hy - 2 + i, '#ffffff');
};
DRAW.tentacles = (c, x, y, t) => {
  for (let k = 0; k < 6; k++) {
    let tx = x + Math.cos(k * 1.05) * 46, ty = y + Math.sin(k * 1.05) * 40;
    ring(c, tx, ty, 8, t);
    for (let s = 0; s < 22; s++) {
      const w = Math.max(1, Math.round(5 - s * 0.2));
      tx += Math.cos(k * 1.05 + Math.PI + Math.sin(t * 2 + s * 0.3 + k) * 0.8) * 1.4;
      ty += Math.sin(k * 1.05 + Math.PI + Math.sin(t * 2 + s * 0.3 + k) * 0.8) * 1.4;
      disc(c, tx, ty, w, s % 5 < 2 ? '#7a1f3e' : '#8a2a4a');
      if (s % 4 === 0 && w > 2) px(c, tx, ty, '#e8a0b0');
    }
  }
};
DRAW.wave = (c, x, y, t, o = {}) => {
  // ekranı yatay kesen dev dalga duvarı
  const W = o.W || 640;
  for (let xx = -40; xx < W + 40; xx++) {
    const h = 22 + Math.sin(xx * 0.05 + t * 2) * 5;
    for (let k = 0; k < h; k++) {
      const col = k < 4 ? '#ffffff' : k < 9 ? '#cfe8f0' : k < h * 0.6 ? '#3d86b0' : '#2a6a96';
      if (k > 4 && (xx + k) % 5 === 0 && k < 12) continue;
      px(c, xx, y - h + k, col);
    }
    if (Math.sin(xx * 0.3 + t * 5) > 0.7) px(c, xx, y - h - 2, '#ffffff');
  }
};
DRAW.fog = (c, x, y, t, o = {}) => {
  const r = o.r || 60;
  for (let i = 0; i < 9; i++) {
    const fx = x + (hash2(i, 21) - 0.5) * r * 2 + Math.sin(t * 0.3 + i) * 6, fy = y + (hash2(i, 22) - 0.5) * r;
    disc(c, fx, fy, r * 0.35, `rgba(220,228,232,${o.a ?? 0.22})`);
  }
};
DRAW.fire = (c, x, y, t, o = {}) => {
  const n = o.n || 10;
  for (let i = 0; i < n; i++) {
    const fx = x + (hash2(i, 23) - 0.5) * (o.w || 14), fy = y + (hash2(i, 24) - 0.5) * (o.h || 10);
    const f = (t * 3 + i * 0.37) % 1;
    disc(c, fx, fy - f * 6, 2 - f, f < 0.4 ? '#fff0a0' : f < 0.7 ? '#ffb040' : '#e0502a');
  }
  px(c, x, y - 9 - ((t * 10) % 6), 'rgba(80,80,80,0.6)');
};
DRAW.bell = (c, x, y, t) => { ring(c, x, y, 9, t); disc(c, x, y + 1, 6, '#8a3a2a'); disc(c, x, y, 4, '#c8a040'); disc(c, x, y, 2, '#a07a20'); if (Math.sin(t * 3) > 0.7) for (let i = 0; i < 4; i++) px(c, x + 8 + i * 3, y - 6 - i, '#f4ead5'); };
DRAW.dockPets = (c, x, y, t) => {
  c.drawImage(petSprite('PET_TARCIN', 'down', Math.sin(t * 5) > 0 ? 'wag1' : 'wag0'), Math.round(x - 20), Math.round(y - 11));
  c.drawImage(petSprite('PET_ZIPIR', 'down', 'sit'), Math.round(x - 2), Math.round(y - 11));
};
DRAW.catBoat = (c, x, y, t) => { DRAW.boat(c, x, y, t, { npc: null }); c.drawImage(petSprite('PET_ZIPIR', 'up', 'sit'), Math.round(x - 11), Math.round(y - 11)); };
DRAW.dogRock = (c, x, y, t) => { disc(c, x + 1, y + 2, 12, '#2a2a30'); disc(c, x, y, 12, '#5a5a62'); disc(c, x - 3, y - 3, 6, '#7a7a82'); c.drawImage(petSprite('PET_TARCIN', 'left', Math.sin(t * 3) > 0.6 ? 'wag1' : 'sit'), Math.round(x - 11), Math.round(y - 13)); };
DRAW.shrine = (c, x, y, t) => DRAW.island(c, x, y, t, { r: 22, palms: 1, shrine: true, ground: '#6a6a72' });
DRAW.turtle = (c, x, y, t) => { ellipse(c, x, y, 12, 9, '#2f5a32'); for (const [dx, dy] of [[-4, -3], [4, -3], [0, 0], [-4, 3], [4, 3]]) disc(c, x + dx, y + dy, 2, '#5a9a5a'); disc(c, x, y - 12, 3, '#6aa060'); for (const s of [-1, 1]) { line(c, x + s * 10, y - 5, x + s * 15, y - 9 + Math.sin(t * 2) * 2, '#5a8a50'); line(c, x + s * 9, y + 6, x + s * 13, y + 9, '#5a8a50'); } };
DRAW.flyingFish = (c, x, y, t) => { for (let i = 0; i < 10; i++) { const f = (t * 0.7 + i * 0.13) % 1; const fx = x - 80 + f * 160, fy = y + (i - 5) * 6 - Math.sin(f * Math.PI) * 6; hline(c, fx, fx + 3, fy + 4, 'rgba(0,0,0,0.25)'); hline(c, fx, fx + 3, fy, '#d8eef6'); px(c, fx + 1, fy - 1, '#ffffff'); px(c, fx + 1, fy + 1, '#ffffff'); } };
DRAW.passenger = (c, x, y, t) => { DRAW.boat(c, x, y, t, { npc: 'ghost' }); disc(c, x, y - 1, 4, '#1e1e2a'); };
DRAW.idol = (c, x, y, t) => { rect(c, x - 3, y - 4, 6, 8, '#f2c14e'); px(c, x - 1, y - 2, '#7a4a10'); px(c, x + 1, y - 2, '#7a4a10'); if (Math.sin(t * 3) > 0.5) px(c, x + 4, y - 5, '#fff6c0'); };

// ───────── Kıyı / liman (yaklaşma ve demirleme) ─────────

const TOWN = {
  fishing: { roofs: ['#7a5a2a', '#5c3a1e', '#8a6a3a'], ground: '#7aa060' },
  trade: { roofs: ['#b8482b', '#c86a3a', '#3b6ea5', '#d8b85a'], ground: '#b8a888' },
  military: { roofs: ['#4a5a7a', '#5a5a62'], ground: '#8a8a82', walls: true },
  pirate: { roofs: ['#3a2a20', '#2a2026'], ground: '#5a5a4a', flags: true },
  fog: { roofs: ['#4a5460', '#5a6470'], ground: '#6a7a7a' },
  mystery: { roofs: ['#3a5a3a', '#4a6a3a'], ground: '#3f6f3a', jungle: true },
  volcanic: { roofs: ['#1a1414', '#5a2a1e'], ground: '#3a3032', lava: true },
  ice: { roofs: ['#f4fbff', '#e8f4fa'], ground: '#dfe9f0' },
  final: { roofs: ['#e0b040', '#3b6ea5', '#b8482b', '#f0e4c8'], ground: '#c8b890', grand: true },
};

/** Liman sahnesi: sağda rıhtım + kasaba (üstten), x: rıhtım kenarı, 0..H dikey */
export function drawTown(c, x0, H, type, t, seed = 1) {
  const S = TOWN[type] || TOWN.trade;
  const W = 900;
  rect(c, x0 + 26, 0, W, H, S.ground);
  // yollar
  for (let y = 20; y < H; y += 70) rect(c, x0 + 26, y, W, 6, '#b8a07a');
  // çatılar
  for (let gy = 0; gy < H; gy += 26) for (let gx = x0 + 34; gx < x0 + 500; gx += 30) {
    const k = hash2(gx, gy, seed);
    if (k < 0.18) continue;
    const w = 18 + Math.round(k * 8), h = 16 + Math.round(hash2(gy, gx, seed) * 6);
    const col = S.roofs[Math.floor(k * 10) % S.roofs.length];
    rect(c, gx + 2, gy + 3, w, h, 'rgba(0,0,0,0.25)');
    rect(c, gx, gy, w, h, col);
    hline(c, gx, gx + w - 1, gy + Math.floor(h / 2), 'rgba(0,0,0,0.25)');
    for (let yy = gy + 1; yy < gy + h; yy += 3) hline(c, gx + 1, gx + w - 2, yy, 'rgba(255,255,255,0.08)');
    if (k > 0.9) disc(c, gx + w / 2, gy + h / 2, 4, '#e0b040');
    if (S.lava && k > 0.8) px(c, gx + 3, gy + 3, '#ff6a2a');
    if (type === 'ice') hline(c, gx, gx + w - 1, gy, '#ffffff');
  }
  if (S.walls) { rect(c, x0 + 28, 0, 8, H, '#6a6a72'); for (let y = 0; y < H; y += 6) rect(c, x0 + 28, y, 10, 3, '#8a8a92'); }
  if (S.jungle) for (let i = 0; i < 30; i++) disc(c, x0 + 40 + hash2(i, 1, seed) * 300, hash2(i, 2, seed) * H, 6, i % 2 ? '#2f6a3a' : '#3f7a42');
  if (S.flags) for (let i = 0; i < 4; i++) { rect(c, x0 + 60 + i * 70, 30 + i * 60, 7, 5, '#0a0a0a'); px(c, x0 + 63 + i * 70, 32 + i * 60, '#ffffff'); }
  if (S.grand) { disc(c, x0 + 120, H * 0.4, 24, '#e0b040'); disc(c, x0 + 120, H * 0.4, 16, '#f0d070'); disc(c, x0 + 120, H * 0.4, 6, '#fff0b0'); }
  // fener
  disc(c, x0 + 40, 26, 7, '#e8e4dc'); disc(c, x0 + 40, 26, 4, '#c8423b'); disc(c, x0 + 40, 26, 2, Math.sin(t * 2) > 0 ? '#fff0a0' : '#f2c14e');
}

/** Rıhtım (iskele): x0 kenar, yatay şerit */
export function drawPier(c, x0, H) {
  rect(c, x0, 0, 28, H, '#7a5030');
  for (let y = 0; y < H; y += 4) hline(c, x0, x0 + 27, y, '#5c3a1e');
  for (let y = 10; y < H; y += 40) { disc(c, x0 + 2, y, 3, '#3a2414'); disc(c, x0 + 2, y, 2, '#6a4424'); }
  vline(c, x0 + 27, 0, H, '#3a2414');
  // sandıklar
  for (let y = 30; y < H; y += 90) { const s = cargoSprite('GOOD_TIMBER'); c.drawImage(s, x0 + 12, y); c.drawImage(cargoSprite('GOOD_GRAIN'), x0 + 14, y + 12); }
}

/** Yaklaşırken ekranın üstünde beliren kıyı ipuçları */
export function drawCoastHint(c, W, y, t, type) {
  const S = TOWN[type] || TOWN.trade;
  for (let x = 0; x < W; x++) {
    const h = 18 + Math.sin(x * 0.03) * 6 + Math.sin(x * 0.11) * 2;
    rect(c, x, y - h, 1, h, S.ground);
    px(c, x, y, '#e6d6a0');
    if (Math.sin(x * 0.5 + t * 2) > 0.8) px(c, x, y + 2, '#ffffff');
  }
  for (let i = 0; i < 12; i++) rect(c, 30 + i * 52, y - 30 + (i % 3) * 4, 14, 10, S.roofs[i % S.roofs.length]);
  disc(c, W * 0.8, y - 24, 5, '#e8e4dc');
  disc(c, W * 0.8, y - 24, 2, Math.sin(t * 3) > 0 ? '#fff0a0' : '#c8423b');
  if (type === 'volcanic') for (let i = 0; i < 6; i++) disc(c, W * 0.3 + Math.sin(t + i) * 4, y - 40 - i * 6, 4, 'rgba(60,50,50,0.5)');
  if (type === 'military') for (let x = 0; x < W; x += 9) rect(c, x, y - 36, 6, 5, '#7a7a82');
  if (type === 'pirate') { rect(c, W * 0.2, y - 44, 8, 6, '#0a0a0a'); px(c, W * 0.2 + 3, y - 42, '#fff'); }
}
