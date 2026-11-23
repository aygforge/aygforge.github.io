import { PC, hex, ramp, hash2, mix, RGBA, shade } from './canvas';
import { BOSS_POS, CAMPS, CELL, CRYSTAL_POS, FOUNTAIN_POS, GH, GW, LANES, WORLD_H, WORLD_W, isWalkable, laneDistance, walkable } from '../../src/core/map';
import { distToSeg, dist } from '../../src/core/math';

// ------------------------------------------------------------------ tiles (20x20)
function noiseTile(base: string, seed: number, spots: { c: string; p: number }[], blades = false): PC {
  const t = new PC(20, 20);
  const b = hex(base);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
    const n = hash2(x, y, seed);
    let c: RGBA = n < 0.15 ? shade(b, -0.04) : n > 0.88 ? shade(b, 0.04) : b;
    for (const s of spots) if (hash2(x * 3, y * 7, seed + 11) < s.p) c = hex(s.c);
    t.set(x, y, c);
  }
  if (blades) for (let k = 0; k < 7; k++) {
    const x = Math.floor(hash2(k, 1, seed) * 19), y = Math.floor(hash2(k, 2, seed) * 18) + 1;
    t.set(x, y, shade(b, 0.1)); t.set(x, y - 1, shade(b, 0.16));
  }
  return t;
}
function stoneTile(seed: number, base = '#9a9280'): PC {
  const t = new PC(20, 20);
  const r = ramp(base);
  t.rect(0, 0, 20, 20, r.d);
  // irregular flagstones
  const cells = [[0, 0, 9, 8], [10, 0, 10, 6], [10, 7, 10, 7], [0, 9, 6, 11], [7, 9, 7, 6], [7, 16, 13, 4], [15, 15, 5, 1]];
  cells.forEach(([x, y, w, h], k) => {
    if (w < 2 || h < 2) return;
    const jitter = hash2(k, seed, 3) * 0.1 - 0.05;
    const c = ramp(shade(r.m, jitter));
    t.rectS(x + 0.5, y + 0.5, w - 1, h - 1, c);
    if (hash2(k, seed, 9) > 0.7) t.set(x + 2, y + 2, c.dd);
  });
  return t;
}
function floorTile(team: 0 | 1, seed: number): PC {
  const t = new PC(20, 20);
  const base = ramp(team === 0 ? '#7a86a0' : '#a08080');
  t.rect(0, 0, 20, 20, base.d);
  t.rectS(1, 1, 9, 9, base); t.rectS(11, 1, 8, 9, base); t.rectS(1, 11, 9, 8, base); t.rectS(11, 11, 8, 8, base);
  if (seed % 3 === 0) t.set(5, 5, hex(team === 0 ? '#80b0ff' : '#ff9080'));
  return t;
}
function arenaTile(seed: number): PC {
  const t = stoneTile(seed, '#6a6470');
  if (seed % 2 === 0) { t.line(3, 10, 17, 10, hex('#9a80c0', 120)); t.line(10, 3, 10, 17, hex('#9a80c0', 120)); }
  return t;
}

export function makeTiles(): Record<string, PC> {
  const T: Record<string, PC> = {};
  for (let i = 0; i < 4; i++) T[`grass_${i}`] = noiseTile(['#5a9a3a', '#5a963a', '#62a040', '#56943a'][i], 10 + i, [{ c: '#4a8432', p: 0.04 }, { c: '#7ab84a', p: 0.02 }], true);
  for (let i = 0; i < 2; i++) T[`forest_${i}`] = noiseTile('#2e5a26', 20 + i, [{ c: '#244a1e', p: 0.12 }, { c: '#3a6a2e', p: 0.04 }]);
  for (let i = 0; i < 4; i++) T[`path_${i}`] = stoneTile(30 + i);
  for (let i = 0; i < 2; i++) T[`dirt_${i}`] = noiseTile('#8a6e4a', 40 + i, [{ c: '#7a5e3e', p: 0.08 }, { c: '#a08a6a', p: 0.03 }]);
  for (let i = 0; i < 2; i++) { T[`base0_${i}`] = floorTile(0, i); T[`base1_${i}`] = floorTile(1, i); }
  for (let i = 0; i < 2; i++) T[`arena_${i}`] = arenaTile(50 + i);
  return T;
}

