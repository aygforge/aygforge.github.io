// Kepçe Ustası — özgün pixel art (PNG) ve ses efekti (WAV) üretici.
// Tüm varlıklar bu betikte prosedürel olarak çizilir/sentezlenir; dış kaynak kullanılmaz.
// Çalıştırma: npm run assets  ->  public/assets/** dosyalarını yeniden yazar.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');

// ---------------------------------------------------------------- PNG
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- pixel canvas
function hex(c) {
  if (!c) return [0, 0, 0, 0];
  const s = c.replace('#', '');
  const v = parseInt(s.slice(0, 6), 16);
  const a = s.length > 6 ? parseInt(s.slice(6, 8), 16) : 255;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255, a];
}
class Px {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = Buffer.alloc(w * h * 4);
  }
  set(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b, a] = hex(c);
    const i = (y * this.w + x) * 4;
    this.d[i] = r;
    this.d[i + 1] = g;
    this.d[i + 2] = b;
    this.d[i + 3] = a;
  }
  alpha(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  hline(x0, x1, y, c) {
    for (let x = x0; x <= x1; x++) this.set(x, y, c);
  }
  vline(x, y0, y1, c) {
    for (let y = y0; y <= y1; y++) this.set(x, y, c);
  }
  // Shaded ellipse: light from upper-left.
  ball(cx, cy, rx, ry, base, light, dark, spec) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const l = nx * 0.7 + ny * 0.7;
        let c = base;
        if (l < -0.45) c = light;
        else if (l > 0.42 || d > 0.82) c = dark;
        this.set(x, y, c);
      }
    }
    if (spec) {
      this.set(cx - rx * 0.45, cy - ry * 0.5, spec);
      this.set(cx - rx * 0.45 + 1, cy - ry * 0.5, spec);
      this.set(cx - rx * 0.45, cy - ry * 0.5 + 1, spec);
    }
  }
  outline(c) {
    const add = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y)) continue;
        if (this.alpha(x - 1, y) > 128 || this.alpha(x + 1, y) > 128 || this.alpha(x, y - 1) > 128 || this.alpha(x, y + 1) > 128) add.push([x, y]);
      }
    for (const [x, y] of add) this.set(x, y, c);
  }
  save(rel) {
    const p = join(ROOT, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, encodePNG(this.w, this.h, this.d));
    count.png++;
  }
}
const count = { png: 0, wav: 0 };

// faces ---------------------------------------------------------------
function eyes(p, x1, x2, y, opts = {}) {
  for (const x of [x1, x2]) {
    p.set(x, y, '#ffffff');
    p.set(x + 1, y, '#ffffff');
    p.set(x, y + 1, '#ffffff');
    p.set(x + 1, y + 1, '#1b1b25');
  }
  if (opts.angry) {
    p.set(x1 - 1, y - 1, '#2a1010');
    p.set(x1, y - 1, '#2a1010');
    p.set(x2 + 1, y - 1, '#2a1010');
    p.set(x2 + 2, y - 1, '#2a1010');
    p.set(x1 + 1, y - 2 + 2 - 1, '#2a1010');
  }
}

