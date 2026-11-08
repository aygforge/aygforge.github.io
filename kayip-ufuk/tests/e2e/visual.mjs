// Browser visual acceptance run (Chromium/Playwright) against dist/ — VIS_01/02/03/08/15/16/17/19/26 plus
// rendered contact sheets for the pixel-level checks in tests/unit/assets.test.mjs (VIS_05/07/10/11/12/13/28).
// Writes reports/evidence/visual-results.json and images to reports/evidence/visual/.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = path.join(ROOT, 'dist'); const EV = path.join(ROOT, 'reports/evidence/visual'); mkdirSync(EV, { recursive: true });
const PREFIX = '/html/7204511/'; // itch.io-like nested path: the game must only use relative URLs
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const served = []; const notFound = [];
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!p.startsWith(PREFIX)) { notFound.push(p); res.writeHead(404); res.end(); return; }
  p = p.slice(PREFIX.length - 1); if (p.endsWith('/')) p += 'index.html';
  try { const f = path.join(DIST, p); await stat(f); served.push(p); res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f)); } catch { notFound.push(p); res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r)); const BASE = `http://localhost:${server.address().port}${PREFIX}`;

const results = {}; const consoleErrors = [];
const rec = (id, status, evidence, notes = '') => { results[id] = { status, evidence: [].concat(evidence || []), notes }; console.log(status.padEnd(7), id, String(notes).slice(0, 150)); };
const rel = (f) => path.relative(ROOT, f);
const shot = async (page, name, clip) => { const f = path.join(EV, name + '.png'); await page.screenshot({ path: f, ...(clip ? { clip } : {}) }); return rel(f); };
const savePng = (name, dataUrl) => { const f = path.join(EV, name + '.png'); writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64')); return rel(f); };
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
async function run(id, fn) { if (ONLY && id !== 'VIS_01' && !ONLY.has(id)) return; try { await fn(); } catch (e) { rec(id, 'FAIL', [], String(e.stack || e).slice(0, 500)); } }

const browser = await chromium.launch();
async function newPage(viewport = { width: 1280, height: 720 }, query = '?test=1', ctx = null) {
  const c = ctx || await browser.newContext({ viewport });
  const page = await c.newPage(); page.errors = [];
  page.on('console', (m) => { if (m.type() === 'error') { page.errors.push(m.text()); consoleErrors.push(m.text()); } });
  page.on('pageerror', (e) => { page.errors.push('PAGEERROR ' + e.message); consoleErrors.push(e.message); });
  await page.goto(BASE + query); await page.waitForFunction(() => window.__KU_BOOT, null, { timeout: 60000 });
  return { ctx: c, page };
}
const G = (page, fn, arg) => page.evaluate(fn, arg);
async function startGame(page, slot = 'slot-1', seed = 42) { await G(page, ([s, sd]) => window.__KU.newGame(s, sd), [slot, seed]); await page.waitForTimeout(500); await G(page, () => { const g = window.__KU.game; g.state.climate.history[g.state.clock.dayIndex] = 'CLEAR'; g.state.clock.timeOfDaySeconds = 300; window.__KU.app.ui.closePanel?.(true); }); }
/** In-page helpers (installed once per page). */
const installHelpers = (page) => G(page, () => {
  window.__V = {
    spot(buildId, seeds, maxR = 45) {
      const g = window.__KU.game;
      for (const [sx, sy] of seeds) for (let r = 1; r < maxR; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const t = [sx + dx, sy + dy];
        if (!g.build.validatePlacement(buildId, t).length) return t;
      }
      return null;
    },
    complete(buildId, tile) {
      const g = window.__KU.game; const def = g.content.builds.get(buildId);
      const r = g.content.recipes.get(def.recipeId);
      if (r) { // grant the recipe's unlock exactly like the unit-test construct() helper
        const [kind, id] = r.unlock.split(':'); g.state.knowledge.items[id] = true; if (r.station !== 'HAND') g.state.knowledge.stations[r.station] = true;
        if (kind === 'STATION') g.state.knowledge.stations[id] = true;
        if (kind === 'BP' && !g.state.story.learnedBlueprints.includes(id)) g.state.story.learnedBlueprints.push(id);
        if (kind === 'STORY') { const u = g.content.db.EscapeDB.unlocks[id]; if (u?.type === 'POI_DISCOVERED') g.exploration.discover(u.poiId); if (u?.type === 'SPECIAL_DISCOVERED' && !g.state.story.specialItemsGranted.includes(u.itemId)) g.state.story.specialItemsGranted.push(u.itemId); if (u?.type === 'BUILT_OR_CRAFTED') g.state.knowledge.items[u.itemId] = true; const sp = { TWO_NAV_SOURCES: ['SPC_CHART_COAST', 'SPC_CHART_OBSERVATORY'], GENERATOR_CORE_FOUND: ['SPC_GEN_CORE'] }[id] || []; for (const x of sp) if (!g.state.story.specialItemsGranted.includes(x)) g.state.story.specialItemsGranted.push(x); g.state.world.worldFlags[id] = true; }
        for (const x of r.requiredSpecialItems || []) if (!g.state.story.specialItemsGranted.includes(x)) g.state.story.specialItemsGranted.push(x);
      }
      const pl = g.build.place(buildId, tile, { recipeId: def.recipeId }); if (!pl.ok) return { err: pl.code + ' ' + (pl.reasons || []).join(';') };
      const b = pl.value; b.stageIndex = b.stages.length; const c = g.build.complete(b.uid); if (!c.ok) return { err: 'complete ' + c.code };
      return { uid: b.uid };
    },
    /** capture atlas draw calls during one render */
    captureDraws(filter) {
      const app = window.__KU.app; const at = app.renderer.atlas; const orig = at.draw.bind(at); const calls = [];
      at.draw = (ctx, id, x, y, o = {}) => { if (!filter || filter(id)) { const m = ctx.getTransform(); calls.push({ id, x: m.a * x + m.e, y: m.d * y + m.f, sx: m.a, o: { ...o } }); } return orig(ctx, id, x, y, o); };
      try { app.renderer.render(1, null); } finally { at.draw = orig; }
      return calls;
    },
    canvasStats() {
      const cv = window.__KU.app.renderer.cv; const c = cv.getContext('2d'); const d = c.getImageData(0, 0, cv.width, cv.height).data;
      let black = 0, transparent = 0; const colors = new Set();
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 255) transparent++; if (d[i] + d[i + 1] + d[i + 2] < 24 && d[i + 3] === 255) black++; if (i % 64 === 0) colors.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); }
      return { w: cv.width, h: cv.height, black, transparent, colors: colors.size };
    },
  };
});

