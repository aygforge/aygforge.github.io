// tests/unit/skills.test.mjs — Phase 03: 60 skills, 20 evolutions, offers, caps, Run XP budget (real modules).
import './_storage.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS, SKILL_BY_ID, EVOLUTIONS, RARITY, FALLBACK } from '../../src/data/skills.js';
import { SkillMgr } from '../../src/systems/SkillMgr.js';
import { Game } from '../../src/core/DistrictRuntimeCore.js';
import { G } from '../../src/core/state.js';
import { Save } from '../../src/core/SaveManager.js';
import { RNG } from '../../src/core/util.js';
import { CHAPTERS } from '../../src/data/chapters.js';
import { PACKAGES } from '../../src/data/packages.js';
import { MapBuilder } from '../../src/systems/MapBuilder.js';
import { RUN_XP_TABLE, RUN_XP_PER_LEVEL, xpPlan } from '../../src/data/runxp.js';

const mkRun = (seed = 7, n = 1, extra = {}) => Object.assign({ skills: [], evos: [], ch: CHAPTERS[n - 1], pkg: PACKAGES.STANDARD_ORDER, srng: RNG(seed) }, extra);
const giveMax = (run, id) => { while (SkillMgr.count(run.skills, id) < SKILL_BY_ID[id].max) run.skills.push(id); };

test('catalog: 60 unique skills, category split 18/12/12/12/6, rarities valid, prereqs resolve', () => {
  assert.equal(SKILLS.length, 60); assert.equal(new Set(SKILLS.map(s => s.id)).size, 60);
  const cat = {}; SKILLS.forEach(s => { cat[s.cat] = (cat[s.cat] || 0) + 1; assert.ok(RARITY[s.rarity], s.id); if (s.prereq) assert.ok(SKILL_BY_ID[s.prereq], s.id); });
  assert.deepEqual(cat, { attack: 18, elemental: 12, defense: 12, movement: 12, economy: 6 });
  assert.equal(SKILLS.filter(s => s.base).length, 4);
});

test('20 evolutions, prerequisites exist, distinct ids', () => {
  assert.equal(EVOLUTIONS.length, 20); assert.equal(new Set(EVOLUTIONS.map(e => e.id)).size, 20);
  EVOLUTIONS.forEach(e => { assert.ok(SKILL_BY_ID[e.a], e.id + ' a'); assert.ok(SKILL_BY_ID[e.b], e.id + ' b'); assert.notEqual(e.a, e.b); });
});

test('compute() is pure and recomputed from scratch (no double stacking)', () => {
  const a = SkillMgr.compute(['power_transaction'], []), b = SkillMgr.compute(['power_transaction'], []);
  assert.deepEqual(a, b); assert.equal(a.dmgMul, 1.15);
  assert.equal(SkillMgr.compute(['power_transaction', 'power_transaction'], []).dmgMul, 1.3);
  assert.equal(SkillMgr.compute(['double_order', 'double_order', 'rapid_payment', 'rapid_payment'], ['payment_storm']).extraMul, 1.0);
  assert.equal(SkillMgr.compute(['golden_receipt', 'bonus_contract'], ['golden_route']).coinGold, 0.45);
});

test('caps: damage reduction 80%, interval floor .12s, crit 100%', () => {
  Save.reset(); Object.assign(Save.data.garage, { jacket: 20, motor: 20 });
  G.run = { mods: SkillMgr.compute(['heavy_armor', 'heavy_armor', 'rapid_payment', 'rapid_payment', 'critical_receipt', 'critical_receipt', 'precision_payment', 'precision_payment', 'double_order', 'double_order', 'reinforced_helmet', 'reinforced_helmet'], ['payment_storm', 'perfect_transaction', 'iron_courier']), pkg: PACKAGES.STANDARD_ORDER };
  G.run.mods.intervalMul = 0.01; G.run.mods.critC = 5; G.run.mods.drAdd = 5;
  G.player = {}; Game.recalc();
  assert.equal(G.player.dr, 0.8); assert.equal(G.player.interval, 0.12); assert.equal(G.player.critC, 1);
  assert.ok(G.player.speed <= G.player.speedCap);
  G.run = null; G.player = null; Save.reset();
});

test('offers are deterministic per seed and never exceed max rank', () => {
  const r1 = mkRun(42), r2 = mkRun(42), seq1 = [], seq2 = [];
  for (let i = 0; i < 12; i++) {
    const o1 = SkillMgr.offer(r1), o2 = SkillMgr.offer(r2); seq1.push(o1.join()); seq2.push(o2.join());
    assert.equal(new Set(o1).size, o1.length, 'distinct options');
    const pick = o1[0]; if (SkillMgr.kindOf(pick) === 'skill') { r1.skills.push(pick); r2.skills.push(pick); } else if (SkillMgr.kindOf(pick) === 'evo') { r1.evos.push(pick); r2.evos.push(pick); }
    r1.skills.forEach(id => assert.ok(SkillMgr.count(r1.skills, id) <= SKILL_BY_ID[id].max, id));
  }
  assert.deepEqual(seq1, seq2);
});

