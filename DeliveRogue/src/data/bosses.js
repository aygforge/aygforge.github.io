// data/bosses.js — boss definitions (Phase 04: Latte Art Dragon). Runtime stats + attack profiles are added
// fields; identity (id/name/role/archetype) stays the canonical enemy catalog entry.
// Each attack: warn (telegraph) / active / recover seconds and a damage mask (courier / package).
export const BOSSES = {
  COF_B_LatteArtDragon: {
    id: 'COF_B_LatteArtDragon', episode: 'COF', hp: 1400, half: 24, w: 84, h: 78, phases: [1, 0.7, 0.3],
    helper: { short: 'SS', cap: 4, perSummon: 2 },
    attacks: {
      breath: { warn: 0.9, active: 0.5, recover: 0.8, range: 250, half: 0.42, dmg: 14, pkg: 8 },
      sweep:  { warn: 0.8, active: 1.6, recover: 0.9, range: 250, half: 0.32, dmg: 12, pkg: 6, arc: 1.2, tick: 0.4 },
      steam:  { warn: 1.0, active: 0.35, recover: 0.7, r: 26, dmg: 12, pkg: 8 },
      rain:   { warn: 1.2, active: 0.2, recover: 0.6, r: 16, dmg: 10, pkg: 0 },
      summon: { warn: 0.8, active: 0.1, recover: 0.6 },
    },
    // phase pools (index = phase 0..2); combos run back to back
    pools: [['breath', 'steam', 'rain'], ['breath+rain', 'steam', 'summon', 'rain'], ['sweep', 'steam3', 'rain', 'breath+steam']],
    counts: { steam: [3, 4, 5], rain: [6, 8, 10] },
    cadence: [1.0, 0.85, 0.7], // multiplier on warn/recover per phase
  },
};
