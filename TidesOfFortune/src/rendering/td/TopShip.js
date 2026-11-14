// TOP-DOWN gemiler: pruva üstte, kıç altta. Her seviyenin kendi gövde silüeti, güverte düzeni,
// direk/yelken sistemi, dümen bölümü, kargo alanı, dolaşım ızgarası ve hasar görselleri vardır.
import { makeCanvas, rect, px, hline, vline, line, disc, hash2, shade } from '../pixel.js';

export const TD_SHIPS = {
  1: { name: 'Paslı Martı', len: 156, beam: 64, rim: '#5a2a1a', rim2: '#8a4a32', deck: '#b98a58', deck2: '#a47648', trim: '#c88a5a', sail: '#e9ddbc', sailShade: '#c9b48c', flag: '#c8423b',
    masts: [{ t: 0.4, yard: 76 }], helm: 0.87, hatch: { t: 0.6, w: 18, h: 14 }, quarter: 0, fore: 0, cannons: 0, bowsprit: 16, patches: true, boat: false },
  2: { name: 'Çift Yelkenli', len: 170, beam: 74, rim: '#1f4240', rim2: '#2f5e5a', deck: '#c49a62', deck2: '#ae8650', trim: '#d8c890', sail: '#f2ead2', sailShade: '#d0c4a2', flag: '#3b6ea5',
    masts: [{ t: 0.3, yard: 74 }, { t: 0.6, yard: 88 }], helm: 0.88, hatch: { t: 0.45, w: 18, h: 14 }, quarter: 0.84, fore: 0, cannons: 0, bowsprit: 20, boat: false },
  3: { name: 'Brig', len: 186, beam: 84, rim: '#2e1c0e', rim2: '#5c3a1e', deck: '#c8a06a', deck2: '#b28a56', trim: '#e8e0c8', sail: '#f4ecd8', sailShade: '#d4c8a8', flag: '#c8423b',
    masts: [{ t: 0.28, yard: 92 }, { t: 0.56, yard: 104 }], helm: 0.9, hatch: { t: 0.42, w: 20, h: 16 }, quarter: 0.79, fore: 0, cannons: 2, bowsprit: 22, boat: false },
  4: { name: 'Firkateyn', len: 200, beam: 96, rim: '#1c120c', rim2: '#3a2a20', deck: '#cfa872', deck2: '#b8925e', trim: '#e0b84a', sail: '#f6efe0', sailShade: '#d6ccb4', flag: '#c8423b',
    masts: [{ t: 0.22, yard: 96 }, { t: 0.45, yard: 118 }, { t: 0.66, yard: 106 }], helm: 0.91, hatch: { t: 0.555, w: 22, h: 14 }, quarter: 0.8, fore: 0.1, cannons: 3, bowsprit: 24, boat: true },
  5: { name: 'Ticaret Galeonu', len: 216, beam: 112, rim: '#24120a', rim2: '#4a2a18', deck: '#d4ae78', deck2: '#bc9662', trim: '#f0c040', sail: '#fbf3dc', sailShade: '#ddd0b0', flag: '#8b5bb5',
    masts: [{ t: 0.2, yard: 112 }, { t: 0.43, yard: 134 }, { t: 0.64, yard: 122 }], helm: 0.9, hatch: { t: 0.535, w: 28, h: 16 }, quarter: 0.77, fore: 0.12, cannons: 4, bowsprit: 26, boat: true, gold: true },
};

// Diğer gemiler için stil (aynı üretici, farklı renk/bayrak)
export const SHIP_STYLES = {
  pirate: { rim: '#0e0a0c', rim2: '#2a2026', deck: '#6a5a4e', deck2: '#5a4a40', trim: '#8a2a2a', sail: '#2a2830', sailShade: '#161418', flag: '#0a0a0a', skull: true },
  merchant: { rim: '#4a2a14', rim2: '#7a4a24', deck: '#d4b07a', deck2: '#c09a64', trim: '#e8c45a', sail: '#f4ead5', sailShade: '#c8423b', flag: '#f2c14e', stripes: true },
  warship: { rim: '#141c2a', rim2: '#2a3448', deck: '#b8a07a', deck2: '#a48c66', trim: '#e0b84a', sail: '#f4f6f8', sailShade: '#c4ccd6', flag: '#3b6ea5' },
  ghost: { rim: '#1a3a30', rim2: '#2a5a4a', deck: '#4a8a72', deck2: '#3a7a62', trim: '#8affd0', sail: '#9affd0', sailShade: '#5ac8a0', flag: '#2a5a4a', ghost: true },
  plague: { rim: '#2a2618', rim2: '#4a4430', deck: '#8a7c58', deck2: '#7a6c4a', trim: '#6a6040', sail: '#8a8262', sailShade: '#5a5440', flag: '#e8d040' },
};

