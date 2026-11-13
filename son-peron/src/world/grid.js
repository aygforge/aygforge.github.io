// Izgara yardımcıları: A* yol bulma ve erişilebilirlik (BFS).
export const idx = (w, x, y) => y * w + x;

class Heap {
  constructor() { this.a = []; }
  push(n) { const a = this.a; a.push(n); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a; const top = a[0]; const last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l].f < a[m].f) m = l; if (r < a.length && a[r].f < a[m].f) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; }
  get size() { return this.a.length; }
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// blocked: Uint8Array (1 = engel). Hedef hücre engelliyse (ör. sandalye) yine de son adım olarak kabul edilir.
export function findPath(blocked, w, h, sx, sy, tx, ty) {
  sx |= 0; sy |= 0; tx |= 0; ty |= 0;
  if (sx === tx && sy === ty) return [[tx, ty]];
  if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
  const g = new Float32Array(w * h).fill(Infinity);
  const from = new Int32Array(w * h).fill(-1);
  const open = new Heap();
  const s = idx(w, sx, sy), t = idx(w, tx, ty);
  g[s] = 0; open.push({ i: s, f: 0 });
  while (open.size) {
    const cur = open.pop().i;
    if (cur === t) break;
    const cx = cur % w, cy = (cur / w) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = idx(w, nx, ny);
      if (blocked[ni] && ni !== t) continue;
      const ng = g[cur] + 1;
      if (ng < g[ni]) { g[ni] = ng; from[ni] = cur; open.push({ i: ni, f: ng + Math.abs(nx - tx) + Math.abs(ny - ty) }); }
    }
  }
  if (from[t] === -1) return null;
  const path = [];
  for (let c = t; c !== -1; c = from[c]) path.push([c % w, (c / w) | 0]);
  return path.reverse();
}

// (sx,sy)'den erişilen tüm hücreler
export function flood(blocked, w, h, sx, sy) {
  const seen = new Uint8Array(w * h);
  if (blocked[idx(w, sx, sy)]) return seen;
  const q = [idx(w, sx, sy)]; seen[q[0]] = 1;
  while (q.length) {
    const cur = q.pop(); const cx = cur % w, cy = (cur / w) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = idx(w, nx, ny);
      if (seen[ni] || blocked[ni]) continue;
      seen[ni] = 1; q.push(ni);
    }
  }
  return seen;
}

// Dikdörtgen ayak izine komşu hücreler
export function neighborsOfRect(x, y, w, h) {
  const out = [];
  for (let i = 0; i < w; i++) { out.push([x + i, y - 1, 'down'], [x + i, y + h, 'up']); }
  for (let j = 0; j < h; j++) { out.push([x - 1, y + j, 'right'], [x + w, y + j, 'left']); }
  return out;
}

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
