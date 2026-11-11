// Deterministik harita üreticisi. Harita tanımındaki (yollar, kamplar, damgalar, nesneler)
// el tasarımı verilerden tilemap katmanları ve çarpışma ızgarası üretir. Saf JS — Node'da test edilir.
import { valueNoise, hash2 } from '../core/rng.js';
import { T, hasTile, STAMPS, WATER_TERRAINS } from './tileRegistry.js';

export function buildMap(def) {
  const W = def.w, H = def.h, N = W * H;
  const idx = (x, y) => y * W + x;
  const inB = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const seed = def.seed;

  const terrain = new Array(N).fill(def.base);
  const mass = new Uint8Array(N);
  const keep = new Uint8Array(N);
  const occupied = new Uint8Array(N);
  const stampSolid = new Uint8Array(N);
  const decor = new Int16Array(N).fill(-1);
  const lower = new Int16Array(N).fill(-1);
  const upper = new Int16Array(N).fill(-1);
  const stampAt = new Int32Array(N).fill(-1);
  const stampList = [];

  // ---------------------------------------------------------------- 1) kütle (geçilmez sınır / mağara)
  if (def.carve) mass.fill(1);
  if (def.border) {
    const b = def.border;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.min(x, y, W - 1 - x, H - 1 - y);
      const n = valueNoise(x, y, 4, seed + 3) * (b.noise ?? 3);
      if (d < b.thick + n) mass[idx(x, y)] = 1;
    }
  }
  if (def.massNoise) {
    const m = def.massNoise;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (valueNoise(x, y, m.scale, seed + 11) > m.threshold) mass[idx(x, y)] = 1;
    }
  }

  // ---------------------------------------------------------------- 2) alanlar (kamplar, odalar)
  const forDisc = (cx, cy, r, fn, noiseAmp = 0, nseed = 0) => {
    const R = Math.ceil(r + noiseAmp + 1);
    for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
      if (!inB(x, y)) continue;
      const d = Math.hypot(x - cx, y - cy);
      const rr = r + (noiseAmp ? (valueNoise(x, y, 3, seed + nseed) - 0.5) * 2 * noiseAmp : 0);
      if (d <= rr) fn(x, y, d, rr);
    }
  };
  const forRect = (x0, y0, x1, y1, fn) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inB(x, y)) fn(x, y);
  };

  for (const a of def.areas || []) {
    const clearFn = (x, y, d, rr) => {
      const i = idx(x, y);
      mass[i] = 0;
      if (a.keep !== false && (d === undefined || d < rr * (a.keepRatio ?? 0.7))) keep[i] = 1;
      if (a.ground && (d === undefined || d < rr * 0.85 + (valueNoise(x, y, 2, seed + 5) - 0.5) * 2)) terrain[i] = a.ground;
    };
    if (a.rect) forRect(a.rect[0], a.rect[1], a.rect[2], a.rect[3], (x, y) => clearFn(x, y));
    else forDisc(a.x, a.y, a.r, clearFn, def.carve ? 1.6 : 0.8, 17);
  }

  // ---------------------------------------------------------------- 3) yollar
  for (const p of def.paths || []) {
    const half = p.w / 2;
    for (let s = 0; s < p.pts.length - 1; s++) {
      const [x0, y0] = p.pts[s], [x1, y1] = p.pts[s + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(len * 2));
      for (let k = 0; k <= steps; k++) {
        const cx = x0 + (x1 - x0) * (k / steps), cy = y0 + (y1 - y0) * (k / steps);
        forDisc(cx, cy, half + (def.carve ? 0.8 : 0.4), (x, y) => { mass[idx(x, y)] = 0; }, def.carve ? 1 : 0, 23);
        forDisc(cx, cy, half, (x, y, d) => {
          const i = idx(x, y);
          keep[i] = 1;
          if (p.tile && d <= half - 0.3 + (valueNoise(x, y, 2, seed + 9) - 0.5) * 0.9) terrain[i] = p.tile;
        });
      }
    }
  }

  // ---------------------------------------------------------------- 4) su
  for (const pd of def.ponds || []) {
    for (let y = Math.floor(pd.y - pd.ry - 2); y <= pd.y + pd.ry + 2; y++) for (let x = Math.floor(pd.x - pd.rx - 2); x <= pd.x + pd.rx + 2; x++) {
      if (!inB(x, y)) continue;
      const i = idx(x, y);
      const dd = ((x - pd.x) / pd.rx) ** 2 + ((y - pd.y) / pd.ry) ** 2;
      if (dd + (valueNoise(x, y, 2.5, seed + 31) - 0.5) * 0.5 < 1 && !keep[i]) { terrain[i] = pd.terrain || 'water'; mass[i] = 0; }
    }
  }
  if (def.waterNoise) {
    const wn = def.waterNoise;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y);
      if (keep[i] || mass[i]) continue;
      if (valueNoise(x, y, wn.scale, seed + 41) > wn.threshold) terrain[i] = wn.terrain;
    }
  }
  // köprüler: yol üzerine su kesiyorsa plank
  for (const br of def.bridges || []) forRect(br[0], br[1], br[2], br[3], (x, y) => { terrain[idx(x, y)] = 'plank'; mass[idx(x, y)] = 0; keep[idx(x, y)] = 1; });

  // ---------------------------------------------------------------- 5) damgalar
  const placeStamp = (name, x, y, force = false) => {
    const sd = STAMPS[name];
    if (!sd) throw new Error(`Bilinmeyen damga ${name}`);
    for (let r = 0; r < sd.h; r++) for (let c = 0; c < sd.w; c++) {
      const xx = x + c, yy = y + r;
      if (!inB(xx, yy)) return false;
      const i = idx(xx, yy);
      if (!force && (mass[i] || keep[i] || occupied[i] || WATER_TERRAINS.has(terrain[i]))) return false;
      if (force && occupied[i]) return false;
    }
    const id = stampList.length;
    stampList.push({ name, x, y });
    for (let r = 0; r < sd.h; r++) for (let c = 0; c < sd.w; c++) {
      const i = idx(x + c, y + r);
      const tile = T(`${name}#${r}_${c}`);
      occupied[i] = 1;
      stampAt[i] = id;
      if (force) mass[i] = 0;
      if (sd.upper.includes(r)) upper[i] = tile; else lower[i] = tile;
      if (sd.solid.includes(r)) stampSolid[i] = 1;
    }
    return true;
  };

  for (const s of def.stamps || []) {
    if (!placeStamp(s.s, s.x, s.y, true)) throw new Error(`${def.id}: damga yerleşemedi ${s.s} @${s.x},${s.y}`);
  }
  // nesne çevresini açık tut
  for (const o of def.objects || []) {
    const r = o.clear ?? 1.5;
    forDisc(o.x, o.y, r, (x, y) => { const i = idx(x, y); if (!occupied[i]) { mass[i] = 0; keep[i] = 1; if (WATER_TERRAINS.has(terrain[i])) terrain[i] = def.base; } });
  }
  for (const e of Object.values(def.entries || {})) {
    forDisc(e.x, e.y, 1.5, (x, y) => { const i = idx(x, y); if (!occupied[i]) { mass[i] = 0; keep[i] = 1; if (WATER_TERRAINS.has(terrain[i])) terrain[i] = def.base; } });
  }

  for (const rule of def.scatter || []) {
    const sd = STAMPS[rule.s];
    for (let y = 1; y < H - sd.h; y++) for (let x = 1; x < W - sd.w; x++) {
      if (hash2(x, y, seed + rule.s.length * 97 + (rule.salt || 0)) >= rule.d) continue;
      const i = idx(x, y + sd.h - 1);
      if (rule.on && !rule.on.includes(terrain[i])) continue;
      // tabanın altında bir sıra boşluk (okunabilirlik)
      placeStamp(rule.s, x, y);
    }
  }

  // ---------------------------------------------------------------- 6) dekor
  for (const rule of def.decor || []) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y);
      if (mass[i] || occupied[i] || decor[i] >= 0) continue;
      if (rule.on && !rule.on.includes(terrain[i])) continue;
      if (!rule.on && WATER_TERRAINS.has(terrain[i])) continue;
      if (rule.offPath && keep[i] && terrain[i] !== def.base) continue;
      const h = hash2(x, y, seed + 7 + (rule.salt || 0) * 13);
      if (h < rule.d) decor[i] = T(rule.tiles[Math.floor(hash2(x, y, seed + 99) * rule.tiles.length)]);
    }
  }
  for (const dd of def.decorAt || []) decor[idx(dd.x, dd.y)] = T(dd.t);

  // ---------------------------------------------------------------- 7) çarpışma + bağlantı kontrolü (gerekirse onarım)
  const solid = new Uint8Array(N);
  const computeSolid = () => {
    for (let i = 0; i < N; i++) solid[i] = (mass[i] || stampSolid[i] || WATER_TERRAINS.has(terrain[i])) ? 1 : 0;
  };
  computeSolid();
  const targets = collectTargets(def);
  const start = Object.values(def.entries)[0];
  let repairs = 0;
  const repaired = [];
  for (let pass = 0; pass < 3; pass++) {
    const reach = bfs(solid, W, H, start.x, start.y);
    const bad = targets.filter((t) => !nearReachable(reach, W, H, t.x, t.y));
    if (!bad.length) break;
    for (const t of bad) {
      repairs++;
      repaired.push(t.what);
      carveTo(t.x, t.y, reach);
    }
    computeSolid();
  }
  function carveTo(tx, ty, reach) {
    // en yakın erişilebilir hücreye L şeklinde koridor
    let best = null, bd = Infinity;
    for (let i = 0; i < N; i++) if (reach[i]) {
      const x = i % W, y = (i / W) | 0, d = Math.abs(x - tx) + Math.abs(y - ty);
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) return;
    let [x, y] = [tx, ty];
    const clear = (cx, cy) => {
      for (let oy = 0; oy <= 1; oy++) for (let ox = 0; ox <= 1; ox++) {
        const xx = cx + ox, yy = cy + oy;
        if (!inB(xx, yy)) continue;
        const i = idx(xx, yy);
        mass[i] = 0; stampSolid[i] = 0;
        if (stampAt[i] >= 0) { lower[i] = -1; upper[i] = -1; }
        if (WATER_TERRAINS.has(terrain[i])) terrain[i] = def.base;
      }
    };
    while (x !== best[0]) { clear(x, y); x += Math.sign(best[0] - x); }
    while (y !== best[1]) { clear(x, y); y += Math.sign(best[1] - y); }
    clear(x, y);
  }

  // ---------------------------------------------------------------- 8) zemin indeksleri (geçişlerle)
  const ground = new Int16Array(N);
  const variant = (x, y) => {
    const h = hash2(x, y, seed + 1);
    return h < 0.55 ? 0 : h < 0.75 ? 1 : h < 0.9 ? 2 : 3;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y);
    const t = terrain[i];
    let mask = 0;
    const counts = {};
    const nb = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
    for (const [dx, dy, bit] of nb) {
      const xx = x + dx, yy = y + dy;
      const nt = inB(xx, yy) ? terrain[idx(xx, yy)] : t;
      if (nt === t) mask |= bit;
      else counts[nt] = (counts[nt] || 0) + 1;
    }
    let tile = null;
    if (mask !== 15) {
      const bases = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      for (const b of bases) {
        if (hasTile(`${t}/${b}_${mask}`)) { tile = T(`${t}/${b}_${mask}`); break; }
      }
    }
    ground[i] = tile ?? T(`${t}_${variant(x, y)}`);
  }
  // kütle tile'ları
  const massName = def.mass || 'forest_mass';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y);
    if (!mass[i]) continue;
    const below = y + 1 < H ? mass[idx(x, y + 1)] : 1;
    const h = hash2(x, y, seed + 2);
    lower[i] = below ? T(`${massName}_fill_${Math.floor(h * 3)}`) : T(`${massName}_face_${Math.floor(h * 2)}`);
    decor[i] = -1;
  }

  const sight = new Uint8Array(N);
  for (let i = 0; i < N; i++) sight[i] = (mass[i] || stampSolid[i]) ? 1 : 0;

  // spawn için yürünebilir hücreler
  const walkable = (x, y) => inB(x, y) && !solid[idx(x, y)];
  const areaCells = {};
  for (const a of def.areas || []) {
    const cells = [];
    if (a.rect) forRect(a.rect[0], a.rect[1], a.rect[2], a.rect[3], (x, y) => { if (walkable(x, y)) cells.push([x, y]); });
    else forDisc(a.x, a.y, a.r * 0.9, (x, y) => { if (walkable(x, y)) cells.push([x, y]); });
    areaCells[a.id] = cells;
  }

  return {
    id: def.id, def, w: W, h: H, ground, decor, lower, upper, solid, sight, terrain, mass,
    areaCells, repairs, repaired, stamps: stampList,
    walkable,
    isSolid: (x, y) => !inB(x, y) || solid[idx(x, y)] === 1,
  };
}

