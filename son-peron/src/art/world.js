// Dünya nesneleri: ağaç/kaya, gar ve kasaba eşyaları, binalar, tren, ekinler, efektler ve küçük tabela fontu.
import { Px, P, rng } from './px.js';

const O = P.ink;
const fin = (p) => p.outline(O);
// 3×5 tabela fontu (yalnız tabelalarda; arayüz metinleri DOM yazı tipidir)
const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', E: '111100110100111', G: '011100101101011', I: '111010010010111', K: '101101110101101', L: '100100100100111', N: '101111111111101', O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010', V: '101101101101010', Y: '101101010010010', U: '101101101101111', 1: '010110010010111', 7: '111001010010010', 5: '111100110001110', ' ': '000000000000000' };
const BASE = { 'Ç': 'C', 'Ö': 'O', 'Ü': 'U', 'Ş': 'S', 'İ': 'I' };
export function text(p, str, x, y, c) {
  for (const ch of str) { const b = BASE[ch] || ch; const g = F[b] || F[' ']; for (let i = 0; i < 15; i++) if (g[i] === '1') p.set(x + (i % 3), y + ((i / 3) | 0), c); if (ch === 'Ç' || ch === 'Ş') p.set(x + 1, y + 5, c); if (ch === 'Ö' || ch === 'İ') p.set(x + 1, y - 1, c); x += 4; }
  return x;
}
const LEAF = { spring: ['#6fb04f', '#93cf6a', '#4c8a3c'], summer: ['#4f9440', '#6fb04f', '#356e30'], autumn: ['#d9862e', '#efb04a', '#a85a22'], winter: ['#dfe7ee', '#ffffff', '#b4c3d1'] };
const PINE = { spring: ['#3f7a4a', '#5a9a5e', '#2c5a38'], summer: ['#357045', '#4f8f58', '#255033'], autumn: ['#3c6b44', '#56895a', '#274c30'], winter: ['#5b8a6e', '#f4f8fb', '#3a6650'] };

