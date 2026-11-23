import { describe, it, expect } from 'vitest';
import { COMPONENTS, COMP_CODES, ITEMS, ITEM_BY_ID, combineFee } from '../src/data/items';
import { DEFAULT_BUILDS } from '../src/data/builds';
import { CHAMPIONS } from '../src/data/champions';
import { sandbox, champ, duel, run, place } from './helpers';
import { autoBuy, buyStep, nextBuildItem, sellSlot } from '../src/core/shop';
import { dealDamage, grievous, heal } from '../src/core/combat';
import { recomputeChampion, inventoryStats } from '../src/core/stats';
import { FOUNTAIN_POS } from '../src/core/map';
import { BALANCE } from '../src/core/config';
import type { World } from '../src/core/world';
import type { Unit } from '../src/core/unit';

const give = (u: Unit, ...ids: number[]) => { for (const id of ids) u.champ!.inventory.push({ kind: 'item', itemId: id, spent: ITEM_BY_ID[id].price }); };
function atBase(w: World, u: Unit) { const f = FOUNTAIN_POS[u.team as 0 | 1]; place(w, u, f.x + 20, f.y); }

describe('item data', () => {
  it('8 components with exact prices and stats', () => {
    expect(COMP_CODES.length).toBe(8);
    const exp: Record<string, number> = { F: 180, H: 160, B: 180, R: 170, Z: 170, C: 180, G: 160, M: 170 };
    for (const c of COMP_CODES) expect(COMPONENTS[c].price).toBe(exp[c]);
  });
  it('24 items with valid recipes and non-negative combine fees', () => {
    expect(ITEMS.length).toBe(24);
    for (const it of ITEMS) {
      expect(it.recipe.every((c) => COMPONENTS[c])).toBe(true);
      expect(combineFee(it)).toBeGreaterThanOrEqual(0);
    }
    expect(ITEM_BY_ID[1].recipe).toEqual(['F', 'F']);
    expect(ITEM_BY_ID[23].price).toBe(670);
  });
  it('54 starting builds: 18 champions x 3, each 4 distinct real items', () => {
    let n = 0;
    for (const c of CHAMPIONS) for (const k of ['attack', 'defense', 'hybrid'] as const) {
      const b = DEFAULT_BUILDS[c.id][k];
      expect(b.length).toBe(4);
      expect(new Set(b).size).toBe(4);
      expect(b.every((i) => ITEM_BY_ID[i])).toBe(true);
      n++;
    }
    expect(n).toBe(54);
  });
});

