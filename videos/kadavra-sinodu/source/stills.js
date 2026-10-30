// usage: node stills.js out_dir t1 t2 ...
const { chromium } = require('playwright');
(async () => {
  const [out, ...ts] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + __dirname + '/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 60000 });
  const el = await p.$('#c');
  for (const t of ts) { const t0 = Date.now(); await p.evaluate(t => renderFrame(t), parseFloat(t)); await el.screenshot({ path: `${out}/s_${t}.png` }); console.log(t, Date.now() - t0, 'ms'); }
  await b.close();
})();
