// V4: Classic == V3 engine (bit-identical summaries) + Fusion determinism, goal integrity and football stats.
const V3 = require(process.env.V3 || '/tmp/claude-0/-home-user-aygforge-github-io/191a4712-9ac7-5807-a3c4-be4d74e74dc3/scratchpad/engine_v3.js');
delete require.cache[require.resolve('../src/engine.js')]; const E = require('../src/engine.js');
const db = require('../data/football_wars_master_2026_27.json'), cfg = require('../data/battle_engine_config.json');
const all = [...db.clubs, ...db.national_teams], by = id => all.find(t => t.id === id);
const pairs = [['TUR_GALATASARAY','TUR_FENERBAHCE'],['ESP_REAL_MADRID','ESP_FC_BARCELONA'],['NAT_TURKIYE','NAT_GERMANY'],['ITA_INTER','ITA_JUVENTUS'],['NAT_SPAIN','NAT_SAN_MARINO'],['ENG_ARSENAL','GRE_VOLOS_NFC']];
const N = +(process.argv[2] || 3), seeds = [424242, 2024, 777, 99991, 31337].slice(0, N);
let classicSame = 0, cTot = 0, fusDet = 0, fTot = 0, bad = [], agg = { goals: [], shots: 0, onT: 0, saves: 0, passes: 0, passAtt: 0, inter: 0, steals: 0, posts: 0, wide: 0, dur: [], zeroGoal: 0, multiGoal: 0, sameWinnerAsClassic: 0 };
const t0 = Date.now();
for (const [a, b] of pairs) for (const seed of seeds) {
  const o = { seed, teamA: by(a), teamB: by(b), cfg, duration: 'standard', fxLevel: 1 };
  const s3 = JSON.stringify(V3.summary(V3.simulate(o))), sC = E.simulate(Object.assign({}, o, { ruleset: 'classic' }));
  cTot++; if (s3 === JSON.stringify(E.summary(sC))) classicSame++; else bad.push(['classic-diff', a, b, seed]);
  const fo = Object.assign({}, o, { ruleset: 'fusion', fbIntensity: 'normal', goalAdv: true });
  const f1 = E.simulate(fo), f2 = E.simulate(fo); fTot++;
  const j1 = JSON.stringify(E.summaryV4(f1)), j2 = JSON.stringify(E.summaryV4(f2));
  const fev = w => w.events.filter(e => e.type >= 40).map(e => [e.k, e.type, e.a, e.b, e.c].join(':')).join('|');
  if (j1 === j2 && fev(f1) === fev(f2)) fusDet++; else bad.push(['fusion-nondet', a, b, seed]);
  const F = E.summaryV4(f1).football; agg.goals.push(F.goals.join('-')); agg.shots += F.shots[0] + F.shots[1]; agg.onT += F.onTarget[0] + F.onTarget[1]; agg.saves += F.saves[0] + F.saves[1];
  agg.passes += F.passes[0] + F.passes[1]; agg.passAtt += F.passAtt[0] + F.passAtt[1]; agg.inter += F.intercepts[0] + F.intercepts[1]; agg.steals += F.steals[0] + F.steals[1]; agg.posts += F.posts[0] + F.posts[1]; agg.wide += F.wide[0] + F.wide[1];
  agg.dur.push(+(f1.endT - 2.2).toFixed(1)); const gs = F.goals[0] + F.goals[1]; if (!gs) agg.zeroGoal++; if (gs >= 2) agg.multiGoal++; if (f1.winner === sC.winner) agg.sameWinnerAsClassic++;
  // integrity: each GOAL event == one shot with result 'goal', goals count matches, scorer side attacked the right goal
  const goalsEv = f1.events.filter(e => e.type === E.EV.GOAL), shotsGoal = f1.fb.shots.filter(s => s.result === 'goal');
  if (goalsEv.length !== F.goals[0] + F.goals[1] || shotsGoal.length !== goalsEv.length) bad.push(['goal-count', a, b, seed]);
  for (const g of goalsEv) { const sideOk = g.b === f1.units[g.a].side, yOk = g.b === 0 ? g.y === E.GOAL.yTop : g.y === E.GOAL.yBot, xOk = g.x > E.GOAL.x0 && g.x < E.GOAL.x1; if (!sideOk || !yOk || !xOk) bad.push(['goal-geom', g]); }
  if (f1.fb.ball.state !== 'DEAD' || f1.fb.buff[0] > 0 || f1.fb.buff[1] > 0) bad.push(['end-state', a, b, seed]);
}
console.log(`Classic V4 == V3 engine: ${classicSame}/${cTot}   Fusion same-seed repeat identical: ${fusDet}/${fTot}   (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
console.log('Fusion per match avg:', JSON.stringify({ shots: (agg.shots / fTot).toFixed(1), onTarget: (agg.onT / fTot).toFixed(1), saves: (agg.saves / fTot).toFixed(1), passes: (agg.passes / fTot).toFixed(1) + '/' + (agg.passAtt / fTot).toFixed(1), intercepts: (agg.inter / fTot).toFixed(1), steals: (agg.steals / fTot).toFixed(1), posts: agg.posts, wide: agg.wide }));
console.log('goals:', agg.goals.join(' '), '| zero-goal', agg.zeroGoal, 'multi-goal', agg.multiGoal, '| battle s', Math.min(...agg.dur), '-', Math.max(...agg.dur), '| same winner as Classic', agg.sameWinnerAsClassic + '/' + fTot);
console.log('BAD', JSON.stringify(bad).slice(0, 800));
