// Static resource node definitions (fixed starter guarantees + cave objects + seeded secondary nodes)
// and a chunked spatial hash for dynamic objects.
import { sha256 } from '../core/util.js';
import { T } from './TerrainSystem.js';

const CHUNK = 16;
export const KIND_OF = {
  MAT_LOG: 'TREE', MAT_HARDWOOD: 'TREE', MAT_PALM_LEAF: 'PALM', FOOD_COCONUT: 'PALM', MAT_BAMBOO: 'BAMBOO', MAT_RESIN: 'RESIN_TREE',
  MAT_STONE: 'STONE', MAT_COAL: 'ORE', MAT_COPPER_ORE: 'ORE', MAT_IRON_ORE: 'ORE', MAT_QUARTZ: 'ORE', MAT_SULFUR: 'ORE', MAT_FLINT: 'STONE',
  MAT_CLAY: 'CLAY', MAT_SAND: 'SAND', MAT_FIBER: 'FIBER', MAT_BRANCH: 'BRANCH', FOOD_BERRY: 'FRUIT', FOOD_BANANA: 'FRUIT', FOOD_MUSHROOM: 'FRUIT',
};
export const RESPAWN_KIND = { TREE: 'TREE', PALM: 'TREE', BAMBOO: 'TREE', RESIN_TREE: 'TREE', STONE: 'STONE', ORE: 'METAL', CLAY: 'CLAY', SAND: 'CLAY', FIBER: 'FIBER', BRANCH: 'BRANCH', FRUIT: 'FRUIT', FORAGE: 'FIBER' };
/** Tool requirements: null = hand. tier = minimum gatherTier. */
export const TOOL_RULE = {
  MAT_LOG: { tool: 'axe', tier: 1, xp: ['SKILL_FORESTRY', 'chopTree'] },
  MAT_HARDWOOD: { tool: 'axe', tier: 1, xp: ['SKILL_FORESTRY', 'chopHardwood'] },
  MAT_COAL: { tool: 'pick', tier: 1, xp: ['SKILL_MINING', 'mineOreNode'] },
  MAT_COPPER_ORE: { tool: 'pick', tier: 1, xp: ['SKILL_MINING', 'mineOreNode'] },
  MAT_IRON_ORE: { tool: 'pick', tier: 2, xp: ['SKILL_MINING', 'mineOreNode'] },
  MAT_QUARTZ: { tool: 'pick', tier: 2, xp: ['SKILL_MINING', 'mineOreNode'] },
  MAT_SULFUR: { tool: 'pick', tier: 1, xp: ['SKILL_MINING', 'mineOreNode'] },
  MAT_STONE: { tool: null, optional: 'pick', xp: ['SKILL_MINING', 'mineStoneCluster'] },
  MAT_FLINT: { tool: null, optional: 'pick', xp: ['SKILL_MINING', 'mineStoneCluster'] },
};

export function nodeKind(itemId) {
  if (KIND_OF[itemId]) return KIND_OF[itemId];
  if (itemId.startsWith('SEED_')) return 'FORAGE';
  return 'FORAGE';
}

const DEFAULT_YIELD = { FORAGE: [1, 3], FIBER: [2, 3], BRANCH: [2, 4], STONE: [3, 5], CLAY: [3, 4], SAND: [2, 4], FRUIT: [2, 4], ORE: [3, 4], TREE: [3, 4], PALM: [3, 5], BAMBOO: [3, 5], RESIN_TREE: [1, 2] };

export class EntityIndex {
  constructor() { this.chunks = new Map(); }
  key(scene, cx, cy) { return `${scene}:${cx}:${cy}`; }
  add(scene, tx, ty, ref) {
    const k = this.key(scene, Math.floor(tx / CHUNK), Math.floor(ty / CHUNK));
    if (!this.chunks.has(k)) this.chunks.set(k, new Set());
    this.chunks.get(k).add(ref);
  }
  remove(scene, tx, ty, ref) { this.chunks.get(this.key(scene, Math.floor(tx / CHUNK), Math.floor(ty / CHUNK)))?.delete(ref); }
  query(scene, x0, y0, x1, y1) {
    const out = [];
    for (let cy = Math.floor(y0 / CHUNK); cy <= Math.floor(y1 / CHUNK); cy++)
      for (let cx = Math.floor(x0 / CHUNK); cx <= Math.floor(x1 / CHUNK); cx++) {
        const s = this.chunks.get(this.key(scene, cx, cy)); if (s) for (const r of s) out.push(r);
      }
    return out;
  }
  clear() { this.chunks.clear(); }
}

