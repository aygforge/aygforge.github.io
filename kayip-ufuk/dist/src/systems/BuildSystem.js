// Prefab placement (4 ready-made houses, no modular walls), staged construction with escrow, occupancy,
// upgrades that mutate the SAME entity uid, storage/water/trap/planter/bed entity data, camps.
import { PLAYER_INV } from './InventorySystem.js';
import { T } from '../world/TerrainSystem.js';

export const HOUSES = new Set(['BUILD_BAMBOO_HUT', 'BUILD_WOOD_HUT', 'BUILD_LARGE_HOUSE', 'BUILD_FISH_HUT']);
export const NON_SOLID = new Set(['BUILD_PATH', 'BUILD_RUG', 'BUILD_BRIDGE', 'BUILD_PIER', 'BUILD_PLANTER', 'BUILD_ANIMAL_TRAP', 'BUILD_CRAB_TRAP', 'BUILD_FISH_TRAP', 'BUILD_CAMP_MARKER', 'BUILD_GATE', 'BUILD_LEAF_SHELTER', 'BUILD_RAFT', 'BUILD_SIGNAL_STATION']);
export const DECKS = new Set(['BUILD_BRIDGE', 'BUILD_PIER']);
const BED_REST = { BUILD_LEAF_BED: 55, BUILD_WOOD_BED: 70, BUILD_COMFORT_BED: 100 };
export const STATIONS = new Set(['BUILD_CAMPFIRE', 'BUILD_WORKBENCH', 'BUILD_DRYING_RACK', 'BUILD_KILN', 'BUILD_CARPENTER_BENCH', 'BUILD_LOOM', 'BUILD_TANNING_RACK', 'BUILD_SMELTER', 'BUILD_NAV_TABLE', 'BUILD_MECHANICAL_BENCH', 'BUILD_COMPOST_BIN', 'BUILD_WATER_FILTER']);
const COMFORT = { BUILD_CHAIR: 2, BUILD_TABLE: 3, BUILD_BENCH: 2, BUILD_RUG: 3, BUILD_PLANT_POT: 2, BUILD_MAP_TABLE: 4, BUILD_LAMP_POST: 2, BUILD_COMFORT_BED: 6, BUILD_WOOD_BED: 4, BUILD_LEAF_BED: 1 };

