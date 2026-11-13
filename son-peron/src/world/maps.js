// Dört sahnenin deterministik harita üretimi. Ölçüler/bölgeler/portallar birleşik JSON'dan gelir.
import { mulberry } from './grid.js';

export const T = {
  VOID: 0, GRASS: 1, GRASS2: 2, DIRT: 3, PATH: 4, COBBLE: 5, PLATFORM: 6, PLATFORM_EDGE: 7, BALLAST: 8, RAIL: 9,
  WATER: 10, SAND: 11, FLOOR_OLD: 12, FLOOR_KITCHEN: 13, FLOOR_STORAGE: 14, FLOOR_BED: 15, WALL_TOP: 16, WALL_FACE: 17,
  DOOR: 18, FLOWERS: 19, FLOOR_NEW: 20, WOODF: 21, STONEF: 22, STONEPATH: 23, FIELD: 24, BRIDGE: 25, WATER2: 26, WALL_FRONT: 27, COUNT: 28
};

const SOLID_TILES = new Set([T.VOID, T.RAIL, T.BALLAST, T.WATER, T.WATER2, T.WALL_TOP, T.WALL_FACE, T.WALL_FRONT, T.FIELD]);

function blank(id, w, h, fill) {
  return { id, w, h, ground: new Uint8Array(w * h).fill(fill), solid: new Uint8Array(w * h), zone: new Int8Array(w * h).fill(-1), noPlace: new Uint8Array(w * h), objects: [], portals: [], nodes: [], points: {} };
}
const fillRect = (m, [l, t, r, b], tile) => { for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) m.ground[y * m.w + x] = tile; };
const inRect = (x, y, [l, t, r, b]) => x >= l && x <= r && y >= t && y <= b;
function finalize(m) {
  for (let i = 0; i < m.w * m.h; i++) if (SOLID_TILES.has(m.ground[i])) m.solid[i] = 1;
  for (const o of m.objects) if (o.solid) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.solid[y * m.w + x] = 1;
  for (const p of m.portals) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) m.solid[y * m.w + x] = 0;
  return m;
}
const obj = (m, kind, x, y, w = 1, h = 1, solid = true, extra = {}) => { const o = { kind, x, y, w, h, solid, ...extra }; m.objects.push(o); return o; };

// ---------------------------------------------------------------- İÇ MEKÂN
export const INTERIOR_ZONES = ['bedroom', 'dining', 'kitchen', 'storage', 'north_lounge', 'west_dining', 'east_kitchen', 'southeast_hall', 'east_storage'];
// Kanat dikdörtgenleri JSON'daki gibidir; komşu odayla ortak kenarda 1 hücrelik taşıyıcı duvar kanadın içinden ayrılır.
export function interiorZoneRects(C) {
  const base = Object.fromEntries(C.world.interior.base_walkable_zones.map((z) => [z.id, z.rect]));
  const wing = (id) => C.wings[id].rect;
  const n = wing('north_lounge'), w = wing('west_dining'), e = wing('east_kitchen'), s = wing('southeast_hall');
  return {
    bedroom: base.bedroom, dining: base.dining, kitchen: base.kitchen, storage: base.storage,
    north_lounge: [n[0] + 1, n[1], n[2], n[3]],
    west_dining: [w[0] + 1, w[1], w[2] - 1, w[3]],
    east_kitchen: [e[0] + 1, e[1], e[2], e[3]],
    southeast_hall: [s[0] + 1, s[1], s[2], s[3]],
    east_storage: [47, 5, 57, 12]
  };
}
export const INTERIOR_DOORS = {
  bedroom_dining: [11, 15], dining_kitchen: [30, 23], kitchen_storage: [39, 13], main_entrance: [16, 35],
  north_lounge: [23, 15], west_dining: [5, 25], east_kitchen: [47, 22], southeast_hall: [30, 33], east_storage: [46, 8]
};
const FLOOR_BY_ZONE = { bedroom: T.FLOOR_BED, dining: T.FLOOR_OLD, kitchen: T.FLOOR_KITCHEN, storage: T.FLOOR_STORAGE, north_lounge: T.FLOOR_NEW, west_dining: T.FLOOR_NEW, east_kitchen: T.FLOOR_KITCHEN, southeast_hall: T.FLOOR_NEW, east_storage: T.FLOOR_STORAGE };

