// Loads the 31 canonical DBs + 7 RLE maps of GDD v2.0 at runtime, validates counts/ids and builds indices.
// Data is NEVER re-authored here; ids come from the packaged copy of Kayip_Ufuk_GDD_v2_0.
import { decodeRLE } from '../core/util.js';

export class ContentError extends Error {
  constructor(code, detail) { super(`${code}: ${detail}`); this.code = code; this.detail = detail; }
}

export const MAP_FILES = {
  MAIN: 'Maps/TerrainGrid_MAIN_v1.2.json',
  LIGHTHOUSE: 'Maps/TerrainGrid_LIGHTHOUSE_v1.2.json',
  WRECK: 'Maps/TerrainGrid_WRECK_v1.2.json',
  FERTILE: 'Maps/TerrainGrid_FERTILE_v1.2.json',
  CAVE_COPPER: 'Maps/CaveGrid_CAVE_COPPER_v1.4.json',
  CAVE_BATS: 'Maps/CaveGrid_CAVE_BATS_v1.4.json',
  CAVE_POND: 'Maps/CaveGrid_CAVE_POND_v1.4.json',
};

export const EXPECTED = {
  items: 179, recipes: 183, builds: 58, pois: 38, puzzles: 12, stories: 15, blueprints: 20,
  species: 25, fish: 10, crops: 12, skills: 8, endings: 2, regions: 12, maps: 7,
  recipeTypes: { item: 114, upgrade: 9, build: 60 },
};

export async function loadContent(loader, opts = {}) {
  const index = await loader('ContentIndex_v2.0.json');
  const truth = await loader('ProductionTruth_v2.0.json');
  const dbNames = Object.keys(index.databaseFiles);
  if (dbNames.length !== 31) throw new ContentError('DB_COUNT', `ContentIndex lists ${dbNames.length} DBs, expected 31`);
  const db = {};
  await Promise.all(dbNames.map(async (name) => {
    const target = index.databaseFiles[name].target;
    try { db[name] = await loader(target); } catch (e) { throw new ContentError('DB_MISSING', `${target} (${e.message || e})`); }
    if (!db[name] || typeof db[name] !== 'object') throw new ContentError('DB_INVALID', target);
  }));
  const maps = {};
  await Promise.all(Object.entries(MAP_FILES).map(async ([id, path]) => {
    try { maps[id] = await loader(path); } catch (e) { throw new ContentError('MAP_MISSING', `${path} (${e.message || e})`); }
  }));
  const art = {};
  for (const [k, p] of [['atlas', 'Art/AtlasLayout.json'], ['audio', 'Art/AudioManifest.json'], ['rig', 'Art/AvatarRig.json']]) {
    try { art[k] = await loader(p); } catch (e) { throw new ContentError('ART_MANIFEST_MISSING', `${p} (${e.message || e})`); }
  }
  const reg = new ContentRegistry(db, maps, art, truth, opts);
  return reg;
}

export class ContentRegistry {
  constructor(db, maps, art, truth, opts = {}) {
    this.db = db; this.rawMaps = maps; this.art = art; this.truth = truth;
    this.errors = [];
    this.buildIndices();
    this.decodeMaps();
    if (!opts.skipValidation) this.validate();
  }

  idx(list, key = 'id') {
    const m = new Map();
    for (const x of list) {
      if (m.has(x[key])) this.errors.push(`duplicate id ${x[key]}`);
      m.set(x[key], x);
    }
    return m;
  }

