// Harvest, depletion, respawn (day-based, never inside buildings), tool wear, skill XP once per completed node.
import { TOOL_RULE } from '../world/EntityIndex.js';
import { RngStreams } from '../core/RngStreams.js';
import { PLAYER_INV } from './InventorySystem.js';

const FORAGE_XP = new Set(['MAT_FIBER', 'MAT_PALM_LEAF', 'FOOD_BERRY', 'FOOD_BANANA', 'FOOD_COCONUT', 'MAT_VINE', 'MAT_BAMBOO', 'MAT_RESIN', 'MAT_BRANCH', 'MAT_REED', 'MAT_MED_HERB', 'MAT_TREE_BARK', 'FOOD_MUSHROOM', 'MAT_SAP', 'MAT_SPICE_HERB']);

export class ResourceSystem {
  constructor(game) { this.g = game; this.pendingRespawn = new Set(); this.respawnCheckT = 0; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }

  label(n) {
    const name = this.c.itemName(n.itemId);
    const r = TOOL_RULE[n.itemId];
    if (r?.tool === 'axe') return `Kes: ${name}`;
    if (r?.tool === 'pick') return `Kaz: ${name}`;
    return `Topla: ${name}`;
  }

  requirement(n) {
    const rule = TOOL_RULE[n.itemId];
    if (!rule || !rule.tool) return { ok: true, tool: rule?.optional ? this.g.inventory.bestTool(rule.optional) : null };
    const tool = this.g.inventory.bestTool(rule.tool);
    if (!tool) return { ok: false, text: rule.tool === 'axe' ? 'Balta gerekli' : 'Kazma gerekli' };
    const tier = this.c.items.get(tool.itemId).gatherTier || 1;
    if (tier < rule.tier) return { ok: false, text: rule.tier >= 2 ? 'Bakır veya demir kazma gerekli' : 'Daha iyi alet gerekli' };
    return { ok: true, tool };
  }

  harvestSeconds(n, tool) {
    const ass = this.c.db.BalanceDB.methodology.harvestNodeAssumptions[n.itemId];
    let t = ass ? ass.harvestSec : 5;
    if (tool) {
      const it = this.c.items.get(tool.itemId);
      if (it.chopSecondsMultiplier) t *= it.chopSecondsMultiplier;
      if (/PICK$/.test(tool.itemId)) t *= ({ 1: 1, 2: 0.8, 3: 0.65 })[it.gatherTier] || 1;
    }
    const rule = TOOL_RULE[n.itemId];
    if (rule?.tool === 'axe') t *= this.g.skills.perk('SKILL_FORESTRY', 'cutTimeMultiplier', 1);
    if (rule?.tool === 'pick' || rule?.optional === 'pick') t *= this.g.skills.perk('SKILL_MINING', 'miningTimeMultiplier', 1);
    return Math.max(1.2, t * 0.6); // action pacing tuned for mobile; relative ratios kept from BalanceDB
  }

  /** GATHER command: validates, then runs a timed action; completion commits one transaction. */
  gather(nodeId) {
    const n = this.g.world.nodeById.get(nodeId);
    if (!n || !this.g.world.nodeReady(n)) return { ok: false, code: 'NOT_READY' };
    if (this.g.world.distToTile(...n.tile) > 2.2) return { ok: false, code: 'TOO_FAR' };
    const req = this.requirement(n);
    if (!req.ok) { this.g.bus.emit('ui.error', { text: req.text }); return { ok: false, code: 'TOOL_REQUIRED' }; }
    if (this.g.inventory.spaceFor(PLAYER_INV, n.itemId) <= 0) { this.g.bus.emit('ui.error', { text: 'Çanta dolu' }); return { ok: false, code: 'INVENTORY_FULL' }; }
    const rule = TOOL_RULE[n.itemId];
    const anim = rule?.tool === 'axe' ? 'chop' : (rule?.tool === 'pick' || (rule?.optional === 'pick' && req.tool)) ? 'mine' : 'gather';
    const secs = this.harvestSeconds(n, req.tool);
    const hits = anim === 'chop' ? this.treeHits(req.tool) : anim === 'mine' ? 3 : 1;
    this.g.actions.start('gather', secs, () => this.completeHarvest(nodeId, req.tool?.uid), { anim, label: this.label(n), data: { nodeId, hitEvery: secs / hits, anim } });
    return { ok: true };
  }

