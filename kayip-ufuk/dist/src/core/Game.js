// Game composition root: authoritative state, systems, fixed-step simulation order, commands.
import { EventBus } from './EventBus.js';
import { GameClock, DAY_SECONDS } from './GameClock.js';
import { StateStore } from './StateStore.js';
import { RngStreams } from './RngStreams.js';
import { deepClone } from './util.js';
import { TerrainSystem, TILE } from '../world/TerrainSystem.js';
import { CollisionPathfinder } from '../world/CollisionPathfinder.js';
import { WorldScene } from '../scenes/WorldScene.js';
import { SceneRouter } from '../scenes/SceneRouter.js';
import { CaveScene } from '../scenes/CaveScene.js';
import { FinaleScene } from '../scenes/FinaleScene.js';
import { InventorySystem, PLAYER_INV } from '../systems/InventorySystem.js';
import { SkillSystem, KnowledgeSystem } from '../systems/SkillSystem.js';
import { CraftSystem } from '../systems/CraftSystem.js';
import { BuildSystem, STATIONS, HOUSES } from '../systems/BuildSystem.js';
import { ActionSystem } from '../systems/ActionSystem.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { SurvivalSystem } from '../systems/SurvivalSystem.js';
import { ClimateSystem } from '../systems/ClimateSystem.js';
import { FarmSystem } from '../systems/FarmSystem.js';
import { WildlifeSystem } from '../systems/WildlifeSystem.js';
import { FishingSystem } from '../systems/FishingSystem.js';
import { TrapSystem } from '../systems/TrapSystem.js';
import { ExplorationSystem, SPECIAL_INV } from '../systems/ExplorationSystem.js';
import { PuzzleSystem } from '../systems/PuzzleSystem.js';
import { EscapeSystem } from '../systems/EscapeSystem.js';
import { SeaVehicleSystem } from '../systems/SeaVehicleSystem.js';

export const SAVE_VERSION = 5;
export const SIM_HZ = 30;

export function newGameState(content, { slotId = 'slot-1', seed = 1, name = 'Kazazede', appearance = {} } = {}) {
  const [sx, sy] = [content.maps.MAIN.originAtlas[0] + 122, content.maps.MAIN.originAtlas[1] + 220];
  const now = new Date().toISOString();
  const st = {
    saveVersion: SAVE_VERSION, saveSlotId: slotId, revision: 0, slotDisplayName: name, createdAtUtc: now, lastSavedUtc: now, contentVersion: 'v2.0',
    world: { worldSeed: seed >>> 0, worldAtlasVersion: 'v1.2', worldDeltaByEntityId: {}, visitedIslands: ['MAIN'], visitedPoiIds: [], visitedRegions: [], regionPopulation: {}, worldFlags: {}, openedShortcuts: [], exploredCells: {}, dropBags: {}, caveVisits: {}, sos: null },
    clock: GameClock.initial(),
    player: {
      name, appearance: { body: 'body_a', skin: 0, hair: 0, hairColor: 0, outfit: 0, ...appearance },
      sceneId: 'OVERWORLD', islandId: 'MAIN', positionPx: [(sx + 0.5) * TILE, (sy + 0.5) * TILE], facing: 'down', mode: 'WALK',
      health: 100, hunger: 85, thirst: 80, rest: 90, stamina: 100, oxygen: 100, effects: [], inventoryId: PLAYER_INV,
      quickbar: [null, null, null, null, null, null], equipment: { main_hand: null, head: null, body: null, feet: null, backpack: null, accessory: null },
      lastBedId: null, respawn: null, action: null,
    },
    containers: { byId: {}, items: {}, lockedMaterialsByProject: {} },
    buildingState: { byId: {}, campById: {}, prefabInteriorFurniture: {} },
    productionState: { queuesByStation: {}, cropPlotsById: {}, trapsById: {}, resourceNodesById: {} },
    story: { poiStates: {}, puzzlesById: {}, storyRecordsRead: [], specialItemsGranted: [], learnedBlueprints: [], escapeRoutes: {}, endingAchievements: [], caveChests: {} },
    ecosystem: { tamedFriends: {}, fishJournal: {}, natureJournal: [], fishHabitatStock: {}, animalPopulationDayTicks: {} },
    vehicles: { raftsById: {}, boatsById: {}, activeVehicleId: null, landingRecovery: { lastSafeLandingIslandId: 'MAIN', lastSafeLandingTile: [sx, sy] } },
    sessionTransition: { status: 'NONE', transitionId: null, fromScene: null, toScene: null, destinationTile: null, snapshotRevisionOnPrepare: null },
    transactionLedger: { committed: {}, order: [], claimKeys: {} },
    settings: { musicVolume: 0.6, sfxVolume: 0.8, ambienceVolume: 0.7, graphicsQuality: 'HIGH', fpsTarget: 60, touchLayout: 'default', autoWalk: true, language: 'tr', vibration: true, reducedMotion: false },
    climate: { weatherSeed: 0, dayState: 'CLEAR', lastWeatherDay: 1, appliedRainEventIds: {}, tidePhase: 'HIGH', history: {} },
    waterInfrastructure: { byBuildUid: {}, lastDayProcessed: 1 },
    durabilityRuntime: { toolsByInstanceUid: {}, lastRepairTransactionIds: [] },
    resourceEconomyRuntime: { nodeRespawnByUid: {}, fixedNodeExceptionOverrides: {} },
    skills: SkillSystem.initialState(content),
    knowledge: { items: {}, stations: {}, placedTypes: {} },
    stats: { buildsPlaced: 0, deaths: 0, poisDiscovered: 0 },
    rng: null, uidCounter: 0,
  };
  st.climate.weatherSeed = RngStreams.hash(seed >>> 0, 'weather');
  return st;
}

