// tests/smoke/garage_save.mjs — Phase 05 browser test (dist, ?debug=1, real UI clicks + real page reloads).
// Garage 8×20 purchases, skin buy / free re-equip, persistence across reloads, HTML5 v1 migration at boot,
// A/B slot corruption recovery, storage write failure (rolled back + toast), reload during RunSummary pays nothing twice.
import { createRequire } from 'node:module';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(process.argv[2] || 'dist'), shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => { let p = q.url.split('?')[0]; if (p === '/') p = '/index.html'; const f = path.join(root, p);
  if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 412, height: 870 }, deviceScaleFactor: 2 }); const errs = [];
pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const url = `http://localhost:${srv.address().port}/?debug=1`;
const results = []; let fail = 0;
const check = (name, ok, detail = '') => { results.push(name); if (!ok) fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); };
const ev = (fn, a) => pg.evaluate(fn, a);
const shot = n => shots ? pg.screenshot({ path: path.join(shots, n + '.png') }) : null;
const boot = async () => { await pg.waitForFunction(() => window.__DR && window.__DR.UI.current === 'MainMenu' && !window.__DR.Scenes.transitioning, null, { timeout: 12000 }); };
const reload = async () => { await pg.reload(); await pg.waitForTimeout(150); const st = await ev(() => window.__DR && window.__DR.Save.loadStatus); await boot(); return st; };
const settle = () => pg.waitForFunction(() => !window.__DR.Scenes.transitioning).then(() => pg.waitForTimeout(150));
const nav = async id => { await pg.click(`[data-nav="${id}"]`); await settle(); };
const clickA = async sel => { await pg.locator(sel).first().click(); await pg.waitForTimeout(200); };

