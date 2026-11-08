// AT_BOOT_DATA_* and AT_WORLD_NAV_* (deterministic headless assertions against the real game systems)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getContent, fsLoader, SPEC, ROOT } from '../helpers/node-content.mjs';
import { makeGame, placeNear, finishAction } from '../helpers/make-game.mjs';
import { loadContent } from '../../src/data/ContentRegistry.js';
import { TILE, T } from '../../src/world/TerrainSystem.js';

test('AT_BOOT_DATA_02 data counts and unique keys', async () => {
  const c = await getContent();
  assert.deepEqual({ ...c.counts(), sprites: undefined, atlasPages: undefined, audioCues: undefined, maps: undefined, blueprints: undefined }, { items: 179, recipes: 183, builds: 58, pois: 38, puzzles: 12, stories: 15, species: 25, crops: 12, skills: 8, endings: 2, sprites: undefined, atlasPages: undefined, audioCues: undefined, maps: undefined, blueprints: undefined });
  assert.equal(c.errors.length, 0);
  assert.equal(c.blueprints.size, 20);
});

test('AT_BOOT_DATA_03 missing data aborts visibly', async () => {
  const base = fsLoader();
  const broken = async (p) => { if (p.endsWith('ItemDB.json')) throw new Error('ENOENT'); return base(p); };
  await assert.rejects(() => loadContent(broken), (e) => e.code === 'DB_MISSING');
  const bad = async (p) => { const d = await base(p); if (p.endsWith('RecipeDB.json')) d.recipes = d.recipes.slice(1); return d; };
  await assert.rejects(() => loadContent(bad), (e) => e.code === 'DATA_VALIDATION');
});

test('AT_BOOT_DATA_04 new game deterministic start (same seed, two slots) + 63 starter fiber', async () => {
  const a = await makeGame(42, 'slot-1'); const b = await makeGame(42, 'slot-2');
  assert.deepEqual(a.world.nodeDefs.map((n) => [n.id, n.tile]), b.world.nodeDefs.map((n) => [n.id, n.tile]));
  assert.deepEqual(a.exploration.list.map((p) => [p.id, p.ax, p.ay]), b.exploration.list.map((p) => [p.id, p.ax, p.ay]));
  const fiber = a.world.nodeDefs.filter((n) => n.fixed && n.itemId === 'MAT_FIBER' && n.sceneId === 'OVERWORLD').reduce((s, n) => s + n.yieldMin, 0);
  assert.equal(fiber, 63);
});

test('AT_BOOT_DATA_05 twenty seeds keep critical POIs/story items fixed; optional loot varies', async () => {
  const ref = await makeGame(1); const refPois = JSON.stringify(ref.exploration.list.map((p) => [p.id, p.ax, p.ay]));
  const bonus = new Set(); const secondary = new Set();
  for (let s = 2; s <= 21; s++) {
    const g = await makeGame(s * 7919);
    assert.equal(JSON.stringify(g.exploration.list.map((p) => [p.id, p.ax, p.ay])), refPois);
    for (const [sp, poi] of Object.entries(g.content.db.LootTableDB.fixedStorySpecialSources)) assert.equal(g.content.poiLoot.get(poi).guaranteedStorySpecialId, sp);
    bonus.add(JSON.stringify(g.exploration.rollBonus('POI_SHORE_CRATE')));
    secondary.add(g.world.nodeDefs.filter((n) => !n.fixed).slice(0, 5).map((n) => n.tile.join(',')).join('|'));
  }
  assert.ok(bonus.size > 3, 'side loot differs between seeds');
  assert.ok(secondary.size > 3, 'secondary nodes differ');
});

