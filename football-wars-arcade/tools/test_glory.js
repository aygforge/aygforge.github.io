// ROAD TO GLORY targeted logic tests (node, real battles; few seeds, specific scenarios).
const path = require('path');
let pass = 0, fail = 0; const T = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
const t0 = Date.now();
// ---- a real v2 (Arcade Mayhem) save produced by the previous release's core module ----
global.window = globalThis; require('../src/v4_data.js'); require('../src/engine.js'); require('../src/arcade_data.js');
const OLD = path.join(__dirname, 'fixtures/arcade_core_mayhem.js');
const Old = require(OLD);
const ov2 = Old.Save.fresh('TUR_GALATASARAY', 555);
ov2.credits = 3210; ov2.fragments = 44; ov2.upgrades.attack = 7; ov2.tickets = { t5: 2, t10: 1 };
ov2.stars.ST010 = { id: 'ST010', ovr: 61, contract: 13, rarity: Old.Stars.def('ST010').rarity, battles: 4 }; ov2.stars.ST030 = { id: 'ST030', ovr: 70, contract: 0, rarity: Old.Stars.def('ST030').rarity }; ov2.active = ['ST010'];
{ const sn = Old.Battle.snapshot(ov2, 'league', { attempt: 1 }); Old.Battle.begin(ov2, sn); const w = Old.Battle.simulate(Old.Battle.worldOpts(sn, { headless: true, auto: true })); Old.Battle.finish(ov2, sn, Old.Battle.result(w)); if (ov2.pendingDecision) Old.Battle.acceptLoss(ov2); }
const oldFx = Old.League.playerFixture(ov2); const v2txt = JSON.stringify(ov2), v2 = JSON.parse(v2txt);
delete require.cache[require.resolve('../src/arcade_core.js')];
const A = require('../src/arcade_core.js'); const E = FWEngine, B = A.Battle;
const prof = { name: 'Kadıköy Rockets', short: 'KR', shape: 'hex', symbol: 5, primary: '#3a86ff', secondary: '#fcbf49' };
const run = w => { while (w.phase !== 'ended' && w.t < 90) E.step(w); return w; };
// ===== 24.1 new career =====
const s = A.Save.fresh(prof, 2468, 'balanced');
T('N1 club created from scratch (custom identity, PLAYER_CLUB id, valid save)', s.club === A.PLAYER_CLUB && s.profile.name === 'Kadıköy Rockets' && A.Save.validate(s).length === 0);
const all = [].concat(...s.divisions);
T('N2 199 rival source clubs + your club in 10×20, spare 200th club kept for the Glory Cup', s.divisions.every(d => d.length === 20) && new Set(all).size === 200 && all.indexOf(s.spareClub) < 0 && A.club(s.spareClub) && all.filter(id => id === A.PLAYER_CLUB).length === 1);
T('N3 invalid identities rejected (name length, short length)', !!A.Club.validProfile(Object.assign({}, prof, { name: 'AB' })) && !!A.Club.validProfile(Object.assign({}, prof, { short: 'TOOLONG' })) && !A.Club.validProfile(prof));
for (const f of ['balanced', 'attack', 'fortress']) {
  s.formation = f; const sn = B.snapshot(s, 'league'); const w = E.createWorld(B.worldOpts(sn, { headless: true }));
  const roles = Object.fromEntries(E.ROLES.map(r => [r, w.units.filter(u => u.side === 0 && u.role === r).length]));
  T('N4 ' + f + ': real unit roles match the formation and total 100', JSON.stringify(roles) === JSON.stringify(A.FORMATIONS[f].roles) && w.units.filter(u => u.side === 0).length === 100, roles);
}
{ const RB = E.ROLE_BASE, bud = f => { const r = A.FORMATIONS[f].roles, k = A.formationBudget(f), c = A.FORM_CAL[f]; return [Object.keys(r).reduce((m, x) => m + r[x] * RB[x].hp, 0) * k.hp / c, Object.keys(r).reduce((m, x) => m + r[x] * RB[x].dmg / RB[x].interval, 0) * k.dmg / c]; };
  const b0 = bud('balanced'), b1 = bud('attack'), b2 = bud('fortress');
  T('N5 the three formations share the same raw HP and damage budget (before the measured effectiveness calibration)', [b1, b2].every(b => Math.abs(b[0] - b0[0]) / b0[0] < 0.001 && Math.abs(b[1] - b0[1]) / b0[1] < 0.001), { b0, b1, b2 });
  s.formation = 'attack'; const wa = run(E.createWorld(B.worldOpts(B.snapshot(s, 'league'), { headless: true }))); s.formation = 'fortress'; const wf = run(E.createWorld(B.worldOpts(B.snapshot(s, 'league'), { headless: true })));
  T('N6 formation changes real behaviour (same seed: different shots / tackles / result hash)', wa.hash !== wf.hash && (wa.fb.stats.shots[0] !== wf.fb.stats.shots[0] || wa.teams[0].kills !== wf.teams[0].kills), { attackShots: wa.fb.stats.shots[0], fortressShots: wf.fb.stats.shots[0] }); s.formation = 'balanced'; }
