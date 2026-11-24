// How many War Commands can an active player really afford? (greedy bot on side 0, AI rival, real battles)
const A = require('./load.js'); const E = FWEngine, B = A.Battle, M = E.MAY;
const s = A.Save.fresh('ENG_ARSENAL', 4711); for (const k of A.Upgrades.KEYS) s.upgrades[k] = 6;
const snap = B.snapshot(s, 'league'); let cmds = 0, dur = 0, n = 0, gained = 0;
for (let seed = 300; seed < 308; seed++) {
  const w = E.createWorld(B.worldOpts(Object.assign({}, snap, { seed }), { headless: true }));
  while (w.phase !== 'ended' && w.t < 90) {
    if (w.phase === 'battle' && w.tick % 20 === 0) {
      const car = M.carrier(w, 0), opp = M.carrier(w, 1);
      if (car && M.canUse(w, 0, 'kick')) E.mayCommand(w, 'kick', 180, E.GOAL.yTop);
      else if (opp && M.canUse(w, 0, 'iron')) E.mayCommand(w, 'iron', opp.x, opp.y + 20);
      else if (M.canUse(w, 0, 'rush')) E.mayCommand(w, 'rush', w.fb.ball.x, w.fb.ball.y);
    }
    E.step(w);
  }
  const m = E.maySummary(w).sides[0]; cmds += m.commands; dur += w.endT - E.TL.battleStart; gained += m.energyGained; n++;
}
console.log('greedy player: ' + (cmds / n).toFixed(1) + ' commands / battle, avg battle ' + (dur / n).toFixed(1) + ' s, ' + (cmds / n / (dur / n) * 50).toFixed(1) + ' per 50 s, event energy ' + (gained / n).toFixed(0));
