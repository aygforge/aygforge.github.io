# Generates src/battle/engine.js from the ORIGINAL V4 FWEngine source with small, asserted patches.
# Legacy rulesets ('classic', 'fusion') must stay bit-identical (verified by tests/engine.regression.test.mjs).
# Every career behaviour is gated by w.career / u.mod / T.car, which do not exist in legacy worlds.
import sys, re
src = open(sys.argv[1]).read()
out_path = sys.argv[2]
def P(old, new, count=1):
    global src
    n = src.count(old)
    assert n == count, f"patch anchor found {n}x (expected {count}): {old[:90]!r}"
    src = src.replace(old, new)

# --- module wrapper -> ES module (also publishes window.FWEngine for the legacy renderer scripts)
P("(function (root) {\n'use strict';\n", "const root = typeof window !== 'undefined' ? window : globalThis;\n")
P("if (typeof module !== 'undefined' && module.exports) module.exports = API;\nroot.FWEngine = API;\n})(typeof window !== 'undefined' ? window : globalThis);",
  "root.FWEngine = API;\nexport default API;\nexport { API as FWEngine };")

# --- headless: cosmetic FX use their own RNG (fxRng) and never touch battle state, so skipping them is result-neutral
P("function part(w, type, x, y, vx, vy, life, color, size, z, vz) {\n  if (w.parts.length >= w.partCap) return;",
  "function part(w, type, x, y, vx, vy, life, color, size, z, vz) {\n  if (w.headless || w.parts.length >= w.partCap) return;")
P("function burst(w, x, y, n, colors, spd, life, type, up) {\n", "function burst(w, x, y, n, colors, spd, life, type, up) {\n  if (w.headless) return;\n")
P("function ftext(w, text, x, y, color, life, big) {", "function ftext(w, text, x, y, color, life, big) { if (w.headless) return;")
P("function updateFx(w, dt) {\n", "function updateFx(w, dt) {\n  if (w.headless) return;\n")
P("  if (crit) { w.shake", "  if (crit && !w.headless) { w.shake")
# event log: hash always, object log optional (world sims keep only counters)
P("function ev(w, type, a, b, c, x, y) {\n  w.events.push(", "function ev(w, type, a, b, c, x, y) {\n  if (!w.noLog) w.events.push(")

# --- createWorld: career options
P("    tiebreak: null, startTotal: 0, cam: { x: LW / 2, y: MIDY, z: 1 }\n  };",
  "    tiebreak: null, startTotal: 0, cam: { x: LW / 2, y: MIDY, z: 1 },\n    headless: !!opts.headless, noLog: !!opts.noLog, career: opts.career ? careerInit(opts.career) : null\n  };")
P("  w.teams[0] = deriveTeam(opts.teamA, opts.cfg, 0, pb, rng, dur);\n  w.teams[1] = deriveTeam(opts.teamB, opts.cfg, 1, pa, rng, dur);",
  "  w.teams[0] = deriveTeam(opts.teamA, opts.cfg, 0, pb, rng, dur, w.career);\n  w.teams[1] = deriveTeam(opts.teamB, opts.cfg, 1, pa, rng, dur, w.career);")
P("  if (opts.ruleset === 'fusion') w.fb = fbCreate(w, opts);", "  if (opts.ruleset === 'fusion' || w.career) w.fb = fbCreate(w, opts);\n  if (w.career) careerAfterSpawn(w);")

# --- deriveTeam: career power curve + tactic-driven tendency (career only)
P("function deriveTeam(team, cfg, side, oppPower, rng, dur) {\n  const bp = team.battle_profile;\n  const archDef",
  "function deriveTeam(team, cfg, side, oppPower, rng, dur, car) {\n  const bp = team.battle_profile;\n  const archDef")
P("  const adv = cap * Math.tanh((bp.power_index - oppPower) / 24);",
  "  const adv = car ? car.rules.advCap * Math.tanh((bp.power_index - oppPower) / car.rules.advScale) : cap * Math.tanh((bp.power_index - oppPower) / 24);")
P("  for (const r of ROLES) { T.elimByRole[r] = 0; T.lossByRole[r] = 0; }\n  return T;",
  "  for (const r of ROLES) { T.elimByRole[r] = 0; T.lossByRole[r] = 0; }\n  if (car) careerTeam(T, car, side, bp);\n  return T;")

