/* =========================================================================
   LeagueManager (Leagues) + CupManager (Cups) + CalendarManager (Calendar)
   + MatchSystem (team building, headless play, result recording)
   ========================================================================= */

const Leagues = {
  createFixtures(lg) {
    const arr = R.shuffle(lg.clubs.slice());
    const n = arr.length; // 8
    const rounds = [];
    let rot = arr.slice(1);
    for (let r = 0; r < n - 1; r++) {
      const cur = [arr[0], ...rot];
      const ms = [];
      for (let i = 0; i < n / 2; i++) {
        const a = cur[i], b = cur[n - 1 - i];
        const flip = i === 0 ? (r % 2 === 1) : ((r + i) % 2 === 1);
        ms.push(flip ? { h: b, a, r: null } : { h: a, a: b, r: null });
      }
      rounds.push(ms);
      rot = [rot[rot.length - 1], ...rot.slice(0, -1)];
    }
    for (let r = 0; r < n - 1; r++) rounds.push(rounds[r].map(m => ({ h: m.a, a: m.h, r: null })));
    lg.rounds = rounds;
    lg.tableCache = null;
  },
  createAllFixtures() { for (const lg of S.leagues) this.createFixtures(lg); },
  rows(lg) {
    const rows = {};
    for (const cid of lg.clubs) rows[cid] = { cid, p: 0, w: 0, l: 0, pts: 0, kf: 0, ka: 0, hp: 0, form: [] };
    for (const rd of lg.rounds) for (const m of rd) {
      if (!m.r) continue;
      const H = rows[m.h], A = rows[m.a];
      if (!H || !A) continue;
      H.p++; A.p++;
      H.kf += m.r.hk; H.ka += m.r.ak; A.kf += m.r.ak; A.ka += m.r.hk;
      H.hp += m.r.hh; A.hp += m.r.ah;
      if (m.r.w === 0) { H.w++; H.pts += 3; A.l++; H.form.push('G'); A.form.push('M'); }
      else { A.w++; A.pts += 3; H.l++; A.form.push('G'); H.form.push('M'); }
    }
    return rows;
  },
  table(lg) {
    if (lg.tableCache) return lg.tableCache;
    const rows = this.rows(lg);
    const list = Object.values(rows);
    list.sort((a, b) => b.pts - a.pts || b.w - a.w);
    // resolve ties group-wise: head-to-head, elimination diff, remaining hp, deterministic (rep, id)
    const out = [];
    let i = 0;
    while (i < list.length) {
      let j = i; while (j + 1 < list.length && list[j + 1].pts === list[i].pts && list[j + 1].w === list[i].w) j++;
      const grp = list.slice(i, j + 1);
      if (grp.length > 1) {
        const ids = new Set(grp.map(r => r.cid));
        const h2h = {}; for (const r of grp) h2h[r.cid] = 0;
        for (const rd of lg.rounds) for (const m of rd) {
          if (!m.r || !ids.has(m.h) || !ids.has(m.a)) continue;
          h2h[m.r.w === 0 ? m.h : m.a] += 3;
        }
        grp.sort((a, b) => (h2h[b.cid] - h2h[a.cid]) || ((b.kf - b.ka) - (a.kf - a.ka)) || (b.hp - a.hp) ||
          (S.clubs[b.cid].rep - S.clubs[a.cid].rep) || (a.cid - b.cid));
      }
      out.push(...grp);
      i = j + 1;
    }
    out.forEach((r, k) => { r.rank = k + 1; r.form = r.form.slice(-5); });
    lg.tableCache = out;
    return out;
  },
  rankOf(cid) {
    const c = S.clubs[cid]; if (!c) return 0;
    const t = this.table(S.leagues[c.lg]);
    const r = t.find(x => x.cid === cid);
    return r ? r.rank : 0;
  },
  invalidate() { for (const lg of S.leagues) lg.tableCache = null; },
  played(lg) { let n = 0; for (const rd of lg.rounds) for (const m of rd) if (m.r) n++; return n; }
};

