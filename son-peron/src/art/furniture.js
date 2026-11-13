// Mobilya, ekipman, demirbaş ve kozmetik sprite'ları. Ayak izi (karo) ile görsel yükseklik ayrıdır:
// sprite = (w*16) × (h*16 + H); H ayak izinin üstüne taşan görsel yüksekliktir. Dört yön için ayrı üretilir.
import { Px, P, rng } from './px.js';
import { itemIcon } from './items.js';

const O = P.ink;
const WOOD = { m: P.wood, l: P.woodL, d: P.woodD, dd: P.woodDD }, OLD = { m: P.old, l: P.oldL, d: P.oldD, dd: '#40332b' }, DARK = { m: '#7d4c2a', l: '#a0683c', d: '#573221', dd: '#3a2116' };
const STONE = { m: P.stone, l: P.stoneL, d: P.stoneD, dd: '#4c4741' }, METAL = { m: P.metal, l: P.metalL, d: P.metalD, dd: P.iron }, WHITE = { m: '#e6e2d6', l: P.white, d: '#b9b4a6', dd: '#8a857a' };
const DIRS = ['down', 'left', 'up', 'right'];
const mk = (wc, hc, H) => { const p = new Px(wc * 16, hc * 16 + H); p.H = H; p.tw = wc * 16; p.th = hc * 16; return p; };
const fin = (p) => { const H = p.H; p.outline(O); p.H = H; return p; };
// Kutu gövde: üst yüz + ön yüz
function body(p, c, inset = 0) { const w = p.tw - inset * 2, th = p.th - inset; p.box(inset, 0, w, th, c.m, c.l, c.d); p.box(inset, th, w, p.H + inset, c.d, c.m, c.dd); return p; }
function tableP(wc, hc, c, opt = {}) {
  const p = mk(wc, hc, 6); const w = p.tw, th = p.th;
  p.box(1, 1, w - 2, th - 2, c.m, c.l, c.d); for (let y = 4; y < th - 2; y += 4) p.hline(3, y, w - 6, c.d);
  if (opt.cloth) { p.rect(3, 3, w - 6, th - 6, opt.cloth); p.frame(3, 3, w - 6, th - 6, P.white); }
  if (opt.round) { const q = mk(wc, hc, 6); q.blob(w / 2 - 0.5, th / 2, w / 2 - 2, th / 2 - 2, c.m, c.l, c.d); q.ellipse(w / 2 - 0.5, th / 2, w / 2 - 5, th / 2 - 5, c.l); q.rect(w / 2 - 2, th - 2, 3, 7, c.dd); q.rect(w / 2 - 4, th + 4, 7, 2, c.d); return fin(q); }
  p.rect(1, th - 1, w - 2, 2, c.d); for (const x of [2, w - 4]) p.rect(x, th + 1, 2, 5, c.dd);
  return fin(p);
}
function chairP(dir, c, cushion, ornate) {
  const p = mk(1, 1, 7); const seat = cushion || c.l;
  if (dir === 'down') { p.box(3, 0, 10, 9, c.m, c.l, c.d); if (ornate) { p.rect(5, 2, 6, 5, cushion); p.set(7, 0, P.gold); p.set(8, 0, P.gold); } else p.vline(8, 2, 6, c.d); p.box(3, 9, 10, 6, seat, null, c.d); p.rect(3, 15, 10, 2, c.d); p.rect(3, 17, 2, 5, c.dd); p.rect(11, 17, 2, 5, c.dd); }
  else if (dir === 'up') { p.box(3, 6, 10, 6, seat, null, c.d); p.rect(3, 18, 2, 4, c.dd); p.rect(11, 18, 2, 4, c.dd); p.box(3, 10, 10, 10, c.m, c.l, c.d); if (ornate) p.rect(5, 12, 6, 5, c.d); else { p.vline(6, 12, 6, c.d); p.vline(9, 12, 6, c.d); } }
  else { const L = dir === 'left'; p.box(3, 8, 10, 7, seat, null, c.d); p.rect(3, 15, 10, 2, c.d); p.rect(3, 17, 2, 5, c.dd); p.rect(11, 17, 2, 5, c.dd); p.box(L ? 11 : 3, 0, 3, 15, c.m, c.l, c.d); if (ornate) p.set(L ? 12 : 4, 0, P.gold); }
  return fin(p);
}
function benchP(wc, hc, dir, c, cushion) {
  const p = mk(wc, hc, 6); const w = p.tw, th = p.th; const seat = cushion || c.l;
  p.box(1, 3, w - 2, th - 3, seat, cushion ? null : c.l, c.d); if (cushion) { if (wc > hc) p.vline(w / 2, 4, th - 5, c.d); else p.hline(2, th / 2 + 1, w - 4, c.d); }
  p.rect(1, th, w - 2, 2, c.d); for (const x of [2, w - 4]) p.rect(x, th + 2, 2, 4, c.dd);
  if (dir === 'down') p.box(1, 0, w - 2, 6, c.m, c.l, c.d); else if (dir === 'up') p.box(1, th - 4, w - 2, 7, c.m, c.l, c.d); else p.box(dir === 'left' ? w - 4 : 1, 0, 3, th + 1, c.m, c.l, c.d);
  return fin(p);
}
function cabinet(wc, hc, H, c, deco) { const p = mk(wc, hc, H); body(p, c); if (deco) deco(p, p.tw, p.th, H); return fin(p); }
const shelves = (cols) => (p, w, th, H) => { const r = rng(w * 7 + H); p.rect(2, th + 1, w - 4, H - 3, '#3a2a22'); for (let y = th + 1; y < th + H - 4; y += 6) { p.hline(2, y + 5, w - 4, P.woodL); for (let x = 3; x < w - 4; x += 3) if (r() < 0.75) p.rect(x, y + 1, 2, 4, cols[(r() * cols.length) | 0]); } };
const doors = (c, knob = P.gold) => (p, w, th, H) => { const n = Math.max(1, Math.round(w / 16)); for (let i = 0; i < n; i++) { const x = 2 + (i * (w - 4)) / n; p.frame(x, th + 2, (w - 4) / n - 1, H - 4, c.dd); p.set(x + (w - 4) / n - 3, th + H / 2, knob); } };
function counter(wc, hc, c, topDeco) { return cabinet(wc, hc, 9, c, (p, w, th, H) => { p.rect(0, 0, w, th, c.l); p.frame(0, 0, w, th, c.d); p.hline(0, th - 1, w, c.dd); doors(c)(p, w, th, H); if (topDeco) topDeco(p, w, th); }); }
function stove(wc, hc, c, state, opt = {}) {
  return cabinet(wc, hc, 9, c, (p, w, th, H) => {
    p.rect(1, 1, w - 2, th - 2, opt.top || P.iron); const n = Math.max(1, Math.round(Math.max(w, th) / 16)); const horiz = w >= th;
    for (let i = 0; i < n; i++) { const cx = horiz ? 8 + i * 16 : w / 2, cy = horiz ? th / 2 : 8 + i * 16; p.ellipse(cx - 0.5, cy, 5, 4, '#2a2a2e'); p.ellipse(cx - 0.5, cy, 3, 2, state === 'cook' && i === 0 ? P.orange : '#55555b'); }
    p.rect(2, th + 2, w - 4, H - 4, opt.door || c.dd); p.hline(3, th + 3, w - 6, c.l);
    if (opt.gold) { p.hline(1, th, w - 2, P.gold); p.set(3, th + 5, P.gold); p.set(w - 4, th + 5, P.gold); }
    if (state === 'cook') p.rect(4, th + 5, w - 8, 2, P.orange);
    if (state === 'cook' || state === 'done') { const cx = horiz ? 8 : w / 2, cy = horiz ? th / 2 : 8; p.box(cx - 5, cy - 5, 10, 7, P.metalD, P.metal, P.iron); p.rect(cx - 7, cy - 4, 2, 2, P.iron); p.rect(cx + 5, cy - 4, 2, 2, P.iron); p.ellipse(cx - 0.5, cy - 5, 4, 1, state === 'done' ? '#f0b56a' : '#d98a3c'); if (state === 'done') { p.set(cx - 2, cy - 6, P.white); p.set(cx + 1, cy - 6, P.white); } }
    if (state === 'broken') { p.line(3, 2, w - 5, th - 3, O); p.line(w - 6, 3, w - 9, th + 6, O); p.speckle(1, 1, w - 2, th + H - 3, ['#2a2a2e', '#4a3a30'], 0.12, 5); p.rect(w - 7, th + 4, 4, 4, '#1b1413'); }
  });
}
function plantP(big, flowers) { const p = mk(big ? 2 : 1, 1, big ? 14 : 8); const w = p.tw, cx = w / 2 - 0.5, base = p.th + p.H; p.box(cx - (big ? 6 : 3), base - 7, big ? 13 : 7, 7, '#b8693f', '#d48a5a', '#8a4826'); p.blob(cx, base - 12, big ? 9 : 5, big ? 7 : 5, P.green, P.greenL, P.greenD); p.blob(cx - (big ? 5 : 2), base - 16, big ? 5 : 3, big ? 5 : 3, P.greenL, '#b7e08c', P.green); if (big) p.blob(cx + 5, base - 18, 4, 4, P.green, P.greenL, P.greenD); if (flowers) for (const [x, y] of flowers) { p.set(cx + x, base - 12 + y, P.pink); p.set(cx + x + 1, base - 12 + y, P.yellow); } return fin(p); }

