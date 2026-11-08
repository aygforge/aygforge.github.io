// 58 BuildDB structures (complete + ghost), prefab house construction stages, roofs and interiors, 38 POIs.
import { Pix, shade, prng, strHash } from './raster.mjs';
import { P } from './palette.mjs';
import { ICON_SHAPES, scaleDown, drawItemIcon } from './icons.mjs';

// ---------- primitives ----------
const shadowE = (p, cx, cy, rx, ry = 3) => p.ellipse(cx, cy, rx, ry, [20, 30, 30, 70]);
function crate(p, x, y, w, h, c = P.wood_light, open = false) {
  p.rect(x, y, w, h, c); p.rect(x, y, w, 2, shade(c, 0.25)); p.frame(x, y, w, h, shade(c, -0.35));
  p.line(x + 1, y + 1, x + w - 2, y + h - 2, shade(c, -0.2)); if (!open) p.line(x + w - 2, y + 1, x + 1, y + h - 2, shade(c, -0.2));
  if (open) { p.rect(x + 2, y + 2, w - 4, h / 2, '#3a2a20'); }
}
function chest(p, x, y, w, h, c = P.wood, band = P.iron, open = false) {
  p.rect(x, y + h * 0.35, w, h * 0.65, c); p.rect(x, y, w, h * 0.4, open ? '#3a2a20' : shade(c, 0.15)); if (open) p.rect(x, y - h * 0.3, w, h * 0.3, shade(c, 0.1));
  p.rect(x, y + h * 0.35, w, 2, band); p.rect(x + w / 2 - 2, y + h * 0.3, 4, 5, P.gold); for (let k = 0; k < 2; k++) p.rect(x + 3 + k * (w - 8), y, 2, h, shade(band, -0.1));
}
function table(p, x, y, w, h, c = P.wood_light) { p.rect(x, y, w, 5, c); p.rect(x, y, w, 1, shade(c, 0.3)); p.rect(x + 2, y + 5, 3, h - 5, shade(c, -0.3)); p.rect(x + w - 5, y + 5, 3, h - 5, shade(c, -0.3)); }
function roofTri(p, x, y, w, h, c) { p.poly([[x, y + h], [x + w / 2, y], [x + w, y + h]], c); for (let i = 1; i < 5; i++) p.line(x + (w / 2) * (i / 5), y + h - h * (i / 5) + 2, x + w - (w / 2) * (i / 5), y + h - h * (i / 5) + 2, shade(c, -0.15)); }
function thatch(p, x, y, w, h, c = '#c9a64a') { p.poly([[x - 4, y + h], [x + w / 2, y], [x + w + 4, y + h]], c); for (let i = 0; i < w + 8; i += 3) p.line(x - 4 + i, y + h, x + w / 2 + (i - (w + 8) / 2) * 0.3, y + 4, shade(c, (i % 6 ? -0.12 : 0.1))); }
function fire(p, cx, cy, s = 1) { p.ellipse(cx, cy - 4 * s, 5 * s, 7 * s, '#f28a2a'); p.ellipse(cx, cy - 3 * s, 3 * s, 5 * s, '#ffd04a'); p.ellipse(cx, cy - 2 * s, 1.5 * s, 2.5 * s, '#fff6c0'); }
function stonesRing(p, cx, cy, r) { for (let a = 0; a < Math.PI * 2; a += 0.55) p.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5, 3.5, 2.5, a % 1.1 < 0.55 ? P.stone : P.stone_light); }
function logs(p, cx, cy) { p.line(cx - 9, cy + 2, cx + 9, cy - 2, P.wood, 3); p.line(cx - 9, cy - 2, cx + 9, cy + 2, '#8a6a48', 3); }
function plankWall(p, x, y, w, h, c = P.wood) { p.rect(x, y, w, h, c); for (let yy = y + 4; yy < y + h; yy += 5) p.line(x, yy, x + w - 1, yy, shade(c, -0.25)); p.rect(x, y, w, 1, shade(c, 0.25)); }
function bambooWall(p, x, y, w, h) { for (let xx = x; xx < x + w; xx += 4) { p.rect(xx, y, 3, h, xx % 8 ? '#9cc95a' : '#86b84a'); for (let yy = y + 5; yy < y + h; yy += 7) p.rect(xx, yy, 3, 1, '#5e8a33'); } }
function windowP(p, x, y, w = 8, h = 7) { p.rect(x, y, w, h, '#3a5a6a'); p.frame(x, y, w, h, P.wood_dark); p.line(x + w / 2, y, x + w / 2, y + h - 1, P.wood_dark); p.set(x + 2, y + 2, '#a9e2ec'); }
function door(p, x, y, w = 10, h = 16, c = P.wood_dark) { p.rect(x, y, w, h, c); p.frame(x, y, w, h, shade(c, -0.3)); p.set(x + w - 3, y + h / 2, P.gold); }
function bench(p, x, y, w, c = P.wood_light) { p.rect(x, y, w, 4, c); p.rect(x, y, w, 1, shade(c, 0.3)); p.rect(x + 2, y + 4, 2, 6, shade(c, -0.3)); p.rect(x + w - 4, y + 4, 2, 6, shade(c, -0.3)); }
function icon(p, id, x, y, f = 0.6) { p.blit(scaleDown(drawItemIcon(id), f), x, y); }
function pole(p, x, y0, y1, c = P.wood) { p.rect(x, y0, 3, y1 - y0, c); p.rect(x, y0, 1, y1 - y0, shade(c, 0.25)); }

