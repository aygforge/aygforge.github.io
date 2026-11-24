// FOOTBALL WARS — Complete Career Edition: balance configuration.
// All tunable numbers live here. Changing them re-balances the game without touching the rules code.
export const SAVE_VERSION = 1;
export const ENGINE_VERSION = 'career-v1';
export const AI_POLICY_VERSION = 'coach-utility-1';

export const ROLES = ['striker', 'winger', 'playmaker', 'defender', 'goalkeeper', 'support', 'captain'];
export const ROLE_LABEL = { striker: 'Striker', winger: 'Winger', playmaker: 'Playmaker', defender: 'Defender', goalkeeper: 'Goalkeeper', support: 'Support', captain: 'Captain' };
export const ROLE_SHORT = { striker: 'ST', winger: 'WG', playmaker: 'PM', defender: 'DF', goalkeeper: 'GK', support: 'SP', captain: 'CP' };
export const ROLE_DESC = {
  striker: 'Long-range shooters and the main goal threat of the match ball.',
  winger: 'Fast flank runners with curling shots; they carry the ball wide.',
  playmaker: 'Feed passes that boost team-mates’ next hit and link play.',
  defender: 'Tough slide-tacklers who win the ball and knock rivals back.',
  goalkeeper: 'Guard the goal, save shots and launch clearances.',
  support: 'Heal and buff nearby allies, intercept passes.',
  captain: 'Exactly one. Aura that boosts nearby allies; casts team specials.'
};
export const DEFAULT_FORMATION = { striker: 16, winger: 14, playmaker: 12, defender: 34, goalkeeper: 8, support: 15, captain: 1 };

export const SEASON_WEEKS = 38;
export const DIVISIONS = 10;
export const CLUBS_PER_DIV = 20;
export const ACTIONS_PER_WEEK = 2;
export const START_CREDITS = 1600;
export const START_QUALITY = 37.5;
export const MIN_STANDARD = 100, MAX_STANDARD = 104, MAX_STARS = 8, MAX_ACTIVE_STARS = 5, MAX_REGISTERED = 112;
export const TRANSFER_WINDOWS = [[1, 8], [21, 28]];

// division power reference (club OVR scale). Division 10 starts around 37–38.
export const DIV_BASE = { 1: 84, 2: 78, 3: 72.5, 4: 67.5, 5: 62.5, 6: 57.5, 7: 52.5, 8: 47.5, 9: 42.5, 10: 37.5 };
export const divSpread = d => 1.5 + 0.15 * (10 - d);

// economy (Credits per world week)
export const SPONSOR = { 10: 240, 9: 310, 8: 400, 7: 520, 6: 680, 5: 880, 4: 1140, 3: 1480, 2: 1920, 1: 2500 };
export const REF_EXPENSE = { 10: 170, 9: 215, 8: 275, 7: 355, 6: 470, 5: 620, 4: 810, 3: 1060, 2: 1375, 1: 1810 };
export const WAGE_SHARE = 130 / 170; // standard squad wages part of the reference expense; the rest is base facility upkeep
export const divFactor = d => SPONSOR[d] / SPONSOR[10];
export const MATCH_PAY = { appearance: 40, ticket: 50, win: 90 }; // Division 10 values, scaled by divFactor
export const LEAGUE_PRIZE_K = 0.35;   // position prize = sponsor * max(0, 11 - pos) * K
export const PROMOTION_BONUS_WEEKS = 2;
export const DIV_CUP_PRIZE = { 10: 600, 9: 800, 8: 1050, 7: 1400, 6: 1900, 5: 2500, 4: 3250, 3: 4200, 2: 5400, 1: 7000 };
export const GRAND_CUP_PRIZE = 5000, CHAMPIONS_PRIZE = 12000;
export const CUP_ROUND_WIN_SHARE = 0.08; // each tie won pays prize * share * (round index + 1)
export const SPONSOR_TYPES = {
  guaranteed: { label: 'Guaranteed', base: 1.0, desc: 'Full weekly payment, no bonuses.' },
  performance: { label: 'Performance', base: 0.7, desc: '70% weekly + a bonus for every league win.' },
  prestige: { label: 'Prestige', base: 0.85, desc: '85% weekly + big season-end bonus for trophies / top-3, smaller for top half.' }
};
export const ADVANCE_WEEKS = 4, ADVANCE_REPAY_SHARE = 0.25;

