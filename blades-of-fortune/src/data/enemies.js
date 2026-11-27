// 12 temel düşman + hikâye zinciri/final mini-boss varyantları.
// pattern: niyet döngüsü. death: yenilme koreografisi türü.
export const INTENTS = {
  atk: { n: 'Saldırı', ic: '⚔', mult: 1 },
  heavy: { n: 'Ağır Darbe', ic: '⚒', mult: 1.6 },
  guard: { n: 'Savunma', ic: '🛡', mult: 0 },
  shoot: { n: 'Ok Atışı', ic: '➶', mult: 0.9, ranged: 1 },
  aim: { n: 'Nişan Alıyor', ic: '◎', mult: 0 },
  snipe: { n: 'Keskin Atış', ic: '➶➶', mult: 2, ranged: 1 },
  howl: { n: 'Uluma', ic: '♫', mult: 0 },
  drain: { n: 'Can Emme', ic: '☠', mult: 0.8 },
  web: { n: 'Ağ Fırlatma', ic: '#', mult: 0.5, ranged: 1 },
  slam: { n: 'Yer Sarsan', ic: '✸', mult: 1.45 },
  rally: { n: 'Toparlanma', ic: '✚', mult: 0 },
  wail: { n: 'Çığlık', ic: '〰', mult: 0.4, ranged: 1 },
  charge: { n: 'Hücum', ic: '»', mult: 1.5 },
};
const E = (id, name, kind, hp, atk, def, spd, tags, gold, xp, pattern, death, extra = {}) => ({ id, name, kind, hp, atk, def, spd, tags, gold, xp, pattern, death, ...extra });
export const ENEMIES = {};
[
  E('E_BANDIT', 'Orman Haydudu', 'bandit', 26, 8, 2, 8, ['human', 'bandit'], [6, 12], 4, ['atk', 'atk', 'heavy'], 'fall'),
  E('E_ARCHER', 'Haydut Okçu', 'archer', 18, 9, 1, 10, ['human', 'bandit'], [6, 12], 4, ['shoot', 'aim', 'snipe'], 'fall'),
  E('E_LEADER', 'Haydut Lideri', 'leader', 46, 10, 4, 8, ['human', 'bandit'], [18, 30], 9, ['atk', 'rally', 'heavy'], 'kneel'),
  E('E_DESERTER', 'Firari Asker', 'deserter', 32, 9, 4, 8, ['human', 'soldier'], [8, 14], 5, ['atk', 'guard', 'heavy'], 'kneel'),
  E('E_GUARD', 'Ağır Zırhlı Muhafız', 'guard', 44, 10, 7, 5, ['human', 'soldier'], [12, 20], 7, ['guard', 'heavy', 'atk'], 'kneel'),
  E('E_WOLF', 'Kurt', 'wolf', 20, 8, 1, 13, ['beast', 'wolf'], [0, 3], 3, ['atk', 'howl', 'atk'], 'flee'),
  E('E_BOAR', 'Yaban Domuzu', 'boar', 28, 9, 3, 9, ['beast'], [0, 2], 3, ['charge', 'atk', 'atk'], 'flee'),
  E('E_SPIDER', 'Dev Örümcek', 'spider', 24, 8, 2, 11, ['beast', 'monster'], [2, 6], 4, ['atk', 'web', 'atk'], 'curl'),
  E('E_SWAMP', 'Bataklık Yaratığı', 'swamp', 36, 9, 3, 6, ['monster'], [4, 10], 5, ['drain', 'atk', 'guard'], 'sink'),
  E('E_SKELETON', 'İskelet Savaşçı', 'skeleton', 28, 9, 5, 6, ['undead'], [5, 10], 5, ['atk', 'guard', 'heavy'], 'crumble'),
  E('E_GHOST', 'Hayalet', 'ghost', 22, 9, 0, 12, ['undead'], [4, 9], 5, ['drain', 'wail', 'atk'], 'fade', { ethereal: 25 }),
  E('E_GOLEM', 'Taş Golem', 'golem', 64, 12, 9, 3, ['construct'], [10, 18], 9, ['guard', 'slam', 'slam'], 'crumble'),
  // Mini-boss / özel varyantlar
  E('B_TROLL', 'Taş Trol', 'troll', 90, 14, 6, 4, ['monster'], [30, 50], 16, ['atk', 'slam', 'guard', 'heavy'], 'flee', { boss: 1 }),
  E('B_BANDITKING', 'Kara Orman Reisi', 'leader', 75, 13, 6, 9, ['human', 'bandit'], [50, 80], 18, ['atk', 'rally', 'heavy', 'atk'], 'kneel', { boss: 1, tint: '#2a2a2a' }),
  E('B_ALPHA', 'Sürü Lideri', 'wolf', 60, 12, 3, 14, ['beast', 'wolf'], [0, 0], 15, ['howl', 'atk', 'charge'], 'flee', { boss: 1, scale: 1.4, tint: '#d8d8e0' }),
  E('B_CURSED', 'Lanetli Şövalye', 'knightDark', 70, 13, 8, 7, ['undead', 'human'], [30, 50], 16, ['atk', 'drain', 'heavy'], 'crumble', { boss: 1 }),
  E('B_GOLDTOOTH', 'Altın Dişli Haydut', 'leader', 68, 12, 5, 11, ['human', 'bandit'], [70, 100], 16, ['atk', 'charge', 'rally', 'heavy'], 'kneel', { boss: 1, tint: '#7a1a1a' }),
  E('B_WRAITH', 'Mezar Lordu', 'wraith', 80, 13, 4, 9, ['undead'], [40, 60], 18, ['wail', 'drain', 'heavy', 'drain'], 'fade', { boss: 1, ethereal: 15 }),
  E('B_WYVERN', 'Kaya Ejderi', 'wyvern', 95, 15, 7, 10, ['beast', 'monster'], [40, 70], 20, ['atk', 'charge', 'slam', 'guard'], 'flee', { boss: 1 }),
  E('B_WITCHBEAST', 'Cadının Gölgesi', 'shade', 55, 12, 2, 12, ['monster', 'undead'], [20, 40], 14, ['wail', 'drain', 'atk'], 'fade', { boss: 1, ethereal: 15 }),
  E('B_RABBIT', 'Katil Tavşan', 'rabbit', 34, 11, 1, 16, ['beast'], [0, 0], 10, ['atk', 'charge', 'atk'], 'flee', { boss: 1, tint: '#ffffff' }),
  E('B_CHAMPION', 'Kraliyet Şampiyonu', 'champion', 120, 15, 9, 9, ['human', 'soldier'], [0, 0], 30, ['atk', 'guard', 'heavy', 'atk', 'charge'], 'kneel', { boss: 1, noFlee: 1 }),
].forEach((e) => (ENEMIES[e.id] = e));
export const BASE_ENEMY_COUNT = 12;
