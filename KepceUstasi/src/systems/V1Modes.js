// V1.0 modları — Boss Mutfağı (L25), Sonsuz Kazan Kulesi (L35), dungeon ödül ölçeklemesi, günlük/haftalık görevler.
// Hepsi AYNI motoru (RunController/EnemyDirector/CombatResolver/PotPhysics) kullanır: burada yalnız "chapter" verisi
// üretilir ve ödüller runId başına bir kez uygulanır. Haftalık sıfırlama: Pazartesi 00:00 UTC; günlük: 00:00 UTC.
import { ENEMIES } from '../data/content.js';
import { V1 } from '../data/v1/v1Adapter.js';

export const RUN_COST = 5;
const utcDay = (now) => new Date(now).toISOString().slice(0, 10);
export const BOSS_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

// ISO week key of the UTC Monday that starts the current week
export function utcWeek(now) {
  const d = new Date(now);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString().slice(0, 10);
}

export function highestCleared(save) {
  let h = 0;
  for (const [l, st] of Object.entries(save.stageProgress?.levels || {})) if (st?.cleared) h = Math.max(h, Number(l));
  return h;
}

// ---------------------------------------------------------------- gold kitchen / depot scaling (L1–30 unchanged)
export function scaledDungeonReward(save, dungeonId, def) {
  const h = highestCleared(save);
  if (dungeonId === 'gold_kitchen') {
    const m = h > 30 ? 1 + Math.floor((h - 30) / 10) * 0.25 : 1;
    return { ...def, fullRewardTips: Math.round(def.fullRewardTips * m), repeatRewardTips: Math.round(def.repeatRewardTips * m) };
  }
  if (dungeonId === 'materials_depot' && h >= 31) {
    const full = def.fullRewardParts + 4 * Math.floor((h - 21) / 10);
    return { ...def, fullRewardParts: full, repeatRewardParts: Math.round(full * 0.45) };
  }
  return def;
}

// ---------------------------------------------------------------- Boss Mutfağı
export const BOSS_KITCHEN = { id: 'boss_kitchen', name: 'Boss Mutfağı', unlockedAfterLevel: 25, weeklyFull: 3, sealsPerWin: 2 };

// The 3 hardest chapter bosses the player has already beaten (repeats when fewer than 3 are beaten).
export function bossKitchenPool(save) {
  const beaten = BOSS_LEVELS.filter((l) => save.stageProgress?.levels?.[l]?.cleared);
  const base = beaten.length ? beaten : [10];
  const pick = base.slice(-3);
  while (pick.length < 3) pick.unshift(pick[0]);
  return pick;
}

export function buildBossKitchen(levels, stageByLevel) {
  const stages = levels.map((l) => stageByLevel(l));
  const types = stages.map((s) => s.finals[0]);
  const bossHpByType = {};
  const bossShieldByType = {};
  for (const s of stages) {
    bossHpByType[s.finals[0]] = s.balance.bossHp ?? ENEMIES[s.finals[0]].hp;
    bossShieldByType[s.finals[0]] = s.balance.bossShield ?? ENEMIES[s.finals[0]].shield;
  }
  return {
    id: `D_boss_kitchen:${levels.join(',')}`, isDungeon: true, dungeonId: 'boss_kitchen', name: BOSS_KITCHEN.name,
    index: stages[2].index, chapterId: stages[2].chapterId, tags: stages[2].tags, recipe: {}, boss: types[2], finals: [types[2]],
    finalName: ENEMIES[types[2]].name, baseTip: 0, bigOilRate: 0.1, dish: stages[2].dish, theme: stages[2].theme, energyCost: RUN_COST,
    unlockedAfterLevel: BOSS_KITCHEN.unlockedAfterLevel, skillWaves: [1, 2], bossRush: true, reward: BOSS_KITCHEN,
    balance: { hp: {}, bossHpByType, bossShieldByType, spawnXMin: 0.7, spawnXMax: 0.74, bossX: 0.72 },
    waves: [{ [types[0]]: 1 }, { [types[1]]: 1 }],
  };
}

