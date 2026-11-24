// ======================= Career ruleset (career-v1) =======================
// Gated by w.career (createWorld opts.career). Adds: per-unit quality + star units (u.mod), main tactics,
// live play styles, three coach commands, a deterministic live tactical AI ("coach") and the career end rule.
// Commands are queued for the NEXT tick and logged with their tick, so live play, Auto Coach, Quick Simulate
// and replays run the exact same sequence of states.
const CAREER_DEFAULTS = { version: 'career-v1', advCap: 0.20, advScale: 22, qSlope: 0.012, starHp: 1.30, starDmg: 1.25, starSpeed: 1.05,
  cmdDur: 4, cmdCd: 8, cmdMax: 3, styleCd: 8 };
const TACTICS = {
  high_press: { tendency: 'close_range', archetype: 'high_press', depth: 22, specials: ['pressing_storm', 'high_line_interception'], chase: 1, support: 0, tackle: 0.02, drain: 1.12, home: 0, hold: 1, shoot: 1, armor: 0, atk: 1.02 },
  fortress: { tendency: 'hold_line', archetype: 'defensive_block', depth: -26, specials: ['iron_wall', 'last_line_save'], chase: -1, support: -1, tackle: 0.01, drain: 0.95, home: 0.004, hold: 1.1, shoot: 0.88, armor: 0.006, atk: 0.98 },
  counter: { tendency: 'burst', archetype: 'counter', depth: -10, specials: ['counter_burst', 'quick_transition'], chase: 0, support: 0, tackle: 0, drain: 1, home: 0.002, hold: 0.9, shoot: 1.1, armor: 0.01, atk: 1.02, counter: true },
  total: { tendency: 'formation', archetype: 'possession', depth: 6, specials: ['one_two_combo', 'precision_through_ball'], chase: 0, support: 1, tackle: 0.015, drain: 1.0, home: 0.0015, hold: 0.8, shoot: 1.05, armor: 0.015, atk: 1.04 }
};
const STYLES = {
  attack: { fwd: 0.28, home: 0, chase: 1, support: 1, shoot: 1.18, armor: -0.025, hold: 0.9 },
  balanced: { fwd: 0, home: 0, chase: 0, support: 0, shoot: 1, armor: 0, hold: 1 },
  defend: { fwd: -0.30, home: 0.006, chase: -1, support: -1, shoot: 0.82, armor: 0.035, hold: 1.15 }
};
const COMMANDS = {
  press: { speed: 1.18, atk: 1.15, chase: 2, drain: 1.8, armor: -0.05, tackle: 0.05 },
  hold: { home: 0.012, armor: 0.13, atk: 1.04, fwd: -0.08, support: -1 },
  fast: { speedAtk: 1.22, fwdAtk: 0.25, carry: 1.3, armor: -0.025, shoot: 1.2, atk: 1.06 }
};
const STYLE_IDS = ['attack', 'balanced', 'defend'], CMD_IDS = ['press', 'hold', 'fast'];
const EVC = { CMD: 60, STYLE: 61, COUNTER: 62, CMD_END: 63 };
Object.assign(EV, EVC);
const _dv = [0, 0];

