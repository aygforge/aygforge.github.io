// New career: 199 AI clubs (194 anonymised V4 profiles + 5 new) + the player's club = 200 clubs in 10 divisions.
import { PROFILES } from '../data/profiles.js';
import { makeNameFactory } from '../data/names.js';
import { Rng, mix32, clamp, round1 } from './util.js';
import { ROLES, DIV_BASE, divSpread, START_CREDITS, START_QUALITY, FACILITIES, SPONSOR, ARCH_PROFILE, AI_PROFILES, PROFILE_TACTIC,
  SAVE_VERSION, ENGINE_VERSION, AI_POLICY_VERSION, STADIUM_CAP, MAX_ACTIVE_STARS, DEFAULT_FORMATION } from '../data/balance.js';
import { makeStar } from './stars.js';

export const PLAYER_ID = 'PLAYER';
const ATTRS = ['attack', 'defense', 'speed', 'pressing', 'stamina', 'teamwork', 'physical', 'technique', 'goalkeeping', 'finishing'];
const ARCH_LIST = ['high_press', 'counter', 'wing_attack', 'possession', 'physical', 'defensive_block'];

// V4 profiles use 5 captains per 100: career clubs always field exactly one captain.
export function formationFromProfile(roles) {
  const f = { ...roles }; const extra = (f.captain || 1) - 1; f.captain = 1;
  f.defender += Math.ceil(extra / 2); f.support += Math.floor(extra / 2);
  const tot = ROLES.reduce((n, r) => n + f[r], 0); f.defender += 100 - tot;
  return f;
}
const PROFILE_ROLES = {
  high_press: { striker: 20, winger: 22, playmaker: 15, defender: 22, goalkeeper: 8, support: 8, captain: 5 },
  counter: { striker: 22, winger: 24, playmaker: 10, defender: 24, goalkeeper: 8, support: 8, captain: 4 },
  wing_attack: { striker: 16, winger: 30, playmaker: 12, defender: 22, goalkeeper: 8, support: 8, captain: 4 },
  possession: { striker: 16, winger: 16, playmaker: 24, defender: 22, goalkeeper: 8, support: 10, captain: 4 },
  physical: { striker: 18, winger: 14, playmaker: 10, defender: 34, goalkeeper: 8, support: 12, captain: 4 },
  defensive_block: { striker: 14, winger: 12, playmaker: 12, defender: 38, goalkeeper: 10, support: 10, captain: 4 }
};
// AI formations: the standard shape with a small archetype flavour (the raw V4 role tables, e.g. 40 defenders and
// 10 keepers, proved far too weak in tests: they lost almost every match against the default distribution).
const FLAVOUR = { high_press: { striker: 2, winger: 1, defender: -3 }, physical: { defender: 2, support: 1, playmaker: -3 }, defensive_block: { defender: 3, striker: -2, winger: -1 },
  counter: { winger: 3, defender: -2, playmaker: -1 }, wing_attack: { winger: 4, playmaker: -2, defender: -2 }, possession: { playmaker: 3, defender: -2, winger: -1 } };
export function aiFormation(arch, r) {
  const f = { ...DEFAULT_FORMATION }; const fl = FLAVOUR[arch] || {};
  for (const k in fl) f[k] += fl[k];
  // a little club-to-club variety that keeps 100 players and one captain
  const movable = ['striker', 'winger', 'playmaker', 'defender', 'support'];
  for (let i = 0; i < 2; i++) { const a = r.pick(movable), b = r.pick(movable); if (a !== b && f[b] > 6) { f[a]++; f[b]--; } }
  return f;
}
export function newFacilities(lvl) { const f = {}; for (const k of FACILITIES) f[k] = lvl; return f; }

