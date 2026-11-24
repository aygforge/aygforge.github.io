// formation fairness probe: same squad / seeds, only the formation (and its tactic mapping) changes
const A = require('./load.js'); const B = A.Battle;
const map = JSON.parse(process.argv[2] || '{}'), div = +(process.argv[3] || 10), lvl = +(process.argv[4] || 1), N = +(process.argv[5] || 38);
for (const f in map) A.FORM_CAL[f] = map[f];
const out = {};
for (const f of ['balanced', 'attack', 'fortress']) {
  const s = A.Save.fresh({ name: 'Probe FC', short: 'PFC', shape: 'shield', symbol: 0, primary: '#d62839', secondary: '#f5f5f5' }, 777, f);
  for (const k of A.Upgrades.KEYS) s.upgrades[k] = lvl;
  if (div !== 10) { const up = s.divisions[div - 1], low = s.divisions[9]; const x = up[19]; up[19] = s.club; low[low.indexOf(s.club)] = x; s.division = div; s.highestDiv = div; A.League.newSeason(s, div); }
  let w = 0, d = 0; for (let i = 0; i < N; i++) { s.league.round = i % 19; s.stats.battles = i; const sn = B.snapshot(s, 'league'); const r = B.result(B.simulate(B.worldOpts(sn, { headless: true }))); if (r.won) w++; d += r.battleSeconds; }
  out[f] = (w / N).toFixed(2) + ' (' + (d / N).toFixed(0) + 's)';
}
console.log(JSON.stringify(map), 'D' + div, 'L' + lvl, JSON.stringify(out));
