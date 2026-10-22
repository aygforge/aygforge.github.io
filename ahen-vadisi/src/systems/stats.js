// Tek yetkili stat hesaplayıcı. Arayüz ve savaş bütün değerleri buradan okur.
import { CLASSES } from '../data/classes.js';
import { ITEMS, isUpgradeable } from '../data/items.js';
import { SKILLS, CLASS_SKILLS } from '../data/skills.js';
import {
  SLOTS, CRIT_BASE, CRIT_PER_DEX, CRIT_CAP, ATKSPD_PER_DEX, ATKSPD_CAP, BROKEN_PENALTY, EVADE_CAP,
} from '../data/constants.js';
import { UPGRADE_BONUS_PER_LEVEL } from '../data/recipes.js';

// Bir eşyanın yükseltme ve dayanıklılık uygulanmış temel değerleri
export function itemBaseValues(inst) {
  const t = ITEMS[inst.tid];
  const up = isUpgradeable(t) ? 1 + UPGRADE_BONUS_PER_LEVEL * (inst.p || 0) : 1;
  const dur = inst.d <= 0 ? BROKEN_PENALTY : 1;
  const out = {};
  for (const [k, v] of Object.entries(t.base)) out[k] = v * up * dur;
  return out;
}

// Eşyanın tüm katkıları (temel + sabit + legendary + rastgele bonus)
export function itemContribution(inst) {
  const t = ITEMS[inst.tid];
  const b = itemBaseValues(inst);
  const c = {
    phys: b.atkMin !== undefined ? (b.atkMin + b.atkMax) / 2 : 0,
    physMin: b.atkMin ?? 0, physMax: b.atkMax ?? 0,
    mag: (b.magMin !== undefined ? (b.magMin + b.magMax) / 2 : 0) + (b.mag ?? 0),
    def: b.def ?? 0, mdef: b.mdef ?? 0,
    str: 0, dex: 0, int: 0, vit: 0, hp: 0, mp: 0, crit: 0, atkspd: 0, poisonRes: 0, species: {},
  };
  const addFixed = (f) => {
    for (const [k, v] of Object.entries(f || {})) c[k] = (c[k] || 0) + v;
  };
  addFixed(t.fixed);
  addFixed(t.legendaryFixed);
  for (const bn of inst.b || []) {
    if (bn.t === 'species') c.species[bn.s] = (c.species[bn.s] || 0) + bn.v;
    else c[bn.t] = (c[bn.t] || 0) + bn.v;
  }
  return c;
}

export function skillRank(char, id) {
  return char.skills?.[id] || 0;
}

export function passiveValue(char, id, key) {
  const r = skillRank(char, id);
  if (!r) return 0;
  return SKILLS[id][key][r - 1];
}

