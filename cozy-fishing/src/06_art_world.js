/* =====================================================================
   06_art_world.js : kasaba, 7 bölge × 3 av noktası, ev içi, deniz haritası, gökyüzü/su/hava
   ===================================================================== */
const RW = 1500, SPOT_X = [260, 750, 1240], SURF = 214;
const REGION_PAL = {
  sakin_liman: { sky: ['#6fbce6', '#b9e2f2', '#f4ecd6'], sea: ['#3aa4bc', '#1f6e8e', '#0e3a5a'], land: '#7aa85a', land2: '#5a8a48', rock: '#a89888' },
  yesil_koy: { sky: ['#7cc8e8', '#c0e8ee', '#eef2d8'], sea: ['#2fb4a2', '#1a7c7a', '#0c4450'], land: '#5aa04a', land2: '#3e7e3a', rock: '#a8a08a' },
  kayalik_adalar: { sky: ['#62b0e0', '#b0daf0', '#e8eadc'], sea: ['#2f90c2', '#1a5c90', '#0c2e58'], land: '#8a9a5a', land2: '#6a7a48', rock: '#9a8a7a' },
  serin_akintilar: { sky: ['#74a4c8', '#b0cade', '#dce4e6'], sea: ['#3a80a2', '#225c7c', '#10304a'], land: '#6a8a6a', land2: '#4a6a52', rock: '#7a8088' },
  sisli_kuzey: { sky: ['#8698ac', '#b4c0cc', '#d6dade'], sea: ['#3a6272', '#22424e', '#101e28'], land: '#3e5a4a', land2: '#2a4238', rock: '#5a626a' },
  gunes_adalari: { sky: ['#40b4f0', '#9cdef8', '#f8f0d0'], sea: ['#28d2c8', '#18a2ba', '#0a5a8a'], land: '#5ab84a', land2: '#3a8a3a', rock: '#c8b89a' },
  derin_mavi: { sky: ['#4a8ed8', '#96c6ec', '#e0ecf0'], sea: ['#1e5cb2', '#123c82', '#08164a'], land: '#4a7a5a', land2: '#3a5a48', rock: '#6a7480' }
};
const WX_TINT = { sunny: null, cloudy: ['#9aa6b4', 0.32], rain: ['#6a7686', 0.5], fog: ['#cfd5da', 0.55], wind: ['#a8bcc8', 0.18] };
const tint = (c, wx) => { const t = WX_TINT[wx]; return t ? mix(c, t[0], t[1]) : c; };

