import { describe, it, expect } from 'vitest';
import { C, afterTutorial, arrive, seat, stockSoup, clearBar, give } from './helpers/setup.js';
import { Sim } from '../src/systems/sim.js';
import { Bot } from '../src/dev/bot.js';
import { parse, serialize, SAVE_MAGIC } from '../src/systems/save.js';

const reload = (sim) => { const p = parse(serialize(sim)); expect(p.ok).toBe(true); const s2 = new Sim(C, p.state); return { sim: s2, s: s2.s, bot: new Bot(s2) }; };
const finish = (g) => { let n = 0; while (g.sim.service.openBusiness(g.sim).length && n++ < 600) { if (!g.bot.serviceStep()) g.bot.tick(1); } };

describe('Kayıt / yükleme (T18, T23, T28, T29, T34)', () => {
  it('T18: servis ortasında kaydet → yükle → aynı state; sipariş/ödeme/envanter çoğalmaz', () => {
    const g = afterTutorial({ name: 'Çağrı Öztürk-Şığ İĞÜŞÖÇ ığüşöç' }); const { sim, s, bot } = g; s.minute = 600; clearBar(g); stockSoup(g, 6);
    give(sim, { potato: 2, carrot: 1, onion: 1 }); bot.cook('vegetable_soup', false);
    const a = arrive(g), b = arrive(g); seat(g, a); seat(g, b); sim.service.takeOrder(sim, a.id);
    const bar = sim.kitchen.barModules(sim)[0]; bot.go(bar.x, bar.y); sim.service.pickupAt(sim, bar.id);
    const snap = serialize(sim); const g2 = reload(sim);
    expect(JSON.parse(serialize(g2.sim)).state).toEqual(JSON.parse(snap).state); // birebir aynı anlık durum
    expect(g2.s.player.name).toBe('Çağrı Öztürk-Şığ İĞÜŞÖÇ ığüşöç'); // T29
    expect(g2.s.player.carry.length).toBe(1); expect(g2.s.orders.length).toBe(1); expect(g2.s.furniture.find((f) => f.cook).cook.recipe).toBe('vegetable_soup');
    // İki kopya aynı girdilerle aynı sonuca varır (deterministik); teslimat/altın/NPC yeniden oluşmaz
    finish(g); finish(g2);
    expect(g2.s.gold).toBe(s.gold); expect(g2.s.paidCustomers).toBe(s.paidCustomers); expect(g2.s.today.sales).toBe(s.today.sales);
    expect(g2.s.customers.length).toBe(s.customers.length); expect(g2.sim.kitchen.integrity(g2.sim)).toEqual([]);
    const tx = Object.keys(g2.s.tx).filter((k) => k.startsWith('pay:')); expect(new Set(tx).size).toBe(tx.length);
    // Yüklenen kayıtta sabah işlemleri yeniden tetiklenmez
    const g3 = reload(g2.sim); expect(g3.s.gold).toBe(g2.s.gold); expect(g3.s.crate).toEqual(g2.s.crate); expect(g3.s.quests.done).toEqual(g2.s.quests.done);
  });
  it('T23/T34: dış sahneye geçince pişirme, sipariş ve müşteri kaybolmaz', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; s.minute = 600; clearBar(g); stockSoup(g, 4);
    give(sim, { potato: 2, carrot: 1, onion: 1 }); bot.cook('vegetable_soup', false);
    const a = arrive(g, 2); seat(g, a); const o = sim.service.takeOrder(sim, a.id).order;
    const bar = sim.kitchen.barModules(sim)[0]; bot.go(bar.x, bar.y); sim.service.pickupAt(sim, bar.id);
    expect(bot.toScene('railway_outdoors')).toBe(true); bot.gather('tree', 1); sim.tick(20); bot.toScene('town_square'); sim.tick(5); bot.toScene('restaurant_interior');
    expect(s.player.carry.length).toBe(1); expect(s.orders[0].id).toBe(o.id); expect(s.groups.find((x) => x.id === a.id)).toBeTruthy();
    expect(s.furniture.find((f) => f.type === 'starter_stove').cook.phase).toBe('done');
    finish(g); expect(s.today.sold.vegetable_soup).toBeGreaterThanOrEqual(3);
  });
  it('T28: sürüm doğrulaması ve bozuk dosyada güvenli hata', () => {
    const g = afterTutorial(); const text = serialize(g.sim); const obj = JSON.parse(text);
    expect(obj.magic).toBe(SAVE_MAGIC); expect(obj.version).toBe(1);
    expect(parse('{bozuk json').ok).toBe(false); expect(parse('{bozuk json').error).toMatch(/bozuk/);
    expect(parse('{"foo":1}').ok).toBe(false); expect(parse(JSON.stringify({ ...obj, version: 99 })).error).toMatch(/sürüm/);
    expect(parse(JSON.stringify({ ...obj, version: 0 })).ok).toBe(false);
    const broken = JSON.parse(text); delete broken.state.furniture; expect(parse(JSON.stringify(broken)).error).toMatch(/eksik/);
    const neg = JSON.parse(text); neg.state.gold = -5; expect(parse(JSON.stringify(neg)).ok).toBe(false);
    expect(parse(text.slice(0, text.length / 2)).ok).toBe(false); expect(parse(null).ok).toBe(false);
    // Dışa aktar → içe aktar roundtrip
    const p = parse(JSON.parse(JSON.stringify(text))); expect(p.ok).toBe(true); expect(p.state.day).toBe(g.s.day);
  });
});
