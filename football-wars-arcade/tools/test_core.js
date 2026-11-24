// Targeted logic tests for the arcade modules (node, no DOM). Real headless battles where battles are needed.
const A = require('./load.js'); const E = FWEngine, B = A.Battle;
let pass = 0, fail = 0; const T = (name, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); };
const t0 = Date.now();
// ---- B. club database ----
const C = A.clubs();
T('B1 200 unique clubs', C.length === 200 && new Set(C.map(c => c.id)).size === 200);
T('B2 200 unique display names', new Set(C.map(c => c.displayName)).size === 200);
T('B3 no placeholder names', !C.some(c => /^(team|club|red team|blue fc)\s*\d+/i.test(c.displayName)));
T('B4 national teams excluded', !C.some(c => c.src.type === 'national'));
T('B5 6 added clubs absent from V4', ['Boca Juniors', 'River Plate', 'Flamengo', 'Palmeiras', 'Inter Miami', 'Los Angeles FC'].every(n => !FW_MASTER_DB.clubs.some(c => c.name === n)) && C.filter(c => c.src.arcade_added).length === 6);
T('B6 sourceName kept separately', A.club('TUR_GALATASARAY').sourceName === 'Galatasaray' && A.club('TUR_GALATASARAY').displayName === 'Galata Lions');
const s = A.Save.fresh('TUR_GALATASARAY', 4242);
const all = [].concat(...s.divisions);
T('B7 10 divisions x 20, no club twice', s.divisions.every(d => d.length === 20) && new Set(all).size === 200);
T('B8 player club in Division 10', s.divisions[9].includes('TUR_GALATASARAY') && s.division === 10);
// ---- C. league structure ----
const L = s.league;
const pairs = new Set(); let okRR = L.rounds.length === 19 && L.rounds.every(r => r.length === 10 && new Set([].concat(...r)).size === 20);
for (const r of L.rounds) for (const [a, b] of r) pairs.add([a, b].sort().join('|'));
T('C1 single round robin: 19 rounds x 10 matches, every pair once', okRR && pairs.size === 190);
T('C2 player has exactly 19 fixtures', L.rounds.filter(r => r.some(m => m.includes(s.club))).length === 19);
T('C3 fixture generation deterministic', JSON.stringify(A.Save.fresh('TUR_GALATASARAY', 4242).league.rounds) === JSON.stringify(L.rounds));
// ---- D. upgrades ----
const cost = L2 => A.Upgrades.cost(L2);
T('D1 cost table', [cost(1), cost(10), cost(15), cost(20), cost(25), cost(29)].join() === '90,340,720,1510,3170,5740', [cost(1), cost(10), cost(15), cost(20), cost(25), cost(29)]);
let tot = 0; for (let l = 1; l < 30; l++) tot += cost(l);
T('D2 one stat 1->30 total ~41,055', Math.abs(tot - 41055) <= 60, tot);
T('D3 cost(30) is null (cap)', cost(30) === null);
const p0 = A.Upgrades.power(s); s.credits = 10000; A.Upgrades.buy(s, 'attack');
T('D4 buying spends credits and raises level/power', s.credits === 10000 - 90 && s.upgrades.attack === 2 && A.Upgrades.power(s) > p0);
s.upgrades.attack = 30; T('D5 cannot exceed Lv30', A.Upgrades.buy(s, 'attack') === false && s.upgrades.attack === 30); s.upgrades.attack = 1; s.credits = 0;
T('D6 stat values', A.Upgrades.value('attack', 1) === 38 && Math.abs(A.Upgrades.value('attack', 30) - (38 + 29 * 1.65)) < 1e-6);
// upgrades change the real engine team
const tA = B.snapshot(s, 'league').teamA; s.upgrades.speed = 20; const tB = B.snapshot(s, 'league').teamA; s.upgrades.speed = 1;
T('D7 upgrades reach the V4 battle profile', tB.battle_profile.attributes.speed > tA.battle_profile.attributes.speed && tB.battle_profile.attributes.pressing > tA.battle_profile.attributes.pressing && tB.battle_profile.power_index > tA.battle_profile.power_index);
{ const snap = B.snapshot(s, 'league'); const w1 = E.createWorld(B.worldOpts(snap, { headless: true })); s.upgrades.speed = 25; const snap2 = B.snapshot(s, 'league'); snap2.seed = snap.seed; const w2 = E.createWorld(B.worldOpts(snap2, { headless: true })); s.upgrades.speed = 1;
  T('D8 upgraded speed => faster real units', w2.teams[0].speedMul > w1.teams[0].speedMul && w2.teams[0].powMul > w1.teams[0].powMul, [w1.teams[0].speedMul, w2.teams[0].speedMul]); }