/* ---------- gökyüzü ---------- */
function skyCanvas(key, pal, wx, h) {
  return Atlas.get('sky:' + key + ':' + wx + ':' + h, () => {
    const pb = new PB(LW, h);
    bandGradient(pb, 0, 0, LW, h, [[0, tint(pal[0], wx)], [0.6, tint(pal[1], wx)], [1, tint(pal[2], wx)]]);
    return pb;
  });
}
function cloudPB(v, c1, c2) {
  const r = mulberry(v * 77 + 3); const w = 46 + v * 10, h = 18; const pb = new PB(w, h + 2);
  for (let i = 0; i < 6; i++) { const cx = 8 + r() * (w - 16), cy = 9 + r() * 4, rx = 6 + r() * 8, ry = 4 + r() * 4; pb.ellipse(cx, cy, rx, ry, c1, (x, y) => y > cy + ry * 0.3 ? c2 : c1); }
  pb.rect(4, h - 4, w - 8, 3, c2);
  return pb;
}
const cloudSprite = (v, wx) => Atlas.get('cloud:' + v + wx, () => wx === 'rain' ? cloudPB(v, '#9aa2ae', '#7a8290') : (wx === 'cloudy' || wx === 'fog') ? cloudPB(v, '#dfe3e8', '#bcc4cc') : cloudPB(v, '#ffffff', '#dfe8ef'));
const sunSprite = () => Atlas.get('sun', () => { const pb = new PB(30, 30); pb.ellipse(15, 15, 14, 14, '#fff2c0'); pb.ellipse(15, 15, 10, 10, '#ffe27a'); pb.ellipse(13, 13, 5, 5, '#fff8de'); return pb; });
/* ---------- su ---------- */
function waveFrame(seaKey, sea, f) {
  return Atlas.get('wave:' + seaKey + ':' + f, () => {
    const pb = new PB(128, 12); const top = light(sea[0], 0.45), body = sea[0], foam = '#f4fbff';
    for (let x = 0; x < 128; x++) {
      const a = (x / 128) * Math.PI * 2;
      const h = Math.round(1.4 * Math.sin(a * 2 + f / 8 * Math.PI * 2) + 0.8 * Math.sin(a * 5 - f / 8 * Math.PI * 4));
      const y0 = 4 + h;
      for (let y = y0; y < 12; y++) pb.set(x, y, y === y0 ? foam : (y === y0 + 1 ? top : body));
      if (h <= -1 && (x + f) % 7 === 0) pb.set(x, y0 + 2, light(body, 0.2));
    }
    return pb;
  });
}
function underwaterCanvas(key, sea, wx, h) {
  return Atlas.get('uw:' + key + wx + h, () => { const pb = new PB(LW, h); bandGradient(pb, 0, 0, LW, h, [[0, tint(sea[0], wx)], [0.35, tint(sea[1], wx)], [1, tint(sea[2], wx)]]); return pb; });
}
/* ---------- doğa yardımcıları ---------- */
function ridge(pb, x0, x1, base, top, amp, freq, seed, c, cTop, snowAt) {
  for (let x = x0; x < x1; x++) {
    const h = top + amp * fbm(x * freq, seed, 4); const yr = Math.round(base - h);
    for (let y = yr; y < base; y++) {
      let col = c;
      if (y < yr + 2) col = cTop;
      else if (snowAt != null && h > snowAt && y < yr + (h - snowAt) * 0.6 + 2) col = (ihash(x, y, 3) < 0.15) ? '#dfe8f0' : '#f4f8fb';
      else if (dith(x, y, (y - yr) / Math.max(1, base - yr) * 0.6)) col = dark(c, 0.08);
      pb.set(x, y, col);
    }
  }
}
function treeRound(pb, x, y, r, c1, c2, trunk) {
  pb.rect(x - 1, y - r, 2, r + 1, trunk || '#6a4a2a');
  const rr = mulberry(x * 13 + y);
  for (let i = 0; i < 5; i++) { const ox = (rr() - 0.5) * r * 1.2, oy = -r - rr() * r * 0.8; pb.ellipse(x + ox, y + oy, r * 0.6 + 1, r * 0.5 + 1, c1, (px, py) => py > y + oy + 1 ? c2 : (ihash(px, py, 1) < 0.12 ? light(c1, 0.2) : c1)); }
}
function pine(pb, x, y, h, c1, c2, snow) {
  pb.rect(x, y - 3, 1, 3, '#4a3020');
  for (let k = 0; k < 4; k++) { const ty = y - 3 - k * h / 4.5, w = (h / 3) * (1 - k / 5); pb.poly([[x - w, ty], [x + 0.5, ty - h / 3], [x + w + 1, ty]], c1, (px, py) => px > x ? c2 : c1); if (snow) for (let px = Math.round(x - w * 0.5); px <= x + w * 0.5; px++) pb.set(px, Math.round(ty - h / 6) + 1, '#f4f8fb'); }
}
function cypress(pb, x, y, h, c1, c2) { pb.ellipse(x, y - h / 2, 2.5, h / 2, c1, (px) => px > x ? c2 : c1); pb.rect(x, y - 1, 1, 2, '#4a3020'); }
function palm(pb, x, y, h, lean) {
  let px = x, py = y;
  for (let i = 0; i < h; i++) { const t = i / h; px = x + lean * t * t * h * 0.35; py = y - i; pb.set(Math.round(px), py, i % 3 ? '#9a7040' : '#7a5228'); pb.set(Math.round(px) + 1, py, '#b08850'); }
  const cx = Math.round(px), cy = py;
  for (const [dx, dy] of [[-9, 3], [-7, 6], [8, 3], [7, 6], [-3, -4], [4, -4], [0, 7]]) { for (let k = 0; k <= 10; k++) { const t = k / 10; const xx = cx + dx * t, yy = cy + dy * t + Math.sin(t * Math.PI) * -2 + t * t * 3; pb.set(Math.round(xx), Math.round(yy), k % 2 ? '#3a9a3a' : '#5ab84a'); pb.set(Math.round(xx), Math.round(yy) + 1, '#2a7a2a'); } }
  pb.ellipse(cx, cy + 1, 1.5, 1.5, '#7a5228'); pb.set(cx + 2, cy + 2, '#8a6030');
}
function rocks(pb, x, base, w, h, c, seed) {
  const r = mulberry(seed || x);
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const rx = w * (0.2 + r() * 0.3), ry = h * (0.4 + r() * 0.6), cx = x + (i + 0.5) / n * w + (r() - 0.5) * 6, cy = base - ry * 0.5;
    pb.ellipse(cx, cy, rx, ry, c, (px, py) => { const t = (py - (cy - ry)) / (2 * ry); if (t < 0.18) return light(c, 0.3); if (px < cx - rx * 0.4) return dark(c, 0.12); if (t > 0.75) return dark(c, 0.25); return ihash(px, py, 5) < 0.08 ? dark(c, 0.15) : c; });
  }
}
function cliff(pb, x0, x1, top, base, c, seed, cap) {
  const W = Math.max(1, x1 - x0), H = base - top;
  for (let x = x0; x < x1; x++) {
    const u = (x - x0) / W, ed = Math.min(u, 1 - u);
    const sh = ed < 0.3 ? Math.pow(1 - ed / 0.3, 1.7) * H * 0.6 : 0;
    const e = Math.round(top + sh + 14 * (fbm(x * 0.04, seed) - 0.5) + 4 * (vnoise(x * 0.35, seed + 7) - 0.5));
    for (let y = e; y < base; y++) {
      const d = y - e; let col = ((y + Math.round(fbm(x * 0.08, seed + 2) * 6)) % 9 === 0) ? dark(c, 0.16) : c;
      if (d < 2) col = light(c, 0.3); else if (cap && d < 4 + Math.round(vnoise(x * 0.5, seed) * 3)) col = (ihash(x, y, seed) < 0.2) ? dark(cap, 0.15) : cap;
      if (ihash(x, y, seed) < 0.05) col = dark(c, 0.22);
      if (u < 0.5 && dith(x, y, (0.5 - u) * 0.9)) col = mix(col, dark(c, 0.3), 0.35);
      pb.set(x, y, col);
    }
  }
}
function house(pb, x, y, w, h, wall, roof) {
  pb.rect(x, y - h, w, h, wall); pb.rect(x, y - h, 1, h, dark(wall, 0.15));
  pb.poly([[x - 2, y - h], [x + w / 2, y - h - h * 0.6], [x + w + 2, y - h]], roof);
  for (let wx = x + 2; wx < x + w - 2; wx += 4) pb.rect(wx, y - h + 3, 2, 2, '#4a6a8a');
  pb.rect(x + w / 2 - 1, y - 3, 2, 3, dark(roof, 0.2));
}
function lighthouse(pb, x, y, h, c1, c2) {
  for (let i = 0; i < h; i++) { const w = Math.round(lerp(5, 3, i / h)); pb.rect(x - w, y - i, w * 2, 1, Math.floor(i / 5) % 2 ? c1 : c2); pb.set(x - w, y - i, dark(Math.floor(i / 5) % 2 ? c1 : c2, 0.2)); }
  pb.rect(x - 4, y - h - 2, 8, 2, '#3a3a42'); pb.rect(x - 3, y - h - 6, 6, 4, '#f6e27a'); pb.rect(x - 3, y - h - 8, 6, 2, '#3a3a42'); pb.set(x, y - h - 9, '#3a3a42');
}
function island(pb, cx, base, w, h, land, sand, trees) {
  pb.ellipse(cx, base, w / 2, h, land, (x, y) => y > base - 2 ? sand : (y < base - h * 0.7 ? light(land, 0.15) : land));
  if (trees) for (let i = 0; i < trees; i++) palm(pb, cx - w / 4 + i * (w / 2 / Math.max(1, trees - 1)), base - h * 0.6, 10 + (i % 2) * 4, i % 2 ? 1 : -1);
}
function seagrass(pb, x, y, h, c) { for (let k = 0; k < 3; k++) { let px = x + k * 2; for (let i = 0; i < h - k * 2; i++) { px += Math.sin(i * 0.4 + k) * 0.3; pb.set(Math.round(px), y - i, i % 4 ? c : light(c, 0.2)); } } }
function kelp(pb, x, y, h, c) { let px = x; for (let i = 0; i < h; i++) { px += Math.sin(i * 0.15 + x) * 0.5; pb.set(Math.round(px), y - i, c); pb.set(Math.round(px) + 1, y - i, dark(c, 0.2)); if (i % 6 === 3) { pb.set(Math.round(px) + 2, y - i, light(c, 0.15)); pb.set(Math.round(px) + 3, y - i + 1, light(c, 0.15)); } } }
function coral(pb, x, y, s, c) {
  const br = (px, py, a, len, d) => { if (d > 4 || len < 2) return; const ex = px + Math.cos(a) * len, ey = py + Math.sin(a) * len; pb.line(px, py, ex, ey, d % 2 ? c : light(c, 0.2)); pb.line(px + 1, py, ex + 1, ey, dark(c, 0.15)); br(ex, ey, a - 0.5, len * 0.7, d + 1); br(ex, ey, a + 0.5, len * 0.7, d + 1); };
  br(x, y, -Math.PI / 2, s, 0);
}
function seabed(pb, x0, x1, ybf, c1, c2, seed, amp) {
  const tops = new Int16Array(pb.w);
  for (let x = x0; x < x1; x++) { const top = Math.round(ybf(x) - (amp || 6) * fbm(x * 0.03, seed)); tops[x] = top; for (let y = top; y < pb.h; y++) pb.set(x, y, y < top + 1 ? light(c1, 0.25) : (dith(x, y, (y - top) / 20) ? c2 : c1)); if (x % 9 === 0) pb.set(x, top + 2, light(c1, 0.35)); }
  return tops;
}
/* ---------- bölge sahnesi üretimi ---------- */
function genRegion(rid, season) {
  const pal = REGION_PAL[rid]; const FW = 640 + Math.round((RW - 640) * 0.15), MW = 640 + Math.round((RW - 640) * 0.45);
  const far = new PB(FW, SURF), mid = new PB(MW, SURF), near = new PB(RW, SURF + 40), bed = new PB(RW, LH - SURF);
  const winter = season === 'winter', autumn = season === 'autumn';
  const leaf = autumn ? ['#c8843a', '#a8642a'] : (winter ? ['#7a8a7a', '#5a6a5e'] : [pal.land, pal.land2]);
  const midX = (sx, scr) => Math.round(scr + (sx - 180) * 0.45), farX = (sx, scr) => Math.round(scr + (sx - 180) * 0.15);
  const BH = LH - SURF; // seabed yüksekliği
  const DP = x => 62 * Math.pow(1 - x / RW, 1.25); const YB = x => BH - 6 - DP(x);
  const r = mulberry(hash32(rid, season));
  switch (rid) {
    case 'sakin_liman': {
      ridge(far, 0, FW, SURF, 34, 26, 0.012, 11, '#8aa8b8', '#a8c4d0');
      ridge(mid, 0, MW, SURF, 10, 18, 0.02, 12, leaf[1], leaf[0]);
      for (let i = 0; i < 26; i++) house(mid, 40 + i * 30 + Math.round(r() * 10), SURF - 14 - Math.round(r() * 10), 10 + Math.round(r() * 6), 8 + Math.round(r() * 5), ['#f2ead8', '#e8d8b8', '#d8e4ec'][i % 3], ['#c8643a', '#a84a3a', '#d8784a'][i % 3]);
      for (let i = 0; i < 18; i++) cypress(mid, 30 + i * 56 + r() * 20, SURF - 8, 16 + r() * 10, '#3a6a3a', '#2a5030');
      lighthouse(mid, midX(1240, 520), SURF - 6, 40, '#f4f0e4', '#c4473f');
      // A: kumlu kıyı
      for (let x = 0; x < 380; x++) { const y = Math.round(SURF - 14 + x * 0.04 + Math.sin(x * 0.05) * 2); for (let yy = y; yy < SURF + 6; yy++) near.set(x, yy, yy < y + 2 ? '#f6e8c0' : (ihash(x, yy, 4) < 0.1 ? '#d8c088' : '#e8d4a0')); }
      for (let i = 0; i < 4; i++) treeRound(near, 40 + i * 70, SURF - 16, 9, leaf[0], leaf[1]);
      near.rect(150, SURF - 34, 2, 22, '#8a6a4a'); near.poly([[140, SURF - 34], [151, SURF - 44], [163, SURF - 34]], '#c4473f'); // şemsiye
      // B: iskele
      for (let x = 600; x < 790; x++) { near.set(x, SURF - 12, '#7a5228'); near.set(x, SURF - 11, '#a8743e'); near.set(x, SURF - 10, '#8a5e30'); }
      for (let x = 604; x < 790; x += 18) near.rect(x, SURF - 9, 3, 49, '#5a3a1e');
      // C: dalgakıran
      for (let i = 0; i < 10; i++) rocks(near, 1150 + i * 26, SURF + 10, 34, 26 + (i % 3) * 6, '#9a948a', 300 + i);
      lighthouse(near, 1380, SURF - 14, 30, '#f4f0e4', '#c4473f');
      const T = seabed(bed, 0, RW, YB, '#d8c890', '#c4b078', 1, 10);
      for (let x = 20; x < RW; x += 34 + Math.round(r() * 30)) seagrass(bed, x, T[x], 10 + Math.round(r() * 10), '#4a8a5a');
      for (let i = 0; i < 12; i++) { const rx = Math.round(100 + i * 120 + r() * 40); rocks(bed, rx, T[Math.min(RW - 1, rx + 9)] + 4, 18, 10, '#8a8a7a', 50 + i); }
      for (let i = 0; i < 16; i++) { const sx = Math.round(r() * RW); bed.set(sx, T[sx] + 1, '#f2c8b0'); bed.set(sx + 1, T[sx] + 1, '#e8a890'); }
      break;
    }
    case 'yesil_koy': {
      ridge(far, 0, FW, SURF, 40, 30, 0.01, 21, '#6a9aa0', '#86b4b8');
      ridge(mid, 0, MW, SURF, 22, 40, 0.015, 22, leaf[1], leaf[0]);
      for (let i = 0; i < 40; i++) treeRound(mid, 10 + i * 26 + r() * 10, SURF - 20 - r() * 26, 5 + r() * 3, leaf[0], leaf[1]);
      // A: koy girişi – iki burun
      cliff(near, -40, 140, SURF - 76, SURF + 6, '#9a8a6a', 5, leaf[0]); for (let i = 0; i < 4; i++) treeRound(near, 20 + i * 22, SURF - 70 + (i === 0 ? 10 : 0), 7, leaf[0], leaf[1]);
      cliff(near, 400, 540, SURF - 56, SURF + 6, '#9a8a6a', 6, leaf[0]); for (let i = 0; i < 3; i++) treeRound(near, 446 + i * 22, SURF - 50, 6, leaf[0], leaf[1]);
      // B: kayalık kıyı (çamlar)
      for (let i = 0; i < 6; i++) rocks(near, 640 + i * 40, SURF + 14, 44, 34 + (i % 2) * 14, '#a89e86', 70 + i);
      for (let i = 0; i < 6; i++) pine(near, 650 + i * 38, SURF - 26 - (i % 2) * 10, 26, '#2f6a3a', '#24502e', winter);
      // C: derin koy – dik yeşil yamaç
      cliff(near, 1290, RW + 60, SURF - 126, SURF + 6, '#7a8a5a', 9, leaf[0]); for (let i = 0; i < 6; i++) treeRound(near, 1360 + i * 24, SURF - 118 + (i % 3) * 6, 8, leaf[0], leaf[1]);
      const T = seabed(bed, 0, RW, YB, '#c8c898', '#a8b080', 2, 12);
      for (let x = 10; x < RW; x += 10 + Math.round(r() * 12)) seagrass(bed, x, T[x], 14 + Math.round(r() * 14), r() < 0.5 ? '#3a8a4a' : '#2f7a42');
      for (let i = 0; i < 10; i++) { const rx = Math.round(80 + i * 140); rocks(bed, rx, T[rx + 13] + 6, 26, 16, '#8a8a7a', 90 + i); }
      break;
    }
    case 'kayalik_adalar': {
      for (let i = 0; i < 6; i++) island(far, 60 + i * 130, SURF, 90 + r() * 40, 18 + r() * 14, '#7a8a7a', '#c8c0a0', 0);
      for (let i = 0; i < 8; i++) { const cx = 40 + i * 130 + r() * 40, hh = 26 + r() * 24; mid.ellipse(cx, SURF, 40 + r() * 14, hh, '#9a8a7a', (x, y) => y < SURF - hh * 0.75 ? '#b8a890' : (x < cx - 20 ? '#86786a' : (ihash(x, y, 4) < 0.07 ? '#7a6e60' : '#9a8a7a'))); for (let k = 0; k < 3; k++) treeRound(mid, cx - 14 + k * 14, SURF - hh * 0.85 - r() * 6, 4, leaf[0], leaf[1]); }
      // A: sığ kayalıklar – sudan çıkan taşlar
      for (let i = 0; i < 9; i++) rocks(near, 40 + i * 50, SURF + 12, 30, 16 + (i % 3) * 8, '#9a8a7a', 100 + i);
      // B: resif kenarı – kemer kaya
      cliff(near, 630, 712, SURF - 66, SURF + 6, '#a89070', 41, leaf[0]); cliff(near, 770, 852, SURF - 60, SURF + 6, '#a89070', 42, leaf[0]); for (let x = 690; x < 790; x++) { const y = Math.round(SURF - 60 + Math.pow((x - 740) / 50, 2) * 14); for (let yy = y; yy < y + 10; yy++) near.set(x, yy, yy === y ? '#c8b090' : '#a89070'); }
      // C: derin ada suyu – büyük ada
      cliff(near, 1310, RW + 60, SURF - 96, SURF + 6, '#8a7a6a', 43, leaf[0]); for (let i = 0; i < 5; i++) treeRound(near, 1370 + i * 24, SURF - 90 + (i % 2) * 6, 6, leaf[0], leaf[1]);
      const T = seabed(bed, 0, RW, YB, '#a89a88', '#8a7e70', 3, 16);
      for (let i = 0; i < 26; i++) { const rx = Math.round(i * 60 + r() * 30); rocks(bed, rx, T[Math.min(RW - 1, rx + 15)] + 8, 30, 22, '#7a7068', 120 + i); }
      for (let i = 0; i < 40; i++) { const x = Math.round(r() * RW), y = T[x] - 2 - Math.round(r() * 6); bed.set(x, y, '#2a1e2e'); bed.set(x + 1, y - 1, '#2a1e2e'); bed.set(x - 1, y - 1, '#2a1e2e'); bed.set(x, y - 2, '#3a2e3e'); }
      for (let i = 0; i < 14; i++) coral(bed, 40 + i * 110, T[40 + i * 110], 6, '#e8a070');
      break;
    }
    case 'serin_akintilar': {
      ridge(far, 0, FW, SURF, 26, 22, 0.012, 31, '#7a8ea0', '#94a8b8');
      for (let i = 0; i < 5; i++) island(mid, 80 + i * 220, SURF, 120, 22 + r() * 10, '#5a7a6a', '#8a9a88', 0);
      // A: akıntı kenarı – feneri olan burun
      cliff(near, -30, 220, SURF - 80, SURF + 6, '#7a8088', 51, '#6a8a5a'); lighthouse(near, 96, SURF - 78, 42, '#f4f0e4', '#2e4a7a');
      // B: kanal – iki ada arası
      cliff(near, 550, 660, SURF - 48, SURF + 6, '#6a7078', 52, '#5a7a5a'); cliff(near, 850, 960, SURF - 54, SURF + 6, '#6a7078', 53, '#5a7a5a');
      for (let i = 0; i < 3; i++) pine(near, 584 + i * 20, SURF - 44, 18, '#2f5a42', '#244a36', winter); for (let i = 0; i < 3; i++) pine(near, 884 + i * 20, SURF - 50, 18, '#2f5a42', '#244a36', winter);
      // C: açık akıntı – uzak gemi
      far.rect(farX(1240, 470), SURF - 8, 40, 6, '#4a4a52'); far.rect(farX(1240, 476), SURF - 14, 14, 6, '#e8e8e8'); far.rect(farX(1240, 480), SURF - 20, 3, 6, '#c4473f');
      const T = seabed(bed, 0, RW, YB, '#b8b8a8', '#9a9a8c', 4, 8);
      for (let x = 0; x < RW; x += 3) { if (x % 12 < 6) bed.set(x, T[x] + 2, '#d8d8c8'); }
      for (let x = 20; x < RW; x += 28 + Math.round(r() * 20)) kelp(bed, x, T[x], 20 + Math.round(r() * 30), '#5a6a3a');
      break;
    }
    case 'sisli_kuzey': {
      ridge(far, 0, FW, SURF, 70, 60, 0.008, 61, '#6a7a8a', '#8a9aaa', 92);
      ridge(mid, 0, MW, SURF, 40, 50, 0.012, 62, '#3a4a4a', '#4e5e5e', winter ? 60 : 78);
      for (let i = 0; i < 50; i++) pine(mid, 10 + i * 20 + r() * 8, SURF - 4 - r() * 14, 14 + r() * 8, '#2a4238', '#1e342c', winter);
      // A: fiyort ağzı – iki yanda dik yamaç
      cliff(near, -40, 200, SURF - 146, SURF + 6, '#4a525a', 71, '#eef4f8'); cliff(near, 400, 560, SURF - 124, SURF + 6, '#4a525a', 72, '#eef4f8');
      // B: soğuk kıyı – kırmızı balıkçı kulübeleri
      for (let x = 600; x < 900; x++) for (let y = SURF - 10 + Math.round(Math.sin(x * 0.03) * 3); y < SURF + 6; y++) near.set(x, y, '#5a626a');
      for (let i = 0; i < 4; i++) { const hx = 620 + i * 64; near.rect(hx, SURF - 32, 34, 22, '#9a2e2e'); near.rect(hx, SURF - 32, 2, 22, '#7a2222'); near.poly([[hx - 3, SURF - 32], [hx + 17, SURF - 46], [hx + 37, SURF - 32]], winter ? '#f4f8fb' : '#3a3a42'); near.rect(hx + 6, SURF - 26, 5, 5, '#f6e2a0'); near.rect(hx + 22, SURF - 22, 6, 12, '#5a2020'); for (let px = hx; px < hx + 34; px += 6) near.rect(px, SURF - 10, 2, 14, '#4a3020'); }
      // C: kuzey derinliği – buz parçaları
      for (let i = 0; i < 5; i++) { const ix = 1150 + i * 70 + r() * 20; near.poly([[ix, SURF + 2], [ix + 6, SURF - 8 - r() * 8], [ix + 18, SURF - 12 - r() * 6], [ix + 26, SURF + 2]], '#e8f4fa', (x, y) => x > ix + 14 ? '#c8dcea' : '#f4fbff'); }
      const T = seabed(bed, 0, RW, YB, '#4a5258', '#3a4248', 5, 14);
      for (let x = 10; x < RW; x += 16 + Math.round(r() * 14)) kelp(bed, x, T[x], 30 + Math.round(r() * 50), '#4a5a2a');
      for (let i = 0; i < 18; i++) { const rx = Math.round(i * 84 + r() * 30); rocks(bed, rx, T[Math.min(RW - 1, rx + 14)] + 6, 28, 18, '#3a4048', 160 + i); }
      break;
    }
    case 'gunes_adalari': {
      far.rect(0, SURF - 2, FW, 2, '#a8e8f0');
      ridge(far, farX(1240, 380), farX(1240, 620), SURF, 20, 70, 0.02, 81, '#5a7a6a', '#7a9a8a');
      for (let i = 0; i < 4; i++) island(mid, 100 + i * 260, SURF, 140, 14, '#5ab84a', '#f6e8c0', 3);
      // A: lagün – kumsal ve palmiyeler
      for (let x = 0; x < 420; x++) { const y = Math.round(SURF - 10 + Math.sin(x * 0.02) * 4); for (let yy = y; yy < SURF + 4; yy++) near.set(x, yy, yy < y + 2 ? '#fff6dc' : '#f6e8c0'); }
      for (let i = 0; i < 7; i++) palm(near, 30 + i * 55, SURF - 10, 34 + (i % 3) * 8, i % 2 ? 1.2 : -1);
      // B: mercan resifi – küçük ada
      island(near, 750, SURF + 2, 120, 12, '#5ab84a', '#fff6dc', 2);
      // C: ada açıkları
      for (let i = 0; i < 3; i++) palm(near, 1380 + i * 36, SURF - 4, 26, 1);
      for (let x = 1340; x < RW; x++) for (let y = SURF - 6 + Math.round(Math.sin(x * 0.05) * 2); y < SURF + 4; y++) near.set(x, y, '#f6e8c0');
      const T = seabed(bed, 0, RW, x => BH - 6 - (x > 500 && x < 1000 ? 54 : DP(x)), '#f2e2b8', '#e2cfa0', 6, 10);
      const cc = ['#f26a8a', '#f2a030', '#8a5ad8', '#e8483a', '#f2d030', '#3ac8c8'];
      for (let i = 0; i < 70; i++) { const cx = Math.round(10 + i * 21 + r() * 10); coral(bed, cx, T[Math.min(RW - 1, cx)] + 1, 5 + r() * (cx > 500 && cx < 1000 ? 12 : 7), cc[i % cc.length]); }
      for (let i = 0; i < 20; i++) { const x = Math.round(r() * RW); bed.ellipse(x, T[x], 3, 2, '#f28a5a'); }
      break;
    }
    case 'derin_mavi': {
      far.rect(farX(260, 520), SURF - 6, 30, 6, '#6a8aa0'); far.ellipse(farX(260, 534), SURF - 4, 14, 5, '#7a9ab0');
      // A: kıta sahanlığı – şamandıra, uzak kayalık
      rocks(near, 120, SURF + 8, 60, 20, '#6a7480', 401);
      near.rect(380, SURF - 26, 3, 26, '#c4473f'); near.rect(376, SURF - 8, 11, 8, '#c4473f'); near.rect(378, SURF - 30, 7, 4, '#f2d030');
      // B: mavi su hattı – renk değişimi (gün ışığı bantları near katmanında)
      // C: derin okyanus
      const T = seabed(bed, 0, 520, x => BH - 50, '#7a8a9a', '#5a6a7a', 7, 10);
      for (let x = 520; x < 820; x++) { const top = Math.round(BH - 50 + (x - 520) * 0.2); for (let y = top; y < BH; y++) bed.set(x, y, y < top + 1 ? '#8a9aaa' : (dith(x, y, (y - top) / 30) ? '#3a4a5a' : '#4a5a6a')); }
      for (let x = 20; x < 520; x += 22) kelp(bed, x, T[x], 14 + Math.round(r() * 10), '#3a5a4a');
      for (let i = 0; i < 8; i++) coral(bed, 40 + i * 60, T[40 + i * 60], 5, '#c8a0b8');
      break;
    }
  }
  /* dalga çizgisine bitişik köpük (near katmanında karaya değen yerler) */
  for (let x = 0; x < RW; x++) { if (near.has(x, SURF) && !near.has(x, SURF - 3)) { /* yok */ } }
  near.outline(null, 0.4); mid.outline(null, 0.25);
  const out = { far: far.canvas(), mid: mid.canvas(), near: near.canvas(), bed: bed.canvas(), FW, MW };
  return out;
}
const regionArt = (rid, season) => { const k = 'region:' + rid + ':' + season; let v = Atlas.cache.get(k); if (!v) { v = genRegion(rid, season); Atlas.cache.set(k, v); } return v; };

