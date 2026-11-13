// Ortak karakter iskeleti: 16×24 kare, 4 yön × 16 kare (idle 2, yürüme 4, çalışma 3, taşıma 4, oturma 1, yeme 2).
// Görünüm parametreleri (ten/saç/kıyafet/şapka/önlük/sakal) aynı iskelet üzerinde çalışır; sağ yön solun aynasıdır.
import { Px, P, hash } from './px.js';

export const FW = 16, FH = 24, FRAMES = 16, DIRS = ['down', 'up', 'left', 'right'];
export const ANIM = { idle: [0, 1], walk: [2, 3, 4, 5], work: [6, 7, 8], carry: [9, 10, 11, 12], sit: [13], eat: [14, 15] };
const O = P.ink;

function frame(look, dir, f) {
  const p = new Px(FW, FH); const skin = P.skin[look.skin % 4], skinD = P.skinD[look.skin % 4];
  const hair = look.old ? P.hair[5] : P.hair[look.hair % 6]; const [shirt, shirtD] = P.outfit[look.outfit % 8]; const pants = P.pants[(look.outfit + look.skin) % 4];
  const walkI = f >= 2 && f <= 5 ? f - 2 : f >= 9 && f <= 12 ? f - 9 : -1; const work = f >= 6 && f <= 8 ? f - 6 : -1; const carry = f >= 9 && f <= 12; const sit = f >= 13; const eat = f >= 14 ? f - 14 : -1;
  const bob = (walkI === 1 || walkI === 3 || (f === 1) || work === 2) ? 1 : 0; const side = dir === 'left'; const by = (sit ? 2 : 0) + bob;
  // bacaklar
  if (!sit) {
    const l = walkI === 1 ? -1 : 0, r = walkI === 3 ? -1 : 0;
    if (side) { const a = walkI === 1 ? -2 : walkI === 3 ? 2 : 0; p.rect(6 + a, 18, 3, 4 + (a ? -1 : 0), pants); p.rect(7 - a, 18, 3, 4, pants); p.rect(5 + a, 21 + (a ? -1 : 0), 4, 2, O); p.rect(6 - a, 22, 4, 1, O); }
    else { p.rect(5, 18, 3, 4 + l, pants); p.rect(9, 18, 3, 4 + r, pants); p.rect(5, 22 + l, 3, 1, O); p.rect(9, 22 + r, 3, 1, O); }
  } else if (dir === 'down') { p.rect(5, 19, 3, 3, pants); p.rect(9, 19, 3, 3, pants); p.rect(5, 22, 3, 1, O); p.rect(9, 22, 3, 1, O); }
  else if (side) { p.rect(4, 18, 6, 3, pants); p.rect(3, 20, 2, 3, pants); p.rect(2, 22, 3, 1, O); }
  // gövde
  const bx = side ? 5 : 4, bw = side ? 6 : 9;
  p.box(bx, 11 + by, bw, 8 - (sit ? 1 : 0), shirt, null, shirtD); if (look.apron && dir !== 'up') { p.rect(bx + 1, 13 + by, bw - 2, 6 - (sit ? 1 : 0), P.white); p.hline(bx + 1, 13 + by, bw - 2, P.grayL); }
  // kollar
  const arm = (x, y, h, c = shirt) => { p.rect(x, y, 2, h, c); p.rect(x, y + h, 2, 1, skin); };
  if (side) { const ay = 12 + by; if (work >= 0) { const o = [[-3, -3], [-4, 0], [-3, 3]][work]; p.rect(6 + o[0] + 3, ay + o[1] + 1, 4, 2, shirt); p.rect(5 + o[0] + 1, ay + o[1] + 1, 2, 2, skin); } else if (carry) { p.rect(3, ay, 5, 2, shirt); p.rect(2, ay, 2, 2, skin); } else if (eat >= 0) { p.rect(4, ay + (eat ? -2 : 1), 4, 2, shirt); p.rect(3, ay + (eat ? -3 : 1), 2, 2, skin); } else { const sw = walkI === 1 ? 1 : walkI === 3 ? -1 : 0; arm(7 + sw, ay, 4); } }
  else { const ay = 11 + by; if (work >= 0) { const dy = [-4, -1, 2][work]; if (dir === 'down') { arm(3, ay + dy + 2, 3); arm(12, ay + dy + 2, 3); } else { arm(3, ay + dy + 1, 3); arm(12, ay + dy + 1, 3); } } else if (carry) { arm(2, ay - 1, 3); arm(13, ay - 1, 3); p.rect(2, ay - 2, 2, 1, skin); p.rect(13, ay - 2, 2, 1, skin); } else if (eat >= 0) { arm(2, ay + 1, 4); p.rect(11, ay + (eat ? -1 : 2), 2, 3, shirt); p.rect(10, ay + (eat ? -2 : 4), 2, 2, skin); } else { const sw = walkI === 1 ? 1 : walkI === 3 ? -1 : 0; arm(2, ay + 1 + sw, 5); arm(13, ay + 1 - sw, 5); } }
  // baş
  const hy = 1 + by, hx = side ? 4 : 3;
  p.box(hx, hy + 1, 10, 9, skin, null, skinD); p.set(hx, hy + 1, 0); p.clear(hx, hy + 1); p.clear(hx + 9, hy + 1); p.clear(hx, hy + 9); p.clear(hx + 9, hy + 9);
  const st = look.style % 5;
  if (dir === 'up') { p.rect(hx, hy, 10, st === 3 ? 4 : 8, hair); p.rect(hx + 1, hy - 1, 8, 1, hair); if (st === 1) p.rect(hx, hy + 6, 10, 5, hair); if (st === 2) p.blob(hx + 4.5, hy - 1, 2, 2, hair, null, null); }
  else {
    p.rect(hx, hy, 10, st === 3 ? 2 : 3, hair); p.rect(hx + 1, hy - 1, 8, 1, hair);
    if (side) { p.rect(hx + 5, hy + 2, 5, st === 3 ? 3 : 5, hair); if (st === 1) p.rect(hx + 7, hy + 6, 3, 5, hair); p.set(hx + 2, hy + 5, O); p.set(hx + 2, hy + 6, O); if (st === 4) { p.set(hx + 2, hy - 2, hair); p.set(hx + 5, hy - 2, hair); } }
    else { p.vline(hx, hy + 2, st === 1 ? 8 : 3, hair); p.vline(hx + 9, hy + 2, st === 1 ? 8 : 3, hair); if (st === 0) p.rect(hx + 1, hy + 3, 3, 1, hair); if (st === 4) { p.set(hx + 2, hy - 2, hair); p.set(hx + 5, hy - 2, hair); p.set(hx + 7, hy - 2, hair); } const ec = ['#2a1d1a', '#2f5f8f', '#3f7a3a', '#6b4226'][(look.eyes || 0) % 4]; p.rect(hx + 2, hy + 5, 2, 2, P.white); p.rect(hx + 6, hy + 5, 2, 2, P.white); p.set(hx + 3, hy + 6, ec); p.set(hx + 6, hy + 6, ec); p.set(hx + 3, hy + 5, ec); p.set(hx + 6, hy + 5, ec); if (eat === 1) p.rect(hx + 4, hy + 8, 2, 1, O); else p.hline(hx + 4, hy + 8, 2, skinD); }
    if (st === 2) p.blob(hx + 4.5, hy - 1, 2, 2, hair, null, null);
    if (look.beard) { if (side) p.rect(hx + 1, hy + 7, 5, 3, hair); else p.rect(hx + 2, hy + 8, 6, 2, hair); }
  }
  // şapka
  const hat = look.hat;
  if (hat === 'cap') { p.rect(hx, hy - 1, 10, 3, P.navy); p.hline(hx, hy + 1, 10, P.gold); if (dir === 'down') p.rect(hx + 1, hy + 2, 8, 1, '#1f2a47'); if (side) p.rect(hx - 2, hy + 2, 4, 1, '#1f2a47'); }
  else if (hat === 'straw') { p.rect(hx + 1, hy - 2, 8, 3, '#e3c877'); p.rect(hx - 2, hy + 1, 14, 2, '#d1b45e'); p.hline(hx + 1, hy, 8, P.red); }
  else if (hat === 'beret') { p.blob(hx + 4, hy, 5, 2, P.redD, P.red, null); p.set(hx + 5, hy - 2, P.redD); }
  else if (hat === 'bowler') { p.rect(hx + 1, hy - 3, 8, 4, P.black); p.rect(hx - 1, hy + 1, 12, 1, P.black); p.hline(hx + 1, hy, 8, P.grayD); }
  p.outline(O); return p;
}
// Tam atlas: 16 sütun × 4 satır (yön). 2× büyütülmüş Px döner.
export function charSheet(look) {
  const sheet = new Px(FW * FRAMES, FH * 4);
  for (let d = 0; d < 4; d++) for (let f = 0; f < FRAMES; f++) { const fr = d === 3 ? frame(look, 'left', f).flipped() : frame(look, DIRS[d], f); sheet.blit(fr, f * FW, d * FH); }
  return sheet.scaled(2);
}
export function lookKey(look) { return 'ch_' + hash(JSON.stringify([look.skin, look.hair, look.style, look.outfit, look.eyes || 0, look.hat || '', !!look.apron, !!look.beard, !!look.old])).toString(36); }
export const frameIndex = (dir, f) => DIRS.indexOf(dir) * FRAMES + f;
