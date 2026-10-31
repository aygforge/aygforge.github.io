const DURATION = 67.8;
const SENT = [
  { s: 0.00, e: 8.35, text: '1944’te bir İngiliz havacı, paraşütsüz yaklaşık 5,5 kilometreden düştü… ve hayatta kaldı.' },
  { s: 9.37, e: 15.88, text: 'Nicholas Alkemade, İkinci Dünya Savaşı sırasında bir Lancaster bombardıman uçağında arka nişancıydı.' },
  { s: 16.77, e: 20.66, text: 'Uçak Almanya üzerinde saldırıya uğrayınca alev almaya başladı.' },
  { s: 21.66, e: 27.40, text: 'Alkemade paraşütüne ulaşmaya çalıştı ama paraşütü de yangında kullanılamaz hale gelmişti.' },
  { s: 28.37, e: 33.53, text: 'Önünde iki seçenek vardı: yanan uçakta kalmak ya da paraşütsüz atlamak.' },
  { s: 34.54, e: 39.55, text: 'Alkemade yaklaşık 5,5 kilometre yükseklikten kendini boşluğa bıraktı.' },
  { s: 40.53, e: 47.11, text: 'Aşağıdaki çam ağaçlarının dalları düşüşünü yavaşlattı ve derin kar da darbeyi büyük ölçüde emdi.' },
  { s: 48.11, e: 56.33, text: 'Alman askerleri onun paraşütsüz düştüğüne inanmayınca olay yerini araştırdı ve paraşütünün uçak enkazında kaldığını gördü.' },
  { s: 57.26, e: 61.37, text: 'Alkemade gerçekten de bu inanılmaz düşüşten sağ kurtulmuştu.' },
  { s: 62.19, e: 65.30, text: 'İnanması güç ama bu gerçekten yaşandı.', final: true, split: 63.50 },
];
const SCENES = [
  { s: 0.0, f: scene1 }, { s: 9.0, f: scene2 }, { s: 16.3, f: scene3 }, { s: 21.2, f: scene4 }, { s: 27.9, f: scene5 },
  { s: 34.0, f: scene6 }, { s: 40.6, f: scene7 }, { s: 47.6, f: scene8a }, { s: 51.9, f: scene8b }, { s: 56.8, f: scene9 },
];
// transitions at scene boundaries: [index of incoming scene, start, end, type, extra]
const TRANS = [
  { k: 1, a: 8.5, b: 9.35, type: 'iris', c: [VX + 20, VY - 40] },
  { k: 2, a: 16.05, b: 16.6, type: 'fade' },
  { k: 3, a: 20.95, b: 21.45, type: 'fade' },
  { k: 4, a: 27.6, b: 28.3, type: 'scribble' },
  { k: 5, a: 33.9, b: 34.4, type: 'fade' },
  { k: 6, a: 40.3, b: 40.8, type: 'fade' },
  { k: 7, a: 47.25, b: 48.0, type: 'scribble' },
  { k: 8, a: 51.6, b: 52.15, type: 'slide' },
  { k: 9, a: 56.45, b: 57.1, type: 'scribble' },
];

let main, LA, LB, LM, ca, cb, cm;
function init() {
  main = document.getElementById('c').getContext('2d');
  LA = makeCanvas(W, H); LB = makeCanvas(W, H); LM = makeCanvas(W, H);
  ca = LA.getContext('2d'); cb = LB.getContext('2d'); cm = LM.getContext('2d');
  buildTextures();
}
function drawScene(ctx, k, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, W, H);
  ctx.save(); SCENES[k].f(ctx, t - SCENES[k].s, t); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function sceneIndex(t) { let k = 0; for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i].s) k = i; return k; }

