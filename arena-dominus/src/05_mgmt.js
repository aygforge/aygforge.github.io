/* =========================================================================
   Management systems: Squad, ProgressionManager, EconomyManager, Reputation,
   Sponsors, Staff, Facilities, EquipmentManager, Scouting, News
   ========================================================================= */

const Squad = {
  readiness(g) { return g ? g.ovr * (0.7 + 0.3 * num(g.cond, 100) / 100) * (g.injury ? 0 : 1) : 0; },
  teamOvr(glads) { return glads.length ? glads.reduce((a, g) => a + num(g.ovr), 0) / glads.length : 0; },
  avgOvr(club) { return this.teamOvr(GameState.rosterGlads(club)); },
  top3(club) {
    const gl = GameState.rosterGlads(club).sort((a, b) => b.ovr - a.ovr).slice(0, 3);
    return this.teamOvr(gl);
  },
  healthyCount(club) { return GameState.rosterGlads(club).filter(g => !g.injury).length; },
  fixLineup(club) {
    club.lineup = club.lineup.filter((id, i, arr) => club.roster.includes(id) && arr.indexOf(id) === i).slice(0, 3);
    if (club.lineup.length < 3) {
      const rest = club.roster.filter(id => !club.lineup.includes(id))
        .sort((a, b) => this.readiness(S.glads[b]) - this.readiness(S.glads[a]));
      while (club.lineup.length < 3 && rest.length) club.lineup.push(rest.shift());
    }
  },
  // swap two roster entries in the player's arrangement. slots 0..2 are aces, 3..4 bench
  arrangement(club) {
    const ids = club.lineup.slice(0, 3);
    while (ids.length < 3) ids.push(null);
    const bench = club.roster.filter(id => !ids.includes(id));
    return ids.concat(bench);
  },
  setArrangement(club, arr) {
    const valid = arr.filter(id => id != null && club.roster.includes(id));
    club.lineup = arr.slice(0, 3).filter(id => id != null && club.roster.includes(id));
    // roster order mirrors arrangement for readability
    club.roster = valid.concat(club.roster.filter(id => !valid.includes(id)));
  }
};

// ---------------------------------------------------------------- progression
const Progression = {
  growthMult(club) { return club ? Math.min(1.8, FAC.trainMult[club.fac.train] * (1 + club.staff.coach.q / 100 * 0.3)) : 0.9; },
  ageFactor(g) {
    const a = g.age - g.pk;
    return a <= -8 ? 1.35 : a <= -4 ? 1.2 : a <= -1 ? 1.0 : a <= 1 ? 0.6 : a <= 3 ? 0.3 : 0.1;
  },
  afterMatch(g, u, won, oppOvr, isLeague) {
    const rec = u.rec;
    const add = st => { st.m++; if (won) st.w++; st.ko += rec.ko; st.dmg += Math.round(rec.dmg); st.tk += Math.round(rec.tk); if (u.alive) st.sv++; st.blk += rec.blk; };
    if (isLeague) add(g.ss);
    add(g.cs);
    g.xp = num(g.xp) + 8 + (won ? 5 : 0) + rec.ko * 4 + clamp((oppOvr - g.ovr) * 0.4, -4, 8) + (u.alive ? 2 : 0);
    g.cond = clamp(Math.round(g.cond - (11 + (1 - u.hpf) * 11 + (1 - u.enf) * 6) * (g.age > 32 ? 1.1 : 1)), 0, 100);
    g.mor = clamp(Math.round(g.mor + (won ? 4 : -3) + rec.ko), 0, 100);
    if (won) g.cha = r1(Math.min(99, g.cha + 0.1 + rec.ko * 0.06));
    g.pw = S.season * 100 + S.week;
    if (g.ovr > num(g.peak)) g.peak = g.ovr;
    // injury roll — not automatic on elimination, depends on proneness, condition and damage taken
    const club = S.clubs[g.club];
    const p = 0.024 * g.inj * (1 + (1 - u.hpf) * 1.5) * (g.cond < 45 ? 1.5 : 1) * (u.alive ? 1 : 1.35) * (1 - Staff.injReduce(club));
    if (R.next() < p) {
      const r = R.next();
      const l = r < 0.72 ? 1 : r < 0.95 ? 2 : 3;
      const w = l === 1 ? 1 : l === 2 ? R.int(2, 3) : R.int(4, 6);
      g.injury = { l, w };
      if (g.club === S.player) GameState.news(() => tx(`${cn(g)} ${['', 'hafif', 'orta', 'ağır'][l]} sakatlık geçirdi (${w} hafta).`, `${cn(g)} suffered a ${['', 'minor', 'moderate', 'serious'][l]} injury (${w} week${w > 1 ? 's' : ''}).`), { p: 1, k: 'inj' });
    }
  },
  convertXP(g, club) {
    if (!(g.xp > 0)) { g.xp = 0; return; }
    const potF = g.pot > g.ovr ? clamp((g.pot - g.ovr) / 8, 0.04, 1) : 0;
    const pts = g.xp * 0.068 * g.grow * this.growthMult(club) * this.ageFactor(g) * potF;
    g.xp = 0;
    if (pts <= 0) return;
    const w = CLASSES[g.cls].w;
    const keys = ['str', 'end', 'agi', 'tec', 'dis'];
    for (let k = 0; k < 3; k++) {
      const key = R.weighted(keys, x => w[x] + 0.05);
      g[key] = r1(Math.min(98, g[key] + pts / 3));
    }
    g.ovr = r1(ovrOf(g));
    if (g.ovr > g.pot) g.pot = g.ovr;
    if (g.ovr > num(g.peak)) g.peak = g.ovr;
  },
  weeklyAll(matchWeek) {
    const wk = S.season * 100 + S.week;
    for (const id in S.glads) {
      const g = S.glads[id];
      const club = g.club >= 0 ? S.clubs[g.club] : null;
      // bench / free agents train a little on their own
      if (club) { if (g.pw !== wk) g.xp = num(g.xp) + 2.5; }
      else g.xp = num(g.xp) + 1;
      this.convertXP(g, club);
      // condition recovery
      const rec = club ? Staff.condRecovery(club) : 15;
      g.cond = clamp(Math.round(g.cond + rec * (g.age > 32 ? 0.85 : 1)), 0, 100);
      // injuries heal
      if (g.injury) {
        g.injury.w--;
        if (g.injury.w > 0 && club && R.next() < Staff.healChance(club)) g.injury.w--;
        if (g.injury.w <= 0) { g.injury = null; if (g.club === S.player) GameState.news(() => tx(`${cn(g)} sakatlığını atlattı ve maçlara hazır.`, `${cn(g)} has recovered from injury and is ready to fight.`), { p: 1, k: 'inj' }); }
      }
      // morale
      g.mor = g.mor + (62 - g.mor) * 0.1;
      if (club) {
        if (matchWeek && matchWeek.has(club.id) && g.pw !== wk && !g.injury) g.mor -= g.ovr > Squad.avgOvr(club) ? 2.5 : 1.5;
        if (club.arrears > 0) g.mor -= 6;
      } else g.fw = num(g.fw) + 1;
      g.mor = Math.round(clamp(g.mor, 0, 100));
      if (S.week % 5 === 0) g.ppot = r1(clamp(lerp(g.ppot, Math.max(g.pot, g.ovr), 0.08), g.ovr, 99));
      g.val = TransferMath.value(g);
    }
  },
  // season end: ageing, decline, retirement decision. Returns true if retiring
  ageAndRetire(g) {
    g.age++;
    const over = g.age - g.pk - 2;
    if (over > 0) {
      const d = over * 0.8 + R.range(0, 1.5);
      g.agi = r1(Math.max(5, g.agi - d * 1.0));
      g.end = r1(Math.max(5, g.end - d * 0.7));
      g.str = r1(Math.max(5, g.str - d * 0.5));
      g.tec = r1(Math.max(5, g.tec - d * 0.15));
      g.dis = r1(Math.max(5, g.dis - d * 0.1));
      g.ovr = r1(ovrOf(g));
      g.pot = r1(Math.max(g.ovr, g.pot - d));
      g.ppot = r1(Math.max(g.ovr, Math.min(g.ppot, g.pot + 3)));
    }
    const a = g.age;
    let p = a < 33 ? 0 : a === 33 ? 0.05 : a === 34 ? 0.1 : a === 35 ? 0.18 : a === 36 ? 0.3 : a === 37 ? 0.45 : a === 38 ? 0.62 : 0.85;
    if (a >= 31 && g.ovr < 30) p += 0.15;
    if (g.club < 0 && a >= 30) p += Math.min(0.4, num(g.fw) * 0.01);
    return R.next() < p;
  }
};

