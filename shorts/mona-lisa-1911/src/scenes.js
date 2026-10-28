// Scene timeline. Each scene: { draw(c, t), cam(t) } in 1080x1920 stage space.
const DEF = { x: 540, y: 1130, s: 1 };
function applyCam(c, cam) { c.translate(540, 1130); c.scale(cam.s, cam.s); if (cam.r) c.rotate(cam.r); c.translate(-cam.x, -cam.y); }
function drawScene(c, S, t) { const cam = S.cam ? S.cam(t) : DEF; c.save(); applyCam(c, cam); S.draw(c, t); c.restore(); }
function camRect(cam, r) {
  return { x: 540 + (r.x - cam.x) * cam.s, y: 1130 + (r.y - cam.y) * cam.s, w: r.w * cam.s, h: r.h * cam.s };
}
function lerpCam(a, b, p) { return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), s: a.s * Math.pow(b.s / a.s, p), r: lerp(a.r ?? 0, b.r ?? 0, p) }; }
function eraseAll(c, a) { if (a <= 0) return; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = clamp(a); c.fillRect(0, 0, W, H); c.restore(); }
function crossfade(c, t, t0, t1, A, B) {
  const p = ease(seg(t, t0, t1));
  if (p < 1) drawScene(c, A, t);
  if (p > 0) { eraseAll(c, p); W_(c, () => drawScene(c, B, t), { alpha: p }); }
}
// zoom through a rect of scene A into scene B (B appears inside the rect, then fills the screen)
function zoomThrough(c, t, t0, t1, A, B, rStage, o = {}) {
  let p = ease(seg(t, t0, t1)); if (o.reverse) p = 1 - p;
  const camA = A.cam ? A.cam(t) : DEF;
  const r = camRect(camA, rStage);
  const k = Math.min(r.w / 1080, r.h / 1600);
  const rc = [r.x + r.w / 2, r.y + r.h / 2], sc = [540, 1130];
  const f = [(rc[0] - k * sc[0]) / (1 - k), (rc[1] - k * sc[1]) / (1 - k)];
  const s = Math.pow(k, -p);
  const ba = clamp(p * (o.fadeK ?? 4));
  c.save();
  c.translate(f[0], f[1]); c.scale(s, s); c.translate(-f[0], -f[1]);
  if (p < 0.999) drawScene(c, A, t);
  c.save();
  const clip = new Path2D(); clip.rect(r.x, r.y, r.w, r.h); c.clip(clip);
  if (p < 0.999) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = ba; c.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4); c.restore(); }
  c.translate(rc[0], rc[1]); c.scale(k, k); c.translate(-sc[0], -sc[1]);
  W_(c, () => drawScene(c, B, t), { alpha: ba });
  c.restore();
  if (o.overlay && p < 0.999) o.overlay(c, t, camA, p);
  c.restore();
}
// a newspaper sheet flies at the camera, covering the cut from A to B
function sheetWipe(c, t, t0, t1, A, B, o = {}) {
  const p = seg(t, t0, t1);
  drawScene(c, p < 0.5 ? A : B, t);
  const q = p < 0.5 ? easeIn(p * 2) : 1 - easeOut((p - 0.5) * 2);
  const s = lerp(0.15, 2.6, q);
  const x = p < 0.5 ? lerp(-200, 540, easeOut(p * 2)) : lerp(540, o.endX ?? 1400, easeIn((p - 0.5) * 2));
  const y = p < 0.5 ? lerp(1500, 1130, easeOut(p * 2)) : lerp(1130, o.endY ?? 700, easeIn((p - 0.5) * 2));
  c.save(); c.translate(x, y); c.rotate((p - 0.5) * 0.9); c.scale(s, s);
  c.save(); c.globalCompositeOperation = 'destination-out'; c.fillRect(-300, -400, 600, 800); c.restore();
  newspaper(c, -300, -400, 600, 800, { img: o.img ?? 'frame', k: 3 });
  c.restore();
}

// ============ SCENE 1/2: the gallery ============
const SC_GALLERY = {
  cam(t) {
    if (t < 4.2) return lerpCam({ x: 540, y: 1130, s: 1.0 }, { x: 540, y: 1100, s: 1.06 }, ease(seg(t, 0, 4.2)));
    if (t < 7.9) return lerpCam({ x: 540, y: 1100, s: 1.06 }, { x: 520, y: 1110, s: 1.08 }, ease(seg(t, 4.2, 7.9)));
    return lerpCam({ x: 520, y: 1110, s: 1.08 }, DEF, ease(seg(t, 7.9, 9.9)));
  },
  draw(c, t) {
    gallery(c);
    // right painting gets lifted by guard 2 during the search
    const fx = FR.cx - FR.w / 2, fy = FR.cy - FR.h / 2;
    emptyFrame(c, FR.cx, FR.cy, FR.w, FR.h);
    // question mark in the empty space
    const qa = t < 3.7 ? 1 : 1 - seg(t, 3.7, 4.1);
    if (qa > 0) W_(c, () => questionMark(c, 540, 1000 + Math.sin(t * 3) * 6, 230, { col: COL.goldL, a: 0.85, rot: Math.sin(t * 2) * 0.05 }), { alpha: qa });
    // Picasso appears in the frame (5.15 - 7.6)
    if (t > 5.1 && t < 7.8) {
      const rev = seg(t, 5.12, 5.8), out = 1 - seg(t, 7.25, 7.75);
      c.save();
      const cl = new Path2D(); cl.rect(fx + 44, fy + 44, FR.w - 88, FR.h - 88); c.clip(cl);
      W_(c, () => fill(c, R(fx + 44, fy + 44, FR.w - 88, FR.h - 88), '#d9c49a', { k: 5, gap: 8 }), { alpha: out * rev });
      const dart = Math.floor(t * 2.2) % 2 ? -1 : 0.5;
      W_(c, () => person(c, CAST.picasso, { look: dart, worried: 1, brow: 0.5, mouth: 'wobbly', sweat: seg(t, 6.0, 6.4), armL: [0.1, 0], armR: [0.1, 0] }),
        { x: 540, y: 960 + 555 * 1.28 + 40, s: 1.28, rev, alpha: out });
      c.restore();
      goldFrame(c, fx, fy, FR.w, FR.h);
    }
    // visitor lady (left)
    const ladyX = t < 7.4 ? 170 : lerp(170, -200, ease(seg(t, 7.4, 8.6)));
    if (ladyX > -190) W_(c, () => person(c, CAST.lady, {
      look: 1, mouth: 'o', brow: 1, shock: t < 1.5 ? 1 : 0.3,
      armR: ik(1, 10, -505, 'in'), armL: [0.15, 0.1], walk: t > 7.4 ? t * 9 : null,
    }), { x: ladyX, y: 1760, s: 0.9 });
    // inspector walks in (4.0 - 5.0), questions, leaves (7.5 - 8.6)
    let insX = null;
    if (t > 3.9 && t < 8.8) insX = t < 5.0 ? lerp(-220, 300, ease(seg(t, 3.9, 5.0))) : t < 7.5 ? 300 : lerp(300, -260, ease(seg(t, 7.5, 8.7)));
    if (insX !== null) {
      const writing = t > 6.0 && t < 7.2;
      const pointing = t > 5.2 && t < 6.0;
      W_(c, () => person(c, CAST.inspector, {
        look: t > 7.5 ? -1 : 1, brow: pointing ? 1 : 0, mouth: pointing ? 'talk' : 'flat',
        walk: (t < 5.0 || t > 7.5) ? t * 9 : null,
        armL: ik(-1, 0, -330, 'down'),
        armR: pointing ? ik(1, 230, -560) : writing ? ik(1, 8, -360 + Math.sin(t * 30) * 6, 'down') : ik(1, 30, -320, 'down'),
        holdL: c2 => notebook(c2, 80, 100),
        holdR: c2 => pencilProp(c2, 70, pointing ? 1.2 : -0.5),
      }), { x: insX, y: 1800, s: 0.98 });
      if (t > 5.4 && t < 7.2) W_(c, () => { speech(c, 360, 640, 150, 120, 330, 720); questionMark(c, 360, 640, 100); }, { alpha: pulse(t, 5.4, 7.2) > 0.2 ? 1 : pulse(t, 5.4, 7.2) * 5, y: Math.sin(t * 4) * 4 });
    }
    // guard: shocked -> points -> later searches with magnifier
    let gx = 850, gpose;
    if (t < 1.4) gpose = { armL: ik(-1, -46, -515, 'down'), armR: ik(1, 46, -515, 'down'), mouth: 'o', shock: 1, brow: 1, look: -0.6 };
    else if (t < 4.0) gpose = { armL: lerpArm(ik(-1, -46, -515, 'down'), [1.95, 0.15], ease(seg(t, 1.4, 1.8))), armR: [0.15, 0.1], mouth: 'o', brow: 1, look: -1 };
    else if (t < 7.6) gpose = { armL: [0.2, 0.1], armR: [0.15, 0.1], mouth: 'o', brow: 1, look: -1, worried: 1 };
    else {
      gx = lerp(850, 760, ease(seg(t, 7.8, 8.6)));
      gpose = { armR: [0.15, 0.1], armL: ik(-1, -170, -640), look: -1, lookY: -1, mouth: 'flat', brow: 0.6, walk: t < 8.6 ? t * 9 : null, holdL: c2 => magnifier(c2, 36, -0.4) };
    }
    if (t > 1.4 && t < 2.6) gx = lerp(850, 820, ease(seg(t, 1.4, 2.0)));
    else if (t >= 2.6 && t < 7.8) gx = 820;
    if (t >= 7.8) gx = lerp(820, 740, ease(seg(t, 7.8, 8.6)));
    W_(c, () => person(c, CAST.guard, gpose), { x: gx, y: 1790, s: 0.98 });
    if (t < 1.5) shockLines(c, gx - 10, 1790 - 600 * 0.98, 80, 1 - seg(t, 1.1, 1.5));
    // second guard peeks behind the right-hand painting
    if (t > 8.0) {
      const g2x = lerp(1250, 980, ease(seg(t, 8.0, 8.9)));
      W_(c, () => person(c, CAST.guard2, { look: 1, lookY: -0.6, brow: 1, mouth: 'flat', walk: t < 8.9 ? t * 9 : null, armR: ik(1, 120, -600), armL: [0.2, 0.1] }), { x: g2x, y: 1830, s: 0.92 });
    }
    // staff member hurrying across in the background
    if (t > 8.1 && t < 10.6) {
      const sx = lerp(-120, 1200, seg(t, 8.1, 10.6));
      W_(c, () => person(c, CAST.official, { look: Math.sin(t * 3), mouth: 'o', brow: 1, walk: t * 11, armL: [0.4, -0.3], armR: [0.4, -0.3] }), { x: sx, y: 1600, s: 0.62 });
    }
  },
};
const FRAME_INNER = { x: FR.cx - FR.w / 2 + 44, y: FR.cy - FR.h / 2 + 44, w: FR.w - 88, h: FR.h - 88 };