export class Game {
  constructor(content, state, opts = {}) {
    this.content = content; this.opts = opts;
    this.bus = new EventBus();
    this.finaleSpeed = 1;
    this.terrain = new TerrainSystem(content);
    this.pathfinder = new CollisionPathfinder(this.terrain);
    this.attachState(state, true);
  }

  attachState(state, first = false) {
    this.store = new StateStore(state, this.bus);
    this.clock = new GameClock(state.clock);
    this.rng = new RngStreams(state.world.worldSeed, state.rng);
    if (first) {
      this.inventory = new InventorySystem(this); this.knowledge = new KnowledgeSystem(this); this.skills = new SkillSystem(this);
      this.craft = new CraftSystem(this); this.build = new BuildSystem(this); this.actions = new ActionSystem(this);
      this.resources = new ResourceSystem(this); this.survival = new SurvivalSystem(this); this.climate = new ClimateSystem(this);
      this.farm = new FarmSystem(this); this.wildlife = new WildlifeSystem(this); this.fishing = new FishingSystem(this); this.traps = new TrapSystem(this);
      this.exploration = new ExplorationSystem(this); this.puzzles = new PuzzleSystem(this); this.escape = new EscapeSystem(this); this.sea = new SeaVehicleSystem(this);
      this.router = new SceneRouter(this); this.caves = new CaveScene(this); this.finale = new FinaleScene(this);
    }
    // containers
    if (!state.containers.byId[PLAYER_INV]) this.inventory.createContainer(null, PLAYER_INV, this.content.db.DesignConstants.startingBackpackSlots, {});
    if (!state.containers.byId[SPECIAL_INV]) { const c = this.inventory.createContainer(null, SPECIAL_INV, 12, {}); c.allowSpecial = true; }
    // world (node definitions are deterministic from seed; only harvested state is persisted)
    for (const g of [this.terrain.overworld, ...Object.values(this.terrain.caves)]) g.solid.fill(0);
    if (this.world && this.world.nodeDefs && this.world._seed === state.world.worldSeed) {
      // same seed: reuse definitions; re-apply node solids from scratch
      for (const n of this.world.nodeDefs) if (n._solidApplied) { const g = this.terrain.grid(n.sceneId); g.solid[g.i(n.tile[0], n.tile[1])]++; }
      this.world.animals = []; this.world.path = null;
    } else {
      this.world = new WorldScene(this); this.world._seed = state.world.worldSeed;
    }
    this.build.rebuildAllOccupancy();
    this.exploration.syncGates();
    this.clock.dayListeners = [];
    this.clock.onDayAdvance((day, reason) => this.onDay(day, reason));
    this.climate.weatherFor(state.clock.dayIndex);
    this.terrain.lowTide = this.climate.isLowTide();
    this.router.recover();
    this.sea.validateAfterLoad();
    this.validatePlayerPosition();
    state.player.action = null;
  }