// ---------------------------------------------------------------- economy
const FIN_INC = { get sponsor() { return tx('Hami', 'Patron'); }, get tickets() { return tx('Bilet', 'Tickets'); }, get prizes() { return tx('Ödüller', 'Prize money'); }, get transfers() { return tx('Transfer satışı', 'Transfer sales'); }, get loan() { return tx('Yeniden finansman', 'Refinancing'); } };
const FIN_EXP = { get wages() { return tx('Maaşlar', 'Wages'); }, get staff() { return tx('Personel', 'Staff'); }, get ops() { return tx('İşletme', 'Operations'); }, get transfers() { return tx('Bonservis', 'Transfer fees'); }, get signing() { return tx('İmza parası', 'Signing fees'); }, get bonuses() { return tx('Bonuslar', 'Bonuses'); }, get facilities() { return tx('Tesisler', 'Facilities'); }, get equipment() { return tx('Ekipman', 'Equipment'); }, get loanpay() { return tx('Borç taksidi', 'Loan repayment'); }, get release() { return tx('Fesih', 'Contract terminations'); }, get scout() { return tx('Keşif', 'Scouting'); } };

const Economy = {
  blankFin() {
    const inc = {}, exp = {};
    for (const k in FIN_INC) inc[k] = 0;
    for (const k in FIN_EXP) exp[k] = 0;
    return { inc, exp };
  },
  staffWage(q) { return Math.round(8 * Math.pow(1.045, q)); },
  wageBill(club) { return GameState.rosterGlads(club).reduce((a, g) => a + (g.con ? g.con.wage : 0), 0); },
  staffBill(club) { return STAFF_IDS.reduce((a, s) => a + club.staff[s].w, 0); },
  upkeep(club) { return FAC_IDS.reduce((a, f) => a + FAC.upkeep[club.fac[f]] * (f === 'arena' ? 1.3 : 1), 0); },
  opsCost(club) { return Math.round(ECON.opsBase * tierEco(club.tier) + this.upkeep(club)); },
  weeklyCost(club) { return this.wageBill(club) + this.staffBill(club) + this.opsCost(club) + (club.loan ? club.loan.wk : 0); },
  credit(club, cat, amt) {
    amt = Math.round(num(amt));
    if (amt <= 0) return;
    club.budget += amt;
    club.weekFin.inc[cat] = (club.weekFin.inc[cat] || 0) + amt;
    club.seasonFin.inc[cat] = (club.seasonFin.inc[cat] || 0) + amt;
  },
  // pay an expense. Discretionary spending (force=false) fails if unaffordable; obligations (force=true) create arrears
  debit(club, cat, amt, force) {
    amt = Math.round(num(amt));
    if (amt <= 0) return true;
    if (!force && (club.budget < amt || (club.arrears > 0 && cat !== 'signing'))) return false;
    let paid = amt;
    if (club.budget < amt) { paid = Math.max(0, club.budget); club.arrears += amt - paid; }
    club.budget -= paid;
    club.weekFin.exp[cat] = (club.weekFin.exp[cat] || 0) + amt;
    club.seasonFin.exp[cat] = (club.seasonFin.exp[cat] || 0) + amt;
    return true;
  },
  canSpend(club, amt) { return club.arrears <= 0 && club.budget >= amt; },
  gateEstimate(H, A, comp) {
    const cap = FAC.capacity[H.fac.arena];
    const tbl = Leagues.table(S.leagues[H.lg]).find(r => r.cid === H.id);
    const form = tbl ? tbl.form.filter(x => x === 'G').length - tbl.form.filter(x => x === 'M').length : 0;
    const star = GameState.rosterGlads(H).reduce((a, g) => Math.max(a, g.cha), 0);
    let fill = 0.55 + H.rep / 250 + form * 0.025 + (star - 50) * 0.003 + Rivalry.get(H.id, A.id) / 400 + (A.rep - H.rep) / 600 + (comp && comp.type !== 'league' ? 0.06 : 0);
    fill = clamp(fill, 0.2, 1);
    const att = Math.min(cap, Math.round(H.fans * fill));
    const price = ECON.ticketPrice * (1 + FAC.ticketBonus[H.fac.arena]) * (1 + (H.rep - 50) / 400);
    return { att, cap, rev: Math.round(att * price), fill };
  },
  matchday(H, A, comp) {
    const g = this.gateEstimate(H, A, comp);
    this.credit(H, 'tickets', g.rev);
    H.lastGate = { att: g.att, cap: g.cap, rev: g.rev, s: S.season, w: S.week };
  },
  weekly(club) {
    // income
    const spon = club.isPlayer && !club.autoManage ? (club.sponsor ? club.sponsor.wk : 0) : Sponsors.aiWeekly(club);
    this.credit(club, 'sponsor', spon);
    // settle old arrears first
    if (club.arrears > 0 && club.budget > 0) {
      const p = Math.min(club.budget, club.arrears);
      club.budget -= p; club.arrears -= p;
    }
    this.debit(club, 'wages', this.wageBill(club), true);
    this.debit(club, 'staff', this.staffBill(club), true);
    this.debit(club, 'ops', this.opsCost(club), true);
    if (club.loan) {
      this.debit(club, 'loanpay', club.loan.wk, true);
      club.loan.left--;
      if (club.loan.left <= 0) { club.loan = null; if (club.isPlayer) GameState.news(() => tx('Yeniden finansman borcu tamamen ödendi.', 'The refinancing loan has been fully repaid.'), { p: 1, k: 'fin' }); }
    }
    club.arrears = Math.round(club.arrears);
    if (club.arrears > 0) {
      club.rep = clamp(club.rep - 0.4, 1, 99);
      if (club.isPlayer && !club.autoManage) GameState.news(() => tx(`Maaş borcu: ${fmtGold(club.arrears)}. Gladyatörlerin morali düşüyor, harcamalar durduruldu.`, `Wage arrears: ${fmtGold(club.arrears)}. Gladiator morale is falling and spending is frozen.`), { p: 1, k: 'fin' });
      // unbounded debt is not allowed: unpaid gladiators walk out once arrears exceed ~6 weeks of wages
      const wb = this.wageBill(club);
      if (club.arrears > Math.max(600, wb * 6)) {
        const gl = GameState.rosterGlads(club).sort((a, b) => (b.con.wage * (100 - b.loy)) - (a.con.wage * (100 - a.loy)))[0];
        if (gl) {
          const forgiven = Math.min(club.arrears, gl.con.wage * 6);
          club.arrears -= forgiven;
          GameState.news(() => tx(`${cn(gl)}, ödenmeyen maaşları nedeniyle ${cn(club)} ile sözleşmesini feshetti.`, `${cn(gl)} terminated his contract with ${cn(club)} over unpaid wages.`), { p: club.isPlayer ? 1 : 0, k: 'fin' });
          Transfer.detach(gl);
        }
      }
      if (!club.isPlayer || club.autoManage) this.aiRefinance(club);
    }
  },
  refinanceOffer(club) {
    if (club.loan || club.loanSeason === S.season) return null;
    const wc = this.weeklyCost(club);
    if (!(club.arrears > 0 || club.budget < wc * 3)) return null;
    const amount = Math.round((wc * 10 + club.arrears) / 10) * 10;
    return { amount, weeks: 20, wk: Math.round(amount * 1.2 / 20), total: Math.round(amount * 1.2) };
  },
  refinance(club) {
    const o = this.refinanceOffer(club);
    if (!o) return false;
    club.loan = { left: o.weeks, wk: o.wk, total: o.total, amount: o.amount };
    club.loanSeason = S.season;
    this.credit(club, 'loan', o.amount);
    const p = Math.min(club.budget, club.arrears); club.budget -= p; club.arrears -= p;
    club.rep = clamp(club.rep - 3, 1, 99);
    GameState.news(() => tx(`${cn(club)} Sarraflar Loncası'ndan ${fmtGold(o.amount)} yeniden finansman aldı.`, `${cn(club)} took ${fmtGold(o.amount)} of refinancing from the Moneylenders' Guild.`), { p: club.isPlayer ? 1 : 0, k: 'fin' });
    return true;
  },
  aiRefinance(club) { if (this.refinanceOffer(club)) this.refinance(club); },
  closeWeek(club) {
    if (club.isPlayer) {
      club.weekHist = club.weekHist || [];
      const inc = Object.values(club.weekFin.inc).reduce((a, b) => a + b, 0);
      const exp = Object.values(club.weekFin.exp).reduce((a, b) => a + b, 0);
      club.weekHist.push({ w: S.week, inc, exp, b: club.budget });
      if (club.weekHist.length > 32) club.weekHist.shift();
    }
    club.lastFin = club.weekFin;
    club.weekFin = this.blankFin();
  }
};

