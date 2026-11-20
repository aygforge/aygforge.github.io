// QA 11 — 16 yeteneğin HER BİRİ için ölçülebilir etki + teklif/uygunluk kuralları.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ABILITIES } from '../../src/data/content.js';
import { resolveVolley, buildShots } from '../../src/systems/CombatResolver.js';
import { applyAbility, ladleParams, makeOffer, eligiblePool } from '../../src/systems/Abilities.js';
import { resolveContacts } from '../../src/systems/EnemyDirector.js';
import { Rng } from '../../src/core/rng.js';
import { PotPhysics } from '../../src/systems/PotPhysics.js';
import { LadleController } from '../../src/systems/LadleController.js';
import { makeRun, addEnemy, normal, big, CH1, CH2 } from './helpers.mjs';

const dmgTo = (run, shots, ch = CH1) => {
  const boss = run.enemies.find((e) => e.boss) || addEnemy(run, 'giant_tomato', 0.85);
  const before = boss.hp + boss.shield;
  resolveVolley(run, ch, shots);
  return before - boss.hp - boss.shield;
};

test('all 16 abilities exist with the GDD max stacks', () => {
  const want = { wide_ladle: 3, deep_ladle: 3, slow_swing: 2, stable_rim: 2, double_shot: 2, heavy_oil: 2, power_shot: 3, last_drop: 1, first_bite: 2, thick_apron: 2, first_aid: 1, salt_shield: 2, pan_burst: 2, tomato_splash: 2, chain_cooking: 1, pan_echo: 1 };
  assert.equal(ABILITIES.length, 16);
  for (const a of ABILITIES) assert.equal(a.max, want[a.id], a.id);
});

test('wide_ladle: +12 % physical mouth per stack (real collider geometry)', () => {
  const run = makeRun();
  const r0 = ladleParams(run).radius;
  applyAbility(run, CH1, 'wide_ladle');
  assert.equal(ladleParams(run).radius, +(r0 * 1.12).toFixed(3));
  const pot = new PotPhysics(new Rng(1));
  const l = new LadleController(pot);
  l.configure(ladleParams(run));
  assert.equal(pot.ladleShape.radius, ladleParams(run).radius);
});

test('deep_ladle: capacity +1 (used by the physical catch limit)', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'deep_ladle');
  assert.equal(ladleParams(run).capacity, 8);
});

test('slow_swing: swing speed -12 % (period / 0.88)', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'slow_swing');
  assert.equal(ladleParams(run).period, +(2 / 0.88).toFixed(4));
});

test('stable_rim: rim lip +10 % (geometry)', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'stable_rim');
  assert.equal(ladleParams(run).rimLift, 0.4);
  const pot = new PotPhysics(new Rng(1));
  new LadleController(pot).configure(ladleParams(run));
  assert.ok(pot.ladleShape.rimH > 0.39 * pot.ladleShape.radius);
});

test('double_shot: 1 bonus per 5 real normal hits (stack 2: per 4)', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'double_shot');
  assert.equal(dmgTo(run, normal(10)), 12);
});

test('heavy_oil: big oil +1 damage', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'heavy_oil');
  assert.equal(dmgTo(run, big(2)), 8);
});

test('power_shot: every 4th normal shot +1 (stack 3: every 3rd +2)', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'power_shot');
  assert.equal(dmgTo(run, normal(8)), 10);
  const run3 = makeRun();
  run3.abilities.power_shot = 3;
  assert.equal(dmgTo(run3, normal(6)), 10);
});

test('last_drop: the last normal oil of the volley +2', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'last_drop');
  assert.equal(dmgTo(run, [...normal(3), ...big(1)]), 3 + 2 + 3);
});

test('first_bite: first hit of each turn +1', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'first_bite');
  assert.equal(dmgTo(run, normal(3)), 4);
  assert.equal(dmgTo(run, normal(3)), 4, 'resets every turn');
});

test('thick_apron: max HP +1 and current HP +1', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'thick_apron');
  assert.deepEqual([run.chef.hp, run.chef.maxHp], [6, 6]);
});

