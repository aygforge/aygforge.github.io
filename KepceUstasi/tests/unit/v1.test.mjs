// V1.0 — veri bütünlüğü (120 level), yeni düşman/boss mekanikleri, Epic/Legendary, modlar, görevler, migrasyon, monetizasyon.
import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, stageByLevel, findChapter, LEVEL_COUNT, DUNGEONS } from '../../src/data/stages.js';
import { ENEMIES } from '../../src/data/content.js';
import { V1 } from '../../src/data/v1/v1Adapter.js';
import { spawnWave, enemyAction, resolveContacts } from '../../src/systems/EnemyDirector.js';
import { resolveVolley, selectTarget } from '../../src/systems/CombatResolver.js';
import { newRunState, RunController, PHASE } from '../../src/systems/RunController.js';
import { permStats, applyStageResult, applyDungeonResult, chefPower } from '../../src/systems/Progression.js';
import { craft, craftInfo, enhance, enhanceCost } from '../../src/systems/Equipment.js';
import { ladleParams } from '../../src/systems/Abilities.js';
import { defaultSave, SaveService } from '../../src/systems/SaveService.js';
import { scaledDungeonReward, bossKitchenPool, utcWeek, questList, claimQuest, recordQuest, towerNextBlock } from '../../src/systems/V1Modes.js';
import { interstitialDue, noteRunCompleted, consumeAdReward, applyTipBonus, applyPurchase, restorePurchases, hasEntitlement } from '../../src/systems/Monetization.js';
import { debitForRun } from '../../src/systems/EnergyService.js';
import { t, setLanguage } from '../../src/i18n.js';
import { Rng } from '../../src/core/rng.js';
import { normal, memStorage } from './helpers.mjs';

const T0 = Date.UTC(2026, 10, 23, 10); // Monday
const runFor = (lvl, save = defaultSave()) => newRunState({ chapter: stageByLevel(lvl), perm: permStats(save), seed: 9, runId: `r${lvl}` });
const only = (run, keep) => run.enemies.forEach((e) => { if (!keep.includes(e)) e.dead = true; });
const finalsOf = (run, lvl) => {
  run.wave = stageByLevel(lvl).waves.length + 1;
  return spawnWave(run, stageByLevel(lvl), new Rng(1));
};
const enemy = (run, lvl, type, x = 0.6) => {
  run.wave = 1;
  const ch = stageByLevel(lvl);
  const saved = ch.waves[0];
  ch.waves[0] = { [type]: 1 };
  const [e] = spawnWave(run, ch, new Rng(1));
  ch.waves[0] = saved;
  e.x = x;
  return e;
};

test('data: 120 unique stages, L1–30 kept, 12 chapters, 3–6 waves of defined enemies, recipes reachable, bosses/minis placed', () => {
  assert.equal(LEVEL_COUNT, 120);
  assert.equal(new Set(STAGES.map((s) => s.id)).size, 120);
  assert.deepEqual([stageByLevel(10).balance.bossHp, stageByLevel(20).boss, stageByLevel(30).boss, stageByLevel(30).balance.bossHp], [42, 'potato_king', 'giant_mushroom', 72]);
  assert.equal(new Set(STAGES.map((s) => s.chapterId)).size, 12);
  assert.equal(V1.st.reduce((n, s) => n + s.w.length, 0), 405);
  for (const s of STAGES) {
    assert.ok(s.waves.length >= 3 && s.waves.length <= 6, s.id);
    assert.equal(s.energyCost, 5);
    const have = {};
    for (const w of s.waves)
      for (const [type, n] of Object.entries(w)) {
        assert.ok(ENEMIES[type] && n > 0, `${s.id} ${type}`);
        const key = ENEMIES[type].recipe;
        if (key) have[key] = (have[key] || 0) + n;
      }
    for (const [k, n] of Object.entries(s.recipe)) assert.ok((have[k] || 0) >= n, `${s.id} recipe ${k}`);
    if (s.level % 10 === 0) assert.equal(s.stageType, 'chapter_boss', s.id);
    if (s.level > 30 && s.level % 10 === 5) assert.equal(s.stageType, 'mini_boss', s.id);
  }
  assert.deepEqual([40, 80, 120].map((l) => [stageByLevel(l).boss, stageByLevel(l).balance.bossHp]), [['spaghetti_king', 106], ['pan_guardian', 309], ['feast_lord', 897]]);
  assert.ok(stageByLevel(120).unlocksOnFirstClear.includes('game_complete'));
  assert.equal(stageByLevel(36).finals.length, 3);
});

