// Genişleme Paketi 3 — Efsanevi Denizler ve Rakip Kaptanlar sahne nesneleri (3/4 üst-karşı bakış, Fable piksel stili).
// DRAW sözlüğüne eklenir: (ctx, x, y, t, opts). Yükseklik ekranda yukarı doğru çizilir, gölge altta.
import { rect, px, hline, vline, line, disc, ellipse, hash2, shade } from '../pixel.js';
import { DRAW, rock, wLine, palm, Za } from './Props.js';
import { npcSprite, dS } from './TopChars.js';
import { cannonDraw } from './TopShip.js';

const R = Math.round;

/** Sönmeyen fener: donmuş armada gemisinin pruvasında süzülen ışık. o.sync: eşzamanlı parlama, o.blind: kör edici, o.off: söndü */
DRAW.armadaLantern = (c, x, y, t, o = {}) => {
  if (o.off) { rect(c, x - 2, y - 6, 5, 7, '#3a4048'); return; }
  const k = o.sync ? 1 : 0.55 + 0.45 * Math.sin(t * (2 + (o.ph || 0)) + (o.ph || 0) * 3);
  const r = o.blind ? 26 : 9 + k * 5;
  c.fillStyle = `rgba(200,240,255,${(o.blind ? 0.35 : 0.14) * (0.6 + k * 0.4)})`;
  c.beginPath(); c.arc(x, y - 4, r, 0, 6.283); c.fill();
  disc(c, x, y - 4, 5, `rgba(220,248,255,${0.35 + k * 0.3})`);
  rect(c, x - 3, y - 9, 7, 9, '#3a4a58'); rect(c, x - 2, y - 8, 5, 7, o.sync ? '#ffffff' : '#c8f4ff'); hline(c, x - 3, x + 3, y - 10, '#8aa4b8'); px(c, x, y - 11, '#8aa4b8');
  if (o.sync) for (let i = 0; i < 8; i++) { const a = i * 0.785 + t; px(c, x + Math.cos(a) * 12, y - 4 + Math.sin(a) * 8, '#ffffff'); }
};

/** Buz kristalleri / donmuşluk tozu (donmuş gemilerin üstünde) */
DRAW.frost = (c, x, y, t, o = {}) => {
  const w = o.w || 60, h = o.h || 90;
  for (let i = 0; i < (o.n || 22); i++) {
    const xx = x + (hash2(i, 51) - 0.5) * w, yy = y + (hash2(i, 52) - 0.5) * h - ((t * 4 + i * 7) % 12);
    if (Math.sin(t * 3 + i) > 0.3) { px(c, xx, yy, '#e8f8ff'); px(c, xx + 1, yy, 'rgba(200,236,255,0.6)'); px(c, xx, yy - 1, 'rgba(200,236,255,0.6)'); }
  }
};

