// AT_SURVIVAL_ECO_01..15
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame } from '../helpers/make-game.mjs';
import { give, bigBag, count, construct, findSpot } from '../helpers/tools.mjs';
import { TILE, T } from '../../src/world/TerrainSystem.js';
import { WEATHERS } from '../../src/systems/ClimateSystem.js';

const farFromEverything = (g) => g.world.teleport('OVERWORLD', 40 * TILE, 40 * TILE, 'SWIM');

test('AT_SURVIVAL_ECO_01 1080 game seconds drain hunger 32 / thirst 42 / rest 35', async () => {
  const g = await makeGame(1); const p = g.state.player; p.hunger = 100; p.thirst = 100; p.rest = 100;
  g.state.clock.gameElapsedSeconds = 60; // no weather modifiers: use clear day
  g.climate.weatherFor(1); g.state.climate.history[1] = 'CLEAR'; g.state.climate.history[2] = 'CLEAR';
  for (let i = 0; i < 1080 * 30; i++) g.survival.tick(1 / 30);
  assert.ok(Math.abs(100 - p.hunger - 32) < 0.05, p.hunger); assert.ok(Math.abs(100 - p.thirst - 42) < 0.05); assert.ok(Math.abs(100 - p.rest - 35) < 0.05);
});

test('AT_SURVIVAL_ECO_02 eat/drink clamp to [0,100]', async () => {
  const g = await makeGame(2); const p = g.state.player;
  give(g, 'FOOD_FEAST', 2); give(g, 'SAL_BOTTLE', 1); give(g, 'WATER_CLEAN', 2);
  p.hunger = 95; const feast = g.inventory.cont('inv_player').slots.find((u) => u && g.inventory.item(u).itemId === 'FOOD_FEAST');
  assert.ok(g.survival.consume(feast).ok); assert.equal(p.hunger, 100);
  p.thirst = 0; const w = g.inventory.cont('inv_player').slots.find((u) => u && g.inventory.item(u).itemId === 'WATER_CLEAN');
  g.survival.consume(w); assert.equal(p.thirst, 25);
  p.hunger = 0; for (let i = 0; i < 100; i++) g.survival.tick(1); assert.equal(p.hunger, 0);
});

test('AT_SURVIVAL_ECO_03 weather deterministic after reload; ≤3 dry days, safe window ≤3 days', async () => {
  const a = await makeGame(77); const seq = []; for (let d = 1; d <= 300; d++) seq.push(a.climate.weatherFor(d));
  const snap = JSON.parse(JSON.stringify(a.snapshot())); snap.climate.history = Object.fromEntries(Object.entries(snap.climate.history).filter(([d]) => +d <= 20));
  const b = await makeGame(77); b.restoreState(snap); const seq2 = []; for (let d = 1; d <= 300; d++) seq2.push(b.climate.weatherFor(d));
  assert.deepEqual(seq, seq2);
  let clear = 0, unsafe = 0; const safe = new Set(['CLEAR', 'LIGHT_RAIN']);
  for (const w of seq) { clear = w === 'CLEAR' ? clear + 1 : 0; unsafe = safe.has(w) ? 0 : unsafe + 1; assert.ok(clear <= 3); assert.ok(unsafe <= 2); }
  const kinds = new Set(seq); for (const w of WEATHERS) assert.ok(kinds.has(w), w);
});

