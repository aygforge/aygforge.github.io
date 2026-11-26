# ROGUELITE REBORN engine stage: src/v4_engine.js -> src/engine_rogue.js (+ tools/engine_rogue_ext.js).
# Every hook is guarded by `w.rg`, which only exists when createWorld got opts.rogue. Without it the V4 code path
# is unchanged (regression: identical V4 hashes, see tools/test_rogue.js).
import sys
src = sys.argv[1] if len(sys.argv) > 1 else 'v4_engine.js'
dst = sys.argv[2] if len(sys.argv) > 2 else 'engine_rogue.js'
s = open(src).read()
def rep(old, new, cnt=1):
    global s
    n = s.count(old)
    if n != cnt: sys.exit('count %d != %d for: %s' % (n, cnt, old[:90]))
    s = s.replace(old, new)

rep("(function (root) {\n'use strict';\n\nconst DT", "(function (root) {\n'use strict';\n/* ROGUELITE REBORN: opt-in Campaign hooks (opts.rogue -> w.rg). Without opts.rogue the engine follows the exact\n * V4 code path. The Campaign replaces V4's single-match end rules (hunt / zone / storm / sudden death / revive /\n * HP-coin tiebreak / 65 s video cap) with FWObjectiveResolver; physics, football and combat are V4's. */\n\nconst DT")
# world creation
rep("    tiebreak: null, startTotal: 0, cam: { x: LW / 2, y: MIDY, z: 1 }\n  };\n",
    "    tiebreak: null, startTotal: 0, cam: { x: LW / 2, y: MIDY, z: 1 }\n  };\n  if (opts.rogue) rgPre(w, opts.rogue);\n")
rep("  w.teams[1] = deriveTeam(opts.teamB, opts.cfg, 1, pa, rng, dur);\n",
    "  w.teams[1] = deriveTeam(opts.teamB, opts.cfg, 1, pa, rng, dur);\n  if (w.rg) rgTeams(w);\n")
rep("  w.units.push(u); T.alive++; T.aliveList.push(u);\n}",
    "  if (w.rg) rgBind(w, u, T);\n  w.units.push(u); T.alive++; T.aliveList.push(u);\n}")
rep("  if (opts.ruleset === 'fusion') w.fb = fbCreate(w, opts); // Classic worlds have no w.fb at all\n",
    "  if (opts.ruleset === 'fusion') w.fb = fbCreate(w, opts); // Classic worlds have no w.fb at all\n  if (w.rg) rgInit(w);\n")
# headless: skip cosmetic particles / texts / banners (fx RNG only, never battle state)
rep("function part(w, type, x, y, vx, vy, life, color, size, z, vz) {\n", "function part(w, type, x, y, vx, vy, life, color, size, z, vz) {\n  if (w.headless) return;\n")
rep("function ftext(w, text, x, y, color, life, big) { ", "function ftext(w, text, x, y, color, life, big) { if (w.headless) return; ")
# event bridge
rep("  w.evCount++;\n", "  w.evCount++;\n  if (w.rg) rgOnEvent(w, type, a, b, c, x, y);\n")
# damage: card attack bonus / damage reduction / deflection / counters (capped)
rep("  if (tgt.invulnT > 0 && !opts.true) dmg = 0;\n", "  if (w.rg) { dmg = rgDamage(w, att, tgt, dmg, opts); if (dmg <= 0) return 0; }\n  if (tgt.invulnT > 0 && !opts.true) dmg = 0;\n")
rep("    const k = opts.kb * AT.knock / w.teams[tgt.side].knock;\n", "    const k = opts.kb * AT.knock / w.teams[tgt.side].knock * (w.rg ? rgKbMul(w, tgt) : 1);\n")
rep("  if (opts.stun && tgt.kbImmuneT <= 0) tgt.stun = Math.max(tgt.stun, opts.stun);\n",
    "  if (opts.stun && tgt.kbImmuneT <= 0) tgt.stun = Math.max(tgt.stun, opts.stun * (w.rg ? rgStunMul(w, tgt, att, opts) : 1));\n")
rep("        applyDamage(w, u, e, u.dmg, { kb: T.tendency === 'brawl' ? 37 : 34, stun: st });",
    "        applyDamage(w, u, e, u.dmg, { kb: T.tendency === 'brawl' ? 37 : 34, stun: st, tackle: 1 });")