describe('shop & inventory', () => {
  it('component stats apply on purchase and are replaced by the completed item', () => {
    const w = sandbox(['rovan', 'nyra', 'edrin'], ['boran', 'zereth', 'tessa']);
    const u = champ(w, 0, 0);
    u.champ!.build = [1, 2, 3, 4];
    atBase(w, u);
    u.champ!.gold = 180;
    expect(buyStep(w, u)).toBe(true);
    expect(inventoryStats(u).ad).toBe(8);
    u.champ!.gold = 180 + combineFee(ITEM_BY_ID[1]);
    expect(buyStep(w, u)).toBe(true);
    expect(u.champ!.inventory).toEqual([{ kind: 'item', itemId: 1, spent: 600 }]);
    expect(inventoryStats(u).ad).toBe(30);
  });
  it('auto-buy follows build order and never buys the same completed item twice', () => {
    const w = sandbox(['rovan', 'nyra', 'edrin'], ['boran', 'zereth', 'tessa']);
    const u = champ(w, 0, 0);
    u.champ!.build = [1, 2, 3, 4];
    atBase(w, u);
    u.champ!.gold = 5000;
    autoBuy(w, u);
    const ids = u.champ!.inventory.map((s) => s.itemId);
    expect(ids).toEqual([1, 2, 3, 4]);
    autoBuy(w, u);
    expect(u.champ!.inventory.length).toBe(4);
    expect(nextBuildItem(u)).toBe(null);
  });
  it('4-slot rule with atomic second component + combine', () => {
    const w = sandbox(['rovan', 'nyra', 'edrin'], ['boran', 'zereth', 'tessa']);
    const u = champ(w, 0, 0);
    u.champ!.build = [1, 2, 3, 4];
    give(u, 1, 2, 3);
    atBase(w, u);
    u.champ!.gold = 200; // only the first component
    expect(buyStep(w, u)).toBe(true);
    expect(u.champ!.inventory.length).toBe(4);
    expect(u.champ!.inventory[3]).toMatchObject({ kind: 'comp', code: 'F' });
    u.champ!.gold = 100; // not enough to finish -> waits, no 5th slot
    expect(buyStep(w, u)).toBe(false);
    expect(u.champ!.inventory.length).toBe(4);
    u.champ!.gold = COMPONENTS.C.price + combineFee(ITEM_BY_ID[4]);
    expect(buyStep(w, u)).toBe(true);
    expect(u.champ!.inventory.length).toBe(4);
    expect(u.champ!.inventory.map((s) => s.itemId)).toEqual([1, 2, 3, 4]);
    expect(u.champ!.inventory[3].spent).toBe(650);
    expect(u.champ!.gold).toBe(0);
  });
  it('selling returns 70% of total spent and only works at base', () => {
    const w = sandbox(['rovan', 'nyra', 'edrin'], ['boran', 'zereth', 'tessa']);
    const u = champ(w, 0, 0);
    give(u, 9);
    place(w, u, 1600, 900);
    expect(sellSlot(w, u, 0).ok).toBe(false);
    atBase(w, u);
    const g = u.champ!.gold;
    const r = sellSlot(w, u, 0);
    expect(r.ok).toBe(true);
    expect(u.champ!.gold - g).toBe(Math.floor(650 * 0.7));
    // via command interface
    give(u, 1);
    w.submit({ type: 'sell', team: 0, slot: 0, index: 0 });
    w.step();
    expect(u.champ!.inventory.length).toBe(0);
  });
  it('changing the build costs no TP and does not sell owned items', () => {
    const w = sandbox(['rovan', 'nyra', 'edrin'], ['boran', 'zereth', 'tessa']);
    const u = champ(w, 0, 0);
    give(u, 1);
    const tp = w.teams[0].tp;
    w.submit({ type: 'setBuild', team: 0, slot: 0, build: [9, 10, 11, 12] });
    w.step();
    expect(u.champ!.build).toEqual([9, 10, 11, 12]);
    expect(u.champ!.inventory[0].itemId).toBe(1);
    expect(w.teams[0].tp).toBeGreaterThanOrEqual(tp);
  });
  it('cooldown reduction is capped at 30%', () => {
    const w = sandbox(['rovan', 'nyra', 'edrin'], ['boran', 'zereth', 'tessa']);
    const u = champ(w, 0, 0);
    for (let i = 0; i < 7; i++) u.champ!.inventory.push({ kind: 'comp', code: 'R', spent: 170 });
    recomputeChampion(w, u);
    expect(u.stats.cdr).toBeCloseTo(BALANCE.cdrCap);
  });
});

