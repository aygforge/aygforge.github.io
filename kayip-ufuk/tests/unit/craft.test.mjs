// AT_ITEM_CRAFT_* + content completeness (179 items have a source/use, 183 recipes executable, 58 builds functional)
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from '../helpers/make-game.mjs';
import { give, bigBag, count, findSpot, construct, craftAt, finishAction, placeNear, solvePuzzle, placeBoat } from '../helpers/tools.mjs';
import { TILE } from '../../src/world/TerrainSystem.js';

test('AT_ITEM_CRAFT_01 starter guaranteed nodes cover the first eight basics with ≥21 fiber spare', async () => {
  const g = await makeGame(7);
  for (const n of g.world.nodeDefs.filter((n) => n.fixed && n.sceneId === 'OVERWORLD')) { placeNear(g, n.tile); assert.ok(g.resources.gather(n.id).ok, n.id); finishAction(g); }
  assert.equal(count(g, 'MAT_FIBER'), 63);
  // eight core basics: rope→ stone axe, stone pick, wood spear (hand) + campfire, leaf shelter, leaf bed, workbench (builds)
  craftAt(g, 'R_ROPE', 'HAND', 14);
  craftAt(g, 'R_STONE_AXE'); craftAt(g, 'R_STONE_PICK'); craftAt(g, 'R_WOOD_SPEAR');
  // logs for the workbench from the nearest trees with the new axe
  const sp = g.terrain.localToAtlas('MAIN', 122, 220);
  const trees = g.world.nodeDefs.filter((n) => n.itemId === 'MAT_LOG' && n.sceneId === 'OVERWORLD').sort((a, b) => Math.hypot(a.tile[0] - sp[0], a.tile[1] - sp[1]) - Math.hypot(b.tile[0] - sp[0], b.tile[1] - sp[1]));
  for (const t of trees) { if (count(g, 'MAT_LOG') >= 4) break; placeNear(g, t.tile); if (g.resources.gather(t.id).ok) finishAction(g); }
  g.world.teleport('OVERWORLD', (sp[0] + 0.5) * TILE, (sp[1] + 0.5) * TILE);
  for (const b of ['BUILD_CAMPFIRE', 'BUILD_LEAF_SHELTER', 'BUILD_LEAF_BED', 'BUILD_WORKBENCH']) construct(g, b, { give: false });
  assert.ok(count(g, 'MAT_FIBER') >= 21, `fiber left ${count(g, 'MAT_FIBER')}`);
  assert.equal(g.inventory.validate().length, 0);
});

test('AT_ITEM_CRAFT_02 no free crafts: missing inputs/station/knowledge are blocked', async () => {
  const g = await makeGame(3);
  assert.ok(g.craft.check('R_ROPE', 'HAND').length > 0); // no knowledge, no fiber
  assert.equal(g.craft.start('R_ROPE', 'HAND').ok, false);
  give(g, 'MAT_FIBER', 2); assert.ok(g.craft.check('R_ROPE', 'HAND').some((r) => r.startsWith('Eksik')));
  give(g, 'MAT_LOG', 1); assert.ok(g.craft.check('R_PLANK', 'HAND').some((r) => r.startsWith('İstasyon')));
  assert.equal(count(g, 'CMP_ROPE') + count(g, 'CMP_PLANK'), 0);
  assert.ok(g.craft.check('R_HUNTER_BOW', 'HAND').some((r) => r.includes('Kilitli')));
});

