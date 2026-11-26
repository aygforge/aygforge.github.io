const R = require('./rload.js'); const E = globalThis.FWEngine;
const v = R.Validation.run(); console.log('validation', v.ok, v.checks.filter(c => !c.ok).map(c => c.name));
function playLevel(save, n, opts) {
  opts = opts || {};
  const run = R.Run.start(save, n); if (!run) return null;
  const rng = new E.Rng(opts.pickSeed || 7);
  while (save.run && save.run.phase !== 'over') {
    const r = save.run;
    if (r.phase === 'draft') { const off = r.draft.offer; R.Run.pick(save, off[rng.int(off.length)]); continue; }
    if (r.phase === 'ready') { const snap = R.Run.beginWave(save); const t0 = Date.now(); const w = R.Battle.simulate(snap, opts.focus === false ? [] : autoFocus(snap)); const sum = R.Battle.result(w); const o = R.Run.endWave(save, sum);
      if (opts.log) console.log(' L' + n + ' W' + (snap.wave + 1), o, sum.result.reason, 'alive', sum.alive.join('/'), 'goals', sum.goals.join('-'), 't', sum.result.battleT, (Date.now() - t0) + 'ms', JSON.stringify(sum.procs)); continue; }
    if (r.phase === 'clear') { R.Run.afterClear(save); continue; }
  }
  return R.Run.finish(save);
}
// simple scripted Tactical Focus a casual player would use (2 per wave, recorded as normal input ticks)
function autoFocus(snap) {
  const k = s => Math.round((s + 2.2) * 60);
  const f = snap.obj.type === 'ko' ? ['ko', 'ko'] : snap.obj.type === 'goal' ? ['goal', snap.final ? 'goal' : 'survive'] : ['ko', 'survive'];
  return [{ k: k(snap.obj.type === 'ko' ? 20 : 10), f: f[0] }, { k: k(34), f: f[1] }];
}
module.exports = { playLevel, autoFocus };
if (require.main === module) {
  const s = R.Save.defaults(); s.salt = 12345;
  for (let i = 0; i < 3; i++) { const res = playLevel(s, s.highest + 1, { log: true }); console.log(res.kind, res.level, res.coins, res.medal || res.reason); }
}
