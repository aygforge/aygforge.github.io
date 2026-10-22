// V2.0 (Kül ve Ayaz) birim testleri: kayıt geçişi, seviye 21–30, haritalar, loot kuralları,
// Buz Mabedi koşu durumu, beceri çubuğu, Ustalık Kitabı, yükseltme maliyetleri, Av Geçmişi.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { Rng } from '../../src/core/rng.js';
import { MAPS } from '../../src/data/maps/index.js';
import { buildMap, bfs } from '../../src/world/mapBuilder.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { ITEMS, ITEM_LIST } from '../../src/data/items.js';
import { LOOT_TABLES } from '../../src/data/loot.js';
import { RECIPES } from '../../src/data/recipes.js';
import { SKILLS, CLASS_SKILLS } from '../../src/data/skills.js';
import { MAX_LEVEL, SCHEMA_VERSION, cumulativeXp, xpToNext, STAT_POINTS_PER_LEVEL } from '../../src/data/constants.js';
import { rollKillLoot, buildPool, createItem } from '../../src/systems/loot.js';
import { createCharacter, gainExp, setSkillBar, applyMasteryBook, canApplyMasteryBook, statPointsFree, skillPointsTotal, resetSkills } from '../../src/systems/character.js';
import { computeStats } from '../../src/systems/stats.js';
import { applyKill } from '../../src/systems/rewards.js';
import * as dg from '../../src/systems/dungeon.js';
import * as qs from '../../src/systems/quests.js';
import { upgradeInfo, upgrade, craft } from '../../src/systems/economy.js';
import { addStack, countStack } from '../../src/systems/inventory.js';
import { newProfile, wrap, unwrap, migrate, validateProfile } from '../../src/save/serialize.js';
import { SaveRepository } from '../../src/save/repository.js';

const rng = new Rng(2024);
const mk = (cls = 'warrior', name = 'Ayazcı') => createCharacter({ name, cls, slot: 0 }, rng);

// V1 biçiminde (şema 1) bir kayıt zarfı üret: V2 alanları yok
function v1Envelope() {
  const p = newProfile();
  const c = mk('mage', 'Eskimage');
  gainExp(c, cumulativeXp(20));
  c.gold = 4321;
  c.equipment.weapon = createItem('M08', 'L', rng);
  c.equipment.weapon.p = 3;
  c.quests.m18 = { s: 'done', p: [], used: [] };
  for (const k of ['skillBar', 'history', 'runs', 'masteryBooks']) delete c[k];
  delete c.world.flags; delete c.world.chests;
  c.v = 1;
  p.characters[1] = c;
  p.schemaVersion = 1;
  const env = wrap(p);
  env.schemaVersion = 1;
  return { env, c };
}

describe('V2 kayıt geçişi', () => {
  it('V1 zarfı (şema 1) güncel şemaya açılır, hiçbir V1 verisi değişmez, V2 alanları eklenir', () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(3);   // V4: şema 4 (V1 zarfı doğrudan güncel şemaya açılır)
    const { env, c } = v1Envelope();
    const r = unwrap(env);
    expect(r.ok, r.msg).toBe(true);
    const m = r.profile.characters[1];
    expect(m.level).toBe(20); expect(m.gold).toBe(4321); expect(m.name).toBe(c.name);
    expect(m.equipment.weapon).toMatchObject({ tid: 'M08', r: 'L', p: 3 });
    expect(m.quests.m18.s).toBe('done');
    expect(m.skillBar).toEqual(CLASS_SKILLS.mage.actives.slice(0, 4));
    expect(m.history).toMatchObject({ fromV1: true, kills: 0 });
    expect(m.runs).toEqual({}); expect(m.masteryBooks).toEqual({});
    expect(r.profile.schemaVersion).toBe(SCHEMA_VERSION);
    expect(validateProfile(r.profile).ok).toBe(true);
    // V1 legendary etkisi ve değerleri aynı
    expect(computeStats(m).legendaryEffect).toBe('spirit_echo');
  });
  it('daha yeni sürüm kaydı reddedilir; geçiş tekrarlanabilir (idempotent)', () => {
    expect(migrate(newProfile(), SCHEMA_VERSION + 1).ok).toBe(false);
    const { env } = v1Envelope();
    const a = unwrap(env).profile;
    const b = migrate(JSON.parse(JSON.stringify(a)), SCHEMA_VERSION).profile;
    expect(b.characters[1]).toEqual(a.characters[1]);
  });
  it('depo: eski sürüm ilk açılışta v1_backup olarak bir kez saklanır', async () => {
    const repo = new SaveRepository();
    const { env } = v1Envelope();
    await repo.writeRaw('profile', env);
    const r = await repo.load();
    expect(r.migratedFrom).toBe(1);
    const bk = await repo.readRaw('v1_backup');
    expect(bk.schemaVersion).toBe(1);
    expect(unwrap(bk).ok).toBe(true);
    await repo.save(r.profile);
    const again = await repo.load();
    expect(again.migratedFrom).toBeUndefined();
    expect((await repo.readRaw('v1_backup')).savedAt).toBe(bk.savedAt);
  });
});