/** Build all static node definitions deterministically from worldSeed. Returns array of node defs. */
export function generateNodeDefs(content, terrain, worldSeed) {
  const defs = [];
  const g = terrain.overworld;
  const used = new Uint8Array(g.w * g.h);
  const block = (x, y, r) => { for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) if (g.inb(xx, yy)) used[g.i(xx, yy)] = 1; };
  const rules = content.nodeRules;
  const mk = (id, itemId, sceneId, tile, extra = {}) => {
    const kind = nodeKind(itemId);
    const rule = rules.get(itemId);
    const [ymin, ymax] = rule ? [rule.yieldMin, rule.yieldMax] : DEFAULT_YIELD[kind];
    return { id, itemId, sceneId, tile, kind, yieldMin: ymin, yieldMax: ymax, respawnDays: rule?.respawnGameDays, ...extra };
  };
  // 1) fixed starter guarantee nodes (v1.5: 63 fiber etc.) — never randomized
  for (const so of content.db.LootSpawnDB.starterGuarantees.sourceObjects) {
    const [ax, ay] = terrain.localToAtlas('MAIN', ...so.tileLocal);
    const ex = content.db.ResourceEconomyDB.starterFixedNodeExceptions[so.id];
    defs.push(mk(so.id, so.itemId, 'OVERWORLD', [ax, ay], { fixed: true, yieldMin: so.guaranteedMinYield, yieldMax: so.guaranteedMinYield, respawnDays: ex?.respawnGameDays ?? so.respawnGameDays, origin: so.origin }));
    block(ax, ay, 1);
  }
  // 2) cave resource objects
  for (const cv of content.db.CaveDB.caves) {
    for (const o of cv.objects) {
      if (o.type !== 'resource') continue;
      defs.push(mk(`${cv.id}:${o.id}`, o.itemId, cv.id, o.tile, { fixed: true, yieldMin: o.amountRange[0], yieldMax: o.amountRange[1], respawnDays: o.respawnGameDays[0], respawnDaysMax: o.respawnGameDays[1], claimKey: o.claimKey }));
    }
  }
  // 3) protected areas: POIs, spawn, fords, roads, gates, cave entrances
  for (const p of content.db.POIDB.pois) { const [x, y] = terrain.localToAtlas(p.islandId, ...p.tileLocal); block(x, y, 3); }
  const sp = terrain.localToAtlas('MAIN', 122, 220); block(sp[0], sp[1], 2);
  for (const f of content.db.CollisionNavDB.riverCrossings) { const [x, y] = terrain.localToAtlas('MAIN', ...f.tileMainLocal); block(x, y, 1); }
  for (const r of content.db.NavigationDB.seaRoutes) { const [x, y] = terrain.localToAtlas('MAIN', ...r.departureDock.shoreFootTileLocal); block(x, y, 2); }
  for (const r of content.db.NavigationDB.seaRoutes) {
    const isl = r.toRegion === 'REG_LIGHTHOUSE' ? 'LIGHTHOUSE' : r.toRegion === 'REG_WRECK' ? 'WRECK' : 'FERTILE';
    const [x, y] = terrain.localToAtlas(isl, ...r.arrivalDock.shoreFootTileLocal); block(x, y, 2);
  }
  for (const pad of content.db.BuildPlacementDB.suggestedBuildPads) {
    const [px, py] = terrain.localToAtlas(pad.islandId, ...pad.topLeftTile);
    for (let y = py - 1; y <= py + pad.footprintTiles[1]; y++) for (let x = px - 1; x <= px + pad.footprintTiles[0]; x++) if (g.inb(x, y)) used[g.i(x, y)] = 1;
  }
  // 4) seeded secondary nodes per region (LootSpawnDB regionSpawnProfiles)
  const candidates = new Map();
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = g.i(x, y); const code = g.tiles[i];
    const t = content.terrain[code];
    if (!t.footWalkable || t.isWater || g.road[i] || g.gate[i] || code === T.TIDAL_SANDBAR || code === T.CLIFF_WALL || code === T.DIRT_TRAIL) continue;
    const reg = g.region[i]; if (!reg) continue;
    if (!candidates.has(reg)) candidates.set(reg, []);
    candidates.get(reg).push(i);
  }
  for (const [regionId, prof] of Object.entries(content.db.LootSpawnDB.regionSpawnProfiles)) {
    const region = content.regions.get(regionId);
    const cand = candidates.get(region.mapZoneOrder) || [];
    if (!cand.length) continue;
    const items = prof.resourceItemIds;
    let placed = 0;
    for (let slot = 0; placed < prof.targetAliveSourceNodes && slot < prof.targetAliveSourceNodes * 6; slot++) {
      const h = sha256(`${worldSeed}${regionId}${slot}`);
      const pick = ((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) >>> 0;
      const ci = cand[pick % cand.length];
      if (used[ci]) continue;
      const x = ci % g.w, y = (ci / g.w) | 0;
      // critical items cycle deterministically through the profile so every item exists in each region
      const itemId = items[(placed + h[4]) % items.length];
      const tcode = g.tiles[ci];
      if ((itemId === 'MAT_SAND' || itemId === 'MAT_SEASHELL' || itemId === 'MAT_SEA_SALT' || itemId === 'MAT_SEAWEED') && !(tcode === T.BEACH_SAND || tcode === T.LAGOON_SOIL)) continue;
      defs.push(mk(`N_${regionId}_${slot}`, itemId, 'OVERWORLD', [x, y], { region: regionId }));
      block(x, y, prof.minDistanceBetweenNodesTiles - 1 >= 1 ? 1 : 0);
      used[ci] = 1;
      placed++;
    }
  }
  // respawn days from region kind defaults when not item-specific
  for (const d of defs) {
    if (d.respawnDays == null) {
      const prof = content.db.LootSpawnDB.regionSpawnProfiles[d.region || 'REG_BEACH'];
      d.respawnDays = prof.respawnGameDaysByKind[RESPAWN_KIND[d.kind]] ?? 3;
    }
    d.solid = d.kind === 'TREE' || d.kind === 'PALM' || d.kind === 'ORE' || d.kind === 'RESIN_TREE';
  }
  return defs;
}