// ---- A. battle: 100 v 100, fusion ----
{ const snap = B.snapshot(s, 'league'); const w = E.createWorld(B.worldOpts(snap, { headless: true, auto: true }));
  T('A1 both sides exactly 100 players', w.units.filter(u => u.side === 0).length === 100 && w.units.filter(u => u.side === 1).length === 100);
  T('A2 player role template 16/14/12/34/8/15/1', JSON.stringify(Object.fromEntries(E.ROLES.map(r => [r, w.units.filter(u => u.side === 0 && u.role === r).length]))) === JSON.stringify(A.PLAYER_ROLES));
  while (w.phase !== 'ended' && w.t < 90) E.step(w);
  const sm = E.summaryV4(w);
  const evs = new Set(); // events got trimmed? (headless keeps all in this loop)
  for (const e of w.events) evs.add(e.type);
  T('A3 real winner + football events (pass/shot/KO)', sm.winner >= 0 && evs.has(E.EV.BALL_PASS) && evs.has(E.EV.SHOT_ON_GOAL) && evs.has(E.EV.KO), { winner: sm.winner, goals: sm.football.goals, t: sm.battleSeconds });
  T('A4 last team standing (or Mayhem time-up on survivors, nobody K.O.\'d by the clock)', (w.teams[1 - sm.winner].alive === 0 || /TIME_UP/.test(sm.rules.join())) && w.teams[sm.winner].alive > 0); }
