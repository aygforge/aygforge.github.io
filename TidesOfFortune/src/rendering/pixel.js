// Düşük çözünürlüklü pixel art çizim yardımcıları.

export const PAL = {
  k: '#1a1423', K: '#2b2233', w: '#f4ead5', W: '#d8c49a', y: '#f2c14e', Y: '#b8862b', o: '#e07b39', O: '#a8521f',
  r: '#c8423b', R: '#7e2525', b: '#3b6ea5', B: '#24426b', c: '#5fb8c9', C: '#2f7f93', g: '#5a9e4b', G: '#2f5e35',
  n: '#8b5a2b', N: '#5c3a1e', m: '#3d2716', s: '#9aa1a8', S: '#5d6470', p: '#8b5bb5', P: '#563275', t: '#d9b48f',
  T: '#a8805c', x: '#ffffff', z: '#6f6f6f', Z: '#3c3c44', l: '#bfe3ef', e: '#ffe08a', q: '#ff9e6e',
};

/** Satır dizilerinden sprite üretir (önbellekli). '.' saydam. */
const spriteCache = new Map();
export function spriteFromRows(rows, pal = PAL, scale = 1) {
  const key = rows.join('|') + scale + (pal === PAL ? '' : JSON.stringify(pal));
  if (spriteCache.has(key)) return spriteCache.get(key);
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const c = makeCanvas(w * scale, h * scale);
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch] || PAL[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  spriteCache.set(key, c);
  return c;
}

export function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function rect(ctx, x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function px(ctx, x, y, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

export function hline(ctx, x0, x1, y, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(Math.min(x0, x1)), Math.round(y), Math.round(Math.abs(x1 - x0)) + 1, 1);
}

export function vline(ctx, x, y0, y1, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(Math.min(y0, y1)), 1, Math.round(Math.abs(y1 - y0)) + 1);
}

export function line(ctx, x0, y0, x1, y1, col) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  ctx.fillStyle = col;
  for (let i = 0; i < 2000; i++) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function disc(ctx, cx, cy, r, col) {
  ctx.fillStyle = col;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.6));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

export function ellipse(ctx, cx, cy, rx, ry, col) {
  ctx.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

/** İki renk arası dither'lı dikey gradyan (pixel art tarzı) */
export function ditherGradient(ctx, x, y, w, h, stops) {
  // stops: [[t, '#hex'], ...]
  const cols = stops.map(([t, c]) => [t, hexToRgb(c)]);
  for (let yy = 0; yy < h; yy++) {
    const t = h <= 1 ? 0 : yy / (h - 1);
    let i = 0;
    while (i < cols.length - 2 && t > cols[i + 1][0]) i++;
    const [t0, c0] = cols[i];
    const [t1, c1] = cols[i + 1];
    const f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0 || 1)));
    // 4 kademeli dither
    const steps = 4;
    const q = f * steps;
    const lo = Math.floor(q) / steps;
    const hi = Math.min(1, lo + 1 / steps);
    const frac = q - Math.floor(q);
    const cA = mix(c0, c1, lo);
    const cB = mix(c0, c1, hi);
    if (frac < 0.25) rect(ctx, x, y + yy, w, 1, cA);
    else if (frac > 0.75) rect(ctx, x, y + yy, w, 1, cB);
    else {
      ctx.fillStyle = cA;
      ctx.fillRect(x, y + yy, w, 1);
      ctx.fillStyle = cB;
      const off = yy % 2;
      for (let xx = off; xx < w; xx += 2) ctx.fillRect(x + xx, y + yy, 1, 1);
    }
  }
}

export function hexToRgb(h) {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function mix(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

export function shade(hex, f) {
  const [r, g, b] = hexToRgb(hex);
  const k = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  return `rgb(${k(r)},${k(g)},${k(b)})`;
}

/** Basit deterministik gürültü */
export function hash2(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function blit(ctx, img, x, y, flip = false) {
  if (!img) return;
  if (!flip) {
    ctx.drawImage(img, Math.round(x), Math.round(y));
  } else {
    ctx.save();
    ctx.translate(Math.round(x) + img.width, Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
}
