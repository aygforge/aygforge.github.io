import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/rng.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { addStack, countStack, addItem, equipFromBag, unequip, firstFree, sortContainer, makeContainer, moveBetween, moveSlot, claimPending } from '../../src/systems/inventory.js';
import * as eco from '../../src/systems/economy.js';
import { createItem } from '../../src/systems/loot.js';
import { RECIPES } from '../../src/data/recipes.js';
import { STACKABLES, POTION_LIST } from '../../src/data/materials.js';
import { ITEMS } from '../../src/data/items.js';
import { cumulativeXp } from '../../src/data/constants.js';

const rng = new Rng(77);
const mk = (cls = 'warrior') => createCharacter({ name: 'Ekonomi', cls, slot: 0 }, rng);
const fill = (c, mats) => { for (const [id, q] of Object.entries(mats)) addStack(c.bag, id, q); };

describe('Envanter ve ekipman', () => {
  it('36 başlangıç slotu; çift elli silah yardımcı eli kapatır', () => {
    const c = mk('warrior'); gainExp(c, cumulativeXp(6));
    expect(c.bag.size).toBe(36);
    addItem(c, createItem('O01', 'N', rng)); // kalkan
    expect(equipFromBag(c, 0).ok).toBe(true);
    expect(c.equipment.offhand.tid).toBe('O01');
    const pala = createItem('W02', 'U', rng);
    const r = addItem(c, pala);
    expect(equipFromBag(c, r.index).ok).toBe(true);
    expect(c.equipment.offhand).toBeNull();
    expect(c.bag.slots.some((s) => s?.tid === 'O01')).toBe(true);
    const k = c.bag.slots.findIndex((s) => s?.tid === 'O01');
    expect(equipFromBag(c, k).ok).toBe(false);
  });
  it('sınıf ve seviye kontrolü', () => {
    const c = mk('warrior');
    const r = addItem(c, createItem('M01', 'N', rng));
    expect(equipFromBag(c, r.index).msg).toMatch(/sınıf/);
    const r2 = addItem(c, createItem('W03', 'R', rng));
    expect(equipFromBag(c, r2.index).msg).toMatch(/Seviye/);
  });
  it('çanta doluyken Rare+ bekleyen loot\'a gider, silinmez', () => {
    const c = mk('mage');
    while (firstFree(c.bag) >= 0) addItem(c, createItem('R01', 'N', rng));
    const n = addItem(c, createItem('R01', 'N', rng));
    expect(n.ok).toBe(false);
    const rare = addItem(c, createItem('M03', 'R', rng));
    expect(rare.where).toBe('pending');
    expect(c.pending.length).toBe(1);
    c.bag.slots[3] = null;
    expect(claimPending(c)).toBe(1);
    expect(c.bag.slots[3].tid).toBe('M03');
  });
  it('istif ve sıralama', () => {
    const c = mk('mage');
    addStack(c.bag, 'iron', 150);
    expect(countStack(c.bag, 'iron')).toBe(150);
    expect(sortContainer(c.bag)).toBe(true);
    expect(countStack(c.bag, 'iron')).toBe(150);
  });
  it('depo karakterler arası aktarım', () => {
    const storage = makeContainer(60);
    const a = mk('warrior'), b = mk('mage');
    addItem(a, createItem('R04', 'R', rng));
    const idx = a.bag.slots.findIndex((s) => s?.tid === 'R04');
    expect(moveBetween(a.bag, idx, storage).ok).toBe(true);
    const sidx = storage.slots.findIndex((s) => s?.tid === 'R04');
    expect(moveBetween(storage, sidx, b.bag).ok).toBe(true);
    expect(b.bag.slots.some((s) => s?.tid === 'R04')).toBe(true);
  });
});

