// Küçük, bağımlılıksız piksel tamponu. Hem Node (PNG üretimi) hem tarayıcıda (karakter atlası) çalışır.
// Tüm çizimler 16 px/karo çözünürlükte yapılır ve 2× en-yakın-komşu ile büyütülür (tutarlı piksel boyutu).
const cache = new Map();
export function rgb(hex) {
  let c = cache.get(hex); if (c) return c;
  const n = parseInt(hex.slice(1), 16); c = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]; cache.set(hex, c); return c;
}
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); const h = (i) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0'); return '#' + h(0) + h(1) + h(2); }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export class Px {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  set(x, y, c, a = 255) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return this; const i = (y * this.w + x) * 4, k = rgb(c); this.d[i] = k[0]; this.d[i + 1] = k[1]; this.d[i + 2] = k[2]; this.d[i + 3] = a; return this; }
  clear(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[(y * this.w + x) * 4 + 3] = 0; }
  a(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[(y * this.w + x) * 4 + 3]; }
  rect(x, y, w, h, c, a) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a); return this; }
  hline(x, y, w, c) { return this.rect(x, y, w, 1, c); }
  vline(x, y, h, c) { return this.rect(x, y, 1, h, c); }
  frame(x, y, w, h, c) { this.hline(x, y, w, c); this.hline(x, y + h - 1, w, c); this.vline(x, y, h, c); this.vline(x + w - 1, y, h, c); return this; }
  // Gölgeli kutu: orta ton + sol/üst açık, sağ/alt koyu (ışık sol üstten)
  box(x, y, w, h, m, l, d) { this.rect(x, y, w, h, m); if (l) { this.hline(x, y, w, l); this.vline(x, y, h, l); } if (d) { this.hline(x, y + h - 1, w, d); this.vline(x + w - 1, y, h, d); } return this; }
  ellipse(cx, cy, rx, ry, c) { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) this.set(cx + x, cy + y, c); return this; }
  // Hacimli damla: sol üst parlak, sağ alt gölge
  blob(cx, cy, rx, ry, m, l, d) {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const v = (x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3); if (v > 1) continue; const t = (x / (rx + 0.01) + y / (ry + 0.01)) / 2; this.set(cx + x, cy + y, t < -0.32 && l ? l : t > 0.34 && d ? d : m); }
    return this;
  }
  line(x0, y0, x1, y1, c) { let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy; for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } return this; }
  // Saydam olmayan piksellerin çevresine 1 px kontur
  outline(c) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!this.a(x, y) && (this.a(x - 1, y) || this.a(x + 1, y) || this.a(x, y - 1) || this.a(x, y + 1))) add.push([x, y]);
    for (const [x, y] of add) this.set(x, y, c); return this;
  }
  blit(src, dx, dy, opt = {}) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const sx = opt.flip ? src.w - 1 - x : x; const i = (y * src.w + sx) * 4; if (!src.d[i + 3]) continue; const tx = dx + x, ty = dy + y; if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue; const o = (ty * this.w + tx) * 4; this.d[o] = src.d[i]; this.d[o + 1] = src.d[i + 1]; this.d[o + 2] = src.d[i + 2]; this.d[o + 3] = opt.alpha ?? src.d[i + 3]; }
    return this;
  }
  flipped() { const o = new Px(this.w, this.h); o.blit(this, 0, 0, { flip: true }); return o; }
  scaled(k) { const o = new Px(this.w * k, this.h * k); for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const i = (((y / k) | 0) * this.w + ((x / k) | 0)) * 4, j = (y * o.w + x) * 4; o.d[j] = this.d[i]; o.d[j + 1] = this.d[i + 1]; o.d[j + 2] = this.d[i + 2]; o.d[j + 3] = this.d[i + 3]; } return o; }
  // Kutuya sığacak şekilde en-yakın-komşu küçültme (envanter ikonları için)
  fit(size) { const k = Math.max(this.w, this.h) / size; if (k <= 1) { const o = new Px(size, size); o.blit(this, ((size - this.w) / 2) | 0, size - this.h - (((size - this.h) / 2) | 0)); return o; } const w = Math.max(1, Math.round(this.w / k)), h = Math.max(1, Math.round(this.h / k)); const s = new Px(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (Math.min(this.h - 1, (y * k) | 0) * this.w + Math.min(this.w - 1, (x * k) | 0)) * 4, j = (y * w + x) * 4; for (let q = 0; q < 4; q++) s.d[j + q] = this.d[i + q]; } const o = new Px(size, size); o.blit(s, ((size - w) / 2) | 0, ((size - h) / 2) | 0); return o; }
  // Dokulu dolgu: orta ton üzerine deterministik benekler
  speckle(x, y, w, h, colors, density, seed) { const r = rng(seed); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (r() < density) this.set(x + i, y + j, colors[(r() * colors.length) | 0]); return this; }
}

// Sınırlı sıcak-rustik palet
export const P = {
  ink: '#2a1d1a', ink2: '#4a332b',
  woodL: '#d9a066', wood: '#b0733f', woodD: '#7d4c2a', woodDD: '#573221', oldL: '#a8927c', old: '#84705e', oldD: '#5c4c40',
  cream: '#f4e3c1', paper: '#e8d2a6', paperD: '#c9ad7c', white: '#fbf5e6', gray: '#9a9a96', grayL: '#c9c7be', grayD: '#63605e', black: '#35302e',
  stoneL: '#b9b3a6', stone: '#948d82', stoneD: '#6b655d', brickL: '#c9785a', brick: '#a9573f', brickD: '#7c3b2c',
  metalL: '#c8d1d6', metal: '#8f9ba3', metalD: '#5d6870', iron: '#4a4f57', gold: '#e9b93f', goldD: '#b5822a',
  red: '#c5443b', redD: '#8e2c2c', orange: '#e08a3c', yellow: '#f0cf5a', green: '#6aa84f', greenL: '#96c96a', greenD: '#3f7a3a', greenDD: '#2c5632',
  blue: '#4f8fc0', blueL: '#8fc3e0', blueD: '#2f5f8f', teal: '#4aa39a', purple: '#8b5fa8', pink: '#e39ab0', maroon: '#7a2f3a', navy: '#2e3f66',
  skin: ['#f6d2b0', '#e8b890', '#c98f62', '#8f5d3b'], skinD: ['#d9a986', '#c79468', '#a16f48', '#6d4329'],
  hair: ['#3a2a22', '#6b4226', '#b5762f', '#d8b25a', '#8c3b2a', '#b9b6b0'],
  outfit: [['#4f8fc0', '#2f5f8f'], ['#6aa84f', '#3f7a3a'], ['#c5443b', '#8e2c2c'], ['#e08a3c', '#a85f25'], ['#8b5fa8', '#5f3d78'], ['#4aa39a', '#2e6f69'], ['#2e3f66', '#1f2a47'], ['#d9c27a', '#a58f4d']],
  pants: ['#5a4a3f', '#3d4660', '#6b5a48', '#44403c']
};
