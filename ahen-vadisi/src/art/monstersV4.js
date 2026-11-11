// V4 (Gökyarık Ovası / Yıldız Mezarı / Gökyarık Mabedi) yaratık, elit, boss ve iskelet yardımcı sprite'ları.
// V2/V3 ile aynı kare düzeni (idle/walk/atk + hurt0 + die0–die2); ölüm kareleri fırtına kıvılcımı ya da astral toza dağılır.
import { shade } from './pixel.js';

function held(kind, color, len = 8) {
  return (pb, f, ctx) => {
    const [hx, hy] = f.hf;
    const fn = ctx.frameName;
    const dir = fn === 'atk0' ? [-0.3, -1] : fn === 'atk1' ? [1, 0.25] : fn === 'hurt0' ? [-0.6, -1] : [0.45, -1];
    const n = Math.hypot(dir[0], dir[1]);
    const ex = hx + dir[0] / n * len, ey = hy + dir[1] / n * len;
    if (kind === 'spear') {
      pb.line(hx - dir[0] / n * 6, hy - dir[1] / n * 6 + 2, ex, ey, '#4a4a5a');
      pb.poly([[ex - 1, ey + 2], [ex + dir[0] / n * 4, ey + dir[1] / n * 4], [ex + 2, ey + 1]], color); pb.set(ex, ey, '#ffffff');
    }
    if (kind === 'astralbow') {
      pb.line(hx - 1, hy - 7, hx + 2, hy, '#b0a0ff'); pb.line(hx + 2, hy, hx - 1, hy + 7, '#b0a0ff'); pb.vline(hx - 1, hy - 6, hy + 6, '#e0d8ff');
      if (fn === 'atk1' || fn === 'atk0') { pb.hline(hx - 1, hx + 7, hy, '#e0d8ff'); pb.set(hx + 8, hy, color); }
    }
    if (kind === 'orb') { pb.line(hx, hy + 5, ex, ey, '#3a2e5a'); pb.disc(ex, ey - 1, 2.4, color); pb.set(ex, ey - 2, '#ffffff'); pb.set(ex - 3, ey - 4, color); pb.set(ex + 3, ey - 4, color); }
    if (kind === 'stormaxe') {
      pb.thick(hx - dir[0] / n * 3, hy - dir[1] / n * 3, ex, ey, '#2a2a3a', 2);
      pb.poly([[ex - 4, ey - 1], [ex + 2, ey - 5], [ex + 5, ey + 2], [ex - 1, ey + 5]], color); pb.line(ex - 3, ey - 1, ex + 1, ey - 4, '#ffe070');
    }
    if (kind === 'voidblade') { pb.thick(hx, hy, ex, ey, '#2a2440', 3); pb.line(hx + 1, hy, ex + 1, ey, color); pb.set(ex, ey, '#ffffff'); }
    if (kind === 'bonesword') { pb.thick(hx, hy, ex, ey, '#e0d8c4', 1.5); pb.line(hx - 2, hy + 1, hx + 2, hy - 1, '#6a6458'); pb.set(ex, ey, '#ffffff'); }
  };
}

