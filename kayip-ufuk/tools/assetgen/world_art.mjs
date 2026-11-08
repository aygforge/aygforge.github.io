// Terrain (20 TerrainDB ids × 4 seam-safe variants), transitions (4 classes × 16 masks), water loops,
// foliage, resource node ready/depleted states and 12 crops × 4 growth stages.
import { Pix, shade, mix, prng, strHash, hex } from './raster.mjs';
import { P } from './palette.mjs';
import { ICON_SHAPES, scaleDown } from './icons.mjs';

const BASE = {
  OCEAN_DEEP: P.water_deep, OCEAN_SHALLOW: P.water_shallow, BEACH_SAND: P.sand, MEADOW: P.grass, GROVE: '#5fa25a', FOREST_FLOOR: P.forest,
  SWAMP_SOIL: '#5b7a4a', ROCKY_GROUND: '#b77865', MOUNTAIN_SOIL: '#7f8a8e', SETTLEMENT_GROUND: '#b9a888', LAGOON_SOIL: '#6fbf9e', WETLAND_WADE: '#4f9a98',
  RIVER_DEEP: '#2f86a8', RIVER_FORD: '#7fb8b0', DIRT_TRAIL: '#c9a676', CLIFF_WALL: '#5a5b62', TIDAL_SANDBAR: '#d8c98a', REED_PATCH: '#6a9a5a', SEA_REEF: '#3fa3b0', RIVER_BANK: '#7fa47e',
};

function tileNoise(p, seed, base, opts = {}) {
  const r = prng(seed); p.rect(0, 0, 32, 32, base);
  const n = opts.n || 40;
  for (let i = 0; i < n; i++) { const x = Math.floor(r() * 32), y = Math.floor(r() * 32); p.set(x, y, shade(base, (r() - 0.5) * (opts.amp || 0.18))); }
}

