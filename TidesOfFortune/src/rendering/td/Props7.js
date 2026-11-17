// GİZLİ DENİZ HİKÂYELERİ — 23 olayın sahne nesneleri (3/4 üst-karşı bakış, Fable piksel paleti).
// Hepsi özgün çizimdir; hiçbir eserin karakter tasarımı, logosu ya da kostümü kopyalanmaz.
// DRAW sözlüğüne eklenir: (ctx, x, y, t, opts). Yükseklik ekranda yukarı doğru çizilir, gölge altta.
import { rect, px, hline, vline, line, disc, ellipse, hash2, shade } from '../pixel.js';
import { DRAW, rock, wLine, Za, palm, boatHull, boatSeat } from './Props.js';
import { npcSprite, petSprite, dS } from './TopChars.js';

const R = Math.round;
const sh = (c, x, y, w, h = 3, a = 0.26) => ellipse(c, x, y, w, h, `rgba(10,22,34,${a})`);
const water = (c, x, y, w, t) => wLine(c, x, y, w, t);

/** Uçan / ıslak üç köşe şapka (o.spin: dönüş açısı, o.wet: damla) */
DRAW.hatSpin = (c, x, y, t, o = {}) => {
  const a = o.spin ?? t * 6, k = Math.cos(a);
  const w = R(9 * Math.abs(k)) + 2;
  sh(c, x, y + 14, 7, 2, 0.18);
  ellipse(c, x, y, w, 3, '#141418'); hline(c, x - w, x + w, y - 1, '#2a2a32');
  rect(c, x - 4, y - 5, 8, 4, '#1e1e24'); hline(c, x - 4, x + 3, y - 5, '#3a3a44');
  if (k > 0) { px(c, x - 3, y - 6, '#c8423b'); line(c, x - 3, y - 6, x - 7, y - 11, '#e8e0c8'); px(c, x - 8, y - 12, '#ffffff'); }
  hline(c, x - w + 1, x + w - 1, y + 1, '#c8a040');
  if (o.wet) for (let i = 0; i < 3; i++) px(c, x - 4 + i * 4, y + 3 + ((t * 20 + i * 4) % 8), '#8ad8ff');
};

/** Sudan çıkan baş-omuz (npc), etrafında halka (o.npc, o.hat: şapka yok) */
DRAW.swimmer = (c, x, y, t, o = {}) => {
  const b = R(Math.sin(t * 3) * 1.5);
  for (let q = 0; q < 6.28; q += 0.35) px(c, x + Math.cos(q + t) * 9, y + 2 + Math.sin(q + t) * 3, 'rgba(235,248,252,0.85)');
  c.save(); c.beginPath(); c.rect(x - 14, y - 40, 28, 40 + b); c.clip();
  dS(c, npcSprite(o.npc || 'sailor', 'down', o.state || 'react', 0), x, y + 14 + b);
  c.restore();
  ellipse(c, x, y + 2, 8, 2, 'rgba(40,110,150,0.6)');
  if (o.splash) for (let i = 0; i < 6; i++) px(c, x - 8 + i * 3, y - 4 - ((t * 30 + i * 7) % 10), '#e8f6fb');
};

/** Yosunlu tahsildar gemisinin defteri (o.open: açık, o.flip: sayfa çevirme) */
DRAW.ledger = (c, x, y, t, o = {}) => {
  sh(c, x, y + 4, 12, 3, 0.2);
  if (!o.open) { rect(c, x - 8, y - 10, 16, 12, '#3a2a1a'); rect(c, x - 7, y - 9, 14, 10, '#5a3a22'); hline(c, x - 7, x + 6, y - 5, '#2e5a3a'); return; }
  rect(c, x - 14, y - 9, 28, 11, '#3a2a1a');
  rect(c, x - 13, y - 10, 12, 10, '#e8dcc0'); rect(c, x + 1, y - 10, 12, 10, '#f0e6cc');
  for (let i = 0; i < 4; i++) { hline(c, x - 12, x - 3, y - 8 + i * 2, '#8a7a62'); hline(c, x + 2, x + 11, y - 8 + i * 2, '#8a7a62'); }
  if (o.flip) { const f = (t * 3) % 1; line(c, x, y - 10, R(x - 10 + f * 22), R(y - 13 - Math.sin(f * 3.14) * 5), '#fff6e0'); }
};

/** Dokunaçlı sakal (memurun yüzünün altında; her dokunaç bağımsız kıvrılır) */
DRAW.tentacleBeard = (c, x, y, t) => {
  for (let i = 0; i < 6; i++) {
    let px0 = x - 6 + i * 2.4, py0 = y;
    for (let k = 0; k < 7; k++) {
      const nx = px0 + Math.sin(t * (2 + i * 0.4) + k * 0.8 + i) * 1.2, ny = py0 + 1.3;
      line(c, R(px0), R(py0), R(nx), R(ny), k < 2 ? '#3a7a5a' : '#5aa07a'); px0 = nx; py0 = ny;
    }
    px(c, R(px0), R(py0), '#8ad0a0');
  }
};

/** Çay bardağı (o.spill: devrik, o.steam) */
DRAW.teaCup = (c, x, y, t, o = {}) => {
  if (o.spill) { ellipse(c, x + 6, y + 1, 7, 2, 'rgba(160,90,40,0.6)'); rect(c, x - 3, y - 2, 6, 3, '#f0ece0'); return; }
  rect(c, x - 2, y - 6, 5, 6, '#f0ece0'); rect(c, x - 1, y - 5, 3, 2, '#a85a28'); hline(c, x - 3, x + 3, y, '#c8a040');
  if (o.steam !== false) for (let i = 0; i < 3; i++) px(c, x - 1 + i, y - 8 - ((t * 8 + i * 3) % 6), 'rgba(255,255,255,0.6)');
};

/** Küçük yüzen buz parçası */
DRAW.iceBit = (c, x, y, t) => {
  const b = R(Math.sin(t * 1.5));
  ellipse(c, x, y + 2, 9, 3, 'rgba(150,220,240,0.4)');
  rect(c, x - 5, y - 4 + b, 10, 6, '#e4f2fa'); hline(c, x - 5, x + 4, y - 4 + b, '#ffffff'); vline(c, x + 4, y - 3 + b, y + 1 + b, '#9ac4dc'); px(c, x - 2, y - 2 + b, '#ffffff');
  water(c, x, y + 2, 6, t);
};

/** Yolcu gemisinin güverte ışık dizisi (geminin üstüne katman) */
DRAW.lightString = (c, x, y, t, o = {}) => {
  const L = o.len || 150;
  for (let i = 0; i <= 18; i++) {
    const yy = y - L / 2 + (i / 18) * L, k = Math.sin(t * 4 + i) > -0.3;
    for (const s of [-1, 1]) { const xx = x + s * (o.w || 30); px(c, xx, yy, k ? '#fff2a0' : '#c8a040'); if (k) px(c, xx, yy - 1, 'rgba(255,240,170,0.5)'); }
  }
};

