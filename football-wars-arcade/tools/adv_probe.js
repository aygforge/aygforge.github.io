// ARC_CFG power-gap probe: win rate of typical career squads per Division for a given advCap / advScale
const A = require('./load.js'); const B = A.Battle;
const cap = +(process.argv[2] || A.Battle.ARC_CFG.advCap), scale = +(process.argv[3] || A.Battle.ARC_CFG.advScale); A.Battle.ARC_CFG.advCap = cap; A.Battle.ARC_CFG.advScale = scale;
const cases = [[10, 1, 0, 'common'], [10, 4, 1, 'common'], [7, 9, 2, 'rare'], [6, 11, 3, 'rare'], [4, 16, 3, 'epic'], [1, 27, 4, 'epic']];
const out = [];
for (const [div, lvl, n, rar] of cases) {
  const s = A.Save.fresh({ name: 'Probe FC', short: 'PFC', shape: 'shield', symbol: 0, primary: '#d62839', secondary: '#f5f5f5' }, 900 + div, 'balanced');
  for (const k of A.Upgrades.KEYS) s.upgrades[k] = lvl;
  const pick = []; for (const d of A.Stars.defs) if (pick.length < n && d.rarity === rar && !pick.some(p => p.role === d.role) && d.role !== 'captain') pick.push(d);
  for (const d of pick) { const r = A.Draft.ovrRange(div, d.rarity); s.stars[d.id] = { id: d.id, ovr: Math.round((r[0] + r[1]) / 2), adapted: 0, xp: 24, rarity: d.rarity }; s.active.push(d.id); }
  if (div !== 10) { const up = s.divisions[div - 1], low = s.divisions[9]; const x = up[19]; up[19] = s.club; low[low.indexOf(s.club)] = x; s.division = div; s.highestDiv = div; A.League.newSeason(s, div); }
  let w = 0; const N = 19; for (let i = 0; i < N; i++) { s.league.round = i; s.stats.battles = i; const r = B.result(B.simulate(B.worldOpts(B.snapshot(s, 'league'), { headless: true }))); if (r.won) w++; }
  out.push('D' + div + ' L' + lvl + '+' + n + rar[0].toUpperCase() + ' pwr ' + A.Upgrades.power(s) + ': ' + (w / N).toFixed(2));
}
console.log('advCap ' + cap + ' scale ' + scale + ' | ' + out.join(' | '));
