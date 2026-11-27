// tests/unit/coffee.test.mjs — Phase 04 data + map + save rules (real modules).
import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGES, MYSTERY_POOL, FINAL_FORBIDDEN, pkgOf, CHAPTER_TYPES } from '../../src/data/packages.js';
import { CHAPTERS } from '../../src/data/chapters.js';
import { MapBuilder } from '../../src/systems/MapBuilder.js';
import { resolveMystery, PackageRules } from '../../src/systems/PackageRules.js';
import { Save } from '../../src/core/SaveManager.js';
import { BOSSES } from '../../src/data/bosses.js';
import { ENEMY_DB } from '../../src/data/enemies.js';
import { ENEMY_CATALOG } from '../../src/data/enemyCatalog.js';

test('12 packages with contract values', () => {
  assert.equal(Object.keys(PACKAGES).length, 12);
  const hp = Object.fromEntries(Object.values(PACKAGES).map(p => [p.id, p.hp]));
  assert.deepEqual(hp, { STANDARD_ORDER: 100, HEAVY_PACKAGE: 120, FRAGILE_ORDER: 100, XL_ORDER: 180, LIGHTWEIGHT_ORDER: 65, REINFORCED_ORDER: 130, PREMIUM_ORDER: 80, VIP_ORDER: 100, HOT_ORDER: 100, FROZEN_ORDER: 100, FIZZY_ORDER: 90, MYSTERY_ORDER: 100 });
  assert.equal(pkgOf('HEAVY_ORDER').id, 'HEAVY_PACKAGE', 'legacy alias');
  assert.equal(PACKAGES.FRAGILE_ORDER.hazardMul, 1.5); assert.equal(PACKAGES.XL_ORDER.speedMul, 0.8); assert.equal(PACKAGES.LIGHTWEIGHT_ORDER.speedMul, 1.12);
  assert.equal(CHAPTER_TYPES.length, 6);
});

test('Coffee chapters: names / timers / enemy counts kept, one special rule each, boss only on C12', () => {
  const names = ['First Cup', 'Barista Run', 'Steam Intro', 'Spilled Espresso', 'Register Side', 'Steam Tunnel', 'Coffee Break Checkpoint', 'Double Counter Split', 'Rush Hour', 'Closing Shift', 'Late Order', 'Midnight Brew'];
  CHAPTERS.forEach((c, i) => { assert.equal(c.name, names[i]); assert.ok(PACKAGES[c.pkg], c.id); assert.ok(CHAPTER_TYPES.includes(c.type), c.id); });
  assert.deepEqual(CHAPTERS.map(c => c.timer), [60, 70, 80, 90, 100, 110, 115, 125, 130, 140, 150, 160]);
  assert.deepEqual(CHAPTERS.map(c => c.enemies), [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 30]);
  assert.deepEqual(CHAPTERS.filter(c => c.boss).map(c => c.n), [12]);
  assert.ok(!FINAL_FORBIDDEN.includes(CHAPTERS[11].pkg));
  assert.deepEqual(CHAPTERS.filter(c => c.type === 'MULTI_DROP_ROUTE').map(c => c.n), [7, 11]);
  assert.ok(CHAPTERS.some(c => c.pkg === 'HOT_ORDER') && CHAPTERS.some(c => c.pkg === 'FIZZY_ORDER'), 'Coffee themes Hot / Fizzy');
});

