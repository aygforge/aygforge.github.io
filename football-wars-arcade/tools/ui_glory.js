// ROAD TO GLORY browser tests (Playwright Chromium, mobile touch emulation 360-412 px). Real taps on the built single HTML file.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = process.env.SHOTS || '.'; const FILE = 'file://' + path.resolve(__dirname, '../FootballWars_Full_Test.html');
const MAYHEM = 'file://' + path.resolve(__dirname, '../FootballWars_Arcade_Mayhem.html');
let pass = 0, fail = 0; const T = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 760 }, hasTouch: true, isMobile: true, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await ctx.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : (errs.push('NET ' + r.request().url()), r.abort()));
  const S = () => p.evaluate(() => JSON.parse(JSON.stringify(ArcadeApp.st.save)));
  const overflow = () => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  const finish = async () => { for (let i = 0; i < 220; i++) { await wait(400); if (await p.evaluate(() => !ArcadeApp.st.battle)) return; if (await p.evaluate(() => ArcadeApp.st.battle.ended)) await p.tap('#btSkip').catch(() => {}); } };
  await p.goto(FILE); await p.waitForTimeout(400);
  T('U1 new career opens on "Create your club" (no real-club picker)', await p.isVisible('#ccName') && !(await p.$('.clubrow')));
  T('U2 create screen fits 360 px (no horizontal overflow)', !(await overflow()));
  await p.fill('#ccName', 'Ankara Thunder'); await p.tap('[data-cc="shape:round"]'); await p.tap('[data-cc="sym:4"]'); await p.tap('[data-cc="primary:#6a4c93"]'); await p.tap('[data-cc="secondary:#fcbf49"]'); await p.tap('[data-cc="form:fortress"]');
  await p.tap('#ccGo'); await p.waitForTimeout(300);
  let s = await S(); T('U3 club founded with the chosen identity + formation', s.profile.name === 'Ankara Thunder' && s.profile.short === 'AT' && s.profile.shape === 'round' && s.profile.symbol === 4 && s.formation === 'fortress');
  T('U4 your club name in the top bar and on the league table', (await p.textContent('#topbar')).includes('Ankara Thunder') && await (async () => { await p.tap('#tabbar [data-tab="league"]'); return (await p.textContent('table.lg')).includes('Ankara Thunder'); })());
  await p.tap('#tabbar [data-tab="club"]');
  // give one permanent star (test shortcut) to exercise Star Focus
  await p.evaluate(() => { const s = ArcadeApp.st.save; s.stars.ST001 = { id: 'ST001', ovr: 48, adapted: 48, xp: 0, rarity: 'common', battles: 0, adaptGames: {} }; s.active = ['ST001']; ArcadeApp.persist(); ArcadeApp.render(); });
  await p.tap('.battle-btn'); await p.waitForTimeout(600);
  T('U5 battle HUD has no manual Power / command buttons', !(await p.$('#cmd_kick')) && !(await p.$('#strikeBtn')) && !(await p.$('.cmd')) && (await p.$$('#pwList [data-pl]')).length === 4);
  await p.waitForTimeout(3500);
  await p.tap('#starBar [data-focus]'); await p.waitForTimeout(900);
  const sf = await p.evaluate(() => { const B = ArcadeApp.st.battle, u = B.w.units[B.starFocus.id]; return { on: !!B.starFocus, dx: Math.abs(B.w.cam.x - u.x), dy: Math.abs(B.w.cam.y - u.y), z: B.w.cam.z }; });
  T('U6 Star Focus: tapping the star portrait makes the camera follow it (zoom ≤ 1.22)', sf.on && sf.dx < 30 && sf.dy < 40 && sf.z <= 1.22, sf);
  await p.screenshot({ path: OUT + '/70_starfocus.png' });
  await p.tap('#btSpeed'); await finish(); await p.waitForTimeout(300);
  s = await S(); T('U7 battle at 2× finished and recorded', !s.pendingBattle && (s.officialPlayed === 1 || !!s.pendingDecision));
  await p.screenshot({ path: OUT + '/71_results.png', fullPage: true });
  if (s.pendingDecision) await p.tap('#modal [data-m="accept"]'); else await p.tap('#modal [data-m="next"]');
  await p.waitForTimeout(200);
  // forced first-attempt loss -> REMATCH after changing formation (test shortcut: finish with a forged loss)
  await p.evaluate(() => { const s = ArcadeApp.st.save, A = Arcade; const sn = A.Battle.snapshot(s, 'league', { attempt: 1 }); A.Battle.begin(s, sn); A.Battle.finish(s, sn, { won: false, winner: 1, survivors: 30, goals: [0, 1], alive: [0, 30], football: null }); ArcadeApp.persist(); ArcadeApp.render(); });
  T('U8 lost first attempt -> REMATCH offered on the Club screen', (await p.textContent('.battle-btn')).includes('REMATCH') && !!(await p.$('[data-act="tab:squad"]')));
  await p.tap('[data-act="tab:squad"]'); await p.tap('[data-act="form:attack"]'); await p.tap('#tabbar [data-tab="club"]');
  await p.tap('.battle-btn'); await p.waitForTimeout(500);
  const re = await p.evaluate(() => ({ att: ArcadeApp.st.battle.snap.attempt, form: ArcadeApp.st.battle.snap.formation, st: ArcadeApp.st.battle.w.units.filter(u => u.side === 0 && u.role === 'striker').length }));
  T('U9 REMATCH uses the changed formation (All-Out Attack: 22 strikers)', re.att === 2 && re.form === 'attack' && re.st === 22, re);
  await p.tap('#btSpeed'); await finish(); await p.waitForTimeout(300);
  s = await S(); T('U10 fixture 2 finalised once after the REMATCH', s.officialPlayed === 2 && !s.pendingDecision && Object.values(s.league.results).filter(r => r.player).length === 2);
  await p.tap('#modal [data-m="next"]').catch(() => {});
  // Powers: change Favorite
  await p.tap('#tabbar [data-tab="powers"]'); await p.waitForTimeout(150);
  T('U11 Powers screen lists 24 Powers with lock conditions', (await p.$$('.pc')).length === 24 && (await p.$$('.pc.lock')).length === 18);
  await p.tap('[data-pw="wild_ball"]'); await p.tap('#modal [data-m="f1"]'); await p.waitForTimeout(100);
  s = await S(); T('U12 Favorite Power changed and saved', s.powers.favs[1] === 'wild_ball');
  T('U13 Powers screen fits 360 px', !(await overflow()));
  // Draft: open, reload, same candidates, sign
  await p.evaluate(() => { ArcadeApp.st.save.credits += 500; ArcadeApp.persist(); });
  await p.tap('#tabbar [data-tab="rewards"]'); await p.tap('[data-act="open:standard:credits"]'); await p.waitForTimeout(400); await p.tap('.opening').catch(() => {}); await p.waitForTimeout(500);
  const c1 = await p.$$eval('#draftBox [data-pick]', r => r.map(x => x.dataset.star));
  await p.reload(); await p.waitForTimeout(600); await p.tap('[data-act="draft"]').catch(() => {}); await p.waitForTimeout(200);
  const c2 = await p.$$eval('#draftBox [data-pick]', r => r.map(x => x.dataset.star));
  T('U14 open Draft survives a reload with the same 3 stars', c1.length === 3 && JSON.stringify(c1) === JSON.stringify(c2), { c1, c2 });
  await p.tap('#draftBox [data-pick="0"]'); await p.tap('#draftBox [data-sign]'); await p.waitForTimeout(200);
  s = await S(); T('U15 star signed permanently', Object.keys(s.stars).length === 2 && !s.pendingDraft && Object.values(s.stars).every(c => c.contract === undefined));
  // Academy ticket on a star
  await p.evaluate(() => { ArcadeApp.st.save.academy.a5 = 1; ArcadeApp.persist(); });
  await p.tap('#tabbar [data-tab="squad"]'); await p.tap('#screen .stars [data-star="ST001"]'); await p.tap('#modal [data-m="a5"]'); await p.waitForTimeout(100);
  s = await S(); T('U16 Academy +5 ticket trains a star (+5 Star XP)', s.stars.ST001.xp >= 5 && s.academy.a5 === 0, s.stars.ST001);
  await p.tap('#modal [data-m="close"]').catch(() => {});
  // identity edit
  await p.tap('#tabbar [data-tab="club"]'); await p.tap('[data-act="identity"]'); await p.fill('#idName', 'Ankara Storm'); await p.tap('#modal [data-m="primary:#1d3557"]'); await p.tap('#modal [data-m="save"]'); await p.waitForTimeout(150);
  s = await S(); T('U17 club identity edited for free (name + colour), shown everywhere', s.profile.name === 'Ankara Storm' && s.profile.primary === '#1d3557' && (await p.textContent('#topbar')).includes('Ankara Storm'));
  await p.screenshot({ path: OUT + '/72_club.png', fullPage: true });
  for (const t of ['club', 'squad', 'league', 'rewards']) { await p.tap('#tabbar [data-tab="' + t + '"]'); await p.waitForTimeout(120); if (await overflow()) T('U18 ' + t + ' overflow', false); }
  T('U18 Club / Squad / League / Rewards fit 360 px', true);
  // export / import
  await p.tap('#topbar [data-act="settings"]'); await p.waitForTimeout(100);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.tap('#modal [data-m="export"]')]);
  const fpath = OUT + '/glory_export.json'; await dl.saveAs(fpath); const exp = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  await p.evaluate(() => { ArcadeApp.st.save.credits = 1; ArcadeApp.persist(); });
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.tap('#modal [data-m="import"]')]); await fc.setFiles(fpath); await p.waitForTimeout(400);
  s = await S(); T('U19 Export / Import round-trip', exp.v === 3 && s.credits === exp.credits && s.profile.name === 'Ankara Storm');
  T('U20 no page errors / no network requests', errs.length === 0, errs.slice(0, 4));
  await ctx.close();
  // ---------- real Arcade Mayhem (v2) save with an unfinished battle -> Road to Glory ----------
  const c3 = await b.newContext({ viewport: { width: 393, height: 820 } }); const m3 = await c3.newPage();
  await m3.goto(MAYHEM); await m3.waitForTimeout(300); await m3.click('.clubrow'); await m3.click('#startBtn'); await m3.waitForTimeout(200);
  await m3.evaluate(() => { const s = ArcadeApp.st.save; s.credits = 4321; s.stars.ST050 = { id: 'ST050', ovr: 60, contract: 9, rarity: 'rare' }; s.active = ['ST050']; s.tickets = { t5: 1, t10: 2 }; ArcadeApp.persist(); });
  await m3.click('.battle-btn'); await m3.waitForTimeout(4000);
  const v2 = await m3.evaluate(() => { const B = ArcadeApp.st.battle, P = ArcadeApp.st.save.pendingBattle; P.cmds = B.w.may.log.slice(); P.lastTick = B.w.tick; ArcadeApp.persist(); return localStorage.getItem('fwa_save_v1'); });
  const v2s = JSON.parse(v2); await c3.close();
  const c4 = await b.newContext({ viewport: { width: 393, height: 820 } }); await c4.addInitScript(t => { try { if (!localStorage.getItem('fwa_save_v1')) localStorage.setItem('fwa_save_v1', t); } catch (e) {} }, v2);
  const q = await c4.newPage(); const e4 = []; q.on('pageerror', e => e4.push(e.message));
  await q.goto(FILE); await q.waitForTimeout(500);
  T('M1 old Mayhem save: "Welcome to Road to Glory" upgrade notice (no silent reset)', (await q.textContent('#modal')).includes('Road to Glory'));
  await q.screenshot({ path: OUT + '/73_migration.png' });
  const mg = await q.evaluate(() => { const s = ArcadeApp.st.save; return { v: s.v, credits: s.credits, name: s.profile.name, star: s.stars.ST050, academy: s.academy, club: s.club, div: s.division }; });
  T('M2 credits, division, star (now permanent, 9 matches -> 4 XP) and tickets (-> Academy) kept', mg.v === 3 && mg.credits === 4321 && mg.div === v2s.division && mg.star.xp === 4 && mg.star.contract === undefined && mg.academy.a5 === 1 && mg.academy.a10 === 2, mg);
  await q.click('#modal [data-m="ok"]'); await q.waitForTimeout(200);
  T('M3a migrated careers skip the new-club onboarding tips', !(await q.$('.tip')));
  await q.click('#modal [data-m="resume"]'); await q.waitForTimeout(1500);
  const lg = await q.evaluate(() => ({ legacy: ArcadeApp.st.battle.legacy, mech: ArcadeApp.st.battle.snap.mech, tick: ArcadeApp.st.battle.w.tick, note: !document.getElementById('legacyNote').classList.contains('hidden') }));
  T('M3 the unfinished Mayhem battle resumes with its original rules from the saved tick', lg.legacy && lg.mech === 'mayhem' && lg.tick >= v2s.pendingBattle.lastTick && lg.note, lg);
  await q.click('#btSpeed'); for (let i = 0; i < 220; i++) { await wait(400); if (await q.evaluate(() => !ArcadeApp.st.battle)) break; if (await q.evaluate(() => ArcadeApp.st.battle.ended)) await q.click('#btSkip').catch(() => {}); }
  const after = await q.evaluate(() => ({ pb: !!ArcadeApp.st.save.pendingBattle, played: ArcadeApp.st.save.officialPlayed, pd: !!ArcadeApp.st.save.pendingDecision }));
  T('M4 its result is applied once to the migrated career', !after.pb && (after.played === 1 || after.pd), after);
  T('M5 no page errors during migration', e4.length === 0, e4.slice(0, 3));
  await c4.close();
  console.log('road to glory ui tests: ' + pass + ' pass, ' + fail + ' fail');
  await b.close();
})();
