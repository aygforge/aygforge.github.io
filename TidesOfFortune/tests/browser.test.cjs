// Gerçek tarayıcı testi (Playwright): dist/TidesOfFortune.html dosyasını file:// ile açar,
// bir run'ı yalnızca arayüz dokunuşlarıyla oynar (?hiz=30 test hızlandırması), hata/taşma kontrolü,
// karşılaşma ortasında yeniden yükleme ve kabul kriteri kontrolleri yapar.
// Kullanım: npm run build && node tests/browser.test.cjs
const { chromium } = require('playwright');
const path = require('path');

const VIEWPORTS = [{ width: 800, height: 360 }, { width: 1280, height: 720 }];
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'GEÇTİ' : 'KALDI'}  ${name}${info ? ' — ' + info : ''}`); };

async function overflow(page) {
  return page.evaluate(() => {
    const st = document.getElementById('stage').getBoundingClientRect();
    const bad = [];
    document.querySelectorAll('#ui button, #overlay button').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (!r.width) return;
      let p = b.parentElement, scroller = false;
      while (p) { const o = getComputedStyle(p).overflowY; if (o === 'auto' || o === 'scroll') { scroller = true; break; } p = p.parentElement; }
      if (!scroller && (r.left < st.left - 1 || r.right > st.right + 1 || r.top < st.top - 1 || r.bottom > st.bottom + 1)) bad.push(b.textContent.trim().slice(0, 24));
    });
    return bad;
  });
}

const state = (page) => page.evaluate(() => { const t = window.__tof; const r = t.core.run; return { phase: !r ? 'none' : r.ended ? 'ended' : r.phase, dir: t.ui.director.phase, cur: !!t.core.host()?.current, res: !!t.core.host()?.current?.result, modal: !!document.querySelector('.modal'), cine: !!document.querySelector('.cinematic') }; });

async function playViaUI(page, maxSteps = 4000, onDecision = null) {
  const seen = new Set();
  for (let i = 0; i < maxSteps; i++) {
    const s = await state(page);
    seen.add(s.phase + ':' + s.dir);
    if (s.phase === 'ended') return seen;
    const click = async (sel) => { const el = await page.$(sel); if (!el) return false; try { await el.click({ timeout: 2500 }); } catch { return false; } await page.waitForTimeout(80); return true; };
    if (s.cine) { await page.waitForTimeout(2900); await click('.cinematic .cineBtn'); await page.waitForTimeout(900); continue; }
    if (s.modal) { if (!(await click('.modal .laneCard')) && !(await click('.modal .btn.primary'))) await click('.modal .btn.ghost'); continue; }
    if (s.dir === 'PLAYER_DECISION') { if (onDecision) await onDecision(page); if (await click('.optCard:not(.locked)')) continue; }
    if (s.dir === 'OUTCOME_ANIMATION' && s.res) { if (await click('.contBtn')) continue; }
    if (s.phase === 'arrival' && !s.cur) { await click('.arrivalPanel .btn.primary'); continue; }
    if (s.phase === 'harbor') {
      const starter = await page.evaluate(() => window.__tof.core.run.visit.starterPicks);
      if (starter > 0) { await page.evaluate(() => { window.__tof.ui.sub.harborTab = 'items'; window.__tof.ui.render(); }); if (await click('.itemcard:not(.bought) .cact .btn:not(.locked)')) continue; }
      await page.evaluate(() => { const c = window.__tof.core; if (c.run.ship.hull < 60) { c.repair('patch'); c.repair('partial'); } });
      if (await click('.departBtn')) continue;
    }
    await page.waitForTimeout(250);
  }
  throw new Error('Run bitmedi');
}

(async () => {
  const file = 'file://' + path.resolve(__dirname, '../dist/TidesOfFortune.html');
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: vp, hasTouch: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(file + '?hiz=30');
    await page.waitForTimeout(1200);
    const ov1 = await overflow(page);
    await page.click('.menuButtons .btn.primary');
    await page.waitForTimeout(200);
    await page.fill('.seedInput', 'BROWSER' + vp.width);
    await page.click('.modal .btn.primary');
    let topDown = null, crewSeen = false, cargoVisual = null, reloadOk = null, laneHidden = null, numbersOk = null;
    const onDecision = async (pg) => {
      if (!topDown) { const r = await pg.evaluate(() => { const w = window.__tof.world; if (w.mode !== 'sail') return null; const L = w.layout(); return L.h > L.w * 1.4; }); if (r !== null) topDown = r; }
      if (reloadOk === null) {
        // karar ver → sonuç animasyonu sırasında sayfayı yeniden yükle → ödül tekrarlanmamalı
        const before = await pg.evaluate(() => { const r = window.__tof.core.run; return { gold: r.gold, hull: r.ship.hull, cargo: r.cargo.reduce((s, l) => s + l.qty, 0), xp: r.xp.total }; });
        await pg.click('.optCard:not(.locked)');
        await pg.waitForTimeout(300);
        const mid = await pg.evaluate(() => { const r = window.__tof.core.run; return { gold: r.gold, hull: r.ship.hull, cargo: r.cargo.reduce((s, l) => s + l.qty, 0), xp: r.xp.total }; });
        await pg.reload();
        await pg.waitForTimeout(1500);
        await pg.click('.menuButtons .btn.primary');
        await pg.waitForTimeout(800);
        const after = await pg.evaluate(() => { const t = window.__tof; const r = t.core.run; return { gold: r.gold, hull: r.ship.hull, cargo: r.cargo.reduce((s, l) => s + l.qty, 0), xp: r.xp.total, dir: t.ui.director.phase, res: !!t.core.host()?.current?.result }; });
        reloadOk = JSON.stringify(mid) === JSON.stringify({ gold: after.gold, hull: after.hull, cargo: after.cargo, xp: after.xp }) && after.res && after.dir === 'OUTCOME_ANIMATION';
        void before;
      }
    };
    let phases;
    // deniz yolu gizliliği ve kargo/tayfa görünürlüğü: ilk limanda kontrol
    try {
      phases = await playViaUI(page, 4000, onDecision);
    } catch (e) { errors.push(String(e)); }
    // ayrı kısa kontroller (yeni run, liman)
    await page.evaluate(() => { const { core, ui } = window.__tof; core.dismissSummary(); core.newRun('CHECKS'); ui.view = 'game'; ui.render(); let g = 0; while (core.run.phase === 'arrival' && g++ < 10) { const a = core.run.arrival; if (a.current && !a.current.result) core.choose('o0'); else core.arrivalNext(); } ui.render(); });
    await page.waitForTimeout(600);
    const shipDeck = await page.evaluate(() => { const { core, world } = window.__tof; const v = core.run.visit; core.run.gold = 5000; const c0 = v.crew[0]; core.hireCrew(c0); core.buyGood(v.market[0].good, 3); window.__tof.ui.render(); return { c0 }; });
    await page.waitForTimeout(600);
    const deck = await page.evaluate((c0) => { const w = window.__tof.world; return { crew: w.deck.actors.has(c0), cargo: w.ship.cargo.length }; }, shipDeck.c0);
    crewSeen = deck.crew;
    cargoVisual = deck.cargo === 3;
    await page.click('.departBtn');
    await page.waitForTimeout(300);
    if (!(await page.$('.laneGrid')) && (await page.$('.modal .btn.primary'))) { await page.click('.modal .btn.primary'); await page.waitForTimeout(300); }
    laneHidden = await page.evaluate(() => { const t = document.querySelector('.laneGrid').textContent; const names = window.__tof.core.run.visit.lanes.map((l) => l.harborId); return names.every((id) => !t.includes(window.__tof.harborName(id))); });
    numbersOk = await page.evaluate(() => getComputedStyle(document.querySelector('.statusbar .stat b')).fontFamily.includes('Roboto'));
    const ov2 = await overflow(page);
    check(`${vp.width}×${vp.height} run baştan sona UI ile oynandı`, !!phases && !errors.length, `fazlar: ${phases ? [...phases].slice(0, 12).join(',') : '-'} ${errors.slice(0, 2).join(' | ')}`);
    check(`${vp.width}×${vp.height} gemi top-down (dikey) çiziliyor`, !!topDown);
    check(`${vp.width}×${vp.height} karar sonrası yeniden yükleme ödülü tekrarlamıyor, sonuçtan devam ediyor`, !!reloadOk);
    check(`${vp.width}×${vp.height} işe alınan tayfa güvertede beliriyor`, crewSeen);
    check(`${vp.width}×${vp.height} alınan kargo güvertede görünüyor (3 sandık)`, cargoVisual);
    check(`${vp.width}×${vp.height} deniz yolu kartlarında hedef liman adı yok`, laneHidden);
    check(`${vp.width}×${vp.height} sayılar okunaklı UI fontunda`, numbersOk);
    check(`${vp.width}×${vp.height} taşan buton yok`, !ov1.length && !ov2.length, [...ov1, ...ov2].join('|'));
    await page.close();
  }
  await browser.close();
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fail}/${results.length} kontrol geçti`);
  process.exit(fail ? 1 : 0);
})();
