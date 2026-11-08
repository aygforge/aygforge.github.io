// Terrain RLE decoding into scene grids (512x384 sea atlas with 4 islands stamped in, plus 3 caves).
// Provides per-tile walk/swim/raft rules from TerrainDB and CaveDB.

export const TILE = 32;
export const ISLANDS = ['MAIN', 'LIGHTHOUSE', 'WRECK', 'FERTILE'];
export const CAVES = ['CAVE_COPPER', 'CAVE_BATS', 'CAVE_POND'];

// TerrainDB tile codes
export const T = {
  OCEAN_DEEP: 0, OCEAN_SHALLOW: 1, BEACH_SAND: 2, MEADOW: 3, GROVE: 4, FOREST_FLOOR: 5, SWAMP_SOIL: 6, ROCKY_GROUND: 7,
  MOUNTAIN_SOIL: 8, SETTLEMENT_GROUND: 9, LAGOON_SOIL: 10, WETLAND_WADE: 11, RIVER_DEEP: 12, RIVER_FORD: 13, DIRT_TRAIL: 14,
  CLIFF_WALL: 15, TIDAL_SANDBAR: 16, REED_PATCH: 17, SEA_REEF: 18, RIVER_BANK: 19,
};
// CaveDB codes
export const C = { WALL: 0, STONE_FLOOR: 1, WOODEN_WALKWAY: 2, SHALLOW_POOL: 3, DEEP_POOL: 4, ORE_FLOOR: 5, DAMP_FLOOR: 6 };

export class SceneGrid {
  constructor(id, w, h) {
    this.id = id; this.w = w; this.h = h;
    this.tiles = new Uint8Array(w * h);
    this.region = new Uint8Array(w * h);
    this.height = new Uint8Array(w * h);
    this.road = new Uint8Array(w * h);
    this.gate = new Uint8Array(w * h);
    this.island = new Uint8Array(w * h); // 0 sea, 1..4 island index
    this.solid = new Uint16Array(w * h); // dynamic occupancy count (trees, rocks, buildings)
    this.deck = new Uint8Array(w * h); // bridges / piers making water walkable
    this.occupied = new Uint8Array(w * h); // any building footprint (placement)
    this.interior = new Uint8Array(w * h); // prefab house interior cells (furniture allowed)
    this.isCave = false;
  }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  i(x, y) { return y * this.w + x; }
  tileAt(x, y) { return this.inb(x, y) ? this.tiles[y * this.w + x] : (this.isCave ? C.WALL : T.OCEAN_DEEP); }
}

export class TerrainSystem {
  constructor(content) {
    this.content = content;
    this.tdb = content.terrain; // sorted by code
    this.cdb = content.caveTiles;
    this.lowTide = false;
    this.openGates = new Set();
    this.overworld = this.buildOverworld();
    this.caves = {};
    for (const id of CAVES) this.caves[id] = this.buildCave(id);
    this.computeCoastDistance();
  }

