// Kalıcı (meta) ve run durumunun oluşturulması. Saf veri; DOM'a bağımlı değildir.
import { BALANCE, SAVE_VERSION } from '../config/balance.js';
import { SHIP_BY_LEVEL } from '../data/ships.js';
import { UPGRADE_BY_ID } from '../data/upgrades.js';
import { initRunX1, initMetaX1 } from '../systems/X1System.js';

export function createMeta() {
  const m = {
    v: SAVE_VERSION,
    xpAvailable: 0,
    xpTotalEarned: 0,
    xpSpent: 0,
    upgrades: [],
    achievements: [],
    solaraHired: false,
    codex: {
      harbors: {}, // keşfedilen limanlar (ziyaret)
      revealed: {}, // harita parçası ile bilgisi açılan limanlar
      harborTypes: {},
      events: {},
      crewMet: {},
      crewHired: {},
      pets: {},
      goods: {},
      notes: {},
      oldFriends: false,
    },
    stats: {
      runs: 0,
      completed: 0,
      sunk: 0,
      bestHarbors: 0,
      totalGoldEarned: 0,
      totalEvents: 0,
      bestGold: 0,
    },
    seenRunIds: [],
  };
  initMetaX1(m);
  return m;
}

export function createSettings() {
  return {
    master: 0.8,
    music: 0.55,
    sfx: 0.8,
    reduceMotion: false,
    fps30: false,
    particles: 'high', // high | low
    showSeed: false,
  };
}

export function hasUpgrade(meta, id) {
  return meta.upgrades.includes(id);
}

/** Kalıcı upgrade'lerden başlangıç bonusları */
export function startBonuses(meta) {
  let hull = 0;
  let gold = 0;
  for (const id of meta.upgrades) {
    const u = UPGRADE_BY_ID[id];
    if (!u) continue;
    if (u.hullBonus) hull = Math.max(hull, u.hullBonus);
    if (u.goldBonus) gold = Math.max(gold, u.goldBonus);
  }
  return { hull, gold };
}

export function createRun(meta, seedStr, route) {
  const b = startBonuses(meta);
  const ship = SHIP_BY_LEVEL[BALANCE.start.shipLevel];
  const run = {
    v: SAVE_VERSION,
    id: `${seedStr}-${Date.now().toString(36)}`,
    seed: seedStr,
    rngState: 0,
    createdAt: Date.now(),
    phase: 'arrival',
    route, // [{harborId, distance}] distance = sonraki limana mesafe
    idx: 0,
    ship: { level: ship.level, hull: ship.hull + b.hull, hullBonus: b.hull },
    gold: BALANCE.start.gold + b.gold,
    startGold: BALANCE.start.gold + b.gold,
    cargo: [],
    lotSeq: 1,
    items: [], // [{id}]
    crew: [],
    dismissedCrew: [],
    pets: [],
    petCap: 1,
    visit: null,
    voyage: null,
    arrival: null,
    pendingStatus: [],
    pendingRoute: [], // sonraki rotanın başına enjekte edilecek eventler
    pendingArrival: [], // limana varışta oynatılacak eventler
    chains: {},
    seenEvents: [],
    buffs: { luck: null, lucky: false, biscuit: false, nextRouteEvents: 0, rareNext: false },
    special: { firstAt: 0, stage: 'pending', secondDueAt: null, secondPet: null, oldFriends: false, shadowShown: false },
    xp: { total: 0, sources: { arrival: 0, trade: 0, events: 0, exploration: 0, discovery: 0, complete: 0, other: 0 } },
    stats: { goldEarned: 0, profit: 0, eventsResolved: 0, harborsReached: 1, bestSale: 0, maxGold: BALANCE.start.gold + b.gold, chainsCompleted: 0, upgradesBought: 0 },
    newAchievements: [],
    prevPrices: null,
    log: [],
    ended: false,
    result: null,
    xpTransferred: false,
  };
  initRunX1(run);
  return run;
}
