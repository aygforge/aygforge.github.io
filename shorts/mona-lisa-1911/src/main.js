// Compositor: paper + illustration layer (multiplied) + tooth + captions + handle.
const FPS = 30;
const DURATION = 65.5;

const CAPTIONS = [
  { t: 0.0, text: '1911’de Mona Lisa Louvre Müzesi’nden çalındı… ve polis Pablo Picasso’dan bile şüphelendi.' },
  { t: 7.92, text: 'Tablonun kaybolduğu fark edildiğinde müze alarma geçti ve olay kısa sürede bütün Fransa’nın konuştuğu bir skandala dönüştü.' },
  { t: 16.9, text: 'Polis aylarca hırsızı aradı ve ünlü şair Guillaume Apollinaire’i gözaltına aldı.' },
  { t: 23.45, text: 'Apollinaire’in ifadesi üzerine genç Pablo Picasso da soruşturmaya dahil edildi.' },
  { t: 28.72, text: 'Ama ikisinin de Mona Lisa’nın çalınmasıyla ilgisi olmadığı ortaya çıktı.' },
  { t: 33.85, text: 'Gerçek hırsız, daha önce Louvre’da çalışmış Vincenzo Peruggia isimli bir İtalyandı.' },
  { t: 40.27, text: 'Peruggia tabloyu müzeden çıkardıktan sonra Paris’teki evinde iki yıldan fazla sakladı.' },
  { t: 46.7, text: '1913’te tabloyu Floransa’da bir sanat tüccarına vermeye çalışınca yakalandı ve Mona Lisa bulundu.' },
  { t: 54.17, text: 'Üstelik bu inanılmaz hırsızlık, Mona Lisa’nın dünya çapındaki şöhretini daha da büyüttü.' },
  { t: 60.45, final: true, l1: 'İnanması güç ama', l2: 'bu gerçekten yaşandı.', t2: 61.85 },
];
const CAP_TOP = 34, CAP_BOTTOM = 420; // informational text stays within the top ~22% of 1920

let cv, ctx, L, lctx, paper, tooth, topPaper;

function setup() {
  cv = document.getElementById('c'); cv.width = W; cv.height = H; ctx = cv.getContext('2d');
  L = document.createElement('canvas'); L.width = W; L.height = H; lctx = L.getContext('2d');
  paper = makePaper(); tooth = makeTooth();
  topPaper = document.createElement('canvas'); topPaper.width = W; topPaper.height = 600;
  const tc = topPaper.getContext('2d');
  tc.drawImage(paper, 0, 0);
  tc.globalCompositeOperation = 'destination-in';
  const g = tc.createLinearGradient(0, 0, 0, 600);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.68, 'rgba(0,0,0,1)'); g.addColorStop(0.9, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  tc.fillStyle = g; tc.fillRect(0, 0, W, 600);
}

// ---------- captions ----------
const fitCache = {};
function fitText(text, maxW, maxH, weight = 700) {
  const key = text + maxW + maxH;
  if (fitCache[key]) return fitCache[key];
  for (let size = 86; size >= 40; size -= 2) {
    ctx.font = `${weight} ${size}px Kalam`;
    const words = text.split(' '); const lines = []; let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    const lh = size * 1.13;
    if (lines.length * lh <= maxH && lines.every(l => ctx.measureText(l).width <= maxW)) return (fitCache[key] = { size, lines, lh });
  }
  throw new Error('caption does not fit: ' + text);
}

function drawCaptionText(c, text, t, t0, t1, instant) {
  const { size, lines, lh } = fitText(text, 950, CAP_BOTTOM - CAP_TOP);
  const total = lines.length * lh;
  const y0 = CAP_TOP + (CAP_BOTTOM - CAP_TOP - total) / 2 + lh / 2;
  const fadeOut = 1 - seg(t, t1 - 0.12, t1);
  c.save();
  c.font = `700 ${size}px Kalam`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const dur = Math.min(0.55, 0.12 * lines.length + 0.2);
  lines.forEach((ln, i) => {
    const y = y0 + i * lh + Math.sin(t * 1.3 + i) * 0.8;
    const lw = c.measureText(ln).width;
    let p = instant ? 1 : clamp((t - t0) / dur * lines.length - i);
    if (p <= 0) return;
    c.save();
    c.beginPath(); c.rect(540 - lw / 2 - 20, y - lh, (lw + 40) * easeOut(p), lh * 2); c.clip();
    c.globalAlpha = 0.96 * fadeOut;
    c.fillStyle = COL.ink;
    c.fillText(ln, 540, y);
    c.restore();
  });
  c.restore();
}