// ---- E/F. packs, pity, duplicates, contracts ----
{ const s2 = A.Save.fresh('ENG_ARSENAL', 7);
  s2.credits = 1e7; s2.fragments = 1e6; const counts = { common: 0, rare: 0, epic: 0, legendary: 0 }, slot3 = { common: 0, rare: 0, epic: 0, legendary: 0 }; let twoRoles = true, uniq = true, n = 4000;
  for (let i = 0; i < n; i++) { const d = A.Draft.open(s2, 'standard', i % 2 ? 'credits' : 'frags'); if (!d) { T('E0 open failed', false); break; }
    d.cands.slice(0, 2).forEach(c => counts[c.rarity]++); slot3[d.cands[2].rarity]++;
    if (new Set(d.cands.map(c => A.Stars.def(c.id).role)).size < 2) twoRoles = false; if (new Set(d.cands.map(c => c.id)).size < 3) uniq = false;
    s2.pendingDraft = null; }
  T('E1 standard odds cards 1-2 ~70/26/3.5/0.5', Math.abs(counts.common / (2 * n) - 0.70) < 0.03 && Math.abs(counts.rare / (2 * n) - 0.26) < 0.03 && Math.abs(counts.epic / (2 * n) - 0.035) < 0.012, counts);
  T('E2 standard card 3 never common (Rare+ guaranteed)', slot3.common === 0 && Math.abs(slot3.rare / n - 0.85) < 0.03, slot3);
  T('E3 three different stars, >= 2 positions', twoRoles && uniq);
  T('E4 payment: 2000 x 450 C + 2000 x 12 F', s2.credits === 1e7 - 2000 * 450 && s2.fragments === 1e6 - 2000 * 12);
  // premium pity
  s2.highestDiv = 8; let maxGap = 0, gap = 0; for (let i = 0; i < 3000; i++) { const d = A.Draft.open(s2, 'premium', 'credits'); const leg = d.cands.some(c => c.rarity === 'legendary'); gap = leg ? 0 : gap + 1; maxGap = Math.max(maxGap, gap); if (!d.cands.some(c => c.rarity === 'epic' || c.rarity === 'legendary')) { maxGap = 99; } s2.pendingDraft = null; }
  T('E5 premium: Epic+ guaranteed & Legendary within 10 packs (pity)', maxGap <= 9, maxGap);
  s2.credits += 2e7; s2.highestDiv = 5; maxGap = 0; gap = 0; for (let i = 0; i < 3000; i++) { const d = A.Draft.open(s2, 'legend', 'credits'); const leg = d.cands.some(c => c.rarity === 'legendary'); gap = leg ? 0 : gap + 1; maxGap = Math.max(maxGap, gap); s2.pendingDraft = null; }
  T('E6 legend: Legendary within 4 packs (pity)', maxGap <= 3, maxGap);
  const s3 = A.Save.fresh('ENG_ARSENAL', 8); s3.credits = 100000;
  T('E7 premium locked in Division 10', A.Draft.open(s3, 'premium', 'credits') === null);
  const d1 = A.Draft.open(s3, 'standard', 'credits'); const snapJSON = JSON.stringify(s3);
  const reload = A.Save.parse(snapJSON);
  T('E8 draft persisted: reload shows identical candidates, cannot reroll', JSON.stringify(reload.pendingDraft.cands) === JSON.stringify(d1.cands) && A.Draft.open(reload, 'standard', 'credits') === null);
  const r1 = A.Draft.pick(s3, 1); const r2 = A.Draft.pick(s3, 0);
  T('E9 exactly one star signed', r1 && !r2 && Object.keys(s3.stars).length === 1);
  // duplicate merge
  const id = r1.id, c0 = s3.stars[id].contract, ovr0 = s3.stars[id].ovr;
  s3.pendingDraft = { n: 999, type: 'standard', cands: [{ id, rarity: A.Stars.def(id).rarity, contract: 14, ovr: 99, dup: true }, s3.pendingDraft && s3.pendingDraft.cands[0] || { id: 'ST001', rarity: 'common', contract: 20, ovr: 45 }, { id: 'ST002', rarity: 'common', contract: 20, ovr: 45 }] };
  const md = A.Draft.pick(s3, 0);
  T('E10 duplicate adds contract, keeps OVR, no second card', md.merged && s3.stars[id].contract === c0 + 14 && s3.stars[id].ovr === ovr0 && Object.keys(s3.stars).length === 1, { c0, now: s3.stars[id].contract });
  // OVR scaling
  T('E11 OVR ranges (D10 / D7 / D4 / D1 + monotone)', JSON.stringify(A.Draft.ovrRange(10, 'common')) === '[44,50]' && JSON.stringify(A.Draft.ovrRange(1, 'legendary')) === '[92,99]' && [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].every((d, i, a) => i === 0 || A.Draft.ovrRange(d, 'epic')[0] >= A.Draft.ovrRange(a[i - 1], 'epic')[0]));
  // contracts
  const st5 = A.Save.fresh('ENG_ARSENAL', 9); const ids = A.Stars.defs.filter(d => d.role !== 'captain').slice(0, 6).map(d => d.id);
  for (const x of ids) st5.stars[x] = { id: x, ovr: 50, contract: 1, rarity: A.Stars.def(x).rarity };
  ids.forEach(x => A.Stars.equip(st5, x));
  T('F1 max 5 active stars', st5.active.length === 5);
  const capt = A.Stars.defs.filter(d => d.role === 'captain').slice(0, 2).map(d => d.id); for (const x of capt) st5.stars[x] = { id: x, ovr: 50, contract: 3, rarity: 'common' };
  A.Stars.remove(st5, st5.active[0]); A.Stars.remove(st5, st5.active[0]); A.Stars.equip(st5, capt[0]);
  T('F2 only one captain star (1 captain slot)', A.Stars.canEquip(st5, capt[1]) !== null);
  const snap = B.snapshot(st5, 'league'); B.begin(st5, snap);
  const w = E.createWorld(B.worldOpts(snap, { headless: true, auto: true }));
  T('F3 stars are real units on the pitch', w.units.filter(u => u.side === 0 && u.star).length === snap.stars.length && w.units.filter(u => u.side === 0).length === 100);
  T('F4 contract -1 at battle start (once)', snap.starIds.every(x => st5.stars[x].contract === (x === capt[0] ? 2 : 0)));
  B.begin(st5, snap); T('F5 re-begin same battle id does not consume again', st5.stars[capt[0]].contract === 2);
  while (w.phase !== 'ended' && w.t < 90) E.step(w);
  const res = B.result(w); const out = B.finish(st5, snap, res);
  T('F6 expired star leaves active list but stays in collection', Object.keys(st5.stars).length === 8 && st5.active.length === 1, st5.active);
  const abil = E.arcSummary(w).stars.filter(x => x.side === 0);
  T('F7 star signature abilities fired (real specials)', abil.some(x => x.uses > 0) && abil.every(x => x.uses <= 2), abil);
  st5.tickets.t5 = 1; st5.tickets.t10 = 1; const ex = snap.starIds.find(x => x !== capt[0]);
  A.Stars.renew(st5, ex, 't5'); A.Stars.renew(st5, ex, 't10');
  T('F8 contract tickets +5 / +10', st5.stars[ex].contract === 15 && st5.tickets.t5 === 0 && st5.tickets.t10 === 0);
  T('F9 cannot renew without tickets', A.Stars.renew(st5, ex, 't5') === false); }
