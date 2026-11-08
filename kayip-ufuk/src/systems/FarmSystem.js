// 12 crops in BUILD_PLANTER plots: plant, water (rain/irrigation RAW/manual), one growth tick per day,
// harvest with ≥1 seed refund, fertilizer, regrow crops. Drought pauses growth, never kills.
import { PLAYER_INV } from './InventorySystem.js';
import { RngStreams } from '../core/RngStreams.js';

export class FarmSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }
  plot(uid) { return this.s.productionState.cropPlotsById[uid]; }

  stage(plot) {
    if (!plot.cropId) return -1;
    const crop = this.c.crops.get(plot.cropId);
    if (plot.ready) return 3;
    // visual progress: growth is credited per processed day (no retroactive growth); while today's water is assured
    // (watered / rain / irrigation available) the in-day share is shown so 2-day crops also pass through every stage.
    const today = this.s.clock.dayIndex;
    const wetToday = plot.wateredDay === today || this.c.db.WeatherDB.states[this.g.climate.weatherFor(today)].plantRainWatered || this.irrigate(Object.keys(this.s.productionState.cropPlotsById).find((k) => this.s.productionState.cropPlotsById[k] === plot), true);
    const f = Math.min(0.999, (plot.growthDays + (wetToday ? this.s.clock.timeOfDaySeconds / 1080 : 0)) / crop.growGameDays);
    const fr = crop.growthStageFractions; let st = 0;
    for (let i = 0; i < fr.length; i++) if (f >= fr[i]) st = i;
    return Math.min(2, st);
  }

  plant(plotUid, seedItemId) {
    const plot = this.plot(plotUid); if (!plot) return { ok: false, code: 'NO_PLOT' };
    if (plot.cropId) return { ok: false, code: 'OCCUPIED' };
    const crop = this.c.cropBySeed.get(seedItemId); if (!crop) return { ok: false, code: 'NOT_A_SEED' };
    return this.g.store.transaction(`PLANT:${plotUid}:${plot.harvests}:${this.s.clock.gameElapsedSeconds | 0}`, (tx) => {
      this.g.inventory.remove(tx, [PLAYER_INV], seedItemId, 1);
      tx.set(plot, 'cropId', crop.id); tx.set(plot, 'seedId', seedItemId);
      tx.set(plot, 'growthDays', 0); tx.set(plot, 'ready', false); tx.set(plot, 'lastProcessedDay', this.s.clock.dayIndex);
      tx.set(plot, 'plantGameSecond', this.s.clock.gameElapsedSeconds);
      this.g.skills.award(tx, 'SKILL_FARMING', 'plantSeed', `plant:${plotUid}:${plot.harvests}:${this.s.clock.gameElapsedSeconds | 0}`);
      tx.emit('crop.planted', { plotUid, cropId: crop.id });
    });
  }

  /** Manual watering for today (watering can units or 1 water item). */
  water(plotUid) {
    const plot = this.plot(plotUid); if (!plot || !plot.cropId) return { ok: false, code: 'EMPTY' };
    const day = this.s.clock.dayIndex;
    if (plot.wateredDay === day || this.g.climate.state().plantRainWatered) { this.g.bus.emit('ui.toast', { text: 'Bugün zaten sulandı' }); return { ok: false, code: 'ALREADY' }; }
    const inv = this.g.inventory;
    const can = inv.bestTool('TOOL_WATERING_CAN');
    return this.g.store.transaction(null, (tx) => {
      if (can && (can.metadata.water || 0) >= 1) tx.set(can.metadata, 'water', can.metadata.water - 1);
      else if (inv.hasItem('WATER_DIRTY')) inv.remove(tx, [PLAYER_INV], 'WATER_DIRTY', 1);
      else if (inv.hasItem('WATER_CLEAN')) inv.remove(tx, [PLAYER_INV], 'WATER_CLEAN', 1);
      else tx.fail('NO_WATER', 'Sulama kabını nehirde doldur veya su taşı');
      tx.set(plot, 'wateredDay', day);
      tx.emit('crop.watered', { plotUid });
    });
  }

  fertilize(plotUid) {
    const plot = this.plot(plotUid); if (!plot || !plot.cropId || plot.fertilized) return { ok: false };
    return this.g.store.transaction(null, (tx) => {
      this.g.inventory.remove(tx, [PLAYER_INV], 'CMP_COMPOST', 1);
      tx.set(plot, 'fertilized', true);
    });
  }

  refillCan() {
    const can = this.g.inventory.bestTool('TOOL_WATERING_CAN'); if (!can) return { ok: false };
    can.metadata.water = 10; this.g.bus.emit('water.poured', {}); return { ok: true };
  }

  /** Daily growth tick for the finished day (processingOrder: rain -> irrigation RAW -> manual -> growth). */
  onDay(newDay) {
    const prev = newDay - 1;
    const rained = this.c.db.WeatherDB.states[this.g.climate.weatherFor(prev)].plantRainWatered;
    for (const [uid, plot] of Object.entries(this.s.productionState.cropPlotsById)) {
      if (!plot.cropId || plot.ready) { plot.lastProcessedDay = newDay; continue; }
      if (plot.lastProcessedDay >= newDay) continue; // idempotent
      let wet = rained || plot.wateredDay === prev;
      if (!wet) wet = this.irrigate(uid);
      if (wet) {
        plot.growthDays += 1;
        const crop = this.c.crops.get(plot.cropId);
        if (plot.growthDays >= crop.growGameDays) { plot.ready = true; this.g.bus.emit('crop.ready', { plotUid: uid }); }
      }
      plot.lastProcessedDay = newDay;
    }
  }

  /** Irrigation unit within 6 tiles consumes RAW water from a tank within 5 tiles of it. */
  irrigate(plotUid, dryRun = false) {
    const b = this.s.buildingState.byId[plotUid]; if (!b) return false;
    const blds = Object.values(this.s.buildingState.byId);
    const need = Math.round(100 * this.g.skills.perk('SKILL_FARMING', 'wateringUnitMultiplier', 1));
    for (const irr of blds) {
      if (irr.buildId !== 'BUILD_IRRIGATION' || irr.stage !== 'complete') continue;
      if (Math.hypot(irr.tile[0] - b.tile[0], irr.tile[1] - b.tile[1]) > 6) continue;
      for (const tank of blds) {
        if (tank.buildId !== 'BUILD_WATER_TANK' || tank.stage !== 'complete') continue;
        if (Math.hypot(tank.tile[0] - irr.tile[0], tank.tile[1] - irr.tile[1]) > this.c.db.WaterEconomyDB.tank.transferRadiusTiles + 1) continue;
        const w = this.s.waterInfrastructure.byBuildUid[tank.uid];
        if (w && w.mode === 'RAW' && w.volumeCenti >= need) { if (dryRun) return true; w.volumeCenti -= need; if (!w.volumeCenti) w.mode = null; return true; }
      }
    }
    // garden POI irrigation channels fixed: fertile islet planters are auto-watered
    if (this.s.world.worldFlags.GARDEN_IRRIGATION_FIXED && this.g.terrain.islandAt(b.tile[0], b.tile[1]) === 'FERTILE') return true;
    return false;
  }

  harvest(plotUid) {
    const plot = this.plot(plotUid); if (!plot || !plot.ready) return { ok: false, code: 'NOT_READY' };
    const crop = this.c.crops.get(plot.cropId);
    const hno = plot.harvests + 1;
    const txId = `CROP_HARVEST:${plotUid}:${hno}`;
    return this.g.store.transaction(txId, (tx) => {
      const rng = RngStreams.keyed(this.s.world.worldSeed, 'crop', plotUid, hno);
      let qty = rng.int(crop.yieldMin, crop.yieldMax);
      // two independent chances, absolute extra cap +1
      let extra = 0;
      if (plot.fertilized && rng.chance(crop.fertilizerBonusChance)) extra = 1;
      if (rng.chance(this.g.skills.perk('SKILL_FARMING', 'bonusCropChance', 0))) extra = 1;
      qty += Math.min(extra, crop.extraHarvestMax);
      let seeds = crop.seedRefundMinPerHarvest;
      if (rng.chance(this.g.skills.perk('SKILL_FARMING', 'bonusSeedChance', 0))) seeds++;
      this.g.giveOrDrop(tx, crop.harvestItemId, qty);
      this.g.giveOrDrop(tx, crop.seedItemId, seeds);
      if (rng.chance(0.4)) this.g.giveOrDrop(tx, 'MAT_ORGANIC_WASTE', 1);
      tx.set(plot, 'harvests', hno);
      tx.set(plot, 'ready', false); tx.set(plot, 'fertilized', false);
      if (crop.repeatHarvest) tx.set(plot, 'growthDays', crop.growGameDays - crop.regrowGameDays);
      else { tx.set(plot, 'cropId', null); tx.set(plot, 'seedId', null); tx.set(plot, 'growthDays', 0); }
      this.g.skills.award(tx, 'SKILL_FARMING', 'harvestMature', txId);
      tx.emit('crop.harvested', { plotUid, cropId: crop.id, qty, seeds });
      return { qty, seeds };
    });
  }
}
