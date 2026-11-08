// Shared test helpers operating through the real command APIs.
import { TILE } from '../../src/world/TerrainSystem.js';
import { finishAction, placeNear } from './make-game.mjs';
export { finishAction, placeNear };

export function give(g, itemId, qty) {
  const r = g.store.transaction(null, (tx) => g.inventory.addAll(tx, 'inv_player', itemId, qty));
  if (!r.ok) throw new Error(`give ${itemId} x${qty}: ${r.code}`);
}
export function bigBag(g) { give(g, 'EQ_BAG_LARGE', 1); const uid = g.inventory.cont('inv_player').slots.find((u) => u && g.inventory.item(u).itemId === 'EQ_BAG_LARGE'); g.store.transaction(null, (tx) => g.inventory.equip(tx, uid)); }
export function count(g, id) { return g.inventory.count(['inv_player'], id); }

/** Find a valid placement tile near the player by spiral search. */
export function findSpot(g, buildId, recipeId = null, from = null) {
  const [px, py] = from || g.world.playerTile();
  for (let r = 2; r < 40; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const t = [px + dx, py + dy];
    if (!g.build.validatePlacement(buildId, t, recipeId).length) return t;
  }
  throw new Error('no spot for ' + buildId);
}
/** Place, deliver all stages from player inventory, finish construction. Returns building. */
export function construct(g, buildId, { recipeId = null, tile = null, give: doGive = true } = {}) {
  const def = g.content.builds.get(buildId); const r = g.content.recipes.get(recipeId || def.recipeId);
  g.state.knowledge.items[r.unlock.split(':')[1]] = true;
  if (r.station !== 'HAND') g.state.knowledge.stations[r.station] = true;
  if (r.unlock.startsWith('BP:') && !g.state.story.learnedBlueprints.includes(r.unlock.slice(3))) g.state.story.learnedBlueprints.push(r.unlock.slice(3));
  if (doGive) for (const [id, n] of Object.entries(r.inputs)) give(g, id, n);
  const spot = tile || findSpot(g, buildId, r.id);
  const pl = g.build.place(buildId, spot, { recipeId: r.id });
  if (!pl.ok) throw new Error(`place ${buildId}: ${pl.code} ${pl.reasons || ''}`);
  const b = pl.value;
  let guard = 0; while (b.stage === 'site' && !g.build.isFullyDelivered(b) && guard++ < 10) { const d = g.build.deliver(b.uid); if (!d.ok) throw new Error('deliver ' + d.code); }
  const c = g.build.complete(b.uid); if (!c.ok) throw new Error('complete ' + c.code);
  return b;
}
/** Run a station craft to completion (time advance) and claim. */
export function craftAt(g, recipeId, stationUid = 'HAND', qty = 1) {
  const r = g.craft.start(recipeId, stationUid, qty);
  if (!r.ok) throw new Error(`craft ${recipeId}: ${r.code} ${(r.reasons || []).join(';')}`);
  for (let i = 0; i < 200 && !r.value.completed; i++) g.craft.tick(1);
  if (!r.value.claimed) g.craft.claim(stationUid, r.value.uid);
  return r.value;
}

export function solvePuzzle(g, pz) {
  const def = g.content.puzzles.get(pz); const st = g.puzzles.stateOf(pz); st.uiState = JSON.parse(JSON.stringify(def.stateSchema));
  const sol = def.solution; const key = Object.keys(sol)[0];
  const mod = { THREE_PINS: 4, THREE_ROTATORS: 4, FOUR_CONNECTORS: 4, TWO_ROTATORS: 4, THREE_DIALS: 6 }[def.uiWidget];
  if (def.uiWidget === 'THREE_TOGGLE') sol.valves.forEach((v, i) => { if (v) g.puzzles.action(pz, def.allowedActions[i]); });
  else if (def.uiWidget === 'TWO_ROTATORS') sol.wheelAngles.forEach((v, i) => { for (let k = 0; k < v; k++) g.puzzles.action(pz, 'ROTATE_RIGHT', i); });
  else if (def.uiWidget.endsWith('SEQUENCE')) sol[key].forEach((s) => g.puzzles.action(pz, def.uiWidget === 'THREE_SEQUENCE' ? 'SELECT_' + s : s));
  else sol[key].forEach((v, i) => { for (let k = 0; k < v % mod; k++) g.puzzles.action(pz, def.allowedActions[i]); });
  return g.state.story.puzzlesById[pz].solved;
}


export function placeBoat(g) {
  const ex = Object.values(g.state.buildingState.byId).find((b) => b.buildId === 'BUILD_ESCAPE_BOAT'); if (ex) return ex;
  g.state.story.specialItemsGranted.push('SPC_CHART_COAST', 'SPC_CHART_OBSERVATORY'); give(g, 'SAL_BOTTLE', 4);
  const route = g.content.seaRoutes.get('SEA_TO_WRECK'); const shore = g.terrain.localToAtlas('MAIN', ...route.departureDock.shoreFootTileLocal);
  g.world.teleport('OVERWORLD', (shore[0] + 0.5) * TILE, (shore[1] + 0.5) * TILE);
  return construct(g, 'BUILD_ESCAPE_BOAT');
}

