#!/usr/bin/env node
/* tools/export-assets/export.js
   Oyunu prosedürel modda (?assets=off) başsız Chromium'da açar, collect.js ile tüm deterministik görselleri
   OYUNUN KENDİ üreticileriyle üretir ve tek tek kayıpsız PNG olarak yazar:
     assets/<kategori>/<id>.png  +  assets/sprites.json (kaynak metaveri)
   Ardından tools/build/pack.js ile atlasları ve assets/manifest.js'i yeniden kurar.
   Kullanım: node tools/export-assets/export.js [--no-pack]                                    */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../..');
const CAT_DIR = { fish: 'fish', characters: 'characters', boats: 'boats', ui: 'ui', environment: 'environments', props: 'environments/props' };

(async () => {
  const server = require('../serve-lib.js').start(ROOT, 0);
  const port = await server.ready;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, locale: 'tr-TR' });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('cozyfishing_lang_v1', 'tr'); } catch (e) { } });
  await page.goto(`http://localhost:${port}/index.html?assets=off`);
  await page.waitForFunction(() => typeof UI !== 'undefined' && Game.scene, null, { timeout: 30000 });
  await page.evaluate(() => beginNewGame({ name: 'Export', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' }));
  await page.addScriptTag({ path: path.join(__dirname, 'collect.js') });
  console.log('üretiliyor…');
  const summary = await page.evaluate(() => window.__EXP.run());
  const list = (await page.evaluate(() => window.__EXP.list())).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);   // deterministik sıra
  const ids = await page.evaluate(() => window.__EXP.ids());
  const dirOf = it => 'assets/' + CAT_DIR[it.cat] + (it.id.startsWith('env_region_') ? '/regions' : it.id.startsWith('env_town_') ? '/town' : it.id.startsWith('env_pier_') ? '/pier' : '');
  // eski dışa aktarımları temizle (yalnız üretilmiş PNG klasörleri)
  for (const d of new Set(Object.values(CAT_DIR))) fs.rmSync(path.join(ROOT, 'assets', d), { recursive: true, force: true });
  fs.rmSync(path.join(ROOT, 'assets/l10n'), { recursive: true, force: true });
  const byId = new Map(list.map(it => [it.id, it]));
  const fileOf = {};
  for (const it of list) { fileOf[it.id] = dirOf(it) + '/' + it.id + '.png'; for (const l in (it.l10n || {})) for (const p of it.l10n[l]) fileOf[p.id] = 'assets/l10n/' + p.id + '.png'; }
  let bytes = 0;
  for (let i = 0; i < ids.length; i += 150) {
    const chunk = ids.slice(i, i + 150); const data = await page.evaluate(c => window.__EXP.png(c), chunk);
    chunk.forEach((id, k) => { const f = path.join(ROOT, fileOf[id]); fs.mkdirSync(path.dirname(f), { recursive: true }); const buf = Buffer.from(data[k].split(',')[1], 'base64'); bytes += buf.length; fs.writeFileSync(f, buf); });
  }
  const sprites = list.map(it => {
    const o = { id: it.id, file: fileOf[it.id], cat: it.cat, w: it.w, h: it.h };
    if (it.key) o.key = it.key; if (it.sig) o.sig = it.sig; if (it.pivot) o.pivot = it.pivot; if (it.meta) o.meta = it.meta;
    if (it.l10n) { o.l10n = {}; for (const l in it.l10n) o.l10n[l] = it.l10n[l].map(p => ({ file: fileOf[p.id], dx: p.dx, dy: p.dy, w: p.w, h: p.h })); }
    return o;
  });
  const out = { generator: 'tools/export-assets/export.js', source: 'procedural (?assets=off)', note: 'Bir PNG değiştirilince: npm run pack (motor kodu değişmez). w/h atlas paketlenirken dosyadan okunur.', keyMap: Object.fromEntries(Object.keys(summary.keyMap).sort().map(k => [k, summary.keyMap[k]])), sprites };
  fs.writeFileSync(path.join(ROOT, 'assets/sprites.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(ROOT, 'reports/export_report.json'), JSON.stringify(Object.assign({}, summary, { keyMap: undefined, files: ids.length, bytes, errs }), null, 1));
  console.log(`dışa aktarıldı: ${list.length} görsel, ${summary.patches} dil yaması, ${ids.length} PNG, ${(bytes / 1024).toFixed(0)} KB, ${summary.ms} ms; dinamik(D): ${summary.report.dynamic.length}; hatalar: ${errs.length}`);
  await browser.close(); server.close();
  if (!process.argv.includes('--no-pack')) require('../build/pack.js').pack();
})().catch(e => { console.error(e); process.exit(1); });
