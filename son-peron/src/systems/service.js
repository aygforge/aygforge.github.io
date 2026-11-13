// Müşteri durum makinesi, masa/sipariş/servis/ödeme zinciri ve temizlik.
// Karşılama, masa seçimi, sipariş alma, son servis ve tahsilat YALNIZ oyuncu eylemleriyle (aşağıdaki
// greet/takeOrder/pickupAt/serveTable/collectPayment) gerçekleşir; personel kodu bunları çağırmaz.
import { PROFILES, PATIENCE, EAT_MINUTES, DRINK_CHANCE, SATISFACTION_WEIGHTS as SW, REGULARS } from '../data/supplement.js';
import * as Kitchen from './kitchen.js';
import * as Build from './building.js';

export const ACTIVE = ['ENTRY_QUEUE', 'WALK_TO_SEAT', 'ORDER_READY', 'WAITING_FOR_SERVE', 'WAIT_PAYMENT'];
const QOFF = [[0, 0], [0, -1], [1, 0], [1, -1]];
const cust = (sim, id) => sim.s.customers.find((c) => c.id === id);
export const group = (sim, id) => sim.s.groups.find((g) => g.id === id);
export const members = (sim, g) => g.members.map((id) => cust(sim, id)).filter(Boolean);
export const order = (sim, id) => sim.s.orders.find((o) => o.id === id);
const setPat = (sim, g, key) => { const [a, b] = PATIENCE[key]; const p = PROFILES[g.profile]; g.patMax = g.pat = (a + sim.rand() * (b - a)) * p.patience * (g.tutorial ? 3 : 1) * (1 + 0.05 * (g.loyalty || 0)); g.phase = key; };
const endPhase = (g) => { g.waits[g.phase] = 1 - Math.max(0, g.pat) / g.patMax; };

export function spawnGroup(sim, { profile, size, train, event, tutorial, delay, regular }) {
  const s = sim.s; const g = { id: sim.nid('g'), profile, members: [], state: 'TRAIN_EXIT', table: null, pat: 0, patMax: 1, phase: null, t: delay || 0, train, event: event || null, tutorial: !!tutorial, waits: {}, order: null, tries: 0, queueIdx: -1, regular: regular || null, loyalty: regular ? (s.regulars[regular]?.loyalty || 0) : 0 };
  for (let i = 0; i < size; i++) {
    const c = { id: sim.nid('c'), group: g.id, scene: 'railway_outdoors', x: 14 + sim.ri(0, 20) + 0.5, y: 55.5, dir: 'up', path: null, pi: 0, st: 'hidden', seat: null, eatT: 0, pref: sim.rand(), drink: sim.rand() < DRINK_CHANCE || (tutorial && s.groups.filter((x) => x.tutorial).length === 0), n: sim.ri(0, 30),
      look: { skin: sim.ri(0, 3), hair: sim.ri(0, 5), style: sim.ri(0, 4), outfit: sim.ri(0, 7), hat: profile === 'railworker' ? 'cap' : profile === 'tourist' && sim.rand() < 0.6 ? 'straw' : profile === 'business' ? 'bowler' : null, small: profile === 'family' && i >= 2, old: profile === 'elder' } };
    s.customers.push(c); g.members.push(c.id);
  }
  s.groups.push(g); return g;
}

export function tick(sim, dt) {
  const s = sim.s;
  for (const g of [...s.groups]) tickGroup(sim, g, dt);
  for (let i = s.passers.length - 1; i >= 0; i--) { const p = s.passers[i]; if (p.t > 0) { p.t -= dt; continue; } if (!p.path && !p.started) { p.started = true; if (!sim.goto(p, p.tx, p.ty)) { s.passers.splice(i, 1); continue; } } if (sim.step(p, dt, sim.npcSpeed(p.n))) s.passers.splice(i, 1); }
}
function stepAll(sim, g, dt, boost = 1) { let all = true; for (const c of members(sim, g)) { if (c.wait > 0) { c.wait -= dt; all = false; continue; } if (c.path) { c.st = 'walk'; if (!sim.step(c, dt, sim.npcSpeed(c.n) * boost)) all = false; else if (c.st === 'walk') c.st = 'stand'; } } return all; }

