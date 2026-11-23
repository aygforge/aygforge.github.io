/** Central balance configuration. All tunable numbers live here. */
export const TICK_RATE = 20;
export const DT = 1 / TICK_RATE;

export const BALANCE = {
  startGold: 200,
  passiveGoldPerSec: 1.5,
  killGold: 150,
  assistGold: 60,
  assistWindow: 10, // seconds
  killXpBase: 70,
  killXpPerLevel: 18,
  passiveXpPerSec: 0.8,
  maxLevel: 10,
  // cumulative xp required to reach level index+1
  xpTable: [0, 140, 310, 510, 740, 1000, 1300, 1640, 2010, 2420],
  respawnMin: 6,
  respawnMax: 20,
  championVision: 520,
  minionVision: 360,
  towerVision: 600,
  crystalVision: 720,
  summonVision: 320,
  lastSeenFade: 8, // seconds until last seen marker disappears
  recallTime: 3,
  baseHealPerSec: 0.12, // fraction of max hp per second on fountain
  fountainRadius: 190,
  combatTimeout: 5, // out-of-combat after 5s
  cdrCap: 0.3,
  sellRatio: 0.7,
  noMinionTowerReduction: 0.8,
  champSiegeMul: 2.0, // champion damage multiplier vs structures while allied minions support
  crystalChampDamage: 75,
  fortifyUntil: 2.5, // minutes
  fortifyFade: 4,
  fortifyMul: 0.45,
  towerRange: 430,
  crystalRange: 400,
  tp: { max: 100, start: 100, regenPerSec: 2 },
  orderCost: {
    farm: 10,
    defend: 15,
    push: 20,
    retreat: 10,
    raid_top: 35,
    raid_bot: 35,
    boss: 35,
    jungle: 10,
  } as Record<string, number>,
  minion: {
    firstWave: 10,
    interval: 22,
    siegeEvery: 3,
    // minute -> bonus
    scaling: [
      [4, 0.05],
      [5, 0.1],
      [6, 0.15],
      [7, 0.2],
      [8, 0.25],
      [9, 0.3],
    ] as [number, number][],
  },
  jungle: { firstSpawn: 20, respawn: 50, leash: 380 },
  boss: { bloodFirst: 150, titanFirst: 210, respawn: 120, leash: 520 },
  bossBuff: {
    blood: { duration: 45, champDmg: 0.08, champDmgLate: 0.1 },
    titan: { duration: 50, towerDmg: 0.12, towerDmgLate: 0.16, minionHp: 0.1 },
    lateMinute: 6,
  },
  spiritSpeedBuff: { amount: 0.15, duration: 20 },
  synergyBonus: 0.03,
  synergyCap: 0.06,
  positionEff: { high: 0.04, mid: 0, low: -0.04 } as Record<string, number>,
  bossPercentCap: 60, // max damage per percent-based proc vs bosses/large monsters
};

export function respawnTime(level: number): number {
  const t = (level - 1) / (BALANCE.maxLevel - 1);
  return BALANCE.respawnMin + (BALANCE.respawnMax - BALANCE.respawnMin) * t;
}

export function minionScale(timeSec: number): number {
  const m = timeSec / 60;
  let b = 0;
  for (const [min, v] of BALANCE.minion.scaling) if (m >= min) b = v;
  return b;
}
