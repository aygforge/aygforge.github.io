/* =========================================================================
   TransferManager (Transfer) + ClubAI
   ========================================================================= */

const Transfer = {
  windowId() { return S.season * 10 + (S.week <= 1 ? 0 : 1); },
  attach(g, club, con, silent) {
    g.club = club.id;
    g.con = { wage: Math.max(1, Math.round(num(con.wage, 20))), yrs: clamp(con.yrs | 0, 1, 5), sign: Math.round(num(con.sign)), winB: Math.round(num(con.winB, Math.round(con.wage * 0.25))), titleB: Math.round(num(con.titleB, Math.round(con.wage * 4))) };
    if (!club.roster.includes(g.id)) club.roster.push(g.id);
    g.joined = { s: S.season, w: S.week };
    g.fw = 0;
    g.hist.push({ s: S.season, w: S.week, c: club.id });
    if (g.hist.length > 20) g.hist.shift();
  },
  detach(g, opts = {}) {
    const club = g.club >= 0 ? S.clubs[g.club] : null;
    if (club) {
      club.roster = club.roster.filter(id => id !== g.id);
      club.lineup = club.lineup.filter(id => id !== g.id);
      Equipment.unequipAll(g);
      if (!club.isPlayer || club.autoManage) ClubAI.pickLineup(club); else Squad.fixLineup(club);
    }
    g.club = -1; g.con = null; g.fw = 0;
    delete S.nego[g.id];
  },
  record(g, from, to, fee, type) {
    const rec = { s: S.season, w: S.week, g: g.id, n: g.n, f: from, t: to, fee: Math.round(fee), ty: type, ovr: Math.round(g.ovr) };
    S.transfers.unshift(rec);
    if (S.transfers.length > 400) S.transfers.length = 400;
    const r = S.hist.records;
    if (fee > 0 && (!r.bigTransfer || fee > r.bigTransfer.fee)) r.bigTransfer = rec;
  },
  // full move from seller (may be -1 for free agent) to buyer
  execute(g, buyer, fee, con, type) {
    const fromId = g.club;
    const seller = fromId >= 0 ? S.clubs[fromId] : null;
    if (buyer.roster.length >= 5) return { ok: false, msg: 'Kadro dolu (en fazla 5 gladyatör).' };
    if (fee > 0) {
      if (!Economy.debit(buyer, 'transfers', fee, false)) return { ok: false, msg: 'Bonservis için yeterli bütçe yok.' };
      if (seller) Economy.credit(seller, 'transfers', fee);
    }
    if (con.sign > 0) {
      if (!Economy.debit(buyer, 'signing', con.sign, false)) {
        if (fee > 0) { buyer.budget += fee; if (seller) seller.budget -= fee; }
        return { ok: false, msg: 'İmza parası için yeterli bütçe yok.' };
      }
    }
    this.detach(g, { reason: 'transfer' });
    this.attach(g, buyer, con);
    if (!buyer.isPlayer || buyer.autoManage) { ClubAI.pickLineup(buyer); Equipment.autoEquip(buyer); } else Squad.fixLineup(buyer);
    this.record(g, fromId, buyer.id, fee, type);
    if (seller) Rivalry.add(seller.id, buyer.id, fee > TransferMath.value(g) * 0.8 && g.ovr > TIERS[buyer.tier].ovr + 3 ? 5 : 1);
    const big = fee >= 12000 || g.ovr >= 75;
    if (buyer.isPlayer || (seller && seller.isPlayer)) {
      GameState.news(fromId >= 0
        ? `${g.n} (${CLASSES[g.cls].name}, ${Math.round(g.ovr)}) ${seller.n} → ${buyer.n} transferi tamamlandı. Bonservis: ${fmtGold(fee)}.`
        : `Serbest gladyatör ${g.n} (${CLASSES[g.cls].name}, ${Math.round(g.ovr)}) ${buyer.n} ile sözleşme imzaladı.`, { p: 1, k: 'transfer' });
    } else if (big) {
      GameState.news(`${REGION_BY_ID[buyer.reg].name}: ${seller ? seller.n + ' kulübünün yıldızı ' : ''}${g.n}, ${buyer.n}'e ${fee ? fmtGold(fee) + ' bedelle ' : ''}transfer oldu.`, { k: 'transfer' });
    }
    if (buyer.isPlayer) S.scout[g.id] = Math.max(S.scout[g.id] || 0, 2);
    return { ok: true };
  },

  // ---------- club side (bonservis)
  askingPrice(seller, g) {
    let f = 1.15;
    if (seller.lineup.includes(g.id)) f *= 1.3;
    if (seller.roster.length <= 3) f *= 1.5;
    if (g.con && g.con.yrs <= 1) f *= 0.8;
    if (seller.arrears > 0 || seller.budget < Economy.weeklyCost(seller) * 3) f *= 0.85;
    if (seller.pol === 'econ') f *= 0.95;
    if (seller.pol === 'rich') f *= 1.25;
    f *= 0.97 + hash01(g.id, this.windowId()) * 0.08;
    return Math.round(TransferMath.value(g) * f / 50) * 50;
  },
  evaluateBid(seller, g, fee) {
    const ask = this.askingPrice(seller, g);
    const ratio = fee / ask;
    if (ratio >= 1) return { res: 'accept', ask };
    if (ratio >= 0.75) return { res: 'counter', ask, counter: ask };
    return { res: 'reject', ask };
  },

  // ---------- gladiator side (contract)
  prefYears(g) { return g.age <= 24 ? 2 : g.age <= 31 ? 3 : 2; },
  demand(g, club, renewal) {
    let m = 1;
    const cur = g.club >= 0 ? S.clubs[g.club] : null;
    if (cur && !renewal) {
      const diff = club.tier - cur.tier;
      if (diff > 0) m *= 1 + 0.14 * diff; else if (diff < 0) m *= Math.max(0.82, 1 + 0.05 * diff);
      m *= 1 + (g.loy - 50) / 400;
    }
    m *= 1 + (45 - club.rep) * 0.0025;
    if (renewal) { m *= 1 - (g.loy - 50) / 300; m *= 1 + (60 - g.mor) / 300; }
    if (!cur) m *= 1 - Math.min(0.3, num(g.fw) * 0.012);
    if (club.arrears > 0) m *= 1.15;
    // ambition: a fighter far above the club's league level wants a premium to join (or stay)
    const gap = g.ovr - TIERS[club.tier].ovr - 12;
    if (gap > 0) m *= 1 + gap * (renewal ? 0.015 : 0.035);
    const wage = Math.max(10, Math.round(TransferMath.expectedWage(g) * m));
    const free = !cur;
    return { wage, yrs: this.prefYears(g), sign: Math.round(wage * (free ? 8 : renewal ? 3 : 4)), winB: Math.round(wage * 0.25), titleB: Math.round(wage * 4) };
  },
  offerValue(o, pref) {
    return (o.wage + o.sign / (30 * clamp(o.yrs, 1, 3)) * 0.9 + o.winB * 0.35 + o.titleB * 0.04) * (1 - 0.04 * Math.abs(o.yrs - pref));
  },
  evaluateContract(g, club, offer, nego, renewal) {
    const d = this.demand(g, club, renewal);
    const pref = d.yrs;
    const need = this.offerValue({ ...d, winB: d.winB, titleB: d.titleB }, pref);
    const got = this.offerValue(offer, pref);
    const ratio = got / need;
    const tol = (hash01(g.id, this.windowId() + 3) - 0.5) * 0.06;
    if (ratio >= 1 + tol) return { res: 'accept', d };
    if (nego) nego.pat -= ratio >= 0.8 ? 1 : 2;
    if (nego && nego.pat <= 0) return { res: 'walk', d };
    // the wage that would satisfy him with the other terms unchanged
    const otherParts = got / (1 - 0.04 * Math.abs(offer.yrs - pref)) - offer.wage;
    const needWage = Math.ceil((need * (1 + tol) / (1 - 0.04 * Math.abs(offer.yrs - pref)) - otherParts) / 5) * 5;
    return { res: 'counter', d, needWage: Math.max(offer.wage + 5, needWage), insult: ratio < 0.8 };
  },
  // ---------- player-facing negotiation flow
  nego(gid) {
    let n = S.nego[gid];
    if (n && n.win !== this.windowId() && !n.renew) { delete S.nego[gid]; n = null; }
    return n;
  },
  startNego(g, renew) {
    const n = { gid: g.id, win: this.windowId(), stage: renew || g.club < 0 ? 'contract' : 'fee', fee: 0, tries: 0, pat: 2 + Math.round(g.loy / 40), blocked: false, renew: !!renew, counter: 0, msg: '' };
    S.nego[g.id] = n;
    return n;
  },
  canBuy(g) {
    const me = GameState.player();
    if (!g) return 'Gladyatör bulunamadı.';
    if (g.club === me.id) return 'Bu gladyatör zaten kulübünüzde.';
    if (!Calendar.isWindow()) return 'Transfer dönemi kapalı. ' + Calendar.windowLabel() + '.';
    if (me.roster.length >= 5) return 'Kadronuz dolu (5/5). Önce kadroda yer açmalısınız.';
    if (!Scouting.canSee(g)) return 'Keşif ağınız bu bölgeyi kapsamıyor. Keşif Merkezi\'ni geliştirin.';
    if (me.arrears > 0) return 'Maaş borcu varken transfer yapılamaz.';
    const n = this.nego(g.id);
    if (n && n.blocked) return 'Bu gladyatörle ilgili görüşmeler bu transfer döneminde sona erdi.';
    return null;
  },
  bidFee(g, fee) {
    const me = GameState.player();
    const err = this.canBuy(g); if (err) return { ok: false, msg: err };
    const n = this.nego(g.id) || this.startNego(g);
    fee = Math.max(0, Math.round(num(fee)));
    if (fee > me.budget) return { ok: false, msg: 'Teklif bütçenizi aşıyor.' };
    const seller = S.clubs[g.club];
    const r = this.evaluateBid(seller, g, fee);
    n.tries++;
    if (r.res === 'accept') { n.stage = 'contract'; n.fee = fee; n.msg = `${seller.n} ${fmtGold(fee)} bonservis teklifini kabul etti. Şimdi gladyatörle sözleşme görüşmesi yapın.`; }
    else if (r.res === 'counter') { n.counter = r.counter; n.msg = `${seller.n} karşı teklif verdi: ${fmtGold(r.counter)}.`; }
    else { n.msg = `${seller.n} teklifi reddetti. Bu gladyatörü bu fiyata satmayı düşünmüyorlar.`; if (fee < r.ask * 0.5) n.tries++; }
    if (r.res !== 'accept' && n.tries >= 4) { n.blocked = true; n.msg += ' Kulüp görüşmeleri kesti.'; }
    return { ok: true, res: r.res, n };
  },
  acceptCounter(g) {
    const n = this.nego(g.id);
    if (!n || !n.counter) return { ok: false, msg: 'Karşı teklif yok.' };
    if (n.counter > GameState.player().budget) return { ok: false, msg: 'Bütçeniz yetersiz.' };
    n.fee = n.counter; n.stage = 'contract'; n.msg = 'Bonservis anlaşması sağlandı. Şimdi sözleşmeyi görüşün.';
    return { ok: true };
  },
  offerContract(g, offer) {
    const me = GameState.player();
    const n = this.nego(g.id) || this.startNego(g, g.club === me.id);
    const renew = g.club === me.id;
    if (!renew) { const err = this.canBuy(g); if (err) return { ok: false, msg: err }; }
    if (n.blocked) return { ok: false, msg: 'Görüşmeler sona erdi.' };
    if (n.stage !== 'contract') return { ok: false, msg: 'Önce kulüple bonservis konusunda anlaşmalısınız.' };
    offer = { wage: Math.max(1, Math.round(num(offer.wage))), yrs: clamp(Math.round(num(offer.yrs, 1)), 1, 4), sign: Math.max(0, Math.round(num(offer.sign))), winB: Math.max(0, Math.round(num(offer.winB))), titleB: Math.max(0, Math.round(num(offer.titleB))) };
    if (offer.sign + n.fee > me.budget) return { ok: false, msg: 'Bonservis + imza parası bütçenizi aşıyor.' };
    const r = this.evaluateContract(g, me, offer, n, renew);
    if (r.res === 'accept') {
      if (renew) {
        if (offer.sign > 0 && !Economy.debit(me, 'signing', offer.sign, false)) return { ok: false, msg: 'İmza parası için bütçe yetersiz.' };
        g.con = { ...offer };
        g.mor = clamp(g.mor + 5, 0, 100);
        delete S.nego[g.id];
        GameState.news(`${g.n} sözleşmesini ${offer.yrs} sezon uzattı (haftalık ${fmtGold(offer.wage)}).`, { p: 1, k: 'transfer' });
        return { ok: true, res: 'accept', done: true };
      }
      const ex = this.execute(g, me, n.fee, offer, g.club < 0 ? 'free' : 'transfer');
      if (!ex.ok) return ex;
      delete S.nego[g.id];
      return { ok: true, res: 'accept', done: true };
    }
    if (r.res === 'walk') { n.blocked = true; n.msg = `${g.n} görüşme masasından kalktı. Bu dönemde yeniden görüşmeyecek.`; return { ok: true, res: 'walk', n }; }
    n.msg = (r.insult ? 'Bu teklif gladyatörü gücendirdi. ' : '') + `${g.n}'in beklentisi: haftalık en az ~${fmtGold(r.needWage)} (diğer şartlar aynı kalırsa). Tercih ettiği süre: ${r.d.yrs} sezon.`;
    n.lastDemand = r.needWage;
    return { ok: true, res: 'counter', n };
  },
  releaseCost(g) {
    if (!g.con) return 0;
    const weeks = (g.con.yrs - 1) * SEASON_WEEKS + Math.max(0, SEASON_WEEKS - S.week);
    return Math.round(g.con.wage * weeks * 0.6 / 10) * 10;
  },
  release(club, g) {
    const cost = this.releaseCost(g);
    if (!Economy.debit(club, 'release', cost, false)) return { ok: false, msg: 'Fesih bedeli için bütçe yetersiz (' + fmtGold(cost) + ').' };
    this.record(g, club.id, -1, 0, 'release');
    if (club.isPlayer) GameState.news(`${g.n} ile sözleşme feshedildi (bedel ${fmtGold(cost)}).`, { p: 1, k: 'transfer' });
    this.detach(g);
    return { ok: true };
  },
  // incoming offers for player's gladiators
  respondOffer(oid, action) {
    const i = S.offers.findIndex(o => o.id === oid);
    if (i < 0) return { ok: false, msg: 'Teklif bulunamadı.' };
    const o = S.offers[i];
    const g = S.glads[o.gid], buyer = S.clubs[o.from], me = GameState.player();
    if (!g || g.club !== me.id || !buyer) { S.offers.splice(i, 1); return { ok: false, msg: 'Teklif artık geçerli değil.' }; }
    if (action === 'reject') { S.offers.splice(i, 1); g.mor = clamp(g.mor - (g.loy < 40 ? 4 : 0), 0, 100); return { ok: true, msg: 'Teklif reddedildi.' }; }
    if (action === 'counter') {
      const ask = Math.round(o.fee * 1.2 / 50) * 50;
      if (o.countered) return { ok: false, msg: 'Bu teklif için zaten pazarlık yapıldı.' };
      o.countered = true;
      if (ask <= o.max && buyer.budget >= ask) { o.fee = ask; return { ok: true, msg: `${buyer.n} yeni bedeli kabul etti: ${fmtGold(ask)}. Teklifi onaylayabilirsiniz.` }; }
      S.offers.splice(i, 1);
      return { ok: true, msg: `${buyer.n} karşı teklifi kabul etmedi ve geri çekildi.` };
    }
    if (action === 'accept') {
      if (!Calendar.isWindow()) return { ok: false, msg: 'Transfer dönemi kapandı.' };
      if (buyer.roster.length >= 5 || buyer.budget < o.fee) { S.offers.splice(i, 1); return { ok: false, msg: `${buyer.n} artık bu transferi yapamıyor.` }; }
      const d = this.demand(g, buyer, false);
      const ex = this.execute(g, buyer, o.fee, { ...d, sign: 0 }, 'transfer');
      S.offers.splice(i, 1);
      S.offers = S.offers.filter(x => x.gid !== g.id);
      return ex.ok ? { ok: true, msg: `${g.n} ${fmtGold(o.fee)} karşılığında ${buyer.n}'e satıldı.` } : ex;
    }
    return { ok: false };
  },
  closeWindow() {
    S.offers = [];
    for (const k in S.nego) if (!S.nego[k].renew) delete S.nego[k];
  }
};