/** Yüzü çizilmiş hindistan cevizi (o.chair: küçük kaptan koltuğunda) */
DRAW.coconut = (c, x, y, t, o = {}) => {
  if (o.chair) { rect(c, x - 6, y - 2, 12, 3, '#8a5a2b'); vline(c, x - 6, y - 2, y + 4, '#5c3a1e'); vline(c, x + 5, y - 2, y + 4, '#5c3a1e'); rect(c, x - 6, y - 12, 12, 3, '#c8423b'); vline(c, x - 6, y - 12, y - 2, '#8a5a2b'); vline(c, x + 5, y - 12, y - 2, '#8a5a2b'); y -= 3; }
  sh(c, x, y + 3, 6, 2, 0.2);
  disc(c, x, y - 4, 6, '#6a4424'); disc(c, x - 1, y - 5, 5, '#8a5a32');
  for (let i = 0; i < 6; i++) px(c, x - 4 + i * 1.6, y - 8 + (i % 2), '#4a2e18');
  // çizilmiş yüz (kırmızı boya)
  px(c, x - 2, y - 5, '#c8423b'); px(c, x + 2, y - 5, '#c8423b'); line(c, x - 2, y - 2, x + 2, y - 2, '#c8423b'); px(c, x - 3, y - 3, '#c8423b'); px(c, x + 3, y - 3, '#c8423b');
  if (o.nod) { const n = Math.sin(t * 5) > 0 ? 1 : 0; px(c, x, y - 10 - n, '#ffe080'); }
};

/** Filikadaki kaplan ve yolcu (özgün çizim). o.eat: balığı yakalar, o.stand: ayağa kalkar */
DRAW.tigerBoat = (c, x, y, t, o = {}) => {
  const yy = R(y + Math.sin(t * 1.7) * 1.5);
  Za(c, x, y + 8, 30, t);
  boatHull(c, x, yy, 56, 16, 'up', '#c88a3a', '#8a5a22');
  rect(c, x - 12, yy - 6, 24, 3, '#e8d8a8');
  dS(c, npcSprite('castaway', 'down', 'sit', 0), x - 4, yy + 20);
  // kaplan: iri, oturan; gövde + çizgiler + beyaz göğüs + kuyruk
  const ty = yy - 12 - (o.stand ? 6 : 0);
  ellipse(c, x + 2, ty + 2, 15, 10, '#b8641a');
  ellipse(c, x + 2, ty, 14, 9, '#f0962e'); ellipse(c, x, ty - 2, 10, 6, '#f8aa48');
  for (let i = 0; i < 6; i++) { line(c, x - 9 + i * 4, ty - 8, x - 8 + i * 4, ty - 2, '#2a1a10'); line(c, x - 8 + i * 4, ty - 8, x - 7 + i * 4, ty - 3, '#3a2414'); }
  ellipse(c, x + 2, ty + 6, 7, 3, '#f8eedc');
  for (const s of [-1, 1]) { rect(c, x + 2 + s * 6 - 2, ty + 6, 4, 4, '#f0962e'); hline(c, x + 2 + s * 6 - 2, x + 2 + s * 6 + 1, ty + 10, '#f8eedc'); }
  // baş
  const hx = x + 2, hy = ty - 14;
  disc(c, hx, hy, 9, '#d8822a'); disc(c, hx, hy - 1, 8, '#f0962e');
  for (const s of [-1, 1]) { disc(c, hx + s * 6, hy - 8, 3, '#f0962e'); px(c, hx + s * 6, hy - 8, '#3a2414'); }
  ellipse(c, hx, hy + 3, 5, 3, '#f8eedc'); px(c, hx, hy + 1, '#3a2018'); px(c, hx - 1, hy + 1, '#3a2018');
  for (const s of [-1, 1]) { rect(c, hx + s * 4 - 1, hy - 3, 3, 2, '#f0e8a0'); px(c, hx + s * 4, hy - 3, '#1a1410'); line(c, hx + s * 2, hy - 7, hx + s * 3, hy - 5, '#2a1a10'); line(c, hx + s * 7, hy - 2, hx + s * 8, hy + 1, '#2a1a10'); }
  for (const s of [-1, 1]) { line(c, hx + s * 3, hy + 3, hx + s * 10, hy + 2, '#f8f4ec'); line(c, hx + s * 3, hy + 4, hx + s * 10, hy + 5, '#f8f4ec'); }
  const tw = Math.sin(t * 2) * 4; line(c, x + 15, ty + 3, R(x + 22 + tw), ty - 8, '#f0962e'); line(c, x + 16, ty + 3, R(x + 23 + tw), ty - 8, '#d8822a'); px(c, R(x + 22 + tw), ty - 9, '#2a1a10'); px(c, R(x + 23 + tw), ty - 10, '#2a1a10');
  if (o.eat) { const f = Math.min(1, o.eat); const fx = R(x + 44 - f * 42), fy = R(hy + 2 - Math.sin(f * 3.14) * 26); ellipse(c, fx, fy, 5, 2, '#a8c0cc'); hline(c, fx - 3, fx + 3, fy - 1, '#e8f4f8'); px(c, fx + 5, fy, '#e8f4f8'); }
  water(c, x, yy + 30, 20, t);
};

/** Küçük çizgili balıklar (o.n, o.gather 0..1: resif noktasında buluşma, o.tx/o.ty buluşma ofseti) */
DRAW.tinyFish = (c, x, y, t, o = {}) => {
  const n = o.n || 1, g = o.gather || 0;
  for (let i = 0; i < n; i++) {
    const big = i > 0;
    const ang = t * (2 + i) + i * 2.1;
    const fx = R(x + Math.sin(t * 4 + i) * (big ? 10 : 14) * (1 - g) + Math.cos(ang) * 6 * g + (o.tx || 0) * g);
    const fy = R(y + Math.cos(t * 3 + i) * 4 * (1 - g) + Math.sin(ang) * 3 * g + (o.ty || 0) * g);
    const L = big ? 7 : 5, H = big ? 4 : 3, dir = Math.cos(t * 4 + i) > 0 ? 1 : -1;
    ellipse(c, fx, fy + 3, L, 1, 'rgba(10,40,60,0.25)');
    ellipse(c, fx, fy, L, H, '#1a1410'); ellipse(c, fx, fy, L - 1, H - 1, '#f07a2a');
    for (const k of big ? [-3, 1, 4] : [-2, 2]) vline(c, fx + k * dir, fy - H + 1, fy + H - 1, '#ffffff');
    line(c, fx - dir * L, fy, fx - dir * (L + 3), fy - 2, '#e0662a'); line(c, fx - dir * L, fy, fx - dir * (L + 3), fy + 2, '#e0662a'); px(c, fx + dir * (L - 2), fy - 1, '#1a1410');
  }
};

