// Tides of Fortune'un deterministik RNG çekirdeği (Bt hash + Te sınıfı) — davranışı birebir korunarak taşındı.
export function hashStr(e) {
  let a = 3735928559 ^ e.length, t = 1103547991 ^ e.length;
  for (let r = 0; r < e.length; r++) {
    const n = e.charCodeAt(r);
    a = Math.imul(a ^ n, 2654435761);
    t = Math.imul(t ^ n, 1597334677);
  }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(t ^ (t >>> 13), 3266489909);
  t = Math.imul(t ^ (t >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
  return (a ^ t) >>> 0;
}

export class Rng {
  constructor(seed) { this.s = (typeof seed === 'string' ? hashStr(seed) : seed) >>> 0; }
  static derive(seed, ...parts) { return new Rng(hashStr(String(seed) + '|' + parts.join('|'))); }
  next() {
    let a = (this.s = (this.s + 1831565813) >>> 0);
    a = Math.imul(a ^ (a >>> 15), a | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  range(a, b) { return a + this.next() * (b - a); }
  chance(p) { return this.next() * 100 < p; }
  pick(arr) { if (arr.length) return arr[Math.floor(this.next() * arr.length)]; }
  weighted(arr, w = (x) => x.weight) {
    let tot = 0;
    for (const x of arr) tot += Math.max(0, w(x));
    if (tot <= 0) return;
    let n = this.next() * tot;
    for (const x of arr) { n -= Math.max(0, w(x)); if (n < 0) return x; }
    return arr[arr.length - 1];
  }
  shuffle(arr) {
    const t = arr.slice();
    for (let r = t.length - 1; r > 0; r--) { const n = Math.floor(this.next() * (r + 1)); [t[r], t[n]] = [t[n], t[r]]; }
    return t;
  }
  sample(arr, k) { return this.shuffle(arr).slice(0, Math.max(0, k)); }
  getState() { return this.s >>> 0; }
  setState(s) { this.s = s >>> 0; }
}

export function newSeed() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const buf = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(8)) : null;
  for (let i = 0; i < 8; i++) s += abc[(buf ? buf[i] : Math.floor(Math.random() * 1e9)) % abc.length];
  return s;
}
