// Bisection tuner for the per-Episode enemy strength constant EP_K (development tool; results are pasted into rogue_core.js).
// Target: the reference Training profile (tools/rogue_calibrate.js) finishes Normal Survival levels with ~TARGET survivors.
const R = require('./rload.js'), D = globalThis.FWCampaignData;
const { playLevel } = require('./rogue_smoke.js'); const { refTraining } = require('./rogue_calibrate.js');
const ep = +process.argv[2], TARGET = +(process.argv[3] || 50), seeds = +(process.argv[4] || 5);
const lv = D.LEVELS.filter(l => l.ep === ep && l.kind === 'normal' && l.mission === 'survival' && !l.soft && !l.hard).map(l => l.level);
const pick = [lv[0], lv[Math.floor(lv.length / 2)], lv[lv.length - 1]];
function evalK(k) {
  R.EP_K[ep - 1] = k; let s = 0, n = 0;
  for (const l of pick) for (let i = 0; i < seeds; i++) {
    const save = R.Save.defaults(); save.salt = 500 + i * 31; save.training = refTraining(l, 0.5); save.highest = l - 1; for (let x = 1; x < l; x++) save.completed[x] = {};
    save.leaders = globalThis.FWLeaders.LEADERS.filter(x => x.unlock < l).map(x => x.id); save.cards = globalThis.FWCards.CARDS.filter(c => c.unlock < l).map(c => c.id);
    const r = playLevel(save, l, { pickSeed: 9 + i }); s += r.kind === 'win' ? r.survivors : 0; n++;
  }
  return s / n;
}
let lo = 0.6, hi = 3.2;
for (let it = 0; it < 7; it++) { const m = (lo + hi) / 2, v = evalK(m); if (v > TARGET) lo = m; else hi = m; }
console.log('E' + ep, 'K', ((lo + hi) / 2).toFixed(3), 'levels', pick.join(','));