  buildIndices() {
    const d = this.db;
    this.items = this.idx(d.ItemDB.items);
    this.recipes = this.idx(d.RecipeDB.recipes);
    this.builds = this.idx(d.BuildDB.buildings);
    this.pois = this.idx(d.POIDB.pois);
    this.puzzles = this.idx(d.PuzzleDB.puzzles);
    this.stories = this.idx(d.StoryDB.records);
    this.blueprints = new Map(Object.entries(d.RecipeDB.blueprints));
    this.blueprintSourcePoi = new Map(Object.entries(d.LootTableDB.fixedBlueprintSources));
    this.landAnimals = this.idx(d.AnimalDB.landAnimals);
    this.marineAnimals = this.idx(d.AnimalDB.marineAnimals);
    this.fish = this.idx(d.FishDB.fish);
    this.species = new Map([...this.landAnimals, ...this.marineAnimals, ...this.fish]);
    this.crops = this.idx(d.CropDB.crops);
    this.cropBySeed = new Map(d.CropDB.crops.map((c) => [c.seedItemId, c]));
    this.skills = this.idx(d.SkillDB.skills);
    this.escapes = this.idx(d.EscapeDB.routes);
    this.regions = this.idx(d.RegionDB.regions);
    this.regionByCode = new Map(d.RegionDB.regions.map((r) => [r.mapZoneOrder, r]));
    this.caves = this.idx(d.CaveDB.caves);
    this.caveByPoi = new Map(d.CaveDB.caves.map((c) => [c.entrancePoi, c]));
    this.terrain = d.TerrainDB.tiles.slice().sort((a, b) => a.tileCode - b.tileCode);
    this.terrainById = this.idx(d.TerrainDB.tiles);
    this.caveTiles = d.CaveDB.tileCatalog.slice().sort((a, b) => a.code - b.code);
    this.lootPools = this.idx(d.LootTableDB.pools);
    this.poiLoot = this.idx(d.LootTableDB.poiLoot, 'poiId');
    this.traps = this.idx(d.TrapDB.traps, 'buildId');
    this.durability = this.idx(d.DurabilityDB.tools, 'itemId');
    this.nodeRules = this.idx(d.ResourceEconomyDB.itemNodeRules, 'itemId');
    this.weatherStates = d.WeatherDB.states;
    this.collectors = this.idx(d.WaterEconomyDB.collectors, 'buildId');
    this.seaRoutes = this.idx(d.NavigationDB.seaRoutes);
    this.fishZones = this.idx(d.LootSpawnDB.fishZones);
    this.audioCues = this.idx(this.art.audio.catalog, 'soundId');
    this.atlasSprites = this.art.atlas.sprites;
    this.atlasPages = this.idx(this.art.atlas.pages, 'pageId');
    this.recipesByOutput = new Map();
    this.recipesByStation = new Map();
    for (const r of d.RecipeDB.recipes) {
      if (!this.recipesByOutput.has(r.outputId)) this.recipesByOutput.set(r.outputId, []);
      this.recipesByOutput.get(r.outputId).push(r);
      if (!this.recipesByStation.has(r.station)) this.recipesByStation.set(r.station, []);
      this.recipesByStation.get(r.station).push(r);
    }
    // upgrade recipes keyed by target build
    this.upgradesByTarget = new Map();
    for (const r of d.RecipeDB.recipes) {
      if (r.outputType === 'upgrade') {
        const t = r.targetBuildId || r.upgradeBuildId;
        if (!this.upgradesByTarget.has(t)) this.upgradesByTarget.set(t, []);
        this.upgradesByTarget.get(t).push(r);
      }
    }
    this.gateByCode = new Map(d.CollisionNavDB.gates.map((g, i) => [i + 1, g]));
  }

  decodeMaps() {
    this.maps = {};
    for (const [id, m] of Object.entries(this.rawMaps)) {
      const [w, h] = m.sizeTiles;
      const o = { id, w, h, originAtlas: m.originAtlas || null, tiles: decodeRLE(m.tileRowsRLE, w) };
      if (m.regionRowsRLE) o.region = decodeRLE(m.regionRowsRLE, w);
      if (m.heightRowsRLE) o.height = decodeRLE(m.heightRowsRLE, w);
      if (m.roadRowsRLE) o.road = decodeRLE(m.roadRowsRLE, w);
      if (m.gateRowsRLE) o.gate = decodeRLE(m.gateRowsRLE, w);
      this.maps[id] = o;
    }
  }

