const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(process.argv[2]); await p.waitForSelector('[data-act="new"]');
await p.tap('[data-act="new"][data-v="1"]'); await p.fill('#cName', 'Pocket Athletic'); await p.fill('#cShort', 'PKA'); await p.fill('#cCity', 'Pocket');
await p.tap('[data-act="createNext"]'); const sb = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); await p.tap('[data-act="createGo"]'); await p.waitForSelector('.topbar'); await p.tap('[data-act="tutSkip"]');
const res = { squadBuilderOverflow: sb };
for (const v of ['dashboard', 'squad', 'transfers', 'scouting', 'academy', 'facilities', 'calendar', 'tables', 'cups', 'finance', 'history', 'settings']) {
  await p.evaluate(v => document.querySelector(`[data-act="nav"][data-v="${v}"]`).click(), v); await p.waitForTimeout(150);
  const o = await p.evaluate(() => { const ov = document.documentElement.scrollWidth - innerWidth; const small = [...document.querySelectorAll('main button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height < 30; }).length; return { ov, small }; });
  res[v] = o; if (v === 'squad' || v === 'tables') await p.screenshot({ path: `shots/pixel7-${v}.png` });
}
console.log(JSON.stringify({ errs, res })); await b.close(); })();
