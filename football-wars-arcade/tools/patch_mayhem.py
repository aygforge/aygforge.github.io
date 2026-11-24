# Stage 2 (after patch_engine.py): ARCADE MAYHEM hooks. Every hook is guarded by `w.may`, which only exists when
# createWorld got opts.arcade.mech === 'mayhem'. Without it the V4 / Arcade-Reborn code paths are unchanged.
import sys
p='engine.js'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    if n!=cnt: sys.exit('count %d != %d for: %s'%(n,cnt,old[:90]))
    s=s.replace(old,new)
rep("  if (w.arc) arcOnEvent(w, type, a, b);\n","  if (w.may) mayOnEvent(w, type, a, b); else if (w.arc) arcOnEvent(w, type, a, b);\n")
rep("  if (w.arc) arcTick(w);\n","  if (w.may) mayTick(w); else if (w.arc) arcTick(w);\n")
rep("      arc.stars.push(u.id);\n    }\n  }\n","      arc.stars.push(u.id);\n    }\n  }\n  if (A.mech === 'mayhem') mayInit(w, A);\n")
rep("  if (u.hasteT > 0) s *= u.hasteMul;\n  if (u.slowT > 0) s *= u.slowMul;","  if (w.may) s *= mayHaste(w, u); else if (u.hasteT > 0) s *= u.hasteMul;\n  if (u.slowT > 0) s *= u.slowMul;")
rep("  if (u.atkSpdT > 0) r *= u.atkSpdMul;\n  if (u.sta < 20) r *= 0.88;","  if (w.may) r *= mayAtk(w, u); else if (u.atkSpdT > 0) r *= u.atkSpdMul;\n  if (u.sta < 20) r *= 0.88;")
rep("  else if (!opts.true) dmg *= 1 - unitArmor(w, tgt);\n  if (dmg <= 0) return 0;",
    "  else if (!opts.true) dmg *= 1 - unitArmor(w, tgt);\n  if (w.may && tgt.ironT > 0 && dmg > 0 && !opts.true) { const red = dmg * (1 - MAY.IRON_DR); w.may.s[tgt.side].st.ironReduced += red; dmg -= red; }\n  if (dmg <= 0) return 0;")
rep("    const k = opts.kb * AT.knock / w.teams[tgt.side].knock;\n    tgt.kbx += dx / d * k; tgt.kby += dy / d * k;\n  }",
    "    const k = opts.kb * AT.knock / w.teams[tgt.side].knock * (w.may && tgt.ironT > 0 ? MAY.IRON_KB : 1);\n    tgt.kbx += dx / d * k; tgt.kby += dy / d * k;\n  }\n  if (w.may && att && !opts.chain && opts.kb >= MAY.CHAIN_KB) mayChainQueue(w, att, tgt, dmg, opts.kb);")
rep("  if (u.recover > 0) { u.recover -= DT; u.state = 'recover'; return; }\n","  if (u.recover > 0) { u.recover -= DT; u.state = 'recover'; return; }\n  if (w.may && u.rushT > 0 && mayRush(w, u)) return; // Team Rush: real run toward the commanded zone\n")
rep("  u.retarget -= DT;\n","  u.retarget -= w.may && w.may.frenzy ? DT * 1.6 : DT;\n")
rep("  if (w.fb) { const md = w.fb.mode[u.id]; if (md) { const v = fbSteer(w, u, md); if (v) { mx = v[0]; my = v[1]; } } } // Fusion: ball-related runs\n",
    "  if (w.fb) { const md = w.fb.mode[u.id]; if (md) { const v = fbSteer(w, u, md); if (v) { mx = v[0]; my = v[1]; } } } // Fusion: ball-related runs\n  if (w.may && u.ironT > 0) { const ix = u.ironX - u.x, iy = u.ironY - u.y, idd = Math.sqrt(ix * ix + iy * iy); if (idd > MAY.IRON_STAY) { mx = ix / idd; my = iy / idd; } else { mx *= 0.3; my *= 0.3; } } // Iron Defense: hold the zone\n")