describe('V2 seviye 21–30', () => {
  it('20→21 ve 29→30 geçişi; Lv.20 sınırında biriken EXP geriye dönük verilmez (V3: Lv.30 artık sınır değil)', () => {
    const c = mk();
    gainExp(c, cumulativeXp(20));
    expect(c.level).toBe(20);
    expect(c.exp).toBe(0);
    gainExp(c, xpToNext(20) - 1);
    expect(c.level).toBe(20);
    gainExp(c, 1);
    expect(c.level).toBe(21);
    gainExp(c, cumulativeXp(30) - cumulativeXp(21));
    expect(c.level).toBe(30);
    expect(c.exp).toBe(0);
    expect(MAX_LEVEL).toBeGreaterThanOrEqual(40);       // V4: 50
    expect(statPointsFree(c)).toBe(STAT_POINTS_PER_LEVEL * 29);
    expect(skillPointsTotal(c)).toBe(29);
  });
  it('her seviyede HP/MP artar; Lv.25 becerisi açılır', () => {
    for (const cls of ['warrior', 'mage']) {
      const c = mk(cls);
      gainExp(c, cumulativeXp(24));
      const hp24 = computeStats(c).maxHp, mp24 = computeStats(c).maxMp;
      expect(c.skills[CLASS_SKILLS[cls].actives[4]]).toBeUndefined();
      gainExp(c, xpToNext(24));
      expect(c.level).toBe(25);
      expect(computeStats(c).maxHp).toBeGreaterThan(hp24);
      expect(computeStats(c).maxMp).toBeGreaterThan(mp24);
      expect(c.skills[CLASS_SKILLS[cls].actives[4]]).toBe(1);
    }
  });
});