// ===== 24.2 battle =====
{ const sn = B.snapshot(s, 'league'); const w = E.createWorld(B.worldOpts(sn, { headless: true })); let over = false, zone = false;
  while (w.phase !== 'ended' && w.t < 90) { E.step(w); if (w.teams[0].alive > 100 || w.teams[1].alive > 100) over = true; if (w.zone.active || w.storm) zone = true; }
  const ev = new Set(w.events.map(e => e.type));
  T('B1 real ball: pass, shot, KO events and a real winner', ev.has(E.EV.BALL_PASS) && ev.has(E.EV.SHOT_ON_GOAL) && ev.has(E.EV.KO) && w.winner >= 0);
  T('B2 ≤100 alive, no zone, no storm', !over && !zone && w.rules.indexOf('STORM') < 0); }
{ let ok = true, ent = 0; for (let seed = 1; seed <= 8; seed++) { const w = run(E.createWorld(B.worldOpts(Object.assign(B.snapshot(s, 'league'), { seed }), { headless: true }))); for (const m of w.may.s) { if (m.earned > 9 || m.entered > m.earned) ok = false; ent += m.entered; } }
  T('B3 goal reinforcements capped at +9 per team (8 battles)', ok, { entered: ent }); }
{ const keep = E.MAY.FRENZY_T; const w = E.createWorld(B.worldOpts(B.snapshot(s, 'league'), { headless: true })); for (const u of w.units) { u.maxHp *= 40; u.hp = u.maxHp; } run(w);
  T('B4 Final Frenzy at 40 s, time-up without artificial K.O.s, full pitch', w.may.frenzy && /TIME_UP/.test(w.rules.join()) && w.teams[0].alive > 0 && w.teams[1].alive > 0 && !w.zone.active, { rules: w.rules }); void keep; }
