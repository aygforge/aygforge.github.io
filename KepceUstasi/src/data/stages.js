// Alpha 0.4A stage-data adaptörü: data/alpha04_campaign_20.json -> motorun "chapter" biçimi.
// Motor (RunController, EnemyDirector, CombatResolver) değişmeden 6 dalga + final + 6 yetenek seçimi oynar.
// - Normal düşman canı = round(JSON enemyHpAlpha03[type] * level.hpScale)
// - Final karşılaşması: useExistingAlpha03Behavior ise mevcut boss tipi (giant_tomato / potato_king; çağırma,
//   savunma, hızlanma korunur), değilse mevcut sprite'ı kullanan, özel davranışı olmayan sentetik "final" düşman.
// - Alpha 0.1–0.3 chapter'ları (CHAPTERS) eski kayıtlar ve yarım koşular için aynen kalır.
import campaign from './alpha04/alpha04_campaign_20.json' with { type: 'json' };
import economy from './alpha04/alpha04_progression_economy.json' with { type: 'json' };
import dungeons from './alpha04/alpha04_dungeons.json' with { type: 'json' };
import { CHAPTERS, ENEMIES } from './content.js';

export const CAMPAIGN = campaign;
export const ECONOMY04 = economy;
export const LEVEL_COUNT = campaign.levels.length;
export const stageId = (n) => `L${n}`;

const BASE_CHAPTER = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));

function finalEnemyType(L) {
  const f = L.finalEncounter;
  if (f.useExistingAlpha03Behavior) return f.baseEnemyId; // real boss behaviour, HP/shield from balance
  const type = `final_L${L.level}`;
  const base = ENEMIES[f.baseEnemyId];
  ENEMIES[type] = {
    id: type,
    name: f.displayName,
    hp: f.hp,
    shield: f.shield || 0,
    move: f.move || 'one',
    recipe: null, // the final enemy completes the order, it is not a recipe ingredient
    speed: f.move === 'odd' ? 0.5 : 1,
    boss: true, // completion authority: defeating it wins the level (existing victory gate)
    contactDamage: f.contactDamage ?? 1,
    retreatX: f.retreatX ?? 0.62,
    sprite: f.spriteReuse || base.sprite || f.baseEnemyId,
    elite: true,
  };
  return type;
}

function buildStage(L) {
  const base = BASE_CHAPTER[L.chapterId];
  const eb = L.enemyBalance;
  const hp = Object.fromEntries(Object.entries(eb.alpha03BaseHpById).map(([t, v]) => [t, Math.max(1, Math.round(v * eb.hpScale))]));
  const f = L.finalEncounter;
  const boss = finalEnemyType(L);
  return {
    id: stageId(L.level),
    isStage: true,
    level: L.level,
    index: base.index, // engine-level chapter index (legacy unlock logic is not used for stages)
    chapterId: L.chapterId,
    withinChapter: L.withinChapter,
    stageType: L.stageType,
    name: L.name,
    customer: base.customer,
    tags: base.tags,
    recipe: { ...L.recipe },
    boss,
    finalName: f.displayName,
    baseTip: L.rewards.baseTips,
    firstClearBonus: L.rewards.firstClearTips,
    starMultipliers: L.rewards.starMultipliers,
    firstClearEnergyRefund: L.rewards.firstClearEnergyRefund || 0,
    unlocksOnFirstClear: L.unlocksOnFirstClear || [],
    recommendedChefPower: L.recommendedChefPower,
    powerWall: L.powerWall,
    energyCost: L.energyCost,
    bigOilRate: base.bigOilRate,
    dish: L.chapterId === 'menemen' ? 'dish_menemen' : 'dish_fries',
    balance: {
      hp,
      move: base.balance?.move, // Alpha 0.3 behaviour kept (quick salt in fries)
      bossHp: f.hp,
      bossShield: f.shield ?? null,
      spawnXMin: eb.spawnXRange[0],
      spawnXMax: eb.spawnXRange[1],
      bossX: base.balance?.bossX ?? 0.7,
    },
    waves: L.waves.map((w) => ({ ...w })),
  };
}

export const STAGES = campaign.levels.map(buildStage);

// ---------------------------------------------------------------- Alpha 0.4B dungeons (same engine)
// 4 normal waves + final, a skill pick after each normal wave, no recipe/star requirement. Enemy HP = Alpha03 base
// (JSON enemyHpAlpha03 of the matching chapter), spawn range = that chapter's Alpha03 balance.
const DUNGEON_BASE = { gold_kitchen: 'menemen', materials_depot: 'fries' };
function buildDungeon(d) {
  const def = economy.dungeons.definitions.find((x) => x.id === d.id);
  const chapterId = DUNGEON_BASE[d.id];
  const base = BASE_CHAPTER[chapterId];
  const hpBase = campaign.chapters.find((c) => c.id === chapterId).enemyHpAlpha03;
  const f = d.finalEncounter;
  const type = `final_${d.id}`;
  ENEMIES[type] = {
    id: type, name: f.displayName, hp: f.hp, shield: f.shield || 0, move: f.move || 'one', recipe: null,
    speed: 1, boss: true, contactDamage: f.contactDamage ?? 1, retreatX: f.retreatX ?? 0.62, sprite: f.spriteReuse, elite: true,
  };
  return {
    id: `D_${d.id}`,
    isDungeon: true,
    dungeonId: d.id,
    name: def.name,
    index: base.index,
    chapterId,
    tags: base.tags,
    recipe: {},
    boss: type,
    finalName: f.displayName,
    baseTip: 0,
    bigOilRate: base.bigOilRate,
    dish: chapterId === 'menemen' ? 'dish_menemen' : 'dish_fries',
    energyCost: economy.dungeons.runCostEnergy,
    unlockedAfterLevel: def.unlockedAfterLevel,
    reward: def,
    skillWaves: d.skillPicksAfterWaves,
    balance: { hp: { ...hpBase }, move: base.balance?.move, bossHp: f.hp, bossShield: f.shield ?? 0, spawnXMin: base.balance.spawnXMin, spawnXMax: base.balance.spawnXMax, bossX: base.balance?.bossX ?? 0.7 },
    waves: d.waves.map((w) => ({ ...w })),
  };
}
export const DUNGEONS = dungeons.encounters.map(buildDungeon);
export const dungeonById = (id) => DUNGEONS.find((d) => d.dungeonId === id) || null;
const BY_ID = Object.fromEntries([...STAGES, ...DUNGEONS].map((s) => [s.id, s]));

export function stageByLevel(n) {
  return STAGES[n - 1] || null;
}

// Single lookup used by the engine: campaign stage id ("L7") or legacy chapter id ("menemen").
export function findChapter(id) {
  return BY_ID[id] || BASE_CHAPTER[id] || null;
}
