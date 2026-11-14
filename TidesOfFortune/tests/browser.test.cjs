// Gerçek tarayıcı testi (Playwright): dist/TidesOfFortune.html dosyasını file:// ile açar,
// bir run'ı yalnızca arayüz dokunuşlarıyla oynar, hata ve taşma kontrolü yapar.
// Kullanım: node tests/browser.test.cjs   (önce: npm run build)
const { chromium } = require('playwright');
const path = require('path');

const VIEWPORTS = [{ width: 800, height: 360 }, { width: 915, height: 412 }, { width: 1280, height: 720 }];

async function overflowCheck(page) {
  return page.evaluate(() => {
    const stage = document.getElementById('stage').getBoundingClientRect();
    const bad = [];
    document.querySelectorAll('#ui button, #overlay button').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (!r.width || getComputedStyle(b).visibility === 'hidden') return;
      // kaydırılabilir panel içindeki butonlar hariç
      let p = b.parentElement, scroller = false;
      while (p) { const o = getComputedStyle(p).overflowY; if (o === 'auto' || o === 'scroll') { scroller = true; break; } p = p.parentElement; }
      if (scroller) return;
      if (r.left < stage.left - 1 || r.right > stage.right + 1 || r.top < stage.top - 1 || r.bottom > stage.bottom + 1) bad.push(b.textContent.trim().slice(0, 30));
      if (r.height * (stage.height / 720) < 0 ) bad.push('size');
    });
    return bad;
  });
}

async function playViaUI(page, maxSteps = 900) {
  const seen = new Set();
  for (let i = 0; i < maxSteps; i++) {
    const phase = await page.evaluate(() => { const r = window.__tof.core.run; return !r ? 'none' : r.ended ? 'ended' : r.phase + (r.arrival?.current || r.voyage?.current ? (window.__tof.core.host().current.result ? ':res' : ':ev') : ''); });
    seen.add(phase.split(':')[0]);
    if (phase === 'ended') return seen;
    const tryClick = async (sel) => { const el = await page.$(sel); if (el) { await el.click(); await page.waitForTimeout(60); return true; } return false; };
    if (await page.$('.modal')) { if (!(await tryClick('.modal .btn.primary'))) await tryClick('.modal .btn.ghost'); continue; }
    if (await page.$('.cinematic .cineBtn')) { await page.waitForTimeout(2800); await tryClick('.cinematic .cineBtn'); await page.waitForTimeout(900); continue; }
    if (phase.endsWith(':ev')) { await tryClick('.optCard:not(.locked)'); continue; }
    if (phase.endsWith(':res')) { await tryClick('.contBtn'); continue; }
    if (phase === 'arrival') { await tryClick('.arrivalPanel .btn.primary'); continue; }
    if (phase === 'harbor') {
      const starter = await page.evaluate(() => window.__tof.core.run.visit.starterPicks);
      if (starter > 0) { await page.evaluate(() => { window.__tof.ui.sub.harborTab = 'items'; window.__tof.ui.render(); }); if (await tryClick('.itemcard:not(.bought) .cact .btn:not(.locked)')) continue; }
      // tamir gerekiyorsa
      const pct = await page.evaluate(() => window.__tof.core.run.ship.hull / (window.__tof.core.run.ship.level * 0 + 1));
      await page.evaluate(() => { const c = window.__tof.core; if (c.run.ship.hull < 60) { c.repair('patch'); c.repair('partial'); } });
      if (await tryClick('.departBtn')) continue;
    }
    if (phase === 'voyage') { await page.waitForTimeout(300); continue; }
    await page.waitForTimeout(100);
  }
  throw new Error('Run bitmedi');
}

(async () => {
  const file = 'file://' + path.resolve(__dirname, '../dist/TidesOfFortune.html');
  const browser = await chromium.launch();
  let failures = 0;
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: vp, hasTouch: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(file);
    await page.waitForTimeout(1200);
    const menuOverflow = await overflowCheck(page);
    await page.click('.menuButtons .btn.primary');
    await page.waitForTimeout(200);
    await page.fill('.seedInput', 'BROWSER' + vp.width);
    await page.click('.modal .btn.primary');
    await page.evaluate(() => { window.__tof.ui.fast = true; });
    let phases;
    try { phases = await playViaUI(page); } catch (e) { errors.push(String(e)); }
    const harborOverflow = [];
    const res = await page.evaluate(() => ({ result: window.__tof.core.run?.result, harbors: window.__tof.core.run?.stats.harborsReached, saved: !!localStorage.getItem('tof.meta') }));
    const sumOverflow = await overflowCheck(page);
    const ok = !errors.length && !menuOverflow.length && !sumOverflow.length && res.result && res.saved;
    if (!ok) failures++;
    console.log(`${ok ? 'GEÇTİ' : 'KALDI'} ${vp.width}×${vp.height}: sonuç=${res.result} liman=${res.harbors} fazlar=${phases ? [...phases].join(',') : '-'} taşma=${[...menuOverflow, ...sumOverflow, ...harborOverflow].join('|') || 'yok'} hatalar=${errors.join(' | ') || 'yok'}`);
    // Yeniden yükleme: kalıcı veri korunur
    await page.reload();
    await page.waitForTimeout(1000);
    const persisted = await page.evaluate(() => window.__tof.core.meta.stats.runs);
    console.log(`  yeniden yükleme sonrası kayıtlı run sayısı: ${persisted}`);
    if (persisted < 1) failures++;
    await page.close();
  }
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
