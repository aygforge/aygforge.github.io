// V2 (Kül ve Ayaz) yaratık, elit ve boss sprite'ları — her biri ayrı silüet ve paletle procedural çizilir.
// V1 karelerine (idle/walk/atk) ek olarak darbe alma (hurt0) ve ölüm (die0–die2) kareleri vardır.
// Ölüm kareleri tema renginde dağılır: kül yaratıkları kora/küle, buz yaratıkları buz kırıklarına dönüşür.
import { PB, shade, OUTLINE, hash } from './pixel.js';
import { drawHumanoid } from './characters.js';

export const V2_EXTRA_FRAMES = ['hurt0', 'die0', 'die1', 'die2'];
export const V2_FR = {
  hurt0: { bob: 0, step: 0, atk: 0, hurt: 1 },
  die0: { bob: 0, step: 0, atk: 0, hurt: 1, die: 1 },
  die1: { bob: 0, step: 0, atk: 0, hurt: 1, die: 2 },
  die2: { bob: 0, step: 0, atk: 0, hurt: 1, die: 3 },
};

const DISSOLVE = {
  ash: ['#8a8480', '#5a5250', '#ff7a2a', '#3a3030'],
  ice: ['#c8f0ff', '#7ad8ff', '#ffffff', '#5ab8e8'],
  flesh: ['#5a3a30', '#3a2a24', '#7a5a4a', '#2a1e1a'],
  // V3
  bone: ['#e0d8c4', '#a8a090', '#8a8494', '#5a5466'],
  void: ['#a070e0', '#5a3a7a', '#e0c8ff', '#2a1a3a'],
};

// Ölüm: gövde yere çöker (dikey basıklık) ve pikseller tema parçacıklarına dağılır
export function collapse(src, k, fx = 'ash') {
  const sq = [0.78, 0.5, 0.24][k - 1];
  const loss = [0.12, 0.42, 0.74][k - 1];
  const cols = DISSOLVE[fx] || DISSOLVE.ash;
  const out = new PB(src.w, src.h);
  const H = src.h - 1;
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const v = src.d[y * src.w + x];
    if ((v >>> 24) === 0) continue;
    const h = hash(x, y, 31 + k);
    let ny = Math.round(H - (H - y) * sq);
    let nx = x + Math.round((x - src.w / 2) * (1 - sq) * 0.35);
    if (h < loss) {
      // parçacık: yukarı ve yana savrulur, seyrek
      if (h < loss * 0.35) {
        ny = Math.max(0, ny - Math.round(hash(y, x, k) * 6 * k));
        nx += Math.round((hash(x, k, y) - 0.5) * 4 * k);
        out.set(nx, ny, cols[Math.floor(hash(x + 3, y, k) * cols.length)]);
      }
      continue;
    }
    if (nx >= 0 && nx < out.w && ny >= 0 && ny < out.h) out.d[ny * out.w + nx] = v;
  }
  return out;
}

