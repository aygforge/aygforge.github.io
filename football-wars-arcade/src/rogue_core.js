/* FOOTBALL WARS: ROGUELITE REBORN — game logic (no DOM).
 * FWTraining · FWEconomy · FWMedals · FWSurvivorArmy · FWEnemyTactics · FWCardDraft · FWCampaignProgress ·
 * FWObjectiveResolver (re-exported from the engine) · FWBattleAdapter · FWRun · FWSaveManager · FWValidation */
(function (root) {
'use strict';
const E = root.FWEngine, D = root.FWCampaignData, K = root.FWCards, LD = root.FWLeaders;
const roundTo5 = x => Math.round(x / 5) * 5;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const hash = s => E.hashStr(String(s));
const newRng = (...parts) => new E.Rng(hash(parts.join('|')));
E.RG.CARD_IDX = Object.fromEntries(K.CARDS.map(c => [c.id, c.idx]));

// ======================= FWTraining =======================
const TR = D.TRAINING;
const Training = {
  tier: L => Math.min(4, Math.floor((L - 1) / 20)),
  // value of a stat at Training level L: base + per-level gains (Rookie 0.60 … Legendary 0.24); breakthroughs are free
  value(stat, L) { let v = TR.base[stat]; for (let l = 2; l <= L; l++) v += TR.coef[Training.tier(l)]; return Math.round(v * 100) / 100; },
  cost(L) { if (L >= TR.max) return null; return roundTo5(TR.cost[Training.tier(L)] * Math.pow(1.055, (L - 1) % 20)); },
  values(levels) { const o = {}; for (const s of TR.stats) o[s] = Training.value(s, levels[s] || 1); return o; },
  canBuy(save, stat) {
    if (save.campaignCompleted) return { ok: false, why: 'Campaign complete — Training is read-only.' };
    if (save.run) return { ok: false, why: 'Training is closed during an active run.' };
    const L = save.training[stat]; const c = Training.cost(L);
    if (c == null) return { ok: false, why: 'Max level reached.' };
    if (save.coins < c) return { ok: false, why: 'Not enough Coins.' };
    return { ok: true, cost: c };
  },
  buy(save, stat) {
    if (TR.stats.indexOf(stat) < 0) return { ok: false, why: 'Unknown stat.' };
    const chk = Training.canBuy(save, stat); if (!chk.ok) return chk;   // validate first, then pay, then level up
    save.coins -= chk.cost; save.training[stat]++; save.stats.trainingSpent += chk.cost;
    return { ok: true, cost: chk.cost, level: save.training[stat] };
  },
  totalCost(from, to) { let s = 0; for (let l = from; l < to; l++) s += Training.cost(l); return s; }
};
// stat values → engine modifiers (the SAME mapping is used for the player army and for the Episode threat budget)
function statMods(st) {
  const r = (v, e) => Math.pow(Math.max(5, v) / 55, e);
  const techAt = clamp(30 + st.technique * 0.9, 1, 100), stam = clamp(30 + st.stamina * 0.85, 1, 100);
  return {
    dmg: r(st.attack, 1.0), hp: r(st.defense, 0.6) * r(st.stamina, 0.3), armor: (st.defense - 55) / 900, speed: r(st.speed, 0.35), rate: r(st.speed, 0.15),
    drain: clamp(1.35 - stam / 160, 0.6, 1.4), tech: 1 + 0.06 * (techAt - 70) / 30, gk: clamp(45 + st.defense * 0.5, 1, 100), crit: clamp(0.05 + (st.technique - 38) / 1000, 0.03, 0.12),
    knock: r(st.stamina, 0.3), teamwork: 1 + (st.technique - 55) / 300, shot: r(st.technique, 0.3), fin: techAt, techAt, press: clamp(40 + (st.speed + st.attack) * 0.3, 1, 100)
  };
}

// ======================= FWEnemyTactics =======================
// Calibrated on the real engine (tools/rogue_calibrate.js); a fixed table per Episode, never read from the player's Training.
// Kind / mission factors keep multi-wave Elite and Boss runs and the Total KO time limit fair (calibrated the same way).
const KIND_F = { normal: 1, elite: 0.88, boss: 0.62 }; let KO_F = 0.81;
// per-level fine tuning for the hardest exams (Elite + Hard Walls and late Bosses), from tools/rogue_tune_level.js
const LEVEL_ADJ = { 72: 0.95, 151: 0.85, 119: 0.97, 140: 0.97, 180: 0.85, 187: 0.92, 191: 0.87, 199: 0.95, 200: 0.90 };
const EP_K = [1.63, 1.85, 2.34, 1.91, 1.97, 1.79, 1.75, 1.46, 1.44, 1.20];
const SPECIALS = { possession: ['one_two_combo', 'precision_through_ball'], high_press: ['pressing_storm', 'high_line_interception'], counter: ['counter_burst', 'quick_transition'],
  defensive_block: ['iron_wall', 'last_line_save'], wing_attack: ['cross_fire', 'flank_overload'], physical: ['shoulder_charge', 'stamina_surge'] };
const Enemy = {
  local(L) { return L.ep === 1 ? 0.78 + 0.012 * (L.n - 1) : 0.88 + 0.012 * (L.n - 1); },
  wall(L) { return L.hard ? 1.13 : L.soft ? 1.06 : 1; },
  statLevel(ep) { return 38 + (D.THREAT[ep - 1] - 100) / 100 * 39; },
  strength(L, wave) { return EP_K[L.ep - 1] * KIND_F[L.kind] * (L.mission === 'ko' ? KO_F : 1) * (LEVEL_ADJ[L.level] || 1) * Enemy.local(L) * D.WAVE_COEF[L.kind][wave] * Enemy.wall(L); },
  mods(L, wave, tacticId) {
    const tac = D.TACTICS[tacticId], b = tac.bud, s = Enemy.statLevel(L.ep);
    const m = statMods({ attack: s * b[0], defense: s * b[1], speed: s * b[2], technique: s, stamina: s * (tacticId === 'marathon_squad' ? 1.12 : 1) });
    const f = Enemy.strength(L, wave);
    m.dmg *= Math.sqrt(f); m.hp *= Math.sqrt(f);
    return m;
  },
  roles(ep, count, tacticId, boss) {
    const row = boss && D.BOSS_ROLES[tacticId] ? D.EP_ROLES[D.BOSS_ROLES[tacticId] - 1] : D.EP_ROLES[ep - 1];
    const raw = row.map(x => x * count / 100), out = raw.map(Math.floor);
    let left = count - out.reduce((a, b) => a + b, 0);
    raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
    for (const need of [6, 4]) if (out[need] < 1) { const big = out.indexOf(Math.max(...out)); out[big]--; out[need] = 1; } // one captain and a keeper in every wave
    const o = {}; D.ROLE_ORDER.forEach((r, i) => { o[r] = out[i]; }); return o;
  },
  team(L, wave) {
    const tid = L.tactics[wave], tac = D.TACTICS[tid], ep = D.EPISODES[L.ep - 1], count = L.counts[wave];
    const sp = SPECIALS[tac.arch];
    return { id: 'RRB_E' + L.ep + '_' + tid, name: tac.name, display_name_tr: tac.name, short: tac.name.split(' ')[0].slice(0, 8), type: 'club', country: ep.name,
      visual: { primary_color: ep.color[0], secondary_color: ep.color[1] },
      battle_profile: { power_index: 60, archetype: tac.arch, attributes: flatAttrs(), roles_per_100: Enemy.roles(L.ep, count, tid, L.kind === 'boss'), specials: sp.slice(0, L.ep <= 3 ? 1 : 2),
        aggression: 60, variance: { team_form_std_pct: 4, unit_trait_std_pct: 14, critical_chance_pct: 7, critical_multiplier: 1.45, streak_adaptation: true } } };
  }
};
function flatAttrs() { const o = {}; for (const k of E.ATTRS) o[k] = 70; return o; }

// ======================= FWSurvivorArmy =======================
const ARMY_VISUAL = { primary_color: '#2bd1ff', secondary_color: '#0b2a6b' };
const Army = {
  create(save, run) {
    const rng = newRng('RRB_ARMY', run.seed);
    const mods = statMods(Training.values(save.training));
    const unlocked = LD.LEADERS.filter(l => save.leaders.indexOf(l.id) >= 0);
    const out = []; let pid = 0;
    D.ROLE_ORDER.forEach((role, ri) => {
      const lead = unlocked.find(l => l.role === role);
      for (let i = 0; i < D.ARMY_ROLES[ri]; i++) {
        const skill = clamp(1 + rng.normal() * 0.14, 0.78, 1.22);
        const leader = i === 0 && lead ? lead.id : '';
        const maxHp = E.RG.unitMaxHp(role, leader ? Math.max(skill, 1.05) : skill, mods, !!leader);
        out.push({ pid: pid++, role, leader, name: leader ? lead.name : '', skill: +(leader ? Math.max(skill, 1.05) : skill).toFixed(4), maxHp: +maxHp.toFixed(3), hp: +maxHp.toFixed(3), alive: true, koWave: -1 });
      }
    });
    return out;
  },
  alive: roster => roster.filter(u => u.alive).length,
  roleCounts(roster) { const o = {}; for (const r of D.ROLE_ORDER) o[r] = 0; for (const u of roster) if (u.alive) o[u.role]++; return o; },
  team(save, run) {
    return { id: 'RRB_ARMY', name: 'Survivor Army', display_name_tr: 'Survivor Army', short: 'ARMY', type: 'club', country: 'Arcade HQ', player: true, visual: Object.assign({}, ARMY_VISUAL),
      battle_profile: { power_index: 60, archetype: 'possession', attributes: flatAttrs(), roles_per_100: Army.roleCounts(run.roster), specials: ['one_two_combo', 'last_line_save'], aggression: 62,
        variance: { team_form_std_pct: 4, unit_trait_std_pct: 14, critical_chance_pct: 7, critical_multiplier: 1.45, streak_adaptation: true } } };
  },
  // end of a cleared wave: HP carried over, base 10% heal (+ Field Medic), total ≤25% and never above max HP
  heal(run) {
    const medic = run.cards.S02 ? cardFx('S02', run.cards.S02).heal : 0;
    const f = Math.min(0.25, 0.10 + medic); let healed = 0;
    for (const u of run.roster) if (u.alive) { const before = u.hp; u.hp = +Math.min(u.maxHp, u.hp + u.maxHp * f).toFixed(3); healed += u.hp - before; }
    return { pct: f, healed: Math.round(healed) };
  }
};

// ======================= FWCards / FWCardDraft =======================
function cardFx(id, rank) {
  const c = K.BY_ID[id], o = {};
  for (const k in c.v) o[k] = Array.isArray(c.v[k]) ? c.v[k][Math.min(3, rank) - 1] : c.v[k];
  return o;
}
const Draft = {
  eligible(save, run) { return K.CARDS.filter(c => save.cards.indexOf(c.id) >= 0 && (run.cards[c.id] || 0) < 3); },
  // Balanced Category Draft: 3 different eligible cards, rarity weights 60/30/9/1 (re-normalised over rarities that have
  // eligible cards), at least two categories when the pool allows it. Deterministic from the run seed + draft counter.
  offer(save, run) {
    const rng = newRng('RRB_DRAFT', run.seed, run.draft.n);
    const pool = Draft.eligible(save, run), pick = [];
    const drawFrom = list => {
      const rar = Object.keys(K.RARITY_W).filter(r => list.some(c => c.rarity === r));
      if (!rar.length) return null;
      const tot = rar.reduce((a, r) => a + K.RARITY_W[r], 0); let x = rng.next() * tot, R = rar[rar.length - 1];
      for (const r of rar) { x -= K.RARITY_W[r]; if (x < 0) { R = r; break; } }
      const cs = list.filter(c => c.rarity === R); return cs[rng.int(cs.length)];
    };
    while (pick.length < 3) { const c = drawFrom(pool.filter(p => pick.indexOf(p) < 0)); if (!c) break; pick.push(c); }
    if (pick.length === 3 && pick.every(c => c.cat === pick[0].cat)) {
      const other = pool.filter(c => c.cat !== pick[0].cat);
      if (other.length) pick[2] = drawFrom(other);
    }
    return pick.map(c => c.id);
  },
  open(save, run) { if (!run.draft.offer) { run.draft.offer = Draft.offer(save, run); run.draft.offered.push(run.draft.offer.slice()); } return run.draft.offer; },
  pick(save, run, id) {
    const off = run.draft.offer; if (!off || off.indexOf(id) < 0) return { ok: false };
    const rank = Math.min(3, (run.cards[id] || 0) + 1); run.cards[id] = rank;
    run.draft.picks.push({ n: run.draft.n, wave: run.wave, id, rank }); run.draft.n++; run.draft.offer = null; run.draft.left--;
    return { ok: true, id, rank };
  },
  fx(run) { const o = {}; for (const id in run.cards) o[id] = cardFx(id, run.cards[id]); return o; }
};

// ======================= FWEconomy / FWMedals =======================
const Economy = {
  levelBase(L) { const b = D.ECONOMY.base[L.ep - 1], m = D.ECONOMY.mult; return b * (L.kind === 'boss' ? m.boss : L.kind === 'elite' ? m.elite : L.soft ? m.soft : m.normal); },
  medal(L, survivors) {
    if (survivors <= 0) return null;
    const t = D.ECONOMY.medals[L.kind === 'boss' ? 'boss' : L.kind === 'elite' ? 'elite' : 'normal'];
    return survivors >= t[0] ? 'gold' : survivors >= t[1] ? 'silver' : survivors >= t[2] ? 'bronze' : 'clear';
  },
  leaderBonus(startLeaders, aliveLeaders) { if (!startLeaders.length) return 0; const n = aliveLeaders.filter(x => startLeaders.indexOf(x) >= 0).length; return Math.min(D.ECONOMY.leaderMax, 0.02 * n / startLeaders.length); },
  win(L, survivors, startLeaders, aliveLeaders) {
    const base = Economy.levelBase(L), medal = Economy.medal(L, survivors);
    const mb = D.ECONOMY.medalBonus[medal] || 0, lb = Economy.leaderBonus(startLeaders, aliveLeaders);
    const bonus = Math.min(D.ECONOMY.bonusCap, mb + lb);
    return { base, medal, medalBonus: mb, leaderBonus: +lb.toFixed(4), bonus: +bonus.toFixed(4), coins: roundTo5(base * (1 + bonus)) };
  },
  fail(L, completedWaves) {
    const base = Economy.levelBase(L), cw = clamp(completedWaves, 0, L.waves - 1);
    return { base, completedWaves: cw, coins: roundTo5(base * (0.30 + 0.55 * cw / (L.waves - 1))) };
  }
};

// ======================= FWCampaignProgress =======================
const Progress = {
  level: n => D.LEVELS[n - 1] || null,
  next(save) { return save.campaignCompleted ? null : save.highest + 1; },
  state(save, n) { return save.completed[n] ? 'done' : n === save.highest + 1 && !save.campaignCompleted ? 'open' : 'locked'; },
  canStart(save, n) { return n >= 1 && n <= 200 && Progress.state(save, n) === 'open' && !save.run; },
  nextUnlock(save) {
    const from = save.highest + 1, out = [];
    for (let l = from; l <= 200 && out.length < 2; l++) {
      if (K.CARD_UNLOCKS[l]) out.push({ level: l, kind: 'card', id: K.CARD_UNLOCKS[l], name: K.BY_ID[K.CARD_UNLOCKS[l]].name });
      const ld = LD.LEADERS.find(x => x.unlock === l); if (ld) out.push({ level: l, kind: 'leader', id: ld.id, name: ld.name });
    }
    return out;
  },
  rewardsOf(n) {
    const o = []; if (K.CARD_UNLOCKS[n]) o.push({ kind: 'card', id: K.CARD_UNLOCKS[n] });
    const ld = LD.LEADERS.find(x => x.unlock === n); if (ld) o.push({ kind: 'leader', id: ld.id });
    if (D.BOSS_LEVELS.indexOf(n) >= 0) o.push({ kind: 'cup', id: n }); return o;
  }
};

// ======================= FWBattleAdapter (one engine world per wave) =======================
const Battle = {
  snapshot(save, run) {
    const L = Progress.level(run.level), wv = run.wave, final = wv === L.waves - 1;
    const tid = L.tactics[wv];
    const seed = hash('RRB_WAVE|' + run.seed + '|' + wv);
    return {
      v: 1, runId: run.id, level: L.level, wave: wv, waves: L.waves, seed, final,
      obj: { type: L.mission, final, waveSec: 45, otSec: 10, target: L.goalTarget, goalsBefore: run.goals },
      roster: run.roster.filter(u => u.alive).map(u => ({ pid: u.pid, role: u.role, leader: u.leader, name: u.name, skill: u.skill, maxHp: u.maxHp, hp: u.hp })),
      cards: Draft.fx(run), cardRanks: Object.assign({}, run.cards),
      ai: [{}, D.TACTICS[tid].ai], tactic: tid, bossCap: L.kind === 'boss',
      mods: [run.mods, Enemy.mods(L, wv, tid)],
      teamA: Army.team(save, run), teamB: Enemy.team(L, wv),
      label: 'Level ' + L.level + ' · Wave ' + (wv + 1) + '/' + L.waves
    };
  },
  worldOpts(snap, o) {
    o = o || {};
    return { seed: snap.seed, teamA: snap.teamA, teamB: snap.teamB, cfg: root.FW_ENGINE_CONFIG, duration: 'standard', fxLevel: o.fxLevel == null ? 1 : o.fxLevel,
      ruleset: 'fusion', fbIntensity: 'normal', goalAdv: true, headless: !!o.headless,
      rogue: { obj: snap.obj, roster: snap.roster, cards: snap.cards, ai: snap.ai, mods: snap.mods, bossCap: snap.bossCap, inputs: o.inputs || [] } };
  },
  runSlice(w, ticks) { let n = 0; while (w.phase !== 'ended' && n++ < ticks) { E.step(w); if (w.headless && w.events.length > 3000) w.events.length = 0; } return w.phase === 'ended'; },
  simulate(snap, inputs) { const w = E.createWorld(Battle.worldOpts(snap, { headless: true, inputs })); while (!Battle.runSlice(w, 100000)); return w; },
  result(w) { return E.rgSummary(w); }
};

// ======================= FWRun (attempt lifecycle) =======================
const Run = {
  start(save, n) {
    if (!Progress.canStart(save, n)) return null;
    const attempt = (save.attempts[n] || 0) + 1; save.attempts[n] = attempt;
    const L = Progress.level(n);
    const run = { id: 'L' + n + ':A' + attempt, level: n, attempt, seed: hash('RRB_RUN|' + save.salt + '|' + n + '|' + attempt), startedAt: Date.now(), phase: 'draft',
      roster: null, cards: {}, wave: 0, goals: 0, waveLog: [], focusLog: [], leadersAtStart: save.leaders.slice(),
      training: Object.assign({}, save.training), mods: null, draft: { n: 0, left: D.DRAFT_PLAN[L.kind][0], offer: null, offered: [], picks: [] }, pending: null, clear: null };
    run.mods = statMods(Training.values(save.training));
    run.roster = Army.create(save, run);
    save.run = run; save.stats.runs++;
    Draft.open(save, run);
    return run;
  },
  pick(save, id) {
    const run = save.run; if (!run || run.phase !== 'draft') return { ok: false };
    const r = Draft.pick(save, run, id); if (!r.ok) return r;
    if (run.draft.left > 0) Draft.open(save, run); else run.phase = 'ready';
    return r;
  },
  beginWave(save) {
    const run = save.run; if (!run || run.phase !== 'ready') return null;
    const snap = Battle.snapshot(save, run);
    run.pending = { snap, inputs: [], lastTick: 0 }; run.phase = 'battle';
    return snap;
  },
  // wave summary from the engine → persistent army; returns 'clear' | 'win' | 'lose'
  endWave(save, sum) {
    const run = save.run; if (!run || run.phase !== 'battle' || !sum || !sum.result) return null;
    const L = Progress.level(run.level), byPid = new Map(sum.units.map(u => [u.pid, u]));
    for (const u of run.roster) {
      if (!u.alive) continue;
      const s = byPid.get(u.pid); if (!s) continue;
      if (!s.alive) { u.alive = false; u.hp = 0; u.koWave = run.wave; } else u.hp = Math.min(u.maxHp, s.hp);
    }
    const alive = Army.alive(run.roster);
    run.goals += sum.goals[0];
    const log = { wave: run.wave, tactic: L.tactics[run.wave], start: sum.start[0], end: alive, enemies: sum.start[1], kos: sum.kos, lost: sum.lost, goals: sum.goals.slice(), outcome: sum.result.outcome,
      reason: sum.result.reason, seconds: sum.result.battleT, focus: sum.focus.map(f => f.f), procs: sum.procs, emergency: sum.emergency, hash: sum.hash, heal: null };
    run.waveLog.push(log); run.focusLog.push(...sum.focus.map(f => ({ wave: run.wave, f: f.f })));
    save.stats.goals += sum.goals[0]; save.stats.kos += sum.kos;
    run.pending = null;
    const out = sum.result.outcome;
    if (out === 'clear') {
      log.heal = Army.heal(run);
      run.clear = log; run.wave++; run.phase = 'clear';
    } else run.phase = 'over';
    return out;
  },
  afterClear(save) {
    const run = save.run; if (!run || run.phase !== 'clear') return;
    const L = Progress.level(run.level); const picks = D.DRAFT_PLAN[L.kind][run.wave] || 0;
    run.clear = null;
    if (picks > 0) { run.draft.left = picks; run.phase = 'draft'; Draft.open(save, run); } else run.phase = 'ready';
  },
  // atomic first-clear transaction (one localStorage write after it): completion, Coins, medal, card, leader, cup, next level
  finish(save) {
    const run = save.run; if (!run || run.phase !== 'over') return null;
    const L = Progress.level(run.level), last = run.waveLog[run.waveLog.length - 1], won = last && last.outcome === 'win';
    let res;
    if (won) {
      const alive = Army.alive(run.roster);
      const aliveLeaders = run.roster.filter(u => u.alive && u.leader).map(u => u.leader);
      const pay = Economy.win(L, alive, run.leadersAtStart, aliveLeaders);
      res = { kind: 'win', level: L.level, coins: 0, pay, medal: pay.medal, survivors: alive, unlocks: [], cup: null, achievements: [] };
      tx(save, 'level:' + L.level + ':first_clear', () => {
        save.coins += pay.coins; save.stats.coinsEarned += pay.coins; res.coins = pay.coins;
        const rec = { level: L.level, ep: L.ep, mission: L.mission, kind: L.kind, soft: L.soft, hard: L.hard, medal: pay.medal, survivors: alive,
          waveSurvivors: run.waveLog.map(w => w.end), leadersAlive: aliveLeaders, leadersAtStart: run.leadersAtStart.slice(), cards: Object.keys(run.cards).map(id => ({ id, rank: run.cards[id] })),
          focus: run.focusLog.slice(), goals: run.goals, training: Object.assign({}, run.training), coins: pay.coins, attempt: run.attempt, at: Date.now(), cup: null, waves: run.waveLog.map(w => Object.assign({}, w, { procs: undefined })) };
        for (const u of Progress.rewardsOf(L.level)) {
          if (u.kind === 'card' && save.cards.indexOf(u.id) < 0) { save.cards.push(u.id); res.unlocks.push(u); }
          if (u.kind === 'leader' && save.leaders.indexOf(u.id) < 0) { save.leaders.push(u.id); res.unlocks.push(u); }
          if (u.kind === 'cup') { save.cups[L.level] = { at: Date.now(), survivors: alive, medal: pay.medal }; rec.cup = D.BOSSES[L.level].cup; res.cup = rec.cup; }
        }
        const sl = run.leadersAtStart, al = aliveLeaders.filter(x => sl.indexOf(x) >= 0);
        const ach = [];
        if (sl.length && al.length === sl.length) ach.push('unbroken');
        if (sl.length === 5 && al.length === 5) ach.push('perfect');
        if (sl.length >= 2 && al.length === 1) ach.push('last_captain');
        for (const a of ach) { save.achievements[a] = save.achievements[a] || []; save.achievements[a].push(L.level); }
        res.achievements = ach;
        save.completed[L.level] = rec; save.highest = Math.max(save.highest, L.level); save.stats.wins++;
        if (L.level === 200) { save.campaignCompleted = true; save.completedAt = Date.now(); res.campaign = true; }
      });
    } else {
      const cw = run.waveLog.filter(w => w.outcome === 'clear').length;
      const pay = Economy.fail(L, cw);
      res = { kind: 'fail', level: L.level, coins: 0, pay, reason: last ? last.reason : 'army_ko', completedWaves: cw };
      tx(save, 'level:' + L.level + ':attempt:' + run.attempt + ':fail', () => { save.coins += pay.coins; save.stats.coinsEarned += pay.coins; save.stats.fails++; res.coins = pay.coins; });
    }
    res.run = { waveLog: run.waveLog, cards: Object.assign({}, run.cards), goals: run.goals, attempt: run.attempt, focus: run.focusLog.slice() };
    save.lastResult = res; save.run = null;
    return res;
  },
  abandon(save) { // manual quit: 0 Coins, no ledger entry
    const run = save.run; if (!run) return null;
    save.lastResult = { kind: 'abandon', level: run.level, coins: 0 }; save.stats.abandons++; save.run = null; return save.lastResult;
  }
};
function tx(save, id, fn) { if (save.ledger[id]) return false; fn(); save.ledger[id] = Date.now(); return true; }

// ======================= FWSaveManager =======================
const SAVE_KEY = 'FW_RRB_SAVE_V1', BAK_KEY = 'FW_RRB_SAVE_V1_BAK', SAVE_VERSION = 1;
function defaults() {
  const tr = {}; for (const s of TR.stats) tr[s] = 1;
  return { v: SAVE_VERSION, game: 'FW_RRB', salt: (Math.random() * 4294967296) >>> 0, created: Date.now(), coins: 0, training: tr, highest: 0, completed: {}, leaders: ['stev'], cards: K.START_CARDS.slice(),
    cups: {}, achievements: {}, tips: {}, ledger: {}, attempts: {}, run: null, campaignCompleted: false, completedAt: 0, lastResult: null,
    settings: { master: 0.8, music: 0.5, sfx: 0.8, crowd: 0.6, mute: false, vibration: true, vfx: 'medium', reduceMotion: false },
    stats: { runs: 0, wins: 0, fails: 0, abandons: 0, goals: 0, kos: 0, coinsEarned: 0, trainingSpent: 0 } };
}
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const SaveM = {
  KEY: SAVE_KEY, BAK: BAK_KEY, VERSION: SAVE_VERSION, defaults,
  // repairs types and ranges; returns null when the data is not a Roguelite Reborn save
  validate(raw) {
    if (!isObj(raw) || raw.game !== 'FW_RRB' || typeof raw.v !== 'number' || raw.v > SAVE_VERSION) return null;
    const d = defaults(), s = Object.assign({}, d, raw);
    s.coins = Number.isFinite(+s.coins) ? Math.max(0, Math.floor(+s.coins)) : 0;
    s.training = Object.assign({}, d.training, isObj(raw.training) ? raw.training : {});
    for (const k of TR.stats) s.training[k] = clamp(Math.floor(+s.training[k]) || 1, 1, TR.max);
    s.highest = clamp(Math.floor(+s.highest) || 0, 0, 200);
    for (const k of ['completed', 'cups', 'achievements', 'tips', 'ledger', 'attempts']) if (!isObj(s[k])) s[k] = {};
    s.leaders = Array.isArray(s.leaders) ? s.leaders.filter(x => LD.BY_ID[x]) : ['stev']; if (s.leaders.indexOf('stev') < 0) s.leaders.unshift('stev');
    s.cards = Array.isArray(s.cards) ? s.cards.filter(x => K.BY_ID[x]) : K.START_CARDS.slice();
    for (const c of K.START_CARDS) if (s.cards.indexOf(c) < 0) s.cards.push(c);
    s.settings = Object.assign({}, d.settings, isObj(raw.settings) ? raw.settings : {});
    s.stats = Object.assign({}, d.stats, isObj(raw.stats) ? raw.stats : {});
    s.campaignCompleted = !!s.campaignCompleted && s.highest >= 200;
    if (s.run && !SaveM.validRun(s.run)) s.run = null;
    // progress consistency: completed levels must be contiguous from 1
    for (let l = 1; l <= s.highest; l++) if (!s.completed[l]) { s.highest = l - 1; break; }
    return s;
  },
  validRun(r) {
    return isObj(r) && Number.isInteger(r.level) && r.level >= 1 && r.level <= 200 && Array.isArray(r.roster) && r.roster.length === 100 && isObj(r.cards) && isObj(r.draft) &&
      ['draft', 'ready', 'battle', 'clear', 'over'].indexOf(r.phase) >= 0 && (r.phase !== 'battle' || (isObj(r.pending) && isObj(r.pending.snap)));
  },
  load(storage) {
    const st = storage || root.localStorage; let notice = null;
    const read = k => { try { const t = st.getItem(k); return t ? JSON.parse(t) : null; } catch (e) { return undefined; } };
    let main = read(SAVE_KEY), s = main ? SaveM.validate(main) : null;
    if (!s && main !== null) { const b = read(BAK_KEY); const sb = b ? SaveM.validate(b) : null; if (sb) { s = sb; notice = 'Your save was damaged — the last good backup was restored.'; } else notice = 'Your save could not be read — a new career was started.'; }
    return { save: s || defaults(), notice, fresh: !s };
  },
  persist(save, storage) {
    const st = storage || root.localStorage;
    try {
      const txt = JSON.stringify(save);
      const prev = st.getItem(SAVE_KEY); if (prev) { try { if (SaveM.validate(JSON.parse(prev))) st.setItem(BAK_KEY, prev); } catch (e) {} }
      st.setItem(SAVE_KEY, txt); return true;
    } catch (e) { return false; }
  },
  exportText(save) { return JSON.stringify(save); },
  importText(txt) { let o; try { o = JSON.parse(txt); } catch (e) { return { ok: false, why: 'Not valid JSON.' }; } const s = SaveM.validate(o); return s ? { ok: true, save: s } : { ok: false, why: 'Not a Roguelite Reborn save.' }; }
};

// ======================= FWValidation =======================
const Validation = {
  run() {
    const L = D.LEVELS, chk = [];
    const ok = (name, cond, info) => chk.push({ name, ok: !!cond, info: info == null ? '' : String(info) });
    const cnt = f => L.filter(f).length;
    ok('200 levels', L.length === 200);
    ok('10 Episodes × 20', D.EPISODES.length === 10 && D.EPISODES.every((e, i) => cnt(l => l.ep === i + 1) === 20));
    ok('140 Survival', cnt(l => l.mission === 'survival') === 140, cnt(l => l.mission === 'survival'));
    ok('40 Goal Challenge', cnt(l => l.mission === 'goal') === 40);
    ok('20 Total KO', cnt(l => l.mission === 'ko') === 20);
    ok('Goal ∩ KO empty', !D.GOAL_LEVELS.some(x => D.KO_LEVELS.includes(x)));
    ok('20 Soft Walls (12 S / 6 G / 2 KO)', cnt(l => l.soft) === 20 && cnt(l => l.soft && l.mission === 'survival') === 12 && cnt(l => l.soft && l.mission === 'goal') === 6 && cnt(l => l.soft && l.mission === 'ko') === 2);
    ok('14 Hard Walls (5 S / 5 G / 4 KO)', cnt(l => l.hard) === 14 && cnt(l => l.hard && l.mission === 'survival') === 5 && cnt(l => l.hard && l.mission === 'goal') === 5 && cnt(l => l.hard && l.mission === 'ko') === 4);
    ok('30 Elite', cnt(l => l.kind === 'elite') === 30);
    ok('10 Boss', cnt(l => l.kind === 'boss') === 10 && D.BOSS_LEVELS.every(b => L[b - 1].kind === 'boss'));
    ok('Elite + Hard = 53,72,136,151,191', L.filter(l => l.kind === 'elite' && l.hard).map(l => l.level).join() === '53,72,136,151,191');
    ok('Waves 3 / 4 / 5', L.every(l => l.waves === { normal: 3, elite: 4, boss: 5 }[l.kind] && l.counts.length === l.waves && l.tactics.length === l.waves));
    ok('Enemy counts', L.every(l => l.counts.join() === D.WAVE_COUNTS[l.kind].join()) && D.WAVE_COUNTS.normal.join() === '50,65,80' && D.WAVE_COUNTS.elite.join() === '45,60,75,90' && D.WAVE_COUNTS.boss.join() === '40,55,70,85,100');
    ok('Boss missions (80 KO, 120 Goal×3, others Survival)', L[79].mission === 'ko' && L[119].mission === 'goal' && L[119].goalTarget === 3 && D.BOSS_LEVELS.filter(b => b !== 80 && b !== 120).every(b => L[b - 1].mission === 'survival'));
    ok('Goal targets', L.filter(l => l.mission === 'goal').every(l => l.goalTarget === (l.kind === 'boss' ? 3 : l.kind === 'elite' ? (l.hard ? 4 : 3) : l.soft ? 3 : l.hard ? 3 : 2)) && L[150].goalTarget === 4 && L[6].goalTarget === 2);
    ok('Each Episode has 20 missions', D.EPISODES.every((e, i) => L.filter(l => l.ep === i + 1).length === 20));
    ok('48 cards, 6 × 8', K.CARDS.length === 48 && K.CATEGORIES.every(c => K.CARDS.filter(x => x.cat === c).length === 8));
    const rc = r => K.CARDS.filter(c => c.rarity === r).length;
    ok('20 C / 16 R / 9 E / 3 L', rc('common') === 20 && rc('rare') === 16 && rc('epic') === 9 && rc('legendary') === 3);
    ok('16 starting cards (10 C / 5 R / 1 E)', K.START_CARDS.length === 16 && K.START_CARDS.filter(id => K.BY_ID[id].rarity === 'common').length === 10 && K.START_CARDS.filter(id => K.BY_ID[id].rarity === 'rare').length === 5 && K.START_CARDS.filter(id => K.BY_ID[id].rarity === 'epic').length === 1);
    ok('32 card unlocks, all 48 by L159', Object.keys(K.CARD_UNLOCKS).length === 32 && new Set([...K.START_CARDS, ...Object.values(K.CARD_UNLOCKS)]).size === 48 && Math.max(...Object.keys(K.CARD_UNLOCKS).map(Number)) === 159);
    ok('Every card has 3 increasing ranks', K.CARDS.every(c => Object.values(c.v).every(v => !Array.isArray(v) || (v.length === 3 && v[0] !== v[2]))));
    ok('5 leaders (0 / 5 / 15 / 30 / 50)', LD.LEADERS.map(l => l.unlock).join() === '0,5,15,30,50');
    ok('Army = 100 (16/14/12/34/8/15/1)', D.ARMY_ROLES.reduce((a, b) => a + b, 0) === 100 && D.ARMY_ROLES.join() === '16,14,12,34,8,15,1');
    ok('Enemy role rows = 100', D.EP_ROLES.every(r => r.reduce((a, b) => a + b, 0) === 100));
    ok('All tactics defined', L.every(l => l.tactics.every(t => D.TACTICS[t])));
    ok('Wave rosters sum to count', L.every(l => l.counts.every((c, i) => Object.values(Enemy.roles(l.ep, c, l.tactics[i], l.kind === 'boss')).reduce((a, b) => a + b, 0) === c)));
    ok('No Level 201', !Progress.level(201) && D.LEVELS[199].level === 200);
    ok('Training cost formula', Training.cost(1) === 80 && Training.cost(21) === 250 && Training.cost(100) === null && Training.cost(20) === roundTo5(80 * Math.pow(1.055, 19)));
    return { ok: chk.every(c => c.ok), checks: chk };
  }
};

root.FWRogue = { Training, statMods, Enemy, EP_K, KIND_F, LEVEL_ADJ, get KO_F() { return KO_F; }, setKO(v) { KO_F = v; }, Army, Draft, cardFx, Economy, Progress, Battle, Run, Save: SaveM, Validation, ObjectiveResolver: E.ObjectiveResolver, tx, roundTo5, ARMY_VISUAL };
root.FWObjectiveResolver = E.ObjectiveResolver;
})(typeof window !== 'undefined' ? window : globalThis);
