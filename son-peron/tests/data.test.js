import { describe, it, expect } from 'vitest';
import { C, raw, fresh, toStage } from './helpers/setup.js';
import { validateCatalog } from '../src/data/catalog.js';

describe('Veri sözleşmesi (T31, T32)', () => {
  it('JSON ayrışır, katalog hatasızdır ve sayımlar GDD ile eşleşir', () => {
    expect(C.errors).toEqual([]); expect(validateCatalog(C)).toEqual([]);
    const cnt = (cat) => Object.values(C.items).filter((i) => i.cat === cat).length;
    expect(cnt('ingredient')).toBe(23); expect(cnt('resource')).toBe(5); expect(cnt('seed')).toBe(5);
    expect(Object.values(C.recipes).filter((r) => r.kind === 'food').length).toBe(15);
    expect(Object.values(C.recipes).filter((r) => r.kind === 'drink').length).toBe(6);
    expect(Object.keys(C.furniture).length).toBe(38); expect(Object.keys(C.equipment).length).toBe(14);
    expect(Object.keys(C.tools).length).toBe(2); expect(Object.keys(C.cosmetics).length).toBe(9);
    expect(C.expansions.length).toBe(4); expect(C.renovations.length).toBe(5);
    expect(C.quests.story.length).toBe(15); expect(C.quests.side.length).toBe(10); expect(C.quests.daily.length).toBe(8);
    expect(C.events.length).toBe(5); expect(C.festivals.length).toBe(4);
    expect(Object.keys(C.roles).length).toBe(4); expect(Object.keys(C.staff.candidates).length).toBe(12);
    expect(C.trainTimes).toEqual([540, 900, 1260]); expect(C.yearDays).toBe(112);
    expect(C.dayEnd - C.dayStart).toBe(1020); expect(C.realSecPerGameMin).toBeCloseTo(1.17647, 4);
  });
  it('T31: 15 yemek + 6 içecek için maliyet, hasılat, brüt kâr ve istasyon formülleri', () => {
    for (const r of Object.values(C.recipes)) {
      const cost = r.ready ? C.items[r.id].buy : Object.entries(r.ingredients).reduce((a, [id, q]) => a + C.items[id].buy * q, 0);
      expect(cost, r.id).toBe(r.cost); expect(r.yield * r.price, r.id).toBe(r.sales); expect(r.sales - r.cost, r.id).toBe(r.profit);
      if (!r.ready) expect(['stove', 'basic_oven', 'large_pan', 'advanced_stove', 'kettle', 'coffee_machine', 'juicer']).toContain(r.station);
    }
    expect(C.recipes.vegetable_soup).toMatchObject({ cost: 13, price: 12, yield: 4, cook: 30, prep: 4, profit: 35 });
    expect(raw.canonical.tutorial_first_order_cost_g).toBe(Object.entries(C.tutorial.order).reduce((a, [id, q]) => a + C.items[id].buy * q, 0));
  });
  it('tüm görev hedefleri uygulanmıştır', async () => {
    const { OBJ } = await import('../src/systems/quests.js');
    for (const q of C.quests.story) for (const o of q.objectives) expect(OBJ[o], o).toBeTruthy();
  });
  it('T32: 38 mobilya + 14 ekipman + 9 kozmetik benzersiz ID\'li ve 4 yönde geçerli yerleştirilebilir', () => {
    const g = fresh(); toStage(g, 5); const { sim } = g;
    const ids = [...Object.keys(C.furniture), ...Object.keys(C.equipment), ...Object.keys(C.cosmetics)];
    expect(new Set(ids).size).toBe(61);
    for (const id of ids) {
      const d = C.placeables[id]; expect(d.w > 0 && d.h > 0, id).toBe(true); expect(['floor', 'wall', 'tile', 'outdoor', 'ceiling']).toContain(d.place);
      const rots = d.place === 'wall' ? [0] : [0, 1, 2, 3];
      for (const rot of rots) expect(g.bot.findSpot(id, rot), `${id} rot ${rot}`).toBeTruthy();
    }
  });
});