  treeHits(tool) {
    const wp = this.c.db.DurabilityDB.workProfiles.tree;
    if (!tool) return 3;
    if (tool.itemId === 'TOOL_IRON_AXE') return wp.ironAxeHitsToFell;
    if (tool.itemId === 'TOOL_COPPER_AXE') return wp.copperAxeHitsToFell;
    return wp.stoneAxeHitsToFell;
  }

  completeHarvest(nodeId, toolUid) {
    const n = this.g.world.nodeById.get(nodeId);
    const st = this.s.productionState.resourceNodesById[nodeId] || { depleted: false, harvests: 0 };
    if (st.depleted) return { ok: false, code: 'NOT_READY' };
    const harvestNo = (st.harvests || 0) + 1;
    const txId = `HARVEST:${nodeId}:${harvestNo}`;
    return this.g.store.transaction(txId, (tx) => {
      const rng = RngStreams.keyed(this.s.world.worldSeed, 'node', nodeId, harvestNo);
      let qty = rng.int(n.yieldMin, n.yieldMax);
      const tool = toolUid ? this.g.inventory.item(toolUid) : null;
      const rule = TOOL_RULE[n.itemId];
      if (tool && rule?.tool === 'axe') {
        if (rng.chance(this.g.skills.perk('SKILL_FORESTRY', 'bonusLogChance', 0))) qty++;
        this.g.inventory.wear(tx, tool, this.treeHits(tool));
      } else if (tool && (rule?.tool === 'pick' || rule?.optional === 'pick')) {
        const wp = this.c.db.DurabilityDB.workProfiles.ore;
        const per = tool.itemId === 'TOOL_IRON_PICK' ? wp.ironPickDurabilityPerNode : wp.stonePickDurabilityPerNode;
        this.g.inventory.wear(tx, tool, Math.max(1, Math.round(per * this.g.skills.perk('SKILL_MINING', 'pickWearMultiplier', 1))));
        if (rule.tool === 'pick' && rng.chance(this.g.skills.perk('SKILL_MINING', 'bonusOreChance', 0))) qty++;
        if (rule.optional) qty++;
      }
      this.g.giveOrDrop(tx, n.itemId, qty);
      // trees also shed branches; palms drop coconuts occasionally (supporting materials, no new ids)
      if (n.kind === 'TREE' && rng.chance(0.5)) this.g.giveOrDrop(tx, 'MAT_BRANCH', 1);
      if (n.itemId === 'MAT_LOG' && rng.chance(0.25)) this.g.giveOrDrop(tx, 'MAT_TREE_BARK', 1);
      if (n.itemId === 'MAT_PALM_LEAF' && rng.chance(0.15)) this.g.giveOrDrop(tx, 'FOOD_COCONUT', 1);
      if ((n.itemId === 'MAT_STONE') && rng.chance(0.3)) this.g.giveOrDrop(tx, 'MAT_PEBBLE', rng.int(1, 3));
      if (n.itemId === 'FOOD_BERRY' && rng.chance(0.2)) this.g.giveOrDrop(tx, 'MAT_ORGANIC_WASTE', 1);
      if (n.itemId === 'MAT_SEAWEED' && rng.chance(0.25)) this.g.giveOrDrop(tx, 'MAT_ORGANIC_WASTE', 1);
      // XP once for the completed node
      if (rule?.xp && (rule.tool || tool)) this.g.skills.award(tx, rule.xp[0], rule.xp[1], txId);
      else if (FORAGE_XP.has(n.itemId) || n.itemId.startsWith('SEED_')) this.g.skills.award(tx, 'SKILL_FORESTRY', 'foragePlant', txId);
      const days = n.respawnDaysMax ? rng.int(n.respawnDays, n.respawnDaysMax) : n.respawnDays;
      tx.set(this.s.productionState.resourceNodesById, nodeId, { depleted: true, harvests: harvestNo, respawnGameDay: this.s.clock.dayIndex + days, lastHarvestEventId: txId });
      tx.emit('node.harvested', { nodeId, itemId: n.itemId, qty, kind: n.kind });
      return qty;
    });
  }

