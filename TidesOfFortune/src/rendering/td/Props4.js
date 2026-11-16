// Genişleme Paketi 2 — Kaptanların Hikâyeleri sahne nesneleri (3/4 üst-karşı bakış).
// DRAW sözlüğüne eklenir: (ctx, x, y, t, opts). Yükseklik ekranda yukarı doğru çizilir, gölge altta.
import { rect, px, hline, vline, line, disc, ellipse, hash2 } from '../pixel.js';
import { DRAW, rock, wLine } from './Props.js';
import { petSprite, npcSprite, dS } from './TopChars.js';
import { cannonDraw } from './TopShip.js';

const R = Math.round;
const foam = (c, x, y, w, t) => wLine(c, x, y, w, t);

/** Kıyı top mevzisi: kayalık çıkıntı, taş siper, top. o.fire: namlu ateşi; o.smoke: hasarlı */
DRAW.fort = (c, x, y, t, o = {}) => {
  const s = o.side || 1;
  ellipse(c, x, y + 6, 44, 14, 'rgba(10,20,30,0.28)');
  rock(c, R(x - 26), R(y + 2), 18, '#5a5a62'); rock(c, R(x + 22), R(y + 4), 16, '#62626c'); rock(c, R(x - 4), R(y - 2), 22, '#6a6a72'); rock(c, R(x + 6), R(y + 6), 12, '#56565e');
  // taş kule ve siper
  rect(c, x - 18, y - 30, 36, 20, '#8a8478'); rect(c, x - 18, y - 30, 36, 3, '#a8a296');
  for (let i = 0; i < 5; i++) rect(c, x - 18 + i * 8, y - 35, 5, 5, '#9a948a');
  for (let i = 0; i < 4; i++) hline(c, x - 17, x + 16, y - 26 + i * 4, '#7a746a');
  rect(c, x - 3, y - 18, 6, 8, '#3a2a20');
  hline(c, x - 18, x + 17, y - 10, '#5a564e');
  rect(c, x + 12, y - 48, 2, 14, '#3a3a44'); rect(c, x + 14, y - 48, 7, 4, '#c8423b');
  // top
  cannonDraw(c, R(x), R(y - 32), -s, 0);
  if (o.fire) { disc(c, x - s * 12, y - 37, 5, '#ffd060'); disc(c, x - s * 16, y - 37, 3, '#fff6c0'); }
  if (o.smoke) for (let i = 0; i < 5; i++) disc(c, x + Math.sin(t * 2 + i) * 4, y - 26 - i * 5 - ((t * 10) % 5), 4 + i, `rgba(60,56,52,${0.5 - i * 0.08})`);
  foam(c, x, y + 8, 40, t);
};

/** Su altındaki demir zincir: gerilmiş halkalar; o.w genişlik, o.broken kırık */
DRAW.chainBar = (c, x, y, t, o = {}) => {
  const w = o.w || 140, n = Math.floor(w / 7);
  for (let i = 0; i < n; i++) {
    if (o.broken && Math.abs(i - n / 2) < 2) continue;
    const xx = x - w / 2 + i * 7, sag = Math.sin((i / n) * Math.PI) * (o.taut ? 2 : 6), yy = y + sag + Math.sin(t * 2 + i) * 0.5;
    const up = Math.abs(i - n / 2) < n * 0.3;
    const col = up ? '#4a3e3a' : 'rgba(60,50,46,0.55)';
    rect(c, xx, yy - 1, 5, 3, col); px(c, xx + 2, yy, up ? '#8a6a52' : 'rgba(120,100,80,0.5)');
    if (up && i % 3 === 0) px(c, xx + 1, yy - 2, '#e8f6fb');
  }
  // bariyer kazıkları
  for (const sx of [-1, 1]) { rect(c, x + sx * (w / 2 + 3) - 2, y - 10, 5, 14, '#5a4a3a'); rect(c, x + sx * (w / 2 + 3) - 2, y - 10, 5, 2, '#7a6a52'); foam(c, x + sx * (w / 2 + 3), y + 4, 5, t); }
};

