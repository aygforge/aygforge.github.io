// Yaratık, elit ve boss sprite'ları — her biri ayrı silüet, palet ve animasyonla procedural çizilir.
import { PB, shade, OUTLINE, hash } from './pixel.js';
import { drawHumanoid } from './characters.js';
import { DESIGNS_V2, HUMANOIDS_V2, V2_EXTRA_FRAMES, V2_FR, collapse } from './monstersV2.js';

export const MONSTER_FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'atk0', 'atk1'];
const FR = {
  idle0: { bob: 0, step: 0, atk: 0 }, idle1: { bob: 1, step: 0, atk: 0 },
  walk0: { bob: 0, step: 1, atk: 0 }, walk1: { bob: 1, step: 2, atk: 0 }, walk2: { bob: 0, step: 3, atk: 0 }, walk3: { bob: 1, step: 4, atk: 0 },
  atk0: { bob: 0, step: 0, atk: 1 }, atk1: { bob: 0, step: 0, atk: 2 },
};

// --------------------------------------------------------------- dört ayaklılar
function quadruped(pb, f, P) {
  const lunge = f.atk === 2 ? 2 : f.atk === 1 ? -1 : 0;
  const by = P.bodyY + f.bob * 0.5;
  const bx = P.bodyX + lunge;
  // bacaklar
  const legs = [[bx - P.bodyW * 0.35, 0, true], [bx + P.bodyW * 0.3, 2, true], [bx - P.bodyW * 0.25, 1, false], [bx + P.bodyW * 0.4, 3, false]];
  for (const [lx, ph, back] of legs) {
    const o = f.step ? [0, 1, 0, -1][(f.step + ph) % 4] : 0;
    const col = back ? shade(P.body, -0.3) : shade(P.body, -0.1);
    pb.rect(Math.round(lx + o), Math.round(by + P.bodyH * 0.4), P.legW, P.legH, col);
    pb.rect(Math.round(lx + o), Math.round(by + P.bodyH * 0.4 + P.legH - 1), P.legW + 1, 1, shade(col, -0.3));
  }
  // kuyruk
  if (P.tail) pb.thick(bx - P.bodyW / 2, by - 1, bx - P.bodyW / 2 - P.tail, by - 3 + f.bob, P.tailColor || P.body, P.tailW || 2);
  // gövde
  pb.ellipse(bx, by, P.bodyW / 2, P.bodyH / 2, P.body);
  pb.ellipse(bx - 1, by - P.bodyH * 0.18, P.bodyW / 2 - 2, P.bodyH / 4, shade(P.body, 0.15));
  if (P.belly) pb.ellipse(bx + 1, by + P.bodyH * 0.25, P.bodyW / 3, P.bodyH / 5, P.belly);
  if (P.mane) pb.ellipse(bx + P.bodyW * 0.3, by - 1, P.bodyH * 0.55, P.bodyH * 0.6, P.mane);
  // baş
  const hx = bx + P.bodyW / 2 + P.headOff + (f.atk === 2 ? 2 : 0), hy = by - P.bodyH * 0.25 + (f.atk === 1 ? -1 : 0);
  pb.ellipse(hx, hy, P.headR, P.headR * 0.85, P.head || P.body);
  pb.ellipse(hx + P.headR * 0.9, hy + P.headR * 0.25, P.snout, P.snout * 0.65, shade(P.head || P.body, 0.1));
  pb.set(hx + P.headR * 0.9 + P.snout, hy + P.headR * 0.2, '#1a1418');
  if (P.ears) { pb.poly([[hx - 2, hy - P.headR + 1], [hx - 1, hy - P.headR - P.ears], [hx + 1, hy - P.headR + 1]], shade(P.head || P.body, -0.15)); }
  pb.set(hx + 1, hy - 1, P.eye || '#1a1418');
  if (P.eyeGlow) pb.set(hx + 2, hy - 1, P.eyeGlow);
  if (f.atk === 2 && P.teeth) { pb.hline(hx + P.headR * 0.5, hx + P.headR * 0.9 + P.snout, hy + P.headR * 0.6, '#f0ece0'); }
  if (P.whisker) { pb.set(hx + P.headR + P.snout, hy + 2, '#d0c8c0'); }
}

