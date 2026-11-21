// Alpha 0.4A — stage adaptörü, enerji, kayıt migrasyonu, level ödülleri (hedefli, hızlı testler).
import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, CAMPAIGN, stageByLevel, findChapter } from '../../src/data/stages.js';
import { ENEMIES } from '../../src/data/content.js';
import { defaultEnergy, tickEnergy, debitForRun, applyAdRefill, refundFirstClear } from '../../src/systems/EnergyService.js';
import { SaveService, defaultSave, migrateToAlpha04, SAVE_KEY } from '../../src/systems/SaveService.js';
import { applyStageResult, currentLevel, isStageUnlocked } from '../../src/systems/Progression.js';
import { makeRun, memStorage } from './helpers.mjs';

const MIN = 60000;
const T0 = Date.UTC(2026, 10, 21, 10, 0, 0);

test('adapter: 20 levels, 6 JSON waves each, finals and HP exactly from the campaign JSON', () => {
  assert.equal(STAGES.length, 20);
  for (const L of CAMPAIGN.levels) {
    const s = stageByLevel(L.level);
    assert.deepEqual(s.waves, L.waves);
    assert.equal(s.waves.length, 6);
    for (const [t, v] of Object.entries(L.enemyBalance.alpha03BaseHpById)) assert.equal(s.balance.hp[t], Math.round(v * L.enemyBalance.hpScale));
    assert.equal(s.balance.bossHp, L.finalEncounter.hp);
    assert.deepEqual(s.recipe, L.recipe);
    assert.equal(findChapter(s.id), s);
  }
  assert.equal(stageByLevel(10).boss, 'giant_tomato');
  assert.deepEqual([stageByLevel(10).balance.bossHp, stageByLevel(20).balance.bossHp, stageByLevel(20).boss], [42, 54, 'potato_king']);
  const mini = ENEMIES[stageByLevel(5).boss];
  assert.deepEqual([mini.boss, mini.recipe, mini.sprite, stageByLevel(5).balance.bossHp], [true, null, 'giant_tomato', 28]);
  assert.equal(stageByLevel(15).stageType, 'mini_boss');
  assert.ok(findChapter('menemen') && findChapter('fries'), 'legacy chapters still resolvable');
});

test('energy: +1 per 12 min with remainder carried, never above 30, clock going back gives nothing', () => {
  const e = defaultEnergy(T0);
  assert.equal(e.value, 30);
  debitForRun(e, 'a', T0);
  assert.equal(e.value, 20);
  tickEnergy(e, T0 + 30 * MIN); // 2 points, 6 min carried
  assert.equal(e.value, 22);
  tickEnergy(e, T0 + 36 * MIN);
  assert.equal(e.value, 23);
  tickEnergy(e, T0 + 10 * MIN); // clock moved backwards
  assert.equal(e.value, 23);
  tickEnergy(e, T0 + 100 * 24 * 60 * MIN);
  assert.equal(e.value, 30);
});

test('energy: one debit per runId (resume/reload never charges again), refused when short', () => {
  const e = defaultEnergy(T0);
  assert.deepEqual(debitForRun(e, 'run1', T0), { ok: true, charged: 10 });
  assert.deepEqual(debitForRun(e, 'run1', T0 + 1000), { ok: true, charged: 0 });
  debitForRun(e, 'run2', T0);
  debitForRun(e, 'run3', T0);
  assert.equal(e.value, 0);
  assert.equal(debitForRun(e, 'run4', T0).ok, false);
});

test('energy: rewarded refill only when verified, fills to 30 (not +30), 2 per UTC day, resets next UTC day', () => {
  const e = defaultEnergy(T0);
  debitForRun(e, 'a', T0);
  assert.equal(applyAdRefill(e, { status: 'unavailable', rewarded: false }, T0).ok, false);
  assert.equal(applyAdRefill(e, { status: 'rewarded', verified: false }, T0).ok, false);
  assert.equal(e.adUsed, 0, 'unverified attempts do not use a right');
  const ok = { status: 'rewarded', verified: true };
  assert.ok(applyAdRefill(e, ok, T0).ok);
  assert.equal(e.value, 30);
  assert.ok(applyAdRefill(e, ok, T0).ok);
  assert.equal(applyAdRefill(e, ok, T0).reason, 'daily_limit');
  assert.ok(applyAdRefill(e, ok, Date.UTC(2026, 10, 22, 0, 1)).ok, 'new UTC day');
});

