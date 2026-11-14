// 5 gemi seviyesi için prosedürel pixel art; hasar kategorisine göre görsel değişim.
import { makeCanvas, rect, px, hline, vline, line, hash2, shade } from './pixel.js';

export const SHIP_STYLES = {
  1: { len: 54, hullH: 9, hull: '#8a4a32', hull2: '#6a3424', trim: '#c88a5a', sail: '#e6dabc', sail2: '#c8b896', masts: [{ x: 0.52, h: 30, sails: 1, w: 18 }], castle: 0, fore: 0, ports: 0, flag: '#c8423b', bowsprit: 8 },
  2: { len: 68, hullH: 10, hull: '#2f5e5a', hull2: '#1f4240', trim: '#d8c890', sail: '#f2ead2', sail2: '#cfc4a6', masts: [{ x: 0.34, h: 32, sails: 1, w: 18 }, { x: 0.66, h: 38, sails: 2, w: 20 }], castle: 3, fore: 0, ports: 0, flag: '#3b6ea5', bowsprit: 11 },
  3: { len: 86, hullH: 12, hull: '#5c3a1e', hull2: '#3e2612', trim: '#e8e0c8', sail: '#f4ecd8', sail2: '#d4c8a8', masts: [{ x: 0.33, h: 44, sails: 2, w: 24 }, { x: 0.63, h: 50, sails: 3, w: 26 }], castle: 4, fore: 2, ports: 4, flag: '#c8423b', bowsprit: 14 },
  4: { len: 106, hullH: 14, hull: '#3a2a20', hull2: '#24180f', trim: '#e0b84a', sail: '#f6efe0', sail2: '#d6ccb4', masts: [{ x: 0.24, h: 48, sails: 2, w: 24 }, { x: 0.5, h: 60, sails: 3, w: 30 }, { x: 0.75, h: 50, sails: 3, w: 26 }], castle: 6, fore: 3, ports: 7, flag: '#c8423b', bowsprit: 16 },
  5: { len: 126, hullH: 17, hull: '#4a2a18', hull2: '#2c180c', trim: '#f0c040', sail: '#fbf3dc', sail2: '#ddd0b0', masts: [{ x: 0.22, h: 54, sails: 3, w: 28 }, { x: 0.5, h: 70, sails: 4, w: 36 }, { x: 0.76, h: 58, sails: 3, w: 30 }], castle: 9, fore: 5, ports: 9, flag: '#8b5bb5', bowsprit: 18 },
};

const cache = new Map();

/**
 * Gemi sprite'ı ve geometrisi.
 * damage: healthy | damaged | critical | sinking
 * Dönüş: { canvas, deckY, waterY, deckX0, deckX1, perches[], hullX0, hullX1, w, h }
 */
