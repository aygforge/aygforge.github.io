// Alpha 0.5A.1 — tekrarlayan temas döngüsü, kalıcı yağ kuyruğu (pendingAmmo), 5 enerji giriş.
import test from 'node:test';
import assert from 'node:assert/strict';
import { enemyAction, resolveContacts } from '../../src/systems/EnemyDirector.js';
import { resolveVolley } from '../../src/systems/CombatResolver.js';
import { RunController, PHASE, migrateRunState } from '../../src/systems/RunController.js';
import { permStats } from '../../src/systems/Progression.js';
import { defaultSave, SaveService } from '../../src/systems/SaveService.js';
import { debitForRun, ENERGY } from '../../src/systems/EnergyService.js';
import { stageByLevel, dungeonById } from '../../src/data/stages.js';
import { STEP_MS } from '../../src/systems/PotPhysics.js';
import { Rng } from '../../src/core/rng.js';
import { makeRun, addEnemy, normal, CH1, memStorage } from './helpers.mjs';

test('contact loop: hit + 1 step back -> 1 step in (no hit) -> hit + back …; frozen waits; kill counts once; boss unchanged', () => {
  const run = makeRun();
  const e = addEnemy(run, 'tomato', 0.2, 0.5, { hp: 9, maxHp: 9, shield: 1, maxShield: 1 });
  const hits = [];
  const step = () => {
    enemyAction(run, new Rng(1));
    hits.push(resolveContacts(run, CH1).filter((x) => x.type === 'contact').length);
  };
  hits.push(resolveContacts(run, CH1).filter((x) => x.type === 'contact').length); // walked in: hit
  assert.deepEqual([e.x, e.contactState, e.escaped, e.shield], [0.3, 'retreated', false, 1]);
  step(); // approach to the line, no second hit this action
  assert.deepEqual([e.x, e.contactState], [0.2, 'approached']);
  step(); // strike + back
  assert.deepEqual([e.x, e.contactState], [0.3, 'retreated']);
  e.frozen = true;
  step(); // frozen: the pending approach waits
  assert.deepEqual([e.x, e.contactState], [0.3, 'retreated']);
  step();
  step();
  assert.deepEqual(hits, [1, 0, 1, 0, 0, 1]);
  assert.equal(run.chef.hp, 5 - 3);
  e.hp = 1;
  e.shield = 0;
  resolveVolley(run, CH1, normal(1));
  assert.ok(e.dead && run.recipe.tomato === 1);
  assert.equal(resolveContacts(run, CH1).length, 0, 'dead: nothing pending');
  // boss: unchanged safe retreat to retreatX
  const r2 = makeRun();
  const b = addEnemy(r2, 'giant_tomato', 0.2, 0.5);
  resolveContacts(r2, CH1);
  assert.deepEqual([b.x, b.contactState ?? null], [0.55, null]);
});

test('pendingAmmo: 7 caught (3 types), 4 used on 4 targets, 3 kept in order; no ammo used without a target', () => {
  const run = makeRun();
  for (let i = 0; i < 4; i++) addEnemy(run, 'egg', 0.6, 0.1 + i * 0.2, { hp: 1 });
  run.pendingAmmo = ['normal', 'big', 'cold', 'normal', 'big', 'cold', 'normal'].map((oil, i) => ({ oil, ballId: i + 1 }));
  const shots = [...run.pendingAmmo].map((a) => ({ oil: a.oil, isBonus: false, canProc: true, source: 'pot', ballId: a.ballId }));
  const r = resolveVolley(run, CH1, shots);
  assert.equal(r.realFired, 4);
  run.pendingAmmo.splice(0, r.realFired);
  assert.deepEqual(run.pendingAmmo.map((a) => a.oil), ['big', 'cold', 'normal']);
  assert.ok(r.events.some((e) => e.type === 'fizzle'));
});

