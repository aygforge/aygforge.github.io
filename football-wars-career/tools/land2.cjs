const { chromium } = require('playwright');
(async () => { const out = {};
for (const [w, h] of [[1000, 462], [1000, 230], [412, 915], [412, 420]]) {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:4173/'); await p.waitForSelector('[data-act="new"]'); await p.tap('[data-act="new"][data-v="1"]');
  await p.fill('#cName', 'Aygun'); await p.fill('#cShort', 'Ayg'); await p.fill('#cCity', 'Uzunköprü'); await p.fill('#cStadium', 'Uzunköprü şehir stadyumu');
  const vis = async sel => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }, sel);
  const nextVisible = await vis('[data-act="createNext"]');
  if (w === 1000 && h === 462) await p.screenshot({ path: 'shots/land-create-fixed.png' });
  await p.tap('[data-act="createNext"]'); await p.waitForSelector('#btnGo');
  const goVisible = await vis('#btnGo');
  await p.tap('#btnGo'); await p.waitForSelector('.topbar', { timeout: 15000 });
  out[w + 'x' + h] = { nextVisible, goVisible, reachedDashboard: true, errs };
  await b.close(); }
console.log(JSON.stringify(out, null, 1)); })();
