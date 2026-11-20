// QA 2, 3, 5 — gerçek Matter.js fiziği ile kepçe ve hibrit tencere.
import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { Rng } from '../../src/core/rng.js';
import { PotPhysics, POT_GEOM, floorY } from '../../src/systems/PotPhysics.js';
import { LadleController } from '../../src/systems/LadleController.js';
import { POT } from '../../src/data/content.js';
import { buildShots, resolveVolley } from '../../src/systems/CombatResolver.js';
import { makeRun, addEnemy, CH1 } from './helpers.mjs';

const PARAMS = { radius: 44, rimLift: 0.3, capacity: 7, period: 2 };

function dropAt(pot, ladle, x) {
  // drive the swing until the ladle is at x (deterministic), then drop
  ladle.startSwing();
  let guard = 0;
  while (Math.abs(pot.ladlePose.x - x) > 4 && guard++ < 400) ladle.step();
  assert.ok(ladle.drop());
  let n = 0;
  while (ladle.step() !== 'CAUGHT') assert.ok(n++ < 400, 'claw sequence must finish');
  return ladle.resolveCatch();
}

function emptyPot(seed = 1) {
  const pot = new PotPhysics(new Rng(seed));
  const ladle = new LadleController(pot);
  ladle.configure(PARAMS);
  return { pot, ladle };
}

function placeCluster(pot, cx, types) {
  // place balls in a compact heap resting on the floor around cx (no randomness)
  let i = 0;
  for (let row = 0; i < types.length; row++) {
    for (let c = -2; c <= 2 && i < types.length; c++, i++) {
      const x = cx + c * 25 + (row % 2) * 12;
      pot._makeBall(types[i], x, floorY(x) - 20 - row * 26);
    }
  }
  pot.settle(120);
}

test('timing matters through real physics: drop over the heap vs over an empty side', () => {
  const a = emptyPot(3);
  placeCluster(a.pot, POT_GEOM.W / 2, Array(14).fill('normal'));
  const good = dropAt(a.pot, a.ladle, POT_GEOM.W / 2);
  const b = emptyPot(3);
  placeCluster(b.pot, POT_GEOM.W / 2, Array(14).fill('normal'));
  const bad = dropAt(b.pot, b.ladle, POT_GEOM.W / 2 - b.ladle.amp + 2);
  assert.ok(good.caught.length >= 4, `good drop caught ${good.caught.length}`);
  assert.ok(bad.caught.length <= 1, `bad drop caught ${bad.caught.length}`);
  // caught balls are really removed from the world, nothing else changes
  assert.equal(a.pot.count, 14 - good.caught.length);
});

test('same seed + same tap step => same catch (determinism)', () => {
  const run = () => {
    const pot = new PotPhysics(new Rng(77));
    pot.fillInitial(30, 0.05);
    const l = new LadleController(pot);
    l.configure(PARAMS);
    l.startSwing();
    for (let i = 0; i < 41; i++) l.step();
    l.drop();
    while (l.step() !== 'CAUGHT');
    return l.resolveCatch().caught.map((b) => b.id).join(',');
  };
  assert.equal(run(), run());
});

test('0 balls caught -> guarantee drop (bonus, not from the pot)', () => {
  const { pot, ladle } = emptyPot();
  const res = dropAt(pot, ladle, POT_GEOM.W / 2);
  assert.equal(res.caught.length, 0);
  const run = makeRun();
  const shots = buildShots(run, res.caught);
  assert.deepEqual(shots, [{ oil: 'normal', isBonus: true, canProc: false, source: 'guarantee' }]);
  assert.equal(pot.count, 0, 'pot count unaffected');
});

test('physical catch of 2 big + 3 normal: load 7, 5 shots, 9 base damage', () => {
  const { pot, ladle } = emptyPot();
  // Alpha 0.3 pot: the small heap settles between the centre ridges; use the widest legal ladle
  // (Kepçe Genişliği Sv6 x Geniş Kepçe III = 42 * 1.25 * 1.36 ≈ 71 px) so all five balls are physically scooped
  ladle.configure({ ...PARAMS, radius: 70 });
  const cx = POT_GEOM.W / 2;
  // a tight heap exactly under the ladle
  pot._makeBall('big', cx - 14, floorY(cx) - 20);
  pot._makeBall('big', cx + 14, floorY(cx) - 20);
  pot._makeBall('normal', cx, floorY(cx) - 46);
  pot._makeBall('normal', cx - 22, floorY(cx) - 52);
  pot._makeBall('normal', cx + 22, floorY(cx) - 52);
  pot.settle(90);
  const res = dropAt(pot, ladle, cx);
  assert.equal(res.caught.length, 5, 'five physical balls');
  assert.equal(res.load, 7, 'capacity units 2*2 + 3*1');
  const run = makeRun();
  addEnemy(run, 'giant_tomato', 0.85, 0.5);
  const shots = buildShots(run, res.caught);
  assert.equal(shots.length, 5);
  const before = run.enemies[0].hp;
  resolveVolley(run, CH1, shots);
  assert.equal(before - run.enemies[0].hp, 9);
});

