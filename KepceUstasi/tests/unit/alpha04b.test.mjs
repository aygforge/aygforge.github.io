// Alpha 0.4B — ekipman etkileri, garantili crafting, dungeon ödülleri/günlük haklar, SG, kayıt uyumluluğu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVolley, buildShots } from '../../src/systems/CombatResolver.js';
import { ladleParams } from '../../src/systems/Abilities.js';
import { permStats, chefPower, applyStageResult, applyDungeonResult, dungeonFullLeft, isDungeonUnlocked } from '../../src/systems/Progression.js';
import { craft, craftInfo } from '../../src/systems/Equipment.js';
import { defaultSave, SaveService } from '../../src/systems/SaveService.js';
import { dungeonById, stageByLevel } from '../../src/data/stages.js';
import { PotPhysics } from '../../src/systems/PotPhysics.js';
import { LadleController } from '../../src/systems/LadleController.js';
import { Rng } from '../../src/core/rng.js';
import { makeRun, addEnemy, normal, CH1, memStorage } from './helpers.mjs';

const T0 = Date.UTC(2026, 10, 21, 9, 0);
const withEquip = (eq) => {
  const s = defaultSave();
  Object.assign(s.equipment, eq);
  const r = makeRun(CH1, s);
  return r;
};

test('weapon (Yağ Silahı): uncommon every 6th, rare every 4th REAL normal shot +1; stacks with power_shot', () => {
  for (const [rar, every] of [['uncommon', 6], ['rare', 4]]) {
    const run = withEquip({ weapon: rar });
    const boss = addEnemy(run, 'giant_tomato', 0.8, 0.5, { hp: 500, maxHp: 500 });
    resolveVolley(run, CH1, [...normal(12), ...normal(4, { isBonus: true, canProc: false, source: 'double_shot' })]);
    assert.equal(500 - boss.hp, 16 + Math.floor(12 / every));
  }
  const run = withEquip({ weapon: 'rare' });
  run.abilities.power_shot = 1;
  const boss = addEnemy(run, 'giant_tomato', 0.8, 0.5, { hp: 500, maxHp: 500 });
  resolveVolley(run, CH1, normal(8));
  assert.equal(500 - boss.hp, 8 + 2 + 2, 'both counters apply');
});

test('ladle (Kepçe): +3% / +6% real mouth radius, multiplies with width upgrade and Geniş Kepçe, real colliders', () => {
  const base = ladleParams(withEquip({})).radius;
  assert.equal(ladleParams(withEquip({ ladle: 'uncommon' })).radius, +(base * 1.03).toFixed(3));
  const r = withEquip({ ladle: 'rare' });
  r.abilities.wide_ladle = 1;
  assert.equal(ladleParams(r).radius, +(base * 1.12 * 1.06).toFixed(3));
  const pot = new PotPhysics(new Rng(1));
  new LadleController(pot).configure(ladleParams(r));
  assert.equal(pot.ladleShape.radius, ladleParams(r).radius);
});

test('apron (Önlük): max HP +1 / +2; pan (Tava): every 7th/5th unique kill -> one non-proc bonus oil next volley', () => {
  const s = defaultSave();
  s.equipment.apron = 'rare';
  assert.equal(permStats(s).hp, 7);
  const run = withEquip({ pan: 'rare' });
  for (let i = 0; i < 5; i++) addEnemy(run, 'egg', 0.6, 0.1 + i * 0.18, { hp: 1 });
  resolveVolley(run, CH1, normal(5));
  assert.equal(run.pending.eqPan, 1);
  const shots = buildShots(run, [{ id: 1, type: 'normal' }]);
  assert.deepEqual(shots[0], { oil: 'normal', isBonus: true, canProc: false, source: 'eq_pan' });
  assert.equal(run.pending.eqPan, 0);
});

test('Chef Power uses the JSON weights + item power; it is only a guide', () => {
  const s = defaultSave();
  assert.equal(chefPower(s), 100);
  s.upgrades.mastery = 3;
  s.equipment.weapon = 'rare';
  assert.equal(chefPower(s), 100 + 10 * 2 + 20);
  assert.deepEqual([stageByLevel(10).recommendedChefPower, stageByLevel(20).recommendedChefPower], [138, 183]);
});