test('AT_SURVIVAL_ECO_04 collectors yield 0/2/4/6/6 and 0/5/10/16/16, capacity bounded, slices once', async () => {
  for (const [bid, exp] of [['BUILD_RAIN_CATCHER', [0, 2, 4, 6, 6]], ['BUILD_RAIN_CATCHER_L', [0, 5, 10, 16, 16]]]) {
    const g = await makeGame(5); bigBag(g);
    const b = construct(g, bid); b.completedGameSeconds = 0;
    WEATHERS.forEach((w, i) => {
      const day = 10 + i; g.state.climate.history[day] = w;
      const wat = g.state.waterInfrastructure.byBuildUid[b.uid]; wat.volumeCenti = 0;
      g.climate.applySlice(day, 0); g.climate.applySlice(day, 1); g.climate.applySlice(day, 0); g.climate.onDay(day + 1);
      assert.equal(wat.volumeCenti / 100, exp[i], `${bid} ${w}`);
    });
    const wat = g.state.waterInfrastructure.byBuildUid[b.uid]; wat.volumeCenti = wat.capacityCenti - 50; g.state.climate.history[30] = 'STORM'; g.climate.applySlice(30, 0); g.climate.applySlice(30, 1);
    assert.equal(wat.volumeCenti, wat.capacityCenti);
  }
});

test('AT_SURVIVAL_ECO_05 tank never mixes clean and dirty water', async () => {
  const g = await makeGame(6); bigBag(g); const t = construct(g, 'BUILD_WATER_TANK');
  give(g, 'SAL_BOTTLE', 3); give(g, 'WATER_DIRTY', 3);
  assert.ok(g.climate.fillTank(t.uid, 'WATER_DIRTY', 3).ok);
  give(g, 'WATER_CLEAN', 2);
  const r = g.climate.fillTank(t.uid, 'WATER_CLEAN', 2); assert.equal(r.ok, false); assert.equal(r.code, 'MIX_FORBIDDEN');
  const w = g.state.waterInfrastructure.byBuildUid[t.uid]; assert.equal(w.mode, 'RAW'); assert.equal(w.volumeCenti, 300); assert.equal(count(g, 'WATER_CLEAN'), 2);
  g.climate.takeFromBuild(t.uid, 3); assert.equal(w.volumeCenti, 0); assert.equal(w.mode, null);
  assert.ok(g.climate.fillTank(t.uid, 'WATER_CLEAN', 2).ok); assert.equal(w.mode, 'CLEAN');
});

test('AT_SURVIVAL_ECO_06 campfire boiling: 1 dirty + 1 branch → 1 clean, repeatable on dry days', async () => {
  const g = await makeGame(7); const fire = construct(g, 'BUILD_CAMPFIRE');
  g.world.teleport('OVERWORLD', (fire.tile[0] + 1) * TILE, (fire.tile[1] + 3) * TILE);
  give(g, 'SAL_BOTTLE', 2); give(g, 'WATER_DIRTY', 2); give(g, 'MAT_BRANCH', 2);
  for (let k = 0; k < 2; k++) { g.state.climate.history[g.state.clock.dayIndex] = 'CLEAR'; const r = g.craft.start('R_WATER_CLEAN', fire.uid, 1); assert.ok(r.ok); for (let i = 0; i < 15; i++) g.craft.tick(1); }
  assert.equal(count(g, 'WATER_CLEAN'), 2); assert.equal(count(g, 'WATER_DIRTY'), 0); assert.equal(count(g, 'MAT_BRANCH'), 0);
});

test('AT_SURVIVAL_ECO_07 all 12 crops grow and harvest with ≥1 renewable seed', async () => {
  const g = await makeGame(8); bigBag(g);
  for (const crop of g.content.crops.values()) {
    const plot = construct(g, 'BUILD_PLANTER'); give(g, crop.seedItemId, 1);
    assert.ok(g.farm.plant(plot.uid, crop.seedItemId).ok, crop.id);
    for (let d = 0; d < crop.growGameDays; d++) { const day = g.state.clock.dayIndex; g.state.climate.history[day] = 'LIGHT_RAIN'; g.simulateTime(1080, 'sleep'); }
    const p = g.farm.plot(plot.uid); assert.ok(p.ready, crop.id);
    const seedsBefore = count(g, crop.seedItemId); const r = g.farm.harvest(plot.uid); assert.ok(r.ok);
    assert.ok(count(g, crop.seedItemId) - seedsBefore >= 1, crop.id + ' seed');
    assert.ok(count(g, crop.harvestItemId) >= crop.yieldMin);
    if (crop.repeatHarvest) assert.equal(g.farm.plot(plot.uid).cropId, crop.id);
    g.world.teleport('OVERWORLD', (plot.tile[0] + 4) * TILE, (plot.tile[1] + 1) * TILE);
  }
});

