// usage: node render.js <startFrame> <endFrame> <out.mp4>   |  node render.js --png t1,t2,... outdir
const L = require('./lib');
const { SC, ST, T, SENT, NARR_END, TOTAL, HAS_PHOTO, PHOTO_IN, END0 } = require('./scenes');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { spawn } = require('child_process');
const fs = require('fs');
const { W, H, NAVY, clamp, prog, ease, lerp } = L;
const FPS = 30;

const main = createCanvas(W, H), mctx = main.getContext('2d');
const bufA = createCanvas(W, H), bufB = createCanvas(W, H);
let PHOTO = null;

function drawScene(sc, cv, g) {
  const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.clearRect(0, 0, W, H);
  c.drawImage(L.paper(), 0, 0);
  L.begin(cv, g); c.save(); sc.fn(g - sc.a, g); c.restore();
}

// ---------- captions ----------
function wrap(c, text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function card(c, x, y, w, h, a) {
  c.save(); c.globalAlpha = a * 0.92; c.fillStyle = '#f6efdf';
  c.beginPath(); const r = L.rng(Math.round(y));
  c.moveTo(x, y + 6); for (let i = 0; i <= 20; i++) c.lineTo(x + w * i / 20, y + (r() - 0.5) * 7);
  for (let i = 0; i <= 10; i++) c.lineTo(x + w + (r() - 0.5) * 6, y + h * i / 10);
  for (let i = 20; i >= 0; i--) c.lineTo(x + w * i / 20, y + h + (r() - 0.5) * 7);
  c.closePath(); c.shadowColor = 'rgba(40,40,80,0.18)'; c.shadowBlur = 14; c.shadowOffsetY = 4; c.fill(); c.restore();
}
function caption(g) {
  const c = mctx;
  // which sentence: from its start-0.12 until next start-0.12 (last: until narration end + small hold)
  let idx = -1;
  for (let i = 0; i < 23; i++) { const a = i === 0 ? 0 : ST[i] - 0.12; const b = i < 22 ? ST[i + 1] - 0.12 : END0 + 0.15; if (g >= a && g < b) idx = i; }
  if (idx < 0) return;
  const a0 = idx === 0 ? 0 : ST[idx] - 0.12; const b0 = idx < 22 ? ST[idx + 1] - 0.12 : END0 + 0.15;
  const fin = idx === 0 ? 1 : clamp((g - a0) / 0.18), fout = idx === 22 ? 1 - clamp((g - (b0 - 0.3)) / 0.3) : 1;
  const alpha = fin * fout;
  if (idx === 22) { // special ending styling
    const l1 = 'İnanması güç ama', l2 = 'bu gerçekten yaşandı.';
    c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    card(c, 90, 96, 900, 300, alpha);
    c.globalAlpha = alpha; c.font = '400 84px Caveat'; c.fillStyle = '#6f73a0'; c.fillText(l1, 540, 210);
    const a2 = clamp((g - (ST[22] + 0.85)) / 0.25); c.globalAlpha = alpha * Math.max(a2, 0.0);
    c.font = '700 112px Caveat'; c.fillStyle = '#1d1f4a'; c.fillText(l2, 540, 335);
    c.restore(); return;
  }
  const text = SENT[idx];
  c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  let fs = 82, lines;
  for (; fs >= 54; fs -= 2) { c.font = `700 ${fs}px Caveat`; lines = wrap(c, text, 900); if (lines.length * fs * 1.02 <= 330) break; }
  const lh = fs * 1.02, hgt = lines.length * lh + 44, top = 96;
  card(c, 70, top, 940, hgt, alpha);
  c.globalAlpha = alpha; c.fillStyle = '#23255a';
  lines.forEach((l, i) => c.fillText(l, 540, top + 22 + lh * (i + 0.78)));
  c.restore();
}
function watermark() { const c = mctx; c.save(); c.font = '600 46px Caveat'; c.textAlign = 'right'; c.fillStyle = 'rgba(35,37,90,0.78)'; c.fillText('@bugercektenyasandi', 1040, 1862); c.restore(); }

function frame(g) {
  const i = SC.findIndex(s => g >= s.a && g < s.b);
  const sc = SC[i < 0 ? SC.length - 1 : i];
  mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.globalAlpha = 1;
  drawScene(sc, bufA, g);
  mctx.drawImage(bufA, 0, 0);
  if (i > 0 && g < sc.a + sc.xf) { // crossfade from previous
    drawScene(SC[i - 1], bufB, g);
    mctx.globalAlpha = 1 - ease.sine((g - sc.a) / sc.xf); mctx.drawImage(bufB, 0, 0); mctx.globalAlpha = 1;
  }
  // archival photo
  if (HAS_PHOTO && g > PHOTO_IN - 0.5) {
    const a = ease.sine(clamp((g - (PHOTO_IN - 0.5)) / 0.6)); const z = 1 + 0.035 * clamp((g - PHOTO_IN + 0.5) / 3.8);
    mctx.save(); mctx.globalAlpha = a; mctx.fillStyle = '#f3ead7'; mctx.fillRect(0, 0, W, H);
    const bw = 960, bh = Math.min(1300, bw * PHOTO.height / PHOTO.width), cx = 540, cy = 1080;
    mctx.fillStyle = '#fbf6ea'; mctx.shadowColor = 'rgba(0,0,0,0.25)'; mctx.shadowBlur = 24; mctx.fillRect(cx - bw / 2 - 26, cy - bh / 2 - 26, bw + 52, bh + 52); mctx.shadowBlur = 0;
    mctx.beginPath(); mctx.rect(cx - bw / 2, cy - bh / 2, bw, bh); mctx.clip();
    const iw = bw * z, ih = iw * PHOTO.height / PHOTO.width; mctx.drawImage(PHOTO, cx - iw / 2, cy - ih / 2, iw, ih);
    mctx.restore();
    if (process.env.PHOTO_LABEL) { mctx.save(); mctx.globalAlpha = a; card(mctx, 160, 150, 760, 150, 1); mctx.font = '700 84px Caveat'; mctx.textAlign = 'center'; mctx.fillStyle = '#23255a'; mctx.fillText(process.env.PHOTO_LABEL, 540, 250); mctx.restore(); }
  }
  // grain over illustration
  mctx.save(); mctx.globalCompositeOperation = 'multiply'; mctx.globalAlpha = HAS_PHOTO && g > PHOTO_IN ? 0.25 : 0.55; mctx.drawImage(L.grain(), 0, 0); mctx.restore();
  caption(g);
  watermark();
  // final fade to paper
  const fo = clamp((g - (TOTAL - 0.6)) / 0.6); if (fo > 0) { mctx.save(); mctx.globalAlpha = fo; mctx.fillStyle = '#f3ead7'; mctx.fillRect(0, 0, W, H); mctx.restore(); }
}

(async () => {
  if (HAS_PHOTO) PHOTO = await loadImage(__dirname + '/archive.jpg');
  const args = process.argv.slice(2);
  if (args[0] === '--png') {
    const ts = args[1].split(',').map(Number); fs.mkdirSync(args[2], { recursive: true });
    for (const t of ts) { frame(t); fs.writeFileSync(`${args[2]}/f_${t.toFixed(2)}.png`, main.toBuffer('image/png')); }
    return;
  }
  if (args[0] === '--info') { console.log(JSON.stringify({ TOTAL, frames: Math.ceil(TOTAL * FPS) })); return; }
  const f0 = +args[0], f1 = +args[1], out = args[2];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    frame(f / FPS);
    const buf = mctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 60 === 0) console.error(`[${f0}] ${f}/${f1} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
})();