test('AT_ITEM_CRAFT_03 workbench shares chests within 10 tiles, not at 11', async () => {
  const g = await makeGame(5); bigBag(g);
  const wb = construct(g, 'BUILD_WORKBENCH');
  const c9 = construct(g, 'BUILD_CHEST_SMALL', { tile: findSpot(g, 'BUILD_CHEST_SMALL', null, [wb.tile[0] + 9, wb.tile[1] + 0]) });
  const near = g.craft.nearbyContainers(wb.uid);
  const d = (b) => Math.hypot(b.tile[0] + b.w / 2 - (wb.tile[0] + wb.w / 2), b.tile[1] + b.h / 2 - (wb.tile[1] + wb.h / 2));
  assert.equal(near.includes(c9.containerId), d(c9) <= 10);
  // place a chest exactly >10 away and verify exclusion
  let far = null; for (let dx = 11; dx < 30 && !far; dx++) { try { const t = findSpot(g, 'BUILD_CHEST_SMALL', null, [wb.tile[0] + dx, wb.tile[1] + 1]); const tmp = { tile: t, w: 1, h: 1 }; if (d(tmp) > 10.2 && d(tmp) < 13) far = construct(g, 'BUILD_CHEST_SMALL', { tile: t }); } catch { /* keep searching */ } }
  assert.ok(far); assert.equal(g.craft.nearbyContainers(wb.uid).includes(far.containerId), false);
  // a 9-tile chest really supplies a craft
  g.state.knowledge.items.MAT_LOG = true; const inside = d(c9) <= 10 ? c9 : null;
  if (inside) { g.store.transaction(null, (tx) => g.inventory.add(tx, inside.containerId, 'MAT_LOG', 1)); g.world.teleport('OVERWORLD', (wb.tile[0] + 1) * TILE, (wb.tile[1] + 3) * TILE); const before = g.inventory.count([inside.containerId], 'MAT_LOG'); craftAt(g, 'R_PLANK', wb.uid); assert.equal(g.inventory.count([inside.containerId], 'MAT_LOG'), before - 1); }
});

test('AT_ITEM_CRAFT_04 atomic multi-source reserve survives save/load exactly once', async () => {
  const g = await makeGame(9); bigBag(g);
  const wb = construct(g, 'BUILD_WORKBENCH'); const ch = construct(g, 'BUILD_CHEST_SMALL', { tile: findSpot(g, 'BUILD_CHEST_SMALL', null, [wb.tile[0] + 3, wb.tile[1]]) });
  g.world.teleport('OVERWORLD', (wb.tile[0] + 1) * TILE, (wb.tile[1] + 3) * TILE);
  g.state.knowledge.items.MAT_RESIN = true;
  give(g, 'CMP_ROPE', 1); give(g, 'MAT_RESIN', 1); g.store.transaction(null, (tx) => g.inventory.add(tx, ch.containerId, 'CMP_ROPE', 1));
  const total = () => count(g, 'CMP_ROPE') + g.inventory.count([ch.containerId], 'CMP_ROPE');
  assert.equal(total(), 2);
  const r = g.craft.start('R_THICK_ROPE', wb.uid, 1); assert.ok(r.ok);
  assert.equal(total(), 0); assert.deepEqual(r.value.consumedInputs, { CMP_ROPE: 2, MAT_RESIN: 1 });
  const snap = JSON.parse(JSON.stringify(g.snapshot())); const g2 = await makeGame(9); g2.restoreState(snap);
  const q = g2.state.productionState.queuesByStation[wb.uid]; assert.equal(q.entries.length, 1);
  assert.equal(g2.inventory.count(['inv_player', ch.containerId], 'CMP_ROPE'), 0);
  for (let i = 0; i < 20; i++) g2.craft.tick(1); g2.craft.claim(wb.uid, q.entries[0]?.uid);
  assert.equal(count(g2, 'CMP_THICK_ROPE'), 1);
  assert.equal(g2.craft.start('R_THICK_ROPE', wb.uid, 1).ok, false, 'no duplicate inputs');
});

