import { getContent } from './node-content.mjs';
import { Game, newGameState } from '../../src/core/Game.js';
import { TILE } from '../../src/world/TerrainSystem.js';
export async function makeGame(seed = 42, slot = 'slot-1') {
  const content = await getContent();
  const g = new Game(content, newGameState(content, { slotId: slot, seed }));
  return g;
}
/** Teleport player next to a tile (test utility) */
export function placeNear(g, tile, scene = 'OVERWORLD') {
  const gr = g.terrain.grid(scene);
  const spot = g.pathfinder.nearestTile(gr, tile[0], tile[1] + 1, (x, y) => g.terrain.passable(gr, x, y, 'WALK') && Math.hypot(x - tile[0], y - tile[1]) >= 1, 4);
  g.world.teleport(scene, (spot[0] + 0.5) * TILE, (spot[1] + 0.5) * TILE, 'WALK');
  return spot;
}
/** Run timed action to completion */
export function finishAction(g) { let n = 0; while (g.state.player.action && n++ < 2000) g.actions.tick(0.1); }
