// Tileset üreticisi: zemin, geçişler, geçilmez kütleler, dekor ve çok tile'lı damgalar.
// Her tile 16×16 sanat pikseli çizilir, ×2 ölçekle 32×32 dünya tile'ı olur.
import { PB, hash, shade, mix, OUTLINE } from './pixel.js';
import { TILE_DEFS, STAMPS } from '../world/tileRegistry.js';

const S = 16;

const TERRAIN = {
  grass: { base: '#5c9a3e', dark: '#4b8632', light: '#74b04c', detail: '#3e722a' },
  forest_floor: { base: '#3f6c2e', dark: '#335c26', light: '#4f7e38', detail: '#6a5a30' },
  dirt: { base: '#9a7448', dark: '#83613b', light: '#b08a5a', detail: '#6e5434' },
  cobble: { base: '#8c867a', dark: '#5e5a52', light: '#aaa498', detail: '#77716a' },
  swamp: { base: '#4c5c34', dark: '#3e4c2a', light: '#5c6c3e', detail: '#36402a' },
  mud: { base: '#5c4832', dark: '#4a3a28', light: '#6c573c', detail: '#3c3022' },
  water: { base: '#2f6c9c', dark: '#25587f', light: '#4c8cc2', detail: '#8cc4e8' },
  swamp_water: { base: '#2c4838', dark: '#22392c', light: '#3c624c', detail: '#5a7a3a' },
  cave: { base: '#544a44', dark: '#463d38', light: '#645850', detail: '#332c28' },
  crystal_floor: { base: '#3c3e56', dark: '#303248', light: '#4c4e68', detail: '#6ad0ff' },
  dungeon: { base: '#4c4852', dark: '#38343e', light: '#5c5864', detail: '#2c2832' },
  plank: { base: '#8a6238', dark: '#5e4024', light: '#a07446', detail: '#4a3220' },
  sand: { base: '#c8b07e', dark: '#b09868', light: '#dcc698', detail: '#a08858' },
  // V2 — Kül Yaylaları
  ash: { base: '#6e6662', dark: '#5c5450', light: '#847c76', detail: '#4a4240' },
  scorched: { base: '#463632', dark: '#382a26', light: '#5a4640', detail: '#ff6a2a' },
  basalt: { base: '#3c3a40', dark: '#2a282e', light: '#55525a', detail: '#1e1c22' },
  lava: { base: '#c8401a', dark: '#8a2410', light: '#ff8a2a', detail: '#ffe070' },
  // V2 — Ayaz Geçidi / Buz Mabedi
  snow: { base: '#dce6ee', dark: '#c4d0dc', light: '#f4f8fc', detail: '#a8b8c8' },
  ice: { base: '#9ccbe4', dark: '#84b4d0', light: '#c8e8f8', detail: '#f0faff' },
  frost_stone: { base: '#8a96a6', dark: '#6a7686', light: '#aab6c4', detail: '#e0eef8' },
  frozen_water: { base: '#2c5c80', dark: '#22486a', light: '#4a80a8', detail: '#c8e8f8' },
  temple_floor: { base: '#5a6a80', dark: '#465468', light: '#6e7e94', detail: '#34405a' },
  ice_floor: { base: '#7aa8c8', dark: '#6290b0', light: '#a0c8e0', detail: '#e0f6ff' },
  // V3 — Ölü Krallık / Kara Taht / Karanlık Mahzen
  dead_grass: { base: '#545a48', dark: '#454a3a', light: '#666c56', detail: '#7a7462' },
  grave_soil: { base: '#4a4038', dark: '#3c342e', light: '#5a4e44', detail: '#8a8070' },
  ruin_cobble: { base: '#6a6670', dark: '#46424c', light: '#827e88', detail: '#56525c' },
  void_pool: { base: '#2a1a3a', dark: '#1c1028', light: '#4a2e66', detail: '#a070e0' },
  obsidian: { base: '#2a2630', dark: '#1e1a24', light: '#3c3646', detail: '#7a5aa0' },
  royal_floor: { base: '#4a3e52', dark: '#382e40', light: '#5c4e66', detail: '#c8a050' },
  crypt_floor: { base: '#3e4040', dark: '#2e3030', light: '#4e5250', detail: '#262828' },
  // V4 — Gökyarık Ovası / Yıldız Mezarı / Gökyarık Mabedi
  storm_steppe: { base: '#6a6a52', dark: '#56563f', light: '#828266', detail: '#9a9a78' },
  cracked_road: { base: '#5a5650', dark: '#3e3a36', light: '#727068', detail: '#ffe070' },
  storm_rock: { base: '#4e5464', dark: '#3a404e', light: '#646a7c', detail: '#9ad0ff' },
  star_dust: { base: '#2e2a44', dark: '#221e36', light: '#3e3858', detail: '#ffe8a0' },
  astral_stone: { base: '#5a5478', dark: '#443e5e', light: '#706a92', detail: '#b0a0ff' },
  sky_void: { base: '#141a3a', dark: '#0c1028', light: '#28306a', detail: '#ffffff' },
  sanctum_floor: { base: '#3e3a5a', dark: '#2e2a46', light: '#4e4a6e', detail: '#ffe8a0' },
};

