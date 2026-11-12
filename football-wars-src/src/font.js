/* FOOTBALL WARS — original 5x7 pixel font with diacritic composition (TR/EU names). */
(function (root) {
'use strict';
const G = {
A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
W: ['#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '##.##', '#...#'],
X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
'.': ['.', '.', '.', '.', '.', '.', '#'],
',': ['..', '..', '..', '..', '..', '.#', '#.'],
'!': ['#', '#', '#', '#', '#', '.', '#'],
'?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
'-': ['....', '....', '....', '####', '....', '....', '....'],
'_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
':': ['.', '#', '.', '.', '.', '#', '.'],
'•': ['...', '...', '###', '###', '###', '...', '...'],
'·': ['.', '.', '.', '#', '.', '.', '.'],
'#': ['.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.....'],
'/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
"'": ['#', '#', '.', '.', '.', '.', '.'],
'"': ['#.#', '#.#', '...', '...', '...', '...', '...'],
'&': ['.##..', '#..#.', '.##..', '.#...', '#.#.#', '#..#.', '.##.#'],
'(': ['..#', '.#.', '#..', '#..', '#..', '.#.', '..#'],
')': ['#..', '.#.', '..#', '..#', '..#', '.#.', '#..'],
'+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
'%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
'*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
'=': ['....', '....', '####', '....', '####', '....', '....'],
'>': ['#...', '.#..', '..#.', '...#', '..#.', '.#..', '#...'],
'<': ['...#', '..#.', '.#..', '#...', '.#..', '..#.', '...#'],
'|': ['#', '#', '#', '#', '#', '#', '#']
};
// combining marks: list of [dx (from glyph centre-ish), dy] relative to a 5-wide glyph
const MARKS = {
  '́': [[3, -2], [2, -1]], '̀': [[1, -2], [2, -1]], '̈': [[1, -1], [3, -1]], '̇': [[2, -1]],
  '̧': [[2, 7], [1, 8]], '̆': [[1, -2], [3, -2], [2, -1]], '̃': [[0, -1], [1, -2], [2, -1], [3, -2]],
  '̊': [[1, -2], [2, -3], [3, -2], [2, -1]], '̌': [[1, -2], [3, -2], [2, -1]], '̂': [[2, -2], [1, -1], [3, -1]],
  '̨': [[3, 7], [4, 8]], '̋': [[2, -2], [4, -2], [1, -1], [3, -1]], '̄': [[1, -1], [2, -1], [3, -1]],
  '̦': [[2, 8], [1, 9]]
};
const SPECIAL = { 'Ø': ['O', [[4, 1], [3, 2], [2, 3], [1, 4], [0, 5]]], 'Đ': ['D', [[0, 3], [1, 3]]], 'Ł': ['L', [[1, 3], [2, 2]]], 'Ħ': ['H', [[0, 1], [4, 1]]] };
const REPL = { 'Æ': 'AE', 'Œ': 'OE', 'ß': 'SS', 'Þ': 'TH', 'Ð': 'D', 'ı': 'I', '’': "'", '–': '-', '—': '-', '×': 'X', 'ẞ': 'SS' };

function upper(s) { return String(s).toLocaleUpperCase('tr'); }
// returns array of {g: glyphRows, marks: [[x,y]...]}
function layout(str) {
  let s = '';
  for (const ch of upper(str)) s += REPL[ch] != null ? REPL[ch] : ch;
  const out = [];
  for (const ch of s) {
    if (SPECIAL[ch]) { out.push({ g: G[SPECIAL[ch][0]], marks: SPECIAL[ch][1].slice() }); continue; }
    if (ch === ' ') { out.push({ g: null, w: 3, marks: [] }); continue; }
    const d = ch.normalize('NFD');
    const base = d[0];
    let g = G[base];
    if (!g) {
      if (MARKS[base] && out.length) { out[out.length - 1].marks.push(...MARKS[base]); continue; }
      g = G['?'];
    }
    const marks = [];
    for (let i = 1; i < d.length; i++) if (MARKS[d[i]]) marks.push(...MARKS[d[i]]);
    out.push({ g, marks });
  }
  return out;
}
function measure(str, bold) {
  const L = layout(str); let w = 0;
  for (const c of L) w += (c.g ? c.g[0].length : c.w) + 1 + (bold ? 1 : 0);
  return Math.max(0, w - 1);
}
// draw a bitmap mask into an array of [x,y] pixel coords (logical, 1px per font pixel)
function pixels(str, bold) {
  const L = layout(str), px = []; let x = 0;
  for (const c of L) {
    if (!c.g) { x += c.w + 1 + (bold ? 1 : 0); continue; }
    const gw = c.g[0].length;
    for (let r = 0; r < 7; r++) for (let k = 0; k < gw; k++) if (c.g[r][k] === '#') { px.push([x + k, r]); if (bold) px.push([x + k + 1, r]); }
    const off = gw < 5 ? -Math.floor((5 - gw) / 2) : 0;
    for (const m of c.marks) { const mx = x + Math.min(gw - 1, Math.max(0, m[0] + off)); px.push([mx, m[1]]); if (bold) px.push([mx + 1, m[1]]); }
    x += gw + 1 + (bold ? 1 : 0);
  }
  return { px, w: Math.max(1, x - 1) };
}
// Text sprite cache: returns a canvas at "logical" scale (each font pixel = scale logical px).
const cache = new Map();
function textCanvas(str, o) {
  o = o || {};
  const scale = o.scale || 1, color = o.color || '#fff', color2 = o.color2 || null, outline = o.outline === undefined ? '#0b0d16' : o.outline;
  const shadow = o.shadow === undefined ? 'rgba(0,0,0,0.55)' : o.shadow, bold = !!o.bold;
  const key = [str, scale, color, color2, outline, shadow, bold].join('|');
  let c = cache.get(key);
  if (c) { cache.delete(key); cache.set(key, c); return c; }
  const P = pixels(str, bold);
  const pad = 3; // rows above for marks, outline, shadow
  const W = (P.w + 2 + 1) * scale + 0, H = (7 + pad + 3 + 1) * scale;
  c = (typeof OffscreenCanvas !== 'undefined' && o.offscreen) ? new OffscreenCanvas(W, H) : document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const oy = pad, ox = 1;
  const set = new Set(P.px.map(p => p[0] + ',' + p[1]));
  if (shadow) { g.fillStyle = shadow; for (const p of P.px) g.fillRect((p[0] + ox + 1) * scale, (p[1] + oy + 1) * scale + scale, scale, scale); }
  if (outline) {
    g.fillStyle = outline;
    for (const p of P.px) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!set.has((p[0] + dx) + ',' + (p[1] + dy))) g.fillRect((p[0] + dx + ox) * scale, (p[1] + dy + oy) * scale, scale, scale);
  }
  for (const p of P.px) {
    g.fillStyle = (color2 && p[1] >= 4) ? color2 : color;
    g.fillRect((p[0] + ox) * scale, (p[1] + oy) * scale, scale, scale);
    if (color2 && p[1] === 0) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect((p[0] + ox) * scale, (p[1] + oy) * scale, scale, Math.max(1, scale >> 1)); }
  }
  c.ox = ox * scale; c.oy = oy * scale; c.tw = P.w * scale; c.th = 7 * scale;
  cache.set(key, c);
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  return c;
}
// draw text; align: 'left'|'center'|'right'; y = top of cap height
function draw(ctx, str, x, y, o) {
  o = o || {};
  const c = textCanvas(str, o);
  let dx = x - c.ox;
  if (o.align === 'center') dx = x - c.ox - c.tw / 2; else if (o.align === 'right') dx = x - c.ox - c.tw;
  const dy = y - c.oy;
  if (o.alpha != null && o.alpha < 1) { const a = ctx.globalAlpha; ctx.globalAlpha = a * o.alpha; ctx.drawImage(c, Math.round(dx), Math.round(dy)); ctx.globalAlpha = a; }
  else ctx.drawImage(c, Math.round(dx), Math.round(dy));
  return c.tw;
}
// largest integer scale <= maxScale so that text fits maxW
function fitScale(str, maxW, maxScale, bold) { const w = measure(str, bold); let s = maxScale; while (s > 1 && w * s > maxW) s--; return s; }
root.FWFont = { measure, draw, textCanvas, fitScale, layout, upper, clear: () => cache.clear() };
})(typeof window !== 'undefined' ? window : globalThis);
