// V3 (Ölü Krallık / Kara Taht) yaratık, elit ve boss sprite'ları — V2 ile aynı kare düzeni
// (idle/walk/atk + hurt0 + die0–die2). Ölüm kareleri: kemik tozu (ölümsüzler) veya hiçlik kıvılcımları.
import { shade } from './pixel.js';

// el silahları (insansı gövdenin ön eline bağlı)
function held(kind, color, len = 8) {
  return (pb, f, ctx) => {
    const [hx, hy] = f.hf;
    const fn = ctx.frameName;
    const dir = fn === 'atk0' ? [-0.3, -1] : fn === 'atk1' ? [1, 0.25] : fn === 'hurt0' ? [-0.6, -1] : [0.45, -1];
    const n = Math.hypot(dir[0], dir[1]);
    const ex = hx + dir[0] / n * len, ey = hy + dir[1] / n * len;
    if (kind === 'bonebow') {
      pb.line(hx - 1, hy - 7, hx + 2, hy, '#c8c0a8'); pb.line(hx + 2, hy, hx - 1, hy + 7, '#c8c0a8'); pb.vline(hx - 1, hy - 6, hy + 6, '#6a6474');
      pb.set(hx - 1, hy - 7, '#ffffff'); pb.set(hx - 1, hy + 7, '#ffffff');
      if (fn === 'atk1' || fn === 'atk0') { pb.hline(hx - 1, hx + 7, hy, '#a8a090'); pb.set(hx + 7, hy, color); pb.set(hx + 8, hy, color); }
    }
    if (kind === 'sword') { pb.thick(hx, hy, ex, ey, color, 2); pb.line(hx - 2, hy + 1, hx + 2, hy - 1, '#3a3036'); pb.set(ex, ey, '#e0e0f0'); }
    if (kind === 'skullstaff') {
      pb.line(hx, hy + 7, ex, ey, '#4a3a3a'); pb.disc(ex, ey - 1, 2.4, '#e0d8c4'); pb.set(ex - 1, ey - 1, '#2a1e2e'); pb.set(ex + 1, ey - 1, '#2a1e2e');
      pb.set(ex, ey - 4, color); pb.set(ex - 2, ey - 3, color); pb.set(ex + 2, ey - 3, color);
    }
    if (kind === 'daggers') {
      pb.thick(hx, hy, hx + dir[0] / n * 5, hy + dir[1] / n * 5, color, 1); pb.set(hx + dir[0] / n * 5, hy + dir[1] / n * 5, '#ffffff');
      const [bx, by] = f.hb; pb.line(bx, by, bx - 3, by - 4, color);
    }
    if (kind === 'greataxe') {
      pb.thick(hx - dir[0] / n * 3, hy - dir[1] / n * 3, ex, ey, '#3a2e28', 2);
      pb.poly([[ex - 4, ey - 1], [ex + 2, ey - 5], [ex + 5, ey + 2], [ex - 1, ey + 5]], color); pb.line(ex - 3, ey - 1, ex + 1, ey - 4, shade(color, 0.4));
    }
    if (kind === 'scythe') {
      pb.line(hx - dir[0] / n * 5, hy - dir[1] / n * 5 + 3, ex, ey, '#3a3230');
      pb.line(ex, ey, ex - 6, ey + 2, color); pb.line(ex - 1, ey + 1, ex - 5, ey + 3, shade(color, -0.3)); pb.set(ex - 6, ey + 2, '#ffffff');
    }
  };
}