// ---------------------------------------------------------------- characters
function chef() {
  const p = new Px(26, 33);
  // toque
  p.ball(9, 4, 6, 3.6, '#ffffff', '#ffffff', '#d9dde3');
  p.ball(5, 5, 3, 2.6, '#ffffff', '#ffffff', '#d9dde3');
  p.ball(13, 5, 3, 2.6, '#f4f6f8', '#ffffff', '#d9dde3');
  p.rect(5, 6, 9, 4, '#f4f6f8');
  p.hline(5, 13, 9, '#c9ced6');
  // face (facing right)
  p.rect(6, 10, 9, 6, '#f1c27d');
  p.rect(6, 15, 8, 1, '#d9a35f');
  p.set(15, 12, '#f1c27d');
  p.set(15, 13, '#f1c27d');
  p.set(12, 11, '#ffffff');
  p.set(13, 11, '#1b1b25');
  p.set(12, 12, '#1b1b25');
  p.set(13, 12, '#1b1b25');
  p.hline(11, 14, 14, '#6b3b1f'); // moustache
  p.set(7, 11, '#d9a35f');
  p.set(7, 12, '#e8b06c');
  p.rect(5, 10, 2, 4, '#6b3b1f'); // hair at the back
  // neckerchief
  p.rect(6, 16, 9, 2, '#d8432f');
  p.set(9, 18, '#d8432f');
  p.set(10, 18, '#b5341f');
  // jacket
  p.rect(4, 18, 12, 9, '#f4f6f8');
  p.vline(4, 18, 26, '#d0d5dc');
  p.vline(15, 18, 26, '#d0d5dc');
  for (const y of [19, 22, 25]) {
    p.set(9, y, '#9aa3ad');
    p.set(12, y, '#9aa3ad');
  }
  // apron
  p.rect(6, 23, 9, 5, '#e9edf2');
  p.hline(6, 14, 23, '#c3cad3');
  // arm forward holding the squeeze bottle
  p.rect(13, 19, 5, 3, '#f4f6f8');
  p.rect(17, 19, 2, 3, '#f1c27d');
  // squeeze bottle (sos sıkma aparatı)
  p.rect(16, 17, 6, 6, '#f2b632');
  p.rect(16, 17, 6, 1, '#ffd96a');
  p.rect(16, 22, 6, 1, '#c48618');
  p.rect(22, 18, 2, 2, '#e85a3c');
  p.set(24, 19, '#e85a3c');
  p.set(25, 19, '#ffcf4a');
  // legs
  p.rect(6, 28, 3, 4, '#3b4252');
  p.rect(11, 28, 3, 4, '#3b4252');
  p.rect(5, 31, 4, 1, '#1d1f27');
  p.rect(11, 31, 4, 1, '#1d1f27');
  p.outline('#2a2230');
  p.save('chefs/chef.png');
}

function tomato(file, size = 16, angry = false) {
  const s = size / 16;
  const p = new Px(size, size);
  p.ball(8 * s, 9.2 * s, 7 * s, 6 * s, '#e8402e', '#ff7a5c', '#b02a20', '#ffd2c2');
  // leaves
  const cx = 8 * s;
  const ly = 3 * s;
  for (let i = -3; i <= 3; i++) p.set(cx + i * s * 0.9, ly + Math.abs(i) * 0.4 * s, i % 2 ? '#2e7d32' : '#4caf3a');
  p.rect(cx - 1 * s, ly - 1.5 * s, 2 * s, 2 * s, '#4caf3a');
  p.set(cx, ly - 2 * s, '#2e7d32');
  if (size >= 30) {
    // giant tomato face
    eyes(p, 10, 19, 13, { angry: true });
    p.rect(9, 12, 4, 1, '#3a1410');
    p.rect(19, 12, 4, 1, '#3a1410');
    p.set(9, 11, '#3a1410');
    p.set(22, 11, '#3a1410');
    p.rect(11, 20, 10, 3, '#5a1410');
    for (let x = 12; x < 20; x += 2) p.set(x, 20, '#ffffff');
    p.set(6, 16, '#ff9b86');
    p.set(25, 16, '#ff9b86');
  } else {
    eyes(p, 5, 9, 8, { angry });
    p.hline(6, 9, 12, '#5a1410');
  }
  p.outline('#3a1410');
  p.save(file);
}

function pepper() {
  const p = new Px(13, 21);
  p.ball(6.5, 12, 4.6, 7.4, '#43a047', '#7cd16b', '#2e7031', '#c9f5b8');
  p.ball(7, 18, 2.4, 2.2, '#43a047', '#7cd16b', '#2e7031');
  p.rect(4, 3, 6, 2, '#5d8a2f');
  p.rect(6, 0, 2, 3, '#6f9f3a');
  p.set(8, 0, '#6f9f3a');
  eyes(p, 4, 7, 9, { angry: true });
  p.hline(5, 8, 13, '#173d1a');
  p.outline('#173018');
  p.save('enemies/pepper.png');
}

