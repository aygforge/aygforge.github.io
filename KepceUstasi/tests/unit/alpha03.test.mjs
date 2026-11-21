// Alpha 0.3 — yakalama hissi (taban sırtları, döküm kümeleri, zamanlama değeri), tür bazlı denge, yıldız kuralı,
// yetenek etki sayaçları ve ikincil zincir korumaları.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ABILITIES, POT, LADLE } from '../../src/data/content.js';
import { PotPhysics, POT_GEOM, floorY } from '../../src/systems/PotPhysics.js';
import { LadleController } from '../../src/systems/LadleController.js';
import { resolveVolley } from '../../src/systems/CombatResolver.js';
import { spawnWave, stepsFor } from '../../src/systems/EnemyDirector.js';
import { starsFor, STAR2_MAX_HP_LOSS } from '../../src/systems/RecipeTracker.js';
import { RunController, PHASE } from '../../src/systems/RunController.js';
import { permStats } from '../../src/systems/Progression.js';
import { defaultSave } from '../../src/systems/SaveService.js';
import { STEP_MS } from '../../src/systems/PotPhysics.js';
import { Rng } from '../../src/core/rng.js';
import { simulateRun } from '../sim/simlib.mjs';
import { makeRun, addEnemy, normal, big, CH1, CH2 } from './helpers.mjs';

const PARAMS = { radius: LADLE.radius, rimLift: LADLE.rimBase, capacity: LADLE.capacity, period: LADLE.swingPeriod };

test('pot floor has low ridges that split a centre pool from two side pools', () => {
  const c = POT_GEOM.W / 2;
  for (const r of POT_GEOM.ridges) {
    assert.ok(floorY(c + r.x) < floorY(c) - 15, 'ridge is higher than the centre pool');
    assert.ok(floorY(c + r.x) < floorY(c + r.x + Math.sign(r.x) * 30) - 5, 'ridge is higher than the side pool');
  }
  assert.deepEqual([POT.startCount, POT.minTarget, POT.maxCount, POT.minAdd], [24, 20, 30, 5]);
  assert.equal(LADLE.radius, 42);
  assert.equal(LADLE.swingPeriod, 1.7);
});

test('refill pours new oil as a seeded clump: deterministic, different spots between refills, ids preserved', () => {
  const make = () => {
    const pot = new PotPhysics(new Rng(42));
    pot.fillInitial(POT.startCount, 0.05);
    const pours = [];
    for (let i = 0; i < 6; i++) {
      for (const b of [...pot.balls.values()].slice(0, 5)) pot.removeBall(b);
      pot.refill(0.05, 0);
      pours.push(Math.round(pot.pourX));
      pot.settle(45);
    }
    return { pours, ids: [...pot.balls.keys()].join(','), xs: [...pot.balls.values()].map((b) => b.position.x.toFixed(2)).join(',') };
  };
  const a = make();
  const b = make();
  assert.deepEqual(a, b, 'same seed, same pot');
  assert.ok(new Set(a.pours.map((x) => Math.round(x / 40))).size >= 3, `pour spots vary: ${a.pours}`);
});

function catchAt(snap, tapStep, params = PARAMS) {
  const pot = new PotPhysics(new Rng(1));
  pot.restore(snap);
  const l = new LadleController(pot);
  l.configure(params);
  l.startSwing();
  for (let i = 0; i < tapStep; i++) l.step();
  l.drop();
  while (l.step() !== 'CAUGHT');
  return l.resolveCatch().load;
}

test('timing is worth something: an exact drop over the centre pool beats a 133 ms sloppy drop on average', () => {
  let exact = 0;
  let sloppy = 0;
  let n = 0;
  for (let s = 1; s <= 4; s++) {
    const pot = new PotPhysics(new Rng(100 + s));
    pot.fillInitial(POT.startCount, 0.05);
    pot.settle(60);
    const snap = pot.serialize();
    const T = Math.round((LADLE.swingPeriod * 1000) / STEP_MS);
    const centre = Math.round(T / 2); // the swing passes the centre every half period
    exact += catchAt(snap, centre);
    for (const off of [-8, 8]) {
      sloppy += catchAt(snap, centre + off) / 2;
    }
    n++;
  }
  assert.ok(exact / n >= sloppy / n + 0.8, `exact ${exact / n} vs sloppy ${sloppy / n}`);
  assert.ok(exact / n >= 5, 'a perfect drop still feels strong');
});

test('star rule: 1★ boss only; 2★ full recipe and HP loss ≤ 3; 3★ HP loss ≤ 1', () => {
  const run = makeRun();
  run.recipe = { tomato: 3, pepper: 2, egg: 1 };
  run.stats.hpLost = STAR2_MAX_HP_LOSS + 1;
  assert.equal(starsFor(run, CH1, true), 1, 'a narrow victory is 1★ even with the full recipe');
  run.stats.hpLost = STAR2_MAX_HP_LOSS;
  assert.equal(starsFor(run, CH1, true), 2);
  run.stats.hpLost = 1;
  assert.equal(starsFor(run, CH1, true), 3);
  run.recipe = { tomato: 2, pepper: 2, egg: 1 };
  assert.equal(starsFor(run, CH1, true), 1);
  assert.equal(starsFor(run, CH1, false), 0);
});

test('Patates balance: per-type HP and quick salt (moves like a pepper), Menemen unchanged', () => {
  const run = makeRun(CH2);
  run.wave = 6;
  const sp = spawnWave(run, CH2, new Rng(3));
  for (const e of sp) assert.equal(e.hp, CH2.balance.hp[e.type]);
  const salt = sp.find((e) => e.type === 'salt');
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((o) => stepsFor(salt, o)), [1, 1, 2, 1, 1, 2]);
  const r1 = makeRun(CH1);
  const m = spawnWave(r1, CH1, new Rng(3));
  for (const e of m) assert.equal(e.move, { tomato: 'one', pepper: 'pepper', egg: 'one' }[e.type]);
});