  validate() {
    const e = this.errors;
    const c = (label, actual, expected) => { if (actual !== expected) e.push(`${label}: ${actual} != ${expected}`); };
    c('items', this.items.size, EXPECTED.items);
    c('recipes', this.recipes.size, EXPECTED.recipes);
    c('builds', this.builds.size, EXPECTED.builds);
    c('pois', this.pois.size, EXPECTED.pois);
    c('puzzles', this.puzzles.size, EXPECTED.puzzles);
    c('stories', this.stories.size, EXPECTED.stories);
    c('blueprints', this.blueprints.size, EXPECTED.blueprints);
    c('species', this.species.size, EXPECTED.species);
    c('fish', this.fish.size, EXPECTED.fish);
    c('crops', this.crops.size, EXPECTED.crops);
    c('skills', this.skills.size, EXPECTED.skills);
    c('endings', this.escapes.size, EXPECTED.endings);
    c('regions', this.regions.size, EXPECTED.regions);
    c('maps', Object.keys(this.maps).length, EXPECTED.maps);
    const types = { item: 0, upgrade: 0, build: 0 };
    for (const r of this.recipes.values()) types[r.outputType]++;
    for (const k of Object.keys(types)) c('recipeType ' + k, types[k], EXPECTED.recipeTypes[k]);
    // cross references
    for (const r of this.recipes.values()) {
      for (const id of Object.keys(r.inputs)) if (!this.items.has(id)) e.push(`recipe ${r.id} input ${id} unknown`);
      if (r.outputType === 'item' && !this.items.has(r.outputId)) e.push(`recipe ${r.id} output ${r.outputId} unknown`);
      if (r.outputType !== 'item' && !this.builds.has(r.outputId)) e.push(`recipe ${r.id} build ${r.outputId} unknown`);
      if (r.station !== 'HAND' && !this.builds.has(r.station)) e.push(`recipe ${r.id} station ${r.station} unknown`);
    }
    for (const b of this.builds.values()) if (!this.recipes.has(b.recipeId)) e.push(`build ${b.id} recipe ${b.recipeId}`);
    for (const p of this.pois.values()) {
      if (p.puzzleId && !this.puzzles.has(p.puzzleId)) e.push(`poi ${p.id} puzzle`);
      if (!this.regions.has(p.regionId)) e.push(`poi ${p.id} region`);
      if (!this.poiLoot.has(p.id)) e.push(`poi ${p.id} loot`);
    }
    for (const pool of this.lootPools.values()) for (const en of pool.entries) if (!this.items.has(en.itemId)) e.push(`pool ${pool.id} ${en.itemId}`);
    // atlas: every planned sprite has a page
    for (const [sid, s] of Object.entries(this.atlasSprites)) if (!this.atlasPages.has(s.pageId)) e.push(`sprite ${sid} page ${s.pageId}`);
    if (this.art.atlas.pages.length !== 24) e.push('atlas pages != 24');
    if (this.art.audio.catalog.length !== 63) e.push('audio cues != 63');
    if (e.length) throw new ContentError('DATA_VALIDATION', e.slice(0, 12).join('; '));
  }

  counts() {
    return {
      items: this.items.size, recipes: this.recipes.size, builds: this.builds.size, pois: this.pois.size,
      puzzles: this.puzzles.size, stories: this.stories.size, species: this.species.size, crops: this.crops.size,
      skills: this.skills.size, endings: this.escapes.size, blueprints: this.blueprints.size, maps: Object.keys(this.maps).length,
      sprites: Object.keys(this.atlasSprites).length, atlasPages: this.art.atlas.pages.length, audioCues: this.art.audio.catalog.length,
    };
  }

  item(id) { const it = this.items.get(id); if (!it) throw new ContentError('UNKNOWN_ITEM', id); return it; }
  itemName(id) { return this.items.get(id)?.name || this.builds.get(id)?.name || id; }
  stackMax(id) { return this.items.get(id)?.stackMax ?? 1; }
  isUniqueItem(id) { const it = this.items.get(id); return !!(it && (it.stackMax === 1)); }
}