export function drawTerrain(id, v) {
  const p = new Pix(32, 32); const base = BASE[id]; const seed = strHash(id) + v * 977; const r = prng(seed);
  tileNoise(p, seed, base, { n: 70, amp: 0.14 });
  switch (id) {
    case 'OCEAN_DEEP': for (let i = 0; i < 3; i++) { const y = Math.floor(r() * 30), x = Math.floor(r() * 24); p.rect(x, y, 6 + Math.floor(r() * 4), 1, shade(base, 0.18)); } break;
    case 'OCEAN_SHALLOW': for (let i = 0; i < 4; i++) { const y = Math.floor(r() * 30), x = Math.floor(r() * 24); p.rect(x, y, 5, 1, shade(base, 0.3)); } p.speckle(r, 0.03, [shade(P.sand, -0.1)]); break;
    case 'BEACH_SAND': p.speckle(r, 0.08, [P.sand_light, shade(P.sand, -0.12)]); if (v === 2) { p.set(10, 20, '#f0c8b0'); p.set(11, 20, '#f0c8b0'); } break;
    case 'MEADOW': case 'GROVE': case 'LAGOON_SOIL': case 'REED_PATCH':
      for (let i = 0; i < 9; i++) { const x = Math.floor(r() * 30), y = 3 + Math.floor(r() * 28); p.set(x, y, shade(base, 0.25)); p.set(x + 1, y - 1, shade(base, 0.3)); p.set(x + 2, y, shade(base, 0.2)); }
      if (id === 'MEADOW' && v === 3) { p.set(20, 10, P.yellow); p.set(8, 24, P.pink); }
      if (id === 'REED_PATCH') for (let i = 0; i < 4; i++) { const x = 4 + Math.floor(r() * 24); p.line(x, 28, x + 1, 18, '#8aa35a'); p.rect(x, 17, 2, 3, '#8a5a3a'); }
      break;
    case 'FOREST_FLOOR': for (let i = 0; i < 14; i++) { const x = Math.floor(r() * 31), y = Math.floor(r() * 31); p.rect(x, y, 2, 1, i % 2 ? P.forest_dark : '#4c8a5a'); } break;
    case 'SWAMP_SOIL': p.ellipse(8 + r() * 16, 8 + r() * 16, 5, 3, '#4a6a52'); p.speckle(r, 0.05, ['#3e5a40', '#6e8a5a']); break;
    case 'ROCKY_GROUND': for (let i = 0; i < 3; i++) { let x = Math.floor(r() * 32), y = Math.floor(r() * 32); for (let k = 0; k < 7; k++) { p.set(x, y, shade(base, -0.3)); x += r() > 0.5 ? 1 : 0; y += 1; } } p.speckle(r, 0.04, ['#d89a80']); break;
    case 'MOUNTAIN_SOIL': for (let i = 0; i < 3; i++) p.rect(Math.floor(r() * 26), Math.floor(r() * 30), 5, 1, shade(base, -0.2)); p.speckle(r, 0.03, [P.quartz]); break;
    case 'SETTLEMENT_GROUND': p.speckle(r, 0.06, [shade(base, -0.2), shade(base, 0.15)]); for (let i = 0; i < 3; i++) p.ellipse(r() * 30, r() * 30, 1.2, 1, P.stone); break;
    case 'WETLAND_WADE': p.ellipse(16, 16, 12, 9, shade(base, 0.08)); for (let i = 0; i < 3; i++) { const x = 3 + Math.floor(r() * 26); p.line(x, 26, x, 17, '#7a9a5a'); } break;
    case 'RIVER_DEEP': for (let i = 0; i < 4; i++) { const y = Math.floor(r() * 30); p.rect(Math.floor(r() * 20), y, 8, 1, shade(base, 0.22)); } break;
    case 'RIVER_FORD': for (let i = 0; i < 6; i++) p.ellipse(3 + r() * 26, 3 + r() * 26, 2.5, 1.8, i % 2 ? P.stone_light : P.stone); p.speckle(r, 0.04, ['#e8f6f6']); break;
    case 'DIRT_TRAIL': p.rect(0, 9, 32, 1, shade(base, -0.15)); p.rect(0, 22, 32, 1, shade(base, -0.15)); p.speckle(r, 0.05, [shade(base, -0.25), P.sand_light]); break;
    case 'CLIFF_WALL':
      for (let y = 0; y < 32; y += 8) { p.rect(0, y, 32, 2, shade(base, 0.22)); p.rect(0, y + 6, 32, 2, shade(base, -0.25)); }
      for (let i = 0; i < 4; i++) p.line(Math.floor(r() * 32), Math.floor(r() * 32), Math.floor(r() * 32), Math.floor(r() * 32), shade(base, -0.35));
      if (v % 2) { p.set(6, 3, '#7aa35a'); p.set(7, 3, '#7aa35a'); }
      break;
    case 'TIDAL_SANDBAR': for (let y = 4; y < 32; y += 7) for (let x = 0; x < 32; x++) p.set(x, y + Math.round(Math.sin((x + v * 5) / 4)), shade(base, -0.12)); break;
    case 'SEA_REEF': for (let i = 0; i < 4; i++) { const x = 4 + r() * 24, y = 4 + r() * 24; p.ellipse(x, y, 2.5, 2, [P.coral, '#e8a0b0', '#f2d054', '#8e5bb5'][i % 4]); } break;
    case 'RIVER_BANK': p.speckle(r, 0.08, ['#6a8a5a', '#9ab88a', '#7a6a4a']); break;
  }
  return p;
}