function composeIllustration(t) {
  const tr = TRANS.find(x => t >= x.a && t < x.b);
  if (!tr) { drawScene(ca, sceneIndex(t), t); return LA; }
  const p = (t - tr.a) / (tr.b - tr.a);
  drawScene(ca, tr.k - 1, t); drawScene(cb, tr.k, t);
  ca.setTransform(1, 0, 0, 1, 0, 0);
  if (tr.type === 'fade') { ca.globalAlpha = ease(p); ca.drawImage(LB, 0, 0); ca.globalAlpha = 1; }
  else if (tr.type === 'iris') {
    const r = easeIn(p) * 1500 + 2;
    cm.setTransform(1, 0, 0, 1, 0, 0); cm.clearRect(0, 0, W, H); cm.drawImage(LB, 0, 0);
    cm.globalCompositeOperation = 'destination-in'; cm.fillStyle = '#fff'; cm.fill(rpath(ell(tr.c[0], tr.c[1], r, r, 28), true, 3 + r * 0.01, 77)); cm.globalCompositeOperation = 'source-over';
    ca.drawImage(LM, 0, 0);
    ca.save(); ca.strokeStyle = C.ink; ca.lineWidth = 10; ca.stroke(rpath(ell(tr.c[0], tr.c[1], r, r, 28), true, 3 + r * 0.01, 77)); ca.lineWidth = 4; ca.strokeStyle = '#7E95A8'; ca.stroke(rpath(ell(tr.c[0], tr.c[1], r - 12, r - 12, 28), true, 3, 78)); ca.restore();
  } else if (tr.type === 'scribble') {
    cm.setTransform(1, 0, 0, 1, 0, 0); cm.clearRect(0, 0, W, H); cm.drawImage(LB, 0, 0);
    cm.globalCompositeOperation = 'destination-in';
    cm.strokeStyle = '#fff'; cm.lineCap = 'round'; cm.lineJoin = 'round'; cm.lineWidth = 330;
    const pts = []; const N = 7; for (let i = 0; i <= N; i++) { pts.push([i % 2 ? 1250 : -170, VIEW.t - 150 + i * (VIEW.b - VIEW.t + 300) / N]); }
    const total = pts.length - 1, upto = easeIO(p) * total;
    cm.beginPath(); cm.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= Math.ceil(upto); i++) { const f = Math.min(1, upto - (i - 1)); cm.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); }
    cm.stroke(); cm.globalCompositeOperation = 'source-over';
    ca.drawImage(LM, 0, 0);
  } else if (tr.type === 'slide') {
    const e = easeIO(p);
    cm.setTransform(1, 0, 0, 1, 0, 0); cm.clearRect(0, 0, W, H); cm.drawImage(LA, -e * W, 0); cm.drawImage(LB, (1 - e) * W, 0);
    cm.strokeStyle = C.ink; cm.lineWidth = 8; cm.beginPath(); cm.moveTo((1 - e) * W, 0); cm.lineTo((1 - e) * W, H); cm.stroke();
    ca.clearRect(0, 0, W, H); ca.drawImage(LM, 0, 0);
  }
  return LA;
}