/** Denizden yükselen taş sütun: o.h 0..1 yükselme, o.glyph ışıyan çizim, o.top yol tablası */
DRAW.stonePillar = (c, x, y, t, o = {}) => {
  const hh = R((o.h ?? 1) * (o.H || 46)), w = o.w || 12;
  ellipse(c, x, y + 2, w + 6, 5, 'rgba(10,20,30,0.3)');
  if (hh <= 0) { Za(c, x, y, w, t); return; }
  for (let i = 0; i <= hh; i++) {
    const q = i / Math.max(1, hh);
    // taş bloklar: her 9 satırda derz, sol aydınlık / sağ gölge, ıslak alt kısım
    const joint = (i + R(x)) % 9 === 0;
    for (let k = -w; k <= w; k++) {
      const t2 = (k + w) / (2 * w);
      let col = t2 < 0.25 ? '#8a8880' : t2 > 0.75 ? '#55534e' : '#6e6c66';
      if (q < 0.14) col = shade(col, -0.25);
      if (joint) col = '#4a4844';
      else if (((k + (Math.floor((i + R(x)) / 9) % 2) * 5) % 10) === 0) col = '#4e4c48';
      px(c, x + k, y - i, col);
    }
    if (q < 0.2 && hash2(i, R(x)) > 0.55) px(c, x - w + R(hash2(i, 7) * 2 * w), y - i, '#3e7a4a');
  }
  // tepe
  ellipse(c, x, y - hh, w, 4, '#9a9890'); ellipse(c, x, y - hh, w - 2, 3, '#aeaca4');
  if (o.top) { rect(c, x - w - 4, y - hh - 3, w * 2 + 8, 4, '#8a8880'); hline(c, x - w - 4, x + w + 4, y - hh - 3, '#b4b2aa'); }
  if (o.glyph && hh > 14) {
    const g = 0.5 + 0.5 * Math.sin(t * 3 + x * 0.1);
    const col = `rgba(120,240,220,${0.55 + g * 0.45})`;
    const gy = y - R(hh * 0.55);
    line(c, x - 5, gy - 4, x, gy + 3, col); line(c, x, gy + 3, x + 5, gy - 4, col); hline(c, x - 4, x + 4, gy - 6, col); px(c, x, gy - 8, col);
  }
  // su dökülmesi
  if ((o.h ?? 1) < 1) for (let i = 0; i < 4; i++) px(c, x - w + 2 + i * 6, y - hh + 3 + ((t * 20 + i * 5) % 8), '#d8f0f8');
  wLine(c, x, y, w + 2, t);
};

/** Taş yol: sütunların arasındaki geçit çizgisi (o.n sütun sayısı, o.h yükseklik, o.glyph) */
DRAW.causeway = (c, x, y, t, o = {}) => {
  const n = o.n || 5, gap = o.gap || 38;
  for (let i = 0; i < n; i++) DRAW.stonePillar(c, x + (i - (n - 1) / 2) * gap, y + (i % 2) * 6, t, { h: Math.max(0, Math.min(1, (o.h ?? 1) * 1.3 - i * 0.07)), glyph: o.glyph, top: true, H: 30, w: 10 });
};

