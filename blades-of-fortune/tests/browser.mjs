// Gerçek tarayıcıda (Chromium/Playwright) arayüz üzerinden oynanış testi.
// Kullanım: node tests/browser.mjs [ekran-görüntüsü-klasörü]
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.js').catch(() => ({}))); }
if (!chromium) { console.log('Playwright bulunamadı; tarayıcı testi atlandı.'); process.exit(0); }
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const shots = process.argv[2] || join(root, 'tests', 'shots'); mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await page.goto('file://' + join(root, 'BladesOfFortune.html'));
await page.waitForTimeout(800);
const shot = async (n) => page.screenshot({ path: join(shots, n + '.png') });
const S = (fn, ...a) => page.evaluate(fn, ...a);
await shot('01_menu');
await page.click('button:has-text("Yeni Macera")'); await page.waitForTimeout(900); await shot('02_town');
await page.click('button:has-text("Demirci")').catch(() => page.click('button:has-text("Pazar")')); await page.waitForTimeout(300); await shot('03_shop'); await page.click('.modalBg', { position: { x: 5, y: 5 } });
await page.click('button:has-text("Görev Tahtası")'); await page.waitForTimeout(300); await page.click('.modal .btn.primary >> nth=0').catch(() => {}); await shot('04_board'); await page.click('.modalBg', { position: { x: 5, y: 5 } });
await page.click('button:has-text("Çanta")'); await page.waitForTimeout(300); await shot('05_inventory'); await page.click('.modalBg', { position: { x: 5, y: 5 } });
await page.click('button:has-text("Rota Seçimi")'); await page.waitForTimeout(300); await shot('06_route');
await page.click('.lane >> nth=0'); await page.waitForTimeout(1500); await shot('07_road');
await page.click('button:has-text("»x1")'); // hızlı mod
const seen = { decision: 0, combat: 0, outcome: 0, towns: 1 }; const shotOnce = new Set();
const t0 = Date.now();
while (Date.now() - t0 < 240000 && seen.towns < 4) {
  const st = await S(() => ({ ph: window.__bof.director.phase, comb: window.__bof.director.combatOn, busy: window.__bof.director.busy, ended: !!(window.__bof.game.run && window.__bof.game.run.ended), town: window.__bof.game.run && window.__bof.game.run.phase }));
  if (st.ended) break;
  if (st.ph === 'PLAYER_DECISION' && await page.$('.opt:not(.locked)')) {
    seen.decision++; if (!shotOnce.has('dec')) { shotOnce.add('dec'); await shot('08_decision'); }
    const cards = await page.$$('.opt:not(.locked)'); const fight = await page.$('.opt.fight:not(.locked)');
    await (seen.decision % 3 === 1 && fight ? fight : cards[0]).click(); await page.waitForTimeout(400);
    if (!shotOnce.has('act')) { shotOnce.add('act'); await shot('09_action'); }
  } else if (st.comb && !st.busy && await page.$('.act')) {
    seen.combat++; if (!shotOnce.has('cmb')) { shotOnce.add('cmb'); await shot('10_combat'); }
    const sp = await page.$('.act.primary:not([disabled])'); await (sp || (await page.$('.act >> nth=0'))).click(); await page.waitForTimeout(300);
  } else if (st.ph === 'OUTCOME_ANIMATION' && await page.$('.bottomPanel .btn.big.primary')) {
    seen.outcome++; if (!shotOnce.has('out')) { shotOnce.add('out'); await shot('11_outcome'); }
    if (await page.$('.modal')) { const b = await page.$('.modal .card.item'); if (b) await b.click(); else await page.click('.modal .btn.danger'); }
    await page.click('.bottomPanel .btn.big.primary'); await page.waitForTimeout(300);
  } else if (st.ph === 'DOCKED' && await page.$('.townSide')) {
    seen.towns++; if (!shotOnce.has('town2')) { shotOnce.add('town2'); await page.waitForTimeout(600); await shot('12_town_arrival'); }
    if (await page.$('.modal')) { const b = await page.$('.modal .btn.danger'); if (b) await b.click(); }
    await page.click('button:has-text("Han")').catch(() => {});
    await page.click('button:has-text("Rota Seçimi")'); await page.waitForTimeout(200); await page.click('.lane >> nth=0'); await page.waitForTimeout(500);
  } else {
    if (await page.$('.modal .btn.danger') && st.town !== 'town') await page.click('.modal .btn.danger').catch(() => {});
    await page.waitForTimeout(250);
  }
}
await shot('13_final');
const res = { ...seen, errors: errs, ended: await S(() => window.__bof.game.run && window.__bof.game.run.ended) };
console.log(JSON.stringify(res, null, 1));
await browser.close();
if (errs.length) process.exitCode = 1;