function drawTerrain(pb, t, v, ox = 0, oy = 0) {
  const P = TERRAIN[t];
  const seed = t.length * 31 + v * 7;
  pb.rect(ox, oy, S, S, P.base);
  const sp = (dens, col, s2) => {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (hash(x, y, seed + s2) < dens) pb.set(ox + x, oy + y, col);
  };
  switch (t) {
    case 'grass':
    case 'forest_floor':
      sp(0.18, P.dark, 1); sp(0.08, P.light, 2);
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(hash(i, v, seed) * 15), y = Math.floor(hash(v, i, seed) * 14) + 1;
        pb.set(ox + x, oy + y, P.detail); pb.set(ox + x, oy + y - 1, P.dark);
      }
      if (t === 'forest_floor' && v > 1) sp(0.03, '#7a6436', 5);
      break;
    case 'dirt': case 'sand':
      sp(0.2, P.dark, 1); sp(0.1, P.light, 2); sp(0.03, P.detail, 3);
      break;
    case 'mud':
      sp(0.22, P.dark, 1); sp(0.08, P.light, 2);
      if (v % 2) pb.ellipse(ox + 8 + v, oy + 9, 3, 1.5, P.detail);
      break;
    case 'cobble': {
      pb.rect(ox, oy, S, S, P.dark);
      const stones = [[0, 0, 7, 5], [8, 0, 8, 4], [0, 6, 5, 5], [6, 5, 6, 6], [13, 5, 3, 5], [0, 12, 8, 4], [9, 12, 7, 4], [12, 11, 4, 1]];
      stones.forEach(([x, y, w, h], i) => {
        const c = [P.base, P.light, P.detail, shade(P.base, 0.08)][Math.floor(hash(i, v, seed) * 4)];
        pb.rect(ox + x, oy + y, w - 1, h - 1, c);
        pb.hline(ox + x, ox + x + w - 2, oy + y, shade(c, 0.15));
      });
      break;
    }
    case 'water': case 'swamp_water':
      sp(0.12, P.dark, 1);
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(hash(i, v, seed) * 11), y = Math.floor(hash(v, i, seed + 1) * 14);
        pb.hline(ox + x, ox + x + 3, oy + y, P.light);
        if (t === 'water' && i === 0) pb.set(ox + x + 1, oy + y, P.detail);
      }
      if (t === 'swamp_water') sp(0.04, P.detail, 4);
      break;
    case 'cave':
      sp(0.22, P.dark, 1); sp(0.1, P.light, 2);
      if (v === 3) pb.line(ox + 3, oy + 4, ox + 9, oy + 10, P.detail);
      break;
    case 'crystal_floor':
      sp(0.22, P.dark, 1); sp(0.08, P.light, 2);
      if (v > 0) { pb.set(ox + 4 + v * 2, oy + 6 + v, '#6ad0ff'); pb.set(ox + 11 - v, oy + 12 - v, '#b48cff'); }
      break;
    case 'dungeon':
      pb.rect(ox, oy, S, S, P.base);
      sp(0.15, P.dark, 1); sp(0.06, P.light, 2);
      pb.hline(ox, ox + 15, oy + 15, P.detail); pb.vline(ox + 15, oy, oy + 15, P.detail);
      pb.hline(ox, ox + 14, oy, shade(P.base, 0.1)); pb.vline(ox, oy, oy + 14, shade(P.base, 0.06));
      if (v === 2) pb.line(ox + 4, oy + 3, ox + 8, oy + 8, P.detail);
      break;
    case 'plank':
      for (let r = 0; r < 4; r++) {
        pb.rect(ox, oy + r * 4, S, 3, r % 2 ? P.base : P.light);
        pb.hline(ox, ox + 15, oy + r * 4 + 3, P.dark);
        pb.set(ox + ((r * 5 + v * 3) % 14) + 1, oy + r * 4 + 1, P.detail);
      }
      break;
    // ---------------- V2
    case 'ash':
      sp(0.22, P.dark, 1); sp(0.1, P.light, 2); sp(0.03, P.detail, 3);
      if (v === 2) pb.set(ox + 5, oy + 9, '#ff7a2a');
      break;
    case 'scorched':
      sp(0.25, P.dark, 1); sp(0.08, P.light, 2);
      if (v > 0) { pb.line(ox + 2 + v, oy + 4, ox + 7, oy + 9 + (v % 2), '#2a1c18'); pb.line(ox + 7, oy + 9, ox + 12, oy + 7 + v, '#2a1c18'); }
      if (v >= 2) { pb.set(ox + 5, oy + 7, P.detail); pb.set(ox + 9, oy + 9, '#ffb040'); }
      break;
    case 'basalt': {
      pb.rect(ox, oy, S, S, P.dark);
      const cells = [[0, 0, 6, 6], [6, 0, 6, 5], [12, 0, 4, 7], [0, 6, 5, 5], [5, 5, 7, 6], [12, 7, 4, 5], [0, 11, 8, 5], [8, 11, 8, 5]];
      cells.forEach(([x, y, w, h], i) => {
        const c = [P.base, P.light, shade(P.base, -0.06), shade(P.base, 0.06)][Math.floor(hash(i, v, seed) * 4)];
        pb.rect(ox + x, oy + y, w - 1, h - 1, c);
        pb.hline(ox + x, ox + x + w - 2, oy + y, shade(c, 0.18));
      });
      break;
    }
    case 'lava':
      sp(0.3, P.dark, 1); sp(0.12, P.light, 2);
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(hash(i, v, seed) * 12), y = Math.floor(hash(v, i, seed + 1) * 14);
        pb.hline(ox + x, ox + x + 3, oy + y, P.light); pb.set(ox + x + 1, oy + y, P.detail);
      }
      break;
    case 'snow':
      sp(0.16, P.dark, 1); sp(0.1, P.light, 2);
      if (v === 3) { pb.set(ox + 4, oy + 6, P.detail); pb.set(ox + 11, oy + 11, P.detail); }
      break;
    case 'ice':
      sp(0.12, P.dark, 1);
      pb.line(ox + 2, oy + 3 + v, ox + 6 + v, oy + 1, P.light);
      pb.line(ox + 9, oy + 13 - v, ox + 14, oy + 9, P.light);
      if (v % 2) pb.set(ox + 4, oy + 3, P.detail);
      if (v === 2) pb.line(ox + 3, oy + 10, ox + 8, oy + 12, P.dark);
      break;
    case 'frost_stone': {
      pb.rect(ox, oy, S, S, P.dark);
      const stones = [[0, 0, 8, 5], [8, 0, 8, 6], [0, 5, 6, 6], [6, 6, 6, 5], [12, 6, 4, 5], [0, 11, 7, 5], [7, 11, 9, 5]];
      stones.forEach(([x, y, w, h], i) => {
        const c = [P.base, P.light, shade(P.base, -0.05), shade(P.base, 0.08)][Math.floor(hash(i, v, seed) * 4)];
        pb.rect(ox + x, oy + y, w - 1, h - 1, c);
        pb.hline(ox + x, ox + x + w - 2, oy + y, P.detail);
      });
      break;
    }
    case 'frozen_water':
      sp(0.12, P.dark, 1);
      for (let i = 0; i < 2; i++) {
        const x = Math.floor(hash(i, v, seed) * 10), y = Math.floor(hash(v, i, seed + 1) * 12);
        pb.ellipse(ox + x + 3, oy + y + 2, 2.5, 1.2, P.light); pb.set(ox + x + 2, oy + y + 2, P.detail);
      }
      break;
    case 'temple_floor':
      pb.rect(ox, oy, S, S, P.base);
      sp(0.12, P.dark, 1); sp(0.05, P.light, 2);
      pb.hline(ox, ox + 15, oy + 15, P.detail); pb.vline(ox + 15, oy, oy + 15, P.detail);
      pb.hline(ox, ox + 14, oy, shade(P.base, 0.12)); pb.vline(ox, oy, oy + 14, shade(P.base, 0.08));
      if (v === 1) { pb.set(ox + 7, oy + 7, '#9fe8ff'); pb.set(ox + 8, oy + 8, '#9fe8ff'); }
      if (v === 3) pb.line(ox + 3, oy + 11, ox + 9, oy + 6, P.dark);
      break;
    case 'ice_floor':
      pb.rect(ox, oy, S, S, P.base);
      sp(0.1, P.dark, 1);
      pb.line(ox + 1, oy + 4 + v, ox + 7, oy + 1, P.light); pb.line(ox + 8, oy + 14, ox + 14, oy + 10 - v, P.light);
      pb.hline(ox, ox + 15, oy + 15, P.dark); pb.vline(ox + 15, oy, oy + 15, P.dark);
      if (v === 2) pb.set(ox + 10, oy + 5, P.detail);
      break;
    // ---------------- V3
    case 'dead_grass':
      sp(0.2, P.dark, 1); sp(0.07, P.light, 2);
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(hash(i, v, seed) * 15), y = Math.floor(hash(v, i, seed) * 14) + 1;
        pb.set(ox + x, oy + y, P.detail); pb.set(ox + x, oy + y - 1, P.dark);
      }
      if (v === 3) pb.set(ox + 6, oy + 10, '#8a8478');
      break;
    case 'grave_soil':
      sp(0.24, P.dark, 1); sp(0.08, P.light, 2);
      if (v >= 2) { pb.set(ox + 4 + v, oy + 6, P.detail); pb.set(ox + 5 + v, oy + 6, P.detail); }
      if (v === 1) pb.line(ox + 3, oy + 12, ox + 7, oy + 10, P.dark);
      break;
    case 'ruin_cobble': {
      pb.rect(ox, oy, S, S, P.dark);
      const stones = [[0, 0, 6, 5], [6, 0, 6, 4], [12, 0, 4, 6], [0, 5, 5, 6], [5, 4, 7, 6], [12, 6, 4, 5], [0, 11, 7, 5], [7, 10, 9, 6]];
      stones.forEach(([x, y, w, h], i) => {
        if (hash(i, v, seed + 4) < 0.12) return;   // eksik taş
        const c = [P.base, P.light, P.detail, shade(P.base, 0.06)][Math.floor(hash(i, v, seed) * 4)];
        pb.rect(ox + x, oy + y, w - 1, h - 1, c);
        pb.hline(ox + x, ox + x + w - 2, oy + y, shade(c, 0.14));
      });
      if (v === 2) pb.line(ox + 2, oy + 3, ox + 9, oy + 12, '#2e2a32');
      if (v === 3) pb.set(ox + 7, oy + 8, '#5a6a42');
      break;
    }
    case 'void_pool':
      sp(0.14, P.dark, 1);
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(hash(i, v, seed) * 11), y = Math.floor(hash(v, i, seed + 1) * 14);
        pb.hline(ox + x, ox + x + 3, oy + y, P.light);
        if (i === 0) pb.set(ox + x + 1, oy + y, P.detail);
      }
      break;
    case 'obsidian': {
      pb.rect(ox, oy, S, S, P.base);
      sp(0.16, P.dark, 1); sp(0.06, P.light, 2);
      pb.line(ox + 1 + v, oy + 2, ox + 6 + v, oy + 7, P.light);
      if (v % 2) pb.line(ox + 9, oy + 13, ox + 14, oy + 9, P.dark);
      if (v === 3) pb.set(ox + 11, oy + 4, P.detail);
      break;
    }
    case 'royal_floor':
      pb.rect(ox, oy, S, S, P.base);
      sp(0.1, P.dark, 1);
      pb.hline(ox, ox + 15, oy + 15, P.dark); pb.vline(ox + 15, oy, oy + 15, P.dark);
      pb.hline(ox, ox + 14, oy, P.light); pb.vline(ox, oy, oy + 14, shade(P.base, 0.08));
      pb.set(ox + 7, oy + 7, P.detail); pb.set(ox + 8, oy + 8, shade(P.detail, -0.3));
      if (v === 2) pb.line(ox + 3, oy + 11, ox + 8, oy + 6, P.dark);
      if (v === 3) { pb.set(ox + 3, oy + 3, P.detail); pb.set(ox + 12, oy + 12, P.detail); }
      break;
    case 'crypt_floor':
      pb.rect(ox, oy, S, S, P.base);
      sp(0.16, P.dark, 1); sp(0.06, P.light, 2);
      pb.hline(ox, ox + 15, oy + 15, P.detail); pb.vline(ox + 15, oy, oy + 15, P.detail); pb.hline(ox, ox + 15, oy + 7, P.detail);
      pb.vline(ox + 7 + (v % 2) * 2, oy, oy + 6, P.detail);
      if (v === 2) pb.set(ox + 4, oy + 11, '#4a6a3a');
      break;
    // ---------------- V4
    case 'storm_steppe':
      sp(0.2, P.dark, 1); sp(0.07, P.light, 2);
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(hash(i, v, seed) * 15), y = Math.floor(hash(v, i, seed) * 14) + 1;
        pb.set(ox + x, oy + y, P.detail); pb.set(ox + x + 1, oy + y - 1, P.detail);
      }
      if (v === 3) pb.line(ox + 3, oy + 12, ox + 8, oy + 10, P.dark);
      break;
    case 'cracked_road': {
      pb.rect(ox, oy, S, S, P.base);
      sp(0.14, P.dark, 1); sp(0.05, P.light, 2);
      pb.line(ox + 1, oy + 6 + (v % 2), ox + 7, oy + 9, P.dark); pb.line(ox + 7, oy + 9, ox + 14, oy + 5 + v, P.dark);
      if (v >= 2) pb.line(ox + 7, oy + 9, ox + 9, oy + 15, P.dark);
      if (v === 3) pb.set(ox + 8, oy + 9, P.detail);
      break;
    }
    case 'storm_rock':
      pb.rect(ox, oy, S, S, P.base);
      sp(0.18, P.dark, 1); sp(0.07, P.light, 2);
      pb.line(ox + 2 + v, oy + 2, ox + 6 + v, oy + 7, P.light);
      if (v === 1) pb.set(ox + 11, oy + 11, P.detail);
      break;
    case 'star_dust':
      sp(0.22, P.dark, 1); sp(0.08, P.light, 2);
      for (let i = 0; i < 2 + (v % 2); i++) pb.set(ox + Math.floor(hash(i, v, seed + 3) * 15), oy + Math.floor(hash(v, i, seed + 5) * 15), P.detail);
      break;
    case 'astral_stone':
      pb.rect(ox, oy, S, S, P.base);
      sp(0.1, P.dark, 1);
      pb.hline(ox, ox + 15, oy + 15, P.dark); pb.vline(ox + 15, oy, oy + 15, P.dark);
      pb.hline(ox, ox + 14, oy, P.light);
      if (v === 2) { pb.set(ox + 7, oy + 7, P.detail); pb.set(ox + 8, oy + 7, P.detail); }
      if (v === 3) pb.line(ox + 3, oy + 11, ox + 9, oy + 5, P.dark);
      break;
    case 'sky_void':
      sp(0.18, P.dark, 1);
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(hash(i, v, seed) * 15), y = Math.floor(hash(v, i, seed + 1) * 15);
        pb.set(ox + x, oy + y, i === 0 ? P.detail : P.light);
      }
      if (v === 2) pb.hline(ox + 3, ox + 7, oy + 10, P.light);
      break;
    case 'sanctum_floor':
      pb.rect(ox, oy, S, S, P.base);
      sp(0.12, P.dark, 1);
      pb.hline(ox, ox + 15, oy + 15, P.dark); pb.vline(ox + 15, oy, oy + 15, P.dark); pb.hline(ox, ox + 15, oy + 7, P.dark);
      pb.vline(ox + 7 + (v % 2) * 2, oy, oy + 6, P.dark);
      if (v === 2) { pb.set(ox + 4, oy + 11, P.detail); }
      if (v === 3) pb.set(ox + 11, oy + 3, P.detail);
      break;
    default:
      sp(0.2, P.dark, 1);
  }
}

// Geçiş: taban terrain üzerinde yuvarlatılmış üst terrain bölgesi
function drawTransition(pb, over, base, mask) {
  drawTerrain(pb, base, 0);
  const tmp = new PB(S, S);
  drawTerrain(tmp, over, 1);
  const N = mask & 1, E = mask & 2, Sd = mask & 4, W = mask & 8;
  const inside = new Uint8Array(S * S);
  const ph = over.length * 1.3 + base.length * 0.7;
  const j = (a, side) => 3 + Math.round((Math.sin(a * 0.8 + side * 2.1 + ph) + Math.sin(a * 0.37 + side + ph * 2)) * 0.7);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let ok = true;
    if (!N && y < j(x, 0)) ok = false;
    if (!Sd && y > S - 1 - j(x, 1)) ok = false;
    if (!W && x < j(y, 2)) ok = false;
    if (!E && x > S - 1 - j(y, 3)) ok = false;
    const R = 5, k = 7;
    if (ok && !N && !W && x < k && y < k && Math.hypot(k - x - 0.5, k - y - 0.5) > R + 1) ok = false;
    if (ok && !N && !E && x > S - 1 - k && y < k && Math.hypot(x + 0.5 - (S - k), k - y - 0.5) > R + 1) ok = false;
    if (ok && !Sd && !W && x < k && y > S - 1 - k && Math.hypot(k - x - 0.5, y + 0.5 - (S - k)) > R + 1) ok = false;
    if (ok && !Sd && !E && x > S - 1 - k && y > S - 1 - k && Math.hypot(x + 0.5 - (S - k), y + 0.5 - (S - k)) > R + 1) ok = false;
    inside[y * S + x] = ok ? 1 : 0;
  }
  const P = TERRAIN[over], B = TERRAIN[base];
  const isWater = over === 'water' || over === 'swamp_water' || over === 'lava' || over === 'frozen_water' || over === 'void_pool' || over === 'sky_void';
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x;
    if (inside[i]) {
      pb.d[i] = tmp.d[i];
      const edge = (x > 0 && !inside[i - 1]) || (x < S - 1 && !inside[i + 1]) || (y > 0 && !inside[i - S]) || (y < S - 1 && !inside[i + S]);
      if (edge) pb.set(x, y, isWater ? P.light : shade(P.base, -0.12));
    } else {
      const near = (x > 0 && inside[i - 1]) || (x < S - 1 && inside[i + 1]) || (y > 0 && inside[i - S]) || (y < S - 1 && inside[i + S]);
      if (near) pb.set(x, y, isWater ? shade(B.base, -0.25) : shade(B.base, -0.1));
    }
  }
}