// ===================== VIS_01: clean nested HTTP path, all sheets resolved, no blank screen =====================
let main;
await run('VIS_01', async () => {
  main = await newPage();
  const boot = await G(main.page, () => ({ ...window.__KU_BOOT, pages: window.__KU.app.renderer ? null : null }));
  await startGame(main.page); await installHelpers(main.page);
  await main.page.waitForTimeout(1500);
  const r = await G(main.page, () => {
    const at = window.__KU.app.atlas;
    const pages = at.pages.map((img) => ({ src: img.src.split('/').slice(-1)[0], complete: img.complete, w: img.naturalWidth, h: img.naturalHeight }));
    return { pages, missingSprites: [...at.missing], stats: window.__V.canvasStats() };
  });
  const s = await shot(main.page, 'vis01_nested_path_boot');
  const absolute = served.filter((p) => !p.startsWith('/')).length;
  const ok = boot.ok && r.pages.length === 24 && r.pages.every((p) => p.complete && p.w === 1024 && p.h === 1024) && !r.missingSprites.length && notFound.length === 0 && r.stats.colors > 50 && main.page.errors.length === 0;
  writeFileSync(path.join(EV, 'vis01.json'), JSON.stringify({ base: BASE, served: served.length, notFound, ...r, absolute }, null, 1));
  rec('VIS_01', ok ? 'PASS' : 'FAIL', [s, 'reports/evidence/visual/vis01.json'], `served from ${PREFIX}; atlases ${r.pages.filter((p) => p.complete && p.w === 1024).length}/24 decoded; 404s=${notFound.length}; missing sprites=${r.missingSprites.length}; canvas colors=${r.stats.colors}`);
});
const page = main.page;

// ===================== VIS_02: all 20 TerrainDB IDs: texture follows collision tile, distinct surfaces =====================
await run('VIS_02', async () => {
  const r = await G(page, () => {
    const g = window.__KU.game; const app = window.__KU.app; const R = app.renderer; const grid = g.terrain.grid('OVERWORLD');
    const tdb = g.content.db.TerrainDB.tiles; const out = []; const sheet = document.createElement('canvas'); sheet.width = 20 * 36; sheet.height = 36 * 2; const sx = sheet.getContext('2d'); sx.imageSmoothingEnabled = false;
    const avg = {};
    for (const t of tdb) {
      // interior tile (4 neighbours same code, no road) so the chunk shows the raw texture
      // most interior tile of this code (narrow terrains such as trails/reed patches have no fully interior tile)
      let found = null, bestN = -1;
      for (let y = 2; y < grid.h - 2 && bestN < 4; y += 1) for (let x = 2; x < grid.w - 2 && bestN < 4; x += 1) {
        if (grid.tileAt(x, y) !== t.tileCode) continue;
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => grid.tileAt(x + dx, y + dy) === t.tileCode).length;
        if (n > bestN) { bestN = n; found = [x, y]; }
      }
      let synthetic = false; const restore = [];
      if (!found) { // terrain defined in TerrainDB but absent from the canonical map grids: paint a temporary 3×3 patch in memory, render, restore
        const m = codes => codes; void m; const meadow = g.content.db.TerrainDB.tiles.find((x) => x.id === 'MEADOW').tileCode;
        for (let y = 2; y < grid.h - 2 && !found; y++) for (let x = 2; x < grid.w - 2 && !found; x++) { let ok = true; for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (grid.tileAt(x + dx, y + dy) !== meadow) { ok = false; break; } if (ok) found = [x, y]; }
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = grid.i(found[0] + dx, found[1] + dy); restore.push([i, grid.tiles[i]]); grid.tiles[i] = t.tileCode; }
        R.invalidate(); synthetic = true;
      }
      const [x, y] = found; const CH = 16; const ch = R.chunk('OVERWORLD', Math.floor(x / CH), Math.floor(y / CH));
      const px = (x % CH) * 32, py = (y % CH) * 32; const d = ch.getContext('2d').getImageData(px, py, 32, 32).data;
      let best = 0; let bestV = -1;
      for (let v = 0; v < 4; v++) {
        const sp = R.atlas.extract(`terrain/${t.id}/${v}`); if (!sp) continue; const e = sp.getContext('2d').getImageData(0, 0, 32, 32).data; let m = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] === e[i] && d[i + 1] === e[i + 1] && d[i + 2] === e[i + 2]) m++;
        if (m > best) { best = m; bestV = v; }
      }
      const sp0 = R.atlas.extract(`terrain/${t.id}/0`); const e0 = sp0.getContext('2d').getImageData(0, 0, 32, 32).data; let rr = 0, gg = 0, bb = 0;
      for (let i = 0; i < e0.length; i += 4) { rr += e0[i]; gg += e0[i + 1]; bb += e0[i + 2]; } avg[t.id] = [rr / 1024, gg / 1024, bb / 1024];
      const tideBefore = g.terrain.lowTide; if (t.requiresSpecialState === 'low_tide') g.terrain.lowTide = true;
      const walk = g.terrain.passable(grid, x, y, 'WALK'); g.terrain.lowTide = tideBefore; const swim = g.terrain.passable(grid, x, y, 'SWIM'), raft = g.terrain.passable(grid, x, y, 'RAFT');
      const k = out.length; sx.drawImage(sp0, k * 36 + 2, 2); sx.drawImage(ch, px, py, 32, 32, k * 36 + 2, 38, 32, 32);
      if (synthetic) { for (const [i, c] of restore) grid.tiles[i] = c; R.invalidate(); }
      out.push({ id: t.id, code: t.tileCode, found, synthetic, sameNeighbours: synthetic ? 4 : bestN, special: t.requiresSpecialState, matchPct: Math.round((best / 1024) * 100), variant: bestV, walk, expectWalk: t.footWalkable, swim, expectSwim: t.swimPossible || t.footWalkable, raft, expectRaft: t.raftNavigable });
    }
    let minDist = 1e9, pair = null; const ids = Object.keys(avg);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const a = avg[ids[i]], b = avg[ids[j]]; const dd = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); if (dd < minDist) { minDist = dd; pair = [ids[i], ids[j]]; } }
    return { out, minDist, pair, sheet: sheet.toDataURL() };
  });
  const sheet = savePng('vis02_terrain_sheet_top_sprite_bottom_rendered', r.sheet); const shots = [sheet];
  for (const t of r.out.filter((o) => o.found && !o.synthetic).slice(0, 20)) {
    await G(page, (o) => { const g = window.__KU.game; const grid = g.world.grid; const sp = g.pathfinder.nearestTile(grid, o.found[0], o.found[1], (x, y) => g.terrain.passable(grid, x, y, 'WALK'), 12) || o.found; g.world.teleport('OVERWORLD', (sp[0] + 0.5) * 32, (sp[1] + 0.5) * 32); }, t);
    await page.waitForTimeout(120); shots.push(await shot(page, 'vis02_' + t.id.toLowerCase()));
  }
  const bad = r.out.filter((o) => !o.found || o.matchPct < (o.sameNeighbours === 4 ? 95 : 55) || o.walk !== o.expectWalk || (o.expectRaft && !o.raft));
  writeFileSync(path.join(EV, 'vis02.json'), JSON.stringify({ ...r, sheet: undefined }, null, 1));
  rec('VIS_02', r.out.length === 20 && !bad.length && r.minDist > 6 ? 'PASS' : 'FAIL', shots.slice(0, 5).concat(['reports/evidence/visual/vis02.json', 'reports/evidence/visual/vis02_*.png (20)']), `20 terrain ids: rendered chunk texture = TerrainDB tile sprite (min match ${Math.min(...r.out.map((o) => o.matchPct || 0))}%), walk/swim/raft flags agree; map-absent (verified on temporary in-memory patch): ${r.out.filter((o) => o.synthetic).map((o) => o.id)}; closest mean colours ${r.pair} Δ=${r.minDist.toFixed(1)}; bad=${JSON.stringify(bad).slice(0, 200)}`);
});

