// 25 species (12 land, 3 marine, 10 fish) with per-direction animation frames. Each species has its own
// silhouette painter; frames vary legs/wings/fins/body bob so animations visibly move.
import { Pix, shade, prng } from './raster.mjs';
import { P } from './palette.mjs';

const LOOK = {
  ANIMAL_CRAB: { c: '#d65a3a' }, ANIMAL_HERMIT_CRAB: { c: '#c88a5a', shell: '#e8c8a0' }, ANIMAL_RABBIT: { c: '#c9a27a', belly: '#efe0c8' },
  ANIMAL_LIZARD: { c: '#5aa860', belly: '#c9e07a' }, ANIMAL_FROG: { c: '#4fae4a', belly: '#d8f0a0' }, ANIMAL_FOREST_BIRD: { c: '#3fa8d8', wing: '#e84a3a', belly: '#f2d054' },
  ANIMAL_SEABIRD: { c: '#f0f0ea', wing: '#8a9aa6', belly: '#ffffff', beak: '#f2b04a' }, ANIMAL_FRUIT_BAT: { c: '#5a4a52', wing: '#3a2e36' }, ANIMAL_MONKEY: { c: '#8a5a36', belly: '#e0b890' },
  ANIMAL_BOAR: { c: '#6a5040', belly: '#8a6a50', tusk: '#f5ead0' }, ANIMAL_SNAKE: { c: '#7a9a3a', stripe: '#3e5a22' }, ANIMAL_CROCODILE: { c: '#4f6a3e', belly: '#a8b07a' },
  MARINE_TURTLE: { c: '#5a8a4a', shell: '#7a6a3a' }, MARINE_RAY: { c: '#7a8aa0', belly: '#d8e0e8' }, MARINE_REEF_SHARK: { c: '#7a8a96', belly: '#e8eef2' },
  FISH_SARDINE: { c: '#a8c8d8', s: 0.7 }, FISH_MULLET: { c: '#9aa8a0', s: 0.85 }, FISH_FRESHWATER_BASS: { c: '#6a8a4a', s: 0.9, fin: '#4a6a3a' }, FISH_REEF: { c: '#f2a03a', s: 0.8, stripe: '#ffffff' },
  FISH_PARROT: { c: '#3ac0a8', s: 0.95, fin: '#e86a9a' }, FISH_GROUPER: { c: '#8a6a4a', s: 1.05, spots: '#5a4030' }, FISH_MACKEREL: { c: '#4a7ab0', s: 0.85, stripe: '#2a4a70' },
  FISH_BARRACUDA: { c: '#9ab0c0', s: 1.15, long: true }, FISH_TUNA: { c: '#2f5a8a', s: 1.2, belly: '#c8d8e8', fin: '#f2d054' }, FISH_PUFFER: { c: '#e8d07a', s: 0.75, spots: '#8a6a3a', round: true },
};

function legs4(p, x, y, len, ph, c, side) {
  const o = Math.round(Math.sin(ph) * 2), o2 = Math.round(Math.sin(ph + Math.PI) * 2);
  if (side) { p.line(x - 6, y, x - 6 + o, y + len, c, 2); p.line(x - 3, y, x - 3 + o2, y + len, shade(c, -0.25), 2); p.line(x + 4, y, x + 4 + o2, y + len, c, 2); p.line(x + 7, y, x + 7 + o, y + len, shade(c, -0.25), 2); }
  else { p.line(x - 5, y, x - 5, y + len + Math.max(0, o), c, 2); p.line(x + 5, y, x + 5, y + len + Math.max(0, o2), c, 2); }
}

