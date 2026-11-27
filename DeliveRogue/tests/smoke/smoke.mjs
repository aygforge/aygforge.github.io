// tests/smoke/smoke.mjs — real-browser runtime smoke test (Playwright + Chromium), Phase 02 scene flow.
// Usage: node tests/smoke/smoke.mjs [dist|dev-url] [--shots dir] [--json out.json]
// Drives the REAL game through its UI: Boot -> MainMenu -> RunPrep -> FightScene (intro, skill pick,
// joystick drag, pause, pickup, delivery; steering = the game's own BFS flow field written to the joystick
// vector, firing = existing auto-fire) -> RunSummary -> reward settle once -> Garage purchase -> MetaHub
// milestone collect -> Settings (reduced motion, save import) -> C2 fail path -> retry -> visibility pause
// -> confirmed quit. Framework checks: 8 scenes, one scene root after transitions, rapid-tap debounce,
// hub bars only on hub scenes, back/ESC routing, no Bus listener leaks, no console errors.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const target = args[0] && !args[0].startsWith('--') ? args[0] : 'dist';
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const shots = opt('--shots'); const jsonOut = opt('--json');
if (shots) fs.mkdirSync(shots, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
function serve(root) {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, () => res(srv));
  });
}
const results = []; let failed = 0;
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };

let url, srv;
if (/^https?:/.test(target)) url = target; else { srv = await serve(path.resolve(target)); url = `http://localhost:${srv.address().port}/`; }
url += (url.includes('?') ? '&' : '?') + 'debug=1';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 870 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

const shot = async name => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png') }); };
const ev = (fn, a) => page.evaluate(fn, a);
const scene = () => ev(() => window.__DR.UI.current);
const settle = () => page.waitForFunction(() => !window.__DR.Scenes.transitioning, null, { timeout: 5000 }).then(() => page.waitForTimeout(120));
const nav = async id => { await page.locator(`[data-nav="${id}"]`).click(); await settle(); };
const tap = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(300); await settle(); };
const esc = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); await settle(); };
const runState = () => ev(() => { const r = window.__DR.G.run; return r ? { state: r.state, picked: r.picked, ended: r.ended, success: r.success, reason: r.reason, n: r.n, time: r.time } : null; });
const coins = () => ev(() => window.__DR.Save.data.coins);
const barsShown = () => ev(() => ({ top: document.getElementById('topbar').classList.contains('show'), nav: document.getElementById('navbar').classList.contains('show') }));
const sceneRoots = () => ev(() => document.querySelectorAll('#scenes > .scene').length);