function egg() {
  const p = new Px(14, 17);
  p.ball(7, 9.4, 5.6, 6.8, '#f7f2e4', '#ffffff', '#d8cfb8', '#ffffff');
  eyes(p, 4, 8, 8);
  p.set(6, 12, '#b3593b');
  p.set(7, 12, '#b3593b');
  p.set(3, 11, '#f3b7a2');
  p.set(11, 11, '#f3b7a2');
  p.outline('#4a3b2a');
  p.save('enemies/egg.png');
}

function potatoBody(p, cx, cy, rx, ry) {
  p.ball(cx, cy, rx, ry, '#c9a063', '#e2c07f', '#9a7442', '#f1dcaa');
  const spots = [[-0.5, 0.3], [0.4, 0.5], [0.6, -0.2], [-0.1, 0.6]];
  for (const [sx, sy] of spots) p.set(cx + sx * rx, cy + sy * ry, '#8a6236');
}

function potato() {
  const p = new Px(17, 15);
  potatoBody(p, 8.5, 8, 7.6, 5.8);
  eyes(p, 5, 10, 6);
  p.hline(7, 10, 10, '#4b3016');
  p.outline('#3b2612');
  p.save('enemies/potato.png');
}

function armoredPotato() {
  const p = new Px(19, 18);
  potatoBody(p, 9.5, 11, 8, 5.8);
  // helmet
  for (let y = 2; y <= 8; y++) {
    const half = Math.round(Math.sqrt(Math.max(0, 1 - ((y - 8) / 6.5) ** 2)) * 8.5);
    for (let x = 9 - half; x <= 9 + half; x++) p.set(x + 0.5, y, x < 7 ? '#cfd6dc' : x > 13 ? '#6b747c' : '#9aa4ad');
  }
  p.hline(1, 18, 8, '#6b747c');
  p.set(5, 6, '#ffffff');
  p.set(13, 6, '#e8edf1');
  p.set(9, 3, '#e8edf1');
  // side plate
  p.rect(14, 11, 4, 4, '#8b949c');
  p.set(15, 12, '#cfd6dc');
  eyes(p, 6, 11, 10, { angry: true });
  p.hline(8, 11, 14, '#4b3016');
  p.outline('#262a30');
  p.save('enemies/armored_potato.png');
}

function salt() {
  const p = new Px(12, 18);
  // cap
  p.rect(2, 1, 8, 4, '#9aa4ad');
  p.hline(2, 9, 1, '#cfd6dc');
  p.hline(2, 9, 4, '#6b747c');
  p.set(4, 2, '#3b4148');
  p.set(7, 2, '#3b4148');
  p.set(5, 3, '#3b4148');
  // glass body
  p.rect(1, 5, 10, 12, '#eef3f7');
  p.vline(1, 5, 16, '#ffffff');
  p.vline(10, 5, 16, '#c3ccd4');
  p.hline(1, 10, 16, '#c3ccd4');
  for (const [x, y] of [[3, 13], [6, 14], [8, 12], [4, 15], [7, 15], [2, 14]]) p.set(x, y, '#c9d3db');
  eyes(p, 3, 7, 8);
  p.hline(5, 6, 11, '#4a5560');
  p.outline('#2b323a');
  p.save('enemies/salt.png');
}

function potatoKing() {
  const p = new Px(36, 36);
  potatoBody(p, 18, 22, 15, 12);
  // crown
  p.rect(9, 6, 18, 5, '#f2c230');
  p.hline(9, 26, 10, '#c48f12');
  for (const x of [9, 14, 19, 24]) {
    p.rect(x, 3, 3, 3, '#f2c230');
    p.set(x + 1, 2, '#ffe27a');
  }
  p.set(12, 8, '#e0413a');
  p.set(18, 8, '#3a7de0');
  p.set(23, 8, '#e0413a');
  p.hline(10, 25, 6, '#ffe27a');
  // face
  eyes(p, 12, 21, 18, { angry: true });
  p.rect(11, 17, 4, 1, '#3b2612');
  p.rect(21, 17, 4, 1, '#3b2612');
  // moustache
  p.hline(13, 22, 24, '#5a3a1a');
  p.hline(12, 15, 25, '#5a3a1a');
  p.hline(20, 23, 25, '#5a3a1a');
  p.hline(15, 20, 27, '#4b3016');
  p.outline('#2e1d0e');
  p.save('bosses/potato_king.png');
}