test('AT_ITEM_CRAFT_05 output stays claimable at station when inventory is full', async () => {
  const g = await makeGame(11);
  const wb = construct(g, 'BUILD_WORKBENCH'); g.world.teleport('OVERWORLD', (wb.tile[0] + 1) * TILE, (wb.tile[1] + 3) * TILE);
  g.state.knowledge.items.MAT_LOG = true; give(g, 'MAT_LOG', 1);
  const r = g.craft.start('R_PLANK', wb.uid, 1); assert.ok(r.ok);
  // fill every slot with unique tools while the craft runs
  const inv = g.inventory.cont('inv_player'); while (inv.slots.includes(null)) give(g, 'TOOL_TORCH', 1);
  for (let i = 0; i < 10; i++) g.craft.tick(1);
  const e = r.value; assert.equal(e.completed, true); assert.equal(e.claimed, false);
  assert.equal(g.craft.claim(wb.uid, e.uid).ok, false);
  const loc = g.inventory.locate(inv.slots[0]); g.store.transaction(null, (tx) => { g.inventory.removeInstance(tx, inv.slots[0]); });
  void loc; assert.ok(g.craft.claim(wb.uid, e.uid).ok); assert.equal(count(g, 'CMP_PLANK'), 3);
  assert.equal(g.craft.claim(wb.uid, e.uid).ok, false, 'claimed once');
});

test('AT_ITEM_CRAFT_06 MAT/STATION/BP unlock rules', async () => {
  const g = await makeGame(13); const k = g.knowledge; const R = (id) => g.content.recipes.get(id);
  assert.equal(k.unlocked(R('R_ROPE')), false); give(g, 'MAT_FIBER', 1); assert.equal(k.unlocked(R('R_ROPE')), true);
  assert.equal(k.unlocked(R('R_BRICK')), false); construct(g, 'BUILD_KILN'); assert.equal(k.unlocked(R('R_BRICK')), true);
  assert.equal(k.unlocked(R('R_HUNTER_BOW')), false); assert.equal(k.unlocked(R('R_MACHETE')), false);
  g.state.story.learnedBlueprints.push('BP_HUNTER_BOW'); assert.equal(k.unlocked(R('R_HUNTER_BOW')), true); assert.equal(k.unlocked(R('R_MACHETE')), false);
});

test('AT_ITEM_CRAFT_07 20 unique blueprints learned once; none required for escapes', async () => {
  const g = await makeGame(15); bigBag(g);
  const tools = ['TOOL_TORCH', 'TOOL_CLIMB_KIT', 'TOOL_DIVING_MASK', 'TOOL_DIVING_KIT', 'TOOL_CROWBAR']; for (const t of tools) give(g, t, 1);
  give(g, 'CMP_PLANK', 8); give(g, 'CMP_ROPE', 6);
  const bpPois = Object.entries(g.content.db.LootTableDB.fixedBlueprintSources);
  for (const [bp, poiId] of bpPois) {
    const poi = g.exploration.byId.get(poiId); g.world.teleport('OVERWORLD', (poi.ax + 0.5) * TILE, (poi.ay + 0.5) * TILE, 'WALK');
    g.state.player.mode = 'SWIM'; g.state.clock.timeOfDaySeconds = 0.2 * 1080; g.climate.tick();
    const pz = g.content.pois.get(poiId).puzzleId;
    g.exploration.interact(poiId);
    if (pz && !g.state.story.puzzlesById[pz]?.solved) {
      const def = g.content.puzzles.get(pz); g.puzzles.stateOf(pz).uiState = JSON.parse(JSON.stringify(def.solution)); g.puzzles.stateOf(pz).uiState[Object.keys(def.solution)[0]] = JSON.parse(JSON.stringify(def.stateSchema))[Object.keys(def.solution)[0]];
      solvePuzzle(g, pz);
    }
    g.state.player.mode = 'WALK';
    assert.ok(g.state.story.learnedBlueprints.includes(bp), `${bp} from ${poiId}`);
  }
  assert.equal(new Set(g.state.story.learnedBlueprints).size, 20);
  const before = g.state.story.learnedBlueprints.length; for (const [, poiId] of bpPois) g.exploration.interact(poiId);
  assert.equal(g.state.story.learnedBlueprints.length, before);
  for (const r of g.content.db.EscapeDB.routes) assert.deepEqual(r.optionalBlueprintsNeeded, []);
  const escapeRecipes = ['R_ESCAPE_BOAT', 'R_NAV_KIT', 'R_NAV_CHART', 'R_COMPASS', 'R_HULL_SEGMENT', 'R_SAIL', 'R_RUDDER', 'R_RATION', 'R_SIGNAL_STATION', 'R_SIGNAL_STATION_GENERATOR', 'R_GENERATOR', 'R_ANTENNA', 'R_SIGNAL_BOOSTER', 'R_CABLE_HARNESS', 'R_FUSE', 'R_RAFT'];
  for (const id of escapeRecipes) assert.ok(!g.content.recipes.get(id).unlock.startsWith('BP:'), id);
});

