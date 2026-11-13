// Mutfak, zamanlı pişirme, bar slotları, parti (batch) bazlı tazelik ve menü.
import * as Inv from './inventory.js';

// ---- Tarif kilitleri: aşama + ödemeli müşteri + KURULU ekipman
export function recipeStatus(sim, r) {
  const s = sim.s, u = r.unlock; const why = [];
  if (r.ready) return { unlocked: true, why };
  if (s.stage < u.stage) why.push(`${u.stage}. restoran aşaması`);
  if (s.paidCustomers < u.paid && !s.storyUnlocks.includes(r.id)) why.push(`${u.paid} ödemeli müşteri (şu an ${s.paidCustomers})`);
  if (u.equip && !sim.hasInstalled(u.equip)) why.push(`${sim.C.equipment[u.equip].name} kurulmalı`);
  if (!stationsFor(sim, r.station).length) why.push('İstasyon kurulu değil');
  return { unlocked: why.length === 0, why };
}
export function stationWorks(sim, f) { const d = sim.def(f); return !!d.station && f.installed && (!d.repair || sim.s.flags[d.repair]); }
export function stationsFor(sim, station) { return sim.s.furniture.filter((f) => sim.def(f).station === station && stationWorks(sim, f)); }
export function recipesForStation(sim, f) { const st = sim.def(f).station; return Object.values(sim.C.recipes).filter((r) => r.station === st); }
export function prepTime(sim, r) {
  let t = r.prep; if (!t) return 0;
  if (sim.hasInstalled('better_prep')) t -= 1;
  if (sim.staffsys.activeRole(sim, 'kitchen_helper')) t -= 1;
  return Math.max(2, t);
}
export function hasFridge(sim) { return sim.hasInstalled('refrigerator'); }
export function expiry(sim, b) { if (!b.perish) return Infinity; const r = sim.C.recipes[b.item]; return b.createdAt + (hasFridge(sim) ? r.fridgeDays : r.freshDays) * 1440; }
export function isFresh(sim, b) { return sim.absMin() < expiry(sim, b); }

// Pişirme: malzeme bir kez tüketilir; istasyon başına tek aktif iş
export function startCooking(sim, instId, recipeId) {
  const s = sim.s, f = sim.furn(instId), r = sim.C.recipes[recipeId];
  if (!f || !r) return sim.fail('Geçersiz istasyon/tarif');
  if (s.closing.active) return sim.fail('23:00\'ten sonra yeni üretim başlatılamaz');
  if (!stationWorks(sim, f)) return sim.fail('Bu istasyon kullanılamıyor');
  if (sim.def(f).station !== r.station) return sim.fail('Bu tarif bu istasyonda yapılmaz');
  if (f.cook) return sim.fail('İstasyon dolu: aynı anda tek pişirme');
  const st = recipeStatus(sim, r); if (!st.unlocked) return sim.fail('Kilitli: ' + st.why.join(', '));
  if (!Inv.has(sim, r.ingredients)) return sim.fail(`Eksik malzeme: ${Inv.missingText(sim, r.ingredients)}`);
  Inv.take(sim, r.ingredients);
  const prep = prepTime(sim, r);
  f.cook = { recipe: r.id, phase: 'prep', t: 0, prep, cook: r.cook, id: sim.nid('ck') };
  sim.setBusy('prep', prep, { inst: f.id });
  sim.emit('cook_start', { recipe: r.id, inst: f.id });
  return { ok: true };
}
export function tick(sim, dt) {
  for (const f of sim.s.furniture) {
    const c = f.cook; if (!c || c.phase === 'done') continue;
    c.t += dt;
    if (c.phase === 'prep' && c.t >= c.prep) { c.phase = 'cook'; c.t -= c.prep; }
    if (c.phase === 'cook' && c.t >= c.cook) {
      const r = sim.C.recipes[c.recipe]; c.phase = 'done';
      sim.once('cooked:' + c.id, () => {
        const b = { id: sim.nid('b'), item: r.id, qty: r.yield, reserved: 0, loc: 'pot', inst: f.id, slot: null, createdAt: sim.absMin(), perish: r.perish, unitCost: r.cost / r.yield };
        sim.s.batches.push(b); c.batch = b.id;
        sim.s.recipesCooked[r.id] = (sim.s.recipesCooked[r.id] || 0) + 1;
        sim.emit('cooked', { recipe: r.id, inst: f.id, batch: b.id });
      });
    }
  }
}
export function batch(sim, id) { return sim.s.batches.find((b) => b.id === id); }
function dropEmpty(sim) {
  const s = sim.s; s.batches = s.batches.filter((b) => b.qty > 0 || b.reserved > 0);
  for (const f of s.furniture) if (f.slots) f.slots.forEach((sl, i) => { if (sl.item && !s.batches.some((b) => b.loc === 'bar' && b.inst === f.id && b.slot === i)) sl.item = null; });
}