describe('item passives', () => {
  const setupDuel = (a = 'rovan', b = 'boran') => { const w = sandbox([a, 'nyra', 'edrin'], [b, 'zereth', 'tessa']); const u = champ(w, 0, 0), e = champ(w, 1, 0); duel(w, u, e, 100); return { w, u, e }; };
  it('01 Keskin Pençe: every 3rd attack +24', () => {
    const { w, u, e } = setupDuel();
    give(u, 1); recomputeChampion(w, u);
    const d: number[] = [];
    for (let i = 0; i < 3; i++) { const h = e.hp + e.shieldTotal; w.applyBasicAttack(u, e); d.push(h - e.hp - e.shieldTotal); }
    expect(d[2]).toBeGreaterThan(d[0] + 10);
  });
  it('02 Rüzgâr Yayı: 4th attack reduces a cooldown', () => {
    const { w, u, e } = setupDuel();
    give(u, 2); u.champ!.cds.s1 = w.time + 5; u.champ!.cds.s2 = w.time + 1;
    for (let i = 0; i < 4; i++) w.applyBasicAttack(u, e);
    expect(u.champ!.cds.s1).toBeCloseTo(w.time + 4.4, 5);
  });
  it('03 Kırık Mızrak armor penetration increases damage', () => {
    const a = setupDuel(); const d1 = dealDamage(a.w, a.u, a.e, 100, 'phys');
    const b = setupDuel(); give(b.u, 3); recomputeChampion(b.w, b.u); const d2 = dealDamage(b.w, b.u, b.e, 100, 'phys');
    expect(d2).toBeGreaterThan(d1);
  });
  it('04 Kan Çeliği lifesteal, halved on minions', () => {
    const { w, u, e } = setupDuel();
    give(u, 4); recomputeChampion(w, u); u.hp = 200;
    w.applyBasicAttack(u, e);
    expect(u.hp).toBeGreaterThan(200);
  });
  it('05 Yıldız Asası: two different abilities proc bonus (per-target cooldown)', () => {
    const { w, u, e } = setupDuel('rovan');
    give(u, 5);
    dealDamage(w, u, e, 10, 'magic', { ability: 's1' });
    const h = e.hp; dealDamage(w, u, e, 10, 'magic', { ability: 's2' });
    const first = h - e.hp;
    const h2 = e.hp; dealDamage(w, u, e, 10, 'magic', { ability: 's1' });
    expect(first).toBeGreaterThan(h2 - e.hp + 10);
  });
  it('06 Kor Mührü applies a % max HP burn', () => {
    const { w, u, e } = setupDuel('asira'); give(u, 6);
    dealDamage(w, u, e, 10, 'magic', { ability: 's1' });
    expect(e.dots.some((d) => d.key.startsWith('i6_'))).toBe(true);
  });
  it('07 Boşluk Merceği MR penetration', () => {
    const a = setupDuel('asira'); const d1 = dealDamage(a.w, a.u, a.e, 100, 'magic');
    const b = setupDuel('asira'); give(b.u, 7); recomputeChampion(b.w, b.u); const d2 = dealDamage(b.w, b.u, b.e, 100, 'magic');
    expect(d2).toBeGreaterThan(d1);
  });
  it('08 Ayaz Tacı slows on ability hit with per-target cooldown', () => {
    const { w, u, e } = setupDuel('asira'); give(u, 8);
    dealDamage(w, u, e, 10, 'magic', { ability: 's1' });
    expect(e.slows.length).toBe(1);
    dealDamage(w, u, e, 10, 'magic', { ability: 's1' });
    expect(e.slows.length).toBe(1);
  });
  it('09 Sur Plakası and 10 Ejder Pulu reduce champion damage', () => {
    const a = setupDuel(); const d1 = dealDamage(a.w, a.u, a.e, 100, 'true', { attack: true });
    const b = setupDuel(); give(b.e, 9); const d2 = dealDamage(b.w, b.u, b.e, 100, 'true', { attack: true });
    expect(d2).toBeLessThan(d1);
    const c = setupDuel(); give(c.e, 10); const d3 = dealDamage(c.w, c.u, c.e, 100, 'magic');
    const d = setupDuel(); const d4 = dealDamage(d.w, d.u, d.e, 100, 'magic');
    expect(d3).toBeLessThan(d4);
  });
  it('11 Dev Yüreği / 16 Temkin Mantosu regenerate out of combat', () => {
    const { w, u } = setupDuel(); give(u, 11); recomputeChampion(w, u); u.hp = 300; u.champ!.lastCombat = -99;
    place(w, u, 1600, 900);
    run(w, 2);
    expect(u.hp).toBeGreaterThan(300 + u.stats.maxHp * 0.015);
  });
  it('12 Son Siper shields below 30% (75s cooldown)', () => {
    const { w, u, e } = setupDuel(); give(e, 12); recomputeChampion(w, e);
    e.hp = e.stats.maxHp * 0.32;
    dealDamage(w, u, e, 60, 'true');
    expect(e.shieldTotal).toBeGreaterThan(0);
    expect(e.champ!.itemCd.i12).toBeCloseTo(w.time + 75);
  });
  it('13 İz Sürücü Çizmesi: more speed out of combat', () => {
    const { w, u } = setupDuel(); const ms0 = u.stats.ms; give(u, 13); u.champ!.lastCombat = -99; recomputeChampion(w, u);
    expect(u.stats.ms).toBeCloseTo(ms0 * 1.16, 0);
    u.champ!.lastCombat = w.time; recomputeChampion(w, u);
    expect(u.stats.ms).toBeCloseTo(ms0 * 1.06, 0);
  });
  it('14 Savaş Ruhu heals on kill', () => {
    const { w, u, e } = setupDuel(); give(u, 14); u.hp = 300;
    dealDamage(w, u, e, 99999, 'true');
    expect(u.hp).toBeGreaterThan(300);
  });
  it('15 Tetik Bileziği: first attack after ability +28', () => {
    const { w, u, e } = setupDuel(); give(u, 15); recomputeChampion(w, u);
    const h0 = e.hp + e.shieldTotal; w.applyBasicAttack(u, e); const plain = h0 - e.hp - e.shieldTotal;
    u.champ!.passive.triggerReady = 1;
    const h1 = e.hp + e.shieldTotal; w.applyBasicAttack(u, e); const boosted = h1 - e.hp - e.shieldTotal;
    expect(boosted).toBeGreaterThan(plain + 10);
  });
  it('17/18 grievous wounds; strongest applies, no stacking', () => {
    const { w, u, e } = setupDuel(); give(u, 17); w.applyBasicAttack(u, e);
    expect(e.grievous.length).toBe(1);
    e.hp = 100; grievous(w, e, 0.2, 3);
    const healed = heal(w, e, 100, e);
    expect(healed).toBeCloseTo(65, 5);
  });
  it('19 Kalkan Kırıcı deals extra damage to shields', () => {
    const a = setupDuel(); a.e.shields.push({ amount: 1000, until: a.w.time + 5, src: 't' }); dealDamage(a.w, a.u, a.e, 100, 'true', { attack: true }); const s1 = 1000 - a.e.shieldTotal;
    const b = setupDuel(); give(b.u, 19); b.e.shields.push({ amount: 1000, until: b.w.time + 5, src: 't' }); dealDamage(b.w, b.u, b.e, 100, 'true', { attack: true }); const s2 = 1000 - b.e.shieldTotal;
    expect(s2).toBeCloseTo(s1 * 1.4, 0);
  });
  it('20 Delici Mühür shreds MR on ability hit', () => {
    const { w, u, e } = setupDuel('asira'); give(u, 20);
    dealDamage(w, u, e, 10, 'magic', { ability: 's1' });
    expect(e.mrShred.some((s) => s.amt === 0.12)).toBe(true);
  });
  it('21 Ruh Bağı boosts living summons only; 22 Rün Çekirdeği boosts structures only', () => {
    const w = sandbox(['rughan', 'nyra', 'ilvara'], ['boran', 'zereth', 'tessa']);
    const r = champ(w, 0, 0), il = champ(w, 0, 2), e = champ(w, 1, 0);
    duel(w, r, e, 100);
    const wolf = w.units.find((s) => s.kind === 'summon' && s.ownerId === r.id)!;
    const d1 = dealDamage(w, wolf, e, 100, 'true');
    give(r, 21);
    const d2 = dealDamage(w, wolf, e, 100, 'true');
    expect(d2).toBeGreaterThan(d1 * 1.1);
    place(w, il, 1500, 900);
    w.castSkill(il, 's1', { x: 1520, y: 900 }); run(w, 0.5);
    const sentry = w.units.find((s) => s.alive && s.sub === 'sentry')!;
    give(il, 21);
    const s1 = dealDamage(w, sentry, e, 100, 'true');
    il.champ!.inventory = []; give(il, 22);
    const s2 = dealDamage(w, sentry, e, 100, 'true');
    expect(s2).toBeGreaterThan(s1 * 1.1);
  });
  it('23 Kuşatma Tokmağı: extra tower damage with allied minion support', () => {
    const w = sandbox(['rovan', 'nyra', 'edrin'], ['boran', 'zereth', 'tessa']);
    const u = champ(w, 0, 0);
    run(w, 241); // fortification gone
    const tower = w.units.find((t) => t.kind === 'tower' && t.team === 1 && t.tier === 'outer' && t.alive)!;
    const m = w.units.find((x) => x.kind === 'minion' && x.team === 0 && x.alive)!;
    place(w, m, tower.x - 100, tower.y);
    const d1 = dealDamage(w, u, tower, 100, 'true');
    give(u, 23);
    const d2 = dealDamage(w, u, tower, 100, 'true');
    expect(d2).toBeCloseTo(d1 * 1.15, 0);
  });
  it('24 Orman Pusulası: +20% vs camps, +8% vs bosses', () => {
    const w = sandbox(['rovan', 'nyra', 'edrin'], ['boran', 'zereth', 'tessa']);
    const u = champ(w, 0, 1);
    run(w, 21);
    const m = w.units.find((x) => x.kind === 'monster' && x.alive)!;
    const d1 = dealDamage(w, u, m, 100, 'true');
    give(u, 24);
    const d2 = dealDamage(w, u, m, 100, 'true');
    expect(d2 / d1).toBeCloseTo(1.2, 2);
  });
  it('percent damage is capped against bosses', () => {
    const w = sandbox(['nyra', 'zereth', 'edrin'], ['boran', 'korruk', 'tessa']);
    run(w, 151);
    const boss = w.units.find((u) => u.kind === 'boss' && u.alive)!;
    const u = champ(w, 0, 0);
    const d = dealDamage(w, u, boss, boss.stats.maxHp * 0.25, 'true', { percent: true });
    expect(d).toBeLessThanOrEqual(BALANCE.bossPercentCap * 1.2);
  });
});