/* ---------- KASABA ---------- */
const TOWN_W = 1800, TOWN_GROUND = 296, TOWN_WATER_X = 1330;
const TOWN_DOORS = [
  { id: 'home', x: 128, name: 'Ev', icon: 'home' },
  { id: 'shop', x: 338, name: 'Zeynep\'in Olta Dükkânı', icon: 'shop', npc: 'zeynep' },
  { id: 'market', x: 580, name: 'Nihat\'ın Balık Hali', icon: 'market', npc: 'nihat' },
  { id: 'yard', x: 862, name: 'Bora\'nın Tekne Atölyesi', icon: 'yard', npc: 'bora' },
  { id: 'board', x: 1222, name: 'Sipariş Panosu · Bahar Lokantası', icon: 'order', npc: 'bahar' },
  { id: 'harbor', x: 1450, name: 'Liman (Teknen)', icon: 'anchor' },
  { id: 'efe', x: 1590, name: 'Efe', icon: 'help', npc: 'efe' },
  { id: 'pier', x: 1716, name: 'İskele Ucu – Balık Tut', icon: 'cast' }
];
function bHouse(pb, x0, g, season) {
  const W = 140; const wall = '#f2ead8', roof = '#c8643a', roofD = '#a04a2a';
  for (let y = g - 14; y < g; y++) for (let x = x0; x < x0 + W; x++) pb.set(x, y, ((Math.floor((x - x0 + (Math.floor((y - g) / 5) % 2) * 6) / 12)) % 2) ? '#a8a090' : '#988f80');
  for (let y = g - 14; y < g; y += 5) pb.hline(x0, x0 + W - 1, y, '#7a7268');
  pb.rect(x0 + 6, g - 74, W - 12, 60, wall); pb.rect(x0 + 6, g - 74, 3, 60, dark(wall, 0.12));
  for (let y = g - 74; y < g - 14; y += 3) if (y % 6 === 0) pb.hline(x0 + 9, x0 + W - 7, y, mix(wall, '#e0d4b8', 0.4));
  // çatı
  for (let y = 0; y < 44; y++) { const half = 76 * (y / 44); for (let x = Math.round(x0 + 70 - half); x <= Math.round(x0 + 70 + half); x++) { let c = ((y % 5) === 4) ? roofD : roof; if (((x + (Math.floor(y / 5) % 2) * 3) % 6) === 0 && y % 5 !== 4) c = mix(roof, roofD, 0.5); if (x < x0 + 70 - half + 2) c = roofD; pb.set(x, g - 118 + y, c); } }
  if (season === 'winter') for (let y = 0; y < 44; y++) { const half = 76 * (y / 44); for (let x = Math.round(x0 + 70 - half); x <= Math.round(x0 + 70 + half); x++) if (y < 6 || (y % 5 < 2 && ihash(x, y, 3) < 0.5)) pb.set(x, g - 118 + y, y < 6 ? '#f4f8fb' : '#e4eef4'); }
  pb.rect(x0 + 100, g - 126, 12, 26, '#8a4a2a'); pb.rect(x0 + 98, g - 128, 16, 3, '#6a3a22');
  // kapı
  pb.rect(x0 + 58, g - 50, 24, 36, '#7a4a28'); pb.ellipse(x0 + 70, g - 50, 12, 6, '#7a4a28'); for (let x = x0 + 62; x < x0 + 80; x += 5) pb.vline(x, g - 52, g - 15, '#5a3418'); pb.set(x0 + 77, g - 32, '#e8c050'); pb.rect(x0 + 54, g - 15, 32, 2, '#8a8070');
  // pencereler
  for (const wx of [x0 + 16, x0 + 96]) {
    pb.rect(wx, g - 62, 28, 24, '#d8d0bc'); pb.rect(wx + 2, g - 60, 24, 20, '#7ab0d8'); pb.rect(wx + 13, g - 60, 2, 20, '#d8d0bc'); pb.rect(wx + 2, g - 51, 24, 2, '#d8d0bc'); pb.set(wx + 4, g - 58, '#e8f8ff'); pb.set(wx + 5, g - 58, '#e8f8ff'); pb.set(wx + 4, g - 57, '#e8f8ff');
    pb.rect(wx - 6, g - 62, 6, 24, '#3a6a9a'); pb.rect(wx + 28, g - 62, 6, 24, '#3a6a9a'); for (let y = g - 60; y < g - 38; y += 3) { pb.hline(wx - 5, wx - 1, y, '#2a4e74'); pb.hline(wx + 29, wx + 33, y, '#2a4e74'); }
    pb.rect(wx - 2, g - 38, 32, 5, '#8a5a2a');
    const fl = season === 'winter' ? ['#e8eef2', '#d8e0e8'] : season === 'autumn' ? ['#e8a03a', '#c8643a'] : ['#f26a8a', '#f2d030'];
    for (let x = wx; x < wx + 28; x += 3) { pb.set(x, g - 40, season === 'winter' ? '#c8d0d8' : '#4a8a3a'); pb.set(x + 1, g - 41, fl[(x / 3 | 0) % 2]); }
  }
  pb.rect(x0 + 120, g - 30, 8, 6, '#c4473f'); pb.rect(x0 + 123, g - 24, 2, 10, '#5a3a1e');
}
function bShop(pb, x0, g) {
  const W = 156; const wall = '#5f8fb8', wallD = '#4a7298';
  pb.rect(x0, g - 112, W, 112, wall); for (let y = g - 112; y < g; y += 4) pb.hline(x0, x0 + W - 1, y, wallD); pb.rect(x0, g - 112, 3, 112, dark(wall, 0.2));
  pb.rect(x0 - 4, g - 120, W + 8, 8, '#f2ead8'); pb.rect(x0 - 4, g - 112, W + 8, 2, '#c8c0a8');
  // tente
  for (let x = x0 - 6; x < x0 + W + 6; x++) { const st = Math.floor((x - x0 + 6) / 10) % 2; for (let y = g - 84; y < g - 72; y++) pb.set(x, y, st ? '#f4f0e4' : '#2f9a8a'); const sc = Math.round(2 * Math.abs(Math.sin((x - x0) * Math.PI / 10))); for (let y = g - 72; y < g - 70 + sc; y++) pb.set(x, y, st ? '#e4e0d4' : '#24786c'); }
  // vitrin
  pb.rect(x0 + 12, g - 64, 70, 46, '#e8dcc0'); pb.rect(x0 + 15, g - 61, 64, 40, '#9ac8e0'); pb.rect(x0 + 15, g - 30, 64, 9, '#8a5a2a');
  for (let i = 0; i < 5; i++) { pb.line(x0 + 22 + i * 12, g - 30, x0 + 30 + i * 12, g - 58, ROD_COL[i][0]); pb.set(x0 + 30 + i * 12, g - 58, '#e8e8f0'); }
  pb.ellipse(x0 + 70, g - 40, 3, 3, '#c4473f'); pb.rect(x0 + 18, g - 58, 3, 3, '#e8f8ff');
  // kapı
  pb.rect(x0 + 100, g - 60, 30, 60, '#3a5a7a'); pb.rect(x0 + 103, g - 57, 24, 26, '#9ac8e0'); pb.rect(x0 + 103, g - 28, 24, 26, '#2e4a66'); pb.set(x0 + 124, g - 30, '#e8c050');
  // tabela
  pb.rect(x0 + 96, g - 104, 52, 16, '#7a4a28'); pb.rect(x0 + 98, g - 102, 48, 12, '#f2e2b8'); drawText(pb, 'OLTA', x0 + 106, g - 99, '#3a2414'); pb.line(x0 + 136, g - 101, x0 + 136, g - 94, '#5a6470'); pb.line(x0 + 136, g - 94, x0 + 133, g - 92, '#5a6470');
  // fıçılar
  for (const bx of [x0 + 4, x0 + 136]) { pb.rect(bx, g - 18, 16, 18, '#9a6a36'); pb.hline(bx, bx + 15, g - 14, '#5a3a1a'); pb.hline(bx, bx + 15, g - 5, '#5a3a1a'); for (let i = 0; i < 3; i++) pb.line(bx + 4 + i * 4, g - 18, bx + 6 + i * 4, g - 40, ROD_COL[(i + 1) % 5][0]); }
}
function bMarket(pb, x0, g) {
  const W = 216;
  pb.rect(x0 + 6, g - 96, W - 12, 96, '#c8b89a'); for (let y = g - 96; y < g; y += 6) for (let x = x0 + 6 + ((y / 6) % 2) * 6; x < x0 + W - 6; x += 12) pb.rect(x, y, 11, 5, ihash(x, y, 2) < 0.5 ? '#b8a88a' : '#d0c0a2');
  // çatı (tente çizgili)
  for (let y = 0; y < 26; y++) for (let x = x0 - 8; x < x0 + W + 8; x++) { const st = Math.floor((x - x0) / 12) % 2; pb.set(x, g - 122 + y, y > 22 ? '#8a2e2a' : (st ? '#c4473f' : '#f4f0e4')); }
  for (let x = x0 - 8; x < x0 + W + 8; x++) { const sc = Math.round(3 * Math.abs(Math.sin((x - x0) * Math.PI / 12))); for (let y = g - 96; y < g - 94 + sc; y++) pb.set(x, y, Math.floor((x - x0) / 12) % 2 ? '#a8382f' : '#d8d4c8'); }
  for (const px of [x0 - 4, x0 + 68, x0 + 140, x0 + W]) pb.rect(px, g - 94, 5, 94, '#7a5228');
  // tezgâhlar
  for (let k = 0; k < 2; k++) {
    const cx = x0 + 14 + k * 104; pb.rect(cx, g - 34, 88, 34, '#8a5e36'); pb.rect(cx, g - 34, 88, 3, '#a8743e'); pb.rect(cx + 2, g - 42, 84, 8, '#dff2f8'); for (let x = cx + 2; x < cx + 86; x += 3) pb.set(x, g - 41 + (x % 2), '#ffffff');
    const fs = k ? ['#c45b56', '#56666a', '#e6c64a', '#2c6c90'] : ['#2d5d88', '#a6b0b5', '#d6707a', '#7a8894'];
    for (let i = 0; i < 9; i++) { const fx = cx + 6 + i * 9, fy = g - 44; pb.ellipse(fx, fy, 4, 1.8, fs[i % 4]); pb.set(fx - 4, fy, fs[i % 4]); pb.set(fx + 5, fy - 1, dark(fs[i % 4], .2)); pb.set(fx + 5, fy + 1, dark(fs[i % 4], .2)); pb.set(fx - 2, fy, '#1a1426'); }
  }
  // kantar
  pb.rect(x0 + 186, g - 70, 2, 26, '#5a6470'); pb.ellipse(x0 + 187, g - 74, 5, 5, '#e8e8e0'); pb.set(x0 + 187, g - 76, '#c4473f'); pb.rect(x0 + 180, g - 44, 14, 2, '#8a94a0');
  // tabela
  pb.rect(x0 + 56, g - 140, 104, 18, '#7a4a28'); pb.rect(x0 + 58, g - 138, 100, 14, '#f2e2b8'); drawText(pb, 'BALIK HALİ', x0 + 70, g - 135, '#3a2414', 1);
  for (const cx of [x0 + 196, x0 + 206]) { pb.rect(cx - 6, g - 14, 12, 14, '#4f86c6'); pb.rect(cx - 6, g - 14, 12, 2, '#3a6a9a'); }
}
function bYard(pb, x0, g) {
  const W = 232; const wall = '#9a4a3a', wallD = '#7a3a2e';
  pb.poly([[x0, g - 100], [x0 + 116, g - 142], [x0 + W, g - 100]], '#5a5a62', (x, y) => (y % 4 === 0) ? '#4a4a52' : '#6a6a72');
  pb.rect(x0 + 4, g - 100, W - 8, 100, wall); for (let x = x0 + 4; x < x0 + W - 4; x += 6) pb.vline(x, g - 100, g - 1, wallD);
  // açık büyük kapı + içerdeki tekne
  pb.rect(x0 + 40, g - 84, 140, 84, '#2a2026'); pb.rect(x0 + 40, g - 84, 140, 4, '#5a3a2e');
  pb.poly([[x0 + 60, g - 40], [x0 + 160, g - 44], [x0 + 172, g - 54], [x0 + 162, g - 28], [x0 + 70, g - 26]], '#3f9a86', (x, y) => y > g - 32 ? '#2c7466' : '#3f9a86');
  pb.hline(x0 + 60, x0 + 166, g - 42, '#a8743e'); pb.rect(x0 + 80, g - 26, 6, 26, '#7a5228'); pb.rect(x0 + 140, g - 26, 6, 26, '#7a5228');
  pb.rect(x0 + 34, g - 84, 6, 84, '#6a2e24'); pb.rect(x0 + 180, g - 84, 6, 84, '#6a2e24');
  // vinç kirişi
  pb.rect(x0 + W - 10, g - 130, 6, 130, '#5a6470'); pb.rect(x0 + W - 10, g - 130, 40, 5, '#5a6470'); for (let y = g - 125; y < g - 70; y += 3) pb.set(x0 + W + 24, y, '#3a3a42'); pb.line(x0 + W + 22, g - 70, x0 + W + 26, g - 66, '#8a94a0'); pb.line(x0 + W + 26, g - 66, x0 + W + 22, g - 62, '#8a94a0');
  // tabela
  pb.rect(x0 + 52, g - 120, 116, 16, '#3a2414'); pb.rect(x0 + 54, g - 118, 112, 12, '#f2e2b8'); drawText(pb, 'TEKNE ATÖLYESİ', x0 + 60, g - 115, '#3a2414');
  // kereste
  for (let i = 0; i < 4; i++) pb.rect(x0 + 2, g - 8 - i * 4, 32, 3, i % 2 ? '#c8925a' : '#a8743e');
  pb.rect(x0 + 196, g - 12, 8, 12, '#c4473f'); pb.rect(x0 + 206, g - 10, 8, 10, '#4f86c6');
}
function bLokanta(pb, x0, g) {
  const W = 150; const wall = '#f0e2c8';
  pb.rect(x0, g - 96, W, 96, wall); pb.rect(x0, g - 96, 3, 96, dark(wall, 0.12));
  for (let y = 0; y < 22; y++) { const half = 82 * (y / 22); for (let x = Math.round(x0 + 75 - half); x <= Math.round(x0 + 75 + half); x++) pb.set(x, g - 118 + y, y % 4 === 3 ? '#8a3a2a' : '#b84a3a'); }
  pb.rect(x0 + 14, g - 60, 26, 60, '#3a7a4a'); pb.rect(x0 + 17, g - 56, 20, 22, '#a8d8c8'); pb.set(x0 + 35, g - 30, '#e8c050');
  for (const wx of [x0 + 54, x0 + 98]) { pb.rect(wx, g - 66, 34, 26, '#8a5a2a'); pb.rect(wx + 2, g - 64, 30, 22, '#f6d890'); pb.rect(wx + 16, g - 64, 2, 22, '#8a5a2a'); }
  pb.rect(x0 + 30, g - 92, 90, 16, '#3a7a4a'); pb.rect(x0 + 32, g - 90, 86, 12, '#f2e2b8'); drawText(pb, 'LOKANTA', x0 + 62, g - 87, '#3a2414');
  // teras masaları
  for (const tx of [x0 + 60, x0 + 112]) { pb.rect(tx, g - 22, 22, 3, '#f4f0e4'); pb.rect(tx + 10, g - 19, 2, 19, '#7a5228'); pb.rect(tx + 10, g - 48, 2, 26, '#7a5228'); pb.poly([[tx - 8, g - 46], [tx + 11, g - 58], [tx + 30, g - 46]], '#c84a3a', (x) => (Math.floor((x - tx) / 6) % 2) ? '#f4f0e4' : '#c84a3a'); }
}
function bBoard(pb, x0, g) {
  pb.rect(x0 + 4, g - 84, 4, 84, '#6a4420'); pb.rect(x0 + 60, g - 84, 4, 84, '#6a4420');
  pb.rect(x0, g - 90, 68, 6, '#8a3a2a'); pb.rect(x0 + 2, g - 92, 64, 2, '#a84a3a');
  pb.rect(x0 + 8, g - 82, 52, 46, '#a8743e'); pb.rect(x0 + 10, g - 80, 48, 42, '#c8925a'); for (let y = g - 80; y < g - 38; y += 5) pb.hline(x0 + 10, x0 + 57, y, '#b8824a');
  pb.rect(x0 + 18, g - 34, 32, 8, '#7a4a28'); drawText(pb, 'İLAN', x0 + 26, g - 33, '#f2e2b8');
}
function bPier(pb, g) {
  // iskele zemini
  for (let x = TOWN_WATER_X - 40; x < TOWN_W - 30; x++) { pb.set(x, g - 4, '#5a3a1e'); for (let y = g - 3; y < g + 4; y++) pb.set(x, y, ((x - TOWN_WATER_X) % 14 === 0) ? '#6a4628' : (y === g - 3 ? '#c8925a' : '#a8743e')); pb.set(x, g + 4, '#5a3a1e'); }
  for (let x = TOWN_WATER_X - 20; x < TOWN_W - 30; x += 30) { pb.rect(x, g + 4, 5, 64, '#5a3a1e'); pb.rect(x + 1, g + 4, 1, 64, '#7a5228'); }
  for (let x = TOWN_WATER_X + 30; x < TOWN_W - 40; x += 120) { pb.rect(x, g - 10, 6, 6, '#3a3a42'); pb.rect(x - 1, g - 12, 8, 2, '#5a5a62'); }
  for (let x = TOWN_WATER_X + 90; x < TOWN_W - 40; x += 160) { pb.rect(x, g - 56, 2, 52, '#3a3a42'); pb.rect(x - 3, g - 62, 8, 6, '#f6e27a'); pb.rect(x - 4, g - 64, 10, 2, '#3a3a42'); }
  // kıyı taş duvar
  for (let y = g - 2; y < LH; y++) for (let x = TOWN_WATER_X - 60; x < TOWN_WATER_X; x++) pb.set(x, y, ((x + Math.floor(y / 6) * 5) % 10 < 1 || y % 6 === 0) ? '#7a7268' : '#a8a090');
}
function genTown(season) {
  const winter = season === 'winter', autumn = season === 'autumn', summer = season === 'summer';
  const FW = 640 + Math.round((TOWN_W - 640) * 0.15), MW = 640 + Math.round((TOWN_W - 640) * 0.45);
  const far = new PB(FW, 260), mid = new PB(MW, 280), main = new PB(TOWN_W, LH);
  const leaf = autumn ? ['#d8843a', '#b0602a'] : winter ? ['#8a9a8a', '#6a7a6e'] : summer ? ['#7ab84a', '#5a983a'] : ['#6ab05a', '#4a8a48'];
  ridge(far, 0, FW, 250, 70, 50, 0.007, 3, '#8aa4b8', '#a8bfd0', winter ? 85 : 110);
  ridge(mid, 0, MW, 280, 46, 30, 0.012, 4, leaf[1], leaf[0]);
  const r = mulberry(99);
  for (let i = 0; i < 34; i++) house(mid, 20 + i * 32 + r() * 8, 250 - r() * 24, 12 + r() * 8, 9 + r() * 6, ['#f2ead8', '#e8d8b8', '#d8e4ec', '#f0d8c8'][i % 4], winter ? '#f4f8fb' : ['#c8643a', '#a84a3a', '#d8784a'][i % 3]);
  for (let i = 0; i < 30; i++) (i % 3 ? treeRound(mid, 10 + i * 36 + r() * 10, 262 - r() * 14, 7, leaf[0], leaf[1]) : cypress(mid, 10 + i * 36, 262, 22, winter ? '#4a6a5a' : '#3a6a3a', '#2a5030'));
  lighthouse(mid, MW - 60, 250, 46, '#f4f0e4', '#c4473f');
  // ana katman: yol & zemin
  const g = TOWN_GROUND;
  for (let y = g; y < LH; y++) for (let x = 0; x < TOWN_WATER_X - 60; x++) {
    let c;
    if (y < g + 22) { const bx = Math.floor((x + (Math.floor((y - g) / 5) % 2) * 4) / 8), by = Math.floor((y - g) / 5); c = ((x + (by % 2) * 4) % 8 === 0 || (y - g) % 5 === 0) ? '#8a8070' : (ihash(bx, by, 6) < 0.5 ? '#b8ae9a' : '#a89e8a'); }
    else c = winter ? (ihash(x, y, 3) < 0.1 ? '#dfe8f0' : '#f0f4f8') : (ihash(x, y, 3) < 0.12 ? leaf[1] : leaf[0]);
    main.set(x, y, c);
  }
  if (!winter) for (let x = 6; x < TOWN_WATER_X - 70; x += 7 + Math.round(r() * 9)) { const y = g + 26 + Math.round(r() * 30); main.set(x, y, season === 'spring' ? ['#f2a0c0', '#f2f2f2', '#f2d030'][x % 3] : summer ? '#f2d030' : '#c8643a'); main.set(x, y + 1, '#3a6a2a'); }
  bHouse(main, 58, g, season); bShop(main, 262, g); bMarket(main, 474, g); bYard(main, 748, g); bLokanta(main, 1010, g); bBoard(main, 1188, g); bPier(main, g);
  // sokak lambaları & çit
  for (const lx of [230, 450, 720, 990, 1170]) { main.rect(lx, g - 64, 2, 64, '#3a3a42'); main.rect(lx - 3, g - 70, 8, 6, '#f6e27a'); main.rect(lx - 4, g - 72, 10, 2, '#3a3a42'); }
  for (let x = 2; x < 50; x += 6) { main.rect(x, g - 14, 2, 14, '#f4f0e4'); } main.rect(0, g - 10, 52, 2, '#f4f0e4');
  if (winter) for (const [bx, bw] of [[262, 156], [474, 216], [748, 232], [1010, 150]]) for (let x = bx - 4; x < bx + bw + 4; x++) { const top = (() => { for (let y = 120; y < g; y++) if (main.has(x, y)) return y; return null; })(); if (top != null) { main.set(x, top - 1, '#f4f8fb'); main.set(x, top, '#f4f8fb'); } }
  far.outline(null, 0.15); mid.outline(null, 0.25);
  return { far: far.canvas(), mid: mid.canvas(), main: main.canvas(), FW, MW };
}
const townArt = season => { const k = 'town:' + season; let v = Atlas.cache.get(k); if (!v) { v = genTown(season); Atlas.cache.set(k, v); } return v; };