// ---- tür bazlı çizerler: (wc, hc, dir, state) => Px
const PAINT = {
  simple_table: (w, h) => tableP(w, h, WOOD), old_table: (w, h) => { const p = tableP(w, h, OLD); p.line(4, 5, 9, 9, P.oldD); p.set(20, 12, P.oldD); return p; },
  large_table: (w, h) => tableP(w, h, WOOD, { cloth: '#c9d8c0' }), round_table: (w, h) => tableP(w, h, DARK, { round: true }), banquet_table: (w, h) => tableP(w, h, DARK, { cloth: '#b3413c' }),
  wooden_chair: (w, h, d) => chairP(d, WOOD), old_chair: (w, h, d) => chairP(d, OLD), comfort_chair: (w, h, d) => chairP(d, WOOD, '#4f8fc0'), ornate_chair: (w, h, d) => chairP(d, DARK, '#a34858', true),
  stool: () => { const p = mk(1, 1, 5); p.blob(7.5, 8, 5, 4, P.woodL, '#f0c58e', P.wood); p.rect(4, 11, 8, 2, P.woodD); p.rect(4, 13, 2, 7, P.woodDD); p.rect(10, 13, 2, 7, P.woodDD); p.hline(5, 17, 6, P.woodD); return fin(p); },
  double_bench: (w, h, d) => benchP(w, h, d, WOOD), cushioned_sofa: (w, h, d) => benchP(w, h, d, DARK, '#6aa84f'), garden_bench: (w, h, d) => benchP(w, h, d, { m: '#6b8a5a', l: '#8aa878', d: '#4a6640', dd: '#34482e' }),
  small_chest: (w, h) => cabinet(w, h, 7, WOOD, (p, W, th, H) => { p.hline(0, th - 3, W, P.woodDD); for (const x of [3, W - 5]) p.rect(x, 0, 2, th + H, P.metalD); p.rect(W / 2 - 1, th, 3, 3, P.gold); }),
  large_chest: (w, h) => cabinet(w, h, 9, DARK, (p, W, th, H) => { p.hline(0, th - 4, W, DARK.dd); for (const x of [3, W / 2 - 1, W - 5]) p.rect(x, 0, 2, th + H, P.metal); p.rect(W / 2 - 2, th + 1, 4, 4, P.gold); p.set(W / 2 - 1, th + 3, O); }),
  depot_crate: (w, h) => cabinet(w, h, 10, WOOD, (p, W, th, H) => { p.frame(1, 1, W - 2, th - 2, P.woodDD); p.line(2, 2, W - 3, th - 3, P.woodD); p.line(W - 3, 2, 2, th - 3, P.woodD); p.frame(1, th + 1, W - 2, H - 2, P.woodDD); p.box(W / 2 - 5, th + 2, 10, 5, P.paper, P.cream, P.paperD); p.hline(W / 2 - 3, th + 4, 6, O); }),
  wooden_shelf: (w, h) => cabinet(w, h, 14, WOOD, shelves([P.red, P.cream, P.blue, P.green])), kitchen_shelf: (w, h) => cabinet(w, h, 14, WOOD, shelves([P.cream, P.metalL, P.orange, P.white])),
  bar_bottle_shelf: (w, h) => cabinet(w, h, 14, DARK, shelves([P.greenD, '#b3413c', P.gold, '#8fc3e0', P.maroon])), bookshelf: (w, h) => cabinet(w, h, 15, DARK, shelves([P.red, P.blueD, P.greenD, P.gold, P.purple, P.maroon])),
  pantry_cabinet: (w, h) => cabinet(w, h, 14, WOOD, doors(WOOD)), wardrobe: (w, h) => cabinet(w, h, 15, DARK, doors(DARK)), refrigerator: (w, h) => cabinet(w, h, 15, WHITE, (p, W, th, H) => { p.hline(1, th + 6, W - 2, WHITE.dd); p.vline(W - 4, th + 2, 3, P.metalD); p.vline(W - 4, th + 8, 5, P.metalD); p.rect(3, th + 2, 3, 2, P.blueL); }),
  cleaning_cupboard: (w, h) => cabinet(w, h, 14, OLD, (p, W, th, H) => { doors(OLD)(p, W, th, H); p.vline(13, th - 8, 12, P.woodL); p.rect(11, th + 4, 5, 4, P.yellow); p.hline(11, th + 8, 5, '#b5962f'); }),
  small_plant: () => plantP(false), large_plant: () => plantP(true, [[-4, -2], [3, -5]]),
  flower_bed: (w, h) => { const p = mk(w, h, 4); p.box(0, 2, p.tw, p.th + 2, P.wood, P.woodL, P.woodD); p.rect(2, 4, p.tw - 4, p.th - 4, '#6b4a2e'); const r = rng(w + h * 3); for (let i = 0; i < (p.tw * p.th) / 28; i++) { const x = 3 + r() * (p.tw - 7), y = 3 + r() * (p.th - 5); p.set(x, y + 1, P.greenD); p.set(x, y, [P.pink, P.yellow, P.red, P.white][(r() * 4) | 0]); p.set(x + 1, y, P.green); } return fin(p); },
  wooden_fence: () => { const p = mk(1, 1, 6); for (const x of [1, 7, 13]) { p.box(x, 4, 3, 16, P.woodL, '#f0c58e', P.wood); p.set(x + 1, 3, P.woodL); } p.rect(0, 9, 16, 2, P.wood); p.rect(0, 15, 16, 2, P.wood); return fin(p); },
  garden_bed: (w, h, d, st) => { const p = mk(w, h, 0); p.box(0, 0, p.tw, p.th, P.wood, P.woodL, P.woodDD); const soil = st === 'wet' ? '#4a3220' : st === 'tilled' ? '#6b4a2e' : '#8a6a48'; p.rect(2, 2, p.tw - 4, p.th - 4, soil); if (st) for (let y = 5; y < p.th - 3; y += 5) p.hline(3, y, p.tw - 6, st === 'wet' ? '#33210f' : '#553a22'); else p.speckle(2, 2, p.tw - 4, p.th - 4, ['#7a5c3d', P.greenD], 0.08, 7); return p; },
  small_rug: (w, h) => { const p = mk(w, h, 0); p.rect(1, 1, p.tw - 2, p.th - 2, '#a34858'); p.frame(1, 1, p.tw - 2, p.th - 2, P.gold); p.frame(4, 4, p.tw - 8, p.th - 8, P.cream); p.blob(p.tw / 2 - 0.5, p.th / 2 - 0.5, 4, 4, P.gold, P.yellow, P.goldD); for (let x = 2; x < p.tw - 2; x += 2) { p.set(x, 0, P.cream); p.set(x, p.th - 1, P.cream); } return p; },
  framed_picture: () => { const p = mk(1, 1, 0); p.box(3, 2, 10, 9, P.gold, P.yellow, P.goldD); p.rect(5, 4, 6, 5, P.blueL); p.rect(5, 7, 6, 2, P.green); p.set(9, 5, P.yellow); return p; },
  memory_photo: () => { const p = mk(1, 1, 0); p.box(3, 2, 10, 9, DARK.m, DARK.l, DARK.d); p.rect(5, 4, 6, 5, '#d9c8a4'); p.rect(6, 6, 4, 3, '#8a7458'); p.rect(7, 5, 2, 1, '#6b5a48'); return p; },
  heirloom_clock: () => { const p = mk(1, 1, 0); p.box(4, 0, 8, 13, DARK.m, DARK.l, DARK.d); p.blob(7.5, 4, 2, 2, P.cream, P.white, P.paperD); p.set(8, 4, O); p.set(8, 3, O); p.vline(8, 8, 4, P.gold); p.set(8, 11, P.yellow); return p; },
  wall_clock: () => { const p = mk(1, 1, 0); p.blob(7.5, 6, 5, 5, P.gold, P.yellow, P.goldD); p.blob(7.5, 6, 3, 3, P.white, P.white, P.cream); p.vline(8, 4, 3, O); p.hline(8, 6, 2, O); return p; },
  old_station_sign: () => { const p = mk(1, 1, 0); p.box(1, 3, 14, 7, P.navy, '#4a5f8f', '#1f2a47'); p.frame(2, 4, 12, 5, P.cream); p.rect(4, 6, 8, 1, P.cream); return p; },
  final_plaque: () => { const p = mk(1, 1, 0); p.box(2, 2, 12, 10, P.gold, P.yellow, P.goldD); p.rect(4, 4, 8, 1, P.goldD); p.rect(4, 6, 8, 1, P.goldD); p.blob(7.5, 9, 1, 1, P.red, null, null); return p; },
  spring_flower_wreath: () => { const p = mk(1, 1, 0); p.blob(7.5, 7, 6, 6, P.green, P.greenL, P.greenD); for (let y = 4; y < 11; y++) for (let x = 5; x < 11; x++) if ((x - 7.5) ** 2 + (y - 7) ** 2 < 9) p.clear(x, y); for (const [x, y, c] of [[3, 4, P.pink], [11, 3, P.yellow], [12, 9, P.white], [4, 11, P.pink], [8, 13, P.yellow], [7, 1, P.white]]) p.set(x, y, c); return p; },
  summer_station_pennant: () => { const p = mk(1, 1, 0); p.hline(0, 2, 16, P.woodD); for (let i = 0; i < 4; i++) { const c = [P.red, P.yellow, P.blue, P.green][i]; for (let y = 0; y < 5; y++) p.hline(i * 4 + (y >> 1), 3 + y, 4 - y, c); } return p; },
  curtain: () => { const p = new Px(16, 30); p.H = 14; p.rect(0, 0, 16, 2, P.woodD); for (let x = 1; x < 15; x++) { const c = x % 3 === 0 ? '#8e2c2c' : x % 3 === 1 ? P.red : '#d9655a'; p.vline(x, 2, x < 5 || x > 10 ? 26 : 8, c); } p.rect(5, 10, 6, 14, P.blueL); p.frame(5, 10, 6, 14, P.woodD); p.vline(8, 10, 14, P.woodD); p.hline(1, 20, 4, P.gold); p.hline(11, 20, 4, P.gold); return p; },
  wallpaper_pack: (w) => { const p = mk(w, 1, 0); p.rect(0, 1, p.tw, 8, '#cfe0c4'); for (let x = 2; x < p.tw; x += 4) { p.vline(x, 1, 8, '#a9c79a'); p.set(x + 2, 3, P.pink); p.set(x + 2, 6, P.gold); } p.hline(0, 1, p.tw, '#7a9a6a'); p.hline(0, 8, p.tw, '#7a9a6a'); return p; },
  floor_lamp: () => { const p = mk(1, 1, 16); p.rect(7, 10, 2, 18, P.metalD); p.rect(5, 28, 6, 2, P.iron); p.box(3, 1, 10, 9, P.yellow, '#fbeeb0', '#d9b84a'); p.hline(4, 10, 8, P.goldD); return fin(p); },
  winter_lantern: () => { const p = mk(1, 1, 8); p.rect(6, 2, 4, 2, P.iron); p.box(4, 4, 8, 12, P.redD, P.red, '#5c1c1c'); p.rect(6, 7, 4, 6, P.yellow); p.set(7, 9, P.white); p.rect(4, 16, 8, 2, P.iron); p.rect(7, 18, 2, 5, P.iron); return fin(p); },
  coat_rack: () => { const p = mk(1, 1, 14); p.rect(7, 2, 2, 24, P.woodD); p.rect(4, 26, 8, 2, P.woodDD); p.line(7, 4, 3, 2, P.wood); p.line(8, 4, 12, 2, P.wood); p.box(2, 5, 5, 10, P.blueD, P.blue, P.navy); p.blob(12, 6, 2, 2, P.woodL, null, P.wood); return fin(p); },
  wood_partition: (w, h) => { const p = mk(w, h, 14); const W = p.tw, th = p.th; if (W > th) { for (let i = 0; i < W / 8; i++) { p.box(i * 8, 2, 8, th + 10, P.wood, P.woodL, P.woodD); p.rect(i * 8 + 2, 5, 4, th + 3, P.paper); p.set(i * 8 + 4, 8, P.pink); } } else { p.box(5, 0, 6, th + 12, P.wood, P.woodL, P.woodD); for (let y = 3; y < th + 8; y += 8) p.rect(7, y, 2, 5, P.paper); } return fin(p); },
  woodshed: (w, h) => cabinet(w, h, 10, WOOD, (p, W, th, H) => { p.rect(0, 0, W, th, '#8a4826'); for (let y = 0; y < th; y += 3) p.hline(0, y, W, '#b8693f'); p.rect(2, th + 1, W - 4, H - 2, '#3a2a22'); for (let y = 0; y < 2; y++) for (let x = 0; x < (W - 6) / 5; x++) p.blob(5 + x * 5, th + 3 + y * 4, 2, 2, P.woodL, '#f0c58e', P.wood); }),
  chandelier: (w, h) => { const p = mk(w, h, 0); const cx = p.tw / 2 - 0.5, cy = p.th / 2; p.blob(cx, cy, 5, 4, P.gold, P.yellow, P.goldD); for (const [dx, dy] of [[-11, -6], [11, -6], [-11, 7], [11, 7], [0, -11], [0, 11]]) { p.line(cx, cy, cx + dx, cy + dy, P.goldD); p.blob(cx + dx, cy + dy, 2, 2, '#fbeeb0', P.white, P.yellow); } return fin(p); },
  garden_lamppost: () => { const p = mk(1, 1, 24); p.rect(7, 10, 2, 28, P.iron); p.rect(5, 38, 6, 2, P.black); p.box(4, 2, 8, 8, P.yellow, '#fbeeb0', '#d9b84a'); p.rect(3, 0, 10, 2, P.iron); p.rect(3, 10, 10, 1, P.iron); return fin(p); },
  ornate_sign: (w, h) => { const p = mk(w, h, 14); const W = p.tw; p.rect(3, 14, 2, p.th + 0, P.woodDD); p.rect(W - 5, 14, 2, p.th, P.woodDD); p.box(0, 0, W, 15, DARK.m, DARK.l, DARK.d); p.frame(2, 2, W - 4, 11, P.gold); p.rect(5, 6, W - 10, 1, P.gold); p.rect(7, 9, W - 14, 1, P.cream); return fin(p); },
  recipe_book_podium: () => { const p = mk(1, 1, 10); p.rect(6, 12, 4, 12, DARK.d); p.rect(4, 24, 8, 2, DARK.dd); p.box(2, 4, 12, 8, DARK.m, DARK.l, DARK.d); p.rect(3, 5, 5, 6, P.cream); p.rect(8, 5, 5, 6, P.paper); p.hline(4, 7, 3, O); p.hline(9, 7, 3, O); return fin(p); },
  autumn_harvest_basket: () => { const p = mk(1, 1, 6); p.box(2, 10, 12, 10, '#c9a56e', '#dcc08f', '#a08052'); for (let x = 3; x < 14; x += 3) p.vline(x, 11, 8, '#a08052'); p.blob(5, 8, 2, 2, P.orange, '#f2b06a', '#a85f25'); p.blob(9, 7, 3, 3, P.red, '#e87868', P.redD); p.blob(12, 9, 2, 2, P.yellow, null, P.goldD); return fin(p); },
  // --- ekipman & demirbaş
  starter_stove: (w, h, d, st) => stove(w, h, { m: '#8a8580', l: '#a8a39c', d: '#63605e', dd: '#45423f' }, st), second_stove: (w, h, d, st) => stove(w, h, { m: '#a85a45', l: '#c5745c', d: '#7c3b2c', dd: '#55271d' }, st),
  advanced_stove: (w, h, d, st) => stove(w, h, { m: '#3d4048', l: '#5a5e68', d: '#2a2c32', dd: '#1b1c20' }, st, { gold: true, top: '#1f2024' }),
  basic_oven: (w, h, d, st) => cabinet(w, h, 14, { m: P.brick, l: P.brickL, d: P.brickD, dd: '#55271d' }, (p, W, th, H) => { for (let y = th + 1; y < th + H; y += 3) for (let x = ((y / 3) % 2) * 3; x < W; x += 6) p.set(x, y, P.brickD); p.box(3, th + 3, W - 6, 8, '#2a2a2e', '#45454b', '#1b1b1e'); p.rect(5, th + 5, W - 10, 4, st === 'cook' ? P.orange : st === 'done' ? '#d9a03c' : '#3a3a40'); if (st === 'cook') p.rect(7, th + 6, W - 14, 2, P.yellow); p.rect(W / 2 - 3, 1, 6, 5, P.brickD); }),
  kettle: (w, h, d, st) => { const p = mk(1, 1, 9); body(p, METAL, 1); p.ellipse(7.5, 7, 5, 4, '#2a2a2e'); p.ellipse(7.5, 7, 3, 2, st === 'cook' ? P.orange : '#55555b'); p.blob(7.5, 3, 4, 4, '#c98e30', '#f0c468', '#946320'); p.rect(11, 2, 3, 1, '#946320'); p.rect(6, -1 + 0, 3, 1, O); p.frame(5, -2 + 2, 5, 3, O); if (st === 'done') p.set(13, 0, P.white); return fin(p); },
  large_pan: (w, h, d, st) => { const p = mk(1, 1, 9); body(p, STONE, 1); p.blob(7.5, 6, 6, 5, '#2a2a2e', '#4a4a50', '#151517'); p.ellipse(7.5, 6, 4, 3, st === 'cook' ? '#8a4a2a' : st === 'done' ? '#c98e30' : '#3a3a40'); p.rect(13, 5, 3, 2, P.woodD); if (st === 'cook') p.rect(4, p.th + 4, 8, 2, P.orange); return fin(p); },
  coffee_machine: (w, h, d, st) => { const p = mk(1, 1, 12); body(p, DARK, 1); p.box(3, -0 + 1, 10, 12, P.metal, P.metalL, P.metalD); p.rect(5, 3, 6, 3, P.iron); p.set(6, 4, st === 'cook' ? P.red : P.green); p.rect(6, 9, 4, 4, P.white); p.rect(6, 9, 4, 1, '#4a2f1d'); if (st === 'done') p.set(8, 7, P.white); return fin(p); },
  juicer: (w, h, d, st) => { const p = mk(1, 1, 12); body(p, WOOD, 1); p.box(4, 4, 8, 9, '#dff0f4', P.white, '#b9d3da'); p.rect(5, 8, 6, 4, st ? (st === 'done' ? P.purple : P.orange) : '#cfe4ea'); p.rect(3, 2, 10, 2, P.metalD); p.rect(7, 0, 2, 2, P.metal); p.rect(12, 3, 3, 1, P.metal); return fin(p); },
  better_prep: (w, h) => counter(w, h, WOOD, (p, W, th) => { p.box(3, 2, 10, th - 5, P.woodL, '#f0c58e', P.wood); p.rect(5, 4, 3, 2, P.orange); p.rect(9, 5, 2, 2, P.green); p.rect(W - 10, 3, 6, 1, P.metalL); p.rect(W - 4, 3, 2, 1, P.woodDD); }),
  prep_counter: (w, h) => counter(w, h, OLD, (p, W, th) => { p.box(3, 3, 8, th - 6, P.oldL, null, P.oldD); p.rect(W - 9, 4, 5, 1, P.metalL); }),
  workbench: (w, h, d, st) => cabinet(w, h, 9, st === 'broken' ? OLD : WOOD, (p, W, th, H) => { const c = st === 'broken' ? OLD : WOOD; p.rect(2, th + 2, W - 4, H - 2, null); for (let y = th + 2; y < th + H; y++) for (let x = 4; x < W - 4; x++) p.clear(x, y); p.rect(1, th, 3, H, c.dd); p.rect(W - 4, th, 3, H, c.dd); p.hline(4, th + 5, W - 8, c.d); if (st === 'broken') { p.line(3, 2, W - 6, th - 2, O); p.line(W / 2, 1, W / 2 + 3, th, O); p.rect(W - 9, 3, 6, 2, '#40332b'); } else { p.box(W - 9, 2, 6, 5, P.metal, P.metalL, P.metalD); p.rect(3, 3, 9, 1, P.metalL); p.rect(12, 2, 3, 3, P.woodDD); p.rect(4, 8, 5, 2, P.woodL); } }),
  bar_counter: (w, h) => counter(w, h, DARK, (p, W, th) => { p.rect(1, 1, W - 2, th - 3, '#a0683c'); p.hline(1, 1, W - 2, '#c58a5a'); if (W > th) { p.box(3, 3, 12, th - 7, P.metalD, P.metal, P.iron); p.box(W - 15, 3, 12, th - 7, '#5a3a22', '#7d5632', '#3a2414'); } }),
  food_bar_2: (w, h) => counter(w, h, WOOD, (p, W, th) => { p.box(2, 2, W - 4, th - 5, P.metalD, P.metal, P.iron); }), food_bar_3: (w, h) => counter(w, h, DARK, (p, W, th) => { p.box(2, 2, W - 4, th - 5, P.metalD, P.metalL, P.iron); p.hline(2, th - 2, W - 4, P.gold); }),
  food_bar_4: (w, h) => counter(w, h, { m: '#3d4048', l: '#5a5e68', d: '#2a2c32', dd: '#1b1c20' }, (p, W, th) => { p.box(2, 2, W - 4, th - 5, P.metal, P.metalL, P.metalD); p.frame(1, 1, W - 2, th - 3, P.gold); }),
  drink_bar_2: (w, h) => counter(w, h, WOOD, (p, W, th) => { p.box(2, 2, W - 4, th - 5, '#5a3a22', '#7d5632', '#3a2414'); p.rect(W - 6, 0, 2, 4, P.metalL); }),
  fireplace: (w, h, d, st) => cabinet(w, h, 14, STONE, (p, W, th, H) => { for (let y = 1; y < th + H; y += 4) for (let x = ((y / 4) % 2) * 4; x < W; x += 8) p.rect(x, y, 1, 3, P.stoneD); p.rect(0, th - 2, W, 3, DARK.m); p.hline(0, th - 2, W, DARK.l); p.box(5, th + 3, W - 10, H - 3, '#1b1413', null, null); p.blob(W / 2 - 4, th + H - 2, 4, 1, P.woodD, P.wood, null); p.blob(W / 2 + 3, th + H - 2, 4, 1, P.woodD, P.wood, null); if (st === 'lit' || st === 'lit2') { const k = st === 'lit' ? 0 : 1; p.blob(W / 2 - 0.5, th + H - 5, 5, 4 + k, P.orange, P.yellow, P.red); p.blob(W / 2 - 0.5 + (k ? 1 : -1), th + H - 4, 2, 3, P.yellow, P.white, P.orange); p.set(W / 2 - 4 + k * 6, th + 4, P.yellow); } }),
  player_bed: (w, h, d, st) => { const p = mk(w, h, 8); const W = p.tw, th = p.th; const vert = th >= W; if (vert) { p.box(0, 0, W, 9, DARK.m, DARK.l, DARK.d); p.box(1, 8, W - 2, th - 2, P.white, P.white, P.grayL); p.box(4, 10, W - 8, 9, P.cream, P.white, P.paperD); p.box(1, 22, W - 2, th - 16, '#4f8fc0', '#8fc3e0', '#2f5f8f'); for (let y = 26; y < th + 4; y += 6) p.hline(2, y, W - 4, '#8fc3e0'); p.box(0, th + 4, W, 4, DARK.d, DARK.m, DARK.dd); if (st === 'sleep') { p.blob(W / 2 - 0.5, 14, 4, 4, P.skin[1], P.skin[0], P.skinD[1]); p.rect(W / 2 - 5, 10, 9, 3, P.hair[1]); p.rect(W / 2 - 6, 20, 12, 4, '#4f8fc0'); } } else { p.box(0, 0, 9, th + 6, DARK.m, DARK.l, DARK.d); p.box(8, 1, W - 9, th + 2, P.white, P.white, P.grayL); p.box(10, 4, 9, th - 6, P.cream, P.white, P.paperD); p.box(22, 1, W - 23, th + 2, '#4f8fc0', '#8fc3e0', '#2f5f8f'); if (st === 'sleep') p.blob(14, th / 2, 4, 4, P.skin[1], P.skin[0], P.skinD[1]); } return fin(p); },
  old_chest: (w, h, d, st) => cabinet(1, 1, 7, OLD, (p, W, th, H) => { p.hline(0, th - 3, W, OLD.dd); p.rect(2, 0, 2, th + H, P.metalD); p.rect(12, 0, 2, th + H, P.metalD); p.rect(7, th, 3, 3, st === 'open' ? O : P.goldD); if (st === 'open') { p.rect(1, 1, W - 2, th - 5, '#1b1413'); p.hline(1, 0, W - 2, OLD.l); } else p.speckle(1, 1, W - 2, th - 3, [P.oldL], 0.15, 3); }),
  letter_desk: () => cabinet(1, 1, 8, OLD, (p, W, th) => { p.box(4, 4, 8, 7, P.cream, P.white, P.paperD); p.hline(6, 6, 4, O); p.hline(6, 8, 3, O); p.set(10, 9, P.red); }),
  project_board: (w, h) => { const p = mk(w, h, 12); const W = p.tw; p.rect(3, 10, 2, p.th + 2, P.woodDD); p.rect(W - 5, 10, 2, p.th + 2, P.woodDD); p.box(0, 0, W, 16, P.wood, P.woodL, P.woodD); p.box(2, 2, W - 4, 12, '#2f5f8f', '#4f8fc0', P.navy); p.frame(5, 4, 9, 7, P.white); p.vline(9, 4, 7, P.white); p.hline(16, 5, W - 21, P.white); p.hline(16, 8, W - 23, P.blueL); p.hline(16, 11, W - 25, P.blueL); return fin(p); }
};
export const STATES = { starter_stove: ['', 'cook', 'done', 'broken'], second_stove: ['', 'cook', 'done'], advanced_stove: ['', 'cook', 'done'], basic_oven: ['', 'cook', 'done'], kettle: ['', 'cook', 'done'], large_pan: ['', 'cook', 'done'], coffee_machine: ['', 'cook', 'done'], juicer: ['', 'cook', 'done'], workbench: ['', 'broken'], fireplace: ['', 'lit', 'lit2'], player_bed: ['', 'sleep'], old_chest: ['', 'open'], garden_bed: ['', 'tilled', 'wet'] };
const FLAT_TILE = new Set(['wood_floor', 'stone_floor', 'stone_path']);

// Tüm yerleştirilebilirler için dört yön + durum sprite'ları: { 'f/<id>/<rot>[/<state>]': Px }
export function buildFurniture(C) {
  const out = {}; const missing = [];
  for (const d of Object.values(C.placeables)) {
    if (FLAT_TILE.has(d.id)) continue; const fn = PAINT[d.id]; if (!fn) { missing.push(d.id); continue; }
    const rots = d.place === 'wall' ? [0] : [0, 1, 2, 3];
    for (const rot of rots) { const wc = rot % 2 ? d.h : d.w, hc = rot % 2 ? d.w : d.h; for (const st of STATES[d.id] || ['']) out[`f/${d.id}/${rot}${st ? '/' + st : ''}`] = fn(wc, hc, DIRS[rot], st); }
  }
  return { sprites: out, missing };
}
export function furnitureIcon(C, id, tileIcon) { if (FLAT_TILE.has(id)) return tileIcon(id); const d = C.placeables[id]; const fn = PAINT[id]; return fn ? fn(d.w, d.h, 'down', '').fit(16) : null; }
void itemIcon;