// transitions: mask bit 1=N 2=E 4=S 8=W (neighbor is the "other" class)
export function drawTransition(kind, mask) {
  const p = new Pix(32, 32);
  const band = (side, w, c, jag = 0) => {
    for (let i = 0; i < 32; i++) {
      const wv = w + (jag ? Math.round(Math.sin(i * 0.7 + w) * jag) : 0);
      for (let k = 0; k < wv; k++) {
        const a = Math.round(255 * (1 - k / (wv + 0.5)) * 0.95);
        const cc = [...hex(c).slice(0, 3), a];
        if (side === 1) p.set(i, k, cc); if (side === 4) p.set(i, 31 - k, cc); if (side === 8) p.set(k, i, cc); if (side === 2) p.set(31 - k, i, cc);
      }
    }
  };
  const C = { shore: ['#f6efd8', 4, 1], cliff: ['#3c3d44', 5, 1], path: ['#d8bb8b', 3, 1], river_bank: ['#5f8a6a', 4, 1] }[kind];
  for (const side of [1, 2, 4, 8]) if (mask & side) band(side, C[1], C[0], C[2]);
  if (kind === 'shore') for (const side of [1, 2, 4, 8]) if (mask & side) { const r = prng(mask * 31 + side); for (let i = 0; i < 5; i++) { const t = Math.floor(r() * 30); if (side === 1) p.set(t, 1, '#ffffff'); if (side === 4) p.set(t, 30, '#ffffff'); if (side === 8) p.set(1, t, '#ffffff'); if (side === 2) p.set(30, t, '#ffffff'); } }
  if (kind === 'cliff') for (const side of [1, 2, 4, 8]) if (mask & side) { if (side === 4) p.rect(0, 26, 32, 2, '#2c2d33'); }
  if (mask === 0) { // isolated: subtle corner accents only (inner-corner variant)
    const c0 = [...hex(C[0]).slice(0, 3), 150];
    for (const [x, y] of [[0, 0], [31, 0], [0, 31], [31, 31], [1, 0], [0, 1], [30, 0], [31, 1], [0, 30], [1, 31], [30, 31], [31, 30]]) p.set(x, y, c0);
  }
  return p;
}

export function drawWater(kind, f) {
  const p = new Pix(32, 32);
  const base = { deep_water: P.water_deep, river: '#2f86a8', shallow_water: P.water_shallow, shore_foam: '#ffffff' }[kind];
  if (kind === 'shore_foam') {
    for (let x = 0; x < 32; x++) { const y = 2 + Math.round(Math.sin((x + f * 5.3) / 4) * 2); p.set(x, y, [255, 255, 255, 200]); p.set(x, y + 1, [255, 255, 255, 110]); }
    return p;
  }
  // transparent shimmer overlay (drawn over the static base)
  const r = prng(strHash(kind) + 3);
  for (let i = 0; i < 6; i++) {
    const y0 = Math.floor(r() * 32), x0 = Math.floor(r() * 32), len = 4 + Math.floor(r() * 5);
    const dx = kind === 'river' ? f * 5 : f * 2;
    for (let k = 0; k < len; k++) p.set((x0 + k + dx) % 32, (y0 + Math.round(Math.sin((f + i) * 1.05))) % 32, [...hex(shade(base, 0.45)).slice(0, 3), 150 - Math.abs(k - len / 2) * 15]);
  }
  return p;
}

