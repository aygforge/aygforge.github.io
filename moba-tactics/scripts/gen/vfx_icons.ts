import { PC, hex, ramp, hash2, RGBA, mix } from './canvas';
import { CHAMP_ART, renderFrame } from './champions';

export interface VfxDef { key: string; size: number; frames: number; rate: number; loop?: boolean; draw: (c: PC, i: number, n: number) => void }

const H = (h: string, a = 255) => hex(h, a);
function burst(cols: string[], rays = 0, ring = false, smoke = false) {
  return (c: PC, i: number, n: number) => {
    const s = c.w / 2, t = i / (n - 1);
    const r = s * (0.25 + t * 0.7);
    const fade = 1 - t;
    if (smoke) for (let k = 0; k < 10; k++) { const a = hash2(k, 1, 3) * Math.PI * 2, d = r * (0.5 + hash2(k, 2, 3) * 0.5); c.ellS(s + Math.cos(a) * d * 0.8, s + Math.sin(a) * d * 0.8 - t * 4, s * 0.22 * (1 - t * 0.5), s * 0.2 * (1 - t * 0.5), ramp(mix(H('#606060'), H(cols[0]), 0.3))); }
    c.glow(s, s, r * 1.1, H(cols[0], Math.round(230 * fade)));
    if (!ring) c.ellS(s, s, r * 0.55 * (1 - t * 0.6), r * 0.55 * (1 - t * 0.6), ramp(cols[1] ?? cols[0]));
    if (ring) c.ring(s, s, r, r, H(cols[1] ?? cols[0], Math.round(255 * fade)), Math.max(1, 3 * fade));
    if (t < 0.4) c.ellS(s, s, r * 0.25, r * 0.25, ramp(cols[2] ?? '#ffffff'));
    for (let k = 0; k < rays; k++) {
      const a = (k / rays) * Math.PI * 2 + hash2(k, 5, 1);
      const d0 = r * 0.6, d1 = r * (1.0 + 0.2 * hash2(k, 6, 1));
      c.line(s + Math.cos(a) * d0, s + Math.sin(a) * d0, s + Math.cos(a) * d1, s + Math.sin(a) * d1, H(cols[2] ?? cols[0], Math.round(255 * fade)), 1);
    }
  };
}
function orb(core: string, glow: string, trail = 0) {
  return (c: PC, i: number) => {
    const s = c.w / 2;
    for (let k = 1; k <= trail; k++) c.ellS(s - k * 2.5, s + Math.sin(i + k) * 0.6, 2.5 - k * 0.5, 2.5 - k * 0.5, ramp(glow));
    c.glow(s, s, s * 0.9, H(glow, 200));
    c.ellS(s, s, s * 0.35 + (i % 2) * 0.5, s * 0.35 + (i % 2) * 0.5, ramp(core));
  };
}
function puff(col: string) {
  return (c: PC, i: number, n: number) => {
    const s = c.w / 2, t = i / (n - 1);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2, d = s * 0.6 * t;
      c.ellS(s + Math.cos(a) * d, s + Math.sin(a) * d - t * 3, s * 0.3 * (1 - t * 0.6), s * 0.3 * (1 - t * 0.6), ramp(mix(H(col), [0, 0, 0, 255], 0.1)));
    }
    if (t > 0.6) { const k2 = c.withAlpha(1.6 - t); c.clear(); c.blit(k2, 0, 0); }
  };
}
function sparkle(col: string) {
  return (c: PC, i: number, n: number) => {
    const s = c.w / 2;
    for (let k = 0; k < 8; k++) {
      const x = s + (hash2(k, 1, 7) - 0.5) * s * 1.6, y = s + (hash2(k, 2, 7) - 0.5) * s * 1.2 - (i / n) * s * 0.8;
      const on = (k + i) % 3 !== 0;
      if (on) { c.set(x, y, H('#ffffff')); c.set(x - 1, y, H(col)); c.set(x + 1, y, H(col)); c.set(x, y - 1, H(col)); c.set(x, y + 1, H(col)); }
    }
  };
}
function slash(col: string, wide = 1) {
  return (c: PC, i: number, n: number) => {
    const s = c.w / 2, t = i / (n - 1);
    const a0 = -1.4 * wide + t * 0.6, a1 = a0 + 1.8 * wide * Math.min(1, t * 2 + 0.3);
    for (let a = a0; a < a1; a += 0.05) {
      const k = (a - a0) / (a1 - a0);
      const r = s * 0.8;
      c.set(s + Math.cos(a) * r, s + Math.sin(a) * r, H(col, Math.round(255 * (1 - t) * k)));
      c.set(s + Math.cos(a) * (r - 1), s + Math.sin(a) * (r - 1), H('#ffffff', Math.round(230 * (1 - t) * k)));
      c.set(s + Math.cos(a) * (r - 2), s + Math.sin(a) * (r - 2), H(col, Math.round(160 * (1 - t) * k)));
    }
  };
}
function ground(col: string, kind: 'ice' | 'fire' | 'poison' | 'void' | 'rune') {
  return (c: PC, i: number) => {
    const s = c.w / 2;
    c.ell(s, s, s - 1, s * 0.55, H(col, 70));
    c.ring(s, s, s - 1, s * 0.55, H(col, 170), 1);
    for (let k = 0; k < 14; k++) {
      const a = hash2(k, 3, kind.length) * Math.PI * 2, d = Math.sqrt(hash2(k, 4, 9)) * (s - 3);
      const x = s + Math.cos(a) * d, y = s + Math.sin(a) * d * 0.55;
      const ph = (k + i) % 4;
      if (kind === 'fire') { c.line(x, y, x, y - 2 - ph, H(ph < 2 ? '#ffd040' : '#ff6020'), 1); }
      else if (kind === 'ice') { c.set(x, y, H('#e0f8ff')); if (ph === 0) c.set(x, y - 1, H('#ffffff')); }
      else if (kind === 'poison') { c.ellS(x, y - ph, 1.5, 1.5, ramp('#70d040')); }
      else if (kind === 'rune') { c.rect(x, y, 2, 1, H('#a0fff0', 200)); }
      else { c.set(x, y, H(ph % 2 ? '#d0a0ff' : '#6020a0')); }
    }
  };
}
function arrow(shaft: string, head: string, len: number, fletch = '#e0e0d0') {
  return (c: PC) => {
    const s = c.h / 2;
    c.line(c.w / 2 - len / 2, s, c.w / 2 + len / 2, s, H(shaft), 1);
    c.polyS([[c.w / 2 + len / 2 + 3, s], [c.w / 2 + len / 2 - 1, s - 2], [c.w / 2 + len / 2 - 1, s + 2]], ramp(head));
    c.line(c.w / 2 - len / 2, s - 1, c.w / 2 - len / 2 + 2, s - 1, H(fletch), 1);
    c.line(c.w / 2 - len / 2, s + 1, c.w / 2 - len / 2 + 2, s + 1, H(fletch), 1);
  };
}