describe('V2 haritalar', () => {
  const built = Object.fromEntries(['ash', 'frost', 'frost_temple', 'mine'].map((k) => [k, buildMap(MAPS[k])]));
  it('belge ölçüleri: Kül Yaylaları 112×80, Ayaz Geçidi 116×88', () => {
    expect([built.ash.w, built.ash.h]).toEqual([112, 80]);
    expect([built.frost.w, built.frost.h]).toEqual([116, 88]);
  });
  it('4 farm kampı, 1 elit, boss arenası, Yol Taşı, güvenli kamp, 2 gizli sandık, toplama düğümleri', () => {
    const want = { ash: ['ash_imp', 'ash_hunter', 'crimson_scorpion', 'burnt_warrior'], frost: ['frost_wolf', 'ice_wisp', 'frost_sentinel', 'snow_shaman'] };
    for (const [k, list] of Object.entries(want)) {
      const d = MAPS[k];
      const camps = d.areas.filter((a) => a.camp);
      expect(camps.map((a) => a.spawns[0].enemy).sort()).toEqual([...list].sort());
      for (const c of camps) expect(built[k].areaCells[c.id].length).toBeGreaterThan(150);
      expect(d.areas.filter((a) => a.elite).length).toBe(1);
      expect(d.areas.some((a) => a.safePocket)).toBe(true);
      expect(d.objects.filter((o) => o.type === 'chest').length).toBe(2);
      expect(d.objects.some((o) => o.type === 'waystone')).toBe(true);
      expect(d.objects.filter((o) => o.type === 'gather').length).toBeGreaterThanOrEqual(10);
      expect(d.objects.filter((o) => o.type === 'npc').length).toBeGreaterThanOrEqual(2);
    }
    expect(MAPS.ash.areas.find((a) => a.boss)?.boss).toBe('ash_giant');
    expect(MAPS.ash.areas.find((a) => a.elite).elite).toBe('ash_butcher');
    expect(MAPS.frost.areas.find((a) => a.elite).elite).toBe('ice_warden');
  });
  it('gerçek geçitler: Maden ↔ Kül Yaylaları ↔ Ayaz Geçidi ↔ Buz Mabedi; hikâye kilitleri', () => {
    const link = (a, b) => MAPS[a].objects.find((o) => o.to === b);
    for (const [a, b] of [['mine', 'ash'], ['ash', 'mine'], ['ash', 'frost'], ['frost', 'ash'], ['frost', 'frost_temple'], ['frost_temple', 'frost']]) expect(link(a, b), `${a}→${b}`).toBeTruthy();
    expect(link('mine', 'ash').requires.quest).toBe('m27');
    expect(link('ash', 'frost').requires.quest).toBe('m33');
    expect(link('frost', 'frost_temple').type).toBe('dungeon_gate');
  });
  it('Buz Mabedi: 4 bölüm, 3 mühür galeride, kapılar koridorları kapatır', () => {
    const d = MAPS.frost_temple, m = built.frost_temple;
    expect(Object.keys(d.stages).length).toBe(4);
    expect(d.seals.length).toBe(3);
    expect(d.boss).toBe('frozen_guardian');
    for (const g of d.gates) {
      const solid = new Uint8Array(m.solid);
      for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) solid[y * m.w + x] = 1;
      const reach = bfs(solid, m.w, m.h, d.entries.entrance.x, d.entries.entrance.y);
      expect(reach[d.bossSpawn.y * m.w + d.bossSpawn.x], g.id).toBe(0);
    }
    const st3 = d.areas.find((a) => a.stage === 3);
    for (const s of d.seals) expect(Math.hypot(s.x - st3.x, s.y - st3.y)).toBeLessThanOrEqual(st3.r);
  });
});