// ------------------------------------------------------------------ decor sprites
function tree(kind: 'oak' | 'pine' | 'round', seed: number): PC {
  const c = new PC(40, 48);
  c.ell(20, 44, 12, 3, [0, 0, 0, 80]);
  const trunk = ramp('#6a4a2e');
  c.rectS(17, 30, 6, 15, trunk);
  c.line(17, 43, 14, 45, trunk.d, 2); c.line(22, 43, 26, 45, trunk.d, 2);
  if (kind === 'pine') {
    const g = ramp(seed % 2 ? '#2e6a3a' : '#2a6234');
    for (let k = 0; k < 4; k++) { const y = 6 + k * 7, w = 6 + k * 3.2; c.polyS([[20, y - 4], [20 + w, y + 7], [20 - w, y + 7]], g); }
    c.set(20, 2, g.ll);
  } else {
    const g = ramp(kind === 'oak' ? (seed % 2 ? '#3a8a34' : '#428e38') : '#4a9a3e');
    const blobs: [number, number, number][] = kind === 'oak' ? [[20, 18, 13], [11, 23, 8], [29, 23, 8], [15, 12, 8], [26, 12, 8], [20, 9, 8]] : [[20, 17, 14], [14, 22, 8], [27, 22, 8]];
    for (const [x, y, r] of blobs) c.ellS(x, y, r, r * 0.85, g);
    for (let k = 0; k < 12; k++) { const x = 8 + Math.floor(hash2(k, seed, 4) * 24), y = 6 + Math.floor(hash2(k, seed, 5) * 20); if (c.alpha(x, y)) c.set(x, y, k % 3 ? g.l : g.ll); }
    if (kind === 'round' && seed % 3 === 0) for (let k = 0; k < 5; k++) c.set(10 + k * 5, 15 + (k % 2) * 6, hex('#e04040'));
  }
  c.outline([18, 30, 16, 255]);
  return c;
}
function bush(seed: number): PC {
  const c = new PC(20, 14);
  const g = ramp(seed % 2 ? '#3e8e36' : '#4a9a3a');
  c.ell(10, 12, 8, 2, [0, 0, 0, 60]);
  c.ellS(6, 8, 5, 4, g); c.ellS(14, 8, 5, 4, g); c.ellS(10, 5, 5, 4, g);
  if (seed % 3 === 0) { c.set(6, 6, hex('#f0e060')); c.set(13, 5, hex('#f0e060')); }
  c.outline([20, 40, 18, 255]);
  return c;
}
function rock(seed: number, big = false): PC {
  const c = new PC(big ? 28 : 18, big ? 20 : 14);
  const r = ramp(seed % 2 ? '#8a8a8e' : '#7e7a74');
  const w = c.w, h = c.h;
  c.ell(w / 2, h - 2, w / 2 - 1, 2, [0, 0, 0, 60]);
  c.polyS([[2, h - 3], [4, 4], [w / 2, 1], [w - 4, 3], [w - 2, h - 3]], r);
  if (seed % 2) c.rect(4, 4, 4, 1, hex('#5a8a3a'));
  c.line(w / 2, 4, w / 2 + 2, h - 5, r.d, 1);
  c.outline([30, 28, 30, 255]);
  return c;
}
function pillar(broken: boolean): PC {
  const c = new PC(18, 36);
  const s = ramp('#b8b0a0');
  c.ell(9, 33, 8, 2, [0, 0, 0, 70]);
  c.rectS(2, 30, 14, 4, s);
  const top = broken ? 14 : 6;
  c.rectS(4, top, 10, 30 - top, s);
  for (let x = 6; x < 13; x += 3) c.line(x, top + 1, x, 29, s.d, 1);
  if (!broken) c.rectS(2, 3, 14, 4, s); else { c.polyS([[4, top], [8, top - 4], [11, top + 1], [14, top - 2], [14, top]], s); }
  c.rect(4, 20, 3, 2, hex('#5a8a3a'));
  c.outline([40, 36, 32, 255]);
  return c;
}
function arch(): PC {
  const c = new PC(44, 36);
  const s = ramp('#a8a090');
  c.ell(22, 33, 20, 2, [0, 0, 0, 70]);
  c.rectS(3, 8, 8, 26, s); c.rectS(33, 8, 8, 26, s);
  c.rectS(2, 3, 40, 7, s);
  c.polyS([[11, 10], [33, 10], [28, 15], [16, 15]], s);
  c.rect(16, 4, 12, 2, hex('#8060c0'));
  c.rect(4, 26, 5, 2, hex('#5a8a3a')); c.rect(34, 14, 4, 2, hex('#5a8a3a'));
  c.outline([40, 36, 32, 255]);
  return c;
}
function statue(): PC {
  const c = new PC(22, 40);
  const s = ramp('#9aa29a');
  c.ell(11, 37, 10, 2, [0, 0, 0, 70]);
  c.rectS(2, 30, 18, 8, ramp('#8a8478'));
  c.rectS(7, 14, 8, 16, s);
  c.ellS(11, 10, 4, 4, s);
  c.line(15, 16, 19, 6, s.m, 2);
  c.rect(7, 22, 8, 1, hex('#5a8a3a'));
  c.outline([40, 40, 36, 255]);
  return c;
}
function flowers(seed: number): PC {
  const c = new PC(10, 8);
  const cols = ['#f0e060', '#e060a0', '#ffffff', '#80a0ff'];
  for (let k = 0; k < 4; k++) { const x = 1 + k * 2 + (k % 2), y = 2 + ((k * 3) % 4); c.set(x, y + 1, hex('#3a7a2a')); c.set(x, y, hex(cols[(seed + k) % 4])); }
  return c;
}
function mushroom(): PC {
  const c = new PC(10, 10);
  c.rect(4, 5, 2, 4, hex('#f0e8d8'));
  c.ellS(5, 4, 4, 2.5, ramp('#c83a30'));
  c.set(3, 3, hex('#ffffff')); c.set(6, 3, hex('#ffffff'));
  c.outline([40, 20, 20, 255]);
  return c;
}
function brazier(frame: number): PC {
  const c = new PC(16, 24);
  c.ell(8, 22, 6, 1.5, [0, 0, 0, 70]);
  c.line(8, 13, 8, 21, hex('#4a4040'), 2);
  c.line(4, 21, 12, 21, hex('#4a4040'), 2);
  c.rectS(3, 10, 10, 4, ramp('#6a5a50'));
  const fl = [0, 1, 2, 1][frame];
  c.glow(8, 7, 7, hex('#ff9030', 200));
  c.polyS([[4, 10], [8, 1 + fl], [12, 10]], ramp('#ff8020'));
  c.polyS([[6, 10], [8, 4 + fl], [10, 10]], ramp('#ffe060'));
  c.outline([30, 20, 20, 255]);
  return c;
}
function banner(team: 0 | 1): PC {
  const c = new PC(14, 32);
  c.line(3, 2, 3, 31, hex('#5a4030'), 2);
  const r = ramp(team === 0 ? '#2a50b0' : '#b02a2a');
  c.polyS([[4, 3], [13, 3], [13, 20], [8, 16], [4, 20]], r);
  c.rect(6, 7, 5, 5, hex('#d8b04a'));
  c.outline([20, 16, 20, 255]);
  return c;
}