const Reputation = {
  afterMatch(c, won, opp) {
    const d = won ? 0.15 + Math.max(0, opp.rep - c.rep) * 0.02 : -0.1 - Math.max(0, c.rep - opp.rep) * 0.01;
    c.rep = r1(clamp(c.rep + d, 1, 99));
  },
  seasonEnd(c, rank, promoted, relegated) {
    let d = 0;
    if (rank === 1) d += 6; else if (rank <= 4) d += 1.5; else if (rank >= 7) d -= 2;
    if (promoted) d += 4; if (relegated) d -= 4;
    d += (TIERS[c.tier].rep - c.rep) * 0.1;
    c.rep = r1(clamp(c.rep + d, 1, 99));
    const played = Math.max(1, c.st.w + c.st.l);
    const T = TIERS[c.tier];
    let f = c.fans * (1 + (c.st.w / played - 0.5) * 0.25 + (promoted ? 0.15 : 0) - (relegated ? 0.12 : 0) + (rank === 1 ? 0.1 : 0));
    f = lerp(f, (T.fans[0] + T.fans[1]) / 2, 0.08);
    c.fans = Math.max(200, Math.round(f));
  }
};

// ---------------------------------------------------------------- sponsors
const Sponsors = {
  aiWeekly(club) { return Math.round(ECON.sponsorBase * tierEco(club.tier) * (0.8 + club.rep / 250) * 1.12); },
  expectedRank(club) {
    const lg = S.leagues[club.lg];
    const mine = Squad.top3(club);
    let better = 0;
    for (const cid of lg.clubs) if (cid !== club.id && Squad.top3(S.clubs[cid]) > mine) better++;
    return better + 1;
  },
  makeGoal(kind, club, e) {
    const pick = arr => R.pick(arr);
    let N, d;
    switch (kind) {
      case 'rank': N = clamp(e + pick([-1, 0, 1]), 1, 7); d = clamp(0.5 + (e - N) * 0.15, 0.1, 0.95); break;
      case 'title': N = 1; d = clamp(0.4 + (e - 1) * 0.12, 0.3, 0.97); break;
      case 'promo': N = 2; d = clamp(0.45 + (e - 2) * 0.12, 0.2, 0.95); break;
      case 'wins': { const ew = Math.round(14 * (8.5 - e) / 8); N = clamp(ew + pick([-1, 0, 1, 2]), 3, 13); d = clamp(0.5 + (N - ew) * 0.1, 0.1, 0.95); break; }
      case 'kos': { const ek = Math.round(14 * (1.2 + 1.4 * (8.5 - e) / 8)); N = clamp(ek + pick([-3, 0, 3, 5]), 8, 40); d = clamp(0.5 + (N - ek) * 0.04, 0.1, 0.95); break; }
      case 'cup': {
        const bye = club.tier <= 2;
        N = bye ? pick([2, 3, 4]) : pick([1, 2, 3]);
        d = clamp(0.3 + (N - (bye ? 2 : 1)) * 0.2 + (club.tier - 3) * 0.05, 0.1, 0.95);
        break;
      }
      case 'homewins': { const eh = Math.round(7 * (8.5 - e) / 8 + 0.5); N = clamp(eh + pick([-1, 0, 1]), 2, 7); d = clamp(0.5 + (N - eh) * 0.15, 0.1, 0.95); break; }
    }
    return { kind, N, d: r1(d) };
  },
  // goal text is rendered from kind/N so it follows the active language
  goalText(g) {
    if (!g) return '';
    const N = g.N;
    switch (g.kind) {
      case 'rank': return N === 1 ? tx('Lig şampiyonu ol', 'Win the league') : tx(`Ligi ilk ${N} sırada bitir`, `Finish in the top ${N}`);
      case 'title': return tx('Lig şampiyonu ol', 'Win the league');
      case 'promo': return tx('Üst lige yüksel (ilk 2)', 'Win promotion (top 2)');
      case 'wins': return tx(`En az ${N} lig maçı kazan`, `Win at least ${N} league matches`);
      case 'kos': return tx(`Ligde en az ${N} rakip ele`, `Eliminate at least ${N} opponents in the league`);
      case 'cup': return tx(`Bölgesel kupada ${RCUP_ROUNDS[N]} turuna ulaş`, `Reach the ${RCUP_ROUNDS[N]} of the regional cup`);
      case 'homewins': return tx(`Ev sahibi olarak en az ${N} lig maçı kazan`, `Win at least ${N} league matches at home`);
    }
    return txt(g.txt);
  },
  generateOffers() {
    const club = GameState.player();
    if (!club) return;
    const e = this.expectedRank(club);
    const types = R.shuffle(Object.keys(SPONSOR_TYPES).slice()).slice(0, 3);
    S.sponsorOffers = types.map(t => {
      const T = SPONSOR_TYPES[t];
      let kinds = T.goals.filter(k => !(k === 'promo' && club.tier === 1));
      const goal = this.makeGoal(R.pick(kinds), club, e);
      const wk = Math.round(ECON.sponsorBase * tierEco(club.tier) * (0.8 + club.rep / 250) * T.wk * R.range(0.95, 1.05));
      const bonus = Math.round(wk * 30 * (0.15 + goal.d * 0.7) * T.bonus / 10) * 10;
      return { t, n: T.n, wk, bonus, dur: R.int(T.dur[0], T.dur[1]), goal };
    });
  },
  accept(i) {
    const club = GameState.player();
    if (club.sponsor || !S.sponsorOffers[i]) return false;
    const o = S.sponsorOffers[i];
    club.sponsor = { ...o, left: o.dur, since: S.season, hits: 0 };
    S.sponsorOffers = [];
    GameState.news(() => tx(`${SPONSOR_TYPES[o.t].n} ile ${o.dur} sezonluk hami anlaşması imzalandı (haftalık ${fmtGold(o.wk)}).`, `Signed a ${o.dur}-season patron deal with the ${SPONSOR_TYPES[o.t].n} (${fmtGold(o.wk)} per week).`), { p: 1, k: 'spon' });
    return true;
  },
  progress(club) {
    const sp = club.sponsor; if (!sp) return null;
    const g = sp.goal;
    const row = Leagues.table(S.leagues[club.lg]).find(r => r.cid === club.id) || { rank: 8, w: 0, kf: 0 };
    let cur, ok;
    switch (g.kind) {
      case 'rank': case 'title': case 'promo': cur = tx(row.rank + '. sıra', 'position ' + row.rank); ok = row.rank <= g.N; break;
      case 'wins': cur = tx(row.w + ' galibiyet', row.w + ' wins'); ok = row.w >= g.N; break;
      case 'kos': cur = tx(row.kf + ' eleme', row.kf + ' eliminations'); ok = row.kf >= g.N; break;
      case 'homewins': cur = tx(club.st.homeW + ' ev galibiyeti', club.st.homeW + ' home wins'); ok = club.st.homeW >= g.N; break;
      case 'cup': { const rr = Cups.roundReached(S.rcups[club.reg], club.id); cur = rr >= 0 ? (rr >= RCUP_ROUNDS.length ? tx('Şampiyon', 'Champions') : RCUP_ROUNDS[rr]) : '-'; ok = rr >= g.N; break; }
    }
    return { cur, ok };
  },
  seasonEnd(club) {
    const sp = club.sponsor; if (!sp) return;
    const p = this.progress(club);
    if (p && p.ok) {
      this.credit(club, sp.bonus);
      sp.hits++;
      club.rep = clamp(club.rep + 1, 1, 99);
      GameState.news(() => tx(`${SPONSOR_TYPES[sp.t].n} hedefi tutturuldu: "${Sponsors.goalText(sp.goal)}". Ödül: ${fmtGold(sp.bonus)}.`, `${SPONSOR_TYPES[sp.t].n} target met: "${Sponsors.goalText(sp.goal)}". Reward: ${fmtGold(sp.bonus)}.`), { p: 1, k: 'spon' });
    } else GameState.news(() => tx(`${SPONSOR_TYPES[sp.t].n} sezon hedefi gerçekleşmedi: "${Sponsors.goalText(sp.goal)}".`, `${SPONSOR_TYPES[sp.t].n} season target missed: "${Sponsors.goalText(sp.goal)}".`), { p: 1, k: 'spon' });
    sp.left--;
  },
  credit(club, amt) { Economy.credit(club, 'sponsor', amt); },
  seasonStart(club) {
    if (club.sponsor && club.sponsor.left <= 0) {
      { const t = club.sponsor.t; GameState.news(() => tx(`${SPONSOR_TYPES[t].n} ile hami anlaşması sona erdi. Yeni teklifler sizi bekliyor.`, `The patron deal with the ${SPONSOR_TYPES[t].n} has ended. New offers await.`), { p: 1, k: 'spon' }); }
      club.sponsor = null;
    }
    if (club.sponsor) {
      // multi-season deals: refresh the goal against the new league situation
      const e = this.expectedRank(club);
      let kind = club.sponsor.goal.kind;
      if (kind === 'promo' && club.tier === 1) kind = 'rank';
      club.sponsor.goal = this.makeGoal(kind, club, e);
      club.sponsor.bonus = Math.round(club.sponsor.wk * 30 * (0.15 + club.sponsor.goal.d * 0.7) * SPONSOR_TYPES[club.sponsor.t].bonus / 10) * 10;
      S.sponsorOffers = [];
    } else this.generateOffers();
  }
};

