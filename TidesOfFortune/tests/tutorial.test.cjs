// İlk oyun eğitimini gerçek bir oyuncu gibi baştan sona oynar: menüden yeni run açar, her adımda
// vurgulanan öğeye (data-tut) fare ile tıklar. Eğitimin tamamlandığını ve bir daha çıkmadığını doğrular.
// Kullanım: node tests/tutorial.test.cjs [shots]   (shots → docs/tutorial/ altına adım görüntüleri)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SHOTS = process.argv[2] === 'shots';
const OUT = path.resolve(__dirname, '../docs/tutorial');
const FILE = 'file://' + path.resolve(__dirname, '../dist/TidesOfFortune.html');

(async () => {
  if (SHOTS) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: SHOTS ? 2 : 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(FILE + '?hiz=3');
  await page.waitForTimeout(1200);
  const checks = [];
  const ok = (name, cond) => { checks.push([name, !!cond]); console.log(`${cond ? 'GEÇTİ' : 'KALDI'}  ${name}`); };

  // Menü → Yeni run → Denize açıl (gerçek tıklamalar)
  await page.click('.menu .btn.big >> nth=0').catch(() => {});
  await page.waitForTimeout(400);
  const sheetBtn = await page.$('.sheet .btn.primary');
  if (sheetBtn) await sheetBtn.click();
  await page.waitForTimeout(800);

  const state = () => page.evaluate(() => {
    const c = window.__tof.core; const r = c.run; const d = window.__tof.ui.director;
    const bub = document.querySelector('.tutLayer.on .tutBubble');
    return {
      step: r?.tutorial?.step || null, done: !!c.meta.tutorialDone, phase: r?.phase, idx: r?.idx, dphase: d.phase,
      bubble: bub ? bub.innerText.replace(/\s+/g, ' ').slice(0, 90) : null,
      target: !!document.querySelector('[data-tut="1"]'),
      buttons: bub ? [...bub.querySelectorAll('.tutBtns .btn')].map((b) => b.innerText.trim()) : [],
      items: r?.items.length, cargo: r?.cargo.reduce((s, l) => s + l.qty, 0), crew: r?.crew.length, pets: r?.pets.length, gold: r?.gold,
    };
  });

  const seen = new Set();
  let lastStep = null, shot = 0, t0 = Date.now();
  while (Date.now() - t0 < 240000) {
    const st = await state();
    if (st.done) break;
    if (st.step !== lastStep) { lastStep = st.step; seen.add(st.step); console.log('  adım:', st.step, '|', st.bubble); }
    if (SHOTS && st.bubble && !seen.has('shot:' + st.bubble)) { seen.add('shot:' + st.bubble); await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}_${st.step}.png`) }); }
    // sinematik ekranları kapat
    await page.evaluate(() => document.querySelector('.cinematic .cineBtn')?.click());
    // balonda birincil düğme varsa (Başlayalım / Denize açıl) ona bas
    const primary = await page.$('.tutLayer.on .tutBtns .btn.primary');
    if (primary && (st.step === 'welcome' || st.step === 'done')) { await primary.click(); await page.waitForTimeout(500); continue; }
    if (st.target) {
      // hedef bir düğme grubuysa ilk kilitli olmayan düğmeye bas
      const sel = await page.evaluate(() => {
        const el = document.querySelector('[data-tut="1"]');
        if (!el) return null;
        if (el.matches('.tbtns')) { const b = [...el.querySelectorAll('.btn')].find((x) => !x.classList.contains('locked')); if (b) b.setAttribute('data-tut-click', '1'); return b ? '[data-tut-click="1"]' : null; }
        return '[data-tut="1"]';
      });
      if (sel) {
        await page.click(sel, { timeout: 3000 }).catch((e) => console.log('  tıklanamadı:', e.message.split('\n')[0]));
        await page.evaluate(() => document.querySelector('[data-tut-click]')?.removeAttribute('data-tut-click'));
      }
      // ticaret: kargo doluysa ya da para yetmiyorsa "Yeterli, devam"
      await page.waitForTimeout(450);
      continue;
    }
    // balonda başka düğme (Yeterli, devam / Saklayacağım) varsa ve hedef yoksa
    const other = await page.$('.tutLayer.on .tutBtns .btn:not(.tutSkip)');
    if (other) { await other.click(); await page.waitForTimeout(400); continue; }
    // gemi güvende kalsın (yalnızca test: eğitim akışını sınıyoruz)
    await page.evaluate(() => { const r = window.__tof.core.run; if (r && !r.ended) r.ship.hull = Math.max(r.ship.hull, 60); });
    await page.waitForTimeout(400);
  }
  const fin = await state();
  for (const s of ['welcome', 'items', 'trade', 'depart', 'sail', 'sell', 'crew', 'pets', 'done']) ok(`eğitim adımı görüldü: ${s}`, seen.has(s) || (s === 'sell' && fin.done));
  ok('eğitim tamamlandı (meta.tutorialDone)', fin.done);
  ok('3 ücretsiz item seçildi', fin.items >= 3);
  ok('tayfa alındı (eğitim hediyesi)', fin.crew >= 1);
  ok('hayvan alındı (eğitim hediyesi)', fin.pets >= 1);
  // yeniden yükleme ve yeni run: eğitim bir daha çıkmaz
  await page.reload(); await page.waitForTimeout(1200);
  const again = await page.evaluate(() => { const c = window.__tof.core; c.abandonRun?.(); c.dismissSummary?.(); c.newRun('TUTAGAIN'); const ui = window.__tof.ui; ui.view = 'game'; ui.render(); return { done: c.meta.tutorialDone, tut: !!c.run.tutorial }; });
  await page.waitForTimeout(600);
  const layerOn = await page.evaluate(() => !!document.querySelector('.tutLayer.on'));
  ok('yeniden yüklemeden sonra eğitim bir daha çıkmıyor', again.done && !again.tut && !layerOn);
  ok('JS hatası yok', errors.length === 0);
  if (errors.length) console.log(errors.slice(0, 5));
  await browser.close();
  const bad = checks.filter((c) => !c[1]).length;
  console.log(`\n${checks.length - bad}/${checks.length} kontrol geçti`);
  process.exit(bad ? 1 : 0);
})();
