'use strict';
// ---------- timeline (narration = master clock) ----------
const SENT = [[0.00, 6.35], [7.28, 11.32], [12.39, 17.14], [17.89, 21.05], [22.05, 28.58], [29.57, 33.14], [34.15, 42.43], [43.38, 47.95], [48.95, 54.02], [54.96, 57.91]];
const TXT = [
  '1859’da bir domuzun vurulması, Amerika ile İngiltere’yi savaşın eşiğine getirdi.',
  'Olay, iki ülkenin de hak iddia ettiği San Juan Adası’nda başladı.',
  'Amerikalı çiftçi Lyman Cutlar, bahçesindeki ürünleri yiyen bir domuzu vurdu.',
  'Ancak domuz, İngiliz Hudson’s Bay Company’ye aitti.',
  'İki taraf arasında zaten süren sınır anlaşmazlığı bir anda büyüdü ve Amerika adaya asker gönderdi.',
  'İngiltere ise bölgeye savaş gemileri göndererek karşılık verdi.',
  'Bir süre sonra yüzlerce asker ve ağır silahlarla donatılmış İngiliz savaş gemileri aynı küçük ada çevresinde karşı karşıya kaldı.',
  'Ama iki taraf da ateş açmadı ve kriz sonunda diplomasiyle çözüldü.',
  'Tarihe “Domuz Savaşı” olarak geçen olayın tek kaybı, her şeyi başlatan domuz oldu.',
  'İnanması güç ama bu gerçekten yaşandı.'
];
const DUR = 59.7;

let MAIN, MCTX, LAYERS = [];
function mkLayer() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
function init() {
  MAIN = document.getElementById('c'); MCTX = MAIN.getContext('2d'); CTX = MCTX;
  initNoise(); initPaper(); LAYERS = [mkLayer(), mkLayer(), mkLayer()];
  scenesInit();
}

// camera: world (cx,cy) appears at screen (540,1200)
let SHAKE = [0, 0];
function cam(cx = 540, cy = 1200, z = 1, rot = 0) {
  CTX.setTransform(1, 0, 0, 1, 0, 0);
  CTX.translate(540 + SHAKE[0], 1200 + SHAKE[1]); CTX.rotate(rot); CTX.scale(z, z); CTX.translate(-cx, -cy);
}
function shakeAt(t, events) {
  let x = 0, y = 0;
  for (const [t0, dur, amp] of events) { const u = (t - t0) / dur; if (u >= 0 && u < 1) { const a = amp * (1 - u); x += Math.sin(t * 90) * a; y += Math.cos(t * 77) * a; } }
  return [x, y];
}

function render(t) {
  T = t; BOIL = Math.floor(t * 8);
  CTX = MCTX; MCTX.setTransform(1, 0, 0, 1, 0, 0); MCTX.globalAlpha = 1; MCTX.globalCompositeOperation = 'source-over';
  MCTX.drawImage(PAPER, 0, 0);
  const act = SCENES.filter(s => t >= s.t0 && t < s.t1);
  let li = 0;
  for (const s of act) {
    const c = s.comp ? s.comp(t) : {}; const a = c.alpha ?? 1; if (a <= 0.002) continue;
    const L = LAYERS[li++ % LAYERS.length], lc = L.getContext('2d');
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalAlpha = 1; lc.clearRect(0, 0, W, H);
    CTX = lc; SHAKE = s.shake ? shakeAt(t, s.shake) : [0, 0];
    s.draw(t);
    CTX = MCTX; MCTX.save(); MCTX.globalAlpha = a;
    if (c.scale || c.dx || c.dy) { const sc = c.scale || 1, ox = c.ox ?? 540, oy = c.oy ?? 1200; MCTX.translate(ox + (c.dx || 0), oy + (c.dy || 0)); MCTX.scale(sc, sc); MCTX.translate(-ox, -oy); }
    MCTX.drawImage(L, 0, 0); MCTX.restore();
  }
  for (const o of OVERLAYS) if (t >= o.t0 && t < o.t1) { CTX = MCTX; MCTX.setTransform(1, 0, 0, 1, 0, 0); MCTX.globalAlpha = 1; SHAKE = [0, 0]; o.draw(t); }
  CTX = MCTX; MCTX.setTransform(1, 0, 0, 1, 0, 0); MCTX.globalAlpha = 1;
  MCTX.drawImage(TOPPAPER, 0, 0);
  captions(t);
  handle(t);
  MCTX.globalCompositeOperation = 'multiply'; MCTX.drawImage(GRAIN, 0, 0, W, H); MCTX.globalCompositeOperation = 'source-over';
}

