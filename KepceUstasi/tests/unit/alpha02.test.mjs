// Alpha 0.2 — yeni 8 yetenek (her seviye), çoklu atış güvenliği, dondurma/geri itme zamanlaması, karşılık hasarı,
// tencere karıştırma, soğuk sos fiziği, kayıt geçişi (Alpha 0.1 → 0.2) ve deterministik tekrar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ABILITIES, ABILITY_VALUES, FIELD, OILS } from '../../src/data/content.js';
import { resolveVolley, buildShots } from '../../src/systems/CombatResolver.js';
import { enemyAction, resolveContacts } from '../../src/systems/EnemyDirector.js';
import { makeOffer, cardInfo, applyAbility } from '../../src/systems/Abilities.js';
import { RunController, PHASE, migrateRunState } from '../../src/systems/RunController.js';
import { PotPhysics } from '../../src/systems/PotPhysics.js';
import { SaveService, defaultSave } from '../../src/systems/SaveService.js';
import { permStats } from '../../src/systems/Progression.js';
import { STEP_MS } from '../../src/systems/PotPhysics.js';
import { Rng } from '../../src/core/rng.js';
import { simulateRun } from '../sim/simlib.mjs';
import { makeRun, addEnemy, normal, big, CH1, CH2, memStorage } from './helpers.mjs';

const BIG = { hp: 999, maxHp: 999 };

test('card data: every ability has values for every level and the card text is generated from them', () => {
  for (const a of ABILITIES) {
    assert.ok(ABILITY_VALUES[a.id], `${a.id} has mechanic values`);
    for (let l = 1; l <= a.max; l++) {
      const t = a.desc(l);
      assert.ok(typeof t === 'string' && t.length > 8, `${a.id} L${l}`);
    }
  }
  // spot checks: the number on the card is the number the code uses
  assert.match(ABILITIES.find((a) => a.id === 'critical_fry').desc(1), /%15/);
  assert.match(ABILITIES.find((a) => a.id === 'critical_fry').desc(2), /%25/);
  assert.match(ABILITIES.find((a) => a.id === 'explosive_oil').desc(2), /Her 3\./);
  assert.match(ABILITIES.find((a) => a.id === 'oil_knockback').desc(1), /Her 5\./);
  assert.match(ABILITIES.find((a) => a.id === 'tasty_heal').desc(2), /Her 8 /);
  assert.match(ABILITIES.find((a) => a.id === 'spiked_apron').desc(2), /3 karşılık/);
  assert.match(ABILITIES.find((a) => a.id === 'piercing_oil').desc(1), /Her 4\./);
  const run = makeRun();
  run.abilities.critical_fry = 1;
  const info = cardInfo(run, 'critical_fry');
  assert.deepEqual([info.level, info.nextLevel, info.max], [1, 2, 2]);
  assert.match(info.now, /%15/);
  assert.match(info.next, /%25/);
});

for (const [level, chance] of [[1, 0.15], [2, 0.25]]) {
  test(`critical_fry Lv${level}: ~${chance * 100}% real shots crit for 2x, deterministic per seed, bonus shots never crit`, () => {
    const run = makeRun();
    run.abilities.critical_fry = level;
    run.abilities.double_shot = 1;
    addEnemy(run, 'giant_tomato', 0.85, 0.5, { hp: 1e6, maxHp: 1e6 });
    let crits = 0;
    let real = 0;
    const seq = [];
    for (let v = 0; v < 200; v++) {
      const { events } = resolveVolley(run, CH1, [...normal(9), ...big(1)]);
      for (const e of events.filter((x) => x.type === 'shot')) {
        if (e.isBonus) assert.equal(e.crit, false);
        else {
          real++;
          if (e.crit) crits++;
          seq.push(e.crit ? 1 : 0);
          const base = e.oil === 'big' ? 3 : 1;
          assert.equal(e.damage, e.crit ? base * 2 : base);
        }
      }
    }
    const rate = crits / real;
    assert.ok(Math.abs(rate - chance) < 0.035, `rate ${rate}`);
    // same seed -> same crit sequence
    const run2 = makeRun();
    run2.abilities.critical_fry = level;
    run2.abilities.double_shot = 1;
    addEnemy(run2, 'giant_tomato', 0.85, 0.5, { hp: 1e6, maxHp: 1e6 });
    const seq2 = [];
    for (let v = 0; v < 200; v++) for (const e of resolveVolley(run2, CH1, [...normal(9), ...big(1)]).events) if (e.type === 'shot' && !e.isBonus) seq2.push(e.crit ? 1 : 0);
    assert.deepEqual(seq2, seq);
  });
}