// ---------- houses (prefab, 4 models + leaf shelter) ----------
/** Hip roof seen in 3/4 top-down view: covers the back of the footprint so every wall cell has visible art. */
function hipRoof(p, x, y0, w, y1, c) {
  const h = y1 - y0; const inset = Math.min(Math.round(h * 0.55), Math.round(w * 0.3));
  p.rect(x, y0, w, h, c);
  p.poly([[x, y0], [x + inset, y0 + Math.round(h / 2)], [x, y1]], shade(c, -0.18));
  p.poly([[x + w, y0], [x + w - inset, y0 + Math.round(h / 2)], [x + w, y1]], shade(c, 0.12));
  for (let yy = y0 + 4; yy < y1; yy += 5) p.line(x + 1, yy, x + w - 2, yy, shade(c, -0.08));
  p.line(x + inset, y0 + Math.round(h / 2), x + w - inset, y0 + Math.round(h / 2), shade(c, 0.3), 2);
  p.rect(x, y0, w, 2, shade(c, 0.22)); p.rect(x, y1 - 3, w, 3, shade(c, -0.3));
}
function houseCommon(p, W, H, kind, stage, part) {
  const base = H - 6; const wallTop = Math.round(H * 0.38); const wx = 6, ww = W - 12;
  const wallFn = kind === 'bamboo' ? (x, y, w, h) => bambooWall(p, x, y, w, h) : (x, y, w, h) => plankWall(p, x, y, w, h, kind === 'fisher' ? '#7a8a96' : kind === 'large' ? '#9a7552' : P.wood);
  const roofC = { bamboo: '#c9a64a', wood: '#8a4a3a', large: '#3d7a8a', fisher: '#5a6a7a', leaf: P.palm }[kind];
  if (part === 'interior_floor') { p.rect(wx, wallTop + 8, ww, base - wallTop - 8, kind === 'bamboo' || kind === 'leaf' ? '#c9a676' : '#a87a52'); for (let y = wallTop + 12; y < base; y += 6) p.line(wx, y, wx + ww - 1, y, shade('#a87a52', -0.2)); return; }
  if (part === 'interior_wall') { wallFn(wx, wallTop, ww, 10); p.rect(wx, wallTop, 3, base - wallTop, shade(P.wood, -0.2)); p.rect(wx + ww - 3, wallTop, 3, base - wallTop, shade(P.wood, -0.2)); return; }
  if (part === 'roof') { if (kind === 'leaf' || kind === 'bamboo') thatch(p, wx, 4, ww, wallTop + 10, roofC); else hipRoof(p, wx - 4, 8, ww + 8, wallTop + 12, roofC); return; }
  shadowE(p, W / 2, base + 2, W / 2 - 4, 4);
  // foundation
  p.rect(wx - 2, base - 4, ww + 4, 6, P.stone); for (let x = wx; x < wx + ww; x += 6) p.rect(x, base - 4, 1, 6, P.stone_dark);
  if (stage === 'foundation') { for (let x = wx; x < wx + ww; x += 10) pole(p, x, base - 10, base - 4, P.wood_light); p.rect(wx, base - 6, ww, 2, P.wood_light); return; }
  if (stage === 'frame') { for (let x = wx; x <= wx + ww - 3; x += Math.max(8, Math.floor(ww / 5))) pole(p, x, wallTop, base - 4); p.rect(wx, wallTop, ww, 3, P.wood); p.line(wx, wallTop, wx + ww / 2, 6, P.wood, 2); p.line(wx + ww, wallTop, wx + ww / 2, 6, P.wood, 2); return; }
  // complete
  if (kind === 'leaf') { pole(p, wx, wallTop + 4, base - 4); pole(p, wx + ww - 3, wallTop + 4, base - 4); thatch(p, wx, 6, ww, wallTop + 4, roofC); p.rect(wx + 4, base - 10, ww - 8, 4, '#c9a676'); return; }
  wallFn(wx, wallTop, ww, base - wallTop - 4);
  door(p, W / 2 - 6, base - 22, 12, 18);
  windowP(p, wx + 6, wallTop + 10); if (ww > 60) windowP(p, wx + ww - 14, wallTop + 10);
  if (kind === 'large') { p.rect(wx - 4, base - 8, ww + 8, 4, '#c9a676'); for (let x = wx - 2; x < wx + ww + 2; x += 12) pole(p, x, wallTop + 6, base - 8, P.wood_light); }
  if (kind === 'fisher') { for (let i = 0; i < 3; i++) p.line(wx + ww - 8 + i * 3, wallTop + 6, wx + ww - 8 + i * 3, wallTop + 20, P.rope); p.rect(wx + 2, base - 6, ww - 4, 2, P.wood_light); icon(p, 'FOOD_DRIED_FISH', wx + ww - 14, wallTop + 8, 0.4); }
  if (kind === 'leaf' || kind === 'bamboo') thatch(p, wx, 4, ww, wallTop + 6, roofC);
  else hipRoof(p, wx - 4, 8, ww + 8, wallTop + 4, roofC);
  if (kind === 'large') { p.rect(W / 2 + 30, 2, 7, 14, P.stone_dark); p.rect(W / 2 + 30, 2, 7, 2, P.stone); }
}
const HOUSE_KIND = { BUILD_BAMBOO_HUT: 'bamboo', BUILD_WOOD_HUT: 'wood', BUILD_LARGE_HOUSE: 'large', BUILD_FISH_HUT: 'fisher', BUILD_LEAF_SHELTER: 'leaf' };

