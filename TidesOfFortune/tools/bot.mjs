// Otomatik oyuncu: simülasyon ve testler için. Basit ama makul kararlar verir.
import { GameCore, Ship, Trade, Items, Repair, Events, HARBOR_BY_ID, GOOD_BY_ID, ITEM_BY_ID, CREW_BY_ID, EVENT_BY_ID } from '../src/core/GameCore.js';
import { memoryStorage } from '../src/core/SaveManager.js';
import { TRADE_GOODS } from '../src/data/goods.js';
import { BALANCE } from '../src/config/balance.js';

const ITEM_PREF = ['ITEM_LIGHT_SAIL', 'ITEM_CANNON', 'ITEM_REPAIR_KIT', 'ITEM_SEXTANT', 'ITEM_ROPES', 'ITEM_HIDDEN_SAFE', 'ITEM_MERCHANT_SEAL', 'ITEM_AMULET', 'ITEM_QUALITY_SEAL', 'ITEM_SEA_CHART', 'ITEM_FLARE', 'ITEM_BLACK_FLAG', 'ITEM_FISH_NET'];

export function createBot(core, { rngSeed = 1, careful = 1, smart = false, endless = 0, contracts = false } = {}) {
  let s = rngSeed >>> 0 || 1;
  const rand = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const stats = { cats: {}, events: 0, upgrades: 0, deathRegion: null };

  function chooseEvent() {
    const h = core.host();
    const opts = Events.getOptions(core.G, h);
    const avail = opts.filter((o) => o.view.available);
    if (!avail.length) throw new Error('Kullanılabilir seçenek yok: ' + h.current.id);
    const score = (o) => {
      const c = o.view.chance == null ? 100 : o.view.chance;
      let sc = c;
      if ((o.opt.tags || []).includes('pass')) sc -= 15;
      if (o.view.cost) sc -= o.view.cost / 8;
      if (o.opt.win && !Array.isArray(o.opt.win) && o.opt.win.fx?.hull < 0) sc += o.opt.win.fx.hull * careful;
      if (o.opt.win && !Array.isArray(o.opt.win) && o.opt.win.fx?.cargoLoss) sc -= o.opt.win.fx.cargoLoss / 2;
      return sc + rand() * 10;
    };
    avail.sort((a, b) => score(b) - score(a));
    const ev = EVENT_BY_ID[h.current.id];
    stats.cats[ev.cat] = (stats.cats[ev.cat] || 0) + 1;
    stats.events++;
    const r = core.choose(avail[0].key);
    if (!r.ok) throw new Error('Seçim başarısız: ' + r.reason);
    // bekleyen seçimler
    const res = h.current.result;
    res.pending.forEach((p, i) => {
      if (p.done) return;
      if (p.type === 'item' && core.run.items.length) core.pendingAction(i, 'take', { replaceUid: core.run.items[0].uid });
      else if (p.type === 'crew') {
        const rep = core.run.crew.length >= Ship.crewSlots(core.G) ? core.run.crew[0] : null;
        core.pendingAction(i, 'take', { id: p.ids[0], replaceId: rep });
      } else if (p.type === 'pet') core.pendingAction(i, 'take', { replaceId: core.run.pets[0] || null });
      else if (p.type === 'trade') {
        for (const lot of core.run.cargo.slice()) if (!GOOD_BY_ID[lot.good].questItem) for (let k = 0; k < lot.qty; k++) core.pendingAction(i, 'sell', { lotId: lot.id });
        core.pendingAction(i, 'close');
      } else core.pendingAction(i, 'close');
    });
  }

  function harborTurn() {
    const G = core.G;
    const run = core.run;
    const visit = run.visit;
    const harbor = HARBOR_BY_ID[visit.harborId];
    // Sat
    for (const lot of run.cargo.slice()) {
      if (GOOD_BY_ID[lot.good].questItem) continue;
      if (!Trade.canSellHere(G, lot).ok) continue;
      const p = Trade.lotSellPrice(G, lot);
      lot._age = (lot._age || 0) + 1;
      if (p > lot.cost || lot.spoiled || harbor.final || lot._age >= 3) core.sellLot(lot.id, lot.qty);
    }
    const e = run.x1?.endless;
    if (harbor.final && !e?.on) {
      // Sonsuz Deniz testi: Büyük Liman'da devam et
      if (endless > 0) { const r = core.enterEndless(); if (!r.ok) throw new Error('enterEndless: ' + r.reason); }
      else { core.completeRun(); return; }
    }
    if (e?.on && e.extra >= endless) { core.endlessExit(); return; }
    // Sözleşmeler (test botu): teklifleri sırayla kabul etmeyi dener
    if (contracts && visit.contracts) visit.contracts.forEach((c, i) => { if (!c.taken) core.acceptContract(i); });
    // Başlangıç itemleri
    while (visit.starterPicks > 0) {
      const avail = visit.items.filter((i) => !visit.itemsBought.includes(i));
      if (!avail.length) break;
      avail.sort((a, b) => (ITEM_PREF.indexOf(a) + 100) % 100 - (ITEM_PREF.indexOf(b) + 100) % 100);
      const r = core.buyItem(avail[0]);
      if (!r.ok) break;
    }
    // Tamir
    const pct = Ship.hullPct(G);
    if (pct < 70) {
      const opts = Repair.repairOptions(G).filter((o) => !o.disabled && o.heal > 0 && o.cost <= run.gold);
      opts.sort((a, b) => b.heal / Math.max(1, b.cost) - a.heal / Math.max(1, a.cost));
      if (pct < 45) opts.sort((a, b) => b.heal - a.heal);
      if (opts[0]) core.repair(opts[0].id);
      if (Ship.hullPct(G) < 50) {
        const o2 = Repair.repairOptions(G).find((o) => o.id === 'patch' && !o.disabled && o.cost <= run.gold);
        if (o2) core.repair('patch');
      }
    }
    // Yükselt
    const uc = Ship.upgradeCost(G);
    if (uc && run.gold >= uc + 40 && Repair.shipyardOf(G).upgrade) {
      if (core.upgradeShip().ok) stats.upgrades++;
    }
    const save = (Ship.upgradeCost(G) || 0) * (run.ship.level < 3 ? 0.6 : 0.3);
    // Tayfa
    for (const id of visit.crew) {
      if (run.crew.length < Ship.crewSlots(G) && run.gold > CREW_BY_ID[id].price + 100 + save) core.hireCrew(id);
    }
    // Item (boş slot)
    for (const id of visit.items) {
      if (run.items.length < Ship.itemSlots(G) && run.gold > ITEM_BY_ID[id].price + 120 + save && ITEM_PREF.includes(id)) core.buyItem(id);
    }
    // Hayvan
    if (visit.pet && !run.pets.length && run.gold > 300) core.buyPet();
    // Mal al: en iyi beklenen marj
    const reserve = 60;
    const cands = visit.market.map((m) => {
      const bp = Trade.buyPrice(G, visit.harborId, m.good);
      const nextId = null;
      // makul oyuncu: malın ortalama satış değerini bilir, yalnızca belirgin ucuzsa alır
      const est = smart && nextId ? Trade.sellPrice(G, nextId, m.good, { statuses: [] }) : GOOD_BY_ID[m.good].sell * BALANCE.trade.valueFactor * (1 - BALANCE.trade.spread / 2) * 1.12;
      return { m, bp, margin: est - bp };
    }).filter((c) => c.margin > 5).sort((a, b) => b.margin / b.bp - a.margin / a.bp);
    for (const c of cands) {
      while (c.m.stock > 0 && Ship.cargoFree(G) > 0 && run.gold - c.bp >= reserve) {
        if (!core.buyGood(c.m.good, 1).ok) break;
      }
    }
    // söylentisi en iyi eşleşen yolu seç (rastgelelik bot tohumundan)
    const lanes = visit.lanes || [];
    const li = lanes.length ? Math.floor(rand() * lanes.length) : 0;
    core.depart(li);
  }

  function step() {
    const run = core.run;
    if (!run) return false;
    if (run.ended) return false;
    if (run.phase === 'arrival') {
      const a = run.arrival;
      if (a.current && !a.current.result) chooseEvent();
      else core.arrivalNext();
      return true;
    }
    if (run.phase === 'harbor') {
      harborTurn();
      return true;
    }
    if (run.phase === 'voyage') {
      const v = run.voyage;
      if (!v.current) {
        const r = core.nextEvent();
        if (!r.ok) throw new Error('nextEvent: ' + r.reason);
      } else if (!v.current.result) chooseEvent();
      else {
        core.continueEvent();
        if (core.run.ended) stats.deathRegion = HARBOR_BY_ID[core.run.route[Math.min(core.run.idx + 1, core.run.route.length - 1)].harborId].region;
      }
      return true;
    }
    return false;
  }

  function playRun(maxSteps = 5000) {
    let n = 0;
    while (step()) {
      if (++n > maxSteps) throw new Error('Run sonsuz döngüye girdi');
    }
    return { result: core.run?.result, stats };
  }

  return { step, playRun, stats };
}

export function newCore() {
  const core = new GameCore(memoryStorage());
  core.meta.tutorialDone = true; // botlar eğitimi oynamaz
  return core;
}
