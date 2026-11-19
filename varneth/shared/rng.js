// Deterministic, serializable PRNG (mulberry32). Only integer/IEEE arithmetic,
// so client (browser) and server (Deno/Node) produce identical sequences.

export function makeRng(seed) {
  return { s: seed >>> 0 };
}

export function next(rng) {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function range(rng, a, b) {
  return a + (b - a) * next(rng);
}

export function int(rng, a, b) {
  // inclusive
  return a + Math.floor(next(rng) * (b - a + 1));
}

export function chance(rng, p) {
  return next(rng) < p;
}

export function pick(rng, arr) {
  return arr[Math.floor(next(rng) * arr.length)];
}

export function weighted(rng, entries) {
  // entries: [[value, weight], ...]
  let total = 0;
  for (const e of entries) total += e[1];
  let r = next(rng) * total;
  for (const e of entries) {
    r -= e[1];
    if (r < 0) return e[0];
  }
  return entries[entries.length - 1][0];
}

// Hash a string to 32-bit seed (FNV-1a)
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function deriveSeed(seed, salt) {
  return hashString(seed + ':' + salt);
}