// --------------------------------------------------------------- özel tasarımlar
export const DESIGNS_V3 = {
  // Kefen Sürüngeni: kefene sarılı, dört ayak üstünde sürünen ölü; uzun pençeler, mor gözler
  shroud_crawler: { w: 32, h: 20, fx: 'bone', draw: (pb, f) => {
    const by = 13 + (f.bob ? 1 : 0) + (f.hurt ? 1 : 0);
    const lunge = f.atk === 2 ? 4 : f.atk === 1 ? -2 : 0;
    const cloth = '#b8b0a0', clothD = '#7a7266', clothL = '#d8d0c0';
    // bacaklar / pençeler
    for (let i = 0; i < 2; i++) {
      const o = f.step ? [0, 1, 0, -1][(f.step + i * 2) % 4] * 2 : 0;
      const x = 9 + i * 10 + lunge * (i ? 1 : 0.4);
      pb.line(x, by, x - 2 + o, by + 5, '#6a6458'); pb.line(x - 2 + o, by + 5, x - 4 + o, by + 6, '#d8d0bc');
      pb.line(x + 2, by, x + 4 - o, by + 5, '#8a8474'); pb.line(x + 4 - o, by + 5, x + 6 - o, by + 6, '#e8e0cc');
    }
    // gövde: kefen bezi, sarılı şeritler
    pb.ellipse(14 + lunge * 0.5, by - 2, 10, 4.5, clothD);
    pb.ellipse(14 + lunge * 0.5, by - 3, 9, 3.6, cloth);
    for (let x = 7; x < 22; x += 4) pb.line(x + lunge * 0.5, by - 6, x + 2 + lunge * 0.5, by + 1, clothD);
    pb.hline(8 + lunge * 0.5, 19 + lunge * 0.5, by - 5, clothL);
    // sürüklenen kefen ucu
    pb.poly([[4, by - 3], [0, by + 1], [3, by + 2], [6, by - 1]], clothD);
    // baş: alçak, ileri uzanmış
    const hx = 25 + lunge, hy = by - 4 + (f.atk === 1 ? -2 : 0);
    pb.ellipse(hx, hy, 4, 3.2, cloth); pb.hline(hx - 3, hx + 3, hy - 2, clothL);
    const eye = f.hurt ? '#ffffff' : '#c080ff';
    pb.set(hx + 1, hy, eye); pb.set(hx + 3, hy, eye);
    pb.hline(hx, hx + 3, hy + 2, '#2a1e2a');
    if (f.atk === 2) { pb.line(hx + 3, hy + 1, hx + 6, hy + 4, '#e8e0cc'); pb.line(hx + 2, hy + 2, hx + 5, hy + 5, '#e8e0cc'); }
  } },

  // Obsidyen Nöbetçi: obsidyen plakalardan dev zırh-yapı, mor çatlak ışıkları, kaya tokmak
  obsidian_sentinel: { w: 36, h: 42, fx: 'void', draw: (pb, f) => {
    const by = 10 + f.bob + (f.hurt ? 1 : 0);
    const st = f.step ? [0, 1, 0, -1][f.step % 4] : 0;
    const lean = f.hurt ? -2 : 0;
    const ob = '#24202c', obL = '#46405a', obD = '#14101a', glow = '#a070e0';
    // bacaklar
    pb.rect(11 + st + lean, by + 20, 6, 11, obD); pb.rect(20 - st + lean, by + 20, 6, 11, obD);
    pb.rect(10 + st + lean, by + 29, 8, 3, ob); pb.rect(19 - st + lean, by + 29, 8, 3, ob);
    // gövde
    pb.poly([[8 + lean, by + 4], [28 + lean, by + 4], [26 + lean, by + 21], [10 + lean, by + 21]], ob);
    pb.poly([[10 + lean, by + 5], [20 + lean, by + 5], [18 + lean, by + 18], [11 + lean, by + 18]], obL);
    pb.line(14 + lean, by + 8, 20 + lean, by + 16, glow); pb.line(20 + lean, by + 16, 23 + lean, by + 12, glow);
    // omuz kristalleri
    pb.poly([[5 + lean, by + 7], [8 + lean, by - 1], [11 + lean, by + 6]], obL); pb.poly([[25 + lean, by + 6], [29 + lean, by - 2], [31 + lean, by + 7]], obL);
    pb.set(8 + lean, by + 1, glow); pb.set(29 + lean, by, glow);
    // baş: yarık vizör
    pb.rect(14 + lean, by - 5, 9, 9, ob); pb.hline(14 + lean, 22 + lean, by - 5, obL);
    pb.hline(15 + lean, 21 + lean, by - 1, f.hurt ? '#ffffff' : glow);
    // kollar + tokmak
    pb.thick(9 + lean, by + 7, 6 + lean, by + 18, ob, 4);
    const lift = f.atk === 1 ? -10 : f.atk === 2 ? 4 : 0;
    const hx = 30 + lean + (f.atk === 2 ? 3 : 0), hy = by + 16 + lift;
    pb.thick(27 + lean, by + 7, hx, hy, ob, 4);
    pb.vline(hx, hy - 10, hy + 4, '#3a3446');
    pb.rect(hx - 4, hy - 15, 9, 7, obD); pb.hline(hx - 4, hx + 4, hy - 15, obL); pb.set(hx, hy - 12, glow);
  } },

  // Hiçlik Rahibi: süzülen, yüzsüz rahip; parçalı cüppe, avuçlarında hiçlik küresi
  void_priest: { w: 26, h: 34, fx: 'void', draw: (pb, f) => {
    const b = f.bob + (f.step % 2);
    const lean = f.atk === 2 ? 2 : f.hurt ? -2 : 0;
    const cx = 12 + lean, top = 5 + b;
    const robe = '#2a1e3a', robeL = '#46325e', trim = '#c8a050';
    // parçalı cüppe ucu (yere değmez)
    for (let i = 0; i < 5; i++) pb.poly([[cx - 6 + i * 3, top + 20], [cx - 5 + i * 3, top + 26 + (i + f.step) % 3], [cx - 3 + i * 3, top + 20]], robe);
    pb.poly([[cx - 4, top + 6], [cx + 4, top + 6], [cx + 7, top + 22], [cx - 7, top + 22]], robe);
    pb.vline(cx, top + 7, top + 21, trim); pb.poly([[cx - 2, top + 6], [cx + 2, top + 6], [cx + 3, top + 16], [cx - 3, top + 16]], robeL);
    // başlık: içi kapkara, iki ışık
    pb.ellipse(cx, top + 3, 4.5, 4.5, robe); pb.ellipse(cx + 1, top + 4, 3, 3, '#08060c');
    const eye = f.hurt ? '#ffffff' : '#e0c8ff';
    pb.set(cx, top + 4, eye); pb.set(cx + 2, top + 4, eye);
    // kollar + küre
    const ox = f.atk === 2 ? 6 : f.atk === 1 ? 2 : 4, oy = f.atk === 1 ? -4 : 0;
    pb.thick(cx + 3, top + 9, cx + 3 + ox, top + 13 + oy, robe, 2);
    pb.thick(cx - 3, top + 9, cx - 6, top + 14, robe, 2);
    const sx = cx + 5 + ox, sy = top + 13 + oy;
    pb.disc(sx, sy, f.atk ? 3 : 2.4, '#3a1e5a'); pb.disc(sx, sy, f.atk ? 1.8 : 1.3, '#a070e0'); pb.set(sx, sy, '#ffffff');
  } },

  // Mezar Komutanı (boss): yıpranmış kraliyet zırhlı ölü komutan, yırtık pelerin, sırtında lanetli bayrak, dev kılıç
  grave_commander: { w: 62, h: 68, fx: 'bone', draw: (pb, f) => {
    const by = 16 + f.bob + (f.hurt ? 1 : 0);
    const st = f.step ? [0, 2, 0, -2][f.step % 4] : 0;
    const lean = f.hurt ? -3 : f.atk === 2 ? 3 : 0;
    const arm = '#5a5a62', armD = '#3a3a42', armL = '#8a8a94', gold = '#b8903a', bone = '#d8d0bc';
    // bayrak (arkada)
    pb.vline(14 + lean, 2, by + 30, '#3a2e28');
    pb.poly([[15 + lean, 3], [28 + lean, 5 + (f.step % 2)], [27 + lean, 18], [15 + lean, 16]], '#3a1a2a');
    pb.poly([[18 + lean, 6], [24 + lean, 8], [23 + lean, 13], [18 + lean, 12]], '#6a2a4a'); pb.set(21 + lean, 9, '#a070e0');
    // pelerin
    pb.poly([[18 + lean, by + 4], [42 + lean, by + 4], [46 + lean, by + 40], [14 + lean, by + 40]], '#2a1e24');
    for (let x = 16; x < 46; x += 4) pb.poly([[x + lean, by + 38], [x + 2 + lean, by + 44], [x + 3 + lean, by + 38]], '#2a1e24');
    // bacaklar
    pb.rect(22 + st + lean, by + 28, 7, 16, armD); pb.rect(33 - st + lean, by + 28, 7, 16, armD);
    pb.rect(21 + st + lean, by + 41, 9, 4, '#2a2a30'); pb.rect(32 - st + lean, by + 41, 9, 4, '#2a2a30');
    // gövde zırhı
    pb.poly([[20 + lean, by + 4], [42 + lean, by + 4], [40 + lean, by + 30], [22 + lean, by + 30]], arm);
    pb.poly([[22 + lean, by + 6], [31 + lean, by + 6], [30 + lean, by + 26], [23 + lean, by + 26]], armL);
    pb.hline(20 + lean, 42 + lean, by + 4, gold); pb.hline(22 + lean, 40 + lean, by + 29, gold);
    // göğüste kırık kaburgalar
    for (let i = 0; i < 3; i++) pb.hline(28 + lean, 35 + lean, by + 12 + i * 4, bone);
    pb.line(33 + lean, by + 10, 37 + lean, by + 22, '#2a2a30');
    // omuzluklar
    pb.ellipse(19 + lean, by + 6, 6, 4, armD); pb.ellipse(43 + lean, by + 6, 6, 4, armD); pb.hline(14 + lean, 24 + lean, by + 3, gold); pb.hline(38 + lean, 48 + lean, by + 3, gold);
    // kafatası miğfer + taçlı sorguç
    const hx = 31 + lean, hy = by - 6;
    pb.ellipse(hx, hy, 7, 7, armD); pb.ellipse(hx + 1, hy + 1, 4.5, 5, bone);
    pb.rect(hx - 2, hy, 2, 2, '#14101a'); pb.rect(hx + 2, hy, 2, 2, '#14101a');
    const eye = f.hurt ? '#ffffff' : '#c080ff';
    pb.set(hx - 1, hy, eye); pb.set(hx + 3, hy, eye);
    pb.hline(hx - 1, hx + 3, hy + 4, '#3a3036');
    pb.poly([[hx - 6, hy - 5], [hx - 4, hy - 10], [hx - 1, hy - 6], [hx + 1, hy - 11], [hx + 3, hy - 6], [hx + 6, hy - 10], [hx + 7, hy - 5]], gold);
    // kollar + dev kılıç
    pb.thick(21 + lean, by + 8, 16 + lean, by + 24, arm, 4);
    const lift = f.atk === 1 ? -14 : f.atk === 2 ? 6 : 0;
    const handX = 46 + lean + (f.atk === 2 ? 4 : 0), handY = by + 22 + lift;
    pb.thick(41 + lean, by + 8, handX, handY, arm, 4);
    const tipX = f.atk === 2 ? handX + 14 : handX + 4, tipY = f.atk === 2 ? handY + 8 : handY - 26;
    pb.thick(handX, handY, tipX, tipY, '#8a8a9a', 3); pb.line(handX, handY - 1, tipX, tipY - 1, '#c8c8d8');
    pb.thick(handX - 4, handY + 2, handX + 4, handY - 2, gold, 2);
    if (f.atk === 2) pb.line(tipX, tipY, tipX + 3, tipY + 2, '#ffffff');
  } },

  // Kayıp Kral (boss): uzun boylu hayalet kral; kırık taç, kraliyet cübbesi, kara kılıç, ayakları dumana karışır
  lost_king: { w: 64, h: 72, fx: 'void', draw: (pb, f) => {
    const b = f.bob;
    const lean = f.hurt ? -3 : f.atk === 2 ? 3 : 0;
    const cx = 30 + lean, top = 10 + b;
    const robe = '#1e1428', robeL = '#3a2848', robeT = '#c8a050', glow = '#a070e0';
    // duman etek
    for (let i = 0; i < 7; i++) {
      const sway = Math.sin(i * 1.4 + (f.step || 0) + b) * 2;
      pb.disc(cx - 9 + i * 3 + sway, top + 50 + (i % 2) * 2, 4 - (i % 3) * 0.6, '#2a1e3a', 200);
    }
    // cübbe
    pb.poly([[cx - 10, top + 14], [cx + 10, top + 14], [cx + 16, top + 52], [cx - 16, top + 52]], robe);
    pb.poly([[cx - 6, top + 15], [cx + 2, top + 15], [cx + 4, top + 48], [cx - 8, top + 48]], robeL);
    pb.vline(cx - 1, top + 16, top + 50, robeT); pb.hline(cx - 16, cx + 16, top + 52, robeT);
    // kürk yaka
    pb.ellipse(cx, top + 14, 13, 4, '#d8d0c8'); pb.ellipse(cx, top + 13, 11, 2.6, '#f0ece4');
    for (let x = -10; x <= 10; x += 4) pb.set(cx + x, top + 14, '#2a2a2a');
    // baş: soluk yüz, boş göz çukurları
    pb.ellipse(cx, top + 6, 6, 7, '#9a94a8'); pb.ellipse(cx + 1, top + 7, 4.5, 5.5, '#b8b2c4');
    const eye = f.hurt ? '#ffffff' : glow;
    pb.rect(cx - 3, top + 5, 2, 2, '#14101a'); pb.rect(cx + 2, top + 5, 2, 2, '#14101a'); pb.set(cx - 2, top + 5, eye); pb.set(cx + 3, top + 5, eye);
    pb.vline(cx - 4, top + 9, top + 13, '#d8d0c8'); pb.vline(cx + 5, top + 9, top + 13, '#d8d0c8');   // sakal telleri
    // kırık taç
    pb.poly([[cx - 7, top + 1], [cx - 6, top - 5], [cx - 3, top - 1], [cx, top - 7], [cx + 2, top - 2], [cx + 4, top - 4], [cx + 7, top + 1]], robeT);
    pb.clear(cx + 3, top - 4, 2, 2); pb.set(cx, top - 5, '#e0c8ff'); pb.set(cx - 6, top - 3, '#ff6a6a');
    // sol kol: açık avuçta hiçlik
    pb.thick(cx - 9, top + 17, cx - 15, top + 32, robe, 4); pb.disc(cx - 16, top + 33, 2.2, '#9a94a8');
    if (f.atk === 1) { pb.disc(cx - 18, top + 31, 3.5, '#3a1e5a'); pb.disc(cx - 18, top + 31, 2, glow); }
    // sağ kol + kara kılıç
    const lift = f.atk === 1 ? -12 : f.atk === 2 ? 8 : 0;
    const hx = cx + 16 + (f.atk === 2 ? 4 : 0), hy = top + 30 + lift;
    pb.thick(cx + 9, top + 17, hx, hy, robe, 4);
    const tx = f.atk === 2 ? hx + 18 : hx + 3, ty = f.atk === 2 ? hy + 6 : hy - 30;
    pb.thick(hx, hy, tx, ty, '#14101a', 3); pb.line(hx + 1, hy, tx + 1, ty, glow);
    pb.thick(hx - 5, hy + 2, hx + 5, hy - 2, robeT, 2);
    if (f.atk === 2) { pb.line(tx, ty, tx + 4, ty + 1, '#e0c8ff'); pb.line(hx + 4, hy - 4, tx - 2, ty - 6, '#6a3aa0'); }
  } },

  // Lanetli Bayrak (Mezar Komutanı): yere saplanmış yırtık sancak, yakındaki ölümsüzleri güçlendirir
  cursed_banner: { w: 20, h: 36, fx: 'bone', draw: (pb, f) => {
    const w = f.step % 2 || f.bob;
    pb.ellipse(6, 34, 6, 1.6, '#14101a');
    pb.vline(5, 2, 34, '#3a2e28'); pb.set(5, 1, '#c8a050');
    pb.poly([[6, 3], [18, 5 + w], [17, 20], [6, 18]], '#3a1a2a'); pb.poly([[6, 3], [18, 5 + w], [18, 7 + w], [6, 5]], '#5a2a3a');
    pb.poly([[9, 8], [14, 9], [13, 14], [9, 13]], f.hurt ? '#ffffff' : '#a070e0');
    pb.clear(13, 16, 5, 5); pb.poly([[13, 20], [15, 23], [17, 20]], '#3a1a2a');
  } },

  // Kadim mühür (Kayıp Kral II. faz): yerden yükselen kara taş, dönen mor halka
  void_seal: { w: 20, h: 30, fx: 'void', draw: (pb, f) => {
    const g = f.bob;
    pb.ellipse(10, 27, 8, 2, '#14101a');
    pb.poly([[4, 27], [5, 8], [10, 1 + g], [15, 8], [16, 27]], '#2a2434');
    pb.poly([[7, 25], [8, 9], [10, 4 + g], [11, 10], [10, 25]], '#46405a');
    pb.ring(10, 16, 4, f.hurt ? '#ffffff' : '#a070e0'); pb.set(10, 16, '#e0c8ff');
    pb.line(6, 12, 14, 20, '#7a4ac0');
  } },
};

