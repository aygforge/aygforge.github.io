// Alpha 0.5A — Mantarlı Omlet L21–30: kabuk, koruyucu kalkanı, Elit Şapka, çift final, Koca Mantar, kayıt.
import test from 'node:test';
import assert from 'node:assert/strict';
import { stageByLevel, LEVEL_COUNT } from '../../src/data/stages.js';
import { ENEMIES, FIELD } from '../../src/data/content.js';
import { spawnWave, enemyAction, stepsFor } from '../../src/systems/EnemyDirector.js';
import { resolveVolley } from '../../src/systems/CombatResolver.js';
import { newRunState } from '../../src/systems/RunController.js';
import { permStats, applyStageResult, isStageUnlocked } from '../../src/systems/Progression.js';
import { defaultSave, SaveService } from '../../src/systems/SaveService.js';
import { Rng } from '../../src/core/rng.js';
import { normal, memStorage } from './helpers.mjs';

const T0 = Date.UTC(2026, 10, 21, 12);
const runFor = (lvl) => newRunState({ chapter: stageByLevel(lvl), perm: permStats(defaultSave()), seed: 5, runId: `r${lvl}` });
const finalsOf = (run, lvl) => {
  run.wave = stageByLevel(lvl).waves.length + 1;
  return spawnWave(run, stageByLevel(lvl), new Rng(1));
};
const only = (run, keep) => run.enemies.forEach((e) => { if (!keep.includes(e)) e.dead = true; });

test('L21–30 data: 30 levels, JSON waves/recipes/finals, L1–20 untouched, picks only after normal waves', () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.deepEqual([stageByLevel(10).boss, stageByLevel(20).boss, stageByLevel(20).balance.bossHp], ['giant_tomato', 'potato_king', 54]);
  const n = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((l) => stageByLevel(l).waves.length);
  assert.deepEqual(n, [3, 4, 4, 5, 5, 3, 4, 5, 5, 6]);
  for (let l = 21; l <= 30; l++) assert.deepEqual(stageByLevel(l).skillWaves, stageByLevel(l).waves.map((_, i) => i + 1));
  assert.deepEqual([23, 24, 27, 29].map((l) => stageByLevel(l).finals.length), [2, 2, 2, 2]);
  assert.equal(stageByLevel(30).boss, 'giant_mushroom');
  assert.equal(stageByLevel(21).balance.hp.mushroom, Math.round(7 * 0.92));
});

test('L22 onion: external shield -> shell -> HP; shell not scaled; faster 1,2 only from the NEXT move', () => {
  const run = runFor(22);
  run.wave = 1;
  const onion = spawnWave(run, stageByLevel(22), new Rng(3)).find((e) => e.type === 'onion');
  only(run, [onion]);
  assert.deepEqual([onion.shell, onion.hp], [2, 8]); // 8 * 0.96 -> 8, shell stays 2
  onion.shield = 1; // e.g. from a guard
  resolveVolley(run, stageByLevel(22), normal(2));
  assert.deepEqual([onion.shield, onion.shell, onion.hp], [0, 1, 8]);
  assert.equal(stepsFor(onion, onion.moveOpp + 1), 1);
  enemyAction(run, new Rng(1)); // shell intact: 1 step
  const r = resolveVolley(run, stageByLevel(22), [{ oil: 'big', isBonus: false, source: 'pot' }]);
  const ev = r.events.find((e) => e.type === 'shot');
  assert.ok(ev.cracked && ev.shellDmg === 1 && ev.hpDmg === 2, 'overflow goes into HP');
  const xs = [];
  for (let i = 0; i < 4; i++) {
    const x0 = onion.x;
    enemyAction(run, new Rng(1));
    xs.push(Math.round((x0 - onion.x) / FIELD.step));
  }
  assert.deepEqual(xs, [1, 2, 1, 2]);
});

test('L23 guard: +2 shield on own 3rd/6th action to nearest non-guard ally (x<=0.26), cap 3, max 2 pulses, 1 event per phase', () => {
  const run = runFor(23);
  const [g1, mush] = finalsOf(run, 23); // Muhafız Mantar (guard) + Korunan Mantar
  const g2 = spawnWave(Object.assign(run, { wave: 1 }), stageByLevel(23), new Rng(2)).find((e) => e.type === 'mushroom_guard');
  only(run, [g1, mush, g2]);
  g2.actionCount = g1.actionCount; // both guards pulse in the same phase
  g2.x = g1.x;
  mush.x = g1.x - 0.1;
  const far = g2; // guards never shield guards
  const events = [];
  for (let i = 0; i < 3; i++) events.push(...enemyAction(run, new Rng(1)));
  const grants = events.filter((e) => e.type === 'shieldGranted');
  assert.equal(grants.length, 1, 'one shield event per enemy phase');
  assert.deepEqual([grants[0].targetId, mush.shield], [mush.id, 2]);
  assert.notEqual(grants[0].targetId, far.id);
  for (let i = 0; i < 9; i++) enemyAction(run, new Rng(1));
  assert.equal(mush.shield, 3, 'cap 3');
  assert.deepEqual([g1.pulses, g2.pulses], [2, 2], 'max 2 pulses each');
  // out of range: no target, pulse lost
  const run2 = runFor(23);
  const [h, m2] = finalsOf(run2, 23);
  m2.x = h.x + 0.3;
  for (let i = 0; i < 3; i++) enemyAction(run2, new Rng(1));
  assert.deepEqual([m2.shield, h.pulses], [0, 1]);
});

