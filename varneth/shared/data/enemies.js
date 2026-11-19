// Enemy templates. Multipliers are relative to the level reference tables in formulas.js.
// behavior: melee | skirmish (hit & back off) | tank | ranged | swarm
// abilities: data-driven, executed by combat/sim.js

export const ENEMIES = {
  // ---------- Kırık Çayırlar
  meadow_wolf:     { name: 'Çayır Kurdu', tier: 'normal', sprite: 'meadow_wolf', w: 44, h: 30, hp: 0.8, dmg: 0.9, as: 1.4, range: 22, speed: 95, behavior: 'skirmish', armor: 0.6, xp: 1, gold: 1,
                     abilities: [{ id: 'lunge', type: 'lunge', cd: 6, mult: 1.6, range: 90 }] },
  raider_goblin:   { name: 'Yağmacı Goblin', tier: 'normal', sprite: 'raider_goblin', w: 30, h: 36, hp: 1.0, dmg: 1.0, as: 1.0, range: 20, speed: 70, behavior: 'melee', armor: 0.8, xp: 1, gold: 1.3 },
  broken_shell:    { name: 'Kırık Kabuk', tier: 'normal', sprite: 'broken_shell', w: 46, h: 30, hp: 1.6, dmg: 0.8, as: 0.7, range: 22, speed: 38, behavior: 'tank', armor: 2.0, xp: 1.2, gold: 1,
                     abilities: [{ id: 'shell_up', type: 'guard', cd: 9, dr: 0.6, dur: 2.5 }] },
  meadow_butcher:  { name: 'Çayır Kasabı', tier: 'elite', sprite: 'meadow_butcher', w: 56, h: 72, hp: 6, dmg: 1.8, as: 0.8, range: 30, speed: 55, behavior: 'melee', armor: 1.5, xp: 6, gold: 6,
                     abilities: [{ id: 'cleaver_slam', type: 'telegraph', shape: 'circle', radius: 55, windup: 1.3, cd: 8, mult: 3.0, name: 'Satır Darbesi' }] },
  golden_horn:     { name: 'Altın Boynuz', tier: 'champion', sprite: 'golden_horn', w: 60, h: 44, hp: 9, dmg: 1.6, as: 1.2, range: 26, speed: 90, behavior: 'skirmish', armor: 1.2, xp: 12, gold: 15,
                     abilities: [{ id: 'gore_charge', type: 'telegraph', shape: 'line', width: 160, windup: 1.0, cd: 7, mult: 2.8, name: 'Altın Hücum', dash: true }] },
  // ---------- Yeşilgölge Korusu
  forest_goblin:   { name: 'Orman Goblini', tier: 'normal', sprite: 'forest_goblin', w: 30, h: 38, hp: 0.85, dmg: 1.0, as: 1.5, range: 20, speed: 100, behavior: 'skirmish', armor: 0.7, xp: 1, gold: 1.2 },
  venom_spider:    { name: 'Zehirli Örümcek', tier: 'normal', sprite: 'venom_spider', w: 46, h: 30, hp: 0.9, dmg: 0.8, as: 1.1, range: 24, speed: 80, behavior: 'melee', armor: 0.8, xp: 1.1, gold: 1,
                     onHit: { poison: { pct: 0.6, dur: 4 } } },
  corrupted_tree:  { name: 'Yozlaşmış Ağaç', tier: 'normal', sprite: 'corrupted_tree', w: 52, h: 64, hp: 2.2, dmg: 1.6, as: 0.55, range: 34, speed: 30, behavior: 'tank', armor: 1.4, xp: 1.6, gold: 1.3,
                     abilities: [{ id: 'root_lash', type: 'telegraph', shape: 'circle', radius: 40, windup: 1.2, cd: 9, mult: 2.0, name: 'Kök Kırbacı', root: 1.0 }] },
  root_guardian:   { name: 'Kök Muhafızı', tier: 'elite', sprite: 'root_guardian', w: 64, h: 80, hp: 7, dmg: 1.7, as: 0.7, range: 34, speed: 40, behavior: 'tank', armor: 2.0, xp: 7, gold: 7,
                     abilities: [{ id: 'thorn_burst', type: 'telegraph', shape: 'circle', radius: 70, windup: 1.4, cd: 9, mult: 2.6, name: 'Diken Patlaması' },
                                 { id: 'bark', type: 'guard', cd: 12, dr: 0.5, dur: 3 }] },
  ancient_fang:    { name: 'Kadim Zehir Dişi', tier: 'champion', sprite: 'ancient_fang', w: 64, h: 40, hp: 10, dmg: 1.5, as: 1.3, range: 26, speed: 85, behavior: 'skirmish', armor: 1.3, xp: 14, gold: 18,
                     onHit: { poison: { pct: 1.0, dur: 5 } },
                     abilities: [{ id: 'venom_spray', type: 'telegraph', shape: 'cone', radius: 110, windup: 1.1, cd: 8, mult: 1.8, name: 'Zehir Püskürtme', poison: { pct: 1.5, dur: 5 } }] },
  // ---------- Paslı Ocaklar
  rusty_guard:     { name: 'Paslı Muhafız', tier: 'normal', sprite: 'rusty_guard', w: 38, h: 54, hp: 1.6, dmg: 1.1, as: 0.8, range: 26, speed: 45, behavior: 'tank', armor: 2.2, xp: 1.3, gold: 1.4,
                     abilities: [{ id: 'guard_stance', type: 'guard', cd: 8, dr: 0.55, dur: 2 }] },
  ember_worker:    { name: 'Kor İşçisi', tier: 'normal', sprite: 'ember_worker', w: 34, h: 46, hp: 1.0, dmg: 1.1, as: 0.9, range: 130, speed: 55, behavior: 'ranged', armor: 1.0, xp: 1.2, gold: 1.2, element: 'fire',
                     projectile: 'ember' },
  mine_crawler:    { name: 'Maden Sürüngeni', tier: 'normal', sprite: 'mine_crawler', w: 40, h: 22, hp: 0.6, dmg: 0.7, as: 1.6, range: 18, speed: 120, behavior: 'swarm', armor: 0.6, xp: 0.7, gold: 0.7, group: [2, 3] },
  iron_executioner:{ name: 'Demir İnfazcı', tier: 'elite', sprite: 'iron_executioner', w: 62, h: 84, hp: 7.5, dmg: 2.0, as: 0.65, range: 36, speed: 45, behavior: 'melee', armor: 2.4, xp: 8, gold: 8,
                     abilities: [{ id: 'guillotine', type: 'telegraph', shape: 'line', width: 120, windup: 1.4, cd: 8, mult: 3.2, name: 'Giyotin' }] },
  molten_core:     { name: 'Erimiş Çekirdek', tier: 'champion', sprite: 'molten_core', w: 56, h: 56, hp: 11, dmg: 1.6, as: 0.9, range: 120, speed: 50, behavior: 'ranged', armor: 1.5, xp: 16, gold: 20, element: 'fire', projectile: 'ember',
                     abilities: [{ id: 'magma_burst', type: 'telegraph', shape: 'circle', radius: 80, windup: 1.3, cd: 7, mult: 2.4, name: 'Magma Patlaması', atTarget: true }] },
  // ---------- Bosses
  broken_horn:     { name: 'Kırık Boynuz', tier: 'boss', sprite: 'broken_horn', w: 110, h: 104, hp: 26, dmg: 1.5, as: 0.75, range: 44, speed: 60, behavior: 'melee', armor: 1.6, xp: 60, gold: 60,
                     phases: [
                       { at: 1.0, abilities: [{ id: 'horn_charge', type: 'telegraph', shape: 'line', width: 220, windup: 1.3, cd: 9, mult: 3.0, name: 'Boynuz Hücumu', dash: true },
                                              { id: 'stomp', type: 'telegraph', shape: 'circle', radius: 70, windup: 1.1, cd: 7, mult: 2.2, name: 'Toprak Ezme', stun: 0.8 }] },
                       { at: 0.6, text: 'Kırık Boynuz sürüsünü çağırıyor!', summon: { id: 'meadow_wolf', count: 2 } },
                       { at: 0.3, text: 'Kırık Boynuz öfkeleniyor!', enrage: { as: 0.35, dmg: 0.15 } },
                     ] },
  lord_of_roots:   { name: 'Köklerin Efendisi', tier: 'boss', sprite: 'lord_of_roots', w: 120, h: 140, hp: 30, dmg: 1.5, as: 0.6, range: 50, speed: 30, behavior: 'tank', armor: 2.0, xp: 70, gold: 70,
                     phases: [
                       { at: 1.0, abilities: [{ id: 'root_eruption', type: 'telegraph', shape: 'circle', radius: 50, windup: 1.4, cd: 6, mult: 2.6, name: 'Kök Patlaması', atTarget: true, root: 1.2 },
                                              { id: 'sap_spit', type: 'projectile', cd: 6, mult: 1.2, projectile: 'sap', poison: { pct: 0.35, dur: 4 } }] },
                       { at: 0.7, text: 'Fidanlar topraktan yükseliyor!', summon: { id: 'forest_goblin', count: 2 } },
                       { at: 0.5, text: 'Kabuk Kalkanı! Önce fidanları kes.', guardWhileAdds: { dr: 0.85 }, summon: { id: 'corrupted_tree', count: 1 } },
                       { at: 0.25, text: 'Köklerin Efendisi çıldırıyor!', enrage: { as: 0.3, dmg: 0.2 } },
                     ] },
  forge_warden:    { name: 'Ocak Bekçisi', tier: 'boss', sprite: 'forge_warden', w: 140, h: 150, hp: 34, dmg: 1.6, as: 0.6, range: 56, speed: 35, behavior: 'melee', armor: 2.6, xp: 85, gold: 85, element: 'fire',
                     phases: [
                       { at: 1.0, abilities: [{ id: 'flame_breath', type: 'telegraph', shape: 'cone', radius: 160, windup: 1.4, cd: 8, mult: 2.8, name: 'Alev Nefesi', element: 'fire' },
                                              { id: 'hammer', type: 'telegraph', shape: 'circle', radius: 60, windup: 1.0, cd: 6, mult: 2.2, name: 'Örs Çekici' }] },
                       { at: 0.66, text: 'Bekçi işçilerini çağırıyor!', summon: { id: 'ember_worker', count: 2 } },
                       { at: 0.5, text: 'Aşırı ısınma! Bekçi zırhını kapattı.', guard: { dr: 0.7, dur: 6 }, then: { id: 'vent', type: 'telegraph', shape: 'circle', radius: 220, windup: 2.0, mult: 4.0, name: 'Buhar Patlaması', element: 'fire', once: true } },
                       { at: 0.2, text: 'Ocak Bekçisi kor gibi parlıyor!', enrage: { as: 0.3, dmg: 0.25 } },
                     ] },
  // ---------- Dungeon: Çürüyen Kökler
  rot_sporeling:   { name: 'Çürük Sporcuk', tier: 'normal', sprite: 'rot_sporeling', w: 28, h: 28, hp: 0.7, dmg: 0.8, as: 1.2, range: 18, speed: 90, behavior: 'swarm', armor: 0.5, xp: 0.8, gold: 0.8, group: [2, 3],
                     onDeath: { poisonCloud: { radius: 40, pct: 0.6, dur: 3 } } },
  rot_heart:       { name: 'Çürük Yürek', tier: 'boss', sprite: 'rot_heart', w: 130, h: 130, hp: 30, dmg: 1.5, as: 0.6, range: 140, speed: 0, behavior: 'ranged', armor: 1.8, xp: 90, gold: 90, projectile: 'spore',
                     phases: [
                       { at: 1.0, abilities: [{ id: 'poison_nova', type: 'telegraph', shape: 'circle', radius: 120, windup: 1.6, cd: 9, mult: 2.4, name: 'Zehir Novası', poison: { pct: 1.2, dur: 5 } },
                                              { id: 'spore_rain', type: 'telegraph', shape: 'circle', radius: 45, windup: 1.2, cd: 5, mult: 2.0, name: 'Spor Yağmuru', atTarget: true }] },
                       { at: 0.75, text: 'Yürek sporcuk kusuyor!', summon: { id: 'rot_sporeling', count: 3 } },
                       { at: 0.5, text: 'Yürek nabız gibi atıyor... Koruyucu çürük kabuk!', guardWhileAdds: { dr: 0.8 }, summon: { id: 'rot_sporeling', count: 4 } },
                       { at: 0.25, text: 'Çürük Yürek son çırpınışında!', enrage: { as: 0.4, dmg: 0.2 } },
                     ] },
};
for (const [id, e] of Object.entries(ENEMIES)) e.id = id;
