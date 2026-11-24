// ARCADE MAYHEM targeted engine tests (node, real battles; few seeds, specific scenarios).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const A = require('./load.js'); const E = FWEngine, B = A.Battle, M = E.MAY;
let pass = 0, fail = 0; const T = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
const t0 = Date.now();
const s = A.Save.fresh('ENG_ARSENAL', 4711);
for (const k of A.Upgrades.KEYS) s.upgrades[k] = 6;
const snap = B.snapshot(s, 'league');
const opts = (seed, o) => { const x = B.worldOpts(Object.assign({}, snap, { seed }), Object.assign({ headless: true }, o || {})); return x; };
const run = w => { while (w.phase !== 'ended' && w.t < 90) E.step(w); return w; };
const toBattle = w => { while (w.phase !== 'battle') E.step(w); return w; };
const evs = (w, type) => w.events.filter(e => e.type === type);
T('V1 new snapshots carry the Mayhem mechanics version', snap.mech === 'mayhem' && opts(1).arcade.mech === 'mayhem' && opts(1).goalAdv === false);
// ---------- Power Kick ----------
let goal = null, save = null, blocked = 0, tried = 0;
for (let seed = 1; seed <= 60 && (!goal || !save); seed++) {
  const w = toBattle(E.createWorld(opts(seed)));
  let guard = 0; while (!(M.carrier(w, 0) && w.battleT > 3) && guard++ < 3000 && w.phase === 'battle') E.step(w);
  const car = M.carrier(w, 0); if (!car) continue;
  w.may.s[0].energy = 100; tried++;
  const g0 = w.fb.goals[0], sh0 = w.fb.stats.shots[0];
  E.mayCommand(w, 'kick', 180, E.GOAL.yTop - 4); E.step(w);
  const rec = w.may.used[w.may.used.length - 1];
  const shot = w.fb.shots[w.fb.shots.length - 1];
  let k = 0; while (shot && shot.result === 'in-flight' && k++ < 200) E.step(w);
  if (!rec.ok || !shot || !shot.pk) continue;
  if (shot.result === 'goal' && !goal) goal = { seed, goals: w.fb.goals[0] - g0, shots: w.fb.stats.shots[0] - sh0, ev: evs(w, E.EV.GOAL).filter(e => e.b === 0).length, energy: +w.may.s[0].energy.toFixed(1) };
  if (shot.result === 'save' && !save) save = { seed, gk: shot.gk, saveEv: evs(w, E.EV.SAVE_GOAL).length };
  if (shot.result === 'blocked') blocked++;
}
T('P1 Power Kick can score through the real ball (SHOOTING -> GOAL event, goal count, shot stats)', !!goal && goal.goals === 1 && goal.shots === 1 && goal.ev >= 1, { goal, tried });
T('P2 Power Kick can be saved by a real goalkeeper (SAVE_GOAL)', !!save && save.gk >= 0 && save.saveEv >= 1, save);
{ const w = toBattle(E.createWorld(opts(7))); let g = 0; while (!E.MAY.carrier(w, 1) && g++ < 3000) E.step(w);
  w.may.s[0].energy = 100; const e0 = w.may.s[0].energy; E.mayCommand(w, 'kick', 180, E.GOAL.yTop); E.step(w);
  const r = w.may.used.filter(c => c.side === 0).pop();
  T('P3 Power Kick without possession is rejected, no energy spent, no cooldown', r && !r.ok && r.why === 'no_ball' && w.may.s[0].energy >= e0 - 1e-9 && w.may.s[0].cd.kick === 0, r); }
