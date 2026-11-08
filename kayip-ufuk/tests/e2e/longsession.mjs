// AT_PERFORMANCE_02 long-session memory run: travel the 12 regions (9 main + 3 islets) and 3 caves in a loop for
// DURATION_MIN minutes (default 60) of real time with the real render loop running, sampling JS heap (after forced GC),
// DOM size and internal cache sizes every 30 s. Headless Chromium in a container — not a phone.
// Output: reports/evidence/perf-longsession.json
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = path.join(ROOT, 'dist'); mkdirSync(path.join(ROOT, 'reports/evidence'), { recursive: true });
const OUT = path.join(ROOT, 'reports/evidence/perf-longsession.json');
const DURATION_MIN = Number(process.env.DURATION_MIN || 60);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer(async (req, res) => { try { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DIST, p); await stat(f); res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f)); } catch { res.writeHead(404); res.end(); } });
await new Promise((r) => server.listen(0, r)); const BASE = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }); const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(BASE + '?test=1'); await page.waitForFunction(() => window.__KU_BOOT, null, { timeout: 60000 });
await page.evaluate(() => window.__KU.newGame('slot-1', 777)); await page.waitForTimeout(1000);
const cdp = await ctx.newCDPSession(page);

// destinations: 9 main regions, 3 islets, 3 caves
const stops = await page.evaluate(() => {
  const g = window.__KU.game; const out = [];
  for (const [reg, t] of Object.entries(g.content.db.WorldMap.mainBiomeGeneration.sites)) out.push({ name: reg, scene: 'OVERWORLD', tile: g.terrain.localToAtlas('MAIN', ...t) });
  for (const isl of ['LIGHTHOUSE', 'WRECK', 'FERTILE']) { const l = g.content.db.NavigationDB.satelliteDockLandings[isl]; out.push({ name: 'ISLET_' + isl, scene: 'OVERWORLD', tile: g.terrain.localToAtlas(isl, l[0], l[1] - 6) }); }
  for (const cv of ['CAVE_COPPER', 'CAVE_BATS', 'CAVE_POND']) { const d = g.content.caves.get(cv); out.push({ name: cv, scene: cv, tile: d.sections[1].centerTile }); }
  return out;
});
const sample = async (t0, visits) => {
  await cdp.send('HeapProfiler.collectGarbage');
  const m = await page.evaluate(() => { const a = window.__KU.app; const g = window.__KU.game; return { heap: performance.memory.usedJSHeapSize, dom: document.getElementsByTagName('*').length, chunks: a.renderer.chunks.size, decor: a.renderer.decor.size, avatarCache: a.renderer.atlas.avatarCache.size, animals: g.world.animals.length, fx: g.world.fx.length, toasts: (a.ui.toastLog || []).length, day: g.state.clock.dayIndex }; });
  return { tMin: +((Date.now() - t0) / 60000).toFixed(2), visits, heapMiB: +(m.heap / 1048576).toFixed(2), ...m };
};
const t0 = Date.now(); const samples = []; let visits = 0; let k = 0; let nextSample = 0;
samples.push(await sample(t0, 0));
while (Date.now() - t0 < DURATION_MIN * 60000) {
  const s = stops[k++ % stops.length];
  await page.evaluate((st) => { const g = window.__KU.game; const grid = g.terrain.grid(st.scene); const sp = g.pathfinder.nearestTile(grid, st.tile[0], st.tile[1], (x, y) => g.terrain.passable(grid, x, y, 'WALK'), 10) || st.tile; g.world.teleport(st.scene, (sp[0] + 0.5) * 32, (sp[1] + 0.5) * 32); g.state.player.health = 100; g.state.player.hunger = 100; g.state.player.thirst = 100; g.state.player.rest = 100; }, s);
  visits++;
  // walk around for ~8 s of real time using the real input path (frame loop keeps rendering)
  for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) { await page.keyboard.down(key); await page.waitForTimeout(2000); await page.keyboard.up(key); }
  if (Date.now() - t0 >= nextSample) { samples.push(await sample(t0, visits)); nextSample = Date.now() - t0 + 30000; writeFileSync(OUT, JSON.stringify({ running: true, samples }, null, 1)); }
}
samples.push(await sample(t0, visits));
// bounded-growth analysis: least-squares slope of heap over the second half of the run
const half = samples.slice(Math.floor(samples.length / 2)); const n = half.length;
const mx = half.reduce((a, s) => a + s.tMin, 0) / n, my = half.reduce((a, s) => a + s.heapMiB, 0) / n;
const slope = half.reduce((a, s) => a + (s.tMin - mx) * (s.heapMiB - my), 0) / Math.max(1e-9, half.reduce((a, s) => a + (s.tMin - mx) ** 2, 0));
const maxHeap = Math.max(...samples.map((s) => s.heapMiB)); const first = samples[1] || samples[0];
const verdict = { durationMin: +((Date.now() - t0) / 60000).toFixed(1), stopsPerLoop: stops.length, visits, heapStartMiB: first.heapMiB, heapEndMiB: samples[samples.length - 1].heapMiB, heapMaxMiB: maxHeap, secondHalfSlopeMiBPer10Min: +(slope * 10).toFixed(3), maxChunks: Math.max(...samples.map((s) => s.chunks)), maxDecor: Math.max(...samples.map((s) => s.decor)), maxAvatarCache: Math.max(...samples.map((s) => s.avatarCache)), maxDom: Math.max(...samples.map((s) => s.dom)), errors: errors.slice(0, 20) };
verdict.bounded = verdict.secondHalfSlopeMiBPer10Min < 1 && verdict.heapMaxMiB < first.heapMiB + 48 && verdict.maxChunks <= 81 && verdict.maxDecor <= 161 && verdict.maxAvatarCache <= 901 && errors.length === 0;
writeFileSync(OUT, JSON.stringify({ running: false, device: 'headless Chromium (container, software rendering) — not a phone', verdict, stops: stops.map((s) => s.name), samples }, null, 1));
console.log('long session', JSON.stringify(verdict));
await browser.close(); server.close();
