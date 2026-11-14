// Deterministik, durumu kaydedilebilen rastgele sayı üreticisi (mulberry32).

export function hashString(str) {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

export class SeededRNG {
  constructor(seed) {
    this.s = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;
  }

  static derive(seed, ...keys) {
    return new SeededRNG(hashString(String(seed) + '|' + keys.join('|')));
  }

  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Tam sayı [min, max] (her ikisi dahil) */
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  /** Yüzde olarak şans (0–100) */
  chance(pct) {
    return this.next() * 100 < pct;
  }

  pick(arr) {
    if (!arr.length) return undefined;
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Ağırlıklı seçim. weightFn(item) >= 0 */
  weighted(arr, weightFn = (x) => x.weight) {
    let total = 0;
    for (const a of arr) total += Math.max(0, weightFn(a));
    if (total <= 0) return undefined;
    let r = this.next() * total;
    for (const a of arr) {
      r -= Math.max(0, weightFn(a));
      if (r < 0) return a;
    }
    return arr[arr.length - 1];
  }

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  sample(arr, n) {
    return this.shuffle(arr).slice(0, Math.max(0, n));
  }

  getState() {
    return this.s >>> 0;
  }

  setState(s) {
    this.s = s >>> 0;
  }
}

export function randomSeedString() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const src = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(8)) : null;
  for (let i = 0; i < 8; i++) {
    const v = src ? src[i] : Math.floor(Math.random() * 1e9);
    s += chars[v % chars.length];
  }
  return s;
}