for (const [level, every] of [[1, 4], [2, 3]]) {
  test(`explosive_oil Lv${level}: every ${every}th real hit damages up to 2 nearby enemies, explosions never chain`, () => {
    const run = makeRun();
    run.abilities.explosive_oil = level;
    const main = addEnemy(run, 'giant_tomato', 0.5, 0.5, { hp: 500, maxHp: 500 });
    const n1 = addEnemy(run, 'tomato', 0.6, 0.45, BIG);
    const n2 = addEnemy(run, 'tomato', 0.6, 0.55, BIG);
    const n3 = addEnemy(run, 'tomato', 0.62, 0.7, BIG);
    const shots = [...normal(12), ...normal(6, { isBonus: true, canProc: false, source: 'double_shot' })];
    const { events } = resolveVolley(run, CH1, shots);
    const ex = events.filter((e) => e.type === 'explosion');
    assert.equal(ex.length, Math.floor(12 / every), 'only real hits count');
    const hits = events.filter((e) => e.type === 'area' && e.source === 'explosive_oil');
    assert.equal(hits.length, ex.length * 2, 'max 2 targets each');
    assert.ok(hits.every((h) => h.targetId !== main.id));
    assert.equal(n1.maxHp - n1.hp + (n2.maxHp - n2.hp) + (n3.maxHp - n3.hp), hits.length);
  });
}

for (const [level, every] of [[1, 5], [2, 4]]) {
  test(`oil_knockback Lv${level}: every ${every}th real hit pushes a normal enemy 1 step right (hit effect), boss takes +1 instead`, () => {
    const run = makeRun();
    run.abilities.oil_knockback = level;
    const t = addEnemy(run, 'tomato', 0.5, 0.5, BIG);
    const { events } = resolveVolley(run, CH1, normal(every * 2));
    const kb = events.filter((e) => e.type === 'knockback');
    assert.equal(kb.length, 2);
    assert.ok(kb.every((k) => k.toX > k.fromX && k.toX <= FIELD.knockbackMaxX));
    assert.equal(t.x, 0.7);
    // clamp
    t.x = 0.9;
    resolveVolley(run, CH1, normal(every));
    assert.equal(t.x, FIELD.knockbackMaxX);
    // boss: never moved, +1 damage
    const run2 = makeRun();
    run2.abilities.oil_knockback = level;
    const boss = addEnemy(run2, 'giant_tomato', 0.5, 0.5, { hp: 100, maxHp: 100 });
    const ev2 = resolveVolley(run2, CH1, normal(every)).events;
    assert.equal(boss.x, 0.5);
    assert.equal(ev2.filter((e) => e.type === 'area' && e.source === 'knockback_boss').length, 1);
    assert.equal(boss.hp, 100 - every - 1);
    // the enemy's own move phase is still strictly leftwards
    const before = t.x;
    enemyAction(run, new Rng(1));
    assert.ok(t.x < before);
  });
}

for (const [level, need] of [[1, 10], [2, 8]]) {
  test(`tasty_heal Lv${level}: +1 HP per ${need} real HP damage, max 1 per volley, no banking`, () => {
    const run = makeRun();
    run.abilities.tasty_heal = level;
    run.chef.hp = 2;
    addEnemy(run, 'giant_tomato', 0.85, 0.5, { hp: 500, maxHp: 500 });
    let ev = resolveVolley(run, CH1, normal(need - 1)).events;
    assert.equal(run.chef.hp, 2);
    ev = resolveVolley(run, CH1, normal(1)).events;
    assert.equal(run.chef.hp, 3);
    assert.equal(ev.filter((e) => e.type === 'heal').length, 1);
    ev = resolveVolley(run, CH1, normal(need * 3)).events; // 3x the need in ONE volley -> still +1
    assert.equal(run.chef.hp, 4);
    assert.ok(run.counters.healDmg < need, 'no banking of extra heals');
    run.chef.hp = run.chef.maxHp;
    resolveVolley(run, CH1, normal(need));
    assert.equal(run.chef.hp, run.chef.maxHp, 'never above max');
  });
}

