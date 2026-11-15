// TOP-DOWN karakter ve hayvan sprite'ları. Her sprite "yukarı bakan" kanonik çizimden
// tam 90° döndürmeyle 4 yöne üretilir (pixel kayıpsız). Görünüm verideki "look" parametrelerinden gelir.
import { makeCanvas, rect, px, disc, hline, vline } from '../pixel.js';
import { CREW_BY_ID } from '../../data/crew.js';

export const CS = 22; // kare boyutu
const cache = new Map();
const DIRS = { up: 0, right: 1, down: 2, left: 3 };

function shadeHex(hex, f) {
  const v = parseInt(hex.slice(1), 16);
  const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const k = (c) => Math.max(0, Math.min(255, Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f)));
  return `rgb(${k(r)},${k(g)},${k(b)})`;
}

/** 1px koyu dış çizgi: küçük ekranlarda okunabilirlik */
function outlined(src) {
  const c = makeCanvas(CS, CS);
  const ctx = c.getContext('2d');
  const d = src.getContext('2d').getImageData(0, 0, CS, CS).data;
  const a = (x, y) => (x < 0 || y < 0 || x >= CS || y >= CS ? 0 : d[(y * CS + x) * 4 + 3]);
  ctx.fillStyle = 'rgba(20,12,18,0.85)';
  for (let y = 0; y < CS; y++) for (let x = 0; x < CS; x++) {
    if (a(x, y) > 40) continue;
    if (a(x - 1, y) > 120 || a(x + 1, y) > 120 || a(x, y - 1) > 120 || a(x, y + 1) > 120) ctx.fillRect(x, y, 1, 1);
  }
  ctx.drawImage(src, 0, 0);
  return c;
}

function rotated(src0, dir) {
  const src = outlined(src0);
  const r = DIRS[dir] || 0;
  if (!r) return src;
  const c = makeCanvas(CS, CS);
  const ctx = c.getContext('2d');
  ctx.translate(CS / 2, CS / 2);
  ctx.rotate((r * Math.PI) / 2);
  ctx.drawImage(src, -CS / 2, -CS / 2);
  return c;
}

/** state: idle | walk | work | react | special | sit ; frame 0..3 */
export function crewSprite(id, dir = 'down', state = 'idle', frame = 0) {
  const key = `${id}|${dir}|${state}|${frame}`;
  if (cache.has(key)) return cache.get(key);
  const base = makeCanvas(CS, CS);
  const def = CREW_BY_ID[id];
  drawCrewUp(base.getContext('2d'), def.look, def.build || 'normal', def.idle, state, frame);
  const out = rotated(base, dir);
  cache.set(key, out);
  return out;
}

function drawCrewUp(ctx, L, build, idle, state, f) {
  const cx = 11, cy = 13;
  const wide = build === 'big' || build === 'round' ? 1 : 0;
  const walk = state === 'walk';
  const step = walk ? [0, 2, 0, -2][f] : 0;
  const work = state === 'work' || state === 'special';
  const sit = state === 'sit';
  // ayaklar (yürürken öne-arkaya)
  if (!sit) {
    rect(ctx, cx - 3, cy + 2 - step, 2, 3, '#2a1c14');
    rect(ctx, cx + 1, cy + 2 + step, 2, 3, '#2a1c14');
  } else {
    rect(ctx, cx - 4, cy - 5, 3, 3, L.pants);
    rect(ctx, cx + 1, cy - 5, 3, 3, L.pants);
  }
  // gövde/omuzlar
  const sw = 5 + wide;
  for (let y = -3; y <= 2; y++) {
    const w = y === -3 || y === 2 ? sw - 1 : sw;
    rect(ctx, cx - w, cy + y, w * 2, 1, y === 2 ? shadeHex(L.top, -0.25) : y === -3 ? shadeHex(L.top, 0.12) : L.top);
  }
  if (L.top2) { rect(ctx, cx - 1, cy - 2, 2, 4, L.top2); }
  // kollar
  const armSwing = walk ? [2, 0, -2, 0][f] : 0;
  const armY = cy - 2;
  if (work) {
    rect(ctx, cx - 4, armY - 4, 2, 4, L.top);
    rect(ctx, cx + 2, armY - 4, 2, 4, L.top);
    rect(ctx, cx - 4, armY - 5, 2, 1, L.skin);
    rect(ctx, cx + 2, armY - 5, 2, 1, L.skin);
  } else {
    rect(ctx, cx - sw - 2, armY - armSwing, 2, 4, shadeHex(L.top, -0.15));
    rect(ctx, cx + sw, armY + armSwing, 2, 4, shadeHex(L.top, -0.15));
    rect(ctx, cx - sw - 2, armY + 4 - armSwing, 2, 1, L.skin);
    rect(ctx, cx + sw, armY + 4 + armSwing, 2, 1, L.skin);
  }
  // kafa
  const hy = cy - 5;
  disc(ctx, cx, hy, 3, L.skin);
  rect(ctx, cx - 1, hy - 4, 2, 1, L.skin); // burun/yüz (bakış yönü)
  drawHeadTop(ctx, L, cx, hy);
  if (L.beard && L.beard !== 'none') {
    const bc = L.beardColor || L.hair;
    rect(ctx, cx - 2, hy - 3, 4, 1, bc);
    if (L.beard === 'long' || L.beard === 'braids' || L.beard === 'full') rect(ctx, cx - 1, hy - 5, 2, 2, bc);
  }
  if (work) drawProp(ctx, idle, f, cx, armY - 6, L);
  if (state === 'react') {
    rect(ctx, cx + 6, hy - 6, 2, 4, '#ffe040');
    rect(ctx, cx + 6, hy - 1, 2, 2, '#ffe040');
  }
}