// ---- G. legacy Momentum Strike (kept only so pre-Mayhem unfinished battles resume exactly) ----
{ const snap = Object.assign(B.snapshot(s, 'league'), { mech: undefined }); const opts = B.worldOpts(snap, { headless: true });
  const w = E.createWorld(opts); let readyT = null; while (w.phase !== 'ended' && w.t < 90) { E.step(w); if (readyT == null && w.arc.mom[0].ready) readyT = w.battleT; }
  T('G1 [legacy battle] first Momentum ready ~9-13 s (real events add up)', readyT >= 8.5 && readyT <= 14.3, readyT);
  T('G2 [legacy battle] manual side never fires without input', w.arc.used.filter(m => m.side === 0).length === 0);
  // quality by marker
  const w2 = E.createWorld(opts); while (!w2.arc.mom[0].ready) E.step(w2);
  const rt = w2.arc.mom[0].readyTick; const qAt = k => { const save = w2.tick; void save; const ph = ((k - rt) % 90) / 90; const pos = ph < 0.5 ? ph * 2 : 2 - ph * 2; const d = Math.abs(pos - 0.5); return d <= 0.06 ? 'perfect' : d <= 0.2 ? 'good' : 'normal'; };
  let pk = w2.tick; while (qAt(pk + 1) !== 'perfect') pk++;
  while (w2.tick < pk) E.step(w2); E.arcInput(w2, 'tap'); E.step(w2);
  const last = w2.arc.used[w2.arc.used.length - 1];
  T('G3 [legacy battle] Perfect timing computed from the tick-based marker', last && last.side === 0 && last.q === 'perfect', last);
  const buffed = w2.units.filter(u => u.side === 0 && u.alive && u.hasteT > 2);
  T('G4 [legacy battle] strike changes real unit state (<=12 units buffed)', buffed.length > 0 && buffed.length <= 12, buffed.length);
  const w3 = E.createWorld(Object.assign({}, opts, { arcade: Object.assign({}, opts.arcade, { momentum: ['normal', 'normal'] }) })); while (w3.phase !== 'ended' && w3.t < 90) E.step(w3);
  T('G5 [legacy battle] max 4 strikes per side', w3.arc.mom.every(m => m.uses <= 4));
  // determinism incl. inputs
  const inp = [{ tick: pk + 1, q: 'tap' }];
  const h1 = B.simulate(B.worldOpts(snap, { headless: true, inputs: inp })).hash, h2 = B.simulate(B.worldOpts(snap, { headless: false, fxLevel: 2, inputs: inp })).hash;
  T('G6 [legacy battle] same seed + snapshot + inputs => same result (headless vs rendered fx)', h1 === h2); }
// ---- V4 regression ----
{ const V4 = (() => { delete require.cache[require.resolve('../src/v4_engine.js')]; const saved = global.FWEngine; const m = require('../src/v4_engine.js'); global.FWEngine = saved; return m; })();
  let same = true; for (let i = 0; i < 4; i++) { const o = { seed: 31337 + i, teamA: FW_MASTER_DB.clubs[i * 7], teamB: FW_MASTER_DB.clubs[i * 11 + 3], cfg: FW_ENGINE_CONFIG, ruleset: i % 2 ? 'fusion' : 'classic', duration: 'standard' }; if (V4.summaryV4(V4.simulate(o, 80)).hash !== E.summaryV4(E.simulate(o, 80)).hash) same = false; }
  T('R1 V4 regression: arcade engine with arcade off == original V4 (fusion + classic hashes)', same); }
console.log('core tests part 1: ' + pass + ' pass, ' + fail + ' fail, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
module.exports = { pass: () => pass, fail: () => fail };
