// tests/unit/save.test.mjs — Phase 05: Save System 2.0, migration, ledger, atomic purchases, garage effects.
import './_storage.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Save } from '../../src/core/SaveManager.js';
import { Progression } from '../../src/systems/Progression.js';
import { RewardLedger } from '../../src/systems/RewardLedger.js';
import { Game } from '../../src/core/DistrictRuntimeCore.js';
import { G } from '../../src/core/state.js';
import { SkillMgr } from '../../src/systems/SkillMgr.js';
import { GARAGE, GARAGE_ORDER, GARAGE_MAX, garageCost, garageTotalCost } from '../../src/data/garage.js';
import { COSMETICS } from '../../src/data/cosmetics.js';
import { PACKAGES } from '../../src/data/packages.js';
import { PLAYER_BASE } from '../../src/data/player.js';
import { CHAPTERS } from '../../src/data/chapters.js';

const K = Save.KEYS, LS = globalThis.localStorage;
const env = k => JSON.parse(LS.getItem(k));
function freshStorage() { LS.failWrites = false; LS.clear(); }

test('A/B slots: writes alternate, pointer commits, revision increases', () => {
  freshStorage(); Save.load(); Save.data.coins = 5; Save.write(); Save.data.coins = 6; Save.write();
  const p = env(K.ptr), a = env(K.a), b = env(K.b);
  assert.ok(a && b && a.rev !== b.rev); assert.equal(p.rev, Math.max(a.rev, b.rev)); assert.equal(env(K[p.slot]).data.coins, 6);
  Save.load(); assert.equal(Save.data.coins, 6); assert.equal(Save.loadStatus, 'loaded');
});

test('corrupt active slot -> last valid revision (recovered), corrupt data backed up', () => {
  freshStorage(); Save.load(); Save.data.coins = 10; Save.write(); Save.data.coins = 20; Save.write();
  const p = env(K.ptr); LS.setItem(K[p.slot], '{"schema":"deliverogue","v":2,"rev":99,"checksum":"bad","data":{"coins":999999}}');
  Save.load(); assert.equal(Save.loadStatus, 'recovered'); assert.equal(Save.data.coins, 10, 'previous revision'); assert.ok(LS.getItem(K.corrupt));
  freshStorage(); Save.load(); Save.data.coins = 7; Save.write(); LS.setItem(K.ptr, 'garbage');
  Save.load(); assert.equal(Save.data.coins, 7, 'bad pointer -> best valid slot');
});

test('crash between slot write and pointer commit keeps the last committed state valid', () => {
  freshStorage(); Save.load(); Save.data.coins = 1; Save.write(); const ptr = LS.getItem(K.ptr);
  Save.data.coins = 2; Save.write(); LS.setItem(K.ptr, ptr); // pointer rolled back = commit never happened
  Save.load(); assert.ok([1, 2].includes(Save.data.coins)); assert.ok(Number.isFinite(Save.meta.rev));
});

test('save failure: purchase rolled back, last valid save untouched, error hook fired', () => {
  freshStorage(); Save.load(); Save.data.coins = 1000; Save.write(); const before = LS.getItem(K[env(K.ptr).slot]);
  let fired = 0; Save.onError = () => fired++;
  LS.failWrites = true;
  assert.equal(Progression.buyUpgrade('motor'), false); assert.equal(Save.data.coins, 1000); assert.equal(Save.data.garage.motor, 0); assert.equal(fired, 1);
  LS.failWrites = false; assert.equal(LS.getItem(K[env(K.ptr).slot]), before); Save.onError = null;
  assert.equal(Progression.buyUpgrade('motor'), true); assert.equal(Save.data.coins, 890); assert.equal(Save.data.garage.motor, 1);
});

