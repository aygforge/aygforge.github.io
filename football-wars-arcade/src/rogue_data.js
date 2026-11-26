/* FOOTBALL WARS: ROGUELITE REBORN — FWCampaignData / FWCards / FWLeaders / FWEnemyTactics data.
 * Single source of truth for the 200-level map, the 48 cards, the 5 Star Leaders and the authored enemy armies. */
(function (root) {
'use strict';
const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
// ---------------- 200-level mission map (exact lists from the spec) ----------------
const GOAL_LEVELS = [7, 14, 18, 26, 31, 32, 43, 49, 58, 66, 74, 76, 79, 83, 89, 92, 98, 105, 110, 117, 118, 120, 123, 127, 132, 135, 139,
  142, 149, 151, 154, 159, 162, 170, 174, 176, 184, 188, 194, 197];
const KO_LEVELS = [9, 27, 36, 56, 59, 72, 80, 84, 90, 108, 114, 126, 136, 155, 158, 165, 172, 178, 198, 199];
const SOFT_WALLS = [6, 14, 24, 31, 45, 56, 63, 74, 87, 95, 105, 113, 124, 132, 146, 155, 168, 174, 183, 193];
const HARD_WALLS = [32, 53, 72, 96, 110, 117, 129, 136, 151, 157, 170, 178, 191, 199];
const ELITE_LEVELS = [9, 17, 27, 35, 38, 49, 53, 58, 68, 72, 77, 84, 90, 98, 108, 114, 119, 126, 136, 138, 143, 151, 158, 165, 172, 179, 187, 191, 196, 198];
const BOSS_LEVELS = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
const WAVE_COUNTS = { normal: [50, 65, 80], elite: [45, 60, 75, 90], boss: [40, 55, 70, 85, 100] };
const WAVE_COEF = { normal: [0.82, 0.92, 1.00], elite: [0.76, 0.86, 0.96, 1.06], boss: [0.70, 0.80, 0.90, 1.03, 1.12] };
// draft picks: [start, after W1, after W2, after W3, after W4]
const DRAFT_PLAN = { normal: [1, 1, 2], elite: [1, 1, 2, 1], boss: [1, 1, 2, 1, 2] };
const EPISODES = [
  { n: 1, name: 'Rookie League', tactics: ['rookie_eleven', 'basic_press'], threat: 100, color: ['#e63946', '#ffffff'] },
  { n: 2, name: 'Rising League', tactics: ['wing_blitz', 'sprint_press'], threat: 108, color: ['#ff8c1a', '#1c1c24'] },
  { n: 3, name: 'Iron League', tactics: ['iron_wall', 'keeper_lock'], threat: 116, color: ['#8a93a6', '#1d2230'] },
  { n: 4, name: 'Impact League', tactics: ['impact_crew', 'bruiser_press'], threat: 125, color: ['#b5442c', '#f2c14e'] },
  { n: 5, name: 'Endurance League', tactics: ['marathon_squad', 'attrition_guard'], threat: 135, color: ['#2f9e44', '#f8f9fa'] },
  { n: 6, name: 'Ricochet League', tactics: ['pinball_eleven', 'rebound_press'], threat: 146, color: ['#ff4fd8', '#3b1a5c'] },
  { n: 7, name: 'Counter League', tactics: ['counter_kings', 'transition_trap'], threat: 158, color: ['#ffd60a', '#14213d'] },
  { n: 8, name: 'Tactician League', tactics: ['tactical_director', 'formation_switch'], threat: 171, color: ['#7b4fd6', '#ffffff'] },
  { n: 9, name: 'Champions League', tactics: ['champions_alliance', 'hybrid_guard'], threat: 185, color: ['#e8b923', '#0a2463'] },
  { n: 10, name: 'Legends League', tactics: ['legion_of_legends', 'elite_vanguard'], threat: 200, color: ['#c9184a', '#ffd23f'] }
];
const ROLE_ORDER = ['striker', 'winger', 'playmaker', 'defender', 'goalkeeper', 'support', 'captain'];
// reference 100-unit enemy role distribution per Episode (ST WG PM DF GK SP CP)
const EP_ROLES = [
  [16, 14, 12, 34, 8, 15, 1], [20, 22, 14, 23, 6, 14, 1], [10, 8, 10, 48, 12, 11, 1], [20, 10, 7, 42, 6, 14, 1], [13, 11, 10, 37, 8, 20, 1],
  [17, 18, 20, 25, 6, 13, 1], [17, 21, 11, 29, 8, 13, 1], [15, 13, 21, 28, 9, 13, 1], [17, 16, 15, 30, 9, 12, 1], [18, 15, 15, 31, 9, 11, 1]];
const ARMY_ROLES = [16, 14, 12, 34, 8, 15, 1]; // the player's fixed Survivor Army
const THREAT = [100, 108, 116, 125, 135, 146, 158, 171, 185, 200];
// ---------------- authored tactics (real AI parameters + threat-budget split) ----------------
// arch: V4 archetype (tendency + signature special); ai: press / pass / shoot / tackle / compact / intercept / trans / risk;
// bud: how the Episode threat budget is spent on attack / defence / movement (mean 1).
const T = (name, arch, ai, bud, desc) => ({ name, arch, ai, bud: bud || [1, 1, 1], desc });
const TACTICS = {
  rookie_eleven: T('Rookie Eleven', 'possession', {}, [1, 1, 1], 'Balanced basics: keeps its shape and fights evenly.'),
  basic_press: T('Basic Press', 'high_press', { press: 1.3 }, [1.02, 0.98, 1], 'Sends extra players to press your ball carrier.'),
  short_pass: T('Short Pass Crew', 'possession', { pass: 1.6, press: 1.1 }, [1, 1, 1], 'Moves the ball quickly in short passes.'),
  rookie_coord: T('Rookie Champions', 'possession', { press: 1.2, pass: 1.2, compact: 1.2 }, [1.02, 1.02, 0.96], 'Coordinated pressing around a calm captain.'),
  wing_blitz: T('Wing Blitz', 'wing_attack', { trans: 0.12, shoot: 1.1, risk: 1.1 }, [1.03, 0.94, 1.03], 'Fast wingers burst forward after every turnover.'),
  sprint_press: T('Sprint Press', 'high_press', { press: 1.5, risk: 1.15 }, [1, 0.95, 1.05], 'Relentless sprinting press, never backs off.'),
  wide_wings: T('Wide Wings', 'wing_attack', { pass: 1.2, trans: 0.08 }, [1, 0.97, 1.03], 'Stretches the pitch with both flanks.'),
  forward_runs: T('Forward Runs', 'counter', { trans: 0.2, shoot: 1.15 }, [1.02, 0.94, 1.04], 'Breaks forward at speed whenever it wins the ball.'),
  iron_wall: T('Iron Wall', 'defensive_block', { compact: 1.8, intercept: 1.3, risk: 0.8 }, [0.9, 1.15, 0.95], 'Deep, compact block that intercepts passes.'),
  keeper_lock: T('Keeper Lock', 'defensive_block', { compact: 1.5, tackle: 1.3, intercept: 1.2 }, [0.92, 1.12, 0.96], 'Crowds the box and tackles hard near goal.'),
  interceptors: T('Interceptors', 'counter', { intercept: 1.6, trans: 0.1 }, [0.97, 1.05, 0.98], 'Reads your passes and cuts them out.'),
  captain_wall: T('Captain\'s Wall', 'defensive_block', { compact: 1.6, risk: 0.85, press: 1.1 }, [0.94, 1.1, 0.96], 'Defends in a tight ring around its captain.'),
  impact_crew: T('Impact Crew', 'physical', { tackle: 1.5, risk: 1.3 }, [1.08, 1.0, 0.92], 'Heavy contact, hunts wounded players.'),
  bruiser_press: T('Bruiser Press', 'physical', { press: 1.4, risk: 1.25, tackle: 1.2 }, [1.05, 1.0, 0.95], 'Physical pressing in packs.'),
  marathon_squad: T('Marathon Squad', 'possession', { pass: 1.3, risk: 0.85 }, [0.96, 1.08, 0.96], 'Never tires, protects its wounded, keeps the ball.'),
  attrition_guard: T('Attrition Guard', 'defensive_block', { compact: 1.4, risk: 0.75, intercept: 1.15 }, [0.94, 1.1, 0.96], 'Slow, durable block that wears you down.'),
  pinball_eleven: T('Pinball Eleven', 'possession', { pass: 1.5, shoot: 1.2 }, [1, 0.98, 1.02], 'Rapid passing and shots from everywhere.'),
  rebound_press: T('Rebound Press', 'high_press', { press: 1.3, intercept: 1.2, trans: 0.1 }, [1, 0.98, 1.02], 'Swarms every loose ball and rebound.'),
  counter_kings: T('Counter Kings', 'counter', { trans: 0.2, intercept: 1.3 }, [1.02, 0.98, 1.0], 'Wins the ball, then breaks at full speed.'),
  transition_trap: T('Transition Trap', 'counter', { compact: 1.3, trans: 0.18, intercept: 1.4 }, [1, 1.02, 0.98], 'Baits you forward and springs the trap.'),
  tactical_director: T('Tactical Director', 'possession', { pass: 1.3, press: 1.2, compact: 1.2 }, [1, 1.02, 0.98], 'Controlled, organised, presses with purpose.'),
  formation_switch: T('Formation Switch', 'wing_attack', { pass: 1.2, trans: 0.12, press: 1.1 }, [1.02, 0.98, 1.0], 'Switches between wide play and pressing.'),
  champions_alliance: T('Champions Alliance', 'high_press', { press: 1.3, pass: 1.2, shoot: 1.15 }, [1.02, 1.0, 0.98], 'Elite pressing with sharp finishing.'),
  hybrid_guard: T('Hybrid Guard', 'defensive_block', { compact: 1.4, intercept: 1.3, trans: 0.12 }, [0.96, 1.08, 0.96], 'Strong zonal defence that counters quickly.'),
  legion_of_legends: T('Legion of Legends', 'possession', { press: 1.3, pass: 1.3, shoot: 1.2, risk: 1.1 }, [1.02, 1.0, 0.98], 'Every strength of every League at once.'),
  elite_vanguard: T('Elite Vanguard', 'physical', { tackle: 1.4, press: 1.4, risk: 1.2 }, [1.05, 1.0, 0.95], 'The physical front line of the Legion.'),
  opening_legion: T('Opening Legion', 'possession', { press: 1.1, pass: 1.2 }, [1, 1, 1], 'A measured opening wave.'),
  fast_legion: T('Fast Legion', 'wing_attack', { trans: 0.18, risk: 1.15 }, [1.02, 0.92, 1.06], 'Pure speed on both wings.'),
  iron_legion: T('Iron Legion', 'defensive_block', { compact: 1.7, intercept: 1.4, risk: 0.8 }, [0.92, 1.14, 0.94], 'An unbreakable block.'),
  chaos_legion: T('Chaos Legion', 'physical', { tackle: 1.5, press: 1.4, shoot: 1.2, risk: 1.3 }, [1.06, 0.97, 0.97], 'Brawls and shoots at every chance.'),
  legendary_army: T('Legendary Eleven Army', 'high_press', { press: 1.4, pass: 1.3, shoot: 1.2, tackle: 1.2, intercept: 1.2, trans: 0.12 }, [1.03, 1.03, 1.0], 'The final army: everything, coordinated.')
};
// ---------------- the 10 Boss plans (5 waves each: 40 → 55 → 70 → 85 → 100) ----------------
const BOSSES = {
  20: { name: 'Rookie Champions', cup: 'Rookie Cup', waves: [['rookie_eleven', 'Balanced base team'], ['basic_press', 'Local press'], ['short_pass', 'Short passing'], ['captain_wall', 'Defence near goal'], ['rookie_coord', 'Coordinated Rookie army']] },
  40: { name: 'Wing Blitz', cup: 'Rising Cup', waves: [['wide_wings', 'Wide wings'], ['forward_runs', 'Fast forward runs'], ['formation_switch', 'Wing–playmaker passing'], ['sprint_press', 'Press after a turnover'], ['wing_blitz', 'Coordinated two-wing attack']] },
  60: { name: 'Iron Fortress', cup: 'Iron Cup', waves: [['iron_wall', 'Dense defence'], ['keeper_lock', 'Keeper protection'], ['interceptors', 'Interceptions'], ['captain_wall', 'Defence around the captain'], ['iron_legion', 'Full Iron Fortress']] },
  80: { name: 'Impact Crew', cup: 'Impact Cup', waves: [['impact_crew', 'Physical front line'], ['bruiser_press', 'Local pack press'], ['impact_crew', 'Hunting wounded targets'], ['captain_wall', 'Defensive pressure'], ['chaos_legion', 'Coordinated physical army']] },
  100: { name: 'Marathon Squad', cup: 'Endurance Cup', waves: [['marathon_squad', 'High stamina'], ['attrition_guard', 'Support-backed defence'], ['short_pass', 'Controlled possession'], ['bruiser_press', 'Endurance and close combat'], ['marathon_squad', 'Full Marathon Squad']] },
  120: { name: 'Pinball Eleven', cup: 'Ricochet Cup', waves: [['short_pass', 'Pass-focused'], ['rebound_press', 'Chasing rebounds'], ['pinball_eleven', 'Shot preparation'], ['forward_runs', 'Fast attack after saves'], ['pinball_eleven', 'Pass-and-rebound coordination']] },
  140: { name: 'Counter Kings', cup: 'Counter Cup', waves: [['interceptors', 'Ball winning'], ['wide_wings', 'Wing runs after winning the ball'], ['transition_trap', 'Interceptions'], ['forward_runs', 'Fast transitions'], ['counter_kings', 'Balanced counter army']] },
  160: { name: 'Tactical Director', cup: 'Tactician Cup', waves: [['tactical_director', 'Controlled balance'], ['fast_legion', 'Fast wings'], ['iron_wall', 'Strong zonal defence'], ['bruiser_press', 'Physical pressure'], ['formation_switch', 'Tactical mixed army']] },
  180: { name: 'Champions Alliance', cup: 'Champions Cup', waves: [['champions_alliance', 'Balanced pressing'], ['hybrid_guard', 'Strong defence'], ['counter_kings', 'Fast counterattack'], ['marathon_squad', 'Impact and endurance combined'], ['champions_alliance', 'Controlled mixed tactics']] },
  200: { name: 'Legion of Legends', cup: 'Legends Cup', waves: [['opening_legion', 'Opening Legion'], ['fast_legion', 'Fast Legion'], ['iron_legion', 'Iron Legion'], ['chaos_legion', 'Chaos Legion'], ['legendary_army', 'Legendary Eleven Army']] }
};
// boss waves can field another Episode's role mix (counts are always the template counts)
const BOSS_ROLES = { iron_wall: 3, keeper_lock: 3, iron_legion: 3, captain_wall: 3, impact_crew: 4, chaos_legion: 4, marathon_squad: 5, attrition_guard: 5, wide_wings: 2, fast_legion: 2, wing_blitz: 2, short_pass: 6, pinball_eleven: 6 };

function buildLevels() {
  const L = [];
  for (let level = 1; level <= 200; level++) {
    const ep = Math.ceil(level / 20), n = level - (ep - 1) * 20;
    const kind = BOSS_LEVELS.includes(level) ? 'boss' : ELITE_LEVELS.includes(level) ? 'elite' : 'normal';
    const mission = GOAL_LEVELS.includes(level) ? 'goal' : KO_LEVELS.includes(level) ? 'ko' : 'survival';
    const soft = SOFT_WALLS.includes(level), hard = HARD_WALLS.includes(level);
    let goalTarget = 0;
    if (mission === 'goal') goalTarget = kind === 'boss' ? 3 : kind === 'elite' ? (hard ? 4 : 3) : soft ? 3 : hard ? 3 : 2;
    const counts = WAVE_COUNTS[kind];
    const E = EPISODES[ep - 1], prev = ep > 1 ? EPISODES[ep - 2] : null;
    const [P, S] = E.tactics;
    let waves;
    if (kind === 'boss') waves = BOSSES[level].waves.map(x => x[0]);
    else {
      waves = counts.map((_, i) => {
        const last = i === counts.length - 1;
        if (n <= 4) return P;
        if (n <= 8) return i % 2 ? S : P;
        if (n <= 14) return (i % 2 ? P : S);
        if (prev && i === 1) return prev.tactics[0];
        return last ? S : (i % 2 ? S : P);
      });
      if ((soft || hard || kind === 'elite') && n > 4) waves[waves.length - 1] = S;
    }
    L.push({ level, ep, n, kind, mission, soft, hard, goalTarget, waves: counts.length, counts: counts.slice(), coef: WAVE_COEF[kind].slice(), tactics: waves,
      boss: kind === 'boss' ? { name: BOSSES[level].name, cup: BOSSES[level].cup, plan: BOSSES[level].waves.map(x => x[1]) } : null });
  }
  return L;
}
const LEVELS = buildLevels();

// ---------------- 48 cards ----------------
const P = v => Math.round(v * 1000) / 10 + '%';
const C = (id, name, cat, rarity, v, desc, extra) => Object.assign({ id, name, cat, rarity, v, desc }, extra || {});
const CARDS = [
  // Survival
  C('S01', 'Iron Discipline', 'survival', 'common', { dr: [0.05, 0.075, 0.10], syn: 0.04 }, v => `All Survivors take ${P(v.dr)} less damage. Pao Maldin alive: defenders in your half take ${P(v.syn)} less more.`, { lead: 'pao', trigger: 'passive' }),
  C('S02', 'Field Medic', 'survival', 'common', { heal: [0.04, 0.06, 0.08] }, v => `End-of-wave healing +${P(v.heal)} of max HP (total wave heal is capped at 25%).`, { trigger: 'wave_end' }),
  C('S03', 'Second Wind', 'survival', 'common', { heal: [0.12, 0.16, 0.20], cap: [8, 10, 12] }, v => `A Survivor falling below 30% HP recovers ${P(v.heal)} max HP once per wave (max ${v.cap} per wave).`, { trigger: 'hp_low' }),
  C('S04', 'Shelter Formation', 'survival', 'common', { dr: [0.07, 0.10, 0.13] }, v => `Survivors in your defensive third take ${P(v.dr)} less damage.`, { trigger: 'zone' }),
  C('S05', 'Triage Pass', 'survival', 'rare', { heal: [0.03, 0.045, 0.06], icd: [1.0, 0.9, 0.8] }, v => `After a completed football pass, passer and receiver heal ${P(v.heal)} max HP (nearby mates half). Cooldown ${v.icd}s.`, { trigger: 'PASS_COMPLETE' }),
  C('S06', 'Last Eleven', 'survival', 'rare', { dr: [0.10, 0.14, 0.18], n: 20 }, v => `While ${v.n} or fewer Survivors remain, they take ${P(v.dr)} less damage.`, { trigger: 'few_left' }),
  C('S07', 'Guardian Intercept', 'survival', 'rare', { dr: [0.10, 0.12, 0.15], n: [6, 8, 10], icd: 2 }, v => `A real tackle or interception shields up to ${v.n} nearby mates: ${P(v.dr)} less damage for 3s. Cooldown ${v.icd}s.`, { trigger: 'BALL_GAIN / PASS_INTERCEPT' }),
  C('S08', 'Final Stand', 'survival', 'epic', { dr: [0.08, 0.11, 0.14], rate: [0.06, 0.09, 0.12] }, v => `In the last 15s of a wave (and overtime): ${P(v.dr)} less damage and +${P(v.rate)} attack rate.`, { trigger: 'late_wave' }),
  // Knockout
  C('K01', 'Impact Tackle', 'knockout', 'common', { atk: [0.15, 0.22, 0.30] }, v => `Real slide tackles deal +${P(v.atk)} damage.`, { trigger: 'TACKLE' }),
  C('K02', "Finisher's Edge", 'knockout', 'common', { atk: [0.12, 0.18, 0.24] }, v => `+${P(v.atk)} damage against rivals below 35% HP.`, { trigger: 'low_hp_target' }),
  C('K03', 'KO Momentum', 'knockout', 'common', { atk: [0.15, 0.20, 0.25] }, v => `After a real K.O. the scorer gains +${P(v.atk)} damage and +10% speed for 2.5s.`, { trigger: 'KO' }),
  C('K04', 'Shoulder Check', 'knockout', 'rare', { atk: [0.08, 0.12, 0.16], stun: [0.12, 0.18, 0.24] }, v => `Close-range hits deal +${P(v.atk)} damage; tackles stun ${v.stun}s longer.`, { trigger: 'melee' }),
  C('K05', 'Counterstrike', 'knockout', 'rare', { ch: [0.15, 0.22, 0.30], mul: [0.40, 0.55, 0.70], icd: 1.5 }, v => `When hit at close range, ${P(v.ch)} chance to strike back for ${P(v.mul)} of the Survivor's damage (1.5s per player).`, { trigger: 'damage_taken' }),
  C('K06', 'Knockout Chain', 'knockout', 'rare', { mul: [0.25, 0.35, 0.45], n: [2, 2, 3] }, v => `A real K.O. splashes ${P(v.mul)} of the scorer's damage onto up to ${v.n} rivals nearby. Chain K.O.s never chain again.`, { trigger: 'KO' }),
  C('K07', 'Brawler Surge', 'knockout', 'epic', { atk: [0.12, 0.17, 0.22], dr: [0.05, 0.07, 0.09] }, v => `Survivors surrounded by 3+ rivals: +${P(v.atk)} damage and ${P(v.dr)} less damage taken.`, { trigger: 'crowd' }),
  C('K08', 'Knockout Symphony', 'knockout', 'legendary', { every: [6, 5, 4], hp: [0.18, 0.24, 0.30], n: [5, 6, 8], icd: 3 }, v => `Every ${v.every} real K.O.s: a shockwave hits up to ${v.n} rivals for ${P(v.hp)} of their max HP and stuns them 0.4s (3s cooldown).`, { trigger: 'KO' }),
  // Football
  C('F01', 'Precision Shot', 'football', 'common', { err: [0.80, 0.70, 0.60], syn: 0.90 }, v => `Real shots are ${P(1 - v.err)} more accurate. Ronald Nazar alive: +10% more (his own shots +15%). The keeper can still save.`, { lead: 'nazar', trigger: 'SHOT' }),
  C('F02', 'Quick Passing', 'football', 'common', { sp: [0.10, 0.15, 0.20], int: [0.85, 0.75, 0.65], syn: 0.90, synSp: 0.05 }, v => `Real passes travel ${P(v.sp)} faster and are ${P(1 - v.int)} harder to intercept. Xav Hern alive: +5% speed, 10% safer.`, { lead: 'xav', trigger: 'PASS' }),
  C('F03', 'First Touch', 'football', 'common', { mul: [0.75, 0.62, 0.50] }, v => `For 1.5s after winning the ball, tackles against your carrier succeed ${P(1 - v.mul)} less often.`, { trigger: 'BALL_GAIN' }),
  C('F04', 'Goal Momentum', 'football', 'rare', { rate: [0.08, 0.12, 0.16], spd: [0.05, 0.07, 0.09] }, v => `After your real goal: +${P(v.rate)} attack rate and +${P(v.spd)} speed for 5s.`, { trigger: 'GOAL' }),
  C('F05', 'Ricochet Ball', 'football', 'rare', { ch: [0.35, 0.50, 0.65] }, v => `When the rival keeper parries or the post denies your shot, ${P(v.ch)} chance the loose ball bounces toward your nearest forward.`, { trigger: 'SAVE_GOAL / POST' }),
  C('F06', 'Keeper Breaker', 'football', 'rare', { mul: [0.88, 0.82, 0.76] }, v => `Rival keepers save your real shots ${P(1 - v.mul)} less often.`, { trigger: 'SHOT' }),
  C('F07', 'Through Ball', 'football', 'epic', { range: [30, 45, 60] }, v => `Playmakers and captains find forward runners up to ${v.range}px further; receivers sprint +15% for 1.5s.`, { trigger: 'PASS_COMPLETE' }),
  C('F08', 'Explosive Shot', 'football', 'epic', { sp: [0.12, 0.18, 0.24], save: [0.92, 0.88, 0.84] }, v => `Real shots fly ${P(v.sp)} faster; keepers save them ${P(1 - v.save)} less often. Physics still decides.`, { trigger: 'SHOT' }),
  // Movement
  C('M01', 'Turbo Sprint', 'movement', 'common', { spd: [0.05, 0.075, 0.10] }, v => `All Survivors move +${P(v.spd)} faster.`, { trigger: 'passive' }),
  C('M02', 'Press Break', 'movement', 'common', { spd: [0.12, 0.18, 0.24] }, v => `Your ball carrier under pressure runs +${P(v.spd)} faster.`, { trigger: 'pressed' }),
  C('M03', 'Quick Recovery', 'movement', 'common', { stun: [0.85, 0.72, 0.60], rec: [0.75, 0.60, 0.45] }, v => `Stuns on Survivors last ${P(1 - v.stun)} shorter; tackle recovery ${P(1 - v.rec)} shorter.`, { trigger: 'stun' }),
  C('M04', 'Wing Burst', 'movement', 'common', { spd: [0.10, 0.15, 0.20], atk: [0.06, 0.09, 0.12] }, v => `Wingers move +${P(v.spd)} faster and deal +${P(v.atk)} damage.`, { trigger: 'passive' }),
  C('M05', 'Counterattack', 'movement', 'rare', { n: [6, 8, 10], dur: [2, 2.5, 3] }, v => `A real tackle or interception sends up to ${v.n} forwards sprinting (+20%) for ${v.dur}s. Cooldown 3s.`, { trigger: 'BALL_GAIN' }),
  C('M06', 'Reposition', 'movement', 'rare', { spd: [0.10, 0.15, 0.20], kb: [0.85, 0.75, 0.65] }, v => `Survivors below 40% HP move +${P(v.spd)} faster; all take ${P(1 - v.kb)} less knockback.`, { trigger: 'hp_low' }),
  C('M07', 'Rush Lane', 'movement', 'rare', { spd: [0.08, 0.12, 0.16] }, v => `While you hold the ball, attackers ahead of the carrier run +${P(v.spd)} faster.`, { trigger: 'possession' }),
  C('M08', 'Overdrive', 'movement', 'epic', { spd: [0.12, 0.16, 0.20], rate: [0.08, 0.11, 0.14], dur: [3, 4, 5] }, v => `At 12s, 27s and 42s: +${P(v.spd)} speed and +${P(v.rate)} attack rate for ${v.dur}s.`, { trigger: 'timer' }),
  // Leadership
  C('L01', "Captain's Oath", 'leadership', 'common', { dr: [0.05, 0.07, 0.09], syn: 0.04 }, v => `Survivors inside the captain's aura take ${P(v.dr)} less damage. Stev Gerard alive: ${P(v.syn)} more.`, { lead: 'stev', trigger: 'aura' }),
  C('L02', 'Team Spirit', 'leadership', 'common', { dr: [0.03, 0.045, 0.06], dr2: [0.02, 0.03, 0.04] }, v => `All Survivors take ${P(v.dr)} less damage, ${P(v.dr + v.dr2)} while 50+ remain.`, { trigger: 'passive' }),
  C('L03', 'Assist Network', 'leadership', 'common', { atk: [0.10, 0.15, 0.20] }, v => `Assisted shots deal +${P(v.atk)} damage; a completed football pass gives the receiver +${P(v.atk / 2)} damage for 2s.`, { trigger: 'PASS_COMPLETE' }),
  C('L04', 'Last Line', 'leadership', 'common', { dr: [0.10, 0.14, 0.18], atk: [0.08, 0.12, 0.16] }, v => `Defenders and keepers near your goal take ${P(v.dr)} less damage and deal +${P(v.atk)}.`, { trigger: 'zone' }),
  C('L05', "Goalkeeper's Instinct", 'leadership', 'rare', { add: [0.06, 0.09, 0.12], syn: 0.05 }, v => `Your keepers' real save chance +${P(v.add)} (Buffo alive: +${P(v.syn)} more; max 90%).`, { lead: 'buffo', trigger: 'SAVE' }),
  C('L06', 'Captain Relay', 'leadership', 'rare', { n: [8, 10, 12] }, v => `Every 6s while your captain stands, the ${v.n} nearest mates get +12% damage and +6% speed for 2s.`, { trigger: 'timer' }),
  C('L07', 'Tactical Signal', 'leadership', 'epic', { dur: [1.5, 2.5, 3.5], spd: [0.04, 0.06, 0.08] }, v => `Tactical Focus lasts ${v.dur}s longer and focused players move +${P(v.spd)} faster.`, { trigger: 'focus' }),
  C('L08', 'One Last Rally', 'leadership', 'legendary', { heal: [0.10, 0.14, 0.18] }, v => `Once per wave, when only 30% of the wave's Survivors remain: all heal ${P(v.heal)} max HP and gain +15% damage for 5s.`, { trigger: 'few_left' }),
  // Chaos
  C('C01', 'Lucky Deflection', 'chaos', 'common', { ch: [0.08, 0.12, 0.16], icd: 1 }, v => `${P(v.ch)} chance to deflect a ranged hit completely (1s per player).`, { trigger: 'damage_taken' }),
  C('C02', 'Rebound Rhythm', 'chaos', 'common', { r: [50, 65, 80] }, v => `When the ball comes loose, your nearest player within ${v.r}px sprints +25% for 1.2s.`, { trigger: 'BALL_LOOSE' }),
  C('C03', 'Chain Reaction', 'chaos', 'rare', { n: [3, 4, 5], stun: [0.25, 0.35, 0.45] }, v => `A real K.O. knocks back and stuns up to ${v.n} rivals nearby for ${v.stun}s (no damage).`, { trigger: 'KO' }),
  C('C04', 'Pinball Control', 'chaos', 'rare', { r: [3, 4.5, 6] }, v => `Your players collect loose balls from ${v.r}px further away.`, { trigger: 'BALL_LOOSE' }),
  C('C05', 'Storm of Passes', 'chaos', 'epic', { rate: [0.15, 0.20, 0.25], atk: [0.05, 0.08, 0.10] }, v => `On a 2nd+ completed pass in a row, mates near the receiver gain +${P(v.rate)} attack rate and +${P(v.atk)} damage for 3s.`, { trigger: 'PASS_COMPLETE' }),
  C('C06', 'Perfect Counter', 'chaos', 'epic', { stun: [0.40, 0.55, 0.70] }, v => `A real tackle or interception stuns the robbed rival ${v.stun}s; the winner's next shot within 3s is 40% more accurate.`, { trigger: 'BALL_GAIN' }),
  C('C07', 'Chaos Shield', 'chaos', 'epic', { dr: [0.08, 0.11, 0.14] }, v => `Survivors in a scrum (4+ players close by) take ${P(v.dr)} less damage.`, { trigger: 'crowd' }),
  C('C08', 'Echo Impact', 'chaos', 'legendary', { ch: [0.20, 0.28, 0.36], mul: [0.50, 0.60, 0.70], icd: [0.5, 0.4, 0.3] }, v => `${P(v.ch)} chance a critical hit echoes 0.3s later for ${P(v.mul)} of its damage. Echoes never echo.`, { trigger: 'CRIT' })
];
CARDS.forEach((c, i) => { c.idx = i; });
const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));
const CATEGORIES = ['survival', 'knockout', 'football', 'movement', 'leadership', 'chaos'];
const CAT_NAME = { survival: 'Survival', knockout: 'Knockout', football: 'Football', movement: 'Movement', leadership: 'Leadership', chaos: 'Chaos' };
const RARITY_W = { common: 60, rare: 30, epic: 9, legendary: 1 };
const START_CARDS = ['S01', 'S02', 'S05', 'S08', 'K01', 'K03', 'K04', 'F01', 'F03', 'F04', 'M01', 'M05', 'L01', 'L03', 'C01', 'C03'];
const CARD_UNLOCKS = { 5: 'S03', 10: 'F02', 15: 'S06', 19: 'K05', 25: 'M02', 30: 'F05', 35: 'L02', 39: 'F07', 45: 'L05', 50: 'L04', 55: 'S07', 59: 'K07',
  65: 'K02', 70: 'K06', 75: 'C02', 79: 'K08', 85: 'M03', 90: 'M06', 95: 'F08', 99: 'M08', 105: 'M04', 110: 'F06', 115: 'M07', 119: 'C05',
  125: 'S04', 130: 'L06', 135: 'L07', 139: 'L08', 145: 'C04', 150: 'C06', 155: 'C07', 159: 'C08' };
