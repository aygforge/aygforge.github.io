// ======================= ROAD TO GLORY — AUTO POWER MAYHEM (only when opts.arcade.mech === 'glory') =======================
// 24 automatic Powers per the loadout in the battle snapshot (2 Favorite + 2 Wild per team, same rules both sides).
// Every Power: own id, own condition, real effect on units / the real match ball, cooldown, event log, mastery scaling.
// Separate seeded RNG (w.pow.rng): camera / sound / particles never consume it. No Power guarantees a goal or a K.O.
const PW = {
  VERSION: 3,
  FIRST: [6, 9], NEXT: [8, 12], REUSE: 10, MAX_ACTIVE: 2, RETRY: 1,
  MASTERY: [1, 1, 1.05, 1.10],
  LIST: ['rocket_boots', 'pinball_strike', 'wing_stampede', 'golden_volley', 'berserker_attack', 'meteor_shot',
    'fortress', 'counter_shield', 'interception_net', 'iron_curtain', 'miracle_save', 'last_stand',
    'domino_impact', 'wild_ball', 'bowling_charge', 'thunder_tackle', 'turbo_madness', 'ricochet_fever',
    'second_wind', 'captains_rally', 'medical_rush', 'adrenaline_wave', 'tactical_genius', 'star_spotlight'],
  REACTIVE: { miracle_save: true, last_stand: true }
};
EV.POWER = 90; EV.POWER_BOUNCE = 91; EV.MIRACLE = 92; EV.POWER_END = 93;
const PDUR = { rocket_boots: 2, pinball_strike: 2, wing_stampede: 2, golden_volley: 1.6, berserker_attack: 2.6, meteor_shot: 1.6, fortress: 3, counter_shield: 3,
  interception_net: 2.6, iron_curtain: 2.8, miracle_save: 1.5, last_stand: 3, domino_impact: 4, wild_ball: 2.6, bowling_charge: 1.4, thunder_tackle: 0.8,
  turbo_madness: 3.5, ricochet_fever: 5, second_wind: 3, captains_rally: 3, medical_rush: 1, adrenaline_wave: 3, tactical_genius: 4, star_spotlight: 6 };