test('new enemies: spiral splits once (2×2 HP, counted once), broccoli shields an ally, garlic +1 step, pastry 3 layers, glazed/spice/taunt', () => {
  const run = runFor(31);
  const sp = enemy(run, 31, 'spiral');
  only(run, [sp]);
  sp.hp = 1;
  const r = resolveVolley(run, stageByLevel(31), normal(1));
  const split = r.events.find((e) => e.type === 'split');
  assert.equal(split.minions.length, 2);
  assert.ok(run.enemies.filter((e) => e.type === 'spiral_mini').every((m) => m.hp === 2));
  assert.equal(run.recipe.spiral, 1);
  for (const m of run.enemies.filter((e) => e.type === 'spiral_mini')) m.hp = 1;
  const r2 = resolveVolley(run, stageByLevel(31), normal(2));
  assert.equal(r2.events.filter((e) => e.type === 'split').length, 0, 'minis never split');
  assert.equal(run.recipe.spiral, 1, 'minis add nothing');
  // garlic (every 3rd action) -> +1 step on the ally's NEXT move
  const r3 = runFor(31);
  const g = enemy(r3, 31, 'garlic', 0.8);
  const a = enemy(r3, 31, 'spiral', 0.85);
  only(r3, [g, a]);
  enemyAction(r3, new Rng(1));
  enemyAction(r3, new Rng(1));
  const ev = enemyAction(r3, new Rng(1));
  assert.ok(ev.some((e) => e.type === 'stepBuff' && e.targetId === a.id));
  const x0 = a.x;
  enemyAction(r3, new Rng(1));
  assert.equal(+(x0 - a.x).toFixed(2), 0.2);
  // pastry: 6 shell in 2-point layers -> 3 hits before HP
  const r4 = runFor(81);
  const p = enemy(r4, 81, 'pastry');
  only(r4, [p]);
  const hp0 = p.hp;
  resolveVolley(r4, stageByLevel(81), [{ oil: 'big', isBonus: false, source: 'pot' }, { oil: 'big', isBonus: false, source: 'pot' }]);
  assert.deepEqual([p.shell, p.hp], [2, hp0]);
  resolveVolley(r4, stageByLevel(81), [{ oil: 'big', isBonus: false, source: 'pot' }]);
  assert.deepEqual([p.shell, p.hp], [0, hp0 - 1]);
  // glazed tomato: first real hit -1; spice: every 3rd real hit -1
  const r5 = runFor(71);
  const gt = enemy(r5, 71, 'glazed_tomato');
  only(r5, [gt]);
  const h5 = gt.hp;
  resolveVolley(r5, stageByLevel(71), normal(2));
  assert.equal(gt.hp, h5 - 1);
  const r6 = runFor(101);
  const spc = enemy(r6, 101, 'spice');
  only(r6, [spc]);
  const h6 = spc.hp;
  resolveVolley(r6, stageByLevel(101), normal(3));
  assert.equal(spc.hp, h6 - 2);
  // taunt: wrap preferred over an equal-threat ally
  const r7 = runFor(91);
  const w = enemy(r7, 91, 'wrap', 0.7);
  const s2 = enemy(r7, 91, 'sauce', 0.6);
  only(r7, [w, s2]);
  assert.equal(selectTarget(r7).id, w.id);
  // spicy chili: 2 contact, then the 0.5A.1 hit -> back -> approach -> hit loop
  const r8 = runFor(51);
  const ch = enemy(r8, 51, 'chili', 0.2);
  only(r8, [ch]);
  resolveContacts(r8);
  assert.deepEqual([r8.chef.maxHp - r8.chef.hp, ch.contactState, ch.dead], [2, 'retreated', false]);
});