/* ---------- İSKELE AVI (3 sahne) ---------- */
const PIER_SPOTS = ['liman_kiyi', 'liman_iskele', 'liman_dalgakiran'];
const PIER_SURF = 236;
function genPier(spotIdx, season) {
  const pb = new PB(LW, LH); const leaf = season === 'autumn' ? ['#d8843a', '#b0602a'] : season === 'winter' ? ['#8a9a8a', '#6a7a6e'] : ['#6ab05a', '#4a8a48'];
  const S0 = PIER_SURF;
  if (spotIdx === 0) {
    for (let x = 0; x < 470; x++) { const y = x < 300 ? Math.round(S0 - 30 + Math.pow(x / 300, 1.6) * 36) : Math.round(S0 + 6 + (x - 300) * 0.85); for (let yy = y; yy < LH; yy++) pb.set(x, yy, yy < y + 2 ? (yy < S0 ? '#fff4d0' : '#e8d8a8') : (ihash(x, yy, 2) < 0.1 ? '#d8c088' : (yy > S0 + 8 ? (dith(x, yy, (yy - S0) / 90) ? '#b8a070' : '#c8b080') : '#ead6a4'))); }
    for (let i = 0; i < 3; i++) treeRound(pb, 20 + i * 50, S0 - 34, 12, leaf[0], leaf[1]);
    pb.rect(60, S0 - 66, 2, 34, '#8a6a4a'); pb.poly([[40, S0 - 64], [61, S0 - 80], [84, S0 - 64]], '#c4473f', (x) => Math.floor(x / 7) % 2 ? '#f4f0e4' : '#c4473f');
    for (let i = 0; i < 6; i++) { const x = 30 + i * 40, y = S0 - 14 + i * 2; pb.set(x, y, '#f2c8b0'); pb.set(x + 1, y, '#e8b090'); }
  } else if (spotIdx === 1) {
    for (let x = 0; x < 190; x++) { pb.set(x, S0 - 33, '#5a3a1e'); for (let y = S0 - 32; y < S0 - 24; y++) pb.set(x, y, (x % 14 === 0) ? '#6a4628' : (y === S0 - 32 ? '#c8925a' : '#a8743e')); pb.set(x, S0 - 24, '#5a3a1e'); }
    for (let x = 4; x < 190; x += 30) { pb.rect(x, S0 - 24, 6, LH - S0 + 24, '#5a3a1e'); pb.rect(x + 1, S0 - 24, 2, LH - S0 + 24, '#7a5228'); }
    pb.rect(170, S0 - 42, 8, 9, '#3a3a42'); pb.rect(169, S0 - 44, 10, 2, '#5a5a62'); pb.rect(60, S0 - 92, 2, 60, '#3a3a42'); pb.rect(57, S0 - 98, 8, 6, '#f6e27a'); pb.rect(56, S0 - 100, 10, 2, '#3a3a42');
    for (let y = S0 - 41; y < S0 - 33; y++) pb.set(176 + (y % 2), y + 6, '#c8b090');
  } else {
    for (let i = 0; i < 7; i++) rocks(pb, -20 + i * 34, S0 + 18, 46, 40 + (i % 3) * 12, '#9a948a', 500 + i);
    for (let x = 0; x < 210; x++) for (let y = S0 - 30; y < S0 - 22; y++) pb.set(x, y, (x % 12 === 0 || y === S0 - 30) ? '#8a8478' : '#b0a898');
    lighthouse(pb, 80, S0 - 30, 64, '#f4f0e4', '#c4473f');
  }
  pb.outline(null, 0.4);
  return pb;
}
const pierArt = (i, season) => Atlas.get('pier:' + i + season, () => genPier(i, season));
const PIER_STAND = [[262, PIER_SURF - 2], [182, PIER_SURF - 32], [200, PIER_SURF - 30]];

