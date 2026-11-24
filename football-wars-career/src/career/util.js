// Shared deterministic helpers (no Math.random anywhere in career logic).
export function hashStr(s) { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
export function mix32(...parts) { let h = 0x9e3779b9; for (const p of parts) { h = Math.imul(h ^ (typeof p === 'number' ? p >>> 0 : hashStr(p)), 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; } return h >>> 0; }
export class Rng {
  constructor(seed) { this.s = seed >>> 0; }
  next() { let a = (this.s = (this.s + 0x6D2B79F5) | 0); let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  range(a, b) { return a + (b - a) * this.next(); }
  int(n) { return Math.floor(this.next() * n); }
  irange(a, b) { return a + this.int(b - a + 1); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[this.int(arr.length)]; }
  normal() { let u = this.next(); if (u < 1e-9) u = 1e-9; return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * this.next()); }
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = this.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  weighted(ws) { let s = 0; for (const w of ws) s += w; let r = this.next() * s; for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r < 0) return i; } return ws.length - 1; }
}
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const round1 = v => Math.round(v * 10) / 10;
export const sum = arr => arr.reduce((a, b) => a + b, 0);
export function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export const fmtC = n => (n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('en-US') + ' C';
export function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