test('bosses: Spagetti Kralı 60 % summons 2 spirals once, 30 % +3 shield; dead boss fires nothing; Hamur Devi shell + speed', () => {
  const run = runFor(40);
  const [b] = finalsOf(run, 40);
  assert.deepEqual([b.hp, b.shield], [106, 4]);
  b.hp = 63;
  let ev = enemyAction(run, new Rng(1));
  assert.equal(ev.find((e) => e.type === 'summon').minions.length, 2);
  enemyAction(run, new Rng(1));
  assert.equal(run.enemies.filter((e) => e.summonedBy === b.id).length, 2, 'once');
  const sh = b.shield;
  b.hp = 30;
  enemyAction(run, new Rng(1));
  assert.equal(b.shield, sh + 3);
  const r2 = runFor(40);
  const [b2] = finalsOf(r2, 40);
  b2.hp = 0;
  b2.dead = true;
  assert.equal(enemyAction(r2, new Rng(1)).length, 0);
  const r3 = runFor(50);
  const [d] = finalsOf(r3, 50);
  d.hp = 69;
  enemyAction(r3, new Rng(1));
  assert.equal(d.shell, 4);
  d.hp = 30;
  ev = enemyAction(r3, new Rng(1));
  assert.ok(d.altFrom != null && ev.some((e) => e.type === 'bossPhase' && e.kind === 'speed'));
});

test('equipment V1: Epic/Legendary real effects, gates + seals, enhancement 0–30 atomic', () => {
  const s = defaultSave();
  Object.assign(s.equipment, { weapon: 'rare', ladle: 'rare', apron: 'rare', pan: 'rare' });
  s.tips = 100000;
  s.currencyParts = 2000;
  s.bossSeals = 1;
  assert.equal(craft(s, 'weapon').reason, 'locked');
  s.stageProgress.levels[35] = { cleared: true, stars: 1, plays: 1 };
  assert.equal(craft(s, 'weapon').reason, 'funds', 'needs 2 seals');
  s.bossSeals = 8;
  assert.ok(craft(s, 'weapon').ok);
  assert.deepEqual([s.bossSeals, s.currencyParts, s.tips], [6, 1860, 99100]);
  const before = permStats(s);
  assert.equal(before.weaponBase, 1);
  s.stageProgress.levels[70] = { cleared: true, stars: 1, plays: 1 };
  assert.ok(craft(s, 'weapon').ok);
  assert.equal(permStats(s).weaponBase, 2);
  for (let i = 0; i < 10; i++) assert.ok(enhance(s, 'weapon').ok);
  assert.equal(permStats(s).weaponBase, 4);
  // real damage: one normal real shot = 1 + 4
  const run = newRunState({ chapter: stageByLevel(31), perm: permStats(s), seed: 1, runId: 'w' });
  const e = enemy(run, 31, 'garlic');
  only(run, [e]);
  e.hp = 50;
  resolveVolley(run, stageByLevel(31), normal(1));
  assert.equal(50 - e.hp, 5);
  for (const slot of ['ladle', 'apron', 'pan']) {
    s.bossSeals = 99;
    s.equipment[slot] = 'rare';
    craft(s, slot);
    craft(s, slot);
  }
  assert.equal(s.equipment.pan, 'legendary');
  const p = permStats(s);
  assert.equal(p.hp, 5 + 4);
  const r = newRunState({ chapter: stageByLevel(1), perm: p, seed: 1, runId: 'l' });
  const r0 = newRunState({ chapter: stageByLevel(1), perm: permStats(defaultSave()), seed: 1, runId: 'l0' });
  assert.equal(ladleParams(r).radius, +(ladleParams(r0).radius * 1.12).toFixed(3));
  assert.deepEqual(enhanceCost(0), { tips: 45, parts: 5 });
  s.tips = 10;
  assert.equal(enhance(s, 'pan').reason, 'funds');
  assert.equal(s.equipLevels.pan, 0, 'failed enhance changes nothing');
  assert.ok(chefPower(s) > 600);
});

