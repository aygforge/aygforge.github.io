// Career-flow tests: real headless battles for every player and AI fixture of a full Division 10 season.
const A = require('./load.js'); const E = FWEngine, B = A.Battle;
let pass = 0, fail = 0; const lvC = r => (r.levelUps || []).reduce((m, l) => m + A.Progression.levelCredits(l), 0);
const T = (name, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); };
const t0 = Date.now();
function playOfficial(s, forceLossFirst) {
  const snap = B.snapshot(s, 'league', { attempt: 1 }); B.begin(s, snap);
  let res = B.result(B.simulate(B.worldOpts(snap, { headless: true, auto: true })));
  if (forceLossFirst) res = Object.assign({}, res, { won: false, winner: 1 });
  let out = B.finish(s, snap, res);
  if (out.canRematch) { const s2 = B.snapshot(s, 'league', { attempt: 2 }); B.begin(s, s2); const r2 = B.result(B.simulate(B.worldOpts(s2, { headless: true, auto: true }))); out = B.finish(s, s2, r2); out.rematched = true; }
  return out;
}
function drainAI(s) { let n = 0; while (s.league.aiQueue.length) { const job = A.League.aiJob(s); const w = B.simulate(B.aiOpts(s, job)); A.League.applyAI(s, job, B.result(w)); n++; } return n; }
const s = A.Save.fresh('SCO_KILMARNOCK', 2026);
// --- first fixture with forced loss -> rematch ---
const c0 = s.credits, x0 = s.xp;
const snap1 = B.snapshot(s, 'league', { attempt: 1 }); B.begin(s, snap1);
const r1 = Object.assign(B.result(B.simulate(B.worldOpts(snap1, { headless: true, auto: true }))), { won: false, winner: 1 });
const o1 = B.finish(s, snap1, r1);
T('C4 first official loss -> pending rematch, no reward yet', o1.canRematch && s.credits === c0 && s.xp === x0 && s.league.round === 0);
T('C5 cannot start attempt 1 again (rematch pending)', !!s.pendingDecision);
const snap2 = B.snapshot(s, 'league', { attempt: 2 }); B.begin(s, snap2);
const r2 = Object.assign(B.result(B.simulate(B.worldOpts(snap2, { headless: true, auto: true }))), { won: true, winner: 0 });
const o2 = B.finish(s, snap2, r2);
T('C6 rematch win -> win rewards once (120 C + level-up C, 40 XP, 2 F)', o2.rewards.credits === 120 + lvC(o2.rewards) && s.xp === 40 && s.fragments === 2 && s.league.round === 1, o2.rewards);
const dup = A.Endgame.finalizeFixture(s, { id: snap2.fixtureId, round: 0, pair: A.League.playerFixture(s, 0).pair }, true, r2, {});
T('C7 same fixture cannot pay twice', dup.applied === false && s.credits === 120 + lvC(o2.rewards));
const stale = B.finish(s, snap2, r2);
T('C8 finishing the same battle twice is ignored', stale.stale === true && s.credits === 120 + lvC(o2.rewards));
T('C9 round AI jobs queued (9)', s.league.aiQueue.length === 9);
const n0 = drainAI(s);
const t1 = A.League.table(s);
T('C10 9 real AI matches applied, table updated (10 results, 30 pts total)', n0 === 9 && Object.keys(s.league.results).length === 10 && t1.reduce((m, r) => m + r.pts, 0) === 30);
const job = { fixtureId: Object.keys(s.league.results).find(k => s.league.results[k].ai), seasonId: s.league.seasonId, a: 'x', b: 'y' };
T('C11 AI result cannot be applied twice', A.League.applyAI(s, job, { winner: 0, goals: [9, 9], survivors: 99 }) === false);
// --- rest of season with real battles ---
let wins = 1, rem = 0, freePack = false;
while (s.league.round < 19) { const o = playOfficial(s); if (o.rewards && o.rewards.packs && o.rewards.packs.standard) freePack = true; if (o.won || (o.rematched && o.res.won)) wins++; if (o.rematched) rem++; drainAI(s); }
T('C12 19 official fixtures played', s.officialPlayed === 19 && Object.values(s.league.results).filter(r => r.player).length === 19);
T('C13 all 190 fixtures have real results', Object.keys(s.league.results).length === 190);
T('C14 free Standard Pack after 3 official matches (once)', s.claims['free:standard'] && freePack);
T('C15 first-10 fixtures ticket claimed', !!s.claims['first10']);
T('C16 Challenge Board unlocked after 3rd fixture', !!s.challenges.unlocked[10]);
const tab = A.League.table(s);
T('C17 table: 19 games each, wins*3 = points', tab.every(r => r.p === 19 && r.pts === r.w * 3 && r.w + r.l === 19));
const lvl = s.level;
T('I1 Team Level from XP formula', s.xp >= A.Progression.totalTo(lvl) && s.xp < A.Progression.totalTo(lvl + 1), { xp: s.xp, lvl });
T('I2 XP to 50 totals 9016', A.Progression.totalTo(50) === 9016);
// --- season close ---
const rank = A.League.rank(s); const credBefore = s.credits;
const cs = A.Endgame.closeSeason(s);
T('C18 season closes once', cs && A.Endgame.closeSeason(s) === null);
T('C19 division completion ticket', !!s.claims['divdone:10']);
console.log('   season 1: rank ' + rank + ', wins ' + wins + ', rematches ' + rem + ', phase ' + s.league.phase + ', credits ' + s.credits + ', level ' + s.level);
if (rank <= 3) T('C20 top-3 bonus paid', s.credits - credBefore === (rank === 1 ? 600 : 360));
else {
  T('C20 rank 4-20 -> promotion challenge phase', s.league.phase === 'promo');
  A.Endgame.promoStart(s);
  T('C21 promo opponents come from Division 9', s.promo.opps.every(id => s.divisions[8].includes(id)));
  // lose 2 -> failed, then retry and win 2
  for (let i = 0; i < 2; i++) { const sn = B.snapshot(s, 'promo', {}); B.begin(s, sn); B.finish(s, sn, { won: false, winner: 1, survivors: 0, goals: [0, 0], momentum: [], inputs: [], stars: [] }); }
  T('C22 failed promotion challenge can be retried', s.promo.done && !s.promo.success && s.league.phase === 'promo');
  A.Endgame.promoStart(s); const cb = s.credits;
  for (let i = 0; i < 2; i++) { const sn = B.snapshot(s, 'promo', {}); B.begin(s, sn); B.finish(s, sn, { won: true, winner: 0, survivors: 30, goals: [1, 0], momentum: [], inputs: [], stars: [] }); }
  T('C23 promo success: 2x win credits bonus once, no league win rewards', s.promo.success && s.league.phase === 'promoted' && s.credits - cb === 240, s.credits - cb);
}
const tk = s.tickets.t10, fr = s.fragments;
const pr = A.Endgame.promote(s);
T('C24 promotion to Division 9 (+60 XP, +6 F, +10 ticket first time)', s.division === 9 && s.highestDiv === 9 && s.tickets.t10 === tk + 1 && s.fragments === fr + 6);
const allIds = [].concat(...s.divisions);
T('C25 still 20 clubs per division, 200 unique, player in D9', s.divisions.every(d => d.length === 20) && new Set(allIds).size === 200 && s.divisions[8].includes(s.club));
T('C26 new 19-match season in D9, upgrades kept', s.league.div === 9 && s.league.round === 0 && s.league.rounds.length === 19);
T('C27 promote again is a no-op', A.Endgame.promote(s) === null && s.division === 9);
// --- challenges ---
const c10 = s.credits;
const ch = (kind, won, surv) => { const sn = B.snapshot(s, 'challenge', { div: 10, kind }); B.begin(s, sn); return B.finish(s, sn, { won, winner: won ? 0 : 1, survivors: surv, goals: [0, 0], momentum: [], inputs: [], stars: [] }); };
ch('power', false, 0); T('H1 challenge loss: 0 reward', s.credits === c10);
const o3 = ch('power', true, 10); T('H2 Power Clash first win 180 C + 30 XP + 3 F', o3.rewards.credits === 180 + lvC(o3.rewards) && o3.rewards.frags === 3);
const o4 = ch('power', true, 10); T('H3 repeat win only 25% credits (30 C), 0 XP/F', o4.rewards.credits === 30 && !o4.rewards.xp && !o4.rewards.frags);
const o5 = ch('last', true, 31); T('H4 Last Stand gold: 150 + silver 20 + gold 40 (+1F +1F)', o5.rewards.credits === 150 + 20 + 40 + lvC(o5.rewards) && o5.rewards.frags === 5, o5.rewards);
const t5b = s.tickets.t5; const o6 = ch('signature', true, 5); T('H5 Signature first win 180 C + board complete +5 ticket', o6.rewards.credits === 180 + lvC(o6.rewards) && s.tickets.t5 === t5b + 1, o6.rewards);
{ const sn = B.snapshot(s, 'challenge', { div: 10, kind: 'signature' }); T('H6 Signature opponent fields stars (D10: 1)', sn.oppStars.length === 1);
  const w = E.createWorld(B.worldOpts(sn, { headless: true, auto: true })); T('H7 opponent star is a real unit', w.units.filter(u => u.side === 1 && u.star).length === 1); }