export function shipSprite(level, damage = 'healthy', variant = 0) {
  const key = `${level}|${damage}|${variant}`;
  if (cache.has(key)) return cache.get(key);
  const st = SHIP_STYLES[level] || SHIP_STYLES[1];
  const maxMast = Math.max(...st.masts.map((m) => m.h));
  const pad = 6;
  const W = st.len + st.bowsprit + pad * 2;
  const top = maxMast + 10;
  const H = top + st.hullH + 4;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const x0 = pad;
  const deckY = top;
  const hh = st.hullH;
  const sev = { healthy: 0, damaged: 1, critical: 2, sinking: 3 }[damage] || 0;

  // Kale (kıç) ve baş kasarası
  if (st.castle) {
    const cw = Math.round(st.len * 0.2);
    rect(ctx, x0 + 1, deckY - st.castle, cw, st.castle, st.hull2);
    hline(ctx, x0 + 1, x0 + cw, deckY - st.castle, st.trim);
    for (let i = 0; i < cw; i += 3) vline(ctx, x0 + 1 + i, deckY - st.castle - 2, deckY - st.castle, st.hull2);
    hline(ctx, x0 + 1, x0 + cw, deckY - st.castle - 2, st.hull);
    if (level >= 4) for (let i = 3; i < cw - 2; i += 4) rect(ctx, x0 + 1 + i, deckY - st.castle + 2, 2, 2, '#f2d88a');
  }
  if (st.fore) {
    const fw = Math.round(st.len * 0.14);
    const fx = x0 + st.len - fw - 3;
    rect(ctx, fx, deckY - st.fore, fw, st.fore, st.hull2);
    hline(ctx, fx, fx + fw, deckY - st.fore, st.trim);
  }
  // Gövde
  for (let r = 0; r <= hh; r++) {
    const f = r / hh;
    const xl = x0 + Math.round(Math.pow(f, 2) * hh * 0.7);
    const xr = x0 + st.len - 1 - Math.round(Math.pow(f, 1.3) * hh * 1.7);
    let col = r === 0 ? st.trim : r % 3 === 0 ? st.hull2 : st.hull;
    if (r === Math.round(hh * 0.35) && level >= 3) col = st.trim;
    hline(ctx, xl, xr, deckY + r, col);
    px(ctx, xl, deckY + r, shade(st.hull2, -0.3));
    px(ctx, xr, deckY + r, shade(st.hull2, -0.3));
  }
  // parlama
  hline(ctx, x0 + 2, x0 + st.len - 4, deckY + 1, shade(st.hull, 0.18));
  // top lumbozları
  for (let i = 0; i < st.ports; i++) {
    const px0 = x0 + Math.round(st.len * 0.22 + (i / Math.max(1, st.ports)) * st.len * 0.62);
    rect(ctx, px0, deckY + Math.round(hh * 0.5), 2, 2, '#120a06');
    px(ctx, px0, deckY + Math.round(hh * 0.5) - 1, st.trim);
  }
  // Küpeşte
  hline(ctx, x0 + 1, x0 + st.len - 2, deckY - 2, st.hull2);
  for (let i = 1; i < st.len - 2; i += 4) vline(ctx, x0 + i, deckY - 2, deckY - 1, st.hull2);
  // Baş direği (bowsprit)
  const bowX = x0 + st.len - 2;
  line(ctx, bowX, deckY - 1, bowX + st.bowsprit, deckY - 1 - Math.round(st.bowsprit * 0.45), '#4a3018');
  // Pupa feneri
  if (level >= 3) {
    rect(ctx, x0, deckY - st.castle - 5, 2, 3, '#f2d06a');
    px(ctx, x0, deckY - st.castle - 6, '#2a1a10');
  }
  // Direkler ve yelkenler
  const perches = [];
  st.masts.forEach((m, mi) => {
    const mx = x0 + Math.round(st.len * m.x);
    const tilt = sev >= 2 && mi === st.masts.length - 1 ? 3 + sev : 0;
    const topX = mx + tilt;
    const topY = deckY - m.h;
    line(ctx, mx, deckY, topX, topY, '#4a3018');
    line(ctx, mx + 1, deckY, topX + 1, topY, '#6a4424');
    perches.push({ x: topX, y: topY - 1, kind: 'mast' });
    // yelkenler
    const sails = m.sails;
    const sailH = Math.floor((m.h - 6) / sails);
    for (let s = 0; s < sails; s++) {
      const sy = topY + 3 + s * sailH;
      const sw = Math.round(m.w * (0.7 + (s / Math.max(1, sails - 1 || 1)) * 0.3));
      const t = sy - topY;
      const cx = Math.round(mx + (tilt * (1 - t / m.h)));
      hline(ctx, cx - Math.round(sw / 2) - 1, cx + Math.round(sw / 2) + 1, sy, '#4a3018'); // seren
      if (s === 0) perches.push({ x: cx + Math.round(sw / 2), y: sy - 1, kind: 'yard' });
      for (let yy = 1; yy < sailH - 1; yy++) {
        const bulge = Math.round(Math.sin((yy / (sailH - 1)) * Math.PI) * 2);
        const xl = cx - Math.round(sw / 2) + 1;
        const xr = cx + Math.round(sw / 2) - 1 + bulge;
        const col = yy < 2 || xr - xl < 3 ? st.sail2 : (yy % 4 === 0 ? st.sail2 : st.sail);
        hline(ctx, xl, xr, sy + yy, col);
        px(ctx, xr, sy + yy, st.sail2);
      }
      // yamalar / yırtıklar
      if (level === 1 && s === 0) {
        rect(ctx, cx - 4, sy + 4, 4, 3, '#c9a77a');
        px(ctx, cx - 4, sy + 4, '#8a6a4a');
      }
      if (sev >= 2 && hash2(mi, s, sev) > 0.4) {
        const hx = cx - 2 + Math.round(hash2(s, mi, 9) * 6);
        rect(ctx, hx, sy + 3, 3, 2, 'rgba(0,0,0,0)');
        ctx.clearRect(hx, sy + 3, 3, 2);
        if (sev === 3) ctx.clearRect(hx - 2, sy + 2, 2, 4);
      }
    }
    // bayrak
    if (mi === Math.floor(st.masts.length / 2) || st.masts.length === 1) {
      rect(ctx, topX + 1, topY - 4, 6, 3, st.flag);
      px(ctx, topX + 7, topY - 3, st.flag);
      rect(ctx, topX + 1, topY - 2, 6, 1, shade(st.flag, -0.3));
    }
  });
  // Halatlar (stays)
  const firstM = st.masts[0];
  const lastM = st.masts[st.masts.length - 1];
  line(ctx, x0 + Math.round(st.len * lastM.x), deckY - lastM.h + 2, bowX + st.bowsprit, deckY - 1 - Math.round(st.bowsprit * 0.45), 'rgba(40,24,12,0.6)');
  line(ctx, x0 + Math.round(st.len * firstM.x), deckY - firstM.h + 2, x0 + 2, deckY - 2 - (st.castle || 0), 'rgba(40,24,12,0.6)');

  // Hasar: çatlaklar, yamalar
  if (sev >= 1) {
    const n = 2 + sev * 2;
    for (let i = 0; i < n; i++) {
      const cx = x0 + 6 + Math.round(hash2(i, level, 11) * (st.len - 18));
      const cy = deckY + 2 + Math.round(hash2(i, level, 12) * (hh - 4));
      line(ctx, cx, cy, cx + 2, cy + 1, '#140c06');
      line(ctx, cx + 2, cy + 1, cx + 3, cy + 3, '#140c06');
    }
  }
  if (sev >= 2) {
    const n = sev === 2 ? 2 : 4;
    for (let i = 0; i < n; i++) {
      const cx = x0 + 8 + Math.round(hash2(i, level, 21) * (st.len - 22));
      const cy = deckY + 2 + Math.round(hash2(i, level, 22) * (hh - 5));
      rect(ctx, cx, cy, 4, 3, '#c9a77a');
      px(ctx, cx, cy, '#6a4a2a');
      px(ctx, cx + 3, cy + 2, '#6a4a2a');
      px(ctx, cx + 1, cy + 1, '#8a6a4a');
    }
  }

  const castleW = st.castle ? Math.round(st.len * 0.2) : 0;
  const foreW = st.fore ? Math.round(st.len * 0.14) : 0;
  const res = {
    canvas: c,
    w: W,
    h: H,
    deckY: deckY - 2, // ayakların durduğu satır
    waterY: deckY + Math.round(hh * 0.6),
    deckX0: x0 + castleW + 3,
    deckX1: x0 + st.len - foreW - 8,
    hullX0: x0,
    hullX1: x0 + st.len,
    bowX: bowX + st.bowsprit,
    castle: st.castle,
    perches: perches.concat([{ x: x0 + castleW + 2, y: deckY - 4, kind: 'rail' }, { x: x0 + st.len - foreW - 6, y: deckY - 4, kind: 'rail' }]),
  };
  if (cache.size > 40) cache.clear();
  cache.set(key, res);
  return res;
}

