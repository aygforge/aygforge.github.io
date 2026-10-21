import { describe, it, expect } from 'vitest';
import { ITEM_LIST, ITEMS } from '../../src/data/items.js';
import { ENEMIES, NORMAL_IDS, ELITE_IDS, BOSS_IDS } from '../../src/data/enemies.js';
import { QUESTS, ALL_QUESTS } from '../../src/data/quests.js';
import { RECIPES } from '../../src/data/recipes.js';
import { STACKABLES } from '../../src/data/materials.js';
import { NPCS } from '../../src/data/npcs.js';
import { MAPS } from '../../src/data/maps/index.js';
import { LOOT_TABLES } from '../../src/data/loot.js';
import { xpToNext, cumulativeXp } from '../../src/data/constants.js';

describe('Veri tabloları', () => {
  it('tam 60 eşya şablonu, nadirlik sayımı 14/15/18/11/2', () => {
    expect(ITEM_LIST.length).toBe(60);
    const c = { N: 0, U: 0, R: 0, E: 0, L: 0 };
    for (const t of ITEM_LIST) c[t.rarity]++;
    expect(c).toEqual({ N: 14, U: 15, R: 18, E: 11, L: 2 });
    const slots = {};
    for (const t of ITEM_LIST) slots[t.slot] = (slots[t.slot] || 0) + 1;
    expect(slots).toEqual({ weapon: 16, offhand: 6, helm: 6, chest: 8, gloves: 6, boots: 6, ring: 6, amulet: 6 });
    expect(new Set(ITEM_LIST.map((t) => t.id)).size).toBe(60);
  });
  it('her oynanabilir sınıf için her slotta en az bir eşya var', () => {
    for (const cls of ['warrior', 'mage']) {
      for (const slot of ['weapon', 'offhand', 'helm', 'chest', 'gloves', 'boots', 'ring', 'amulet']) {
        expect(ITEM_LIST.some((t) => t.slot === slot && (t.cls === cls || t.cls === 'any'))).toBe(true);
      }
    }
  });
  it('12 normal, 3 elit, 2 boss', () => {
    expect(NORMAL_IDS.length).toBe(12);
    expect(ELITE_IDS.length).toBe(3);
    expect(BOSS_IDS.length).toBe(2);
  });
  it('belge stat değerleri (örnekler)', () => {
    expect(ENEMIES.meadow_rat).toMatchObject({ level: 2, hp: 32, atk: 8, def: 2, mdef: 2, exp: 12 });
    expect(ENEMIES.rotten_guard).toMatchObject({ level: 19, hp: 560, atk: 94, def: 52, mdef: 37, exp: 240 });
    expect(ENEMIES.mine_golem).toMatchObject({ level: 20, hp: 20000, atk: 155, def: 75, mdef: 65, exp: 1600 });
    expect(ENEMIES.alpha_wolf).toMatchObject({ level: 11, hp: 5200, atk: 92, def: 35, mdef: 32, exp: 450 });
  });
  it('item kaynakları geçerli yaratık/tüccar/craft', () => {
    for (const t of ITEM_LIST) for (const s of t.sources) expect(['merchant', 'starter', 'craft'].includes(s) || !!ENEMIES[s]).toBe(true);
  });
  it('loot tabloları toplam %100', () => {
    for (const t of Object.values(LOOT_TABLES)) expect(t.N + t.U + t.R + t.E + t.L + t.none).toBeCloseTo(100, 6);
    expect(LOOT_TABLES.normal.R).toBe(0.25);
    expect(LOOT_TABLES.elite.E).toBe(0.75);
    expect(LOOT_TABLES.golem.L).toBe(0.4);
    for (const [k, t] of Object.entries(LOOT_TABLES)) if (k !== 'golem') expect(t.L).toBe(0);
  });
  it('tarif girdi/çıktıları tanımlı ID', () => {
    for (const r of RECIPES) {
      expect(!!(ITEMS[r.out.id] || STACKABLES[r.out.id])).toBe(true);
      for (const i of r.inputs) expect(!!STACKABLES[i.id]).toBe(true);
    }
  });
  it('EXP tablosu: Lv1→20 toplam 88.150', () => {
    expect(xpToNext(1)).toBe(80);
    expect(xpToNext(19)).toBe(16540);
    expect(cumulativeXp(20)).toBe(88150);
  });
  it('18 ana + 8 yan = 26 görev; EXP 16.550 + 5.500, Gold 5.365 + 1.590', () => {
    const main = QUESTS.filter((q) => q.main), side = QUESTS.filter((q) => !q.main);
    expect(main.length).toBe(18);
    expect(side.length).toBe(8);
    expect(main.reduce((a, q) => a + q.exp, 0)).toBe(16550);
    expect(side.reduce((a, q) => a + q.exp, 0)).toBe(5500);
    expect(main.reduce((a, q) => a + q.gold, 0)).toBe(5365);
    expect(side.reduce((a, q) => a + q.gold, 0)).toBe(1590);
  });
  it('görev hedefleri gerçek yaratık/konum/nesne/NPC\'ye bağlı', () => {
    const locs = new Set(), groups = new Set();
    for (const m of Object.values(MAPS)) {
      for (const l of m.locations || []) locs.add(l.id);
      for (const o of m.objects || []) if (o.group) groups.add(o.group);
    }
    for (const q of ALL_QUESTS) {
      expect(NPCS[q.giver]).toBeTruthy();
      expect(NPCS[q.turnIn]).toBeTruthy();
      for (const o of q.objectives) {
        if (o.type === 'kill' && o.enemy) expect(ENEMIES[o.enemy]).toBeTruthy();
        if (o.type === 'qitem') o.from.forEach((e) => expect(ENEMIES[e]).toBeTruthy());
        if (o.type === 'reach') expect(locs.has(o.loc)).toBe(true);
        if (o.type === 'interact') {
          expect(groups.has(o.group)).toBe(true);
          const n = Object.values(MAPS).flatMap((m) => m.objects).filter((x) => x.group === o.group).length;
          expect(n).toBeGreaterThanOrEqual(o.count);
        }
        if (o.type === 'deliver') expect(STACKABLES[o.item]).toBeTruthy();
        if (o.type === 'talk') expect(NPCS[o.npc]).toBeTruthy();
      }
      for (const r of q.rewardItems) expect(STACKABLES[r.id]).toBeTruthy();
    }
  });
  it('köyde 7 NPC haritaya yerleşik', () => {
    const npcs = MAPS.village.objects.filter((o) => o.type === 'npc').map((o) => o.npc);
    expect(npcs.sort()).toEqual(Object.keys(NPCS).sort());
  });
});
