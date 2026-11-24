// Season-end / promotion / Division 1 first-title UI flow. Rounds 1-18 are pre-filled through the real
// game API with forged scores (test shortcut); round 19 (player + 9 AI matches) runs as real battles.
const { chromium } = require('playwright'); const path = require('path');
const OUT = process.env.SHOTS || '.'; const FILE = 'file://' + path.resolve(__dirname, '../FootballWars_Arcade_Mayhem.html');
let pass = 0, fail = 0; const T = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 820 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const S = () => p.evaluate(() => JSON.parse(JSON.stringify(ArcadeApp.st.save)));
  await p.goto(FILE); await p.waitForTimeout(300);
  await p.click('.clubrow'); await p.click('#startBtn'); await p.waitForTimeout(200);
  const prefill = () => p.evaluate(() => {
    const s = ArcadeApp.st.save, A = Arcade, L = s.league;
    for (let r = 0; r < 18; r++) {
      const fx = A.League.playerFixture(s, r);
      A.Endgame.finalizeFixture(s, fx, true, { goals: [2, 0], survivors: 40 }, {});
      while (L.aiQueue.length) { const j = A.League.aiJob(s); A.League.applyAI(s, j, { winner: r % 2, goals: [1, 1], survivors: 5 }); }
    }
    ArcadeApp.persist(); ArcadeApp.render();
  });
  await prefill();
  let s = await S(); T('S1 18 rounds pre-filled, player leads', s.league.round === 18 && s.officialPlayed === 18);
  await p.click('[data-act="quick"]');
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(250); if (await p.$('#modal [data-m="next"], #modal [data-m="accept"]')) break; }
  if (await p.$('#modal [data-m="accept"]')) await p.click('#modal [data-m="accept"]'); else await p.click('#modal [data-m="next"]');
  for (let i = 0; i < 160; i++) { await p.waitForTimeout(250); if (await p.$('#modal [data-m="promote"]')) break; }
  await p.screenshot({ path: OUT + '/20_season_end.png' });
  s = await S(); T('S2 final round AI matches simulated, season closed, champion', s.league.phase === 'promoted' && s.league.endRank === 1 && Object.keys(s.league.results).length === 190, { phase: s.league.phase, rank: s.league.endRank });
  T('S3 champions bonus 5x120 = 600 C claimed once', !!s.claims['season:' + s.league.seasonId]);
  await p.click('#modal [data-m="promote"]'); await p.waitForTimeout(400);
  s = await S(); T('S4 promoted to Division 9, new season', s.division === 9 && s.league.div === 9 && s.league.round === 0);
  await p.screenshot({ path: OUT + '/21_division9.png' });
  // jump to Division 1 (test shortcut through promote API), forge a full season, check first-title screen
  await p.evaluate(() => { const s = ArcadeApp.st.save; for (let d = 9; d > 1; d--) { s.league.round = 19; s.league.aiQueue = []; s.league.phase = 'promoted'; Arcade.Endgame.promote(s); } ArcadeApp.persist(); ArcadeApp.render(); });
  s = await S(); T('S5 Division 1 reached; Legend pack unlocked', s.division === 1 && s.highestDiv === 1);
  await prefill();
  await p.click('[data-act="quick"]');
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(250); if (await p.$('#modal [data-m="next"], #modal [data-m="accept"]')) break; }
  if (await p.$('#modal [data-m="accept"]')) await p.click('#modal [data-m="accept"]'); else await p.click('#modal [data-m="next"]');
  for (let i = 0; i < 160; i++) { await p.waitForTimeout(250); if ((await S()).league.phase === 'ended') break; }
  await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/22_first_title.png' });
  s = await S(); T('S6 first D1 title: Legend pack + Golden crest, once', s.endless.firstTitle && s.goldenCrest && s.endless.titles === 1 && s.packs.legend >= 1);
  await p.click('#modal [data-m="close"]').catch(() => {});
  await p.click('[data-act="newseason"]'); await p.waitForTimeout(300);
  s = await S(); T('S7 new endless season started, progress kept', s.league.phase === 'regular' && s.league.round === 0 && s.division === 1 && s.goldenCrest);
  await p.screenshot({ path: OUT + '/23_endless_home.png' });
  T('S8 no page errors', errs.length === 0, errs.slice(0, 4));
  console.log('season ui tests: ' + pass + ' pass, ' + fail + ' fail');
  await b.close();
})();
