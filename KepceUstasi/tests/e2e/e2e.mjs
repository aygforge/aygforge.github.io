// Uçtan uca tarayıcı testi (Playwright + Chromium) — derlenmiş dist/ üzerinde GERÇEK tıklamalarla.
// Kapsam: portrait yerleşim (360×640, 390×844, 412×915 20:9, 1080×1920, masaüstü yatay), iki chapter'ın tam oynanışı,
// kalıcı upgrade satın alma, kayıt/yeniden açma, dalga checkpoint'inden devam, çift dokunuş/pause spam,
// arka plan duraklatma, çevrimdışı (service worker) açılış, dış ağ isteği olmaması, FPS ölçümü.
// Kullanım: npm run build && npm run test:e2e      (gerekirse: npm i -D playwright && npx playwright install chromium)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SHOTS = join(ROOT, 'tests', 'e2e', 'screenshots');
mkdirSync(SHOTS, { recursive: true });
const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const results = [];
const external = new Set();
const consoleErrors = [];
let browser;

function record(id, name, pass, detail = '') {
  results.push({ id, name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name}${detail ? ' — ' + detail : ''}`);
}

async function startServer() {
  const proc = spawn(process.execPath, [join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return proc;
    } catch {
      /* not yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('preview server did not start');
}

async function newPage(ctx) {
  const p = await ctx.newPage();
  p.on('request', (req) => {
    const u = req.url();
    if (!u.startsWith(`http://localhost:${PORT}`) && !u.startsWith('data:') && !u.startsWith('blob:')) external.add(u);
  });
  p.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  return p;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(p, fn, arg, timeout = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await p.evaluate(fn, arg).catch(() => false)) return true;
    await sleep(40);
  }
  return false;
}

async function gameH(p) {
  return p.evaluate(() => window.__KEPCE__.game.scale.height);
}

async function click(p, gx, gy) {
  const pt = await p.evaluate(([x, y]) => {
    const r = window.__KEPCE__.game.canvas.getBoundingClientRect();
    const s = r.width / 540;
    return { x: r.left + x * s, y: r.top + y * s };
  }, [gx, gy]);
  await p.mouse.click(pt.x, pt.y);
}

const sceneActive = (p, key) => waitFor(p, (k) => window.__KEPCE__?.game?.scene?.isActive(k), key);

async function clickPlay(p) {
  const H = await gameH(p);
  await click(p, 270, H - 960 + 700);
  return sceneActive(p, 'Game');
}

// Play the current run by real clicks: tap when the ladle is over the pile, pick the first skill card.
async function playRun(p, { policy = 'good', maxMs = 420000, stopWhen = null } = {}) {
  const H = await gameH(p);
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await p.evaluate(() => {
      const c = window.__KEPCE__.controller;
      return { phase: c.phase, x: c.pot.ladlePose.x, amp: c.ladle.amp, wave: c.run.wave, finished: c.finished, overlay: !!window.__KEPCE__.scene.overlay };
    });
    if (stopWhen && (await p.evaluate(stopWhen))) return { stopped: true };
    if (s.finished) {
      await waitFor(p, () => !!window.__KEPCE__.scene.overlay, null, 8000);
      return p.evaluate(() => ({ ...window.__KEPCE__.controller.run.result, run: window.__KEPCE__.controller.run }));
    }
    if (s.phase === 'SWING_WAIT' && !s.overlay) {
      const good = policy === 'good' ? Math.abs(s.x - 222) < 18 : Math.abs(s.x - 222) > s.amp - 14;
      if (good) await click(p, 270, H - 140);
    } else if (s.phase === 'SKILL_CHOICE' && s.overlay) {
      const top = Math.max(24, H / 2 - 440);
      await click(p, 270, top + 88 + 84); // first card (Alpha 0.2 card layout)
      await sleep(120);
    }
    await sleep(12);
  }
  throw new Error('run did not finish in time');
}

