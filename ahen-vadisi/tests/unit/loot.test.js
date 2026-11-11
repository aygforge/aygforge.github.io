import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/rng.js';
import { rollKillLoot, buildPool, createItem, rollBonuses, bonusCandidates, rollAltar } from '../../src/systems/loot.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { ITEMS, ITEM_LIST, canClassUse } from '../../src/data/items.js';
import { LOOT_TABLES, BONUS_TYPES } from '../../src/data/loot.js';

const sources = Object.values(ENEMIES).filter((e) => e.lootTable);
// 3σ binom tolerans
const tol = (p, n) => 4 * Math.sqrt(p * (1 - p) / n) + 1e-9;

function simulate(enemyId, n, seed, cls = 'warrior') {
  const r = new Rng(seed);
  const c = { N: 0, U: 0, R: 0, E: 0, L: 0, none: 0 };
  for (let i = 0; i < n; i++) {
    const res = rollKillLoot(enemyId, { cls }, r);
    if (res.equipment.length) c[res.equipment[0].r]++; else c.none++;
  }
  return c;
}

describe('Loot RNG', () => {
  it('normal yaratık: ≥100.000 öldürmede N %4 / U %1,2 / R %0,25', () => {
    const n = 200000;
    const c = simulate('gray_wolf', n, 11);
    for (const k of ['N', 'U', 'R']) expect(Math.abs(c[k] / n - LOOT_TABLES.normal[k] / 100)).toBeLessThan(tol(LOOT_TABLES.normal[k] / 100, n));
    expect(c.E + c.L).toBe(0);
    console.log('Boz Kurt 200k:', c);
  });
  it('elit: ≥100.000 öldürmede Epic %0,75', () => {
    const n = 150000;
    const c = simulate('red_vein_watcher', n, 12);
    for (const k of ['N', 'U', 'R', 'E']) expect(Math.abs(c[k] / n - LOOT_TABLES.elite[k] / 100)).toBeLessThan(tol(LOOT_TABLES.elite[k] / 100, n));
    expect(c.L).toBe(0);
    console.log('Gözcü 150k:', c);
  });
  it('Maden Golemi: 1.000.000 kesimde Legendary %0,4 (pity yok)', () => {
    const n = 1000000;
    const r = new Rng(13);
    let L = 0, R = 0, E = 0, maxDry = 0, dry = 0;
    const own = { warrior: 0, mage: 0 };
    for (let i = 0; i < n; i++) {
      const res = rollKillLoot('mine_golem', { cls: 'warrior' }, r);
      const it = res.equipment[0];
      if (it?.r === 'L') { L++; own[ITEMS[it.tid].cls]++; maxDry = Math.max(maxDry, dry); dry = 0; } else dry++;
      if (it?.r === 'R') R++;
      if (it?.r === 'E') E++;
    }
    expect(Math.abs(L / n - 0.004)).toBeLessThan(tol(0.004, n));
    expect(Math.abs(R / n - 0.28)).toBeLessThan(tol(0.28, n));
    expect(Math.abs(E / n - 0.06)).toBeLessThan(tol(0.06, n));
    // %80 mevcut sınıf ağırlığı
    expect(Math.abs(own.warrior / L - 0.8)).toBeLessThan(0.03);
    // pity olmadığının göstergesi: 1000+ kesimlik kuraklıklar oluşur (geometrik dağılım)
    expect(maxDry).toBeGreaterThan(1000);
    console.log('Golem 1M: L', L, 'R', R, 'E', E, 'sınıf', own, 'en uzun kuraklık', maxDry);
  });
  // V4: kaynak sayısı arttı (~55 sn); her kaynaktan sonra olay döngüsüne dönülür (vitest işçi RPC zaman aşımı olmasın)
  it('Golem, Donmuş Muhafız, Kayıp Kral ve Göğün Mahkûmu dışındaki hiçbir kaynaktan Legendary çıkmaz (her kaynak 100.000)', async () => {
    const CLS = ['warrior', 'mage', 'archer', 'necromancer'];
    for (const e of sources) {
      if (['mine_golem', 'frozen_guardian', 'lost_king', 'sky_prisoner'].includes(e.id)) continue;
      const r = new Rng(e.id.length * 977);
      for (let i = 0; i < 100000; i++) {
        const res = rollKillLoot(e.id, { cls: CLS[i % 4] }, r);
        for (const it of res.equipment) expect(it.r).not.toBe('L');
      }
      expect(buildPool(e.id, 'L').length).toBe(0);
      await new Promise((r) => setTimeout(r, 0));
    }
  });
  it('legendary varyant üretilemez, havuzlar boş değil ve seviye-uygun', () => {
    expect(() => createItem('W01', 'L', new Rng(1))).toThrow();
    for (const e of sources) {
      const t = LOOT_TABLES[e.lootTable];
      for (const rar of ['N', 'U', 'R', 'E', 'L']) {
        if (!t[rar]) continue;
        const pool = buildPool(e.id, rar);
        expect(pool.length, `${e.id} ${rar}`).toBeGreaterThan(0);
        for (const p of pool) {
          const tpl = ITEMS[p.tid];
          if (!p.canonical) expect(tpl.lv, `${e.id} ${p.tid}`).toBeLessThanOrEqual(e.level + (e.variantAbove ?? 1));
          expect(tpl.allowedRarities.includes(rar)).toBe(true);
        }
      }
    }
  });
  it('rastgele bonuslar: nadirliğe göre sayı, tekrar yok, sınıf/slot uygun, aralık içinde', () => {
    const r = new Rng(21);
    for (let i = 0; i < 20000; i++) {
      const t = ITEM_LIST[i % 60];
      for (const rar of t.allowedRarities) {
        if (rar === 'L') { expect(rollBonuses(t, rar, r)).toEqual([]); continue; }
        const b = rollBonuses(t, rar, r);
        expect(b.length).toBe({ N: 0, U: 1, R: 2, E: 3 }[rar]);
        expect(new Set(b.map((x) => x.t)).size).toBe(b.length);
        const cands = bonusCandidates(t);
        for (const x of b) {
          expect(cands.includes(x.t)).toBe(true);
          const [lo, hi] = BONUS_TYPES[x.t][rar];
          const v = BONUS_TYPES[x.t].fmt === 'pct' ? Math.round(x.v * 100) : x.v;
          expect(v).toBeGreaterThanOrEqual(lo); expect(v).toBeLessThanOrEqual(hi);
          if (t.cls === 'warrior') expect(x.t).not.toBe('int');
          if (t.cls === 'mage') expect(x.t).not.toBe('str');
        }
      }
    }
  });
  it('aynı eşyanın iki örneği bağımsız', () => {
    const r = new Rng(5);
    const a = createItem('W03', 'R', r), b = createItem('W03', 'R', r);
    expect(a.uid).not.toBe(b.uid);
  });
  it('normal yaratık: gold garantili, materyal %28 bağımsız', () => {
    const r = new Rng(9); let mat = 0; const n = 100000;
    for (let i = 0; i < n; i++) {
      const res = rollKillLoot('cave_bat', { cls: 'mage' }, r);
      expect(res.gold).toBeGreaterThanOrEqual(7);
      if (res.stacks.some((s) => s.id === 'bat_wing')) mat++;
    }
    expect(Math.abs(mat / n - 0.28)).toBeLessThan(tol(0.28, n));
  });
  it('boss garantili materyaller ve Kadim Çekirdek %25', () => {
    const r = new Rng(10); let core = 0; const n = 100000;
    for (let i = 0; i < n; i++) {
      const res = rollKillLoot('mine_golem', { cls: 'mage' }, r);
      expect(res.stacks.some((s) => s.id === 'golem_shard')).toBe(true);
      if (res.stacks.some((s) => s.id === 'ancient_core')) core++;
    }
    expect(Math.abs(core / n - 0.25)).toBeLessThan(tol(0.25, n));
    const a = rollKillLoot('alpha_wolf', { cls: 'mage' }, r);
    expect(a.stacks.some((s) => s.id === 'alpha_claw')).toBe(true);
  });
  it('sunak ödülleri Legendary içermez', () => {
    const r = new Rng(3);
    for (let i = 0; i < 10000; i++) for (const o of rollAltar(0.4, r)) expect(['altar_dust', 'altar_crystal']).toContain(o.id);
  });
});