rep("    if (u.dashT <= 0) { u.recover = 0.28; }", "    if (u.dashT <= 0) { u.recover = w.rg ? 0.28 * rgRecoverMul(w, u) : 0.28; }")
# speed / attack rate
rep("  if (w.hunt) s *= 1.12;\n", "  if (w.hunt) s *= 1.12;\n  if (w.rg) s *= rgSpeed(w, u);\n")
rep("  if (u.sta < 20) r *= 0.88;\n  return r;", "  if (u.sta < 20) r *= 0.88;\n  if (w.rg) r *= rgRate(w, u);\n  return r;")
# AI: targeting priorities (Focus / authored tactics) and movement
rep("    s += 7 * e.targetedBy;\n", "    s += (w.rg ? rgTgtW(w, u) : 7) * e.targetedBy;\n    if (w.rg) s += rgAcq(w, u, e);\n")
rep("  if (w.fb) { const md = w.fb.mode[u.id]; if (md) { const v = fbSteer(w, u, md); if (v) { mx = v[0]; my = v[1]; } } } // Fusion: ball-related runs\n",
    "  if (w.fb) { const md = w.fb.mode[u.id]; if (md) { const v = fbSteer(w, u, md); if (v) { mx = v[0]; my = v[1]; } } } // Fusion: ball-related runs\n  if (w.rg && u.role !== 'goalkeeper') { const v = rgSteer(w, u, tgt, d, mx, my); if (v) { mx = v[0]; my = v[1]; } }\n")
rep("    if (d <= reach && u.cd <= 0) {\n      if (role === 'defender') {", "    if (d <= reach && u.cd <= 0 && !(w.rg && role === 'defender' && rgNoDash(w, u, d, reach))) {\n      if (role === 'defender') {")
rep("    else if (d < u.range * 0.4 && role !== 'captain') { mx = -nx * 0.55; my = -ny * 0.55; u.state = 'kite'; }",
    "    else if (d < u.range * 0.4 && role !== 'captain' && !(w.rg && rgNoKite(w, u))) { mx = -nx * 0.55; my = -ny * 0.55; u.state = 'kite'; }")
# football: real ball, card / focus / tactic modifiers on real decisions only
rep("    if (r.next() < p * cfg.shoot) { fbShoot(w, u); return; }", "    if (r.next() < p * cfg.shoot * (w.rg ? rgShootPref(w, u) : 1)) { fbShoot(w, u); return; }")
rep("    if (r.next() < 0.25 * cfg.shoot) { fbShoot(w, u); return; } // occasional long-range effort",
    "    if (r.next() < 0.25 * cfg.shoot * (w.rg ? rgShootPref(w, u) : 1)) { fbShoot(w, u); return; } // occasional long-range effort")
rep("  if (press >= 2 || b.held > hold || b.held > 3.0) {", "  if (press >= 2 || b.held > hold * (w.rg ? rgHoldMul(w, u) : 1) || b.held > 3.0) {")
rep("  const err = r.normal() * 9 * (1.35 - T.at.finishing / 100) * (1 + dg / 160); // accuracy drops with distance\n",
    "  const err = r.normal() * 9 * (1.35 - T.at.finishing / 100) * (1 + dg / 160) * (w.rg ? rgShotErr(w, u) : 1); // accuracy drops with distance\n")
rep("  const sp = 215 + T.at.finishing * 0.5;\n", "  const sp = (215 + T.at.finishing * 0.5) * (w.rg ? rgShotSp(w, u) : 1);\n")
rep("  const pd = Math.hypot(m.x - u.x, m.y - u.y); b.sp = (pd > 110 ? 195 : 150) + (T.at.technique - 70) * 0.8; fb.stats.passAtt[u.side]++;",
    "  const pd = Math.hypot(m.x - u.x, m.y - u.y); b.sp = ((pd > 110 ? 195 : 150) + (T.at.technique - 70) * 0.8) * (w.rg ? rgPassSp(w, u) : 1); fb.stats.passAtt[u.side]++;")