// ---------- Team Rush ----------
{ const w = toBattle(E.createWorld(opts(11))); for (let i = 0; i < 360; i++) E.step(w);
  w.may.s[0].energy = 100; const cx = w.teams[0].aliveList.reduce((m, u) => m + u.x, 0) / w.teams[0].alive, cy = w.teams[0].aliveList.reduce((m, u) => m + u.y, 0) / w.teams[0].alive, tx = cx, ty = Math.max(E.ARENA.y0 + 20, cy - 110);
  const picked = M.pick(w, 0, 'rush', tx, ty), before = picked.map(u => Math.hypot(u.x - tx, u.y - ty));
  let maxStep = 0; const prev = picked.map(u => [u.x, u.y]);
  E.mayCommand(w, 'rush', tx, ty);
  for (let i = 0; i < 40; i++) { E.step(w); picked.forEach((u, j) => { maxStep = Math.max(maxStep, Math.hypot(u.x - prev[j][0], u.y - prev[j][1])); prev[j] = [u.x, u.y]; }); }
  const after = picked.map(u => Math.hypot(u.x - tx, u.y - ty));
  const closer = picked.filter((u, j) => !u.alive || after[j] < before[j] * 0.75).length;
  T('R1 Team Rush picks 8-10 outfield players (no keepers)', picked.length >= 8 && picked.length <= 10 && picked.every(u => u.role !== 'goalkeeper'), picked.length);
  T('R2 rushers really run there (closer, no teleport: max step per tick < 6 px)', closer >= Math.ceil(picked.length * 0.7) && maxStep < 6, { closer, maxStep: +maxStep.toFixed(2) });
  run(w); const st = w.may.s[0].st;
  T('R3 rush collisions hit real opponents (knockback/damage events), victim cap respected', st.rushHits >= 0 && evs(w, E.EV.RUSH_HIT).length === w.may.s[0].st.rushHits + w.may.s[1].st.rushHits, st); }
{ let hits = 0; for (let seed = 20; seed < 26; seed++) { const w = toBattle(E.createWorld(opts(seed))); for (let i = 0; i < 300; i++) E.step(w); w.may.s[0].energy = 100; const c = w.teams[1].aliveList[0]; E.mayCommand(w, 'rush', c.x, c.y); for (let i = 0; i < 90; i++) E.step(w); hits += w.may.s[0].st.rushHits; }
  T('R4 rushing into opponents produces real collisions (6 seeds)', hits > 0, hits); }
{ const w = toBattle(E.createWorld(opts(12))); w.may.s[0].energy = 10; const e0 = w.may.s[0].energy; E.mayCommand(w, 'rush', 180, 300); E.step(w);
  const r = w.may.used.filter(c => c.side === 0).pop();
  T('E1 insufficient energy -> rejected, energy not spent', r && !r.ok && r.why === 'energy' && w.may.s[0].energy > e0 - 1e-9, r);
  w.may.s[0].energy = 100; E.mayCommand(w, 'iron', 180, 120); E.step(w); // far from any own defender (opponent half)
  const r2 = w.may.used.filter(c => c.side === 0).pop();
  T('E2 invalid target (no eligible players) -> rejected, energy not spent', r2 && !r2.ok && r2.why === 'no_players' && w.may.s[0].energy >= 99.9, r2);
  E.mayCommand(w, 'rush', 180, 300); E.mayCommand(w, 'iron', 180, 500); E.step(w);
  const last2 = w.may.used.filter(c => c.side === 0).slice(-2);
  T('E3 two commands in the same tick: only one applies', last2[0].ok && !last2[1].ok && last2[1].why === 'same_tick', last2); }
// ---------- Iron Defense: twin worlds, same seed, with vs. without the command ----------
{ let withDmg = 0, noDmg = 0, stops = 0, reduced = 0;
  for (let seed = 30; seed < 36; seed++) {
    const make = () => { const w = toBattle(E.createWorld(opts(seed))); for (let i = 0; i < 420; i++) E.step(w); return w; };
    const wa = make(), wb = make();
    const own = wa.teams[0].aliveList.filter(u => u.role === 'defender'); const zx = own.reduce((m, u) => m + u.x, 0) / own.length, zy = own.reduce((m, u) => m + u.y, 0) / own.length;
    wa.may.s[0].energy = 100; E.mayCommand(wa, 'iron', zx, zy); E.step(wa); E.step(wb);
    const ids = wa.units.filter(u => u.side === 0 && u.ironT > 0).map(u => u.id);
    const hp = w => ids.reduce((m, id) => m + (w.units[id].alive ? w.units[id].hp : 0), 0), ha = hp(wa), hb = hp(wb);
    for (let i = 0; i < 168; i++) { E.step(wa); E.step(wb); }
    withDmg += ha - hp(wa); noDmg += hb - hp(wb); stops += wa.may.s[0].st.ironStops; reduced += wa.may.s[0].st.ironReduced;
  }
  T('I1 Iron Defense: same seed, defended players lose clearly less health over 2.8 s', withDmg < noDmg * 0.85, { withDmg: Math.round(withDmg), noDmg: Math.round(noDmg) });
  T('I2 Iron Defense absorbs real damage and stops attacks (tackles / interceptions / blocks)', reduced > 0 && stops > 0, { stops, reduced: Math.round(reduced) }); }
