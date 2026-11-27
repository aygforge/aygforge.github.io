// tests/unit/ui.test.mjs — static checks for the scene framework (no DOM needed).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import tr from '../../src/locales/tr.js';
import { RANK_LEVELS, rankOf } from '../../src/ui/UITheme.js';

const files = ['src/ui', 'src/scenes'].flatMap(d => fs.readdirSync(d).map(f => path.join(d, f)));

test('every literal T() key used by scenes/UI exists in the TR locale', () => {
  const missing = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bT\('([A-Za-z0-9_]+)'[,)]/g)) if (!(m[1] in tr)) missing.push(`${f}: ${m[1]}`);
  }
  assert.deepEqual(missing, []);
});

test('dynamic key families are complete', () => {
  for (let i = 0; i < 7; i++) assert.ok(tr['rank_' + i], 'rank_' + i);
  for (const m of ['campaign', 'endless', 'timeAttack', 'daily', 'bossRush', 'nightmare']) assert.ok(tr['mode_' + m], m);
  for (const k of ['master', 'music', 'sfx', 'shake', 'vibe', 'reducedMotion', 'lowGfx']) assert.ok(tr['s_' + k], k);
  for (const k of ['home', 'garage', 'runprep', 'metahub', 'settings']) assert.ok(tr['nav_' + k], k);
});

test('8 scene modules exist with the scene contract', async () => {
  const ids = ['Boot', 'MainMenu', 'Garage', 'MetaHub', 'RunPrep', 'FightScene', 'RunSummary', 'Settings'];
  for (const id of ids) {
    const src = fs.readFileSync(`src/scenes/${id}.js`, 'utf8');
    assert.match(src, new RegExp(`id: '${id}'`)); assert.match(src, /enter\(ctx/); assert.match(src, /exit\(/);
  }
  // hub scenes are exactly the five navbar targets
  const hubs = ids.filter(id => /hub: true/.test(fs.readFileSync(`src/scenes/${id}.js`, 'utf8')));
  assert.deepEqual(hubs.sort(), ['Garage', 'MainMenu', 'MetaHub', 'RunPrep', 'Settings']);
});

test('ranks follow the master prompt level bands', () => {
  assert.deepEqual(RANK_LEVELS, [1, 10, 20, 35, 50, 75, 100]);
  assert.equal(rankOf(1), 0); assert.equal(rankOf(9), 0); assert.equal(rankOf(10), 1); assert.equal(rankOf(34), 2);
  assert.equal(rankOf(35), 3); assert.equal(rankOf(74), 4); assert.equal(rankOf(99), 5); assert.equal(rankOf(100), 6);
});

test('no energy / gems / fuel / premium currency in visible text', () => {
  const bad = /\b(enerji|elmas|yakıt|mücevher|energy|gems?|fuel|diamonds?)\b/i;
  for (const [k, v] of Object.entries(tr)) if (typeof v === 'string') assert.doesNotMatch(v, bad, k);
});
