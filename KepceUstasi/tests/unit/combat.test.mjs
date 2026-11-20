// QA 3, 6, 7, 8, 9 — savaş çözücü, hedefleme, düşman hareketi, zırh, çoklu öldürme, boss kapısı.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVolley, selectTarget, applyDamage } from '../../src/systems/CombatResolver.js';
import { enemyAction, resolveContacts, stepsFor, spawnWave } from '../../src/systems/EnemyDirector.js';
import { Rng } from '../../src/core/rng.js';
import { makeRun, addEnemy, normal, big, CH1, CH2 } from './helpers.mjs';

test('7 normal oils: exactly 7 shots, 7 damage, no bonus without abilities', () => {
  const run = makeRun();
  const boss = addEnemy(run, 'giant_tomato', 0.85);
  const { events } = resolveVolley(run, CH1, normal(7));
  const shots = events.filter((e) => e.type === 'shot');
  assert.equal(shots.length, 7);
  assert.equal(boss.hp, 24 - 7);
  assert.ok(shots.every((s) => !s.isBonus && s.damage === 1));
});

test('2 big + 3 normal: 5 shots, 9 base damage (big = one shot of 3)', () => {
  const run = makeRun();
  const boss = addEnemy(run, 'giant_tomato', 0.85);
  const { events } = resolveVolley(run, CH1, [...big(2), ...normal(3)]);
  assert.equal(events.filter((e) => e.type === 'shot').length, 5);
  assert.equal(24 - boss.hp, 9);
});

test('no shot is wasted on a dead enemy; queue closes when nobody is left', () => {
  const run = makeRun();
  const a = addEnemy(run, 'egg', 0.8, 0.3); // 2 HP
  const b = addEnemy(run, 'egg', 0.85, 0.7); // 2 HP
  const { events } = resolveVolley(run, CH1, normal(7));
  const shots = events.filter((e) => e.type === 'shot');
  assert.equal(shots.length, 4);
  assert.ok(events.some((e) => e.type === 'fizzle'));
  assert.ok(a.dead && b.dead);
  for (const s of shots) assert.ok(s.hp >= 0);
});

test('target priority: contact threat first, then speed, then left-most', () => {
  const run = makeRun();
  const far = addEnemy(run, 'tomato', 0.8, 0.3);
  const fastPepper = addEnemy(run, 'pepper', 0.7, 0.5);
  const threat = addEnemy(run, 'tomato', 0.29, 0.7); // next step reaches x<=0.2
  assert.equal(selectTarget(run).id, threat.id);
  threat.dead = true;
  assert.equal(selectTarget(run).id, fastPepper.id);
  fastPepper.dead = true;
  assert.equal(selectTarget(run).id, far.id);
});

test('armor: shield absorbs before HP for normal and big oil; HP never negative', () => {
  const run = makeRun(CH2);
  const ap = addEnemy(run, 'armored_potato', 0.8);
  let r = applyDamage(ap, 1);
  assert.deepEqual([ap.shield, ap.hp, r.hpDmg], [1, 7, 0]);
  r = applyDamage(ap, 3); // big oil: 1 to shield, 2 to HP
  assert.deepEqual([ap.shield, ap.hp, r.shieldDmg, r.hpDmg, r.shieldBroken], [0, 5, 1, 2, true]);
  applyDamage(ap, 99);
  assert.equal(ap.hp, 0);
  ap.dead = true;
  const king = addEnemy(run, 'potato_king', 0.8);
  resolveVolley(run, CH2, normal(4));
  assert.deepEqual([king.shield, king.hp], [0, 36], 'four normal oils only break the 4-point shell');
});

test('three enemies dying in the same volley are counted once each (recipe +1 each)', () => {
  const run = makeRun();
  run.abilities.pan_burst = 2;
  run.abilities.tomato_splash = 2;
  run.abilities.pan_echo = 1;
  const t1 = addEnemy(run, 'tomato', 0.5, 0.3, { hp: 1 });
  const t2 = addEnemy(run, 'tomato', 0.52, 0.5, { hp: 1 });
  const t3 = addEnemy(run, 'tomato', 0.54, 0.7, { hp: 1 });
  const { events } = resolveVolley(run, CH1, normal(7));
  const kills = events.filter((e) => e.type === 'kill');
  assert.equal(kills.length, 3);
  assert.equal(new Set(kills.map((k) => k.id)).size, 3);
  assert.equal(run.recipe.tomato, 3);
  assert.ok([t1, t2, t3].every((e) => e.dead && e.counted));
  // extra calls can never re-count
  resolveVolley(run, CH1, normal(3));
  assert.equal(run.recipe.tomato, 3);
});

test('secondary chain cap: at most 12 secondary damage events per turn, no infinite loop', () => {
  const run = makeRun();
  run.abilities = { pan_burst: 2, tomato_splash: 2, pan_echo: 1, double_shot: 2 };
  for (let i = 0; i < 8; i++) addEnemy(run, 'tomato_minion', 0.5 + (i % 4) * 0.03, 0.2 + i * 0.08, { hp: 1 });
  const { events } = resolveVolley(run, CH1, normal(12));
  const secondary = events.filter((e) => e.type === 'area').length + events.filter((e) => e.type === 'shot' && e.source === 'double_shot').length;
  assert.ok(secondary <= 12, `secondary=${secondary}`);
  assert.ok(run.turnSecondary <= 12);
});

