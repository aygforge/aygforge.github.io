// AT_EXPLORATION_01..06, AT_ENDINGS_01..09, plus headless parts of AT_PERSIST (cave/puzzle/corpse/migration/ending-during-save)
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from '../helpers/make-game.mjs';
import { give, bigBag, count, construct, findSpot, solvePuzzle, placeBoat } from '../helpers/tools.mjs';
import { TILE } from '../../src/world/TerrainSystem.js';
import { migrate, validateState } from '../../src/persistence/SaveMigration.js';

function atPoi(g, poiId, mode = 'WALK') { const p = g.exploration.byId.get(poiId); g.world.teleport('OVERWORLD', (p.ax + 0.5) * TILE, (p.ay + 0.5) * TILE, mode); }
function equipAll(g) { bigBag(g); for (const t of ['TOOL_TORCH', 'TOOL_CLIMB_KIT', 'TOOL_DIVING_KIT', 'TOOL_DIVING_MASK', 'TOOL_CROWBAR', 'TOOL_STONE_AXE']) give(g, t, 1); give(g, 'CMP_PLANK', 8); give(g, 'CMP_ROPE', 6); }
function openPoi(g, poiId) {
  const d = g.content.pois.get(poiId); atPoi(g, poiId, ['SHALLOW_DIVE', 'DIVE', 'OPEN_UNDERWATER', 'DIVE_AND_OPEN'].includes(d.interactionType) ? 'SWIM' : 'WALK');
  g.state.clock.timeOfDaySeconds = 0.2 * 1080; g.climate.tick();
  const r = g.exploration.interact(poiId);
  if (d.puzzleId && !g.state.story.puzzlesById[d.puzzleId]?.solved && d.puzzleId !== 'PZ_LIGHTHOUSE_TUNE') solvePuzzle(g, d.puzzleId);
  g.state.player.mode = 'WALK';
  return r;
}

test('AT_EXPLORATION_01 all 38 POIs have canonical visual + reward identity', async () => {
  const g = await makeGame(31); const c = g.content;
  for (const p of c.pois.values()) {
    for (const st of ['default', 'searched']) assert.ok(c.atlasSprites[`poi/${p.id}/${st}`], p.id + st);
    const loot = c.poiLoot.get(p.id); assert.equal(loot.poiId, p.id);
    assert.equal(loot.guaranteedBlueprintId, p.reward.blueprintId); assert.equal(loot.guaranteedStorySpecialId, p.reward.specialItemId);
    assert.ok(g.exploration.byId.get(p.id));
  }
  assert.equal(g.exploration.list.length, 38);
});

test('AT_EXPLORATION_02 guaranteed loot always obtainable; full inventory defers safely', async () => {
  for (const seed of [3, 99]) {
    const g = await makeGame(seed);
    while (g.inventory.cont('inv_player').slots.includes(null)) give(g, 'TOOL_TORCH', 1);
    const r = openPoi(g, 'POI_FISHER_HUT'); assert.ok(r.ok);
    assert.ok(g.state.story.specialItemsGranted.includes('SPC_CHART_COAST'));
    assert.equal(g.inventory.count(['inv_special'], 'SPC_CHART_COAST'), 1);
    const st = g.state.story.poiStates.POI_FISHER_HUT; assert.ok(Object.keys(st.pendingItems).length > 0, 'items kept at POI');
    const slots = g.inventory.cont('inv_player').slots; for (let i = 0; i < 8; i++) { const u = slots[i]; g.store.transaction(null, (tx) => g.inventory.removeInstance(tx, u)); delete g.state.containers.items[u]; }
    g.exploration.interact('POI_FISHER_HUT');
    assert.deepEqual(st.pendingItems, {}); assert.equal(count(g, 'MAT_BAMBOO') >= 4, true);
  }
});