// ---------- per-building painters ----------
const B = {
  BUILD_ANIMAL_TRAP(p, W, H) { shadowE(p, 16, 44, 10); p.rect(6, 30, 20, 13, '#7a5a3e'); for (let x = 8; x < 26; x += 3) p.line(x, 30, x, 43, P.wood_light); p.line(6, 30, 26, 30, P.rope, 2); p.rect(10, 24, 2, 8, P.wood); },
  BUILD_CRAB_TRAP(p) { shadowE(p, 16, 44, 10); p.ellipse(16, 36, 11, 8, '#9cc95a'); for (let a = 0; a < 6; a++) p.line(16, 28, 6 + a * 4, 43, '#5e8a33'); p.ellipse(16, 30, 5, 2, '#3a2a20'); p.line(16, 28, 22, 18, P.rope); },
  BUILD_FISH_TRAP(p) { shadowE(p, 16, 44, 10); p.poly([[6, 32], [26, 28], [28, 42], [8, 44]], '#b5a05a'); for (let x = 8; x < 27; x += 3) p.line(x, 30, x + 1, 43, '#7a6a3a'); p.ellipse(9, 38, 3, 5, '#3a2a20'); p.line(26, 28, 28, 16, P.rope); },
  BUILD_CAMP_MARKER(p) { shadowE(p, 16, 44, 7); stonesRing(p, 16, 42, 6); pole(p, 15, 14, 42); p.poly([[18, 14], [29, 18], [18, 23]], P.red); },
  BUILD_CHAIR(p) { shadowE(p, 16, 44, 8); p.rect(9, 18, 14, 4, P.wood); p.rect(9, 18, 3, 26, P.wood_dark); p.rect(20, 18, 3, 26, P.wood_dark); p.rect(8, 30, 16, 4, P.wood_light); p.rect(9, 34, 2, 10, P.wood_dark); p.rect(21, 34, 2, 10, P.wood_dark); },
  BUILD_FEED_BOWL(p) { shadowE(p, 16, 44, 8); p.ellipse(16, 38, 10, 5, P.clay); p.ellipse(16, 36, 8, 3, '#7a4a32'); p.circle(13, 35, 2, '#b63a6a'); p.circle(18, 35, 2, '#e8c43c'); },
  BUILD_FENCE(p) { pole(p, 4, 22, 46); pole(p, 25, 22, 46); p.rect(2, 28, 28, 3, P.wood_light); p.rect(2, 37, 28, 3, P.wood_light); },
  BUILD_GATE(p) { pole(p, 2, 16, 46, P.wood_dark); pole(p, 27, 16, 46, P.wood_dark); p.rect(5, 22, 22, 3, P.wood_light); p.rect(5, 38, 22, 3, P.wood_light); for (let x = 7; x < 26; x += 4) p.rect(x, 22, 2, 19, P.wood); p.line(5, 40, 26, 23, P.wood_dark, 2); },
  BUILD_LAMP_POST(p) { shadowE(p, 16, 44, 6); pole(p, 15, 12, 44, P.iron_dark); p.rect(10, 6, 12, 10, '#2f3e52'); p.rect(12, 8, 8, 6, '#ffe48a'); p.rect(12, 42, 8, 3, P.stone); },
  BUILD_PATH(p) { const r = prng(3); for (let i = 0; i < 6; i++) p.ellipse(6 + (i % 3) * 10 + r() * 3, 30 + Math.floor(i / 3) * 9 + r() * 3, 5, 3.5, i % 2 ? P.stone : P.stone_light); },
  BUILD_PLANTER(p) { p.rect(3, 30, 26, 14, P.wood); p.rect(5, 32, 22, 8, '#5a3e2a'); p.speckle(prng(2), 0.2, ['#6a4a32', '#4a3020'], [5, 32, 27, 40]); p.rect(3, 30, 26, 2, P.wood_light); },
  BUILD_PLANT_POT(p) { shadowE(p, 16, 44, 7); p.poly([[9, 32], [23, 32], [21, 44], [11, 44]], P.clay); p.rect(8, 30, 16, 3, P.clay_light); for (let i = 0; i < 5; i++) p.ellipse(10 + i * 3, 26 - (i % 2) * 3, 3, 4, P.leaf); },
  BUILD_PLAY_POST(p) { shadowE(p, 16, 44, 7); pole(p, 15, 8, 44); p.line(17, 14, 26, 24, P.rope, 2); p.circle(26, 26, 3, P.red); p.rect(10, 40, 12, 4, P.wood); },
  BUILD_PARROT_PERCH(p) { shadowE(p, 16, 44, 6); pole(p, 15, 14, 44); p.rect(6, 14, 20, 3, P.wood_light); p.ellipse(16, 44, 6, 2, P.stone); icon(p, 'FOOD_BERRY', 20, 6, 0.3); },
  BUILD_CAMPFIRE(p, W, H, s) { p.ellipse(32, 56, 28, 21, '#6a5a48'); p.ellipse(32, 57, 20, 14, '#4a3e34'); for (let a = 0; a < Math.PI * 2; a += 0.42) p.ellipse(32 + Math.cos(a) * 24, 56 + Math.sin(a) * 17, 4, 3, a % 0.84 < 0.42 ? P.stone : P.stone_light); logs(p, 32, 58); if (s !== 'cold') fire(p, 32, 54, 1.6); },
  BUILD_KILN(p) { shadowE(p, 32, 72, 22, 5); p.ellipse(32, 52, 22, 20, P.clay); p.ellipse(28, 44, 10, 8, P.clay_light); p.rect(24, 54, 16, 14, '#3a2a20'); fire(p, 32, 66, 0.9); p.rect(40, 26, 6, 12, '#8a4f35'); },
  BUILD_SMELTER(p) { shadowE(p, 32, 72, 22, 5); p.rect(14, 30, 36, 40, P.stone); for (let y = 34; y < 70; y += 6) p.line(14, y, 49, y, P.stone_dark); p.rect(22, 50, 20, 16, '#2a1a10'); fire(p, 32, 64, 1); p.rect(26, 16, 12, 16, P.clay); p.rect(46, 44, 10, 4, P.iron); p.rect(52, 48, 4, 10, P.copper); },
  BUILD_WORKBENCH(p) { shadowE(p, 32, 72, 24, 5); table(p, 8, 46, 48, 26, P.wood_light); p.rect(14, 40, 14, 6, P.wood); icon(p, 'TOOL_STONE_AXE', 30, 30, 0.6); icon(p, 'CMP_ROPE', 40, 34, 0.45); p.rect(8, 64, 48, 2, P.wood_dark); },
  BUILD_CARPENTER_BENCH(p) { shadowE(p, 48, 72, 36, 5); table(p, 8, 44, 80, 28, '#9a7552'); p.rect(20, 36, 30, 8, P.wood_light); p.line(20, 36, 50, 36, '#c9a676'); p.rect(60, 38, 4, 6, P.iron); p.circle(74, 38, 6, P.iron); p.circle(74, 38, 2, P.iron_dark); icon(p, 'CMP_PLANK', 8, 24, 0.6); },
  BUILD_MECHANICAL_BENCH(p) { shadowE(p, 48, 72, 36, 5); table(p, 8, 44, 80, 28, '#5c6b7a'); icon(p, 'CMP_GEAR', 14, 26, 0.7); icon(p, 'CMP_COPPER_WIRE', 40, 28, 0.6); p.rect(62, 30, 18, 14, '#3a4550'); p.rect(65, 33, 12, 6, '#2b8a56'); p.set(78, 32, P.red); },
  BUILD_LOOM(p) { shadowE(p, 32, 72, 22, 5); pole(p, 12, 22, 70); pole(p, 49, 22, 70); p.rect(12, 22, 40, 4, P.wood); p.rect(15, 28, 34, 26, P.cloth); for (let x = 16; x < 48; x += 3) p.line(x, 28, x, 54, P.cloth_dark); p.rect(12, 54, 40, 4, P.wood); p.rect(14, 62, 36, 4, P.wood_light); },
  BUILD_TANNING_RACK(p) { shadowE(p, 32, 72, 22, 5); pole(p, 10, 20, 70); pole(p, 51, 20, 70); p.rect(10, 20, 44, 3, P.wood); p.poly([[16, 26], [46, 26], [44, 58], [18, 58]], '#a87a52'); for (let i = 0; i < 6; i++) p.line(16 + i * 6, 23, 16 + i * 6, 27, P.rope); },
  BUILD_DRYING_RACK(p) { shadowE(p, 32, 44, 24, 4); pole(p, 6, 10, 44); pole(p, 55, 10, 44); p.rect(6, 10, 52, 3, P.wood); for (let i = 0; i < 4; i++) { icon(p, i % 2 ? 'MAT_RAW_FISH' : 'MAT_RAW_MEAT', 10 + i * 11, 14, 0.4); } },
  BUILD_NAV_TABLE(p) { shadowE(p, 32, 72, 22, 5); table(p, 8, 44, 48, 28, P.wood); p.rect(12, 38, 40, 8, P.paper); p.line(16, 44, 30, 40, P.ink); p.line(30, 40, 46, 43, P.ink); p.circle(46, 43, 1.5, P.red); icon(p, 'TOOL_COMPASS', 22, 26, 0.5); },
  BUILD_COMPOST_BIN(p) { shadowE(p, 32, 72, 22, 5); crate(p, 12, 36, 40, 34, '#7a5a3e', true); p.ellipse(32, 40, 16, 4, '#5a4430'); p.speckle(prng(5), 0.3, ['#6e8a3a', '#3e2f22'], [16, 37, 48, 44]); },
  BUILD_WATER_FILTER(p) { shadowE(p, 32, 72, 20, 5); p.rect(18, 22, 28, 20, '#c9b590'); p.rect(18, 22, 28, 3, P.sand_light); p.rect(22, 42, 20, 6, P.coal); p.rect(18, 48, 28, 20, P.wood); p.rect(28, 66, 8, 4, P.iron); p.ellipse(32, 72, 4, 2, P.water_clean); },
  BUILD_RAIN_CATCHER(p) { shadowE(p, 32, 72, 22, 5); pole(p, 10, 30, 66); pole(p, 51, 30, 66); p.poly([[4, 22], [60, 22], [40, 40], [24, 40]], P.palm); p.rect(22, 44, 20, 24, '#9cc95a'); p.rect(22, 44, 20, 3, '#5e8a33'); p.ellipse(32, 46, 8, 2, P.water_clean); },
  BUILD_RAIN_CATCHER_L(p) { shadowE(p, 48, 72, 34, 5); for (const x of [8, 46, 84]) pole(p, x, 24, 66); p.poly([[2, 16], [94, 16], [62, 38], [34, 38]], P.canvas); p.rect(30, 42, 36, 26, P.wood); p.rect(30, 42, 36, 3, P.wood_light); p.ellipse(48, 44, 14, 2, P.water_clean); },
  BUILD_WATER_TANK(p) { shadowE(p, 32, 72, 22, 5); p.ellipse(32, 28, 22, 6, P.wood_light); p.rect(10, 28, 44, 40, P.wood); for (let y = 34; y < 68; y += 8) p.rect(10, y, 44, 2, P.iron); p.ellipse(32, 68, 22, 5, P.wood_dark); p.rect(46, 56, 10, 3, P.iron); },
  BUILD_IRRIGATION(p) { shadowE(p, 32, 72, 22, 5); p.rect(14, 40, 36, 26, '#5f9a8a'); p.rect(14, 40, 36, 3, '#7fbab0'); for (let i = 0; i < 4; i++) p.line(10, 66 - i * 2, 54, 66 - i * 2, '#9cc95a'); p.circle(32, 32, 8, P.iron); for (let a = 0; a < 6; a++) p.line(32, 32, 32 + Math.cos(a) * 8, 32 + Math.sin(a) * 8, P.iron_dark); },
  BUILD_CHEST_SMALL(p) { shadowE(p, 16, 44, 11); chest(p, 4, 26, 24, 18); },
  BUILD_CHEST_LARGE(p) { shadowE(p, 32, 44, 26); chest(p, 4, 22, 56, 22, P.wood, P.iron); },
  BUILD_FOOD_CHEST(p) { shadowE(p, 16, 44, 11); chest(p, 4, 26, 24, 18, '#8a6a3a', P.palm); icon(p, 'FOOD_BANANA', 10, 14, 0.4); },
  BUILD_MATERIAL_SHELF(p) { shadowE(p, 32, 44, 26); p.rect(4, 8, 56, 36, P.wood_dark); for (let y = 8; y < 44; y += 12) p.rect(4, y, 56, 3, P.wood_light); icon(p, 'MAT_STONE', 8, 10, 0.3); icon(p, 'CMP_PLANK', 22, 10, 0.3); icon(p, 'CMP_ROPE', 40, 22, 0.3); icon(p, 'SAL_SCRAP', 12, 34, 0.25); },
  BUILD_TOOL_RACK(p) { shadowE(p, 32, 44, 26); p.rect(4, 12, 56, 4, P.wood); pole(p, 6, 12, 44); pole(p, 55, 12, 44); icon(p, 'TOOL_STONE_AXE', 8, 16, 0.6); icon(p, 'TOOL_STONE_PICK', 24, 16, 0.6); icon(p, 'TOOL_FISH_ROD', 40, 16, 0.6); },
  BUILD_PANTRY(p) { shadowE(p, 32, 72, 22, 5); p.rect(10, 22, 44, 48, P.clay); p.rect(10, 22, 44, 4, P.clay_light); door(p, 22, 40, 20, 30, P.wood); icon(p, 'FOOD_RATION', 26, 10, 0.4); },
  BUILD_LOG_STORE(p) { shadowE(p, 32, 72, 22, 5); pole(p, 10, 26, 70); pole(p, 51, 26, 70); for (let r = 0; r < 4; r++) for (let k = 0; k < 4 - (r % 2); k++) p.circle(18 + k * 9 + (r % 2) * 4, 62 - r * 9, 4.5, k % 2 ? '#9a7552' : '#8a6a48'); p.rect(8, 22, 48, 4, P.wood); },
  BUILD_ORE_STORE(p) { shadowE(p, 32, 72, 22, 5); crate(p, 10, 40, 44, 30, P.wood, true); for (let i = 0; i < 6; i++) p.ellipse(16 + i * 6, 42, 4, 3, [P.stone, P.copper, P.rust, P.coal][i % 4]); },
  BUILD_BENCH(p) { shadowE(p, 32, 44, 26); bench(p, 4, 30, 56); p.rect(4, 22, 56, 3, P.wood); },
  BUILD_TABLE(p, W, H, s) { shadowE(p, 32, 44, 26); table(p, 4, 26, 56, 18, P.wood_light); if (s === 'decor') { p.rect(8, 22, 48, 4, P.red); icon(p, 'MAT_MED_HERB', 24, 6, 0.5); } },
  BUILD_RUG(p) { p.ellipse(32, 40, 28, 14, '#c8643c'); p.ellipse(32, 40, 22, 10, '#e8c43c'); p.ellipse(32, 40, 14, 6, '#5a8a6a'); },
  BUILD_LEAF_BED(p) { shadowE(p, 32, 44, 26); p.ellipse(32, 36, 28, 8, P.palm); for (let i = 0; i < 8; i++) p.line(6 + i * 7, 30, 10 + i * 7, 42, P.leaf_dark); },
  BUILD_WOOD_BED(p) { shadowE(p, 32, 44, 26); p.rect(4, 20, 56, 22, P.wood); p.rect(6, 22, 52, 14, P.cloth); p.rect(6, 22, 14, 14, P.white); p.rect(20, 26, 38, 10, '#5a8ab0'); },
  BUILD_COMFORT_BED(p, W, H, s) { shadowE(p, 32, 72, 26, 5); p.rect(4, 26, 56, 44, P.wood_dark); p.rect(6, 30, 52, 34, P.cloth); p.rect(10, 32, 18, 10, P.white); p.rect(32, 32, 18, 10, P.white); p.rect(6, 44, 52, 20, s === 'special' ? '#8e5bb5' : '#c8643c'); p.rect(4, 18, 56, 10, P.wood); },
  BUILD_MAP_TABLE(p) { shadowE(p, 32, 72, 22, 5); table(p, 6, 40, 52, 32, P.wood); p.rect(10, 34, 44, 8, P.paper); p.line(14, 40, 26, 36, P.ink); p.line(26, 36, 50, 40, P.ink); p.ellipse(36, 38, 3, 2, '#5a8a6a'); p.rect(50, 30, 4, 6, P.glass); },
  BUILD_MONKEY_PLATFORM(p) { shadowE(p, 32, 72, 22, 5); for (const x of [12, 48]) pole(p, x, 30, 70); p.rect(8, 28, 48, 5, P.wood_light); p.line(20, 33, 20, 60, P.rope, 2); icon(p, 'FOOD_BANANA', 36, 14, 0.5); },
  BUILD_PARROT_HOUSE(p) { shadowE(p, 32, 44, 22); p.rect(18, 22, 28, 20, P.wood_light); p.circle(32, 32, 4, '#3a2a20'); thatch(p, 18, 8, 28, 14, P.palm); pole(p, 31, 42, 46); },
  BUILD_BRIDGE(p, W, H, s) { const c = s === 'adv' ? '#7a6a52' : P.wood_light; p.rect(4, 26, 88, 30, c); for (let x = 4; x < 92; x += 6) p.rect(x, 26, 1, 30, shade(c, -0.3)); for (const y of [24, 56]) { p.rect(2, y, 92, 3, s === 'adv' ? P.iron : P.wood_dark); for (let x = 4; x < 92; x += 14) pole(p, x, y - 8, y + 2, s === 'adv' ? P.iron_dark : P.wood_dark); } },
  BUILD_PIER(p) { p.rect(4, 28, 120, 30, P.wood_light); for (let x = 4; x < 124; x += 6) p.rect(x, 28, 1, 30, shade(P.wood_light, -0.3)); for (let x = 8; x < 124; x += 24) { pole(p, x, 56, 76, P.wood_dark); } p.line(110, 30, 116, 20, P.rope, 2); },
  BUILD_RAFT(p) { shadowE(p, 48, 72, 40, 6); for (let i = 0; i < 8; i++) { p.rect(10 + i * 10, 38, 9, 32, i % 2 ? P.wood : '#8a6a48'); p.ellipse(14 + i * 10, 38, 4.5, 2, '#9a7552'); } p.rect(8, 44, 82, 3, P.rope); p.rect(8, 62, 82, 3, P.rope); pole(p, 46, 6, 40); p.poly([[50, 8], [78, 30], [50, 34]], P.canvas); },
  BUILD_ESCAPE_BOAT(p) { // 3/4 view: deck plan fills the 7×3 footprint (y 16..112), hull side below, mast + sails on top
    shadowE(p, 112, 108, 100, 6);
    p.poly([[6, 30], [180, 24], [220, 58], [198, 88], [24, 88], [6, 66]], '#6a4a32');
    p.poly([[10, 34], [178, 29], [212, 58], [194, 82], [26, 82], [10, 63]], P.wood_light);
    for (let y = 40; y < 82; y += 7) p.line(14, y, 196, y - 1, shade(P.wood_light, -0.22));
    p.poly([[24, 88], [198, 88], [186, 106], [36, 106]], '#7a5a3e'); for (let y = 92; y < 106; y += 5) p.line(30, y, 192, y, P.wood_dark);
    p.rect(146, 42, 30, 22, P.wood); p.rect(146, 42, 30, 3, shade(P.wood, 0.25)); p.rect(154, 50, 8, 6, '#3a5a6a');
    p.rect(14, 44, 10, 24, P.iron_dark); p.rect(30, 70, 14, 8, P.rope);
    p.rect(100, 4, 5, 58, P.wood_dark); p.poly([[106, 6], [172, 52], [106, 52]], P.canvas); p.poly([[98, 10], [44, 50], [98, 50]], '#efe8d4');
  },
  BUILD_SIGNAL_STATION(p) { shadowE(p, 64, 140, 44, 5); p.rect(30, 90, 68, 50, '#5c6b7a'); p.rect(30, 90, 68, 4, '#7d8a96'); p.rect(40, 100, 20, 14, '#2b8a56'); p.rect(66, 100, 24, 30, '#3a4550'); for (let i = 0; i < 3; i++) p.rect(70, 104 + i * 8, 16, 4, [P.red, P.yellow, P.green][i]); p.line(64, 6, 64, 90, P.iron, 3); for (let y = 16; y < 90; y += 14) p.line(64 - (90 - y) / 6, y, 64 + (90 - y) / 6, y, P.iron); p.circle(64, 6, 4, P.red); p.poly([[96, 70], [124, 62], [124, 84], [96, 92]], '#2a4d8a'); for (let i = 0; i < 3; i++) p.line(98, 76 + i * 5, 122, 68 + i * 5, '#4a8ed8'); },
  BUILD_WINCH(p) { shadowE(p, 32, 72, 22, 5); p.rect(14, 46, 36, 24, P.iron_dark); p.circle(32, 44, 12, P.iron); p.circle(32, 44, 4, P.iron_dark); for (let a = 0; a < 8; a++) p.line(32, 44, 32 + Math.cos(a) * 12, 44 + Math.sin(a) * 12, P.iron_dark); p.line(32, 32, 40, 2, P.rope, 2); },
};

