/* FOOTBALL WARS — ROAD TO GLORY: game logic modules (no DOM; node-testable).
 * ArcadeSave · ArcadeClub · ArcadeFormation · ArcadePowers · ArcadeEconomy · ArcadeUpgrades · ArcadeProgression · ArcadeStars
 * ArcadeDraft · ArcadeLeague · ArcadeChallenges · ArcadeEndgame · ArcadeCoach · ArcadeBattleAdapter
 * Every reward-producing operation goes through Arcade.tx(save, claimId, fn): a claim id is stored once,
 * so the same fixture / level / milestone / season / pack / mastery grant can never pay twice (also after reloads). */
(function (root) {
'use strict';
const E = root.FWEngine, DATA = root.ArcadeData;
const Rng = E.Rng, hashStr = E.hashStr;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const SAVE_VERSION = 3; // v3 = ROAD TO GLORY (custom club, auto Powers, permanent stars). v1/v2 careers migrate.
const MECH = 'glory';
const PLAYER_CLUB = 'PLAYER_CLUB', SPARE_DEFAULT = 'USA_INTER_MIAMI';
const DEFAULT_SETTINGS = { master: 0.8, music: 0.5, sfx: 0.8, crowd: 0.6, mute: false, vibration: true, quality: 'medium', speed: 1, smartCam: true };
const ROLES = E.ROLES;
const STAT_KEYS = ['attack', 'defense', 'speed', 'technique', 'stamina'];
const STAT_BASE = { attack: 38, defense: 37, speed: 40, technique: 36, stamina: 39 };
const STAT_STEP = 1.65, MAX_UP = 30;
// ---------- formations (real role counts; equal power budget through formation_budget) ----------
const FORMATIONS = {
  balanced: { name: 'Balanced', roles: { striker: 16, winger: 14, playmaker: 12, defender: 34, goalkeeper: 8, support: 15, captain: 1 }, arch: 'possession', specials: ['one_two_combo', 'iron_wall'], desc: 'Even lines, solid in every phase.' },
  attack: { name: 'All-Out Attack', roles: { striker: 22, winger: 20, playmaker: 14, defender: 25, goalkeeper: 7, support: 11, captain: 1 }, arch: 'possession', specials: ['counter_burst', 'cross_fire'], desc: 'More strikers and wingers, thinner back line.' },
  fortress: { name: 'Iron Fortress', roles: { striker: 12, winger: 10, playmaker: 10, defender: 44, goalkeeper: 10, support: 13, captain: 1 }, arch: 'possession', specials: ['iron_wall', 'high_line_interception'], desc: 'A wall of defenders and keepers, quick counters.' }
};
// Equal power budget: raw HP and damage-per-second sums are equalised, then an effective-value calibration (ranged roles
// convert their budget into damage more efficiently than melee roles) measured with same-seed probes (tools/formation_probe.js).
const FORM_CAL = { balanced: 1, attack: 0.96, fortress: 0.98 };
function formationBudget(key) {
  const B = E.ROLE_BASE, f = FORMATIONS[key].roles, bal = FORMATIONS.balanced.roles, c = FORM_CAL[key];
  const hp = r => Object.keys(r).reduce((m, k) => m + r[k] * B[k].hp, 0), dps = r => Object.keys(r).reduce((m, k) => m + r[k] * B[k].dmg / B[k].interval, 0);
  return { hp: +(hp(bal) / hp(f) * c).toFixed(5), dmg: +(dps(bal) / dps(f) * c).toFixed(5) };
}
const PLAYER_ROLES = FORMATIONS.balanced.roles;
const RARITIES = ['common', 'rare', 'epic', 'legendary'];
const RARITY_TIER = { common: 1, rare: 2, epic: 3, legendary: 4 };
const WIN_C = { 10: 120, 9: 160, 8: 220, 7: 300, 6: 410, 5: 570, 4: 780, 3: 1050, 2: 1450, 1: 2000 };
const LOSS_C = { 10: 45, 9: 60, 8: 80, 7: 110, 6: 150, 5: 210, 4: 290, 3: 390, 2: 550, 1: 750 };
const BAND = { 10: [32, 44], 9: [38, 50], 8: [45, 57], 7: [52, 64], 6: [58, 70], 5: [63, 75], 4: [68, 80], 3: [73, 85], 2: [78, 90], 1: [85, 97] };
const ARC_CFG = { advCap: 0.25, advScale: 22 }; // Road to Glory: softer power-gap curve (stars + Powers now add strength on both sides)
const ARC_LEGACY = { advCap: 0.35, advScale: 18 }; // Reborn / Mayhem snapshots resume with the values they were started with
const PACKS = {
  standard: { credits: 450, frags: 12, unlockDiv: 10, slots: [{ common: 70, rare: 26, epic: 3.5, legendary: 0.5 }, { common: 70, rare: 26, epic: 3.5, legendary: 0.5 }, { rare: 85, epic: 14, legendary: 1 }] },
  premium: { credits: 1350, frags: 36, unlockDiv: 8, slots: [{ common: 20, rare: 58, epic: 20, legendary: 2 }, { common: 20, rare: 58, epic: 20, legendary: 2 }, { epic: 92, legendary: 8 }], pity: 9 },
  legend: { credits: 4000, frags: 100, unlockDiv: 5, slots: [{ rare: 55, epic: 38, legendary: 7 }, { rare: 55, epic: 38, legendary: 7 }, { epic: 75, legendary: 25 }], pity: 3 }
};
const OVR_REF = { 10: { common: [44, 50], rare: [50, 58], epic: [58, 67], legendary: [66, 75] }, 7: { common: [54, 61], rare: [60, 68], epic: [67, 77], legendary: [76, 86] },
  4: { common: [64, 71], rare: [70, 79], epic: [78, 88], legendary: [86, 95] }, 1: { common: [75, 81], rare: [80, 87], epic: [86, 94], legendary: [92, 99] } };
// Team Level milestones (Contract Tickets became Academy Training Tickets; Lv 50 = Eternal Club Banner)
const MILESTONES = {
  5: { packs: { standard: 1 } }, 10: { academy: { a5: 1 } }, 15: { credits: 250, frags: 6 }, 20: { packs: { premium: 1 } }, 25: { academy: { a10: 1 } },
  30: { packs: { legend: 1 } }, 35: { credits: 750, frags: 12 }, 40: { packs: { premium: 1 }, academy: { a10: 1 } }, 45: { packs: { legend: 1 } }, 50: { packs: { legend: 1 }, banner: true }
};
// Mobile League Milestones inside every 19-match season (after the 4th / 9th / 14th final result)
const SEASON_MS = { 4: { name: 'First Steps', r: { frags: 2 } }, 9: { name: 'Build Up', r: { frags: 2 } }, 14: { name: 'Breakthrough', r: { frags: 2, academy: { a5: 1 } } } };
const CH_KINDS = ['power', 'last', 'signature'];
const CH_INFO = { power: { name: 'Power Clash', mul: 1.5 }, last: { name: 'Last Stand', mul: 1.25 }, signature: { name: 'Signature Showdown', mul: 1.5 }, cup: { name: 'Glory Cup', mul: 1.5 } };
const ENDLESS = r => r === 1 ? { credits: 10000, packs: { premium: 1 }, academy: { a10: 1 } } : r <= 3 ? { credits: 6000, academy: { a5: 1 } } : r <= 10 ? { credits: 2000 } : null;
// ---------- Powers catalogue (engine ids in FWEngine.PW.LIST) ----------
const POWERS = [
  ['rocket_boots', 'Rocket Boots', 'common', 'attack', { t: 'start' }, '6–8 attackers sprint and barge forward for ~2 s.'],
  ['pinball_strike', 'Pinball Strike', 'rare', 'attack', { t: 'level', n: 6 }, 'A real shot that can bank 2–3 times off blocks and the goal line.'],
  ['wing_stampede', 'Wing Stampede', 'rare', 'attack', { t: 'div', d: 8 }, '8 wingers / forwards charge down both flanks.'],
  ['golden_volley', 'Golden Volley', 'epic', 'attack', { t: 'level', n: 20 }, 'A lofted, accurate volley: flies over the first defenders.'],
  ['berserker_attack', 'Berserker Attack', 'epic', 'attack', { t: 'sig5' }, '6 attackers near the ball go berserk: damage, attack rate, crits.'],
  ['meteor_shot', 'Meteor Shot', 'legendary', 'attack', { t: 'div', d: 2 }, 'A blazing shot that knocks back up to 3 players in its path.'],
  ['fortress', 'Fortress', 'common', 'defense', { t: 'start' }, 'Defenders form an arc around the goal for ~3 s.'],
  ['counter_shield', 'Counter Shield', 'common', 'defense', { t: 'level', n: 4 }, 'Up to 8 pressured players resist knockback and get a shield.'],
  ['interception_net', 'Interception Net', 'rare', 'defense', { t: 'ballwins', n: 25 }, '6–8 players cut the passing lanes around the rival carrier.'],
  ['iron_curtain', 'Iron Curtain', 'rare', 'defense', { t: 'div', d: 9 }, 'A defensive group blocks the danger with heavy damage reduction.'],
  ['miracle_save', 'Miracle Save', 'epic', 'defense', { t: 'level', n: 23 }, 'The keeper reads a dangerous shot: a much better save chance.'],
  ['last_stand', 'Last Stand', 'legendary', 'defense', { t: 'div', d: 1 }, 'With ≤25 players left, a small group turns into a fortress.'],
  ['domino_impact', 'Domino Impact', 'common', 'chaos', { t: 'start' }, 'For 4 s your heavy hits knock into up to 2 nearby rivals.'],
  ['wild_ball', 'Wild Ball', 'common', 'chaos', { t: 'start' }, 'The ball goes wild: low friction, crazy deflections — risky for both.'],
  ['bowling_charge', 'Bowling Charge', 'rare', 'chaos', { t: 'start' }, 'A defender bowls into the thickest rival crowd.'],
  ['thunder_tackle', 'Thunder Tackle', 'epic', 'chaos', { t: 'level', n: 12 }, 'A brutal tackle shocks every rival around the tackler.'],
  ['turbo_madness', 'Turbo Madness', 'epic', 'chaos', { t: 'div', d: 6 }, 'Both teams speed up for 3.5 s — pure chaos.'],
  ['ricochet_fever', 'Ricochet Fever', 'legendary', 'chaos', { t: 'title' }, '5 s of ricochets: shots bounce off walls, posts and blocks.'],
  ['second_wind', 'Second Wind', 'common', 'support', { t: 'start' }, 'The 6 most tired players refill stamina.'],
  ['captains_rally', "Captain's Rally", 'rare', 'support', { t: 'level', n: 8 }, 'Players around a living captain gain tempo and fight.'],
  ['medical_rush', 'Medical Rush', 'rare', 'support', { t: 'goals', n: 10 }, '3–5 wounded players recover 25 % HP (no revives).'],
  ['adrenaline_wave', 'Adrenaline Wave', 'rare', 'support', { t: 'level', n: 16 }, 'Players around the ball attack faster for 3 s.'],
  ['tactical_genius', 'Tactical Genius', 'epic', 'support', { t: 'div', d: 4 }, 'Smarter passing: quicker decisions, more options, fewer interceptions.'],
  ['star_spotlight', 'Star Spotlight', 'legendary', 'support', { t: 'l35d5' }, "A living star's next signature ability fires sooner and 25 % stronger."]
].map(([id, name, rarity, cat, unlock, desc]) => ({ id, name, rarity, cat, unlock, desc }));
const POWER_BY = new Map(POWERS.map(p => [p.id, p]));
const PM_RANK = [0, 0, 15, 40]; // uses needed for rank 1 / 2 / 3
const WILD_W = { common: 60, rare: 28, epic: 10, legendary: 2 };
// ---------- Star Mastery ----------
const SM = { xp: [0, 8, 24, 48, 80], ovr: [0, 0.75, 1.5, 2.5, 3.5], abil: [0, 0.02, 0.04, 0.06, 0.08], names: ['Rookie', 'Rising', 'Skilled', 'Veteran', 'Club Legend'] };
const DUP_XP = { common: 6, rare: 9, epic: 13, legendary: 18 }, DUP_FRAG = { common: 2, rare: 3, epic: 5, legendary: 8 };
// ---------- club identity / visual evolution ----------
const SYMBOLS = ['lion', 'eagle', 'star', 'ball', 'crown', 'bolt', 'wolf', 'anchor'];
const SHAPES = ['shield', 'round', 'hex'];
const KITS = ['solid', 'stripes', 'hoops', 'halves', 'sash', 'sleeves'];
const STAGES = [ // by highest Division reached
  { name: 'Founded', from: 10, kits: ['solid'], frames: ['basic'] },
  { name: 'Rising Club', from: 9, kits: ['stripes', 'hoops'], frames: [] },
  { name: 'Local Pride', from: 7, kits: ['halves'], frames: ['silver'] },
  { name: 'Professional', from: 5, kits: ['sash'], frames: ['steel'] },
  { name: 'Elite', from: 3, kits: ['sleeves'], frames: ['gold'] },
  { name: 'World Stage', from: 1, kits: [], frames: ['world'] }
];
function stageOf(div) { let s = 0; STAGES.forEach((x, i) => { if (div <= x.from) s = i; }); return s; }

// ======================= club catalogue (200 source clubs + the player's own club) =======================
let CLUBS = null, CLUB_BY = null, PLAYER_ENTRY = null;
function clubs() {
  if (CLUBS) return CLUBS;
  const src = root.FW_MASTER_DB.clubs.concat(DATA.EXTRA_CLUBS);
  CLUBS = src.map(c => ({ id: c.id, sourceName: c.name, displayName: DATA.DISPLAY[c.id], country: c.country, cc: c.country_code, league: c.league_id, power: c.battle_profile.power_index, archetype: c.battle_profile.archetype, src: c }));
  CLUB_BY = new Map(CLUBS.map(c => [c.id, c]));
  return CLUBS;
}
function club(id) { clubs(); if (id === PLAYER_CLUB) return PLAYER_ENTRY; return CLUB_BY.get(id); }
const Club = {
  ID: PLAYER_CLUB, SYMBOLS, SHAPES, KITS, STAGES, stageOf,
  validProfile(p) {
    if (!p || typeof p !== 'object') return 'missing';
    const n = String(p.name || '').trim(), sh = String(p.short || '').trim();
    if (n.length < 3 || n.length > 22) return 'Club name must be 3–22 characters';
    if (sh.length < 2 || sh.length > 5) return 'Short name must be 2–5 characters';
    if (SHAPES.indexOf(p.shape) < 0 || !(p.symbol >= 0 && p.symbol < SYMBOLS.length)) return 'Pick a crest';
    if (!/^#[0-9a-f]{6}$/i.test(p.primary) || !/^#[0-9a-f]{6}$/i.test(p.secondary)) return 'Pick two kit colours';
    return null;
  },
  defaultProfile() { return { name: 'Glory Town FC', short: 'GTF', shape: 'shield', symbol: 0, primary: '#d62839', secondary: '#f5f5f5', kit: 'solid', frame: 'basic' }; },
  bind(save) {
    const p = save.profile; if (!p) { PLAYER_ENTRY = null; return; }
    const prof = { power_index: 50, archetype: 'balanced', attributes: {}, roles_per_100: Object.assign({}, PLAYER_ROLES), specials: [], aggression: 62, variance: { team_form_std_pct: 9, unit_trait_std_pct: 14, critical_chance_pct: 7, critical_multiplier: 1.45, streak_adaptation: true } };
    PLAYER_ENTRY = { id: PLAYER_CLUB, sourceName: p.name, displayName: p.name, short: p.short, country: 'Your club', cc: 'YOU', league: 'Road to Glory', power: 50, archetype: 'balanced', custom: true,
      src: { id: PLAYER_CLUB, name: p.name, battle_profile: prof, visual: { primary_color: p.primary, secondary_color: p.secondary, kit_design: p.kit || 'solid' }, search_aliases: [] } };
  },
  setProfile(save, p) {
    const why = Club.validProfile(p); if (why) return why;
    const C = save.cosmetics;
    save.profile = { name: String(p.name).trim(), short: String(p.short).trim().toUpperCase(), shape: p.shape, symbol: p.symbol | 0, primary: p.primary.toLowerCase(), secondary: p.secondary.toLowerCase(),
      kit: C && C.kits.indexOf(p.kit) >= 0 ? p.kit : (save.profile && save.profile.kit) || 'solid', frame: C && C.frames.indexOf(p.frame) >= 0 ? p.frame : (save.profile && save.profile.frame) || 'basic' };
    Club.bind(save); return null;
  },
  // cosmetics unlocked by the club's journey (never affect battle strength)
  refreshCosmetics(save, out) {
    const C = save.cosmetics, st = stageOf(save.highestDiv);
    for (let i = 0; i <= st; i++) {
      for (const k of STAGES[i].kits) if (C.kits.indexOf(k) < 0) { C.kits.push(k); if (out) (out.cosmetics = out.cosmetics || []).push('Kit pattern: ' + k); }
      for (const f of STAGES[i].frames) if (C.frames.indexOf(f) < 0) { C.frames.push(f); if (out) (out.cosmetics = out.cosmetics || []).push('Crest frame: ' + f); }
    }
    if (save.goldenCrest && C.frames.indexOf('champion') < 0) { C.frames.push('champion'); if (out) (out.cosmetics = out.cosmetics || []).push('Golden Champion Crest'); }
    C.stage = Math.max(C.stage || 0, st);
  }
};

// ======================= helpers =======================
function roundTo5(v) { return Math.round(v / 5) * 5; }
function seedOf(save, s) { return (hashStr(save.careerSeed + '|' + s) % 4294967295) >>> 0; }
function newRng(save, s) { return new Rng(seedOf(save, s)); }
function rollTable(rng, table) { let x = rng.next() * 100, last = null; for (const k in table) { last = k; x -= table[k]; if (x < 0) return k; } return last; }
function addPacks(save, packs) { for (const k in packs || {}) save.packs[k] = (save.packs[k] || 0) + packs[k]; }
function addAcademy(save, t) { for (const k in t || {}) save.academy[k] = (save.academy[k] || 0) + t[k]; }
function applyReward(save, r, out) {
  if (!r) return;
  if (r.credits) save.credits += r.credits;
  if (r.frags) save.fragments += r.frags;
  if (r.packs) addPacks(save, r.packs);
  if (r.academy) addAcademy(save, r.academy);
  if (r.crest) { save.goldenCrest = true; Club.refreshCosmetics(save, out); }
  if (r.banner) save.cosmetics.banner = true;
  if (out) mergeReward(out, r);
  if (r.xp) Progression.addXP(save, r.xp, out);
}
function mergeReward(out, r) {
  out.credits = (out.credits || 0) + (r.credits || 0); out.frags = (out.frags || 0) + (r.frags || 0); out.xp = (out.xp || 0) + (r.xp || 0);
  if (r.packs) { out.packs = out.packs || {}; for (const k in r.packs) out.packs[k] = (out.packs[k] || 0) + r.packs[k]; }
  if (r.academy) { out.academy = out.academy || {}; for (const k in r.academy) out.academy[k] = (out.academy[k] || 0) + r.academy[k]; }
  if (r.crest) out.crest = true; if (r.banner) out.banner = true;
  if (r.label) (out.labels = out.labels || []).push(r.label);
}
function tx(save, id, fn) {
  if (save.claims[id]) return false;
  save.claims[id] = save.txn = (save.txn || 0) + 1;
  fn();
  return true;
}

// ======================= ArcadeSave =======================
function newWC() { return { commands: 0, kick: 0, rush: 0, iron: 0, pkGoals: 0, rushHits: 0, ironStops: 0, chains: 0, rampages: 0, reinforcements: 0 }; }
function newPowers() { return { favs: ['rocket_boots', 'fortress'], unlocked: {}, mastery: {} }; }
function newCareer() { return { ballWins: 0, goals: 0, lossStreak: 0, maxLossStreak: 0, powerUses: 0, reinforcements: 0, chains: 0, rampages: 0 }; }
const Save = {
  KEY: 'fwa_save_v1', BAK: 'fwa_save_v1_bak', // same storage key: older Mayhem / Reborn careers are found and migrated
  fresh(profile, careerSeed, formation) {
    const s = {
      v: SAVE_VERSION, kind: 'football-wars-arcade', game: 'road-to-glory', created: Date.now(), careerSeed: careerSeed >>> 0, club: PLAYER_CLUB, spareClub: SPARE_DEFAULT,
      profile: null, cosmetics: { kits: ['solid'], frames: ['basic'], banner: false, stage: 0 }, formation: FORMATIONS[formation] ? formation : 'balanced',
      credits: 0, fragments: 0, academy: { a5: 0, a10: 0 }, xp: 0, level: 1, goldenCrest: false,
      upgrades: { attack: 1, defense: 1, speed: 1, technique: 1, stamina: 1 },
      packs: { standard: 0, premium: 0, legend: 0 }, pity: { premium: 0, legend: 0 }, packCounter: 0, ticketCounter: 0, pendingDraft: null,
      stars: {}, active: [], powers: newPowers(), career: newCareer(),
      division: 10, highestDiv: 10, seasonNo: 0, officialPlayed: 0, divPlayed: {},
      divisions: null, league: null, history: [], trophies: [], challenges: { unlocked: {}, done: {} },
      endless: { seasons: 0, titles: 0, firstTitle: false }, stats: { battles: 0, wins: 0, losses: 0, goals: 0, strikes: 0, perfects: 0 }, wc: newWC(),
      onboard: { seen: {}, done: false }, coach: null,
      claims: {}, txn: 0, pendingBattle: null, pendingDecision: null, promo: null, lastResult: null,
      settings: Object.assign({}, DEFAULT_SETTINGS)
    };
    const why = Club.setProfile(s, profile || Club.defaultProfile()); if (why) throw new Error(why);
    League.assignDivisions(s);
    League.newSeason(s, 10);
    Powers.refreshUnlocks(s);
    return s;
  },
  validate(s) {
    const errs = [];
    if (!s || typeof s !== 'object') return ['not an object'];
    if (s.kind !== 'football-wars-arcade') errs.push('kind');
    if (typeof s.v !== 'number' || s.v > SAVE_VERSION) errs.push('version');
    if (s.club !== PLAYER_CLUB || Club.validProfile(s.profile)) errs.push('club');
    for (const k of ['credits', 'fragments', 'xp', 'level', 'division', 'highestDiv']) if (typeof s[k] !== 'number' || !isFinite(s[k]) || s[k] < 0) errs.push(k);
    if (!s.upgrades || STAT_KEYS.some(k => !(s.upgrades[k] >= 1 && s.upgrades[k] <= MAX_UP))) errs.push('upgrades');
    if (!FORMATIONS[s.formation]) errs.push('formation');
    if (!Array.isArray(s.divisions) || s.divisions.length !== 10 || s.divisions.some(d => !Array.isArray(d) || d.length !== 20)) errs.push('divisions');
    else { const all = [].concat(...s.divisions); if (new Set(all).size !== 200 || all.some(id => !club(id)) || all.indexOf(s.spareClub) >= 0 || !club(s.spareClub)) errs.push('division clubs'); if (s.divisions[s.division - 1].indexOf(s.club) < 0) errs.push('player division'); }
    if (!s.league || !Array.isArray(s.league.rounds) || s.league.rounds.length !== 19) errs.push('league');
    if (!s.stars || typeof s.stars !== 'object' || !Array.isArray(s.active) || s.active.length > 5) errs.push('stars');
    if (!s.powers || !Array.isArray(s.powers.favs) || s.powers.favs.length !== 2) errs.push('powers');
    if (!s.claims || typeof s.claims !== 'object') errs.push('claims');
    return errs;
  },
  migrate(s) {
    if (!s || typeof s !== 'object') return s;
    if ((s.v || 1) < 2) { s.wc = s.wc || newWC(); s.migratedFrom = s.v || 1; s.v = 2; } // v1 -> v2 (Mayhem) only added stats
    if (s.v === 2) Save.migrateV3(s);
    if (!s.wc) s.wc = newWC();
    s.settings = Object.assign({}, DEFAULT_SETTINGS, s.settings || {});
    if (!s.stats) s.stats = { battles: 0, wins: 0, losses: 0, goals: 0, strikes: 0, perfects: 0 };
    if (!s.challenges) s.challenges = { unlocked: {}, done: {} };
    if (!s.endless) s.endless = { seasons: 0, titles: 0, firstTitle: false };
    if (!s.divPlayed) s.divPlayed = {};
    if (!s.career) s.career = newCareer();
    if (!s.trophies) s.trophies = [];
    if (!s.onboard) s.onboard = { seen: {}, done: true };
    Club.bind(s);
    return s;
  },
  // v2 (Mayhem / Reborn: a real source club) -> v3 (Road to Glory: the player's own club).
  // Keeps credits, fragments, XP/level, division, fixtures + results, upgrades, stars (+OVR), packs, pity, challenges,
  // endless history and every claim. The old real club keeps the career slot under the new PLAYER_CLUB id and becomes
  // the spare "Glory Cup" club; the profile starts from its adapted name / colours (editable for free).
  migrateV3(s) {
    const old = s.club, c = club(old);
    const vis = c ? c.src.visual : { primary_color: '#d62839', secondary_color: '#f5f5f5' };
    const name = c ? c.displayName : 'Glory Town FC';
    const short = name.split(/\s+/).map(w => w[0]).join('').toUpperCase().replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '').slice(0, 4).padEnd(2, 'X');
    const hex = v => /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : '#888888';
    s.profile = { name: name.slice(0, 22), short, shape: 'shield', symbol: 0, primary: hex(vis.primary_color), secondary: hex(vis.secondary_color), kit: 'solid', frame: 'basic' };
    if (old && old !== PLAYER_CLUB) {
      const re = new RegExp('(^|[^A-Z0-9_])' + old.replace(/[^A-Z0-9_]/g, '') + '(?![A-Z0-9_])', 'g');
      const ren = v => JSON.parse(JSON.stringify(v).replace(re, (m, p1) => p1 + PLAYER_CLUB));
      s.divisions = ren(s.divisions); s.league = ren(s.league); if (s.promo) s.promo = ren(s.promo);
      if (s.pendingDecision) s.pendingDecision.fixtureId = s.pendingDecision.fixtureId.replace(re, (m, p1) => p1 + PLAYER_CLUB);
      if (s.pendingBattle) s.pendingBattle.snap.fixtureId = s.pendingBattle.snap.fixtureId.replace(re, (m, p1) => p1 + PLAYER_CLUB); // its teams stay frozen: resumes byte-identical
      const nc = {}; for (const k in s.claims) nc[k.replace(re, (m, p1) => p1 + PLAYER_CLUB)] = s.claims[k]; s.claims = nc;
      s.spareClub = old;
    } else s.spareClub = SPARE_DEFAULT;
    s.club = PLAYER_CLUB; s.formation = 'balanced';
    // permanent stars: remaining contract -> Mastery XP (1 XP per 2 matches, max 20 per star), expired stars playable again
    for (const id in s.stars) { const st = s.stars[id]; const left = Math.max(0, st.contract | 0); st.xp = Math.min(20, Math.floor(left / 2)); st.adapted = st.ovr; st.adaptGames = {}; delete st.contract; }
    s.academy = { a5: (s.tickets && s.tickets.t5) | 0, a10: (s.tickets && s.tickets.t10) | 0 }; delete s.tickets;
    if (s.pendingDraft) for (const cd of s.pendingDraft.cands) delete cd.contract;
    // Golden Crest conflict: first D1 title -> Golden Champion Crest; Team Level 50 -> Eternal Club Banner
    const titled = !!(s.endless && s.endless.firstTitle);
    s.cosmetics = { kits: ['solid'], frames: ['basic'], banner: s.level >= 50, stage: 0 };
    s.goldenCrest = titled;
    s.powers = newPowers(); s.career = newCareer(); s.career.goals = (s.stats && s.stats.goals) | 0;
    s.trophies = []; for (const h of s.history || []) { const t = h.rank === 1 ? (h.div === 1 ? 'd1_champion' : 'div_champion') : /Promoted via/.test(h.outcome) ? 'promo_survivor' : h.rank <= 3 && h.div > 1 ? 'direct_promotion' : null; if (t) s.trophies.push({ type: t, season: h.season, div: h.div }); }
    s.onboard = { seen: {}, done: true }; s.coach = null; s.game = 'road-to-glory';
    s.migratedFrom = s.migratedFrom || 2; s.v = 3;
    Club.bind(s); Club.refreshCosmetics(s); Powers.refreshUnlocks(s);
  },
  serialize(s) { return JSON.stringify(s); },
  parse(txt) { const s = Save.migrate(JSON.parse(txt)); const e = Save.validate(s); if (e.length) throw new Error('Invalid save: ' + e.join(', ')); return s; }
};

// ======================= ArcadeUpgrades (Training) =======================
const Upgrades = {
  KEYS: STAT_KEYS, BASE: STAT_BASE, MAX: MAX_UP,
  cost(L) { return L >= MAX_UP ? null : roundTo5(90 * Math.pow(1.16, L - 1)); },
  value(key, L) { return +(STAT_BASE[key] + (L - 1) * STAT_STEP).toFixed(2); },
  stats(save) { const o = {}; for (const k of STAT_KEYS) o[k] = Upgrades.value(k, save.upgrades[k]); return o; },
  attributes(st) {
    const r = v => clamp(Math.round(v * 10) / 10, 1, 99);
    return { attack: r(st.attack), defense: r(st.defense), speed: r(st.speed), pressing: r((st.speed + st.defense + st.stamina) / 3), stamina: r(st.stamina),
      teamwork: r((st.technique + st.stamina) / 2), physical: r((st.defense + st.stamina) / 2), technique: r(st.technique), goalkeeping: r((st.defense + st.technique) / 2), finishing: r((st.attack + st.technique) / 2) };
  },
  power(save) { const a = Upgrades.attributes(Upgrades.stats(save)); let m = 0; for (const k of E.ATTRS) m += a[k]; return Math.round(m / E.ATTRS.length * 10) / 10; },
  buy(save, key) { const L = save.upgrades[key]; const c = Upgrades.cost(L); if (c == null || save.credits < c) return false; save.credits -= c; save.upgrades[key] = L + 1; return true; }
};

// ======================= ArcadeProgression (Team XP / Level 1-50) =======================
const Progression = {
  MAX: 50, MILESTONES,
  xpToNext(level) { return 40 + 6 * (level - 1); },
  totalTo(level) { let t = 0; for (let l = 1; l < level; l++) t += Progression.xpToNext(l); return t; },
  levelCredits(n) { return 15 + 5 * n; },
  addXP(save, n, out) {
    if (save.level >= 50 || !n) return;
    save.xp += n;
    while (save.level < 50 && save.xp >= Progression.totalTo(save.level + 1)) {
      const nl = save.level + 1; save.level = nl;
      tx(save, 'lvl:' + nl, () => {
        applyReward(save, { credits: Progression.levelCredits(nl) }, out);
        if (out) (out.levelUps = out.levelUps || []).push(nl);
        const ms = MILESTONES[nl];
        if (ms) tx(save, 'ms:' + nl, () => { applyReward(save, ms, out); if (out) (out.milestones = out.milestones || []).push(nl); });
      });
    }
    if (save.level >= 50) save.xp = Progression.totalTo(50);
  },
  progress(save) { if (save.level >= 50) return { cur: 1, need: 1, pct: 1 }; const base = Progression.totalTo(save.level), need = Progression.xpToNext(save.level); return { cur: save.xp - base, need, pct: (save.xp - base) / need }; }
};

// ======================= ArcadeEconomy =======================
const Economy = {
  WIN_C, LOSS_C,
  league(div, won) { return won ? { credits: WIN_C[div], xp: 40, frags: 2 } : { credits: LOSS_C[div], xp: 15, frags: 1 }; },
  seasonBonus(div, rank, viaPromo) { if (div === 1) return null; if (rank === 1) return { credits: 5 * WIN_C[div], label: 'Champions bonus' }; if (rank <= 3) return { credits: 3 * WIN_C[div], label: 'Top-3 bonus' }; if (viaPromo) return { credits: 2 * WIN_C[div], label: 'Promotion Challenge bonus' }; return null; }
};

// ======================= ArcadePowers (collection, unlocks, mastery, loadout) =======================
const Powers = {
  LIST: POWERS, def: id => POWER_BY.get(id), WILD_W, PM_RANK,
  unlockedNow(save, p) {
    const u = p.unlock, C = save.career || newCareer();
    switch (u.t) {
      case 'start': return true;
      case 'level': return save.level >= u.n;
      case 'div': return save.highestDiv <= u.d;
      case 'ballwins': return C.ballWins >= u.n;
      case 'goals': return C.goals >= u.n;
      case 'sig5': return !!save.claims['ch:first:D5:signature'];
      case 'title': return !!(save.endless && save.endless.firstTitle);
      case 'l35d5': return save.level >= 35 && save.highestDiv <= 5;
    }
    return false;
  },
  unlockText(p) {
    const u = p.unlock;
    return { start: 'Starter Power', level: 'Team Level ' + u.n, div: 'Reach Division ' + u.d, ballwins: 'Win the ball ' + u.n + ' times (career)', goals: 'Score ' + u.n + ' goals (career)',
      sig5: 'Win Division 5 Signature Showdown', title: 'First Division 1 title', l35d5: 'Team Level 35 + Division 5' }[u.t];
  },
  isUnlocked(save, id) { return !!save.powers.unlocked[id]; },
  refreshUnlocks(save, out) {
    for (const p of POWERS) if (!save.powers.unlocked[p.id] && Powers.unlockedNow(save, p)) { save.powers.unlocked[p.id] = true; if (out) (out.powersUnlocked = out.powersUnlocked || []).push(p.id); }
    const fav = save.powers.favs.filter((id, i, a) => save.powers.unlocked[id] && a.indexOf(id) === i);
    for (const id of ['rocket_boots', 'fortress', 'domino_impact', 'wild_ball']) if (fav.length < 2 && fav.indexOf(id) < 0) fav.push(id);
    save.powers.favs = fav.slice(0, 2);
  },
  rank(save, id) { const n = save.powers.mastery[id] || 0; return n >= PM_RANK[3] ? 3 : n >= PM_RANK[2] ? 2 : 1; },
  setFav(save, slot, id) {
    if (!save.powers.unlocked[id] || (slot !== 0 && slot !== 1)) return false;
    const f = save.powers.favs.slice(); const other = f[1 - slot]; if (other === id) f[1 - slot] = f[slot];
    f[slot] = id; save.powers.favs = f; return true;
  },
  // 2 Favorites + 2 Wilds (rarity-weighted from the unlocked collection, re-normalised; 4 different, max 1 Legendary)
  loadout(save, key) {
    const rng = newRng(save, 'wild:' + key), favs = save.powers.favs.slice(0, 2);
    const L = favs.map(id => ({ id, rank: Powers.rank(save, id), fav: true }));
    let leg = L.filter(x => Powers.def(x.id).rarity === 'legendary').length;
    for (let k = 0; k < 2; k++) {
      const pool = POWERS.filter(p => save.powers.unlocked[p.id] && !L.some(x => x.id === p.id) && !(leg && p.rarity === 'legendary'));
      if (!pool.length) break;
      const tot = pool.reduce((m, p) => m + WILD_W[p.rarity], 0); let x = rng.next() * tot, pick = pool[pool.length - 1];
      for (const p of pool) { x -= WILD_W[p.rarity]; if (x < 0) { pick = p; break; } }
      if (pick.rarity === 'legendary') leg++;
      L.push({ id: pick.id, rank: Powers.rank(save, pick.id), fav: false });
    }
    return L;
  },
  // AI clubs: Division-appropriate pool and mastery, same 4-Power rules
  aiLoadout(d, seed) {
    const r = new Rng(seed >>> 0), maxR = d >= 8 ? 1 : d >= 5 ? 2 : d >= 3 ? 3 : 4, rank = d >= 7 ? 1 : d >= 4 ? 2 : 3;
    const pool = POWERS.filter(p => RARITY_TIER[p.rarity] <= maxR && p.id !== 'star_spotlight'), L = []; let leg = 0;
    while (L.length < 4) {
      const P = pool.filter(p => !L.some(x => x.id === p.id) && !(leg && p.rarity === 'legendary')); if (!P.length) break;
      const tot = P.reduce((m, p) => m + WILD_W[p.rarity], 0); let x = r.next() * tot, pick = P[P.length - 1];
      for (const p of P) { x -= WILD_W[p.rarity]; if (x < 0) { pick = p; break; } }
      if (pick.rarity === 'legendary') leg++;
      L.push({ id: pick.id, rank, fav: L.length < 2 });
    }
    return L;
  },
  // mastery from one reward-eligible battle: every successful use counts once
  addMastery(save, uses, key, out) {
    return tx(save, 'pm:' + key, () => {
      for (const id in uses) {
        if (!POWER_BY.has(id)) continue;
        const before = Powers.rank(save, id); save.powers.mastery[id] = (save.powers.mastery[id] || 0) + uses[id]; save.career.powerUses += uses[id];
        const after = Powers.rank(save, id); if (after > before && out) (out.powerRanks = out.powerRanks || []).push({ id, rank: after });
      }
    });
  }
};

// ======================= ArcadeStars (permanent stars, Star Mastery, League Adaptation) =======================
const STAR_BY = new Map(DATA.STARS.map(s => [s.id, s]));
const Stars = {
  defs: DATA.STARS, def: id => STAR_BY.get(id), TIER: RARITY_TIER, SM, DUP_XP, DUP_FRAG,
  list(save) { return Object.values(save.stars); },
  isActive(save, id) { return save.active.indexOf(id) >= 0; },
  rank(c) { let r = 0; for (let i = 0; i < SM.xp.length; i++) if (c.xp >= SM.xp[i]) r = i; return r; },
  baseOvr(c) { return Math.min(99, Math.max(c.ovr, c.adapted || c.ovr)); },
  effOvr(c) { return Math.min(99, +(Stars.baseOvr(c) + SM.ovr[Stars.rank(c)]).toFixed(2)); },
  roles(save) { return FORMATIONS[save.formation].roles; },
  canEquip(save, id) {
    const c = save.stars[id]; if (!c) return 'Not in your collection';
    if (Stars.isActive(save, id)) return 'Already active';
    if (save.active.length >= 5) return 'All 5 slots are full';
    const d = Stars.def(id), R = Stars.roles(save);
    if (save.active.filter(a => Stars.def(a).role === d.role).length >= R[d.role]) return 'Only ' + R[d.role] + ' ' + d.role + ' slot in this formation';
    return null;
  },
  equip(save, id) { if (Stars.canEquip(save, id)) return false; save.active.push(id); return true; },
  remove(save, id) { const i = save.active.indexOf(id); if (i < 0) return false; save.active.splice(i, 1); return true; },
  replace(save, oldId, newId) { const i = save.active.indexOf(oldId); if (i < 0) return false; save.active.splice(i, 1); if (Stars.canEquip(save, newId)) { save.active.splice(i, 0, oldId); return false; } save.active.splice(i, 0, newId); return true; },
  fitFormation(save) { const R = Stars.roles(save), cnt = {}; save.active = save.active.filter(id => { const r = Stars.def(id).role; cnt[r] = (cnt[r] || 0) + 1; return cnt[r] <= R[r]; }); },
  addXP(save, id, n, out) {
    const c = save.stars[id]; if (!c || !n) return;
    const before = Stars.rank(c); c.xp = (c.xp || 0) + n; const after = Stars.rank(c);
    if (out) { (out.starXP = out.starXP || []).push({ id, n }); if (after > before) (out.starRanks = out.starRanks || []).push({ id, rank: after }); }
  },
  // Academy Training Ticket: +5 / +10 Star XP (transactional)
  train(save, id, kind) {
    const c = save.stars[id], k = kind === 'a10' ? 'a10' : 'a5';
    if (!c || !(save.academy[k] > 0)) return false;
    const n = ++save.ticketCounter;
    return tx(save, 'academy:' + n, () => { save.academy[k]--; Stars.addXP(save, id, k === 'a10' ? 10 : 5); });
  },
  // League Adaptation: an active star with 6 final official matches in a Division adapts toward its rarity floor there (-2)
  adapt(save, id, d, out) {
    const c = save.stars[id]; if (!c) return;
    c.adaptGames = c.adaptGames || {}; c.adaptGames[d] = (c.adaptGames[d] || 0) + 1;
    if (c.adaptGames[d] < 6) return;
    tx(save, 'adapt:' + id + ':D' + d, () => {
      const target = Math.min(99, ovrRange(d, c.rarity)[0] - 2), before = Stars.baseOvr(c);
      if (target > before) { c.adapted = target; if (out) (out.adapted = out.adapted || []).push({ id, from: before, to: target }); }
    });
  },
  battleList(save) { return save.active.filter(id => save.stars[id]).map(id => Stars.unitSpec(id, Stars.effOvr(save.stars[id]), SM.abil[Stars.rank(save.stars[id])])); },
  unitSpec(id, ovr, abil) { const d = Stars.def(id); return { id, name: d.name, role: d.role, ovr, rarity: d.rarity, ability: d.ability, tier: RARITY_TIER[d.rarity], powMul: 1 + (abil || 0) }; }
};

// ======================= ArcadeDraft (Three-Star Draft Pack) =======================
function ovrRange(div, rarity) {
  const keys = [10, 7, 4, 1];
  if (OVR_REF[div]) return OVR_REF[div][rarity];
  for (let i = 0; i < 3; i++) { const a = keys[i], b = keys[i + 1]; if (div < a && div > b) { const t = (a - div) / (a - b), A = OVR_REF[a][rarity], B = OVR_REF[b][rarity]; return [Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t)]; } }
  return OVR_REF[10][rarity];
}
const Draft = {
  PACKS, ovrRange,
  unlocked(save, type) { return save.highestDiv <= PACKS[type].unlockDiv; },
  canOpen(save, type, pay) {
    if (save.pendingDraft) return 'Pick a star from your open draft first';
    if (!Draft.unlocked(save, type)) return 'Unlocks in Division ' + PACKS[type].unlockDiv;
    if (pay === 'credits' && save.credits < PACKS[type].credits) return 'Not enough Credits';
    if (pay === 'frags' && save.fragments < PACKS[type].frags) return 'Not enough Pack Fragments';
    if (pay === 'inventory' && !(save.packs[type] > 0)) return 'No unopened pack';
    return null;
  },
  open(save, type, pay) {
    if (Draft.canOpen(save, type, pay)) return null;
    const n = ++save.packCounter, P = PACKS[type];
    const rng = newRng(save, 'pack:' + n);
    let rar = P.slots.map(t => rollTable(rng, t)), pityHit = false;
    if (P.pity && save.pity[type] >= P.pity && rar.indexOf('legendary') < 0) { rar[2] = 'legendary'; pityHit = true; }
    const cands = [], usedIds = new Set();
    for (let i = 0; i < 3; i++) { const pool = DATA.STARS.filter(s => s.rarity === rar[i] && !usedIds.has(s.id)); const d = pool[rng.int(pool.length)]; usedIds.add(d.id); cands.push(d); }
    if (new Set(cands.map(c => c.role)).size < 2) { const pool = DATA.STARS.filter(s => s.rarity === rar[0] && s.role !== cands[1].role && !usedIds.has(s.id)); cands[0] = pool[rng.int(pool.length)]; }
    const out = cands.map(d => {
      const or = ovrRange(save.highestDiv, d.rarity), ovr = or[0] + rng.int(or[1] - or[0] + 1), owned = save.stars[d.id];
      return { id: d.id, rarity: d.rarity, ovr: owned ? owned.ovr : ovr, rolledOvr: ovr, dup: !!owned };
    });
    if (P.pity) save.pity[type] = out.some(c => c.rarity === 'legendary') ? 0 : save.pity[type] + 1;
    if (pay === 'credits') save.credits -= P.credits; else if (pay === 'frags') save.fragments -= P.frags; else save.packs[type]--;
    save.pendingDraft = { n, type, pay, cands: out, pityHit, at: Date.now() };
    return save.pendingDraft;
  },
  // what a duplicate pick would give (shown before choosing)
  dupPreview(save, c) {
    const o = save.stars[c.id]; if (!o) return null;
    const r = Stars.rank(o);
    return r >= 4 ? { frags: DUP_FRAG[c.rarity], rank: r, xp: o.xp } : { xp: DUP_XP[c.rarity], rank: r, cur: o.xp, next: SM.xp[r + 1] };
  },
  pick(save, idx) {
    const D = save.pendingDraft; if (!D || !D.cands[idx]) return null;
    const c = D.cands[idx]; let res = null;
    tx(save, 'draft:' + D.n, () => {
      const owned = save.stars[c.id];
      if (owned) {
        if (Stars.rank(owned) >= 4) { save.fragments += DUP_FRAG[c.rarity]; res = { merged: true, id: c.id, frags: DUP_FRAG[c.rarity] }; }
        else { const o = {}; Stars.addXP(save, c.id, DUP_XP[c.rarity], o); res = { merged: true, id: c.id, xp: DUP_XP[c.rarity], rankUp: (o.starRanks || [])[0] }; }
      } else { save.stars[c.id] = { id: c.id, ovr: c.ovr, adapted: c.ovr, xp: 0, rarity: c.rarity, got: Date.now(), gotDiv: save.division, battles: 0, adaptGames: {} }; res = { merged: false, id: c.id }; }
      save.pendingDraft = null;
    });
    return res;
  }
};

// ======================= ArcadeLeague =======================
function roundRobin(ids, rng) {
  const t = ids.slice();
  for (let i = t.length - 1; i > 0; i--) { const j = rng.int(i + 1); const x = t[i]; t[i] = t[j]; t[j] = x; }
  const n = t.length, rounds = [];
  for (let r = 0; r < n - 1; r++) { const m = []; for (let i = 0; i < n / 2; i++) m.push([t[i], t[n - 1 - i]]); rounds.push(m); t.splice(1, 0, t.pop()); }
  return rounds;
}
const League = {
  BAND,
  // 199 rival source clubs + the player's club (the 200th source club is the Glory Cup guest)
  assignDivisions(save) {
    const others = clubs().filter(c => c.id !== save.spareClub).sort((a, b) => b.power - a.power || (a.id < b.id ? -1 : 1));
    const div = [];
    for (let d = 0; d < 9; d++) div.push(others.slice(d * 20, d * 20 + 20).map(c => c.id));
    div.push(others.slice(180).map(c => c.id).concat([save.club]));
    save.divisions = div;
  },
  divClubs(save, d) { return save.divisions[d - 1]; },
  rating(save, id, d, seasonId) {
    if (id === save.club) return Upgrades.power(save);
    const list = save.divisions[d - 1].filter(x => x !== save.club).map(x => club(x)).sort((a, b) => a.power - b.power || (a.id < b.id ? -1 : 1));
    let i = list.findIndex(c => c.id === id); if (i < 0) i = list.length - 1;
    const f = list.length > 1 ? i / (list.length - 1) : 0.5;
    const b = BAND[d], jit = d === 1 ? 2.5 : 1.2;
    const v = b[0] + (b[1] - b[0]) * f + (((hashStr(seasonId + '|' + id) % 1000) / 1000) * 2 - 1) * jit;
    return Math.round(clamp(v, b[0], b[1]) * 10) / 10;
  },
  newSeason(save, d) {
    save.seasonNo++;
    const seasonId = 'S' + save.seasonNo + '-D' + d;
    const ids = save.divisions[d - 1].slice();
    const rng = newRng(save, 'season:' + seasonId);
    const rounds = roundRobin(ids, rng);
    const tactics = {};
    if (d === 1) { const arch = ['high_press', 'possession', 'counter', 'defensive_block', 'wing_attack', 'physical']; for (const id of ids) if (id !== save.club && rng.next() < 0.3) tactics[id] = arch[rng.int(arch.length)]; }
    save.league = { seasonId, div: d, rounds, round: 0, results: {}, aiQueue: [], phase: 'regular', tactics, endRank: 0, startedAt: Date.now() };
    save.promo = null;
    return save.league;
  },
  fixtureId(L, r, a, b) { return L.seasonId + ':R' + (r + 1) + ':' + a + '>' + b; },
  playerFixture(save, r) {
    const L = save.league; if (r == null) r = L.round; if (r >= 19) return null;
    const m = L.rounds[r].find(x => x[0] === save.club || x[1] === save.club);
    const opp = m[0] === save.club ? m[1] : m[0];
    return { id: League.fixtureId(L, r, m[0], m[1]), round: r, opp, pair: m };
  },
  table(save) {
    const L = save.league, rows = {};
    for (const id of save.divisions[L.div - 1]) rows[id] = { id, p: 0, w: 0, l: 0, pts: 0, gf: 0, ga: 0, sd: 0 };
    for (const fid in L.results) {
      const r = L.results[fid]; const A = rows[r.a], B = rows[r.b]; if (!A || !B) continue;
      A.p++; B.p++; A.gf += r.ga; A.ga += r.gb; B.gf += r.gb; B.ga += r.ga;
      if (r.winner === 0) { A.w++; A.pts += 3; B.l++; A.sd += r.surv; B.sd -= r.surv; } else { B.w++; B.pts += 3; A.l++; B.sd += r.surv; A.sd -= r.surv; }
    }
    const tb = id => hashStr(L.seasonId + '#' + id);
    return Object.values(rows).sort((x, y) => y.pts - x.pts || y.w - x.w || (y.gf - y.ga) - (x.gf - x.ga) || y.sd - x.sd || y.gf - x.gf || tb(x.id) - tb(y.id));
  },
  rank(save) { return League.table(save).findIndex(r => r.id === save.club) + 1; },
  playerGames(save) { return Object.values(save.league.results).filter(r => r.player).length; },
  queueRound(save, r) { const L = save.league; for (const m of L.rounds[r]) { if (m[0] === save.club || m[1] === save.club) continue; const id = League.fixtureId(L, r, m[0], m[1]); if (!L.results[id] && L.aiQueue.indexOf(id) < 0) L.aiQueue.push(id); } },
  aiJob(save) {
    const L = save.league; const id = L.aiQueue[0]; if (!id) return null;
    const [, rs, pair] = id.split(':'); const [a, b] = pair.split('>');
    return { fixtureId: id, round: +rs.slice(1) - 1, a, b, seed: seedOf(save, 'ai:' + id), div: L.div, seasonId: L.seasonId };
  },
  applyAI(save, job, res) {
    const L = save.league; if (L.seasonId !== job.seasonId) return false;
    const done = tx(save, 'ai:' + job.fixtureId, () => { L.results[job.fixtureId] = { a: job.a, b: job.b, winner: res.winner, ga: res.goals[0], gb: res.goals[1], surv: res.survivors, ai: true }; });
    const i = L.aiQueue.indexOf(job.fixtureId); if (i >= 0) L.aiQueue.splice(i, 1);
    return done;
  },
  seasonComplete(save) { const L = save.league; return L.round >= 19 && L.aiQueue.length === 0; }
};

// ======================= ArcadeChallenges (+ Glory Cup vs the reserved 200th club) =======================
const Challenges = {
  KINDS: CH_KINDS, INFO: CH_INFO,
  key: (d, k) => 'D' + d + ':' + k,
  unlocked(save, d) { return !!save.challenges.unlocked[d]; },
  rewardFirst(d, kind) { return { credits: Math.round(WIN_C[d] * CH_INFO[kind].mul), xp: 30, frags: 3 }; },
  rewardRepeat(d) { return { credits: Math.round(WIN_C[d] * 0.25) }; },
  medalBonus(d, medal) { return medal === 2 ? { credits: roundTo5(WIN_C[d] / 6), frags: 1 } : medal === 3 ? { credits: roundTo5(WIN_C[d] / 3), frags: 1 } : null; },
  oppStars(d) { return d <= 2 ? 5 : d <= 4 ? 4 : d <= 6 ? 3 : d <= 8 ? 2 : 1; },
  opponent(save, d, kind) {
    if (kind === 'cup') return { id: save.spareClub, rating: BAND[d][1] };
    const ids = save.divisions[d - 1].filter(x => x !== save.club);
    const sid = 'CH:' + d + ':' + kind;
    const ratings = ids.map(id => ({ id, r: League.rating(save, id, d, 'challenge') })).sort((a, b) => b.r - a.r || (a.id < b.id ? -1 : 1));
    const avg = ratings.reduce((m, x) => m + x.r, 0) / ratings.length;
    if (kind === 'power') return { id: ratings[0].id, rating: Math.round((avg + 4) * 10) / 10 };
    const pick = ratings[hashStr(save.careerSeed + sid) % ratings.length];
    return { id: pick.id, rating: Math.round(avg * 10) / 10 };
  },
  medal(won, surv) { return !won ? 0 : surv >= 30 ? 3 : surv >= 15 ? 2 : 1; },
  record(save, d, kind, won, surv, out) {
    const k = Challenges.key(d, kind); const st = save.challenges.done[k] || (save.challenges.done[k] = { won: false, medal: 0, plays: 0, wins: 0 });
    st.plays++;
    if (!won) return { first: false };
    st.wins++;
    const first = tx(save, 'ch:first:' + k, () => { st.won = true; applyReward(save, Object.assign({ label: 'First win' }, Challenges.rewardFirst(d, kind)), out); });
    if (!first) applyReward(save, Object.assign({ label: 'Repeat win' }, Challenges.rewardRepeat(d)), out);
    if (kind === 'last') {
      const m = Challenges.medal(won, surv);
      for (let g = 2; g <= m; g++) tx(save, 'ch:medal:' + k + ':' + g, () => applyReward(save, Object.assign({ label: g === 3 ? 'Gold medal' : 'Silver medal' }, Challenges.medalBonus(d, g)), out));
      st.medal = Math.max(st.medal, m);
    } else st.medal = Math.max(st.medal, 1);
    if (CH_KINDS.every(x => save.challenges.done[Challenges.key(d, x)] && save.challenges.done[Challenges.key(d, x)].won))
      tx(save, 'ch:all:' + d, () => applyReward(save, { academy: { a5: 1 }, label: 'Board complete' }, out));
    return { first };
  }
};

// ======================= ArcadeCoach (Coach Analysis + Comeback Roadmap; never changes strength) =======================
const Coach = {
  analyze(save, res, snap) {
    const tips = [], up = save.upgrades, pw = res.powers, mine = pw ? pw.sides[0] : null, theirs = pw ? pw.sides[1] : null;
    const alive = res.alive || [0, 0], fb = res.football;
    const low = STAT_KEYS.slice().sort((a, b) => up[a] - up[b])[0], cost = Upgrades.cost(up[low]);
    const powerGap = snap ? snap.teamB.battle_profile.power_index - snap.teamA.battle_profile.power_index : 0;
    if (powerGap > 2 && cost != null) tips.push({ k: 'train', text: 'Rival power is ' + powerGap.toFixed(1) + ' higher. Train ' + low[0].toUpperCase() + low.slice(1) + ' (Lv ' + up[low] + ' → ' + (up[low] + 1) + ', ' + cost + ' C).' });
    if (fb && fb.shots[1] > fb.shots[0] + 2 && save.formation !== 'fortress') tips.push({ k: 'formation', text: 'They out-shot you ' + fb.shots[1] + '–' + fb.shots[0] + '. Try Iron Fortress for more defenders and keepers.' });
    else if (fb && fb.possession[0] < 42 && save.formation === 'attack') tips.push({ k: 'formation', text: 'You barely had the ball (' + fb.possession[0] + ' %). Balanced keeps more players around it.' });
    else if (alive[1] > alive[0] + 25 && save.formation !== 'balanced') tips.push({ k: 'formation', text: 'They kept ' + alive[1] + ' players standing. Balanced spreads your strength more evenly.' });
    if (mine && theirs && mine.total < theirs.total) {
      const ballFree = ['fortress', 'counter_shield', 'domino_impact', 'wild_ball', 'second_wind', 'iron_curtain', 'thunder_tackle', 'medical_rush', 'captains_rally', 'adrenaline_wave', 'bowling_charge'].filter(id => save.powers.unlocked[id] && save.powers.favs.indexOf(id) < 0);
      const needBall = save.powers.favs.filter(id => ['pinball_strike', 'golden_volley', 'meteor_shot', 'tactical_genius'].indexOf(id) >= 0);
      if (needBall.length && ballFree.length) tips.push({ k: 'power', text: 'Your Powers fired ' + mine.total + '× vs ' + theirs.total + '×. Swap ' + Powers.def(needBall[0]).name + ' for ' + Powers.def(ballFree[0]).name + ' (works without the ball).' });
    }
    const bench = Object.values(save.stars).filter(c => !Stars.isActive(save, c.id) && !Stars.canEquip(save, c.id)).sort((a, b) => Stars.effOvr(b) - Stars.effOvr(a))[0];
    if (bench && tips.length < 3) tips.push({ k: 'star', text: 'Put ' + Stars.def(bench.id).name + ' (OVR ' + Stars.effOvr(bench).toFixed(1) + ') into your active five.' });
    if (tips.length < 3 && (save.academy.a5 || save.academy.a10) && save.active.length) tips.push({ k: 'academy', text: 'Use your Academy Tickets on an active star for Star Mastery.' });
    if (tips.length < 3 && cost != null && save.credits >= cost && !tips.some(t => t.k === 'train')) tips.push({ k: 'train', text: 'You can afford Training now: ' + low + ' Lv ' + (up[low] + 1) + ' for ' + cost + ' C.' });
    return tips.slice(0, 3);
  },
  roadmap(save) {
    const steps = [], cheap = STAT_KEYS.map(k => [k, Upgrades.cost(save.upgrades[k])]).filter(x => x[1] != null).sort((a, b) => a[1] - b[1]);
    steps.push('Train ' + cheap.slice(0, 2).map(x => x[0]).join(' + ') + ' (' + cheap.slice(0, 2).reduce((m, x) => m + x[1], 0) + ' C total).');
    if (save.fragments >= PACKS.standard.frags || save.credits >= PACKS.standard.credits || save.packs.standard) steps.push('Open a Standard Draft Pack: a new permanent star.');
    else steps.push('Play the Challenge Board: first wins pay 1.25–1.5× a league win.');
    steps.push('Remember: one free REMATCH per fixture — change formation or Favorites before it.');
    return steps;
  }
};

// ======================= ArcadeEndgame / season flow =======================
function trophy(save, type, season, div, out) {
  return tx(save, 'trophy:' + type + ':' + season, () => { save.trophies.push({ type, season, div }); if (out) (out.trophies = out.trophies || []).push(type); });
}
const Endgame = {
  ENDLESS, SEASON_MS,
  // official fixture final result (after optional rematch). Rewards / Star XP / Power Mastery exactly once per fixture.
  finalizeFixture(save, fx, won, res, out, extra) {
    const L = save.league; out = out || {}; extra = extra || {};
    const ok = tx(save, 'fx:' + fx.id, () => {
      L.results[fx.id] = { a: fx.pair[0], b: fx.pair[1], winner: (fx.pair[0] === save.club) === won ? 0 : 1, ga: fx.pair[0] === save.club ? res.goals[0] : res.goals[1], gb: fx.pair[0] === save.club ? res.goals[1] : res.goals[0], surv: res.survivors, player: true };
      applyReward(save, Object.assign({ label: won ? 'League win' : 'League loss' }, Economy.league(L.div, won)), out);
      save.officialPlayed++; save.divPlayed[L.div] = (save.divPlayed[L.div] || 0) + 1;
      if (won) { save.stats.wins++; save.career.lossStreak = 0; } else { save.stats.losses++; save.career.lossStreak++; save.career.maxLossStreak = Math.max(save.career.maxLossStreak, save.career.lossStreak); }
      L.round = fx.round + 1;
      League.queueRound(save, fx.round);
      tx(save, 'founder', () => applyReward(save, { credits: 45, label: "Founder's Bonus" }, out));
      if (save.officialPlayed >= 3) tx(save, 'free:standard', () => applyReward(save, { packs: { standard: 1 }, label: 'Free Standard Pack' }, out));
      if (save.officialPlayed >= 10) tx(save, 'first10', () => applyReward(save, { academy: { a5: 1 }, label: 'First 10 fixtures' }, out));
      // Star XP + League Adaptation for the stars of the deciding battle
      for (const id of extra.starIds || []) if (save.stars[id]) { Stars.addXP(save, id, won ? 3 : 1, out); save.stars[id].battles = (save.stars[id].battles || 0) + 1; Stars.adapt(save, id, L.div, out); }
      if (extra.powUses) Powers.addMastery(save, extra.powUses, 'fx:' + fx.id, out);
      // Mobile League Milestones (D10–D2: first completion per Division; D1: every Endless season)
      const g = League.playerGames(save), ms = SEASON_MS[g];
      if (ms) { const id = L.div === 1 ? 'mlst:' + L.seasonId + ':' + g : 'mlst:D' + L.div + ':' + g; if (tx(save, id, () => applyReward(save, Object.assign({ label: ms.name + ' milestone' }, ms.r), out))) out.milestone = { games: g, name: ms.name }; }
      if (g >= 3 && !save.challenges.unlocked[L.div]) { save.challenges.unlocked[L.div] = true; out.challengesUnlocked = L.div; }
    });
    save.pendingDecision = null;
    if (ok) Powers.refreshUnlocks(save, out);
    out.applied = ok; out.lossStreak = save.career.lossStreak;
    return out;
  },
  closeSeason(save) {
    const L = save.league; if (!League.seasonComplete(save) || L.phase !== 'regular') return null;
    const out = {}; const rank = League.rank(save), d = L.div;
    tx(save, 'season:' + L.seasonId, () => {
      L.endRank = rank;
      tx(save, 'divdone:' + d, () => applyReward(save, { academy: { a5: 1 }, label: 'Division ' + d + ' completed' }, out));
      if (d === 1) {
        save.endless.seasons++;
        const r = ENDLESS(rank); if (r) applyReward(save, Object.assign({ label: 'Champions League season reward' }, r), out);
        if (rank === 1) {
          save.endless.titles++;
          trophy(save, 'endless_champion', L.seasonId, d, out);
          tx(save, 'firstD1title', () => { save.endless.firstTitle = true; trophy(save, 'd1_champion', L.seasonId, d, out); applyReward(save, { packs: { legend: 1 }, crest: true, label: 'First Division 1 title — Golden Champion Crest' }, out); out.firstTitle = true; });
        }
        L.phase = 'ended';
      } else if (rank <= 3) {
        applyReward(save, Economy.seasonBonus(d, rank, false), out);
        trophy(save, rank === 1 ? 'div_champion' : 'direct_promotion', L.seasonId, d, out);
        L.phase = 'promoted';
      } else L.phase = 'promo';
      save.history.push({ season: L.seasonId, div: d, rank, outcome: L.phase === 'promoted' ? (rank === 1 ? 'Champions · promoted' : 'Promoted') : d === 1 ? (rank === 1 ? 'Champions' : 'Finished ' + rank) : 'Finished ' + rank });
    });
    Powers.refreshUnlocks(save, out);
    out.rank = rank; out.div = d; out.phase = L.phase;
    return out;
  },
  promote(save) {
    const L = save.league, d = L.div; if (d <= 1 || L.phase !== 'promoted') return null;
    const out = {};
    tx(save, 'promoted:' + L.seasonId, () => {
      const up = save.divisions[d - 2], low = save.divisions[d - 1];
      const weakest = up.slice().sort((a, b) => club(a).power - club(b).power || (a < b ? -1 : 1))[0];
      up.splice(up.indexOf(weakest), 1, save.club); low.splice(low.indexOf(save.club), 1, weakest);
      save.division = d - 1; if (save.division < save.highestDiv) save.highestDiv = save.division;
      tx(save, 'reach:' + (d - 1), () => applyReward(save, { xp: 60, frags: 6, academy: { a10: 1 }, label: 'First promotion to Division ' + (d - 1) }, out));
      League.newSeason(save, d - 1);
    });
    Club.refreshCosmetics(save, out); Powers.refreshUnlocks(save, out);
    out.division = save.division;
    return out;
  },
  promoStart(save) {
    const L = save.league; if (L.phase !== 'promo') return null;
    if (save.promo && save.promo.season === L.seasonId && !save.promo.done) return save.promo;
    const n = save.promo && save.promo.season === L.seasonId ? save.promo.attempt + 1 : 1;
    const up = save.divisions[L.div - 2].slice().sort((a, b) => club(a).power - club(b).power || (a < b ? -1 : 1)).slice(0, 3);
    save.promo = { season: L.seasonId, attempt: n, opps: up, games: [], wins: 0, losses: 0, done: false, success: false };
    return save.promo;
  },
  promoRecord(save, won, out) {
    const P = save.promo; if (!P || P.done) return out;
    P.games.push(won ? 'W' : 'L'); if (won) P.wins++; else P.losses++;
    if (P.wins >= 2) {
      P.done = true; P.success = true;
      const L = save.league;
      tx(save, 'promobonus:' + L.seasonId, () => applyReward(save, Economy.seasonBonus(L.div, 4, true), out));
      trophy(save, 'promo_survivor', L.seasonId, L.div, out);
      L.phase = 'promoted';
      const h = save.history[save.history.length - 1]; if (h && h.season === L.seasonId) h.outcome = 'Promoted via Challenge';
    } else if (P.losses >= 2) { P.done = true; P.success = false; }
    return out;
  },
  replaySeason(save) { const L = save.league; if (L.phase !== 'promo') return null; return League.newSeason(save, L.div); },
  nextEndless(save) { const L = save.league; if (L.div !== 1 || L.phase !== 'ended') return null; return League.newSeason(save, 1); }
};

// ======================= ArcadeBattleAdapter =======================
function clubTeam(save, id, rating, tacticOverride) {
  const c = club(id), bp = c.src.battle_profile;
  const arch = tacticOverride || bp.archetype;
  const specials = tacticOverride ? (root.FW_ENGINE_CONFIG.archetype_definitions[arch] ? [root.FW_ENGINE_CONFIG.archetype_definitions[arch].special.toLowerCase()] : bp.specials) : bp.specials;
  return { id: c.id, name: c.displayName, display_name_tr: c.displayName, type: 'club', country: c.country, visual: Object.assign({}, c.src.visual),
    battle_profile: Object.assign({}, bp, { power_index: rating, archetype: arch, specials: specials.slice(0, 2), attributes: Object.assign({}, bp.attributes), roles_per_100: Object.assign({}, bp.roles_per_100) }) };
}
function playerTeam(save) {
  const p = save.profile, F = FORMATIONS[save.formation];
  const attrs = Upgrades.attributes(Upgrades.stats(save));
  return { id: PLAYER_CLUB, name: p.name, display_name_tr: p.name, short: p.short, type: 'club', country: 'Your club', player: true,
    visual: { primary_color: p.primary, secondary_color: p.secondary, kit_design: p.kit || 'solid' },
    battle_profile: { power_index: Upgrades.power(save), archetype: F.arch, attributes: attrs, roles_per_100: Object.assign({}, F.roles), specials: F.specials.slice(0, 2), formation: save.formation,
      formation_budget: formationBudget(save.formation), aggression: 62, variance: { team_form_std_pct: 9, unit_trait_std_pct: 14, critical_chance_pct: 7, critical_multiplier: 1.45, streak_adaptation: true } } };
}
function aiStars(save, d, count, key) {
  const rng = newRng(save, 'oppstars:' + key);
  const out = [], used = new Set();
  const rar = d <= 2 ? ['legendary', 'epic', 'epic', 'rare', 'rare'] : d <= 5 ? ['epic', 'rare', 'rare', 'common', 'common'] : ['rare', 'common', 'common', 'common', 'common'];
  for (let i = 0; i < count; i++) {
    const pool = DATA.STARS.filter(s => s.rarity === rar[i] && !used.has(s.id) && s.role !== 'captain');
    const s = pool[rng.int(pool.length)]; used.add(s.id);
    const or = ovrRange(d, s.rarity); out.push(Stars.unitSpec(s.id, or[0] + rng.int(or[1] - or[0] + 1), 0));
  }
  return out;
}
const AI_STARS = d => d <= 1 ? 3 : d <= 4 ? 2 : d <= 7 ? 1 : 0; // league rivals: Division-appropriate star contribution
const Battle = {
  ARC_CFG, MECH,
  snapshot(save, kind, ctx) {
    const L = save.league, d = kind === 'challenge' ? ctx.div : L.div;
    let oppId, oppRating, fixtureId, oppStars = [], attempt = 1, label;
    if (kind === 'league') { const fx = League.playerFixture(save); oppId = fx.opp; fixtureId = fx.id; oppRating = League.rating(save, oppId, d, L.seasonId); attempt = ctx && ctx.attempt || 1; label = (d === 1 ? 'Champions League' : 'Division ' + d) + ' · Match ' + (fx.round + 1) + '/19'; oppStars = aiStars(save, d, AI_STARS(d), fx.id); }
    else if (kind === 'promo') { const P = save.promo; oppId = P.opps[P.games.length]; oppRating = League.rating(save, oppId, d - 1, L.seasonId); fixtureId = L.seasonId + ':PROMO' + P.attempt + ':G' + (P.games.length + 1); label = 'Promotion Challenge · Game ' + (P.games.length + 1); oppStars = aiStars(save, d - 1, AI_STARS(d - 1), fixtureId); }
    else { const o = Challenges.opponent(save, d, ctx.kind); oppId = o.id; oppRating = o.rating; const k = Challenges.key(d, ctx.kind); const st = save.challenges.done[k]; const plays = st ? st.plays : 0; fixtureId = 'CH:' + k + ':P' + (plays + 1);
      oppStars = ctx.kind === 'signature' ? aiStars(save, d, Challenges.oppStars(d), k + ':' + plays) : aiStars(save, d, AI_STARS(d), k + ':' + plays);
      label = CH_INFO[ctx.kind].name + ' · Division ' + d; }
    const battleId = 'B' + (save.stats.battles + 1) + ':' + fixtureId + ':A' + attempt;
    const tactic = kind === 'league' && L.tactics ? L.tactics[oppId] : null;
    const seed = seedOf(save, 'battle:' + battleId);
    return {
      v: 3, battleId, fixtureId, seasonId: L.seasonId, kind, ctx: ctx || {}, attempt, label, div: d, seed, mech: MECH, formation: save.formation, arc: { advCap: ARC_CFG.advCap, advScale: ARC_CFG.advScale },
      teamA: playerTeam(save), teamB: clubTeam(save, oppId, oppRating, tactic),
      stars: Stars.battleList(save), starIds: save.active.filter(id => save.stars[id]), oppStars,
      powers: [Powers.loadout(save, battleId), Powers.aiLoadout(kind === 'promo' ? d - 1 : d, seedOf(save, 'aipow:' + battleId))],
      profile: Object.assign({}, save.profile), stage: stageOf(save.highestDiv), banner: !!save.cosmetics.banner, goldenCrest: !!save.goldenCrest, created: Date.now()
    };
  },
  worldOpts(snap, o) {
    o = o || {};
    const base = { seed: snap.seed, teamA: snap.teamA, teamB: snap.teamB, cfg: root.FW_ENGINE_CONFIG, duration: 'standard', fxLevel: o.fxLevel == null ? 1 : o.fxLevel, ruleset: 'fusion', fbIntensity: 'normal', headless: !!o.headless };
    const cfg = snap.arc || ARC_LEGACY;
    const A = { advCap: cfg.advCap, advScale: cfg.advScale, stars: [snap.stars, snap.oppStars || []] };
    if (snap.mech === 'glory') return Object.assign(base, { goalAdv: false, arcade: Object.assign(A, { mech: 'glory', cmdModes: ['off', 'off'], powers: snap.powers }) });
    if (snap.mech === 'mayhem') return Object.assign(base, { goalAdv: false, arcade: Object.assign(A, { mech: 'mayhem', cmdModes: [o.auto ? 'auto' : 'manual', 'ai'], cmds: o.cmds || [] }) }); // pre-Glory unfinished battle
    return Object.assign(base, { goalAdv: true, arcade: Object.assign(A, { momentum: [o.auto ? 'normal' : 'manual', snap.aiMom || 'normal'], inputs: o.inputs || [] }) }); // pre-Mayhem unfinished battle
  },
  aiOpts(save, job) {
    const L = save.league;
    const ta = clubTeam(save, job.a, League.rating(save, job.a, job.div, job.seasonId), L.tactics && L.tactics[job.a]);
    const tb = clubTeam(save, job.b, League.rating(save, job.b, job.div, job.seasonId), L.tactics && L.tactics[job.b]);
    const n = AI_STARS(job.div);
    return { seed: job.seed, teamA: ta, teamB: tb, cfg: root.FW_ENGINE_CONFIG, duration: 'standard', fxLevel: 0, ruleset: 'fusion', fbIntensity: 'normal', goalAdv: false, headless: true,
      arcade: { advCap: ARC_CFG.advCap, advScale: ARC_CFG.advScale, stars: [aiStars(save, job.div, n, job.fixtureId + ':a'), aiStars(save, job.div, n, job.fixtureId + ':b')], mech: 'glory', cmdModes: ['off', 'off'],
        powers: [Powers.aiLoadout(job.div, seedOf(save, 'aipow:' + job.fixtureId + ':a')), Powers.aiLoadout(job.div, seedOf(save, 'aipow:' + job.fixtureId + ':b'))] } };
  },
  result(w) {
    const s = E.summaryV4(w), a = E.arcSummary(w), m = E.maySummary(w), p = E.powSummary(w);
    return { winner: s.winner, won: s.winner === 0, survivors: s.survivors, alive: [w.teams[0].alive, w.teams[1].alive], goals: s.football ? s.football.goals.slice() : [0, 0],
      hash: s.hash, battleSeconds: s.battleSeconds, endTick: w.endTick, football: s.football, momentum: a ? a.momentum : [], inputs: a ? a.inputs : [], stars: a ? a.stars : [], kills: s.kills, tiebreak: s.tiebreak,
      mayhem: m, cmds: m ? m.inputs : [], powers: p };
  },
  runSlice(w, ticks) { let n = 0; while (w.phase !== 'ended' && w.t < 90 && n++ < ticks) { E.step(w); if (w.headless && w.events.length > 4000) w.events.length = 0; } return w.phase === 'ended' || w.t >= 90; },
  simulate(opts) { const w = E.createWorld(opts); while (!Battle.runSlice(w, 100000)); return w; },
  begin(save, snap) { // permanent stars: nothing is consumed
    save.pendingBattle = { snap, inputs: [], cmds: [], lastTick: 0, startedAt: Date.now() };
    save.stats.battles++;
  },
  finish(save, snap, res) {
    const out = { kind: snap.kind, won: res.won, res, snap, rewards: {} };
    if (!save.pendingBattle || save.pendingBattle.snap.battleId !== snap.battleId) { out.stale = true; return out; }
    save.pendingBattle = null;
    save.stats.goals += res.goals[0];
    // career counters from this real battle (unlock conditions)
    if (res.football) { save.career.ballWins += (res.football.steals[0] || 0) + (res.football.intercepts[0] || 0); save.career.goals += res.goals[0]; }
    if (res.mayhem) { const M = res.mayhem.sides[0]; save.career.reinforcements += M.entered; save.career.chains += M.chains; save.career.rampages += M.rampages;
      if (snap.mech === 'mayhem') { const W = save.wc || (save.wc = newWC()); W.commands += M.commands; W.kick += M.kick; W.rush += M.rush; W.iron += M.iron; W.pkGoals += M.pkGoals; W.rushHits += M.rushHits; W.ironStops += M.ironStops; W.chains += M.chains; W.rampages += M.rampages; W.reinforcements += M.entered; } }
    for (const m of res.momentum || []) if (m.side === 0) { save.stats.strikes++; if (m.q === 'perfect') save.stats.perfects++; }
    const powUses = res.powers ? res.powers.sides[0].uses : null;
    if (snap.kind === 'league') {
      const fx = League.playerFixture(save);
      if (!fx || fx.id !== snap.fixtureId) { out.stale = true; return out; }
      if (!res.won && snap.attempt === 1) { save.pendingDecision = { fixtureId: fx.id, res: { goals: res.goals, survivors: res.survivors }, starIds: snap.starIds, powUses }; out.canRematch = true; }
      else Endgame.finalizeFixture(save, fx, res.won, res, out.rewards, { starIds: snap.starIds, powUses });
    } else if (snap.kind === 'promo') {
      Endgame.promoRecord(save, res.won, out.rewards); out.promo = save.promo;
      if (res.won) save.stats.wins++; else save.stats.losses++;
    } else {
      const r = Challenges.record(save, snap.div, snap.ctx.kind, res.won, res.survivors, out.rewards);
      if (r.first) { for (const id of snap.starIds || []) Stars.addXP(save, id, 2, out.rewards); if (powUses) Powers.addMastery(save, powUses, 'ch:' + snap.fixtureId, out.rewards); } // repeats: no Star XP / Mastery
      out.medal = snap.ctx.kind === 'last' ? Challenges.medal(res.won, res.survivors) : 0;
      if (res.won) save.stats.wins++; else save.stats.losses++;
    }
    Powers.refreshUnlocks(save, out.rewards);
    if (!res.won && !res.abandoned) out.coach = Coach.analyze(save, res, snap);
    if (save.career.lossStreak >= 3 && snap.kind === 'league' && !out.canRematch) out.roadmap = Coach.roadmap(save);
    save.lastResult = { kind: snap.kind, won: res.won, label: snap.label, goals: res.goals, survivors: res.survivors, opp: snap.teamB.id, at: Date.now() };
    return out;
  },
  acceptLoss(save) {
    const D = save.pendingDecision; if (!D) return null;
    const fx = League.playerFixture(save); if (!fx || fx.id !== D.fixtureId) { save.pendingDecision = null; return null; }
    const out = Endgame.finalizeFixture(save, fx, false, D.res, {}, { starIds: D.starIds, powUses: D.powUses });
    if (save.career.lossStreak >= 3) out.roadmap = Coach.roadmap(save);
    return out;
  },
  abandon(save) {
    const P = save.pendingBattle; if (!P) return null;
    const res = { won: false, winner: 1, survivors: 0, goals: [0, 0], momentum: [], inputs: [], stars: [], alive: [0, 0], abandoned: true };
    return Battle.finish(save, P.snap, res);
  }
};

const Arcade = { VERSION: SAVE_VERSION, MECH, PLAYER_CLUB, tx, clubs, club, Club, Save, Upgrades, Progression, Economy, Powers, Stars, Draft, League, Challenges, Coach, Endgame, Battle,
  FORMATIONS, formationBudget, PLAYER_ROLES, RARITIES, OVR_REF, PACKS, SEASON_MS, applyReward, seedOf, stageOf };
root.Arcade = Arcade;
if (typeof module !== 'undefined' && module.exports) module.exports = Arcade;
Arcade.FORM_CAL = FORM_CAL;
})(typeof window !== 'undefined' ? window : globalThis);