function drawHeadTop(ctx, L, cx, hy) {
  const c = L.hatColor || '#444';
  const hair = L.hair;
  const d = shadeHex(c, -0.3);
  const ring = (r, col) => disc(ctx, cx, hy + 1, r, col);
  switch (L.hat) {
    case 'turban': ring(4, c); rect(ctx, cx - 2, hy, 4, 1, d); rect(ctx, cx - 1, hy + 2, 3, 1, d); if (L.hatGem) rect(ctx, cx - 1, hy - 3, 2, 2, '#2fa04a'); break;
    case 'tricorn': rect(ctx, cx - 5, hy - 1, 11, 4, c); rect(ctx, cx - 2, hy - 3, 5, 2, c); rect(ctx, cx - 5, hy + 3, 2, 1, c); rect(ctx, cx + 4, hy + 3, 2, 1, c); rect(ctx, cx - 1, hy, 2, 2, '#e8e0c0'); break;
    case 'bandana': ring(3, c); rect(ctx, cx - 1, hy + 4, 2, 2, c); px(ctx, cx + 1, hy + 6, c); break;
    case 'cap': ring(3, c); rect(ctx, cx - 2, hy - 4, 5, 2, d); break;
    case 'horned': ring(3, c); rect(ctx, cx - 1, hy - 2, 2, 6, d); for (const sx of [-1, 1]) { px(ctx, cx + sx * 4, hy, '#f0ead8'); px(ctx, cx + sx * 5, hy - 1, '#f0ead8'); px(ctx, cx + sx * 6, hy - 2, '#f0ead8'); } break;
    case 'straw': ring(5, c); ring(3, d); ring(2, c); break;
    case 'hood': case 'scarf': ring(4, c); rect(ctx, cx - 1, hy - 3, 3, 2, L.skin); ring(1, d); break;
    case 'crown': ring(3, hair); for (const [dx, dy] of [[-3, -1], [3, -1], [-3, 3], [3, 3], [0, -3], [0, 4]]) rect(ctx, cx + dx, hy + dy, 1, 1, c); rect(ctx, cx - 1, hy, 2, 2, '#c8423b'); break;
    case 'tiara': ring(3, hair); rect(ctx, cx - 2, hy - 2, 4, 1, c); rect(ctx, cx - 1, hy - 3, 2, 1, '#8ad0ff'); break;
    case 'feather': ring(3, c); for (let i = 0; i < 4; i++) px(ctx, cx + 2 + i, hy + 2 + i, '#f4f0e0'); break;
    case 'headwrap': ring(3, c); rect(ctx, cx - 1, hy + 4, 2, 2, d); break;
    case 'fez': ring(3, c); rect(ctx, cx, hy + 1, 2, 3, '#1a1a1a'); break;
    case 'chef': ring(4, c); ring(2, '#e4e4e4'); break;
    case 'beret': disc(ctx, cx + 1, hy + 1, 3, c); px(ctx, cx + 1, hy + 1, d); break;
    case 'sunhalo': ring(3, hair); for (let a = 0; a < 8; a++) px(ctx, cx + Math.round(Math.cos(a * 0.785) * 5), hy + 1 + Math.round(Math.sin(a * 0.785) * 5), c); break;
    default:
      if (L.hairStyle !== 'bald') ring(3, hair);
      else { ring(3, shadeHex(L.skin, -0.08)); px(ctx, cx - 1, hy, shadeHex(L.skin, 0.25)); }
  }
  if (['long', 'braid', 'ponytail'].includes(L.hairStyle) && !['hood', 'scarf'].includes(L.hat)) {
    rect(ctx, cx - 1, hy + 4, 2, L.hairStyle === 'long' ? 3 : 4, hair);
    if (L.hairStyle === 'long') rect(ctx, cx - 3, hy + 3, 6, 2, hair);
  }
  if (L.hairStyle === 'mohawk') rect(ctx, cx - 1, hy - 2, 2, 7, shadeHex(hair, 0.2));
  if (L.hairStyle === 'topknot') disc(ctx, cx, hy + 2, 1, shadeHex(hair, 0.15));
  if (L.hairStyle === 'bun') rect(ctx, cx - 1, hy + 4, 3, 2, hair);
  if (L.hairStyle === 'curly' && !L.hat?.match(/tricorn|crown/)) for (const [dx, dy] of [[-3, 0], [3, 0], [0, 4], [-2, 3], [2, 3]]) px(ctx, cx + dx, hy + 1 + dy, shadeHex(hair, 0.2));
}

