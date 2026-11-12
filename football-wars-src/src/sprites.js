/* FOOTBALL WARS — procedural pixel sprites, kits, crests (all original, generated at runtime). */
(function (root) {
'use strict';
const CW = 20, CH = 20, FOOT_X = 10, FOOT_Y = 17;
const FRAMES = { idle: [0, 1], run: [2, 3, 4, 5], kick: [6, 7, 8], tackle: [9, 10], hit: [11], stun: [12, 13], special: [14, 15], ko: [16, 17, 18], victory: [19, 20], dive: [21, 22] };
const NF = 23, VARIANTS = 6;
const ROLES = ['striker', 'winger', 'playmaker', 'defender', 'goalkeeper', 'support', 'captain'];

// ---------- colour utils ----------
function hex(c) { c = String(c || '#888').replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const n = parseInt(c, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function toHex(r) { return '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hex(a), B = hex(b); return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); }
function lum(c) { const r = hex(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r[0] + 0.7152 * r[1] + 0.0722 * r[2]; }
function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function cdist(a, b) { const A = hex(a), B = hex(b); const rm = (A[0] + B[0]) / 2; const dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2]; return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db); }
function bright(c, k) { return k > 0 ? mix(c, '#ffffff', k) : mix(c, '#000000', -k); }
function vivid(c) { return lum(c) < 0.06 ? mix(c, '#ffffff', 0.35) : c; }
function rgba32(c, a) { const r = hex(c); return ((a == null ? 255 : a) << 24) | (r[2] << 16) | (r[1] << 8) | r[0]; }
function hstr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }

const GRASS = '#46993f';
const SKINS = ['#f3cfb0', '#e3b08a', '#c98e66', '#a66c45', '#7d4c2c', '#5c3820'];
const HAIRS = ['#1b1210', '#3a2416', '#6b4423', '#a8722f', '#e0bf6a', '#2a2a2a', '#8a3a1c', '#d8d8d8'];
const GK_KITS = ['#a3f03a', '#ff8c1a', '#22d3ee', '#e040fb', '#f7e51e', '#25262b', '#ff4d8d'];

// ---------- kits ----------
function makeKits(teamA, teamB) {
  const A = kitFor(teamA, null), B = kitFor(teamB, A);
  return [A, B];
}
function kitFor(team, other) {
  let p = vivid(team.visual.primary_color), s = vivid(team.visual.secondary_color);
  const h = hstr(team.id);
  const designs = ['solid', 'stripes', 'hoops', 'halves', 'sash', 'sleeves'];
  let design = designs[h % designs.length];
  let away = false;
  if (other) {
    // ensure the two sides read apart on the pitch: swap to an alternate kit if colours clash
    if (cdist(p, other.p) < 150 || (cdist(p, other.s) < 90 && cdist(s, other.p) < 90)) {
      away = true;
      if (cdist(s, other.p) > 170) { const t = p; p = s; s = t; }
      else { s = p; p = lum(other.p) > 0.4 ? '#1d2233' : '#f2f2f2'; }
      if (design === 'solid') design = 'sleeves';
    }
  }
  if (cdist(p, GRASS) < 110 && design === 'solid') design = 'hoops';
  let shorts = contrast(p, s) > 1.5 ? s : (lum(p) > 0.45 ? '#1f2433' : '#f4f4f4');
  const used = [p, s, other ? other.p : '#000', other ? other.s : '#000'];
  let gk = GK_KITS[0], best = -1;
  for (const g of GK_KITS) { const d = Math.min(...used.map(u => cdist(g, u)), cdist(g, GRASS) * 1.1); if (d > best) { best = d; gk = g; } }
  const outline = '#0c0f17';
  return { p, s, shorts, socks: p, design, away, gk, gk2: bright(gk, -0.35), outline, ring: bright(p, lum(p) < 0.2 ? 0.45 : 0.1), dark: bright(p, -0.4) };
}

// ---------- sprite drawing into a 20x20 cell ----------
function Cell() { this.a = new Uint32Array(CW * CH); }
Cell.prototype.set = function (x, y, c) { if (x >= 0 && x < CW && y >= 0 && y < CH && c) this.a[y * CW + x] = c; };
Cell.prototype.rect = function (x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); };

function palette(kit, role, variant, teamHash) {
  const isGK = role === 'goalkeeper';
  const shirt = isGK ? kit.gk : kit.p, shirt2 = isGK ? kit.gk2 : kit.s;
  const vi = (variant * 7 + ROLES.indexOf(role) * 3 + teamHash) >>> 0;
  return {
    shirt: rgba32(shirt), shirt2: rgba32(shirt2), shirtD: rgba32(bright(shirt, -0.28)), shorts: rgba32(isGK ? kit.gk2 : kit.shorts),
    socks: rgba32(isGK ? kit.gk : kit.socks), skin: rgba32(SKINS[vi % SKINS.length]), skinD: rgba32(bright(SKINS[vi % SKINS.length], -0.25)),
    hair: rgba32(HAIRS[(vi >> 2) % HAIRS.length]), hairStyle: (vi >> 1) % 6, eye: rgba32('#141414'), boot: rgba32('#15151a'),
    bootW: rgba32(['#ff3d6e', '#30e3ff', '#fff15c', '#ffffff'][vi % 4]), glove: rgba32(bright(kit.gk === '#25262b' ? '#ffffff' : kit.gk, 0.55)),
    band: rgba32('#ffe14d'), white: rgba32('#ffffff'), outline: rgba32(kit.outline), design: isGK ? 'solid' : kit.design,
    cap: rgba32(isGK ? kit.gk2 : kit.s)
  };
}

function torsoPx(P, x, y, x0, y0) { // shirt pattern
  const lx = x - x0, ly = y - y0;
  switch (P.design) {
    case 'stripes': return (lx % 2 === 1) ? P.shirt2 : P.shirt;
    case 'hoops': return (ly % 2 === 1) ? P.shirt2 : P.shirt;
    case 'halves': return lx < 3 ? P.shirt : P.shirt2;
    case 'sash': return (lx - ly === 1 || lx - ly === 2) ? P.shirt2 : P.shirt;
    default: return P.shirt;
  }
}

function drawStanding(C, P, role, o) {
  // o: {by, legL, legR (lift 0/1), legLx, legRx, arms:'down'|'swingA'|'swingB'|'up'|'flinch'|'out', back, kick:0..3, headDx, ball}
  const by = o.by || 0, hy = 3 + by, hdx = o.headDx || 0;
  const back = !!o.back;
  // legs (fixed to ground)
  const shortsTop = hy + 9;
  const legs = [[8 + (o.legLx || 0), o.legL || 0], [11 + (o.legRx || 0), o.legR || 0]];
  legs.forEach(([lx, lift], i) => {
    if (o.kick && i === 1) return; // kicking leg drawn separately
    const bottom = 16 - lift;
    for (let y = shortsTop + 2; y < bottom; y++) {
      const isSock = y >= bottom - 2;
      const c = isSock ? (role === 'winger' && y === bottom - 2 ? P.skin : P.socks) : P.skin;
      C.set(lx, y, c); C.set(lx + 1, y, c);
    }
    const bc = role === 'winger' ? P.bootW : P.boot;
    C.set(lx, bottom, bc); C.set(lx + 1, bottom, bc); C.set(i === 0 ? lx - 1 : lx + 2, bottom, bc);
    if (role === 'defender') { C.set(lx, bottom - 3, P.white); C.set(lx + 1, bottom - 3, P.white); }
  });
  if (o.kick) {
    // kicking (right) leg: 1 windup back, 2 strike extended, 3 follow-through high
    const k = o.kick, sy = shortsTop + 2;
    if (k === 1) { C.rect(12, sy, 2, 2, P.skin); C.rect(13, sy + 2, 2, 1, P.socks); C.rect(14, sy + 3, 2, 1, P.boot); }
    else if (k === 2) { C.rect(12, sy, 2, 1, P.skin); C.rect(13, sy + 1, 3, 1, P.skin); C.rect(15, sy + 2, 2, 1, P.socks); C.rect(17, sy + 2, 2, 1, P.boot); }
    else { C.rect(12, sy - 1, 2, 1, P.skin); C.rect(14, sy - 2, 2, 1, P.socks); C.rect(16, sy - 3, 2, 1, P.boot); }
  }
  // shorts
  for (let x = 7; x <= 13; x++) { C.set(x, shortsTop, P.shorts); if (x !== 10) C.set(x, shortsTop + 1, P.shorts); }
  // torso
  const tx0 = 7, ty0 = hy + 5;
  for (let y = ty0; y < ty0 + 4; y++) for (let x = tx0; x <= 13; x++) C.set(x, y, torsoPx(P, x, y, tx0, ty0));
  if (role === 'defender') { C.set(6, ty0, P.shirtD); C.set(14, ty0, P.shirtD); }
  // collar / number on back
  if (!back) { C.set(9, ty0, P.shirt2); C.set(10, ty0, P.skin); C.set(11, ty0, P.shirt2); }
  else { C.set(10, ty0 + 1, P.white); C.set(10, ty0 + 2, P.white); C.set(9, ty0 + 1, P.white); }
  // shading on torso edge
  for (let y = ty0; y < ty0 + 4; y++) C.set(13, y, P.shirtD);
  // arms
  const sleeve = role === 'playmaker' ? P.shirt2 : P.shirt;
  const hand = role === 'goalkeeper' ? P.glove : P.skin;
  const arms = o.arms || 'down';
  const armL = (dy) => { C.set(6, ty0 + dy, sleeve); C.set(6, ty0 + dy + 1, P.skin); C.set(6, ty0 + dy + 2, hand); if (role === 'goalkeeper') C.set(5, ty0 + dy + 2, hand); };
  const armR = (dy) => { C.set(14, ty0 + dy, sleeve); C.set(14, ty0 + dy + 1, P.skin); C.set(14, ty0 + dy + 2, hand); if (role === 'goalkeeper') C.set(15, ty0 + dy + 2, hand); };
  if (arms === 'down') { armL(0); armR(0); }
  else if (arms === 'swingA') { armL(-1); armR(1); }
  else if (arms === 'swingB') { armL(1); armR(-1); }
  else if (arms === 'up') {
    C.set(6, ty0, sleeve); C.set(5, ty0 - 1, P.skin); C.set(5, ty0 - 2, hand); C.set(5, ty0 - 3, hand);
    C.set(14, ty0, sleeve); C.set(15, ty0 - 1, P.skin); C.set(15, ty0 - 2, hand); C.set(15, ty0 - 3, hand);
  } else if (arms === 'flinch') { C.set(6, ty0, sleeve); C.set(5, ty0 + 1, P.skin); C.set(5, ty0, hand); C.set(14, ty0, sleeve); C.set(15, ty0 + 1, P.skin); C.set(15, ty0, hand); }
  else if (arms === 'out') { C.set(6, ty0, sleeve); C.set(5, ty0, P.skin); C.set(4, ty0 - 1, hand); C.set(14, ty0, sleeve); C.set(15, ty0 + 1, P.skin); C.set(16, ty0 + 1, hand); }
  if (role === 'captain') { C.set(6, ty0 + 1, P.band); }
  if (role === 'support') { C.set(6, ty0 + 2, P.white); C.set(14, ty0 + 2, P.white); }
  // head
  const hx = 8 + hdx;
  for (let y = hy + 1; y <= hy + 3; y++) for (let x = hx; x <= hx + 4; x++) C.set(x, y, P.skin);
  for (let x = hx + 1; x <= hx + 3; x++) C.set(x, hy + 4, P.skin);
  C.set(hx + 4, hy + 3, P.skinD);
  if (!back) { C.set(hx + 1, hy + 2, P.eye); C.set(hx + 3, hy + 2, P.eye); }
  // hair / headgear
  const H = P.hair, st = P.hairStyle;
  const capRole = role === 'goalkeeper' && st % 2 === 0;
  if (capRole || (role === 'support' && st === 5)) {
    C.rect(hx, hy, 5, 1, P.cap); C.rect(hx - 1, hy + 1, 7, 1, P.cap);
    if (!back) C.rect(hx + 1, hy + 1, 5, 1, P.cap);
  } else if (st === 0) { C.rect(hx + 1, hy, 3, 1, H); C.rect(hx, hy + 1, 5, 1, H); if (back) C.rect(hx, hy + 2, 5, 1, H); }
  else if (st === 1) { C.rect(hx, hy + 1, 5, 1, H); if (back) C.rect(hx + 1, hy + 2, 3, 1, H); }
  else if (st === 2) { C.rect(hx + 1, hy, 3, 1, H); C.rect(hx, hy + 1, 5, 1, H); C.set(hx, hy + 2, H); C.set(hx + 4, hy + 2, H); C.set(hx, hy + 3, H); C.set(hx + 4, hy + 3, H); if (back) C.rect(hx, hy + 2, 5, 3, H); }
  else if (st === 3) { C.rect(hx, hy - 1, 5, 1, H); C.rect(hx - 1, hy, 7, 2, H); if (back) C.rect(hx - 1, hy + 2, 7, 1, H); }
  else if (st === 4) { C.set(hx + 2, hy + 1, P.skinD); }
  else { C.rect(hx + 2, hy - 1, 1, 2, H); C.rect(hx + 1, hy + 1, 3, 1, H); if (back) C.rect(hx + 2, hy + 2, 1, 2, H); }
  if (role === 'striker') { C.rect(hx, hy + 1, 5, 1, P.shirt2); }
  if (role === 'support' && st !== 5) { C.rect(hx, hy + 1, 5, 1, P.white); }
  if (o.ball) { const bx = o.ball[0], byy = o.ball[1]; C.set(bx, byy, P.white); C.set(bx + 1, byy, P.white); C.set(bx, byy + 1, P.white); C.set(bx + 1, byy + 1, P.eye); }
}

function drawLying(C, P, role, kind) {
  // horizontal poses: 'slide' (feet first to the right), 'dive' (arms to the right), 'fall', 'flat'
  const hand = role === 'goalkeeper' ? P.glove : P.skin;
  if (kind === 'slide') {
    C.rect(3, 9, 4, 3, P.skin); C.rect(3, 8, 4, 1, P.hair); C.set(5, 10, P.eye);
    C.rect(6, 11, 5, 3, P.shirt); C.rect(7, 11, 2, 1, P.shirt2); C.set(5, 12, hand); C.set(4, 13, hand);
    C.rect(10, 13, 3, 2, P.shorts); C.rect(13, 13, 2, 1, P.skin); C.rect(13, 14, 3, 1, P.skin); C.rect(15, 13, 2, 2, P.socks);
    C.rect(17, 13, 2, 2, role === 'winger' ? P.bootW : P.boot);
    C.rect(12, 15, 3, 1, P.socks); C.rect(15, 15, 2, 1, P.boot);
  } else if (kind === 'dive') {
    C.rect(16, 7, 2, 2, hand); C.rect(14, 8, 2, 1, P.skin); C.rect(16, 10, 2, 2, hand); C.rect(14, 10, 2, 1, P.skin);
    C.rect(10, 8, 4, 3, P.skin); C.rect(10, 7, 4, 1, P.hair); C.set(12, 9, P.eye);
    C.rect(5, 9, 5, 4, P.shirt); C.rect(5, 9, 5, 1, P.shirt2); C.rect(3, 10, 2, 3, P.shorts);
    C.rect(1, 11, 2, 2, P.socks); C.rect(0, 11, 1, 2, P.boot);
  } else if (kind === 'fall') {
    C.rect(5, 6, 4, 3, P.skin); C.rect(5, 5, 4, 1, P.hair);
    C.rect(7, 9, 5, 4, P.shirt); C.set(6, 9, hand); C.set(13, 8, hand);
    C.rect(10, 13, 4, 2, P.shorts); C.rect(13, 14, 3, 1, P.skin); C.rect(16, 14, 2, 2, P.boot); C.rect(11, 15, 2, 1, P.socks); C.rect(12, 16, 2, 1, P.boot);
  } else {
    C.rect(2, 12, 4, 4, P.skin); C.rect(1, 12, 1, 4, P.hair); C.set(4, 13, P.eye); C.set(4, 14, P.eye);
    C.rect(6, 12, 6, 4, P.shirt); C.rect(6, 12, 6, 1, P.shirt2); C.set(7, 11, hand); C.set(9, 16, hand);
    C.rect(12, 12, 3, 4, P.shorts); C.rect(15, 12, 2, 1, P.skin); C.rect(15, 15, 2, 1, P.skin); C.rect(17, 12, 2, 1, P.boot); C.rect(17, 15, 2, 1, P.boot);
  }
}

function drawFrame(C, P, role, f, back) {
  const B = { back };
  switch (f) {
    case 0: drawStanding(C, P, role, { ...B, arms: 'down', ball: role === 'playmaker' ? [13, 15] : null }); break;
    case 1: drawStanding(C, P, role, { ...B, by: 1, arms: 'down', ball: role === 'playmaker' ? [13, 15] : null }); break;
    case 2: drawStanding(C, P, role, { ...B, legL: 1, legLx: -1, arms: 'swingA', ball: role === 'playmaker' ? [14, 15] : null }); break;
    case 3: drawStanding(C, P, role, { ...B, by: -1, arms: 'down', ball: role === 'playmaker' ? [15, 15] : null }); break;
    case 4: drawStanding(C, P, role, { ...B, legR: 1, legRx: 1, arms: 'swingB', ball: role === 'playmaker' ? [14, 15] : null }); break;
    case 5: drawStanding(C, P, role, { ...B, by: -1, arms: 'down', ball: role === 'playmaker' ? [13, 15] : null }); break;
    case 6: drawStanding(C, P, role, { ...B, kick: 1, arms: 'swingB', headDx: -1 }); break;
    case 7: drawStanding(C, P, role, { ...B, kick: 2, arms: 'out' }); break;
    case 8: drawStanding(C, P, role, { ...B, kick: 3, arms: 'swingA', by: -1 }); break;
    case 9: drawLying(C, P, role, 'slide'); break;
    case 10: drawLying(C, P, role, 'slide'); C.set(19, 15, P.white); break;
    case 11: drawStanding(C, P, role, { ...B, arms: 'flinch', headDx: -1, by: 1 }); break;
    case 12: drawStanding(C, P, role, { ...B, arms: 'down', headDx: -1 }); break;
    case 13: drawStanding(C, P, role, { ...B, arms: 'down', headDx: 1, by: 1 }); break;
    case 14: drawStanding(C, P, role, { ...B, arms: 'up', by: -1 }); break;
    case 15: drawStanding(C, P, role, { ...B, arms: 'up' }); break;
    case 16: drawLying(C, P, role, 'fall'); break;
    case 17: drawLying(C, P, role, 'flat'); break;
    case 18: drawLying(C, P, role, 'flat'); break;
    case 19: drawStanding(C, P, role, { ...B, arms: 'up', by: -2, legL: 1, legR: 1 }); break;
    case 20: drawStanding(C, P, role, { ...B, arms: 'up', by: 0 }); break;
    case 21: drawLying(C, P, role, 'dive'); break;
    case 22: drawLying(C, P, role, 'dive'); break;
  }
}

function outlined(C, oc) {
  const a = C.a, o = new Uint32Array(a);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    if (a[y * CW + x]) continue;
    if ((x > 0 && a[y * CW + x - 1]) || (x < CW - 1 && a[y * CW + x + 1]) || (y > 0 && a[(y - 1) * CW + x]) || (y < CH - 1 && a[(y + 1) * CW + x])) o[y * CW + x] = oc;
  }
  return o;
}

// rows: role(7) x variant(6) x back(2) x flip(2)
function rowIndex(ri, v, back, flip) { return ((ri * VARIANTS + v) * 2 + (back ? 1 : 0)) * 2 + (flip ? 1 : 0); }
function buildAtlas(team, kit) {
  const rows = ROLES.length * VARIANTS * 4;
  const W = NF * CW, H = rows * CH;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(W, H);
  const buf = new Uint32Array(img.data.buffer);
  // white silhouette for hit flash (frame "hit" only)
  const fl = document.createElement('canvas'); fl.width = CW; fl.height = rows * CH;
  const fctx = fl.getContext('2d'); const fimg = fctx.createImageData(CW, rows * CH); const fbuf = new Uint32Array(fimg.data.buffer);
  const th = hstr(team.id);
  const white = rgba32('#ffffff');
  for (let ri = 0; ri < ROLES.length; ri++) for (let v = 0; v < VARIANTS; v++) {
    const P = palette(kit, ROLES[ri], v, th);
    for (let back = 0; back < 2; back++) for (let f = 0; f < NF; f++) {
      const C = new Cell(); drawFrame(C, P, ROLES[ri], f, !!back);
      const o = outlined(C, P.outline);
      for (let flip = 0; flip < 2; flip++) {
        const r = rowIndex(ri, v, back, flip), ox = f * CW, oy = r * CH;
        for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
          const c = o[y * CW + (flip ? CW - 1 - x : x)];
          if (c) buf[(oy + y) * W + ox + x] = c;
          if (c && f === 11) fbuf[(oy + y) * CW + x] = white;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0); fctx.putImageData(fimg, 0, 0);
  return { canvas: cv, flash: fl, kit };
}

function frameFor(u, t) {
  // returns [frameIndex]
  let st = u.alive ? (u.flash > 0.04 ? 'hit' : u.act || '') : 'ko';
  if (!st) {
    if (u.state === 'stun') st = 'stun';
    else if (u.state === 'tackle') st = 'tackle';
    else if (u.state === 'victory') st = 'victory';
    else if (Math.abs(u.mvx) + Math.abs(u.mvy) > 4) st = 'run';
    else st = 'idle';
  }
  const F = FRAMES[st] || FRAMES.idle;
  let i;
  if (st === 'ko') { i = u.deadT < 0.12 ? 0 : 1 + (u.deadT > 0.3 ? 1 : 0); }
  else if (st === 'kick') i = Math.min(F.length - 1, Math.floor((0.24 - Math.max(0, u.actT)) / 0.08));
  else if (st === 'run') { const sp = Math.min(1.8, (Math.abs(u.mvx) + Math.abs(u.mvy)) / 28); i = Math.floor(u.animT * 9 * Math.max(0.7, sp)) % F.length; }
  else if (st === 'idle') i = Math.floor(u.animT * 2.2 + u.wob) % F.length;
  else if (st === 'victory') i = Math.floor(u.animT * 5 + u.wob) % F.length;
  else i = Math.floor(u.animT * 8) % F.length;
  return F[Math.max(0, Math.min(F.length - 1, i))];
}

// ---------- crests / logo badges ----------
const PIX = (function () { return { text: (g, str, x, y, color, scale) => root.FWFont && root.FWFont.draw(g, str, x, y, { scale: scale || 1, color, outline: '#0b0d16', shadow: null, align: 'center' }) }; })();
function initials(team) {
  const stop = new Set(['FC', 'SK', 'AC', 'CF', 'SC', 'AFC', 'CD', 'RC', 'SV', 'VFB', 'VFL', 'TSG', 'AS', 'SS', 'US', 'UD', 'RCD', 'FK', 'JK', 'KV', 'KRC', 'RSC', 'OGC', 'PSV', 'AZ', 'NEC', 'SL', 'GD', 'CA', 'RB', 'OSC', 'BV', 'FSV', 'DE', 'DA', 'DO', 'DEL', 'LA', 'LE', 'THE', 'OF', 'Y', 'E', 'ET', 'AND', '1.', 'SD', 'SG', 'CP', 'FCV', 'HSV', 'SPORTING', 'CLUB', 'REAL', 'ATHLETIC', 'OLYMPIQUE', 'STADE', 'ROYAL', 'RACING', 'UNION', 'SPORT']);
  const nm = (team.display_name_tr || team.name).replace(/[.'’]/g, ' ');
  const words = nm.split(/[\s\-&/]+/).filter(Boolean);
  let core = words.filter(w => !stop.has(root.FWFont.upper(w)));
  if (!core.length) core = words;
  if (team.type === 'national') return (team.country_code || core[0].slice(0, 3)).toUpperCase().slice(0, 3);
  if (core.length === 1) return root.FWFont.upper(core[0]).replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '').slice(0, 3);
  return core.slice(0, 3).map(w => root.FWFont.upper(w)[0]).join('');
}
function shortName(team, max, lang) {
  const n = lang === 'tr' ? (team.display_name_tr || team.name) : team.name;
  const f = root.FWFont;
  if (f.measure(n) <= max) return n;
  // drop common prefixes then truncate
  const parts = n.split(' ');
  for (let k = 1; k < parts.length; k++) { const s = parts.slice(k).join(' '); if (s.length > 2 && f.measure(s) <= max) return s; }
  let s = n; while (s.length > 3 && f.measure(s + '.') > max) s = s.slice(0, -1);
  return s.trim() + '.';
}
function pixelize(cv) {
  const g = cv.getContext('2d'); const im = g.getImageData(0, 0, cv.width, cv.height); const d = im.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
  g.putImageData(im, 0, 0); return cv;
}
function shieldPath(g, x, y, w, h) {
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h * 0.55);
  g.quadraticCurveTo(x + w, y + h * 0.85, x + w / 2, y + h); g.quadraticCurveTo(x, y + h * 0.85, x, y + h * 0.55); g.closePath();
}
function generatedCrest(team, size) {
  const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const p = vivid(team.visual.primary_color), s = vivid(team.visual.secondary_color);
  const h = hstr(team.id), pat = h % 6;
  const m = Math.max(1, Math.round(size / 16));
  const x = m, y = m, w = size - 2 * m, hh = size - 2 * m;
  g.fillStyle = '#0b0d16'; shieldPath(g, x - m, y - m, w + 2 * m, hh + 2 * m); g.fill();
  g.fillStyle = lum(p) > 0.5 ? '#2a2f45' : '#f6d66b'; shieldPath(g, x, y, w, hh); g.fill();
  const ix = x + m, iy = y + m, iw = w - 2 * m, ih = hh - 2 * m;
  g.save(); shieldPath(g, ix, iy, iw, ih); g.clip();
  g.fillStyle = p; g.fillRect(ix, iy, iw, ih);
  g.fillStyle = s;
  if (pat === 0) { g.beginPath(); g.moveTo(ix, iy + ih * 0.25); g.lineTo(ix + iw * 0.25, iy); g.lineTo(ix + iw, iy + ih * 0.75); g.lineTo(ix + iw * 0.75, iy + ih); g.closePath(); g.fill(); }
  else if (pat === 1) { const n = 5; for (let i = 1; i < n; i += 2) g.fillRect(ix + iw * i / n, iy, iw / n, ih); }
  else if (pat === 2) g.fillRect(ix, iy + ih * 0.38, iw, ih * 0.24);
  else if (pat === 3) { g.beginPath(); g.moveTo(ix, iy + ih * 0.7); g.lineTo(ix + iw / 2, iy + ih * 0.35); g.lineTo(ix + iw, iy + ih * 0.7); g.lineTo(ix + iw, iy + ih * 0.95); g.lineTo(ix + iw / 2, iy + ih * 0.6); g.lineTo(ix, iy + ih * 0.95); g.fill(); }
  else if (pat === 4) { g.fillRect(ix + iw / 2, iy, iw / 2, ih / 2); g.fillRect(ix, iy + ih / 2, iw / 2, ih / 2); }
  else { g.beginPath(); g.arc(ix + iw / 2, iy + ih * 0.45, iw * 0.34, 0, 7); g.fill(); }
  g.restore();
  pixelize(cv);
  // initials plate
  const ini = initials(team);
  const sc = Math.max(1, Math.floor(size / 32));
  const tw = root.FWFont.measure(ini, true) * sc;
  const ty = Math.round(y + hh * 0.42 - 3.5 * sc);
  g.fillStyle = 'rgba(11,13,22,0.78)'; g.fillRect(Math.round(size / 2 - tw / 2 - sc * 2), ty - sc * 2, tw + sc * 4, 11 * sc);
  root.FWFont.draw(g, ini, size / 2, ty, { scale: sc, color: '#ffffff', outline: null, shadow: null, align: 'center', bold: true });
  // small star on top
  if (size >= 32) { g.fillStyle = '#ffe14d'; const cx = Math.round(size / 2), sy = y + 2 * m; g.fillRect(cx - sc, sy, sc * 2, sc); g.fillRect(cx - 2 * sc, sy + sc, sc * 4, sc); g.fillRect(cx - sc, sy + 2 * sc, sc * 2, sc); }
  return cv;
}
function flagBadge(img, size) {
  // flag image -> pixel badge (aspect kept), dark frame + gloss
  const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
  const g = cv.getContext('2d');
  const ar = (img.naturalWidth || img.width) / (img.naturalHeight || img.height) || 1.5;
  let fw = size - 4, fh = Math.round(fw / ar); if (fh > size - 4) { fh = size - 4; fw = Math.round(fh * ar); }
  const fx = Math.round((size - fw) / 2), fy = Math.round((size - fh) / 2);
  // downsample then pixel-upscale for a crisp pixel look
  const px = document.createElement('canvas'); const pw = Math.max(6, Math.round(fw / Math.max(1, Math.round(size / 32)))), ph = Math.max(4, Math.round(pw / ar));
  px.width = pw; px.height = ph; const pg = px.getContext('2d'); pg.imageSmoothingEnabled = true; pg.imageSmoothingQuality = 'high'; pg.drawImage(img, 0, 0, pw, ph);
  g.fillStyle = '#0b0d16'; g.fillRect(fx - 2, fy - 2, fw + 4, fh + 4);
  g.fillStyle = '#f6d66b'; g.fillRect(fx - 1, fy - 1, fw + 2, fh + 2);
  g.imageSmoothingEnabled = false; g.drawImage(px, fx, fy, fw, fh);
  g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(fx, fy, fw, Math.max(1, Math.round(fh / 8)));
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(fx, fy + fh - Math.max(1, Math.round(fh / 8)), fw, Math.max(1, Math.round(fh / 8)));
  return cv;
}
function imageBadge(img, size) {
  // user-supplied logo: fit inside, pixel-quantised alpha so it matches the art style
  const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
  const g = cv.getContext('2d');
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const k = Math.min((size - 2) / iw, (size - 2) / ih);
  const w = Math.max(1, Math.round(iw * k)), h = Math.max(1, Math.round(ih * k));
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(img, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
  return cv;
}
// procedural flags for nations whose Commons file could not be fetched at build time (simple public geometric designs)
const SIMPLE_FLAGS = {
  NAT_NORWAY: g => { g('#ba0c2f', 0, 0, 22, 16); g('#fff', 6, 0, 4, 16); g('#fff', 0, 6, 22, 4); g('#00205b', 7, 0, 2, 16); g('#00205b', 0, 7, 22, 2); },
  NAT_ROMANIA: g => { g('#002b7f', 0, 0, 8, 16); g('#fcd116', 8, 0, 8, 16); g('#ce1126', 16, 0, 8, 16); },
  NAT_ESTONIA: g => { g('#0072ce', 0, 0, 24, 6); g('#000', 0, 6, 24, 5); g('#fff', 0, 11, 24, 5); },
  NAT_LITHUANIA: g => { g('#fdb913', 0, 0, 24, 6); g('#006a44', 0, 6, 24, 5); g('#c1272d', 0, 11, 24, 5); },
  NAT_SLOVENIA: g => { g('#fff', 0, 0, 24, 6); g('#0057b8', 0, 6, 24, 5); g('#ed1c24', 0, 11, 24, 5); g('#0057b8', 5, 3, 5, 6); g('#ed1c24', 5, 8, 5, 1); g('#fff', 6, 5, 3, 2); },
  NAT_BELARUS: g => { g('#c8313e', 0, 0, 24, 11); g('#4aa657', 0, 11, 24, 5); g('#fff', 0, 0, 4, 16); g('#c8313e', 1, 1, 2, 2); g('#c8313e', 1, 5, 2, 2); g('#c8313e', 1, 9, 2, 2); g('#c8313e', 1, 13, 2, 2); },
  NAT_BOSNIA_AND_HERZEGOVINA: g => { g('#002395', 0, 0, 24, 16); g('#fecb00', 7, 0, 10, 2); g('#fecb00', 9, 2, 8, 3); g('#fecb00', 11, 5, 6, 3); g('#fecb00', 13, 8, 4, 3); g('#fecb00', 15, 11, 2, 3); g('#fff', 5, 1, 1, 1); g('#fff', 7, 4, 1, 1); g('#fff', 9, 7, 1, 1); g('#fff', 11, 10, 1, 1); g('#fff', 13, 13, 1, 1); },
  NAT_MONTENEGRO: g => { g('#d4af37', 0, 0, 24, 16); g('#c40308', 1, 1, 22, 14); g('#d4af37', 10, 5, 4, 6); g('#d4af37', 8, 6, 2, 2); g('#d4af37', 14, 6, 2, 2); },
  NAT_SAN_MARINO: g => { g('#fff', 0, 0, 24, 8); g('#5eb6e4', 0, 8, 24, 8); g('#d4af37', 10, 5, 4, 6); g('#4a8f3c', 11, 6, 2, 2); }
};
function simpleFlagImage(id) {
  const f = SIMPLE_FLAGS[id]; if (!f) return null;
  const cv = document.createElement('canvas'); cv.width = 24; cv.height = 16;
  const g = cv.getContext('2d'); f((c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); });
  return cv;
}

// base ring sprite under each unit (team colour) + shadow
function baseRing(kit) {
  const cv = document.createElement('canvas'); cv.width = 13; cv.height = 6;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(2, 1, 9, 4); g.fillRect(1, 2, 11, 2);
  g.fillStyle = kit.ring; g.fillRect(3, 0, 7, 1); g.fillRect(3, 5, 7, 1); g.fillRect(1, 1, 2, 1); g.fillRect(10, 1, 2, 1); g.fillRect(1, 4, 2, 1); g.fillRect(10, 4, 2, 1); g.fillRect(0, 2, 1, 2); g.fillRect(12, 2, 1, 2);
  return cv;
}

root.FWSprites = { CW, CH, FOOT_X, FOOT_Y, FRAMES, NF, VARIANTS, ROLES, makeKits, buildAtlas, rowIndex, frameFor, generatedCrest, flagBadge, imageBadge,
  simpleFlagImage, SIMPLE_FLAGS, baseRing, initials, shortName, color: { hex, toHex, mix, lum, contrast, cdist, bright, vivid } };
})(typeof window !== 'undefined' ? window : globalThis);
