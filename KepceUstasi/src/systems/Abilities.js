// Abilities — koşu içi 24 geçici yetenek: uygunluk, teklif (3 kart), seçim ve etkiler.
// Kart metni ve mekanik aynı veri kaynağını (ABILITY_VALUES) kullanır.
import { ABILITIES, ABILITY_BY_ID, ABILITY_VALUES, LADLE, COMBAT_CARD_CATS, SKILL_WAVES } from '../data/content.js';

const AV = ABILITY_VALUES;

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

/**
 * 3 options from the eligible pool:
 *  - at least 2 families when possible,
 *  - in the first two choices of a run at least one direct combat card (attack / pan family),
 *  - never the exact same three cards as `previous` (reroll) or as the previous choice's offer.
 * Fully deterministic for a given rng state.
 */
export function makeOffer(run, chapter, rng, previous = null) {
  const pool = eligiblePool(run, chapter);
  if (pool.length <= 3) return pool.map((a) => a.id);
  const avoid = [previous, run.lastOffer].filter(Boolean).map(key);
  const needCombat = (run.choiceCount || 0) <= 2 && pool.some((a) => COMBAT_CARD_CATS.includes(a.cat));
  let fallback = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const picks = rng.shuffle(pool).slice(0, 3);
    const ids = picks.map((p) => p.id);
    fallback = fallback || ids;
    if (new Set(picks.map((p) => p.cat)).size < 2) continue;
    if (needCombat && !picks.some((p) => COMBAT_CARD_CATS.includes(p.cat))) continue;
    if (avoid.includes(key(ids))) continue;
    return ids;
  }
  return fallback;
}

export function applyAbility(run, chapter, id) {
  const ab = ABILITY_BY_ID[id];
  if (!ab || !isEligible(run, chapter, ab)) return false;
  run.abilities[id] = (run.abilities[id] || 0) + 1;
  const l = run.abilities[id];
  if (id === 'thick_apron' || id === 'first_aid') {
    // immediate effects count as "worked" when applied
    if (!run.stats.procs) run.stats.procs = {};
    run.stats.procs[id] = (run.stats.procs[id] || 0) + 1;
  }
  switch (id) {
    case 'thick_apron':
      run.chef.maxHp += 1;
      run.chef.hp += 1;
      break;
    case 'first_aid':
      run.chef.hp = Math.min(run.chef.maxHp, run.chef.hp + AV.first_aid[0]);
      break;
    case 'salt_shield':
      run.chef.saltCharges += 1;
      break;
    default:
      break;
  }
  return l > 0;
}

// Ladle parameters from permanent upgrades + temporary abilities (real physics/geometry changes).
export function ladleParams(run) {
  const ab = run.abilities;
  const wide = ab.wide_ladle ? AV.wide_ladle[ab.wide_ladle - 1] : 0;
  const deep = ab.deep_ladle ? AV.deep_ladle[ab.deep_ladle - 1] : 0;
  const slow = ab.slow_swing ? AV.slow_swing[ab.slow_swing - 1] : 0;
  const rim = ab.stable_rim ? AV.stable_rim[ab.stable_rim - 1] : 0;
  return {
    radius: +(LADLE.radius * run.perm.width * (1 + wide)).toFixed(3),
    capacity: run.perm.capacity + deep,
    period: +(LADLE.swingPeriod / (1 - slow)).toFixed(4),
    rimLift: +(LADLE.rimBase + rim).toFixed(3),
  };
}

// Card text for the UI: the current level's effect and what the next level gives (same data as the mechanics).
export function cardInfo(run, id) {
  const ab = ABILITY_BY_ID[id];
  const cur = run.abilities[id] || 0;
  return {
    id,
    name: ab.name,
    cat: ab.cat,
    level: cur,
    nextLevel: cur + 1,
    max: ab.max,
    now: cur ? ab.desc(cur) : null,
    next: ab.desc(cur + 1),
  };
}

export const TOTAL_CHOICES = SKILL_WAVES.length;
