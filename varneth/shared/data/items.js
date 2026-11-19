// Base item definitions. Random affix variants are NOT separate bases.
// family -> visual layer + hand usage; tier -> base stat multiplier.

export const SLOTS = ['mainhand', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'belt', 'amulet', 'ring1', 'ring2'];
export const SLOT_NAMES = {
  mainhand: 'Ana Silah', offhand: 'İkinci El', head: 'Başlık', chest: 'Göğüslük', gloves: 'Eldiven',
  legs: 'Pantolon', boots: 'Bot', belt: 'Kemer', amulet: 'Kolye', ring1: 'Yüzük 1', ring2: 'Yüzük 2',
};

// family: equipSlot ('weapon' may go to mainhand; offhand-capable families listed)
export const FAMILIES = {
  sword:      { kind: 'weapon', hands: 1, classes: ['warrior'], speed: 1.3, dmgType: 'phys', offhandOk: true, name: 'Kılıç' },
  axe:        { kind: 'weapon', hands: 1, classes: ['warrior'], speed: 1.2, dmgType: 'phys', offhandOk: true, name: 'Balta' },
  greatsword: { kind: 'weapon', hands: 2, classes: ['warrior'], speed: 0.95, dmgType: 'phys', name: 'Çift Elli Kılıç' },
  shield:     { kind: 'offhand', classes: ['warrior'], name: 'Kalkan' },
  bow:        { kind: 'weapon', hands: 2, classes: ['ranger'], speed: 1.1, dmgType: 'phys', ranged: true, name: 'Yay' },
  crossbow:   { kind: 'weapon', hands: 2, classes: ['ranger'], speed: 0.8, dmgType: 'phys', ranged: true, name: 'Arbalet' },
  dagger:     { kind: 'weapon', hands: 1, classes: ['ranger'], speed: 1.7, dmgType: 'phys', offhandOk: true, name: 'Hançer' },
  staff:      { kind: 'weapon', hands: 2, classes: ['mage'], speed: 0.9, dmgType: 'spell', name: 'Asa' },
  wand:       { kind: 'weapon', hands: 1, classes: ['mage'], speed: 1.2, dmgType: 'spell', name: 'Değnek' },
  tome:       { kind: 'offhand', classes: ['mage'], name: 'Büyü Kitabı' },
  orb:        { kind: 'offhand', classes: ['mage'], name: 'Küre' },
  plate:      { kind: 'armor', classes: ['warrior'], armorMult: 1.3, name: 'Plaka' },
  leather:    { kind: 'armor', classes: ['ranger'], armorMult: 1.0, name: 'Deri' },
  cloth:      { kind: 'armor', classes: ['mage'], armorMult: 0.75, name: 'Kumaş' },
  belt:       { kind: 'belt', classes: null, name: 'Kemer' },
  amulet:     { kind: 'amulet', classes: null, name: 'Kolye' },
  ring:       { kind: 'ring', classes: null, name: 'Yüzük' },
};

const TIER = { 1: { req: 1, mult: 1.0 }, 2: { req: 11, mult: 1.05 }, 3: { req: 21, mult: 1.1 } };

const B = [];
function add(id, name, family, tier, extra = {}) {
  const f = FAMILIES[family];
  let slot;
  if (f.kind === 'weapon') slot = 'mainhand';
  else if (f.kind === 'offhand') slot = 'offhand';
  else if (f.kind === 'armor') slot = extra.slot;
  else if (f.kind === 'ring') slot = 'ring';
  else slot = f.kind;
  B.push({ id, name, family, tier, slot, reqLevel: TIER[tier].req, tierMult: TIER[tier].mult,
    classes: f.classes, palette: extra.palette || tier, ...extra });
}

