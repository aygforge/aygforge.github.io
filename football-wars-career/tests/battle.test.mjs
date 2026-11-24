import { test } from 'node:test';
import assert from 'node:assert/strict';
import { snapshot, buildLineup, coachPolicy, matchOptions } from '../src/battle/adapter.js';
import { runMatch, createLiveWorld, E } from '../src/battle/run.js';
import { testClub, testStar } from './helpers.mjs';

function setup() {
  const A = testClub('HOME', 45), B = testClub('AWAY', 45, { ai: true, c1: '#1d3557' });
  const stars = {};
  const roles = ['striker', 'winger', 'playmaker', 'defender', 'goalkeeper', 'captain'];
  roles.forEach((r, i) => { const s = testStar('S' + i, r, 60, 'HOME', i + 1); stars[s.id] = s; A.stars.push(s.id); });
  A.activeStars = A.stars.slice(); // 6 requested -> max 5 play
  return { A, B, stars };
}

test('lineup: exactly 100 units, one captain, at most 5 stars that replace standard units', () => {
  const { A, B, stars } = setup();
  const L = buildLineup(A, stars, 1, 1);
  assert.equal(L.units.length, 100);
  assert.equal(L.units.filter(u => u.role === 'captain').length, 1);
  assert.equal(L.units.filter(u => u.star).length, 5);
  assert.equal(L.problems.length, 0, L.problems.join());
  // reserves: 104 registered standards still give 100
  A.groups.push({ id: 'x', role: 'defender', count: 4, q: 30 });
  assert.equal(buildLineup(A, stars, 1, 1).units.length, 100);
  assert.equal(buildLineup(B, {}, 1, 1).units.length, 100);
  // injured / not yet eligible stars are replaced by standards
  stars.S0.injured = 1; stars.S1.eligible = { season: 1, week: 3 };
  const L2 = buildLineup(A, stars, 1, 2);
  assert.equal(L2.units.length, 100); assert.equal(L2.units.filter(u => u.star).length, 4);
});

test('battle: 100 v 100 with a real ball, goals and star units in the engine', () => {
  const { A, B, stars } = setup();
  const job = { seed: 77, home: snapshot(A, stars, 1, 1), away: snapshot(B, stars, 1, 1), coach: [coachPolicy(A), coachPolicy(B)] };
  const w = createLiveWorld(job, 0);
  assert.equal(w.units.filter(u => u.side === 0).length, 100);
  assert.equal(w.units.filter(u => u.side === 1).length, 100);
  assert.equal(w.units.filter(u => u.side === 0 && u.role === 'captain').length, 1);
  const starUnits = w.units.filter(u => u.starId);
  assert.equal(starUnits.length, 5);
  const std = w.units.find(u => u.side === 0 && u.role === starUnits[0].role && !u.starId);
  assert.ok(starUnits[0].maxHp > std.maxHp * 1.2, 'star unit is individually stronger');
  assert.ok(starUnits.every(u => u.mod && typeof u.mod.hp === 'number'));
  while (w.phase !== 'ended' && w.t < 80) E.step(w);
  assert.equal(w.phase, 'ended');
  const s = E.careerSummary(w);
  assert.ok(s.winner === 0 || s.winner === 1);
  assert.ok(s.alive[s.winner] > 0 && s.alive[1 - s.winner] === 0, 'last team standing');
  assert.ok(s.football.shots[0] + s.football.shots[1] > 0, 'real shots on goal');
  assert.ok(s.football.passes[0] + s.football.passes[1] > 0, 'real passes');
  assert.equal(s.stars.length, 5);
  const koEvents = w.events.filter(e => e.type === E.EV.KO).length;
  assert.equal(koEvents, 200 - s.alive[0] - s.alive[1] + (w.rules.includes('SUDDEN_DEATH') ? 2 : 0), 'KO count matches eliminations');
});

test('Auto Coach live run == Quick Simulate (same seed, same policy)', () => {
  const { A, B, stars } = setup();
  const job = { seed: 9001, home: snapshot(A, stars, 1, 1), away: snapshot(B, stars, 1, 1), coach: [coachPolicy(A), coachPolicy(B)] };
  const quick = runMatch(job);
  const live = createLiveWorld(job, 1); // rendering FX on, events logged
  while (live.phase !== 'ended' && live.t < 80) E.advanceTo(live, live.t + 1 / 30);
  const ls = E.careerSummary(live);
  assert.equal(ls.hash, quick.hash); assert.equal(ls.winner, quick.winner); assert.equal(ls.endTick, quick.endTick);
  assert.ok(quick.cmds.length > 0, 'coaches used styles/commands');
});