// ---------------------------------------------------------------- Sonsuz Kazan Kulesi
export const TOWER = { id: 'tower', name: 'Kazan Kulesi', unlockedAfterLevel: 35, floorsPerBlock: 5, floors: 100 };
const LEGACY_ENEMIES = { 1: ['tomato', 'pepper', 'egg'], 2: ['potato', 'armored_potato', 'salt'], 3: ['mushroom', 'mushroom_guard', 'onion'] };
const LEGACY_BOOST = 1.7; // Alpha 0.1–0.3 base HP table is on a smaller scale than the V1 data
export function towerChapterOf(block) {
  return (block % 12) + 1;
}
// Block b = floors 5b+1..5b+5: four floors are normal waves, floor 5b+5 is the final. Grows by formula (no 100k rows).
export function buildTowerBlock(block) {
  const ci = towerChapterOf(block);
  const ch = V1.ch.find((c) => c.i === ci);
  const ids = ch ? ch.e.map((e) => e.id) : LEGACY_ENEMIES[ci];
  const k = 1 + 0.15 * block;
  const hp = Object.fromEntries(ids.map((id) => [id, Math.max(1, Math.round(ENEMIES[id].hp * (ch ? 1 : LEGACY_BOOST) * k))]));
  for (const id of ids) if (ENEMIES[`${id}_mini`]) hp[`${id}_mini`] = 2;
  const per = Math.min(6, 2 + Math.floor(block / 4));
  const waves = [0, 1, 2, 3].map((w) => {
    const n = per + (w % 2);
    const comp = {};
    for (let i = 0; i < n; i++) comp[ids[(i + w) % 3]] = (comp[ids[(i + w) % 3]] || 0) + 1;
    return comp;
  });
  const bossBlock = (block + 1) % 4 === 0;
  let finalType;
  let bossHp = null;
  let bossShield = null;
  if (bossBlock) {
    finalType = ch ? ch.b.id : { 1: 'giant_tomato', 2: 'potato_king', 3: 'giant_mushroom' }[ci];
    bossHp = Math.round((ENEMIES[finalType].hp < 60 ? 60 : ENEMIES[finalType].hp) * (0.5 + 0.06 * block));
    bossShield = Math.min(12, ENEMIES[finalType].shield || 2);
  } else {
    finalType = `tower_elite_${block}`;
    const base = ENEMIES[ids[0]];
    const { name, boss, recipe, ...rest } = base;
    ENEMIES[finalType] = { ...rest, id: finalType, name: `Kule Bekçisi ${5 * block + 5}`, hp: Math.round(22 * (1 + 0.25 * block)), shield: Math.min(8, Math.floor(block / 3)),
      boss: true, elite: true, recipe: null, sprite: base.sprite || ids[0], retreatX: 0.62, tint: 0xc8b0ff };
  }
  return {
    id: `T_tower:${block}`, isDungeon: true, dungeonId: 'tower', towerBlock: block, name: `${TOWER.name} · Kat ${5 * block + 1}–${5 * block + 5}`,
    index: ci, chapterId: ch ? ch.id : ['menemen', 'fries', 'omelet'][ci - 1], tags: ids, recipe: {}, boss: finalType, finals: [finalType],
    finalName: ENEMIES[finalType].name, baseTip: 0, bigOilRate: 0.1, dish: ch ? `dish_${ch.id}` : 'dish_omelet', energyCost: RUN_COST,
    unlockedAfterLevel: TOWER.unlockedAfterLevel, skillWaves: [1, 2, 3, 4], reward: TOWER, theme: 0xd8c8ff,
    balance: { hp, bossHp, bossShield, spawnXMin: 0.6, spawnXMax: 0.67, bossX: 0.72 },
    waves,
  };
}
export const towerNextBlock = (save) => Math.floor((save.tower?.best || 0) / 5);

