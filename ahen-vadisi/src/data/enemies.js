// Yaratık / elit / boss tablosu — belge §5. Statlar kanoniktir, oyuncu gücüne göre ölçeklenmez.
// aggro / leash / range / speed birimi: tile. attackInterval: sn. respawn: sn (aktif oyun süresi).
import { goldRangeForLevel } from './constants.js';

const N = (o) => ({ kind: 'normal', lootTable: 'normal', gold: goldRangeForLevel(o.level), ...o });

export const ENEMIES = {
  // ---------------------------------------------------------- NORMAL (12)
  meadow_rat: N({
    id: 'meadow_rat', name: 'Çayır Sıçanı', level: 2, hp: 32, atk: 8, def: 2, mdef: 2, exp: 12,
    species: 'beast', ai: 'passive', aggro: 0, leash: 10, speed: 3.0, attackInterval: 1.6, attackRange: 1.15,
    dmgType: 'phys', respawn: 15, radius: 0.35, sprite: 'rat',
    materials: [{ id: 'small_fur', w: 1 }],
  }),
  gray_wolf: N({
    id: 'gray_wolf', name: 'Boz Kurt', level: 5, hp: 75, atk: 16, def: 8, mdef: 6, exp: 30,
    species: 'beast', ai: 'pack', aggro: 4.5, leash: 12, speed: 3.5, attackInterval: 1.5, attackRange: 1.3,
    dmgType: 'phys', respawn: 20, radius: 0.45, sprite: 'wolf',
    materials: [{ id: 'wolf_tooth', w: 1 }, { id: 'wolf_pelt', w: 1 }],
  }),
  thorn_rootling: N({
    id: 'thorn_rootling', name: 'Diken Kökçüsü', level: 7, hp: 125, atk: 23, def: 16, mdef: 9, exp: 45,
    species: 'plant', ai: 'tank', aggro: 3.5, leash: 10, speed: 2.2, attackInterval: 1.9, attackRange: 1.4,
    dmgType: 'phys', respawn: 22, radius: 0.45, sprite: 'rootling',
    materials: [{ id: 'root_essence', w: 1 }, { id: 'hard_wood', w: 1 }],
  }),
  forest_raider: N({
    id: 'forest_raider', name: 'Orman Yağmacısı', level: 9, hp: 190, atk: 34, def: 19, mdef: 15, exp: 65,
    species: 'humanoid', ai: 'aggressive', aggro: 5, leash: 12, speed: 3.1, attackInterval: 1.6, attackRange: 1.4,
    dmgType: 'phys', respawn: 24, radius: 0.4, sprite: 'raider',
    materials: [{ id: 'hunter_cloth', w: 1 }],
  }),
  pick_goblin: N({
    id: 'pick_goblin', name: 'Kazmacı Goblin', level: 10, hp: 210, atk: 37, def: 22, mdef: 18, exp: 74,
    species: 'humanoid', ai: 'pack', aggro: 4.5, leash: 12, speed: 3.2, attackInterval: 1.6, attackRange: 1.3,
    dmgType: 'phys', respawn: 24, radius: 0.38, sprite: 'goblin',
    materials: [{ id: 'iron_scrap', w: 1 }],
  }),
  cave_bat: N({
    id: 'cave_bat', name: 'Mağara Yarasası', level: 11, hp: 165, atk: 29, def: 12, mdef: 14, exp: 68,
    species: 'beast', ai: 'aggressive', aggro: 6, leash: 13, speed: 4.1, attackInterval: 1.25, attackRange: 1.25,
    dmgType: 'phys', respawn: 18, radius: 0.35, sprite: 'bat', flying: true,
    materials: [{ id: 'bat_wing', w: 1 }],
  }),
  ironshell_beetle: N({
    id: 'ironshell_beetle', name: 'Demir Kabuklu Böcek', level: 13, hp: 330, atk: 47, def: 44, mdef: 15, exp: 112,
    species: 'insect', ai: 'tank', aggro: 3, leash: 10, speed: 2.0, attackInterval: 2.0, attackRange: 1.45,
    dmgType: 'phys', respawn: 26, radius: 0.5, sprite: 'beetle',
    materials: [{ id: 'hard_shell', w: 1 }],
  }),
  ore_priest: N({
    id: 'ore_priest', name: 'Cevher Rahibi', level: 15, hp: 270, atk: 59, def: 18, mdef: 26, exp: 133,
    species: 'humanoid', ai: 'ranged', aggro: 6.5, leash: 13, speed: 2.6, attackInterval: 2.0, attackRange: 5.5,
    dmgType: 'magic', respawn: 26, radius: 0.4, sprite: 'priest', projectile: 'ore_bolt',
    materials: [{ id: 'magic_ore', w: 1 }],
  }),
  swamp_leech: N({
    id: 'swamp_leech', name: 'Bataklık Sülüğü', level: 15, hp: 295, atk: 55, def: 23, mdef: 18, exp: 133,
    species: 'insect', ai: 'aggressive', aggro: 4.5, leash: 11, speed: 2.6, attackInterval: 1.7, attackRange: 1.35,
    dmgType: 'phys', respawn: 24, radius: 0.45, sprite: 'leech', poison: { pct: 0.12, dur: 4, chance: 0.3 },
    materials: [{ id: 'leech_essence', w: 1 }],
  }),
  mud_dwarf: N({
    id: 'mud_dwarf', name: 'Çamur Cücesi', level: 16, hp: 320, atk: 62, def: 25, mdef: 20, exp: 148,
    species: 'humanoid', ai: 'pack', aggro: 5, leash: 12, speed: 2.9, attackInterval: 1.7, attackRange: 1.35,
    dmgType: 'phys', respawn: 26, radius: 0.42, sprite: 'dwarf',
    materials: [{ id: 'swamp_mud', w: 1 }],
  }),
  mist_witch: N({
    id: 'mist_witch', name: 'Sis Cadısı', level: 18, hp: 390, atk: 78, def: 22, mdef: 35, exp: 190,
    species: 'humanoid', ai: 'ranged', aggro: 6.5, leash: 13, speed: 2.8, attackInterval: 2.1, attackRange: 5.5,
    dmgType: 'magic', respawn: 28, radius: 0.4, sprite: 'witch', projectile: 'mist_bolt', flying: true,
    poison: { pct: 0.10, dur: 4, chance: 0.35 },
    materials: [{ id: 'toxic_crystal', w: 1 }],
  }),
  rotten_guard: N({
    id: 'rotten_guard', name: 'Çürük Muhafız', level: 19, hp: 560, atk: 94, def: 52, mdef: 37, exp: 240,
    species: 'undead', ai: 'tank', aggro: 4.5, leash: 11, speed: 2.4, attackInterval: 2.0, attackRange: 1.5,
    dmgType: 'phys', respawn: 30, radius: 0.48, sprite: 'guard',
    materials: [{ id: 'old_armor_scrap', w: 1 }],
  }),

  // ---------------------------------------------------------- ELİT (3)
  bandit_captain: {
    id: 'bandit_captain', name: 'Haydut Kaptanı', kind: 'elite', level: 10, hp: 1350, atk: 55, def: 27, mdef: 21, exp: 280,
    species: 'humanoid', ai: 'elite', aggro: 6, leash: 14, speed: 3.1, attackInterval: 1.7, attackRange: 1.6,
    dmgType: 'phys', radius: 0.55, sprite: 'captain', lootTable: 'elite', gold: [30, 55],
    guaranteed: [{ id: 'captain_badge', qty: [1, 1] }],
    abilities: ['spin_slash'], materials: [{ id: 'hunter_cloth', w: 1 }],
  },
  red_vein_watcher: {
    id: 'red_vein_watcher', name: 'Kızıl Damar Gözcüsü', kind: 'elite', level: 15, hp: 2200, atk: 84, def: 40, mdef: 25, exp: 500,
    species: 'construct', ai: 'elite', aggro: 6, leash: 14, speed: 2.6, attackInterval: 1.9, attackRange: 1.8,
    dmgType: 'phys', radius: 0.65, sprite: 'watcher', lootTable: 'elite', gold: [45, 80],
    guaranteed: [{ id: 'watcher_seal', qty: [1, 1] }],
    abilities: ['crystal_beam'], materials: [{ id: 'magic_ore', w: 1 }],
  },
  swamp_executioner: {
    id: 'swamp_executioner', name: 'Bataklık Celladı', kind: 'elite', level: 19, hp: 3600, atk: 128, def: 55, mdef: 40, exp: 850,
    species: 'undead', ai: 'elite', aggro: 6, leash: 14, speed: 2.5, attackInterval: 2.1, attackRange: 1.9,
    dmgType: 'phys', radius: 0.7, sprite: 'executioner', lootTable: 'elite', gold: [70, 120],
    guaranteed: [{ id: 'executioner_brand', qty: [1, 1] }],
    poison: { pct: 0.10, dur: 5, chance: 0.25 },
    abilities: ['execution_cleave'], materials: [{ id: 'old_armor_scrap', w: 1 }],
  },
  // Derin Ocak 3. bölüm: güçlendirilmiş Gözcü (aynı elit tür, dungeon varyantı)
  watcher_empowered: {
    id: 'watcher_empowered', name: 'Güçlendirilmiş Gözcü', variantOf: 'red_vein_watcher', kind: 'elite', level: 18,
    hp: 3300, atk: 100, def: 48, mdef: 30, exp: 650,
    species: 'construct', ai: 'elite', aggro: 7, leash: 16, speed: 2.7, attackInterval: 1.8, attackRange: 1.8,
    dmgType: 'phys', radius: 0.7, sprite: 'watcher', tint: 0xff9a9a, lootTable: 'elite', gold: [60, 100],
    guaranteed: [{ id: 'watcher_seal', qty: [2, 2] }],
    abilities: ['crystal_beam'], materials: [{ id: 'magic_ore', w: 1 }],
  },

  // ---------------------------------------------------------- BOSS (2)
  alpha_wolf: {
    id: 'alpha_wolf', name: 'Alfa Kurt', kind: 'boss', level: 11, hp: 5200, atk: 92, def: 35, mdef: 32, exp: 450,
    species: 'beast', ai: 'boss_alpha', aggro: 7, leash: 13, speed: 3.6, attackInterval: 1.6, attackRange: 1.9,
    dmgType: 'phys', radius: 0.85, sprite: 'alpha', lootTable: 'alpha', gold: [80, 130],
    guaranteed: [{ id: 'alpha_claw', qty: [1, 2] }],
    respawn: 600,
  },
  mine_golem: {
    id: 'mine_golem', name: 'Maden Golemi', kind: 'boss', level: 20, hp: 20000, atk: 155, def: 75, mdef: 65, exp: 1600,
    species: 'construct', ai: 'boss_golem', aggro: 9, leash: 30, speed: 2.3, attackInterval: 2.2, attackRange: 2.4,
    dmgType: 'phys', radius: 1.3, sprite: 'golem', lootTable: 'golem', gold: [180, 260],
    guaranteed: [{ id: 'golem_shard', qty: [2, 3] }],
    extraRolls: [{ id: 'ancient_core', chance: 0.25 }],
  },

  // ---------------------------------------------------------- YARDIMCI (sayılmaz, EXP/loot vermez)
  pack_wolf: {
    id: 'pack_wolf', name: 'Sürü Kurdu', kind: 'summon', level: 9, hp: 260, atk: 40, def: 15, mdef: 12, exp: 0,
    species: 'beast', ai: 'aggressive', aggro: 12, leash: 16, speed: 3.7, attackInterval: 1.5, attackRange: 1.3,
    dmgType: 'phys', radius: 0.45, sprite: 'wolf', tint: 0xb0a090, lootTable: null, gold: [0, 0], noReward: true,
  },
  shield_crystal: {
    id: 'shield_crystal', name: 'Kalkan Kristali', kind: 'summon', level: 20, hp: 800, atk: 0, def: 10, mdef: 10, exp: 0,
    species: 'construct', ai: 'static', aggro: 0, leash: 0, speed: 0, attackInterval: 99, attackRange: 0,
    dmgType: 'phys', radius: 0.5, sprite: 'crystal', lootTable: null, gold: [0, 0], noReward: true,
  },
  training_dummy: {
    id: 'training_dummy', name: 'Saman Kukla', kind: 'dummy', level: 1, hp: 40, atk: 0, def: 0, mdef: 0, exp: 0,
    species: 'construct', ai: 'static', aggro: 0, leash: 0, speed: 0, attackInterval: 99, attackRange: 0,
    dmgType: 'phys', radius: 0.4, sprite: 'dummy', lootTable: null, gold: [0, 0], noReward: true, respawn: 4,
  },
};

export const NORMAL_IDS = Object.values(ENEMIES).filter((e) => e.kind === 'normal').map((e) => e.id);
export const ELITE_IDS = Object.values(ENEMIES).filter((e) => e.kind === 'elite' && !e.variantOf).map((e) => e.id);
export const BOSS_IDS = Object.values(ENEMIES).filter((e) => e.kind === 'boss').map((e) => e.id);
