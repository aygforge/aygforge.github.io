// tests/smoke/smoke.mjs — real-browser runtime smoke test (Playwright + Chromium).
// Usage: node tests/smoke/smoke.mjs [dist|dev-url|path/to/DeliveRogue.html] [--shots dir] [--json out.json]
// Drives the REAL game through its UI: Menu -> RunPrep -> Start -> skill pick -> play C1 (joystick vector
// steered along the game's own navigation field; firing is the existing auto-fire) -> pickup -> delivery ->
// RunSummary -> reward settle -> Next chapter -> C2 run. Also: pointer joystick drag, pause/visibility,
// fail path (courier HP 0), save reload persistence, no duplicate reward on summary re-entry, console errors.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const target = args[0] && !args[0].startsWith('--') ? args[0] : 'dist';
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const shots = opt('--shots'); const jsonOut = opt('--json');
if (shots) fs.mkdirSync(shots, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
function serve(root, file) {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/' + (file || 'index.html');
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, () => res(srv));
  });
}

const results = []; let failed = 0;
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };

let url, srv;
if (/^https?:/.test(target)) url = target;
else if (target.endsWith('.html')) { srv = await serve(path.resolve(path.dirname(target)), path.basename(target)); url = `http://localhost:${srv.address().port}/`; }
else { srv = await serve(path.resolve(target)); url = `http://localhost:${srv.address().port}/`; }
url += (url.includes('?') ? '&' : '?') + 'debug=1';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 870 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

const shot = async name => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png') }); };
const click = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(350); };
const runState = () => page.evaluate(() => { const r = window.__DR.G.run; return r ? { state: r.state, picked: r.picked, ended: r.ended, success: r.success, reason: r.reason, n: r.n, time: r.time } : null; });

// Steering autopilot: only sets the joystick vector from the game's own BFS flow field (same as a player
// holding the stick). Picks skills by clicking the first real option button.
async function autopilot(on) {
  await page.evaluate(on => {
    const D = window.__DR; clearInterval(window.__ap);
    if (!on) { D.Input.joy.dx = D.Input.joy.dy = 0; return; }
    window.__ap = setInterval(() => {
      const r = D.G.run, p = D.G.player; if (!r || !p) return;
      const pk = document.querySelector('#modal [data-a="pickskill"]'); if (pk) pk.click();
      if (r.state !== 'play' || r.paused) return;
      const f = D.Nav.flowDir(r.picked ? D.G.world.dropField : D.G.world.pickField, p.x, p.y) || { x: 0, y: -1 };
      D.Input.joy.dx = f.x; D.Input.joy.dy = f.y;
    }, 16);
  }, on);
}
async function waitEnd(maxMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) { const s = await runState(); if (!s || s.state === 'done' || s.ended) return s; await page.waitForTimeout(250); }
  return runState();
}

