// End-to-end smoke test in Chromium: new career, all screens, live match, reload persistence.
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const W = +(process.env.VW || 844), Hh = +(process.env.VH || 390);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: Hh }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; global.__errs = errors;
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await page.goto(url);
  await page.waitForTimeout(600);
  const shot = async n => page.screenshot({ path: `${OUT}/${W}_${n}.png` });
  await shot('01_title');
  await page.click('text=Yeni Kariyer');
  await page.waitForSelector('text=Yeni Ludus Kur', { timeout: 15000 });
  await shot('02_mode');
  await page.click('text=Yeni Ludus Kur');
  await page.click('[data-a=setupReg][data-r=nemeris]');
  await page.fill('#lname', 'Ludus Testus');
  await page.click('[data-a=setupShape][data-i="2"]');
  await page.click('[data-a=setupSym][data-i="4"]');
  await shot('03_newludus');
  await page.click('[data-a=setupNewConfirm]');
  await page.waitForSelector('#tut .bubble');
  await shot('04_tut1');
  for (let i = 1; i < 8; i++) { await page.click('[data-a=tutNext]'); await page.waitForTimeout(150); if (i === 1 || i === 4 || i === 6) await shot('05_tut' + (i + 1)); }
  await page.click('[data-a=tutNext]');
  await page.waitForTimeout(200);
  await shot('06_hub');
  for (const s of ['squad', 'match', 'market', 'leagues', 'cups', 'facilities', 'equipment', 'sponsors', 'finance', 'history', 'settings']) {
    await page.click(`#nav-${s}`); await page.waitForTimeout(200); await shot('10_' + s);
  }
  // profile
  await page.click('#nav-squad'); await page.click('.gcard[data-gid] [data-a=profile]'); await page.waitForTimeout(200); await shot('11_profile');
  // pick sponsor
  await page.click('#nav-sponsors'); await page.click('[data-a=sponsorAccept][data-i="0"]'); await page.waitForTimeout(100);
  // market: open first free agent negotiation
  await page.click('#nav-market'); await page.click('[data-a=marketTab][data-t=free]'); await page.waitForTimeout(200);
  await page.click('.grow-row[data-g]'); await page.waitForTimeout(200); await shot('12_freeprofile');
  // league table / cup
  await page.click('#nav-leagues'); await page.click('[data-a=club]'); await page.waitForTimeout(150); await shot('13_clubmodal'); await page.keyboard.press('Escape');
  // advance to week 2 (first league match). week0 -> 1 -> 2
  for (let k = 0; k < 2; k++) {
    await page.click('#btn-next'); await page.waitForTimeout(150);
    const conf = await page.$('[data-a=confirmOk]'); if (conf) await conf.click();
    await page.waitForFunction(() => document.getElementById('busy').hidden, null, { timeout: 30000 });
  }
  await shot('14_hub_w2');
  await page.click('#btn-next'); await page.waitForTimeout(200); await shot('15_matchmodal');
  await page.click('[data-a=flowLive]');
  await page.waitForTimeout(1500); await shot('16_battle_a');
  await page.click('[data-a=bcmd][data-c=attack]');
  await page.click('[data-a=bspeed][data-v="2"]');
  await page.waitForTimeout(2500); await shot('17_battle_b');
  await page.click('[data-a=bcmd][data-c=focus]'); await page.waitForTimeout(200);
  const tgt = await page.$('.bf.tg'); if (tgt) await tgt.click();
  await page.waitForTimeout(2500); await shot('18_battle_c');
  await page.click('[data-a=bspeed][data-v="4"]');
  await page.waitForTimeout(3000); await shot('19_battle_d');
  await page.click('[data-a=bspeed][data-v=sim]');
  await page.waitForSelector('[data-a=resultContinue]', { timeout: 20000 });
  await page.waitForTimeout(300); await shot('20_result');
  await page.click('[data-a=resultContinue]');
  await page.waitForFunction(() => document.getElementById('busy').hidden, null, { timeout: 30000 });
  await page.waitForTimeout(300); await shot('21_hub_w3');
  const st1 = await page.evaluate(() => ({ s: S.season, w: S.week, b: GameState.player().budget, n: GameState.player().n }));
  // reload and continue
  await page.reload(); await page.waitForTimeout(800);
  await page.waitForSelector('#btn-cont:not([disabled])', { timeout: 10000 });
  await page.click('#btn-cont'); await page.waitForTimeout(500);
  const st2 = await page.evaluate(() => ({ s: S.season, w: S.week, b: GameState.player().budget, n: GameState.player().n }));
  console.log('before reload', JSON.stringify(st1), 'after', JSON.stringify(st2), JSON.stringify(st1) === JSON.stringify(st2) ? 'PERSIST OK' : 'PERSIST MISMATCH');
  await shot('22_after_reload');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('TEST FAILED', e.message.split('\n')[0]); console.log('ERRORS:\n' + (global.__errs || []).join('\n')); process.exit(1); });