// ---------------------------------------------------------------- staff & facilities
const Staff = {
  condRecovery(club) { return club ? 14 + FAC.medCond[club.fac.med] + club.staff.healer.q * 0.06 : 15; },
  healChance(club) { return club ? Math.min(0.75, FAC.medHeal[club.fac.med] + club.staff.healer.q * 0.003) : 0; },
  injReduce(club) { return club ? Math.min(0.3, FAC.medInj[club.fac.med] + club.staff.healer.q * 0.0012) : 0; },
  scoutAcc(club) { return club ? Math.min(0.75, FAC.scoutAcc[club.fac.scout] + club.staff.scout.q * 0.004) : 0; },
  hireCost(c) { return c.w * 6; },
  generateCandidates() {
    const club = GameState.player(); if (!club) return;
    const T = TIERS[club.tier];
    S.staffCands = {};
    for (const s of STAFF_IDS) {
      S.staffCands[s] = [0, 1, 2].map(k => WorldGenerator.staffMember(R.pick(REGIONS).id, R.range(T.staff[0] - 10 + k * 6, T.staff[1] + 4 + k * 5)));
    }
  },
  hire(type, idx) {
    const club = GameState.player();
    const c = S.staffCands && S.staffCands[type] && S.staffCands[type][idx];
    if (!c) return { ok: false, msg: tx('Aday bulunamadı.', 'Candidate not found.') };
    const cost = this.hireCost(c);
    if (!Economy.debit(club, 'staff', cost, false)) return { ok: false, msg: tx('Yetersiz bütçe (işe alım bedeli ', 'Not enough money (hiring fee ') + fmtGold(cost) + ').' };
    const old = club.staff[type];
    club.staff[type] = { n: c.n, q: c.q, w: c.w };
    S.staffCands[type].splice(idx, 1, old);
    GameState.news(() => tx(`${STAFF[type].name} olarak ${cn(c)} (kalite ${c.q}) göreve başladı.`, `${cn(c)} (quality ${c.q}) joined as ${STAFF[type].name}.`), { p: 1, k: 'club' });
    return { ok: true };
  }
};