export function drawAnimal(id, anim, dir, f, n) {
  const big = id.startsWith('MARINE_');
  const fish = id.startsWith('FISH_');
  const S = fish ? 32 : big ? 64 : 48;
  const p = new Pix(S, S); const L = LOOK[id];
  const ph = (f / Math.max(1, n)) * Math.PI * 2;
  const side = dir === 'left' || dir === 'right';
  const cx = S / 2, gy = S - 8;
  const moving = anim === 'move' || anim === 'swim' || anim === 'attack';
  const bob = moving ? Math.round(Math.abs(Math.sin(ph)) * 2) : (f % 2);
  const react = anim === 'react' || anim === 'warn';
  if (!fish && !big) p.ellipse(cx, gy + 2, S / 5, 2.5, [20, 30, 30, 70]);
  switch (id) {
    case 'ANIMAL_CRAB': case 'ANIMAL_HERMIT_CRAB': {
      const hide = id === 'ANIMAL_HERMIT_CRAB' && react;
      if (id === 'ANIMAL_HERMIT_CRAB') { p.ellipse(cx + (side ? 3 : 0), gy - 8, 9, 8, L.shell); for (let a = 0; a < 6; a += 0.3) p.set(cx + (side ? 3 : 0) + Math.cos(a) * a * 1.2, gy - 8 + Math.sin(a) * a, shade(L.shell, -0.3)); }
      if (!hide) {
        p.ellipse(cx, gy - 5, 8, 5, L.c);
        const claw = react || anim === 'attack' ? 3 : Math.round(Math.sin(ph) * 1.5);
        p.circle(cx - 9, gy - 9 - claw, 3, shade(L.c, 0.1)); p.circle(cx + 9, gy - 9 - claw, 3, shade(L.c, 0.1));
        for (let i = 0; i < 3; i++) { const o = Math.round(Math.sin(ph + i) * 1.5); p.line(cx - 6, gy - 4 + i, cx - 11, gy - 1 + i + o, L.c); p.line(cx + 6, gy - 4 + i, cx + 11, gy - 1 + i - o, L.c); }
        if (dir !== 'up') { p.set(cx - 2, gy - 9, P.black); p.set(cx + 2, gy - 9, P.black); }
      }
      break;
    }
    case 'ANIMAL_RABBIT': {
      const hop = moving ? Math.round(Math.abs(Math.sin(ph)) * 5) : 0;
      if (side) { p.ellipse(cx, gy - 9 - hop, 9, 6, L.c); p.ellipse(cx + (dir === 'right' ? 8 : -8), gy - 14 - hop, 5, 4.5, L.c); const ex = cx + (dir === 'right' ? 7 : -9); p.ellipse(ex, gy - 22 - hop + (react ? -2 : 0), 1.6, 5, L.c); p.ellipse(ex + 2, gy - 22 - hop, 1.6, 5, shade(L.c, -0.1)); p.circle(cx + (dir === 'right' ? -9 : 9), gy - 11 - hop, 2.5, L.belly); p.set(cx + (dir === 'right' ? 10 : -10), gy - 15 - hop, P.black); legs4(p, cx, gy - 5 - hop, 4 + (hop ? 1 : 0), ph, shade(L.c, -0.1), true); }
      else { p.ellipse(cx, gy - 9 - hop, 7, 7, L.c); p.ellipse(cx, gy - 16 - hop, 5, 4.5, L.c); p.ellipse(cx - 2, gy - 24 - hop, 1.6, 5, L.c); p.ellipse(cx + 2, gy - 24 - hop, 1.6, 5, L.c); if (dir === 'down') { p.ellipse(cx, gy - 7 - hop, 4, 4, L.belly); p.set(cx - 2, gy - 17 - hop, P.black); p.set(cx + 2, gy - 17 - hop, P.black); } else p.circle(cx, gy - 5 - hop, 2.5, L.belly); }
      break;
    }
    case 'ANIMAL_LIZARD': case 'ANIMAL_CROCODILE': case 'ANIMAL_SNAKE': {
      const croc = id === 'ANIMAL_CROCODILE', snake = id === 'ANIMAL_SNAKE';
      const len = croc ? 34 : snake ? 30 : 22, thick = croc ? 6 : snake ? 3 : 3.5;
      const segs = 14;
      for (let i = 0; i < segs; i++) {
        const t = i / (segs - 1); const wav = Math.sin(ph * (snake ? 1 : 1) + t * (snake ? 9 : 4)) * (snake ? 3 : moving ? 2 : 0.6);
        const along = (t - 0.5) * len; const across = wav;
        const x = side ? cx + (dir === 'right' ? along : -along) : cx + across;
        const y = side ? gy - 6 + across * 0.4 : gy - 8 + (dir === 'down' ? along : -along) * 0.55;
        const th = thick * (snake ? (1 - t * 0.5) : t < 0.7 ? 1 : 1 - (t - 0.7) * 2.5);
        p.ellipse(x, y, Math.max(1, th), Math.max(1, th * 0.8), i % 3 === 0 && L.stripe ? L.stripe : L.c);
      }
      const hx = side ? cx + (dir === 'right' ? len / 2 + 2 : -len / 2 - 2) : cx; const hy = side ? gy - 6 : gy - 8 + (dir === 'down' ? len * 0.3 : -len * 0.3);
      const open = anim === 'attack' && f % 2 === 0;
      p.ellipse(hx, hy, croc ? 6 : 3.5, croc ? 3.5 : 2.6, shade(L.c, 0.05));
      if (open) p.rect(hx - (croc ? 5 : 2), hy, croc ? 10 : 4, 2, '#c84a3a');
      if (snake && (anim === 'warn' || anim === 'attack')) p.line(hx + (dir === 'left' ? -3 : 3), hy, hx + (dir === 'left' ? -7 : 7), hy + 1, '#d82a2a');
      if (!snake) legs4(p, cx, gy - 5, croc ? 4 : 3, ph, shade(L.c, -0.2), side);
      if (dir !== 'up') { p.set(hx - 1, hy - 1, P.yellow); if (!side) p.set(hx + 1, hy - 1, P.yellow); }
      if (croc && L.belly) p.line(cx - 10, gy - 3, cx + 10, gy - 3, L.belly);
      break;
    }
    case 'ANIMAL_FROG': {
      const jump = moving ? Math.round(Math.abs(Math.sin(ph)) * 6) : 0; const sq = react ? 2 : 0;
      p.ellipse(cx, gy - 7 - jump, 8, 6 - sq, L.c); p.circle(cx - 4, gy - 12 - jump, 2.5, L.c); p.circle(cx + 4, gy - 12 - jump, 2.5, L.c);
      p.set(cx - 4, gy - 13 - jump, P.black); p.set(cx + 4, gy - 13 - jump, P.black);
      if (dir === 'down') p.ellipse(cx, gy - 5 - jump, 5, 3, L.belly);
      p.line(cx - 7, gy - 4 - jump, cx - 11, gy - 1 - jump + (jump ? 4 : 0), L.c, 2); p.line(cx + 7, gy - 4 - jump, cx + 11, gy - 1 - jump + (jump ? 4 : 0), L.c, 2);
      break;
    }
    case 'ANIMAL_FOREST_BIRD': case 'ANIMAL_SEABIRD': case 'ANIMAL_FRUIT_BAT': {
      const bat = id === 'ANIMAL_FRUIT_BAT'; const sea = id === 'ANIMAL_SEABIRD';
      const fly = moving || bat; const lift = fly ? 8 + Math.round(Math.sin(ph) * 2) : 0;
      const flap = fly ? Math.sin(ph * 2) : 0;
      const by = gy - 8 - lift - (sea && !fly ? 5 : 0); // gull stands tall on long legs
      if (fly) {
        const span = bat ? 14 : sea ? 19 : 9; // gull: long narrow wings; forest bird: short rounded wings
        p.poly([[cx - 2, by], [cx - span, by - 6 * flap - 2], [cx - span + 4, by + 3]], L.wing || shade(L.c, -0.2));
        p.poly([[cx + 2, by], [cx + span, by - 6 * flap - 2], [cx + span - 4, by + 3]], L.wing || shade(L.c, -0.2));
        if (bat) { p.line(cx - span, by - 6 * flap - 2, cx - span + 2, by + 4, shade(L.c, -0.3)); p.line(cx + span, by - 6 * flap - 2, cx + span - 2, by + 4, shade(L.c, -0.3)); }
      }
      if (sea) p.ellipse(cx, by, side ? 8 : 5, side ? 3.5 : 4.5, L.c); else p.ellipse(cx, by, 5, 4, L.c);
      const hx = side ? cx + (dir === 'right' ? (sea ? 8 : 5) : (sea ? -8 : -5)) : cx, hy = by - (sea ? 5 : 4);
      if (sea && side) p.line(cx + (dir === 'right' ? 5 : -5), by - 1, hx, hy + 2, L.c, 3); // long neck
      p.circle(hx, hy, 3.4, bat ? L.c : shade(L.c, 0.05));
      if (bat) { p.poly([[hx - 3, hy - 2], [hx - 2, hy - 6], [hx - 1, hy - 2]], L.c); p.poly([[hx + 1, hy - 2], [hx + 2, hy - 6], [hx + 3, hy - 2]], L.c); p.set(hx - 1, hy, '#e84a3a'); p.set(hx + 1, hy, '#e84a3a'); }
      else {
        if (dir !== 'up') p.set(hx + (dir === 'left' ? -1 : 1), hy - 1, P.black);
        const bx = side ? hx + (dir === 'right' ? 3 : -5) : hx - 1; p.rect(bx, hy, 3, 2, L.beak || '#f2b04a');
        if (!fly) { p.ellipse(cx + (side ? (dir === 'right' ? -4 : 4) : 0), by + 1, 4, 2.5, L.wing || shade(L.c, -0.2)); p.line(cx - 1, by + 4, cx - 1 - (f % 2), gy, '#e8a040'); p.line(cx + 1, by + 4, cx + 1 + (f % 2), gy, '#e8a040'); }
        if (L.belly && dir === 'down') p.ellipse(cx, by + 1, 3, 2, L.belly);
        if (id === 'ANIMAL_FOREST_BIRD' && !fly) p.line(cx + (dir === 'right' ? -5 : 5), by, cx + (dir === 'right' ? -9 : 9), by + 4, L.wing, 2);
        if (id === 'ANIMAL_FOREST_BIRD') { const cs = side ? (dir === 'right' ? -1 : 1) : 0; p.poly([[hx - 1, hy - 3], [hx + cs * 3, hy - 8], [hx + 2, hy - 3]], L.wing); p.poly([[hx + cs * 2, hy - 3], [hx + cs * 4 + (cs ? 0 : -3), hy - 7], [hx + 1, hy - 2]], L.wing); } // crest
        if (sea && !fly) { const back = side ? (dir === 'right' ? -1 : 1) : 0; // long dark folded wingtips crossing past the tail
          if (back) p.poly([[cx - back * 2, by - 2], [cx + back * 13, by + 1], [cx + back * 4, by + 3]], '#4a5560');
          else { p.line(cx - 4, by - 1, cx - 6, by + 9, '#4a5560', 2); p.line(cx + 4, by - 1, cx + 6, by + 9, '#4a5560', 2); } }
      }
      break;
    }
    case 'ANIMAL_MONKEY': {
      const hopm = moving ? Math.round(Math.abs(Math.sin(ph)) * 3) : 0;
      const by = gy - 12 - hopm;
      for (let a = 0; a < 3; a += 0.15) p.set(cx + (side ? (dir === 'right' ? -1 : 1) : 1) * (6 + a * 3), by + 6 - Math.sin(a * 2 + ph) * 4 - a * 2, L.c);
      p.ellipse(cx, by + 2, 6, 7, L.c); if (dir === 'down') p.ellipse(cx, by + 3, 3.5, 4.5, L.belly);
      p.circle(cx + (side ? (dir === 'right' ? 2 : -2) : 0), by - 7, 5, L.c);
      if (dir !== 'up') { p.ellipse(cx + (side ? (dir === 'right' ? 3 : -3) : 0), by - 6, 3.5, 3, L.belly); p.set(cx - 2 + (side ? (dir === 'right' ? 3 : -3) : 0), by - 8, P.black); p.set(cx + 1 + (side ? (dir === 'right' ? 3 : -3) : 0), by - 8, P.black); }
      p.circle(cx - 5, by - 8, 1.8, L.belly); p.circle(cx + 5, by - 8, 1.8, L.belly);
      const sw = Math.round(Math.sin(ph) * 3) + (react ? -6 : 0);
      p.line(cx - 5, by, cx - 8, by + 7 + sw, L.c, 2); p.line(cx + 5, by, cx + 8, by + 7 - sw, L.c, 2);
      p.line(cx - 3, by + 8, cx - 4, gy - hopm, L.c, 2); p.line(cx + 3, by + 8, cx + 4, gy - hopm, L.c, 2);
      break;
    }
    case 'ANIMAL_BOAR': {
      const charge = anim === 'attack'; const lunge = charge ? Math.round(Math.sin(ph) * 3) : 0;
      if (side) {
        const s = dir === 'right' ? 1 : -1;
        p.ellipse(cx + lunge * s, gy - 11, 14, 9, L.c); p.ellipse(cx + lunge * s, gy - 8, 12, 5, L.belly);
        for (let i = -10; i <= 6; i += 3) p.line(cx + i * s + lunge * s, gy - 20, cx + i * s + lunge * s + 1, gy - 18, shade(L.c, -0.3));
        const hx = cx + 13 * s + lunge * s; p.ellipse(hx, gy - 10, 6, 5, L.c); p.rect(hx + 3 * s - (s < 0 ? 3 : 0), gy - 9, 4, 3, '#c09080');
        p.line(hx + 3 * s, gy - 8, hx + 5 * s, gy - 12, L.tusk); p.set(hx, gy - 13, react ? '#e83a3a' : P.black);
        legs4(p, cx + lunge * s, gy - 4, 5, ph * (charge ? 2 : 1), shade(L.c, -0.2), true);
      } else {
        p.ellipse(cx, gy - 11, 11, 10, L.c); p.ellipse(cx, gy - 9 + (dir === 'down' ? 4 : -4), 6, 5, shade(L.c, 0.1));
        if (dir === 'down') { p.rect(cx - 3, gy - 6, 6, 4, '#c09080'); p.line(cx - 4, gy - 6, cx - 6, gy - 10, L.tusk); p.line(cx + 4, gy - 6, cx + 6, gy - 10, L.tusk); p.set(cx - 3, gy - 12, react ? '#e83a3a' : P.black); p.set(cx + 3, gy - 12, react ? '#e83a3a' : P.black); }
        legs4(p, cx, gy - 4, 4, ph, shade(L.c, -0.2), false);
      }
      break;
    }
    case 'MARINE_TURTLE': {
      const fl = Math.sin(ph) * 4;
      p.ellipse(cx - 13, cx - 6 + fl, 7, 3, L.c); p.ellipse(cx + 13, cx - 6 - fl, 7, 3, L.c); p.ellipse(cx - 10, cx + 10 - fl, 5, 2.5, L.c); p.ellipse(cx + 10, cx + 10 + fl, 5, 2.5, L.c);
      p.ellipse(cx, cx, 14, 16, L.shell); for (let i = 0; i < 5; i++) p.ellipse(cx + (i % 2 ? 5 : -5) * (i < 4 ? 1 : 0), cx - 8 + Math.floor(i / 2) * 7, 4, 3, shade(L.shell, 0.15));
      const hy = dir === 'up' ? cx - 18 : dir === 'down' ? cx + 18 : cx; const hx = side ? cx + (dir === 'right' ? 17 : -17) : cx; p.ellipse(hx, hy, 5, 4, L.c); p.set(hx - 2, hy - 1, P.black);
      break;
    }
    case 'MARINE_RAY': {
      const w = Math.sin(ph) * 5;
      p.poly([[cx, cx - 14], [cx + 22, cx - 2 + w], [cx, cx + 10], [cx - 22, cx - 2 + w]], L.c); p.ellipse(cx, cx - 2, 8, 9, shade(L.c, 0.1));
      p.line(cx, cx + 10, cx + Math.round(Math.sin(ph) * 3), cx + 26, shade(L.c, -0.3), 2); p.set(cx - 3, cx - 8, P.black); p.set(cx + 3, cx - 8, P.black);
      break;
    }
    case 'MARINE_REEF_SHARK': {
      const t = Math.sin(ph) * 3; const bite = anim === 'attack' && f % 2 === 0;
      if (side) { const s = dir === 'right' ? 1 : -1; p.poly([[cx - 24 * s, cx + t], [cx - 30 * s, cx - 8 + t], [cx - 30 * s, cx + 8 + t]], L.c); p.ellipse(cx, cx, 24, 8, L.c); p.ellipse(cx + 2 * s, cx + 3, 18, 4, L.belly); p.poly([[cx - 2 * s, cx - 7], [cx + 4 * s, cx - 18], [cx + 8 * s, cx - 7]], shade(L.c, -0.1)); p.set(cx + 18 * s, cx - 2, P.black); if (bite) p.rect(cx + 18 * s - 2, cx + 3, 5, 2, '#f5f3ea'); }
      else { p.ellipse(cx, cx, 8, 24, L.c); p.poly([[cx, cx - 4], [cx - 18, cx + 6], [cx - 6, cx + 2]], L.c); p.poly([[cx, cx - 4], [cx + 18, cx + 6], [cx + 6, cx + 2]], L.c); p.poly([[cx + t, cx + 22], [cx - 7 + t, cx + 30], [cx + 7 + t, cx + 30]], shade(L.c, -0.2)); }
      if (anim === 'warn') p.circle(cx, cx - 20, 2, '#e83a3a');
      break;
    }
    default: { // fish 32×32
      const s = L.s; const turn = anim === 'turn' ? (f + 1) / (n + 1) : 0;
      const t = Math.sin(ph) * 2;
      const len = (L.long ? 13 : 10) * s, ht = (L.round ? 7 : 4.2) * s;
      const vertical = !side;
      const dirSign = dir === 'left' || dir === 'up' ? -1 : 1;
      const draw = (x, y, rx, ry, c) => (vertical ? p.ellipse(16 + (y - 16), 16 + (x - 16), ry, rx, c) : p.ellipse(x, y, rx, ry, c));
      const polyv = (pts, c) => p.poly(pts.map(([x, y]) => (vertical ? [16 + (y - 16), 16 + (x - 16)] : [x, y])), c);
      const sq = turn ? Math.max(0.35, Math.abs(Math.cos(turn * Math.PI))) : 1;
      draw(16, 16, len * sq, ht, L.c);
      if (L.belly) draw(16, 16 + ht * 0.3, len * 0.8 * sq, ht * 0.4, L.belly);
      const tailX = 16 - dirSign * len * sq;
      polyv([[tailX, 16], [tailX - dirSign * 6, 16 - 5 + t], [tailX - dirSign * 6, 16 + 5 + t]], L.fin || shade(L.c, -0.2));
      polyv([[16 - 3, 16 - ht], [16 + 2, 16 - ht - 3], [16 + 4, 16 - ht]], L.fin || shade(L.c, -0.15));
      if (L.stripe) for (let k = -1; k <= 1; k++) draw(16 + k * 4 * sq, 16, 0.8, ht * 0.9, L.stripe);
      if (L.spots) { const r = prng(4); for (let k = 0; k < 5; k++) draw(16 + (r() - 0.5) * len, 16 + (r() - 0.5) * ht, 1, 1, L.spots); }
      const ex = 16 + dirSign * len * 0.6 * sq; draw(ex, 16 - 1, 1, 1, P.black);
      break;
    }
  }
  if (anim === 'react' && !fish) p.rect(cx - 1, 1, 2, 4, P.yellow);
  if (anim === 'warn') p.rect(cx - 1, 1, 2, 4, '#e83a3a');
  p.outline(P.outline); p.rimShade(0.15, -0.15);
  if (bob && !fish && !big) { const q = new Pix(S, S); q.blit(p, 0, -1); return q; }
  return p;
}

/** codex portrait 32×32 */
export function drawCodex(id) {
  const fish = id.startsWith('FISH_');
  const src = drawAnimal(id, fish ? 'swim' : id.startsWith('MARINE_') ? 'swim' : 'idle', 'right', 0, 4);
  const out = new Pix(32, 32);
  const f = 32 / src.w;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const c = src.get(Math.floor(x / f), Math.floor(y / f)); if (c[3]) out.set(x, y, c); }
  out.frame(0, 0, 32, 32, [255, 255, 255, 60]);
  return out;
}