test('AT_EXPLORATION_03 one-time reward ledger across reopen + reload', async () => {
  const g = await makeGame(33); equipAll(g);
  openPoi(g, 'POI_RESEARCH_SQUARE');
  const items = JSON.stringify(g.state.containers.items);
  for (let i = 0; i < 3; i++) { const snap = JSON.parse(JSON.stringify(g.snapshot())); g.restoreState(snap); g.exploration.interact('POI_RESEARCH_SQUARE'); }
  assert.equal(JSON.stringify(g.state.containers.items).length, items.length);
  assert.equal(g.state.story.specialItemsGranted.filter((x) => x === 'SPC_GEN_CORE').length, 1);
  assert.equal(g.exploration.grantReward('POI_RESEARCH_SQUARE').ok, false);
});

test('AT_EXPLORATION_04 all 12 puzzles playable, retryable (abandon), effects persisted', async () => {
  const g = await makeGame(34); equipAll(g);
  for (const pz of g.content.puzzles.values()) {
    openPoi(g, pz.poiId);
    if (pz.id === 'PZ_LIGHTHOUSE_TUNE') { assert.ok(g.puzzles.canStart(pz.id).length > 0, 'needs station'); continue; }
    if (!g.state.story.puzzlesById[pz.id]?.solved) solvePuzzle(g, pz.id);
    assert.ok(g.state.story.puzzlesById[pz.id].solved, pz.id);
    assert.equal(g.state.world.worldFlags[pz.completionFlag], true, pz.completionFlag);
  }
  // lighthouse tune after the station is built and powered
  buildRadio(g, 'solar'); assert.ok(solvePuzzle(g, 'PZ_LIGHTHOUSE_TUNE'));
  const snap = JSON.parse(JSON.stringify(g.snapshot())); const g2 = await makeGame(34); g2.restoreState(snap);
  assert.equal(Object.values(g2.state.story.puzzlesById).filter((p) => p.solved).length, 12);
  assert.ok(g2.terrain.openGates.has('GATE_RELAY'), 'relay shortcut persisted');
});

test('AT_EXPLORATION_05 wrong puzzle inputs never consume items or soft-lock', async () => {
  const g = await makeGame(35); equipAll(g);
  atPoi(g, 'POI_WATER_STATION'); g.exploration.interact('POI_WATER_STATION');
  const inv = JSON.stringify(g.state.containers);
  for (let i = 0; i < 40; i++) g.puzzles.action('PZ_WATER_VALVES', i % 2 ? 'TOGGLE_VALVE_B' : 'TOGGLE_VALVE_A');
  assert.equal(g.state.story.puzzlesById.PZ_WATER_VALVES.solved, false);
  for (let i = 0; i < 10; i++) g.puzzles.action('PZ_RADIO_REPAIR', 'TEST_LEVER');
  assert.equal(JSON.stringify(g.state.containers), inv);
  assert.ok(solvePuzzle(g, 'PZ_WATER_VALVES'));
});

test('AT_EXPLORATION_06 fifteen records collectable out of order, saved and rereadable', async () => {
  const g = await makeGame(36); equipAll(g);
  const order = [...g.content.pois.values()].filter((p) => p.storyRecordIds.length).reverse();
  for (const p of order) { if (p.access.vehicleRequired) { atPoi(g, p.id); } openPoi(g, p.id); }
  assert.ok(g.state.story.storyRecordsRead.includes('STORY_15'), 'auto journal after escape hints');
  assert.equal(new Set(g.state.story.storyRecordsRead).size, 15);
  for (const r of g.content.stories.values()) assert.ok(r.body.length > 100 && r.language === 'tr-TR');
  const snap = JSON.parse(JSON.stringify(g.snapshot())); const g2 = await makeGame(36); g2.restoreState(snap);
  assert.equal(g2.state.storyRecordsRead ?? g2.state.story.storyRecordsRead.length, 15);
});