function drawProp(ctx, idle, f, x, y, L) {
  const wood = '#6a4424';
  const steel = '#c0c6cf';
  switch (idle) {
    case 'hammer': { const up = f % 2 === 0; rect(ctx, x - 1, y - (up ? 3 : 1), 3, 2, steel); px(ctx, x, y + (up ? -1 : 1), wood); if (!up) px(ctx, x + 2, y - 2, '#fff0a0'); break; }
    case 'stir': disc(ctx, x, y - 1, 2, '#5d6470'); px(ctx, x + [1, 0, -1, 0][f], y - 1 + [0, 1, 0, -1][f], wood); if (f % 2) px(ctx, x - 1, y - 4, 'rgba(240,240,240,0.8)'); break;
    case 'map': rect(ctx, x - 3, y - 2, 6, 3, '#e8d8a8'); px(ctx, x - 1 + (f % 2), y - 1, '#c8423b'); break;
    case 'spyglass': rect(ctx, x, y - 3 - (f % 2), 1, 4, '#c8a040'); break;
    case 'bag': rect(ctx, x - 2, y - 2, 4, 3, '#2a2a2a'); px(ctx, x - (f % 2), y - 1, '#c8423b'); break;
    case 'sharpen': rect(ctx, x - 1, y - 3, 3, 2, steel); px(ctx, x, y - 1, wood); if (f % 2) px(ctx, x + 2, y - 4, '#fff0a0'); break;
    case 'spell': px(ctx, x - 2 + f, y - 3, '#c8a0ff'); px(ctx, x + 2 - f, y - 2, '#8b5bb5'); px(ctx, x, y - 4 + (f % 2), '#e8d0ff'); break;
    case 'beads': px(ctx, x - 1 + (f % 3), y - 1, '#c8423b'); px(ctx, x, y, '#f2c14e'); break;
    case 'lantern': disc(ctx, x, y - 1, 1, f % 2 ? '#fff0a0' : '#f2c14e'); break;
    case 'fish': rect(ctx, x, y - 6, 1, 6, wood); px(ctx, x, y - 7 - (f % 2), 'rgba(230,230,230,0.9)'); break;
    case 'bow': rect(ctx, x - 3, y - 2, 7, 1, wood); px(ctx, x, y - 3 - (f % 2), '#e8e0c8'); break;
    case 'guard': case 'spear': rect(ctx, x, y - 6, 1, 6, idle === 'spear' ? wood : steel); px(ctx, x, y - 7, steel); break;
    case 'twinblades': px(ctx, x - 2, y - 3 + (f % 2), steel); px(ctx, x + 2, y - 3 + ((f + 1) % 2), steel); px(ctx, x - 2, y - 2, steel); px(ctx, x + 2, y - 2, steel); break;
    case 'polish': disc(ctx, x, y - 1, 1, '#2a2a2e'); px(ctx, x + (f % 2), y - 2, '#e8e0c8'); break;
    case 'count': rect(ctx, x - 2, y - 2, 4, 3, wood); px(ctx, x - 1 + (f % 3), y - 1, '#e07b39'); break;
    case 'inspect': disc(ctx, x + (f % 2), y - 2, 1, 'rgba(160,220,255,0.9)'); break;
    case 'staff': rect(ctx, x, y - 6, 1, 6, wood); px(ctx, x, y - 7, f % 2 ? '#fff0a0' : '#e8b83a'); break;
    case 'scroll': rect(ctx, x - 2, y - 2, 4, 2, '#f0e6c8'); break;
    case 'swagger': px(ctx, x, y - 2 - (f % 2), '#3a7a3a'); break;
    case 'fan': px(ctx, x - 1, y - 2, '#e8c45a'); px(ctx, x, y - 3 + (f % 2), '#b8323e'); px(ctx, x + 1, y - 2, '#e8c45a'); break;
    case 'sunglow': if (f % 2) { px(ctx, x - 3, y - 3, '#ffe080'); px(ctx, x + 3, y - 3, '#ffe080'); } break;
    case 'pray': if (f % 2) px(ctx, x, y - 3, '#fff6c0'); break;
    default: break;
  }
}

// ───────── Hayvanlar ─────────

/** pose: walk0..3, idle, sit, sleep, wag0/1, bark, fly0/1, perch, hold (köpek ek: idle0/1, run0-3, alert, sniff0/1, beg, play) */
export function petSprite(id, dir = 'down', pose = 'idle') {
  const key = `${id}|${dir}|${pose}`;
  if (cache.has(key)) return cache.get(key);
  const base = makeCanvas(CS, CS);
  const ctx = base.getContext('2d');
  if (id === 'PET_ZIPIR') drawCatUp(ctx, pose);
  else if (id === 'PET_TARCIN') drawDogUp(ctx, pose);
  else if (id === 'PET_KIRMIZI') drawBirdUp(ctx, pose, '#d43a2a', '#f2c14e', '#3b6ea5');
  else if (id === 'PET_GECEYARISI') drawBirdUp(ctx, pose, '#2a1e40', '#7a4ab0', '#4a2a7a');
  else if (id === 'PET_CUCE') drawMonkeyUp(ctx, pose);
  const out = rotated(base, dir);
  cache.set(key, out);
  return out;
}