// ------------------------------------------------------------------ kütleler
const MASS = {
  forest_mass: { deep: '#18321a', base: '#24481f', mid: '#2f5c27', hi: '#43803a', trunk: '#5a3e24', ground: '#1e3018' },
  hedge_mass: { deep: '#1e3a1c', base: '#2c5a26', mid: '#3a702e', hi: '#56924a', trunk: '#5a3e24', ground: '#2a4020' },
  rock_mass: { deep: '#151216', base: '#221e22', mid: '#2e292c', hi: '#8a7e78', face: '#6e625a', faceDark: '#4e443e', ground: '#2a2420' },
  swamp_mass: { deep: '#141c14', base: '#20291c', mid: '#2e3a26', hi: '#4a5a36', trunk: '#3a3024', ground: '#1a2216' },
  dungeon_mass: { deep: '#16131a', base: '#221e28', mid: '#2e2834', hi: '#6a6274', face: '#4a4252', faceDark: '#34303c', ground: '#1e1a22' },
  // V2: bazalt yamaçlar (kor parıltılı), karlı çam ormanı, buz tapınağı duvarı
  ash_mass: { deep: '#141012', base: '#221c1e', mid: '#2e2628', hi: '#6a5a56', face: '#4e4440', faceDark: '#342c2a', ground: '#241e1c', glow: '#ff6a2a', style: 'rock' },
  snow_mass: { deep: '#1a2a2e', base: '#2a4048', mid: '#3a5660', hi: '#e8f2f8', trunk: '#4a3a2e', ground: '#c4d0dc', snow: true },
  ice_mass: { deep: '#141c28', base: '#22304a', mid: '#2e405e', hi: '#a8d8f0', face: '#5a7a9a', faceDark: '#3e5878', ground: '#1e2838', style: 'brick', glow: '#9fe8ff' },
  // V3: ölü ağaç ormanı (gri-mor, yapraksız), obsidyen kale duvarı, mahzen tuğlası
  dead_mass: { deep: '#18161c', base: '#2a2630', mid: '#3a3442', hi: '#5c5468', trunk: '#3a3230', ground: '#3c3a32', dead: true },
  obsidian_mass: { deep: '#0e0c12', base: '#1a1620', mid: '#26202e', hi: '#6a5a82', face: '#34303e', faceDark: '#221e2a', ground: '#1a1820', style: 'brick', glow: '#a070e0' },
  crypt_mass: { deep: '#121414', base: '#1e2222', mid: '#2a2e2e', hi: '#5a625e', face: '#3e4442', faceDark: '#2a302e', ground: '#1e2020', style: 'brick', glow: '#7ae0a0' },
  // V4: fırtına kayalıkları (şimşek damarlı), yıldız taşı yamaçları, mabet duvarı
  storm_mass: { deep: '#14161e', base: '#222632', mid: '#2e3442', hi: '#7a8098', face: '#4a5064', faceDark: '#343a4a', ground: '#2a2c26', style: 'rock', glow: '#ffe070' },
  star_mass: { deep: '#0e0c1a', base: '#1a1830', mid: '#262242', hi: '#6a6098', face: '#3a3460', faceDark: '#2a2448', ground: '#1e1a30', style: 'rock', glow: '#ffe8a0' },
  sanctum_mass: { deep: '#100e1c', base: '#1c1a30', mid: '#282640', hi: '#7a72a8', face: '#3e3a62', faceDark: '#2c284a', ground: '#1c1a2e', style: 'brick', glow: '#b0a0ff' },
};

function canopy(pb, P, v, h = S) {
  pb.rect(0, 0, S, h, P.base);
  if (P.dead) {
    // yapraksız ölü dallar: sık, birbirine dolanmış çizgiler
    for (let i = 0; i < 9; i++) {
      const x0 = hash(i, v, 5) * 16, y0 = hash(v, i, 6) * h, a = hash(i, v, 7) * Math.PI * 2, l = 3 + hash(v, i, 8) * 5;
      pb.line(x0, y0, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l, i % 3 ? P.mid : P.hi);
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < S; x++) if (hash(x, y, v + 40) < 0.1) pb.set(x, y, P.deep);
    return;
  }
  for (let i = 0; i < 7; i++) {
    const cx = hash(i, v, 5) * 16, cy = hash(v, i, 6) * h, r = 2.5 + hash(i, i, v) * 3;
    pb.disc(cx, cy, r, P.mid);
    pb.disc(cx - 1, cy - 1, r * 0.55, P.hi);
    pb.disc(cx - 0.5, cy - 0.5, r * 0.3, shade(P.hi, 0.15));
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < S; x++) if (hash(x, y, v + 40) < 0.07) pb.set(x, y, P.deep);
}

function drawMass(pb, mass, part, v) {
  const P = MASS[mass];
  const rocky = mass === 'rock_mass' || mass === 'dungeon_mass' || !!P.style;
  const brick = mass === 'dungeon_mass' || P.style === 'brick';
  if (!rocky) {
    if (part === 'fill') {
      canopy(pb, P, v);
      // karlı çam tepeleri
      if (P.snow) for (let i = 0; i < 6; i++) { const cx = hash(i, v, 15) * 16, cy = hash(v, i, 16) * 16; pb.hline(cx - 2, cx + 1, cy, P.hi); pb.set(cx - 1, cy - 1, '#ffffff'); }
      return;
    }
    pb.rect(0, 0, S, S, P.ground);
    canopy(pb, P, v + 10, 9);
    for (let x = 0; x < S; x++) { const e = 8 + Math.floor(hash(x, v, 3) * 3); for (let y = 9; y < e; y++) pb.set(x, y, P.base); pb.set(x, e, P.deep); }
    const tx = 3 + v * 6;
    pb.rect(tx, 10, 3, 6, P.trunk); pb.vline(tx, 10, 15, shade(P.trunk, -0.3)); pb.vline(tx + 2, 11, 15, shade(P.trunk, 0.2));
    pb.rect(tx + 6, 11, 2, 5, shade(P.trunk, -0.15));
    pb.hline(0, 15, 15, shade(P.ground, -0.3));
    return;
  }
  if (part === 'fill') {
    pb.rect(0, 0, S, S, P.base);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const h = hash(x, y, v + 50);
      if (h < 0.18) pb.set(x, y, P.mid);
      else if (h < 0.24) pb.set(x, y, P.deep);
    }
    if (brick) { pb.hline(0, 15, 7, P.deep); pb.vline(v * 5 + 2, 0, 6, P.deep); pb.vline(v * 4 + 9, 8, 15, P.deep); }
    else { pb.line(2 + v, 3, 7 + v, 8, P.deep); pb.line(10, 10 - v, 14, 13, P.deep); }
    if (P.glow && v === 1) { pb.set(6, 6, P.glow); pb.set(7, 7, shade(P.glow, -0.3)); }
    return;
  }
  // yüz (güneye bakan duvar)
  pb.rect(0, 0, S, S, P.face);
  pb.rect(0, 0, S, 3, P.base);
  pb.hline(0, 15, 3, P.hi);
  if (brick) {
    for (let r = 0; r < 3; r++) {
      const y = 4 + r * 4;
      pb.hline(0, 15, y + 3, P.faceDark);
      for (let x = (r % 2) * 4 + v * 2; x < S; x += 8) pb.vline(x, y, y + 2, P.faceDark);
    }
  } else {
    for (let y = 4; y < S; y++) for (let x = 0; x < S; x++) {
      const h = hash(x, y, v + 70);
      if (h < 0.15) pb.set(x, y, P.faceDark);
      else if (h < 0.2) pb.set(x, y, shade(P.face, 0.15));
    }
    pb.hline(0, 15, 8 + v, P.faceDark);
    pb.line(3 + v * 4, 5, 6 + v * 4, 12, P.faceDark);
  }
  if (P.glow) { pb.set(4 + v * 6, 9, P.glow); pb.set(5 + v * 6, 10, shade(P.glow, -0.25)); if (brick) pb.hline(0, 15, 3, P.glow); }
  pb.hline(0, 15, 15, P.ground);
  pb.hline(0, 15, 14, shade(P.faceDark, -0.2));
}

