// Mantık testleri: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { GameCore, Ship, Trade, Events, Crew } from '../src/core/GameCore.js';
import { memoryStorage } from '../src/core/SaveManager.js';
import { generateRoute, generateLanes, laneText, intelAccuracy, regionDemand, harborRelativeSell } from '../src/systems/RouteSystem.js';
import { createMeta } from '../src/core/GameState.js';
import { HARBORS, GRAND_HARBOR_ID, HARBOR_BY_ID } from '../src/data/harbors.js';
import { ITEMS } from '../src/data/items.js';
import { CREW } from '../src/data/crew.js';
import { PETS } from '../src/data/pets.js';
import { TRADE_GOODS } from '../src/data/goods.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { ALL_EVENTS, EVENT_BY_ID, CHAINS } from '../src/data/events.js';
import { createBot } from '../tools/bot.mjs';
import { SeededRNG } from '../src/core/SeededRNG.js';
import { BALANCE } from '../src/config/balance.js';

const newCore = (storage = memoryStorage()) => { const c = new GameCore(storage); c.meta.tutorialDone ??= true; return c; };
function toHarbor(core) {
  let n = 0;
  while (core.run.phase === 'arrival' && n++ < 20) {
    const a = core.run.arrival;
    if (a.current && !a.current.result) {
      const o = Events.getOptions(core.G, a).find((x) => x.view.available);
      core.choose(o.key);
    } else core.arrivalNext();
  }
  assert.equal(core.run.phase, 'harbor');
}
/** Kuyruktaki sıradaki eventi testte belirli bir evente zorlar */
function forceEvent(core, id) {
  const v = core.run.voyage;
  v.queue.splice(v.pos, 0, { id, src: 'normal' });
  core.nextEvent();
  assert.equal(v.current.id, id);
  return v;
}

test('İçerik sayıları GDD ile uyumlu', () => {
  assert.equal(HARBORS.length, 45);
  for (const [r, n] of [[1, 8], [2, 8], [3, 9], [4, 10], [5, 10]]) assert.equal(HARBORS.filter((h) => h.region === r).length, n);
  assert.equal(TRADE_GOODS.length, 15);
  assert.ok(ITEMS.length >= 18);
  assert.equal(CREW.length, 30);
  assert.equal(PETS.length, 9);
  assert.equal(UPGRADES.filter((u) => !u.id.startsWith('UPG_X1_')).length, 20); // mevcut 20 korunur
  assert.equal(UPGRADES.filter((u) => u.id.startsWith('UPG_X1_')).length, 12); // Yaşayan Denizler
  const cnt = (c, re) => ALL_EVENTS.filter((e) => re.test(e.id)).length;
  assert.equal(cnt('d', /^EVT_D_\d+$/), 18);
  assert.equal(cnt('f', /^EVT_F_\d+$/), 15);
  assert.equal(cnt('m', /^EVT_M_\d+$/), 12);
  assert.equal(cnt('x', /^EVT_DIS_\d+$/), 8);
  assert.equal(cnt('r', /^EVT_REPAIR_\d+$/), 3);
  assert.equal(cnt('c', /^EVT_CREW_\d+$/), 5);
  assert.equal(Object.keys(CHAINS).filter((k) => !k.startsWith('CH_X1_')).length, 12); // mevcut 12 zincir korunur
  assert.equal(Object.keys(CHAINS).filter((k) => k.startsWith('CH_X1_')).length, 4);
  // tüm zincir hedefleri ve event referansları geçerli
  for (const ev of ALL_EVENTS) for (const o of ev.options) for (const out of [o.win, o.lose, ...(o.cases || [])].flat().filter(Boolean)) {
    if (out.fx?.next) assert.ok(EVENT_BY_ID[out.fx.next], `${ev.id} → ${out.fx.next}`);
    if (out.fx?.startChain) assert.ok(CHAINS[out.fx.startChain]);
  }
});

test('1. Yeni run oluşturulabiliyor', () => {
  const core = newCore();
  assert.ok(core.newRun('T1').ok);
  assert.equal(core.run.gold, 100);
  assert.equal(core.run.ship.hull, 100);
  assert.ok(core.run.totalHarbors >= 6 && core.run.totalHarbors <= 10);
  assert.equal(core.run.route.length, 1, 'yalnızca başlangıç limanı bilinir');
});