const SIZE_STATE_DEFAULT = 'complete';
export function drawBuild(buildId, variant, W, H) {
  const p = new Pix(W, H);
  if (HOUSE_KIND[buildId]) {
    houseCommon(p, W, H, HOUSE_KIND[buildId], variant === 'ghost' ? 'complete' : variant, variant);
  } else {
    const fn = B[buildId];
    if (!fn) throw new Error('No painter for ' + buildId);
    fn(p, W, H, variant);
  }
  if (variant !== 'interior_floor') p.outline(P.outline);
  if (variant !== 'interior_floor' && variant !== 'roof') p.rimShade(0.1, -0.12);
  void SIZE_STATE_DEFAULT; void strHash; void ICON_SHAPES;
  return variant === 'ghost' ? p.ghost() : p;
}

/** active fx overlays for stations (fire glow / working sparkle / water shimmer) */
export function drawActiveFx(buildId, W, H) {
  const p = new Pix(W, H);
  if (['BUILD_CAMPFIRE', 'BUILD_KILN', 'BUILD_SMELTER'].includes(buildId)) { p.ellipse(W / 2, H - 16, W / 2 - 4, 14, [255, 180, 80, 70]); fire(p, W / 2, H - 14, 1.3); p.set(W / 2 - 4, H - 40, '#ffd04a'); p.set(W / 2 + 6, H - 46, '#ec8f3a'); }
  else if (buildId.startsWith('BUILD_RAIN') || buildId.startsWith('BUILD_WATER')) { for (let i = 0; i < 6; i++) p.line(8 + i * (W - 16) / 6, 4, 6 + i * (W - 16) / 6, 14, [170, 220, 240, 180]); p.ellipse(W / 2, H - 20, W / 4, 3, [150, 220, 240, 160]); }
  else if (buildId === 'BUILD_SIGNAL_STATION') { for (let r = 8; r < 40; r += 10) for (let a = -0.8; a < 0.8; a += 0.05) p.set(64 + Math.cos(a - Math.PI / 2) * r, 10 + Math.sin(a - Math.PI / 2) * r + 20, [120, 220, 255, 200 - r * 4]); }
  else if (buildId === 'BUILD_ESCAPE_BOAT' || buildId === 'BUILD_RAFT') { for (let x = 4; x < W - 4; x += 3) p.set(x, H - 8 + Math.round(Math.sin(x / 5) * 2), [255, 255, 255, 180]); }
  else { for (let i = 0; i < 5; i++) { const x = W / 2 - 10 + i * 5, y = H / 2 - 10 - (i % 3) * 4; p.set(x, y, '#fff6c0'); p.set(x + 1, y, '#ffd04a'); } p.ellipse(W / 2, H / 2 - 18, 6, 3, [255, 255, 255, 90]); }
  return p;
}