// newspaper close-up that the frame turns into
const SC_NEWS = {
  draw(c, t) {
    fill(c, R(-100, 300, 1280, 1700), '#d9cdb4', { k: 1, gap: 9 });
    W_(c, () => newspaper(c, -450, -660, 900, 1320, { img: 'frame', k: 1 }), { x: 540, y: 1130, rot: Math.sin(t * 1.5) * 0.015 });
  },
};

// printing press
const SHEET_R = { x: 700, y: 1250, w: 260, h: 380 };
const SC_PRESS = {
  draw(c, t) {
    fill(c, R(-100, 300, 1280, 1700), '#cdbb98', { k: 2, gap: 9 });
    for (let i = 0; i < 3; i++) { blob(c, R(80 + i * 340, 520, 220, 320), '#e8e0c8', { k: 3 + i }); stroke(c, [[190 + i * 340, 520], [190 + i * 340, 840]], { w: 3 }); }
    floor(c, -100, 1180, 1640, 2000, '#9c8a72');
    press(c, 400, 1640, t);
    // operator
    W_(c, () => person(c, Object.assign({}, CAST.peruggia, { coatCol: '#c9b48a', hatCol: '#5a5a5a', mous: 'thin' }), { look: 1, mouth: 'smile', armR: ik(1, 140, -420 + Math.sin(t * 8) * 20), armL: [0.2, 0.1] }), { x: 60, y: 1820, s: 0.82 });
    // output stack
    for (let i = 0; i < 6; i++) blob(c, R(SHEET_R.x + 10 - i * 2, 1600 - i * 12, SHEET_R.w - 20, 12), COL.news, { k: 10 + i, w: 3 });
    // the sheet sitting on top (target of the zoom)
    W_(c, () => newspaper(c, -SHEET_R.w / 2, -SHEET_R.h / 2, SHEET_R.w, SHEET_R.h, { img: 'frame', k: 2 }), { x: SHEET_R.x + SHEET_R.w / 2, y: SHEET_R.y + SHEET_R.h / 2 - (t > 12.1 ? easeIn(seg(t, 12.1, 12.7)) * 700 : 0), rot: t > 12.1 ? seg(t, 12.1, 12.7) * 0.6 : 0 });
    flyingSheets(c, t, 11.9, 1500);
  },
};
function flyingSheets(c, t, t0, y0, n = 7) {
  for (let i = 0; i < n; i++) {
    const st = t0 + i * 0.18; if (t < st) continue;
    const p = (t - st) / 1.6;
    const x = 800 + i * 37 % 200 - p * (200 + i * 60) + Math.sin(p * 6 + i) * 40;
    const y = y0 - p * 1100;
    if (y < 150) continue;
    W_(c, () => newspaper(c, -90, -120, 180, 240, { img: i % 2 ? 'frame' : 'none', k: 20 + i }), { x, y, rot: Math.sin(p * 5 + i) * 0.7, s: 0.9 });
  }
}

// newspapers spreading across Paris; crowds reading
const SC_PARIS = {
  draw(c, t) {
    fill(c, R(-100, 200, 1280, 1300), '#dfe2d6', { k: 30, gap: 10 });
    for (let i = 0; i < 3; i++) stroke(c, spline([[100 + i * 330, 640 + i * 40], [160 + i * 330, 610 + i * 40], [240 + i * 330, 630 + i * 40]], false, 6), { w: 3, a: 0.4 });
    parisRoofs(c, -100, 1180, 1330, { ex: 800 });
    fill(c, R(-100, 1330, 1280, 700), '#c9b99a', { k: 31, gap: 8 });
    // crowd reading newspapers
    crowdRow(c, -60, 1140, 1700, { n: 5, s: 0.72, off: 1, mouth: 'o', pose: i => ({ armL: ik(-1, -30, -380, 'down'), armR: ik(1, 30, -380, 'down'), holdR: c2 => { if (i % 2 === 0) newspaper(c2, -110, -150, 150, 200, { img: 'none', k: 40 + i }); }, look: i % 2 ? 1 : -1 }) });
    crowdRow(c, -100, 1180, 1960, { n: 4, s: 0.95, off: 3, mouth: 'o', pose: i => ({ armL: ik(-1, -20, -400, 'down'), armR: ik(1, 40, -390, 'down'), holdR: c2 => { if (i % 2) newspaper(c2, -120, -160, 160, 210, { img: 'frame', k: 50 + i }); }, look: i % 2 ? -1 : 1, brow: 1 }) });
    // sheets fluttering over the rooftops
    for (let i = 0; i < 9; i++) {
      const p = ((t - 12.6) * 0.32 + i * 0.13) % 1.2;
      const x = -150 + p * 1400, y = 640 + i * 70 % 480 + Math.sin(t * 2 + i) * 40;
      W_(c, () => newspaper(c, -60, -80, 120, 160, { img: 'none', k: 60 + i }), { x, y, rot: Math.sin(t * 3 + i) * 0.5, s: 0.8 + (i % 3) * 0.2 });
    }
  },
};

// crowd staring at the empty space
const SC_CROWD = {
  draw(c, t) {
    gallery(c, { rope: true });
    emptyFrame(c, FR.cx, FR.cy, FR.w, FR.h);
    const kinds = [CAST.gent, CAST.lady, CAST.inspector, CAST.lady2, Object.assign({}, CAST.gent, { hat: 'bowler', hatCol: COL.black, coatCol: '#5a5a6a' })];
    for (let row = 0; row < 2; row++) {
      const n = row ? 4 : 5, y = row ? 1990 : 1760, s = row ? 1.05 : 0.8;
      for (let i = 0; i < n; i++) {
        const P = kinds[(i + row * 2) % kinds.length];
        const x = (row ? 60 : 110) + i * (row ? 320 : 215) + Math.sin(t * 0.8 + i) * 8;
        W_(c, () => backFigure(c, P, Math.sin(t * 2.5 + i * 2) * 5), { x, y, s, rot: Math.sin(t * 1.5 + i) * 0.02 });
      }
    }
  },
};