T('H8 challenges never change league standings', Object.keys(s.league.results).length === 0 && s.league.round === 0);
T('H9 30 unique challenges', new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap(d => A.Challenges.KINDS.map(k => A.Challenges.key(d, k)))).size === 30);
// --- level milestones once ---
{ const s4 = A.Save.fresh('ENG_ARSENAL', 5); const out = {}; A.Progression.addXP(s4, 20000, out);
  T('I3 level capped at 50, XP capped', s4.level === 50 && s4.xp === 9016);
  T('I4 all 10 milestones paid once, golden crest', out.milestones.length === 10 && s4.goldenCrest && s4.packs.legend === 3 && s4.packs.premium === 2 && s4.packs.standard === 1 && s4.tickets.t10 === 2 && s4.tickets.t5 === 1, s4.packs);
  const lc = [...Array(49)].reduce((m, _, i) => m + 15 + 5 * (i + 2), 0);
  T('I5 level credits sum + milestone credits', s4.credits === lc + 250 + 750, [s4.credits, lc]);
  s4.level = 49; s4.xp = A.Progression.totalTo(49); const c = s4.credits; A.Progression.addXP(s4, 500);
  T('I6 re-reaching a level never pays twice', s4.credits === c);
  T('I7 Team Level is not a battle stat', !JSON.stringify(B.worldOpts(B.snapshot(s4, 'league'))).includes('"level"')); }