function oils() {
  const n = new Px(8, 8);
  n.ball(4, 4, 3.6, 3.6, '#f6c445', '#fff1a8', '#d39324', '#ffffff');
  n.outline('#7a4a10');
  n.save('oils/oil_normal.png');
  const b = new Px(11, 11);
  b.ball(5.5, 5.5, 5, 5, '#f0a032', '#ffd27a', '#c26f16', '#ffffff');
  b.set(7, 7, '#b0600f');
  b.outline('#6a3608');
  b.save('oils/oil_big.png');
}

// ---------------------------------------------------------------- kitchen & ui
function pan() {
  const p = new Px(30, 10);
  p.rect(9, 2, 20, 6, '#3a3f48');
  p.hline(9, 28, 2, '#6b7380');
  p.hline(10, 27, 7, '#22252b');
  p.rect(11, 3, 16, 3, '#2a2e35');
  p.rect(0, 3, 9, 2, '#7a4a2a');
  p.hline(0, 8, 3, '#9c6438');
  p.outline('#121418');
  p.save('kitchen/pan.png');
}

function dishes() {
  const m = new Px(32, 20);
  m.rect(4, 6, 26, 10, '#3a3f48');
  m.hline(4, 29, 6, '#6b7380');
  m.rect(6, 7, 22, 7, '#e8582f');
  for (const [x, y] of [[9, 9], [16, 8], [22, 10], [12, 12], [25, 8]]) {
    m.rect(x, y, 3, 2, '#fff4d6');
    m.set(x + 1, y, '#f7c21c');
  }
  for (const [x, y] of [[8, 12], [19, 12], [14, 10]]) m.rect(x, y, 2, 1, '#4caf3a');
  m.rect(0, 9, 4, 2, '#7a4a2a');
  m.outline('#141418');
  m.save('kitchen/dish_menemen.png');
  const f = new Px(26, 26);
  for (let i = 0; i < 9; i++) {
    const x = 5 + i * 2;
    const top = 2 + ((i * 5) % 4);
    f.rect(x, top, 2, 12, i % 2 ? '#f5c242' : '#ffd866');
    f.set(x, top, '#e2a628');
  }
  for (let y = 10; y < 24; y++) {
    const half = Math.round(10 - (y - 10) * 0.45);
    f.hline(13 - half, 12 + half, y, y % 4 === 0 ? '#ffffff' : '#d8402f');
  }
  for (const [x, y] of [[8, 4], [15, 3], [19, 6]]) f.set(x, y, '#ffffff');
  f.outline('#3a1610');
  f.save('kitchen/dish_fries.png');
}