// Tencereyi istasyondan al (oyuncu fiziksel olarak bara taşır)
export function takePot(sim, instId) {
  const s = sim.s, p = s.player, f = sim.furn(instId);
  if (!f?.cook || f.cook.phase !== 'done') return sim.fail('Hazır yemek yok');
  if (p.pot) return sim.fail('Elinde zaten bir tencere var');
  if (p.carry.length) return sim.fail('Önce elindeki servisi bırak');
  const b = batch(sim, f.cook.batch); if (b.lock) return sim.fail('Yardımcın bunu taşıyor');
  b.loc = 'hand'; b.inst = null; f.cook = null; p.pot = b.id;
  sim.emit('pot_taken', { item: b.item });
  return { ok: true };
}
export function slotFill(sim, instId, slotIdx) { let n = 0; for (const b of sim.s.batches) if (b.loc === 'bar' && b.inst === instId && b.slot === slotIdx) n += b.qty; return n; }
export function barModules(sim) { return sim.s.furniture.filter((f) => f.slots && f.scene === 'restaurant_interior'); }
export function findSlotFor(sim, f, item) {
  const kind = sim.C.recipes[item].kind; let empty = -1;
  for (let i = 0; i < f.slots.length; i++) { const sl = f.slots[i]; if (sl.kind !== kind) continue; if (sl.item === item && slotFill(sim, f.id, i) < sim.C.portionsPerSlot) return i; if (!sl.item && empty < 0) empty = i; }
  return empty;
}
// Partiyi (tencere/hazır stok) bar slotuna aktar. Sığmayan kısım kaybolmaz; kaynak partide kalır.
export function moveBatchToBar(sim, b, f, slotIdx) {
  const sl = f.slots[slotIdx]; const cap = sim.C.portionsPerSlot - slotFill(sim, f.id, slotIdx);
  if (sl.item && sl.item !== b.item) return 0;
  const n = Math.min(cap, b.qty); if (n <= 0) return 0;
  sl.item = b.item;
  if (n === b.qty) { b.loc = 'bar'; b.inst = f.id; b.slot = slotIdx; }
  else { b.qty -= n; sim.s.batches.push({ ...b, id: sim.nid('b'), qty: n, reserved: 0, loc: 'bar', inst: f.id, slot: slotIdx, lock: undefined }); }
  return n;
}
export function stockPot(sim, instId) {
  const s = sim.s, p = s.player, f = sim.furn(instId), b = batch(sim, p.pot);
  if (!b) return sim.fail('Elinde tencere yok');
  if (!isFresh(sim, b)) return sim.fail('Bu yemek bayatlamış; bara konamaz');
  const i = findSlotFor(sim, f, b.item); if (i < 0) return sim.fail(`Bu modülde ${sim.C.recipes[b.item].kind === 'food' ? 'yemek' : 'içecek'} için uygun boş slot yok`);
  const total = b.qty; const n = moveBatchToBar(sim, b, f, i);
  if (n <= 0) return sim.fail('Slot dolu (12 porsiyon). Tencere elinde kaldı.');
  if (n === total) { p.pot = null; sim.msg(`${n} porsiyon ${sim.C.items[b.item].name} bara kondu — menüde!`, 'good'); }
  else sim.msg(`${n} porsiyon bara kondu; ${total - n} porsiyon tencerede kaldı (hazırlık tezgâhına bırakabilirsin).`);
  sim.emit('bar_stocked', { item: b.item, qty: n });
  return { ok: true, moved: n };
}
// Şişe içecek: envanter/depodan bar slotuna (bozulmaz)
export function stockBottles(sim, instId, slotIdx, item, qty) {
  const f = sim.furn(instId), sl = f?.slots?.[slotIdx], r = sim.C.recipes[item];
  if (!sl || !r?.ready) return sim.fail('Bu ürün bu slota konamaz');
  if (sl.kind !== r.kind || (sl.item && sl.item !== item)) return sim.fail('Slot başka bir ürün için ayrılmış');
  const n = Math.min(qty, sim.C.portionsPerSlot - slotFill(sim, instId, slotIdx), Inv.count(sim, item));
  if (n <= 0) return sim.fail('Slot dolu ya da stok yok');
  Inv.take(sim, { [item]: n }); sl.item = item;
  const ex = sim.s.batches.find((b) => b.loc === 'bar' && b.inst === instId && b.slot === slotIdx && b.item === item && !b.perish);
  if (ex) ex.qty += n; else sim.s.batches.push({ id: sim.nid('b'), item, qty: n, reserved: 0, loc: 'bar', inst: instId, slot: slotIdx, createdAt: sim.absMin(), perish: false, unitCost: r.cost });
  sim.emit('bar_stocked', { item, qty: n });
  return { ok: true, moved: n };
}
// Rezerve edilmemiş stoğu slottan geri al (şişe → çanta; yemek → tencere olarak ele)
export function unstock(sim, instId, slotIdx) {
  const s = sim.s, p = s.player, f = sim.furn(instId), sl = f?.slots?.[slotIdx]; if (!sl?.item) return sim.fail('Slot boş');
  const bs = s.batches.filter((b) => b.loc === 'bar' && b.inst === instId && b.slot === slotIdx);
  if (bs.some((b) => b.reserved > 0)) return sim.fail('Bu slotta müşteriye ayrılmış porsiyon var');
  if (sim.C.recipes[sl.item].ready) { let n = 0; for (const b of bs) { n += b.qty; b.qty = 0; } Inv.give(sim, sl.item, n); }
  else { if (p.pot || p.carry.length) return sim.fail('Ellerin dolu'); const b = bs[0]; if (bs.length > 1) return sim.fail('Önce eski parti tükenmeli'); b.loc = 'hand'; b.inst = null; b.slot = null; p.pot = b.id; }
  dropEmpty(sim); sim.emit('bar_changed'); return { ok: true };
}
export function putPotDown(sim, instId) {
  const p = sim.s.player, b = batch(sim, p.pot); if (!b) return sim.fail('Elinde tencere yok');
  b.loc = 'ready'; b.inst = instId; p.pot = null; sim.emit('pot_down');
  return sim.msg('Tencere hazırlık tezgâhına bırakıldı (hazır bekleme stoku).');
}
export function readyBatches(sim, instId) { return sim.s.batches.filter((b) => b.loc === 'ready' && (!instId || b.inst === instId)); }
export function takeReady(sim, instId) {
  const p = sim.s.player; if (p.pot || p.carry.length) return sim.fail('Ellerin dolu');
  const b = readyBatches(sim, instId).find((x) => !x.lock); if (!b) return sim.fail('Bekleyen yemek yok');
  b.loc = 'hand'; b.inst = null; p.pot = b.id; return { ok: true };
}

