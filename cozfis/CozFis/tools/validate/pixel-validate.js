#!/usr/bin/env node
/* tools/validate/pixel-validate.js
   A = reference/CozFis_Multilanguage_v1.html (özgün tek dosya, tamamen prosedürel)
   B = index.html (modüler, PNG atlaslarından)            C = index.html?assets=off (modüler, prosedürel)
   Üçünde de aynı çağrı dizisi (driver.js) çalışır; Atlas önbelleği, data-URL'ler ve sahne kareleri
   piksel özeti (FNV-1a, RGBA) ile karşılaştırılır. Math.random ve Date.now sabitlenir.
   Kullanım: node tools/validate/pixel-validate.js [--langs tr,en] [--out reports/pixel_validation.json]   */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const LANGS = arg('langs', 'tr,en,es,de,fr,pt-BR').split(',');
const OUT = path.join(ROOT, arg('out', 'reports/pixel_validation.json'));

async function runPage(browser, url, waitAll) {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, locale: 'tr-TR' });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    try { localStorage.clear(); localStorage.setItem('cozyfishing_lang_v1', 'tr'); } catch (e) { }
    let s = 12345; Math.random = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    const T = 1767225600000; Date.now = () => T;
  });
  await page.goto(url);
  await page.waitForFunction(() => typeof Game !== 'undefined' && Game.scene, null, { timeout: 60000 });
  if (waitAll) await page.waitForFunction(() => AssetManager.ready && AssetManager.stats.pages === Object.keys(AssetManager.manifest.pages).length, null, { timeout: 60000 });
  await page.addScriptTag({ path: path.join(__dirname, 'driver.js') });
  const r = await page.evaluate(l => window.__VAL.run({ langs: l }), LANGS);
  r.errs = errs; await page.close(); return r;
}
function diff(a, b) {
  const bad = [], miss = []; let same = 0;
  for (const k of Object.keys(a)) { if (!(k in b)) { miss.push(k); continue; } if (a[k] === b[k]) same++; else bad.push(k); }
  return { compared: Object.keys(a).length, identical: same, different: bad.length, missingInB: miss.length, examples: bad.slice(0, 15), missing: miss.slice(0, 10) };
}
(async () => {
  const server = require('../serve-lib.js').start(ROOT, 0); const port = await server.ready; const base = `http://localhost:${port}/`;
  const browser = await chromium.launch();
  const t0 = Date.now();
  const A = await runPage(browser, base + 'reference/CozFis_Multilanguage_v1.html', false);
  const B = await runPage(browser, base + 'index.html?assets=all', true);
  const C = await runPage(browser, base + 'index.html?assets=off', false);
  const rep = {
    langs: LANGS, ms: Date.now() - t0,
    A_vs_B: { cache: diff(A.cache, B.cache), urls: diff(A.urls, B.urls), frames: diff(A.frames, B.frames) },
    A_vs_C: { cache: diff(A.cache, C.cache), urls: diff(A.urls, C.urls), frames: diff(A.frames, C.frames) },
    B_assetStats: B.am, errors: { A: A.errs, B: B.errs, C: C.errs },
    frameErrors: Object.entries(B.frames).filter(([k, v]) => /^ERR/.test(v)).map(([k, v]) => k + ' ' + v).slice(0, 10),
    driverMs: { A: A.ms, B: B.ms, C: C.ms }
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(rep, null, 1));
  const s = x => `${x.identical}/${x.compared} aynı, ${x.different} farklı, ${x.missingInB} eksik`;
  console.log('A↔B önbellek:', s(rep.A_vs_B.cache)); console.log('A↔B data-URL:', s(rep.A_vs_B.urls)); console.log('A↔B sahne kareleri:', s(rep.A_vs_B.frames));
  console.log('A↔C önbellek:', s(rep.A_vs_C.cache), '| kareler:', s(rep.A_vs_C.frames));
  console.log('B atlas istatistikleri:', JSON.stringify(B.am && B.am.stats), 'hatalar:', JSON.stringify(rep.errors));
  await browser.close(); server.close();
  const ok = !rep.A_vs_B.cache.different && !rep.A_vs_B.frames.different && !rep.A_vs_B.urls.different && !rep.A_vs_B.cache.missingInB;
  process.exit(ok ? 0 : 2);
})().catch(e => { console.error(e); process.exit(1); });