// ---------- captions ----------
function wrap(ctx, text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur); return lines;
}
const CAP = { top: 104, bottom: 470, maxW: 960 };
function layoutCaption(ctx, text, weight = 700) {
  for (let fs = 106; fs >= 50; fs -= 2) {
    ctx.font = `${weight} ${fs}px Caveat`; const lines = wrap(ctx, text, CAP.maxW); const lh = fs * 1.08;
    if (lines.length * lh <= CAP.bottom - CAP.top) return { fs, lines, lh };
  }
  ctx.font = `${weight} 50px Caveat`; return { fs: 50, lines: wrap(ctx, text, CAP.maxW), lh: 54 };
}
const LAYOUT_CACHE = {};
function drawTextReveal(ctx, str, x, y, reveal, color, font, w) {
  ctx.font = font; const tw = ctx.measureText(str).width; const x0 = x - tw / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 20, y - 120, (tw + 40) * reveal, 200); ctx.clip();
  ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(str, x0, y);
  if (w) { ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.strokeText(str, x0, y); }
  ctx.restore();
}
function captions(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < SENT.length; i++) {
    const S = SENT[i]; const next = SENT[i + 1];
    const a0 = Math.max(0, S.s - 0.08), a1 = next ? next.s - 0.1 : DURATION + 1;
    if (t < a0 || t >= a1) continue;
    const fadeOut = next ? 1 - ease(prog(t, a1 - 0.28, a1)) : 1;
    if (S.final) { finalCaption(ctx, t, S, fadeOut); continue; }
    const L = LAYOUT_CACHE[i] || (LAYOUT_CACHE[i] = layoutCaption(ctx, S.text));
    const totalH = L.lines.length * L.lh; const y0 = (CAP.top + CAP.bottom) / 2 - totalH / 2 + L.fs * 0.78;
    const dur = Math.min(0.9, 0.22 * L.lines.length + 0.25); const start = i === 0 ? -0.0001 : a0;
    ctx.globalAlpha = fadeOut;
    L.lines.forEach((ln, j) => {
      const r = i === 0 && j === 0 ? Math.max(0.35, prog(t, start, start + dur / L.lines.length)) : prog(t, start + dur * j / L.lines.length, start + dur * (j + 1) / L.lines.length);
      if (r <= 0) return;
      drawTextReveal(ctx, ln, W / 2, y0 + j * L.lh, easeOut(r), C.ink, `700 ${L.fs}px Caveat`, 0.8);
    });
    ctx.globalAlpha = 1;
  }
}
function finalCaption(ctx, t, S, a) {
  ctx.globalAlpha = a;
  const r1 = prog(t, S.s - 0.08, S.s + 0.45), r2 = prog(t, S.split - 0.06, S.split + 0.6);
  if (r1 > 0) drawTextReveal(ctx, 'İnanması güç ama', W / 2, 236, easeOut(r1), '#77709C', '500 92px Caveat', 0);
  if (r2 > 0) {
    drawTextReveal(ctx, 'bu gerçekten yaşandı.', W / 2, 372, easeOut(r2), '#100D30', '700 122px Caveat', 3.6);
  }
  ctx.globalAlpha = 1;
}

// ---------- frame ----------
function render(t) {
  T = t; BOIL = Math.floor(t * 8);
  const m = main; m.setTransform(1, 0, 0, 1, 0, 0); m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
  m.drawImage(PAPER, 0, 0);
  const L = composeIllustration(t); const lc = L.getContext('2d');
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.globalCompositeOperation = 'destination-out'; lc.drawImage(TOOTH, 0, 0);
  lc.globalCompositeOperation = 'destination-in'; lc.drawImage(MASKS[Math.floor(t * 4) % 3], 0, 0);
  lc.globalCompositeOperation = 'source-over';
  m.drawImage(L, 0, 0);
  // frame ink border
  const fp = windowPath(Math.floor(t * 4) % 3 * 17 + 3, 3.2);
  m.strokeStyle = C.ink; m.lineWidth = 4.5; m.globalAlpha = 0.9; m.stroke(fp); m.globalAlpha = 0.4; m.lineWidth = 1.6; m.stroke(windowPath(Math.floor(t * 4) % 3 * 17 + 9, 4)); m.globalAlpha = 1;
  // grain
  m.globalCompositeOperation = 'multiply'; m.globalAlpha = 0.55; m.drawImage(GRAIN, 0, 0); m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
  captions(m, t);
  // handle
  m.font = '600 44px Caveat'; m.textAlign = 'right'; m.fillStyle = C.ink; m.globalAlpha = t > 61.8 ? 0.95 : 0.72;
  m.fillText('@bugercektenyasandi', 1036, 1888); m.globalAlpha = 1; m.textAlign = 'left';
}
window.render = render;
window.ready = (async () => { await document.fonts.load('700 80px Caveat'); await document.fonts.load('500 80px Caveat'); await document.fonts.load('600 44px Caveat'); init(); return true; })();