test('2. Aynı seed + aynı kararlar aynı rotayı üretir; liman tekrarı yok; final Büyük Liman; hedefler önceden bilinmez', () => {
  for (let i = 0; i < 40; i++) {
    assert.deepEqual(generateRoute('S' + i, createMeta()), generateRoute('S' + i, createMeta()));
    const play = () => { const core = newCore(); core.newRun('RT' + i); const r = createBot(core, { rngSeed: 3 }).playRun(); return { route: core.run.route.map((x) => x.harborId), total: core.run.totalHarbors, res: r.result }; };
    const a = play(), b = play();
    assert.deepEqual(a, b);
    assert.equal(new Set(a.route).size, a.route.length, 'liman tekrarı yok');
    assert.ok(!a.route.some((id) => ['mystery', 'ice'].includes(HARBOR_BY_ID[id].type)), 'kilitli tip yok');
    if (a.res === 'complete') { assert.equal(a.route[a.route.length - 1], GRAND_HARBOR_ID); assert.equal(a.route.length, a.total); }
  }
});

test('Belirsiz rota: deniz yolları 2–3 seçenek, hedef adı ipuçlarında yok, son yol Büyük Liman', () => {
  const core = newCore();
  core.newRun('LANES');
  toHarbor(core);
  const lanes = core.run.visit.lanes;
  assert.ok(lanes.length >= 2 && lanes.length <= 3);
  for (const l of lanes) {
    const tx = laneText(l);
    const name = HARBOR_BY_ID[l.harborId].name;
    assert.ok(!JSON.stringify(tx).includes(name), 'liman adı sızmıyor');
    assert.notEqual(l.harborId, core.run.route[0].harborId);
  }
  // ziyaret boyunca sabit (kayıt/yükleme dahil)
  core.persist();
  assert.deepEqual(new GameCore(core.saves.s).run.visit.lanes, lanes);
  // istihbarat: Tarık ile ticaret söylentileri doğru
  Crew.addCrew(core.G, 'CREW_TARIK');
  assert.equal(intelAccuracy(core.G).trade, 100);
  // son ayak: tüm yollar Büyük Liman'a
  core.run.totalHarbors = 2;
  const fin = generateLanes(core.G, 0);
  assert.ok(fin.every((l) => l.harborId === GRAND_HARBOR_ID));
});

test('Ticaret rota belirsizliğinden etkilenir: bölgesel talep fiyatları değiştirir', () => {
  const core = newCore();
  core.newRun('DEMAND');
  toHarbor(core);
  const vals = new Set();
  for (let r = 1; r <= 5; r++) vals.add(regionDemand('DEMAND', r, 'GOOD_SPICE').toFixed(3));
  assert.ok(vals.size > 1, 'bölgeye göre farklı talep');
  const lane = core.run.visit.lanes[0];
  const truthful = lane.rumors.filter((x) => x.truthful);
  for (const t of truthful) {
    const m = harborRelativeSell('DEMAND', HARBOR_BY_ID[lane.harborId], t.good);
    assert.ok(m >= 0.9, 'doğru söylenti gerçekten iyi fiyatlı bir mal');
  }
});

test('3. Liman teklifleri ziyaret boyunca değişmez', () => {
  const core = newCore();
  core.newRun('OFFER');
  toHarbor(core);
  const snap = JSON.stringify([core.run.visit.market.map((m) => m.good), core.run.visit.items, core.run.visit.crew, core.run.visit.pet]);
  core.buyGood(core.run.visit.market[0].good, 1);
  core.persist();
  const again = new GameCore(core.saves.s);
  assert.equal(JSON.stringify([again.run.visit.market.map((m) => m.good), again.run.visit.items, again.run.visit.crew, again.run.visit.pet]), snap);
});

test('4–5. Alım-satım doğru altın değişimi yapar; kargo kapasitesi aşılamaz', () => {
  const core = newCore();
  core.newRun('TRADE');
  toHarbor(core);
  core.run.gold = 5000;
  const m = core.run.visit.market[0];
  const price = Trade.buyPrice(core.G, core.run.visit.harborId, m.good);
  const g0 = core.run.gold;
  assert.ok(core.buyGood(m.good, 1).ok);
  assert.equal(core.run.gold, g0 - price);
  // aynı ziyarette iade: alış fiyatından
  const lot = core.run.cargo[0];
  assert.ok(core.sellLot(lot.id, 1).ok);
  assert.equal(core.run.gold, g0);
  m.stock = 99;
  const cap = Ship.cargoCapacity(core.G);
  assert.ok(core.buyGood(m.good, cap).ok);
  const r = core.buyGood(m.good, 1);
  assert.equal(r.ok, false);
  assert.equal(Ship.cargoUsed(core.run), cap);
});