async function autopilot(on) {
  await ev(on => {
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
const toSummary = () => page.waitForFunction(() => window.__DR.UI.current === 'RunSummary' && !window.__DR.Scenes.transitioning, null, { timeout: 8000 }).catch(() => {});

let fp = null;
try {
  await page.goto(url);
  await ev(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(250);
  const bootSeen = await scene(); await shot('01_boot');
  await page.waitForFunction(() => window.__DR.UI.current === 'MainMenu' && !window.__DR.Scenes.transitioning, null, { timeout: 8000 });
  check('Boot scene -> MainMenu', bootSeen === 'Boot', 'first scene ' + bootSeen);
  check('8 independent scenes registered', (await ev(() => window.__DR.Scenes.ids.join(','))) === 'Boot,MainMenu,Garage,MetaHub,RunPrep,FightScene,RunSummary,Settings');
  const bars0 = await barsShown();
  check('hub bars visible on MainMenu', bars0.nav && bars0.top);
  check('MainMenu animated canvas atmosphere active', await ev(() => window.__DR.Scenes.canvasModes.has('menu')));
  await page.waitForTimeout(500); await shot('02_main_menu');

  await ev(() => { ['Garage', 'MetaHub', 'Settings', 'RunPrep'].forEach(id => document.querySelector(`[data-nav="${id}"]`).click()); });
  await settle();
  check('rapid navbar taps -> single target, single scene root', (await scene()) === 'Garage' && (await sceneRoots()) === 1, `${await scene()} roots=${await sceneRoots()}`);
  await nav('RunPrep'); await nav('MetaHub'); await nav('Settings'); await nav('MainMenu');
  check('scene teardown: one root after many transitions', (await sceneRoots()) === 1);

  await tap('[data-a="play"]');
  check('Play -> RunPrep', (await scene()) === 'RunPrep');
  const prep = await ev(() => ({ canvas: !!document.querySelector('.rp-map canvas'), start: !!document.querySelector('[data-a="start"]'), c2: document.querySelector('[data-a="sel"][data-n="2"]').className }));
  check('RunPrep: real route preview, START, C2 locked', prep.canvas && prep.start && /locked/.test(prep.c2), JSON.stringify(prep));
  await page.waitForTimeout(1500); await shot('03_run_prep');
  await tap('[data-a="start"]'); await page.waitForTimeout(250);
  check('START -> FightScene, hub bars hidden', (await scene()) === 'FightScene' && !(await barsShown()).nav);
  fp = await ev(() => { const D = window.__DR; return { rows: D.G.world.rows, pathLen: D.G.world.pathLen, enemies: D.G.enemies.length, spawn: D.G.enemies.map(e => e.id.slice(6, 9) + '@' + Math.round(e.x) + ',' + Math.round(e.y)).join(' ') }; });
  check('C1 world identical to baseline', fp.rows === 79 && fp.enemies === 6 && fp.spawn === 'Bea@203,278 Bea@88,328 Bea@231,518 Bea@277,590 Bea@180,831 Bea@180,1042', JSON.stringify(fp));
  await shot('04_chapter_intro');
  await tap('#modal [data-a="begin"]');
  check('skill pick overlay', await ev(() => document.querySelectorAll('#modal [data-a="pickskill"]').length >= 1));
  await shot('05_skill_pick');
  await tap('#modal [data-a="pickskill"]');
  let s = await runState(); check('run enters play after pick', s && s.state === 'play');

  const p0 = await ev(() => ({ x: window.__DR.G.player.x, y: window.__DR.G.player.y }));
  const box = await page.locator('#cv').boundingBox();
  const c = await ev(() => { const D = window.__DR, c = D.Input.center(); return { x: c.x, y: c.y, vh: D.View.h }; });
  const cx = box.x + c.x / 360 * box.width, cy = box.y + c.y / c.vh * box.height;
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx, cy - 45, { steps: 4 }); await page.waitForTimeout(500); await page.mouse.up();
  const p1 = await ev(() => ({ x: window.__DR.G.player.x, y: window.__DR.G.player.y }));
  check('pointer joystick moves courier (scene layer does not block canvas)', Math.hypot(p1.x - p0.x, p1.y - p0.y) > 8, `moved ${Math.hypot(p1.x - p0.x, p1.y - p0.y).toFixed(1)}px`);

  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  const tA = (await runState()).time; await page.waitForTimeout(500); const tB = (await runState()).time;
  check('ESC/back in run -> pause, timer frozen, stays in FightScene', (await ev(() => window.__DR.UI.modalKind)) === 'pause' && tA === tB && (await scene()) === 'FightScene');
  await shot('06_pause');
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  check('ESC again resumes', (await ev(() => window.__DR.UI.modalKind)) === null && !(await ev(() => window.__DR.G.run.paused)));

  await autopilot(true);
  await page.waitForFunction(() => window.__DR.G.run.picked, null, { timeout: 15000 }).catch(() => {});
  check('package pickup', (await runState()).picked);
  await page.waitForTimeout(1200); await shot('07_fight_c1');
  await page.waitForFunction(() => { const D = window.__DR, p = D.G.player; return D.G.enemies.some(e => !e.dead && e.state !== 'dormant' && Math.hypot(e.x - p.x, e.y - p.y) < 110) || D.G.run.ended; }, null, { timeout: 30000, polling: 50 }).catch(() => {});
  await page.waitForTimeout(250); await shot('08_fight_c1_combat');
  s = await waitEnd(90000); await autopilot(false);
  check('C1 delivery success', s && s.success, JSON.stringify(s));
  await toSummary();
  check('RunSummary scene, no hub bars', (await scene()) === 'RunSummary' && !(await barsShown()).nav);
  await page.waitForTimeout(1500); await shot('09_run_summary');
  const save1 = await ev(() => { const d = window.__DR.Save.data; return { coins: d.coins, unlocked: d.unlocked, deliveries: d.stats.deliveries, settled: d.settled.length }; });
  const shownCoins = await ev(() => document.querySelector('[data-c="coins"]').textContent);
  check('reward settled once; summary shows real coins', save1.coins > 0 && save1.unlocked === 2 && save1.deliveries === 1 && save1.settled === 1 && shownCoins === String(save1.coins), JSON.stringify(save1) + ' shown=' + shownCoins);
  await ev(() => { const D = window.__DR; D.Progression.settle(D.G.run); });
  check('no duplicate reward on re-settle', (await coins()) === save1.coins);

  await tap('[data-a="continue"]');
  check('Continue -> RunPrep with next chapter selected', (await scene()) === 'RunPrep' && await ev(() => !!document.querySelector('[data-a="sel"][data-n="2"].on')));
  await nav('Garage');
  check('Garage badge from real affordability', await ev(() => !document.querySelector('[data-nav="Garage"] .p-badge').hidden));
  await shot('10_garage');
  const c0 = await coins();
  await tap('[data-a="up"][data-id="motor"]');
  const g1 = await ev(() => ({ lvl: window.__DR.Save.data.garage.motor, coins: window.__DR.Save.data.coins }));
  check('Garage upgrade buys exactly one level', g1.lvl === 1 && g1.coins === c0 - 110, JSON.stringify(g1));
  await page.waitForTimeout(900);
  check('TopBar coins follow the real wallet', (await ev(() => document.querySelector('[data-coins] b').textContent)) === String(g1.coins));
  await tap('[data-a="view"][data-v="skins"]'); await shot('11_garage_skins');
  await esc();
  check('back closes Garage sub-view first', (await scene()) === 'Garage' && await ev(() => !!document.querySelector('.gr-door')));
  await tap('[data-a="view"][data-v="trophy"]'); await shot('12_trophy_room');
  await esc(); await esc();
  check('back from hub -> MainMenu', (await scene()) === 'MainMenu');

  await nav('MetaHub'); await shot('13_metahub');
  const c1 = await coins();
  const expect = await ev(() => { const D = window.__DR, s = D.Save.data; return Object.keys(s.milestones.unlocked).filter(k => !s.milestones.claimed[k]).length; });
  await tap('[data-a="collect"]');
  const claimedNow = await ev(() => Object.keys(window.__DR.Save.data.milestones.claimed).length);
  check('MetaHub collect claims every unlocked milestone exactly once', expect >= 1 && claimedNow === expect && (await coins()) > c1 && await ev(() => window.__DR.Save.data.milestones.claimed.m_first === true), `${expect} ready, ${c1} -> ${await coins()}`);
  const c1b = await coins(); await ev(() => window.__DR.Progression.claimMilestone('m_first'));
  check('repeat milestone claim pays nothing', (await coins()) === c1b);
  await tap('[data-a="view"][data-v="milestones"]'); await shot('14_milestones');
  check('claimed milestone cannot be claimed again', await ev(() => !document.querySelector('[data-a="claimm"][data-id="m_first"]')));
  await esc();
  await tap('[data-a="view"][data-v="board"]'); await shot('15_delivery_board'); await esc();
  await tap('[data-a="view"][data-v="book"]'); await shot('16_courier_book'); await esc();

  await nav('Settings'); await shot('17_settings');
  await page.locator('[data-a="tog"][data-k="reducedMotion"]').click(); await page.waitForTimeout(200);
  check('reduced motion setting applies + persists', await ev(() => document.getElementById('ui').classList.contains('reduced') && window.__DR.Save.data.settings.reducedMotion === true));
  await page.locator('[data-nav="MainMenu"]').click(); await page.waitForTimeout(30);
  check('reduced motion: transition is instant', !(await ev(() => window.__DR.Scenes.transitioning)) && (await scene()) === 'MainMenu');
  await page.waitForTimeout(250); // nav debounce window
  await nav('Settings');
  await page.locator('[data-a="tog"][data-k="reducedMotion"]').click(); await page.waitForTimeout(150);
  const bundle = await ev(() => { const b = window.__DR.Save.exportBundle(); b.data.coins = 4321; return JSON.stringify(b); });
  const tmp = path.join(os.tmpdir(), 'dr_import_test.json'); fs.writeFileSync(tmp, bundle);
  await page.locator('[data-file]').setInputFiles(tmp); await page.waitForTimeout(400);
  check('import needs confirmation; edited file flagged by checksum', (await ev(() => window.__DR.UI.modalKind)) === 'confirm' && await ev(() => /sağlama/.test(document.querySelector('#modal').textContent)));
  await tap('#modal [data-a="confirm"]');
  check('import applied + previous save backed up', (await coins()) === 4321 && await ev(() => !!localStorage.getItem('debug__deliverogue_save_backup')));
  const bad = path.join(os.tmpdir(), 'dr_import_bad.json'); fs.writeFileSync(bad, '{"nope":1}');
  await page.locator('[data-file]').setInputFiles(bad); await page.waitForTimeout(300);
  check('invalid import rejected without changes', (await ev(() => window.__DR.UI.modalKind)) === null && (await coins()) === 4321);

  await nav('RunPrep');
  await tap('[data-a="sel"][data-n="2"]'); await tap('[data-a="start"]'); await tap('#modal [data-a="begin"]'); await tap('#modal [data-a="pickskill"]');
  s = await runState(); check('C2 starts', s && s.n === 2 && s.state === 'play', JSON.stringify(s));
  await autopilot(true); await page.waitForFunction(() => window.__DR.G.run.picked, null, { timeout: 15000 }).catch(() => {}); await autopilot(false);
  await ev(() => { const D = window.__DR; D.G.player.inv = 0; D.G.player.shield = false; D.Game.hurtPlayer(9999, {}); });
  s = await waitEnd(8000); await toSummary(); await page.waitForTimeout(1000);
  check('fail path: courier HP 0 -> failure summary with reason', s && s.success === false && s.reason === 'hp' && await ev(() => !!document.querySelector('.rs.lose .rs-reason')), JSON.stringify(s));
  await shot('18_run_failed');
  const save3 = await ev(() => { const d = window.__DR.Save.data; return { failures: d.stats.failures, unlocked: d.unlocked }; });
  check('failure recorded, no unlock', save3.failures === 1 && save3.unlocked === 2, JSON.stringify(save3));

  await tap('[data-a="replay"]'); await page.waitForTimeout(200);
  await tap('#modal [data-a="begin"]'); await tap('#modal [data-a="pickskill"]');
  const leaks = await ev(() => window.__DR.Bus.listenerCount('end'));
  check('FightScene re-entry does not leak Bus listeners', leaks === 1, 'end listeners=' + leaks);
  s = await runState();
  if (s && s.state === 'play') {
    await ev(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(200);
    check('visibility hidden auto-pauses run', await ev(() => window.__DR.G.run.paused === true && window.__DR.UI.modalKind === 'pause'));
  } else check('visibility hidden auto-pauses run', false, JSON.stringify(s));
  await tap('#modal [data-a="quitask"]'); await tap('#modal [data-a="confirm"]');
  check('confirmed quit -> RunPrep, run cleared, bars back', (await scene()) === 'RunPrep' && await ev(() => window.__DR.G.run === null) && (await barsShown()).nav);
  check('no console/page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  check('smoke aborted', false, e.stack); await shot('zz_abort');
} finally {
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ target, fingerprintC1: fp, results, errors }, null, 2));
  await browser.close(); if (srv) srv.close();
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