describe('Ekonomi', () => {
  it('alış, satış; Legendary satılamaz/parçalanamaz', () => {
    const c = mk(); c.gold = 1000;
    const b = eco.buyEquipment(c, 'H01');
    expect(b.ok).toBe(true);
    expect(c.gold).toBe(1000 - b.price);
    const idx = c.bag.slots.findIndex((s) => s?.uid === b.inst.uid);
    const s = eco.sellFromBag(c, idx);
    expect(s.ok).toBe(true);
    expect(s.price).toBeLessThan(b.price);
    const leg = addItem(c, createItem('W08', 'L', rng));
    expect(eco.sellFromBag(c, leg.index).ok).toBe(false);
    expect(eco.dismantle(c, leg.index, rng).ok).toBe(false);
  });
  it('kilitli eşya satılmaz', () => {
    const c = mk();
    const r = addItem(c, createItem('W03', 'R', rng));
    c.bag.slots[r.index].lock = true;
    expect(eco.sellFromBag(c, r.index).ok).toBe(false);
  });
  it('crafting: yeterliyse tek seferde tüketir ve üretir; eksikse hiçbir şey değişmez', () => {
    const c = mk(); c.gold = 1000;
    fill(c, { iron_ore: 3 });
    const g0 = c.gold;
    expect(eco.craft(c, 'r_iron', rng).ok).toBe(true);
    expect(countStack(c.bag, 'iron')).toBe(1);
    expect(countStack(c.bag, 'iron_ore')).toBe(1);
    expect(c.gold).toBe(g0 - 10);
    const snapshot = JSON.stringify(c);
    expect(eco.craft(c, 'r_iron', rng).ok).toBe(false);
    expect(JSON.stringify(c)).toBe(snapshot);
  });
  it('bütün tarifler çalışır', () => {
    for (const r of RECIPES) {
      const c = mk(); c.gold = 50000;
      for (const i of r.inputs) addStack(c.bag, i.id, i.qty);
      const res = eco.craft(c, r.id, rng);
      expect(res.ok, r.id).toBe(true);
      for (const i of r.inputs) expect(countStack(c.bag, i.id)).toBe(0);
      if (r.out.equip) expect(c.bag.slots.some((s) => s?.tid === r.out.id && s.r === ITEMS[r.out.id].rarity)).toBe(true);
      else expect(countStack(c.bag, r.out.id)).toBe(r.out.qty);
    }
  });
  it('sınırsız gold döngüsü yok: al→sat, craft→sat, al→parçala→sat, craft→parçala→sat', () => {
    // NPC'den alınan her ekipman satıştan / parçalamadan daha pahalı
    for (const o of eco.merchantStock()) {
      const inst = createItem(o.tid, ITEMS[o.tid].rarity, rng, { noBonus: true });
      expect(eco.itemSellPrice(inst)).toBeLessThan(o.price);
      for (let i = 0; i < 50; i++) {
        const out = eco.dismantleOutput(inst, rng);
        const v = out.reduce((a, x) => a + STACKABLES[x.id].sell * x.qty, 0);
        expect(v).toBeLessThan(o.price);
      }
    }
    // İksir: satış < satın alma ve < üretim gold maliyeti (materyal bedava sayılsa bile)
    for (const p of POTION_LIST) {
      expect(p.sell).toBeLessThan(p.buy);
      for (const r of RECIPES.filter((x) => x.out.id === p.id)) expect(p.sell).toBeLessThan(r.gold + eco.BOTTLE_PRICE);
    }
    expect(STACKABLES.empty_bottle.sell).toBeLessThan(eco.BOTTLE_PRICE);
    // Stack çıktılı tarifler: çıktı satışı < (gold + girdilerin satış değeri)
    for (const r of RECIPES.filter((x) => !x.out.equip)) {
      const outV = STACKABLES[r.out.id].sell * r.out.qty;
      const inV = r.gold + r.inputs.reduce((a, i) => a + STACKABLES[i.id].sell * i.qty, 0);
      expect(outV, r.id).toBeLessThan(inV);
    }
    // Ekipman tarifleri: satış + parçalama < üretim gold'u
    for (const r of RECIPES.filter((x) => x.out.equip)) {
      const inst = createItem(r.out.id, ITEMS[r.out.id].rarity, rng);
      expect(eco.itemSellPrice(inst)).toBeLessThan(r.gold);
      const out = eco.dismantleOutput(inst, rng);
      expect(out.reduce((a, x) => a + STACKABLES[x.id].sell * x.qty * 2, 0)).toBeLessThan(r.gold);
    }
  });
  it('tamir ve ölüm dayanıklılığı', () => {
    const c = mk(); c.gold = 1000;
    eco.applyDeathDurability(c);
    expect(c.equipment.weapon.d).toBe(90);
    const cost = eco.repairAllCost(c);
    expect(cost).toBeGreaterThan(0);
    expect(eco.repairAll(c).ok).toBe(true);
    expect(c.gold).toBe(1000 - cost);
    expect(c.equipment.weapon.d).toBe(100);
  });
  it('çanta 36→42→48, depo 60→90', () => {
    const c = mk(); c.gold = 10000;
    expect(eco.expandBag(c).size).toBe(42);
    expect(eco.expandBag(c).size).toBe(48);
    expect(eco.expandBag(c).ok).toBe(false);
    expect(c.gold).toBe(10000 - 5500);
    const st = makeContainer(60);
    expect(eco.expandStorage(c, st).ok).toBe(true);
    expect(st.size).toBe(90);
  });
});