function careerInit(o) {
  const rules = Object.assign({}, CAREER_DEFAULTS, o.rules || {});
  const q = (o.commands || []).filter(c => c.src !== 'coach').map((c, i) => ({ tick: c.tick, side: c.side, kind: c.kind, v: c.v, src: 'user', i }))
    .sort((a, b) => a.tick - b.tick || a.i - b.i);
  return { rules, teams: o.teams, coach: o.coach || [null, null], replayQ: q, qi: 0, pending: [], log: [] };
}
function careerTeam(T, car, side, bp) {
  const ts = car.teams[side] || {};
  const tactic = TACTICS[ts.tactic] ? ts.tactic : 'total', tac = TACTICS[tactic];
  T.tendency = tac.tendency; T.power = bp.power_index;
  const byRole = {}; for (const r of ROLES) byRole[r] = [];
  for (const s of (ts.lineup || [])) byRole[s.role].push(s);
  for (const r of ROLES) byRole[r].sort((a, b) => (b.star ? 1 : 0) - (a.star ? 1 : 0) || b.q - a.q);
  T.car = { tactic, style: STYLES[ts.style] ? ts.style : 'balanced', cmd: null, cmdEnd: 0, cmdUses: 0, cmdReady: 0, styleReady: 0, koT: [], counterReady: 0,
    depthShift: tac.depth, byRole, starUnits: [], cSpeed: 1, cSpeedAtk: 1, cAtk: 1, cDmg: 1, cArmor: 0, cDrain: 1, cHome: 0, cFwd: 0, cFwdAtk: 0, cChase: 0, cSupport: 0, cShoot: 1, cHold: 1, cTackle: 0, cCarry: 1, drift: false };
  careerRecalc(T);
}
function careerRecalc(T) {
  const c = T.car, tac = TACTICS[c.tactic], st = STYLES[c.style], cm = c.cmd ? COMMANDS[c.cmd] : {};
  c.cSpeed = cm.speed || 1; c.cSpeedAtk = c.cSpeed * (cm.speedAtk || 1);
  c.cAtk = tac.atk * (cm.atk || 1); c.cDmg = cm.dmg || 1;
  c.cArmor = tac.armor + st.armor + (cm.armor || 0);
  c.cDrain = tac.drain * (cm.drain || 1);
  c.cHome = tac.home + st.home + (cm.home || 0);
  c.cFwd = st.fwd + (cm.fwd || 0); c.cFwdAtk = cm.fwdAtk || 0;
  c.cChase = tac.chase + st.chase + (cm.chase || 0); c.cSupport = tac.support + st.support + (cm.support || 0);
  c.cShoot = tac.shoot * st.shoot * (cm.shoot || 1); c.cHold = tac.hold * st.hold;
  c.cTackle = tac.tackle + (cm.tackle || 0); c.cCarry = cm.carry || 1;
  c.drift = c.cHome !== 0 || c.cFwd !== 0 || c.cFwdAtk !== 0;
}
function careerUnit(w, T, u, spec) {
  const R = w.career.rules; u.q = spec.q; u.goals = 0; u.saves = 0;
  const qf = 1 + (spec.q - T.power) * R.qSlope;
  let hpM = qf, dmM = qf;
  if (spec.star) {
    const st = spec.star, m = st.mod;
    hpM *= R.starHp * (1 + m.hp); dmM *= R.starDmg * (1 + m.dmg);
    u.speed *= R.starSpeed * (1 + m.speed); u.range *= 1 + m.range; u.armor += m.armor;
    u.mod = m; u.starId = st.id; u.sig = st.sig || ''; u.starName = st.name || '';
    T.car.starUnits.push(u.id);
  }
  u.hp *= hpM; u.maxHp = u.hp; u.dmg *= dmM;
}
function careerAfterSpawn(w) { for (const u of w.units) if (u.mod && u.mod.kbImmune) u.kbImmuneT = 1e9; }
function careerDrift(w, T, u, mx, my, dirF) {
  const c = T.car;
  if (!c.drift) { _dv[0] = mx; _dv[1] = my; return _dv; }
  let fwd = c.cFwd; if (c.cFwdAtk && (u.ri <= 2 || u.ri === 6)) fwd += c.cFwdAtk;
  if (fwd < 0 && (u.y - MIDY) * dirF < 0) fwd *= 0.3;   // already in own half: only a light hold
  if (u.ri === 3 && fwd > 0) fwd *= 0.55;               // defenders step up less
  _dv[0] = mx + (u.hx - u.x) * c.cHome; _dv[1] = my + (u.hy - u.y) * c.cHome + fwd * dirF;
  return _dv;
}
function chaseN(w, s, cfg) { const T = w.teams[s]; return T.car ? Math.max(1, cfg.chase + T.car.cChase) : cfg.chase; }
function supportN(w, s, cfg) { const T = w.teams[s]; return T.car ? Math.max(0, cfg.support + T.car.cSupport) : cfg.support; }
function careerBallGain(w, u, kind) {
  const T = w.teams[u.side], c = T.car; if (!c) return;
  const burstFwd = (mul, dur) => { let n = 0; for (const a of T.aliveList) { if (a.ri > 1) continue; a.hasteMul = Math.max(a.hasteT > 0 ? a.hasteMul : 1, mul); a.hasteT = Math.max(a.hasteT, dur); if (++n >= 10) break; } };
  if (c.cmd === 'fast') burstFwd(1.3, 1.6);
  else if (TACTICS[c.tactic].counter && (kind === 1 || kind === 3) && w.t >= c.counterReady) { c.counterReady = w.t + 3; burstFwd(1.22, 1.3); ev(w, EV.COUNTER, u.side, u.id, 0, u.x, u.y); }
}
function careerCan(w, side, kind, v) {
  const C = w.career; if (!C) return { ok: false, reason: 'not a career match' };
  if (w.phase !== 'battle') return { ok: false, reason: 'battle not running' };
  const c = w.teams[side].car, R = C.rules;
  if (C.pending.some(p => p.side === side && p.kind === kind)) return { ok: false, reason: 'pending' };
  if (kind === 'style') {
    if (!STYLES[v]) return { ok: false, reason: 'unknown style' };
    if (v === c.style) return { ok: false, reason: 'already active' };
    if (w.t + 1e-9 < c.styleReady) return { ok: false, reason: 'cooldown', wait: c.styleReady - w.t };
    return { ok: true };
  }
  if (kind === 'cmd') {
    if (!COMMANDS[v]) return { ok: false, reason: 'unknown command' };
    if (c.cmdUses >= R.cmdMax) return { ok: false, reason: 'no commands left' };
    if (w.t + 1e-9 < c.cmdReady) return { ok: false, reason: 'cooldown', wait: c.cmdReady - w.t };
    return { ok: true };
  }
  return { ok: false, reason: 'unknown kind' };
}
function careerIssue(w, side, kind, v, src) {
  const r = careerCan(w, side, kind, v); if (!r.ok) return r;
  w.career.pending.push({ tick: w.tick + 1, side, kind, v, src: src || 'user' });
  return { ok: true };
}
function careerApply(w, cmd) {
  const C = w.career, T = w.teams[cmd.side], c = T.car, R = C.rules;
  // validated against the state at the tick it is applied (identical live / replay)
  const save = C.pending; C.pending = []; const ok = careerCan(w, cmd.side, cmd.kind, cmd.v).ok; C.pending = save;
  if (!ok) return false;
  if (cmd.kind === 'style') { c.style = cmd.v; c.styleReady = w.t + R.styleCd; ev(w, EV.STYLE, cmd.side, STYLE_IDS.indexOf(cmd.v), 0); }
  else { c.cmd = cmd.v; c.cmdEnd = w.t + R.cmdDur; c.cmdUses++; c.cmdReady = w.t + R.cmdCd; ev(w, EV.CMD, cmd.side, CMD_IDS.indexOf(cmd.v), c.cmdUses); }
  careerRecalc(T);
  C.log.push({ tick: w.tick, t: +w.t.toFixed(3), side: cmd.side, kind: cmd.kind, v: cmd.v, src: cmd.src });
  return true;
}
function careerTick(w) {
  const C = w.career;
  for (let s = 0; s < 2; s++) { const T = w.teams[s], c = T.car; if (c.cmd && w.t + 1e-9 >= c.cmdEnd) { ev(w, EV.CMD_END, s, CMD_IDS.indexOf(c.cmd), 0); c.cmd = null; careerRecalc(T); } }
  while (C.qi < C.replayQ.length && C.replayQ[C.qi].tick <= w.tick) { const q = C.replayQ[C.qi++]; if (q.tick === w.tick) careerApply(w, q); }
  if (C.pending.length) { const due = C.pending.filter(p => p.tick <= w.tick); C.pending = C.pending.filter(p => p.tick > w.tick); for (const p of due) careerApply(w, p); }
  for (let s = 0; s < 2; s++) { const pol = C.coach[s]; if (pol && (w.tick + s * 11) % pol.every === 0) coachDecide(w, s, pol); }
}