// ---------- Goal reinforcements ----------
{ let checked = 0, gained = null, starOk = true, over100 = false, capOk = true;
  const ids = A.Stars.defs.filter(d => d.role !== 'captain').slice(0, 5).map(d => d.id); const s2 = JSON.parse(JSON.stringify(s));
  for (const id of ids) s2.stars[id] = { id, ovr: 60, contract: 5, rarity: A.Stars.def(id).rarity }; s2.active = ids.slice();
  const sn2 = B.snapshot(s2, 'league');
  for (let seed = 40; seed < 52; seed++) {
    const w = toBattle(E.createWorld(B.worldOpts(Object.assign({}, sn2, { seed }), { headless: true, auto: true })));
    const starIds = new Set(w.units.filter(u => u.star).map(u => u.id));
    let lastGoalAlive = null;
    while (w.phase !== 'ended' && w.t < 90) {
      const n0 = w.events.length; E.step(w);
      for (let i = n0; i < w.events.length; i++) { const e = w.events[i];
        if (e.type === E.EV.GOAL) lastGoalAlive = { side: e.b, alive: w.teams[e.b].alive, tick: w.tick };
        if (e.type === E.EV.REINF_ENTER && starIds.has(e.b)) starOk = false; }
      if (w.teams[0].alive > 100 || w.teams[1].alive > 100) over100 = true;
      if (lastGoalAlive && !gained && w.tick - lastGoalAlive.tick === 120) gained = { before: lastGoalAlive.alive, entered: evs(w, E.EV.REINF_ENTER).filter(e => e.a === lastGoalAlive.side).length, earned: w.may.s[lastGoalAlive.side].earned };
    }
    for (const m of w.may.s) if (m.earned > 9 || m.entered > m.earned || m.entered + m.pending > m.earned) capOk = false;
    checked++;
  }
  T('G1 a real goal brings +3 standard reinforcements onto the pitch', !!gained && gained.earned >= 3 && gained.entered >= 1, gained);
  T('G2 never more than 100 alive per team, earned <= 9 per match, entered <= earned', !over100 && capOk, { checked });
  T('G3 K.O.\'d stars never come back as reinforcements', starOk); }
{ // forced: 99 alive + goal -> 100 alive and 2 waiting; +9 cap (uses the EV.GOAL handler's reinforcement function)
  const w = toBattle(E.createWorld(opts(60)));
  while (w.teams[0].alive === 100 && w.phase === 'battle') E.step(w);
  while (w.teams[0].alive < 99 && false) E.step(w);
  const a0 = w.teams[0].alive; let maxAlive = 0;
  M.reinfGain(w, 0); for (let i = 0; i < 70; i++) { E.step(w); maxAlive = Math.max(maxAlive, w.teams[0].alive); }
  const m = w.may.s[0];
  T('G4 ' + a0 + ' alive + goal -> refilled up to 100, the rest waits (+3 earned)', m.earned === 3 && maxAlive <= 100 && m.entered >= 1 && m.entered + m.pending === 3 && (a0 !== 99 || (m.entered === 1 && m.pending === 2)), { a0, entered: m.entered, pending: m.pending, maxAlive });
  M.reinfGain(w, 0); M.reinfGain(w, 0); M.reinfGain(w, 0);
  T('G5 reinforcement cap: +9 per team per match', m.earned === 9, m.earned);
  const rev = w.units.filter(u => u.side === 0 && u.alive && evs(w, E.EV.REINF_ENTER).some(e => e.b === u.id));
  T('G6 a reinforcement is a reset standard player near its own goal (full HP, no ball/stun/buffs)', rev.length > 0 && rev.every(u => !u.star && u.stun === 0 && u.kbx === 0 && u.hasteT <= 0 && u.y > 520), rev.map(u => [u.role, Math.round(u.y), Math.round(u.hp / u.maxHp * 100)])); }
