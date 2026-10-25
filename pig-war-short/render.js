// usage: node render.js shots t1,t2,... outdir   |  node render.js range f0 f1 out.mp4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const mode = process.argv[2];
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('PAGE:', m.text()));
  page.on('pageerror', e => { console.log('PAGEERR:', e.message); });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(async () => { await document.fonts.load('700 60px Kalam', 'İğşı'); await document.fonts.load('400 60px Kalam', 'İğşı'); await document.fonts.ready; init(); });
  if (mode === 'shots') {
    const times = process.argv[3].split(',').map(Number), out = process.argv[4]; fs.mkdirSync(out, { recursive: true });
    for (const t of times) {
      const d = await page.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.9); }, t);
      fs.writeFileSync(path.join(out, 't' + t.toFixed(2).padStart(6, '0') + '.jpg'), Buffer.from(d.split(',')[1], 'base64'));
    }
  } else {
    const f0 = +process.argv[3], f1 = +process.argv[4], out = process.argv[5];
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      const d = await page.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, f / 30);
      const buf = Buffer.from(d.split(',')[1], 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - f0) % 60 === 0) console.log(out, f, ((Date.now() - t0) / (f - f0 + 1)).toFixed(0) + 'ms/f');
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
