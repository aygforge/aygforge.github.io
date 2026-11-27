// V1.0 kısa UI smoke (Playwright): 360×640 ve 390×844 portrait; menü, 120 level sayfası, ekipman, dungeon, görev,
// mağaza ekranları ve L31 savaş ekranı açılır; konsol hatası olmamalı. Kullanım: npm run build && node tests/e2e/v1-ui-smoke.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'reports', 'v1', 'screens');
mkdirSync(OUT, { recursive: true });
const PORT = 4181;
const srv = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
let fails = 0;
for (const [w, h] of [[360, 640], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`http://localhost:${PORT}/?dev=1`);
  // give the dev save some progress so V1 screens have content (through the real menu object)
  await page.waitForFunction(() => window.__KEPCE__?.menu, null, { timeout: 20000 });
  await page.evaluate(() => {
    const { app } = window.__KEPCE__;
    for (let l = 1; l <= 34; l++) app.save.stageProgress.levels[l] = { cleared: true, stars: 2, plays: 1 };
    app.save.stageProgress.highestUnlocked = 35;
    app.save.tips = 5000;
    app.save.currencyParts = 300;
    app.persist();
    window.__KEPCE__.menu.scene.restart();
  });
  await page.waitForTimeout(800);
  const shot = async (name, fn) => {
    await page.evaluate(fn);
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(OUT, `${w}x${h}-${name}.png`) });
  };
  await shot('menu', () => {});
  await shot('levels-ch4', () => window.__KEPCE__.menu.openLevels(4));
  await shot('equipment', () => window.__KEPCE__.menu.openEquipment());
  await shot('dungeons', () => window.__KEPCE__.menu.openDungeons());
  await shot('quests', () => window.__KEPCE__.menu.openQuests());
  await shot('shop', () => window.__KEPCE__.menu.openShop());
  await page.evaluate(() => window.__KEPCE__.menu.closeOverlay());
  await page.evaluate(() => window.__KEPCE__.menu.playLevel(31));
  await page.waitForFunction(() => window.__KEPCE__?.controller, null, { timeout: 20000 });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: join(OUT, `${w}x${h}-battle-L31.png`) });
  const st = await page.evaluate(() => ({ phase: window.__KEPCE__.controller.phase, enemies: window.__KEPCE__.controller.run.enemies.length, energy: window.__KEPCE__.app.save.energy.value }));
  const ok = errors.length === 0 && st.enemies > 0;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${w}x${h} screens opened · battle phase ${st.phase} · enemies ${st.enemies} · energy ${st.energy}${errors.length ? ' · errors: ' + errors.slice(0, 3).join(' | ') : ''}`);
  await page.close();
}
await browser.close();
srv.kill();
process.exit(fails ? 1 : 0);
