// Otomatik oyuncu: testlerde ve tarayıcı e2e'de oyunu yalnız oyuncu API'siyle oynar.
// Her hareket A* ile erişilebilirlik doğrulanarak yapılır ve yürüyüş süresi kadar oyun saati ilerletilir.
import { findPath } from '../world/grid.js';

const PORTAL = { 'restaurant_interior>railway_outdoors': [16, 35], 'railway_outdoors>restaurant_interior': [54, 44], 'railway_outdoors>town_square': [0, 37], 'town_square>railway_outdoors': [59, 21], 'railway_outdoors>riverbank': [115, 47], 'riverbank>railway_outdoors': [0, 15] };
const WALK_TILES_PER_MIN = (165 / 32) * (1200 / 1020);

export class Bot {
  constructor(sim, opts = {}) { this.sim = sim; this.log = []; this.instant = !!opts.instant; this.onStep = opts.onStep || null; }
  get s() { return this.sim.s; }
  tick(min) { this.sim.tick(min); if (this.onStep) this.onStep(); }
  waitBusy() { let n = 0; while (this.s.player.busy && n++ < 400) this.tick(0.25); }
  // Hedef hücreye (engelliyse komşusuna) yürü; yol yoksa false
  go(tx, ty) {
    const p = this.s.player, sim = this.sim; this.waitBusy();
    const m = sim.map(p.scene); const path = findPath(sim.grid(p.scene), m.w, m.h, Math.floor(p.x), Math.floor(p.y), tx, ty);
    if (!path) { this.log.push(`yol yok ${p.scene} ${tx},${ty}`); return false; }
    if (!this.instant) this.tick(Math.max(0, path.length - 1) / WALK_TILES_PER_MIN);
    return sim.walkPlayerTo(tx, ty);
  }
  toScene(scene) {
    const p = this.s.player; if (p.scene === scene) return true;
    const route = { restaurant_interior: { town_square: 'railway_outdoors', riverbank: 'railway_outdoors' }, town_square: { restaurant_interior: 'railway_outdoors', riverbank: 'railway_outdoors' }, riverbank: { restaurant_interior: 'railway_outdoors', town_square: 'railway_outdoors' } };
    const via = route[p.scene]?.[scene]; if (via && !this.toScene(via)) return false;
    const pt = PORTAL[`${this.s.player.scene}>${scene}`]; if (!pt) return false;
    this.go(pt[0], pt[1]); return this.s.player.scene === scene;
  }
  target(pred) { return this.sim.ia.targets(this.sim).find(pred); }
  // Hedefe yaklaş ve E ile etkileş
  use(pred, scene) {
    if (scene && !this.toScene(scene)) return { ok: false, msg: 'sahneye ulaşılamadı' };
    const t = this.target(pred); if (!t) return { ok: false, msg: 'hedef yok' };
    const cx = Math.floor(t.x + t.w / 2), cy = Math.floor(t.y + t.h / 2) + (t.kind === 'door' ? (t.id === 'door_in' ? -1 : 1) : 0);
    if (!this.go(cx, cy)) return { ok: false, msg: 'hedefe ulaşılamadı' };
    this.waitBusy();
    const t2 = this.target((x) => x.kind === t.kind && x.id === t.id) || t;
    const r = this.sim.ia.interact(this.sim, t2); this.waitBusy(); return r;
  }
  furn(type) { return (t) => t.kind === 'furn' && t.f.type === type; }
  gather(kind, times = 1) {
    this.toScene('railway_outdoors'); let got = 0;
    for (let i = 0; i < times; i++) {
      const p = this.s.player; const nodes = this.sim.map('railway_outdoors').nodes.filter((n) => n.kind === kind && this.sim.farm.nodeState(this.sim, n).alive).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      const n = nodes[0]; if (!n) break; let guard = 0;
      while (this.sim.farm.nodeState(this.sim, n).alive && guard++ < 6) { const r = this.use((t) => t.kind === 'node' && t.id === n.id); if (r.ok === false) { guard = 9; break; } }
      if (guard < 9) got++;
    }
    return got;
  }
  // Yerleştirilebilir geçerli hücre ara ve çantadaki eşyayı yerleştir
  placeItem(itemId, x, y, rot = 0) {
    const p = this.s.player; const i = p.inv.findIndex((sl) => sl && sl.id === itemId); if (i < 0) return { ok: false, msg: 'çantada yok' };
    const d = this.sim.C.placeables[itemId]; this.toScene(d.place === 'outdoor' ? 'railway_outdoors' : 'restaurant_interior');
    return this.sim.build.place(this.sim, i, x, y, rot);
  }
  findSpot(itemId, rot = 0, area = null) {
    const sim = this.sim, d = sim.C.placeables[itemId]; const scene = d.place === 'outdoor' ? 'railway_outdoors' : 'restaurant_interior'; const m = sim.map(scene);
    const [l, t, r, b] = area || [0, 0, m.w - 1, m.h - 1];
    for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) if (sim.build.canPlace(sim, itemId, scene, x, y, rot).ok) return [x, y];
    return null;
  }

  // ---------------- 1. GÜN ----------------
  day1() {
    const sim = this.sim, C = sim.C;
    this.use(this.furn('letter_desk'), 'restaurant_interior');
    this.use(this.furn('old_chest'));
    this.gather('tree', 3); this.gather('rock', 2);
    this.use((t) => t.kind === 'door', 'restaurant_interior');
    this.use(this.furn('workbench'));
    sim.build.craft(sim, 'simple_table'); sim.build.craft(sim, 'wooden_chair'); sim.build.craft(sim, 'wooden_chair');
    this.placeItem('simple_table', 18, 22, 0); this.placeItem('wooden_chair', 17, 22, 3); this.placeItem('wooden_chair', 20, 22, 1);
    this.use(this.furn('starter_stove'));
    this.toScene('railway_outdoors'); this.go(68, 47);
    sim.town.mailOrder(sim, { ...C.tutorial.order });
    this.toScene('restaurant_interior'); this.use(this.furn('player_bed'));
    return sim.daysys.sleep(sim, false);
  }
  // ---------------- 2. GÜN ----------------
  day2Prep() {
    const sim = this.sim;
    this.use((t) => t.kind === 'obj' && t.id === 'crate', 'railway_outdoors');
    this.toScene('restaurant_interior');
    this.cook('vegetable_soup', true);
    this.stockDrinks();
    if (!this.s.open) this.use((t) => t.kind === 'door');
  }
  cook(recipeId, waitDone = false) {
    const sim = this.sim, r = sim.C.recipes[recipeId];
    const st = sim.kitchen.stationsFor(sim, r.station).find((f) => !f.cook); if (!st) return false;
    if (!sim.kitchen.recipeStatus(sim, r).unlocked || !sim.inv.has(sim, r.ingredients)) return false;
    this.toScene('restaurant_interior'); if (!this.go(st.x, st.y)) return false;
    const res = sim.kitchen.startCooking(sim, st.id, recipeId); if (!res.ok) return false;
    this.waitBusy();
    if (waitDone) { let n = 0; while (st.cook && st.cook.phase !== 'done' && n++ < 2000) this.tick(0.5); this.potToBar(); }
    return true;
  }
  potToBar() {
    const sim = this.sim; this.toScene('restaurant_interior');
    for (const f of this.s.furniture.filter((x) => x.cook?.phase === 'done')) {
      if (this.s.player.pot || this.s.player.carry.length) break;
      const b = sim.kitchen.batch(sim, f.cook.batch); if (b.lock) continue;
      this.go(f.x, f.y); if (!sim.kitchen.takePot(sim, f.id).ok) continue;
      this.depositPot();
    }
    // tezgâhta bekleyen hazır stok
    for (const b of sim.kitchen.readyBatches(sim)) {
      if (this.s.player.pot || this.s.player.carry.length || b.lock || !sim.kitchen.isFresh(sim, b)) continue;
      if (!sim.kitchen.barModules(sim).some((m) => sim.kitchen.findSlotFor(sim, m, b.item) >= 0 && m.slots.some((sl, i) => (!sl.item || sl.item === b.item) && sl.kind === sim.C.recipes[b.item].kind && sim.kitchen.slotFill(sim, m.id, i) < 12))) continue;
      const sh = sim.furn(b.inst); if (!sh) continue; this.go(sh.x, sh.y); if (sim.kitchen.takeReady(sim, sh.id).ok) this.depositPot();
    }
  }
  depositPot() {
    const sim = this.sim, p = this.s.player;
    for (const m of sim.kitchen.barModules(sim)) { if (!p.pot) break; const b = sim.kitchen.batch(sim, p.pot); if (sim.kitchen.findSlotFor(sim, m, b.item) < 0) continue; this.go(m.x, m.y); sim.kitchen.stockPot(sim, m.id); }
    if (p.pot) { const sh = this.s.furniture.find((f) => sim.def(f).readyShelf); if (sh) { this.go(sh.x, sh.y); sim.kitchen.putPotDown(sim, sh.id); } }
  }
  stockDrinks() {
    const sim = this.sim;
    for (const m of sim.kitchen.barModules(sim)) m.slots.forEach((sl, i) => {
      if (sl.kind !== 'drink') return; const fill = sim.kitchen.slotFill(sim, m.id, i); if (fill >= 12) return;
      const item = sl.item || Object.values(sim.C.recipes).find((r) => r.ready && sim.inv.count(sim, r.id) > 0)?.id; if (!item || !sim.C.recipes[item].ready || sim.inv.count(sim, item) < 1) return;
      this.toScene('restaurant_interior'); this.go(m.x, m.y); sim.kitchen.stockBottles(sim, m.id, i, item, 12 - fill);
    });
  }
  // Bir servis turu: karşıla → sipariş → bardan al → servis → tahsilat → temizlik
  serviceStep() {
    const sim = this.sim, s = this.s, S = sim.service; let did = false;
    if (s.player.scene !== 'restaurant_interior') this.toScene('restaurant_interior');
    for (const g of s.groups.filter((x) => x.state === 'WAIT_PAYMENT')) { if (g.state !== 'WAIT_PAYMENT') continue; const t = sim.furn(g.table); this.go(t.x, t.y); if (g.state === 'WAIT_PAYMENT' && S.collectPayment(sim, g.id).ok) did = true; }
    for (const g of s.groups.filter((x) => x.state === 'ENTRY_QUEUE')) {
      if (g.state !== 'ENTRY_QUEUE') continue; const opt = S.freeTablesFor(sim, g.members.length)[0]; if (!opt) continue;
      const c = S.members(sim, g)[0]; this.go(Math.floor(c.x), Math.floor(c.y) + 1); if (g.state === 'ENTRY_QUEUE' && S.greet(sim, g.id, opt.table.id).ok) did = true;
    }
    for (const g of s.groups.filter((x) => x.state === 'ORDER_READY')) { if (g.state !== 'ORDER_READY') continue; const t = sim.furn(g.table); this.go(t.x, t.y); if (g.state === 'ORDER_READY') { S.takeOrder(sim, g.id); did = true; } }
    if (s.player.carry.some((c) => c.orphan)) { const m = sim.kitchen.barModules(sim)[0]; this.go(m.x, m.y); S.returnOrphans(sim); }
    for (let guard = 0; guard < 3; guard++) {
      const m = sim.kitchen.barModules(sim).find((x) => S.pendingAt(sim, x.id).length); if (!m && !s.player.carry.length) break;
      if (m) { this.go(m.x, m.y); S.pickupAt(sim, m.id); }
      const tables = [...new Set(s.player.carry.filter((c) => !c.orphan).map((c) => c.table))]; if (!tables.length) break;
      for (const tid of tables) { const t = sim.furn(tid); if (!t) continue; this.go(t.x, t.y); S.serveTable(sim, tid); did = true; }
      if (s.player.carry.some((c) => c.orphan)) { const b = sim.kitchen.barModules(sim)[0]; this.go(b.x, b.y); S.returnOrphans(sim); }
    }
    for (const id of Object.keys(s.dirty)) { if (!s.dirty[id] || (s.dirty[id].lock && s.dirty[id].lock !== 'player')) continue; const t = sim.furn(id); this.go(t.x, t.y); if (s.dirty[id] && S.startCleanTable(sim, id).ok) { this.waitBusy(); did = true; } }
    for (const st of [...s.stains]) { if (!s.stains.includes(st) || (st.lock && st.lock !== 'player')) continue; this.go(st.x, st.y); if (s.stains.includes(st) && S.startCleanStain(sim, st.id).ok) { this.waitBusy(); did = true; } }
    return did;
  }
  // Menüyü dolu tut: açık en kârlı tarifleri pişir, bara taşı
  kitchenStep() {
    const sim = this.sim, s = this.s; if (s.closing.active) return;
    this.potToBar(); this.stockDrinks();
    const menu = sim.kitchen.menu(sim); const foodStock = Object.values(menu).filter((m) => m.kind === 'food').reduce((a, m) => a + m.available, 0) + s.batches.filter((b) => b.loc !== 'bar' && sim.C.recipes[b.item].kind === 'food').reduce((a, b) => a + b.qty, 0);
    const cookingNow = s.furniture.filter((f) => f.cook).length;
    const want = 4 + s.stage * 3;
    if (foodStock + cookingNow * 4 >= want || s.minute > 1290) return;
    const recs = Object.values(sim.C.recipes).filter((r) => !r.ready && sim.kitchen.recipeStatus(sim, r).unlocked && sim.inv.has(sim, r.ingredients)).sort((a, b) => b.profit - a.profit);
    const inMenu = new Set(Object.keys(menu)); const slotsFree = sim.kitchen.barModules(sim).some((m) => m.slots.some((sl) => sl.kind === 'food' && !sl.item));
    for (const r of recs) { if (r.kind === 'drink' && !sim.kitchen.barModules(sim).some((m) => m.slots.some((sl) => sl.kind === 'drink' && (!sl.item || sl.item === r.id)))) continue; if (r.kind === 'food' && !inMenu.has(r.id) && !slotsFree && inMenu.size) continue; if (this.cook(r.id)) break; }
  }
  // Akşam: ertesi gün için posta siparişi (kasaya göre ölçeklenir)
  restock() {
    const sim = this.sim, s = this.s, C = sim.C; const cart = {}; let budget = Math.floor(s.gold * 0.6);
    const recs = Object.values(C.recipes).filter((r) => !r.ready && sim.kitchen.recipeStatus(sim, r).unlocked).sort((a, b) => b.profit - a.profit).slice(0, 2);
    const batches = 2 + s.stage * 2;
    for (const r of recs.length ? recs : [C.recipes.vegetable_soup]) for (let k = 0; k < batches; k++) {
      if (r.cost > budget) break;
      const have = (id) => sim.inv.count(sim, id) + (cart[id] || 0);
      for (const [id, q] of Object.entries(r.ingredients)) { const need = q * (k + 1) - sim.inv.count(sim, id) - (cart[id] || 0) + (cart[id] || 0); void have; const add = Math.max(0, q * (k + 1) - sim.inv.count(sim, id) - (cart[id] || 0)); void need; if (add) { cart[id] = (cart[id] || 0) + add; budget -= add * C.items[id].buy; } }
    }
    const juice = sim.inv.count(sim, 'bottled_juice'); if (juice < 6 && budget >= 36) { cart.bottled_juice = 6; budget -= 36; }
    if (!Object.keys(cart).length) return false;
    this.toScene('railway_outdoors'); this.go(68, 47); return sim.town.mailOrder(sim, cart).ok;
  }
  // Tam bir işletme günü (tutorial sonrası). opts.until: uyumadan önceki dakika
  playDay(opts = {}) {
    const sim = this.sim, s = this.s; const until = opts.until ?? 1335;
    this.use((t) => t.kind === 'obj' && t.id === 'crate', 'railway_outdoors');
    if (opts.morning) opts.morning(this);
    this.toScene('restaurant_interior');
    if (s.flags.canOpen && !s.open && !s.closing.active) { this.kitchenStep(); this.use((t) => t.kind === 'door'); }
    let guard = 0;
    while ((s.minute < until || sim.service.openBusiness(sim).length) && guard++ < 6000) {
      const did = this.serviceStep(); this.kitchenStep();
      if (opts.each) opts.each(this);
      if (s.closing.active && !sim.service.openBusiness(sim).length) break;
      if (!did) this.tick(1);
    }
    if (opts.restock !== false && !s.closing.active) this.restock();
    this.toScene('restaurant_interior'); this.use(this.furn('player_bed'));
    return sim.daysys.sleep(sim, true);
  }

  // Sabah gelişim adımı: proje başlat, eksik kaynağı topla, oturma kapasitesi ekle, personel al
  progress() {
    const sim = this.sim, s = this.s; const list = sim.build.projects(sim);
    const next = list.find((p) => p.main && !p.done && !p.pending) || null;
    const reno = list.find((p) => !p.main && !p.done && !p.pending && s.stage >= p.stage && s.gold >= p.gold + 400);
    for (const p of [next, reno]) {
      if (!p || s.paidCustomers < (p.paid || 0) || s.gold < p.gold) continue;
      const needW = Math.max(0, (p.materials.wood || 0) - sim.inv.count(sim, 'wood')), needS = Math.max(0, (p.materials.stone || 0) - sim.inv.count(sim, 'stone'));
      if (needW) this.gather('tree', Math.min(5, Math.ceil(needW / 6))); if (needS) this.gather('rock', Math.min(4, Math.ceil(needS / 3)));
      const needM = Math.max(0, (p.materials.metal_part || 0) - sim.inv.count(sim, 'metal_part'));
      if (needM && s.gold >= p.gold + needM * 12) { this.toScene('railway_outdoors'); this.go(68, 47); sim.town.mailOrder(sim, { metal_part: needM }); }
      if (sim.build.projects(sim).find((x) => x.id === p.id).reasons.length === 0) { this.use(this.furn('project_board'), 'restaurant_interior'); sim.build.startProject(sim, p.id); }
    }
    const seats = sim.build.totalSeats(sim);
    if (s.flags.tutorialDone && seats < 2 + sim.trainsys.demandTier(sim) * 4 && (!next || s.paidCustomers < next.paid || s.gold < next.gold || sim.inv.count(sim, 'wood') >= (next.materials.wood || 0) + 8)) {
      if (sim.inv.count(sim, 'wood') < 8) this.gather('tree', 2);
      this.addSeating();
    }
    if (s.stage >= 2 && sim.build.trayCapacity(sim) < s.stage && s.stage <= 3 || (s.stage > 3 && sim.build.trayCapacity(sim) < 3)) {
      const t = sim.build.trayCapacity(sim) < 2 ? 'serving_tray' : 'advanced_tray'; const d = sim.C.tools[t];
      if (d && d.stage <= s.stage) { if (sim.inv.has(sim, d.materials)) { this.use(this.furn('workbench'), 'restaurant_interior'); sim.build.craft(sim, t); } else if (s.gold > 100 && !s.deliveries.some((x) => x.items.metal_part)) { if (sim.inv.count(sim, 'wood') < d.materials.wood) this.gather('tree', 1); this.toScene('railway_outdoors'); this.go(68, 47); sim.town.mailOrder(sim, { metal_part: d.materials.metal_part }); } }
    }
    if (s.stage >= 2 && s.staff.roster.length < sim.staffsys.maxActive(sim) && s.gold > 150) { const c = s.staff.candidates[0]; if (c) sim.staffsys.hire(sim, c); }
  }
  addSeating() {
    const sim = this.sim; if (sim.inv.count(sim, 'wood') < 8) return false;
    this.use(this.furn('workbench'), 'restaurant_interior');
    const m = sim.map('restaurant_interior'); let spot = null;
    for (const r of Object.values(m.zoneRects)) { for (let y = r[1] + 2; y <= r[3] - 3 && !spot; y += 3) for (let x = r[0] + 1; x <= r[2] - 4 && !spot; x++) {
      if (sim.build.canPlace(sim, 'simple_table', m.id, x + 1, y, 0).ok && sim.build.canPlace(sim, 'wooden_chair', m.id, x, y, 3).ok && sim.build.canPlace(sim, 'wooden_chair', m.id, x + 3, y, 1).ok) spot = [x, y]; }
      if (spot) break; }
    if (!spot) return false;
    if (!sim.build.craft(sim, 'simple_table').ok) return false; sim.build.craft(sim, 'wooden_chair'); sim.build.craft(sim, 'wooden_chair');
    const a = this.placeItem('simple_table', spot[0] + 1, spot[1], 0); this.placeItem('wooden_chair', spot[0], spot[1], 3); this.placeItem('wooden_chair', spot[0] + 3, spot[1], 1);
    return a.ok;
  }
}