  /** Invariant: player cannot be inside solid tile/void after load. */
  validatePlayerPosition() {
    const p = this.store.state.player; const g = this.terrain.grid(p.sceneId);
    if (!g) { p.sceneId = 'OVERWORLD'; }
    const gg = this.terrain.grid(p.sceneId);
    const tx = Math.floor(p.positionPx[0] / TILE), ty = Math.floor(p.positionPx[1] / TILE);
    const mode = p.mode === 'RAFT' ? 'RAFT' : (p.mode === 'SWIM' || p.mode === 'DIVE') ? 'SWIM' : 'WALK';
    if (!this.terrain.passable(gg, tx, ty, mode)) {
      const spot = this.pathfinder.nearestTile(gg, tx, ty, (x, y) => this.terrain.passable(gg, x, y, 'WALK'), 20);
      if (spot) { p.positionPx = [(spot[0] + 0.5) * TILE, (spot[1] + 0.5) * TILE]; p.mode = 'WALK'; }
    }
    if (p.mode === 'SLEEP' || p.mode === 'INTERACT') p.mode = 'WALK';
  }

  get state() { return this.store.state; }

  // ---------- main loop (ImplementationContract.mainGameLoopOrder) ----------
  tick(dt, input = { x: 0, y: 0, sprint: false }) {
    if (!this.clock.running) return;
    if (this.finale.active && !this.finale.active.done) { this.finale.steer(input.x); this.finale.tick(dt); return; }
    // 1-2 movement with collision
    this.world.movePlayer(input, dt);
    this.sea.tick();
    // 3 interactions / AI near camera
    this.actions.tick(dt);
    this.wildlife.tick(dt);
    this.fishing.tick(dt);
    // 4-6 clock + day slices + production
    this.simulateTime(dt, 'tick');
    // 7 story/escape
    this.world.tickFx(dt);
    const p = this.state.player;
    if (p.attackAnim) { p.attackAnim.t += dt; if (p.attackAnim.t > 0.45) p.attackAnim = null; }
    if (p.hurtT > 0) p.hurtT -= dt;
    this.persistence?.tick(dt);
  }

  /** Advances game time and all time-based systems (also used for sleep in 30 s slices). */
  simulateTime(dt, reason) {
    this.clock.advance(dt, reason);
    this.climate.tick();
    this.survival.tick(dt);
    this.craft.tick(dt);
    this.resources.tick(dt);
    this.compostTick(dt);
    if (reason === 'sleep') this.inventory.tickSpoilage(this.state.clock.gameElapsedSeconds);
    else { this.spoilT = (this.spoilT || 0) + dt; if (this.spoilT > 10) { this.spoilT = 0; this.inventory.tickSpoilage(this.state.clock.gameElapsedSeconds); } }
  }

  /** Each day boundary processed exactly once (GameClock ledger). */
  onDay(day, reason) {
    this.climate.onDay(day);
    this.farm.onDay(day);
    this.traps.onDay(day);
    this.resources.onDay(day);
    this.fishing.onDay(day);
    this.wildlife.onDay(day);
    this.escape.onDay(day);
    this.state.waterInfrastructure.lastDayProcessed = day;
    this.bus.emit('day.started', { day, reason });
  }

  compostTick() {
    // compost bin & water filter are queue stations handled by CraftSystem; nothing else needed here
  }

