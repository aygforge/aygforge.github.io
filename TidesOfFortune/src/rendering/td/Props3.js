// Yaşayan Denizler (X1) sahne nesneleri. DRAW sözlüğüne eklenir: (ctx, x, y, t, opts).
import { rect, px, hline, vline, line, disc, ellipse, hash2 } from '../pixel.js';
import { DRAW } from './Props.js';
import { npcSprite, petSprite } from './TopChars.js';

const ring = (c, x, y, r, t, a = 0.6) => { for (let k = 0; k < 6.28; k += 0.45) px(c, x + Math.cos(k + t) * r, y + Math.sin(k + t) * r * 0.7, `rgba(230,245,250,${a})`); };

/** Dev yengeç: kabuk, bacaklar, açılıp kapanan kıskaçlar (o.dir: bakış yönü −1/1) */
DRAW.crab = (c, x, y, t, o = {}) => {
  const s = o.dir || -1;
  if (o.water) ring(c, x, y, 18, t);
  for (let i = 0; i < 4; i++) for (const side of [-1, 1]) {
    const lx = x + side * (9 + i), ly = y - 6 + i * 4 + Math.sin(t * 8 + i) * 1.2;
    line(c, x + side * 7, y - 4 + i * 3, lx + side * 5, ly, '#8a2a1e');
    px(c, lx + side * 6, ly + 1, '#5a1a12');
  }
  ellipse(c, x, y, 11, 9, '#5a1a12'); ellipse(c, x, y - 1, 10, 8, '#c8432a'); ellipse(c, x - 2, y - 3, 5, 3, '#e86a4a');
  for (const k of [-3, 3]) { px(c, x + k, y - 8, '#1a1a1a'); px(c, x + k, y - 9, '#f4f4f0'); }
  const open = Math.sin(t * 5) > 0 ? 2 : 0;
  for (const side of [-1, 1]) {
    const cx = x + side * 12, cy = y - 12 + (side === s ? -2 : 0);
    disc(c, cx, cy, 4, '#5a1a12'); disc(c, cx, cy, 3, '#d84a30');
    line(c, cx - 2, cy - 3, cx - 3, cy - 6 - open, '#d84a30'); line(c, cx + 2, cy - 3, cx + 3, cy - 6 - open, '#d84a30');
  }
};

/** Su yüzeyindeki dalgıç: baş, kollar, kabarcıklar */
DRAW.diver = (c, x, y, t) => {
  ring(c, x, y, 6, t, 0.7);
  disc(c, x, y, 3, '#1e2a32'); px(c, x - 1, y - 1, '#c8e0f0');
  const k = Math.sin(t * 6) * 3;
  line(c, x - 3, y, x - 7, y - 2 + k, '#1e2a32'); line(c, x + 3, y, x + 7, y - 2 - k, '#1e2a32');
  if (Math.sin(t * 3) > 0.4) px(c, x + 2, y - 5, '#e8f8ff');
};

/** Güverteye devrilmiş direk (gemiye bağlı nesne) */
DRAW.fallenMast = (c, x, y, t, o = {}) => {
  const L = o.len || 60;
  for (let k = -1; k <= 1; k++) line(c, x - L / 2, y + 8 + k, x + L / 2, y - 8 + k, k ? '#3a2412' : '#7a5030');
  for (let i = 0; i < 9; i++) hline(c, x + 4 + i * 2, x + 16 + i * 2, y - 2 + i, i % 2 ? '#d8ccb0' : '#c8b898');
  line(c, x - L / 2, y + 8, x - L / 2 - 6, y + 14, '#c8a070');
};

/** Pruvaya dolanmış dev ağ */
DRAW.bigNet = (c, x, y, t, o = {}) => DRAW.net(c, x, y, t, { r: o.r || 32, fish: o.fish ?? 10 });