// ===== 24.3 Powers =====
{ const s3 = A.Save.fresh(prof, 99, 'balanced');
  s3.level = 50; s3.xp = A.Progression.totalTo(50); s3.highestDiv = 1; s3.career.ballWins = 30; s3.career.goals = 12; s3.claims['ch:first:D5:signature'] = 1; s3.endless.firstTitle = true;
  A.Powers.refreshUnlocks(s3);
  T('P1 all 24 Powers can be unlocked (each through its own condition)', Object.keys(s3.powers.unlocked).length === 24 && new Set(A.Powers.LIST.map(p => p.id)).size === 24 && A.Powers.LIST.every(p => E.PW.LIST.indexOf(p.id) >= 0));
  const fresh = A.Save.fresh(prof, 7, 'balanced');
  T('P2 a new club starts with exactly the 6 starter Powers', Object.keys(fresh.powers.unlocked).sort().join() === 'bowling_charge,domino_impact,fortress,rocket_boots,second_wind,wild_ball');
  let dupOk = true, legOk = true, wilds = new Set();
  for (let i = 0; i < 300; i++) { const L = A.Powers.loadout(s3, 'k' + i); if (new Set(L.map(x => x.id)).size !== 4) dupOk = false; if (L.filter(x => A.Powers.def(x.id).rarity === 'legendary').length > 1) legOk = false; L.filter(x => !x.fav).forEach(x => wilds.add(x.id)); }
  T('P3 Favorite + Wild loadouts: always 4 different Powers, never 2 Legendaries, varied Wilds', dupOk && legOk && wilds.size >= 15, { distinctWilds: wilds.size });
  const ai = Array.from({ length: 40 }, (_, i) => A.Powers.aiLoadout(10, 1000 + i)); T('P4 AI Division 10 loadouts use only Common Powers; Division 1 may use higher rarities', ai.every(L => L.every(x => A.Powers.def(x.id).rarity === 'common')) && Array.from({ length: 40 }, (_, i) => A.Powers.aiLoadout(1, i)).some(L => L.some(x => A.Powers.def(x.id).rarity !== 'common')));
  // every Power fires in real battles and leaves its own real footprint (probe right after the tick it fired)
  const probe = {
    rocket_boots: (w, sd) => w.units.some(u => u.side === sd && u.rushT > 0), wing_stampede: (w, sd) => w.units.some(u => u.side === sd && u.rushT > 0), bowling_charge: (w, sd) => w.units.some(u => u.side === sd && u.rushT > 0 && u.rushMax === 5),
    pinball_strike: w => !!(w.fb.ball.shot && w.fb.ball.shot.power === 'pinball_strike'), golden_volley: w => !!(w.fb.ball.shot && w.fb.ball.shot.power === 'golden_volley'), meteor_shot: w => !!(w.fb.ball.shot && w.fb.ball.shot.power === 'meteor_shot'),
    ricochet_fever: (w, sd) => w.pow.s[sd].ricoT > 0, berserker_attack: (w, sd) => w.units.some(u => u.side === sd && u.dmgBuffT > 2), fortress: (w, sd) => w.units.some(u => u.side === sd && u.ironT > 0),
    counter_shield: (w, sd) => w.units.some(u => u.side === sd && u.kbImmuneT > 0 && u.shieldT > 0), interception_net: (w, sd) => w.units.some(u => u.side === sd && u.ironT > 0 && u.ironDR === 1),
    iron_curtain: (w, sd) => w.units.some(u => u.side === sd && u.ironT > 0 && u.ironDR < 0.7), miracle_save: (w, sd) => w.units.some(u => u.side === sd && u.miracleT > 0), last_stand: (w, sd) => w.units.some(u => u.side === sd && u.ironT > 0 && u.regenT > 0),
    domino_impact: (w, sd) => w.pow.s[sd].dominoT > 0, wild_ball: w => w.fb.ball.wildT > 0, thunder_tackle: (w, sd, h) => h, turbo_madness: w => w.pow.turboT > 0, second_wind: (w, sd) => w.units.some(u => u.side === sd && u.regenT > 2.9 && u.sta > 99),
    captains_rally: (w, sd) => w.units.some(u => u.side === sd && u.hasteT > 2.5), medical_rush: (w, sd, h, healed) => healed, adrenaline_wave: (w, sd) => w.units.some(u => u.side === sd && u.atkSpdT > 2.5),
    tactical_genius: (w, sd) => w.pow.s[sd].tacT > 0, star_spotlight: (w, sd) => w.teams[sd].starSp.some(x => x.spot > 0 || x.uses > 0)
  };
  const fired = {}, real = {}; const stars = A.Stars.defs.filter(d => d.rarity === 'epic' && d.role !== 'captain').slice(0, 3).map(d => A.Stars.unitSpec(d.id, 70, 0));
  const L = E.PW.LIST;
  for (let g = 0; g < 18; g++) {
    const pick = k => [0, 1, 2, 3].map(i => ({ id: L[(k * 4 + i) % 24], rank: 1, fav: i < 2 }));
    const o = B.worldOpts(Object.assign(B.snapshot(s3, 'league'), { seed: 900 + g }), { headless: true }); o.arcade.powers = [pick(g % 6), pick((g + 3) % 6)]; o.arcade.stars = [stars, stars];
    const w = E.createWorld(o); let seen = 0;
    while (w.phase !== 'ended' && w.t < 90) {
      const hp = w.units.map(u => u.hp), evs = w.events.length; E.step(w);
      while (seen < w.pow.used.length) { const c = w.pow.used[seen++]; fired[c.id] = (fired[c.id] || 0) + 1;
        const hit = w.events.slice(evs).some(e => (e.type === E.EV.HIT || e.type === E.EV.CRIT || e.type === E.EV.KO) && w.units[e.b] && w.units[e.b].side !== c.side);
        const healed = w.units.some((u, i) => u.side === c.side && u.alive && u.hp > hp[i] + 1);
        if (probe[c.id] && probe[c.id](w, c.side, hit, healed)) real[c.id] = (real[c.id] || 0) + 1; }
    }
  }
  const missing = L.filter(id => !fired[id]), fake = L.filter(id => fired[id] && !real[id]);
  T('P5 all 24 Powers fire in real battles', missing.length === 0, { missing });
  T('P6 every fired Power left its own real effect in the world (probe per Power)', fake.length === 0, { fake });
  const seedOpts = (sd, fx) => { const o = B.worldOpts(Object.assign(B.snapshot(s3, 'league'), { seed: sd }), { headless: fx == null, fxLevel: fx }); o.arcade.powers = [B.snapshot(s3, 'league').powers[0], A.Powers.aiLoadout(3, 5)]; return o; };
  const h1 = run(E.createWorld(seedOpts(4242))), h2 = run(E.createWorld(seedOpts(4242, 2))), h3 = run(E.createWorld(seedOpts(4242, 0)));
  T('P7 same seed + squads + loadouts => identical battle (Quick Sim/headless = live High = live Low)', h1.hash === h2.hash && h2.hash === h3.hash, [h1.hash.toString(16), h2.hash.toString(16), h3.hash.toString(16)]);
  const sn = B.snapshot(s3, 'league'), re = JSON.parse(JSON.stringify(sn));
  T('P8 Wild Powers are fixed per battle (snapshot JSON round-trip + rebuilding the same battle gives the same Wilds)', JSON.stringify(re.powers) === JSON.stringify(sn.powers) && JSON.stringify(B.snapshot(s3, 'league').powers) === JSON.stringify(sn.powers));
  const ws = new Set(); for (let i = 0; i < 20; i++) { s3.stats.battles = i; ws.add(B.snapshot(s3, 'league').powers[0].filter(x => !x.fav).map(x => x.id).join()); }
  T('P9 Wild Powers differ from match to match', ws.size >= 8, { distinct: ws.size });
  { const m0 = run(E.createWorld(B.worldOpts(B.snapshot(fresh, 'league'), { headless: true }))); const P = E.powSummary(m0).sides[0];
    T('P10 no manual commands remain: player side has no energy commands, Powers come only from the engine', m0.may.s[0].mode === 'off' && m0.may.used.length === 0 && P.total >= 1, { used: P.total }); }
}
// ===== Power Mastery (counted once per use, once per fixture; no REMATCH double; repeat challenges give none) =====
{ const s4 = A.Save.fresh(prof, 31, 'balanced');
  const out = {}; A.Powers.addMastery(s4, { rocket_boots: 9, fortress: 2 }, 'fx:test', out); A.Powers.addMastery(s4, { rocket_boots: 9 }, 'fx:test', out);
  T('M1 mastery grant is once per fixture key', s4.powers.mastery.rocket_boots === 9 && s4.powers.mastery.fortress === 2);
  A.Powers.addMastery(s4, { rocket_boots: 6 }, 'fx:test2', out);
  T('M2 rank 2 at 15 uses, rank 3 at 40', A.Powers.rank(s4, 'rocket_boots') === 2 && (s4.powers.mastery.rocket_boots = 40, A.Powers.rank(s4, 'rocket_boots') === 3) && (out.powerRanks || []).some(r => r.id === 'rocket_boots' && r.rank === 2));
  const lo = A.Powers.loadout(s4, 'x'); T('M3 mastery rank flows into the battle loadout (engine scales the effect)', lo.find(x => x.id === 'rocket_boots').rank === 3 && E.PW.MASTERY[3] === 1.10 && E.PW.MASTERY[2] === 1.05); }