  // ---------- helpers ----------
  /** Add to player inventory; any overflow goes into a safe ground bag (never deleted). */
  giveOrDrop(tx, itemId, qty) {
    if (qty <= 0) return;
    const over = this.inventory.add(tx, PLAYER_INV, itemId, qty);
    if (over > 0) {
      const s = this.state; const [tx0, ty0] = this.world.playerTile();
      let bag = Object.values(s.world.dropBags).find((b) => b.sceneId === this.world.sceneId && Math.hypot(b.tile[0] - tx0, b.tile[1] - ty0) < 2 && b.overflow);
      if (!bag) {
        const id = `drop_${this.store.nextUid('bag')}`;
        const cont = this.inventory.createContainer(tx, `c_${id}`, 12, {});
        bag = { id, sceneId: this.world.sceneId, tile: [tx0, ty0], containerId: cont.id, overflow: true };
        tx.set(s.world.dropBags, id, bag);
      }
      const left = this.inventory.add(tx, bag.containerId, itemId, over);
      if (left > 0) { const c = this.inventory.cont(bag.containerId); tx.set(c, 'slots', c.slots.concat(new Array(12).fill(null))); this.inventory.add(tx, bag.containerId, itemId, left); }
      tx.emit('ui.toast', { text: 'Çanta dolu — fazlası yere bırakıldı (çanta simgesi)' });
    }
  }

  isSheltered() { const [x, y] = this.world.playerTile(); return this.world.sceneId !== 'OVERWORLD' || this.build.isSheltered(x, y); }
  defaultRespawn() { const s = this.content.maps.MAIN.originAtlas; return { sceneId: 'OVERWORLD', px: [(s[0] + 122.5) * TILE, (s[1] + 220.5) * TILE] }; }

  interactLabelForBuild(b) {
    const def = this.content.builds.get(b.buildId);
    if (b.stage === 'site') return this.build.isFullyDelivered(b) ? `İnşa et: ${def.name}` : `Malzeme teslim et: ${def.name}`;
    if (b.buildId === 'BUILD_RAFT') return this.state.player.mode === 'RAFT' ? 'Karaya çık' : 'Sala bin';
    if (b.buildId === 'BUILD_ESCAPE_BOAT') return 'Yelkenli: yola çık';
    if (STATIONS.has(b.buildId)) return `Kullan: ${def.name}`;
    if (def.category === 'storage') return `Aç: ${def.name}`;
    if (def.category === 'sleep') return `Uyu: ${def.name}`;
    if (def.category === 'trap') return `Tuzak: ${def.name}`;
    if (b.buildId === 'BUILD_PLANTER') { const p = this.farm.plot(b.uid); return p?.ready ? 'Hasat et' : p?.cropId ? 'Sula / incele' : 'Tohum ek'; }
    if (def.category === 'water') return `Su: ${def.name}`;
    if (b.buildId === 'BUILD_GATE') return b.data.open ? 'Kapıyı kapat' : 'Kapıyı aç';
    if (b.buildId === 'BUILD_SIGNAL_STATION') return this.escape.lighthouseLabel();
    return def.name;
  }

  extraInteractables(scene, tx, ty, range) {
    const out = [];
    if (scene.startsWith('CAVE_')) out.push(...this.caves.interactables(scene, tx, ty, range));
    // water sources
    const wn = this.world.waterNearby();
    if (wn.fresh && this.state.player.mode === 'WALK') out.push({ kind: 'water', id: 'fresh', d: 0.9, label: 'Nehirden kirli su doldur', tile: [Math.floor(tx), Math.floor(ty)] });
    // raft nearby
    const raft = this.sea.raftNear();
    if (raft && this.state.player.mode !== 'RAFT') { const r = this.sea.rafts()[raft]; out.push({ kind: 'raft', id: raft, d: 1, label: 'Sala bin', tile: [Math.floor(r.atlasPx[0] / TILE), Math.floor(r.atlasPx[1] / TILE)] }); }
    if (this.state.player.mode === 'RAFT' && this.sea.landingSpot()) out.push({ kind: 'land', id: 'land', d: 0.5, label: 'Karaya çık', tile: [Math.floor(tx), Math.floor(ty)] });
    if (this.state.player.mode === 'SWIM' && this.world.canSwimTo(Math.floor(tx), Math.floor(ty))) out.push({ kind: 'dive', id: 'dive', d: 1.4, label: 'Dal', tile: [Math.floor(tx), Math.floor(ty)] });
    if (this.state.player.mode === 'DIVE') out.push({ kind: 'surface', id: 'surface', d: 1.4, label: 'Yüzeye çık', tile: [Math.floor(tx), Math.floor(ty)] });
    // rescue boat
    if (scene === 'OVERWORLD' && this.escape.rescueAvailable()) {
      const [rx, ry] = this.escape.rescueTile();
      const d = Math.hypot(rx + 0.5 - tx, ry + 0.5 - ty);
      if (d <= range + 2.5) out.push({ kind: 'rescue', id: 'rescue', d, label: 'Kurtarma teknesine bin', tile: [rx, ry] });
    }
    // cave entrances (after POI discovered)
    if (scene === 'OVERWORLD') for (const cv of this.content.db.CaveDB.caves) {
      const [cx, cy] = this.terrain.localToAtlas('MAIN', ...cv.returnToWorld.worldTileLocal);
      const d = Math.hypot(cx + 0.5 - tx, cy + 0.5 - ty);
      if (d <= range + 1 && this.state.story.poiStates[cv.entrancePoi]?.discovered && this.state.story.poiStates[cv.entrancePoi]?.rewardClaimed) out.push({ kind: 'cave_enter', id: cv.id, d: d + 0.2, label: `Gir: ${cv.name}`, tile: [cx, cy] });
    }
    return out;
  }