export class BuildSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }

  footprint(buildId) { const f = this.c.builds.get(buildId).footprintTiles; return [f[0], f[1]]; }

  /** Stages: explicit constructionStages from recipe, else one stage containing all inputs. */
  stagesFor(recipe) {
    if (recipe.constructionStages) return recipe.constructionStages.map((s) => ({ label: s.label, requirements: { ...s.requirements } }));
    return [{ label: 'İnşa', requirements: { ...recipe.inputs } }];
  }

  // ---------------- placement validation ----------------
  validatePlacement(buildId, tile, recipeId = null, opts = {}) {
    const g = this.g.terrain.overworld; const def = this.c.builds.get(buildId);
    const [w, h] = this.footprint(buildId); const [x0, y0] = tile;
    const reasons = [];
    if (this.g.world.sceneId !== 'OVERWORLD' && !opts.ignoreScene) reasons.push('Mağara içinde inşa edilemez');
    const p = def.placement;
    const allowed = new Set(this.c.db.BuildPlacementDB.buildPlacementRules.allowedTileIds.map((id) => this.c.terrainById.get(id).tileCode));
    let waterCells = 0, landCells = 0, riverCells = 0, minH = 9, maxH = 0, interiorCells = 0;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (!g.inb(x, y)) { reasons.push('Harita dışı'); continue; }
      const i = g.i(x, y); const code = g.tiles[i]; const t = this.c.terrain[code];
      if (g.gate[i]) reasons.push('Geçit üzerine kurulamaz');
      if (g.interior[i]) interiorCells++;
      if (g.occupied[i] && !(g.interior[i] && !HOUSES.has(buildId) && p !== 'coastal_water')) reasons.push('Alan dolu');
      { const nd = this.g.world.nodeAtTile(x, y); if (nd && this.g.world.nodeReady(nd)) reasons.push('Kaynak düğümü üzerinde (önce topla)'); }
      if (t.isWater) waterCells++; else landCells++;
      if (code === T.RIVER_DEEP || code === T.RIVER_BANK || code === T.RIVER_FORD) riverCells++;
      if (code === T.CLIFF_WALL) reasons.push('Kayalık üzerinde');
      if (g.road[i] && (HOUSES.has(buildId) || w * h >= 4) && !['coastal_water', 'river_bank'].includes(p)) reasons.push('Kritik yol üzerinde');
      minH = Math.min(minH, g.height[i]); maxH = Math.max(maxH, g.height[i]);
      if (['ground', 'coastal_ground', 'inside_house', 'cliff', 'suitable_habitat'].includes(p)) {
        if (!allowed.has(code) || t.isWater) reasons.push('Kuru ve uygun zemin gerekli');
      }
    }
    if (maxH - minH > 1 && !['coastal_water', 'river_bank'].includes(p)) reasons.push('Eğim çok fazla');
    const nearWater = this.adjacentTo(g, x0, y0, w, h, (code) => code === T.OCEAN_SHALLOW || code === T.OCEAN_DEEP || code === T.SEA_REEF, 2);
    if (p === 'coastal_ground' && !nearWater) reasons.push('Kıyıya yakın olmalı');
    if (p === 'coastal_water' || p === 'shallow_water') {
      if (p === 'shallow_water') {
        // traps: in shallow sea/river water or on the shore edge
        const okc = (code) => [T.OCEAN_SHALLOW, T.WETLAND_WADE, T.RIVER_DEEP, T.RIVER_FORD, T.SEA_REEF].includes(code);
        const code = g.tiles[g.i(x0, y0)];
        if (!okc(code) && !this.adjacentTo(g, x0, y0, w, h, okc, 1)) reasons.push('Sığ su kenarı gerekli');
      } else {
        if (waterCells === 0) reasons.push('Suda olmalı');
        if (landCells === 0 && !this.adjacentTo(g, x0, y0, w, h, (code) => this.c.terrain[code].footWalkable && !this.c.terrain[code].isWater, 1)) reasons.push('Kıyıya bitişik olmalı');
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
          const code = g.tileAt(x, y); if (code === T.CLIFF_WALL || code === T.RIVER_DEEP) reasons.push('Uygun kıyı suyu değil');
        }
      }
    }
    if (p === 'river_bank' && riverCells === 0) reasons.push('Nehir kenarı gerekli');
    if (p === 'cliff' && !this.adjacentTo(g, x0, y0, w, h, (code) => code === T.CLIFF_WALL, 1)) reasons.push('Kayalık dibinde olmalı');
    if (p === 'inside_house' && interiorCells < w * h) reasons.push('Ev içine yerleştirilmeli');
    if (p === 'poi_fener') {
      const poi = this.c.pois.get('POI_LIGHTHOUSE'); const [px, py] = this.g.terrain.localToAtlas('LIGHTHOUSE', ...poi.tileLocal);
      if (Math.hypot(x0 + w / 2 - px, y0 + h / 2 - py) > 7) reasons.push('Fener noktasında kurulmalı');
    }
    if (p === 'suitable_habitat') {
      const reg = this.g.terrain.regionAt('OVERWORLD', x0, y0);
      const trap = this.c.traps.get(buildId);
      if (trap && !trap.habitats.includes(reg)) reasons.push('Uygun yaşam alanı değil');
    }
    if (def.category === 'trap' && this.activeTrapCount() >= this.c.db.TrapDB.config.maxActiveTrapsPerSave) reasons.push('En fazla 6 aktif tuzak');
    // POI distance
    for (const poi of this.c.pois.values()) {
      if (!poi.tileLocal) continue;
      const [px, py] = this.g.terrain.localToAtlas(poi.islandId, ...poi.tileLocal);
      const dx = Math.max(x0 - px, 0, px - (x0 + w - 1)), dy = Math.max(y0 - py, 0, py - (y0 + h - 1));
      const d = Math.max(dx, dy);
      const minD = poi.rank === 'MAJOR' && (HOUSES.has(buildId) || def.category === 'shelter' || def.category === 'camp') ? 5 : 2;
      if (buildId === 'BUILD_SIGNAL_STATION' && poi.id === 'POI_LIGHTHOUSE') continue;
      if (d < minD) { reasons.push('Önemli keşif noktasına çok yakın'); break; }
    }
    // cave entrances & public fords must stay free
    if (this.blocksCritical(x0, y0, w, h)) reasons.push('Zorunlu bir yolu/çıkışı kapatır');
    if (HOUSES.has(buildId)) {
      const dx = x0 + Math.floor(w / 2), dy = y0 + h;
      if (!this.g.terrain.passable(g, dx, dy, 'WALK')) reasons.push('Kapının önü açık olmalı');
    }
    if (buildId === 'BUILD_CAMP_MARKER' && Object.keys(this.s.buildingState.campById).length >= this.c.db.DesignConstants.campSlots) reasons.push('En fazla 4 kayıtlı kamp');
    return [...new Set(reasons)];
  }

  adjacentTo(g, x0, y0, w, h, pred, r = 1) {
    for (let y = y0 - r; y < y0 + h + r; y++) for (let x = x0 - r; x < x0 + w + r; x++) {
      if (x >= x0 && x < x0 + w && y >= y0 && y < y0 + h) continue;
      if (g.inb(x, y) && pred(g.tiles[g.i(x, y)])) return true;
    }
    return false;
  }

  activeTrapCount() { return Object.values(this.s.buildingState.byId).filter((b) => this.c.builds.get(b.buildId).category === 'trap').length; }

  /** Safety rule: no construction may block all routes to a mandatory POI, sole cave exit or critical ford. */
  blocksCritical(x0, y0, w, h) {
    const g = this.g.terrain.overworld;
    const inRect = (x, y, pad = 0) => x >= x0 - pad && x < x0 + w + pad && y >= y0 - pad && y < y0 + h + pad;
    for (const f of this.c.db.CollisionNavDB.riverCrossings) { const [x, y] = this.g.terrain.localToAtlas('MAIN', ...f.tileMainLocal); if (inRect(x, y, 1)) return true; }
    for (const cv of this.c.db.CaveDB.caves) { const [x, y] = this.g.terrain.localToAtlas('MAIN', ...cv.returnToWorld.worldTileLocal); if (inRect(x, y, 2)) return true; }
    for (const a of this.c.db.CollisionNavDB.poiApproachAnchors) { const [x, y] = this.g.terrain.localToAtlas(a.islandId, ...a.footApproachTile); if (inRect(x, y, 1)) return true; }
    for (const r of this.c.db.NavigationDB.seaRoutes) {
      for (const pt of [r.departureDock.shoreFootTileLocal]) { const [x, y] = this.g.terrain.localToAtlas('MAIN', ...pt); if (inRect(x, y, 1)) return true; }
    }
    void g;
    return false;
  }

  // ---------------- placement & construction ----------------
  /** PLACE_BUILD: reserves site (no materials consumed yet). */
  place(buildId, tile, { recipeId = null, txId = null, powerVariant = null } = {}) {
    const def = this.c.builds.get(buildId);
    const recipe = this.c.recipes.get(recipeId || def.recipeId);
    if (!recipe || recipe.outputId !== buildId || recipe.outputType === 'upgrade') return { ok: false, code: 'BAD_RECIPE' };
    if (!this.g.knowledge.unlocked(recipe)) { this.g.bus.emit('ui.error', { text: 'Kilitli: ' + this.g.knowledge.unlockText(recipe) }); return { ok: false, code: 'LOCKED' }; }
    if (recipe.station !== 'HAND' && !this.s.knowledge.stations[recipe.station]) {
      this.g.bus.emit('ui.error', { text: 'Önce kur: ' + this.c.itemName(recipe.station) }); return { ok: false, code: 'NEEDS_STATION' };
    }
    for (const sp of recipe.requiredSpecialItems || []) if (!this.s.story.specialItemsGranted.includes(sp)) { this.g.bus.emit('ui.error', { text: 'Gerekli özel parça: ' + this.c.itemName(sp) }); return { ok: false, code: 'NEEDS_SPECIAL' }; }
    if (buildId === 'BUILD_SIGNAL_STATION' && Object.values(this.s.buildingState.byId).some((b) => b.buildId === 'BUILD_SIGNAL_STATION')) return { ok: false, code: 'ALREADY_BUILT' };
    if (buildId === 'BUILD_ESCAPE_BOAT' && Object.values(this.s.buildingState.byId).some((b) => b.buildId === 'BUILD_ESCAPE_BOAT')) { this.g.bus.emit('ui.error', { text: 'Tek bir yelkenli projesi yeterli' }); return { ok: false, code: 'ALREADY_BUILT' }; }
    const reasons = this.validatePlacement(buildId, tile, recipe.id);
    if (reasons.length) { this.g.bus.emit('ui.error', { text: reasons[0] }); return { ok: false, code: 'PLACEMENT_INVALID', reasons }; }
    const [w, h] = this.footprint(buildId);
    const uid = this.g.store.nextUid('b');
    const r = this.g.store.transaction(txId || `PLACE:${uid}`, (tx) => {
      const b = { uid, buildId, recipeId: recipe.id, sceneId: 'OVERWORLD', tile: [...tile], w, h, rotation: 0, stage: 'site', stageIndex: 0,
        delivered: {}, stages: this.stagesFor(recipe), containerId: null, upgrades: [], placedGameSeconds: this.s.clock.gameElapsedSeconds, data: {} };
      if (powerVariant || recipe.powerVariant) b.data.powerVariant = powerVariant || recipe.powerVariant;
      tx.set(this.s.buildingState.byId, uid, b);
      tx.emit('build.placed', { uid, buildId });
      return b;
    });
    if (r.ok) this.applyOccupancy(r.value, +1);
    return r;
  }

  remaining(b) {
    const out = {};
    for (let i = b.stageIndex; i < b.stages.length; i++) {
      for (const [id, n] of Object.entries(b.stages[i].requirements)) {
        const del = i === b.stageIndex ? (b.delivered[id] || 0) : 0;
        if (n - del > 0) out[id] = (out[id] || 0) + n - del;
      }
    }
    return out;
  }
  stageRemaining(b) {
    const st = b.stages[b.stageIndex]; if (!st) return {};
    const out = {};
    for (const [id, n] of Object.entries(st.requirements)) { const left = n - (b.delivered[id] || 0); if (left > 0) out[id] = left; }
    return out;
  }

  /** PROJECT_DELIVER: move as much as possible of current stage from player+nearby chests into escrow. */
  deliver(buildUid, txId = null) {
    const b = this.s.buildingState.byId[buildUid];
    if (!b || b.stage !== 'site') return { ok: false, code: 'NOT_A_SITE' };
    const conts = this.containersNear(b);
    return this.g.store.transaction(txId || `DELIVER:${buildUid}:${this.g.store.nextUid('d')}`, (tx) => {
      let moved = 0;
      const need = this.stageRemaining(b);
      for (const [id, n] of Object.entries(need)) {
        const have = this.g.inventory.count(conts, id);
        const take = Math.min(have, n);
        if (take > 0) {
          this.g.inventory.remove(tx, conts, id, take);
          tx.set(b.delivered, id, (b.delivered[id] || 0) + take);
          const lock = this.s.containers.lockedMaterialsByProject;
          if (!lock[buildUid]) tx.set(lock, buildUid, {});
          tx.set(lock[buildUid], id, (lock[buildUid][id] || 0) + take);
          moved += take;
        }
      }
      if (moved === 0) tx.fail('NOTHING_DELIVERED', 'Bu aşama için malzeme yok');
      // advance stages
      while (b.stageIndex < b.stages.length && Object.keys(this.stageRemaining(b)).length === 0) {
        tx.set(b, 'stageIndex', b.stageIndex + 1);
        tx.set(b, 'delivered', {});
        tx.emit('build.stage', { uid: b.uid, stageIndex: b.stageIndex });
      }
      tx.emit('build.delivered', { uid: b.uid, moved });
      return moved;
    });
  }

  isFullyDelivered(b) { return b.stageIndex >= b.stages.length; }
  constructionSeconds(b) { const r = this.c.recipes.get(b.recipeId); return Math.max(1, r.craftSeconds * this.g.skills.perk('SKILL_CRAFTING', 'craftTimeMultiplier', 1)); }

  /** Finish construction once all stages are delivered (player performed build work). */
  complete(buildUid) {
    const b = this.s.buildingState.byId[buildUid];
    if (!b || b.stage !== 'site') return { ok: false, code: 'NOT_A_SITE' };
    if (!this.isFullyDelivered(b)) return { ok: false, code: 'MATERIALS_MISSING' };
    const r = this.g.store.transaction(`COMPLETE:${buildUid}`, (tx) => {
      tx.set(b, 'stage', 'complete');
      tx.del(this.s.containers.lockedMaterialsByProject, buildUid);
      tx.set(b, 'completedGameSeconds', this.s.clock.gameElapsedSeconds);
      this.initEntityData(tx, b);
      const first = this.g.knowledge.learnStation(tx, b.buildId);
      if (!this.s.knowledge.placedTypes[b.buildId]) {
        tx.set(this.s.knowledge.placedTypes, b.buildId, true);
        this.g.skills.award(tx, 'SKILL_CRAFTING', 'firstPlacementOfBuildType', `firstplace:${b.buildId}`);
      }
      tx.add(this.s.stats, 'buildsPlaced', 1);
      tx.emit('build.completed', { uid: b.uid, buildId: b.buildId, firstStation: first });
    });
    if (r.ok) { this.applyOccupancy(b, 0); this.g.escape?.onBuildCompleted(b); this.g.world.onBuildingsChanged(); }
    return r;
  }

  initEntityData(tx, b) {
    const def = this.c.builds.get(b.buildId);
    const inv = this.g.inventory;
    if (def.storageSlots || def.storageUnits) {
      const cid = `c_${b.uid}`;
      const cont = inv.createContainer(tx, cid, def.storageSlots || 4, { filter: def.filter || null, ownerEntityId: b.uid, unitCap: def.storageUnits || null });
      if (b.buildId === 'BUILD_PANTRY') cont.pantry = true;
      tx.set(b, 'containerId', cid);
    }
    if (def.waterCapacity || b.buildId === 'BUILD_RAIN_CATCHER_L') {
      const cap = (def.waterCapacity || 16) * 100;
      const isCollector = b.buildId.startsWith('BUILD_RAIN_CATCHER');
      tx.set(this.s.waterInfrastructure.byBuildUid, b.uid, { type: b.buildId, mode: isCollector ? 'CLEAN' : null, volumeCenti: 0, capacityCenti: cap });
    }
    if (def.category === 'trap') {
      tx.set(this.s.productionState.trapsById, b.uid, { buildId: b.buildId, bait: null, storedCatch: [], lastRolledDay: this.s.clock.dayIndex, dailyRolls: 0 });
    }
    if (b.buildId === 'BUILD_PLANTER') {
      tx.set(this.s.productionState.cropPlotsById, b.uid, { seedId: null, cropId: null, growthDays: 0, watered: false, wetDay: 0, lastProcessedDay: this.s.clock.dayIndex, ready: false, fertilized: false, harvests: 0 });
    }
    if (BED_REST[b.buildId]) b.data.restValue = BED_REST[b.buildId];
    if (b.buildId === 'BUILD_CAMP_MARKER') {
      const n = Object.keys(this.s.buildingState.campById).length;
      tx.set(this.s.buildingState.campById, b.uid, { name: n === 0 ? 'Ana kamp' : `İleri kamp ${n}`, mainCamp: n === 0, bedId: null, comfortScore: 0, connectedContainers: [] });
    }
    if (b.buildId === 'BUILD_GATE') b.data.open = true;
    if (b.buildId === 'BUILD_WINCH') this.g.world.tryOpenWinch(tx, b);
    if (b.buildId === 'BUILD_RAFT') this.g.sea?.registerRaft(tx, b);
  }

  /** Apply/refresh collision occupancy for a building. delta=+1 add footprint, 0 = refresh after completion. */
  applyOccupancy(b, delta) {
    const g = this.g.terrain.overworld; const { tile: [x0, y0], w, h } = b;
    if (delta === -1 || delta === 0) this.clearOccupancy(b);
    if (delta === -1) return;
    b._occ = [];
    const mark = (x, y, solid) => {
      if (!g.inb(x, y)) return; const i = g.i(x, y);
      g.occupied[i]++; b._occ.push([i, solid ? 1 : 0, 0, 0]);
      if (solid) g.solid[i]++;
    };
    const def = this.c.builds.get(b.buildId);
    const complete = b.stage === 'complete';
    if (HOUSES.has(b.buildId)) {
      const door = x0 + Math.floor(w / 2);
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        const wall = complete && (y === y0 || x === x0 || x === x0 + w - 1 || (y === y0 + h - 1 && x !== door));
        mark(x, y, wall);
        if (complete && !wall) { g.interior[g.i(x, y)]++; b._occ[b._occ.length - 1][2] = 1; }
      }
    } else {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        const deck = complete && DECKS.has(b.buildId);
        const solid = complete && !NON_SOLID.has(b.buildId) && def.category !== 'escape';
        mark(x, y, solid || (b.buildId === 'BUILD_ESCAPE_BOAT'));
        if (deck) { g.deck[g.i(x, y)]++; b._occ[b._occ.length - 1][3] = 1; }
      }
    }
  }
  clearOccupancy(b) {
    const g = this.g.terrain.overworld;
    for (const [i, solid, interior, deck] of b._occ || []) { g.occupied[i]--; if (solid) g.solid[i]--; if (interior) g.interior[i]--; if (deck) g.deck[i]--; }
    b._occ = [];
  }
  rebuildAllOccupancy() {
    const g = this.g.terrain.overworld; g.occupied.fill(0); g.interior.fill(0); g.deck.fill(0);
    for (const b of Object.values(this.s.buildingState.byId)) { b._occ = []; }
    // solids from nodes are re-added by world; here only add buildings
    for (const b of Object.values(this.s.buildingState.byId)) if (b.sceneId === 'OVERWORLD' && b.buildId !== 'BUILD_RAFT') this.applyOccupancy(b, +1);
  }

  containersNear(b) {
    const radius = this.c.db.BuildDB.meta.balance.craftStationNearbyChestRadiusTiles;
    const out = [PLAYER_INV];
    for (const o of Object.values(this.s.buildingState.byId)) {
      if (!o.containerId || o.stage !== 'complete' || o.uid === b.uid || o.sceneId !== b.sceneId) continue;
      if (Math.hypot(o.tile[0] + o.w / 2 - (b.tile[0] + b.w / 2), o.tile[1] + o.h / 2 - (b.tile[1] + b.h / 2)) <= radius) out.push(o.containerId);
    }
    return out;
  }

  /** Cancel a site: refund escrow to player (or keep if no space). */
  cancelSite(buildUid) {
    const b = this.s.buildingState.byId[buildUid];
    if (!b || b.stage !== 'site') return { ok: false, code: 'NOT_A_SITE' };
    const lock = this.s.containers.lockedMaterialsByProject[buildUid] || {};
    const r = this.g.store.transaction(`CANCEL_SITE:${buildUid}`, (tx) => {
      for (const [id, n] of Object.entries(lock)) {
        if (this.g.inventory.spaceFor(PLAYER_INV, id) < n) tx.fail('INVENTORY_FULL', 'İade için yer aç');
        this.g.inventory.add(tx, PLAYER_INV, id, n);
      }
      tx.del(this.s.containers.lockedMaterialsByProject, buildUid);
      tx.del(this.s.buildingState.byId, buildUid);
    });
    if (r.ok) { this.clearOccupancy(b); this.g.world.onBuildingsChanged(); }
    return r;
  }

  // ---------------- upgrades (UPGRADE_EXISTING) ----------------
  /** APPLY_UPGRADE: mutate same building uid; preserve storage, queues, escrow; reject duplicates. */
  applyUpgrade(recipeId, targetBuildUid, txId = null) {
    const r = this.c.recipes.get(recipeId);
    const b = this.s.buildingState.byId[targetBuildUid];
    if (!r || r.outputType !== 'upgrade') return { ok: false, code: 'NOT_UPGRADE' };
    if (!b || b.stage !== 'complete') return { ok: false, code: 'NO_TARGET' };
    if (b.buildId !== r.targetBuildId) return { ok: false, code: 'WRONG_TARGET' };
    if (b.upgrades.includes(recipeId)) { this.g.bus.emit('ui.error', { text: 'Bu yükseltme zaten takılı' }); return { ok: false, code: 'ALREADY_INSTALLED' }; }
    if (!this.g.knowledge.unlocked(r)) { this.g.bus.emit('ui.error', { text: 'Kilitli: ' + this.g.knowledge.unlockText(r) }); return { ok: false, code: 'LOCKED' }; }
    if (r.station !== 'HAND' && !this.s.knowledge.stations[r.station]) { this.g.bus.emit('ui.error', { text: 'Önce kur: ' + this.c.itemName(r.station) }); return { ok: false, code: 'NEEDS_STATION' }; }
    const conts = this.containersNear(b);
    return this.g.store.transaction(txId || `UPGRADE:${targetBuildUid}:${recipeId}`, (tx) => {
      for (const [id, n] of Object.entries(r.inputs)) this.g.inventory.remove(tx, conts, id, n);
      tx.push(b.upgrades, recipeId);
      if (recipeId === 'R_CHEST_REINFORCE' && b.containerId) {
        const cont = this.g.inventory.cont(b.containerId);
        tx.set(cont, 'slots', cont.slots.concat(new Array(8).fill(null)));
        tx.set(cont, 'capacity', cont.slots.length);
      }
      if (recipeId === 'R_FISH_TRAP_ADV') { const t = this.s.productionState.trapsById[b.uid]; if (t) tx.set(t, 'upgraded', true); }
      if (recipeId === 'R_BED_SPECIAL') tx.set(b.data, 'wellRestedBonusHours', 2);
      if (recipeId === 'R_DECOR_SET') tx.set(b.data, 'comfortBonus', 3);
      if (recipeId === 'R_HULL_FIT') tx.set(b.data, 'hullDurabilityBonus', 0.25);
      if (recipeId === 'R_STORM_ANCHOR_FIT') tx.set(b.data, 'stormAnchor', true);
      this.g.skills.craftXp(tx, recipeId, 12, `upgrade:${b.uid}:${recipeId}`);
      tx.emit('build.upgraded', { uid: b.uid, recipeId });
      return b.uid;
    });
  }

  comfortAt(tile, radius = 8) {
    let c = 0;
    for (const b of Object.values(this.s.buildingState.byId)) {
      if (b.stage !== 'complete') continue;
      if (Math.hypot(b.tile[0] - tile[0], b.tile[1] - tile[1]) > radius) continue;
      c += (COMFORT[b.buildId] || 0) + (b.data.comfortBonus || 0) + (HOUSES.has(b.buildId) ? 5 : 0);
    }
    return c;
  }
  comfortLevel(tile) {
    const c = this.comfortAt(tile);
    if (c >= 20) return 4; if (c >= 11) return 3; if (c >= 4) return 2; return 1;
  }

  /** House containing tile (for roof fade). */
  houseAt(x, y) {
    for (const b of Object.values(this.s.buildingState.byId)) {
      if (b.stage !== 'complete' || !(HOUSES.has(b.buildId) || b.buildId === 'BUILD_LEAF_SHELTER')) continue;
      if (x >= b.tile[0] && y >= b.tile[1] && x < b.tile[0] + b.w && y < b.tile[1] + b.h) return b;
    }
    return null;
  }

  isSheltered(x, y) { return !!this.houseAt(x, y); }
}