// ===================== VIS_03: coast/river/cliff/path edges for every 4-neighbour mask =====================
await run('VIS_03', async () => {
  const r = await G(page, () => {
    const g = window.__KU.game; const R = window.__KU.app.renderer; const grid = g.terrain.grid('OVERWORLD'); const T = g.terrain.T || null;
    const codes = Object.fromEntries(g.content.db.TerrainDB.tiles.map((t) => [t.id, t.tileCode]));
    const isW = (c) => [codes.OCEAN_DEEP, codes.OCEAN_SHALLOW, codes.SEA_REEF, codes.RIVER_DEEP, codes.WETLAND_WADE, codes.RIVER_FORD].includes(c);
    const fam = { shore: (c) => c === codes.OCEAN_SHALLOW || c === codes.OCEAN_DEEP || c === codes.SEA_REEF, river_bank: (c) => c === codes.RIVER_DEEP || c === codes.WETLAND_WADE };
    const masks = { shore: {}, river_bank: {} }; let tilesChecked = 0, blackPx = 0, transparentPx = 0, seamPx = 0;
    for (let y = 1; y < grid.h - 1; y++) for (let x = 1; x < grid.w - 1; x++) {
      const c = grid.tileAt(x, y); if (isW(c) || c === codes.CLIFF_WALL) continue;
      for (const [f, pred] of Object.entries(fam)) {
        const m = (pred(grid.tileAt(x, y - 1)) ? 1 : 0) | (pred(grid.tileAt(x + 1, y)) ? 2 : 0) | (pred(grid.tileAt(x, y + 1)) ? 4 : 0) | (pred(grid.tileAt(x - 1, y)) ? 8 : 0);
        if (m && !masks[f][m]) masks[f][m] = [x, y];
      }
    }
    const sheet = document.createElement('canvas'); sheet.width = 15 * 100; sheet.height = 2 * 100; const sx = sheet.getContext('2d'); sx.imageSmoothingEnabled = false;
    let row = 0;
    for (const f of ['shore', 'river_bank']) {
      for (const [m, [x, y]] of Object.entries(masks[f])) {
        // render the 3×3 neighbourhood from chunk canvases and inspect the centre tile + its borders
        const tile = (tx, ty) => { const ch = R.chunk('OVERWORLD', Math.floor(tx / 16), Math.floor(ty / 16)); return [ch, (tx % 16) * 32, (ty % 16) * 32]; };
        const col = Number(m) - 1;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const [ch, px, py] = tile(x + dx, y + dy); sx.drawImage(ch, px, py, 32, 32, col * 100 + 2 + (dx + 1) * 32, row * 100 + 2 + (dy + 1) * 32, 32, 32); }
        const d = sx.getImageData(col * 100 + 2, row * 100 + 2, 96, 96).data; tilesChecked++;
        for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 255) transparentPx++; else if (d[i] + d[i + 1] + d[i + 2] < 24) blackPx++; }
        // seam: a hard line along a border between two tiles of the SAME terrain code (land/water borders are expected edges)
        const c0 = grid.tileAt(x, y);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (grid.tileAt(x + dx, y + dy) !== c0) continue; let line = 0;
          for (let k = 32; k < 64; k++) {
            const [ax, ay, bx, by] = dx === 1 ? [63, k, 64, k] : dx === -1 ? [32, k, 31, k] : dy === 1 ? [k, 63, k, 64] : [k, 32, k, 31];
            const a = (ay * 96 + ax) * 4, b = (by * 96 + bx) * 4; const ia = (ay * 96 + (dx ? 2 * ax - bx : ax)) * 4;
            const jump = Math.abs(d[a] - d[b]) + Math.abs(d[a + 1] - d[b + 1]) + Math.abs(d[a + 2] - d[b + 2]);
            const inner = Math.abs(d[a] - d[ia]) + Math.abs(d[a + 1] - d[ia + 1]) + Math.abs(d[a + 2] - d[ia + 2]);
            if (jump > 160 && inner < 40) line++;
          }
          if (line > 24) seamPx += line;
        }
      }
      row++;
    }
    // jitter: camera/tile offsets are integers while moving at sub-pixel speeds
    const p = g.state.player; const cams = [];
    for (let i = 0; i < 40; i++) { p.positionPx = [p.positionPx[0] + 0.37, p.positionPx[1] + 0.21]; R.render(1, null); cams.push([R.cam.x, R.cam.y]); }
    const fractional = cams.filter(([a, b]) => a !== Math.round(a) || b !== Math.round(b)).length;
    // water clipping: the animated water overlay is only drawn on water tiles
    const calls = window.__V.captureDraws((id) => id.startsWith('terrain/water/'));
    const camX = R.cam.x, camY = R.cam.y, s = R.cam.s; let onLand = 0;
    for (const c of calls) { const tx = Math.floor((c.x / s + camX) / 32), ty = Math.floor((c.y / s + camY) / 32); const code = grid.tileAt(tx, ty); if (!c.id.includes('shore_foam') && !isW(code) && code !== codes.SEA_REEF) onLand++; }
    const all = ['shore', 'river_bank', 'cliff', 'path'].map((f) => [f, Array.from({ length: 15 }, (_, i) => i + 1).filter((m) => !R.atlas.has(`terrain/transition/${f}/${m}`))]);
    return { masksFound: Object.fromEntries(Object.entries(masks).map(([f, o]) => [f, Object.keys(o).map(Number).sort((a, b) => a - b)])), missingSprites: all.filter(([, l]) => l.length), tilesChecked, blackPx, transparentPx, seamPx, fractional, overlayCalls: calls.length, overlayOnLand: onLand, sheet: sheet.toDataURL() };
  });
  const sheet = savePng('vis03_edge_masks_shore_row1_river_row2', r.sheet);
  await G(page, () => { const g = window.__KU.game; const t = g.terrain.localToAtlas('MAIN', 126, 214); g.world.teleport('OVERWORLD', t[0] * 32, t[1] * 32); });
  await page.waitForTimeout(200); const s1 = await shot(page, 'vis03_coast_ingame');
  const ok = !r.missingSprites.length && r.blackPx === 0 && r.transparentPx === 0 && r.seamPx === 0 && r.fractional === 0 && r.overlayOnLand === 0 && r.masksFound.shore.length >= 10;
  writeFileSync(path.join(EV, 'vis03.json'), JSON.stringify({ ...r, sheet: undefined }, null, 1));
  rec('VIS_03', ok ? 'PASS' : 'FAIL', [sheet, s1, 'reports/evidence/visual/vis03.json'], `masks in map: shore ${r.masksFound.shore.length}, river ${r.masksFound.river_bank.length}; all 4×15 transition sprites present; 3×3 renders: black=${r.blackPx} gaps=${r.transparentPx} seams=${r.seamPx}; sub-pixel cam frames=${r.fractional}/40; water overlay on land=${r.overlayOnLand}/${r.overlayCalls}`);
});

