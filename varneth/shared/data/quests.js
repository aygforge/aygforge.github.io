// Main quests (per character, sequential within region), contracts, weekly hunts, achievements.
// Progress is driven ONLY by server-settled combat events and server inventory events.

export const MAIN_QUESTS = [
  // Kırık Çayırlar
  { id: 'mq_1_1', region: 'broken_meadows', name: 'Yolun Temizlenmesi', obj: { type: 'kill_zone', zone: 'abandoned_road', count: 25 }, reward: { xp: 120, gold: 80 },
    text: 'Son Sığınak\'a gelen kervanlar Terk Edilmiş Yol\'da kayboluyor. Yolu temizle.' },
  { id: 'mq_1_2', region: 'broken_meadows', name: 'Değirmenin Gölgesi', obj: { type: 'reach_level', level: 6 }, reward: { xp: 300, gold: 150 },
    text: 'Kırık Değirmen\'e gitmek için daha güçlü olmalısın.' },
  { id: 'mq_1_3', region: 'broken_meadows', name: 'Kasabın Avı', obj: { type: 'kill_tier', tier: 'elite', region: 'broken_meadows', count: 2 }, reward: { xp: 600, gold: 250 },
    text: 'Çayır Kasabı köylülerin kemiklerini değirmende öğütüyor. Onu bul.' },
  { id: 'mq_1_4', region: 'broken_meadows', name: 'Kırık Boynuz', obj: { type: 'defeat_boss', boss: 'broken_horn', count: 1 }, reward: { xp: 1200, gold: 500, seal: 'broken_meadows' }, bossGate: true,
    text: 'Sürünün efendisi uyanmış. Onu yenersen ormana giden yol açılır.' },
  // Yeşilgölge Korusu
  { id: 'mq_2_1', region: 'greenshade', name: 'Ormanın Sınırı', obj: { type: 'kill_zone', zone: 'forest_path', count: 60 }, reward: { xp: 2500, gold: 600 },
    text: 'Orman Yolu goblinlerle dolu. Bir geçit aç.' },
  { id: 'mq_2_2', region: 'greenshade', name: 'Zehirli Ağlar', obj: { type: 'kill_enemy', enemy: 'venom_spider', count: 40 }, reward: { xp: 4000, gold: 900 },
    text: 'Örümcek yuvaları köklere kadar iniyor.' },
  { id: 'mq_2_3', region: 'greenshade', name: 'Muhafızın Kalbi', obj: { type: 'kill_tier', tier: 'elite', region: 'greenshade', count: 3 }, reward: { xp: 7000, gold: 1400 },
    text: 'Kök Muhafızları efendilerini koruyor.' },
  { id: 'mq_2_4', region: 'greenshade', name: 'Köklerin Efendisi', obj: { type: 'defeat_boss', boss: 'lord_of_roots', count: 1 }, reward: { xp: 12000, gold: 2500, seal: 'greenshade' }, bossGate: true,
    text: 'Korunun kalbinde, yaşlı bir ağaç tahtına oturmuş.' },
  // Paslı Ocaklar
  { id: 'mq_3_1', region: 'rusted_forges', name: 'Madenin Ağzı', obj: { type: 'kill_zone', zone: 'old_mine', count: 100 }, reward: { xp: 20000, gold: 3000 },
    text: 'Paslı muhafızlar hâlâ nöbet tutuyor.' },
  { id: 'mq_3_2', region: 'rusted_forges', name: 'Sönmeyen Korlar', obj: { type: 'kill_enemy', enemy: 'ember_worker', count: 60 }, reward: { xp: 28000, gold: 4000 },
    text: 'Kor işçileri kimin için çalışıyor?' },
  { id: 'mq_3_3', region: 'rusted_forges', name: 'Demirin Hükmü', obj: { type: 'kill_tier', tier: 'elite', region: 'rusted_forges', count: 3 }, reward: { xp: 36000, gold: 5000 },
    text: 'Demir İnfazcılar eski yasaları uyguluyor.' },
  { id: 'mq_3_4', region: 'rusted_forges', name: 'Ocak Bekçisi', obj: { type: 'defeat_boss', boss: 'forge_warden', count: 1 }, reward: { xp: 50000, gold: 8000, seal: 'rusted_forges' }, bossGate: true,
    text: 'Unutulmuş Ocak\'ın derinliğinde dev bir bekçi uyanıyor.' },
];
export const MAIN_QUEST_BY_ID = Object.fromEntries(MAIN_QUESTS.map((q) => [q.id, q]));