function buildRadio(g, variant) {
  for (const p of ['POI_RADIO_WORKSHOP', 'POI_RELAY_SHELTER', variant === 'solar' ? 'POI_LIGHTHOUSE' : 'POI_RESEARCH_SQUARE']) openPoi(g, p);
  if (variant === 'generator') { g.state.story.poiStates.POI_LIGHTHOUSE = g.state.story.poiStates.POI_LIGHTHOUSE || {}; atPoi(g, 'POI_LIGHTHOUSE'); g.exploration.discover('POI_LIGHTHOUSE'); }
  atPoi(g, 'POI_LIGHTHOUSE');
  const recipe = variant === 'solar' ? 'R_SIGNAL_STATION' : 'R_SIGNAL_STATION_GENERATOR';
  const poi = g.exploration.byId.get('POI_LIGHTHOUSE');
  let tile = null; for (let r = 2; r < 8 && !tile; r++) for (let dy = -r; dy <= r && !tile; dy++) for (let dx = -r; dx <= r && !tile; dx++) { const t = [poi.ax + dx, poi.ay + dy]; if (!g.build.validatePlacement('BUILD_SIGNAL_STATION', t, recipe).length) tile = t; }
  assert.ok(tile, 'signal station placement at lighthouse');
  const b = construct(g, 'BUILD_SIGNAL_STATION', { recipeId: recipe, tile });
  assert.equal(b.data.powerVariant, variant); assert.ok(g.escape.stationPowered());
  return b;
}

test('AT_ENDINGS_01 any two nav sources (fisher+observatory, no captain) unlock nav kit & boat', async () => {
  const g = await makeGame(41); equipAll(g);
  openPoi(g, 'POI_FISHER_HUT'); assert.equal(g.knowledge.storyFlag('TWO_NAV_SOURCES'), false);
  openPoi(g, 'POI_OBSERVATORY');
  assert.equal(g.knowledge.storyFlag('TWO_NAV_SOURCES'), true);
  assert.ok(!g.state.story.specialItemsGranted.includes('SPC_CHART_CAPTAIN'));
  for (const id of ['R_NAV_KIT', 'R_NAV_CHART', 'R_ESCAPE_BOAT']) assert.ok(g.knowledge.unlocked(g.content.recipes.get(id)), id);
});

test('AT_ENDINGS_02 boat requires exactly 4 hull + sail + rudder + nav kit + 6 rations + 8 water', async () => {
  const g = await makeGame(42); bigBag(g); give(g, 'SAL_BOTTLE', 5);
  const r = g.content.recipes.get('R_ESCAPE_BOAT');
  const sum = {}; for (const st of r.constructionStages) for (const [k, v] of Object.entries(st.requirements)) sum[k] = (sum[k] || 0) + v;
  assert.deepEqual(sum, r.inputs); assert.deepEqual(r.inputs, { CMP_HULL_SEGMENT: 4, CMP_SAIL: 1, CMP_RUDDER: 1, TOOL_NAV_KIT: 1, FOOD_RATION: 6, WATER_CLEAN: 8 });
  for (const [k, v] of Object.entries(r.inputs)) give(g, k, v + 2); // extra must not be taken
  g.state.story.specialItemsGranted.push('SPC_CHART_COAST', 'SPC_CHART_OBSERVATORY');
  const shore = g.terrain.localToAtlas('MAIN', ...g.content.seaRoutes.get('SEA_TO_WRECK').departureDock.shoreFootTileLocal);
  g.world.teleport('OVERWORLD', (shore[0] + 0.5) * TILE, (shore[1] + 0.5) * TILE);
  const b = construct(g, 'BUILD_ESCAPE_BOAT', { give: false });
  assert.equal(count(g, 'CMP_HULL_SEGMENT'), 2); assert.equal(count(g, 'FOOD_RATION'), 2); assert.equal(count(g, 'WATER_CLEAN'), 2);
  assert.equal(b.stage, 'complete');
});

function readyBoat(g) {
  bigBag(g); give(g, 'SAL_BOTTLE', 4);
  for (const [k, v] of Object.entries(g.content.recipes.get('R_ESCAPE_BOAT').inputs)) give(g, k, v);
  return placeBoat(g);
}