/** Deniz dibindeki ananas biçimli ev (su altında, mavi örtülü). o.wave: penceredeki gölge el sallar, o.knock: kapı kabarcık */
DRAW.pineHouse = (c, x, y, t, o = {}) => {
  ellipse(c, x, y + 4, 30, 8, 'rgba(210,190,130,0.55)');
  // gövde
  for (let i = 0; i < 26; i++) { const w = R(10 * Math.sin((i / 26) * Math.PI) + 3); hline(c, x - w, x + w, y - i, i % 4 < 2 ? '#e8a838' : '#d8902a'); }
  for (let i = 3; i < 24; i += 4) for (let k = -8; k <= 8; k += 4) px(c, x + k + ((i / 4) % 2) * 2, y - i, '#a8661a');
  // yapraklar
  for (let k = -2; k <= 2; k++) { line(c, x, y - 26, x + k * 5, y - 38 + Math.abs(k) * 3 + R(Math.sin(t * 2 + k)), '#3a8a4a'); line(c, x + 1, y - 26, x + k * 5 + 1, y - 37 + Math.abs(k) * 3, '#5ab06a'); }
  // kapı + pencere (köşeli gölge)
  rect(c, x - 3, y - 7, 6, 7, '#5a7a8a'); rect(c, x - 2, y - 6, 4, 6, '#3a5a6a'); px(c, x + 1, y - 3, '#e0c040');
  disc(c, x + 4, y - 15, 3, '#5a7a8a'); disc(c, x + 4, y - 15, 2, '#c8e8f0');
  const w = o.wave ? R(Math.sin(t * 8) * 1.5) : 0; rect(c, x + 3, y - 16, 2, 2, '#e0c840'); px(c, x + 6 + w, y - 18, '#e0c840');
  if (o.knock) for (let i = 0; i < 6; i++) disc(c, x - 1 + (i % 2) * 3, y - 10 - ((t * 18 + i * 6) % 30), 1 + (i % 2), 'rgba(220,245,255,0.8)');
  if (o.smile) { const s = (t * 0.8) % 1; const sy = R(y - 32 - s * 24); for (let k = -4; k <= 4; k++) px(c, x + k, sy + R(Math.abs(k) * Math.abs(k) / 6), 'rgba(230,250,255,0.85)'); px(c, x - 3, sy - 4, 'rgba(230,250,255,0.85)'); px(c, x + 3, sy - 4, 'rgba(230,250,255,0.85)'); }
  // su örtüsü
  c.fillStyle = 'rgba(40,120,160,0.28)'; c.fillRect(x - 34, y - 44, 68, 52);
};

/** Kumsalda X işareti ve kazı çukuru (o.dug 0..1, o.chest: 'gold'|'boots'|null görünür) */
DRAW.xMark = (c, x, y, t, o = {}) => {
  const d = o.dug || 0;
  if (d > 0) { ellipse(c, x, y, R(8 + d * 4), R(3 + d * 2), '#a88a5a'); ellipse(c, x, y + 1, R(6 + d * 3), R(2 + d), '#7a5a32'); }
  for (let k = -5; k <= 5; k++) { px(c, x + k, y + R(k * 0.5) - 1, '#c8423b'); px(c, x + k, y - R(k * 0.5) - 1, '#c8423b'); px(c, x + k + 1, y + R(k * 0.5) - 1, '#a8322a'); }
  if (d > 0.3) for (let i = 0; i < 5; i++) px(c, x + 12 + i * 2, y - 2 - ((t * 20 + i * 5) % 6), '#d8c68c');
  if (o.chest === 'gold') { rect(c, x - 5, y - 8, 10, 7, '#7a4a24'); hline(c, x - 5, x + 4, y - 8, '#e0b040'); rect(c, x - 4, y - 11, 8, 3, '#f0c040'); px(c, x - 2, y - 12, '#fff6c0'); }
  if (o.chest === 'boots') { rect(c, x - 5, y - 8, 10, 7, '#7a4a24'); hline(c, x - 5, x + 4, y - 8, '#e0b040'); rect(c, x - 3, y - 14, 3, 6, '#3a2a1a'); rect(c, x - 3, y - 9, 5, 2, '#3a2a1a'); rect(c, x + 1, y - 13, 3, 5, '#4a3424'); rect(c, x + 1, y - 9, 5, 2, '#4a3424'); }
};

/** Eski çizmeler (fırlatılabilir küçük nesne) */
DRAW.oldBoots = (c, x, y) => { rect(c, x - 4, y - 7, 3, 6, '#3a2a1a'); rect(c, x - 4, y - 2, 5, 2, '#3a2a1a'); rect(c, x + 1, y - 6, 3, 5, '#4a3424'); rect(c, x + 1, y - 2, 5, 2, '#4a3424'); };

/** Gözlü balık kasası (o.eyes 0..1 göz sayısı, o.glyph: tahtada sembol, o.shake) */
DRAW.eyeCrate = (c, x, y, t, o = {}) => {
  const j = o.shake ? R(Math.sin(t * 30) * 1) : 0;
  sh(c, x, y + 2, 12, 3, 0.25);
  rect(c, x - 11 + j, y - 12, 22, 13, '#5a3a20'); for (let i = 0; i < 3; i++) hline(c, x - 11 + j, x + 10 + j, y - 11 + i * 4, '#7a5030');
  vline(c, x - 11 + j, y - 12, y, '#3a2410'); vline(c, x + 10 + j, y - 12, y, '#3a2410');
  // balık (açık kapak aralığından)
  ellipse(c, x + j, y - 13, 9, 3, '#6a7a7a'); px(c, x + 9 + j, y - 13, '#4a5a5a');
  const n = R((o.eyes || 0) * 9);
  for (let i = 0; i < n; i++) { const ex = x - 7 + R(hash2(i, 91) * 14) + j, ey = y - 14 + R(hash2(i, 92) * 3); px(c, ex, ey, '#e8f070'); if (Math.sin(t * 3 + i) > 0.6) px(c, ex, ey, '#3a3a20'); }
  if (o.glyph) { const g = 'rgba(200,240,220,0.9)'; line(c, x - 4, y - 8, x + 4, y - 3, g); line(c, x + 4, y - 8, x - 4, y - 3, g); disc(c, x, y - 5, 1, g); }
};

/** Su altında parlayan gözler (o.n, o.fade) */
DRAW.deepEyes = (c, x, y, t, o = {}) => {
  const a = o.fade ?? 1;
  for (let i = 0; i < (o.n || 16); i++) {
    const ex = R(x + (hash2(i, 71) - 0.5) * 120), ey = R(y + (hash2(i, 72) - 0.5) * 50);
    const k = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.3);
    if (k < 0.2) continue;
    px(c, ex, ey, `rgba(230,250,140,${a * k})`); px(c, ex + 2, ey, `rgba(230,250,140,${a * k})`);
  }
};

