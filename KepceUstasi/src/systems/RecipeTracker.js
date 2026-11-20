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

// 1 = boss defeated; 2 = + full recipe; 3 = + total chef HP loss <= 1 (shield-prevented damage is not HP loss)
export function starsFor(run, chapter, victory) {
  if (!victory) return 0;
  let s = 1;
  if (recipeComplete(run, chapter)) {
    s = 2;
    if (run.stats.hpLost <= 1) s = 3;
  }
  return s;
}