/** Yaşayan ada: sırtında yosun, palmiye, kuş; nefes alır. o.eye 0..1 göz açıklığı, o.fin yüzgeç, o.night gece ışıması, o.turn dönüş */
DRAW.livingIsland = (c, x, y, t, o = {}) => {
  const br = Math.sin(t * 0.9) * 2.5; // nefes
  const rx = o.r || 78, ry = R(rx * 0.42);
  // su altı gövde gölgesi
  ellipse(c, x, y + 10, rx + 30, ry + 16, 'rgba(10,30,40,0.28)');
  ellipse(c, x, y + 8, rx + 18, ry + 10, 'rgba(40,70,80,0.35)');
  // yüzgeç
  if (o.fin) { const fx = x + rx + 14, fy = y + 4 + Math.sin(t * 2) * 3; line(c, fx, fy, fx + 22, fy - 10, '#3a5a5e'); line(c, fx, fy + 1, fx + 20, fy - 6, '#2a4a4e'); ellipse(c, fx + 14, fy - 4, 10, 4, '#4a6a6c'); }
  // kabuk sırt (katmanlı)
  ellipse(c, x, y - br * 0.3, rx + 2, ry + 2, '#2e4a40');
  ellipse(c, x, y - 2 - br * 0.5, rx, ry, '#4a6a52');
  ellipse(c, x, y - 6 - br, rx - 8, ry - 6, '#5e8456');
  for (let i = 0; i < 40; i++) {
    const a = hash2(i, 61) * 6.28, d = Math.sqrt(hash2(i, 62));
    const xx = x + Math.cos(a) * d * (rx - 10), yy = y - 6 - br + Math.sin(a) * d * (ry - 8);
    px(c, xx, yy, hash2(i, 63) > 0.5 ? '#78a060' : '#3e6046');
    if (o.night && hash2(i, 64) > 0.6) px(c, xx, yy - 1, `rgba(120,220,255,${0.5 + 0.5 * Math.sin(t * 2 + i)})`);
  }
  // kumsal yaması + palmiyeler
  ellipse(c, x - 14, y - 10 - br, 26, 9, '#d8c68c'); ellipse(c, x - 14, y - 11 - br, 23, 7, '#eedfae');
  palm(c, R(x - 22), R(y - 12 - br), t, 1.3); palm(c, R(x - 4), R(y - 14 - br), t + 1, 1.1); palm(c, R(x + 26), R(y - 10 - br), t + 2, 0.9);
  rock(c, R(x + 40), R(y - 6 - br), 8, '#6a6a62');
  // baş (kaplumbağa/balina karışımı yaşlı yaratık): öne uzanmış, kabuk desenli, büyük göz
  const hx = x - rx - 4 + (o.turn ? -10 : 0), hy = y + 8;
  ellipse(c, hx + 6, hy + 4, 34, 12, 'rgba(10,30,40,0.3)');
  ellipse(c, hx, hy, 30, 15, '#2e4a40'); ellipse(c, hx, hy - 2, 28, 13, '#4a6c5a'); ellipse(c, hx - 4, hy - 5, 20, 7, '#5e8466');
  for (let i = 0; i < 8; i++) px(c, hx - 18 + i * 5, hy + 7, '#22382f');
  for (let i = 0; i < 5; i++) ellipse(c, hx + 8 + i * 3, hy - 6 + (i % 2) * 3, 2, 1, '#3e6046');
  hline(c, hx - 26, hx - 12, hy + 3, '#1e3028'); // ağız çizgisi
  const eo = o.eye ?? 0;
  if (eo > 0.05) {
    if (eo > 0.6) { c.fillStyle = `rgba(255,240,160,${0.18 * eo})`; c.beginPath(); c.arc(hx - 10, hy - 6, 12, 0, 6.283); c.fill(); }
    ellipse(c, hx - 10, hy - 6, 7, Math.max(1, R(5 * eo)), '#f4eaa8'); disc(c, hx - 10, hy - 6, Math.max(1, R(3 * eo)), '#2a2410'); px(c, hx - 12, hy - 8, '#ffffff');
  } else { hline(c, hx - 16, hx - 4, hy - 6, '#1e3028'); hline(c, hx - 15, hx - 5, hy - 5, '#3a5a4a'); }
  // nefes: başın üstünde su püskürmesi (döngüsel)
  const ph = (t * 0.35) % 1;
  if (ph < 0.25) for (let i = 0; i < 6; i++) { const k = ph * 4; disc(c, hx + 4 + (i - 3) * 2 * k, hy - 18 - k * 22 + Math.abs(i - 3) * 2, 2, `rgba(225,248,255,${0.8 - k * 0.6})`); }
  // köpük
  for (let q = 0; q < 6.28; q += 0.14) if (Math.sin(q * 6 + t * 1.4) > 0.2) px(c, x + Math.cos(q) * (rx + 6), y + 4 + Math.sin(q) * (ry + 6), 'rgba(240,250,255,0.85)');
};

/** Başıboş top salı: iki eski top, yanan fitiller, dönerek sürüklenir. o.lit fitil, o.boom ateş, o.broken bağ koptu */
DRAW.cannonRaft = (c, x, y, t, o = {}) => {
  const yy = R(y + Math.sin(t * 1.4) * 1.5);
  Za(c, x, y + 4, 20, t);
  for (let n = 0; n < 7; n++) rect(c, x - 14 + n * 4, yy - 7, 4, 15, n % 2 ? '#7a4a24' : '#8a5a2b'), vline(c, x - 14 + n * 4, yy - 7, yy + 7, '#a87a4a');
  hline(c, x - 14, x + 13, yy - 3, '#5c3a1e'); hline(c, x - 14, x + 13, yy + 4, '#5c3a1e');
  if (o.broken) { line(c, x - 2, yy - 7, x + 1, yy + 7, '#2a6a8a'); }
  const s = Math.sign(Math.sin(t * 0.6)) || 1;
  cannonDraw(c, x - 6, yy - 2, s, 0); cannonDraw(c, x + 6, yy + 2, -s, 0);
  if (o.lit) for (const dx of [-6, 6]) if (Math.sin(t * 9 + dx) > 0) { px(c, x + dx, yy - 8, '#ffd060'); px(c, x + dx, yy - 9, '#fff0a0'); }
  if (o.boom) { disc(c, x + 16 * s, yy - 4, 6, '#ffd060'); disc(c, x + 20 * s, yy - 4, 4, '#fff6c0'); }
  wLine(c, x, yy + 9, 15, t);
};