// ============ SCENE 3: investigation board ============
const BOARD = { x: 150, y: 600, w: 780, h: 600 };
const CARD_A = { x: 760, y: 760, w: 170, h: 210 };
function boardBase(c, t) {
  fill(c, R(-100, 300, 1280, 1700), '#cbbf9e', { k: 70, gap: 9 });
  wainscot(c, -100, 1180, 1430, 1600);
  floor(c, -100, 1180, 1600, 2000, '#8f6e4c');
  board(c, BOARD.x, BOARD.y, BOARD.w, BOARD.h);
}
const SC_BOARD1 = {
  cam(t) { return t < 19.2 ? DEF : lerpCam(DEF, { x: 600, y: 1080, s: 1.12 }, ease(seg(t, 19.2, 19.9))); },
  draw(c, t) {
    boardBase(c, t);
    // centre: sketch of the empty frame
    W_(c, () => { blob(c, R(-95, -120, 190, 240), '#f5efdc', { k: 71, w: 3 }); goldFrame(c, -70, -95, 140, 190, { band: 18, simple: true }); questionMark(c, 0, 0, 80, { col: COL.inkSoft }); pin(c, 0, -110); }, { x: 540, y: 900 });
    const notes = [[300, 720, -0.08], [320, 1060, 0.06], [760, 1080, -0.05], [560, 680, 0.03]];
    notes.forEach(([x, y, r], i) => note(c, x, y, 150, 120, r, i));
    notes.forEach(([x, y], i) => stringLine(c, [540, 900], [x, y], seg(t, 17.2 + i * 0.3, 17.8 + i * 0.3)));
    stringLine(c, [540, 900], [CARD_A.x, CARD_A.y], seg(t, 18.3, 18.9));
    // suspect card: silhouette that turns into Apollinaire
    const rp = ease(seg(t, 19.25, 19.75));
    c.save(); c.translate(CARD_A.x, CARD_A.y);
    blob(c, R(-CARD_A.w / 2, -CARD_A.h / 2, CARD_A.w, CARD_A.h), '#efe6cf', { k: 72, w: 3.5 });
    c.restore();
    portraitCard(c, CARD_A.x, CARD_A.y, CARD_A.w, CARD_A.h, Object.assign({}, CAST.apollinaire, { sil: rp < 0.5 }), { look: -0.5, brow: 1 });
    // desk with lamp, files, inspector scratching his head
    desk(c, 560, 1500, 480);
    deskLamp(c, 640, 1500, 1);
    filePile(c, 900, 1500, 5);
    W_(c, () => person(c, CAST.inspector, { look: -1, lookY: -1, brow: 1, worried: 1, mouth: 'frown', armR: ik(1, 40, -615), armL: [0.15, 0.1] }), { x: 320, y: 1840, s: 0.85 });
    // months passing: clock + blank calendar pages
    const cx = 960, cy = 470 + 0;
    W_(c, () => {
      blob(c, E(0, 0, 70, 70), '#f5efdc', { k: 73, w: 5 });
      for (let i = 0; i < 12; i++) dot(c, Math.cos(i * Math.PI / 6) * 56, Math.sin(i * Math.PI / 6) * 56, 3.5);
      const a = t * 9;
      stroke(c, [[0, 0], [Math.cos(a) * 48, Math.sin(a) * 48]], { w: 4 });
      stroke(c, [[0, 0], [Math.cos(a / 12) * 32, Math.sin(a / 12) * 32]], { w: 6 });
    }, { x: 160, y: 1330, s: 0.95 });
    const flip = (t - 17.0) / 0.45, fi = Math.floor(flip);
    W_(c, () => calendar(c, 0, 0, ' ', flip > 0 && fi < 4 ? flip - fi : 0, ' '), { x: 960, y: 1290, s: 0.75 });
  },
};

// Apollinaire escorted into a police office
const DOOR = { x: 760, y: 1000, w: 240, h: 520 };
const SC_APOLLO = {
  draw(c, t) {
    fill(c, R(-100, 300, 1280, 1700), '#cfc6a2', { k: 80, gap: 9 });
    wainscot(c, -100, 1180, 1380, 1560);
    floor(c, -100, 1180, 1560, 2000, '#937252');
    // door with frosted glass
    const op = pulse(t, 21.5, 22.55);
    blob(c, R(DOOR.x - 16, DOOR.y - 16, DOOR.w + 32, DOOR.h + 16), COL.woodD, { k: 81 });
    fill(c, R(DOOR.x, DOOR.y, DOOR.w, DOOR.h), '#3a3036', { k: 82 });
    W_(c, () => {
      blob(c, R(0, 0, DOOR.w, DOOR.h), COL.wood, { k: 83, gap: 6 });
      blob(c, R(30, 40, DOOR.w - 60, 200), '#dfe6e0', { k: 84, gap: 10 });
      blob(c, R(30, 290, DOOR.w - 60, 190), COL.woodL, { k: 85 });
      dot(c, DOOR.w - 30, 270, 9, COL.gold);
    }, { x: DOOR.x, y: DOOR.y, s: [1 - op * 0.75, 1] });
    // wanted-style notices (no text)
    note(c, 200, 760, 150, 180, -0.05, 3); note(c, 420, 720, 130, 150, 0.06, 4);
    // procession
    const prog = ease(seg(t, 19.7, 22.0));
    const baseX = lerp(80, 760, prog);
    const fade = 1 - seg(t, 21.85, 22.3);
    const walking = t < 22.0;
    const ph = t * 8.5;
    W_(c, () => person(c, CAST.gendarme, { look: 1, walk: walking ? ph + 1 : null, armL: [0.1, 0], armR: [0.1, 0] }), { x: baseX - 250, y: 1830, s: 0.95, alpha: fade });
    W_(c, () => person(c, CAST.apollinaire, {
      look: Math.sin(t * 1.5) > 0 ? -1 : 1, brow: 1, mouth: 'flat', walk: walking ? ph : null,
      armL: ik(-1, -20, -360, 'down'), armR: [0.1, 0.05],
      holdL: c2 => { blob(c2, R(-60, -90, 110, 140), '#f6f1e2', { k: 86, w: 3 }); for (let i = 0; i < 4; i++) stroke(c2, [[-48, -70 + i * 26], [36, -70 + i * 26]], { w: 2, a: 0.4 }); stroke(c2, [[30, -110], [70, -170]], { w: 4, col: COL.inkSoft }); },
    }), { x: baseX, y: 1830, s: 1.0, alpha: fade });
    W_(c, () => person(c, CAST.gendarme, { look: -1, walk: walking ? ph + 2 : null, armL: [0.1, 0], armR: [0.1, 0] }), { x: baseX + 230, y: 1830, s: 0.95, alpha: fade });
  },
};

