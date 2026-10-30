/* =========================================================================
   Season lifecycle, awards, history, weekly processing (Game) and sanity guards
   ========================================================================= */

const Season = {
  onCupChampion(cup) {
    const C = S.clubs[cup.champ], RU = S.clubs[cup.runner];
    if (!C) return;
    const imp = cup.key === 'imp';
    if (RU) Economy.credit(RU, 'prizes', imp ? ECON.icupFinalLoser : ECON.rcupFinalLoser * Math.pow(tierEco(RU.tier), 0.7));
    C.trophies.push({ s: S.season, t: bi(() => Cups.nameOf(cup)) });
    C.rep = r1(clamp(C.rep + (imp ? 8 : 5), 1, 99));
    C.fans = Math.round(C.fans * (imp ? 1.08 : 1.05));
    if (RU) Rivalry.add(C.id, RU.id, 10);
    this.payTitleBonus(C);
    for (const gid of C.roster) { const g = S.glads[gid]; if (g) g.aw.push({ s: S.season, t: bi(() => tx(Cups.nameOf(cup) + ' Şampiyonu', Cups.nameOf(cup) + ' Champion')) }); }
    GameState.news(() => tx(`${Cups.nameOf(cup)} şampiyonu ${cn(C)} oldu! Finalde ${RU ? cn(RU) : '-'} yenildi.`, `${cn(C)} won the ${Cups.nameOf(cup)}! ${RU ? cn(RU) : '-'} were beaten in the final.`), { p: C.isPlayer || (RU && RU.isPlayer), k: 'cup' });
    S.hist.champs.push({ s: S.season, k: cup.key, c: C.id, cn: C.n, r: RU ? RU.id : -1, rn: RU ? RU.n : '' });
  },
  payTitleBonus(club) {
    for (const g of GameState.rosterGlads(club)) if (g.con && g.con.titleB > 0) Economy.debit(club, 'bonuses', g.con.titleB, true);
  },
  // runs once when week 29 is processed → week 30 (season evaluation)
  endOfSeason() {
    if (S.seasonEval === S.season) return;
    S.seasonEval = S.season;
    Leagues.invalidate();
    const rec = { s: S.season, leagues: [], cups: [], awards: {}, player: null };
    const qual = [];
    for (const lg of S.leagues) {
      const t = Leagues.table(lg);
      t.forEach(r => {
        const c = S.clubs[r.cid];
        Economy.credit(c, 'prizes', ECON.rankPrize[r.rank] * tierEco(lg.tier));
      });
      const champ = S.clubs[t[0].cid];
      champ.trophies.push({ s: S.season, t: bi(() => TIERS[lg.tier].n + ' (' + REGION_BY_ID[lg.reg].name + ')') });
      this.payTitleBonus(champ);
      for (const gid of champ.roster) { const g = S.glads[gid]; if (g) g.aw.push({ s: S.season, t: bi(() => tx(TIERS[lg.tier].s + ' Şampiyonu', TIERS[lg.tier].s + ' Champion')) }); }
      if (t[1]) Rivalry.add(t[0].cid, t[1].cid, 8);
      rec.leagues.push({ id: lg.id, c: t[0].cid, cn: champ.n, r: t[1].cid, rn: S.clubs[t[1].cid].n });
      rec.awards[lg.id] = this.awards(lg, t[0].cid);
      if (lg.tier === 1) {
        GameState.news(() => tx(`${REGION_BY_ID[lg.reg].name} Altın Kolezyum şampiyonu belli oldu: ${cn(champ)}!`, `${cn(champ)} are the ${REGION_BY_ID[lg.reg].name} Golden Colosseum champions!`), { k: 'league', p: champ.isPlayer });
        qual.push({ cid: t[0].cid, rank: 1, pts: t[0].pts, kd: t[0].kf - t[0].ka }, { cid: t[1].cid, rank: 2, pts: t[1].pts, kd: t[1].kf - t[1].ka });
      }
      for (const r of t) {
        const c = S.clubs[r.cid];
        c.hist.push({ s: S.season, tier: lg.tier, rank: r.rank, pts: r.pts, w: r.w, l: r.l });
        if (c.hist.length > 40) c.hist.shift();
        const promoted = lg.tier > 1 && r.rank <= 2, relegated = lg.tier < 6 && r.rank >= 7;
        Reputation.seasonEnd(c, r.rank, promoted, relegated);
        c.endRank = r.rank;
      }
    }
    S.icupQual = qual;
    for (const cup of Cups.all()) rec.cups.push({ k: cup.key, c: cup.champ, cn: cup.champ >= 0 ? S.clubs[cup.champ].n : '-' });
    const me = GameState.player();
    if (me) {
      const lg = S.leagues[me.lg];
      const row = Leagues.table(lg).find(r => r.cid === me.id);
      const rr = Cups.roundReached(S.rcups[me.reg], me.id);
      rec.player = {
        c: me.id, n: me.n, tier: me.tier, reg: me.reg, rank: row.rank, pts: row.pts, w: row.w, l: row.l,
        cup: bi(() => rr >= RCUP_ROUNDS.length ? tx('Şampiyon', 'Champions') : rr >= 0 ? RCUP_ROUNDS[rr] : '-'),
        imp: S.icup && S.icup.part.includes(me.id) ? bi(() => S.icup.champ === me.id ? tx('Şampiyon', 'Champions') : (ICUP_ROUNDS[Math.min(ICUP_ROUNDS.length - 1, Cups.roundReached(S.icup, me.id))] || '-')) : null,
        fin: Math.round(me.budget)
      };
      if (!me.autoManage) Sponsors.seasonEnd(me);
      const myAw = rec.awards[me.lg];
      for (const k of ['mvp', 'ko', 'def', 'star']) if (myAw[k] && myAw[k].cid === me.id) GameState.news(() => tx(`${cn(myAw[k])} ${AWARD_NAMES[k]} ödülünü kazandı!`, `${cn(myAw[k])} won the ${AWARD_NAMES[k]} award!`), { p: 1, k: 'award' });
    }
    // records
    const R0 = S.hist.records;
    for (const id in S.glads) {
      const g = S.glads[id];
      if (g.ss.ko > 0 && (!R0.koSeason || g.ss.ko > R0.koSeason.v)) R0.koSeason = { v: g.ss.ko, n: g.n, g: g.id, s: S.season };
      if (!R0.topOvr || g.ovr > R0.topOvr.v) R0.topOvr = { v: Math.round(g.ovr), n: g.n, g: g.id, s: S.season };
    }
    S.hist.seasons.push(rec);
    if (S.hist.seasons.length > 60) S.hist.seasons.shift();
    GameState.news(() => tx(`${S.season}. sezon sona erdi. Sezon değerlendirmesini inceleyin; ilerlediğinizde yeni sezon başlayacak.`, `Season ${S.season} is over. Review the season summary; when you advance, the new season begins.`), { p: 1, k: 'season' });
  },
  awards(lg, champCid) {
    const pool = [];
    for (const cid of lg.clubs) for (const gid of S.clubs[cid].roster) { const g = S.glads[gid]; if (g && g.ss.m >= 4) pool.push({ g, cid }); }
    const score = g => g.ss.w * 3 + g.ss.ko * 4 + g.ss.dmg / 40 + g.ss.sv * 2 + g.ss.blk * 0.3;
    const pickMax = (arr, f) => arr.reduce((b, x) => (b == null || f(x) > f(b)) ? x : b, null);
    const out = { champ: champCid };
    const mk = (x, v) => x ? { gid: x.g.id, n: x.g.n, cid: x.cid, v } : null;
    const mvp = pickMax(pool, x => score(x.g) + x.g.id * 1e-9);
    out.mvp = mk(mvp, mvp && Math.round(score(mvp.g)));
    const ko = pickMax(pool, x => x.g.ss.ko * 1000 + x.g.ss.dmg / 100);
    out.ko = mk(ko, ko && ko.g.ss.ko);
    const defPool = pool.filter(x => x.g.ss.m >= 6);
    const df = pickMax(defPool, x => -(x.g.ss.tk / x.g.ss.m) + x.g.ss.sv * 0.01);
    out.def = mk(df, df && Math.round(df.g.ss.tk / df.g.ss.m));
    const star = pickMax(pool.filter(x => x.g.age <= 22), x => score(x.g));
    out.star = mk(star, star && Math.round(score(star.g)));
    for (const k of ['mvp', 'ko', 'def', 'star']) if (out[k]) S.glads[out[k].gid].aw.push({ s: S.season, t: bi(() => AWARD_NAMES[k] + ' (' + TIERS[lg.tier].s + ')') });
    return out;
  },
  // runs when the player advances from week 30: the new season is generated
  async transition(onProgress) {
    const prog = (p, t) => onProgress && onProgress(p, t);
    prog(0.05, tx('Yükselen ve düşen kulüpler belirleniyor', 'Settling promotion and relegation'));
    // promotion / relegation (all regions, same calendar)
    for (let ri = 0; ri < REGIONS.length; ri++) {
      const tables = [];
      for (let t = 1; t <= 6; t++) tables[t] = Leagues.table(S.leagues[GameState.leagueIndex(ri, t)]).map(r => r.cid);
      for (let t = 1; t <= 5; t++) {
        const upper = S.leagues[GameState.leagueIndex(ri, t)], lower = S.leagues[GameState.leagueIndex(ri, t + 1)];
        const down = tables[t].slice(6), up = tables[t + 1].slice(0, 2);
        upper.clubs = upper.clubs.filter(c => !down.includes(c)).concat(up);
        lower.clubs = lower.clubs.filter(c => !up.includes(c)).concat(down);
        for (const c of up) { const C = S.clubs[c]; C.tier = t; C.lg = upper.id; GameState.news(() => tx(`${cn(C)} ${TIERS[t].n}'ne yükseldi!`, `${cn(C)} have been promoted to the ${TIERS[t].n}!`), { p: C.isPlayer, k: 'league' }); }
        for (const c of down) { const C = S.clubs[c]; C.tier = t + 1; C.lg = lower.id; if (C.isPlayer) GameState.news(() => tx(`${cn(C)} ${TIERS[t + 1].n}'ne düştü.`, `${cn(C)} have been relegated to the ${TIERS[t + 1].n}.`), { p: 1, k: 'league' }); }
      }
    }
    await nextTick();
    prog(0.25, tx('Sözleşmeler güncelleniyor', 'Updating contracts'));
    for (const c of ClubAI.aiClubs()) ClubAI.renewals(c);
    const me = GameState.player();
    for (const id in S.glads) {
      const g = S.glads[id];
      if (!g.con) continue;
      g.con.yrs--;
      if (g.con.yrs <= 0) {
        const club = S.clubs[g.club];
        if (club.isPlayer && !club.autoManage) GameState.news(() => tx(`${cn(g)}'in sözleşmesi sona erdi; serbest gladyatör oldu.`, `${cn(g)}'s contract expired; he is now a free agent.`), { p: 1, k: 'transfer' });
        Transfer.record(g, club.id, -1, 0, 'expire');
        Transfer.detach(g);
      }
    }
    await nextTick();
    prog(0.4, tx('Gladyatörler yaşlanıyor, emeklilikler', 'Ageing and retirements'));
    // career stats & ageing
    const retirees = [];
    for (const id in S.glads) {
      const g = S.glads[id];
      g.ss = GladiatorGenerator.blankStats();
      if (Progression.ageAndRetire(g)) retirees.push(g);
    }
    for (const g of retirees) {
      const club = g.club >= 0 ? S.clubs[g.club] : null;
      S.hist.retired.push({ id: g.id, n: g.n, cls: g.cls, reg: g.reg, age: g.age, s: S.season, c: club ? club.id : -1, cn: club ? club.n : 'Serbest', peak: Math.round(num(g.peak, g.ovr)), cs: g.cs, aw: g.aw.length, mine: club && club.isPlayer ? 1 : 0 });
      if ((club && club.isPlayer) || g.cs.m > 120 || num(g.peak) >= 78) GameState.news(() => tx(`Tecrübeli gladyatör ${cn(g)} (${g.age}) emekliliğini açıkladı${club ? ' — ' + cn(club) : ''}.`, `Veteran gladiator ${cn(g)} (${g.age}) has announced his retirement${club ? ' — ' + cn(club) : ''}.`), { p: club && club.isPlayer, k: 'retire' });
      if (club) Transfer.detach(g);
      delete S.glads[g.id];
      delete S.scout[g.id];
    }
    if (S.hist.retired.length > 3000) S.hist.retired.splice(0, S.hist.retired.length - 3000);
    await nextTick();
    prog(0.55, tx('Yeni gladyatörler piyasaya çıkıyor', 'New gladiators enter the market'));
    // new free gladiators: replace retirees and keep the free pool healthy
    const nNew = Math.max(25, 1430 - Object.keys(S.glads).length);
    for (let i = 0; i < nNew; i++) {
      // ceilings are spread across the whole pyramid so every tier keeps being replenished
      const t = R.weighted([1, 2, 3, 4, 5, 6], x => [0.9, 0.95, 1, 1.05, 1.1, 1.15][x - 1]);
      const young = R.next() < 0.7;
      const pot = TIERS[t].ovr + R.normal(0, 4) + (R.next() < 0.05 ? 5 : 0);
      const gap = young ? R.range(9, 19) : R.range(1, 7);
      const g = GladiatorGenerator.create({ ovr: pot - gap, pot, age: young ? R.int(18, 21) : R.int(22, 28) });
      S.glads[g.id] = g;
    }
    // stale free agents disappear from the circuit (counted as retired)
    for (const g of GameState.freeAgents()) {
      if (g.fw > 60 && g.age > 26) { S.hist.retired.push({ id: g.id, n: g.n, cls: g.cls, reg: g.reg, age: g.age, s: S.season, c: -1, cn: 'Serbest', peak: Math.round(num(g.peak, g.ovr)), cs: g.cs, aw: g.aw.length, mine: 0 }); delete S.glads[g.id]; }
    }
    await nextTick();
    prog(0.7, tx('Fikstür ve kupalar hazırlanıyor', 'Preparing fixtures and cups'));
    Rivalry.decay();
    for (const c of S.clubs) {
      c.finHist.push({ s: S.season, inc: c.seasonFin.inc, exp: c.seasonFin.exp, end: Math.round(c.budget) });
      if (c.finHist.length > (c.isPlayer ? 40 : 3)) c.finHist.shift();
      c.seasonFin = Economy.blankFin();
      c.st = { w: 0, l: 0, ko: 0, homeW: 0 };
      c.weekHist = [];
      if (c.loanSeason && c.loanSeason < S.season - 0) { /* one loan per season */ }
    }
    S.season++;
    S.week = 0;
    S.seasonEval = 0;
    S.offers = [];
    S.nego = {};
    S.scoutUsed = 0;
    Leagues.createAllFixtures();
    Cups.createRegionalAll();
    const imp = Cups.createImperial(S.icupQual);
    if (imp) GameState.news(() => tx(`İmparatorluk Kupası başlıyor! Beş bölgenin şampiyonları ve ikincileri ${S.season}. sezonda Büyük Kolezyum için yarışacak.`, `The Imperial Cup begins! The champions and runners-up of the five regions will fight for the Grand Colosseum in season ${S.season}.`), { k: 'cup', p: imp.part.includes(S.player) });
    for (const c of ClubAI.aiClubs()) ClubAI.seasonStart(c);
    if (me && !me.autoManage) { Sponsors.seasonStart(me); Staff.generateCandidates(); me.goal = ClubAI.seasonGoal(me); Squad.fixLineup(me); }
    for (const c of ClubAI.aiClubs()) ClubAI.pickLineup(c);
    Leagues.invalidate();
    GameState.news(() => tx(`${S.season}. sezon başladı! Sezon öncesi transfer dönemi açık.`, `Season ${S.season} has begun! The pre-season transfer window is open.`), { p: 1, k: 'season' });
    prog(1, tx('Hazır', 'Ready'));
  }
};
const AWARD_NAMES = { get mvp() { return tx('Sezonun Gladyatörü', 'Gladiator of the Season'); }, get ko() { return tx('En Çok Eleyen', 'Top Eliminator'); }, get def() { return tx('En İyi Savunmacı', 'Best Defender'); }, get star() { return tx('Yükselen Yıldız', 'Rising Star'); } };