describe('Demirci', () => {
  it('başarı oranları +1 %100, +2 %90, +3 %75, +4 %55, +5 %35', () => {
    const exp = [1, 0.9, 0.75, 0.55, 0.35];
    for (let lvl = 0; lvl < 5; lvl++) {
      let ok = 0; const n = 20000; const r = new Rng(100 + lvl);
      for (let i = 0; i < n; i++) {
        const c = mk(); c.gold = 1e6;
        const inst = createItem('W03', 'R', r); inst.p = lvl;
        const a = addItem(c, inst);
        fill(c, { iron: 4, hardening_stone: 2, altar_crystal: 1, ancient_core: 1 });
        const res = eco.upgrade(c, { where: 'bag', index: a.index }, r);
        expect(res.ok).toBe(true);
        if (res.success) ok++;
        // başarısızlıkta seviye düşmez, eşya silinmez
        expect(c.bag.slots[a.index].p).toBeGreaterThanOrEqual(lvl);
        expect(c.bag.slots[a.index]).toBeTruthy();
      }
      expect(Math.abs(ok / n - exp[lvl])).toBeLessThan(0.015);
    }
  });
  it('başarısızlıkta materyal ve gold tüketilir; eksik kaynakla işlem olmaz', () => {
    const r = { float: () => 0.99 }; // her zaman başarısız
    const c = mk(); c.gold = 5000;
    const inst = createItem('W03', 'R', new Rng(1)); inst.p = 1;
    const a = addItem(c, inst);
    fill(c, { iron: 4 });
    const info = eco.upgradeInfo(inst);
    expect(info.gold).toBe(450);
    const res = eco.upgrade(c, { where: 'bag', index: a.index }, r);
    expect(res.success).toBe(false);
    expect(c.gold).toBe(5000 - 450);
    expect(countStack(c.bag, 'iron')).toBe(0);
    expect(c.bag.slots[a.index].p).toBe(1);
    expect(eco.upgrade(c, { where: 'bag', index: a.index }, r).ok).toBe(false);
  });
  it('maliyet çarpanları ve yüzük/kolye yükseltilmez; N/U +5 için 3 Sunak Kristali', () => {
    const e = createItem('W05', 'E', rng); e.p = 4;
    expect(eco.upgradeInfo(e).gold).toBe(Math.round(9000 * 1.5 / 10) * 10);
    const n = createItem('W01', 'N', rng);
    expect(eco.upgradeInfo(n).gold).toBe(Math.round(150 * 0.6 * 0.5 / 10) * 10);
    const ring = createItem('R04', 'R', rng);
    expect(eco.upgradeInfo(ring).ok).toBe(false);
    const u = createItem('W02', 'U', rng); u.p = 4;
    expect(eco.upgradeInfo(u).mats).toEqual([{ id: 'altar_crystal', qty: 3 }]);
  });
});

describe('Çantada sürükle-bırak (moveSlot)', () => {
  it('boş yuvaya taşır, dolu yuvada yer değiştirir, aynı istifi birleştirir', () => {
    const c = makeContainer(6);
    addStack(c, 'iron_ore', 5);          // 0
    addStack(c, 'wolf_tooth', 3);        // 1
    expect(moveSlot(c, 0, 4).ok).toBe(true);
    expect(c.slots[0]).toBe(null);
    expect(c.slots[4].tid).toBe('iron_ore');
    expect(moveSlot(c, 1, 4).swapped).toBe(true);
    expect(c.slots[4].tid).toBe('wolf_tooth');
    expect(c.slots[1].tid).toBe('iron_ore');
    // aynı tür istif birleşir, 99'u aşan kısım yerinde kalır
    c.slots[2] = { uid: 'x', tid: 'iron_ore', q: 97 };
    expect(moveSlot(c, 1, 2).merged).toBe(2);
    expect(c.slots[2].q).toBe(99);
    expect(c.slots[1].q).toBe(3);
    expect(countStack(c, 'iron_ore')).toBe(102);
    expect(moveSlot(c, 3, 5).ok).toBe(false);   // boş yuvadan taşıma yok
    expect(moveSlot(c, 2, 2).ok).toBe(false);
  });
});