rep("          else { e.cd = Math.min(e.cd, 0.1); ev(w, EV.INTERCEPT,","          else { if (w.may && e.ironT > 0) w.may.s[e.side].st.ironStops++; e.cd = Math.min(e.cd, 0.1); ev(w, EV.INTERCEPT,")
rep("- (TO.at.technique - 70) / 500;\n      if (r.next() < ch) { e.act = 'kick'; e.actT = 0.2; fbGain(w, e, 1); return; }",
    "- (TO.at.technique - 70) / 500 + (w.may && e.ironT > 0 ? 0.12 : 0);\n      if (r.next() < ch) { if (w.may && e.ironT > 0) { w.may.s[e.side].st.ironStops++; ev(w, EV.IRON_STOP, e.side, e.id, 1, e.x, e.y); } e.act = 'kick'; e.actT = 0.2; fbGain(w, e, 1); return; }")
rep("(w.teams[e.side].at.pressing - 70) / 400;\n      if (r.next() < ch) { fb.stats.intercepts[e.side]++;",
    "(w.teams[e.side].at.pressing - 70) / 400 + (w.may && e.ironT > 0 ? 0.15 : 0);\n      if (r.next() < ch) { if (w.may && e.ironT > 0) w.may.s[e.side].st.ironStops++; fb.stats.intercepts[e.side]++;")
rep("    const sh = b.shot; b.flight += dt; b.x += b.vx * dt; b.y += b.vy * dt;\n","    const sh = b.shot; b.flight += dt; b.x += b.vx * dt; b.y += b.vy * dt;\n    if (w.may && sh.pk && mayKickPath(w, b, sh)) return; // Power Kick path: blocks + limited collisions\n")
rep("if (!sh.onTarget) p *= 0.5;","if (!sh.onTarget) p *= 0.5; if (sh.pk) p *= 0.92;")
rep("  if (w.fb) fbTick(w);\n","  if (w.fb) fbTick(w);\n  if (w.may) mayChainResolve(w);\n")
rep("  if (!w.hunt && (bt >= D.hunt || total <= 16))","  if (!w.hunt && ((bt >= D.hunt && !w.may) || total <= 16))")
rep("  if (!w.sudden && bt >= D.zone) {","  if (!w.may && !w.sudden && bt >= D.zone) { // Mayhem: no shrinking zone")
rep("  if (!w.sudden && bt >= D.storm) {","  if (!w.may && !w.sudden && bt >= D.storm) { // Mayhem: no storm damage")
rep("    if (w.battleT >= MAX_BATTLE) {\n","    if (w.battleT >= MAX_BATTLE && w.may) { mayTimeUp(w); return; } // Mayhem: decided on survivors, nobody is K.O.'d\n    if (w.battleT >= MAX_BATTLE) {\n")
rep("  w.zone.x0 = 110; w.zone.x1 = 250; w.zone.y0 = MIDY - 70; w.zone.y1 = MIDY + 70;","  if (!w.may) { w.zone.x0 = 110; w.zone.x1 = 250; w.zone.y0 = MIDY - 70; w.zone.y1 = MIDY + 70; } // Mayhem keeps the full pitch")
ext=open('../tools/engine_mayhem_ext.js').read()+"""
function mayTimeUp(w) {
  const a = w.teams[0].alive, b = w.teams[1].alive; let win, why;
  if (a !== b) { win = a > b ? 0 : 1; why = 'survivors'; }
  else {
    const hp = s => w.teams[s].aliveList.reduce((m, u) => m + u.hp, 0), ha = hp(0), hb = hp(1);
    if (Math.abs(ha - hb) > 1e-6) { win = ha > hb ? 0 : 1; why = 'health'; }
    else if (w.fb && w.fb.goals[0] !== w.fb.goals[1]) { win = w.fb.goals[0] > w.fb.goals[1] ? 0 : 1; why = 'goals'; }
    else { win = w.seed & 1; why = 'seed'; }
  }
  w.tiebreak = why; addRule(w, 'TIME_UP_' + why.toUpperCase()); finish(w, win);
}
"""
rep("\nconst API = { DT,",ext+"\nconst API = { DT,")
rep("ARC, arcInput, arcSummary };","ARC, arcInput, arcSummary, MAY, mayCommand, maySummary };")
open(p,'w').write(s); print('mayhem ok')
