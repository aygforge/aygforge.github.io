# Stage 3 (after patch_mayhem.py): ROAD TO GLORY hooks. Guarded by `w.pow` (exists only for mech 'glory') or by values that
# default to the previous behaviour, so Legacy / Mayhem / V4 battles replay exactly (frozen reference hashes).
import sys
p='engine.js'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    if n!=cnt: sys.exit('count %d != %d for: %s'%(n,cnt,old[:90]))
    s=s.replace(old,new)
rep("  if (A.mech === 'mayhem') mayInit(w, A);\n","  if (A.mech === 'mayhem' || A.mech === 'glory') mayInit(w, A);\n  if (A.mech === 'glory') powInit(w, A);\n")
rep("  for (const r of ROLES) { T.elimByRole[r] = 0; T.lossByRole[r] = 0; }\n  return T;","  for (const r of ROLES) { T.elimByRole[r] = 0; T.lossByRole[r] = 0; }\n  if (arc && bp.formation_budget) { T.hpMul *= bp.formation_budget.hp; T.dmgMul *= bp.formation_budget.dmg; } // equal power budget across formations\n  return T;")
rep("  if (w.may && tgt.ironT > 0 && dmg > 0 && !opts.true) { const red = dmg * (1 - MAY.IRON_DR);","  if (w.may && tgt.ironT > 0 && dmg > 0 && !opts.true) { const red = dmg * (1 - (tgt.ironDR || MAY.IRON_DR));")
rep("  if (w.may && att && !opts.chain && opts.kb >= MAY.CHAIN_KB) mayChainQueue","  if (w.may && att && !opts.chain && opts.kb >= (w.pow && w.pow.s[att.side].dominoT > 0 ? 20 : MAY.CHAIN_KB)) mayChainQueue")
rep("pow: ARC.TIER_POW[st.tier || 1] || 1, cd: 4 + arc.rng.next() * 3, uses: 0 });","pow: (ARC.TIER_POW[st.tier || 1] || 1) * (st.powMul || 1), cd: 4 + arc.rng.next() * 3, uses: 0, spot: 0 });")
rep("    a.star = true; a.pow = sp.pow; a.starName = u.star.name;","    a.star = true; a.pow = sp.pow * (sp.spot || 1); sp.spot = 0; a.starName = u.star.name;")
rep("  const shot = { id: fb.nextShot++, side: u.side, shooter: u.id, tick: w.tick, x: +u.x.toFixed(1), y: +u.y.toFixed(1), onTarget, result: 'in-flight', gk: -1 };\n",
    "  const shot = { id: fb.nextShot++, side: u.side, shooter: u.id, tick: w.tick, x: +u.x.toFixed(1), y: +u.y.toFixed(1), onTarget, result: 'in-flight', gk: -1 };\n  if (w.pow && w.pow.s[u.side].ricoT > 0) { shot.bounce = 2; shot.walls = true; shot.power = 'ricochet_fever'; } // Ricochet Fever window\n")
rep("* cfg.hold * (T.tendency === 'formation' ? 0.8 : 1);","* cfg.hold * (T.tendency === 'formation' ? 0.8 : 1) * (w.pow && w.pow.s[u.side].tacT > 0 ? 0.55 : 1);")
rep("cfg.support + 1, 110,","cfg.support + 1 + (w.pow && w.pow.s[o.side].tacT > 0 ? 2 : 0), 110,")
rep("+ (w.may && e.ironT > 0 ? 0.15 : 0);\n      if (r.next() < ch) { if (w.may && e.ironT > 0) w.may.s[e.side].st.ironStops++; fb.stats.intercepts[e.side]++;",
    "+ (w.may && e.ironT > 0 ? 0.15 : 0) - (w.pow && w.pow.s[from.side].tacT > 0 ? 0.15 : 0);\n      if (r.next() < ch) { if (w.may && e.ironT > 0) w.may.s[e.side].st.ironStops++; fb.stats.intercepts[e.side]++;")
rep("if (sh.pk) p *= 0.92;","if (sh.pk) p *= (sh.gkMul || 0.92); const mir = w.pow && g.miracleT > 0; if (mir) p = Math.min(0.93, p + 0.3 * (g.miracleK || 1));")
rep("        sh.result = 'save'; sh.gk = g.id;","        sh.result = 'save'; sh.gk = g.id; if (mir) { g.miracleT = 0; ev(w, EV.MIRACLE, g.side, g.id, sh.id, g.x, g.y); }")
rep("      const shooter = w.units[sh.shooter];\n      if (inMouth) {","      const shooter = w.units[sh.shooter];\n      if (!inMouth && w.pow && powBounce(w, b, sh, onPost ? 'post' : 'wide')) return; // Pinball / Ricochet\n      if (inMouth) {")
rep("    if (b.flight > 1.4 || b.x < ARENA.x0 - 8 || b.x > ARENA.x1 + 8) {","    if ((b.x < ARENA.x0 - 8 || b.x > ARENA.x1 + 8) && w.pow && powBounce(w, b, sh, 'wall')) return;\n    if (b.flight > 1.4 || b.x < ARENA.x0 - 8 || b.x > ARENA.x1 + 8) {")
rep("const f = Math.exp(-2.2 * dt);","const f = Math.exp((w.pow && b.wildT > 0 ? -0.5 : -2.2) * dt); if (w.pow && b.wildT > 0) powWild(w, b);")
rep("  b.state = 'CONTROLLED'; b.owner = u.id; b.side = u.side; b.lastSide = u.side;","  if (w.pow) b.wildT = 0;\n  b.state = 'CONTROLLED'; b.owner = u.id; b.side = u.side; b.lastSide = u.side;")
ext=open('../tools/engine_glory_ext.js').read()
rep("\nconst API = { DT,",ext+"\nconst API = { DT,")
rep("MAY, mayCommand, maySummary };","MAY, mayCommand, maySummary, PW, powSummary };")
open(p,'w').write(s); print('glory ok')
