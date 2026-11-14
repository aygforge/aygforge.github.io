// GameCore: run akışını (varış → liman → yolculuk → event → varış → ...) yöneten durum makinesi.
// Her eylem atomiktir: doğrulanır, uygulanır, RNG durumu ile birlikte kaydedilir ve dinleyicilere bildirilir.
import { BALANCE } from '../config/balance.js';
import { HARBOR_BY_ID, HARBOR_TYPES } from '../data/harbors.js';
import { EVENT_BY_ID } from '../data/events.js';
import { GOOD_BY_ID } from '../data/goods.js';
import { ITEM_BY_ID } from '../data/items.js';
import { CREW_BY_ID } from '../data/crew.js';
import { SeededRNG, randomSeedString } from './SeededRNG.js';
import { createRun, createMeta, createSettings } from './GameState.js';
import { SaveManager } from './SaveManager.js';
import * as Ship from '../systems/ShipSystem.js';
import * as Trade from '../systems/TradeSystem.js';
import * as Items from '../systems/ItemSystem.js';
import * as Crew from '../systems/CrewSystem.js';
import * as Pets from '../systems/PetSystem.js';
import * as Repair from '../systems/RepairSystem.js';
import * as Route from '../systems/RouteSystem.js';
import * as Events from '../systems/EventSystem.js';
import * as Prog from '../systems/ProgressionSystem.js';

export class GameCore {
  constructor(storage) {
    this.saves = new SaveManager(storage);
    this.meta = this.saves.loadMeta();
    this.settings = this.saves.loadSettings();
    this.run = this.saves.loadRun();
    this.rng = new SeededRNG(1);
    if (this.run) this.rng.setState(this.run.rngState || 1);
    this.listeners = new Set();
    this.busy = false;
    this.pendingToasts = [];
  }