  /** Central INTERACT command dispatcher. */
  interact(target) {
    if (!target) return { ok: false };
    const s = this.state;
    switch (target.kind) {
      case 'node': return this.resources.gather(target.id);
      case 'poi': return this.exploration.interact(target.id);
      case 'cave_exit': return this.caves.exit();
      case 'cave_enter': return this.caves.enter(target.id);
      case 'cave_obj': case 'cave_gated': return this.caves.openObject(target.id);
      case 'raft': return this.sea.board(target.id);
      case 'land': return this.sea.disembark();
      case 'dive': s.player.mode = 'DIVE'; this.bus.emit('mode.changed', { mode: 'DIVE' }); return { ok: true };
      case 'surface': s.player.mode = 'SWIM'; this.bus.emit('mode.changed', { mode: 'SWIM' }); return { ok: true };
      case 'rescue': return this.escape.boardRescue();
      case 'bag': this.ui?.openStorage(s.world.dropBags[target.id].containerId, 'Düşen çanta', target.id); return { ok: true };
      case 'water': return this.collectFreshWater();
      case 'animal': {
        const a = this.world.animals.find((x) => x.id === target.id); if (!a) return { ok: false };
        if (a.pet) { this.ui?.openPets(a.petId); return { ok: true }; }
        if (a.speciesId === 'ANIMAL_MONKEY' || a.speciesId === 'ANIMAL_FOREST_BIRD') {
          const hasFood = ['FOOD_BANANA', 'FOOD_BERRY', 'FOOD_COCONUT', 'CROP_PINEAPPLE'].some((id) => this.inventory.hasItem(id));
          if (a.speciesId === 'ANIMAL_MONKEY' || hasFood) return this.wildlife.interactWild(a, hasFood ? 'feed' : 'calm');
        }
        return this.wildlife.attack();
      }
      case 'build': return this.interactBuild(target.id);
      default: return { ok: false };
    }
  }