  buildOverworld() {
    const atlas = this.content.db.WorldMap.atlas.sizeTiles; // [512,384]
    const g = new SceneGrid('OVERWORLD', atlas[0], atlas[1]);
    g.tiles.fill(T.OCEAN_DEEP);
    g.islandOrigins = {};
    ISLANDS.forEach((isl, idx) => {
      const m = this.content.maps[isl];
      const [ox, oy] = m.originAtlas;
      g.islandOrigins[isl] = { ox, oy, w: m.w, h: m.h, index: idx + 1 };
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const si = y * m.w + x, di = (oy + y) * g.w + (ox + x);
        g.tiles[di] = m.tiles[si];
        g.region[di] = m.region ? m.region[si] : 0;
        g.height[di] = m.height ? m.height[si] : 0;
        g.road[di] = m.road ? m.road[si] : 0;
        g.gate[di] = m.gate ? m.gate[si] : 0;
        g.island[di] = idx + 1;
      }
    });
    return g;
  }

  buildCave(id) {
    const m = this.content.maps[id];
    const g = new SceneGrid(id, m.w, m.h);
    g.tiles.set(m.tiles);
    g.isCave = true;
    return g;
  }

  grid(sceneId) { return sceneId && sceneId.startsWith('CAVE_') ? this.caves[sceneId] : this.overworld; }

  // ---- island/local coordinate helpers ----
  localToAtlas(islandId, lx, ly) { const o = this.overworld.islandOrigins[islandId]; return [o.ox + lx, o.oy + ly]; }
  atlasToLocal(ax, ay) {
    for (const [id, o] of Object.entries(this.overworld.islandOrigins)) {
      if (ax >= o.ox && ay >= o.oy && ax < o.ox + o.w && ay < o.oy + o.h) return { islandId: id, x: ax - o.ox, y: ay - o.oy };
    }
    return { islandId: null, x: ax, y: ay };
  }
  islandAt(ax, ay) { return this.atlasToLocal(ax, ay).islandId; }
  regionAt(sceneId, x, y) {
    const g = this.grid(sceneId);
    if (g.isCave) return 'REG_MOUNTAIN';
    if (!g.inb(x, y)) return null;
    const code = g.region[g.i(x, y)];
    return code ? this.content.regionByCode.get(code)?.id || null : null;
  }

  // ---- tile rules ----
  terrainInfo(code) { return this.tdb[code]; }
  isGateOpen(code) {
    const gate = this.content.gateByCode.get(code);
    if (!gate) return true;
    if (gate.unlockFlag === 'TIDE_LOW') return this.lowTide || this.openGates.has(gate.id);
    return this.openGates.has(gate.id);
  }

  /** Can a creature in `mode` stand on tile (x,y)? Modes: WALK, SWIM, RAFT, ANIMAL. */
  passable(g, x, y, mode = 'WALK') {
    if (!g.inb(x, y)) return false;
    const i = g.i(x, y);
    const code = g.tiles[i];
    if (g.isCave) {
      const ct = this.cdb[code];
      if (mode === 'WALK' || mode === 'ANIMAL') return ct.walkable && g.solid[i] === 0;
      if (mode === 'SWIM') return ct.walkable || ct.swimmable;
      return false;
    }
    const gc = g.gate[i];
    if (gc && !this.isGateOpen(gc)) {
      // closed gates only block shortcuts; tidal sandbar handled by tile rule
      if (mode === 'WALK' || mode === 'ANIMAL') return false;
    }
    const t = this.tdb[code];
    if (mode === 'RAFT') return t.raftNavigable && g.solid[i] === 0 && g.deck[i] === 0;
    if (g.deck[i] && (mode === 'WALK' || mode === 'ANIMAL')) return g.solid[i] === 0;
    if (mode === 'SWIM') return (t.swimPossible || t.footWalkable) && code !== T.CLIFF_WALL && g.solid[i] === 0;
    if (code === T.TIDAL_SANDBAR) return this.lowTide && g.solid[i] === 0;
    if (!t.footWalkable) return false;
    if (mode === 'ANIMAL' && t.isWater && code !== T.RIVER_FORD) return false;
    return g.solid[i] === 0;
  }

  /** Static (no dynamic solids) foot walkability used by placement & connectivity tests. */
  footWalkableStatic(g, x, y) {
    if (!g.inb(x, y)) return false;
    const code = g.tiles[g.i(x, y)];
    if (g.isCave) return this.cdb[code].walkable;
    if (code === T.TIDAL_SANDBAR) return this.lowTide;
    const gc = g.gate[g.i(x, y)];
    if (gc && !this.isGateOpen(gc)) return false;
    return !!this.tdb[code].footWalkable;
  }

  heightStep(g, x0, y0, x1, y1) {
    if (g.isCave) return 0;
    return Math.abs(g.height[g.i(x0, y0)] - g.height[g.i(x1, y1)]);
  }

  speedMul(g, x, y) {
    if (!g.inb(x, y)) return 1;
    const code = g.tiles[g.i(x, y)];
    if (g.isCave) return code === C.SHALLOW_POOL ? 0.7 : 1;
    const t = this.tdb[code];
    return t.moveSpeedMultiplierFoot || 1;
  }

  /** Swim mode needed for tile? (water that is not foot walkable) */
  needsSwim(g, x, y) {
    if (!g.inb(x, y)) return true;
    const code = g.tiles[g.i(x, y)];
    if (g.isCave) return !this.cdb[code].walkable && this.cdb[code].swimmable;
    if (code === T.TIDAL_SANDBAR) return !this.lowTide;
    if (g.deck[g.i(x, y)]) return false;
    const t = this.tdb[code];
    return !t.footWalkable && t.swimPossible;
  }

  isWaterTile(g, x, y) {
    const code = g.tileAt(x, y);
    if (g.isCave) return code === C.DEEP_POOL || code === C.SHALLOW_POOL;
    return !!this.tdb[code]?.isWater;
  }

  /** Distance (tiles, capped 32) from nearest land, used to limit swimming far into open sea. */
  computeCoastDistance() {
    const g = this.overworld;
    const d = new Uint8Array(g.w * g.h).fill(255);
    const q = new Int32Array(g.w * g.h);
    let qh = 0, qt = 0;
    for (let i = 0; i < g.tiles.length; i++) {
      const code = g.tiles[i];
      if (code !== T.OCEAN_DEEP && code !== T.OCEAN_SHALLOW && code !== T.SEA_REEF) { d[i] = 0; q[qt++] = i; }
    }
    while (qh < qt) {
      const i = q[qh++]; const x = i % g.w, y = (i / g.w) | 0; const nd = d[i] + 1;
      if (nd > 32) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
        const ni = ny * g.w + nx;
        if (d[ni] > nd) { d[ni] = nd; q[qt++] = ni; }
      }
    }
    g.coastDist = d;
  }

  addSolid(g, x, y, w = 1, h = 1, delta = 1) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (g.inb(xx, yy)) g.solid[g.i(xx, yy)] += delta;
  }
}