// Contract templates (repeatable). `scale` resolves counts by region tier.
export const CONTRACT_TEMPLATES = [
  { id: 'c_wolves', name: 'Kurt Postu', obj: { type: 'kill_enemy', enemy: 'meadow_wolf' }, counts: 30, region: 'broken_meadows' },
  { id: 'c_goblins', name: 'Yağmacı Temizliği', obj: { type: 'kill_enemy', enemy: 'raider_goblin' }, counts: 30, region: 'broken_meadows' },
  { id: 'c_shells', name: 'Kabuk Kırıcı', obj: { type: 'kill_enemy', enemy: 'broken_shell' }, counts: 20, region: 'broken_meadows' },
  { id: 'c_fgoblin', name: 'Orman Haydutları', obj: { type: 'kill_enemy', enemy: 'forest_goblin' }, counts: 40, region: 'greenshade' },
  { id: 'c_spider', name: 'Ağ Yakıcı', obj: { type: 'kill_enemy', enemy: 'venom_spider' }, counts: 35, region: 'greenshade' },
  { id: 'c_tree', name: 'Oduncu Kontratı', obj: { type: 'kill_enemy', enemy: 'corrupted_tree' }, counts: 20, region: 'greenshade' },
  { id: 'c_guard', name: 'Hurda Toplayıcı', obj: { type: 'kill_enemy', enemy: 'rusty_guard' }, counts: 40, region: 'rusted_forges' },
  { id: 'c_crawler', name: 'Sürü Avı', obj: { type: 'kill_enemy', enemy: 'mine_crawler' }, counts: 60, region: 'rusted_forges' },
  { id: 'c_elites', name: 'Elit Avcısı', obj: { type: 'kill_tier', tier: 'elite' }, counts: 3, region: null },
  { id: 'c_boss', name: 'Boss Ödülü', obj: { type: 'defeat_boss' }, counts: 1, region: null },
  { id: 'c_mats', name: 'Malzeme Siparişi', obj: { type: 'collect_material' }, counts: 15, region: null },
  { id: 'c_dungeon', name: 'Kök Temizliği', obj: { type: 'complete_dungeon', dungeon: 'rotting_roots' }, counts: 1, region: 'greenshade', minLevel: 20 },
];
export const CONTRACT_BY_ID = Object.fromEntries(CONTRACT_TEMPLATES.map((c) => [c.id, c]));

export const WEEKLY_HUNTS = [
  { id: 'w_kills', name: 'Büyük Av: Katliam', obj: { type: 'kill_any' }, count: 800 },
  { id: 'w_elites', name: 'Büyük Av: Elitler', obj: { type: 'kill_tier', tier: 'elite' }, count: 25 },
  { id: 'w_bosses', name: 'Büyük Av: Boss Avcısı', obj: { type: 'defeat_boss' }, count: 3 },
  { id: 'w_dungeon', name: 'Büyük Av: Kök Arınması', obj: { type: 'complete_dungeon' }, count: 2 },
];