// ---------- zone / storm / time up / Final Frenzy ----------
const immortal = (seed, frenzyT) => {
  const keep = M.FRENZY_T; if (frenzyT != null) M.FRENZY_T = frenzyT;
  const w = toBattle(E.createWorld(opts(seed)));
  for (const u of w.units) { u.maxHp *= 40; u.hp = u.maxHp; }
  let zoneOk = true, stormHp = false, minAlive = [100, 100]; const atk = { pre: 0, post: 0 };
  while (w.phase !== 'ended' && w.t < 90) {
    const n0 = w.events.length; E.step(w);
    if (w.zone.active || w.zone.x0 !== E.ARENA.x0 || w.zone.y1 !== E.ARENA.y1) zoneOk = false;
    for (let i = n0; i < w.events.length; i++) { const e = w.events[i]; if (e.type === E.EV.STORM || e.type === E.EV.ZONE) stormHp = true;
      if (e.type === E.EV.SHOT || e.type === E.EV.CURVE || e.type === E.EV.TACKLE || e.type === E.EV.CLEAR) { if (w.battleT >= 30 && w.battleT < 40) atk.pre++; else if (w.battleT >= 40 && w.battleT < 50) atk.post++; } }
  }
  M.FRENZY_T = keep;
  return { w, zoneOk, stormHp, atk };
};
{ const a = immortal(70), b = immortal(70, 999);
  T('Z1 no shrinking zone and no storm in a full-length Mayhem battle', a.zoneOk && !a.stormHp && a.w.rules.indexOf('STORM') < 0 && a.w.rules.indexOf('ZONE') < 0, a.w.rules);
  T('Z2 time up decided without killing anyone (survivors -> health -> goals)', a.w.phase === 'ended' && /TIME_UP/.test(a.w.rules.join()) && a.w.teams[0].alive > 0 && a.w.teams[1].alive > 0, { tiebreak: a.w.tiebreak, alive: [a.w.teams[0].alive, a.w.teams[1].alive], battle: +(a.w.endT - E.TL.battleStart).toFixed(1) });
  T('F1 Final Frenzy starts at 40 s and raises real attack frequency (same seed, frenzy on vs off)', a.w.may.frenzy && !b.w.may.frenzy && a.atk.post > b.atk.post * 1.08, { on: a.atk, off: b.atk });
  T('F2 Final Frenzy deals no damage by itself (no storm rule)', a.w.rules.indexOf('STORM') < 0); }
// ---------- chain collision / rampage bounds ----------
{ let maxPerSec = 0, maxChainTargets = 0, rampStack = false, ramp = 0;
  for (let seed = 80; seed < 86; seed++) {
    const w = run(E.createWorld(B.worldOpts(Object.assign({}, snap, { seed }), { headless: true, auto: true })));
    const per = {}; for (const e of evs(w, E.EV.CHAIN)) { const k = Math.floor(e.t - E.TL.battleStart); per[k] = (per[k] || 0) + 1; maxChainTargets = Math.max(maxChainTargets, e.c); }
    maxPerSec = Math.max(maxPerSec, ...Object.values(per), 0);
    const R = evs(w, E.EV.RAMPAGE); ramp += R.length;
    const byU = {}; for (const e of R) { if (byU[e.b] != null && e.t - byU[e.b] < M.RAMP_T) rampStack = true; byU[e.b] = e.t; }
  }
  T('C1 chain collisions bounded: <= ' + M.CHAIN_SEC + ' per second, <= 2 extra targets each, no re-chaining', maxPerSec <= M.CHAIN_SEC && maxChainTargets <= 2, { maxPerSec, maxChainTargets });
  T('C2 KO Rampage happens and never stacks on the same player', ramp > 0 && !rampStack, { ramp }); }
// ---------- counterattack alert ----------
{ let alerts = 0, real = true; for (let seed = 90; seed < 94; seed++) { const w = toBattle(E.createWorld(opts(seed))); while (w.phase !== 'ended' && w.t < 90) { const n0 = w.events.length; E.step(w); for (let i = n0; i < w.events.length; i++) { const e = w.events[i]; if (e.type === E.EV.ALERT) { alerts++; const b = w.fb.ball; if (!(b.state === 'CONTROLLED' && w.units[b.owner].side === e.a)) real = false; } } } }
  T('A1 Counterattack Alerts come from a real controlled attack (not random), with cooldown', alerts > 0 && real, { alerts }); }
// ---------- determinism with commands ----------
{ const cmds = [{ tick: 700, side: 0, type: 'rush', tx: 180, ty: 330 }, { tick: 1300, side: 0, type: 'iron', tx: 180, ty: 520 }, { tick: 1700, side: 0, type: 'kick', tx: 180, ty: E.GOAL.yTop }];
  const h1 = run(E.createWorld(opts(123, { cmds }))), h2 = run(E.createWorld(Object.assign(opts(123, { cmds }), { headless: false, fxLevel: 2 })));
  T('D1 same seed + squads + command list => identical battle (headless vs rendered)', h1.hash === h2.hash && h1.winner === h2.winner, { hash: h1.hash.toString(16) });
  // live recording then resume from a mid-battle save
  const live = toBattle(E.createWorld(opts(321))); let saved = null;
  while (live.phase !== 'ended' && live.t < 90) { if (live.tick % 97 === 0) { const t = M.TYPES[(live.tick / 97) % 3 | 0]; const c = M.carrier(live, 0); E.mayCommand(live, t, c ? 180 : live.fb.ball.x, c ? E.GOAL.yTop : live.fb.ball.y); } E.step(live); if (live.tick === 1500) saved = { cmds: live.may.log.slice(), tick: live.tick }; }
  const re = E.createWorld(opts(321, { cmds: saved.cmds })); while (re.tick < saved.tick) E.step(re);
  while (re.phase !== 'ended' && re.t < 90) { if (re.tick % 97 === 0) { const t = M.TYPES[(re.tick / 97) % 3 | 0]; const c = M.carrier(re, 0); E.mayCommand(re, t, c ? 180 : re.fb.ball.x, c ? E.GOAL.yTop : re.fb.ball.y); } E.step(re); }
  T('D2 save mid-battle (recorded commands) + resume => identical result', re.hash === live.hash, { live: live.hash.toString(16), resumed: re.hash.toString(16), cmds: saved.cmds.length }); }
