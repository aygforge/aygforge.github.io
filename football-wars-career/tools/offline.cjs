const { chromium, firefox } = require('playwright');
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch(); const ctx = await b.newContext({ offline: true }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url); await p.waitForSelector('[data-act="new"]', { timeout: 15000 });
  await p.click('[data-act="new"][data-v="2"]'); await p.fill('#cName', 'Offline Rovers'); await p.fill('#cShort', 'OFR'); await p.fill('#cCity', 'Nowhere');
  await p.click('[data-act="createNext"]'); await p.click('[data-act="createGo"]'); await p.waitForSelector('.topbar');
  const t0 = Date.now(); await p.click('[data-act="tutSkip"]'); await p.click('[data-act="nextweek"]');
  await p.waitForFunction(() => /Week 2\//.test(document.querySelector('.topbar .sub').textContent), null, { timeout: 180000 });
  const wk1 = (Date.now() - t0) / 1000;
  await p.click('[data-act="nav"][data-v="settings"]');
  const info = await p.evaluate(() => document.querySelector('main .card p.small').textContent);
  await p.reload(); await p.waitForSelector('[data-act="load"]', { timeout: 15000 });
  const slotTxt = await p.evaluate(() => document.getElementById('slots').textContent.replace(/\s+/g, ' '));
  console.log(JSON.stringify({ url: url.slice(0, 60), errs, week1Seconds: wk1, info, slotTxt }, null, 1));
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
