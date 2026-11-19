// ---------- compositor ----------
const MAIN = document.getElementById('c').getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const BUF_A = mk(), BUF_B = mk();
const CA = BUF_A.getContext('2d'), CB = BUF_B.getContext('2d');
const S = TL.SENT;

function drawScene(i, t, target) {
  ctx = target; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  SCENE_FN[i](t - SC[i]);
}

// ---- captions ----
const BAND_H = 410;
let BAND_PATH = null;
function bandPath() {
  const pts = [[-20, -20], [W + 20, -20], [W + 20, BAND_H]];
  const r = mulberry(99);
  for (let x = W; x >= -20; x -= 26) pts.push([x, BAND_H + (r() - 0.5) * 14 + Math.sin(x * 0.02) * 6]);
  const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p;
}
function wrap(text, size, weight, maxW) {
  ctx.font = `${weight} ${size}px Caveat`;
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const tryS = cur ? cur + ' ' + w : w; if (ctx.measureText(tryS).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryS; }
  if (cur) lines.push(cur); return lines;
}
const _fit = {};
function fit(text) {
  if (_fit[text]) return _fit[text];
  for (let s = 96; s >= 56; s -= 2) { const L = wrap(text, s, 700, W - 130); if (L.length * s * 1.02 <= BAND_H - 70 && L.length <= 4) return (_fit[text] = { s, L }); }
  return (_fit[text] = { s: 56, L: wrap(text, 56, 700, W - 130) });
}
function writeLines(L, s, weight, col, y0, reveal, al, extraBold = 0) {
  ctx.save(); ctx.globalAlpha = al; ctx.font = `${weight} ${s}px Caveat`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const n = L.length;
  L.forEach((ln, j) => {
    const w = ctx.measureText(ln).width, x = (W - w) / 2, y = y0 + j * s * 1.02;
    const p = clamp(reveal * n - j); if (p <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - s * 1.1, (w + 40) * p, s * 1.6); ctx.clip();
    ctx.fillStyle = col; ctx.fillText(ln, x, y);
    ctx.strokeStyle = col; ctx.lineWidth = 1.2 + extraBold; ctx.lineJoin = 'round'; ctx.strokeText(ln, x, y);
    ctx.restore();
  });
  ctx.restore();
}
function captions(t) {
  if (!BAND_PATH) BAND_PATH = bandPath();
  const endFade = 1 - ease(seg(t, TL.END - 0.9, TL.END - 0.1));
  // band
  ctx.save(); ctx.globalAlpha = endFade;
  ctx.save(); ctx.translate(0, 9); ctx.fillStyle = 'rgba(15,12,30,0.28)'; ctx.fill(BAND_PATH); ctx.restore();
  ctx.save(); ctx.clip(BAND_PATH); ctx.drawImage(PAPER, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.22; ctx.drawImage(GRAIN, 0, 0); ctx.restore();
  ctx.save(); ctx.strokeStyle = C.navy; ctx.globalAlpha = 0.55; ctx.lineWidth = 2.5; ctx.stroke(BAND_PATH); ctx.restore();
  ctx.restore();
  // which sentence
  for (let i = 0; i < S.length; i++) {
    const a = i === 0 ? 0 : S[i].a - 0.12, b = i < S.length - 1 ? S[i + 1].a - 0.12 : SC[19] + 0.15;
    if (t < a - 0.01 || t >= b + 0.12) continue;
    const fadeOut = 1 - seg(t, b, b + 0.12);
    if (i === S.length - 1) { // channel ending, two styles
      const ra = clamp((t - a) / 0.45), rb = clamp((t - (TL.LINE20B - 0.1)) / 0.45);
      writeLines(['İnanması güç ama'], 82, 500, '#646a8c', 155, ra, fadeOut * endFade);
      writeLines(['bu gerçekten yaşandı.'], 112, 700, '#11143a', 300, rb, fadeOut * endFade, 2.4);
      continue;
    }
    const { s, L } = fit(S[i].text);
    const blockH = L.length * s * 1.02; const y0 = (BAND_H - blockH) / 2 + s * 0.78;
    const rev = i === 0 ? clamp(0.25 + t / 0.5) : clamp((t - a) / (0.32 + 0.1 * L.length));
    writeLines(L, s, 700, C.navy, y0, rev, fadeOut * endFade);
  }
  // archival label
  const la = seg(t, SC[19] + 1.3, SC[19] + 1.8);
  if (la > 0) writeLines(['1942’deki gerçek görüntü'], 92, 700, C.navy, 235, la, endFade);
}
function watermark(t) {
  const al = 1 - ease(seg(t, TL.END - 0.9, TL.END - 0.1));
  ctx.save(); ctx.globalAlpha = al; ctx.font = '400 34px Kalam'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const txt = '@bugercektenyasandi', w = ctx.measureText(txt).width, x = W - 40, y = H - 58;
  ctx.fillStyle = 'rgba(244,236,218,0.82)'; ctx.beginPath(); ctx.roundRect(x - w - 22, y - 26, w + 44, 54, 27); ctx.fill();
  ctx.strokeStyle = 'rgba(29,33,66,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = C.navy; ctx.fillText(txt, x, y + 2); ctx.restore();
}

function renderFrame(t) {
  T = t; BOIL = Math.floor(t * 8); TOOTH_AL = 1;
  let i = 0; for (let k = 0; k < SC.length; k++) if (t >= SC[k]) i = k;
  drawScene(i, t, CA);
  const tr = TRANS[i], u = t - SC[i];
  ctx = MAIN; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (tr > 0 && u < tr && i > 0) {
    drawScene(i - 1, t, CB); ctx = MAIN;
    const k = ease(u / tr);
    ctx.save(); zoomAt(540, 1000, 1 + 0.05 * k); ctx.drawImage(BUF_B, 0, 0); ctx.restore();
    ctx.save(); ctx.globalAlpha = k; zoomAt(540, 1000, 1.04 - 0.04 * k); ctx.drawImage(BUF_A, 0, 0); ctx.restore();
  } else ctx.drawImage(BUF_A, 0, 0);
  // paper grain + tooth on everything
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.45 * TOOTH_AL + 0.1; ctx.drawImage(GRAIN, 0, 0);
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.3 * TOOTH_AL; ctx.drawImage(TOOTH, 0, 0); ctx.restore();
  // vignette
  ctx.save(); const g = ctx.createRadialGradient(540, 1000, 500, 540, 1000, 1250); g.addColorStop(0, 'rgba(20,16,30,0)'); g.addColorStop(1, 'rgba(20,16,30,0.22)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  captions(t);
  watermark(t);
  // final fade
  const ff = ease(seg(t, TL.END - 0.8, TL.END - 0.05));
  if (ff > 0) { ctx.fillStyle = `rgba(12,12,22,${ff})`; ctx.fillRect(0, 0, W, H); }
}

async function init() {
  await Promise.all([document.fonts.load('700 80px Caveat', 'İğşı'), document.fonts.load('500 80px Caveat', 'İğşı'), document.fonts.load('400 34px Kalam', '@')]);
  ctx = MAIN; buildPaper();
  PHOTO = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'archival.jpg'; });
  window.READY = true;
}
window.renderJPEG = (t, q = 0.93) => { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', q); };
init();
