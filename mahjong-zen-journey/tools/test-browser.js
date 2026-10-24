#!/usr/bin/env node
/*
 * End-to-end tests of the built index.html in headless Chromium (Playwright).
 * Emulates phones (touch, DPR 2.6), desktop, landscape rotation, fullscreen,
 * itch.io-style iframes, reloads, export/import and the debug tools.
 * Screenshots go to tools/out/screens/. Usage: node tools/test-browser.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium, devices } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const SHOTS = path.join(OUT, 'screens');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
async function test(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push({ name, ok: true, ms: Date.now() - t0 }); console.log('PASS', name); }
  catch (e) { results.push({ name, ok: false, error: String(e && e.message || e) }); console.log('FAIL', name, '\n     ', e && e.message); }
}
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }

// tiny static server so the game runs over http like on itch.io
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      if (u.pathname === '/host.html' || u.pathname === '/host-nofs.html') {
        const allow = u.pathname === '/host.html' ? 'allowfullscreen allow="fullscreen"' : '';
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(`<!doctype html><html><body style="margin:0;background:#222"><iframe id="f" src="http://localhost:${srv.address().port}/index.html" style="border:0;width:400px;height:720px" ${allow}></iframe></body></html>`);
        return;
      }
      const file = path.join(ROOT, u.pathname === '/' ? 'index.html' : u.pathname.slice(1));
      if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function newPage(browser, opts) {
  const ctx = await browser.newContext(Object.assign({ acceptDownloads: true }, opts || devices['Pixel 7']));
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push('console: ' + m.text()); });
  return { ctx, page };
}
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });
async function boot(page, url) {
  await page.goto(url);
  await page.waitForSelector('#scr-menu.active', { timeout: 8000 });
}
async function tileXY(page, i, frame) {
  return (frame || page).evaluate((i) => {
    const r = MJApp.renderer, c = r.tileCenter(i), b = document.getElementById('board').getBoundingClientRect();
    return { x: b.left + c.x, y: b.top + c.y };
  }, i);
}
async function tapTile(page, i, touch) {
  const p = await tileXY(page, i);
  if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
}
const sess = (page) => page.evaluate(() => { const s = MJApp.session; return s && { n: s.n, remaining: s.remaining, selected: s.selected, won: s.won, level: s.levelNo, moves: s.moves, hints: s.hints, shuffles: s.shuffles, history: s.history.length }; });
async function gotoLevelViaDebug(page, n) {
  await page.evaluate((n) => {
    const d = MJApp.save.data; d.progress.unlocked = Math.max(d.progress.unlocked, n);
    for (let w = 0; w < 20; w++) if (!d.seen.worlds.includes(w)) d.seen.worlds.push(w);
    MJApp.startLevel(n, { resume: false, skipIntro: true });
  }, n);
  await page.waitForSelector('#scr-game.active');
  await page.waitForTimeout(400);
}
async function solveByTaps(page, touch, from) {
  const n = await page.evaluate(() => MJApp.session.n);
  for (let i = from || 0; i + 1 < n; i += 2) {
    await tapTile(page, i, touch);
    await tapTile(page, i + 1, touch);
  }
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch();

  // ---------------------------------------------------------------- phone flow
  const { ctx, page } = await newPage(browser);
  await test('boot: splash then main menu, no errors, no external requests', async () => {
    const external = [];
    page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()); });
    await page.goto(base + '/index.html');
    await page.waitForSelector('#scr-splash.active');
    await shot(page, '01-splash');
    await page.waitForSelector('#scr-menu.active', { timeout: 8000 });
    await page.waitForTimeout(500);
    await shot(page, '02-menu');
    assert(!external.length, 'external requests: ' + external.join(', '));
    assert(!page.errors.length, page.errors.join('\n'));
  });

  await test('Play → world intro → level 1 with tutorial coach mark', async () => {
    await page.tap('[data-act=continue]');
    await page.waitForSelector('#world-intro:not([hidden])');
    await page.waitForTimeout(1500);
    await shot(page, '03-world-intro');
    await page.tap('#world-intro');
    await page.waitForSelector('#scr-game.active');
    await page.waitForTimeout(600);
    const s = await sess(page);
    assert(s.level === 1 && s.remaining === s.n, 'level 1 started');
    assert(await page.isVisible('#coach .coach-card'), 'coach mark visible');
    const audio = await page.evaluate(() => ({ state: MJApp.audio.ctx && MJApp.audio.ctx.state, music: !!MJApp.audio.musicTimer }));
    assert(audio.state === 'running' && audio.music, 'WebAudio started from the first user gesture: ' + JSON.stringify(audio));
    await shot(page, '04-level1-tutorial');
  });

  await test('touch: select, deselect, blocked tile, mismatch keep state consistent', async () => {
    const info = await page.evaluate(() => {
      const s = MJApp.session;
      const free = s.st.freeList();
      const blocked = s.tiles.findIndex((_, i) => !s.isFree(i));
      let mm = null;
      for (const a of free) for (const b of free) if (a !== b && !s.matches(a, b) && !mm) mm = [a, b];
      return { free, blocked, mm };
    });
    await tapTile(page, info.free[0], true);
    assert((await sess(page)).selected === info.free[0], 'selected');
    await tapTile(page, info.free[0], true);
    assert((await sess(page)).selected === -1, 'deselected');
    if (info.blocked >= 0) { await tapTile(page, info.blocked, true); assert((await sess(page)).selected === -1, 'blocked tile not selectable'); }
    await tapTile(page, info.mm[0], true); await tapTile(page, info.mm[1], true);
    const s = await sess(page);
    assert(s.selected === info.mm[1] && s.remaining === s.n, 'mismatch moved selection, removed nothing');
    await tapTile(page, info.mm[1], true);
  });

  await test('level 1 solved with real touch taps → win screen with stars → Next Level', async () => {
    await solveByTaps(page, true);
    await page.waitForSelector('.modal h2', { timeout: 4000 });
    assert((await page.textContent('.modal h2')).includes('Level Complete'));
    await page.waitForTimeout(1400);
    await shot(page, '05-level-complete');
    const stars = await page.$$eval('.win-stars span.on', (e) => e.length);
    assert(stars === 3, 'three stars without help, got ' + stars);
    const unlocked = await page.evaluate(() => MJApp.save.data.progress.unlocked);
    assert(unlocked === 2, 'level 2 unlocked');
    await page.tap('[data-m=next]');
    await page.waitForTimeout(600);
    assert((await sess(page)).level === 2, 'level 2 running');
  });

  await test('layered hit-testing: a raised tile wins over the tile beneath it', async () => {
    await gotoLevelViaDebug(page, 140);
    const r = await page.evaluate(() => {
      const s = MJApp.session, g = s.geom;
      const top = s.tiles.findIndex((t, i) => s.isFree(i) && g.below[i].length > 0);
      return { top, below: g.below[top] };
    });
    await tapTile(page, r.top, true);
    assert((await sess(page)).selected === r.top, 'top tile selected');
    // tap the exact centre of a covered tile: must hit the tile on top, never the hidden one
    const hit = await page.evaluate((b) => { const r = MJApp.renderer; const c = r.tileCenter(b); return r.hitTest(c.x, c.y); }, r.below[0]);
    assert(hit !== r.below[0], 'covered tile is not hit through the upper tile');
    await tapTile(page, r.top, true);
  });

  await test('hint, shuffle, undo (multiple), restart and pause buttons', async () => {
    await page.tap('#btn-hint');
    let s = await sess(page);
    assert(s.hints === 1, 'hint counted');
    const hint = await page.evaluate(() => MJApp.renderer.hint && [MJApp.renderer.hint.a, MJApp.renderer.hint.b]);
    assert(hint, 'hint highlighted');
    await page.waitForTimeout(300);
    await shot(page, '06-hint');
    await tapTile(page, hint[0], true); await tapTile(page, hint[1], true);
    s = await sess(page);
    assert(s.remaining === s.n - 2, 'hinted pair removed by the player');
    const h2 = await page.evaluate(() => MJApp.session.findHint().pair);
    await tapTile(page, h2[0], true); await tapTile(page, h2[1], true);
    await page.tap('#btn-shuffle');
    s = await sess(page);
    assert(s.shuffles === 1 && s.history === 3, 'shuffle recorded in history');
    await page.waitForTimeout(500);
    await page.tap('#btn-undo'); await page.tap('#btn-undo'); await page.tap('#btn-undo');
    s = await sess(page);
    assert(s.remaining === s.n && s.history === 0, 'three undos restored the full board');
    assert(await page.isDisabled('#btn-undo'), 'undo disabled when nothing to undo');
    const h3 = await page.evaluate(() => MJApp.session.findHint().pair);
    await tapTile(page, h3[0], true); await tapTile(page, h3[1], true);
    await page.tap('[data-act=restart]');
    await page.waitForSelector('.modal [data-m=yes]');
    await page.tap('.modal [data-m=yes]');
    s = await sess(page);
    assert(s.remaining === s.n && s.moves === 0 && s.hints === 0, 'restart resets board and counters');
    await page.tap('[data-act=pause]');
    await page.waitForSelector('.modal [data-m=resume]');
    const el0 = await page.evaluate(() => MJApp.session.elapsed);
    await page.waitForTimeout(1200);
    const el1 = await page.evaluate(() => MJApp.session.elapsed);
    assert(el1 - el0 < 600, 'timer stops while paused');
    await shot(page, '07-pause');
    await page.tap('.modal [data-m=resume]');
    await page.waitForTimeout(300);
    assert(!(await page.$('.modal')), 'resumed');
  });

  await test('rapid taps and undo during match animation stay consistent', async () => {
    await gotoLevelViaDebug(page, 260);
    const pts = [];
    for (let i = 0; i < 8; i++) pts.push(await tileXY(page, i));
    for (let k = 0; k < 4; k++) {
      await page.touchscreen.tap(pts[2 * k].x, pts[2 * k].y);
      await page.touchscreen.tap(pts[2 * k + 1].x, pts[2 * k + 1].y);
      await page.touchscreen.tap(pts[2 * k + 1].x, pts[2 * k + 1].y); // stray tap on a vanishing tile
    }
    await page.tap('#btn-undo'); await page.tap('#btn-undo');
    await page.tap('#btn-shuffle');
    await page.tap('#btn-undo');
    const ok = await page.evaluate(() => {
      const s = MJApp.session;
      const replay = MJCore.GameSession.restore(s.levelNo, s.level, JSON.parse(JSON.stringify(s.serialize())));
      return { valid: !!replay || s.history.length === 0, remaining: s.remaining, n: s.n };
    });
    assert(ok.valid, 'state still replays cleanly');
    assert(ok.remaining === ok.n - 4, 'expected two pairs left removed, got ' + (ok.n - ok.remaining));
    assert(!page.errors.length, page.errors.join('\n'));
  });

  await test('save and reload restores the game in progress', async () => {
    await gotoLevelViaDebug(page, 31);
    for (let i = 0; i < 6; i += 2) { await tapTile(page, i, true); await tapTile(page, i + 1, true); }
    const before = await page.evaluate(() => ({ s: MJApp.session.serialize(), unlocked: MJApp.save.data.progress.unlocked }));
    await page.waitForTimeout(700); // debounced save
    await page.reload();
    await page.waitForSelector('#scr-menu.active', { timeout: 8000 });
    assert((await page.textContent('#menu-play-label')) === 'Continue', 'menu offers Continue');
    await page.tap('[data-act=continue]');
    await page.waitForSelector('#scr-game.active');
    const after = await page.evaluate(() => ({ s: MJApp.session.serialize(), unlocked: MJApp.save.data.progress.unlocked }));
    assert(after.s.lv === 31 && after.s.f === before.s.f && JSON.stringify(after.s.h) === JSON.stringify(before.s.h), 'same board and history');
    assert(after.unlocked === before.unlocked, 'progress kept');
    await page.tap('#btn-undo');
    assert((await sess(page)).history === 2, 'undo history survived reload');
  });

  let exported = null;
  await test('export save downloads a real JSON file', async () => {
    await page.tap('[data-act=pause]');
    await page.tap('.modal [data-m=settings]');
    await page.waitForSelector('.modal [data-m=export]');
    await shot(page, '08-settings');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.tap('.modal [data-m=export]')]);
    const file = path.join(OUT, 'exported-save.json');
    await dl.saveAs(file);
    exported = file;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert(data.game === 'mahjong-zen-journey' && data.version === 1 && data.progress.stars.length === 500, 'valid save JSON');
    assert(/mahjong-zen-journey-save-\d{8}\.json/.test(dl.suggestedFilename()), 'file name ' + dl.suggestedFilename());
    await page.tap('.modal [data-m=ok]');
  });

  await test('reset requires confirmation, import restores the exported save', async () => {
    const starsBefore = await page.evaluate(() => MJProgress.totalStars(MJApp.save.data));
    await page.tap('.modal [data-m=reset]');
    await page.waitForSelector('.modal [data-m=yes]');
    assert((await page.textContent('.modal h2')).includes('Reset'), 'confirmation shown');
    await page.tap('.modal [data-m=yes]');
    await page.waitForSelector('#scr-menu.active');
    assert(await page.evaluate(() => MJApp.save.data.progress.unlocked === 1 && MJProgress.totalStars(MJApp.save.data) === 0), 'progress reset');
    await page.tap('[data-act=settings]');
    await page.tap('.modal [data-m=import]');
    await page.setInputFiles('.modal [data-file]', exported);
    await page.waitForSelector('.modal [data-m=yes]');
    await page.tap('.modal [data-m=yes]');
    await page.waitForTimeout(300);
    const starsAfter = await page.evaluate(() => MJProgress.totalStars(MJApp.save.data));
    assert(starsAfter === starsBefore && starsAfter > 0, `stars restored ${starsAfter} vs ${starsBefore}`);
    // invalid file is rejected with a message
    const bad = path.join(OUT, 'bad-save.json');
    fs.writeFileSync(bad, JSON.stringify({ game: 'other-game', version: 1 }));
    await page.tap('[data-act=settings]');
    await page.tap('.modal [data-m=import]');
    await page.setInputFiles('.modal [data-file]', bad);
    await page.waitForSelector('.modal h2:has-text("Import failed")');
    await page.tap('.modal [data-m=ok]');
    await page.tap('.modal [data-m=cancel]');
    await page.tap('.modal [data-m=close]');
  });

  await test('world map and level select render 20 worlds / 25 levels', async () => {
    await page.tap('[data-act=map]');
    await page.waitForSelector('#scr-map.active');
    assert((await page.$$('.world-card')).length === 20);
    await page.waitForTimeout(400);
    await shot(page, '09-world-map');
    await page.tap('.world-card[data-world="0"]');
    await page.waitForSelector('#scr-levels.active');
    assert((await page.$$('.level-btn')).length === 25);
    await page.waitForTimeout(300);
    await shot(page, '10-level-select');
    await page.tap('.world-card[data-world="5"]').catch(() => {});
  });

  await test('world final → World Complete → next world intro → level 26', async () => {
    await gotoLevelViaDebug(page, 25);
    await page.evaluate(() => { MJApp.save.data.seen.worlds = [0]; MJApp.playSolution(false, 1); });
    await page.waitForSelector('.modal h2:has-text("World Complete")', { timeout: 8000 });
    await page.waitForTimeout(900);
    await shot(page, '11-world-complete');
    await page.tap('[data-m=next]');
    await page.waitForSelector('#world-intro:not([hidden])');
    assert((await page.textContent('#world-intro h2')).includes('Cherry Blossom'));
    await page.waitForSelector('#scr-game.active', { timeout: 6000 });
    await page.waitForTimeout(3500);
    assert((await sess(page)).level === 26, 'level 26 started after intro');
    await shot(page, '12-level26');
  });

  await test('level 500 shows the journey-complete screen and never opens level 501', async () => {
    await gotoLevelViaDebug(page, 500);
    await shot(page, '13-level500');
    await page.evaluate(() => MJApp.playSolution(false, 1));
    await page.waitForSelector('.modal h2:has-text("Journey Complete")', { timeout: 10000 });
    await page.waitForTimeout(1200);
    await shot(page, '14-journey-complete');
    assert(!(await page.$('.modal [data-m=next]')), 'no Next Level button');
    const st = await page.evaluate(() => ({ lv: MJApp.levelNo, unlocked: MJApp.save.data.progress.unlocked, cont: MJProgress.continueLevel(MJApp.save.data) }));
    assert(st.lv === 500 && st.unlocked === 500 && st.cont <= 500, JSON.stringify(st));
    await page.tap('.modal [data-m=map]');
    await page.waitForSelector('#scr-map.active');
  });
  await ctx.close();

  // ---------------------------------------------------------------- viewports, rotation
  await test('responsive layouts: board fits and taps stay accurate on many screens', async () => {
    const sizes = [
      { name: 'iphone-se', viewport: { width: 375, height: 667 }, dpr: 2 },
      { name: 'small-android', viewport: { width: 360, height: 640 }, dpr: 3 },
      { name: 'iphone-14', viewport: { width: 390, height: 844 }, dpr: 3 },
      { name: '20x9', viewport: { width: 412, height: 915 }, dpr: 2.6 },
      { name: 'desktop', viewport: { width: 1366, height: 768 }, dpr: 1, desktop: true }
    ];
    for (const sz of sizes) {
      const { ctx: c2, page: p2 } = await newPage(browser, { viewport: sz.viewport, deviceScaleFactor: sz.dpr, isMobile: !sz.desktop, hasTouch: !sz.desktop });
      await boot(p2, base + '/index.html?debug=1');
      await gotoLevelViaDebug(p2, 480);
      const m = await p2.evaluate(() => {
        const r = MJApp.renderer, b = document.getElementById('board').getBoundingClientRect();
        const a = document.getElementById('app').getBoundingClientRect();
        const s = r.boardSize();
        const tb = document.querySelector('.toolbar').getBoundingClientRect();
        return { tw: r.tw, bw: s.w, bh: s.h, vw: b.width, vh: b.height, appW: a.width, appH: a.height, toolbarBottom: tb.bottom, winH: innerHeight, winW: innerWidth };
      });
      assert(m.bw <= m.vw + 1 && m.bh <= m.vh + 1, `${sz.name}: board ${m.bw}x${m.bh} fits ${m.vw}x${m.vh}`);
      assert(m.toolbarBottom <= m.winH + 0.5, `${sz.name}: toolbar visible`);
      assert(m.appH >= m.winH - 1, `${sz.name}: app fills height`);
      if (sz.desktop) assert(Math.abs(m.appW - m.winH * 9 / 16) < 2, 'desktop shows a centred 9:16 column');
      else assert(m.appW >= m.winW - 1, 'phone uses full width');
      const free = await p2.evaluate(() => MJApp.session.st.freeList()[0]);
      await tapTile(p2, free, !sz.desktop);
      assert((await sess(p2)).selected === free, sz.name + ': tap selects the right tile');
      await shot(p2, `15-viewport-${sz.name}`);
      results.push({ name: `  · ${sz.name}: tile width ${m.tw.toFixed(1)}px on the densest late level`, ok: true, info: true });
      assert(!p2.errors.length, p2.errors.join('\n'));
      await c2.close();
    }
  });

  await test('rotating a phone to landscape shows the rotate notice and back to portrait restores the board', async () => {
    const { ctx: c3, page: p3 } = await newPage(browser, devices['Pixel 7']);
    await boot(p3, base + '/index.html?debug=1');
    await gotoLevelViaDebug(p3, 200);
    await p3.setViewportSize({ width: 915, height: 412 });
    await p3.waitForTimeout(400);
    assert(await p3.isVisible('#rotate'), 'rotate overlay visible in landscape');
    const el0 = await p3.evaluate(() => MJApp.session.elapsed);
    await p3.waitForTimeout(1100);
    assert((await p3.evaluate(() => MJApp.session.elapsed)) - el0 < 600, 'timer paused while rotated');
    await shot(p3, '16-landscape-notice');
    await p3.setViewportSize({ width: 412, height: 915 });
    await p3.waitForTimeout(500);
    assert(!(await p3.isVisible('#rotate')), 'overlay gone in portrait');
    const free = await p3.evaluate(() => MJApp.session.st.freeList()[1]);
    await tapTile(p3, free, true);
    assert((await sess(p3)).selected === free, 'touch coordinates correct after rotation');
    await c3.close();
  });

  // ---------------------------------------------------------------- zoom
  await test('pinch-to-zoom, drag-to-pan, wheel zoom and Fit button', async () => {
    const { ctx: c4, page: p4 } = await newPage(browser, devices['Pixel 7']);
    await boot(p4, base + '/index.html?debug=1');
    await gotoLevelViaDebug(p4, 450);
    const cdp = await c4.newCDPSession(p4);
    const b = await p4.evaluate(() => { const r = document.getElementById('board').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const tp = (pts) => pts.map((p, i) => ({ x: p[0], y: p[1], id: i }));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp([[b.x - 30, b.y], [b.x + 30, b.y]]) });
    for (let k = 1; k <= 8; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp([[b.x - 30 - k * 12, b.y], [b.x + 30 + k * 12, b.y]]) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const z = await p4.evaluate(() => MJApp.renderer.zoom);
    assert(z > 1.5, 'pinch zoomed in to ' + z);
    assert(await p4.isVisible('#zoom-reset'), 'Fit button shown');
    await shot(p4, '17-zoomed');
    const o0 = await p4.evaluate(() => MJApp.renderer.ox);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp([[b.x, b.y]]) });
    for (let k = 1; k <= 6; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp([[b.x + k * 15, b.y]]) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const o1 = await p4.evaluate(() => MJApp.renderer.ox);
    assert(o1 !== o0, 'drag panned the board');
    assert((await sess(p4)).selected === -1, 'a pan is not a tap');
    // tap while zoomed hits the right tile
    const free = await p4.evaluate(() => { const r = MJApp.renderer, s = MJApp.session; return s.st.freeList().find((i) => { const c = r.tileCenter(i); return c.x > 30 && c.y > 30 && c.x < r.viewW - 30 && c.y < r.viewH - 30; }); });
    await tapTile(p4, free, true);
    assert((await sess(p4)).selected === free, 'zoomed tap accurate');
    await p4.tap('#zoom-reset');
    assert((await p4.evaluate(() => MJApp.renderer.zoom)) === 1, 'Fit resets zoom');
    await c4.close();
  });

  // ---------------------------------------------------------------- fullscreen
  await test('fullscreen button: enter, exit, re-enter, play while fullscreen', async () => {
    const { ctx: c5, page: p5 } = await newPage(browser, { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await boot(p5, base + '/index.html?debug=1');
    const supported = await p5.evaluate(() => MJApp.fs.supported);
    assert(supported, 'Fullscreen API available in this Chromium');
    await p5.tap('#scr-menu [data-fs]');
    await p5.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 3000 });
    assert((await p5.getAttribute('#scr-menu [data-fs]', 'data-state')) === 'on', 'icon switched to exit');
    await p5.tap('#scr-menu [data-fs]');
    await p5.waitForFunction(() => !document.fullscreenElement, null, { timeout: 3000 });
    assert((await p5.getAttribute('#scr-menu [data-fs]', 'data-state')) === 'off', 'icon back to enter');
    await p5.tap('#scr-menu [data-fs]');
    await p5.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 3000 });
    await gotoLevelViaDebug(p5, 60);
    await p5.tap('[data-act=pause]');
    await p5.waitForSelector('.modal [data-m=resume]');
    await p5.tap('.modal [data-m=resume]');
    await gotoLevelViaDebug(p5, 61);
    assert(await p5.evaluate(() => !!document.fullscreenElement), 'still fullscreen after level change');
    await p5.tap('#scr-game [data-fs]');
    await p5.waitForFunction(() => !document.fullscreenElement, null, { timeout: 3000 });
    await p5.waitForTimeout(400);
    const free = await p5.evaluate(() => MJApp.session.st.freeList()[0]);
    await tapTile(p5, free, true);
    assert((await sess(p5)).selected === free, 'touch coordinates correct after leaving fullscreen');
    assert(!p5.errors.length, p5.errors.join('\n'));
    await c5.close();
  });

  await test('itch.io-style iframe: works embedded; blocked fullscreen falls back gracefully', async () => {
    const { ctx: c6, page: p6 } = await newPage(browser, { viewport: { width: 500, height: 800 } });
    await p6.goto(base + '/host-nofs.html');
    const frame = await (await p6.waitForSelector('#f')).contentFrame();
    await frame.waitForSelector('#scr-menu.active', { timeout: 8000 });
    assert(await frame.evaluate(() => !MJApp.fs.supported && MJApp.fs.inIframe), 'fullscreen not allowed in this iframe');
    await frame.click('#scr-menu [data-fs]');
    await frame.waitForSelector('.modal h2:has-text("Fullscreen unavailable")');
    assert(await frame.isVisible('.modal [data-m=tab]'), 'offers Open in new tab');
    await shot(p6, '18-iframe-fullscreen-blocked');
    await frame.click('.modal [data-m=ok]');
    assert(await frame.evaluate(() => !document.fullscreenElement), 'not pretending to be fullscreen');
    await frame.click('[data-act=continue]');
    await frame.waitForSelector('#world-intro:not([hidden])');
    await frame.click('#world-intro');
    await frame.waitForSelector('#scr-game.active');
    await frame.waitForTimeout(500);
    const n = await frame.evaluate(() => MJApp.session.n);
    for (let i = 0; i < n; i++) { const pt = await tileXY(p6, i, frame); const fb = await (await p6.$('#f')).boundingBox(); await p6.mouse.click(fb.x + pt.x, fb.y + pt.y); }
    await frame.waitForSelector('.modal h2:has-text("Level Complete")', { timeout: 4000 });
    assert(!p6.errors.length, p6.errors.join('\n'));
    await p6.goto(base + '/host.html');
    const f2 = await (await p6.waitForSelector('#f')).contentFrame();
    await f2.waitForSelector('#scr-menu.active', { timeout: 8000 });
    assert(await f2.evaluate(() => MJApp.fs.supported), 'allowfullscreen iframe supports fullscreen');
    await f2.click('#scr-menu [data-fs]');
    await f2.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 3000 });
    await f2.click('#scr-menu [data-fs]');
    await f2.waitForFunction(() => !document.fullscreenElement, null, { timeout: 3000 });
    await c6.close();
  });

  await test('unsupported fullscreen (iPhone-like) shows guidance and does not retry', async () => {
    const { ctx: c7, page: p7 } = await newPage(browser, devices['iPhone 13']);
    await p7.addInitScript(() => {
      // iPhone Safari: no element fullscreen at all (neither standard nor webkit-prefixed)
      for (const k of ['fullscreenEnabled', 'webkitFullscreenEnabled']) Object.defineProperty(Document.prototype, k, { get: () => false, configurable: true });
      Element.prototype.requestFullscreen = undefined;
      Element.prototype.webkitRequestFullscreen = undefined;
    });
    await boot(p7, base + '/index.html');
    await p7.tap('#scr-menu [data-fs]');
    await p7.waitForSelector('.modal h2:has-text("Fullscreen unavailable")');
    const txt = await p7.textContent('.modal p');
    assert(/Add to Home Screen/.test(txt), 'iOS guidance shown');
    await shot(p7, '19-ios-fullscreen-help');
    await c7.close();
  });

  // ---------------------------------------------------------------- debug + validation in browser
  await test('debug mode: hidden by default, ?debug=1 panel validates all 500 levels in the browser', async () => {
    const { ctx: c8, page: p8 } = await newPage(browser, devices['Pixel 7']);
    await boot(p8, base + '/index.html');
    assert(!(await p8.$('.dbg-fab')), 'no debug controls for players');
    await boot(p8, base + '/index.html?debug=1');
    await gotoLevelViaDebug(p8, 333);
    await p8.tap('.dbg-fab');
    await p8.waitForSelector('.dbg [data-info]');
    const info = await p8.textContent('.dbg [data-info]');
    assert(/hash=[0-9a-f]{8}-/.test(info) && /available matches/.test(info), 'level hash and match list shown');
    await p8.tap('.modal [data-m=free]');
    await p8.tap('.dbg-fab');
    await p8.tap('.modal [data-m=coords]');
    await p8.waitForTimeout(300);
    await shot(p8, '20-debug-overlays');
    await p8.tap('.dbg-fab');
    await p8.tap('.modal [data-m=validate]');
    await p8.waitForFunction(() => window.MJLastValidation, null, { timeout: 60000 });
    const S = await p8.evaluate(() => window.MJLastValidation);
    await shot(p8, '21-debug-validation');
    assert(S.passed === 500 && S.uniqueHashes === 500, `in-browser validation ${S.passed}/500, hashes ${S.uniqueHashes}`);
    await p8.tap('.modal [data-m=close]');
    await p8.evaluate(() => MJApp.playSolution(false, 30));
    await p8.waitForSelector('.modal h2:has-text("Level Complete")', { timeout: 20000 });
    await c8.close();
  });

  // ---------------------------------------------------------------- visual tour
  await test('visual tour of several worlds', async () => {
    const { ctx: c9, page: p9 } = await newPage(browser, devices['iPhone 13']);
    await boot(p9, base + '/index.html?debug=1');
    for (const n of [76, 130, 187, 290, 355, 401, 440, 462]) {
      await gotoLevelViaDebug(p9, n);
      await p9.waitForTimeout(1200);
      await shot(p9, `22-world-${String(n).padStart(3, '0')}`);
    }
    assert(!p9.errors.length, p9.errors.join('\n'));
    await c9.close();
  });

  await browser.close();
  srv.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results.filter((x) => x.info)) console.log(r.name);
  console.log(`\n${results.filter((r) => r.ok && !r.info).length} passed, ${failed.length} failed`);
  fs.writeFileSync(path.join(OUT, 'browser-tests.json'), JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 1));
  process.exit(failed.length ? 1 : 0);
})();