/** Ağır çapa ve zinciri (sürüklenen). o.held güvertede, o.drop düşüyor */
DRAW.heavyAnchor = (c, x, y, t, o = {}) => {
  const yy = R(y + (o.held ? 0 : Math.sin(t * 1.2)));
  if (!o.held) Za(c, x, y + 6, 14, t);
  vline(c, x, yy - 22, yy + 4, '#4a4a52'); vline(c, x + 1, yy - 22, yy + 4, '#6a6a74');
  disc(c, x, yy - 24, 3, '#4a4a52'); disc(c, x, yy - 24, 1, '#1a2a34');
  hline(c, x - 8, x + 9, yy - 16, '#5a5a62');
  line(c, x - 12, yy - 2, x, yy + 6, '#4a4a52'); line(c, x + 13, yy - 2, x + 1, yy + 6, '#4a4a52');
  rect(c, x - 14, yy - 5, 4, 4, '#5a5a62'); rect(c, x + 11, yy - 5, 4, 4, '#5a5a62');
  for (let i = 0; i < (o.chain || 6); i++) rect(c, x + 2 + i * 5, yy - 26 - (i % 2), 4, 2, i % 2 ? '#3a3a40' : '#5a5a62');
  if (!o.held) wLine(c, x, yy + 7, 12, t);
};

/** Suyun üstünde beliren ışık harfleri. o.fade 0..1, o.decoded çözülmüş (sıralı) */
DRAW.seaGlyphs = (c, x, y, t, o = {}) => {
  const n = o.n || 9, a = o.fade ?? 1;
  for (let i = 0; i < n; i++) {
    const ox = o.decoded ? (i - n / 2) * 12 : (hash2(i, 71) - 0.5) * 120 + Math.sin(t * 0.8 + i) * 6;
    const oy = o.decoded ? Math.sin(t * 2 + i) : (hash2(i, 72) - 0.5) * 50 + Math.cos(t * 0.7 + i) * 4;
    const gx = R(x + ox), gy = R(y + oy);
    const col = `rgba(170,250,240,${a * (0.55 + 0.45 * Math.sin(t * 3 + i * 1.7))})`;
    const k = i % 4;
    if (k === 0) { vline(c, gx, gy - 4, gy + 3, col); hline(c, gx - 2, gx + 2, gy - 4, col); }
    else if (k === 1) { line(c, gx - 3, gy + 3, gx, gy - 4, col); line(c, gx, gy - 4, gx + 3, gy + 3, col); hline(c, gx - 2, gx + 2, gy, col); }
    else if (k === 2) { ellipse(c, gx, gy, 3, 3, col); disc(c, gx, gy, 1, 'rgba(10,40,60,0.6)'); }
    else { line(c, gx - 3, gy - 3, gx + 3, gy + 3, col); line(c, gx + 3, gy - 3, gx - 3, gy + 3, col); }
  }
};

