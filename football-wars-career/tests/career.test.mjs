import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCareerState, PLAYER_ID } from '../src/career/world.js';
import { setupSeason, startWeek, endWeek, worldJobs, playerFixtures, applyResult, table, canEndWeek } from '../src/career/season.js';
import { DEFAULT_FORMATION, SPONSOR, MAX_STARS } from '../src/data/balance.js';
import { avgStandardQ, weeklyBreakdown, applyWeeklyFinance } from '../src/career/economy.js';
import { executeTransfer, openTalk, makeOffer, packagesFor, buyPackage, upgradeFacility, actionsLeft, startScout, askFor } from '../src/career/management.js';
import { LEAGUE_MATCHES } from '../src/career/schedule.js';
import { mix32 } from '../src/career/util.js';

import { INPUT, freshCareer, stub, playWeekStub } from './helpers.mjs';

test('world integrity: 200 unique clubs, 199 AI, player in Division 10, 10 x 20', () => {
  const S = freshCareer();
  const ids = Object.keys(S.clubs);
  assert.equal(ids.length, 200); assert.equal(new Set(ids).size, 200);
  assert.equal(Object.values(S.clubs).filter(c => c.ai).length, 199);
  assert.equal(S.clubs[PLAYER_ID].division, 10);
  assert.ok(S.divisions[10].includes(PLAYER_ID));
  for (let d = 1; d <= 10; d++) assert.equal(S.divisions[d].length, 20);
  assert.equal(new Set(Object.values(S.divisions).flat()).size, 200);
  const d10 = S.divisions[10].map(id => avgStandardQ(S.clubs[id]));
  const avg = d10.reduce((a, b) => a + b) / 20; assert.ok(avg >= 37 && avg <= 38.2, 'D10 average ' + avg);
  const P = S.clubs[PLAYER_ID];
  assert.equal(P.budget, 1600); assert.equal(P.stars.length, 0); assert.equal(P.groups.reduce((n, g) => n + g.count, 0), 100);
  assert.equal(Object.values(P.fac).every(l => l === 1), true);
  assert.equal(Object.values(S.clubs).filter(c => c.origin && c.origin.startsWith('new-')).length, 5);
  // no star is registered at two clubs
  const owner = {}; for (const c of Object.values(S.clubs)) for (const id of c.stars) { assert.ok(!owner[id], 'star twice'); owner[id] = c.id; assert.equal(S.stars[id].clubId, c.id); }
});

test('economy: Division 10 base week is +70 C and is never applied twice', () => {
  const S = freshCareer(); const P = S.clubs[PLAYER_ID];
  const b = weeklyBreakdown(S, P);
  assert.equal(b.sponsor, 240); assert.equal(b.wages, -130); assert.equal(b.upkeep, -40); assert.equal(b.net, 70);
  startWeek(S); assert.equal(P.budget, 1670);
  applyWeeklyFinance(S, P); assert.equal(P.budget, 1670);
  for (let d = 1; d <= 10; d++) assert.ok(SPONSOR[d] > 0);
});

