// Görsel regresyon: sabit bir ekran listesini verilen HTML'den yakalar (önce/sonra karşılaştırması için).
// Kullanım: node tools/visual.cjs <html> <çıktı klasörü>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const [, , html, out] = process.argv;
fs.mkdirSync(out, { recursive: true });
const URL = 'file://' + path.resolve(html) + '?hiz=1';
const SHOTS = [
  ['01_menu', null],
  ['02_tutorial', 'tutorial'],
  ['03_voyage', { ev: 'EVT_M_05', at: 900 }],
  ['04_old_event', { ev: 'EVT_D_01', opt: 0, at: 5200 }],
  ['05_x2_race', { ev: 'CH_X2_RACE_3', opt: 0, at: 5200 }],
  ['06_ship_l1', { ev: 'EVT_M_05', at: 900, level: 1 }],
  ['07_ship_l2', { ev: 'EVT_M_05', at: 900, level: 2 }],
  ['08_ship_l3', { ev: 'EVT_M_05', at: 900, level: 3 }],
  ['09_ship_l4', { ev: 'EVT_M_05', at: 900, level: 4 }],
  ['10_ship_l5', { ev: 'EVT_M_05', at: 900, level: 5 }],
  ['11_pets', { ev: 'EVT_M_05', at: 900, pets: ['PET_TARCIN', 'PET_ZIPIR'] }],
  ['12_pirate', { ev: 'EVT_D_01', opt: 1, at: 7000 }],
  ['13_multiship', { ev: 'EVT_X2_F04', opt: 0, at: 6500 }],
  ['14_diver', { ev: 'EVT_X2_CREW03', opt: 0, at: 6000 }],
];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  for (const [name, s] of SHOTS) {
    await page.goto(URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(URL);
    await page.waitForTimeout(900);
    if (s === 'tutorial') {
      await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Yeni|Başla|Oyna/i.test(x.textContent)); b?.click(); });
      await page.waitForTimeout(1800);
    } else if (s) {
      await page.evaluate((s) => {
        window.__tof.core.meta.tutorialDone = true;
        window.__tofForceEvent(s.ev, s.opt ?? 0);
        const r = window.__tof.core.run;
        if (s.level) r.ship.level = s.level;
        if (s.pets) r.pets = s.pets;
        window.__tof.ui.render();
      }, s);
      if (s.opt != null) {
        const t0 = Date.now();
        while (Date.now() - t0 < 20000) {
          const d = await page.evaluate(() => window.__tof.ui.director.phase);
          if (d === 'PLAYER_DECISION') { await page.evaluate((k) => window.__tof.ui.director.choose('o' + k), s.opt); break; }
          await page.waitForTimeout(100);
        }
      }
      await page.waitForTimeout(s.at);
    }
    await page.screenshot({ path: path.join(out, name + '.png') });
  }
  await browser.close();
  console.log('ok', SHOTS.length, errs.length ? 'HATA ' + errs.slice(0, 3).join(' | ') : '');
})();