CARDS.forEach(c => { c.unlock = START_CARDS.includes(c.id) ? 0 : +Object.keys(CARD_UNLOCKS).find(k => CARD_UNLOCKS[k] === c.id); });
// ---------------- 5 Star Leaders ----------------
const LEADERS = [
  { id: 'stev', name: 'Stev Gerard', role: 'captain', unlock: 0, card: 'L01', syn: 'Captain\'s Oath: aura mates take an extra 4% less damage while he stands.' },
  { id: 'pao', name: 'Pao Maldin', role: 'defender', unlock: 5, card: 'S01', syn: 'Iron Discipline: defenders in your half take an extra 4% less damage while he stands.' },
  { id: 'nazar', name: 'Ronald Nazar', role: 'striker', unlock: 15, card: 'F01', syn: 'Precision Shot: all shots +10% accuracy, his own +15%, while he stands.' },
  { id: 'xav', name: 'Xav Hern', role: 'playmaker', unlock: 30, card: 'F02', syn: 'Quick Passing: passes +5% faster and 10% harder to intercept while he stands.' },
  { id: 'buffo', name: 'Buffo', role: 'goalkeeper', unlock: 50, card: 'L05', syn: 'Goalkeeper\'s Instinct: +5% save chance while he stands (max 90%).' }
];
// ---------------- Training, economy, medals ----------------
const TRAINING = {
  stats: ['attack', 'defense', 'speed', 'technique', 'stamina'],
  names: { attack: 'Attack', defense: 'Defense', speed: 'Speed', technique: 'Technique', stamina: 'Stamina' },
  base: { attack: 38, defense: 37, speed: 40, technique: 36, stamina: 39 },
  tiers: ['Rookie', 'Professional', 'Elite', 'Master', 'Legendary'], coef: [0.60, 0.48, 0.38, 0.30, 0.24], cost: [80, 250, 800, 2500, 8000], max: 100
};
const ECONOMY = {
  base: [300, 600, 1000, 1700, 2800, 4600, 7300, 11500, 18000, 28000],
  mult: { boss: 1.30, elite: 1.15, soft: 1.20, normal: 1.00 },
  medals: { normal: [70, 45, 20], elite: [55, 30, 12], boss: [35, 18, 7] }, medalBonus: { gold: 0.08, silver: 0.05, bronze: 0.02, clear: 0 }, bonusCap: 0.10, leaderMax: 0.02
};
const CUPS = BOSS_LEVELS.map(l => ({ level: l, name: BOSSES[l].cup, boss: BOSSES[l].name }));
// ---------------- contextual tutorial (shown once, archived in Settings → Help) ----------------
const TIPS = {
  army: { t: 'Your Survivor Army', x: 'You lead exactly 100 players. Survive every wave: a player who is K.O.\'d is gone for the rest of this attempt.' },
  first_card: { t: 'Run cards', x: 'Pick one of three cards before wave 1 and after waves. Cards last for this attempt only. Picking a card you already hold ranks it up (max Rank III).' },
  waves: { t: 'Waves', x: 'Each wave is a fresh rival army. Your survivors keep their HP and heal 10% between waves. Survive 45 s or K.O. every rival.' },
  training: { t: 'Training', x: 'Spend Coins on five permanent stats between runs. Rivals never scale with your Training.' },
  focus: { t: 'Tactical Focus', x: 'GOAL, KO and SURVIVE change your players\' priorities for 8 s. Two per wave, 5 s apart. They never create damage or players.' },
  goal_adv: { t: 'Goal Advantage', x: 'A real goal gives the scoring team +6% speed and damage for 2.8 s. In Survival it does not end the wave.' },
  first_ko: { t: 'Lost for this attempt', x: 'That player will not return in later waves. A retry starts again with 100.' },
  pao: { t: 'Pao Maldin + Second Wind', x: 'Pao Maldin joins every new attempt as a defender. Second Wind enters the card pool.' },
  soft_wall: { t: 'Soft Wall', x: 'A tougher test: rivals are a little stronger. Rewards are higher.' },
  goal_ch: { t: 'Goal Challenge', x: 'Score the target number of real goals across all waves and survive the final wave. Goals carry between waves.' },
  elite_ko: { t: 'Elite Total KO', x: 'Four waves. K.O. every rival in each wave within 45 s (+10 s overtime).' },
  quick_pass: { t: 'Quick Passing discovered', x: 'A new card can now appear in your offers.' },
  soft_goal: { t: 'Soft Wall Goal Challenge', x: 'Three real goals are needed. Use GOAL Focus when your attack is ready.' },
  nazar: { t: 'Ronald Nazar + Last Eleven', x: 'A striker leader joins your army. Last Eleven protects your final survivors.' },
  elite_surv: { t: 'Elite Survival', x: 'Four waves with bigger rival armies. Save SURVIVE Focus for the hard moments.' },
  counter: { t: 'Counterstrike discovered', x: 'Survivors can now strike back at close range.' },
  boss: { t: 'First Boss', x: 'Five waves, up to 100 rivals. Win to earn the Rookie Cup.' }
};
root.FWCampaignData = { LEVELS, EPISODES, GOAL_LEVELS, KO_LEVELS, SOFT_WALLS, HARD_WALLS, ELITE_LEVELS, BOSS_LEVELS, WAVE_COUNTS, WAVE_COEF, DRAFT_PLAN,
  ROLE_ORDER, EP_ROLES, ARMY_ROLES, THREAT, TACTICS, BOSSES, BOSS_ROLES, TRAINING, ECONOMY, CUPS, TIPS, range };
root.FWCards = { CARDS, BY_ID: CARD_BY_ID, CATEGORIES, CAT_NAME, RARITY_W, START_CARDS, CARD_UNLOCKS };
root.FWLeaders = { LEADERS, BY_ID: Object.fromEntries(LEADERS.map(l => [l.id, l])) };
})(typeof window !== 'undefined' ? window : globalThis);