function tickGroup(sim, g, dt) {
  const s = sim.s, ms = members(sim, g);
  switch (g.state) {
    case 'TRAIN_EXIT': {
      g.t -= dt; if (g.t > 0) break;
      const door = sim.map('railway_outdoors').doorCell; let ok = true;
      ms.forEach((c, i) => { c.st = 'walk'; c.wait = i * 0.35; if (!sim.goto(c, door[0], door[1] + 1)) ok = false; });
      if (!ok) { removeGroup(sim, g); break; }
      g.state = 'WALK_TO_RESTAURANT'; break;
    }
    case 'WALK_TO_RESTAURANT': if (stepAll(sim, g, dt)) { g.t = 0; tryEnter(sim, g); } break;
    case 'OUTSIDE_WAIT': g.t += dt; tryEnter(sim, g); if (g.state === 'OUTSIDE_WAIT' && g.t > 20) leaveOutside(sim, g); break;
    case 'ENTRY_QUEUE': {
      stepAll(sim, g, dt);
      g.pat -= dt * (sim.staffsys.activeRole(sim, 'host_helper') ? 0.75 : 1);
      if (g.pat <= 0) { endPhase(g); unhappy(sim, g, 'Kapıda çok bekledik, başka yere gidiyoruz.'); }
      break;
    }
    case 'WALK_TO_SEAT': {
      let all = true;
      for (const c of ms) {
        if (c.st === 'sit') continue;
        if (!c.path) { // rota yok: tekrar dene, 3 denemeden sonra güvenli yerleştir
          if (!sim.goto(c, c.seat.x, c.seat.y)) { c.tries = (c.tries || 0) + 1; if (c.tries < 3) { all = false; continue; } }
        }
        c.st = 'walk';
        if (!c.path || sim.step(c, dt, sim.npcSpeed(c.n) * (sim.staffsys.activeRole(sim, 'host_helper') ? 1.25 : 1))) { c.x = c.seat.x + 0.5; c.y = c.seat.y + 0.5; c.dir = c.seat.dir; c.st = 'sit'; c.path = null; }
        else all = false;
      }
      if (all) { g.state = 'ORDER_READY'; setPat(sim, g, 'order'); sim.emit('ready_to_order', { group: g.id, table: g.table }); }
      break;
    }
    case 'ORDER_READY': g.pat -= dt; if (g.pat <= 0) { endPhase(g); unhappy(sim, g, 'Siparişimizi alan olmadı.'); } break;
    case 'WAITING_FOR_SERVE': {
      const o = order(sim, g.order); let pending = false, eating = false;
      for (const l of o.lines) if (l.status === 'reserved' || l.status === 'picked') pending = true;
      for (const c of ms) if (c.st === 'eat') { c.eatT -= dt; if (c.eatT <= 0) { c.st = 'done'; sim.emit('finished_eating', { cust: c.id }); } else eating = true; }
      if (pending) { g.pat -= dt; if (g.pat <= 0) { endPhase(g); cancelPending(sim, g, o); pending = false; } }
      if (!pending && !eating) {
        if (o.lines.some((l) => l.status === 'served')) { if (g.waits.serve == null) endPhase(g); g.state = 'WAIT_PAYMENT'; setPat(sim, g, 'pay'); sim.emit('wants_to_pay', { group: g.id, table: g.table }); }
        else unhappy(sim, g, 'Yemeğimiz gelmedi.');
      }
      break;
    }
    case 'WAIT_PAYMENT': g.pat -= dt; if (g.pat <= 0) { endPhase(g); walkOutUnpaid(sim, g, 'Hesabı ödeyemeden çıkmak zorunda kaldık.'); } break;
    case 'LEAVING': {
      const done = stepAll(sim, g, dt);
      if (!done) break;
      if (ms[0] && ms[0].scene === 'restaurant_interior') {
        const out = g.train >= 1260 || sim.rand() < 0.4 ? [1, 37] : [sim.ri(12, 34), 54]; let ok = true;
        ms.forEach((c, i) => { c.scene = 'railway_outdoors'; c.x = 54.5; c.y = 45.5; c.wait = i * 0.3; c.st = 'walk'; if (!sim.goto(c, out[0], out[1])) ok = false; });
        if (!ok) removeGroup(sim, g);
      } else removeGroup(sim, g);
      break;
    }
  }
}
function queueCount(sim) { return sim.s.groups.filter((g) => g.state === 'ENTRY_QUEUE').length; }
function tryEnter(sim, g) {
  const s = sim.s;
  if (!s.open || s.closing.active || !Kitchen.menuAvailable(sim)) return leaveOutside(sim, g);
  if (queueCount(sim) >= sim.C.queueMax) { g.state = 'OUTSIDE_WAIT'; return; }
  const used = new Set(s.groups.filter((x) => x.state === 'ENTRY_QUEUE').map((x) => x.queueIdx)); const m = sim.map('restaurant_interior');
  g.queueIdx = [0, 1, 2].find((i) => !used.has(i)); const [qx, qy] = m.points.queue[g.queueIdx];
  members(sim, g).forEach((c, i) => { c.scene = 'restaurant_interior'; c.x = 16.5; c.y = 34.5; c.wait = i * 0.25; sim.goto(c, qx + QOFF[i][0], qy + QOFF[i][1]); });
  g.state = 'ENTRY_QUEUE'; setPat(sim, g, 'door');
  sim.emit('group_arrived', { group: g.id, size: g.members.length });
}
function leaveOutside(sim, g) { g.state = 'LEAVING'; let ok = true; members(sim, g).forEach((c) => { c.st = 'walk'; if (!sim.goto(c, 1, 37)) ok = false; }); if (!ok) removeGroup(sim, g); }
function startLeaving(sim, g) {
  const s = sim.s; const hadFood = g.order && order(sim, g.order).lines.some((l) => l.status === 'served');
  if (g.table && hadFood) { s.dirty[g.table] = { plates: true }; maybeStain(sim, g); }
  g.table = null; g.state = 'LEAVING';
  for (const c of members(sim, g)) { c.seat = null; c.st = 'walk'; c.wait = 0; if (c.scene === 'restaurant_interior') { if (!sim.goto(c, 16, 35)) { c.x = 16.5; c.y = 34.5; sim.goto(c, 16, 35); } } else sim.goto(c, 1, 37); }
  if (g.order) { const i = s.orders.findIndex((o) => o.id === g.order); if (i >= 0) s.orders.splice(i, 1); }
}
function maybeStain(sim, g) {
  const s = sim.s; const rain = ['rain', 'storm', 'snow', 'blizzard'].includes(s.weather);
  if (sim.rand() < 0.2) { const t = sim.furn(g.table); const m = sim.map('restaurant_interior'); const gr = sim.grid('restaurant_interior'); for (let k = 0; k < 8; k++) { const x = t.x + sim.ri(-2, 3), y = t.y + sim.ri(-2, 3); if (x > 0 && y > 0 && !gr[y * m.w + x] && m.zone[y * m.w + x] >= 0 && !s.stains.some((st) => st.x === x && st.y === y)) { s.stains.push({ id: sim.nid('st'), x, y }); break; } } }
  if (rain && sim.rand() < 0.15 && s.stains.length < 12) s.stains.push({ id: sim.nid('st'), x: sim.ri(15, 18), y: sim.ri(31, 33) });
}
function removeGroup(sim, g) {
  const s = sim.s; s.customers = s.customers.filter((c) => c.group !== g.id); s.groups = s.groups.filter((x) => x !== g);
  if (g.order) { const i = s.orders.findIndex((o) => o.id === g.order); if (i >= 0) s.orders.splice(i, 1); }
}
function cancelLine(sim, l) {
  if (l.status === 'reserved') Kitchen.release(sim, l.batch);
  else if (l.status === 'picked') { const c = sim.s.player.carry.find((x) => x.line === l.id); if (c) c.orphan = true; }
  if (l.status !== 'served') l.status = 'cancelled';
}
function cancelPending(sim, g, o) { for (const l of o.lines) cancelLine(sim, l); for (const c of members(sim, g)) if (c.st === 'sit') { if (o.lines.some((l) => l.cust === c.id && l.status === 'served')) { c.st = 'eat'; c.eatT = EAT_MINUTES[0]; } else c.st = 'done'; } }
function unhappy(sim, g, text) {
  const s = sim.s; if (g.order) cancelPending(sim, g, order(sim, g.order));
  s.today.sats.push(25); s.today.left += g.members.length; review(sim, g, 25, text);
  sim.emit('group_left_unhappy', { group: g.id, text }); sim.msg(`Bir ${PROFILES[g.profile].name.toLowerCase()} grubu ayrıldı: “${text}”`, 'error');
  startLeaving(sim, g);
}
function walkOutUnpaid(sim, g, text) {
  const s = sim.s, o = order(sim, g.order); const total = o.lines.filter((l) => l.status === 'served').reduce((a, l) => a + l.price, 0);
  sim.once('unpaid:' + o.id, () => { s.today.lost += total; s.stats.lost += total; });
  s.today.sats.push(35); review(sim, g, 35, text); sim.emit('group_left_unpaid', { group: g.id, total });
  sim.msg(`Hesap tahsil edilemedi (${total} G gelir yazılmadı).`, 'error');
  startLeaving(sim, g);
}
function review(sim, g, sat, text) { const s = sim.s; s.guestbook.unshift({ day: s.day, who: g.regular || PROFILES[g.profile].name, sat: Math.round(sat), text }); if (s.guestbook.length > 30) s.guestbook.pop(); }