const Cups = {
  // display name from the cup key (works for old saves too)
  nameOf(c) {
    const key = typeof c === 'string' ? c : c && c.key;
    if (!key) return '';
    if (key === 'imp') return tx('İmparatorluk Kupası', 'Imperial Cup');
    const r = REGION_BY_ID[key.slice(2)];
    return r ? tx(r.name + ' Kupası', r.name + ' Cup') : key;
  },
  draw(list, neutral) {
    const arr = R.shuffle(list.slice());
    const out = [];
    for (let i = 0; i + 1 < arr.length; i += 2) {
      let h = arr[i], a = arr[i + 1];
      const H = S.clubs[h], A = S.clubs[a];
      if (!neutral && H && A && A.tier > H.tier) { const t = h; h = a; a = t; } // lower-league club hosts
      out.push({ h, a, r: null, nt: neutral ? 1 : 0 });
    }
    return out;
  },
  createRegional(regId) {
    const ri = GameState.regIdx(regId);
    const clubs = [];
    for (let t = 1; t <= 6; t++) clubs.push(...S.leagues[GameState.leagueIndex(ri, t)].clubs);
    const byes = clubs.filter(c => S.clubs[c].tier <= 2);
    const r1 = clubs.filter(c => S.clubs[c].tier >= 3);
    const cup = {
      key: 'r_' + regId, name: REGION_BY_ID[regId].name + ' Kupası', reg: regId, season: S.season,
      byes, part: clubs.slice(), cur: 0, champ: -1, runner: -1,
      rounds: RCUP_ROUNDS.map((n, k) => ({ n, wk: RCUP_WEEKS[k], m: [] }))
    };
    cup.rounds[0].m = this.draw(r1, false);
    S.rcups[regId] = cup;
    return cup;
  },
  createRegionalAll() { S.rcups = {}; for (const r of REGIONS) this.createRegional(r.id); },
  createImperial(qual) {
    // qual: [{cid, rank, pts}] — 5 champions + 5 runners-up of last season's tier-1 leagues
    if (!qual || qual.length !== 10) { S.icup = null; return null; }
    const champs = qual.filter(q => q.rank === 1);
    const runners = qual.filter(q => q.rank === 2).sort((a, b) => b.pts - a.pts || (b.kd - a.kd) || a.cid - b.cid);
    const seeds = champs.map(q => q.cid).concat(runners[0].cid);
    const pre = runners.slice(1).map(q => q.cid);
    const cup = {
      key: 'imp', name: 'İmparatorluk Kupası', reg: null, season: S.season, seeds, part: qual.map(q => q.cid),
      cur: 0, champ: -1, runner: -1, rounds: ICUP_ROUNDS.map((n, k) => ({ n, wk: ICUP_WEEKS[k], m: [] }))
    };
    cup.rounds[0].m = this.draw(pre, true).map(m => ({ ...m, nt: 0 }));
    S.icup = cup;
    return cup;
  },
  all() { const out = Object.values(S.rcups); if (S.icup) out.push(S.icup); return out; },
  winnerOf(m) { return m.r ? (m.r.w === 0 ? m.h : m.a) : -1; },
  loserOf(m) { return m.r ? (m.r.w === 0 ? m.a : m.h) : -1; },
  // after a round has been fully played, draw the next round or crown champion
  advance(cup) {
    const rd = cup.rounds[cup.cur];
    if (!rd || !rd.m.length || rd.m.some(m => !m.r)) return false;
    const winners = rd.m.map(m => this.winnerOf(m));
    const last = cup.cur === cup.rounds.length - 1;
    if (last) {
      const f = rd.m[0];
      cup.champ = this.winnerOf(f); cup.runner = this.loserOf(f);
      cup.cur = cup.rounds.length;
      Season.onCupChampion(cup);
      return true;
    }
    let next = winners;
    if (cup.key !== 'imp' && cup.cur === 0) next = winners.concat(cup.byes);
    if (cup.key === 'imp' && cup.cur === 0) next = winners.concat(cup.seeds);
    cup.cur++;
    const isFinal = cup.cur === cup.rounds.length - 1;
    cup.rounds[cup.cur].m = this.draw(next, isFinal);
    return true;
  },
  // is the club still alive in this cup (not eliminated)?
  alive(cup, cid) {
    if (!cup.part.includes(cid)) return false;
    for (let k = 0; k < cup.rounds.length; k++) {
      for (const m of cup.rounds[k].m) if (m.r && this.loserOf(m) === cid) return false;
    }
    return cup.champ < 0 || cup.champ === cid;
  },
  roundReached(cup, cid) {
    // index of the furthest round the club appeared in (byes count as reaching round 2)
    let best = -1;
    cup.rounds.forEach((rd, k) => { if (rd.m.some(m => m.h === cid || m.a === cid)) best = k; });
    if (cup.champ === cid) best = cup.rounds.length;
    if (best < 0 && cup.byes && cup.byes.includes(cid)) best = 1;
    return best;
  }
};

