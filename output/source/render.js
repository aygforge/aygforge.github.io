// usage: node render.js out.mp4 fps t0 t1   |  node render.js --stills dir t1 t2 ...
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('[page]', m.text())); page.on('pageerror', e => console.log('[err]', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction('window.READY === true', null, { timeout: 30000 });
  if (args[0] === '--stills') {
    const dir = args[1]; fs.mkdirSync(dir, { recursive: true });
    for (const t of args.slice(2)) { const d = await page.evaluate(t => window.renderJPEG(+t, 0.85), t); fs.writeFileSync(path.join(dir, `f_${(+t).toFixed(2)}.jpg`), Buffer.from(d.split(',')[1], 'base64')); }
  } else {
    const [out, fps, t0, t1] = [args[0], +args[1], +args[2], +args[3]];
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out]);
    const n0 = Math.round(t0 * fps), n1 = Math.round(t1 * fps); const st = Date.now();
    for (let n = n0; n < n1; n++) {
      const d = await page.evaluate(t => window.renderJPEG(t, 0.94), n / fps);
      if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if ((n - n0) % 60 === 0) console.log(out, n, ((Date.now() - st) / (n - n0 + 1)).toFixed(0) + 'ms/f');
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