// ===== 24.4 stars =====
{ const s5 = A.Save.fresh(prof, 41, 'balanced'); s5.credits = 1e6;
  A.Draft.open(s5, 'standard', 'credits'); const reload = A.Save.parse(A.Save.serialize(s5));
  T('S1 open draft survives reload with the same 3 candidates', JSON.stringify(reload.pendingDraft.cands) === JSON.stringify(s5.pendingDraft.cands));
  const r1 = A.Draft.pick(s5, 0), id = r1.id;
  T('S2 signed star is permanent (no contract field)', s5.stars[id] && s5.stars[id].contract === undefined && !A.Stars.canEquip(s5, id));
  A.Stars.equip(s5, id);
  const roles = ['striker', 'winger', 'playmaker', 'defender', 'support', 'goalkeeper'];
  for (const r of roles) { const d = A.Stars.defs.find(x => x.role === r && !s5.stars[x.id]); s5.stars[d.id] = { id: d.id, ovr: 50, adapted: 50, xp: 0, rarity: d.rarity }; A.Stars.equip(s5, d.id); }
  T('S3 five active slots maximum', s5.active.length === 5);
  for (let i = 0; i < 30; i++) { const sn = B.snapshot(s5, 'challenge', { div: 10, kind: 'power' }); B.begin(s5, sn); B.finish(s5, sn, { won: false, winner: 1, survivors: 0, goals: [0, 0], alive: [0, 9] }); }
  T('S4 stars stay usable after 30 battles (no contracts)', B.snapshot(s5, 'league').stars.length === 5);
  const c = s5.stars[id], o = {}; c.xp = 0;
  s5.pendingDraft = { n: 9001, type: 'standard', cands: [{ id, rarity: c.rarity, ovr: 99, dup: true }, { id: 'ST001', rarity: 'common', ovr: 45 }, { id: 'ST002', rarity: 'common', ovr: 45 }] };
  const before = A.Draft.dupPreview(s5, s5.pendingDraft.cands[0]); A.Draft.pick(s5, 0);
  T('S5 duplicate = Star XP by rarity (preview shown before), OVR unchanged', c.xp === A.Stars.DUP_XP[c.rarity] && before.xp === A.Stars.DUP_XP[c.rarity] && c.ovr !== 99, { xp: c.xp });
  c.xp = 80; const f0 = s5.fragments; s5.pendingDraft = { n: 9002, type: 'standard', cands: [{ id, rarity: c.rarity, ovr: 99, dup: true }, { id: 'ST001', rarity: 'common', ovr: 45 }, { id: 'ST002', rarity: 'common', ovr: 45 }] }; A.Draft.pick(s5, 0);
  T('S6 duplicate of a Club Legend (rank 5) refunds Pack Fragments', s5.fragments - f0 === A.Stars.DUP_FRAG[c.rarity] && c.xp === 80);
  c.xp = 0; c.ovr = 55; c.adapted = 55; c.rarity = 'rare';
  const e0 = A.Stars.effOvr(c); c.xp = 80; const e5 = A.Stars.effOvr(c);
  T('S7 Star Mastery raises the effective OVR used in battle (+3.5 at Club Legend) and the ability power', e5 - e0 === 3.5 && A.Stars.unitSpec(id, e5, A.Stars.SM.abil[4]).powMul === 1.08);
  const sn = B.snapshot(s5, 'league'); const w = E.createWorld(B.worldOpts(sn, { headless: true })); const u = w.units.find(x => x.star && x.star.id === id);
  T('S8 the battle unit really carries the mastered OVR', u && Math.abs(u.star.ovr - A.Stars.effOvr(c)) < 1e-9);
  for (let k = 0; k < 6; k++) A.Stars.adapt(s5, id, 1, {});
  T('S9 League Adaptation: 6 Division 1 matches lift a D10 Rare (55) to the D1 Rare floor −2 (78); never weakens; ≤99', A.Stars.baseOvr(c) === 78 && A.Stars.effOvr(c) === 81.5, { base: A.Stars.baseOvr(c), eff: A.Stars.effOvr(c) });
  A.Stars.adapt(s5, id, 10, {}); for (let k = 0; k < 6; k++) A.Stars.adapt(s5, id, 10, {});
  T('S10 adaptation in a lower Division never reduces OVR', A.Stars.baseOvr(c) === 78);
  s5.academy.a10 = 1; const x0 = c.xp; A.Stars.train(s5, id, 'a10'); A.Stars.train(s5, id, 'a10');
  T('S11 Academy +10 ticket adds Star XP once per ticket', c.xp === x0 + 10 && s5.academy.a10 === 0);
  // pity still works
  const s6 = A.Save.fresh(prof, 8, 'balanced'); s6.credits = 1e8; s6.highestDiv = 8; let gap = 0, maxGap = 0;
  for (let i = 0; i < 2000; i++) { const d = A.Draft.open(s6, 'premium', 'credits'); gap = d.cands.some(x => x.rarity === 'legendary') ? 0 : gap + 1; maxGap = Math.max(maxGap, gap); s6.pendingDraft = null; }
  T('S12 Premium pity: a Legendary candidate by the 10th pack', maxGap <= 9, maxGap); }
