// Envanter / beceri / arayüz ikonları — 16×16 pixel art, DOM için data URL olarak önbelleklenir.
import { PB, shade, OUTLINE } from './pixel.js';
import { ITEMS } from '../data/items.js';
import { STACKABLES } from '../data/materials.js';
import { offhandSprite } from './characters.js';

const cache = new Map();

function diag(pb, x0, y0, x1, y1, c, t = 1) {
  pb.line(x0, y0, x1, y1, c);
  if (t > 1) pb.line(x0 + 1, y0, x1 + 1, y1, c);
}

function itemIcon(t) {
  const pb = new PB(16, 16);
  const L = t.look;
  switch (L.type) {
    case 'sword': case 'greatsword': case 'fang': case 'machete': {
      const m = L.blade;
      const tip = L.type === 'greatsword' ? 1 : 2;
      diag(pb, 6, 10, 14 - tip + 1, tip, m, L.type === 'sword' || L.type === 'fang' ? 1 : 2);
      diag(pb, 5, 10, 13 - tip, tip, shade(m, 0.4));
      if (L.type === 'machete') { pb.line(7, 10, 14, 3, m); pb.line(8, 10, 14, 4, shade(m, -0.2)); }
      if (L.type === 'fang') for (let i = 0; i < 4; i++) pb.set(8 + i * 2, 8 - i * 2, shade(m, -0.35));
      pb.line(3, 9, 7, 13, L.guard); pb.line(3, 10, 6, 13, L.guard);
      pb.line(2, 14, 5, 11, L.grip); pb.set(1, 15, L.guard);
      if (L.gem) pb.set(5, 11, L.gem);
      if (L.glow) { pb.set(10, 3, '#ffffff'); pb.set(13, 6, L.glow); }
      break;
    }
    case 'axe': case 'maul':
      pb.line(2, 14, 11, 5, L.grip); pb.line(3, 14, 12, 5, shade(L.grip, -0.2));
      if (L.type === 'axe') { pb.poly([[9, 2], [15, 5], [14, 10], [10, 8]], L.blade); pb.poly([[10, 3], [14, 5], [11, 6]], shade(L.blade, 0.3)); }
      else { pb.poly([[8, 4], [12, 0], [16, 5], [12, 9]], L.blade); pb.line(9, 4, 12, 1, shade(L.blade, 0.3)); }
      if (L.gem) pb.set(12, 5, L.gem);
      break;
    case 'staff': case 'wand': {
      const long = L.type === 'staff';
      pb.line(long ? 1 : 4, 15, 11, 5, L.shaft); pb.line(long ? 2 : 5, 15, 12, 5, shade(L.shaft, -0.25));
      const hx = 12, hy = 4;
      if (L.head === 'orb' || L.head === 'flame') { pb.disc(hx, hy, 3, L.orb); pb.set(hx - 1, hy - 1, '#ffffff'); if (L.head === 'flame') pb.ring(hx, hy, 3.8, '#f0d080'); }
      if (L.head === 'crystal') { pb.poly([[hx - 2, hy + 3], [hx + 2, hy - 4], [hx + 3, hy + 1]], L.orb); pb.set(hx, hy, '#ffffff'); }
      if (L.head === 'skull') { pb.ellipse(hx, hy, 3, 2.5, L.shaft); pb.set(hx - 1, hy, L.orb); pb.set(hx + 1, hy, L.orb); }
      if (L.head === 'star') { pb.disc(hx, hy, 2, L.orb); pb.set(hx, hy - 3, L.orb); pb.set(hx + 3, hy, L.orb); pb.set(hx - 3, hy, L.orb); pb.set(hx, hy + 3, L.orb); }
      if (L.head === 'root') { pb.line(hx, hy + 1, hx - 2, hy - 3, L.shaft); pb.line(hx, hy + 1, hx + 3, hy - 2, L.shaft); pb.disc(hx, hy - 1, 1.5, L.orb); }
      break;
    }
    case 'shield': case 'focus': case 'mirror': {
      const s = offhandSprite(t.id).pb;
      const big = new PB(16, 16);
      big.blit(s, 2, 2);
      return big;
    }
    case 'helm': case 'greathelm':
      pb.ellipse(8, 8, 6, 5.5, L.main); pb.rect(2, 8, 12, 5, L.main);
      pb.ellipse(7, 6, 3, 2, shade(L.main, 0.3)); pb.hline(2, 13, 9, L.trim);
      if (L.type === 'greathelm') { pb.hline(5, 12, 11, '#1a1418'); pb.vline(8, 3, 13, L.trim); }
      else { pb.vline(8, 9, 13, L.main); pb.clear(3, 11, 4, 3); pb.clear(10, 11, 4, 3); }
      if (L.horn) { pb.line(2, 6, 0, 1, '#e8dcc0'); pb.line(13, 6, 15, 1, '#e8dcc0'); }
      break;
    case 'hood':
      pb.ellipse(8, 8, 6.5, 6.5, L.main); pb.ellipse(9, 10, 3.5, 4, '#2a2030'); pb.hline(3, 13, 4, L.trim);
      break;
    case 'hat':
      pb.ellipse(8, 12, 7.5, 2.5, shade(L.main, -0.2)); pb.poly([[4, 12], [8, 1], [12, 12]], L.main); pb.line(8, 1, 12, 3, L.main);
      pb.hline(4, 12, 10, L.trim); pb.set(8, 6, L.trim);
      break;
    case 'armor':
      pb.poly([[3, 2], [6, 1], [10, 1], [13, 2], [14, 6], [12, 7], [12, 15], [4, 15], [4, 7], [2, 6]], L.main);
      pb.vline(8, 3, 14, L.trim); pb.hline(4, 11, 10, L.trim); pb.ellipse(6, 5, 2, 1.5, shade(L.main, 0.3));
      if (L.tier >= 2) { pb.rect(2, 2, 4, 3, shade(L.main, 0.25)); pb.rect(11, 2, 4, 3, shade(L.main, 0.15)); }
      if (L.tier >= 4) { pb.set(8, 6, L.trim); pb.set(7, 6, '#ffffff'); }
      break;
    case 'robe':
      pb.poly([[4, 1], [12, 1], [13, 5], [14, 15], [2, 15], [3, 5]], L.main);
      pb.vline(8, 2, 15, L.trim); pb.hline(2, 13, 14, L.trim); pb.poly([[6, 1], [8, 4], [10, 1]], '#2a2030');
      if (L.tier >= 2) pb.hline(3, 12, 6, L.trim);
      break;
    case 'gloves': case 'gauntlet':
      pb.rect(4, 6, 7, 8, L.main); pb.rect(4, 2, 2, 5, L.main); pb.rect(6, 1, 2, 6, L.main); pb.rect(8, 2, 2, 5, L.main); pb.rect(11, 6, 2, 4, L.main);
      pb.rect(3, 12, 9, 3, shade(L.main, -0.25));
      if (L.type === 'gauntlet') { pb.hline(4, 10, 8, shade(L.main, 0.35)); pb.hline(4, 10, 10, shade(L.main, 0.35)); }
      if (L.gem) pb.set(7, 9, L.gem);
      break;
    case 'boots': case 'greaves':
      pb.rect(3, 2, 6, 9, L.main); pb.rect(3, 10, 11, 4, L.main); pb.hline(3, 13, 14, shade(L.main, -0.4));
      pb.hline(3, 8, 3, shade(L.main, 0.3)); if (L.type === 'greaves') { pb.rect(3, 5, 6, 2, shade(L.main, 0.3)); }
      break;
    case 'ring':
      pb.ring(8, 9, 5, L.band, 2); pb.set(5, 6, shade(L.band, 0.4));
      if (L.gem) { pb.disc(8, 4, 2.5, L.gem); pb.set(7, 3, '#ffffff'); }
      break;
    case 'amulet': case 'medal':
      pb.line(3, 1, 8, 8, L.chain); pb.line(13, 1, 8, 8, L.chain);
      if (L.type === 'medal') { pb.disc(8, 11, 4, L.chain); pb.disc(8, 11, 2.5, L.gem); pb.set(8, 11, '#ffffff'); }
      else { pb.poly([[5, 9], [8, 6], [11, 9], [8, 15]], L.gem); pb.set(7, 9, '#ffffff'); }
      break;
    default:
      pb.rect(2, 2, 12, 12, '#ff00ff');
  }
  return pb;
}

