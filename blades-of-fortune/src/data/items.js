// 32 tasarlanmış eşya: 9 silah, 7 zırh, 6 aksesuar, 10 tüketilebilir/özel.
// tier: hangi bölgeden itibaren dükkânda görünebileceği. icon: ikon çizim anahtarı.
const W = (id, name, fam, rar, tier, price, st, desc, extra = {}) => ({ id, name, slot: 'weapon', fam, rarity: rar, tier, price, ...st, desc, icon: 'w_' + fam, ...extra });
const A = (id, name, wt, rar, tier, price, st, desc, extra = {}) => ({ id, name, slot: 'armor', weight: wt, rarity: rar, tier, price, ...st, desc, icon: 'a_' + wt, ...extra });
const X = (id, name, rar, tier, price, st, desc, extra = {}) => ({ id, name, slot: 'acc', rarity: rar, tier, price, ...st, desc, ...extra });
const C = (id, name, kind, rar, tier, price, desc, extra = {}) => ({ id, name, slot: 'bag', kind, rarity: rar, tier, price, desc, ...extra });

export const ITEMS = {};
[
  W('W_SWORD_1', 'Paslı Kılıç', 'sword', 'common', 1, 30, { atk: 3 }, 'Gezginin ilk kılıcı. Çifte Darbe özel saldırısı.'),
  W('W_SWORD_2', 'Çelik Uzun Kılıç', 'sword', 'uncommon', 2, 120, { atk: 6, agi: 1 }, 'Dengeli ve hızlı bir kılıç.'),
  W('W_SWORD_3', 'Şafak Kılıcı', 'sword', 'legendary', 4, 420, { atk: 10, agi: 1 }, 'Ölümsüzlere karşı +%40 hasar. Lanetli olaylarda yeni seçenekler açar.', { vs: { undead: 1.4 }, opens: ['dawn'] }),
  W('W_AXE_1', 'Oduncu Baltası', 'axe', 'common', 1, 40, { atk: 4, agi: -1 }, 'Ağır ama güvenilir. Zırh Kırıcı özel saldırısı. Devrilmiş ağaçları keser.', { opens: ['chop'] }),
  W('W_AXE_2', 'Savaş Baltası', 'axe', 'uncommon', 2, 140, { atk: 8, agi: -1 }, 'Kalkanları parçalamak için dövüldü.', { opens: ['chop'] }),
  W('W_AXE_3', 'Dağ Kralının Baltası', 'axe', 'rare', 3, 360, { atk: 12, agi: -2 }, 'Taş ve golemlere karşı +%35 hasar.', { vs: { construct: 1.35 }, opens: ['chop', 'stone'] }),
  W('W_SPEAR_1', 'Çoban Mızrağı', 'spear', 'common', 1, 35, { atk: 3, agi: 1 }, 'Uzun menzil. Süpürme Saldırısı tüm düşmanlara vurur.'),
  W('W_SPEAR_2', 'Muhafız Mızrağı', 'spear', 'uncommon', 2, 130, { atk: 6, def: 1 }, 'Kraliyet muhafızlarının standart mızrağı.'),
  W('W_SPEAR_3', 'Ejderha Avcısının Mızrağı', 'spear', 'legendary', 4, 440, { atk: 9, agi: 2 }, 'Canavarlara karşı +%40 hasar.', { vs: { beast: 1.4, monster: 1.4 } }),

  A('A_LIGHT_1', 'Keten Gambeson', 'light', 'common', 1, 25, { def: 2 }, 'Kalın dokunmuş, hafif bir yelek.'),
  A('A_LIGHT_2', 'Avcı Deri Zırhı', 'light', 'uncommon', 2, 110, { def: 3, agi: 2 }, 'Ormanda sessiz adımlar.', { opens: ['stealth'] }),
  A('A_LIGHT_3', 'Gölge Cüppesi', 'light', 'rare', 3, 300, { def: 4, agi: 4 }, 'Gizlilik seçeneklerini açar, kaçışı kolaylaştırır.', { opens: ['stealth'] }),
  A('A_MED_1', 'Zincir Gömlek', 'medium', 'common', 1, 70, { def: 5, agi: -1 }, 'Halka halka örülmüş sağlam bir koruma.'),
  A('A_MED_2', 'Pullu Zırh', 'medium', 'rare', 3, 260, { def: 8, agi: -1 }, 'Ok ve pençeye karşı güvenilir.'),
  A('A_HEAVY_1', 'Plaka Zırh', 'heavy', 'rare', 3, 340, { def: 11, agi: -3 }, 'Yürüyen bir kale gibi.'),
  A('A_HEAVY_2', 'Kraliyet Muhafız Zırhı', 'heavy', 'legendary', 4, 480, { def: 13, agi: -2 }, 'Kraliyet karşılaşmalarında yetki seçenekleri açar.', { opens: ['royal'] }),

  X('X_WOLF', 'Kurt Dişi Kolyesi', 'uncommon', 1, 90, {}, 'Kurtlar seni sürüden sayar: kurt olaylarında özel seçenek. Canavarlara +%15 hasar.', { icon: 'x_wolf', vs: { beast: 1.15 }, opens: ['wolf'] }),
  X('X_RING', 'Şans Getiren Yüzük', 'rare', 2, 220, {}, 'Tüm şans kontrollerine +8.', { icon: 'x_ring', luck: 8 }),
  X('X_HOLY', 'Kutsal Sembol', 'uncommon', 1, 100, { def: 1 }, 'Hayalet ve ölümsüz olaylarında seçenek açar.', { icon: 'x_holy', opens: ['holy'], vs: { undead: 1.2 } }),
  X('X_BROOCH', 'Kraliyet Broşu', 'rare', 3, 240, { def: 1 }, 'Askerî karşılaşmalarda yetki seçenekleri; kalelerde %10 indirim.', { icon: 'x_brooch', opens: ['royal'] }),
  X('X_LOCKET', 'Ozanın Madalyonu', 'common', 1, 70, { agi: 1 }, 'İkna ve konuşma seçeneklerini güçlendirir (+10).', { icon: 'x_locket', talk: 10 }),
  X('X_EYE', 'Kuzgun Gözü', 'legendary', 4, 400, { agi: 2, atk: 1 }, 'Rotalardaki tehlikeyi gösterir; gizemli olaylarda seçenek açar.', { icon: 'x_eye', opens: ['mystic'], sight: 1 }),

  C('C_POTION', 'Sağlık İksiri', 'cons', 'common', 1, 22, '35 HP iyileştirir.', { heal: 35, combat: true, icon: 'c_potion' }),
  C('C_POTION_L', 'Büyük Sağlık İksiri', 'cons', 'uncommon', 2, 50, '70 HP iyileştirir.', { heal: 70, combat: true, icon: 'c_potionL' }),
  C('C_BANDAGE', 'Bandaj', 'cons', 'common', 1, 10, '15 HP iyileştirir.', { heal: 15, combat: true, icon: 'c_bandage' }),
  C('C_HERB', 'Şifalı Ot', 'cons', 'common', 1, 12, '12 HP iyileştirir; zehir olaylarında işe yarar.', { heal: 12, combat: true, icon: 'c_herb' }),
  C('C_SMOKE', 'Sis Bombası', 'cons', 'uncommon', 1, 35, 'Savaştan kesin kaçış. Bazı olaylarda gizlenmeni sağlar.', { combat: true, flee: true, icon: 'c_smoke' }),
  C('C_FIRE', 'Ateş Bombası', 'cons', 'uncommon', 2, 40, 'Savaşta tüm düşmanlara 22 hasar.', { combat: true, aoe: 22, icon: 'c_fire' }),
  C('C_LOCKPICK', 'Maymuncuk', 'cons', 'common', 1, 18, 'Kilitli sandık ve kapılarda kullanılır.', { icon: 'c_pick' }),
  C('C_CHARM', 'Koruyucu Tılsım', 'cons', 'rare', 2, 60, 'Savaşta bir sonraki darbeyi tamamen engeller; lanetlere karşı korur.', { combat: true, ward: true, icon: 'c_charm' }),
  C('Q_SEAL', 'Kraliyet Mührü', 'special', 'rare', 9, 0, 'Gerçek bir kraliyet mührü. Kraliyet karşılaşmalarında ve Başkent sınavında kullanılır.', { icon: 'q_seal', noSell: false, sell: 60 }),
  C('Q_MAP', 'Gizemli Harita', 'special', 'uncommon', 9, 0, 'Bir sonraki yolculukta gizli bir hazine olayı garanti eder (yola çıkarken tüketilir).', { icon: 'q_map', sell: 25 }),
].forEach((it) => (ITEMS[it.id] = it));

