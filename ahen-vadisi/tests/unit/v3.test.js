// V3.0 (Kayıp Krallığın Mirası) birim testleri: kayıt geçişi (şema 2 → 3), seviye 31–40.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { Rng } from '../../src/core/rng.js';
import { MAX_LEVEL, SCHEMA_VERSION, cumulativeXp, xpToNext, STAT_POINTS_PER_LEVEL } from '../../src/data/constants.js';
import { createItem } from '../../src/systems/loot.js';
import { createCharacter, gainExp, statPointsFree, skillPointsTotal } from '../../src/systems/character.js';
import { computeStats } from '../../src/systems/stats.js';
import { newProfile, wrap, unwrap, validateProfile } from '../../src/save/serialize.js';
import { SaveRepository } from '../../src/save/repository.js';

const rng = new Rng(3030);
const mk = (cls = 'warrior', name = 'Krallik') => createCharacter({ name, cls, slot: 0 }, rng);

// V2 biçiminde (şema 2) Lv.30 karakterli kayıt zarfı: V3 alanları yok
export function v2Envelope() {
  const p = newProfile();
  const c = mk('warrior', 'Eskisavasci');
  gainExp(c, cumulativeXp(30));
  c.gold = 98765;
  c.equipment.weapon = createItem('W13', 'L', rng);
  c.equipment.weapon.p = 4;
  c.alloc = { str: 60, dex: 10, int: 0, vit: 17 };
  c.skillBar = ['heavy_strike', 'blade_rain', 'iron_skin', 'war_charge'];
  for (const id of ['m18', 'm36', 's09', 'c20']) c.quests[id] = { s: 'done', p: [], used: [] };
  c.quests.s11 = { s: 'active', p: [5, 2], used: [], at: 1 };
  c.mastery = true;
  c.masteryBooks = { heavy_strike: true };
  c.world.flags.unlocked_frost_temple = true;
  c.runs = { frost_temple: { runId: 'run_x', cleared: [1, 2], seals: ['seal_a'], bossLootClaimed: false, bossKilled: false, finished: false } };
  c.record.bossKills = { frozen_guardian: 3 };
  for (const k of ['tracking', 'mastery2', 'effects']) delete c[k];
  c.v = 2;
  p.characters[0] = c;
  p.schemaVersion = 2;
  const env = wrap(p);
  env.schemaVersion = 2;
  return { env, c };
}

describe('V3 kayıt geçişi', () => {
  it('şema 3; Lv.30 V2 karakteri hiçbir veri kaybetmeden açılır, V3 alanları eklenir', () => {
    expect(SCHEMA_VERSION).toBe(3);
    const { env, c } = v2Envelope();
    const r = unwrap(env);
    expect(r.ok, r.msg).toBe(true);
    const m = r.profile.characters[0];
    expect(m.level).toBe(30); expect(m.exp).toBe(c.exp); expect(m.gold).toBe(98765);
    expect(m.alloc).toEqual(c.alloc);
    expect(m.skillBar).toEqual(c.skillBar);
    expect(m.equipment.weapon).toMatchObject({ tid: 'W13', r: 'L', p: 4 });
    expect(m.quests.m36.s).toBe('done');
    expect(m.quests.s11).toEqual(c.quests.s11);
    expect(m.masteryBooks).toEqual({ heavy_strike: true });
    expect(m.runs).toEqual(c.runs);
    expect(m.record.bossKills).toEqual({ frozen_guardian: 3 });
    expect(m.world.flags.unlocked_frost_temple).toBe(true);
    expect(m.tracking).toEqual([]);
    expect(m.mastery2).toBe(false);
    expect(m.effects).toEqual({});
    // yeni görevler otomatik tamamlanmış sayılmaz
    expect(Object.keys(m.quests).sort()).toEqual(Object.keys(c.quests).sort());
    expect(validateProfile(r.profile).ok).toBe(true);
    expect(computeStats(m).legendaryEffect).toBe('frost_verdict');
  });
  it('depo: V2 kaydı ilk açılışta v2_backup olarak bir kez saklanır; yedekten geri dönülebilir', async () => {
    const repo = new SaveRepository();
    const { env } = v2Envelope();
    await repo.writeRaw('profile', env);
    const r = await repo.load();
    expect(r.migratedFrom).toBe(2);
    const bk = await repo.readRaw('v2_backup');
    expect(bk.schemaVersion).toBe(2);
    await repo.save(r.profile);
    expect((await repo.load()).migratedFrom).toBeUndefined();
    expect((await repo.readRaw('v2_backup')).savedAt).toBe(bk.savedAt);
    const snaps = await repo.listSnapshots();
    expect(snaps.some((s) => s.key === 'v2_backup' && s.ok)).toBe(true);
    const back = await repo.restoreSnapshot('v2_backup');
    expect(back.ok).toBe(true);
    expect(back.profile.characters[0].level).toBe(30);
  });
});

describe('V3 seviye 31–40', () => {
  it('30→40 EXP tablosu belge değerleri, toplam 1.006.820', () => {
    const want = [64880, 71580, 78720, 86330, 94410, 102980, 112050, 121650, 131770, 142450];
    expect([30, 31, 32, 33, 34, 35, 36, 37, 38, 39].map(xpToNext)).toEqual(want);
    expect(want.reduce((a, b) => a + b, 0)).toBe(1006820);
    expect(cumulativeXp(40) - cumulativeXp(30)).toBe(1006820);
    expect(xpToNext(40)).toBe(Infinity);
    expect(MAX_LEVEL).toBe(40);
  });
  it('kayıtlı Lv.30 karakter 31\'e ilerler; 39→40 geçişi ve Lv.40 sınırı; her seviyede +3 stat / +1 beceri', () => {
    const m = unwrap(v2Envelope().env).profile.characters[0];
    const hp30 = computeStats(m).maxHp;
    gainExp(m, xpToNext(30) - 1);
    expect(m.level).toBe(30);
    gainExp(m, 1);
    expect(m.level).toBe(31);
    expect(computeStats(m).maxHp).toBeGreaterThan(hp30);
    gainExp(m, cumulativeXp(39) - cumulativeXp(31));
    expect(m.level).toBe(39);
    gainExp(m, xpToNext(39));
    expect(m.level).toBe(40);
    expect(m.exp).toBe(0);
    expect(gainExp(m, 500000).gained).toBe(0);
    expect(m.level).toBe(40);
    expect(statPointsFree(m)).toBe(STAT_POINTS_PER_LEVEL * 39 - 87);
    expect(skillPointsTotal(m)).toBe(39 + (m.bonusSkillPoints || 0));
  });
});
