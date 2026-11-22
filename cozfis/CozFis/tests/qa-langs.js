#!/usr/bin/env node
/* Oyun içi 149 kabul testini (QA.runAll) 6 dilde modüler + atlas sürümünde çalıştırır. */
'use strict';
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const server = require('../tools/serve-lib.js').start(ROOT, 0); const port = await server.ready;
  const url = process.argv[2] || `http://localhost:${port}/index.html`;
  const b = await chromium.launch(); const out = {};
  for (const lang of ['tr', 'en', 'es', 'de', 'fr', 'pt-BR']) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 }, locale: lang });
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(l => { try { localStorage.clear(); localStorage.setItem('cozyfishing_lang_v1', l); } catch (e) { } }, lang);
    await p.goto(url); await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene, null, { timeout: 60000 });
    const r = await p.evaluate(() => { beginNewGame({ name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' }); const r = QA.runAll(); return { n: r.length, ok: r.filter(x => x.ok).length, bad: r.filter(x => !x.ok).map(x => x.name + ' :: ' + x.info), lang: I18N.lang, assets: AssetManager.enabled, hits: AssetManager.stats.hits, missing: I18N.missingReport ? Object.keys(I18N.missingReport() || {}).length : null }; });
    r.errors = errs; out[lang] = r; console.log(lang, `${r.ok}/${r.n}`, r.bad.length ? r.bad : '', errs.length ? errs : '', 'atlas:', r.assets, r.hits);
    await p.close();
  }
  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'reports/qa_langs.json'), JSON.stringify(out, null, 1));
  await b.close(); server.close();
  process.exit(Object.values(out).every(r => r.ok === r.n && !r.errors.length) ? 0 : 2);
})();