for (const [level, dmg] of [[1, 2], [2, 3]]) {
  test(`spiked_apron Lv${level}: ${dmg} reflect damage; a normal enemy killed by it is counted once (not escaped)`, () => {
    const run = makeRun();
    run.abilities.spiked_apron = level;
    const weak = addEnemy(run, 'tomato', 0.2, 0.3, { hp: dmg });
    const strong = addEnemy(run, 'tomato', 0.2, 0.7, { hp: 10, maxHp: 10 });
    const ev = resolveContacts(run, CH1);
    assert.equal(run.chef.hp, 3);
    assert.ok(weak.dead && !weak.escaped && weak.counted);
    assert.equal(run.recipe.tomato, 1);
    assert.equal(ev.filter((e) => e.type === 'kill').length, 1);
    assert.ok(strong.escaped && !strong.dead);
    assert.equal(strong.hp, 10 - dmg);
    assert.equal(run.stats.escaped, 1);
  });
}

test('spiked_apron vs boss: reflect can win the fight; victory gate first, no later contact', () => {
  const run = makeRun();
  run.abilities.spiked_apron = 2;
  const boss = addEnemy(run, 'giant_tomato', 0.2, 0.5, { hp: 3 });
  const late = addEnemy(run, 'tomato', 0.2, 0.7);
  const ev = resolveContacts(run, CH1);
  assert.ok(boss.dead);
  assert.equal(ev.at(-1).type, 'victory');
  assert.ok(!late.escaped, 'the following contact is not processed after the victory');
  assert.equal(run.chef.hp, 4);
});

for (const [level, every] of [[1, 4], [2, 3]]) {
  test(`piercing_oil Lv${level}: every ${every}th real shot also hits the enemy behind for 1`, () => {
    const run = makeRun();
    run.abilities.piercing_oil = level;
    const front = addEnemy(run, 'tomato', 0.3, 0.5, BIG);
    const back = addEnemy(run, 'tomato', 0.7, 0.55, BIG);
    const { events } = resolveVolley(run, CH1, normal(every * 2));
    const p = events.filter((e) => e.source === 'piercing_oil');
    assert.equal(p.length, 2);
    assert.ok(p.every((x) => x.targetId === back.id));
    assert.equal(back.maxHp - back.hp, 2);
    assert.equal(front.maxHp - front.hp, every * 2);
    // Alpha 0.3: nobody behind (e.g. the boss alone) -> the oil drills through the target: +1, never silently lost
    const run2 = makeRun();
    run2.abilities.piercing_oil = level;
    const boss = addEnemy(run2, 'giant_tomato', 0.9, 0.5, { hp: 100, maxHp: 100 });
    const ev2 = resolveVolley(run2, CH1, normal(every)).events;
    assert.equal(ev2.filter((e) => e.type === 'pierceMiss').length, 0);
    const drill = ev2.filter((e) => e.source === 'piercing_oil' && e.drill);
    assert.equal(drill.length, 1);
    assert.equal(drill[0].targetId, boss.id);
    assert.equal(boss.hp, 100 - every - 1);
  });
}