// --------------------------------------------------------------- yardımcılar
function held(kind, color, len = 8) {
  return (pb, f, ctx) => {
    const [hx, hy] = f.hf;
    const fn = ctx.frameName;
    const dir = fn === 'atk0' ? [-0.3, -1] : fn === 'atk1' ? [1, 0.25] : fn === 'hurt0' ? [-0.6, -1] : [0.45, -1];
    const n = Math.hypot(dir[0], dir[1]);
    const ex = hx + dir[0] / n * len, ey = hy + dir[1] / n * len;
    if (kind === 'greatsword') { pb.thick(hx, hy, ex, ey, color, 2); pb.line(hx - 2, hy + 1, hx + 2, hy - 1, '#3a2a20'); pb.set(ex, ey, '#ffe0a0'); }
    if (kind === 'halberd') { pb.line(hx - dir[0] * 4, hy - dir[1] * 4 + 3, ex, ey, '#5a6a7a'); pb.poly([[ex - 2, ey + 2], [ex + 1, ey - 3], [ex + 3, ey + 1]], color); pb.set(ex + 1, ey - 2, '#ffffff'); }
    if (kind === 'cleaver') { pb.thick(hx, hy, hx + dir[0] / n * 3, hy + dir[1] / n * 3, '#3a2a20', 2); pb.poly([[ex - 3, ey - 1], [ex + 3, ey - 3], [ex + 4, ey + 3], [ex - 2, ey + 4]], color); pb.hline(ex - 2, ex + 3, ey - 2, shade(color, 0.35)); }
    if (kind === 'icestaff') { pb.line(hx, hy + 6, ex, ey, '#e8eef4'); pb.disc(ex, ey, 2.2, color); pb.set(ex, ey - 1, '#ffffff'); pb.line(ex - 2, ey - 3, ex - 3, ey - 5, '#e8eef4'); pb.line(ex + 2, ey - 3, ex + 3, ey - 5, '#e8eef4'); }
    if (kind === 'firebow') {
      pb.line(hx - 1, hy - 6, hx + 2, hy, '#4a3428'); pb.line(hx + 2, hy, hx - 1, hy + 6, '#4a3428'); pb.vline(hx - 1, hy - 5, hy + 5, '#d8d0c0');
      if (fn === 'atk1' || fn === 'atk0') { pb.hline(hx - 1, hx + 6, hy, '#c8a070'); pb.set(hx + 6, hy, '#ffd060'); pb.set(hx + 7, hy, '#ff7a2a'); }
    }
  };
}