# --- spawn: per-unit specs (standard quality / star) + tactic depth shift
P("  const frontY = side === 0 ? MIDY + 64 : MIDY - 64;", "  const frontY = side === 0 ? MIDY + 64 : MIDY - 64;\n  const cShift = T.car ? T.car.depthShift : 0, spec = T.car ? T.car.byRole : null;")
P("    const bandY = goalY + (frontY - goalY) * d;", "    const bandY = goalY + (frontY - goalY) * d + (role === 'goalkeeper' ? 0 : dir * cShift);")
P("        addUnit(w, T, role, x + rng.range(-3, 3), y, variants, dir); void m; continue;",
  "        addUnit(w, T, role, x + rng.range(-3, 3), y, variants, dir, spec && spec[role][i]); void m; continue;")
P("      addUnit(w, T, role, x, y, variants, dir);\n    }", "      addUnit(w, T, role, x, y, variants, dir, spec && spec[role][i]);\n    }")
P("function addUnit(w, T, role, fx, fy, variants, dir) {", "function addUnit(w, T, role, fx, fy, variants, dir, spec) {")
P("  w.units.push(u); T.alive++; T.aliveList.push(u);\n}", "  if (spec) careerUnit(w, T, u, spec);\n  w.units.push(u); T.alive++; T.aliveList.push(u);\n}")

# --- per-unit / per-team career modifiers in the shared formulas
P("  if (T.tendency === 'formation') m *= 1.03;          // possession: combination play",
  "  if (T.car) m *= T.car.cDmg;\n  if (T.tendency === 'formation') m *= 1.03;          // possession: combination play")
P("  if (u.adaptT > 0) a += 0.08;\n  const td", "  if (u.adaptT > 0) a += 0.08;\n  if (w.career) a += w.teams[u.side].car.cArmor;\n  const td")
P("  if (w.fb && w.fb.buff[u.side] > 0) s *= BUFF_MUL;\n  return s;", "  if (w.fb && w.fb.buff[u.side] > 0) s *= BUFF_MUL;\n  if (T.car) s *= (u.ri <= 2 || u.ri === 6) ? T.car.cSpeedAtk : T.car.cSpeed;\n  return s;")
P("  if (u.sta < 20) r *= 0.88;\n  return r;", "  if (u.sta < 20) r *= 0.88;\n  if (T.car) r *= T.car.cAtk;\n  return r;")
P("    const cc = AT.critChance + (att.critT > 0 ? att.critAdd : 0);", "    const cc = AT.critChance + (att.critT > 0 ? att.critAdd : 0) + (att.mod ? att.mod.crit : 0);")
P("        const st = 0.4 * T.knock;", "        const st = 0.4 * T.knock * (u.mod ? 1 + u.mod.stun : 1);")
P("      const allies = query(w, u.x, u.y, 34, u.side);\n      let low = null, lf = 0.86;",
  "      const allies = query(w, u.x, u.y, u.mod ? 34 * (1 + u.mod.healR) : 34, u.side);\n      let low = null, lf = 0.86;")
P("        const amt = 0.07 * T.teamwork;", "        const amt = 0.07 * T.teamwork * (u.mod ? 1 + u.mod.heal : 1);")
P("    for (const c of w.units) if (c.alive && c.role === 'captain') for (const u of query(w, c.x, c.y, 34, c.side)) u.aura = true;",
  "    for (const c of w.units) if (c.alive && c.role === 'captain') for (const u of query(w, c.x, c.y, c.mod ? 34 * (1 + c.mod.aura) : 34, c.side)) u.aura = true;")
# stamina drain + tactical movement (career)
P("  if (hold && role !== 'defender' && role !== 'goalkeeper') { mx = (u.hx - u.x) * 0.05; my = (u.hy - u.y) * 0.05; }",
  "  if (hold && role !== 'defender' && role !== 'goalkeeper') { mx = (u.hx - u.x) * 0.05; my = (u.hy - u.y) * 0.05; }\n  if (T.car && role !== 'goalkeeper') { const v = careerDrift(w, T, u, mx, my, dirF); mx = v[0]; my = v[1]; }")
P("    u.sta = Math.max(0, u.sta - 3.2 * T.drain * DT * Math.min(1, m));", "    u.sta = Math.max(0, u.sta - 3.2 * T.drain * (T.car ? T.car.cDrain * (u.mod ? 1 + u.mod.drain : 1) : 1) * DT * Math.min(1, m));")
# battle-shot GK saves
P("        if (e.role === 'goalkeeper') ch = clamp(0.14 + (w.teams[e.side].gk - 70) / 260, 0.06, 0.3);",
  "        if (e.role === 'goalkeeper') ch = clamp(0.14 + (w.teams[e.side].gk - 70) / 260 + (e.mod ? e.mod.save * 0.5 : 0), 0.06, 0.3 + (e.mod ? e.mod.save * 0.5 : 0));")
