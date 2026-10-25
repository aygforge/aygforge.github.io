/* =========================================================================
   CombatEngine + CombatAI — deterministic fixed-step 3v3 simulation.
   Rendering never touches this; the renderer only reads unit state + events.
   ========================================================================= */

const ARENA_RX = 10.4, ARENA_RY = 5.9;
const COMBAT_DT = 0.1;
const COMBAT_MAX_T = 120;
const DMG_SCALE = 0.86;

const STANCE = {
  balanced: { out: 1, inn: 1, en: 1, atk: 1 },
  aggr: { out: 1.15, inn: 1.10, en: 1.25, atk: 0.92 },
  def: { out: 0.88, inn: 0.90, en: 0.80, atk: 1.08 }
};

const CombatEngine = {
  // ------------------------------------------------------------ setup
  makeUnit(g, side, slot, pressure) {
    const C = CLASSES[g.cls];
    const it = Equipment.bonuses(g);
    const cond = num(g.cond, 100), mor = num(g.mor, 60);
    const condF = 0.72 + 0.28 * Math.min(1, cond / 80);
    const morF = clamp(1 + (mor - 60) / 40 * 0.04, 0.95, 1.05);
    const clutchF = 1 + (num(g.clu, 50) - 50) / 50 * 0.06 * pressure;
    const str = num(g.str, 30), end = num(g.end, 30), agi = num(g.agi, 30), tec = num(g.tec, 30), dis = num(g.dis, 30);
    const enMax = 70 + end * 0.8;
    const sgn = side === 0 ? -1 : 1;
    const pos = [[4.2, 0], [5.8, -2.5], [5.8, 2.5]][slot];
    const u = {
      i: side * 3 + slot, side, slot, gid: g.id, temp: !!g.temp, name: g.n, cls: g.cls, look: g.look,
      x: sgn * pos[0], y: (side === 0 ? 1 : -1) * pos[1], px: 0, py: 0, face: -sgn,
      hpMax: 120 + end * 1.2 + C.hp + it.hp, hp: 0, enMax, en: enMax * (0.55 + 0.45 * cond / 100),
      alive: true, elimT: -1, lastHit: -1, tgt: -1, retgt: 0,
      atkCd: 0.4 + slot * 0.25, spCd: 3 + slot * 0.8, act: null,
      st: { slow: 0, slowF: 1, root: 0, stag: 0, guard: 0, pur: 0, sprint: 0, evb: 0, kb: 0, kbx: 0, kby: 0, ret: 0, retCd: 0 },
      perf: condF * morF * clutchF,
      dmg: (C.dmg + 2.6 + str * 0.055 + it.dmg) * (1 + (tec - 50) * 0.001),
      armor: C.armor + end * 0.05 + it.armor,
      block: C.block > 0 ? C.block + it.block + tec * 0.0012 : it.block,
      eva: C.eva + 0.035 + agi * 0.0012 + it.eva,
      accMod: it.acc,
      crit: 0.035 + agi * 0.0006 + C.crit + it.crit,
      speed: (1.75 + agi * 0.021) * C.spd * (0.85 + 0.15 * condF) * (1 + it.spd),
      atkInt: C.atk * (1.1 - agi * 0.002),
      range: C.range, tec, agi, dis, eff: 0.8 + tec / 250 + it.special,
      comp: 0.55 + dis / 220,
      rec: { dmg: 0, tk: 0, ko: 0, blk: 0, hit: 0, miss: 0, sp: 0, ev: 0, att: 0 },
      walk: 0
    };
    u.hp = u.hpMax; u.px = u.x; u.py = u.y;
    return u;
  },
  /** setup = { seed, pressure, headless, sides:[{cid,name,tactic,glads:[3],auto,colors}, ...] } */
  create(setup) {
    const m = {
      t: 0, tick: 0, over: false, result: null, seed: setup.seed >>> 0,
      rng: new RNG(setup.seed >>> 0), headless: !!setup.headless,
      pressure: num(setup.pressure, 0.3), events: [], units: [], teams: []
    };
    setup.sides.forEach((sd, side) => {
      const tac = TACTICS[sd.tactic] ? sd.tactic : 'balanced';
      m.teams.push({
        side, cid: sd.cid, name: sd.name, tactic: tac, auto: sd.auto !== false,
        stance: tac === 'aggressive' ? 'aggr' : tac === 'defensive' ? 'def' : 'balanced',
        guardMode: tac === 'guard', focusTac: tac === 'focus', focus: -1, cmdCd: 0, coachT: 1,
        colors: sd.colors || ['#888', '#444']
      });
      sd.glads.slice(0, 3).forEach((g, slot) => m.units.push(this.makeUnit(g, side, slot, m.pressure)));
    });
    for (const t of m.teams) if (t.focusTac) CombatAI.autoFocus(m, t);
    return m;
  },

  // ------------------------------------------------------------ helpers
  enemiesOf(m, u) { return u.side === 0 ? [3, 4, 5] : [0, 1, 2]; },
  alliesOf(m, u) { return u.side === 0 ? [0, 1, 2] : [3, 4, 5]; },
  dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); },
  stanceOf(m, u) { return STANCE[m.teams[u.side].stance]; },
  modS(base, comp) { return 1 + (base - 1) * comp; },
  ev(m, e) { if (!m.headless) m.events.push(e); },

  // ------------------------------------------------------------ main loop
  step(m) {
    if (m.over) return;
    m.t = Math.round((m.t + COMBAT_DT) * 1000) / 1000;
    m.tick++;
    for (const t of m.teams) {
      if (t.cmdCd > 0) t.cmdCd = Math.max(0, t.cmdCd - COMBAT_DT);
      if (t.auto) CombatAI.coach(m, t);
      if (t.focus >= 0 && !m.units[t.focus].alive) { t.focus = -1; if (t.focusTac) CombatAI.autoFocus(m, t); }
    }
    const order = (m.tick & 1) ? [0, 3, 1, 4, 2, 5] : [3, 0, 4, 1, 5, 2];
    for (const i of order) { const u = m.units[i]; if (u) this.updateUnit(m, u); }
    this.separate(m);
    this.checkEnd(m);
  },
  run(m) { let guard = 0; while (!m.over && guard++ < 2000) this.step(m); if (!m.over) this.finish(m, 'time'); return m.result; },

  updateUnit(m, u) {
    u.px = u.x; u.py = u.y;
    if (!u.alive) return;
    const s = u.st;
    for (const k of ['slow', 'root', 'stag', 'guard', 'pur', 'sprint', 'evb', 'ret', 'retCd']) if (s[k] > 0) s[k] = Math.max(0, s[k] - COMBAT_DT);
    if (s.slow <= 0) s.slowF = 1;
    const stance = this.stanceOf(m, u);
    u.atkCd -= COMBAT_DT * (s.pur > 0 ? 1.18 : 1);
    u.spCd -= COMBAT_DT;
    const regen = 1.7 * (m.teams[u.side].stance === 'def' ? 1.2 : m.teams[u.side].stance === 'aggr' ? 0.85 : 1);
    u.en = Math.min(u.enMax, u.en + regen * COMBAT_DT);
    // knockback displacement
    if (s.kb > 0) {
      const k = Math.min(COMBAT_DT, s.kb);
      u.x += s.kbx * k; u.y += s.kby * k; s.kb -= k;
      this.bound(u);
      return;
    }
    if (s.stag > 0) return;
    if (u.act) { this.processAct(m, u); return; }

    // target selection
    u.retgt -= COMBAT_DT;
    let T = u.tgt >= 0 ? m.units[u.tgt] : null;
    if (!T || !T.alive || u.retgt <= 0) {
      u.tgt = CombatAI.chooseTarget(m, u);
      u.retgt = (u.cls === 'thraex' ? 0.4 : 0.7) + m.rng.next() * 0.4;
      T = u.tgt >= 0 ? m.units[u.tgt] : null;
    }
    if (!T) return;
    const d = this.dist(u, T);
    if (Math.abs(T.x - u.x) > 0.05) u.face = T.x > u.x ? 1 : -1;

    // special technique
    const C = CLASSES[u.cls];
    if (u.spCd <= 0 && u.en >= C.sp.en * stance.en && s.root <= 0 && CombatAI.wantSpecial(m, u, T, d)) {
      this.startSpecial(m, u, T, d);
      return;
    }
    // movement
    const mv = CombatAI.desiredMove(m, u, T, d);
    if (mv) this.moveToward(m, u, mv.x, mv.y, mv.sp);
    // basic attack
    const d2 = this.dist(u, T);
    if (d2 <= u.range + 0.12 && u.atkCd <= 0) this.startAttack(m, u, T, stance);
  },

  moveToward(m, u, tx, ty, spMul) {
    const s = u.st;
    if (s.root > 0) return;
    let dx = tx - u.x, dy = ty - u.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.05) return;
    let sp = u.speed * spMul * s.slowF;
    if (s.guard > 0) sp *= 0.55;
    if (s.sprint > 0) sp *= 2.0;
    if (u.en < u.enMax * 0.2) sp *= 0.85;
    const step = Math.min(d, sp * COMBAT_DT);
    u.x += dx / d * step; u.y += dy / d * step;
    u.walk += step;
    u.en = Math.max(0, u.en - step * 0.18 * this.stanceOf(m, u).en);
    this.bound(u);
  },
  bound(u) {
    const ex = u.x / ARENA_RX, ey = u.y / ARENA_RY;
    const e = ex * ex + ey * ey;
    if (e > 0.94) { const k = Math.sqrt(0.94 / e); u.x *= k; u.y *= k; }
  },
  separate(m) {
    const U = m.units;
    for (let a = 0; a < U.length; a++) {
      const A = U[a]; if (!A.alive) continue;
      for (let b = a + 1; b < U.length; b++) {
        const B = U[b]; if (!B.alive) continue;
        let dx = B.x - A.x, dy = B.y - A.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        const min = 0.9;
        if (d < min) {
          if (d < 1e-4) { dx = (a % 2 ? 1 : -1) * 0.01; dy = 0.01; d = 0.014; }
          const push = (min - d);
          const nx = dx / d, ny = dy / d;
          const aFix = A.st.root > 0 || (A.act && A.act.k === 'sp'), bFix = B.st.root > 0 || (B.act && B.act.k === 'sp');
          const wa = aFix && !bFix ? 0 : bFix && !aFix ? 1 : 0.5;
          A.x -= nx * push * wa; A.y -= ny * push * wa;
          B.x += nx * push * (1 - wa); B.y += ny * push * (1 - wa);
          this.bound(A); this.bound(B);
        }
      }
    }
  },

  // ------------------------------------------------------------ actions
  startAttack(m, u, T, stance) {
    const comp = u.comp;
    let int = u.atkInt * this.modS(stance.atk, comp) + (m.rng.next() - 0.5) * 0.16;
    if (u.en < u.enMax * 0.2) int *= 1.3;
    if (u.st.guard > 0) int *= 1.25;
    u.atkCd = int;
    u.en = Math.max(0, u.en - 3.5 * this.modS(stance.en, comp));
    // discipline errors: badly-timed swing / stumble
    if (m.rng.next() < (100 - u.dis) * 0.0006) {
      u.act = { k: 'stumble', t: 0, dur: 0.6, hits: [] };
      this.ev(m, { type: 'stumble', u: u.i });
      return;
    }
    u.act = { k: 'atk', t: 0, dur: 0.55, tg: T.i, reach: u.range + 0.4, hits: [{ t: 0.28, m: 1, acc: 0, crit: 0 }], v: m.tick % 3 };
    this.ev(m, { type: 'swing', u: u.i, tg: T.i });
  },
  startSpecial(m, u, T, d) {
    const C = CLASSES[u.cls];
    u.spCd = C.sp.cd * (1.05 - (u.eff - 0.8) * 0.25);
    u.en = Math.max(0, u.en - C.sp.en * this.stanceOf(m, u).en);
    u.rec.sp++;
    const id = C.sp.id;
    let a;
    if (id === 'shieldwall') {
      u.st.guard = 3.5 * u.eff;
      a = { k: 'sp', sp: id, t: 0, dur: 0.35, hits: [] };
    } else if (id === 'net') {
      a = { k: 'sp', sp: id, t: 0, dur: 0.75, tg: T.i, reach: 5.6, hits: [{ t: 0.45, net: true }] };
    } else if (id === 'agile') {
      a = { k: 'sp', sp: id, t: 0, dur: 0.75, tg: T.i, reach: u.range + 0.5, dash: 0.24, back: 0.42, hits: [{ t: 0.3, m: 1.45, acc: 0.15, crit: 0.1 }] };
    } else if (id === 'pursuit') {
      u.st.pur = 4.5 * u.eff; u.st.sprint = 2.0;
      a = { k: 'sp', sp: id, t: 0, dur: 0.3, hits: [] };
    } else if (id === 'combo') {
      a = { k: 'sp', sp: id, t: 0, dur: 0.82, tg: T.i, reach: u.range + 0.35, hits: [{ t: 0.22, m: 0.95, acc: 0.02, crit: 0 }, { t: 0.5, m: 0.95, acc: 0.02, crit: 0.08 }] };
    } else if (id === 'lunge') {
      a = { k: 'sp', sp: id, t: 0, dur: 0.7, tg: T.i, reach: 3.1, hits: [{ t: 0.33, m: 1.35, acc: 0.1, crit: 0, kb: 1.6 }] };
    }
    u.act = a;
    this.ev(m, { type: 'special', u: u.i, sp: id, tg: T.i });
  },
  processAct(m, u) {
    const a = u.act;
    a.t = Math.round((a.t + COMBAT_DT) * 1000) / 1000;
    const T = a.tg != null ? m.units[a.tg] : null;
    // special movement
    if (a.sp === 'agile' && T) {
      if (a.t <= a.dash + 0.001 && T.alive) {
        const d = this.dist(u, T);
        if (d > 0.85) { const k = Math.min(d - 0.8, 9 * COMBAT_DT); u.x += (T.x - u.x) / d * k; u.y += (T.y - u.y) / d * k; this.bound(u); }
      } else if (a.t > a.back && T.alive) {
        const d = Math.max(0.01, this.dist(u, T));
        const k = 4.8 * COMBAT_DT;
        u.x -= (T.x - u.x) / d * k; u.y -= (T.y - u.y) / d * k; this.bound(u);
      }
    }
    for (const h of a.hits) {
      if (!h.done && a.t >= h.t - 1e-6) {
        h.done = true;
        if (T && T.alive) {
          if (h.net) this.resolveNet(m, u, T);
          else this.resolveHit(m, u, T, h, a.reach);
        }
      }
    }
    if (a.sp === 'agile' && a.t >= a.dur - 1e-6) u.st.evb = 1.5;
    if (a.t >= a.dur - 1e-6) u.act = null;
  },
  guardAura(m, T) {
    // allied Murmillo holding Kalkan Siperliği protects nearby teammates
    for (const i of this.alliesOf(m, T)) {
      const A = m.units[i];
      if (A !== T && A.alive && A.st.guard > 0 && this.dist(A, T) < 2.5) return 0.8;
    }
    return 1;
  },
  resolveHit(m, u, T, h, reach) {
    const rng = m.rng;
    const d = this.dist(u, T);
    u.rec.att++;
    if (d > reach) { u.rec.miss++; this.ev(m, { type: 'whiff', u: u.i, tg: T.i }); return; }
    const so = this.modS(this.stanceOf(m, u).out, u.comp);
    const si = this.modS(this.stanceOf(m, T).inn, T.comp);
    let acc = 0.8 + (u.tec - T.tec) * 0.0025 + u.accMod + h.acc + (u.st.pur > 0 ? 0.12 : 0);
    acc = clamp(acc, 0.45, 0.97);
    if (rng.next() >= acc) { u.rec.miss++; this.ev(m, { type: 'miss', u: u.i, tg: T.i }); return; }
    let eva = T.eva + (T.st.evb > 0 ? 0.2 : 0);
    if (T.st.root > 0 || T.st.stag > 0) eva *= 0.25;
    if (T.act && T.act.k === 'atk') eva *= 0.6;
    eva = clamp(eva, 0, 0.35);
    if (rng.next() < eva) { T.rec.ev++; this.ev(m, { type: 'evade', u: u.i, tg: T.i }); return; }
    const crit = rng.next() < u.crit + h.crit;
    let dmg = u.dmg * h.m * (crit ? 1.7 : 1) * rng.range(0.8, 1.2) * so * u.perf;
    if (u.st.pur > 0) dmg *= 1.22;
    if (u.en < u.enMax * 0.2) dmg *= 0.85;
    // shield block
    let blockCh = T.block * (T.st.guard > 0 ? 1.5 : 1) * (m.teams[T.side].stance === 'def' ? 1.08 : 1);
    if (T.st.root > 0 || T.st.stag > 0) blockCh = 0;
    if ((u.x - T.x) * T.face < 0) blockCh *= 0.3; // attacked from behind
    const blocked = rng.next() < blockCh;
    if (blocked) { dmg *= 0.42; T.rec.blk++; T.en = Math.max(0, T.en - 2); }
    const mit = clamp(T.armor / (T.armor + 45), 0, 0.55);
    dmg *= (1 - mit);
    dmg *= si * (T.st.guard > 0 ? 0.5 : 1) * this.guardAura(m, T);
    dmg = Math.max(1, dmg * DMG_SCALE);
    dmg = Math.round(dmg * 10) / 10;
    T.hp -= dmg; u.rec.dmg += dmg; u.rec.hit++; T.rec.tk += dmg; T.lastHit = u.i;
    if (h.kb && T.hp > 0) {
      const dd = Math.max(0.01, d);
      const kbd = h.kb * (T.st.guard > 0 ? 0.5 : 1);
      T.st.kb = 0.25; T.st.kbx = (T.x - u.x) / dd * kbd / 0.25; T.st.kby = (T.y - u.y) / dd * kbd / 0.25;
      T.st.stag = 0.6 + 0.25; T.act = null;
    }
    this.ev(m, { type: 'hit', u: u.i, tg: T.i, dmg, crit, blocked, sp: u.act && u.act.sp || null });
    if (T.hp <= 0) this.eliminate(m, T, u);
  },
  resolveNet(m, u, T) {
    const d = this.dist(u, T);
    u.rec.att++;
    let p = clamp(0.62 + (u.tec - T.agi) * 0.006 + (u.eff - 1), 0.3, 0.92);
    if (d > 5.6) p = 0;
    if (T.st.evb > 0) p *= 0.6;
    const ok = m.rng.next() < p;
    if (ok) {
      T.st.root = 1.3 * u.eff; T.st.slow = 3.3; T.st.slowF = 0.5;
      if (T.act && T.act.k !== 'sp') T.act = null;
      u.rec.hit++;
    } else u.rec.miss++;
    this.ev(m, { type: 'net', u: u.i, tg: T.i, ok });
  },
  eliminate(m, T, by) {
    T.hp = 0; T.alive = false; T.elimT = m.t; T.act = null;
    if (by) by.rec.ko++;
    for (const t of m.teams) if (t.focus === T.i) t.focus = -1;
    this.ev(m, { type: 'elim', u: T.i, by: by ? by.i : -1 });
  },

  // ------------------------------------------------------------ result
  checkEnd(m) {
    const a0 = m.units.filter(u => u.side === 0 && u.alive).length;
    const a1 = m.units.filter(u => u.side === 1 && u.alive).length;
    if (a0 === 0 || a1 === 0) this.finish(m, 'ko', a0 === 0 ? 1 : 0);
    else if (m.t >= COMBAT_MAX_T - 1e-6) this.finish(m, 'time');
  },
  finish(m, reason, winner) {
    if (m.over) return;
    const side = s => m.units.filter(u => u.side === s);
    const surv = [0, 1].map(s => side(s).filter(u => u.alive).length);
    const hpp = [0, 1].map(s => { const U = side(s); return U.reduce((a, u) => a + Math.max(0, u.hp), 0) / Math.max(1, U.reduce((a, u) => a + u.hpMax, 0)); });
    const dmg = [0, 1].map(s => side(s).reduce((a, u) => a + u.rec.dmg, 0));
    const ko = [0, 1].map(s => side(s).reduce((a, u) => a + u.rec.ko, 0));
    let w = winner, why = reason;
    if (reason !== 'ko') {
      if (surv[0] !== surv[1]) { w = surv[0] > surv[1] ? 0 : 1; why = 'surv'; }
      else if (Math.abs(hpp[0] - hpp[1]) > 1e-6) { w = hpp[0] > hpp[1] ? 0 : 1; why = 'hp'; }
      else if (Math.abs(dmg[0] - dmg[1]) > 1e-6) { w = dmg[0] > dmg[1] ? 0 : 1; why = 'dmg'; }
      else { w = (m.seed & 1); why = 'coin'; } // neutral, pre-determined by match seed
    }
    m.over = true;
    m.result = {
      w, why, t: m.t, surv, hpp: hpp.map(v => Math.round(v * 1000) / 1000), dmg: dmg.map(v => Math.round(v)), ko,
      units: m.units.map(u => ({ gid: u.gid, temp: u.temp, side: u.side, alive: u.alive, hpf: Math.max(0, u.hp) / u.hpMax, enf: u.en / u.enMax, rec: u.rec }))
    };
    this.ev(m, { type: 'end', w });
  }
};