// --------------------------------------------------------------- tasarımlar
const DESIGNS = {
  rat: { w: 18, h: 12, draw: (pb, f) => quadruped(pb, f, {
    bodyX: 8, bodyY: 7, bodyW: 10, bodyH: 6, legW: 1, legH: 3, headR: 3, headOff: 0, snout: 1.5, ears: 2,
    body: '#8a7a68', belly: '#c8b8a0', tail: 6, tailColor: '#d8a0a0', tailW: 1, whisker: true, eye: '#2a1010' }) },
  wolf: { w: 28, h: 18, draw: (pb, f) => quadruped(pb, f, {
    bodyX: 12, bodyY: 9, bodyW: 16, bodyH: 8, legW: 2, legH: 6, headR: 4, headOff: 1, snout: 2.5, ears: 3,
    body: '#7a7670', belly: '#b8b0a4', tail: 6, tailW: 3, teeth: true, eye: '#e0c040' }) },
  alpha: { w: 46, h: 30, draw: (pb, f) => {
    quadruped(pb, f, {
      bodyX: 20, bodyY: 15, bodyW: 28, bodyH: 14, legW: 4, legH: 10, headR: 7, headOff: 1, snout: 4, ears: 5,
      body: '#4a4650', mane: '#2e2a34', belly: '#7a7480', tail: 10, tailW: 5, teeth: true, eye: '#ff3a2a', eyeGlow: '#ffa060' });
    for (let i = 0; i < 6; i++) pb.line(12 + i * 3, 9 + f.bob * 0.5, 13 + i * 3, 6 + f.bob * 0.5, '#2e2a34');
    pb.line(16, 14, 22, 18, '#8a2a2a'); pb.line(18, 13, 24, 17, '#8a2a2a');
  } },
  rootling: { w: 22, h: 24, draw: (pb, f) => {
    const sw = f.atk === 2 ? 3 : f.atk === 1 ? -2 : 0;
    const by = 8 + f.bob;
    // kök ayaklar
    for (let i = 0; i < 4; i++) { const o = f.step ? [0, 1, 0, -1][(f.step + i) % 4] : 0; pb.line(7 + i * 3, by + 10, 4 + i * 4 + o, 23, '#5a4026'); }
    pb.ellipse(11, by + 6, 6, 8, '#6a5030');
    pb.ellipse(10, by + 5, 4, 6, '#7e623a');
    for (let y = by; y < by + 13; y += 3) pb.set(8 + (y % 2), y, '#4a3420');
    // diken kollar
    pb.thick(15, by + 4, 19 + sw, by - 2 + (f.atk === 2 ? 6 : 0), '#5a4026', 2);
    pb.thick(7, by + 4, 3, by - 1, '#5a4026', 2);
    pb.set(20 + sw, by - 3 + (f.atk === 2 ? 6 : 0), '#c8d070'); pb.set(2, by - 2, '#c8d070');
    // yapraklı taç
    pb.disc(11, by - 2, 5, '#3e7a30'); pb.disc(9, by - 4, 3, '#58983e'); pb.set(14, by - 5, '#c83838');
    pb.set(13, by + 3, '#f0e040'); pb.set(10, by + 3, '#f0e040');
    for (let i = 0; i < 5; i++) pb.set(6 + i * 2, by + 1 + (i % 2) * 6, '#c8d070');
  } },
  bat: { w: 24, h: 16, draw: (pb, f) => {
    const flap = [0, 1, 2, 1][(f.step || f.bob * 2) % 4];
    const by = 7 + (flap === 2 ? 1 : 0) + (f.atk ? 1 : 0);
    const wingY = [ -5, -2, 3, -2][flap];
    pb.poly([[12, by], [2, by + wingY], [4, by + wingY + 3], [7, by + 2], [9, by + 4]], '#4a3a4a');
    pb.poly([[12, by], [22, by + wingY], [20, by + wingY + 3], [17, by + 2], [15, by + 4]], '#5a4a5a');
    pb.line(12, by, 3, by + wingY, '#2a1e2a'); pb.line(12, by, 21, by + wingY, '#2a1e2a');
    pb.ellipse(12, by + 1, 3, 3.5, '#5a4a52'); pb.ellipse(12, by - 2, 2.5, 2.2, '#6a5a62');
    pb.set(11, by - 4, '#6a5a62'); pb.set(13, by - 4, '#6a5a62'); pb.set(10, by - 5, '#5a4a52'); pb.set(14, by - 5, '#5a4a52');
    pb.set(11, by - 2, '#ff4040'); pb.set(13, by - 2, '#ff4040');
    if (f.atk === 2) { pb.set(11, by, '#ffffff'); pb.set(13, by, '#ffffff'); }
  } },
  beetle: { w: 26, h: 18, draw: (pb, f) => {
    const by = 9 + f.bob * 0.5, lunge = f.atk === 2 ? 2 : 0;
    for (let i = 0; i < 3; i++) {
      const o = f.step ? [0, 1, 0, -1][(f.step + i) % 4] : 0;
      pb.line(8 + i * 5 + lunge, by + 3, 6 + i * 5 + o + lunge, 16, '#2a2e34');
      pb.line(9 + i * 5 + lunge, by + 3, 10 + i * 5 - o + lunge, 16, '#3a3e44');
    }
    pb.ellipse(12 + lunge, by, 9, 6, '#4e5662');
    pb.ellipse(11 + lunge, by - 2, 7, 3.5, '#6a7480'); pb.ellipse(10 + lunge, by - 3, 4, 1.5, '#9aa4b0');
    pb.vline(12 + lunge, by - 5, by + 5, '#2e343c');
    pb.ellipse(21 + lunge, by + 1, 3.5, 3, '#3a4048');
    pb.line(23 + lunge, by, 26, by - 3 + (f.atk === 2 ? 2 : 0), '#2a2e34'); pb.line(23 + lunge, by + 2, 26, by + 4 - (f.atk === 2 ? 2 : 0), '#2a2e34');
    pb.set(22 + lunge, by, '#e06030');
  } },
  leech: { w: 24, h: 14, draw: (pb, f) => {
    const wave = (x) => Math.sin(x * 0.6 + (f.step || f.bob) * 1.6) * 1.2;
    const reach = f.atk === 2 ? 3 : f.atk === 1 ? -1 : 0;
    for (let x = 2; x < 19 + reach; x++) {
      const t = (x - 2) / 17;
      const r = 2 + Math.sin(t * Math.PI) * 2.2;
      const cy = 8 + wave(x);
      pb.vline(x, Math.round(cy - r), Math.round(cy + r), x % 3 === 0 ? '#5a2a2e' : '#7a3a3e');
      pb.set(x, Math.round(cy - r), '#a05a5a');
    }
    const hx = 19 + reach;
    pb.ellipse(hx, 8 + wave(hx), 2.5, 2.5, '#8a3a3e'); pb.ring(hx + 1, 8 + wave(hx), 1.6, '#e0b0b0');
    for (let x = 4; x < 18; x += 4) pb.set(x, 10 + wave(x), '#7ad050');
  } },
  watcher: { w: 30, h: 34, draw: (pb, f) => {
    const fl = f.bob + (f.step % 2);
    const cy = 15 + fl;
    // kristal parçalar yörüngede
    const ang = (f.step || 0) * 0.8 + f.bob * 0.4;
    for (let i = 0; i < 3; i++) {
      const a = ang + i * 2.1; const x = 15 + Math.cos(a) * 12, y = cy + Math.sin(a) * 5;
      pb.poly([[x - 1.5, y + 2], [x, y - 3], [x + 1.5, y + 2]], '#e04a3a'); pb.set(x, y - 1, '#ffb0a0');
    }
    pb.ellipse(15, cy, 9, 10, '#5a5058'); pb.ellipse(14, cy - 2, 7, 7, '#6e646c');
    for (let i = 0; i < 6; i++) pb.line(8 + i * 3, cy - 8 + (i % 2) * 2, 9 + i * 3, cy + 6, '#c04030');
    pb.disc(16, cy - 1, 4, '#f0e0d0'); pb.disc(17 + (f.atk === 2 ? 1 : 0), cy - 1, 2.4, f.atk ? '#ff6040' : '#d02020'); pb.set(17, cy - 2, '#ffffff');
    pb.poly([[10, cy + 8], [15, cy + 16], [20, cy + 8]], '#4a4048');
    pb.ellipse(15, 32, 6, 1.2, '#00000a', 80);
  } },
  golem: { w: 56, h: 58, draw: (pb, f) => {
    const by = 14 + f.bob;
    const raise = f.atk === 1 ? -10 : f.atk === 2 ? 8 : 0;
    const st = f.step ? [0, 1, 0, -1][f.step % 4] : 0;
    const stone = '#6a6670', stoneD = '#4a4650', stoneL = '#8a8690';
    // bacaklar
    pb.rect(16 + st, by + 26, 9, 16, stoneD); pb.rect(31 - st, by + 26, 9, 16, stoneD);
    pb.rect(15 + st, by + 39, 11, 5, stone); pb.rect(30 - st, by + 39, 11, 5, stone);
    // gövde
    pb.ellipse(28, by + 16, 17, 15, stone);
    pb.ellipse(26, by + 12, 13, 10, stoneL);
    for (let i = 0; i < 25; i++) { const x = 14 + hash(i, 3) * 28, y = by + 4 + hash(3, i) * 24; if (pb.opaque(x, y)) pb.set(x, y, stoneD); }
    pb.line(18, by + 6, 24, by + 18, stoneD); pb.line(34, by + 4, 30, by + 20, stoneD);
    // çekirdek
    pb.disc(28, by + 17, 4, '#2a8aa0'); pb.disc(28, by + 17, 2.5, '#5ae0ff'); pb.set(27, by + 16, '#e0ffff');
    // kristaller sırtta
    for (const [x, y, hgt] of [[16, by + 2, 8], [22, by - 2, 10], [34, by - 1, 9], [40, by + 4, 7]]) {
      pb.poly([[x - 2, y + 4], [x, y - hgt], [x + 2, y + 4]], '#3a9ad0'); pb.vline(x, y - hgt + 2, y + 2, '#a8ecff');
    }
    // baş
    pb.ellipse(28, by + 1, 7, 6, stone); pb.hline(24, 32, by + 2, '#1a1418'); pb.set(25, by + 2, '#5ae0ff'); pb.set(31, by + 2, '#5ae0ff');
    // kollar
    const armY = by + 20 + raise;
    pb.thick(12, by + 10, 7, armY, stoneD, 7); pb.thick(44, by + 10, 49, armY, stoneD, 7);
    pb.disc(7, armY + 3, 5.5, stone); pb.disc(49, armY + 3, 5.5, stone);
    pb.set(6, armY + 1, stoneL); pb.set(48, armY + 1, stoneL);
    pb.poly([[47, armY], [50, armY - 6], [52, armY]], '#3a9ad0');
  } },
  crystal: { w: 18, h: 26, draw: (pb, f) => {
    const g = f.bob;
    pb.ellipse(9, 23, 7, 2, '#2a2a3a');
    pb.poly([[3, 23], [5, 8], [9, 1 + g], [13, 8], [15, 23]], '#3a8ad0');
    pb.poly([[6, 22], [7, 9], [9, 4 + g], [10, 10], [9, 22]], '#7ad8ff');
    pb.vline(8, 7, 20, '#e0faff');
    pb.poly([[12, 23], [15, 14], [17, 23]], '#6a4ad0');
  } },
  dummy: { w: 16, h: 26, draw: (pb, f) => {
    const tilt = f.atk || f.step ? 1 : 0;
    pb.vline(8, 10, 25, '#6a4628'); pb.hline(5, 11, 25, '#5a3a20');
    pb.ellipse(8 + tilt, 14, 4, 6, '#d8b860'); pb.hline(4 + tilt, 12 + tilt, 12, '#b89040'); pb.hline(4 + tilt, 12 + tilt, 17, '#b89040');
    pb.thick(2 + tilt, 12, 14 + tilt, 12, '#c8a850', 2);
    pb.disc(8 + tilt, 6, 3.5, '#e0c870'); pb.set(7 + tilt, 6, '#5a3a20'); pb.set(10 + tilt, 6, '#5a3a20'); pb.hline(7 + tilt, 9 + tilt, 8, '#8a5a30');
    pb.disc(8 + tilt, 14, 1.5, '#c83838');
  } },
};

