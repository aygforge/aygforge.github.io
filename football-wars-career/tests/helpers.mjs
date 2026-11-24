import { DEFAULT_FORMATION, ROLES } from '../src/data/balance.js';
import { makeStar } from '../src/career/stars.js';
import { Rng, mix32 } from '../src/career/util.js';
import assert from 'node:assert/strict';
import { newCareerState } from '../src/career/world.js';
import { setupSeason, startWeek, endWeek, worldJobs, playerFixtures, applyResult } from '../src/career/season.js';
export function testClub(id, q, o = {}) {
  const groups = ROLES.map((r, i) => ({ id: id + '-g' + i, role: r, count: (o.formation || DEFAULT_FORMATION)[r], q }));
  return { id, name: 'Test ' + id, short: id.slice(0, 3).toUpperCase(), ai: !!o.ai, division: o.division || 10, aiProfile: o.profile || 'balanced',
    kit: { primary: o.c1 || '#e63946', secondary: o.c2 || '#ffffff', pattern: 'plain', crest: 'shield' },
    attributes: { attack: 70, defense: 70, speed: 70, pressing: 70, stamina: 70, teamwork: 70, physical: 70, technique: 70, goalkeeping: 70, finishing: 70 },
    aggression: 60, groups, activeStars: [], stars: [], tactic: o.tactic || 'total', style: 'balanced' };
}
export function testStar(id, role, ovr, clubId, seed = 1) {
  return makeStar(new Rng(seed), { id, name: 'Star ' + id, role, age: 23, ovr, rarity: 'promising', clubId, level: 1 });
}

export const INPUT = { name: 'Test United', short: 'TST', city: 'Testville', stadium: 'Test Park', primary: '#ff0055', secondary: '#ffffff', pattern: 'stripes', crest: 'shield' };
export function freshCareer(seed = 12345) { const S = newCareerState(seed, INPUT, DEFAULT_FORMATION, 1); setupSeason(S); return S; }
// TEST-ONLY result stub (structure tests only; the game always uses the battle engine).
export function stub(S, f) {
  const h = mix32(S.seed, f.id), win = (h & 1);
  return { winner: win, alive: win === 0 ? [20 + (h % 30), 0] : [0, 20 + (h % 30)], kills: [80, 80], battleT: 45, tiebreak: null, hash: 'stub', seed: 1, football: { goals: [h % 3, (h >> 3) % 3] }, stars: [], tactics: ['total', 'total'] };
}
export function playWeekStub(S) {
  startWeek(S);
  for (const f of playerFixtures(S)) applyResult(S, f, stub(S, f));
  for (const j of worldJobs(S)) S.lock.results[j.fid] = stub(S, S.fixtures[j.fid]);
  const r = endWeek(S); assert.ok(r.ok, r.reason); return r;
}