// ---------------------------------------------------------------- CombatAI
const CombatAI = {
  chooseTarget(m, u) {
    const team = m.teams[u.side];
    let best = -1, bs = -1e9;
    const noiseAmp = (100 - u.dis) * 0.05;
    for (const i of CombatEngine.enemiesOf(m, u)) {
      const e = m.units[i];
      if (!e.alive) continue;
      const d = CombatEngine.dist(u, e);
      let s = -d * 0.9 + (1 - e.hp / e.hpMax) * 3.0;
      if (i === u.tgt) s += u.cls === 'secutor' ? 3 : u.cls === 'thraex' ? 0.6 : 1.5;
      if (team.focus === i) s += 4 * u.comp;
      switch (u.cls) {
        case 'thraex': s += (20 - e.armor) * 0.08 + (e.block < 0.1 ? 0.8 : 0); break;
        case 'dimachaerus': if (e.cls === 'murmillo') s -= 2; if (e.st.guard > 0) s -= 3; s += (15 - e.armor) * 0.06; break;
        case 'retiarius': if (e.cls === 'thraex' || e.cls === 'dimachaerus' || e.cls === 'secutor') s += 1; break;
        case 'secutor': if (e.cls === 'retiarius' || e.cls === 'thraex' || e.cls === 'dimachaerus') s += 1.2; break;
        case 'murmillo': {
          // protect: prefer enemies currently attacking a weakened ally
          if (e.tgt >= 0) { const A = m.units[e.tgt]; if (A && A.side === u.side && A !== u && A.hp / A.hpMax < 0.6) s += 2.5; }
          s += e.dmg * 0.04; break;
        }
        case 'hoplomachus': s -= Math.abs(d - 1.8) * 0.5; break;
      }
      s += (m.rng.next() - 0.5) * noiseAmp;
      if (s > bs) { bs = s; best = i; }
    }
    return best;
  },
  wantSpecial(m, u, T, d) {
    const id = CLASSES[u.cls].sp.id;
    const hpF = u.hp / u.hpMax;
    const rng = m.rng;
    switch (id) {
      case 'shieldwall': {
        const guardTeam = m.teams[u.side].guardMode;
        let threats = 0;
        for (const i of CombatEngine.enemiesOf(m, u)) { const e = m.units[i]; if (e.alive && CombatEngine.dist(u, e) < 2.4) threats++; }
        if (threats >= 2) return true;
        if (hpF < (guardTeam ? 0.85 : 0.7) && threats >= 1) return true;
        for (const i of CombatEngine.alliesOf(m, u)) {
          const A = m.units[i];
          if (A === u || !A.alive || A.hp / A.hpMax > (guardTeam ? 0.7 : 0.55) || CombatEngine.dist(u, A) > 2.4) continue;
          for (const j of CombatEngine.enemiesOf(m, u)) { const e = m.units[j]; if (e.alive && CombatEngine.dist(e, A) < 2.4) return true; }
        }
        return false;
      }
      case 'net':
        if (d < 1.0 || d > 5.0 || T.st.root > 0 || T.st.slow > 0.5) return false;
        return (T.cls === 'thraex' || T.cls === 'dimachaerus' || T.cls === 'secutor' || T.hp / T.hpMax > 0.4) && rng.next() < 0.35;
      case 'agile': return (d > 0.9 && d < 3.4 && rng.next() < 0.45) || (d <= u.range + 0.1 && T.hp / T.hpMax < 0.5);
      case 'pursuit': return (d > 2.4 && d < 9) || ((T.cls === 'retiarius' || T.cls === 'hoplomachus' || T.cls === 'thraex') && d > 1.6 && rng.next() < 0.5);
      case 'combo': return d <= u.range + 0.1;
      case 'lunge': return d > 0.9 && d < 2.9 && rng.next() < 0.6;
    }
    return false;
  },
  desiredMove(m, u, T, d) {
    const team = m.teams[u.side];
    const dx = T.x - u.x, dy = T.y - u.y;
    const nd = Math.max(0.01, d);
    const nx = dx / nd, ny = dy / nd;
    const aggr = team.stance === 'aggr';
    const hpF = u.hp / u.hpMax;
    // retreat (defensive stance / guard order): weakened fighter backs off towards a healthier ally
    if (u.st.ret > 0 || ((team.stance === 'def' || team.guardMode) && hpF < 0.3 && u.st.retCd <= 0 && d < 2.5 && m.rng.next() < u.comp * 0.25)) {
      if (u.st.ret <= 0) { u.st.ret = 2.5; u.st.retCd = 7; }
      let best = null, bh = -1;
      for (const i of CombatEngine.alliesOf(m, u)) { const A = m.units[i]; if (A !== u && A.alive && A.hp / A.hpMax > bh) { bh = A.hp / A.hpMax; best = A; } }
      if (best && bh > hpF) return { x: best.x - nx * 1.2, y: best.y - ny * 1.2, sp: 1 };
      u.st.ret = 0;
    }
    // Murmillo guard behaviour (always tends to shield allies, strongly in Koruma Düzeni)
    if (u.cls === 'murmillo' || (team.guardMode && u.cls === 'secutor')) {
      let prot = null, worst = 2;
      for (const i of CombatEngine.alliesOf(m, u)) {
        const A = m.units[i];
        if (A === u || !A.alive) continue;
        const fr = A.hp / A.hpMax + (CLASSES[A.cls].tank ? 0.5 : 0);
        if (fr < worst) { worst = fr; prot = A; }
      }
      const threshold = team.guardMode ? 0.95 : 0.55;
      if (prot && worst < threshold) {
        let thr = null, td = 1e9;
        for (const i of CombatEngine.enemiesOf(m, u)) { const e = m.units[i]; if (e.alive) { const dd = CombatEngine.dist(e, prot); if (dd < td) { td = dd; thr = e; } } }
        if (thr && td < 3.5) {
          u.tgt = thr.i;
          const ddx = thr.x - prot.x, ddy = thr.y - prot.y, dl = Math.max(0.01, Math.sqrt(ddx * ddx + ddy * ddy));
          return { x: prot.x + ddx / dl * Math.min(1.1, dl * 0.6), y: prot.y + ddy / dl * Math.min(1.1, dl * 0.6), sp: 1.05 };
        }
      }
    }
    // cohesion in Koruma Düzeni: fragile fighters stay near the tank
    if (team.guardMode && !CLASSES[u.cls].tank) {
      for (const i of CombatEngine.alliesOf(m, u)) {
        const A = m.units[i];
        if (A.alive && A !== u && CLASSES[A.cls].tank && CombatEngine.dist(u, A) > 4 && d > u.range) return { x: lerp(T.x, A.x, 0.5), y: lerp(T.y, A.y, 0.5), sp: 1 };
      }
    }
    const ai = CLASSES[u.cls].ai;
    if (ai === 'kite' || ai === 'spacing') {
      const pref = ai === 'kite' ? 1.95 : 1.7;
      const tooClose = ai === 'kite' ? 1.35 : 1.1;
      if (d < tooClose && u.st.root <= 0) return { x: u.x - nx * 1.5, y: u.y - ny * 1.5 + (u.slot - 1) * 0.3, sp: 0.75 };
      if (d > pref + 0.25) return { x: T.x - nx * pref, y: T.y - ny * pref, sp: aggr ? 1.08 : 1 };
      return null;
    }
    const want = u.range * 0.8;
    if (d > want) {
      // approach from slightly different angles so attackers surround rather than stack
      const ang = [0, -0.7, 0.7][u.slot] + (ai === 'skirmish' && d > 2 ? 0.5 * (u.slot === 1 ? -1 : 1) : 0);
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const ax = nx * ca - ny * sa, ay = nx * sa + ny * ca;
      return { x: T.x - ax * want, y: T.y - ay * want, sp: aggr ? 1.08 : 1 };
    }
    return null;
  },
  autoFocus(m, team) {
    // pick the most fragile enemy (hp * armour weighting)
    let best = -1, bs = 1e9;
    for (const u of m.units) {
      if (u.side === team.side || !u.alive) continue;
      const s = u.hp * (1 + u.armor / 30) * (1 + u.block);
      if (s < bs) { bs = s; best = u.i; }
    }
    team.focus = best;
  },
  // assistant coach used for AI clubs (and for the player's team in simulated matches)
  coach(m, team) {
    team.coachT -= COMBAT_DT;
    if (team.coachT > 0) return;
    team.coachT = 1;
    if (team.cmdCd > 0) return;
    const mine = m.units.filter(u => u.side === team.side), theirs = m.units.filter(u => u.side !== team.side);
    const hp = U => U.reduce((a, u) => a + Math.max(0, u.hp), 0) / U.reduce((a, u) => a + u.hpMax, 0);
    const alive = U => U.filter(u => u.alive).length;
    const adv = (alive(mine) - alive(theirs)) * 0.25 + (hp(mine) - hp(theirs));
    const base = team.tactic === 'aggressive' ? 'aggr' : team.tactic === 'defensive' ? 'def' : 'balanced';
    let want = base;
    if (m.t > 25 && adv < -0.2) want = 'aggr';
    else if (m.t > 55 && adv > 0.35 && base !== 'aggr') want = 'def';
    else if (m.t > 85 && adv < -0.05) want = 'aggr';
    if (want !== team.stance) { team.stance = want; team.cmdCd = 9; return; }
    // focus finishing blows on a badly wounded enemy
    let tgt = -1;
    for (const e of theirs) if (e.alive && e.hp / e.hpMax < 0.28) tgt = e.i;
    if (tgt >= 0 && team.focus !== tgt && m.rng.next() < 0.5) { team.focus = tgt; team.cmdCd = 9; }
  },
  // player live commands. returns false while on cooldown
  command(m, side, cmd, target) {
    const team = m.teams[side];
    if (m.over || team.cmdCd > 0) return false;
    if (cmd === 'attack') team.stance = 'aggr';
    else if (cmd === 'defend') team.stance = 'def';
    else if (cmd === 'focus') { if (target == null || !m.units[target] || !m.units[target].alive || m.units[target].side === side) return false; team.focus = target; }
    team.cmdCd = 8;
    CombatEngine.ev(m, { type: 'cmd', side, cmd, tg: target });
    return true;
  }
};