test('bonus shots never trigger more bonus shots (double_shot)', () => {
  const run = makeRun();
  run.abilities.double_shot = 2; // every 4th real normal hit
  addEnemy(run, 'giant_tomato', 0.85);
  const { events } = resolveVolley(run, CH1, normal(12));
  const bonus = events.filter((e) => e.type === 'shot' && e.isBonus);
  assert.equal(bonus.length, 3);
});

test('enemy movement: only to the LEFT, only in the action phase; pepper 2 steps on its own 3rd opportunity', () => {
  const run = makeRun();
  const rng = new Rng(1);
  const t = addEnemy(run, 'tomato', 0.9, 0.3);
  const p = addEnemy(run, 'pepper', 0.9, 0.6);
  const xs = [];
  for (let turn = 1; turn <= 3; turn++) {
    const ev = enemyAction(run, rng);
    for (const m of ev.filter((e) => e.type === 'move')) assert.ok(m.toX < m.fromX, 'always leftwards');
    xs.push([+t.x.toFixed(2), +p.x.toFixed(2)]);
  }
  assert.deepEqual(xs, [[0.8, 0.8], [0.7, 0.7], [0.6, 0.5]]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((o) => stepsFor({ type: 'pepper' }, o)), [1, 1, 2, 1, 1, 2]);
  assert.deepEqual([1, 2, 3, 4].map((o) => stepsFor({ type: 'armored_potato' }, o)), [1, 0, 1, 0]);
});

test('contact: normal enemy hits for 1, leaves, is NOT counted; salt shield and start shield absorb first', () => {
  const run = makeRun();
  run.chef.saltCharges = 1;
  run.chef.shield = 1;
  const a = addEnemy(run, 'tomato', 0.2, 0.3);
  const b = addEnemy(run, 'tomato', 0.15, 0.5);
  const c = addEnemy(run, 'tomato', 0.1, 0.7);
  const ev = resolveContacts(run);
  assert.equal(ev.filter((e) => e.type === 'contact').length, 3);
  assert.deepEqual([run.chef.hp, run.stats.hpLost, run.chef.saltCharges, run.chef.shield], [4, 1, 0, 0]);
  assert.ok(a.escaped && b.escaped && c.escaped);
  assert.equal(run.recipe.tomato, 0);
});

test('potato king: 2 damage on contact and safe retreat; hastes once at 50 %', () => {
  const run = makeRun(CH2);
  const k = addEnemy(run, 'potato_king', 0.2, 0.5);
  resolveContacts(run);
  assert.equal(run.chef.hp, 3);
  assert.equal(k.x, 0.6);
  k.hp = 18;
  const ev = enemyAction(run, new Rng(1));
  assert.equal(ev.filter((e) => e.type === 'haste').length, 1);
  enemyAction(run, new Rng(1));
  assert.equal(k.hasted, true);
});

test('giant tomato summons 2 minions once at <=60 % and telegraphs its guard', () => {
  const run = makeRun();
  const g = addEnemy(run, 'giant_tomato', 0.86, 0.5);
  g.hp = 14;
  const rng = new Rng(2);
  const ev1 = enemyAction(run, rng);
  assert.equal(ev1.filter((e) => e.type === 'summon').length, 1);
  assert.equal(run.enemies.filter((e) => e.type === 'tomato_minion').length, 2);
  assert.equal(g.x, 0.86, 'summon replaces the move');
  const ev2 = enemyAction(run, rng);
  assert.equal(ev2.filter((e) => e.type === 'summon').length, 0);
  assert.ok(ev2.some((e) => e.type === 'guardWarn'));
  enemyAction(run, rng);
  assert.equal(g.guard, true);
  const r = applyDamage(g, 3);
  assert.equal(r.guarded, 1);
  assert.equal(r.hpDmg, 2);
});

test('boss victory gate: boss dies -> victory, remaining shots stop, no further events', () => {
  const run = makeRun();
  const g = addEnemy(run, 'giant_tomato', 0.21, 0.5, { hp: 2 });
  const { events, victory } = resolveVolley(run, CH1, normal(5));
  assert.equal(victory, true);
  assert.equal(events.filter((e) => e.type === 'shot').length, 2);
  assert.equal(events[events.length - 1].type, 'victory');
  assert.equal(g.hp, 0);
});

test('spawn: enemies appear on the right side at free y positions, never stacked', () => {
  const run = makeRun(CH2);
  run.wave = 6;
  const sp = spawnWave(run, CH2, new Rng(5));
  assert.equal(sp.length, 5);
  for (const e of sp) {
    assert.ok(e.x >= 0.86 && e.x <= 0.93);
    assert.ok(e.y >= 0.2 && e.y <= 0.8);
  }
  for (let i = 0; i < sp.length; i++)
    for (let j = i + 1; j < sp.length; j++) assert.ok(Math.hypot((sp[i].x - sp[j].x) * 0.6, sp[i].y - sp[j].y) > 0.05);
});