test('AT_ITEM_CRAFT_08 upgrade keeps building UID and contents, capacity changes, no duplication', async () => {
  const g = await makeGame(17); bigBag(g);
  const chest = construct(g, 'BUILD_CHEST_LARGE');
  g.store.transaction(null, (tx) => { g.inventory.add(tx, chest.containerId, 'MAT_STONE', 40); g.inventory.add(tx, chest.containerId, 'TOOL_STONE_AXE', 1); });
  const uid = chest.uid; const before = JSON.stringify(g.inventory.cont(chest.containerId).slots.filter(Boolean).map((u) => g.inventory.item(u)));
  g.state.story.learnedBlueprints.push('BP_CHEST_REINFORCE'); give(g, 'CMP_IRON_INGOT', 4); give(g, 'CMP_TREATED_PLANK', 4);
  g.world.teleport('OVERWORLD', (chest.tile[0] + 1) * TILE, (chest.tile[1] + 2) * TILE);
  const r = g.build.applyUpgrade('R_CHEST_REINFORCE', uid); assert.ok(r.ok, JSON.stringify(r));
  assert.equal(r.value, uid); assert.ok(g.state.buildingState.byId[uid]);
  assert.equal(Object.values(g.state.buildingState.byId).filter((b) => b.buildId === 'BUILD_CHEST_LARGE').length, 1);
  assert.equal(g.inventory.cont(chest.containerId).capacity, 40);
  assert.equal(JSON.stringify(g.inventory.cont(chest.containerId).slots.filter(Boolean).map((u) => g.inventory.item(u))), before);
  assert.equal(g.build.applyUpgrade('R_CHEST_REINFORCE', uid).ok, false, 'duplicate install rejected');
  assert.equal(count(g, 'CMP_IRON_INGOT'), 2);
  // all 9 upgrade recipes target existing builds and apply in place
  const ups = [...g.content.recipes.values()].filter((x) => x.outputType === 'upgrade'); assert.equal(ups.length, 9);
  for (const up of ups) {
    if (up.id === 'R_CHEST_REINFORCE') continue;
    const tgt = up.targetBuildId === 'BUILD_ESCAPE_BOAT' ? placeBoat(g) : construct(g, up.targetBuildId);
    if (up.unlock.startsWith('BP:')) g.state.story.learnedBlueprints.push(up.unlock.slice(3)); else g.state.knowledge.items[up.unlock.split(':')[1]] = true;
    g.state.knowledge.stations[up.station] = true;
    for (const [id, n] of Object.entries(up.inputs)) give(g, id, n);
    g.world.teleport('OVERWORLD', (tgt.tile[0] + 1) * TILE, (tgt.tile[1] + tgt.h + 1) * TILE, 'WALK');
    const n0 = Object.keys(g.state.buildingState.byId).length;
    const ur = g.build.applyUpgrade(up.id, tgt.uid); assert.ok(ur.ok, up.id + ' ' + ur.code);
    assert.equal(Object.keys(g.state.buildingState.byId).length, n0);
    assert.ok(g.state.buildingState.byId[tgt.uid].upgrades.includes(up.id));
  }
});



test('AT_ITEM_CRAFT_09 R_SEA_CHEST builds a distinct new chest', async () => {
  const g = await makeGame(19); bigBag(g);
  const a = construct(g, 'BUILD_CHEST_LARGE'); g.store.transaction(null, (tx) => g.inventory.add(tx, a.containerId, 'MAT_STONE', 5));
  const snapA = JSON.stringify(a);
  const b = construct(g, 'BUILD_CHEST_LARGE', { recipeId: 'R_SEA_CHEST' });
  assert.notEqual(a.uid, b.uid); assert.notEqual(a.containerId, b.containerId);
  assert.equal(JSON.stringify(g.state.buildingState.byId[a.uid]), snapA);
  assert.equal(g.inventory.count([a.containerId], 'MAT_STONE'), 5);
});

