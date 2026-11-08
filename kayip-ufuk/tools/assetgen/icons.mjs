// 179 distinct 32×32 item icons (+ shapes reused by codex & world pickups). Original pixel art, no emoji.
import { Pix, shade, hex, prng, strHash } from './raster.mjs';
import { P } from './palette.mjs';

const S = {
  log(p, o = {}) { const c = o.c || P.wood; p.poly([[5, 20], [22, 9], [27, 14], [10, 26]], c); p.ellipse(24.5, 11.5, 3.2, 3.2, shade(c, 0.35)); p.ellipse(24.5, 11.5, 1.6, 1.6, shade(c, 0.15)); p.line(8, 21, 22, 12, shade(c, -0.25)); if (o.dark) p.line(9, 24, 23, 15, shade(c, -0.4)); },
  plank(p, o = {}) { const c = o.c || P.wood_light; for (let i = 0; i < 3; i++) { p.rect(5, 9 + i * 6, 22, 5, shade(c, -i * 0.08)); p.rect(5, 9 + i * 6, 22, 1, shade(c, 0.25)); } if (o.treated) p.speckle(prng(9), 0.12, [shade(c, -0.35), '#5f7f4a']); p.set(8, 11, P.wood_dark); p.set(23, 17, P.wood_dark); },
  rope(p, o = {}) { const c = o.c || P.rope; const th = o.thick ? 3 : 2; for (let a = 0; a < Math.PI * 4.2; a += 0.12) { const r = 4 + a * 1.25; p.rect(16 + Math.cos(a) * r * 0.9 - th / 2, 17 + Math.sin(a) * r * 0.7 - th / 2, th, th, Math.floor(a * 3) % 2 ? c : shade(c, -0.2)); } },
  ingot(p, o = {}) { const c = o.c; p.poly([[6, 22], [10, 13], [24, 13], [27, 22]], c); p.poly([[10, 13], [24, 13], [22, 11], [12, 11]], shade(c, 0.35)); p.line(9, 15, 24, 15, shade(c, 0.5)); },
  ore(p, o = {}) { const r = prng(strHash(o.id || 'ore')); p.poly([[6, 24], [8, 13], [15, 8], [24, 10], [27, 20], [21, 26]], o.rock || P.stone_dark); for (let i = 0; i < 6; i++) p.ellipse(9 + r() * 15, 12 + r() * 11, 1.5 + r() * 1.5, 1.2 + r(), o.c); },
  stone(p, o = {}) { p.ellipse(16, 18, 10, 7.5, o.c || P.stone); p.ellipse(13, 15, 4, 2.5, shade(o.c || P.stone, 0.3)); if (o.small) { p.ellipse(25, 24, 3, 2.3, o.c || P.stone); } },
  pebbles(p, o = {}) { const r = prng(5); for (let i = 0; i < 6; i++) p.ellipse(8 + r() * 16, 12 + r() * 12, 2.6, 2, shade(o.c || P.stone, (r() - 0.5) * 0.4)); },
  crystal(p, o = {}) { const c = o.c; p.poly([[10, 26], [8, 14], [12, 6], [15, 14], [14, 26]], c); p.poly([[14, 26], [16, 10], [20, 4], [23, 12], [21, 26]], shade(c, 0.15)); p.poly([[20, 26], [22, 16], [26, 13], [26, 26]], shade(c, -0.15)); p.line(18, 9, 19, 20, shade(c, 0.6)); },
  powder(p, o = {}) { p.poly([[6, 25], [10, 17], [16, 13], [22, 17], [26, 25]], o.c); p.speckle(prng(4), 0.2, [shade(o.c, 0.3), shade(o.c, -0.25)]); },
  leaf(p, o = {}) { const c = o.c || P.palm; p.line(6, 26, 24, 7, shade(c, -0.35), 2); for (let i = 0; i < 9; i++) { const t = i / 9; const x = 7 + t * 16, y = 25 - t * 17; p.line(x, y, x - 7 + t * 3, y - 2 - t * 2, c, 2); p.line(x, y, x + 3, y + 6 - t * 2, shade(c, 0.12), 2); } },
  fiber(p, o = {}) { const c = o.c || '#b5c46a'; for (let i = 0; i < 9; i++) p.line(9 + i * 1.6, 27, 6 + i * 2.4, 5 + (i % 3) * 2, i % 2 ? c : shade(c, -0.2)); p.rect(8, 17, 17, 3, o.band || P.rope_dark); },
  stick(p, o = {}) { const c = o.c || P.wood; p.line(6, 26, 26, 6, c, 3); p.line(14, 18, 20, 21, c, 2); p.line(18, 14, 18, 9, c, 2); },
  bamboo(p) { for (let k = 0; k < 3; k++) { const x = 9 + k * 6; p.rect(x, 5 + k * 2, 4, 22 - k * 2, k === 1 ? '#9cc95a' : '#86b84a'); for (let y = 9 + k * 2; y < 27; y += 6) p.rect(x - 1, y, 6, 1, '#5e8a33'); } },
  reed(p) { for (let i = 0; i < 6; i++) { p.line(8 + i * 3, 27, 7 + i * 3.4, 6 + (i % 2) * 3, '#8aa35a', 1); p.ellipse(7 + i * 3.4, 7 + (i % 2) * 3, 1.2, 3, '#8a5a3a'); } },
  vine(p) { for (let a = 0; a < 7; a += 0.15) p.set(16 + Math.sin(a * 1.6) * 7, 4 + a * 3.3, '#4c8a3a'); for (let i = 0; i < 6; i++) p.ellipse(16 + Math.sin(i * 1.15 * 1.6) * 7 + 2, 6 + i * 3.6, 2.6, 1.8, P.leaf_light); },
  herb(p, o = {}) { const c = o.c || '#5fae6a'; p.line(16, 27, 16, 10, '#4a7a3a'); for (let i = 0; i < 4; i++) { p.ellipse(11, 12 + i * 4, 4, 2, c); p.ellipse(21, 10 + i * 4, 4, 2, shade(c, 0.15)); } if (o.flower) p.ellipse(16, 8, 2.5, 2.5, o.flower); },
  bark(p) { p.poly([[7, 8], [24, 6], [26, 25], [9, 27]], '#7a5a3e'); for (let i = 0; i < 5; i++) p.line(10 + i * 3.4, 8, 11 + i * 3.4, 26, '#4f3a28'); },
  resin(p) { p.ellipse(16, 18, 8, 8.5, '#e0952c'); p.ellipse(13, 14, 3, 3, '#ffd27a'); p.ellipse(19, 21, 2, 1.5, '#b06d1a'); p.poly([[14, 9], [18, 9], [16, 4]], '#e0952c'); },
  sap(p) { p.ellipse(16, 19, 8, 8, '#a8c75a'); p.ellipse(13, 16, 3, 3, '#e3f2a2'); p.poly([[14, 11], [18, 11], [16, 5]], '#a8c75a'); },
  drop(p, o) { p.poly([[16, 4], [25, 17], [16, 28], [7, 17]], o.c); p.ellipse(16, 19, 9, 9, o.c); p.ellipse(13, 16, 2.5, 3.5, shade(o.c, 0.45)); },
  bottle(p, o = {}) { p.rect(13, 4, 6, 6, o.cap || '#8a6a4a'); p.poly([[11, 10], [21, 10], [24, 15], [24, 27], [8, 27], [8, 15]], o.c || P.glass); p.rect(10, 18, 12, 6, o.fill || shade(o.c || P.glass, -0.2)); p.line(11, 13, 11, 25, shade(o.c || P.glass, 0.5)); },
  can(p) { p.rect(8, 8, 16, 18, '#a9b0b8'); p.rect(8, 8, 16, 2, '#d7dce1'); p.rect(8, 12, 16, 9, '#c5513a'); p.rect(8, 24, 16, 2, '#7b8188'); },
  cup(p) { p.rect(10, 7, 12, 19, '#9cc95a'); p.rect(10, 13, 12, 1, '#5e8a33'); p.rect(10, 20, 12, 1, '#5e8a33'); p.rect(11, 7, 10, 2, '#4f7a3a'); p.line(22, 12, 26, 14, P.rope, 2); p.line(26, 14, 22, 20, P.rope, 2); },
  gear(p, o = {}) { const c = o.c || P.iron; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; p.rect(16 + Math.cos(a) * 10 - 2, 16 + Math.sin(a) * 10 - 2, 4, 4, c); } p.circle(16, 16, 9, c); p.circle(16, 16, 3.2, 'CLEAR'); for (let y = 12; y < 21; y++) for (let x = 12; x < 21; x++) if (Math.hypot(x + 0.5 - 16, y + 0.5 - 16) < 3.2) p.clear(x, y); if (o.rust) p.speckle(prng(3), 0.25, [P.rust, '#7b3f22']); },
  coil(p, o = {}) { const c = o.c || P.copper; for (let i = 0; i < 6; i++) p.ellipse(16, 9 + i * 3, 9, 3, i % 2 ? c : shade(c, 0.25)); p.ellipse(16, 9, 4, 1.3, 'CLEAR'); p.line(23, 25, 28, 28, c, 2); },
  battery(p, o = {}) { p.rect(9, 7, 14, 21, o.c || '#3d5a7a'); p.rect(13, 4, 6, 3, '#b5bcc4'); p.rect(9, 15, 14, 5, o.band || P.yellow); p.rect(11, 9, 2, 4, '#e8eef4'); if (o.pack) { p.rect(5, 9, 22, 19, '#2f3e52'); p.rect(7, 11, 6, 15, '#3d5a7a'); p.rect(19, 11, 6, 15, '#3d5a7a'); p.rect(7, 16, 18, 4, P.yellow); } },
  fuse(p, o = {}) { p.rect(6, 13, 20, 7, o.c || P.glass); p.rect(4, 12, 4, 9, '#b5bcc4'); p.rect(24, 12, 4, 9, '#b5bcc4'); p.line(8, 16, 24, 16, o.wire || '#d9a441'); },
  cloth(p, o = {}) { const c = o.c || P.cloth; p.poly([[5, 9], [26, 7], [27, 24], [6, 26]], c); for (let y = 10; y < 25; y += 3) p.line(6, y, 26, y - 1, shade(c, -0.12)); p.poly([[19, 24], [27, 24], [27, 18]], shade(c, -0.25)); if (o.patch) p.rect(9, 12, 6, 5, o.patch); },
  sail(p) { p.line(9, 4, 9, 28, P.wood_dark, 2); p.poly([[11, 5], [26, 24], [11, 24]], P.canvas); p.line(12, 12, 21, 21, P.cloth_dark); p.line(8, 27, 27, 27, P.wood, 2); },
  hull(p, o = {}) { p.poly([[3, 14], [29, 14], [25, 25], [7, 25]], o.c || P.wood); for (let y = 16; y < 25; y += 3) p.line(5, y, 27, y, shade(o.c || P.wood, -0.3)); if (o.metal) { p.rect(6, 14, 2, 11, P.iron); p.rect(24, 14, 2, 11, P.iron); } },
  rudder(p) { p.line(16, 3, 16, 14, P.wood_dark, 3); p.poly([[11, 13], [22, 13], [24, 28], [12, 26]], P.wood); p.line(10, 6, 22, 6, P.wood_dark, 2); },
  anchor(p) { p.line(16, 5, 16, 26, P.iron_dark, 3); p.circle(16, 5, 3, P.iron); p.circle(16, 5, 1, 'CLEAR'); p.line(9, 10, 23, 10, P.iron_dark, 2); for (let a = 0; a <= Math.PI; a += 0.08) p.rect(16 + Math.cos(a) * 10 - 1, 22 + Math.sin(a) * 4 - 1, 3, 3, P.iron_dark); p.poly([[4, 21], [8, 18], [8, 24]], P.iron); p.poly([[28, 21], [24, 18], [24, 24]], P.iron); },
  chart(p, o = {}) { p.poly([[6, 7], [26, 6], [26, 26], [6, 27]], o.c || P.paper); p.rect(5, 6, 3, 22, shade(o.c || P.paper, -0.3)); p.rect(25, 5, 3, 22, shade(o.c || P.paper, -0.3)); for (const [x0, y0, x1, y1] of o.lines || [[9, 22, 23, 10]]) p.line(x0, y0, x1, y1, o.ink || P.ink); if (o.mark) p.ellipse(o.mark[0], o.mark[1], 2, 2, P.red); if (o.seal) p.circle(20, 22, 2.5, o.seal); },
  note(p, o = {}) { p.rect(7, 5, 18, 23, P.paper); for (let y = 9; y < 25; y += 3) p.line(9, y, 22, y, '#9aa4b8'); if (o.mark) p.rect(9, 18, 6, 4, o.mark); },
  core(p, o) { p.rect(8, 8, 16, 16, o.c); p.frame(8, 8, 16, 16, shade(o.c, -0.35)); p.rect(12, 12, 8, 8, o.glow); p.rect(14, 14, 4, 4, shade(o.glow, 0.5)); for (const [x, y] of [[9, 9], [22, 9], [9, 22], [22, 22]]) p.set(x, y, '#e1e6ea'); if (o.panel) { for (let i = 0; i < 3; i++) p.line(9, 11 + i * 5, 23, 11 + i * 5, '#2a4d8a'); } },
  module(p) { p.rect(5, 9, 22, 15, '#4a5560'); p.rect(7, 11, 10, 8, '#2b8a56'); p.rect(19, 11, 6, 3, P.red); p.rect(19, 15, 6, 3, P.yellow); p.line(5, 22, 27, 22, '#7d8a96'); p.line(20, 9, 26, 3, '#b5bcc4'); },
  antenna(p) { p.line(16, 4, 16, 27, P.iron, 2); p.line(9, 10, 23, 10, P.iron); p.line(11, 15, 21, 15, P.iron); p.line(13, 20, 19, 20, P.iron); p.circle(16, 4, 2, P.red); p.rect(11, 26, 10, 2, P.iron_dark); },
  booster(p) { p.rect(6, 12, 20, 12, '#5c6b7a'); p.ellipse(16, 10, 7, 4, P.quartz); p.line(10, 12, 22, 12, '#2a3540'); p.rect(9, 16, 4, 4, P.copper); p.rect(19, 16, 4, 4, P.copper); },
  generator(p) { p.rect(5, 11, 22, 15, '#c6532d'); p.rect(7, 13, 8, 11, '#3a3f45'); p.circle(21, 18, 4, P.iron); p.circle(21, 18, 1.5, P.iron_dark); p.rect(9, 7, 4, 4, P.iron_dark); p.line(5, 26, 27, 26, '#2a2d31', 2); },
  harness(p) { for (let i = 0; i < 4; i++) p.line(5, 9 + i * 4, 27, 13 + i * 4 - (i % 2) * 3, [P.red, P.blue, P.yellow, P.green][i], 2); p.rect(13, 8, 6, 20, '#3a3f45'); },
  drive(p) { p.circle(11, 16, 6, P.iron); p.circle(22, 16, 5, P.iron_dark); p.circle(11, 16, 2, P.iron_dark); p.circle(22, 16, 2, P.iron); p.line(11, 10, 22, 11, '#2a2d31'); p.line(11, 22, 22, 21, '#2a2d31'); },
  fastener(p) { for (let i = 0; i < 3; i++) { p.rect(7 + i * 7, 8, 5, 3, P.iron); p.rect(8 + i * 7, 11, 3, 14, P.iron_dark); p.set(9 + i * 7, 25, P.iron_dark); } },
  nail(p) { for (let i = 0; i < 4; i++) { p.line(7 + i * 5, 7 + i, 12 + i * 5, 26, '#8a8f98', 2); p.rect(5 + i * 5, 6 + i, 5, 2, '#b5bcc4'); } },
  scrap(p) { p.poly([[5, 20], [12, 9], [19, 12], [27, 7], [25, 22], [14, 26]], P.iron); p.speckle(prng(7), 0.3, [P.rust, '#7b3f22', P.iron_dark]); },
  bearing(p, o = {}) { p.circle(16, 16, 10, o.c || P.iron); p.circle(16, 16, 6, '#5c6068'); p.circle(16, 16, 3.5, 'CLEAR'); for (let y = 12; y < 21; y++) for (let x = 12; x < 21; x++) if (Math.hypot(x + 0.5 - 16, y + 0.5 - 16) < 3.5) p.clear(x, y); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; p.set(16 + Math.cos(a) * 8, 16 + Math.sin(a) * 8, '#e1e6ea'); } if (o.rust) p.speckle(prng(2), 0.2, [P.rust]); },
  glass(p) { p.poly([[7, 22], [12, 8], [20, 6], [26, 17], [18, 26]], P.glass); p.line(12, 11, 16, 20, '#e8fbff'); p.line(18, 9, 22, 16, '#e8fbff'); },
  plastic(p) { p.poly([[6, 14], [16, 7], [26, 12], [22, 25], [9, 24]], '#5ab0d6'); p.rect(12, 13, 8, 5, '#9bd6ef'); },
  brick(p) { p.rect(5, 11, 22, 12, P.clay); p.rect(5, 11, 22, 2, P.clay_light); p.line(5, 17, 26, 17, '#8a4f35'); p.line(16, 11, 16, 17, '#8a4f35'); p.line(10, 17, 10, 23, '#8a4f35'); p.line(22, 17, 22, 23, '#8a4f35'); },
  charcoal(p) { const r = prng(11); for (let i = 0; i < 5; i++) p.poly([[7 + i * 4, 24], [9 + i * 4, 12 + r() * 4], [13 + i * 4, 15], [12 + i * 4, 25]], i % 2 ? P.coal : '#3d3f46'); p.set(12, 15, '#e86f2a'); },
  compost(p) { p.poly([[5, 25], [9, 16], [16, 12], [24, 16], [27, 25]], '#5a4430'); p.speckle(prng(6), 0.3, ['#6e8a3a', '#3e2f22', '#8a6a3a']); },
  bait(p, o) { p.ellipse(16, 19, 9, 7, o.c); p.speckle(prng(strHash(o.id || 'b')), 0.3, [shade(o.c, 0.3), shade(o.c, -0.3), o.fleck || '#e6d26a']); p.line(16, 6, 16, 12, '#7a8088'); p.poly([[14, 5], [18, 5], [16, 3]], '#9aa0a8'); },
  hook(p, o = {}) { const c = o.c || '#b5bcc4'; p.line(16, 4, 16, 21, c, 2); for (let a = 0; a <= Math.PI; a += 0.1) p.rect(11 + Math.cos(a) * 5, 21 + Math.sin(a) * 5, 2, 2, c); p.poly([[6, 20], [8, 16], [9, 21]], c); p.circle(16, 4, 2, c); },
  arrow(p) { p.line(5, 27, 25, 7, P.wood_light, 2); p.poly([[25, 7], [21, 7], [25, 3]], '#5d6168'); p.poly([[25, 7], [25, 11], [29, 7]], '#5d6168'); p.line(5, 27, 9, 23, '#e2e2e2', 2); p.line(7, 27, 5, 25, P.red); },
  slingstone(p) { p.circle(11, 18, 4, P.stone); p.circle(20, 14, 4, P.stone_light); p.circle(18, 23, 3.5, P.stone_dark); },
  bandage(p, o = {}) { p.rect(6, 12, 20, 10, o.c || P.white); p.rect(14, 12, 4, 10, o.cross || P.red); p.rect(11, 15, 10, 4, o.cross || P.red); if (o.roll) p.ellipse(25, 22, 4, 4, P.white); },
  vial(p, o) { p.rect(13, 4, 6, 4, '#8a6a4a'); p.rect(12, 8, 8, 4, '#d8e9ee'); p.ellipse(16, 20, 8, 8, '#d8e9ee'); p.ellipse(16, 21, 6.5, 6, o.c); p.ellipse(13, 17, 1.5, 2.5, '#ffffff'); },
  // food
  coconut(p) { p.circle(15, 18, 9, '#7b4f2c'); p.circle(12, 14, 3, '#9a6a3e'); p.circle(23, 11, 4, '#7ec057'); p.line(18, 10, 24, 6, '#4a8a3a', 2); p.set(13, 19, '#3e2a18'); p.set(16, 20, '#3e2a18'); },
  banana(p, o = {}) { for (let k = 0; k < (o.bunch ? 3 : 1); k++) { for (let a = 0.2; a < 2.6; a += 0.06) p.rect(17 + Math.cos(a + Math.PI) * 11 + k * 2, 7 + Math.sin(a) * 15 + k * 2, 4, 4, k === 1 ? '#f4d54e' : '#e8c43c'); } p.rect(26, 7, 3, 3, '#6a5a2a'); },
  berry(p, o = {}) { const r = prng(8); p.line(16, 4, 16, 10, '#4a7a3a'); p.ellipse(20, 7, 4, 2, P.leaf); for (let i = 0; i < 8; i++) p.circle(10 + r() * 12, 12 + r() * 13, 3, i % 3 ? o.c || '#b63a6a' : shade(o.c || '#b63a6a', 0.3)); },
  mushroom(p) { p.rect(13, 16, 6, 11, '#efe4c4'); p.ellipse(16, 14, 11, 7, '#c8643c'); p.rect(5, 14, 22, 3, 'CLEAR'); for (let x = 5; x < 28; x++) for (let y = 15; y < 21; y++) if (p.get(x, y)[3] && y >= 15 && !(x >= 13 && x < 19)) p.clear(x, y); p.circle(12, 11, 1.5, '#f5ead0'); p.circle(19, 9, 1.5, '#f5ead0'); },
  fish(p, o = {}) { const c = o.c || P.fish; p.ellipse(15, 16, 10, 6, c); p.poly([[24, 16], [30, 10], [30, 22]], shade(c, -0.15)); p.ellipse(15, 18, 8, 3, shade(c, 0.3)); p.circle(9, 15, 1.3, P.black); if (o.cooked) p.map(([r, g, b, a]) => [Math.round(r * 0.75 + 40), Math.round(g * 0.55 + 20), Math.round(b * 0.35), a]); if (o.grill) for (let i = 0; i < 3; i++) p.line(10 + i * 5, 11, 13 + i * 5, 21, '#3e2414'); },
  fishPortion(p, o = {}) { p.poly([[6, 20], [14, 11], [27, 13], [24, 23], [10, 25]], o.c || '#e8a090'); p.line(9, 21, 24, 15, '#f6c8bc'); p.line(11, 23, 25, 18, '#f6c8bc'); },
  meat(p, o = {}) { const c = o.cooked ? P.meat_cooked : P.meat; p.ellipse(15, 17, 10, 8, c); p.ellipse(13, 15, 4, 3, shade(c, 0.25)); p.line(22, 22, 28, 27, '#eee2c8', 3); p.circle(28, 27, 2, '#f5ead0'); if (o.dried) p.speckle(prng(4), 0.25, ['#5a2e18', '#b07a4a']); if (o.crab) { p.clear(0, 0); } },
  crab(p, o = {}) { const c = o.c || '#d65a3a'; p.ellipse(16, 18, 9, 6, c); p.circle(8, 10, 3, c); p.circle(24, 10, 3, c); p.line(9, 13, 12, 16, c, 2); p.line(23, 13, 20, 16, c, 2); for (let i = 0; i < 3; i++) { p.line(8, 18 + i * 2, 4, 21 + i * 2, c); p.line(24, 18 + i * 2, 28, 21 + i * 2, c); } p.set(13, 15, P.black); p.set(19, 15, P.black); if (o.meat) { p.ellipse(16, 19, 5, 3, '#f3dfc8'); } },
  bowl(p, o) { p.ellipse(16, 15, 11, 4, o.c); p.speckle(prng(strHash(o.id)), 0.35, o.bits); p.poly([[5, 15], [27, 15], [23, 25], [9, 25]], o.bowl || '#9a6a3e'); p.line(7, 17, 25, 17, shade(o.bowl || '#9a6a3e', 0.3)); if (o.steam) { p.line(12, 9, 13, 5, '#ffffff99'); p.line(19, 9, 20, 4, '#ffffff99'); } },
  mug(p, o) { p.rect(8, 10, 14, 16, o.mugc || '#e9e1c8'); p.rect(9, 11, 12, 3, o.c); p.line(22, 13, 26, 15, o.mugc || '#e9e1c8', 2); p.line(26, 15, 22, 21, o.mugc || '#e9e1c8', 2); p.line(12, 7, 13, 3, '#ffffff99'); p.line(17, 7, 18, 3, '#ffffff99'); if (o.leaf) p.ellipse(15, 12, 3, 1.3, P.leaf); },
  platter(p, o) { p.ellipse(16, 21, 13, 5, '#e9e1c8'); p.ellipse(16, 20, 10, 3.6, '#d8cdb2'); o.items.forEach(([fn, ox, oy, c], i) => { const sub = new Pix(32, 32); S[fn](sub, { c, id: String(i) }); p.blit(scaleDown(sub, 0.55), ox, oy); }); },
  ration(p) { p.rect(6, 10, 20, 15, P.cloth_dark); p.rect(6, 15, 20, 3, P.rope_dark); p.rect(14, 10, 4, 15, P.rope_dark); p.poly([[6, 10], [16, 5], [26, 10]], P.cloth); },
  // crop harvest
  root(p, o) { p.poly([[10, 12], [22, 12], [17, 28], [15, 28]], o.c); p.line(13, 16, 19, 16, shade(o.c, -0.25)); p.line(14, 21, 18, 21, shade(o.c, -0.25)); for (let i = 0; i < 3; i++) p.line(16, 12, 10 + i * 6, 3, P.leaf, 2); },
  greens(p, o = {}) { for (let i = 0; i < 6; i++) p.ellipse(10 + (i % 3) * 6, 14 + Math.floor(i / 3) * 7, 5, 6, i % 2 ? (o.c || '#5fb84a') : shade(o.c || '#5fb84a', 0.2)); p.line(16, 27, 16, 14, '#3e7a2c'); },
  beans(p) { for (let i = 0; i < 3; i++) { p.ellipse(10 + i * 6, 16 + (i % 2) * 3, 3, 8, '#7fb34a'); for (let k = 0; k < 3; k++) p.set(10 + i * 6, 11 + (i % 2) * 3 + k * 4, '#b9dc7a'); } },
  pepper(p, o = {}) { p.poly([[9, 10], [22, 9], [20, 24], [15, 28], [11, 22]], o.c || P.red); p.ellipse(13, 13, 2, 3, shade(o.c || P.red, 0.4)); p.rect(14, 5, 3, 5, '#3e7a2c'); },
  pumpkin(p) { p.ellipse(16, 18, 12, 9, P.orange); for (let i = -2; i <= 2; i++) p.line(16 + i * 4, 10, 16 + i * 5, 26, '#c26a22'); p.rect(15, 6, 3, 5, '#5a6a2a'); p.ellipse(21, 8, 4, 2, P.leaf); },
  pineapple(p) { p.ellipse(16, 20, 8, 9, '#e0a83a'); for (let i = 0; i < 5; i++) { p.line(9, 14 + i * 3, 23, 18 + i * 3, '#9a6a2a'); p.line(23, 14 + i * 3, 9, 18 + i * 3, '#9a6a2a'); } for (let i = 0; i < 5; i++) p.line(16, 11, 10 + i * 3, 2, P.palm, 2); },
  cane(p) { for (let k = 0; k < 3; k++) { p.rect(9 + k * 6, 4, 4, 24, k === 1 ? '#a89a5a' : '#c0b46a'); for (let y = 8; y < 28; y += 5) p.rect(8 + k * 6, y, 6, 1, '#7a6a3a'); } p.ellipse(22, 5, 6, 2, P.leaf); },
  sweetpotato(p) { p.ellipse(16, 18, 11, 7, '#b65a6a'); p.ellipse(12, 15, 4, 2, '#d88a96'); p.speckle(prng(3), 0.08, ['#7a3a4a']); p.line(26, 18, 29, 15, '#8a4a3a'); },
  spice(p) { p.line(16, 27, 16, 6, '#5a7a2a', 2); for (let i = 0; i < 5; i++) p.ellipse(16 + (i % 2 ? 4 : -4), 8 + i * 4, 4, 2, '#8aa83a'); for (let i = 0; i < 4; i++) p.circle(12 + i * 3, 5, 1.4, '#c83a2a'); },
  seedpouch(p, o) { p.poly([[8, 12], [24, 12], [26, 27], [6, 27]], P.cloth); p.poly([[10, 12], [22, 12], [19, 7], [13, 7]], P.cloth_dark); p.rect(9, 11, 14, 2, P.rope_dark); const sub = new Pix(32, 32); S[o.crop](sub, o.cropOpt || {}); sub.outline(P.outline); p.blit(scaleDown(sub, 0.42), 10, 13); },
  // tools
  axe(p, o) { p.line(9, 27, 21, 7, P.wood, 2); p.line(10, 27, 22, 7, P.wood_dark); p.poly([[17, 4], [27, 6], [26, 15], [19, 11]], o.head); p.line(26, 6, 25, 14, shade(o.head, 0.5)); if (o.lashing) p.rect(17, 9, 4, 3, P.rope); },
  pick(p, o) { p.line(16, 28, 16, 8, P.wood, 2); for (let a = -1; a <= 1; a += 0.05) p.rect(16 + a * 11 - 1, 8 - (1 - a * a) * 3, 3, 3, o.head); p.poly([[3, 10], [6, 8], [6, 12]], shade(o.head, 0.3)); p.poly([[29, 10], [26, 8], [26, 12]], shade(o.head, 0.3)); if (o.lashing) p.rect(15, 8, 3, 3, P.rope); },
  spear(p, o) { p.line(6, 28, 24, 8, P.wood, 2); p.poly([[24, 8], [21, 6], [29, 2], [26, 10]], o.head); if (o.lashing) p.rect(21, 9, 3, 3, P.rope); },
  bow(p, o) { for (let a = -1.2; a <= 1.2; a += 0.04) p.rect(10 + Math.cos(a) * 12 - 1, 16 + Math.sin(a) * 12 - 1, 2.4, 2.4, o.c); p.line(14, 5, 14, 27, '#e9e1c8'); if (o.grip) p.rect(20, 14, 3, 5, o.grip); },
  rod(p, o) { p.line(5, 28, 26, 4, o.c || '#9cc95a', 2); p.line(26, 4, 27, 20, '#e9e1c8'); p.circle(9, 23, 3, o.reel || '#7a8088'); p.poly([[25, 20], [29, 20], [27, 24]], '#b5bcc4'); if (o.adv) p.line(14, 17, 19, 12, P.copper, 2); },
  knife(p) { p.line(8, 26, 14, 20, P.wood_dark, 3); p.poly([[13, 21], [26, 6], [24, 12], [15, 23]], P.stone_light); },
  machete(p) { p.line(7, 27, 12, 22, P.leather, 3); p.poly([[11, 22], [26, 6], [28, 8], [16, 24]], '#c9cfd6'); p.line(13, 21, 26, 8, '#eef2f5'); },
  shovel(p) { p.line(9, 4, 19, 20, P.wood, 2); p.poly([[17, 18], [24, 16], [28, 25], [21, 29]], P.iron); p.line(7, 4, 11, 3, P.wood_dark, 2); },
  torch(p, o = {}) { p.line(11, 28, 19, 12, P.wood, 3); p.rect(17, 10, 5, 4, o.wrap || P.rope_dark); p.ellipse(21, 8, 4, 5, '#f7b560'); p.ellipse(21, 9, 2, 3, '#fff2b0'); p.set(23, 3, '#ec8f3a'); },
  lamp(p) { p.rect(11, 9, 10, 15, '#2f3e52'); p.rect(13, 11, 6, 9, '#ffe48a'); p.rect(14, 5, 4, 4, P.iron); p.rect(10, 24, 12, 3, P.iron_dark); p.line(12, 5, 20, 5, P.iron); },
  compass(p) { p.circle(16, 16, 11, P.copper); p.circle(16, 16, 9, P.paper); p.poly([[16, 8], [18, 16], [16, 24], [14, 16]], P.red); p.poly([[16, 16], [18, 16], [16, 24], [14, 16]], '#3b4a6b'); p.circle(16, 16, 1, P.black); },
  navkit(p) { p.rect(5, 9, 22, 17, P.leather); p.rect(5, 9, 22, 3, P.leather_dark); const sub = new Pix(32, 32); S.compass(sub); p.blit(scaleDown(sub, 0.5), 7, 13); p.poly([[19, 14], [26, 13], [26, 23], [19, 24]], P.paper); p.line(20, 20, 25, 15, P.ink); },
  repairkit(p) { p.rect(5, 12, 22, 14, '#c6532d'); p.rect(5, 12, 22, 3, '#e07a4a'); p.rect(13, 9, 6, 3, P.iron_dark); p.line(9, 18, 15, 22, P.iron, 2); p.line(18, 22, 24, 17, '#e1e6ea', 2); },
  crowbar(p) { p.line(8, 27, 24, 7, P.red_dark, 3); for (let a = 0; a < Math.PI; a += 0.15) p.rect(24 + Math.cos(a - 1) * 3, 7 - Math.sin(a - 1) * 3, 2, 2, P.red_dark); p.poly([[6, 27], [9, 29], [4, 30]], P.iron); },
  wateringcan(p) { p.rect(7, 13, 14, 13, '#5f9a8a'); p.line(20, 20, 28, 12, '#5f9a8a', 3); p.rect(26, 10, 4, 3, '#4a7a6a'); p.line(9, 13, 9, 7, P.wood, 2); p.line(9, 7, 17, 7, P.wood, 2); p.line(17, 7, 17, 13, P.wood, 2); },
  sling(p) { p.line(6, 6, 14, 18, P.leather, 2); p.line(26, 6, 18, 18, P.leather, 2); p.ellipse(16, 20, 5, 3, P.leather_dark); p.circle(16, 19, 2, P.stone); },
  mask(p, o = {}) { p.ellipse(16, 15, 11, 7, o.c || '#2f3e52'); p.ellipse(11, 15, 4, 4, P.glass); p.ellipse(21, 15, 4, 4, P.glass); p.line(4, 15, 2, 22, '#2f3e52', 2); if (o.tube) { p.line(27, 9, 27, 23, '#ec8f3a', 2); p.rect(25, 7, 5, 3, '#2f3e52'); } },
  climbkit(p) { p.line(6, 6, 6, 26, P.rope, 2); for (let y = 8; y < 26; y += 4) p.line(6, y, 12, y + 2, P.rope_dark); p.circle(20, 10, 5, P.iron); p.circle(20, 10, 3, 'CLEAR'); for (let y = 7; y < 14; y++) for (let x = 17; x < 24; x++) if (Math.hypot(x + 0.5 - 20, y + 0.5 - 10) < 3) p.clear(x, y); p.poly([[17, 18], [27, 18], [25, 27], [19, 27]], P.leather); },
  // equipment
  bag(p, o) { p.poly([[7, 11], [25, 11], [27, 27], [5, 27]], o.c); p.poly([[9, 11], [23, 11], [21, 6], [11, 6]], shade(o.c, -0.2)); p.rect(12, 15, 8, 6, shade(o.c, -0.25)); p.rect(15, 17, 2, 2, o.buckle || P.gold); if (o.straps) { p.line(9, 12, 9, 26, shade(o.c, -0.35)); p.line(23, 12, 23, 26, shade(o.c, -0.35)); } if (o.compass) p.circle(23, 22, 3, P.copper); },
  hat(p, o) { p.ellipse(16, 20, 14, 4.5, o.c); p.ellipse(16, 15, 8, 7, shade(o.c, 0.1)); p.rect(8, 16, 16, 2, o.band || shade(o.c, -0.3)); if (o.leaf) for (let i = 0; i < 5; i++) p.line(5 + i * 5, 20, 7 + i * 5, 23, P.leaf_dark); },
  boots(p, o = {}) { p.rect(6, 8, 7, 14, o.c || P.leather); p.rect(6, 20, 11, 6, o.c || P.leather); p.rect(18, 8, 7, 14, shade(o.c || P.leather, -0.1)); p.rect(18, 20, 11, 6, shade(o.c || P.leather, -0.1)); p.rect(6, 25, 11, 2, P.leather_dark); p.rect(18, 25, 11, 2, P.leather_dark); },
  sandals(p) { p.ellipse(10, 18, 5, 10, P.palm); p.ellipse(22, 18, 5, 10, shade(P.palm, -0.1)); p.line(6, 13, 14, 15, P.rope); p.line(18, 13, 26, 15, P.rope); },
  vest(p, o = {}) { p.poly([[7, 7], [13, 9], [16, 14], [19, 9], [25, 7], [27, 27], [5, 27]], o.c || P.leather); p.line(16, 14, 16, 27, shade(o.c || P.leather, -0.35)); p.rect(18, 18, 5, 4, shade(o.c || P.leather, -0.2)); },
  coat(p) { p.poly([[8, 6], [24, 6], [28, 28], [4, 28]], '#e8c43c'); p.poly([[11, 6], [21, 6], [16, 12]], '#c99f22'); p.line(16, 12, 16, 28, '#a07a12'); p.rect(4, 12, 4, 14, '#e8c43c'); p.rect(24, 12, 4, 14, '#e8c43c'); },
  water(p, o) { p.rect(10, 4, 12, 4, P.wood); p.poly([[9, 8], [23, 8], [26, 27], [6, 27]], '#c9b590'); p.rect(8, 14, 16, 11, o.c); p.ellipse(16, 14, 8, 1.6, shade(o.c, 0.4)); if (o.dirty) p.speckle(prng(6), 0.15, ['#5a6a3a', '#6e5a3a']); },
};