const Calendar = {
  isWindow(week = S.week) { return WINDOW_WEEKS.includes(week); },
  windowLabel() {
    if (S.week <= 1) return tx('Sezon başı transfer dönemi açık', 'Pre-season transfer window open');
    if (S.week === 15 || S.week === 16) return tx('Ara transfer dönemi açık', 'Mid-season transfer window open');
    if (S.week < 15) return tx('Transfer dönemi 15. haftada açılacak', 'Transfer window opens in week 15');
    return tx('Transfer dönemi gelecek sezon başında açılacak', 'Transfer window opens next pre-season');
  },
  fixturesForWeek(week) {
    const out = [];
    const li = LEAGUE_WEEKS.indexOf(week);
    if (li >= 0) for (const lg of S.leagues) for (const m of lg.rounds[li]) out.push({ m, comp: { type: 'league', lg: lg.id, round: li } });
    const ci = RCUP_WEEKS.indexOf(week);
    if (ci >= 0) for (const cup of Object.values(S.rcups)) if (cup.rounds[ci]) for (const m of cup.rounds[ci].m) out.push({ m, comp: { type: 'rcup', key: cup.key, round: ci } });
    const ii = ICUP_WEEKS.indexOf(week);
    if (ii >= 0 && S.icup && S.icup.rounds[ii]) for (const m of S.icup.rounds[ii].m) out.push({ m, comp: { type: 'icup', key: 'imp', round: ii } });
    return out;
  },
  clubFixture(cid, week) {
    return this.fixturesForWeek(week).find(f => f.m.h === cid || f.m.a === cid) || null;
  },
  // upcoming fixtures for a club (known ones), including future cup placeholders
  upcoming(cid, n = 5) {
    const out = [];
    for (let w = S.week; w < SEASON_WEEKS && out.length < n; w++) {
      const f = this.clubFixture(cid, w);
      if (f) out.push({ w, ...f });
      else {
        const ci = RCUP_WEEKS.indexOf(w);
        const cup = S.rcups[S.clubs[cid].reg];
        if (ci >= 0 && cup && cup.cur < ci && Cups.alive(cup, cid)) out.push({ w, tbd: Cups.nameOf(cup) + ' — ' + RCUP_ROUNDS[ci] + tx(' (kura bekleniyor)', ' (awaiting draw)') });
        const ii = ICUP_WEEKS.indexOf(w);
        if (ii >= 0 && S.icup && S.icup.cur < ii && Cups.alive(S.icup, cid)) out.push({ w, tbd: Cups.nameOf('imp') + ' — ' + ICUP_ROUNDS[ii] + tx(' (kura bekleniyor)', ' (awaiting draw)') });
      }
    }
    return out;
  },
  compName(comp) {
    if (comp.type === 'league') { const lg = S.leagues[comp.lg]; return TIERS[lg.tier].s + ' · ' + tx((comp.round + 1) + '. Maç', 'Match ' + (comp.round + 1)); }
    if (comp.type === 'rcup') return Cups.nameOf(comp.key) + ' · ' + RCUP_ROUNDS[comp.round];
    return Cups.nameOf('imp') + ' · ' + ICUP_ROUNDS[comp.round];
  },
  pressure(comp) {
    if (comp.type === 'league') return 0.3;
    const rounds = comp.type === 'rcup' ? RCUP_ROUNDS.length : ICUP_ROUNDS.length;
    if (comp.round === rounds - 1) return 1;
    if (comp.round === rounds - 2) return 0.75;
    return 0.5;
  }
};