try {
  await pg.goto(url); await ev(() => localStorage.clear()); await pg.reload(); await boot();
  check('fresh profile: new v2 save', (await ev(() => window.__DR.Save.loadStatus)) === 'new');
  await ev(() => { const D = window.__DR; D.Save.data.coins = 2000; D.Save.write(); D.UI.refreshChrome && D.UI.refreshChrome(); });

  // ---- garage: buy each of the 8 categories through the UI ----
  await nav('Garage');
  const cats = await ev(() => [...document.querySelectorAll('[data-a="up"]')].map(b => b.dataset.id));
  check('Garage shows 8 live categories with upgrade buttons', cats.length === 8, cats);
  for (const id of cats) { await pg.locator(`[data-a="up"][data-id="${id}"]`).scrollIntoViewIfNeeded(); await clickA(`[data-a="up"][data-id="${id}"]`); }
  const g1 = await ev(() => ({ g: window.__DR.Save.data.garage, coins: window.__DR.Save.data.coins }));
  check('each category bought exactly one level, exact prices paid', Object.values(g1.g).every(v => v === 1) && g1.coins === 2000 - (110 + 100 + 120 + 150 + 130 + 110 + 100 + 150), g1);
  await shot('01_garage_8_categories');

  // ---- skins ----
  await clickA('[data-a="view"][data-v="skins"]');
  const skins = await ev(() => document.querySelectorAll('[data-a="preview"]').length);
  check('Skin Shop lists the 6 original skins', skins === 6);
  await clickA('[data-a="preview"][data-id="SKIN_COFFEE"]'); await clickA('[data-a="buy"]');
  let sk = await ev(() => ({ owned: window.__DR.Save.data.cosmetics.owned, sel: window.__DR.Save.data.cosmetics.selected, coins: window.__DR.Save.data.coins }));
  check('buy SKIN_COFFEE (500) equips it', sk.owned.includes('SKIN_COFFEE') && sk.sel === 'SKIN_COFFEE' && sk.coins === g1.coins - 500, sk);
  await shot('02_skin_shop_coffee');
  await clickA('[data-a="preview"][data-id="SKIN_DEFAULT"]'); await clickA('[data-a="equip"]');
  await clickA('[data-a="preview"][data-id="SKIN_COFFEE"]'); await clickA('[data-a="equip"]');
  const sk2 = await ev(() => ({ sel: window.__DR.Save.data.cosmetics.selected, coins: window.__DR.Save.data.coins }));
  check('re-equip is free', sk2.sel === 'SKIN_COFFEE' && sk2.coins === sk.coins);

  // ---- persistence across reload ----
  const st1 = await reload();
  const p1 = await ev(() => ({ g: window.__DR.Save.data.garage, sel: window.__DR.Save.data.cosmetics.selected, coins: window.__DR.Save.data.coins, meta: window.__DR.Save.meta }));
  check('reload: garage, skin and wallet persisted (A/B slot load)', st1 === 'loaded' || (await ev(() => window.__DR.Save.loadStatus)) === 'loaded', { st1 });
  check('reload values identical', Object.values(p1.g).every(v => v === 1) && p1.sel === 'SKIN_COFFEE' && p1.coins === sk2.coins && p1.meta.rev > 1, p1);

  // ---- storage failure: rolled back + toast ----
  await nav('Garage');
  await ev(() => { window.__origSet = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException('quota', 'QuotaExceededError'); }; });
  const c0 = await ev(() => window.__DR.Save.data.coins);
  await clickA('[data-a="up"][data-id="motor"]');
  const sf = await ev(() => ({ coins: window.__DR.Save.data.coins, motor: window.__DR.Save.data.garage.motor, toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join('|'), ok: window.__DR.Save.ok }));
  await ev(() => { Storage.prototype.setItem = window.__origSet; });
  check('storage failure: purchase rolled back, user warned, save untouched', sf.coins === c0 && sf.motor === 1 && /Kayıt yazılamadı/.test(sf.toast) && sf.ok === false, sf);
  await shot('03_save_failure_toast');
  await pg.waitForTimeout(300);
  const st2 = await reload(); const p2 = await ev(() => ({ coins: window.__DR.Save.data.coins, motor: window.__DR.Save.data.garage.motor }));
  check('after failure + reload: last valid save loaded unchanged', p2.coins === c0 && p2.motor === 1, { st2, ...p2 });

  // ---- corruption of the active slot -> recovered from the other revision ----
  const prevCoins = await ev(() => { const D = window.__DR; const before = D.Save.data.coins; D.Save.data.coins = before + 123; D.Save.write(); return before; });
  await ev(() => { const p = JSON.parse(localStorage.getItem('debug__dr2_ptr')); localStorage.setItem('debug__dr2_slot_' + p.slot, '{"schema":"deliverogue","v":2,"rev":1e9,"data":{"coins":999999}}'); });
  const st3 = await reload(); const p3 = await ev(() => window.__DR.Save.data.coins);
  check('corrupt active slot -> boot recovers the previous valid revision', st3 === 'recovered' && p3 === prevCoins, { st3, p3, prevCoins });

  // ---- reload during RunSummary: no duplicate reward ----
  await ev(() => { const D = window.__DR; D.Save.data.unlocked = 12; D.Save.write(); D.UI.go('FightScene', { chapter: 1 }); }); await settle();
  await clickA('#modal [data-a="begin"]'); await clickA('#modal [data-a="pickskill"]');
  await ev(() => { const D = window.__DR, G = D.G, w = G.world; G.player.x = w.pickup.x; G.player.y = w.pickup.y + 4; });
  await pg.waitForFunction(() => window.__DR.G.run.picked, null, { timeout: 5000 });
  await ev(() => { const D = window.__DR, G = D.G, d = G.world.drop; G.player.x = d.cx; G.player.y = d.cy; });
  await pg.waitForFunction(() => window.__DR.UI.current === 'RunSummary' && !window.__DR.Scenes.transitioning, null, { timeout: 10000 });
  const r1 = await ev(() => ({ coins: window.__DR.Save.data.coins, seq: window.__DR.Save.data.ledger.runSeq, run: JSON.stringify({ id: window.__DR.G.run.id, seq: window.__DR.G.run.seq }) }));
  await shot('04_run_summary_before_reload');
  const st4 = await reload();
  const r2 = await ev(r => { const D = window.__DR, o = JSON.parse(r.run); const fake = { id: o.id + '_x', seq: o.seq, ch: { n: 1, id: 'C01', coins: 60, fast: 45, mastery: [], timer: 60 }, n: 1, success: true, reason: null, mods: {}, stats: { kills: 0, eliteKills: 0, pkgPct: 1, time: 10 } };
    D.Progression.settle(fake); return { coins: D.Save.data.coins, seq: D.Save.data.ledger.runSeq }; }, r1);
  check('reload after RunSummary + re-settle of the same run sequence: no duplicate coins', st4 === 'loaded' && r2.coins === r1.coins && r2.seq === r1.seq, { r1, r2 });

  // ---- HTML5 v1 save migrated at boot ----
  await ev(() => { localStorage.clear(); localStorage.setItem('debug__deliverogue_save', JSON.stringify({ v: 1, level: 6, xp: 10, coins: 300, garage: { motor: 2, helmet: 1, jacket: 0, pos: 5 }, unlocked: 4, completed: [true, true, true], stars: [3, 3, 2], cosmetics: { owned: ['classic', 'barista', 'midnight'], selected: 'midnight' }, settings: { sfx: false } })); });
  await pg.reload(); await pg.waitForTimeout(400); const bootMsg = await ev(() => (document.querySelector('[data-step]') || {}).textContent || ''); await shot('05_boot_migration');
  await boot();
  const m = await ev(() => { const d = window.__DR.Save.data; return { st: window.__DR.Save.loadStatus, coins: d.coins, garage: d.garage, sel: d.cosmetics.selected, level: d.level, unlocked: d.unlocked, sfx: d.settings.sfx, src: d.legacy.source, backup: !!localStorage.getItem('debug__deliverogue_save_v1_backup') }; });
  check('HTML5 v1 save migrated at boot (progress, garage, settings kept; legacy skins refunded 350+450; backup)', m.st === 'migrated' && m.coins === 1100 && m.garage.pos === 5 && m.garage.bag === 0 && m.sel === 'SKIN_DEFAULT' && m.level === 6 && m.unlocked === 4 && m.sfx === false && m.src === 'html5_v1' && m.backup, m);
  check('boot shows the migration notice', /taşındı/.test(bootMsg), bootMsg);
  await nav('Settings'); await pg.evaluate(() => { const l = document.querySelector('.st-list'); l.scrollTop = l.scrollHeight; }); await pg.waitForTimeout(200); await shot('06_settings_save_info');
  check('Settings shows save revision / source / refund', await ev(() => /revizyonu/.test(document.querySelector('.st-list').textContent) && /HTML5/.test(document.querySelector('.st-list').textContent)));
  const st5 = await reload(); check('second boot does not migrate again (no second refund)', st5 === 'loaded' && (await ev(() => window.__DR.Save.data.coins)) === 1100);
  check('no console/page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
} catch (e) { check('aborted', false, e.stack); }
console.log(`\n${results.length - fail}/${results.length} passed`);
await b.close(); srv.close(); process.exit(fail ? 1 : 0);