test('full season structure: 3127 official matches, cups 19/63/15, 9 play-offs, correct league counts', () => {
  const S = freshCareer(777);
  const seen = new Set();
  for (let i = 0; i < 39; i++) { const before = S.season; playWeekStub(S); if (S.season !== before) break; }
  // count fixtures of season 1 from the per-club history + cups prior to reset: re-run counting on a fresh copy
  const T = freshCareer(777); const counts = { L: 0, DC: 0, GC: 0, CT: 0, PO: 0 };
  const perClub = {}; const pairs = new Set();
  for (let i = 0; i < 39; i++) {
    startWeek(T);
    for (const id of T.lock.fids) {
      const f = T.fixtures[id]; assert.ok(!seen.has(id), 'fixture scheduled twice'); seen.add(id); counts[f.comp]++;
      if (f.comp === 'L') { perClub[f.home] = (perClub[f.home] || { n: 0, h: 0 }); perClub[f.away] = (perClub[f.away] || { n: 0, h: 0 }); perClub[f.home].n++; perClub[f.home].h++; perClub[f.away].n++; const k = f.home + '>' + f.away; assert.ok(!pairs.has(k), 'duplicate league pairing ' + k); pairs.add(k); }
    }
    for (const f of playerFixtures(T)) applyResult(T, f, stub(T, f));
    for (const j of worldJobs(T)) T.lock.results[j.fid] = stub(T, T.fixtures[j.fid]);
    if (i === 38) { // before the season rolls over: per-club league counts
      for (let d = 1; d <= 10; d++) for (const id of T.divisions[d]) {
        assert.equal(perClub[id].n, LEAGUE_MATCHES(d), `club ${id} in D${d}`);
        if (d <= 5) assert.equal(perClub[id].h, 19); else assert.ok(perClub[id].h === 9 || perClub[id].h === 10, 'home balance ' + perClub[id].h);
      }
      for (const k of ['GC', 'CT']) assert.ok(T.cups[k].champion);
      for (let d = 1; d <= 10; d++) assert.ok(T.cups['DC' + d].champion);
    }
    endWeek(T);
  }
  assert.equal(counts.L, 2850); assert.equal(counts.DC, 190); assert.equal(counts.GC, 63); assert.equal(counts.CT, 15); assert.equal(counts.PO, 9);
  assert.equal(counts.L + counts.DC + counts.GC + counts.CT + counts.PO, 3127);
  assert.equal(T.season, 2); assert.equal(T.week, 1);
  for (let d = 1; d <= 10; d++) assert.equal(T.divisions[d].length, 20);
});

test('promotion/relegation and multi-season stability; season end runs once', () => {
  const S = freshCareer(4242);
  for (let i = 0; i < 39; i++) {
    if (S.week === 39) {
      startWeek(S);
      for (const f of playerFixtures(S)) applyResult(S, f, stub(S, f));
      for (const j of worldJobs(S)) S.lock.results[j.fid] = stub(S, S.fixtures[j.fid]);
      const tabs = {}; for (let d = 1; d <= 10; d++) tabs[d] = table(S, d).map(r => r.id);
      const po = {}; for (let d = 2; d <= 10; d++) { const f = S.fixtures[`S1-PO${d}`]; po[d] = f; }
      endWeek(S);
      for (let d = 2; d <= 10; d++) { assert.ok(S.divisions[d - 1].includes(tabs[d][0]), `D${d} champion promoted`); const w = po[d].res.w; assert.ok(S.divisions[d - 1].includes(w), 'play-off winner promoted'); const lost = w === po[d].home ? po[d].away : po[d].home; assert.ok(S.divisions[d].includes(lost), 'play-off loser stays'); }
      for (let d = 1; d <= 9; d++) { assert.ok(S.divisions[d + 1].includes(tabs[d][18])); assert.ok(S.divisions[d + 1].includes(tabs[d][19])); }
      assert.ok(S.divisions[10].includes(tabs[10][18]) && S.divisions[10].includes(tabs[10][19]), 'D10 bottom two stay');
      // division cup winners are NOT promoted by the cup
      break;
    }
    playWeekStub(S);
  }
  const hist = S.history.seasons.length;
  for (let k = 0; k < 2 * 39; k++) playWeekStub(S);
  assert.equal(S.season, 4); assert.equal(S.history.seasons.length, hist + 2);
  for (let d = 1; d <= 10; d++) assert.equal(S.divisions[d].length, 20);
  assert.equal(Object.keys(S.clubs).length, 200);
  const owner = {}; for (const c of Object.values(S.clubs)) { assert.ok(c.stars.length <= MAX_STARS); for (const id of c.stars) { assert.ok(!owner[id]); owner[id] = 1; assert.equal(S.stars[id].clubId, c.id); } }
  // stars keep ageing and stay consistent
  assert.ok(Object.values(S.stars).every(s => s.age >= 16 && s.level >= 1 && s.level <= 20));
});