// ---- OYUNCU EYLEMLERİ ----------------------------------------------------
export function freeTablesFor(sim, size) {
  const s = sim.s; const out = [];
  for (const t of Build.tables(sim)) {
    if (s.dirty[t.id] || s.groups.some((g) => g.table === t.id)) continue;
    const seats = Build.seatsOfTable(sim, t).filter((st) => !s.customers.some((c) => c.seat && c.seat.inst === st.inst && c.seat.idx === st.idx) && sim.path('restaurant_interior', 16, 34, st.x, st.y));
    if (seats.length >= size) out.push({ table: t, seats });
  }
  return out;
}
export function tableStatus(sim, t) {
  const s = sim.s; const seats = Build.seatsOfTable(sim, t).length; const g = s.groups.find((x) => x.table === t.id);
  return { seats, dirty: !!s.dirty[t.id], group: g || null };
}
export function greet(sim, groupId, tableId) {
  const g = group(sim, groupId); if (!g || g.state !== 'ENTRY_QUEUE') return sim.fail('Karşılanacak grup yok');
  const opt = freeTablesFor(sim, g.members.length).find((o) => o.table.id === tableId);
  if (!opt) return sim.fail(`Bu masa ${g.members.length} kişi için uygun değil (boş, temiz ve erişilebilir koltuk gerekli)`);
  endPhase(g); g.table = tableId; g.state = 'WALK_TO_SEAT'; g.queueIdx = -1;
  members(sim, g).forEach((c, i) => { c.seat = opt.seats[i]; c.path = null; c.wait = 0; c.tries = 0; });
  sim.emit('greeted', { group: g.id, table: tableId });
  return { ok: true };
}
// Sipariş önerisi: yalnız barda mevcut (available>0) ürünlerden; her üye ayrı ürün seçer
export function proposeOrder(sim, groupId) {
  const g = group(sim, groupId); if (!g) return [];
  const menu = Kitchen.menu(sim); const left = {}; for (const m of Object.values(menu)) left[m.item] = m.available;
  const pickOf = (kind, pref) => { const opts = Object.values(menu).filter((m) => m.kind === kind && left[m.item] > 0).sort((a, b) => a.item.localeCompare(b.item)); if (!opts.length) return null; const it = opts[Math.floor(pref * opts.length) % opts.length].item; left[it]--; return it; };
  return members(sim, g).map((c) => { const items = []; const f = pickOf('food', c.pref); if (f) items.push(f); if (c.drink || !f) { const d = pickOf('drink', (c.pref * 7) % 1); if (d) items.push(d); } return { cust: c.id, items }; });
}
export function takeOrder(sim, groupId) {
  const s = sim.s, g = group(sim, groupId); if (!g || g.state !== 'ORDER_READY') return sim.fail('Bu masa sipariş vermeye hazır değil');
  const wishes = proposeOrder(sim, groupId);
  const o = { id: sim.nid('o'), group: g.id, table: g.table, lines: [], status: 'open', at: sim.absMin(), paymentTx: null };
  for (const w of wishes) for (const item of w.items) { const b = Kitchen.reserve(sim, item); if (b) o.lines.push({ id: sim.nid('l'), cust: w.cust, item, batch: b, status: 'reserved', price: sim.C.recipes[item].price }); }
  endPhase(g);
  if (!o.lines.length) { s.today.sats.push(40); review(sim, g, 40, 'Menüde bir şey kalmamış.'); sim.msg('Menüde satılabilir ürün yok; müşteriler kibarca ayrıldı.', 'error'); startLeaving(sim, g); return { ok: false, msg: 'Menü boş' }; }
  s.orders.push(o); g.order = o.id; g.state = 'WAITING_FOR_SERVE'; setPat(sim, g, 'serve'); g.menuKinds = Object.keys(Kitchen.menu(sim)).length;
  for (const c of members(sim, g)) if (!o.lines.some((l) => l.cust === c.id)) c.st = 'done';
  sim.emit('order_taken', { group: g.id, order: o.id, lines: o.lines.length });
  return { ok: true, order: o };
}
// Bardan rezerve porsiyonları al (taşıma kapasitesi: 1, tepsiyle 2/3)
export function pendingAt(sim, instId) { return sim.s.orders.flatMap((o) => o.lines.filter((l) => l.status === 'reserved' && Kitchen.batch(sim, l.batch)?.inst === instId).map((l) => ({ o, l }))).sort((a, b) => a.o.at - b.o.at); }
export function pickupAt(sim, instId) {
  const p = sim.s.player; const cap = Build.trayCapacity(sim); let n = 0;
  if (p.pot) return sim.fail('Elinde tencere var');
  for (const { o, l } of pendingAt(sim, instId)) {
    if (p.carry.length >= cap) break;
    const info = Kitchen.pickFromBar(sim, l.batch); if (!info) continue;
    l.status = 'picked'; p.carry.push({ line: l.id, order: o.id, table: o.table, ...info }); n++;
  }
  if (!n) return sim.fail(p.carry.length >= cap ? `Aynı anda en fazla ${cap} ürün taşıyabilirsin` : 'Bu modülde bekleyen sipariş yok');
  sim.emit('picked_service', { qty: n }); return { ok: true, qty: n };
}
export function returnOrphans(sim) {
  const p = sim.s.player; let n = 0;
  for (let i = p.carry.length - 1; i >= 0; i--) { const c = p.carry[i]; if (!c.orphan) continue; const fresh = !c.perish || sim.absMin() < c.createdAt + (Kitchen.hasFridge(sim) ? 4 : 2) * 1440; if (fresh && Kitchen.returnToBar(sim, c)) { p.carry.splice(i, 1); n++; } else if (!fresh) { p.carry.splice(i, 1); sim.s.today.waste++; n++; } }
  if (n) sim.msg(`${n} ürün bara geri kondu.`); return n;
}
export function serveTable(sim, tableId) {
  const s = sim.s, p = s.player, g = s.groups.find((x) => x.table === tableId && x.state === 'WAITING_FOR_SERVE'); if (!g) return sim.fail('Bu masada servis bekleyen yok');
  const o = order(sim, g.order); let n = 0;
  for (let i = p.carry.length - 1; i >= 0; i--) {
    const c = p.carry[i]; if (c.order !== o.id || c.orphan) continue;
    const l = o.lines.find((x) => x.id === c.line); if (!l || l.status !== 'picked') continue;
    l.status = 'served'; l.unitCost = c.unitCost; p.carry.splice(i, 1); n++;
  }
  if (!n) return sim.fail(p.carry.length ? 'Elindeki ürün bu masanın siparişi değil' : 'Önce siparişi bardan al');
  for (const c of members(sim, g)) { const mine = o.lines.filter((l) => l.cust === c.id && l.status !== 'cancelled'); if (c.st === 'sit' && mine.length && mine.every((l) => l.status === 'served')) { c.st = 'eat'; c.eatT = EAT_MINUTES[0] + sim.rand() * (EAT_MINUTES[1] - EAT_MINUTES[0]); if (g.tutorial) c.eatT = 12; } }
  if (!o.lines.some((l) => l.status === 'reserved' || l.status === 'picked')) endPhase(g);
  sim.emit('served', { group: g.id, qty: n, table: tableId }); return { ok: true, qty: n };
}
export function satisfaction(sim, g) {
  const s = sim.s; const f = (r) => (r <= 0.4 ? 100 : 100 - ((r - 0.4) / 0.6) * 70);
  const ws = Object.values(g.waits); const speed = ws.length ? ws.reduce((a, r) => a + f(r), 0) / ws.length : 100;
  const clean = Math.max(0, 100 - 18 * Object.keys(s.dirty).length - 8 * s.stains.length);
  const amb = Math.min(100, 40 + 4 * Build.ambiance(sim));
  const variety = Math.min(100, 40 + 20 * (g.menuKinds || 1));
  const cold = sim.season() === 'winter'; const comfort = cold ? (s.fire > 0 ? 100 : 40) : 80;
  return { speed, clean, amb, variety, comfort, total: speed * SW.speed + clean * SW.clean + amb * SW.ambiance + variety * SW.variety + comfort * SW.comfort };
}
// Tahsilat: tek paymentTransactionId; gelir yalnız burada kasaya yazılır
export function collectPayment(sim, groupId) {
  const s = sim.s, g = group(sim, groupId); if (!g || g.state !== 'WAIT_PAYMENT') return sim.fail('Bu masa henüz hesap istemedi');
  const o = order(sim, g.order); const served = o.lines.filter((l) => l.status === 'served'); const total = served.reduce((a, l) => a + l.price, 0);
  endPhase(g); const sat = satisfaction(sim, g); const prof = PROFILES[g.profile]; const ev = g.event ? sim.C.events.find((e) => e.id === g.event) : null;
  let tip = sat.total >= 70 ? Math.round(total * ((sat.total - 60) / 400) * prof.tip * (ev ? ev.tip : 1) * (1 + 0.1 * g.loyalty) * (s.coop >= 2 && ev ? 1.05 : 1)) : 0;
  if (sat.total >= 85 && tip < 1) tip = 1;
  const txId = 'pay:' + o.id; const eaters = new Set(served.map((l) => l.cust)).size;
  const ok = sim.once(txId, () => {
    o.paymentTx = txId; o.status = 'paid';
    s.gold += total + tip; s.paidCustomers += eaters;
    const d = s.today; d.sales += total; d.tips += tip; d.customers += eaters; d.cost += served.reduce((a, l) => a + (l.unitCost || 0), 0); d.sats.push(sat.total); d.groups++;
    if (g.members.length >= 3) d.bigParty = true;
    if (sim.absMin() % 1440 >= 1080) d.evening += eaters;
    for (const l of served) { d.sold[l.item] = (d.sold[l.item] || 0) + 1; sim.emit('sold', { item: l.item, kind: sim.C.recipes[l.item].kind, price: l.price }); }
    d.byTrain[g.train] = (d.byTrain[g.train] || 0) + eaters; if (g.event) d.eventServed += eaters;
    if (g.regular) { const r = (s.regulars[g.regular] ||= { visits: 0, loyalty: 0 }); r.visits++; r.loyalty = Math.min(3, Math.floor(r.visits / 3)); }
    s.stats.totalSales += total; s.stats.totalTips += tip;
  });
  if (!ok) return sim.fail('Bu hesap zaten tahsil edildi');
  review(sim, g, sat.total, reviewText(sat));
  sim.emit('paid', { group: g.id, total, tip, count: eaters, size: g.members.length, train: g.train, event: g.event, sat: sat.total, tutorial: g.tutorial });
  if (tip > 0) sim.emit('tip', { tip });
  startLeaving(sim, g);
  return { ok: true, total, tip, sat: sat.total };
}
function reviewText(sat) {
  if (sat.speed < 55) return 'Servis biraz yavaştı ama yemek güzeldi.';
  if (sat.clean < 60) return 'Lezzet yerinde, salon daha temiz olabilirdi.';
  if (sat.comfort < 60) return 'İçerisi soğuktu; bir şömine çok yakışır.';
  if (sat.amb < 55) return 'Sade bir yer; biraz dekor fena olmazdı.';
  if (sat.variety < 70) return 'Yemek sıcacıktı, menü biraz daha çeşitli olsa keşke.';
  if (sat.total >= 88) return 'Trenden inip böyle bir sofra bulmak harika! Yine geleceğiz.';
  return 'Güler yüzlü, sıcak bir lokanta. Elinize sağlık.';
}