test('AT_ENDINGS_03 storm blocks departure with warning; valid window within ≤3 days', async () => {
  const g = await makeGame(43); readyBoat(g);
  const d = g.state.clock.dayIndex; g.state.climate.history[d] = 'STORM';
  const r = g.escape.castOff(); assert.equal(r.ok, false); assert.ok(r.reasons[0].includes('Hava'));
  let ok = false; for (let k = 1; k <= 3 && !ok; k++) ok = g.climate.launchAllowed(d + k);
  // generator guarantee (fresh days)
  const g2 = await makeGame(4343); let maxWait = 0, wait = 0; for (let day = 1; day < 400; day++) { if (g2.climate.launchAllowed(day)) wait = 0; else maxWait = Math.max(maxWait, ++wait); }
  assert.ok(maxWait <= 2, 'never more than 2 consecutive unsafe days');
});

test('AT_ENDINGS_04 reef crash restores pre-finale checkpoint; boat and charts kept', async () => {
  const g = await makeGame(44); const boat = readyBoat(g); g.state.climate.history[g.state.clock.dayIndex] = 'CLEAR';
  g.finaleSpeed = 0.1;
  assert.ok(g.escape.castOff().ok);
  // steer into rocks deliberately
  for (let i = 0; i < 30 * 200 && g.finale.active; i++) { const a = g.finale.active; const gate = a.gates.find((x) => !x.passed); g.tick(1 / 30, { x: gate ? (gate.gap >= 2 ? -1 : 1) : 0, y: 0 }); }
  assert.equal(g.finale.active, null);
  assert.ok(g.state.buildingState.byId[boat.uid] && g.state.buildingState.byId[boat.uid].stage === 'complete');
  assert.ok(g.state.story.specialItemsGranted.includes('SPC_CHART_COAST'));
  assert.ok(!g.state.story.endingAchievements.includes('ESCAPE_SAIL'));
  assert.ok(g.escape.castOff().ok, 'can retry');
});

test('AT_ENDINGS_05 radio with solar only (no generator) sends SOS', async () => {
  const g = await makeGame(45); equipAll(g);
  buildRadio(g, 'solar');
  assert.ok(!g.state.story.specialItemsGranted.includes('SPC_GEN_CORE'));
  assert.ok(solvePuzzle(g, 'PZ_LIGHTHOUSE_TUNE')); assert.ok(g.escape.sendSOS().ok);
  assert.equal(g.state.world.sos.power, 'solar');
});

test('AT_ENDINGS_06 radio with generator only (no solar core) sends SOS', async () => {
  const g = await makeGame(46); equipAll(g);
  buildRadio(g, 'generator');
  assert.ok(!g.state.story.specialItemsGranted.includes('SPC_SOLAR_CORE'));
  assert.ok(solvePuzzle(g, 'PZ_LIGHTHOUSE_TUNE')); assert.ok(g.escape.sendSOS().ok);
  assert.equal(g.state.world.sos.power, 'generator');
});

test('AT_ENDINGS_07 radio path has only automatic signal; no speaking or island NPC', async () => {
  const g = await makeGame(47); equipAll(g); buildRadio(g, 'solar'); solvePuzzle(g, 'PZ_LIGHTHOUSE_TUNE');
  const texts = []; g.bus.on('*', (e, type) => { if (e && e.text) texts.push(type + ':' + e.text); });
  g.escape.sendSOS(); for (let d = 0; d < 3; d++) g.simulateTime(1080, 'sleep');
  assert.ok(texts.some((t) => t.includes('OTOMATİK SOS')));
  assert.ok(!texts.some((t) => /merhaba|alo|duyuyor musun|konuş/i.test(t)));
  assert.equal(g.content.db.EscapeDB.terminalState.rescuerNpcOnIsland, false);
  assert.ok(!g.world.animals.some((a) => /HUMAN|NPC/.test(a.speciesId)));
});