test('ability procs are counted only when the card actually did something', () => {
  const run = makeRun();
  run.abilities = { critical_fry: 2, double_shot: 1, heavy_oil: 1, piercing_oil: 1, explosive_oil: 2 };
  addEnemy(run, 'giant_tomato', 0.8, 0.5, { hp: 500, maxHp: 500 });
  resolveVolley(run, CH1, [...normal(8), ...big(1)]);
  const p = run.stats.procs;
  assert.ok(p.double_shot >= 4 && p.heavy_oil === 1 && p.piercing_oil >= 2 && p.explosive_oil === undefined, JSON.stringify(p));
  // explosive needs another enemy nearby -> nothing to hit, not counted (honest "ineffective" metric)
  const run2 = makeRun();
  run2.abilities = { tomato_splash: 1 };
  addEnemy(run2, 'giant_tomato', 0.8, 0.5, { hp: 500, maxHp: 500 });
  resolveVolley(run2, CH1, normal(5));
  assert.equal(run2.stats.procs.tomato_splash, undefined);
});

test('chain safety regression: every card maxed on a crowd terminates, respects the cap, kills/recipe once', () => {
  const run = makeRun();
  for (const a of ABILITIES) run.abilities[a.id] = a.max;
  for (let i = 0; i < 8; i++) addEnemy(run, i % 2 ? 'tomato' : 'tomato_minion', 0.4 + (i % 4) * 0.05, 0.15 + i * 0.1, { hp: 2 + (i % 3) });
  addEnemy(run, 'giant_tomato', 0.9, 0.5, { hp: 999, maxHp: 999 });
  const { events } = resolveVolley(run, CH1, [...normal(12), ...big(3)]);
  const kills = events.filter((e) => e.type === 'kill').map((e) => e.id);
  assert.equal(new Set(kills).size, kills.length);
  assert.ok(run.turnSecondary <= 40);
  assert.ok(events.filter((e) => e.type === 'shot' && e.isBonus).every((e) => !e.canProc && !e.crit));
  assert.ok(run.enemies.every((e) => e.hp >= 0 && e.shield >= 0));
  assert.equal(run.recipe.tomato, kills.filter((id) => run.enemies.find((e) => e.id === id).type !== 'giant_tomato').length);
});

test('reader bots: same seed and decisions -> identical runs (incl. shuffle, crits, cold oil)', () => {
  const a = simulateRun({ chapterId: 'fries', seed: 77, policy: 'good', pickPolicy: 'control' });
  const b = simulateRun({ chapterId: 'fries', seed: 77, policy: 'good', pickPolicy: 'control' });
  assert.equal(JSON.stringify(a.run.stats), JSON.stringify(b.run.stats));
  assert.equal(a.run.critRng, b.run.critRng);
});

test('pot_shuffle stays useful: a shuffle moves balls into new spots without adding or removing any', () => {
  const c = new RunController({ chapterId: 'menemen', perm: permStats(defaultSave()), seed: 9, runId: 'x', autoAck: true });
  c.start();
  while (c.phase !== PHASE.SWING_WAIT) c.update(STEP_MS + 0.001);
  c.run.abilities.pot_shuffle = 1;
  for (let i = 0; i < 10; i++) c.update(STEP_MS + 0.001);
  const before = new Map([...c.pot.balls].map(([id, b]) => [id, b.position.x]));
  assert.ok(c.shufflePot());
  for (let i = 0; i < 90; i++) c.pot.step();
  let moved = 0;
  for (const [id, b] of c.pot.balls) if (Math.abs(b.position.x - before.get(id)) > 12) moved++;
  assert.equal(c.pot.balls.size, before.size);
  assert.ok(moved >= before.size * 0.3, `moved ${moved}/${before.size}`);
});

test('pan_burst (every 2nd kill in a turn) and chain_cooking (2+ kills) now trigger in normal waves', () => {
  const run = makeRun();
  run.abilities = { pan_burst: 1, chain_cooking: 1 };
  addEnemy(run, 'egg', 0.6, 0.4, { hp: 1 });
  addEnemy(run, 'egg', 0.6, 0.6, { hp: 1 });
  const near = addEnemy(run, 'tomato', 0.65, 0.5, { hp: 9, maxHp: 9 });
  const { events } = resolveVolley(run, CH1, normal(2));
  assert.equal(events.filter((e) => e.source === 'pan_burst').length, 1, 'burst on the 2nd kill');
  assert.equal(near.hp, 8);
  assert.equal(run.pending.chain, 1, 'two kills feed the next volley');
});

test('pot_shuffle gathers scattered oil toward the middle pool (physically, ids kept)', () => {
  const pot = new PotPhysics(new Rng(5));
  // scatter: everything in the two side pools
  for (let i = 0; i < 20; i++) {
    const x = i % 2 ? 60 + (i % 5) * 14 : POT_GEOM.W - 60 - (i % 5) * 14;
    pot._makeBall('normal', x, floorY(x) - 20 - Math.floor(i / 10) * 26);
  }
  pot.settle(90);
  const centre = () => [...pot.balls.values()].filter((b) => Math.abs(b.position.x - POT_GEOM.W / 2) < 60).length;
  const before = centre();
  const ids = [...pot.balls.keys()].join();
  pot.shuffle();
  pot.settle(120);
  assert.equal([...pot.balls.keys()].join(), ids);
  assert.ok(centre() >= before + 4, `centre pool ${before} -> ${centre()}`);
});