function stackIcon(st) {
  const pb = new PB(16, 16);
  const L = st.look;
  const c = L.c;
  switch (L.type) {
    case 'fur': pb.ellipse(8, 9, 6, 4.5, c); for (let i = 0; i < 6; i++) pb.line(3 + i * 2, 6, 4 + i * 2, 4, shade(c, -0.2)); pb.ellipse(7, 8, 3, 2, shade(c, 0.2)); break;
    case 'tooth': pb.poly([[5, 2], [11, 2], [9, 14], [8, 15]], c); pb.vline(7, 3, 10, '#ffffff'); break;
    case 'claw': for (let i = 0; i < 3; i++) { pb.line(3 + i * 4, 13, 6 + i * 4, 3, c); pb.line(4 + i * 4, 13, 7 + i * 4, 4, shade(c, -0.3)); } break;
    case 'vial': case 'potion': {
      const size = L.size ?? 1;
      const r = Math.min(5.5, 3 + size);
      pb.rect(6, 1, 4, 3, '#d8d0c0'); pb.rect(6, 1, 4, 1, size >= 3 ? '#e0b040' : '#8a6238');
      pb.disc(8, 10, r, '#c8e0e8'); pb.disc(8, 10.5, r - 1, c); pb.set(6, 8, '#ffffff'); pb.set(6, 9, shade(c, 0.5));
      break;
    }
    case 'book':
      pb.rect(3, 2, 10, 12, shade(c, -0.25)); pb.rect(4, 2, 9, 11, c); pb.rect(4, 12, 9, 2, '#f0e8d0');
      pb.vline(4, 2, 13, shade(c, -0.45)); pb.disc(9, 7, 2.2, '#ffd060'); pb.set(9, 7, '#ffffff'); pb.hline(6, 12, 4, shade(c, 0.35));
      break;
    case 'bottle': pb.rect(6, 1, 4, 3, '#d8d0c0'); pb.disc(8, 10, 4.5, '#c8e0e8'); pb.disc(8, 10, 3.5, '#e8f4f8'); pb.set(6, 8, '#ffffff'); break;
    case 'log': pb.rect(1, 6, 13, 6, c); pb.ellipse(14, 9, 2, 3, '#c09a68'); pb.hline(2, 12, 8, shade(c, 0.2)); break;
    case 'cloth': pb.poly([[2, 4], [13, 2], [14, 12], [3, 14]], c); pb.line(3, 8, 13, 7, shade(c, -0.25)); pb.line(5, 4, 6, 13, shade(c, 0.2)); break;
    case 'herb': for (let i = 0; i < 5; i++) pb.line(8, 15, 3 + i * 2.5, 3 + (i % 2) * 3, c); pb.ellipse(5, 4, 2, 1.5, shade(c, 0.3)); pb.ellipse(11, 5, 2, 1.5, shade(c, 0.3)); break;
    case 'scrap': pb.poly([[2, 12], [6, 4], [9, 7], [14, 3], [12, 13]], c); pb.line(5, 9, 10, 8, shade(c, -0.3)); pb.set(6, 6, shade(c, 0.4)); break;
    case 'ore': pb.poly([[2, 13], [3, 6], [8, 2], [13, 5], [14, 13]], c); pb.set(6, 7, L.s); pb.set(10, 9, L.s); pb.set(8, 11, L.s); pb.set(11, 6, '#ffffff'); break;
    case 'wing': pb.poly([[1, 3], [15, 8], [10, 10], [8, 14], [5, 9]], c); pb.line(1, 3, 8, 12, shade(c, -0.3)); pb.line(1, 3, 12, 9, shade(c, -0.3)); break;
    case 'shell': pb.ellipse(8, 9, 6.5, 5, c); pb.ellipse(7, 7, 4, 2.5, shade(c, 0.3)); pb.vline(8, 4, 14, shade(c, -0.3)); break;
    case 'blob': pb.ellipse(8, 10, 6, 4.5, c); pb.ellipse(6, 8, 2.5, 1.5, shade(c, 0.25)); pb.set(11, 11, shade(c, -0.3)); break;
    case 'crystal': pb.poly([[4, 14], [6, 4], [8, 1], [10, 4], [12, 14]], c); pb.vline(8, 4, 12, shade(c, 0.5)); pb.poly([[10, 14], [13, 8], [15, 14]], shade(c, -0.2)); break;
    case 'plate': pb.poly([[2, 4], [12, 2], [14, 10], [4, 14]], c); pb.line(3, 5, 12, 3, shade(c, 0.3)); pb.set(6, 8, '#3a3a34'); pb.set(10, 7, '#3a3a34'); break;
    case 'badge': pb.disc(8, 8, 6, c); pb.disc(8, 8, 4, shade(c, -0.25)); pb.poly([[8, 4], [10, 8], [8, 12], [6, 8]], shade(c, 0.4)); break;
    case 'seal': pb.disc(8, 8, 6, c); pb.ring(8, 8, 4, shade(c, 0.4)); pb.disc(8, 8, 1.5, '#ffd0c0'); break;
    case 'shard': pb.poly([[3, 14], [5, 3], [12, 1], [14, 12]], c); pb.line(6, 4, 11, 10, L.s); pb.set(9, 6, '#ffffff'); break;
    case 'core': pb.disc(8, 8, 6, shade(c, -0.3)); pb.disc(8, 8, 4.5, c); pb.disc(7, 7, 2, '#fff8d0'); pb.ring(8, 8, 6.5, '#a08030'); break;
    case 'dust': pb.ellipse(8, 11, 6, 3, c); pb.ellipse(8, 9, 4, 3, shade(c, 0.2)); pb.set(5, 7, '#ffffff'); pb.set(11, 6, '#ffffff'); break;
    case 'ingot': pb.poly([[1, 11], [4, 6], [15, 6], [12, 11]], c); pb.poly([[1, 11], [12, 11], [12, 13], [1, 13]], shade(c, -0.3)); pb.hline(5, 13, 7, shade(c, 0.35)); break;
    case 'stone': pb.ellipse(8, 9, 6, 5, c); pb.ellipse(7, 7, 3, 2, shade(c, 0.35)); pb.line(5, 10, 11, 9, '#e0f0ff'); break;
    case 'essence': pb.disc(8, 8, 5, c, 230); pb.disc(8, 8, 3, shade(c, 0.4)); pb.set(7, 7, '#ffffff'); pb.set(3, 3, c); pb.set(13, 4, c); pb.set(12, 13, c); break;
    default: pb.rect(3, 3, 10, 10, c || '#ff00ff');
  }
  return pb;
}