// İnsansı yaratıklar (drawHumanoid tabanlı, silah sprite'a gömülü)
function heldWeapon(kind, color, len = 7) {
  return (pb, f, ctx) => {
    const [hx, hy] = f.hf;
    const dir = ctx.frameName === 'atk0' ? [-0.3, -1] : ctx.frameName === 'atk1' ? [1, 0.25] : [0.45, -1];
    const n = Math.hypot(dir[0], dir[1]);
    const ex = hx + dir[0] / n * len, ey = hy + dir[1] / n * len;
    if (kind === 'dagger') { pb.line(hx, hy, ex, ey, color); pb.set(ex, ey, '#ffffff'); }
    if (kind === 'pick') { pb.line(hx, hy, ex, ey, '#6a4628'); pb.line(ex - 3, ey + 1, ex + 3, ey - 1, color); }
    if (kind === 'axe') { pb.thick(hx, hy, ex, ey, '#5a3a20', 1.5); pb.ellipse(ex, ey, 3, 2.5, color); }
    if (kind === 'bigaxe') { pb.thick(hx, hy, ex, ey, '#3a2a1a', 2); pb.ellipse(ex + 1, ey, 5, 4, color); pb.ellipse(ex + 2, ey, 3, 2.5, shade(color, 0.3)); }
    if (kind === 'sword') { pb.thick(hx, hy, ex, ey, color, 1.5); pb.line(hx - 2, hy + 1, hx + 2, hy - 1, '#6a5a3a'); }
    if (kind === 'crystalstaff') { pb.line(hx, hy + 6, ex, ey, '#4a3a2a'); pb.disc(ex, ey, 2, color); pb.set(ex, ey - 1, '#ffffff'); }
    if (kind === 'wand') { pb.line(hx, hy, ex, ey, '#c8d0c8'); pb.disc(ex, ey, 1.6, color); }
    if (kind === 'club') { pb.thick(hx, hy, ex, ey, '#4a3424', 2.5); }
  };
}

