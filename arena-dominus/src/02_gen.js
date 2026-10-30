/* =========================================================================
   GameState + GladiatorGenerator + WorldGenerator
   ========================================================================= */

// Global live state. S = serialisable game state, R = world RNG (state mirrored into S.rng on save)
let S = null;
let R = null;

const GameState = {
  glad(id) { return S && S.glads[id] || null; },
  club(id) { return S && S.clubs[id] || null; },
  player() { return S ? S.clubs[S.player] : null; },
  league(i) { return S.leagues[i]; },
  leagueOf(club) { return S.leagues[club.lg]; },
  leagueIndex(regIdx, tier) { return regIdx * 6 + (tier - 1); },
  regIdx(regId) { return REGIONS.findIndex(r => r.id === regId); },
  item(id) { return S.items[id] || null; },
  newId(kind) { const v = S.nid[kind]++; return v; },
  isPlayerClub(cid) { return cid === S.player; },
  rosterGlads(club) { return club.roster.map(id => S.glads[id]).filter(Boolean); },
  freeAgents() { const out = []; for (const id in S.glads) { const g = S.glads[id]; if (g.club < 0) out.push(g); } return out; },
  // text may be a plain string or a function producing it; functions are stored in both languages
  news(text, opt = {}) {
    S.news.unshift({ s: S.season, w: S.week, t: bi(text), p: opt.p ? 1 : 0, k: opt.k || 'gen' });
    if (S.news.length > 120) S.news.length = 120;
  },
  syncRng() { if (S && R) S.rng = R.state(); },
  // club names are stored in both languages (nt/ne); c.n always holds the active one
  applyLang() { if (!S) return; for (const c of S.clubs) if (c.nt) c.n = I18N.lang === 'en' ? (c.ne || c.nt) : c.nt; }
};

