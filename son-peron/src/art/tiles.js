// 32×32 mantıksal karo seti (16 px çizilir, 2× büyütülür). 4 mevsim × 28 karo türü × 4 varyant.
import { Px, P, rng, mix } from './px.js';
import { T } from '../world/maps.js';

const G = {
  spring: { m: '#7fbf5a', l: '#9ed672', d: '#5fa246', t: '#4c8a3c', fl: ['#f6e36a', '#f2a6c0', '#ffffff'] },
  summer: { m: '#5fa94a', l: '#7cc25c', d: '#468a3a', t: '#3a7433', fl: ['#f0cf5a', '#e2604e', '#ffffff'] },
  autumn: { m: '#a8a04a', l: '#c2b558', d: '#857d3a', t: '#6f6831', fl: ['#d9702e', '#c5443b', '#e0a83c'] },
  winter: { m: '#e9eef2', l: '#ffffff', d: '#c7d3de', t: '#aebdcc', fl: ['#c7d3de', '#ffffff', '#aebdcc'] }
};
export const VARIANTS = 4, COLS = 16;
export const tileIndex = (kind, v) => kind * VARIANTS + v;

export function drawTile(kind, season, v) {
  const p = new Px(16, 16), g = G[season], r = rng(kind * 977 + v * 131 + season.length * 7), snow = season === 'winter';
  const grass = () => { p.rect(0, 0, 16, 16, g.m); p.speckle(0, 0, 16, 16, [g.l], 0.07, kind * 31 + v); p.speckle(0, 0, 16, 16, [g.d], 0.07, kind * 57 + v + 9); };
  const planks = (m, l, d, gap, seed) => { p.rect(0, 0, 16, 16, m); for (let y = 0; y < 16; y += 4) { p.hline(0, y + 3, 16, gap); const off = ((y / 4 + v) % 2) * 8 + 3; p.vline(off, y, 3, gap); p.hline(0, y, 16, l); } p.speckle(0, 0, 16, 16, [d], 0.05, seed); };
  const snowDust = (k) => { if (snow) p.speckle(0, 0, 16, 16, ['#ffffff', '#e9eef2'], k, kind * 3 + v); };
  switch (kind) {
    case T.VOID: p.rect(0, 0, 16, 16, '#1b1413'); break;
    case T.GRASS: grass(); break;
    case T.GRASS2: grass(); for (let i = 0; i < 4; i++) { const x = 1 + ((r() * 13) | 0), y = 3 + ((r() * 11) | 0); p.set(x, y, g.t); p.set(x + 1, y - 1, g.t); p.set(x + 2, y, g.t); p.set(x + 1, y, g.d); } break;
    case T.FLOWERS: grass(); for (let i = 0; i < 3; i++) { const x = 2 + ((r() * 12) | 0), y = 2 + ((r() * 12) | 0), c = g.fl[(r() * 3) | 0]; if (season === 'autumn' || snow) { p.set(x, y, c); p.set(x + 1, y, c); } else { p.set(x, y - 1, c); p.set(x - 1, y, c); p.set(x + 1, y, c); p.set(x, y + 1, c); p.set(x, y, P.yellow); } } break;
    case T.DIRT: p.rect(0, 0, 16, 16, '#9a7650'); p.speckle(0, 0, 16, 16, ['#86643f', '#b08a60'], 0.15, v + 5); snowDust(0.12); break;
    case T.PATH: p.rect(0, 0, 16, 16, '#c9a877'); p.speckle(0, 0, 16, 16, ['#b6935f', '#dcc08f'], 0.14, v + 11); for (let i = 0; i < 2; i++) { const x = (r() * 14) | 0, y = (r() * 14) | 0; p.rect(x, y, 2, 1, '#a08a70'); p.set(x, y + 1, '#8a7560'); } snowDust(0.1); break;
    case T.COBBLE: p.rect(0, 0, 16, 16, '#8d8578'); for (let y = 0; y < 16; y += 4) for (let x = -2; x < 16; x += 5) { const ox = x + ((y / 4) % 2) * 2 + (v % 2); p.box(ox, y, 4, 3, r() < 0.5 ? '#aaa294' : '#9c9486', '#bdb5a6', '#7b7469'); } snowDust(0.08); break;
    case T.PLATFORM: p.rect(0, 0, 16, 16, '#b3aa9a'); p.hline(0, 15, 16, '#8f877a'); p.vline(15, 0, 16, '#8f877a'); p.hline(0, 0, 16, '#c7bfae'); p.speckle(1, 1, 14, 14, ['#a59d8d', '#c0b8a8'], 0.08, v + 3); snowDust(0.05); break;
    case T.PLATFORM_EDGE: p.rect(0, 0, 16, 16, '#b3aa9a'); p.hline(0, 0, 16, '#c7bfae'); p.rect(0, 9, 16, 3, P.yellow); p.hline(0, 12, 16, '#b5962f'); p.rect(0, 13, 16, 3, '#6b655d'); p.speckle(0, 1, 16, 8, ['#a59d8d'], 0.08, v); break;
    case T.BALLAST: p.rect(0, 0, 16, 16, '#7d756c'); p.speckle(0, 0, 16, 16, ['#665f57', '#978f84', '#5a534c'], 0.4, v + 21); snowDust(0.15); break;
    case T.RAIL: p.rect(0, 0, 16, 16, '#7d756c'); p.speckle(0, 0, 16, 16, ['#665f57', '#978f84'], 0.35, v + 23); for (let x = 1; x < 16; x += 5) { p.rect(x, 0, 3, 16, '#6a4a32'); p.vline(x, 0, 16, '#84603f'); } p.rect(0, 6, 16, 3, '#5d6870'); p.hline(0, 6, 16, '#c8d1d6'); p.hline(0, 8, 16, '#3c444b'); snowDust(0.1); break;
    case T.WATER: case T.WATER2: p.rect(0, 0, 16, 16, snow ? '#7fa8c9' : '#4f8fc0'); p.speckle(0, 0, 16, 16, [snow ? '#6b95b8' : '#3f7db0'], 0.2, v + 31); for (let i = 0; i < (kind === T.WATER2 ? 3 : 1); i++) { const x = 1 + ((r() * 10) | 0), y = 2 + ((r() * 12) | 0); p.hline(x, y, 4, '#a9d4ec'); p.hline(x + 1, y + 1, 2, '#d5ecf7'); } break;
    case T.SAND: p.rect(0, 0, 16, 16, '#e3d19a'); p.speckle(0, 0, 16, 16, ['#cdb97f', '#f0e2b4'], 0.15, v + 41); snowDust(0.2); break;
    case T.FLOOR_OLD: planks('#9a7c5c', '#ab8d6b', '#7f6449', '#6b523b', v + 51); p.speckle(0, 0, 16, 16, ['#86694b'], 0.04, v + 52); break;
    case T.FLOOR_BED: planks('#b88a58', '#cc9d68', '#9a7144', '#845e38', v + 55); break;
    case T.FLOOR_NEW: planks('#c79a5e', '#dcb074', '#a87d47', '#8e6638', v + 57); break;
    case T.FLOOR_KITCHEN: for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) p.box(x * 8, y * 8, 8, 8, (x + y) % 2 ? '#d9c8a4' : '#b9805c', (x + y) % 2 ? '#eadbb8' : '#cb9370', (x + y) % 2 ? '#bfae8b' : '#9b6747'); p.speckle(0, 0, 16, 16, ['#a89474'], 0.03, v + 61); break;
    case T.FLOOR_STORAGE: p.rect(0, 0, 16, 16, '#857c70'); for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x += 8) p.box(x + ((y / 8) % 2 ? 0 : 0), y, 8, 8, '#8f867a', '#a1988b', '#746c61'); p.speckle(0, 0, 16, 16, ['#7a7166'], 0.06, v + 63); break;
    case T.WALL_TOP: p.rect(0, 0, 16, 16, '#3b2a24'); p.speckle(0, 0, 16, 16, ['#46332b'], 0.1, v + 71); break;
    case T.WALL_FRONT: p.rect(0, 0, 16, 16, '#3b2a24'); p.rect(0, 0, 16, 5, '#6b4a36'); p.hline(0, 0, 16, '#84603f'); p.hline(0, 5, 16, '#2a1d1a'); break;
    case T.WALL_FACE: p.rect(0, 0, 16, 9, '#e6d3ad'); p.hline(0, 0, 16, '#3b2a24'); p.hline(0, 1, 16, '#c9b488'); p.speckle(0, 2, 16, 7, ['#d8c49b', '#efe0be'], 0.07, v + 73); p.rect(0, 9, 16, 7, '#8e6038'); p.hline(0, 9, 16, '#b07e4c'); p.hline(0, 15, 16, '#5c3d24'); for (let x = 3 + (v % 2) * 2; x < 16; x += 5) p.vline(x, 10, 5, '#734b2b'); break;
    case T.DOOR: planks('#9a7c5c', '#ab8d6b', '#7f6449', '#6b523b', 3); p.box(2, 3, 12, 10, '#a3493c', '#c0634f', '#7c3329'); p.frame(4, 5, 8, 6, '#d9a066'); break;
    case T.WOODF: planks('#c58f52', '#dba568', '#a5733d', '#7d5630', v + 81); p.frame(0, 0, 16, 16, '#8e6638'); break;
    case T.STONEF: for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) p.box(x * 8, y * 8, 8, 8, '#a8a399', '#c2bdb2', '#827d74'); break;
    case T.STONEPATH: grass(); p.blob(5, 5, 4, 3, '#a8a399', '#c2bdb2', '#827d74'); p.blob(11, 11, 4, 3, '#9d988e', '#b9b4a9', '#7a756c'); p.blob(12, 4, 2, 2, '#a8a399', '#c2bdb2', '#827d74'); p.blob(4, 12, 2, 2, '#9d988e', '#b9b4a9', '#7a756c'); break;
    case T.FIELD: p.rect(0, 0, 16, 16, snow ? '#d9dfe3' : '#8a6a45'); for (let y = 1; y < 16; y += 4) { p.hline(0, y, 16, snow ? '#c2ccd4' : '#6f5334'); if (!snow) for (let x = (v * 2) % 4; x < 16; x += 4) { p.set(x, y - 1, season === 'autumn' ? '#d9a03c' : g.d); p.set(x + 1, y - 1, season === 'autumn' ? '#c58a2e' : g.l); } } break;
    case T.BRIDGE: p.rect(0, 0, 16, 16, '#a67c4f'); for (let y = 0; y < 16; y += 4) { p.hline(0, y + 3, 16, '#6f4f2f'); p.hline(0, y, 16, '#c0935f'); } p.vline(0, 0, 16, '#6f4f2f'); p.vline(15, 0, 16, '#6f4f2f'); break;
    default: p.rect(0, 0, 16, 16, '#ff00ff');
  }
  void mix;
  return p;
}
export function buildTileset(season) {
  const rows = Math.ceil((T.COUNT * VARIANTS) / COLS); const sheet = new Px(COLS * 16, rows * 16);
  for (let k = 0; k < T.COUNT; k++) for (let v = 0; v < VARIANTS; v++) { const i = tileIndex(k, v); sheet.blit(drawTile(k, season, v), (i % COLS) * 16, ((i / COLS) | 0) * 16); }
  return sheet.scaled(2);
}