function drawCatUp(ctx, pose) {
  const g = '#a4a4ae', d = '#6c6c78', l = '#cfcfd6', eye = '#4a4a54';
  const cx = 11, cy = 12;
  if (pose === 'sleep') {
    disc(ctx, cx, cy, 4, g);
    disc(ctx, cx - 1, cy, 2, l);
    disc(ctx, cx + 2, cy - 3, 2, g);
    px(ctx, cx + 1, cy - 5, d); px(ctx, cx + 4, cy - 5, d);
    for (const [dx, dy] of [[-4, 2], [-3, 4], [-1, 5], [1, 5]]) px(ctx, cx + dx, cy + dy, d);
    return;
  }
  if (pose === 'sit') {
    disc(ctx, cx, cy + 1, 3, g);
    disc(ctx, cx, cy - 3, 3, g);
    rect(ctx, cx - 3, cy - 7, 2, 2, d); rect(ctx, cx + 2, cy - 7, 2, 2, d);
    rect(ctx, cx - 2, cy - 4, 2, 1, eye); rect(ctx, cx + 1, cy - 4, 2, 1, eye); // kapalı gözler
    for (const [dx, dy] of [[3, 3], [4, 4], [5, 4], [6, 3]]) px(ctx, cx + dx, cy + dy, d);
    return;
  }
  const f = pose.startsWith('walk') ? Number(pose[4]) || 0 : 0;
  rect(ctx, cx - 3, cy - 4, 6, 10, g);
  rect(ctx, cx - 1, cy - 3, 2, 8, l);
  disc(ctx, cx, cy - 6, 3, g);
  rect(ctx, cx - 3, cy - 10, 2, 2, d); rect(ctx, cx + 2, cy - 10, 2, 2, d);
  rect(ctx, cx - 2, cy - 7, 1, 1, eye); rect(ctx, cx + 2, cy - 7, 1, 1, eye);
  const st = [0, 1, 0, -1][f];
  rect(ctx, cx - 4, cy - 3 + st, 1, 2, d); rect(ctx, cx + 3, cy - 3 - st, 1, 2, d); rect(ctx, cx - 4, cy + 3 - st, 1, 2, d); rect(ctx, cx + 3, cy + 3 + st, 1, 2, d);
  const t = f % 2 ? 1 : -1;
  px(ctx, cx, cy + 6, d); px(ctx, cx + t, cy + 7, d); px(ctx, cx + t * 2, cy + 8, d); px(ctx, cx + t * 2, cy + 9, d);
}

/* TARÇIN — gerçek fotoğrafa göre: ağırlıklı siyah, alından buruna geniş beyaz şerit, kabarık beyaz göğüs,
   beyaz patiler, yarı dik kabarık kulaklar (uçları yana açık), uzun kabarık yukarı kıvrık siyah kuyruk, MAVİ tasma.
   Kare yukarı bakar (baş üstte); rotated() 4 yöne çevirir ve kontur ekler.
   pozlar: idle0/1, walk0-3, run0-3, sit, sleep, wag0/1, alert, bark, sniff0/1, beg, play */
const DOG = { B: '#1c1b22', G: '#34323d', H: '#4a4856', W: '#f4f2ec', w: '#cfccc4', blue: '#2f8ae8', blueD: '#1f5fae', tag: '#c8ccd4', nose: '#08080a', eye: '#7a4524', ear: '#9a6a6a', tongue: '#ee8a9a' };

function dogHead(ctx, cx, hy, o = {}) {
  // hy: başın merkezi. o.ears: 'semi' | 'up' | 'back' | 'flop'; o.lower: koklarken burun aşağıda; o.mouth: ağız açık
  const D = DOG;
  const ears = o.ears || 'semi';
  // kulaklar (başın arkasında, önce çizilir)
  for (const s of [-1, 1]) {
    if (ears === 'up') { rect(ctx, cx + s * 2 - (s < 0 ? 1 : 0), hy - 5, 2, 3, D.B); px(ctx, cx + s * 2, hy - 6, D.B); px(ctx, cx + s * 2, hy - 4, D.ear); }
    else if (ears === 'back') { rect(ctx, cx + s * 3 - (s < 0 ? 1 : 0), hy - 1, 2, 3, D.B); px(ctx, cx + s * 4, hy + 2, D.G); }
    else if (ears === 'flop') { rect(ctx, cx + s * 3 - (s < 0 ? 1 : 0), hy - 3, 2, 3, D.B); px(ctx, cx + s * 4, hy - 1, D.B); px(ctx, cx + s * 5, hy, D.G); }
    else { rect(ctx, cx + s * 2 - (s < 0 ? 1 : 0), hy - 4, 2, 3, D.B); px(ctx, cx + s * 4, hy - 5, D.B); px(ctx, cx + s * 3, hy - 5, D.B); px(ctx, cx + s * 2, hy - 3, D.ear); }
  }
  // kafa: kabarık siyah
  disc(ctx, cx, hy, 3, D.B);
  px(ctx, cx - 3, hy + 1, D.G); px(ctx, cx + 3, hy + 1, D.G);
  // beyaz şerit: alnın ortasından buruna, burunda genişler
  const m = o.lower ? 1 : 0;
  vline(ctx, cx, hy - 2, hy + 1, D.W);
  rect(ctx, cx - 1, hy - 4 - m, 3, 2, D.W); // namlu (burun kısmı) beyaz
  px(ctx, cx - 1, hy - 3 - m, D.w);
  px(ctx, cx, hy - 5 - m, D.nose); px(ctx, cx - 1, hy - 5 - m, D.nose); px(ctx, cx + 1, hy - 5 - m, D.nose);
  // gözler (kahverengi)
  px(ctx, cx - 2, hy - 1, D.eye); px(ctx, cx + 2, hy - 1, D.eye);
  if (o.mouth) { px(ctx, cx, hy - 2 - m, D.tongue); px(ctx, cx + 1, hy - 2 - m, D.tongue); }
}