// Alpha 0.2 is no longer a guaranteed win: if the bot loses, press TEKRAR OYNA and play again (attempts are reported).
async function playUntilWin(p, maxTries = 4) {
  const H = await gameH(p);
  for (let k = 1; k <= maxTries; k++) {
    const r = await playRun(p);
    if (r.victory) return { ...r, tries: k };
    if (k === maxTries) return { ...r, tries: k };
    const top = Math.max(30, H / 2 - 400);
    await click(p, 270, top + 624); // TEKRAR OYNA
    await waitFor(p, () => window.__KEPCE__.controller?.phase === 'SWING_WAIT' && !window.__KEPCE__.controller.finished, null, 15000);
  }
}

async function layoutCheck(name, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
  const p = await newPage(ctx);
  await p.goto(BASE + '?test=1&seed=7');
  await sceneActive(p, 'Menu');
  await sleep(300);
  await p.screenshot({ path: join(SHOTS, `layout_menu_${name}.png`) });
  await clickPlay(p);
  await waitFor(p, () => window.__KEPCE__.controller?.phase === 'SWING_WAIT');
  await sleep(400);
  await p.screenshot({ path: join(SHOTS, `layout_game_${name}.png`) });
  const m = await p.evaluate(() => {
    const r = window.__KEPCE__.game.canvas.getBoundingClientRect();
    const L = window.__KEPCE__.scene.L;
    return { r: { l: r.left, t: r.top, w: r.width, h: r.height, b: r.bottom, rt: r.right }, vw: innerWidth, vh: innerHeight, H: L.H, battle: L.battle, pot: L.pot, stove: L.stove, field: L.field };
  });
  const inside = m.r.l >= -0.5 && m.r.t >= -0.5 && m.r.rt <= m.vw + 0.5 && m.r.b <= m.vh + 0.5;
  const regions = m.battle.h >= 380 && m.pot.y > m.battle.bottom && m.stove.top + 30 <= m.H && m.field.bottom < m.battle.bottom;
  const scale = (m.r.w / 540).toFixed(3);
  record('A01', `portrait layout ${name}`, inside && regions, `canvas ${Math.round(m.r.w)}×${Math.round(m.r.h)} @(${Math.round(m.r.l)},${Math.round(m.r.t)}) in ${m.vw}×${m.vh}, game H=${m.H}, scale ${scale}, battle h=${m.battle.h}`);
  if (mobile) {
    // Alpha 0.2: shuffle button must not drop the ladle; 3 cards + reroll must fit
    await p.evaluate(() => (window.__KEPCE__.controller.run.abilities.pot_shuffle = 1));
    await sleep(300);
    const taps0 = await p.evaluate(() => window.__KEPCE__.controller.run.stats.taps);
    const by = Math.round((m.battle.bottom + 34 + (m.pot.y - 112)) / 2) - 2;
    await click(p, 540 - 78, by);
    await click(p, 540 - 78, by); // second tap on the (now disabled) button
    await sleep(200);
    const sh = await p.evaluate(() => ({ taps: window.__KEPCE__.controller.run.stats.taps, sh: window.__KEPCE__.controller.run.stats.shuffles, phase: window.__KEPCE__.controller.phase }));
    await p.screenshot({ path: join(SHOTS, `shuffle_${name}.png`) });
    record('A22', `shuffle button ${name}: shuffles once, never drops the ladle`, sh.taps === taps0 && sh.sh === 1 && sh.phase === 'SWING_WAIT', JSON.stringify(sh));
    await p.evaluate(() => {
      const c = window.__KEPCE__.controller;
      c.run.abilities.critical_fry = 1; // so a "level I -> II" card can show
      c.enterSkillChoice();
    });
    await sleep(400);
    await p.screenshot({ path: join(SHOTS, `cards_${name}.png`) });
    const fit = await p.evaluate(() => {
      const o = window.__KEPCE__.scene.overlay;
      const H = window.__KEPCE__.scene.L.H;
      let maxY = 0;
      let minY = 1e9;
      let maxX = 0;
      let minX = 1e9;
      o.list.slice(2).forEach((ch) => {
        const b = ch.getBounds();
        maxY = Math.max(maxY, b.bottom);
        minY = Math.min(minY, b.top);
        maxX = Math.max(maxX, b.right);
        minX = Math.min(minX, b.left);
      });
      return { minY, maxY, minX, maxX, H };
    });
    record('A21', `3 cards + reroll fit on ${name}`, fit.minY >= 0 && fit.maxY <= fit.H && fit.minX >= 0 && fit.maxX <= 540, `y ${Math.round(fit.minY)}–${Math.round(fit.maxY)} of ${fit.H}, x ${Math.round(fit.minX)}–${Math.round(fit.maxX)}`);
  }
  await ctx.close();
}

