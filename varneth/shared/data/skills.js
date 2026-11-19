// Active & passive skills plus specialization trees.
// `rules`: automation conditions (OR). The combat AI casts the first ready skill
// (in loadout order) whose rule list matches. Players can reorder and edit rules.

export const RULES = {
  always: 'Her zaman',
  enemies_ge_2: '2+ düşman yakında',
  enemies_ge_3: '3+ düşman yakında',
  hp_below_70: 'Can < %70',
  hp_below_50: 'Can < %50',
  target_hp_below_25: 'Hedef canı < %25',
  boss_or_elite: 'Hedef boss/elit',
  target_not_poisoned: 'Hedef zehirli değil',
  resource_below_30: 'Kaynak < %30',
  enemy_close: 'Düşman çok yakın',
  telegraph: 'Tehlikeli saldırı geliyor',
  never: 'Kullanma',
};

export const SKILLS = {
  // ---------------- WARRIOR
  cleave:        { cls: 'warrior', name: 'Yarma', unlock: 1, cost: 25, cd: 3, cast: 0.35, target: 'single', mult: 3.0, rules: ['always'], fx: 'slash_heavy',
                   desc: 'Güçlü tek hedef darbesi (silah hasarının %300\'ü).' },
  whirlwind:     { cls: 'warrior', name: 'Kasırga Darbesi', unlock: 3, cost: 35, cd: 6, cast: 0.5, target: 'aoe_self', radius: 60, mult: 1.8, rules: ['enemies_ge_2'], fx: 'whirl',
                   desc: 'Yakındaki tüm düşmanlara %180 hasar.' },
  blood_rush:    { cls: 'warrior', name: 'Kan Hücumu', unlock: 6, cost: 30, cd: 10, cast: 0.3, target: 'single', mult: 2.0, buff: { id: 'blood_rush', lifesteal: 0.1, dur: 4 }, rules: ['hp_below_70', 'boss_or_elite'], fx: 'slash_blood',
                   desc: '%200 hasar ve 4 sn boyunca +%10 can çalma.' },
  iron_will:     { cls: 'warrior', name: 'Demir İrade', unlock: 10, cost: 0, cd: 18, cast: 0.1, target: 'self', buff: { id: 'iron_will', dr: 0.4, dur: 5 }, defensive: true, rules: ['hp_below_50', 'telegraph'], fx: 'iron',
                   desc: '5 sn boyunca %40 hasar azaltma.' },
  ground_slam:   { cls: 'warrior', name: 'Yer Sarsıntısı', unlock: 14, cost: 40, cd: 12, cast: 0.45, target: 'aoe_self', radius: 75, mult: 1.4, stun: 1.2, rules: ['enemies_ge_2', 'boss_or_elite'], fx: 'slam',
                   desc: 'Yakındaki düşmanlara %140 hasar, 1.2 sn sersemletme.' },
  execute:       { cls: 'warrior', name: 'İnfaz', unlock: 18, cost: 30, cd: 5, cast: 0.35, target: 'single', mult: 2.0, executeMult: 3, executeAt: 0.25, rules: ['target_hp_below_25'], fx: 'slash_heavy',
                   desc: '%200 hasar; hedef canı %25 altındaysa üç katı.' },
  // passives
  warrior_endurance: { cls: 'warrior', passive: true, name: 'Savaşçı Dayanıklılığı', unlock: 5, stats: { hpPct: 0.12, armorPct: 0.08 }, desc: '+%12 maks. can, +%8 zırh.' },
  bloody_rage:       { cls: 'warrior', passive: true, name: 'Kanlı Öfke', unlock: 12, flag: 'bloody_rage', stats: { rageGain: 0.15 }, desc: 'Öfke %50 üzerindeyken +%10 hasar. +%15 öfke üretimi.' },
  steel_reflex:      { cls: 'warrior', passive: true, name: 'Çelik Refleks', unlock: 20, stats: { counterChance: 0.1, evasion: 0.03 }, desc: 'Darbe aldığında %10 ihtimalle karşı saldırı. +%3 kaçınma.' },

  // ---------------- RANGER
  rapid_shot:    { cls: 'ranger', name: 'Seri Atış', unlock: 1, cost: 20, cd: 3, cast: 0.45, target: 'single', mult: 0.9, hits: 3, projectile: 'arrow', rules: ['always'], fx: 'arrows',
                   desc: 'Üç hızlı ok, her biri %90 hasar.' },
  poison_arrow:  { cls: 'ranger', name: 'Zehirli Ok', unlock: 3, cost: 15, cd: 5, cast: 0.35, target: 'single', mult: 1.0, poison: { pct: 1.5, dur: 6 }, projectile: 'arrow_poison', rules: ['target_not_poisoned'], fx: 'poison',
                   desc: '%100 hasar ve 6 sn boyunca %150 zehir hasarı.' },
  arrow_rain:    { cls: 'ranger', name: 'Ok Yağmuru', unlock: 6, cost: 35, cd: 9, cast: 0.5, target: 'aoe_target', radius: 60, mult: 0.75, ticks: 3, rules: ['enemies_ge_2'], fx: 'rain',
                   desc: 'Hedef bölgeye 3 dalga ok, her dalga %75 hasar.' },
  leap_back:     { cls: 'ranger', name: 'Geri Sıçrama', unlock: 10, cost: 0, cd: 10, cast: 0.15, target: 'self', leap: 90, buff: { id: 'leap', evasion: 0.3, dur: 3 }, defensive: true, rules: ['enemy_close', 'telegraph'], fx: 'leap',
                   desc: 'Geriye sıçra, 3 sn +%30 kaçınma.' },
  hunter_trap:   { cls: 'ranger', name: 'Avcı Tuzağı', unlock: 14, cost: 20, cd: 14, cast: 0.3, target: 'aoe_target', radius: 45, mult: 1.8, root: 2, rules: ['enemies_ge_2', 'boss_or_elite'], fx: 'trap',
                   desc: 'Tuzak patlar: %180 hasar, 2 sn kök.' },
  first_aid:     { cls: 'ranger', name: 'İlk Yardım', unlock: 18, cost: 25, cd: 20, cast: 0.4, target: 'self', heal: { pct: 0.25, dur: 4 }, defensive: true, rules: ['hp_below_50'], fx: 'heal',
                   desc: '4 sn içinde canının %25\'ini yeniler.' },
  sharpshooter:      { cls: 'ranger', passive: true, name: 'Keskin Nişancı', unlock: 5, stats: { critChance: 0.05, critDamage: 0.2 }, desc: '+%5 kritik şansı, +%20 kritik hasarı.' },
  hunter_instinct:   { cls: 'ranger', passive: true, name: 'Avcı İçgüdüsü', unlock: 12, stats: { attackSpeed: 0.08, evasion: 0.03 }, desc: '+%8 saldırı hızı, +%3 kaçınma.' },
  poison_mastery:    { cls: 'ranger', passive: true, name: 'Zehir Ustalığı', unlock: 20, stats: { poisonDmg: 0.3 }, flag: 'poison_stacks', desc: 'Zehir hasarı +%30, zehir 3 kez birikir.' },

  // ---------------- MAGE
  fireball:      { cls: 'mage', name: 'Ateş Topu', unlock: 1, cost: 18, cd: 2.5, cast: 0.5, target: 'single', mult: 1.65, element: 'fire', splash: { radius: 32, pct: 0.35 }, burn: { pct: 0.4, dur: 3 }, projectile: 'fireball', rules: ['always'], fx: 'fire',
                   desc: '%165 ateş hasarı, çevreye %35 sıçrama ve yanma.' },
  chain_lightning:{ cls: 'mage', name: 'Zincir Yıldırım', unlock: 3, cost: 25, cd: 5, cast: 0.45, target: 'chain', mult: 1.3, jumps: 3, falloff: 0.25, element: 'lightning', rules: ['enemies_ge_2', 'always'], fx: 'lightning',
                   desc: '%130 yıldırım hasarı, 3 hedefe sıçrar.' },
  frost_wave:    { cls: 'mage', name: 'Buz Dalgası', unlock: 6, cost: 30, cd: 8, cast: 0.45, target: 'cone', radius: 130, mult: 1.3, slow: { pct: 0.4, dur: 3 }, element: 'ice', rules: ['enemies_ge_2', 'enemy_close'], fx: 'ice',
                   desc: 'Önündeki düşmanlara %130 buz hasarı, 3 sn %40 yavaşlatma.' },
  mana_drain:    { cls: 'mage', name: 'Mana Emme', unlock: 10, cost: 0, cd: 12, cast: 0.4, target: 'single', mult: 1.0, restore: 0.35, element: 'arcane', rules: ['resource_below_30'], fx: 'drain',
                   desc: '%100 hasar ve manasının %35\'ini geri kazan.' },
  spell_shield:  { cls: 'mage', name: 'Büyü Kalkanı', unlock: 14, cost: 30, cd: 16, cast: 0.2, target: 'self', shield: { pct: 0.3, dur: 6 }, defensive: true, rules: ['hp_below_70', 'telegraph'], fx: 'shield',
                   desc: '6 sn boyunca maks. canın %30\'u kadar kalkan.' },
  meteor:        { cls: 'mage', name: 'Meteor', unlock: 18, cost: 50, cd: 16, cast: 0.8, target: 'aoe_target', radius: 70, mult: 4.0, delay: 1.0, element: 'fire', rules: ['enemies_ge_3', 'boss_or_elite'], fx: 'meteor',
                   desc: '1 sn sonra düşen meteor: %400 ateş alan hasarı.' },
  element_mastery:   { cls: 'mage', passive: true, name: 'Element Ustalığı', unlock: 5, stats: { elemDmg: 0.12 }, desc: '+%12 element hasarı.' },
  mana_flow:         { cls: 'mage', passive: true, name: 'Mana Akışı', unlock: 12, stats: { resourceRegen: 0.3 }, desc: '+%30 mana yenilenmesi.' },
  arcane_ward:       { cls: 'mage', passive: true, name: 'Gizemli Koruma', unlock: 20, flag: 'arcane_ward', desc: 'Alınan hasarın %15\'i mana ile emilir.' },
};
for (const [id, s] of Object.entries(SKILLS)) s.id = id;

