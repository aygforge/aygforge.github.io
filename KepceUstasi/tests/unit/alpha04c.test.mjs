// Alpha 0.4C — level kimlikleri: dinamik dalga/kart sayısı, near/staggered, pot bonus, çift elit zafer kapısı.
import test from 'node:test';
import assert from 'node:assert/strict';
import { stageByLevel, findChapter } from '../../src/data/stages.js';
import { ENEMIES } from '../../src/data/content.js';
import { spawnWave } from '../../src/systems/EnemyDirector.js';
import { resolveVolley } from '../../src/systems/CombatResolver.js';
import { computeStageReward } from '../../src/systems/Progression.js';
import { newRunState } from '../../src/systems/RunController.js';
import { permStats } from '../../src/systems/Progression.js';
import { defaultSave } from '../../src/systems/SaveService.js';
import { Rng } from '../../src/core/rng.js';
import { normal } from './helpers.mjs';

const runFor = (lvl) => newRunState({ chapter: stageByLevel(lvl), perm: permStats(defaultSave()), seed: 3, runId: 'x' });

test('every level has its own identity; wave count 3–6 and one pick per normal wave', () => {
  const sig = new Set();
  for (let l = 1; l <= 20; l++) {
    const s = stageByLevel(l);
    assert.ok(s.waves.length >= 3 && s.waves.length <= 6);
    assert.deepEqual(s.skillWaves, s.waves.map((_, i) => i + 1));
    sig.add(JSON.stringify([s.waves, s.recipe, s.finals]));
  }
  assert.equal(sig.size, 20, 'no two levels are copies');
  assert.deepEqual([stageByLevel(1).waves.length, stageByLevel(10).waves.length, stageByLevel(20).waves.length], [3, 6, 6]);
  const nonBossFinals = new Set();
  for (let l = 1; l <= 20; l++) if (l !== 10 && l !== 20) nonBossFinals.add(stageByLevel(l).finalName);
  assert.ok(nonBossFinals.size >= 15, 'finals are not the same elite again and again');
});

test('L8 rush spawns nearer; staggered levels spread spawn depth; L7 pot bonus = big-oil rate x1.35 only', () => {
  const r8 = runFor(8);
  for (const e of spawnWave(r8, stageByLevel(8), new Rng(1))) assert.ok(e.x >= 0.53 && e.x <= 0.59);
  const r9 = runFor(9);
  r9.wave = 2;
  const xs = spawnWave(r9, stageByLevel(9), new Rng(2)).map((e) => e.x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.1, `staggered depth ${xs}`);
  assert.equal(stageByLevel(7).bigOilRate, +(findChapter('menemen').bigOilRate * 1.35).toFixed(4));
  assert.equal(stageByLevel(6).bigOilRate, findChapter('menemen').bigOilRate);
});

test('L9 / L19 dual elite: both spawn, victory only when BOTH are down (once)', () => {
  for (const lvl of [9, 19]) {
    const run = runFor(lvl);
    run.wave = stageByLevel(lvl).waves.length + 1;
    const finals = spawnWave(run, stageByLevel(lvl), new Rng(1));
    assert.equal(finals.length, 2);
    assert.ok(finals.every((f) => f.boss && ENEMIES[f.type].elite));
    // shots target the nearer final first (finals[1] spawns 0.04 closer)
    finals[1].hp = 1;
    finals[1].shield = 0;
    let r = resolveVolley(run, stageByLevel(lvl), normal(1));
    assert.ok(finals[1].dead && !finals[0].dead);
    assert.equal(r.victory, false, 'one elite down is not a win');
    finals[0].hp = 1;
    finals[0].shield = 0;
    r = resolveVolley(run, stageByLevel(lvl), normal(1));
    assert.equal(r.victory, true);
    assert.equal(r.events.filter((e) => e.type === 'victory').length, 1);
  }
  assert.ok(stageByLevel(19).finals.every((t) => ENEMIES[t].sprite === 'armored_potato' && ENEMIES[t].shield === 2));
});

test('L10/L20 keep the chapter boss AI types; partial reward uses the level\'s own wave count', () => {
  assert.deepEqual(stageByLevel(10).finals, ['giant_tomato']);
  assert.deepEqual(stageByLevel(20).finals, ['potato_king']);
  const r = computeStageReward(stageByLevel(1), { victory: false, completedWaves: 3 });
  assert.equal(r.total, Math.floor(60 * 0.7)); // 3 of 3 waves
});