/* ---------- EV İÇİ ---------- */
const HOME_SPOTS = {
  bed: { x: 520, w: 110, name: 'Yatak – Uyu', icon: 'sleep' }, wardrobe: { x: 60, w: 60, name: 'Gardırop', icon: 'wardrobe' }, chest: { x: 150, w: 50, name: 'Balık Sandığı', icon: 'chest' },
  door: { x: 240, w: 40, name: 'Kasabaya Çık', icon: 'exit' }, trophy: { x: 330, w: 50, name: 'Başarımlar', icon: 'trophy' }, desk: { x: 420, w: 60, name: 'İstatistikler & Ansiklopedi', icon: 'book' }
};
const DECOR_POS = { wall: [300, 120], shelf: [350, 170], table: [440, 238], window: [460, 150], board: [170, 120] };
function genHome(season) {
  const pb = new PB(LW, LH);
  for (let y = 40; y < 280; y++) for (let x = 0; x < LW; x++) pb.set(x, y, (x % 32 < 1) ? '#c8a878' : ((y + Math.floor(x / 32) * 7) % 40 === 0 ? '#d8b888' : '#e8d0a0'));
  for (let x = 0; x < LW; x++) { pb.set(x, 40, '#8a6a42'); for (let y = 30; y < 40; y++) pb.set(x, y, '#7a5228'); for (let y = 0; y < 30; y++) pb.set(x, y, y % 10 === 9 ? '#5a3a1e' : '#6a4628'); }
  for (let y = 280; y < LH; y++) for (let x = 0; x < LW; x++) pb.set(x, y, (y - 280) % 10 === 0 ? '#6a4628' : (((x + Math.floor((y - 280) / 10) * 37) % 60) === 0 ? '#7a5228' : '#a8743e'));
  pb.rect(0, 272, LW, 8, '#8a5a2a'); pb.rect(0, 272, LW, 2, '#c8925a');
  // pencere
  pb.rect(440, 90, 80, 64, '#8a5a2a'); pb.rect(444, 94, 72, 56, season === 'winter' ? '#c8dcea' : '#9ad0f0'); pb.rect(478, 94, 4, 56, '#8a5a2a'); pb.rect(444, 120, 72, 3, '#8a5a2a');
  pb.ellipse(500, 108, 8, 5, '#ffffff'); pb.ellipse(460, 136, 12, 4, season === 'winter' ? '#f4f8fb' : '#6ab05a'); pb.rect(436, 154, 88, 6, '#7a4a28');
  for (let y = 88; y < 156; y++) { pb.set(430 + (y % 3 === 0 ? 1 : 0), y, '#c84a4a'); pb.rect(432, y, 6, 1, '#d85a5a'); pb.rect(522, y, 6, 1, '#d85a5a'); }
  // kapı
  pb.rect(222, 176, 40, 96, '#7a4a28'); pb.rect(226, 180, 32, 40, '#8a5a32'); pb.rect(226, 226, 32, 42, '#8a5a32'); pb.set(254, 226, '#e8c050'); pb.set(254, 227, '#e8c050');
  // gardırop
  pb.rect(30, 140, 64, 132, '#8a5a2a'); pb.rect(34, 146, 27, 120, '#a8743e'); pb.rect(63, 146, 27, 120, '#a8743e'); pb.set(58, 206, '#e8c050'); pb.set(66, 206, '#e8c050'); pb.rect(26, 134, 72, 6, '#6a4420');
  // sandık
  pb.rect(124, 236, 56, 36, '#9a6a36'); pb.rect(124, 228, 56, 10, '#b07a40'); pb.rect(124, 238, 56, 2, '#5a3a1a'); pb.rect(148, 238, 8, 10, '#e8c050'); pb.rect(124, 228, 3, 44, '#6a4420'); pb.rect(177, 228, 3, 44, '#6a4420');
  // kupa rafı
  pb.rect(300, 200, 70, 6, '#7a4a28'); pb.rect(300, 236, 70, 6, '#7a4a28'); pb.rect(302, 206, 4, 66, '#6a4420'); pb.rect(364, 206, 4, 66, '#6a4420');
  // masa
  pb.rect(396, 240, 92, 8, '#8a5a2a'); pb.rect(400, 248, 6, 24, '#6a4420'); pb.rect(478, 248, 6, 24, '#6a4420'); pb.rect(410, 230, 20, 10, '#3a6a9a'); pb.rect(412, 228, 16, 2, '#f2e8c8');
  // raf (dekor)
  pb.rect(320, 186, 80, 4, '#7a4a28');
  // yatak
  pb.rect(510, 226, 124, 30, '#c4473f'); pb.rect(510, 226, 124, 4, '#e86a5a'); pb.rect(510, 256, 124, 16, '#8a5a2a'); pb.rect(600, 200, 34, 72, '#8a5a2a'); pb.rect(512, 214, 30, 14, '#f4f0e4'); pb.rect(508, 240, 4, 32, '#6a4420');
  for (let x = 546; x < 600; x += 8) pb.rect(x, 230, 4, 4, '#f2d468');
  // halı
  pb.ellipse(320, 300, 110, 18, '#3a6a9a', (x, y) => ((x + y) % 8 < 2) ? '#4f86c6' : '#3a6a9a'); pb.ellipse(320, 300, 90, 12, '#c8a050', (x, y) => ((x - y) % 6 < 2) ? '#e8c050' : '#3a6a9a');
  // pano çerçevesi (koleksiyon panosu yeri)
  pb.rect(150, 90, 50, 44, '#8a5a2a'); pb.rect(153, 93, 44, 38, '#c8a878');
  pb.outline(null, 0.3);
  return pb;
}
const homeArt = season => Atlas.get('home:' + season, () => genHome(season));