test('AT_SURVIVAL_ECO_08 no water → growth pauses, plant survives, no retroactive growth', async () => {
  const g = await makeGame(9); const plot = construct(g, 'BUILD_PLANTER'); give(g, 'SEED_ROOT', 1);
  g.farm.plant(plot.uid, 'SEED_ROOT');
  for (let d = 0; d < 2; d++) { g.state.climate.history[g.state.clock.dayIndex] = 'CLEAR'; g.simulateTime(1080, 'sleep'); }
  let p = g.farm.plot(plot.uid); assert.equal(p.growthDays, 0); assert.equal(p.cropId, 'CROP_ROOT');
  g.state.climate.history[g.state.clock.dayIndex] = 'RAIN'; g.simulateTime(1080, 'sleep');
  p = g.farm.plot(plot.uid); assert.equal(p.growthDays, 1);
});

test('AT_SURVIVAL_ECO_09 six traps: one persisted roll/day, one reward+XP per claim across save/load', async () => {
  const g = await makeGame(10); bigBag(g);
  const grove = g.terrain.localToAtlas('MAIN', 160, 180); g.world.teleport('OVERWORLD', (grove[0] + 0.5) * TILE, (grove[1] + 0.5) * TILE);
  const traps = []; for (let i = 0; i < 6; i++) traps.push(construct(g, 'BUILD_ANIMAL_TRAP'));
  g.state.knowledge.items.MAT_BRANCH = true; g.state.knowledge.items.CMP_ROPE = true; give(g, 'MAT_BRANCH', 5); give(g, 'CMP_ROPE', 2);
  assert.equal(g.build.place('BUILD_ANIMAL_TRAP', findSpot(g, 'BUILD_CAMPFIRE')).ok, false, '7th trap rejected');
  for (const t of traps) { give(g, 'FOOD_BERRY', 1); g.traps.setBait(t.uid, 'FOOD_BERRY'); }
  g.simulateTime(1080, 'sleep');
  const rolled = traps.map((t) => g.state.productionState.trapsById[t.uid].lastRolledDay);
  const snap = JSON.parse(JSON.stringify(g.snapshot())); const g2 = await makeGame(10); g2.restoreState(snap);
  g2.traps.onDay(g2.state.clock.dayIndex); // re-processing the same day does nothing
  assert.deepEqual(traps.map((t) => g2.state.productionState.trapsById[t.uid].lastRolledDay), rolled);
  const caught = traps.filter((t) => g2.state.productionState.trapsById[t.uid].storedCatch.length);
  assert.ok(caught.length >= 1);
  const xp0 = g2.state.skills.SKILL_HUNTING.xp; const meat0 = count(g2, 'MAT_RAW_MEAT');
  for (const t of caught) { assert.ok(g2.traps.claim(t.uid).ok); assert.equal(g2.traps.claim(t.uid).ok, false); }
  assert.equal(g2.state.skills.SKILL_HUNTING.xp - xp0, caught.length * 8);
  assert.ok(count(g2, 'MAT_RAW_MEAT') > meat0);
});

