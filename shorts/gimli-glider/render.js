// Frame compositor + encoder.
//   node render.js --still 12.3 out.png
//   node render.js --frames 0 500 out.mp4
const { createCanvas } = require('@napi-rs/canvas');
const { spawn } = require('child_process');
const fs = require('fs');
const Lb = require('./lib');
const { W, H, FPS, C, S, P, L, ell, clamp, lerp, prog, ease, easeIn, easeOut, smooth, noise1, beginFrame, crayon } = Lb;
const A = require('./scenes_a');
const B = require('./scenes_b');
const Pt = require('./parts');
const { SENTENCES, END } = require('./timeline');

const SCENES = [
  { fn: A.scene1, a: 0 }, { fn: A.scene2, a: 7.55 }, { fn: A.scene3, a: 14.0 }, { fn: A.scene4, a: 23.2 },
  { fn: A.scene5, a: 29.3 }, { fn: B.scene6, a: 33.2 }, { fn: B.scene7, a: 40.2 }, { fn: B.scene8, a: 49.3 },
  { fn: B.scene9, a: 54.3 }, { fn: B.scene10, a: 60.9 },
];
// transition i joins scene i → i+1
const TRANS = [
  { a: 7.55, b: 8.45, type: 'iris', from: { x: 290, y: 1490, r: 160 }, to: { x: 540, y: 1250, r: 125 } },
  { a: 14.0, b: 14.8, type: 'iris', from: { x: 540, y: 1250, r: 125 }, to: { x: 469, y: 1062, r: 90 } },
  { a: 23.2, b: 24.1, type: 'clouds' },
  { a: 29.3, b: 30.1, type: 'dissolve' },
  { a: 33.2, b: 34.0, type: 'iris', from: { x: 679, y: 956, r: 34 }, to: { x: 540, y: 690, r: 260 } },
  { a: 40.2, b: 40.9, type: 'dissolve' },
  { a: 49.3, b: 50.0, type: 'dissolve' },
  { a: 54.1, b: 54.5, type: 'dissolve' },
  { a: 60.9, b: 61.8, type: 'iris', from: { x: 540, y: 920, r: 300 }, to: { x: 520, y: 1330, r: 420 } },
];

// ---------------------------------------------------------------- static textures
const paper = Lb.makePaper(), tooth = Lb.makeTooth();
const bandMask = (() => {
  const cv = createCanvas(W, 640), x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 640);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(445 / 640, 'rgba(0,0,0,1)');
  g.addColorStop(530 / 640, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, 640); return cv;
})();
const vignette = (() => {
  const cv = createCanvas(W, H), x = cv.getContext('2d');
  const g = x.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, H * 0.75);
  g.addColorStop(0, 'rgba(90,70,40,0)'); g.addColorStop(1, 'rgba(90,70,40,0.16)');
  x.fillStyle = g; x.fillRect(0, 0, W, H); return cv;
})();
const band = createCanvas(W, 640), bandCtx = band.getContext('2d');
const main = createCanvas(W, H), ctx = main.getContext('2d');
const bufA = createCanvas(W, H), bufB = createCanvas(W, H);
const toothPat = ctx.createPattern(tooth, 'repeat');

function paperOffset(t) { return [-40 + noise1(t * 0.3, 5) * 6, -40 + noise1(t * 0.3, 6) * 6]; }
function drawPaper(c, t) { const [ox, oy] = paperOffset(t); c.drawImage(paper, ox, oy); }

function renderScene(c, i, t) {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  drawPaper(c, t);
  // gentle hand-held camera drift on everything
  c.translate(540, 1150); c.rotate(noise1(t * 0.25, 77) * 0.004);
  c.translate(-540 + noise1(t * 0.2, 78) * 5, -1150 + noise1(t * 0.2, 79) * 5);
  SCENES[i].fn(c, t);
  c.restore();
}

function sceneIndex(t) { let i = 0; for (let k = 0; k < SCENES.length; k++) if (t >= SCENES[k].a) i = k; return i; }