test('pendingAmmo across waves (controller): leftover fires at the next wave before any ladle drop; snapshot keeps it; run end clears it', () => {
  const c = new RunController({ chapterId: 'L1', perm: permStats(defaultSave()), seed: 4, runId: 'ammo', autoAck: true });
  const ev = [];
  c.on((e) => ev.push(e));
  c.start();
  c.update(STEP_MS + 0.0001); // wave prep acked
  for (const e of c.run.enemies) Object.assign(e, { hp: 1, shield: 0 });
  const n = c.run.enemies.length;
  c.run.pendingAmmo = Array.from({ length: n + 3 }, (_, i) => ({ oil: ['normal', 'big', 'cold'][i % 3], ballId: 100 + i }));
  c.lastCatch = { caught: [], load: 0 };
  c.enterVolley();
  assert.equal(c.run.pendingAmmo.length, 3, 'only real hits used ammo');
  for (let i = 0; i < 50 && c.phase !== PHASE.SKILL_CHOICE; i++) c.update(STEP_MS + 0.0001);
  assert.equal(c.phase, PHASE.SKILL_CHOICE);
  c.chooseSkill(c.run.offer[0]);
  const snap = ev.filter((e) => e.kind === 'checkpoint').at(-1);
  c.update(STEP_MS + 0.0001); // wave 2 prep acked -> leftover volley, no swing in between
  const kinds = ev.slice(ev.findIndex((e) => e.kind === 'wavePrep' && e.wave === 2)).map((e) => e.kind);
  assert.ok(kinds.indexOf('volley') > -1 && (kinds.indexOf('swing') === -1 || kinds.indexOf('volley') < kinds.indexOf('swing')));
  assert.equal(c.run.pendingAmmo.length, 0);
  // the wave-2 checkpoint (taken before that volley) holds the 3 balls; restoring fires them, never twice
  const cp = ev.filter((e) => e.kind === 'checkpoint').at(-1).snapshot;
  assert.notEqual(cp, snap?.snapshot);
  assert.equal(cp.run.pendingAmmo.length, 3);
  const st = memStorage();
  const s = defaultSave();
  s.activeRun = cp;
  new SaveService(st).save(s);
  const c2 = new RunController({ snapshot: new SaveService(st).load().activeRun, autoAck: true });
  c2.start();
  assert.equal(c2.run.pendingAmmo.length, 0);
  c2.finish(true);
  assert.deepEqual(c2.run.pendingAmmo, []);
  // an old snapshot without the new fields opens with an empty queue and normal approach
  const old = migrateRunState({ enemies: [{ id: 1, type: 'tomato' }], stats: {} });
  assert.deepEqual([old.pendingAmmo, old.enemies[0].contactState], [[], null]);
});

test('energy: level and dungeon entry 5 (30->25->20), once per runId, refused when short; max/regen/ads unchanged', () => {
  const s = defaultSave();
  assert.deepEqual([ENERGY.max, ENERGY.regenMinutesPerPoint, ENERGY.dailyAdFullRefills], [30, 12, 2]);
  const now = Date.UTC(2026, 10, 22, 10);
  debitForRun(s.energy, 'L1run', now, stageByLevel(1).energyCost);
  assert.equal(s.energy.value, 25);
  debitForRun(s.energy, 'Drun', now, dungeonById('gold_kitchen').energyCost);
  assert.equal(s.energy.value, 20);
  debitForRun(s.energy, 'Drun', now, 5); // resume: no second debit
  assert.equal(s.energy.value, 20);
  s.energy.value = 4;
  assert.equal(debitForRun(s.energy, 'x', now, stageByLevel(30).energyCost).ok, false);
  // an old save keeps its stored energy as is
  const st = memStorage();
  const o = defaultSave();
  o.energy.value = 17;
  o.energy.lastRegenAt = Date.now();
  new SaveService(st).save(o);
  assert.equal(new SaveService(st).load().energy.value, 17);
});
