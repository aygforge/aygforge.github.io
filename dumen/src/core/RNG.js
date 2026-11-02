// Seed'li, deterministik rastgelelik. Tüm oyun zarları buradan geçer.
(function (D) {
  'use strict';
  function hashStr(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  class RNG {
    constructor(seed) { this.seed = (typeof seed === 'string' ? hashStr(seed) : seed >>> 0); this.next = mulberry32(this.seed); }
    float() { return this.next(); }
    range(a, b) { return a + (b - a) * this.next(); }
    int(a, b) { return Math.floor(this.range(a, b + 1)); }
    chance(p) { return this.next() < p; }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
    // weights: [{w, v}] — ağırlıklar normalize edilir; toplam 0 ise null.
    weighted(list) {
      const total = list.reduce((s, e) => s + Math.max(0, e.w), 0);
      if (!(total > 0)) return null;
      let r = this.next() * total;
      for (const e of list) { r -= Math.max(0, e.w); if (r <= 0) return e.v; }
      return list[list.length - 1].v;
    }
  }
  RNG.hashStr = hashStr;
  RNG.forKey = (masterSeed, key) => new RNG(hashStr(String(masterSeed) + '|' + key));
  D.RNG = RNG;
})(globalThis.DUMEN);