test('filters: prerequisites, single base element, chapter context', () => {
  const run = mkRun(1);
  for (let i = 0; i < 200; i++) {
    const o = SkillMgr.offer(mkRun(i));
    o.forEach(id => { const s = SKILL_BY_ID[id]; assert.ok(!s.prereq, 'support without its element: ' + id); assert.ok(!['first_aid_kit', 'package_repair', 'checkpoint_boost', 'boss_invoice', 'insulated_box', 'cooling_system', 'smooth_rider'].includes(id), 'context filtered: ' + id); });
  }
  run.skills.push('electric_card');
  assert.equal(SkillMgr.eligible(run, 'frozen_payment'), false); assert.equal(SkillMgr.eligible(run, 'static_charge'), true); assert.equal(SkillMgr.eligible(run, 'frostbite'), false);
  const cpRun = mkRun(1, 7); assert.equal(SkillMgr.eligible(cpRun, 'first_aid_kit'), true);
  assert.equal(SkillMgr.eligible(mkRun(1, 12, { ch: Object.assign({}, CHAPTERS[11], { boss: true }) }), 'boss_invoice'), true);
});

test('evolutions: offered when eligible, once, each skill feeds at most one evolution', () => {
  const run = mkRun(3, 7); giveMax(run, 'piercing_card'); giveMax(run, 'ricochet'); giveMax(run, 'electric_card');
  assert.deepEqual(SkillMgr.eligibleEvos(run).sort(), ['chain_reaction', 'infinity_receipt']);
  const o = SkillMgr.offer(run); assert.ok(['chain_reaction', 'infinity_receipt'].includes(o[0]), 'evolution takes a slot');
  run.evos.push('infinity_receipt');
  assert.deepEqual(SkillMgr.eligibleEvos(run), [], 'ricochet already used by infinity_receipt');
});

test('every evolution is reachable in its intended context', () => {
  const ctxRun = { checkpoint: 7, boss: 12, thermal: 1, fizzy: 1 };
  for (const e of EVOLUTIONS) {
    const needs = [e.a, e.b].map(id => SKILL_BY_ID[id].req).filter(Boolean);
    const n = needs.includes('checkpoint') ? 7 : 1;
    const ch = Object.assign({}, CHAPTERS[n - 1], needs.includes('boss') ? { boss: true } : {});
    const pkg = needs.includes('thermal') ? { id: 'HOT_ORDER' } : PACKAGES.STANDARD_ORDER;
    const run = mkRun(5, n, { ch, pkg });
    for (const id of [e.a, e.b]) { const p = SKILL_BY_ID[id].prereq; if (p) giveMax(run, p); assert.ok(SkillMgr.eligible(run, id), `${e.id}: ${id} eligible`); giveMax(run, id); }
    assert.ok(SkillMgr.eligibleEvos(run).includes(e.id), e.id);
  }
  void ctxRun;
});

test('fallback only when no valid option exists', () => {
  const run = mkRun(9); SKILLS.forEach(s => { if (SkillMgr.eligible(run, s.id)) giveMax(run, s.id); });
  // fill remaining eligible (supports become eligible after their element)
  for (let k = 0; k < 3; k++) SKILLS.forEach(s => { if (SkillMgr.eligible(run, s.id)) giveMax(run, s.id); });
  run.evos = SkillMgr.eligibleEvos(run).slice(); // take all that are eligible (blocks re-offer)
  let guard = 0; while (SkillMgr.eligibleEvos(run).length && guard++ < 30) run.evos.push(SkillMgr.eligibleEvos(run)[0]);
  assert.deepEqual(SkillMgr.offer(run), [FALLBACK.id]);
});

test('rarity class weights ≈ 55/30/12/3 when all classes are available', () => {
  const cls = { C: 0, R: 0, E: 0, L: 0 }, N = 6000;
  for (let i = 0; i < N; i++) { const run = mkRun(1000 + i); run.skills.push('electric_card'); const id = SkillMgr.offer(run)[0]; cls[SKILL_BY_ID[id].rarity]++; }
  assert.ok(Math.abs(cls.C / N - 0.55) < 0.04 && Math.abs(cls.R / N - 0.30) < 0.04 && Math.abs(cls.E / N - 0.12) < 0.03 && Math.abs(cls.L / N - 0.03) < 0.015, JSON.stringify(cls));
});

test('Run XP budget: route-only reaches the minimum pick target; full XP stays within target', () => {
  for (const ch of CHAPTERS) {
    const w = MapBuilder.build(ch), plan = xpPlan(ch, w), row = RUN_XP_TABLE.find(r => ch.n >= r.from && ch.n <= r.to);
    const route = plan.seg * plan.routeSegIdx.size + plan.cp + plan.drop * (w.drops.length - 1);
    assert.ok(Math.abs(route - row.route) < 1e-6, ch.id + ' route budget');
    const routeOnly = ch.picks + Math.floor((route + 1e-9) / RUN_XP_PER_LEVEL), full = ch.picks + Math.floor((route + row.combat + plan.risky + 1e-9) / RUN_XP_PER_LEVEL);
    assert.ok(routeOnly >= row.target[0], `${ch.id} route-only picks ${routeOnly}`);
    assert.ok(full <= row.target[1] + 1, `${ch.id} full picks ${full}`);
  }
});
