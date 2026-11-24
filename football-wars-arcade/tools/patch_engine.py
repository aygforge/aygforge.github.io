import sys,re
p='engine.js'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    if n!=cnt: sys.exit('count %d != %d for: %s'%(n,cnt,old[:80]))
    s=s.replace(old,new)
# header note
rep("(function (root) {\n'use strict';\n\nconst DT","(function (root) {\n'use strict';\n/* ARCADE REBORN: narrow, opt-in extensions (opts.arcade / opts.headless). With neither option set the\n * engine follows the exact V4 code path (regression-tested: identical hashes). */\n\nconst DT")
# deriveTeam power gap: arcade may widen cap
rep("function deriveTeam(team, cfg, side, oppPower, rng, dur) {","function deriveTeam(team, cfg, side, oppPower, rng, dur, arc) {")
rep("  const adv = cap * Math.tanh((bp.power_index - oppPower) / 24);",
    "  const adv = arc ? arc.advCap * Math.tanh((bp.power_index - oppPower) / arc.advScale) : cap * Math.tanh((bp.power_index - oppPower) / 24);")
rep("  w.teams[0] = deriveTeam(opts.teamA, opts.cfg, 0, pb, rng, dur);\n  w.teams[1] = deriveTeam(opts.teamB, opts.cfg, 1, pa, rng, dur);",
    "  w.headless = !!opts.headless;\n  w.teams[0] = deriveTeam(opts.teamA, opts.cfg, 0, pb, rng, dur, opts.arcade);\n  w.teams[1] = deriveTeam(opts.teamB, opts.cfg, 1, pa, rng, dur, opts.arcade);")
rep("  w.startTotal = w.units.length;","  if (opts.arcade) arcInit(w, opts.arcade);\n  w.startTotal = w.units.length;")
# fx skip when headless (fx RNG only; never affects battle state)
rep("function part(w, type, x, y, vx, vy, life, color, size, z, vz) {\n","function part(w, type, x, y, vx, vy, life, color, size, z, vz) {\n  if (w.headless) return;\n")
rep("function ftext(w, text, x, y, color, life, big) { ","function ftext(w, text, x, y, color, life, big) { if (w.headless) return; ")
rep("function banner(w, key, dur, color) { ","function banner(w, key, dur, color) { if (w.headless) return; ")
# event hook
rep("  w.evCount++;\n","  w.evCount++;\n  if (w.arc) arcOnEvent(w, type, a, b);\n")
# specials: star abilities + tier power
rep("""      if (act) { sp.cd = 10.5 + w.rng.next() * 3.5; sp.uses++; T.specialsUsed[sp.id] = (T.specialsUsed[sp.id] || 0) + 1; }
      else sp.cd = 0.6;
    }
  }""","""      if (act) { sp.cd = 10.5 + w.rng.next() * 3.5; sp.uses++; T.specialsUsed[sp.id] = (T.specialsUsed[sp.id] || 0) + 1; if (w.arc) w.arc.lastSp[s] = w.battleT; }
      else sp.cd = 0.6;
    }
    if (w.arc) arcStarSpecials(w, T, s);
  }""")
rep("""    if (!a.fired && a.t >= a.tele) { a.fired = true; fireSpecial(w, a); }""",
    """    if (!a.fired && a.t >= a.tele) { a.fired = true; if (!(a.star && !w.units[a.caster].alive)) fireSpecial(w, a); } // a K.O.'d star's ability fizzles""")
rep("""function fireSpecial(w, a) {
  const T = w.teams[a.side], c = w.units[a.caster], s = a.side;""","""function fireSpecial(w, a) {
  const T = w.teams[a.side], c = w.units[a.caster], s = a.side;
  const p = a.pow || 1, M = (base) => p === 1 ? base : 1 + (base - 1) * p; // star tier power (V4 team specials: p === 1, exact V4 numbers)""")