function tree(season) { const p = new Px(32, 48); const c = LEAF[season]; p.box(14, 30, 5, 16, P.woodD, P.wood, P.woodDD); p.rect(12, 44, 9, 2, P.woodDD); if (season === 'winter') { p.line(16, 30, 9, 18, P.woodD); p.line(16, 30, 23, 16, P.woodD); p.line(16, 26, 16, 10, P.woodD); p.line(12, 22, 7, 20, P.woodD); p.line(20, 22, 25, 21, P.woodD); p.blob(9, 16, 4, 2, c[0], c[1], c[2]); p.blob(22, 14, 5, 2, c[0], c[1], c[2]); p.blob(16, 8, 4, 2, c[0], c[1], c[2]); } else { p.blob(16, 18, 13, 12, c[0], c[1], c[2]); p.blob(9, 22, 7, 6, c[0], c[1], c[2]); p.blob(23, 23, 7, 6, c[2], c[0], c[2]); p.blob(15, 10, 8, 6, c[1], c[1], c[0]); p.speckle(4, 6, 24, 24, [c[2]], 0.05, 3); if (season === 'autumn') p.speckle(4, 6, 24, 26, [P.red, P.yellow], 0.04, 5); } return fin(p); }
function pine(season) { const p = new Px(32, 48); const c = PINE[season]; p.box(14, 38, 4, 8, P.woodD, P.wood, P.woodDD); for (let i = 0; i < 4; i++) { const y = 8 + i * 8, w = 5 + i * 3; for (let r = 0; r < 11; r++) { const hw = Math.round((w * (r + 2)) / 12); p.hline(16 - hw, y + r, hw * 2, r < 2 && season === 'winter' ? c[1] : r > 8 ? c[2] : c[0]); p.set(16 - hw, y + r, season === 'winter' ? c[1] : c[1]); } } p.rect(15, 5, 2, 4, c[0]); return fin(p); }
function stump() { const p = new Px(32, 48); p.box(12, 38, 8, 7, P.woodD, P.wood, P.woodDD); p.ellipse(15.5, 38, 4, 2, P.woodL); p.ellipse(15.5, 38, 2, 1, P.wood); p.rect(10, 44, 12, 2, P.woodDD); return fin(p); }
function rock(dead) { const p = new Px(16, 16); if (dead) { p.blob(5, 12, 2, 1, P.stone, P.stoneL, P.stoneD); p.blob(11, 13, 2, 1, P.stoneD, P.stone, null); return fin(p); } p.blob(8, 9, 6, 5, P.stone, P.stoneL, P.stoneD); p.blob(5, 7, 3, 3, P.stoneL, '#d6d0c3', P.stone); p.line(9, 6, 11, 11, P.stoneD); p.set(6, 11, P.stoneD); return fin(p); }
function mushroomNode() { const p = new Px(16, 16); for (const [x, y, s] of [[5, 10, 3], [11, 11, 2]]) { p.rect(x - 1, y, 2, 4, P.cream); p.blob(x, y - 1, s, 2, '#b8693f', '#d48a5a', '#8a4826'); p.set(x - 1, y - 2, P.cream); } return fin(p); }
function bush(season, berries) { const p = new Px(16, 16); const c = LEAF[season]; p.blob(8, 9, 7, 5, c[0], c[1], c[2]); p.blob(5, 7, 3, 3, c[1], c[1], c[0]); if (berries) for (const [x, y] of [[4, 9], [8, 7], [11, 10], [7, 11], [12, 7]]) { p.set(x, y, P.purple); p.set(x + 1, y, '#b48ad0'); } return fin(p); }
function crop(seedId, stage) { // 0 fide, 1 orta, 2 büyük, 3 olgun
  const p = new Px(32, 32); const colors = { potato_seed: '#c79a5e', carrot_seed: P.orange, onion_seed: '#e2c08a', tomato_seed: P.red, pepper_seed: P.greenL }[seedId];
  for (const [cx, cy] of [[8, 10], [22, 10], [8, 24], [22, 24]]) { const hgt = 2 + stage * 3; p.vline(cx, cy - hgt, hgt, P.greenD); p.blob(cx, cy - hgt, 1 + stage, 1 + (stage >> 1), P.green, P.greenL, P.greenD); if (stage >= 2) { p.set(cx - 2, cy - 2, P.greenL); p.set(cx + 2, cy - 3, P.greenL); } if (stage === 3) { p.blob(cx - 2, cy - 3, 1, 1, colors, null, null); p.blob(cx + 2, cy - 5, 1, 1, colors, null, null); p.set(cx, cy - hgt - 1, colors); } }
  return fin(p);
}
// ---- Binalar (üstten/önden): çatı + cephe
function building(wt, ht, o) {
  const W = wt * 16, H = ht * 16, p = new Px(W, H); const face = Math.min(H - 16, o.face || 44), roofH = H - face;
  p.rect(0, 0, W, roofH, o.roof); for (let y = 0; y < roofH; y += 4) { p.hline(0, y, W, o.roofL); p.hline(0, y + 3, W, o.roofD); for (let x = ((y / 4) % 2) * 4; x < W; x += 8) p.vline(x, y, 4, o.roofD); }
  p.rect(0, Math.floor(roofH * 0.42), W, 2, o.roofD); p.rect(0, roofH - 3, W, 3, o.roofD); p.hline(0, roofH - 3, W, o.roofL);
  if (o.chimney) { const cx = W - 40; p.box(cx, 6, 12, 18, P.brick, P.brickL, P.brickD); p.rect(cx - 1, 5, 14, 3, P.brickD); }
  p.rect(0, roofH, W, face, o.wall); p.speckle(0, roofH, W, face, [o.wallD], o.worn ? 0.1 : 0.03, wt * 13 + ht);
  if (o.brickBase) { p.rect(0, H - 9, W, 9, P.brick); for (let y = H - 9; y < H; y += 3) { p.hline(0, y, W, P.brickD); for (let x = ((y / 3) % 2) * 4; x < W; x += 8) p.vline(x, y, 3, P.brickD); } } else p.rect(0, H - 4, W, 4, o.wallD);
  if (o.beams) for (let x = 0; x < W; x += o.beams) { p.rect(x, roofH, 3, face, P.woodD); p.vline(x, roofH, face, P.wood); }
  for (const wx of o.windows || []) { const wy = roofH + 8, wh = Math.min(18, face - 18); p.box(wx, wy, 18, wh, o.dark ? '#2a3440' : P.blueL, null, null); p.frame(wx - 1, wy - 1, 20, wh + 2, P.woodDD); p.vline(wx + 9, wy, wh, P.woodDD); p.hline(wx, wy + (wh >> 1), 18, P.woodDD); if (!o.dark) { p.line(wx + 2, wy + 6, wx + 6, wy + 2, P.white); p.rect(wx - 2, wy + wh + 1, 22, 2, P.woodD); if (o.flowers) for (let x = wx; x < wx + 18; x += 3) { p.set(x, wy + wh, P.green); p.set(x + 1, wy + wh - 1, [P.pink, P.yellow, P.red][x % 3]); } } else p.line(wx + 3, wy + 3, wx + 12, wy + 12, '#4a5a68'); }
  for (const dx of o.doors || []) { const dy = H - 30; p.box(dx, dy, 16, 30, o.doorC || P.woodD, P.wood, P.woodDD); p.frame(dx + 2, dy + 3, 12, 11, P.woodDD); p.frame(dx + 2, dy + 16, 12, 11, P.woodDD); p.set(dx + 12, dy + 16, P.gold); p.rect(dx - 2, dy - 3, 20, 3, P.woodDD); }
  if (o.sign) { const sw = o.sign.length * 4 + 7, sx = o.signX ?? ((W - sw) >> 1), sy = roofH + 1 - (o.signUp || 0); p.box(sx, sy, sw, 9, o.signBg || P.cream, null, null); p.frame(sx, sy, sw, 9, P.woodDD); text(p, o.sign, sx + 4, sy + 2, o.signC || P.woodDD); }
  if (o.awning) for (const ax of o.awning) { for (let i = 0; i < 26; i++) p.vline(ax + i, roofH + 3, 6 + (i % 4 === 3 ? 0 : 1), ((i / 4) | 0) % 2 ? P.white : o.awningC || P.red); }
  if (o.clock) { p.blob(o.clock, roofH - 12, 7, 7, P.cream, P.white, P.paperD); p.frame(o.clock - 8, roofH - 20, 17, 17, P.woodDD); p.vline(o.clock, roofH - 17, 5, O); p.hline(o.clock, roofH - 12, 4, O); }
  if (o.extra) o.extra(p, W, H, roofH);
  p.frame(0, 0, W, H, O); return p;
}
const RUST = { roof: '#8a4a3a', roofL: '#a8604c', roofD: '#63332a', wall: '#cdbb98', wallD: '#a8977a' };
export function buildings() {
  const win23 = [20, 52, 110, 250, 300, 330];
  return {
    'b/restaurant/old': building(23, 21, { ...RUST, roof: '#7a5548', roofL: '#8f6a5c', roofD: '#573a31', wall: '#b5a58a', wallD: '#8f8068', worn: true, face: 52, chimney: true, windows: win23, dark: true, doors: [160], doorC: P.oldD, sign: 'LOKANTA', signBg: '#a8977a', signC: '#5c4c40', signX: 148, signUp: 0, extra: (p, W, H, rh) => { p.line(60, 20, 90, 60, '#573a31'); p.line(200, 40, 230, 30, '#573a31'); p.speckle(0, 0, W, rh, ['#4f6a45'], 0.012, 4); p.line(24, rh + 12, 34, rh + 22, O); } }),
    'b/restaurant/new': building(23, 21, { roof: '#a8463a', roofL: '#c96152', roofD: '#7c2f28', wall: '#f0e0bc', wallD: '#d2bf96', face: 52, chimney: true, windows: win23, flowers: true, doors: [160], doorC: '#7a2f3a', sign: 'LOKANTA', signBg: P.cream, signC: P.maroon, signX: 148, beams: 46, brickBase: true, awning: [14, 48, 106, 246, 296, 326] }),
    'b/station/old': building(29, 5, { roof: '#4a5568', roofL: '#63708a', roofD: '#333c4d', wall: '#d9cdb0', wallD: '#b5a888', face: 54, windows: [30, 70, 110, 300, 340, 380, 420], doors: [224], doorC: P.navy, sign: 'PERONOVA GAR', signBg: '#8f8068', signC: '#5c4c40', signX: 196, brickBase: true, clock: 180 }),
    'b/station/new': building(29, 5, { roof: '#4a5568', roofL: '#63708a', roofD: '#333c4d', wall: '#efe4c6', wallD: '#cfc2a0', face: 54, windows: [30, 70, 110, 300, 340, 380, 420], flowers: true, doors: [224], doorC: P.navy, sign: 'PERONOVA GAR', signBg: P.navy, signC: P.cream, signX: 196, brickBase: true, clock: 180 }),
    'b/shop_grocer': building(9, 6, { roof: '#5a8a5a', roofL: '#78a878', roofD: '#3d653f', wall: '#f0e0bc', wallD: '#d2bf96', windows: [12, 108], doors: [64], sign: 'BAKKAL', awning: [8, 104], awningC: P.green, brickBase: true }),
    'b/shop_carpenter': building(9, 6, { roof: '#8a6a45', roofL: '#a8845a', roofD: '#63492e', wall: '#d9a066', wallD: '#b0733f', windows: [12, 108], doors: [64], sign: 'ATÖLYE', beams: 24 }),
    'b/shop_greenhouse': building(9, 6, { roof: '#8fc3e0', roofL: '#c2e2f0', roofD: '#5f9ab8', wall: '#e3f0e0', wallD: '#b5d0b0', windows: [12, 36, 108], flowers: true, doors: [64], sign: 'SERA', doorC: P.greenD }),
    'b/house_a': building(7, 5, { ...RUST, windows: [10, 80], flowers: true, doors: [46], chimney: false }),
    'b/house_b': building(7, 5, { roof: '#4f6f8f', roofL: '#6f8fae', roofD: '#36506b', wall: '#efe4c6', wallD: '#cfc2a0', windows: [10, 80], doors: [46], brickBase: true }),
    'b/house_c': building(7, 5, { roof: '#7a5a8a', roofL: '#9878a8', roofD: '#573f65', wall: '#e8d2a6', wallD: '#c9ad7c', windows: [10, 80], flowers: true, doors: [46], beams: 22 })
  };
}
// ---- Tren: lokomotif + vagon (yandan), tekerlek 2 kare, kapı açık/kapalı
function wheels(p, xs, y, f, r = 5) { for (const x of xs) { p.blob(x, y, r, r, '#3a3a40', '#55555b', '#1b1b1e'); p.blob(x, y, r - 2, r - 2, P.metalD, P.metal, P.iron); if (f) { p.line(x - r + 2, y, x + r - 2, y, O); } else p.line(x, y - r + 2, x, y + r - 2, O); p.set(x, y, P.metalL); } }
function loco(f) { const p = new Px(104, 52); // burun solda (batıya gider)
  p.box(10, 20, 62, 20, '#2f5a45', '#4a7a60', '#1f3f30'); p.rect(10, 20, 62, 3, '#4a7a60'); p.rect(10, 36, 90, 4, P.maroon); p.hline(10, 36, 90, '#a34858');
  p.box(70, 8, 30, 32, '#2f5a45', '#4a7a60', '#1f3f30'); p.box(76, 13, 18, 12, P.blueL, P.white, P.blue); p.rect(68, 5, 34, 4, '#1f3f30'); p.hline(68, 5, 34, '#4a7a60');
  p.box(18, 6, 9, 15, P.iron, P.metalD, P.black); p.rect(16, 4, 13, 3, P.black); p.box(40, 13, 10, 8, P.gold, P.yellow, P.goldD); p.box(56, 15, 6, 6, P.iron, P.metalD, P.black);
  p.blob(10, 30, 4, 10, '#1f3f30', '#2f5a45', P.black); p.blob(8, 26, 3, 3, P.yellow, P.white, P.goldD); for (let x = 22; x < 68; x += 12) p.vline(x, 23, 12, '#1f3f30'); p.rect(30, 27, 30, 2, P.gold);
  p.rect(2, 40, 10, 3, P.iron); for (let i = 0; i < 5; i++) p.line(2 + i * 2, 43, 0 + i * 2, 48, P.iron);
  wheels(p, [24, 40, 56], 44, f, 6); wheels(p, [80, 93], 45, f, 5); p.rect(22, 43 + (f ? 1 : -1), 36, 2, P.metalL); return fin(p); }
