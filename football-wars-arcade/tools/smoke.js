const { chromium } = require('playwright');
const OUT = process.env.SHOTS || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await ctx.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : (errs.push('NETWORK ' + r.request().url()), r.abort()));
  await p.goto('file://' + require('path').resolve(__dirname, '../FootballWars_Arcade_Mayhem.html'));
  await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/01_title.png' });
  await p.fill('#clubSearch', 'galatasaray');
  await p.waitForTimeout(200);
  const rows = await p.$$eval('.clubrow', r => r.map(x => x.innerText.replace(/\n/g, ' | ')));
  console.log('search galatasaray ->', rows);
  await p.click('.clubrow');
  await p.click('#startBtn');
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/02_home.png', fullPage: true });
  // live battle
  await p.click('.battle-btn');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/03_battle_intro.png' });
  // wait until strike ready
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) { await p.waitForTimeout(500); ready = await p.$eval('#strikeBtn', e => e.classList.contains('ready')); }
  console.log('strike ready', ready);
  await p.screenshot({ path: OUT + '/04_battle_ready.png' });
  await p.keyboard.press('Space');
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/05_battle_strike.png' });
  const used = await p.evaluate(() => ArcadeApp.st.battle && ArcadeApp.st.battle.w.arc.used.filter(m => m.side === 0));
  console.log('player strikes', JSON.stringify(used));
  // 2x speed until end
  await p.click('#btSpeed');
  for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); const v = await p.evaluate(() => !ArcadeApp.st.battle); if (v) break; const e = await p.evaluate(() => ArcadeApp.st.battle && ArcadeApp.st.battle.w && ArcadeApp.st.battle.w.phase === 'ended'); if (e) { await p.waitForTimeout(800); await p.screenshot({ path: OUT + '/06_battle_end.png' }); await p.click('#btSkip').catch(() => {}); } }
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/07_results.png', fullPage: true });
  const res = await p.evaluate(() => { const s = ArcadeApp.st.save; return { credits: s.credits, xp: s.xp, frags: s.fragments, round: s.league.round, pendingDecision: !!s.pendingDecision, stats: s.stats, ai: s.league.aiQueue.length }; });
  console.log('after battle', JSON.stringify(res));
  console.log('ERRORS', errs.length ? errs : 'none');
  await b.close();
})();