/* ---------- DENİZ HARİTASI ---------- */
function genMap() {
  const pb = new PB(LW, LH);
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) { const n = vnoise2(x / 40, y / 40, 3); pb.set(x, y, n > 0.7 ? '#9ac8d8' : (n > 0.4 ? '#8abccc' : '#7ab0c4')); }
  for (let y = 4; y < LH; y += 9) for (let x = (y * 7) % 23; x < LW; x += 23) { pb.set(x, y, '#c8e4ec'); pb.set(x + 1, y - 1, '#c8e4ec'); pb.set(x + 2, y, '#c8e4ec'); }
  const isl = { sakin_liman: [60, 30, '#8ab85a'], yesil_koy: [40, 24, '#5aa04a'], kayalik_adalar: [34, 20, '#a89070'], serin_akintilar: [36, 22, '#6a8a6a'], sisli_kuzey: [50, 22, '#5a6a6a'], gunes_adalari: [44, 22, '#6ac85a'], derin_mavi: [0, 0, null] };
  for (const rid in isl) {
    const [cx, cy] = MAP_POS[rid]; const [w, h, c] = isl[rid]; if (!c) continue;
    const r = mulberry(hash32(rid));
    for (let k = 0; k < 4; k++) { const ox = (r() - 0.5) * w * 0.8, oy = (r() - 0.5) * h * 0.6 + 10; pb.ellipse(cx + ox, cy + oy, w / 2.4 + r() * 6, h / 2.4 + r() * 4, '#f2e2b0'); pb.ellipse(cx + ox, cy + oy - 1, w / 2.4 + r() * 6 - 3, h / 2.4 + r() * 4 - 3, c, (x, y) => ihash(x, y, 4) < 0.08 ? dark(c, 0.15) : c); }
    if (rid === 'sisli_kuzey') for (let k = 0; k < 6; k++) { const x = cx - 20 + k * 8; pb.poly([[x - 4, cy + 10], [x, cy], [x + 4, cy + 10]], '#e8eef2'); }
    if (rid === 'gunes_adalari') for (let k = 0; k < 3; k++) palm(pb, cx - 10 + k * 10, cy + 12, 10, 1);
    if (rid === 'sakin_liman') { for (let k = 0; k < 5; k++) house(pb, cx - 22 + k * 9, cy + 14, 7, 5, '#f2ead8', '#c8643a'); lighthouse(pb, cx + 26, cy + 14, 14, '#f4f0e4', '#c4473f'); }
  }
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) { const e = Math.min(x, y, LW - 1 - x, LH - 1 - y); if (e < 6) pb.set(x, y, e < 2 ? '#5a3a1e' : (e < 4 ? '#c8a870' : '#e8d8a8')); }
  // pusula gülü
  const cx = 30, cy = 52; pb.ellipse(cx, cy, 16, 16, '#e8d8a8'); pb.ellipse(cx, cy, 14, 14, '#f6ecd2'); pb.poly([[cx, cy - 14], [cx + 3, cy], [cx, cy + 14], [cx - 3, cy]], '#c4473f'); pb.poly([[cx - 14, cy], [cx, cy - 3], [cx + 14, cy], [cx, cy + 3]], '#3a6a9a'); drawText(pb, 'K', cx - 1, cy - 25, '#3a2414');
  pb.outline(null, 0.3);
  return pb;
}
const mapArt = () => Atlas.get('seamap', genMap);
