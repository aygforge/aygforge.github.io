// tests/smoke/coffee_runtime.mjs — Phase 04 engine harness (dist build, ?debug=1). Drives the REAL simulation with
// Game.update(1/60) while the RAF loop idles on MainMenu. Steering = the game's own flow field toward the active
// target (pickup, then each drop in order) written to the joystick vector; firing = held fire input.
// Debug-only helpers: invulnerability for the traversal sweep, teleport for focused boss / package / drop tests.
import { createRequire } from 'node:module';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(process.argv[2] || 'dist'), jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => { let p = q.url.split('?')[0]; if (p === '/') p = '/index.html'; const f = path.join(root, p);
  if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch(); const pg = await b.newPage(); const errs = [];
pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto(`http://localhost:${srv.address().port}/?debug=1`); await pg.evaluate(() => localStorage.clear()); await pg.reload();
await pg.waitForFunction(() => window.__DR && window.__DR.UI.current === 'MainMenu' && !window.__DR.Scenes.transitioning, null, { timeout: 10000 });

const res = await pg.evaluate(() => {
  const D = window.__DR, G = D.G, out = { checks: [], sweep: [] };
  const check = (name, ok, detail = '') => out.checks.push({ name, ok: !!ok, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  const fresh = () => { D.Save.reset(); D.Save.data.unlocked = 12; };
  function start(n, opts = {}, rc = null) { D.Save.data.unlocked = 12; if (rc != null) D.Save.data.runCounter = rc; const r = D.Game.start(n, opts); r.state = 'play'; return r; }
  function pickAll(r) { let g = 0; while (r.state === 'pick' && g++ < 20) D.Game.choose(r.offer[0]); }
  /** Play with steering until terminal or maxSec. Returns the run. */
  function play(r, { fire = true, inv = false, maxSec = 400 } = {}) {
    let steps = 0;
    while (!r.ended && steps++ < maxSec * 60) {
      if (r.state === 'pick') { pickAll(r); continue; }
      const p = G.player, f = D.Nav.flowDir(r.picked ? G.world.dropField : G.world.pickField, p.x, p.y) || { x: 0, y: -1 };
      D.Input.enabled = true; D.Input.joy.dx = f.x; D.Input.joy.dy = f.y; D.Input.fire.key = fire;
      if (inv) { p.inv = 1e9; p.pkgInv = 1e9; }
      D.Game.update(1 / 60);
    }
    for (let i = 0; i < 200 && r.state === 'ending'; i++) D.Game.update(1 / 60);
    D.Input.fire.key = false; D.Input.joy.dx = D.Input.joy.dy = 0;
    return r;
  }
  // level-up choices are resolved like a player would (first offered option)
  const tick = (sec, fn) => { for (let i = 0; i < Math.round(sec * 60); i++) { if (G.run && G.run.state === 'pick') pickAll(G.run); if (fn) fn(); D.Input.enabled = true; D.Game.update(1 / 60); } };
  const pickup = r => { const w = G.world, p = G.player; p.x = w.pickup.x; p.y = w.pickup.y + 4; D.Game.update(1 / 60); return r.picked; };
  const tp = (x, y) => { G.player.x = x; G.player.y = y; G.player.vx = G.player.vy = 0; };

  // ---------- 1) playability sweep: all 12 chapters, real geometry, steering + held fire (invulnerable) ----------
  fresh();
  for (let n = 1; n <= 12; n++) for (const rc of n >= 4 ? [700, 701, 702] : [700]) {
    const r = start(n, {}, rc); D.Game.beginPicks(); pickAll(r); r.state = 'play';
    play(r, { inv: true });
    const row = { ch: n, rc, ok: r.success, reason: r.reason, time: +r.time.toFixed(1), timer: r.timer, drops: `${r.stats.drops}/${r.stats.dropsTotal}`, variants: G.world.variants.join(''), level: r.level, picks: r.skills.length + r.evos.length, boss: r.boss ? r.boss.state : '-', bossT: r.boss ? +(90 - r.boss.time).toFixed(1) : null, xp: Object.fromEntries(Object.entries(r.xpLog).map(([k, v]) => [k, Math.round(v)])) };
    out.sweep.push(row);
  }
  check('all 12 Coffee chapters deliverable (sweep incl. 3 variant seeds for C4–C12)', out.sweep.every(x => x.ok), out.sweep.filter(x => !x.ok));
  check('multi-drop chapters complete every drop in order', out.sweep.filter(x => x.ch === 7 || x.ch === 11).every(x => x.drops === '2/2'));
  check('C12: boss defeated before final delivery', out.sweep.filter(x => x.ch === 12).every(x => x.boss === 'dead'));
  check('variants differ between seeds for combat chapters', new Set(out.sweep.filter(x => x.ch === 9).map(x => x.variants)).size > 1, out.sweep.filter(x => x.ch === 9).map(x => x.variants));
  // no kill gate + route-only XP: never fire, C1–C11
  const noFire = []; for (let n = 1; n <= 11; n++) { const r = start(n, {}, 800); D.Game.beginPicks(); pickAll(r); r.state = 'play'; play(r, { fire: false, inv: true }); noFire.push({ n, ok: r.success, shots: r.shots, hazardKills: r.stats.kills, picks: r.skills.length + r.evos.length }); }
  check('no kill gate: C1–C11 delivered without firing a single card', noFire.every(x => x.ok && x.shots === 0), noFire.filter(x => !x.ok || x.shots));
  check('route-only Run XP gives extra picks (picks > start picks)', noFire.every(x => x.picks > (x.n <= 3 ? 1 : 2)), noFire.map(x => x.n + ':' + x.picks));
  // determinism: same seed + config => same geometry / spawns
  { const a = start(9, {}, 900), ga = Array.from(G.world.tile).join(''), sa = G.enemies.map(e => Math.round(e.x) + ',' + Math.round(e.y)).join(';'); D.Game.quit();
    const b2 = start(9, {}, 900), gb = Array.from(G.world.tile).join(''), sb = G.enemies.map(e => Math.round(e.x) + ',' + Math.round(e.y)).join(';'); void a; void b2;
    check('same seed + config version => identical geometry and spawns', ga === gb && sa === sb); }

  // ---------- 2) boss arena (real fight logic, focused) ----------
  fresh();
  { const r = start(12); pickup(r); const w = G.world, A = w.arena, B = r.boss;
    check('C12 boss exists, idle and untargetable before the arena', B && B.state === 'idle' && B.e.state === 'dormant');
    tp(A.cx, A.bottom + 30); tick(0.1); check('outside arena: entry gate open', !w.block[w.gates.entry[0]] && w.block[w.gates.exit[0]] === 1);
    const t0 = r.time; tp(A.cx, A.bottom - 30); tick(0.1);
    check('entering closes the entry gate, boss intro starts', B.state === 'intro' && w.block[w.gates.entry[0]] === 1);
    const hp0 = B.e.hp; D.Game.update(1 / 60); G.player.target = B.e; for (let i = 0; i < 30; i++) { D.Input.enabled = true; D.Input.fire.key = true; D.Game.update(1 / 60); }
    check('boss immune during intro roar', B.e.hp === hp0);
    tick(2.0); const t1 = r.time, bt = B.time;
    check('delivery timer frozen in arena, boss timer running', Math.abs(t1 - t0) < 0.02 && bt < 90 && B.state === 'fight', { t0, t1, bt });
    // attacks telegraph & hit: stand still, invulnerability off
    const seen = new Set(); let hits = 0, h = G.player.hp; G.player.hp = G.player.maxHp = 5000; h = 5000;
    for (let i = 0; i < 60 * 14; i++) { if (r.state === 'pick') pickAll(r); D.Input.enabled = true; D.Game.update(1 / 60); if (B.atk) seen.add(B.atk.base + ':' + B.atk.stage); if (G.player.hp < h) { hits++; h = G.player.hp; } }
    check('phase 1 attacks telegraph (warn -> active -> recover) and land', ['breath', 'steam', 'rain'].filter(k => seen.has(k + ':warn')).length >= 2 && hits >= 1, { seen: [...seen], hits });
    // phase thresholds (debug: HP set just below the threshold, then the boss tick reacts)
    const dealTo = frac => { B.e.hp = Math.floor(B.e.maxHp * frac); D.Game.update(1 / 60); };
    dealTo(0.69); tick(0.1); check('phase 2 at 70 % (immune roar, phase reset)', B.phase === 1 && B.e.invuln > 0);
    tick(1.4); let helpers = 0; for (let i = 0; i < 60 * 12; i++) { if (r.state === 'pick') pickAll(r); D.Input.enabled = true; D.Game.update(1 / 60); helpers = Math.max(helpers, G.enemies.filter(x => x.helper && !x.dead).length); }
    check('phase 2 helpers spawn with active cap <= 4', helpers >= 1 && helpers <= 4, { helpers });
    const k0 = r.stats.kills, x0 = r.xpLog.combat; G.enemies.filter(x => x.helper && !x.dead).forEach(x => { x.hp = 1; }); const hx = G.enemies.find(x => x.helper && !x.dead);
    if (hx) { G.player.target = hx; for (let i = 0; i < 120 && !hx.dead; i++) { D.Input.enabled = true; D.Input.fire.key = true; D.Game.update(1 / 60); } }
    check('helper kills give no XP and no kill stats', r.stats.kills === k0 && r.xpLog.combat === x0, { kills: r.stats.kills - k0, xp: r.xpLog.combat - x0 });
    dealTo(0.29); tick(0.1); check('phase 3 at 30 %', B.phase === 2);
    let ph3 = new Set(); for (let i = 0; i < 60 * 10; i++) { if (r.state === 'pick') pickAll(r); D.Input.enabled = true; D.Game.update(1 / 60); if (B.atk) ph3.add(B.atk.kind); }
    check('phase 3 uses its own patterns', [...ph3].some(k => ['sweep', 'steam3', 'breath'].includes(k)), [...ph3]);
    const evs = []; const off = D.Bus.on('BOSS_DEFEATED', e => evs.push(e));
    G.enemies.forEach(x => { if (x.helper) { x.dead = true; x.hp = 0; } }); B.e.invuln = 0; B.e.hp = 5; tp(B.e.x, B.e.y + 90);
    for (let i = 0; i < 600 && B.state !== 'dead'; i++) { if (r.state === 'pick') pickAll(r); B.e.invuln = 0; tp(B.e.x, B.e.y + 90); D.Input.enabled = true; D.Input.fire.key = true; D.Game.update(1 / 60); } D.Input.fire.key = false;
    tick(0.5); off();
    check('boss death by a real card hit: single event, exit gate opens, helpers removed', B.state === 'dead' && evs.length === 1 && !w.block[w.gates.exit[0]] && !G.enemies.some(x => x.helper && !x.dead), { evs: evs.length, state: B.state });
    check('delivery timer resumes after the boss', (() => { const a = r.time; tick(0.5); return r.time > a; })());
    const d = w.drops[w.drops.length - 1]; tp(d.cx, d.cy); tick(0.2); for (let i = 0; i < 200 && r.state === 'ending'; i++) D.Game.update(1 / 60);
    check('boss + delivery = success; first boss reward once; episode complete', r.success && r.settled.bossFirst === 400 && D.Save.data.bossClears.COF && D.Save.data.episodes.coffee, r.settled);
    const r2 = start(12); pickup(r2); r2.boss.e.hp = 1; r2.boss.state = 'fight'; r2.boss.e.state = 'fight'; G.world.gates.entry.forEach(i => { G.world.block[i] = 1; }); tp(G.world.arena.cx, G.world.arena.bottom - 40);
    for (let i = 0; i < 600 && r2.boss.state !== 'dead'; i++) { if (r2.state === 'pick') pickAll(r2); tp(r2.boss.e.x, r2.boss.e.y + 90); D.Input.enabled = true; D.Input.fire.key = true; D.Game.update(1 / 60); } D.Input.fire.key = false;
    const dd = G.world.drops[G.world.drops.length - 1]; tp(dd.cx, dd.cy); tick(0.1); for (let i = 0; i < 200 && r2.state === 'ending'; i++) D.Game.update(1 / 60);
    check('replay: no second first-clear boss reward', r2.success && !r2.settled.bossFirst);
  }
  { const r = start(12); pickup(r); const A = G.world.arena; tp(A.cx, A.bottom - 30); tick(0.1); G.player.inv = 1e9; r.boss.time = 1; tick(1.2);
    check('boss timer 0 => fail (bossTime), no reward', r.ended && !r.success && r.reason === 'bossTime'); }
  { const r = start(12); pickup(r); const d = G.world.drops[G.world.drops.length - 1]; tp(d.cx, d.cy); tick(0.2);
    check('cannot reach / deliver past a closed exit gate before the boss', !r.ended && G.world.block[G.world.gates.exit[0]] === 1); D.Game.quit(); }

  // ---------- 3) packages ----------
  fresh();
  const P = D.Data.PACKAGES, ids = Object.keys(P);
  check('12 package types', ids.length === 12, ids);
  { const rows = []; for (const id of ids.filter(x => x !== 'MYSTERY_ORDER')) { const r = start(1, { pkg: id }); rows.push([id, G.player.pkgMax === P[id].hp, Math.abs(G.player.speed / (85 * P[id].speedMul) - 1) < 1e-6]); D.Game.quit(); }
    check('package HP and speed modifiers applied', rows.every(x => x[1] && x[2]), rows.filter(x => !x[1] || !x[2])); }
  { const r = start(1, { pkg: 'HOT_ORDER' }); tick(1); const before = r.pkgState.temp; pickup(r); tick(5); const t5 = r.pkgState.temp; r.paused = true; tick(3); const tp3 = r.pkgState.temp; r.paused = false;
    check('HOT: rule only after pickup, decays on simulation time, frozen while paused', before === 1 && t5 < 1 && tp3 === t5, { before, t5, tp3 });
    G.player.inv = 1e9; let g = 0; while (!r.ended && g++ < 60 * 300) { r.time = Math.min(r.time, 1); D.Input.enabled = true; D.Game.update(1 / 60); }
    check('HOT: below 25 % => fail (cold)', r.reason === 'cold', r.reason); }
  { const r = start(1, { pkg: 'FROZEN_ORDER' }); pickup(r); const c0 = r.pkgState.cold; G.player.inv = 0; D.Game.hurtPlayer(5, { pkg: 3, steam: true }); const c1 = r.pkgState.cold;
    check('FROZEN: steam contact melts faster', c0 - c1 > 0.1, { c0, c1 }); r.pkgState.cold = 0.21; G.player.inv = 1e9; tick(2); check('FROZEN: below 20 % => fail (melt)', r.reason === 'melt'); }
  { const r = start(1, { pkg: 'FIZZY_ORDER' }); pickup(r); G.player.inv = 0; G.player.pkgInv = 0; D.Game.hurtPlayer(0, { pkg: 1, impact: true }); const p1 = r.pkgState.pressure;
    tick(3); const p2 = r.pkgState.pressure;
    check('FIZZY: impact raises pressure, calm driving lowers it', p1 > 0.15 && p2 < p1, { p1, p2 });
    r.pkgState.pressure = 0.99; G.player.pkgInv = 0; D.Game.hurtPlayer(0, { pkg: 1, impact: true }); tick(0.1); check('FIZZY: 100 % => burst', r.reason === 'burst'); }
  { const r = start(1, { pkg: 'VIP_ORDER' }); pickup(r); G.player.pkgHp = 70; const d = G.world.drop; tp(d.cx, d.cy); tick(0.1); check('VIP: delivery under 80 % => fail (vip)', r.reason === 'vip');
    const r2 = start(1, { pkg: 'VIP_ORDER' }); pickup(r2); G.player.pkgHp = 85; const d2 = G.world.drop; tp(d2.cx, d2.cy); tick(0.1); for (let i = 0; i < 200 && r2.state === 'ending'; i++) D.Game.update(1 / 60);
    check('VIP: delivery at 85 % succeeds with +75 % package reward', r2.success && r2.settled.pkgBonus === Math.round(r2.ch.coins * 0.75), r2.settled && r2.settled.pkgBonus); }
  { const bonus = {}; for (const id of ['XL_ORDER', 'PREMIUM_ORDER', 'HOT_ORDER', 'STANDARD_ORDER']) { const r = start(1, { pkg: id }); pickup(r); const d = G.world.drop; tp(d.cx, d.cy); tick(0.1); for (let i = 0; i < 200 && r.state === 'ending'; i++) D.Game.update(1 / 60); bonus[id] = r.settled ? r.settled.pkgBonus : `${r.state}/${r.reason}/${r.picked}/${Math.round(G.player.y)}`; }
    check('reward multipliers XL +25 % / PREMIUM +50 % / HOT +20 % / STANDARD 0', bonus.XL_ORDER === 15 && bonus.PREMIUM_ORDER === 30 && bonus.HOT_ORDER === 12 && bonus.STANDARD_ORDER === 0, bonus); }
  { const r = start(1, { pkg: 'REINFORCED_ORDER' }); pickup(r); G.player.pkgInv = 0; const a = G.player.pkgHp; D.Game.hurtPlayer(0, { pkg: 10 }); check('REINFORCED: hazard package damage -30 %', a - G.player.pkgHp === 7, a - G.player.pkgHp); D.Game.quit(); }
  { const r = start(1, { pkg: 'PREMIUM_ORDER' }); pickup(r); G.player.pkgInv = 0; const a = G.player.pkgHp; D.Game.hurtPlayer(0, { pkg: 10 }); check('PREMIUM: package damage +20 %', a - G.player.pkgHp === 12, a - G.player.pkgHp); D.Game.quit(); }
  // Mystery: fixed per attempt, never Mystery, rerolled only after a real terminal result
  { fresh(); const key = 'campaign:COF:C05';
    const r1 = start(5, { pkg: 'MYSTERY_ORDER' }); const rule1 = r1.pkg.ruleId; D.Game.quit(); D.Progression.settle(Object.assign(r1, { reason: 'quit', success: false, id: 'q1', stats: r1.stats }));
    const r2 = start(5, { pkg: 'MYSTERY_ORDER' }); const rule2 = r2.pkg.ruleId, att2 = D.Save.data.mysteries[key].attempt;
    check('MYSTERY: rule is a real package rule (not Mystery), same after abort / reopen', D.Data.MYSTERY_POOL.includes(rule1) && rule1 === rule2 && r2.pkg.reward === 1.4, { rule1, rule2 });
    pickup(r2); G.player.hp = 0; tick(0.1); for (let i = 0; i < 200 && r2.state === 'ending'; i++) D.Game.update(1 / 60);
    const r3 = start(5, { pkg: 'MYSTERY_ORDER' }); const att3 = D.Save.data.mysteries[key].attempt;
    check('MYSTERY: a real terminal result opens a new attempt', att3 === att2 + 1, { att2, att3, rule3: r3.pkg.ruleId }); D.Game.quit();
    const finals = new Set(); for (let i = 1; i <= 40; i++) { delete D.Save.data.mysteries['campaign:COF:C12']; const r = start(12, { pkg: 'MYSTERY_ORDER' }); finals.add(r.pkg.ruleId); D.Game.quit(); }
    check('MYSTERY on a boss final never resolves to Hot/Frozen/Fizzy/VIP', [...finals].every(x => !D.Data.FINAL_FORBIDDEN.includes(x)), [...finals]); }

  // ---------- 4) multi-drop order ----------
  fresh();
  { const r = start(7); pickup(r); const w = G.world, fin = w.drops[1], mid = w.drops[0];
    tp(fin.cx, fin.cy); tick(0.1); check('multi-drop: final customer does not accept before the first drop', !r.ended && r.stats.drops === 0);
    tp(mid.cx, mid.cy); tick(0.1); const x1 = r.xpLog.drop; tick(0.3); tp(mid.cx, mid.cy); tick(0.1);
    check('multi-drop: first drop completes once (XP once), active target advances', r.stats.drops === 1 && x1 > 0 && r.xpLog.drop === x1 && w.drop === fin);
    tp(fin.cx, fin.cy); tick(0.1); for (let i = 0; i < 200 && r.state === 'ending'; i++) D.Game.update(1 / 60);
    check('multi-drop: success only after every drop', r.success && r.stats.drops === 2); }
  D.Game.quit(); G.run = null; D.Save.reset();
  return out;
});
let fail = 0; for (const c of res.checks) { console.log((c.ok ? 'PASS ' : 'FAIL ') + c.name + (c.detail && (!c.ok || c.detail.length < 160) ? ' — ' + c.detail : '')); if (!c.ok) fail++; }
console.log('\nsweep:'); for (const x of res.sweep) console.log(`  C${String(x.ch).padStart(2, '0')} seed${x.rc} var=${x.variants} ${x.ok ? 'OK ' : 'FAIL ' + x.reason} t=${x.time}/${x.timer}s drops=${x.drops} lvl=${x.level} picks=${x.picks}${x.boss !== '-' ? ' boss=' + x.boss + ' ' + x.bossT + 's' : ''}`);
console.log(errs.length ? 'FAIL console errors: ' + errs.slice(0, 3).join(' | ') : 'PASS no console errors'); if (errs.length) fail++;
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(res, null, 1));
console.log(`\n${res.checks.length + 1 - fail}/${res.checks.length + 1} passed`);
await b.close(); srv.close(); process.exit(fail ? 1 : 0);