/** Bakır mekanik küre (o.open 0..1, o.glow, o.fish: içinden çıkan minik balık zıplar) */
DRAW.mechSphere = (c, x, y, t, o = {}) => {
  const op = o.open || 0;
  sh(c, x, y + 4, 6, 2, 0.2);
  disc(c, x, y - 3, 5, '#b8783a'); disc(c, x - 1, y - 4, 4, '#d8945a');
  hline(c, x - 5, x + 5, y - 3, '#4a6e8c'); rect(c, x - 1, y - 4, 3, 3, '#e8f0f4'); px(c, x, y - 3, '#4a6e8c');
  if (op > 0) { const lift = R(op * 6); ellipse(c, x, y - 7 - lift, 5, 2, '#d8945a'); hline(c, x - 5, x + 5, y - 7 - lift, '#4a6e8c'); }
  if (o.glow) { c.fillStyle = 'rgba(255,240,180,0.35)'; c.beginPath(); c.arc(x, y - 4, 9, 0, 6.283); c.fill(); }
  if (o.fish) { const h = Math.abs(Math.sin(t * 5)) * 10; ellipse(c, x, R(y - 10 - h), 2, 1, '#c8d8e0'); px(c, x + 2, R(y - 10 - h), '#e8f4f8'); }
};

/** Dalgıcın yemek tezgâhlı teknesi (o.lit: fenerler, o.cook: tencere buharı, o.dishes) */
DRAW.stallBoat = (c, x, y, t, o = {}) => {
  const yy = R(y + Math.sin(t * 1.6));
  Za(c, x, y + 6, 26, t);
  ellipse(c, x, yy + 3, 30, 11, '#5c3a1e'); ellipse(c, x, yy + 1, 28, 9, '#8a5a2b'); ellipse(c, x, yy, 25, 7, '#c8a070');
  rect(c, x - 16, yy - 9, 32, 7, '#7a4a24'); hline(c, x - 16, x + 15, yy - 9, '#a87a4a'); rect(c, x - 15, yy - 6, 30, 3, '#e8dcc0');
  for (const s of [-1, 1]) { vline(c, x + s * 16, yy - 26, yy - 9, '#3a2412'); }
  hline(c, x - 16, x + 15, yy - 26, '#3a2412');
  for (let i = 0; i < 5; i++) { const lx = x - 12 + i * 6, lit = o.lit && Math.sin(t * 3 + i) > -0.6; px(c, lx, yy - 24, '#3a2412'); disc(c, lx, yy - 22, 2, lit ? '#ffd060' : '#8a6a3a'); if (lit) { c.fillStyle = 'rgba(255,220,120,0.15)'; c.beginPath(); c.arc(lx, yy - 22, 6, 0, 6.283); c.fill(); } }
  rect(c, x - 4, yy - 13, 8, 4, '#2a2a30'); hline(c, x - 5, x + 4, yy - 13, '#5a5a62');
  if (o.cook) for (let i = 0; i < 4; i++) disc(c, x - 2 + i * 1.5, yy - 16 - ((t * 10 + i * 4) % 10), 2, 'rgba(240,240,240,0.5)');
  if (o.dishes) for (let i = 0; i < 3; i++) { ellipse(c, x - 10 + i * 10, yy - 7, 3, 1, '#f0ece0'); px(c, x - 10 + i * 10, yy - 8, '#e07a3a'); }
  water(c, x, yy + 12, 28, t);
};

/** Yerel yağmur katmanı (o.w, o.h): yalnız sahne bölgesinde */
DRAW.rainPatch = (c, x, y, t, o = {}) => {
  const w = o.w || 200, h = o.h || 140;
  c.fillStyle = 'rgba(70,90,115,0.22)'; c.fillRect(x - w / 2, y - h / 2, w, h);
  for (let i = 0; i < 140; i++) {
    const rx = x - w / 2 + hash2(i, 31) * w, ry = y - h / 2 + ((hash2(i, 32) * h + t * 140) % h);
    line(c, R(rx), R(ry), R(rx - 2), R(ry + 6), 'rgba(215,235,248,0.75)');
  }
  for (let i = 0; i < 8; i++) { const rx = x - w / 2 + hash2(i, 33) * w, ry = y - h / 2 + hash2(i, 34) * h, k = (t * 2 + i * 0.3) % 1; ellipse(c, R(rx), R(ry), R(1 + k * 4), R(1 + k * 1.5), `rgba(220,240,250,${0.5 - k * 0.5})`); }
};

/** İskele ucu (kıyıdan denize uzanan kalaslar) + balıkçı (o.fisher, o.bite: olta gerilir) */
DRAW.pierEnd = (c, x, y, t, o = {}) => {
  for (let i = 0; i < 4; i++) { vline(c, x - 14, y - 2 + i * 9, y + 6 + i * 9, '#3a2412'); vline(c, x + 13, y - 2 + i * 9, y + 6 + i * 9, '#3a2412'); }
  for (let i = 0; i < 40; i += 3) { hline(c, x - 15, x + 14, y - 30 + i, i % 6 ? '#8a6a44' : '#7a5a38'); }
  hline(c, x - 15, x + 14, y + 10, '#5a3a20'); water(c, x, y + 12, 16, t);
  if (o.fisher !== false) {
    dS(c, npcSprite(o.npc || 'rainFisher', 'down', 'sit', 0), x - 4, y + 2);
    const tip = { x: x + 18, y: y - 22 }, bend = o.bite ? R(Math.sin(t * 12) * 2) + 6 : 0;
    line(c, x - 1, y - 6, tip.x, tip.y + bend, '#5a3a20'); line(c, tip.x, tip.y + bend, tip.x + 6, y + 18, 'rgba(230,230,230,0.7)');
    disc(c, tip.x + 6, y + 18 + (o.bite ? R(Math.sin(t * 9) * 2) : 0), 1, '#c8423b');
  }
};

/** Suyun üstüne sıçrayan iri balık (o.big, o.k 0..1 sıçrama evresi) */
DRAW.jumpFish = (c, x, y, t, o = {}) => {
  const k = o.k ?? ((t * 0.7) % 1), h = Math.sin(k * Math.PI) * (o.big ? 34 : 16);
  const L = o.big ? 9 : 4, fy = R(y - h);
  ellipse(c, x, y, R(4 + k * 6), 2, 'rgba(230,248,252,0.6)');
  ellipse(c, x, fy, L, o.big ? 3 : 1, o.big ? '#7a9ab0' : '#c8d8e0'); hline(c, x - L + 2, x + L - 2, fy - (o.big ? 2 : 1), o.big ? '#a8c8d8' : '#e8f4f8');
  px(c, x + L - 2, fy - 1, '#1a1410'); line(c, x - L, fy, x - L - 3, fy - 3, o.big ? '#5a7a90' : '#a8b8c0'); line(c, x - L, fy, x - L - 3, fy + 2, o.big ? '#5a7a90' : '#a8b8c0');
  if (o.big && k > 0.85) for (let i = 0; i < 6; i++) px(c, x - 8 + i * 3, y - 3 - i % 3, '#e8f6fb');
};