rep("  for (const m of query(w, u.x, u.y, longBall ? 175 : 110, u.side)) {", "  const xr = w.rg ? rgPassRange(w, u) : 0;\n  for (const m of query(w, u.x, u.y, (longBall ? 175 : 110) + xr, u.side)) {")
rep("    if (d > 110 && !(m.role === 'striker' || m.role === 'winger') ) continue; // long balls only to forwards",
    "    if (d > 110 + xr && !(m.role === 'striker' || m.role === 'winger') ) continue; // long balls only to forwards")
rep("    s += fb.rng.next() * 8;\n", "    s += fb.rng.next() * 8;\n    if (w.rg) s += rgMateBonus(w, u, m, d);\n")
rep("- (TO.at.technique - 70) / 500;\n", "- (TO.at.technique - 70) / 500;\n      if (w.rg) ch = rgTackleCh(w, e, o, ch);\n")
rep("      const ch = 0.2 + (e.role === 'defender' ? 0.15 : 0) + (w.teams[e.side].at.pressing - 70) / 400;\n",
    "      let ch = 0.2 + (e.role === 'defender' ? 0.15 : 0) + (w.teams[e.side].at.pressing - 70) / 400;\n      if (w.rg) ch = rgInterceptCh(w, e, from, ch);\n")
rep("if (!sh.onTarget) p *= 0.5;\n", "if (!sh.onTarget) p *= 0.5;\n      if (w.rg) p = rgSaveP(w, g, sh, p);\n")
rep("      if (best) fbGain(w, best, 0);\n", "      if (!best && w.rg) best = rgPickup(w, b);\n      if (best) fbGain(w, best, 0);\n")
rep("const ch = 0.07 + (e.role === 'defender' ? 0.08 : 0)", "let ch = 0.07 + (e.role === 'defender' ? 0.08 : 0)")
rep("  if ((w.tick % 6) === 0) fbAssign(w);\n", "  if ((w.tick % 6) === 0) { fbAssign(w); if (w.rg) rgAssign(w); }\n")
# end rules: the Campaign resolver replaces anti-stall and V4's single-match end
rep("function antiStall(w) {\n", "function antiStall(w) {\n  if (w.rg) return; // Campaign: no hunt / zone / storm\n")
rep("function checkEnd(w) {\n", "function checkEnd(w) {\n  if (w.rg) { rgCheckEnd(w); return; } // Campaign: FWObjectiveResolver (no tiebreak K.O.s, no sudden death, no revive)\n")
rep("function updateSpecials(w) {\n  if (w.sudden) return;\n", "function updateSpecials(w) {\n  if (w.sudden) return;\n  if (w.rg && w.battleT < 1) return;\n")
# per-tick: focus commands (input log) before units act; card triggers after the football tick
rep("  w.battleT = t - TL.battleStart;\n  rebuildGrid(w);\n  antiStall(w);\n", "  w.battleT = t - TL.battleStart;\n  rebuildGrid(w);\n  if (w.rg) rgPreTick(w);\n  antiStall(w);\n")
rep("  if (w.fb) fbTick(w);\n  // grass dust", "  if (w.fb) fbTick(w);\n  if (w.rg) rgTick(w);\n  // grass dust")
rep("    if (u.alive) { u.animT += sdt; u.state = 'victory';", "    if (u.alive && w.rg && u.side !== w.winner) { u.animT += sdt; u.state = 'idle'; u.act = ''; u.mvx = u.mvy = 0; }\n    else if (u.alive) { u.animT += sdt; u.state = 'victory';")
rep("  if (w.phase === 'ended') { if (w.t - w.endT < 1.0 && w.lastKO) { tz = 1.14; tx = w.lastKO.x; ty = w.lastKO.y; } }",
    "  if (w.phase === 'ended') { if (w.t - w.endT < 1.0 && w.lastKO && !w.rg) { tz = 1.14; tx = w.lastKO.x; ty = w.lastKO.y; } }")
ext = open('../tools/engine_rogue_ext.js').read()
rep("\nconst API = { DT,", "\n" + ext + "\nconst API = { DT,")
rep("clamp, GOAL, FB_STATE, fbSummary };", "clamp, GOAL, FB_STATE, fbSummary, RG, ObjectiveResolver, rgCanFocus, rgSummary };")
open(dst, 'w').write(s); print('rogue engine ok ->', dst)
