// V4 içerik doğrulaması — belge sabitleri (EXP, sınıf formülleri, beceriler, eşya/loot kuralları, haritalar, zindan, görevler).
import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/rng.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { computeStats } from '../../src/systems/stats.js';
import { xpToNext, cumulativeXp, MAX_LEVEL, CHAR_SLOTS, SCHEMA_VERSION } from '../../src/data/constants.js';
import { CLASSES } from '../../src/data/classes.js';
import { SKILLS, CLASS_SKILLS } from '../../src/data/skills.js';
import { ITEMS, ITEM_LIST, canClassUse } from '../../src/data/items.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { LOOT_TABLES } from '../../src/data/loot.js';
import { rollKillLoot, buildPool } from '../../src/systems/loot.js';
import { QUESTS, CLASS_QUESTS, QUEST_MAP } from '../../src/data/quests.js';
import { NPCS } from '../../src/data/npcs.js';
import { MAPS, WAYSTONES, DUNGEON_MAPS } from '../../src/data/maps/index.js';
import { buildMap } from '../../src/world/mapBuilder.js';
import * as dg from '../../src/systems/dungeon.js';
import { RECIPES } from '../../src/data/recipes.js';

const rng = new Rng(44);
const mk = (cls, lv = 1) => { const c = createCharacter({ name: 'V4', cls, slot: 0 }, rng); if (lv > 1) gainExp(c, cumulativeXp(lv)); return c; };

