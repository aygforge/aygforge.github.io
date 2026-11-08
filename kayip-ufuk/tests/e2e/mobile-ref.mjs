// Emulated-mobile REFERENCE measurements (not a device result): cold boot to main menu and Continue availability
// with a phone landscape viewport/touch/DPR and 4× CPU throttling. Output: reports/evidence/mobile-reference.json
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'); const DIST = path.join(ROOT, 'dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer(async (req, res) => { try { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DIST, p); await stat(f); res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f)); } catch { res.writeHead(404); res.end(); } });
await new Promise((r) => server.listen(0, r)); const BASE = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch(); const out = { note: 'Emulation only: desktop CPU throttled 4×, Pixel 5 landscape profile. Not a substitute for AT_PERFORMANCE_03 on a real device.', runs: [] };
const ctx = await browser.newContext({ ...devices['Pixel 5 landscape'] });
for (let i = 0; i < 3; i++) {
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const t0 = Date.now(); await page.goto(BASE + '?test=1'); await page.waitForSelector('text=Yeni Oyun', { timeout: 60000 }); const menuMs = Date.now() - t0;
  if (i === 0) { await page.evaluate(() => window.__KU.newGame('slot-1', 5)); await page.waitForTimeout(800); await page.evaluate(() => window.__KU.save('ref')); await page.evaluate(() => window.__KU.app.persistence.flush()); }
  const cont = i > 0 ? await page.isVisible('text=Devam') : null;
  const blankCheck = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  out.runs.push({ run: i + 1, coldBootToMenuMs: menuMs, continueVisible: cont, bodyBackground: blankCheck });
  await page.screenshot({ path: path.join(ROOT, `reports/evidence/e2e/mobile_ref_boot_${i + 1}.png`) }); await page.close();
}
writeFileSync(path.join(ROOT, 'reports/evidence/mobile-reference.json'), JSON.stringify(out, null, 1)); console.log(JSON.stringify(out.runs));
await browser.close(); server.close();