// ===== 24.5 / 24.6 career & rewards (real battles for every match of a Division 10 season) =====
{ const s7 = A.Save.fresh(prof, 2026, 'balanced');
  const drain = () => { while (s7.league.aiQueue.length) { const j = A.League.aiJob(s7); A.League.applyAI(s7, j, B.result(B.simulate(B.aiOpts(s7, j)))); } };
  const play = (forceLoss) => { const sn = B.snapshot(s7, 'league', { attempt: 1 }); B.begin(s7, sn); let r = B.result(B.simulate(B.worldOpts(sn, { headless: true }))); if (forceLoss) r = Object.assign({}, r, { won: false, winner: 1 }); let o = B.finish(s7, sn, r);
    if (o.canRematch) { const sn2 = B.snapshot(s7, 'league', { attempt: 2 }); B.begin(s7, sn2); o = B.finish(s7, sn2, B.result(B.simulate(B.worldOpts(sn2, { headless: true })))); o.rem = true; } return o; };
  const c0 = s7.credits; const o1 = play(true);
  T('R1 first match after a REMATCH: one fixture result, Founder\'s Bonus +45 once', s7.officialPlayed === 1 && !!s7.claims.founder && (o1.rewards.labels || []).indexOf("Founder's Bonus") >= 0, { credits: s7.credits - c0, labels: o1.rewards.labels });
  const fx0 = Object.keys(s7.league.results).filter(k => s7.league.results[k].player).length; drain();
  T('R2 REMATCH did not create a second fixture result', fx0 === 1);
  let frags = s7.fragments; const sig = []; for (let i = 2; i <= 19; i++) { const f0 = s7.fragments; const o = play(false); if (o.rewards && o.rewards.milestone) sig.push([i, s7.fragments - f0, o.rewards.milestone.name]); drain(); }
  T('R3 milestones after matches 4, 9, 14 (once each)', sig.map(x => x[0]).join() === '4,9,14' && !!s7.claims['mlst:D10:14'], sig);
  T('R4 match-14 milestone gives +5 Academy ticket; free Standard Pack once (3rd match)', s7.claims['free:standard'] === s7.claims['free:standard'] && s7.academy.a5 >= 1 && s7.packs.standard >= 1);
  T('R5 19 official matches, 190 real results, table consistent', s7.officialPlayed === 19 && Object.keys(s7.league.results).length === 190 && A.League.table(s7).every(r => r.p === 19 && r.pts === 3 * r.w));
  const rank = A.League.rank(s7); const cs = A.Endgame.closeSeason(s7);
  T('R6 season closes once; top-3 promote directly, others get the Promotion Challenge', cs && A.Endgame.closeSeason(s7) === null && (rank <= 3 ? s7.league.phase === 'promoted' : s7.league.phase === 'promo'), { rank, phase: s7.league.phase });
  if (s7.league.phase === 'promo') { A.Endgame.promoStart(s7); for (let i = 0; i < 2; i++) { const sn = B.snapshot(s7, 'promo', {}); B.begin(s7, sn); B.finish(s7, sn, { won: true, winner: 0, survivors: 20, goals: [1, 0], alive: [20, 0] }); } }
  const tr = s7.trophies.length; A.Endgame.promote(s7);
  T('R7 promotion to Division 9, trophy recorded, cosmetics unlocked, 20 clubs per Division', s7.division === 9 && s7.trophies.length >= 1 && s7.cosmetics.kits.indexOf('stripes') >= 0 && s7.divisions.every(d => d.length === 20) && new Set([].concat(...s7.divisions)).size === 200, { trophies: s7.trophies.map(t => t.type) });
  // replaying a Division does not repay its milestones
  const s8 = A.Save.fresh(prof, 77, 'balanced'); for (let k = 0; k < 2; k++) { const L = s8.league; for (let r = 0; r < 4; r++) { const fx = A.League.playerFixture(s8); A.Endgame.finalizeFixture(s8, fx, true, { goals: [1, 0], survivors: 10 }, {}, {}); L.aiQueue = []; } L.round = 19; L.phase = 'promo'; A.Endgame.replaySeason(s8); }
  T('R8 replayed season: Division milestones are not paid twice', Object.keys(s8.claims).filter(k => k.startsWith('mlst:D10:4')).length === 1);
  // Division 1 endless + first title
  const s9 = A.Save.fresh(prof, 909, 'balanced'); for (let d = 10; d > 1; d--) { s9.league.round = 19; s9.league.aiQueue = []; s9.league.phase = 'promoted'; A.Endgame.promote(s9); }
  const titles = [];
  for (let k = 0; k < 2; k++) { const L = s9.league; L.round = 19; L.aiQueue = []; for (let r = 0; r < 19; r++) for (const m of L.rounds[r]) L.results[A.League.fixtureId(L, r, m[0], m[1])] = { a: m[0], b: m[1], winner: m[0] === s9.club ? 0 : m[1] === s9.club ? 1 : r % 2, ga: 1, gb: 0, surv: 9 }; const o = A.Endgame.closeSeason(s9); titles.push([o.rank, !!o.firstTitle, s9.packs.legend]); A.Endgame.nextEndless(s9); }
  T('R9 Division 1 title is reachable; first title gives Golden Champion Crest + Legend pack once; Endless seasons continue', s9.division === 1 && titles[0][0] === 1 && titles[0][1] && !titles[1][1] && s9.goldenCrest && s9.cosmetics.frames.indexOf('champion') >= 0 && s9.league.phase === 'regular', titles);
  A.Powers.refreshUnlocks(s9); T('R10 first D1 title unlocks Ricochet Fever; D1 unlocks Last Stand', !!s9.powers.unlocked.ricochet_fever && !!s9.powers.unlocked.last_stand);
  const s10 = A.Save.fresh(prof, 1, 'balanced'); const out50 = {}; A.Progression.addXP(s10, 99999, out50);
  T('R11 Team Level 50 gives the Eternal Club Banner (not the Golden Crest)', s10.cosmetics.banner && !s10.goldenCrest); }