// --------------------------------------------------------------- özel tasarımlar
export const DESIGNS_V4 = {
  // Fırtına Tazısı: ince, uzun bacaklı tazı; sırtında yıldırım yelesi, mavi-gri post
  storm_hound: { w: 34, h: 22, fx: 'storm', draw: (pb, f) => {
    const by = 12 + (f.bob ? 1 : 0) + (f.hurt ? 1 : 0);
    const lunge = f.atk === 2 ? 4 : f.atk === 1 ? -2 : 0;
    const fur = '#5a6a8a', furD = '#3a4660', furL = '#8a9ac0';
    for (let i = 0; i < 2; i++) {
      const o = f.step ? [0, 1, 0, -1][(f.step + i * 2) % 4] * 2 : 0;
      const x = 9 + i * 13 + lunge * (i ? 1 : 0.5);
      pb.line(x, by + 2, x - 1 + o, by + 9, furD); pb.line(x + 2, by + 2, x + 3 - o, by + 9, fur);
      pb.set(x - 1 + o, by + 9, '#1e2230'); pb.set(x + 3 - o, by + 9, '#1e2230');
    }
    pb.ellipse(16 + lunge * 0.5, by, 11, 4.5, furD);
    pb.ellipse(16 + lunge * 0.5, by - 1, 10, 3.5, fur);
    pb.hline(8 + lunge * 0.5, 22 + lunge * 0.5, by - 3, furL);
    // yıldırım yelesi
    for (let x = 9; x < 23; x += 3) pb.line(x + lunge * 0.5, by - 4, x + 1 + lunge * 0.5, by - 7 - ((x + (f.step || 0)) % 2), (x + (f.bob || 0)) % 2 ? '#ffe070' : '#9ad0ff');
    // kuyruk
    pb.line(5, by - 1, 1, by - 5 - (f.bob || 0), furD); pb.set(1, by - 6, '#ffe070');
    // baş
    const hx = 28 + lunge, hy = by - 3 + (f.atk === 1 ? -1 : 0);
    pb.ellipse(hx, hy, 4.5, 3.4, fur); pb.poly([[hx + 2, hy - 1], [hx + 7, hy + 1], [hx + 2, hy + 2]], furD);
    pb.poly([[hx - 2, hy - 3], [hx - 1, hy - 7], [hx + 1, hy - 3]], furD);
    pb.set(hx + 1, hy - 1, f.hurt ? '#ffffff' : '#ffe070');
    if (f.atk === 2) { pb.line(hx + 4, hy + 2, hx + 8, hy + 3, '#ffffff'); pb.set(hx + 6, hy + 3, '#ffe070'); }
  } },

  // Çatlak Kanat: gökyüzü çatlağından çıkmış kristal kanatlı uçan yaratık; çatlak ışığı sızar
  rift_wing: { w: 32, h: 26, fx: 'storm', draw: (pb, f) => {
    const fl = f.step ? (f.step % 2 ? -3 : 2) : (f.bob ? -2 : 1);
    const cy = 11 + (f.hurt ? 1 : 0);
    const wing = '#7a8ac8', wingD = '#4a5a98', crack = '#e8f4ff';
    // kanatlar
    pb.poly([[15, cy], [2, cy - 6 + fl], [5, cy + 3], [13, cy + 3]], wingD);
    pb.poly([[17, cy], [30, cy - 6 + fl], [27, cy + 3], [19, cy + 3]], wingD);
    pb.poly([[15, cy], [4, cy - 4 + fl], [8, cy + 1]], wing); pb.poly([[17, cy], [28, cy - 4 + fl], [24, cy + 1]], wing);
    pb.line(5, cy - 3 + fl, 12, cy + 1, crack); pb.line(27, cy - 3 + fl, 20, cy + 1, crack);
    // gövde
    pb.ellipse(16, cy + 2, 4, 6, '#3a3a6a'); pb.ellipse(16, cy + 1, 2.6, 4.5, '#6a7ac0');
    pb.line(16, cy - 3, 15, cy + 6, crack);
    // baş + gaga
    pb.ellipse(16, cy - 5, 3, 2.6, '#4a4a7a'); pb.poly([[18, cy - 6], [22, cy - 4 + (f.atk ? 1 : 0)], [18, cy - 4]], '#c8c8e0');
    pb.set(17, cy - 6, f.hurt ? '#ffffff' : '#ffe070');
    // kuyruk tüyleri
    pb.line(15, cy + 7, 13, cy + 11, wingD); pb.line(17, cy + 7, 19, cy + 11, wingD);
    if (f.atk === 2) { pb.disc(23, cy - 4, 2, '#ffe070'); pb.set(23, cy - 4, '#ffffff'); }
  } },

  // Gökgürültüsü Golemi: fırtına taşından blok golem; göğsünde şimşek çekirdeği, omuzlarda bulut kıvılcımı
  thunder_golem: { w: 40, h: 40, fx: 'storm', draw: (pb, f) => {
    const b = f.bob, lean = f.hurt ? -2 : f.atk === 2 ? 3 : 0;
    const st = '#5a6070', stD = '#3a3e4a', stL = '#7a8090';
    const cx = 20 + lean, top = 8 + b;
    // bacaklar
    const sw = f.step ? [0, 1, 0, -1][f.step % 4] : 0;
    pb.rect(cx - 9 + sw, top + 22, 6, 10, stD); pb.rect(cx + 3 - sw, top + 22, 6, 10, stD);
    pb.rect(cx - 10 + sw, top + 30, 8, 2, '#2a2e38'); pb.rect(cx + 2 - sw, top + 30, 8, 2, '#2a2e38');
    // gövde
    pb.rect(cx - 11, top + 6, 22, 17, st); pb.rect(cx - 11, top + 6, 22, 3, stL); pb.vline(cx - 11, top + 6, top + 22, stD);
    // çekirdek
    pb.disc(cx, top + 14, 3.6, '#1e2a4a'); pb.disc(cx, top + 14, 2.2, f.hurt ? '#ffffff' : '#ffe070');
    pb.line(cx - 6, top + 10, cx - 2, top + 14, '#9ad0ff'); pb.line(cx + 2, top + 14, cx + 6, top + 19, '#9ad0ff');
    // baş
    pb.rect(cx - 5, top, 10, 7, stD); pb.hline(cx - 3, cx + 2, top + 3, '#ffe070');
    // omuz bulutları
    for (const sx of [-1, 1]) { pb.disc(cx + sx * 12, top + 6, 3.5, '#4a5070'); pb.set(cx + sx * 12, top + 4 - b, '#ffe070'); }
    // kollar (yumruklar)
    const lift = f.atk === 1 ? -6 : f.atk === 2 ? 4 : 0;
    pb.thick(cx - 12, top + 9, cx - 15, top + 24, stD, 4); pb.rect(cx - 18, top + 23, 6, 5, st);
    pb.thick(cx + 12, top + 9, cx + 16, top + 22 + lift, stD, 4); pb.rect(cx + 13, top + 21 + lift, 7, 6, st);
    if (f.atk === 2) { pb.line(cx + 17, top + 28, cx + 20, top + 32, '#ffe070'); pb.line(cx + 14, top + 29, cx + 12, top + 33, '#9ad0ff'); }
  } },

  // Yıldız Paraziti: yıldız kırığına yapışmış hızlı, çok bacaklı böcek; sırtında parlayan yıldız taşı
  star_parasite: { w: 28, h: 18, fx: 'astral', draw: (pb, f) => {
    const by = 11 + (f.bob ? 1 : 0) + (f.hurt ? 1 : 0);
    const lunge = f.atk === 2 ? 3 : f.atk === 1 ? -1 : 0;
    const shell = '#3a3060', shellL = '#6a5aa0';
    for (let i = 0; i < 3; i++) {
      const o = f.step ? [0, 1, 0, -1][(f.step + i) % 4] : 0;
      const x = 7 + i * 6 + lunge * 0.5;
      pb.line(x, by, x - 3 + o, by + 5, '#2a2440'); pb.line(x + 1, by, x + 3 - o, by + 5, '#2a2440');
    }
    pb.ellipse(13 + lunge * 0.5, by - 1, 9, 4, shell); pb.ellipse(12 + lunge * 0.5, by - 2, 7, 2.6, shellL);
    // yıldız taşı
    const sx = 12 + lunge * 0.5, sy = by - 5;
    pb.poly([[sx - 3, sy + 1], [sx, sy - 4], [sx + 3, sy + 1], [sx, sy + 2]], '#ffe8a0'); pb.set(sx, sy - 1, '#ffffff');
    // baş + iğneler
    const hx = 22 + lunge, hy = by - 1;
    pb.ellipse(hx, hy, 3, 2.5, shell); pb.set(hx + 1, hy - 1, f.hurt ? '#ffffff' : '#ffe8a0');
    pb.line(hx + 2, hy + 1, hx + 5 + (f.atk === 2 ? 2 : 0), hy + 2, '#e0d8ff');
    pb.line(hx + 1, hy - 2, hx + 3, hy - 5, '#6a5aa0');
  } },

  // Boşluk Zırhlısı: içi boş, boşlukla dolu dev zırh; kalkan ve kara kılıç
  void_armor: { w: 34, h: 40, fx: 'void', draw: (pb, f) => {
    const b = f.bob, lean = f.hurt ? -2 : f.atk === 2 ? 2 : 0;
    const pl = '#3a3456', plD = '#26203a', plL = '#5a5480', glow = '#b0a0ff';
    const cx = 16 + lean, top = 6 + b;
    const sw = f.step ? [0, 1, 0, -1][f.step % 4] : 0;
    pb.rect(cx - 7 + sw, top + 22, 5, 11, plD); pb.rect(cx + 2 - sw, top + 22, 5, 11, plD);
    pb.rect(cx - 8 + sw, top + 32, 7, 2, '#14101e'); pb.rect(cx + 1 - sw, top + 32, 7, 2, '#14101e');
    pb.rect(cx - 9, top + 8, 18, 15, pl); pb.rect(cx - 9, top + 8, 18, 3, plL); pb.vline(cx, top + 11, top + 22, plD);
    // boşluk sızıntısı
    pb.disc(cx, top + 15, 2.4, '#14101e'); pb.set(cx, top + 15, glow); pb.set(cx - 4, top + 19, glow);
    // miğfer: göz yarığından ışık
    pb.ellipse(cx, top + 4, 5, 5, pl); pb.rect(cx - 5, top + 4, 10, 4, pl); pb.hline(cx - 3, cx + 3, top + 5, '#14101e');
    pb.set(cx - 1, top + 5, f.hurt ? '#ffffff' : glow); pb.set(cx + 2, top + 5, f.hurt ? '#ffffff' : glow);
    pb.poly([[cx - 2, top - 1], [cx, top - 5], [cx + 2, top - 1]], plL);
    // kalkan (arka el)
    pb.rect(cx - 15, top + 10, 6, 13, plD); pb.rect(cx - 14, top + 11, 4, 11, pl); pb.set(cx - 12, top + 16, glow);
    // kılıç (ön el)
    const lift = f.atk === 1 ? -10 : f.atk === 2 ? 6 : 0;
    const hx = cx + 12 + (f.atk === 2 ? 3 : 0), hy = top + 18 + lift;
    pb.thick(cx + 9, top + 10, hx, hy, plD, 3);
    const tx = f.atk === 2 ? hx + 14 : hx + 2, ty = f.atk === 2 ? hy + 6 : hy - 22;
    pb.thick(hx, hy, tx, ty, '#1e1a2e', 2); pb.line(hx + 1, hy, tx + 1, ty, glow);
  } },

  // Enerji Kristali (Fırtına Tiranı): yerden yükselen yıldırım kristali
  storm_crystal: { w: 20, h: 32, fx: 'storm', draw: (pb, f) => {
    const g = f.bob;
    pb.ellipse(10, 29, 8, 2, '#101828');
    pb.poly([[4, 29], [6, 10], [10, 1 + g], [14, 10], [16, 29]], '#3a5a9a');
    pb.poly([[7, 27], [8, 11], [10, 4 + g], [11, 12], [10, 27]], '#9ad0ff');
    pb.line(6, 14, 14, 22, f.hurt ? '#ffffff' : '#ffe070'); pb.line(8, 20, 12, 12, '#ffe070');
    pb.set(10, 6 + g, '#ffffff');
  } },

  // Gök Mührü (Göğün Mahkûmu): havada dönen taş halka, ortada yıldız
  sky_seal: { w: 22, h: 32, fx: 'astral', draw: (pb, f) => {
    const g = f.bob;
    pb.ellipse(11, 30, 8, 2, '#14101e');
    pb.rect(9, 18, 4, 12, '#3a3456');
    pb.ring(11, 11 + g, 7, '#6a5aa0', 2); pb.ring(11, 11 + g, 4, '#b0a0ff');
    pb.disc(11, 11 + g, 2, f.hurt ? '#ffffff' : '#ffe8a0');
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + (f.step || 0) * 0.4; pb.set(11 + Math.round(Math.cos(a) * 8), 11 + g + Math.round(Math.sin(a) * 8), '#ffe8a0'); }
  } },

  // Fırtına Tiranı (boss): göğe yükselen fırtına devi; şimşek taçlı, bulut omuzlu, dev çekiç
  storm_tyrant: { w: 64, h: 72, fx: 'storm', draw: (pb, f) => {
    const b = f.bob, lean = f.hurt ? -3 : f.atk === 2 ? 4 : 0;
    const cx = 30 + lean, top = 10 + b;
    const body = '#3a4466', bodyD = '#262e48', bodyL = '#5a6a9a', bolt = '#ffe070', sky = '#9ad0ff';
    const sw = f.step ? [0, 1, 0, -1][f.step % 4] * 2 : 0;
    // bacaklar
    pb.thick(cx - 8 + sw, top + 34, cx - 10 + sw, top + 56, bodyD, 6); pb.thick(cx + 8 - sw, top + 34, cx + 10 - sw, top + 56, bodyD, 6);
    pb.rect(cx - 15 + sw, top + 55, 11, 4, '#1a1e30'); pb.rect(cx + 5 - sw, top + 55, 11, 4, '#1a1e30');
    // gövde
    pb.poly([[cx - 14, top + 12], [cx + 14, top + 12], [cx + 11, top + 38], [cx - 11, top + 38]], body);
    pb.poly([[cx - 10, top + 13], [cx + 2, top + 13], [cx, top + 34], [cx - 8, top + 34]], bodyL);
    pb.line(cx - 6, top + 16, cx + 2, top + 24, bolt); pb.line(cx + 2, top + 24, cx - 2, top + 30, bolt);
    // bulut omuzlar
    for (const sx of [-1, 1]) { pb.disc(cx + sx * 16, top + 12, 6, '#4a5478'); pb.disc(cx + sx * 15, top + 10, 4, '#6a7aa8'); pb.set(cx + sx * 17, top + 7 - b, bolt); }
    // baş + şimşek taç
    pb.ellipse(cx, top + 5, 6, 6.5, bodyD); pb.ellipse(cx + 1, top + 6, 4.5, 5, body);
    pb.rect(cx - 3, top + 5, 2, 2, '#0e1220'); pb.rect(cx + 2, top + 5, 2, 2, '#0e1220');
    pb.set(cx - 2, top + 5, f.hurt ? '#ffffff' : bolt); pb.set(cx + 3, top + 5, f.hurt ? '#ffffff' : bolt);
    for (const [x0, h] of [[-6, 6], [-2, 9], [2, 7], [6, 5]]) { pb.line(cx + x0, top, cx + x0 + 1, top - h, bolt); pb.set(cx + x0 + 1, top - h - 1, '#ffffff'); }
    // sol kol: açık el, kıvılcım
    pb.thick(cx - 14, top + 15, cx - 20, top + 32, bodyD, 5); pb.disc(cx - 21, top + 33, 3, body);
    if (f.atk === 1) { pb.disc(cx - 23, top + 30, 3.5, sky); pb.set(cx - 23, top + 30, '#ffffff'); }
    // sağ kol + yıldırım çekici
    const lift = f.atk === 1 ? -16 : f.atk === 2 ? 8 : 0;
    const hx = cx + 20 + (f.atk === 2 ? 4 : 0), hy = top + 30 + lift;
    pb.thick(cx + 14, top + 15, hx, hy, bodyD, 5);
    const tx = f.atk === 2 ? hx + 16 : hx + 2, ty = f.atk === 2 ? hy + 8 : hy - 24;
    pb.thick(hx, hy, tx, ty, '#2a2a3a', 3);
    pb.rect(tx - 6, ty - 5, 13, 9, '#5a6070'); pb.hline(tx - 6, tx + 6, ty - 5, '#8a90a0'); pb.line(tx - 4, ty - 2, tx + 4, ty + 2, bolt);
    if (f.atk === 2) { pb.line(tx, ty + 4, tx + 4, ty + 10, bolt); pb.line(tx - 3, ty + 4, tx - 6, ty + 9, sky); }
  } },

  // Göğün Mahkûmu (boss): zincirlenmiş yıldız varlığı; astral beden, kırık zincirler, yıldız taç
  sky_prisoner: { w: 66, h: 74, fx: 'astral', draw: (pb, f) => {
    const b = f.bob, lean = f.hurt ? -3 : f.atk === 2 ? 3 : 0;
    const cx = 32 + lean, top = 10 + b;
    const robe = '#1e1a3a', robeL = '#3a3466', star = '#ffe8a0', astral = '#b0a0ff', chain = '#c8c0e0';
    // astral duman etek
    for (let i = 0; i < 8; i++) {
      const sway = Math.sin(i * 1.3 + (f.step || 0) + b) * 2;
      pb.disc(cx - 11 + i * 3 + sway, top + 52 + (i % 2) * 2, 4 - (i % 3) * 0.6, '#2a2450', 200);
    }
    // beden
    pb.poly([[cx - 11, top + 14], [cx + 11, top + 14], [cx + 17, top + 52], [cx - 17, top + 52]], robe);
    pb.poly([[cx - 7, top + 15], [cx + 3, top + 15], [cx + 5, top + 48], [cx - 9, top + 48]], robeL);
    for (let i = 0; i < 6; i++) pb.set(cx - 8 + ((i * 7) % 16), top + 20 + i * 5, star);
    // zincirler (göğüs ve bileklerde, kırık uçlar)
    for (let x = -12; x <= 12; x += 3) pb.set(cx + x, top + 26 + Math.round(Math.abs(x) / 4), chain);
    // baş: yüzsüz astral ışık, yıldız taç
    pb.ellipse(cx, top + 6, 6, 7, '#2a2450'); pb.ellipse(cx, top + 7, 4, 5, astral);
    pb.disc(cx, top + 7, 1.8, f.hurt ? '#ffffff' : star);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.45; pb.line(cx + Math.round(Math.cos(a) * 7), top + 4 + Math.round(Math.sin(a) * 7), cx + Math.round(Math.cos(a) * 11), top + 4 + Math.round(Math.sin(a) * 11), star); }
    // kollar: zincirli bilekler
    const lift = f.atk === 1 ? -14 : f.atk === 2 ? 8 : 0;
    pb.thick(cx - 10, top + 17, cx - 18, top + 33, robe, 4); pb.ring(cx - 18, top + 33, 2.6, chain); pb.line(cx - 18, top + 36, cx - 22, top + 44, chain);
    const hx = cx + 18 + (f.atk === 2 ? 4 : 0), hy = top + 30 + lift;
    pb.thick(cx + 10, top + 17, hx, hy, robe, 4); pb.ring(hx, hy, 2.6, chain);
    // savrulan zincir (saldırı)
    if (f.atk) {
      const ex = f.atk === 2 ? hx + 20 : hx + 6, ey = f.atk === 2 ? hy + 8 : hy - 18;
      for (let k = 0; k <= 6; k++) pb.set(Math.round(hx + (ex - hx) * k / 6), Math.round(hy + (ey - hy) * k / 6 + (k % 2)), chain);
      pb.disc(ex, ey, 2.4, astral); pb.set(ex, ey, '#ffffff');
    } else pb.line(hx, hy + 3, hx + 3, hy + 12, chain);
  } },

  // İskelet yardımcı (Ölü Çağıran): yeşil ruh ateşi gözlü kemik savaşçı, kemik kılıç ve kırık kalkan
  skeleton_minion: { w: 24, h: 30, fx: 'bone', draw: (pb, f) => {
    const by = 2 + (f.bob ? 1 : 0) + (f.hurt ? 1 : 0);
    const bone = '#e0d8c4', boneD = '#a8a090', soul = '#8ae0a0';
    const sw = f.step ? [0, 1, 0, -1][f.step % 4] : 0;
    // bacaklar
    pb.line(10 + sw, by + 18, 9 + sw * 2, by + 26, boneD); pb.line(13 - sw, by + 18, 14 - sw * 2, by + 26, bone);
    pb.hline(8 + sw * 2, 10 + sw * 2, by + 26, boneD); pb.hline(13 - sw * 2, 15 - sw * 2, by + 26, bone);
    // leğen + omurga + kaburgalar
    pb.hline(9, 14, by + 17, boneD); pb.vline(12, by + 9, by + 17, bone);
    for (let i = 0; i < 3; i++) pb.hline(9, 15, by + 10 + i * 2, i % 2 ? boneD : bone);
    pb.set(12, by + 12, soul);
    // kafatası
    pb.ellipse(12, by + 5, 4, 4, bone); pb.rect(10, by + 7, 5, 2, boneD);
    pb.set(11, by + 5, '#14181a'); pb.set(13, by + 5, '#14181a');
    pb.set(11, by + 4, f.hurt ? '#ffffff' : soul); pb.set(13, by + 4, f.hurt ? '#ffffff' : soul);
    // arka kol + kırık kalkan
    pb.line(9, by + 10, 6, by + 15, boneD); pb.rect(3, by + 12, 4, 6, '#4a5a4a'); pb.set(4, by + 14, soul);
    // ön kol + kemik kılıç
    const fn = f.atk === 1 ? 'atk0' : f.atk === 2 ? 'atk1' : f.hurt ? 'hurt0' : 'idle0';
    const hf = f.atk === 1 ? [13, by + 6] : f.atk === 2 ? [19, by + 13] : [16, by + 14];
    pb.line(15, by + 10, hf[0], hf[1], bone);
    held('bonesword', soul, 8)(pb, { hf }, { frameName: fn });
  } },
};

