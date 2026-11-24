// ARCADE MAYHEM browser tests: touch targeting (mobile) + mouse/keyboard (desktop), real commands applied by the engine,
// pending-battle resume replays the recorded commands, results screen, v1 save migration with a legacy unfinished battle.
const { chromium } = require('playwright'); const path = require('path');
const OUT = process.env.SHOTS || '.'; const FILE = 'file://' + path.resolve(__dirname, '../FootballWars_Arcade_Mayhem.html');
let pass = 0, fail = 0; const T = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  // ---------------- mobile: touch ----------------
  const ctx = await b.newContext({ viewport: { width: 400, height: 820 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await ctx.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : (errs.push('NET ' + r.request().url()), r.abort()));
  await p.goto(FILE); await p.waitForTimeout(300);
  await p.click('.clubrow'); await p.click('#startBtn'); await p.waitForTimeout(200);
  await p.click('.battle-btn'); await p.waitForTimeout(400);
  T('M1 new HUD: energy + 3 commands, no STRIKE/timing bar', await p.isVisible('#cmd_kick') && await p.isVisible('#cmd_rush') && await p.isVisible('#cmd_iron') && !(await p.$('#strikeBtn')) && !(await p.$('#timing')));
  T('M2 new battles use the Mayhem mechanics version', await p.evaluate(() => ArcadeApp.st.battle.snap.mech === 'mayhem' && !!ArcadeApp.st.battle.w.may));
  // wait until enough energy for Team Rush (45)
  for (let i = 0; i < 60; i++) { await wait(250); if (await p.evaluate(() => ArcadeApp.st.battle.w.may.s[0].energy >= 46 && ArcadeApp.st.battle.w.phase === 'battle')) break; }
  const e0 = await p.evaluate(() => ArcadeApp.st.battle.w.may.s[0].energy);
  // touch: press the Team Rush button, then drag on the pitch toward the ball and release
  const box = await p.$eval('#stage', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await p.tap('#cmd_rush'); await p.waitForTimeout(150);
  await p.evaluate(() => { ArcadeApp.st.battle.paused = true; }); // freeze the sim while the test reads the ball's screen position (UI-only flag)
  T('M3 targeting overlay opens + slow-motion targeting state', await p.evaluate(() => !!ArcadeApp.st.battle.tgt && document.getElementById('ovl').classList.contains('on')));
  const ball = await p.evaluate(() => { const B = ArcadeApp.st.battle, b = B.w.fb.ball, v = B.renderer.view(), r = B.cv.getBoundingClientRect(); return { x: r.left + (b.x - v.sx) / v.sw * r.width, y: r.top + (b.y - v.sy) / v.sh * r.height }; });
  const cdp = await ctx.newCDPSession(p);
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', box.x + box.w * 0.3, box.y + box.h * 0.5); await wait(80);
  await touch('touchMove', (box.x + box.w * 0.3 + ball.x) / 2, (box.y + box.h * 0.5 + ball.y) / 2); await wait(80);
  await touch('touchMove', ball.x, ball.y); await wait(80);
  await p.screenshot({ path: OUT + '/50_rush_targeting.png' });
  const aim = await p.evaluate(() => ArcadeApp.st.battle.tgt && ArcadeApp.st.battle.tgt.aim);
  const bw = await p.evaluate(() => ({ x: ArcadeApp.st.battle.w.fb.ball.x, y: ArcadeApp.st.battle.w.fb.ball.y }));
  T('M4 screen -> world conversion follows the camera view (aim lands on the ball)', aim && Math.hypot(aim.x - bw.x, aim.y - bw.y) < 14, { aim, bw });
  await p.evaluate(() => { ArcadeApp.st.battle.paused = false; ArcadeApp.st.battle.last = performance.now(); });
  await touch('touchEnd'); await p.waitForTimeout(300);
  const st1 = await p.evaluate(() => { const w = ArcadeApp.st.battle.w; return { used: w.may.used.filter(c => c.side === 0), e: w.may.s[0].energy, rushing: w.units.filter(u => u.side === 0 && u.rushT > 0).length, log: w.may.log.length }; });
  T('M5 Team Rush applied by the engine: energy −45, 8–10 players running', st1.used.length === 1 && st1.used[0].ok && st1.used[0].n >= 8 && st1.e <= e0 - 45 + 4 && st1.log === 1, st1);
  await p.screenshot({ path: OUT + '/51_rush_running.png' });
  // invalid: Power Kick without possession or energy -> nothing spent
  const ePre = await p.evaluate(() => ArcadeApp.st.battle.w.may.s[0].energy);
  await p.tap('#cmd_kick'); await p.waitForTimeout(100);
  const ePost = await p.evaluate(() => ({ e: ArcadeApp.st.battle.w.may.s[0].energy, tgt: !!ArcadeApp.st.battle.tgt, q: ArcadeApp.st.battle.w.may.queue.length }));
  T('M6 command that cannot apply (energy / no ball) is cancelled, no energy spent', !ePost.tgt && ePost.q === 0 && ePost.e >= ePre, { ePre, ePost });
  // save + reload mid battle -> resume replays the recorded command
  await p.evaluate(() => { const B = ArcadeApp.st.battle, P = ArcadeApp.st.save.pendingBattle; P.cmds = B.w.may.log.slice(); P.lastTick = B.w.tick; ArcadeApp.persist(); });
  const saved = await p.evaluate(() => ({ tick: ArcadeApp.st.save.pendingBattle.lastTick, cmds: ArcadeApp.st.save.pendingBattle.cmds }));
  await p.reload(); await p.waitForTimeout(500);
  await p.click('#modal [data-m="resume"]'); await p.waitForTimeout(1500);
  const rs = await p.evaluate(() => { const w = ArcadeApp.st.battle.w; return { tick: w.tick, used: w.may.used.filter(c => c.side === 0 && c.ok).map(c => c.type + '@' + c.tick) }; });
  T('M7 resume replays the recorded War Command at the same tick', rs.tick >= saved.tick && rs.used.length === 1 && rs.used[0] === 'rush@' + saved.cmds[0].tick, { saved, rs });
  // let it finish at 2x
  await p.click('#btSpeed');
  for (let i = 0; i < 200; i++) { await wait(400); if (await p.evaluate(() => !ArcadeApp.st.battle)) break; if (await p.evaluate(() => ArcadeApp.st.battle.ended)) await p.click('#btSkip').catch(() => {}); }
  await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/52_results.png', fullPage: true });
  T('M8 results show War Commands block from real events', await p.evaluate(() => /War Commands/.test(document.getElementById('modal').textContent) && /Power Kick shots/.test(document.getElementById('modal').textContent)));
  T('M9 career stats updated (wc.commands >= 1)', await p.evaluate(() => ArcadeApp.st.save.wc.commands >= 1 && ArcadeApp.st.save.v === 2));
  T('M10 mobile: no page errors / network', errs.length === 0, errs.slice(0, 3));
  await ctx.close();
  // ---------------- desktop: mouse + keyboard ----------------
  const ctx2 = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const q = await ctx2.newPage(); const errs2 = []; q.on('pageerror', e => errs2.push(e.message));
  await q.goto(FILE); await q.waitForTimeout(300);
  await q.click('.clubrow'); await q.click('#startBtn'); await q.waitForTimeout(200);
  await q.click('.battle-btn'); await q.waitForTimeout(300);
  for (let i = 0; i < 60; i++) { await wait(250); if (await q.evaluate(() => ArcadeApp.st.battle.w.may.s[0].energy >= 36 && ArcadeApp.st.battle.w.phase === 'battle')) break; }
  await q.keyboard.press('Digit3'); await q.waitForTimeout(100);
  T('D1 key 3 starts Iron Defense targeting', await q.evaluate(() => ArcadeApp.st.battle.tgt && ArcadeApp.st.battle.tgt.type === 'iron'));
  await q.keyboard.press('Escape'); await q.waitForTimeout(80);
  T('D2 Escape cancels targeting (no pause, no energy spent)', await q.evaluate(() => !ArcadeApp.st.battle.tgt && !ArcadeApp.st.battle.paused && ArcadeApp.st.battle.w.may.queue.length === 0));
  await q.keyboard.press('Digit3'); await q.waitForTimeout(80);
  const own = await q.evaluate(() => { const B = ArcadeApp.st.battle, v = B.renderer.view(), r = B.cv.getBoundingClientRect(); const d = B.w.teams[0].aliveList.find(u => u.role === 'defender'); return { x: r.left + (d.x - v.sx) / v.sw * r.width, y: r.top + (d.y - v.sy) / v.sh * r.height }; });
  await q.mouse.move(own.x, own.y); await q.waitForTimeout(60);
  await q.screenshot({ path: OUT + '/53_iron_targeting_desktop.png' });
  await q.mouse.down(); await q.mouse.up(); await q.waitForTimeout(250);
  const ir = await q.evaluate(() => { const w = ArcadeApp.st.battle.w; return { used: w.may.used.filter(c => c.side === 0).map(c => c.type + ':' + c.ok + ':' + c.n), iron: w.units.filter(u => u.side === 0 && u.ironT > 0).length }; });
  T('D3 mouse click applies Iron Defense to ≤10 real defenders/supports', ir.used[0] && ir.used[0].startsWith('iron:true') && ir.iron > 0 && ir.iron <= 10, ir);
  await q.keyboard.press('Digit2'); await q.waitForTimeout(60);
  await q.mouse.click(own.x, own.y, { button: 'right' }); await q.waitForTimeout(60);
  T('D4 right-click cancels targeting', await q.evaluate(() => !ArcadeApp.st.battle.tgt));
  T('D5 desktop: no page errors', errs2.length === 0, errs2.slice(0, 3));
  await ctx2.close();
  // ---------------- v1 save with a legacy unfinished battle ----------------
  const ctx3 = await b.newContext({ viewport: { width: 400, height: 820 } });
  const r3 = await ctx3.newPage(); const errs3 = []; r3.on('pageerror', e => errs3.push(e.message));
  await r3.goto('file://' + path.resolve(__dirname, '../FootballWars_Arcade.html')); await r3.waitForTimeout(300); // the untouched Reborn build creates a real v1 save
  await r3.click('.clubrow'); await r3.click('#startBtn'); await r3.waitForTimeout(200);
  await r3.evaluate(() => { const s = ArcadeApp.st.save; s.credits = 777; s.stars.ST050 = { id: 'ST050', ovr: 60, contract: 9, rarity: 'rare' }; s.active = ['ST050']; ArcadeApp.persist(); });
  await r3.click('.battle-btn'); await r3.waitForTimeout(4000);
  const v1 = await r3.evaluate(() => { const B = ArcadeApp.st.battle, P = ArcadeApp.st.save.pendingBattle; P.inputs = B.w.arc.log.slice(); P.lastTick = B.w.tick; ArcadeApp.persist(); return localStorage.getItem('fwa_save_v1'); });
  const v1s = JSON.parse(v1);
  await ctx3.close();
  const ctx4 = await b.newContext({ viewport: { width: 400, height: 820 } });
  await ctx4.addInitScript(txt => { try { if (!localStorage.getItem('fwa_save_v1')) localStorage.setItem('fwa_save_v1', txt); } catch (e) {} }, v1);
  const r4 = await ctx4.newPage(); const errs4 = []; r4.on('pageerror', e => errs4.push(e.message));
  await r4.goto(FILE); await r4.waitForTimeout(500);
  const mig = await r4.evaluate(() => { const s = ArcadeApp.st.save; return { v: s.v, from: s.migratedFrom, credits: s.credits, club: s.club, contract: s.stars.ST050.contract, wc: !!s.wc, mech: s.pendingBattle && s.pendingBattle.snap.mech, claims: Object.keys(s.claims).length }; });
  T('S1 v1 save migrates to v2, progress untouched (club, credits, star, contract, claims)', mig.v === 2 && mig.from === 1 && mig.credits === 777 && mig.club === v1s.club && mig.contract === v1s.stars.ST050.contract && mig.wc && mig.claims === Object.keys(v1s.claims).length, mig);
  await r4.click('#modal [data-m="resume"]'); await r4.waitForTimeout(1500);
  const lg = await r4.evaluate(() => ({ legacy: ArcadeApp.st.battle.legacy, may: !!ArcadeApp.st.battle.w.may, tick: ArcadeApp.st.battle.w.tick, contract: ArcadeApp.st.save.stars.ST050.contract, note: !document.getElementById('legacyNote').classList.contains('hidden') }));
  T('S2 legacy unfinished battle resumes with its original rules, contract not used again', lg.legacy && !lg.may && lg.tick >= v1s.pendingBattle.lastTick && lg.contract === v1s.stars.ST050.contract && lg.note, lg);
  T('S3 no page errors (migration)', errs4.length === 0, errs4.slice(0, 3));
  await ctx4.close();
  console.log('mayhem ui tests: ' + pass + ' pass, ' + fail + ' fail');
  await b.close();
})();