  /** Sistemlere geçirilen bağlam */
  get G() {
    const self = this;
    if (!this._G) {
      this._G = {
        get meta() { return self.meta; },
        get run() { return self.run; },
        get settings() { return self.settings; },
        pendingToasts: this.pendingToasts,
        ctxRegion: 1,
      };
    }
    return this._G;
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(kind = 'change', data = null) {
    for (const fn of this.listeners) fn(kind, data);
  }

  takeToasts() {
    const t = this.pendingToasts.splice(0);
    return t;
  }

  persist() {
    if (this.run) this.run.rngState = this.rng.getState();
    this.saves.saveMeta(this.meta);
    this.saves.saveRun(this.run);
  }

  saveSettings() {
    this.saves.saveSettings(this.settings);
  }

  /** Eylem sarmalayıcı: yeniden girişi engeller, kaydeder, bildirir. */
  act(name, fn) {
    if (this.busy) return { ok: false, reason: 'İşlem sürüyor.' };
    this.busy = true;
    let res;
    try {
      res = fn() || { ok: true };
    } catch (e) {
      console.error(`[GameCore] ${name}`, e);
      res = { ok: false, reason: 'Beklenmeyen bir hata oluştu.', error: e };
    } finally {
      this.busy = false;
    }
    if (res.ok !== false) {
      this.checkRunAchievements();
      this.persist();
    }
    this.emit('change', { action: name, res });
    return res;
  }

  hasActiveRun() {
    return !!this.run && !this.run.ended;
  }

  // ───────────── Run başlangıcı ─────────────

  newRun(seedStr = null) {
    return this.act('newRun', () => {
      const seed = (seedStr || randomSeedString()).toUpperCase();
      const plan = Route.generateRoute(seed, this.meta);
      const route = plan.route;
      this.run = createRun(this.meta, seed, route);
      this.run.totalHarbors = plan.total;
      this.rng = SeededRNG.derive(seed, 'events');
      const sp = SeededRNG.derive(seed, 'special1');
      this.run.special.firstAt = sp.int(0, Math.min(BALANCE.special.firstWithinHarbors, plan.total - 1) - 1);
      const lines = [{ kind: 'info', text: `Paslı Martı yeni bir sefere hazırlanıyor. Başlangıç limanı: ${HARBOR_BY_ID[route[0].harborId].name}. Rota belirsiz: her limanda yeni deniz yolları seçeceksin. Son durak Büyük Liman.` }];
      lines.push(...Prog.discoverHarbor(this.G, route[0].harborId));
      const queue = [];
      if (this.run.special.firstAt === 0) {
        queue.push({ id: 'EVT_SPECIAL_ZIPIR_TARCIN', src: 'special' });
        this.run.special.stage = 'offered';
      }
      this.run.arrival = { report: lines, queue, pos: 0, current: null, first: true };
      this.run.phase = 'arrival';
      return { ok: true, seed };
    });
  }

  // ───────────── Varış ─────────────

  /** Varış raporunu/eventlerini ilerletir; bitince limana girer. */
  arrivalNext() {
    return this.act('arrivalNext', () => {
      const run = this.run;
      if (!run || run.phase !== 'arrival') return { ok: false, reason: 'Varış aşamasında değilsin.' };
      const a = run.arrival;
      if (a.current) {
        if (!a.current.result) return { ok: false, reason: 'Önce eventi çöz.' };
        this._closePending(a);
        a.current = null;
        if (run.ship.hull <= 0) return this._sink();
      }
      const ctx = { region: HARBOR_BY_ID[run.route[run.idx].harborId].region };
      const cur = Events.triggerNext(this.G, a, this.rng, ctx);
      if (cur) return { ok: true, event: cur.id };
      this._enterHarbor();
      return { ok: true, entered: true };
    });
  }

  _enterHarbor() {
    const run = this.run;
    const G = this.G;
    const statuses = run.pendingStatus.slice();
    run.pendingStatus = [];
    const idx = run.idx;
    const harbor = HARBOR_BY_ID[run.route[idx].harborId];
    const tipRng = SeededRNG.derive(run.seed, 'tip', idx);
    run.visit = {
      idx,
      harborId: harbor.id,
      key: `v${idx}-${harbor.id}`,
      statuses,
      market: Trade.generateMarket(G, idx, statuses),
      items: Items.generateItemOffers(G, idx, { rareGuaranteed: run.buffs.rareNext }),
      itemsBought: [],
      crew: Crew.generateCrewOffers(G, idx),
      crewHired: [],
      pet: Pets.generatePetOffer(G, idx),
      petBought: false,
      starterPicks: idx === 0 && BALANCE.start.freeStarterItems ? BALANCE.start.starterItemCount : 0,
      prevPrices: run.prevPrices,
      tipGood: null,
      lanes: harbor.final ? [] : Route.generateLanes(G, idx),
    };
    if (!harbor.final && !run.visit.lanes.length) {
      // Havuz tükendiyse (çok nadir) doğrudan Büyük Liman'a giden yol
      run.totalHarbors = idx + 2;
      run.visit.lanes = Route.generateLanes(G, idx);
    }
    run.visit.tipGood = tipRng.pick(run.visit.market.map((m) => m.good));
    run.buffs.rareNext = false;
    for (const c of run.visit.crew) this.meta.codex.crewMet[c] = true;
    if (run.visit.pet) this.meta.codex.pets[run.visit.pet] ||= false;
    run.arrival = null;
    run.phase = 'harbor';
  }

  // ───────────── Liman eylemleri ─────────────

  _harborGuard() {
    if (!this.run || this.run.phase !== 'harbor' || !this.run.visit) return { ok: false, reason: 'Limanda değilsin.' };
    return null;
  }

  buyGood(goodId, qty = 1) {
    return this.act('buyGood', () => this._harborGuard() || Trade.buyGood(this.G, goodId, qty));
  }

  sellLot(lotId, qty = 1) {
    return this.act('sellLot', () => {
      const g = this._harborGuard();
      if (g) return g;
      const res = Trade.sellLot(this.G, lotId, qty);
      if (res.ok && res.profit > 0) res.xp = this._tradeXp(res.profit);
      return res;
    });
  }

  _tradeXp(profit) {
    const run = this.run;
    run.xpFrac = (run.xpFrac || 0) + profit / BALANCE.trade.xpPerProfit;
    const whole = Math.floor(run.xpFrac);
    run.xpFrac -= whole;
    if (whole <= 0) return 0;
    const harbor = run.visit ? HARBOR_BY_ID[run.visit.harborId] : null;
    return Prog.addXp(this.G, whole, 'trade', { atGrandHarbor: !!harbor?.final });
  }

  buyItem(id, replaceUid = null) {
    return this.act('buyItem', () => this._harborGuard() || Items.buyItem(this.G, id, replaceUid));
  }

  discardItem(uid) {
    return this.act('discardItem', () => (Items.discardItem(this.G, uid) ? { ok: true } : { ok: false, reason: 'Item bulunamadı.' }));
  }

  useRepairKit(uid) {
    return this.act('useRepairKit', () => {
      if (!this.run || this.run.ended) return { ok: false, reason: 'Aktif run yok.' };
      return Items.useRepairKit(this.G, uid);
    });
  }

  repair(id) {
    return this.act('repair', () => this._harborGuard() || Repair.doRepair(this.G, id));
  }

  upgradeShip() {
    return this.act('upgradeShip', () => {
      const g = this._harborGuard();
      if (g) return g;
      if (!Repair.shipyardOf(this.G).upgrade) return { ok: false, reason: 'Bu limanın tersanesi gemi yükseltemez.' };
      const r = Ship.upgradeShip(this.G);
      if (r.ok && this.run.ship.level >= 5) Prog.unlockAchievement(this.G, 'ACH_GALLEON');
      return r;
    });
  }

  hireCrew(id, replaceId = null) {
    return this.act('hireCrew', () => this._harborGuard() || Crew.hireCrew(this.G, id, replaceId));
  }

  dismissCrew(id) {
    return this.act('dismissCrew', () => (Crew.dismissCrew(this.G, id) ? { ok: true } : { ok: false, reason: 'Tayfa bulunamadı.' }));
  }

  buyPet(replaceId = null) {
    return this.act('buyPet', () => {
      const g = this._harborGuard();
      if (g) return g;
      const res = Pets.buyPet(this.G, replaceId);
      return res;
    });
  }

  releasePet(id) {
    return this.act('releasePet', () => (Pets.releasePet(this.G, id) ? { ok: true } : { ok: false, reason: 'Hayvan bulunamadı.' }));
  }

  buyBiscuit() {
    return this.act('buyBiscuit', () => this._harborGuard() || Pets.buyBiscuit(this.G));
  }

  /** Yola çık: seçilen deniz yolunun (gizli) hedefi rotaya eklenir, event kuyruğu üretilir. */
  depart(laneIndex = 0) {
    return this.act('depart', () => {
      const g = this._harborGuard();
      if (g) return g;
      const run = this.run;
      const harbor = HARBOR_BY_ID[run.visit.harborId];
      if (harbor.final) return { ok: false, reason: "Büyük Liman son durak. Run'ı tamamlayabilirsin." };
      const lane = run.visit.lanes[laneIndex];
      if (!lane) return { ok: false, reason: 'Geçersiz deniz yolu.' };
      run.route[run.idx].distance = lane.distance;
      run.route.length = run.idx + 1;
      run.route.push({ harborId: lane.harborId, distance: null });
      run.laneDanger = lane.danger;
      run.currentLane = { type: lane.type, danger: lane.danger, pirates: lane.pirates, region: lane.region, rumors: lane.rumors, hintType: lane.hintType };
      run.prevPrices = Trade.snapshotPrices(this.G, harbor.id);
      run.lastVisitItems = run.visit.items.slice();
      run.visit = null;
      Events.buildVoyage(this.G);
      run.voyage.duration = Route.voyageDuration(run.seed, run.idx, lane.distance);
      run.voyage.elapsed = 0;
      run.phase = 'voyage';
      if (run.crew.length >= 5) Prog.unlockAchievement(this.G, 'ACH_FULL_CREW');
      return { ok: true };
    });
  }

  // ───────────── Yolculuk ve eventler ─────────────

  host() {
    if (!this.run) return null;
    if (this.run.phase === 'voyage') return this.run.voyage;
    if (this.run.phase === 'arrival') return this.run.arrival;
    return null;
  }

  routeCtx() {
    const v = this.run.voyage;
    return Events.routeCtx(this.G, v.toIdx);
  }

  /** Yolculukta sıradaki eventi tetikler; kuyruk bittiyse limana varılır. */
  nextEvent() {
    return this.act('nextEvent', () => {
      const run = this.run;
      if (!run || run.phase !== 'voyage') return { ok: false, reason: 'Yolculukta değilsin.' };
      const v = run.voyage;
      if (v.current) return { ok: true, event: v.current.id, already: true };
      const cur = Events.triggerNext(this.G, v, this.rng, this.routeCtx());
      if (cur) return { ok: true, event: cur.id };
      return this._finishRoute();
    });
  }

  choose(key) {
    return this.act('choose', () => {
      const h = this.host();
      if (!h || !h.current) return { ok: false, reason: 'Aktif event yok.' };
      const ctx = this.run.phase === 'voyage' ? this.routeCtx() : { region: HARBOR_BY_ID[this.run.route[this.run.idx].harborId].region };
      const res = Events.resolveOption(this.G, h, key, this.rng, ctx);
      return res;
    });
  }

  /** Event sonucundaki bekleyen seçimler (item/tayfa/hayvan/mini ticaret/seyyar tüccar) */
  pendingAction(index, action, payload = {}) {
    return this.act('pendingAction', () => {
      const h = this.host();
      const cur = h?.current;
      if (!cur || !cur.result) return { ok: false, reason: 'Aktif sonuç yok.' };
      const p = cur.result.pending[index];
      if (!p || p.done) return { ok: false, reason: 'Bu seçim zaten tamamlandı.' };
      return this._doPending(p, action, payload);
    });
  }

  _doPending(p, action, payload) {
    const G = this.G;
    const run = this.run;
    if (action === 'decline' || action === 'close') {
      p.done = true;
      p.declined = action === 'decline';
      Events.onPendingDeclined(G, p);
      return { ok: true };
    }
    if (p.type === 'item' && action === 'take') {
      const r = Items.addItem(G, p.id, payload.replaceUid);
      if (r.ok) p.done = true;
      return r;
    }
    if (p.type === 'crew' && action === 'take') {
      if (!p.ids.includes(payload.id)) return { ok: false, reason: 'Geçersiz tayfa.' };
      const r = Crew.addCrew(G, payload.id, payload.replaceId);
      if (r.ok) {
        p.done = true;
        p.taken = payload.id;
      }
      return r;
    }
    if (p.type === 'pet' && action === 'take') {
      const r = Pets.addPet(G, p.id, payload.replaceId);
      if (r.ok) {
        p.done = true;
        Events.onPetJoined(G, p.id, p.special, r);
      }
      return r;
    }
    if (p.type === 'trade') {
      if (action === 'buy') {
        const g = p.goods.find((x) => x.good === payload.good);
        if (!g || g.stock <= 0) return { ok: false, reason: 'Stok kalmadı.' };
        if (Ship.cargoFree(G) <= 0) return { ok: false, reason: 'Kargo dolu.' };
        if (run.gold < g.price) return { ok: false, reason: 'Yetersiz altın.' };
        run.gold -= g.price;
        g.stock -= 1;
        Trade.addCargo(G, g.good, 1, g.price);
        return { ok: true };
      }
      if (action === 'sell') {
        const lot = run.cargo.find((l) => l.id === payload.lotId);
        if (!lot) return { ok: false, reason: 'Parti bulunamadı.' };
        const good = GOOD_BY_ID[lot.good];
        if (good.questItem) return { ok: false, reason: 'Bu sandık satılamaz.' };
        const bonus = Trade.sellBonuses(G, lot.good).reduce((s, b) => s + b.v, 0);
        const unit = Math.round(good.sell * p.sellMult * (1 + bonus) * (lot.spoiled ? BALANCE.trade.spoiledSellFactor : 1));
        run.gold += unit;
        run.stats.goldEarned += unit;
        const profit = unit - lot.cost;
        lot.qty -= 1;
        if (lot.qty <= 0) run.cargo.splice(run.cargo.indexOf(lot), 1);
        if (profit > 0) {
          run.stats.profit += profit;
          this._tradeXp(profit);
        }
        return { ok: true, unit };
      }
    }
    if (p.type === 'shop' && action === 'buy') {
      const it = p.items.find((x) => x.id === payload.id);
      if (!it || it.bought) return { ok: false, reason: 'Bu item satıldı.' };
      if (run.gold < it.price) return { ok: false, reason: 'Yetersiz altın.' };
      const r = Items.addItem(G, it.id, payload.replaceUid);
      if (!r.ok) return r;
      run.gold -= it.price;
      it.bought = true;
      return { ok: true };
    }
    return { ok: false, reason: 'Geçersiz işlem.' };
  }

  _closePending(host) {
    const res = host.current?.result;
    if (!res) return;
    for (const p of res.pending || []) {
      if (!p.done) {
        p.done = true;
        p.declined = true;
        Events.onPendingDeclined(this.G, p);
      }
    }
  }

  /** Gerçek zamanlı seyir süresini kaydeder (yalnızca sunum; kurallara etkisi yok). */
  setVoyageElapsed(t, persist = false) {
    const v = this.run?.voyage;
    if (!v) return;
    v.elapsed = Math.max(v.elapsed || 0, t);
    if (persist) this.persist();
  }

  /** Event sonucunu kapatır ve yolculuğa devam eder. */
  continueEvent() {
    return this.act('continueEvent', () => {
      const run = this.run;
      const h = this.host();
      if (!h || !h.current || !h.current.result) return { ok: false, reason: 'Kapatılacak sonuç yok.' };
      if (run.phase === 'arrival') return { ok: false, reason: 'Varışta arrivalNext kullanılır.' };
      this._closePending(h);
      h.current = null;
      if (run.ship.hull <= 0) return this._sink();
      return { ok: true };
    });
  }

  _sink() {
    const run = this.run;
    run.voyage = null;
    Prog.finalizeRun(this.G, 'sunk');
    return { ok: true, sunk: true };
  }

  /** Rota sonu: Groot → sızıntı → bozulma → varış onarımları → XP → varış eventleri */
  _finishRoute() {
    const run = this.run;
    const G = this.G;
    const v = run.voyage;
    const lines = [];
    lines.push(...Repair.routeEndRepairs(G));
    if (run.ship.hull <= 0) return this._sink();
    const spoiled = Trade.rollSpoilage(G, this.rng, v.distance);
    for (const s of spoiled) lines.push({ kind: 'cargo', text: `Yolda bozuldu: ${s.n} ${GOOD_BY_ID[s.good].name}` });
    run.buffs.biscuit = false;
    run.laneDanger = 0;
    run.idx = v.toIdx;
    run.voyage = null;
    const harbor = HARBOR_BY_ID[run.route[run.idx].harborId];
    lines.push(...Repair.arrivalRepairs(G));
    run.stats.harborsReached++;
    let ax = BALANCE.xp.arrival;
    if (harbor.type === 'fishing') ax *= BALANCE.xp.fishingVillageArrivalMult;
    const gotXp = Prog.addXp(G, ax, 'arrival', { atGrandHarbor: !!harbor.final });
    lines.push({ kind: 'xp', text: `Limana varış: +${gotXp} XP` });
    lines.push(...Prog.discoverHarbor(G, harbor.id));
    if (Crew.hasItem(G, 'ITEM_ANCIENT_MAP')) {
      Items.consumeItem(G, 'ITEM_ANCIENT_MAP');
      run.buffs.rareNext = true;
      lines.push({ kind: 'item', text: 'Antik Harita seni limanın gizli bir tüccarına götürdü: bu limanda nadir item garantili.' });
    }
    Prog.unlockAchievement(G, 'ACH_FIRST_VOYAGE');
    if (Ship.hullCategory(G) === 'sinking') Prog.unlockAchievement(G, 'ACH_BORDERLINE');
    const queue = run.pendingArrival.slice();
    run.pendingArrival = [];
    if (run.special.stage === 'pending' && run.idx === run.special.firstAt) {
      queue.push({ id: 'EVT_SPECIAL_ZIPIR_TARCIN', src: 'special' });
      run.special.stage = 'offered';
    }
    run.arrival = { report: lines, queue, pos: 0, current: null };
    run.phase = 'arrival';
    return { ok: true, arrived: harbor.id };
  }

  completeRun() {
    return this.act('completeRun', () => {
      const g = this._harborGuard();
      if (g) return g;
      const harbor = HARBOR_BY_ID[this.run.visit.harborId];
      if (!harbor.final) return { ok: false, reason: "Run yalnızca Büyük Liman'da tamamlanabilir." };
      this.run.visit = null;
      Prog.finalizeRun(this.G, 'complete');
      return { ok: true };
    });
  }

  /** Run özetinden çıkış: aktif run kaydı temizlenir, kalıcı ilerleme kalır. */
  dismissSummary() {
    return this.act('dismissSummary', () => {
      if (this.run && !this.run.ended) return { ok: false, reason: 'Run bitmedi.' };
      this.run = null;
      return { ok: true };
    });
  }

  /** Aktif run'ı terk et (onaylı). XP aktarılır, run batmış sayılmaz ama tamamlanmış da sayılmaz. */
  abandonRun() {
    return this.act('abandonRun', () => {
      if (!this.hasActiveRun()) return { ok: false, reason: 'Aktif run yok.' };
      this.run.voyage = null;
      Prog.finalizeRun(this.G, 'abandoned');
      return { ok: true };
    });
  }

  // ───────────── Meta ─────────────

  buyUpgrade(id) {
    return this.act('buyUpgrade', () => Prog.buyUpgrade(this.meta, id));
  }

  resetAll() {
    this.saves.wipeAll();
    this.meta = createMeta();
    this.run = null;
    this.settings = createSettings();
    this.persist();
    this.saveSettings();
    this.emit('change', { action: 'resetAll' });
    return { ok: true };
  }

  exportSave() {
    return this.saves.exportString(this.meta, this.run, this.settings);
  }

  importSave(str) {
    const p = this.saves.parseImport(str);
    if (!p.ok) return p;
    this.meta = p.meta;
    this.run = p.run;
    if (p.settings) this.settings = { ...createSettings(), ...p.settings };
    if (this.run) this.rng.setState(this.run.rngState || 1);
    this.persist();
    this.saveSettings();
    this.emit('change', { action: 'import' });
    return { ok: true };
  }

  checkRunAchievements() {
    const run = this.run;
    if (!run || run.ended) return;
    run.stats.maxGold = Math.max(run.stats.maxGold, run.gold);
    if (run.gold >= 2000) Prog.unlockAchievement(this.G, 'ACH_RICH');
    if (run.stats.bestSale > 300) Prog.unlockAchievement(this.G, 'ACH_TRADER');
  }
}

export { Ship, Trade, Items, Crew, Pets, Repair, Route, Events, Prog, HARBOR_BY_ID, HARBOR_TYPES, EVENT_BY_ID, ITEM_BY_ID, CREW_BY_ID, GOOD_BY_ID };