export const CLASS_SKILLS = {};
for (const s of Object.values(SKILLS)) {
  CLASS_SKILLS[s.cls] ||= { actives: [], passives: [] };
  CLASS_SKILLS[s.cls][s.passive ? 'passives' : 'actives'].push(s.id);
}

// ---------------- Specialization trees: 3 per class, 8 nodes each.
// Rows 0-4 are available in Alpha (req ≤ 30); rows 5-7 are future content.
const ROW_LEVELS = [2, 6, 10, 16, 22, 32, 45, 60];
function tree(cls, id, name, desc, nodes) {
  return { id, cls, name, desc, nodes: nodes.map((n, row) => ({ ...n, id: `${id}_${row}`, row, tree: id, reqLevel: ROW_LEVELS[row], maxRank: n.maxRank || 3, req: row ? `${id}_${row - 1}` : null })) };
}
const st = (stat, per) => ({ type: 'stat', stat, per });
const sk = (skill, field, per) => ({ type: 'skill', skill, field, per });
const fl = (flag, per) => ({ type: 'flag', flag, per });

export const TREES = [
  tree('warrior', 'berserker', 'Berserker', 'Öfke, kritik ve agresif hasar.', [
    { name: 'Kan Kokusu', e: [st('critChance', 0.02)], d: 'Rank başına +%2 kritik şansı.' },
    { name: 'Vahşi Darbeler', e: [sk('cleave', 'mult', 0.15)], d: 'Yarma hasarı rank başına +%15.' },
    { name: 'Öfke Seli', e: [st('rageGain', 0.15)], d: 'Öfke üretimi rank başına +%15.' },
    { name: 'Kasap', e: [st('critDamage', 0.1)], d: 'Kritik hasarı rank başına +%10.' },
    { name: 'Kızıl Sis', e: [fl('whirl_bleed', 1)], d: 'Kasırga Darbesi kanama uygular (rank başına 4 sn içinde %40 hasar).' },
    { name: 'Ölüm Dansı', e: [st('attackSpeed', 0.04)], d: 'Gelecek içerik.' },
    { name: 'Durdurulamaz', e: [st('dr', 0.03)], d: 'Gelecek içerik.' },
    { name: 'Savaş Tanrısı', e: [st('dmgPct', 0.05)], d: 'Gelecek içerik.', maxRank: 1 },
  ]),
  tree('warrior', 'guardian', 'Guardian', 'Savunma, kalkan ve hayatta kalma.', [
    { name: 'Kalın Deri', e: [st('armorPct', 0.05)], d: 'Zırh rank başına +%5.' },
    { name: 'Sağlam Duruş', e: [st('hpPct', 0.04)], d: 'Maks. can rank başına +%4.' },
    { name: 'Kalkan Ustası', e: [st('blockChance', 0.03)], d: 'Rank başına +%3 blok şansı (kalkan gerekir değil).' },
    { name: 'Demir Duvar', e: [sk('iron_will', 'cd', -0.1)], d: 'Demir İrade bekleme süresi rank başına -%10.' },
    { name: 'İntikam', e: [st('thorns', 0.08)], d: 'Alınan yakın dövüş hasarının rank başına %8\'ini yansıt.' },
    { name: 'Kale', e: [st('resist', 0.04)], d: 'Gelecek içerik.' },
    { name: 'Son Nefes', e: [st('hpPct', 0.05)], d: 'Gelecek içerik.' },
    { name: 'Ölümsüz Bekçi', e: [st('dr', 0.05)], d: 'Gelecek içerik.', maxRank: 1 },
  ]),
  tree('warrior', 'duelist', 'Duelist', 'Saldırı hızı, karşı saldırı ve seri vuruş.', [
    { name: 'Hızlı El', e: [st('attackSpeed', 0.04)], d: 'Saldırı hızı rank başına +%4.' },
    { name: 'Karşı Saldırı', e: [st('counterChance', 0.04)], d: 'Karşı saldırı şansı rank başına +%4.' },
    { name: 'Seri Vuruş', e: [fl('combo', 1)], d: 'Her 4. normal saldırı rank başına +%50 hasar verir.' },
    { name: 'Çevik Adım', e: [st('evasion', 0.02)], d: 'Kaçınma rank başına +%2.' },
    { name: 'Kesin Son', e: [sk('execute', 'mult', 0.2)], d: 'İnfaz hasarı rank başına +%20.' },
    { name: 'Kılıç Fırtınası', e: [st('critChance', 0.02)], d: 'Gelecek içerik.' },
    { name: 'Usta Düellocu', e: [st('attackSpeed', 0.05)], d: 'Gelecek içerik.' },
    { name: 'Bin Kesik', e: [st('dmgPct', 0.05)], d: 'Gelecek içerik.', maxRank: 1 },
  ]),
  tree('ranger', 'marksman', 'Marksman', 'Tek hedef ve kritik hasar.', [
    { name: 'Keskin Göz', e: [st('critChance', 0.02)], d: 'Kritik şansı rank başına +%2.' },
    { name: 'Delici Ok', e: [sk('rapid_shot', 'mult', 0.12)], d: 'Seri Atış hasarı rank başına +%12.' },
    { name: 'Nişan', e: [st('critDamage', 0.12)], d: 'Kritik hasarı rank başına +%12.' },
    { name: 'Uzun Menzil', e: [fl('long_range', 1)], d: '100 birimden uzaktaki hedeflere rank başına +%5 hasar.' },
    { name: 'Ölümcül Atış', e: [st('bossDmg', 0.06), st('eliteDmg', 0.06)], d: 'Boss/elit hasarı rank başına +%6.' },
    { name: 'Kartal Gözü', e: [st('critChance', 0.02)], d: 'Gelecek içerik.' },
    { name: 'Zırh Delen', e: [st('dmgPct', 0.04)], d: 'Gelecek içerik.' },
    { name: 'Tek Atış', e: [st('critDamage', 0.2)], d: 'Gelecek içerik.', maxRank: 1 },
  ]),
  tree('ranger', 'trapper', 'Trapper', 'Tuzak, zehir ve zamanla hasar.', [
    { name: 'Zehirli Uçlar', e: [st('poisonDmg', 0.12)], d: 'Zehir hasarı rank başına +%12.' },
    { name: 'Tuzak Ustası', e: [sk('hunter_trap', 'cd', -0.1)], d: 'Avcı Tuzağı bekleme süresi rank başına -%10.' },
    { name: 'Yayılan Zehir', e: [fl('poison_splash', 1)], d: 'Zehirli Ok rank başına %25 ihtimalle yakındaki bir düşmanı da zehirler.' },
    { name: 'Kalıcı Toksin', e: [st('poisonDur', 0.15)], d: 'Zehir süresi rank başına +%15.' },
    { name: 'Ok Fırtınası', e: [sk('arrow_rain', 'mult', 0.15)], d: 'Ok Yağmuru hasarı rank başına +%15.' },
    { name: 'Çürütücü', e: [st('poisonDmg', 0.1)], d: 'Gelecek içerik.' },
    { name: 'Ağ Tuzağı', e: [st('dmgPct', 0.04)], d: 'Gelecek içerik.' },
    { name: 'Veba Avcısı', e: [st('poisonDmg', 0.25)], d: 'Gelecek içerik.', maxRank: 1 },
  ]),
  tree('ranger', 'shadow', 'Shadow', 'Kaçınma, hareket ve saldırı hızı.', [
    { name: 'Gölge Adım', e: [st('evasion', 0.02)], d: 'Kaçınma rank başına +%2.' },
    { name: 'Rüzgâr Gibi', e: [st('attackSpeed', 0.04)], d: 'Saldırı hızı rank başına +%4.' },
    { name: 'Kaçamak', e: [sk('leap_back', 'cd', -0.1)], d: 'Geri Sıçrama bekleme süresi rank başına -%10.' },
    { name: 'Pusu', e: [fl('ambush', 1)], d: 'Tam canlı hedefe ilk vuruş rank başına +%25 hasar.' },
    { name: 'Gölge Bıçakları', e: [st('lifesteal', 0.005)], d: 'Can çalma rank başına +%0.5.' },
    { name: 'Hayalet', e: [st('evasion', 0.02)], d: 'Gelecek içerik.' },
    { name: 'Gece Avcısı', e: [st('critChance', 0.02)], d: 'Gelecek içerik.' },
    { name: 'Gölge Formu', e: [st('dr', 0.05)], d: 'Gelecek içerik.', maxRank: 1 },
  ]),
  tree('mage', 'pyromancer', 'Pyromancer', 'Ateş, yanma ve alan hasarı.', [
    { name: 'Kıvılcım', e: [sk('fireball', 'mult', 0.12)], d: 'Ateş Topu hasarı rank başına +%12.' },
    { name: 'Yanma', e: [st('burnDmg', 0.15)], d: 'Yanma hasarı rank başına +%15.' },
    { name: 'Isı Dalgası', e: [st('elemDmg', 0.04)], d: 'Element hasarı rank başına +%4.' },
    { name: 'Meteor Yağmuru', e: [sk('meteor', 'cd', -0.08)], d: 'Meteor bekleme süresi rank başına -%8.' },
    { name: 'Alev Çekirdeği', e: [st('critChance', 0.02)], d: 'Kritik şansı rank başına +%2.' },
    { name: 'Cehennem', e: [st('burnDmg', 0.15)], d: 'Gelecek içerik.' },
    { name: 'Kül Yağmuru', e: [st('elemDmg', 0.05)], d: 'Gelecek içerik.' },
    { name: 'Güneş Ruhu', e: [st('dmgPct', 0.06)], d: 'Gelecek içerik.', maxRank: 1 },
  ]),
  tree('mage', 'frost', 'Frost', 'Dondurma, kontrol ve koruma.', [
    { name: 'Soğuk Kan', e: [st('armorPct', 0.05)], d: 'Zırh rank başına +%5.' },
    { name: 'Buz Zırhı', e: [sk('spell_shield', 'amount', 0.12)], d: 'Büyü Kalkanı rank başına +%12 güçlü.' },
    { name: 'Donma', e: [fl('frost_freeze', 1)], d: 'Buz Dalgası hedefleri rank başına 0.4 sn dondurur.' },
    { name: 'Kış Çekirdeği', e: [st('hpPct', 0.04)], d: 'Maks. can rank başına +%4.' },
    { name: 'Buz Kırığı', e: [fl('shatter', 1)], d: 'Yavaşlatılmış düşmanlara rank başına +%10 hasar.' },
    { name: 'Kutup', e: [st('resist', 0.04)], d: 'Gelecek içerik.' },
    { name: 'Buzul', e: [st('hpPct', 0.04)], d: 'Gelecek içerik.' },
    { name: 'Sonsuz Kış', e: [st('dr', 0.05)], d: 'Gelecek içerik.', maxRank: 1 },
  ]),
  tree('mage', 'arcane', 'Arcane', 'Mana yönetimi ve zincir büyüler.', [
    { name: 'Mana Pınarı', e: [st('resourceRegen', 0.1)], d: 'Mana yenilenmesi rank başına +%10.' },
    { name: 'Zincirleme', e: [sk('chain_lightning', 'mult', 0.12)], d: 'Zincir Yıldırım hasarı rank başına +%12.' },
    { name: 'Rezonans', e: [st('costReduction', 0.06)], d: 'Büyü maliyetleri rank başına -%6.' },
    { name: 'Arkan Zekâ', e: [st('cdr', 0.03)], d: 'Bekleme süreleri rank başına -%3.' },
    { name: 'Aşırı Yük', e: [sk('mana_drain', 'mult', 0.3)], d: 'Mana Emme hasarı rank başına +%30.' },
    { name: 'Zaman Bükümü', e: [st('cdr', 0.03)], d: 'Gelecek içerik.' },
    { name: 'Arkan Kalkan', e: [st('resist', 0.04)], d: 'Gelecek içerik.' },
    { name: 'Saf Enerji', e: [st('dmgPct', 0.06)], d: 'Gelecek içerik.', maxRank: 1 },
  ]),
];
export const NODE_BY_ID = {};
for (const t of TREES) for (const n of t.nodes) NODE_BY_ID[n.id] = n;

export function skillPointsForLevel(level) {
  return Math.floor(level / 2);
}

export function defaultLoadout(cls) {
  const actives = CLASS_SKILLS[cls].actives;
  return {
    name: 'Varsayılan',
    tree: {},
    actives: [actives[0], null, null, null],
    passives: [null, null],
    rules: Object.fromEntries(actives.map((id) => [id, [...SKILLS[id].rules]])),
  };
}
