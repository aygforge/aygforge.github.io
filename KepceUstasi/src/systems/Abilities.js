// Abilities — koşu içi 16 geçici yetenek: uygunluk, teklif (3 kart), seçim ve etkiler.
import { ABILITIES, ABILITY_BY_ID, LADLE } from '../data/content.js';

export function isEligible(run, chapter, ab) {
  const stacks = run.abilities[ab.id] || 0;
  if (stacks >= ab.max) return false;
  if (ab.eligibleTags && !ab.eligibleTags.every((t) => chapter.tags.includes(t))) return false;
  if (ab.requires === 'injured' && run.chef.hp >= run.chef.maxHp) return false;
  return true;
}

export function eligiblePool(run, chapter) {
  return ABILITIES.filter((a) => isEligible(run, chapter, a));
}

const key = (ids) => ids.slice().sort().join('|');

// 3 options, ≥2 families when possible, never identical to `previous` set (reroll).
export function makeOffer(run, chapter, rng, previous = null) {
  const pool = eligiblePool(run, chapter);
  if (pool.length <= 3) return pool.map((a) => a.id);
  for (let attempt = 0; attempt < 30; attempt++) {
    const picks = rng.shuffle(pool).slice(0, 3);
    const cats = new Set(picks.map((p) => p.cat));
    const ids = picks.map((p) => p.id);
    if (cats.size < 2 && attempt < 25) continue;
    if (previous && key(ids) === key(previous) && attempt < 29) continue;
    return ids;
  }
  return rng.shuffle(pool).slice(0, 3).map((a) => a.id);
}

export function applyAbility(run, chapter, id) {
  const ab = ABILITY_BY_ID[id];
  if (!ab || !isEligible(run, chapter, ab)) return false;
  run.abilities[id] = (run.abilities[id] || 0) + 1;
  switch (id) {
    case 'thick_apron':
      run.chef.maxHp += 1;
      run.chef.hp += 1;
      break;
    case 'first_aid':
      run.chef.hp = Math.min(run.chef.maxHp, run.chef.hp + 2);
      break;
    case 'salt_shield':
      run.chef.saltCharges += 1;
      break;
    default:
      break;
  }
  return true;
}

// Ladle parameters from permanent upgrades + temporary abilities (real physics/geometry changes).
export function ladleParams(run) {
  const ab = run.abilities;
  return {
    radius: +(LADLE.radius * run.perm.width * (1 + 0.12 * (ab.wide_ladle || 0))).toFixed(3),
    capacity: run.perm.capacity + (ab.deep_ladle || 0),
    period: +(LADLE.swingPeriod / Math.pow(0.88, ab.slow_swing || 0)).toFixed(4),
    rimLift: +(LADLE.rimBase + LADLE.rimPerStack * (ab.stable_rim || 0)).toFixed(3),
  };
}