// ---------------------------------------------------------------- results (runId-guarded by the caller)
export function applyBossKitchenResult(save, run, victory, now) {
  const bk = (save.bossKitchen ||= { week: '', wins: 0, total: 0 });
  const week = utcWeek(now);
  if (bk.week !== week) {
    bk.week = week;
    bk.wins = 0;
  }
  const reward = { tips: 0, parts: 0, seals: 0, full: false, firstBonus: 0, total: 0 };
  if (victory) {
    reward.full = bk.wins < BOSS_KITCHEN.weeklyFull;
    bk.wins++;
    bk.total = (bk.total || 0) + 1;
    const h = highestCleared(save);
    reward.tips = reward.full ? 200 + 5 * h : 60 + h;
    reward.seals = reward.full ? BOSS_KITCHEN.sealsPerWin : 0;
    save.tips += reward.tips;
    save.bossSeals = (save.bossSeals || 0) + reward.seals;
    reward.total = reward.tips;
  }
  return reward;
}

export function applyTowerResult(save, block, victory) {
  const tw = (save.tower ||= { best: 0, milestones: [], weekBlocks: 0, week: '' });
  const reward = { tips: 0, parts: 0, seals: 0, full: false, firstBonus: 0, total: 0, floor: 5 * block + 5 };
  if (victory) {
    const top = 5 * block + 5;
    if (!tw.milestones.includes(top)) {
      tw.milestones.push(top); // each 5-floor milestone pays once
      reward.full = true;
      reward.tips = 60 + 25 * block;
      reward.parts = 4 + block;
      if (top % 15 === 0) reward.seals = 1; // first clear of every 15th floor
    } else reward.tips = 30; // replay: small tips only
    tw.best = Math.max(tw.best, top); // checkpoint
    save.tips += reward.tips;
    save.currencyParts += reward.parts;
    save.bossSeals = (save.bossSeals || 0) + reward.seals;
    reward.total = reward.tips;
  }
  return reward;
}

// ---------------------------------------------------------------- daily / weekly quests
export const QUESTS = {
  daily: [
    { id: 'd_runs', name: '3 koşu tamamla', metric: 'runs', target: 3, reward: { tips: 60 } },
    { id: 'd_cook', name: '10 düşman pişir', metric: 'kills', target: 10, reward: { parts: 4 } },
    { id: 'd_dungeon', name: '1 dungeon kazan', metric: 'dungeonWins', target: 1, reward: { tips: 80 } },
  ],
  weekly: [
    { id: 'w_boss', name: 'Boss Mutfağı kazan', metric: 'bossKitchenWins', target: 1, reward: { tips: 400 } },
    { id: 'w_tower', name: 'Kulede 2 blok geç', metric: 'towerBlocks', target: 2, reward: { parts: 20 } },
    { id: 'w_runs', name: '10 koşu tamamla', metric: 'runs', target: 10, reward: { tips: 500 } },
  ],
};
export function questState(save, now) {
  const q = (save.quests ||= { day: '', week: '', daily: {}, weekly: {}, claimed: [] });
  const day = utcDay(now);
  const week = utcWeek(now);
  if (q.day !== day) {
    q.day = day;
    q.daily = {};
    q.claimed = q.claimed.filter((id) => !id.startsWith('d_'));
  }
  if (q.week !== week) {
    q.week = week;
    q.weekly = {};
    q.claimed = q.claimed.filter((id) => !id.startsWith('w_'));
  }
  return q;
}
export function recordQuest(save, metric, n, now) {
  if (!n) return;
  const q = questState(save, now);
  q.daily[metric] = (q.daily[metric] || 0) + n;
  q.weekly[metric] = (q.weekly[metric] || 0) + n;
}
export function questList(save, now) {
  const q = questState(save, now);
  return [...QUESTS.daily.map((d) => ({ ...d, kind: 'daily', progress: q.daily[d.metric] || 0 })), ...QUESTS.weekly.map((d) => ({ ...d, kind: 'weekly', progress: q.weekly[d.metric] || 0 }))]
    .map((x) => ({ ...x, done: x.progress >= x.target, claimed: q.claimed.includes(x.id) }));
}
export function claimQuest(save, id, now) {
  const q = questState(save, now);
  const x = questList(save, now).find((y) => y.id === id);
  if (!x) return { ok: false, reason: 'unknown' };
  if (x.claimed) return { ok: false, reason: 'claimed' };
  if (!x.done) return { ok: false, reason: 'progress' };
  q.claimed.push(id);
  save.tips += x.reward.tips || 0;
  save.currencyParts += x.reward.parts || 0;
  return { ok: true, reward: x.reward };
}