export function buildInterior(C, unlocked) {
  const [W, H] = C.world.interior.full_grid;
  const m = blank('restaurant_interior', W, H, T.VOID);
  const rects = interiorZoneRects(C);
  const open = new Set(['bedroom', 'dining', 'kitchen', 'storage', ...unlocked]);
  m.zoneRects = {};
  INTERIOR_ZONES.forEach((z, zi) => {
    if (!open.has(z)) return;
    const r = rects[z]; m.zoneRects[z] = r;
    for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) { m.ground[y * W + x] = FLOOR_BY_ZONE[z]; m.zone[y * W + x] = zi; }
  });
  const doors = ['bedroom_dining', 'dining_kitchen', 'kitchen_storage', 'main_entrance', ...[...open].filter((z) => INTERIOR_DOORS[z])];
  m.doors = [];
  for (const d of doors) {
    const [x, y] = INTERIOR_DOORS[d];
    m.ground[y * W + x] = T.DOOR; m.doors.push({ id: d, x, y });
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.abs(dx) + Math.abs(dy) === 1) m.noPlace[(y + dy) * W + x + dx] = 1;
    m.noPlace[y * W + x] = 1;
  }
  // Giriş eşiği ve kapı kuyruğu alanı serbest kalır
  for (let y = 31; y <= 34; y++) for (let x = 14; x <= 19; x++) m.noPlace[y * W + x] = 1;
  // Duvarlar: zemine 8-komşu boş hücreler
  const fl = (g) => (g >= T.FLOOR_OLD && g <= T.FLOOR_BED) || g === T.DOOR || g === T.FLOOR_NEW;
  const isFloor = (x, y) => x >= 0 && y >= 0 && x < W && y < H && fl(m.ground[y * W + x]);
  const walls = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (m.ground[y * W + x] !== T.VOID) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (isFloor(x + dx, y + dy)) { near = true; break; }
    if (near) walls.push([x, y]);
  }
  for (const [x, y] of walls) m.ground[y * W + x] = isFloor(x, y + 1) ? T.WALL_FACE : (isFloor(x, y - 1) ? T.WALL_FRONT : T.WALL_TOP);
  m.portals.push({ x: 16, y: 35, w: 1, h: 1, to: 'railway_outdoors', tx: 54, ty: 45 });
  m.points = { entrance: [16, 34], queue: [[16, 32], [18, 32], [14, 32]], bedSide: [9, 7] };
  return finalize(m);
}

// Başlangıç demirbaşlarının yerleşimi (mobilya instance olarak state'e yazılır)
export const INTERIOR_START = [
  ['player_bed', 7, 5, 0], ['wardrobe', 10, 5, 0], ['letter_desk', 13, 9, 0],
  ['old_chest', 8, 18, 0], ['old_table', 10, 24, 0], ['old_chair', 9, 24, 3], ['old_chair', 12, 24, 1],
  ['bar_counter', 25, 22, 0], ['cleaning_cupboard', 28, 16, 0], ['project_board', 20, 16, 0], ['workbench', 26, 30, 0],
  ['starter_stove', 36, 14, 0], ['prep_counter', 40, 14, 0], ['depot_crate', 36, 6, 0]
];

// ---------------------------------------------------------------- DIŞ MEKÂN
export const GARDEN_START_BEDS = [[72, 36], [75, 36], [72, 39], [75, 39]];
export const OUTDOOR_PROPERTY = [40, 23, 90, 47];

