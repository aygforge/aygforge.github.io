// data/packages.js — 12 package types (Master Prompt §10) + 6 chapter types.
// hp, speedMul (courier speed), hazardMul (hazard package damage), impactMul (collision package damage),
// pkgDmgMul (all package damage), reward (base coin multiplier on success), rule (special runtime rule).
// Starting balance values; HEAVY_ORDER (HTML5) is an alias of HEAVY_PACKAGE.
export const PACKAGES = {
  STANDARD_ORDER:    { id: 'STANDARD_ORDER',    hp: 100, speedMul: 1.00, hazardMul: 1.0, impactMul: 1.0, pkgDmgMul: 1.0, reward: 1.00, rule: null,     color: '#f2a541', icon: 'S' },
  HEAVY_PACKAGE:     { id: 'HEAVY_PACKAGE',     hp: 120, speedMul: 0.90, hazardMul: 1.0, impactMul: 0.9, pkgDmgMul: 1.0, reward: 1.00, rule: null,     color: '#8d6e63', icon: 'A' },
  FRAGILE_ORDER:     { id: 'FRAGILE_ORDER',     hp: 100, speedMul: 1.00, hazardMul: 1.5, impactMul: 1.5, pkgDmgMul: 1.0, reward: 1.00, rule: null,     color: '#5aa9e6', icon: 'K' },
  XL_ORDER:          { id: 'XL_ORDER',          hp: 180, speedMul: 0.80, hazardMul: 1.0, impactMul: 1.0, pkgDmgMul: 1.0, reward: 1.25, rule: null,     color: '#c0703a', icon: 'X' },
  LIGHTWEIGHT_ORDER: { id: 'LIGHTWEIGHT_ORDER', hp: 65,  speedMul: 1.12, hazardMul: 1.0, impactMul: 1.0, pkgDmgMul: 1.0, reward: 1.00, rule: null,     color: '#9be7c4', icon: 'L' },
  REINFORCED_ORDER:  { id: 'REINFORCED_ORDER',  hp: 130, speedMul: 0.95, hazardMul: 0.7, impactMul: 1.0, pkgDmgMul: 1.0, reward: 1.00, rule: null,     color: '#7d8fb0', icon: 'R' },
  PREMIUM_ORDER:     { id: 'PREMIUM_ORDER',     hp: 80,  speedMul: 1.00, hazardMul: 1.0, impactMul: 1.0, pkgDmgMul: 1.2, reward: 1.50, rule: null,     color: '#ffd23f', icon: 'P' },
  VIP_ORDER:         { id: 'VIP_ORDER',         hp: 100, speedMul: 1.00, hazardMul: 1.0, impactMul: 1.0, pkgDmgMul: 1.0, reward: 1.75, rule: 'vip',    color: '#b78cff', icon: 'V', vipMin: 0.8 },
  HOT_ORDER:         { id: 'HOT_ORDER',         hp: 100, speedMul: 1.00, hazardMul: 1.0, impactMul: 1.0, pkgDmgMul: 1.0, reward: 1.20, rule: 'hot',    color: '#ff6b3a', icon: 'H', failAt: 0.25 },
  FROZEN_ORDER:      { id: 'FROZEN_ORDER',      hp: 100, speedMul: 1.00, hazardMul: 1.0, impactMul: 1.0, pkgDmgMul: 1.0, reward: 1.00, rule: 'frozen', color: '#7fe1ff', icon: 'F', failAt: 0.20 },
  FIZZY_ORDER:       { id: 'FIZZY_ORDER',       hp: 90,  speedMul: 1.00, hazardMul: 1.0, impactMul: 1.0, pkgDmgMul: 1.0, reward: 1.00, rule: 'fizzy',  color: '#6ee06a', icon: 'Z' },
  MYSTERY_ORDER:     { id: 'MYSTERY_ORDER',     hp: 100, speedMul: 1.00, hazardMul: 1.0, impactMul: 1.0, pkgDmgMul: 1.0, reward: 1.40, rule: 'mystery', color: '#e07bd8', icon: '?' },
};
export const PACKAGE_IDS = Object.keys(PACKAGES);
/** Legacy HTML5 ids -> current ids (old saves / data). RUSH_DELIVERY and FINAL_RUSH became chapter types. */
export const PACKAGE_ALIAS = { HEAVY_ORDER: 'HEAVY_PACKAGE', RUSH_DELIVERY: 'STANDARD_ORDER', FINAL_RUSH: 'STANDARD_ORDER' };
export const pkgOf = id => PACKAGES[id] || PACKAGES[PACKAGE_ALIAS[id]] || PACKAGES.STANDARD_ORDER;
/** Rules a MYSTERY_ORDER may resolve to (never Mystery itself). */
export const MYSTERY_POOL = ['HEAVY_PACKAGE', 'FRAGILE_ORDER', 'XL_ORDER', 'LIGHTWEIGHT_ORDER', 'REINFORCED_ORDER', 'PREMIUM_ORDER', 'VIP_ORDER', 'HOT_ORDER', 'FROZEN_ORDER', 'FIZZY_ORDER'];
/** Packages never used on a boss final (C12): extra fail gates. */
export const FINAL_FORBIDDEN = ['HOT_ORDER', 'FROZEN_ORDER', 'FIZZY_ORDER', 'MYSTERY_ORDER', 'VIP_ORDER'];

export const CHAPTER_TYPES = ['STANDARD', 'RUSH_DELIVERY', 'FRAGILE_RUN', 'HAZARD_CORRIDOR', 'MULTI_DROP_ROUTE', 'FINAL_RUSH'];