const SKILL_ART = {
  // V2
  blade_rain: (pb) => {
    pb.rect(0, 0, 16, 5, '#3a3050');
    for (const [x, y] of [[3, 3], [8, 1], [12, 4], [6, 8], [11, 9]]) { pb.vline(x, y, y + 5, '#e0e8f0'); pb.set(x, y + 6, '#c0a040'); pb.set(x, y - 1, '#ffffff'); }
    pb.hline(1, 14, 15, '#8a7a6a');
  },
  chain_lightning: (pb) => {
    pb.line(1, 3, 6, 7, '#e0e8ff'); pb.line(6, 7, 4, 10, '#e0e8ff'); pb.line(4, 10, 10, 9, '#9ab0ff'); pb.line(10, 9, 14, 14, '#e0e8ff');
    for (const [x, y] of [[6, 7], [10, 9], [14, 14]]) { pb.disc(x, y, 1.5, '#6a7aff'); pb.set(x, y, '#ffffff'); }
  },
  heavy_strike: (pb) => { pb.line(3, 13, 12, 4, '#d0d8e0'); pb.line(4, 13, 13, 4, '#ffffff'); pb.line(2, 11, 5, 14, '#8a6238'); pb.disc(12, 4, 3, '#ffd060', 200); },
  whirlwind: (pb) => { for (let t = 0; t < 12; t += 0.1) pb.set(8 + Math.cos(t) * t * 0.55, 8 + Math.sin(t) * t * 0.55, t > 8 ? '#ffffff' : '#a0c0e0'); },
  iron_skin: (pb) => { pb.poly([[2, 2], [14, 2], [14, 8], [8, 15], [2, 8]], '#8a929c'); pb.poly([[4, 4], [8, 4], [8, 12], [4, 8]], '#b0b8c4'); },
  war_charge: (pb) => { pb.poly([[2, 6], [10, 6], [10, 3], [15, 8], [10, 13], [10, 10], [2, 10]], '#e0a040'); pb.hline(0, 3, 4, '#ffffff'); pb.hline(0, 4, 12, '#ffffff'); },
  fireball: (pb) => { pb.disc(9, 7, 5, '#e04a1a'); pb.disc(9, 7, 3.5, '#f09030'); pb.disc(10, 6, 1.8, '#fff0a0'); pb.line(1, 14, 5, 10, '#f09030'); pb.line(3, 15, 6, 12, '#e04a1a'); },
  ice_blast: (pb) => { for (let k = 0; k < 6; k++) { const t = k / 6 * Math.PI * 2; pb.line(8, 8, 8 + Math.cos(t) * 7, 8 + Math.sin(t) * 7, '#a0e0ff'); } pb.disc(8, 8, 2, '#ffffff'); },
  mana_shield: (pb) => { pb.disc(8, 8, 7, '#2a5ad0'); pb.disc(8, 8, 5.5, '#4a8aff'); pb.disc(6, 6, 2, '#c0e0ff'); },
  meteor: (pb) => { for (let k = 0; k < 6; k++) pb.disc(4 + k * 0.8, 3 + k * 0.8, 2.5 - k * 0.2, '#f0a030'); pb.disc(11, 11, 4, '#7a4a32'); pb.disc(12, 12, 2, '#f06020'); },
  weapon_discipline: (pb) => { pb.line(2, 14, 13, 3, '#d0d8e0'); pb.line(3, 3, 14, 14, '#d0d8e0'); pb.disc(8, 8, 2, '#ffd060'); },
  hard_skin: (pb) => { pb.disc(5, 6, 3, '#e04848'); pb.disc(11, 6, 3, '#e04848'); pb.poly([[2, 7], [14, 7], [8, 14]], '#e04848'); pb.ring(8, 8, 7, '#8a929c'); },
  battle_rhythm: (pb) => { pb.ellipse(8, 10, 6, 4, '#a0703a'); pb.ellipse(8, 8, 6, 2.5, '#e0d0b0'); pb.line(3, 1, 7, 7, '#6a4628'); pb.line(13, 1, 9, 7, '#6a4628'); },
  elemental_mastery: (pb) => { pb.poly([[4, 14], [6, 5], [8, 9], [9, 2], [12, 14]], '#f07a20'); pb.disc(11, 11, 3, '#4a8aff'); },
  mana_control: (pb) => { for (let t = 0; t < 10; t += 0.1) pb.set(8 + Math.cos(t * 1.4) * t * 0.6, 8 + Math.sin(t * 1.4) * t * 0.6, '#5aa0ff'); pb.disc(8, 8, 1.5, '#ffffff'); },
  frozen_target: (pb) => { pb.ring(8, 8, 6, '#a0e0ff', 2); pb.hline(0, 15, 8, '#e0f8ff'); pb.vline(8, 0, 15, '#e0f8ff'); pb.disc(8, 8, 1.5, '#4a8aff'); },
  unyielding_will: (pb) => { pb.poly([[2, 2], [14, 2], [14, 8], [8, 15], [2, 8]], '#e0b040'); pb.poly([[5, 5], [11, 5], [11, 8], [8, 12], [5, 8]], '#fff0a0'); },
  arcane_resonance: (pb) => { pb.ring(8, 8, 6, '#c070ff', 2); pb.poly([[8, 3], [12, 11], [4, 11]], '#e0b0ff'); pb.disc(8, 9, 1.5, '#ffffff'); },
};

