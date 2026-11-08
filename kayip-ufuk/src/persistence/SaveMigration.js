// SaveMigration.json rules: v1→v5. Never claims unearned rewards, never re-rolls processed weather,
// unknown entity ids are quarantined (reported) instead of silently discarding the whole save.
import { RngStreams } from '../core/RngStreams.js';
import { newGameState } from '../core/Game.js';

export function migrate(raw, content) {
  const report = { from: raw.saveVersion ?? 1, steps: [], quarantined: [] };
  const s = JSON.parse(JSON.stringify(raw));
  if (!s.saveVersion) s.saveVersion = 1;
  const base = newGameState(content, { slotId: s.saveSlotId || 'slot-1', seed: s.world?.worldSeed ?? 1, name: s.slotDisplayName || 'Kazazede' });
  const fill = (obj, def) => { for (const [k, v] of Object.entries(def)) { if (obj[k] === undefined) obj[k] = JSON.parse(JSON.stringify(v)); else if (v && typeof v === 'object' && !Array.isArray(v) && obj[k] && typeof obj[k] === 'object') fill(obj[k], v); } };
  if (s.saveVersion <= 1) {
    // normalize inventory item instances with stable uid; map old POI bool to stage flags
    for (const [uid, it] of Object.entries(s.containers?.items || {})) if (!it.uid) it.uid = uid;
    for (const [id, v] of Object.entries(s.story?.poiStates || {})) if (typeof v === 'boolean') s.story.poiStates[id] = { discovered: true, searched: v, rewardClaimed: v, guaranteedClaimed: v, bonusRolled: false, selectedLoot: null, pendingItems: {}, deposited: {} };
    s.saveVersion = 2; report.steps.push('v1→v2');
  }
  if (s.saveVersion === 2) {
    s.clock = s.clock || {};
    const day = s.clock.dayIndex || 1;
    s.clock.lastDailyUpdateIndex = s.clock.lastDailyUpdateIndex ?? day;
    s.clock.processedDailyEventIds = s.clock.processedDailyEventIds || Array.from({ length: day - 1 }, (_, i) => `DAY:${i + 2}`);
    s.saveVersion = 3; report.steps.push('v2→v3');
  }
  if (s.saveVersion === 3) {
    s.world = s.world || {}; s.world.caveVisits = s.world.caveVisits || {};
    s.vehicles = s.vehicles || {}; s.vehicles.landingRecovery = s.vehicles.landingRecovery || base.vehicles.landingRecovery;
    s.transactionLedger = s.transactionLedger || { committed: {}, order: [], claimKeys: {} };
    s.saveVersion = 4; report.steps.push('v3→v4');
  }
  if (s.saveVersion === 4) {
    // newClimateState: derive weatherSeed deterministically; keep processed days
    s.climate = s.climate || {};
    if (s.climate.weatherSeed == null) s.climate.weatherSeed = RngStreams.hash(s.world.worldSeed >>> 0, 'weather');
    s.climate.history = s.climate.history || {};
    s.climate.appliedRainEventIds = s.climate.appliedRainEventIds || {};
    // newWaterState: legacy integer portions → centiportions with type
    s.waterInfrastructure = s.waterInfrastructure || { byBuildUid: {}, lastDayProcessed: s.clock.dayIndex };
    for (const [uid, w] of Object.entries(s.waterInfrastructure.byBuildUid)) {
      if (w.storedPortions != null && w.volumeCenti == null) { w.volumeCenti = w.storedPortions * 100; delete w.storedPortions; }
      if (w.capacityCenti == null) { const b = s.buildingState?.byId?.[uid]; const def = b && content.builds.get(b.buildId); w.capacityCenti = (def?.waterCapacity || 6) * 100; }
      if (!w.mode && w.type?.startsWith('BUILD_RAIN')) w.mode = 'CLEAN';
    }
    // newDurabilityState: preserve durability, fill missing max from ItemDB
    for (const it of Object.values(s.containers?.items || {})) {
      const d = content.durability.get(it.itemId)?.durabilityMax ?? content.items.get(it.itemId)?.durabilityMax ?? 0;
      if (d > 0 && it.maxDurability == null) it.maxDurability = d;
      if (d > 0 && it.durability == null) it.durability = d;
    }
    s.saveVersion = 5; report.steps.push('v4→v5');
  }
  fill(s, base);
  // quarantine unknown ids
  const rec = s.containers.byId.recovery_quarantine || null;
  for (const [uid, it] of Object.entries(s.containers.items)) {
    if (!content.items.has(it.itemId)) { report.quarantined.push({ uid, itemId: it.itemId }); delete s.containers.items[uid]; for (const c of Object.values(s.containers.byId)) c.slots = c.slots.map((u) => (u === uid ? null : u)); }
  }
  for (const [uid, b] of Object.entries(s.buildingState.byId)) if (!content.builds.has(b.buildId)) { report.quarantined.push({ uid, buildId: b.buildId }); delete s.buildingState.byId[uid]; }
  void rec;
  s.quarantineReport = report.quarantined.length ? report.quarantined : s.quarantineReport;
  return { state: s, report };
}

/** Validate a v5 state before it overwrites anything. */
export function validateState(s, content) {
  const errs = [];
  if (s.saveVersion !== 5) errs.push('saveVersion');
  if (!/^slot-[1-3]$/.test(s.saveSlotId)) errs.push('saveSlotId');
  const p = s.player;
  for (const k of ['health', 'hunger', 'thirst', 'rest', 'stamina']) if (!(p[k] >= 0 && p[k] <= 100)) errs.push('player.' + k);
  if (!Array.isArray(p.positionPx) || !p.positionPx.every(Number.isFinite)) errs.push('position');
  for (const it of Object.values(s.containers.items)) { if (!content.items.has(it.itemId)) errs.push('item ' + it.itemId); if (!(it.quantity > 0)) errs.push('qty ' + it.uid); }
  if (!(s.clock.timeOfDaySeconds >= 0 && s.clock.timeOfDaySeconds < 1080)) errs.push('clock');
  return errs;
}