P("        t.assistMul = Math.max(t.assistMul, (p.kind === PK.COMBO ? 1.5 : 1.35) + 0.12 * (T.teamwork - 1) + 0.1 * (T.tech - 1));",
  "        t.assistMul = Math.max(t.assistMul, (p.kind === PK.COMBO ? 1.5 : 1.35) + 0.12 * (T.teamwork - 1) + 0.1 * (T.tech - 1) + (owner.mod ? owner.mod.assist : 0));")

# --- football (Fusion) hooks
P("  const err = r.normal() * 9 * (1.35 - T.at.finishing / 100) * (1 + dg / 160); // accuracy drops with distance",
  "  const err = r.normal() * 9 * (1.35 - T.at.finishing / 100) * (1 + dg / 160) * (u.mod ? 1 - u.mod.shootAcc : 1); // accuracy drops with distance")
P("  const range = (SHOOT_RANGE[u.role] || 60) * (0.85 + 0.3 * T.at.finishing / 100);",
  "  const range = (SHOOT_RANGE[u.role] || 60) * (0.85 + 0.3 * T.at.finishing / 100) * (u.mod ? 1 + u.mod.shootRange : 1);")
P("    if (r.next() < p * cfg.shoot) { fbShoot(w, u); return; }", "    if (r.next() < p * cfg.shoot * (T.car ? T.car.cShoot : 1)) { fbShoot(w, u); return; }")
P("    if (r.next() < 0.25 * cfg.shoot) { fbShoot(w, u); return; } // occasional long-range effort",
  "    if (r.next() < 0.25 * cfg.shoot * (T.car ? T.car.cShoot : 1)) { fbShoot(w, u); return; } // occasional long-range effort")
P("  const hold = (u.role === 'playmaker' ? 0.7 : u.role === 'winger' ? 1.4 : u.role === 'striker' ? 1.2 : 0.8) * cfg.hold * (T.tendency === 'formation' ? 0.8 : 1);",
  "  const hold = (u.role === 'playmaker' ? 0.7 : u.role === 'winger' ? 1.4 : u.role === 'striker' ? 1.2 : 0.8) * cfg.hold * (T.tendency === 'formation' ? 0.8 : 1) * (T.car ? T.car.cHold : 1);")
P("    for (let s = 0; s < 2; s++) for (const u of near(b.x, b.y, s, cfg.chase, rad, notGK)) M[u.id] = 1;",
  "    for (let s = 0; s < 2; s++) for (const u of near(b.x, b.y, s, chaseN(w, s, cfg), rad, notGK)) M[u.id] = 1;")
P("    for (const u of near(o.x, o.y, 1 - o.side, cfg.chase, 75, notGK)) M[u.id] = 2;          // press the carrier",
  "    for (const u of near(o.x, o.y, 1 - o.side, chaseN(w, 1 - o.side, cfg), 75, notGK)) M[u.id] = 2;          // press the carrier")
P("    for (const u of near(o.x, o.y, o.side, cfg.support + 1, 110,", "    for (const u of near(o.x, o.y, o.side, supportN(w, o.side, cfg) + 1, 110,")
P("  const m = Math.sqrt(mx * mx + my * my) || 1, s = curSpeed(w, u) * 1.05;", "  const m = Math.sqrt(mx * mx + my * my) || 1, s = curSpeed(w, u) * 1.05 * (u.mod ? 1 + u.mod.carry : 1) * (T.car ? T.car.cCarry : 1);")
P("  u.sta = Math.max(0, u.sta - 3.2 * T.drain * DT); u.state = 'run';", "  u.sta = Math.max(0, u.sta - 3.2 * T.drain * (T.car ? T.car.cDrain : 1) * DT); u.state = 'run';")
P("  if (kind === 1) fb.stats.steals[u.side]++;", "  if (kind === 1) fb.stats.steals[u.side]++;\n  if (w.career) careerBallGain(w, u, kind);")
P("      const ch = 0.07 + (e.role === 'defender' ? 0.08 : 0) + (e.role === 'goalkeeper' ? 0.08 : 0) + (TE.at.pressing - 70) / 500 - (TO.at.technique - 70) / 500;",
  "      const ch = 0.07 + (e.role === 'defender' ? 0.08 : 0) + (e.role === 'goalkeeper' ? 0.08 : 0) + (TE.at.pressing - 70) / 500 - (TO.at.technique - 70) / 500 + (e.mod ? e.mod.tackle : 0) + (TE.car ? TE.car.cTackle : 0);")
