// Central balance constants. Every economy / combat number lives here or in formulas.js.
export const BALANCE = {
  MAX_LEVEL: 100,            // full game
  ALPHA_LEVEL_CAP: 30,       // Alpha 0.1 content cap
  TICK_MS: 50,               // simulation fixed step
  TICK_S: 0.05,

  // combat caps (anti infinite loops / immortal builds)
  CAPS: {
    critChance: 0.6,
    critDamage: 3.5,
    attackSpeedBonus: 1.0,   // +100%
    lifesteal: 0.08,
    evasion: 0.4,
    damageReduction: 0.75,
    cooldownReduction: 0.3,
    resist: 0.75,
    xpBonus: 0.5,
    goldBonus: 0.5,
    lootBonus: 0.5,
  },

  // drop rules
  NORMAL_DROP_CHANCE: 0.04,
  ELITE_DROP_CHANCE: 0.35,
  CHAMPION_SPAWN_CHANCE: 0.012,
  ELITE_SPAWN_CHANCE: 0.06,
  MATERIAL_DROP_CHANCE: 0.22,
  HERB_DROP_CHANCE: 0.08,

  // base rarity weights (spec section 11)
  RARITY_WEIGHTS: [60, 28, 9, 2.5, 0.45, 0.045, 0.005],

  // farm session
  HEARTBEAT_S: 20,           // client heartbeat cadence
  LEASE_S: 90,               // server lease after last heartbeat
  MAX_SETTLE_S: 120,         // max seconds simulated in one settlement

  // offline (spec section 17)
  OFFLINE_MAX_S: 8 * 3600,
  OFFLINE_MIN_S: 60,
  OFFLINE_XP_RATE: 0.4,
  OFFLINE_MAT_RATE: 0.3,

  // inventory
  BAG_SLOTS: 60,
  STASH_SLOTS: 120,
  OVERFLOW_SLOTS: 40,

  // market (spec section 15)
  MARKET_MAX_ACTIVE: 10,
  MARKET_DURATIONS_H: [12, 24, 48],
  MARKET_LISTING_FEE: 0.02,
  MARKET_COMMISSION: 0.05,
  MARKET_MIN_PRICE: 10,
  MARKET_MAX_PRICE: 2_000_000_000,

  // death
  RESPAWN_S: 4,
  DEATH_WINDOW_S: 300,
  DEATH_LIMIT: 3,

  // skills
  SKILL_RESET_GOLD_PER_LEVEL: 40,
  DAILY_HUNT_MAX: 7,
};

export const STARTING_GOLD = 150;
