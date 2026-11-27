// core/util.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).

/* ---------------------------- Util ---------------------------- */
export const TILE = 24, COLS = 15, VIEW_W = 360;
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
export const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));
export const TAU = Math.PI * 2;
export const fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + (r < 10 ? '0' : '') + r; };
export const fmtTime1 = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = (s % 60); return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** Seeded RNG (mulberry32). */
export function RNG(seed) {
  let a = seed >>> 0;
  const next = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  return {
    next, range: (x, y) => x + (y - x) * next(), int: (x, y) => x + Math.floor(next() * (y - x + 1)),
    pick: arr => arr[Math.floor(next() * arr.length)],
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  };
}
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
