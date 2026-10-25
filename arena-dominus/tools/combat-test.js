// Combat balance probe: match length, class win rates, OVR effect, tactics effect.
const { load } = require('./load');
const AD = load();
const { WorldGenerator, GladiatorGenerator, CombatEngine, CLASS_IDS } = AD;
WorldGenerator.generate(12345);

function team(ovr, classes, tactic = 'balanced') {
  return { cid: 0, name: 't', tactic, glads: classes.map(c => GladiatorGenerator.create({ cls: c, ovr: ovr + AD.R.normal(0, 1), age: 26 })) };
}
function run(a, b, seed) {
  const m = CombatEngine.create({ seed, pressure: 0.3, headless: true, sides: [a, b] });
  return CombatEngine.run(m);
}
const rndCls = () => [0, 1, 2].map(() => CLASS_IDS[(Math.random() * 6) | 0]);
let T = [], why = {}, n = 600;
for (let i = 0; i < n; i++) {
  const r = run(team(55, rndCls()), team(55, rndCls()), i * 7 + 1);
  T.push(r.t); why[r.why] = (why[r.why] || 0) + 1;
}
T.sort((a, b) => a - b);
console.log('equal 55 vs 55: mean t', (T.reduce((a, b) => a + b, 0) / n).toFixed(1), 'median', T[n >> 1], 'p10', T[n * 0.1 | 0], 'p90', T[n * 0.9 | 0], why);

for (const d of [3, 6, 10, 15]) {
  let w = 0; const N = 400;
  for (let i = 0; i < N; i++) { const r = run(team(55 + d, rndCls()), team(55, rndCls()), i * 13 + 5); if (r.w === 0) w++; }
  console.log(`+${d} OVR win rate`, (w / N * 100).toFixed(1) + '%');
}
// class mirror: 3x class vs random
for (const c of CLASS_IDS) {
  let w = 0; const N = 300;
  for (let i = 0; i < N; i++) { const r = run(team(55, [c, c, c]), team(55, rndCls()), i * 17 + 3); if (r.w === 0) w++; }
  console.log('3x', c.padEnd(12), (w / N * 100).toFixed(1) + '%');
}
// single class presence
for (const c of CLASS_IDS) {
  let w = 0; const N = 400;
  for (let i = 0; i < N; i++) { const cl = rndCls(); cl[0] = c; const r = run(team(55, cl), team(55, rndCls()), i * 19 + 11); if (r.w === 0) w++; }
  console.log('with', c.padEnd(12), (w / N * 100).toFixed(1) + '%');
}
for (const tac of ['aggressive', 'defensive', 'focus', 'guard']) {
  let w = 0; const N = 500;
  for (let i = 0; i < N; i++) {
    const cl1 = rndCls(), cl2 = rndCls();
    const r = run(team(55, cl1, tac), team(55, cl2, 'balanced'), i * 23 + 7);
    if (r.w === 0) w++;
  }
  console.log('tactic', tac.padEnd(11), 'vs balanced', (w / N * 100).toFixed(1) + '%');
}
// determinism
const a = team(50, ['murmillo', 'retiarius', 'thraex']), b = team(52, ['secutor', 'dimachaerus', 'hoplomachus']);
const r1 = run(a, b, 999), r2 = run(a, b, 999);
console.log('deterministic', JSON.stringify(r1.units.map(u => u.rec)) === JSON.stringify(r2.units.map(u => u.rec)), r1.t, r1.w);
// perf
let t0 = Date.now();
for (let i = 0; i < 200; i++) run(team(55, rndCls()), team(55, rndCls()), i);
console.log('200 matches ms', Date.now() - t0);
