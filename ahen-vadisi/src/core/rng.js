// Deterministik ve tohumlanabilir RNG. Loot, yükseltme, harita üretimi ve testler bunu kullanır.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  constructor(seed = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0) {
    this.seed = seed >>> 0;
    this.next = mulberry32(this.seed);
  }
  float() { return this.next(); }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  // entries: [{ w, ... }] — ağırlığa göre seç
  weighted(entries, key = 'w') {
    let total = 0;
    for (const e of entries) total += e[key];
    if (total <= 0) return null;
    let r = this.next() * total;
    for (const e of entries) {
      r -= e[key];
      if (r < 0) return e;
    }
    return entries[entries.length - 1];
  }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// Hash tabanlı noise (harita üretimi için)
export function hash2(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function valueNoise(x, y, scale, seed) {
  const fx = x / scale, fy = y / scale;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = hash2(x0, y0, seed), b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed), d = hash2(x0 + 1, y0 + 1, seed);
  return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
}

let uidCounter = 0;
export function makeUid(prefix = 'i') {
  uidCounter = (uidCounter + 1) % 1e6;
  const rnd = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? Array.from(crypto.getRandomValues(new Uint32Array(2)), (n) => n.toString(36)).join('')
    : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `${prefix}${Date.now().toString(36)}${uidCounter.toString(36)}${rnd.slice(0, 8)}`;
}