// --------------------------------------------------------------- insansılar (drawHumanoid + ekler)
export const HUMANOIDS_V3 = {
  // Kemik Okçu: kapüşonlu iskelet, kemik yay
  bone_archer: { w: 24, h: 30, fx: 'bone', look: { skin: '#d8d0bc', helm: { type: 'hood', main: '#3a3446', trim: '#6a5a82' }, top: '#4a4458', topTrim: '#2a2434', pants: '#3a3446', boots: '#2a2434', cape: '#2e2a38', tier: 1,
    extra: (pb, f, c) => { pb.set(c.hx + 1, c.hy, '#14101a'); pb.set(c.hx + 3, c.hy, '#14101a'); pb.set(c.hx + 2, c.hy, '#c080ff'); for (let i = 0; i < 3; i++) pb.hline(c.bx + 1, c.bx + 5, c.by + 2 + i * 2, '#d8d0bc'); held('bonebow', '#c080ff')(pb, f, c); } } },
  // Lanetli Muhafız: paslı ağır zırh, kalkan, lanet ışığı sızan vizör
  cursed_guard: { w: 26, h: 32, fx: 'bone', look: { skin: '#8a8a7a', helm: { type: 'greathelm', main: '#5a5a52', trim: '#7a6a3a' }, build: 'big', top: '#4a4a44', topTrim: '#8a7a4a', tier: 4, pants: '#3a3a34', boots: '#2a2a26',
    extra: (pb, f, c) => {
      pb.hline(c.hx, c.hx + 3, c.hy, '#9ae08a');
      const [bx, by] = f.hb; pb.rect(bx - 4, by - 4, 6, 8, '#4a4038'); pb.rect(bx - 3, by - 3, 4, 6, '#6a5a48'); pb.set(bx - 1, by, '#9ae08a');
      held('sword', '#7a7a70', 9)(pb, f, c);
    } } },
  // Mezar Büyücüsü: yırtık mor cüppe, kafatası asa
  grave_mage: { w: 24, h: 32, fx: 'bone', look: { skin: '#b8b0a8', helm: { type: 'hood', main: '#3a2a4a', trim: '#7a4ac0' }, top: '#3a2a4a', topTrim: '#a070e0', robe: true, tier: 2, boots: '#2a1e2a',
    extra: (pb, f, c) => { pb.set(c.hx + 1, c.hy, '#c080ff'); pb.set(c.hx + 3, c.hy, '#c080ff'); pb.vline(c.bx + 3, c.by + 3, c.by + 12, '#e0d8c4'); held('skullstaff', '#a070e0', 10)(pb, f, c); } } },
  // Gölge Avcısı: yüzü sarılı, gölge pelerinli, iki hançer
  shadow_hunter: { w: 24, h: 30, fx: 'void', look: { skin: '#5a5468', helm: { type: 'hood', main: '#1e1a26', trim: '#3a2e4a' }, top: '#26222e', topTrim: '#a070e0', pants: '#1e1a26', boots: '#14101a', cape: '#1a1622', tier: 1,
    extra: (pb, f, c) => { pb.hline(c.hx, c.hx + 3, c.hy + 2, '#14101a'); pb.set(c.hx + 2, c.hy, '#e0c8ff'); pb.set(c.hx + 3, c.hy, '#e0c8ff'); held('daggers', '#c8c0e0')(pb, f, c); } } },
  // Taht Celladı: kara-altın cellat başlığı, dev balta
  throne_executioner: { w: 28, h: 34, fx: 'void', look: { skin: '#6a6070', helm: { type: 'hood', main: '#14101a', trim: '#c8a050' }, build: 'big', top: '#26202e', topTrim: '#c8a050', tier: 4, pants: '#1e1a24', boots: '#14101a',
    extra: (pb, f, c) => { pb.set(c.hx + 1, c.hy, '#ff4040'); pb.set(c.hx + 3, c.hy, '#ff4040'); held('greataxe', '#6a6a7a', 11)(pb, f, c); } } },
  // Kefen Avcısı (elit): kefen sarılı uzun boylu avcı, tırpan
  shroud_hunter: { w: 28, h: 34, fx: 'bone', look: { skin: '#c8c0b0', helm: { type: 'hood', main: '#b8b0a0', trim: '#6a6458' }, build: 'big', top: '#a8a090', topTrim: '#5a5448', tier: 1, pants: '#6a6458', boots: '#3a362e', cape: '#8a8474',
    extra: (pb, f, c) => { pb.set(c.hx + 1, c.hy, '#c080ff'); pb.set(c.hx + 3, c.hy, '#c080ff'); for (let i = 0; i < 4; i++) pb.line(c.bx, c.by + 1 + i * 2, c.bx + 7, c.by + 2 + i * 2, '#7a7266'); held('scythe', '#d8d0e0', 12)(pb, f, c); } } },
  // Obsidyen Celladı (elit): obsidyen plakalı dev cellat, omuz dikenleri, kara balta
  obsidian_executioner: { w: 30, h: 36, fx: 'void', look: { skin: '#3a3446', helm: { type: 'greathelm', main: '#26202e', trim: '#a070e0' }, build: 'big', top: '#1e1a26', topTrim: '#a070e0', tier: 4, pants: '#14101a', boots: '#0e0c12',
    extra: (pb, f, c) => {
      pb.hline(c.hx, c.hx + 3, c.hy, '#e0c8ff');
      pb.poly([[c.bx - 2, c.by], [c.bx - 1, c.by - 5], [c.bx + 1, c.by]], '#46405a'); pb.poly([[c.bx + 6, c.by], [c.bx + 8, c.by - 5], [c.bx + 9, c.by]], '#46405a');
      pb.line(c.bx + 2, c.by + 3, c.bx + 5, c.by + 7, '#a070e0');
      held('greataxe', '#3a3446', 12)(pb, f, c);
    } } },
};

export const V3_SCALE = { cursed_guard: 1.12, throne_executioner: 1.3, shroud_hunter: 1.45, obsidian_executioner: 1.55, shadow_hunter: 1.05 };
