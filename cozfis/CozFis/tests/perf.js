#!/usr/bin/env node
/* Performans karşılaştırması: A (özgün tek dosya) / B (modüler + atlas) / C (modüler, ?assets=off)
   Ölçümler (her biri N tekrar, medyan): açılış süresi, ilk sahne üretimi (kasaba/tekne/ev), kare çizim süresi ve FPS,
   JS yığını (CDP), önbellekteki canvas piksel belleği, çözülmüş atlas belleği, aktarılan bayt.
   Kullanım: node tests/perf.js [--runs 3]  →  reports/perf.json                                                      */
'use strict';
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const RUNS = +((process.argv.indexOf('--runs') > 0 && process.argv[process.argv.indexOf('--runs') + 1]) || 3);
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

async function measure(browser, url, isB) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, locale: 'tr-TR' }); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  let bytes = 0, reqs = 0, remote = 0; p.on('response', async r => { try { const b = await r.body(); bytes += b.length; reqs++; if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(r.url()) && !/^data:/.test(r.url())) remote++; } catch (e) { } });
  await p.addInitScript(() => {
    try { localStorage.clear(); localStorage.setItem('cozyfishing_lang_v1', 'tr'); } catch (e) { }
    const iv = setInterval(() => { const b = document.getElementById('boot'); if (b && b.style.display === 'none') { window.__bootDone = performance.now(); clearInterval(iv); } }, 2);
  });
  await p.goto(url);
  await p.waitForFunction(() => window.__bootDone, null, { timeout: 60000 });
  if (isB) await p.waitForFunction(() => AssetManager.ready, null, { timeout: 60000 });
  await p.waitForTimeout(300);
  const r = await p.evaluate(async () => {
    const out = { boot: Math.round(window.__bootDone), assetsMs: window.__COZFIS_START ? window.__COZFIS_START.assetsMs : 0 };
    beginNewGame({ name: 'P', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' });
    const timeScene = (name, params) => { const t0 = performance.now(); go(name, params); Game.scene.render(G, 0); return +(performance.now() - t0).toFixed(1); };
    out.townFirst = timeScene('Town', {});
    out.homeFirst = timeScene('Home', {});
    S.cash = 1e6; Boats.buy('coastal_skiff'); S.boats.active = 'coastal_skiff'; S.regionId = 'sakin_liman';
    out.boatFirst = timeScene('BoatFishing', { rid: 'sakin_liman' });
    out.encyclopediaFirst = (() => { const t0 = performance.now(); UI.openPanel('Encyclopedia'); const d = performance.now() - t0; UI.closePanel(true); return +d.toFixed(1); })();
    // kare süresi + FPS (gerçek rAF döngüsü, 3 sn) — kasaba ve tekne
    const run = async (name, params) => {
      go(name, params); Game.paused = false; const sc = Game.scene, orig = sc.render; const ts = [];
      sc.render = function (g, dt) { const t0 = performance.now(); const r = orig.call(this, g, dt); ts.push(performance.now() - t0); return r; };
      let frames = 0; const f = () => { frames++; if (!done) requestAnimationFrame(f); }; let done = false; requestAnimationFrame(f);
      await new Promise(r => setTimeout(r, 3000)); done = true; sc.render = orig;
      ts.sort((a, b) => a - b); return { fps: +(frames / 3).toFixed(1), renderAvgMs: +(ts.reduce((a, b) => a + b, 0) / ts.length).toFixed(3), renderP95Ms: +ts[Math.floor(ts.length * 0.95)].toFixed(3) };
    };
    out.town = await run('Town', {}); out.boat = await run('BoatFishing', { rid: 'sakin_liman' });
    // canvas piksel belleği (Atlas önbelleği + bileşik nesneler) ve çözülmüş atlas sayfaları
    let px = 0; const add = v => { if (!v) return; if (v instanceof HTMLCanvasElement) px += v.width * v.height; else if (typeof v === 'object') for (const k in v) if (v[k] instanceof HTMLCanvasElement) px += v[k].width * v[k].height; };
    Atlas.cache.forEach(add); out.cacheMB = +(px * 4 / 1048576).toFixed(1); out.cacheEntries = Atlas.cache.size;
    out.atlasHeldMB = typeof AssetManager !== 'undefined' && AssetManager.enabled ? AssetManager.heldMB() : 0; out.atlasAllPagesMB = typeof AssetManager !== 'undefined' && AssetManager.enabled ? +(Object.values(AssetManager.manifest.pages).reduce((a, p) => a + p.w * p.h * 4, 0) / 1048576).toFixed(1) : 0;
    return out;
  });
  const m = await cdp.send('Performance.getMetrics'); const g = n => (m.metrics.find(x => x.name === n) || {}).value;
  r.jsHeapMB = +(g('JSHeapUsedSize') / 1048576).toFixed(1); r.bytesKB = Math.round(bytes / 1024); r.requests = reqs; r.remoteRequests = remote;
  await ctx.close(); return r;
}
(async () => {
  const server = require('../tools/serve-lib.js').start(ROOT, 0); const port = await server.ready;
  const urls = { A: `http://localhost:${port}/reference/CozFis_Multilanguage_v1.html`, B: `http://localhost:${port}/index.html`, C: `http://localhost:${port}/index.html?assets=off` };
  const browser = await chromium.launch(); const all = { A: [], B: [], C: [] };
  for (let i = 0; i < RUNS; i++) for (const k of ['A', 'B', 'C']) all[k].push(await measure(browser, urls[k], k === 'B'));
  const summary = {};
  for (const k in all) { summary[k] = {}; for (const f of Object.keys(all[k][0])) { const v = all[k].map(x => x[f]); summary[k][f] = typeof v[0] === 'object' ? Object.fromEntries(Object.keys(v[0]).map(s => [s, med(v.map(o => o[s]))])) : med(v); } }
  fs.writeFileSync(path.join(ROOT, 'reports/perf.json'), JSON.stringify({ runs: RUNS, note: 'Headless Chromium; medyan değerler. A=özgün tek dosya, B=modüler+atlas, C=modüler prosedürel', summary, raw: all }, null, 1));
  console.log(JSON.stringify(summary, null, 1));
  await browser.close(); server.close();
})();