// --------------------------------------------------------------- tasarımlar (özel çizim)
export const DESIGNS_V2 = {
  // Kül Cini: süzülen kor ruhu, dumanlı kuyruk, alevli boynuzlar
  ash_imp: { w: 22, h: 26, fx: 'ash', draw: (pb, f) => {
    const b = f.bob + (f.step % 2);
    const lean = f.atk === 2 ? 3 : f.atk === 1 ? -1 : f.hurt ? -2 : 0;
    const cx = 10 + lean, cy = 9 + b;
    // duman kuyruk
    for (let i = 0; i < 6; i++) {
      const t = i / 5, sway = Math.sin(i * 1.3 + (f.step || f.bob) * 1.2) * 2;
      pb.disc(cx - 1 - t * 3 + sway, cy + 6 + i * 2.4, 3.6 - t * 2.6, i < 3 ? '#5a5250' : '#7a726e', 255 - i * 25);
    }
    pb.ellipse(cx, cy + 4, 4.5, 4, '#4a403e');
    pb.ellipse(cx, cy, 5, 4.6, '#5e5450'); pb.ellipse(cx - 1, cy - 1, 3.5, 3, '#766a66');
    // kor çatlakları
    pb.line(cx - 3, cy + 2, cx - 1, cy + 5, '#ff6a2a'); pb.line(cx + 2, cy + 3, cx + 3, cy + 6, '#ff8a2a'); pb.set(cx, cy + 4, '#ffd060');
    // boynuz + alev saç
    pb.line(cx - 3, cy - 3, cx - 5, cy - 7, '#2a2020'); pb.line(cx + 3, cy - 3, cx + 5, cy - 7, '#2a2020');
    const fl = [(f.bob + f.step) % 3, (f.bob + f.step + 1) % 3];
    pb.poly([[cx - 2, cy - 4], [cx - 1, cy - 8 - fl[0]], [cx + 1, cy - 4]], '#ff7a2a'); pb.poly([[cx, cy - 4], [cx + 2, cy - 9 - fl[1]], [cx + 3, cy - 4]], '#ffb040');
    pb.set(cx + 1, cy - 6, '#ffe070');
    // gözler
    const eye = f.hurt ? '#ffffff' : '#ffd060';
    pb.set(cx + 1, cy - 1, eye); pb.set(cx + 3, cy - 1, eye); pb.hline(cx + 1, cx + 3, cy + 1, '#2a1414');
    // pençeler
    const ax = f.atk === 2 ? 7 : f.atk === 1 ? 2 : 4;
    pb.thick(cx + 3, cy + 3, cx + 3 + ax, cy + 4 - (f.atk === 1 ? 3 : 0), '#4a403e', 2);
    pb.set(cx + 4 + ax, cy + 4 - (f.atk === 1 ? 3 : 0), '#ffb040');
    pb.thick(cx - 4, cy + 3, cx - 7, cy + 5, '#4a403e', 2);
    if (f.atk === 2) { pb.disc(cx + 9 + 2, cy + 3, 2.2, '#ff8a2a'); pb.disc(cx + 9 + 2, cy + 3, 1.2, '#ffe070'); }
  } },

  // Kızıl Akrep: parçalı gövde, kıskaçlar, öne savrulan iğneli kuyruk
  crimson_scorpion: { w: 32, h: 22, fx: 'flesh', draw: (pb, f) => {
    const recoil = f.hurt ? -2 : 0;
    const by = 15 + f.bob * 0.5;
    const ox = recoil;
    const body = '#a02a1e', hi = '#d04a2a', dk = '#5a140e';
    // bacaklar
    for (let i = 0; i < 3; i++) {
      const o = f.step ? [0, 1, 0, -1][(f.step + i) % 4] : 0;
      const x = 11 + i * 4 + ox;
      pb.line(x, by + 1, x - 3 + o, by + 5, dk); pb.line(x - 3 + o, by + 5, x - 4 + o, by + 6, dk);
      pb.line(x + 1, by + 1, x + 3 - o, by + 5, body);
    }
    // gövde segmentleri
    for (let i = 0; i < 4; i++) { pb.ellipse(12 + i * 3.4 + ox, by, 3.2, 2.8, i % 2 ? body : shade(body, -0.08)); pb.hline(10 + i * 3.4 + ox, 13 + i * 3.4 + ox, by - 2, hi); }
    // baş + kıskaçlar
    const hx = 25 + ox + (f.atk === 1 ? 1 : 0);
    pb.ellipse(hx, by, 3.2, 2.6, body); pb.set(hx + 1, by - 1, f.hurt ? '#ffffff' : '#ffd060'); pb.set(hx + 2, by - 1, '#ffd060');
    const open = f.atk === 1 ? 2 : 1;
    for (const s of [-1, 1]) {
      const cy = by + s * 3;
      pb.thick(hx + 1, by + s, hx + 4, cy, body, 2);
      pb.ellipse(hx + 5, cy, 2.2, 1.6, hi);
      pb.line(hx + 6, cy - open * 0.6, hx + 8, cy - open, dk); pb.line(hx + 6, cy + open * 0.6, hx + 8, cy + open * 0.4, dk);
    }
    // kuyruk: sırttan yukarı kıvrılır; saldırıda öne savrulur
    const tipX = f.atk === 1 ? 26 : f.atk === 2 ? 22 : 14, tipY = f.atk === 1 ? 7 : f.atk === 2 ? 4 : 2 + f.bob;
    const pts = [[8 + ox, by - 1], [4 + ox, by - 5], [4 + ox, by - 10], [8 + ox, tipY + 2], [tipX + ox, tipY]];
    for (let i = 0; i < pts.length - 1; i++) pb.thick(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], i % 2 ? body : shade(body, 0.08), 3 - i * 0.3);
    for (const [x, y] of pts.slice(1, 4)) pb.set(x, y - 1, hi);
    pb.poly([[tipX + ox, tipY - 2], [tipX + ox + 4, tipY + 1], [tipX + ox, tipY + 2]], '#ffd060'); pb.set(tipX + ox + 3, tipY + 1, '#ffffff');
  } },

  // Ayaz Kurdu: buz dikenli sırt, kırağı yele, mavi parıltılı gözler
  // frost_wolf: ./wolf.js

  // Buz Ruhçuk: kristal çekirdek, yörüngede buz kıymıkları
  ice_wisp: { w: 22, h: 26, fx: 'ice', draw: (pb, f) => {
    const b = f.bob + (f.step % 2);
    const cx = 11 + (f.atk === 2 ? 2 : f.hurt ? -2 : 0), cy = 11 + b;
    for (let i = 0; i < 4; i++) pb.disc(cx - 1 + Math.sin(i + f.step) * 1.5, cy + 6 + i * 2.5, 2.6 - i * 0.55, '#9fd8f0', 170 - i * 35);
    const ang = (f.step || 0) * 0.7 + f.bob * 0.4 + (f.atk ? 0.8 : 0);
    for (let i = 0; i < 4; i++) {
      const a = ang + i * Math.PI / 2;
      const rr = f.atk === 2 ? 6 : 8;
      const x = cx + Math.cos(a) * rr + (f.atk === 2 ? 3 : 0), y = cy + Math.sin(a) * rr * 0.5;
      pb.poly([[x - 1.2, y + 1.5], [x, y - 2.5], [x + 1.2, y + 1.5]], '#7ad8ff'); pb.set(x, y - 1, '#ffffff');
    }
    pb.poly([[cx, cy - 7], [cx + 5, cy], [cx, cy + 6], [cx - 5, cy]], '#5ab8e8');
    pb.poly([[cx, cy - 5], [cx + 3, cy], [cx, cy + 4], [cx - 3, cy]], f.atk ? '#e0faff' : '#a8e8ff');
    pb.vline(cx, cy - 5, cy + 3, '#ffffff');
    const eye = f.hurt ? '#ff8080' : '#14304a';
    pb.set(cx - 1, cy - 1, eye); pb.set(cx + 2, cy - 1, eye);
  } },

  // Buz Gardiyanı (elit): kristal omuzlu buz zırhı, parlayan vizör, dev tokmak
  ice_warden: { w: 36, h: 42, fx: 'ice', draw: (pb, f) => {
    const by = 10 + f.bob + (f.hurt ? 1 : 0);
    const st = f.step ? [0, 1, 0, -1][f.step % 4] : 0;
    const lean = f.hurt ? -2 : 0;
    const plate = '#8ab0c8', plateD = '#5a7a98', plateL = '#c8e4f4';
    pb.rect(11 + st + lean, by + 20, 6, 11, plateD); pb.rect(20 - st + lean, by + 20, 6, 11, plateD);
    pb.rect(10 + st + lean, by + 29, 8, 3, plate); pb.rect(19 - st + lean, by + 29, 8, 3, plate);
    pb.rect(9 + lean, by + 6, 19, 16, plate); pb.rect(10 + lean, by + 7, 8, 6, plateL);
    pb.hline(9 + lean, 27 + lean, by + 14, plateD); pb.vline(18 + lean, by + 7, by + 21, plateD);
    pb.disc(18 + lean, by + 12, 2, '#9fe8ff'); pb.set(18 + lean, by + 11, '#ffffff');
    // omuz kristalleri
    for (const [x, h] of [[8, 9], [29, 8]]) { pb.poly([[x - 3 + lean, by + 7], [x + lean, by + 7 - h], [x + 3 + lean, by + 7]], '#7ad8ff'); pb.vline(x + lean, by + 7 - h + 2, by + 6, '#e0faff'); }
    // miğfer
    pb.rect(13 + lean, by - 2, 11, 9, plate); pb.rect(13 + lean, by - 3, 11, 2, plateL);
    pb.hline(15 + lean, 22 + lean, by + 2, f.hurt ? '#ffffff' : '#9fe8ff'); pb.hline(15 + lean, 22 + lean, by + 3, '#2a4a6a');
    // kollar + tokmak
    const raise = f.atk === 1 ? -10 : f.atk === 2 ? 6 : 0;
    pb.thick(9 + lean, by + 9, 6 + lean, by + 18, plateD, 4);
    const hx = 30 + lean, hy = by + 16 + raise;
    pb.thick(27 + lean, by + 9, hx, hy, plateD, 4);
    pb.thick(hx, hy + 6, hx + 1, hy - 8, '#4a5a6a', 2);
    pb.rect(hx - 3, hy - 13, 8, 6, '#a8d0e8'); pb.rect(hx - 3, hy - 13, 8, 2, '#e0faff'); pb.set(hx + 1, hy - 10, '#ffffff');
  } },

  // Kül Devi (boss): bazalt titan, magma damarları, yanan baş, dev yumruklar
  ash_giant: { w: 64, h: 66, fx: 'ash', draw: (pb, f) => {
    const by = 16 + f.bob + (f.hurt ? 1 : 0);
    const raise = f.atk === 1 ? -12 : f.atk === 2 ? 10 : 0;
    const st = f.step ? [0, 1, 0, -1][f.step % 4] : 0;
    const rock = '#3a3436', rockD = '#242022', rockL = '#56504e', lava = '#ff6a1a', lavaL = '#ffd060';
    // bacaklar
    pb.rect(18 + st, by + 28, 11, 18, rockD); pb.rect(35 - st, by + 28, 11, 18, rockD);
    pb.rect(16 + st, by + 43, 14, 5, rock); pb.rect(34 - st, by + 43, 14, 5, rock);
    pb.line(22 + st, by + 30, 24 + st, by + 40, lava); pb.line(40 - st, by + 31, 39 - st, by + 41, lava);
    // gövde (kambur)
    pb.ellipse(32, by + 18, 20, 16, rock); pb.ellipse(29, by + 13, 14, 9, rockL);
    for (let i = 0; i < 30; i++) { const x = 14 + hash(i, 5) * 36, y = by + 6 + hash(5, i) * 26; if (pb.opaque(x, y)) pb.set(x, y, rockD); }
    // magma damarları
    pb.line(22, by + 10, 28, by + 22, lava); pb.line(28, by + 22, 26, by + 30, lava); pb.line(40, by + 8, 36, by + 20, lava); pb.line(36, by + 20, 42, by + 28, lava);
    pb.set(28, by + 22, lavaL); pb.set(36, by + 20, lavaL);
    pb.disc(32, by + 19, 4.5, '#c8401a'); pb.disc(32, by + 19, 2.8, lava); pb.set(31, by + 18, lavaL);
    // baş: alevli
    const hx = 32, hy = by + 1;
    const fl = (f.bob + f.step) % 3;
    pb.poly([[hx - 6, hy - 2], [hx - 4, hy - 10 - fl], [hx - 1, hy - 4], [hx + 1, hy - 12 + fl], [hx + 4, hy - 4], [hx + 6, hy - 9 - fl], [hx + 7, hy - 1]], '#ff7a2a');
    pb.poly([[hx - 3, hy - 2], [hx - 1, hy - 7], [hx + 1, hy - 3], [hx + 3, hy - 8], [hx + 4, hy - 2]], lavaL);
    pb.ellipse(hx, hy + 1, 7, 6, rock); pb.hline(hx - 4, hx + 4, hy + 1, '#1a1214');
    const eye = f.hurt ? '#ffffff' : lavaL;
    pb.set(hx - 3, hy + 1, eye); pb.set(hx + 3, hy + 1, eye); pb.hline(hx - 2, hx + 2, hy + 4, lava);
    // kollar ve yumruklar
    const armY = by + 22 + raise;
    pb.thick(14, by + 10, 8, armY, rockD, 8); pb.thick(50, by + 10, 56, armY, rockD, 8);
    pb.disc(8, armY + 4, 7, rock); pb.disc(56, armY + 4, 7, rock);
    pb.disc(7, armY + 3, 3, rockL); pb.disc(55, armY + 3, 3, rockL);
    pb.line(5, armY + 6, 10, armY + 2, lava); pb.line(53, armY + 6, 58, armY + 2, lava);
    if (f.atk === 2) { pb.disc(56, armY + 10, 4, '#ff8a2a', 200); pb.disc(8, armY + 10, 4, '#ff8a2a', 200); }
  } },

  // Donmuş Muhafız (boss): buz tacı, pelerin, buz mızrağı ve kalkan
  frozen_guardian: { w: 62, h: 68, fx: 'ice', draw: (pb, f) => {
    const by = 14 + f.bob + (f.hurt ? 1 : 0);
    const st = f.step ? [0, 1, 0, -1][f.step % 4] : 0;
    const armor = '#7a9ab8', armorD = '#4a6a88', armorL = '#b8d8ec', ice = '#9fe8ff';
    // pelerin
    pb.poly([[18, by + 8], [44, by + 8], [50, by + 46], [12, by + 46]], '#2a4a6a'); pb.poly([[20, by + 10], [26, by + 10], [22, by + 44], [15, by + 44]], '#3a5a7a');
    for (let x = 13; x < 50; x += 4) pb.poly([[x, by + 46], [x + 2, by + 50 + (x % 3)], [x + 3, by + 46]], '#e0f6ff');
    // bacaklar
    pb.rect(22 + st, by + 30, 8, 16, armorD); pb.rect(33 - st, by + 30, 8, 16, armorD);
    pb.rect(21 + st, by + 44, 10, 4, armor); pb.rect(32 - st, by + 44, 10, 4, armor);
    // gövde
    pb.rect(19, by + 10, 25, 22, armor); pb.rect(20, by + 11, 11, 9, armorL);
    pb.hline(19, 43, by + 21, armorD); pb.vline(31, by + 11, by + 31, armorD);
    pb.poly([[27, by + 14], [31, by + 9], [35, by + 14], [31, by + 22]], ice); pb.set(31, by + 13, '#ffffff');
    // omuzlar
    pb.ellipse(18, by + 12, 6, 5, armorL); pb.ellipse(45, by + 12, 6, 5, armorL);
    pb.poly([[14, by + 9], [16, by + 1], [19, by + 8]], ice); pb.poly([[44, by + 8], [47, by + 0], [49, by + 9]], ice);
    // baş + buz tacı
    const hx = 31, hy = by + 2;
    pb.rect(hx - 6, hy - 4, 13, 10, armor); pb.rect(hx - 6, hy - 5, 13, 2, armorL);
    pb.hline(hx - 4, hx + 4, hy + 1, f.hurt ? '#ffffff' : ice); pb.hline(hx - 4, hx + 4, hy + 2, '#1a2a40');
    for (let i = 0; i < 5; i++) { const x = hx - 6 + i * 3; pb.poly([[x - 1, hy - 5], [x + 0.5, hy - 11 - (i % 2) * 3], [x + 2, hy - 5]], i % 2 ? ice : '#e0faff'); }
    // kalkan (arka kol)
    pb.thick(19, by + 13, 12, by + 24, armorD, 5);
    pb.rect(5, by + 16, 10, 18, armorD); pb.rect(6, by + 17, 8, 16, '#a8d0e8'); pb.disc(10, by + 25, 2.5, ice); pb.set(10, by + 24, '#ffffff');
    // mızrak (ön kol)
    const thrust = f.atk === 2 ? 8 : f.atk === 1 ? -3 : 0;
    const lift = f.atk === 1 ? -8 : 0;
    const handX = 47 + thrust * 0.5, handY = by + 22 + lift;
    pb.thick(44, by + 13, handX, handY, armorD, 5);
    pb.thick(handX - 14 + thrust, handY + 6, handX + 12 + thrust, handY - 10, '#4a6a88', 2);
    const tx = handX + 12 + thrust, ty = handY - 10;
    pb.poly([[tx - 2, ty + 3], [tx + 5, ty - 5], [tx + 2, ty + 2]], ice); pb.set(tx + 3, ty - 3, '#ffffff');
    if (f.atk === 2) pb.line(tx + 2, ty - 2, tx + 8, ty - 8, '#e0faff');
  } },

  // Buz Mührü kristali (Donmuş Muhafız II. faz)
  frost_crystal: { w: 18, h: 28, fx: 'ice', draw: (pb, f) => {
    const g = f.bob;
    pb.ellipse(9, 25, 7, 2, '#2a3a4a');
    pb.poly([[3, 25], [5, 9], [9, 1 + g], [13, 9], [15, 25]], '#5ab8e8');
    pb.poly([[6, 24], [7, 10], [9, 4 + g], [10, 11], [9, 24]], '#c8f0ff');
    pb.vline(8, 7, 22, '#ffffff');
    pb.ring(9, 15, 3.5, f.hurt ? '#ffffff' : '#2a6a9a'); pb.set(9, 15, '#e0faff');
  } },
};