// ---------------------------------------------------------------- gladiators
const GladiatorGenerator = {
  pickClass(reg) {
    const prefs = REGION_BY_ID[reg].cls;
    return R.weighted(CLASS_IDS, c => prefs[c]);
  },
  pickName(reg) {
    // 12% chance of a name from another region (migration / mixed heritage)
    const src = R.chance(0.12) ? R.pick(REGIONS).id : reg;
    const N = NAMES[src];
    return R.pick(N.f) + ' ' + R.pick(N.l);
  },
  makeLook(reg, age) {
    const skinByReg = { valeria: [1, 2, 3], theskara: [0, 1, 2], nemeris: [3, 4, 5], aegion: [1, 2, 3], dravok: [0, 1, 2] };
    let sk = R.chance(0.15) ? R.int(0, 5) : R.pick(skinByReg[reg]);
    let hc = R.weighted([0, 1, 2, 3, 4], i => [3, 3, 2, 1, reg === 'dravok' || reg === 'theskara' ? 1.6 : 0.5][i]);
    if (age > 31 && R.chance((age - 31) * 0.09)) hc = 5; // greying
    return {
      sk, hc,
      hs: R.int(0, 6), bd: R.weighted([0, 1, 2, 3, 4, 5], i => [2.2, 1.5, 1.4, 1.2, 0.6, 0.7][i]),
      jw: r1(R.range(0.86, 1.14)), ns: R.int(0, 2), br: r1(R.range(0, 1)), ey: R.int(0, 2),
      bw: r1(R.range(0.92, 1.12)), ht: r1(R.range(0.95, 1.05)), sc: R.chance(0.18) ? 1 : 0,
      ac: R.int(0, 5), pl: R.int(0, 4)
    };
  },
  create(opts) {
    const reg = opts.reg || R.pick(REGIONS).id;
    const cls = opts.cls || this.pickClass(reg);
    const age = opts.age != null ? opts.age : clamp(Math.round(R.normal(26.5, 4)), 18, 36);
    const target = clamp(opts.ovr != null ? opts.ovr : 45, 12, 94);
    const C = CLASSES[cls], B = REGION_BY_ID[reg].bias;
    const g = {
      id: GameState.newId('g'), n: this.pickName(reg), age, reg, cls,
      str: 0, end: 0, agi: 0, tec: 0, dis: 0, cha: 0, ovr: 0, pot: 0, ppot: 0,
      grow: r1(clamp(R.normal(1, 0.18), 0.6, 1.45)),
      inj: Math.round(clamp(Math.exp(R.normal(0, 0.3)), 0.5, 1.9) * 100) / 100,
      loy: R.int(10, 95), clu: Math.round(clamp(R.normal(50, 18), 1, 99)),
      pk: r1(clamp(R.normal(28.5, 1.6), 25, 32)),
      cond: 100, mor: 65, injury: null, club: -1, con: null, xp: 0,
      look: this.makeLook(reg, age), eq: { w: 0, a: 0, x: 0 },
      ss: this.blankStats(), cs: this.blankStats(), aw: [], hist: [], joined: null, fw: 0, val: 0
    };
    const keys = ['str', 'end', 'agi', 'tec', 'dis'];
    for (const k of keys) g[k] = target + (C.w[k] - 0.2) * 70 + B[k] + R.normal(0, 6);
    let o = ovrOf(g);
    const shift = target - o;
    for (const k of keys) g[k] = r1(clamp(g[k] + shift, 6, 98));
    g.cha = Math.round(clamp(R.normal(40 + (target - 45) * 0.45, 14), 5, 95));
    g.ovr = r1(ovrOf(g));
    const gapMean = age <= 19 ? 11 : age <= 21 ? 8.5 : age <= 23 ? 6 : age <= 25 ? 4 : age <= 27 ? 2.2 : age <= 29 ? 1 : 0.3;
    let gap = Math.max(0, R.normal(gapMean, gapMean * 0.55 + 1));
    if (age <= 23 && R.next() < 0.06) gap += R.range(8, 14); // rare hidden gem
    if (opts.potBoost) gap += opts.potBoost;
    g.pot = r1(clamp(opts.pot != null ? opts.pot : g.ovr + gap, g.ovr, 97));
    g.ppot = r1(clamp(g.pot + R.normal(0, 6), g.ovr, 99));
    g.val = TransferMath.value(g);
    return g;
  },
  blankStats() { return { m: 0, w: 0, ko: 0, dmg: 0, tk: 0, sv: 0, blk: 0 }; },
  // temporary arena fighter for matches where a club has <3 healthy gladiators. Never stored.
  tempFighter(tier, seed, slot) {
    const rng = new RNG(seed ^ (slot * 7919));
    const cls = CLASS_IDS[rng.int(0, 5)];
    const base = clamp(TIERS[tier].ovr - 22 + rng.normal(0, 2), 14, 55);
    const g = {
      id: -1 - slot, temp: true, n: tx('Arena Dövüşçüsü', 'Arena Fighter'), age: rng.int(19, 34), reg: REGIONS[rng.int(0, 4)].id, cls,
      str: base + rng.normal(0, 3), end: base + rng.normal(0, 3), agi: base + rng.normal(0, 3), tec: base + rng.normal(0, 3), dis: base - 4, cha: 20,
      clu: 40, cond: 90, mor: 50, injury: null, eq: { w: 0, a: 0, x: 0 },
      look: { sk: rng.int(0, 5), hc: rng.int(0, 4), hs: rng.int(0, 6), bd: rng.int(0, 5), jw: 1, ns: rng.int(0, 2), br: 0.5, ey: 1, bw: 1, ht: 1, sc: 0, ac: 5, pl: 0 }
    };
    g.ovr = r1(ovrOf(g));
    return g;
  }
};

// ---------------------------------------------------------------- transfer maths (used by generator too)
const TransferMath = {
  value(g) {
    const base = ECON.valueBase * Math.pow(ECON.valueGrowth, num(g.ovr, 30));
    const a = g.age;
    const ageM = a <= 20 ? 1.35 : a <= 23 ? 1.22 : a <= 27 ? 1.0 : a <= 30 ? 0.82 : a <= 32 ? 0.62 : a <= 34 ? 0.45 : 0.3;
    const potM = 1 + clamp(num(g.ppot) - num(g.ovr), 0, 30) * 0.022 * (a <= 25 ? 1 : 0.4);
    const chaM = 1 + (num(g.cha, 40) - 50) * 0.003;
    const injM = g.injury && g.injury.l === 3 ? 0.88 : 1;
    return Math.max(100, Math.round(base * ageM * potM * chaM * injM / 10) * 10);
  },
  expectedWage(g) {
    return Math.max(12, Math.round(this.value(g) * ECON.wageRate));
  }
};