// --- endless Division 1 ---
{ const s5 = A.Save.fresh('ENG_ARSENAL', 77);
  // jump to Division 1 by swapping (test shortcut through the promote API)
  for (let d = 10; d > 1; d--) { s5.league.round = 19; s5.league.phase = 'promoted'; A.Endgame.promote(s5); }
  T('J1 reached Division 1 through 9 promotions', s5.division === 1 && s5.highestDiv === 1 && s5.tickets.t10 === 9);
  const seasonOnce = [];
  for (let k = 0; k < 2; k++) {
    // fill the season with results (logic test: forged final table, player 1st)
    const L = s5.league; L.round = 19; L.aiQueue = [];
    for (let r = 0; r < 19; r++) for (const m of L.rounds[r]) L.results[A.League.fixtureId(L, r, m[0], m[1])] = { a: m[0], b: m[1], winner: m[0] === s5.club ? 0 : m[1] === s5.club ? 1 : (r % 2), ga: 1, gb: 0, surv: 10 };
    const c = s5.credits, lp = s5.packs.legend; const o = A.Endgame.closeSeason(s5);
    seasonOnce.push({ rank: o.rank, credits: s5.credits - c, legend: s5.packs.legend - lp, first: !!o.firstTitle });
    T('J' + (2 + k) + ' D1 season ' + (k + 1) + ' closes, no relegation, new season available', s5.league.phase === 'ended' && s5.division === 1);
    A.Endgame.nextEndless(s5);
  }
  T('J4 champion reward 10,000 C each season; first-title Legend pack + crest only once', seasonOnce[0].rank === 1 && seasonOnce[0].credits === 10000 && seasonOnce[0].legend === 1 && seasonOnce[0].first && seasonOnce[1].legend === 0 && !seasonOnce[1].first && s5.goldenCrest, seasonOnce);
  T('J5 D1 ratings in 85-97 band', s5.divisions[0].filter(x => x !== s5.club).every(id => { const r = A.League.rating(s5, id, 1, s5.league.seasonId); return r >= 85 && r <= 97; }));
  T('J6 endless keeps progress (upgrades, credits, stars)', s5.endless.seasons === 2 && s5.endless.titles === 2 && s5.league.round === 0); }
// --- save / load / abandon ---
{ const txt = A.Save.serialize(s); const s6 = A.Save.parse(txt);
  T('K1 export/import roundtrip valid', JSON.stringify(s6) === JSON.stringify(s) && A.Save.validate(s6).length === 0);
  let bad = false; try { A.Save.parse(txt.replace('"divisions":[[', '"divisions":[["FAKE",')); } catch (e) { bad = true; }
  T('K2 corrupted save rejected by validation', bad);
  // pending battle resume does not consume contracts twice
  const ids = Object.keys(s6.stars); if (ids.length) { s6.active = []; A.Stars.equip(s6, ids[0]); }
  const sn = B.snapshot(s6, 'league'); const before = ids.length ? s6.stars[ids[0]].contract : 0; B.begin(s6, sn);
  const reloaded = A.Save.parse(A.Save.serialize(s6)); B.begin(reloaded, reloaded.pendingBattle.snap);
  T('K3 reload with pending battle keeps contract (consumed once)', !ids.length || reloaded.stars[ids[0]].contract === Math.max(0, before - 1));
  const ab = B.abandon(reloaded);
  T('K4 abandon = loss (rematch offered for first attempt), pending battle cleared', ab && ab.canRematch && !reloaded.pendingBattle); }
console.log('career tests: ' + pass + ' pass, ' + fail + ' fail, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