function dogCollar(ctx, cx, y, w = 2) {
  // mavi tasma + gümüş künye (her pozda görünür)
  hline(ctx, cx - w, cx + w, y, DOG.blue);
  hline(ctx, cx - w + 1, cx + w - 1, y + 1, DOG.blueD);
  px(ctx, cx, y + 1, DOG.tag);
}

function dogTail(ctx, x, y, mode) {
  // uzun, kabarık, yukarı kıvrık siyah kuyruk (yukarıdan: kalçadan sırta doğru kıvrım)
  const B = DOG.B, G = DOG.G;
  if (mode === 'straight') { for (let i = 0; i < 6; i++) { rect(ctx, x - 1, y + i, 2, 1, i % 2 ? G : B); } px(ctx, x, y + 6, DOG.w); return; }
  const s = mode === 'left' ? -1 : 1;
  const pts = [[0, 0], [0, 1], [s, 2], [s * 2, 2], [s * 3, 1], [s * 3, 0], [s * 3, -1], [s * 2, -2]];
  pts.forEach(([dx, dy], i) => { px(ctx, x + dx, y + dy, i % 3 === 1 ? G : B); px(ctx, x + dx + (dy > 0 ? 0 : s), y + dy + (dy > 0 ? 1 : 0), B); });
  px(ctx, x + s * 2, y - 3, DOG.w); // açık renkli uç
}

function dogBody(ctx, cx, cy, len = 5) {
  // kabarık siyah gövde + sırt parlaklığı + yanlarda tüy kabarıkları
  const B = DOG.B, G = DOG.G, H = DOG.H;
  for (let yy = -len; yy <= len; yy++) {
    const w = Math.round(3.6 * Math.sqrt(1 - (yy / (len + 1)) ** 2));
    hline(ctx, cx - w, cx + w, cy + yy, B);
  }
  vline(ctx, cx, cy - len + 1, cy + len - 2, G);
  px(ctx, cx, cy - 1, H); px(ctx, cx - 1, cy + 1, G);
  for (const [dx, dy] of [[-4, -1], [4, 0], [-4, 2], [4, 3]]) px(ctx, cx + dx, cy + dy, B);
}

function dogLeg(ctx, x, y, dir, white = true) {
  // bacak: üstü siyah, ucu beyaz pati (dir: -1 yukarı uzanır, 1 aşağı)
  px(ctx, x, y, DOG.B);
  px(ctx, x, y + dir, white ? DOG.W : DOG.B);
  if (white) px(ctx, x, y + dir * 2, DOG.w);
}

