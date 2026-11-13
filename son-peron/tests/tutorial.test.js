import { describe, it, expect } from 'vitest';
import { C, fresh, toasts } from './helpers/setup.js';

describe('Tutorial: Gün 1 → 2 → 3 (T1, T2, T3, T33)', () => {
  const g = fresh(); const { sim, s, bot } = g;
  it('T1: 15 odun + 5 taş ile bütün onarım/crafting eksiksiz ve bir kez', () => {
    bot.use(bot.furn('letter_desk'), 'restaurant_interior'); expect(s.quests.done).toContain('story_01');
    bot.use(bot.furn('old_chest')); for (const t of ['axe', 'pickaxe', 'hoe', 'watering_can']) expect(sim.inv.count(sim, t)).toBe(1);
    bot.use(bot.furn('old_chest')); expect(sim.inv.count(sim, 'axe')).toBe(1); // sandık ikinci kez vermez
    expect(bot.gather('tree', 3)).toBe(3); expect(bot.gather('rock', 2)).toBe(2);
    const wood0 = sim.inv.count(sim, 'wood'), stone0 = sim.inv.count(sim, 'stone'); expect(wood0).toBeGreaterThanOrEqual(15); expect(stone0).toBeGreaterThanOrEqual(5);
    expect(s.quests.done).toContain('story_02');
    bot.use((t) => t.kind === 'door', 'restaurant_interior'); bot.use(bot.furn('workbench'));
    expect(sim.build.repair(sim, 'repair_workbench').msg).toMatch(/Zaten/);
    sim.build.craft(sim, 'simple_table'); sim.build.craft(sim, 'wooden_chair'); sim.build.craft(sim, 'wooden_chair');
    expect(sim.build.totalSeats(sim)).toBe(2);
    expect(bot.placeItem('simple_table', 18, 22, 0).ok).toBe(true); bot.placeItem('wooden_chair', 17, 22, 3); bot.placeItem('wooden_chair', 20, 22, 1);
    expect(sim.build.totalSeats(sim)).toBe(4);
    bot.use(bot.furn('starter_stove')); expect(s.flags.repair_stove).toBe(true);
    // Onarım + crafting toplamı tam 15 odun + 5 taş
    expect(wood0 - sim.inv.count(sim, 'wood')).toBe(15); expect(stone0 - sim.inv.count(sim, 'stone')).toBe(5);
  });
  it('T2: 44 G sipariş → 56 G; 06:00 teslimatı çift oluşmaz', () => {
    bot.toScene('railway_outdoors'); bot.go(68, 47);
    expect(s.gold).toBe(100); expect(sim.town.mailOrder(sim, { ...C.tutorial.order }).ok).toBe(true); expect(s.gold).toBe(56);
    expect(s.trains.every((t) => t.time !== 0)).toBe(true); expect(s.groups.length).toBe(0); // 1. gün müşteri yok
    bot.toScene('restaurant_interior'); const r = sim.daysys.sleep(sim); expect(r.ok).toBe(true);
    expect(s.day).toBe(2); expect(s.minute).toBe(360); expect(s.quests.done).toContain('story_03'); expect(sim.inv.count(sim, 'memory_photo')).toBe(1);
    expect(s.crate).toEqual(expect.arrayContaining([{ id: 'potato', qty: 4 }, { id: 'bottled_juice', qty: 3 }]));
    sim.daysys.morning(sim, false); // sabah işlemi yeniden tetiklense bile teslimat çoğalmaz
    expect(s.crate.find((c) => c.id === 'potato').qty).toBe(4); expect(s.gold).toBe(56);
    bot.use((t) => t.kind === 'obj' && t.id === 'crate', 'railway_outdoors'); expect(sim.inv.count(sim, 'potato')).toBe(4);
    bot.use((t) => t.kind === 'obj' && t.id === 'crate'); expect(sim.inv.count(sim, 'potato')).toBe(4); expect(sim.inv.count(sim, 'bottled_juice')).toBe(3);
  });
  it('T3: çorba 4 dk hazırlık + 30 dk pişer, 4 porsiyon; iki müşteri 09:00 treniyle gelir; rezervasyon/servis/ödeme bir kez', () => {
    bot.toScene('restaurant_interior'); const stove = s.furniture.find((f) => f.type === 'starter_stove'); bot.go(stove.x, stove.y);
    const t0 = s.minute; expect(sim.kitchen.startCooking(sim, stove.id, 'vegetable_soup').ok).toBe(true);
    expect(sim.inv.count(sim, 'potato')).toBe(2); expect(sim.inv.count(sim, 'carrot')).toBe(1); expect(sim.inv.count(sim, 'onion')).toBe(1);
    expect(sim.kitchen.startCooking(sim, stove.id, 'vegetable_soup').ok).toBe(false); // istasyon başına tek iş
    while (stove.cook.phase !== 'done') sim.tick(0.25);
    expect(s.minute - t0).toBeGreaterThanOrEqual(34); expect(s.minute - t0).toBeLessThan(34.6);
    bot.potToBar(); bot.stockDrinks();
    const menu = sim.kitchen.menu(sim); expect(menu.vegetable_soup.available).toBe(4); expect(menu.bottled_juice.available).toBe(3);
    bot.use((t) => t.kind === 'door'); expect(s.open).toBe(true);
    while (s.minute < 541) sim.tick(0.5);
    const tut = s.groups.filter((x) => x.tutorial); expect(tut.length).toBe(2); expect(s.customers.filter((c) => c.scene === 'railway_outdoors').length).toBe(2);
    const gold0 = s.gold; let n = 0; while (!s.flags.tutorialDone && n++ < 3000) { if (!bot.serviceStep()) bot.tick(1); }
    expect(s.flags.tutorialDone).toBe(true); expect(s.paidCustomers).toBe(2);
    expect(s.today.sold.vegetable_soup).toBe(2); expect(sim.kitchen.menu(sim).vegetable_soup.available).toBe(2);
    expect(s.gold).toBe(gold0 + s.today.sales + s.today.tips + 40);
    expect(sim.kitchen.integrity(sim)).toEqual([]);
  });
  it('T33: 3. gün serbest sandbox — kilitlenme yok, isteğe bağlı görevler gelir', () => {
    const r = bot.playDay(); expect(r.ok).toBe(true); expect(s.day).toBe(3);
    expect(s.quests.story.id).toBe('story_05'); expect(s.quests.daily.length).toBe(2);
    expect(s.trains.map((t) => t.time)).toEqual([540, 900, 1260]);
    expect(toasts(sim).join('|')).not.toMatch(/undefined|NaN/);
  });
});