// ---- Live Tactical AI: deterministic utility scoring on VISIBLE match state only ----
// (alive counts, recent eliminations, ball position/possession, the opponent's visible style/command, clock,
//  own remaining commands). Same limits as the human coach: same cooldowns, same 3 commands.
const COACH_BIAS = {
  aggressive: { attack: 0.08, defend: -0.04, balanced: 0, press: 0.15, hold: -0.05, fast: 0.05, fav: 'press' },
  defensive: { attack: -0.05, defend: 0.08, balanced: 0.02, press: -0.05, hold: 0.15, fast: 0.03, fav: 'hold' },
  counter: { attack: 0, defend: 0.03, balanced: 0.02, press: 0, hold: 0.03, fast: 0.18, fav: 'fast' },
  technical: { attack: 0.03, defend: 0, balanced: 0.06, press: 0.05, hold: 0, fast: 0.08, fav: 'fast' },
  balanced: { attack: 0, defend: 0, balanced: 0.04, press: 0.05, hold: 0.05, fast: 0.05, fav: 'press' }
};
function coachFeatures(w, side) {
  const T = w.teams[side], O = w.teams[1 - side], c = T.car, oc = O.car;
  const recent = (arr, s) => { let n = 0; for (let i = arr.length - 1; i >= 0 && arr[i] >= w.t - s; i--) n++; return n; };
  const b = w.fb.ball;
  let poss = 0; if (b.state === 'CONTROLLED' && b.owner >= 0) poss = w.units[b.owner].side === side ? 1 : -1;
  const ownGoalY = side === 0 ? ARENA.y1 : ARENA.y0;
  return { mine: T.alive, theirs: O.alive, diff: (T.alive - O.alive) / Math.max(1, T.alive + O.alive), myLoss: recent(c.koT, 3), oppLoss: recent(oc.koT, 3),
    poss, held: b.held, danger: 1 - Math.min(1, Math.abs(b.y - ownGoalY) / 250), oppStyle: oc.style, oppCmd: oc.cmd, bt: w.battleT,
    cmdLeft: w.career.rules.cmdMax - c.cmdUses, stars: c.starUnits.reduce((n, id) => n + (w.units[id].alive ? 1 : 0), 0) };
}
function coachDecide(w, side, pol) {
  if (w.phase !== 'battle') return null;
  const c = w.teams[side].car, f = coachFeatures(w, side), L = pol.level || 1, B = COACH_BIAS[pol.profile] || COACH_BIAS.balanced;
  let style = c.style, cmd = null;
  const lossGap = f.myLoss - f.oppLoss;
  // styles: protect the team when it bleeds players, push when clearly ahead. Better managers read it earlier
  // and keep the shape when the opponent is attacking their goal.
  const bleed = L >= 7 ? 2 : 3, lead = L >= 7 ? 0.08 : 0.12;
  if (lossGap >= bleed || (L >= 4 && f.diff < -0.1)) style = 'defend';
  else if (f.diff > lead) style = L >= 4 && f.poss < 0 && f.danger > 0.6 ? 'balanced' : 'attack';
  else if (f.diff > -0.05 && lossGap <= 0) style = 'balanced';
  if (f.cmdLeft > 0 && f.bt > (L >= 7 ? 3 : 6)) {
    if (L <= 3) { if (f.myLoss >= 2 || f.poss > 0) cmd = B.fav; }
    else {
      // situational choice; elite managers answer the opponent's visible command
      // spread the three commands over the battle instead of burning them early
      const spacing = f.bt >= (3 - f.cmdLeft) * 7 + 4;
      if (!spacing) cmd = null;
      else if (L >= 7 && f.oppCmd === 'press' && lossGap >= 1) cmd = 'hold';
      else if (lossGap >= 4) cmd = 'hold';
      else if (f.myLoss >= 2 || f.poss > 0) cmd = B.fav === 'fast' && L < 7 ? 'fast' : 'press';
    }
  }
  if (pol.noStyle) style = c.style; if (pol.noCmd) cmd = null; // ablation switches (testing only)
  if (style !== c.style) careerIssue(w, side, 'style', style, 'coach');
  if (cmd) careerIssue(w, side, 'cmd', cmd, 'coach');
  return { style, cmd };
}
function careerState(w, side) {
  const c = w.teams[side].car, R = w.career.rules;
  return { tactic: c.tactic, style: c.style, cmd: c.cmd, cmdLeft: R.cmdMax - c.cmdUses, cmdCd: Math.max(0, c.cmdReady - w.t), styleCd: Math.max(0, c.styleReady - w.t), cmdRemain: c.cmd ? Math.max(0, c.cmdEnd - w.t) : 0 };
}
function careerSummary(w) {
  const fb = w.fb ? fbSummary(w) : null;
  const stars = [];
  for (const u of w.units) if (u.starId != null) stars.push({ id: u.starId, side: u.side, goals: u.goals || 0, kos: u.kills, assists: u.assists, saves: u.saves || 0, survived: u.alive });
  return { v: w.career ? w.career.rules.version : 'legacy', seed: w.seed, winner: w.winner, endTick: w.endTick, battleT: +(w.endT - TL.battleStart).toFixed(2),
    alive: [w.teams[0].alive, w.teams[1].alive], kills: [w.teams[0].kills, w.teams[1].kills], tiebreak: w.tiebreak, rules: w.rules.slice(), hash: (w.hash >>> 0).toString(16),
    football: fb, stars, cmds: w.career ? w.career.log.slice() : [], power: [w.teams[0].power, w.teams[1].power] };
}
