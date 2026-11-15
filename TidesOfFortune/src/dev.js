// Geliştirme/test kancaları: sahne denetleyici (tools/scenecheck.cjs) eventleri zorla tetikler.
// Oyuncu arayüzünden erişilemez; yalnızca window.__tofForceEvent vb. ile çağrılır.
import { ALL_EVENTS, EVENT_BY_ID } from './data/events.js';
import { PET_BY_ID } from './data/pets.js';

/** Bir koşul ağacını (req / when) karşılayacak şekilde run'ı düzenle */
function satisfy(run, r) {
  if (!r) return;
  if (r.all) r.all.forEach((x) => satisfy(run, x));
  if (r.any) satisfy(run, r.any[0]);
  if (r.crew && !run.crew.includes(r.crew)) run.crew.push(r.crew);
  if (r.crewAny && !r.crewAny.some((c) => run.crew.includes(c))) run.crew.push(r.crewAny[0]);
  if (r.crewAvailable && !run.crew.includes(r.crewAvailable)) run.crew.push(r.crewAvailable);
  if (r.item && !run.items.some((i) => i.id === r.item)) run.items.push({ id: r.item });
  if (r.pet && !run.pets.includes(r.pet)) run.pets.push(r.pet);
  if (r.cargoGood && !run.cargo.some((l) => l.good === r.cargoGood)) run.cargo.push({ good: r.cargoGood, qty: 1, cost: 10 });
  if (r.cargoGoods && !run.cargo.some((l) => r.cargoGoods.includes(l.good))) run.cargo.push({ good: r.cargoGoods[0], qty: 2, cost: 10 });
}
function unsatisfy(run, w) {
  if (!w) return;
  if (w.all) { unsatisfy(run, w.all[0]); return; }
  if (w.crew) run.crew = run.crew.filter((c) => c !== w.crew);
  if (w.pet) run.pets = run.pets.filter((c) => c !== w.pet);
  if (w.item) run.items = run.items.filter((i) => i.id !== w.item);
}

/** Limana varışta oynayan eventler (zincirde nextAt: 'arrival' ile çağrılanlar + Zıpır & Tarçın rıhtım sahnesi) */
const ARRIVAL = new Set(['EVT_SPECIAL_ZIPIR_TARCIN']);
for (const e of ALL_EVENTS) for (const o of e.options || []) for (const out of [o.win, o.lose, ...(Array.isArray(o.win) ? o.win : [])]) if (out?.fx?.next && out.fx.nextAt === 'arrival') ARRIVAL.add(out.fx.next);

export function installDevHooks(T) {
  window.__tofIsArrival = (id) => ARRIVAL.has(id);
  window.__tofAllEvents = () => ALL_EVENTS.map((e) => e.id);
  window.__tofEventInfo = (id) => ({ options: EVENT_BY_ID[id].options.length, auto: (EVENT_BY_ID[id].auto || []).length });
  window.__tofForceEvent = (id, k) => {
    const { core, ui } = T;
    const ev = EVENT_BY_ID[id];
    if (!ev) return false;
    if (k === 'auto' && !(ev.auto || []).length) return false;
    if (core.run) core.dismissSummary?.();
    core.newRun('SCENE' + id);
    let g = 0;
    while (core.run.phase === 'arrival' && g++ < 10) { const a = core.run.arrival; if (a.current && !a.current.result) core.choose('o0'); else core.arrivalNext(); }
    const run = core.run;
    run.gold = 900;
    run.crew = ['CREW_GROOT', 'CREW_PITA'];
    run.pets = ['PET_TARCIN'];
    run.items = [];
    run.cargo = [{ good: 'GOOD_SPICE', qty: 3, cost: 20 }, { good: 'GOOD_WINE', qty: 2, cost: 20 }, { good: 'GOOD_GRAIN', qty: 2, cost: 10 }];
    if (ev.cond) satisfy(run, { crew: ev.cond.crew, pet: ev.cond.pet });
    const petFor = { EVT_PET_MONKEY: 'PET_CUCE', EVT_PET_PARROT: 'PET_KIRMIZI', EVT_PET_MIDNIGHT: 'PET_GECEYARISI', EVT_PET_TARCIN_NOSE: 'PET_TARCIN' }[id];
    if (petFor) satisfy(run, { pet: petFor });
    if (k === 'auto') satisfy(run, ev.auto[0].when);
    else {
      for (const a of ev.auto || []) unsatisfy(run, a.when);
      satisfy(run, ev.options[k]?.req);
      if (ev.options[k]?.consume) satisfy(run, { item: ev.options[k].consume });
      if (ev.options[k]?.cost?.gold) run.gold = Math.max(run.gold, ev.options[k].cost.gold + 50);
    }
    // sınıf limitlerini test için yok say: tayfa listesi doğrudan güverteye yansır
    run.pets = run.pets.filter((p) => PET_BY_ID[p]);
    if (ARRIVAL.has(id)) {
      if (ev.chain) run.chains[ev.chain] = run.chains[ev.chain] || { status: 'active', flags: {}, step: ev.step || 1 };
      if (id === 'CH_PIRATE_OFFER_3A' && k !== 2) run.cargo.push({ good: 'GOOD_PIRATE_CHEST', qty: 1, cost: 0 });
      if (id === 'CH_SMUGGLER_3' && k !== 2) run.cargo.push({ good: 'GOOD_CHARM_DUST', qty: 2, cost: 0 });
      run.phase = 'arrival';
      run.arrival = { report: [], queue: [{ id, src: 'test' }], pos: 0, current: null };
      ui.view = 'game';
      ui.sceneKey = null;
      ui.render();
      setTimeout(() => { core.arrivalNext(); ui.render(); }, 400);
      return true;
    }
    core.depart(0);
    const v = core.run.voyage;
    v.queue[v.pos] = { id, src: 'test' };
    if (ev.chain) core.run.chains[ev.chain] = core.run.chains[ev.chain] || { status: 'active', flags: {}, step: ev.step || 1 };
    ui.view = 'game';
    ui.sceneKey = null;
    ui.render();
    setTimeout(() => { const d = ui.director; d.nextAt = (v.elapsed || 0) + 0.5; }, 300);
    return true;
  };
}