export const VFX: VfxDef[] = [
  { key: 'fireExplosion', size: 64, frames: 7, rate: 18, draw: burst(['#ff8020', '#ffb040', '#fff0a0'], 8, false, true) },
  { key: 'explosion', size: 64, frames: 7, rate: 18, draw: burst(['#ff9a30', '#ffd060', '#ffffff'], 10, false, true) },
  { key: 'bigExplosion', size: 96, frames: 8, rate: 16, draw: burst(['#ff7020', '#ffc040', '#ffffff'], 14, false, true) },
  { key: 'smallBoom', size: 32, frames: 5, rate: 20, draw: burst(['#ffa030', '#ffe080'], 6) },
  { key: 'iceBurst', size: 64, frames: 6, rate: 16, draw: burst(['#7fdcff', '#cff4ff', '#ffffff'], 10, true) },
  { key: 'voidBurst', size: 64, frames: 6, rate: 16, draw: burst(['#9a40ff', '#d0a0ff', '#ffffff'], 8) },
  { key: 'poisonBurst', size: 48, frames: 6, rate: 16, draw: burst(['#60e030', '#a0ff70'], 0, false, true) },
  { key: 'shadowPuff', size: 48, frames: 6, rate: 16, draw: puff('#3a2a4a') },
  { key: 'smoke', size: 64, frames: 6, rate: 12, draw: puff('#7a7480') },
  { key: 'hitSpark', size: 24, frames: 4, rate: 24, draw: burst(['#ffffff', '#ffe0a0'], 6, true) },
  { key: 'slash', size: 48, frames: 4, rate: 20, draw: slash('#e0e8ff') },
  { key: 'bloodSlash', size: 48, frames: 4, rate: 20, draw: slash('#ff3040', 1.2) },
  { key: 'wideSlash', size: 64, frames: 5, rate: 18, draw: slash('#ffd0a0', 1.6) },
  { key: 'riftSlash', size: 48, frames: 4, rate: 20, draw: slash('#40f0ff', 1.1) },
  { key: 'heal', size: 32, frames: 6, rate: 12, draw: sparkle('#60ff80') },
  { key: 'levelUp', size: 48, frames: 6, rate: 12, draw: sparkle('#ffe060') },
  { key: 'stun', size: 32, frames: 4, rate: 10, loop: true, draw: (c, i) => { for (let k = 0; k < 3; k++) { const a = (i / 4) * Math.PI * 2 + (k * Math.PI * 2) / 3; const x = 16 + Math.cos(a) * 9, y = 16 + Math.sin(a) * 3; c.set(x, y, H('#ffff80')); c.set(x - 1, y, H('#ffd040')); c.set(x + 1, y, H('#ffd040')); c.set(x, y - 1, H('#ffd040')); c.set(x, y + 1, H('#ffd040')); } } },
  { key: 'shieldBubble', size: 64, frames: 4, rate: 8, loop: true, draw: (c, i) => { c.ell(32, 32, 26, 28, H('#80c0ff', 40)); c.ring(32, 32, 26, 28, H('#a0d8ff', 170 + (i % 2) * 40), 1); c.line(18 + i * 2, 14, 24 + i * 2, 10, H('#ffffff', 200), 1); } },
  { key: 'frostRoot', size: 48, frames: 4, rate: 8, loop: true, draw: (c, i) => { for (let k = 0; k < 6; k++) { const x = 10 + k * 5.5; c.polyS([[x - 2, 40], [x, 26 + ((k + i) % 3) * 2], [x + 2, 40]], ramp('#9fe8ff')); } } },
  { key: 'recallRing', size: 64, frames: 6, rate: 10, loop: true, draw: (c, i) => { c.ring(32, 46, 22, 9, H('#60b0ff', 200), 2); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + i * 0.5; const x = 32 + Math.cos(a) * 20, y = 46 + Math.sin(a) * 8 - ((k * 7 + i * 6) % 34); c.rect(x, y, 2, 3, H('#bfe4ff')); } c.glow(32, 30, 18, H('#60b0ff', 90)); } },
  { key: 'deathPuff', size: 48, frames: 6, rate: 12, draw: puff('#5a5060') },
  { key: 'crystalShatter', size: 96, frames: 8, rate: 12, draw: (c, i, n) => { burst(['#ffffff', '#c0e0ff'], 16)(c, i, n); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, d = 6 + i * 5; const x = 48 + Math.cos(a) * d, y = 48 + Math.sin(a) * d * 0.7 + i * i * 0.3; c.polyS([[x, y - 3], [x + 2, y], [x, y + 3], [x - 2, y]], ramp(k % 2 ? '#60b0ff' : '#ff6060')); } } },
  { key: 'towerRubble', size: 64, frames: 6, rate: 10, draw: puff('#9a9488') },
  { key: 'quake', size: 96, frames: 6, rate: 14, draw: (c, i, n) => { const t = i / (n - 1); c.ring(48, 48, 10 + t * 36, 6 + t * 20, H('#c0a070', Math.round(255 * (1 - t))), 3); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; c.rectS(48 + Math.cos(a) * (8 + t * 30), 48 + Math.sin(a) * (5 + t * 16) - (1 - Math.abs(t - 0.5) * 2) * 6, 3, 3, ramp('#8a7a5a')); } } },
  { key: 'bloodNova', size: 96, frames: 6, rate: 14, draw: burst(['#c01030', '#ff3050', '#ffd0d0'], 16, true) },
  { key: 'titanSlam', size: 96, frames: 6, rate: 14, draw: (c, i, n) => { burst(['#40e0ff', '#b0f4ff'], 12, true)(c, i, n); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.rectS(48 + Math.cos(a) * (10 + i * 6), 48 + Math.sin(a) * (6 + i * 4), 4, 3, ramp('#7a8290')); } } },
  { key: 'telegraph', size: 64, frames: 1, rate: 1, draw: (c) => { c.ell(32, 32, 31, 31, H('#ff2020', 50)); c.ring(32, 32, 31, 31, H('#ff4040', 200), 2); } },
  { key: 'meteor', size: 48, frames: 4, rate: 16, draw: (c, i) => { c.line(10 + i * 2, 4, 26 + i * 2, 30, H('#ff8020', 160), 4); c.glow(28, 32, 12, H('#ff6010', 220)); c.ellS(28, 32, 5, 5, ramp('#ffb040')); } },
  { key: 'goldCoin', size: 16, frames: 4, rate: 12, loop: true, draw: (c, i) => { const w = [4, 2.5, 1, 2.5][i]; c.ellS(8, 8, w, 4, ramp('#ffd040')); c.set(8, 6, H('#fff8c0')); } },
  { key: 'speedBuff', size: 32, frames: 4, rate: 12, loop: true, draw: (c, i) => { for (let k = 0; k < 3; k++) c.line(4 + k * 3, 10 + k * 6 + i, 14 + k * 3, 10 + k * 6 + i, H('#80ffe0', 200), 1); } },
  { key: 'runeBuild', size: 48, frames: 6, rate: 12, draw: (c, i, n) => { ground('#40f0d0', 'rune')(c, i); c.glow(24, 24, 6 + i * 2, H('#40f0d0', Math.round(200 * (1 - i / n)))); } },
  { key: 'soulWisp', size: 16, frames: 4, rate: 12, loop: true, draw: orb('#c0ffd0', '#60ff90') },
  { key: 'hawk', size: 32, frames: 4, rate: 12, loop: true, draw: (c, i) => { const f = [0, -3, 0, 3][i]; c.ellS(16, 16, 4, 2.5, ramp('#8a6a40')); c.polyS([[14, 16], [4, 13 + f], [12, 18]], ramp('#6a4a2a')); c.polyS([[18, 16], [28, 13 + f], [20, 18]], ramp('#6a4a2a')); c.set(19, 15, H('#ffd040')); } },
  { key: 'flameGround', size: 96, frames: 4, rate: 10, loop: true, draw: ground('#ff6020', 'fire') },
  { key: 'frostGround', size: 96, frames: 4, rate: 8, loop: true, draw: ground('#7fdcff', 'ice') },
  { key: 'poisonGround', size: 96, frames: 4, rate: 8, loop: true, draw: ground('#60d030', 'poison') },
  { key: 'voidGround', size: 64, frames: 4, rate: 8, loop: true, draw: ground('#9a40ff', 'void') },
  { key: 'fortressGround', size: 96, frames: 4, rate: 8, loop: true, draw: ground('#ffe080', 'rune') },
  { key: 'hawkGround', size: 96, frames: 1, rate: 1, draw: (c) => { c.ring(48, 48, 46, 26, H('#a0e0ff', 140), 1); } },
  // projectiles
  { key: 'p_arrow', size: 24, frames: 1, rate: 1, draw: arrow('#8a6a40', '#d0d0d8', 14) },
  { key: 'p_pierceArrow', size: 32, frames: 2, rate: 12, loop: true, draw: (c, i) => { c.glow(18, 16, 8, H('#ffe880', 150 + i * 40)); arrow('#d0b060', '#fff0a0', 20)(c); } },
  { key: 'p_dawnArrow', size: 48, frames: 2, rate: 12, loop: true, draw: (c, i) => { c.line(4, 24, 36, 24, H('#ffe080', 120), 5); c.glow(36, 24, 12, H('#fff0a0', 220 - i * 30)); arrow('#ffffff', '#ffffff', 30)(c); } },
  { key: 'p_bolt', size: 24, frames: 1, rate: 1, draw: arrow('#5a3a20', '#a0a0b0', 10, '#c03028') },
  { key: 'p_shot', size: 16, frames: 1, rate: 1, draw: (c) => { c.ellS(8, 8, 2.5, 2.5, ramp('#4a4a50')); c.glow(8, 8, 5, H('#ffa040', 120)); } },
  { key: 'p_cannon', size: 16, frames: 1, rate: 1, draw: (c) => { c.ellS(8, 8, 3.5, 3.5, ramp('#3a3a40')); } },
  { key: 'p_bomb', size: 24, frames: 2, rate: 10, loop: true, draw: (c, i) => { c.ellS(12, 13, 5, 5, ramp('#2a2a32')); c.line(14, 8, 17, 4, H('#c8a060'), 1); c.set(17 + i, 3, H('#ffd040')); } },
  { key: 'p_barrel', size: 32, frames: 2, rate: 10, loop: true, draw: (c, i) => { c.rectS(9, 9, 14, 16, ramp('#8a5a30')); c.rect(9, 12, 14, 1, H('#4a4a50')); c.rect(9, 21, 14, 1, H('#4a4a50')); c.set(16, 7 - i, H('#ffd040')); c.glow(16, 6, 4, H('#ffa040', 200)); } },
  { key: 'p_fireball', size: 32, frames: 3, rate: 14, loop: true, draw: orb('#ffe060', '#ff6010', 3) },
  { key: 'p_emberBolt', size: 16, frames: 2, rate: 14, loop: true, draw: orb('#ffe080', '#ff7020') },
  { key: 'p_frostBolt', size: 16, frames: 2, rate: 14, loop: true, draw: orb('#ffffff', '#7fdcff') },
  { key: 'p_iceLance', size: 32, frames: 2, rate: 14, loop: true, draw: (c, i) => { c.glow(18, 16, 9, H('#7fdcff', 160 + i * 30)); c.polyS([[29, 16], [10, 12], [6, 16], [10, 20]], ramp('#bff0ff')); c.line(10, 16, 27, 16, H('#ffffff'), 1); } },
  { key: 'p_voidBolt', size: 16, frames: 2, rate: 14, loop: true, draw: orb('#f0d0ff', '#9a40ff') },
  { key: 'p_voidWave', size: 48, frames: 3, rate: 14, loop: true, draw: (c, i) => { for (let k = 0; k < 3; k++) c.ring(20 + k * 4 + i, 24, 6 + k * 2, 16 - k, H(k === 1 ? '#e0c0ff' : '#9a40ff', 220 - k * 50), 1); } },
  { key: 'p_soulBolt', size: 16, frames: 2, rate: 14, loop: true, draw: orb('#e0ffe8', '#40e070') },
  { key: 'p_runeBolt', size: 16, frames: 2, rate: 14, loop: true, draw: orb('#e0fff8', '#30d8c0') },
  { key: 'p_disk', size: 32, frames: 4, rate: 16, loop: true, draw: (c, i) => { c.glow(16, 16, 12, H('#40f0d0', 160)); c.ellS(16, 16, 8, 4, ramp('#60e0d0')); c.ring(16, 16, 8, 4, H('#e0fff8'), 1); c.set(16 + Math.cos(i * 1.5) * 6, 16 + Math.sin(i * 1.5) * 3, H('#ffffff')); } },
  { key: 'p_diskBig', size: 48, frames: 4, rate: 16, loop: true, draw: (c, i) => { c.glow(24, 24, 18, H('#40f0d0', 200)); c.ellS(24, 24, 12, 6, ramp('#80fff0')); c.ring(24, 24, 12, 6, H('#ffffff'), 1); c.set(24 + Math.cos(i * 1.5) * 9, 24 + Math.sin(i * 1.5) * 4, H('#ffffff')); } },
  { key: 'p_poisonDagger', size: 24, frames: 2, rate: 16, loop: true, draw: (c, i) => { c.line(4, 12, 18, 12, H('#c8d8c0'), 2); c.set(19, 12, H('#80ff60')); c.set(8 + i * 3, 14, H('#60e040')); c.glow(18, 12, 4, H('#60ff40', 140)); } },
  { key: 'p_hook', size: 24, frames: 1, rate: 1, draw: (c) => { c.line(4, 12, 16, 12, H('#a0a0b0'), 2); c.line(16, 12, 20, 8, H('#c8c8d8'), 2); c.line(16, 12, 20, 16, H('#c8c8d8'), 2); c.glow(16, 12, 5, H('#b060ff', 120)); } },
  { key: 'p_towerBlue', size: 24, frames: 2, rate: 16, loop: true, draw: orb('#e0f0ff', '#3a8aff') },
  { key: 'p_towerRed', size: 24, frames: 2, rate: 16, loop: true, draw: orb('#ffe8e0', '#ff4a3a') },
  { key: 'p_minionBoltBlue', size: 12, frames: 2, rate: 14, loop: true, draw: orb('#ffffff', '#6aa0ff') },
  { key: 'p_minionBoltRed', size: 12, frames: 2, rate: 14, loop: true, draw: orb('#ffffff', '#ff7a6a') },
  { key: 'p_wisp', size: 16, frames: 2, rate: 14, loop: true, draw: orb('#ffffff', '#80ffe0') },
  { key: 'p_bone', size: 16, frames: 1, rate: 1, draw: (c) => { c.line(4, 8, 12, 8, H('#e6dfc8'), 2); } },
  { key: 'p_bolt2', size: 24, frames: 1, rate: 1, draw: arrow('#5a3a20', '#ffd080', 10, '#c03028') },
];

