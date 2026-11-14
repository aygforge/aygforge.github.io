// Uygulama ikonlarını (PNG) bağımlılıksız üretir: pixel art gemi + gün batımı.
import zlib from 'node:zlib';
import fs from 'node:fs';

const MAP = [
  '................................',
  '................................',
  '...............r................',
  '...............rr...............',
  '...............k................',
  '.............wwkww..............',
  '............wwwkwww.............',
  '...........wwwwkwwww............',
  '...........wwwwkwwww....kww.....',
  '..........wwwwwkwwwww...kwww....',
  '..........wwwwwkwwwww...kwwww...',
  '..........wwwwwkwwwww...kwwwww..',
  '...........wwwwkwwww....kwwww...',
  '..........kkkkkkkkkkkkkkkkkkk...',
  '.......nnnnnnnnnnnnnnnnnnnnnnnk.',
  '........nyyyyyyyyyyyyyyyyyyyyk..',
  '.........nnnnnnnnnnnnnnnnnnnk...',
  '..........NNNNNNNNNNNNNNNNNk....',
];
const C = { k: [26, 20, 35], w: [244, 234, 213], r: [200, 66, 59], n: [139, 90, 43], N: [92, 58, 30], y: [242, 193, 78] };

function pixel(x, y, S) {
  const u = x / S, v = y / S;
  // gökyüzü gradyanı + güneş + deniz
  let col;
  if (v < 0.62) {
    const t = v / 0.62;
    col = [37 + t * 200, 34 + t * 110, 79 - t * 10];
    const dx = u - 0.5, dy = v - 0.6;
    if (dx * dx + dy * dy < 0.045) col = [255, 200, 110];
  } else col = Math.floor(v * 40) % 3 === 0 ? [95, 184, 201] : [36, 66, 107];
  const mx = Math.floor((u - 0.0) * 32), my = Math.floor((v - 0.22) * 32);
  const row = MAP[my];
  if (row && row[mx] && row[mx] !== '.') col = C[row[mx]];
  return col.map((c) => Math.max(0, Math.min(255, Math.round(c))));
}

function png(S) {
  const raw = Buffer.alloc((S * 3 + 1) * S);
  for (let y = 0; y < S; y++) {
    raw[y * (S * 3 + 1)] = 0;
    for (let x = 0; x < S; x++) {
      const [r, g, b] = pixel(x, y, S);
      const o = y * (S * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const dir = new URL('../assets/icons/', import.meta.url);
fs.mkdirSync(dir, { recursive: true });
for (const s of [192, 512]) fs.writeFileSync(new URL(`icon-${s}.png`, dir), png(s));
console.log('ikonlar üretildi');