/** Dalgasız koridor: iki yanda dalga duvarları arasında cam gibi düz şerit. o.w genişlik, o.close kapanma 0..1 */
DRAW.calmCorridor = (c, x, y, t, o = {}) => {
  const w = R((o.w || 70) * (1 - (o.close || 0) * 0.8)), L = o.len || 420;
  c.fillStyle = 'rgba(190,235,245,0.28)'; c.fillRect(x - w / 2, y - L / 2, w, L);
  for (let i = 0; i < L; i += 8) { px(c, x - w / 2 + ((i * 7) % w), y - L / 2 + i, 'rgba(255,255,255,0.45)'); }
  for (const s of [-1, 1]) {
    const ex = x + s * (w / 2);
    for (let i = 0; i < L; i += 3) {
      const hh = 6 + Math.sin(i * 0.12 + t * 3) * 3;
      vline(c, ex + s * 2, y - L / 2 + i - hh, y - L / 2 + i, '#3a7a9a');
      px(c, ex + s * 2, y - L / 2 + i - hh, '#e8f8ff');
      px(c, ex + s * 4, y - L / 2 + i - hh + 1, 'rgba(232,248,255,0.6)');
    }
  }
};

/** İsimsiz taş heykel: kayalık kaide, denize dönük yüz. o.clean temiz kaide (sembol), o.coins dökülen sikkeler */
DRAW.stoneStatue = (c, x, y, t, o = {}) => {
  ellipse(c, x, y + 6, 34, 11, 'rgba(10,20,30,0.28)');
  rock(c, R(x - 16), R(y + 4), 14, '#5e5e66'); rock(c, R(x + 14), R(y + 6), 12, '#686870'); rock(c, x, R(y + 2), 18, '#62626a');
  rect(c, x - 12, y - 10, 24, 10, '#8a8478'); hline(c, x - 12, x + 11, y - 10, '#a8a296');
  if (!o.clean) for (let i = 0; i < 18; i++) px(c, x - 11 + hash2(i, 81) * 22, y - 9 + hash2(i, 82) * 8, '#4a7a44');
  else { const g = `rgba(255,220,120,${0.6 + 0.4 * Math.sin(t * 3)})`; ellipse(c, x, y - 5, 4, 3, g); px(c, x, y - 5, '#fff0b0'); }
  // gövde
  rect(c, x - 7, y - 40, 14, 30, '#8e8a80'); vline(c, x + 6, y - 40, y - 10, '#6a665e'); vline(c, x - 7, y - 40, y - 10, '#a8a49a');
  rect(c, x - 9, y - 34, 3, 16, '#8a867c'); rect(c, x + 7, y - 34, 3, 16, '#7a766e');
  disc(c, x, y - 46, 6, '#9a968c'); disc(c, x - 1, y - 47, 5, '#aaa69c'); hline(c, x - 3, x + 2, y - 44, '#6a665e');
  for (let i = 0; i < 6; i++) px(c, x - 5 + i * 2, y - 52 + (i % 2), '#4a7a44');
  if (o.coins) for (let i = 0; i < 6; i++) { const cx = x - 14 + i * 5, cy = y + 6 + ((t * 12 + i * 3) % 6); disc(c, cx, cy, 2, '#f0c040'); px(c, cx, cy - 1, '#fff0a0'); }
  wLine(c, x, y + 8, 30, t);
};

/** Işıklı balık ağı: suyun üstünde yüzen küçük fenerler ve ağ ipleri. o.pull: ağ toplanıyor (0..1), o.fish */
DRAW.lightNet = (c, x, y, t, o = {}) => {
  const p = o.pull || 0, r = R((o.r || 70) * (1 - p * 0.6));
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 6.283, lx = R(x + Math.cos(a) * r), ly = R(y + Math.sin(a) * r * 0.5);
    const na = ((i + 1) / 14) * 6.283;
    line(c, lx, ly, R(x + Math.cos(na) * r), R(y + Math.sin(na) * r * 0.5), 'rgba(200,180,140,0.6)');
    const k = 0.6 + 0.4 * Math.sin(t * 3 + i);
    c.fillStyle = `rgba(255,220,120,${0.18 * k})`; c.beginPath(); c.arc(lx, ly - 2, 6, 0, 6.283); c.fill();
    disc(c, lx, ly - 2, 2, `rgba(255,230,140,${0.7 + 0.3 * k})`); px(c, lx, ly, '#5a3a1e');
  }
  if (o.fish) for (let i = 0; i < 16; i++) { const fx = x + (hash2(i, 91) - 0.5) * r * 1.4, fy = y + (hash2(i, 92) - 0.5) * r * 0.6 + Math.sin(t * 6 + i); hline(c, fx - 2, fx + 2, fy, '#c8d8e0'); px(c, fx + 3, fy, '#e8f4f8'); }
};

