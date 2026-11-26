// ======================= ROGUELITE REBORN — Campaign battle layer (w.rg) =======================
// Installed by tools/patch_rogue.py. Active only when createWorld got opts.rogue. One world = one WAVE.
// Side 0 = the player's Survivor Army (persistent identities), side 1 = the authored enemy wave.
Object.assign(EV, { FOCUS: 95, CARD: 96, WAVE_END: 97, EMERGENCY_GK: 98, OVERTIME: 99 });
const RG = {
  FOCUS: ['goal', 'ko', 'survive'], FOCUS_MAX: 2, FOCUS_DUR: 8, FOCUS_CD: 5,
  CAP: { dr: 0.35, spd: 0.35, atk: 0.40, rate: 0.30, save: 0.90 },
  FOCUS_N: { goal: 14, ko: 40, survive: 30 },
  CARD_IDX: {}
};
const RG_AI0 = { press: 1, pass: 1, shoot: 1, tackle: 1, compact: 1, intercept: 1, trans: 0, risk: 1 };
// pure, deterministic wave/level resolver (same priorities every tick; see FWObjectiveResolver in the core)
const ObjectiveResolver = {
  resolve(s) {
    if (s.playerAlive <= 0) return { state: 'lose', reason: 'army_ko' };          // also wins over a same-tick enemy wipe-out
    const eps = 1e-9, timeUp = s.battleT >= s.waveSec - eps, otUp = s.battleT >= s.waveSec + s.otSec - eps;
    const done = s.final ? 'win' : 'clear';
    if (s.type === 'ko') {
      if (s.enemyAlive === 0) return { state: done, reason: 'all_ko' };
      if (otUp) return { state: 'lose', reason: 'rivals_left' };
      return { state: 'continue', overtime: timeUp };
    }
    if (s.type === 'goal' && s.final) {
      const met = s.goals >= s.target;
      if (s.enemyAlive === 0) return met ? { state: 'win', reason: 'all_ko' } : { state: 'lose', reason: 'goals_missing' };
      if (!timeUp) return { state: 'continue', overtime: false };
      if (met) return { state: 'win', reason: s.battleT > s.waveSec + DT / 2 ? 'goal_overtime' : 'time' };
      if (otUp) return { state: 'lose', reason: 'goals_missing' };
      return { state: 'continue', overtime: true };
    }
    // Survival (and the non-final waves of a Goal Challenge): survive the 45 s or K.O. every rival
    if (s.enemyAlive === 0) return { state: done, reason: 'all_ko' };
    if (timeUp) return { state: done, reason: 'time' };
    return { state: 'continue', overtime: false };
  }
};
// persistent unit HP (computed once per run by the core with this same function)
RG.unitMaxHp = function (role, skill, mods, leader) {
  const b = ROLE_BASE[role];
  return b.hp * mods.hp * (0.85 + 0.15 * skill) * (role === 'goalkeeper' ? eff(mods.gk, 0.08) : 1) * (leader ? 1.25 : 1);
};
RG.OBJ = ObjectiveResolver;
// read-only access to the capped modifier functions (used by tools/test_rogue.js)
RG.probe = { dr: (w, u) => rgDR(w, u), speed: (w, u) => rgSpeed(w, u), rate: (w, u) => rgRate(w, u), atk: (w, a, t, o) => rgAtkBonus(w, a, t, o || {}, 0), save: (w, g, sh, p) => rgSaveP(w, g, sh, p), leader: (w, id) => rgLeader(w, id) };

