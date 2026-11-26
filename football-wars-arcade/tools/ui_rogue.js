// Browser tests (Playwright, preinstalled Chromium) for FootballWars_Roguelite_Reborn.html.
// The wave is advanced with the same E.step() the live loop uses (fixed 60 Hz ticks), only faster than real time.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const FILE = 'file://' + path.join(__dirname, '../FootballWars_Roguelite_Reborn.html');
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0; const ok = (n, c, info) => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (info != null ? ' — ' + info : '')); };
const shot = async (p, n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
const ff = (p, ticks) => p.evaluate(n => { const B = FWArcadeUI.st.battle; for (let i = 0; i < n && B.w.phase !== 'ended'; i++) FWEngine.step(B.w); return B.w.tick; }, ticks);
async function newPage(b, vp) { const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: SHOTS ? 2 : 1 }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); return p; }
async function playWaveToEnd(p) { for (let i = 0; i < 40; i++) { const t = await ff(p, 400); const done = await p.evaluate(() => FWArcadeUI.st.battle && FWArcadeUI.st.battle.w.phase === 'ended'); if (done) break; void t; } await p.waitForTimeout(150); await p.click('#btSkip'); await p.waitForTimeout(250); }
async function playRun(p) { // picks the first card, starts each wave, fast-forwards, until the result screen
  for (let g = 0; g < 30; g++) {
    const ph = await p.evaluate(() => { const s = FWArcadeUI.st.save; return s.run ? s.run.phase : 'none'; });
    if (ph === 'none') return;
    if (ph === 'draft') await p.click('[data-pick]');
    else if (ph === 'ready') { await p.click('[data-act="wave"]'); await p.waitForTimeout(200); await playWaveToEnd(p); }
    else if (ph === 'clear') await p.click('[data-act="afterclear"]');
    await p.waitForTimeout(120);
  }
}
(async () => {
  const b = await chromium.launch();
  const p = await newPage(b, { width: 360, height: 800 });
  await p.goto(FILE); await p.waitForTimeout(500);
  ok('HQ opens on load', await p.isVisible('text=ARCADE HQ') && await p.isVisible('[data-act="brief"]'));
  ok('validation passes in browser', await p.evaluate(() => FWRogue.Validation.run().ok));
  await shot(p, '01_arcade_hq');
  for (const v of ['map', 'training', 'codex', 'leaders', 'trophy', 'settings']) { await p.click('[data-nav="' + v + '"]'); await p.waitForTimeout(150); if (v !== 'training') await shot(p, '11_tab_' + v); }
  ok('all six tabs render without errors', p.errs.length === 0, p.errs.join('; '));
  await p.click('[data-nav="map"]'); await p.waitForTimeout(100);
  ok('Episode map shows 20 nodes', (await p.$$('.node')).length === 20);
  ok('only Level 1 open', await p.evaluate(() => document.querySelectorAll('.node.open').length === 1 && document.querySelector('.node.open').dataset.node === '1'));
  await p.click('[data-node="5"]'); await p.waitForTimeout(100);
  ok('locked level cannot start', !(await p.isVisible('[data-act="start"]')));
  await p.click('[data-act="close"]');
  await p.click('[data-node="1"]'); await p.waitForTimeout(100); await shot(p, '02_briefing');
  await p.click('[data-act="start"]'); await p.waitForTimeout(150);
  ok('draft shows 3 different cards', await p.evaluate(() => { const c = [...document.querySelectorAll('[data-pick]')].map(x => x.dataset.pick); return c.length === 3 && new Set(c).size === 3; }));
  ok('run has exactly 100 players', await p.evaluate(() => FWArcadeUI.st.save.run.roster.length === 100));
  await shot(p, '03_draft');
  const offer = await p.evaluate(() => FWArcadeUI.st.save.run.draft.offer.join());
  await p.reload(); await p.waitForTimeout(400); await p.click('[data-act="continue"]'); await p.waitForTimeout(150);
  ok('pending draft offer restored identically after reload', offer === await p.evaluate(() => [...document.querySelectorAll('[data-pick]')].map(x => x.dataset.pick).join()));
  await p.click('[data-pick]'); await p.waitForTimeout(100);
  await p.click('[data-act="wave"]'); await p.waitForTimeout(300);
  ok('battle visible with HUD', await p.isVisible('#stage') && await p.isVisible('[data-focus="goal"]') && await p.isVisible('#hSurv'));
  await ff(p, 400); // into the battle phase
  await p.click('[data-focus="ko"]'); await ff(p, 2);
  ok('KO Focus applied by the engine', await p.evaluate(() => FWArcadeUI.st.battle.w.rg.focus.kind === 'ko' && FWArcadeUI.st.battle.w.rg.focus.uses === 1));
  await p.click('[data-focus="goal"]', { force: true }); await ff(p, 2); // aria-disabled while another Focus runs
  ok('second Focus refused while one is active', await p.evaluate(() => FWArcadeUI.st.battle.w.rg.focus.uses === 1));
  await p.waitForTimeout(400); await shot(p, '04_battle_focus');
  // pause: ticks and Focus timer stop
  await p.click('#btPause'); const t0 = await p.evaluate(() => FWArcadeUI.st.battle.w.tick); await p.waitForTimeout(700);
  ok('pause stops the simulation', t0 === await p.evaluate(() => FWArcadeUI.st.battle.w.tick));
  await shot(p, '05_pause');
  await p.click('[data-act="bt-resume"]'); await p.waitForTimeout(300);
  ok('resume continues', t0 < await p.evaluate(() => FWArcadeUI.st.battle.w.tick));
  // checkpoint + reload restores the same wave state (deterministic replay of the logged Focus ticks)
  await ff(p, 120); await p.click('#btPause'); await p.waitForTimeout(200); // pausing writes a checkpoint and freezes the world
  const before = await p.evaluate(() => { const B = FWArcadeUI.st.battle, P = FWArcadeUI.st.save.run.pending; return { tick: P.lastTick, inputs: P.inputs.length }; });
  const ref = await p.evaluate(t => { const B = FWArcadeUI.st.battle, w = FWEngine.createWorld(FWRogue.Battle.worldOpts(B.snap, { headless: true, inputs: B.inputs })); while (w.tick < t) FWEngine.step(w); return [w.hash, w.teams[0].alive, w.teams[1].alive]; }, before.tick);
  await p.reload(); await p.waitForTimeout(400);
  ok('HQ shows CONTINUE for the active run', await p.isVisible('[data-act="continue"]'));
  await p.click('[data-act="continue"]'); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => { const w = FWArcadeUI.st.battle.w; return [w.hash, w.teams[0].alive, w.teams[1].alive, w.tick]; });
  ok('resumed wave matches the deterministic replay', after[0] === ref[0] && after[1] === ref[1] && after[2] === ref[2] && after[3] === before.tick, JSON.stringify([ref, after]));
  ok('resume starts paused', await p.isVisible('#pauseBox'));
  ok('army is never rebuilt to 100 on resume', after[1] <= 100 && await p.evaluate(() => FWArcadeUI.st.save.run.roster.length === 100));
  await p.click('[data-act="bt-resume"]');
  await playWaveToEnd(p);
  ok('wave clear screen', await p.isVisible('[data-act="afterclear"]'));
  await shot(p, '06_wave_clear');
  const surv = await p.evaluate(() => { const r = FWArcadeUI.st.save.run; return [r.roster.filter(u => u.alive).length, r.waveLog[0].end, r.roster.length]; });
  ok('K.O.\'d players stay out after the wave', surv[0] === surv[1] && surv[2] === 100, surv.join('/'));
  await p.click('[data-act="afterclear"]'); await p.waitForTimeout(100);
  ok('draft after wave 1', await p.evaluate(() => FWArcadeUI.st.save.run.phase === 'draft'));
  await playRun(p);
  const res = await p.evaluate(() => FWArcadeUI.st.save.lastResult);
  ok('level result screen', await p.isVisible('.result'), res && res.kind);
  await shot(p, '07_result');
  const coins = await p.evaluate(() => FWArcadeUI.st.save.coins);
  ok('result paid Coins', coins > 0 && coins === res.coins, coins);
  await p.reload(); await p.waitForTimeout(400);
  ok('Coins persisted across reload', coins === await p.evaluate(() => FWArcadeUI.st.save.coins));
  if (res.kind === 'win') {
    await p.click('[data-nav="map"]'); await p.click('[data-node="1"]'); await p.waitForTimeout(100);
    ok('completed level cannot be replayed (record only)', !(await p.isVisible('[data-act="start"]')) && await p.isVisible('text=first clear'));
    await p.click('[data-act="close"]');
    ok('re-applying the first clear pays nothing', await p.evaluate(() => { const s = FWArcadeUI.st.save, c = s.coins; return FWRogue.tx(s, 'level:1:first_clear', () => { s.coins += 999; }) === false && s.coins === c; }));
  }
  await p.click('[data-nav="training"]'); await p.waitForTimeout(100);
  const lv0 = await p.evaluate(() => FWArcadeUI.st.save.training.attack);
  await p.click('[data-train="attack"]'); await p.waitForTimeout(100);
  ok('Training purchase', await p.evaluate(l => FWArcadeUI.st.save.training.attack === l + 1, lv0));
  await shot(p, '08_training');
  ok('no page errors (360×800)', p.errs.length === 0, p.errs.join('; '));
  // Level 200 → Campaign Complete (career state prepared in the save; the level itself is played for real)
  {
    const c = await newPage(b, { width: 360, height: 800 }); await c.goto(FILE); await c.waitForTimeout(300);
    await c.evaluate(() => { const s = FWArcadeUI.st.save; s.highest = 199; for (let l = 1; l < 200; l++) { s.completed[l] = { medal: 'silver', survivors: 50, waveSurvivors: [], leadersAlive: [], leadersAtStart: [], cards: [], focus: [], goals: 0, training: s.training, coins: 0, attempt: 1, at: Date.now(), level: l }; s.ledger['level:' + l + ':first_clear'] = 1; }
      for (const b of FWCampaignData.BOSS_LEVELS) if (b < 200) s.cups[b] = { at: Date.now(), survivors: 30, medal: 'silver' }; for (const k in s.training) s.training[k] = 100; s.leaders = FWLeaders.LEADERS.map(l => l.id); s.cards = FWCards.CARDS.map(x => x.id); FWRogue.Save.persist(s); FWArcadeUI.go('hq'); });
    let won = false;
    for (let a = 0; a < 4 && !won; a++) {
      await c.click('[data-act="brief"], [data-act="retry"]'); await c.waitForTimeout(150); if (await c.isVisible('[data-act="start"]')) await c.click('[data-act="start"]'); await c.waitForTimeout(150);
      await playRun(c); won = await c.evaluate(() => FWArcadeUI.st.save.campaignCompleted);
    }
    ok('Level 200 cleared for real → campaignCompleted saved', won);
    if (won) {
      await c.click('[data-act="complete"]'); await c.waitForTimeout(200); await shot(c, '10_campaign_complete');
      ok('Campaign Complete screen: 200/200, cups, cards, leaders', await c.isVisible('text=CAMPAIGN COMPLETE') && await c.isVisible('text=200/200'));
      await c.reload(); await c.waitForTimeout(400);
      ok('after reload: no PLAY, no Level 201', !(await c.isVisible('[data-act="brief"]')) && await c.evaluate(() => !FWRogue.Progress.canStart(FWArcadeUI.st.save, 201) && FWRogue.Progress.next(FWArcadeUI.st.save) === null));
      await c.click('[data-nav="training"]'); await c.waitForTimeout(100);
      ok('Training read-only after the campaign', await c.evaluate(() => [...document.querySelectorAll('[data-train]')].every(x => x.disabled)) && await c.isVisible('text=read-only'));
      await c.click('[data-nav="map"]'); await c.click('[data-ep="10"]'); await c.waitForTimeout(100);
      ok('Episode map: every level done, none startable', await c.evaluate(() => document.querySelectorAll('.node.done').length === 20 && !document.querySelector('.node.open')));
    }
    ok('no page errors (campaign)', c.errs.length === 0, c.errs.join('; '));
    await c.context().close();
  }
  // other portrait sizes: battle HUD, ball and Focus buttons stay on screen
  for (const vp of [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 360, height: 780 }]) {
    const q = await newPage(b, vp); await q.goto(FILE); await q.waitForTimeout(300);
    await q.click('[data-act="brief"]'); await q.click('[data-act="start"]'); await q.click('[data-pick]'); await q.click('[data-act="wave"]'); await q.waitForTimeout(300);
    await q.evaluate(() => { const B = FWArcadeUI.st.battle; for (let i = 0; i < 900; i++) FWEngine.step(B.w); }); await q.waitForTimeout(250);
    const g = await q.evaluate(() => { const r = e => document.querySelector(e).getBoundingClientRect(); const c = r('#stage'), f = r('.focusrow'), h = r('.bhud');
      return { cv: c, foot: f.bottom <= innerHeight + 0.5 && f.top >= c.bottom - 1, hud: h.top >= 0, share: c.height / innerHeight, btn: Math.min(...[...document.querySelectorAll('.fbtn')].map(b => b.getBoundingClientRect().height)), noScroll: document.documentElement.scrollWidth <= innerWidth }; });
    ok(vp.width + '×' + vp.height + ': canvas, HUD and Focus buttons on screen', g.foot && g.hud && g.cv.width > 150 && g.noScroll, JSON.stringify({ share: g.share.toFixed(2), btn: g.btn }));
    ok(vp.width + '×' + vp.height + ': touch targets ≥ 44 px', g.btn >= 44, g.btn);
    if (SHOTS && vp.width === 412) await shot(q, '09_battle_412');
    ok(vp.width + '×' + vp.height + ': no page errors', q.errs.length === 0, q.errs.join('; '));
    await q.context().close();
  }
  await b.close();
  console.log('\nui_rogue: ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