// ---------- foliage ----------
function trunk(p, x, y0, y1, w, c = P.bark) { p.rect(x - w / 2, y0, w, y1 - y0, c); p.rect(x - w / 2, y0, 1, y1 - y0, shade(c, 0.2)); }
function canopy(p, cx, cy, rx, ry, c, r) { p.ellipse(cx, cy, rx, ry, shade(c, -0.15)); p.ellipse(cx - rx * 0.2, cy - ry * 0.2, rx * 0.85, ry * 0.8, c); for (let i = 0; i < 18; i++) p.ellipse(cx + (r() - 0.5) * rx * 1.4, cy + (r() - 0.6) * ry * 1.2, 2.5, 2, shade(c, 0.18 + r() * 0.1)); }
function palmTree(p, w, h, v, coconuts = false, leafC = P.palm) {
  const r = prng(31 + v); const bx = w / 2, by = h - 4; const lean = (v - 1) * 6;
  const top = 26;
  for (let i = 0; i <= 44; i++) { const t = i / 44; const x = bx + lean * t * t, y = by - t * (by - top); p.rect(x - 3, y, 6, 2, i % 3 ? '#8a6a48' : '#6c5340'); p.set(x + 2, y, '#a8865c'); }
  const tx = bx + lean, ty = top;
  const fronds = [-2.9, -2.45, -2.0, -1.55, -1.1, -0.65, -0.2, 0.25, 2.85 + Math.PI * 0];
  fronds.forEach((a0, k) => {
    const a = a0 + (r() - 0.5) * 0.15; const len = 24 + r() * 6;
    for (let s2 = 0; s2 < len; s2++) {
      const t = s2 / len; const x = tx + Math.cos(a) * s2, y = ty + Math.sin(a) * s2 * 0.6 + t * t * 14;
      const wdt = Math.max(1, 4 * (1 - t));
      p.rect(x - wdt / 2, y - 1, wdt, 2, k % 2 ? leafC : shade(leafC, 0.12));
      if (s2 % 3 === 0) { p.line(x, y, x + Math.cos(a + 1.3) * wdt * 1.6, y + Math.sin(a + 1.3) * wdt * 1.2 + 2, shade(leafC, -0.18)); p.line(x, y, x + Math.cos(a - 1.3) * wdt * 1.4, y + Math.sin(a - 1.3) * wdt + 1, shade(leafC, 0.22)); }
    }
  });
  p.ellipse(tx, ty, 4, 3, shade(leafC, -0.3));
  if (coconuts) for (let i = 0; i < 3; i++) p.circle(tx - 3 + i * 3, ty + 5, 2.6, '#7b4f2c');
}
export function drawFoliage(kind, v) {
  const S = { bamboo_cluster: [64, 96], broadleaf: [128, 128], cave_stalactite: [64, 64], cliff_grass: [32, 32], fallen_log: [96, 64], flower_bush: [48, 48], mangrove: [96, 96], moss: [32, 32], palm: [96, 128], reeds: [64, 64], reef_coral: [64, 64], vine: [64, 64] }[kind];
  const [w, h] = S; const p = new Pix(w, h); const r = prng(strHash(kind) + v * 101);
  switch (kind) {
    case 'palm': palmTree(p, w, h, v, v === 2); break;
    case 'broadleaf': trunk(p, 64, 70, 124, 10); p.line(64, 90, 48, 80, P.bark, 3); canopy(p, 64, 54, 50 - v * 3, 40, [P.leaf, '#5aa04a', '#4a8a4a'][v], r); break;
    case 'bamboo_cluster': for (let k = 0; k < 5; k++) { const x = 10 + k * 10 + v * 2; const top = 8 + (k * 13 + v * 7) % 20; p.rect(x, top, 5, h - top - 2, k % 2 ? '#86b84a' : '#9cc95a'); for (let y = top + 6; y < h - 2; y += 9) p.rect(x - 1, y, 7, 1, '#5e8a33'); p.ellipse(x + 6, top + 4, 6, 2, P.leaf_light); } break;
    case 'mangrove': for (let k = 0; k < 6; k++) { const x = 18 + k * 12; p.line(48, 60, x, 92, '#6a5a40', 2); } trunk(p, 48, 40, 64, 6, '#6a5a40'); canopy(p, 48, 34, 40, 26, ['#4a7a4a', '#557a44', '#3e6a48'][v], r); break;
    case 'reeds': for (let i = 0; i < 12; i++) { const x = 6 + i * 4.5 + r() * 2; const top = 10 + r() * 20; p.line(x, 62, x + (r() - 0.5) * 6, top, i % 2 ? '#8aa35a' : '#6f8a46'); if (i % 3 === 0) p.rect(x - 1, top - 4, 3, 6, '#8a5a3a'); } break;
    case 'vine': for (let k = 0; k < 4; k++) for (let a = 0; a < 60; a++) { p.set(10 + k * 14 + Math.sin(a / 6 + k) * 4, a, '#3e7a3a'); if (a % 6 === 0) p.ellipse(10 + k * 14 + Math.sin(a / 6 + k) * 4 + 3, a, 3, 2, P.leaf_light); } break;
    case 'flower_bush': canopy(p, 24, 30, 20, 14, P.leaf, r); for (let i = 0; i < 9; i++) p.circle(8 + r() * 32, 20 + r() * 20, 1.6, [P.pink, P.yellow, P.red, '#ffffff'][(i + v) % 4]); break;
    case 'fallen_log': p.poly([[6, 44], [80, 30], [88, 42], [14, 56]], P.wood); p.ellipse(84, 36, 7, 7, '#9a7552'); p.ellipse(84, 36, 3, 3, '#7a5a3e'); for (let i = 0; i < 5; i++) p.ellipse(20 + i * 14, 40 - i * 2, 4, 2, '#5aa04a'); break;
    case 'moss': for (let i = 0; i < 10; i++) p.ellipse(4 + r() * 24, 10 + r() * 18, 3, 2, i % 2 ? '#5a9a4a' : '#6fae52'); break;
    case 'cliff_grass': for (let i = 0; i < 7; i++) { const x = 3 + i * 4; p.line(x, 30, x + (r() - 0.5) * 4, 14 + r() * 8, i % 2 ? '#7aa35a' : '#5f8a46'); } break;
    case 'reef_coral': for (let k = 0; k < 4; k++) { const cx = 12 + k * 13, c = [P.coral, '#e8a0b0', '#f2d054', '#8e5bb5'][(k + v) % 4]; for (let b = 0; b < 4; b++) p.line(cx, 58, cx + (b - 1.5) * 5, 30 + r() * 12, c, 3); p.circle(cx, 30, 3, shade(c, 0.3)); } break;
    case 'cave_stalactite': for (let k = 0; k < 4; k++) { const x = 8 + k * 15; const len = 20 + ((k * 17 + v * 11) % 30); p.poly([[x - 5, 0], [x + 5, 0], [x, len]], k % 2 ? '#6a6460' : '#7a746e'); p.line(x - 2, 2, x, len - 4, '#9a948e'); } break;
  }
  p.outline(P.outline); p.rimShade(0.12, -0.15);
  return p;
}