test('modes: depot/gold scale after L30 only; Boss Mutfağı 3 weekly full wins (2 seals) then 0; Monday reset; tower checkpoint + milestones once', () => {
  const s = defaultSave();
  const gk = DUNGEONS[0].reward;
  assert.equal(scaledDungeonReward(s, 'gold_kitchen', gk).fullRewardTips, 240);
  s.stageProgress.levels[52] = { cleared: true, stars: 1, plays: 1 };
  assert.equal(scaledDungeonReward(s, 'gold_kitchen', gk).fullRewardTips, 360);
  assert.equal(scaledDungeonReward(s, 'materials_depot', DUNGEONS[1].reward).fullRewardParts, 18 + 4 * 3);
  for (const l of [10, 20, 30, 40]) s.stageProgress.levels[l] = { cleared: true, stars: 1, plays: 1 };
  assert.deepEqual(bossKitchenPool(s), [20, 30, 40]);
  const bk = findChapter(`D_boss_kitchen:${bossKitchenPool(s).join(',')}`);
  assert.equal(bk.energyCost, 5);
  const win = (id, now) => applyDungeonResult(s, bk, Object.assign(newRunState({ chapter: bk, perm: permStats(s), seed: 1, runId: id }), { runId: id }), { victory: true }, now);
  const seals = [1, 2, 3, 4].map((i) => win(`bk${i}`, T0).reward.seals);
  assert.deepEqual(seals, [2, 2, 2, 0]);
  assert.equal(win('bk1', T0).duplicate, true);
  assert.equal(utcWeek(T0 + 6 * 86400000), utcWeek(T0));
  assert.equal(win('bk5', T0 + 7 * 86400000).reward.seals, 2, 'new UTC week');
  // boss rush: killing the wave-1 boss is NOT a victory
  const run = newRunState({ chapter: bk, perm: permStats(s), seed: 1, runId: 'x' });
  const [b1] = spawnWave(run, bk, new Rng(1));
  b1.hp = 1;
  b1.shield = 0;
  assert.equal(resolveVolley(run, bk, normal(1)).victory, false);
  // tower
  assert.equal(towerNextBlock(s), 0);
  const tw = (block, id) => applyDungeonResult(s, findChapter(`T_tower:${block}`), { runId: id, stats: { kills: 0 } }, { victory: true }, T0);
  const a = tw(0, 't1');
  assert.deepEqual([a.reward.full, s.tower.best, towerNextBlock(s)], [true, 5, 1]);
  assert.equal(tw(0, 't2').reward.tips, 30, 'replay: small tips, no milestone again');
  tw(1, 't3');
  const c = tw(2, 't4');
  assert.equal(c.reward.seals, 1, 'floor 15 first clear: 1 seal');
  const lost = applyDungeonResult(s, findChapter('T_tower:3'), { runId: 't5', stats: { kills: 0 } }, { victory: false }, T0);
  assert.equal(lost.reward.tips, 0);
  assert.equal(s.tower.best, 15, 'checkpoint kept');
});

test('quests reset by UTC day/week and pay once; every run entry is 5 energy', () => {
  const s = defaultSave();
  recordQuest(s, 'runs', 3, T0);
  assert.ok(questList(s, T0).find((q) => q.id === 'd_runs').done);
  const tips = s.tips;
  assert.ok(claimQuest(s, 'd_runs', T0).ok);
  assert.equal(claimQuest(s, 'd_runs', T0).reason, 'claimed');
  assert.equal(s.tips, tips + 60);
  assert.equal(questList(s, T0 + 86400000).find((q) => q.id === 'd_runs').progress, 0, 'next UTC day');
  assert.equal(questList(s, T0 + 86400000).find((q) => q.id === 'w_runs').progress, 3, 'weekly kept');
  for (const id of ['D_boss_kitchen:10,20,30', 'T_tower:4']) assert.equal(findChapter(id).energyCost, 5);
  const e = s.energy;
  debitForRun(e, 'a', T0, findChapter('T_tower:4').energyCost);
  assert.equal(e.value, 25);
});