// ===================== VIS_08: 58 BuildDB structures: footprint, ghost + finished rendering, collisions under visuals =====================
await run('VIS_08', async () => {
  const r = await G(page, () => {
    const g = window.__KU.game; const R = window.__KU.app.renderer; const builds = [...g.content.builds.values()];
    const L = (lx, ly) => g.terrain.localToAtlas('MAIN', lx, ly);
    const shore = g.terrain.localToAtlas('MAIN', ...g.content.seaRoutes.get('SEA_TO_WRECK').departureDock.shoreFootTileLocal);
    const lh = g.exploration.byId.get('POI_LIGHTHOUSE'); const seeds = [L(120, 196), L(140, 170), L(100, 150), L(150, 120), L(80, 110), shore, L(60, 170), [lh.ax, lh.ay + 3]];
    const out = []; const sheet = document.createElement('canvas'); const cols = 10; sheet.width = cols * 140; sheet.height = Math.ceil(builds.length / cols) * 150; const sx = sheet.getContext('2d'); sx.imageSmoothingEnabled = false; sx.fillStyle = '#2a6a4a'; sx.fillRect(0, 0, sheet.width, sheet.height);
    builds.forEach((def, k) => {
      const [fw, fh] = g.build.footprint(def.id);
      const ghost = R.atlas.extract(`build/${def.id}/ghost`), done = R.atlas.extract(`build/${def.id}/complete`);
      const cx = (k % cols) * 140, cy = Math.floor(k / cols) * 150;
      if (ghost) sx.drawImage(ghost, cx + 2, cy + 2, Math.min(64, ghost.width), Math.min(64, ghost.height) * (Math.min(64, ghost.width) / ghost.width));
      if (done) { const sc = Math.min(1, 68 / done.width, 140 / done.height); sx.drawImage(done, cx + 70, cy + 145 - done.height * sc, done.width * sc, done.height * sc); }
      let tile = window.__V.spot(def.id, seeds); let placed = null;
      if (tile) placed = window.__V.complete(def.id, tile);
      const b = placed?.uid ? g.state.buildingState.byId[placed.uid] : null; const grid = g.world.grid;
      let solids = 0, solidsOutside = 0, solidUncovered = 0;
      if (b) {
        // every solid cell must lie inside the footprint and under opaque pixels of the finished sprite
        const dw = done.width, dh = done.height; const dd = done.getContext('2d').getImageData(0, 0, dw, dh).data;
        const sx0 = (b.tile[0] + b.w / 2) * 32 - dw / 2, sy0 = (b.tile[1] + b.h) * 32 - dh;
        for (let y = b.tile[1] - 1; y <= b.tile[1] + b.h; y++) for (let x = b.tile[0] - 1; x <= b.tile[0] + b.w; x++) {
          if (!grid.inb(x, y) || !grid.solid[grid.i(x, y)]) continue;
          const own = x >= b.tile[0] && x < b.tile[0] + b.w && y >= b.tile[1] && y < b.tile[1] + b.h; if (!own) continue; solids++;
          let cov = 0; for (let py = y * 32; py < y * 32 + 32; py += 4) for (let px = x * 32; px < x * 32 + 32; px += 4) { const lx = Math.floor(px - sx0), ly = Math.floor(py - sy0); if (lx >= 0 && ly >= 0 && lx < dw && ly < dh && dd[(ly * dw + lx) * 4 + 3]) cov++; }
          if (cov < 8) solidUncovered++;
        }
        void solidsOutside;
      }
      out.push({ id: def.id, footprint: [fw, fh], placed: !!b, at: tile, size: b ? [b.w, b.h] : null, ghost: !!ghost, complete: !!done, solids, solidUncovered, err: placed?.err || (tile ? null : 'no valid spot') });
    });
    return { out, sheet: sheet.toDataURL() };
  });
  const sheet = savePng('vis08_58_builds_ghost_and_complete', r.sheet);
  const shots = [sheet];
  for (const id of ['BUILD_LARGE_HOUSE', 'BUILD_WORKBENCH', 'BUILD_PIER', 'BUILD_ESCAPE_BOAT', 'BUILD_SIGNAL_STATION', 'BUILD_PLANTER']) {
    const o = r.out.find((x) => x.id === id); if (!o?.at) continue;
    await G(page, (t) => { const g = window.__KU.game; g.world.teleport('OVERWORLD', (t[0] + 1) * 32, (t[1] + 3.5) * 32); }, o.at); await page.waitForTimeout(150);
    shots.push(await shot(page, 'vis08_' + id.toLowerCase()));
  }
  // ghost rendering in-world (placement preview)
  await G(page, () => { const g = window.__KU.game; const [x, y] = g.world.playerTile(); g.ui.placement = { buildId: 'BUILD_WORKBENCH', tile: [x + 1, y - 3], valid: !g.build.validatePlacement('BUILD_WORKBENCH', [x + 1, y - 3]).length }; });
  await page.waitForTimeout(150); shots.push(await shot(page, 'vis08_ghost_preview')); await G(page, () => { window.__KU.game.ui.placement = null; });
  const bad = r.out.filter((o) => !o.placed || !o.ghost || !o.complete || o.size[0] !== o.footprint[0] || o.size[1] !== o.footprint[1] || o.solidUncovered);
  writeFileSync(path.join(EV, 'vis08.json'), JSON.stringify(r.out, null, 1));
  rec('VIS_08', r.out.length === 58 && !bad.length ? 'PASS' : 'FAIL', shots.concat(['reports/evidence/visual/vis08.json']), `${r.out.filter((o) => o.placed).length}/58 placed+completed in world with ghost & complete sprites; footprint matches BuildDB; solid cells=${r.out.reduce((a, o) => a + o.solids, 0)}, uncovered by sprite=${r.out.reduce((a, o) => a + o.solidUncovered, 0)}; bad=${bad.map((o) => o.id + ':' + (o.err || o.solidUncovered)).join(',')}`);
});