/** Pelerinli siluet (direk tepesinde / atlarken). o.cape: pelerin açılır */
DRAW.cloakFigure = (c, x, y, t, o = {}) => {
  const k = '#0e0e14', cp = o.cape ? 9 : 4, fl = R(Math.sin(t * 6) * 1);
  for (let i = 0; i < 12; i++) hline(c, x - R(cp * i / 12) - 1, x + R(cp * i / 12) + fl, y - 12 + i, k);
  rect(c, x - 2, y - 17, 5, 5, k); px(c, x - 2, y - 18, k); px(c, x + 2, y - 18, k);
  px(c, x - 1, y - 15, '#e8e0c8'); px(c, x + 1, y - 15, '#e8e0c8');
  vline(c, x - 1, y, y + 3, k); vline(c, x + 1, y, y + 3, k);
};

/** Siyah tüy */
DRAW.feather = (c, x, y, t) => { const s = R(Math.sin(t * 2) * 2); line(c, x - 4 + s, y + 3, x + 4 + s, y - 3, '#1a1a22'); for (let i = 0; i < 4; i++) px(c, x - 2 + i * 2 + s, y + 1 - i, '#3a3a48'); };

/** Beyaz baykuş (o.fly: kanat çırpar, o.letter: gagada mühürlü mektup) */
DRAW.owl = (c, x, y, t, o = {}) => {
  const f = o.fly ? Math.sin(t * 14) : 0;
  if (!o.fly) sh(c, x, y + 2, 5, 2, 0.2);
  ellipse(c, x, y - 6, 5, 6, '#f4f2ec'); ellipse(c, x, y - 4, 4, 4, '#e4e0d4');
  for (let i = 0; i < 4; i++) px(c, x - 2 + i, y - 3 + (i % 2), '#b8b4a8');
  disc(c, x - 2, y - 9, 2, '#ffffff'); disc(c, x + 2, y - 9, 2, '#ffffff'); px(c, x - 2, y - 9, '#e0a020'); px(c, x + 2, y - 9, '#e0a020'); px(c, x, y - 7, '#c8a040');
  const wy = R(f * 4);
  for (const s of [-1, 1]) { line(c, x + s * 4, y - 7, x + s * 10, y - 6 - wy, '#e8e4dc'); line(c, x + s * 4, y - 5, x + s * 9, y - 3 - wy, '#d8d4c8'); }
  if (!o.fly) { px(c, x - 2, y, '#c8a040'); px(c, x + 2, y, '#c8a040'); }
  if (o.letter) { rect(c, x - 3, y - 6, 7, 5, '#f0e6cc'); line(c, x - 3, y - 6, x, y - 3, '#c8b890'); line(c, x + 3, y - 6, x, y - 3, '#c8b890'); disc(c, x, y - 3, 1, '#8a2a3a'); }
};

/** Parıltılı tüy yağmuru */
DRAW.sparkFeathers = (c, x, y, t) => { for (let i = 0; i < 6; i++) { const fx = x + Math.sin(t + i * 1.7) * 12, fy = y + ((t * 12 + i * 9) % 30); px(c, R(fx), R(fy), '#ffffff'); if (Math.sin(t * 6 + i) > 0.5) px(c, R(fx) + 1, R(fy) - 1, '#fff6c0'); } };

/** Sevimli iri fok (o.sneeze: hapşırık püskürmesi, o.wave) */
DRAW.seal = (c, x, y, t, o = {}) => {
  sh(c, x, y + 4, 16, 4, 0.25);
  const b = R(Math.sin(t * 1.4) * 1);
  ellipse(c, x, y - 4 + b, 14, 7, '#6a7480'); ellipse(c, x - 1, y - 5 + b, 12, 5, '#8a94a0'); ellipse(c, x, y - 1 + b, 10, 3, '#a8b0b8');
  disc(c, x + 11, y - 9 + b, 6, '#7a8490'); disc(c, x + 12, y - 10 + b, 5, '#8a94a0');
  px(c, x + 10, y - 11 + b, '#1a1a20'); px(c, x + 14, y - 11 + b, '#1a1a20'); px(c, x + 12, y - 8 + b, '#2a2a30');
  for (const s of [-1, 1]) line(c, x + 12, y - 8 + b, x + 12 + s * 6, y - 9 + b, '#d8dce0');
  line(c, x - 12, y - 2 + b, x - 17, y + 1 + b, '#5a6470'); line(c, x - 12, y - 2 + b, x - 17, y - 5 + b, '#5a6470');
  if (o.sneeze) { const k = (t * 1.6) % 1; for (let i = 0; i < 8; i++) px(c, R(x + 17 + k * 12 + i), R(y - 9 + b + (i - 4) * k * 1.5), `rgba(230,248,252,${1 - k})`); }
};

/** Eski deniz haritası (masada, büyük). o.marks: işaretler, o.glow: işaret ışıması, o.ship: minyatür gemi */
DRAW.oldMap = (c, x, y, t, o = {}) => {
  sh(c, x, y + 3, 20, 3, 0.2);
  rect(c, x - 20, y - 14, 40, 16, '#c8a870'); rect(c, x - 19, y - 13, 38, 14, '#e8d8a8');
  for (let i = 0; i < 30; i++) px(c, x - 18 + hash2(i, 51) * 36, y - 12 + hash2(i, 52) * 12, '#d8c088');
  // kıyı çizgileri (özgün yorum)
  let px0 = x - 17, py0 = y - 9;
  for (let i = 0; i < 12; i++) { const nx = px0 + 2.5, ny = y - 9 + Math.sin(i * 0.9) * 3 + (i > 6 ? 3 : 0); line(c, R(px0), R(py0), R(nx), R(ny), '#7a5a32'); px0 = nx; py0 = ny; }
  ellipse(c, x + 10, y - 4, 4, 2, '#a88a52'); ellipse(c, x + 10, y - 4, 3, 1, '#d8c088');
  // pusula gülü
  px(c, x - 12, y - 3, '#8a2a26'); line(c, x - 12, y - 6, x - 12, y, '#5a3a20'); line(c, x - 15, y - 3, x - 9, y - 3, '#5a3a20');
  if (o.ship) { rect(c, x + 2, y - 8, 3, 1, '#3a2412'); vline(c, x + 3, y - 11, y - 8, '#3a2412'); px(c, x + 4, y - 10, '#f0e6cc'); }
  if (o.marks) { const g = o.glow ? `rgba(200,60,40,${0.6 + 0.4 * Math.sin(t * 4)})` : '#a8322a'; px(c, x + 13, y - 9, g); px(c, x + 12, y - 10, g); px(c, x + 14, y - 8, g); px(c, x + 12, y - 8, g); px(c, x + 14, y - 10, g); }
};

