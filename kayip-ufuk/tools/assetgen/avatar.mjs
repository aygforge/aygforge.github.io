// Parametric 32×48 avatar: 2 body silhouettes × 16 clips × 4 directions (322 poses each), grayscale
// clothing mask (runtime tinted to 3 outfits), 6 hair shapes (runtime tinted 5 colors), 9 held tools, 3 bags.
// Skin is drawn in the skin0 ramp; the runtime recolors exact ramp colors to 4 skin tones.
import { Pix, shade } from './raster.mjs';
import { P } from './palette.mjs';

export const SKIN_RAMP = ['#f1c8a4', '#d9a886', '#b9876a']; // light, mid, shadow (exact colors recolored at runtime)
export const GRAY_RAMP = ['#e6e6e6', '#bdbdbd', '#8e8e8e', '#5e5e5e']; // clothing/hair mask levels
export const FEET = [16, 45];

/** Pose parameters for clip/dir/frame. */
export function pose(clip, dir, f, n) {
  const t = n > 1 ? f / n : 0; const s = Math.sin(t * Math.PI * 2); const c = Math.cos(t * Math.PI * 2);
  const q = { bob: 0, leg: 0, armL: 0, armR: 0, raise: 0, lean: 0, crouch: 0, lying: false, swim: false, toolAngle: 0, reach: 0, hurt: false, mouth: false };
  switch (clip) {
    case 'idle': q.bob = f % 2 ? 1 : 0; q.armL = q.armR = 0.05 * s; break;
    case 'walk': q.leg = s * 1; q.armL = -s * 0.5; q.armR = s * 0.5; q.bob = Math.abs(c) > 0.7 ? 0 : 1; break;
    case 'run': q.leg = s * 1.6; q.armL = -s * 0.9; q.armR = s * 0.9; q.bob = Math.abs(c) > 0.6 ? 0 : 2; q.lean = 1; break;
    case 'chop': case 'mine': { const k = [0, 0.4, 1, 0.7, 0.2, 0][f] ?? 0; q.raise = k; q.toolAngle = -1.2 + (1 - k) * 2.2; q.lean = k > 0.6 ? -1 : 1; q.bob = k < 0.3 ? 1 : 0; break; }
    case 'build': { const k = [0, 0.6, 1, 0.3, 0.8, 0][f] ?? 0; q.raise = k * 0.7; q.toolAngle = -0.8 + (1 - k) * 1.8; q.crouch = 1; break; }
    case 'gather': { const k = [0, 0.5, 1, 0.5, 0][f] ?? 0; q.crouch = Math.round(k * 4); q.reach = k; break; }
    case 'spear': { const k = [0, 0.3, 1, 0.6, 0.2][f] ?? 0; q.reach = k * 1.3; q.toolAngle = 0; q.lean = k > 0.5 ? 1 : 0; break; }
    case 'bow': { const k = [0, 0.5, 1, 1, 0.6, 0][f] ?? 0; q.reach = 0.8 + k * 0.4; q.raise = 0.3; q.toolAngle = 0; break; }
    case 'eat': { const k = [0, 0.6, 1, 0.8, 0.2][f] ?? 0; q.mouth = k > 0.5; q.raise = k * 0.6; break; }
    case 'fish_cast': { const k = [0, 0.5, 1, 0.8, 0.4, 0.1][f] ?? 0; q.raise = 1 - k; q.toolAngle = -1.4 + k * 1.6; q.reach = k * 0.6; break; }
    case 'fish_idle': q.reach = 0.5; q.toolAngle = 0.25 + s * 0.05; q.bob = f % 2; break;
    case 'fish_reel': q.reach = 0.4; q.toolAngle = 0.1 + s * 0.25; q.armL = s * 0.3; break;
    case 'swim': q.swim = true; q.armL = s * 1.2; q.armR = -s * 1.2; q.bob = f % 2; break;
    case 'hurt': q.hurt = true; q.lean = -2 + f; break;
    case 'sleep': q.lying = true; q.bob = f; break;
  }
  return q;
}

function limb(p, x0, y0, x1, y1, w, c) { p.line(x0, y0, x1, y1, c, w); }

