// Road to Glory browser smoke: create club -> first battle (watch at 2x) -> results -> tabs. Screenshots for review.
const { chromium } = require('playwright'); const path = require('path');
const OUT = process.env.SHOTS || '.'; const FILE = 'file://' + path.resolve(__dirname, '../FootballWars_Full_Test.html');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE); await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/60_create.png', fullPage: true });
  await p.fill('#ccName', 'Kadıköy Rockets'); await p.click('[data-cc="shape:hex"]'); await p.click('[data-cc="sym:5"]');
  await p.click('[data-cc="primary:#3a86ff"]'); await p.click('[data-cc="secondary:#fcbf49"]'); await p.click('[data-cc="form:attack"]');
  await p.click('#ccGo'); await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/61_club.png', fullPage: true });
  await p.click('.battle-btn'); await p.waitForTimeout(9000);
  await p.screenshot({ path: OUT + '/62_battle.png' });
  await p.click('#btSpeed');
  for (let i = 0; i < 200; i++) { await p.waitForTimeout(400); if (await p.evaluate(() => !ArcadeApp.st.battle)) break;
    if (await p.evaluate(() => ArcadeApp.st.battle.ended)) await p.click('#btSkip').catch(() => {}); }
  await p.waitForTimeout(400); await p.screenshot({ path: OUT + '/63_results.png', fullPage: true });
  console.log(JSON.stringify(await p.evaluate(() => { const s = ArcadeApp.st.save; return { played: s.officialPlayed, credits: s.credits, pd: !!s.pendingDecision, powers: s.powers.mastery, round: s.league.round }; })));
  await p.click('#modal [data-m="next"], #modal [data-m="accept"]').catch(() => {});
  for (const t of ['squad', 'powers', 'league', 'rewards']) { await p.click('#tabbar [data-tab="' + t + '"]'); await p.waitForTimeout(250); await p.screenshot({ path: OUT + '/64_' + t + '.png', fullPage: true }); }
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  console.log('horizontal overflow', overflow, 'errors', errs.slice(0, 5));
  await b.close();
})();