test('cold_oil: a real physical pot ball type; rolled only when owned; freezes the hit enemy for exactly one move', () => {
  const pot = new PotPhysics(new Rng(3));
  pot.fillInitial(20, 0.05);
  for (let i = 0; i < 10; i++) pot.refill(0.05, 0);
  assert.equal(pot.countByType().cold, 0, 'no cold balls without the card');
  const pot2 = new PotPhysics(new Rng(3));
  pot2.fillInitial(10, 0.05);
  let added = 0;
  for (let i = 0; i < 6; i++) {
    added += pot2.refill(0.05, 0.3).add;
    pot2.settle(60);
  }
  const cold = [...pot2.balls.values()].filter((b) => b.oilType === 'cold');
  assert.ok(cold.length > 0 && cold.length < added, 'some new balls are cold');
  assert.equal(cold[0].circleRadius, OILS.cold.radius);
  assert.equal(OILS.cold.load, 1);

  const run = makeRun();
  const t = addEnemy(run, 'tomato', 0.6, 0.5, BIG);
  const ev = resolveVolley(run, CH1, buildShots(run, [{ id: 1, type: 'cold' }])).events;
  assert.ok(ev.some((e) => e.type === 'freeze' && e.id === t.id));
  assert.equal(t.hp, t.maxHp - 1);
  const rng = new Rng(1);
  let a = enemyAction(run, rng);
  assert.ok(a.some((e) => e.type === 'frozenSkip'));
  assert.equal(t.x, 0.6);
  assert.equal(t.moveOpp, 0, 'the skipped opportunity does not count');
  a = enemyAction(run, rng);
  assert.equal(+t.x.toFixed(2), 0.5, 'moves again the next phase');
});

test('cold_oil vs boss: at most one freeze per 3 boss actions (no permanent lock)', () => {
  const run = makeRun();
  const boss = addEnemy(run, 'giant_tomato', 0.85, 0.5, { hp: 999, maxHp: 999 });
  const rng = new Rng(2);
  let frozenTurns = 0;
  for (let turn = 0; turn < 12; turn++) {
    resolveVolley(run, CH1, buildShots(run, [{ id: 1, type: 'cold' }, { id: 2, type: 'cold' }]));
    const ev = enemyAction(run, rng);
    if (ev.some((e) => e.type === 'frozenSkip')) frozenTurns++;
    boss.x = 0.85;
  }
  assert.ok(frozenTurns >= 3 && frozenTurns <= 4, `frozen ${frozenTurns}/12`);
});

test('multi-shot never duplicates physical balls; bonus labels are correct', () => {
  const run = makeRun();
  run.abilities.double_shot = 2;
  addEnemy(run, 'giant_tomato', 0.85, 0.5, { hp: 999, maxHp: 999 });
  const caught = [{ id: 11, type: 'normal' }, { id: 12, type: 'big' }, { id: 13, type: 'normal' }];
  const shots = buildShots(run, caught);
  assert.equal(shots.filter((s) => s.source === 'pot').length, 3);
  const { events } = resolveVolley(run, CH1, shots);
  const s = events.filter((e) => e.type === 'shot');
  assert.equal(s.filter((e) => !e.isBonus).length, 3);
  assert.equal(s.filter((e) => e.isBonus && e.source === 'double_shot').length, 2);
});

test('pot_shuffle: physical impulse only, ids/types kept, no turn used, once per wave, only with the card and while swinging', () => {
  const c = new RunController({ chapterId: 'menemen', perm: permStats(defaultSave()), seed: 4, runId: 's', autoAck: true });
  c.start();
  while (c.phase !== PHASE.SWING_WAIT) c.update(STEP_MS + 0.001);
  assert.equal(c.shufflePot(), false, 'no card -> refused');
  c.run.abilities.pot_shuffle = 1;
  for (let i = 0; i < 10; i++) c.update(STEP_MS + 0.001);
  const before = [...c.pot.balls.values()].map((b) => `${b.ballId}:${b.oilType}`).sort();
  const vy0 = [...c.pot.balls.values()].map((b) => b.velocity.y);
  const taps = c.run.stats.taps;
  const turn = c.run.turn;
  assert.equal(c.shufflePot(), true);
  assert.equal(c.shufflePot(), false, 'once per wave');
  const after = [...c.pot.balls.values()].map((b) => `${b.ballId}:${b.oilType}`).sort();
  assert.deepEqual(after, before);
  assert.ok([...c.pot.balls.values()].some((b, i) => b.velocity.y < vy0[i] - 5), 'balls were thrown');
  assert.equal(c.phase, PHASE.SWING_WAIT);
  assert.equal(c.run.stats.taps, taps);
  assert.equal(c.run.turn, turn);
  assert.equal(c.tap(), true, 'the ladle can still be dropped normally');
  assert.equal(c.shufflePot(), false, 'not outside SWING_WAIT');
});

