const E = require('../src/engine.js');
const db = require('../data/football_wars_master_2026_27.json'); const cfg = require('../data/battle_engine_config.json');
const all = [...db.clubs, ...db.national_teams]; const r = new E.Rng(7); let n = 0, found = 0, maxT = 0, tb = 0;
for (let i = 0; i < 400 && found < 6; i++) {
  const a = all[r.int(all.length)], b = all[r.int(all.length)]; if (a === b) continue;
  const w = E.simulate({ seed: r.int(2 ** 31), teamA: a, teamB: b, cfg, duration: ['short','standard','long'][i%3] }); n++;
  maxT = Math.max(maxT, w.endT + w.outroLen);
  if (w.rules.includes('SUDDEN_DEATH')) { found++; console.log('sudden', a.id, b.id, 'endBattle', (w.endT - 2.2).toFixed(2), 'total', (w.endT + w.outroLen).toFixed(2), w.rules.join(','), 'winner', w.winner, 'surv', w.teams[w.winner].alive); }
  if (w.tiebreak) tb++;
}
console.log('games', n, 'max total', maxT.toFixed(2), 'tiebreaks', tb);