function aiClub(r, nf, id, prof, power, div) {
  const nm = nf.club(); const kit = nf.kit();
  const form = aiFormation(prof.a, r);
  // role quality follows the attribute shape a little (attack-minded clubs have better forwards etc.)
  const at = prof.at; const mean = ATTRS.reduce((n, k) => n + at[k], 0) / ATTRS.length;
  const roleBias = { striker: (at.finishing + at.attack) / 2, winger: (at.speed + at.attack) / 2, playmaker: (at.technique + at.teamwork) / 2, defender: (at.defense + at.physical) / 2,
    goalkeeper: at.goalkeeping, support: (at.stamina + at.teamwork) / 2, captain: (at.teamwork + at.defense) / 2 };
  const groups = ROLES.map((role, i) => ({ id: id + '-g' + i, role, count: form[role], q: round1(clamp(power + (roleBias[role] - mean) * 0.15 + r.range(-0.8, 0.8), 15, 99)) }));
  const profile = ARCH_PROFILE[prof.a] || AI_PROFILES[r.int(AI_PROFILES.length)];
  const facLvl = clamp(Math.round((11 - div) * 0.55), 1, 6);
  const fac = newFacilities(1); for (const k of FACILITIES) fac[k] = clamp(facLvl + r.irange(-1, 0), 1, 6);
  return {
    id, name: nm.name, short: nm.short, city: nm.city, stadium: nm.city + ' Park', kit, ai: true, aiProfile: profile, archetype: prof.a,
    division: div, attributes: { ...at }, aggression: prof.ag, groups, stars: [], activeStars: [], tactic: PROFILE_TACTIC[profile], style: 'balanced',
    budget: Math.round(SPONSOR[div] * r.range(5, 9)), fac, fans: Math.round(STADIUM_CAP[fac.stadium - 1] * r.range(0.7, 1.05)), rep: clamp(Math.round(95 - div * 8 + r.range(-4, 4)), 5, 100),
    sponsor: 'guaranteed', advance: { usedSeason: 0, debt: 0 }, form: [], lastTactic: null, trophies: [], history: [], prevRank: null
  };
}
export function playerClub(input, formation) {
  const groups = ROLES.map((role, i) => ({ id: PLAYER_ID + '-g' + i, role, count: formation[role], q: START_QUALITY }));
  const at = {}; for (const k of ATTRS) at[k] = 70;
  return {
    id: PLAYER_ID, name: input.name, short: input.short, city: input.city, stadium: input.stadium, kit: { primary: input.primary, secondary: input.secondary, pattern: input.pattern, crest: input.crest },
    ai: false, aiProfile: 'balanced', archetype: 'possession', division: 10, attributes: at, aggression: 60, groups, stars: [], activeStars: [], tactic: 'total', style: 'balanced',
    budget: START_CREDITS, fac: newFacilities(1), fans: 420, rep: 5, sponsor: 'guaranteed', advance: { usedSeason: 0, debt: 0 }, form: [], lastTactic: null, trophies: [], history: [], prevRank: null
  };
}

