// data/chapters.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).

/**
 * Phase 04: canonical HTML5 names, layouts, obstacle sets, enemy counts and timers are kept. New: package ids
 * (12-package system; legacy id kept in legacyPkg), chapter `type` (6 chapter types; RUSH/FINAL were packages
 * in HTML5), multi-drop chapters (C7, C11) gain one CUSTOMER segment, C12 gains the mandatory boss arena.
 * Coffee package themes: Hot (C4, C9) and Fizzy (C8). C12 boss delivery uses a simple package.
 * Chapter database. layout is listed TOP -> BOTTOM as [segmentName, enemies].
 * Enemy shorthand: BB Bean Bandit, SS Sugar Sprite, LI Latte Imp, BG Barista Goblin,
 * DC Drip Cultist, CD Cream Drifter, MM Mug Mimic, GK Grinder Knight, SJ Steam Jugger.
 * steam: hazard cycle {idle, warn, active}. picks: start skill picks. cp: has checkpoint.
 */
export const CHAPTERS = [
  { n: 1, name: 'First Cup', pkg: 'STANDARD_ORDER', type: 'STANDARD', legacyPkg: 'STANDARD_ORDER', timer: 60, enemies: 6, picks: 1, cp: false, coins: 60, diff: 1, intro: ['BB'],
    steam: { idle: 2.2, warn: 0.8, active: 1.0 }, tut: ['tut_time'],
    layout: [['END_DROP', ''], ['HALL', 'BB BB'], ['ZIG2', 'BB BB'], ['NARROW', 'BB'], ['SERP', 'BB'], ['ZIG', ''], ['HALL_EASY', ''], ['START', '']],
    mastery: [{ k: 'kills', n: 6 }, { k: 'fullHp' }, { k: 'fast', f: 0.5 }] },
  { n: 2, name: 'Barista Run', pkg: 'STANDARD_ORDER', type: 'STANDARD', legacyPkg: 'STANDARD_ORDER', timer: 70, enemies: 8, picks: 1, cp: false, coins: 80, diff: 1, intro: ['SS'],
    steam: { idle: 2.2, warn: 0.8, active: 1.0 }, tut: [],
    layout: [['END_DROP', ''], ['ZIG2', 'BB BB'], ['HALL', 'SS SS SS'], ['SAFE', ''], ['SERP', 'BB'], ['NARROW', 'SS'], ['QUEUE', ''], ['STORAGE', 'BB'], ['START', '']],
    mastery: [{ k: 'kills', n: 8 }, { k: 'fullHp' }, { k: 'fast', f: 0.55 }] },
  { n: 3, name: 'Steam Intro', pkg: 'FRAGILE_ORDER', type: 'FRAGILE_RUN', legacyPkg: 'FRAGILE_ORDER', timer: 80, enemies: 10, picks: 1, cp: false, coins: 100, diff: 2, intro: ['LI'],
    steam: { idle: 2.6, warn: 0.8, active: 1.0 }, tut: ['tut_fragile', 'tut_heal'],
    layout: [['END_DROP', ''], ['SAFE', ''], ['STEAM2', 'LI BB'], ['SAFE_HEAL', ''], ['HALL', 'LI SS SS'], ['SERP2', ''], ['ZIG', 'BB LI'], ['KITCHEN', ''], ['STORAGE', 'BB SS SS'], ['SERP', ''], ['START', '']],
    mastery: [{ k: 'noSteam' }, { k: 'pkg90' }, { k: 'noHeal' }] },
  { n: 4, name: 'Spilled Espresso', pkg: 'HOT_ORDER', type: 'HAZARD_CORRIDOR', legacyPkg: 'STANDARD_ORDER', timer: 90, enemies: 12, picks: 2, cp: false, coins: 120, diff: 2, intro: ['BG'],
    steam: { idle: 2.0, warn: 0.75, active: 1.1 }, tut: ['tut_spill'],
    layout: [['END_DROP', ''], ['HALL', 'BG BB'], ['SAFE', ''], ['SPILL_WIDE', 'LI SS SS'], ['NARROW', 'BG'], ['KITCHEN', ''], ['SPILL', 'BB LI'], ['REGISTER', 'SS SS BB'], ['QUEUE', ''], ['SERP', 'BB'], ['START', '']],
    mastery: [{ k: 'noImpact' }, { k: 'kills', n: 8 }, { k: 'fullHp' }] },
  { n: 5, name: 'Register Side', pkg: 'HEAVY_PACKAGE', type: 'STANDARD', legacyPkg: 'HEAVY_ORDER', timer: 100, enemies: 14, picks: 2, cp: false, coins: 140, diff: 3, intro: ['DC'],
    steam: { idle: 1.9, warn: 0.7, active: 1.1 }, tut: ['tut_heavy'],
    layout: [['END_DROP', ''], ['SAFE', ''], ['REGISTER', 'DC BB BB'], ['STEAM2', 'LI DC'], ['SERP2', ''], ['SPILL', 'BG SS SS'], ['SAFE_HEAL', ''], ['BAR', 'DC BB LI'], ['KITCHEN', ''], ['STEAM1', 'BG'], ['ZIG2', ''], ['HALL', 'SS BB'], ['START', '']],
    mastery: [{ k: 'noSteam' }, { k: 'pkg90' }, { k: 'kills', n: 10 }] },
  { n: 6, name: 'Steam Tunnel', pkg: 'FRAGILE_ORDER', type: 'HAZARD_CORRIDOR', legacyPkg: 'FRAGILE_ORDER', timer: 110, enemies: 16, picks: 2, cp: false, coins: 160, diff: 3, intro: ['CD'],
    steam: { idle: 1.8, warn: 0.7, active: 1.1 }, tut: [],
    layout: [['END_DROP', ''], ['NARROW', 'CD SS'], ['TUNNEL', 'CD LI BB'], ['SAFE', ''], ['ZIG2', ''], ['SERP', ''], ['TUNNEL2', 'DC BB SS'], ['KITCHEN', ''], ['REGISTER', 'BG DC LI'], ['QUEUE', ''], ['GRATES', 'SS SS SS'], ['ZIG', 'CD BB'], ['START', '']],
    mastery: [{ k: 'noSteam' }, { k: 'pkg90' }, { k: 'kills', n: 10 }] },
  { n: 7, name: 'Coffee Break Checkpoint', pkg: 'STANDARD_ORDER', type: 'MULTI_DROP_ROUTE', legacyPkg: 'STANDARD_ORDER', timer: 115, enemies: 18, picks: 2, cp: true, coins: 180, diff: 3, intro: ['GK'],
    steam: { idle: 1.7, warn: 0.7, active: 1.1 }, tut: ['tut_check', 'tut_elite'],
    layout: [['END_DROP', ''], ['STEAM2', 'DC LI BG'], ['SERP', ''], ['GRATES', 'CD SS BB'], ['CHECK', ''], ['ARENA', 'GK BB LI'], ['CUSTOMER', ''], ['KITCHEN', ''], ['SPILL', 'DC BB SS'], ['SERP2', 'BB'], ['ZIG', 'BG LI BB'], ['HALL', 'SS SS'], ['START', '']],
    mastery: [{ k: 'elite', n: 1 }, { k: 'noSteam' }, { k: 'pkg90' }] },
  { n: 8, name: 'Double Counter Split', pkg: 'FIZZY_ORDER', type: 'STANDARD', legacyPkg: 'HEAVY_ORDER', timer: 125, enemies: 20, picks: 2, cp: true, coins: 200, diff: 4, intro: ['MM'],
    steam: { idle: 1.7, warn: 0.7, active: 1.1 }, tut: ['tut_split', 'tut_mimic'],
    layout: [['END_DROP', ''], ['ARENA', 'GK CD SS BG'], ['SERP2', ''], ['BAR', 'MM LI BB DC'], ['CHECK', ''], ['SPLIT_A', 'BG DC SS SS MM'], ['KITCHEN', ''], ['SERP', ''], ['HALL', 'DC LI BB'], ['QUEUE', ''], ['MUGS', 'MM MM BB SS'], ['START', '']],
    mastery: [{ k: 'risky' }, { k: 'elite', n: 1 }, { k: 'kills', n: 12 }] },
  { n: 9, name: 'Rush Hour', pkg: 'HOT_ORDER', type: 'RUSH_DELIVERY', legacyPkg: 'RUSH_DELIVERY', timer: 130, enemies: 22, picks: 2, cp: true, coins: 220, diff: 4, intro: [],
    steam: { idle: 1.4, warn: 0.7, active: 1.1 }, tut: [],
    layout: [['END_DROP', ''], ['STEAM1', 'DC MM'], ['SERP', ''], ['ARENA', 'GK BB BG'], ['SPILL_WIDE', 'CD SS SS'], ['CHECK', ''], ['TUNNEL', 'DC LI BB'], ['KITCHEN', ''], ['CARTS', 'BG MM'], ['SAFE', ''], ['QUEUE', 'BB'], ['GRATES', 'SS SS SS'], ['SERP2', ''], ['SPILL', 'LI DC'], ['STEAM2', 'BB BB SS'], ['START', '']],
    mastery: [{ k: 'noSteam' }, { k: 'fast', f: 0.6 }, { k: 'noImpact' }] },
  { n: 10, name: 'Closing Shift', pkg: 'FRAGILE_ORDER', type: 'FRAGILE_RUN', legacyPkg: 'FRAGILE_ORDER', timer: 140, enemies: 24, picks: 2, cp: true, coins: 240, diff: 4, intro: ['SJ'],
    steam: { idle: 1.6, warn: 0.7, active: 1.1 }, tut: [],
    layout: [['END_NARROW', ''], ['NARROW', 'BG DC'], ['SERP', ''], ['PIPES', 'MM CD LI'], ['TUNNEL2', 'DC SS BB'], ['JUGGER', 'SJ LI BB'], ['CHECK', ''], ['KITCHEN', ''], ['CARTS', 'BB SS'], ['STORAGE', 'BG MM SS SS'], ['SERP2', 'LI'], ['TUNNEL', 'DC BB CD'], ['QUEUE', ''], ['HALL', 'BB SS SS'], ['START', '']],
    mastery: [{ k: 'elite', n: 1 }, { k: 'pkg90' }, { k: 'noSteam' }] },
  { n: 11, name: 'Late Order', pkg: 'HEAVY_PACKAGE', type: 'MULTI_DROP_ROUTE', legacyPkg: 'HEAVY_ORDER', timer: 150, enemies: 26, picks: 2, cp: true, coins: 260, diff: 5, intro: [],
    steam: { idle: 1.5, warn: 0.7, active: 1.1 }, tut: [],
    layout: [['END_DROP', ''], ['SERP', 'BB SS CD'], ['JUGGER', 'SJ DC LI'], ['KITCHEN', ''], ['ARENA', 'GK BG MM'], ['SPILL_WIDE', 'LI CD BB'], ['SPLIT_B', 'BG MM DC SS SS'], ['CUSTOMER', ''], ['CHECK', ''], ['SERP2', ''], ['GRATES', 'DC SS SS'], ['SERP', ''], ['STEAM2', 'BB BB LI SS'], ['QUEUE', ''], ['MUGS', 'MM BB'], ['START', '']],
    mastery: [{ k: 'risky' }, { k: 'elite', n: 2 }, { k: 'pkg90' }] },
  { n: 12, name: 'Midnight Brew', pkg: 'STANDARD_ORDER', type: 'FINAL_RUSH', legacyPkg: 'FINAL_RUSH', timer: 160, enemies: 30, picks: 2, cp: true, coins: 280, diff: 5, intro: [],
    steam: { idle: 1.4, warn: 0.7, active: 1.15 }, tut: [],
    boss: 'COF_B_LatteArtDragon', layout: [['END_FINAL', ''], ['BOSS_ARENA', ''], ['BOSS_PREP', ''], ['NARROW', 'CD LI'], ['SERP', ''], ['REGISTER', 'DC BB'], ['JUGGER', 'SJ MM'], ['SPILL_WIDE', 'SS SS BG'], ['KITCHEN', ''], ['TUNNEL2', 'DC LI CD'], ['ARENA', 'GK BB BB'], ['CHECK', ''], ['SPLIT_LONG', 'CD BG DC SS SS'], ['SERP2', ''], ['BAR', 'MM MM LI'], ['STEAM2', 'DC BG'], ['QUEUE', 'BB'], ['SPILL', 'LI BB'], ['HALL', 'SS SS'], ['START', '']],
    mastery: [{ k: 'elite', n: 2 }, { k: 'risky' }, { k: 'pkg90' }] },
];
CHAPTERS.forEach(c => { c.id = 'C' + String(c.n).padStart(2, '0'); c.fast = Math.round(c.timer * 0.75); c.tier = Math.min(3, Math.floor((c.n - 1) / 3)); });
export const ACTIVE_CAP = [4, 5, 6, 8];
export const MASTERY_REWARD = 40;
export const MASTERY_TEXT = {
  kills: m => m.n + ' düşman yen', fullHp: () => 'Hiç HP kaybetmeden teslim et', fast: m => '%' + Math.round(m.f * 100) + ' sürede teslim et',
  noSteam: () => 'Hiç buhar hasarı alma', pkg90: () => 'Paketi en az %90 sağlam teslim et', noHeal: () => 'İyileşme istasyonunu kullanmadan bitir',
  noImpact: () => 'Hiç sert çarpma yaşama', elite: m => m.n > 1 ? m.n + ' elit düşman yen' : 'Bir elit düşman yen', risky: () => 'Tehlikeli kısa yolu kullan',
};
export const MASTERY_CHECK = {
  kills: (m, s) => s.kills >= m.n, fullHp: (m, s) => s.playerDmg <= 0, fast: (m, s, ch) => s.time <= ch.timer * m.f,
  noSteam: (m, s) => s.steamHits === 0, pkg90: (m, s) => s.pkgPct >= 0.9, noHeal: (m, s) => !s.healUsed,
  noImpact: (m, s) => s.impacts === 0, elite: (m, s) => s.eliteKills >= m.n, risky: (m, s) => s.risky,
};