const HUMANOIDS = {
  raider: { w: 24, h: 30, look: { skin: '#d8a078', helm: { type: 'hood', main: '#5a4a3a', trim: '#3a2e24' }, top: '#6f6040', topTrim: '#3a3020', pants: '#4a4030', tier: 1, extra: heldWeapon('dagger', '#d0d0d8', 6) } },
  goblin: { w: 24, h: 30, look: { skin: '#6aa040', build: 'short', top: '#6a4a2a', pants: '#4a3a2a', boots: '#3a2a1a',
    extra: (pb, f, c) => { pb.poly([[c.hx - 3, c.hy - 1], [c.hx - 8, c.hy - 4], [c.hx - 3, c.hy + 1]], '#5a9036'); pb.set(c.hx + 2, c.hy, '#ffe040'); heldWeapon('pick', '#9aa0a8', 7)(pb, f, c); } } },
  priest: { w: 24, h: 30, look: { skin: '#b0a090', helm: { type: 'hood', main: '#7a3a2a', trim: '#ff9a3a' }, top: '#8a4a2a', topTrim: '#ff9a3a', robe: true, tier: 2,
    extra: (pb, f, c) => { pb.set(c.hx + 2, c.hy, '#ffb040'); heldWeapon('crystalstaff', '#ff9a3a', 9)(pb, f, c); } } },
  dwarf: { w: 24, h: 30, look: { skin: '#8a7050', build: 'short', hair: '#4a3a24', beard: '#5a4a30', top: '#5a4632', pants: '#4a3a28', tier: 1, topTrim: '#3a2c1c',
    extra: heldWeapon('club', '#4a3424', 7) } },
  witch: { w: 24, h: 32, look: { skin: '#a8c0a0', hair: '#2a3a2a', hairStyle: 'long', top: '#2e4a42', topTrim: '#6fe0c8', robe: true, tier: 1,
    helm: { type: 'hat', main: '#1e3a34', trim: '#6fe0c8' }, extra: heldWeapon('wand', '#7af0d0', 6) } },
  guard: { w: 24, h: 30, look: { skin: '#8aa088', helm: { type: 'greathelm', main: '#6a7068', trim: '#4a3a2a' }, top: '#5e6a5e', topTrim: '#8a7a4a', tier: 2, pants: '#3a3a34',
    extra: (pb, f, c) => { pb.set(c.hx + 2, c.hy, '#a0ff80'); heldWeapon('sword', '#8a948a', 8)(pb, f, c); } } },
  captain: { w: 26, h: 32, look: { skin: '#d8a078', hair: '#2a1a14', beard: '#2a1a14', build: 'big', top: '#7a2a2a', topTrim: '#e0c060', cape: '#a02a2a', tier: 2, pants: '#3a2e24',
    extra: heldWeapon('axe', '#c0c4c8', 8) } },
  executioner: { w: 28, h: 34, look: { skin: '#7a8a78', helm: { type: 'hood', main: '#2a1a1e', trim: '#4a2a2e' }, build: 'big', top: '#3a2a2e', topTrim: '#6a2a3a', tier: 4, pants: '#2a2024',
    extra: (pb, f, c) => { pb.set(c.hx + 2, c.hy, '#ff3030'); heldWeapon('bigaxe', '#8a909a', 10)(pb, f, c); } } },
};

