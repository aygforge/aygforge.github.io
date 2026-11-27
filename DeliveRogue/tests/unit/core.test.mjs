// tests/unit/core.test.mjs — node --test unit checks against the REAL runtime modules (no mock engine).
import './_storage.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateData } from '../../src/core/DataValidator.js';
import { Save } from '../../src/core/SaveManager.js';
import { Progression } from '../../src/systems/Progression.js';
import { SkillMgr } from '../../src/systems/SkillMgr.js';
import { RNG, hashStr } from '../../src/core/rng.js';
import { createEventBus, EV } from '../../src/core/EventBus.js';
import { CHAPTERS } from '../../src/data/chapters.js';
import { SKILLS } from '../../src/data/skills.js';
import { PLAYER_BASE } from '../../src/data/player.js';
import { garageCost, GARAGE_ORDER } from '../../src/data/garage.js';
import { ENEMY_CATALOG } from '../../src/data/enemyCatalog.js';
import { MapBuilder } from '../../src/systems/MapBuilder.js';
import { chapterKey } from '../../src/data/ids.js';

test('data authority validates (catalog 100, Coffee 12 chapters, maps reachable)', () => {
  const r = validateData({ maps: true });
  assert.deepEqual(r.errors, []);
  assert.equal(r.info.maps.length, 12);
  for (const m of r.info.maps) assert.equal(m.pickupDist, 48, m.id + ' pickup-start standard ~48 world px');
});

test('canonical enemy catalog is untouched (Ek A)', () => {
  assert.equal(ENEMY_CATALOG.length, 100);
  assert.equal(new Set(ENEMY_CATALOG.map(e => e.enemyId)).size, 100);
  const cof = ENEMY_CATALOG.filter(e => e.districtCode === 'COF').map(e => e.enemyId);
  assert.deepEqual(cof, ['COF_N_BeanBandit', 'COF_N_LatteImp', 'COF_N_SugarSprite', 'COF_N_BaristaGoblin', 'COF_N_DripCultist', 'COF_N_MugMimic', 'COF_N_CreamDrifter', 'COF_E_GrinderKnight', 'COF_E_SteamJugger', 'COF_B_LatteArtDragon']);
});

test('Coffee baseline table (Ek C) preserved', () => {
  const exp = [[60, 6, 1, false, 60], [70, 8, 1, false, 80], [80, 10, 1, false, 100], [90, 12, 2, false, 120], [100, 14, 2, false, 140], [110, 16, 2, false, 160],
    [115, 18, 2, true, 180], [125, 20, 2, true, 200], [130, 22, 2, true, 220], [140, 24, 2, true, 240], [150, 26, 2, true, 260], [160, 30, 2, true, 280]];
  CHAPTERS.forEach((c, i) => assert.deepEqual([c.timer, c.enemies, c.picks, c.cp, c.coins], exp[i], c.id));
  assert.deepEqual(PLAYER_BASE, { hp: 100, dmg: 12, interval: 0.60, speed: 85, invuln: 0.6, range: 172, critChance: 0.05, critMul: 1.5 });
  assert.equal(SKILLS.length, 60); assert.deepEqual(SKILLS.slice(0, 20).map(s => s.id).join(','), 'double_order,rapid_payment,piercing_card,ricochet,critical_receipt,diagonal_delivery,electric_card,frozen_payment,burning_receipt,toxic_payment,reinforced_helmet,emergency_shield,cashback,protective_packaging,heat_resistant_bag,express_courier,emergency_brake,last_minute,shortcut_expert,perfect_balance');
});

test('map build is deterministic per chapter', () => {
  for (const ch of CHAPTERS) {
    const a = MapBuilder.build(ch), b = MapBuilder.build(ch);
    assert.deepEqual(Array.from(a.tile), Array.from(b.tile)); assert.equal(a.pathLen, b.pathLen);
  }
});

test('seeded RNG deterministic; separate streams', () => {
  const s = hashStr('C01'); const a = RNG(s), b = RNG(s), c = RNG((s ^ 0x9E3779B9) >>> 0);
  const xa = [...Array(20)].map(() => a.next()), xb = [...Array(20)].map(() => b.next()), xc = [...Array(20)].map(() => c.next());
  assert.deepEqual(xa, xb); assert.notDeepEqual(xa, xc);
});