/** Draw a body (skin + base) and return anchors measured from the drawing. */
export function drawBody(body, clip, dir, f, n) {
  const p = new Pix(32, 48); const q = pose(clip, dir, f, n);
  const wide = body === 'body_b';
  const [sk, skm, skd] = SKIN_RAMP;
  const base = '#4b5563'; // undergarment (covered by clothing mask in most poses)
  const A = { head: [16, 9], leftHand: [10, 27], rightHand: [22, 27], backpack: [16, 24], effect: [16, 26], toolAngle: q.toolAngle, flipX: dir === 'left' };
  if (q.lying) {
    p.ellipse(16, 40, 13, 4, '#00000030');
    p.rect(6, 34, 20, 7, base); p.ellipse(25, 36, 5, 5, sk); p.rect(3, 35, 4, 5, skd);
    A.head = [25, 33]; A.leftHand = [12, 36]; A.rightHand = [18, 36]; A.backpack = [14, 36];
    if (f === 1) p.set(29, 30, '#ffffffaa');
    return { p, A };
  }
  const by = q.bob + q.crouch; const tw = wide ? 12 : 10; const tx = 16 - tw / 2;
  const lean = dir === 'right' ? q.lean : dir === 'left' ? -q.lean : 0;
  // shadow
  p.ellipse(16, 45, 8, 2.5, [20, 30, 30, 70]);
  if (q.swim) {
    // waterline: only upper body visible
    p.rect(tx, 30 + by, tw, 8, skm);
    const ax = Math.round(q.armL * 5), bx = Math.round(q.armR * 5);
    limb(p, tx - 1, 31 + by, tx - 5, 34 + by + ax, 3, sk); limb(p, tx + tw, 31 + by, tx + tw + 4, 34 + by + bx, 3, sk);
    p.ellipse(16 + lean, 24 + by, 6, 6, sk); p.ellipse(16 + lean, 26 + by, 5, 3, skm);
    for (let x = 4; x < 28; x++) p.set(x, 37 + by + (x % 4 === 0 ? 1 : 0), [200, 235, 245, 220]);
    A.head = [16 + lean, 20 + by]; A.leftHand = [tx - 5, 34 + by]; A.rightHand = [tx + tw + 4, 34 + by]; A.backpack = [16, 30 + by];
    face(p, dir, 16 + lean, 24 + by);
    return { p, A };
  }
  // legs
  const legY = 33 + by, legLen = 11 - q.crouch;
  const lg = q.leg * 2.2;
  if (dir === 'left' || dir === 'right') {
    const sgn = dir === 'right' ? 1 : -1;
    limb(p, 15, legY, 15 + sgn * lg, legY + legLen, 3, skd);
    limb(p, 17, legY, 17 - sgn * lg, legY + legLen, 3, sk);
    p.rect(15 + sgn * lg - 1 + (sgn > 0 ? 1 : -1), legY + legLen, 4, 2, '#5a4030');
    p.rect(17 - sgn * lg - 1 + (sgn > 0 ? 1 : -1), legY + legLen, 4, 2, '#6a4a36');
  } else {
    const l1 = Math.round(q.leg * 1.5), l2 = -l1;
    p.rect(tx + 1, legY, 3, legLen + l1 * 0, sk); p.rect(tx + tw - 4, legY, 3, legLen, sk);
    p.rect(tx + 1, legY + legLen - Math.max(0, l1), 3, 2, '#5a4030'); p.rect(tx + tw - 4, legY + legLen - Math.max(0, l2), 3, 2, '#5a4030');
    p.rect(tx + 1, legY, 1, legLen, skd);
  }
  // torso
  const ty = 20 + by;
  p.rect(tx + lean, ty, tw, 14 - Math.min(2, q.crouch), base);
  p.rect(tx + lean, ty, 1, 13, shade(base, 0.2));
  // arms (shoulder at ty+2)
  const shoulderL = [tx - 1 + lean, ty + 2], shoulderR = [tx + tw + lean, ty + 2];
  let hl, hr;
  if (dir === 'down' || dir === 'up') {
    const ra = q.raise * 12;
    hl = [shoulderL[0] - 2, shoulderL[1] + 10 + Math.round(q.armL * 3) - (q.mouth ? 6 : 0) - ra * 0.3];
    hr = [shoulderR[0] + 1, shoulderR[1] + 10 + Math.round(q.armR * 3) - ra];
    if (q.reach) { hr = [shoulderR[0] + 1, shoulderR[1] + 10 - q.reach * 4]; hl = [shoulderL[0] - 1, shoulderL[1] + 9 - q.reach * 3]; }
    if (q.mouth) hl = [16, ty - 1];
    if (dir === 'up') [hl, hr] = [hr.map((v, i) => (i ? v : 32 - v)), hl.map((v, i) => (i ? v : 32 - v))];
  } else {
    const sgn = dir === 'right' ? 1 : -1;
    const sw = q.armL * 5;
    const reach = q.reach * 7, raise = q.raise * 12;
    hl = [16 + lean - sgn * 2 + sw * sgn * 0.4, ty + 11 - raise * 0.4];
    hr = [16 + lean + sgn * (3 + reach) - sw * sgn * 0.4, ty + 11 - raise - (q.mouth ? 8 : 0)];
  }
  const back = dir === 'up';
  const armC = back ? skm : sk;
  limb(p, shoulderL[0], shoulderL[1], hl[0], hl[1], 3, dir === 'right' ? skd : armC);
  limb(p, shoulderR[0], shoulderR[1], hr[0], hr[1], 3, dir === 'left' ? skd : armC);
  p.rect(hl[0] - 1, hl[1] - 1, 3, 3, skm); p.rect(hr[0] - 1, hr[1] - 1, 3, 3, skm);
  // head
  const hx = 16 + lean, hy = 13 + by;
  p.ellipse(hx, hy, 6.5, 6.5, sk);
  p.ellipse(hx + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0), hy + 3, 5, 2.5, skm);
  p.rect(hx - 1, hy + 5, 3, 2, skd); // neck
  if (!back) face(p, dir, hx, hy, q.hurt);
  A.head = [hx, hy - 4]; A.leftHand = hl.map(Math.round); A.rightHand = hr.map(Math.round); A.backpack = [16, ty + 6]; A.effect = [16, ty + 5];
  if (q.hurt) p.map(([r, g, b, a]) => [Math.min(255, r + 40), g, b, a]);
  return { p, A };
}