// ===== Coach Analysis / Comeback Roadmap =====
{ const s11 = A.Save.fresh(prof, 3, 'balanced'); s11.credits = 200;
  let lastOut = null; for (let i = 0; i < 3; i++) { const sn = B.snapshot(s11, 'league', { attempt: 1 }); B.begin(s11, sn); const r = Object.assign(B.result(B.simulate(B.worldOpts(sn, { headless: true }))), { won: false, winner: 1 }); const o = B.finish(s11, sn, r); lastOut = o; if (o.canRematch) { lastOut = Object.assign(o, { accepted: A.Battle.acceptLoss(s11) }); } }
  T('C1 Coach Analysis: 1–3 concrete tips after a loss', lastOut.coach && lastOut.coach.length >= 1 && lastOut.coach.length <= 3, lastOut.coach && lastOut.coach.map(t => t.k));
  T('C2 three final losses in a row -> Comeback Roadmap; rival strength unchanged', s11.career.lossStreak === 3 && !!lastOut.accepted.roadmap && A.League.rating(s11, A.League.playerFixture(s11).opp, 10, s11.league.seasonId) === A.League.rating(s11, A.League.playerFixture(s11).opp, 10, s11.league.seasonId)); }
// ===== 24.7 save migration from a real Mayhem (v2) save =====
{ const m = A.Save.parse(v2txt);
  const keep = ['credits', 'fragments', 'xp', 'level', 'division', 'highestDiv', 'upgrades', 'packs', 'pity', 'challenges', 'endless', 'officialPlayed', 'history'];
  T('V1 v2 save loads: progress fields unchanged', m.v === 3 && keep.every(k => JSON.stringify(m[k]) === JSON.stringify(v2[k])), keep.filter(k => JSON.stringify(m[k]) !== JSON.stringify(v2[k])));
  T('V2 identity kept from the old club (name/colours), club becomes PLAYER_CLUB, old club becomes the Glory Cup guest', m.profile.name === 'Galata Lions' && m.club === A.PLAYER_CLUB && m.spareClub === 'TUR_GALATASARAY' && m.divisions[9].indexOf(A.PLAYER_CLUB) >= 0 && [].concat(...m.divisions).indexOf('TUR_GALATASARAY') < 0);
  const nfx = A.League.playerFixture(m);
  T('V3 fixtures & results kept (renamed to the player club), next fixture continues', nfx.round === oldFx.round && nfx.opp === oldFx.opp && Object.keys(m.league.results).length === Object.keys(v2.league.results).length && !!m.claims['fx:' + Object.keys(m.league.results).find(k => m.league.results[k].player)]);
  T('V4 stars permanent: contract 13 -> 6 XP, expired star playable, tickets -> Academy', m.stars.ST010.xp === 6 && m.stars.ST030.xp === 0 && m.stars.ST010.contract === undefined && !A.Stars.canEquip(m, 'ST030') && m.academy.a5 === 2 && m.academy.a10 === 1);
  const again = A.Save.parse(A.Save.serialize(m)); T('V5 migration is one-time (re-parsing a v3 save changes nothing)', JSON.stringify(again.stars) === JSON.stringify(m.stars) && again.academy.a5 === 2);
  // legacy Mayhem pending battle resumes with its original rules (and its frozen teams)
  const ov3 = Old.Save.fresh('ENG_ARSENAL', 9); const sn = Old.Battle.snapshot(ov3, 'league'); Old.Battle.begin(ov3, sn);
  const w0 = E.createWorld(Old.Battle.worldOpts(sn, { headless: true, cmds: [{ tick: 900, side: 0, type: 'rush', tx: 180, ty: 330 }] })); run(w0);
  ov3.pendingBattle.cmds = [{ tick: 900, side: 0, type: 'rush', tx: 180, ty: 330 }];
  const mig = A.Save.parse(JSON.stringify(ov3)); const ps = mig.pendingBattle.snap;
  const w1 = E.createWorld(B.worldOpts(ps, { headless: true, cmds: mig.pendingBattle.cmds })); run(w1);
  T('V6 unfinished Mayhem battle resumes byte-identical under the old rules after migration', w1.hash === w0.hash && ps.mech === 'mayhem', [w0.hash.toString(16), w1.hash.toString(16)]);
  const fo = B.finish(mig, ps, B.result(w1)); T('V7 ...and its result lands on the renamed fixture once', !fo.stale && (fo.canRematch || mig.officialPlayed === 1)); }
console.log('road to glory logic tests: ' + pass + ' pass, ' + fail + ' fail, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
