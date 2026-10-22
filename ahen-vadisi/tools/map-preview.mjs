// Geliştirme aracı: harita tanımını tarayıcısız PNG'ye çizer (zemin rengi, geçilmez kütle, damgalar, nesneler,
// alanlar ve 10'luk ızgara). Yeni harita tasarlarken ve NPC/görev nesnesi yerleştirirken kullanılır.
// Kullanım: node tools/map-preview.mjs <harita_id> <çıktı.png> [px/tile=8]
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { MAPS } from '../src/data/maps/index.js';
import { buildMap } from '../src/world/mapBuilder.js';

const [id, out, pxArg = '8'] = process.argv.slice(2);
const def = MAPS[id];
if (!def) { console.error('harita yok:', id, Object.keys(MAPS).join(',')); process.exit(1); }
const S = +pxArg;
const b = buildMap(def);
const W = def.w * S, H = def.h * S;
const buf = Buffer.alloc(W * H * 4);
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const COL = {
  grass: '#5c9a3e', forest_floor: '#3f6c2e', dirt: '#9a7448', cobble: '#8c867a', swamp: '#4c5c34', mud: '#5c4832', water: '#2f6c9c',
  swamp_water: '#2c4838', cave: '#544a44', crystal_floor: '#3c3e56', dungeon: '#4c4852', plank: '#8a6238', sand: '#c8b07e', ash: '#6e6662',
  scorched: '#463632', basalt: '#3c3a40', lava: '#c8401a', snow: '#dce6ee', ice: '#9ccbe4', frost_stone: '#8a96a6', frozen_water: '#2c5c80',
  temple_floor: '#5a6a80', ice_floor: '#7aa8c8',
  dead_grass: '#545a48', grave_soil: '#4a4038', ruin_cobble: '#6a6670', void_pool: '#4a2e66', obsidian: '#2a2630', royal_floor: '#4a3e52', crypt_floor: '#3e4040',
};
const px = (x, y, c, a = 1) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = buf[i] * (1 - a) + c[0] * a; buf[i + 1] = buf[i + 1] * (1 - a) + c[1] * a; buf[i + 2] = buf[i + 2] * (1 - a) + c[2] * a; buf[i + 3] = 255;
};
const rect = (x0, y0, w, h, c, a = 1) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) px(x, y, c, a); };
for (let ty = 0; ty < def.h; ty++) for (let tx = 0; tx < def.w; tx++) {
  const i = ty * def.w + tx;
  let c = hex(COL[b.terrain[i]] || '#ff00ff');
  if (b.mass[i]) c = [24, 30, 22];
  rect(tx * S, ty * S, S, S, c);
  if (!b.mass[i] && b.solid[i]) rect(tx * S + 1, ty * S + 1, S - 2, S - 2, [40, 30, 20], 0.7);
}
for (let ty = 0; ty < def.h; ty += 10) rect(0, ty * S, W, 1, [255, 255, 255], 0.25);
for (let tx = 0; tx < def.w; tx += 10) rect(tx * S, 0, 1, H, [255, 255, 255], 0.25);
for (const a of def.areas || []) {
  if (a.rect) continue;
  const c = a.spawns ? [255, 80, 60] : a.safePocket ? [80, 200, 255] : [255, 255, 120];
  for (let k = 0; k < 64; k++) { const t = (k / 64) * Math.PI * 2; px(Math.round((a.x + 0.5 + Math.cos(t) * a.r) * S), Math.round((a.y + 0.5 + Math.sin(t) * a.r) * S), c); }
}
const OBJ = { npc: [255, 230, 80], qobj: [80, 255, 255], escort: [120, 255, 120], defense: [255, 140, 255], portal: [180, 120, 255], waystone: [120, 180, 255], chest: [255, 200, 80], gather: [200, 200, 200], dungeon_gate: [255, 60, 255] };
for (const o of def.objects || []) {
  const c = OBJ[o.type] || [255, 255, 255];
  const r = o.type === 'npc' || o.type === 'escort' || o.type === 'defense' ? 2 : 1;
  rect(Math.round((o.x + 0.5) * S) - r * 2, Math.round((o.y + 0.5) * S) - r * 2, r * 4, r * 4, c);
  for (const [x, y] of o.route || []) rect(x * S + S / 2 - 1, y * S + S / 2 - 1, 3, 3, [120, 255, 120]);
}
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (bb) => { let c = -1; for (const x of bb) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(`${id}: ${def.w}×${def.h} → ${out}`);
