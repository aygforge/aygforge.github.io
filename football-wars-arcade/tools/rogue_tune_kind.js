// Bisection on KIND_F / KO_F (development tool). usage: node tools/rogue_tune_kind.js elite|boss|ko <targetWinRate> [seeds]
const R = require('./rload.js'), D = globalThis.FWCampaignData;
const { playLevel } = require('./rogue_smoke.js'); const { refTraining } = require('./rogue_calibrate.js');
const what = process.argv[2], target = +(process.argv[3] || 0.65), seeds = +(process.argv[4] || 3);
if (process.env.ELITE) R.KIND_F.elite = +process.env.ELITE;
const levels = D.EPISODES.map(e => D.LEVELS.find(l => l.ep === e.n && (what === 'ko' ? l.mission === 'ko' && l.kind === 'normal' : l.kind === what && l.mission === 'survival' && !l.hard))).filter(Boolean).map(l => l.level);
function evalF(f) {
  if (what === 'ko') R.setKO(f); else R.KIND_F[what] = f;
  let w = 0, n = 0;
  for (const l of levels) for (let i = 0; i < seeds; i++) {
    const save = R.Save.defaults(); save.salt = 900 + i * 13; save.training = refTraining(l, 0.5); save.highest = l - 1; for (let x = 1; x < l; x++) save.completed[x] = {};
    save.leaders = globalThis.FWLeaders.LEADERS.filter(x => x.unlock < l).map(x => x.id); save.cards = globalThis.FWCards.CARDS.filter(c => c.unlock < l).map(c => c.id);
    const r = playLevel(save, l, { pickSeed: 3 + i }); if (r.kind === 'win') w++; n++;
  }
  return w / n;
}
let lo = 0.4, hi = 1.0;
for (let it = 0; it < 6; it++) { const m = (lo + hi) / 2, v = evalF(m); console.error(what, m.toFixed(3), v.toFixed(2)); if (v < target) hi = m; else lo = m; }
console.log(what, 'F', ((lo + hi) / 2).toFixed(3), 'levels', levels.join(','));