test('garage: affordability, max level, exact cost, total', () => {
  freshStorage(); Save.load(); Save.data.coins = garageTotalCost(); Save.write();
  for (const id of GARAGE_ORDER) for (let l = 0; l < GARAGE_MAX; l++) assert.ok(Progression.buyUpgrade(id), id + l);
  assert.equal(Save.data.coins, 0); assert.ok(GARAGE_ORDER.every(id => Save.data.garage[id] === 20));
  Save.data.coins = 1e6; assert.equal(Progression.buyUpgrade('motor'), false, 'max level');
  Save.data.coins = 0; Save.data.garage.helmet = 3; assert.equal(Progression.buyUpgrade('helmet'), false, 'unaffordable');
});

test('garage max effects (linear) applied from the run-start snapshot', () => {
  freshStorage(); Save.load(); GARAGE_ORDER.forEach(id => Save.data.garage[id] = 20);
  G.run = { mods: SkillMgr.compute([], []), pkg: Object.assign({}, PACKAGES.STANDARD_ORDER), garage: Object.assign({}, Save.data.garage) }; G.player = {}; Game.recalc();
  const p = G.player;
  assert.ok(Math.abs(p.speed / PLAYER_BASE.speed - 1.15) < 1e-9); assert.equal(p.maxHp, 140); assert.ok(Math.abs(p.dr - 0.2) < 1e-9);
  assert.ok(Math.abs(p.dmg - 12 * 1.5) < 1e-9); assert.equal(p.pkgMax, 140); assert.ok(Math.abs(p.slipMul - 0.6) < 1e-9); assert.ok(Math.abs(p.impactGarage - 0.6) < 1e-9);
  assert.ok(Math.abs(p.interval - 0.6 / 1.3) < 1e-9);
  Save.data.garage.helmet = 0; Game.recalc(); assert.equal(G.player.maxHp, 140, 'in-run change ignored (snapshot)');
  G.run = null; G.player = null;
});

test('skins: 6 originals, 5000 total, buy once (equips), free re-equip, no level gate', () => {
  assert.equal(COSMETICS.length, 6); assert.equal(COSMETICS.reduce((a, c) => a + c.price, 0), 5000);
  freshStorage(); Save.load(); Save.data.level = 1; Save.data.coins = 5000; Save.write();
  for (const c of COSMETICS.slice(1)) assert.ok(Progression.buySkin(c.id), c.id);
  assert.equal(Save.data.coins, 0); assert.equal(Progression.buySkin('SKIN_NEON'), false, 'owned already');
  assert.ok(Progression.equipSkin('SKIN_COFFEE')); assert.equal(Save.data.cosmetics.selected, 'SKIN_COFFEE'); assert.equal(Save.data.coins, 0);
  assert.equal(Progression.equipSkin('SKIN_UNKNOWN'), false);
});

test('HTML5 v1 migration: progress kept, 4 garage levels kept, legacy skins refunded once, backup kept', () => {
  freshStorage();
  const v1 = { v: 1, level: 7, xp: 30, coins: 120, garage: { motor: 3, helmet: 2, jacket: 1, pos: 4 }, unlocked: 5, completed: [true, true, true, true, false], stars: [3, 2, 1, 3],
    cosmetics: { owned: ['classic', 'mint', 'golden'], selected: 'golden' }, quests: { claimed: { q_3del: true } }, milestones: { unlocked: { m_first: true }, claimed: { m_first: true } }, mastery: { C01_0: true }, settings: { music: false } };
  LS.setItem('deliverogue_save', JSON.stringify(v1));
  Save.load(); const d = Save.data;
  assert.equal(Save.loadStatus, 'migrated'); assert.equal(d.legacy.source, 'html5_v1');
  assert.equal(d.level, 7); assert.equal(d.unlocked, 5); assert.deepEqual(d.stars.slice(0, 4), [3, 2, 1, 3]); assert.equal(d.settings.music, false); assert.ok(d.mastery.C01_0);
  assert.deepEqual([d.garage.motor, d.garage.helmet, d.garage.jacket, d.garage.pos, d.garage.bag], [3, 2, 1, 4, 0]);
  assert.equal(d.coins, 120 + 300 + 700, 'mint + golden refunded at original price'); assert.equal(d.cosmetics.selected, 'SKIN_DEFAULT');
  assert.deepEqual(d.legacy.cosmetics, ['classic', 'mint', 'golden']);
  assert.ok(RewardLedger.has('quest:q_3del') && RewardLedger.has('ms:m_first'), 'old claims recorded in the ledger');
  assert.equal(LS.getItem('deliverogue_save_v1_backup'), JSON.stringify(v1)); assert.ok(LS.getItem('deliverogue_save'), 'legacy key not deleted');
  Save.load(); assert.equal(Save.loadStatus, 'loaded'); assert.equal(Save.data.coins, 1120, 'reload: no second refund');
  assert.equal(Progression.claimQuest('q_3del'), false, 'old claim cannot pay again');
});