// --------------------------------------------------------------- insansılar (drawHumanoid + özel ekler)
export const HUMANOIDS_V2 = {
  // Kül Avcısı: kül pelerinli, yüzü sarılı nişancı; ateşli yay
  ash_hunter: { w: 24, h: 30, fx: 'ash', look: { skin: '#a88068', helm: { type: 'hood', main: '#4a3a34', trim: '#c85a2a' }, top: '#6a4a3a', topTrim: '#2a201c', pants: '#3a302a', boots: '#2a2020', cape: '#3a3030', tier: 1,
    extra: (pb, f, c) => { pb.hline(c.hx, c.hx + 3, c.hy + 2, '#8a3a2a'); pb.set(c.hx + 2, c.hy, '#ffb040'); held('firebow', '#ff7a2a')(pb, f, c); } } },
  // Yanık Savaşçı: kömürleşmiş zırh, kor çatlakları, ısınmış büyük kılıç
  burnt_warrior: { w: 26, h: 32, fx: 'ash', look: { skin: '#4a3a34', helm: { type: 'helm', main: '#3a3030', trim: '#ff6a2a', horn: true }, build: 'big', top: '#2e2626', topTrim: '#ff6a2a', tier: 2, pants: '#2a2222', boots: '#1e1818',
    extra: (pb, f, c) => { pb.set(c.hx + 2, c.hy, '#ffd060'); pb.set(c.bx + 2, c.by + 3, '#ff8a2a'); pb.set(c.bx + 5, c.by + 6, '#ff6a2a'); pb.line(c.bx + 1, c.by + 2, c.bx + 3, c.by + 5, '#c8401a'); held('greatsword', '#8a4a30', 11)(pb, f, c); } } },
  // Buz Zırhlı Nöbetçi: buz plakalı şövalye, omuz kristalleri, teber
  frost_sentinel: { w: 26, h: 32, fx: 'ice', look: { skin: '#9ab0c0', helm: { type: 'greathelm', main: '#a8c8dc', trim: '#5a7a9a' }, build: 'big', top: '#7a9ab0', topTrim: '#e0faff', tier: 4, pants: '#4a5a6a', boots: '#3a4a5a',
    extra: (pb, f, c) => { pb.poly([[c.bx - 2, c.by], [c.bx - 1, c.by - 4], [c.bx + 1, c.by]], '#9fe8ff'); pb.poly([[c.bx + 6, c.by], [c.bx + 7, c.by - 4], [c.bx + 9, c.by]], '#9fe8ff'); held('halberd', '#c8f0ff', 11)(pb, f, c); } } },
  // Kar Şamanı: kürk cüppe, boynuzlu başlık, buz küreli asa
  snow_shaman: { w: 24, h: 32, fx: 'ice', look: { skin: '#9ab0b8', helm: { type: 'hood', main: '#e8eef4', trim: '#8a7a6a' }, top: '#8a7a6a', topTrim: '#e8eef4', robe: true, tier: 2, boots: '#4a3a2e',
    extra: (pb, f, c) => {
      pb.line(c.hx - 3, c.hy - 4, c.hx - 6, c.hy - 9, '#d8ccb0'); pb.line(c.hx - 5, c.hy - 7, c.hx - 7, c.hy - 7, '#d8ccb0');
      pb.line(c.hx + 2, c.hy - 4, c.hx + 4, c.hy - 9, '#d8ccb0'); pb.line(c.hx + 3, c.hy - 7, c.hx + 6, c.hy - 8, '#d8ccb0');
      pb.set(c.hx + 2, c.hy, '#9fe8ff'); held('icestaff', '#9fe8ff', 10)(pb, f, c);
    } } },
  // Kül Kasabı (elit): iri, önlüklü, zincirli, dev satırlı
  ash_butcher: { w: 28, h: 34, fx: 'ash', look: { skin: '#7a5a4a', hair: '#2a1a14', hairStyle: 'bald', build: 'big', top: '#4a3a34', apron: '#6a3a2e', pants: '#2a2020', boots: '#1e1616', tier: 1, topTrim: '#2a201c',
    extra: (pb, f, c) => {
      pb.set(c.hx + 2, c.hy, '#ff6a2a'); pb.hline(c.hx, c.hx + 3, c.hy + 3, '#2a1414');
      for (let i = 0; i < 4; i++) pb.set(c.bx + 1 + i * 2, c.by + 1 + (i % 2), '#8a8a90');
      pb.set(c.bx + 3, c.by + 8, '#ff7a2a');
      held('cleaver', '#9a9aa0', 10)(pb, f, c);
    } } },
};

export const V2_SCALE = { ash_butcher: 1.45, burnt_warrior: 1.1, frost_sentinel: 1.15 };