test('first_aid: heals 2, never above max; only offered when injured', () => {
  const run = makeRun();
  assert.ok(!eligiblePool(run, CH1).some((a) => a.id === 'first_aid'));
  run.chef.hp = 4;
  assert.ok(eligiblePool(run, CH1).some((a) => a.id === 'first_aid'));
  applyAbility(run, CH1, 'first_aid');
  assert.equal(run.chef.hp, 5);
});

test('salt_shield: next contact damage -1', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'salt_shield');
  addEnemy(run, 'tomato', 0.2);
  resolveContacts(run);
  assert.equal(run.chef.hp, 5);
  assert.equal(run.chef.saltCharges, 0);
});

test('pan_burst: every 3rd kill in a turn deals area damage nearby', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'pan_burst');
  for (let i = 0; i < 3; i++) addEnemy(run, 'egg', 0.6, 0.3 + i * 0.1, { hp: 1 });
  const near = addEnemy(run, 'tomato', 0.62, 0.65, { hp: 4 });
  const { events } = resolveVolley(run, CH1, normal(3));
  assert.ok(events.some((e) => e.type === 'area' && e.source === 'pan_burst'));
  assert.equal(near.hp, 3);
});

test('tomato_splash: a cooked tomato hits the nearest living enemy; not offered without tomatoes', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'tomato_splash');
  addEnemy(run, 'tomato', 0.3, 0.5, { hp: 1 });
  const p = addEnemy(run, 'pepper', 0.6, 0.5);
  resolveVolley(run, CH1, normal(1));
  assert.equal(p.hp, 2);
  const run2 = makeRun(CH2);
  assert.ok(!eligiblePool(run2, CH2).some((a) => a.id === 'tomato_splash'));
  assert.equal(applyAbility(run2, CH2, 'tomato_splash'), false);
});

test('chain_cooking: >=3 kills in a turn -> +1 bonus normal oil in the next volley', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'chain_cooking');
  for (let i = 0; i < 3; i++) addEnemy(run, 'egg', 0.6, 0.3 + i * 0.2, { hp: 1 });
  resolveVolley(run, CH1, normal(3));
  assert.equal(run.pending.chain, 1);
  const shots = buildShots(run, [{ id: 1, type: 'normal' }]);
  assert.deepEqual(shots[0], { oil: 'normal', isBonus: true, source: 'chain_cooking' });
  assert.equal(run.pending.chain, 0);
});

test('pan_echo: first kill of a wave hits a nearby enemy once per wave', () => {
  const run = makeRun();
  applyAbility(run, CH1, 'pan_echo');
  addEnemy(run, 'egg', 0.5, 0.5, { hp: 1 });
  addEnemy(run, 'egg', 0.55, 0.3, { hp: 1 });
  const t = addEnemy(run, 'tomato', 0.6, 0.6);
  const { events } = resolveVolley(run, CH1, normal(2));
  assert.equal(events.filter((e) => e.source === 'pan_echo').length, 1);
  assert.ok(t.hp < 4);
});

test('offers: 3 eligible cards, >=2 families, reroll never repeats the same set, maxed abilities excluded', () => {
  const rng = new Rng(11);
  for (let i = 0; i < 200; i++) {
    const run = makeRun(i % 2 ? CH1 : CH2);
    run.abilities.last_drop = 1;
    const ch = i % 2 ? CH1 : CH2;
    const o = makeOffer(run, ch, rng);
    assert.equal(o.length, 3);
    assert.equal(new Set(o).size, 3);
    assert.ok(!o.includes('last_drop'));
    if (ch === CH2) assert.ok(!o.includes('tomato_splash'));
    assert.ok(!o.includes('first_aid'), 'healthy chef');
    const fam = new Set(o.map((id) => ABILITIES.find((a) => a.id === id).cat));
    assert.ok(fam.size >= 2);
    const r = makeOffer(run, ch, rng, o);
    assert.notEqual(r.slice().sort().join(), o.slice().sort().join());
  }
});