test('energy: L1–L3 first clear refund +10 once each, never for L4', () => {
  const e = defaultEnergy(T0);
  debitForRun(e, 'a', T0);
  debitForRun(e, 'b', T0);
  assert.equal(refundFirstClear(e, 1, 10, T0), 10);
  assert.equal(refundFirstClear(e, 1, 10, T0), 0);
  assert.equal(refundFirstClear(e, 4, 10, T0), 0);
  assert.equal(e.value, 20);
});

test('migration: Alpha 0.3 save keeps tips/upgrades/legacy stars, new track starts at L1, idempotent', () => {
  const st = memStorage();
  const old = defaultSave();
  for (const k of ['dataVersion', 'stageProgress', 'energy', 'equipment', 'dungeonDaily', 'currencyParts', 'legacyCompletedChapters', 'unlockEvents', 'pendingGrants']) delete old[k];
  Object.assign(old, { tips: 777, highestUnlocked: 2, chapters: { menemen: { stars: 3, cleared: true, plays: 4 } } });
  old.upgrades.capacity = 4;
  new SaveService(st).save(old);
  const s = new SaveService(st).load();
  assert.deepEqual([s.tips, s.upgrades.capacity, s.chapters.menemen.stars, s.highestUnlocked], [777, 4, 3, 2]);
  assert.deepEqual(s.legacyCompletedChapters, ['menemen']);
  assert.equal(s.stageProgress.highestUnlocked, 1);
  assert.equal(s.energy.value, 30);
  assert.deepEqual(s.equipment, { weapon: 'common', ladle: 'common', apron: 'common', pan: 'common' });
  const again = JSON.stringify(migrateToAlpha04(JSON.parse(JSON.stringify(s)), T0 + 99999));
  assert.equal(again, JSON.stringify(s), 'second migration changes nothing');
  new SaveService(st).save(s);
  assert.equal(JSON.parse(JSON.parse(st.getItem(SAVE_KEY)).data).tips, 777);
});

test('stage result: JSON rewards, first clear once, unlocks L7/L15/L16 recorded once, no double reward', () => {
  const s = defaultSave();
  const win = (lvl, id, stars = 3) => {
    const run = makeRun();
    run.runId = id;
    run.wave = 7;
    return applyStageResult(s, stageByLevel(lvl), run, { victory: true, stars }, T0);
  };
  debitForRun(s.energy, 'r1', T0);
  const a = win(1, 'r1');
  assert.equal(a.reward.total, Math.round(60 * 1.3) + 30);
  assert.equal(a.energyRefund, 10);
  assert.equal(s.energy.value, 30);
  assert.equal(win(1, 'r1').duplicate, true);
  assert.equal(s.tips, 108);
  const b = win(1, 'r1b', 1);
  assert.deepEqual([b.reward.total, b.firstClear, b.energyRefund], [60, false, 0]);
  assert.equal(s.stageProgress.levels[1].stars, 3, 'best stars kept');
  for (let l = 2; l <= 16; l++) win(l, `w${l}`);
  assert.deepEqual(s.unlockEvents.map((u) => [u.id, u.level]), [['gold_kitchen', 7], ['chapter2_fries', 10], ['materials_depot', 15], ['materials_starter_grant_18', 15], ['rare_crafting', 16]]);
  // Alpha 0.4B: the L15 grant is paid in the same result write, exactly once
  assert.deepEqual([s.pendingGrants, s.paidGrants, s.currencyParts], [[], ['materials_starter_grant_18'], 18]);
  win(7, 'again7');
  assert.equal(s.unlockEvents.length, 5, 'replay does not re-record unlocks');
  assert.equal(s.stageProgress.highestUnlocked, 17);
  assert.equal(currentLevel(s), 17);
  assert.ok(isStageUnlocked(s, 17) && !isStageUnlocked(s, 18));
});