// ============ SCENE 4: office, notebook, Picasso ============
const NOTE_R = { x: 610, y: 1440, w: 220, h: 150 };
const SC_OFFICE = {
  cam(t) { return DEF; },
  draw(c, t) {
    fill(c, R(-100, 300, 1280, 1700), '#cdbf9a', { k: 90, gap: 9 });
    // window with light
    blob(c, R(380, 560, 320, 380), '#dfe6e0', { k: 91 });
    stroke(c, [[540, 560], [540, 940]], { w: 4 }); stroke(c, [[380, 750], [700, 750]], { w: 4 });
    filePile(c, 900, 1100, 6);
    // Apollinaire seated left (behind desk), inspector right
    W_(c, () => person(c, CAST.apollinaire, { look: 1, brow: 0.5, mouth: t > 23.5 && t < 25.0 ? 'talk' : 'flat', armR: ik(1, 120, -420), armL: [0.15, 0.1] }), { x: 250, y: 1880, s: 1.0 });
    W_(c, () => person(c, CAST.inspector, { look: -1, lookY: 1, brow: 0, mouth: 'flat', armL: ik(-1, -60, -330, 'down'), armR: ik(1, -40, -330 + Math.sin(t * 28) * 5, 'down'), holdR: c2 => pencilProp(c2, 70, -0.9) }), { x: 800, y: 1870, s: 0.98 });
    desk(c, -40, 1560, 1160);
    deskLamp(c, 160, 1560, 1);
    // notebook on the desk
    W_(c, () => {
      blob(c, R(0, 0, NOTE_R.w, NOTE_R.h), '#f6f1e2', { k: 92, w: 3.5 });
      for (let i = 1; i < 6; i++) stroke(c, [[10, i * NOTE_R.h / 6], [NOTE_R.w - 10, i * NOTE_R.h / 6]], { w: 1.8, a: 0.35, col: '#5a6fa0' });
      stroke(c, [[NOTE_R.w / 2, 0], [NOTE_R.w / 2, NOTE_R.h]], { w: 3, a: 0.6 });
    }, { x: NOTE_R.x, y: NOTE_R.y });
    // speech bubble with a tiny sketch of a young man
    if (t > 23.9) W_(c, () => {
      speech(c, 330, 760, 300, 280, 290, 940);
      W_(c, () => head(c, CAST.picasso, { look: 0 }, false), { x: 330, y: 760 + 555 * 0.85 + 30, s: 0.85, mode: 'sketch', rev: seg(t, 24.0, 24.6) });
    }, { alpha: seg(t, 23.9, 24.1) });
  },
};
// lined page where the pencil line becomes Picasso; then his studio
const SC_PICASSO = {
  cam(t) {
    if (t < 26.0) return lerpCam({ x: 480, y: 1200, s: 1.55 }, { x: 540, y: 1130, s: 1.0 }, ease(seg(t, 25.4, 26.3)));
    return lerpCam({ x: 480, y: 1200, s: 1.55 }, { x: 540, y: 1130, s: 1.0 }, ease(seg(t, 25.4, 26.3)));
  },
  draw(c, t) {
    const studio = ease(seg(t, 25.35, 26.0));
    // studio
    if (studio > 0) W_(c, () => {
      fill(c, R(-100, 300, 1280, 1700), '#d9c7a0', { k: 100, gap: 9 });
      floor(c, -100, 1180, 1620, 2000, '#a88866');
      // pinned sketches
      for (let i = 0; i < 4; i++) W_(c, () => {
        blob(c, R(-60, -75, 120, 150), '#f6f1e2', { k: 101 + i, w: 3 });
        stroke(c, [[-40, 40], [-10, -40], [20, 30], [40, -20]], { w: 3, a: 0.6 });
        stroke(c, E(0, -10, 24, 30, 12), { closed: true, w: 2.5, a: 0.5 });
        pin(c, 0, -65, COL.navy);
      }, { x: 100 + i * 150, y: 640 + (i % 2) * 70, rot: (i - 1.5) * 0.08 });
      // easel with an angular canvas
      W_(c, () => {
        tube(c, [[-120, 0], [-40, -760]], 16, COL.woodL, { k: 102 });
        tube(c, [[120, 0], [40, -760]], 16, COL.woodL, { k: 103 });
        blob(c, R(-170, -700, 340, 420), '#e8dcc2', { k: 104, w: 4 });
        blob(c, [[-140, -660], [-20, -690], [-60, -520], [-150, -540]], '#8a6a4a', { k: 105, w: 3 });
        blob(c, [[-20, -690], [130, -660], [90, -500], [-60, -520]], '#7a8aa0', { k: 106, w: 3 });
        blob(c, [[-150, -540], [-60, -520], [-30, -310], [-150, -310]], '#c79a6a', { k: 107, w: 3 });
        blob(c, [[-60, -520], [90, -500], [140, -310], [-30, -310]], '#5f6a5a', { k: 108, w: 3 });
        blob(c, R(-180, -290, 360, 22), COL.woodD, { k: 109 });
      }, { x: 860, y: 1760 });
      // jars
      for (let i = 0; i < 3; i++) blob(c, R(560 + i * 60, 1560, 46, 70), ['#c0643e', '#5f8aa0', '#d7a752'][i], { k: 110 + i, w: 3 });
    }, { alpha: studio });
    // lined notebook page fading out
    if (studio < 1) W_(c, () => {
      fill(c, R(-100, 300, 1280, 1700), '#f6f1e2', { k: 111, gap: 12, base: 0.9 });
      for (let i = 0; i < 26; i++) stroke(c, [[-100, 420 + i * 60], [1180, 420 + i * 60]], { w: 2, a: 0.35, col: '#5a6fa0' });
      stroke(c, [[140, 300], [140, 2000]], { w: 3, col: COL.red, a: 0.5 });
    }, { alpha: 1 - studio });
    // Picasso: sketch line -> full colour
    const insIn = ease(seg(t, 26.55, 27.25));
    const turned = t > 27.0;
    const shrug = ease(seg(t, 27.75, 28.1));
    const q = {
      look: turned ? -1 : 0.2, brow: turned ? 1 : 0.3, mouth: turned ? (t > 27.9 ? 'wobbly' : 'o') : 'flat', worried: turned ? 1 : 0, sweat: seg(t, 27.6, 27.9),
      armR: lerpArm(ik(1, 70, -380, 'down'), [0.45, 1.0], shrug), armL: lerpArm(ik(-1, -50, -400, 'down'), [0.45, 1.0], shrug),
      holdR: shrug < 0.5 ? (c2 => { tube(c2, [[0, 0], [30, -80]], 7, COL.woodL, { k: 112 }); dot(c2, 32, -86, 7, COL.red); }) : null,
    };
    const px = 470, py = 1820, ps = 1.08;
    const fillP = ease(seg(t, 25.35, 25.9));
    if (fillP < 1) W_(c, () => person(c, CAST.picasso, q), { x: px, y: py, s: ps, mode: 'sketch', rev: seg(t, 24.95, 25.45), alpha: 1 - fillP * 0.7 });
    if (fillP > 0) W_(c, () => person(c, CAST.picasso, q), { x: px, y: py, s: ps, alpha: fillP });
    // inspector arrives with notebook
    if (insIn > 0) {
      W_(c, () => person(c, CAST.inspector, { look: 1, brow: 0.6, mouth: t > 27.3 && t < 28.2 ? 'talk' : 'flat', walk: insIn < 1 ? t * 9 : null, armL: ik(-1, 0, -330, 'down'), armR: ik(1, 10, -350, 'down'), holdL: c2 => notebook(c2, 80, 100), holdR: c2 => pencilProp(c2, 70, -0.5) }), { x: lerp(-250, 130, insIn), y: 1860, s: 0.95 });
      if (t > 27.25) W_(c, () => { speech(c, 250, 700, 150, 120, 200, 790); questionMark(c, 250, 700, 100); }, { alpha: seg(t, 27.25, 27.45), y: Math.sin(t * 4) * 4 });
    }
  },
};

// ============ SCENE 5: both cleared ============
const CARD_L = { x: 290, y: 790, w: 210, h: 260 }, CARD_P = { x: 790, y: 790, w: 210, h: 260 };
const CENTER_NOTE = { x: 540, y: 1060 };
const SC_BOARD2 = {
  cam(t) { return DEF; },
  draw(c, t) {
    boardBase(c, t);
    const cx = CENTER_NOTE.x, cy = CENTER_NOTE.y;
    // strings: crossed out then dropped
    const strA = 1 - seg(t, 30.9, 31.4);
    const sag = seg(t, 30.9, 31.4) * 120;
    if (strA > 0) W_(c, () => {
      for (const C of [CARD_L, CARD_P]) {
        const a = [cx, cy], b = [C.x, C.y];
        stroke(c, spline([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 26 + sag], b], false, 10), { w: 4, col: COL.red });
        scribbleX(c, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 22 + sag * 0.6, 46, seg(t, C === CARD_L ? 30.0 : 30.45, C === CARD_L ? 30.45 : 30.9));
      }
    }, { alpha: strA });
    W_(c, () => { blob(c, R(-95, -120, 190, 240), '#f5efdc', { k: 120, w: 3 }); goldFrame(c, -70, -95, 140, 190, { band: 18, simple: true }); questionMark(c, 0, 0, 80, { col: COL.inkSoft }); pin(c, 0, -110); }, { x: cx, y: cy, s: 1 + pulse(t, 32.2, 32.9) * 0.08 });
    // cards drop into the folder
    const folderX = 540, folderY = 1680;
    const cardPos = (C, i) => {
      const p = easeIn(seg(t, 31.3 + i * 0.12, 31.95 + i * 0.12));
      return { x: lerp(C.x, folderX + (i ? 30 : -30), p), y: lerp(C.y, folderY - 120, p), r: lerp(i ? 0.05 : -0.05, i ? 0.4 : -0.3, p), s: lerp(1, 0.55, p), a: 1 - seg(t, 31.85 + i * 0.12, 32.05 + i * 0.12) };
    };
    desk(c, 180, 1640, 720);
    const fo = seg(t, 32.05, 32.35);
    folder(c, folderX, folderY, 330, 200, 1 - fo);
    [[CARD_L, CAST.apollinaire], [CARD_P, CAST.picasso]].forEach(([C, P], i) => {
      const k = cardPos(C, i);
      if (k.a > 0) W_(c, () => portraitCard(c, 0, 0, C.w, C.h, P, { look: i ? -0.5 : 0.5, mouth: 'flat' }), { x: k.x, y: k.y, rot: k.r, s: k.s, alpha: k.a });
    });
  },
};
const SC_EMPTYWALL = {
  cam(t) { return lerpCam({ x: 540, y: 1060, s: 1.0 }, { x: 540, y: 1130, s: 1.0 }, ease(seg(t, 33.0, 34.0))); },
  draw(c, t) {
    gallery(c);
    emptyFrame(c, FR.cx, FR.cy, FR.w, FR.h);
    W_(c, () => questionMark(c, 540, 1000 + Math.sin(t * 3) * 6, 230, { col: COL.goldL, a: 0.85 }), { alpha: seg(t, 33.2, 33.6) });
  },
};