function wagon(f, open) { const p = new Px(104, 52);
  p.box(3, 10, 98, 30, P.maroon, '#a34858', '#55202a'); p.rect(3, 22, 98, 4, P.cream); p.hline(3, 26, 98, P.paperD); p.rect(1, 6, 102, 5, '#3d2a2a'); p.hline(1, 6, 102, '#6b4a48'); p.rect(3, 38, 98, 3, '#3d2a2a');
  for (const x of [10, 26, 62, 78]) { p.box(x, 13, 12, 9, P.blueL, P.white, P.blue); p.frame(x - 1, 12, 14, 11, '#55202a'); p.vline(x + 6, 13, 9, '#55202a'); }
  p.box(44, 12, 14, 27, open ? '#2a1d1a' : '#8e3a48', open ? null : '#b85a68', open ? null : '#55202a'); p.frame(43, 11, 16, 29, P.gold); if (!open) { p.box(47, 15, 8, 8, P.blueL, P.white, P.blue); p.set(55, 28, P.gold); } else { p.rect(44, 36, 14, 3, P.metalD); p.rect(45, 13, 3, 23, '#4a332b'); }
  p.rect(0, 30, 3, 4, P.iron); p.rect(101, 30, 3, 4, P.iron); wheels(p, [16, 30, 74, 88], 45, f, 5); return fin(p); }