/** Parlayan denizanası sürüsü */
DRAW.jellies = (c, x, y, t, o = {}) => {
  const w = o.w || 300, h = o.h || 260;
  for (let i = 0; i < (o.n || 40); i++) {
    const jx = x + (hash2(i, 201) - 0.5) * w + Math.sin(t * 0.7 + i) * 4, jy = y + (hash2(i, 202) - 0.5) * h + Math.cos(t * 0.5 + i) * 3;
    const col = i % 3 === 0 ? '#c87aff' : i % 3 === 1 ? '#5ab8ff' : '#7affd8';
    const pulse = 3 + Math.sin(t * 3 + i) * 1;
    disc(c, jx, jy, pulse + 4, `rgba(140,180,255,0.10)`);
    disc(c, jx, jy, pulse, col);
    for (let k = -1; k <= 1; k++) vline(c, jx + k * 2, jy + pulse, jy + pulse + 3 + ((t * 4 + i) % 2), 'rgba(200,220,255,0.6)');
  }
};

/** Müzayede teklif bayrağı (renkli, sallanan) */
DRAW.bidFlag = (c, x, y, t, o = {}) => {
  vline(c, x, y - 14, y, '#3a2412');
  const wv = Math.sin(t * 6) > 0 ? 1 : 0;
  rect(c, x + 1, y - 14, 8 + wv, 5, o.col || '#e0b040');
  px(c, x + 4, y - 12, '#ffffff');
};

/** Tenteli pazar teknesi */
DRAW.tentBoat = (c, x, y, t, o = {}) => {
  DRAW.rowboat(c, x, y, t, { npcs: [o.npc || 'merchant'], dir: o.dir || 'up', cargo: o.cargo });
  const col = o.col || '#c8423b';
  for (let i = 0; i < 4; i++) hline(c, x - 6, x + 5, y - 6 + i * 3, i % 2 ? col : '#f4ead5');
};

/** Yüzer tersane: büyük kalas platform, vinç, kızak ve ustalar */
DRAW.floatingYard = (c, x, y, t) => {
  ring(c, x, y, 50, t * 0.4, 0.4);
  rect(c, x - 44, y - 34, 88, 68, '#3a2412');
  for (let i = 0; i < 11; i++) rect(c, x - 43 + i * 8, y - 33, 7, 66, i % 2 ? '#8a5a2b' : '#7a4a24');
  for (let i = 0; i < 6; i++) line(c, x - 30 + i * 8, y - 20, x - 30 + i * 8, y + 20, '#c8a070');
  rect(c, x + 18, y - 30, 4, 30, '#5c3a1e'); line(c, x + 20, y - 30, x + 38, y - 18, '#5c3a1e'); line(c, x + 38, y - 18, x + 38, y - 4, '#c8a070');
  for (const [dx, dy, d] of [[-30, 22, 'right'], [8, -24, 'left'], [30, 18, 'up']]) c.drawImage(npcSprite('villager', d, Math.sin(t * 4 + dx) > 0 ? 'work' : 'idle', Math.floor(t * 3) % 4), Math.round(x + dx - 11), Math.round(y + dy - 11));
  if (Math.sin(t * 5) > 0.6) { px(c, x - 20, y + 4, '#fff0a0'); px(c, x - 19, y + 3, '#ffd060'); }
};

/** Su altı ormanı: dalgalanan parlayan dallar */
DRAW.kelpForest = (c, x, y, t, o = {}) => {
  const w = o.w || 260;
  c.globalAlpha = o.a ?? 0.55;
  for (let i = 0; i < 14; i++) {
    const bx = x - w / 2 + (i * w) / 14 + hash2(i, 211) * 10, by = y + (hash2(i, 212) - 0.5) * 120;
    let px0 = bx, py0 = by + 30;
    for (let s = 0; s < 10; s++) {
      const nx = px0 + Math.sin(t * 1.2 + i + s * 0.5) * 2, ny = py0 - 6;
      line(c, px0, py0, nx, ny, s % 3 === 0 ? '#5af0c0' : '#2f8a7a');
      if (s % 3 === 2) { px(c, nx - 2, ny, '#7affd8'); px(c, nx + 2, ny - 1, '#7affd8'); }
      px0 = nx; py0 = ny;
    }
  }
  c.globalAlpha = 1;
};