test('6–7. Item gerektiren seçenek item olmadan kilitli; tek kullanımlık item tüketilir', () => {
  const core = newCore();
  core.newRun('ITEM');
  toHarbor(core);
  core.depart();
  const v = forceEvent(core, 'EVT_D_07'); // Yangın: Onarım Takımı seçeneği
  let opts = Events.getOptions(core.G, v);
  const kitOpt = opts.find((o) => o.opt.consume === 'ITEM_REPAIR_KIT');
  assert.equal(kitOpt.view.available, false);
  assert.ok(kitOpt.view.reasons[0].includes('Onarım Takımı'));
  core.run.items.push({ id: 'ITEM_REPAIR_KIT', uid: 'k1' });
  opts = Events.getOptions(core.G, v);
  const k2 = opts.find((o) => o.opt.consume === 'ITEM_REPAIR_KIT');
  assert.ok(k2.view.available);
  assert.ok(core.choose(k2.key).ok);
  assert.ok(!core.run.items.some((i) => i.id === 'ITEM_REPAIR_KIT'));
  // ikinci kez seçim yapılamaz
  assert.equal(core.choose(k2.key).ok, false);
});

test('8–9. Tayfa pasifleri çalışır ve tayfa bırakılınca bonus kalkar', () => {
  const core = newCore();
  core.newRun('CREW');
  toHarbor(core);
  const G = core.G;
  const good = core.run.visit.market[0].good;
  const base = Trade.sellPrice(G, core.run.visit.harborId, good);
  Crew.addCrew(G, 'CREW_HAMID');
  const withHamid = Trade.sellPrice(G, core.run.visit.harborId, good);
  assert.ok(withHamid > base);
  Crew.dismissCrew(G, 'CREW_HAMID');
  assert.equal(Trade.sellPrice(G, core.run.visit.harborId, good), base);
  assert.ok(core.run.dismissedCrew.includes('CREW_HAMID'));
  // Pita çarpanı ve Groot rota sonu onarımı
  core.run.ship.level = 3;
  Crew.addCrew(G, 'CREW_PITA');
  assert.ok(Crew.crewSkillMult(G) > 1.09);
  Crew.addCrew(G, 'CREW_GROOT');
  core.run.ship.hull = 50;
  core.depart();
  core.run.voyage.queue = [];
  core.nextEvent();
  assert.ok(core.run.ship.hull >= 61, 'Groot +10×Pita');
});

test('10–11. Tamir maksimumu aşmaz; hasar kategorileri yüzdeyle belirlenir', () => {
  const core = newCore();
  core.newRun('REPAIR');
  toHarbor(core);
  const G = core.G;
  for (const [hp, cat] of [[100, 'healthy'], [76, 'healthy'], [75, 'damaged'], [51, 'damaged'], [50, 'critical'], [26, 'critical'], [25, 'sinking'], [1, 'sinking'], [0, 'sunk']]) {
    core.run.ship.hull = hp;
    assert.equal(Ship.hullCategory(G), cat, `hp ${hp}`);
  }
  core.run.ship.level = 5; // 450 hull: %50 = 225
  core.run.ship.hull = 225;
  assert.equal(Ship.hullCategory(G), 'critical');
  core.run.ship.level = 1;
  core.run.ship.hull = 95;
  core.run.gold = 9999;
  core.run.items.push({ id: 'ITEM_REPAIR_KIT', uid: 'x' });
  core.useRepairKit('x');
  assert.equal(core.run.ship.hull, 100);
  core.run.ship.hull = 40;
  const opt = core.repair('full');
  if (opt.ok) assert.equal(core.run.ship.hull, Ship.maxHull(G));
  else { core.repair('patch'); assert.ok(core.run.ship.hull <= Ship.maxHull(G)); }
});