function powInit(w, A) {
  const mk = (L) => ({ load: (L || []).filter(x => PW.LIST.indexOf(x.id) >= 0).slice(0, 4).map(x => ({ id: x.id, rank: x.rank || 1, fav: !!x.fav })),
    last: {}, next: 0, active: [], uses: {}, tries: 0, dominoT: 0, tacT: 0, ricoT: 0, log: [] });
  w.pfx = [];
  w.pow = { rng: new Rng((w.seed ^ hashStr('ROAD_TO_GLORY_POWERS|' + w.opts.teamA.id + '|' + w.opts.teamB.id)) >>> 0), s: [mk(A.powers && A.powers[0]), mk(A.powers && A.powers[1])], turboT: 0, used: [] };
  for (let s = 0; s < 2; s++) w.pow.s[s].next = PW.FIRST[0] + w.pow.rng.next() * (PW.FIRST[1] - PW.FIRST[0]);
}
// ---------- helpers ----------
function pAlive(w, s, f) { const L = []; for (const u of w.teams[s].aliveList) if (!f || f(u)) L.push(u); return L; }
function pNear(L, x, y, n) { return L.map(u => [(u.x - x) * (u.x - x) + (u.y - y) * (u.y - y), u]).sort((a, b) => a[0] - b[0] || a[1].id - b[1].id).slice(0, n).map(z => z[1]); }
function pFx(w, k, side, x, y, ids, dur) { if (!w.headless) w.pfx.push({ k, side, x, y, ids: ids || [], t0: w.t, dur: dur || 1.2 }); }
const ATTACKERS = u => u.role === 'striker' || u.role === 'winger' || u.role === 'playmaker' || u.role === 'captain';
const DEFENDERS = u => u.role === 'defender' || u.role === 'support' || u.role === 'captain';
function pGoalDist(s, u) { const gx = (GOAL.x0 + GOAL.x1) / 2, gy = fbGoalY(s); return Math.hypot(gx - u.x, gy - u.y); }
function pOwnGoalY(s) { return fbGoalY(1 - s); }
function pShoot(w, u, opt) { // real Football Fusion shot through the Mayhem kick path (GK, blocks, posts, wide, GOAL all apply)
  const gx = (GOAL.x0 + GOAL.x1) / 2, gy = fbGoalY(u.side), r = w.pow.rng;
  const tx = gx + (r.next() * 2 - 1) * (opt.spread || 14), rec = { speed: opt.speed };
  mayKick(w, u, tx, gy - (u.side === 0 ? 4 : -4), rec);
  const sh = w.fb.ball.shot; if (!sh) return null;
  sh.power = opt.id; sh.bounce = opt.bounce || 0; sh.maxHits = opt.maxHits || MAY.PK_HITS; sh.kb = opt.kb || 0; sh.dmg = opt.dmg || 0; sh.lob = opt.lob || 0; sh.gkMul = opt.gkMul || 0.92;
  return sh;
}
function pRushTo(u, tx, ty, spd, hits, dmg, kb, t) { u.rushT = t; u.rushX = clamp(tx, ARENA.x0 + 3, ARENA.x1 - 3); u.rushY = clamp(ty, ARENA.y0 + 4, ARENA.y1 - 2); u.rushHits = 0; u.rushSpd = spd; u.rushMax = hits; u.rushDmg = dmg; u.rushKB = kb; u.act = ''; }
function pHold(u, x, y, t, dr, icpt) { u.ironT = t; u.ironX = clamp(x, ARENA.x0 + 3, ARENA.x1 - 3); u.ironY = clamp(y, ARENA.y0 + 4, ARENA.y1 - 2); u.ironDR = dr; if (icpt) u.interceptT = Math.max(u.interceptT, t); }
// ---------- the 24 Powers: cond(w, s) -> { score, ... } | null ; act(w, s, ctx, m) -> units/ball affected (0 = did not apply) ----------
const POW = {
  // ----- attack -----
  rocket_boots: { cat: 'attack', cond(w, s) { const b = w.fb.ball, c = mayCarrier(w, s); if (!c && b.state !== 'LOOSE') return null; return { score: c ? 2.5 : 1.2 }; },
    act(w, s, x, m) { const b = w.fb.ball, dir = s === 0 ? -1 : 1, L = pNear(pAlive(w, s, u => ATTACKERS(u) && u.stun <= 0), b.x, b.y, 6 + (w.pow.rng.next() < 0.5 ? 1 : 0) + (w.pow.rng.next() < 0.5 ? 1 : 0));
      for (const u of L) { pRushTo(u, u.x + (b.x - u.x) * 0.3, u.y + dir * 75, 1.55 * m, 1, 5, 30, 2 * m); u.hasteT = 2 * m; u.hasteMul = Math.max(u.hasteMul, 1 + 0.3 * m); }
      pFx(w, 'rocket_boots', s, b.x, b.y, L.map(u => u.id), 2); return L.length; } },
  pinball_strike: { cat: 'attack', cond(w, s) { const c = mayCarrier(w, s); return c && pGoalDist(s, c) < 235 ? { score: 3, c } : null; },
    act(w, s, x, m) { const sh = pShoot(w, x.c, { id: 'pinball_strike', speed: 280, spread: 18, bounce: 2 + (w.pow.rng.next() < 0.5 ? 1 : 0), gkMul: 0.95 }); if (!sh) return 0; sh.bmul = m; pFx(w, 'pinball_strike', s, x.c.x, x.c.y, [x.c.id], 2); return 1; } },
  wing_stampede: { cat: 'attack', cond(w, s) { const c = mayCarrier(w, s), b = w.fb.ball; if (!c && b.state !== 'LOOSE') return null; return pAlive(w, s, u => u.role === 'winger' || u.role === 'striker').length >= 4 ? { score: c ? 2.4 : 1 } : null; },
    act(w, s, x, m) { const dir = s === 0 ? -1 : 1, b = w.fb.ball; const W = pAlive(w, s, u => (u.role === 'winger' || u.role === 'striker') && u.stun <= 0).sort((p, q) => (p.role === 'winger' ? 0 : 1) - (q.role === 'winger' ? 0 : 1) || Math.abs(p.y - b.y) - Math.abs(q.y - b.y) || p.id - q.id).slice(0, 8);
      W.forEach((u, i) => { const lane = (u.x < 180) ? ARENA.x0 + 26 + (i % 2) * 14 : ARENA.x1 - 26 - (i % 2) * 14; pRushTo(u, lane, u.y + dir * 120, 1.5 * m, 2, 6, 34, 2 * m); });
      pFx(w, 'wing_stampede', s, b.x, b.y, W.map(u => u.id), 2); return W.length; } },
  golden_volley: { cat: 'attack', cond(w, s) { const c = mayCarrier(w, s); return c && c.role !== 'goalkeeper' && c.role !== 'defender' && pGoalDist(s, c) < 240 ? { score: 3.2, c } : null; },
    act(w, s, x, m) { const sh = pShoot(w, x.c, { id: 'golden_volley', speed: 330, spread: 9 / m, lob: 0.45, gkMul: 0.86 }); if (!sh) return 0; pFx(w, 'golden_volley', s, x.c.x, x.c.y, [x.c.id], 1.6); return 1; } },
  berserker_attack: { cat: 'attack', cond(w, s) { const b = w.fb.ball; const e = query(w, b.x, b.y, 60, 1 - s).length; return e >= 3 ? { score: 1.5 + e * 0.15 } : null; },
    act(w, s, x, m) { const b = w.fb.ball, L = pNear(pAlive(w, s, u => ATTACKERS(u) && u.stun <= 0), b.x, b.y, 6);
      for (const u of L) { u.dmgBuffT = 2.6; u.dmgBuffMul = Math.max(u.dmgBuffT > 0 ? u.dmgBuffMul : 1, 1 + 0.32 * m); u.atkSpdT = 2.6; u.atkSpdMul = Math.max(u.atkSpdMul, 1 + 0.28 * m); u.retarget = 0; u.cd = Math.min(u.cd, 0.1); u.critT = 2.6; u.critAdd = Math.max(u.critAdd, 0.08 * m); }
      pFx(w, 'berserker_attack', s, b.x, b.y, L.map(u => u.id), 2.6); return L.length; } },
  meteor_shot: { cat: 'attack', cond(w, s) { const c = mayCarrier(w, s); return c && pGoalDist(s, c) < 300 ? { score: 3.5, c } : null; },
    act(w, s, x, m) { const sh = pShoot(w, x.c, { id: 'meteor_shot', speed: 380, spread: 16, maxHits: 3, kb: 40 * m, dmg: 12, gkMul: 0.9 }); if (!sh) return 0; w.shake = Math.max(w.shake, w.headless ? 0 : 2); pFx(w, 'meteor_shot', s, x.c.x, x.c.y, [x.c.id], 1.6); return 1; } },
  // ----- defense -----
  fortress: { cat: 'defense', cond(w, s) { const o = mayCarrier(w, 1 - s), b = w.fb.ball, oy = pOwnGoalY(s); const threat = (o && Math.abs(o.y - oy) < 260) || (b.state === 'SHOOTING' && b.shot && b.shot.side !== s); return threat ? { score: 2.6 } : null; },
    act(w, s, x, m) { const gx = (GOAL.x0 + GOAL.x1) / 2, gy = pOwnGoalY(s), dir = s === 0 ? -1 : 1; const L = pNear(pAlive(w, s, u => u.role === 'defender' || u.role === 'support'), gx, gy, 8).filter(u => Math.abs(u.y - gy) < 230);
      L.forEach((u, i) => { const a = (i / Math.max(1, L.length - 1) - 0.5) * 2.2; pHold(u, gx + Math.sin(a) * 62, gy + dir * (22 + Math.cos(a) * 30), 3, 1 - 0.15 * m, true); });
      pFx(w, 'fortress', s, gx, gy + dir * 40, L.map(u => u.id), 3); return L.length; } },
  counter_shield: { cat: 'defense', cond(w, s) { let n = 0; for (const u of w.teams[s].aliveList) if (query(w, u.x, u.y, 20, 1 - s).length >= 3) { n++; if (n >= 3) break; } return n >= 3 ? { score: 2 } : null; },
    act(w, s, x, m) { const P = pAlive(w, s).map(u => [query(w, u.x, u.y, 20, 1 - s).length, u]).filter(z => z[0] >= 2).sort((a, b) => b[0] - a[0] || a[1].id - b[1].id).slice(0, 8).map(z => z[1]);
      for (const u of P) { u.kbImmuneT = Math.max(u.kbImmuneT, 3 * m); u.shieldT = 3; u.shield = Math.max(u.shieldT > 0 ? u.shield : 0, 0.1 * m); }
      if (P.length) pFx(w, 'counter_shield', s, P[0].x, P[0].y, P.map(u => u.id), 3); return P.length; } },
  interception_net: { cat: 'defense', cond(w, s) { const o = mayCarrier(w, 1 - s); return o ? { score: 2.3, o } : null; },
    act(w, s, x, m) { const o = x.o, mates = pNear(pAlive(w, 1 - s, u => u !== o && u.role !== 'goalkeeper'), o.x, o.y, 4); if (!mates.length) return 0;
      const spots = mates.map(t => [(o.x + t.x) / 2, (o.y + t.y) / 2]); const used = new Set(), L = [];
      for (let k = 0; k < 8; k++) { const sp = spots[k % spots.length]; const c = pNear(pAlive(w, s, u => u.role !== 'goalkeeper' && !used.has(u.id) && u.stun <= 0), sp[0], sp[1], 1)[0]; if (!c) break; used.add(c.id); L.push(c); pHold(c, sp[0] + (k >> 2) * 6, sp[1], 2.6, 1, true); }
      pFx(w, 'interception_net', s, o.x, o.y, L.map(u => u.id), 2.6); return L.length; } },
  iron_curtain: { cat: 'defense', cond(w, s) { const o = mayCarrier(w, 1 - s); if (!o || Math.abs(o.y - pOwnGoalY(s)) > 240) return null; return { score: 2.8, o }; },
    act(w, s, x, m) { const L = pNear(pAlive(w, s, DEFENDERS), x.o.x, x.o.y, 10).filter(u => Math.hypot(u.x - x.o.x, u.y - x.o.y) < 170);
      const gy = pOwnGoalY(s); L.forEach((u, i) => pHold(u, x.o.x + (i % 5 - 2) * 14, x.o.y + (gy - x.o.y) * 0.3 + Math.floor(i / 5) * 10 * (s === 0 ? 1 : -1), 2.8, 1 - 0.38 * m, true));
      pFx(w, 'iron_curtain', s, x.o.x, x.o.y, L.map(u => u.id), 2.8); return L.length; } },
  miracle_save: { cat: 'defense', reactive: true, cond(w, s) { const b = w.fb.ball; if (b.state !== 'SHOOTING' || !b.shot || b.shot.side === s) return null; const g = pNear(pAlive(w, s, u => u.role === 'goalkeeper' && u.stun <= 0), b.x, b.y, 1)[0]; return g && Math.hypot(g.x - b.x, g.y - b.y) < 70 ? { score: 9, g } : null; },
    act(w, s, x, m) { x.g.miracleT = 1.2; x.g.miracleK = m; x.g.face = w.fb.ball.x < x.g.x ? -1 : 1; pFx(w, 'miracle_save', s, x.g.x, x.g.y, [x.g.id], 1.2); return 1; } },
  last_stand: { cat: 'defense', reactive: true, cond(w, s) { return w.teams[s].alive <= 25 && w.teams[s].alive >= 2 ? { score: 9 } : null; },
    act(w, s, x, m) { const L0 = pAlive(w, s); const cx = L0.reduce((a, u) => a + u.x, 0) / L0.length, cy = L0.reduce((a, u) => a + u.y, 0) / L0.length; const L = pNear(L0, cx, cy, 8);
      for (const u of L) { pHold(u, u.x, u.y, 3, 1 - 0.4 * m, false); u.invulnT = Math.max(u.invulnT, 0.5); u.regenT = 3; u.regen = Math.max(u.regen, 0.012 * m); }
      pFx(w, 'last_stand', s, cx, cy, L.map(u => u.id), 3); return L.length; } },
  // ----- chaos -----
  domino_impact: { cat: 'chaos', cond(w, s) { const b = w.fb.ball, c = densestEnemy(w, s, b.x, b.y, 140); return c && c.n >= 6 ? { score: 1.6 + c.n * 0.1 } : null; },
    act(w, s, x, m) { w.pow.s[s].dominoT = 4 * m; const b = w.fb.ball; pFx(w, 'domino_impact', s, b.x, b.y, [], 4); return 1; } },
  wild_ball: { cat: 'chaos', cond(w, s) { const b = w.fb.ball; if (b.state !== 'LOOSE' && b.state !== 'CONTROLLED') return null; const o = mayCarrier(w, 1 - s); return { score: o ? 2.2 : b.state === 'LOOSE' ? 1.4 : 0.6 }; },
    act(w, s, x, m) { const b = w.fb.ball, r = w.pow.rng; if (b.state === 'CONTROLLED') fbLoose(w, 5, 0, 0);
      const a = r.next() * 6.283; b.vx = Math.cos(a) * 210; b.vy = Math.sin(a) * 210; b.wildT = 2.6 * m; b.wildK = 0; pFx(w, 'wild_ball', s, b.x, b.y, [], 2.6); return 1; } },
  bowling_charge: { cat: 'chaos', cond(w, s) { const ow = pAlive(w, s, u => (u.role === 'defender' || u.role === 'captain') && u.stun <= 0); if (!ow.length) return null; const b = w.fb.ball, c = densestEnemy(w, s, b.x, b.y, 170);
      if (!c || c.n < 6) return null; const u = pNear(ow, c.x, c.y, 1)[0]; return u && Math.hypot(u.x - c.x, u.y - c.y) < 170 ? { score: 1.8 + c.n * 0.1, u, c } : null; },
    act(w, s, x, m) { const dx = x.c.x - x.u.x, dy = x.c.y - x.u.y, d = Math.hypot(dx, dy) || 1; pRushTo(x.u, x.c.x + dx / d * 30, x.c.y + dy / d * 30, 2.4, 5, 10, 48 * m, 1.4); x.u.kbImmuneT = Math.max(x.u.kbImmuneT, 1.4); x.u.hasteT = 1.4; x.u.hasteMul = Math.max(x.u.hasteMul, 1.2);
      pFx(w, 'bowling_charge', s, x.u.x, x.u.y, [x.u.id], 1.4); return 1; } },
  thunder_tackle: { cat: 'chaos', cond(w, s) { let best = null, bn = 3; for (const u of w.teams[s].aliveList) if ((u.role === 'defender' || u.role === 'captain') && u.stun <= 0) { const n = query(w, u.x, u.y, 24, 1 - s).length; if (n > bn) { bn = n; best = u; } } return best ? { score: 1.6 + bn * 0.2, u: best } : null; },
    act(w, s, x, m) { const u = x.u, hit = query(w, u.x, u.y, 26, 1 - s).slice(0, 7); if (!hit.length) return 0; u.act = 'kick'; u.actT = 0.3;
      for (const e of hit) applyDamage(w, u, e, 16 * m, { kb: 38, stun: 0.45, noAssist: true, chain: true, fx: u.x, fy: u.y });
      if (!w.headless) w.shake = Math.max(w.shake, 2.2); pFx(w, 'thunder_tackle', s, u.x, u.y, hit.map(e => e.id), 0.8); return hit.length; } },
  turbo_madness: { cat: 'chaos', cond(w, s) { if (w.pow.turboT > 0 || w.battleT < 12) return null; return { score: w.teams[s].alive >= w.teams[1 - s].alive ? 1.5 : 0.8 }; },
    act(w, s, x, m) { w.pow.turboT = 3.5 * m; pFx(w, 'turbo_madness', s, LW / 2, MIDY, [], 3.5); return 1; } },
  ricochet_fever: { cat: 'chaos', cond(w, s) { const c = mayCarrier(w, s); return c && pGoalDist(s, c) < 270 ? { score: 3.3, c } : null; },
    act(w, s, x, m) { w.pow.s[s].ricoT = 5 * m; const sh = pShoot(w, x.c, { id: 'ricochet_fever', speed: 300, spread: 22, bounce: 4, gkMul: 0.95 }); if (!sh) return 0; sh.walls = true; pFx(w, 'ricochet_fever', s, x.c.x, x.c.y, [x.c.id], 5); return 1; } },
  // ----- support -----
  second_wind: { cat: 'support', cond(w, s) { const L = pAlive(w, s, u => !u.star && u.sta < 45); return L.length >= 4 ? { score: 1.4 + L.length * 0.05 } : null; },
    act(w, s, x, m) { const L = pAlive(w, s, u => !u.star && u.sta < 45).sort((a, b) => a.sta - b.sta || a.id - b.id).slice(0, 6);
      for (const u of L) { u.sta = 100; u.regenT = 3; u.regen = Math.max(u.regen, 0.012 * m); u.hasteT = Math.max(u.hasteT, 2); u.hasteMul = Math.max(u.hasteMul, 1.08 * m); }
      if (L.length) pFx(w, 'second_wind', s, L[0].x, L[0].y, L.map(u => u.id), 3); return L.length; } },
  captains_rally: { cat: 'support', cond(w, s) { for (const c of w.teams[s].aliveList) if (c.role === 'captain' && query(w, c.x, c.y, 70, s).length >= 6) return { score: 1.9, c }; return null; },
    act(w, s, x, m) { const L = query(w, x.c.x, x.c.y, 70, s).slice(0, 14);
      for (const u of L) { u.hasteT = 3; u.hasteMul = Math.max(u.hasteMul, 1 + 0.18 * m); u.dmgBuffT = 3; u.dmgBuffMul = Math.max(u.dmgBuffT > 0 ? u.dmgBuffMul : 1, 1 + 0.14 * m); u.atkSpdT = 3; u.atkSpdMul = Math.max(u.atkSpdMul, 1 + 0.12 * m); }
      pFx(w, 'captains_rally', s, x.c.x, x.c.y, L.map(u => u.id), 3); return L.length; } },
  medical_rush: { cat: 'support', cond(w, s) { const L = pAlive(w, s, u => !u.star && u.hp < u.maxHp * 0.5); return L.length >= 3 ? { score: 1.6 + L.length * 0.05 } : null; },
    act(w, s, x, m) { const L = pAlive(w, s, u => !u.star && u.hp < u.maxHp * 0.5).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id).slice(0, 3 + (w.pow.rng.next() < 0.5 ? 1 : 0) + (w.pow.rng.next() < 0.4 ? 1 : 0));
      for (const u of L) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.25 * m);
      if (L.length) pFx(w, 'medical_rush', s, L[0].x, L[0].y, L.map(u => u.id), 1.2); return L.length; } },
  adrenaline_wave: { cat: 'support', cond(w, s) { const b = w.fb.ball; return query(w, b.x, b.y, 80, s).length >= 5 ? { score: 1.7 } : null; },
    act(w, s, x, m) { const b = w.fb.ball, L = query(w, b.x, b.y, 80, s).slice(0, 14); for (const u of L) { u.atkSpdT = 3; u.atkSpdMul = Math.max(u.atkSpdMul, 1 + 0.3 * m); u.cd = Math.min(u.cd, 0.3); }
      pFx(w, 'adrenaline_wave', s, b.x, b.y, L.map(u => u.id), 3); return L.length; } },
  tactical_genius: { cat: 'support', cond(w, s) { const c = mayCarrier(w, s); return c ? { score: 2, c } : null; },
    act(w, s, x, m) { w.pow.s[s].tacT = 4 * m; const b = w.fb.ball; b.decide = Math.min(b.decide, 0.08); pFx(w, 'tactical_genius', s, b.x, b.y, [x.c.id], 4); return 1; } },
  star_spotlight: { cat: 'support', cond(w, s) { const T = w.teams[s]; if (!T.starSp) return null; for (const sp of T.starSp) { const u = w.units[sp.u]; if (u.alive && sp.uses < 2 && !sp.spot) return { score: 2.2, sp, u }; } return null; },
    act(w, s, x, m) { x.sp.spot = 1.25 * m; x.sp.cd = Math.min(x.sp.cd, 0.2); pFx(w, 'star_spotlight', s, x.u.x, x.u.y, [x.u.id], 6); return 1; } }
};
const PCAT_SCORE = { attack: 0, defense: 0, chaos: 0, support: 0 };
function powTry(w, s, reactiveOnly) {
  const P = w.pow.s[s], t = w.battleT;
  P.active = P.active.filter(a => a.until > t);
  if (P.active.length >= PW.MAX_ACTIVE) return false;
  const cand = [];
  for (const L of P.load) {
    const def = POW[L.id]; if (!def) continue;
    if (!!def.reactive !== !!reactiveOnly) continue;
    if (P.last[L.id] != null && t - P.last[L.id] < PW.REUSE) continue;
    if (def.reactive && L.id === 'last_stand' && P.uses[L.id]) continue; // one survival stand per match
    const ctx = def.cond(w, s); if (!ctx) continue;
    cand.push({ L, def, ctx });
  }
  if (!cand.length) return false;
  const r = w.pow.rng; let pool = cand;
  if (!reactiveOnly) {
    const hot = cand.filter(c => c.ctx.score >= 3); // a real scoring chance right now outranks the Favorite/Wild coin
    const F = cand.filter(c => c.L.fav), W = cand.filter(c => !c.L.fav);
    pool = hot.length ? hot : F.length && W.length ? (r.next() < 0.5 ? F : W) : F.length ? F : W;
  }
  pool.sort((a, b) => b.ctx.score - a.ctx.score || PW.LIST.indexOf(a.L.id) - PW.LIST.indexOf(b.L.id));
  const top = pool.filter(c => c.ctx.score >= pool[0].ctx.score - 0.3); const pick = top[r.int(top.length)];
  const m = PW.MASTERY[pick.L.rank] || 1;
  const n = pick.def.act(w, s, pick.ctx, m);
  if (!n) return false; // the Power could not really apply: nothing is consumed, no fake use
  P.last[pick.L.id] = t; P.uses[pick.L.id] = (P.uses[pick.L.id] || 0) + 1; P.active.push({ id: pick.L.id, until: t + (PDUR[pick.L.id] || 2) });
  const rec = { side: s, id: pick.L.id, tick: w.tick, t: +t.toFixed(2), n, fav: pick.L.fav, rank: pick.L.rank, cat: pick.def.cat };
  P.log.push(rec); w.pow.used.push(rec);
  ev(w, EV.POWER, s, PW.LIST.indexOf(pick.L.id), n, w.fb.ball.x, w.fb.ball.y);
  if (!w.headless) w.banners.push({ key: 'power:' + pick.L.id, side: s, t0: w.t, dur: 1.4, x: w.fb.ball.x, y: w.fb.ball.y });
  return true;
}
function powTick(w) {
  const G = w.pow;
  if (G.turboT > 0) G.turboT -= DT;
  for (let s = 0; s < 2; s++) {
    const P = G.s[s];
    if (P.dominoT > 0) P.dominoT -= DT; if (P.tacT > 0) P.tacT -= DT; if (P.ricoT > 0) P.ricoT -= DT;
    if (!P.load.length || w.sudden) continue;
    powTry(w, s, true); // reactive Powers (Miracle Save, Last Stand) answer real moments, same cooldown rules
    if (w.battleT >= P.next) {
      if (powTry(w, s, false)) P.next = w.battleT + PW.NEXT[0] + G.rng.next() * (PW.NEXT[1] - PW.NEXT[0]);
      else P.next = w.battleT + PW.RETRY;
    }
  }
  for (const u of w.units) if (u.alive && u.miracleT > 0) u.miracleT -= DT;
  if (!w.headless && w.pfx.length) w.pfx = w.pfx.filter(f => w.t - f.t0 < f.dur);
}
// ball bounces for Pinball Strike / Ricochet Fever (real ball, keeps flying as a shot that can still be saved / blocked / scored)
function powBounce(w, b, sh, why) {
  if (!(sh.bounce > 0)) return false;
  const r = w.pow.rng, gx = (GOAL.x0 + GOAL.x1) / 2, gy = fbGoalY(sh.side);
  if (why === 'wall' && !sh.walls && sh.power !== 'pinball_strike') return false;
  sh.bounce--;
  const tx = gx + (r.next() * 2 - 1) * 22, ty = gy, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1, sp = Math.max(200, Math.hypot(b.vx, b.vy) * 0.85);
  if (why === 'post' || why === 'wide') b.y = gy + (sh.side === 0 ? 6 : -6);
  b.x = clamp(b.x, ARENA.x0 + 4, ARENA.x1 - 4);
  const ny = (gy - b.y), nd = Math.hypot(tx - b.x, ny) || 1;
  b.vx = (tx - b.x) / nd * sp; b.vy = ny / nd * sp; b.flight = 0; b.checked.length = 0; b.state = 'SHOOTING'; b.shot = sh;
  const tG = b.vy !== 0 ? (gy - b.y) / b.vy : -1, ax = b.x + b.vx * tG; sh.onTarget = tG > 0 && ax > GOAL.x0 + GOAL.post && ax < GOAL.x1 - GOAL.post;
  ev(w, EV.POWER_BOUNCE, sh.side, sh.id, sh.bounce, b.x, b.y);
  if (!w.headless) { part(w, 'ring', b.x, b.y, 90, 0, 0.3, sh.power === 'ricochet_fever' ? '#ff4fd8' : '#ffe14d', 2); w.shake = Math.max(w.shake, 0.8); }
  void dx; void dy; void d;
  return true;
}
// Wild Ball: low-friction, deflecting loose ball (both teams can win it)
function powWild(w, b) {
  b.wildT -= DT; b.wildK = (b.wildK || 0) + DT;
  if (b.wildK >= 0.35) { b.wildK = 0; const r = w.pow.rng, sp = Math.max(150, Math.hypot(b.vx, b.vy)), a = Math.atan2(b.vy, b.vx) + (r.next() - 0.5) * 2.2; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; if (!w.headless) part(w, 'ring', b.x, b.y, 60, 0, 0.25, '#7dff6a', 1); }
}
function powSummary(w) {
  if (!w.pow) return null;
  const S = w.pow.s.map(P => ({ load: P.load.map(L => ({ id: L.id, fav: L.fav, rank: L.rank })), uses: Object.assign({}, P.uses), total: P.log.length }));
  return { version: PW.VERSION, sides: S, used: w.pow.used.slice() };
}
PW.POW = POW; PW.PDUR = PDUR;