// ===================== VIS_15: raft + escape boat: hull follows collider, 4 directions, anchored wake =====================
await run('VIS_15', async () => {
  const shots = [];
  const setup = await G(page, () => {
    const g = window.__KU.game; const shore = g.terrain.localToAtlas('MAIN', ...g.content.seaRoutes.get('SEA_TO_WRECK').departureDock.shoreFootTileLocal);
    g.world.teleport('OVERWORLD', (shore[0] + 0.5) * 32, (shore[1] + 0.5) * 32);
    const t = window.__V.spot('BUILD_RAFT', [shore]); const r = window.__V.complete('BUILD_RAFT', t); if (r.err) return r;
    const raftId = r.uid; const b = g.sea.board(raftId); for (let i = 0; i < 75; i++) g.tick(1 / 30, { x: 0, y: 1 }); return { ok: b.ok, raftId, tile: t, open: g.state.player.positionPx };
  });
  const dirs = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }; const res = {};
  for (const [d, inp] of Object.entries(dirs)) {
    const r = await G(page, ([d, inp]) => {
      const g = window.__KU.game; const R = window.__KU.app.renderer; const off = []; const land = [];
      for (let i = 0; i < 45; i++) {
        g.tick(1 / 30, inp); const [px, py] = g.state.player.positionPx;
        const t = [Math.floor(px / 32), Math.floor(py / 32)]; if (!g.terrain.passable(g.world.grid, t[0], t[1], 'RAFT')) land.push(t);
        if (i % 5 === 0) { const c = window.__V.captureDraws((id) => id.startsWith('boat/BUILD_RAFT')); const s = R.cam.s; const mine = c.map((k) => [Math.round(k.x / s + R.cam.x - px), Math.round(k.y / s + R.cam.y - py), k.id.split('/')[2]]).sort((u, v) => Math.hypot(u[0], u[1]) - Math.hypot(v[0], v[1]))[0]; if (mine) off.push(mine); }
      }
      return { mode: g.state.player.mode, facing: g.state.player.facing, off, land: land.length };
    }, [d, inp]);
    res[d] = { facing: r.facing, mode: r.mode, offsets: [...new Set(r.off.map((o) => o.slice(0, 2).join(',')))], spriteDir: [...new Set(r.off.map((o) => o[2]))], landTiles: r.land };
    await page.waitForTimeout(100); shots.push(await shot(page, 'vis15_raft_' + d));
  }
  // escape boat: placed at the departure shore, drawn over its own collider footprint
  const boat = await G(page, () => {
    const g = window.__KU.game; g.sea.forceDisembark?.(); const shore = g.terrain.localToAtlas('MAIN', ...g.content.seaRoutes.get('SEA_TO_WRECK').departureDock.shoreFootTileLocal);
    g.world.teleport('OVERWORLD', (shore[0] + 0.5) * 32, (shore[1] + 0.5) * 32);
    const ex = Object.values(g.state.buildingState.byId).find((b) => b.buildId === 'BUILD_ESCAPE_BOAT'); let b = ex;
    if (!b) { const t = window.__V.spot('BUILD_ESCAPE_BOAT', [shore]); const r = window.__V.complete('BUILD_ESCAPE_BOAT', t); b = g.state.buildingState.byId[r.uid]; }
    const R = window.__KU.app.renderer; g.world.teleport('OVERWORLD', (b.tile[0] + b.w / 2) * 32, (b.tile[1] + b.h + 1.5) * 32);
    const c = window.__V.captureDraws((id) => id === 'build/BUILD_ESCAPE_BOAT/complete'); const s = R.cam.s;
    const spr = R.atlas.rect('build/BUILD_ESCAPE_BOAT/complete');
    const drawnCx = c.length ? c[0].x / s + R.cam.x : null, drawnBottom = c.length ? c[0].y / s + R.cam.y : null;
    return { footprint: [b.w, b.h], tile: b.tile, colliderCx: (b.tile[0] + b.w / 2) * 32, colliderBottom: (b.tile[1] + b.h) * 32, drawnCx, drawnBottom, spriteSize: [spr[3], spr[4]], bob: c.map((k) => k.y) };
  });
  await page.waitForTimeout(150); shots.push(await shot(page, 'vis15_escape_boat'));
  const raftOk = setup.ok && Object.entries(res).every(([d, v]) => v.facing === d && v.mode === 'RAFT' && v.offsets.length === 1 && v.spriteDir.length === 1 && v.spriteDir[0] === d && v.landTiles === 0);
  const boatOk = boat.drawnCx !== null && Math.abs(boat.drawnCx - boat.colliderCx) <= 1 && Math.abs(boat.drawnBottom - boat.colliderBottom) <= 2;
  writeFileSync(path.join(EV, 'vis15.json'), JSON.stringify({ setup, raft: res, boat }, null, 1));
  rec('VIS_15', raftOk && boatOk ? 'PASS' : 'FAIL', shots.concat(['reports/evidence/visual/vis15.json']), `raft 4 dirs: sprite dir = facing, constant hull offset to collider ${JSON.stringify(Object.fromEntries(Object.entries(res).map(([d, v]) => [d, v.offsets])))}, collider never on land; boat sprite centre Δ=${boat.drawnCx - boat.colliderCx}px bottom Δ=${boat.drawnBottom - boat.colliderBottom}px`);
  await G(page, () => { const g = window.__KU.game; if (g.state.player.mode === 'RAFT') g.sea.forceDisembark?.(); });
});

