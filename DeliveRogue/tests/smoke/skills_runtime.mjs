// tests/smoke/skills_runtime.mjs — drives the REAL engine (dist build, ?debug=1) step by step to verify that
// every skill and evolution runs, and that key mechanics have their effect. Debug-only harness: it places
// three enemies in front of the courier, makes the courier invulnerable, holds the fire input and calls
// Game.update(1/60) directly (the RAF loop is idle on MainMenu, so nothing double-steps).
import { createRequire } from 'node:module';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(process.argv[2] || 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => { let p = q.url.split('?')[0]; if (p === '/') p = '/index.html'; const f = path.join(root, p);
  if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch(); const pg = await b.newPage(); const errs = [];
pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto(`http://localhost:${srv.address().port}/?debug=1`); await pg.evaluate(() => localStorage.clear()); await pg.reload();
await pg.waitForFunction(() => window.__DR && window.__DR.UI.current === 'MainMenu' && !window.__DR.Scenes.transitioning, null, { timeout: 10000 });

const res = await pg.evaluate(async () => {
  const D = window.__DR, out = { checks: [], all: [] };
  const check = (name, ok, detail = '') => out.checks.push({ name, ok: !!ok, detail });
  /** Fresh deterministic run on chapter n with the given skills/evos applied through the engine. */
  function setup(n, skills = [], evos = [], { hp = 800, spread = 18 } = {}) {
    D.Save.data.unlocked = 12; D.Save.data.runCounter = 500;
    const run = D.Game.start(n); run.state = 'play'; run.picked = true;
    const p = D.G.player; p.inv = 1e9; p.pkgInv = 1e9;
    for (const id of skills) { run.offer = [id]; run.state = 'pick'; run.picksLeft = 1; D.Game.choose(id); }
    for (const id of evos) { run.offer = [id]; run.state = 'pick'; run.picksLeft = 1; D.Game.choose(id); }
    run.state = 'play';
    // three enemies in a tight cluster ahead of the courier, everything else removed
    const es = D.G.enemies.filter(e => !e.d.elite && e.ai !== 'mimic').slice(0, 3);
    D.G.enemies = es; es.forEach((e, i) => { e.idx = i; e.x = p.x + (i - 1) * spread; e.y = p.y - 70 - (i === 1 ? 0 : 4); e.hp = e.maxHp = hp; e.active = true; e.state = 'recover'; e.t = 1e9; e.d = Object.assign({}, e.d, { speed: 0, dmg: 0 }); e.dead = false; e.slowT = 0; e.burn = e.poison = null; });
    return run;
  }
  function step(sec, fire = true) {
    for (let i = 0; i < Math.round(sec * 60); i++) { D.Input.enabled = true; D.Input.fire.key = fire; D.G.player.inv = 1e9; D.Game.update(1 / 60); }
    D.Input.fire.key = false;
  }
  const dmgDone = () => D.G.enemies.reduce((a, e) => a + (e.maxHp - Math.max(0, e.hp)), 0);
  const hitCount = () => D.G.enemies.filter(e => e.hp < e.maxHp).length;
  const finite = () => { const p = D.G.player; return [p.hp, p.maxHp, p.dmg, p.speed, p.interval, p.range].every(Number.isFinite) && D.G.enemies.every(e => Number.isFinite(e.hp)); };

  // baseline
  setup(1); step(3); const base = { dmg: dmgDone(), hits: hitCount(), shots: D.G.run.shots };
  check('baseline: manual fire hits the cluster', base.dmg > 0 && base.shots >= 4, JSON.stringify(base));

  // ---- targeted mechanics ----
  setup(1, ['power_transaction']); step(3); check('Power Transaction +15% damage', dmgDone() > base.dmg * 1.1, `${dmgDone()} vs ${base.dmg}`);
  setup(1, ['extended_signal']); check('Extended Signal +15% range', Math.abs(D.G.player.range - 172 * 1.15) < 0.01);
  setup(1, ['rapid_payment']); step(3); check('Rapid Payment more shots', D.G.run.shots > base.shots, `${D.G.run.shots} vs ${base.shots}`);
  setup(1, ['overcharged_pos']); step(3.2); check('Overcharged POS: 5th shot bonus raises damage', dmgDone() > base.dmg, `${dmgDone()} vs ${base.dmg}`);
  setup(1, ['explosive_card']); step(3); check('Explosive Card damages neighbours', hitCount() > base.hits, `${hitCount()} vs ${base.hits}`);
  setup(1, ['electric_card']); step(4); check('Electric Card chains to other enemies', hitCount() > base.hits);
  setup(1, ['frozen_payment']); step(1); check('Frozen Payment slows the target', D.G.enemies.some(e => e.slowT > 0));
  setup(1, ['frozen_payment', 'frostbite']); step(1); check('Frostbite extends slow (>1.6s)', D.G.enemies.some(e => e.slowT > 1.65));
  setup(1, ['burning_receipt']); step(3); check('Burning Receipt adds DoT damage', dmgDone() > base.dmg && D.G.enemies.some(e => e.burn));
  { setup(1, ['burning_receipt', 'flame_burst'], [], { hp: 40 }); step(1.5); const killed = D.G.enemies.filter(e => e.dead).length; check('Flame Burst: burning kill damages neighbours', killed >= 1 && hitCount() >= 2, `killed ${killed}, hit ${hitCount()}`); }
  { setup(1, ['toxic_payment', 'venom_spread'], [], { hp: 30 }); step(1.2); check('Venom Spread: poisoned death spreads poison', D.G.enemies.some(e => e.dead) && D.G.enemies.some(e => !e.dead && e.poison), JSON.stringify(D.G.enemies.map(e => [e.dead, !!e.poison]))); }
  { setup(1, ['heavy_armor', 'heavy_armor']); const p = D.G.player; p.inv = 0; const h0 = p.hp; D.Game.hurtPlayer(20, {}); check('Heavy Armor ×2: -20% courier damage', h0 - p.hp === 16, `${h0 - p.hp}`); }
  { setup(1, ['last_stand']); const p = D.G.player; p.hp = 20; p.inv = 0; D.Game.hurtPlayer(20, {}); check('Last Stand: extra 20% reduction below 25% HP', 20 - p.hp === 16, `${20 - p.hp}`); }
  { const r = setup(1, ['time_extension']); check('Time Extension +8s once', r.timer === 68); }
  { const r = setup(1, ['second_choice']); check('Second Choice +1 reroll', r.rerolls === 2); }
  { const r = setup(1, ['fast_learner']); const x0 = r.xp; D.Game.addXp(10, 'route'); check('Fast Learner +15% XP from now on', Math.abs(r.xp - x0 - 11.5) < 1e-6); }
  { const r = setup(7); const cp = D.G.world.checkpoint; const p = D.G.player; p.x = cp.x; p.y = cp.y - 4; step(0.1, false); check('Checkpoint: heal + Run XP, no extra skill pick', cp.used && r.xpLog.cp > 0 && r.state === 'play', JSON.stringify(r.xpLog)); }
  { const r = setup(7, ['first_aid_kit', 'package_repair', 'checkpoint_boost']); const p = D.G.player; p.hp = 20; p.pkgHp = 40; const cp = D.G.world.checkpoint; p.x = cp.x; p.y = cp.y - 4; step(0.1, false);
    check('First Aid / Package Repair / Checkpoint Boost at checkpoint', p.hp >= 20 + 15 + Math.floor(p.maxHp * 0.15) - 1 && p.pkgHp >= 40 + p.pkgMax * 0.15 - 0.01 && r.cpBoostT > 4, `hp ${p.hp} pkg ${p.pkgHp} boost ${r.cpBoostT.toFixed(2)}`); }
  { const r = setup(1, ['golden_receipt']); const p = D.G.player; D.Game.endRun(true, null); check('Golden Receipt: +15% base coin on success settle', r.settled && r.settled.skillBonus === Math.round(r.ch.coins * 0.15), JSON.stringify({ sb: r.settled && r.settled.skillBonus })); void p; }
  { const r = setup(1, ['golden_receipt']); D.Game.endRun(false, 'hp'); check('Economy skill pays nothing on failure', r.settled && !r.settled.skillBonus); }
  { setup(1, ['double_order', 'double_order', 'rapid_payment', 'rapid_payment'], ['payment_storm']); const iv = D.G.player.interval; check('Payment Storm: interval -15% and full-damage extra cards', Math.abs(iv - 0.6 / 1.5 * 0.85) < 1e-6 && D.G.run.mods.extraMul === 1); }
  { setup(1, ['piercing_card', 'ricochet'], ['infinity_receipt']); step(3); check('Infinity Receipt: cards pierce/bounce through the cluster', hitCount() === 3); }
  { setup(1, ['reinforced_helmet', 'reinforced_helmet', 'heavy_armor', 'heavy_armor'], ['iron_courier']); const p = D.G.player; check('Iron Courier: +40 max HP & DR within cap', p.maxHp === 100 + 50 + 40 && p.dr <= 0.8 && p.dr >= 0.3, `${p.maxHp} ${p.dr}`); }

  // ---- every skill + every evolution runs in the engine (prereqs/context satisfied) ----
  const { SKILLS, EVOLUTIONS, SKILL_BY_ID } = D.Data;
  const chapterFor = id => (SKILL_BY_ID[id] && SKILL_BY_ID[id].req === 'checkpoint') ? 7 : 1;
  const withPrereq = id => { const s = SKILL_BY_ID[id], l = []; if (s.prereq) l.push(s.prereq); for (let i = 0; i < s.max; i++) l.push(id); return l; };
  let okSkills = 0, okEvos = 0; const bad = [];
  for (const s of SKILLS) {
    try { const n = chapterFor(s.id); if (s.req === 'boss' || s.req === 'thermal' || s.req === 'fizzy') { D.Save.data.unlocked = 12; D.Save.data.runCounter = 500; D.Game.start(1); D.G.run.state = 'play'; D.SkillMgr.apply(D.G.run, s.id); } else setup(n, withPrereq(s.id));
      const before = JSON.stringify(D.SkillMgr.compute([], [])), after = JSON.stringify(D.G.run.mods);
      step(1.5); if (before === after) throw new Error('no modifier change'); if (!finite()) throw new Error('non-finite state'); okSkills++;
    } catch (e) { bad.push(s.id + ': ' + e.message); }
  }
  for (const ev of EVOLUTIONS) {
    try {
      const list = [...new Set([...withPrereq(ev.a), ...withPrereq(ev.b)])].flatMap(id => id === ev.a || id === ev.b ? Array(SKILL_BY_ID[id].max).fill(id) : [id]);
      const uniq = []; const cnt = {}; list.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; if (cnt[id] <= SKILL_BY_ID[id].max) uniq.push(id); });
      D.Save.data.unlocked = 12; D.Save.data.runCounter = 500; D.Game.start(7); const run = D.G.run; run.state = 'play'; run.picked = true; D.G.player.inv = 1e9;
      uniq.forEach(id => { run.skills.push(id); }); run.mods = D.SkillMgr.compute(run.skills, run.evos); D.Game.recalc();
      const m0 = JSON.stringify(run.mods); D.SkillMgr.apply(run, ev.id);
      if (!run.evos.includes(ev.id)) throw new Error('not applied'); if (JSON.stringify(run.mods) === m0) throw new Error('no modifier change');
      step(1.5); if (!finite()) throw new Error('non-finite'); okEvos++;
    } catch (e) { bad.push(ev.id + ': ' + e.message); }
  }
  check(`all 60 skills run in the engine (${okSkills}/60)`, okSkills === 60, bad.filter(x => SKILL_BY_ID[x.split(':')[0]]).join(' | '));
  check(`all 20 evolutions apply + run (${okEvos}/20)`, okEvos === 20, bad.filter(x => !SKILL_BY_ID[x.split(':')[0]]).join(' | '));
  // proc budget: worst-case proc build cannot exceed the per-window cap
  { setup(1, ['electric_card', 'static_charge', 'thunder_strike', 'explosive_card', 'overcharged_pos', 'piercing_card', 'ricochet', 'double_order', 'double_order', 'diagonal_delivery'], ['thunder_network', 'atomic_payment', 'chain_reaction'], { hp: 5000, spread: 10 });
    let maxN = 0; for (let i = 0; i < 300; i++) { D.Input.enabled = true; D.Input.fire.key = true; D.Game.update(1 / 60); maxN = Math.max(maxN, D.G.run.procN); }
    check('proc budget bounded under a worst-case chain build', maxN <= D.Game.CAPS.procPerWindow && finite(), 'max procs/window ' + maxN); }
  D.Game.quit(); D.G.run = null;
  return out;
});
let fail = 0; for (const c of res.checks) { console.log((c.ok ? 'PASS ' : 'FAIL ') + c.name + (c.detail ? ' — ' + c.detail : '')); if (!c.ok) fail++; }
console.log(errs.length ? 'FAIL console errors: ' + errs.slice(0, 3).join(' | ') : 'PASS no console errors'); if (errs.length) fail++;
console.log(`\n${res.checks.length + 1 - fail}/${res.checks.length + 1} passed`);
await b.close(); srv.close(); process.exit(fail ? 1 : 0);
