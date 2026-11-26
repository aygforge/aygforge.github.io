// Node tests for Roguelite Reborn: data integrity, resolver, engine Campaign rules, cards, draft, economy, save, critical levels.
const R = require('./rload.js'), E = globalThis.FWEngine, D = globalThis.FWCampaignData, K = globalThis.FWCards, LD = globalThis.FWLeaders;
const { playLevel, autoFocus } = require('./rogue_smoke.js'); const { refTraining } = require('./rogue_calibrate.js');
let pass = 0, fail = 0; const ok = (n, c, info) => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (info != null ? ' — ' + info : '')); };
const QUICK = process.argv.includes('--quick');
// ---------- data ----------
for (const c of R.Validation.run().checks) ok('data: ' + c.name, c.ok, c.info);
// ---------- V4 regression: the Campaign hooks never change a V4 battle ----------
{
  delete require.cache[require.resolve('../src/v4_engine.js')];
  const V4 = require('../src/v4_engine.js'); globalThis.FWEngine = E; // keep the rogue engine as FWEngine
  const clubs = globalThis.FW_MASTER_DB.clubs; let same = 0;
  for (let i = 0; i < 4; i++) { const o = { seed: 4242 + i, teamA: clubs[i * 9], teamB: clubs[i * 9 + 4], cfg: globalThis.FW_ENGINE_CONFIG, duration: 'standard', fxLevel: 1, ruleset: i % 2 ? 'fusion' : undefined };
    if (V4.summary(V4.simulate(o)).hash === E.summary(E.simulate(o)).hash) same++; }
  ok('V4 regression: 4/4 classic + fusion battles byte-identical', same === 4, same);
}
// ---------- Objective resolver (pure) ----------
{
  const O = R.ObjectiveResolver, b = (o) => O.resolve(Object.assign({ type: 'survival', final: false, battleT: 10, waveSec: 45, otSec: 10, playerAlive: 50, enemyAlive: 20, goals: 0, target: 0 }, o));
  ok('resolver: survival continues before 45 s', b({}).state === 'continue');
  ok('resolver: survival clears at 45 s with rivals alive', b({ battleT: 45 }).state === 'clear' && b({ battleT: 45 }).reason === 'time');
  ok('resolver: survival clears when all rivals K.O.', b({ enemyAlive: 0 }).state === 'clear');
  ok('resolver: final survival wave wins', b({ final: true, battleT: 45 }).state === 'win');
  ok('resolver: army wiped = defeat', b({ playerAlive: 0 }).state === 'lose');
  ok('resolver: simultaneous wipe-out = defeat (no sudden death)', b({ playerAlive: 0, enemyAlive: 0 }).state === 'lose');
  ok('resolver: goals never end a Survival wave', b({ goals: 9, target: 0 }).state === 'continue');
  const g = o => b(Object.assign({ type: 'goal', target: 3 }, o));
  ok('resolver: goal non-final wave behaves like Survival', g({ battleT: 45 }).state === 'clear' && g({ enemyAlive: 0, goals: 0 }).state === 'clear');
  ok('resolver: goal final, target met early → keep playing until 45 s', g({ final: true, goals: 3, battleT: 30 }).state === 'continue');
  ok('resolver: goal final, target met at 45 s → win', g({ final: true, goals: 3, battleT: 45 }).state === 'win');
  ok('resolver: goal final, target missing at 45 s → overtime', g({ final: true, goals: 2, battleT: 45 }).state === 'continue' && g({ final: true, goals: 2, battleT: 45 }).overtime);
  ok('resolver: goal reached in overtime → win', g({ final: true, goals: 3, battleT: 50 }).state === 'win');
  ok('resolver: overtime ends without target → defeat', g({ final: true, goals: 2, battleT: 55 }).state === 'lose');
  ok('resolver: all rivals K.O. but goals missing → defeat', g({ final: true, goals: 1, enemyAlive: 0 }).state === 'lose');
  ok('resolver: target met but army wiped → defeat', g({ final: true, goals: 5, playerAlive: 0, battleT: 45 }).state === 'lose');
  const k = o => b(Object.assign({ type: 'ko' }, o));
  ok('resolver: Total KO needs every rival K.O.', k({ battleT: 45 }).state === 'continue' && k({ battleT: 45 }).overtime && k({ battleT: 55 }).state === 'lose' && k({ enemyAlive: 0, battleT: 50 }).state === 'clear');
}
// ---------- helpers ----------
function mkSave(level, tr) {
  const s = R.Save.defaults(); s.salt = 777 + level; s.highest = level - 1; for (let l = 1; l < level; l++) s.completed[l] = { medal: 'clear' };
  s.training = tr || refTraining(level, 0.5); s.leaders = LD.LEADERS.filter(x => x.unlock < level).map(x => x.id); s.cards = K.CARDS.filter(c => c.unlock < level).map(c => c.id); return s;
}
function waveWorld(level, wave, cards, opts) {
  const s = mkSave(level, opts && opts.tr); R.Run.start(s, level); const run = s.run; run.draft.left = 0; run.draft.offer = null; run.phase = 'ready'; run.cards = cards || {}; run.wave = wave || 0;
  if (opts && opts.goals) run.goals = opts.goals;
  const snap = R.Run.beginWave(s); if (opts && opts.obj) Object.assign(snap.obj, opts.obj); if (opts && opts.mod) opts.mod(snap);
  const w = E.createWorld(R.Battle.worldOpts(snap, { headless: true, inputs: opts && opts.inputs || [] })); return { s, snap, w };
}
const runW = w => { while (w.phase !== 'ended' && w.tick < 8000) E.step(w); return w; };
// ---------- engine Campaign rules ----------
{
  const { w } = waveWorld(1, 0, {}, { mod: s => { s.mods[1].hp *= 30; } });   // unbreakable rivals: the wave must end on time
  runW(w); const r = w.rg.result;
  ok('engine: Survival wave ends at exactly 45.000 s with rivals alive', r.outcome === 'clear' && r.reason === 'time' && Math.abs(r.battleT - 45) < 1e-6 && w.teams[1].alive > 0, r.battleT);
  ok('engine: no hunt / zone / storm / sudden death / tiebreak K.O.s', !w.hunt && !w.zone.active && !w.storm && !w.sudden && !w.rules.some(x => /TIEBREAK|SUDDEN|STORM|ZONE|HUNT/.test(x)), w.rules.join());
  ok('engine: rivals keep their players at time-up (no fake K.O.)', w.teams[1].alive === w.units.filter(u => u.side === 1 && u.alive).length && w.teams[1].alive > 30);
}
{
  const { w } = waveWorld(1, 0, {}, { obj: { type: 'ko' }, mod: s => { s.mods[1].hp *= 30; } });
  runW(w); const r = w.rg.result;
  ok('engine: Total KO with rivals left → defeat after 45 + 10 s overtime', r.outcome === 'lose' && r.reason === 'rivals_left' && Math.abs(r.battleT - 55) < 1e-6 && w.rg.ot, r.battleT);
}
{
  const { w } = waveWorld(1, 0, {}, { mod: s => { s.mods[1].dmg *= 40; } });
  runW(w); const r = w.rg.result;
  ok('engine: army wiped → defeat, nobody revived', r.outcome === 'lose' && r.reason === 'army_ko' && w.teams[0].alive === 0 && w.units.filter(u => u.side === 0 && u.alive).length === 0);
}
{ // goals: counted only from real EV.GOAL, carried over, never end Survival
  let found = null;
  for (let sd = 0; sd < 12 && !found; sd++) { const { w } = waveWorld(7, 0, {}, { mod: s => { s.mods[1].hp *= 30; s.seed = s.seed + sd; } }); runW(w); const goals = w.events.filter(e => e.type === E.EV.GOAL && e.b === 0).length; if (w.fb.goals[0] > 0) found = { w, goals }; }
  ok('engine: a Survival-type wave with real goals still runs to 45 s', found && found.w.rg.result.reason === 'time', found && found.w.fb.goals.join('-'));
  ok('engine: goal counter == real GOAL events (ball over the line)', found && found.goals === found.w.fb.goals[0]);
  const { w } = waveWorld(7, 2, {}, { goals: 2, mod: s => { s.mods[1].hp *= 30; } });
  runW(w);
  ok('engine: Goal Challenge final wave with goals already met → win at 45 s', w.rg.result.outcome === 'win' && w.rg.obj.goalsBefore === 2, JSON.stringify(w.rg.result));
  const w2 = waveWorld(7, 2, {}, { goals: 0, mod: s => { s.mods[1].hp *= 30; s.mods[1].gk = 100; } }).w; runW(w2);
  const need = w2.rg.obj.target - w2.rg.obj.goalsBefore;
  ok('engine: Goal Challenge final wave short of target → overtime then decided', w2.rg.result.battleT > 45 - 1e-6 && (w2.rg.result.outcome === 'lose' ? w2.fb.goals[0] < need : w2.fb.goals[0] >= need), JSON.stringify(w2.rg.result) + ' goals ' + w2.fb.goals[0]);
}
{ // persistent army across waves, K.O.'d leaders stay out
  const s = mkSave(30); R.Run.start(s, 30); const run = s.run; R.Run.pick(s, run.draft.offer[0]);
  let snap = R.Run.beginWave(s); let w = E.createWorld(R.Battle.worldOpts(snap, { headless: true }));
  // knock out the captain leader for real (damage through the engine) before the battle phase is over
  while (w.phase !== 'battle') E.step(w);
  const cap = w.units.find(u => u.side === 0 && u.leader === 'stev'); E.step(w); cap.hp = 0.0001; // next real hit K.O.s him
  runW(w); const sum = R.Battle.result(w); const out = R.Run.endWave(s, sum);
  const stevKO = !run.roster.find(u => u.leader === 'stev').alive;
  ok('army: wave result written by persistent id', run.roster.filter(u => u.alive).length === sum.alive[0] && run.roster.length === 100, out + ' ' + sum.alive[0]);
  if (out === 'clear') {
    R.Run.afterClear(s); while (s.run.phase === 'draft') R.Run.pick(s, s.run.draft.offer[0]);
    snap = R.Run.beginWave(s); w = E.createWorld(R.Battle.worldOpts(snap, { headless: true }));
    ok('army: next wave spawns only survivors (never refilled to 100)', w.teams[0].alive === sum.alive[0] && snap.roster.length === sum.alive[0], w.teams[0].alive);
    ok('army: survivors keep HP (+10% heal, ≤ max)', snap.roster.every(u => u.hp <= u.maxHp + 1e-9) && snap.roster.some(u => u.hp < u.maxHp));
    if (stevKO) ok('army: K.O.\'d leader does not return in the next wave', !w.units.some(u => u.side === 0 && u.leader === 'stev'));
    else ok('army: leader alive → present next wave', w.units.some(u => u.side === 0 && u.leader === 'stev'));
  }
}
{ // emergency keeper: the last keeper falls for real (stronger rivals, one keeper left)
  let em = null, gkDead = false;
  for (let sd = 0; sd < 6 && !em; sd++) {
    const { w } = waveWorld(1, 0, {}, { mod: s => { const g = s.roster.find(x => x.role === 'goalkeeper'); s.roster = s.roster.filter(u => u.role !== 'goalkeeper' || u === g); g.hp = g.maxHp * 0.05; s.mods[1].dmg *= 2; s.mods[1].hp *= 4; s.seed += sd; } });
    ok('engine: army spawns its exact living roster', sd > 0 || (w.teams[0].alive === 93 && w.units.filter(u => u.side === 0 && u.role === 'goalkeeper').length === 1));
    const gk = w.units.find(u => u.side === 0 && u.role === 'goalkeeper');
    while (gk.alive && w.phase !== 'ended') E.step(w);
    if (!gk.alive) { gkDead = true; const e = w.units.filter(u => u.side === 0 && u.emergencyGK); if (e.length) em = e; }
  }
  ok('engine: last keeper K.O. → one living defender becomes emergency keeper', gkDead && em && em.length === 1 && em[0].role === 'goalkeeper', em && em.length);
}
{ // determinism
  const a = runW(waveWorld(5, 0, { S01: 2, K06: 3, C08: 1 }, { inputs: [{ k: 900, f: 'ko' }, { k: 1600, f: 'survive' }] }).w);
  const b = runW(waveWorld(5, 0, { S01: 2, K06: 3, C08: 1 }, { inputs: [{ k: 900, f: 'ko' }, { k: 1600, f: 'survive' }] }).w);
  ok('determinism: same seed + same Focus ticks = identical wave', a.hash === b.hash && a.endTick === b.endTick);
  const c = runW(waveWorld(5, 0, { S01: 2, K06: 3, C08: 1 }, { inputs: [{ k: 900, f: 'goal' }] }).w);
  ok('focus: a different command changes the battle', c.hash !== a.hash);
  const d = waveWorld(5, 0, {}, { mod: s => { s.mods[1].hp *= 30; }, inputs: [{ k: 900, f: 'ko' }, { k: 905, f: 'goal' }, { k: 1500, f: 'survive' }, { k: 1700, f: 'goal' }, { k: 2300, f: 'ko' }] }).w; runW(d);
  ok('focus: 2 per wave, never two at once, 8 s + 5 s gap', d.rg.focus.uses === 2 && d.rg.focus.log.map(x => x.f).join() === 'ko,goal' && (d.rg.focus.log[1].k - d.rg.focus.log[0].k) / 60 >= 13 - 1e-9, d.rg.focus.log.map(x => x.k + x.f).join());
  const p = waveWorld(5, 0, {}, { mod: s => { s.mods[1].hp *= 30; }, inputs: [{ k: 900, f: 'ko' }] }).w; while (p.tick < 1000) E.step(p);
  ok('focus: lasts 8 s of simulation time (pause = no ticks = no time)', Math.abs(p.rg.focus.until - (900 / 60 - E.TL.battleStart + 8)) < 1e-6);
}
// ---------- cards ----------
{ // a long, hard wave (stronger rivals) so every trigger condition really happens; one card at rank III at a time
  // scenario A: a losing fight (rivals ×4 HP, ×2.2 damage); scenario B: 45 s of football against unbreakable rivals
  // scenario C: 45 s where the rivals attack an unbreakable army (keeper saves, rival passes); B and C use 3 seeds each
  const scen = [{ mod: s => { s.mods[1].hp *= 4; s.mods[1].dmg *= 2.2; } }];
  scen.push({ lv: 120, wave: 2, mod: s => { s.roster = s.roster.filter(u => u.role === 'goalkeeper' || u.role === 'captain'); s.roster.forEach(u => { u.maxHp *= 60; u.hp *= 60; }); } }); // keepers under fire
  scen.push({ lv: 120, wave: 2, mod: s => { s.mods[0].hp *= 30; s.mods[0].dmg *= 0.15; s.roster.forEach(u => { u.maxHp *= 30; u.hp *= 30; }); } }); // Pinball Eleven shoots a lot
  for (let sd = 0; sd < 3; sd++) scen.push({ mod: s => { s.mods[1].hp *= 30; s.mods[1].dmg *= 0.5; s.seed += sd; } }, { mod: s => { s.mods[0].hp *= 30; s.mods[0].dmg *= 0.15; s.roster.forEach(u => { u.maxHp *= 30; u.hp *= 30; }); s.seed += sd; } });
  const base = scen.map(sc => runW(waveWorld(sc.lv || 160, sc.wave == null ? 1 : sc.wave, {}, sc).w).hash);
  let changed = 0; const dead = [];
  for (const c of K.CARDS) {
    if (c.id === 'S02') continue; // wave-end card, checked below
    const did = scen.some((sc, i) => runW(waveWorld(sc.lv || 160, sc.wave == null ? 1 : sc.wave, { [c.id]: 3 }, Object.assign({ inputs: c.id === 'L07' ? [{ k: 400, f: 'ko' }] : [] }, sc)).w).hash !== base[i]);
    if (did) changed++; else dead.push(c.id);
  }
  const hard = scen[0];
  const run = { cards: { S02: 3 }, roster: [{ alive: true, hp: 10, maxHp: 100 }] }; const h = R.Army.heal(run);
  ok('cards: Field Medic raises the between-wave heal (10% + 8% = 18%)', Math.abs(h.pct - 0.18) < 1e-9 && run.roster[0].hp === 28);
  const run2 = { cards: {}, roster: [{ alive: true, hp: 95, maxHp: 100 }] }; R.Army.heal(run2);
  ok('heal: never above max HP; base 10%', run2.roster[0].hp === 100 && R.Army.heal({ cards: {}, roster: [] }).pct === 0.10);
  ok('cards: the other 47 cards each change a real wave (rank III, alone)', changed === 47, dead.join());
  const all = {}; for (const c of K.CARDS) all[c.id] = 3;
  const w = runW(waveWorld(160, 1, all, hard).w);
  ok('cards: all 48 at rank III together run without loops', w.phase === 'ended' && Object.keys(w.rg.st.procs).length > 10, Object.keys(w.rg.st.procs).length + ' cards fired');
}
{ // global caps, measured on the live modifier functions with every card at rank III and every condition forced on
  const all = {}; for (const c of K.CARDS) all[c.id] = 3;
  const { w } = waveWorld(160, 1, all); while (w.phase !== 'battle') E.step(w); for (let i = 0; i < 200; i++) E.step(w);
  const P = E.RG.probe, u = w.teams[0].aliveList.find(x => x.role === 'winger'), t = w.teams[1].aliveList[0];
  w.battleT = 40; w.rg.t.od = 99; w.rg.t.f04 = 99;
  Object.assign(u, { rgCE: 9, rgCA: 9, aura: true, y: 600, hp: u.maxHp * 0.2, rgF: 1, rgDrT: 99, rgDrV: 0.5, rgSpdT: 99, rgSpdV: 0.9, rgAtkT: 99, rgAtkV: 0.9, rgRateT: 99, rgRateV: 0.9 });
  t.hp = t.maxHp * 0.1;
  ok('caps: damage reduction ≤ 35 %', P.dr(w, u) === 0.35, P.dr(w, u));
  ok('caps: speed bonus ≤ +35 %', Math.abs(P.speed(w, u) - 1.35) < 1e-9, P.speed(w, u));
  ok('caps: attack bonus ≤ +40 %', P.atk(w, u, t, { tackle: 1, assisted: 1 }) === 0.40);
  ok('caps: attack-rate bonus ≤ +30 %', Math.abs(P.rate(w, u) - 1.30) < 1e-9);
  const g = w.teams[0].aliveList.find(x => x.role === 'goalkeeper');
  ok('caps: keeper save chance ≤ 90 %', P.save(w, g, { side: 1 }, 0.95) === 0.90 && P.save(w, g, { side: 1 }, 0.5) > 0.5);
  const nz = w.units.find(x => x.side === 0 && x.leader === 'nazar');
  const withLeader = P.leader(w, 'nazar'); nz.alive = false;
  ok('leaders: synergy stops when the leader is K.O.', withLeader === true && P.leader(w, 'nazar') === false);
  const w2 = waveWorld(60, 0, { S01: 1 }).w; while (w2.phase !== 'battle') E.step(w2);
  const d0 = w2.units.find(x => x.side === 0 && x.role === 'defender' && !x.leader); d0.y = 560;
  const withPao = P.dr(w2, d0); w2.units.find(x => x.side === 0 && x.leader === 'pao').alive = false;
  ok('leaders: Pao Maldin\'s Iron Discipline bonus ends with him', Math.abs(withPao - P.dr(w2, d0) - 0.04) < 1e-9, withPao.toFixed(3) + ' → ' + P.dr(w2, d0).toFixed(3));
}
{
  const s = mkSave(100); R.Run.start(s, 100); const run = s.run;
  for (const c of K.CARDS) if (s.cards.indexOf(c.id) >= 0) run.cards[c.id] = 3; run.cards.S01 = 2; delete run.cards.F01;
  let bad = 0, dup = 0, mono = 0;
  for (let i = 0; i < 300; i++) { run.draft.n = i; const off = R.Draft.offer(s, run); if (off.some(id => run.cards[id] >= 3 || s.cards.indexOf(id) < 0)) bad++; if (new Set(off).size !== off.length) dup++; }
  ok('draft: Rank III / undiscovered cards are never offered', bad === 0);
  ok('draft: no duplicate card inside an offer', dup === 0);
  ok('draft: fewer than 3 eligible → only real options shown', R.Draft.offer(s, run).length === 2, R.Draft.offer(s, run).join());
  const s2 = mkSave(160); R.Run.start(s2, 160); const r2 = s2.run; const cnt = { common: 0, rare: 0, epic: 0, legendary: 0 };
  for (let i = 0; i < 3000; i++) { r2.draft.n = i; const off = R.Draft.offer(s2, r2); for (const id of off) cnt[K.BY_ID[id].rarity]++; const cats = new Set(off.map(id => K.BY_ID[id].cat)); if (cats.size < 2) mono++; }
  const tot = Object.values(cnt).reduce((a, b) => a + b, 0);
  ok('draft: at least two categories per offer', mono === 0, mono);
  ok('draft: rarity mix ≈ 60/30/9/1', Math.abs(cnt.common / tot - 0.6) < 0.05 && Math.abs(cnt.rare / tot - 0.3) < 0.05 && Math.abs(cnt.epic / tot - 0.09) < 0.03 && cnt.legendary > 0, JSON.stringify(Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, (v / tot * 100).toFixed(1) + '%']))));
  r2.draft.n = 7; ok('draft: deterministic from run seed', R.Draft.offer(s2, r2).join() === R.Draft.offer(s2, r2).join());
  const s3 = mkSave(10); R.Run.start(s3, 10); const id = s3.run.draft.offer[0]; s3.run.cards[id] = 1; const before = s3.run.cards[id];
  s3.run.draft.offer = [id]; R.Run.pick(s3, id); ok('draft: picking an owned card ranks it up (max III)', s3.run.cards[id] === before + 1);
}
{ // leaders join the 100 (never extra players)
  const { w } = waveWorld(60, 0, {});
  const L = w.units.filter(u => u.side === 0 && u.leader).map(u => u.leader).sort().join();
  ok('leaders: all 5 unlocked by Level 60 replace standard players; army stays 100', L === 'buffo,nazar,pao,stev,xav' && w.rg.startAlive === 100 && w.units.filter(u => u.side === 0 && u.role === 'captain').length === 1, L);
}
// ---------- economy / medals / progress ----------
{
  const L1 = R.Progress.level(1), L20 = R.Progress.level(20), L53 = R.Progress.level(53), L6 = R.Progress.level(6);
  ok('economy: level bases (Normal 300, Boss ×1.3, Elite ×1.15 beats Hard, Soft ×1.2)', R.Economy.levelBase(L1) === 300 && R.Economy.levelBase(L20) === 390 && R.Economy.levelBase(L53) === 1150 && R.Economy.levelBase(L6) === 360);
  const w = R.Economy.win(L1, 80, ['stev', 'pao'], ['stev', 'pao']);
  ok('economy: Gold + all leaders = +10 % (cap)', w.medal === 'gold' && w.bonus === 0.10 && w.coins === 330);
  ok('economy: bonus never above 10 %', [0, 5, 30, 50, 80, 100].every(n => R.Economy.win(L20, n, ['a', 'b'], ['a', 'b']).bonus <= 0.10));
  ok('medals: thresholds (Normal 70/45/20, Elite 55/30/12, Boss 35/18/7)', R.Economy.medal(L1, 70) === 'gold' && R.Economy.medal(L1, 69) === 'silver' && R.Economy.medal(L1, 19) === 'clear' && R.Economy.medal(L53, 55) === 'gold' && R.Economy.medal(L53, 11) === 'clear' && R.Economy.medal(L20, 35) === 'gold' && R.Economy.medal(L20, 6) === 'clear');
  ok('economy: defeat Coins formula', R.Economy.fail(L1, 0).coins === 90 && R.Economy.fail(L1, 2).coins === 255 && R.Economy.fail(L1, 9).coins === 255 && R.Economy.fail(L20, 2).coins === R.roundTo5(390 * (0.3 + 0.55 * 2 / 4)));
  const s = R.Save.defaults(); s.coins = 79; const r = R.Training.buy(s, 'attack');
  ok('training: failed purchase spends nothing', !r.ok && s.coins === 79 && s.training.attack === 1);
  s.coins = 80; ok('training: purchase pays and levels', R.Training.buy(s, 'attack').ok && s.coins === 0 && s.training.attack === 2);
  ok('training: value curve (Attack 38 → ' + R.Training.value('attack', 100).toFixed(1) + ' at 100)', R.Training.value('attack', 1) === 38 && Math.abs(R.Training.value('attack', 100) - 77.4) < 0.01);
  s.training.speed = 100; s.coins = 1e9; ok('training: Level 101 cannot be bought', !R.Training.buy(s, 'speed').ok);
  ok('progress: Level 201 does not exist / cannot start', R.Progress.level(201) === null && !R.Progress.canStart(Object.assign(R.Save.defaults(), { highest: 200 }), 201));
}
{ // atomic first clear, idempotent rewards, replay lock, abandon
  const s = mkSave(5); s.leaders = ['stev']; s.cards = K.START_CARDS.slice();
  let res = null; for (let i = 0; i < 6 && !(res && res.kind === 'win'); i++) res = playLevel(s, 5, { pickSeed: 11 + i });
  ok('L5 first clear unlocks Pao Maldin + Second Wind', res.kind === 'win' && s.leaders.indexOf('pao') >= 0 && s.cards.indexOf('S03') >= 0 && res.unlocks.length === 2, res.kind);
  const c = s.coins; s.run = JSON.parse('{"x":1}'); s.run = null;
  ok('rewards: first-clear ledger entry blocks a second payment', R.tx(s, 'level:5:first_clear', () => { s.coins += 1; }) === false && s.coins === c);
  ok('progress: cleared level cannot be started again', !R.Progress.canStart(s, 5) && R.Run.start(s, 5) === null);
  R.Run.start(s, 6); const c2 = s.coins; R.Run.abandon(s); ok('abandon: 0 Coins, run cleared', s.coins === c2 && !s.run && s.lastResult.coins === 0);
}
// ---------- save ----------
{
  const store = { d: {}, getItem(k) { return this.d[k] == null ? null : this.d[k]; }, setItem(k, v) { this.d[k] = String(v); }, removeItem(k) { delete this.d[k]; } };
  const s = R.Save.defaults(); s.coins = 1234; R.Save.persist(s, store); s.coins = 2000; R.Save.persist(s, store);
  ok('save: round-trip', R.Save.load(store).save.coins === 2000);
  store.d[R.Save.KEY] = '{broken'; const l = R.Save.load(store);
  ok('save: corrupt main → last good backup restored', l.save.coins === 1234 && /backup/.test(l.notice));
  ok('save: import rejects foreign / invalid JSON', !R.Save.importText('{"a":1}').ok && !R.Save.importText('nope').ok);
  const odd = R.Save.validate(Object.assign(R.Save.defaults(), { coins: -5, training: { attack: 999, speed: 'x' }, highest: 7, completed: { 1: {}, 2: {} } }));
  ok('save: wrong types / ranges repaired', odd.coins === 0 && odd.training.attack === 100 && odd.training.speed === 1 && odd.highest === 2);
}
// ---------- critical levels (real engine, reference Training, scripted Focus) ----------
const CRIT = QUICK ? [1, 7, 9, 20, 151, 200] : [1, 5, 7, 9, 14, 15, 20, 30, 32, 50, 53, 72, 80, 100, 120, 136, 151, 159, 160, 191, 199, 200];
const rows = [];
for (const lv of CRIT) {
  const L = R.Progress.level(lv); let wins = 0, surv = 0, consistent = true, unl = true; const seeds = 3;
  for (let i = 0; i < seeds; i++) {
    const s = mkSave(lv); s.salt = 31 + i * 101;
    const r = playLevel(s, lv, { pickSeed: 5 + i });
    const wl = r.run.waveLog;
    if (r.kind === 'win') {
      wins++; surv += r.survivors;
      if (L.mission === 'goal' && r.run.goals < L.goalTarget) consistent = false;
      if (L.mission === 'ko' && !wl.every(x => x.reason === 'all_ko')) consistent = false;
      if (wl.length !== L.waves) consistent = false;
      for (const u of R.Progress.rewardsOf(lv)) if (u.kind === 'card' && s.cards.indexOf(u.id) < 0) unl = false; else if (u.kind === 'leader' && s.leaders.indexOf(u.id) < 0) unl = false; else if (u.kind === 'cup' && !s.cups[lv]) unl = false;
      if (lv === 200 && !(s.campaignCompleted && !R.Progress.next(s) && !R.Training.canBuy(s, 'attack').ok)) consistent = false;
      if (lv === 159 && s.cards.length !== 48) unl = false;
    } else if (wl[wl.length - 1].outcome !== 'lose') consistent = false;
  }
  rows.push(lv + ' ' + L.kind + '/' + L.mission + (L.soft ? '+soft' : '') + (L.hard ? '+hard' : '') + (L.goalTarget ? ' (' + L.goalTarget + ' goals)' : '') + ': ' + wins + '/' + seeds + ' wins' + (wins ? ', avg ' + Math.round(surv / wins) + ' survivors' : ''));
  ok('level ' + lv + ': outcome follows the mission rules' + (wins ? ' and rewards unlock' : ''), consistent && unl, rows[rows.length - 1]);
}
console.log('\nCritical level results (reference Training, 3 seeds):\n  ' + rows.join('\n  '));
console.log('\ntest_rogue: ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
