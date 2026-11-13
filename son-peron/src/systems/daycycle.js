// Gün döngüsü: uyku, gün sonu raporu, sabah işlemleri (teslimat, hava, restorasyon, vardiya, görevler).
import * as Kitchen from './kitchen.js';
import * as Service from './service.js';
import * as Build from './building.js';
import * as Staff from './staff.js';
import * as Farm from './farming.js';
import * as Trains from './trains.js';
import * as Cal from './calendar.js';
import * as Quests from './quests.js';
import * as Town from './town.js';
import * as Inv from './inventory.js';

export function blankDay() { return { sales: 0, tips: 0, cost: 0, purchases: 0, wages: 0, questGold: 0, resourceSales: 0, customers: 0, groups: 0, left: 0, lost: 0, waste: 0, sats: [], sold: {}, byTrain: {}, eventServed: 0, evening: 0, bigParty: false, goldStart: 0 }; }

export function sleepCheck(sim) {
  const open = Service.openBusiness(sim); if (!open.length) return null;
  const orders = sim.s.orders; const reserved = orders.flatMap((o) => o.lines).filter((l) => l.status === 'reserved' || l.status === 'picked').length;
  const unpaid = orders.filter((o) => !o.paymentTx).reduce((a, o) => a + o.lines.filter((l) => l.status === 'served').reduce((x, l) => x + l.price, 0), 0);
  return { groups: open.length, reserved, unpaid };
}
// force=false ve açık işlem varsa onay ister ({confirm}); «Günü bitir» force=true ile çağrılır
export function sleep(sim, force = false) {
  const s = sim.s; const chk = sleepCheck(sim);
  if (chk && !force) return { ok: false, confirm: chk };
  if (s.player.busy) return sim.fail('Önce elindeki işi bitir');
  Service.clearAllForSleep(sim);
  if (s.player.pot) { const b = Kitchen.batch(sim, s.player.pot); const shelf = s.furniture.find((f) => sim.def(f).readyShelf) || s.furniture.find((f) => sim.def(f).station); if (b) { b.loc = 'ready'; b.inst = shelf?.id || null; } s.player.pot = null; }
  const d = s.today; const avg = d.sats.length ? d.sats.reduce((a, b) => a + b, 0) / d.sats.length : null;
  // Günlük itibar değişimi −2…+2; müşterisiz gün değişim üretmez
  const delta = avg == null ? 0 : avg >= 85 ? 2 : avg >= 72 ? 1 : avg >= 55 ? 0 : avg >= 40 ? -1 : -2;
  s.reputation = Math.max(0, Math.min(100, s.reputation + delta));
  Farm.growDay(sim);
  const report = { day: s.day, sales: d.sales, tips: d.tips, materialCost: Math.round(d.cost), gross: d.sales - Math.round(d.cost), purchases: d.purchases, wages: d.wages, questGold: d.questGold, resourceSales: d.resourceSales, net: s.gold - d.goldStart, customers: d.customers, left: d.left, lost: d.lost, waste: d.waste, avgSat: avg == null ? null : Math.round(avg), repDelta: delta, reputation: s.reputation, gold: s.gold, sold: d.sold };
  s.lastReport = report; s.stats.days += 1; s.stats.bestDay = Math.max(s.stats.bestDay, d.sales);
  sim.emit('slept', { day: s.day });
  s.day += 1; s.minute = sim.C.dayStart; s.closing = { active: false, elapsed: 0 }; s.hold = false;
  const bed = s.furniture.find((f) => f.type === 'player_bed');
  if (bed) { s.player.scene = bed.scene; const [w, h] = sim.fp(bed); const m = sim.map(bed.scene), g = sim.grid(bed.scene); let spot = null; for (const [x, y] of [[bed.x + w, bed.y + 1], [bed.x - 1, bed.y + 1], [bed.x, bed.y + h], [bed.x + w, bed.y], [bed.x + 1, bed.y + h]]) if (!spot && x >= 0 && y >= 0 && !g[y * m.w + x]) spot = [x, y]; if (spot) { s.player.x = spot[0] + 0.5; s.player.y = spot[1] + 0.5; } }
  s.player.dir = 'down';
  morning(sim, false);
  return { ok: true, report };
}

export function morning(sim, first) {
  const s = sim.s;
  s.today = blankDay(); s.today.goldStart = s.gold; s.open = false;
  s.weather = Cal.rollWeather(sim);
  Trains.resetDay(sim);
  s.fishing.casts = 0;
  // Teslimatlar: ertesi sabah 06:00, her teslimat kimliği yalnız bir kez kutuya düşer
  for (const d of s.deliveries) if (!d.arrived && d.day <= s.day) sim.once('delivery:' + d.id, () => { d.arrived = true; for (const [id, q] of Object.entries(d.items)) { const e = s.crate.find((c) => c.id === id); if (e) e.qty += q; else s.crate.push({ id, qty: q }); } });
  s.deliveries = s.deliveries.filter((d) => !d.arrived);
  if (s.crate.length && !first) sim.msg('Posta teslimatı geldi: teslimat kutusunu kontrol et.', 'good');
  if (!first) {
    Build.applyPendingProjects(sim); Farm.respawnNodes(sim); Kitchen.purgeExpired(sim);
    if (s.stage >= sim.C.staff.minStage) Staff.refreshCandidates(sim);
    Staff.startShifts(sim);
    Quests.rollDaily(sim);
  }
  Cal.plan(sim, first);
  Town.initNpcs(sim);
  Inv.syncDepot(sim);
  sim.emit('morning', { day: s.day, weather: s.weather });
}