// ------------------------------------------------------------------ icons
type IconDraw = (c: PC) => void;
const metal = ramp('#c8ccd8'), gold = ramp('#e0b040'), wood = ramp('#8a5a30');
const ICON_DRAW: Record<string, IconDraw> = {
  F: (c) => { c.polyS([[12, 2], [16, 12], [12, 21], [8, 12]], metal); c.line(12, 4, 12, 18, metal.ll, 1); },
  H: (c) => { c.ellS(12, 12, 8, 8, ramp('#60c0ff')); c.polyS([[13, 5], [8, 13], [12, 13], [10, 19], [16, 10], [12, 10]], ramp('#ffffff')); },
  B: (c) => { c.glow(12, 12, 10, H('#b060ff', 200)); c.polyS([[12, 3], [15, 10], [21, 12], [15, 14], [12, 21], [9, 14], [3, 12], [9, 10]], ramp('#d0a0ff')); },
  R: (c) => { c.ellS(12, 12, 8, 8, ramp('#40c0a0')); c.ring(12, 12, 5, 5, H('#e0fff8'), 1); c.set(10, 9, H('#ffffff')); },
  Z: (c) => { c.polyS([[4, 5], [20, 5], [19, 17], [12, 21], [5, 17]], metal); c.line(6, 9, 18, 9, metal.d, 1); },
  C: (c) => { c.polyS([[12, 3], [19, 10], [12, 21], [5, 10]], ramp('#e04050')); c.set(10, 8, H('#ffffff')); },
  G: (c) => { c.polyS([[7, 4], [13, 4], [13, 14], [20, 16], [20, 20], [6, 20]], ramp('#4a3a5a')); c.line(7, 14, 13, 14, H('#8a70a0'), 1); },
  M: (c) => { c.polyS([[5, 4], [19, 4], [19, 20], [5, 20]], ramp('#6a4aa0')); c.ring(12, 12, 4, 4, H('#e0c0ff'), 1); },
  i1: (c) => { for (let k = 0; k < 3; k++) c.polyS([[6 + k * 5, 4], [9 + k * 5, 4], [12 + k * 4, 20], [8 + k * 4, 18]], metal); },
  i2: (c) => { for (let k = 0; k < 9; k++) c.line(6 + k, 4 + k * 0.2 + (k * k) / 6, 6 + k + 1, 4 + (k + 1) * 0.2 + ((k + 1) * (k + 1)) / 6, wood.m, 2); c.line(7, 4, 7, 20, H('#e0f0ff'), 1); c.glow(16, 8, 5, H('#80e0ff', 150)); },
  i3: (c) => { c.line(4, 20, 18, 6, wood.m, 2); c.polyS([[17, 3], [21, 3], [21, 7], [18, 8]], metal); c.line(10, 12, 13, 15, H('#c03030'), 2); },
  i4: (c) => { c.line(6, 18, 18, 4, ramp('#b03040').m, 3); c.line(5, 19, 8, 16, gold.m, 2); c.set(16, 6, H('#ff6070')); },
  i5: (c) => { c.line(8, 20, 14, 6, wood.m, 2); c.glow(15, 6, 7, H('#ffe060', 220)); c.polyS([[15, 1], [17, 5], [21, 6], [17, 8], [15, 12], [13, 8], [9, 6], [13, 5]], ramp('#fff0a0')); },
  i6: (c) => { c.ellS(12, 12, 8, 8, ramp('#a03010')); c.glow(12, 12, 8, H('#ff8020', 200)); c.polyS([[12, 6], [15, 14], [12, 17], [9, 14]], ramp('#ffd040')); },
  i7: (c) => { c.ellS(12, 12, 9, 9, ramp('#2a1a4a')); c.ellS(12, 12, 5, 5, ramp('#b060ff')); c.set(12, 12, H('#000000')); c.set(10, 10, H('#ffffff')); },
  i8: (c) => { c.polyS([[4, 16], [6, 6], [9, 12], [12, 4], [15, 12], [18, 6], [20, 16]], ramp('#bfe8ff')); c.rect(4, 16, 17, 3, gold.m); },
  i9: (c) => { c.rectS(5, 3, 14, 18, ramp('#8a96aa')); c.rect(11, 5, 2, 14, gold.m); c.rect(7, 10, 10, 2, gold.m); },
  i10: (c) => { for (let k = 0; k < 4; k++) c.ellS(8 + (k % 2) * 8, 7 + Math.floor(k / 2) * 9, 5, 4, ramp('#30a070')); c.set(8, 6, H('#a0ffd0')); },
  i11: (c) => { c.ellS(8, 9, 5, 5, ramp('#d03040')); c.ellS(16, 9, 5, 5, ramp('#d03040')); c.polyS([[3, 10], [21, 10], [12, 21]], ramp('#d03040')); c.set(7, 7, H('#ffffff')); },
  i12: (c) => { c.polyS([[4, 4], [20, 4], [20, 12], [12, 21], [4, 12]], ramp('#5a6a8a')); c.polyS([[8, 7], [16, 7], [16, 12], [12, 17], [8, 12]], ramp('#80c0ff')); },
  i13: (c) => { c.polyS([[7, 3], [13, 3], [13, 13], [20, 15], [20, 20], [6, 20]], ramp('#3a6a2a')); c.line(4, 8, 2, 12, H('#ffffff', 160), 1); c.line(4, 12, 1, 15, H('#ffffff', 160), 1); },
  i14: (c) => { c.line(5, 19, 17, 5, metal.m, 2); c.line(4, 15, 9, 20, gold.m, 2); c.glow(12, 12, 9, H('#ff5040', 120)); c.polyS([[16, 14], [19, 17], [16, 20], [13, 17]], ramp('#ff5050')); },
  i15: (c) => { c.ring(12, 12, 8, 8, gold.m, 3); c.polyS([[13, 5], [9, 13], [12, 13], [10, 19], [16, 10], [12, 10]], ramp('#fff0a0')); },
  i16: (c) => { c.polyS([[8, 3], [16, 3], [21, 21], [3, 21]], ramp('#3a3a6a')); c.line(12, 4, 12, 20, H('#8080c0'), 1); },
  i17: (c) => { for (let k = 0; k < 5; k++) c.ring(6 + k * 3, 6 + k * 3, 2, 2, H('#6a6a70'), 1); c.glow(12, 12, 8, H('#40ff40', 70)); c.line(4, 20, 20, 4, H('#30202a', 160), 1); },
  i18: (c) => { c.ellS(12, 12, 8, 8, ramp('#6a6a5a')); c.ring(12, 12, 8, 8, H('#c0b090'), 1); c.polyS([[9, 9], [15, 15], [14, 16], [8, 10]], ramp('#2a1a1a')); },
  i19: (c) => { c.polyS([[4, 4], [14, 4], [14, 12], [9, 18], [4, 12]], ramp('#6080c0')); c.line(10, 3, 20, 20, metal.l, 3); c.line(12, 8, 6, 14, H('#ffffff'), 1); },
  i20: (c) => { c.polyS([[12, 2], [20, 12], [12, 22], [4, 12]], ramp('#5a2a8a')); c.line(12, 5, 12, 19, H('#e0a0ff'), 1); c.line(7, 12, 17, 12, H('#e0a0ff'), 1); },
  i21: (c) => { c.ellS(8, 12, 5, 5, ramp('#60ff90')); c.ellS(16, 12, 5, 5, ramp('#e6dfc8')); c.line(8, 12, 16, 12, H('#ffffff'), 1); },
  i22: (c) => { c.rectS(6, 6, 12, 12, ramp('#40d0b0')); c.rect(9, 9, 6, 6, H('#e0fff8')); c.glow(12, 12, 10, H('#40f0d0', 120)); },
  i23: (c) => { c.line(6, 20, 14, 8, wood.m, 3); c.rectS(10, 2, 11, 8, ramp('#8a8a96')); },
  i24: (c) => { c.ellS(12, 12, 9, 9, gold); c.ellS(12, 12, 7, 7, ramp('#f0e8d0')); c.polyS([[12, 5], [14, 12], [12, 19], [10, 12]], ramp('#c03030')); },
  o_farm: (c) => { c.ellS(12, 13, 7, 7, gold); c.set(10, 10, H('#fff8c0')); c.rect(11, 9, 2, 8, gold.d); },
  o_push: (c) => { c.polyS([[3, 9], [13, 9], [13, 4], [21, 12], [13, 20], [13, 15], [3, 15]], ramp('#ff9040')); },
  o_defend: (c) => { c.polyS([[4, 4], [20, 4], [20, 12], [12, 21], [4, 12]], ramp('#4a8aff')); c.rect(11, 6, 2, 11, H('#ffffff')); },
  o_retreat: (c) => { c.polyS([[21, 9], [11, 9], [11, 4], [3, 12], [11, 20], [11, 15], [21, 15]], ramp('#c0c0c8')); },
  o_jungle: (c) => { c.polyS([[12, 2], [20, 14], [15, 14], [15, 21], [9, 21], [9, 14], [4, 14]], ramp('#3aa040')); },
  o_raid_top: (c) => { c.line(5, 19, 19, 5, metal.m, 2); c.line(19, 19, 5, 5, metal.m, 2); c.polyS([[12, 1], [16, 6], [8, 6]], ramp('#ff5040')); },
  o_raid_bot: (c) => { c.line(5, 19, 19, 5, metal.m, 2); c.line(19, 19, 5, 5, metal.m, 2); c.polyS([[12, 23], [16, 18], [8, 18]], ramp('#ff5040')); },
  o_boss: (c) => { c.ellS(12, 13, 8, 7, ramp('#a02030')); c.polyS([[5, 8], [3, 1], [9, 6]], ramp('#e0d8c0')); c.polyS([[19, 8], [21, 1], [15, 6]], ramp('#e0d8c0')); c.set(9, 12, H('#ffe040')); c.set(15, 12, H('#ffe040')); },
  c_tank: (c) => { c.polyS([[4, 4], [20, 4], [20, 12], [12, 21], [4, 12]], ramp('#7a8aa8')); },
  c_fighter: (c) => { c.line(5, 19, 19, 5, metal.m, 3); c.line(4, 14, 10, 20, gold.m, 2); },
  c_mage: (c) => { c.glow(12, 12, 10, H('#b060ff', 200)); c.polyS([[12, 3], [15, 10], [21, 12], [15, 14], [12, 21], [9, 14], [3, 12], [9, 10]], ramp('#d0a0ff')); },
  c_assassin: (c) => { c.polyS([[12, 2], [15, 14], [12, 22], [9, 14]], ramp('#9a40ff')); },
  c_marksman: (c) => { arrow('#8a6a40', '#e0e0e8', 14)(c); },
  c_summoner: (c) => { c.ellS(12, 12, 8, 8, ramp('#40c080')); c.polyS([[7, 6], [9, 1], [11, 6]], ramp('#40c080')); c.polyS([[13, 6], [15, 1], [17, 6]], ramp('#40c080')); c.set(9, 11, H('#ffffff')); c.set(15, 11, H('#ffffff')); },
};