  /** LootSpawnDB.salvageDaily + LootTableDB.stormSalvage: drifting salvage on eligible shores.
   * AFTER_STORM: up to 2 nodes/region the day after a storm; LOW_CHANCE_DAILY: 15 % one node. Lifetime 3 days.
   * SAL_BOTTLE has no DB source, so each drift node has a 25 % chance of an extra bottle (spec-issues SI-02). */
  spawnFlotsam(day) {
    const s = this.s; const c = this.c; if (!s.world.flotsam) s.world.flotsam = {};
    for (const [id, f] of Object.entries(s.world.flotsam)) if (f.expiresDay < day) delete s.world.flotsam[id];
    const prevStorm = this.g.climate.weatherFor(Math.max(1, day - 1)) === 'STORM';
    const pool = c.lootPools.get(c.db.LootTableDB.globalPolicies.stormSalvage.poolId);
    const g = this.g.terrain.overworld;
    for (const regionId of c.db.LootSpawnDB.salvageDaily.eligibleRegions) {
      const rng = RngStreams.keyed(s.world.worldSeed, 'flotsam', regionId, day);
      const n = prevStorm ? c.db.LootSpawnDB.salvageDaily.maxNewNodesPerDayPerRegion : rng.next() < 0.15 ? 1 : 0;
      const code = c.regions.get(regionId).mapZoneOrder;
      for (let k = 0; k < n; k++) {
        for (let tries = 0; tries < 60; tries++) {
          const x = rng.int(0, g.w - 1), y = rng.int(0, g.h - 1); const i = g.i(x, y);
          if (g.region[i] !== code || g.tiles[i] !== 2 || g.occupied[i] || g.solid[i]) continue; // BEACH_SAND only
          if (this.g.world.sceneId === 'OVERWORLD' && this.g.world.distToTile(x, y) < 14) continue; // off-camera spawn
          const e = rng.weighted(pool.entries);
          const id = `FLOT_${day}_${regionId}_${k}`;
          s.world.flotsam[id] = { id, tile: [x, y], items: { [e.itemId]: rng.int(e.min, e.max), ...(rng.next() < 0.25 ? { SAL_BOTTLE: 1 } : {}) }, expiresDay: day + c.db.LootTableDB.globalPolicies.stormSalvage.lifetimeGameDays };
          break;
        }
      }
    }
  }
  collectFlotsam(id) {
    const f = this.s.world.flotsam?.[id]; if (!f) return { ok: false };
    return this.g.store.transaction(`FLOTSAM:${id}`, (tx) => {
      for (const [itemId, q] of Object.entries(f.items)) this.g.giveOrDrop(tx, itemId, q);
      tx.del(this.s.world.flotsam, id);
      this.g.skills.award(tx, 'SKILL_EXPLORATION', null, `flotsam:${id}`, 2);
      tx.emit('node.harvested', { nodeId: id, itemId: Object.keys(f.items)[0], qty: Object.values(f.items)[0], kind: 'FORAGE', flotsam: true });
    });
  }

  /** Daily tick: mark nodes due. Actual reappearance waits until spot is free of buildings and off-camera. */
  onDay(day) {
    this.spawnFlotsam(day);
    for (const [id, st] of Object.entries(this.s.productionState.resourceNodesById)) {
      if (st.depleted && st.respawnGameDay <= day) this.pendingRespawn.add(id);
    }
    this.tryRespawn(true);
  }
  tick(dt) {
    this.respawnCheckT += dt;
    if (this.respawnCheckT > 3) { this.respawnCheckT = 0; this.tryRespawn(false); }
  }
  tryRespawn(force) {
    if (!this.pendingRespawn.size) {
      // rebuild pending set after load
      for (const [id, st] of Object.entries(this.s.productionState.resourceNodesById)) if (st.depleted && st.respawnGameDay <= this.s.clock.dayIndex) this.pendingRespawn.add(id);
    }
    for (const id of [...this.pendingRespawn]) {
      const n = this.g.world.nodeById.get(id); const st = this.s.productionState.resourceNodesById[id];
      if (!n || !st) { this.pendingRespawn.delete(id); continue; }
      const g = this.g.terrain.grid(n.sceneId);
      if (g.occupied?.[g.i(n.tile[0], n.tile[1])]) continue; // never inside buildings: delay
      const inView = n.sceneId === this.g.world.sceneId && this.g.world.distToTile(...n.tile) < 14;
      if (inView && !force) continue;
      if (inView && force) continue;
      st.depleted = false; this.pendingRespawn.delete(id);
    }
  }
}