// ---- Warrior weapons (12)
add('w_sword_1', 'Paslı Kılıç', 'sword', 1);
add('w_sword_2', 'Çayır Çeliği Kılıç', 'sword', 2);
add('w_sword_3', 'Ocak Dövmesi Kılıç', 'sword', 3);
add('w_axe_1', 'Oduncu Baltası', 'axe', 1);
add('w_axe_2', 'Kemik Ağızlı Balta', 'axe', 2);
add('w_axe_3', 'Kor Baltası', 'axe', 3);
add('w_great_1', 'Ağır Pala', 'greatsword', 1);
add('w_great_2', 'Kök Kesen', 'greatsword', 2);
add('w_great_3', 'Demir Dev Kılıcı', 'greatsword', 3);
add('w_shield_1', 'Tahta Kalkan', 'shield', 1);
add('w_shield_2', 'Perçinli Kalkan', 'shield', 2);
add('w_shield_3', 'Ocak Kalkanı', 'shield', 3);
// ---- Ranger weapons (8)
add('r_bow_1', 'Avcı Yayı', 'bow', 1);
add('r_bow_2', 'Yeşilgölge Yayı', 'bow', 2);
add('r_bow_3', 'Pas Telli Yay', 'bow', 3);
add('r_xbow_2', 'Hafif Arbalet', 'crossbow', 2);
add('r_xbow_3', 'Dişli Arbalet', 'crossbow', 3);
add('r_dagger_1', 'Kemik Hançer', 'dagger', 1);
add('r_dagger_2', 'Zehir Dişi Hançer', 'dagger', 2);
add('r_dagger_3', 'Kor Hançeri', 'dagger', 3);
// ---- Mage weapons (9)
add('m_staff_1', 'Çırak Asası', 'staff', 1);
add('m_staff_2', 'Kök Asası', 'staff', 2);
add('m_staff_3', 'Ocak Asası', 'staff', 3);
add('m_wand_1', 'Dal Değnek', 'wand', 1);
add('m_wand_2', 'Ay Değneği', 'wand', 2);
add('m_wand_3', 'Kor Değneği', 'wand', 3);
add('m_tome_1', 'Yıpranmış Kitap', 'tome', 1);
add('m_tome_3', 'Mühür Kitabı', 'tome', 3);
add('m_orb_2', 'Sis Küresi', 'orb', 2);
// ---- Armor: 3 classes x 5 slots x 2 tiers (30)
const ARMOR_NAMES = {
  plate:   { head: ['Demir Miğfer', 'Ocak Miğferi'], chest: ['Zincir Zırh', 'Plaka Göğüslük'], gloves: ['Demir Eldiven', 'Plaka Eldiven'], legs: ['Zincir Pantolon', 'Plaka Dizlik'], boots: ['Demir Çizme', 'Plaka Çizme'] },
  leather: { head: ['Deri Başlık', 'Gölge Kukuleta'], chest: ['Deri Yelek', 'Avcı Zırhı'], gloves: ['Deri Eldiven', 'Okçu Eldiveni'], legs: ['Deri Pantolon', 'İz Sürücü Pantolonu'], boots: ['Deri Bot', 'Sessiz Adım Botu'] },
  cloth:   { head: ['Keten Başlık', 'Arkanist Başlığı'], chest: ['Çırak Cübbesi', 'Mistik Cübbe'], gloves: ['Keten Eldiven', 'Rün Eldiveni'], legs: ['Keten Pantolon', 'Mistik Etek'], boots: ['Keten Terlik', 'Rün Botu'] },
};
const P = { plate: 'w', leather: 'r', cloth: 'm' };
for (const fam of ['plate', 'leather', 'cloth']) {
  for (const slot of ['head', 'chest', 'gloves', 'legs', 'boots']) {
    ARMOR_NAMES[fam][slot].forEach((nm, i) => add(`${P[fam]}_${slot}_${i ? 2 : 1}`, nm, fam, i ? 2 : 1, { slot }));
  }
}
// ---- Belts / jewelry (9)
add('belt_1', 'Kaba Kemer', 'belt', 1);
add('belt_2', 'Tokalı Kemer', 'belt', 2);
add('belt_3', 'Ocak Kemeri', 'belt', 3);
add('amulet_1', 'Kemik Kolye', 'amulet', 1);
add('amulet_2', 'Yeşim Kolye', 'amulet', 2);
add('amulet_3', 'Kor Kolye', 'amulet', 3);
add('ring_1', 'Bakır Yüzük', 'ring', 1);
add('ring_2', 'Gümüş Yüzük', 'ring', 2);
add('ring_3', 'Obsidyen Yüzük', 'ring', 3);

// ---- Sets (12 pieces, epic, 4 per class)
export const SETS = {
  bloodlord: { id: 'bloodlord', name: 'Kan Lordu Seti', cls: 'warrior',
    bonus2: { text: '+%8 Maks. Can, +%2 Can Çalma', stats: { hpPct: 0.08, lifesteal: 0.02 } },
    bonus4: { text: 'Kan Hücumu isabet ettiği her düşman için %3 can yeniler; Öfke üretimi +%30.', flag: 'set_bloodlord4' } },
  greenshade: { id: 'greenshade', name: 'Yeşilgölge Avcısı Seti', cls: 'ranger',
    bonus2: { text: '+%6 Kritik Şansı', stats: { critChance: 0.06 } },
    bonus4: { text: 'Zehirli Ok zehri %50 uzun sürer; zehirli düşmanlar Seri Atış\'tan %15 fazla hasar alır.', flag: 'set_greenshade4' } },
  arcanist: { id: 'arcanist', name: 'Kayıp Arkanist Seti', cls: 'mage',
    bonus2: { text: '+%15 Kaynak Yenilenmesi', stats: { resourceRegen: 0.15 } },
    bonus4: { text: 'Her 4. büyü mana harcamaz ve +%40 hasar verir.', flag: 'set_arcanist4' } },
};
add('set_bl_head', 'Kan Lordu Miğferi', 'plate', 3, { slot: 'head', set: 'bloodlord', fixedRarity: 3, palette: 'blood' });
add('set_bl_chest', 'Kan Lordu Zırhı', 'plate', 3, { slot: 'chest', set: 'bloodlord', fixedRarity: 3, palette: 'blood' });
add('set_bl_gloves', 'Kan Lordu Pençeleri', 'plate', 3, { slot: 'gloves', set: 'bloodlord', fixedRarity: 3, palette: 'blood' });
add('set_bl_boots', 'Kan Lordu Çizmeleri', 'plate', 3, { slot: 'boots', set: 'bloodlord', fixedRarity: 3, palette: 'blood' });
add('set_gs_head', 'Yeşilgölge Kukuletası', 'leather', 3, { slot: 'head', set: 'greenshade', fixedRarity: 3, palette: 'green' });
add('set_gs_chest', 'Yeşilgölge Yeleği', 'leather', 3, { slot: 'chest', set: 'greenshade', fixedRarity: 3, palette: 'green' });
add('set_gs_legs', 'Yeşilgölge Pantolonu', 'leather', 3, { slot: 'legs', set: 'greenshade', fixedRarity: 3, palette: 'green' });
add('set_gs_boots', 'Yeşilgölge Botları', 'leather', 3, { slot: 'boots', set: 'greenshade', fixedRarity: 3, palette: 'green' });
add('set_ar_head', 'Kayıp Arkanist Tacı', 'cloth', 3, { slot: 'head', set: 'arcanist', fixedRarity: 3, palette: 'arcane' });
add('set_ar_chest', 'Kayıp Arkanist Cübbesi', 'cloth', 3, { slot: 'chest', set: 'arcanist', fixedRarity: 3, palette: 'arcane' });
add('set_ar_gloves', 'Kayıp Arkanist Eldiveni', 'cloth', 3, { slot: 'gloves', set: 'arcanist', fixedRarity: 3, palette: 'arcane' });
add('set_ar_legs', 'Kayıp Arkanist Eteği', 'cloth', 3, { slot: 'legs', set: 'arcanist', fixedRarity: 3, palette: 'arcane' });