export const GRID = 3; // dolaşım ızgarası hücre boyutu (px)
const cache = new Map();

function halfWidth(st, y) {
  // y: 0 (pruva ucu) … len (kıç)
  const t = y / st.len;
  const b = st.beam / 2;
  if (t < 0.32) return b * Math.pow(Math.sin(((t / 0.32) * Math.PI) / 2), 0.75);
  if (t > 0.86) return b * (1 - (t - 0.86) * 0.9);
  return b;
}

/**
 * Gemi düzeni + sprite'lar.
 * Dönüş: { hull, sailsFull, sailsFurled, w, h, cx, len, beam, top, walk(grid), stations, cargoSlots, perches, masts, cannons, hw(y) }
 * Koordinatlar sprite içi: x 0..w, y 0..h. Gemi merkezi (cx, top + len/2).
 */
export function topShip(level, damage = 'healthy', style = null) {
  const key = `${level}|${damage}|${style}`;
  if (cache.has(key)) return cache.get(key);
  const st = { ...(TD_SHIPS[level] || TD_SHIPS[1]), ...(style ? SHIP_STYLES[style] : {}) };
  const maxYard = Math.max(...st.masts.map((m) => m.yard));
  const w = Math.max(st.beam + 16, maxYard + 10);
  const top = st.bowsprit + 4;
  const h = top + st.len + 6;
  const cx = Math.round(w / 2);
  const sev = { healthy: 0, damaged: 1, critical: 2, sinking: 3 }[damage] || 0;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const hw = (y) => halfWidth(st, y);

  // Gölge (suya düşen)
  ctx.fillStyle = 'rgba(8,20,40,0.28)';
  for (let y = 0; y < st.len; y++) {
    const a = hw(y);
    ctx.fillRect(Math.round(cx - a + 3), top + y + 4, Math.round(a * 2), 1);
  }
  // Baş direği (bowsprit)
  rect(ctx, cx - 1, top - st.bowsprit, 2, st.bowsprit + 6, '#4a3018');
  px(ctx, cx, top - st.bowsprit - 1, '#2a1a0c');
  line(ctx, cx, top - st.bowsprit + 2, cx - Math.round(st.beam * 0.35), top + Math.round(st.len * 0.18), 'rgba(40,24,12,0.5)');
  line(ctx, cx, top - st.bowsprit + 2, cx + Math.round(st.beam * 0.35), top + Math.round(st.len * 0.18), 'rgba(40,24,12,0.5)');
  // Gövde: kenar + güverte kalasları
  for (let y = 0; y < st.len; y++) {
    const a = Math.round(hw(y));
    if (a <= 0) continue;
    hline(ctx, cx - a, cx + a, top + y, st.rim);
    if (a > 2) hline(ctx, cx - a + 1, cx + a - 1, top + y, st.rim2);
    if (a > 4) {
      for (let x = -a + 3; x <= a - 3; x++) {
        const plank = Math.floor((x + 200) / 4);
        const joint = Math.floor((y + plank * 17) / 23) !== Math.floor((y + 1 + plank * 17) / 23);
        let col = plank % 2 ? st.deck : st.deck2;
        if ((x + 200) % 4 === 0) col = shade(st.deck2, -0.18);
        if (joint) col = shade(st.deck2, -0.25);
        px(ctx, cx + x, top + y, col);
      }
      px(ctx, cx - a + 2, top + y, st.trim);
      px(ctx, cx + a - 2, top + y, st.trim);
    }
  }
  // kıç düz kenarı
  hline(ctx, cx - Math.round(hw(st.len - 1)), cx + Math.round(hw(st.len - 1)), top + st.len - 1, st.rim);
  // Kıç güvertesi (yükseltilmiş)
  if (st.quarter) {
    const y0 = Math.round(st.len * st.quarter);
    for (let y = y0; y < st.len - 2; y++) {
      const a = Math.round(hw(y)) - 3;
      hline(ctx, cx - a, cx + a, top + y, (y - y0) % 4 === 0 ? shade(st.deck, -0.12) : shade(st.deck, 0.06));
    }
    hline(ctx, cx - Math.round(hw(y0)) + 2, cx + Math.round(hw(y0)) - 2, top + y0, st.rim2);
    hline(ctx, cx - Math.round(hw(y0)) + 2, cx + Math.round(hw(y0)) - 2, top + y0 + 1, st.trim);
    if (level >= 4) {
      // kaptan köşkü çatı pencereleri
      rect(ctx, cx - 7, top + y0 + 8, 14, 8, '#5a3a20');
      rect(ctx, cx - 6, top + y0 + 9, 5, 6, '#9cc8e0');
      rect(ctx, cx + 1, top + y0 + 9, 5, 6, '#9cc8e0');
    }
  }
  if (st.fore) {
    const y1 = Math.round(st.len * st.fore);
    for (let y = 8; y < y1; y++) {
      const a = Math.round(hw(y)) - 3;
      if (a > 0) hline(ctx, cx - a, cx + a, top + y, (y % 4) ? shade(st.deck, 0.06) : shade(st.deck, -0.12));
    }
    hline(ctx, cx - Math.round(hw(y1)) + 2, cx + Math.round(hw(y1)) - 2, top + y1, st.trim);
  }
  if (st.gold) {
    for (let y = 6; y < st.len - 2; y += 1) {
      const a = Math.round(hw(y));
      if (y % 3 === 0) { px(ctx, cx - a, top + y, '#f0c040'); px(ctx, cx + a, top + y, '#f0c040'); }
    }
  }
  // Ambar kapağı (kargo alanının merkezi)
  const hy = Math.round(st.len * st.hatch.t);
  const hx0 = cx - Math.round(st.hatch.w / 2);
  rect(ctx, hx0 - 1, top + hy - 1, st.hatch.w + 2, st.hatch.h + 2, st.rim);
  rect(ctx, hx0, top + hy, st.hatch.w, st.hatch.h, '#5c3a1e');
  for (let x = 0; x < st.hatch.w; x += 3) vline(ctx, hx0 + x, top + hy, top + hy + st.hatch.h - 1, '#3a2412');
  for (let y = 0; y < st.hatch.h; y += 3) hline(ctx, hx0, hx0 + st.hatch.w - 1, top + hy + y, '#3a2412');
  // Dümen
  const helmY = top + Math.round(st.len * st.helm);
  disc(ctx, cx, helmY, 4, '#4a2e18');
  disc(ctx, cx, helmY, 3, '#8b5a2b');
  disc(ctx, cx, helmY, 1, '#3a2412');
  for (const [dx, dy] of [[0, -4], [0, 4], [-4, 0], [4, 0], [-3, -3], [3, 3], [-3, 3], [3, -3]]) px(ctx, cx + dx, helmY + dy, '#3a2412');
  // Toplar
  const cannons = [];
  for (let i = 0; i < st.cannons; i++) {
    const y = Math.round(st.len * (0.34 + (i / Math.max(1, st.cannons)) * 0.38));
    for (const side of [-1, 1]) {
      const a = Math.round(hw(y));
      const x0 = cx + side * (a - 6);
      rect(ctx, Math.min(x0, x0 + side * 3), top + y - 2, 4, 5, '#6a4424');
      rect(ctx, side > 0 ? x0 + 1 : x0 - 4, top + y - 1, 6, 3, '#1e1e24');
      px(ctx, side > 0 ? x0 + 6 : x0 - 5, top + y, '#3a3a44');
      cannons.push({ x: x0 - side * 3, y: top + y, side });
    }
  }
  // Filika
  if (st.boat) {
    const by = Math.round(st.len * 0.73);
    for (let y = 0; y < 18; y++) {
      const a = Math.round(Math.min(4, 1 + y * 0.6, (18 - y) * 0.7));
      hline(ctx, cx + Math.round(hw(by)) - 14 - a, cx + Math.round(hw(by)) - 14 + a, top + by + y - 9, y % 6 ? '#8a5a2b' : '#5c3a1e');
    }
  }
  // Direk dipleri (sprite'ta), yelkenler ayrı katmanda
  const masts = st.masts.map((m) => {
    const y = top + Math.round(st.len * m.t);
    disc(ctx, cx, y, 4, '#2a1a0c');
    disc(ctx, cx, y, 3, '#6a4424');
    px(ctx, cx - 1, y - 1, '#8a6034');
    return { x: cx, y, yard: m.yard };
  });
  // Fıçılar ve halat kangalları (dekor/engel)
  const props = [];
  const addBarrel = (x, y) => { disc(ctx, x, y, 3, '#5c3a1e'); disc(ctx, x, y, 2, '#8a5a2b'); px(ctx, x, y, '#3a2412'); props.push({ x, y, r: 4 }); };
  const addCoil = (x, y) => { disc(ctx, x, y, 3, '#a88a5a'); disc(ctx, x, y, 1, '#6a5030'); props.push({ x, y, r: 3 }); };
  const ya = Math.round(st.len * 0.18);
  addCoil(cx - Math.round(hw(ya)) + 7, top + ya);
  addBarrel(cx + Math.round(hw(ya)) - 7, top + ya + 4);
  const yb = Math.round(st.len * (st.quarter ? st.quarter - 0.04 : 0.8));
  addBarrel(cx - Math.round(hw(yb)) + 7, top + yb);
  if (level >= 3) addBarrel(cx - Math.round(hw(yb)) + 7, top + yb - 7);

  // Hasar
  if (sev >= 1) {
    const n = 3 + sev * 3;
    for (let i = 0; i < n; i++) {
      const y = 12 + Math.round(hash2(i, level, 31) * (st.len - 24));
      const a = Math.round(hw(y)) - 5;
      const x = cx - a + Math.round(hash2(i, level, 32) * a * 2);
      line(ctx, x, top + y, x + 2, top + y + 2, '#2a1608');
      line(ctx, x + 2, top + y + 2, x + 1, top + y + 4, '#2a1608');
    }
  }
  if (sev >= 2) {
    const n = sev === 2 ? 3 : 6;
    for (let i = 0; i < n; i++) {
      const y = 14 + Math.round(hash2(i, level, 41) * (st.len - 30));
      const a = Math.round(hw(y)) - 8;
      const x = cx - a + Math.round(hash2(i, level, 42) * a * 2);
      if (i % 2) {
        // yama
        rect(ctx, x, top + y, 6, 5, '#d9b88a');
        px(ctx, x, top + y, '#6a4a2a'); px(ctx, x + 5, top + y + 4, '#6a4a2a');
      } else {
        // delik
        rect(ctx, x, top + y, 4, 3, '#140a04');
        px(ctx, x - 1, top + y + 1, '#e8c890'); px(ctx, x + 4, top + y, '#e8c890');
      }
    }
  }
  if (sev >= 3) {
    for (let i = 0; i < 4; i++) {
      const y = 30 + Math.round(hash2(i, level, 51) * (st.len - 60));
      const a = Math.round(hw(y)) - 10;
      const x = cx - a + Math.round(hash2(i, level, 52) * a * 2);
      ctx.fillStyle = 'rgba(70,140,190,0.55)';
      ctx.fillRect(x - 4, top + y - 2, 9, 5);
      ctx.fillRect(x - 2, top + y - 3, 5, 7);
    }
  }

  // Dolaşım ızgarası
  const gw = Math.ceil(w / GRID);
  const gh = Math.ceil(h / GRID);
  const walk = new Uint8Array(gw * gh);
  const hatchRect = { x0: hx0 - 2, y0: top + hy - 2, x1: hx0 + st.hatch.w + 2, y1: top + hy + st.hatch.h + 2 };
  const cargoZone = cargoZoneFor(st, cx, top, hy);
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const x = gx * GRID + GRID / 2;
    const y = gy * GRID + GRID / 2;
    const ly = y - top;
    if (ly < 10 || ly > st.len - 5) continue;
    const a = hw(ly) - 8;
    if (Math.abs(x - cx) > a) continue;
    if (x > cargoZone.x0 && x < cargoZone.x1 && y > cargoZone.y0 && y < cargoZone.y1) continue;
    if (masts.some((m) => Math.hypot(x - m.x, y - m.y) < 6)) continue;
    if (Math.hypot(x - cx, y - helmY) < 6) continue;
    if (props.some((p) => Math.hypot(x - p.x, y - p.y) < p.r + 3)) continue;
    if (cannons.some((k) => Math.abs(x - k.x) < 6 && Math.abs(y - k.y) < 5)) continue;
    walk[gy * gw + gx] = 1;
  }
  const nearestWalkable = (x, y) => {
    let best = null, bd = 1e9;
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      if (!walk[gy * gw + gx]) continue;
      const d = Math.hypot(gx * GRID + 1.5 - x, gy * GRID + 1.5 - y);
      if (d < bd) { bd = d; best = { x: gx * GRID + 1.5, y: gy * GRID + 1.5 }; }
    }
    return best;
  };
  // İstasyonlar (tayfa görev noktaları)
  const S = (type, x, y, face) => ({ type, ...nearestWalkable(x, y), face });
  const stations = [
    S('helm', cx, helmY + 7, 'up'),
    S('bow', cx, top + 16, 'up'),
    S('bowL', cx - Math.round(hw(30)) + 9, top + 30, 'left'),
    S('bowR', cx + Math.round(hw(30)) - 9, top + 30, 'right'),
    S('cargo', cargoZone.x0 - 4, (cargoZone.y0 + cargoZone.y1) / 2, 'right'),
    S('cargo', cargoZone.x1 + 4, (cargoZone.y0 + cargoZone.y1) / 2, 'left'),
    S('galley', cx + Math.round(hw(st.len * 0.75)) - 10, top + st.len * 0.75, 'right'),
    S('stern', cx - Math.round(hw(st.len * 0.93)) + 9, top + st.len * 0.93, 'down'),
    S('center', cx, (masts[0].y + cargoZone.y0) / 2, 'up'),
    ...masts.map((m) => S('mast', m.x + 7, m.y + 2, 'left')),
    ...[0.35, 0.5, 0.7].flatMap((t) => [S('railL', cx - Math.round(hw(st.len * t)) + 8, top + st.len * t, 'left'), S('railR', cx + Math.round(hw(st.len * t)) - 8, top + st.len * t, 'right')]),
    ...cannons.map((k) => S('cannon', k.x - k.side * 6, k.y, k.side > 0 ? 'right' : 'left')),
  ].filter((s) => s.x != null);
  const perches = [
    ...masts.flatMap((m) => [{ x: m.x - m.yard / 2 + 2, y: m.y - 2, kind: 'yard' }, { x: m.x + m.yard / 2 - 2, y: m.y - 2, kind: 'yard' }]),
    { x: cx, y: top - st.bowsprit + 2, kind: 'bowsprit' },
    { x: cx - Math.round(hw(st.len * 0.9)) + 3, y: top + st.len * 0.9, kind: 'rail' },
  ];
  const res = {
    level, st, hull: c, w, h, cx, top, len: st.len, beam: st.beam, walk, gw, gh, stations, perches, masts, cannons,
    cargoZone, cargoSlots: cargoSlots(cargoZone), hatchRect, helm: { x: cx, y: helmY }, hw: (y) => hw(y - top),
    style,
    sailsFull: drawSails(st, masts, w, h, cx, sev, false),
    sailsFurled: drawSails(st, masts, w, h, cx, sev, true),
    center: { x: cx, y: top + st.len / 2 },
  };
  if (cache.size > 30) cache.clear();
  cache.set(key, res);
  return res;
}

