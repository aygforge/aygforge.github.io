import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/rng.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { QUESTS, CLASS_QUESTS, QUEST_MAP } from '../../src/data/quests.js';
import * as qs from '../../src/systems/quests.js';
import { addStack, countStack } from '../../src/systems/inventory.js';
import { applyKill } from '../../src/systems/rewards.js';
import * as dg from '../../src/systems/dungeon.js';
import { MAPS } from '../../src/data/maps/index.js';
import { cumulativeXp } from '../../src/data/constants.js';

const rng = new Rng(4);

// Bir görevi gerçek olaylarla (öldürme/ulaşma/etkileşim/teslim) tamamla
function complete(c, q) {
  for (let i = 0; i < q.objectives.length; i++) {
    const o = q.objectives[i];
    let guard = 0;
    while (!qs.objectiveDone(c, q, i) && guard++ < 5000) {
      if (o.type === 'kill') qs.onKill(c, o.enemy || 'rotten_guard', rng);
      else if (o.type === 'qitem') qs.onKill(c, o.from[0], rng);
      else if (o.type === 'reach') qs.onReach(c, o.loc);
      else if (o.type === 'interact') {
        const objs = Object.values(MAPS).flatMap((m) => m.objects).filter((x) => x.group === o.group).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        for (const ob of objs) {
          for (const m of o.consume || []) addStack(c.bag, m.id, m.qty);
          qs.onInteract(c, o.group, ob.id, ob.order ?? null);
        }
      } else if (o.type === 'deliver') addStack(c.bag, o.item, o.count);
      else if (o.type === 'visit') { for (const m of o.takes || []) if (!countStack(c.bag, m.id)) addStack(c.bag, m.id, m.qty); qs.onTalk(c, o.npc); }
      else if (o.type === 'craft') qs.onCraft(c, o.recipe, null, 1);
      else if (o.type === 'escort' || o.type === 'defend') qs.onEventComplete(c, o.type, o.event);
      else if (o.type === 'dungeon') qs.onDungeonStage(c, o.stage, o.dungeon || 'dungeon');
      else if (o.type === 'talk') break;
    }
  }
}

