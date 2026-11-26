// Calibration on the real engine: reference Training (from the real Coin economy) vs authored Episode waves.
// usage: node tools/rogue_calibrate.js <ep|all> [seeds] [EP_K overrides json]
const R = require('./rload.js'), D = globalThis.FWCampaignData, E = globalThis.FWEngine;
const { playLevel } = require('./rogue_smoke.js');
// reference career: clears each level on the 2nd attempt on average (one failed attempt after 1 cleared wave), Silver medal,
// spends everything on the cheapest Training stat.
function refTraining(level, failRate) {
  const tr = { attack: 1, defense: 1, speed: 1, technique: 1, stamina: 1 }; let coins = 0;
  for (let l = 1; l < level; l++) {
    const L = R.Progress.level(l);
    coins += R.Economy.win(L, 50, [], []).base * 1.05 + failRate * R.Economy.fail(L, 1).coins;
    for (;;) { let best = null; for (const s in tr) { const c = R.Training.cost(tr[s]); if (c != null && (!best || c < best.c || (c === best.c && tr[s] < tr[best.s]))) best = { s, c }; } if (!best || best.c > coins) break; coins -= best.c; tr[best.s]++; }
  }
  return tr;
}
module.exports = { refTraining };
if (require.main === module) {
  const arg = process.argv[2] || '1', seeds = +(process.argv[3] || 6), fail = +(process.env.FAIL || 0.5);
  if (process.argv[4]) { const o = JSON.parse(process.argv[4]); for (const k in o) R.EP_K[+k - 1] = o[k]; }
  const eps = arg === 'all' ? D.range(1, 10) : arg.split(',').map(Number);
  const pickLevels = ep => { const b = (ep - 1) * 20; const set = new Set([b + 1, b + 5, b + 10, b + 15, b + 19, b + 20]);
    D.LEVELS.filter(l => l.ep === ep && (l.kind === 'elite' || l.soft || l.hard)).slice(0, 3).forEach(l => set.add(l.level)); return [...set].sort((a, b) => a - b); };
  for (const ep of eps) {
    let line = 'E' + ep + ' K=' + R.EP_K[ep - 1] + ' |';
    for (const lv of pickLevels(ep)) {
      const tr = refTraining(lv, fail); let wins = 0, surv = 0, waves = 0;
      for (let s = 0; s < seeds; s++) {
        const save = R.Save.defaults(); save.salt = 1000 + s * 77; save.training = Object.assign({}, tr); save.highest = lv - 1;
        save.leaders = globalThis.FWLeaders.LEADERS.filter(x => x.unlock < lv).map(x => x.id);
        save.cards = globalThis.FWCards.CARDS.filter(c => c.unlock < lv).map(c => c.id);
        for (let l = 1; l < lv; l++) save.completed[l] = {};
        const res = playLevel(save, lv, { pickSeed: 31 + s });
        if (res.kind === 'win') { wins++; surv += res.survivors; } waves += res.run.waveLog.filter(w => w.outcome !== 'lose').length;
      }
      const L = R.Progress.level(lv);
      line += ` ${lv}${L.kind[0]}${L.mission[0]}${L.soft ? 's' : ''}${L.hard ? 'h' : ''}:${Math.round(wins / seeds * 100)}%/${wins ? Math.round(surv / wins) : 0}`;
    }
    const tr = refTraining((ep - 1) * 20 + 1, fail); line += ' | tr ' + Object.values(tr).join(',');
    console.log(line);
  }
}
