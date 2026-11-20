// RecipeTracker — tarif sayaçları ve yıldız şartları. Bir düşman yalnızca bir kez sayılır (countedForRecipe).
export function emptyRecipe(chapter) {
  return Object.fromEntries(Object.keys(chapter.recipe).map((k) => [k, 0]));
}

export function addRecipe(run, chapter, key) {
  if (!(key in chapter.recipe)) return false;
  run.recipe[key]++;
  return true;
}

export function recipeComplete(run, chapter) {
  return Object.entries(chapter.recipe).every(([k, n]) => (run.recipe[k] || 0) >= n);
}

// Star rule (Alpha 0.3). 1 = boss defeated; 2 = + full recipe AND chef HP loss <= STAR2_MAX_HP_LOSS;
// 3 = + HP loss <= 1. Shield-prevented damage is not HP loss.
// Why: with Alpha 0.1/0.2's "2 = full recipe" rule a 1-star victory was practically impossible. Missing the recipe
// needs ~6 escaped tomatoes, and every escape costs 1 HP of the chef's 5, so the chef dies first.
export const STAR2_MAX_HP_LOSS = 3;
export function starsFor(run, chapter, victory) {
  if (!victory) return 0;
  let s = 1;
  if (recipeComplete(run, chapter) && run.stats.hpLost <= STAR2_MAX_HP_LOSS) {
    s = 2;
    if (run.stats.hpLost <= 1) s = 3;
  }
  return s;
}
