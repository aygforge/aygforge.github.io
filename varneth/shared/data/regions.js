// Data-driven world definition. Adding a region = adding an entry here (+ backgrounds).
export const REGIONS = [
  {
    id: 'broken_meadows', name: 'Kırık Çayırlar', levels: [1, 10], available: true, order: 1,
    theme: 'meadow', music: 'meadow',
    lore: 'Bir zamanlar krallığın tahıl ambarıydı. Şimdi çatlaklardan sızan mor sis otları kurutuyor.',
    unlock: null,
    zones: [
      { id: 'abandoned_road', name: 'Terk Edilmiş Yol', levels: [1, 5], bg: 'meadow_road', pool: [['meadow_wolf', 4], ['raider_goblin', 5], ['broken_shell', 2]] },
      { id: 'broken_mill', name: 'Kırık Değirmen', levels: [6, 10], bg: 'meadow_mill', pool: [['meadow_wolf', 3], ['raider_goblin', 4], ['broken_shell', 4]] },
    ],
    elites: ['meadow_butcher'], champions: ['golden_horn'], boss: 'broken_horn', bossLevel: 10,
    materials: ['meadow_fang', 'chitin_shard'], herbs: ['bloodroot'],
    lootTiers: [1, 2], sealFragment: 'Mühür Parçası I — Değirmenin taşları altında, çatlamış bir mühür yarısı. Üzerinde kralın adı kazınmış, sonra kazınarak silinmiş.',
  },
  {
    id: 'greenshade', name: 'Yeşilgölge Korusu', levels: [11, 20], available: true, order: 2,
    theme: 'forest', music: 'forest',
    lore: 'Ağaçlar Kadim Ocak\'ın sızıntısını kökleriyle içti. Şimdi yürüyorlar.',
    unlock: { boss: 'broken_horn' },
    zones: [
      { id: 'forest_path', name: 'Orman Yolu', levels: [11, 15], bg: 'forest_path', pool: [['forest_goblin', 5], ['venom_spider', 4], ['corrupted_tree', 2]] },
      { id: 'dark_grove', name: 'Karanlık Koruluk', levels: [16, 20], bg: 'forest_grove', pool: [['forest_goblin', 3], ['venom_spider', 4], ['corrupted_tree', 4]] },
    ],
    elites: ['root_guardian'], champions: ['ancient_fang'], boss: 'lord_of_roots', bossLevel: 20,
    materials: ['venom_sac', 'heartwood'], herbs: ['bloodroot', 'moonpetal'],
    lootTiers: [1, 2, 3], sealFragment: 'Mühür Parçası II — Köklerin arasında nabız gibi atan yeşil bir taş. Dokunduğunda bir kraliçenin fısıltısını duyuyorsun: "Ölümsüzlük bir lanet."',
  },
  {
    id: 'rusted_forges', name: 'Paslı Ocaklar', levels: [21, 30], available: true, order: 3,
    theme: 'forge', music: 'forge',
    lore: 'Cüce ustaların terk ettiği madenlerde makineler kendi kendine çalışıyor, sanki bir şey üretmeye devam ediyorlar.',
    unlock: { boss: 'lord_of_roots' },
    zones: [
      { id: 'old_mine', name: 'Eski Maden Girişi', levels: [21, 25], bg: 'forge_mine', pool: [['rusty_guard', 4], ['ember_worker', 4], ['mine_crawler', 4]] },
      { id: 'forgotten_forge', name: 'Unutulmuş Ocak', levels: [26, 30], bg: 'forge_core', pool: [['rusty_guard', 4], ['ember_worker', 5], ['mine_crawler', 3]] },
    ],
    elites: ['iron_executioner'], champions: ['molten_core'], boss: 'forge_warden', bossLevel: 30,
    materials: ['rust_gear', 'ember_core'], herbs: ['moonpetal'],
    lootTiers: [2, 3], sealFragment: 'Mühür Parçası III — Erimiş bir örsün içinde soğumuş mühür. Kadim Ocak\'ın yeri hakkında bir harita çizgisi taşıyor: "Bataklığın altında."',
  },
  // ---- future regions (locked / undiscovered in Alpha)
  { id: 'misty_marsh', name: 'Sisli Bataklık', levels: [31, 40], available: false, order: 4, zones: [] },
  { id: 'ash_valley', name: 'Kül Vadisi', levels: [41, 50], available: false, order: 5, zones: [] },
  { id: 'icebreaker_pass', name: 'Buzkıran Geçidi', levels: [51, 60], available: false, order: 6, zones: [] },
  { id: 'necropolis', name: 'Ölüler Nekropolü', levels: [61, 70], available: false, order: 7, zones: [] },
  { id: 'cracked_sands', name: 'Çatlak Kum Denizi', levels: [71, 80], available: false, order: 8, zones: [] },
  { id: 'skyrift_isles', name: 'Gökyarık Adaları', levels: [81, 90], available: false, order: 9, zones: [] },
  { id: 'ancient_citadel', name: 'Kadim Kale', levels: [91, 100], available: false, order: 10, zones: [] },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
export const ZONE_BY_ID = {};
for (const r of REGIONS) for (const z of r.zones) ZONE_BY_ID[z.id] = { ...z, region: r.id };

export const DUNGEONS = {
  rotting_roots: {
    id: 'rotting_roots', name: 'Çürüyen Kökler', minLevel: 20, bg: 'dungeon_roots', region: 'greenshade',
    unlock: { boss: 'lord_of_roots' },
    desc: 'Köklerin Efendisi\'nin altında, ormanı içten çürüten bir yürek atıyor.',
    difficulties: {
      normal: { level: 22, hpMult: 1, dmgMult: 1, lootBonus: 0, name: 'Normal' },
      heroic: { level: 28, hpMult: 1.35, dmgMult: 1.25, lootBonus: 1, name: 'Kahraman' },
      nightmare: { level: 40, hpMult: 2, dmgMult: 1.6, lootBonus: 2, name: 'Kâbus', locked: true },
    },
    stages: [
      { name: 'Zindan Girişi', waves: [[['forest_goblin', 2]], [['venom_spider', 2]]] },
      { name: 'İlk Yaratık Grubu', waves: [[['forest_goblin', 2], ['venom_spider', 1]], [['rot_sporeling', 3]]] },
      { name: 'Zehirli Koridor', hazard: 'poison', waves: [[['venom_spider', 3]], [['rot_sporeling', 3], ['venom_spider', 1]]] },
      { name: 'Elit Karşılaşması', waves: [[['root_guardian', 1]]] },
      { name: 'Son Dalga', waves: [[['corrupted_tree', 1], ['forest_goblin', 2]], [['rot_sporeling', 4]]] },
      { name: 'Çürük Yürek', boss: 'rot_heart' },
    ],
  },
};

// Region bosses as encounters (boss sessions)
export const BOSS_ENCOUNTERS = Object.fromEntries(
  REGIONS.filter((r) => r.boss).map((r) => [r.boss, { boss: r.boss, region: r.id, level: r.bossLevel, bg: r.zones[1].bg, minLevel: r.bossLevel - 2 }])
);