function icons() {
  const heart = new Px(9, 8);
  const hm = ['.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];
  hm.forEach((row, y) => [...row].forEach((ch, x) => ch === 'X' && heart.set(x, y, y < 2 && x < 4 ? '#ff8a8a' : '#e23b3b')));
  heart.set(1, 1, '#ffd0d0');
  heart.outline('#5a1010');
  heart.save('ui/heart.png');
  const empty = new Px(9, 8);
  hm.forEach((row, y) => [...row].forEach((ch, x) => ch === 'X' && empty.set(x, y, '#4a3a44')));
  empty.outline('#1e1418');
  empty.save('ui/heart_empty.png');

  const sh = new Px(9, 10);
  const sm = ['XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];
  sm.forEach((row, y) => [...row].forEach((ch, x) => ch === 'X' && sh.set(x, y, x < 4 ? '#8fc6f0' : '#4f8fc9')));
  sh.vline(4, 1, 7, '#dff0ff');
  sh.outline('#1b2e4a');
  sh.save('ui/shield.png');

  const coin = new Px(10, 10);
  coin.ball(5, 5, 4.5, 4.5, '#f2c230', '#ffe27a', '#c48f12');
  coin.vline(5, 2, 7, '#a8740a');
  coin.hline(3, 6, 3, '#a8740a');
  coin.hline(3, 6, 6, '#a8740a');
  coin.outline('#5a3a06');
  coin.save('ui/coin.png');

  const starPts = (p, c, cd) => {
    const cx = 6;
    const cy = 6.3;
    for (let y = 0; y < 13; y++)
      for (let x = 0; x < 13; x++) {
        const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
        const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        const k = (a + Math.PI / 2 + Math.PI * 2) % ((Math.PI * 2) / 5);
        const lim = 2.6 + 3.6 * Math.abs(1 - k / (Math.PI / 5));
        if (r <= lim) p.set(x, y, y < 6 ? c : cd);
      }
  };
  const star = new Px(13, 13);
  starPts(star, '#ffd84a', '#f2b11c');
  star.outline('#6a4606');
  star.save('ui/star.png');
  const star0 = new Px(13, 13);
  starPts(star0, '#5c5468', '#4a4256');
  star0.outline('#1e1a26');
  star0.save('ui/star_empty.png');

  const fast = new Px(9, 7);
  for (let i = 0; i < 4; i++) {
    fast.set(i, i, '#ffd84a');
    fast.set(i, 6 - i, '#ffd84a');
    fast.set(i + 4, i, '#ff9f2a');
    fast.set(i + 4, 6 - i, '#ff9f2a');
  }
  fast.outline('#4a2a06');
  fast.save('ui/fast.png');

  const flame = (file, h) => {
    const p = new Px(10, 14);
    for (let y = 14 - h; y < 14; y++) {
      const t = (y - (14 - h)) / (h - 1); // 0 tip .. 1 base
      const w = 4.6 * Math.sqrt(t) * (t > 0.82 ? 1 - (t - 0.82) * 2.2 : 1);
      for (let x = 0; x < 10; x++) {
        const dx = Math.abs(x + 0.5 - 5);
        if (dx > w) continue;
        const inner = dx < w * 0.5 && t > 0.35;
        p.set(x, y, t > 0.86 ? '#3f7bff' : inner ? '#fff2a0' : t < 0.3 ? '#ff5a1a' : '#ffa81f');
      }
    }
    p.save(file);
  };
  flame('kitchen/flame1.png', 12);
  flame('kitchen/flame2.png', 10);

  const bubble = new Px(5, 5);
  bubble.ball(2.5, 2.5, 2, 2, '#ffe9a0', '#ffffff', '#e9b94a');
  bubble.save('kitchen/bubble.png');

  const spark = new Px(5, 5);
  spark.set(2, 0, '#fff4c0');
  spark.set(2, 4, '#fff4c0');
  spark.set(0, 2, '#fff4c0');
  spark.set(4, 2, '#fff4c0');
  spark.rect(1, 1, 3, 3, '#ffd23a');
  spark.set(2, 2, '#ffffff');
  spark.save('ui/spark.png');
}

function backgrounds() {
  // battle kitchen (180 x 170): tiled wall strip + floor tiles
  const b = new Px(180, 170);
  for (let y = 0; y < 44; y++)
    for (let x = 0; x < 180; x++) {
      const grout = x % 12 === 0 || y % 10 === 0;
      b.set(x, y, grout ? '#b9c7c9' : (Math.floor(x / 12) + Math.floor(y / 10)) % 2 ? '#e8efe9' : '#dfe8e3');
    }
  // shelf with jars
  b.rect(0, 30, 180, 3, '#8a5a34');
  b.hline(0, 179, 30, '#b07a4a');
  b.hline(0, 179, 33, '#5a3a20');
  const jars = [[14, '#e8402e'], [26, '#f2c230'], [40, '#4caf3a'], [120, '#c9a063'], [134, '#eef3f7'], [150, '#e8582f'], [164, '#7a4a2a']];
  for (const [x, c] of jars) {
    b.rect(x, 21, 8, 9, '#cfe3ea');
    b.rect(x + 1, 24, 6, 6, c);
    b.rect(x, 19, 8, 2, '#6b747c');
  }
  // window
  b.rect(70, 4, 40, 24, '#6b4a2e');
  b.rect(72, 6, 36, 20, '#9fd3f2');
  b.rect(72, 18, 36, 8, '#bfe6fb');
  b.vline(90, 6, 25, '#6b4a2e');
  b.hline(72, 107, 15, '#6b4a2e');
  b.rect(75, 8, 5, 2, '#ffffff');
  // baseboard
  b.rect(0, 44, 180, 3, '#5a3a20');
  // floor tiles
  for (let y = 47; y < 170; y++)
    for (let x = 0; x < 180; x++) {
      const tx = Math.floor(x / 15);
      const ty = Math.floor((y - 47) / 13);
      const edge = x % 15 === 0 || (y - 47) % 13 === 0;
      b.set(x, y, edge ? '#b48f68' : (tx + ty) % 2 ? '#e3c9a2' : '#d8ba90');
    }
  b.save('kitchen/battle_bg.png');

  // stove counter strip (180 x 12)
  const s = new Px(180, 12);
  s.rect(0, 0, 180, 12, '#59606b');
  s.hline(0, 179, 0, '#9aa4ad');
  s.hline(0, 179, 1, '#7b848f');
  s.hline(0, 179, 11, '#2e333a');
  for (let x = 6; x < 180; x += 20) s.rect(x, 4, 8, 4, '#3b4148');
  s.save('kitchen/counter.png');

  // stove front (180 x 60) below the pot
  const st = new Px(180, 60);
  st.rect(0, 0, 180, 60, '#3b4148');
  for (let x = 0; x < 180; x += 6) st.vline(x, 0, 59, '#353a41');
  st.hline(0, 179, 0, '#6b747c');
  for (const kx of [20, 160]) {
    st.ball(kx, 30, 6, 6, '#c9ced6', '#ffffff', '#8b949c');
    st.rect(kx - 1, 25, 2, 5, '#3b4148');
  }
  st.rect(40, 10, 100, 40, '#22262c');
  st.rect(42, 12, 96, 36, '#2b3038');
  st.hline(42, 137, 12, '#4a515b');
  st.save('kitchen/stove.png');

  // restaurant menu background (180 x 320)
  const r = new Px(180, 320);
  for (let y = 0; y < 320; y++)
    for (let x = 0; x < 180; x++) {
      let c = '#c8693f';
      if (y < 190) c = (x + y) % 23 === 0 ? '#bb5f37' : y % 32 === 0 ? '#b45a33' : '#c8693f';
      r.set(x, y, c);
    }
  // wainscot
  for (let y = 150; y < 190; y++) for (let x = 0; x < 180; x++) r.set(x, y, x % 10 === 0 ? '#5e3a20' : '#7a4c2a');
  r.hline(0, 179, 150, '#a8703f');
  // windows
  for (const wx of [14, 118]) {
    r.rect(wx, 40, 48, 60, '#5e3a20');
    r.rect(wx + 3, 43, 42, 54, '#ffcf7a');
    r.rect(wx + 3, 70, 42, 27, '#f7a85a');
    r.vline(wx + 24, 43, 96, '#5e3a20');
    r.hline(wx + 3, wx + 44, 66, '#5e3a20');
    r.rect(wx + 6, 76, 10, 6, '#d06a3a');
    r.rect(wx - 2, 100, 52, 3, '#a8703f');
  }
  // sign board
  r.rect(60, 14, 60, 22, '#3a2416');
  r.rect(62, 16, 56, 18, '#5a3a20');
  // hanging pans
  for (const [px, py] of [[74, 54], [92, 58], [108, 52]]) {
    r.vline(px, 36, py - 6, '#3b4148');
    r.ball(px, py, 6, 6, '#3a3f48', '#6b7380', '#22252b');
  }
  // counter
  r.rect(0, 200, 180, 28, '#8a5a34');
  r.hline(0, 179, 200, '#c08a52');
  r.hline(0, 179, 201, '#a8703f');
  for (let x = 0; x < 180; x += 22) r.vline(x, 204, 227, '#6e4628');
  // floor
  for (let y = 228; y < 320; y++)
    for (let x = 0; x < 180; x++) r.set(x, y, (Math.floor(x / 15) + Math.floor((y - 228) / 15)) % 2 ? '#2f2a3a' : '#e9dcc4');
  // plants
  for (const px of [6, 168]) {
    r.rect(px - 4, 180, 10, 20, '#8a4a2a');
    r.ball(px + 1, 172, 7, 9, '#4caf3a', '#7cd16b', '#2e7d32');
  }
  r.save('kitchen/restaurant_bg.png');
}

// Pot texture generated from the SAME floor profile as the physics (1 px = 3 logical units).
async function pot() {
  const { POT_GEOM, floorY } = await import('../src/systems/PotPhysics.js');
  const S = 3;
  const wall = POT_GEOM.wall / S; // 6
  const W = POT_GEOM.W / S; // 148
  const D = POT_GEOM.D / S;
  const w = Math.round(W + wall * 2 + 8);
  const h = Math.round(D + wall + 6);
  const p = new Px(w, h);
  const ox = wall + 4; // interior x=0 in texture
  const oy = 2; // rim at y=0 -> texture y=oy
  for (let x = 0; x < W; x++) {
    const fy = floorY(x * S + S / 2) / S + oy;
    for (let y = oy; y < fy; y++) {
      const t = (y - oy) / D;
      p.set(ox + x, y, t < 0.15 ? '#3a2a20' : t < 0.6 ? '#2f2219' : '#281d15');
    }
    for (let y = Math.floor(fy); y < fy + wall; y++) p.set(ox + x, y, y < fy + 1.5 ? '#c9ced6' : y < fy + wall - 1.5 ? '#9aa4ad' : '#5a626c');
  }
  for (let y = oy; y < oy + D - 30 / S + wall; y++) {
    for (let i = 0; i < wall; i++) {
      const c = i < 1.5 ? '#6b747c' : i < wall - 1.5 ? '#9aa4ad' : '#c9ced6';
      p.set(ox - wall + i, y, c);
      p.set(ox + W + wall - 1 - i, y, c);
    }
  }
  // rim
  p.rect(ox - wall - 3, oy - 2, W + wall * 2 + 6, 3, '#dfe4ea');
  p.hline(ox - wall - 3, ox + W + wall + 2, oy, '#8b949c');
  // handles
  p.rect(0, oy + 6, 4, 6, '#2b2f36');
  p.rect(w - 4, oy + 6, 4, 6, '#2b2f36');
  p.outline('#1a1d22');
  p.save('kitchen/pot.png');
  return { ox: ox * S, oy: oy * S };
}

// ---------------------------------------------------------------- audio
function wav(file, seconds, fn, rate = 22050) {
  const n = Math.floor(seconds * rate);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  let seed = 12345;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed / 0x7fffffff) * 2 - 1;
  };
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    let v = fn(t, noise, seconds);
    v = Math.max(-1, Math.min(1, v));
    buf.writeInt16LE(Math.round(v * 32767 * 0.9), 44 + i * 2);
  }
  const p = join(ROOT, 'audio', file);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, buf);
  count.wav++;
}
const env = (t, a, d) => Math.min(1, t / a) * Math.exp(-t / d);
const sq = (f, t) => (Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1);
const tri = (f, t) => 2 * Math.abs(2 * ((f * t) % 1) - 1) - 1;
const sine = (f, t) => Math.sin(2 * Math.PI * f * t);