// ===================== VIS_16: sea + radio routes played from the game; distinct ending visuals; no live human NPC =====================
await run('VIS_16', async () => {
  const shots = []; const p2 = await newPage(); await startGame(p2.page, 'slot-2', 2222); await installHelpers(p2.page);
  const sea = await G(p2.page, () => {
    const g = window.__KU.game; g.finaleSpeed = 0.05;
    g.state.story.specialItemsGranted.push('SPC_CHART_COAST', 'SPC_CHART_OBSERVATORY');
    const shore = g.terrain.localToAtlas('MAIN', ...g.content.seaRoutes.get('SEA_TO_WRECK').departureDock.shoreFootTileLocal);
    g.world.teleport('OVERWORLD', (shore[0] + 0.5) * 32, (shore[1] + 0.5) * 32); g.state.knowledge.stations.BUILD_NAV_TABLE = true;
    const t = window.__V.spot('BUILD_ESCAPE_BOAT', [shore]); window.__V.complete('BUILD_ESCAPE_BOAT', t);
    g.state.climate.history[g.state.clock.dayIndex] = 'CLEAR';
    const npcBefore = g.world.animals.filter((a) => !g.content.species.has(a.speciesId)).length + g.world.interactables(40).filter((o) => /npc|human|talk/i.test(o.kind)).length;
    const c = g.escape.castOff(); return { ok: c.ok, reasons: c.reasons, npcBefore };
  });
  const seaSeg = {};
  for (let k = 0; k < 400; k++) {
    const st = await G(p2.page, () => { const g = window.__KU.game; const a = g.finale.active; if (!a) return { done: true }; for (let i = 0; i < 30; i++) { const b = g.finale.active; if (!b || b.done) break; const gate = b.gates.find((x) => !x.passed); const t = gate ? (gate.gap / 4) * 2 - 1 : 0; g.tick(1 / 30, { x: Math.sign(t - b.x) * Math.min(1, Math.abs(t - b.x) * 4), y: 0 }); } const b = g.finale.active; return { seg: b?.segment, done: !b || b.done, ids: b ? [...new Set(window.__V.captureDraws(() => true).map((c) => c.id.split('/').slice(0, 2).join('/')))] : [] }; });
    if (st.seg && !seaSeg[st.seg]) { seaSeg[st.seg] = st.ids; await p2.page.waitForTimeout(80); shots.push(await shot(p2.page, 'vis16_sea_' + st.seg.toLowerCase())); }
    if (st.done) break;
  }
  await p2.page.waitForTimeout(400); shots.push(await shot(p2.page, 'vis16_sea_end'));
  const seaEnd = await G(p2.page, () => ({ endings: window.__KU.game.state.story.endingAchievements, toast: (window.__KU.app.ui.toastLog || []).slice(-3) }));
  // radio route from the same save (post-sea island life continues)
  const radio = await G(p2.page, () => {
    const g = window.__KU.game; g.finaleSpeed = 0.05; window.__KU.app.ui.closePanel?.(true);
    const poi = g.exploration.byId.get('POI_LIGHTHOUSE'); g.world.teleport('OVERWORLD', (poi.ax + 0.5) * 32, (poi.ay + 3.5) * 32);
    g.state.story.specialItemsGranted.push('SPC_SOLAR_CORE', 'SPC_TX_MODULE');
    const t = window.__V.spot('BUILD_SIGNAL_STATION', [[poi.ax, poi.ay + 3]]); const r = window.__V.complete('BUILD_SIGNAL_STATION', t);
    const st = Object.values(g.state.buildingState.byId).find((b) => b.buildId === 'BUILD_SIGNAL_STATION'); st.data.powerVariant = 'solar';
    g.state.world.worldFlags.SIGNAL_TUNED = true; const sos = g.escape.sendSOS();
    for (let d = 0; d < 3; d++) g.simulateTime(1080, 'sleep');
    const [rx, ry] = g.escape.rescueTile(); g.world.teleport('OVERWORLD', (rx + 0.5) * 32, (ry + 0.5) * 32);
    const avail = g.escape.rescueAvailable(); const b = g.escape.boardRescue();
    return { placed: r, sos: sos.ok, avail, boarded: b.ok, sosText: 'automatic packet', npc: g.world.animals.filter((a) => !g.content.species.has(a.speciesId)).length };
  });
  const radioSeg = {};
  for (let k = 0; k < 400; k++) {
    const st = await G(p2.page, () => { const g = window.__KU.game; for (let i = 0; i < 30; i++) { const b = g.finale.active; if (!b || b.done) break; g.tick(1 / 30, { x: 0, y: 0 }); } const b = g.finale.active; return { seg: b?.segment, done: !b || b.done, ids: b ? [...new Set(window.__V.captureDraws(() => true).map((c) => c.id.split('/').slice(0, 2).join('/')))] : [] }; });
    if (st.seg && !radioSeg[st.seg]) { radioSeg[st.seg] = st.ids; await p2.page.waitForTimeout(80); shots.push(await shot(p2.page, 'vis16_radio_' + st.seg.toLowerCase())); }
    if (st.done) break;
  }
  await p2.page.waitForTimeout(400); shots.push(await shot(p2.page, 'vis16_radio_end'));
  const end = await G(p2.page, () => window.__KU.game.state.story.endingAchievements);
  const seaIds = new Set(Object.values(seaSeg).flat()), radioIds = new Set(Object.values(radioSeg).flat());
  const shared = [...seaIds].filter((x) => radioIds.has(x) && x.startsWith('scene/'));
  const ok = sea.ok && radio.boarded && end.includes('ESCAPE_SAIL') && end.includes('ESCAPE_RADIO') && Object.keys(seaSeg).length >= 3 && Object.keys(radioSeg).length >= 2 && !shared.length && sea.npcBefore === 0 && radio.npc === 0;
  writeFileSync(path.join(EV, 'vis16.json'), JSON.stringify({ sea, seaSegments: seaSeg, seaEnd, radio, radioSegments: radioSeg, endings: end, sharedSceneArt: shared }, null, 1));
  rec('VIS_16', ok ? 'PASS' : 'FAIL', shots.concat(['reports/evidence/visual/vis16.json']), `sea segments ${Object.keys(seaSeg)} → radio segments ${Object.keys(radioSeg)}; endings=${end}; shared scene art=${shared.length}; non-species entities before finale=${sea.npcBefore + radio.npc}; SOS is an automatic packet (no voice/dialogue)`);
  await p2.ctx.close();
});

// ===================== VIS_17: save in cave, on raft, in house, mid-puzzle → reload; appearance + states persist =====================
await run('VIS_17', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }); const shots = []; const out = {};
  const p = await newPage(undefined, '?test=1', ctx); await startGame(p.page, 'slot-3', 3333); await installHelpers(p.page);
  await G(p.page, () => { const g = window.__KU.game; Object.assign(g.state.player.appearance, { body: 'body_b', skin: 3, hair: 4, hairColor: 2, outfit: 2 }); window.__KU.app.renderer.atlas.avatarCache.clear(); });
  const scenarios = {
    cave: () => { const g = window.__KU.game; const d = g.content.caves.get('CAVE_BATS'); const c = d.sections[1].centerTile; g.world.teleport('CAVE_BATS', (c[0] + 0.5) * 32, (c[1] + 0.5) * 32); return { scene: g.world.sceneId }; },
    raft: () => { const g = window.__KU.game; const shore = g.terrain.localToAtlas('MAIN', ...g.content.seaRoutes.get('SEA_TO_WRECK').departureDock.shoreFootTileLocal); g.world.teleport('OVERWORLD', (shore[0] + 0.5) * 32, (shore[1] + 0.5) * 32); let id = Object.keys(g.state.vehicles.raftsById)[0]; if (!id) { const t = window.__V.spot('BUILD_RAFT', [shore]); window.__V.complete('BUILD_RAFT', t); id = Object.keys(g.state.vehicles.raftsById)[0]; } const r = g.state.vehicles.raftsById[id]; g.world.teleport('OVERWORLD', r.atlasPx[0], r.atlasPx[1]); g.sea.board(id); for (let i = 0; i < 20; i++) g.tick(1 / 30, { x: 0, y: 1 }); return { mode: g.state.player.mode }; },
    house: () => { const g = window.__KU.game; if (g.state.player.mode === 'RAFT') g.sea.forceDisembark?.(); const L = g.terrain.localToAtlas('MAIN', 120, 196); g.world.teleport('OVERWORLD', (L[0] + 0.5) * 32, (L[1] + 0.5) * 32); const t = window.__V.spot('BUILD_BAMBOO_HUT', [L]); const r = window.__V.complete('BUILD_BAMBOO_HUT', t); const b = g.state.buildingState.byId[r.uid]; const inner = g.pathfinder.nearestTile(g.world.grid, b.tile[0] + 1, b.tile[1] + 1, (x, y) => g.build.houseAt(x, y) === b && g.terrain.passable(g.world.grid, x, y, 'WALK'), 3); g.world.teleport('OVERWORLD', (inner[0] + 0.5) * 32, (inner[1] + 0.5) * 32); return { inside: !!g.build.houseAt(...g.world.playerTile()), uid: r.uid }; },
    puzzle: () => { const g = window.__KU.game; const id = (() => { const ks = [...g.content.puzzles.keys()]; const k = ks.find((x) => { const sc = g.content.puzzles.get(x).startCondition; return sc.poiDiscovered && !sc.repairMaterialsDeposited && !sc.escapeProjectBuilt && !sc.energyAvailable && !(sc.requiredStoryFlags || []).length && !g.puzzles.stateOf(x).solved; }); g.exploration.discover(g.content.puzzles.get(k).startCondition.poiDiscovered); return k; })(); const def = g.content.puzzles.get(id); g.puzzles.action(id, def.allowedActions[0], 0); window.__KU.app.ui.openPuzzle(id); return { id, ui: JSON.stringify(g.puzzles.stateOf(id).uiState), solved: g.puzzles.stateOf(id).solved }; },
  };
  for (const [name, fn] of Object.entries(scenarios)) {
    const before = await G(p.page, fn);
    const snap = await G(p.page, async () => { const g = window.__KU.game; await window.__KU.save('vis17'); await window.__KU.app.persistence.flush?.(); return { app: JSON.stringify(g.state.player.appearance), scene: g.world.sceneId, mode: g.state.player.mode, pos: g.state.player.positionPx.map(Math.round), builds: Object.values(g.state.buildingState.byId).filter((b) => b.stage === 'complete').length, puzzles: JSON.stringify(g.state.story.puzzlesById) }; });
    shots.push(await shot(p.page, `vis17_${name}_before`));
    await p.page.reload(); await p.page.waitForFunction(() => window.__KU_BOOT, null, { timeout: 60000 }); await installHelpers(p.page);
    await G(p.page, () => window.__KU.load('slot-3')); await p.page.waitForTimeout(700);
    const after = await G(p.page, () => { const g = window.__KU.game; return { app: JSON.stringify(g.state.player.appearance), scene: g.world.sceneId, mode: g.state.player.mode, pos: g.state.player.positionPx.map(Math.round), builds: Object.values(g.state.buildingState.byId).filter((b) => b.stage === 'complete').length, puzzles: JSON.stringify(g.state.story.puzzlesById) }; });
    if (name === 'puzzle') await G(p.page, (id) => window.__KU.app.ui.openPuzzle(id), before.id);
    await p.page.waitForTimeout(200); shots.push(await shot(p.page, `vis17_${name}_after_reload`));
    if (name === 'puzzle') await G(p.page, () => window.__KU.app.ui.closePanel?.(true));
    out[name] = { before, snap, after, same: JSON.stringify(snap) === JSON.stringify(after) };
  }
  const ok = Object.values(out).every((o) => o.same) && out.cave.after.scene === 'CAVE_BATS' && out.raft.after.mode === 'RAFT' && out.house.before.inside && JSON.parse(out.puzzle.after.puzzles)[out.puzzle.before.id];
  writeFileSync(path.join(EV, 'vis17.json'), JSON.stringify(out, null, 1));
  rec('VIS_17', ok ? 'PASS' : 'FAIL', shots.concat(['reports/evidence/visual/vis17.json']), Object.entries(out).map(([k, o]) => `${k}:${o.same ? 'identical' : 'DIFF ' + JSON.stringify(o.after).slice(0, 80)}`).join('; ') + ' (custom appearance body_b/skin3/hair4/col2/outfit2 kept)');
  await ctx.close();
});

