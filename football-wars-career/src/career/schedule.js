// League fixtures (circle method), cup brackets, calendar. Pure functions over ids.
import { SEASON_WEEKS } from '../data/balance.js';

export const isDoubleRound = div => div <= 5;
export const LEAGUE_MATCHES = div => isDoubleRound(div) ? 38 : 19;
export const PLAYOFF_WEEK = SEASON_WEEKS + 1;
export const CUP_DEFS = {
  DC: { name: 'Division Cup', rounds: [['Preliminary', 3], ['Round of 16', 9], ['Quarter-final', 15], ['Semi-final', 25], ['Final', 35]] },
  GC: { name: 'Grand Club Cup', rounds: [['Round of 64', 5], ['Round of 32', 11], ['Round of 16', 17], ['Quarter-final', 23], ['Semi-final', 29], ['Final', 37]] },
  CT: { name: 'Champions Tournament', rounds: [['Round of 16', 7], ['Quarter-final', 19], ['Semi-final', 27], ['Final', 33]] }
};

// Berger round robin: 19 rounds of 10 games; home/away balanced (each club hosts 9 or 10).
export function roundRobin(ids) {
  const n = ids.length, rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const games = [];
    for (let i = 0; i < n / 2; i++) {
      const a = (r + i) % (n - 1), b = i === 0 ? n - 1 : (n - 1 - i + r) % (n - 1);
      const homeA = i === 0 ? r % 2 === 0 : i % 2 === 0;
      games.push(homeA ? [ids[a], ids[b]] : [ids[b], ids[a]]);
    }
    rounds.push(games);
  }
  return rounds;
}
export function leagueFixtures(season, div, ids) {
  const rr = roundRobin(ids); const out = [];
  const push = (week, round, i, h, a) => out.push({ id: `S${season}-L${div}-R${round + 1}-${i}`, season, week, comp: 'L', div, round, home: h, away: a, done: false, res: null });
  if (isDoubleRound(div)) {
    rr.forEach((g, r) => g.forEach(([h, a], i) => push(r + 1, r, i, h, a)));
    rr.forEach((g, r) => g.forEach(([h, a], i) => push(r + 20, r + 19, i, a, h)));
  } else rr.forEach((g, r) => g.forEach(([h, a], i) => push(2 * (r + 1), r, i, h, a)));
  return out;
}
// standard seeded bracket order, e.g. 16 -> [1,16,8,9,5,12,4,13,3,14,6,11,7,10,2,15]
export function bracketOrder(n) {
  let o = [1, 2];
  while (o.length < n) { const m = o.length * 2 + 1; o = o.flatMap(x => [x, m - x]); }
  return o;
}
// slot = {club} | {from:[roundIndex, tieIndex]}
function knockout(size, firstSlots) {
  const order = bracketOrder(size); const r0 = [];
  for (let i = 0; i < size; i += 2) r0.push({ a: firstSlots[order[i] - 1], b: firstSlots[order[i + 1] - 1] });
  const rounds = [r0];
  while (rounds[rounds.length - 1].length > 1) {
    const prev = rounds[rounds.length - 1], ri = rounds.length - 1, nx = [];
    for (let i = 0; i < prev.length; i += 2) nx.push({ a: { from: [ri, i] }, b: { from: [ri, i + 1] } });
    rounds.push(nx);
  }
  return rounds;
}
export function makeCup(season, kind, key, seeds, extra = {}) {
  const def = CUP_DEFS[kind]; let ties;
  if (kind === 'DC') {
    // seeds 1-12 bye; prelim: 13v20, 14v19, 15v18, 16v17; winners take seeds 13-16 in the round of 16
    const prelim = [[12, 19], [13, 18], [14, 17], [15, 16]].map(([x, y]) => ({ a: { club: seeds[x] }, b: { club: seeds[y] } }));
    const slots16 = seeds.slice(0, 12).map(c => ({ club: c })).concat([0, 1, 2, 3].map(i => ({ from: [-1, i] }))); // shifted to the prelim round below
    const ko = knockout(16, slots16).map(r => r.map(t => ({ a: shift(t.a), b: shift(t.b) })));
    ties = [prelim].concat(ko);
  } else ties = knockout(seeds.length, seeds.map(c => ({ club: c })));
  const rounds = ties.map((ts, i) => ({ name: def.rounds[i][0], week: def.rounds[i][1], ties: ts.map((t, j) => ({ ...t, fid: `S${season}-${key}-R${i + 1}-${j}`, winner: null })) }));
  return { key, kind, name: extra.name || def.name, div: extra.div || null, season, seeds: seeds.slice(), rounds, champion: null, prize: extra.prize || 0 };
}
function shift(s) { return s.from ? { from: [s.from[0] + 1, s.from[1]] } : s; } // KO rounds follow the prelim round in DC
export function slotClub(cup, slot) {
  if (slot.club) return slot.club;
  const t = cup.rounds[slot.from[0]].ties[slot.from[1]]; return t.winner || null;
}
export const weeksOfCup = kind => CUP_DEFS[kind].rounds.map(r => r[1]);