test('AT_ENDINGS_08 rescue ready exactly after 2 game days, not early, playable until boarding', async () => {
  const g = await makeGame(48); equipAll(g); buildRadio(g, 'solar'); solvePuzzle(g, 'PZ_LIGHTHOUSE_TUNE'); g.escape.sendSOS();
  const d0 = g.state.world.sos.signalDay; let readyEvents = 0; g.bus.on('rescue.ready', () => readyEvents++);
  g.simulateTime(1080, 'sleep'); assert.equal(g.escape.rescueAvailable(), false, 'not after 1 day');
  g.simulateTime(1080, 'sleep'); assert.equal(g.state.clock.dayIndex >= d0 + 2, true); assert.equal(g.escape.rescueAvailable(), true);
  g.simulateTime(1080, 'sleep'); assert.equal(readyEvents, 1);
  const [rx, ry] = g.escape.rescueTile(); g.world.teleport('OVERWORLD', (rx + 0.5) * TILE, (ry + 0.5) * TILE);
  for (let i = 0; i < 30; i++) g.tick(1 / 30, { x: 0.5, y: 0 }); // still playable
  assert.ok(g.world.interactables().some((t) => t.kind === 'rescue'));
});

test('AT_ENDINGS_09 finish boat, continue, then radio in same save; both kept; world intact', async () => {
  const g = await makeGame(49); equipAll(g); g.finaleSpeed = 0.1;
  const boat = readyBoat(g); g.state.climate.history[g.state.clock.dayIndex] = 'CLEAR';
  const nBuild = Object.keys(g.state.buildingState.byId).length;
  assert.ok(g.escape.castOff().ok);
  for (let i = 0; i < 30 * 200 && g.finale.active && !g.finale.active.done; i++) { const a = g.finale.active; const gate = a.gates.find((x) => !x.passed); const target = gate ? (gate.gap / 4) * 2 - 1 : 0; g.tick(1 / 30, { x: Math.sign(target - a.x) * Math.min(1, Math.abs(target - a.x) * 4), y: 0 }); }
  assert.ok(g.state.story.endingAchievements.includes('ESCAPE_SAIL')); g.finale.close();
  assert.equal(Object.keys(g.state.buildingState.byId).length, nBuild); assert.ok(g.state.buildingState.byId[boat.uid]);
  buildRadio(g, 'solar'); solvePuzzle(g, 'PZ_LIGHTHOUSE_TUNE'); g.escape.sendSOS();
  g.simulateTime(1080, 'sleep'); g.simulateTime(1080, 'sleep');
  assert.ok(g.escape.boardRescue().ok);
  for (let i = 0; i < 30 * 20 && g.finale.active && !g.finale.active.done; i++) g.tick(1 / 30);
  assert.deepEqual([...g.state.story.endingAchievements].sort(), ['ESCAPE_RADIO', 'ESCAPE_SAIL']);
  g.finale.close(); for (let i = 0; i < 30; i++) g.tick(1 / 30, { x: 1, y: 0 }); // free roam continues
  assert.ok(g.state.buildingState.byId[boat.uid]);
});

test('AT_PERSIST_03 cave save: same cave/position, looted chest stays looted, return valid', async () => {
  const g = await makeGame(51); g.state.story.poiStates.POI_COPPER_MINE = { discovered: true, rewardClaimed: true, pendingItems: {} };
  g.caves.enter('CAVE_COPPER'); const chest = g.content.caves.get('CAVE_COPPER').objects.find((o) => o.type === 'chest');
  g.world.teleport('CAVE_COPPER', (chest.tile[0] + 0.5) * TILE, (chest.tile[1] + 1.5) * TILE);
  assert.ok(g.caves.openObject('CAVE_COPPER:' + chest.id).ok);
  const snap = JSON.parse(JSON.stringify(g.snapshot())); const g2 = await makeGame(51); g2.restoreState(snap);
  assert.equal(g2.world.sceneId, 'CAVE_COPPER'); assert.deepEqual(g2.state.player.positionPx, snap.player.positionPx);
  assert.equal(g2.caves.openObject('CAVE_COPPER:' + chest.id).ok, false);
  assert.ok(g2.caves.exit().ok);
});