// ---------------------------------------------------------------- matches
const MatchSystem = {
  seedFor(m, comp) {
    return hashStr(S.seed + ':' + S.season + ':' + S.week + ':' + comp.type + ':' + m.h + '-' + m.a);
  },
  // returns 3 fighters (real healthy gladiators first, then temporary arena fighters)
  lineupGlads(club, seed) {
    const healthy = g => g && !g.injury;
    let ids = club.lineup.filter(id => club.roster.includes(id) && healthy(S.glads[id]));
    if (ids.length < 3) {
      const bench = club.roster.filter(id => !ids.includes(id) && healthy(S.glads[id]))
        .sort((a, b) => Squad.readiness(S.glads[b]) - Squad.readiness(S.glads[a]));
      while (ids.length < 3 && bench.length) ids.push(bench.shift());
    }
    const glads = ids.map(id => S.glads[id]);
    let k = 0;
    while (glads.length < 3) glads.push(GladiatorGenerator.tempFighter(club.tier, seed, k++));
    return glads;
  },
  sideSetup(club, opp, seed, auto) {
    let tactic = club.tactic;
    if (!club.isPlayer || club.autoManage) tactic = ClubAI.chooseTactic(club, opp);
    return {
      cid: club.id, name: club.n, tactic, auto, colors: [club.crest.c1, club.crest.c2],
      glads: this.lineupGlads(club, seed)
    };
  },
  build(m, comp, opts = {}) {
    const seed = this.seedFor(m, comp);
    const H = S.clubs[m.h], A = S.clubs[m.a];
    const live = opts.live && (H.isPlayer || A.isPlayer);
    const setup = {
      seed, pressure: Calendar.pressure(comp), headless: !live,
      sides: [
        this.sideSetup(H, A, seed, !(live && H.isPlayer)),
        this.sideSetup(A, H, seed, !(live && A.isPlayer))
      ]
    };
    return setup;
  },
  playHeadless(m, comp) {
    const setup = this.build(m, comp, { live: false });
    const match = CombatEngine.create(setup);
    const res = CombatEngine.run(match);
    this.record(m, comp, res, setup);
    return res;
  },
  // store the result and apply all post-match consequences exactly once
  record(m, comp, res, setup) {
    if (m.r) return; // idempotent: never double-record
    m.r = {
      w: res.w, hs: res.surv[0], as: res.surv[1], hk: res.ko[0], ak: res.ko[1],
      hh: Math.round(res.hpp[0] * 100), ah: Math.round(res.hpp[1] * 100), t: Math.round(res.t), y: res.why
    };
    const H = S.clubs[m.h], A = S.clubs[m.a];
    const winC = res.w === 0 ? H : A, loseC = res.w === 0 ? A : H;
    const ovrH = Squad.teamOvr(setup.sides[0].glads), ovrA = Squad.teamOvr(setup.sides[1].glads);
    const isLeague = comp.type === 'league';
    // gladiator consequences
    for (const u of res.units) {
      if (u.temp) continue;
      const g = S.glads[u.gid]; if (!g) continue;
      const won = u.side === res.w;
      const oppOvr = u.side === 0 ? ovrA : ovrH;
      Progression.afterMatch(g, u, won, oppOvr, isLeague);
    }
    // club consequences
    for (const [c, side] of [[H, 0], [A, 1]]) {
      const won = res.w === side;
      if (won) c.st.w++; else c.st.l++;
      c.st.ko += res.ko[side];
      if (won && side === 0 && isLeague) c.st.homeW++;
      if (isLeague) Economy.credit(c, 'prizes', (won ? ECON.winPrize : ECON.lossPrize) * tierEco(c.tier));
      Reputation.afterMatch(c, won, side === 0 ? A : H);
      // win bonuses from contracts
      if (won) {
        const ids = setup.sides[side].glads.filter(g => !g.temp).map(g => g.id);
        for (const id of ids) { const g = S.glads[id]; if (g && g.con && g.con.winB > 0 && g.club === c.id) Economy.debit(c, 'bonuses', g.con.winB, true); }
      }
    }
    if (!m.nt) Economy.matchday(H, A, comp);
    // cup prize money for round winner
    if (comp.type === 'rcup') Economy.credit(winC, 'prizes', ECON.rcupPrize[comp.round] * Math.pow(tierEco(winC.tier), 0.7));
    if (comp.type === 'icup') Economy.credit(winC, 'prizes', ECON.icupPrize[comp.round]);
    Rivalry.add(H.id, A.id, comp.type === 'league' ? 1 : (comp.round >= 3 ? 6 : 3));
    Leagues.invalidate();
    News.onMatch(m, comp, res, H, A, ovrH, ovrA);
  }
};
