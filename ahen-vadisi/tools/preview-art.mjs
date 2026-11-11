// Geliştirme aracı: procedural sprite/tile çizimlerini tarayıcısız PNG önizlemesi olarak yazar.
// Kullanım: node tools/preview-art.mjs <çıktı.png> monsters|tiles [ölçek]
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { monsterSheet } from '../src/art/monsters.js';
import { PB } from '../src/art/pixel.js';

function png(w, h, rgba) {
  const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const [out, what = 'monsters', sc = '3'] = process.argv.slice(2);
const S = +sc;
const rows = [];
if (what === 'monsters') {
  const ids = (process.argv[5] || 'ash_imp,ash_hunter,crimson_scorpion,burnt_warrior,frost_wolf,ice_wisp,frost_sentinel,snow_shaman,ash_butcher,ice_warden,ash_giant,frozen_guardian,frost_crystal').split(',');
  for (const id of ids) rows.push(monsterSheet(id).frames);
} else if (what === 'icons') {
  // eşya, iksir, materyal ve beceri ikonları (hazır paket + procedural), 15'erli satırlar
  const { iconPB } = await import('../src/art/icons.js');
  const { ITEM_LIST } = await import('../src/data/items.js');
  const { POTION_LIST, MATERIAL_LIST } = await import('../src/data/materials.js');
  const { SKILLS } = await import('../src/data/skills.js');
  const keys = [...ITEM_LIST.map((t) => t.id), ...POTION_LIST.map((p) => p.id), ...MATERIAL_LIST.map((m) => m.id),
    ...Object.keys(SKILLS).map((id) => 'skill:' + id)];
  for (let i = 0; i < keys.length; i += 15) rows.push(keys.slice(i, i + 15).map((k) => iconPB(k)));
} else {
  const { TILE_DEFS } = await import('../src/world/tileRegistry.js');
  const tiles = await import('../src/art/tiles.js');
  rows.push(...tiles.previewRows(what));
}
const W = Math.max(...rows.map((r) => r.reduce((a, p) => a + p.w + 2, 0))) * S;
const H = rows.reduce((a, r) => a + Math.max(...r.map((p) => p.h)) + 2, 0) * S;
const buf = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) { buf[i * 4] = 70; buf[i * 4 + 1] = 90; buf[i * 4 + 2] = 70; buf[i * 4 + 3] = 255; }
let oy = 0;
for (const r of rows) {
  let ox = 0;
  for (const p of r) {
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      const v = p.d[y * p.w + x]; const a = v >>> 24; if (!a) continue;
      for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) {
        const i = (((oy + y) * S + dy) * W + (ox + x) * S + dx) * 4;
        buf[i] = v & 255; buf[i + 1] = (v >>> 8) & 255; buf[i + 2] = (v >>> 16) & 255; buf[i + 3] = 255;
      }
    }
    ox += p.w + 2;
  }
  oy += Math.max(...r.map((p) => p.h)) + 2;
}
writeFileSync(out, png(W, H, buf));
console.log('yazıldı', out, W, H);