test('commands: 3 uses max, 8 s cooldown, style cooldown; replay of user commands reproduces the battle', () => {
  const { A, B, stars } = setup();
  const job = { seed: 4242, home: snapshot(A, stars, 1, 1), away: snapshot(B, stars, 1, 1), coach: [null, coachPolicy(B)] };
  const w = createLiveWorld(job, 0);
  E.advanceTo(w, 4);
  assert.ok(E.issue(w, 0, 'cmd', 'press').ok);
  assert.equal(E.issue(w, 0, 'cmd', 'hold').reason, 'pending');
  E.step(w);
  assert.equal(E.careerState(w, 0).cmd, 'press');
  const r = E.issue(w, 0, 'cmd', 'hold'); assert.equal(r.ok, false); assert.equal(r.reason, 'cooldown');
  assert.ok(E.issue(w, 0, 'style', 'attack').ok); E.step(w);
  assert.equal(E.issue(w, 0, 'style', 'defend').reason, 'cooldown');
  E.advanceTo(w, 12.2); assert.ok(E.issue(w, 0, 'cmd', 'fast').ok);
  E.advanceTo(w, 20.5); assert.ok(E.issue(w, 0, 'cmd', 'hold').ok);
  E.advanceTo(w, 29); const r4 = E.issue(w, 0, 'cmd', 'press');
  assert.equal(r4.ok, false); assert.equal(r4.reason, 'no commands left');
  while (w.phase !== 'ended' && w.t < 80) E.step(w);
  const live = E.careerSummary(w);
  assert.equal(live.cmds.filter(c => c.side === 0 && c.kind === 'cmd').length, 3);
  // replay from snapshot + logged user commands
  const rep = runMatch({ ...job, commands: live.cmds.filter(c => c.src === 'user') });
  assert.equal(rep.hash, live.hash); assert.equal(rep.winner, live.winner); assert.equal(rep.endTick, live.endTick);
});

test('commands and styles change movement (not just a label)', () => {
  const { A, B, stars } = setup();
  const job = { seed: 5, home: snapshot(A, stars, 1, 1), away: snapshot(B, stars, 1, 1), coach: [null, null] };
  const meanY = w => { const L = w.teams[0].aliveList; return L.reduce((n, u) => n + u.y, 0) / L.length; };
  const a = createLiveWorld(job, 0), b = createLiveWorld(job, 0);
  E.advanceTo(a, 3); E.advanceTo(b, 3);
  E.issue(b, 0, 'style', 'attack'); E.issue(b, 0, 'cmd', 'fast');
  E.advanceTo(a, 7); E.advanceTo(b, 7);
  // side 0 attacks toward smaller y: attacking style + fast break must move the team further forward
  assert.ok(meanY(b) < meanY(a) - 2, `attack moved forward (${meanY(b).toFixed(1)} vs ${meanY(a).toFixed(1)})`);
  const c = createLiveWorld(job, 0); E.advanceTo(c, 3); E.issue(c, 0, 'style', 'defend'); E.issue(c, 0, 'cmd', 'hold'); E.advanceTo(c, 7);
  assert.ok(meanY(c) > meanY(a) + 2, 'defend/hold line keeps the team deeper');
});

test('time-limit decision: more players standing wins (career rule)', () => {
  const { A, B, stars } = setup();
  const job = { seed: 31337, home: snapshot(A, stars, 1, 1), away: snapshot(B, stars, 1, 1), coach: [null, null] };
  const w = createLiveWorld(job, 0);
  E.advanceTo(w, 10);
  // side 1 keeps more players but every one of them is badly hurt -> V4 health rule would favour side 0
  const L0 = w.teams[0].aliveList, L1 = w.teams[1].aliveList;
  while (L0.length > L1.length - 10) { const u = L0[L0.length - 1]; u.alive = false; L0.pop(); w.teams[0].alive--; }
  for (const u of L1) u.hp = u.maxHp * 0.05;
  w.dur = { ...w.dur, storm: 999 }; // isolate the decision rule from the anti-stall storm
  w.tick = Math.round((E.TL.battleStart + E.MAX_BATTLE) * 60) - 1; w.t = w.tick / 60;
  for (let i = 0; i < 4 && w.phase !== 'ended'; i++) E.step(w);
  assert.equal(w.phase, 'ended');
  assert.equal(w.tiebreak, 'alive');
  assert.equal(w.winner, 1);
});