const Facilities = {
  cost(club, fid) {
    const lv = club.fac[fid];
    if (lv >= 5) return 0;
    return Math.round(FAC.cost[lv + 1] * (fid === 'arena' ? 1.4 : 1));
  },
  effect(fid, lv, club) {
    switch (fid) {
      case 'train': return tx(`Gelişim çarpanı ×${FAC.trainMult[lv].toFixed(2)}`, `Development ×${FAC.trainMult[lv].toFixed(2)}`);
      case 'med': return tx(`Kondisyon +${FAC.medCond[lv]}/hafta · ek iyileşme %${Math.round(FAC.medHeal[lv] * 100)} · sakatlık riski -%${Math.round(FAC.medInj[lv] * 100)}`, `Condition +${FAC.medCond[lv]}/week · extra healing ${Math.round(FAC.medHeal[lv] * 100)}% · injury risk -${Math.round(FAC.medInj[lv] * 100)}%`);
      case 'scout': return tx(`${FAC.scoutRegions[lv]} bölge · haftada ${FAC.scoutReports[lv]} rapor · doğruluk +%${Math.round(FAC.scoutAcc[lv] * 100)}`, `${FAC.scoutRegions[lv]} region(s) · ${FAC.scoutReports[lv]} report(s)/week · accuracy +${Math.round(FAC.scoutAcc[lv] * 100)}%`);
      case 'arena': return tx(`Kapasite ${fmtInt(FAC.capacity[lv])} · bilet fiyatı +%${Math.round(FAC.ticketBonus[lv] * 100)}`, `Capacity ${fmtInt(FAC.capacity[lv])} · ticket price +${Math.round(FAC.ticketBonus[lv] * 100)}%`);
    }
    return '';
  },
  upgrade(club, fid) {
    const lv = club.fac[fid];
    if (lv >= 5) return { ok: false, msg: tx('Tesis en üst seviyede.', 'Facility is already at maximum level.') };
    const cost = this.cost(club, fid);
    if (club.arrears > 0) return { ok: false, msg: tx('Maaş borcu varken yatırım yapılamaz.', 'No investments while wages are in arrears.') };
    if (!Economy.debit(club, 'facilities', cost, false)) return { ok: false, msg: tx('Yetersiz bütçe.', 'Not enough money.') };
    club.fac[fid] = lv + 1;
    if (club.isPlayer) GameState.news(() => tx(`${FACILITIES[fid].name} ${lv + 1}. seviyeye yükseltildi.`, `${FACILITIES[fid].name} upgraded to level ${lv + 1}.`), { p: 1, k: 'club' });
    return { ok: true };
  }
};

