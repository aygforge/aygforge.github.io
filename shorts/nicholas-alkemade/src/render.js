// usage: node render.js outdir fps [times...]  | node render.js outdir fps --range start end worker nworkers
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [out, fpsS, ...rest] = process.argv.slice(2); const fps = +fpsS; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-gpu-vsync'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('PAGE', m.text())); page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.evaluate(() => window.ready);
  let frames = [];
  if (rest[0] === '--range') { const [, a, b, w, n] = rest.map(Number); for (let i = a; i < b; i++) if (i % n === w) frames.push([i, i / fps]); }
  else frames = rest.map((x, i) => [x, +x]);
  const t0 = Date.now();
  for (const [name, t] of frames) {
    const data = await page.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, t);
    const fn = typeof name === 'number' ? String(name).padStart(5, '0') : name;
    fs.writeFileSync(path.join(out, fn + '.jpg'), Buffer.from(data.split(',')[1], 'base64'));
  }
  console.log('done', frames.length, 'frames in', (Date.now() - t0) / 1000, 's');
  await browser.close();
})();
