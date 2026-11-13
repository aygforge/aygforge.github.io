import { describe, it, expect } from 'vitest';
import { afterTutorial, arrive, seat, stockSoup, clearBar, give, toasts } from './helpers/setup.js';

const midday = (g) => { g.s.minute = 600; };
describe('Sipariş, stok ve servis bütünlüğü', () => {
  it('T4: aynı son porsiyon iki müşteriye verilemez; ödeme ve stok iki kez yazılmaz', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; midday(g); clearBar(g); stockSoup(g, 1);
    const a = arrive(g), b = arrive(g); expect(seat(g, a)).toBe(true); expect(seat(g, b)).toBe(true);
    const o1 = sim.service.takeOrder(sim, a.id); expect(o1.ok).toBe(true); expect(o1.order.lines.length).toBe(1);
    expect(sim.kitchen.menu(sim).vegetable_soup.available).toBe(0);
    expect(sim.service.proposeOrder(sim, b.id).every((w) => w.items.length === 0)).toBe(true);
    const o2 = sim.service.takeOrder(sim, b.id); expect(o2.ok).toBe(false); // menü boş → kibarca ayrılır
    expect(sim.kitchen.integrity(sim)).toEqual([]);
    const bar = sim.kitchen.barModules(sim)[0]; bot.go(bar.x, bar.y);
    expect(sim.service.pickupAt(sim, bar.id).qty).toBe(1); expect(sim.service.pickupAt(sim, bar.id).ok).toBe(false);
    const t = sim.furn(a.table); bot.go(t.x, t.y); expect(sim.service.serveTable(sim, t.id).ok).toBe(true); expect(sim.service.serveTable(sim, t.id).ok).toBe(false);
    while (a.state !== 'WAIT_PAYMENT') sim.tick(0.5);
    const gold = s.gold; const pay = sim.service.collectPayment(sim, a.id); expect(pay.ok).toBe(true); expect(pay.total).toBe(12);
    expect(s.gold).toBe(gold + 12 + pay.tip); expect(sim.service.collectPayment(sim, a.id).ok).toBe(false); expect(s.gold).toBe(gold + 12 + pay.tip);
    expect(s.batches.filter((x) => x.item === 'vegetable_soup').length).toBe(0);
  });
  it('T5: yalnız menüdeki ürünler sipariş edilir; boş barda yolcular lokantaya yönelmez', () => {
    const g = afterTutorial(); const { sim, s } = g; clearBar(g); s.open = true; s.minute = 880;
    while (s.minute < 915) sim.tick(0.5);
    expect(s.groups.length).toBe(0); expect(s.passers.length).toBeGreaterThan(0);
    stockSoup(g, 4); const a = arrive(g, 2); seat(g, a);
    const items = sim.service.proposeOrder(sim, a.id).flatMap((w) => w.items); expect(items.length).toBeGreaterThan(0);
    for (const it of items) expect(sim.kitchen.menu(sim)[it].available).toBeGreaterThan(0);
  });
  it('T6: dolu bara yemek getirilince ürün kaybolmaz', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; midday(g); clearBar(g); stockSoup(g, 10);
    give(sim, { potato: 2, carrot: 1, onion: 1 }); expect(bot.cook('vegetable_soup', false)).toBe(true);
    const stove = s.furniture.find((f) => f.type === 'starter_stove'); while (stove.cook.phase !== 'done') sim.tick(0.5);
    sim.kitchen.takePot(sim, stove.id); const bar = sim.kitchen.barModules(sim)[0];
    const r = sim.kitchen.stockPot(sim, bar.id); expect(r.moved).toBe(2); expect(s.player.pot).toBeTruthy();
    expect(sim.kitchen.slotFill(sim, bar.id, 0)).toBe(12); expect(sim.kitchen.batch(sim, s.player.pot).qty).toBe(2);
    expect(sim.kitchen.stockPot(sim, bar.id).ok).toBe(false);
    const shelf = s.furniture.find((f) => f.type === 'prep_counter'); sim.kitchen.putPotDown(sim, shelf.id);
    expect(s.batches.reduce((a, b) => a + b.qty, 0)).toBe(14); expect(sim.kitchen.integrity(sim)).toEqual([]);
  });
  it('T7: koltuk yoksa/erişilemezse oyuncuya hata verilir, kayıp olmaz', () => {
    const g = afterTutorial(); const { sim, s } = g; midday(g); clearBar(g); stockSoup(g, 4);
    const a = arrive(g, 3); expect(sim.service.freeTablesFor(sim, 3).length).toBe(0);
    const anyTable = sim.build.tables(sim)[0]; const r = sim.service.greet(sim, a.id, anyTable.id);
    expect(r.ok).toBe(false); expect(a.state).toBe('ENTRY_QUEUE'); expect(toasts(sim).pop()).toMatch(/uygun değil/);
    // Kapı yolunu kapatan yerleştirme reddedilir; eşya çantada kalır
    give(sim, { wood: 10 }); s.flags.repair_workbench = true; sim.build.craft(sim, 'simple_table'); const i = s.player.inv.findIndex((x) => x && x.id === 'simple_table');
    expect(sim.build.place(sim, i, 16, 33, 0).ok).toBe(false); expect(sim.build.place(sim, i, 10, 15, 0).ok).toBe(false);
    expect(s.player.inv[i]).toMatchObject({ id: 'simple_table', qty: 1 });
  });
  it('T9: grup siparişi tek panelde; her porsiyon ayrı servis edilir ve doğru masaya bağlanır', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; midday(g); clearBar(g); stockSoup(g, 8);
    give(sim, { wood: 4 }); sim.build.craft(sim, 'wooden_chair'); sim.build.craft(sim, 'wooden_chair');
    expect(bot.placeItem('wooden_chair', 18, 21, 0).ok).toBe(true); expect(bot.placeItem('wooden_chair', 19, 24, 2).ok).toBe(true);
    const fam = arrive(g, 3, 'family'), solo = arrive(g, 1); expect(seat(g, fam)).toBe(true); expect(seat(g, solo)).toBe(true);
    const o = sim.service.takeOrder(sim, fam.id).order; sim.service.takeOrder(sim, solo.id);
    expect(new Set(o.lines.map((l) => l.cust)).size).toBe(3); expect(new Set(o.lines.map((l) => l.id)).size).toBe(o.lines.length);
    const bar = sim.kitchen.barModules(sim)[0]; bot.go(bar.x, bar.y);
    expect(sim.service.pickupAt(sim, bar.id).qty).toBe(1); // tepsisiz tek ürün
    const wrong = sim.furn(solo.table); expect(sim.service.serveTable(sim, wrong.id).ok).toBe(false); // yanlış masa reddedilir
    expect(sim.service.serveTable(sim, fam.table).ok).toBe(true);
    const eating = sim.service.members(sim, fam).filter((c) => c.st === 'eat').length; expect(eating).toBeLessThanOrEqual(1);
    expect(fam.state).toBe('WAITING_FOR_SERVE');
    // tepsi: 2 ürün
    give(sim, { wood: 4, metal_part: 1 }); s.stage = 2; expect(sim.build.craft(sim, 'serving_tray').ok).toBe(true); s.stage = 1;
    expect(sim.build.trayCapacity(sim)).toBe(2); bot.go(bar.x, bar.y); expect(sim.service.pickupAt(sim, bar.id).qty).toBe(2);
    let n = 0; while (s.groups.some((x) => ['WAITING_FOR_SERVE', 'ORDER_READY'].includes(x.state)) && n++ < 400) { if (!bot.serviceStep()) bot.tick(1); }
    n = 0; while (s.groups.some((x) => x.state === 'WAIT_PAYMENT') && n++ < 50) bot.serviceStep();
    expect(s.today.customers).toBeGreaterThanOrEqual(6); expect(sim.kitchen.integrity(sim)).toEqual([]);
  });
  it('T10: 23:00 sonrası yeni tren/müşteri/üretim yok; içeridekiler kapanış modunda tamamlanır', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; clearBar(g); stockSoup(g, 6); s.minute = 1340; const c0 = s.today.customers;
    const a = arrive(g, 2); seat(g, a); sim.service.takeOrder(sim, a.id);
    while (!s.closing.active) sim.tick(0.5);
    expect(s.minute).toBe(1380); expect(s.open).toBe(false); expect(a.state).toBe('WAITING_FOR_SERVE');
    sim.tick(30); expect(s.minute).toBe(1380); // görünen saat sabit
    const stove = s.furniture.find((f) => f.type === 'starter_stove'); give(sim, { potato: 2, carrot: 1, onion: 1 });
    expect(sim.kitchen.startCooking(sim, stove.id, 'vegetable_soup').ok).toBe(false);
    expect(sim.build.craft(sim, 'wooden_chair').ok).toBe(false);
    const before = s.groups.length; sim.tick(20); expect(s.groups.length).toBeLessThanOrEqual(before);
    let n = 0; while (sim.service.openBusiness(sim).length && n++ < 400) { if (!bot.serviceStep()) bot.tick(1); }
    expect(sim.service.openBusiness(sim).length).toBe(0); expect(s.today.customers - c0).toBe(2);
    expect(sim.daysys.sleep(sim).ok).toBe(true); expect(s.day).toBe(3);
  });
  it('T10b: kapanış zamanlayıcısı sınırlıdır — oyuncu hiçbir şey yapmasa da kilitlenmez', () => {
    const g = afterTutorial(); const { sim, s } = g; clearBar(g); stockSoup(g, 6); s.minute = 1350;
    const a = arrive(g, 2); seat(g, a); sim.service.takeOrder(sim, a.id);
    sim.tick(400); expect(sim.service.openBusiness(sim).length).toBe(0); expect(sim.kitchen.menu(sim).vegetable_soup.available).toBe(6);
    expect(sim.kitchen.integrity(sim)).toEqual([]);
  });
  it('T11/T35: erken uyku — rezervasyon serbest kalır, tahsil edilmeyen gelir yazılmaz, ödenen tekrar sayılmaz', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; midday(g); clearBar(g); stockSoup(g, 6);
    const a = arrive(g), b = arrive(g); seat(g, a); seat(g, b); sim.service.takeOrder(sim, a.id); sim.service.takeOrder(sim, b.id);
    const bar = sim.kitchen.barModules(sim)[0]; bot.go(bar.x, bar.y); sim.service.pickupAt(sim, bar.id); const t = sim.furn(a.table); bot.go(t.x, t.y); sim.service.serveTable(sim, t.id);
    const gold = s.gold; const chk = sim.daysys.sleep(sim, false);
    expect(chk.ok).toBe(false); expect(chk.confirm.groups).toBe(2); expect(chk.confirm.reserved).toBe(1); expect(chk.confirm.unpaid).toBe(12); expect(s.day).toBe(2);
    const r = sim.daysys.sleep(sim, true); expect(r.ok).toBe(true);
    expect(s.gold).toBe(gold); expect(r.report.lost).toBe(12); expect(r.report.sales).toBe(s.lastReport.sales);
    expect(s.batches.reduce((x, y) => x + y.reserved, 0)).toBe(0); expect(sim.kitchen.menu(sim).vegetable_soup.available).toBe(5);
    expect(s.groups.length + s.customers.length + s.orders.length).toBe(0); expect(sim.kitchen.integrity(sim)).toEqual([]);
  });
  it('T35: servis beklerken sabrı biten grubun rezervasyonu ve elde taşınan ürünü geri döner', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; midday(g); clearBar(g); stockSoup(g, 3);
    const sales0 = s.today.sales; const a = arrive(g); seat(g, a); sim.service.takeOrder(sim, a.id); const bar = sim.kitchen.barModules(sim)[0]; bot.go(bar.x, bar.y); sim.service.pickupAt(sim, bar.id);
    expect(sim.kitchen.menu(sim).vegetable_soup.physical).toBe(2);
    sim.tick(200); expect(s.groups.filter((x) => x.table).length).toBe(0); expect(s.player.carry[0].orphan).toBe(true);
    sim.service.returnOrphans(sim); expect(s.player.carry.length).toBe(0); expect(sim.kitchen.menu(sim).vegetable_soup.available).toBe(3);
    expect(s.today.sales).toBe(sales0); expect(sim.kitchen.integrity(sim)).toEqual([]);
  });
  it('FIFO ve tazelik: eski parti önce satılır; 2 gün sonra bayatlar, soğutucuyla 4 gün', () => {
    const g = afterTutorial(); const { sim, s } = g; midday(g); clearBar(g);
    const old = stockSoup(g, 2); old.createdAt -= 600; const neu = stockSoup(g, 2);
    expect(sim.kitchen.reserve(sim, 'vegetable_soup')).toBe(old.id); sim.kitchen.release(sim, old.id);
    s.day += 2; expect(sim.kitchen.isFresh(sim, neu)).toBe(false); expect(sim.kitchen.menu(sim).vegetable_soup).toBeUndefined();
    s.furniture.push({ id: 'fz', type: 'refrigerator', scene: 'restaurant_interior', x: 44, y: 28, rot: 0, installed: true });
    expect(sim.kitchen.isFresh(sim, neu)).toBe(true); s.furniture.pop();
    expect(sim.kitchen.purgeExpired(sim)).toBe(4); expect(s.batches.length).toBe(0);
  });
});