// --------------------------------------------------------------- insansılar (drawHumanoid + ekler)
export const HUMANOIDS_V4 = {
  // Şimşek Yağmacısı: fırtına yağmacısı; kapüşon, mavi şal, şimşek uçlu mızrak
  lightning_raider: { w: 24, h: 30, fx: 'storm', look: { skin: '#c89878', helm: { type: 'hood', main: '#2e3a5a', trim: '#ffe070' }, top: '#3a4a6a', topTrim: '#ffe070', pants: '#2a3048', boots: '#1e2230', cape: '#4a5a8a', tier: 1,
    extra: (pb, f, c) => { pb.set(c.hx + 2, c.hy, '#ffe070'); held('spear', '#ffe070', 10)(pb, f, c); } } },
  // Astral Avcı: yıldız işlemeli pelerin, astral yay, maske
  astral_hunter: { w: 24, h: 30, fx: 'astral', look: { skin: '#9a90b8', helm: { type: 'hood', main: '#2a2450', trim: '#b0a0ff' }, top: '#3a3466', topTrim: '#ffe8a0', pants: '#26203e', boots: '#1a162a', cape: '#2a2450', tier: 1,
    extra: (pb, f, c) => { pb.hline(c.hx, c.hx + 3, c.hy + 1, '#e0d8ff'); pb.set(c.hx + 2, c.hy, '#ffe8a0'); held('astralbow', '#ffe8a0')(pb, f, c); } } },
  // Yıldız Kâhini: süzülen kâhin; yıldız cübbesi, gözü bağlı, yıldız küre
  star_oracle: { w: 24, h: 32, fx: 'astral', look: { skin: '#c8c0d8', hair: '#e8e0f8', hairStyle: 'long', top: '#2a2450', topTrim: '#ffe8a0', robe: true, tier: 2, boots: '#1a162a',
    helm: { type: 'hat', main: '#1e1a3a', trim: '#ffe8a0' },
    extra: (pb, f, c) => { pb.hline(c.hx - 1, c.hx + 3, c.hy, '#b0a0ff'); for (let i = 0; i < 3; i++) pb.set(c.bx + 2 + i * 2, c.by + 6 + i * 4, '#ffe8a0'); held('orb', '#ffe8a0', 9)(pb, f, c); } } },
  // Fırtına Celladı (elit): fırtına zırhlı dev cellat, şimşek baltası
  storm_executioner: { w: 30, h: 36, fx: 'storm', look: { skin: '#5a6080', helm: { type: 'greathelm', main: '#2e3a5a', trim: '#ffe070' }, build: 'big', top: '#26304a', topTrim: '#ffe070', tier: 4, pants: '#1e2438', boots: '#141826', cape: '#3a4a7a',
    extra: (pb, f, c) => {
      pb.hline(c.hx, c.hx + 3, c.hy, '#9ad0ff');
      pb.poly([[c.bx - 2, c.by], [c.bx - 1, c.by - 5], [c.bx + 1, c.by]], '#ffe070'); pb.poly([[c.bx + 6, c.by], [c.bx + 8, c.by - 5], [c.bx + 9, c.by]], '#ffe070');
      held('stormaxe', '#9ad0ff', 12)(pb, f, c);
    } } },
  // Hiçlik Muhafızı (elit): boşluk taçlı, yıldızsız gece zırhı, boşluk kılıcı
  void_warden: { w: 30, h: 38, fx: 'void', look: { skin: '#3a3456', helm: { type: 'greathelm', main: '#1e1a2e', trim: '#b0a0ff' }, build: 'big', top: '#1a1628', topTrim: '#b0a0ff', tier: 4, pants: '#120e1c', boots: '#0c0a14', cape: '#2a2450',
    extra: (pb, f, c) => {
      pb.hline(c.hx, c.hx + 3, c.hy, '#e0d8ff');
      pb.rect(c.hx - 2, c.hy - 9, 7, 2, '#b0a0ff'); pb.set(c.hx + 1, c.hy - 10, '#ffffff');
      held('voidblade', '#b0a0ff', 13)(pb, f, c);
    } } },
};

export const V4_SCALE = { storm_executioner: 1.5, void_warden: 1.6, lightning_raider: 1.05, star_oracle: 1.05, astral_hunter: 1.05, thunder_golem: 1.05, void_armor: 1.1 };