// ---------- captions (exact narration text, top zone only) ----------
const CAPCACHE = {};
function wrap(ctx, words, maxW) {
  const lines = []; let cur = '';
  for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (ctx.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; }
  if (cur) lines.push(cur); return lines;
}
function layoutCap(i) {
  if (CAPCACHE[i]) return CAPCACHE[i];
  const ctx = MCTX, words = TXT[i].split(' ');
  let size = 84, lines, lh;
  for (; size >= 46; size -= 2) {
    ctx.font = `700 ${size}px Kalam`; lh = size * 1.18;
    lines = wrap(ctx, words, 950);
    if (lines.length * lh <= 360 && lines.length <= 4) break;
  }
  // balance line lengths keeping line count
  let lo = 400, hi = 950, best = lines;
  while (hi - lo > 4) { const m = (lo + hi) / 2; const l2 = wrap(ctx, words, m); if (l2.length <= lines.length) { best = l2; hi = m; } else lo = m; }
  const r = rng(i * 91 + 5);
  CAPCACHE[i] = { size, lh, lines: best, rots: best.map(() => (r() - .5) * 0.012) };
  return CAPCACHE[i];
}
function capWindow(i) {
  const start = i === 0 ? 0 : SENT[i][0] - 0.12;
  const end = i < SENT.length - 1 ? SENT[i + 1][0] - 0.12 : 1e9;
  return [start, end];
}
function drawLines(L, t0, t, cy, color, weight, alphaOut) {
  const ctx = MCTX; ctx.save(); ctx.font = `${weight} ${L.size}px Kalam`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const total = L.lines.join('').length, revealDur = t0 < 0.01 ? 0.3 : Math.min(0.7, 0.25 + total * 0.004);
  const rv = clamp((t - t0) / revealDur);
  let acc = 0; const y0 = cy - (L.lines.length - 1) * L.lh / 2;
  L.lines.forEach((ln, k) => {
    const wln = ctx.measureText(ln).width, x0 = 540 - wln / 2, y = y0 + k * L.lh;
    const fr0 = acc / total, fr1 = (acc + ln.length) / total; acc += ln.length;
    const lp = clamp((rv - fr0) / (fr1 - fr0 + 1e-6));
    if (lp <= 0) return;
    ctx.save(); ctx.translate(540, y); ctx.rotate(L.rots[k]); ctx.translate(-540, -y);
    ctx.beginPath(); ctx.rect(x0 - 20, y - L.lh, (wln + 40) * lp + (lp > 0.99 ? 40 : 0), L.lh * 2); ctx.clip();
    ctx.globalAlpha = alphaOut;
    ctx.fillStyle = color; ctx.fillText(ln, x0, y);
    ctx.restore();
  });
  ctx.restore();
}
function captions(t) {
  for (let i = 0; i < TXT.length; i++) {
    const [s, e] = capWindow(i); if (t < s || t >= e) continue;
    const out = 1 - prog(t, e - 0.16, e);
    if (i === 9) { finalCaption(t, s, out); continue; }
    const L = layoutCap(i);
    drawLines(L, s, t, 268, INK, 700, out);
  }
}
let FINALL = null;
function finalCaption(t, s, out) {
  const ctx = MCTX;
  if (!FINALL) {
    ctx.font = '400 84px Kalam'; FINALL = { a: { size: 84, lh: 100, lines: ['İnanması güç ama'], rots: [-0.008] }, b: { size: 94, lh: 112, lines: ['bu gerçekten yaşandı.'], rots: [0.006] } };
  }
  drawLines(FINALL.a, s, t, 215, '#7a7598', 400, out);
  drawLines(FINALL.b, SENT[9][0] + 1.25, t, 318, '#171a40', 700, out);
}
function handle(t) {
  const ctx = MCTX; ctx.save(); ctx.font = '700 40px Kalam'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  const end = sm(54.6, 55.6, t);
  ctx.globalAlpha = lerp(0.62, 0.92, end); ctx.fillStyle = INK;
  ctx.fillText('@bugercektenyasandi', 1040, 1852); ctx.restore();
}