describe('V2 loot kuralları', () => {
  it('Donmuş Muhafız: 1.000.000 kesimde Legendary toplam %0,4; %80 mevcut sınıf; pity yok', () => {
    const n = 1000000, r = new Rng(77);
    let L = 0, R = 0, E = 0, own = 0, dry = 0, maxDry = 0;
    for (let i = 0; i < n; i++) {
      const it = rollKillLoot('frozen_guardian', { cls: 'mage' }, r).equipment[0];
      if (it?.r === 'L') { L++; if (ITEMS[it.tid].cls === 'mage') own++; maxDry = Math.max(maxDry, dry); dry = 0; } else dry++;
      if (it?.r === 'R') R++;
      if (it?.r === 'E') E++;
    }
    const tol = (p) => 4 * Math.sqrt(p * (1 - p) / n);
    expect(Math.abs(L / n - 0.004)).toBeLessThan(tol(0.004));
    expect(Math.abs(R / n - 0.30)).toBeLessThan(tol(0.30));
    expect(Math.abs(E / n - 0.07)).toBeLessThan(tol(0.07));
    expect(Math.abs(own / L - 0.8)).toBeLessThan(0.03);
    expect(maxDry).toBeGreaterThan(1000);
    console.log('Donmuş Muhafız 1M: L', L, 'R', R, 'E', E, 'kendi sınıf', own, 'en uzun kuraklık', maxDry);
  });
  it('Kül Devi: Rare %22, Epic %2, Legendary hiç (300.000)', () => {
    const n = 300000, r = new Rng(78);
    const c = { R: 0, E: 0, L: 0 };
    for (let i = 0; i < n; i++) { const it = rollKillLoot('ash_giant', { cls: 'warrior' }, r).equipment[0]; if (it) c[it.r]++; }
    expect(c.L).toBe(0);
    expect(Math.abs(c.R / n - 0.22)).toBeLessThan(0.005);
    expect(Math.abs(c.E / n - 0.02)).toBeLessThan(0.002);
    expect(buildPool('ash_giant', 'L').length).toBe(0);
  });
  it('V2 elitleri: Epic %0,75, Legendary yok', () => {
    for (const id of ['ash_butcher', 'ice_warden']) {
      expect(ENEMIES[id].lootTable).toBe('elite');
      expect(buildPool(id, 'L').length).toBe(0);
      expect(buildPool(id, 'E').length).toBeGreaterThan(0);
    }
    expect(LOOT_TABLES.elite.E).toBe(0.75);
  });
  it('30 V2 eşyasının her biri bir kaynaktan elde edilebilir; boss kaynakları belgeyle aynı', () => {
    const sources = Object.values(ENEMIES).filter((e) => e.lootTable);
    const obtainable = new Set(RECIPES.filter((r) => r.out.equip).map((r) => r.out.id));
    for (const e of sources) for (const rar of ['N', 'U', 'R', 'E', 'L']) if (LOOT_TABLES[e.lootTable][rar]) for (const p of buildPool(e.id, rar)) obtainable.add(p.tid);
    const v2 = ITEM_LIST.filter((t) => t.lv > 20);
    for (const t of v2) expect(obtainable.has(t.id), `${t.id} ${t.name}`).toBe(true);
    // V4: yeni sınıf eşyaları (Y/K/…) havuzlara eklendi; eski şablonların havuzdaki yeri aynen korunur
    const OLD = new Set(ITEM_LIST.slice(0, 126).map((t) => t.id));
    const canon = (enemy, rar) => buildPool(enemy, rar).filter((p) => p.canonical && OLD.has(p.tid)).map((p) => p.tid).sort();
    expect(canon('ash_giant', 'E')).toEqual(['A07', 'M11', 'W11']);
    expect(canon('ice_warden', 'E')).toEqual(['C10', 'C12', 'O08', 'O10', 'R08']);
    expect(canon('frozen_guardian', 'L')).toEqual(['M13', 'W13']);
    expect(canon('frozen_guardian', 'E')).toEqual(['A08']);
  });
  it('V1 korunur: Golem Legendary/Rare havuzu V2 eşyası içermez; Legendary yalnız boss tablolarında (V3: + Kayıp Kral)', () => {
    // V4: Golem Legendary havuzu dört sınıfın birer silahı (eski W08/M08 aynen)
    expect(buildPool('mine_golem', 'L').map((p) => p.tid).sort()).toEqual(['K11', 'M08', 'W08', 'Y11']);
    for (const p of buildPool('mine_golem', 'R')) expect(ITEMS[p.tid].lv).toBeLessThanOrEqual(20);
    for (const e of Object.values(ENEMIES).filter((x) => x.lootTable)) {
      if (['mine_golem', 'frozen_guardian', 'lost_king', 'sky_prisoner'].includes(e.id)) continue;
      expect(buildPool(e.id, 'L').length, e.id).toBe(0);
    }
    // hiçbir tarif Legendary üretmez
    for (const r of RECIPES) if (ITEMS[r.out.id]) expect(ITEMS[r.out.id].rarity).not.toBe('L');
  });
  it('Av Geçmişi sayaçları ganimet şansını değiştirmez (aynı tohum = aynı sonuç)', () => {
    const a = mk(), b = mk();
    b.history.kills = 99999; b.history.bossKills.frozen_guardian = 5000; b.history.found.L = 20;
    const ra = new Rng(5), rb = new Rng(5);
    for (let i = 0; i < 300; i++) {
      const x = applyKill(a, 'frozen_guardian', { killId: 'a' + i, unique: true }, ra);
      const y = applyKill(b, 'frozen_guardian', { killId: 'b' + i, unique: true }, rb);
      expect([...x.items, ...x.pending].map((t) => t.tid + t.r)).toEqual([...y.items, ...y.pending].map((t) => t.tid + t.r));
    }
    expect(a.history.kills).toBe(300);
    expect(a.history.bossKills.frozen_guardian).toBe(300);
  });
});