// ---------- POIs (160×128) ----------
function rock(p, cx, cy, rx, ry, c = P.stone) { p.ellipse(cx, cy, rx, ry, c); p.ellipse(cx - rx * 0.3, cy - ry * 0.35, rx * 0.5, ry * 0.4, shade(c, 0.2)); }
function palmSmall(p, x, y) { for (let i = 0; i < 18; i++) p.rect(x - 1, y - i * 2, 3, 2, '#8a6a48'); for (let k = 0; k < 6; k++) { const a = -Math.PI + k * 0.6; for (let s = 0; s < 14; s++) p.rect(x + Math.cos(a) * s, y - 36 + Math.sin(a) * s * 0.5 + s * s / 30, 2, 2, P.palm); } }
function treeSmall(p, x, y, c = P.leaf) { p.rect(x - 2, y - 16, 5, 16, P.bark); p.ellipse(x, y - 24, 13, 11, c); p.ellipse(x - 3, y - 27, 8, 6, shade(c, 0.15)); }
function hut(p, x, y, w, h, wall = P.wood, roof = '#8a4a3a', broken = false) { plankWall(p, x, y - h, w, h, wall); door(p, x + w / 2 - 5, y - 14, 10, 14); roofTri(p, x - 4, y - h - 18, w + 8, 20, roof); if (broken) { p.poly([[x + w - 14, y - h - 8], [x + w + 4, y - h - 2], [x + w, y - h + 4]], 'CLEAR'); p.line(x + 4, y - h + 6, x + 12, y - 4, shade(wall, -0.4)); } }
function boatWreck(p, x, y, w, open) { p.poly([[x, y - 10], [x + w, y - 18], [x + w - 10, y + 2], [x + 8, y + 6]], '#7a5a3e'); for (let i = 0; i < 4; i++) p.line(x + 4, y - 8 + i * 4, x + w - 8, y - 14 + i * 4, P.wood_dark); p.line(x + w * 0.45, y - 14, x + w * 0.5, y - 50, P.wood_dark, 3); p.poly([[x + w * 0.5, y - 48], [x + w * 0.85, y - 26], [x + w * 0.5, y - 22]], open ? '#c9bfa8' : '#efe8d4'); p.poly([[x + w - 22, y - 18], [x + w - 12, y - 30], [x + w - 4, y - 18]], 'CLEAR'); }
function tower(p, x, y, h, c = P.wood) { pole(p, x, y - h, y, c); pole(p, x + 22, y - h, y, c); p.line(x, y - h * 0.6, x + 24, y - h * 0.3, c, 2); p.line(x + 24, y - h * 0.6, x, y - h * 0.3, c, 2); p.rect(x - 4, y - h - 6, 32, 6, P.wood_light); }
function caveMouth(p, cx, cy, w, h) { p.ellipse(cx, cy, w + 14, h + 10, P.stone_dark); p.ellipse(cx - 10, cy - 8, w * 0.6, h * 0.5, P.stone); p.ellipse(cx, cy + 4, w, h, '#14161a'); p.rect(cx - w + 2, cy + 4, w * 2 - 4, h - 2, '#14161a'); p.rect(cx - w - 4, cy + h + 2, w * 2 + 8, 4, P.stone); }
function lighthouse(p, cx, by, lit) { p.poly([[cx - 14, by], [cx + 14, by], [cx + 9, by - 86], [cx - 9, by - 86]], P.white); for (let y = by - 20; y > by - 86; y -= 22) p.rect(cx - 13 + (by - y) * 0.06, y, 26 - (by - y) * 0.12, 8, P.red); p.rect(cx - 12, by - 100, 24, 14, '#3a4550'); p.rect(cx - 9, by - 98, 18, 10, lit ? '#ffe48a' : '#6a8a9a'); p.poly([[cx - 14, by - 100], [cx, by - 112], [cx + 14, by - 100]], P.red_dark); door(p, cx - 5, by - 16, 10, 16); if (lit) for (let a = -0.4; a <= 0.4; a += 0.02) p.set(cx + Math.cos(a) * 60, by - 93 + Math.sin(a) * 30, [255, 240, 160, 90]); }
function greenhouse(p, x, y, w, h) { p.rect(x, y - h, w, h, [169, 226, 236, 140]); for (let xx = x; xx <= x + w; xx += 10) p.rect(xx, y - h, 2, h, '#e9e1c8'); p.poly([[x - 2, y - h], [x + w / 2, y - h - 16], [x + w + 2, y - h]], [169, 226, 236, 160]); for (let i = 0; i < 6; i++) p.ellipse(x + 8 + i * (w - 16) / 5, y - 8, 5, 6, P.leaf); }
function sign(p, x, y, c = P.paper) { pole(p, x, y - 18, y); p.rect(x - 8, y - 22, 18, 10, c); p.line(x - 6, y - 18, x + 6, y - 18, P.ink); }
function valves(p, x, y, fixed) { p.rect(x, y, 40, 6, P.iron); for (let i = 0; i < 3; i++) { p.circle(x + 6 + i * 14, y - 4, 4, fixed ? (i === 1 ? P.red : P.green) : P.rust); p.line(x + 6 + i * 14, y - 4, x + 6 + i * 14, y, P.iron_dark, 2); } }