// ---- Temizlik ------------------------------------------------------------
export function startCleanTable(sim, tableId) {
  const d = sim.s.dirty[tableId]; if (!d) return sim.fail('Masa zaten temiz');
  if (d.lock && d.lock !== 'player') return sim.fail('Yardımcın bu masayı temizliyor');
  d.lock = 'player'; sim.setBusy('clean_table', 1.28, { target: tableId }); return { ok: true };
}
export function finishCleanTable(sim, tableId, by) { if (!sim.s.dirty[tableId]) return; delete sim.s.dirty[tableId]; sim.emit('table_cleaned', { table: tableId, by }); }
export function startCleanStain(sim, id) {
  const st = sim.s.stains.find((x) => x.id === id); if (!st) return sim.fail('Leke yok');
  if (st.lock && st.lock !== 'player') return sim.fail('Yardımcın bu lekeyi temizliyor');
  st.lock = 'player'; sim.setBusy('clean_stain', 0.85, { target: id }); return { ok: true };
}
export function finishCleanStain(sim, id, by) { const i = sim.s.stains.findIndex((x) => x.id === id); if (i < 0) return; sim.s.stains.splice(i, 1); sim.emit('stain_cleaned', { by }); }

// ---- Kapanış / erken uyku -------------------------------------------------
export function openBusiness(sim) { return sim.s.groups.filter((g) => ACTIVE.includes(g.state)); }
// Servissiz rezervasyonlar serbest bırakılır; servis edilip tahsil edilmeyen gelir yazılmaz
export function forceCloseAll(sim, reason) {
  const s = sim.s; let released = 0, lost = 0;
  for (const g of [...s.groups]) {
    if (ACTIVE.includes(g.state) && g.order) {
      const o = order(sim, g.order);
      for (const l of o.lines) { if (l.status === 'reserved' || l.status === 'picked') { cancelLine(sim, l); released++; } }
      const total = o.lines.filter((l) => l.status === 'served').reduce((a, l) => a + l.price, 0);
      if (total > 0 && !o.paymentTx) sim.once('unpaid:' + o.id, () => { s.today.lost += total; s.stats.lost += total; lost += total; });
    }
    if (ACTIVE.includes(g.state)) startLeaving(sim, g);
  }
  returnOrphans(sim);
  if (released || lost) sim.msg(`${reason}: ${released} rezervasyon serbest bırakıldı${lost ? `, ${lost} G tahsil edilemedi` : ''}.`);
  return { released, lost };
}
export function clearAllForSleep(sim) {
  const s = sim.s; forceCloseAll(sim, 'Gün bitirildi');
  const p = s.player; for (const c of p.carry.splice(0)) { if (!Kitchen.returnToBar(sim, c)) s.today.waste++; }
  s.groups = []; s.customers = []; s.passers = []; s.orders = [];
  for (const b of s.batches) b.reserved = 0;
}
export function pickRegular(sim) { const present = new Set(sim.s.groups.map((g) => g.regular)); const pool = REGULARS.filter((r) => !present.has(r)); return pool.length ? sim.pick(pool) : null; }
