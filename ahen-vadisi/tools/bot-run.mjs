// Bot oyuncuyu çalıştırır: node tools/bot-run.mjs <warrior|mage> <hız> <dakika>
// Önkoşul: npm run dev (http://localhost:5173)
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
const cls = process.argv[2] || 'warrior', speed = +(process.argv[3] || 4), minutes = +(process.argv[4] || 120);
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errors = [];
p.on('console', (m) => { const t = m.text(); if (t.startsWith('BOT')) console.log(t); else if (m.type() === 'error') { errors.push(t); console.log('KONSOL HATASI', t); } });
p.on('pageerror', (e) => { errors.push(e.message); console.log('SAYFA HATASI', e.message, e.stack); });
await p.goto('http://localhost:' + (process.env.BOTPORT||5173) + '/?dev=1');
await p.waitForSelector('[data-testid=menu-play]');
await p.tap('[data-testid=menu-play]'); await p.waitForTimeout(200);
await p.tap('[data-testid=create-char]'); await p.tap(`[data-testid=class-${cls}]`);
await p.fill('[data-testid=name-input]', cls === 'warrior' ? 'Bot Savaşçı' : 'Bot Büyücü'); await p.tap('[data-testid=create-confirm]');
await p.waitForFunction(() => window.__AHEN?.world?.player);
await p.evaluate((s) => { window.__AHEN.timeScale = s; window.__AHEN.setSettings({ sound: false }); }, speed);
const timer = setInterval(async () => { try { await p.screenshot({ path: join(tmpdir(), `ahen-bot-${cls}.png`) }); } catch { /* */ } }, 60000);
const res = await p.evaluate(async (m) => { const bot = await import('/src/dev/bot.js'); return bot.runStory({ maxMinutes: m }); }, minutes).catch((e) => ({ error: e.message }));
clearInterval(timer);
await p.screenshot({ path: join(tmpdir(), `ahen-bot-${cls}-end.png`) });
writeFileSync(join(tmpdir(), `ahen-bot-${cls}.json`), JSON.stringify({ res, errors }, null, 1));
console.log('SONUÇ', JSON.stringify(res.char || res), 'hata:', errors.length);
await b.close();