export function makeDecor(): Record<string, PC> {
  const D: Record<string, PC> = {};
  for (let i = 0; i < 2; i++) { D[`tree_oak_${i}`] = tree('oak', i); D[`tree_pine_${i}`] = tree('pine', i); D[`tree_round_${i}`] = tree('round', i + 3); }
  for (let i = 0; i < 3; i++) D[`bush_${i}`] = bush(i);
  for (let i = 0; i < 2; i++) { D[`rock_${i}`] = rock(i); D[`rockbig_${i}`] = rock(i + 1, true); }
  D.pillar = pillar(false); D.pillar_broken = pillar(true); D.arch = arch(); D.statue = statue();
  for (let i = 0; i < 3; i++) D[`flowers_${i}`] = flowers(i);
  D.mushroom = mushroom();
  for (let i = 0; i < 4; i++) D[`brazier_${i}`] = brazier(i);
  D.banner_0 = banner(0); D.banner_1 = banner(1);
  return D;
}

// ------------------------------------------------------------------ structures
export function tower(team: 0 | 1, state: 'idle' | 'attack' | 'ruin', frame: number): PC {
  const c = new PC(48, 80);
  const stone = ramp('#a8a49a');
  const tc = team === 0 ? '#3a8aff' : '#ff4a3a';
  const tr = ramp(tc);
  c.ell(24, 75, 20, 4, [0, 0, 0, 80]);
  if (state === 'ruin') {
    c.polyS([[6, 76], [10, 64], [18, 60], [30, 62], [40, 66], [42, 76]], stone);
    c.rectS(12, 56, 8, 10, stone); c.rectS(26, 60, 10, 6, stone);
    c.set(20, 64, tr.d); c.set(31, 68, tr.d);
    c.outline([30, 28, 26, 255]);
    return c;
  }
  // base
  c.polyS([[6, 76], [42, 76], [38, 66], [10, 66]], stone);
  c.rect(8, 70, 32, 1, stone.d);
  // shaft
  c.polyS([[12, 66], [36, 66], [33, 30], [15, 30]], stone);
  for (let y = 36; y < 66; y += 6) c.line(14 + (66 - y) * 0.08, y, 34 - (66 - y) * 0.08, y, stone.d, 1);
  c.rect(21, 42, 6, 12, tr.dd); c.rect(22, 43, 4, 10, tr.d);
  // crown
  c.polyS([[10, 30], [38, 30], [40, 24], [8, 24]], ramp('#8a867c'));
  for (let x = 9; x < 40; x += 6) c.rectS(x, 19, 4, 6, ramp('#9a968a'));
  // floating crystal
  const fl = [0, -1, -2, -1][frame % 4];
  const glowA = state === 'attack' ? 255 : 170;
  c.glow(24, 10 + fl, state === 'attack' ? 14 : 10, hex(tc, glowA));
  c.polyS([[24, 1 + fl], [30, 10 + fl], [24, 19 + fl], [18, 10 + fl]], tr);
  c.line(24, 3 + fl, 24, 17 + fl, tr.ll, 1);
  if (state === 'attack') c.ellS(24, 10 + fl, 3, 3, ramp('#ffffff'));
  c.outline([24, 22, 30, 255]);
  return c;
}
export function crystal(team: 0 | 1, state: 'idle' | 'hit' | 'ruin', frame: number): PC {
  const c = new PC(64, 88);
  const tc = team === 0 ? '#40a0ff' : '#ff4a4a';
  const tr = ramp(tc);
  const stone = ramp('#a0988a');
  c.ell(32, 82, 28, 5, [0, 0, 0, 80]);
  c.polyS([[4, 84], [60, 84], [54, 72], [10, 72]], stone);
  c.polyS([[10, 72], [54, 72], [50, 66], [14, 66]], ramp('#b8b0a0'));
  for (let k = 0; k < 4; k++) c.set(14 + k * 12, 78, tr.l);
  if (state === 'ruin') {
    for (let k = 0; k < 6; k++) { const x = 12 + k * 8, y = 62 - (k % 3) * 3; c.polyS([[x, 66], [x + 3, y], [x + 6, 66]], ramp(shade(tr.m, -0.2))); }
    c.outline([24, 22, 30, 255]);
    return c;
  }
  const fl = Math.round(Math.sin((frame / 6) * Math.PI * 2) * 2);
  c.glow(32, 36 + fl, 30, hex(tc, state === 'hit' ? 220 : 140));
  c.polyS([[32, 4 + fl], [46, 30 + fl], [40, 62 + fl], [24, 62 + fl], [18, 30 + fl]], tr);
  c.polyS([[32, 4 + fl], [36, 30 + fl], [32, 62 + fl], [26, 30 + fl]], ramp(shade(tr.m, 0.15)));
  c.line(32, 6 + fl, 32, 60 + fl, tr.ll, 1);
  const sh = frame % 6;
  c.line(20 + sh * 3, 28 + fl, 22 + sh * 3, 40 + fl, hex('#ffffff', 180), 1);
  // orbiting shards
  for (let k = 0; k < 3; k++) {
    const a = (frame / 6) * Math.PI * 2 + (k * Math.PI * 2) / 3;
    const x = 32 + Math.cos(a) * 24, y = 36 + Math.sin(a) * 6 + fl;
    c.polyS([[x, y - 4], [x + 2, y], [x, y + 4], [x - 2, y]], tr);
  }
  if (state === 'hit') { const t = c.tinted([255, 255, 255, 255], 0.35); t.outline([24, 22, 30, 255]); return t; }
  c.outline([24, 22, 30, 255]);
  return c;
}
export function fountainArt(team: 0 | 1): PC {
  const c = new PC(64, 48);
  const stone = ramp('#b0a898');
  const tc = team === 0 ? '#60b0ff' : '#ff7a6a';
  c.ellS(32, 30, 30, 15, stone);
  c.ellS(32, 28, 25, 11, ramp(team === 0 ? '#3a6ad0' : '#c04a3a'));
  c.glow(32, 26, 20, hex(tc, 140));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.rectS(32 + Math.cos(a) * 27 - 1.5, 30 + Math.sin(a) * 13 - 3, 3, 4, stone); }
  c.outline([30, 28, 26, 255]);
  return c;
}