function audio() {
  wav('click.wav', 0.06, (t) => sq(880, t) * env(t, 0.002, 0.015) * 0.35);
  wav('swing.wav', 0.25, (t, nz) => nz() * env(t, 0.08, 0.06) * 0.22 * (0.5 + 0.5 * sine(9, t)));
  wav('drop.wav', 0.3, (t) => sine(320 - t * 700, t) * env(t, 0.005, 0.09) * 0.6);
  wav('catch.wav', 0.35, (t) => (sine(520 + 300 * t, t) * 0.5 + sine(780 + 300 * t, t) * 0.3) * env(t, 0.01, 0.12) * 0.6);
  wav('shoot.wav', 0.12, (t, nz) => (tri(700 - t * 3000, t) * 0.6 + nz() * 0.25) * env(t, 0.003, 0.04) * 0.5);
  wav('hit.wav', 0.1, (t, nz) => (nz() * 0.5 + sq(180, t) * 0.4) * env(t, 0.001, 0.03) * 0.55);
  wav('sizzle.wav', 0.5, (t, nz) => nz() * env(t, 0.01, 0.18) * 0.35 * (0.6 + 0.4 * sine(40, t)));
  wav('hurt.wav', 0.3, (t) => (sq(110 - t * 120, t) * 0.5 + sine(70, t) * 0.4) * env(t, 0.003, 0.1) * 0.6);
  wav('shield.wav', 0.25, (t) => tri(1200 + 400 * sine(30, t), t) * env(t, 0.002, 0.07) * 0.35);
  wav('warn.wav', 0.4, (t) => sq(220, t) * (Math.floor(t * 10) % 2 ? 0.25 : 0.45) * env(t, 0.01, 0.3) * 0.5);
  wav('coin.wav', 0.3, (t) => sq(t < 0.07 ? 988 : 1319, t) * env(t, 0.002, 0.12) * 0.3);
  const arp = (notes, step, file, len, wave = sq) =>
    wav(file, len, (t) => {
      const i = Math.min(notes.length - 1, Math.floor(t / step));
      const lt = t - i * step;
      return wave(notes[i], t) * env(lt, 0.005, step * 1.4) * 0.3;
    });
  arp([523, 659, 784, 1047], 0.07, 'skill.wav', 0.4);
  arp([523, 659, 784, 659, 784, 1047, 1047], 0.11, 'victory.wav', 1.1);
  arp([392, 349, 311, 262], 0.16, 'defeat.wav', 0.9, tri);
  // light original kitchen loop (C major, 112 bpm, 8 bars)
  const bpm = 112;
  const beat = 60 / bpm;
  const mel = [72, 76, 79, 76, 77, 76, 74, 72, 74, 77, 81, 77, 79, 77, 76, 74, 72, 76, 79, 84, 83, 79, 77, 76, 74, 76, 77, 74, 72, 0, 72, 0];
  const bass = [48, 48, 53, 53, 55, 55, 48, 48];
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const len = beat * mel.length;
  wav('music.wav', len, (t, nz) => {
    const i = Math.floor(t / beat) % mel.length;
    const lt = t - Math.floor(t / beat) * beat;
    const m = mel[i];
    let v = m ? tri(mf(m), t) * env(lt, 0.01, beat * 0.5) * 0.16 : 0;
    const bi = Math.floor(t / (beat * 4)) % bass.length;
    const blt = t - Math.floor(t / beat) * beat;
    v += sq(mf(bass[bi]), t) * env(blt, 0.005, beat * 0.35) * 0.07;
    if (i % 2 === 1) v += nz() * env(lt, 0.001, 0.02) * 0.04;
    return v * Math.min(1, t * 4, (len - t) * 4);
  });
}

// ---------------------------------------------------------------- run
chef();
tomato('enemies/tomato.png');
tomato('bosses/giant_tomato.png', 32, true);
pepper();
egg();
potato();
armoredPotato();
salt();
potatoKing();
oils();
pan();
dishes();
icons();
backgrounds();
const potInfo = await pot();
audio();
writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify({ generatedBy: 'tools/gen-assets.mjs', potTextureOrigin: potInfo, ...count }, null, 2));
console.log(`assets: ${count.png} png, ${count.wav} wav ->`, ROOT);