function drawFinalCaption(c, cap, t) {
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  const p1 = easeOut(seg(t, cap.t, cap.t + 0.45));
  c.font = `400 80px Kalam`;
  const w1 = c.measureText(cap.l1).width;
  c.save(); c.beginPath(); c.rect(540 - w1 / 2 - 20, 80, (w1 + 40) * p1, 200); c.clip();
  c.globalAlpha = 0.9; c.fillStyle = '#7d769c'; c.fillText(cap.l1, 540, 165); c.restore();
  const p2 = easeOut(seg(t, cap.t2, cap.t2 + 0.6));
  c.font = `700 100px Kalam`;
  const w2 = c.measureText(cap.l2).width;
  c.save(); c.beginPath(); c.rect(540 - w2 / 2 - 20, 200, (w2 + 40) * p2, 200); c.clip();
  c.fillStyle = '#16123a'; c.globalAlpha = 1;
  c.fillText(cap.l2, 540, 290);
  c.lineWidth = 2.2; c.strokeStyle = '#16123a'; c.strokeText(cap.l2, 540, 290);
  c.restore();
  // hand-drawn underline
  const pu = seg(t, cap.t2 + 0.5, cap.t2 + 1.1);
  if (pu > 0) W_(c, () => stroke(c, spline([[540 - w2 / 2, 360], [540, 368], [540 + w2 / 2, 356]], false, 10), { w: 6, col: COL.burg, rev: pu, a: 0.85 }));
  c.restore();
}

function drawCaptions(c, t) {
  for (let i = 0; i < CAPTIONS.length; i++) {
    const cap = CAPTIONS[i], next = CAPTIONS[i + 1];
    const t1 = next ? next.t : 1e9;
    if (t < cap.t || t >= t1) continue;
    if (cap.final) drawFinalCaption(c, cap, t);
    else drawCaptionText(c, cap.text, t, cap.t, t1, i === 0);
  }
}

function drawHandle(c, t) {
  const fin = seg(t, 60.4, 61.2);
  c.save();
  c.font = `${fin > 0.5 ? 700 : 400} ${lerp(38, 44, fin)}px Kalam`; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
  c.globalAlpha = lerp(0.55, 0.92, fin); c.fillStyle = COL.ink;
  c.lineJoin = 'round'; c.lineWidth = 10; c.strokeStyle = 'rgba(244,236,219,0.85)'; c.strokeText('@bugercektenyasandi', 1040, 1872);
  c.fillText('@bugercektenyasandi', 1040, 1872);
  c.restore();
}

// ---------- frame ----------
function renderFrame(t) {
  G.t = t; G.boil = Math.floor(t * 8); G.alpha = 1; G.rev = 1; G.mode = 'normal';
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1;
  lctx.clearRect(0, 0, W, H);
  renderScenes(lctx, t);
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  // crayon tooth
  lctx.globalCompositeOperation = 'destination-out'; lctx.globalAlpha = 1;
  const ox = (G.boil % 3) * 17, oy = (G.boil % 3) * 11;
  lctx.drawImage(tooth, -ox, -oy);
  lctx.globalCompositeOperation = 'source-over';

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.drawImage(paper, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(L, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  // flashes (camera shutter) drawn as light, not multiplied
  if (G.flash > 0) { ctx.globalAlpha = G.flash; ctx.fillStyle = '#fff8e6'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; G.flash = 0; }
  ctx.drawImage(topPaper, 0, 0);
  drawCaptions(ctx, t);
  drawHandle(ctx, t);
}
window.renderFrame = renderFrame;
window.setupAll = async function () {
  await document.fonts.load('700 60px Kalam'); await document.fonts.load('400 60px Kalam');
  setup();
  return true;
};