export function scaleDown(src, f) {
  const w = Math.max(1, Math.round(src.w * f)), h = Math.max(1, Math.round(src.h * f));
  const out = new Pix(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = src.get(Math.floor(x / f), Math.floor(y / f)); if (c[3]) out.set(x, y, c); }
  return out;
}

// ---- ItemDB id → painter mapping (179) ----
const I = {
  CMP_ADV_BAIT: ['bait', { c: '#c06a8a', fleck: '#f2d054' }], CMP_ANTENNA: ['antenna'], CMP_ARROW: ['arrow'], CMP_BATTERY_PACK: ['battery', { pack: true }],
  CMP_BEARING: ['bearing'], CMP_BRICK: ['brick'], CMP_CABLE_HARNESS: ['harness'], CMP_CHARCOAL: ['charcoal'], CMP_CLOTH: ['cloth'], CMP_COMPOST: ['compost'],
  CMP_COPPER_INGOT: ['ingot', { c: P.copper }], CMP_COPPER_WIRE: ['coil', { c: P.copper }], CMP_FISH_BAIT: ['bait', { c: '#e0a08a', fleck: '#ffffff' }], CMP_FISH_HOOK: ['hook'],
  CMP_FUSE: ['fuse'], CMP_GEAR: ['gear'], CMP_GENERATOR: ['generator'], CMP_HULL_REINFORCED: ['hull', { c: '#5a4a3a', metal: true }], CMP_HULL_SEGMENT: ['hull'],
  CMP_IRON_INGOT: ['ingot', { c: P.iron }], CMP_LEATHER: ['cloth', { c: P.leather }], CMP_MECH_DRIVE: ['drive'], CMP_METAL_FASTENER: ['fastener'],
  CMP_NAV_CHART: ['chart', { c: '#e8d9a8', lines: [[9, 22, 15, 12], [15, 12, 23, 16]], mark: [23, 16], seal: P.blue }], CMP_PLANK: ['plank'], CMP_ROPE: ['rope'], CMP_RUDDER: ['rudder'],
  CMP_SAIL: ['sail'], CMP_SIGNAL_BOOSTER: ['booster'], CMP_SIMPLE_BAIT: ['bait', { c: '#a8765a', fleck: '#d65a8a' }], CMP_SLING_STONE: ['slingstone'], CMP_STORM_ANCHOR: ['anchor'],
  CMP_THICK_ROPE: ['rope', { thick: true, c: '#b08a4f' }], CMP_TREATED_PLANK: ['plank', { c: '#8a6a3a', treated: true }],
  CON_ADV_BANDAGE: ['bandage', { cross: P.green, roll: true }], CON_ANTIDOTE: ['vial', { c: '#5ac06a' }], CON_BANDAGE: ['bandage'],
  CROP_BANANA: ['banana', { bunch: true }], CROP_BEAN: ['beans'], CROP_CANE: ['cane'], CROP_FIBER: ['fiber', { c: '#d6d07a', band: P.leaf_dark }], CROP_GREENS: ['greens'],
  CROP_HERB: ['herb', { c: '#4aa87a', flower: '#e9e1c8' }], CROP_PEPPER: ['pepper'], CROP_PINEAPPLE: ['pineapple'], CROP_PUMPKIN: ['pumpkin'], CROP_ROOT: ['root', { c: '#c9883a' }],
  CROP_SPICE: ['spice'], CROP_SWEET_POTATO: ['sweetpotato'],
  EQ_BAG_LARGE: ['bag', { c: P.leather, straps: true }], EQ_BAG_SMALL: ['bag', { c: P.cloth_dark }], EQ_EXPLORER_BAG: ['bag', { c: '#3d7454', straps: true, compass: true }],
  EQ_LEAF_HAT: ['hat', { c: P.palm, leaf: true, band: P.rope }], EQ_LEATHER_BOOTS: ['boots'], EQ_LEATHER_HAT: ['hat', { c: P.leather, band: P.rope_dark }],
  EQ_LEATHER_VEST: ['vest'], EQ_RAINCOAT: ['coat'], EQ_SANDALS: ['sandals'],
  FOOD_BANANA: ['banana'], FOOD_BEAN_STEW: ['bowl', { c: '#8a5a2a', bits: ['#7fb34a', '#c9883a'], steam: true }], FOOD_BERRY: ['berry'], FOOD_COCONUT: ['coconut'],
  FOOD_COOKED_FISH: ['fish', { c: '#d0a070', cooked: true, grill: true }], FOOD_COOKED_MEAT: ['meat', { cooked: true }], FOOD_DRIED_FISH: ['fish', { c: '#b89a6a', cooked: true }],
  FOOD_DRIED_MEAT: ['meat', { cooked: true, dried: true }], FOOD_FEAST: ['platter', { items: [['fish', 2, 6, '#d0a070'], ['meat', 14, 6], ['pumpkin', 8, 12], ['spice', 18, 12]] }],
  FOOD_FISH_SOUP: ['bowl', { c: '#d9c08a', bits: ['#f6c8bc', '#c9883a'], steam: true }], FOOD_FRUIT_SALAD: ['bowl', { c: '#f2d054', bits: ['#b63a6a', '#e8c43c', '#ffffff'], bowl: '#e9e1c8' }],
  FOOD_GRILLED_CRAB: ['crab', { c: '#e8743a' }], FOOD_HERBAL_TEA: ['mug', { c: '#7ab04a', leaf: true }], FOOD_MUSHROOM: ['mushroom'],
  FOOD_PINEAPPLE_SNACK: ['platter', { items: [['pineapple', 4, 2], ['coconut', 15, 8]] }], FOOD_RATION: ['ration'], FOOD_ROAST_ROOT: ['root', { c: '#8e5a2a' }],
  FOOD_SPICED_FISH: ['fish', { c: '#c8643c', cooked: true, grill: true }], FOOD_VEG_STEW: ['bowl', { c: '#6a8a3a', bits: ['#c9883a', '#5fb84a'], steam: true }], FOOD_WARM_TEA: ['mug', { c: '#c8643c', mugc: '#d69472' }],
  MAT_BAMBOO: ['bamboo'], MAT_BONE: ['stick', { c: '#efe8d4' }], MAT_BRANCH: ['stick'], MAT_CLAY: ['powder', { c: P.clay }], MAT_COAL: ['ore', { c: '#1a1b20', rock: '#3d3f46', id: 'coal' }],
  MAT_COPPER_ORE: ['ore', { c: P.copper_light, id: 'cu' }], MAT_CRAB_MEAT: ['crab', { c: '#d65a3a', meat: true }], MAT_FAT: ['drop', { c: '#f2e6b8' }], MAT_FEATHER: ['leaf', { c: '#e9e1c8' }],
  MAT_FIBER: ['fiber'], MAT_FISH_OFFCUT: ['fishPortion', { c: '#c88a7a' }], MAT_FLINT: ['crystal', { c: '#4a4f5a' }], MAT_HARDWOOD: ['log', { c: '#4a3424', dark: true }],
  MAT_IRON_ORE: ['ore', { c: P.rust, id: 'fe' }], MAT_LOG: ['log'], MAT_MED_HERB: ['herb'], MAT_ORGANIC_WASTE: ['compost'], MAT_PALM_LEAF: ['leaf'], MAT_PEBBLE: ['pebbles'],
  MAT_QUARTZ: ['crystal', { c: P.quartz }], MAT_RAW_FISH: ['fishPortion'], MAT_RAW_HIDE: ['cloth', { c: '#a87a52', patch: '#7a5232' }], MAT_RAW_MEAT: ['meat'], MAT_REED: ['reed'],
  MAT_RESIN: ['resin'], MAT_SALT: ['powder', { c: '#f5f3ea' }], MAT_SAND: ['powder', { c: P.sand }], MAT_SAP: ['sap'], MAT_SEASHELL: ['crystal', { c: '#f0c8b0' }],
  MAT_SEAWEED: ['vine'], MAT_SEA_SALT: ['powder', { c: '#d8eef2' }], MAT_SHELL: ['stone', { c: '#c8a88a', small: true }], MAT_SPICE_HERB: ['herb', { c: '#8aa83a', flower: '#c83a2a' }],
  MAT_STONE: ['stone'], MAT_SULFUR: ['powder', { c: '#e8d43a' }], MAT_TENDON: ['rope', { c: '#e6c8b0' }], MAT_TREE_BARK: ['bark'], MAT_VINE: ['vine'], MAT_WORM: ['vine'],
  SAL_BATTERY: ['battery'], SAL_BEARING: ['bearing', { rust: true }], SAL_BOTTLE: ['bottle', { fill: 'CLEAR' }], SAL_CANVAS: ['cloth', { c: P.canvas, patch: '#b8a57a' }],
  SAL_CLOTH: ['cloth', { c: '#8aa8c8', patch: '#d8cdb2' }], SAL_FUSE: ['fuse', { c: '#e8d9a8' }], SAL_GEAR: ['gear', { rust: true }], SAL_GLASS: ['glass'], SAL_NAIL: ['nail'],
  SAL_PLASTIC: ['plastic'], SAL_ROPE: ['rope', { c: '#8aa0a8' }], SAL_SCRAP: ['scrap'], SAL_TIN_CAN: ['can'], SAL_WIRE: ['coil', { c: '#b8744a' }],
  SPC_CHART_CAPTAIN: ['chart', { c: '#e2cfa0', lines: [[8, 12, 24, 12], [8, 18, 20, 22]], mark: [12, 15], seal: P.red_dark }],
  SPC_CHART_COAST: ['chart', { c: '#d8eef2', lines: [[8, 24, 16, 8], [16, 8, 24, 20]], ink: P.blue }],
  SPC_CHART_OBSERVATORY: ['chart', { c: P.paper, lines: [[16, 9, 9, 23], [16, 9, 24, 21], [9, 23, 24, 21]], mark: [16, 9], seal: P.gold }],
  SPC_GEN_CORE: ['core', { c: '#5c6b7a', glow: '#ec8f3a' }], SPC_RADIO_NOTE: ['note', { mark: P.red }], SPC_SOLAR_CORE: ['core', { c: '#2a4d8a', glow: '#f2d054', panel: true }], SPC_TX_MODULE: ['module'],
  TOOL_BAMBOO_CUP: ['cup'], TOOL_BOW: ['bow', { c: '#9cc95a' }], TOOL_CLIMB_KIT: ['climbkit'], TOOL_COMPASS: ['compass'],
  TOOL_COPPER_AXE: ['axe', { head: P.copper }], TOOL_COPPER_PICK: ['pick', { head: P.copper }], TOOL_CROWBAR: ['crowbar'], TOOL_DIVING_KIT: ['mask', { tube: true }], TOOL_DIVING_MASK: ['mask'],
  TOOL_FISH_ROD: ['rod'], TOOL_FISH_ROD_ADV: ['rod', { c: '#6c5340', reel: P.copper, adv: true }], TOOL_HUNTER_BOW: ['bow', { c: '#5a3a24', grip: P.leather }],
  TOOL_IRON_AXE: ['axe', { head: '#b8bec6' }], TOOL_IRON_PICK: ['pick', { head: '#b8bec6' }], TOOL_IRON_SPEAR: ['spear', { head: '#c9cfd6' }], TOOL_MACHETE: ['machete'], TOOL_NAV_KIT: ['navkit'],
  TOOL_PORTABLE_LAMP: ['lamp'], TOOL_REPAIR_KIT: ['repairkit'], TOOL_SHOVEL: ['shovel'], TOOL_SLING: ['sling'], TOOL_STONE_AXE: ['axe', { head: P.stone, lashing: true }],
  TOOL_STONE_KNIFE: ['knife'], TOOL_STONE_PICK: ['pick', { head: P.stone, lashing: true }], TOOL_TORCH: ['torch'], TOOL_WATERING_CAN: ['wateringcan'], TOOL_WOOD_SPEAR: ['spear', { head: P.stone, lashing: true }],
  WATER_CLEAN: ['water', { c: P.water_clean }], WATER_DIRTY: ['water', { c: P.water_dirty, dirty: true }],
  SEED_BANANA: ['seedpouch', { crop: 'banana' }], SEED_BEAN: ['seedpouch', { crop: 'beans' }], SEED_CANE: ['seedpouch', { crop: 'cane' }], SEED_FIBER: ['seedpouch', { crop: 'fiber', cropOpt: { c: '#d6d07a' } }],
  SEED_GREENS: ['seedpouch', { crop: 'greens' }], SEED_HERB: ['seedpouch', { crop: 'herb', cropOpt: { c: '#4aa87a' } }], SEED_PEPPER: ['seedpouch', { crop: 'pepper' }],
  SEED_PINEAPPLE: ['seedpouch', { crop: 'pineapple' }], SEED_PUMPKIN: ['seedpouch', { crop: 'pumpkin' }], SEED_ROOT: ['seedpouch', { crop: 'root', cropOpt: { c: '#c9883a' } }],
  SEED_SPICE: ['seedpouch', { crop: 'spice' }], SEED_SWEET_POTATO: ['seedpouch', { crop: 'sweetpotato' }],
};
// distinguish the few items that share a painter family with extra marks
const MARK = { MAT_WORM: '#d68a8a', MAT_SEAWEED: '#3f8a6a', MAT_ORGANIC_WASTE: '#8a6a3a' };

