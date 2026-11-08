// Needs (hunger/thirst/rest), stamina, swimming, oxygen, health, effects, eat/drink, sleep and death.
import { clamp } from '../core/util.js';
import { DAY_SECONDS } from '../core/GameClock.js';
import { PLAYER_INV } from './InventorySystem.js';
import { TILE } from '../world/TerrainSystem.js';

const HEAL = { CON_BANDAGE: 20, CON_ADV_BANDAGE: 40 };
const KEEP_ON_DEATH = new Set(['tool', 'equipment', 'special', 'seed']);

export class SurvivalSystem {
  constructor(game) { this.g = game; this.dmgAcc = 0; }
  get p() { return this.g.store.state.player; }
  get daily() { return this.g.content.db.DesignConstants.needsDaily; }

  tick(dt) {
    const p = this.p; const d = this.daily;
    const mul = p.mode === 'SLEEP' ? 0.5 : 1;
    let restMul = 1;
    if (this.g.climate.isRaining() && !this.g.isSheltered() && !this.hasEquip('EQ_RAINCOAT')) restMul = 1.25;
    p.hunger = clamp(p.hunger - (d.hunger / DAY_SECONDS) * dt * mul, 0, 100);
    p.thirst = clamp(p.thirst - (d.thirst / DAY_SECONDS) * dt * mul, 0, 100);
    if (p.mode !== 'SLEEP') p.rest = clamp(p.rest - (d.rest / DAY_SECONDS) * dt * restMul, 0, 100);
    // stamina
    const modes = this.g.content.db.TerrainDB.movementModes;
    const w = this.g.world;
    if (w.sprintingNow) p.stamina -= modes.SPRINT.staminaPerSec * dt;
    else if ((p.mode === 'SWIM' || p.mode === 'DIVE') && w.moving) p.stamina -= modes.SWIM.staminaPerSec * dt;
    else if (p.mode !== 'SWIM' && p.mode !== 'DIVE') {
      let regen = 10;
      if (p.rest <= 0) regen *= 0.5;
      if (this.g.climate.weather() === 'STORM' && !this.g.isSheltered()) regen *= 0.6;
      if (p.hunger <= 0 || p.thirst <= 0) regen *= 0.5;
      p.stamina += regen * dt;
    } else p.stamina += 1.5 * dt; // floating rest
    p.stamina = clamp(p.stamina, 0, 100);
    // oxygen
    if (p.mode === 'DIVE') {
      const drain = this.hasEquip('TOOL_DIVING_KIT') ? 3 : this.hasEquip('TOOL_DIVING_MASK') ? 4.5 : 6;
      p.oxygen = clamp(p.oxygen - drain * dt, 0, 100);
      if (p.oxygen <= 15) { p.mode = 'SWIM'; this.g.bus.emit('mode.changed', { mode: 'SWIM', reason: 'breath' }); this.g.bus.emit('ui.toast', { text: 'Nefes için yüzeye çıktın' }); }
    } else p.oxygen = clamp(p.oxygen + 25 * dt, 0, 100);
    // health effects
    let hpLoss = 0;
    if (p.hunger <= 0) hpLoss += 0.1;
    if (p.thirst <= 0) hpLoss += 0.15;
    if ((p.mode === 'SWIM' || p.mode === 'DIVE') && p.stamina <= 0) hpLoss += 2.5;
    if (p.oxygen <= 0) hpLoss += 10;
    for (const e of p.effects) {
      e.t -= dt;
      if (e.id === 'poison') hpLoss += 0.5;
      if (e.id === 'heal') p.health = clamp(p.health + (e.rate || 1) * dt, 0, 100);
    }
    p.effects = p.effects.filter((e) => e.t > 0);
    if (hpLoss > 0) this.damage(hpLoss * dt, 'needs', true);
    else if (p.hunger > 30 && p.thirst > 30 && p.health < 100) p.health = clamp(p.health + 0.05 * dt, 0, 100);
  }

  hasEquip(itemId) {
    const eq = this.p.equipment; const inv = this.g.inventory;
    for (const u of Object.values(eq)) if (u && inv.item(u)?.itemId === itemId) return true;
    if (itemId.startsWith('TOOL_DIVING')) return inv.hasItem(itemId);
    return false;
  }

  damage(amount, source, silent = false) {
    const p = this.p;
    if (source === 'animal' && this.hasEquip('EQ_LEATHER_VEST')) amount *= 0.75;
    p.health = clamp(p.health - amount, 0, 100);
    if (!silent) { this.g.bus.emit('player.damaged', { amount, source }); p.hurtT = 0.4; }
    if (p.health <= 0) this.die(source);
  }

  /** eat / drink / use consumable */
  consume(uid) {
    const inv = this.g.inventory; const a = inv.item(uid); if (!a) return { ok: false };
    const it = this.g.content.items.get(a.itemId);
    if (a.itemId === 'FOOD_MUSHROOM' || it.restore || HEAL[a.itemId] || a.itemId === 'CON_ANTIDOTE') {
      return this.g.store.transaction(`USE:${uid}:${a.quantity}:${Math.floor(this.g.store.state.clock.gameElapsedSeconds * 10)}`, (tx) => {
        inv.remove(tx, [inv.locate(uid)[0]], a.itemId, 1);
        const p = this.p; const r = it.restore || {};
        const meal = it.category === 'food' ? this.g.skills.perk('SKILL_COOKING', 'mealRestoreMultiplier', 1) : 1;
        if (r.hunger) tx.set(p, 'hunger', clamp(p.hunger + r.hunger * meal, 0, 100));
        if (r.thirst) tx.set(p, 'thirst', clamp(p.thirst + r.thirst, 0, 100));
        if (r.health) tx.set(p, 'health', clamp(p.health + r.health, 0, 100));
        if (HEAL[a.itemId]) { tx.push(p.effects, { id: 'heal', t: 4, rate: HEAL[a.itemId] / 4 }); }
        if (a.itemId === 'CON_ANTIDOTE' || a.itemId === 'FOOD_HERBAL_TEA') tx.set(p, 'effects', p.effects.filter((e) => e.id !== 'poison'));
        tx.emit(a.itemId.startsWith('WATER') || (r.thirst && !r.hunger) ? 'player.drink' : 'player.eat', { itemId: a.itemId });
        return true;
      });
    }
    return { ok: false, code: 'NOT_CONSUMABLE' };
  }