function composite(t) {
  const tr = TRANS.find(x => t >= x.a && t < x.b);
  if (!tr) { renderScene(ctx, sceneIndex(t), t); return; }
  const i = TRANS.indexOf(tr), e = prog(t, tr.a, tr.b);
  const ca = bufA.getContext('2d'), cb = bufB.getContext('2d');
  renderScene(ca, i, t); renderScene(cb, i + 1, t);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (tr.type === 'iris') {
    const e2 = ease(e), f = tr.from, to = tr.to;
    const zA = 1 + 2.6 * easeIn(e);
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(zA, zA); ctx.translate(-f.x, -f.y); ctx.drawImage(bufA, 0, 0); ctx.restore();
    const cx = lerp(f.x, to.x, e2), cy = lerp(f.y, to.y, e2);
    const R = lerp(f.r * zA, 2300, easeIn(e));
    const kB = lerp(f.r * zA / to.r, 1, e2);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.globalAlpha = clamp(e * 3);
    ctx.translate(cx, cy); ctx.scale(kB, kB); ctx.translate(-to.x, -to.y);
    ctx.drawImage(bufB, 0, 0);
    ctx.restore();
    if (R < 2000) P(ctx, ell(cx, cy, R, R, 48), { stroke: C.ink, lw: 6, fill: null, alpha: 1 - e });
  } else if (tr.type === 'dissolve') {
    ctx.drawImage(bufA, 0, 0);
    const k = lerp(1.06, 1, ease(e));
    ctx.save(); ctx.globalAlpha = ease(e);
    ctx.translate(540, 1150); ctx.scale(k, k); ctx.translate(-540, -1150);
    ctx.drawImage(bufB, 0, 0); ctx.restore();
  } else if (tr.type === 'clouds') {
    ctx.drawImage(e < 0.5 ? bufA : bufB, 0, 0);
    const y = lerp(1950, -1460, e);
    ctx.save(); ctx.globalAlpha = 1;
    ctx.fillStyle = C.cloud; ctx.fillRect(-50, y + 120, W + 100, 1580);
    ctx.fillStyle = crayon(ctx, C.cloudShade); ctx.globalAlpha = 0.25; ctx.fillRect(-50, y + 120, W + 100, 1580);
    ctx.restore();
    for (let k = 0; k < 8; k++) for (let j = 0; j < 3; j++) {
      const cx = -80 + j * 420 + (k % 2) * 200, cy = y + k * 250 + 130;
      if (k === 0) Pt.cloud(ctx, cx, cy, 620, 1300 + j, { lw: 2.4 });
      else if (k === 7) { ctx.save(); ctx.translate(cx, cy); ctx.scale(1, -1); Pt.cloud(ctx, 0, 0, 620, 1310 + j, { lw: 2.4 }); ctx.restore(); }
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- captions
const FONT = 'Cav600';
const layoutCache = new Map();
function layout(c, text, maxW = 960, maxH = 330) {
  if (layoutCache.has(text)) return layoutCache.get(text);
  const words = text.split(' ');
  let res;
  for (let size = 80; size >= 48; size -= 2) {
    c.font = `${size}px ${FONT}`;
    const space = c.measureText(' ').width, lines = [];
    let cur = [], cw = 0;
    for (const w of words) {
      const ww = c.measureText(w).width;
      if (cur.length && cw + space + ww > maxW) { lines.push(cur); cur = []; cw = 0; }
      cur.push({ w, width: ww }); cw += (cur.length > 1 ? space : 0) + ww;
    }
    if (cur.length) lines.push(cur);
    const lh = size * 1.08;
    res = { size, lh, space, lines };
    if (lines.length <= 4 && lines.length * lh <= maxH) break;
  }
  // character offsets for underline lookup
  let off = 0;
  for (const ln of res.lines) {
    let x = 0; const tot = ln.reduce((s, w) => s + w.width, 0) + res.space * (ln.length - 1);
    for (const w of ln) { w.x = x - tot / 2; w.c0 = off; w.c1 = off + w.w.length; off += w.w.length + 1; x += w.width + res.space; }
    ln.width = tot;
  }
  layoutCache.set(text, res);
  return res;
}
function drawCaption(c, s, t, winA, winB) {
  const lay = layout(c, s.text);
  const n = lay.lines.length, top = 300 - n * lay.lh / 2 + lay.size * 0.78;
  const chars = s.text.length, dur = clamp(0.3 + chars * 0.004, 0.4, 0.8);
  const rv = prog(t, winA, winA + dur), out = 1 - prog(t, winB - 0.16, winB);
  if (rv <= 0 || out <= 0) return;
  c.save();
  c.font = `${lay.size}px ${FONT}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  let acc = 0;
  lay.lines.forEach((ln, li) => {
    const lineChars = ln.reduce((a, w) => a + w.w.length + 1, 0);
    const lp = clamp((rv * chars - acc) / lineChars); acc += lineChars;
    if (lp <= 0) return;
    const y = top + li * lay.lh + noise1(S.boil * 0.7 + li, 300) * 0.8;
    const x0 = 540 - ln.width / 2 + noise1(S.boil * 0.7 + li, 301) * 0.8;
    c.save();
    c.beginPath(); c.rect(x0 - 20, y - lay.size, (ln.width + 40) * lp, lay.size * 1.5); c.clip();
    c.globalAlpha = out;
    c.fillStyle = C.ink;
    c.lineWidth = 1.4; c.strokeStyle = C.ink; c.lineJoin = 'round';
    for (const w of ln) { const wx = 540 + w.x; c.fillText(w.w, wx, y); c.strokeText(w.w, wx, y); }
    c.restore();
  });
  // red crayon underlines on the words being stressed
  for (const m of s.marks || []) {
    const c0 = s.text.indexOf(m.phrase), c1 = c0 + m.phrase.length;
    const up = prog(t, m.t, m.t + 0.35);
    if (c0 < 0 || up <= 0) continue;
    lay.lines.forEach((ln, li) => {
      const ws = ln.filter(w => w.c1 > c0 && w.c0 < c1);
      if (!ws.length) return;
      const xa = 540 + ws[0].x - 4, xb = 540 + ws[ws.length - 1].x + ws[ws.length - 1].width + 4;
      const y = top + li * lay.lh + lay.size * 0.16;
      const pts = []; for (let k = 0; k <= 10; k++) pts.push([lerp(xa, xb, k / 10), y + Math.sin(k * 1.3 + li) * 2.2]);
      L(c, pts, { stroke: C.red, lw: 5.5, reveal: up, alpha: 0.85 * out, sketch: true, j: 0.8 });
    });
  }
  c.restore();
}
function drawFinale(c, s, t) {
  const l1 = 'İnanması güç ama', l2 = 'bu gerçekten yaşandı.';
  const r1 = prog(t, s.a - 0.12, s.a + 0.4), r2 = prog(t, s.splitAt - 0.12, s.splitAt + 0.45);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  if (r1 > 0) {
    c.font = `86px Cav500`;
    const w = c.measureText(l1).width;
    c.save(); c.beginPath(); c.rect(540 - w / 2 - 20, 130, (w + 40) * r1, 140); c.clip();
    c.globalAlpha = 0.78; c.fillStyle = '#56597e'; c.fillText(l1, 540, 240); c.restore();
  }
  if (r2 > 0) {
    c.font = `112px Cav700`;
    const w = c.measureText(l2).width;
    c.save(); c.beginPath(); c.rect(540 - w / 2 - 20, 270, (w + 40) * r2, 170); c.clip();
    c.fillStyle = '#16183a'; c.strokeStyle = '#16183a'; c.lineWidth = 3.2; c.lineJoin = 'round';
    c.fillText(l2, 540, 380); c.strokeText(l2, 540, 380);
    c.restore();
  }
  c.restore();
}
function captions(c, t) {
  SENTENCES.forEach((s, i) => {
    const winA = i === 0 ? 0 : s.a - 0.15;
    const winB = i + 1 < SENTENCES.length ? SENTENCES[i + 1].a - 0.15 : END + 1;
    if (t < winA || t > winB) return;
    if (s.finale) drawFinale(c, s, t); else drawCaption(c, s, t, winA, winB);
  });
}
function watermark(c, t) {
  const fin = smooth(t, 61.6, 62.4);
  c.save();
  c.font = `${Math.round(lerp(40, 46, fin))}px Cav600`; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
  c.fillStyle = C.ink; c.globalAlpha = lerp(0.55, 0.9, fin);
  c.fillText('@bugercektenyasandi', 1036, 1866);
  c.restore();
}

function frame(t) {
  beginFrame(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  composite(t);
  // paper band at the top keeps the caption zone clean
  const [ox, oy] = paperOffset(t);
  bandCtx.globalCompositeOperation = 'source-over'; bandCtx.clearRect(0, 0, W, 640);
  bandCtx.drawImage(paper, ox, oy);
  bandCtx.globalCompositeOperation = 'destination-in'; bandCtx.drawImage(bandMask, 0, 0);
  ctx.drawImage(band, 0, 0);
  captions(ctx, t);
  watermark(ctx, t);
  // paper tooth + warm vignette over everything
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const j = S.boil % 4;
  ctx.translate(-j * 13, -j * 7);
  ctx.fillStyle = toothPat; ctx.fillRect(0, 0, W + 60, H + 60);
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(vignette, 0, 0); ctx.restore();
}

async function main_() {
  const args = process.argv.slice(2);
  if (args[0] === '--still') {
    const t = parseFloat(args[1]); frame(t);
    fs.writeFileSync(args[2], main.toBuffer('image/png'));
    return;
  }
  if (args[0] === '--frames') {
    const f0 = parseInt(args[1]), f1 = parseInt(args[2]), out = args[3];
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-g', '60', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      frame(f / FPS);
      const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - f0) % 60 === 0) process.stderr.write(`[${f0}-${f1}] frame ${f} ${((Date.now() - t0) / (f - f0 + 1)).toFixed(0)}ms/f\n`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
}
if (require.main === module) main_();
module.exports = { frame, canvas: main };
