// ======================= ARCADE MAYHEM — WAR COMMANDS (only when opts.arcade.mech === 'mayhem') =======================
// Battle Energy · Power Kick (real match-ball SHOOTING) · Team Rush (real movement + collisions) · Iron Defense ·
// Goal Reinforcements (re-activated K.O. slots, never > 100 alive) · Final Frenzy (no zone / no storm) ·
// Chain Collision · KO Rampage · Counterattack Alert · AI commands. Every command is a tick-stamped input,
// validated here (energy, cooldown, possession, target) — a UI press alone never spends energy.
const MAY = {
  VERSION: 2,
  START: 25, RATE: 3.5, EV_CAP: 2.5, GOAL_E: 12,
  CMD: { kick: { cost: 55, cd: 8 }, rush: { cost: 45, cd: 9 }, iron: { cost: 35, cd: 8 } },
  RUSH_N: 10, RUSH_MIN: 1, RUSH_T: 1.2, RUSH_SPD: 1.5, RUSH_DMG: 7, RUSH_KB: 40, RUSH_HITS: 2, RUSH_VICTIM_CD: 0.6,
  IRON_N: 10, IRON_R: 150, IRON_T: 2.8, IRON_DR: 0.62, IRON_KB: 0.35, IRON_STAY: 22,
  PK_SPEED: 300, PK_HITS: 2, PK_DMG: 9, PK_KB: 30, PK_BLOCK: 0.25,
  REINF_PER_GOAL: 3, REINF_MAX: 9, REINF_DELAY: 0.8,
  FRENZY_T: 40, FRENZY_SPD: 1.12, FRENZY_ATK: 1.18,
  CHAIN_KB: 38, CHAIN_N: 2, CHAIN_MUL: 0.3, CHAIN_SEC: 6,
  RAMP_N: 3, RAMP_WIN: 4, RAMP_T: 2.5, RAMP_MUL: 1.15,
  ALERT_CD: 6
};
EV.CMD = 70; EV.CMD_REJECT = 71; EV.REINF_GAIN = 72; EV.REINF_ENTER = 73; EV.FRENZY = 74; EV.CHAIN = 75; EV.RAMPAGE = 76; EV.ALERT = 77; EV.PK_HIT = 78; EV.RUSH_HIT = 79; EV.IRON_STOP = 80;
const MAY_TYPES = ['kick', 'rush', 'iron'];
function mayInit(w, A) {
  const side = m => ({ energy: MAY.START, cd: { kick: 0, rush: 0, iron: 0 }, sec: -1, evE: 0, lastCmdT: -9, earned: 0, pending: 0, entered: 0, alertT: -99,
    st: { kick: 0, rush: 0, iron: 0, rejected: 0, rushHits: 0, rushKO: 0, rushUnits: 0, ironUnits: 0, ironStops: 0, ironReduced: 0, pkHits: 0, chains: 0, rampages: 0, energyGained: 0 }, mode: m });
  w.may = {
    rng: new Rng((w.seed ^ hashStr('ARCADE_MAYHEM|' + w.opts.teamA.id + '|' + w.opts.teamB.id)) >>> 0),
    s: [side((A.cmdModes && A.cmdModes[0]) || 'manual'), side((A.cmdModes && A.cmdModes[1]) || 'ai')],
    queue: (A.cmds || []).map(c => ({ tick: c.tick, side: c.side || 0, type: c.type, tx: +c.tx, ty: +c.ty })).sort((a, b) => a.tick - b.tick),
    log: [], used: [], frenzy: false, chainQ: [], chainSec: -1, chainN: 0, alerts: [], lastCmdTick: [-1, -1]
  };
  if (w.fb) w.fb.goalAdv = false; // Mayhem: the goal reward is reinforcements, not the V4 +6 % buff
  // every unit gets the same extra fields in the same order (one hidden class -> fast property access)
  for (const u of w.units) { if (!u.star) u.star = null; u.rushT = 0; u.rushX = 0; u.rushY = 0; u.ironT = 0; u.ironX = 0; u.ironY = 0; u.rampT = 0; u.koHist = null; u.rushHits = 0; u.rushVictimT = -9;
    u.rushSpd = 0; u.rushMax = 0; u.rushDmg = 0; u.rushKB = 0; u.ironDR = 0; u.miracleT = 0; u.miracleK = 0; } // 0 = Mayhem defaults
}
function mayGain(w, side, amt, isGoal) {
  if (side < 0 || side > 1 || w.phase !== 'battle') return;
  const m = w.may.s[side];
  if (!isGoal) { const sec = Math.floor(w.battleT); if (sec !== m.sec) { m.sec = sec; m.evE = 0; } amt = Math.min(amt, MAY.EV_CAP - m.evE); if (amt <= 0) return; m.evE += amt; }
  const before = m.energy; m.energy = Math.min(100, m.energy + amt); m.st.energyGained += m.energy - before;
}
function mayOnEvent(w, type, a, b) {
  if (type === EV.PASS_COMPLETE) { if (a >= 0) mayGain(w, w.units[a].side, 1); }
  else if (type === EV.BALL_GAIN) { if ((b === 1 || b === 3) && a >= 0) mayGain(w, w.units[a].side, 2); }
  else if (type === EV.SAVE_GOAL) { if (a >= 0) mayGain(w, w.units[a].side, 5); }
  else if (type === EV.KO) { if (a >= 0) { mayGain(w, w.units[a].side, 1); mayRampage(w, w.units[a]); } }
  else if (type === EV.GOAL) { mayGain(w, b, MAY.GOAL_E, true); mayReinfGain(w, b); }
}
// ---------- target selection (also used by the UI for previews) ----------
function mayCarrier(w, side) { const b = w.fb && w.fb.ball; if (!b || b.state !== 'CONTROLLED' || b.owner < 0) return null; const u = w.units[b.owner]; return u.alive && u.side === side ? u : null; }
function mayPick(w, side, type, tx, ty) {
  if (type === 'kick') { const u = mayCarrier(w, side); return u ? [u] : []; }
  const L = [];
  for (const u of w.teams[side].aliveList) {
    if (u.role === 'goalkeeper' || u.stun > 0 || u.dashT > 0) continue;
    if (type === 'iron' && !(u.role === 'defender' || u.role === 'support' || u.role === 'captain')) continue;
    const d = (u.x - tx) * (u.x - tx) + (u.y - ty) * (u.y - ty);
    if (type === 'iron' && d > MAY.IRON_R * MAY.IRON_R) continue;
    if (type === 'rush' && (u.rushT > 0)) continue;
    L.push([d, u]);
  }
  L.sort((p, q) => p[0] - q[0] || p[1].id - q[1].id);
  return L.slice(0, type === 'iron' ? MAY.IRON_N : MAY.RUSH_N).map(x => x[1]);
}
function mayValid(w, side, c) {
  const m = w.may.s[side], C = MAY.CMD[c.type];
  if (!C) return 'unknown';
  if (w.phase !== 'battle' || w.sudden) return 'not_now';
  if (w.may.lastCmdTick[side] === w.tick) return 'same_tick';
  if (m.cd[c.type] > 0) return 'cooldown';
  if (m.energy < C.cost) return 'energy';
  if (!(isFinite(c.tx) && isFinite(c.ty))) return 'target';
  if (c.tx < ARENA.x0 - 4 || c.tx > ARENA.x1 + 4 || c.ty < ARENA.y0 - 12 || c.ty > ARENA.y1 + 12) return 'target';
  const P = mayPick(w, side, c.type, c.tx, c.ty);
  if (!P.length) return c.type === 'kick' ? 'no_ball' : 'no_players';
  return null;
}
function mayApply(w, side, c) {
  const why = mayValid(w, side, c), A = w.may;
  const rec = { tick: w.tick, side, type: c.type, tx: +(+c.tx).toFixed(1), ty: +(+c.ty).toFixed(1), ok: !why, why: why || '' };
  if (side === 0 && A.s[0].mode === 'manual') A.log.push({ tick: c.tick, side: 0, type: c.type, tx: c.tx, ty: c.ty });
  if (why) { A.s[side].st.rejected++; ev(w, EV.CMD_REJECT, side, MAY_TYPES.indexOf(c.type), 0, c.tx, c.ty); A.used.push(rec); return false; }
  const m = A.s[side], C = MAY.CMD[c.type];
  m.energy -= C.cost; m.cd[c.type] = C.cd; m.lastCmdT = w.battleT; A.lastCmdTick[side] = w.tick; m.st[c.type]++;
  const P = mayPick(w, side, c.type, c.tx, c.ty); rec.n = P.length;
  if (c.type === 'kick') mayKick(w, P[0], c.tx, c.ty, rec);
  else if (c.type === 'rush') {
    P.forEach((u, i) => { const ang = i * 2.39996 + side, r = 4 + 9 * Math.sqrt(i); u.rushT = MAY.RUSH_T; u.rushX = clamp(c.tx + Math.cos(ang) * r, ARENA.x0 + 3, ARENA.x1 - 3); u.rushY = clamp(c.ty + Math.sin(ang) * r, ARENA.y0 + 4, ARENA.y1 - 2); u.rushHits = 0; u.act = ''; });
    m.st.rushUnits += P.length;
    if (!w.headless) part(w, 'ring', c.tx, c.ty, 120, 0, 0.4, teamColor(w, side), 2);
  } else {
    P.forEach((u, i) => { const ang = i * 2.39996, r = 6 + 7 * Math.sqrt(i); u.ironT = MAY.IRON_T; u.ironX = clamp(c.tx + Math.cos(ang) * r, ARENA.x0 + 3, ARENA.x1 - 3); u.ironY = clamp(c.ty + Math.sin(ang) * r, ARENA.y0 + 4, ARENA.y1 - 2); u.interceptT = Math.max(u.interceptT, MAY.IRON_T); u.kbImmuneT = 0; });
    m.st.ironUnits += P.length;
    if (!w.headless) part(w, 'ring', c.tx, c.ty, 90, 0, 0.5, '#7fb8ff', 2);
  }
  A.used.push(rec);
  ev(w, EV.CMD, side, MAY_TYPES.indexOf(c.type), P.length, c.tx, c.ty);
  if (!w.headless) w.banners.push({ key: 'cmd:' + c.type, side, t0: w.t, dur: 1.0, x: c.tx, y: c.ty });
  return true;
}
// Power Kick: the REAL match ball enters the V4 SHOOTING state toward the commanded point
function mayKick(w, u, tx, ty, rec) {
  const fb = w.fb, b = fb.ball, T = w.teams[u.side], r = w.may.rng;
  const err = r.normal() * 0.035 * (1.35 - T.at.finishing / 100);
  const ang = Math.atan2(ty - b.y, tx - b.x) + err;
  const sp = rec.speed || MAY.PK_SPEED;
  b.state = 'SHOOTING'; b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp; b.owner = -1; b.flight = 0; b.checked.length = 0;
  const gy = fbGoalY(u.side);
  const tGoal = b.vy !== 0 ? (gy - b.y) / b.vy : -1;
  const ax = tGoal > 0 ? b.x + b.vx * tGoal : -999;
  const onTarget = tGoal > 0 && ax > GOAL.x0 + GOAL.post && ax < GOAL.x1 - GOAL.post;
  const shot = { id: fb.nextShot++, side: u.side, shooter: u.id, tick: w.tick, x: +u.x.toFixed(1), y: +u.y.toFixed(1), onTarget, result: 'in-flight', gk: -1, pk: true, hits: [] };
  b.shot = shot; fb.shots.push(shot); fb.stats.shots[u.side]++; if (onTarget) fb.stats.onTarget[u.side]++;
  u.act = 'kick'; u.actT = 0.3;
  rec.shot = shot.id; rec.onTarget = onTarget;
  ev(w, EV.SHOT_ON_GOAL, u.id, shot.id, onTarget ? 1 : 0, u.x, u.y);
  if (!w.headless) { part(w, 'ring', u.x, u.y - 4, 80, 0, 0.3, '#ffe066', 2); w.shake = Math.max(w.shake, 1.2); }
}
// called from fbTick SHOOTING for Power Kick shots: defenders may block, up to 2 opponents get a limited hit
function mayKickPath(w, b, sh) {
  const shooter = w.units[sh.shooter];
  if (sh.lob && b.flight < sh.lob) return false; // lofted volley: flies over the first defenders
  for (const e of query(w, b.x, b.y + 2, 7, 1 - sh.side).slice()) {
    if (e.role === 'goalkeeper' || b.checked.indexOf(e.id) >= 0) continue;
    b.checked.push(e.id);
    if (sh.hits.length < (sh.maxHits || MAY.PK_HITS)) {
      sh.hits.push(e.id); w.may.s[sh.side].st.pkHits++;
      applyDamage(w, shooter, e, sh.dmg || MAY.PK_DMG, { kb: sh.kb || MAY.PK_KB, fx: b.x - b.vx * 0.05, fy: b.y - b.vy * 0.05, noAssist: true, chain: true });
      ev(w, EV.PK_HIT, sh.side, e.id, 0, e.x, e.y);
    }
    let p = MAY.PK_BLOCK + (e.role === 'defender' ? 0.1 : 0) + (e.ironT > 0 ? 0.15 : 0);
    if (w.fb.rng.next() < p) { // deflected: the ball becomes loose, no goal
      if (w.pow && powBounce(w, b, sh, 'block')) return true; // Pinball / Ricochet: the block sends it back toward goal
      sh.result = 'blocked'; if (e.ironT > 0) { w.may.s[e.side].st.ironStops++; ev(w, EV.IRON_STOP, e.side, e.id, 0, e.x, e.y); }
      b.state = 'LOOSE'; b.shot = null; b.looseT = 0; b.vx = -b.vx * 0.25 + (w.fb.rng.next() - 0.5) * 60; b.vy = -b.vy * 0.3; ev(w, EV.INTERCEPT, e.id, sh.shooter, 2, b.x, b.y);
      return true;
    }
  }
  return false;
}
// ---------- Goal Reinforcements ----------
function mayReinfGain(w, side) {
  const m = w.may.s[side]; const add = Math.min(MAY.REINF_PER_GOAL, MAY.REINF_MAX - m.earned); if (add <= 0) return;
  m.earned += add; m.pending += add; ev(w, EV.REINF_GAIN, side, add, m.earned);
}
function mayReinfDeploy(w) {
  for (let s = 0; s < 2; s++) {
    const m = w.may.s[s]; if (m.pending <= 0 || w.teams[s].alive <= 0 || w.teams[s].alive >= 100) continue;
    let pick = null;
    for (const u of w.units) if (u.side === s && !u.alive && !u.star && u.deadT >= MAY.REINF_DELAY && (!pick || u.koT < pick.koT || (u.koT === pick.koT && u.id < pick.id))) pick = u;
    if (!pick) continue;
    m.pending--; m.entered++; mayRevive(w, pick, m.entered);
  }
}
function mayRevive(w, u, k) {
  const T = w.teams[u.side], own = u.side === 0 ? ARENA.y1 - 18 : ARENA.y0 + 18, dir = u.side === 0 ? -1 : 1;
  u.alive = true; u.hp = u.maxHp; u.x = clamp(150 + ((k * 37) % 60), ARENA.x0 + 4, ARENA.x1 - 4); u.y = own; u.hx = u.x; u.hy = own + dir * 40;
  u.tgt = -1; u.retarget = 0; u.mvx = u.mvy = 0; u.kbx = u.kby = 0; u.stun = 0; u.dashT = 0; u.recover = 0; u.cd = 0.6; u.passCd = 1; u.healCd = 1;
  u.state = 'run'; u.act = ''; u.actT = 0; u.deadT = 0; u.koT = 0; u.killedBy = -1; u.sta = 100; u.flash = 0; u.hitT = -9;
  u.hasteT = u.atkSpdT = u.dmgBuffT = u.shieldT = u.slowT = u.regenT = u.critT = u.interceptT = u.adaptT = 0; u.kbImmuneT = 0;
  u.hasteMul = u.atkSpdMul = u.dmgBuffMul = u.slowMul = 1; u.shield = 0; u.regen = 0; u.critAdd = 0; u.assistMul = 1; u.assistFrom = -1;
  u.rushT = 0; u.ironT = 0; u.rampT = 0; u.koHist = null; u.rushHits = 0; u.rushVictimT = -9; u.invulnT = 0.7; u.aura = false;
  if (w.fb) w.fb.tackleT[u.id] = -9;
  T.alive++; T.aliveList.push(u);
  ev(w, EV.REINF_ENTER, u.side, u.id, k, u.x, u.y);
  if (!w.headless) { part(w, 'ring', u.x, u.y - 4, 70, 0, 0.4, teamColor(w, u.side), 2); ftext(w, 'SUB!', u.x, u.y - 16, '#7dffcf', 0.8); }
}
// ---------- Chain Collision (queued; resolved after projectiles so no nested grid queries) ----------
function mayChainQueue(w, att, tgt, dmg, kb) {
  const sec = Math.floor(w.battleT); if (sec !== w.may.chainSec) { w.may.chainSec = sec; w.may.chainN = 0; }
  if (w.may.chainN >= MAY.CHAIN_SEC || w.may.chainQ.length > 16) return;
  w.may.chainN++; w.may.chainQ.push({ a: att.id, t: tgt.id, dmg, kb, mul: w.pow && w.pow.s[att.side].dominoT > 0 ? 0.45 : MAY.CHAIN_MUL });
}
function mayChainResolve(w) {
  const Q = w.may.chainQ; if (!Q.length) return;
  w.may.chainQ = [];
  for (const c of Q) {
    const att = w.units[c.a], t = w.units[c.t];
    const near = query(w, t.x, t.y, 10, t.side).filter(o => o !== t).slice(0, MAY.CHAIN_N);
    if (!near.length) continue;
    w.may.s[att.side].st.chains++;
    ev(w, EV.CHAIN, att.side, t.id, near.length, t.x, t.y);
    for (const o of near) applyDamage(w, att.alive ? att : att, o, c.dmg * (c.mul || MAY.CHAIN_MUL), { kb: 14, fx: t.x, fy: t.y, noAssist: true, chain: true, silent: true });
  }
}
// ---------- KO Rampage ----------
function mayRampage(w, k) {
  if (!k || !k.alive) return;
  const H = k.koHist || (k.koHist = []); H.push(w.battleT); while (H.length && w.battleT - H[0] > MAY.RAMP_WIN) H.shift();
  if (H.length >= MAY.RAMP_N && k.rampT <= 0) {
    k.rampT = MAY.RAMP_T; H.length = 0; w.may.s[k.side].st.rampages++;
    ev(w, EV.RAMPAGE, k.side, k.id, 0, k.x, k.y);
    if (!w.headless) ftext(w, 'RAMPAGE!', k.x, k.y - 18, '#ff6b4a', 0.9, true);
  }
}
// combined, NON-stacking speed / attack multipliers (max of haste / frenzy / rampage)
function mayHaste(w, u) { let h = u.hasteT > 0 ? u.hasteMul : 1; if (w.may.frenzy) h = Math.max(h, MAY.FRENZY_SPD); if (u.rampT > 0) h = Math.max(h, MAY.RAMP_MUL); if (w.pow && w.pow.turboT > 0) h = Math.max(h, 1.2); return h; }
function mayAtk(w, u) { let h = u.atkSpdT > 0 ? u.atkSpdMul : 1; if (w.may.frenzy) h = Math.max(h, MAY.FRENZY_ATK); if (u.rampT > 0) h = Math.max(h, MAY.RAMP_MUL); if (w.pow && w.pow.turboT > 0) h = Math.max(h, 1.2); return h; }
// ---------- Team Rush / Iron Defense movement (inside updateUnit) ----------
function mayRush(w, u) {
  const dx = u.rushX - u.x, dy = u.rushY - u.y, d = Math.sqrt(dx * dx + dy * dy);
  if (d < 4) { u.rushT = 0; return false; }
  const s = curSpeed(w, u) * (u.rushSpd || MAY.RUSH_SPD), vx = dx / d * s, vy = dy / d * s;
  u.x += vx * DT; u.y += vy * DT; u.mvx = vx; u.mvy = vy; u.state = 'run'; if (Math.abs(vx) > 2) u.face = vx < 0 ? -1 : 1; u.back = vy < 0;
  u.sta = Math.max(0, u.sta - 4 * w.teams[u.side].drain * DT);
  if (u.rushHits < (u.rushMax || MAY.RUSH_HITS)) {
    const near = query(w, u.x, u.y, 7, 1 - u.side);
    for (let k = 0; k < near.length && u.rushHits < (u.rushMax || MAY.RUSH_HITS); k++) {
      const e = near[k]; if (w.t - e.rushVictimT < MAY.RUSH_VICTIM_CD) continue; // one rush hit per victim per 0.6 s
      e.rushVictimT = w.t; u.rushHits++;
      const st = w.may.s[u.side].st; st.rushHits++;
      const wasAlive = e.alive;
      applyDamage(w, u, e, u.rushDmg || MAY.RUSH_DMG, { kb: u.rushKB || MAY.RUSH_KB, stun: 0.25, noAssist: true });
      if (wasAlive && !e.alive) st.rushKO++;
      ev(w, EV.RUSH_HIT, u.side, e.id, 0, e.x, e.y);
      break; // query buffer may be reused by applyDamage side effects: one hit per tick
    }
  }
  return true;
}
// ---------- Counterattack Alert (from the real ball state) ----------
function mayAlerts(w) {
  const b = w.fb && w.fb.ball; if (!b || b.state !== 'CONTROLLED' || b.owner < 0) return;
  const o = w.units[b.owner], s = o.side, gy = fbGoalY(s), gx = (GOAL.x0 + GOAL.x1) / 2;
  const dGoal = Math.hypot(gx - o.x, gy - o.y); if (dGoal > 190) return;
  let def = 0; for (const e of query(w, o.x, o.y, 70, 1 - s)) if (e.role !== 'goalkeeper' && (e.y - o.y) * (s === 0 ? -1 : 1) > -12) def++;
  const sup = query(w, o.x, o.y, 60, s).length - 1;
  if (def <= 3 && sup >= 1 && w.t - w.may.s[s].alertT >= MAY.ALERT_CD) {
    w.may.s[s].alertT = w.t; w.may.alerts.push({ side: s, t: w.t, x: o.x, y: o.y });
    ev(w, EV.ALERT, s, o.id, def, o.x, o.y);
    if (!w.headless) w.banners.push({ key: 'alert', side: s, t0: w.t, dur: 1.2, x: o.x, y: o.y });
  }
}
// ---------- AI War Commands (deterministic, from the real battle state) ----------
function mayAI(w, side) {
  const m = w.may.s[side]; if (m.mode === 'manual' || m.mode === 'off') return null;
  if ((w.tick % 30) !== side * 15) return null;              // decide twice a second
  const cons = m.mode === 'auto';                             // conservative auto (Quick Simulate player)
  if (w.battleT - m.lastCmdT < (cons ? 4 : 2.6)) return null;
  const b = w.fb.ball, r = w.may.rng, gx = (GOAL.x0 + GOAL.x1) / 2;
  const car = mayCarrier(w, side);
  if (car && m.cd.kick <= 0 && m.energy >= MAY.CMD.kick.cost) {
    const gy = fbGoalY(side), dG = Math.hypot(gx - car.x, gy - car.y);
    if (dG < (cons ? 150 : 175)) return { type: 'kick', tx: gx + (r.next() * 2 - 1) * 15, ty: gy };
  }
  const oppCar = mayCarrier(w, 1 - side);
  if (oppCar && m.cd.iron <= 0 && m.energy >= MAY.CMD.iron.cost) {
    const og = fbGoalY(1 - side), dO = Math.hypot(gx - oppCar.x, og - oppCar.y);
    const alert = w.may.s[1 - side].alertT >= w.t - 1.5;
    if (dO < (cons ? 140 : 175) || alert) return { type: 'iron', tx: oppCar.x + (gx - oppCar.x) * 0.25, ty: oppCar.y + (og - oppCar.y) * 0.25 };
  }
  if (m.cd.rush <= 0 && m.energy >= (cons ? 88 : 72)) {
    const c = densestEnemy(w, side, b.x, b.y, 170);
    if (c && c.n >= 5) return { type: 'rush', tx: c.x, ty: c.y };
  }
  return null;
}
function mayTick(w) {
  const A = w.may;
  for (let s = 0; s < 2; s++) {
    const m = A.s[s];
    m.energy = Math.min(100, m.energy + MAY.RATE * DT);
    for (const k of MAY_TYPES) if (m.cd[k] > 0) m.cd[k] = Math.max(0, m.cd[k] - DT);
  }
  if (!A.frenzy && w.battleT >= MAY.FRENZY_T) { A.frenzy = true; ev(w, EV.FRENZY, -1, -1, 0); addRule(w, 'FINAL_FRENZY'); banner(w, 'frenzy', 1.6, '#ff9f1c'); }
  // player / replayed commands (one per side per tick; extra ones in the same tick are rejected)
  while (A.queue.length && A.queue[0].tick <= w.tick) { const c = A.queue.shift(); mayApply(w, c.side, c); }
  for (let s = 0; s < 2; s++) { const c = mayAI(w, s); if (c && !mayValid(w, s, c)) mayApply(w, s, c); } // AI only issues commands that can really apply
  mayReinfDeploy(w);
  if (w.pow) powTick(w);
  if ((w.tick % 6) === 0) mayAlerts(w);
  for (const u of w.units) if (u.alive) { if (u.rushT > 0) u.rushT -= DT; if (u.ironT > 0) u.ironT -= DT; if (u.rampT > 0) u.rampT -= DT; }
}
function mayCommand(w, type, tx, ty) { if (!w.may) return false; w.may.queue.push({ tick: w.tick + 1, side: 0, type, tx: +(+tx).toFixed(2), ty: +(+ty).toFixed(2) }); return true; }
function mayCanUse(w, side, type) { const m = w.may.s[side], C = MAY.CMD[type]; return w.phase === 'battle' && !w.sudden && m.cd[type] <= 0 && m.energy >= C.cost; }
function maySummary(w) {
  if (!w.may) return null;
  const S = w.may.s.map(m => Object.assign({ earned: m.earned, entered: m.entered, pending: m.pending, energy: +m.energy.toFixed(1) }, m.st));
  const shots = w.fb ? w.fb.shots.filter(s => s.pk) : [];
  for (let s = 0; s < 2; s++) { const L = shots.filter(x => x.side === s); S[s].pkShots = L.length; S[s].pkGoals = L.filter(x => x.result === 'goal').length; S[s].pkSaved = L.filter(x => x.result === 'save').length; S[s].pkBlocked = L.filter(x => x.result === 'blocked').length; S[s].commands = S[s].kick + S[s].rush + S[s].iron; }
  return { version: MAY.VERSION, sides: S, commands: w.may.used.slice(), inputs: w.may.log.slice(), frenzy: w.may.frenzy, alerts: w.may.alerts.length };
}
MAY.reinfGain = mayReinfGain; // same function the EV.GOAL handler calls (exposed for targeted tests)
MAY.pick = mayPick; MAY.valid = mayValid; MAY.canUse = mayCanUse; MAY.carrier = mayCarrier; MAY.TYPES = MAY_TYPES;