// ------------------------------------------------------------------ dekor (şeffaf)
function drawDecor(pb, name) {
  const h = (i, s = 0) => hash(i, name.length, s);
  switch (name) {
    case 'flower_red': case 'flower_yellow': case 'flower_white': case 'flower_blue': {
      const col = { flower_red: '#e04848', flower_yellow: '#f0d040', flower_white: '#f4f0e8', flower_blue: '#6a8cf0' }[name];
      for (let i = 0; i < 3; i++) {
        const x = 3 + Math.floor(h(i) * 10), y = 4 + Math.floor(h(i, 1) * 9);
        pb.set(x, y + 1, '#3e722a'); pb.set(x, y + 2, '#3e722a');
        pb.set(x - 1, y, col); pb.set(x + 1, y, col); pb.set(x, y - 1, col); pb.set(x, y + 1 - 1, '#f8e070');
      }
      break;
    }
    case 'tuft': case 'tuft2': case 'fern': case 'clover': {
      const col = name === 'tuft2' ? '#6c8c3a' : name === 'fern' ? '#2e6a2a' : '#3e7a2c';
      const n = name === 'clover' ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const x = 3 + Math.floor(h(k) * 9), y = 6 + Math.floor(h(k, 2) * 7);
        if (name === 'clover') { pb.set(x, y, '#4e9a3a'); pb.set(x + 1, y, '#4e9a3a'); pb.set(x, y + 1, '#4e9a3a'); pb.set(x + 1, y - 1, '#62b04a'); continue; }
        pb.vline(x, y - 3, y, col); pb.set(x - 1, y - 2, col); pb.set(x + 1, y - 2, col); pb.set(x + 2, y - 1, col);
        if (name === 'fern') { pb.line(x, y, x - 3, y - 2, col); pb.line(x, y, x + 3, y - 3, col); }
      }
      break;
    }
    case 'pebbles':
      for (let i = 0; i < 3; i++) { const x = 3 + Math.floor(h(i) * 10), y = 4 + Math.floor(h(i, 3) * 9); pb.set(x, y, '#8a8278'); pb.set(x + 1, y, '#6a645c'); }
      break;
    case 'mushroom':
      pb.rect(7, 9, 2, 3, '#e8dcc0'); pb.ellipse(8, 8, 3, 2, '#c83838'); pb.set(7, 7, '#f4f0e8'); pb.set(9, 8, '#f4f0e8');
      pb.rect(11, 11, 1, 2, '#e8dcc0'); pb.ellipse(11.5, 10.5, 1.6, 1.2, '#c86838');
      break;
    case 'leaves':
      for (let i = 0; i < 4; i++) { const x = 2 + Math.floor(h(i) * 12), y = 3 + Math.floor(h(i, 4) * 11); pb.set(x, y, i % 2 ? '#a06a2a' : '#c08a3a'); pb.set(x + 1, y, '#8a5a24'); }
      break;
    case 'bones':
      pb.line(4, 10, 10, 8, '#e0d8c4'); pb.set(3, 10, '#f0e8d8'); pb.set(11, 8, '#f0e8d8'); pb.line(7, 12, 12, 13, '#d0c8b4');
      break;
    case 'skull':
      pb.ellipse(8, 8, 3, 2.6, '#e8e0cc'); pb.set(7, 8, '#2a2426'); pb.set(9, 8, '#2a2426'); pb.rect(7, 10, 3, 1, '#d0c8b4');
      break;
    case 'rubble':
      pb.ellipse(6, 10, 2.5, 1.6, '#6a6468'); pb.ellipse(10, 11, 1.8, 1.2, '#5a5458'); pb.set(5, 9, '#8a8488'); pb.set(12, 8, '#5a5458');
      break;
    case 'crystal_small':
      pb.poly([[6, 12], [7, 6], [9, 12]], '#5ac8f0'); pb.vline(7, 7, 11, '#b8f0ff');
      pb.poly([[9, 12], [11, 8], [12, 12]], '#9a7af0'); pb.set(11, 9, '#d8c8ff');
      break;
    case 'reeds':
      for (let i = 0; i < 4; i++) { const x = 4 + i * 2 + Math.floor(h(i) * 2); pb.vline(x, 5 + (i % 2) * 2, 13, '#6a7a3a'); pb.rect(x, 4 + (i % 2) * 2, 1, 2, '#6a4a2a'); }
      break;
    case 'lily':
      pb.ellipse(8, 9, 3.5, 2.2, '#3e8a3a'); pb.line(8, 9, 11, 8, '#2c4838'); pb.set(7, 8, '#f0a0c0'); pb.set(6, 8, '#f8d0e0');
      break;
    case 'puddle':
      pb.ellipse(8, 10, 4, 2, '#3a4a4a'); pb.hline(6, 9, 9, '#5a7070');
      break;
    case 'roots':
      pb.line(2, 12, 8, 9, '#5a3e24'); pb.line(8, 9, 13, 12, '#5a3e24'); pb.line(8, 9, 9, 14, '#4a3220');
      break;
    case 'rail_h':
      pb.hline(0, 15, 6, '#6a6a72'); pb.hline(0, 15, 11, '#6a6a72');
      for (let x = 1; x < 16; x += 5) pb.rect(x, 5, 2, 8, '#5a3e24');
      pb.hline(0, 15, 6, '#8a8a92'); pb.hline(0, 15, 11, '#8a8a92');
      break;
    case 'rail_v':
      pb.vline(5, 0, 15, '#8a8a92'); pb.vline(10, 0, 15, '#8a8a92');
      for (let y = 1; y < 16; y += 5) pb.rect(4, y, 8, 2, '#5a3e24');
      break;
    case 'cracks':
      pb.line(3, 4, 7, 8, '#2a262a'); pb.line(7, 8, 6, 12, '#2a262a'); pb.line(7, 8, 11, 9, '#2a262a');
      break;
    case 'moss':
      for (let i = 0; i < 8; i++) pb.set(4 + Math.floor(h(i) * 8), 6 + Math.floor(h(i, 5) * 6), i % 2 ? '#5a8a3a' : '#4a7a2e');
      break;
    case 'ore_specks':
      pb.set(5, 7, '#c0a080'); pb.set(6, 7, '#9a7a5a'); pb.set(10, 11, '#c0c0d0'); pb.set(11, 10, '#e0e0f0');
      break;
    case 'cobweb':
      pb.line(0, 0, 8, 8, '#c8c8d0'); pb.line(0, 8, 8, 0, '#a8a8b0'); pb.line(0, 4, 4, 0, '#b8b8c0'); pb.line(2, 6, 6, 2, '#b8b8c0');
      break;
    // ---------------- V2 dekorları
    case 'embers':
      for (let i = 0; i < 4; i++) { const x = 3 + Math.floor(h(i) * 10), y = 4 + Math.floor(h(i, 6) * 9); pb.set(x, y, i % 2 ? '#ff8a2a' : '#ffd060'); }
      pb.set(9, 10, '#c8401a');
      break;
    case 'ash_pile':
      pb.ellipse(8, 11, 5, 2.5, '#5a5250'); pb.ellipse(7, 10, 3.5, 1.8, '#8a827e'); pb.set(6, 9, '#a8a09a'); pb.set(10, 11, '#ff7a2a');
      break;
    case 'lava_crack':
      pb.line(2, 5, 7, 9, '#2a1410'); pb.line(7, 9, 13, 8, '#2a1410'); pb.line(7, 9, 6, 14, '#2a1410');
      pb.line(3, 5, 7, 8, '#ff6a1a'); pb.line(8, 9, 12, 8, '#ff8a2a'); pb.set(7, 9, '#ffe070');
      break;
    case 'charred_bones':
      pb.line(4, 10, 10, 8, '#6a5e54'); pb.set(3, 10, '#8a7e74'); pb.set(11, 8, '#8a7e74'); pb.ellipse(11, 12, 2, 1.6, '#5a5048'); pb.set(10, 12, '#1a1414');
      break;
    case 'cinder':
      pb.ellipse(6, 10, 2, 1.4, '#2a2224'); pb.ellipse(10, 11, 1.6, 1.1, '#3a3032'); pb.set(6, 9, '#ff6a2a'); pb.set(12, 8, '#2a2224');
      break;
    case 'snow_tuft':
      for (let k = 0; k < 2; k++) { const x = 4 + Math.floor(h(k) * 8), y = 7 + Math.floor(h(k, 2) * 6); pb.ellipse(x, y, 2.5, 1.4, '#ffffff'); pb.hline(x - 2, x + 1, y + 1, '#b8c8d8'); }
      break;
    case 'frost_crystal_small':
      pb.poly([[6, 12], [7, 6], [9, 12]], '#7ad8ff'); pb.vline(7, 7, 11, '#e0faff');
      pb.poly([[9, 12], [11, 8], [12, 12]], '#a8e8ff'); pb.set(11, 9, '#ffffff');
      break;
    case 'ice_shards':
      pb.line(3, 11, 6, 8, '#c8f0ff'); pb.line(8, 12, 9, 7, '#9fe0f8'); pb.line(11, 11, 13, 9, '#c8f0ff'); pb.set(9, 7, '#ffffff');
      break;
    case 'footprints':
      for (let i = 0; i < 3; i++) { pb.ellipse(4 + i * 4, 6 + (i % 2) * 4, 1, 1.5, '#a8b8c8'); }
      break;
    case 'frozen_grass':
      for (let k = 0; k < 2; k++) { const x = 4 + Math.floor(h(k) * 8), y = 7 + Math.floor(h(k, 2) * 6); pb.vline(x, y - 3, y, '#7a9aa0'); pb.set(x - 1, y - 2, '#9ab8c0'); pb.set(x + 1, y - 2, '#9ab8c0'); pb.set(x, y - 3, '#ffffff'); }
      break;
    case 'ice_crack':
      pb.line(3, 4, 8, 8, '#e0f6ff'); pb.line(8, 8, 7, 13, '#e0f6ff'); pb.line(8, 8, 13, 9, '#c0e4f4');
      break;
    case 'rune_ice':
      pb.ring(8, 8, 5, '#7ad8ff'); pb.line(8, 4, 8, 12, '#a8e8ff'); pb.line(5, 8, 11, 8, '#a8e8ff'); pb.set(8, 8, '#ffffff');
      break;
    // ---------------- V3 dekorları
    case 'dead_tuft':
      for (let k = 0; k < 2; k++) { const x = 4 + Math.floor(h(k) * 8), y = 7 + Math.floor(h(k, 2) * 6); pb.vline(x, y - 3, y, '#7a7462'); pb.line(x, y - 1, x - 2, y - 3, '#6a6454'); pb.line(x, y - 2, x + 2, y - 4, '#8a8472'); }
      break;
    case 'bone_pile':
      pb.line(3, 11, 9, 9, '#d8d0bc'); pb.line(6, 12, 12, 11, '#c8c0ac'); pb.ellipse(11, 9, 2.2, 1.9, '#e0d8c4'); pb.set(10, 9, '#2a2426'); pb.set(12, 9, '#2a2426');
      pb.set(2, 11, '#f0e8d8'); pb.set(13, 11, '#f0e8d8');
      break;
    case 'cursed_rune':
      pb.ring(8, 8, 5, '#6a3a9a'); pb.line(5, 5, 11, 11, '#a070e0'); pb.line(11, 5, 5, 11, '#a070e0'); pb.set(8, 8, '#e0c8ff'); pb.set(8, 3, '#a070e0'); pb.set(8, 13, '#a070e0');
      break;
    case 'grave_candle':
      pb.rect(6, 9, 2, 4, '#e8e0c8'); pb.rect(10, 10, 2, 3, '#d8d0b8'); pb.set(6, 8, '#ffd060'); pb.set(7, 7, '#fff0a0'); pb.set(10, 9, '#ffb040');
      pb.ellipse(9, 13, 4, 1, '#c8c0a8');
      break;
    case 'dry_grass':
      for (let i = 0; i < 4; i++) { const x = 2 + Math.floor(h(i) * 12), y = 8 + Math.floor(h(i, 1) * 6); pb.line(x, y, x - 1, y - 3, '#9a9a72'); pb.line(x, y, x + 1, y - 2, '#7a7a58'); }
      break;
    case 'storm_crack':
      pb.line(2, 9, 7, 7, '#2a2a30'); pb.line(7, 7, 13, 10, '#2a2a30'); pb.set(7, 7, '#ffe070'); pb.set(10, 8, '#9ad0ff');
      break;
    case 'storm_shard':
      pb.poly([[6, 12], [8, 5], [10, 12]], '#6a8ac8'); pb.vline(8, 7, 11, '#c8e0ff'); pb.set(4, 12, '#9ad0ff'); pb.set(11, 11, '#ffe070');
      break;
    case 'star_glint':
      for (let i = 0; i < 3; i++) { const x = 3 + Math.floor(h(i) * 10), y = 3 + Math.floor(h(i, 1) * 10); pb.set(x, y, '#ffe8a0'); if (i === 0) { pb.set(x - 1, y, '#8a7aa0'); pb.set(x + 1, y, '#8a7aa0'); pb.set(x, y - 1, '#8a7aa0'); pb.set(x, y + 1, '#8a7aa0'); } }
      break;
    case 'astral_rune':
      pb.ring(8, 8, 4, '#7a6ac0'); pb.line(6, 6, 10, 10, '#b0a0ff'); pb.line(10, 6, 6, 10, '#b0a0ff'); pb.set(8, 8, '#ffe8a0');
      break;
    case 'meteor_pebble':
      pb.ellipse(6, 10, 2.5, 2, '#5a4a40'); pb.set(5, 9, '#ff8a3a'); pb.ellipse(11, 12, 1.6, 1.2, '#4a3a34');
      break;
    case 'obsidian_shards':
      pb.poly([[3, 12], [5, 7], [7, 12]], '#2a2234'); pb.set(5, 8, '#8a6ab0'); pb.poly([[9, 13], [12, 8], [13, 13]], '#1e1a26'); pb.set(12, 9, '#6a5a82');
      break;
    case 'void_crack':
      pb.line(2, 5, 7, 9, '#120a1c'); pb.line(7, 9, 13, 8, '#120a1c'); pb.line(7, 9, 6, 14, '#120a1c');
      pb.line(3, 5, 7, 8, '#7a4ac0'); pb.line(8, 9, 12, 8, '#a070e0'); pb.set(7, 9, '#e0c8ff');
      break;
    case 'fog_wisp':
      pb.ellipse(8, 9, 6, 2, '#9a9aa8'); pb.ellipse(6, 8, 3, 1.2, '#b8b8c4'); pb.set(12, 9, '#8a8a98');
      break;
    default:
      pb.set(8, 8, '#ff00ff');
  }
}