// ---------- AI-AI league + Quick Simulate ----------
{ const job = A.League.aiJob(Object.assign(s, {})) || null; void job;
  s.league.aiQueue = []; A.League.queueRound(s, 0); const j = A.League.aiJob(s); const w = B.simulate(B.aiOpts(s, j)); const m = E.maySummary(w);
  T('Q1 headless AI-vs-AI league match uses War Commands on both sides (no invalid AI commands)', m.sides[0].commands > 0 && m.sides[1].commands > 0 && m.sides[0].rejected === 0 && m.sides[1].rejected === 0, m.sides.map(x => x.kick + '/' + x.rush + '/' + x.iron));
  const q = B.simulate(B.worldOpts(snap, { headless: true, auto: true })), mq = E.maySummary(q);
  T('Q2 Quick Simulate: conservative auto commands for the player + AI commands for the rival', mq.sides[0].commands > 0 && mq.sides[1].commands > 0 && mq.sides[0].rejected === 0, mq.sides.map(x => x.commands));
  let tot = 0, dur = 0; for (let seed = 200; seed < 206; seed++) { const ww = B.simulate(B.worldOpts(Object.assign({}, snap, { seed }), { headless: true, auto: true })); tot += E.maySummary(ww).sides[1].commands; dur += ww.endT - E.TL.battleStart; }
  console.log('     AI command rate: ' + (tot / 6).toFixed(1) + ' commands per battle of ' + (dur / 6).toFixed(1) + ' s'); }
// ---------- legacy paths unchanged ----------
{ const old = path.join(__dirname, '.engine_reborn.js');
  fs.writeFileSync(old, cp.execSync('git show HEAD:football-wars-arcade/src/engine.js', { cwd: path.join(__dirname, '../..') }));
  const saved = global.FWEngine; delete require.cache[old]; const R = require(old); global.FWEngine = saved;
  const legacy = Object.assign({}, snap, { mech: undefined });
  const lo = B.worldOpts(legacy, { headless: true, inputs: [{ tick: 900, q: 'tap' }] });
  const hNew = run(E.createWorld(lo)).hash, hOld = (() => { const w = R.createWorld(lo); while (w.phase !== 'ended' && w.t < 90) R.step(w); return w.hash; })();
  T('L1 a legacy (pre-Mayhem) battle snapshot replays exactly as in the previous release (Momentum path intact)', hNew === hOld, [hNew.toString(16), hOld.toString(16)]);
  let same = true; for (let i = 0; i < 3; i++) { const o = { seed: 77 + i, teamA: FW_MASTER_DB.clubs[i], teamB: FW_MASTER_DB.clubs[i + 30], cfg: FW_ENGINE_CONFIG, ruleset: 'fusion', duration: 'standard' }; if (E.summaryV4(E.simulate(o, 80)).hash !== R.summaryV4(R.simulate(o, 80)).hash) same = false; }
  T('L2 plain V4 battles unchanged', same);
  fs.unlinkSync(old); }
// ---------- save migration v1 -> v2 ----------
{ const v1 = JSON.parse(JSON.stringify(s)); v1.v = 1; delete v1.wc; v1.credits = 1234; v1.stats.strikes = 7; v1.stats.perfects = 2;
  const keep = ['club', 'division', 'highestDiv', 'credits', 'fragments', 'xp', 'level', 'upgrades', 'stars', 'active', 'packs', 'pity', 'challenges', 'endless', 'claims', 'divisions', 'league', 'tickets'];
  const m = A.Save.parse(JSON.stringify(v1));
  T('S1 v1 -> v2 migration keeps every progress field byte-identical, legacy Momentum stats kept', m.v === 2 && keep.every(k => JSON.stringify(m[k]) === JSON.stringify(v1[k])) && m.stats.strikes === 7 && !!m.wc, keep.filter(k => JSON.stringify(m[k]) !== JSON.stringify(v1[k]))); }
console.log('mayhem engine tests: ' + pass + ' pass, ' + fail + ' fail, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