/** Üç fener ve aralarındaki ışık üçgeni (o.r yarıçap, o.tri 0..1 ışık) */
DRAW.triBeacons = (c, x, y, t, o = {}) => {
  const r = o.r || 120, a = o.tri ?? 1;
  const P = [0, 1, 2].map((i) => ({ x: R(x + Math.cos(-1.57 + i * 2.094) * r), y: R(y + Math.sin(-1.57 + i * 2.094) * r * 0.5) }));
  if (a > 0) for (let i = 0; i < 3; i++) { const p = P[i], q = P[(i + 1) % 3]; line(c, p.x, p.y - 12, q.x, q.y - 12, `rgba(180,230,255,${0.6 * a})`); line(c, p.x, p.y - 11, q.x, q.y - 11, `rgba(120,200,255,${0.35 * a})`); }
  for (const p of P) {
    sh(c, p.x, p.y + 2, 8, 3, 0.3); rock(c, p.x, p.y + 2, 7, '#5a5a62'); rect(c, p.x - 3, p.y - 16, 6, 17, '#e8e4d8'); vline(c, p.x + 2, p.y - 16, p.y, '#a8a49a'); hline(c, p.x - 2, p.x + 1, p.y - 8, '#c8423b'); hline(c, p.x - 2, p.x + 1, p.y - 4, '#c8423b');
    const k = 0.6 + 0.4 * Math.sin(t * 3); disc(c, p.x, p.y - 14, 2, `rgba(255,250,210,${k})`); c.fillStyle = `rgba(200,240,255,${0.15 * k})`; c.beginPath(); c.arc(p.x, p.y - 14, 8, 0, 6.283); c.fill();
    water(c, p.x, p.y + 1, 4, t);
  }
};

/** Büyük pusula (güvertede; iğne o.spin ile döner, o.still: sabit) */
DRAW.compassBig = (c, x, y, t, o = {}) => {
  sh(c, x, y + 3, 8, 2, 0.2);
  disc(c, x, y - 4, 7, '#8a5a2b'); disc(c, x, y - 4, 6, '#e8dcc0');
  for (let i = 0; i < 4; i++) { const a = i * 1.571; px(c, R(x + Math.cos(a) * 5), R(y - 4 + Math.sin(a) * 5), '#5a3a20'); }
  const a = o.still ? -1.57 : t * (o.spin || 8);
  line(c, x, y - 4, R(x + Math.cos(a) * 5), R(y - 4 + Math.sin(a) * 5), '#c8423b'); line(c, x, y - 4, R(x - Math.cos(a) * 4), R(y - 4 - Math.sin(a) * 4), '#3a3a44');
};

/** Geminin ters (yansıma) silueti: suya düşen hayalet iz */
DRAW.shipGhost = (c, x, y, t, o = {}) => {
  const L = o.len || 140, W = o.beam || 50, a = o.a ?? 0.25;
  c.fillStyle = `rgba(20,30,50,${a})`;
  c.beginPath(); c.ellipse(x, y, W / 2, L / 2, 0, 0, 6.283); c.fill();
  for (let i = 0; i < 10; i++) px(c, R(x + Math.sin(t * 2 + i) * W * 0.3), R(y - L / 2 + i * L / 10), `rgba(180,220,255,${a})`);
};

/** Dört tahtalık sal ve üstündeki imkânsız katlar (o.floors 0..3, o.hammer) */
DRAW.raftTower = (c, x, y, t, o = {}) => {
  const yy = R(y + Math.sin(t * 1.5) * 1.5), f = o.floors ?? 2;
  Za(c, x, y + 5, 16, t);
  for (let i = 0; i < 4; i++) rect(c, x - 8 + i * 4, yy - 5, 4, 11, i % 2 ? '#8a5a2b' : '#7a4a24'), vline(c, x - 8 + i * 4, yy - 5, yy + 5, '#a87a4a');
  hline(c, x - 8, x + 7, yy + 6, '#3a2412');
  // zemin kat: bahçe + ocak + su toplayıcı
  if (f >= 1) { rect(c, x - 7, yy - 8, 5, 3, '#5a3a20'); px(c, x - 6, yy - 10, '#5ab06a'); px(c, x - 4, yy - 11, '#3a8a4a'); px(c, x - 5, yy - 9, '#5ab06a');
    rect(c, x + 2, yy - 9, 4, 4, '#3a3a40'); if (Math.sin(t * 5) > 0) px(c, x + 3, yy - 10, '#ffb040');
    vline(c, x + 7, yy - 18, yy - 5, '#5a3a20'); ellipse(c, x + 7, yy - 18, 3, 1, '#8ad8ff'); }
  for (let k = 1; k < f + 1 && k <= 3; k++) {
    const by = yy - 8 - k * 12;
    for (const s of [-1, 1]) vline(c, x + s * 7, by, by + 12, '#5c3a1e');
    rect(c, x - 9, by - 2, 18, 3, '#8a5a2b'); hline(c, x - 9, x + 8, by - 2, '#a87a4a');
    if (k === 1) { rect(c, x - 5, by - 7, 6, 5, '#c8a070'); px(c, x - 3, by - 5, '#5a8ab0'); }
    if (k === 2) { line(c, x - 6, by - 2, x, by - 9, '#c8423b'); line(c, x, by - 9, x + 6, by - 2, '#c8423b'); }
    if (k === 3) { vline(c, x, by - 12, by - 2, '#5c3a1e'); rect(c, x + 1, by - 12, 5, 3, '#f2c14e'); }
  }
  if (o.hammer && Math.sin(t * 10) > 0) for (let i = 0; i < 3; i++) px(c, x - 8 + i * 3, yy - 8 - f * 12 - 4, '#ffe080');
  water(c, x, yy + 8, 10, t);
};

/** Dev yumurta yuvası: yumurta, üç parmaklı izler, sallanan ağaçlar, dev gölge, yavru.
 *  o.crack 0..1, o.hatch: yavru çıktı, o.shadow 0..1, o.shake: ağaçlar, o.walk 0..1 yavru yürüyüşü */