// ---- Menü = barda fiziksel olarak bulunan, taze ve rezerve edilmemiş porsiyonlar
export function menu(sim) {
  const out = {};
  for (const b of sim.s.batches) {
    if (b.loc !== 'bar' || !isFresh(sim, b)) continue;
    const r = sim.C.recipes[b.item]; const e = (out[b.item] ||= { item: b.item, name: r.name, kind: r.kind, price: r.price, available: 0, physical: 0 });
    e.available += b.qty - b.reserved; e.physical += b.qty;
  }
  return out;
}
export function menuAvailable(sim) { return Object.values(menu(sim)).some((m) => m.available > 0); }
// FIFO rezervasyon: en eski taze partiden bir porsiyon, bir kez
export function reserve(sim, item) {
  const c = sim.s.batches.filter((b) => b.loc === 'bar' && b.item === item && isFresh(sim, b) && b.qty - b.reserved > 0).sort((a, b) => a.createdAt - b.createdAt)[0];
  if (!c) return null; c.reserved += 1; return c.id;
}
export function release(sim, batchId) { const b = batch(sim, batchId); if (b && b.reserved > 0) b.reserved -= 1; dropEmpty(sim); }
// Oyuncu bardan rezerve porsiyonu alır: fiziksel stok ve rezervasyon birlikte 1 azalır
export function pickFromBar(sim, batchId) {
  const b = batch(sim, batchId); if (!b || b.qty <= 0 || b.reserved <= 0) return null;
  b.qty -= 1; b.reserved -= 1; const info = { item: b.item, createdAt: b.createdAt, perish: b.perish, unitCost: b.unitCost, inst: b.inst, slot: b.slot, from: b.id };
  dropEmpty(sim); return info;
}
// Yetim kalan (siparişi iptal olmuş) taşınan ürünü bara iade et; tazeyse satışa döner
export function returnToBar(sim, info) {
  const s = sim.s; let f = sim.furn(info.inst); let slot = info.slot;
  if (!f || !f.slots || (f.slots[slot].item && f.slots[slot].item !== info.item) || slotFill(sim, f.id, slot) >= sim.C.portionsPerSlot) {
    f = null; for (const m of barModules(sim)) { const i = findSlotFor(sim, m, info.item); if (i >= 0) { f = m; slot = i; break; } }
  }
  if (!f) return false;
  f.slots[slot].item = info.item;
  const ex = s.batches.find((b) => b.loc === 'bar' && b.inst === f.id && b.slot === slot && b.item === info.item && b.createdAt === info.createdAt);
  if (ex) ex.qty += 1; else s.batches.push({ id: sim.nid('b'), item: info.item, qty: 1, reserved: 0, loc: 'bar', inst: f.id, slot, createdAt: info.createdAt, perish: info.perish, unitCost: info.unitCost });
  return true;
}
// Sabah: süresi dolan, rezerve olmayan porsiyonlar atılır ve raporlanır (sessiz silme değil)
export function purgeExpired(sim) {
  const s = sim.s; let waste = 0; const names = new Set();
  for (const b of s.batches) if (!isFresh(sim, b)) { const n = b.qty - b.reserved; if (n > 0) { waste += n; names.add(sim.C.items[b.item].name); b.qty -= n; } }
  dropEmpty(sim);
  if (waste) { s.today.waste += waste; sim.msg(`${waste} bayat porsiyon (${[...names].join(', ')}) atıldı.`); sim.emit('waste', { qty: waste }); }
  return waste;
}
export function barCounts(sim) { let food = 0, drink = 0; for (const m of barModules(sim)) for (const sl of m.slots) sl.kind === 'food' ? food++ : drink++; return { food, drink }; }
// Stok bütünlüğü denetimi (testler): hiçbir partide rezerve > fiziksel olamaz
export function integrity(sim) {
  const errs = [];
  for (const b of sim.s.batches) { if (b.reserved > b.qty) errs.push(`rezerve>fiziksel ${b.id}`); if (b.qty < 0 || b.reserved < 0) errs.push(`negatif ${b.id}`); }
  for (const m of barModules(sim)) m.slots.forEach((sl, i) => { if (slotFill(sim, m.id, i) > sim.C.portionsPerSlot) errs.push(`slot taşması ${m.id}:${i}`); });
  const reservedLines = sim.s.orders.flatMap((o) => o.lines).filter((l) => l.status === 'reserved').length;
  const reservedBatches = sim.s.batches.reduce((a, b) => a + b.reserved, 0);
  if (reservedLines !== reservedBatches) errs.push(`rezervasyon sayısı uyuşmuyor ${reservedLines}≠${reservedBatches}`);
  return errs;
}
export { dropEmpty };