export function buildOutdoors(C) {
  const sc = C.world.scenes.find((s) => s.id === 'railway_outdoors');
  const [W, H] = sc.size_tiles;
  const m = blank('railway_outdoors', W, H, T.GRASS);
  const rnd = mulberry(1907);
  const reg = Object.fromEntries(C.world.outdoors_regions.map((r) => [r.name, r.rect]));
  const pts = Object.fromEntries(C.world.outdoors_interaction_points.map((p) => [p.id, p.xy]));
  m.points = pts;
  for (let i = 0; i < W * H; i++) { const r = rnd(); if (r < 0.14) m.ground[i] = T.GRASS2; else if (r < 0.165) m.ground[i] = T.FLOWERS; }
  const rail = reg['Doğu-batı tren rayı'], plat = reg['Kuzey peronu'], gar = reg['Gar ve istasyon binası'], rest = reg['Restoran dış kabuğu'], forest = reg['Küçük orman'], garden = reg['Başlangıç bahçesi'];
  // Ray ve peron
  fillRect(m, [0, rail[1], W - 1, rail[3]], T.BALLAST);
  fillRect(m, [0, rail[1] + 1, W - 1, rail[3] - 1], T.RAIL);
  fillRect(m, [gar[0], 44, plat[2], 51], T.COBBLE);
  fillRect(m, plat, T.PLATFORM);
  fillRect(m, [plat[0], 56, plat[2], 56], T.PLATFORM_EDGE);
  // Ray güneyi: erişilemeyen tarlalar
  for (let y = rail[3] + 1; y < H; y++) for (let x = 0; x < W; x++) if (((x / 6) | 0) % 3 === ((y / 5) | 0) % 3 && y > rail[3] + 1) m.ground[y * W + x] = T.FIELD;
  // Yollar
  fillRect(m, [5, 48, W - 1, 49], T.PATH);          // ana doğu-batı yol
  fillRect(m, [0, 36, 6, 38], T.PATH);              // kasaba çıkışı
  fillRect(m, [5, 36, 6, 49], T.PATH);
  fillRect(m, [54, 45, 55, 48], T.PATH);            // restoran kapısı
  fillRect(m, [56, 47, 72, 47], T.PATH);            // posta/teslimat
  fillRect(m, [67, 23, 68, 47], T.PATH);            // orman/bahçe yolu
  fillRect(m, [53, 22, 68, 23], T.PATH);
  fillRect(m, [24, 44, 26, 52], T.PATH);            // gar → yol
  fillRect(m, [W - 6, 45, W - 1, 49], T.PATH);      // dere çıkışı
  // Binalar
  obj(m, 'restaurant_ext', rest[0] + 1, rest[1], rest[2] - rest[0] - 1, rest[3] - rest[1], true);
  obj(m, 'station_ext', gar[0] + 1, gar[1], 29, 5, true);
  // Kapı hücresi (binanın içine oyulmuş, yürünebilir portal)
  m.doorCell = [pts.restaurant_entrance[0], pts.restaurant_entrance[1] - 1];
  m.portals.push({ x: m.doorCell[0], y: m.doorCell[1], w: 1, h: 1, to: 'restaurant_interior', tx: 16, ty: 34 });
  m.portals.push({ x: 0, y: 36, w: 1, h: 3, to: 'town_square', tx: 58, ty: 21 });
  m.portals.push({ x: W - 1, y: 45, w: 1, h: 5, to: 'riverbank', tx: 1, ty: 15, needStage: C.river.stage });
  // Etkileşimli sabit nesneler
  obj(m, 'mailbox', pts.mailbox[0], pts.mailbox[1], 1, 1, true, { interact: 'mailbox' });
  obj(m, 'delivery_crate', pts.delivery_crate[0], pts.delivery_crate[1], 1, 1, true, { interact: 'crate' });
  for (const sp of C.quests.interactables) if (sp.scene === 'railway_outdoors') obj(m, sp.id, sp.tile_xy[0], sp.tile_xy[1], 1, 1, true, { interact: sp.id });
  obj(m, 'timetable', 27, 44, 1, 1, true, { interact: 'timetable' });
  obj(m, 'station_sign', 17, 52, 2, 1, true);
  for (const x of [11, 31]) obj(m, 'bench', x, 52, 2, 1, true);
  for (const x of [9, 22, 36]) obj(m, 'lamppost', x, 55, 1, 1, true, { light: true });
  for (const [x, y] of [[52, 46], [57, 46], [66, 49 + 1], [40, 50], [78, 50], [100, 50]]) obj(m, 'lamppost', x, y, 1, 1, true, { light: true });
  // Bahçe çiti ve kapısı
  const gate = pts.garden_entry;
  for (let x = garden[0]; x <= garden[2]; x++) for (const y of [garden[1], garden[3]]) obj(m, 'fence', x, y, 1, 1, true);
  for (let y = garden[1] + 1; y < garden[3]; y++) for (const x of [garden[0], garden[2]]) if (!(x === gate[0] && (y === gate[1] || y === gate[1] - 1))) obj(m, 'fence', x, y, 1, 1, true);
  fillRect(m, [garden[0] + 1, garden[1] + 1, garden[2] - 1, garden[3] - 1], T.GRASS);
  fillRect(m, [garden[0], gate[1] - 1, garden[0] + 2, gate[1]], T.PATH);
  obj(m, 'well', 80, 30, 2, 2, true);
  // Orman: kaynak düğümleri + dekoratif ağaçlar
  const taken = new Set();
  const free = (x, y) => !taken.has(x + ',' + y) && m.ground[y * W + x] !== T.PATH;
  const node = (kind, x, y) => { taken.add(x + ',' + y); m.nodes.push({ id: `${kind}_${x}_${y}`, kind, x, y }); };
  // Girişe yakın garantili başlangıç kaynakları (15 odun + 5 taş için fazlasıyla yeterli)
  for (const [x, y] of [[50, 19], [52, 17], [57, 18], [59, 20], [48, 16], [61, 16], [55, 14], [46, 20], [63, 19]]) node('tree', x, y);
  for (const [x, y] of [[51, 21], [58, 21], [49, 18], [60, 18], [54, 16]]) node('rock', x, y);
  for (const [x, y] of [[56, 20], [47, 18]]) node('mushroom', x, y);
  for (const [x, y] of [[53, 19], [62, 21]]) node('berry', x, y);
  for (let y = forest[1] + 1; y <= forest[3] - 1; y++) for (let x = forest[0] + 1; x <= forest[2] - 1; x++) {
    if (!free(x, y) || (Math.abs(x - 54) < 3 && y > 18)) continue;
    let near = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (taken.has((x + dx) + ',' + (y + dy))) near = true;
    if (near) continue;
    const r = rnd();
    if (r < 0.085) node('tree', x, y); else if (r < 0.11) node('rock', x, y); else if (r < 0.122) node('mushroom', x, y); else if (r < 0.136) node('berry', x, y);
  }
  // Dekoratif (kesilemeyen) ağaçlar: harita kenarları, batı çayırı, ray güneyi
  const deco = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const g = m.ground[y * W + x]; if (g === T.PATH || g === T.COBBLE || g === T.PLATFORM || g === T.RAIL || g === T.BALLAST || g === T.PLATFORM_EDGE || taken.has(x + ',' + y)) return; for (const o of m.objects) if (x >= o.x - 1 && x <= o.x + o.w && y >= o.y - 1 && y <= o.y + o.h) return; taken.add(x + ',' + y); obj(m, 'pine', x, y, 1, 1, true); };
  for (let x = 0; x < W; x += 2) { deco(x, 0); if (rnd() < 0.6) deco(x + 1, 1); }
  for (let y = 2; y < 34; y += 2) { deco(0, y); deco(W - 1, y); if (rnd() < 0.5) deco(1, y + 1); if (rnd() < 0.5) deco(W - 2, y + 1); }
  for (let i = 0; i < 90; i++) { const x = 2 + ((rnd() * 31) | 0), y = 2 + ((rnd() * 32) | 0); deco(x, y); }
  for (let i = 0; i < 60; i++) { const x = 100 + ((rnd() * 14) | 0), y = 2 + ((rnd() * 40) | 0); deco(x, y); }
  for (let i = 0; i < 110; i++) { const x = (rnd() * W) | 0, y = 62 + ((rnd() * 19) | 0); if (m.ground[y * W + x] !== T.FIELD) deco(x, y); }
  for (let i = 0; i < 26; i++) { const x = 40 + ((rnd() * 70) | 0), y = 51 + ((rnd() * 5) | 0); deco(x, y); }
  // Küçük gölet
  fillRect(m, [92, 28, 98, 33], T.WATER); fillRect(m, [93, 27, 97, 34], T.WATER);
  m.forest = forest; m.garden = garden; m.platform = plat; m.railY = rail[1] + 1;
  return finalize(m);
}