export function computeStats(char, overrideEquipment = null) {
  const cls = CLASSES[char.cls];
  const L = char.level;
  const eq = overrideEquipment || char.equipment;
  const attr = { str: 0, dex: 0, int: 0, vit: 0 };
  for (const k of Object.keys(attr)) attr[k] = cls.base[k] + (char.alloc?.[k] || 0);

  let weaponPhys = 0, weaponMag = 0, armorDef = 0, gearMdef = 0, hpFlat = 0, mpFlat = 0;
  let crit = 0, atkspd = 0, poisonRes = 0;
  let physMin = 0, physMax = 0;
  const species = {};
  let legendaryEffect = null;
  for (const slot of SLOTS) {
    const inst = eq[slot];
    if (!inst) continue;
    const c = itemContribution(inst);
    weaponPhys += c.phys; weaponMag += c.mag; armorDef += c.def; gearMdef += c.mdef;
    physMin += c.physMin; physMax += c.physMax;
    for (const k of ['str', 'dex', 'int', 'vit']) attr[k] += c[k] || 0;
    hpFlat += c.hp || 0; mpFlat += c.mp || 0; crit += c.crit || 0; atkspd += c.atkspd || 0; poisonRes += c.poisonRes || 0;
    for (const [s, v] of Object.entries(c.species)) species[s] = (species[s] || 0) + v;
    const t = ITEMS[inst.tid];
    if (t.effect && slot === 'weapon') legendaryEffect = t.effect;
  }

  // Pasifler (sınıfa ait olmayan pasifin rankı 0'dır → katkı 0)
  const physDmg = passiveValue(char, 'weapon_discipline', 'physDmg') + passiveValue(char, 'sharpshooter', 'physDmg');
  const magicDmg = passiveValue(char, 'elemental_mastery', 'magicDmg') + passiveValue(char, 'dark_knowledge', 'magicDmg');
  const defPct = passiveValue(char, 'hard_skin', 'defPct');
  const hpPct = passiveValue(char, 'hard_skin', 'hpPct');
  const pAtkSpd = passiveValue(char, 'battle_rhythm', 'atkSpd');
  const mpPct = passiveValue(char, 'mana_control', 'mpPct');
  const costRed = passiveValue(char, 'mana_control', 'costRed');
  const slowedDmg = passiveValue(char, 'frozen_target', 'slowedDmg');
  const pCrit = passiveValue(char, 'frozen_target', 'crit') + passiveValue(char, 'hunter_instinct', 'crit');
  const pEvade = passiveValue(char, 'agile_reflex', 'evade');
  const moveSpd = passiveValue(char, 'agile_reflex', 'moveSpd');
  const minionHpP = passiveValue(char, 'bone_bond', 'minionHp');
  const minionDefP = passiveValue(char, 'bone_bond', 'minionDef');
  const mpOnHit = passiveValue(char, 'soul_harvest', 'mpOnHit');
  // V3 Ustalık II / V4 Ustalık III (küçük, dengeli; yeni sınıf değildir)
  const cs = CLASS_SKILLS[char.cls];
  const m2 = char.mastery2 ? SKILLS[cs?.mastery2] : null;
  const m3 = char.mastery3 ? SKILLS[cs?.mastery3] : null;
  const mv = (k) => (m2?.[k] || 0) + (m3?.[k] || 0);

  const maxHp = Math.round((cls.hp(L, attr.vit) + hpFlat) * (1 + hpPct + mv('hpPct')));
  const maxMp = Math.round((cls.mp(L, attr.int) + mpFlat) * (1 + mpPct + mv('mpPct')));
  // V4: sınıfa özgü güç formülü (Okçu: DEX ağırlıklı; Ölü Çağıran: 1,35 INT). Warrior/Mage formülleri değişmedi.
  const physPower = weaponPhys + (cls.physPower ? cls.physPower(attr, L) : 1.2 * attr.str + 0.35 * L);
  const magicPower = weaponMag + (cls.magicPower ? cls.magicPower(attr, L) : 1.5 * attr.int + 0.3 * L);
  const def = (armorDef + 0.75 * attr.vit + 0.3 * L) * (1 + defPct + mv('defPct'));
  const mdef = gearMdef + 0.4 * attr.int + 0.3 * attr.vit + 0.2 * L;
  const critChance = Math.min(CRIT_CAP, CRIT_BASE + CRIT_PER_DEX * attr.dex + crit + pCrit + mv('crit'));
  const atkSpeed = Math.min(ATKSPD_CAP, ATKSPD_PER_DEX * attr.dex + atkspd + pAtkSpd);
  const attackInterval = cls.attackInterval / (1 + atkSpeed);
  const evade = Math.min(EVADE_CAP, pEvade + mv('evade'));

  const weaponTpl = eq.weapon ? ITEMS[eq.weapon.tid] : null;
  const phys = cls.damageType === 'phys';
  const out = {
    cls: char.cls, level: L, ...attr,
    maxHp, maxMp, physPower, magicPower, def, mdef,
    power: phys ? physPower : magicPower,
    damageType: cls.damageType,
    ranged: !!cls.ranged,
    critChance, atkSpeed, attackInterval,
    attackRange: cls.attackRange,
    dmgMult: phys ? 1 + physDmg + mv('physDmg') : 1 + magicDmg + mv('magicDmg'),
    slowedDmg, costRed: costRed + mv('costRed'), poisonRes: Math.min(0.75, poisonRes), species,
    passiveReduce: m2?.reduce || 0,
    evade, moveSpd, mpOnHit,
    legendaryEffect,
    weaponTpl, twoHanded: weaponTpl?.hand === 'two',
    physRange: [physMin, physMax],
  };
  // V4 Ölü Çağıran: iskelet yardımcının statları (oyuncunun seviyesi, INT ve ekipman gücüne göre)
  if (char.cls === 'necromancer') {
    const rank = char.skills?.summon_skeleton || 0;
    const rankMul = rank ? SKILLS.summon_skeleton.power[rank - 1] : 1;
    out.minion = {
      maxHp: Math.round(maxHp * MINION.hp * (1 + minionHpP + mv('minionHp'))),
      def: def * MINION.def * (1 + minionDefP), mdef: mdef * MINION.def * (1 + minionDefP),
      power: magicPower * MINION.power * rankMul * (1 + mv('minionDmg')),
      attackInterval: MINION.attackInterval, level: L, critChance: 0.05,
    };
  }
  return out;
}

// İskelet yardımcı katsayıları (denge: tests/unit/v4balance.test.js — katkı ≈ sınıf hasarının %25–35'i)
export const MINION = { hp: 0.55, def: 0.9, power: 0.42, attackInterval: 1.4, range: 1.35, speed: 3.9, followDist: 2.2, leash: 10 };

// Bir eşya kuşanılırsa statlar nasıl değişir? (karşılaştırma ekranı gerçek motordan hesaplar)
export function statsWithItem(char, inst) {
  const t = ITEMS[inst.tid];
  // iki elli silahla yardımcı el kuşanılamaz: karşılaştırma gerçek sonucu (değişiklik yok) göstermeli
  if (t.slot === 'offhand' && ITEMS[char.equipment.weapon?.tid]?.hand === 'two') return computeStats(char);
  const eq = { ...char.equipment, [t.slot]: inst };
  if (t.slot === 'weapon' && t.hand === 'two') eq.offhand = null;
  return computeStats(char, eq);
}

export const COMPARE_KEYS = [
  ['power', 'Saldırı gücü', 1], ['def', 'DEF', 1], ['mdef', 'MDEF', 1], ['maxHp', 'Maks. HP', 0],
  ['maxMp', 'Maks. MP', 0], ['critChance', 'Kritik', 'pct'], ['atkSpeed', 'Saldırı hızı', 'pct'],
  ['str', 'STR', 0], ['dex', 'DEX', 0], ['int', 'INT', 0], ['vit', 'VIT', 0],
];

export function classSkillList(cls) {
  const cs = CLASS_SKILLS[cls];
  return { actives: cs.actives.map((id) => SKILLS[id]), passives: cs.passives.map((id) => SKILLS[id]), mastery: SKILLS[cs.mastery], mastery2: SKILLS[cs.mastery2], mastery3: SKILLS[cs.mastery3] };
}
