// Recipe unlock, station proximity, nearby chest sharing (10 tiles), input escrow, timed queue, claim.
import { PLAYER_INV } from './InventorySystem.js';

const ADVANCED_STATIONS = new Set(['BUILD_CARPENTER_BENCH', 'BUILD_MECHANICAL_BENCH', 'BUILD_SMELTER', 'BUILD_NAV_TABLE', 'BUILD_LOOM', 'BUILD_TANNING_RACK', 'BUILD_KILN']);
const COOK_STATIONS = new Set(['BUILD_CAMPFIRE', 'BUILD_DRYING_RACK']);
export const STATION_USE_RADIUS = 3; // tiles from player to station to operate it

export class CraftSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }

  queue(stationUid) {
    const q = this.s.productionState.queuesByStation;
    if (!q[stationUid]) q[stationUid] = { entries: [] };
    return q[stationUid];
  }

  /** Storage containers within radius of a station (same scene). */
  nearbyContainers(stationUid) {
    const radius = this.c.db.BuildDB.meta.balance.craftStationNearbyChestRadiusTiles;
    if (stationUid === 'HAND') return [PLAYER_INV];
    const st = this.s.buildingState.byId[stationUid]; if (!st) return [PLAYER_INV];
    const out = [PLAYER_INV];
    for (const b of Object.values(this.s.buildingState.byId)) {
      if (b.uid === stationUid || b.stage !== 'complete' || !b.containerId || b.sceneId !== st.sceneId) continue;
      const def = this.c.builds.get(b.buildId);
      if (def.category !== 'storage') continue;
      const cx = st.tile[0] + st.w / 2, cy = st.tile[1] + st.h / 2;
      const bx = b.tile[0] + b.w / 2, by = b.tile[1] + b.h / 2;
      if (Math.hypot(cx - bx, cy - by) <= radius) out.push(b.containerId);
    }
    return out;
  }

  playerNearStation(stationUid) {
    if (stationUid === 'HAND') return true;
    const st = this.s.buildingState.byId[stationUid]; if (!st) return false;
    return this.g.world.playerDistToRect(st) <= STATION_USE_RADIUS && this.g.world.sceneId === st.sceneId;
  }

  /** Return reasons a recipe cannot start (empty array = ok). */
  check(recipeId, stationUid, quantity = 1) {
    const r = this.c.recipes.get(recipeId); const reasons = [];
    if (!r) return ['Bilinmeyen tarif'];
    if (r.outputType !== 'item') reasons.push('Bu bir inşa/yükseltme tarifidir');
    if (!this.g.knowledge.unlocked(r)) reasons.push('Kilitli — ' + this.g.knowledge.unlockText(r));
    if (r.station !== 'HAND') {
      const st = this.s.buildingState.byId[stationUid];
      if (!st || st.buildId !== r.station || st.stage !== 'complete') reasons.push('İstasyon gerekli: ' + this.c.itemName(r.station));
      else if (!this.playerNearStation(stationUid)) reasons.push('İstasyona yaklaş');
    }
    for (const sp of r.requiredSpecialItems || []) if (!this.s.story.specialItemsGranted.includes(sp)) reasons.push('Özel parça: ' + this.c.itemName(sp));
    const conts = this.nearbyContainers(r.station === 'HAND' ? 'HAND' : stationUid);
    for (const [id, n] of Object.entries(r.inputs)) {
      const have = this.g.inventory.count(conts, id, { usableOnly: false });
      if (have < n * quantity) reasons.push(`Eksik: ${this.c.itemName(id)} ${have}/${n * quantity}`);
    }
    return reasons;
  }

  craftSeconds(r, stationUid) {
    let t = r.craftSeconds;
    const cooking = COOK_STATIONS.has(r.station);
    if (cooking) t *= this.g.skills.perk('SKILL_COOKING', 'cookTimeMultiplier', 1);
    else t *= this.g.skills.perk('SKILL_CRAFTING', 'craftTimeMultiplier', 1);
    const st = this.s.buildingState.byId[stationUid];
    if (st && st.upgrades?.includes('R_ADV_COOKER')) t *= 0.8;
    return Math.max(0.5, t);
  }

  /** CRAFT_START: reserve inputs exactly once and enqueue. */
  start(recipeId, stationUid = 'HAND', quantity = 1, txId = null) {
    const reasons = this.check(recipeId, stationUid, quantity);
    if (reasons.length) { this.g.bus.emit('ui.error', { text: reasons[0] }); return { ok: false, code: 'CRAFT_BLOCKED', reasons }; }
    const r = this.c.recipes.get(recipeId);
    const sid = r.station === 'HAND' ? 'HAND' : stationUid;
    const conts = this.nearbyContainers(sid);
    const id = txId || `CRAFT:${this.g.store.nextUid('cq')}`;
    return this.g.store.transaction(id, (tx) => {
      const consumed = {};
      for (const [itemId, n] of Object.entries(r.inputs)) { this.g.inventory.remove(tx, conts, itemId, n * quantity); consumed[itemId] = n * quantity; }
      const q = this.queue(sid);
      const entry = { uid: this.g.store.nextUid('qe'), recipeId, quantity, consumedInputs: consumed, progressSeconds: 0, totalSeconds: this.craftSeconds(r, sid) * quantity, completed: false, claimed: false, startedGameSeconds: this.s.clock.gameElapsedSeconds };
      tx.push(q.entries, entry);
      tx.emit('craft.started', { recipeId, stationUid: sid });
      return entry;
    });
  }

  /** Cancel: refund escrowed inputs (only if not completed). */
  cancel(stationUid, entryUid) {
    return this.g.store.transaction(`CANCEL:${entryUid}`, (tx) => {
      const q = this.queue(stationUid); const i = q.entries.findIndex((e) => e.uid === entryUid);
      if (i < 0) tx.fail('NO_ENTRY');
      const e = q.entries[i]; if (e.completed) tx.fail('ALREADY_DONE');
      for (const [id, n] of Object.entries(e.consumedInputs)) {
        const left = this.g.inventory.add(tx, PLAYER_INV, id, n);
        if (left > 0) tx.fail('INVENTORY_FULL', 'İadeler için çantada yer aç');
      }
      const ns = q.entries.slice(); ns.splice(i, 1); tx.set(q, 'entries', ns);
    });
  }

  /** Advance production with game time (only while simulation runs). */
  tick(dt) {
    for (const [sid, q] of Object.entries(this.s.productionState.queuesByStation)) {
      const active = q.entries.find((e) => !e.completed);
      if (!active) continue;
      if (sid !== 'HAND') {
        const st = this.s.buildingState.byId[sid];
        if (!st) continue; // station removed: entry kept for claim
      }
      active.progressSeconds = Math.min(active.totalSeconds, active.progressSeconds + dt);
      if (active.progressSeconds >= active.totalSeconds) this.complete(sid, active);
    }
  }

  complete(sid, entry) {
    const r = this.c.recipes.get(entry.recipeId);
    this.g.store.transaction(`CRAFT_DONE:${entry.uid}`, (tx) => {
      tx.set(entry, 'completed', true);
      // XP once per completed output
      const cooking = COOK_STATIONS.has(r.station);
      const evt = `craft:${entry.uid}`;
      if (cooking) this.g.skills.craftXp(tx, r.id, Object.keys(r.inputs).length >= 3 ? 10 : 5, evt, 'SKILL_COOKING');
      else this.g.skills.craftXp(tx, r.id, ADVANCED_STATIONS.has(r.station) ? 12 : 5, evt, 'SKILL_CRAFTING');
      tx.emit('craft.completed', { recipeId: r.id, outputId: r.outputId, stationUid: sid });
    });
    // auto-claim for hand crafting or when player stands near the station
    if (sid === 'HAND' || this.playerNearStation(sid)) this.claim(sid, entry.uid, PLAYER_INV, true);
  }

  /** CRAFT_CLAIM: output delivered once; if no space it stays claimable at the station. */
  claim(stationUid, entryUid, dest = PLAYER_INV, silent = false) {
    const q = this.queue(stationUid);
    const e = q.entries.find((x) => x.uid === entryUid);
    if (!e || !e.completed || e.claimed) return { ok: false, code: 'NOTHING_TO_CLAIM' };
    const r = this.c.recipes.get(e.recipeId);
    const total = r.outputAmount * e.quantity;
    if (this.g.inventory.spaceFor(dest, r.outputId) < total) {
      if (!silent) this.g.bus.emit('ui.error', { text: 'Çanta dolu — ürün istasyonda bekliyor' });
      return { ok: false, code: 'INVENTORY_FULL' };
    }
    return this.g.store.transaction(`CLAIM:${e.uid}`, (tx) => {
      const isTool = this.g.inventory.durabilityMax(r.outputId) > 0;
      const meta = {};
      if (isTool) meta.durabilityMul = this.g.skills.perk('SKILL_CRAFTING', 'madeToolDurabilityMultiplier', 1);
      if (r.outputId.startsWith('FOOD_')) meta.shelfBonusDays = this.g.skills.perk('SKILL_COOKING', 'preparedMealShelfLifeDaysBonus', 0);
      this.g.inventory.add(tx, dest, r.outputId, total, meta);
      tx.set(e, 'claimed', true);
      tx.set(q, 'entries', q.entries.filter((x) => !x.claimed));
      tx.emit('craft.claimed', { recipeId: r.id, outputId: r.outputId, quantity: total });
    });
  }

  claimAll(stationUid) {
    const q = this.queue(stationUid); let n = 0;
    for (const e of [...q.entries]) if (e.completed && !e.claimed && this.claim(stationUid, e.uid, PLAYER_INV, true).ok) n++;
    return n;
  }

  /** Recipes visible for a station (or HAND). */
  recipesFor(stationBuildId) {
    return (this.c.recipesByStation.get(stationBuildId) || []).filter((r) => r.outputType === 'item');
  }
}
