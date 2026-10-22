// Yaratık / elit / boss tablosu — belge §5. Statlar kanoniktir, oyuncu gücüne göre ölçeklenmez.
// normalCoef: normal (telegrafsız) saldırının ATK katsayısı (belgede tanımsız; V1 denge kararı).
// Elit/boss büyük saldırıları telegraflıdır ve tam ATK × yetenek katsayısıyla vurur.
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
    species: 'humanoid', ai: 'aggressive', aggro: 4, leash: 12, speed: 3.1, attackInterval: 1.6, attackRange: 1.4,
    dmgType: 'phys', respawn: 24, radius: 0.4, sprite: 'raider',
    materials: [{ id: 'hunter_cloth', w: 1 }],
  }),
  pick_goblin: N({
    id: 'pick_goblin', name: 'Kazmacı Goblin', level: 10, hp: 210, atk: 37, def: 22, mdef: 18, exp: 74,
    species: 'humanoid', ai: 'pack', aggro: 4, leash: 12, speed: 3.2, attackInterval: 1.6, attackRange: 1.3,
    dmgType: 'phys', respawn: 24, radius: 0.38, sprite: 'goblin',
    materials: [{ id: 'iron_scrap', w: 1 }],
  }),
  cave_bat: N({
    id: 'cave_bat', name: 'Mağara Yarasası', level: 11, hp: 165, atk: 29, def: 12, mdef: 14, exp: 68,
    species: 'beast', ai: 'aggressive', aggro: 5, leash: 13, speed: 4.1, attackInterval: 1.25, attackRange: 1.25,
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
    species: 'humanoid', ai: 'ranged', aggro: 5, leash: 13, speed: 2.6, attackInterval: 2.0, attackRange: 5.5,
    dmgType: 'magic', respawn: 26, radius: 0.4, sprite: 'priest', projectile: 'ore_bolt',
    materials: [{ id: 'magic_ore', w: 1 }],
  }),
  swamp_leech: N({
    id: 'swamp_leech', name: 'Bataklık Balçığı', level: 15, hp: 295, atk: 55, def: 23, mdef: 18, exp: 133,
    species: 'insect', ai: 'aggressive', aggro: 4.5, leash: 11, speed: 2.6, attackInterval: 1.7, attackRange: 1.35,
    dmgType: 'phys', respawn: 24, radius: 0.45, sprite: 'leech', poison: { pct: 0.12, dur: 4, chance: 0.3 },
    materials: [{ id: 'leech_essence', w: 1 }],
  }),
  mud_dwarf: N({
    id: 'mud_dwarf', name: 'Çamur Cücesi', level: 16, hp: 320, atk: 62, def: 25, mdef: 20, exp: 148,
    species: 'humanoid', ai: 'pack', aggro: 4.5, leash: 12, speed: 2.9, attackInterval: 1.7, attackRange: 1.35,
    dmgType: 'phys', respawn: 26, radius: 0.42, sprite: 'dwarf',
    materials: [{ id: 'swamp_mud', w: 1 }],
  }),
  mist_witch: N({
    id: 'mist_witch', name: 'Sis Cadısı', level: 18, hp: 390, atk: 78, def: 22, mdef: 35, exp: 190,
    species: 'humanoid', ai: 'ranged', aggro: 4.5, leash: 13, speed: 2.8, attackInterval: 2.1, attackRange: 5.5,
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
    id: 'bandit_captain', normalCoef: 0.7, name: 'Haydut Kaptanı', kind: 'elite', level: 10, hp: 1350, atk: 55, def: 27, mdef: 21, exp: 280,
    species: 'humanoid', ai: 'elite', aggro: 6, leash: 14, speed: 3.1, attackInterval: 1.7, attackRange: 1.6,
    dmgType: 'phys', radius: 0.55, sprite: 'captain', lootTable: 'elite', gold: [30, 55],
    guaranteed: [{ id: 'captain_badge', qty: [1, 1] }],
    abilities: ['spin_slash'], materials: [{ id: 'hunter_cloth', w: 1 }],
  },
  red_vein_watcher: {
    id: 'red_vein_watcher', normalCoef: 0.7, name: 'Kızıl Damar Gözcüsü', kind: 'elite', level: 15, hp: 2200, atk: 84, def: 40, mdef: 25, exp: 500,
    species: 'construct', ai: 'elite', aggro: 6, leash: 14, speed: 2.6, attackInterval: 1.9, attackRange: 1.8,
    dmgType: 'phys', radius: 0.65, sprite: 'watcher', flying: true, lootTable: 'elite', gold: [45, 80],
    guaranteed: [{ id: 'watcher_seal', qty: [1, 1] }],
    abilities: ['crystal_beam'], materials: [{ id: 'magic_ore', w: 1 }],
  },
  swamp_executioner: {
    id: 'swamp_executioner', normalCoef: 0.7, name: 'Bataklık Celladı', kind: 'elite', level: 19, hp: 3600, atk: 128, def: 55, mdef: 40, exp: 850,
    species: 'undead', ai: 'elite', aggro: 6, leash: 14, speed: 2.5, attackInterval: 2.1, attackRange: 1.9,
    dmgType: 'phys', radius: 0.7, sprite: 'executioner', lootTable: 'elite', gold: [70, 120],
    guaranteed: [{ id: 'executioner_brand', qty: [1, 1] }],
    poison: { pct: 0.10, dur: 5, chance: 0.25 },
    abilities: ['execution_cleave'], materials: [{ id: 'old_armor_scrap', w: 1 }],
  },
  // Derin Ocak 3. bölüm: güçlendirilmiş Gözcü (aynı elit tür, dungeon varyantı)
  watcher_empowered: {
    id: 'watcher_empowered', normalCoef: 0.7, name: 'Güçlendirilmiş Gözcü', variantOf: 'red_vein_watcher', kind: 'elite', level: 18,
    hp: 3300, atk: 100, def: 48, mdef: 30, exp: 650,
    species: 'construct', ai: 'elite', aggro: 7, leash: 16, speed: 2.7, attackInterval: 1.8, attackRange: 1.8,
    dmgType: 'phys', radius: 0.7, sprite: 'watcher', packId: 'mon_red_vein_watcher', flying: true, tint: 0xff9a9a, lootTable: 'elite', gold: [60, 100],
    guaranteed: [{ id: 'watcher_seal', qty: [2, 2] }],
    abilities: ['crystal_beam'], materials: [{ id: 'magic_ore', w: 1 }],
  },

  // ---------------------------------------------------------- BOSS (2)
  alpha_wolf: {
    id: 'alpha_wolf', normalCoef: 0.35, name: 'Alfa Kurt', kind: 'boss', level: 11, hp: 5200, atk: 92, def: 35, mdef: 32, exp: 450,
    species: 'beast', ai: 'boss_alpha', aggro: 7, leash: 13, speed: 3.6, attackInterval: 2.0, attackRange: 1.9,
    dmgType: 'phys', radius: 0.85, sprite: 'alpha', lootTable: 'alpha', gold: [80, 130],
    guaranteed: [{ id: 'alpha_claw', qty: [1, 2] }],
    respawn: 600,
  },
  mine_golem: {
    id: 'mine_golem', normalCoef: 0.5, name: 'Maden Golemi', kind: 'boss', level: 20, hp: 20000, atk: 155, def: 75, mdef: 65, exp: 1600,
    species: 'construct', ai: 'boss_golem', aggro: 9, leash: 30, speed: 2.3, attackInterval: 2.2, attackRange: 2.4,
    dmgType: 'phys', radius: 1.3, sprite: 'golem', lootTable: 'golem', gold: [180, 260],
    guaranteed: [{ id: 'golem_shard', qty: [2, 3] }],
    extraRolls: [{ id: 'ancient_core', chance: 0.25 }],
  },

  // ========================================================== V2.0 — KÜL VE AYAZ
  // Normal (8). Değerler belge V2 §5'ten; davranış/menzil/hız V2 denge kararıdır.
  ash_imp: N({
    id: 'ash_imp', name: 'Kül Cini', level: 21, hp: 670, atk: 105, def: 54, mdef: 45, exp: 250,
    species: 'elemental', ai: 'aggressive', aggro: 5.5, leash: 13, speed: 4.2, attackInterval: 1.15, attackRange: 1.25,
    dmgType: 'magic', respawn: 22, radius: 0.38, sprite: 'ash_imp', flying: true, deathFx: 'ash',
    materials: [{ id: 'ash_dust', w: 1 }],
  }),
  ash_hunter: N({
    id: 'ash_hunter', name: 'Kül Avcısı', level: 23, hp: 770, atk: 120, def: 60, mdef: 48, exp: 300,
    species: 'humanoid', ai: 'ranged', aggro: 6, leash: 14, speed: 3.0, attackInterval: 1.9, attackRange: 5.2,
    dmgType: 'phys', respawn: 26, radius: 0.4, sprite: 'ash_hunter', projectile: 'ember_bolt', deathFx: 'ash',
    materials: [{ id: 'crimson_hide', w: 1 }],
  }),
  crimson_scorpion: N({
    id: 'crimson_scorpion', name: 'Kızıl Akrep', level: 24, hp: 930, atk: 125, def: 75, mdef: 43, exp: 340,
    species: 'insect', ai: 'tank', aggro: 4, leash: 11, speed: 2.5, attackInterval: 1.9, attackRange: 1.45,
    dmgType: 'phys', respawn: 26, radius: 0.5, sprite: 'crimson_scorpion', poison: { pct: 0.08, dur: 3, chance: 0.3 },
    materials: [{ id: 'scorpion_stinger', w: 1 }],
  }),
  burnt_warrior: N({
    id: 'burnt_warrior', name: 'Yanık Savaşçı', level: 25, hp: 1050, atk: 142, def: 70, mdef: 58, exp: 390,
    species: 'undead', ai: 'aggressive', aggro: 4.5, leash: 12, speed: 2.5, attackInterval: 2.1, attackRange: 1.55,
    dmgType: 'phys', respawn: 28, radius: 0.48, sprite: 'burnt_warrior', deathFx: 'ash',
    materials: [{ id: 'burnt_chain', w: 1 }],
  }),
  frost_wolf: N({
    id: 'frost_wolf', name: 'Ayaz Kurdu', level: 26, hp: 1100, atk: 148, def: 72, mdef: 65, exp: 410,
    species: 'beast', ai: 'pack', aggro: 5, leash: 13, speed: 4.0, attackInterval: 1.4, attackRange: 1.35,
    dmgType: 'phys', respawn: 24, radius: 0.48, sprite: 'frost_wolf',
    materials: [{ id: 'frost_pelt', w: 1 }],
  }),
  ice_wisp: N({
    id: 'ice_wisp', name: 'Buz Ruhçuk', level: 27, hp: 850, atk: 153, def: 46, mdef: 76, exp: 450,
    species: 'elemental', ai: 'aggressive', aggro: 5, leash: 13, speed: 3.4, attackInterval: 1.6, attackRange: 1.5,
    dmgType: 'magic', respawn: 24, radius: 0.38, sprite: 'ice_wisp', flying: true, deathFx: 'ice',
    materials: [{ id: 'pure_ice', w: 1 }],
  }),
  frost_sentinel: N({
    id: 'frost_sentinel', name: 'Buz Zırhlı Nöbetçi', level: 28, hp: 1450, atk: 184, def: 95, mdef: 72, exp: 500,
    species: 'undead', ai: 'tank', aggro: 4, leash: 11, speed: 2.0, attackInterval: 2.3, attackRange: 1.6,
    dmgType: 'phys', respawn: 30, radius: 0.52, sprite: 'frost_sentinel', deathFx: 'ice',
    materials: [{ id: 'ice_armor_shard', w: 1 }],
  }),
  snow_shaman: N({
    id: 'snow_shaman', name: 'Kar Şamanı', level: 29, hp: 1200, atk: 190, def: 65, mdef: 97, exp: 550,
    species: 'humanoid', ai: 'ranged', aggro: 6, leash: 14, speed: 2.7, attackInterval: 2.1, attackRange: 5.5,
    dmgType: 'magic', respawn: 30, radius: 0.42, sprite: 'snow_shaman', projectile: 'frost_bolt',
    slow: { pct: 0.25, dur: 2, chance: 0.35 },
    materials: [{ id: 'snow_seal', w: 1 }],
  }),

  // Elit (2): V1 elit çıkma kuralı (kendi kampında 25 öldürme + 120 sn), Epic %0,75, Legendary yok.
  ash_butcher: {
    id: 'ash_butcher', normalCoef: 0.7, name: 'Kül Kasabı', kind: 'elite', level: 25, hp: 5800, atk: 170, def: 82, mdef: 65, exp: 950,
    species: 'humanoid', ai: 'elite', aggro: 6, leash: 14, speed: 2.7, attackInterval: 2.0, attackRange: 1.9,
    dmgType: 'phys', radius: 0.72, sprite: 'ash_butcher', lootTable: 'elite', gold: [90, 150], deathFx: 'ash',
    guaranteed: [{ id: 'butcher_mark', qty: [1, 1] }],
    extraRolls: [{ id: 'mastery_book', chance: 0.015 }],
    abilities: ['butcher_cleave'], enrage: { below: 0.3, atkSpd: 0.7, speed: 1.25 },
    materials: [{ id: 'burnt_chain', w: 1 }],
  },
  ice_warden: {
    id: 'ice_warden', normalCoef: 0.7, name: 'Buz Gardiyanı', kind: 'elite', level: 29, hp: 8500, atk: 225, def: 110, mdef: 95, exp: 1600,
    species: 'construct', ai: 'elite', aggro: 6, leash: 14, speed: 2.3, attackInterval: 2.2, attackRange: 2.0,
    dmgType: 'phys', radius: 0.78, sprite: 'ice_warden', lootTable: 'elite', gold: [120, 190], deathFx: 'ice',
    guaranteed: [{ id: 'warden_seal', qty: [1, 1] }],
    extraRolls: [{ id: 'mastery_book', chance: 0.02 }],
    abilities: ['ice_slam'],
    materials: [{ id: 'ice_armor_shard', w: 1 }],
  },

  // Boss (2)
  ash_giant: {
    id: 'ash_giant', normalCoef: 0.45, name: 'Kül Devi', kind: 'boss', level: 26, hp: 35000, atk: 250, def: 110, mdef: 100, exp: 2600,
    species: 'elemental', ai: 'boss_ash', aggro: 8, leash: 16, speed: 2.2, attackInterval: 2.3, attackRange: 2.6,
    dmgType: 'phys', radius: 1.4, sprite: 'ash_giant', lootTable: 'ash_giant', gold: [300, 420], deathFx: 'ash',
    guaranteed: [{ id: 'giant_ember', qty: [2, 3] }],
    extraRolls: [{ id: 'ancient_core', chance: 0.15 }, { id: 'mastery_book', chance: 0.06 }],
    respawn: 900,
  },
  frozen_guardian: {
    id: 'frozen_guardian', normalCoef: 0.45, name: 'Donmuş Muhafız', kind: 'boss', level: 30, hp: 55000, atk: 310, def: 150, mdef: 130, exp: 4200,
    species: 'construct', ai: 'boss_frost', aggro: 10, leash: 30, speed: 2.2, attackInterval: 2.4, attackRange: 2.6,
    dmgType: 'phys', radius: 1.4, sprite: 'frozen_guardian', lootTable: 'frost_keeper', gold: [420, 560], deathFx: 'ice',
    guaranteed: [{ id: 'frozen_core', qty: [1, 2] }],
    extraRolls: [{ id: 'ancient_core', chance: 0.3 }, { id: 'mastery_book', chance: 0.1 }],
  },

  // ---------------------------------------------------------- V3: ÖLÜ KRALLIK (Lv.31–34) ve KARA TAHT (Lv.36–39)
  // Statlar belge başlangıç değerleridir; öldürme süresi yalnız HP ile değil davranışla uzar (bkz. tests/unit/v3balance).
  shroud_crawler: N({
    id: 'shroud_crawler', name: 'Kefen Sürüngeni', level: 31, hp: 1700, atk: 220, def: 100, mdef: 95, exp: 620,
    species: 'undead', ai: 'aggressive', aggro: 5, leash: 12, speed: 4.3, attackInterval: 1.25, attackRange: 1.3,
    dmgType: 'phys', respawn: 22, radius: 0.48, sprite: 'shroud_crawler', deathFx: 'bone',
    materials: [{ id: 'shroud_cloth', w: 1 }],
  }),
  bone_archer: N({
    id: 'bone_archer', name: 'Kemik Okçu', level: 32, hp: 1600, atk: 245, def: 95, mdef: 130, exp: 700,
    species: 'undead', ai: 'ranged', aggro: 6.5, leash: 14, speed: 2.8, attackInterval: 2.0, attackRange: 6,
    dmgType: 'phys', respawn: 24, radius: 0.42, sprite: 'bone_archer', projectile: 'bone_arrow', deathFx: 'bone',
    materials: [{ id: 'bone_tip', w: 1 }],
  }),
  cursed_guard: N({
    id: 'cursed_guard', name: 'Lanetli Muhafız', level: 33, hp: 2400, atk: 270, def: 155, mdef: 115, exp: 780,
    species: 'undead', ai: 'tank', aggro: 4, leash: 11, speed: 2.1, attackInterval: 2.2, attackRange: 1.6,
    dmgType: 'phys', respawn: 28, radius: 0.52, sprite: 'cursed_guard', deathFx: 'bone',
    materials: [{ id: 'cursed_metal', w: 1 }],
  }),
  grave_mage: N({
    id: 'grave_mage', name: 'Mezar Büyücüsü', level: 34, hp: 1950, atk: 285, def: 105, mdef: 175, exp: 870,
    species: 'undead', ai: 'ranged', aggro: 6, leash: 14, speed: 2.6, attackInterval: 2.3, attackRange: 5.5,
    dmgType: 'magic', respawn: 28, radius: 0.42, sprite: 'grave_mage', projectile: 'void_bolt', deathFx: 'bone',
    abilities: ['grave_curse'],
    materials: [{ id: 'grave_dust', w: 1 }],
  }),
  obsidian_sentinel: N({
    id: 'obsidian_sentinel', name: 'Obsidyen Nöbetçi', level: 36, hp: 3000, atk: 315, def: 185, mdef: 140, exp: 1050,
    species: 'construct', ai: 'tank', aggro: 4, leash: 11, speed: 1.9, attackInterval: 2.6, attackRange: 1.7,
    dmgType: 'phys', respawn: 30, radius: 0.6, sprite: 'obsidian_sentinel', deathFx: 'void',
    abilities: ['heavy_slam'],
    materials: [{ id: 'obsidian_shard', w: 1 }],
  }),
  shadow_hunter: N({
    id: 'shadow_hunter', name: 'Gölge Avcısı', level: 37, hp: 2400, atk: 335, def: 125, mdef: 180, exp: 1150,
    species: 'humanoid', ai: 'skirmish', aggro: 6, leash: 14, speed: 3.6, attackInterval: 1.6, attackRange: 1.4,
    dmgType: 'phys', respawn: 26, radius: 0.44, sprite: 'shadow_hunter', deathFx: 'void',
    abilities: ['shadow_dash'],
    materials: [{ id: 'shadow_essence', w: 1 }],
  }),
  throne_executioner: N({
    id: 'throne_executioner', name: 'Taht Celladı', level: 38, hp: 3600, atk: 370, def: 215, mdef: 160, exp: 1270,
    species: 'undead', ai: 'aggressive', aggro: 4.5, leash: 12, speed: 2.3, attackInterval: 2.5, attackRange: 1.7,
    dmgType: 'phys', respawn: 30, radius: 0.56, sprite: 'throne_executioner', deathFx: 'void',
    abilities: ['throne_cleave'],
    materials: [{ id: 'executioner_chain', w: 1 }],
  }),
  void_priest: N({
    id: 'void_priest', name: 'Hiçlik Rahibi', level: 39, hp: 3000, atk: 390, def: 145, mdef: 210, exp: 1400,
    species: 'humanoid', ai: 'ranged', aggro: 6.5, leash: 14, speed: 2.6, attackInterval: 2.2, attackRange: 6,
    dmgType: 'magic', respawn: 30, radius: 0.42, sprite: 'void_priest', projectile: 'void_bolt', flying: true, deathFx: 'void',
    abilities: ['void_ward'],
    materials: [{ id: 'void_crystal', w: 1 }],
  }),
  // V3 elitleri: V1 kuralı (kendi kampında 25 öldürme + 120 sn aktif süre), Epic %0,75, Legendary yok
  shroud_hunter: {
    id: 'shroud_hunter', normalCoef: 0.7, name: 'Kefen Avcısı', kind: 'elite', level: 34, hp: 14000, atk: 330, def: 170, mdef: 155, exp: 2000,
    species: 'undead', ai: 'elite', aggro: 7, leash: 15, speed: 3.2, attackInterval: 1.9, attackRange: 1.9,
    dmgType: 'phys', radius: 0.72, sprite: 'shroud_hunter', lootTable: 'elite', gold: [150, 240], deathFx: 'bone',
    guaranteed: [{ id: 'hunter_brand', qty: [1, 1] }],
    extraRolls: [{ id: 'mastery_book', chance: 0.02 }],
    abilities: ['shroud_dash'], enrage: { below: 0.3, atkSpd: 0.75, speed: 1.2, strong: true },
    materials: [{ id: 'shroud_cloth', w: 1 }],
  },
  obsidian_executioner: {
    id: 'obsidian_executioner', normalCoef: 0.7, name: 'Obsidyen Celladı', kind: 'elite', level: 39, hp: 23000, atk: 460, def: 245, mdef: 190, exp: 3500,
    species: 'construct', ai: 'elite', aggro: 6, leash: 14, speed: 2.4, attackInterval: 2.3, attackRange: 2.0,
    dmgType: 'phys', radius: 0.8, sprite: 'obsidian_executioner', lootTable: 'elite', gold: [200, 320], deathFx: 'void',
    guaranteed: [{ id: 'executioner_seal', qty: [1, 1] }],
    extraRolls: [{ id: 'mastery_book', chance: 0.025 }],
    abilities: ['obsidian_quake'],
    materials: [{ id: 'obsidian_shard', w: 1 }],
  },
  // V3 bossları
  grave_commander: {
    id: 'grave_commander', normalCoef: 0.45, name: 'Mezar Komutanı', kind: 'boss', level: 35, hp: 70000, atk: 345, def: 175, mdef: 150, exp: 6500,
    species: 'undead', ai: 'boss_commander', aggro: 8, leash: 16, speed: 2.3, attackInterval: 2.3, attackRange: 2.6,
    dmgType: 'phys', radius: 1.4, sprite: 'grave_commander', lootTable: 'grave_commander', gold: [520, 700], deathFx: 'bone',
    guaranteed: [{ id: 'commander_crest', qty: [1, 1] }],
    extraRolls: [{ id: 'ancient_core', chance: 0.3 }, { id: 'mastery_book', chance: 0.08 }],
    respawn: 900,
  },
  lost_king: {
    id: 'lost_king', normalCoef: 0.45, name: 'Kayıp Kral', kind: 'boss', level: 40, hp: 125000, atk: 420, def: 210, mdef: 185, exp: 12000,
    species: 'undead', ai: 'boss_king', aggro: 10, leash: 30, speed: 2.4, attackInterval: 2.2, attackRange: 2.7,
    dmgType: 'phys', radius: 1.4, sprite: 'lost_king', lootTable: 'lost_king', gold: [700, 950], deathFx: 'void',
    guaranteed: [{ id: 'crown_shard', qty: [1, 2] }],
    extraRolls: [{ id: 'ancient_core', chance: 0.4 }, { id: 'mastery_book', chance: 0.12 }],
  },

  // ---------------------------------------------------------- YARDIMCI (sayılmaz, EXP/loot vermez)
  pack_wolf: {
    id: 'pack_wolf', name: 'Sürü Kurdu', kind: 'summon', level: 9, hp: 160, atk: 18, def: 12, mdef: 10, exp: 0, lifetime: 30,
    species: 'beast', ai: 'aggressive', aggro: 12, leash: 16, speed: 3.7, attackInterval: 1.5, attackRange: 1.3,
    dmgType: 'phys', radius: 0.45, sprite: 'wolf', tint: 0xd8c8b8, lootTable: null, gold: [0, 0], noReward: true,
  },
  shield_crystal: {
    id: 'shield_crystal', name: 'Kalkan Kristali', kind: 'summon', level: 20, hp: 800, atk: 0, def: 10, mdef: 10, exp: 0,
    species: 'construct', ai: 'static', aggro: 0, leash: 0, speed: 0, attackInterval: 99, attackRange: 0,
    dmgType: 'phys', radius: 0.5, sprite: 'crystal', lootTable: null, gold: [0, 0], noReward: true,
  },
  // V2 yardımcıları: Kül Çağrısı (Kül Devi) ve Buz Mührü kristalleri (Donmuş Muhafız)
  ember_spawn: {
    id: 'ember_spawn', name: 'Kor Yavrusu', kind: 'summon', level: 24, hp: 1100, atk: 120, def: 50, mdef: 40, exp: 0, lifetime: 45,
    species: 'elemental', ai: 'aggressive', aggro: 14, leash: 18, speed: 3.4, attackInterval: 1.5, attackRange: 1.3,
    dmgType: 'magic', radius: 0.4, sprite: 'ash_imp', tint: 0xffb060, lootTable: null, gold: [0, 0], noReward: true, flying: true, deathFx: 'ash',
  },
  frost_seal_crystal: {
    id: 'frost_seal_crystal', name: 'Buz Mührü Kristali', kind: 'summon', level: 30, hp: 3200, atk: 0, def: 20, mdef: 20, exp: 0,
    species: 'construct', ai: 'static', aggro: 0, leash: 0, speed: 0, attackInterval: 99, attackRange: 0,
    dmgType: 'phys', radius: 0.5, sprite: 'frost_crystal', lootTable: null, gold: [0, 0], noReward: true, deathFx: 'ice',
  },
  // V3 yardımcıları: Kemik Çağrısı askerleri + Lanetli Bayrak (Mezar Komutanı), kadim mühürler (Kayıp Kral)
  bone_soldier: {
    id: 'bone_soldier', name: 'Kemik Asker', kind: 'summon', level: 34, hp: 2600, atk: 240, def: 120, mdef: 90, exp: 0, lifetime: 60,
    species: 'undead', ai: 'aggressive', aggro: 14, leash: 18, speed: 2.8, attackInterval: 1.8, attackRange: 1.5,
    dmgType: 'phys', radius: 0.5, sprite: 'cursed_guard', tint: 0xd8d0c0, lootTable: null, gold: [0, 0], noReward: true, deathFx: 'bone',
  },
  cursed_banner: {
    id: 'cursed_banner', name: 'Lanetli Bayrak', kind: 'summon', level: 35, hp: 4200, atk: 0, def: 60, mdef: 60, exp: 0,
    species: 'construct', ai: 'static', aggro: 0, leash: 0, speed: 0, attackInterval: 99, attackRange: 0,
    dmgType: 'phys', radius: 0.5, sprite: 'cursed_banner', lootTable: null, gold: [0, 0], noReward: true, deathFx: 'bone',
  },
  king_seal: {
    id: 'king_seal', name: 'Kadim Mühür', kind: 'summon', level: 40, hp: 7500, atk: 0, def: 40, mdef: 40, exp: 0,
    species: 'construct', ai: 'static', aggro: 0, leash: 0, speed: 0, attackInterval: 99, attackRange: 0,
    dmgType: 'phys', radius: 0.5, sprite: 'void_seal', lootTable: null, gold: [0, 0], noReward: true, deathFx: 'void',
  },
  // ---------------------------------------------------------- V3: GÖREV VARYANTI AVLARI (kind 'hunt')
  // Görev sürerken haritada bir tane doğar; kalıcı boss değildir, EXP verir, ekipman/ganimet düşürmez,
  // sözleşme / elit katkısı / Av Rehberi listelerine girmez.
  wounded_alpha_scout: {
    id: 'wounded_alpha_scout', name: 'Yaralı Alfa İzcisi', kind: 'hunt', level: 7, hp: 260, atk: 20, def: 10, mdef: 8, exp: 120,
    species: 'beast', ai: 'aggressive', aggro: 6, leash: 14, speed: 3.4, attackInterval: 1.4, attackRange: 1.35,
    dmgType: 'phys', radius: 0.5, sprite: 'wolf', tint: 0xe0a088, lootTable: null, gold: [0, 0],
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