# scale numbers in fireSpecial
body_start=s.index("function fireSpecial(w, a) {"); body_end=s.index("function runSeq(w, a) {")
b=s[body_start:body_end]
reps=[
("applyDamage(w, c, e, 15, { kb: 14","applyDamage(w, c, e, 15 * p, { kb: 14"),
("u.hasteT = 4; u.hasteMul = 1.35; u.atkSpdT = 4; u.atkSpdMul = 1.25; }","u.hasteT = 4; u.hasteMul = M(1.35); u.atkSpdT = 4; u.atkSpdMul = M(1.25); }"),
("{ sp: 175, dmg: 17, aoe: 22","{ sp: 175, dmg: 17 * p, aoe: 22"),
("{ sp: 260, dmg: 20, pierce: 5","{ sp: 260, dmg: 20 * p, pierce: 5"),
("applyDamage(w, c, e, 14, { kb: 44","applyDamage(w, c, e, 14 * p, { kb: 44"),
("u.interceptT = 5;","u.interceptT = 5 * p;"),
("u.hasteMul = near ? 1.5 : 1.3; u.dmgBuffT = 3.5; u.dmgBuffMul = near ? 1.3 : 1.18; }","u.hasteMul = M(near ? 1.5 : 1.3); u.dmgBuffT = 3.5; u.dmgBuffMul = M(near ? 1.3 : 1.18); }"),
("u.cd = 0; u.dmgBuffT = 2.5; u.dmgBuffMul = 1.3;","u.cd = 0; u.dmgBuffT = 2.5; u.dmgBuffMul = M(1.3);"),
("u.shieldT = 5; u.shield = 0.3;","u.shieldT = 5; u.shield = 0.3 * p;"),
("u.hp + u.maxHp * 0.32); u.invulnT = 1.1;","u.hp + u.maxHp * 0.32 * p); u.invulnT = 1.1;"),
("u.regenT = 4; u.regen = 0.025; u.atkSpdT = 4; u.atkSpdMul = 1.15; }","u.regenT = 4; u.regen = 0.025 * p; u.atkSpdT = 4; u.atkSpdMul = M(1.15); }"),
("u.hasteT = 4; u.hasteMul = 1.45; u.critT = 4; u.critAdd = 0.15; u.atkSpdT = 4; u.atkSpdMul = 1.25; }","u.hasteT = 4; u.hasteMul = M(1.45); u.critT = 4; u.critAdd = 0.15 * p; u.atkSpdT = 4; u.atkSpdMul = M(1.25); }"),
("for (const u of T.aliveList) if (u.role === 'defender' || u.role === 'support' || u.role === 'captain') u.interceptT = 5 * p;","for (const u of T.aliveList) if ((u.role === 'defender' || u.role === 'support' || u.role === 'captain') && (!a.star || dist2(u, c) < 16900)) u.interceptT = 5 * p;"),
("for (const u of T.aliveList) { const near = dist2(u, c) < a.r * a.r;","for (const u of T.aliveList) { const near = dist2(u, c) < a.r * a.r; if (a.star && !near) continue;"),
("const runners = T.aliveList.filter(u => (u.role === 'striker' || u.role === 'winger') && u.stun <= 0).slice(0, 8);","const runners = T.aliveList.filter(u => (u.role === 'striker' || u.role === 'winger') && u.stun <= 0 && (!a.star || dist2(u, c) < 16900)).slice(0, a.star ? 6 : 8);"),
("for (const u of T.aliveList) if (u.role === 'winger') {","for (const u of T.aliveList) if (u.role === 'winger' && (!a.star || dist2(u, c) < 16900)) {"),
]
for o,n in reps:
    if b.count(o)!=1: sys.exit('fs count '+o)
    b=b.replace(o,n)
s=s[:body_start]+b+s[body_end:]
# star-cast flank_overload/counter_burst affect whole team in V4; for stars limit to radius (handled in arc via a.star flag)
# step hook
rep("  updateSpecials(w);\n  const U = w.units, n = U.length;","  updateSpecials(w);\n  if (w.arc) arcTick(w);\n  const U = w.units, n = U.length;")
# insert arcade module before API
arc=open('../tools/engine_arcade_ext.js').read()
rep("const API = { DT,",arc+"\nconst API = { DT,")
rep("totalDuration, clamp, GOAL, FB_STATE, fbSummary };","totalDuration, clamp, GOAL, FB_STATE, fbSummary, ARC, arcInput, arcSummary };")
open(p,'w').write(s)
print('ok')
