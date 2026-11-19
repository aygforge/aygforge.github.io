// Helpers for balance simulation and tests: build representative characters.
import * as R from './rng.js';
import { generateItem } from './loot.js';
import { CLASSES } from './data/classes.js';
import { CLASS_SKILLS, SKILLS, TREES, defaultLoadout } from './data/skills.js';
import { deriveStats } from './stats.js';

const KIT = {
  warrior: { mainhand: ['w_sword_1', 'w_sword_2', 'w_sword_3'], offhand: ['w_shield_1', 'w_shield_2', 'w_shield_3'], prefix: 'w' },
  ranger: { mainhand: ['r_bow_1', 'r_bow_2', 'r_bow_3'], offhand: [null, null, null], prefix: 'r' },
  mage: { mainhand: ['m_staff_1', 'm_staff_2', 'm_staff_3'], offhand: [null, null, null], prefix: 'm' },
};

export function gearSet(seed, cls, level, rarity) {
  const rng = R.makeRng(seed);
  const tier = level >= 21 ? 2 : level >= 11 ? 1 : 0;
  const k = KIT[cls];
  const eq = {};
  eq.mainhand = generateItem(rng, k.mainhand[tier], level, rarity);
  if (k.offhand[tier]) eq.offhand = generateItem(rng, k.offhand[tier], level, rarity);
  const at = level >= 11 ? 2 : 1;
  for (const s of ['head', 'chest', 'gloves', 'legs', 'boots']) eq[s] = generateItem(rng, `${k.prefix}_${s}_${at}`, level, rarity);
  const jt = Math.min(3, tier + 1);
  eq.belt = generateItem(rng, `belt_${jt}`, level, rarity);
  eq.amulet = generateItem(rng, `amulet_${jt}`, level, rarity);
  eq.ring1 = generateItem(rng, `ring_${jt}`, level, rarity);
  eq.ring2 = generateItem(rng, `ring_${jt}`, level, rarity);
  return eq;
}

export function autoLoadout(cls, level, treeId = null) {
  const lo = defaultLoadout(cls);
  const actives = CLASS_SKILLS[cls].actives.filter((id) => SKILLS[id].unlock <= level);
  // prefer the newest 4 offensive/defensive mix: keep first, then last 3 unlocked
  const pick = actives.length <= 4 ? actives : [actives[0], ...actives.slice(-3)];
  lo.actives = [0, 1, 2, 3].map((i) => pick[i] || null);
  const passives = CLASS_SKILLS[cls].passives.filter((id) => SKILLS[id].unlock <= level);
  lo.passives = [passives[0] || null, passives[1] || null];
  const trees = TREES.filter((t) => t.cls === cls);
  const tree = trees.find((t) => t.id === treeId) || trees[0];
  let pts = Math.floor(level / 2);
  for (const n of tree.nodes) {
    if (n.reqLevel > level || pts <= 0) break;
    const r = Math.min(n.maxRank, pts);
    lo.tree[n.id] = r; pts -= r;
  }
  return lo;
}

export function makeStats(cls, level, rarity = 1, seed = 1, treeId = null) {
  return deriveStats({ cls, level, equipped: gearSet(seed, cls, level, rarity), loadout: autoLoadout(cls, level, treeId) });
}

export { CLASSES };