// ---------------------------------------------------------------- weekly flow
const Game = {
  busy: false,
  playerFixture(week = S.week) {
    if (!S || S.player < 0) return null;
    return Calendar.clubFixture(S.player, week);
  },
  pendingPlayerMatch() {
    const f = this.playerFixture();
    return f && !f.m.r ? f : null;
  },
  // processes the current week. The player's own match (if any) must already be recorded.
  async processWeek(onProgress) {
    if (this.busy) return false;
    this.busy = true;
    try {
      const prog = (p, t) => onProgress && onProgress(p, t);
      if (S.week >= SEASON_WEEKS) {
        await Season.transition(onProgress);
        Sanity.check();
        return true;
      }
      const w = S.week;
      const pend = this.pendingPlayerMatch();
      if (pend) MatchSystem.playHeadless(pend.m, pend.comp); // safety net; UI always asks first
      const fx = Calendar.fixturesForWeek(w);
      const matchClubs = new Set();
      for (const f of fx) { matchClubs.add(f.m.h); matchClubs.add(f.m.a); }
      const todo = fx.filter(f => !f.m.r);
      for (let i = 0; i < todo.length; i++) {
        MatchSystem.playHeadless(todo[i].m, todo[i].comp);
        if (i % 10 === 9) { prog(0.05 + 0.6 * i / todo.length, tx('Maçlar oynanıyor', 'Playing matches')); await nextTick(); }
      }
      prog(0.68, tx('Kupalar ve puan tabloları', 'Cups and league tables'));
      for (const cup of Cups.all()) {
        const wk = cup.rounds[cup.cur] && cup.rounds[cup.cur].wk;
        if (wk === w) Cups.advance(cup);
      }
      Leagues.invalidate();
      prog(0.74, tx('Haftalık finans', 'Weekly finances'));
      const key = S.season * 100 + w;
      if (S.finKey !== key) {
        for (const c of S.clubs) Economy.weekly(c);
        S.finKey = key;
      }
      prog(0.8, tx('Kondisyon, sakatlık ve gelişim', 'Condition, injuries and development'));
      Progression.weeklyAll(matchClubs);
      await nextTick();
      if (Calendar.isWindow(w)) { prog(0.88, tx('Transfer piyasası hareketli', 'The transfer market is busy')); ClubAI.windowPass(w); }
      else ClubAI.weeklyLineups();
      if (w === 1 || w === 16) Transfer.closeWindow();
      this.contractWarnings(w);
      for (const c of S.clubs) Economy.closeWeek(c);
      S.week = w + 1;
      S.scoutUsed = 0;
      if (S.week === 15) GameState.news(() => tx('Ara transfer dönemi açıldı (15. ve 16. haftalar).', 'The mid-season transfer window is open (weeks 15 and 16).'), { p: 1, k: 'transfer' });
      if (S.week === SEASON_WEEKS) Season.endOfSeason();
      const me = GameState.player();
      if (me && !me.autoManage) Squad.fixLineup(me);
      Sanity.check();
      prog(1, tx('Hazır', 'Ready'));
      return true;
    } finally {
      this.busy = false;
    }
  },
  contractWarnings(w) {
    const me = GameState.player();
    if (!me || me.autoManage || (w !== 20 && w !== 27)) return;
    const exp = GameState.rosterGlads(me).filter(g => g.con && g.con.yrs <= 1);
    if (exp.length) GameState.news(() => tx(`Sözleşmesi sezon sonunda bitecek gladyatörler: ${exp.map(g => cn(g)).join(', ')}. Profil ekranından uzatabilirsiniz.`, `Contracts expiring at the end of the season: ${exp.map(g => cn(g)).join(', ')}. Extend them from the profile screen.`), { p: 1, k: 'transfer' });
  }
};

