// Usage:
//   node render.js still out/stills 0 5.5 12 ...   -> PNG stills at given times
//   node render.js video out/video_noaudio.mp4 [workers]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const FPS = 30, DURATION = 65.5;
const url = 'file://' + path.resolve(__dirname, 'src/index.html');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('PAGE ERROR', e); process.exit(1); });
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(url);
  await page.evaluate(() => window.setupAll());
  return page;
}
async function grab(page, t, type = 'jpeg') {
  const b64 = await page.evaluate(([t, type]) => {
    window.renderFrame(t);
    return document.getElementById('c').toDataURL(type === 'png' ? 'image/png' : 'image/jpeg', 0.95).split(',')[1];
  }, [t, type]);
  return Buffer.from(b64, 'base64');
}

(async () => {
  const [mode, out, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync'] });
  if (mode === 'still') {
    fs.mkdirSync(out, { recursive: true });
    const page = await openPage(browser);
    for (const ts of rest) {
      const t0 = Date.now();
      const buf = await grab(page, parseFloat(ts), 'png');
      fs.writeFileSync(path.join(out, `t${parseFloat(ts).toFixed(2).padStart(6, '0')}.png`), buf);
      console.log(ts, Date.now() - t0, 'ms');
    }
  } else if (mode === 'video') {
    const workers = parseInt(rest[0] || '4');
    const total = Math.round(DURATION * FPS);
    const per = Math.ceil(total / workers);
    const parts = [];
    await Promise.all(Array.from({ length: workers }, async (_, w) => {
      const f0 = w * per, f1 = Math.min(total, f0 + per);
      const part = out.replace(/\.mp4$/, `_part${w}.mp4`); parts[w] = part;
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), part], { stdio: ['pipe', 'inherit', 'inherit'] });
      const page = await openPage(browser);
      const st = Date.now();
      for (let f = f0; f < f1; f++) {
        const buf = await grab(page, f / FPS);
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        if ((f - f0) % 100 === 0) console.log(`w${w} frame ${f}/${f1} ${((Date.now() - st) / (f - f0 + 1)).toFixed(0)}ms/f`);
      }
      ff.stdin.end();
      await new Promise(r => ff.on('close', r));
    }));
    fs.writeFileSync(out + '.txt', parts.map(p => `file '${path.resolve(p)}'`).join('\n'));
    await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', out + '.txt', '-c', 'copy', out], { stdio: 'inherit' }).on('close', r));
    parts.forEach(p => fs.unlinkSync(p)); fs.unlinkSync(out + '.txt');
    console.log('done', out);
  }
  await browser.close();
})();