/** Birleşen sığlıklar: kumul dilleri (o.merge 0..1 birleşme, o.channel kanal açık) */
DRAW.sandbar = (c, x, y, t, o = {}) => {
  const m = o.merge ?? 1, w = o.w || 200;
  for (const s of [-1, 1]) {
    const cx = x + s * (w / 2 - (w / 4) * m);
    ellipse(c, cx, y, w / 2 + 10, 16, 'rgba(210,190,130,0.35)');
    ellipse(c, cx, y, w / 2, 11, '#d8c68c'); ellipse(c, cx, y - 1, w / 2 - 6, 8, '#eedfae');
    for (let i = 0; i < 20; i++) px(c, cx + (hash2(i, 101 + s) - 0.5) * w * 0.8, y + (hash2(i, 102) - 0.5) * 12, '#c8b47c');
  }
  if (o.channel) { c.fillStyle = 'rgba(40,110,150,0.85)'; c.fillRect(x - 14, y - 10, 28, 20); for (let i = 0; i < 4; i++) hline(c, x - 12, x + 12, y - 8 + i * 5, 'rgba(200,240,255,0.4)'); }
  for (let q = 0; q < 6.28; q += 0.2) if (Math.sin(q * 5 + t * 1.6) > 0.3) px(c, x + Math.cos(q) * (w / 2 + 14), y + Math.sin(q) * 14, 'rgba(240,250,255,0.85)');
};

/** Cam gibi kırılan dalga: parlak kırık tepe parçaları. o.shatter 0..1 */
DRAW.glassWave = (c, x, y, t, o = {}) => {
  const w = o.w || 120, s = o.shatter || 0;
  for (let i = 0; i < w; i += 2) {
    const hh = 12 + Math.sin(i * 0.08 + t) * 4;
    vline(c, x - w / 2 + i, y - hh, y, i % 6 ? '#5ab4d0' : '#8ad8ec');
    px(c, x - w / 2 + i, y - hh, '#f0fcff');
  }
  if (s > 0) for (let i = 0; i < 18; i++) {
    const a = hash2(i, 111) * 3.14 + 3.14, d = s * (20 + hash2(i, 112) * 40);
    const sx = R(x + (hash2(i, 113) - 0.5) * w + Math.cos(a) * d), sy = R(y - 14 + Math.sin(a) * d * 0.6 + s * s * 20);
    line(c, sx, sy, sx + 2, sy - 3, 'rgba(230,252,255,0.9)'); px(c, sx + 1, sy - 1, '#ffffff');
  }
};

/** Göğü kapatan kuş sürüsü: koyu, yoğun. o.n sayı, o.r yarıçap, o.part tünel açılması (0..1) */
DRAW.birdSwarm = (c, x, y, t, o = {}) => {
  const n = o.n || 90, r = o.r || 150, part = o.part || 0;
  for (let i = 0; i < n; i++) {
    let a = hash2(i, 121) * 6.283 + t * (0.3 + hash2(i, 122) * 0.4), d = Math.sqrt(hash2(i, 123)) * r;
    let bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d * 0.6;
    if (part && Math.abs(bx - x) < 50 * part) bx += Math.sign(bx - x || 1) * 50 * part;
    const f = Math.sin(t * 12 + i) > 0;
    hline(c, bx - 1, bx + 1, by, '#1e1e24');
    f ? (px(c, bx - 2, by - 1, '#2a2a32'), px(c, bx + 2, by - 1, '#2a2a32')) : (px(c, bx - 2, by + 1, '#2a2a32'), px(c, bx + 2, by + 1, '#2a2a32'));
  }
};