// ============ SCENE 6: the real thief ============
const SC_CORRIDOR = {
  draw(c, t) {
    corridor(c, (t - 34) * 0.25, t);
    const p = ease(seg(t, 34.3, 36.7));
    const s = lerp(0.42, 1.12, p), y = lerp(1330, 1860, p);
    const color = ease(seg(t, 35.1, 36.2));
    const q = { look: 0, mouth: 'flat', brow: 0, walk: t * 7, armL: [0.1, 0], armR: [0.2, 0.1], holdR: c2 => { blob(c2, R(-40, 0, 80, 60), COL.brown, { k: 130 }); stroke(c2, spline([[-30, 0], [0, -30], [30, 0]], false, 5), { w: 5 }); } };
    if (color < 1) W_(c, () => person(c, CAST.peruggia, q), { x: 540, y, s, mode: 'sil', alpha: 1 - color });
    if (color > 0) W_(c, () => person(c, CAST.peruggia, Object.assign({}, q, { mouth: 'smile', look: Math.sin(t * 1.3) })), { x: 540, y, s, alpha: color });
  },
};
// file photo of Peruggia
const SC_PORTRAIT = {
  cam(t) { return lerpCam({ x: 540, y: 1130, s: 1.0 }, { x: 540, y: 1100, s: 1.08 }, ease(seg(t, 36.7, 38.6))); },
  draw(c, t) {
    fill(c, R(-100, 300, 1280, 1700), '#c9b48a', { k: 140, gap: 8 });
    // dossier folder
    W_(c, () => { blob(c, R(-430, -560, 860, 1120), '#d9c08a', { k: 141 }); blob(c, R(-380, -520, 760, 1040), '#f2ead6', { k: 142 }); }, { x: 540, y: 1150, rot: -0.03 });
    for (let i = 0; i < 6; i++) stroke(c, [[230, 1430 + i * 40], [850 - h1(i) * 120, 1430 + i * 40]], { w: 2.5, a: 0.4 });
    // photo
    W_(c, () => {
      blob(c, R(-260, -330, 520, 640), '#efe6cf', { k: 143, w: 4 });
      c.save(); const cl = new Path2D(); cl.rect(-235, -305, 470, 560); c.clip(cl);
      fill(c, R(-235, -305, 470, 560), '#c8b08a', { k: 144, gap: 8 });
      W_(c, () => person(c, CAST.peruggia, { look: 0, mouth: 'flat', brow: 0.2, blink: Math.floor(t * 10) % 31 === 0 }), { x: 0, y: -60 + 555 * 1.45 + 60, s: 1.45 });
      c.restore();
      stroke(c, R(-235, -305, 470, 560), { closed: true, w: 3.5 });
      // paper clip
      stroke(c, spline([[150, -350], [150, -250], [180, -250], [180, -370], [125, -370], [125, -270]], false, 5), { w: 5, col: COL.charL });
    }, { x: 540, y: 1040, rot: 0.02 });
    // small Italian tricolour ribbon
    const rb = ease(seg(t, 38.0, 38.4));
    if (rb > 0) W_(c, () => {
      blob(c, R(-60, -14, 40, 28), '#4f8a5a', { k: 145, w: 3 });
      blob(c, R(-20, -14, 40, 28), COL.white, { k: 146, w: 3 });
      blob(c, R(20, -14, 40, 28), '#c0443a', { k: 147, w: 3 });
    }, { x: 760, y: 1390, rot: -0.15, s: rb * 1.4 });
  },
};
// silhouette in a lit doorway, now carrying the covered painting
const DOORWAY = { x: 360, y: 820, w: 360, h: 760 };
const SC_CARRY = {
  draw(c, t) {
    fill(c, R(-100, 300, 1280, 1700), '#5a4a4e', { k: 150, gap: 7, base: 0.7 });
    fill(c, R(DOORWAY.x, DOORWAY.y, DOORWAY.w, DOORWAY.h), '#f6dc94', { k: 151, gap: 10, base: 0.8 });
    stroke(c, R(DOORWAY.x, DOORWAY.y, DOORWAY.w, DOORWAY.h), { closed: true, w: 6 });
    fill(c, [[DOORWAY.x, DOORWAY.y + DOORWAY.h], [DOORWAY.x + DOORWAY.w, DOORWAY.y + DOORWAY.h], [DOORWAY.x + DOORWAY.w + 260, 1950], [DOORWAY.x - 260, 1950]], '#e8c77a', { a: 0.55, hatch: false, base: 1 });
    const carry = ease(seg(t, 38.75, 39.3));
    const walk = ease(seg(t, 39.2, 40.4));
    W_(c, () => person(c, CAST.peruggia, {
      walk: t > 39.2 ? t * 7 : null,
      armL: [0.1, 0], armR: lerpArm([0.15, 0.1], ik(1, 70, -360, 'down'), carry),
      holdR: carry > 0 ? (c2 => W_(c2, () => wrappedPainting(c2, 160, 220), { rev: carry, x: 10, y: -20, rot: 0.1 })) : null,
    }), { x: lerp(540, 560, walk), y: lerp(1640, 1560, walk), s: lerp(1.0, 0.75, walk), mode: 'sil' });
  },
};

