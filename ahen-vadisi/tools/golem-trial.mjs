// Hedefli Golem denemesi: node tools/golem-trial.mjs <warrior|mage> <artı> [hız]
// Önkoşul: npm run dev (http://localhost:5173). Lv.20, Rare+<artı> donanım, 15 Büyük HP iksiri.
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const cls = process.argv[2] || 'warrior', plus = +(process.argv[3] ?? 3), speed = +(process.argv[4] || 2);
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
p.on('console', (m) => { const t = m.text(); if (t.startsWith('BOT') || m.type() === 'error') console.log(t); });
p.on('pageerror', (e) => console.log('SAYFA HATASI', e.message));
await p.goto('http://localhost:' + (process.env.BOTPORT || 5173) + '/?dev=1');
await p.waitForSelector('[data-testid=menu-play]');
await p.tap('[data-testid=menu-play]'); await p.waitForTimeout(200);
await p.tap('[data-testid=create-char]'); await p.tap(`[data-testid=class-${cls}]`);
await p.fill('[data-testid=name-input]', 'Golem Deneme'); await p.tap('[data-testid=create-confirm]');
await p.waitForFunction(() => window.__AHEN?.world?.player);
await p.evaluate((s) => { window.__AHEN.timeScale = s; window.__AHEN.setSettings({ sound: false }); }, speed);
const res = await p.evaluate(async (pl) => { const bot = await import('/src/dev/bot.js'); return bot.golemTrial({ plus: pl }); }, plus).catch((e) => ({ error: e.message }));
await p.screenshot({ path: join(tmpdir(), `ahen-golem-${cls}.png`) }).catch(() => {});
console.log('SONUÇ', JSON.stringify(res));
await b.close();
