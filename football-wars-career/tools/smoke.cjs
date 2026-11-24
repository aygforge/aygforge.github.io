// Browser smoke test (Playwright/Chromium): new career -> squad -> week flow -> quick sim -> live battle -> save/reload.
const { chromium } = require('playwright');
const path = require('path');
const url = process.argv[2], shots = process.argv[3], vw = +(process.argv[4] || 390), vh = +(process.argv[5] || 844);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = n => page.screenshot({ path: path.join(shots, `${vw}-${n}.png`) });
  const click = async sel => { await page.click(sel); await page.waitForTimeout(150); };
  await page.goto(url); await page.waitForSelector('[data-act="new"]', { timeout: 15000 });
  await shot('01-title');
  await click('[data-act="new"][data-v="1"]');
  await page.fill('#cName', 'Harbour City FC'); await page.fill('#cShort', 'HCF'); await page.fill('#cCity', 'Harbour City'); await page.fill('#cStadium', 'Harbour Ground');
  await page.selectOption('#cPat', 'stripes'); await page.waitForTimeout(200);
  await shot('02-create');
  await click('[data-act="createNext"]');
  await shot('03-squadbuilder');
  await click('[data-act="createGo"]');
  await page.waitForSelector('.topbar', { timeout: 15000 });
  await page.waitForTimeout(500); await shot('04-dashboard');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await click('[data-act="tutSkip"]');
  await click('[data-act="nav"][data-v="squad"]'); await shot('05-squad');
  await click('[data-act="nav"][data-v="finance"]'); await click('[data-act="sponsor"][data-v="performance"]');
  await click('[data-act="nav"][data-v="transfers"]'); await shot('06-transfers');
  await click('[data-act="nav"][data-v="facilities"]'); await click('[data-act="upgrade"][data-v="fans"]'); await shot('07-facilities');
  await click('[data-act="nav"][data-v="dashboard"]');
  // week 1 -> 2 (world sim)
  await click('[data-act="nextweek"]');
  await page.waitForFunction(() => document.querySelector('[data-act="prep"]'), null, { timeout: 120000 });
  await click('[data-act="prep"]'); await shot('08-prep');
  await click('[data-act="kick"][data-v="quick"]');
  await page.waitForSelector('.report-score', { timeout: 60000 }); await page.waitForTimeout(300); await shot('09-report');
  // week 2 -> 3 -> 4 and play a live match
  for (let k = 0; k < 2; k++) { await click('[data-act="nav"][data-v="dashboard"]'); await click('[data-act="nextweek"]'); await page.waitForTimeout(400); }
  await page.waitForFunction(() => document.querySelector('[data-act="prep"]'), null, { timeout: 180000 });
  await click('[data-act="prep"]'); await click('[data-act="kick"][data-v="play"]');
  await page.waitForSelector('.battle canvas', { timeout: 20000 }); await page.waitForTimeout(4500);
  await page.keyboard.press('1'); await page.waitForTimeout(300); await page.keyboard.press('q');
  await page.waitForTimeout(2500); await shot('10-battle');
  await click('#bskip'); await page.waitForSelector('.report-score', { timeout: 60000 }); await page.waitForTimeout(300); await shot('11-report-live');
  const hasReplay = await page.$('[data-act="replay"]');
  if (hasReplay) { await click('[data-act="replay"]'); await page.waitForTimeout(1500); await click('#bskip'); await page.waitForTimeout(1500); }
  const toastTxt = await page.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
  await click('[data-act="nav"][data-v="tables"]'); await shot('12-tables');
  await click('[data-act="nav"][data-v="cups"]'); await shot('13-cups');
  // reload & continue
  await page.waitForTimeout(800);
  await page.reload(); await page.waitForSelector('[data-act="load"]', { timeout: 15000 }); await click('[data-act="load"][data-v="1"]');
  await page.waitForSelector('.topbar', { timeout: 15000 });
  const week = await page.evaluate(() => document.querySelector('.topbar .sub').textContent);
  console.log(JSON.stringify({ errors, overflow, week, replayToast: toastTxt }, null, 1));
  await browser.close();
})().catch(e => { console.error('SMOKE FAIL', e); process.exit(1); });