// ---------------------------------------------------------------- ClubAI
const ClubAI = {
  utility(g, club) {
    let u = g.ovr;
    const p = club.pol;
    if (p === 'talent' && g.age <= 24) u += (g.ppot - g.ovr) * 0.4;
    if (p === 'def' && (g.cls === 'murmillo' || g.cls === 'secutor' || g.cls === 'hoplomachus')) u += 3;
    if (p === 'agg' && (g.cls === 'dimachaerus' || g.cls === 'thraex' || g.cls === 'secutor')) u += 3;
    if (g.age > 31) u -= (g.age - 31) * 1.5;
    if (g.injury) u -= g.injury.w * 1.5;
    return u;
  },
  pickLineup(club) {
    const gl = GameState.rosterGlads(club).filter(g => !g.injury).sort((a, b) => Squad.readiness(b) - Squad.readiness(a));
    let pick = gl.slice(0, 3);
    // composition: avoid three of the same class when an alternative is close
    if (pick.length === 3 && pick[0].cls === pick[1].cls && pick[1].cls === pick[2].cls) {
      const alt = gl.slice(3).find(g => g.cls !== pick[0].cls && Squad.readiness(g) > Squad.readiness(pick[2]) - 4);
      if (alt) pick[2] = alt;
    }
    // front line: the sturdiest class
    const front = c => (CLASSES[c.cls].armor + CLASSES[c.cls].block * 30);
    pick.sort((a, b) => front(b) - front(a));
    if (pick.length === 3) pick = [pick[0], pick[1], pick[2]];
    club.lineup = pick.map(g => g.id);
    Squad.fixLineup(club);
  },
  chooseTactic(club, opp) {
    const diff = Squad.top3(club) - Squad.top3(opp);
    const hasTank = club.lineup.some(id => S.glads[id] && S.glads[id].cls === 'murmillo');
    const h = hash01(club.id, S.week + S.season * 31);
    if (diff < -5) return hasTank && h < 0.5 ? 'guard' : 'defensive';
    if (diff > 5) return h < 0.5 ? 'aggressive' : 'focus';
    switch (club.pol) {
      case 'def': return hasTank && h < 0.6 ? 'guard' : 'defensive';
      case 'agg': return h < 0.6 ? 'aggressive' : 'focus';
      case 'rich': return h < 0.5 ? 'focus' : 'balanced';
      default: return h < 0.7 ? 'balanced' : 'focus';
    }
  },
  seasonGoal(club) {
    const e = Sponsors.expectedRank(club);
    return e <= 1 ? 'Şampiyonluk' : e <= 3 ? 'Üst sıralar' : e <= 5 ? 'Orta sıra' : 'Ligde kalmak';
  },
  expectedIncome(club) {
    return Sponsors.aiWeekly(club) + ECON.ticketPrice * Math.min(FAC.capacity[club.fac.arena], club.fans * 0.75) * 7 / 30 + ECON.winPrize * tierEco(club.tier) * 0.25 + ECON.rankPrize[4] * tierEco(club.tier) / 30;
  },
  wageRoom(club) {
    const inc = this.expectedIncome(club);
    const cost = Economy.weeklyCost(club);
    return inc * 1.02 - cost + Math.max(0, club.budget - cost * 8) / 90;
  },
  transferBudget(club) { return Math.max(0, club.budget - Economy.weeklyCost(club) * 8); },
  aiClubs() { return S.clubs.filter(c => !c.isPlayer || c.autoManage); },
  // sign a free agent to fill a slot (always possible: a local recruit is generated if pool is empty)
  fillSlot(club, pool) {
    const room = this.wageRoom(club);
    const cands = pool.filter(g => g.club < 0);
    let best = null, bs = -1e9;
    const target = TIERS[club.tier].ovr;
    for (let k = 0; k < Math.min(40, cands.length); k++) {
      const g = cands[(k * 7 + club.id * 13 + S.week) % cands.length];
      const d = Transfer.demand(g, club, false);
      const afford = d.wage <= Math.max(room, TIERS[club.tier].eco * 30) && d.sign <= club.budget * 0.5;
      if (!afford) continue;
      const s = this.utility(g, club) - Math.max(0, g.ovr - target - 10) * 0.5 - d.wage / (tierEco(club.tier) * 40);
      if (s > bs) { bs = s; best = { g, d }; }
    }
    if (!best) {
      // local recruit — a modest fighter from the club's own region who joins on minimum terms
      const g = GladiatorGenerator.create({ reg: club.reg, ovr: TIERS[club.tier].ovr - 8 + R.normal(0, 3), age: R.int(18, 24) });
      S.glads[g.id] = g;
      best = { g, d: { ...Transfer.demand(g, club, false), sign: 0 } };
      best.d.wage = Math.max(10, Math.round(best.d.wage * 0.8));
    }
    const ex = Transfer.execute(best.g, club, 0, best.d, 'free');
    if (!ex.ok && club.budget < best.d.sign) {
      best.d.sign = 0;
      Transfer.execute(best.g, club, 0, best.d, 'free');
    }
    const i = pool.indexOf(best.g); if (i >= 0) pool.splice(i, 1);
  },
  tryUpgrade(club, freePool, allPool, playerBids) {
    const roster = GameState.rosterGlads(club);
    if (roster.length < 5) return;
    const weakest = roster.slice().sort((a, b) => this.utility(a, club) - this.utility(b, club))[0];
    const wu = this.utility(weakest, club);
    const tb = this.transferBudget(club);
    const room = this.wageRoom(club) + weakest.con.wage;
    let best = null, bs = 0;
    // allPool is sorted by OVR (desc): only consider gladiators clearly better than the weakest
    let lo = 0, hi = allPool.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (allPool[mid].ovr >= weakest.ovr + 3) lo = mid + 1; else hi = mid; }
    const nCand = lo;
    if (!nCand) return;
    const tries = Math.min(50, nCand);
    for (let k = 0; k < tries; k++) {
      const g = allPool[nCand <= 50 ? k : (R.next() * nCand) | 0];
      if (!g || g.club === club.id || g.injury) continue;
      const seller = g.club >= 0 ? S.clubs[g.club] : null;
      if (seller && seller.tier < club.tier - 1) continue; // stars from far higher leagues won't come
      const gain = this.utility(g, club) - wu;
      if (gain < 4) continue;
      const fee = seller ? Transfer.askingPrice(seller, g) : 0;
      const d = Transfer.demand(g, club, false);
      const relCost = Transfer.releaseCost(weakest);
      if (fee + d.sign + relCost * 0.3 > tb || d.wage > room) continue;
      const s = gain / Math.pow(1 + fee + d.wage * 30, 0.25);
      if (s > bs) { bs = s; best = { g, seller, fee, d }; }
    }
    if (!best) return;
    if (best.seller && best.seller.isPlayer && !best.seller.autoManage) {
      if (playerBids.n < 2 && !S.offers.some(o => o.gid === best.g.id || o.from === club.id)) {
        const fee = Math.round(best.fee * R.range(0.85, 1.12) / 50) * 50;
        const max = Math.round(TransferMath.value(best.g) * (club.pol === 'rich' ? 1.65 : 1.45) / 50) * 50;
        S.offers.push({ id: GameState.newId('o'), gid: best.g.id, from: club.id, fee, max, s: S.season, w: S.week });
        GameState.news(`Transfer teklifi: ${club.n}, ${best.g.n} için ${fmtGold(fee)} teklif etti.`, { p: 1, k: 'offer' });
        playerBids.n++;
      }
      return;
    }
    // make room: sell weakest to the free market if it is cheaper than keeping, else release
    const rc = Transfer.releaseCost(weakest);
    if (rc > club.budget * 0.25) return;
    if (!Transfer.release(club, weakest).ok) return;
    const ex = Transfer.execute(best.g, club, best.fee, best.d, best.seller ? 'transfer' : 'free');
    if (!ex.ok) this.fillSlot(club, freePool);
  },
  // AI bids for player's gladiators from clubs that need/want them
  playerTargets(playerBids) {
    const me = GameState.player();
    if (!me || me.autoManage) return;
    for (const g of GameState.rosterGlads(me)) {
      if (playerBids.n >= 2) break;
      if (S.offers.some(o => o.gid === g.id)) continue;
      const attract = clamp((g.ovr - TIERS[me.tier].ovr) / 20 + (g.age <= 23 ? 0.15 : 0), 0, 0.8);
      if (R.next() > 0.08 + attract * 0.25) continue;
      const cands = S.clubs.filter(c => !c.isPlayer && c.tier <= me.tier && c.tier >= me.tier - 2 && c.roster.length < 5 + 1 && this.transferBudget(c) > Transfer.askingPrice(me, g) * 0.9);
      if (!cands.length) continue;
      const buyer = R.pick(cands);
      const fee = Math.round(Transfer.askingPrice(me, g) * R.range(0.8, 1.15) / 50) * 50;
      const max = Math.round(TransferMath.value(g) * (buyer.pol === 'rich' ? 1.65 : 1.45) / 50) * 50;
      S.offers.push({ id: GameState.newId('o'), gid: g.id, from: buyer.id, fee, max, s: S.season, w: S.week });
      GameState.news(`Büyük transfer teklifi kulübümüze ulaştı: ${buyer.n}, ${g.n} için ${fmtGold(fee)} önerdi.`, { p: 1, k: 'offer' });
      playerBids.n++;
    }
  },
  windowPass(week) {
    const clubs = R.shuffle(this.aiClubs());
    const freePool = GameState.freeAgents().sort((a, b) => b.ovr - a.ovr);
    const allPool = Object.values(S.glads).filter(g => !g.temp).sort((a, b) => b.ovr - a.ovr);
    const playerBids = { n: S.offers.filter(o => o.w === S.week).length };
    // offers on the player's roster expire at window close; new ones may be created now
    for (const club of clubs) {
      if (club.arrears > 0) Economy.aiRefinance(club);
      // clubs in trouble shed their most expensive bench gladiator
      if (club.arrears > 0 && club.roster.length >= 4) {
        const bench = GameState.rosterGlads(club).filter(g => !club.lineup.includes(g.id)).sort((a, b) => b.con.wage - a.con.wage)[0];
        if (bench && Transfer.releaseCost(bench) <= club.budget) Transfer.release(club, bench);
      }
      if (club.roster.length < 5) { this.fillSlot(club, freePool); continue; }
      const pUp = { rich: 0.45, talent: 0.35, agg: 0.25, def: 0.25, econ: 0.15 }[club.pol] || 0.2;
      if (R.next() < pUp && club.arrears <= 0) this.tryUpgrade(club, freePool, allPool, playerBids);
    }
    this.playerTargets(playerBids);
    // fill pass: no AI club leaves the window short
    for (const club of this.aiClubs()) {
      let guard = 0;
      while (club.roster.length < 5 && guard++ < 5) this.fillSlot(club, freePool);
      this.equipmentPass(club);
      this.pickLineup(club);
    }
  },
  equipmentPass(club) {
    Equipment.autoEquip(club);
    const wc = Economy.weeklyCost(club);
    if (club.budget < wc * 15 || club.arrears > 0 || R.next() > 0.35) return;
    const aces = club.lineup.map(id => S.glads[id]).filter(Boolean);
    const g = R.pick(aces); if (!g) return;
    const slot = R.pick(['w', 'a', 'x']);
    const cur = S.items[g.eq[slot]];
    const q = clamp(Math.round((6 - club.tier) * 0.72 + R.normal(0, 0.6)), 0, 4);
    if (cur && cur.q >= q) {
      if (cur.p < 5 && Equipment.upgradeCost(cur) < club.budget * 0.08) Equipment.upgrade(club, cur.id);
      return;
    }
    const types = Object.keys(ITEM_TYPES).filter(t => ITEM_TYPES[t].slot === slot && ITEM_TYPES[t].cls.includes(g.cls));
    if (!types.length) return;
    const t = R.pick(types);
    if (Equipment.price(t, q) > club.budget * 0.12) return;
    if (club.rep < Equipment.repNeeded(q)) return;
    const r = Equipment.buy(club, t, q);
    if (r.ok) Equipment.equip(r.item.id, g.id);
    // clubs sell surplus old items
    const items = Equipment.clubItems(club).filter(it => !it.g);
    if (items.length > 6) Equipment.sell(club, items.sort((a, b) => a.q - b.q)[0].id);
  },
  weeklyLineups() { for (const c of this.aiClubs()) this.pickLineup(c); },
  // season-end contract decisions (before contracts tick down)
  renewals(club) {
    const avg = Squad.avgOvr(club);
    for (const g of GameState.rosterGlads(club)) {
      if (!g.con || g.con.yrs > 1) continue;
      if (g.age >= 34 || g.ovr < avg - 7) continue;
      const d = Transfer.demand(g, club, true);
      if (d.wage > g.con.wage * 1.6 && this.wageRoom(club) < d.wage - g.con.wage) continue;
      g.con = { wage: d.wage, yrs: g.con.yrs + R.int(1, 3), sign: 0, winB: d.winB, titleB: d.titleB };
    }
  },
  seasonStart(club) {
    // facilities investment
    const wc = Economy.weeklyCost(club);
    const maxLv = clamp(7 - club.tier, 1, 5);
    const order = R.shuffle(FAC_IDS.slice());
    for (const f of order) {
      if (club.fac[f] >= Math.max(maxLv, f === 'arena' && club.fans > FAC.capacity[club.fac.arena] ? 5 : 0)) continue;
      const cost = Facilities.cost(club, f);
      if (cost > 0 && club.budget - cost > wc * 14 && club.budget > cost * 2.5) { Facilities.upgrade(club, f); break; }
    }
    // staff improvement for low-quality staff
    const T = TIERS[club.tier];
    for (const s of STAFF_IDS) {
      if (club.staff[s].q < T.staff[0] - 6 && club.budget > wc * 12) club.staff[s] = WorldGenerator.staffMember(club.reg, R.range(T.staff[0], T.staff[1]));
    }
    club.goal = this.seasonGoal(club);
  }
};