test('week end refuses to finish without results and never pays twice', () => {
  const S = freshCareer(99); startWeek(S); // week 1: D10 has no match, D1-5 play
  const jobs = worldJobs(S); assert.ok(jobs.length > 0);
  assert.equal(canEndWeek(S).ok, false);
  for (const j of jobs) S.lock.results[j.fid] = stub(S, S.fixtures[j.fid]);
  const f = S.fixtures[jobs[0].fid]; applyResult(S, f, S.lock.results[f.id]);
  const b = S.clubs[f.home].budget; assert.equal(applyResult(S, f, S.lock.results[f.id]), null); assert.equal(S.clubs[f.home].budget, b);
  assert.ok(endWeek(S).ok); assert.equal(endWeek(S).ok, false);
});

test('transfers: atomic, one club per star, window rules, limited negotiation', () => {
  const S = freshCareer(5); startWeek(S); const P = S.clubs[PLAYER_ID];
  const star = Object.values(S.stars).find(s => s.clubId && s.listed && S.clubs[s.clubId].division >= 8) || Object.values(S.stars).find(s => s.clubId && S.clubs[s.clubId].division >= 7);
  star.listed = true; const seller = S.clubs[star.clubId];
  P.budget = 100000; const sb = seller.budget, lvl = star.level, ovr = star.ovr, pot = star.pot;
  const t = openTalk(S, P, star.id); assert.ok(t.ok, t.reason);
  assert.equal(actionsLeft(S, P), 1);
  const low = makeOffer(S, P, star.id, 1, 1, 2); assert.equal(low.accepted, false);
  const ask = askFor(S, P, star);
  const ok = makeOffer(S, P, star.id, ask.fee, ask.wage + 5, 2); assert.ok(ok.accepted, JSON.stringify(ok));
  assert.equal(star.clubId, PLAYER_ID); assert.ok(P.stars.includes(star.id)); assert.ok(!seller.stars.includes(star.id));
  assert.equal(P.budget, 100000 - ask.fee); assert.equal(seller.budget, sb + ask.fee);
  assert.equal(star.level, lvl); assert.equal(star.ovr, ovr); assert.equal(star.pot, pot);
  assert.equal(Object.values(S.clubs).filter(c => c.stars.includes(star.id)).length, 1);
  assert.equal(makeOffer(S, P, star.id, ask.fee, ask.wage, 2).ok, false, 'no repeat');
  // closed window
  S.week = 12; S.actions = { key: 'S1W12', left: 2 };
  const other = Object.values(S.stars).find(s => s.clubId && s.clubId !== PLAYER_ID && s.listed);
  if (other) assert.equal(openTalk(S, P, other.id).ok, false);
  assert.equal(executeTransfer(S, star.id, seller.id, 10, 10, 1).ok, false);
  // eligibility: a new signing plays from next week
  assert.deepEqual(star.eligible, { season: 1, week: 2 });
});

test('management actions: two per week, packages replace weakest units, facility costs', () => {
  const S = freshCareer(6); startWeek(S); const P = S.clubs[PLAYER_ID];
  const pk = packagesFor(S, P).find(p => p.role !== 'captain');
  const before = P.budget;
  assert.ok(buyPackage(S, P, pk, 'replace').ok);
  assert.equal(P.groups.reduce((n, g) => n + g.count, 0), 100);
  assert.equal(P.budget, before - pk.price);
  assert.equal(buyPackage(S, P, pk, 'replace').ok, false, 'same package twice');
  const b2 = P.budget; assert.ok(upgradeFacility(S, P, 'fans').ok); assert.equal(P.budget, b2 - 300);
  assert.equal(actionsLeft(S, P), 0);
  assert.equal(startScout(S, P, 'any', 'same').ok, false);
});
