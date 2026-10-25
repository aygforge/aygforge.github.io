const { load } = require('./load');
const AD = load();
const { WorldGenerator, Transfer, GameState, Scouting, TransferMath } = AD;
WorldGenerator.generate(55);
const pc = WorldGenerator.createNewLudus('aegion', 'Ludus T', { sh: 0, sy: 0, c1: '#900', c2: '#fd0' });
WorldGenerator.setPlayer(pc.id, true);
const S = AD.S, me = GameState.player();
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
// roster full blocks
const target = Object.values(S.glads).find(g => g.club >= 0 && g.club !== me.id && Scouting.canSee(g) && g.ovr < 45 && S.clubs[g.club].tier === 6);
ok(Transfer.canBuy(target) && Transfer.canBuy(target).includes('dolu'), 'full roster blocks purchase');
// release weakest
const weak = GameState.rosterGlads(me).sort((a, b) => a.ovr - b.ovr)[0];
const b0 = me.budget, cost = Transfer.releaseCost(weak);
ok(Transfer.release(me, weak).ok && me.roster.length === 4 && me.budget === b0 - cost && weak.club === -1, 'release costs ' + cost + ' and frees slot');
// lowball rejected, then fair accepted
const seller = S.clubs[target.club]; const sb0 = seller.budget;
let r = Transfer.bidFee(target, 10); ok(r.ok && r.res === 'reject', 'lowball rejected');
const ask = Transfer.askingPrice(seller, target);
r = Transfer.bidFee(target, Math.round(ask * 0.85)); ok(r.res === 'counter', 'counter offer at 85%: ' + r.n.counter);
r = Transfer.acceptCounter(target); ok(r.ok, 'accept counter');
// stingy contract -> counter, then good -> accept
const d = Transfer.demand(target, me, false);
r = Transfer.offerContract(target, { wage: Math.round(d.wage * 0.6), yrs: d.yrs, sign: 0, winB: 0, titleB: 0 }); ok(r.res === 'counter' || r.res === 'walk', 'stingy contract not accepted (' + r.res + ')');
const fee = S.nego[target.id] ? S.nego[target.id].fee : 0;
const b1 = me.budget;
r = Transfer.offerContract(target, { wage: Math.round(d.wage * 1.1), yrs: d.yrs, sign: d.sign, winB: d.winB, titleB: d.titleB });
ok(r.done && target.club === me.id && me.roster.length === 5, 'transfer completed');
ok(me.budget === b1 - fee - d.sign && seller.budget === sb0 + fee, 'money moved: fee ' + fee + ' sign ' + d.sign);
ok(S.transfers[0].g === target.id && S.transfers[0].fee === fee, 'transfer history recorded');
// window closed
S.week = 5; ok(Transfer.canBuy(Object.values(S.glads).find(g => g.club < 0)).includes('kapalı'), 'window closed blocks');
// free agent with arrears allowed in window
S.week = 1; Transfer.release(me, GameState.rosterGlads(me)[4]); me.arrears = 100;
const fa = GameState.freeAgents()[0];
ok(Transfer.canBuy(fa) === null, 'free agent negotiable during arrears');
ok(Transfer.canBuy(Object.values(S.glads).find(g => g.club >= 0 && g.club !== me.id && Scouting.canSee(g))).includes('borcu'), 'paid transfer blocked during arrears');