const UI_ART = {
  bag: (pb) => { pb.ellipse(8, 10, 6, 5, '#a07a48'); pb.rect(5, 3, 6, 3, '#8a6238'); pb.hline(3, 12, 6, '#5a3a20'); pb.rect(7, 8, 2, 3, '#e0c060'); },
  char: (pb) => { pb.disc(8, 5, 3, '#e8b890'); pb.poly([[3, 15], [4, 9], [12, 9], [13, 15]], '#5a7aaa'); },
  skills: (pb) => { pb.rect(2, 2, 12, 12, '#6a3a8a'); pb.rect(3, 3, 10, 10, '#8a5aaa'); pb.vline(8, 3, 12, '#4a2a6a'); pb.disc(8, 8, 2, '#ffe060'); },
  quests: (pb) => { pb.rect(3, 2, 10, 12, '#e8dcb8'); pb.hline(5, 11, 5, '#6a5a3a'); pb.hline(5, 10, 8, '#6a5a3a'); pb.hline(5, 11, 11, '#6a5a3a'); pb.rect(2, 1, 12, 2, '#c0a878'); pb.rect(2, 13, 12, 2, '#c0a878'); },
  history: (pb) => { pb.rect(2, 2, 12, 12, '#5a3a2a'); pb.rect(3, 3, 10, 10, '#8a6a4a'); pb.disc(8, 7, 3, '#e8e0cc'); pb.set(7, 7, '#2a2426'); pb.set(9, 7, '#2a2426'); pb.rect(7, 9, 3, 1, '#d0c8b4'); pb.line(4, 12, 12, 12, '#ffd060'); },
  map: (pb) => { pb.poly([[1, 3], [6, 1], [10, 3], [15, 1], [15, 13], [10, 15], [6, 13], [1, 15]], '#d8c898'); pb.line(6, 1, 6, 13, '#a89868'); pb.line(10, 3, 10, 15, '#a89868'); pb.set(12, 6, '#e04848'); pb.set(4, 9, '#3a8a3a'); },
  settings: (pb) => { pb.disc(8, 8, 6, '#8a8a96'); for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; pb.rect(8 + Math.cos(t) * 6 - 1, 8 + Math.sin(t) * 6 - 1, 2, 2, '#8a8a96'); } pb.disc(8, 8, 2.5, '#2a2a32'); },
  gold: (pb) => { pb.disc(8, 8, 6, '#c89a20'); pb.disc(8, 8, 4.5, '#f0c840'); pb.vline(8, 5, 11, '#c89a20'); pb.set(6, 6, '#fff0a0'); },
  lock: (pb) => { pb.ring(8, 6, 3.5, '#a0a0aa', 2); pb.rect(3, 7, 10, 8, '#e0b040'); pb.rect(7, 9, 2, 3, '#5a3a20'); },
  star: (pb) => { pb.poly([[8, 1], [10, 6], [15, 6], [11, 9], [13, 15], [8, 11], [3, 15], [5, 9], [1, 6], [6, 6]], '#ffd040'); },
  sword: (pb) => { pb.line(3, 13, 13, 3, '#e0e8f0'); pb.line(4, 13, 14, 3, '#a0a8b0'); pb.line(2, 10, 6, 14, '#c0a040'); pb.line(1, 15, 3, 13, '#6a4628'); },
  target: (pb) => { pb.ring(8, 8, 6.5, '#ff6a4a', 2); pb.ring(8, 8, 3, '#ff6a4a'); pb.set(8, 8, '#ffffff'); pb.line(13, 2, 15, 0, '#ffffff'); },
  menu: (pb) => { pb.rect(2, 3, 12, 2, '#e8dcc0'); pb.rect(2, 7, 12, 2, '#e8dcc0'); pb.rect(2, 11, 12, 2, '#e8dcc0'); },
  storage: (pb) => { pb.rect(1, 5, 14, 10, '#8a5a32'); pb.rect(1, 3, 14, 3, '#a87040'); pb.rect(7, 7, 2, 3, '#e0c060'); },
  hammer: (pb) => { pb.rect(3, 2, 10, 5, '#8a8a96'); pb.line(8, 7, 8, 15, '#8a6238'); pb.hline(3, 12, 2, '#b0b0bc'); },
  coin: (pb) => UI_ART.gold(pb),
  pending: (pb) => { pb.ellipse(8, 10, 6, 5, '#c070ff'); pb.rect(5, 3, 6, 3, '#9a50d0'); pb.rect(7, 8, 2, 3, '#ffffff'); },
  sort: (pb) => { pb.rect(2, 3, 12, 2, '#e8dcc0'); pb.rect(2, 7, 9, 2, '#e8dcc0'); pb.rect(2, 11, 6, 2, '#e8dcc0'); },
  exit: (pb) => { pb.rect(2, 2, 8, 12, '#6a4628'); pb.poly([[9, 8], [14, 4], [14, 12]], '#e0c060'); },
};

export function iconPB(key) {
  let pb = null;
  if (key.startsWith('skill:')) { pb = new PB(16, 16); pb.rect(0, 0, 16, 16, '#1e1a28'); (SKILL_ART[key.slice(6)] || (() => {}))(pb); }
  else if (key.startsWith('ui:')) { pb = new PB(16, 16); (UI_ART[key.slice(3)] || (() => pb.rect(4, 4, 8, 8, '#f0f')))(pb); }
  else if (key.startsWith('q:')) { pb = new PB(16, 16); pb.rect(3, 2, 10, 12, '#e0c060'); pb.rect(5, 4, 6, 8, '#f8e8a0'); pb.set(8, 7, '#a02020'); }
  else if (ITEMS[key]) pb = itemIcon(ITEMS[key]);
  else if (STACKABLES[key]) pb = stackIcon(STACKABLES[key]);
  else { pb = new PB(16, 16); pb.rect(2, 2, 12, 12, '#ff00ff'); }
  pb.outline(OUTLINE);
  return pb;
}

export function iconURL(key) {
  if (cache.has(key)) return cache.get(key);
  const url = iconPB(key).toCanvas(3).toDataURL();
  cache.set(key, url);
  return url;
}