// ---------------------------------------------------------------- sanity / repair
const Sanity = {
  issues: [],
  check(repair = true) {
    const issues = [];
    const seen = new Set();
    for (const c of S.clubs) {
      c.roster = c.roster.filter(id => {
        const g = S.glads[id];
        const ok = g && g.club === c.id && !seen.has(id);
        if (!ok) issues.push('roster ' + c.id + ' bad ' + id);
        seen.add(id);
        return ok || !repair;
      });
      if (c.roster.length > 5) {
        issues.push('roster>5 ' + c.id);
        if (repair) while (c.roster.length > 5) Transfer.detach(S.glads[c.roster[c.roster.length - 1]]);
      }
      if (!isFinite(c.budget)) { issues.push('budget NaN ' + c.id); c.budget = 0; }
      if (!isFinite(c.rep)) c.rep = 20;
      if (!isFinite(c.arrears) || c.arrears < 0) c.arrears = 0;
      if (!isFinite(c.fans)) c.fans = 300;
      Squad.fixLineup(c);
    }
    for (const id in S.glads) {
      const g = S.glads[id];
      if (g.club >= 0 && (!S.clubs[g.club] || !S.clubs[g.club].roster.includes(g.id))) {
        issues.push('orphan ' + id);
        if (repair) { g.club = -1; g.con = null; }
      }
      for (const k of ['str', 'end', 'agi', 'tec', 'dis', 'cha', 'cond', 'mor', 'ovr', 'pot', 'ppot', 'xp']) {
        if (!isFinite(g[k])) { issues.push('nan ' + k + ' ' + id); g[k] = k === 'xp' ? 0 : 40; }
      }
      if (g.club >= 0 && !g.con) { g.con = { wage: TransferMath.expectedWage(g), yrs: 1, sign: 0, winB: 0, titleB: 0 }; issues.push('nocon ' + id); }
      for (const slot of ['w', 'a', 'x']) {
        const it = S.items[g.eq[slot]];
        if (g.eq[slot] && (!it || it.club !== g.club || it.g !== g.id)) { g.eq[slot] = 0; issues.push('eq ' + id); }
      }
    }
    for (const iid in S.items) {
      const it = S.items[iid];
      if (!S.clubs[it.club]) { delete S.items[iid]; continue; }
      if (it.g && (!S.glads[it.g] || S.glads[it.g].eq[ITEM_TYPES[it.t].slot] !== it.id)) it.g = 0;
    }
    for (const lg of S.leagues) for (const rd of lg.rounds) for (const m of rd) if (!S.clubs[m.h] || !S.clubs[m.a]) issues.push('fixture club missing');
    this.issues = issues;
    return issues;
  }
};