  interactBuild(uid) {
    const b = this.state.buildingState.byId[uid]; if (!b) return { ok: false };
    if (b.stage === 'site') {
      if (this.build.isFullyDelivered(b)) {
        const secs = this.build.constructionSeconds(b);
        this.actions.start('build', secs, () => this.build.complete(uid), { anim: 'build', label: 'İnşa ediliyor', data: { hitEvery: 0.6 } });
        return { ok: true };
      }
      const r = this.build.deliver(uid);
      if (!r.ok) this.bus.emit('ui.error', { text: 'Gerekli: ' + Object.entries(this.build.stageRemaining(b)).map(([id, n]) => `${this.content.itemName(id)} ×${n}`).join(', ') });
      return r;
    }
    const def = this.content.builds.get(b.buildId);
    if (b.buildId === 'BUILD_RAFT') { const id = Object.keys(this.sea.rafts()).find((k) => k === uid); return id ? this.sea.board(id) : { ok: false }; }
    if (b.buildId === 'BUILD_ESCAPE_BOAT') { this.ui?.openBoat(uid); return { ok: true }; }
    if (b.buildId === 'BUILD_SIGNAL_STATION') return this.escape.lighthouseInteract();
    if (STATIONS.has(b.buildId)) { this.craft.claimAll(uid); this.ui?.openCraft(uid); return { ok: true }; }
    if (def.category === 'storage') { this.ui?.openStorage(b.containerId, def.name, uid); return { ok: true }; }
    if (def.category === 'sleep') return this.survival.sleep(uid);
    if (def.category === 'trap') { this.ui?.openTrap(uid); return { ok: true }; }
    if (def.category === 'water') { this.ui?.openWater(uid); return { ok: true }; }
    if (b.buildId === 'BUILD_PLANTER') { this.ui?.openPlot(uid); return { ok: true }; }
    if (b.buildId === 'BUILD_GATE') { b.data.open = !b.data.open; this.build.applyOccupancy(b, 0); const g = this.terrain.overworld; if (!b.data.open) { g.solid[g.i(b.tile[0], b.tile[1])]++; b._occ.push([g.i(b.tile[0], b.tile[1]), 1, 0, 0]); } this.bus.emit('door.toggled', {}); return { ok: true }; }
    if (b.buildId === 'BUILD_FEED_BOWL') return this.fillFeedBowl(b);
    if (def.category === 'pet' || b.buildId === 'BUILD_PLAY_POST') { this.ui?.openPets(); return { ok: true }; }
    if (b.buildId === 'BUILD_MAP_TABLE') { this.ui?.openMap(); return { ok: true }; }
    if (b.buildId === 'BUILD_CAMP_MARKER') { this.ui?.toast(`${this.state.buildingState.campById[uid]?.name || 'Kamp'} — konfor seviyesi ${this.build.comfortLevel(b.tile)}/4`); return { ok: true }; }
    if (def.category === 'decor' || def.category === 'outdoor' || HOUSES.has(b.buildId)) { this.ui?.toast(`${def.name} — ${def.ability}`); return { ok: true }; }
    return { ok: false };
  }

  fillFeedBowl(b) {
    const food = ['FOOD_BANANA', 'FOOD_BERRY', 'FOOD_COCONUT'].find((id) => this.inventory.hasItem(id));
    if (!food) { this.bus.emit('ui.error', { text: 'Kaba koymak için meyve gerekli' }); return { ok: false }; }
    return this.store.transaction(null, (tx) => {
      this.inventory.remove(tx, [PLAYER_INV], food, 1);
      for (const f of Object.values(this.state.ecosystem.tamedFriends)) { if (!f.daily) f.daily = { day: this.state.clock.dayIndex, feed: 0, calm: 0, nearby: 0 }; f.daily.fed = true; }
      tx.emit('ui.toast', { text: 'Besleme kabı dolduruldu — dostların bugün tok' });
    });
  }

  collectFreshWater() {
    const can = this.inventory.bestTool('TOOL_WATERING_CAN');
    if (can && (can.metadata.water || 0) < 10 && this.inventory.waterCapacity() <= this.inventory.waterCarried()) return this.farm.refillCan();
    const n = Math.min(this.inventory.spaceFor(PLAYER_INV, 'WATER_DIRTY'), 2);
    if (n <= 0) {
      if (can) return this.farm.refillCan();
      this.bus.emit('ui.error', { text: 'Su taşımak için bambu bardak, şişe veya konserve kutusu gerekli' }); return { ok: false };
    }
    const r = this.store.transaction(null, (tx) => { this.inventory.add(tx, PLAYER_INV, 'WATER_DIRTY', n); tx.emit('water.taken', { n }); });
    if (can && (can.metadata.water || 0) < 10) this.farm.refillCan();
    return r;
  }

  /** Replace state (load, finale restore). */
  restoreState(newState, reason) {
    newState.rng = newState.rng || this.rng.serialize();
    const ui = this.ui; const persistence = this.persistence; const audio = this.audio;
    this.finale.active = null;
    this.attachState(newState);
    this.ui = ui; this.persistence = persistence; this.audio = audio;
    this.bus.emit('state.restored', { reason });
  }

  /** Serializable immutable snapshot of the authoritative state. */
  snapshot() {
    this.state.rng = this.rng.serialize();
    const snap = deepClone(this.state);
    snap.player.action = null;
    return snap;
  }

  dayFraction() { return this.state.clock.timeOfDaySeconds / DAY_SECONDS; }
}
