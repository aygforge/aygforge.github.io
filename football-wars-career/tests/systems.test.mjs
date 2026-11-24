import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshCareer } from './helpers.mjs';
import { envelope, openEnvelope, validateState } from '../src/persist/save.js';
import { addXP, makeStar, pendingSpecs, compileMod, ageStar } from '../src/career/stars.js';
import { XP_NEXT, SPONSOR, facCost } from '../src/data/balance.js';
import { Rng } from '../src/career/util.js';
import { executeTransfer, chooseSpec, upgradeFacility, actionsLeft, signAtAsk, askFor } from '../src/career/management.js';
import { takeAdvance, canAdvance, weeklyBreakdown } from '../src/career/economy.js';
import { startWeek } from '../src/career/season.js';
import { aiWeek } from '../src/ai/manager.js';
import { validateClubInput } from '../src/career/validate.js';

test('save envelope: roundtrip, checksum, corrupted and foreign files rejected', () => {
  const S = freshCareer(31); startWeek(S);
  const text = envelope(S);
  const back = openEnvelope(text).state;
  assert.equal(JSON.stringify(back), JSON.stringify(S));
  const env = JSON.parse(text); env.data = env.data.replace('"budget":', '"budget": 1e9, "x":');
  assert.throws(() => openEnvelope(JSON.stringify(env)), /corrupted/);
  assert.throws(() => openEnvelope('{"hello":1}'), /Not a Football Wars/);
  assert.throws(() => openEnvelope('not json'), /JSON/);
  const bad = JSON.parse(JSON.stringify(S)); bad.divisions[3].pop();
  assert.equal(validateState(bad).ok, false);
  const bad2 = JSON.parse(JSON.stringify(S)); const c = Object.values(bad2.clubs).find(x => x.stars.length); bad2.stars[c.stars[0]].clubId = 'C001x';
  assert.equal(validateState(bad2).ok, false, 'star ownership mismatch rejected');
  assert.equal(validateState(S).ok, true);
});

test('stars: XP formula 50+25L, specialisation points at 4/9/15, growth, ageing; transfers keep progress', () => {
  const r = new Rng(3);
  const s = makeStar(r, { id: 'X1', name: 'Test', role: 'striker', age: 19, ovr: 45, rarity: 'elite', clubId: 'PLAYER', level: 1 });
  assert.equal(XP_NEXT(1), 75); assert.equal(XP_NEXT(10), 300);
  const o0 = s.ovr;
  addXP(s, 75 + 100 + 125, 1); assert.equal(s.level, 4); assert.ok(s.ovr > o0);
  assert.equal(pendingSpecs(s), 1);
  const S = freshCareer(32); S.stars.X1 = s; S.clubs.PLAYER.stars.push('X1');
  assert.ok(chooseSpec(S, S.clubs.PLAYER, 'X1', 'finisher').ok);
  assert.equal(chooseSpec(S, S.clubs.PLAYER, 'X1', 'finisher').ok, false);
  const m = compileMod(s); assert.ok(m.shootAcc > 0.3, 'signature + spec affect battle modifiers');
  startWeek(S); const buyer = Object.values(S.clubs).find(c => c.ai && c.division === 10 && c.stars.length < 8); buyer.budget = 99999;
  const snap = JSON.stringify({ l: s.level, x: s.xp, o: s.ovr, p: s.pot, sp: s.specs, a: s.age });
  assert.ok(executeTransfer(S, 'X1', buyer.id, 500, 50, 2).ok);
  assert.equal(JSON.stringify({ l: s.level, x: s.xp, o: s.ovr, p: s.pot, sp: s.specs, a: s.age }), snap);
  const old = makeStar(r, { id: 'X2', name: 'Vet', role: 'defender', age: 36, ovr: 60, rarity: 'rising', clubId: null, level: 15 });
  let retired = false; for (let k = 0; k < 5 && !retired; k++) retired = ageStar(old, r); assert.ok(retired, 'veterans retire by 39');
});

test('AI clubs follow the same rules: 2 actions, real prices, no invisible money', () => {
  const S = freshCareer(33); startWeek(S);
  const totalBefore = Object.values(S.clubs).reduce((n, c) => n + c.budget, 0);
  S.week = 2; S.actions = { key: 'S1W2', left: 2 };
  for (const c of Object.values(S.clubs)) { c.lastFinance = 'S1W2'; }
  const before = {}; for (const c of Object.values(S.clubs)) before[c.id] = c.budget;
  for (const c of Object.values(S.clubs)) if (c.ai) aiWeek(S, c);
  for (const c of Object.values(S.clubs)) if (c.ai) assert.ok(actionsLeft(S, c) >= 0 && actionsLeft(S, c) <= 2);
  const totalAfter = Object.values(S.clubs).reduce((n, c) => n + c.budget, 0);
  assert.ok(totalAfter <= totalBefore, 'AI spending only removes money (transfers just move it between clubs)');
  assert.ok(Object.values(S.clubs).every(c => c.ai ? c.budget >= -SPONSOR[c.division] * 40 : true));
});

test('economy safety: invalid spending blocked, advance once per season, guaranteed sponsor covers base costs everywhere', () => {
  const S = freshCareer(34); startWeek(S); const P = S.clubs.PLAYER;
  P.budget = 10; assert.equal(upgradeFacility(S, P, 'stadium').ok, false);
  assert.equal(actionsLeft(S, P), 2, 'failed action does not consume');
  assert.ok(canAdvance(S, P)); const r = takeAdvance(S, P); assert.ok(r.ok); assert.equal(takeAdvance(S, P).ok, false);
  assert.ok(weeklyBreakdown(S, P).repay < 0);
  for (let d = 1; d <= 10; d++) { const c = { ...P, division: d, stars: [], advance: { debt: 0 } }; assert.ok(weeklyBreakdown(S, c).net > 0, 'division ' + d + ' base week positive'); }
  assert.equal(facCost('stadium', 1), 400); assert.equal(facCost('training', 2), Math.round(500 * 1.65));
});

test('club creation input validation', () => {
  const ok = { name: 'Harbour City FC', short: 'hcf', city: 'Harbour', stadium: 'Dock Park', primary: '#ff0000', secondary: '#ffffff', pattern: 'stripes', crest: 'orb' };
  assert.equal(validateClubInput(ok).ok, true); assert.equal(validateClubInput(ok).value.short, 'HCF');
  assert.equal(validateClubInput({ ...ok, name: '' }).ok, false);
  assert.equal(validateClubInput({ ...ok, name: '<img src=x onerror=alert(1)>' }).ok, false);
  assert.equal(validateClubInput({ ...ok, name: 'x'.repeat(40) }).ok, false);
  assert.equal(validateClubInput({ ...ok, secondary: '#FF0000' }).ok, false);
  assert.equal(validateClubInput({ ...ok, short: 'TOOLONG' }).ok, false);
});

test('ambition: high-level stars refuse a Division 10 club', () => {
  const S = freshCareer(35); startWeek(S); const P = S.clubs.PLAYER;
  const top = Object.values(S.stars).find(s => s.ovr >= 80);
  assert.equal(askFor(S, P, top).refuses, true);
  P.budget = 1e6; top.listed = true; assert.equal(signAtAsk(S, P, top.id, 2).ok, false);
});