/** Gökten düşen meteor: parlak çekirdek + kuyruk (yalnızca düşüş anında) */
DRAW.meteor = (c, x, y, t, o = {}) => {
  for (let i = 0; i < 26; i++) { const k = i / 26; disc(c, x - i * 3, y - i * 2, Math.max(1, 4 - k * 4), i < 4 ? '#fff6c0' : `rgba(255,${180 - i * 4},90,${0.8 - k * 0.8})`); }
  disc(c, x, y, 5, '#fff0a0'); disc(c, x, y, 3, '#ffffff');
};

/** Suya düşmüş meteor parçaları: kaynayan su ve parlayan taşlar */
DRAW.meteorField = (c, x, y, t) => {
  ring(c, x, y, 22, t * 2, 0.8);
  for (let i = 0; i < 7; i++) { const mx = x + (hash2(i, 221) - 0.5) * 40, my = y + (hash2(i, 222) - 0.5) * 30; disc(c, mx, my, 2, Math.sin(t * 4 + i) > 0 ? '#ff9a40' : '#f2c14e'); if (Math.sin(t * 6 + i) > 0.7) px(c, mx, my - 4 - (t * 10 % 4), 'rgba(230,230,230,0.7)'); }
};

/** Suyun altındaki dev göz */
DRAW.seaEye = (c, x, y, t, o = {}) => {
  const open = o.open ?? 1;
  const blink = Math.sin(t * 0.7) > 0.97 ? 0.1 : 1;
  const ry = Math.max(1, 26 * open * blink);
  ellipse(c, x, y, 54, ry + 6, 'rgba(10,20,30,0.55)');
  ellipse(c, x, y, 48, ry, '#c8d8c0');
  if (ry > 6) {
    const lx = x + (o.lookX || 0) + Math.sin(t * 0.5) * 6;
    ellipse(c, lx, y, 20, Math.min(ry, 20), '#c89030');
    ellipse(c, lx, y, 18, Math.min(ry, 18), '#e0b040');
    ellipse(c, lx, y, 4, Math.min(ry, 17), '#0a0a0a');
    px(c, lx - 8, y - 8, '#ffffff'); px(c, lx - 7, y - 8, '#ffffff');
  }
  c.globalAlpha = 0.35; ellipse(c, x, y, 50, ry + 2, '#1f5a82'); c.globalAlpha = 1;
};

/** Ters akan akıntı: yukarı doğru akan köpük çizgileri */
DRAW.reverseCurrent = (c, x, y, t, o = {}) => {
  const W = o.W || 640;
  for (let i = 0; i < 40; i++) {
    const lx = (hash2(i, 231) * W) - W / 2 + x, ly = y + ((hash2(i, 232) * 300 - (t * 60) % 300) % 300) - 150;
    vline(c, lx, ly, ly + 8, 'rgba(230,245,255,0.7)'); px(c, lx, ly - 1, '#ffffff');
  }
};

/** Deniz tabanından gaz kabarcıkları */
DRAW.gasField = (c, x, y, t, o = {}) => {
  for (let i = 0; i < (o.n || 16); i++) {
    const bx = x + (hash2(i, 241) - 0.5) * (o.w || 200), by = y + (hash2(i, 242) - 0.5) * (o.h || 160);
    const ph = (t * 0.8 + hash2(i, 243)) % 1;
    const r = 2 + ph * 9;
    ring(c, bx, by, r, t, 1 - ph);
    if (ph > 0.8) for (let k = 0; k < 5; k++) px(c, bx + Math.cos(k) * r, by + Math.sin(k) * r * 0.7, '#ffffff');
  }
  if (o.flare) { disc(c, x, y, 30, 'rgba(255,140,40,0.35)'); disc(c, x, y, 16, 'rgba(255,220,120,0.6)'); }
};

/** Siyah yağmur (ekran katmanı) */
DRAW.blackRain = (c, x, y, t, o = {}) => {
  const W = o.W || 640, H = o.H || 360;
  for (let i = 0; i < 120; i++) {
    const rx = (hash2(i, 251) * W + t * 20) % W, ry = (hash2(i, 252) * H + t * 140 + i * 7) % H;
    rect(c, Math.round(rx), Math.round(ry), 1, 3, 'rgba(20,16,24,0.85)');
  }
};