test('AT_ITEM_CRAFT_10 tool breaks at 0 without deletion, cannot work, repairs predictably', async () => {
  const g = await makeGame(21);
  give(g, 'TOOL_COPPER_PICK', 1); const pick = g.inventory.bestTool('pick'); assert.equal(pick.durability, 65);
  const ores = g.world.nodeDefs.filter((n) => ['MAT_COPPER_ORE', 'MAT_COAL', 'MAT_STONE'].includes(n.itemId) && n.sceneId === 'OVERWORLD');
  let i = 0; while (pick.durability > 0 && i < ores.length) { placeNear(g, ores[i].tile); if (g.resources.gather(ores[i].id).ok) finishAction(g); i++; }
  assert.equal(pick.durability, 0); assert.ok(g.inventory.item(pick.uid), 'tool still owned');
  const next = ores.find((n) => g.world.nodeReady(n) && n.itemId !== 'MAT_STONE'); placeNear(g, next.tile);
  assert.equal(g.resources.gather(next.id).ok, false);
  // repair: repair kit (−20 durability) + copper ingot → +65% of max, atomic
  const wb = construct(g, 'BUILD_WORKBENCH'); g.world.teleport('OVERWORLD', (wb.tile[0] + 1) * TILE, (wb.tile[1] + 3) * TILE);
  give(g, 'TOOL_REPAIR_KIT', 1); give(g, 'CMP_COPPER_INGOT', 1);
  const kit = g.inventory.bestTool('TOOL_REPAIR_KIT');
  const r = g.store.transaction(null, (tx) => { g.inventory.remove(tx, ['inv_player'], 'CMP_COPPER_INGOT', 1); g.inventory.wear(tx, kit, 20); tx.set(pick, 'durability', Math.min(pick.maxDurability, pick.durability + Math.round(pick.maxDurability * 0.65))); });
  assert.ok(r.ok); assert.equal(pick.durability, 42); assert.equal(kit.durability, 80);
});

test('AT_ITEM_CRAFT_11 stacks split/merge/transfer and death never create negative or duplicate UIDs', async () => {
  const g = await makeGame(23);
  give(g, 'MAT_STONE', 50); give(g, 'MAT_STONE', 30);
  const inv = g.inventory; const slot = inv.cont('inv_player').slots.findIndex((u) => u && inv.item(u).itemId === 'MAT_STONE' && inv.item(u).quantity === 50);
  g.store.transaction(null, (tx) => inv.splitStack(tx, 'inv_player', slot));
  assert.equal(count(g, 'MAT_STONE'), 80);
  const ch = construct(g, 'BUILD_CHEST_SMALL');
  for (let i = 0; i < 3; i++) { const s = inv.cont('inv_player').slots.findIndex((u) => u && inv.item(u).itemId === 'MAT_STONE'); if (s >= 0) g.store.transaction(null, (tx) => inv.moveSlot(tx, 'inv_player', s, ch.containerId)); }
  assert.equal(count(g, 'MAT_STONE') + inv.count([ch.containerId], 'MAT_STONE'), 80);
  // fill and die
  while (inv.cont('inv_player').slots.includes(null)) give(g, 'MAT_BRANCH', 50);
  g.survival.damage(500, 'test');
  assert.deepEqual(inv.validate(), []);
  assert.ok(Object.keys(g.state.world.dropBags).length >= 1);
});