  /** Drink directly from a rain collector / clean tank (no vessel needed). */
  drinkFromBuild(buildUid) {
    const w = this.g.store.state.waterInfrastructure.byBuildUid[buildUid];
    if (!w || w.mode !== 'CLEAN' || w.volumeCenti < 100) { this.g.bus.emit('ui.error', { text: 'İçilebilir su yok' }); return { ok: false }; }
    if (this.p.thirst >= 99) return { ok: false, code: 'FULL' };
    return this.g.store.transaction(null, (tx) => {
      tx.set(w, 'volumeCenti', w.volumeCenti - 100);
      tx.set(this.p, 'thirst', clamp(this.p.thirst + 25, 0, 100));
      tx.emit('player.drink', { itemId: 'WATER_CLEAN' });
    });
  }

  /** SLEEP {bedUid}: one time jump; each day processed once (GameClock). */
  sleep(bedUid) {
    const s = this.g.store.state; const b = s.buildingState.byId[bedUid];
    if (!b || b.stage !== 'complete' || !b.data.restValue) return { ok: false, code: 'NOT_A_BED' };
    const clock = this.g.clock;
    const t = clock.tod;
    if (t < 600 && this.p.rest > 60) { this.g.bus.emit('ui.error', { text: 'Şu an uykun yok (akşam veya yorgunken uyuyabilirsin)' }); return { ok: false, code: 'NOT_TIRED' }; }
    const secs = clock.secondsUntilMorning();
    const sleepId = `SLEEP:${s.saveSlotId}:${(s.clock.sleepCounter || 0) + 1}`;
    if (this.g.store.hasClaim(sleepId)) return { ok: false, code: 'DUPLICATE' };
    s.clock.sleepCounter = (s.clock.sleepCounter || 0) + 1;
    this.g.store.state.transactionLedger.claimKeys[sleepId] = s.clock.gameElapsedSeconds;
    this.p.lastBedId = bedUid;
    this.p.respawn = { sceneId: 'OVERWORLD', px: [(b.tile[0] + b.w / 2) * TILE, (b.tile[1] + b.h + 0.6) * TILE] };
    this.p.mode = 'SLEEP';
    this.g.bus.emit('sleep.start', { secs });
    // advance simulation in 30 s slices so production, crops, collectors and daily events run exactly as in play
    const comfort = this.g.build.comfortLevel(b.tile);
    let left = secs;
    while (left > 0) {
      const step = Math.min(30, left); left -= step;
      this.g.simulateTime(step, 'sleep');
    }
    const p = this.p;
    p.mode = 'WALK';
    p.rest = clamp(Math.max(p.rest, b.data.restValue + (comfort - 1) * 3), 0, 100);
    p.stamina = 100;
    if (b.data.wellRestedBonusHours) p.effects.push({ id: 'well_rested', t: b.data.wellRestedBonusHours * 45 });
    this.g.bus.emit('sleep.end', { day: s.clock.dayIndex });
    this.g.persistence?.checkpoint('sleep');
    return { ok: true };
  }

  die(source) {
    const s = this.g.store.state; const p = this.p;
    if (this.dying) return; this.dying = true;
    const inv = this.g.inventory; const cont = inv.cont(PLAYER_INV);
    const bagId = `bag_${s.clock.gameElapsedSeconds | 0}_${Object.keys(s.world.dropBags || {}).length}`;
    const [tx0, ty0] = this.g.world.playerTile();
    const g = this.g.world.grid;
    const spot = this.g.pathfinder.nearestTile(g, tx0, ty0, (x, y) => this.g.terrain.passable(g, x, y, 'WALK'), 20) || [tx0, ty0];
    this.g.store.transaction(`DEATH:${bagId}`, (tx) => {
      const bagCont = inv.createContainer(tx, `c_${bagId}`, cont.slots.length, {});
      let moved = 0;
      cont.slots.forEach((u, i) => {
        if (!u) return; const a = inv.item(u); const it = this.g.content.items.get(a.itemId);
        if (KEEP_ON_DEATH.has(it.category) || Object.values(p.equipment).includes(u)) return;
        tx.set(cont.slots, i, null); tx.set(bagCont.slots, moved++, u);
      });
      if (!s.world.dropBags) tx.set(s.world, 'dropBags', {});
      if (moved > 0) tx.set(s.world.dropBags, bagId, { id: bagId, sceneId: this.g.world.sceneId, tile: spot, containerId: bagCont.id });
      else tx.del(s.containers.byId, bagCont.id);
      tx.add(s.stats, 'deaths', 1);
    });
    p.health = 60; p.hunger = Math.max(p.hunger, 40); p.thirst = Math.max(p.thirst, 40); p.stamina = 100; p.oxygen = 100; p.effects = [];
    const r = p.respawn || this.g.defaultRespawn();
    if (p.mode === 'RAFT') this.g.sea.forceDisembark();
    this.g.world.teleport(r.sceneId, r.px[0], r.px[1], 'WALK');
    this.dying = false;
    this.g.bus.emit('player.died', { source });
    this.g.persistence?.checkpoint('death');
  }
}