function face(p, dir, hx, hy, hurt = false) {
  const eye = '#2a2a33';
  if (dir === 'down') { p.set(hx - 2, hy, eye); p.set(hx + 2, hy, eye); p.set(hx - 2, hy - 1, '#ffffff'); p.set(hx + 2, hy - 1, '#ffffff'); p.rect(hx - 1, hy + 3, 3, 1, hurt ? '#7a2a2a' : '#b56a5a'); }
  else if (dir === 'right') { p.set(hx + 3, hy, eye); p.set(hx + 3, hy - 1, '#ffffff'); p.set(hx + 5, hy + 1, SKIN_RAMP[1]); }
  else if (dir === 'left') { p.set(hx - 3, hy, eye); p.set(hx - 3, hy - 1, '#ffffff'); p.set(hx - 5, hy + 1, SKIN_RAMP[1]); }
}

/** Clothing mask: grayscale shirt + shorts following the same pose (shared by both bodies). */
export function drawClothingMask(clip, dir, f, n) {
  const p = new Pix(32, 48); const q = pose(clip, dir, f, n);
  const [g0, g1, g2, g3] = GRAY_RAMP;
  if (q.lying) { p.rect(6, 34, 18, 7, g1); p.rect(6, 34, 18, 2, g0); p.rect(6, 39, 18, 2, g3); return p; }
  const by = q.bob + q.crouch; const tw = 12; const tx = 10;
  const lean = dir === 'right' ? q.lean : dir === 'left' ? -q.lean : 0;
  if (q.swim) { p.rect(tx + 1, 30 + by, tw - 2, 6, g1); p.rect(tx + 1, 30 + by, tw - 2, 1, g0); return p; }
  const ty = 20 + by;
  // shirt
  p.rect(tx + lean, ty, tw, 9, g1);
  p.rect(tx + lean, ty, tw, 2, g0);
  p.rect(tx + lean, ty + 7, tw, 2, g2);
  if (dir === 'down') { p.rect(15 + lean, ty, 2, 4, g3); }
  p.rect(tx + lean, ty, 1, 9, g0); p.rect(tx + tw - 1 + lean, ty, 1, 9, g2);
  // shorts
  p.rect(tx + 1 + lean, ty + 9, tw - 2, 5 - Math.min(2, q.crouch), g3);
  p.rect(tx + 1 + lean, ty + 9, tw - 2, 1, g2);
  if (dir === 'left' || dir === 'right') p.rect(tx + 1 + lean, ty + 13 - Math.min(2, q.crouch), tw - 2, 1, g3);
  return p;
}