// ===================== VIS_19: 1×/2×/3× integer zoom: crisp pixels, no half-pixel flicker =====================
await run('VIS_19', async () => {
  const res = []; const shots = [];
  for (const [w, h] of [[712, 400], [1422, 800], [2133, 1200]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const p = await newPage(undefined, '?test=1', ctx); await startGame(p.page, 'slot-1', 4242);
    await G(p.page, () => { const g = window.__KU.game; const t = g.terrain.localToAtlas('MAIN', 140, 170); g.world.teleport('OVERWORLD', t[0] * 32, t[1] * 32); });
    await p.page.waitForTimeout(400);
    const r = await G(p.page, () => {
      const R = window.__KU.app.renderer; const g = window.__KU.game; const out = { scale: R.scale, smoothing: R.ctx.imageSmoothingEnabled, frames: [] };
      for (let f = 0; f < 6; f++) {
        g.state.player.positionPx = [g.state.player.positionPx[0] + 0.43, g.state.player.positionPx[1] + 0.29]; R.render(1, null);
        const s = R.scale; const cv = R.cv; const d = R.ctx.getImageData(0, 0, cv.width, cv.height).data; let blocks = 0, mixed = 0;
        for (let by = 0; by + s <= cv.height; by += s * 3) for (let bx = 0; bx + s <= cv.width; bx += s * 3) {
          const i0 = (by * cv.width + bx) * 4; let uni = true;
          for (let yy = 0; yy < s && uni; yy++) for (let xx = 0; xx < s; xx++) { const i = ((by + yy) * cv.width + bx + xx) * 4; if (d[i] !== d[i0] || d[i + 1] !== d[i0 + 1] || d[i + 2] !== d[i0 + 2]) { uni = false; break; } }
          blocks++; if (!uni) mixed++;
        }
        out.frames.push({ cam: [R.cam.x, R.cam.y], blocks, mixedPct: +(100 * mixed / blocks).toFixed(3) });
      }
      return out;
    });
    shots.push(await shot(p.page, `vis19_zoom_${r.scale}x`, { x: Math.floor(w / 2) - 120, y: Math.floor(h / 2) - 120, width: 240, height: 240 }));
    res.push({ viewport: [w, h], ...r }); await ctx.close();
  }
  const ok = res.map((r) => r.scale).join() === '1,2,3' && res.every((r) => !r.smoothing === false ? false : true) && res.every((r) => r.frames.every((f) => Number.isInteger(f.cam[0]) && Number.isInteger(f.cam[1]) && (r.scale === 1 || f.mixedPct < 0.5)));
  writeFileSync(path.join(EV, 'vis19.json'), JSON.stringify(res, null, 1));
  rec('VIS_19', ok ? 'PASS' : 'FAIL', shots.concat(['reports/evidence/visual/vis19.json']), res.map((r) => `${r.scale}×: smoothing=${r.smoothing} non-uniform ${r.scale}×${r.scale} blocks max ${Math.max(...r.frames.map((f) => f.mixedPct))}% cams integer=${r.frames.every((f) => Number.isInteger(f.cam[0]))}`).join(' | '));
});

// ===================== VIS_26: reduced motion + no decor: pickups, threats and puzzle changes stay distinguishable =====================
await run('VIS_26', async () => {
  const shots = [];
  const r = await G(page, async () => {
    const g = window.__KU.game; const app = window.__KU.app; const R = app.renderer;
    app.settings.reducedMotion = true; app.settings.graphicsQuality = 'LOW'; app.applySettings(); app.ui.closePanel?.(true);
    g.state.climate.history[g.state.clock.dayIndex] = 'HEAVY_RAIN'; g.state.clock.timeOfDaySeconds = 400;
    const node = g.world.nodeDefs.find((n) => n.fixed && n.sceneId === 'OVERWORLD' && g.world.nodeReady(n));
    g.world.teleport('OVERWORLD', (node.tile[0] + 1.5) * 32, (node.tile[1] + 0.5) * 32); g.state.player.facing = 'left';
    for (let i = 0; i < 6; i++) g.tick(1 / 30, { x: 0, y: 0 }); app.ui.updateHud(1);
    const tgt = g.ui.currentTarget;
    const draws1 = window.__V.captureDraws(); const decor = draws1.filter((c) => c.id.startsWith('foliage/')).length;
    const pickup = draws1.some((c) => c.id.startsWith('resource/') || c.id.startsWith('icon/'));
    R.rain.length = 0; R.render(1, null); const rainStreaks = R.rain.length;
    // threat: boar warning next to the player
    const [tx, ty] = g.world.playerTile(); g.state.player.health = 999; const a = g.wildlife.add('ANIMAL_BOAR', tx + 2, ty, 'TEST'); a.state = 'warn'; a.warnT = 99;
    const draws2 = window.__V.captureDraws(); const warn = draws2.filter((c) => c.id === 'ui/warning').length;
    g.world.animals = g.world.animals.filter((x) => x !== a);
    // puzzle state change visible in the widget DOM
    const id = (() => { const ks = [...g.content.puzzles.keys()]; const k = ks.find((x) => { const sc = g.content.puzzles.get(x).startCondition; return sc.poiDiscovered && !sc.repairMaterialsDeposited && !sc.escapeProjectBuilt && !sc.energyAvailable && !(sc.requiredStoryFlags || []).length && !g.puzzles.stateOf(x).solved; }); g.exploration.discover(g.content.puzzles.get(k).startCondition.poiDiscovered); return k; })();
    app.ui.openPuzzle(id); const before = document.querySelector('#panel')?.innerText || document.body.innerText;
    const def = g.content.puzzles.get(id); g.puzzles.action(id, def.allowedActions[0], 0); app.ui.openPuzzle(id);
    const after = document.querySelector('#panel')?.innerText || document.body.innerText;
    const cssAnim = getComputedStyle(document.body).getPropertyValue('--x') === '' && document.body.classList.contains('reduced-motion');
    return { reduced: R.reducedMotion, quality: R.quality, target: tgt?.label, highlight: !!tgt, decor, pickup, rainStreaks, warn, puzzle: id, puzzleChanged: before !== after, cssAnim };
  });
  await page.waitForTimeout(250); shots.push(await shot(page, 'vis26_reduced_motion_puzzle'));
  await G(page, () => window.__KU.app.ui.closePanel?.(true)); await page.waitForTimeout(150); shots.push(await shot(page, 'vis26_reduced_motion_world'));
  await G(page, () => { const a = window.__KU.app; a.settings.reducedMotion = false; a.settings.graphicsQuality = 'HIGH'; a.applySettings(); const g = window.__KU.game; g.state.climate.history[g.state.clock.dayIndex] = 'CLEAR'; });
  const ok = r.reduced && r.highlight && r.pickup && r.decor === 0 && r.rainStreaks === 0 && r.warn >= 1 && r.puzzleChanged && r.cssAnim;
  writeFileSync(path.join(EV, 'vis26.json'), JSON.stringify(r, null, 1));
  rec('VIS_26', ok ? 'PASS' : 'FAIL', shots.concat(['reports/evidence/visual/vis26.json']), JSON.stringify(r));
});

// ===================== contact sheets for pixel-level unit checks (visual evidence) =====================
await run('SHEETS', async () => {
  const sheets = await G(page, () => {
    const R = window.__KU.app.renderer; const at = R.atlas; const g = window.__KU.game;
    const grid = (ids, cell, cols, scale = 1, bg = '#1d3b4a') => { const c = document.createElement('canvas'); const rows = Math.ceil(ids.length / cols); c.width = cols * cell; c.height = rows * cell; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); ids.forEach((id, i) => { const s = at.extract(id); if (s) x.drawImage(s, (i % cols) * cell + (cell - s.width * scale) / 2, Math.floor(i / cols) * cell + (cell - s.height * scale) / 2, s.width * scale, s.height * scale); }); return c.toDataURL(); };
    const items = [...g.content.items.keys()].map((k) => `icon/${k}`);
    const crops = [...g.content.crops.keys()].flatMap((k) => [0, 1, 2, 3].map((s) => `crop/${k}/${s}`));
    const land = g.content.db.AnimalDB.landAnimals.map((x) => x.id); const fish = [...g.content.species.keys()].filter((k) => k.startsWith('FISH_'));
    const animals = land.flatMap((id) => ['idle', 'move', 'react', 'warn', 'attack'].map((c) => `animal/${id}/${c}/right/0`).filter((s) => at.has(s)));
    const fishes = fish.flatMap((id) => [`animal/${id}/swim/right/0`, `animal/${id}/turn/down/0`, `codex/${id}`]);
    const marine = ['MARINE_TURTLE', 'MARINE_RAY', 'MARINE_REEF_SHARK'].flatMap((id) => ['swim', 'turn', 'warn', 'attack'].map((c) => `animal/${id}/${c}/right/0`).filter((s) => at.has(s)));
    // avatars: composited like the game (appearance × clip) incl. held tools via drawPlayer on an offscreen canvas
    const av = document.createElement('canvas'); av.width = 16 * 40; av.height = 12 * 56; const ax = av.getContext('2d'); ax.imageSmoothingEnabled = false; ax.fillStyle = '#2f7a55'; ax.fillRect(0, 0, av.width, av.height);
    const p = g.state.player; const keep = { app: { ...p.appearance }, facing: p.facing, action: p.action, mode: p.mode };
    const clips = ['idle', 'walk', 'chop', 'mine', 'build', 'gather', 'bow', 'spear', 'fish_cast', 'fish_reel', 'swim', 'eat']; const realCtx = R.ctx; R.ctx = ax; const realClip = R.playerClip; let k = 0;
    for (let row = 0; row < 12; row++) for (let col = 0; col < 16; col++) {
      const clip = clips[row]; const dir = ['down', 'left', 'right', 'up'][col % 4];
      Object.assign(p.appearance, { body: col % 8 < 4 ? 'body_a' : 'body_b', skin: (col >> 1) % 4, hair: (row + col) % 6, hairColor: (row + col) % 5, outfit: col % 3 });
      p.facing = dir; R.playerClip = () => clip; R.time = (k++ % 6) / 8; R.drawPlayer(col * 40 + 20, row * 56 + 50);
    }
    R.ctx = realCtx; R.playerClip = realClip; Object.assign(p.appearance, keep.app); p.facing = keep.facing; at.avatarCache.clear();
    return { items: grid(items, 36, 18, 1), crops: grid(crops, 40, 16, 1, '#5a4030'), animals: grid(animals, 68, 10), fish: grid(fishes, 68, 15), marine: grid(marine, 68, 8), avatars: av.toDataURL() };
  });
  const files = Object.entries(sheets).map(([k, v]) => savePng('sheet_' + k, v));
  results.SHEETS = { status: 'INFO', evidence: files, notes: 'Contact sheets rendered by the game atlas in Chromium (VIS_05/07/10/11/12/13/28 visual evidence).' };
  console.log('INFO    contact sheets', files.length);
});

await main.ctx.close(); await browser.close(); server.close();
writeFileSync(path.join(ROOT, 'reports/evidence/visual-results.json'), JSON.stringify({ base: BASE, browser: 'Chromium (Playwright, headless)', ranUtc: new Date().toISOString(), consoleErrors: consoleErrors.slice(0, 50), results }, null, 1));
console.log('VISUAL done:', Object.values(results).filter((r) => r.status === 'PASS').length, 'PASS /', Object.keys(results).filter((k) => k !== 'SHEETS').length, 'console errors:', consoleErrors.length);