export const RARITY = { common: { n: 'Sıradan', c: '#d8d0c0' }, uncommon: { n: 'Nadirce', c: '#6fc3e8' }, rare: { n: 'Nadir', c: '#c08ef0' }, legendary: { n: 'Efsanevi', c: '#ffb43a' } };
export const SLOT_NAMES = { weapon: 'Silah', armor: 'Zırh', acc: 'Aksesuar', bag: 'Çanta' };
export const FAMILY_SPECIAL = {
  sword: { name: 'Çifte Darbe', desc: 'İki hızlı vuruş (%70 + %70).' },
  axe: { name: 'Zırh Kırıcı', desc: '%130 hasar, savunmayı yok sayar ve hedefin savunmasını yarıya indirir.' },
  spear: { name: 'Süpürme Saldırısı', desc: 'Tüm düşmanlara %80 hasar.' },
};
// Görev eşyaları (çantada yer kaplamaz, ayrı takip edilir)
export const QUEST_ITEMS = {
  QI_PARCEL: 'Mühürlü Paket', QI_LETTER: 'Gizemli Mektup', QI_MANUSCRIPT: 'Kayıp Yazma', QI_CROWNSHARD: 'Taç Parçası', QI_LEDGER: 'Hazine Defteri',
  QI_SKETCH: 'Kılıç Çizimi', QI_ORE: 'Yıldız Demiri', QI_WILL: 'Eski Vasiyet', QI_MESSAGE: 'Kraliyet Mektubu', QI_RELIC: 'Gezginin Emaneti',
  QI_CURSEDBLADE: 'Lanetli Kılıç', QI_POTION: 'Cadı İksiri', QI_PASS: 'Hazine Giriş İzni', QI_TOOTH: 'Ejderha Dişi', QI_PROOF: 'Kimlik Kanıtları', QI_CURE: 'Şifa Tarifi',
};
export const ITEM_COUNT = Object.keys(ITEMS).length;
