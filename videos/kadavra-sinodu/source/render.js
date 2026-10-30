// node render.js outdir start end   (frame indices, 30fps)
const { chromium } = require('playwright');
(async () => {
  const [out, s, e] = process.argv.slice(2); const S = +s, E = +e;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', er => { console.log('PAGEERR', er.message); process.exit(1); });
  await p.goto('file://' + __dirname + '/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 60000 });
  const el = await p.$('#c');
  for (let f = S; f < E; f++) {
    await p.evaluate(t => renderFrame(t), f / 30);
    await el.screenshot({ path: `${out}/f_${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 94 });
    if (f % 100 === 0) console.log('frame', f);
  }
  console.log('done'); await b.close();
})();
