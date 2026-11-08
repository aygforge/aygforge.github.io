// Deterministic daily weather (WeatherDB weights, ≤3 dry days, safe launch window), tides, rain slices into
// collectors (idempotent event ids), water tank mode rules, forecast after observatory.
import { RngStreams } from '../core/RngStreams.js';
import { DAY_SECONDS } from '../core/GameClock.js';

export const WEATHERS = ['CLEAR', 'LIGHT_RAIN', 'RAIN', 'HEAVY_RAIN', 'STORM'];

export class ClimateSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  get cfg() { return this.g.content.db.WeatherDB; }

  /** Weather for day d — generated sequentially once and persisted (never re-rolled). */
  weatherFor(day) {
    const cl = this.s.climate;
    if (!cl.history) cl.history = {};
    if (cl.history[day]) return cl.history[day];
    for (let d = 1; d <= day; d++) if (!cl.history[d]) cl.history[d] = this.roll(d);
    return cl.history[day];
  }
  roll(d) {
    const wg = this.cfg.weatherGenerator; const h = this.s.climate.history;
    const rng = RngStreams.keyed(this.s.climate.weatherSeed, 'weather', d);
    const entries = WEATHERS.map((w) => ({ w, weight: wg.weightsPercent[w] }));
    let pick = rng.weighted(entries).w;
    // drought cap: max consecutive clear days
    let clearRun = 0; for (let k = d - 1; k >= 1 && h[k] === 'CLEAR'; k--) clearRun++;
    if (pick === 'CLEAR' && clearRun >= wg.maxConsecutiveClearDays) pick = rng.chance(0.6) ? 'LIGHT_RAIN' : 'RAIN';
    // safe boat launch window at least every 3 days
    const safe = new Set(wg.safeBoatLaunch);
    let unsafeRun = 0; for (let k = d - 1; k >= 1 && !safe.has(h[k]); k--) unsafeRun++;
    if (!safe.has(pick) && unsafeRun >= wg.maxConsecutiveUnsafeLaunchDays) pick = rng.chance(0.5) ? 'CLEAR' : 'LIGHT_RAIN';
    if (pick === 'CLEAR' && clearRun >= wg.maxConsecutiveClearDays) pick = 'LIGHT_RAIN';
    // first two tutorial days stay gentle
    if (d <= 2 && (pick === 'STORM' || pick === 'HEAVY_RAIN')) pick = 'LIGHT_RAIN';
    return pick;
  }
  weather() { return this.weatherFor(this.s.clock.dayIndex); }
  state() { return this.cfg.states[this.weather()]; }
  isRaining() {
    const w = this.weather(); if (w === 'CLEAR') return false;
    // rain fronts are visible from the first slice onward
    const t = this.s.clock.timeOfDaySeconds / DAY_SECONDS;
    return t >= this.cfg.weatherGenerator.defaultFrontTimeFraction.firstSlice - 0.12;
  }
  moveSpeedMul() { return this.isRaining() ? this.state().movementSpeedMultiplier : 1; }
  boatSpeedMul() { return this.state().boatSpeedMultiplier; }
  fishingMul() { return this.state().fishingCatchRateMultiplier; }
  launchAllowed(day = this.s.clock.dayIndex, anchor = false) {
    const w = this.weatherFor(day);
    if (this.cfg.states[w].boatLaunchAllowed) return true;
    return anchor && w === 'RAIN';
  }
  forecast() {
    if (!this.s.world.worldFlags.OBSERVATORY_CHART_FOUND && !this.s.story.poiStates.POI_OBSERVATORY?.searched) return null;
    return this.weatherFor(this.s.clock.dayIndex + 1);
  }

  /** Tides: deterministic by game time, two low windows per day. */
  isLowTide(t01 = this.s.clock.timeOfDaySeconds / DAY_SECONDS) {
    return this.cfg.tides.lowTideNormalizedWindows.some(([a, b]) => t01 >= a && t01 <= b);
  }
  nextLowTideText() {
    const t = this.s.clock.timeOfDaySeconds / DAY_SECONDS;
    for (const [a] of this.cfg.tides.lowTideNormalizedWindows) if (a > t) return `${Math.round((a - t) * DAY_SECONDS / 60)} dk sonra`;
    return 'yarın sabah';
  }

  tick() {
    this.g.terrain.lowTide = this.isLowTide();
    // rain slices for the current day
    const fr = this.cfg.weatherGenerator.defaultFrontTimeFraction;
    const t = this.s.clock.timeOfDaySeconds / DAY_SECONDS;
    const day = this.s.clock.dayIndex;
    if (t >= fr.firstSlice) this.applySlice(day, 0);
    if (t >= fr.secondSlice) this.applySlice(day, 1);
  }

  /** On day boundary: make sure previous day's slices were applied (sleep fast-forward safe). */
  onDay(day) {
    this.applySlice(day - 1, 0); this.applySlice(day - 1, 1);
    this.s.climate.lastWeatherDay = day;
    this.s.climate.dayState = this.weatherFor(day);
    this.g.bus.emit('weather.changed', { weather: this.s.climate.dayState });
  }

  applySlice(day, slice) {
    if (day < 1) return;
    const w = this.weatherFor(day); const st = this.cfg.states[w];
    if (!st.rainSmall && !st.rainLarge) return;
    const applied = this.s.climate.appliedRainEventIds;
    for (const [uid, wat] of Object.entries(this.s.waterInfrastructure.byBuildUid)) {
      if (!wat.type.startsWith('BUILD_RAIN_CATCHER')) continue;
      const evt = `WEATHER:${this.s.saveSlotId}:${this.s.world.worldSeed}:${day}:${slice}:${uid}`;
      if (applied[evt]) continue;
      const b = this.s.buildingState.byId[uid];
      if (!b || (b.completedGameSeconds ?? 0) > (day - 1) * DAY_SECONDS + (slice ? 0.65 : 0.4) * DAY_SECONDS) { applied[evt] = 1; continue; }
      const daily = wat.type === 'BUILD_RAIN_CATCHER' ? st.rainSmall : st.rainLarge;
      const add = daily * 50; // half of the daily yield (centiportions) per slice
      wat.volumeCenti = Math.min(wat.capacityCenti, wat.volumeCenti + add);
      applied[evt] = 1;
    }
    // prune old event ids
    const keys = Object.keys(applied);
    if (keys.length > 2000) for (const k of keys.slice(0, keys.length - 1500)) delete applied[k];
  }

  /** Tank transfer: no mixing clean and raw; mode fixed by first fill until fully emptied. */
  fillTank(tankUid, itemId, qty) {
    const inv = this.g.inventory; const w = this.s.waterInfrastructure.byBuildUid[tankUid];
    if (!w || w.type !== 'BUILD_WATER_TANK') return { ok: false, code: 'NOT_TANK' };
    const mode = itemId === 'WATER_CLEAN' ? 'CLEAN' : 'RAW';
    if (w.mode && w.mode !== mode && w.volumeCenti > 0) { this.g.bus.emit('ui.error', { text: 'Depo farklı su içeriyor — karıştırılamaz' }); return { ok: false, code: 'MIX_FORBIDDEN' }; }
    const room = Math.floor((w.capacityCenti - w.volumeCenti) / 100);
    const n = Math.min(qty, room, inv.count(['inv_player'], itemId));
    if (n <= 0) return { ok: false, code: 'NOTHING' };
    return this.g.store.transaction(null, (tx) => {
      inv.remove(tx, ['inv_player'], itemId, n);
      tx.set(w, 'mode', mode); tx.set(w, 'volumeCenti', w.volumeCenti + n * 100);
      tx.emit('water.poured', { n });
      return n;
    });
  }
  takeFromBuild(buildUid, qty = 1) {
    const inv = this.g.inventory; const w = this.s.waterInfrastructure.byBuildUid[buildUid];
    if (!w || !w.mode || w.volumeCenti < 100) return { ok: false, code: 'EMPTY' };
    const itemId = w.mode === 'CLEAN' ? 'WATER_CLEAN' : 'WATER_DIRTY';
    const n = Math.min(qty, Math.floor(w.volumeCenti / 100), inv.spaceFor('inv_player', itemId));
    if (n <= 0) { this.g.bus.emit('ui.error', { text: 'Su taşıyacak kap yok (bambu bardak/şişe)' }); return { ok: false, code: 'NO_VESSEL' }; }
    return this.g.store.transaction(null, (tx) => {
      inv.add(tx, 'inv_player', itemId, n);
      tx.set(w, 'volumeCenti', w.volumeCenti - n * 100);
      if (w.volumeCenti === 0 && w.type === 'BUILD_WATER_TANK') tx.set(w, 'mode', null);
      tx.emit('water.taken', { n });
      return n;
    });
  }
}