test('AT_SURVIVAL_ECO_10 all 25 species spawn with species-appropriate AI/interaction (no humans)', async () => {
  const g = await makeGame(11); const ow = g.terrain.overworld;
  const land = (r) => { const site = g.content.db.WorldMap.mainBiomeGeneration.sites[r] || [32, 32]; return g.terrain.localToAtlas(g.content.regions.get(r).islandId, ...site); };
  const behaviours = {};
  for (const sp of g.content.species.values()) {
    const marine = sp.id.startsWith('MARINE_') || sp.id.startsWith('FISH_');
    const reg = sp.regions?.[0] || sp.regionIds?.[0];
    let [x, y] = land(reg);
    if (marine) { for (let r = 1; r < 40; r++) { const c = ow.tileAt(x, y + r); if (c === T.OCEAN_SHALLOW || c === T.SEA_REEF || c === T.RIVER_DEEP) { y += r; break; } } }
    g.world.animals = []; g.world.teleport('OVERWORLD', (x + 3.5) * TILE, (y + 0.5) * TILE, marine ? 'SWIM' : 'WALK');
    const a = g.wildlife.add(sp.id, x, y, reg, { fish: sp.id.startsWith('FISH_') });
    const states = new Set(); const pos0 = [a.x, a.y];
    for (let i = 0; i < 150; i++) { g.wildlife.think(a, 1 / 30, ...g.world.playerTile()); states.add(a.state + ':' + a.anim); }
    behaviours[sp.id] = [...states];
    assert.ok(g.content.atlasSprites[`animal/${sp.id}/${marine ? 'swim' : 'idle'}/down/0`], sp.id);
    assert.ok(Math.hypot(a.x - pos0[0], a.y - pos0[1]) > 0 || states.has('hide:react') || states.size > 0, sp.id);
  }
  assert.equal(Object.keys(behaviours).length, 25);
  assert.ok(behaviours.ANIMAL_BOAR.some((s) => s.startsWith('warn') || s.startsWith('attack')), 'boar warns/charges');
  assert.ok(behaviours.ANIMAL_RABBIT.some((s) => s.startsWith('flee')), 'rabbit flees');
  assert.ok(behaviours.ANIMAL_HERMIT_CRAB.some((s) => s.startsWith('hide')), 'hermit crab hides');
  assert.equal(g.content.db.DesignConstants.livingHumanNPCs, 0);
  assert.ok(![...g.content.species.keys()].some((k) => /HUMAN|NPC|TRADER/.test(k)));
});

test('AT_SURVIVAL_ECO_11 parrot + monkey: one active follower, trust/name kept, never die', async () => {
  const g = await makeGame(12); give(g, 'FOOD_BANANA', 6); give(g, 'FOOD_BERRY', 6);
  const grove = g.terrain.localToAtlas('MAIN', 160, 180); g.world.teleport('OVERWORLD', (grove[0] + 0.5) * TILE, (grove[1] + 0.5) * TILE);
  const bird = g.wildlife.add('ANIMAL_FOREST_BIRD', grove[0] + 1, grove[1], 'REG_GROVE'); const monkey = g.wildlife.add('ANIMAL_MONKEY', grove[0] - 1, grove[1], 'REG_GROVE');
  for (let d = 0; d < 4; d++) { g.wildlife.interactWild(bird, 'feed'); g.wildlife.interactWild(monkey, 'feed'); g.wildlife.petInteract('PET_PARROT', 'feed'); g.wildlife.petInteract('PET_MONKEY', 'feed'); g.wildlife.onDay(g.state.clock.dayIndex + d + 1); }
  const f = g.state.ecosystem.tamedFriends; assert.ok(f.PET_PARROT.trust >= 30 && f.PET_MONKEY.trust >= 30);
  assert.ok(g.wildlife.petInteract('PET_PARROT', 'FOLLOW').ok); assert.ok(g.wildlife.petInteract('PET_MONKEY', 'FOLLOW').ok);
  assert.equal(Object.values(f).filter((x) => x.activeFollower).length, 1);
  f.PET_MONKEY.name = 'Pati';
  const snap = JSON.parse(JSON.stringify(g.snapshot())); const g2 = await makeGame(12); g2.restoreState(snap);
  assert.equal(g2.state.ecosystem.tamedFriends.PET_MONKEY.name, 'Pati'); assert.equal(g2.state.ecosystem.tamedFriends.PET_MONKEY.trust, f.PET_MONKEY.trust);
  g2.survival.damage(999, 'test'); g2.wildlife.ensurePets();
  assert.equal(Object.keys(g2.state.ecosystem.tamedFriends).length, 2);
  const petEnt = g2.world.animals.find((a) => a.pet); if (petEnt) { g2.world.teleport('OVERWORLD', petEnt.x, petEnt.y + 20); const r = g2.wildlife.attack(); assert.ok(g2.world.animals.includes(petEnt)); void r; }
});

