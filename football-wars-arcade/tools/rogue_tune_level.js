// Bisection on one level's LEVEL_ADJ (development tool). usage: node tools/rogue_tune_level.js <level> <targetWinRate> [seeds]
const R = require('./rload.js');
const { playLevel } = require('./rogue_smoke.js'); const { refTraining } = require('./rogue_calibrate.js');
const l = +process.argv[2], target = +(process.argv[3] || 0.6), seeds = +(process.argv[4] || 8);
function evalF(f) {
  R.LEVEL_ADJ[l] = f; let w = 0, sv = 0;
  for (let i = 0; i < seeds; i++) {
    const save = R.Save.defaults(); save.salt = 700 + i * 19; save.training = refTraining(l, 0.5); save.highest = l - 1; for (let x = 1; x < l; x++) save.completed[x] = {};
    save.leaders = globalThis.FWLeaders.LEADERS.filter(x => x.unlock < l).map(x => x.id); save.cards = globalThis.FWCards.CARDS.filter(c => c.unlock < l).map(c => c.id);
    const r = playLevel(save, l, { pickSeed: 5 + i }); if (r.kind === 'win') { w++; sv += r.survivors; }
  }
  return [w / seeds, w ? sv / w : 0];
}
let lo = +(process.env.LO || 0.5), hi = +(process.env.HI || 1.3);
for (let it = 0; it < 6; it++) { const m = (lo + hi) / 2, v = evalF(m); if (v[0] < target) hi = m; else lo = m; }
const f = (lo + hi) / 2, v = evalF(f);
console.log(l, 'ADJ', f.toFixed(3), 'win', v[0].toFixed(2), 'surv', v[1].toFixed(0));