function cargoZoneFor(st, cx, top, hy) {
  const zw = Math.min(st.beam - 26, st.hatch.w + 22);
  const zh = st.hatch.h + 28;
  return { x0: cx - Math.round(zw / 2), x1: cx + Math.round(zw / 2), y0: top + hy - 12, y1: top + hy + zh - 12 };
}

function cargoSlots(z) {
  const slots = [];
  const cols = Math.max(2, Math.floor((z.x1 - z.x0) / 10));
  const rows = Math.max(2, Math.floor((z.y1 - z.y0) / 10));
  // merkezden dışa doğru sıralı (ambar kapağı çevresine istiflenir)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) slots.push({ x: z.x0 + 5 + c * 10, y: z.y0 + 5 + r * 10 });
  const mx = (z.x0 + z.x1) / 2, my = (z.y0 + z.y1) / 2;
  slots.sort((a, b) => Math.hypot(a.x - mx, (a.y - my) * 1.3) - Math.hypot(b.x - mx, (b.y - my) * 1.3));
  return slots;
}

function drawSails(st, masts, w, h, cx, sev, furled) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  masts.forEach((m, mi) => {
    const half = Math.round(m.yard / 2);
    const broken = sev >= 2 && mi === masts.length - 1;
    // seren
    if (broken) {
      line(ctx, cx - half, m.y + 3, cx + half - 6, m.y - 4, '#4a3018');
    } else {
      hline(ctx, cx - half, cx + half, m.y, '#4a3018');
      hline(ctx, cx - half, cx + half, m.y + 1, '#3a2412');
    }
    // halatlar (çarmıh)
    ctx.fillStyle = 'rgba(30,18,8,0.45)';
    line(ctx, cx - half, m.y + 1, cx - Math.round(st.beam / 2) + 2, m.y + 12, 'rgba(30,18,8,0.45)');
    line(ctx, cx + half, m.y + 1, cx + Math.round(st.beam / 2) - 2, m.y + 12, 'rgba(30,18,8,0.45)');
    if (furled) {
      // toplanmış yelken: seren üzerinde sarılı bant
      for (let x = -half + 3; x <= half - 3; x++) {
        px(ctx, cx + x, m.y - 1, x % 5 === 0 ? st.sailShade : st.sail);
        px(ctx, cx + x, m.y - 2, st.sailShade);
      }
      return;
    }
    // açık yelken: rüzgârla öne (yukarı) şişmiş hilal bant
    const bulge = 7 + Math.round(m.yard / 18);
    const thick = 6 + Math.round(m.yard / 24);
    for (let x = -half + 2; x <= half - 2; x++) {
      const f = x / half;
      const yTop = m.y - 2 - Math.round(bulge * (1 - f * f));
      const yBot = m.y - 1;
      for (let y = yTop; y <= yBot; y++) {
        const edge = y === yTop || Math.abs(x) >= half - 3;
        let col = edge ? st.sailShade : (y - yTop) < thick * 0.4 ? st.sail : shade(st.sail, -0.06);
        if (Math.abs(x) % 9 === 0) col = st.sailShade;
        if (st.stripes && Math.floor((x + 200) / 6) % 2) col = st.sailShade;
        if (sev >= 2 && hash2(x, y, mi) > 0.965) continue; // yırtık
        px(ctx, cx + x, y, col);
      }
    }
    // armadan bayrak (ana direk)
    if (mi === Math.floor(masts.length / 2) || masts.length === 1) {
      rect(ctx, cx + 3, m.y - bulge - 6, 7, 4, st.flag);
      px(ctx, cx + 10, m.y - bulge - 5, st.flag);
      if (st.skull) { px(ctx, cx + 6, m.y - bulge - 5, '#ffffff'); px(ctx, cx + 5, m.y - bulge - 4, '#ffffff'); px(ctx, cx + 7, m.y - bulge - 4, '#ffffff'); }
    }
  });
  return c;
}

