// Derive combat stats from class, level, equipment, loadout and active buffs.
// Used by the server (authoritative) and by the client for previews/tooltips.
import { BALANCE } from './data/balance.js';
import { CLASSES } from './data/classes.js';
import { BASE_BY_ID, FAMILIES, SETS } from './data/items.js';
import { AFFIX_BY_ID } from './data/affixes.js';
import { SKILLS, NODE_BY_ID } from './data/skills.js';
import { REF, itemBaseStats, scale } from './formulas.js';

const ZERO = () => ({
  critChance: 0.05, critDamage: 1.5, attackSpeed: 0, lifesteal: 0, evasion: 0.02, blockChance: 0,
  counterChance: 0, thorns: 0, physDmg: 0, spellDmg: 0, elemDmg: 0, poisonDmg: 0, burnDmg: 0, poisonDur: 0,
  bossDmg: 0, eliteDmg: 0, dmgPct: 0, dr: 0, resist: 0.05, hpPct: 0, armorPct: 0,
  resourceRegen: 0, rageGain: 0, costReduction: 0, cdr: 0, xpBonus: 0, goldBonus: 0, lootBonus: 0,
});

export function deriveStats({ cls, level, equipped = {}, loadout = null, buffs = [] }) {
  const C = CLASSES[cls];
  const s = ZERO();
  const flags = {};
  const skillMods = {};
  const uniques = [];
  const setCounts = {};
  let armor = REF.armorPiece(level) * C.armorMult;
  let weaponDps = REF.weaponDps(level) * 0.35; // unarmed
  let aps = 1.0;
  let ranged = false;
  let weaponFamily = null;
  let spellPower = 0;

  const add = (k, v) => { s[k] = (s[k] || 0) + v; };

  const main = equipped.mainhand;
  const off = equipped.offhand;
  for (const [slot, item] of Object.entries(equipped)) {
    if (!item) continue;
    const base = BASE_BY_ID[item.base_id];
    if (!base) continue;
    const bs = itemBaseStats(base, item.item_level, item.rarity, item.upgrade);
    if (bs.armor) armor += bs.armor;
    if (bs.block) add('blockChance', bs.block);
    if (bs.hpPct) add('hpPct', bs.hpPct);
    if (bs.critChance) add('critChance', bs.critChance);
    if (bs.spellPower) spellPower += bs.spellPower;
    if (bs.resourceRegen) add('resourceRegen', bs.resourceRegen);
    for (const a of item.affixes || []) {
      const def = AFFIX_BY_ID[a.id];
      if (def) add(def.stat, a.v);
    }
    if (base.unique) { uniques.push(base.unique); flags[base.unique] = 1; }
    if (base.set) setCounts[base.set] = (setCounts[base.set] || 0) + 1;
    if (base.unique === 'u_ember') add('resist', 0.1);
  }
  if (main) {
    const b = BASE_BY_ID[main.base_id];
    const f = FAMILIES[b.family];
    const bs = itemBaseStats(b, main.item_level, main.rarity, main.upgrade);
    weaponDps = bs.dps; aps = f.speed; ranged = !!f.ranged; weaponFamily = b.family;
    if (off) {
      const ob = BASE_BY_ID[off.base_id];
      if (FAMILIES[ob.family].kind === 'weapon') {
        const os = itemBaseStats(ob, off.item_level, off.rarity, off.upgrade);
        weaponDps += os.dps * 0.5;
        aps *= 1.1;
        flags.dualWield = 1;
      } else if (ob.family === 'shield') {
        flags.shield = 1;
      }
    }
  }
  weaponDps += spellPower;

  // sets
  const setBonuses = [];
  for (const [setId, n] of Object.entries(setCounts)) {
    const S = SETS[setId];
    if (n >= 2) { for (const [k, v] of Object.entries(S.bonus2.stats)) add(k, v); setBonuses.push(setId + ':2'); }
    if (n >= 4) { flags[S.bonus4.flag] = 1; setBonuses.push(setId + ':4'); }
  }

  // skills: passives and tree nodes
  const lo = loadout || { tree: {}, actives: [], passives: [], rules: {} };
  for (const pid of lo.passives || []) {
    const p = pid && SKILLS[pid];
    if (!p || p.cls !== cls || p.unlock > level) continue;
    for (const [k, v] of Object.entries(p.stats || {})) add(k, v);
    if (p.flag) flags[p.flag] = 1;
  }
  for (const [nid, rank] of Object.entries(lo.tree || {})) {
    const n = NODE_BY_ID[nid];
    if (!n || n.reqLevel > level || !rank) continue;
    const r = Math.min(rank, n.maxRank);
    for (const e of n.e) {
      if (e.type === 'stat') add(e.stat, e.per * r);
      else if (e.type === 'flag') flags[e.flag] = (flags[e.flag] || 0) + e.per * r;
      else if (e.type === 'skill') {
        skillMods[e.skill] ||= {};
        skillMods[e.skill][e.field] = (skillMods[e.skill][e.field] || 0) + e.per * r;
      }
    }
  }
  for (const b of buffs) add(b.stat, b.value);

  // primary attribute
  const primary = 10 + 2 * (level - 1);
  const primaryMult = 1 + primary * 0.004;

  // caps
  const CAP = BALANCE.CAPS;
  const capped = {
    critChance: Math.min(CAP.critChance, s.critChance),
    critDamage: Math.min(CAP.critDamage, s.critDamage),
    attackSpeed: Math.min(CAP.attackSpeedBonus, s.attackSpeed),
    lifesteal: Math.min(CAP.lifesteal, s.lifesteal),
    evasion: Math.min(CAP.evasion, s.evasion),
    resist: Math.min(CAP.resist, s.resist),
    cdr: Math.min(CAP.cooldownReduction, s.cdr),
    xpBonus: Math.min(CAP.xpBonus, s.xpBonus),
    goldBonus: Math.min(CAP.goldBonus, s.goldBonus),
    lootBonus: Math.min(CAP.lootBonus, s.lootBonus),
    blockChance: Math.min(0.35, s.blockChance),
    counterChance: Math.min(0.3, s.counterChance),
    dr: Math.min(0.3, s.dr),
    costReduction: Math.min(0.4, s.costReduction),
  };

  const maxHp = Math.round(REF.playerHp(level) * C.hpMult * (1 + s.hpPct));
  const dmgTypePct = cls === 'mage' ? s.spellDmg : s.physDmg;
  const out = {
    ...s, ...capped,
    cls, level,
    maxHp,
    armor: Math.round(armor * (1 + s.armorPct)),
    weaponDps: Math.round(weaponDps * 10) / 10,
    aps: Math.round(aps * (1 + capped.attackSpeed) * 1000) / 1000,
    ranged: cls === 'mage' ? true : ranged,
    weaponFamily,
    dmgMult: primaryMult * (1 + dmgTypePct + s.dmgPct),
    range: cls === 'ranger' && !ranged ? 30 : C.range,
    preferredRange: cls === 'ranger' && !ranged ? 24 : C.preferredRange,
    moveSpeed: C.moveSpeed,
    resourceMax: C.resourceMax,
    flags, skillMods, uniques, setCounts, setBonuses,
    actives: (lo.actives || []).filter((id) => id && SKILLS[id] && SKILLS[id].cls === cls && SKILLS[id].unlock <= level),
    passives: (lo.passives || []).filter((id) => id && SKILLS[id] && SKILLS[id].cls === cls && SKILLS[id].unlock <= level),
    rules: lo.rules || {},
  };
  // estimated DPS shown in UI (single target, average crit, no skills)
  out.estDps = Math.round(out.weaponDps * out.dmgMult * (1 + out.critChance * (out.critDamage - 1)) * (out.aps / (aps || 1)) * 10) / 10;
  out.estDefense = Math.round(out.maxHp / (1 - Math.min(0.75, out.armor / (out.armor + 60 * scale(level)))));
  return out;
}