export const ACHIEVEMENTS = [
  { id: 'a_kill_100', name: 'İlk Kan', desc: '100 canavar öldür.', stat: 'kills', target: 100, gold: 100 },
  { id: 'a_kill_1000', name: 'Avcı', desc: '1.000 canavar öldür.', stat: 'kills', target: 1000, gold: 1000 },
  { id: 'a_kill_10000', name: 'Sonsuz Av', desc: '10.000 canavar öldür.', stat: 'kills', target: 10000, gold: 10000 },
  { id: 'a_elite_25', name: 'Elit Kasabı', desc: '25 elit öldür.', stat: 'elites', target: 25, gold: 800 },
  { id: 'a_champ_5', name: 'Şampiyon Avcısı', desc: '5 nadir şampiyon öldür.', stat: 'champions', target: 5, gold: 1500 },
  { id: 'a_lvl_10', name: 'Çayırların Efendisi', desc: 'Bir karakterle 10. seviyeye ulaş.', stat: 'maxLevel', target: 10, gold: 300 },
  { id: 'a_lvl_20', name: 'Ormanın Kâbusu', desc: 'Bir karakterle 20. seviyeye ulaş.', stat: 'maxLevel', target: 20, gold: 2000 },
  { id: 'a_lvl_30', name: 'İlk Avın Sonu', desc: 'Bir karakterle 30. seviyeye ulaş.', stat: 'maxLevel', target: 30, gold: 8000 },
  { id: 'a_boss_1', name: 'Boynuz Kıran', desc: 'Kırık Boynuz\'u yen.', stat: 'boss_broken_horn', target: 1, gold: 300 },
  { id: 'a_boss_2', name: 'Kök Söken', desc: 'Köklerin Efendisi\'ni yen.', stat: 'boss_lord_of_roots', target: 1, gold: 1500 },
  { id: 'a_boss_3', name: 'Ocak Söndüren', desc: 'Ocak Bekçisi\'ni yen.', stat: 'boss_forge_warden', target: 1, gold: 5000 },
  { id: 'a_boss_25', name: 'Boss Avcısı', desc: 'Toplam 25 boss yen.', stat: 'bosses', target: 25, gold: 5000 },
  { id: 'a_dungeon_n', name: 'Kök Arındırıcı', desc: 'Çürüyen Kökler\'i Normal zorlukta tamamla.', stat: 'dungeon_normal', target: 1, gold: 1500 },
  { id: 'a_dungeon_h', name: 'Kahraman', desc: 'Çürüyen Kökler\'i Kahraman zorlukta tamamla.', stat: 'dungeon_heroic', target: 1, gold: 5000 },
  { id: 'a_legendary', name: 'Altın Işık', desc: 'Efsanevi bir eşya bul.', stat: 'legendaries', target: 1, gold: 1000 },
  { id: 'a_unique_3', name: 'Koleksiyoncu', desc: '3 farklı benzersiz eşya keşfet.', stat: 'uniques', target: 3, gold: 3000 },
  { id: 'a_upgrade_10', name: 'Usta Demirci', desc: 'Bir eşyayı +10\'a yükselt.', stat: 'max_upgrade', target: 10, gold: 3000 },
  { id: 'a_reforge_10', name: 'Büyü Dokumacı', desc: '10 kez reforge yap.', stat: 'reforges', target: 10, gold: 600 },
  { id: 'a_salvage_100', name: 'Hurdacı', desc: '100 eşya parçala.', stat: 'salvaged', target: 100, gold: 800 },
  { id: 'a_market_sell', name: 'Tüccar', desc: 'Pazarda bir eşya sat.', stat: 'market_sales', target: 1, gold: 200 },
  { id: 'a_market_buy', name: 'Müşteri', desc: 'Pazardan bir eşya satın al.', stat: 'market_buys', target: 1, gold: 200 },
  { id: 'a_three_chars', name: 'Avcılar Loncası', desc: 'Üç karakter oluştur.', stat: 'characters', target: 3, gold: 500 },
  { id: 'a_set4', name: 'Tam Takım', desc: 'Bir setin 4 parçasını aynı anda kuşan.', stat: 'set4', target: 1, gold: 3000 },
  { id: 'a_craft_10', name: 'Zanaatkâr', desc: '10 eşya üret.', stat: 'crafted', target: 10, gold: 600 },
];
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
