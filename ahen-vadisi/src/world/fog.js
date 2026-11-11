// Keşif (fog of war): 2×2 tile hücreler, kalıcı olarak karakter kaydında saklanır.
import { TILE } from '../data/constants.js';

export const FOG_CELL = 2;
const REVEAL_R = 7; // tile

export function fogDims(w, h) { return { fw: Math.ceil(w / FOG_CELL), fh: Math.ceil(h / FOG_CELL) }; }

export function decodeFog(str, n) {
  const out = new Uint8Array(n);
  if (!str) return out;
  try {
    const bin = atob(str);
    for (let i = 0; i < n; i++) out[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
  } catch { /* bozuk → boş */ }
  return out;
}

export function encodeFog(arr) {
  const bytes = new Uint8Array(Math.ceil(arr.length / 8));
  for (let i = 0; i < arr.length; i++) if (arr[i]) bytes[i >> 3] |= 1 << (i & 7);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export class Fog {
  constructor(mapId, w, h, saved) {
    this.mapId = mapId;
    const { fw, fh } = fogDims(w, h);
    this.fw = fw; this.fh = fh;
    this.cells = decodeFog(saved, fw * fh);
    this.dirty = true;
  }
  reveal(px, py) {
    const cx = px / TILE / FOG_CELL, cy = py / TILE / FOG_CELL;
    const r = REVEAL_R / FOG_CELL;
    let changed = false;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if (x < 0 || y < 0 || x >= this.fw || y >= this.fh) continue;
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > r * r) continue;
      const i = y * this.fw + x;
      if (!this.cells[i]) { this.cells[i] = 1; changed = true; }
    }
    if (changed) this.dirty = true;
    return changed;
  }
  seen(tx, ty) {
    const x = Math.floor(tx / FOG_CELL), y = Math.floor(ty / FOG_CELL);
    return this.cells[y * this.fw + x] === 1;
  }
  percent() {
    let n = 0;
    for (const c of this.cells) n += c;
    return n / this.cells.length;
  }
  encode() { return encodeFog(this.cells); }
}
