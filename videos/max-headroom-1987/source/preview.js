const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch({args:['--allow-file-access-from-files']}); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve('index.html')); await p.evaluate(() => window.ready);
  const times = process.argv.slice(2).map(Number); fs.mkdirSync('prev', { recursive: true });
  for (const t of times) { const t0=Date.now(); const d = await p.evaluate(f => window.renderFrame(f), Math.round(t * 30));
    fs.writeFileSync(`prev/t${t.toFixed(2)}.jpg`, Buffer.from(d.split(',')[1], 'base64')); console.log(t, Date.now()-t0,'ms'); }
  console.log(errs.join('\n')); await b.close();
})();