describe('V4 sabitleri', () => {
  it('Lv.50 sınırı; 40→50 EXP tablosu 153.680 … 282.440, toplam 2.142.150; şema 4, 5 yuva', () => {
    expect(MAX_LEVEL).toBe(50);
    expect(xpToNext(40)).toBe(153680);
    expect(xpToNext(49)).toBe(282440);
    let sum = 0; for (let l = 40; l < 50; l++) sum += xpToNext(l);
    expect(sum).toBe(2142150);
    expect(SCHEMA_VERSION).toBe(4);
    expect(CHAR_SLOTS).toBe(5);
    const c = mk('archer', 50);
    expect(c.level).toBe(50);
    gainExp(c, 1e7);
    expect(c.level).toBe(50);
  });

  it('Okçu ve Ölü Çağıran formülleri belgeyle aynı (Lv.1, donanımsız)', () => {
    const a = CLASSES.archer, n = CLASSES.necromancer;
    expect(a.base).toEqual({ str: 4, dex: 9, int: 3, vit: 5 });
    expect(n.base).toEqual({ str: 2, dex: 4, int: 9, vit: 5 });
    expect([a.attackInterval, a.attackRange, n.attackInterval, n.attackRange]).toEqual([1.25, 7, 1.6, 6]);
    expect(a.hp(10, 8)).toBe(80 + 90 + 80); expect(a.mp(10, 3)).toBe(55 + 36 + 12);
    expect(n.hp(10, 8)).toBe(65 + 81 + 80); expect(n.mp(10, 9)).toBe(90 + 63 + 72);
    expect(a.physPower({ str: 4, dex: 9 }, 1)).toBeCloseTo(1.05 * 9 + 0.35 * 4 + 0.35, 6);
    expect(n.magicPower({ int: 9 }, 1)).toBeCloseTo(1.35 * 9 + 0.3, 6);
    for (const cls of ['archer', 'necromancer']) {
      const c = mk(cls);
      for (const k of Object.keys(c.equipment)) c.equipment[k] = null;
      const st = computeStats(c);
      expect(st.maxHp).toBe(CLASSES[cls].hp(1, 5));
      expect(st.maxMp).toBe(CLASSES[cls].mp(1, CLASSES[cls].base.int));
    }
  });

  it('beceriler: 7 aktif (1/5/10/15/25/35/45) + 3 pasif; Savaşçı/Büyücü Lv.45 becerileri', () => {
    const names = {
      archer: ['İsabetli Ok', 'Çoklu Atış', 'Çevik Adım', 'Delici Ok', 'Ok Yağmuru', 'Avcı İşareti', 'Kartal Fırtınası'],
      necromancer: ['Ruh Oku', 'İskelet Çağır', 'Lanet Mührü', 'Can Sömürüsü', 'Kemik Patlaması', 'Ölüler Ordusu', 'Ruh Kıyameti'],
    };
    const passives = { archer: ['Keskin Nişancı', 'Çevik Refleks', 'Avcı İçgüdüsü'], necromancer: ['Karanlık Bilgi', 'Kemik Bağı', 'Ruh Hasadı'] };
    for (const cls of ['archer', 'necromancer']) {
      const cs = CLASS_SKILLS[cls];
      expect(cs.actives.map((id) => SKILLS[id].name)).toEqual(names[cls]);
      expect(cs.actives.map((id) => SKILLS[id].unlock)).toEqual([1, 5, 10, 15, 25, 35, 45]);
      expect(cs.passives.map((id) => SKILLS[id].name)).toEqual(passives[cls]);
      expect(SKILLS[cs.mastery2].kind).toBe('mastery2');
    }
    for (const cls of ['warrior', 'mage', 'archer', 'necromancer']) expect(SKILLS[CLASS_SKILLS[cls].mastery3].kind).toBe('mastery3');
    expect(SKILLS.thunder_rift).toMatchObject({ unlock: 45, cls: 'warrior' });
    expect(SKILLS.thunder_rift.coef[0]).toBe(2.2); expect(SKILLS.thunder_rift.cd[0]).toBe(24);
    expect(SKILLS.astral_burst).toMatchObject({ unlock: 45, cls: 'mage', maxTargets: 6 });
    expect(SKILLS.astral_burst.coef[0]).toBe(2.0); expect(SKILLS.astral_burst.cd[0]).toBe(24);
    // Ruh Mermisi (normal saldırı) MP harcamaz; Can Sömürüsü iyileşmesi en çok %5 can
    expect(CLASSES.necromancer.normalMp || 0).toBe(0);
    const drain = Object.values(SKILLS).find((s) => s.name === 'Can Sömürüsü');
    expect(drain.healCap).toBeLessThanOrEqual(0.05);
  });

  it('84 yeni eşya (toplam 210); yeni sınıf ekipmanı Lv.1 içeriğinden düşer; normal Rare %0,25 ve elit Epic %0,75 değişmedi', () => {
    expect(ITEM_LIST.length).toBe(210);
    const v4 = ITEM_LIST.slice(126);
    expect(v4.length).toBe(84);
    expect(LOOT_TABLES.normal.R).toBe(0.25);
    expect(LOOT_TABLES.elite.E).toBe(0.75);
    for (const cls of ['archer', 'necromancer']) {
      // her 10 seviyelik bantta silah + gövde zırhı
      for (const lv of [1, 10, 20, 30, 40, 45]) {
        for (const slot of ['weapon', 'chest']) {
          expect(ITEM_LIST.some((t) => t.slot === slot && canClassUse(t, cls) && t.lv <= lv && t.lv >= lv - 10 && t.rarity !== 'L'), `${cls} ${slot} Lv.${lv}`).toBe(true);
        }
      }
      // Lv.1–5 yaratıkları (Çayır Sıçanı, Boz Kurt) yeni sınıf ekipmanını düşürebilir
      const low = ['meadow_rat', 'gray_wolf'].flatMap((id) => ['N', 'U'].flatMap((r) => buildPool(id, r)));
      expect(low.some((p) => ITEMS[p.tid].cls === cls), cls).toBe(true);
    }
  });

  it('eski Legendary bosslarında Okçu/Ölü Çağıran Legendary\'si var; Göğün Mahkûmu dört sınıf; oran %0,4 ve %80 kendi sınıfı', () => {
    for (const id of ['mine_golem', 'frozen_guardian', 'lost_king', 'sky_prisoner']) {
      const pool = buildPool(id, 'L');
      for (const cls of ['warrior', 'mage', 'archer', 'necromancer']) expect(pool.some((p) => ITEMS[p.tid].cls === cls), `${id} ${cls}`).toBe(true);
    }
    const n = 400000, r = new Rng(77);
    let L = 0, own = 0;
    for (let i = 0; i < n; i++) {
      const it = rollKillLoot('sky_prisoner', { cls: 'necromancer' }, r).equipment[0];
      if (it?.r === 'L') { L++; if (ITEMS[it.tid].cls === 'necromancer') own++; }
    }
    expect(Math.abs(L / n - 0.004)).toBeLessThan(0.0006);
    expect(Math.abs(own / L - 0.8)).toBeLessThan(0.06);
    // Fırtına Tiranı ve V4 elitleri Legendary düşürmez
    for (const id of ['storm_tyrant', 'storm_executioner', 'void_warden']) expect(buildPool(id, 'L').length, id).toBe(0);
    // Legendary üretimi yok
    for (const rc of RECIPES) if (rc.out.equip) expect(ITEMS[rc.out.id].rarity, rc.id).not.toBe('L');
  });

  it('V4 elit/boss değerleri belgeyle aynı', () => {
    expect(ENEMIES.storm_executioner).toMatchObject({ level: 45, hp: 24000, kind: 'elite' });
    expect(ENEMIES.void_warden).toMatchObject({ level: 49, hp: 35000, kind: 'elite' });
    expect(ENEMIES.storm_tyrant).toMatchObject({ level: 45, hp: 155000, kind: 'boss' });
    expect(ENEMIES.sky_prisoner).toMatchObject({ level: 50, hp: 210000, kind: 'boss' });
    expect(LOOT_TABLES.storm_tyrant).toMatchObject({ R: 26, E: 3.5, L: 0 });
    expect(LOOT_TABLES.sky_prisoner).toMatchObject({ R: 34, E: 9, L: 0.4 });
  });
});

