// usage: node qa_tests.js file.html [lang]
const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2], lang = process.argv[3] || 'tr';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, locale: lang === 'pt' ? 'pt-BR' : lang });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.addInitScript(l => { try { if (l !== 'auto') localStorage.setItem('cozyfishing_lang_v1', l); } catch (e) { } }, lang === 'pt' ? 'pt-BR' : lang);
  await p.goto('file://' + require('path').resolve(file));
  await p.waitForTimeout(1500);
  const res = await p.evaluate(() => {
    const look = { name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' };
    beginNewGame(look);
    const r = QA.runAll();
    return { n: r.length, ok: r.filter(x => x.ok).length, bad: r.filter(x => !x.ok).map(x => x.name + ' :: ' + x.info) };
  });
  console.log(JSON.stringify(res, null, 1));
  console.log('errors', errs.slice(0, 20));
  await b.close();
})();