// ---- Gar/kasaba eşyaları
function simple() {
  const o = {};
  let p = new Px(16, 32); p.rect(7, 14, 2, 16, P.woodD); p.box(2, 3, 12, 11, P.red, '#e5675a', P.redD); p.rect(2, 3, 12, 3, P.redD); p.rect(4, 8, 8, 2, O); p.rect(13, 5, 2, 6, P.yellow); p.rect(4, 30, 8, 2, P.woodDD); o['o/mailbox'] = fin(p);
  p = new Px(16, 22); p.box(1, 6, 14, 15, P.wood, P.woodL, P.woodD); p.frame(1, 6, 14, 15, P.woodDD); p.line(2, 7, 13, 19, P.woodD); p.line(13, 7, 2, 19, P.woodD); p.rect(1, 3, 14, 4, P.woodL); p.hline(1, 6, 14, P.woodDD); o['o/crate/empty'] = fin(p);
  p = new Px(16, 22); p.blit(o['o/crate/empty'], 0, 0); p.box(3, 0, 6, 6, P.paper, P.cream, P.paperD); p.box(8, 1, 6, 5, '#c9a56e', '#dcc08f', '#a08052'); p.set(5, 2, P.red); p.hline(9, 3, 4, O); o['o/crate/full'] = fin(p);
  const board = (bg, broken, deco) => { const q = new Px(16, 26); q.rect(2, 12, 2, 14, P.woodDD); q.rect(12, 12, 2, 14, P.woodDD); q.box(0, 1, 16, 13, broken ? P.old : P.wood, broken ? P.oldL : P.woodL, broken ? P.oldD : P.woodD); q.rect(2, 3, 12, 9, bg); deco(q); if (broken) { q.line(1, 2, 9, 12, O); q.line(10, 1, 14, 9, O); } return fin(q); };
  o['o/noticeboard/broken'] = board('#6b5a48', true, (q) => { q.rect(3, 5, 4, 3, '#a8927c'); });
  o['o/noticeboard/fixed'] = board('#3f7a4a', false, (q) => { q.rect(3, 4, 4, 4, P.cream); q.rect(9, 4, 4, 3, P.paper); q.rect(8, 8, 5, 3, P.white); q.set(5, 4, P.red); q.set(11, 4, P.blue); });
  o['o/celebration_board'] = board(P.navy, false, (q) => { q.set(4, 5, P.yellow); q.set(8, 4, P.red); q.set(11, 6, P.yellow); q.set(6, 8, P.pink); q.set(10, 9, P.white); q.hline(4, 10, 8, P.gold); });
  o['o/timetable'] = board('#1f2a47', false, (q) => { for (let y = 4; y < 11; y += 3) { q.hline(3, y, 3, P.yellow); q.hline(8, y, 5, P.cream); } });
  o['o/town_board'] = board(P.paper, false, (q) => { q.hline(4, 5, 8, O); q.hline(4, 7, 6, O); q.hline(4, 9, 7, O); });
  p = new Px(32, 30); p.rect(4, 12, 3, 18, P.iron); p.rect(25, 12, 3, 18, P.iron); p.box(0, 1, 32, 13, P.navy, '#4a5f8f', '#1f2a47'); p.frame(1, 2, 30, 11, P.cream); text(p, 'PERON 1', 3, 5, P.cream); o['o/station_sign'] = fin(p);
  p = new Px(32, 22); p.box(1, 4, 30, 5, P.wood, P.woodL, P.woodD); p.box(1, 10, 30, 6, P.woodL, '#f0c58e', P.wood); p.rect(1, 16, 30, 2, P.woodD); for (const x of [3, 26]) p.rect(x, 4, 3, 18, P.iron); o['o/bench'] = fin(p);
  p = new Px(16, 48); p.rect(7, 12, 2, 34, P.iron); p.rect(4, 45, 8, 3, P.black); p.box(3, 3, 10, 9, P.yellow, '#fbeeb0', '#d9b84a'); p.rect(2, 1, 12, 2, P.iron); p.rect(2, 12, 12, 1, P.iron); p.rect(6, 20, 4, 1, P.metalD); o['o/lamppost'] = fin(p);
  p = new Px(16, 22); for (const x of [1, 7, 13]) { p.box(x, 4, 3, 16, P.woodL, '#f0c58e', P.wood); p.set(x + 1, 3, P.woodL); } p.rect(0, 9, 16, 2, P.wood); p.rect(0, 15, 16, 2, P.wood); o['o/fence'] = fin(p);
  p = new Px(32, 44); p.rect(3, 4, 3, 30, P.woodD); p.rect(26, 4, 3, 30, P.woodD); for (let y = 0; y < 6; y++) p.hline(16 - 16 + y * 0 + (5 - y) * 0, y, 32, y < 2 ? '#a8604c' : '#8a4a3a'); p.rect(14, 6, 4, 12, P.woodDD); p.box(12, 16, 8, 6, P.wood, P.woodL, P.woodD); p.blob(16, 30, 13, 6, P.stone, P.stoneL, P.stoneD); p.box(3, 30, 26, 12, P.stone, P.stoneL, P.stoneD); for (let x = 5; x < 28; x += 6) p.vline(x, 32, 9, P.stoneD); p.ellipse(15.5, 30, 10, 3, P.blueD); p.hline(10, 29, 6, P.blueL); o['o/well'] = fin(p);
  p = new Px(48, 52); p.blob(24, 38, 22, 11, P.stone, P.stoneL, P.stoneD); p.ellipse(24, 36, 18, 8, P.blue); p.ellipse(22, 35, 12, 4, P.blueL); p.box(20, 16, 8, 22, P.stoneL, '#d6d0c3', P.stone); p.blob(24, 15, 9, 4, P.stone, P.stoneL, P.stoneD); p.ellipse(24, 13, 6, 2, P.blueL); p.vline(17, 16, 14, P.blueL); p.vline(31, 16, 14, P.blueL); p.vline(24, 4, 8, P.white); p.set(23, 5, P.blueL); p.set(25, 6, P.blueL); o['o/fountain'] = fin(p);
  p = new Px(32, 36); for (let i = 0; i < 32; i++) p.vline(i, 2, 9 + (i % 8 === 7 ? 0 : 1), ((i / 8) | 0) % 2 ? P.white : P.red); p.rect(1, 12, 2, 22, P.woodD); p.rect(29, 12, 2, 22, P.woodD); p.box(0, 22, 32, 12, P.wood, P.woodL, P.woodD); for (const [x, c] of [[5, P.orange], [11, P.red], [17, P.yellow], [23, P.green]]) p.blob(x, 20, 2, 2, c, null, null); for (let x = 2; x < 30; x += 5) p.set(x, 0, [P.yellow, P.blue, P.green][x % 3]); o['o/festival_stall'] = fin(p);
  p = new Px(32, 30); p.box(0, 14, 32, 14, P.wood, P.woodL, P.woodD); p.rect(0, 12, 32, 3, P.woodL); for (const x of [6, 14, 22]) { p.line(x, 12, x + 4, 0, P.woodD); p.line(x + 4, 0, x + 6, 8, P.grayL); } p.box(22, 16, 8, 6, P.paper, P.cream, P.paperD); text(p, '75', 23, 17, O); o['o/rod_stand'] = fin(p);
  p = new Px(16, 16); p.ellipse(8, 9, 5, 2, P.blueL); p.ellipse(8, 9, 3, 1, P.white); p.rect(7, 4, 2, 4, P.red); p.rect(7, 4, 2, 2, P.white); o['o/fishing_spot'] = p;
  const sign = (bg, t, c) => { const q = new Px(26, 12); q.box(0, 2, 26, 10, bg, null, null); q.frame(0, 2, 26, 10, P.woodDD); q.set(4, 0, P.iron); q.set(21, 0, P.iron); q.set(4, 1, P.iron); q.set(21, 1, P.iron); text(q, t, ((26 - t.length * 4) >> 1) + 1, 5, c); return q; };
  o['o/sign/open'] = sign('#4f9440', 'AÇIK', P.white); o['o/sign/closed'] = sign(P.redD, 'KAPALI', P.cream); o['o/sign/none'] = (() => { const q = new Px(26, 12); q.box(2, 3, 20, 8, P.old, P.oldL, P.oldD); q.line(4, 4, 18, 9, O); return q; })();
  return o;
}
// ---- Efektler ve işaretler
function fx() {
  const o = {}; let p;
  const dot = (name, r, m, l, d) => { const q = new Px(r * 2 + 3, r * 2 + 3); q.blob(r + 1, r + 1, r, r, m, l, d); o[name] = q; };
  dot('fx/smoke', 4, '#d6d6d2', '#f0f0ec', '#aaaaa6'); dot('fx/steam', 3, '#f4f4f0', P.white, '#d9d9d5'); dot('fx/spark', 1, P.yellow, P.white, P.orange); dot('fx/dust', 2, '#c9a877', '#dcc08f', '#a08a70');
  p = new Px(4, 3); p.rect(0, 0, 4, 2, P.woodL); p.set(3, 2, P.wood); o['fx/chip'] = p; p = new Px(3, 3); p.rect(0, 0, 3, 2, P.stoneL); p.set(1, 2, P.stoneD); o['fx/shard'] = p;
  p = new Px(4, 4); p.set(1, 0, P.green); p.rect(0, 1, 3, 2, P.greenL); p.set(3, 3, P.greenD); o['fx/leaf'] = p;
  p = new Px(2, 6); p.vline(0, 0, 6, '#a9d4ec'); p.vline(1, 2, 4, '#d5ecf7'); o['fx/rain'] = p; p = new Px(3, 3); p.set(1, 0, P.white); p.hline(0, 1, 3, P.white); p.set(1, 2, '#dfe7ee'); o['fx/snow'] = p;
  p = new Px(8, 8); p.blob(3.5, 3.5, 3, 3, P.gold, P.yellow, P.goldD); p.vline(4, 2, 4, P.goldD); o['fx/coin'] = fin(p);
  p = new Px(4, 4); p.rect(0, 0, 4, 4, P.blueL); o['fx/drop'] = p; p = new Px(3, 3); p.set(1, 0, P.red); p.hline(0, 1, 3, P.orange); p.set(1, 2, P.yellow); o['fx/flame'] = p;
  p = new Px(48, 48); for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const d = Math.hypot(x - 23.5, y - 23.5) / 24; if (d < 1) p.set(x, y, '#ffe2a0', Math.round(190 * (1 - d) * (1 - d))); } o['fx/glow'] = p;
  p = new Px(12, 13); p.box(0, 0, 12, 11, P.cream, P.white, P.paperD); p.rect(0, 11, 12, 2, P.paperD); p.frame(0, 0, 12, 13, O); p.rect(4, 3, 4, 1, O); p.rect(4, 3, 1, 5, O); p.rect(4, 5, 3, 1, O); p.rect(4, 7, 4, 1, O); o['fx/ekey'] = p;
  p = new Px(11, 12); for (let y = 0; y < 6; y++) p.hline(y, 6 + y, 11 - y * 2, P.yellow); p.rect(3, 0, 5, 6, P.yellow); o['fx/arrow'] = fin(p);
  p = new Px(16, 16); p.blob(7, 8, 5, 3, '#6b5a3a', null, '#4a3d28'); p.blob(11, 6, 2, 2, '#6b5a3a', null, null); p.set(4, 12, '#6b5a3a'); p.set(12, 11, '#4a3d28'); for (let i = 0; i < p.d.length; i += 4) if (p.d[i + 3]) p.d[i + 3] = 170; o['fx/stain'] = p;
  p = new Px(16, 12); p.ellipse(5, 7, 4, 2, P.white); p.ellipse(5, 6, 4, 2, P.cream); p.ellipse(5, 6, 2, 1, '#c9a56e'); p.ellipse(11, 5, 3, 2, P.white); p.set(11, 5, '#b8693f'); p.rect(12, 8, 3, 1, P.metalL); o['fx/plates'] = fin(p);
  p = new Px(14, 10); p.ellipse(6.5, 6, 6, 3, P.white); p.ellipse(6.5, 5, 4, 2, P.cream); o['fx/plate'] = fin(p);
  const bubble = (name, draw) => { const q = new Px(16, 18); q.blob(7.5, 7, 7, 6, P.white, P.white, P.grayL); q.set(6, 14, P.white); q.set(7, 14, P.white); q.set(7, 15, P.white); draw(q); o[name] = fin(q); };
  bubble('fx/b_order', (q) => { q.rect(7, 3, 2, 6, P.red); q.rect(7, 10, 2, 2, P.red); });
  bubble('fx/b_wait', (q) => { for (const x of [4, 7, 10]) q.rect(x, 7, 2, 2, P.grayD); });
  bubble('fx/b_pay', (q) => { q.blob(7.5, 7, 3, 3, P.gold, P.yellow, P.goldD); q.vline(8, 5, 5, P.goldD); });
  bubble('fx/b_happy', (q) => { q.set(5, 5, P.red); q.set(6, 4, P.red); q.set(9, 4, P.red); q.set(10, 5, P.red); q.rect(5, 6, 6, 2, P.red); q.rect(6, 8, 4, 1, P.red); q.rect(7, 9, 2, 1, P.red); q.set(7, 5, P.red); q.set(8, 5, P.red); });
  bubble('fx/b_angry', (q) => { q.line(4, 4, 6, 6, P.redD); q.line(11, 4, 9, 6, P.redD); q.hline(5, 10, 6, P.redD); });
  bubble('fx/b_talk', (q) => { q.hline(4, 5, 8, P.grayD); q.hline(4, 7, 6, P.grayD); q.hline(4, 9, 7, P.grayD); });
  return o;
}
const TOOLS_HELD = { axe: (p) => { p.line(2, 14, 9, 4, P.wood); p.box(8, 1, 5, 5, P.metal, P.metalL, P.metalD); }, pickaxe: (p) => { p.line(3, 14, 8, 5, P.wood); p.line(3, 5, 8, 2, P.metal); p.line(8, 2, 13, 5, P.metal); }, hoe: (p) => { p.line(2, 14, 9, 3, P.wood); p.rect(9, 2, 4, 2, P.metal); p.rect(12, 3, 1, 3, P.metal); }, watering_can: (p) => { p.box(3, 7, 7, 6, P.teal, '#77c4bb', '#2e6f69'); p.line(10, 9, 13, 6, P.teal); p.rect(4, 4, 4, 1, '#2e6f69'); }, cloth: (p) => { p.box(4, 6, 8, 6, P.white, P.white, P.blueL); p.set(6, 8, P.blueL); }, hammer: (p) => { p.line(3, 14, 8, 6, P.wood); p.box(6, 2, 7, 4, P.metalD, P.metal, P.iron); }, spoon: (p) => { p.line(4, 13, 9, 5, P.woodL); p.blob(10, 4, 2, 2, P.woodL, null, P.wood); }, rod: (p) => { p.line(2, 14, 13, 1, P.wood); p.line(13, 1, 14, 9, P.grayL); } };
export function buildWorld() {
  const o = { ...buildings(), ...simple(), ...fx() };
  for (const s of ['spring', 'summer', 'autumn', 'winter']) { o[`o/tree/${s}`] = tree(s); o[`o/pine/${s}`] = pine(s); o[`o/berry/${s}`] = bush(s, true); o[`o/bush/${s}`] = bush(s, false); }
  o['o/stump'] = stump(); o['o/rock'] = rock(false); o['o/rubble'] = rock(true); o['o/mushroom'] = mushroomNode();
  for (const id of ['potato_seed', 'carrot_seed', 'onion_seed', 'tomato_seed', 'pepper_seed']) for (let st = 0; st < 4; st++) o[`crop/${id}/${st}`] = crop(id, st);
  for (const f of [0, 1]) { o[`t/loco/${f}`] = loco(f); o[`t/wagon/${f}/closed`] = wagon(f, false); o[`t/wagon/${f}/open`] = wagon(f, true); }
  for (const [k, fn] of Object.entries(TOOLS_HELD)) { const p = new Px(16, 16); fn(p); o[`h/${k}`] = fin(p); }
  void rng;
  return o;
}
// Arayüz çerçeveleri (ahşap + kâğıt) — DOM border-image olarak kullanılır
export function uiSprites() {
  const o = {}; let p = new Px(24, 24); p.rect(0, 0, 24, 24, P.woodD); p.frame(0, 0, 24, 24, O); p.frame(1, 1, 22, 22, P.woodL); p.frame(2, 2, 20, 20, P.wood); p.frame(3, 3, 18, 18, P.woodDD); p.rect(4, 4, 16, 16, P.paper); p.frame(4, 4, 16, 16, P.paperD); for (const [x, y] of [[1, 1], [21, 1], [1, 21], [21, 21]]) p.rect(x, y, 2, 2, P.gold); o['ui/panel'] = p;
  p = new Px(16, 16); p.rect(0, 0, 16, 16, '#d9c193'); p.frame(0, 0, 16, 16, P.woodDD); p.hline(1, 1, 14, '#b89c68'); p.vline(1, 1, 14, '#b89c68'); p.hline(1, 14, 14, '#f0deb4'); p.vline(14, 1, 14, '#f0deb4'); o['ui/slot'] = p;
  p = new Px(16, 16); p.rect(0, 0, 16, 16, '#f0deb4'); p.frame(0, 0, 16, 16, P.gold); p.frame(1, 1, 14, 14, P.goldD); o['ui/slot_sel'] = p;
  p = new Px(12, 12); p.rect(0, 0, 12, 12, P.wood); p.frame(0, 0, 12, 12, O); p.hline(1, 1, 10, P.woodL); p.vline(1, 1, 10, P.woodL); p.hline(1, 10, 10, P.woodDD); p.vline(10, 1, 10, P.woodDD); o['ui/btn'] = p;
  p = new Px(12, 12); p.rect(0, 0, 12, 12, P.woodD); p.frame(0, 0, 12, 12, O); p.hline(1, 1, 10, P.woodDD); p.vline(1, 1, 10, P.woodDD); o['ui/btn_down'] = p;
  p = new Px(12, 12); p.rect(0, 0, 12, 12, '#3b2a24'); p.frame(0, 0, 12, 12, O); p.frame(1, 1, 10, 10, P.woodD); o['ui/hud'] = p;
  return o;
}