function drawDogUp(ctx, pose) {
  const D = DOG;
  const cx = 11, cy = 13;
  if (pose === 'sleep') {
    // kıvrılmış: gövde halka, kuyruk burnunun üstüne sarılı, beyaz şerit ve mavi tasma görünür
    disc(ctx, cx, cy, 5, D.B);
    disc(ctx, cx + 1, cy + 1, 2, D.G);
    disc(ctx, cx - 2, cy - 3, 3, D.B); // baş
    vline(ctx, cx - 2, cy - 5, cy - 2, D.W); rect(ctx, cx - 3, cy - 6, 3, 1, D.W); px(ctx, cx - 2, cy - 7, D.nose);
    px(ctx, cx - 4, cy - 4, D.B); px(ctx, cx - 5, cy - 3, D.B);
    hline(ctx, cx - 3, cx, cy, D.blue); px(ctx, cx - 1, cy + 1, D.tag);
    for (const [dx, dy] of [[3, -4], [4, -5], [3, -6], [1, -7], [-1, -7]]) px(ctx, cx + dx, cy + dy, D.B); // kuyruk burnu sarar
    px(ctx, -0 + cx - 2, cy - 8 + 1, D.w);
    rect(ctx, cx + 3, cy + 3, 2, 1, D.W); // arka pati
    return;
  }
  const sitLike = ['sit', 'wag0', 'wag1', 'bark', 'beg'].includes(pose);
  if (sitLike) {
    // oturuş: arka kısım yuvarlak, gövde dik → beyaz göğüs önlüğü ve ön patiler öne doğru görünür
    disc(ctx, cx, cy + 3, 4, D.B);
    px(ctx, cx, cy + 3, D.G); px(ctx, cx - 1, cy + 4, D.G);
    const tail = pose === 'wag0' ? 'left' : pose === 'wag1' ? 'right' : 'right';
    dogTail(ctx, cx + (tail === 'left' ? -3 : 3), cy + 6, tail);
    // beyaz kabarık göğüs
    rect(ctx, cx - 2, cy - 3, 5, 4, D.W);
    px(ctx, cx - 3, cy - 2, D.W); px(ctx, cx + 3, cy - 2, D.W); px(ctx, cx - 1, cy, D.w); px(ctx, cx + 1, cy - 1, D.w);
    // ön patiler (beyaz), dilenme pozunda biri havada
    dogLeg(ctx, cx - 2, cy + 1, -1); 
    if (pose === 'beg') { px(ctx, cx + 2, cy - 2, D.W); px(ctx, cx + 3, cy - 3, D.W); } else dogLeg(ctx, cx + 2, cy + 1, -1);
    px(ctx, cx - 2, cy - 1, D.W); px(ctx, cx + 2, cy - 1, D.W);
    dogHead(ctx, cx, cy - 7, { ears: pose === 'bark' ? 'up' : 'semi', mouth: pose === 'bark' || pose === 'wag1' });
    dogCollar(ctx, cx, cy - 4, 3);
    if (pose === 'bark') { px(ctx, cx - 2, cy - 14, '#ffffff'); px(ctx, cx, cy - 15, '#ffffff'); px(ctx, cx + 2, cy - 14, '#ffffff'); }
    return;
  }
  // ayakta / yürüyüş / koşu / koklama / dikkat / oyun
  const run = pose.startsWith('run');
  const sniff = pose.startsWith('sniff');
  const f = Number(pose.slice(-1)) || 0;
  const len = run ? 6 : 5;
  const st = run ? [0, 3, 0, -3][f % 4] : pose.startsWith('walk') ? [0, 1, 0, -1][f % 4] : 0;
  const bob = run && f % 2 ? 1 : 0;
  // kuyruk: koşarken arkaya uzanır, dikkatte dik kıvrık, oyunda sallanır, normalde kıvrık
  dogTail(ctx, cx + (run ? 0 : 2), cy + len + 1, run ? 'straight' : pose === 'play' ? (Math.floor(f) % 2 ? 'left' : 'right') : 'right');
  // bacaklar (gövdenin altından çıkar): ön bacaklar yukarı, arka bacaklar aşağı uzanır, uçlarda beyaz pati
  const fy = cy - len + 1, hy0 = cy + len - 2;
  dogLeg(ctx, cx - 3, fy - st, -1); dogLeg(ctx, cx + 3, fy + st, -1);
  dogLeg(ctx, cx - 3, hy0 + st, 1); dogLeg(ctx, cx + 3, hy0 - st, 1);
  if (pose === 'play') { dogLeg(ctx, cx - 3, fy - 2, -1); dogLeg(ctx, cx + 3, fy - 2, -1); }
  dogBody(ctx, cx, cy + bob, len);
  // omuzlarda beyaz yaka tüyleri (göğsün kenarı yukarıdan görünür)
  px(ctx, cx - 3, cy - len + 1, D.W); px(ctx, cx + 3, cy - len + 1, D.W); px(ctx, cx - 2, cy - len, D.W); px(ctx, cx + 2, cy - len, D.W);
  // nefes alma: idle1'de göğüs yanları hafif kabarır
  if (pose === 'idle1') { px(ctx, cx - 4, cy - 2, D.B); px(ctx, cx + 4, cy - 2, D.B); }
  const headY = cy - len - 4 - (sniff ? 1 : 0) + (pose === 'play' ? 1 : 0);
  const tilt = pose === 'idle1' ? 1 : sniff ? (f % 2 ? 1 : -1) : 0;
  dogHead(ctx, cx + tilt, headY, { ears: run ? 'back' : pose === 'alert' ? 'up' : sniff ? 'flop' : 'semi', lower: sniff, mouth: run || pose === 'play' });
  dogCollar(ctx, cx, headY + 3, 3); // tasma başın hemen arkasında, boynu sarar
  if (sniff && f % 2) { px(ctx, cx + tilt - 2, headY - 7, 'rgba(230,230,230,0.7)'); px(ctx, cx + tilt + 2, headY - 7, 'rgba(230,230,230,0.7)'); }
}