test('offers: a combat card in each of the first two choices; consecutive offers never identical', () => {
  const rng = new Rng(77);
  for (let i = 0; i < 300; i++) {
    const run = makeRun(i % 2 ? CH1 : CH2);
    const ch = i % 2 ? CH1 : CH2;
    run.choiceCount = 1;
    const o1 = makeOffer(run, ch, rng);
    assert.ok(o1.some((id) => ['attack', 'pan'].includes(ABILITIES.find((a) => a.id === id).cat)));
    run.lastOffer = o1;
    run.choiceCount = 3;
    const o2 = makeOffer(run, ch, rng);
    assert.notEqual(o2.slice().sort().join(), o1.slice().sort().join());
  }
});

test('maxStack respected for every ability; applying beyond max is refused', () => {
  const run = makeRun();
  run.chef.hp = 1;
  for (const a of ABILITIES) {
    if (a.eligibleTags && !a.eligibleTags.every((t) => CH1.tags.includes(t))) continue;
    for (let l = 0; l < a.max; l++) {
      if (a.requires === 'injured') run.chef.hp = 1;
      assert.ok(applyAbility(run, CH1, a.id), `${a.id} L${l + 1}`);
    }
    assert.equal(applyAbility(run, CH1, a.id), false, `${a.id} over max`);
  }
});

test('snapshot/restore is deterministic: two restores with the same taps give identical runs', () => {
  const save = defaultSave();
  const first = simulateRun({ chapterId: 'fries', seed: 9, snapshotAt: 3, pickPolicy: 'random' });
  const snap = first.log.checkpoints[2];
  const play = () => {
    const c = new RunController({ snapshot: JSON.parse(JSON.stringify(snap)), autoAck: true });
    const picks = new Rng(5);
    c.start();
    let i = 0;
    while (!c.finished && i++ < 200000) {
      if (c.phase === PHASE.SWING_WAIT && c.ladle.swingStep === 47) c.tap();
      if (c.phase === PHASE.SKILL_CHOICE) c.chooseSkill(picks.pick(c.run.offer));
      c.update(STEP_MS + 0.0001);
    }
    return JSON.stringify({ r: c.run.result, s: c.run.stats, a: c.run.abilities, crit: c.run.critRng, rec: c.run.recipe });
  };
  void save;
  assert.equal(play(), play());
});

test('Alpha 0.1 save with an old wave snapshot loads, migrates and can be played to the end', () => {
  // build a snapshot, then strip every Alpha 0.2 field to imitate an Alpha 0.1 save
  const first = simulateRun({ chapterId: 'menemen', seed: 12, snapshotAt: 2 });
  const snap = JSON.parse(JSON.stringify(first.log.checkpoints[1]));
  for (const k of ['pierce', 'explode', 'knock', 'healDmg', 'shuffleUsedThisWave']) delete snap.run.counters[k];
  for (const k of ['crits', 'cappedEvents', 'heals', 'shuffles', 'bossStartTurn']) delete snap.run.stats[k];
  delete snap.run.critRng;
  delete snap.run.offerSeq;
  delete snap.run.lastOffer;
  delete snap.run.stats.procs; // Alpha 0.3 field
  for (const e of snap.run.enemies) {
    delete e.frozen;
    delete e.lastFrozenAction;
    delete e.move; // Alpha 0.3 field
  }
  const st = memStorage();
  const save = defaultSave();
  save.activeRun = snap;
  new SaveService(st).save(save);
  const loaded = new SaveService(st).load();
  assert.ok(loaded.activeRun);
  const c = new RunController({ snapshot: loaded.activeRun, autoAck: true });
  c.start();
  assert.equal(c.run.counters.pierce, 0);
  assert.ok(c.run.critRng > 0);
  assert.equal(c.run.enemies.every((e) => e.frozen === false), true);
  let i = 0;
  while (!c.finished && i++ < 200000) {
    if (c.phase === PHASE.SWING_WAIT && c.ladle.swingStep === 50) c.tap();
    if (c.phase === PHASE.SKILL_CHOICE) c.chooseSkill(c.run.offer[0]);
    c.update(STEP_MS + 0.0001);
  }
  assert.ok(c.finished);
  assert.deepEqual(migrateRunState(JSON.parse(JSON.stringify(c.run))).counters, c.run.counters, 'migration is idempotent');
});