export function createWorld(seed, input, formation) {
  const r = new Rng(mix32(seed, 'world'));
  const nf = makeNameFactory(mix32(seed, 'names'));
  nf.reserveClub(input.name);
  // 194 anonymised profiles + 5 new AI clubs generated on the same schema
  const profs = PROFILES.map((p, i) => ({ ...p, src: 'v4-' + i }));
  for (let k = 0; k < 5; k++) {
    const a = ARCH_LIST[(k * 2 + r.int(2)) % ARCH_LIST.length]; const at = {};
    for (const key of ATTRS) at[key] = Math.round(clamp(70 + r.normal() * 7, 50, 92));
    const pct = [0.12, 0.33, 0.52, 0.71, 0.9][k];
    const sortedP = PROFILES.map(x => x.p).sort((x, y) => y - x);
    profs.push({ p: sortedP[Math.floor(pct * (sortedP.length - 1))] + 0.5, a, at, sp: [], ag: Math.round(50 + r.range(0, 30)), src: 'new-' + k });
  }
  profs.sort((x, y) => y.p - x.p || (x.src < y.src ? -1 : 1));
  const clubs = {}, divisions = {};
  for (let d = 1; d <= 10; d++) divisions[d] = [];
  profs.forEach((p, i) => {
    const div = Math.min(10, Math.floor(i / 20) + 1);
    const j = i - (div - 1) * 20; const n = div === 10 ? 19 : 20;
    const power = DIV_BASE[div] + divSpread(div) * (1 - 2 * j / Math.max(1, n - 1));
    const id = 'C' + String(i + 1).padStart(3, '0');
    clubs[id] = aiClub(r, nf, id, p, power, div); clubs[id].origin = p.src;
    divisions[div].push(id);
  });
  const pc = playerClub(input, formation); clubs[pc.id] = pc; divisions[10].push(pc.id);
  // star pool
  const stars = {}; let sid = 1;
  const newStar = (o) => { const id = 'P' + String(sid++).padStart(4, '0'); const s = makeStar(r, { ...o, id, name: nf.person() }); stars[id] = s; return s; };
  const STAR_N = { 1: [4, 6], 2: [4, 5], 3: [3, 5], 4: [3, 4], 5: [2, 4], 6: [2, 3], 7: [1, 3], 8: [1, 2], 9: [0, 2], 10: [0, 1] };
  const RAR = ['rising', 'promising', 'elite', 'generational'];
  for (let d = 1; d <= 10; d++) for (const cid of divisions[d]) {
    const c = clubs[cid]; if (!c.ai) continue;
    const n = r.irange(STAR_N[d][0], STAR_N[d][1]);
    for (let k = 0; k < n; k++) {
      const age = r.irange(18, 33);
      const level = age <= 20 ? r.irange(1, 3) : age <= 26 ? r.irange(3, 10) : r.irange(8, 16);
      const role = r.pick(['striker', 'striker', 'winger', 'winger', 'playmaker', 'playmaker', 'defender', 'defender', 'goalkeeper', 'support', 'captain']);
      const s = newStar({ role, age, ovr: round1(DIV_BASE[d] + r.range(4, 13)), rarity: RAR[r.weighted([0.55, 0.3, 0.12, 0.03])], clubId: cid, level });
      c.stars.push(s.id); if (r.chance(0.12)) s.listed = true;
    }
    autoPickStars(c, stars);
  }
  // free agents spread over the divisions
  for (let k = 0; k < 30; k++) {
    const d = 1 + (k % 10); const age = r.irange(19, 32);
    newStar({ role: r.pick(ROLES), age, ovr: round1(DIV_BASE[d] + r.range(1, 8)), rarity: RAR[r.weighted([0.6, 0.3, 0.09, 0.01])], clubId: null, level: age <= 22 ? r.irange(1, 4) : r.irange(4, 12) });
  }
  return { clubs, divisions, stars, nextStar: sid };
}
export function autoPickStars(c, stars) {
  // best available stars of the club, never two captains
  const list = c.stars.map(id => stars[id]).filter(s => s && s.injured === 0).sort((a, b) => b.ovr - a.ovr || (a.id < b.id ? -1 : 1));
  const out = []; let cap = false;
  for (const s of list) { if (out.length >= MAX_ACTIVE_STARS) break; if (s.role === 'captain') { if (cap) continue; cap = true; } out.push(s.id); }
  c.activeStars = out;
}
export function newCareerState(seed, input, formation, slot) {
  const w = createWorld(seed, input, formation);
  return {
    format: 'fw-career', version: SAVE_VERSION, engine: ENGINE_VERSION, policy: AI_POLICY_VERSION, seed: seed >>> 0, slot: slot || 1, createdAt: new Date().toISOString(),
    playerId: PLAYER_ID, season: 1, week: 1, phase: 'season', ...w,
    fixtures: {}, cups: {}, lock: null, transfers: [], nextTransfer: 1, market: { key: null, packages: [], talks: {}, incoming: [] },
    scouting: { missions: [], known: {}, nextMission: 1 }, academy: [], news: [], ledger: [], history: { seasons: [], legends: [], bigWins: [], records: {} },
    replays: [], reports: [], actions: { key: null, left: 2 }, guards: {}, tutorial: { done: false, step: 0 }, settings: {}, startPower: {}
  };
}
