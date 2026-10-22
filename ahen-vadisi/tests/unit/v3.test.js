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
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(3);   // V4: şema 4
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
    expect(xpToNext(40)).toBe(153680);                 // V4: sınır 50 (aynı kübik formül)
    expect(MAX_LEVEL).toBe(50);
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
    // V4: Lv.40 artık sınır değil; seviye ilerlemesi ve puanlar aynı kurala uyar
    expect(statPointsFree(m)).toBe(STAT_POINTS_PER_LEVEL * 39 - 87);
    expect(skillPointsTotal(m)).toBe(39 + (m.bonusSkillPoints || 0));
  });
});

// ------------------------------------------------------------------ V3 içerik doğrulama
import { QUESTS, CLASS_QUESTS, QUEST_MAP } from '../../src/data/quests.js';
import { ITEM_LIST, ITEMS } from '../../src/data/items.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { NPCS } from '../../src/data/npcs.js';
import { RECIPES } from '../../src/data/recipes.js';
import { MAPS, WAYSTONES } from '../../src/data/maps/index.js';
import { LOOT_TABLES } from '../../src/data/loot.js';
import { USABLE_LIST, STACKABLES } from '../../src/data/materials.js';
import { SKILLS, CLASS_SKILLS } from '../../src/data/skills.js';
import { DUNGEON_INFO } from '../../src/systems/dungeon.js';
import { buildPool, rollKillLoot } from '../../src/systems/loot.js';
import { buildMap } from '../../src/world/mapBuilder.js';
import { addStack } from '../../src/systems/inventory.js';
import { upgradeInfo, upgrade } from '../../src/systems/economy.js';
import { setSkillBar } from '../../src/systems/character.js';
import * as qs from '../../src/systems/quests.js';

const V3_ITEMS = ['W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19', 'O11', 'O12', 'O13', 'O14', 'H11', 'H12', 'H13', 'H14',
  'C13', 'C14', 'C15', 'C16', 'G09', 'G10', 'B09', 'B10', 'R09', 'R10', 'R11', 'R12', 'A09', 'A10', 'A11', 'A12'];
const EARLY = Array.from({ length: 24 }, (_, i) => `s${13 + i}`);
const V3_MAIN = ['m37', 'm38', 'm39', 'm40', 'm41', 'm42', 'm43', 'm44', 'm45', 'm46'];
const V3_SIDE = ['s37', 's38', 's39', 's40', 's41', 's42'];

