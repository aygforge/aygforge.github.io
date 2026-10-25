// Multi-season headless career simulation with invariant checks.
const { load } = require('./load');
const AD = load();
const SEASONS = +(process.argv[2] || 4);
const { WorldGenerator, Game, Leagues, Calendar, Sanity, Economy, Squad, TIERS, GameState } = AD;
const fail = [];
const check = (c, msg) => { if (!c) fail.push(msg); };

(async () => {
  let t0 = Date.now();
  WorldGenerator.generate(777);
  console.log('world gen ms', Date.now() - t0, 'glads', Object.keys(AD.S.glads).length, 'clubs', AD.S.clubs.length);
  // player: new ludus in Nemeris, managed by the AI for the test
  const pc = WorldGenerator.createNewLudus('nemeris', 'Ludus Testus', { sh: 1, sy: 2, c1: '#9e2a22', c2: '#d4ad52' });
  WorldGenerator.setPlayer(pc.id, true);
  pc.autoManage = true;
  const S = () => AD.S;
  check(S().clubs.length === 240, 'clubs 240');
  const tierBudgets = () => { const out = {}; for (let t = 1; t <= 6; t++) { const cs = S().clubs.filter(c => c.tier === t); out[t] = Math.round(cs.reduce((a, c) => a + c.budget, 0) / cs.length); } return out; };
  console.log('start budgets by tier', tierBudgets());
  const initialIds = new Set(Object.keys(S().glads));
  let weekMs = [], totalTransfers0 = S().transfers.length;
  for (let s = 0; s < SEASONS; s++) {
    for (let w = 0; w <= 30; w++) {
      const tw = Date.now();
      const wk = S().week;
      await Game.processWeek();
      weekMs.push(Date.now() - tw);
      // invariants
      for (const c of S().clubs) {
        check(c.roster.length <= 5, `roster>5 club ${c.id} s${S().season}w${S().week}`);
        check(isFinite(c.budget) && c.budget >= 0, `budget bad ${c.id} ${c.budget}`);
        check(new Set(c.roster).size === c.roster.length, 'dup roster');
        for (const id of c.lineup) check(c.roster.includes(id), 'lineup not in roster');
      }
      const iss = Sanity.check(false);
      check(iss.length === 0, 'sanity: ' + iss.slice(0, 3).join(','));
      if (wk === 29) {
        // season complete: every club played 14 league matches
        for (const lg of S().leagues) {
          const t = Leagues.table(lg);
          check(t.length === 8, 'table size');
          for (const r of t) check(r.p === 14, `club ${r.cid} played ${r.p}`);
          const pts = t.reduce((a, r) => a + r.pts, 0);
          check(pts === 56 * 3, 'points sum ' + pts);
        }
        for (const cup of Object.values(S().rcups)) {
          check(cup.champ >= 0, 'rcup champion ' + cup.key);
          const cnt = {};
          cup.rounds.forEach(rd => rd.m.forEach(m => { cnt[m.h] = (cnt[m.h] || 0) + 1; cnt[m.a] = (cnt[m.a] || 0) + 1; }));
          // eliminated clubs never reappear: each club appears at most once per round, losers never again
          const elim = new Set();
          cup.rounds.forEach(rd => rd.m.forEach(m => { check(!elim.has(m.h) && !elim.has(m.a), 'eliminated club reappeared'); }) || rd.m.forEach(m => elim.add(m.r.w === 0 ? m.a : m.h)));
          check(cup.rounds[0].m.length === 16 && cup.rounds[1].m.length === 16 && cup.rounds[2].m.length === 8 && cup.rounds[5].m.length === 1, 'rcup structure');
        }
        if (S().icup) { check(S().icup.champ >= 0, 'icup champ'); check(S().icup.part.length === 10, 'icup 10'); check(S().icup.rounds[0].m.length === 2 && S().icup.rounds[1].m.length === 4, 'icup structure'); }
      }
    }
    const me = GameState.player();
    const h = S().hist.seasons[S().hist.seasons.length - 1];
    const ret = S().hist.retired.filter(r => r.s === S().season - 1).length;
    const free = GameState.freeAgents().length;
    const tierAvg = []; for (let t = 1; t <= 6; t++) { const cs = S().clubs.filter(c => c.tier === t); tierAvg.push(Math.round(cs.reduce((a, c) => a + Squad.avgOvr(c), 0) / cs.length * 10) / 10); }
    const arrears = S().clubs.filter(c => c.arrears > 0).length;
    console.log(`--- season ${S().season - 1} done. player: tier ${h.player.tier} rank ${h.player.rank} (${h.player.w}-${h.player.l}) budget ${me.budget} | retired ${ret} free ${free} glads ${Object.keys(S().glads).length} | transfers ${S().transfers.length - totalTransfers0} | arrears clubs ${arrears} | icup ${S().icup ? 'yes' : 'no'}`);
    console.log('   tier avg ovr', tierAvg.join(' / '), '| budgets', JSON.stringify(tierBudgets()));
    totalTransfers0 = S().transfers.length;
  }
  // league position movement & composition
  const moved = AD.S.clubs.filter(c => c.hist.length >= 2 && c.hist[0].tier !== c.hist[c.hist.length - 1].tier).length;
  console.log('clubs that changed tier at some point:', moved);
  const survivors = [...initialIds].filter(id => AD.S.glads[id]).length;
  console.log('original gladiators still active', survivors, '/', initialIds.size);
  // ages / injuries
  const all = Object.values(AD.S.glads);
  console.log('injured now', all.filter(g => g.injury).length, 'avg age', (all.reduce((a, g) => a + g.age, 0) / all.length).toFixed(1));
  // AI-AI transfers
  const aiT = AD.S.transfers.filter(t => t.ty === 'transfer' && t.f >= 0 && t.t >= 0).length;
  console.log('club-to-club transfers in log', aiT, 'free signings', AD.S.transfers.filter(t => t.ty === 'free').length);
  weekMs.sort((a, b) => a - b);
  console.log('week ms median', weekMs[weekMs.length >> 1], 'max', weekMs[weekMs.length - 1]);
  // save roundtrip
  const json = AD.SaveManager.serialize();
  console.log('save size KB', Math.round(json.length / 1024));
  const before = JSON.stringify({ s: AD.S.season, w: AD.S.week, b: AD.S.clubs.map(c => c.budget), r: AD.S.clubs.map(c => c.roster) });
  const r = AD.SaveManager.apply(json);
  check(r.ok, 'load ok ' + r.msg);
  const after = JSON.stringify({ s: AD.S.season, w: AD.S.week, b: AD.S.clubs.map(c => c.budget), r: AD.S.clubs.map(c => c.roster) });
  check(before === after, 'roundtrip identical');
  // determinism after reload: continue a week from the loaded state twice
  const snap = AD.SaveManager.serialize();
  await Game.processWeek(); const a1 = AD.SaveManager.serialize();
  AD.SaveManager.apply(snap); await Game.processWeek(); const a2 = AD.SaveManager.serialize();
  check(a1.replace(/"savedAt":\d+/, '') === a2.replace(/"savedAt":\d+/, ''), 'deterministic continuation after reload');
  const bad = AD.SaveManager.apply('{"v":1,"clubs":[]}');
  check(!bad.ok, 'corrupt rejected');
  console.log(fail.length ? 'FAILURES (' + fail.length + '):\n' + [...new Set(fail)].slice(0, 30).join('\n') : 'ALL CHECKS PASSED');
})().catch(e => { console.error(e); process.exit(1); });