P("      const ch = 0.2 + (e.role === 'defender' ? 0.15 : 0) + (w.teams[e.side].at.pressing - 70) / 400;",
  "      const ch = (0.2 + (e.role === 'defender' ? 0.15 : 0) + (w.teams[e.side].at.pressing - 70) / 400 + (e.mod ? e.mod.intercept : 0)) * (from.mod ? 1 - from.mod.pass : 1);")
P("      const TG = w.teams[g.side]; let p = 0.38 + (TG.gk - 70) / 250 + (g.guard ? 0.08 : 0); if (!sh.onTarget) p *= 0.5;",
  "      const TG = w.teams[g.side]; let p = 0.38 + (TG.gk - 70) / 250 + (g.guard ? 0.08 : 0) + (g.mod ? g.mod.save : 0); if (!sh.onTarget) p *= 0.5;")
P("        ev(w, EV.SAVE_GOAL, g.id, sh.id, 0, b.x, b.y);", "        ev(w, EV.SAVE_GOAL, g.id, sh.id, 0, b.x, b.y); g.saves = (g.saves || 0) + 1;")
P("        ev(w, EV.GOAL, sh.shooter, sh.side, fb.goals[sh.side], b.x, gy);", "        ev(w, EV.GOAL, sh.shooter, sh.side, fb.goals[sh.side], b.x, gy); if (shooter) shooter.goals = (shooter.goals || 0) + 1;")
P("          saved = true;", "          saved = true; if (e.role === 'goalkeeper') e.saves = (e.saves || 0) + 1;")

# --- end rule (career): more players standing, then health share, then seeded decision
P("      const hpf = s => w.teams[s].aliveList.reduce((m, u) => m + u.hp / u.maxHp, 0);\n      const ha = hpf(0), hb = hpf(1);\n      let win;\n      if (Math.abs(ha - hb) > 1e-6)",
  "      const hpf = s => w.teams[s].aliveList.reduce((m, u) => m + u.hp / u.maxHp, 0);\n      const ha = hpf(0), hb = hpf(1);\n      let win;\n      if (w.career && a !== b) { win = a > b ? 0 : 1; w.tiebreak = 'alive'; addRule(w, 'TIEBREAK_ALIVE'); }\n      else if (Math.abs(ha - hb) > 1e-6)")

# --- step: career command queue + live coach; camera/FX skipped when headless
P("  w.battleT = t - TL.battleStart;\n  rebuildGrid(w);\n  antiStall(w);", "  w.battleT = t - TL.battleStart;\n  if (w.career) careerTick(w);\n  rebuildGrid(w);\n  antiStall(w);")
P("  checkEnd(w);\n  updateFx(w, DT);\n  updateCam(w, DT);\n}", "  checkEnd(w);\n  updateFx(w, DT);\n  if (!w.headless) updateCam(w, DT);\n}")
P("  ev(w, EV.KO, killer ? killer.id : -1, u.id, u.role === 'captain' ? 1 : 0, u.x, u.y);", "  ev(w, EV.KO, killer ? killer.id : -1, u.id, u.role === 'captain' ? 1 : 0, u.x, u.y);\n  if (T.car) T.car.koT.push(w.t);")

# --- career module + API
career = open(sys.argv[3]).read()
P("// ---------------- main step ----------------", career + "\n// ---------------- main step ----------------")
P("SPECIAL_NAMES, ROLE_NAMES, EV, PK,", "SPECIAL_NAMES, ROLE_NAMES, EV, PK, CAREER_DEFAULTS, TACTICS, STYLES, COMMANDS, issue: careerIssue, canIssue: careerCan, careerState, careerSummary, coachDecide,")
open(out_path, 'w').write("/* FOOTBALL WARS — battle engine. Generated from the V4 FWEngine by tools/build-engine.py (do not edit by hand;\n * edit tools/engine-career.js or the patch list). Legacy 'classic'/'fusion' rulesets are bit-identical to V4. */\n" + src)
print("engine written", len(src))
