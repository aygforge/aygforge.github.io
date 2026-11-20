// QA 10, 12, 14 — ekonomi, yıldız, kalıcı geliştirme, kayıt/yükleme, tek seferlik ödül.
import test from 'node:test';
import assert from 'node:assert/strict';
import { UPGRADES } from '../../src/data/content.js';
import { purchaseUpgrade, permStats, computeReward, applyRunResult, upgradeCost } from '../../src/systems/Progression.js';
import { SaveService, defaultSave, SAVE_KEY } from '../../src/systems/SaveService.js';
import { starsFor } from '../../src/systems/RecipeTracker.js';
import { ladleParams } from '../../src/systems/Abilities.js';
import { newRunState } from '../../src/systems/RunController.js';
import { makeRun, CH1, CH2, memStorage } from './helpers.mjs';

test('upgrade cost table matches GDD §12 exactly', () => {
  const want = {
    capacity: [55, 90, 150, 230, 340], width: [60, 100, 165, 250, 370], toughness: [45, 80, 130, 200, 300],
    mastery: [60, 105, 175, 270, 400], pan: [70, 115, 190, 300, 450], spice: [90, 145, 230, 345, 500],
  };
  for (const u of UPGRADES) assert.deepEqual(u.costs, want[u.id]);
});

test('purchase is atomic: insufficient funds changes nothing; success subtracts once and levels once; max disables', () => {
  const s = defaultSave();
  s.tips = 54;
  assert.equal(purchaseUpgrade(s, 'capacity').ok, false);
  assert.deepEqual([s.tips, s.upgrades.capacity], [54, 1]);
  s.tips = 10000;
  let spent = 0;
  for (let i = 0; i < 5; i++) spent += purchaseUpgrade(s, 'capacity').cost;
  assert.equal(spent, 55 + 90 + 150 + 230 + 340);
  assert.equal(s.upgrades.capacity, 6);
  assert.equal(upgradeCost(s, 'capacity'), null);
  const before = s.tips;
  assert.equal(purchaseUpgrade(s, 'capacity').reason, 'max');
  assert.equal(s.tips, before);
});

test('every upgrade level changes real stats used by the run', () => {
  const s = defaultSave();
  const levels = [1, 2, 3, 4, 5, 6];
  const caps = [];
  const widths = [];
  const hp = [];
  for (const l of levels) {
    Object.keys(s.upgrades).forEach((k) => (s.upgrades[k] = l));
    const p = permStats(s);
    const run = newRunState({ chapter: CH1, perm: p, seed: 1, runId: 'x' });
    caps.push(ladleParams(run).capacity);
    widths.push(ladleParams(run).radius);
    hp.push([run.chef.maxHp, run.chef.shield]);
  }
  assert.deepEqual(caps, [7, 8, 9, 10, 11, 12]);
  assert.deepEqual(widths, [42, 44.1, 46.2, 48.3, 50.4, 52.5]); // base mouth 42 px (Alpha 0.3) x 100..125 %
  assert.deepEqual(hp, [[5, 0], [6, 0], [6, 1], [7, 1], [7, 2], [8, 2]]);
  s.upgrades.spice = 6;
  assert.equal(permStats(s).spice, 0.05);
  s.upgrades.mastery = 6;
  assert.deepEqual(permStats(s).mastery, { every: 2, bonus: 2 });
  s.upgrades.pan = 2;
  assert.equal(permStats(s).pan, 8);
});

test('stars: 1 boss, 2 full recipe, 3 full recipe + hp loss <= 1 (shield-prevented damage does not count)', () => {
  const run = makeRun();
  assert.equal(starsFor(run, CH1, false), 0);
  assert.equal(starsFor(run, CH1, true), 1);
  run.recipe = { tomato: 3, pepper: 2, egg: 1 };
  run.stats.hpLost = 1;
  assert.equal(starsFor(run, CH1, true), 3);
  run.stats.hpLost = 2;
  assert.equal(starsFor(run, CH1, true), 2);
});

test('rewards: base, quality bonus (+15 % / +30 %), first clear once, failure formula', () => {
  assert.equal(computeReward(CH1, { victory: true, stars: 1, firstClear: true }).total, 90);
  assert.equal(computeReward(CH1, { victory: true, stars: 2, firstClear: false }).total, 69);
  assert.equal(computeReward(CH1, { victory: true, stars: 3, firstClear: false }).total, 78);
  assert.equal(computeReward(CH2, { victory: true, stars: 3, firstClear: true }).total, 80 + 24 + 35);
  assert.equal(computeReward(CH1, { victory: false, completedWaves: 3 }).total, Math.floor((60 * 0.7 * 3) / 6));
  assert.equal(computeReward(CH2, { victory: false, completedWaves: 0 }).total, 0);
});

test('run result applied exactly once; next chapter unlocks; replay gets no first bonus; best stars kept', () => {
  const s = defaultSave();
  const r1 = makeRun();
  r1.runId = 'A';
  r1.wave = 7;
  const a = applyRunResult(s, CH1, r1, { victory: true, stars: 3 });
  assert.equal(a.reward.total, 60 + 18 + 30);
  assert.equal(s.highestUnlocked, 2);
  const dup = applyRunResult(s, CH1, r1, { victory: true, stars: 3 });
  assert.equal(dup.duplicate, true);
  assert.equal(s.tips, 108);
  const r2 = makeRun();
  r2.runId = 'B';
  r2.wave = 7;
  applyRunResult(s, CH1, r2, { victory: true, stars: 1 });
  assert.equal(s.tips, 108 + 60);
  assert.equal(s.chapters.menemen.stars, 3);
  const r3 = makeRun(CH2);
  r3.runId = 'C';
  r3.wave = 7; // boss started -> 6 waves count
  applyRunResult(s, CH2, r3, { victory: false, stars: 0 });
  assert.equal(s.tips, 168 + Math.floor(80 * 0.7));
});

test('save round trip with schema version + checksum; corrupt main falls back to backup', () => {
  const st = memStorage();
  const svc = new SaveService(st);
  const s = defaultSave();
  s.tips = 321;
  s.upgrades.width = 4;
  svc.save(s);
  s.tips = 400;
  svc.save(s);
  assert.equal(new SaveService(st).load().tips, 400);
  st.setItem(SAVE_KEY, '{"sum":"bad","data":"{}"}');
  const svc2 = new SaveService(st);
  const back = svc2.load();
  assert.equal(back.tips, 321);
  assert.equal(back.upgrades.width, 4);
  assert.ok(svc2.notice);
  st.setItem(SAVE_KEY, 'garbage');
  st.setItem(SAVE_KEY + '.bak', 'garbage');
  const svc3 = new SaveService(st);
  assert.equal(svc3.load().tips, 0);
  assert.ok(svc3.notice);
});