/** Izgarada A* yol bulma (4-yön). Dönüş: [{x,y}] sprite koordinatları */
export function findPath(ship, sx, sy, tx, ty, blocked = null) {
  const { gw, gh, walk } = ship;
  const toCell = (x, y) => [Math.max(0, Math.min(gw - 1, Math.floor(x / GRID))), Math.max(0, Math.min(gh - 1, Math.floor(y / GRID)))];
  const [ax, ay] = toCell(sx, sy);
  const [bx, by] = toCell(tx, ty);
  const ok = (x, y) => x >= 0 && y >= 0 && x < gw && y < gh && walk[y * gw + x] && !(blocked && blocked.has(y * gw + x));
  if (!ok(bx, by)) return null;
  const start = ay * gw + ax;
  const goal = by * gw + bx;
  const g = new Map([[start, 0]]);
  const came = new Map();
  const open = [[Math.abs(ax - bx) + Math.abs(ay - by), start]];
  let iter = 0;
  while (open.length && iter++ < 4000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [, cur] = open.splice(bi, 1)[0];
    if (cur === goal) {
      const path = [];
      let n = cur;
      while (n !== start && n != null) {
        path.push({ x: (n % gw) * GRID + 1.5, y: Math.floor(n / gw) * GRID + 1.5 });
        n = came.get(n);
      }
      return path.reverse();
    }
    const cx = cur % gw, cy = Math.floor(cur / gw);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!ok(nx, ny) && !(nx === ax && ny === ay)) continue;
      const ni = ny * gw + nx;
      const ng = g.get(cur) + 1;
      if (ng < (g.get(ni) ?? 1e9)) {
        g.set(ni, ng);
        came.set(ni, cur);
        open.push([ng + Math.abs(nx - bx) + Math.abs(ny - by), ni]);
      }
    }
  }
  return null;
}

export function randomWalkable(ship, rnd = Math.random) {
  const { gw, gh, walk } = ship;
  for (let k = 0; k < 60; k++) {
    const i = Math.floor(rnd() * gw * gh);
    if (walk[i]) return { x: (i % gw) * GRID + 1.5, y: Math.floor(i / gw) * GRID + 1.5 };
  }
  return { ...ship.stations[0] };
}