const POIS = {
  POI_CRASH_BOAT(p, s) { boatWreck(p, 18, 96, 120, s !== 'default'); crate(p, 112, 92, 18, 14, P.wood_light, s !== 'default'); rock(p, 30, 110, 10, 6); if (s === 'default') icon(p, 'MAT_BRANCH', 60, 92, 0.6); },
  POI_WATERPROOF_BAG(p, s) { rock(p, 80, 100, 26, 12, P.sand); p.poly([[64, 96], [94, 92], [98, 110], [66, 112]], s === 'default' ? '#e8743a' : '#a85a3a'); p.rect(70, 96, 22, 4, P.iron); if (s !== 'default') p.rect(74, 100, 14, 6, '#3a2a20'); palmSmall(p, 124, 112); },
  POI_SHORE_CRATE(p, s) { crate(p, 58, 78, 40, 30, '#8a6a48', s !== 'default'); for (let i = 0; i < 5; i++) p.ellipse(40 + i * 18, 112, 8, 3, '#7aa0a8'); p.line(54, 80, 44, 64, P.rope, 2); },
  POI_BROKEN_LOOKOUT(p, s) { tower(p, 64, 116, 64); p.poly([[60, 48], [90, 46], [86, 54]], s === 'default' ? 'CLEAR' : P.wood_light); p.line(66, 60, 94, 76, P.rope); if (s !== 'default') sign(p, 110, 116); },
  POI_FISHER_HUT(p, s) { hut(p, 40, 110, 70, 40, '#7a8a96', '#5a6a7a', s === 'default'); p.rect(112, 100, 40, 6, P.wood_light); for (let i = 0; i < 3; i++) p.line(118 + i * 10, 80, 118 + i * 10, 100, P.rope); if (s === 'default') icon(p, 'SPC_CHART_COAST', 60, 66, 0.5); },
  POI_FRUIT_HILL(p, s) { p.ellipse(80, 108, 70, 22, P.grass); for (let i = 0; i < 4; i++) treeSmall(p, 30 + i * 32, 102 - (i % 2) * 8, i % 2 ? P.leaf : '#5aa04a'); for (let i = 0; i < 10; i++) p.circle(24 + i * 12, 82 + (i % 3) * 6, 2, s === 'default' ? '#b63a6a' : '#e8c43c'); },
  POI_VINE_TUNNEL(p, s) { p.ellipse(80, 80, 64, 46, P.leaf_dark); p.ellipse(80, 96, 26, 30, '#14261a'); if (s === 'default') for (let k = 0; k < 8; k++) for (let a = 0; a < 50; a++) p.set(58 + k * 6 + Math.sin(a / 4 + k) * 2, 66 + a, '#3e7a3a'); else for (let k = 0; k < 4; k++) p.line(56 + k * 4, 70, 50 + k * 3, 90, '#3e7a3a'); },
  POI_WATER_STATION(p, s) { p.rect(30, 62, 70, 50, P.stone); for (let y = 66; y < 112; y += 8) p.line(30, y, 99, y, P.stone_dark); p.rect(100, 70, 40, 40, '#5f9a8a'); p.ellipse(120, 70, 20, 6, '#7fbab0'); valves(p, 44, 94, s === 'repaired'); if (s === 'repaired') { p.rect(140, 96, 14, 4, P.iron); p.ellipse(154, 102, 4, 3, P.water_clean); } },
  POI_STONE_BRIDGE(p, s) { p.rect(0, 70, 160, 50, '#2f86a8'); for (let x = 0; x < 160; x += 12) p.rect(x, 84 + (x % 24 ? 4 : 0), 8, 1, '#5aa6c8'); for (const x of [20, 128]) { p.rect(x, 56, 14, 60, P.stone); } if (s === 'repaired') { p.rect(20, 56, 122, 16, P.stone_light); for (let x = 22; x < 140; x += 10) p.rect(x, 56, 1, 16, P.stone_dark); } else { p.rect(20, 56, 40, 16, P.stone_light); p.rect(104, 56, 38, 16, P.stone_light); rock(p, 80, 100, 10, 6); } },
  POI_WATERFALL_CAVE(p, s) { p.rect(30, 6, 100, 112, P.stone_dark); p.rect(60, 6, 40, 112, [120, 200, 230, 220]); for (let y = 8; y < 118; y += 6) p.line(62, y, 98, y + 2, [230, 250, 255, 200]); caveMouth(p, 80, 92, 18, 16); if (s !== 'default') p.rect(56, 6, 48, 30, P.stone_dark); },
  POI_FORESTER_HUT(p, s) { hut(p, 36, 110, 80, 44, '#6a5040', '#4a6a3a', s === 'default'); table(p, 122, 90, 30, 18, s === 'repaired' ? P.wood_light : '#7a5a3e'); if (s === 'default') p.line(124, 92, 150, 104, P.wood_dark, 2); for (let i = 0; i < 3; i++) p.circle(14 + i * 6, 112, 4, '#8a6a48'); },
  POI_TREEHOUSE(p, s) { p.rect(70, 30, 18, 90, P.bark); p.ellipse(80, 26, 60, 24, P.leaf_dark); p.rect(52, 40, 54, 24, P.wood); thatch(p, 52, 20, 54, 20, '#c9a64a'); for (let y = 66; y < 118; y += 6) p.rect(60, y, 10, 2, P.rope); if (s !== 'default') p.rect(66, 46, 20, 12, '#3a2a20'); },
  POI_HUNTER_CAMP(p, s) { p.poly([[40, 110], [70, 50], [100, 110]], P.leather); p.line(70, 46, 70, 110, P.wood_dark); stonesRing(p, 122, 106, 10); logs(p, 122, 104); if (s === 'default') { p.line(108, 80, 140, 70, P.wood, 2); icon(p, 'MAT_RAW_HIDE', 112, 60, 0.6); } },
  POI_SWAMP_MEASURE(p, s) { p.ellipse(80, 112, 72, 12, '#4a6a52'); hut(p, 44, 104, 50, 34, '#6a7a6a', '#4a5a4a', true); tower(p, 108, 112, 70, P.iron); p.circle(120, 34, 6, s === 'default' ? P.rust : P.iron); },
  POI_FLOODED_STORE(p, s) { p.rect(0, 80, 160, 48, [80, 140, 150, 220]); hut(p, 40, 100, 80, 46, '#6a7a7a', '#4a5a6a', true); p.rect(40, 80, 80, 20, [80, 140, 150, 180]); if (s !== 'default') p.rect(70, 84, 20, 14, '#3a2a20'); else p.rect(74, 86, 12, 8, P.iron); },
  POI_MANGROVE_COVE(p, s) { p.rect(0, 92, 160, 36, [80, 140, 150, 220]); for (let i = 0; i < 3; i++) treeSmall(p, 24 + i * 52, 96, '#4a7a4a'); p.rect(50, 92, 70, 6, P.wood_light); for (let x = 54; x < 120; x += 16) pole(p, x, 96, 116, P.wood_dark); if (s === 'default') crate(p, 98, 78, 16, 14); },
  POI_COPPER_MINE(p, s) { p.ellipse(80, 80, 76, 50, '#9a6a52'); caveMouth(p, 80, 90, 22, 22); pole(p, 56, 64, 112, P.wood); pole(p, 102, 64, 112, P.wood); p.rect(54, 62, 54, 5, P.wood); if (s === 'default') for (let i = 0; i < 5; i++) rock(p, 62 + i * 9, 108, 6, 5, P.stone); p.rect(118, 100, 22, 12, P.iron_dark); p.circle(122, 114, 3, P.iron); p.circle(136, 114, 3, P.iron); },
  POI_CABLE_CAR(p, s) { tower(p, 20, 120, 80, P.iron_dark); p.line(32, 40, 160, 4, P.iron_dark); p.rect(80 - (s === 'repaired' ? 0 : 8), 28, 26, 20, s === 'repaired' ? P.red : P.rust); p.line(92, 22, 92, 28, P.iron); for (let i = 0; i < 3; i++) p.circle(44 + i * 10, 108, 5, s === 'repaired' ? P.iron : P.rust); },
  POI_MINE_SHELTER(p, s) { rock(p, 80, 90, 66, 34, '#9a6a52'); door(p, 66, 82, 28, 32, s === 'default' ? P.iron_dark : '#2a1a10'); if (s === 'default') p.rect(76, 94, 8, 8, P.gold); },
  POI_OBSERVATORY(p, s) { p.ellipse(80, 114, 60, 10, P.stone); p.rect(52, 60, 56, 50, P.stone_light); p.ellipse(80, 60, 28, 22, '#5c6b7a'); p.rect(78, 40, 26, 6, P.iron); p.circle(80, 100, 10, s === 'default' ? P.copper : P.gold); for (let a = 0; a < 3; a++) p.line(80, 100, 80 + Math.cos(a * 2.1) * 9, 100 + Math.sin(a * 2.1) * 9, P.ink); },
  POI_RELAY_SHELTER(p, s) { rock(p, 80, 104, 70, 18, P.stone); p.rect(44, 70, 56, 40, '#7d8a96'); door(p, 62, 88, 18, 22, '#4a5560'); p.line(118, 16, 118, 104, P.iron, 2); for (let y = 24; y < 100; y += 14) p.line(112, y, 124, y, P.iron); p.circle(118, 14, 3, s === 'default' ? P.rust : P.green); },
  POI_BAT_CAVERN(p, s) { p.ellipse(80, 84, 74, 50, P.stone_dark); caveMouth(p, 80, 92, 26, 22); for (let i = 0; i < 6; i++) p.poly([[50 + i * 12, 66], [56 + i * 12, 66], [53 + i * 12, 76 + (i % 2) * 6]], '#4a4c52'); if (s === 'default') for (let i = 0; i < 3; i++) p.ellipse(60 + i * 18, 72, 3, 2, '#3a2e36'); },
  POI_UNDERGROUND_POND(p, s) { p.ellipse(80, 84, 74, 50, P.stone_dark); caveMouth(p, 80, 94, 24, 20); p.ellipse(80, 116, 30, 6, [100, 170, 200, 200]); if (s !== 'default') p.rect(100, 104, 20, 4, P.wood_light); },
  POI_RESEARCH_SQUARE(p, s) { p.rect(10, 96, 140, 24, '#b9a888'); hut(p, 14, 96, 50, 36, '#9a9070', '#6a6a5a', true); hut(p, 96, 96, 50, 36, '#9a9070', '#5a6a7a', true); bench(p, 64, 104, 32); sign(p, 80, 96); if (s === 'default') icon(p, 'SPC_GEN_CORE', 72, 56, 0.6); },
  POI_RADIO_WORKSHOP(p, s) { hut(p, 30, 110, 90, 48, '#7d8a96', '#4a5560', s === 'default'); p.line(130, 14, 130, 110, P.iron, 2); for (let y = 20; y < 70; y += 12) p.line(124, y, 136, y, P.iron); p.rect(58, 76, 30, 18, s === 'repaired' ? '#2b8a56' : '#3a4550'); p.set(84, 80, s === 'repaired' ? P.green : P.red); },
  POI_OLD_KITCHEN(p, s) { hut(p, 30, 110, 90, 44, '#b9a888', '#8a4a3a', true); p.rect(120, 30, 12, 40, P.stone); p.rect(52, 84, 30, 20, P.stone_dark); fire(p, 66, 100, s === 'default' ? 0.01 : 0.8); },
  POI_LOCKED_WAREHOUSE(p, s) { p.rect(20, 54, 120, 60, '#8a7a5a'); for (let x = 20; x < 140; x += 8) p.rect(x, 54, 1, 60, '#6a5a3a'); roofTri(p, 14, 30, 132, 26, '#5a6a7a'); door(p, 60, 72, 40, 42, s === 'default' ? P.wood_dark : '#2a1a10'); if (s === 'default') { p.rect(76, 88, 8, 10, P.iron); p.line(60, 92, 100, 92, P.iron_dark, 2); } },
  POI_SHALLOW_WRECK(p, s) { p.rect(0, 40, 160, 88, [69, 174, 181, 200]); boatWreck(p, 26, 104, 110, s !== 'default'); for (let i = 0; i < 6; i++) p.set(20 + i * 22, 60 + (i % 2) * 8, '#ffffff'); },
  POI_REEF_FISSURE(p, s) { p.rect(0, 30, 160, 98, [63, 163, 176, 210]); for (let k = 0; k < 8; k++) { const c = [P.coral, '#e8a0b0', '#f2d054', '#8e5bb5'][k % 4]; p.line(16 + k * 18, 120, 18 + k * 18, 88 - (k % 3) * 8, c, 4); } p.ellipse(80, 100, 16, 22, '#14303a'); if (s === 'default') crate(p, 72, 96, 16, 12); },
  POI_SAND_SPIT(p, s) { p.rect(0, 70, 160, 58, [69, 174, 181, 200]); p.ellipse(80, 98, 66, 14, '#e4d798'); for (const [x, fn] of [[50, 'MAT_SEASHELL'], [80, 'MAT_SEAWEED'], [110, 'TOOL_COMPASS']]) icon(p, fn, x - 8, 84, 0.5); if (s !== 'default') chest(p, 70, 74, 20, 14); },
  POI_LIGHTHOUSE(p, s) { rock(p, 80, 118, 60, 10, P.stone); lighthouse(p, 80, 118, s === 'repaired'); if (s === 'default') p.rect(102, 98, 16, 20, '#5c6b7a'); else p.rect(102, 98, 16, 20, '#2a4d8a'); },
  POI_LIGHTHOUSE_KEEPER(p, s) { hut(p, 40, 110, 70, 40, P.white, P.red_dark, s === 'default'); p.rect(118, 90, 6, 20, P.wood); if (s === 'default') icon(p, 'EQ_RAINCOAT', 112, 70, 0.6); },
  POI_CAPTAIN_CABIN(p, s) { p.rect(0, 90, 160, 38, [69, 174, 181, 200]); p.poly([[10, 96], [150, 70], [140, 110], [20, 118]], '#6a4a32'); p.rect(56, 56, 54, 30, '#7a5a3e'); windowP(p, 66, 62, 10, 8); windowP(p, 90, 62, 10, 8); if (s !== 'default') door(p, 78, 70, 10, 16, '#2a1a10'); },
  POI_ENGINE_ROOM(p, s) { p.rect(0, 80, 160, 48, [69, 174, 181, 200]); p.rect(30, 50, 100, 60, P.rust); p.rect(30, 50, 100, 4, '#b86a44'); valves(p, 60, 96, s === 'repaired'); p.circle(50, 70, 10, P.iron_dark); p.circle(110, 70, 10, P.iron_dark); },
  POI_CORAL_CHEST(p, s) { p.rect(0, 30, 160, 98, [63, 163, 176, 210]); for (let k = 0; k < 6; k++) p.line(20 + k * 24, 120, 22 + k * 24, 92, [P.coral, '#e8a0b0', '#f2d054'][k % 3], 5); chest(p, 62, 90, 36, 24, '#5a6a4a', P.coral, s !== 'default'); },
  POI_ABANDONED_GARDEN(p, s) { for (let i = 0; i < 3; i++) { p.rect(20 + i * 42, 90, 34, 20, P.wood); p.rect(22 + i * 42, 92, 30, 14, '#5a3e2a'); for (let k = 0; k < 4; k++) p.ellipse(27 + i * 42 + k * 7, 92, 3, 5, s === 'repaired' ? P.leaf : '#8a8a4a'); } p.rect(10, 80, 140, 4, s === 'repaired' ? '#5aa6c8' : '#7a6a5a'); },
  POI_HERB_GREENHOUSE(p, s) { greenhouse(p, 30, 110, 100, 50); if (s !== 'default') p.rect(70, 90, 20, 20, 'CLEAR'); },
  POI_ROCK_SHELTER(p, s) { rock(p, 80, 92, 70, 34, '#8a7a6a'); p.ellipse(80, 102, 30, 18, '#2a2420'); p.rect(50, 112, 60, 6, '#6a5a4a'); if (s === 'default') p.rect(70, 96, 20, 6, P.cloth); },
};

export function drawPOI(poiId, state) {
  const p = new Pix(160, 128);
  p.ellipse(80, 118, 70, 9, [20, 30, 30, 60]);
  const fn = POIS[poiId]; if (!fn) throw new Error('No POI painter ' + poiId);
  fn(p, state);
  // visible state marker so searched/repaired never look identical to default
  if (state === 'searched') { p.circle(148, 12, 6, '#3a8a5a'); p.line(145, 12, 147, 15, '#ffffff'); p.line(147, 15, 152, 9, '#ffffff'); }
  if (state === 'repaired') { p.circle(148, 12, 6, '#3a6aa8'); p.rect(146, 8, 4, 8, '#ffffff'); }
  p.outline(P.outline); p.rimShade(0.08, -0.1);
  return p;
}