/** Durmayan saat: amiral gemisi güvertesinde dev saat (o.sync eşitlendi, o.ring çalıyor) */
DRAW.bigClock = (c, x, y, t, o = {}) => {
  rect(c, x - 9, y - 30, 18, 30, '#5a4028'); rect(c, x - 8, y - 29, 16, 28, '#7a5a38');
  disc(c, x, y - 20, 7, '#e8e0c8'); disc(c, x, y - 20, 6, '#f8f0d8');
  for (let i = 0; i < 12; i++) { const a = i * 0.5236; px(c, x + Math.cos(a) * 5, y - 20 + Math.sin(a) * 5, '#5a4028'); }
  const a1 = o.sync ? -1.5708 : t * 2, a2 = o.sync ? -1.5708 : t * 0.2;
  line(c, x, y - 20, R(x + Math.cos(a1) * 5), R(y - 20 + Math.sin(a1) * 5), '#1a1410');
  line(c, x, y - 20, R(x + Math.cos(a2) * 3), R(y - 20 + Math.sin(a2) * 3), '#c83a2a');
  vline(c, x + Math.sin(t * 4) * 3, y - 11, y - 4, '#c8a040'); disc(c, R(x + Math.sin(t * 4) * 3), y - 4, 2, '#e0b040');
  if (o.ring) for (let i = 0; i < 3; i++) ellipse(c, x, y - 20, 10 + i * 5 + ((t * 20) % 5), 6 + i * 3, `rgba(255,240,200,${0.4 - i * 0.12})`);
};

/** Matbaa güvertesi: baskı makinesi ve kâğıt yığını (gezgin harita matbaası teknesinin üstü) */
DRAW.pressBoat = (c, x, y, t, o = {}) => {
  const yy = R(y + Math.sin(t * 1.6));
  Za(c, x, y + 6, 22, t);
  ellipse(c, x, yy + 2, 26, 11, '#5c3a1e'); ellipse(c, x, yy, 24, 9, '#8a5a2b'); ellipse(c, x, yy - 1, 21, 7, '#c8a070');
  // baskı makinesi
  rect(c, x - 8, yy - 14, 16, 10, '#3a3a40'); rect(c, x - 7, yy - 13, 14, 4, '#5a5a62'); vline(c, x, yy - 22, yy - 14, '#2a2a30');
  const k = o.press ? Math.abs(Math.sin(t * 4)) * 4 : 0;
  rect(c, x - 6, yy - 18 + R(k), 12, 3, '#6a6a72'); line(c, x, yy - 22, x + 10, yy - 26, '#8a6a40'); disc(c, x + 10, yy - 26, 2, '#c8a040');
  // kâğıtlar
  for (let i = 0; i < 4; i++) rect(c, x + 10, yy - 6 - i * 2, 8, 2, i % 2 ? '#f4ecd8' : '#e8dcc0');
  if (o.npc !== null) dS(c, npcSprite(o.npc || 'cartographer', 'down', o.press ? 'work' : 'idle', R(t * 4) % 2), x - 14, yy + 2);
  wLine(c, x, yy + 10, 24, t);
};

/** Dokumacı kumaş topları ve gerili yelken bezi (dokumacı gemisi üstü) */
DRAW.clothBolts = (c, x, y, t, o = {}) => {
  const cols = o.cols || ['#c8423b', '#3b6ea5', '#e8c45a', '#2f8a6a', '#8b5bb5'];
  cols.forEach((col, i) => { const bx = x - 20 + i * 10, by = y - (i % 2) * 3; rect(c, bx, by - 6, 8, 6, col); hline(c, bx, bx + 7, by - 6, shade(col, 0.3)); px(c, bx + 3, by - 3, shade(col, -0.3)); });
  if (o.sheet) { const sw = Math.sin(t * 2) * 2; rect(c, x - 24, y - 26 + sw, 48, 14, '#f4ecd8'); hline(c, x - 24, x + 23, y - 26 + sw, '#ffffff'); for (let i = 0; i < 6; i++) vline(c, x - 22 + i * 9, y - 25 + sw, y - 13 + sw, 'rgba(180,160,120,0.4)'); }
};
