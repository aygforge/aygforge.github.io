// Progression — bahşiş, kalıcı geliştirmeler, chapter açılımı ve koşu ödülü.
import { UPGRADES, UPGRADE_BY_ID, MAX_UPGRADE_LEVEL, CHAPTERS, ECONOMY, NORMAL_WAVES } from '../data/content.js';

export function upgradeValue(save, id) {
  const u = UPGRADE_BY_ID[id];
  const lvl = Math.max(1, Math.min(MAX_UPGRADE_LEVEL, save.upgrades[id] || 1));
  return u.values[lvl - 1];
}

export function upgradeCost(save, id) {
  const lvl = save.upgrades[id] || 1;
  if (lvl >= MAX_UPGRADE_LEVEL) return null;
  return UPGRADE_BY_ID[id].costs[lvl - 1];
}

// Atomic purchase: check -> subtract -> level up. Caller persists immediately after success.
export function purchaseUpgrade(save, id) {
  if (!UPGRADE_BY_ID[id]) return { ok: false, reason: 'unknown' };
  const cost = upgradeCost(save, id);
  if (cost == null) return { ok: false, reason: 'max' };
  if (save.tips < cost) return { ok: false, reason: 'funds' };
  save.tips -= cost;
  save.upgrades[id] = (save.upgrades[id] || 1) + 1;
  return { ok: true, cost, level: save.upgrades[id] };
}

export function permStats(save) {
  const tough = upgradeValue(save, 'toughness');
  return {
    capacity: upgradeValue(save, 'capacity'),
    width: upgradeValue(save, 'width'),
    hp: tough.hp,
    shield: tough.shield,
    mastery: upgradeValue(save, 'mastery'),
    pan: upgradeValue(save, 'pan'),
    spice: upgradeValue(save, 'spice'),
  };
}

export function isUnlocked(save, chapterIndex) {
  return chapterIndex <= (save.highestUnlocked || 1);
}

/**
 * Run reward (GDD §13).
 * victory: base + quality bonus (2★ +15 %, 3★ +30 %) + first clear bonus once.
 * defeat: floor(base * 0.70 * completedNormalWaves / 6).
 */
export function computeReward(chapter, { victory, stars, completedWaves, firstClear }) {
  const base = chapter.baseTip;
  if (!victory) {
    const w = Math.max(0, Math.min(NORMAL_WAVES, completedWaves));
    return { base: 0, quality: 0, firstBonus: 0, failReward: Math.floor((base * ECONOMY.failFactor * w) / NORMAL_WAVES), total: Math.floor((base * ECONOMY.failFactor * w) / NORMAL_WAVES) };
  }
  const quality = stars >= 3 ? Math.round(base * ECONOMY.star3Bonus) : stars === 2 ? Math.round(base * ECONOMY.star2Bonus) : 0;
  const firstBonus = firstClear ? chapter.firstClearBonus : 0;
  return { base, quality, firstBonus, failReward: 0, total: base + quality + firstBonus };
}

// Applies a finished run to the save exactly once (guarded by runId).
export function applyRunResult(save, chapter, run, { victory, stars }) {
  if (save.claimedRuns.includes(run.runId)) return { duplicate: true, reward: null };
  const chapState = save.chapters[chapter.id] || { stars: 0, cleared: false, plays: 0 };
  const firstClear = victory && !chapState.cleared;
  const completedWaves = run.wave > NORMAL_WAVES ? NORMAL_WAVES : run.stats.completedWaves;
  const reward = computeReward(chapter, { victory, stars, completedWaves, firstClear });
  save.tips += reward.total;
  chapState.plays++;
  if (victory) {
    chapState.cleared = true;
    chapState.stars = Math.max(chapState.stars, stars);
    const next = CHAPTERS.find((c) => c.index === chapter.index + 1);
    if (next) save.highestUnlocked = Math.max(save.highestUnlocked, next.index);
  }
  save.chapters[chapter.id] = chapState;
  save.claimedRuns.push(run.runId);
  if (save.claimedRuns.length > 50) save.claimedRuns.splice(0, save.claimedRuns.length - 50);
  save.activeRun = null; // the snapshot is cleared in the same atomic write
  save.stats.runs++;
  if (victory) save.stats.wins++;
  return { duplicate: false, reward, firstClear };
}

export { UPGRADES };