DRAW.eggNest = (c, x, y, t, o = {}) => {
  // ada zemini
  ellipse(c, x, y + 6, 70, 22, 'rgba(130,215,220,0.35)'); ellipse(c, x, y + 4, 64, 19, '#d8c68c'); ellipse(c, x, y + 2, 56, 15, '#5a8a4a'); ellipse(c, x + 4, y + 1, 46, 12, '#6a9a52');
  // ağaçlar (arkada)
  for (let i = 0; i < 4; i++) palm(c, R(x - 40 + i * 24 + (o.shake ? Math.sin(t * 20 + i) * 2 : 0)), R(y - 6 - (i % 2) * 3), t + i, 1.5);
  // ayak izleri
  for (let i = 0; i < 3; i++) { const fx = x + 22 + i * 11, fy = y + 6 + (i % 2) * 4; for (const a of [-0.6, 0, 0.6]) line(c, fx, fy, R(fx + Math.sin(a) * 5), R(fy - Math.cos(a) * 4), '#3a5a2a'); disc(c, fx, fy + 1, 1, '#3a5a2a'); }
  // dev gölge
  if (o.shadow) { c.fillStyle = `rgba(10,20,10,${0.35 * o.shadow})`; c.beginPath(); c.ellipse(x - 10, y - 2, 40 * o.shadow, 12 * o.shadow, 0, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(x - 52, y - 8, 10 * o.shadow, 6 * o.shadow, 0, 0, 6.283); c.fill(); }
  // yuva + yumurta
  ellipse(c, x - 6, y + 2, 14, 5, '#8a6a3a'); ellipse(c, x - 6, y + 1, 11, 3, '#a8884a');
  if (!o.hatch) {
    ellipse(c, x - 6, y - 8, 8, 11, '#e8e0c8'); ellipse(c, x - 8, y - 11, 4, 5, '#f8f4e8');
    for (let i = 0; i < 6; i++) px(c, x - 10 + hash2(i, 61) * 8, y - 14 + hash2(i, 62) * 12, '#9aa8a0');
    if (o.crack) { const k = o.crack; line(c, x - 12, y - 8, R(x - 12 + 12 * k), y - 6, '#3a3020'); line(c, R(x - 8), y - 7, R(x - 6), y - 10, '#3a3020'); }
  } else {
    ellipse(c, x - 6, y - 2, 8, 4, '#e8e0c8'); px(c, x - 12, y - 5, '#f8f4e8'); px(c, x, y - 5, '#f8f4e8');
    const w = o.walk || 0, hx = R(x - 6 - w * 50), hy = R(y - 6 - w * 6);
    ellipse(c, hx, hy, 4, 3, '#7ab06a'); disc(c, hx - 4, hy - 3, 2, '#8ac07a'); px(c, hx - 5, hy - 4, '#1a1410'); line(c, hx + 3, hy, hx + 7, hy - 1, '#7ab06a');
    px(c, hx - 1, hy + 3, '#5a8a4a'); px(c, hx + 2, hy + 3, '#5a8a4a');
  }
  if (o.tail) { const k = o.tail; c.fillStyle = '#4a6a3a'; c.beginPath(); c.moveTo(x - 70, y - 4); c.quadraticCurveTo(x - 40, y - 20 + k * 6, x - 20 + k * 30, y + 6); c.lineTo(x - 26 + k * 30, y + 10); c.quadraticCurveTo(x - 44, y - 12, x - 70, y + 4); c.fill(); }
  for (let q = 0; q < 6.28; q += 0.16) if (Math.sin(q * 5 + t * 1.5) > 0.2) px(c, x + Math.cos(q) * 68, y + 6 + Math.sin(q) * 21, 'rgba(245,252,255,0.9)');
};

/** Metal kapaklı tropik ada (o.open 0..1 menteşe, o.lights: söndü/yandı, o.down: merdiven inişi) */
DRAW.hatchIsle = (c, x, y, t, o = {}) => {
  ellipse(c, x, y + 6, 56, 20, 'rgba(130,215,220,0.35)'); ellipse(c, x, y + 4, 50, 17, '#d8c68c'); ellipse(c, x, y + 2, 42, 13, '#4f8a44'); ellipse(c, x + 3, y + 1, 34, 10, '#5e9a52');
  palm(c, R(x - 30), R(y - 2), t, 1.4); palm(c, R(x + 28), R(y - 1), t + 1, 1.2); palm(c, R(x - 14), R(y - 6), t + 2, 1.1);
  // lambalar (direkler)
  for (const s of [-1, 1]) { vline(c, x + s * 20, y - 14, y, '#3a3a40'); disc(c, x + s * 20, y - 15, 2, o.lights === false ? '#3a3a3a' : '#fff0a0'); }
  // kapak çerçevesi
  rect(c, x - 9, y - 4, 18, 8, '#5a5a62'); rect(c, x - 7, y - 3, 14, 6, o.open ? '#141418' : '#7a7a84');
  if (o.open) { const a = o.open; const hy = R(y - 4 - a * 12); rect(c, x - 7, hy, 14, 3, '#8a8a94'); hline(c, x - 7, x + 6, hy, '#b8b8c0'); line(c, x - 7, y - 4, x - 7, hy, '#5a5a62'); for (let i = 0; i < 3; i++) hline(c, x - 4, x + 3, y - 1 + i * 2, '#5a4a3a'); }
  else { for (let i = 0; i < 3; i++) hline(c, x - 6, x + 5, y - 2 + i * 2, '#5a5a62'); disc(c, x, y, 1, '#c8a040'); }
  water(c, x, y + 8, 40, t);
};

/** Kapağın altındaki oda (ara sahne kartı; ekranın ortasında, oyun stilinde). o.count: kalan saniye, o.dark: ışık kesildi, o.marks */
DRAW.hatchRoom = (c, x, y, t, o = {}) => {
  const W = 150, H = 86;
  rect(c, x - W / 2 - 3, y - H / 2 - 3, W + 6, H + 6, '#1a1410');
  rect(c, x - W / 2, y - H / 2, W, H, o.dark ? '#0c0c10' : '#3a4038');
  if (!o.dark) {
    for (let i = 0; i < 6; i++) hline(c, x - W / 2, x + W / 2 - 1, y - H / 2 + 8 + i * 13, '#30362e');
    rect(c, x - W / 2, y + H / 2 - 14, W, 14, '#4a4232');
    // merdiven
    for (let i = 0; i < 6; i++) hline(c, x + 44, x + 60, y - H / 2 + 6 + i * 11, '#8a8a94'); vline(c, x + 44, y - H / 2, y + H / 2 - 14, '#6a6a72'); vline(c, x + 60, y - H / 2, y + H / 2 - 14, '#6a6a72');
    // sayaç paneli
    rect(c, x - 36, y - 28, 52, 26, '#2a2a2e'); rect(c, x - 34, y - 26, 48, 14, '#141410');
    const s = String(Math.max(0, o.count ?? 108)).padStart(3, '0');
    for (let i = 0; i < 3; i++) { const dx = x - 30 + i * 15; rect(c, dx, y - 24, 11, 10, '#e8e0c8'); const d = Number(s[i]);
      // basit 7 parça
      const seg = [[1, 1, 1, 0, 1, 1, 1], [0, 0, 1, 0, 0, 1, 0], [1, 0, 1, 1, 1, 0, 1], [1, 0, 1, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1, 0], [1, 1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 1], [1, 0, 1, 0, 0, 1, 0], [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1]][d];
      const col = '#1a1410';
      if (seg[0]) hline(c, dx + 2, dx + 8, y - 23, col); if (seg[1]) vline(c, dx + 2, y - 23, y - 20, col); if (seg[2]) vline(c, dx + 8, y - 23, y - 20, col);
      if (seg[3]) hline(c, dx + 2, dx + 8, y - 19, col); if (seg[4]) vline(c, dx + 2, y - 19, y - 16, col); if (seg[5]) vline(c, dx + 8, y - 19, y - 16, col); if (seg[6]) hline(c, dx + 2, dx + 8, y - 16, col); }
    rect(c, x - 6, y - 10, 12, 5, '#8a2a26'); hline(c, x - 6, x + 5, y - 10, '#c8423b');
    if (o.marks) for (let i = 0; i < 6; i++) { const mx = x - 66 + (i % 3) * 9, my = y - 30 + Math.floor(i / 3) * 16; const g = 'rgba(220,220,190,0.85)'; line(c, mx, my, mx + 5, my + 6, g); hline(c, mx, mx + 6, my + 3, g); }
  } else { for (let i = 0; i < 3; i++) px(c, x - 30 + i * 15, y - 20, 'rgba(255,80,60,0.6)'); }
};

/** Kar taneleri (sıcak denizde eriyerek düşer). o.w, o.h */
DRAW.snowFall = (c, x, y, t, o = {}) => {
  const w = o.w || 90, h = o.h || 110;
  for (let i = 0; i < 26; i++) { const sx = x - w / 2 + hash2(i, 41) * w + Math.sin(t + i) * 3, k = (hash2(i, 42) + t * 0.25) % 1, sy = y - h / 2 + k * h; px(c, R(sx), R(sy), `rgba(255,255,255,${1 - k})`); if (k < 0.5) px(c, R(sx) + 1, R(sy), 'rgba(230,240,255,0.5)'); }
};

/** Termometre (güvertede) — sıcaklık sütunu yüksek */
DRAW.thermo = (c, x, y, t, o = {}) => { rect(c, x - 2, y - 16, 4, 14, '#e8e8f0'); vline(c, x, y - 4 - R((o.level ?? 0.9) * 10), y - 3, '#c8423b'); disc(c, x, y - 2, 3, '#c8423b'); px(c, x + 3, y - 14, '#5a5a62'); px(c, x + 3, y - 10, '#5a5a62'); };

/** Buhar bulutu (sıcak yemek / soğukta nefes) */
DRAW.steam = (c, x, y, t, o = {}) => { for (let i = 0; i < (o.n || 5); i++) { const k = (t * 0.6 + i * 0.2) % 1; disc(c, R(x + Math.sin(t * 2 + i) * 4), R(y - k * 20), R(2 + k * 3), `rgba(240,240,245,${0.55 * (1 - k)})`); } };

/** Ozan teknesi: yaşlı ozan kopuzla (o.play: tel titreşimi) */
DRAW.bardBoat = (c, x, y, t, o = {}) => {
  const yy = R(y + Math.sin(t * 1.6));
  Za(c, x, y + 6, 18, t); boatHull(c, x, yy, 32, 9, 'up', '#a8784a', '#6a4424');
  dS(c, npcSprite('bard', 'down', 'sit', 0), x, yy + 8);
  // kopuz: gövde + sap
  const kx = x + 5, ky = yy - 2;
  ellipse(c, kx, ky, 3, 4, '#8a5a2b'); ellipse(c, kx, ky, 2, 3, '#c89a62'); line(c, kx, ky - 3, kx + 7, ky - 12, '#5c3a1e'); rect(c, kx + 6, ky - 14, 3, 3, '#3a2412');
  if (o.play) { const v = R(Math.sin(t * 30)); line(c, kx, ky + 2, kx + 7 + v, ky - 12, 'rgba(255,240,200,0.8)'); for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; px(c, R(kx + 8 + k * 14), R(ky - 14 - k * 10 + Math.sin(k * 9) * 2), `rgba(255,230,150,${1 - k})`); } }
  water(c, x, yy + 18, 10, t);
};

