// Career club -> battle snapshot. Exactly 100 units, exactly one captain, at most 5 active stars.
// Stars REPLACE standard units (never added on top). Pure & deterministic; used by UI, workers and tests.
import { ROLES, MAX_ACTIVE_STARS, BATTLE_RULES, coachLevel, coachEvery, ENGINE_VERSION } from '../data/balance.js';
import { compileMod } from '../career/stars.js';
import { VARIANCE, ENGINE_CFG } from '../data/profiles.js';

const TAC_ARCH = { high_press: 'high_press', fortress: 'defensive_block', counter: 'counter', total: 'possession' };
const TAC_SPECIALS = { high_press: ['pressing_storm', 'high_line_interception'], fortress: ['iron_wall', 'last_line_save'], counter: ['counter_burst', 'quick_transition'], total: ['one_two_combo', 'precision_through_ball'] };

export function starAvailable(st, season, week) {
  if (!st || st.injured > 0) return false;
  if (st.eligible && (season < st.eligible.season || (season === st.eligible.season && week < st.eligible.week))) return false;
  return true;
}
// Build the 100-player match lineup. Returns {units:[{role,q,star?}], problems:[]}
export function buildLineup(club, stars, season, week) {
  const problems = [];
  const active = (club.activeStars || []).map(id => stars[id]).filter(s => s && s.clubId === club.id && starAvailable(s, season, week)).slice(0, MAX_ACTIVE_STARS);
  // expand standard groups into units (best quality first inside a role)
  const pool = {}; for (const r of ROLES) pool[r] = [];
  for (const g of club.groups) for (let i = 0; i < g.count; i++) pool[g.role].push(g.q);
  for (const r of ROLES) pool[r].sort((a, b) => b - a);
  const total = ROLES.reduce((n, r) => n + pool[r].length, 0);
  if (total < 100 - active.length) problems.push(`Only ${total} standard players registered.`);
  const starRole = {}; for (const r of ROLES) starRole[r] = active.filter(s => s.role === r);
  // exactly one captain: a captain star replaces the standard captain
  const capStars = starRole.captain;
  if (capStars.length > 1) { problems.push('Only one captain can play; extra captain stars benched.'); starRole.captain = capStars.slice(0, 1); }
  const stdCount = {}; for (const r of ROLES) stdCount[r] = pool[r].length;
  stdCount.captain = starRole.captain.length ? 0 : Math.min(1, pool.captain.length);
  // stars replace a standard of the same role when possible
  let need = 100 - ROLES.reduce((n, r) => n + starRole[r].length, 0);
  for (const r of ROLES) if (r !== 'captain') stdCount[r] = Math.max(0, stdCount[r] - starRole[r].length);
  let have = ROLES.reduce((n, r) => n + stdCount[r], 0);
  // trim reserves (drop lowest-quality surplus from the largest non-captain role)
  while (have > need) {
    let best = null; for (const r of ROLES) if (r !== 'captain' && r !== 'goalkeeper' && stdCount[r] > 0 && (!best || stdCount[r] > stdCount[best])) best = r;
    if (!best) best = 'goalkeeper';
    stdCount[best]--; have--;
  }
  // fill if short (stars of a role with no standards, etc.): borrow unused standards of any role
  if (have < need) {
    for (const r of ROLES) { if (r === 'captain') continue; while (have < need && stdCount[r] < pool[r].length - (r === 'captain' ? 0 : 0)) { stdCount[r]++; have++; } }
  }
  if (!starRole.captain.length && stdCount.captain !== 1) problems.push('No captain available.');
  const units = [];
  for (const r of ROLES) {
    for (const s of starRole[r]) units.push({ role: r, q: s.ovr, star: { id: s.id, name: s.name, sig: s.sig, mod: compileMod(s) } });
    for (let i = 0; i < stdCount[r]; i++) units.push({ role: r, q: pool[r][i] });
  }
  if (units.length !== 100) problems.push(`Lineup has ${units.length} players (needs exactly 100).`);
  const caps = units.filter(u => u.role === 'captain').length;
  if (caps !== 1) problems.push(`Lineup has ${caps} captains (needs exactly 1).`);
  return { units, problems, activeStars: active.map(s => s.id) };
}
export const lineupPower = units => Math.round(units.reduce((n, u) => n + u.q, 0) / Math.max(1, units.length) * 100) / 100;

