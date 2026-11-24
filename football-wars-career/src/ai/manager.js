// Season Management AI + Pre-Match AI for the 199 AI clubs.
// Same rules as the player: 2 actions per week, real prices, transfer windows, squad limits. No free money.
import { ROLES, FACILITIES, facCost, FAC_MAX, MAX_STARS, PROFILE_TACTIC, DIV_BASE, SPONSOR, MAX_ACTIVE_STARS } from '../data/balance.js';
import { Rng, mix32 } from '../career/util.js';
import { actionsLeft, packagesFor, buyPackage, trainGroup, trainCost, upgradeFacility, inWindow, askFor, trainStar, roleCount, signAtAsk } from '../career/management.js';
import { weeklyBreakdown, avgStandardQ, standardCount, takeAdvance, canAdvance } from '../career/economy.js';
import { autoPickStars } from '../career/world.js';
import { starValue, pendingSpecs, SPECS } from '../career/stars.js';

const PREF_ROLES = {
  aggressive: ['striker', 'winger', 'captain'], defensive: ['defender', 'goalkeeper', 'support'], counter: ['winger', 'striker', 'defender'],
  technical: ['playmaker', 'winger', 'support'], balanced: ['striker', 'playmaker', 'defender']
};
const FAC_PREF = { aggressive: ['training', 'stadium', 'fans'], defensive: ['training', 'medical', 'stadium'], counter: ['scout', 'training', 'academy'], technical: ['academy', 'training', 'scout'], balanced: ['training', 'stadium', 'academy'] };

export function aiWeek(S, c) {
  const r = new Rng(mix32(S.seed, 'ai', S.season, S.week, c.id));
  const weekly = weeklyBreakdown(S, c).net;
  const reserve = Math.max(SPONSOR[c.division] * 2, -weekly * 6);
  // emergency: negative budget -> sponsor advance (once per season) and sell the most expensive star
  if (c.budget < 0) { if (canAdvance(S, c)) takeAdvance(S, c); const exp = c.stars.map(id => S.stars[id]).sort((a, b) => b.wage - a.wage)[0]; if (exp && exp.lockSeason !== S.season) exp.listed = true; }
  // free choices: specialisations, active stars
  for (const id of c.stars) { const s = S.stars[id]; while (pendingSpecs(s) > 0) s.specs.push(SPECS[s.role][r.int(3)].id); }
  let guard = 0;
  while (actionsLeft(S, c) > 0 && guard++ < 6) {
    const opts = [];
    const spare = c.budget - reserve;
    if (inWindow(S) && c.stars.length < MAX_STARS && spare > 0) {
      const t = bestStarTarget(S, c, spare, r);
      if (t) opts.push({ u: 0.9 + (PREF_ROLES[c.aiProfile].includes(t.role) ? 0.2 : 0), run: () => signAtAsk(S, c, t.id, 1 + r.int(3)).ok });
    }
    if (inWindow(S) && spare > 0) {
      const pk = packagesFor(S, c).filter(p => p.price <= spare * 0.6 && p.q > lowestQ(c, p.role) + 1.5 && roleCount(c, p.role) >= p.count).sort((a, b) => (b.q - lowestQ(c, b.role)) * b.count / b.price - (a.q - lowestQ(c, a.role)) * a.count / a.price)[0];
      if (pk) opts.push({ u: 0.7 + r.next() * 0.2, run: () => buyPackage(S, c, pk, 'replace').ok });
    }
    if (c.budget - trainCost(c) > reserve * 0.5) {
      const pref = PREF_ROLES[c.aiProfile];
      const g = c.groups.slice().sort((a, b) => (a.q - (pref.includes(a.role) ? 1.5 : 0)) * 1000 - (b.q - (pref.includes(b.role) ? 1.5 : 0)) * 1000 - (b.count - a.count))[0];
      if (g) opts.push({ u: 0.6 + r.next() * 0.25, run: () => trainGroup(S, c, g.id).ok });
    }
    const facs = FAC_PREF[c.aiProfile].concat(FACILITIES).filter(f => c.fac[f] < FAC_MAX && c.fac[f] < 7 - Math.ceil(c.division / 2));
    const f = facs.find(f => facCost(f, c.fac[f]) < spare * 0.5);
    if (f) opts.push({ u: 0.55 + r.next() * 0.3, run: () => upgradeFacility(S, c, f).ok });
    const young = c.stars.map(id => S.stars[id]).filter(s => s.pot - s.ovr > 4).sort((a, b) => (b.pot - b.ovr) - (a.pot - a.ovr))[0];
    if (young && c.budget - trainCost(c) > reserve * 0.5) opts.push({ u: 0.45 + r.next() * 0.3, run: () => trainStar(S, c, young.id).ok });
    if (!opts.length) break;
    opts.sort((a, b) => b.u - a.u);
    let done = false;
    for (const o of opts) { if (o.run()) { done = true; break; } }
    if (!done) break;
  }
  autoPickStars(c, S.stars);
  // AI transfer listings (surplus / old / expensive stars)
  if (S.week === 1 || S.week === 21) for (const id of c.stars) { const s = S.stars[id]; if (s.lockSeason === S.season) continue; s.listed = s.age >= 31 ? r.chance(0.5) : c.stars.length > 5 ? r.chance(0.3) : r.chance(0.08); }
}
const lowestQ = (c, role) => { const g = c.groups.filter(x => x.role === role); return g.length ? Math.min(...g.map(x => x.q)) : 0; };
function bestStarTarget(S, c, spare, r) {
  const power = avgStandardQ(c);
  const pool = Object.values(S.stars).filter(s => !s.academy && s.clubId !== c.id && (s.clubId === null || s.listed) && (s.clubId === null || S.clubs[s.clubId].ai) && s.ovr > power + 3 && s.age <= 32);
  let best = null, bs = -1e9;
  for (const s of pool) {
    const a = askFor(S, c, s); if (a.refuses || a.fee > spare || a.wage > SPONSOR[c.division] * 0.25) continue;
    const sc = (s.ovr - power) * 10 + (s.pot - s.ovr) * 2 - a.fee / 100 - a.wage + r.next() * 5;
    if (sc > bs) { bs = sc; best = s; }
  }
  return best;
}
// ---- Pre-Match AI: tactic from profile; better managers read the opponent's recent visible tactics ----
const COUNTER_TO = { high_press: 'fortress', fortress: 'total', total: 'high_press', counter: 'high_press' };
export function aiPrepare(S, c, opp) {
  const lvl = 11 - c.division;
  let tactic = PROFILE_TACTIC[c.aiProfile];
  const seen = opp.lastTactic; // visible: what the opponent used in its previous match
  if (lvl >= 5 && seen) {
    const r = new Rng(mix32(S.seed, 'prep', S.season, S.week, c.id));
    if (r.next() < 0.25 + lvl * 0.06) tactic = COUNTER_TO[seen] || tactic;
  }
  c.tactic = tactic; c.style = avgStandardQ(c) >= avgStandardQ(opp) + 2 ? 'attack' : avgStandardQ(c) <= avgStandardQ(opp) - 3 ? 'defend' : 'balanced';
  autoPickStars(c, S.stars);
}
export { standardCount, MAX_ACTIVE_STARS, ROLES, DIV_BASE };