export function makeIcons(): Record<string, PC> {
  const out: Record<string, PC> = {};
  for (const [k, f] of Object.entries(ICON_DRAW)) {
    const c = new PC(24, 24);
    f(c);
    c.outline([16, 12, 20, 255]);
    out[k] = c;
  }
  return out;
}

const CLASS_BG: Record<string, string> = { boran: '#3a4a6a', korruk: '#4a4a3a', tharok: '#3a2a4a', rovan: '#5a2a1a', selda: '#1a4a4a', malvek: '#4a1a20', asira: '#5a2a10', liris: '#1a3a5a', orun: '#2a1a4a', nyra: '#1e1428', zereth: '#1a3a1a', vaelis: '#123a44', edrin: '#2a4a1a', tessa: '#4a2a18', dorn: '#4a3418', rughan: '#3a3428', nekmar: '#1a2a1e', ilvara: '#1a4040' };
export function makePortraits(): Record<string, PC> {
  const out: Record<string, PC> = {};
  for (const id of Object.keys(CHAMP_ART)) {
    const f = renderFrame(CHAMP_ART[id], 'idle', 'down', 0);
    const c = new PC(32, 32);
    const bg = ramp(CLASS_BG[id] ?? '#333344');
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) c.set(x, y, mix(bg.l, bg.dd, y / 32));
    c.glow(16, 12, 14, [255, 255, 255, 40]);
    c.blit(f, 0, 0, { sx: 8, sy: 0, sw: 32, sh: 32 });
    out[id] = c.scaled(2);
  }
  return out;
}
export type { RGBA };