// ============ SCENE 7: the apartment ============
const WIN = { x: 640, y: 600, w: 300, h: 420 };
const SC_APART = {
  cam(t) {
    if (t < 44.0) return DEF;
    return lerpCam(DEF, { x: 660, y: 930, s: 1.28 }, ease(seg(t, 44.0, 45.2)));
  },
  draw(c, t) {
    apartment(c, t, { wx: WIN.x, wy: WIN.y });
    // door (left)
    const dOpen = pulse(t, 39.9, 40.9);
    blob(c, R(30, 960, 240, 500), '#3a3036', { k: 160 });
    W_(c, () => { blob(c, R(0, 0, 240, 500), COL.wood, { k: 161, gap: 6 }); dot(c, 210, 260, 9, COL.gold); }, { x: 30, y: 960, s: [1 - dOpen * 0.8, 1] });
    // calendar on the wall
    const yr = t < 44.6 ? '1911' : t < 45.5 ? '1912' : '1913';
    const tearA = seg(t, 44.25, 44.6), tearB = seg(t, 45.15, 45.5);
    W_(c, () => {
      if (t < 44.6) calendar(c, 0, 0, '1911', tearA, '1912');
      else if (t < 45.5) calendar(c, 0, 0, '1912', tearB, '1913');
      else calendar(c, 0, 0, '1913', 0);
    }, { x: 470, y: 760, s: 0.9 });
    // small table with coffee
    blob(c, R(820, 1330, 220, 20), COL.woodL, { k: 162 });
    tube(c, [[850, 1350], [850, 1470]], 10, COL.woodD, { k: 163 }); tube(c, [[1010, 1350], [1010, 1470]], 10, COL.woodD, { k: 164 });
    // trunk
    const lid = t < 40.9 ? 0 : t < 41.6 ? ease(seg(t, 40.9, 41.15)) : 1 - ease(seg(t, 41.45, 41.7));
    trunk(c, 420, 1700, 400, 210, lid);
    // cat sleeping on the rug
    W_(c, () => {
      blob(c, E(0, 0, 70, 34), '#8a7a6a', { k: 165 });
      blob(c, E(58, -16, 28, 24), '#8a7a6a', { k: 166 });
      blob(c, [[44, -34], [50, -54], [60, -36]], '#8a7a6a', { k: 167, w: 3 });
      blob(c, [[64, -36], [74, -54], [78, -32]], '#8a7a6a', { k: 168, w: 3 });
      stroke(c, [[52, -16], [60, -16]], { w: 3 }); stroke(c, [[66, -16], [74, -16]], { w: 3 });
      stroke(c, spline([[-70, 0], [-100, -10 + Math.sin(t * 2) * 8], [-110, -40]], false, 6), { w: 7, col: '#8a7a6a' });
    }, { x: 860, y: 1760, s: 1 + Math.sin(t * 2.2) * 0.015 });
    // Peruggia: enters with the package, stores it, then sits on the trunk
    let px, py = 1840, ps = 0.98, q;
    if (t < 41.0) {
      const p = ease(seg(t, 40.2, 41.0)); px = lerp(150, 330, p);
      q = { look: 1, walk: p < 1 ? t * 8 : null, armR: ik(1, 60, -380, 'down'), armL: [0.1, 0], holdR: c2 => wrappedPainting(c2, 150, 200) };
    } else if (t < 41.8) {
      px = 330;
      const dn = ease(seg(t, 41.0, 41.35));
      q = { look: 1, lookY: 1, armR: ik(1, 90, lerp(-380, -250, dn), 'down'), armL: ik(-1, 40, lerp(-380, -260, dn), 'down'), holdR: t < 41.4 ? (c2 => wrappedPainting(c2, 150, 200)) : null };
    } else {
      // sitting on the trunk with coffee
      px = 420; py = 1784;
      const sip = pulse((t - 41.8) % 2.2, 0.8, 1.6);
      q = { look: Math.sin(t * 0.9) * 0.6, mouth: 'smile', blink: Math.floor(t * 4) % 9 === 0, armL: [0.15, 0.1], armR: lerpArm(ik(1, 60, -400, 'down'), ik(1, 14, -505), sip), holdR: c2 => { blob(c2, R(-18, -36, 36, 36), COL.white, { k: 169, w: 3 }); stroke(c2, E(22, -20, 10, 12, 10, -1.5, 1.5), { w: 3 }); } };
    }
    W_(c, () => {
      if (t >= 41.8) { c.save(); const cl = new Path2D(); cl.rect(-400, -900, 800, 620); c.clip(cl); person(c, CAST.peruggia, q); c.restore(); }
      else person(c, CAST.peruggia, q);
    }, { x: px, y: py, s: ps });
    if (t >= 41.8) { tube(c, [[380, 1500], [340, 1560], [330, 1680]], 40, CAST.peruggia.pantsCol, { k: 170 }); tube(c, [[460, 1500], [470, 1570], [480, 1680]], 40, CAST.peruggia.pantsCol, { k: 171 }); blob(c, E(345, 1690, 30, 13), COL.black, { k: 172 }); blob(c, E(495, 1690, 30, 13), COL.black, { k: 173 }); }
  },
};
// left side of the split screen: the world searching
const SC_SEARCH = {
  draw(c, t) {
    fill(c, R(-100, 200, 1280, 1300), '#dfe2d6', { k: 180, gap: 10 });
    parisRoofs(c, -100, 1180, 1250, { ex: 300 });
    fill(c, R(-100, 1250, 1280, 800), '#c9b99a', { k: 181, gap: 8 });
    W_(c, () => person(c, CAST.inspector, { look: -1, lookY: 1, brow: 1, mouth: 'flat', walk: t * 7, armR: ik(1, 60, -300), armL: [0.15, 0.1], holdR: c2 => magnifier(c2, 40, 2.6) }), { x: 400 + Math.sin(t * 0.8) * 60, y: 1780, s: 1.0 });
    W_(c, () => person(c, CAST.gendarme, { look: 1, brow: 1, mouth: 'o', armL: ik(-1, -90, -560), armR: [0.15, 0.1] }), { x: 160, y: 1700, s: 0.75 });
    for (let i = 0; i < 6; i++) {
      const p = ((t - 41.5) * 0.35 + i * 0.19) % 1.1;
      W_(c, () => newspaper(c, -70, -95, 140, 190, { img: i % 2 ? 'frame' : 'none', k: 190 + i }), { x: 120 + i * 80 + Math.sin(t + i) * 30, y: 1300 - p * 900, rot: Math.sin(t * 2 + i) * 0.5, s: 0.85 });
    }
  },
};

// ============ SCENE 8: train, Florence, the dealer ============
const TWIN = { x: 190, y: 640, w: 700, h: 560 };
const SC_TRAIN = {
  cam(t) { return { x: 540, y: 1130 + Math.sin(t * 9) * 2, s: 1 }; },
  draw(c, t) {
    trainInterior(c, t);
    c.save(); const cl = new Path2D(); cl.rect(-100, 0, 1300, 1330);
    c.restore();
    W_(c, () => {
      c.save(); const cl2 = new Path2D(); cl2.rect(-500, -1000, 1000, 700); c.clip(cl2);
      person(c, CAST.peruggia, { look: -1, lookY: -0.3, mouth: 'flat', armL: ik(-1, -20, -330, 'down'), armR: ik(1, 40, -330, 'down') });
      c.restore();
    }, { x: 860, y: 1790, s: 1.05 });
    W_(c, () => wrappedPainting(c, 190, 240), { x: 870, y: 1560, rot: -0.08 });
  },
};
const SHOPFRONT = { x: 720, y: 1120, w: 240, h: 300 };
const SC_FLORENCE = {
  draw(c, t) {
    florence(c, t);
    // antique shop front
    const S = SHOPFRONT;
    blob(c, R(S.x - 30, S.y - 60, S.w + 60, S.h + 60), '#7a4a3a', { k: 200 });
    const arch = spline([[S.x, S.y + S.h], [S.x, S.y + 60], [S.x + S.w / 2, S.y], [S.x + S.w, S.y + 60], [S.x + S.w, S.y + S.h]], false, 8);
    blob(c, arch.concat([[S.x + S.w, S.y + S.h]]), '#e9dcc0', { k: 201 });
    goldFrame(c, S.x + 60, S.y + 90, 120, 150, { band: 14, simple: true });
    const p = ease(seg(t, 48.6, 49.6));
    W_(c, () => person(c, CAST.peruggia, { look: 1, walk: t * 8, armR: ik(1, 60, -380, 'down'), armL: [0.1, 0], holdR: c2 => wrappedPainting(c2, 150, 200) }), { x: lerp(120, 560, p), y: 1800, s: 0.8 });
  },
};
const SC_SHOP = {
  cam(t) {
    if (t < 52.0) return DEF;
    return lerpCam(DEF, { x: 540, y: 1185, s: 1.91 }, ease(seg(t, 52.0, 53.0)));
  },
  draw(c, t) {
    shop(c, t);
    // dealer behind the counter
    const exam = ease(seg(t, 50.3, 50.8));
    W_(c, () => person(c, CAST.dealer, { look: -1, lookY: 0.5, brow: exam, mouth: t > 50.8 ? 'o' : 'flat', tilt: -0.08 * exam, armL: lerpArm([0.15, 0.1], ik(-1, -170, -420), exam), armR: [0.15, 0.1], holdL: exam > 0.3 ? (c2 => magnifier(c2, 34, -0.5)) : null }), { x: 800, y: 1690, s: 1.0 });
    // counter front
    blob(c, R(-60, 1330, 1200, 40), COL.woodL, { k: 210 });
    blob(c, R(-40, 1370, 1160, 560), COL.wood, { k: 211, gap: 6 });
    for (let i = 0; i < 4; i++) stroke(c, R(10 + i * 280, 1420, 220, 300), { closed: true, w: 3, a: 0.5 });
    // the painting on the counter: unwrapped
    const un = ease(seg(t, 49.9, 50.5));
    W_(c, () => monaLisa(c, 440, 1040, 200, 290), { alpha: un });
    if (un < 1) W_(c, () => wrappedPainting(c, 210, 300), { x: 540 - un * 260, y: 1185 + un * 80, rot: un * -0.4, alpha: 1 - un });
    // glow when found
    const found = seg(t, 52.1, 52.6);
    if (found > 0) for (let i = 0; i < 6; i++) sparkle(c, 540 + Math.cos(i + t) * 150, 1185 + Math.sin(i * 1.7 + t) * 190, 14 + 6 * Math.sin(t * 6 + i), found);
    // Peruggia in front-left
    const arrested = t > 51.5;
    W_(c, () => person(c, CAST.peruggia, { look: arrested ? -1 : 1, brow: arrested ? 1 : 0.3, worried: arrested ? 1 : 0, mouth: arrested ? 'wobbly' : 'smile', armL: [0.15, 0.1], armR: ik(1, 110, -470) }), { x: 230, y: 1960, s: 1.05 });
    // officers arrive calmly from the left
    const off = ease(seg(t, 51.2, 51.9));
    if (off > 0) {
      W_(c, () => person(c, CAST.gendarme, { look: 1, mouth: 'flat', walk: off < 1 ? t * 8 : null, armL: [0.1, 0], armR: [0.1, 0] }), { x: lerp(-300, 20, off), y: 1900, s: 0.95 });
      W_(c, () => person(c, CAST.gendarme, { look: 1, mouth: 'flat', walk: off < 1 ? t * 8 + 1 : null, armL: [0.1, 0], armR: lerpArm([0.1, 0], ik(1, 170, -470), ease(seg(t, 51.8, 52.1))) }), { x: lerp(-200, 120, off), y: 1960, s: 1.0 });
    }
  },
};
// the painting back in the Louvre
const SC_RETURN = {
  cam(t) { return lerpCam({ x: 540, y: 1010, s: 1.0 }, { x: 540, y: 1150, s: 0.94 }, ease(seg(t, 53.0, 54.2))); },
  draw(c, t) {
    gallery(c, { rope: false });
    const fx = FR.cx - FR.w / 2, fy = FR.cy - FR.h / 2;
    monaLisa(c, fx + 44, fy + 44, FR.w - 88, FR.h - 88);
    W_(c, () => goldFrame(c, fx, fy, FR.w, FR.h), { rev: seg(t, 52.95, 53.4) * 1.0 + 0.0 });
    for (let i = 0; i < 4; i++) sparkle(c, 540 + Math.cos(i * 1.6 + t) * 290, 1010 + Math.sin(i * 2.3 + t) * 360, 16, pulse(t, 53.0 + i * 0.1, 54.2));
    W_(c, () => person(c, CAST.official, { look: -1, lookY: -1, mouth: 'smile', brow: 1, armL: ik(-1, -120, -560), armR: [0.15, 0.1] }), { x: 870, y: 1820, s: 0.95 });
    W_(c, () => boxCamera(c, 0, 0, 1), { x: 150, y: 1560, s: 0.9 });
    G.flash = Math.max(G.flash || 0, 0.45 * (1 - seg(t, 53.25, 53.45)) * (t > 53.25 ? 1 : 0), 0.4 * (1 - seg(t, 53.75, 53.95)) * (t > 53.75 ? 1 : 0));
    flash(c, 270, 1450, 70, pulse(t, 53.2, 53.5) + pulse(t, 53.7, 54.0));
  },
};