// ---------------------------------------------------------------- KASABA
export function buildTown(C) {
  const sc = C.world.scenes.find((s) => s.id === 'town_square');
  const [W, H] = sc.size_tiles;
  const m = blank('town_square', W, H, T.GRASS);
  const rnd = mulberry(424);
  for (let i = 0; i < W * H; i++) { const r = rnd(); if (r < 0.12) m.ground[i] = T.GRASS2; else if (r < 0.15) m.ground[i] = T.FLOWERS; }
  fillRect(m, [16, 16, 44, 30], T.COBBLE);                // meydan
  fillRect(m, [44, 20, W - 1, 22], T.PATH);               // gar yolu (doğu)
  fillRect(m, [8, 15, 52, 16], T.PATH);                   // dükkân önü
  fillRect(m, [8, 30, 54, 32], T.PATH);
  fillRect(m, [8, 15, 9, 32], T.PATH); fillRect(m, [51, 15, 52, 32], T.PATH);
  obj(m, 'shop_grocer', 9, 8, 9, 6, true); obj(m, 'shop_carpenter', 25, 8, 9, 6, true); obj(m, 'shop_greenhouse', 41, 8, 9, 6, true);
  obj(m, 'house_a', 5, 33, 7, 5, true); obj(m, 'house_b', 41, 34, 7, 5, true); obj(m, 'house_c', 50, 35, 7, 5, true); obj(m, 'house_a', 20, 35, 7, 5, true);
  obj(m, 'fountain', 29, 21, 3, 3, true);
  for (const [x, y] of [[22, 27], [36, 27], [22, 18], [36, 18]]) obj(m, 'bench', x, y, 2, 1, true);
  for (const [x, y] of [[17, 17], [43, 17], [17, 29], [43, 29]]) obj(m, 'lamppost', x, y, 1, 1, true, { light: true });
  for (const [x, y] of [[20, 22], [25, 19], [38, 22], [34, 25]]) obj(m, 'festival_stall', x, y, 2, 1, false, { festivalOnly: true });
  obj(m, 'town_board', 31, 17, 1, 1, true, { interact: 'town_board' });
  const taken = new Set();
  const deco = (x, y) => { if (taken.has(x + ',' + y)) return; const g = m.ground[y * W + x]; if (g === T.PATH || g === T.COBBLE) return; for (const o of m.objects) if (x >= o.x - 1 && x <= o.x + o.w && y >= o.y - 1 && y <= o.y + o.h) return; taken.add(x + ',' + y); obj(m, 'pine', x, y, 1, 1, true); };
  for (let x = 0; x < W; x += 2) { deco(x, 0); deco(x, H - 1); if (rnd() < 0.5) deco(x + 1, 1); }
  for (let y = 2; y < H - 1; y += 2) { deco(0, y); if (y < 18 || y > 24) deco(W - 1, y); }
  for (let i = 0; i < 70; i++) deco(1 + ((rnd() * (W - 2)) | 0), 1 + ((rnd() * (H - 2)) | 0));
  m.portals.push({ x: W - 1, y: 20, w: 1, h: 3, to: 'railway_outdoors', tx: 1, ty: 37 });
  m.points = { arrive: [58, 21] };
  return finalize(m);
}