test('capacity overflow: excess balls physically spill back into the pot', () => {
  const { pot, ladle } = emptyPot();
  placeCluster(pot, POT_GEOM.W / 2, Array(16).fill('normal'));
  const n0 = pot.count;
  const res = dropAt(pot, ladle, POT_GEOM.W / 2);
  assert.ok(res.load <= 7);
  assert.equal(pot.count, n0 - res.caught.length, 'spilled balls stay in the pot');
  for (let i = 0; i < 120; i++) ladle.step();
  for (const b of pot.balls.values()) {
    assert.ok(b.position.y > 0 && b.position.y < POT_GEOM.D + 5, 'every remaining ball is back inside the pot');
  }
});

test('ladle width upgrade changes the physical bowl radius', () => {
  const { pot, ladle } = emptyPot();
  ladle.configure({ ...PARAMS, radius: 55 });
  assert.equal(pot.ladleShape.radius, 55);
  const xs = pot.ladleParts.map((p) => p.position.x);
  ladle.configure({ ...PARAMS, radius: 44 });
  const xs2 = pot.ladleParts.map((p) => p.position.x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > Math.max(...xs2) - Math.min(...xs2));
});

test('hybrid refill formula (Alpha 0.3 counts 24/20/30/5): remain kept, min target 20, max 30, at least 5 added', () => {
  // same formula as GDD v1.0: add = min(max-remain, max(minAdd, minTarget-remain))
  assert.deepEqual([POT.startCount, POT.minTarget, POT.maxCount, POT.minAdd], [24, 20, 30, 5]);
  assert.deepEqual(PotPhysics.refillAmount(25), { remain: 25, add: 5, next: 30 });
  assert.deepEqual(PotPhysics.refillAmount(19), { remain: 19, add: 5, next: 24 });
  assert.deepEqual(PotPhysics.refillAmount(10), { remain: 10, add: 10, next: 20 });
  assert.deepEqual(PotPhysics.refillAmount(30), { remain: 30, add: 0, next: 30 });
  assert.deepEqual(PotPhysics.refillAmount(28), { remain: 28, add: 2, next: 30 });
  assert.deepEqual(PotPhysics.refillAmount(0), { remain: 0, add: 20, next: 20 });
});

test('hybrid pot: uncaught balls keep their identity, nothing is regenerated, never above 36', () => {
  const pot = new PotPhysics(new Rng(9));
  pot.fillInitial(30, 0.05);
  const ladle = new LadleController(pot);
  ladle.configure(PARAMS);
  for (let turn = 0; turn < 12; turn++) {
    const before = new Map([...pot.balls].map(([id, b]) => [id, { x: b.position.x, t: b.oilType }]));
    const res = dropAt(pot, ladle, POT_GEOM.W / 2 + ((turn % 5) - 2) * 50);
    const caughtIds = new Set(res.caught.map((b) => b.id));
    for (const id of before.keys()) {
      if (caughtIds.has(id)) assert.ok(!pot.balls.has(id));
      else assert.ok(pot.balls.has(id), `ball ${id} must survive`);
    }
    for (let i = 0; i < 30; i++) ladle.step();
    const r = pot.refill(0.05);
    assert.equal(r.remain, before.size - res.caught.length);
    for (let i = 0; i < 60; i++) pot.step();
    assert.ok(pot.count <= POT.maxCount, 'max');
    assert.ok(pot.count >= Math.min(POT.maxCount, Math.max(POT.minTarget, r.remain + POT.minAdd)), 'refill reaches its target (incl. queued)');
    for (const [id, b] of pot.balls) if (before.has(id)) assert.equal(b.oilType, before.get(id).t);
  }
});

test('refill never overlaps colliders: queued balls wait when there is no room', () => {
  const pot = new PotPhysics(new Rng(4));
  pot.fillInitial(36, 0.05);
  // force an impossible request: fill the upper area
  for (let i = 0; i < 20; i++) pot.pendingAdds.push('normal');
  pot.placePending(20);
  const bodies = [...pot.balls.values()];
  for (let i = 0; i < bodies.length; i++)
    for (let j = i + 1; j < bodies.length; j++) {
      const d = Matter.Vector.magnitude(Matter.Vector.sub(bodies[i].position, bodies[j].position));
      assert.ok(d > bodies[i].circleRadius + bodies[j].circleRadius - 6, 'no heavy overlap at spawn');
    }
});