test('L25 Elit Şapka: 38 HP + 3 shield, once +2 shield (cap 4) after surviving a hit at <= 50 %', () => {
  const run = runFor(25);
  const [elite] = finalsOf(run, 25);
  assert.deepEqual([elite.hp, elite.shield, ENEMIES[elite.type].miniBoss], [38, 3, true]);
  elite.shield = 0;
  elite.hp = 20;
  const r = resolveVolley(run, stageByLevel(25), normal(1));
  assert.deepEqual([elite.hp, elite.shield, r.events[0].halfShield], [19, 2, 2]);
  elite.shield = 0;
  resolveVolley(run, stageByLevel(25), normal(1));
  assert.equal(elite.shield, 0, 'only once');
});

test('L29 dual final: no win until both are down; win and stage reward exactly once', () => {
  const run = runFor(29);
  const fs = finalsOf(run, 29);
  assert.equal(fs.length, 2);
  fs.forEach((f) => Object.assign(f, { hp: 1, shield: 0, shell: 0 }));
  let r = resolveVolley(run, stageByLevel(29), normal(1));
  assert.equal(r.victory, false);
  r = resolveVolley(run, stageByLevel(29), normal(1));
  assert.equal(r.victory, true);
  assert.equal(r.events.filter((e) => e.type === 'victory').length, 1);
  const s = defaultSave();
  s.stageProgress.highestUnlocked = 29;
  const a = applyStageResult(s, stageByLevel(29), run, { victory: true, stars: 1 }, T0);
  assert.equal(a.reward.total, 136 + 68);
  assert.equal(applyStageResult(s, stageByLevel(29), run, { victory: true, stars: 1 }, T0).duplicate, true);
  assert.equal(s.tips, 204);
});

test('L30 Koca Mantar: 72+4 at x 0.70; at <=50 % once 2 mushrooms (6 HP) + 1,2 moves; pulses; boss death = instant win', () => {
  const run = runFor(30);
  const [boss] = finalsOf(run, 30);
  assert.deepEqual([boss.hp, boss.shield, boss.x, ENEMIES.giant_mushroom.contactDamage], [72, 4, 0.7, 2]);
  boss.hp = 36;
  const ev = enemyAction(run, new Rng(1));
  const sm = ev.find((e) => e.type === 'summon');
  assert.equal(sm.minions.length, 2);
  const minions = run.enemies.filter((e) => e.summonedBy === boss.id);
  assert.ok(minions.every((m) => m.hp === 6 && m.type === 'mushroom'));
  const xs = [];
  for (let i = 0; i < 3; i++) {
    const x0 = boss.x;
    enemyAction(run, new Rng(1));
    xs.push(Math.round((x0 - boss.x) / FIELD.step));
  }
  assert.deepEqual(xs, [2, 1, 2]); // phase move 1 was taken with the summon action
  assert.equal(run.enemies.filter((e) => e.summonedBy === boss.id).length, 2, 'summons only once');
  assert.ok(minions.some((m) => m.shield === 2), 'boss pulse shields a minion (3rd own action)');
  // boss dies with minions alive -> victory immediately, once
  boss.hp = 1;
  boss.shield = 0;
  minions.forEach((m) => (m.x = 0.99));
  boss.x = 0.2;
  const r = resolveVolley(run, stageByLevel(30), normal(3));
  assert.equal(r.victory, true);
  assert.equal(r.events.filter((e) => e.type === 'shot').length, 1, 'no further shots after the win');
  // a dead boss never summons
  const run2 = runFor(30);
  const [b2] = finalsOf(run2, 30);
  b2.hp = 0;
  b2.dead = true;
  assert.equal(enemyAction(run2, new Rng(1)).filter((e) => e.type === 'summon').length, 0);
});

test('save: L20-cleared old save opens L21; L20 win unlocks L21; L25/L30 flags once; snapshot keeps shell/pulse state', () => {
  const st = memStorage();
  const old = defaultSave();
  for (let l = 1; l <= 20; l++) old.stageProgress.levels[l] = { cleared: true, stars: 3, plays: 1 };
  old.stageProgress.highestUnlocked = 20;
  old.tips = 999;
  new SaveService(st).save(old);
  const s = new SaveService(st).load();
  assert.deepEqual([s.stageProgress.highestUnlocked, s.tips, s.stageProgress.levels[20].stars], [21, 999, 3]);
  assert.ok(isStageUnlocked(s, 21) && !isStageUnlocked(s, 22));
  const win = (l, id) => applyStageResult(s, stageByLevel(l), Object.assign(runFor(l), { runId: id }), { victory: true, stars: 1 }, T0);
  for (let l = 21; l <= 30; l++) win(l, `w${l}`);
  win(25, 'again');
  assert.deepEqual(s.unlockEvents.map((u) => u.id).filter((id) => id.includes('future')), ['boss_kitchen_future_eligibility', 'chapter4_pasta_future_eligibility']);
  assert.equal(s.stageProgress.highestUnlocked, 30);
  const run = runFor(22);
  run.wave = 1;
  const o = spawnWave(run, stageByLevel(22), new Rng(3)).find((e) => e.type === 'onion');
  Object.assign(o, { shell: 0, altFrom: 3, pulses: 1 });
  const back = JSON.parse(JSON.stringify(run)).enemies.find((e) => e.id === o.id);
  assert.deepEqual([back.shell, back.altFrom, back.pulses, back.maxShell], [0, 3, 1, 2]);
});
