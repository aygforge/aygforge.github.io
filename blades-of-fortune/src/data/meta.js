// 18 kalıcı geliştirme — 3 dal × 6. Dal içinde sırayla açılır; maliyetler artan.
const COSTS = [60, 110, 170, 250, 350, 480];
const U = (branch, i, id, name, desc) => ({ id, branch, idx: i, name, desc, cost: COSTS[i] });
export const BRANCHES = { war: 'Savaşçılık', surv: 'Hayatta Kalma', adv: 'Maceracılık' };
export const UPGRADES = [
  U('war', 0, 'U_SHARP', 'Keskin Kılıç', 'Başlangıç saldırısı +1.'),
  U('war', 1, 'U_STANCE', 'Sağlam Duruş', 'Başlangıç savunması +1.'),
  U('war', 2, 'U_MASTER', 'Usta Vuruş', 'Özel saldırı hasarı +%8.'),
  U('war', 3, 'U_SHIELD', 'Kalkan Disiplini', 'Savun eylemi hasarı %60 yerine %68 azaltır.'),
  U('war', 4, 'U_FINISH', 'Son Darbe', 'HP\'si %30 altındaki düşmanlara +%15 hasar.'),
  U('war', 5, 'U_INSTINCT', 'Savaşçı İçgüdüsü', 'HP\'n %30 altına ilk düştüğünde bir kez tam Odak kazanırsın (run başına).'),
  U('surv', 0, 'U_TOUGH', 'Dayanıklı Gezgin', 'Maksimum HP +5.'),
  U('surv', 1, 'U_HEALER', 'Şifacının Öğüdü', 'İksir iyileştirmesi +%10.'),
  U('surv', 2, 'U_READY', 'Hazırlıklı Yolcu', 'Her run\'a 1 Bandaj ile başlarsın.'),
  U('surv', 3, 'U_SLEEP', 'Rahat Bir Uyku', 'Hanlar +%15 fazla iyileştirir.'),
  U('surv', 4, 'U_IRON', 'Çelik İrade', 'Maksimum HP +5.'),
  U('surv', 5, 'U_SENSE', 'Tehlike Sezgisi', 'Run\'daki ilk savaş dışı hasarı tamamen önlersin.'),
  U('adv', 0, 'U_PURSE', 'Yol Parası', 'Başlangıç altını +20.'),
  U('adv', 1, 'U_BARGAIN', 'Pazarlık Ustası', 'Alış fiyatlarında %8 indirim.'),
  U('adv', 2, 'U_ROUTE', 'Rota Sezgisi', 'Rota kartlarında ek tehlike ipucu gösterilir.'),
  U('adv', 3, 'U_EXPLORER', 'Deneyimli Gezgin', 'Keşif olaylarındaki kontrollere +8.'),
  U('adv', 4, 'U_HUNTER', 'Hazine Avcısı', 'Sandık ganimetlerinde nadir eşya olasılığı artar.'),
  U('adv', 5, 'U_MAPS', 'Unutulmuş Haritalar', 'Run başında Gizemli Harita; nadir olaylar daha sık.'),
];
export const UPG = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