describe('V3 içerik', () => {
  it('80 tek seferlik ana/yan görev; V3 ana 212.000, V3 yan 39.000, erken yan 44.260 EXP; görevler ekipman vermez', () => {
    expect(QUESTS.length).toBe(80);
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(80);
    const sum = (ids) => ids.reduce((a, id) => a + QUEST_MAP[id].exp, 0);
    expect(sum(V3_MAIN)).toBe(212000);
    expect(sum(V3_SIDE)).toBe(39000);
    expect(sum(EARLY)).toBe(44260);
    for (const q of [...QUESTS, ...CLASS_QUESTS]) {
      expect(q.repeatable).toBe(false);
      for (const r of q.rewardItems) expect(ITEMS[r.id], `${q.id} ekipman ödülü`).toBeUndefined();
      for (const r of q.rewardItems) expect(STACKABLES[r.id], `${q.id} ${r.id}`).toBeTruthy();
      expect(NPCS[q.giver], q.id).toBeTruthy(); expect(NPCS[q.turnIn], q.id).toBeTruthy();
    }
    // V3 hikâye NPC'leri: Seher, Hamit, Eren, Veysel
    const givers = new Set([...V3_MAIN, ...V3_SIDE].flatMap((id) => [QUEST_MAP[id].giver, QUEST_MAP[id].turnIn]));
    for (const n of ['seher', 'hamit', 'eren', 'veysel']) expect(givers.has(n), n).toBe(true);
  });

  it('13 yeni NPC her biri görev verir ve doğru haritada', () => {
    const v3 = ['rauf', 'lale', 'nisa', 'doruk', 'nil', 'fikret', 'isil', 'beril', 'kaya', 'seher', 'hamit', 'eren', 'veysel'];
    const where = { rauf: 'village', lale: 'village', nisa: 'village', doruk: 'forest', nil: 'forest', fikret: 'mine', isil: 'swamp', beril: 'ash', kaya: 'frost', seher: 'dead_kingdom', hamit: 'dead_kingdom', eren: 'black_throne', veysel: 'black_throne' };
    for (const id of v3) {
      expect(MAPS[where[id]].objects.some((o) => o.type === 'npc' && o.npc === id), id).toBe(true);
      expect(QUESTS.some((q) => q.giver === id), id + ' görev verir').toBe(true);
      expect(NPCS[id].greet.length).toBeGreaterThan(10);
    }
  });

  it('24 erken yan görev Lv.2–30 aralığında; yeni karakter Lv.2\'de ilk erken görevi alabilir (kademeli açılış)', () => {
    for (const id of EARLY) { expect(QUEST_MAP[id].minLevel).toBeGreaterThanOrEqual(2); expect(QUEST_MAP[id].minLevel).toBeLessThanOrEqual(30); }
    const c = mk('mage', 'Yeni');
    gainExp(c, cumulativeXp(2));
    expect(EARLY.filter((id) => qs.questStatus(c, QUEST_MAP[id]) === 'available').length).toBeGreaterThan(0);
    // kademeli: Lv.2'de en çok birkaç erken görev açık (20 görev birden yığılmaz)
    expect(EARLY.filter((id) => qs.questStatus(c, QUEST_MAP[id]) === 'available').length).toBeLessThanOrEqual(4);
  });

  it('V2 kaydının görev durumları V3 geçişinden sonra aynen kalır; yeni görevler yapılmamış görünür', () => {
    const { env } = v2Envelope();
    const c = unwrap(env).profile.characters[0];
    expect(c.quests.m36.s).toBe('done');
    expect(c.quests.s11).toMatchObject({ s: 'active', p: [5, 2] });
    for (const id of [...V3_MAIN, ...V3_SIDE, ...EARLY]) expect(c.quests[id], id).toBeUndefined();
    expect(qs.questStatus(c, QUEST_MAP.m37)).toBe('available');   // m36 bitmiş Lv.30 karakter yeni hikâyeye başlar
  });

  it('8 normal, 2 elit, 2 boss — belge statları (denge ayarları belgelendi) ve her biri bir haritada doğar', () => {
    const spec = { shroud_crawler: [31, 1700, 220, 100, 95, 620], bone_archer: [32, 1600, 245, 95, 130, 700], cursed_guard: [33, 2400, 270, 155, 115, 780],
      grave_mage: [34, 1950, 285, 105, 175, 870], shadow_hunter: [37, 2400, 335, 125, 180, 1150], void_priest: [39, 3000, 390, 145, 210, 1400],
      shroud_hunter: [34, 14000, 330, 170, 155, 2000] };
    for (const [id, [level, hp, atk, def, mdef, exp]] of Object.entries(spec)) expect(ENEMIES[id], id).toMatchObject({ level, hp, atk, def, mdef, exp });
    // simülasyonla ayarlanan değerler (docs/V3_BALANCE.md): seviye, ATK ve EXP belge değerinde kalır
    expect(ENEMIES.obsidian_sentinel).toMatchObject({ level: 36, atk: 315, exp: 1050 });
    expect(ENEMIES.throne_executioner).toMatchObject({ level: 38, atk: 370, exp: 1270 });
    expect(ENEMIES.obsidian_executioner).toMatchObject({ level: 39, atk: 460, exp: 3500 });
    expect(ENEMIES.grave_commander).toMatchObject({ level: 35, hp: 70000 });
    expect(ENEMIES.lost_king).toMatchObject({ level: 40, hp: 125000 });
    const spawnMaps = (id) => Object.values(MAPS).filter((d) => d.areas.some((a) => (a.spawns || []).some((s) => s.enemy === id) || a.elite === id || a.boss === id) || d.boss === id);
    for (const id of [...Object.keys(spec), 'obsidian_sentinel', 'throne_executioner', 'obsidian_executioner', 'grave_commander', 'lost_king']) expect(spawnMaps(id).length, id).toBeGreaterThan(0);
    expect(ENEMIES.bone_soldier.noReward).toBe(true);
    expect(ENEMIES.king_seal.noReward).toBe(true);
  });

  it('36 V3 eşyası (toplam 126) belge değerleri; hepsi bir loot havuzundan ya da tariften elde edilir', () => {
    expect(ITEM_LIST.length).toBe(126);
    for (const id of V3_ITEMS) expect(ITEMS[id], id).toBeTruthy();
    expect(ITEMS.W19).toMatchObject({ rarity: 'L', lv: 40, base: { atkMin: 315, atkMax: 380 }, legendaryFixed: { str: 22, crit: 0.08 }, effect: 'kings_command' });
    expect(ITEMS.M19).toMatchObject({ rarity: 'L', lv: 40, base: { magMin: 340, magMax: 410 }, legendaryFixed: { int: 24, mp: 120 }, effect: 'eternal_verdict' });
    expect(ITEMS.C16).toMatchObject({ base: { def: 58, mdef: 90 } });
    expect(ITEMS.R12.fixed).toEqual({ crit: 0.05, hp: 100 });
    const lootSources = Object.values(ENEMIES).filter((e) => e.lootTable && !e.noReward);
    for (const id of V3_ITEMS) {
      const t = ITEMS[id];
      const fromLoot = lootSources.some((e) => buildPool(e.id, t.rarity).some((p) => p.tid === id));
      const fromCraft = RECIPES.some((r) => r.out.id === id && r.out.equip);
      expect(fromLoot || fromCraft, `${id} elde edilemiyor`).toBe(true);
    }
    // Komutan'ın iki özel Epic silahı
    expect(buildPool('grave_commander', 'E').map((p) => p.tid)).toEqual(expect.arrayContaining(['W16', 'M16']));
  });

  it('Legendary yalnız Golem, Donmuş Muhafız ve Kayıp Kral havuzlarında; oranlar korunur; tarif/görev Legendary vermez', () => {
    expect(LOOT_TABLES.golem.L).toBe(0.4); expect(LOOT_TABLES.frost_keeper.L).toBe(0.4); expect(LOOT_TABLES.lost_king.L).toBe(0.4);
    expect(buildPool('lost_king', 'L').map((p) => p.tid).sort()).toEqual(['M19', 'W19']);
    expect(buildPool('frozen_guardian', 'L').map((p) => p.tid).sort()).toEqual(['M13', 'W13']);
    expect(buildPool('mine_golem', 'L').map((p) => p.tid).sort()).toEqual(['M08', 'W08']);
    for (const e of Object.values(ENEMIES)) if (e.lootTable && !['mine_golem', 'frozen_guardian', 'lost_king'].includes(e.id)) expect(buildPool(e.id, 'L').length, e.id).toBe(0);
    for (const r of RECIPES) if (ITEMS[r.out.id]) expect(ITEMS[r.out.id].rarity).not.toBe('L');
    // Kırık Taç Parçası yalnız işleme (Taht Çekirdeği) ve Epic tariflerinde
    for (const r of RECIPES.filter((x) => x.inputs.some((i) => i.id === 'crown_shard'))) {
      expect(r.out.equip ? ITEMS[r.out.id].rarity : 'proc').toMatch(/E|proc/);
    }
  });

  it('kullanım eşyaları: fiyat/istif tanımlı, savaş kontrolü; ganimet çekilişini değiştirmez', () => {
    expect(USABLE_LIST.length).toBe(8);
    for (const u of USABLE_LIST) { expect(u.buy).toBeGreaterThan(0); expect(u.sell).toBeGreaterThan(0); expect(u.use.kind).toBeTruthy(); }
    expect(USABLE_LIST.filter((u) => u.combatOk).map((u) => u.id).sort()).toEqual(['cleansing_salve', 'warming_tonic']);
    const a = mk('warrior', 'A'), b = mk('warrior', 'B');
    b.effects = { lampUntil: 1e9, compassUntil: 1e9 };
    const ra = new Rng(77), rb = new Rng(77);
    const strip = (x) => ({ ...x, killId: null, equipment: x.equipment.map((e) => ({ ...e, uid: null })) });
    for (let i = 0; i < 500; i++) expect(strip(rollKillLoot('void_priest', { cls: b.cls }, rb))).toEqual(strip(rollKillLoot('void_priest', { cls: a.cls }, ra)));
  });

  it('üretim görevi yalnız gerçek üretimle ilerler; aynı araştırma nesnesi iki kez sayılmaz', () => {
    const c = mk('mage', 'Usta');
    gainExp(c, cumulativeXp(32));
    for (const id of ['m36', 'm37', 'm38']) c.quests[id] = { s: 'done', p: [], used: [] };
    expect(qs.acceptQuest(c, 's38').ok).toBe(true);
    addStack(c.bag, 'holy_symbol', 1);                 // hazır eşya hedefi tamamlamaz
    expect(qs.objectiveProgress(c, QUEST_MAP.s38, 0)).toBe(0);
    qs.onCraft(c, 'r_holy_symbol', 'holy_symbol', 1);
    expect(qs.objectiveProgress(c, QUEST_MAP.s38, 0)).toBe(1);
    expect(qs.acceptQuest(c, 's37').ok).toBe(true);
    qs.onInteract(c, 'old_record', 'rec1'); qs.onInteract(c, 'old_record', 'rec1');
    expect(qs.objectiveProgress(c, QUEST_MAP.s37, 0)).toBe(1);
  });

  it('Siyah Kapı: Komutan Arması tüketilir ve bayrak açılır; olay hedefleri (refakat/savunma) bir kez sayılır', () => {
    const c = mk('warrior', 'Kapici');
    gainExp(c, cumulativeXp(36));
    for (const id of ['m36', 'm37', 'm38', 'm39', 'm40', 'm41']) c.quests[id] = { s: 'done', p: [], used: [] };
    expect(qs.acceptQuest(c, 'm42').ok).toBe(true);
    expect(qs.interactRequirement(c, 'black_gate_lock', 'black_lock').ok).toBe(false);
    addStack(c.bag, 'commander_crest', 1);
    expect(qs.interactRequirement(c, 'black_gate_lock', 'black_lock').ok).toBe(true);
    qs.onInteract(c, 'black_gate_lock', 'black_lock');
    expect(c.world.flags.black_gate_open).toBe(true);
    c.quests.m42.s = 'done';
    expect(qs.acceptQuest(c, 's40').ok).toBe(true);
    expect(qs.onEventComplete(c, 'escort', 'last_guard').length).toBe(1);
    expect(qs.onEventComplete(c, 'escort', 'last_guard').length).toBe(0);
  });

  it('harita geçişleri: her portalın hedef haritası ve girişi var; kilitler gerçek görev/bayrağa bağlı; V3 haritaları onarımsız', () => {
    for (const d of Object.values(MAPS)) {
      for (const o of d.objects.filter((x) => x.type === 'portal' || x.type === 'dungeon_gate')) {
        expect(MAPS[o.to], `${d.id}→${o.to}`).toBeTruthy();
        expect(MAPS[o.to].entries[o.entry], `${d.id}→${o.to}.${o.entry}`).toBeTruthy();
        if (o.requires?.quest) expect(QUEST_MAP[o.requires.quest]).toBeTruthy();
        if (o.requires?.flag) expect(QUESTS.some((q) => q.objectives.some((x) => x.setFlag === o.requires.flag))).toBe(true);
      }
    }
    expect(MAPS.dead_kingdom).toMatchObject({ w: 120, h: 88 });
    expect(MAPS.black_throne).toMatchObject({ w: 124, h: 92 });
    for (const id of ['dead_kingdom', 'black_throne', 'dark_crypt']) expect(buildMap(MAPS[id]).repairs, id).toBe(0);
    expect(WAYSTONES.ws_dead.map).toBe('dead_kingdom'); expect(WAYSTONES.ws_throne.map).toBe('black_throne');
    // her V3 haritasında 2 gizli sandık
    for (const id of ['dead_kingdom', 'black_throne']) expect(MAPS[id].objects.filter((o) => o.type === 'chest').length).toBe(2);
  });

  it('Karanlık Mahzen: 4 bölüm, 2 kapı mekanizması (2. bölüm) + 3 kraliyet mührü (3. bölüm), kontrol noktaları, Kral', () => {
    const d = MAPS.dark_crypt;
    expect(DUNGEON_INFO.dark_crypt.boss).toBe('lost_king');
    expect(Object.keys(d.stages).map(Number)).toEqual([1, 2, 3, 4]);
    expect(d.seals.filter((s) => s.stage === 2 && s.kind === 'lever').length).toBe(2);
    expect(d.seals.filter((s) => !s.stage).length).toBe(3);
    expect(d.gates.map((g) => g.opensAfter)).toEqual([1, 2, 3]);
    for (const e of ['entrance', 'cp1', 'cp2', 'checkpoint']) expect(d.entries[e], e).toBeTruthy();
    expect(d.crystalSpawns.length).toBe(2);
    for (const st of [1, 2, 3, 4]) expect(d.areas.some((a) => a.stage === st), 'bölüm ' + st).toBe(true);
  });

  it('Lv.35 becerileri ve 6 aktif / 4 düğme; eski 4\'lü çubuk geçerli kalır', () => {
    expect(SKILLS.iron_fury).toMatchObject({ unlock: 35, dur: [7, 7, 7.5, 7.5, 8], cd: [30, 30, 29, 29, 28], mp: [40, 40, 41, 41, 42] });
    expect(SKILLS.iron_fury.dmgUp[0]).toBe(0.15); expect(SKILLS.iron_fury.reduce[0]).toBe(0.10);
    expect(SKILLS.time_freeze).toMatchObject({ unlock: 35, maxTargets: 5, slow: 0.55, slowDur: 3 });
    expect(SKILLS.time_freeze.coef[0]).toBe(1.40); expect(SKILLS.time_freeze.cd[0]).toBe(28); expect(SKILLS.time_freeze.mp[0]).toBe(70);
    for (const cls of ['warrior', 'mage']) expect(CLASS_SKILLS[cls].actives.length).toBeGreaterThanOrEqual(6);   // V4: 7
    const c = mk('warrior', 'Ofke');
    const bar0 = c.skillBar.slice();
    gainExp(c, cumulativeXp(35));
    expect(c.skills.iron_fury).toBe(1);
    expect(c.skillBar).toEqual(bar0);                         // çubuk kendiliğinden değişmez
    expect(setSkillBar(c, 3, 'iron_fury').ok).toBe(true);
    expect(c.skillBar.length).toBe(4);
    expect(validateProfile({ ...newProfile(), characters: [c, null, null, null, null] }).ok ?? true).toBeTruthy();   // V4: 5 yuva
  });

  it('Ustalık II: Lv.40 + ana hikâye; sınıfa özel görev; pasif küçük ve dengeli', () => {
    const c = mk('mage', 'Bilge');
    gainExp(c, cumulativeXp(40));
    expect(qs.questStatus(c, QUEST_MAP.c40m)).toBe('locked');
    for (const id of ['c10', 'c20', 'm46']) c.quests[id] = { s: 'done', p: [], used: [] };
    expect(qs.questStatus(c, QUEST_MAP.c40m)).toBe('available');
    expect(qs.questStatus(c, QUEST_MAP.c40w)).toBe('locked');   // diğer sınıfın görevi
    const before = computeStats(c);
    c.mastery2 = true;
    const after = computeStats(c);
    expect(after.dmgMult - before.dmgMult).toBeCloseTo(0.05, 5);
    expect(after.costRed - before.costRed).toBeCloseTo(0.08, 5);
    expect(after.maxMp / before.maxMp).toBeLessThan(1.06);
  });

  it('Lv.31+ yükseltme: V3 materyalleri, +5 sınırı, başarısızlıkta eşya kırılmaz', () => {
    const c = mk('warrior', 'Demirci');
    c.gold = 10_000_000;
    const inst = createItem('W17', 'R', rng);
    c.bag.slots[0] = inst;
    const info = upgradeInfo(inst);
    expect(info.mats.map((m) => m.id)).toEqual(['dark_steel']);
    addStack(c.bag, 'dark_steel', 50); addStack(c.bag, 'soul_essence', 50); addStack(c.bag, 'hardening_stone', 50); addStack(c.bag, 'altar_crystal', 50); addStack(c.bag, 'throne_core', 50);
    const r = new Rng(9);
    for (let i = 0; i < 200 && inst.p < 5; i++) {
      const p0 = inst.p;
      const res = upgrade(c, { where: 'bag', index: 0 }, r);
      expect(res.ok).toBe(true);
      expect(c.bag.slots[0]).toBe(inst);
      expect(inst.p).toBeGreaterThanOrEqual(p0);
    }
    expect(inst.p).toBe(5);
    expect(upgradeInfo(inst).ok).toBe(false);
  });
});