// ---- Uniques (8, legendary). Each special has working combat code (combat/sim.js `unique` flags).
add('u_crimson_executioner', 'Kızıl Cellat', 'greatsword', 2, { unique: 'u_crimson', fixedRarity: 4, palette: 'blood',
  uniqueText: 'İnfaz bir düşmanı öldürürse bekleme süresi sıfırlanır ve %5 can yenilersin. İnfaz eşiği %35\'e çıkar.' });
add('u_vipers_whisper', 'Engerek\'in Fısıltısı', 'bow', 2, { unique: 'u_viper', fixedRarity: 4, palette: 'green',
  uniqueText: 'Zehirli bir düşman öldüğünde zehir yakındaki düşmanlara yayılır.' });
add('u_storm_staff', 'Fırtına Asası', 'staff', 3, { unique: 'u_storm', fixedRarity: 4, palette: 'storm',
  uniqueText: 'Zincir Yıldırım +2 hedefe sıçrar. İsabetlerin %20 ihtimalle küçük bir yıldırım çağırır.' });
add('u_crown_of_roots', 'Köklerin Tacı', 'leather', 2, { slot: 'head', unique: 'u_roots', fixedRarity: 4, palette: 'wood', anyClass: true,
  uniqueText: 'Canın %35\'in altına düştüğünde kökler seni sarar: 5 sn %25 hasar azaltma ve saniyede %3 can. (30 sn bekleme)' });
add('u_ember_heart', 'Kor Kalbi', 'amulet', 3, { unique: 'u_ember', fixedRarity: 4, palette: 'ember',
  uniqueText: 'İsabetlerin %15 ihtimalle hedefi tutuşturur (3 sn boyunca vuruşun %40\'ı ateş hasarı). +%10 element direnci.' });
add('u_broken_seal', 'Kırık Mühür', 'ring', 2, { unique: 'u_seal', fixedRarity: 4, palette: 'seal',
  uniqueText: 'Elit ve bosslara +%12 hasar. Bir elit öldürdüğünde 6 sn +%25 saldırı hızı.' });
add('u_millstone', 'Değirmen Taşı', 'shield', 1, { unique: 'u_millstone', fixedRarity: 4, palette: 'stone',
  uniqueText: 'Gelen saldırıların %12\'sini tamamen bloklar ve hasarın %50\'sini geri yansıtır.' });
add('u_wardens_grip', 'Ocak Bekçisinin Eli', 'cloth', 3, { slot: 'gloves', unique: 'u_grip', fixedRarity: 4, palette: 'ember', anyClass: true,
  uniqueText: 'Normal saldırıların %10 ihtimalle kıvılcım patlaması yaratır (yakındaki düşmanlara silah hasarının %80\'i).' });

export const BASES = B;
export const BASE_BY_ID = Object.fromEntries(B.map((b) => [b.id, b]));

export function baseAllowedForClass(base, cls) {
  if (base.anyClass || !base.classes) return true;
  return base.classes.includes(cls);
}

export function equipSlotsFor(base) {
  const f = FAMILIES[base.family];
  if (base.slot === 'ring') return ['ring1', 'ring2'];
  if (f.kind === 'weapon') return f.hands === 1 && f.offhandOk ? ['mainhand', 'offhand'] : ['mainhand'];
  return [base.slot];
}

// Bases that can drop randomly (sets/uniques have dedicated pools)
export const RANDOM_BASES = B.filter((b) => !b.set && !b.unique);
export const UNIQUE_BASES = B.filter((b) => b.unique);
export const SET_BASES = B.filter((b) => b.set);