/** Küçük gemi silüeti (event illüstrasyonları ve harita) */
export function drawShipSilhouette(ctx, x, y, s, o = {}) {
  // x,y: su hattı ortası; s: ölçek (1 ≈ 40px uzunluk)
  const len = Math.round(40 * s);
  const hh = Math.max(3, Math.round(6 * s));
  const hull = o.hull || '#3a2a20';
  const sail = o.sail || '#f2ead2';
  const masts = o.masts || 2;
  const x0 = Math.round(x - len / 2);
  const dir = o.flip ? -1 : 1;
  for (let r = 0; r < hh; r++) {
    const f = r / hh;
    const a = Math.round(f * f * hh * 0.8);
    const b = Math.round(Math.pow(f, 1.2) * hh * 1.4);
    const xl = dir > 0 ? x0 + a : x0 + b;
    const xr = dir > 0 ? x0 + len - b : x0 + len - a;
    hline(ctx, xl, xr, y - hh + r, r === 0 && o.trim ? o.trim : hull);
  }
  for (let i = 0; i < masts; i++) {
    const mx = x0 + Math.round(len * (0.3 + (i / Math.max(1, masts - 1 || 1)) * 0.4)) + (masts === 1 ? Math.round(len * 0.2) : 0);
    const mh = Math.round((18 + (i === Math.floor(masts / 2) ? 6 : 0)) * s);
    const tilt = o.broken && i === masts - 1 ? 4 : 0;
    line(ctx, mx, y - hh, mx + tilt, y - hh - mh, o.mast || '#2a1a10');
    const sw = Math.round(12 * s);
    const sh = Math.round(mh * 0.7);
    for (let yy = 0; yy < sh; yy++) {
      const bulge = Math.round(Math.sin((yy / sh) * Math.PI) * 2 * s) * dir;
      if (o.torn && (yy + i) % 5 === 2) continue;
      const xl = mx - Math.round(sw / 2);
      hline(ctx, xl, xl + sw + bulge, y - hh - mh + 2 + yy, typeof sail === 'function' ? sail(yy) : sail);
    }
    if (o.flagColor && i === Math.floor(masts / 2)) {
      rect(ctx, mx + 1, y - hh - mh - 3, Math.round(5 * s) + 1, Math.max(2, Math.round(3 * s)), o.flagColor);
      if (o.skull) px(ctx, mx + 3, y - hh - mh - 2, '#ffffff');
    }
  }
  if (o.ports) for (let i = 0; i < o.ports; i++) px(ctx, x0 + Math.round(len * (0.2 + (i / o.ports) * 0.6)), y - Math.round(hh * 0.5), '#0a0604');
}