test('maps: multi-drop zones, arena gates, every variant combination class validates', () => {
  for (const ch of CHAPTERS) {
    const w = MapBuilder.build(ch); assert.ok(MapBuilder.validateWorld(w).ok, ch.id);
    assert.equal(w.drops.length, ch.type === 'MULTI_DROP_ROUTE' ? 2 : 1, ch.id);
    assert.equal(!!w.arena, !!ch.boss, ch.id);
    // each combat segment in each variant individually + 5 seeded combinations
    ch.layout.forEach(([, en], i) => { if (!en) return; for (const v of [1, 2]) { const vs = ch.layout.map(() => 0); vs[i] = v; const wv = MapBuilder.build(ch, { variants: vs }); assert.ok(MapBuilder.validateWorld(wv).ok, `${ch.id} seg ${i} v${v}`); } });
    for (let sd = 1; sd <= 5; sd++) { const ws = MapBuilder.build(ch, { seed: sd * 7919 }); assert.ok(MapBuilder.validateWorld(ws).ok); assert.equal(ws.segs.reduce((a, s) => a + s.enemies.length, 0), ch.enemies, 'same enemy budget'); }
  }
  const a = MapBuilder.build(CHAPTERS[8], { seed: 42 }), b = MapBuilder.build(CHAPTERS[8], { seed: 42 });
  assert.deepEqual(Array.from(a.tile), Array.from(b.tile), 'same seed -> same geometry');
  assert.deepEqual(MapBuilder.chooseVariants(CHAPTERS[0], 99), CHAPTERS[0].layout.map(() => 0), 'tutorial chapters canonical');
});

test('Mystery: deterministic per (key, attempt), never Mystery, finals exclude extra fail gates', () => {
  assert.equal(resolveMystery('campaign:COF:C05', 3), resolveMystery('campaign:COF:C05', 3));
  const seen = new Set(); for (let a = 1; a < 200; a++) { const r = resolveMystery('campaign:COF:C05', a); assert.ok(MYSTERY_POOL.includes(r)); seen.add(r); }
  assert.ok(seen.size >= 8);
  for (let a = 1; a < 200; a++) assert.ok(!FINAL_FORBIDDEN.includes(resolveMystery('campaign:COF:C12', a, CHAPTERS[11])));
  const eff = PackageRules.effective('MYSTERY_ORDER', 'XL_ORDER'); assert.equal(eff.hp, 180); assert.equal(eff.reward, 1.4, 'reward bonus once (Mystery), not stacked');
});

test('boss catalog identity unchanged; boss data present', () => {
  const c = ENEMY_CATALOG.find(e => e.enemyId === 'COF_B_LatteArtDragon');
  assert.equal(ENEMY_DB.COF_B_LatteArtDragon.name, c.name); assert.equal(ENEMY_DB.COF_B_LatteArtDragon.role, 'Boss'); assert.equal(ENEMY_DB.COF_B_LatteArtDragon.arch, 'Boss');
  const B = BOSSES.COF_B_LatteArtDragon; assert.deepEqual(B.phases, [1, 0.7, 0.3]);
  for (const k of ['breath', 'steam', 'rain']) { const a = B.attacks[k]; assert.ok(a.warn > 0 && a.active > 0 && a.recover > 0 && 'dmg' in a && 'pkg' in a, k); }
});

test('save migration: legacy C12 clear is kept as legacy, the boss final must be replayed', () => {
  const legacy = { level: 9, coins: 500, unlocked: 12, completed: Array(12).fill(true), stars: Array(12).fill(3), episodes: { coffee: true } };
  const d = Save.validate(legacy);
  assert.equal(d.completed[11], true); assert.equal(d.unlocked, 12); assert.equal(d.legacyFinalClear, true);
  assert.equal(d.episodes.coffee, false, 'no imaginary boss victory'); assert.equal(d.bossClears.COF, false);
  const again = Save.validate(JSON.parse(JSON.stringify(d))); assert.equal(again.legacyFinalClear, true, 'migration idempotent');
  const won = Save.validate(Object.assign({}, d, { bossClears: { COF: true } })); assert.equal(won.episodes.coffee, true);
  const bad = Save.validate({ mysteries: { 'campaign:COF:C05': { rule: 'MYSTERY_ORDER', attempt: 1 }, junk: { rule: 'HOT_ORDER' } } });
  assert.deepEqual(bad.mysteries, {}, 'invalid mystery entries dropped');
});