test('AT_PERSIST_04 partial puzzle (2 valves) restored exactly', async () => {
  const g = await makeGame(52); atPoi(g, 'POI_WATER_STATION'); g.exploration.interact('POI_WATER_STATION');
  g.puzzles.action('PZ_WATER_VALVES', 'TOGGLE_VALVE_A'); g.puzzles.action('PZ_WATER_VALVES', 'TOGGLE_VALVE_B');
  const snap = JSON.parse(JSON.stringify(g.snapshot())); const g2 = await makeGame(52); g2.restoreState(snap);
  assert.deepEqual(g2.puzzles.stateOf('PZ_WATER_VALVES').uiState.valves, [true, true, false]);
});

test('AT_PERSIST_05 death keeps unique story parts; recovery bag is reachable', async () => {
  const g = await makeGame(53); equipAll(g); openPoi(g, 'POI_FISHER_HUT'); give(g, 'MAT_STONE', 20);
  g.survival.damage(500, 'test');
  assert.equal(g.inventory.count(['inv_special'], 'SPC_CHART_COAST'), 1);
  const bag = Object.values(g.state.world.dropBags).find((b) => g.inventory.count([b.containerId], 'MAT_STONE') >= 20);
  assert.ok(bag); assert.ok(g.terrain.passable(g.terrain.grid(bag.sceneId), ...bag.tile, 'WALK'));
  assert.ok(g.inventory.hasItem('TOOL_TORCH'), 'tools kept');
});

test('AT_PERSIST_06 v4 snapshot migrates to v5 with weather/water defaults, no loss', async () => {
  const g = await makeGame(54); bigBag(g); give(g, 'MAT_STONE', 12); const rc = construct(g, 'BUILD_RAIN_CATCHER');
  g.state.world.worldFlags.TEST_FLAG = true;
  const v4 = JSON.parse(JSON.stringify(g.snapshot())); v4.saveVersion = 4; delete v4.climate; v4.waterInfrastructure.byBuildUid[rc.uid] = { type: 'BUILD_RAIN_CATCHER', storedPortions: 3 };
  for (const it of Object.values(v4.containers.items)) delete it.maxDurability;
  const { state, report } = migrate(v4, g.content);
  assert.deepEqual(report.steps, ['v4→v5']); assert.equal(state.saveVersion, 5);
  assert.ok(state.climate.weatherSeed); assert.equal(state.waterInfrastructure.byBuildUid[rc.uid].volumeCenti, 300);
  assert.equal(state.world.worldFlags.TEST_FLAG, true);
  assert.equal(Object.values(state.containers.items).filter((i) => i.itemId === 'MAT_STONE').reduce((s, i) => s + i.quantity, 0), 12);
  assert.deepEqual(validateState(state, g.content), []);
});

test('AT_PERSIST_10 unknown mod entity is quarantined, save not discarded', async () => {
  const g = await makeGame(55); give(g, 'MAT_STONE', 3);
  const s = JSON.parse(JSON.stringify(g.snapshot()));
  s.containers.items.mod1 = { uid: 'mod1', itemId: 'MOD_LASER', quantity: 1 }; s.containers.byId.inv_player.slots[5] = 'mod1';
  s.buildingState.byId.modb = { uid: 'modb', buildId: 'BUILD_MOD_TOWER', tile: [1, 1], w: 1, h: 1 };
  const { state, report } = migrate(s, g.content);
  assert.equal(report.quarantined.length, 2); assert.equal(state.containers.items.mod1, undefined);
  assert.equal(Object.values(state.containers.items).filter((i) => i.itemId === 'MAT_STONE').length, 1);
  assert.deepEqual(validateState(state, g.content), []);
});