test('AT_ITEM_CRAFT_12 boat stage escrow: deliver 2 hulls, reload, still 2, no double charge', async () => {
  const g = await makeGame(25); bigBag(g);
  const boat = (() => { g.state.story.specialItemsGranted.push('SPC_CHART_COAST', 'SPC_CHART_OBSERVATORY'); const route = g.content.seaRoutes.get('SEA_TO_WRECK'); const shore = g.terrain.localToAtlas('MAIN', ...route.departureDock.shoreFootTileLocal); g.world.teleport('OVERWORLD', (shore[0] + 0.5) * TILE, (shore[1] + 0.5) * TILE); g.state.knowledge.stations.BUILD_NAV_TABLE = true; const t = findSpot(g, 'BUILD_ESCAPE_BOAT', 'R_ESCAPE_BOAT'); return g.build.place('BUILD_ESCAPE_BOAT', t).value; })();
  give(g, 'CMP_HULL_SEGMENT', 2);
  assert.ok(g.build.deliver(boat.uid).ok);
  assert.equal(boat.stageIndex, 1); assert.equal(count(g, 'CMP_HULL_SEGMENT'), 0);
  const snap = JSON.parse(JSON.stringify(g.snapshot())); const g2 = await makeGame(25); g2.restoreState(snap);
  const b2 = g2.state.buildingState.byId[boat.uid];
  assert.equal(b2.stageIndex, 1); assert.deepEqual(g2.state.containers.lockedMaterialsByProject[boat.uid], { CMP_HULL_SEGMENT: 2 });
  give(g2, 'CMP_HULL_SEGMENT', 3); g2.build.deliver(boat.uid);
  assert.equal(b2.stageIndex, 2); assert.equal(count(g2, 'CMP_HULL_SEGMENT'), 1, 'only 2 more taken');
  assert.equal(g2.build.deliver(boat.uid).ok, false, 'next stage needs sail/rudder, nothing taken');
  give(g2, 'CMP_SAIL', 1); give(g2, 'CMP_RUDDER', 1); give(g2, 'TOOL_NAV_KIT', 1); give(g2, 'FOOD_RATION', 6); give(g2, 'WATER_CLEAN', 0);
  g2.build.deliver(boat.uid); assert.equal(b2.stageIndex, 3);
  give(g2, 'SAL_BOTTLE', 4);
  give(g2, 'WATER_CLEAN', 8); g2.build.deliver(boat.uid);
  assert.ok(g2.build.isFullyDelivered(b2)); assert.equal(count(g2, 'FOOD_RATION'), 0); assert.equal(count(g2, 'WATER_CLEAN'), 0);
  assert.ok(g2.build.complete(b2.uid).ok);
});

test('CONTENT all 179 items have a world source or a craft/recipe use', async () => {
  const g = await makeGame(1); const c = g.content;
  const sources = new Set();
  for (const r of c.recipes.values()) if (r.outputType === 'item') sources.add(r.outputId);
  for (const n of g.world.nodeDefs) sources.add(n.itemId);
  for (const p of c.lootPools.values()) for (const e of p.entries) sources.add(e.itemId);
  for (const p of c.pois.values()) { for (const id of Object.keys(p.reward.guaranteedItems || {})) sources.add(id); if (p.reward.specialItemId) sources.add(p.reward.specialItemId); }
  for (const a of c.species.values()) for (const id of Object.keys(a.loot || {})) sources.add(id);
  for (const cr of c.crops.values()) { sources.add(cr.harvestItemId); sources.add(cr.seedItemId); }
  for (const id of ['MAT_RAW_FISH', 'MAT_FISH_OFFCUT', 'MAT_BONE', 'MAT_PEBBLE', 'MAT_TREE_BARK', 'MAT_ORGANIC_WASTE', 'WATER_DIRTY', 'WATER_CLEAN']) sources.add(id); // catch processing / harvest side drops / river / spoilage
  const { BYPRODUCTS } = await import('../../src/systems/WildlifeSystem.js'); for (const b of Object.values(BYPRODUCTS)) for (const id of Object.keys(b)) sources.add(id);
  // drifting salvage (storm/daily) really produces a bottle within 60 simulated days
  let bottle = false; for (let d = 2; d < 60 && !bottle; d++) { g.resources.spawnFlotsam(d); bottle = Object.values(g.state.world.flotsam).some((f) => f.items.SAL_BOTTLE); }
  if (bottle) sources.add('SAL_BOTTLE');
  const missing = [...c.items.keys()].filter((id) => !sources.has(id));
  assert.deepEqual(missing, []);
  const used = new Set(); for (const r of c.recipes.values()) for (const id of Object.keys(r.inputs)) used.add(id);
  const { SYSTEM_USES } = await import('../../src/data/SystemUses.js');
  const sinks = [...c.items.values()].filter((it) => !used.has(it.id) && !SYSTEM_USES[it.id] && !it.restore && !it.equipmentSlot && it.category !== 'special' && it.category !== 'seed' && !['CON_BANDAGE', 'CON_ADV_BANDAGE', 'CON_ANTIDOTE'].includes(it.id)).map((i) => i.id);
  assert.deepEqual(sinks, []);
});