// ---------------------------------------------------------------- equipment
const Equipment = {
  bonuses(g) {
    const b = { dmg: 0, armor: 0, hp: 0, block: 0, eva: 0, acc: 0, crit: 0, spd: 0, special: 0 };
    if (!g || !g.eq || !S) return b;
    for (const slot of ['w', 'a', 'x']) {
      const it = S.items[g.eq[slot]];
      if (!it) continue;
      const T = ITEM_TYPES[it.t]; if (!T) continue;
      const q = it.q + 1, p = it.p;
      b.dmg += (T.dmg || 0) * (q * 0.45 + p * 0.2);
      b.armor += (T.armor || 0) * (q * 1.2 + p * 0.4);
      b.hp += (T.hp || 0) * (q * 0.6 + p * 0.3);
      b.block += (T.block || 0) * (q + p * 0.3);
      b.eva += (T.eva || 0) * (q + p * 0.3);
      b.acc += (T.acc || 0) * (q + p * 0.3);
      b.crit += (T.crit || 0) * (q + p * 0.3);
      b.spd += (T.spd || 0);
      b.special += (T.special || 0) * (q * 0.5 + p * 0.2);
    }
    return b;
  },
  statLine(it) {
    const T = ITEM_TYPES[it.t], q = it.q + 1, p = it.p, out = [];
    const pct = (tr, en, v) => tx(tr + ' +%' + v, en + ' +' + v + '%');
    if (T.dmg) out.push(tx('Hasar +', 'Damage +') + r1(T.dmg * (q * 0.45 + p * 0.2)));
    if (T.armor) out.push(tx('Zırh +', 'Armour +') + r1(T.armor * (q * 1.2 + p * 0.4)));
    if (T.hp) out.push(tx('Can +', 'Health +') + r1(T.hp * (q * 0.6 + p * 0.3)));
    if (T.block) out.push(pct('Blok', 'Block', r1(T.block * (q + p * 0.3) * 100)));
    if (T.eva) out.push(pct('Kaçınma', 'Evasion', r1(T.eva * (q + p * 0.3) * 100)));
    if (T.acc) out.push(pct('İsabet', 'Accuracy', r1(T.acc * (q + p * 0.3) * 100)));
    if (T.crit) out.push(pct('Kritik', 'Critical', r1(T.crit * (q + p * 0.3) * 100)));
    if (T.special) out.push(pct('Teknik etkisi', 'Technique effect', r1(T.special * (q * 0.5 + p * 0.2) * 100)));
    if (T.spd) out.push(tx('Hız %', 'Speed ') + r1(T.spd * 100) + tx('', '%'));
    return out.join(' · ');
  },
  price(type, q) { const T = ITEM_TYPES[type]; return Math.round(QUALITIES[q].price * (T.slot === 'a' ? 1.1 : T.slot === 'x' ? 0.9 : 1)); },
  upgradeCost(it) { return Math.round(this.price(it.t, it.q) * 0.3 * Math.pow(it.p + 1, 1.5) / 10) * 10; },
  sellValue(it) { return Math.round((this.price(it.t, it.q) + it.p * this.upgradeCost({ ...it, p: Math.max(0, it.p - 1) }) * 0.5) * 0.35 / 10) * 10; },
  repNeeded(q) { return [0, 0, 15, 35, 55][q]; },
  name(it) { return QUALITIES[it.q].n + ' ' + ITEM_TYPES[it.t].n + (it.p ? ' +' + it.p : ''); },
  fits(it, g) { const T = ITEM_TYPES[it.t]; return T && T.cls.includes(g.cls); },
  equip(itemId, gid, silent) {
    const it = S.items[itemId], g = S.glads[gid];
    if (!it || !g) return { ok: false, msg: tx('Geçersiz seçim.', 'Invalid selection.') };
    if (it.club !== g.club) return { ok: false, msg: tx('Ekipman bu kulübe ait değil.', 'This equipment does not belong to the club.') };
    if (!this.fits(it, g)) return { ok: false, msg: tx(`${CLASSES[g.cls].name} bu ekipmanı kullanamaz.`, `A ${CLASSES[g.cls].name} cannot use this equipment.`) };
    const slot = ITEM_TYPES[it.t].slot;
    if (it.g && S.glads[it.g]) S.glads[it.g].eq[slot] = 0;
    const prev = S.items[g.eq[slot]]; if (prev) prev.g = 0;
    g.eq[slot] = it.id; it.g = g.id;
    return { ok: true };
  },
  unequip(itemId) {
    const it = S.items[itemId]; if (!it) return;
    const g = S.glads[it.g];
    if (g) { const slot = ITEM_TYPES[it.t].slot; if (g.eq[slot] === it.id) g.eq[slot] = 0; }
    it.g = 0;
  },
  unequipAll(g) { for (const slot of ['w', 'a', 'x']) { const it = S.items[g.eq[slot]]; if (it) it.g = 0; g.eq[slot] = 0; } },
  buy(club, type, q) {
    if (club.rep < this.repNeeded(q)) return { ok: false, msg: tx(`${QUALITIES[q].n} ekipman için en az ${this.repNeeded(q)} itibar gerekir.`, `${QUALITIES[q].n} equipment requires at least ${this.repNeeded(q)} reputation.`) };
    const cost = this.price(type, q);
    if (club.arrears > 0) return { ok: false, msg: tx('Maaş borcu varken harcama yapılamaz.', 'No spending while wages are in arrears.') };
    if (!Economy.debit(club, 'equipment', cost, false)) return { ok: false, msg: tx('Yetersiz bütçe.', 'Not enough money.') };
    const it = WorldGenerator.addItem(club, type, q, 0);
    return { ok: true, item: it };
  },
  upgrade(club, itemId) {
    const it = S.items[itemId];
    if (!it || it.club !== club.id) return { ok: false, msg: tx('Geçersiz ekipman.', 'Invalid equipment.') };
    if (it.p >= 5) return { ok: false, msg: tx('Ekipman en üst seviyede (+5).', 'Equipment is already at maximum (+5).') };
    const cost = this.upgradeCost(it);
    if (club.arrears > 0) return { ok: false, msg: tx('Maaş borcu varken harcama yapılamaz.', 'No spending while wages are in arrears.') };
    if (!Economy.debit(club, 'equipment', cost, false)) return { ok: false, msg: tx('Yetersiz bütçe.', 'Not enough money.') };
    it.p++;
    return { ok: true };
  },
  sell(club, itemId) {
    const it = S.items[itemId];
    if (!it || it.club !== club.id) return { ok: false };
    const v = this.sellValue(it);
    this.unequip(itemId);
    delete S.items[itemId];
    Economy.credit(club, 'transfers', v);
    return { ok: true, v };
  },
  clubItems(club) { return Object.values(S.items).filter(it => it.club === club.id); },
  // AI: equip best compatible unequipped items onto roster
  autoEquip(club) {
    const items = this.clubItems(club);
    if (!items.length) return;
    const score = it => it.q * 10 + it.p * 3;
    for (const g of GameState.rosterGlads(club)) {
      for (const slot of ['w', 'a', 'x']) {
        const cur = S.items[g.eq[slot]];
        let best = cur || null;
        for (const it of items) {
          if (ITEM_TYPES[it.t].slot !== slot || !this.fits(it, g)) continue;
          if (it.g && it.g !== g.id) continue;
          if (!best || score(it) > score(best)) best = it;
        }
        if (best && best !== cur) this.equip(best.id, g.id);
      }
    }
  }
};