// ============ SCENE 9: fame ============
const PC_CENTER = { x: 460, y: 1060, w: 160, h: 220 };
const SC_FAME = {
  draw(c, t) {
    fill(c, R(-100, 300, 1280, 1700), '#e2d6bc', { k: 230, gap: 10 });
    const crowd = ease(seg(t, 56.2, 56.9));
    const cards = ease(seg(t, 57.3, 57.9));
    const papersOut = ease(seg(t, 56.2, 56.9));
    // one paper becomes dozens
    const many = seg(t, 54.95, 56.1);
    const N = 26;
    for (let i = N - 1; i >= 1; i--) {
      const ap = back(seg(many, i / N * 0.75, i / N * 0.75 + 0.25));
      if (ap <= 0) continue;
      const ang = i * 2.399, rad = 140 + Math.sqrt(i) * 150;
      const x = 540 + Math.cos(ang) * rad * 0.95, y = 1130 + Math.sin(ang) * rad * 1.2 - papersOut * 900;
      W_(c, () => newspaper(c, -150, -200, 300, 400, { img: i % 3 ? 'mona' : 'none', k: 240 + i }), { x, y, s: 0.62 * ap, rot: Math.sin(i * 3.1) * 0.4 + Math.sin(t + i) * 0.03, alpha: 1 - papersOut * 0.6 });
    }
    // the first newspaper (lands from the wipe)
    const land = easeOut(seg(t, 54.25, 54.9));
    W_(c, () => newspaper(c, -300, -400, 600, 800, { img: 'mona', k: 3 }), { x: 540, y: 1130 - papersOut * 900, s: lerp(2.6, 1.0, land) * (1 - many * 0.35), rot: Math.sin(t * 1.2) * 0.02 });
    // crowds
    if (crowd > 0) {
      W_(c, () => crowdRow(c, -80, 1160, 1560, { n: 6, s: 0.62, off: 2, mouth: 'smile', pose: i => ({ brow: 1, look: Math.sin(i * 2.1) * 0.5 }) }), { y: (1 - crowd) * 700 });
      W_(c, () => crowdRow(c, -120, 1200, 1960, { n: 5, s: 0.88, off: 4, mouth: 'o', pose: i => ({ brow: 1, armR: cards > 0 && i % 2 ? ik(1, 80, -560) : [0.15, 0.1], holdR: cards > 0 && i % 2 ? (c2 => postcard(c2, 0, -60, 90, 120, 0.1, 30 + i)) : null }) }), { y: (1 - crowd) * 900 });
    }
    // postcards fanning out + reproductions on easels
    if (cards > 0) {
      for (const i of [0, 4, 1, 3, 2]) {
        const a = (i - 2) * 0.35 * cards;
        W_(c, () => postcard(c, 0, -230, 160, 220, 0, i), { x: 540, y: 1220, rot: a, s: cards, alpha: 1 });
      }
      for (const [x, s] of [[160, 1], [920, -1]]) W_(c, () => {
        tube(c, [[-60, 0], [-20, -420]], 10, COL.woodL, { k: 250 }); tube(c, [[60, 0], [20, -420]], 10, COL.woodL, { k: 251 });
        monaLisa(c, -80, -400, 160, 230);
        goldFrame(c, -100, -420, 200, 270, { band: 20, simple: true });
      }, { x, y: 1450 + (1 - cards) * 400, s: 0.9 });
    }
  },
};
const SC_VISITORS = {
  cam(t) { return lerpCam({ x: 540, y: 1100, s: 1.0 }, { x: 540, y: 1150, s: 0.96 }, ease(seg(t, 59.0, 60.5))); },
  draw(c, t) {
    gallery(c, { rope: true });
    const fx = FR.cx - FR.w / 2, fy = FR.cy - FR.h / 2;
    monaLisa(c, fx + 44, fy + 44, FR.w - 88, FR.h - 88);
    goldFrame(c, fx, fy, FR.w, FR.h);
    const kinds = [CAST.gent, CAST.lady, CAST.lady2, CAST.inspector, Object.assign({}, CAST.gent, { hat: 'bowler', hatCol: COL.black, coatCol: '#4f5a6a' }), CAST.lady];
    for (let row = 0; row < 2; row++) {
      const n = row ? 4 : 6, y = row ? 2000 : 1770, s = row ? 1.05 : 0.74;
      for (let i = 0; i < n; i++) {
        const x = (row ? 80 : 60) + i * (row ? 310 : 190) + Math.sin(t * 0.9 + i) * 10;
        W_(c, () => backFigure(c, kinds[(i + row * 3) % kinds.length], Math.sin(t * 2.4 + i * 1.9) * 5), { x, y, s });
      }
    }
    G.flash = Math.max(G.flash || 0, 0.3 * (1 - seg(t, 59.1, 59.3)) * (t > 59.1 ? 1 : 0), 0.3 * (1 - seg(t, 59.7, 59.9)) * (t > 59.7 ? 1 : 0));
    flash(c, 880, 1300, 60, pulse(t, 59.05, 59.4));
    flash(c, 200, 1340, 60, pulse(t, 59.65, 60.0));
  },
};