// ------------------------------------------------------------------ damgalar (tam görüntü)
function tree(pb, kind, ox = 0) {
  const W = pb.w;
  const trunk = kind === 'tree_birch' ? '#e8e4d8' : '#6a4628';
  if (kind === 'tree_pine') {
    pb.rect(14, 36, 4, 10, '#5a3a22'); pb.vline(14, 36, 45, '#3e2816');
    const layers = [[16, 4, 6], [16, 10, 9], [16, 17, 12], [16, 25, 14], [16, 33, 15]];
    for (const [cx, y, r] of layers) {
      pb.poly([[cx - r, y + 8], [cx, y - 2], [cx + r, y + 8]], '#2a5a32');
      pb.poly([[cx - r + 3, y + 6], [cx - 1, y], [cx + 2, y + 6]], '#3a7240');
      pb.hline(cx - r, cx + r, y + 8, '#1e4226');
    }
    pb.ellipse(16, 46, 9, 2, '#00000040'.slice(0, 7), 70);
  } else {
    pb.ellipse(16, 45, 10, 2.5, '#1a2a14', 90);
    pb.rect(13, 30, 6, 16, trunk);
    pb.vline(13, 30, 45, shade(trunk, -0.3)); pb.vline(18, 30, 45, shade(trunk, -0.15));
    if (kind === 'tree_birch') for (let y = 32; y < 45; y += 4) pb.hline(14, 16, y, '#3a3a36');
    pb.line(12, 44, 9, 46, trunk); pb.line(19, 44, 22, 46, trunk);
    const leaf = kind === 'tree_birch' ? ['#4e8a32', '#62a240', '#86c056', '#3a6c26'] : ['#2e6428', '#3c7a30', '#58983e', '#224c1e'];
    const blobs = [[16, 14, 13], [8, 20, 8], [24, 20, 8], [16, 24, 10], [10, 10, 7], [22, 9, 7]];
    for (const [x, y, r] of blobs) pb.disc(x, y, r, leaf[3]);
    for (const [x, y, r] of blobs) pb.disc(x, y - 1, r - 1, leaf[0]);
    for (const [x, y, r] of blobs) pb.disc(x - 2, y - 3, r * 0.6, leaf[1]);
    for (const [x, y, r] of blobs) pb.disc(x - 3, y - 4, r * 0.28, leaf[2]);
    for (let i = 0; i < 30; i++) { const x = hash(i, 1, 9) * W, y = hash(1, i, 9) * 30; if (pb.opaque(x, y)) pb.set(x, y, leaf[3]); }
  }
  pb.outline(OUTLINE);
}

function house(pb, roof) {
  // 80×80: çatı (0-47) + duvar (48-79)
  const wall = '#c8b490', wallD = '#a8946e', beam = '#6a4a2c';
  pb.rect(4, 44, 72, 34, wall);
  for (let y = 46; y < 78; y += 4) pb.hline(4, 75, y, shade(wall, -0.05));
  pb.rect(4, 44, 3, 34, beam); pb.rect(73, 44, 3, 34, beam); pb.rect(4, 44, 72, 3, beam);
  pb.rect(34, 58, 12, 20, '#5a3a20'); pb.rect(35, 59, 10, 19, '#7a5230'); pb.vline(40, 59, 77, '#5a3a20'); pb.set(43, 68, '#e0c060');
  for (const wx of [14, 54]) {
    pb.rect(wx, 54, 12, 10, beam); pb.rect(wx + 1, 55, 10, 8, '#3a5a7a'); pb.rect(wx + 2, 56, 3, 3, '#7ab0d8');
    pb.vline(wx + 6, 55, 62, beam); pb.hline(wx + 1, wx + 10, 59, beam);
    pb.rect(wx - 1, 64, 14, 2, '#5a8a3a'); pb.set(wx + 2, 63, '#e04848'); pb.set(wx + 8, 63, '#f0d040');
  }
  pb.hline(4, 75, 77, wallD);
  // çatı
  const R = roof, Rd = shade(roof, -0.25), Rl = shade(roof, 0.18);
  pb.poly([[0, 46], [40, 4], [80, 46]], Rd);
  pb.poly([[3, 44], [40, 7], [77, 44]], R);
  for (let y = 12; y < 44; y += 5) {
    const half = (y - 7) * 37 / 37;
    pb.hline(40 - half + 2, 40 + half - 2, y, Rd);
    for (let x = Math.round(40 - half) + 3 + (y % 2) * 3; x < 40 + half - 3; x += 6) pb.set(x, y + 2, Rl);
  }
  pb.line(40, 7, 3, 44, Rl); pb.hline(0, 79, 46, shade(roof, -0.4));
  // baca
  pb.rect(54, 10, 8, 16, '#7a6a5e'); pb.rect(53, 8, 10, 3, '#5e5048');
  pb.outline(OUTLINE);
}

