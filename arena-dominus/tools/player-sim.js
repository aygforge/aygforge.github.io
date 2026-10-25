// Exercises the player-facing APIs over several seasons (not auto-managed).
const { load } = require('./load');
const AD = load();
const MODE = process.argv[2] || 'active'; // active | idle
const SEASONS = +(process.argv[3] || 4);
const { WorldGenerator, Game, Transfer, Sponsors, Facilities, Equipment, GameState, Calendar, Scouting, MatchSystem, Squad, Economy, Sanity, TransferMath } = AD;
const fail = []; const check = (c, m) => { if (!c) fail.push(m); };
(async () => {
  WorldGenerator.generate(2024);
  const pc = WorldGenerator.createNewLudus('dravok', 'Ludus Probus', { sh: 3, sy: 11, c1: '#6e1414', c2: '#d4ad52' });
  WorldGenerator.setPlayer(pc.id, true);
  const me = () => GameState.player();
  let signed = 0, renewed = 0, temps = 0, bids = 0, accepted = 0;
  for (let s = 0; s < SEASONS; s++) {
    for (let w = 0; w <= 30; w++) {
      const S = AD.S;
      if (MODE === 'active') {
        if (S.week === 0 && !me().sponsor && S.sponsorOffers.length) check(Sponsors.accept(0), 'sponsor accept');
        if (S.week === 0) for (const f of ['train', 'med', 'arena', 'scout']) { if (me().budget > Facilities.cost(me(), f) * 3) Facilities.upgrade(me(), f); }
        // renew expiring
        for (const g of GameState.rosterGlads(me())) if (g.con.yrs <= 1 && S.week === 20) {
          Transfer.startNego(g, true);
          const d = Transfer.demand(g, me(), true);
          const r = Transfer.offerContract(g, { wage: Math.ceil(d.wage * 1.05), yrs: d.yrs, sign: d.sign, winB: d.winB, titleB: d.titleB });
          if (r.done) renewed++;
        }
        // fill roster from free agents in windows
        if (Calendar.isWindow() && me().roster.length < 5) {
          const fa = GameState.freeAgents().filter(g => Scouting.canSee(g)).sort((a, b) => b.ovr - a.ovr);
          for (const g of fa) {
            const d = Transfer.demand(g, me(), false);
            if (d.wage > 90 || d.sign > me().budget * 0.4) continue;
            const r = Transfer.offerContract(g, { wage: Math.ceil(d.wage * 1.04), yrs: d.yrs, sign: d.sign, winB: d.winB, titleB: d.titleB });
            if (r.done) { signed++; break; }
          }
        }
        // try buying a contracted gladiator once per window (bid + contract)
        if (S.week === 15 && me().roster.length < 5) {
          const g = Object.values(S.glads).find(x => x.club >= 0 && x.club !== me().id && Scouting.canSee(x) && x.val < me().budget * 0.3);
          if (g) {
            const r = Transfer.bidFee(g, Math.round(Transfer.askingPrice(S.clubs[g.club], g) * 1.02)); bids++;
            if (r.ok && r.n.stage === 'contract') {
              const d = Transfer.demand(g, me(), false);
              const c = Transfer.offerContract(g, { wage: Math.ceil(d.wage * 1.05), yrs: d.yrs, sign: d.sign, winB: d.winB, titleB: d.titleB });
              if (c.done) accepted++;
            }
          }
        }
        // incoming offers: accept the first
        if (S.offers.length && Calendar.isWindow()) { const r = Transfer.respondOffer(S.offers[0].id, 'accept'); }
        // buy + upgrade gear when rich
        if (me().budget > 6000 && S.week === 2) { const g = GameState.rosterGlads(me())[0]; const t = Object.keys(AD.ITEM_TYPES).find(t => AD.ITEM_TYPES[t].slot === 'w' && AD.ITEM_TYPES[t].cls.includes(g.cls)); const r = Equipment.buy(me(), t, 1); if (r.ok) { Equipment.equip(r.item.id, g.id); Equipment.upgrade(me(), r.item.id); } }
        if (me().arrears > 0 && Economy.refinanceOffer(me())) Economy.refinance(me());
      }
      // player's match: simulate (same path the UI uses)
      const pend = Game.pendingPlayerMatch();
      if (pend) {
        const setup = MatchSystem.build(pend.m, pend.comp, { live: false });
        if (setup.sides.some(sd => sd.cid === me().id && sd.glads.some(g => g.temp))) temps++;
        for (const sd of setup.sides) for (const g of sd.glads) check(g.temp || !g.injury, 'injured fighter fielded');
        const m = AD.CombatEngine.create(setup); const res = AD.CombatEngine.run(m);
        MatchSystem.record(pend.m, pend.comp, res, setup);
        check(!!pend.m.r, 'player match recorded');
      }
      await Game.processWeek();
      check(me().roster.length <= 5, 'roster>5');
      check(isFinite(me().budget) && me().budget >= 0, 'budget invalid');
      const iss = Sanity.check(false); check(!iss.length, 'sanity ' + iss.slice(0, 2));
    }
    const h = AD.S.hist.seasons[AD.S.hist.seasons.length - 1];
    console.log(`season ${h.s}: tier ${h.player.tier} rank ${h.player.rank} ${h.player.w}-${h.player.l} budget ${me().budget} arrears ${me().arrears} roster ${me().roster.length} rep ${me().rep} | signed ${signed} renewed ${renewed} temps ${temps} bids ${bids}/${accepted}`);
  }
  console.log(fail.length ? 'FAILURES:\n' + [...new Set(fail)].join('\n') : 'ALL CHECKS PASSED');
})().catch(e => { console.error(e); process.exit(1); });