// ------------------------------------------------------------------ map composition
/** Compose the full map ground+decor image (native scale = world/2) from the tile & decor sprites. */
export function composeMap(T: Record<string, PC>, D: Record<string, PC>): { img: PC; decorList: { key: string; x: number; y: number }[] } {
  const W = WORLD_W / 2, H = WORLD_H / 2;
  const img = new PC(W, H);
  const jungleSegs: [number, number, number, number][] = [];
  // approximate jungle path centre lines from walkable cells that are not lanes: use camp/boss connections
  const pts = (a: { x: number; y: number }, b: { x: number; y: number }) => jungleSegs.push([a.x, a.y, b.x, b.y]);
  const m = (p: { x: number; y: number }) => ({ x: WORLD_W - p.x, y: p.y });
  const jp = [
    [{ x: 460, y: 900 }, { x: 860, y: 640 }], [{ x: 460, y: 900 }, { x: 1170, y: 900 }], [{ x: 460, y: 900 }, { x: 860, y: 1160 }],
    [{ x: 860, y: 640 }, { x: 900, y: 260 }], [{ x: 860, y: 1160 }, { x: 900, y: 1540 }], [{ x: 860, y: 640 }, { x: 1250, y: 560 }], [{ x: 1250, y: 560 }, { x: 1600, y: 640 }],
    [{ x: 860, y: 1160 }, { x: 1250, y: 1240 }], [{ x: 1250, y: 1240 }, { x: 1600, y: 1160 }], [{ x: 1170, y: 900 }, { x: 1600, y: 900 }], [{ x: 1170, y: 900 }, { x: 1600, y: 640 }],
    [{ x: 1170, y: 900 }, { x: 1600, y: 1160 }], [{ x: 1600, y: 640 }, { x: 1600, y: 1160 }], [{ x: 1600, y: 640 }, { x: 1600, y: 240 }], [{ x: 1600, y: 1160 }, { x: 1600, y: 1560 }],
    [{ x: 1250, y: 560 }, { x: 1300, y: 250 }], [{ x: 1250, y: 1240 }, { x: 1300, y: 1550 }],
  ];
  for (const [a, b] of jp) { pts(a, b); pts(m(a), m(b)); }
  const baseC = [{ x: 230, y: 900 }, { x: WORLD_W - 230, y: 900 }];
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const wx = px * 2 + 1, wy = py * 2 + 1;
    const gx = Math.floor(px / 20), gy = Math.floor(py / 20);
    const tx = px % 20, ty = py % 20;
    const n = hash2(px >> 2, py >> 2, 7) * 18 - 9;
    const v = (k: number) => Math.floor(hash2(gx, gy, k) * 4);
    let tile: PC;
    const ld = Math.min(laneDistance('top', wx, wy), laneDistance('bot', wx, wy));
    const bd = Math.min(dist(wx, wy, baseC[0].x, baseC[0].y), dist(wx, wy, baseC[1].x, baseC[1].y));
    const ad = Math.min(dist(wx, wy, BOSS_POS.blood.x, BOSS_POS.blood.y), dist(wx, wy, BOSS_POS.titan.x, BOSS_POS.titan.y));
    let jd = Infinity;
    for (const s of jungleSegs) jd = Math.min(jd, distToSeg(wx, wy, s[0], s[1], s[2], s[3]));
    const walk = isWalkable(wx, wy);
    if (bd < 270 + n) tile = T[`base${wx < WORLD_W / 2 ? 0 : 1}_${v(1) % 2}`];
    else if (ad < 165 + n) tile = T[`arena_${v(2) % 2}`];
    else if (ld < 88 + n) tile = T[`path_${v(3)}`];
    else if (walk && jd < 34 + n * 0.6) tile = T[`dirt_${v(4) % 2}`];
    else if (walk || ld < 118) tile = T[`grass_${v(5)}`];
    else tile = T[`forest_${v(6) % 2}`];
    img.set(px, py, tile.get(tx, ty));
  }
  // decor placement (deterministic)
  const decor: { key: string; x: number; y: number; z: number }[] = [];
  const near = (gx: number, gy: number) => {
    let w = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = gx + dx, y = gy + dy; if (x >= 0 && y >= 0 && x < GW && y < GH && walkable[y * GW + x]) w++; }
    return w;
  };
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const i = gy * GW + gx;
    const cx = (gx * CELL + CELL / 2) / 2, cy = (gy * CELL + CELL / 2) / 2;
    const h = hash2(gx, gy, 99);
    if (!walkable[i]) {
      // dense forest: 1-2 trees per blocked cell
      const kinds = ['tree_oak_0', 'tree_oak_1', 'tree_pine_0', 'tree_pine_1', 'tree_round_0', 'tree_round_1'];
      const k = kinds[Math.floor(h * kinds.length)];
      decor.push({ key: k, x: cx + (hash2(gx, gy, 5) - 0.5) * 10, y: cy + 8 + (hash2(gx, gy, 6) - 0.5) * 8, z: 0 });
      if (near(gx, gy) > 0 && hash2(gx, gy, 12) > 0.5) decor.push({ key: `bush_${Math.floor(hash2(gx, gy, 13) * 3)}`, x: cx + (hash2(gx, gy, 14) - 0.5) * 16, y: cy + 14, z: 0 });
    } else {
      const wx = gx * CELL + CELL / 2, wy = gy * CELL + CELL / 2;
      const ld = Math.min(laneDistance('top', wx, wy), laneDistance('bot', wx, wy));
      if (ld < 90) continue;
      if (Math.min(dist(wx, wy, baseC[0].x, baseC[0].y), dist(wx, wy, baseC[1].x, baseC[1].y)) < 300) continue;
      if (h > 0.93) decor.push({ key: `flowers_${Math.floor(hash2(gx, gy, 3) * 3)}`, x: cx, y: cy, z: -1 });
      else if (h < 0.025) decor.push({ key: 'mushroom', x: cx, y: cy, z: 0 });
      else if (h > 0.9 && near(gx, gy) < 8) decor.push({ key: `rock_${Math.floor(hash2(gx, gy, 4) * 2)}`, x: cx, y: cy, z: 0 });
    }
  }
  // ruins along lanes and around boss arenas
  const ruinSpots: [string, number, number][] = [
    ['pillar', 1450, 360], ['pillar_broken', 1750, 360], ['pillar_broken', 1450, 1440], ['pillar', 1750, 1440],
    ['arch', 1600, 470], ['arch', 1600, 1330], ['statue', 1440, 640], ['statue', 1760, 1160],
    ['pillar_broken', 1430, 1150], ['pillar_broken', 1770, 650], ['rockbig_0', 760, 410], ['rockbig_1', 2440, 410], ['rockbig_1', 760, 1390], ['rockbig_0', 2440, 1390],
    ['pillar', 520, 620], ['pillar', 2680, 620], ['pillar_broken', 520, 1180], ['pillar_broken', 2680, 1180],
  ];
  for (const [k, x, y] of ruinSpots) decor.push({ key: k, x: x / 2, y: y / 2, z: 0 });
  for (const c of CAMPS) for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + c.id;
    decor.push({ key: k === 0 ? 'rockbig_0' : `rock_${k % 2}`, x: (c.pos.x + Math.cos(a) * 135) / 2, y: (c.pos.y + Math.sin(a) * 125) / 2, z: 0 });
  }
  for (const t of [0, 1] as const) {
    const f = FOUNTAIN_POS[t], cr = CRYSTAL_POS[t];
    decor.push({ key: `banner_${t}`, x: (cr.x + (t === 0 ? 60 : -60)) / 2, y: (cr.y - 150) / 2, z: 0 });
    decor.push({ key: `banner_${t}`, x: (cr.x + (t === 0 ? 60 : -60)) / 2, y: (cr.y + 170) / 2, z: 0 });
    void f;
  }
  decor.sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
  for (const d of decor) {
    const s = D[d.key];
    img.blit(s, Math.round(d.x - s.w / 2), Math.round(d.y - s.h + 2));
  }
  // dark vignette at map border
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const e = Math.min(px, py, W - 1 - px, H - 1 - py);
    if (e < 10) { const c = img.get(px, py); img.set(px, py, mix(c, [10, 20, 10, 255], (10 - e) / 14)); }
  }
  // lane borders: subtle dark edge at stone path boundary
  const runtimeDecor = [] as { key: string; x: number; y: number }[];
  for (const t of [0, 1] as const) {
    const cr = CRYSTAL_POS[t];
    runtimeDecor.push({ key: 'brazier', x: cr.x + (t === 0 ? 90 : -90), y: cr.y - 90 });
    runtimeDecor.push({ key: 'brazier', x: cr.x + (t === 0 ? 90 : -90), y: cr.y + 110 });
  }
  for (const b of [BOSS_POS.blood, BOSS_POS.titan]) { runtimeDecor.push({ key: 'brazier', x: b.x - 170, y: b.y }); runtimeDecor.push({ key: 'brazier', x: b.x + 170, y: b.y }); }
  void LANES;
  return { img, decorList: runtimeDecor };
}