export function collectTargets(def) {
  const t = [];
  for (const e of Object.values(def.entries || {})) t.push({ x: e.x, y: e.y, what: 'entry' });
  for (const o of def.objects || []) t.push({ x: o.x, y: o.y, what: o.type + ':' + (o.id || o.npc || '') });
  for (const a of def.areas || []) if (!a.rect) t.push({ x: Math.round(a.x), y: Math.round(a.y), what: 'area:' + a.id });
  for (const l of def.locations || []) t.push({ x: l.x, y: l.y, what: 'loc:' + l.id });
  return t;
}

export function bfs(solid, W, H, sx, sy) {
  const reach = new Uint8Array(W * H);
  const q = new Int32Array(W * H);
  let qh = 0, qt = 0;
  const s = sy * W + sx;
  if (solid[s]) return reach;
  reach[s] = 1; q[qt++] = s;
  while (qh < qt) {
    const i = q[qh++];
    const x = i % W, y = (i / W) | 0;
    if (x > 0 && !reach[i - 1] && !solid[i - 1]) { reach[i - 1] = 1; q[qt++] = i - 1; }
    if (x < W - 1 && !reach[i + 1] && !solid[i + 1]) { reach[i + 1] = 1; q[qt++] = i + 1; }
    if (y > 0 && !reach[i - W] && !solid[i - W]) { reach[i - W] = 1; q[qt++] = i - W; }
    if (y < H - 1 && !reach[i + W] && !solid[i + W]) { reach[i + W] = 1; q[qt++] = i + W; }
  }
  return reach;
}

export function nearReachable(reach, W, H, x, y) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, yy = y + dy;
    if (xx >= 0 && yy >= 0 && xx < W && yy < H && reach[yy * W + xx]) return true;
  }
  return false;
}