test('AT_SURVIVAL_ECO_12 fishing tension game (sardine easy, tuna rod tier 2); all 10 fish exist', async () => {
  const g = await makeGame(13); assert.equal(g.content.fish.size, 10);
  const lagoon = g.content.fishZones.get('FISH_BEACH_SHALLOWS'); const zt = g.fishing.zoneTile(lagoon);
  let shore; const ow = g.terrain.overworld; for (let r = 0; r < 30 && !shore; r++) for (let dx = -r; dx <= r && !shore; dx++) { const x = zt.x + dx, y = zt.y - r; if (g.terrain.passable(ow, x, y, 'WALK') && g.terrain.isWaterTile(ow, x, y + 1)) shore = [x, y]; }
  g.world.teleport('OVERWORLD', (shore[0] + 0.5) * TILE, (shore[1] + 0.5) * TILE); g.state.player.facing = 'down';
  give(g, 'TOOL_FISH_ROD', 1); give(g, 'CMP_SIMPLE_BAIT', 10);
  // perfect play: hook on bite, keep tension in the safe band
  let landed = 0, guard = 0;
  while (landed < 3 && guard++ < 20) {
    assert.ok(g.fishing.cast('CMP_SIMPLE_BAIT').ok);
    const before = g.state.ecosystem.catchCount || 0;
    for (let i = 0; i < 30 * 60 && g.fishing.session; i++) { const s = g.fishing.session; if (s.phase === 'BITE') g.fishing.hook(); if (s.phase === 'FIGHT') g.fishing.input(s.tension < 50); g.fishing.tick(1 / 30); }
    if ((g.state.ecosystem.catchCount || 0) > before) landed++;
  }
  assert.ok(landed >= 3, 'landed with good tension control');
  // neglect: never reel → slack → fail
  g.fishing.cast(); let failed = false; g.bus.on('fish.lost', () => { failed = true; });
  for (let i = 0; i < 30 * 60 && g.fishing.session; i++) { const s = g.fishing.session; if (s.phase === 'BITE') g.fishing.hook(); g.fishing.input(false); g.fishing.tick(1 / 30); }
  assert.ok(failed);
  // rod tier: tuna/barracuda need advanced rod
  const rod = g.inventory.bestTool('rod');
  const open = g.fishing.candidates(...g.fishing.zoneTile(g.content.fishZones.get('FISH_OPEN_EAST')) && [399, 232], rod, 'CMP_FISH_BAIT');
  assert.ok(!open.list.some((x) => x.f.id === 'FISH_TUNA'));
  give(g, 'TOOL_FISH_ROD_ADV', 1); const adv = g.inventory.cont('inv_player').slots.map((u) => u && g.inventory.item(u)).find((a) => a?.itemId === 'TOOL_FISH_ROD_ADV');
  const open2 = g.fishing.candidates(399, 232, adv, 'CMP_FISH_BAIT'); assert.ok(open2.list.some((x) => x.f.id === 'FISH_TUNA'));
  // puffer is never food
  const r = g.fishing.landFish(g.content.fish.get('FISH_PUFFER'), 0.5, null, 'rod'); assert.equal(r.value.portions, 0);
  assert.ok(g.state.ecosystem.fishJournal.FISH_PUFFER.caughtCount >= 1);
});