async function main() {
  const server = await startServer();
  browser = await chromium.launch();
  try {
    // ---------- A01 layouts
    await layoutCheck('360x640', { width: 360, height: 640 }, true);
    await layoutCheck('390x844', { width: 390, height: 844 }, true);
    await layoutCheck('412x915_20-9', { width: 412, height: 915 }, true);
    await layoutCheck('1080x1920', { width: 1080, height: 1920 }, false);
    await layoutCheck('desktop_1280x720', { width: 1280, height: 720 }, false);

    // ---------- full loop: Menemen -> upgrade -> Patates Kızartması -> reload
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const p = await newPage(ctx);
    await p.goto(BASE + '?test=1&seed=101');
    await sceneActive(p, 'Menu');
    await p.evaluate(() => window.__KEPCE__.app.setSetting('animSpeed', 2));
    await p.evaluate(() => window.__KEPCE__.app.setSetting('music', false));
    const H = await gameH(p);
    await clickPlay(p);
    await waitFor(p, () => window.__KEPCE__.controller?.phase === 'SWING_WAIT');

    // A02 tap spam within one swing
    await sleep(300);
    const before = await p.evaluate(() => window.__KEPCE__.controller.run.stats.taps);
    for (let i = 0; i < 12; i++) await click(p, 270, H - 140);
    await sleep(150);
    for (let i = 0; i < 8; i++) await click(p, 270, H - 300);
    const after = await p.evaluate(() => window.__KEPCE__.controller.run.stats.taps);
    await waitFor(p, () => window.__KEPCE__.controller.phase === 'SWING_WAIT', null, 15000);
    const volleys = await p.evaluate(() => window.__KEPCE__.controller.run.stats.catches.length);
    record('A02', 'tap spam → one drop / one turn', after - before === 1 && volleys === 1, `taps +${after - before}, catches ${volleys}`);

    // A15 pause spam + background
    for (let i = 0; i < 16; i++) await p.keyboard.press('p');
    const pausedOk = await p.evaluate(() => window.__KEPCE__.controller.phase === 'SWING_WAIT');
    await p.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hiddenPaused = await p.evaluate(() => window.__KEPCE__.controller.phase === 'PAUSED');
    await p.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await sleep(1500);
    const stillPaused = await p.evaluate(() => window.__KEPCE__.controller.phase === 'PAUSED');
    await p.screenshot({ path: join(SHOTS, 'pause.png') });
    const pt = H / 2 - 330;
    await click(p, 270, pt + 230); // DEVAM
    await sleep(200);
    const resumed = await p.evaluate(() => window.__KEPCE__.controller.phase === 'SWING_WAIT');
    const turnsAfterPause = await p.evaluate(() => window.__KEPCE__.controller.run.stats.catches.length);
    record('A15', 'pause spam + background auto-pause + resume', pausedOk && hiddenPaused && stillPaused && resumed && turnsAfterPause === 1, `even toggles→running:${pausedOk}, hidden→PAUSED:${hiddenPaused}, stays paused on return:${stillPaused}, resume:${resumed}`);

    // FPS during swing
    const fps = await p.evaluate(
      () =>
        new Promise((res) => {
          let n = 0;
          const t0 = performance.now();
          const f = () => {
            n++;
            if (performance.now() - t0 < 3000) requestAnimationFrame(f);
            else res((n * 1000) / (performance.now() - t0));
          };
          requestAnimationFrame(f);
        }),
    );
    record('PERF', 'frame rate while swinging (headless Chromium, software GL)', fps >= 30, `${fps.toFixed(1)} fps`);

    const r1 = await playUntilWin(p);
    await p.screenshot({ path: join(SHOTS, 'result_menemen.png') });
    const save1 = await p.evaluate(() => JSON.parse(JSON.stringify(window.__KEPCE__.app.save)));
    record('A12', 'six skill picks in a full run, none after the boss', Object.values(r1.run.abilities).reduce((a, b) => a + b, 0) === 6 && r1.run.choiceCount === 6, `picks ${JSON.stringify(r1.run.abilities)}`);
    record('A14', 'Menemen played to the boss and served', r1.victory === true && save1.highestUnlocked === 2 && save1.tips > 0 && save1.activeRun === null, `stars ${r1.stars}, attempts ${r1.tries}, tips ${save1.tips}, unlocked ${save1.highestUnlocked}`);

    // back to the restaurant, buy an upgrade with real clicks
    const rt = Math.max(30, H / 2 - 400);
    await click(p, 368, rt + 694); // RESTORAN
    await sceneActive(p, 'Menu');
    await sleep(300);
    await click(p, 270, H - 960 + 818); // GELİŞTİR
    await sleep(300);
    await p.screenshot({ path: join(SHOTS, 'upgrades.png') });
    const ut = Math.max(20, (H - 820) / 2);
    const tipsBefore = await p.evaluate(() => window.__KEPCE__.app.save.tips);
    // the cheapest affordable line: toughness (45) is row 2
    await click(p, 430, ut + 96 + 2 * 104 + 46);
    await sleep(200);
    await click(p, 430, ut + 96 + 2 * 104 + 46); // a second purchase only if affordable
    const s2 = await p.evaluate(() => JSON.parse(JSON.stringify(window.__KEPCE__.app.save)));
    const spent = tipsBefore - s2.tips;
    const expectSpent = s2.upgrades.toughness === 3 ? 45 + 80 : 45;
    record('A13', 'upgrade purchase by click (atomic, persisted)', s2.upgrades.toughness >= 2 && spent === expectSpent, `toughness Sv${s2.upgrades.toughness}, spent ${spent}, tips ${s2.tips}`);
    await click(p, 270, ut + 820 - 44); // KAPAT
    await sleep(200);
    await clickPlay(p); // OYNA now opens Patates Kızartması
    const ch2 = await p.evaluate(() => window.__KEPCE__.scene.chapter.id);
    const hpStart = await p.evaluate(() => window.__KEPCE__.controller.run.chef.maxHp);
    await sleep(500);
    await p.screenshot({ path: join(SHOTS, 'fries_start.png') });
    const r2 = await playUntilWin(p);
    await p.screenshot({ path: join(SHOTS, 'result_fries.png') });
    const save2 = await p.evaluate(() => JSON.parse(JSON.stringify(window.__KEPCE__.app.save)));
    record('A14b', 'Patates Kızartması played to Patates Kral and served (upgrade active)', ch2 === 'fries' && r2.victory === true && hpStart === 6 && !!save2.chapters.fries?.cleared, `chapter ${ch2}, chef max HP ${hpStart}, stars ${r2.stars}, attempts ${r2.tries}, tips ${save2.tips}`);

    // reload: progress kept
    await p.reload();
    await sceneActive(p, 'Menu');
    const save3 = await p.evaluate(() => JSON.parse(JSON.stringify(window.__KEPCE__.app.save)));
    await p.screenshot({ path: join(SHOTS, 'menu_after_reload.png') });
    record('SAVE', 'close/reopen keeps tips, upgrades, stars, unlocks', save3.tips === save2.tips && save3.upgrades.toughness === save2.upgrades.toughness && save3.chapters.menemen.stars === save2.chapters.menemen.stars && save3.chapters.fries.cleared && save3.highestUnlocked === 2, `tips ${save3.tips}, stars M${save3.chapters.menemen.stars}/F${save3.chapters.fries.stars}`);

    // ---------- checkpoint resume (QA 14)
    await click(p, 98, H - 960 + 818); // TARİFLER
    await sleep(300);
    const ct = Math.max(20, (H - 640) / 2);
    await click(p, 390, ct + 80 + 150); // Menemen TEKRAR OYNA
    await sceneActive(p, 'Game');
    await playRun(p, { stopWhen: () => window.__KEPCE__.controller.run.wave === 3 && window.__KEPCE__.controller.phase === 'SWING_WAIT' });
    const snapState = await p.evaluate(() => {
      const a = window.__KEPCE__.app.save.activeRun;
      return { wave: a.run.wave, recipe: a.run.recipe, kills: a.run.stats.kills, runId: a.runId, tips: window.__KEPCE__.app.save.tips };
    });
    await p.reload(); // "process killed" mid-wave
    await sceneActive(p, 'Menu');
    await p.screenshot({ path: join(SHOTS, 'menu_continue.png') });
    await clickPlay(p); // DEVAM ET
    await waitFor(p, () => window.__KEPCE__.controller?.phase === 'SWING_WAIT');
    const restored = await p.evaluate(() => {
      const c = window.__KEPCE__.controller;
      return { wave: c.run.wave, recipe: c.run.recipe, kills: c.run.stats.kills, runId: c.run.runId, views: window.__KEPCE__.scene.views.size, alive: c.run.enemies.filter((e) => !e.dead && !e.escaped).length };
    });
    const r3 = await playRun(p);
    const save4 = await p.evaluate(() => JSON.parse(JSON.stringify(window.__KEPCE__.app.save)));
    const gained = save4.tips - snapState.tips;
    const okResume =
      restored.wave === snapState.wave &&
      JSON.stringify(restored.recipe) === JSON.stringify(snapState.recipe) &&
      restored.kills === snapState.kills &&
      restored.runId === snapState.runId &&
      restored.views === restored.alive &&
      save4.claimedRuns.filter((x) => x === snapState.runId).length === 1 &&
      save4.activeRun === null;
    record('A15b', 'wave checkpoint resume after reload: no double kill/wave/reward', okResume, `wave ${restored.wave}, recipe ${JSON.stringify(restored.recipe)}, result ${r3.victory ? 'victory' : 'defeat'} ${r3.stars}★, +${gained} tips once`);
    await ctx.close();

    // ---------- offline (service worker) + no external requests
    const octx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const op = await newPage(octx);
    await op.goto(BASE + '?test=1');
    await sceneActive(op, 'Menu');
    await op.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await sleep(800);
    await octx.setOffline(true);
    await op.reload();
    const offMenu = await sceneActive(op, 'Menu');
    await clickPlay(op);
    const offGame = await waitFor(op, () => window.__KEPCE__.controller?.phase === 'SWING_WAIT');
    const OH = await gameH(op);
    await sleep(500);
    await click(op, 270, OH - 140);
    const offTurn = await waitFor(op, () => window.__KEPCE__.controller.run.stats.catches.length === 1 && window.__KEPCE__.controller.phase !== 'CLAW_DROP', null, 8000);
    await op.screenshot({ path: join(SHOTS, 'offline_game.png') });
    record('A16', 'offline: reload with network off, menu + a real turn work', offMenu && offGame && offTurn, 'service worker cache');
    await octx.close();

    record('NET', 'no request to any external host (no CDN/ads/analytics)', external.size === 0, external.size ? [...external].join(', ') : 'only localhost');
    record('ERR', 'no page errors / console errors', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));
  } finally {
    await browser.close();
    server.kill();
  }
  writeFileSync(join(ROOT, 'tests', 'e2e', 'results.json'), JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} e2e checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  browser?.close();
  process.exit(1);
});