test('skill modifiers recompute from scratch (no double stacking)', () => {
  const once = SkillMgr.compute(['rapid_payment']);
  const again = SkillMgr.compute(['rapid_payment']);
  assert.deepEqual(once, again);
  const two = SkillMgr.compute(['rapid_payment', 'rapid_payment']);
  assert.notDeepEqual(once, two);
});

test('save validation repairs corrupted / hostile data', () => {
  const d = Save.validate({ coins: -50, level: 'x', xp: Infinity, garage: { motor: 99, pos: 3.7 }, stars: [5, -1, 'a'], completed: [true, true], unknown: { a: 1 },
    cosmetics: { owned: ['SKIN_DEFAULT', 'hacked'], selected: 'hacked' }, settled: [1, 'r1'], mastery: { C01_0: true, bogus: true } });
  assert.equal(d.coins, 0); assert.equal(d.level, 1); assert.equal(d.xp, 0);
  assert.equal(d.garage.motor, 20); assert.equal(d.garage.pos, 3);
  assert.deepEqual(d.stars.slice(0, 3), [3, 0, 0]);
  assert.equal(d.unlocked, 3, 'completed chapters imply unlock');
  assert.deepEqual(d.cosmetics.owned, ['SKIN_DEFAULT']); assert.equal(d.cosmetics.selected, 'SKIN_DEFAULT');
  assert.deepEqual(d.settled, ['r1']); assert.deepEqual(Object.keys(d.mastery), ['C01_0']);
  assert.equal('unknown' in d, false);
  const dv = Save.validate(null), df = Save.defaults(); assert.deepEqual(Object.assign({}, dv, { legacy: null }), Object.assign({}, df, { legacy: null }));
});

let seqN = 0;
function fakeRun(id, n, success, over = {}) {
  return { id, seq: ++seqN, ch: CHAPTERS[n - 1], n, success, reason: success ? null : 'hp',
    stats: Object.assign({ kills: 3, eliteKills: 0, pkgPct: 0.95, time: 20, playerDmg: 5, steamHits: 0, healUsed: false, impacts: 0, risky: false }, over), skills: [] };
}

test('run settle is idempotent and fail gives no unlock', () => {
  Save.reset();
  const r1 = fakeRun('t1', 1, true);
  const a = Progression.settle(r1); const coins = Save.data.coins;
  assert.ok(a.coins > 0); assert.equal(Save.data.unlocked, 2); assert.equal(Save.data.stats.deliveries, 1);
  Progression.settle(r1); Progression.settle(r1);
  assert.equal(Save.data.coins, coins, 'no duplicate coins'); assert.equal(Save.data.stats.deliveries, 1);
  Progression.settle(fakeRun('t2', 2, false));
  assert.equal(Save.data.unlocked, 2); assert.equal(Save.data.stats.failures, 1);
});

test('garage: 8 categories on the 1.20 curve', () => {
  assert.equal(GARAGE_ORDER.length, 8);
  assert.equal(garageCost('motor', 0), 110); assert.equal(garageCost('motor', 1), Math.round(110 * 1.2)); assert.equal(garageCost('battery', 19), Math.round(150 * Math.pow(1.2, 19)));
});

test('event bus: legacy API, typed envelopes, isolated listener errors', () => {
  const bus = createEventBus(); const got = [];
  bus.on('end', d => got.push(d)); bus.on('end', () => { throw new Error('x'); }); bus.on('end', d => got.push(d));
  const orig = console.error; console.error = () => {}; bus.emit('end', 1); console.error = orig;
  assert.deepEqual(got, [1, 1]);
  const evs = []; bus.on(EV.PICKUP, e => evs.push(e));
  bus.emitTyped(EV.PICKUP, { runId: 'r9', episode: 'COF', chapter: 'C01' }, {}); bus.emitTyped(EV.PICKUP, { runId: 'r9' }, {});
  assert.equal(evs.length, 2); assert.notEqual(evs[0].eventId, evs[1].eventId);
});

test('chapter keys accept C1/C01 aliases', () => {
  assert.equal(chapterKey('campaign', 'COF', 'C1'), 'campaign:COF:C01');
  assert.equal(chapterKey('campaign', 'COF', 12), 'campaign:COF:C12');
});