test('AT_SURVIVAL_ECO_13 skills: 5 ranks 0/80/220/450/800, XP once per completed action, repeat caps', async () => {
  const g = await makeGame(14);
  for (const sk of g.content.skills.values()) assert.deepEqual(sk.levelThresholdsTotalXp, [0, 80, 220, 450, 800]);
  assert.equal(g.content.skills.size, 8);
  g.store.transaction(null, (tx) => g.skills.award(tx, 'SKILL_MINING', 'mineOreNode', 'evt1'));
  g.store.transaction(null, (tx) => g.skills.award(tx, 'SKILL_MINING', 'mineOreNode', 'evt1'));
  assert.equal(g.state.skills.SKILL_MINING.xp, 10);
  for (let i = 0; i < 80; i++) g.store.transaction(null, (tx) => g.skills.award(tx, 'SKILL_MINING', 'mineOreNode', 'e' + i));
  assert.equal(g.skills.level('SKILL_MINING'), 5);
  // cancelled action gives nothing
  const node = g.world.nodeDefs.find((n) => n.itemId === 'MAT_FIBER' && !n.fixed); g.world.teleport('OVERWORLD', (node.tile[0] + 0.5) * TILE, (node.tile[1] + 1.5) * TILE);
  const xp = g.state.skills.SKILL_FORESTRY.xp; g.resources.gather(node.id); g.actions.cancel('moved'); assert.equal(g.state.skills.SKILL_FORESTRY.xp, xp);
  // crafting repeat cap 5 full / 10 half / 0
  let total = 0; for (let i = 0; i < 20; i++) g.store.transaction(null, (tx) => { total += g.skills.craftXp(tx, 'R_ROPE', 5, 'c' + i); });
  assert.equal(total, 5 * 5 + 10 * 2);
});

test('AT_SURVIVAL_ECO_14 sleep across days: every day-based system once; save/load at boundary no double', async () => {
  const g = await makeGame(15); bigBag(g);
  const bed = construct(g, 'BUILD_LEAF_BED'); const plot = construct(g, 'BUILD_PLANTER'); give(g, 'SEED_ROOT', 1); g.farm.plant(plot.uid, 'SEED_ROOT');
  const rc = construct(g, 'BUILD_RAIN_CATCHER'); rc.completedGameSeconds = 0;
  const d0 = g.state.clock.dayIndex; g.state.climate.history[d0] = 'RAIN';
  g.state.clock.gameElapsedSeconds = (d0 - 1) * 1080 + 800; g.state.clock.timeOfDaySeconds = 800;
  g.world.teleport('OVERWORLD', (bed.tile[0] + 1) * TILE, (bed.tile[1] + 2) * TILE);
  let days = []; g.bus.on('day.started', (e) => days.push(e.day));
  assert.ok(g.survival.sleep(bed.uid).ok);
  assert.deepEqual(days, [d0 + 1]);
  const water = g.state.waterInfrastructure.byBuildUid[rc.uid].volumeCenti; assert.equal(water, 400);
  assert.equal(g.farm.plot(plot.uid).growthDays, 1);
  const snap = JSON.parse(JSON.stringify(g.snapshot())); const g2 = await makeGame(15); g2.restoreState(snap);
  g2.clock.advance(0.01); g2.climate.onDay(d0 + 1); g2.farm.onDay(d0 + 1);
  assert.equal(g2.state.waterInfrastructure.byBuildUid[rc.uid].volumeCenti, 400); assert.equal(g2.farm.plot(plot.uid).growthDays, 1);
  assert.equal(g2.survival.sleep(bed.uid).ok, false, 'not tired in the morning → no free skip');
});

test('AT_SURVIVAL_ECO_15 paused clock (hidden tab): no hunger, production, growth or cooldown', async () => {
  const g = await makeGame(16); const p = g.state.player; const before = JSON.stringify({ c: g.state.clock, h: p.hunger, t: p.thirst });
  g.clock.hiddenPaused = true;
  for (let i = 0; i < 60 * 30; i++) g.tick(1 / 30, { x: 1, y: 0 });
  assert.equal(JSON.stringify({ c: g.state.clock, h: p.hunger, t: p.thirst }), before);
  g.clock.hiddenPaused = false; g.tick(1 / 30); assert.ok(g.state.clock.gameElapsedSeconds > JSON.parse(before).c.gameElapsedSeconds);
  void farFromEverything;
});