// ============ SCENE 10: final composition ============
const SC_FINAL = {
  cam(t) { return lerpCam({ x: 540, y: 1150, s: 0.96 }, { x: 540, y: 1150, s: 1.0 }, ease(seg(t, 60.3, 65.5))); },
  draw(c, t) {
    gallery(c, { rope: false, noSide: true });
    // doorway on the right with Peruggia in the background
    blob(c, spline([[850, 1520], [850, 1200], [930, 1120], [1010, 1200], [1010, 1520]], false, 6).concat([[1010, 1520]]), '#3f3438', { k: 260 });
    W_(c, () => person(c, CAST.peruggia, { look: -1, lookY: -0.5, mouth: 'flat', armL: [0.15, 0.1], armR: [0.15, 0.1], blink: Math.floor(t * 3) % 7 === 0 }), { x: 930, y: 1525, s: 0.52, alpha: 0.85, rev: seg(t, 60.6, 61.4) });
    const fx = FR.cx - FR.w / 2, fy = FR.cy - FR.h / 2;
    monaLisa(c, fx + 44, fy + 44, FR.w - 88, FR.h - 88);
    goldFrame(c, fx, fy, FR.w, FR.h);
    for (let i = 0; i < 3; i++) sparkle(c, 540 + Math.cos(i * 2.1 + t * 0.7) * 280, 1000 + Math.sin(i * 1.3 + t * 0.7) * 350, 14, 0.5 + 0.5 * Math.sin(t * 3 + i));
    // newspaper pages on the floor
    W_(c, () => newspaper(c, -150, -200, 300, 400, { img: 'frame', k: 270 }), { x: 640, y: 1760 + Math.sin(t * 1.4) * 4, rot: 1.35, s: 0.7, rev: seg(t, 60.5, 61.3) });
    W_(c, () => newspaper(c, -150, -200, 300, 400, { img: 'mona', k: 271 }), { x: 860, y: 1700, rot: -0.3 + Math.sin(t * 1.1) * 0.02, s: 0.62, rev: seg(t, 60.7, 61.5) });
    // young Picasso, sketch-only silhouette on the left
    W_(c, () => person(c, CAST.picasso, { look: 1, mouth: 'flat', brow: 0.4, armL: ik(-1, -10, -360, 'down'), armR: ik(1, 40, -380, 'down'), holdL: c2 => notebook(c2, 90, 110), blink: Math.floor(t * 3) % 9 === 0 }), { x: 190, y: 1840, s: 0.95, mode: 'sketch', rev: seg(t, 60.45, 61.6) });
  },
};

// ============ timeline ============
function renderScenes(c, t) {
  c.save();
  // gentle global camera drift
  c.translate(540, 1130); c.rotate(Math.sin(t * 0.37) * 0.004); c.translate(-540 + Math.sin(t * 0.31) * 4, -1130 + Math.cos(t * 0.27) * 4);
  if (t < 10.2) drawScene(c, SC_GALLERY, t);
  else if (t < 11.25) zoomThrough(c, t, 10.2, 11.2, SC_GALLERY, SC_NEWS, FRAME_INNER);
  else if (t < 12.15) zoomThrough(c, t, 11.3, 12.1, SC_PRESS, SC_NEWS, SHEET_R, { reverse: true });
  else if (t < 12.9) drawScene(c, SC_PRESS, t);
  else if (t < 13.6) { // pan up from the press to the rooftops
    const p = ease(seg(t, 12.9, 13.6));
    c.save(); c.translate(0, p * 1500); drawScene(c, SC_PRESS, t); c.restore();
    c.save(); c.translate(0, -(1 - p) * 1500); drawScene(c, SC_PARIS, t); c.restore();
  }
  else if (t < 14.6) drawScene(c, SC_PARIS, t);
  else if (t < 15.3) sheetWipe(c, t, 14.6, 15.3, SC_PARIS, SC_CROWD);
  else if (t < 16.75) drawScene(c, SC_CROWD, t);
  else if (t < 17.55) zoomThrough(c, t, 16.75, 17.55, SC_CROWD, SC_BOARD1, FRAME_INNER);
  else if (t < 19.75) drawScene(c, SC_BOARD1, t);
  else if (t < 20.45) zoomThrough(c, t, 19.75, 20.45, SC_BOARD1, SC_APOLLO, { x: CARD_A.x - CARD_A.w / 2 + 12, y: CARD_A.y - CARD_A.h / 2 + 12, w: CARD_A.w - 24, h: CARD_A.h - 40 });
  else if (t < 22.55) drawScene(c, SC_APOLLO, t);
  else if (t < 23.35) zoomThrough(c, t, 22.55, 23.35, SC_APOLLO, SC_OFFICE, { x: DOOR.x + 30, y: DOOR.y + 40, w: DOOR.w - 60, h: 200 });
  else if (t < 24.55) drawScene(c, SC_OFFICE, t);
  else if (t < 25.2) zoomThrough(c, t, 24.55, 25.2, SC_OFFICE, SC_PICASSO, NOTE_R);
  else if (t < 28.55) drawScene(c, SC_PICASSO, t);
  else if (t < 29.3) zoomThrough(c, t, 28.55, 29.3, SC_BOARD2, SC_PICASSO, { x: CARD_P.x - CARD_P.w / 2 + 12, y: CARD_P.y - CARD_P.h / 2 + 12, w: CARD_P.w - 24, h: CARD_P.h - 40 }, { reverse: true });
  else if (t < 32.9) drawScene(c, SC_BOARD2, t);
  else if (t < 33.7) zoomThrough(c, t, 32.9, 33.7, SC_BOARD2, SC_EMPTYWALL, { x: CENTER_NOTE.x - 52, y: CENTER_NOTE.y - 77, w: 104, h: 154 });
  else if (t < 34.1) drawScene(c, SC_EMPTYWALL, t);
  else if (t < 34.9) { // pan right into the corridor
    const p = ease(seg(t, 34.1, 34.9));
    c.save(); c.translate(-p * 1080, 0); drawScene(c, SC_EMPTYWALL, t); c.restore();
    c.save(); c.translate((1 - p) * 1080, 0); drawScene(c, SC_CORRIDOR, t); c.restore();
  }
  else if (t < 36.7) drawScene(c, SC_CORRIDOR, t);
  else if (t < 37.0) { // shutter: photo of the worker
    G.flash = 0.7 * (1 - seg(t, 36.7, 37.0));
    crossfade(c, t, 36.7, 36.85, SC_CORRIDOR, SC_PORTRAIT);
  }
  else if (t < 38.55) drawScene(c, SC_PORTRAIT, t);
  else if (t < 38.95) crossfade(c, t, 38.55, 38.95, SC_PORTRAIT, SC_CARRY);
  else if (t < 40.0) drawScene(c, SC_CARRY, t);
  else if (t < 40.5) zoomThrough(c, t, 40.0, 40.5, SC_CARRY, SC_APART, DOORWAY);
  else if (t < 42.0) drawScene(c, SC_APART, t);
  else if (t < 44.4) { // split screen
    const pin_ = ease(seg(t, 42.0, 42.5)), pout = ease(seg(t, 43.9, 44.4));
    const split = pin_ * (1 - pout);
    const xs = lerp(0, 540, split);
    c.save(); const cr = new Path2D(); cr.rect(xs, 0, W, H); c.clip(cr);
    c.translate(lerp(0, 200, split), 0); drawScene(c, SC_APART, t); c.restore();
    if (split > 0) {
      c.save(); const cl = new Path2D(); cl.rect(-10, 0, xs + 10, H); c.clip(cl);
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillRect(-10, 0, xs + 10, H); c.restore();
      c.translate(lerp(-540, -200, split), 0); drawScene(c, SC_SEARCH, t); c.restore();
      stroke(c, [[xs, 420], [xs, 1950]], { w: 7 });
      stroke(c, [[xs + 8, 420], [xs + 8, 1950]], { w: 2.5, a: 0.6 });
    }
  }
  else if (t < 46.45) drawScene(c, SC_APART, t);
  else if (t < 47.15) zoomThrough(c, t, 46.45, 47.15, SC_APART, SC_TRAIN, WIN);
  else if (t < 48.25) drawScene(c, SC_TRAIN, t);
  else if (t < 48.9) zoomThrough(c, t, 48.25, 48.9, SC_TRAIN, SC_FLORENCE, TWIN);
  else if (t < 49.35) drawScene(c, SC_FLORENCE, t);
  else if (t < 49.95) zoomThrough(c, t, 49.35, 49.95, SC_FLORENCE, SC_SHOP, SHOPFRONT);
  else if (t < 52.9) drawScene(c, SC_SHOP, t);
  else if (t < 53.25) crossfade(c, t, 52.9, 53.25, SC_SHOP, SC_RETURN);
  else if (t < 53.85) drawScene(c, SC_RETURN, t);
  else if (t < 54.25) sheetWipe(c, t, 53.85, 54.65, SC_RETURN, SC_FAME, { img: 'mona', endX: 540, endY: 1130 });
  else if (t < 58.4) drawScene(c, SC_FAME, t);
  else if (t < 59.1) zoomThrough(c, t, 58.4, 59.1, SC_FAME, SC_VISITORS, { x: 472, y: 892, w: 136, h: 196 });
  else if (t < 60.3) drawScene(c, SC_VISITORS, t);
  else if (t < 60.9) crossfade(c, t, 60.3, 60.9, SC_VISITORS, SC_FINAL);
  else drawScene(c, SC_FINAL, t);
  c.restore();
}