const H_POSE = { idle0: 'idle0', idle1: 'idle1', walk0: 'walk0', walk1: 'walk1', walk2: 'walk2', walk3: 'walk3', atk0: 'atk0', atk1: 'atk1', hurt0: 'hurt0' };

// V2 tasarımları: V1 karelerine ek olarak hurt0 ve die0–die2 (ölüm kareleri son pozdan türetilir)
function v2Sheet(D, drawFrame) {
  const names = [...MONSTER_FRAMES, ...V2_EXTRA_FRAMES];
  const base = {};
  const frames = names.map((fr) => {
    if (fr.startsWith('die')) return collapse(base.hurt0, V2_FR[fr].die, D.fx).outline(OUTLINE);
    const pb = drawFrame(fr);
    base[fr] = pb.clone();
    return pb.outline(OUTLINE);
  });
  return { w: D.w, h: D.h, frames, names };
}

export function monsterSheet(sprite) {
  const D = DESIGNS[sprite];
  if (D) {
    return { w: D.w, h: D.h, names: MONSTER_FRAMES, frames: MONSTER_FRAMES.map((fr) => { const pb = new PB(D.w, D.h); D.draw(pb, FR[fr]); pb.outline(OUTLINE); return pb; }) };
  }
  const D2 = DESIGNS_V2[sprite];
  if (D2) return v2Sheet(D2, (fr) => { const pb = new PB(D2.w, D2.h); D2.draw(pb, FR[fr] || V2_FR[fr]); return pb; });
  const H2 = HUMANOIDS_V2[sprite];
  if (H2) {
    return v2Sheet(H2, (fr) => {
      const pb = new PB(H2.w, H2.h);
      const tmp = new PB(24, 30);
      drawHumanoid(tmp, { ...H2.look, noOutline: true }, H_POSE[fr]);
      pb.blit(tmp, Math.floor((H2.w - 24) / 2), H2.h - 30);
      return pb;
    });
  }
  const H = HUMANOIDS[sprite];
  if (!H) throw new Error('sprite yok: ' + sprite);
  return {
    w: H.w, h: H.h, names: MONSTER_FRAMES,
    frames: MONSTER_FRAMES.map((fr) => {
      const pb = new PB(H.w, H.h);
      const tmp = new PB(24, 30);
      drawHumanoid(tmp, H.look, H_POSE[fr]);
      pb.blit(tmp, Math.floor((H.w - 24) / 2), H.h - 30);
      return pb;
    }),
  };
}

export const MONSTER_SPRITES = [...Object.keys(DESIGNS), ...Object.keys(HUMANOIDS), ...Object.keys(DESIGNS_V2), ...Object.keys(HUMANOIDS_V2)];