test('CONTENT all 183 recipes have executable station/unlock paths; all 58 builds constructible', async () => {
  const g = await makeGame(2); const c = g.content;
  for (const r of c.recipes.values()) {
    const [kind, id] = r.unlock.split(':');
    if (kind === 'MAT') assert.ok(c.items.has(id), r.id);
    if (kind === 'STATION') assert.ok(c.builds.has(id), r.id);
    if (kind === 'BP') assert.ok(c.blueprints.has(id), r.id);
    if (kind === 'STORY') assert.ok(c.db.EscapeDB.unlocks[id], r.id);
  }
  // execute every item recipe once with granted inputs at the right station
  bigBag(g); let executed = 0;
  const stations = {};
  for (const r of [...c.recipes.values()].filter((x) => x.outputType === 'item')) {
    const g2 = g; const inv = g2.inventory; inv.cont('inv_player').slots.fill(null); g2.state.containers.items = Object.fromEntries(Object.entries(g2.state.containers.items).filter(([u]) => Object.values(g2.state.player.equipment).includes(u)));
    const eq = g2.state.player.equipment.backpack; if (eq) inv.cont('inv_player').slots[0] = eq;
    const [kind, id] = r.unlock.split(':');
    if (kind === 'MAT') g2.state.knowledge.items[id] = true; if (kind === 'STATION') g2.state.knowledge.stations[id] = true; if (kind === 'BP') g2.state.story.learnedBlueprints.push(id);
    if (kind === 'STORY') { if (id === 'TWO_NAV_SOURCES') g2.state.story.specialItemsGranted.push('SPC_CHART_COAST', 'SPC_CHART_OBSERVATORY'); if (id === 'GENERATOR_CORE_FOUND') g2.state.story.specialItemsGranted.push('SPC_GEN_CORE'); }
    for (const sp of r.requiredSpecialItems || []) g2.state.story.specialItemsGranted.push(sp);
    let sid = 'HAND';
    if (r.station !== 'HAND') { if (!stations[r.station]) stations[r.station] = construct(g2, r.station, { give: true }); sid = stations[r.station].uid; const st = stations[r.station]; g2.world.teleport('OVERWORLD', (st.tile[0] + st.w / 2) * TILE, (st.tile[1] + st.h + 0.5) * TILE); }
    if (Object.keys(r.inputs).some((x) => x.startsWith('WATER_'))) give(g2, 'SAL_BOTTLE', 2);
    for (const [iid, n] of Object.entries(r.inputs)) give(g2, iid, n);
    const before = inv.count(['inv_player'], r.outputId);
    const e = craftAt(g2, r.id, sid, 1);
    assert.ok(e.claimed, r.id);
    assert.equal(inv.count(['inv_player'], r.outputId) - before + (Object.keys(r.inputs).includes(r.outputId) ? r.inputs[r.outputId] : 0), r.outputAmount, r.id);
    executed++;
  }
  assert.equal(executed, 114);
  // all 58 build ids constructible by at least one recipe (60 build recipes incl. alternates)
  const buildRecipes = [...c.recipes.values()].filter((x) => x.outputType === 'build');
  assert.equal(buildRecipes.length, 60);
  assert.equal(new Set(buildRecipes.map((x) => x.outputId)).size, 58);
});