// ---------------------------------------------------------------- world
const WorldGenerator = {
  clubNames(reg) {
    const out = new Map();
    const cities = CITIES[reg];
    let guard = 0;
    while (out.size < 48 && guard++ < 5000) {
      const r = R.next();
      let n;
      if (r < 0.38) { const st = R.pick(LUDUS_STEMS); n = ['Ludus ' + st, 'Ludus ' + st]; }
      else if (r < 0.86) { const c = R.pick(cities), sf = R.pick(CLUB_SUFFIX); n = [c + ' ' + sf[0], c + ' ' + sf[1]]; }
      else { const c = R.pick(cities); n = [c + ' Ludusu', c + ' Ludus']; }
      if (!out.has(n[0])) out.set(n[0], n);
    }
    return [...out.values()];
  },
  crest(reg) {
    const pal = REGION_BY_ID[reg].pal;
    const regCols = [pal.a, pal.b, pal.d];
    const c1 = R.chance(0.6) ? R.pick(regCols) : R.pick(CREST_COLORS);
    let c2 = R.pick(CREST_COLORS); let guard = 0;
    while (c2 === c1 && guard++ < 10) c2 = R.pick(CREST_COLORS);
    return { sh: R.int(0, CREST_SHAPES.length - 1), sy: R.int(0, CREST_SYMBOLS.length - 1), c1, c2 };
  },
  staffMember(reg, q) {
    const N = NAMES[reg];
    q = Math.round(clamp(q, 5, 95));
    return { n: R.pick(N.f) + ' ' + R.pick(N.l), q, w: Economy.staffWage(q) };
  },
  pickPolicy(tier) {
    const w = { rich: tier <= 2 ? 2.2 : tier <= 4 ? 0.8 : 0.3, talent: 1.2, econ: tier >= 4 ? 1.6 : 0.7, def: 1, agg: 1 };
    return R.weighted(Object.keys(w), k => w[k]);
  },
  addItem(club, type, q, plus = 0) {
    const id = GameState.newId('i');
    S.items[id] = { id, t: type, q, p: plus, club: club.id, g: 0 };
    return S.items[id];
  },
  randomItemFor(club, g, slot, q) {
    const types = Object.keys(ITEM_TYPES).filter(t => ITEM_TYPES[t].slot === slot && ITEM_TYPES[t].cls.includes(g.cls));
    if (!types.length) return null;
    const it = this.addItem(club, R.pick(types), q, 0);
    Equipment.equip(it.id, g.id, true);
    return it;
  },
  makeClub(id, reg, tier, name) {
    const T = TIERS[tier];
    const pol = this.pickPolicy(tier);
    const off = R.normal(0, 2.4);
    const club = {
      id, n: Array.isArray(name) ? name[0] : name, nt: Array.isArray(name) ? name[0] : name, ne: Array.isArray(name) ? name[1] : name, reg, tier, lg: GameState.leagueIndex(GameState.regIdx(reg), tier),
      crest: this.crest(reg),
      rep: Math.round(clamp(T.rep + R.normal(0, 5) + off * 1.5, 3, 99)),
      fans: Math.round(R.range(T.fans[0], T.fans[1])),
      budget: Math.round(T.eco * R.range(5500, 13000) * (pol === 'rich' ? 1.5 : pol === 'econ' ? 0.95 : 1)),
      pol,
      fac: { train: R.int(T.fac[0], T.fac[1]), med: R.int(T.fac[0], T.fac[1]), scout: R.int(T.fac[0], T.fac[1]), arena: R.int(T.fac[0], T.fac[1]) },
      staff: {},
      roster: [], lineup: [], tactic: 'balanced',
      riv: {}, arrears: 0, loan: null, loanSeason: 0,
      sponsor: null,
      seasonFin: Economy.blankFin(), weekFin: Economy.blankFin(), finHist: [],
      st: { w: 0, l: 0, ko: 0, homeW: 0 },
      hist: [], trophies: [], off, isPlayer: false
    };
    if (tier === 1 && club.fac.arena < 4) club.fac.arena = R.chance(0.6) ? 4 : club.fac.arena;
    if (tier === 2 && club.fac.arena < 3) club.fac.arena = 3;
    if (tier === 3 && club.fac.arena < 2) club.fac.arena = 2;
    for (const s of STAFF_IDS) club.staff[s] = this.staffMember(reg, R.range(T.staff[0], T.staff[1]));
    return club;
  },
  fillRoster(club, baseOvr, opts = {}) {
    const offs = [3.2, 2, 1, -2.2, -4];
    const tier = club.tier;
    for (let i = 0; i < 5; i++) {
      const reg = R.chance(0.75) ? club.reg : R.pick(REGIONS).id;
      const target = baseOvr + offs[i] + club.off + R.normal(0, 2.6);
      const g = GladiatorGenerator.create({ reg, ovr: target, age: opts.age ? opts.age() : undefined });
      S.glads[g.id] = g;
      Transfer.attach(g, club, {
        wage: Math.round(TransferMath.expectedWage(g) * R.range(0.85, 1.12)),
        yrs: R.int(1, 4), sign: 0
      }, true);
      // starting equipment
      if (!opts.noItems) {
        const qMean = (6 - tier) * 0.72;
        for (const slot of ['w', 'a', 'x']) {
          if (R.chance(0.22 + (6 - tier) * 0.15)) {
            const q = clamp(Math.round(R.normal(qMean, 0.75)), 0, 4);
            this.randomItemFor(club, g, slot, q);
          }
        }
      }
    }
    ClubAI.pickLineup(club);
  },
  generate(seed) {
    R = new RNG(seed);
    S = {
      v: SAVE_VERSION, gv: GAME_VERSION, seed, rng: null, season: 1, week: 0, player: -1,
      clubs: [], glads: {}, items: {}, nid: { g: 1, i: 1, o: 1 },
      leagues: [], rcups: {}, icup: null, icupQual: [],
      news: [], hist: { seasons: [], retired: [], records: {}, champs: [] },
      transfers: [], offers: [], nego: {}, scout: {}, scoutUsed: 0,
      sponsorOffers: [], staffCands: null,
      flags: { tut: 0, done: {} }, settings: { sound: true }, created: Date.now()
    };
    let cid = 0;
    REGIONS.forEach((reg, ri) => {
      const names = R.shuffle(this.clubNames(reg.id));
      for (let tier = 1; tier <= 6; tier++) {
        const lgClubs = [];
        for (let k = 0; k < 8; k++) {
          const club = this.makeClub(cid, reg.id, tier, names[(tier - 1) * 8 + k]);
          S.clubs.push(club);
          lgClubs.push(cid);
          cid++;
        }
        S.leagues.push({ id: ri * 6 + tier - 1, reg: reg.id, tier, clubs: lgClubs, rounds: [] });
      }
    });
    for (const club of S.clubs) this.fillRoster(club, TIERS[club.tier].ovr);
    // free agent pool
    for (let i = 0; i < 200; i++) {
      const t = R.weighted([1, 2, 3, 4, 5, 6], x => [0.04, 0.08, 0.14, 0.2, 0.26, 0.28][x - 1]);
      const g = GladiatorGenerator.create({ ovr: TIERS[t].ovr - 4 + R.normal(0, 4) });
      g.fw = R.int(0, 6);
      S.glads[g.id] = g;
    }
    // historical rivalries
    for (const lg of S.leagues) {
      for (let k = 0; k < 2; k++) {
        const a = R.pick(lg.clubs), b = R.pick(lg.clubs);
        if (a !== b) Rivalry.add(a, b, R.int(18, 42));
      }
    }
    for (const club of S.clubs) club.goal = ClubAI.seasonGoal(club);
    Leagues.createAllFixtures();
    Cups.createRegionalAll();
    GameState.news(() => tx('İmparatorluk Kupası ilk sezonda düzenlenmez; katılımcılar bu sezon Altın Kolezyum liglerini ilk iki sırada bitiren kulüplerden belirlenecek.', 'The Imperial Cup is not held in the first season; its entrants will be the clubs finishing in the top two of this season\'s Golden Colosseum leagues.'), { k: 'cup' });
    GameState.applyLang();
    GameState.syncRng();
    return S;
  },

  // --- career start A: build a new ludus replacing a tier-6 club in region
  createNewLudus(regId, name, crest) {
    const ri = GameState.regIdx(regId);
    const lg = S.leagues[GameState.leagueIndex(ri, 6)];
    const replaceId = R.pick(lg.clubs);
    const old = S.clubs[replaceId];
    // release the old club's gladiators into the free market (nobody is deleted)
    for (const gid of old.roster.slice()) Transfer.detach(S.glads[gid], { reason: 'Kulüp el değiştirdi' });
    for (const iid in S.items) if (S.items[iid].club === old.id) delete S.items[iid];
    for (const c of S.clubs) if (c.riv[old.id]) delete c.riv[old.id];
    const club = this.makeClub(replaceId, regId, 6, name);
    club.crest = crest;
    club.rep = 14; club.fans = 380; club.budget = ECON.startCash; club.pol = 'econ'; club.off = 0;
    club.fac = { train: 1, med: 1, scout: 1, arena: 1 };
    for (const s of STAFF_IDS) club.staff[s] = this.staffMember(regId, R.range(18, 28));
    club.roster = []; club.riv = {};
    S.clubs[replaceId] = club;
    // five low level gladiators, varied classes
    const classes = R.shuffle(CLASS_IDS.slice()).slice(0, 5);
    for (let i = 0; i < 5; i++) {
      const g = GladiatorGenerator.create({ reg: R.chance(0.8) ? regId : R.pick(REGIONS).id, cls: classes[i], ovr: R.range(36, 41), age: R.int(19, 29) });
      S.glads[g.id] = g;
      Transfer.attach(g, club, { wage: TransferMath.expectedWage(g), yrs: R.int(2, 3), sign: 0 }, true);
    }
    ClubAI.pickLineup(club);
    club.goal = ClubAI.seasonGoal(club);
    return club;
  },
  setPlayer(clubId, isNew) {
    S.player = clubId;
    const c = S.clubs[clubId];
    c.isPlayer = true;
    c.newLudus = !!isNew;
    // player club starts with a few basic items in inventory so the equipment screen is meaningful
    if (isNew) {
      const g0 = GameState.rosterGlads(c)[0];
      if (g0) this.randomItemFor(c, g0, 'a', 0);
    }
    for (const gid of c.roster) S.scout[gid] = 2;
    Sponsors.generateOffers();
    Staff.generateCandidates();
    GameState.news(() => tx(`${cn(c)} yönetimini devraldınız. ${TIERS[c.tier].n} (${REGION_BY_ID[c.reg].name}) sizi bekliyor!`, `You have taken charge of ${cn(c)}. The ${TIERS[c.tier].n} (${REGION_BY_ID[c.reg].name}) awaits!`), { p: 1, k: 'club' });
    GameState.syncRng();
  }
};

const Rivalry = {
  add(a, b, v) {
    if (a === b) return;
    const A = S.clubs[a], B = S.clubs[b];
    if (!A || !B) return;
    A.riv[b] = Math.round(clamp((A.riv[b] || 0) + v, 0, 100));
    B.riv[a] = Math.round(clamp((B.riv[a] || 0) + v, 0, 100));
  },
  get(a, b) { const A = S.clubs[a]; return A ? (A.riv[b] || 0) : 0; },
  decay() {
    for (const c of S.clubs) for (const k in c.riv) { c.riv[k] = Math.round(c.riv[k] * 0.88); if (c.riv[k] < 3) delete c.riv[k]; }
  }
};
