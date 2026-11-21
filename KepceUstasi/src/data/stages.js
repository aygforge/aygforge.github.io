// Alpha 0.4A stage-data adaptörü: data/alpha04_campaign_20.json -> motorun "chapter" biçimi.
// Motor (RunController, EnemyDirector, CombatResolver) değişmeden 6 dalga + final + 6 yetenek seçimi oynar.
// - Normal düşman canı = round(JSON enemyHpAlpha03[type] * level.hpScale)
// - Final karşılaşması: useExistingAlpha03Behavior ise mevcut boss tipi (giant_tomato / potato_king; çağırma,
//   savunma, hızlanma korunur), değilse mevcut sprite'ı kullanan, özel davranışı olmayan sentetik "final" düşman.
// - Alpha 0.1–0.3 chapter'ları (CHAPTERS) eski kayıtlar ve yarım koşular için aynen kalır.
import campaign from './alpha04/alpha04_campaign_20.json' with { type: 'json' };
import economy from './alpha04/alpha04_progression_economy.json' with { type: 'json' };
import dungeons from './alpha04/alpha04_dungeons.json' with { type: 'json' };
import identity from './alpha04/alpha04c_level_identity_20.json' with { type: 'json' };
import omelet from './alpha05/alpha05a_level_21_30.json' with { type: 'json' };
import { CHAPTERS, ENEMIES } from './content.js';

export const CAMPAIGN = campaign;
export const ECONOMY04 = economy;
export const IDENTITY = identity;
export const OMELET = omelet; // Alpha 0.5A: L21–30 Mantarlı Omlet
const ALL_LEVELS = [...identity.levels, ...omelet.levels];
export const LEVEL_COUNT = ALL_LEVELS.length;
export const stageId = (n) => `L${n}`;

const BASE_CHAPTER = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
// Alpha 0.5A: engine base for chapter 3 (only used by stages L21–30; not a legacy playable chapter)
const OMELET_BASE = {
  id: 'omelet', index: 3, name: omelet.chapters[0].name, customer: 'Kahvaltı müdavimi', tags: ['mushroom', 'onion', 'egg'],
  bigOilRate: 0.08, balance: { bossX: 0.7 },
};
const STAGE_BASE = { ...BASE_CHAPTER, omelet: OMELET_BASE };
const DISH = { menemen: 'dish_menemen', fries: 'dish_fries', omelet: 'dish_omelet' };

// Alpha 0.4C: levels come from the level-identity JSON (names, 3–6 waves, own recipes, 1–2 final enemies,
// spawn style, big-oil multiplier). Rewards/energy/unlocks/SG keep the 0.4A values carried in the same file.
// Chapter bosses (L10 / L20) keep the existing boss type and AI.
function finalTypes(L) {
  const f = L.finalEncounter;
  if (f.keepAlpha04BBossBehavior || f.originalData?.useExistingAlpha03Behavior) {
    const o = f.originalData;
    return { types: [o.baseEnemyId], names: [o.displayName], bossHp: o.hp, bossShield: o.shield ?? null };
  }
  if (f.type === 'chapter_boss' && f.enemies[0]?.useNewChapterBossBehavior) {
    const o = f.enemies[0]; // Alpha 0.5A Koca Mantar: own type + AI (EnemyDirector), HP/shield from the JSON
    return { types: [o.baseEnemyId], names: [o.displayName], bossHp: o.hp, bossShield: o.shield ?? null };
  }
  const omeletCh = L.chapterId === 'omelet';
  const types = f.enemies.map((e, i) => {
    const type = `final_L${L.level}_${i + 1}`;
    const base = ENEMIES[e.baseEnemyId];
    ENEMIES[type] = {
      id: type,
      name: e.displayName,
      hp: e.hp,
      shield: e.shield || 0,
      move: e.move || base.move, // the elite moves like its base vegetable (still only once per turn, leftwards)
      // 0.4C finals are not ingredients; 0.5A finals count once for their ingredient (chapter ingredientAliases)
      recipe: omeletCh ? omelet.chapters[0].ingredientAliases[e.baseEnemyId] || null : null,
      shell: e.shellHP ?? base.shell ?? 0, // onion finals: own shell (not scaled)
      crackSpeed: !!base.crackSpeed,
      guardPulse: !!base.guardPulse, // a guard-based final still shields the other final
      halfHpShield: e.uniqueRule === 'eliteHalfHpShieldOnce' ? { gain: e.shieldGrantedAtHalfHp ?? 2, cap: e.shieldCap ?? 4 } : null,
      speed: base.speed,
      boss: true, // completion authority: ALL finals must be defeated (CombatResolver victory gate)
      contactDamage: e.contactDamage ?? base.contactDamage ?? 1,
      retreatX: e.retreatX ?? 0.62,
      sprite: e.spriteReuse || base.sprite || e.baseEnemyId,
      elite: true,
      miniBoss: !!e.isMiniBoss,
      tint: f.enemies.length > 1 ? [0xffd0a0, 0xa0d8ff][i] : e.isMiniBoss ? 0xffc0c0 : 0xffe9a0, // small visual cue only
    };
    return type;
  });
  // synthetic finals carry their own HP/shield -> no stage-level boss override
  return { types, names: f.enemies.map((e) => e.displayName), bossHp: null, bossShield: null };
}

function buildStage(L) {
  const base = STAGE_BASE[L.chapterId];
  const eb = L.enemyBalance;
  const id = L.stageIdentity || {};
  const hp = Object.fromEntries(Object.entries(eb.alpha03BaseHpById || eb.baseHpById).map(([t, v]) => [t, Math.max(1, Math.round(v * eb.hpScale))]));
  const fin = finalTypes(L);
  return {
    id: stageId(L.level),
    isStage: true,
    level: L.level,
    index: base.index, // engine-level chapter index (legacy unlock logic is not used for stages)
    chapterId: L.chapterId,
    withinChapter: L.withinChapter,
    stageType: L.stageType,
    name: L.name,
    identity: { format: id.format, spawnStyle: id.spawnStyle || 'normal', label: id.onScreenRuleLabel || '', subtitle: id.displaySubtitle || L.name },
    customer: base.customer,
    tags: base.tags,
    recipe: { ...L.recipe },
    boss: fin.types[0],
    finals: fin.types,
    finalName: fin.names.join(' + '),
    baseTip: L.rewards.baseTips,
    firstClearBonus: L.rewards.firstClearTips,
    starMultipliers: L.rewards.starMultipliers,
    firstClearEnergyRefund: L.rewards.firstClearEnergyRefund || 0,
    unlocksOnFirstClear: L.unlocksOnFirstClear || [],
    recommendedChefPower: L.recommendedChefPower,
    powerWall: L.powerWall,
    energyCost: L.energyCost,
    // pot_bonus: only the big-oil roll chance changes (RunController still caps it at 18 %)
    bigOilRate: +(base.bigOilRate * (id.bigOilRateMultiplier || 1)).toFixed(4),
    dish: DISH[L.chapterId],
    skillWaves: L.skillPicksAfterWaves || L.waves.map((_, i) => i + 1),
    balance: {
      hp,
      move: base.balance?.move, // Alpha 0.3 behaviour kept (quick salt in fries)
      bossHp: fin.bossHp,
      bossShield: fin.bossShield,
      spawnXMin: eb.spawnXRange[0],
      spawnXMax: eb.spawnXRange[1],
      bossX: base.balance?.bossX ?? 0.7,
    },
    waves: L.waves.map((w) => ({ ...w })),
  };
}

export const STAGES = ALL_LEVELS.map(buildStage);

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