/** 6 hair shapes × 4 dirs, 32×22, anchored so that (16,14) sits on the head anchor. */
export function drawHair(shapeIdx, dir) {
  const p = new Pix(32, 22); const [g0, g1, g2] = GRAY_RAMP;
  const cx = 16, cy = 14;
  const cap = () => { p.ellipse(cx, cy - 1, 7, 5.5, g1); p.ellipse(cx - 1, cy - 3, 5, 2.5, g0); };
  switch (shapeIdx) {
    case 0: cap(); if (dir !== 'up') p.rect(cx - 7, cy - 1, 3, 4, g2); if (dir === 'down') p.rect(cx + 4, cy - 1, 3, 4, g2); break; // short
    case 1: cap(); p.rect(cx - 7, cy - 1, 14, 9, dir === 'up' ? g1 : 'CLEAR'); if (dir !== 'up') { p.rect(cx - 7, cy - 1, 3, 10, g2); p.rect(cx + 4, cy - 1, 3, 10, g2); } break; // long
    case 2: cap(); for (let i = 0; i < 5; i++) p.poly([[cx - 6 + i * 3, cy - 4], [cx - 4 + i * 3, cy - 10], [cx - 2 + i * 3, cy - 4]], g1); break; // spiky
    case 3: cap(); p.circle(cx, cy - 8, 3.5, g1); p.circle(cx - 1, cy - 9, 1.5, g0); break; // top bun
    case 4: for (let i = 0; i < 12; i++) p.circle(cx - 6 + (i % 4) * 4, cy - 6 + Math.floor(i / 4) * 3, 2.6, i % 2 ? g1 : g0); break; // curly
    case 5: cap(); if (dir === 'down' || dir === 'up') { p.rect(cx - 2, cy - 1, 4, 10, g2); } else { const sx = dir === 'right' ? -1 : 1; p.line(cx + sx * 6, cy, cx + sx * 9, cy + 6, g2, 3); } break; // ponytail
  }
  if (dir === 'down') { for (let x = cx - 5; x <= cx + 5; x++) if (p.alpha(x, cy + 1) && shapeIdx !== 1 && shapeIdx !== 4) p.clear(x, cy + 1); }
  p.outline('#2a2830');
  return p;
}

/** Held tools drawn pointing "up-right" from the grip at (8,24); runtime rotates by pose toolAngle. */
export function drawHeld(kind, dir) {
  const p = new Pix(32, 32); const flip = dir === 'left';
  const H = (fn) => { fn(); if (flip) { const q = new Pix(32, 32); q.blit(p, 0, 0, { flipX: true }); return q; } return p; };
  return H(() => {
    switch (kind) {
      case 'axe': p.line(8, 24, 20, 6, P.wood, 2); p.poly([[17, 4], [25, 6], [24, 13], [19, 10]], P.stone_light); break;
      case 'pickaxe': p.line(8, 24, 18, 8, P.wood, 2); for (let a = -1; a <= 1; a += 0.1) p.rect(18 + a * 8, 8 - (1 - a * a) * 2 + a * 4, 2, 2, P.iron); break;
      case 'spear': p.line(6, 26, 24, 4, P.wood, 2); p.poly([[24, 4], [21, 4], [27, 0], [25, 7]], P.stone_light); break;
      case 'bow': for (let a = -1.1; a <= 1.1; a += 0.05) p.rect(-1 + Math.cos(a) * 9, 23 + Math.sin(a) * 9, 2, 2, '#9cc95a'); p.line(3, 15, 3, 31, '#e9e1c8'); p.rect(7, 22, 3, 3, P.leather); break; // grip (8,24) = middle of the limb
      case 'fishing_rod': p.line(6, 26, 26, 2, '#9cc95a', 2); p.line(26, 2, 28, 18, '#e9e1c8'); p.circle(9, 23, 2, P.iron); break;
      case 'hammer': p.line(8, 24, 16, 10, P.wood, 2); p.rect(12, 6, 9, 5, P.iron); break;
      case 'knife': p.line(8, 24, 11, 20, P.wood_dark, 2); p.poly([[10, 21], [19, 11], [17, 16], [12, 22]], P.stone_light); break;
      case 'machete': p.line(8, 24, 11, 21, P.leather, 3); p.poly([[11, 21], [23, 8], [25, 10], [14, 23]], '#d6dce2'); break;
      case 'torch': p.line(8, 24, 14, 12, P.wood, 3); p.ellipse(15, 9, 3.5, 4.5, '#f7b560'); p.ellipse(15, 10, 1.6, 2.4, '#fff2b0'); break;
    }
    p.outline(P.outline);
  });
}

export function drawBag(kind, dir) {
  const p = new Pix(32, 32);
  const c = { small_bag: P.cloth_dark, medium_bag: P.leather, large_bag: '#3d7454' }[kind];
  const big = kind === 'large_bag' ? 2 : kind === 'medium_bag' ? 1 : 0;
  if (dir === 'up') { p.rect(9 - big, 9 - big, 14 + big * 2, 15 + big * 2, c); p.rect(12, 12, 8, 5, shade(c, -0.25)); p.rect(15, 14, 2, 2, P.gold); }
  else if (dir === 'down') { p.rect(8, 10, 2, 12, shade(c, -0.3)); p.rect(22, 10, 2, 12, shade(c, -0.3)); }
  else { const x = dir === 'right' ? 6 - big : 18; p.rect(x, 10 - big, 8 + big, 14 + big * 2, c); p.rect(x + 2, 13, 4, 4, shade(c, -0.25)); }
  p.outline(P.outline);
  return p;
}
