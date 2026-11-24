import { snapshot, coachPolicy } from '../src/battle/adapter.js';
import { runMatch } from '../src/battle/run.js';
import { testClub } from '../tests/helpers.mjs';
const N = +process.argv[2] || 40;
function rate(qa, qb, ta='total', tb='total', coach=true) {
  const A = testClub('AAA', qa, { tactic: ta, ai: true }), B = testClub('BBB', qb, { tactic: tb, ai: true, c1:'#1d3557' });
  let w = 0, t = 0, g=0, bt=0; const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const home = i % 2 === 0;
    const sa = snapshot(A, {}, 1, 1), sb = snapshot(B, {}, 1, 1);
    const job = { seed: 1000 + i * 7919, home: home ? sa : sb, away: home ? sb : sa, coach: coach ? [coachPolicy(A), coachPolicy(B)] : [null,null] };
    const r = runMatch(job);
    if ((r.winner === 0) === home) w++; bt += r.battleT; g += r.football.goals[0]+r.football.goals[1];
  }
  return { win: (w / N * 100).toFixed(0) + '%', ms: ((Date.now() - t0) / N).toFixed(0), bt: (bt/N).toFixed(1), goals:(g/N).toFixed(2) };
}
for (const gap of [0, 3, 5, 10, 20, 40]) console.log('gap', gap, JSON.stringify(rate(40 + gap, 40)));
for (const [a,b] of [['high_press','total'],['fortress','total'],['counter','total'],['high_press','counter'],['fortress','high_press'],['counter','fortress']]) console.log(a,'vs',b, JSON.stringify(rate(50,50,a,b)));