// facilities
export const FACILITIES = ['stadium', 'training', 'academy', 'scout', 'medical', 'fans'];
export const FAC_LABEL = { stadium: 'Stadium', training: 'Training Centre', academy: 'Youth Academy', scout: 'Scout Office', medical: 'Medical Unit', fans: 'Fan Centre' };
export const FAC_BASE_COST = { stadium: 400, training: 500, academy: 650, scout: 450, medical: 350, fans: 300 };
export const FAC_COST_MULT = 1.65, FAC_MAX = 6;
export const STADIUM_CAP = [600, 1200, 3000, 8000, 20000, 45000];
export const facCost = (f, lvl) => Math.round(FAC_BASE_COST[f] * Math.pow(FAC_COST_MULT, lvl - 1)); // cost to go lvl -> lvl+1
export const facUpkeep = (lvl) => 1 + 0.55 * (lvl - 1); // multiplier of the per-facility base upkeep

// stars
export const XP_NEXT = lvl => 50 + 25 * lvl;
export const STAR_MAX_LEVEL = 20, SPEC_LEVELS = [4, 9, 15];
export const XP_MATCH = 12, XP_WIN = 6, XP_GOAL = 4, XP_KO = 1, XP_TRAIN = 35;
export const INJURY_CHANCE = 0.008;
export const RARITY = {
  rising: { label: 'Rising Star', pot: [5, 12] },
  promising: { label: 'Promising Talent', pot: [10, 20] },
  elite: { label: 'Elite Prospect', pot: [18, 30] },
  generational: { label: 'Generational Talent', pot: [28, 40] }
};
export const ACADEMY_RARITY = { // per academy level: rising / promising / elite / generational
  1: [0.70, 0.25, 0.045, 0.005], 2: [0.62, 0.30, 0.07, 0.01], 3: [0.55, 0.33, 0.10, 0.02],
  4: [0.48, 0.36, 0.13, 0.03], 5: [0.42, 0.38, 0.16, 0.04], 6: [0.35, 0.40, 0.20, 0.05]
};
// standard player packages
export const unitPrice = q => 12 * Math.pow(1.075, q - 37);
export const STAR_FEE_RANGE = { 10: [650, 3000], 9: [650, 3000], 8: [650, 3000], 7: [2000, 7500], 6: [2000, 7500], 5: [2000, 7500], 4: [5000, 14000], 3: [5000, 14000], 2: [9500, 35000], 1: [9500, 35000] };
export const AI_BUY_SHARE = 0.85;   // AI buys a player's star at most at 85% of value (no buy/sell loop profits)
export const MAX_OFFERS_PER_TALK = 3;

// battle (career ruleset) — passed into the engine
export const BATTLE_RULES = { advCap: 0.20, advScale: 22, qSlope: 0.012, starHp: 1.30, starDmg: 1.25, starSpeed: 1.05, cmdDur: 4, cmdCd: 8, cmdMax: 3, styleCd: 8 };
export const TACTIC_LABEL = { high_press: 'High Press', fortress: 'Defensive Fortress', counter: 'Counter Strike', total: 'Total Football' };
export const TACTIC_DESC = {
  high_press: 'Push the block forward, more players chase the ball, extra tackles. Burns stamina.',
  fortress: 'Deep block, defenders hold shape, extra armour. Fewer shots, fewer chasers.',
  counter: 'Sit a little deeper; every turnover launches a sprinting counter attack.',
  total: 'Compact combination play: more support runners, quicker passing, team specials built on passing.'
};
export const STYLE_LABEL = { attack: 'Attack', balanced: 'Balanced', defend: 'Defend' };
export const CMD_LABEL = { press: 'FULL PRESS', hold: 'HOLD LINE', fast: 'FAST BREAK' };
export const CMD_DESC = { press: 'Aggressive press for 4 s: faster, more chasers and tackles; heavy stamina use, weaker armour.', hold: 'Pull the shape together for 4 s: strong armour, less attacking support.', fast: 'Quick transition for 4 s: forwards sprint, the ball carrier bursts forward; gaps at the back.' };
export const AI_PROFILES = ['aggressive', 'defensive', 'counter', 'technical', 'balanced'];
export const PROFILE_LABEL = { aggressive: 'Aggressive', defensive: 'Defensive', counter: 'Counter Specialist', technical: 'Technical', balanced: 'Balanced' };
export const PROFILE_TACTIC = { aggressive: 'high_press', defensive: 'fortress', counter: 'counter', technical: 'total', balanced: 'total' };
export const ARCH_PROFILE = { high_press: 'aggressive', physical: 'aggressive', defensive_block: 'defensive', counter: 'counter', wing_attack: 'counter', possession: 'technical' };
export const coachLevel = div => 11 - div; // Division 10 -> 1 (basic), Division 1 -> 10 (elite)
export const coachEvery = lvl => 150 - lvl * 6; // measured: very frequent re-evaluation burns commands early
export const PLAYER_ASSISTANT = { level: 'division (min 2)', profile: 'balanced' };