describe('V4 dünya', () => {
  it('Gökyarık Ovası 124×88 ve Yıldız Mezarı 128×92: 4 farm noktası, elit, yol taşı, 2 gizli sandık, toplama düğümleri', () => {
    const spec = {
      sky_rift: { size: [124, 88], camps: ['storm_hound', 'rift_wing', 'lightning_raider', 'thunder_golem'], elite: 'storm_executioner', ws: 'ws_rift', gather: ['storm_ore'] },
      star_grave: { size: [128, 92], camps: ['star_parasite', 'astral_hunter', 'void_armor', 'star_oracle'], elite: 'void_warden', ws: 'ws_star', gather: ['astral_crystal'] },
    };
    for (const [id, s] of Object.entries(spec)) {
      const def = MAPS[id], m = buildMap(def);
      expect([m.w, m.h]).toEqual(s.size);
      const camps = def.areas.filter((a) => a.camp);
      expect(camps.flatMap((a) => a.spawns.map((x) => x.enemy)).sort()).toEqual([...s.camps].sort());
      for (const c of camps) expect(m.areaCells[c.id].length, c.id).toBeGreaterThan(40);
      expect(def.areas.some((a) => a.elite === s.elite)).toBe(true);
      expect(def.objects.filter((o) => o.type === 'chest').length).toBe(2);
      expect(def.objects.some((o) => o.type === 'waystone' && o.id === s.ws)).toBe(true);
      expect(WAYSTONES[s.ws].map).toBe(id);
      for (const g of s.gather) expect(def.objects.filter((o) => o.type === 'gather' && o.kind === g).length).toBeGreaterThanOrEqual(6);
      expect(m.repairs, id).toBe(0);
    }
    expect(MAPS.sky_rift.areas.some((a) => a.boss === 'storm_tyrant')).toBe(true);
    expect(MAPS.star_grave.objects.filter((o) => o.group === 'star_lens').length).toBe(3);
    // Kara Taht → Gökyarık (m47 bayrağı) → Yıldız Mezarı (m53 bayrağı) → Mabet (m56)
    const lockOf = (map, to) => MAPS[map].objects.find((o) => o.type === 'portal' && o.to === to)?.requires?.flag;
    expect(lockOf('black_throne', 'sky_rift')).toBe('sky_rift_open');
    expect(lockOf('sky_rift', 'star_grave')).toBe('star_grave_open');
    expect(QUEST_MAP.m47.objectives.some((o) => o.setFlag === 'sky_rift_open')).toBe(true);
    expect(QUEST_MAP.m53.objectives.some((o) => o.setFlag === 'star_grave_open')).toBe(true);
    expect(QUEST_MAP.m56.unlocksDungeon).toBe('astral_sanctum');
  });

  it('Gökyarık Mabedi: 5 bölüm, kontrol noktaları, boss ölümde sıfırlanır, ödül koşu başına bir kez; yanıltıcı düğüm sayılmaz', () => {
    expect(DUNGEON_MAPS).toContain('astral_sanctum');
    const def = MAPS.astral_sanctum;
    expect(dg.bossStage('astral_sanctum')).toBe(5);
    expect(Object.keys(def.stages).map(Number)).toEqual([1, 2, 3, 4, 5]);
    expect(def.stages[5]).toEqual([['sky_prisoner', 1]]);
    const real = def.seals.filter((s) => s.kind !== 'decoy');
    expect(real.length).toBe(dg.DUNGEON_INFO.astral_sanctum.seals);
    expect(def.seals.filter((s) => s.kind === 'decoy').every((s) => s.hint && s.stage === 2)).toBe(true);
    expect(def.seals.filter((s) => s.stage === 4).every((s) => s.waves?.length === 2)).toBe(true);
    const c = mk('necromancer', 49);
    dg.unlockDungeon(c, 'astral_sanctum');
    dg.startOrResumeRun(c, 'astral_sanctum');
    expect(dg.respawnEntry(c, 'astral_sanctum')).toBe('entrance');
    const expectCp = { 1: 'cp1', 2: 'cp2', 3: 'cp3', 4: 'checkpoint' };
    for (let s = 1; s <= 4; s++) {
      expect(dg.currentStage(c, 'astral_sanctum')).toBe(s);
      dg.clearStage(c, s, 'astral_sanctum');
      expect(dg.respawnEntry(c, 'astral_sanctum')).toBe(expectCp[s]);
      expect(def.entries[expectCp[s]], expectCp[s]).toBeTruthy();
    }
    expect(dg.claimBossLoot(c, 'astral_sanctum')).toBe(true);
    expect(dg.claimBossLoot(c, 'astral_sanctum')).toBe(false);
    dg.exitRun(c, 'astral_sanctum');
    dg.startOrResumeRun(c, 'astral_sanctum');
    expect(dg.claimBossLoot(c, 'astral_sanctum')).toBe(true);
  });

  it('5 yeni NPC haritada; görevler Legendary vermez ve Legendary\'ye bağlı değildir', () => {
    const where = { duru: 'village', selim: 'village', atlas: 'sky_rift', leyla: 'star_grave', tufan: 'star_grave' };
    for (const [id, map] of Object.entries(where)) {
      expect(NPCS[id], id).toBeTruthy();
      expect(MAPS[map].objects.some((o) => o.type === 'npc' && o.npc === id), id).toBe(true);
      expect([...QUESTS, ...CLASS_QUESTS].some((q) => q.giver === id), id).toBe(true);
    }
    for (const q of [...QUESTS, ...CLASS_QUESTS]) {
      for (const r of q.rewardItems) expect(ITEMS[r.id], q.id).toBeUndefined();
      for (const o of q.objectives) {
        if (o.item) expect(ITEMS[o.item], q.id).toBeUndefined();
        for (const m of [...(o.consume || []), ...(o.takes || [])]) expect(ITEMS[m.id], q.id).toBeUndefined();
      }
    }
    // Ustalık III: dört sınıf, Lv.50, hikâye sonrası (m58)
    const m3 = CLASS_QUESTS.filter((q) => q.mastery3);
    expect(m3.map((q) => q.cls).sort()).toEqual(['archer', 'mage', 'necromancer', 'warrior']);
    for (const q of m3) { expect(q.minLevel).toBe(50); expect(q.prereq).toContain('m58'); }
    // Ustalık II yeni sınıflar için de var
    expect(CLASS_QUESTS.filter((q) => q.mastery2).map((q) => q.cls).sort()).toEqual(['archer', 'mage', 'necromancer', 'warrior']);
  });
});