// ---------------------------------------------------------------- scouting
const Scouting = {
  level(g) {
    if (!g) return 0;
    let l = S.scout[g.id] || 0;
    if (g.club === S.player) {
      l = Math.max(l, 2);
      if (g.joined && (S.season - g.joined.s) * 30 + (S.week - g.joined.w) >= 10) l = 3;
    }
    return l;
  },
  regions() {
    const c = GameState.player(); if (!c) return REGIONS.map(r => r.id);
    const n = FAC.scoutRegions[c.fac.scout];
    const ids = [c.reg].concat(REGIONS.map(r => r.id).filter(r => r !== c.reg));
    return ids.slice(0, n);
  },
  canSee(g) {
    if (!g) return false;
    if (g.club < 0 || g.club === S.player) return true;
    return this.regions().includes(S.clubs[g.club].reg);
  },
  potRange(g) {
    const lvl = this.level(g);
    const acc = Staff.scoutAcc(GameState.player());
    const err = [16, 10, 6, 2.5][lvl] * (1 - acc);
    const base = lvl === 0 ? g.ppot : g.pot;
    const off = (hash01(g.id, lvl * 13 + 7) - 0.5) * err;
    const c = base + off;
    let lo = Math.round(Math.max(g.ovr, c - err / 2)), hi = Math.round(Math.min(99, Math.max(g.ovr, c + err / 2)));
    if (hi < lo) hi = lo;
    return [lo, hi];
  },
  potMid(g) { const r = this.potRange(g); return (r[0] + r[1]) / 2; },
  trait(g, key) {
    const lvl = this.level(g);
    if (lvl < 2) return '?';
    const raw = { inj: (g.inj - 0.5) / 1.4 * 100, loy: g.loy, clu: g.clu, grow: (g.grow - 0.6) / 0.85 * 100 }[key];
    const noise = lvl === 2 ? (hash01(g.id, key.length * 31) - 0.5) * 30 : 0;
    const v = raw + noise;
    return v < 33 ? tx('Düşük', 'Low') : v < 66 ? tx('Orta', 'Medium') : tx('Yüksek', 'High');
  },
  reportCost() { const c = GameState.player(); return Math.round(40 * Math.pow(tierEco(c.tier), 0.6) / 5) * 5; },
  reportsLeft() { const c = GameState.player(); return Math.max(0, FAC.scoutReports[c.fac.scout] - num(S.scoutUsed)); },
  report(g) {
    const c = GameState.player();
    if (this.level(g) >= 3) return { ok: false, msg: tx('Bu gladyatör hakkında bilgiler zaten çok net.', 'Information on this gladiator is already very precise.') };
    if (this.reportsLeft() <= 0) return { ok: false, msg: tx('Bu haftaki keşif raporu hakkınız doldu.', 'No scouting reports left this week.') };
    if (!this.canSee(g)) return { ok: false, msg: tx('Keşif ağınız bu bölgeyi kapsamıyor.', 'Your scouting network does not cover this region.') };
    const cost = this.reportCost();
    if (!Economy.debit(c, 'scout', cost, false)) return { ok: false, msg: tx('Yetersiz bütçe.', 'Not enough money.') };
    S.scout[g.id] = Math.min(3, this.level(g) + 1);
    S.scoutUsed = num(S.scoutUsed) + 1;
    return { ok: true };
  }
};