// Career clubs keep their attribute *identity* but with softened extremes: V4 profiles amplified by the engine
// (x1.4 around the mean) made some archetypes (e.g. deep-block clubs with very low pace) hopeless in a league.
export const ATTR_SPREAD = 0.4;
export function careerAttributes(at) {
  const ks = Object.keys(at); const mean = ks.reduce((n, k) => n + at[k], 0) / ks.length; const out = {};
  for (const k of ks) out[k] = Math.round((70 + (at[k] - mean) * ATTR_SPREAD) * 10) / 10;
  return out;
}
// Full battle snapshot (plain JSON) — this is what the engine, the workers and replays consume.
export function snapshot(club, stars, season, week, opts = {}) {
  const L = buildLineup(club, stars, season, week);
  const tactic = opts.tactic || club.tactic || 'total';
  const roles = {}; for (const r of ROLES) roles[r] = 0; for (const u of L.units) roles[u.role]++;
  const power = lineupPower(L.units);
  return {
    clubId: club.id, problems: L.problems, activeStars: L.activeStars, tactic, style: opts.style || club.style || 'balanced',
    team: {
      id: club.id, name: club.name, short: club.short, type: 'club',
      visual: { primary_color: club.kit.primary, secondary_color: club.kit.secondary, pattern: club.kit.pattern, crest: club.kit.crest },
      battle_profile: { power_index: power, archetype: TAC_ARCH[tactic], attributes: careerAttributes(club.attributes), roles_per_100: roles, specials: TAC_SPECIALS[tactic], aggression: club.aggression || 60, variance: VARIANCE }
    },
    lineup: compactLineup(L.units)
  };
}
// run-length encoding keeps saved week snapshots small: {role,q,n} for standard units, {role,q,star} for stars
export function compactLineup(units) {
  const out = [];
  for (const u of units) {
    const last = out[out.length - 1];
    if (!u.star && last && !last.star && last.role === u.role && last.q === u.q) last.n++;
    else out.push(u.star ? { role: u.role, q: u.q, star: u.star } : { role: u.role, q: u.q, n: 1 });
  }
  return out;
}
export function expandLineup(lu) { const units = []; for (const e of lu) { if (e.star) units.push(e); else for (let i = 0; i < e.n; i++) units.push({ role: e.role, q: e.q }); } return units; }
// the player's assistant coach is as good as the managers of the division (minimum level 2)
export function coachPolicy(club) { const lvl = club.ai ? coachLevel(club.division) : Math.max(2, coachLevel(club.division)); return { level: lvl, profile: club.ai ? club.aiProfile : 'balanced', every: coachEvery(lvl) }; }

// engine options for a match. home side = 0.
export function matchOptions(snapA, snapB, seed, o = {}) {
  return {
    seed: seed >>> 0, teamA: snapA.team, teamB: snapB.team, cfg: ENGINE_CFG, duration: 'standard', ruleset: 'fusion', fbIntensity: 'normal', goalAdv: true,
    fxLevel: o.fxLevel == null ? 1 : o.fxLevel, headless: !!o.headless, noLog: !!o.noLog,
    career: { rules: BATTLE_RULES, teams: [{ tactic: snapA.tactic, style: snapA.style, lineup: expandLineup(snapA.lineup) }, { tactic: snapB.tactic, style: snapB.style, lineup: expandLineup(snapB.lineup) }],
      coach: o.coach || [null, null], commands: o.commands || [] }
  };
}
export const ENGINE_ID = ENGINE_VERSION;