describe('V2 Buz Mabedi koşusu', () => {
  it('koşu ayrı tutulur; mühür bir kez sayılır; ölüm noktaları; tek boss ödülü', () => {
    const c = mk();
    expect(dg.canEnterDungeon(c, 'frost_temple').ok).toBe(false);
    dg.unlockDungeon(c, 'frost_temple');
    expect(dg.canEnterDungeon(c, 'frost_temple').ok).toBe(true);
    expect(dg.canEnterDungeon(c, 'dungeon').ok).toBe(false); // V1 zindan kilidi ayrı
    const { run } = dg.startOrResumeRun(c, 'frost_temple');
    expect(c.dungeon).toBeNull();
    expect(run.seals).toEqual([]);
    expect(dg.breakSeal(c, 'frost_temple', 'seal_a')).toBe(true);
    expect(dg.breakSeal(c, 'frost_temple', 'seal_a')).toBe(false);
    expect(dg.sealsBroken(c, 'frost_temple')).toBe(1);
    dg.clearStage(c, 1, 'frost_temple'); dg.clearStage(c, 2, 'frost_temple');
    expect(dg.respawnEntry(c, 'frost_temple')).toBe('cp2');
    dg.clearStage(c, 3, 'frost_temple');
    expect(dg.respawnEntry(c, 'frost_temple')).toBe('checkpoint');
    expect(dg.startOrResumeRun(c, 'frost_temple').resumed).toBe(true);
    expect(dg.bossKillId(c, 'frost_temple')).toBe(`frozen_guardian:${run.runId}`);
    expect(dg.claimBossLoot(c, 'frost_temple')).toBe(true);
    expect(dg.claimBossLoot(c, 'frost_temple')).toBe(false);
    dg.exitRun(c, 'frost_temple');
    expect(dg.getRun(c, 'frost_temple')).toBeNull();
    const again = dg.startOrResumeRun(c, 'frost_temple');
    expect(again.resumed).toBe(false);
    expect(again.run.runId).not.toBe(run.runId);
  });
  it('"Buz Mabedinin Sırrı" kapı mührünü açar; zindan bölüm hedefi zindana göre sayılır', () => {
    const c = mk();
    gainExp(c, cumulativeXp(27));
    c.quests.m35 = { s: 'active', p: [0, 0], used: [] };
    qs.onInteract(c, 'frost_gate', 'frost_gate');
    expect(c.quests.m35.p[1]).toBe(0); // önce şamanlar
    for (let i = 0; i < 6; i++) qs.onKill(c, 'snow_shaman', rng);
    qs.onInteract(c, 'frost_gate', 'frost_gate');
    expect(c.quests.m35.p[1]).toBe(1);
    expect(dg.isDungeonUnlocked(c, 'frost_temple')).toBe(true);
    expect(c.world.dungeonUnlocked).toBe(false);
  });
});

describe('V2 beceriler', () => {
  it('Lv.25 becerileri belge değerleri', () => {
    expect(SKILLS.blade_rain).toMatchObject({ unlock: 25, maxTargets: 5, cls: 'warrior' });
    expect(SKILLS.blade_rain.coef[0]).toBe(1.45); expect(SKILLS.blade_rain.cd[0]).toBe(18); expect(SKILLS.blade_rain.mp[0]).toBe(30);
    expect(SKILLS.chain_lightning).toMatchObject({ unlock: 25, jumps: 3, cls: 'mage' });
    expect(SKILLS.chain_lightning.coef[0]).toBe(1.65); expect(SKILLS.chain_lightning.cd[0]).toBe(16); expect(SKILLS.chain_lightning.mp[0]).toBe(42);
  });
  it('beceri çubuğu: 4 yuva, açılmamış beceri konamaz, yer değiştirme, kayıtta kalır', () => {
    const c = mk();
    expect(c.skillBar).toEqual(CLASS_SKILLS.warrior.actives.slice(0, 4));
    expect(setSkillBar(c, 0, 'blade_rain').ok).toBe(false);
    gainExp(c, cumulativeXp(25));
    expect(setSkillBar(c, 3, 'blade_rain').ok).toBe(true);
    expect(c.skillBar).toEqual(['heavy_strike', 'whirlwind', 'iron_skin', 'blade_rain']);
    expect(setSkillBar(c, 0, 'blade_rain').ok).toBe(true); // yer değiştirir
    expect(c.skillBar).toEqual(['blade_rain', 'whirlwind', 'iron_skin', 'heavy_strike']);
    expect(setSkillBar(c, 4, 'whirlwind').ok).toBe(false);
    expect(setSkillBar(c, 1, 'fireball').ok).toBe(false);
    const p = newProfile(); p.characters[0] = c;
    const back = unwrap(wrap(p));
    expect(back.ok).toBe(true);
    expect(back.profile.characters[0].skillBar).toEqual(c.skillBar);
  });
  it('Ustalık Kitabı: Lv.30 + Rank 5 + kitap; her beceriye bir kez; sıfırlamada kalır', () => {
    const c = mk();
    gainExp(c, cumulativeXp(29));
    c.skills.heavy_strike = 5;
    addStack(c.bag, 'mastery_book', 2);
    expect(canApplyMasteryBook(c, 'heavy_strike').ok).toBe(false); // Lv.29
    gainExp(c, xpToNext(29));
    c.skills.whirlwind = 4;
    expect(canApplyMasteryBook(c, 'whirlwind').ok).toBe(false); // rank 4
    expect(applyMasteryBook(c, 'heavy_strike').ok).toBe(true);
    expect(applyMasteryBook(c, 'heavy_strike').ok).toBe(false);
    expect(countStack(c.bag, 'mastery_book')).toBe(1);
    c.gold = 99999;
    resetSkills(c);
    expect(c.masteryBooks.heavy_strike).toBe(true);
  });
});

