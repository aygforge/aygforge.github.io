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

const V1_ITEMS = ITEM_LIST.filter((t) => t.lv <= 20);
const V1_QUESTS = QUESTS.filter((q) => (q.main && q.order <= 18) || ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08'].includes(q.id));
const V1_NPCS = ['muhtar', 'boran', 'mira', 'elin', 'hunter', 'sage', 'keeper'];

describe('Veri tabloları', () => {
  it('V1: 60 eşya şablonu aynen korunur, nadirlik sayımı 14/15/18/11/2', () => {
    expect(V1_ITEMS.length).toBe(60);
    const c = { N: 0, U: 0, R: 0, E: 0, L: 0 };
    for (const t of V1_ITEMS) c[t.rarity]++;
    expect(c).toEqual({ N: 14, U: 15, R: 18, E: 11, L: 2 });
    const slots = {};
    for (const t of V1_ITEMS) slots[t.slot] = (slots[t.slot] || 0) + 1;
    expect(slots).toEqual({ weapon: 16, offhand: 6, helm: 6, chest: 8, gloves: 6, boots: 6, ring: 6, amulet: 6 });
    // V1 legendary değerleri değişmedi
    expect(ITEMS.W08).toMatchObject({ lv: 20, base: { atkMin: 90, atkMax: 115 }, legendaryFixed: { str: 14, crit: 0.08 }, effect: 'crimson_strike' });
    expect(ITEMS.M08).toMatchObject({ lv: 20, base: { magMin: 97, magMax: 123 }, legendaryFixed: { int: 16, mp: 60 }, effect: 'spirit_echo' });
  });
  it('V2: 30 yeni şablon (toplam 90), kimlikler benzersiz, Lv.21–30', () => {
    expect(ITEM_LIST.length).toBe(90);
    expect(new Set(ITEM_LIST.map((t) => t.id)).size).toBe(90);
    const v2 = ITEM_LIST.filter((t) => t.lv > 20);
    expect(v2.length).toBe(30);
    const c = { N: 0, U: 0, R: 0, E: 0, L: 0 };
    for (const t of v2) c[t.rarity]++;
    expect(c).toEqual({ N: 0, U: 4, R: 15, E: 9, L: 2 });
    expect(ITEMS.W13).toMatchObject({ name: 'Buzun Hükmü', lv: 30, rarity: 'L', hand: 'two', base: { atkMin: 148, atkMax: 185 }, legendaryFixed: { str: 16, crit: 0.08 }, effect: 'frost_verdict', sources: ['frozen_guardian'] });
    expect(ITEMS.M13).toMatchObject({ name: 'Sonsuz Kış Asası', lv: 30, rarity: 'L', base: { magMin: 158, magMax: 196 }, legendaryFixed: { int: 18, mp: 75 }, effect: 'endless_winter', sources: ['frozen_guardian'] });
    expect(ITEMS.O08).toMatchObject({ base: { def: 43 }, fixed: { hp: 65 } });
    expect(ITEMS.A07).toMatchObject({ fixed: { hp: 70, crit: 0.03 } });
    expect(ITEMS.A08).toMatchObject({ fixed: { mdef: 20, vit: 4 } });
  });
  it('her oynanabilir sınıf için her slotta en az bir eşya var', () => {
    for (const cls of ['warrior', 'mage']) {
      for (const slot of ['weapon', 'offhand', 'helm', 'chest', 'gloves', 'boots', 'ring', 'amulet']) {
        expect(ITEM_LIST.some((t) => t.slot === slot && (t.cls === cls || t.cls === 'any'))).toBe(true);
      }
    }
  });
  it('V1 12 normal, 3 elit, 2 boss + V2 8 normal, 2 elit, 2 boss', () => {
    expect(NORMAL_IDS.length).toBe(20);
    expect(ELITE_IDS.length).toBe(5);
    expect(BOSS_IDS.length).toBe(4);
    const v2 = { ash_imp: [21, 670, 105, 54, 45, 250], ash_hunter: [23, 770, 120, 60, 48, 300], crimson_scorpion: [24, 930, 125, 75, 43, 340],
      burnt_warrior: [25, 1050, 142, 70, 58, 390], frost_wolf: [26, 1100, 148, 72, 65, 410], ice_wisp: [27, 850, 153, 46, 76, 450],
      frost_sentinel: [28, 1450, 184, 95, 72, 500], snow_shaman: [29, 1200, 190, 65, 97, 550], ash_butcher: [25, 5800, 170, 82, 65, 950],
      ice_warden: [29, 8500, 225, 110, 95, 1600] };
    for (const [id, [level, hp, atk, def, mdef, exp]] of Object.entries(v2)) expect(ENEMIES[id], id).toMatchObject({ level, hp, atk, def, mdef, exp });
    expect(ENEMIES.ash_giant).toMatchObject({ level: 26, hp: 35000, atk: 250, def: 110, mdef: 100 });
    expect(ENEMIES.frozen_guardian).toMatchObject({ level: 30, hp: 55000, atk: 310, def: 150, mdef: 130 });
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
    expect(LOOT_TABLES.ash_giant).toMatchObject({ R: 22, E: 2, L: 0 });
    expect(LOOT_TABLES.frost_keeper).toMatchObject({ R: 30, E: 7, L: 0.4 });
    for (const [k, t] of Object.entries(LOOT_TABLES)) if (k !== 'golem' && k !== 'frost_keeper') expect(t.L).toBe(0);
  });
  it('tarif girdi/çıktıları tanımlı ID', () => {
    for (const r of RECIPES) {
      expect(!!(ITEMS[r.out.id] || STACKABLES[r.out.id])).toBe(true);
      for (const i of r.inputs) expect(!!STACKABLES[i.id]).toBe(true);
    }
  });
  it('EXP tablosu: Lv1→20 toplam 88.150 (V1 aynı)', () => {
    expect(xpToNext(1)).toBe(80);
    expect(xpToNext(19)).toBe(16540);
    expect(cumulativeXp(20)).toBe(88150);
  });
  it('V2 EXP tablosu: 20→30 belge değerleri, toplam 368.300 (V3: 30→40 ayrıca test edilir)', () => {
    const want = [19280, 22310, 25640, 29280, 33260, 37580, 42260, 47320, 52760, 58610];
    expect([20, 21, 22, 23, 24, 25, 26, 27, 28, 29].map(xpToNext)).toEqual(want);
    expect(want.reduce((a, b) => a + b, 0)).toBe(368300);
    expect(cumulativeXp(30) - cumulativeXp(20)).toBe(368300);
    expect(xpToNext(40)).toBe(Infinity);
  });
  it('V2 görevleri: 10 ana + 4 yan; EXP 70.500 + 22.000 (V3 görevleri ayrıca sayılır)', () => {
    const V2_IDS = ['m27', 'm28', 'm29', 'm30', 'm31', 'm32', 'm33', 'm34', 'm35', 'm36', 's09', 's10', 's11', 's12'];
    const v2 = QUESTS.filter((q) => V2_IDS.includes(q.id));
    expect(v2.length).toBe(14);
    expect(v2.filter((q) => q.main).length).toBe(10);
    expect(v2.filter((q) => !q.main).length).toBe(4);
    expect(v2.filter((q) => q.main).reduce((a, q) => a + q.exp, 0)).toBe(70500);
    expect(v2.filter((q) => !q.main).reduce((a, q) => a + q.exp, 0)).toBe(22000);
    // V2 hikâyesi V1 finalinden sonra başlar
    expect(v2.find((q) => q.id === 'm27').prereq).toEqual(['m18']);
    for (const q of v2) for (const r of q.rewardItems) expect(STACKABLES[r.id]).toBeTruthy(); // garantili güçlü ekipman ödülü yok
  });
  it('18 ana + 8 yan = 26 görev (V1); EXP 16.550 + 5.500, Gold 5.365 + 1.590', () => {
    const main = V1_QUESTS.filter((q) => q.main), side = V1_QUESTS.filter((q) => !q.main);
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
        if (o.type === 'talk' || o.type === 'visit') expect(NPCS[o.npc]).toBeTruthy();
        if (o.type === 'craft') expect(RECIPES.some((r) => r.id === o.recipe), o.recipe).toBe(true);
        if (o.type === 'escort' || o.type === 'defend') {
          const kind = o.type === 'escort' ? 'escort' : 'defense';
          expect(Object.values(MAPS).flatMap((m) => m.objects).filter((x) => x.type === kind && x.id === o.event).length, o.event).toBe(1);
        }
        if (o.type === 'kill' && o.spawn) expect(MAPS[o.spawn.map], q.id).toBeTruthy();
      }
      for (const r of q.rewardItems) expect(STACKABLES[r.id]).toBeTruthy();
    }
  });
  it('köyde 7 V1 NPC\'si yerinde (+3 V3 NPC\'si); bütün NPC\'ler haritaya yerleşik', () => {
    const npcs = MAPS.village.objects.filter((o) => o.type === 'npc').map((o) => o.npc);
    expect(npcs.sort()).toEqual([...V1_NPCS, 'rauf', 'lale', 'nisa'].sort());
    const placed = Object.values(MAPS).flatMap((m) => m.objects.filter((o) => o.type === 'npc').map((o) => o.npc));
    // GEÇİCİ: Ölü Krallık / Kara Taht haritaları sonraki adımda eklenince bu liste boşaltılacak
    const PENDING_MAP = ['seher', 'hamit', 'eren', 'veysel'];
    for (const id of Object.keys(NPCS)) if (!PENDING_MAP.includes(id)) expect(placed, id).toContain(id);
  });
});