test('guaranteed 100-part route: L15 +18, depot first clear +10+18, 3 more full clears 3x18 -> Common->Uncommon->Rare', () => {
  const s = defaultSave();
  s.tips = 1000;
  const win = (lvl) => {
    const run = makeRun();
    run.runId = `L${lvl}`;
    run.wave = 7;
    applyStageResult(s, stageByLevel(lvl), run, { victory: true, stars: 3 }, T0);
  };
  assert.equal(craftInfo(s, 'weapon').unlocked, false);
  for (let l = 1; l <= 15; l++) win(l);
  assert.equal(s.currencyParts, 18);
  const dg = dungeonById('materials_depot');
  assert.ok(isDungeonUnlocked(s, dg));
  const dwin = (id, t) => {
    const run = makeRun();
    run.runId = id;
    return applyDungeonResult(s, dg, run, { victory: true }, t);
  };
  assert.equal(dwin('d1', T0).reward.parts, 28);
  dwin('d2', T0);
  assert.equal(dwin('d3', T0).reward.parts, 8, 'third run today: repeat reward');
  assert.equal(dwin('d1', T0).duplicate, true);
  const day2 = T0 + 24 * 3600 * 1000;
  dwin('d4', day2);
  dwin('d5', day2);
  assert.equal(s.currencyParts, 18 + 28 + 18 + 8 + 18 + 18);
  s.currencyParts -= 8; // remove the extra repeat run to check the exact 100-part route
  assert.equal(s.currencyParts, 100);
  const tips = s.tips;
  assert.equal(craft(s, 'weapon').ok, true);
  assert.deepEqual([s.currencyParts, s.tips, s.equipment.weapon], [60, tips - 120, 'uncommon']);
  assert.equal(craft(s, 'weapon').reason, 'locked', 'rare needs L16');
  win(16);
  assert.equal(craft(s, 'weapon').ok, true);
  assert.deepEqual([s.currencyParts, s.equipment.weapon], [0, 'rare']);
  assert.equal(craft(s, 'weapon').reason, 'max');
  assert.equal(craft(s, 'pan').reason, 'funds');
  assert.equal(s.equipment.pan, 'common', 'failed craft changes nothing');
});

test('dungeon: loss gives nothing and uses no daily right; rights reset on the UTC day; gold kitchen tips', () => {
  const s = defaultSave();
  s.stageProgress.levels[7] = { cleared: true, stars: 3, plays: 1 };
  const gk = dungeonById('gold_kitchen');
  const run = (id) => Object.assign(makeRun(), { runId: id });
  const lost = applyDungeonResult(s, gk, run('a'), { victory: false }, T0);
  assert.deepEqual([lost.reward.tips, s.tips, dungeonFullLeft(s, gk, T0)], [0, 0, 2]);
  assert.equal(applyDungeonResult(s, gk, run('b'), { victory: true }, T0).reward.tips, 240);
  applyDungeonResult(s, gk, run('c'), { victory: true }, T0);
  assert.equal(applyDungeonResult(s, gk, run('d'), { victory: true }, T0).reward.tips, 120);
  assert.equal(dungeonFullLeft(s, gk, Date.UTC(2026, 10, 22, 0, 5)), 2);
});

test('0.4A save: recorded L15 grant paid once on load; equipment/dungeon fields filled; nothing else changes', () => {
  const st = memStorage();
  const s = defaultSave();
  delete s.paidGrants;
  delete s.dungeonDaily;
  s.dataVersion = 4;
  s.pendingGrants = ['materials_starter_grant_18'];
  s.tips = 321;
  new SaveService(st).save(s);
  const a = new SaveService(st).load();
  assert.deepEqual([a.currencyParts, a.paidGrants, a.tips, a.dataVersion], [18, ['materials_starter_grant_18'], 321, 5]);
  new SaveService(st).save(a);
  assert.equal(new SaveService(st).load().currencyParts, 18, 'not paid twice');
});