test('migration v6: a 0.5A.1 save keeps everything, gets V1 fields once; unknown half-run is detectable', () => {
  const st = memStorage();
  const old = defaultSave();
  for (const k of ['equipLevels', 'bossSeals', 'bossKitchen', 'tower', 'quests', 'iap', 'monet']) delete old[k];
  old.dataVersion = 5;
  Object.assign(old, { tips: 4321, currencyParts: 77 });
  old.equipment.weapon = 'rare';
  old.stageProgress.levels[30] = { cleared: true, stars: 3, plays: 2 };
  old.stageProgress.highestUnlocked = 30;
  old.energy.value = 13;
  old.energy.lastRegenAt = Date.now();
  new SaveService(st).save(old);
  const s = new SaveService(st).load();
  assert.deepEqual([s.tips, s.currencyParts, s.equipment.weapon, s.stageProgress.levels[30].stars, s.energy.value, s.dataVersion], [4321, 77, 'rare', 3, 13, 6]);
  assert.deepEqual([s.equipLevels, s.bossSeals, s.tower.best], [{ weapon: 0, ladle: 0, apron: 0, pan: 0 }, 0, 0]);
  s.bossSeals = 5;
  new SaveService(st).save(s);
  assert.equal(new SaveService(st).load().bossSeals, 5, 'second migration changes nothing');
  assert.equal(findChapter('L999'), null);
});

test('monetization: interstitial pacing, no reward without verified callback, tip bonus once, IAP token once, refund removed on restore, revive once', () => {
  const s = defaultSave();
  for (let i = 0; i < 2; i++) noteRunCompleted(s);
  assert.equal(interstitialDue(s, T0), false, 'never in the first 2 runs');
  noteRunCompleted(s);
  assert.equal(interstitialDue(s, T0), true);
  assert.equal(consumeAdReward(s, { status: 'unavailable' }), false);
  assert.equal(consumeAdReward(s, { status: 'rewarded', verified: false, rewardId: 'x' }), false);
  assert.equal(applyTipBonus(s, 'run1', 100, { status: 'rewarded', verified: true, rewardId: 'r1' }), 40);
  assert.equal(applyTipBonus(s, 'run1', 100, { status: 'rewarded', verified: true, rewardId: 'r2' }), 0, 'once per run');
  assert.equal(consumeAdReward(s, { status: 'rewarded', verified: true, rewardId: 'r1' }), false, 'no replay');
  assert.ok(applyPurchase(s, { productId: 'remove_ads', token: 'tok1', state: 'purchased' }).ok);
  assert.equal(applyPurchase(s, { productId: 'remove_ads', token: 'tok1', state: 'purchased' }).reason, 'duplicate');
  assert.equal(applyPurchase(s, { productId: 'tip_pack', token: 'tok2', state: 'pending' }).ok, false);
  assert.equal(interstitialDue(s, T0 + 3600000), false, 'remove_ads owned');
  const d = restorePurchases(s, []); // refunded in the store
  assert.deepEqual(d.removed, ['remove_ads']);
  assert.equal(hasEntitlement(s, 'remove_ads'), false);
  const c = new RunController({ chapterId: 'L1', perm: permStats(defaultSave()), seed: 2, runId: 'rv', autoAck: true });
  c.start();
  c.run.chef.hp = 0;
  c.finish(false);
  assert.ok(c.revive(2));
  assert.deepEqual([c.finished, c.run.chef.hp, c.phase], [false, 2, PHASE.POT_REFILL]);
  c.finish(false);
  assert.equal(c.revive(2), false, 'once per run');
});

test('i18n: EN falls back to TR, never shows a raw key', () => {
  setLanguage('en');
  assert.equal(t('menu.play'), 'PLAY');
  assert.equal(t('no.such.key'), '');
  setLanguage('tr');
  assert.equal(t('menu.play'), 'OYNA');
});
