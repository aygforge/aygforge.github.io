// Star players: identity, signature abilities, specialisations, growth, ageing, value.
import { RARITY, XP_NEXT, STAR_MAX_LEVEL, SPEC_LEVELS, STAR_FEE_RANGE, DIV_BASE } from '../data/balance.js';
import { clamp, round1 } from './util.js';

const Z = () => ({ hp: 0, dmg: 0, speed: 0, range: 0, armor: 0, crit: 0, stun: 0, heal: 0, healR: 0, aura: 0, shootAcc: 0, shootRange: 0, tackle: 0, pass: 0, save: 0, intercept: 0, assist: 0, carry: 0, drain: 0, kbImmune: false });

// Signature abilities: each is a real modifier set read by the battle engine.
export const SIGNATURES = {
  striker: [
    { id: 'clinical', name: 'Clinical Finish', desc: 'Much more accurate shots on goal; higher critical chance.', mod: { shootAcc: 0.30, crit: 0.05 } },
    { id: 'poacher', name: 'Box Poacher', desc: 'Shoots from much further out and hits harder.', mod: { shootRange: 0.35, dmg: 0.08 } }],
  winger: [
    { id: 'afterburner', name: 'Afterburner', desc: 'Explosive pace and much faster dribbling.', mod: { speed: 0.16, carry: 0.20 } },
    { id: 'crossmaster', name: 'Cross Master', desc: 'Passes are hard to intercept; feeds big assist bonuses.', mod: { pass: 0.35, assist: 0.25 } }],
  playmaker: [
    { id: 'visionary', name: 'Visionary', desc: 'Passes rarely get cut out; huge assist bonus for receivers.', mod: { pass: 0.45, assist: 0.35 } },
    { id: 'metronome', name: 'Metronome', desc: 'Calm on the ball: tough to dispossess, accurate shots.', mod: { carry: 0.12, shootAcc: 0.15, tackle: 0.04 } }],
  defender: [
    { id: 'wall', name: 'The Wall', desc: 'Heavy armour and cannot be knocked back.', mod: { armor: 0.12, kbImmune: true } },
    { id: 'reaper', name: 'Ball Reaper', desc: 'Tackles stun longer and win the ball far more often.', mod: { stun: 0.5, tackle: 0.10 } }],
  goalkeeper: [
    { id: 'catreflex', name: 'Cat Reflexes', desc: 'Saves many more shots on goal.', mod: { save: 0.14 } },
    { id: 'sweeper', name: 'Sweeper Keeper', desc: 'Long reach, cuts out passes, solid saves.', mod: { range: 0.3, intercept: 0.12, save: 0.06 } }],
  support: [
    { id: 'medic', name: 'Field Medic', desc: 'Heals much more over a wider radius.', mod: { heal: 0.6, healR: 0.35 } },
    { id: 'engine', name: 'Engine Room', desc: 'Never tires, intercepts passes, sturdier.', mod: { drain: -0.5, intercept: 0.10, hp: 0.08 } }],
  captain: [
    { id: 'rally', name: 'Rallying Cry', desc: 'Captain aura reaches much further.', mod: { aura: 0.45 } },
    { id: 'ironwill', name: 'Iron Will', desc: 'Very hard to bring down; strong tackles.', mod: { hp: 0.15, armor: 0.06, tackle: 0.05 } }]
};
// Specialisations (picked at levels 4, 9 and 15). Picking the same one again stacks.
export const SPECS = {
  striker: [{ id: 'finisher', name: 'Finisher', mod: { shootAcc: 0.12, crit: 0.02 } }, { id: 'presser', name: 'Presser', mod: { tackle: 0.05, speed: 0.05 } }, { id: 'teamplayer', name: 'Team Player', mod: { assist: 0.12, pass: 0.10 } }],
  winger: [{ id: 'pace', name: 'Pace', mod: { speed: 0.08, carry: 0.06 } }, { id: 'flank', name: 'Flank Attack', mod: { dmg: 0.07, range: 0.06 } }, { id: 'creativity', name: 'Creativity', mod: { assist: 0.12, pass: 0.10 } }],
  playmaker: [{ id: 'passmaster', name: 'Pass Master', mod: { pass: 0.15, assist: 0.08 } }, { id: 'tactician', name: 'Tactical Leader', mod: { aura: 0.15, hp: 0.05 } }, { id: 'ballwinner', name: 'Ball Winner', mod: { tackle: 0.06, intercept: 0.06 } }],
  defender: [{ id: 'wallspec', name: 'Defensive Wall', mod: { armor: 0.05, hp: 0.06 } }, { id: 'aggressive', name: 'Aggressive Tackle', mod: { dmg: 0.08, stun: 0.15 } }, { id: 'recovery', name: 'Ball Recovery', mod: { tackle: 0.07, intercept: 0.04 } }],
  goalkeeper: [{ id: 'reflex', name: 'Reflexes', mod: { save: 0.06 } }, { id: 'lastline', name: 'Last Line', mod: { hp: 0.10, armor: 0.04 } }, { id: 'sweeperspec', name: 'Sweeper', mod: { range: 0.12, intercept: 0.06 } }],
  support: [{ id: 'teamsupport', name: 'Team Support', mod: { heal: 0.20, healR: 0.10 } }, { id: 'endurance', name: 'Endurance', mod: { hp: 0.08, drain: -0.2 } }, { id: 'transition', name: 'Transition Play', mod: { speed: 0.05, pass: 0.10 } }],
  captain: [{ id: 'command', name: 'Command', mod: { aura: 0.15 } }, { id: 'defleader', name: 'Defensive Leader', mod: { armor: 0.05, hp: 0.05 } }, { id: 'momentum', name: 'Momentum', mod: { dmg: 0.07, speed: 0.04 } }]
};
export const sigOf = s => SIGNATURES[s.role].find(x => x.id === s.sig) || SIGNATURES[s.role][0];
export const specOf = (role, id) => SPECS[role].find(x => x.id === id);