try {
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload(); await page.waitForTimeout(900);
  check('boot: debug hook + menu', await page.evaluate(() => !!window.__DR && window.__DR.UI.current === 'menu'));
  await shot('01_main_menu');

  // Map/spawn baseline fingerprint for C1 with a fresh save (runCounter=1 -> same seed in both builds)
  await click('[data-a="nav"][data-to="prep"]');
  check('RunPrep opens', await page.evaluate(() => window.__DR.UI.current === 'prep'));
  await shot('02_run_prep');
  await click('[data-a="start"]');
  const fp = await page.evaluate(() => { const D = window.__DR; return { rows: D.G.world.rows, pathLen: D.G.world.pathLen, enemies: D.G.enemies.length,
    spawn: D.G.enemies.map(e => e.id.slice(6, 9) + '@' + Math.round(e.x) + ',' + Math.round(e.y)).join(' '), start: D.G.player && [Math.round(D.G.player.x), Math.round(D.G.player.y)], pickup: [D.G.world.pickup.x, D.G.world.pickup.y] }; });
  check('C1 world built', fp.rows === 79 && fp.enemies === 6, JSON.stringify({ rows: fp.rows, enemies: fp.enemies, pathLen: fp.pathLen }));
  await shot('03_chapter_intro');
  await click('[data-a="begin"]');
  check('start skill pick modal', await page.evaluate(() => document.querySelectorAll('#modal [data-a="pickskill"]').length >= 1));
  await shot('04_skill_pick');
  await click('#modal [data-a="pickskill"]');
  let s = await runState(); check('run enters play after pick', s && s.state === 'play');

  // Real pointer joystick drag (touch path) moves the courier
  const p0 = await page.evaluate(() => ({ x: window.__DR.G.player.x, y: window.__DR.G.player.y }));
  const box = await page.locator('#cv').boundingBox();
  const c = await page.evaluate(() => { const D = window.__DR, c = D.Input.center(); return { x: c.x, y: c.y, vw: 360, vh: D.View.h }; });
  const cx = box.x + c.x / c.vw * box.width, cy = box.y + c.y / c.vh * box.height;
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx, cy - 45, { steps: 4 });
  await page.waitForTimeout(500); await page.mouse.up();
  const p1 = await page.evaluate(() => ({ x: window.__DR.G.player.x, y: window.__DR.G.player.y }));
  check('pointer joystick moves courier', Math.hypot(p1.x - p0.x, p1.y - p0.y) > 8, `moved ${Math.hypot(p1.x - p0.x, p1.y - p0.y).toFixed(1)}px`);

  // Pause freezes simulation time
  await click('#pauseBtn');
  const tA = (await runState()).time; await page.waitForTimeout(600); const tB = (await runState()).time;
  check('pause freezes run timer', tA === tB && await page.evaluate(() => window.__DR.G.run.paused), `t ${tA.toFixed(2)} -> ${tB.toFixed(2)}`);
  await shot('05_pause');
  await click('#modal [data-a="resume"]');

  // Play C1 to delivery
  await autopilot(true);
  let picked = false; const t0 = Date.now();
  while (Date.now() - t0 < 15000) { s = await runState(); if (s.picked) { picked = true; break; } await page.waitForTimeout(100); }
  check('package pickup', picked);
  await page.waitForTimeout(1500); await shot('06_fight_c1');
  // capture a real combat moment: an awake enemy close to the courier
  await page.waitForFunction(() => { const D = window.__DR, p = D.G.player; return D.G.enemies.some(e => !e.dead && e.state !== 'dormant' && Math.hypot(e.x - p.x, e.y - p.y) < 110) || D.G.run.ended; }, null, { timeout: 30000, polling: 50 }).catch(() => {});
  await page.waitForTimeout(250); await shot('07_fight_c1_combat');
  s = await waitEnd(90000);
  await autopilot(false);
  check('C1 delivery success', s && s.success, JSON.stringify(s));
  const kills1 = await page.evaluate(() => window.__DR.G.run && window.__DR.G.run.stats && window.__DR.G.run.stats.kills);
  await page.waitForFunction(() => window.__DR.UI.current === 'summary', null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
  check('RunSummary shown', await page.evaluate(() => window.__DR.UI.current === 'summary'));
  await shot('08_run_summary');
  const save1 = await page.evaluate(() => { const d = window.__DR.Save.data; return { coins: d.coins, xp: d.xp, level: d.level, unlocked: d.unlocked, deliveries: d.stats.deliveries, stars: d.stars[0], settled: d.settled.length }; });
  check('reward settled once (coins>0, C2 unlocked, 1 delivery)', save1.coins > 0 && save1.unlocked === 2 && save1.deliveries === 1 && save1.settled === 1, JSON.stringify(save1));
  // Re-enter summary / re-emit end must not pay twice
  await page.evaluate(() => { const D = window.__DR; D.Progression.settle && D.Progression.settle(D.G.run); });
  const save1b = await page.evaluate(() => { const d = window.__DR.Save.data; return { coins: d.coins, deliveries: d.stats.deliveries }; });
  check('no duplicate reward on re-settle', save1b.coins === save1.coins && save1b.deliveries === 1, JSON.stringify(save1b));

  // Save persistence across reload
  await page.reload(); await page.waitForTimeout(800);
  const save2 = await page.evaluate(() => { const d = window.__DR.Save.data; return { coins: d.coins, unlocked: d.unlocked, deliveries: d.stats.deliveries }; });
  check('save persists after reload', save2.coins === save1.coins && save2.unlocked === 2 && save2.deliveries === 1, JSON.stringify(save2));
  await shot('09_menu_after_c1');

  // Garage + MetaHub (existing screens) render
  await click('[data-a="nav"][data-to="garage"]'); check('Garage screen', await page.evaluate(() => window.__DR.UI.current === 'garage')); await shot('10_garage');
  await page.evaluate(() => { const b = document.querySelector('[data-a="nav"][data-to="menu"],[data-a="back"]'); b && b.click(); }); await page.waitForTimeout(400);
  await click('[data-a="nav"][data-to="meta"]'); check('MetaHub screen', await page.evaluate(() => window.__DR.UI.current === 'meta')); await shot('11_metahub');
  await page.evaluate(() => { const b = document.querySelector('[data-a="nav"][data-to="menu"],[data-a="back"]'); b && b.click(); }); await page.waitForTimeout(400);

  // C2 run start via RunPrep (next chapter) + fail path: courier HP -> 0
  await click('[data-a="nav"][data-to="prep"]');
  await page.evaluate(() => { const b = document.querySelector('[data-a="selch"][data-i="1"]'); b && b.click(); }); await page.waitForTimeout(300);
  await click('[data-a="start"]'); await click('[data-a="begin"]'); await click('#modal [data-a="pickskill"]');
  s = await runState(); check('C2 starts', s && s.n === 2 && s.state === 'play', JSON.stringify(s));
  // damage only applies after pickup (source rule) -> steer to the package first
  await autopilot(true); await page.waitForFunction(() => window.__DR.G.run.picked, null, { timeout: 15000 }).catch(() => {}); await autopilot(false);
  await page.evaluate(() => { const D = window.__DR; D.G.player.inv = 0; D.G.player.shield = false; D.Game.hurtPlayer(9999, {}); });
  s = await waitEnd(8000); await page.waitForFunction(() => window.__DR.UI.current === 'summary', null, { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(800);
  check('fail path: courier HP 0 ends run as failure', s && s.success === false && s.reason, JSON.stringify(s));
  await shot('12_run_failed');
  const save3 = await page.evaluate(() => { const d = window.__DR.Save.data; return { failures: d.stats.failures, deliveries: d.stats.deliveries, unlocked: d.unlocked }; });
  check('failure recorded, no unlock', save3.failures === 1 && save3.deliveries === 1 && save3.unlocked === 2, JSON.stringify(save3));

  // visibilitychange during play pauses
  await click('[data-a="replay"]').catch(() => {});
  await page.evaluate(() => { const m = document.querySelector('[data-a="begin"]'); m && m.click(); }); await page.waitForTimeout(300);
  await page.evaluate(() => { const m = document.querySelector('#modal [data-a="pickskill"]'); m && m.click(); }); await page.waitForTimeout(300);
  s = await runState();
  if (s && s.state === 'play') {
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(200);
    check('visibility hidden auto-pauses run', await page.evaluate(() => window.__DR.G.run.paused === true));
  } else check('visibility hidden auto-pauses run', false, 'could not restart run: ' + JSON.stringify(s));

  check('no console/page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ target, fingerprintC1: fp, kills1, results, errors }, null, 2));
  console.log('C1 fingerprint:', JSON.stringify(fp));
} catch (e) {
  check('smoke aborted', false, e.stack); await shot('zz_abort');
} finally {
  await browser.close(); if (srv) srv.close();
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