function drawBirdUp(ctx, pose, body, chest, wing) {
  const cx = 11, cy = 11;
  if (pose.startsWith('fly')) {
    const up = pose === 'fly0';
    rect(ctx, cx - 1, cy - 3, 3, 7, body);
    disc(ctx, cx, cy - 4, 2, body);
    rect(ctx, cx, cy - 7, 1, 2, '#e8c040');
    for (let i = 1; i <= 7; i++) { const yy = cy - 1 + (up ? -Math.round(i * 0.4) : Math.round(i * 0.3)); rect(ctx, cx - 1 - i, yy, 1, 2, wing); rect(ctx, cx + 1 + i, yy, 1, 2, wing); }
    rect(ctx, cx - 1, cy + 4, 3, 1, chest); rect(ctx, cx, cy + 5, 1, 3, wing);
    return;
  }
  rect(ctx, cx - 2, cy - 2, 5, 6, body);
  rect(ctx, cx - 2, cy - 1, 1, 4, wing); rect(ctx, cx + 2, cy - 1, 1, 4, wing);
  disc(ctx, cx, cy - 3, 2, body);
  rect(ctx, cx, cy - 6, 1, 2, '#e8c040');
  rect(ctx, cx - 1, cy + 4, 3, 1, chest); rect(ctx, cx, cy + 5, 1, 3, wing);
  if (pose === 'fluff') for (const [dx, dy] of [[-3, 0], [3, 0], [-3, -2], [3, -2], [0, -6]]) px(ctx, cx + dx, cy + dy, body);
}

function drawMonkeyUp(ctx, pose) {
  const b = '#8a5a2b', o = '#c87a3a', hat = '#1e1e24';
  const cx = 11, cy = 12;
  const f = pose.startsWith('walk') ? Number(pose[4]) || 0 : 0;
  rect(ctx, cx - 3, cy - 3, 6, 7, b);
  disc(ctx, cx, cy - 5, 3, b);
  rect(ctx, cx - 3, cy - 7, 7, 3, hat);
  rect(ctx, cx - 1, cy - 6, 2, 1, '#e8e0c0');
  rect(ctx, cx - 1, cy - 9, 2, 1, '#e8c49a');
  const st = [0, 1, 0, -1][f];
  rect(ctx, cx - 4, cy - 2 + st, 1, 2, b); rect(ctx, cx + 3, cy - 2 - st, 1, 2, b); rect(ctx, cx - 4, cy + 2 - st, 1, 2, b); rect(ctx, cx + 3, cy + 2 + st, 1, 2, b);
  for (const [dx, dy] of [[1, 4], [2, 5], [3, 6], [4, 6], [5, 5], [5, 4]]) px(ctx, cx + dx, cy + dy, o);
  if (pose === 'hold') { rect(ctx, cx - 3, cy - 6, 2, 2, '#f2c14e'); rect(ctx, cx + 2, cy - 6, 2, 2, '#f2c14e'); }
}