// ---------- resource nodes (64×64) ----------
export function drawResource(itemId, state) {
  const p = new Pix(64, 64); const r = prng(strHash(itemId) + (state === 'ready' ? 1 : 2));
  const ready = state === 'ready';
  const stump = (c = P.bark) => { p.ellipse(32, 56, 10, 4, shade(c, -0.2)); p.rect(25, 46, 14, 10, c); p.ellipse(32, 46, 7, 3, '#c9a676'); p.ellipse(32, 46, 3, 1.4, '#9a7552'); };
  const rock = (c, cx = 32, cy = 46, sx = 20, sy = 13) => { p.ellipse(cx, cy, sx, sy, c); p.ellipse(cx - sx * 0.3, cy - sy * 0.35, sx * 0.5, sy * 0.4, shade(c, 0.22)); p.line(cx - 6, cy + 2, cx + 4, cy - 6, shade(c, -0.3)); };
  switch (itemId) {
    case 'MAT_LOG': if (ready) { trunk(p, 32, 34, 60, 9); canopy(p, 32, 24, 27, 20, P.leaf, r); } else stump(); break;
    case 'MAT_HARDWOOD': if (ready) { trunk(p, 32, 30, 60, 12, '#4a3424'); canopy(p, 32, 20, 29, 18, P.leaf_dark, r); } else stump('#4a3424'); break;
    case 'MAT_RESIN': if (ready) { trunk(p, 32, 26, 60, 10, '#7a5a3e'); canopy(p, 32, 18, 24, 15, '#5a9a4a', r); p.ellipse(34, 44, 2.5, 4, '#e0952c'); p.ellipse(29, 50, 2, 3, '#ffd27a'); } else { trunk(p, 32, 26, 60, 10, '#7a5a3e'); canopy(p, 32, 18, 24, 15, '#5a9a4a', r); p.line(30, 42, 36, 46, '#4a3424'); } break;
    case 'MAT_PALM_LEAF': case 'FOOD_COCONUT': { const sub = new Pix(64, 96); palmTree(sub, 64, 96, 1, ready && itemId === 'FOOD_COCONUT', ready ? P.palm : '#a8a050'); p.blit(scaleDown(sub, 0.66), 11, 0); if (!ready && itemId === 'MAT_PALM_LEAF') p.rect(20, 0, 26, 12, 'CLEAR'); break; }
    case 'MAT_BAMBOO': for (let k = 0; k < 4; k++) { const x = 16 + k * 9; const top = ready ? 4 + (k * 7) % 14 : 44; p.rect(x, top, 5, 60 - top, k % 2 ? '#86b84a' : '#9cc95a'); for (let y = top + 6; y < 60; y += 8) p.rect(x - 1, y, 7, 1, '#5e8a33'); if (ready) p.ellipse(x + 5, top + 3, 5, 2, P.leaf_light); } break;
    case 'MAT_STONE': if (ready) { rock(P.stone, 26, 48, 14, 9); rock(P.stone_light, 40, 50, 11, 7); rock(P.stone_dark, 33, 42, 9, 6); } else { rock(P.stone_dark, 32, 54, 6, 3); } break;
    case 'MAT_COAL': rock('#4a4b52', 32, 46, ready ? 20 : 9, ready ? 13 : 5); if (ready) for (let i = 0; i < 7; i++) p.ellipse(18 + r() * 28, 38 + r() * 14, 2.5, 1.8, '#18191d'); break;
    case 'MAT_COPPER_ORE': rock('#7a6a60', 32, 46, ready ? 20 : 9, ready ? 13 : 5); if (ready) for (let i = 0; i < 7; i++) p.ellipse(18 + r() * 28, 38 + r() * 14, 2.5, 1.8, P.copper_light); break;
    case 'MAT_IRON_ORE': rock('#6a6468', 32, 46, ready ? 21 : 9, ready ? 14 : 5); if (ready) for (let i = 0; i < 7; i++) p.ellipse(18 + r() * 28, 38 + r() * 14, 2.5, 1.8, P.rust); break;
    case 'MAT_QUARTZ': rock('#6e7a80', 32, 50, ready ? 18 : 9, ready ? 9 : 5); if (ready) { const sub = new Pix(32, 32); ICON_SHAPES.crystal(sub, { c: P.quartz }); p.blit(sub, 16, 16); } break;
    case 'MAT_CLAY': p.ellipse(32, 50, ready ? 20 : 10, ready ? 10 : 4, P.clay); if (ready) { p.ellipse(28, 46, 8, 4, P.clay_light); p.ellipse(40, 52, 5, 2, '#9a5a3a'); } break;
    case 'MAT_FIBER': for (let i = 0; i < (ready ? 16 : 6); i++) { const x = 14 + i * 2.3; p.line(x, 60, x + (r() - 0.5) * 10, ready ? 22 + r() * 16 : 50 + r() * 6, i % 2 ? '#b5c46a' : '#8fa84a'); } break;
    case 'MAT_BRANCH': if (ready) { p.line(12, 54, 52, 44, P.wood, 3); p.line(18, 58, 48, 52, '#8a6a48', 3); p.line(30, 50, 38, 40, P.wood, 2); } else p.line(26, 56, 38, 54, P.wood, 2); break;
    case 'FOOD_BERRY': canopy(p, 32, 42, 22, 16, ready ? P.leaf : '#6a8a4a', r); if (ready) for (let i = 0; i < 10; i++) p.circle(14 + r() * 36, 32 + r() * 18, 2, '#b63a6a'); break;
    case 'FOOD_BANANA': p.rect(29, 24, 6, 36, '#7a8a3a'); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.55; const ex = 32 + Math.cos(a) * 28, ey = 26 + Math.sin(a) * 18 + 12; p.poly([[32, 26], [ex, ey], [ex - Math.cos(a) * 8 + 5, ey + 7], [32 + 4, 32]], k % 2 ? P.leaf : P.leaf_light); p.line(32, 26, ex, ey, shade(P.leaf, -0.25)); } if (ready) { const sub = new Pix(32, 32); ICON_SHAPES.banana(sub, { bunch: true }); p.blit(scaleDown(sub, 0.6), 30, 30); } break;
    case 'MAT_VINE': for (let k = 0; k < 3; k++) for (let a = 0; a < (ready ? 50 : 20); a++) { p.set(18 + k * 12 + Math.sin(a / 5 + k) * 4, 62 - a, '#3e7a3a'); if (ready && a % 6 === 0) p.ellipse(20 + k * 12 + Math.sin(a / 5 + k) * 4, 62 - a, 3, 2, P.leaf_light); } break;
    default: rock(P.stone, 32, 50, 10, 6);
  }
  p.outline(P.outline); p.rimShade(0.12, -0.15);
  return p;
}