function drawStamp(name) {
  const sd = STAMPS[name];
  const pb = new PB(sd.w * S, sd.h * S);
  switch (name) {
    case 'tree_oak': case 'tree_pine': case 'tree_birch': tree(pb, name); break;
    case 'big_tree': {
      pb.ellipse(32, 76, 22, 4, '#1a2a14', 90);
      pb.rect(26, 46, 12, 32, '#6a4628'); pb.vline(26, 46, 77, '#4a301a'); pb.vline(37, 46, 77, '#4a301a');
      pb.line(25, 76, 18, 79, '#6a4628'); pb.line(38, 76, 46, 79, '#6a4628');
      const blobs = [[32, 22, 20], [14, 30, 12], [50, 30, 12], [32, 38, 14], [18, 14, 11], [46, 13, 11], [32, 8, 10]];
      for (const [x, y, r] of blobs) pb.disc(x, y, r, '#244c1e');
      for (const [x, y, r] of blobs) pb.disc(x, y - 1, r - 1, '#346a2a');
      for (const [x, y, r] of blobs) pb.disc(x - 3, y - 4, r * 0.6, '#4e8a3a');
      for (const [x, y, r] of blobs) pb.disc(x - 4, y - 5, r * 0.25, '#6aa64e');
      pb.outline(OUTLINE);
      break;
    }
    case 'bush':
      pb.ellipse(8, 10, 7, 5, '#2e6428'); pb.ellipse(7, 9, 5, 3.5, '#3e7a30'); pb.ellipse(6, 8, 2.5, 2, '#58983e');
      pb.set(11, 9, '#c83838'); pb.set(4, 11, '#c83838'); pb.outline(OUTLINE);
      break;
    case 'rock':
      pb.ellipse(8, 10, 6, 5, '#6e686c'); pb.ellipse(7, 9, 4, 3, '#8a8488'); pb.set(5, 7, '#a8a2a6'); pb.line(9, 9, 11, 12, '#4e484c');
      pb.outline(OUTLINE);
      break;
    case 'rock_big':
      pb.poly([[2, 30], [5, 12], [14, 4], [24, 6], [30, 16], [30, 30]], '#5e585c');
      pb.poly([[5, 26], [7, 13], [14, 7], [22, 8], [26, 16], [20, 22]], '#7a7478');
      pb.poly([[9, 14], [14, 9], [19, 10], [14, 15]], '#9a9498');
      pb.line(20, 22, 28, 28, '#3e383c'); pb.outline(OUTLINE);
      break;
    case 'stump':
      pb.rect(4, 6, 8, 8, '#6a4628'); pb.ellipse(8, 6, 4, 2, '#b08a58'); pb.ring(8, 6, 2, '#8a6238'); pb.outline(OUTLINE);
      break;
    case 'log':
      pb.rect(2, 7, 28, 6, '#6a4628'); pb.hline(2, 29, 8, '#8a5e36'); pb.ellipse(29, 10, 2.5, 3.2, '#b08a58'); pb.set(29, 10, '#8a6238');
      pb.set(10, 6, '#3e7a30'); pb.set(11, 6, '#58983e'); pb.outline(OUTLINE);
      break;
    case 'house_red': house(pb, '#a83a2c'); break;
    case 'house_blue': house(pb, '#3a5a9a'); break;
    case 'house_brown': house(pb, '#7a5032'); break;
    case 'house_green': house(pb, '#3e7a4a'); break;
    case 'smithy': case 'warehouse': {
      const smith = name === 'smithy';
      const wall = smith ? '#7a7068' : '#b8a07a';
      pb.rect(2, 44, 92, 34, wall);
      for (let y = 46; y < 78; y += 5) for (let x = 2 + ((y / 5) % 2) * 5; x < 94; x += 10) pb.rect(x, y, 9, 4, shade(wall, (hash(x, y, 3) - 0.5) * 0.15));
      pb.rect(2, 44, 92, 3, '#4a3424');
      const roof = smith ? '#4a4a52' : '#8a5a32';
      pb.poly([[0, 46], [14, 8], [82, 8], [96, 46]], shade(roof, -0.25));
      pb.poly([[3, 44], [16, 11], [80, 11], [93, 44]], roof);
      for (let y = 15; y < 44; y += 5) pb.hline(10, 86, y, shade(roof, -0.2));
      if (smith) {
        pb.rect(36, 56, 24, 22, '#2a1a14'); pb.rect(38, 60, 20, 18, '#c85a20'); pb.rect(42, 64, 12, 14, '#f0a030'); pb.rect(45, 68, 6, 10, '#ffe080');
        pb.rect(70, 2, 10, 22, '#5e544c'); pb.rect(69, 0, 12, 3, '#4a4038');
        pb.rect(8, 54, 14, 12, '#4a3424'); pb.rect(10, 56, 10, 8, '#e09040');
        // tabela: çekiç
        pb.rect(74, 52, 14, 10, '#6a4a2c'); pb.rect(78, 54, 6, 3, '#9aa0a8'); pb.vline(81, 57, 60, '#8a6238');
      } else {
        pb.rect(30, 52, 36, 26, '#5a3a20'); pb.rect(32, 54, 32, 24, '#7a5230');
        pb.line(32, 54, 63, 77, '#5a3a20'); pb.line(63, 54, 32, 77, '#5a3a20');
        pb.rect(8, 56, 12, 9, '#3a5a7a'); pb.rect(76, 56, 12, 9, '#3a5a7a');
        pb.rect(40, 46, 16, 5, '#e0d0a0'); pb.hline(42, 53, 48, '#5a3a20');
      }
      pb.outline(OUTLINE);
      break;
    }
    case 'stall_red': case 'stall_blue': {
      const c = name === 'stall_red' ? '#c83a3a' : '#3a6ac8';
      pb.rect(3, 12, 2, 18, '#5a3a20'); pb.rect(43, 12, 2, 18, '#5a3a20');
      for (let x = 0; x < 48; x += 8) { pb.rect(x, 4, 8, 9, (x / 8) % 2 ? c : '#f0e8d8'); pb.poly([[x, 13], [x + 4, 16], [x + 8, 13]], (x / 8) % 2 ? c : '#f0e8d8'); }
      pb.rect(4, 20, 40, 10, '#8a6238'); pb.hline(4, 43, 20, '#b08a58');
      pb.disc(12, 19, 2, '#e04848'); pb.disc(17, 19, 2, '#f0a030'); pb.disc(30, 19, 2, '#6ad050'); pb.rect(35, 17, 5, 3, '#c8b080');
      pb.outline(OUTLINE);
      break;
    }
    case 'well':
      pb.ellipse(16, 22, 12, 6, '#6e686c'); pb.ellipse(16, 21, 9, 4, '#1e2a3a'); pb.ellipse(16, 21, 7, 2.5, '#2f5c8c');
      for (let a = 0; a < 12; a++) { const x = 16 + Math.cos(a / 12 * Math.PI * 2) * 11, y = 22 + Math.sin(a / 12 * Math.PI * 2) * 5.5; pb.rect(x - 1, y - 1, 3, 2, '#8a8488'); }
      pb.rect(5, 4, 2, 18, '#6a4628'); pb.rect(25, 4, 2, 18, '#6a4628');
      pb.poly([[2, 6], [16, 0], [30, 6]], '#8a3a2c'); pb.hline(7, 25, 8, '#5a3a20'); pb.vline(16, 8, 16, '#c8b490'); pb.rect(14, 15, 4, 3, '#6a4628');
      pb.outline(OUTLINE);
      break;
    case 'fence_h':
      pb.rect(0, 6, 16, 2, '#8a6238'); pb.rect(0, 11, 16, 2, '#8a6238'); pb.rect(2, 4, 2, 11, '#6a4628'); pb.rect(12, 4, 2, 11, '#6a4628'); pb.outline(OUTLINE);
      break;
    case 'fence_v':
      pb.rect(7, 0, 2, 16, '#8a6238'); pb.rect(6, 2, 4, 2, '#6a4628'); pb.rect(6, 12, 4, 2, '#6a4628'); pb.outline(OUTLINE);
      break;
    case 'barrel':
      pb.rect(4, 3, 8, 11, '#8a5a32'); pb.hline(4, 11, 5, '#4a4a52'); pb.hline(4, 11, 11, '#4a4a52'); pb.ellipse(8, 3, 4, 1.5, '#a87040'); pb.vline(6, 4, 13, '#a87040');
      pb.outline(OUTLINE);
      break;
    case 'crate':
      pb.rect(3, 4, 10, 10, '#a07a48'); pb.rect(3, 4, 10, 1, '#c09a68'); pb.line(3, 4, 12, 13, '#6a4a2a'); pb.line(12, 4, 3, 13, '#6a4a2a'); pb.outline(OUTLINE);
      break;
    case 'haystack':
      pb.ellipse(8, 10, 7, 5, '#c8a848'); pb.ellipse(7, 8, 5, 3, '#e0c060'); for (let i = 0; i < 6; i++) pb.set(3 + i * 2, 9 + (i % 2), '#a88830'); pb.outline(OUTLINE);
      break;
    case 'anvil':
      pb.rect(5, 11, 6, 4, '#5a3a20'); pb.rect(4, 6, 9, 4, '#4a4a52'); pb.rect(2, 6, 3, 2, '#4a4a52'); pb.rect(6, 10, 4, 1, '#3a3a42'); pb.hline(4, 12, 6, '#7a7a86'); pb.outline(OUTLINE);
      break;
    case 'tent': {
      pb.poly([[2, 44], [24, 4], [46, 44]], '#8a7a5a'); pb.poly([[6, 42], [24, 8], [42, 42]], '#b0a078');
      pb.poly([[18, 44], [24, 22], [30, 44]], '#3a2a1a'); pb.line(24, 4, 24, 0, '#6a4628'); pb.line(2, 44, 0, 47, '#6a4628'); pb.line(46, 44, 47, 47, '#6a4628');
      for (let y = 14; y < 42; y += 6) pb.hline(24 - (y - 8) * 0.5, 24 + (y - 8) * 0.5, y, '#9a8a64');
      pb.outline(OUTLINE);
      break;
    }
    case 'pillar': case 'ruin_pillar': {
      const c = name === 'pillar' ? '#6a6470' : '#7a7a6a';
      pb.rect(3, 2, 10, 28, c); pb.rect(1, 0, 14, 4, shade(c, 0.15)); pb.rect(1, 27, 14, 5, shade(c, -0.15));
      pb.vline(5, 4, 26, shade(c, 0.2)); pb.vline(11, 4, 26, shade(c, -0.25));
      if (name === 'ruin_pillar') { pb.clear(1, 0, 6, 2); pb.set(10, 12, '#4a5a3a'); pb.set(4, 18, '#4a7a3a'); pb.set(5, 19, '#4a7a3a'); }
      pb.outline(OUTLINE);
      break;
    }
    case 'crystal_big':
      pb.poly([[3, 30], [6, 8], [9, 2], [11, 12], [13, 30]], '#3a9ad0'); pb.poly([[6, 28], [8, 6], [9, 4], [10, 14], [9, 28]], '#6ad0ff');
      pb.vline(8, 8, 24, '#c8f4ff'); pb.poly([[10, 30], [13, 16], [15, 30]], '#7a5ad0'); pb.line(12, 18, 13, 28, '#b8a0ff');
      pb.ellipse(8, 30, 7, 1.5, '#2a2a3a'); pb.outline(OUTLINE);
      break;
    case 'support':
      pb.rect(3, 4, 3, 28, '#6a4628'); pb.rect(10, 4, 3, 28, '#6a4628'); pb.rect(0, 2, 16, 4, '#8a5e36'); pb.hline(0, 15, 2, '#a87848');
      pb.vline(4, 6, 30, '#8a5e36'); pb.outline(OUTLINE);
      break;
    case 'cart':
      pb.rect(4, 3, 24, 9, '#6a4628'); pb.hline(4, 27, 3, '#8a5e36'); pb.ellipse(16, 4, 9, 2, '#5a5458'); pb.set(12, 3, '#c0a080'); pb.set(18, 3, '#e0e0f0');
      pb.disc(9, 13, 2.5, '#3a3a42'); pb.disc(23, 13, 2.5, '#3a3a42'); pb.set(9, 13, '#8a8a92'); pb.set(23, 13, '#8a8a92'); pb.outline(OUTLINE);
      break;
    case 'dead_tree': case 'mangrove': {
      const c = name === 'dead_tree' ? '#4a3e30' : '#3a3424';
      pb.ellipse(16, 46, 10, 2, '#141a10', 120);
      pb.rect(13, 22, 6, 24, c); pb.vline(13, 22, 45, shade(c, -0.3));
      if (name === 'mangrove') { pb.line(13, 40, 6, 47, c); pb.line(18, 40, 26, 47, c); pb.line(15, 38, 15, 47, c); pb.line(10, 44, 4, 47, c);
        const blobs = [[16, 14, 10], [8, 18, 6], [24, 17, 6]];
        for (const [x, y, r] of blobs) pb.disc(x, y, r, '#26341e');
        for (const [x, y, r] of blobs) pb.disc(x - 1, y - 2, r * 0.6, '#3a4a2a');
        for (let i = 0; i < 6; i++) pb.vline(6 + i * 4, 20, 26 + (i % 3) * 3, '#4a5a32');
      } else {
        pb.line(15, 24, 6, 10, c); pb.line(8, 13, 3, 11, c); pb.line(17, 22, 26, 6, c); pb.line(24, 9, 29, 8, c); pb.line(16, 22, 17, 2, c); pb.line(16, 8, 12, 4, c);
        pb.thick(15, 24, 6, 10, c, 2); pb.thick(17, 22, 26, 6, c, 2);
      }
      pb.outline(OUTLINE);
      break;
    }
    case 'tombstone': case 'tombstone2': {
      const c = name === 'tombstone' ? '#8a8a8e' : '#7a7e72';
      if (name === 'tombstone') { pb.rect(4, 4, 8, 10, c); pb.ellipse(8, 4, 4, 3, c); pb.hline(6, 9, 7, '#5a5a5e'); pb.vline(8, 6, 11, '#5a5a5e'); pb.hline(6, 10, 9, '#5a5a5e'); }
      else { pb.rect(7, 2, 3, 12, c); pb.rect(4, 5, 9, 3, c); pb.set(10, 9, '#4a6a3a'); }
      pb.rect(3, 13, 10, 2, '#4a3a2a'); pb.outline(OUTLINE);
      break;
    }
    case 'ruin_wall':
      pb.rect(1, 8, 30, 22, '#7a7a6a');
      for (let y = 10; y < 30; y += 5) for (let x = 1 + ((y / 5) % 2) * 4; x < 31; x += 8) pb.rect(x, y, 7, 4, shade('#7a7a6a', (hash(x, y) - 0.5) * 0.2));
      pb.poly([[1, 8], [8, 2], [14, 8], [20, 5], [31, 8]], '#7a7a6a'); pb.clear(18, 2, 6, 5);
      pb.set(6, 20, '#4a7a3a'); pb.set(7, 21, '#4a7a3a'); pb.set(22, 14, '#4a7a3a'); pb.outline(OUTLINE);
      break;
    case 'statue':
      pb.rect(3, 26, 10, 6, '#6a6a62'); pb.rect(5, 12, 6, 14, '#8a8a80'); pb.disc(8, 8, 3.5, '#8a8a80'); pb.line(5, 14, 2, 20, '#8a8a80'); pb.line(11, 14, 14, 6, '#8a8a80');
      pb.vline(14, 2, 8, '#9a9a90'); pb.set(7, 8, '#5a5a52'); pb.outline(OUTLINE);
      break;
    case 'brazier':
      pb.rect(6, 9, 4, 6, '#4a4a52'); pb.poly([[2, 5], [14, 5], [12, 10], [4, 10]], '#5a5a62'); pb.hline(2, 13, 5, '#7a7a86'); pb.rect(5, 4, 6, 1, '#f0a030');
      pb.outline(OUTLINE);
      break;
    case 'sign':
      pb.rect(7, 7, 2, 9, '#6a4628'); pb.rect(2, 3, 12, 6, '#a07a48'); pb.hline(4, 11, 5, '#5a3a20'); pb.hline(4, 9, 7, '#5a3a20'); pb.outline(OUTLINE);
      break;
    // ---------------- V2 damgaları
    case 'charred_tree': {
      const c = '#2a2020';
      pb.ellipse(16, 46, 10, 2, '#140e0e', 120);
      pb.rect(13, 20, 6, 26, c); pb.vline(13, 20, 45, '#1a1414'); pb.vline(18, 22, 44, '#3a2e2a');
      pb.thick(15, 26, 5, 12, c, 2); pb.thick(17, 22, 27, 8, c, 2); pb.line(16, 20, 15, 2, c); pb.line(15, 8, 11, 4, c); pb.line(8, 15, 3, 13, c); pb.line(24, 11, 29, 10, c);
      for (const [x, y] of [[14, 30], [17, 36], [15, 41], [6, 13], [25, 9]]) pb.set(x, y, '#ff6a2a');
      pb.set(16, 34, '#ffb040');
      pb.outline(OUTLINE);
      break;
    }
    case 'basalt_rock':
      pb.poly([[2, 30], [3, 14], [8, 6], [15, 2], [24, 5], [30, 14], [30, 30]], '#2e2c32');
      pb.poly([[5, 26], [6, 14], [10, 8], [16, 5], [22, 8], [26, 15], [18, 22]], '#46434c');
      for (const x of [8, 14, 20, 25]) pb.vline(x, 9 + (x % 3), 28, '#24222a');
      pb.line(10, 10, 20, 8, '#5e5a64'); pb.set(12, 20, '#ff6a2a');
      pb.outline(OUTLINE);
      break;
    case 'lava_vent':
      pb.ellipse(8, 11, 6, 3.5, '#2a2224'); pb.ellipse(8, 10, 4, 2.2, '#c8401a'); pb.ellipse(8, 10, 2.2, 1.2, '#ffd060');
      pb.set(7, 5, '#8a8480'); pb.set(9, 3, '#a8a09a'); pb.set(8, 7, '#ff8a2a');
      pb.outline(OUTLINE);
      break;
    case 'burnt_wagon':
      pb.rect(3, 4, 25, 8, '#2e2420'); pb.hline(3, 27, 4, '#4a3a32'); for (let x = 5; x < 27; x += 5) pb.vline(x, 1, 4, '#2a201c');
      pb.disc(8, 13, 2.5, '#1e1a1a'); pb.disc(23, 13, 2.5, '#1e1a1a'); pb.set(8, 13, '#4a4040');
      pb.set(12, 6, '#ff6a2a'); pb.set(20, 8, '#ffb040'); pb.line(28, 9, 31, 11, '#2e2420');
      pb.outline(OUTLINE);
      break;
    case 'ash_ruin_wall':
      pb.rect(1, 8, 30, 22, '#4e4644');
      for (let y = 10; y < 30; y += 5) for (let x = 1 + ((y / 5) % 2) * 4; x < 31; x += 8) pb.rect(x, y, 7, 4, shade('#4e4644', (hash(x, y) - 0.5) * 0.25));
      pb.poly([[1, 8], [6, 1], [12, 8], [22, 4], [31, 8]], '#4e4644'); pb.clear(13, 1, 7, 6);
      pb.line(4, 14, 12, 26, '#2a2220'); pb.set(20, 16, '#ff6a2a'); pb.set(8, 22, '#c84a2a');
      pb.outline(OUTLINE);
      break;
    case 'ruin_tower': {
      pb.ellipse(16, 46, 12, 2, '#140e0e', 110);
      pb.rect(5, 12, 22, 34, '#5a5050');
      for (let y = 14; y < 46; y += 5) for (let x = 5 + ((y / 5) % 2) * 4; x < 27; x += 8) pb.rect(x, y, 7, 4, shade('#5a5050', (hash(x, y, 5) - 0.5) * 0.25));
      pb.poly([[3, 12], [8, 4], [12, 10], [17, 2], [22, 9], [29, 12]], '#5a5050'); pb.rect(3, 11, 26, 3, '#6a6060');
      pb.rect(13, 30, 6, 16, '#1a1414'); pb.ellipse(16, 30, 3, 3, '#1a1414');
      pb.rect(9, 18, 3, 5, '#1a1414'); pb.rect(21, 20, 3, 5, '#1a1414'); pb.set(22, 22, '#ff8a2a');
      pb.line(7, 24, 12, 40, '#2a2220');
      pb.outline(OUTLINE);
      break;
    }
    case 'obsidian_spire':
      pb.poly([[3, 31], [6, 10], [8, 1], [11, 12], [13, 31]], '#1e1a24'); pb.poly([[6, 28], [8, 6], [9, 14], [9, 28]], '#3a3448');
      pb.vline(8, 8, 22, '#6a5a7a'); pb.set(10, 20, '#ff6a2a'); pb.ellipse(8, 31, 6, 1.2, '#140e0e');
      pb.outline(OUTLINE);
      break;
    case 'frozen_pine': {
      pb.rect(14, 36, 4, 10, '#4a3a2e'); pb.vline(14, 36, 45, '#2e241c');
      const layers = [[16, 4, 6], [16, 10, 9], [16, 17, 12], [16, 25, 14], [16, 33, 15]];
      for (const [cx, y, r] of layers) {
        pb.poly([[cx - r, y + 8], [cx, y - 2], [cx + r, y + 8]], '#2a4a4c');
        pb.poly([[cx - r + 3, y + 6], [cx - 1, y], [cx + 2, y + 6]], '#3a6062');
        pb.hline(cx - r + 1, cx + r - 1, y + 7, '#e8f2f8'); pb.hline(cx - r + 3, cx - 2, y + 6, '#ffffff');
        pb.set(cx, y - 1, '#ffffff');
      }
      pb.ellipse(16, 46, 9, 2, '#8aa0b0', 90);
      pb.outline(OUTLINE);
      break;
    }
    case 'ice_crystal_big':
      pb.poly([[3, 30], [6, 8], [9, 1], [11, 12], [13, 30]], '#5ab8e8'); pb.poly([[6, 28], [8, 6], [9, 3], [10, 14], [9, 28]], '#a8e8ff');
      pb.vline(8, 7, 24, '#ffffff'); pb.poly([[10, 30], [13, 16], [15, 30]], '#7ac8f0'); pb.line(12, 18, 13, 28, '#e0faff');
      pb.ellipse(8, 30, 7, 1.5, '#6a8aa0'); pb.outline(OUTLINE);
      break;
    case 'ice_boulder':
      pb.poly([[2, 30], [4, 14], [12, 5], [22, 4], [30, 14], [30, 30]], '#8ab4cc');
      pb.poly([[5, 26], [7, 14], [13, 8], [21, 7], [26, 15], [18, 22]], '#b8dcec');
      pb.poly([[4, 14], [12, 5], [22, 4], [28, 10], [18, 9], [8, 13]], '#f4f8fc');
      pb.line(18, 22, 28, 28, '#6a94ac'); pb.set(14, 12, '#ffffff');
      pb.outline(OUTLINE);
      break;
    case 'frozen_statue':
      pb.rect(3, 26, 10, 6, '#7a8a9a'); pb.rect(5, 12, 6, 14, '#a8c8dc'); pb.disc(8, 8, 3.5, '#a8c8dc');
      pb.line(5, 14, 2, 20, '#a8c8dc'); pb.line(11, 14, 14, 6, '#a8c8dc'); pb.vline(14, 2, 8, '#c8e8f8');
      pb.set(7, 8, '#4a6a8a'); pb.hline(4, 12, 11, '#ffffff'); pb.set(6, 5, '#ffffff'); pb.vline(10, 16, 22, '#e0f6ff');
      pb.outline(OUTLINE);
      break;
    case 'ice_pillar': {
      const c = '#6a8aa8';
      pb.rect(3, 2, 10, 28, c); pb.rect(1, 0, 14, 4, shade(c, 0.2)); pb.rect(1, 27, 14, 5, shade(c, -0.15));
      pb.vline(5, 4, 26, shade(c, 0.3)); pb.vline(11, 4, 26, shade(c, -0.25));
      pb.hline(1, 14, 0, '#e8f6ff'); pb.vline(8, 6, 24, '#9fe8ff'); pb.set(8, 14, '#ffffff');
      pb.outline(OUTLINE);
      break;
    }
    case 'snow_tent': {
      pb.poly([[2, 44], [24, 4], [46, 44]], '#6a5a4a'); pb.poly([[6, 42], [24, 8], [42, 42]], '#8a7a62');
      pb.poly([[18, 44], [24, 22], [30, 44]], '#2a201a');
      pb.poly([[10, 26], [24, 4], [38, 26], [30, 22], [24, 12], [17, 22]], '#f0f6fa');
      for (let y = 14; y < 42; y += 6) pb.hline(24 - (y - 8) * 0.5, 24 + (y - 8) * 0.5, y, '#7a6a54');
      pb.line(24, 4, 24, 0, '#4a3a2e');
      pb.outline(OUTLINE);
      break;
    }
    case 'watchtower': {
      pb.ellipse(16, 46, 12, 2, '#8aa0b0', 100);
      for (const x of [6, 24]) { pb.rect(x, 18, 3, 28, '#5a4632'); pb.vline(x, 18, 45, '#3a2c1e'); }
      pb.line(7, 22, 25, 40, '#4a3a28'); pb.line(25, 22, 7, 40, '#4a3a28');
      pb.rect(3, 12, 26, 7, '#6a5238'); pb.hline(3, 28, 12, '#8a6a48');
      pb.poly([[1, 13], [16, 1], [31, 13]], '#4a5a6a'); pb.poly([[4, 12], [16, 3], [28, 12]], '#f0f6fa');
      pb.rect(13, 14, 6, 4, '#1a1414'); pb.set(16, 15, '#ffb040');
      pb.outline(OUTLINE);
      break;
    }
    case 'frozen_bush':
      pb.ellipse(8, 10, 7, 5, '#3a5a5c'); pb.ellipse(7, 9, 5, 3.5, '#4e7274'); pb.ellipse(7, 7, 5, 2, '#f0f6fa'); pb.set(11, 9, '#9fe8ff');
      pb.outline(OUTLINE);
      break;
    // ---------------- V3 damgaları
    case 'ruined_house': {
      // yıkık ev: kırık çatı, sökük kapı, çatlak duvar
      const wall = '#7a7268', beam = '#3e3228';
      pb.rect(4, 44, 72, 34, wall);
      for (let y = 46; y < 78; y += 5) for (let x = 4 + ((y / 5) % 2) * 5; x < 76; x += 10) pb.rect(x, y, 9, 4, shade(wall, (hash(x, y, 7) - 0.5) * 0.2));
      pb.rect(4, 44, 3, 34, beam); pb.rect(73, 44, 3, 34, beam); pb.rect(4, 44, 72, 3, beam);
      pb.rect(34, 58, 12, 20, '#120e10'); pb.line(35, 60, 44, 72, '#4a3a2c'); pb.line(36, 76, 40, 66, '#4a3a2c');
      for (const wx of [14, 54]) { pb.rect(wx, 54, 12, 10, beam); pb.rect(wx + 1, 55, 10, 8, '#141218'); pb.line(wx + 1, 55, wx + 10, 62, beam); }
      pb.line(60, 46, 66, 70, '#3e3832'); pb.line(10, 66, 18, 77, '#3e3832');
      const R = '#4a3e3a', Rd = '#2e2624';
      pb.poly([[0, 46], [40, 4], [80, 46]], Rd); pb.poly([[3, 44], [40, 7], [77, 44]], R);
      for (let y = 12; y < 44; y += 5) { const half = y - 7; pb.hline(40 - half + 2, 40 + half - 2, y, Rd); }
      pb.poly([[44, 14], [58, 18], [64, 34], [48, 30]], '#120e10');   // çatıdaki delik
      pb.line(46, 16, 60, 30, beam); pb.line(52, 18, 54, 32, beam);
      pb.clear(0, 0, 18, 30); pb.poly([[0, 46], [12, 34], [20, 40], [10, 46]], Rd);
      pb.set(22, 50, '#5a7a3a'); pb.set(23, 51, '#5a7a3a'); pb.set(68, 70, '#5a7a3a');
      pb.outline(OUTLINE);
      break;
    }
    case 'mausoleum': {
      pb.rect(3, 18, 42, 28, '#6a6670'); pb.rect(1, 16, 46, 4, '#827e88'); pb.hline(1, 46, 16, '#9a96a0');
      pb.poly([[0, 18], [24, 2], [48, 18]], '#4e4a56'); pb.poly([[4, 16], [24, 5], [44, 16]], '#5e5a66');
      pb.rect(18, 26, 12, 20, '#16121a'); pb.ellipse(24, 26, 6, 4, '#16121a');
      for (const x of [7, 37]) { pb.rect(x, 20, 4, 26, '#7a7680'); pb.vline(x, 20, 45, '#9a96a0'); }
      pb.vline(24, 6, 12, '#a8a4ae'); pb.hline(21, 27, 8, '#a8a4ae');
      pb.set(24, 34, '#a070e0'); pb.set(12, 38, '#4a6a3a'); pb.set(13, 39, '#4a6a3a');
      pb.outline(OUTLINE);
      break;
    }
    case 'broken_monument': {
      pb.ellipse(16, 46, 12, 2, '#18161c', 110);
      pb.rect(4, 38, 24, 8, '#5e5a64'); pb.rect(2, 36, 28, 3, '#7a7680');
      pb.rect(9, 10, 14, 27, '#6e6a74'); pb.vline(10, 10, 36, '#8a8690'); pb.vline(22, 12, 36, '#4e4a54');
      pb.poly([[9, 10], [12, 4], [16, 8], [20, 2], [23, 10]], '#6e6a74'); pb.clear(13, 0, 5, 6);
      pb.line(12, 14, 18, 30, '#3a3640'); pb.line(18, 30, 15, 36, '#3a3640');
      pb.hline(12, 20, 18, '#a070e0'); pb.set(16, 22, '#a070e0');
      pb.poly([[26, 44], [30, 40], [32, 45]], '#6e6a74');
      pb.outline(OUTLINE);
      break;
    }
    case 'dead_oak': {
      const c = '#4a4448';
      pb.ellipse(16, 46, 10, 2, '#18161c', 120);
      pb.rect(13, 22, 6, 24, c); pb.vline(13, 22, 45, '#2e2a2e'); pb.vline(18, 24, 44, '#5e585c');
      pb.thick(15, 26, 4, 12, c, 2); pb.thick(17, 22, 28, 9, c, 2); pb.line(16, 22, 16, 2, c); pb.line(16, 10, 10, 4, c); pb.line(16, 12, 23, 3, c);
      pb.line(6, 14, 1, 13, c); pb.line(25, 11, 31, 12, c); pb.line(10, 4, 8, 1, c);
      for (const [x, y] of [[5, 13], [26, 10], [11, 5], [21, 4]]) pb.set(x, y, '#6a6070');
      pb.set(14, 32, '#1a161c'); pb.set(15, 33, '#1a161c');
      pb.outline(OUTLINE);
      break;
    }
    case 'grave_cross':
      pb.rect(7, 2, 3, 12, '#6a6670'); pb.rect(3, 5, 11, 3, '#6a6670'); pb.vline(7, 2, 13, '#8a8690'); pb.set(9, 10, '#4a5a3a');
      pb.rect(3, 13, 10, 2, '#3a3028');
      pb.outline(OUTLINE);
      break;
    case 'iron_fence':
      pb.hline(0, 15, 6, '#3a3640'); pb.hline(0, 15, 12, '#3a3640');
      for (let x = 1; x < 16; x += 4) { pb.vline(x, 2, 14, '#4e4a56'); pb.set(x, 1, '#6a6670'); }
      pb.outline(OUTLINE);
      break;
    case 'obsidian_wall':
      pb.rect(1, 8, 30, 22, '#26222e');
      for (let y = 10; y < 30; y += 5) for (let x = 1 + ((y / 5) % 2) * 4; x < 31; x += 8) pb.rect(x, y, 7, 4, shade('#2e2a38', (hash(x, y, 11) - 0.5) * 0.3));
      pb.poly([[1, 8], [6, 2], [12, 8], [20, 3], [31, 8]], '#26222e'); pb.clear(13, 1, 6, 5);
      pb.hline(2, 30, 9, '#4a4058'); pb.line(6, 14, 12, 26, '#120e18'); pb.set(22, 18, '#a070e0'); pb.set(23, 19, '#7a4ac0');
      pb.outline(OUTLINE);
      break;
    case 'royal_statue':
      pb.rect(2, 25, 12, 7, '#4a4452'); pb.hline(2, 13, 25, '#6a6472');
      pb.rect(5, 11, 6, 14, '#6a6472'); pb.disc(8, 7, 3.5, '#6a6472'); pb.clear(9, 2, 4, 6);   // kırık baş
      pb.poly([[5, 5], [6, 2], [7, 4], [8, 1], [9, 4]], '#c8a050');   // taç parçası
      pb.line(5, 13, 2, 19, '#6a6472'); pb.vline(12, 12, 23, '#6a6472'); pb.vline(13, 4, 24, '#8a8494');
      pb.vline(6, 12, 24, '#8a8494'); pb.set(7, 7, '#2a2630');
      pb.outline(OUTLINE);
      break;
    case 'dark_obelisk':
      pb.poly([[3, 31], [5, 6], [8, 0], [11, 6], [13, 31]], '#1e1a26'); pb.poly([[5, 29], [6, 7], [8, 3], [9, 29]], '#34304a');
      pb.vline(8, 7, 26, '#7a4ac0'); pb.set(8, 10, '#e0c8ff'); pb.set(8, 18, '#e0c8ff'); pb.hline(6, 10, 14, '#a070e0');
      pb.ellipse(8, 31, 6, 1.2, '#120e18');
      pb.outline(OUTLINE);
      break;
    case 'throne_banner':
      pb.vline(3, 0, 31, '#3a3028'); pb.set(3, 0, '#c8a050');
      pb.rect(4, 2, 9, 20, '#4a1e2e'); pb.poly([[4, 22], [8, 27], [13, 22]], '#4a1e2e'); pb.vline(12, 2, 22, '#2e1220');
      pb.rect(6, 7, 5, 4, '#c8a050'); pb.set(8, 6, '#c8a050'); pb.set(6, 6, '#c8a050'); pb.set(10, 6, '#c8a050');
      pb.clear(10, 16, 3, 7); pb.rect(1, 30, 6, 2, '#2e2620');
      pb.outline(OUTLINE);
      break;
    case 'bone_heap':
      pb.ellipse(8, 11, 6, 3, '#a8a090'); pb.line(3, 10, 12, 7, '#e0d8c4'); pb.line(5, 12, 13, 11, '#d0c8b4');
      pb.ellipse(7, 8, 2.4, 2, '#e8e0cc'); pb.set(6, 8, '#2a2426'); pb.set(8, 8, '#2a2426');
      pb.outline(OUTLINE);
      break;
    case 'coffin':
      pb.poly([[2, 8], [6, 3], [26, 3], [30, 8], [26, 13], [6, 13]], '#4a3628'); pb.poly([[4, 8], [7, 5], [25, 5], [28, 8], [25, 11], [7, 11]], '#5e4632');
      pb.vline(16, 5, 11, '#c8a050'); pb.hline(13, 19, 7, '#c8a050'); pb.line(22, 4, 28, 9, '#120e10');
      pb.outline(OUTLINE);
      break;
    // ---------------- V4
    case 'stone_column':
      pb.rect(4, 4, 8, 42, '#7a7a86'); pb.vline(4, 4, 45, '#5a5a66'); pb.vline(11, 4, 45, '#5a5a66'); pb.vline(7, 6, 44, '#9a9aa8');
      pb.rect(2, 1, 12, 4, '#8a8a96'); pb.rect(2, 44, 12, 4, '#6a6a76'); pb.hline(2, 13, 1, '#a8a8b4');
      pb.line(5, 16, 10, 22, '#4a4a56'); pb.line(9, 30, 6, 36, '#4a4a56'); pb.set(8, 20, '#9ad0ff');
      pb.ellipse(8, 47, 7, 1.2, '#1a1a20');
      pb.outline(OUTLINE);
      break;
    case 'storm_crystal_big':
      pb.poly([[3, 31], [5, 10], [8, 1], [11, 9], [13, 31]], '#3a5a9a'); pb.poly([[6, 29], [7, 11], [8, 5], [9, 29]], '#9ad0ff');
      pb.line(5, 16, 11, 22, '#ffe070'); pb.set(8, 6, '#ffffff'); pb.ellipse(8, 31, 6, 1.2, '#101828');
      pb.outline(OUTLINE);
      break;
    case 'charged_ruin':
      pb.rect(1, 10, 30, 20, '#5a5e6a');
      for (let y = 12; y < 30; y += 5) for (let x = 1 + ((y / 5) % 2) * 4; x < 31; x += 8) pb.rect(x, y, 7, 4, shade('#62666e', (hash(x, y, 12) - 0.5) * 0.3));
      pb.poly([[1, 10], [8, 4], [14, 10], [22, 6], [31, 10]], '#5a5e6a'); pb.clear(15, 4, 5, 5);
      pb.line(6, 14, 12, 20, '#ffe070'); pb.line(12, 20, 9, 25, '#ffe070'); pb.set(24, 16, '#9ad0ff');
      pb.outline(OUTLINE);
      break;
    case 'fallen_star':
      pb.ellipse(16, 26, 14, 4, '#2a2240'); pb.ellipse(16, 25, 11, 3, '#3a3058');
      pb.poly([[8, 24], [12, 10], [18, 6], [24, 12], [25, 24]], '#5a4a78'); pb.poly([[12, 22], [14, 12], [18, 9], [21, 14], [21, 22]], '#8a7ab8');
      pb.disc(17, 15, 2.6, '#ffe8a0'); pb.set(17, 15, '#ffffff'); pb.set(10, 26, '#ffe8a0'); pb.set(25, 27, '#ffe8a0');
      pb.outline(OUTLINE);
      break;
    case 'astro_dome':
      pb.rect(4, 22, 40, 24, '#4a4666'); pb.hline(4, 43, 22, '#6a6690');
      pb.ellipse(24, 22, 20, 14, '#5a5478'); pb.ellipse(24, 21, 18, 12, '#6e68a0'); pb.clear(24, 8, 6, 8);
      pb.rect(20, 34, 8, 12, '#1e1a30'); pb.rect(21, 35, 6, 11, '#2a2448'); pb.set(24, 39, '#ffe8a0');
      pb.line(29, 9, 38, 3, '#a8a0c8'); pb.disc(38, 3, 1.6, '#ffe8a0');
      pb.line(8, 30, 14, 30, '#3a3656'); pb.line(34, 30, 40, 30, '#3a3656');
      pb.outline(OUTLINE);
      break;
    case 'star_altar':
      pb.rect(3, 16, 26, 14, '#4a4468'); pb.hline(3, 28, 16, '#6a6490'); pb.rect(6, 12, 20, 5, '#5a5480');
      pb.disc(16, 8, 4, '#2a2450'); pb.disc(16, 8, 2.4, '#ffe8a0'); pb.set(16, 8, '#ffffff');
      for (const x of [7, 25]) { pb.vline(x, 2, 12, '#7a72a8'); pb.set(x, 1, '#b0a0ff'); }
      pb.outline(OUTLINE);
      break;
    case 'astral_pillar':
      pb.rect(4, 4, 8, 26, '#5a5478'); pb.vline(4, 4, 29, '#443e5e'); pb.vline(7, 6, 28, '#7a72a8');
      pb.rect(3, 1, 10, 4, '#6e68a0'); pb.rect(3, 28, 10, 3, '#443e5e'); pb.set(8, 12, '#b0a0ff'); pb.set(8, 20, '#ffe8a0');
      pb.outline(OUTLINE);
      break;
    case 'broken_bridge':
      pb.rect(0, 5, 32, 7, '#6a5a48'); for (let x = 0; x < 32; x += 4) pb.vline(x, 5, 11, '#4a3e30');
      pb.clear(13, 4, 7, 9); pb.line(12, 12, 14, 15, '#4a3e30'); pb.line(20, 12, 19, 15, '#4a3e30');
      pb.outline(OUTLINE);
      break;
    case 'storm_tent':
      pb.poly([[2, 44], [24, 6], [46, 44]], '#4a5a7a'); pb.poly([[10, 44], [24, 14], [38, 44]], '#3a4a68');
      pb.poly([[18, 44], [24, 30], [30, 44]], '#1e2230'); pb.line(24, 6, 24, 1, '#5a4a3a'); pb.rect(24, 1, 6, 3, '#ffe070');
      pb.hline(2, 46, 44, '#2a3040');
      pb.outline(OUTLINE);
      break;
    default:
      pb.rect(0, 0, pb.w, pb.h, '#ff00ff');
  }
  return pb;
}