describe('V2 ekonomi', () => {
  it('Lv.21+ eşyalar: aynı başarı oranları, daha yüksek maliyet, V1 materyalleri kullanılmaya devam', () => {
    const w06 = createItem('W06', 'R', rng), w10 = createItem('W10', 'R', rng);
    for (let p = 0; p < 5; p++) {
      w06.p = p; w10.p = p;
      const a = upgradeInfo(w06), b = upgradeInfo(w10);
      expect(b.chance).toBe(a.chance);
      expect(b.gold).toBeGreaterThan(a.gold);
    }
    w10.p = 2; expect(upgradeInfo(w10).mats.map((m) => m.id)).toContain('hardening_stone');
    w10.p = 3; expect(upgradeInfo(w10).mats.map((m) => m.id)).toContain('altar_crystal');
    w10.p = 4; expect(upgradeInfo(w10).mats.map((m) => m.id)).toEqual(['ember_core']);
    expect(RECIPES.find((r) => r.out.id === 'ember_core').inputs.map((i) => i.id)).toContain('ancient_core');
  });
  it('başarısız yükseltme eşyayı kırmaz/düşürmez; +5 sınırı', () => {
    const c = mk();
    gainExp(c, cumulativeXp(25));
    c.equipment.weapon = createItem('W10', 'R', rng);
    c.gold = 10_000_000;
    addStack(c.bag, 'ash_steel', 50); addStack(c.bag, 'hardening_stone', 20); addStack(c.bag, 'frost_essence', 40); addStack(c.bag, 'altar_crystal', 20); addStack(c.bag, 'ember_core', 20);
    const r = new Rng(1);
    let prev = 0;
    for (let i = 0; i < 60 && c.equipment.weapon.p < 5; i++) {
      const res = upgrade(c, { where: 'equip', slot: 'weapon' }, r);
      expect(res.ok).toBe(true);
      expect(c.equipment.weapon.p).toBeGreaterThanOrEqual(prev);
      prev = c.equipment.weapon.p;
    }
    expect(c.equipment.weapon.p).toBe(5);
    expect(upgrade(c, { where: 'equip', slot: 'weapon' }, r).ok).toBe(false);
  });
  it('V2 tarifleri çalışır ve V1 materyallerini de tüketir', () => {
    const c = mk();
    gainExp(c, cumulativeXp(27));
    c.gold = 1_000_000;
    for (const id of ['warden_seal', 'ice_armor_shard', 'golem_shard', 'frost_essence']) addStack(c.bag, id, 40);
    const before = countStack(c.bag, 'golem_shard');
    const res = craft(c, 'r_o08', rng);
    expect(res.ok, res.msg).toBe(true);
    expect(countStack(c.bag, 'golem_shard')).toBe(before - 4);
    expect(c.bag.slots.some((s) => s?.tid === 'O08')).toBe(true);
  });
});