// ---------------------------------------------------------------- news (generated only from real events)
const News = {
  onMatch(m, comp, res, H, A, ovrH, ovrA) {
    const W = res.w === 0 ? H : A, L = res.w === 0 ? A : H;
    const sc = `${Math.max(res.surv[0], res.surv[1])}-${Math.min(res.surv[0], res.surv[1])}`;
    if (H.isPlayer || A.isPlayer) {
      const me = H.isPlayer ? H : A;
      const opp = H.isPlayer ? A : H;
      const rivalry = Rivalry.get(H.id, A.id) >= 35;
      GameState.news(() => tx(`${Calendar.compName(comp)}: ${cn(me)} ${W === me ? 'kazandı' : 'kaybetti'} — ${cn(opp)} karşısında ${sc}${rivalry ? ' (rekabet maçı)' : ''}.`, `${Calendar.compName(comp)}: ${cn(me)} ${W === me ? 'won' : 'lost'} ${sc} against ${cn(opp)}${rivalry ? ' (rivalry match)' : ''}.`), { p: 1, k: 'match' });
    }
    if (comp.type !== 'league' && W.tier - L.tier >= 2) {
      GameState.news(() => tx(`${Cups.nameOf(comp.key)}'nda sürpriz: ${TIERS[W.tier].s} ekibi ${cn(W)}, ${TIERS[L.tier].s} ekibi ${cn(L)}'yi eledi!`, `Upset in the ${Cups.nameOf(comp.key)}: ${TIERS[W.tier].s} side ${cn(W)} knocked out ${TIERS[L.tier].s} side ${cn(L)}!`), { k: 'cup', p: W.isPlayer || L.isPlayer });
    }
  }
};