// ------------------------------------------------------------------ tileset montajı
export const TILESET_COLS = 32;

export function buildTileset(onProgress) {
  const count = TILE_DEFS.length;
  const rows = Math.ceil(count / TILESET_COLS);
  const canvas = document.createElement('canvas');
  canvas.width = TILESET_COLS * 32;
  canvas.height = rows * 32;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const stampCache = {};
  TILE_DEFS.forEach((d, i) => {
    let pb;
    if (d.kind === 'terrain') { pb = new PB(S, S); drawTerrain(pb, d.terrain, d.v); }
    else if (d.kind === 'trans') { pb = new PB(S, S); drawTransition(pb, d.over, d.base, d.mask); }
    else if (d.kind === 'mass') { pb = new PB(S, S); drawMass(pb, d.mass, d.part, d.v); }
    else if (d.kind === 'decor') { pb = new PB(S, S); drawDecor(pb, d.name); }
    else if (d.kind === 'stamp') {
      const full = stampCache[d.stamp] || (stampCache[d.stamp] = drawStamp(d.stamp));
      pb = new PB(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) pb.d[y * S + x] = full.d[(d.r * S + y) * full.w + d.c * S + x];
    }
    const col = i % TILESET_COLS, row = Math.floor(i / TILESET_COLS);
    ctx.drawImage(pb.toCanvas(1), col * 32, row * 32, 32, 32);
    if (onProgress && i % 50 === 0) onProgress(i / count);
  });
  return canvas;
}

// Mini harita renkleri (terrain → renk)
export const MINIMAP_COLORS = Object.fromEntries(Object.entries(TERRAIN).map(([k, v]) => [k, v.base]));
export const MASS_COLORS = { forest_mass: '#1e3a1a', hedge_mass: '#24461f', rock_mass: '#1c181e', swamp_mass: '#161e14', dungeon_mass: '#141118', ash_mass: '#1a1416', snow_mass: '#3a5058', ice_mass: '#1a2638', dead_mass: '#26222a', obsidian_mass: '#141018', crypt_mass: '#181c1c', storm_mass: '#1c1e28', star_mass: '#16142a', sanctum_mass: '#18162a' };
export { mix };
