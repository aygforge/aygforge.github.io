// Desktop layout screenshot + rough frame-rate sample of a live battle (headless Chromium = software rendering,
// so numbers are a lower bound, not a device benchmark).
const { chromium } = require('playwright'); const path = require('path');
const OUT = process.env.SHOTS || '.'; const FILE = 'file://' + path.resolve(__dirname, '../FootballWars_Full_Test.html');
(async () => {
  const b = await chromium.launch();
  for (const [name, vp, q] of [['desktop', { width: 1280, height: 800 }, 'medium'], ['mobile_low', { width: 393, height: 852 }, 'low'], ['mobile_high', { width: 393, height: 852 }, 'high']]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(FILE); await p.waitForTimeout(300);
    await p.click('#ccGo'); await p.waitForTimeout(200);
    await p.evaluate(q => { ArcadeApp.st.save.settings.quality = q; ArcadeApp.persist(); }, q);
    if (name === 'desktop') await p.screenshot({ path: OUT + '/30_desktop_home.png' });
    await p.click('.battle-btn'); await p.waitForTimeout(3500);
    const fps = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
    const st = await p.evaluate(() => { const w = ArcadeApp.st.battle.w; return { alive: [w.teams[0].alive, w.teams[1].alive], parts: w.parts.length, t: +w.battleT.toFixed(1), powers: w.pow.used.length }; });
    if (name === 'desktop') await p.screenshot({ path: OUT + '/31_desktop_battle.png' });
    console.log(name, 'quality=' + q, 'fps~' + fps.toFixed(1), JSON.stringify(st), errs.length ? errs : 'no errors');
    await ctx.close();
  }
  await b.close();
})();
