// ======================= ARCADE REBORN extensions (only when createWorld got opts.arcade) =======================
// Stars (real units with signature abilities), Momentum Strike (tick-based timed team support).
// Uses its own seeded RNG so the V4 battle RNG stream is untouched by arcade bookkeeping.
const ARC = {
  VERSION: 1,
  TIER_POW: [1, 1, 1.08, 1.16, 1.24],           // index = tier (I..IV)
  MOM_RATE: 7, MOM_EXTRA_CAP: 4, MOM_MAX_USES: 4, MOM_EFFECT: 2.5, MOM_UNITS: 12,
  PERIOD: 90,                                    // marker round trip in ticks (1.5 s)
  PERFECT: 0.06, GOOD: 0.2,                       // half-widths around the centre (12 % perfect zone)
  QMUL: { normal: 0.5, good: 1.0, perfect: 1.4 }, QIDX: { normal: 0, good: 1, perfect: 2 },
  STAR_MAX_USES: 2, STAR_TEAM_CAP: 8, STAR_GUARD: 3,
  AUTO_DELAY: 45
};
EV.MOMENTUM = 60; EV.MOM_READY = 61; EV.STAR_SPECIAL = 62;
function starMul(ovr) { const k = clamp((ovr - 44) / 55, 0, 1); return { hp: 1.35 + 0.95 * k, dmg: 1.3 + 0.85 * k }; }
function arcInit(w, A) {
  const arc = w.arc = {
    rng: new Rng((w.seed ^ hashStr('ARCADE_REBORN|' + w.opts.teamA.id + '|' + w.opts.teamB.id)) >>> 0),
    lastSp: [-9, -9], starUses: [0, 0], used: [],
    mom: [0, 1].map(s => ({ v: 0, uses: 0, ready: false, readyTick: -1, sec: -1, extra: 0, gained: 0 })),
    side: [(A.momentum && A.momentum[0]) || 'manual', (A.momentum && A.momentum[1]) || 'normal'],
    queue: (A.inputs || []).map(x => ({ tick: x.tick, q: x.q })).sort((a, b) => a.tick - b.tick), log: [], stars: []
  };
  const names = Object.keys(SPECIAL_NAMES);
  for (let s = 0; s < 2; s++) {
    const T = w.teams[s]; T.starSp = [];
    const list = (A.stars && A.stars[s]) || [];
    for (const st of list) {
      let u = null;
      for (const x of w.units) if (x.side === s && x.role === st.role && !x.star) { u = x; break; }
      if (!u) continue;
      const m = starMul(st.ovr || 50);
      u.star = { id: st.id, name: st.name, rarity: st.rarity, ovr: st.ovr, ability: st.ability, tier: st.tier || 1, uses: 0 };
      u.maxHp *= m.hp; u.hp = u.maxHp; u.dmg *= m.dmg; u.speed *= 1.06; u.armor += 0.03;
      if (names.indexOf(st.ability) >= 0) T.starSp.push({ u: u.id, id: st.ability, pow: ARC.TIER_POW[st.tier || 1] || 1, cd: 4 + arc.rng.next() * 3, uses: 0 });
      arc.stars.push(u.id);
    }
  }
}
function arcStarSpecials(w, T, s) {
  const A = w.arc;
  for (const sp of T.starSp) {
    const u = w.units[sp.u];
    if (!u.alive || sp.uses >= ARC.STAR_MAX_USES) continue;
    sp.cd -= DT; if (sp.cd > 0) continue;
    if (A.starUses[s] >= ARC.STAR_TEAM_CAP) continue;
    if (w.battleT - A.lastSp[s] < ARC.STAR_GUARD || u.stun > 0 || w.specials.some(a => a.side === s && !a.fired)) { sp.cd = 0.35; continue; }
    const a = startSpecial(w, T, sp.id, u);
    if (!a) { sp.cd = 0.8; continue; }
    a.star = true; a.pow = sp.pow; a.starName = u.star.name;
    if (!w.headless && w.banners.length) w.banners[w.banners.length - 1].star = u.star.name;
    sp.uses++; u.star.uses++; A.starUses[s]++; A.lastSp[s] = w.battleT; sp.cd = 12 + A.rng.next() * 6;
    T.specialsUsed[sp.id] = (T.specialsUsed[sp.id] || 0) + 1;
    ev(w, EV.STAR_SPECIAL, s, u.id, Object.keys(SPECIAL_NAMES).indexOf(sp.id), u.x, u.y);
  }
}
function arcAddMom(w, side, amt) {
  const m = w.arc.mom[side]; if (side < 0 || side > 1 || m.ready || m.uses >= ARC.MOM_MAX_USES || w.phase !== 'battle') return;
  const sec = Math.floor(w.battleT); if (sec !== m.sec) { m.sec = sec; m.extra = 0; }
  amt = Math.min(amt, ARC.MOM_EXTRA_CAP - m.extra); if (amt <= 0) return;
  m.extra += amt; m.gained += amt; m.v = Math.min(100, m.v + amt);
}
function arcOnEvent(w, type, a, b) {
  if (type === EV.PASS_COMPLETE) { if (a >= 0) arcAddMom(w, w.units[a].side, 1); }
  else if (type === EV.BALL_GAIN) { if ((b === 1 || b === 3) && a >= 0) arcAddMom(w, w.units[a].side, 2); }
  else if (type === EV.SAVE_GOAL) { if (a >= 0) arcAddMom(w, w.units[a].side, 5); }
  else if (type === EV.GOAL) arcAddMom(w, b, 10);
  else if (type === EV.KO) { if (a >= 0) arcAddMom(w, w.units[a].side, 1); }
}
function arcMarker(w, side) {
  const m = w.arc.mom[side]; if (!m.ready) return 0;
  const ph = ((w.tick - m.readyTick) % ARC.PERIOD) / ARC.PERIOD;
  return ph < 0.5 ? ph * 2 : 2 - ph * 2;
}
function arcQuality(w, side) {
  const d = Math.abs(arcMarker(w, side) - 0.5);
  return d <= ARC.PERFECT ? 'perfect' : d <= ARC.GOOD ? 'good' : 'normal';
}
function arcFire(w, side, q) {
  const A = w.arc, m = A.mom[side], k = ARC.QMUL[q];
  const fb = w.fb, b = fb ? fb.ball : { x: LW / 2, y: MIDY, state: 'LOOSE', side: -1 };
  let own = -1;
  if (b.state === 'CONTROLLED' && b.owner >= 0) own = w.units[b.owner].side;
  else if (b.state === 'PASSING' && b.from >= 0) own = w.units[b.from].side;
  else if (b.state === 'SHOOTING' && b.shot) own = b.shot.side;
  const mode = own === side ? 'attack' : own === 1 - side ? 'press' : 'position';
  const cand = [];
  for (const u of w.teams[side].aliveList) { if (u.role === 'goalkeeper') continue; const d = (u.x - b.x) * (u.x - b.x) + (u.y - b.y) * (u.y - b.y); cand.push([d, u]); }
  cand.sort((p, r) => p[0] - r[0] || p[1].id - r[1].id);
  const L = cand.slice(0, ARC.MOM_UNITS).map(x => x[1]), D = ARC.MOM_EFFECT;
  for (const u of L) {
    u.hasteT = Math.max(u.hasteT, D);
    if (mode === 'attack') {
      u.hasteMul = Math.max(u.hasteMul, 1 + 0.22 * k); u.dmgBuffMul = Math.max(u.dmgBuffT > 0 ? u.dmgBuffMul : 1, 1 + 0.3 * k); u.dmgBuffT = Math.max(u.dmgBuffT, D);
      u.critT = Math.max(u.critT, D); u.critAdd = Math.max(u.critAdd, 0.1 * k);
    } else if (mode === 'press') {
      u.hasteMul = Math.max(u.hasteMul, 1 + 0.32 * k); u.atkSpdMul = Math.max(u.atkSpdT > 0 ? u.atkSpdMul : 1, 1 + 0.25 * k); u.atkSpdT = Math.max(u.atkSpdT, D);
      u.interceptT = Math.max(u.interceptT, D);
    } else {
      u.hasteMul = Math.max(u.hasteMul, 1 + 0.28 * k); u.shield = Math.max(u.shieldT > 0 ? u.shield : 0, 0.12 * k); u.shieldT = Math.max(u.shieldT, D);
      u.retarget = 0; // re-read the situation around the ball immediately
    }
    if (!w.headless) part(w, 'ring', u.x, u.y - 4, 50, 0, 0.3, q === 'perfect' ? '#ffe066' : q === 'good' ? '#7dffcf' : '#bfe4ff', 1);
  }
  m.uses++; m.v = 0; m.ready = false; m.readyTick = -1;
  A.used.push({ side, tick: w.tick, t: +w.battleT.toFixed(2), q, mode, n: L.length });
  ev(w, EV.MOMENTUM, side, ARC.QIDX[q], L.length, b.x, b.y);
  if (!w.headless) {
    part(w, 'ring', b.x, b.y, 160, 0, 0.45, q === 'perfect' ? '#ffe066' : '#7dffcf', 3);
    ftext(w, q === 'perfect' ? 'PERFECT STRIKE!' : q === 'good' ? 'GOOD STRIKE!' : 'STRIKE!', b.x, b.y - 18, q === 'perfect' ? '#ffe066' : '#7dffcf', 0.9, true);
    w.shake = Math.max(w.shake, q === 'perfect' ? 1.8 : 1);
  }
}
function arcTick(w) {
  const A = w.arc;
  for (let s = 0; s < 2; s++) {
    const m = A.mom[s];
    if (!m.ready && m.uses < ARC.MOM_MAX_USES) {
      m.v = Math.min(100, m.v + ARC.MOM_RATE * DT);
      if (m.v >= 100) { m.v = 100; m.ready = true; m.readyTick = w.tick; ev(w, EV.MOM_READY, s, m.uses, 0); }
    }
    const mode = A.side[s];
    if (s === 0 && mode === 'manual') {
      while (A.queue.length && A.queue[0].tick <= w.tick) {
        const inp = A.queue.shift();
        if (!m.ready) continue;                     // a press while not ready does nothing (never logged)
        const q = inp.q === 'auto' ? 'normal' : arcQuality(w, s);
        A.log.push({ tick: w.tick, q: inp.q });
        arcFire(w, s, q);
      }
    } else if (m.ready && w.tick >= m.readyTick + ARC.AUTO_DELAY) {
      arcFire(w, s, mode === 'good' ? 'good' : mode === 'perfect' ? 'perfect' : 'normal');
    }
  }
}
// live input: applied on the next fixed tick (recorded in w.arc.log for deterministic replay / resume)
function arcInput(w, kind) { if (!w.arc) return false; w.arc.queue.push({ tick: w.tick + 1, q: kind === 'auto' ? 'auto' : 'tap' }); return w.arc.mom[0].ready; }
function arcSummary(w) {
  if (!w.arc) return null;
  const stars = w.arc.stars.map(id => { const u = w.units[id]; return { id: u.star.id, side: u.side, name: u.star.name, alive: u.alive, kills: u.kills, uses: u.star.uses }; });
  return { momentum: w.arc.used.slice(), inputs: w.arc.log.slice(), starUses: w.arc.starUses.slice(), stars, momGain: w.arc.mom.map(m => m.gained) };
}
ARC.marker = arcMarker; ARC.quality = arcQuality;
