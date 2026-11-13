// V4 browser tests: (1) Classic == V3 html, (2) Fusion determinism, (3) seed variety, (4) edge cases, (5) goal integrity, (7) perf.
const { chromium } = require('playwright'); const path = require('path');
const V3 = 'file://' + path.resolve(__dirname, '../../football-wars-v3.html'), V4 = 'file://' + path.resolve(__dirname, '../../football-wars-v4.html');
(async () => { const b = await chromium.launch(); const errs = [];
  const open = async (url) => { const p = await b.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(url); await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready); return p; };
  const pairs = [['TUR_GALATASARAY','TUR_FENERBAHCE'],['ESP_REAL_MADRID','ESP_FC_BARCELONA'],['NAT_TURKIYE','NAT_GERMANY']];
  const classic = async (url, rs) => { const p = await open(url); const r = await p.evaluate(({ pairs, rs }) => { const all = [...FW_MASTER_DB.clubs, ...FW_MASTER_DB.national_teams], by = id => all.find(t => t.id === id), out = [];
    for (const [a, b2] of pairs) for (const seed of [424242, 2024, 31337]) for (const duration of ['standard', 'short']) { const o = { seed, teamA: by(a), teamB: by(b2), cfg: FW_ENGINE_CONFIG, duration, fxLevel: 1 }; if (rs) o.ruleset = rs;
      const w = FWEngine.simulate(o); out.push(JSON.stringify(FWEngine.summary(w)) + '|' + w.events.filter(e => e.type === FWEngine.EV.KO).map(e => e.b).join(',')); } return out; }, { pairs, rs }); await p.close(); return r; };
  const v3 = await classic(V3, null), v4 = await classic(V4, 'classic');
  let same = 0; v3.forEach((x, i) => { if (x === v4[i]) same++; });
  const base = JSON.parse(v3[0].split('|')[0]);
  console.log(`1) Classic regression (seed 424242,2024,31337 x GS-FB, RM-FCB, TUR-GER x standard/short): V3 html == V4 Classic ${same}/${v3.length}; e.g. GS-FB 424242 V3 hash ${base.hash}, winner ${base.winner}, survivors ${base.survivors}, endT ${base.endT}`);
  const p = await open(V4);
  const r = await p.evaluate(() => { const all = [...FW_MASTER_DB.clubs, ...FW_MASTER_DB.national_teams], by = id => all.find(t => t.id === id), E = FWEngine, V = E.EV;
    const fo = (a, b2, seed, extra) => Object.assign({ seed, teamA: by(a), teamB: by(b2), cfg: FW_ENGINE_CONFIG, duration: 'standard', fxLevel: 1, ruleset: 'fusion', fbIntensity: 'normal', goalAdv: true }, extra || {});
    const fev = w => w.events.filter(e => e.type >= 40).map(e => [e.k, e.type, e.a, e.b, e.c].join(':')).join('|');
    const out = { det: 0, detN: 0, varied: 0, edge: {}, goalsBad: 0, perMatch: [] };
    const P5 = [['TUR_GALATASARAY','TUR_FENERBAHCE'],['ESP_REAL_MADRID','ESP_FC_BARCELONA'],['NAT_TURKIYE','NAT_GERMANY'],['ITA_INTER','ITA_JUVENTUS'],['ENG_ARSENAL','ENG_LIVERPOOL']];
    for (const [a, b2] of P5) { const w1 = E.simulate(fo(a, b2, 7777)), w2 = E.simulate(fo(a, b2, 7777)); out.detN++;
      if (JSON.stringify(E.summaryV4(w1)) === JSON.stringify(E.summaryV4(w2)) && fev(w1) === fev(w2)) out.det++;
      const w3 = E.simulate(fo(a, b2, 8888)); if (fev(w3) !== fev(w1)) out.varied++; }
    // obs-on vs obs-off and effects never change Fusion
    { const w1 = E.simulate(fo('NAT_SPAIN', 'NAT_ITALY', 55)); const w2 = E.createWorld(fo('NAT_SPAIN', 'NAT_ITALY', 55)); w2.observer = FWDirector.createObserver({ fbFollow: true, fbAlerts: true });
      while (w2.phase !== 'ended') E.step(w2); out.obsSame = JSON.stringify(E.summaryV4(w1)) === JSON.stringify(E.summaryV4(w2)); }
    // edge-case census over many real Fusion battles
    const ec = { zeroGoal: 0, multiGoal: 0, saves: 0, wide: 0, post: 0, carrierKO: 0, carrierStun: 0, passTargetKO: 0, buffEnd: 0, goalNoKeeper: 0, sudden: 0, games: 0, shots: 0, goals: 0, endBallDead: 0 };
    const rng = new E.Rng(99);
    for (let i = 0; i < 40; i++) { const a = all[rng.int(all.length)], b2 = all[rng.int(all.length)]; if (a === b2) continue; const w = E.simulate(fo(a.id, b2.id, rng.int(1e9) + 1)); ec.games++;
      const f = E.fbSummary(w), g = f.goals[0] + f.goals[1]; ec.goals += g; ec.shots += f.shots[0] + f.shots[1]; if (!g) ec.zeroGoal++; if (g >= 2) ec.multiGoal++;
      ec.saves += f.saves[0] + f.saves[1]; ec.wide += f.wide[0] + f.wide[1]; ec.post += f.posts[0] + f.posts[1];
      for (const e of w.events) { if (e.type === V.BALL_LOOSE && e.b === 1) ec.carrierKO++; if (e.type === V.BALL_LOOSE && e.b === 3) ec.carrierStun++; if (e.type === V.BALL_LOOSE && e.b === 2) ec.passTargetKO++; if (e.type === V.GOAL_BUFF_END) ec.buffEnd++; if (e.type === V.SUDDEN) ec.sudden++; }
      // goal scored while the defending side had no keeper alive
      for (const e of w.events.filter(x => x.type === V.GOAL)) { const def = 1 - e.b; const gkKO = w.events.filter(x => x.type === V.KO && x.t <= e.t && w.units[x.b].side === def && w.units[x.b].role === 'goalkeeper').length; const gkTotal = w.units.filter(u => u.side === def && u.role === 'goalkeeper').length; if (gkKO === gkTotal) ec.goalNoKeeper++; }
      if (w.fb.ball.state === 'DEAD' && w.fb.buff[0] === 0 && w.fb.buff[1] === 0) ec.endBallDead++;
      // integrity: goals only from match-ball shots, once each, score == events, buffs bounded
      const ge = w.events.filter(x => x.type === V.GOAL), sg = w.fb.shots.filter(s => s.result === 'goal');
      if (ge.length !== g || sg.length !== g || new Set(ge.map(x => x.k + ':' + x.a)).size !== ge.length) out.goalsBad++;
      for (const x of ge) { const sh = w.fb.shots.find(s => s.shooter === x.a && s.result === 'goal'); if (!sh || w.units[x.a].side !== x.b) out.goalsBad++; }
      const bs = w.events.filter(x => x.type === V.GOAL_BUFF_START).length, be = w.events.filter(x => x.type === V.GOAL_BUFF_END).length; if (bs !== be) out.goalsBad++;
    }
    out.edge = ec;
    // perf: render cost classic vs fusion
    const A = window.FW_APP; A.setMode('domestic_league'); A.choose('A', 'TUR_GALATASARAY'); A.choose('B', 'TUR_FENERBAHCE');
    out.perf = {}; out.sim = {};
    for (const rs of ['classic', 'fusion']) { const set = Object.assign(A.settings(), { ruleset: rs }); const m = A.buildMatch(424242, set);
      const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920; const ctx = cv.getContext('2d'); let ts = 0, n = 0, simMs = 0;
      for (let T = 2.3; T < 40; T += 1 / 6) { const a0 = performance.now(); E.advanceTo(m.world, T); simMs += performance.now() - a0; const t0 = performance.now(); m.renderer.render(ctx, T, 1080, 1920, T); ts += performance.now() - t0; n++; }
      out.perf[rs] = (ts / n).toFixed(2) + ' ms render/frame'; out.sim[rs] = (simMs / (37.7 * 60) * 1000).toFixed(0) + ' µs/tick'; m.renderer.dispose(); }
    return out; });
  console.log(`2) Fusion same-seed repeat identical: ${r.det}/${r.detN}; observer/alerts/camera on vs off identical: ${r.obsSame}`);
  console.log(`3) different seeds give different football event streams: ${r.varied}/5`);
  console.log('4) edge-case census over', r.edge.games, 'Fusion battles:', JSON.stringify(r.edge));
  console.log('5) goal integrity violations:', r.goalsBad);
  console.log('7) perf:', JSON.stringify(r.perf), JSON.stringify(r.sim));
  console.log('ERRORS', JSON.stringify(errs)); await b.close(); })();
