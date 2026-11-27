// data/quests.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).

/** Delivery Board tasks — measured from cumulative save.stats. */
export const QUESTS = [
  { id: 'q_3del', text: '3 teslimat tamamla', stat: 'deliveries', target: 3, reward: 100 },
  { id: 'q_pkg70', text: 'Paketi en az %70 sağlam teslim et', stat: 'pkg70', target: 1, reward: 80 },
  { id: 'q_kills50', text: '50 düşman yen', stat: 'kills', target: 50, reward: 120 },
  { id: 'q_fragile', text: 'Bir Kırılgan Sipariş teslim et', stat: 'fragileDone', target: 1, reward: 100 },
  { id: 'q_3star', text: 'Bir bölümü 3 yıldızla bitir', stat: 'threeStarRuns', target: 1, reward: 120 },
  { id: 'q_heavy', text: 'Bir Ağır Sipariş teslim et', stat: 'heavyDone', target: 1, reward: 100 },
  { id: 'q_kills200', text: '200 düşman yen', stat: 'kills', target: 200, reward: 250 },
  { id: 'q_10del', text: '10 teslimat tamamla', stat: 'deliveries', target: 10, reward: 200 },
];
/** Milestones — persistent achievements with trophies + coin rewards. */
export const MILESTONES = [
  { id: 'm_first', name: 'İlk Teslimat', text: 'İlk başarılı teslimatı yap', icon: '📦', reward: 50, check: s => s.stats.deliveries >= 1 },
  { id: 'm_five', name: 'Mahallenin Kuryesi', text: '5 başarılı teslimat', icon: '🛵', reward: 100, check: s => s.stats.deliveries >= 5 },
  { id: 'm_ten', name: 'Usta Kurye', text: '10 başarılı teslimat', icon: '🏅', reward: 200, check: s => s.stats.deliveries >= 10 },
  { id: 'm_elite', name: 'Elit Avcı', text: 'İlk elit düşmanı yen', icon: '⚔️', reward: 120, check: s => s.stats.eliteKills >= 1 },
  { id: 'm_3star', name: 'Kusursuz Servis', text: 'İlk 3 yıldızlı bölüm', icon: '⭐', reward: 100, check: s => s.stars.some(x => x >= 3) },
  { id: 'm_ch7', name: 'Kahve Molası', text: '7. bölümün kilidini aç', icon: '☕', reward: 150, check: s => s.unlocked >= 7 },
  { id: 'm_coffee', name: 'Coffee District Fatihi', text: 'Coffee District\'i tamamla', icon: '🏆', reward: 400, check: s => !!s.episodes.coffee },
  { id: 'm_18', name: 'Yıldız Toplayıcı', text: 'Toplam 18 yıldıza ulaş', icon: '🌟', reward: 200, check: s => s.stars.reduce((a, b) => a + b, 0) >= 18 },
  { id: 'm_36', name: 'Kahve Efsanesi', text: 'Toplam 36 yıldıza ulaş', icon: '👑', reward: 500, check: s => s.stars.reduce((a, b) => a + b, 0) >= 36 },
];
export const xpToNext = lvl => 100 + 60 * (lvl - 1);