describe('Görevler', () => {
  it('bütün görevler (ana, yan, sınıf) sırayla alınabilir, tamamlanabilir, ödülü bir kez verilir', () => {
    for (const cls of ['warrior', 'mage']) {
      const c = createCharacter({ name: 'Görevci', cls, slot: 0 }, rng);
      let gold = c.gold;
      const order = [...QUESTS.filter((q) => q.main), ...QUESTS.filter((q) => !q.main), ...CLASS_QUESTS.filter((q) => !q.cls || q.cls === cls)];
      for (const q of order) {
        if (c.level < q.minLevel) gainExp(c, cumulativeXp(q.minLevel) - cumulativeXp(c.level) - c.exp);
        expect(qs.questStatus(c, q), q.id).toBe('available');
        expect(qs.acceptQuest(c, q.id).ok).toBe(true);
        // yalnız konuşma ya da kabulde verilen eşyayı başka NPC'ye götürme (ör. Gecikmiş Haber) görevleri hemen teslim edilebilir
        const carry = (o) => o.type === 'deliver' && (q.giveOnAccept || []).some((g) => g.id === o.item);
        expect(qs.turnInQuest(c, q.id, q.turnIn).ok, q.id).toBe(q.objectives.every((o) => o.type === 'talk' || carry(o)));
        if (qs.questState(c, q.id).s === 'done') continue;
        complete(c, q);
        expect(qs.isReady(c, q), q.id).toBe(true);
        const g0 = c.gold;
        const r = qs.turnInQuest(c, q.id, q.turnIn);
        expect(r.ok, q.id + ' ' + r.msg).toBe(true);
        expect(c.gold).toBe(g0 + q.gold);
        expect(qs.turnInQuest(c, q.id, q.turnIn).ok).toBe(false); // tekrar ödül yok
        expect(qs.acceptQuest(c, q.id).ok).toBe(false);
      }
      expect(c.world.dungeonUnlocked).toBe(true);
      expect(c.titles).toContain('Vadinin Koruyucusu');
      expect(c.bonusSkillPoints).toBe(2);
      expect(c.mastery).toBe(true);
    }
  });
  it('ön koşul ve seviye kilidi', () => {
    const c = createCharacter({ name: 'Kilit', cls: 'mage', slot: 0 }, rng);
    expect(qs.questStatus(c, QUEST_MAP.m02)).toBe('locked');
    expect(qs.questStatus(c, QUEST_MAP.s01)).toBe('lowlevel');
  });
  it('Boz Kurt öldürünce sayaç artar, yanlış yaratık artırmaz', () => {
    const c = createCharacter({ name: 'Kurtçu', cls: 'warrior', slot: 0 }, rng);
    c.quests.m04 = { s: 'active', p: [0, 0], used: [] };
    applyKill(c, 'meadow_rat', {}, rng);
    expect(c.quests.m04.p[0]).toBe(0);
    applyKill(c, 'gray_wolf', {}, rng);
    expect(c.quests.m04.p[0]).toBe(1);
  });
  it('aynı görev nesnesi iki kez sayılmaz; "after" sırası', () => {
    const c = createCharacter({ name: 'Sıra', cls: 'warrior', slot: 0 }, rng);
    c.quests.m15 = { s: 'active', p: [0, 0], used: [] };
    qs.onInteract(c, 'dungeon_gate', 'dungeon_gate');
    expect(c.quests.m15.p[1]).toBe(0);
    for (let i = 0; i < 5; i++) qs.onKill(c, 'rotten_guard', rng);
    qs.onInteract(c, 'dungeon_gate', 'dungeon_gate');
    qs.onInteract(c, 'dungeon_gate', 'dungeon_gate');
    expect(c.quests.m15.p[1]).toBe(1);
    expect(c.world.dungeonUnlocked).toBe(true);
  });
  it('her hedefin ipucu (harita işareti) hedefin yapılabildiği haritayı gösterir', () => {
    const mapsOfEnemy = (id) => Object.values(MAPS).filter((d) => d.areas.some((a) => (a.spawns || []).some((s) => s.enemy === id) || a.elite === id || a.boss === id) || (d.stages && Object.values(d.stages).some((st) => st.some?.(([e]) => e === id)))).map((d) => d.id);
    const bad = [];
    for (const q of [...QUESTS, ...CLASS_QUESTS]) {
      q.objectives.forEach((o, i) => {
        const hint = o.hint || q.hint;
        if (!hint || o.type === 'talk' || o.type === 'deliver' || o.type === 'dungeon') return;
        let maps = [];
        if (o.type === 'kill') maps = o.enemy ? mapsOfEnemy(o.enemy) : [hint.map];
        else if (o.type === 'qitem') maps = o.from.flatMap(mapsOfEnemy);
        else if (o.type === 'interact') maps = Object.values(MAPS).filter((d) => d.objects.some((x) => x.group === o.group)).map((d) => d.id);
        else if (o.type === 'reach') maps = Object.values(MAPS).filter((d) => (d.locations || []).some((l) => l.id === o.loc)).map((d) => d.id);
        else if (o.type === 'escort' || o.type === 'defend') maps = Object.values(MAPS).filter((d) => d.objects.some((x) => x.id === o.event && (x.type === 'escort' || x.type === 'defense'))).map((d) => d.id);
        else if (o.type === 'visit' || o.type === 'craft') return;
        if (o.type === 'kill' && o.spawn) maps = [o.spawn.map];
        if (o.enemy === 'mine_golem' || o.enemy === 'training_dummy') return;
        if (!maps.includes(hint.map)) bad.push(`${q.id}#${i} ${hint.map} ∉ [${maps}]`);
      });
    }
    expect(bad).toEqual([]);
    // çok haritalı görevde ipucu ilerledikçe değişir (Mührün Gücü: Bataklık → Maden kapısı)
    const ch = createCharacter({ name: 'İpucu', cls: 'warrior', slot: 0 }, new Rng(5));
    const m15 = QUEST_MAP.m15;
    expect(qs.currentHint(ch, m15).map).toBe('swamp');
    ch.quests.m15 = { s: 'active', p: [5, 0] };
    expect(qs.currentHint(ch, m15).map).toBe('mine');
  });

  it('Av Sözleşmeleri ayrı ve tekrarlanabilir', () => {
    const c = createCharacter({ name: 'Avcı', cls: 'warrior', slot: 0 }, rng);
    gainExp(c, cumulativeXp(5));
    expect(qs.contractOffers(c).length).toBe(0);
    c.quests.s01 = { s: 'done', p: [8], used: [] };
    const offers = qs.contractOffers(c);
    expect(offers.length).toBeGreaterThan(0);
    for (let round = 0; round < 3; round++) {
      expect(qs.acceptContract(c, 'gray_wolf').ok).toBe(true);
      for (let i = 0; i < 12; i++) qs.onKill(c, 'gray_wolf', rng);
      expect(qs.claimContract(c).ok).toBe(true);
      expect(qs.claimContract(c).ok).toBe(false);
    }
    expect(c.contractsDone).toBe(3);
  });
});

describe('Dungeon', () => {
  it('kilit, koşu, kontrol noktası, tek boss loot\'u, gönüllü çıkış', () => {
    const c = createCharacter({ name: 'Ocak', cls: 'mage', slot: 0 }, rng);
    expect(dg.canEnterDungeon(c).ok).toBe(false);
    c.world.dungeonUnlocked = true;
    const r1 = dg.startOrResumeRun(c);
    expect(r1.resumed).toBe(false);
    dg.clearStage(c, 1); dg.clearStage(c, 2);
    expect(dg.respawnEntry(c)).toBe('cp2');
    dg.clearStage(c, 3);
    expect(dg.respawnEntry(c)).toBe('checkpoint');
    // istemsiz kapanma → devam
    const saved = JSON.parse(JSON.stringify(c));
    expect(dg.startOrResumeRun(saved).resumed).toBe(true);
    expect(saved.dungeon.cleared).toEqual([1, 2, 3]);
    // boss loot bir kez
    const killId = dg.bossKillId(c);
    expect(dg.claimBossLoot(c)).toBe(true);
    const a = applyKill(c, 'mine_golem', { killId, unique: true }, rng);
    expect(dg.claimBossLoot(c)).toBe(false);
    const b = applyKill(c, 'mine_golem', { killId, unique: true }, rng);
    expect(a.duplicate).toBe(false);
    expect(b.duplicate).toBe(true);
    expect(b.gold).toBe(0);
    // gönüllü çıkış → yeni koşu → yeni boss loot hakkı
    dg.exitRun(c);
    const r2 = dg.startOrResumeRun(c);
    expect(r2.resumed).toBe(false);
    expect(r2.run.runId).not.toBe(r1.run.runId);
    expect(dg.claimBossLoot(c)).toBe(true);
  });
});