function rgPre(w, R) {
  w.headless = !!w.opts.headless;
  const byRole = {}; for (const r of ROLES) byRole[r] = [];
  for (const e of (R.roster || [])) if (e.alive !== false && e.hp > 0) byRole[e.role].push(e);
  // the army spawns exactly its living roster (role counts come from the persistent identities, never from a template)
  const counts = {}; for (const r of ROLES) counts[r] = byRole[r].length;
  const A = w.opts.teamA; w.opts.teamA = Object.assign({}, A, { battle_profile: Object.assign({}, A.battle_profile, { roles_per_100: counts }) });
  const c = R.cards || {};
  const ai = [Object.assign({}, RG_AI0, R.ai && R.ai[0]), Object.assign({}, RG_AI0, R.ai && R.ai[1])];
  const fdur = RG.FOCUS_DUR + (c.L07 ? c.L07.dur : 0);
  w.rg = {
    cfg: R, obj: Object.assign({ type: 'survival', final: false, waveSec: 45, otSec: 10, target: 0, goalsBefore: 0 }, R.obj || {}),
    byRole, c, ai, rng: new Rng(((w.seed ^ 0x5A17C0DE) >>> 0) ^ hashStr('RRB_CARDS')), leaders: {}, capU: null,
    focus: { kind: '', until: 0, uses: 0, max: RG.FOCUS_MAX, dur: fdur, nextOk: 0, log: [] },
    inputs: (R.inputs || []).slice().sort((a, b) => a.k - b.k), inI: 0,
    q: [], later: [], proc: false, ot: false, result: null, startAlive: 0,
    st: { procs: {}, kos: 0, lost: 0, cardKos: 0, emergency: 0 },
    t: { f04: -9, s05: -9, od: -9, odNext: 12, l06: 6, kos: 0, symph: -9, echo: -9, rally: false, cs: -9, s07: -9, m05: -9, c03: -9, c05: -9, c02: -9 }
  };
}
function rgTeams(w) {
  const R = w.rg.cfg;
  for (let s = 0; s < 2; s++) {
    const T = w.teams[s], M = R.mods[s];
    T.adv = 0; T.powMul = 1;
    T.dmgMul = M.dmg * T.form; T.shotMul = M.shot; T.hpMul = M.hp; T.armorAdd = M.armor;
    T.speedMul = M.speed * (0.94 + 0.06 * T.form); T.atkRate = M.rate * (0.96 + 0.04 * T.form); T.drain = M.drain;
    T.tech = M.tech; T.gk = M.gk; T.critChance = M.crit; T.knock = M.knock; T.teamwork = M.teamwork;
    T.at.finishing = M.fin; T.at.technique = M.techAt; T.at.pressing = M.press; T.at.goalkeeping = M.gk;
  }
}
function rgBind(w, u, T) {
  // uniform per-unit fields (one hidden class for every unit)
  u.pid = -1; u.leader = ''; u.rgF = 0; u.rgAtkT = -9; u.rgAtkV = 0; u.rgSpdT = -9; u.rgSpdV = 0; u.rgDrT = -9; u.rgDrV = 0; u.rgRateT = -9; u.rgRateV = 0;
  u.rgCE = 0; u.rgCA = 0; u.rgSW = 0; u.rgDef = -9; u.rgCs = -9; u.rgGain = -9; u.rgPerf = -9; u.emergencyGK = false; u.star = null;
  if (T.side !== 0) return;
  const e = w.rg.byRole[u.role].shift(); if (!e) return;
  const b = ROLE_BASE[u.role];
  u.pid = e.pid; u.skill = e.skill;
  u.dmg = b.dmg * e.skill * (e.leader ? 1.06 : 1); u.interval = b.interval / (0.9 + 0.1 * e.skill); u.speed = b.speed * (0.92 + 0.08 * e.skill);
  u.maxHp = e.maxHp; u.hp = Math.min(e.hp, e.maxHp);
  if (e.leader) { u.leader = e.leader; u.star = { rarity: 'legendary', name: e.name || e.leader, id: e.leader }; w.rg.leaders[e.leader] = u; }
}
function rgInit(w) {
  const R = w.rg; R.startAlive = w.teams[0].alive; R.enemyStart = w.teams[1].alive;
  rgEmergencyGK(w, false);
  for (const u of w.units) if (u.side === 1 && u.role === 'captain') R.capU = u;
}
function rgLeader(w, id) { const u = w.rg.leaders[id]; return !!(u && u.alive); }
function rgEmergencyGK(w, announce) {
  for (const u of w.teams[0].aliveList) if (u.role === 'goalkeeper') return;
  let best = null;
  for (const u of w.teams[0].aliveList) if (u.role === 'defender' && (!best || u.y > best.y || (u.y === best.y && u.pid < best.pid))) best = u;
  if (!best) return; // no eligible defender: the army plays on without a keeper
  best.role = 'goalkeeper'; best.ri = ROLES.indexOf('goalkeeper'); best.guard = true; best.emergencyGK = true;
  best.range = DEFAULT_RANGE.goalkeeper * RANGE_SCALE; best.hx = 180; best.hy = ARENA.y1 - 12; best.tgt = -1;
  w.rg.st.emergency++;
  if (announce !== false) { ev(w, EV.EMERGENCY_GK, best.id, -1, 0, best.x, best.y); banner(w, 'rg:egk', 1.6, '#7df9ff'); }
}
function rgOnEvent(w, type, a, b, c, x, y) {
  if (type === EV.KO || type === EV.CRIT || type === EV.PASS_COMPLETE || type === EV.PASS_INTERCEPT || type === EV.BALL_GAIN || type === EV.GOAL ||
    type === EV.SAVE_GOAL || type === EV.POST || type === EV.BALL_LOOSE) w.rg.q.push({ type, a, b, c, x, y, card: w.rg.proc });
}
function rgProc(w, id) { const p = w.rg.st.procs; p[id] = (p[id] || 0) + 1; ev(w, EV.CARD, 0, RG.CARD_IDX[id] != null ? RG.CARD_IDX[id] : -1, 0); }
function rgCapped(w, id) { const c = w.rg.c[id]; return !c || (c.cap && (w.rg.st.procs[id] || 0) >= c.cap); }
// ---------- stat modifiers (all capped) ----------
function rgNearOwnGoal(u, px) { return u.side === 0 ? u.y > ARENA.y1 - px : u.y < ARENA.y0 + px; }
function rgDR(w, u) {
  const c = w.rg.c, bt = w.battleT; let d = 0;
  if (c.S01) { d += c.S01.dr; if (u.role === 'defender' && u.y > MIDY && rgLeader(w, 'pao')) d += c.S01.syn; }
  if (c.S04 && u.y > ARENA.y1 - (ARENA.y1 - ARENA.y0) / 3) d += c.S04.dr;
  if (c.S06 && w.teams[0].alive <= c.S06.n) d += c.S06.dr;
  if (c.S08 && bt >= 30) d += c.S08.dr;
  if (c.K07 && u.rgCE >= 3) d += c.K07.dr;
  if (c.L01 && u.aura) { d += c.L01.dr; if (rgLeader(w, 'stev')) d += c.L01.syn; }
  if (c.L02) { d += c.L02.dr; if (w.teams[0].alive >= 50) d += c.L02.dr2; }
  if (c.L04 && (u.role === 'defender' || u.role === 'goalkeeper') && rgNearOwnGoal(u, 95)) d += c.L04.dr;
  if (c.C07 && u.rgCA >= 4) d += c.C07.dr;
  if (u.rgDrT > bt) d += u.rgDrV;
  return Math.min(RG.CAP.dr, d);
}
function rgAtkBonus(w, att, tgt, opts, dd) {
  const c = w.rg.c; let a = 0;
  if (c.K01 && opts.tackle) a += c.K01.atk;
  if (c.K02 && tgt.hp < tgt.maxHp * 0.35) a += c.K02.atk;
  if (c.K04 && (opts.tackle || dd < 18 * 18)) a += c.K04.atk;
  if (c.K07 && att.rgCE >= 3) a += c.K07.atk;
  if (c.M04 && att.role === 'winger') a += c.M04.atk;
  if (c.L04 && (att.role === 'defender' || att.role === 'goalkeeper') && rgNearOwnGoal(att, 95)) a += c.L04.atk;
  if (c.L03 && opts.assisted != null && opts.assisted >= 0) a += c.L03.atk;
  if (att.rgAtkT > w.battleT) a += att.rgAtkV;
  return Math.min(RG.CAP.atk, a);
}
function rgDamage(w, att, tgt, dmg, opts) {
  const R = w.rg, c = R.c, bt = w.battleT;
  const dd = att ? (att.x - tgt.x) * (att.x - tgt.x) + (att.y - tgt.y) * (att.y - tgt.y) : 1e9;
  if (att && att.side === 0 && !opts.card) dmg *= 1 + rgAtkBonus(w, att, tgt, opts, dd);
  if (att && att.side === 1 && R.cfg.bossCap && R.capU && R.capU.alive && att !== R.capU && dist2(att, R.capU) < 3600) dmg *= 1.05; // Boss captain coordination
  if (tgt.side === 0) {
    if (c.C01 && att && !opts.tackle && !opts.card && dd > 24 * 24 && tgt.rgDef <= bt && !rgCapped(w, 'C01') && R.rng.next() < c.C01.ch) {
      tgt.rgDef = bt + c.C01.icd; rgProc(w, 'C01'); ftext(w, 'DEFLECT', tgt.x, tgt.y - 14, '#9ff6ff', 0.5); return 0;
    }
    dmg *= 1 - rgDR(w, tgt);
    if (c.K05 && att && att.alive && !opts.card && dd < 22 * 22 && tgt.rgCs <= bt && R.rng.next() < c.K05.ch) { tgt.rgCs = bt + c.K05.icd; R.later.push({ at: bt, k: 'cs', a: tgt.id, b: att.id, v: tgt.dmg * c.K05.mul }); }
  }
  return dmg;
}
function rgKbMul(w, u) { const c = w.rg.c; return u.side === 0 && c.M06 ? c.M06.kb : 1; }
function rgStunMul(w, tgt, att, opts) {
  const c = w.rg.c; let m = 1;
  if (tgt.side === 0 && c.M03) m *= c.M03.stun;
  if (att && att.side === 0 && c.K04 && opts.tackle) m *= 1 + c.K04.stun / Math.max(0.1, opts.stun);
  return m;
}
function rgRecoverMul(w, u) { const c = w.rg.c; return u.side === 0 && c.M03 ? c.M03.rec : 1; }
function rgSpeed(w, u) {
  const bt = w.battleT, R = w.rg;
  if (u.side === 1) return u.rgSpdT > bt ? 1 + u.rgSpdV : 1;
  const c = R.c; let s = 0;
  if (c.M01) s += c.M01.spd;
  const fb = w.fb, b = fb && fb.ball;
  if (c.M02 && b && b.state === 'CONTROLLED' && b.owner === u.id && u.rgCE > 0) s += c.M02.spd;
  if (c.M04 && u.role === 'winger') s += c.M04.spd;
  if (c.M06 && u.hp < u.maxHp * 0.4) s += c.M06.spd;
  if (c.M07 && b && b.state === 'CONTROLLED' && b.side === 0 && b.owner !== u.id && (u.role === 'striker' || u.role === 'winger' || u.role === 'captain' || u.role === 'playmaker')) { const o = w.units[b.owner]; if (o && u.y < o.y) s += c.M07.spd; }
  if (c.L07 && u.rgF > 0) s += c.L07.spd;
  if (c.M08 && R.t.od > bt) s += c.M08.spd;
  if (c.F04 && R.t.f04 > bt) s += c.F04.spd;
  if (u.rgSpdT > bt) s += u.rgSpdV;
  return 1 + Math.min(RG.CAP.spd, s);
}
function rgRate(w, u) {
  if (u.side === 1) return 1;
  const c = w.rg.c, bt = w.battleT, R = w.rg; let r = 0;
  if (c.S08 && bt >= 30) r += c.S08.rate;
  if (c.M08 && R.t.od > bt) r += c.M08.rate;
  if (c.F04 && R.t.f04 > bt) r += c.F04.rate;
  if (u.rgRateT > bt) r += u.rgRateV;
  return 1 + Math.min(RG.CAP.rate, r);
}
// ---------- AI: Tactical Focus (player) and authored tactics (both sides) ----------
function rgTgtW(w, u) { return u.side === 0 && u.rgF === 2 ? 3 : 7; }
function rgAcq(w, u, e) {
  let s = 0; const A = w.rg.ai[u.side];
  if (u.side === 0) {
    if (u.rgF === 2) s -= 35 * (1 - e.hp / e.maxHp);
    else if (u.rgF === 3) s += 0.3 * Math.abs(e.y - ARENA.y1);
  }
  if (A.press > 1 && w.fb && w.fb.ball.owner === e.id && w.fb.ball.state === 'CONTROLLED') s -= 22 * (A.press - 1);
  if (A.risk > 1) s -= 18 * (A.risk - 1) * (1 - e.hp / e.maxHp);
  return s;
}
function rgSteer(w, u, tgt, d, mx, my) {
  const A = w.rg.ai[u.side], own = u.side === 0 ? 1 : -1;
  const md = w.fb ? w.fb.mode[u.id] : 0;
  const retreat = (u.side === 0 && u.rgF === 3) || (A.risk < 1 && u.hp < u.maxHp * 0.35);
  if (retreat && tgt && d < u.range * 1.05 + 12 && md !== 2 && md !== 5) {
    const k = u.side === 0 ? 1 : (1 - A.risk) * 2;
    return [mx * (1 - k) - (tgt.x - u.x) / d * k, my * (1 - k) + (own * 0.7 - (tgt.y - u.y) / d * 0.3) * k];
  }
  if (A.compact > 1 && !md && (u.role === 'defender' || u.role === 'support' || u.role === 'playmaker')) {
    const k = 0.012 * (A.compact - 1) * 4;
    return [mx + (u.hx - u.x) * k * 0.25, my + (u.hy - u.y) * k * 0.25];
  }
  return null;
}
function rgNoDash(w, u, d, reach) {
  if (u.side === 0 && u.rgF === 3 && d > reach * 0.6) return true;
  const A = w.rg.ai[u.side]; return A.risk < 0.85 && u.hp < u.maxHp * 0.3 && d > reach * 0.6;
}
function rgNoKite(w, u) { return (u.side === 0 && u.rgF === 2) || w.rg.ai[u.side].risk > 1.15; }
function rgFocusOn(w, k) { return w.rg.focus.kind === k; }
function rgShootPref(w, u) { let m = w.rg.ai[u.side].shoot; if (u.side === 0 && rgFocusOn(w, 'goal')) m *= 1.35; return m; }
function rgHoldMul(w, u) { let m = 1 / w.rg.ai[u.side].pass; if (u.side === 0 && rgFocusOn(w, 'goal')) m *= 0.85; return m; }
function rgShotErr(w, u) {
  if (u.side !== 0) return 1;
  const c = w.rg.c; let m = 1;
  if (c.F01) { m *= c.F01.err; if (rgLeader(w, 'nazar')) m *= u.leader === 'nazar' ? 0.85 : c.F01.syn; }
  if (c.C06 && w.battleT - u.rgPerf < 3) m *= 0.6;
  return m;
}
function rgShotSp(w, u) { const c = w.rg.c; return u.side === 0 && c.F08 ? 1 + c.F08.sp : 1; }
function rgPassSp(w, u) { const c = w.rg.c; if (u.side !== 0 || !c.F02) return 1; return 1 + c.F02.sp + (rgLeader(w, 'xav') ? c.F02.synSp : 0); }
function rgPassRange(w, u) { const c = w.rg.c; return u.side === 0 && c.F07 && (u.role === 'playmaker' || u.role === 'captain') ? c.F07.range : 0; }
function rgMateBonus(w, u, m, d) {
  let s = 0; const dir = u.side === 0 ? -1 : 1;
  if (u.side === 0 && w.rg.c.F07 && (m.y - u.y) * dir > 0) s += (m.y - u.y) * dir * 0.25;
  if (u.side === 0 && rgFocusOn(w, 'goal') && (m.role === 'striker' || m.role === 'winger')) s += 6;
  return s;
}
function rgTackleCh(w, e, o, ch) {
  const c = w.rg.c;
  if (o.side === 0 && c.F03 && w.battleT - o.rgGain < 1.5) ch *= c.F03.mul;
  ch += 0.04 * (w.rg.ai[e.side].tackle - 1);
  return Math.max(0, ch);
}
function rgInterceptCh(w, e, from, ch) {
  const c = w.rg.c;
  if (from.side === 0 && c.F02) { ch *= c.F02.int; if (rgLeader(w, 'xav')) ch *= c.F02.syn; }
  return Math.max(0, ch * w.rg.ai[e.side].intercept);
}
function rgSaveP(w, g, sh, p) {
  const c = w.rg.c;
  if (g.side === 0 && c.L05) { p += c.L05.add; if (rgLeader(w, 'buffo')) p += c.L05.syn; }
  if (sh.side === 0) { if (c.F06) p *= c.F06.mul; if (c.F08) p *= c.F08.save; }
  return clamp(p, 0, RG.CAP.save);
}
function rgPickup(w, b) {
  const c = w.rg.c; if (!c.C04) return null;
  let best = null, bd = 1e9;
  for (const u of query(w, b.x, b.y + 1, 6 + c.C04.r, 0)) { if (u.stun > 0 || u.dashT > 0) continue; const d = (u.x - b.x) * (u.x - b.x) + (u.y - b.y) * (u.y - b.y); if (d < bd || (d === bd && u.id < best.id)) { bd = d; best = u; } }
  if (best) rgProc(w, 'C04');
  return best;
}
function rgNearest(list, x, y, k, filt) {
  const out = [];
  for (const u of list) { if (filt && !filt(u)) continue; out.push([(u.x - x) * (u.x - x) + (u.y - y) * (u.y - y), u]); }
  out.sort((p, q) => p[0] - q[0] || p[1].id - q[1].id); return out.slice(0, k).map(p => p[1]);
}
function rgAssign(w) {
  const fb = w.fb, b = fb.ball, M = fb.mode, R = w.rg;
  const notGK = u => u.role !== 'goalkeeper';
  for (let s = 0; s < 2; s++) {
    const A = R.ai[s], L = w.teams[s].aliveList, gf = s === 0 && R.focus.kind === 'goal';
    if (b.state === 'CONTROLLED') {
      const o = w.units[b.owner]; if (!o) continue;
      if (o.side === s) {
        if (gf) { const dir = s === 0 ? -1 : 1; for (const u of rgNearest(L, o.x, o.y, 3, m => m !== o && notGK(m) && !M[m.id] && (m.y - o.y) * dir > -10)) M[u.id] = 4; }
      } else {
        const extra = (gf ? 1 : 0) + Math.max(0, Math.round((A.press - 1) * 3));
        if (extra > 0) for (const u of rgNearest(L, o.x, o.y, extra, m => notGK(m) && !M[m.id])) M[u.id] = 2;
      }
    } else if ((b.state === 'LOOSE' || b.state === 'RESET') && gf) {
      for (const u of rgNearest(L, b.x, b.y, 2, m => notGK(m) && !M[m.id])) M[u.id] = 1;
    }
  }
}
// ---------- Tactical Focus ----------
function rgCanFocus(w) {
  const R = w.rg; if (!R || w.phase !== 'battle' || R.result) return false;
  const F = R.focus; return F.uses < F.max && !F.kind && w.battleT >= F.nextOk;
}
function rgApplyFocus(w, f) {
  const R = w.rg, F = R.focus;
  if (RG.FOCUS.indexOf(f) < 0 || !rgCanFocus(w)) return false;
  F.kind = f; F.uses++; F.until = w.battleT + F.dur; F.log.push({ k: w.tick, f });
  ev(w, EV.FOCUS, 0, RG.FOCUS.indexOf(f), F.dur); banner(w, 'rg:focus:' + f, 1.2, '#ffe14d');
  rgFocusFlags(w);
  return true;
}
function rgFocusFlags(w) {
  const R = w.rg, F = R.focus, L = w.teams[0].aliveList;
  for (const u of w.teams[0].aliveList) u.rgF = 0;
  if (!F.kind) return;
  const fld = u => u.role !== 'goalkeeper';
  if (F.kind === 'goal') {
    const b = w.fb ? w.fb.ball : { x: 180, y: MIDY };
    for (const u of rgNearest(L, b.x, b.y, RG.FOCUS_N.goal, u => fld(u) && u.role !== 'defender')) u.rgF = 1;
  } else if (F.kind === 'ko') {
    const E = w.teams[1].aliveList; if (!E.length) return;
    let cx = 0, cy = 0; for (const e of E) { cx += e.x; cy += e.y; } cx /= E.length; cy /= E.length;
    for (const u of rgNearest(L, cx, cy, RG.FOCUS_N.ko, fld)) u.rgF = 2;
  } else {
    const hurt = L.filter(u => fld(u) && u.hp < u.maxHp * 0.55).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id);
    for (const u of hurt.slice(0, RG.FOCUS_N.survive)) u.rgF = 3;
  }
}
function rgPreTick(w) {
  const R = w.rg, F = R.focus, bt = w.battleT;
  while (R.inI < R.inputs.length && R.inputs[R.inI].k <= w.tick) { const inp = R.inputs[R.inI++]; if (inp.k === w.tick) rgApplyFocus(w, inp.f); }
  if (F.kind && bt >= F.until) { F.kind = ''; F.nextOk = F.until + RG.FOCUS_CD; rgFocusFlags(w); }
  else if (F.kind && (w.tick % 30) === 0) rgFocusFlags(w);
  if ((w.tick % 15) === 0) {
    for (const u of w.teams[0].aliveList) { u.rgCE = query(w, u.x, u.y, 20, 1).length; u.rgCA = query(w, u.x, u.y, 16, -1).length - 1; }
  }
}
function rgCardDamage(w, att, tgt, amt, stun) {
  if (!tgt.alive || amt <= 0) return;
  tgt.hp -= amt; tgt.flash = 0.09; tgt.hitT = w.t;
  if (stun) tgt.stun = Math.max(tgt.stun, stun);
  ev(w, EV.HIT, att ? att.id : -1, tgt.id, amt, tgt.x, tgt.y);
  burst(w, tgt.x, tgt.y - 5, 4, ['#fff', '#ffe066'], 40, 0.3);
  if (tgt.hp <= 0) { ko(w, tgt, att && att.alive ? att : null, null); w.rg.st.cardKos++; }
}
function rgBuff(u, kind, v, until) {
  if (kind === 'atk') { u.rgAtkV = u.rgAtkT > until - 1e-9 ? Math.max(u.rgAtkV, v) : v; u.rgAtkT = Math.max(u.rgAtkT, until); }
  else if (kind === 'spd') { u.rgSpdV = u.rgSpdT > until - 1e-9 ? Math.max(u.rgSpdV, v) : v; u.rgSpdT = Math.max(u.rgSpdT, until); }
  else if (kind === 'dr') { u.rgDrV = u.rgDrT > until - 1e-9 ? Math.max(u.rgDrV, v) : v; u.rgDrT = Math.max(u.rgDrT, until); }
  else if (kind === 'rate') { u.rgRateV = u.rgRateT > until - 1e-9 ? Math.max(u.rgRateV, v) : v; u.rgRateT = Math.max(u.rgRateT, until); }
}
function rgHeal(u, f) { if (u.alive) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * f); }
function rgTick(w) {
  const R = w.rg, c = R.c, bt = w.battleT, U = w.units;
  R.proc = true;
  // deferred card actions (counterstrikes, echoes)
  if (R.later.length) {
    const keep = [];
    for (const a of R.later) {
      if (a.at > bt) { keep.push(a); continue; }
      const s = U[a.a], t = U[a.b];
      if (a.k === 'cs' && s.alive && t.alive) { rgProc(w, 'K05'); s.act = 'kick'; s.actT = 0.2; rgCardDamage(w, s, t, a.v, 0); }
      else if (a.k === 'echo' && t.alive) { rgProc(w, 'C08'); part(w, 'ring', t.x, t.y - 4, 60, 0, 0.3, '#ffe14d', 2); rgCardDamage(w, s, t, a.v, 0); }
    }
    R.later = keep;
  }
  const q = R.q; R.q = [];
  for (const e of q) {
    if (e.card) continue; // effects created by cards never trigger cards (no loops)
    const A = e.a >= 0 ? U[e.a] : null;
    switch (e.type) {
      case EV.KO: {
        const v = U[e.b];
        if (v.side === 1) {
          R.st.kos++;
          if (A && A.side === 0) {
            if (c.K03 && A.alive) { rgBuff(A, 'atk', c.K03.atk, bt + 2.5); rgBuff(A, 'spd', 0.10, bt + 2.5); rgProc(w, 'K03'); }
            if (c.K06 && A.alive && !rgCapped(w, 'K06')) {
              const hit = query(w, v.x, v.y, 24, 1).slice(0, c.K06.n); if (hit.length) rgProc(w, 'K06');
              for (const h of hit) rgCardDamage(w, A, h, A.dmg * c.K06.mul * w.teams[0].dmgMul, 0);
            }
            if (c.C03 && bt >= R.t.c03) {
              const hit = query(w, v.x, v.y, 20, 1).slice(0, c.C03.n); R.t.c03 = bt + 0.5;
              if (hit.length) { rgProc(w, 'C03'); part(w, 'ring', v.x, v.y - 3, 70, 0, 0.3, '#ffb14d', 2); }
              for (const h of hit) { if (h.kbImmuneT > 0) continue; h.stun = Math.max(h.stun, c.C03.stun); const dx = h.x - v.x, dy = h.y - v.y, dd = Math.sqrt(dx * dx + dy * dy) || 1; h.kbx += dx / dd * 30; h.kby += dy / dd * 30; }
            }
            if (c.K08) {
              R.t.kos++;
              if (R.t.kos >= c.K08.every && bt >= R.t.symph) {
                R.t.kos = 0; R.t.symph = bt + c.K08.icd; rgProc(w, 'K08');
                const hit = rgNearest(w.teams[1].aliveList, v.x, v.y, c.K08.n, h => dist2(h, v) < 42 * 42);
                part(w, 'ring', v.x, v.y - 3, 140, 0, 0.5, '#ffd23f', 3); w.shake = Math.max(w.shake, 1.4);
                for (const h of hit) rgCardDamage(w, A, h, h.maxHp * c.K08.hp, 0.4);
              }
            }
          }
        } else {
          R.st.lost++;
          if (v.role === 'goalkeeper') rgEmergencyGK(w, true);
          if (c.L08 && !R.t.rally && w.teams[0].alive > 0 && w.teams[0].alive <= Math.floor(R.startAlive * 0.3)) {
            R.t.rally = true; rgProc(w, 'L08'); banner(w, 'rg:card:L08', 1.4, '#ffd23f');
            for (const u of w.teams[0].aliveList) { rgHeal(u, c.L08.heal); rgBuff(u, 'atk', 0.15, bt + 5); }
          }
        }
        break;
      }
      case EV.CRIT:
        if (A && A.side === 0 && c.C08 && bt >= R.t.echo && R.rng.next() < c.C08.ch) { R.t.echo = bt + c.C08.icd; R.later.push({ at: bt + 0.3, k: 'echo', a: A.id, b: e.b, v: e.c * c.C08.mul }); }
        break;
      case EV.PASS_COMPLETE: {
        const rc = A, from = U[e.b]; if (!rc || rc.side !== 0) break;
        if (c.S05 && bt >= R.t.s05) {
          R.t.s05 = bt + c.S05.icd; rgProc(w, 'S05'); rgHeal(rc, c.S05.heal); rgHeal(from, c.S05.heal);
          for (const m of rgNearest(w.teams[0].aliveList, rc.x, rc.y, 3, m => m !== rc && m !== from && dist2(m, rc) < 900)) rgHeal(m, c.S05.heal / 2);
        }
        if (c.L03) { rgBuff(rc, 'atk', c.L03.atk * 0.5, bt + 2); rgProc(w, 'L03'); }
        if (c.F07) { rgBuff(rc, 'spd', 0.15, bt + 1.5); }
        if (c.C05 && e.c >= 2 && bt >= R.t.c05) {
          R.t.c05 = bt + 3; rgProc(w, 'C05'); part(w, 'ring', rc.x, rc.y - 3, 100, 0, 0.4, '#7df9ff', 2);
          for (const m of query(w, rc.x, rc.y, 50, 0)) { rgBuff(m, 'rate', c.C05.rate, bt + 3); rgBuff(m, 'atk', c.C05.atk, bt + 3); }
        }
        break;
      }
      case EV.PASS_INTERCEPT:
        if (A && A.side === 0) rgGuard(w, A);
        break;
      case EV.BALL_GAIN: {
        if (!A) break;
        if (A.side === 0) {
          A.rgGain = bt;
          if (e.b === 1 || e.b === 3) {
            if (e.b === 1) rgGuard(w, A);
            if (c.M05 && bt >= R.t.m05) {
              R.t.m05 = bt + 3; rgProc(w, 'M05');
              for (const m of rgNearest(w.teams[0].aliveList, A.x, A.y, c.M05.n, m => m.role === 'striker' || m.role === 'winger')) rgBuff(m, 'spd', 0.20, bt + c.M05.dur);
            }
            if (c.C06) {
              const vic = rgNearest(w.teams[1].aliveList, A.x, A.y, 1, h => dist2(h, A) < 14 * 14)[0];
              A.rgPerf = bt; if (vic && vic.kbImmuneT <= 0) { vic.stun = Math.max(vic.stun, c.C06.stun); rgProc(w, 'C06'); }
            }
          }
        } else if ((e.b === 1 || e.b === 3) && R.ai[1].trans > 0) {
          for (const m of rgNearest(w.teams[1].aliveList, A.x, A.y, 6, m => m.role === 'striker' || m.role === 'winger' || m.role === 'playmaker')) rgBuff(m, 'spd', R.ai[1].trans, bt + 2);
        }
        break;
      }
      case EV.GOAL:
        if (e.b === 0 && c.F04) { R.t.f04 = bt + 5; rgProc(w, 'F04'); }
        break;
      case EV.SAVE_GOAL: case EV.POST: {
        const shooterSide = e.type === EV.POST ? (A ? A.side : -1) : (A ? 1 - A.side : -1);
        if (shooterSide === 0 && c.F05 && w.fb.ball.state === 'LOOSE' && R.rng.next() < c.F05.ch) {
          const b = w.fb.ball;
          const m = rgNearest(w.teams[0].aliveList, b.x, b.y, 1, u => u.role !== 'goalkeeper' && dist2(u, b) < 90 * 90)[0];
          if (m) { const dx = m.x - b.x, dy = m.y - b.y, dd = Math.sqrt(dx * dx + dy * dy) || 1, sp = Math.max(80, Math.hypot(b.vx, b.vy)); b.vx = dx / dd * sp; b.vy = dy / dd * sp; rgProc(w, 'F05'); }
        }
        break;
      }
      case EV.BALL_LOOSE:
        if (c.C02 && bt >= R.t.c02) {
          const b = w.fb.ball, m = rgNearest(w.teams[0].aliveList, b.x, b.y, 1, u => u.role !== 'goalkeeper' && dist2(u, b) < c.C02.r * c.C02.r)[0];
          if (m) { R.t.c02 = bt + 1; rgBuff(m, 'spd', 0.25, bt + 1.2); rgProc(w, 'C02'); }
        }
        break;
    }
  }
  // periodic cards
  if (c.S03 && (w.tick % 6) === 0) {
    for (const u of w.teams[0].aliveList) if (!u.rgSW && u.hp < u.maxHp * 0.3) {
      if (rgCapped(w, 'S03')) break;
      u.rgSW = 1; rgHeal(u, c.S03.heal); rgProc(w, 'S03'); part(w, 'ring', u.x, u.y - 4, 40, 0, 0.3, '#9dffb0', 1);
    }
  }
  if (c.M08 && bt >= R.t.odNext) { R.t.odNext += 15; R.t.od = bt + c.M08.dur; rgProc(w, 'M08'); banner(w, 'rg:card:M08', 1.0, '#c77dff'); }
  if (c.L06 && bt >= R.t.l06) {
    R.t.l06 = bt + 6;
    const cap = w.teams[0].aliveList.find(u => u.role === 'captain' && !u.emergencyGK);
    if (cap) { rgProc(w, 'L06'); part(w, 'ring', cap.x, cap.y - 4, 90, 0, 0.35, '#ffe14d', 2); for (const m of rgNearest(w.teams[0].aliveList, cap.x, cap.y, c.L06.n, m => m !== cap)) { rgBuff(m, 'atk', 0.12, bt + 2); rgBuff(m, 'spd', 0.06, bt + 2); } }
  }
  R.proc = false;
}
function rgGuard(w, A) {
  const R = w.rg, c = R.c, bt = w.battleT;
  if (!c.S07 || bt < R.t.s07) return;
  R.t.s07 = bt + c.S07.icd; rgProc(w, 'S07'); part(w, 'ring', A.x, A.y - 4, 80, 0, 0.3, '#7fb8ff', 2);
  for (const m of rgNearest(w.teams[0].aliveList, A.x, A.y, c.S07.n, m => dist2(m, A) < 45 * 45)) rgBuff(m, 'dr', c.S07.dr, bt + 3);
}
function rgCheckEnd(w) {
  const R = w.rg; if (R.result) return;
  const o = R.obj;
  const st = { type: o.type, final: o.final, battleT: w.battleT, waveSec: o.waveSec, otSec: o.otSec, playerAlive: w.teams[0].alive, enemyAlive: w.teams[1].alive,
    goals: o.goalsBefore + (w.fb ? w.fb.goals[0] : 0), target: o.target };
  const r = ObjectiveResolver.resolve(st);
  if (r.state === 'continue') {
    if (r.overtime && !R.ot) { R.ot = true; ev(w, EV.OVERTIME, -1, -1, o.otSec); banner(w, 'rg:ot', 1.6, '#ff8a3d'); }
    return;
  }
  R.result = { outcome: r.state, reason: r.reason, tick: w.tick, battleT: +w.battleT.toFixed(3), goals: st.goals };
  ev(w, EV.WAVE_END, r.state === 'lose' ? 1 : 0, ['clear', 'win', 'lose'].indexOf(r.state), 0);
  finish(w, r.state === 'lose' ? 1 : 0);
}
function rgSummary(w) {
  const R = w.rg; if (!R) return null;
  return { result: R.result, alive: [w.teams[0].alive, w.teams[1].alive], start: [R.startAlive, R.enemyStart],
    goals: w.fb ? w.fb.goals.slice() : [0, 0], football: w.fb ? fbSummary(w) : null, focus: R.focus.log.slice(), focusUses: R.focus.uses, procs: Object.assign({}, R.st.procs),
    kos: R.enemyStart - w.teams[1].alive, lost: R.startAlive - w.teams[0].alive, emergency: R.st.emergency, hash: (w.hash >>> 0).toString(16), endTick: w.endTick, ot: R.ot,
    units: w.units.filter(u => u.side === 0).map(u => ({ pid: u.pid, hp: u.alive ? +u.hp.toFixed(3) : 0, alive: u.alive, leader: u.leader })) };
}