export function drawItemIcon(id) {
  const p = new Pix(32, 32);
  const spec = I[id];
  if (!spec) throw new Error('No icon painter for ' + id);
  const [fn, opt = {}] = spec;
  if (id === 'MAT_WORM') { for (let k = 0; k < 2; k++) for (let a = 0; a < 6; a += 0.12) p.rect(6 + a * 3.4, 12 + k * 8 + Math.sin(a * 2 + k) * 3, 3, 3, k ? '#d68a8a' : '#c47070'); }
  else if (id === 'MAT_SEAWEED') { for (let k = 0; k < 3; k++) for (let a = 0; a < 7; a += 0.15) p.set(9 + k * 7 + Math.sin(a * 1.7 + k) * 2.5, 27 - a * 3.2, k % 2 ? '#3f8a6a' : '#5aa07a'); p.rect(6, 26, 20, 2, '#3f8a6a'); }
  else if (id === 'MAT_ORGANIC_WASTE') { p.poly([[6, 25], [10, 17], [16, 13], [22, 17], [26, 25]], '#6a5a3a'); p.speckle(prng(31), 0.4, ['#8ab04a', '#c9883a', '#5a3a22', '#b63a6a']); }
  else S[fn](p, { ...opt, id });
  void MARK;
  p.outline(P.outline);
  p.rimShade(0.18, -0.18);
  return p;
}
export const ICON_IDS = Object.keys(I);
export { S as ICON_SHAPES };
export function hexColor(c) { return hex(c); }
