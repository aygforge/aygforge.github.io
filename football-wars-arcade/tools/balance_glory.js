// Targeted balance probe: player squad (training level, stars) vs the real rivals of a Division (with their AI stars + Powers).
const A = require('./load.js'); const E = FWEngine, B = A.Battle;
function probe(div, lvl, nStars, rarity, n, form) {
  const s = A.Save.fresh({ name: 'Probe FC', short: 'PFC', shape: 'shield', symbol: 0, primary: '#d62839', secondary: '#f5f5f5' }, 4000 + div, form || 'balanced');
  for (const k of A.Upgrades.KEYS) s.upgrades[k] = lvl;
  const pick = []; for (const d of A.Stars.defs) if (pick.length < nStars && d.rarity === rarity && !pick.some(p => p.role === d.role) && d.role !== 'captain') pick.push(d);
  for (const d of pick) { const r = A.Draft.ovrRange(div, d.rarity); s.stars[d.id] = { id: d.id, ovr: Math.round((r[0] + r[1]) / 2), adapted: 0, xp: 24, rarity: d.rarity }; s.active.push(d.id); }
  // move the player into the probed Division
  if (div !== 10) { const up = s.divisions[div - 1], low = s.divisions[9]; const x = up[19]; up[19] = s.club; low[low.indexOf(s.club)] = x; s.division = div; s.highestDiv = div; A.League.newSeason(s, div); }
  let w = 0, dur = 0, gl = 0, pw = 0;
  for (let i = 0; i < n; i++) { s.league.round = i % 19; s.stats.battles = i; const sn = B.snapshot(s, 'league'); const wd = B.simulate(B.worldOpts(sn, { headless: true })); const r = B.result(wd); if (r.won) w++; dur += r.battleSeconds; gl += r.goals[0] + r.goals[1]; pw += r.powers.sides[0].total + r.powers.sides[1].total; }
  return { div, lvl, stars: nStars + ' ' + rarity, form: form || 'balanced', power: A.Upgrades.power(s), win: (w / n).toFixed(2), avgSec: (dur / n).toFixed(1), goals: (gl / n).toFixed(2), powersPerMatch: (pw / n).toFixed(1) };
}
const rows = [];
rows.push(probe(10, 1, 0, 'common', 19));
rows.push(probe(10, 3, 1, 'common', 19));
rows.push(probe(10, 1, 0, 'common', 19, 'attack'));
rows.push(probe(10, 1, 0, 'common', 19, 'fortress'));
rows.push(probe(10, 12, 3, 'rare', 19));
rows.push(probe(6, 10, 2, 'rare', 19));
rows.push(probe(6, 16, 3, 'epic', 19));
rows.push(probe(1, 26, 3, 'epic', 19));
rows.push(probe(1, 30, 5, 'legendary', 19));
for (const r of rows) console.log(JSON.stringify(r));