test('GDevelop DR_SAVE_V1 migration; both present -> HTML5 chosen, GDevelop recorded', () => {
  freshStorage(); LS.setItem('DR_SAVE_V1', JSON.stringify({ v: 1, PlayerLevel: 12, PlayerXP: 40, Coin: 900, EquippedSkinId: 'SKIN_NEON', OwnedSkinsJson: '["SKIN_DEFAULT","SKIN_NEON"]' }));
  Save.load(); assert.equal(Save.data.legacy.source, 'gdevelop_v1'); assert.equal(Save.data.level, 12); assert.equal(Save.data.coins, 900); assert.equal(Save.data.cosmetics.selected, 'SKIN_NEON');
  freshStorage(); LS.setItem('DR_SAVE_V1', JSON.stringify({ PlayerLevel: 30, Coin: 5 })); LS.setItem('deliverogue_save', JSON.stringify({ level: 4, coins: 50 }));
  Save.load(); assert.equal(Save.data.legacy.source, 'html5_v1'); assert.equal(Save.data.level, 4); assert.equal(Save.data.legacy.gdevelopDetected, true); assert.ok(LS.getItem('DR_SAVE_V1_backup'));
});

test('ledger: run settles once even across reload; one-time keys never pay twice', () => {
  freshStorage(); Save.load(); Save.data.runCounter = 10; Save.write();
  const run = { id: 'r1', seq: 11, ch: CHAPTERS[0], n: 1, success: true, reason: null, mods: {}, pkg: PACKAGES.STANDARD_ORDER, stats: { kills: 2, eliteKills: 0, pkgPct: 1, time: 20, playerDmg: 0, steamHits: 0, healUsed: false, impacts: 0, risky: false } };
  Progression.settle(run); const c1 = Save.data.coins; assert.ok(c1 > 0);
  Save.load(); Save.data.settled = []; Progression.settle(Object.assign({}, run, { id: 'r1-copy' }));
  assert.equal(Save.data.coins, c1, 'same run sequence rejected after reload (even with id list cleared)');
  assert.ok(RewardLedger.grant('test:x', 5)); assert.equal(RewardLedger.grant('test:x', 5), false);
});

test('export / import: v2 round trip, v1 bundle migrated, current save backed up', () => {
  freshStorage(); Save.load(); Save.data.coins = 77; Save.write();
  const b = Save.exportBundle(); const r = Save.inspectBundle(JSON.stringify(b)); assert.ok(r.ok && r.checksumOk && r.data.coins === 77);
  const v1b = { schema: 'deliverogue_save', v: 1, data: { level: 3, coins: 10, cosmetics: { owned: ['classic', 'midnight'], selected: 'classic' } } };
  const r1 = Save.inspectBundle(JSON.stringify(v1b)); assert.ok(r1.ok && r1.migrated); assert.equal(r1.data.coins, 460);
  assert.ok(Save.applyImport(r1.data)); assert.equal(Save.data.coins, 460); assert.ok(LS.getItem(K.importBackup));
});
