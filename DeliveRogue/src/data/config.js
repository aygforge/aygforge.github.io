// data/config.js — central runtime config (versioned so seed + config version => identical content).
export const CONFIG = {
  version: 'cof-04.1',
  routeVariants: true,          // A/B/C combat-segment variants (C4+). Debug harnesses may switch off for baselines.
  variantFromChapter: 4,        // C1–C3 tutorial chapters always use the canonical layout
  bossArenaTime: 90,            // seconds (separate boss timer; delivery timer pauses inside the arena)
  bossFirstClearCoins: { COF: 400 },
  midDropXpShare: 0.15,         // share of the route XP budget paid for intermediate drops (once each)
  hot: { failAt: 0.25, decayOverTimer: 1.35, steamWarm: 6 },      // temp 100→25 % over timer×1.35
  frozen: { failAt: 0.20, decayOverTimer: 1.35, heatMelt: 14, steamMelt: 12 },
  fizzy: { impact: 22, knock: 12, turn: 7, calmAfter: 1.5, calmRate: 7, turnCd: 0.45 },
};