/** Yabancı insan figürleri (korsanlar, köylüler) */
export function npcSprite(kind, dir = 'down', state = 'idle', frame = 0) {
  const looks = {
    pirate: { skin: '#d9a273', hair: '#1a1410', hairStyle: 'short', hat: 'bandana', hatColor: '#b8282c', beard: 'short', beardColor: '#1a1410', top: '#3a2a3a', top2: '#e8e0c8', pants: '#2a2230' },
    pirateCaptain: { skin: '#c89060', hair: '#1a1410', hairStyle: 'curly', hat: 'tricorn', hatColor: '#141418', beard: 'full', beardColor: '#1a1410', top: '#6a1a22', top2: '#f0c040', pants: '#1a1a22' },
    captain: { skin: '#e8b88a', hair: '#3a2416', hairStyle: 'short', hat: 'tricorn', hatColor: '#24324d', beard: 'short', beardColor: '#3a2416', top: '#24426b', top2: '#f2c14e', pants: '#2a2a3a' },
    sailor: { skin: '#e8b88a', hair: '#5a3a1a', hairStyle: 'short', hat: 'cap', hatColor: '#24324d', beard: 'none', top: '#f0f0e8', top2: '#3b6ea5', pants: '#2c2c3c' },
    villager: { skin: '#a8703f', hair: '#1a1410', hairStyle: 'short', hat: 'straw', hatColor: '#d8b45a', beard: 'none', top: '#c8423b', top2: '#e8c45a', pants: '#5a3a1f' },
    ghost: { skin: '#b8ffe0', hair: '#7affc8', hairStyle: 'long', hat: 'tricorn', hatColor: '#3a8a6a', beard: 'long', beardColor: '#8affd0', top: '#4aa080', top2: '#c8ffe8', pants: '#2a6a5a' },
    // sahne figürleri
    soldier: { skin: '#e0b088', hair: '#3a2416', hairStyle: 'short', hat: 'cap', hatColor: '#8a1f22', beard: 'none', top: '#b8282c', top2: '#f0f0e8', pants: '#1e2440', idle: 'spear' },
    officer: { skin: '#e8b88a', hair: '#c8c0b0', hairStyle: 'short', hat: 'tricorn', hatColor: '#1e2a4a', beard: 'short', beardColor: '#c8c0b0', top: '#24426b', top2: '#f2c14e', pants: '#f0ece0', idle: 'scroll' },
    customs: { skin: '#c89060', hair: '#2a1a10', hairStyle: 'short', hat: 'fez', hatColor: '#a8282c', beard: 'short', beardColor: '#2a1a10', top: '#3a4a3a', top2: '#c8a040', pants: '#2a2a2a', idle: 'scroll' },
    merchant: { skin: '#d8a070', hair: '#5a3a1a', hairStyle: 'short', hat: 'turban', hatColor: '#3b6ea5', beard: 'full', beardColor: '#5a3a1a', top: '#c86a3a', top2: '#f2c14e', pants: '#4a3020', idle: 'count', build: 'round' },
    stranger: { skin: '#9a8a80', hair: '#1a1a20', hairStyle: 'short', hat: 'hood', hatColor: '#1e1e2a', beard: 'none', top: '#24242e', top2: '#3a3a4a', pants: '#1a1a22' },
    oldSailor: { skin: '#d8a880', hair: '#e8e8e0', hairStyle: 'short', hat: 'cap', hatColor: '#3a4a6a', beard: 'long', beardColor: '#f0f0e8', top: '#5a6a7a', top2: '#e8e0c8', pants: '#3a3a4a', idle: 'lantern' },
    villagerF: { skin: '#a8703f', hair: '#1a1410', hairStyle: 'long', hat: 'headwrap', hatColor: '#e8c45a', beard: 'none', top: '#2f8a6a', top2: '#f0e0a0', pants: '#5a3a1f' },
    chief: { skin: '#8a5a32', hair: '#1a1410', hairStyle: 'long', hat: 'feather', hatColor: '#c8423b', beard: 'none', top: '#e0a040', top2: '#2f8a6a', pants: '#5a3a1f', idle: 'staff', build: 'big' },
    sick: { skin: '#b8c890', hair: '#4a3a2a', hairStyle: 'short', hat: 'bandana', hatColor: '#8a8a7a', beard: 'short', beardColor: '#4a3a2a', top: '#8a9a7a', top2: '#c8c8b0', pants: '#4a4a3a' },
    keeper: { skin: '#e0b088', hair: '#8a8a8a', hairStyle: 'short', hat: 'cap', hatColor: '#2a3a5a', beard: 'full', beardColor: '#9a9a9a', top: '#2a3a5a', top2: '#f2c14e', pants: '#2a2a3a', idle: 'lantern' },
    servant: { skin: '#e8c8a0', hair: '#6a4a2a', hairStyle: 'bun', hat: 'none', beard: 'none', top: '#5a3a6a', top2: '#f0e8f0', pants: '#3a2a4a' },
    princess: { skin: '#f0d0b0', hair: '#c88a3a', hairStyle: 'long', hat: 'tiara', hatColor: '#f2c14e', beard: 'none', top: '#c8a0e8', top2: '#f0e8f0', pants: '#8b5bb5' },
    hunter: { skin: '#c89060', hair: '#2a1a10', hairStyle: 'short', hat: 'tricorn', hatColor: '#3a3a3a', beard: 'short', beardColor: '#2a1a10', top: '#4a4a52', top2: '#8a8a92', pants: '#2a2a30', idle: 'guard' },
    guild: { skin: '#e8c0a0', hair: '#3a2a1a', hairStyle: 'short', hat: 'beret', hatColor: '#1e3a2a', beard: 'none', top: '#2f5a3a', top2: '#f2c14e', pants: '#2a2a2a', idle: 'count' },
    cartographer: { skin: '#e8c0a0', hair: '#8a5a2a', hairStyle: 'curly', hat: 'beret', hatColor: '#6a3a2a', beard: 'none', top: '#e8dcc0', top2: '#6a3a2a', pants: '#4a3a2a', idle: 'map' },
    deserter: { skin: '#d8a880', hair: '#3a2416', hairStyle: 'short', hat: 'none', beard: 'short', beardColor: '#3a2416', top: '#8a3a3a', top2: '#c8c0b0', pants: '#2a2a3a' },
    castaway: { skin: '#c88a5a', hair: '#6a4a2a', hairStyle: 'long', hat: 'none', beard: 'long', beardColor: '#6a4a2a', top: '#c8b890', top2: '#a89870', pants: '#6a5a3a' },
    smuggler: { skin: '#c89060', hair: '#1a1410', hairStyle: 'short', hat: 'scarf', hatColor: '#2a2a32', beard: 'short', beardColor: '#1a1410', top: '#2a2a32', top2: '#5a4a3a', pants: '#1e1e24' },
    plague: { skin: '#a8b880', hair: '#2a2a20', hairStyle: 'short', hat: 'hood', hatColor: '#3a3a2a', beard: 'none', top: '#4a4a3a', top2: '#6a6a4a', pants: '#2a2a20' },
  };
  const key = `npc|${kind}|${dir}|${state}|${frame}`;
  if (cache.has(key)) return cache.get(key);
  const base = makeCanvas(CS, CS);
  const lk = looks[kind] || looks.sailor;
  drawCrewUp(base.getContext('2d'), lk, lk.build || 'normal', lk.idle || 'none', state, frame);
  const out = rotated(base, dir);
  cache.set(key, out);
  return out;
}
