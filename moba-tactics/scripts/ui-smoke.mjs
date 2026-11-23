// Browser smoke test: menu -> prep -> match start -> HUD interactions, screenshots. Usage: node scripts/ui-smoke.mjs <outDir> [url]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? 'dist/screens';
const url = process.argv[3] ?? 'http://localhost:4173/index.html';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
for (const vp of [{ name: 'desktop', width: 1280, height: 720 }, { name: 'phone', width: 915, height: 412, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, hasTouch: !!vp.mobile, isMobile: !!vp.mobile });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${vp.name}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${vp.name} console: ${m.text()}`); });
  await page.goto(url);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${vp.name}_menu.png` });
  await page.click('#start');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${vp.name}_match_start.png` });
  // speed up simulated time
  await page.evaluate(() => { const app = window.__app; app.bridge.speed = 2; });
  await page.waitForTimeout(12000);
  await page.screenshot({ path: `${out}/${vp.name}_match_close.png` });
  await page.click('#cam');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${vp.name}_match_overview.png` });
  await page.click('#items');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${vp.name}_items.png` });
  await page.click('#items');
  // select jungler and order
  await page.click('[data-slot="1"]');
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.__match.world.teams[0].tp);
  await page.click('[data-o="raid_top"]');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ tp: window.__match.world.teams[0].tp, order: window.__match.world.champions(0)[1].champ.order }));
  console.log(vp.name, 'TP before', before.toFixed(1), 'after', after.tp.toFixed(1), 'order', after.order);
  const hudBox = await page.evaluate(() => [...document.querySelectorAll('#hud .top, #hud .bl, #hud .br, #hud .tr, #hud .tl')].map((e) => { const r = e.getBoundingClientRect(); return [e.className, Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }));
  console.log(vp.name, 'HUD boxes', JSON.stringify(hudBox), 'viewport', vp.width, vp.height);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/${vp.name}_after_order.png` });
  const fps = await page.evaluate(() => window.__app.game.loop.actualFps);
  console.log(vp.name, 'fps', fps.toFixed(1));
  await ctx.close();
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
