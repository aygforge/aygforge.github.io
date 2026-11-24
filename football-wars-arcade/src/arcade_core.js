/* FOOTBALL WARS — ARCADE REBORN: game logic modules (no DOM; node-testable).
 * ArcadeSave · ArcadeEconomy · ArcadeUpgrades · ArcadeProgression · ArcadeStars · ArcadeDraft · ArcadeLeague
 * ArcadeChallenges · ArcadeEndgame · ArcadeBattleAdapter
 * Every reward-producing operation goes through Arcade.tx(save, claimId, fn): a claim id is stored once,
 * so the same fixture / level / milestone / season / pack can never pay twice (also after reloads). */
(function (root) {
'use strict';
const E = root.FWEngine, DATA = root.ArcadeData;
const Rng = E.Rng, hashStr = E.hashStr;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const SAVE_VERSION = 1;
const DEFAULT_SETTINGS = { master: 0.8, music: 0.5, sfx: 0.8, crowd: 0.6, mute: false, vibration: true, quality: 'medium', speed: 1, smartCam: true };
const ROLES = E.ROLES;
const STAT_KEYS = ['attack', 'defense', 'speed', 'technique', 'stamina'];
const STAT_BASE = { attack: 38, defense: 37, speed: 40, technique: 36, stamina: 39 };
const STAT_STEP = 1.65, MAX_UP = 30;
const PLAYER_ROLES = { striker: 16, winger: 14, playmaker: 12, defender: 34, goalkeeper: 8, support: 15, captain: 1 };
const RARITIES = ['common', 'rare', 'epic', 'legendary'];
const RARITY_TIER = { common: 1, rare: 2, epic: 3, legendary: 4 };
const CONTRACT = { common: [18, 30], rare: [12, 24], epic: [7, 18], legendary: [5, 14] };
const WIN_C = { 10: 120, 9: 160, 8: 220, 7: 300, 6: 410, 5: 570, 4: 780, 3: 1050, 2: 1450, 1: 2000 };
const LOSS_C = { 10: 45, 9: 60, 8: 80, 7: 110, 6: 150, 5: 210, 4: 290, 3: 390, 2: 550, 1: 750 };
// opponent club rating bands per division (arcade power scale shared with the player's upgrade power)
const BAND = { 10: [32, 44], 9: [38, 50], 8: [45, 57], 7: [52, 64], 6: [58, 70], 5: [63, 75], 4: [68, 80], 3: [73, 85], 2: [78, 90], 1: [85, 97] };
const ARC_CFG = { advCap: 0.35, advScale: 18 };
const PACKS = {
  standard: { credits: 450, frags: 12, unlockDiv: 10, slots: [{ common: 70, rare: 26, epic: 3.5, legendary: 0.5 }, { common: 70, rare: 26, epic: 3.5, legendary: 0.5 }, { rare: 85, epic: 14, legendary: 1 }] },
  premium: { credits: 1350, frags: 36, unlockDiv: 8, slots: [{ common: 20, rare: 58, epic: 20, legendary: 2 }, { common: 20, rare: 58, epic: 20, legendary: 2 }, { epic: 92, legendary: 8 }], pity: 9 },
  legend: { credits: 4000, frags: 100, unlockDiv: 5, slots: [{ rare: 55, epic: 38, legendary: 7 }, { rare: 55, epic: 38, legendary: 7 }, { epic: 75, legendary: 25 }], pity: 3 }
};
// star OVR reference ranges (Division 10 / 7 / 4 / 1) — linear interpolation in between (monotone)
const OVR_REF = { 10: { common: [44, 50], rare: [50, 58], epic: [58, 67], legendary: [66, 75] }, 7: { common: [54, 61], rare: [60, 68], epic: [67, 77], legendary: [76, 86] },
  4: { common: [64, 71], rare: [70, 79], epic: [78, 88], legendary: [86, 95] }, 1: { common: [75, 81], rare: [80, 87], epic: [86, 94], legendary: [92, 99] } };
const MILESTONES = {
  5: { packs: { standard: 1 } }, 10: { tickets: { t5: 1 } }, 15: { credits: 250, frags: 6 }, 20: { packs: { premium: 1 } }, 25: { tickets: { t10: 1 } },
  30: { packs: { legend: 1 } }, 35: { credits: 750, frags: 12 }, 40: { packs: { premium: 1 }, tickets: { t10: 1 } }, 45: { packs: { legend: 1 } }, 50: { packs: { legend: 1 }, crest: true }
};
const CH_KINDS = ['power', 'last', 'signature'];
const CH_INFO = { power: { name: 'Power Clash', mul: 1.5 }, last: { name: 'Last Stand', mul: 1.25 }, signature: { name: 'Signature Showdown', mul: 1.5 } };
const ENDLESS = r => r === 1 ? { credits: 10000, packs: { premium: 1 }, tickets: { t10: 1 } } : r <= 3 ? { credits: 6000, tickets: { t5: 1 } } : r <= 10 ? { credits: 2000 } : null;

// ======================= club catalogue (200) =======================
let CLUBS = null, CLUB_BY = null;
function clubs() {
  if (CLUBS) return CLUBS;
  const src = root.FW_MASTER_DB.clubs.concat(DATA.EXTRA_CLUBS);
  CLUBS = src.map(c => ({ id: c.id, sourceName: c.name, displayName: DATA.DISPLAY[c.id], country: c.country, cc: c.country_code, league: c.league_id, power: c.battle_profile.power_index, archetype: c.battle_profile.archetype, src: c }));
  CLUB_BY = new Map(CLUBS.map(c => [c.id, c]));
  return CLUBS;
}
function club(id) { clubs(); return CLUB_BY.get(id); }

// ======================= helpers =======================
function roundTo5(v) { return Math.round(v / 5) * 5; }
function seedOf(save, s) { return (hashStr(save.careerSeed + '|' + s) % 4294967295) >>> 0; }
function newRng(save, s) { return new Rng(seedOf(save, s)); }
function rollTable(rng, table) { let x = rng.next() * 100, last = null; for (const k in table) { last = k; x -= table[k]; if (x < 0) return k; } return last; }
function addPacks(save, packs) { for (const k in packs || {}) save.packs[k] = (save.packs[k] || 0) + packs[k]; }
function addTickets(save, t) { for (const k in t || {}) save.tickets[k] = (save.tickets[k] || 0) + t[k]; }
function applyReward(save, r, out) {
  if (!r) return;
  if (r.credits) save.credits += r.credits;
  if (r.frags) save.fragments += r.frags;
  if (r.packs) addPacks(save, r.packs);
  if (r.tickets) addTickets(save, r.tickets);
  if (r.crest) save.goldenCrest = true;
  if (out) mergeReward(out, r);
  if (r.xp) Progression.addXP(save, r.xp, out);
}
function mergeReward(out, r) {
  out.credits = (out.credits || 0) + (r.credits || 0); out.frags = (out.frags || 0) + (r.frags || 0); out.xp = (out.xp || 0) + (r.xp || 0);
  if (r.packs) { out.packs = out.packs || {}; for (const k in r.packs) out.packs[k] = (out.packs[k] || 0) + r.packs[k]; }
  if (r.tickets) { out.tickets = out.tickets || {}; for (const k in r.tickets) out.tickets[k] = (out.tickets[k] || 0) + r.tickets[k]; }
  if (r.crest) out.crest = true;
  if (r.label) (out.labels = out.labels || []).push(r.label);
}
// transaction: run fn once per claim id (idempotent rewards)
function tx(save, id, fn) {
  if (save.claims[id]) return false;
  save.claims[id] = save.txn = (save.txn || 0) + 1;
  fn();
  return true;
}

// ======================= ArcadeSave =======================
const Save = {
  KEY: 'fwa_save_v1', BAK: 'fwa_save_v1_bak',
  fresh(clubId, careerSeed) {
    const s = {
      v: SAVE_VERSION, kind: 'football-wars-arcade', created: Date.now(), careerSeed: careerSeed >>> 0, club: clubId,
      credits: 0, fragments: 0, tickets: { t5: 0, t10: 0 }, xp: 0, level: 1, goldenCrest: false,
      upgrades: { attack: 1, defense: 1, speed: 1, technique: 1, stamina: 1 },
      packs: { standard: 0, premium: 0, legend: 0 }, pity: { premium: 0, legend: 0 }, packCounter: 0, ticketCounter: 0, pendingDraft: null,
      stars: {}, active: [],
      division: 10, highestDiv: 10, seasonNo: 0, officialPlayed: 0, divPlayed: {},
      divisions: null, league: null, history: [], challenges: { unlocked: {}, done: {} },
      endless: { seasons: 0, titles: 0, firstTitle: false }, stats: { battles: 0, wins: 0, losses: 0, goals: 0, strikes: 0, perfects: 0 },
      claims: {}, txn: 0, pendingBattle: null, pendingDecision: null, promo: null, lastResult: null,
      settings: Object.assign({}, DEFAULT_SETTINGS)
    };
    League.assignDivisions(s);
    League.newSeason(s, 10);
    return s;
  },
  validate(s) {
    const errs = [];
    if (!s || typeof s !== 'object') return ['not an object'];
    if (s.kind !== 'football-wars-arcade') errs.push('kind');
    if (typeof s.v !== 'number' || s.v > SAVE_VERSION) errs.push('version');
    if (!club(s.club)) errs.push('club');
    for (const k of ['credits', 'fragments', 'xp', 'level', 'division', 'highestDiv']) if (typeof s[k] !== 'number' || !isFinite(s[k]) || s[k] < 0) errs.push(k);
    if (!s.upgrades || STAT_KEYS.some(k => !(s.upgrades[k] >= 1 && s.upgrades[k] <= MAX_UP))) errs.push('upgrades');
    if (!Array.isArray(s.divisions) || s.divisions.length !== 10 || s.divisions.some(d => !Array.isArray(d) || d.length !== 20)) errs.push('divisions');
    else { const all = [].concat(...s.divisions); if (new Set(all).size !== 200 || all.some(id => !club(id))) errs.push('division clubs'); if (s.divisions[s.division - 1].indexOf(s.club) < 0) errs.push('player division'); }
    if (!s.league || !Array.isArray(s.league.rounds) || s.league.rounds.length !== 19) errs.push('league');
    if (!s.stars || typeof s.stars !== 'object' || !Array.isArray(s.active) || s.active.length > 5) errs.push('stars');
    if (!s.claims || typeof s.claims !== 'object') errs.push('claims');
    return errs;
  },
  migrate(s) {
    if (!s || typeof s !== 'object') return s;
    // v1 is the first arcade schema; future versions add fields here without resetting progress.
    s.settings = Object.assign({}, DEFAULT_SETTINGS, s.settings || {});
    if (!s.stats) s.stats = { battles: 0, wins: 0, losses: 0, goals: 0, strikes: 0, perfects: 0 };
    if (!s.challenges) s.challenges = { unlocked: {}, done: {} };
    if (!s.endless) s.endless = { seasons: 0, titles: 0, firstTitle: false };
    if (!s.divPlayed) s.divPlayed = {};
    return s;
  },
  serialize(s) { return JSON.stringify(s); },
  parse(txt) { const s = Save.migrate(JSON.parse(txt)); const e = Save.validate(s); if (e.length) throw new Error('Invalid save: ' + e.join(', ')); return s; }
};

// ======================= ArcadeUpgrades =======================
const Upgrades = {
  KEYS: STAT_KEYS, BASE: STAT_BASE, MAX: MAX_UP,
  cost(L) { return L >= MAX_UP ? null : roundTo5(90 * Math.pow(1.16, L - 1)); },
  value(key, L) { return +(STAT_BASE[key] + (L - 1) * STAT_STEP).toFixed(2); },
  stats(save) { const o = {}; for (const k of STAT_KEYS) o[k] = Upgrades.value(k, save.upgrades[k]); return o; },
  // 5 arcade stats -> the 10 real V4 battle attributes
  attributes(st) {
    const r = v => clamp(Math.round(v * 10) / 10, 1, 99);
    return {
      attack: r(st.attack), defense: r(st.defense), speed: r(st.speed), pressing: r((st.speed + st.defense + st.stamina) / 3), stamina: r(st.stamina),
      teamwork: r((st.technique + st.stamina) / 2), physical: r((st.defense + st.stamina) / 2), technique: r(st.technique),
      goalkeeping: r((st.defense + st.technique) / 2), finishing: r((st.attack + st.technique) / 2)
    };
  },
  power(save) { const a = Upgrades.attributes(Upgrades.stats(save)); let m = 0; for (const k of E.ATTRS) m += a[k]; return Math.round(m / E.ATTRS.length * 10) / 10; },
  buy(save, key) {
    const L = save.upgrades[key]; const c = Upgrades.cost(L);
    if (c == null || save.credits < c) return false;
    save.credits -= c; save.upgrades[key] = L + 1; return true;
  }
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
        const r = { credits: Progression.levelCredits(nl) }; applyReward(save, r, out);
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

// ======================= ArcadeStars =======================
const STAR_BY = new Map(DATA.STARS.map(s => [s.id, s]));
const Stars = {
  defs: DATA.STARS, def: id => STAR_BY.get(id), TIER: RARITY_TIER,
  list(save) { return Object.values(save.stars); },
  isActive(save, id) { return save.active.indexOf(id) >= 0; },
  canEquip(save, id) {
    const c = save.stars[id]; if (!c || c.contract <= 0) return 'No contract left';
    if (Stars.isActive(save, id)) return 'Already active';
    if (save.active.length >= 5) return 'All 5 slots are full';
    const d = Stars.def(id);
    const sameRole = save.active.filter(a => Stars.def(a).role === d.role).length;
    if (sameRole >= PLAYER_ROLES[d.role]) return 'Only ' + PLAYER_ROLES[d.role] + ' ' + d.role + ' slot in the squad';
    return null;
  },
  equip(save, id) { if (Stars.canEquip(save, id)) return false; save.active.push(id); return true; },
  remove(save, id) { const i = save.active.indexOf(id); if (i < 0) return false; save.active.splice(i, 1); return true; },
  replace(save, oldId, newId) {
    const i = save.active.indexOf(oldId); if (i < 0) return false;
    save.active.splice(i, 1); if (Stars.canEquip(save, newId)) { save.active.splice(i, 0, oldId); return false; }
    save.active.splice(i, 0, newId); return true;
  },
  renew(save, id, kind) {
    const c = save.stars[id]; const k = kind === 't10' ? 't10' : 't5';
    if (!c || !(save.tickets[k] > 0)) return false;
    const n = ++save.ticketCounter;
    return tx(save, 'ticket:' + n, () => { save.tickets[k]--; c.contract += k === 't10' ? 10 : 5; });
  },
  // battle start: every active star in the snapshot spends exactly one match (once per battle id)
  consume(save, battleId, ids) {
    return tx(save, 'contract:' + battleId, () => {
      for (const id of ids) { const c = save.stars[id]; if (!c) continue; c.contract = Math.max(0, c.contract - 1); c.battles = (c.battles || 0) + 1; }
    });
  },
  cleanupExpired(save) { save.active = save.active.filter(id => save.stars[id] && save.stars[id].contract > 0); },
  battleList(save) { return save.active.filter(id => save.stars[id] && save.stars[id].contract > 0).map(id => Stars.unitSpec(id, save.stars[id].ovr)); },
  unitSpec(id, ovr) { const d = Stars.def(id); return { id, name: d.name, role: d.role, ovr, rarity: d.rarity, ability: d.ability, tier: RARITY_TIER[d.rarity] }; }
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
  // pay = 'credits' | 'frags' | 'inventory'
  canOpen(save, type, pay) {
    if (save.pendingDraft) return 'Pick a star from your open draft first';
    if (!Draft.unlocked(save, type)) return 'Unlocks in Division ' + PACKS[type].unlockDiv;
    if (pay === 'credits' && save.credits < PACKS[type].credits) return 'Not enough Credits';
    if (pay === 'frags' && save.fragments < PACKS[type].frags) return 'Not enough Pack Fragments';
    if (pay === 'inventory' && !(save.packs[type] > 0)) return 'No unopened pack';
    return null;
  },
  // atomic: payment + RNG + pity + pending candidates are written together (then persisted by the caller)
  open(save, type, pay) {
    if (Draft.canOpen(save, type, pay)) return null;
    const n = ++save.packCounter, P = PACKS[type];
    const rng = newRng(save, 'pack:' + n);
    let rar = P.slots.map(t => rollTable(rng, t));
    let pityHit = false;
    if (P.pity && save.pity[type] >= P.pity && rar.indexOf('legendary') < 0) { rar[2] = 'legendary'; pityHit = true; }
    const cands = [], usedIds = new Set();
    for (let i = 0; i < 3; i++) {
      const pool = DATA.STARS.filter(s => s.rarity === rar[i] && !usedIds.has(s.id));
      const d = pool[rng.int(pool.length)]; usedIds.add(d.id); cands.push(d);
    }
    if (new Set(cands.map(c => c.role)).size < 2) { // guarantee at least two positions
      const pool = DATA.STARS.filter(s => s.rarity === rar[0] && s.role !== cands[1].role && !usedIds.has(s.id));
      cands[0] = pool[rng.int(pool.length)];
    }
    const out = cands.map(d => {
      const cr = CONTRACT[d.rarity], contract = cr[0] + rng.int(cr[1] - cr[0] + 1);
      const or = ovrRange(save.highestDiv, d.rarity), ovr = or[0] + rng.int(or[1] - or[0] + 1);
      const owned = save.stars[d.id];
      return { id: d.id, rarity: d.rarity, contract, ovr: owned ? owned.ovr : ovr, rolledOvr: ovr, dup: !!owned };
    });
    if (P.pity) save.pity[type] = out.some(c => c.rarity === 'legendary') ? 0 : save.pity[type] + 1;
    if (pay === 'credits') save.credits -= P.credits; else if (pay === 'frags') save.fragments -= P.frags; else save.packs[type]--;
    save.pendingDraft = { n, type, pay, cands: out, pityHit, at: Date.now() };
    return save.pendingDraft;
  },
  pick(save, idx) {
    const D = save.pendingDraft; if (!D || !D.cands[idx]) return null;
    const c = D.cands[idx]; let res = null;
    tx(save, 'draft:' + D.n, () => {
      const owned = save.stars[c.id];
      if (owned) { owned.contract += c.contract; res = { merged: true, id: c.id, added: c.contract, total: owned.contract }; }
      else { save.stars[c.id] = { id: c.id, ovr: c.ovr, contract: c.contract, rarity: c.rarity, got: Date.now(), battles: 0 }; res = { merged: false, id: c.id, total: c.contract }; }
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
  for (let r = 0; r < n - 1; r++) {
    const m = [];
    for (let i = 0; i < n / 2; i++) m.push([t[i], t[n - 1 - i]]);
    rounds.push(m);
    t.splice(1, 0, t.pop()); // circle method: first fixed
  }
  return rounds;
}
const League = {
  BAND,
  assignDivisions(save) {
    const others = clubs().filter(c => c.id !== save.club).sort((a, b) => b.power - a.power || (a.id < b.id ? -1 : 1));
    const div = [];
    for (let d = 0; d < 9; d++) div.push(others.slice(d * 20, d * 20 + 20).map(c => c.id));
    div.push(others.slice(180).map(c => c.id).concat([save.club]));
    save.divisions = div;
  },
  divClubs(save, d) { return save.divisions[d - 1]; },
  // arcade rating of an AI club in a division: band position by source strength + small seasonal variation
  rating(save, id, d, seasonId) {
    if (id === save.club) return Upgrades.power(save);
    const list = save.divisions[d - 1].filter(x => x !== save.club).map(x => club(x)).sort((a, b) => a.power - b.power || (a.id < b.id ? -1 : 1));
    const i = list.findIndex(c => c.id === id), f = list.length > 1 ? i / (list.length - 1) : 0.5;
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
    // Division 1 endless: per-season tactical variation of AI clubs (identity kept)
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
  // AI fixtures of a round become jobs (simulated for real by ArcadeBattleAdapter, headless)
  queueRound(save, r) {
    const L = save.league;
    for (const m of L.rounds[r]) { if (m[0] === save.club || m[1] === save.club) continue; const id = League.fixtureId(L, r, m[0], m[1]); if (!L.results[id] && L.aiQueue.indexOf(id) < 0) L.aiQueue.push(id); }
  },
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

// ======================= ArcadeChallenges =======================
const Challenges = {
  KINDS: CH_KINDS, INFO: CH_INFO,
  key: (d, k) => 'D' + d + ':' + k,
  unlocked(save, d) { return !!save.challenges.unlocked[d]; },
  rewardFirst(d, kind) { return { credits: Math.round(WIN_C[d] * CH_INFO[kind].mul), xp: 30, frags: 3 }; },
  rewardRepeat(d) { return { credits: Math.round(WIN_C[d] * 0.25) }; },
  medalBonus(d, medal) { return medal === 2 ? { credits: roundTo5(WIN_C[d] / 6), frags: 1 } : medal === 3 ? { credits: roundTo5(WIN_C[d] / 3), frags: 1 } : null; },
  oppStars(d) { return d <= 2 ? 5 : d <= 4 ? 4 : d <= 6 ? 3 : d <= 8 ? 2 : 1; },
  opponent(save, d, kind) {
    const ids = save.divisions[d - 1].filter(x => x !== save.club);
    const sid = 'CH:' + d + ':' + kind;
    const ratings = ids.map(id => ({ id, r: League.rating(save, id, d, 'challenge') })).sort((a, b) => b.r - a.r || (a.id < b.id ? -1 : 1));
    const avg = ratings.reduce((m, x) => m + x.r, 0) / ratings.length;
    if (kind === 'power') return { id: ratings[0].id, rating: Math.round((avg + 4) * 10) / 10 };
    const pick = ratings[hashStr(save.careerSeed + sid) % ratings.length];
    return { id: pick.id, rating: Math.round(avg * 10) / 10 };
  },
  medal(won, surv) { return !won ? 0 : surv >= 30 ? 3 : surv >= 15 ? 2 : 1; },
  // returns reward summary; never touches league standings
  record(save, d, kind, won, surv, out) {
    const k = Challenges.key(d, kind); const st = save.challenges.done[k] || (save.challenges.done[k] = { won: false, medal: 0, plays: 0, wins: 0 });
    st.plays++;
    if (!won) return out;
    st.wins++;
    const first = tx(save, 'ch:first:' + k, () => { st.won = true; applyReward(save, Object.assign({ label: 'First win' }, Challenges.rewardFirst(d, kind)), out); });
    if (!first) applyReward(save, Object.assign({ label: 'Repeat win' }, Challenges.rewardRepeat(d)), out);
    if (kind === 'last') {
      const m = Challenges.medal(won, surv);
      for (let g = 2; g <= m; g++) tx(save, 'ch:medal:' + k + ':' + g, () => applyReward(save, Object.assign({ label: g === 3 ? 'Gold medal' : 'Silver medal' }, Challenges.medalBonus(d, g)), out));
      st.medal = Math.max(st.medal, m);
    } else st.medal = Math.max(st.medal, 1);
    if (CH_KINDS.every(x => save.challenges.done[Challenges.key(d, x)] && save.challenges.done[Challenges.key(d, x)].won))
      tx(save, 'ch:all:' + d, () => applyReward(save, { tickets: { t5: 1 }, label: 'Board complete' }, out));
    return out;
  }
};

// ======================= ArcadeEndgame / season flow =======================
const Endgame = {
  ENDLESS,
  // official fixture final result (after optional rematch). Rewards exactly once per fixture.
  finalizeFixture(save, fx, won, res, out) {
    const L = save.league; out = out || {};
    const ok = tx(save, 'fx:' + fx.id, () => {
      L.results[fx.id] = { a: fx.pair[0], b: fx.pair[1], winner: (fx.pair[0] === save.club) === won ? 0 : 1, ga: fx.pair[0] === save.club ? res.goals[0] : res.goals[1], gb: fx.pair[0] === save.club ? res.goals[1] : res.goals[0], surv: res.survivors, player: true };
      applyReward(save, Object.assign({ label: won ? 'League win' : 'League loss' }, Economy.league(L.div, won)), out);
      save.officialPlayed++; save.divPlayed[L.div] = (save.divPlayed[L.div] || 0) + 1;
      if (won) save.stats.wins++; else save.stats.losses++;
      L.round = fx.round + 1;
      League.queueRound(save, fx.round);
      if (save.officialPlayed >= 3) tx(save, 'free:standard', () => applyReward(save, { packs: { standard: 1 }, label: 'Free Standard Pack' }, out));
      if (save.officialPlayed >= 10) tx(save, 'first10', () => applyReward(save, { tickets: { t5: 1 }, label: 'First 10 fixtures' }, out));
      const inDiv = Object.values(L.results).filter(r => r.player).length;
      if (inDiv >= 3 && !save.challenges.unlocked[L.div]) { save.challenges.unlocked[L.div] = true; out.challengesUnlocked = L.div; }
    });
    save.pendingDecision = null;
    out.applied = ok;
    return out;
  },
  // called once all 19 rounds + AI jobs are done
  closeSeason(save) {
    const L = save.league; if (!League.seasonComplete(save) || L.phase !== 'regular') return null;
    const out = {}; const rank = League.rank(save), d = L.div;
    tx(save, 'season:' + L.seasonId, () => {
      L.endRank = rank;
      tx(save, 'divdone:' + d, () => applyReward(save, { tickets: { t5: 1 }, label: 'Division ' + d + ' completed' }, out));
      if (d === 1) {
        save.endless.seasons++;
        const r = ENDLESS(rank); if (r) applyReward(save, Object.assign({ label: 'Champions League season reward' }, r), out);
        if (rank === 1) {
          save.endless.titles++;
          tx(save, 'firstD1title', () => { save.endless.firstTitle = true; applyReward(save, { packs: { legend: 1 }, crest: true, label: 'First Division 1 title' }, out); out.firstTitle = true; });
        }
        L.phase = 'ended';
      } else if (rank <= 3) {
        applyReward(save, Economy.seasonBonus(d, rank, false), out);
        L.phase = 'promoted';
      } else L.phase = 'promo';
      save.history.push({ season: L.seasonId, div: d, rank, outcome: L.phase === 'promoted' ? (rank === 1 ? 'Champions · promoted' : 'Promoted') : d === 1 ? (rank === 1 ? 'Champions' : 'Finished ' + rank) : 'Finished ' + rank });
    });
    out.rank = rank; out.div = d; out.phase = L.phase;
    return out;
  },
  promote(save) {
    const L = save.league, d = L.div; if (d <= 1 || L.phase !== 'promoted') return null;
    const out = {};
    tx(save, 'promoted:' + L.seasonId, () => {
      // swap the player club with the weakest (source power) club of the upper division: 20 clubs everywhere
      const up = save.divisions[d - 2], low = save.divisions[d - 1];
      const weakest = up.slice().sort((a, b) => club(a).power - club(b).power || (a < b ? -1 : 1))[0];
      up.splice(up.indexOf(weakest), 1, save.club); low.splice(low.indexOf(save.club), 1, weakest);
      save.division = d - 1; if (save.division < save.highestDiv) save.highestDiv = save.division;
      tx(save, 'reach:' + (d - 1), () => applyReward(save, { xp: 60, frags: 6, tickets: { t10: 1 }, label: 'First promotion to Division ' + (d - 1) }, out));
      League.newSeason(save, d - 1);
    });
    out.division = save.division;
    return out;
  },
  // Promotion Challenge: best of 3 vs. the three weakest clubs of the division above
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
  const c = club(save.club), bp = c.src.battle_profile;
  const attrs = Upgrades.attributes(Upgrades.stats(save));
  return { id: c.id, name: c.displayName, display_name_tr: c.displayName, type: 'club', country: c.country, visual: Object.assign({}, c.src.visual), player: true,
    battle_profile: { power_index: Upgrades.power(save), archetype: bp.archetype, attributes: attrs, roles_per_100: Object.assign({}, PLAYER_ROLES), specials: bp.specials.slice(0, 2),
      aggression: bp.aggression, variance: Object.assign({}, bp.variance) } };
}
function aiStars(save, d, count, key) {
  const rng = newRng(save, 'oppstars:' + key);
  const out = [], used = new Set();
  const rar = d <= 2 ? ['legendary', 'epic', 'epic', 'rare', 'rare'] : d <= 5 ? ['epic', 'rare', 'rare', 'common', 'common'] : ['rare', 'common', 'common', 'common', 'common'];
  for (let i = 0; i < count; i++) {
    const pool = DATA.STARS.filter(s => s.rarity === rar[i] && !used.has(s.id) && s.role !== 'captain');
    const s = pool[rng.int(pool.length)]; used.add(s.id);
    const or = ovrRange(d, s.rarity); out.push(Stars.unitSpec(s.id, or[0] + rng.int(or[1] - or[0] + 1)));
  }
  return out;
}
const Battle = {
  ARC_CFG,
  // kind: 'league' | 'promo' | 'challenge'
  snapshot(save, kind, ctx) {
    const L = save.league, d = kind === 'challenge' ? ctx.div : L.div;
    let oppId, oppRating, fixtureId, oppStars = [], attempt = 1, label;
    if (kind === 'league') { const fx = League.playerFixture(save); oppId = fx.opp; fixtureId = fx.id; oppRating = League.rating(save, oppId, d, L.seasonId); attempt = ctx && ctx.attempt || 1; label = 'Division ' + d + ' · Round ' + (fx.round + 1); }
    else if (kind === 'promo') { const P = save.promo; oppId = P.opps[P.games.length]; oppRating = League.rating(save, oppId, d - 1, L.seasonId); fixtureId = L.seasonId + ':PROMO' + P.attempt + ':G' + (P.games.length + 1); label = 'Promotion Challenge · Game ' + (P.games.length + 1); }
    else { const o = Challenges.opponent(save, d, ctx.kind); oppId = o.id; oppRating = o.rating; const k = Challenges.key(d, ctx.kind); const st = save.challenges.done[k]; const plays = st ? st.plays : 0; fixtureId = 'CH:' + k + ':P' + (plays + 1);
      if (ctx.kind === 'signature') oppStars = aiStars(save, d, Challenges.oppStars(d), k + ':' + plays);
      label = CH_INFO[ctx.kind].name + ' · Division ' + d; }
    const battleId = 'B' + (save.stats.battles + 1) + ':' + fixtureId + ':A' + attempt;
    const tactic = kind === 'league' && L.tactics ? L.tactics[oppId] : null;
    const snap = {
      v: 1, battleId, fixtureId, seasonId: L.seasonId, kind, ctx: ctx || {}, attempt, label, div: d,
      seed: seedOf(save, 'battle:' + battleId),
      teamA: playerTeam(save), teamB: clubTeam(save, oppId, oppRating, tactic),
      stars: Stars.battleList(save), starIds: save.active.filter(id => save.stars[id] && save.stars[id].contract > 0), oppStars,
      aiMom: d <= 3 ? 'good' : 'normal', created: Date.now()
    };
    return snap;
  },
  worldOpts(snap, o) {
    o = o || {};
    return { seed: snap.seed, teamA: snap.teamA, teamB: snap.teamB, cfg: root.FW_ENGINE_CONFIG, duration: 'standard', fxLevel: o.fxLevel == null ? 1 : o.fxLevel,
      ruleset: 'fusion', fbIntensity: 'normal', goalAdv: true, headless: !!o.headless,
      arcade: { advCap: ARC_CFG.advCap, advScale: ARC_CFG.advScale, stars: [snap.stars, snap.oppStars || []], momentum: [o.auto ? 'normal' : 'manual', snap.aiMom || 'normal'], inputs: o.inputs || [] } };
  },
  aiOpts(save, job) {
    const L = save.league;
    const ta = clubTeam(save, job.a, League.rating(save, job.a, job.div, job.seasonId), L.tactics && L.tactics[job.a]);
    const tb = clubTeam(save, job.b, League.rating(save, job.b, job.div, job.seasonId), L.tactics && L.tactics[job.b]);
    return { seed: job.seed, teamA: ta, teamB: tb, cfg: root.FW_ENGINE_CONFIG, duration: 'standard', fxLevel: 0, ruleset: 'fusion', fbIntensity: 'normal', goalAdv: true, headless: true,
      arcade: { advCap: ARC_CFG.advCap, advScale: ARC_CFG.advScale, stars: [[], []], momentum: ['normal', 'normal'], inputs: [] } };
  },
  result(w) {
    const s = E.summaryV4(w), a = E.arcSummary(w);
    return { winner: s.winner, won: s.winner === 0, survivors: s.survivors, alive: [w.teams[0].alive, w.teams[1].alive], goals: s.football ? s.football.goals.slice() : [0, 0],
      hash: s.hash, battleSeconds: s.battleSeconds, endTick: w.endTick, football: s.football, momentum: a ? a.momentum : [], inputs: a ? a.inputs : [], stars: a ? a.stars : [], kills: s.kills, tiebreak: s.tiebreak };
  },
  // headless run in slices (callers yield between slices so mobile UIs never freeze)
  runSlice(w, ticks) { let n = 0; while (w.phase !== 'ended' && w.t < 90 && n++ < ticks) { E.step(w); if (w.events.length > 4000) w.events.length = 0; } return w.phase === 'ended' || w.t >= 90; },
  simulate(opts) { const w = E.createWorld(opts); while (!Battle.runSlice(w, 100000)); return w; },
  // official / challenge battle bookkeeping
  begin(save, snap) {
    Stars.consume(save, snap.battleId, snap.starIds);
    save.pendingBattle = { snap, inputs: [], lastTick: 0, startedAt: Date.now() };
    save.stats.battles++;
  },
  // apply a finished battle (the single entry point for all match outcomes)
  finish(save, snap, res) {
    const out = { kind: snap.kind, won: res.won, res, snap, rewards: {} };
    if (!save.pendingBattle || save.pendingBattle.snap.battleId !== snap.battleId) { out.stale = true; return out; }
    save.pendingBattle = null;
    Stars.cleanupExpired(save);
    save.stats.goals += res.goals[0];
    for (const m of res.momentum) if (m.side === 0) { save.stats.strikes++; if (m.q === 'perfect') save.stats.perfects++; }
    if (snap.kind === 'league') {
      const fx = League.playerFixture(save);
      if (!fx || fx.id !== snap.fixtureId) { out.stale = true; return out; }
      if (!res.won && snap.attempt === 1) { save.pendingDecision = { fixtureId: fx.id, res: { goals: res.goals, survivors: res.survivors } }; out.canRematch = true; }
      else Endgame.finalizeFixture(save, fx, res.won, res, out.rewards);
    } else if (snap.kind === 'promo') {
      Endgame.promoRecord(save, res.won, out.rewards); out.promo = save.promo;
      if (res.won) save.stats.wins++; else save.stats.losses++;
    } else {
      Challenges.record(save, snap.div, snap.ctx.kind, res.won, res.survivors, out.rewards);
      out.medal = snap.ctx.kind === 'last' ? Challenges.medal(res.won, res.survivors) : 0;
      if (res.won) save.stats.wins++; else save.stats.losses++;
    }
    save.lastResult = { kind: snap.kind, won: res.won, label: snap.label, goals: res.goals, survivors: res.survivors, opp: snap.teamB.id, at: Date.now() };
    return out;
  },
  acceptLoss(save) {
    const D = save.pendingDecision; if (!D) return null;
    const fx = League.playerFixture(save); if (!fx || fx.id !== D.fixtureId) { save.pendingDecision = null; return null; }
    return Endgame.finalizeFixture(save, fx, false, D.res, {});
  },
  abandon(save) {
    const P = save.pendingBattle; if (!P) return null;
    const res = { won: false, winner: 1, survivors: 0, goals: [0, 0], momentum: [], inputs: [], stars: [], alive: [0, 0], abandoned: true };
    return Battle.finish(save, P.snap, res);
  }
};

const Arcade = { VERSION: SAVE_VERSION, tx, clubs, club, Save, Upgrades, Progression, Economy, Stars, Draft, League, Challenges, Endgame, Battle,
  PLAYER_ROLES, RARITIES, CONTRACT, OVR_REF, PACKS, applyReward, seedOf };
root.Arcade = Arcade;
if (typeof module !== 'undefined' && module.exports) module.exports = Arcade;
})(typeof window !== 'undefined' ? window : globalThis);
