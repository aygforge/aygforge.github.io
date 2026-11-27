// tests/smoke/baseline.mjs — behaviour baseline fingerprint for all 12 Coffee chapters.
// Builds each chapter through the REAL runtime (Game.start) with a fixed save runCounter, so the seeded
// map/spawn stream is identical between builds. Prints JSON; compare the legacy HTML vs the modular build:
//   node tests/smoke/baseline.mjs reference/DeliveRogue.html > a.json && node tests/smoke/baseline.mjs dist > b.json
import { createRequire } from 'node:module';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const target = process.argv[2] || 'dist';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const root = target.endsWith('.html') ? path.resolve(path.dirname(target)) : path.resolve(target);
const file = target.endsWith('.html') ? path.basename(target) : 'index.html';
const srv = http.createServer((q, r) => { let p = q.url.split('?')[0]; if (p === '/') p = '/' + file; const f = path.join(root, decodeURIComponent(p));
  if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch(); const pg = await b.newPage(); const errs = [];
pg.on('pageerror', e => errs.push(e.message));
await pg.goto(`http://localhost:${srv.address().port}/?debug=1`); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(600);
const out = await pg.evaluate(() => {
  const D = window.__DR, res = [];
  for (let n = 1; n <= 12; n++) {
    D.Save.data.unlocked = 12; D.Save.data.runCounter = 100 + n;
    D.Game.start(n);
    const w = D.G.world, p = D.G.player;
    res.push({ ch: n, rows: w.rows, pathLen: w.pathLen, jets: w.jets.length, grates: w.grates.length, carts: w.carts.length, heals: w.heals.length,
      checkpoint: !!w.checkpoint, timer: D.G.run.ch.timer, pkg: D.G.run.ch.pkg, pkgHp: p.pkgHp, hp: p.hp,
      enemies: D.G.enemies.map(e => e.id + '@' + Math.round(e.x) + ',' + Math.round(e.y) + ':' + e.hp).join(' ') });
    D.Game.quit(); D.G.run = null;
  }
  return res;
});
console.log(JSON.stringify({ errors: errs, chapters: out }, null, 1));
await b.close(); srv.close();