test('12. Geminin batması run\'ı sonlandırır ve XP aktarılır', () => {
  const core = newCore();
  core.newRun('SINK');
  toHarbor(core);
  core.depart();
  const v = forceEvent(core, 'EVT_D_02');
  core.run.ship.hull = 1;
  const o = Events.getOptions(core.G, v).find((x) => x.opt.label === 'Göğüsle');
  core.rng.setState(0); // şans önemli değil; ölümü garantilemek için kaybetme durumunu zorla
  o.opt.chance; // seçim
  core.run.ship.hull = 1;
  // kesin kayıp: başarısız sonucu doğrudan uygula
  const res = core.choose(Events.getOptions(core.G, v).find((x) => x.opt.label === 'Demir at').key);
  assert.ok(res.ok);
  core.run.ship.hull = 0;
  const xpBefore = core.meta.xpAvailable;
  core.continueEvent();
  assert.ok(core.run.ended);
  assert.equal(core.run.result, 'sunk');
  assert.ok(core.meta.xpAvailable >= xpBefore + core.run.xp.total);
});

test('13. Zincir eventleri yarıda kaybolmaz (rota/varış ertelemesi)', () => {
  const core = newCore();
  core.newRun('CHAIN');
  toHarbor(core);
  core.depart();
  let v = forceEvent(core, 'CH_TREASURE_1');
  core.choose(Events.getOptions(core.G, v).find((o) => o.opt.label === 'Peşine düş').key);
  assert.equal(core.run.pendingRoute[0].id, 'CH_TREASURE_2');
  core.continueEvent();
  core.run.voyage.queue.length = core.run.voyage.pos;
  core.nextEvent(); // varış
  toHarbor(core);
  core.persist();
  const re = new GameCore(core.saves.s);
  assert.equal(re.run.pendingRoute[0].id, 'CH_TREASURE_2');
  re.depart();
  assert.equal(re.run.voyage.queue[0].id, 'CH_TREASURE_2');
  // aynı zincir ikinci kez başlamaz
  re.run.voyage.queue.splice(1, 0, { id: 'EVT_M_03', src: 'normal' });
  assert.ok(re.run.chains.CH_TREASURE);
});

test('14–15. Zıpır & Tarçın özel karşılaşmaları ve Eski Dostlar', () => {
  // ilk karşılaşma (olursa) ilk 3 limandan birinde; artık garanti değil (~%40)
  let met = 0;
  for (let i = 0; i < 300; i++) {
    const core = newCore();
    core.newRun('ZT' + i);
    assert.ok(core.run.special.firstAt >= 0 && core.run.special.firstAt <= 2);
    if (core.run.special.stage !== 'none') met++;
  }
  assert.ok(met > 300 * 0.3 && met < 300 * 0.5, `karşılaşma oranı ${met}/300`);
  // hem ilk karşılaşmanın hem ikincisinin olduğu bir seed seç
  let seed = null;
  for (let i = 0; i < 500 && !seed; i++) {
    const c = newCore();
    c.newRun('ZIPIR' + i);
    if (c.run.special.stage !== 'none' && SeededRNG.derive('ZIPIR' + i, 'special2').chance(BALANCE.special.secondChance)) seed = 'ZIPIR' + i;
  }
  assert.ok(seed);
  const core = newCore();
  core.newRun(seed);
  const fa = core.run.special.firstAt;
  // ilk özel eventi bul ve Tarçın'ı al
  let guard = 0;
  while (guard++ < 200) {
    const run = core.run;
    if (run.phase === 'arrival') {
      const a = run.arrival;
      if (a.current && !a.current.result) {
        const opts = Events.getOptions(core.G, a);
        const o = a.current.id === 'EVT_SPECIAL_ZIPIR_TARCIN' ? opts.find((x) => x.opt.label === "Tarçın'ı al") : opts.find((x) => x.view.available);
        core.choose(o.key);
        if (a.current.id === 'EVT_SPECIAL_ZIPIR_TARCIN') break;
      } else core.arrivalNext();
    } else if (run.phase === 'harbor') core.depart();
    else if (run.phase === 'voyage') {
      const v = run.voyage;
      if (!v.current) core.nextEvent();
      else if (!v.current.result) core.choose(Events.getOptions(core.G, v).find((x) => x.view.available).key);
      else core.continueEvent();
    }
  }
  assert.ok(core.run.pets.includes('PET_TARCIN'));
  assert.equal(core.run.special.stage, 'awaitingSecond');
  const due = core.run.special.secondDueAt;
  assert.ok(due >= Math.min(fa + 2, core.run.totalHarbors - 1) && due <= Math.min(fa + 4, core.run.totalHarbors - 1));
  // ikinci karşılaşmaya kadar oyna
  core.run.ship.hull = 9999;
  guard = 0;
  let found = false;
  while (guard++ < 600 && !core.run.ended) {
    const run = core.run;
    run.ship.hull = Ship.maxHull(core.G);
    if (run.phase === 'arrival') { const a = run.arrival; if (a.current && !a.current.result) core.choose(Events.getOptions(core.G, a).find((x) => x.view.available).key); else core.arrivalNext(); }
    else if (run.phase === 'harbor') { if (HARBOR_BY_ID[run.visit.harborId].final) break; core.depart(); }
    else {
      const v = run.voyage;
      if (!v.current) core.nextEvent();
      else if (!v.current.result) {
        const opts = Events.getOptions(core.G, v);
        const o = v.current.id === 'EVT_SPECIAL_ZIPIR_ALONE' ? opts.find((x) => x.opt.label === 'Sandala uzan') : opts.find((x) => x.view.available);
        if (v.current.id === 'EVT_SPECIAL_ZIPIR_ALONE') found = true;
        core.choose(o.key);
      } else core.continueEvent();
    }
    if (found) break;
  }
  assert.ok(found, 'ikinci karşılaşma garanti edildi');
  assert.ok(core.run.pets.includes('PET_ZIPIR') && core.run.pets.includes('PET_TARCIN'));
  assert.equal(core.run.petCap, 2);
  assert.ok(core.meta.achievements.includes('ACH_OLD_FRIENDS'));
  assert.ok(core.meta.codex.oldFriends);
});