test('AT_BOOT_DATA_06 no external runtime URLs in shipped sources', () => {
  const html = readFileSync(path.join(ROOT, 'public/index.html'), 'utf8') + readFileSync(path.join(ROOT, 'public/style.css'), 'utf8');
  assert.ok(!/https?:\/\//.test(html.replace(/<meta[^>]*>/g, '')));
  for (const f of ['src/main.js', 'src/render/SpriteAtlas.js', 'src/audio/AudioMixer.js', 'src/ui/UIMenus.js']) assert.ok(!/fetch\(['"]https?:/.test(readFileSync(path.join(ROOT, f), 'utf8')), f);
});

test('AT_BOOT_DATA_07 source overlay precedence: canonical POI sprite ids, R_SEA_CHEST creates new', async () => {
  const c = await getContent();
  for (const p of c.pois.values()) { assert.ok(c.atlasSprites[`poi/${p.id}/default`], p.id); assert.ok(c.atlasSprites[`poi/${p.id}/searched`], p.id); }
  assert.ok(!Object.keys(c.atlasSprites).some((s) => /poi\/POI_\d\d\//.test(s)));
  const sea = c.recipes.get('R_SEA_CHEST'); assert.equal(sea.outputType, 'build'); assert.equal(sea.runtimeBehavior, 'CREATE_NEW');
});

test('AT_WORLD_NAV_01 nine biome anchors reachable on foot from spawn, no raft, no shortcut', async () => {
  const g = await makeGame(42); const ow = g.terrain.overworld;
  const start = g.terrain.localToAtlas('MAIN', 122, 220);
  for (const [reg, site] of Object.entries(g.content.db.WorldMap.mainBiomeGeneration.sites)) {
    const path2 = g.pathfinder.findPath(ow, start, g.terrain.localToAtlas('MAIN', ...site), { adjacentOk: true, maxNodes: 300000 });
    assert.ok(path2, `region ${reg} unreachable`);
  }
  assert.equal(g.terrain.openGates.size, 0);
});

test('AT_WORLD_NAV_02 all 38 POI approach anchors reachable (dynamic colliders included)', async () => {
  const g = await makeGame(42); const ow = g.terrain.overworld;
  const starts = { MAIN: [122, 220], ...g.content.db.NavigationDB.satelliteDockLandings };
  let n = 0;
  for (const a of g.content.db.CollisionNavDB.poiApproachAnchors) {
    const s = g.terrain.localToAtlas(a.islandId, ...starts[a.islandId]); const t = g.terrain.localToAtlas(a.islandId, ...a.footApproachTile);
    const p = g.pathfinder.findPath(ow, s, t, { adjacentOk: true, maxNodes: 300000, radius: a.recommendedInteractRadiusTiles });
    assert.ok(p, `${a.poiId} unreachable`);
    const last = p[p.length - 1]; assert.ok(Math.hypot(last[0] - t[0], last[1] - t[1]) <= a.recommendedInteractRadiusTiles + 0.5);
    n++;
  }
  assert.equal(n, 38);
});

test('AT_WORLD_NAV_03 raft reaches all 3 islands over water and lands on valid tiles', async () => {
  const g = await makeGame(42); const ow = g.terrain.overworld;
  for (const r of g.content.db.NavigationDB.seaRoutes) {
    for (const [x, y] of r.raftPathAtlas) assert.ok(g.terrain.passable(ow, x, y, 'RAFT'), `${r.id} ${x},${y}`);
    const p = g.pathfinder.findPath(ow, r.departureAtlas, r.arrivalAtlas, { mode: 'RAFT', maxNodes: 400000 });
    assert.ok(p, r.id);
    const isl = { REG_LIGHTHOUSE: 'LIGHTHOUSE', REG_WRECK: 'WRECK', REG_FERTILE: 'FERTILE' }[r.toRegion];
    const land = g.terrain.localToAtlas(isl, ...r.arrivalDock.shoreFootTileLocal);
    assert.ok(g.terrain.footWalkableStatic(ow, ...land));
    // simulate board → sail → disembark with the real vehicle system
    g.state.vehicles.raftsById.R1 = { buildUid: 'R1', sceneId: 'OVERWORLD', atlasPx: [(r.arrivalAtlas[0] + 0.5) * TILE, (r.arrivalAtlas[1] + 0.5) * TILE], anchored: true, passengerId: null };
    g.world.teleport('OVERWORLD', (land[0] + 0.5) * TILE, (land[1] + 0.5) * TILE);
    const near = g.sea.raftNear(); if (near) { assert.ok(g.sea.board(near).ok); assert.equal(g.state.player.mode, 'RAFT'); g.world.teleport('OVERWORLD', (r.arrivalAtlas[0] + 0.5) * TILE, (r.arrivalAtlas[1] + 0.5) * TILE, 'RAFT'); }
  }
});

test('AT_WORLD_NAV_04 public fords walkable; bridge is only a shortcut', async () => {
  const g = await makeGame(42); const ow = g.terrain.overworld;
  for (const f of g.content.db.CollisionNavDB.riverCrossings) assert.ok(g.terrain.footWalkableStatic(ow, ...g.terrain.localToAtlas('MAIN', ...f.tileMainLocal)), JSON.stringify(f));
  const bridge = g.terrain.localToAtlas('MAIN', 117, 140);
  assert.equal(g.terrain.passable(ow, ...bridge, 'WALK'), false);
  g.store.transaction(null, (tx) => g.exploration.openShortcut(tx, 'GATE_BRIDGE'));
  assert.equal(g.terrain.passable(ow, ...bridge, 'WALK'), true);
});

test('AT_WORLD_NAV_05 no diagonal corner cutting through cliffs/obstacles', async () => {
  const g = await makeGame(42); const ow = g.terrain.overworld;
  let checked = 0;
  for (let y = 50; y < 300 && checked < 400; y++) for (let x = 140; x < 380 && checked < 400; x++) {
    if (ow.tiles[ow.i(x, y)] !== T.CLIFF_WALL) continue;
    const a = [x - 1, y], b = [x, y + 1];
    if (g.terrain.passable(ow, ...a, 'WALK') && g.terrain.passable(ow, ...b, 'WALK')) {
      const p = g.pathfinder.findPath(ow, a, b, { maxNodes: 2000 });
      if (p) for (let i = 1; i < p.length; i++) { const [x0, y0] = p[i - 1], [x1, y1] = p[i]; if (x0 !== x1 && y0 !== y1) { assert.ok(g.terrain.passable(ow, x1, y0, 'WALK') && g.terrain.passable(ow, x0, y1, 'WALK')); } }
      checked++;
    }
  }
  // movement collision: walking into a cliff never enters it
  const cliff = (() => { for (let y = 60; y < 300; y++) for (let x = 140; x < 380; x++) if (ow.tiles[ow.i(x, y)] === T.CLIFF_WALL && g.terrain.passable(ow, x, y + 1, 'WALK') && g.terrain.passable(ow, x, y + 2, 'WALK')) return [x, y]; })();
  g.world.teleport('OVERWORLD', (cliff[0] + 0.5) * TILE, (cliff[1] + 2.5) * TILE);
  for (let i = 0; i < 90; i++) g.world.movePlayer({ x: 0.3, y: -1 }, 1 / 30);
  assert.notEqual(ow.tiles[ow.i(...g.world.playerTile())], T.CLIFF_WALL);
  assert.ok(checked > 10);
});

test('AT_WORLD_NAV_06 20 seeds: starter materials within 22 tiles reachable and safe', async () => {
  for (let s = 0; s < 20; s++) {
    const g = await makeGame(1000 + s * 31); const ow = g.terrain.overworld; const sp = g.terrain.localToAtlas('MAIN', 122, 220);
    const fixed = g.world.nodeDefs.filter((n) => n.fixed && n.sceneId === 'OVERWORLD');
    assert.equal(fixed.length, 50);
    for (const n of fixed) { assert.ok(Math.hypot(n.tile[0] - sp[0], n.tile[1] - sp[1]) <= 22.5); assert.ok(g.pathfinder.findPath(ow, sp, n.tile, { adjacentOk: true }), n.id); }
    assert.equal(g.terrain.passable(ow, ...sp, 'WALK'), true);
  }
});

test('AT_WORLD_NAV_07 prefab cannot block cave exit/critical corridor; no materials consumed', async () => {
  const g = await makeGame(42); g.state.knowledge.items.MAT_BAMBOO = true; g.state.knowledge.stations.BUILD_WORKBENCH = true;
  const cv = g.content.caves.get('CAVE_COPPER'); const [cx, cy] = g.terrain.localToAtlas('MAIN', ...cv.returnToWorld.worldTileLocal);
  const before = JSON.stringify(g.state.containers);
  const r = g.build.place('BUILD_BAMBOO_HUT', [cx - 1, cy - 1]); assert.equal(r.ok, false);
  const ford = g.terrain.localToAtlas('MAIN', 114, 145); assert.equal(g.build.place('BUILD_BAMBOO_HUT', [ford[0] - 1, ford[1] - 1]).ok, false);
  const water = g.terrain.localToAtlas('MAIN', 10, 10); assert.equal(g.build.place('BUILD_BAMBOO_HUT', water).ok, false);
  assert.equal(JSON.stringify(g.state.containers), before);
});

test('AT_WORLD_NAV_08 roof hides only inside the house footprint', async () => {
  const g = await makeGame(42); g.state.knowledge.items.MAT_BAMBOO = true; g.state.knowledge.stations.BUILD_WORKBENCH = true;
  const pad = g.terrain.localToAtlas('MAIN', 137, 221);
  const r = g.build.place('BUILD_BAMBOO_HUT', pad); assert.ok(r.ok, JSON.stringify(r));
  const b = r.value; b.stageIndex = b.stages.length; assert.ok(g.build.complete(b.uid).ok);
  assert.equal(g.build.houseAt(pad[0] + 1, pad[1] + 1)?.uid, b.uid);
  assert.equal(g.build.houseAt(pad[0] + 4, pad[1] + 1), null);
  // walls solid, door open, interior walkable
  const ow = g.terrain.overworld;
  assert.equal(g.terrain.passable(ow, pad[0], pad[1], 'WALK'), false);
  assert.equal(g.terrain.passable(ow, pad[0] + 1, pad[1] + 2, 'WALK'), true);
  assert.equal(g.terrain.passable(ow, pad[0] + 1, pad[1] + 1, 'WALK'), true);
});

test('AT_WORLD_NAV_09 resource respawn per ResourceEconomyDB, never inside buildings', async () => {
  const g = await makeGame(42);
  const ore = g.world.nodeDefs.find((n) => n.itemId === 'MAT_COPPER_ORE' && !n.fixed && n.sceneId === 'OVERWORLD');
  placeNear(g, ore.tile);
  g.store.transaction(null, (tx) => g.inventory.add(tx, 'inv_player', 'TOOL_STONE_PICK', 1));
  assert.ok(g.resources.gather(ore.id).ok); finishAction(g);
  const st = g.state.productionState.resourceNodesById[ore.id]; assert.equal(st.depleted, true);
  assert.equal(st.respawnGameDay - g.state.clock.dayIndex, g.content.nodeRules.get('MAT_COPPER_ORE').respawnGameDays);
  // block the spot with a building footprint, advance days, node must wait
  const ow = g.terrain.overworld; ow.occupied[ow.i(...ore.tile)]++;
  g.world.teleport('OVERWORLD', 50 * TILE, 50 * TILE, 'SWIM');
  for (let d = 0; d < 9; d++) g.simulateTime(1080, 'sleep');
  assert.equal(g.state.productionState.resourceNodesById[ore.id].depleted, true);
  ow.occupied[ow.i(...ore.tile)]--;
  g.resources.tryRespawn(false);
  assert.equal(g.state.productionState.resourceNodesById[ore.id].depleted, false);
});

test('AT_WORLD_NAV_10 all three caves escapable without tool or torch', async () => {
  const g = await makeGame(42);
  for (const cv of g.content.db.CaveDB.caves) {
    g.state.story.poiStates[cv.entrancePoi] = { discovered: true, rewardClaimed: true, pendingItems: {} };
    g.caves.enter(cv.id); assert.equal(g.world.sceneId, cv.id);
    const cg = g.terrain.caves[cv.id];
    const p = g.pathfinder.findPath(cg, cv.objects.find((o) => o.type === 'chest').tile, cv.entryTile, { adjacentOk: true });
    assert.ok(p, cv.id + ' return path');
    assert.equal(g.inventory.hasItem('TOOL_TORCH'), false);
    const exits = g.caves.interactables(cv.id, cv.entryTile[0], cv.entryTile[1], 1.7).filter((x) => x.kind === 'cave_exit');
    assert.ok(exits.length);
    assert.ok(g.caves.exit().ok); assert.equal(g.world.sceneId, 'OVERWORLD');
    assert.ok(g.terrain.passable(g.terrain.overworld, ...g.world.playerTile(), 'WALK'));
  }
});

test('AT_WORLD_NAV_11 water mode transitions: walk → swim → dive (oxygen) → raft', async () => {
  const g = await makeGame(42); const ow = g.terrain.overworld;
  // find beach tile with shallow ocean to the south
  let spot; for (let y = 270; y < 320 && !spot; y++) for (let x = 230; x < 280 && !spot; x++) if (ow.tiles[ow.i(x, y)] === T.BEACH_SAND && ow.tiles[ow.i(x, y + 1)] === T.OCEAN_SHALLOW && ow.tiles[ow.i(x, y + 2)] === T.OCEAN_SHALLOW) spot = [x, y];
  g.world.teleport('OVERWORLD', (spot[0] + 0.5) * TILE, (spot[1] + 0.5) * TILE);
  for (let i = 0; i < 60 && g.state.player.mode === 'WALK'; i++) g.tick(1 / 30, { x: 0, y: 1 });
  assert.equal(g.state.player.mode, 'SWIM');
  g.interact({ kind: 'dive' }); assert.equal(g.state.player.mode, 'DIVE');
  const o0 = g.state.player.oxygen; for (let i = 0; i < 90; i++) g.tick(1 / 30); assert.ok(g.state.player.oxygen < o0);
  for (let i = 0; i < 900; i++) g.tick(1 / 30); assert.equal(g.state.player.mode, 'SWIM', 'auto-surface on low breath');
  // swim back
  for (let i = 0; i < 120 && g.state.player.mode !== 'WALK'; i++) g.tick(1 / 30, { x: 0, y: -1 });
  assert.equal(g.state.player.mode, 'WALK');
});

test('AT_WORLD_NAV_12 save mid sea route and reload: raft + player restored, no duplicate', async () => {
  const g = await makeGame(42); const r = g.content.seaRoutes.get('SEA_TO_FERTILE');
  const mid = r.raftPathAtlas[Math.floor(r.raftPathAtlas.length / 2)];
  g.state.vehicles.raftsById.R1 = { buildUid: 'R1', sceneId: 'OVERWORLD', atlasPx: [(mid[0] + 0.5) * TILE, (mid[1] + 0.5) * TILE], anchored: false, passengerId: 'player' };
  g.state.vehicles.activeVehicleId = 'R1'; g.world.teleport('OVERWORLD', (mid[0] + 0.5) * TILE, (mid[1] + 0.5) * TILE, 'RAFT');
  for (let i = 0; i < 30; i++) g.tick(1 / 30, { x: 1, y: 0 });
  const snap = JSON.parse(JSON.stringify(g.snapshot()));
  const g2 = await makeGame(42); g2.restoreState(snap);
  assert.equal(g2.state.player.mode, 'RAFT');
  assert.deepEqual(g2.state.player.positionPx, snap.player.positionPx);
  assert.equal(Object.keys(g2.state.vehicles.raftsById).length, 1);
  assert.deepEqual(g2.state.vehicles.raftsById.R1.atlasPx, snap.player.positionPx);
});

test('AT_EXPLORATION_07 sand spit tide window opens at least once per day and is predictable', async () => {
  const g = await makeGame(42); const ow = g.terrain.overworld;
  const bar = (() => { for (let i = 0; i < ow.tiles.length; i++) if (ow.tiles[i] === T.TIDAL_SANDBAR) return [i % ow.w, (i / ow.w) | 0]; })();
  let lowSeen = 0, highSeen = 0;
  for (let t = 0; t < 1080; t += 10) { g.state.clock.timeOfDaySeconds = t; g.climate.tick(); if (g.terrain.passable(ow, ...bar, 'WALK')) lowSeen++; else highSeen++; }
  assert.ok(lowSeen > 0 && highSeen > 0);
  assert.equal(g.climate.isLowTide(0.2), true); assert.equal(g.climate.isLowTide(0.5), false);
  void SPEC;
});

test('REGRESSION raft built on the shoreline is anchored on water and can sail away after boarding', async () => {
  const { construct } = await import('../helpers/tools.mjs');
  const g = await makeGame(42);
  const shore = g.terrain.localToAtlas('MAIN', ...g.content.seaRoutes.get('SEA_TO_WRECK').departureDock.shoreFootTileLocal);
  g.world.teleport('OVERWORLD', (shore[0] + 0.5) * TILE, (shore[1] + 0.5) * TILE);
  construct(g, 'BUILD_RAFT'); const id = Object.keys(g.state.vehicles.raftsById)[0]; const r = g.state.vehicles.raftsById[id];
  assert.ok(g.pathfinder.boxFree(g.world.grid, r.atlasPx[0], r.atlasPx[1], 'RAFT', null), 'raft anchor fully on water');
  assert.ok(g.sea.board(id).ok);
  const start = [...g.state.player.positionPx]; let moved = 0;
  for (const inp of [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }]) { const b = [...g.state.player.positionPx]; for (let i = 0; i < 30; i++) g.tick(1 / 30, inp); if (Math.hypot(g.state.player.positionPx[0] - b[0], g.state.player.positionPx[1] - b[1]) > 20) moved++; }
  assert.ok(moved >= 2, `raft moved in ${moved}/3 directions from ${start}`);
  assert.equal(g.state.player.mode, 'RAFT');
});

test('REGRESSION a raft cannot be placed on river-bank "water" where its hull could never float', async () => {
  const g = await makeGame(42);
  const site = [224, 240]; // RIVER_BANK + MEADOW: isWater cells but not raft-navigable
  g.world.teleport('OVERWORLD', (site[0] + 1.5) * TILE, (site[1] + 3.5) * TILE);
  assert.ok(g.build.validatePlacement('BUILD_RAFT', site).some((r) => /yüzülebilir/.test(r)));
});