// battle modifier set for a star (ovr influence is handled by the engine through unit quality)
export function compileMod(star) {
  const m = Z();
  const add = src => { for (const k in src) { if (k === 'kbImmune') m.kbImmune = m.kbImmune || src[k]; else m[k] += src[k]; } };
  add(sigOf(star).mod);
  // signature grows a little with level (up to +40% at level 20)
  const lv = 1 + 0.4 * (star.level - 1) / (STAR_MAX_LEVEL - 1);
  for (const k in m) if (k !== 'kbImmune') m[k] *= lv;
  for (const id of star.specs) { const s = specOf(star.role, id); if (s) add(s.mod); }
  for (const k in m) if (k !== 'kbImmune') m[k] = Math.round(m[k] * 1000) / 1000;
  return m;
}

export function makeStar(r, o) {
  // o: {id, name, role, age, ovr, rarity, clubId, level}
  const rar = RARITY[o.rarity];
  const pot = clamp(Math.round(o.ovr + r.range(rar.pot[0], rar.pot[1])), Math.ceil(o.ovr), 99);
  const level = o.level || 1;
  const s = { id: o.id, name: o.name, age: o.age, role: o.role, ovr: round1(o.ovr), pot, level, xp: 0, sig: r.pick(SIGNATURES[o.role]).id, specs: [], rarity: o.rarity,
    wage: 0, contract: r.irange(1, 3), clubId: o.clubId || null, listed: false, injured: 0, eligible: null, lockSeason: 0,
    stats: { apps: 0, goals: 0, kos: 0, assists: 0, saves: 0, wins: 0 }, career: [] };
  // pre-developed stars get their earned specialisations
  for (const L of SPEC_LEVELS) if (level >= L) s.specs.push(SPECS[s.role][r.int(3)].id);
  s.wage = wageFor(s, divOfOvr(s.ovr));
  return s;
}
export const divOfOvr = ovr => { for (let d = 1; d <= 10; d++) if (ovr >= DIV_BASE[d] + 8) return d; return 10; };
export const pendingSpecs = s => SPEC_LEVELS.filter(L => s.level >= L).length - s.specs.length;

export function wageFor(s, div) {
  // weekly wage: grows with quality; a few % of the weekly sponsor of the division the star belongs in
  // ~15–25% of the weekly sponsor of the division a star belongs in (≈40 C at quality 45, ≈600 C at 90)
  const base = 40 * Math.pow(1.062, s.ovr - 45);
  return Math.max(8, Math.round(base * (1 + Math.max(0, s.pot - s.ovr) / 120)));
}
export function starValue(s) {
  const d = divOfOvr(s.ovr - 6); const [lo, hi] = STAR_FEE_RANGE[d];
  const t = clamp((s.ovr - (DIV_BASE[d] - 2)) / 14, 0, 1);
  let v = lo + (hi - lo) * t;
  const ageF = s.age <= 21 ? 1.35 : s.age <= 24 ? 1.15 : s.age <= 28 ? 1.0 : s.age <= 31 ? 0.75 : 0.45;
  const potF = 1 + Math.max(0, s.pot - s.ovr) / 60;
  const contractF = 0.8 + 0.1 * s.contract;
  v *= ageF * potF * contractF * (1 + 0.01 * (s.level - 1));
  return Math.round(v / 10) * 10;
}
export function ageGrowthFactor(age) { return age <= 21 ? 1.3 : age <= 25 ? 1.0 : age <= 29 ? 0.6 : age <= 33 ? 0.3 : 0; }

// XP -> level ups -> automatic stat growth. Returns number of levels gained.
export function addXP(s, xp, trainingLevel = 1) {
  if (s.level >= STAR_MAX_LEVEL) return 0;
  s.xp += Math.round(xp * (1 + 0.08 * (trainingLevel - 1)));
  let gained = 0;
  while (s.level < STAR_MAX_LEVEL && s.xp >= XP_NEXT(s.level)) {
    s.xp -= XP_NEXT(s.level); s.level++; gained++;
    const g = Math.max(0.2, (s.pot - s.ovr) * 0.12 * ageGrowthFactor(s.age) + 0.25 * ageGrowthFactor(s.age));
    s.ovr = round1(Math.min(s.pot, s.ovr + g));
  }
  if (s.level >= STAR_MAX_LEVEL) s.xp = 0;
  return gained;
}
// season-end ageing. Returns true if the star retires.
export function ageStar(s, r) {
  s.age++;
  if (s.age >= 31) s.ovr = round1(Math.max(20, s.ovr - (s.age >= 34 ? r.range(1.5, 3) : r.range(0.3, 1.2))));
  else if (s.age <= 24) s.ovr = round1(Math.min(s.pot, s.ovr + r.range(0.5, 1.5) * ageGrowthFactor(s.age)));
  const p = s.age >= 39 ? 1 : s.age >= 37 ? 0.75 : s.age === 36 ? 0.5 : s.age === 35 ? 0.3 : s.age === 34 ? 0.15 : 0;
  return r.next() < p;
}
