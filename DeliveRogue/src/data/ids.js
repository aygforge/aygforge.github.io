// data/ids.js — stable ID registry for the full release scope. Phase 01: identities only;
// runtime content for non-Coffee episodes is added in later phases (see docs/CONTENT_COVERAGE.md).
export const EPISODE_IDS = ['COF', 'BRG', 'SUS', 'DON', 'DES', 'PIZ', 'VEG', 'FSH', 'KUM', 'TAC'];
/** Legacy HTML5 episode keys -> canonical district codes. */
export const LEGACY_EPISODE_ALIAS = { coffee: 'COF', burger: 'BRG', sushi: 'SUS' };
/** Chapter key format `mode:episode:chapter`, e.g. campaign:COF:C01. Accepts C1 / C01 aliases. */
export const chapterKey = (mode, ep, ch) => `${mode}:${ep}:C${String(ch).replace(/^C/i, '').padStart(2, '0')}`;
/** Package ID aliases: legacy HTML5 -> new contract (applied in Phase 04 package system). */
export const PACKAGE_ALIAS = { HEAVY_ORDER: 'HEAVY_PACKAGE' };
/** Legacy package ids that become chapter types in the new contract. */
export const PACKAGE_TO_CHAPTER_TYPE = { RUSH_DELIVERY: 'RUSH_DELIVERY', FINAL_RUSH: 'FINAL_RUSH' };
export const SCENE_IDS = ['Boot', 'MainMenu', 'Garage', 'MetaHub', 'RunPrep', 'FightScene', 'RunSummary', 'Settings'];
export const ORIGINAL_SKIN_IDS = ['SKIN_DEFAULT', 'SKIN_COFFEE', 'SKIN_FARMER', 'SKIN_HAZARDOUS', 'SKIN_MONSTERTR', 'SKIN_NEON'];