/** Işıktan hatıra gemileri (ufukta birkaç saniye) */
DRAW.memoryShips = (c, x, y, t, o = {}) => {
  const a = o.a ?? 0.6;
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * 46, sy = y + (i % 2) * 8, k = a * (0.6 + 0.4 * Math.sin(t * 2 + i));
    const col = `rgba(255,230,160,${k})`;
    for (let r = 0; r < 6; r++) hline(c, sx - 12 + r, sx + 12 - r, sy + r, col);
    vline(c, sx, sy - 22, sy, col); for (let r = 0; r < 14; r++) hline(c, sx + 1, sx + 1 + R((14 - r) * 0.6), sy - 20 + r, `rgba(255,240,200,${k * 0.6})`);
  }
};

/** Rüzgâr çizgileri (o.rev: ters) */
DRAW.windStreaks = (c, x, y, t, o = {}) => {
  const d = o.rev ? -1 : 1;
  for (let i = 0; i < 10; i++) { const k = (t * 1.2 + hash2(i, 11)) % 1; const sx = x + d * (-80 + k * 160), sy = y - 40 + hash2(i, 12) * 80; line(c, R(sx), R(sy), R(sx - d * 12), R(sy), `rgba(255,255,255,${0.6 * Math.sin(k * 3.14)})`); }
};

/** Yüksek kıyı kayalığı (yanda) + tepedeki mucit (o.inventor: tepede bekliyor) */
DRAW.cliff = (c, x, y, t, o = {}) => {
  ellipse(c, x, y + 4, 40, 10, 'rgba(10,20,30,0.3)');
  for (let i = 0; i < 64; i++) { const w = R(30 - i * 0.25 + Math.sin(i * 0.7) * 3); hline(c, x - w, x + w, y - i, i % 7 === 0 ? '#5a5650' : i > 56 ? '#7a8a5a' : '#6e6a62'); px(c, x + w, y - i, '#4a4640'); px(c, x - w, y - i, '#8a867c'); }
  rock(c, R(x - 24), R(y + 2), 10, '#5a5a62'); rock(c, R(x + 22), R(y + 3), 9, '#62626c');
  for (let i = 0; i < 8; i++) px(c, x - 14 + i * 4, y - 63 + (i % 2), '#5a8a4a');
  if (o.inventor) dS(c, npcSprite('inventor', 'down', 'idle', 0), x - 4, y - 62);
  water(c, x, y + 4, 34, t);
};

/** Kanatlı süzülen mucit (havada; gölgesi suda). o.wings 0..1 açıklık, o.dip: suya değiyor */
DRAW.glider = (c, x, y, t, o = {}) => {
  const alt = o.alt ?? 40, w = R(16 * (o.wings ?? 1)), fl = R(Math.sin(t * 4) * 2);
  ellipse(c, x, y + 2, R(w * 0.8 + 4), 3, 'rgba(10,22,34,0.22)');
  const gy = y - alt;
  for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) line(c, x, gy - 2, x + s * w, gy - 6 + i * 2 + fl * s, i % 2 ? '#e8dcc0' : '#c8b890'); line(c, x, gy - 3, x + s * w, gy - 7 + fl * s, '#5c3a1e'); }
  dS(c, npcSprite('inventor', 'down', 'react', 0), x, gy + 10);
  if (o.dip) for (let i = 0; i < 6; i++) px(c, x - 8 + i * 3, y - 2 - (i % 3), '#e8f6fb');
};

void petSprite; void boatSeat; void shade;
