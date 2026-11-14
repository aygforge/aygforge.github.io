// Parşömen dünya haritası: rota, bölgeler, mesafe renkleri, gemi konumu.
import { rect, px, hline, vline, line, disc, ellipse, hash2, makeCanvas } from './pixel.js';
import { HARBOR_BY_ID, REGIONS } from '../data/harbors.js';
import { iconCanvas } from './icons.js';

export const DIST_COLORS = { short: '#3f8f3a', medium: '#c89a1a', long: '#b8382b' };
const TYPE_ICON = { fishing: 'fish', trade: 'coin', military: 'shield', pirate: 'skull', fog: 'fog', mystery: 'eye', volcanic: 'volcano', ice: 'snow' };

/** Düğüm konumları (tampon koordinatları) — DOM etiketleri de bunu kullanır. */
export function mapLayout(route, W, H) {
  const m = 34;
  const n = route.length;
  return route.map((r, i) => {
    const x = m + (i / Math.max(1, n - 1)) * (W - m * 2);
    const y = H * 0.45 + Math.sin(i * 1.35 + 0.6) * H * 0.115;
    return { x: Math.round(x), y: Math.round(y) };
  });
}

let parchCache = null;
function parchment(W, H) {
  if (parchCache && parchCache.w === W && parchCache.h === H) return parchCache.c;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, W, H, '#e8d6a8');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x += 1) {
    const n = hash2(x, y, 3);
    if (n > 0.93) px(ctx, x, y, '#d8c290');
    else if (n < 0.04) px(ctx, x, y, '#f2e6c4');
  }
  // yanık kenarlar
  for (let x = 0; x < W; x++) {
    const a = 3 + Math.floor(hash2(x, 1) * 5);
    const b = 3 + Math.floor(hash2(x, 2) * 5);
    rect(ctx, x, 0, 1, a, '#8a5a2b');
    rect(ctx, x, a, 1, 1, '#b88a4a');
    rect(ctx, x, H - b, 1, b, '#8a5a2b');
    rect(ctx, x, H - b - 1, 1, 1, '#b88a4a');
  }
  for (let y = 0; y < H; y++) {
    const a = 3 + Math.floor(hash2(1, y) * 5);
    const b = 3 + Math.floor(hash2(2, y) * 5);
    rect(ctx, 0, y, a, 1, '#8a5a2b');
    rect(ctx, W - b, y, b, 1, '#8a5a2b');
  }
  // deniz dalgacıkları
  for (let i = 0; i < 90; i++) {
    const x = hash2(i, 11) * W;
    const y = 12 + hash2(i, 12) * (H - 24);
    px(ctx, x, y, '#b8a070'); px(ctx, x + 1, y - 1, '#b8a070'); px(ctx, x + 2, y, '#b8a070'); px(ctx, x + 3, y - 1, '#b8a070');
  }
  // pusula gülü
  const cx = W - 40, cy = H - 40;
  disc(ctx, cx, cy, 16, '#dcc898');
  line(ctx, cx, cy - 18, cx, cy + 18, '#7a5a3a');
  line(ctx, cx - 18, cy, cx + 18, cy, '#7a5a3a');
  line(ctx, cx - 10, cy - 10, cx + 10, cy + 10, '#a8865a');
  line(ctx, cx + 10, cy - 10, cx - 10, cy + 10, '#a8865a');
  for (let r = 0; r < 12; r++) hline(ctx, cx - (12 - r) / 4, cx + (12 - r) / 4, cy - 18 + r, '#b8382b');
  // deniz canavarı süsü
  const sx = 40, sy = H - 30;
  for (let s = 0; s < 24; s++) px(ctx, sx + s, sy - Math.sin(s * 0.4) * 5, '#7a5a3a');
  ellipse(ctx, sx + 26, sy - 4, 3, 2, '#7a5a3a');
  parchCache = { w: W, h: H, c };
  return c;
}

/**
 * opts: { known(idx) → bool tip görünür mü, progress: 0..1 gemi rotada nerede (yolculuk), t }
 */
export function drawMap(ctx, W, H, run, opts = {}) {
  ctx.drawImage(parchment(W, H), 0, 0);
  const nodes = mapLayout(run.route, W, H);
  // bölge bantları
  let prevRegion = null;
  run.route.forEach((r, i) => {
    const h = HARBOR_BY_ID[r.harborId];
    if (h.region !== prevRegion) {
      const x = i === 0 ? 8 : Math.round((nodes[i - 1].x + nodes[i].x) / 2);
      for (let y = 14; y < H - 14; y += 3) px(ctx, x, y, '#a8865a');
      rect(ctx, x + 2, 12, 22, 3, REGIONS[h.region].color);
      prevRegion = h.region;
    }
  });
  // çizgiler
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const col = DIST_COLORS[run.route[i].distance] || '#7a5a3a';
    const visited = i < run.idx;
    const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    for (let s = 0; s <= steps; s++) {
      const f = s / steps;
      const x = a.x + (b.x - a.x) * f;
      const y = a.y + (b.y - a.y) * f + Math.sin(f * Math.PI) * -6;
      if (!visited && s % 4 > 1) continue;
      rect(ctx, x, y, 2, 2, visited ? '#5a3a20' : col);
    }
  }
  // düğümler
  run.route.forEach((r, i) => {
    const h = HARBOR_BY_ID[r.harborId];
    const { x, y } = nodes[i];
    const visited = i <= run.idx;
    const known = visited || (opts.known && opts.known(i));
    disc(ctx, x, y, h.final ? 9 : 7, h.final ? '#e0b040' : visited ? '#7a5a3a' : '#b8a070');
    disc(ctx, x, y, h.final ? 7 : 5, h.final ? '#f8e8a8' : visited ? '#f4ead5' : '#e8d6a8');
    if (h.final) {
      const ic = iconCanvas('crown');
      ctx.drawImage(ic, x - 5, y - 5);
    } else if (known) {
      const ic = iconCanvas(TYPE_ICON[h.type] || 'anchor');
      ctx.drawImage(ic, x - 5, y - 5);
    } else {
      rect(ctx, x - 1, y - 3, 3, 1, '#7a5a3a');
      px(ctx, x + 1, y - 2, '#7a5a3a');
      px(ctx, x, y - 1, '#7a5a3a');
      px(ctx, x, y + 1, '#7a5a3a');
    }
  });
  // gemi
  const cur = nodes[run.idx];
  let gx = cur.x, gy = cur.y;
  if (opts.progress != null && run.idx < nodes.length - 1) {
    const b = nodes[run.idx + 1];
    const f = opts.progress;
    gx = cur.x + (b.x - cur.x) * f;
    gy = cur.y + (b.y - cur.y) * f - Math.sin(f * Math.PI) * 6;
  }
  const bob = Math.round(Math.sin((opts.t || 0) * 3));
  const sy = gy - 14 + bob;
  for (let r = 0; r < 3; r++) hline(ctx, gx - 6 + r, gx + 6 - r, sy + 8 + r, '#5c3a1e');
  vline(ctx, gx, sy, sy + 8, '#3a2414');
  for (let r = 0; r < 6; r++) hline(ctx, gx + 1, gx + 1 + (6 - r) * 0.8, sy + 1 + r, '#f4ead5');
  rect(ctx, gx + 1, sy - 2, 3, 2, '#c8423b');
  return nodes;
}
