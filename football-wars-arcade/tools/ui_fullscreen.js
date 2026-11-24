// Full-screen button test (top bar + battle screen + F key).
const { chromium } = require('playwright'); const path = require('path');
const OUT = process.env.SHOTS || '.'; const FILE = 'file://' + path.resolve(__dirname, '../FootballWars_Full_Test.html');
let pass = 0, fail = 0; const T = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 400, height: 820 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const full = () => p.evaluate(() => !!document.fullscreenElement);
  await p.goto(FILE); await p.waitForTimeout(300);
  await p.click('#ccGo'); await p.waitForTimeout(200);
  T('FS1 full-screen button in top bar', await p.isVisible('#topbar .fsbtn'));
  await p.click('#topbar .fsbtn'); await p.waitForTimeout(300);
  T('FS2 top-bar button enters full screen', await full());
  await p.screenshot({ path: OUT + '/40_fullscreen_home.png' });
  await p.click('#topbar .fsbtn'); await p.waitForTimeout(300);
  T('FS3 same button exits full screen', !(await full()));
  await p.click('.battle-btn'); await p.waitForTimeout(800);
  T('FS4 full-screen button on battle screen', await p.isVisible('#btFull'));
  await p.click('#btFull'); await p.waitForTimeout(400);
  const sz = await p.evaluate(() => [document.getElementById('stage').style.height, ArcadeApp.st.battle && !!ArcadeApp.st.battle.w]);
  T('FS5 battle full screen, battle keeps running, canvas refitted', (await full()) && sz[1], sz);
  await p.screenshot({ path: OUT + '/41_fullscreen_battle.png' });
  await p.click('#btFull'); await p.waitForTimeout(300);
  T('FS6 battle-screen button exits full screen', !(await full()));
  T('FS7 no page errors', errs.length === 0, errs);
  console.log('fullscreen tests: ' + pass + ' pass, ' + fail + ' fail');
  await b.close();
})();