/** Güverteye yapışan siyah lekeler (gemiye bağlı) */
DRAW.tarStains = (c, x, y, t) => { for (let i = 0; i < 12; i++) disc(c, x + (hash2(i, 261) - 0.5) * 40, y + (hash2(i, 262) - 0.5) * 80, 1 + (i % 3), 'rgba(16,12,20,0.75)'); };

/** Fener (deniz feneri) adası + dönen ışık */
DRAW.lighthouseIsle = (c, x, y, t, o = {}) => {
  DRAW.island(c, x, y, t, { r: o.r || 46, palms: 1, ground: '#6a6a62' });
  disc(c, x + 6, y - 6, 7, '#e8e4dc'); disc(c, x + 6, y - 6, 5, '#c8423b'); disc(c, x + 6, y - 6, 3, '#e8e4dc');
  if (o.lit !== false) { disc(c, x + 6, y - 6, 2, '#fff0a0'); DRAW.lightBeam(c, x + 6, y - 6, t, { len: o.len || 180, speed: o.speed || 0.9 }); }
  else px(c, x + 6, y - 6, '#3a3a3a');
};

/** Atölye adası (Groot zinciri): kızakta yarım gemi iskeleti */
DRAW.workshopIsle = (c, x, y, t, o = {}) => {
  DRAW.island(c, x, y, t, { r: o.r || 60, palms: 3, shipyard: false, ground: '#5a7a48' });
  for (let i = 0; i < 9; i++) line(c, x - 18 + i * 4, y - 14 + Math.abs(i - 4), x - 18 + i * 4, y + 14 - Math.abs(i - 4), o.done ? '#a87a4a' : '#6a5030');
  line(c, x - 20, y, x + 18, y, '#5c3a1e');
  if (o.done) { for (let i = 0; i < 9; i++) vline(c, x - 18 + i * 4, y - 12 + Math.abs(i - 4), y + 12 - Math.abs(i - 4), '#c89a5a'); }
  rect(c, x + 22, y - 18, 10, 8, '#5c3a1e'); rect(c, x + 23, y - 17, 8, 6, '#8a5a2b');
};

export { DRAW };

// ───────── Hayvan olayları ─────────
/** Suda çırpınan hayvan: halkalar + baş */
DRAW.swimPet = (c, x, y, t, o = {}) => {
  for (let i = 0; i < 2; i++) { const r = 7 + ((t * 10 + i * 6) % 12); c.strokeStyle = `rgba(255,255,255,${0.5 - r / 30})`; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); }
  c.drawImage(petSprite(o.id || 'PET_TARCIN', 'up', Math.sin(t * 6) > 0 ? 'walk1' : 'walk3'), Math.round(x - 11), Math.round(y - 11 + Math.sin(t * 4)));
};
/** Mürekkep bulutu (güverte lekesi) */
DRAW.inkCloud = (c, x, y, t, o = {}) => {
  const r = o.r || 14;
  for (const [dx, dy, k] of [[0, 0, 1], [-r * 0.5, 3, 0.7], [r * 0.5, -2, 0.75], [2, r * 0.5, 0.6]]) disc(c, x + dx, y + dy, Math.round(r * k), 'rgba(30,14,46,0.75)');
};
/** Küçük fare (ambar) */
DRAW.mouse = (c, x, y, t) => {
  const dx = Math.round(Math.sin(t * 3) * 6);
  c.fillStyle = '#6a5a50'; c.fillRect(Math.round(x + dx - 2), Math.round(y - 1), 4, 3);
  c.fillStyle = '#c8a8a0'; c.fillRect(Math.round(x + dx + 2), Math.round(y), 1, 1); c.fillRect(Math.round(x + dx - 4), Math.round(y + 1), 2, 1);
};
/** Uçan martı (sahne nesnesi) */
DRAW.gull = (c, x, y, t) => c.drawImage(petSprite('PET_MARTI', 'up', Math.sin(t * 9) > 0 ? 'fly0' : 'fly1'), Math.round(x - 11), Math.round(y - 11));
/** Tabakta balık */
DRAW.fishPlate = (c, x, y) => { disc(c, x, y, 5, '#d8d0c0'); rect(c, x - 3, y - 1, 6, 2, '#7a9ab0'); px(c, x + 3, y - 1, '#5a7a90'); px(c, x + 3, y + 1, '#5a7a90'); };
