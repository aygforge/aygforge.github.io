// Seeded, independently persisted gameplay RNG streams (ImplementationContract.rng).
import { hash32, sha256 } from './util.js';

export const STREAMS = ['terrain_secondary', 'poi_optional_loot', 'wildlife_spawn', 'fish_bites', 'daily_weather', 'trap_daily', 'cosmetic'];

export class Sfc32 {
  constructor(state) { this.s = Uint32Array.from(state); }
  static fromSeedString(str) {
    const h = sha256(str);
    const dv = new DataView(h.buffer);
    const r = new Sfc32([dv.getUint32(0), dv.getUint32(4), dv.getUint32(8), dv.getUint32(12) | 1]);
    for (let i = 0; i < 12; i++) r.nextU32();
    return r;
  }
  nextU32() {
    const s = this.s;
    const t = (((s[0] + s[1]) >>> 0) + s[3]) >>> 0;
    s[3] = (s[3] + 1) >>> 0;
    s[0] = s[1] ^ (s[1] >>> 9);
    s[1] = (s[2] + (s[2] << 3)) >>> 0;
    s[2] = ((s[2] << 21) | (s[2] >>> 11)) >>> 0;
    s[2] = (s[2] + t) >>> 0;
    return t;
  }
  next() { return this.nextU32() / 4294967296; }
  int(min, max) { return min + Math.floor(this.next() * (max - min + 1)); }
  range(min, max) { return min + this.next() * (max - min); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  weighted(entries, wkey = 'weight') {
    let total = 0;
    for (const e of entries) total += e[wkey];
    let r = this.next() * total;
    for (const e of entries) { r -= e[wkey]; if (r < 0) return e; }
    return entries[entries.length - 1];
  }
  serialize() { return Array.from(this.s); }
}

export class RngStreams {
  constructor(worldSeed, saved) {
    this.worldSeed = worldSeed >>> 0;
    this.streams = {};
    for (const name of STREAMS) {
      if (saved && saved[name]) this.streams[name] = new Sfc32(saved[name]);
      else this.streams[name] = Sfc32.fromSeedString(`${this.worldSeed}:${name}`);
    }
  }
  get(name) {
    const s = this.streams[name];
    if (!s) throw new Error('Unknown RNG stream ' + name);
    return s;
  }
  serialize() {
    const o = {};
    for (const k of Object.keys(this.streams)) o[k] = this.streams[k].serialize();
    return o;
  }
  /** Stateless deterministic RNG derived from a key (does not consume persisted streams). */
  static keyed(...parts) { return Sfc32.fromSeedString(parts.join(':')); }
  static hash(...parts) { return hash32(parts.join(':')); }
}