// ---------- crops (12 × 4 stages, 64×64) ----------
const CROP_LOOK = {
  CROP_ROOT: { leaf: '#5fae4c', fruit: '#c9883a', kind: 'root' }, CROP_GREENS: { leaf: '#6fc05a', kind: 'leafy' }, CROP_BEAN: { leaf: '#5aa04a', fruit: '#7fb34a', kind: 'vine' },
  CROP_PEPPER: { leaf: '#4f9a4a', fruit: '#d2483c', kind: 'bush' }, CROP_HERB: { leaf: '#4aa87a', fruit: '#e9e1c8', kind: 'bush' }, CROP_FIBER: { leaf: '#b5c46a', kind: 'grass' },
  CROP_PUMPKIN: { leaf: '#5aa04a', fruit: '#ec8f3a', kind: 'ground' }, CROP_PINEAPPLE: { leaf: '#5fae4c', fruit: '#e0a83a', kind: 'spiky' }, CROP_BANANA: { leaf: '#6fbf5a', fruit: '#e8c43c', kind: 'tree' },
  CROP_CANE: { leaf: '#a8b45a', kind: 'cane' }, CROP_SPICE: { leaf: '#8aa83a', fruit: '#c83a2a', kind: 'bush' }, CROP_SWEET_POTATO: { leaf: '#5a9a4a', fruit: '#b65a6a', kind: 'root' },
};
export function drawCrop(cropId, stage) {
  const p = new Pix(64, 64); const L = CROP_LOOK[cropId]; const r = prng(strHash(cropId) + stage);
  p.ellipse(32, 56, 16, 5, '#6a4a32'); p.ellipse(32, 55, 13, 3.5, '#7a5a3a');
  if (stage === 0) { for (let i = 0; i < 3; i++) p.set(26 + i * 6, 55, '#c9a676'); p.line(32, 55, 32, 51, '#7fc35a'); p.set(31, 50, '#7fc35a'); p.set(33, 50, '#7fc35a'); }
  else {
    const g = stage / 3; const H = 8 + g * 34;
    switch (L.kind) {
      case 'root': case 'leafy': for (let i = 0; i < 4 + stage * 2; i++) { const a = -Math.PI / 2 + (i / (4 + stage * 2) - 0.5) * 2.4; p.line(32, 54, 32 + Math.cos(a) * H * 0.5, 54 + Math.sin(a) * H * 0.7, L.leaf, 2); p.ellipse(32 + Math.cos(a) * H * 0.5, 54 + Math.sin(a) * H * 0.7, 3, 2, shade(L.leaf, 0.2)); } if (stage === 3 && L.fruit) p.ellipse(32, 54, 5, 3, L.fruit); break;
      case 'vine': p.line(28, 56, 28, 56 - H, P.wood, 1); p.line(36, 56, 36, 56 - H, P.wood, 1); for (let y = 56 - H; y < 54; y += 4) { p.ellipse(28 + (y % 8 ? 3 : -3), y, 3, 2, L.leaf); p.ellipse(36 + (y % 8 ? -3 : 3), y + 2, 3, 2, shade(L.leaf, 0.2)); } if (stage === 3) for (let i = 0; i < 5; i++) p.ellipse(26 + r() * 12, 56 - r() * H, 1.3, 4, L.fruit); break;
      case 'bush': canopy(p, 32, 54 - H * 0.5, 6 + g * 12, 4 + g * 10, L.leaf, r); if (stage === 3) for (let i = 0; i < 7; i++) p.ellipse(22 + r() * 20, 40 + r() * 12, 1.8, 2.6, L.fruit); break;
      case 'grass': for (let i = 0; i < 6 + stage * 3; i++) { const x = 22 + i * 1.8; p.line(x, 56, x + (r() - 0.5) * 8, 56 - H * (0.6 + r() * 0.4), i % 2 ? L.leaf : shade(L.leaf, -0.2)); } break;
      case 'ground': for (let i = 0; i < 3 + stage; i++) p.ellipse(20 + i * 7, 50 - (i % 2) * 4, 5 + g * 2, 4, i % 2 ? L.leaf : shade(L.leaf, 0.15)); if (stage === 3) { p.ellipse(30, 50, 9, 7, L.fruit); for (let k = -1; k <= 1; k++) p.line(30 + k * 3, 44, 30 + k * 4, 56, shade(L.fruit, -0.25)); } break;
      case 'spiky': for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.35; p.line(32, 56, 32 + Math.cos(a) * H * 0.6, 56 + Math.sin(a) * H * 0.6, L.leaf, 2); } if (stage === 3) { p.ellipse(32, 40, 6, 8, L.fruit); for (let i = 0; i < 4; i++) p.line(28, 35 + i * 3, 36, 37 + i * 3, '#9a6a2a'); } break;
      case 'tree': p.rect(30, 56 - H, 5, H, '#8a9a4a'); for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * 0.7; p.poly([[32, 56 - H], [32 + Math.cos(a) * 20 * g, 56 - H + Math.sin(a) * 12 * g + 8], [32 + Math.cos(a) * 16 * g + 3, 56 - H + Math.sin(a) * 8 * g + 12]], k % 2 ? L.leaf : shade(L.leaf, 0.15)); } if (stage === 3) { const sub = new Pix(32, 32); ICON_SHAPES.banana(sub, { bunch: true }); p.blit(scaleDown(sub, 0.5), 33, 56 - H + 4); } break;
      case 'cane': for (let k = 0; k < 2 + stage; k++) { const x = 25 + k * 5; p.rect(x, 56 - H, 3, H, k % 2 ? '#a89a5a' : '#c0b46a'); for (let y = 56 - H + 4; y < 56; y += 6) p.rect(x - 1, y, 5, 1, '#7a6a3a'); p.ellipse(x + 3, 56 - H, 4, 1.5, L.leaf); } break;
    }
  }
  p.outline(P.outline); p.rimShade(0.12, -0.12);
  return p;
}
export function drawCropOverlay(kind) {
  const p = new Pix(32, 32);
  if (kind === 'wet') { p.ellipse(16, 24, 13, 5, [70, 120, 160, 110]); p.set(10, 23, [200, 230, 255, 200]); p.set(20, 25, [200, 230, 255, 200]); }
  if (kind === 'dry') { p.ellipse(16, 24, 13, 5, [200, 160, 100, 90]); for (let i = 0; i < 4; i++) p.line(6 + i * 6, 22, 9 + i * 6, 26, [120, 80, 50, 160]); }
  if (kind === 'fertilized') { const r = prng(4); for (let i = 0; i < 10; i++) p.set(4 + r() * 24, 20 + r() * 8, ['#5a3a22', '#8ab04a'][i % 2]); p.circle(26, 8, 3, '#8ab04a'); p.line(26, 5, 26, 2, '#5a8a3a'); }
  return p;
}
export { mix };