test('16–17. Yeni run sıfırlar; kalıcı XP ve yükseltmeler korunur', () => {
  const core = newCore();
  core.meta.xpAvailable = 1000;
  assert.ok(core.buyUpgrade('UPG_CAPITAL_1').ok);
  assert.ok(core.buyUpgrade('UPG_HULL_1').ok);
  core.newRun('A');
  toHarbor(core);
  core.run.gold = 999;
  Crew.addCrew(core.G, 'CREW_HAMID');
  core.abandonRun();
  core.dismissSummary();
  core.newRun('B');
  assert.equal(core.run.gold, 150);
  assert.equal(core.run.ship.hull, 110);
  assert.equal(core.run.ship.level, 1);
  assert.equal(core.run.crew.length, 0);
  assert.ok(core.meta.upgrades.includes('UPG_CAPITAL_1'));
  assert.equal(core.meta.xpSpent, 250);
});

test('18. Kayıt yükleme event ödüllerini çoğaltmaz', () => {
  const storage = memoryStorage();
  const core = newCore(storage);
  core.newRun('SAVE');
  toHarbor(core);
  core.depart();
  const v = forceEvent(core, 'EVT_F_11');
  const o = Events.getOptions(core.G, v).find((x) => x.opt.label === 'Dinlen ve onar');
  core.run.ship.hull = 50;
  core.choose(o.key);
  const hp = core.run.ship.hull;
  const gold = core.run.gold;
  const re = new GameCore(storage);
  assert.ok(re.run.voyage.current.result, 'sonuç kayıtta');
  assert.equal(re.choose(o.key).ok, false, 'tekrar seçilemez');
  assert.equal(re.run.ship.hull, hp);
  assert.equal(re.run.gold, gold);
  // RNG durumu korunur: aynı kararlar aynı sonucu verir
  re.continueEvent();
  core.continueEvent();
  re.nextEvent(); core.nextEvent();
  assert.equal(re.run.voyage?.current?.id, core.run.voyage?.current?.id);
});

test('19. Büyük Liman finali tamamlanabiliyor (otomatik oyuncu, 60 seed)', () => {
  let complete = 0;
  for (let i = 0; i < 60; i++) {
    const core = newCore();
    core.newRun('FIN' + i);
    const r = createBot(core, { rngSeed: i + 1 }).playRun();
    assert.ok(core.run.ended);
    if (r.result === 'complete') complete++;
  }
  assert.ok(complete > 0, 'en az bir run tamamlanmalı');
});

test('Aynı seed + aynı kararlar = aynı sonuç (deterministik)', () => {
  const play = () => { const core = newCore(); core.newRun('DET'); createBot(core, { rngSeed: 5 }).playRun(); return JSON.stringify([core.run.xp, core.run.stats, core.run.ship]); };
  assert.equal(play(), play());
});