/** Suyun üstünde beliren ayak izleri: o.n görünen iz sayısı, o.dx/o.dy adım yönü */
DRAW.footprints = (c, x, y, t, o = {}) => {
  const n = o.n ?? 8, dx = o.dx ?? 6, dy = o.dy ?? 10;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 4 : -4;
    const fx = x + i * dx + side, fy = y + i * dy;
    const a = Math.max(0.15, 0.85 - (n - i) * 0.07);
    ellipse(c, fx, fy, 3, 5, `rgba(220,245,255,${a})`); ellipse(c, fx, fy - 4, 2, 2, `rgba(220,245,255,${a})`);
    const r = 5 + ((t * 8 + i * 3) % 8);
    c.strokeStyle = `rgba(230,250,255,${Math.max(0, 0.5 - r / 20)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(fx, fy, r, r * 0.55, 0, 0, 7); c.stroke();
  }
  if (o.ghost) for (let k = 0; k < 6; k++) px(c, x + n * dx + Math.sin(t * 3 + k) * 3, y + n * dy - 8 - k * 2, `rgba(200,230,255,${0.4 - k * 0.05})`);
};

/** Taşlaşmış balık sürüsü: bir kısmı griye dönüp durur. o.frozen (0..1) */
DRAW.stoneFish = (c, x, y, t, o = {}) => {
  const n = o.n || 22, fr = o.frozen ?? 0.5;
  ellipse(c, x, y, 46, 22, 'rgba(10,40,60,0.18)');
  for (let i = 0; i < n; i++) {
    const frozen = hash2(i, 301) < fr;
    const ph = frozen ? i * 0.6 : t * 1.4 + i * 0.6;
    const fx = x + Math.cos(ph * 0.7 + i) * (8 + (i % 5) * 7), fy = y + Math.sin(ph + i * 1.7) * (5 + (i % 4) * 3);
    const col = frozen ? '#8a8478' : '#4a7a98', hi = frozen ? '#b8b2a8' : '#8ab4d0';
    rect(c, fx - 2, fy, 4, 2, col); px(c, fx - 3, fy, col); px(c, fx + 1, fy, hi); px(c, fx + 2, fy + 1, col);
  }
};

/** Ses halkaları: sudan yükselen titreşim; o.col renk */
DRAW.soundRings = (c, x, y, t, o = {}) => {
  const col = o.col || '120,220,255';
  for (let i = 0; i < 4; i++) {
    const r = 6 + ((t * 18 + i * 14) % 56);
    c.strokeStyle = `rgba(${col},${Math.max(0, 0.6 - r / 70)})`; c.lineWidth = 1;
    c.beginPath(); c.ellipse(x, y, r, r * 0.5, 0, 0, 7); c.stroke();
  }
  disc(c, x, y, 4 + Math.sin(t * 4) * 1.5, `rgba(${col},0.45)`);
};

/** Dönen su duvarı: geminin çevresinde köpüklü halka. o.r yarıçap, o.gap çıkış açısı (radyan) */
DRAW.waterWall = (c, x, y, t, o = {}) => {
  const r = o.r || 120;
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const ang = a + t * 0.8;
    if (o.gap != null && Math.abs(((ang - o.gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.35) continue;
    const xx = x + Math.cos(ang) * r, yy = y + Math.sin(ang) * r * 0.62;
    const h = 6 + Math.sin(a * 6 + t * 4) * 2;
    vline(c, R(xx), R(yy - h), R(yy), 'rgba(90,150,190,0.75)');
    px(c, xx, yy - h - 1, '#e8f6fb');
    if ((a * 20) % 3 < 1) px(c, xx + 1, yy - h, '#ffffff');
  }
  ellipse(c, x, y, r * 0.9, r * 0.55, 'rgba(20,60,90,0.12)');
};

/** Fırtına cephesi: kara bulut kütlesi, yağmur çizgileri, şimşek. o.side −1 sol / 1 sağ */
DRAW.stormFront = (c, x, y, t, o = {}) => {
  const s = o.side || 1;
  // katmanlı bulut kütlesi: koyu gövde, açık üst kenar, kaynayan kenar parçaları
  for (let i = 0; i < 14; i++) {
    const bx = x + (hash2(i, 311) - 0.5) * 130 + Math.sin(t * 0.6 + i) * 3, by = y + (hash2(i, 312) - 0.5) * 46, br = 12 + hash2(i, 313) * 12;
    ellipse(c, bx, by + 3, br, br * 0.6, 'rgba(14,16,24,0.35)');
    ellipse(c, bx, by, br, br * 0.62, i % 3 ? '#3a3e52' : '#2e3244');
    ellipse(c, bx - br * 0.2, by - br * 0.25, br * 0.6, br * 0.3, '#565c76');
  }
  c.fillStyle = 'rgba(180,200,230,0.45)';
  for (let i = 0; i < 40; i++) { const rx = x + (hash2(i, 315) - 0.5) * 130 + ((t * 40 * s) % 10), ry = y + 20 + ((t * 120 + i * 13) % 70); c.fillRect(R(rx), R(ry), 1, 4); }
  if (Math.sin(t * 3 + (s > 0 ? 1 : 2)) > 0.96) { line(c, x - 10 * s, y, x, y + 30, '#fff6c0'); line(c, x, y + 30, x - 6 * s, y + 52, '#fff6c0'); }
};

/** Yüzen tiyatro sahnesi: sal, perde, kuklalar. o.open perde açık */
DRAW.theatreStage = (c, x, y, t, o = {}) => {
  ellipse(c, x, y + 8, 36, 10, 'rgba(10,20,30,0.25)');
  rect(c, x - 32, y - 2, 64, 10, '#7a5a34'); for (let i = 0; i < 8; i++) vline(c, x - 30 + i * 8, y - 2, y + 7, '#5a4020');
  rect(c, x - 30, y - 30, 4, 28, '#5a4020'); rect(c, x + 26, y - 30, 4, 28, '#5a4020'); rect(c, x - 30, y - 34, 60, 5, '#8a1f2a');
  const op = o.open ?? 1;
  const cw = R(26 * (1 - op)) + 3;
  rect(c, x - 26, y - 29, cw, 26, '#a02a34'); rect(c, x + 26 - cw, y - 29, cw, 26, '#a02a34');
  if (op > 0.3) {
    const b = Math.sin(t * 6) * 2;
    dS(c, npcSprite('villager', 'down', 'idle', 0), x - 8, y - 4 + b);
    dS(c, npcSprite('merchant', 'down', 'work', Math.floor(t * 4) % 4), x + 8, y - 4 - b);
  }
  for (let i = 0; i < 5; i++) px(c, x - 24 + i * 12, y - 32, Math.sin(t * 5 + i) > 0 ? '#ffe080' : '#c8a040');
  wLine(c, x, y + 8, 30, t);
};

/** Terazi: kefeler o.tilt (−1..1) ile eğilir; o.cheat gizli ağırlık görünür */
DRAW.scales = (c, x, y, t, o = {}) => {
  const tl = (o.tilt ?? Math.sin(t * 2) * 0.3) * 5;
  ellipse(c, x, y + 2, 10, 3, 'rgba(20,10,4,0.25)');
  rect(c, x - 1, y - 16, 3, 17, '#6a5a3a'); rect(c, x - 5, y, 11, 2, '#5a4a2a');
  line(c, x - 12, y - 15 + tl, x + 12, y - 15 - tl, '#c8a040');
  for (const [sx, dy] of [[-12, tl], [12, -tl]]) { line(c, x + sx, y - 15 + dy, x + sx - 3, y - 8 + dy, '#a08040'); line(c, x + sx, y - 15 + dy, x + sx + 3, y - 8 + dy, '#a08040'); rect(c, x + sx - 4, y - 8 + dy, 9, 2, '#e0b040'); }
  if (o.cheat) { rect(c, x - 15, y - 6 + tl, 3, 2, '#5a5a62'); px(c, x - 14, y - 7 + tl, '#ffffff'); }
};

/** Su altı mekanizması: yarı saydam dönen dişliler; o.slow durduruldu, o.closed kapatıldı */
DRAW.mechanism = (c, x, y, t, o = {}) => {
  const sp = o.closed ? 0 : o.slow ? 0.3 : 1.6;
  ellipse(c, x, y, 50, 26, 'rgba(10,30,50,0.28)');
  for (const [gx, gy, gr, dir] of [[-18, -2, 12, 1], [8, -6, 9, -1], [20, 8, 7, 1]]) {
    const a0 = t * sp * dir;
    for (let k = 0; k < 10; k++) { const a = a0 + (k / 10) * Math.PI * 2; px(c, x + gx + Math.cos(a) * gr, y + gy + Math.sin(a) * gr * 0.6, 'rgba(160,140,100,0.75)'); }
    c.strokeStyle = 'rgba(120,110,90,0.6)'; c.beginPath(); c.ellipse(x + gx, y + gy, gr - 2, (gr - 2) * 0.6, 0, 0, 7); c.stroke();
    disc(c, x + gx, y + gy, 2, 'rgba(90,80,60,0.8)');
  }
  if (!o.closed) for (let i = 0; i < 6; i++) px(c, x - 30 + ((t * 30 + i * 12) % 60), y + 14 + Math.sin(t * 3 + i) * 2, 'rgba(200,240,255,0.7)');
  else for (let i = 0; i < 6; i++) px(c, x - 20 + i * 8, y - 14 - Math.sin(t * 2 + i) * 2, 'rgba(255,240,180,0.7)');
};

/** Yarış şamandırası: renkli bayrak */
DRAW.raceBuoy = (c, x, y, t, o = {}) => {
  const yy = R(y + Math.sin(t * 1.6));
  ellipse(c, x, y + 2, 7, 3, 'rgba(10,20,30,0.25)');
  rect(c, x - 3, yy - 5, 7, 6, '#e8e0c8'); rect(c, x - 3, yy - 2, 7, 2, o.col || '#c8423b');
  vline(c, x, yy - 16, yy - 5, '#3a3a44');
  const fw = Math.sin(t * 6) > 0 ? 7 : 6;
  rect(c, x + 1, yy - 16, fw, 4, o.col || '#c8423b');
  wLine(c, x, y + 2, 5, t);
};

/** Mercan sınırı: sol yarısı canlı renkli, sağ yarısı soluk; o.heal (0..1) iyileşme */
DRAW.coralLine = (c, x, y, t, o = {}) => {
  const n = o.n || 18, heal = o.heal || 0;
  ellipse(c, x, y, 80, 30, 'rgba(10,50,60,0.18)');
  for (let i = 0; i < n; i++) {
    const cx = x + (hash2(i, 321) - 0.5) * 150, cy = y + (hash2(i, 322) - 0.5) * 50;
    const alive = cx < x || hash2(i, 323) < heal;
    const col = alive ? ['#e0607a', '#f0a050', '#58d0c8', '#c070e0'][i % 4] : '#9a948a';
    const h = 3 + R(hash2(i, 324) * 5);
    vline(c, R(cx), R(cy - h), R(cy), col); px(c, cx - 1, cy - h + 1, col); px(c, cx + 1, cy - h + 2, col);
    if (alive && Math.sin(t * 2 + i) > 0.7) px(c, cx, cy - h - 1, '#ffffff');
  }
  if (heal > 0.5) for (let i = 0; i < 5; i++) px(c, x + Math.cos(t + i) * 30, y + Math.sin(t * 1.3 + i) * 12, '#7ad8ff');
};

/** Güvertede ipe dolanmış martı (o.free: kurtarıldı) */
DRAW.tangledGull = (c, x, y, t, o = {}) => {
  dS(c, petSprite('PET_MARTI', 'down', o.free ? (Math.sin(t * 9) > 0 ? 'fly0' : 'fly1') : 'idle'), x, y);
  if (!o.free) { line(c, x - 6, y - 8, x + 5, y - 4, '#c8b080'); line(c, x - 4, y - 3, x + 6, y - 9, '#c8b080'); }
};

/** Küçük mühürlü paket */
DRAW.parcel = (c, x, y, t, o = {}) => {
  ellipse(c, x, y + 1, 5, 2, 'rgba(20,10,4,0.25)');
  rect(c, x - 4, y - 5, 9, 6, '#c8a070'); hline(c, x - 4, x + 4, y - 3, '#7a5030'); vline(c, x, y - 5, y, '#7a5030');
  disc(c, x + 2, y - 2, 1, o.open ? '#5a3a20' : '#b8282c');
};

/** Strateji masası: taşlar hareket eder */
DRAW.strategyTable = (c, x, y, t) => {
  ellipse(c, x, y + 3, 14, 4, 'rgba(20,10,4,0.25)');
  rect(c, x - 12, y - 8, 24, 10, '#7a5a34'); rect(c, x - 12, y - 8, 24, 2, '#9a7a4a');
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) rect(c, x - 10 + i * 5, y - 6 + j * 4, 2, 2, (i + j) % 2 ? '#e8e0c8' : '#3a2a1a');
  const k = Math.floor(t * 1.5) % 4;
  disc(c, x - 9 + k * 5, y - 4, 1, '#c8423b'); disc(c, x + 9 - k * 5, y, 1, '#3b6ea5');
};

/** Şifa kasesi: otlar ve buhar */
DRAW.herbBowl = (c, x, y, t) => {
  ellipse(c, x, y + 1, 6, 2, 'rgba(20,10,4,0.25)');
  rect(c, x - 5, y - 4, 11, 5, '#8a6a44'); hline(c, x - 4, x + 4, y - 4, '#5a8a4a');
  for (let i = 0; i < 3; i++) px(c, x - 2 + i * 2 + Math.sin(t * 3 + i), y - 7 - ((t * 6 + i * 2) % 6), 'rgba(220,240,220,0.6)');
};

/** İşaret bayrakları dizisi (direkten direğe) */
DRAW.signalFlags = (c, x, y, t, o = {}) => {
  const cols = o.cols || ['#e0c040', '#1a1a1a', '#e0c040', '#c8423b'];
  line(c, x - 20, y - 18, x + 20, y - 12, '#3a2a1a');
  cols.forEach((col, i) => { const fx = x - 16 + i * 10, fy = y - 17 + i * 1.5 + Math.sin(t * 6 + i); rect(c, fx, fy, 6, 5, col); if (col === '#1a1a1a') hline(c, fx, fx + 5, fy + 2, '#e0c040'); });
};

/** Dar kalas (düello): iki gemi arası */
DRAW.duelPlank = (c, x, y, t, o = {}) => {
  const w = o.w || 60;
  rect(c, x - w / 2, y - 2, w, 5, '#8a6a3a'); hline(c, x - w / 2, x + w / 2 - 1, y - 2, '#a8865a');
  for (let i = 0; i < w; i += 9) vline(c, x - w / 2 + i, y - 2, y + 2, '#6a4a28');
  wLine(c, x, y + 8, w / 2, t);
};