// ---------------------------------------------------------------- DERE KENARI
export function buildRiver(C) {
  const sc = C.world.scenes.find((s) => s.id === 'riverbank');
  const [W, H] = sc.size_tiles;
  const m = blank('riverbank', W, H, T.GRASS);
  const rnd = mulberry(77);
  for (let i = 0; i < W * H; i++) { const r = rnd(); if (r < 0.15) m.ground[i] = T.GRASS2; else if (r < 0.19) m.ground[i] = T.FLOWERS; }
  for (let x = 0; x < W; x++) { const off = Math.round(Math.sin(x / 5) * 1.5); for (let y = 19 + off; y <= 26 + off; y++) m.ground[y * W + x] = (y - off) % 3 === 0 ? T.WATER2 : T.WATER; m.ground[(18 + off) * W + x] = T.SAND; m.ground[(27 + off) * W + x] = T.SAND; }
  fillRect(m, [0, 14, 22, 16], T.PATH); fillRect(m, [22, 12, 25, 17], T.PATH);
  fillRect(m, [24, 17, 24, 21], T.BRIDGE);                // iskele
  obj(m, 'rod_stand', 20, 12, 2, 1, true, { interact: 'rod_stand' });
  obj(m, 'fishing_spot', 24, 22, 1, 1, false, { interact: 'fishing' });
  obj(m, 'bench', 28, 15, 2, 1, true);
  const taken = new Set();
  const deco = (x, y) => { if (taken.has(x + ',' + y) || y > 16 && y < 30) return; const g = m.ground[y * W + x]; if (g !== T.GRASS && g !== T.GRASS2 && g !== T.FLOWERS) return; if (y >= 11 && y <= 17 && x <= 30) return; taken.add(x + ',' + y); obj(m, 'pine', x, y, 1, 1, true); };
  for (let x = 0; x < W; x += 2) { deco(x, 0); deco(x, H - 1); }
  for (let i = 0; i < 70; i++) deco((rnd() * W) | 0, (rnd() * H) | 0);
  m.portals.push({ x: 0, y: 14, w: 1, h: 3, to: 'railway_outdoors', tx: 114, ty: 47 });
  m.points = { fishStand: [24, 20] };
  return finalize(m);
}

export const SCENE_NAMES = { railway_outdoors: 'Gar ve Lokanta Çevresi', restaurant_interior: 'Miras Lokantası', town_square: 'Peronova Meydanı', riverbank: 'Dere Kenarı' };
