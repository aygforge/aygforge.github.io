// Three real cave raster maps: enter/exit with PREPARED→COMMITTED transition checkpoints, interior bonus
// crates (rolled once), gated optional discoveries, guaranteed exit (no torch/tool needed to leave).
import { TILE } from '../world/TerrainSystem.js';
import { Sfc32 } from '../core/RngStreams.js';
import { hmacSha256 } from '../core/util.js';

export class CaveScene {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }
  cave(id) { return this.c.caves.get(id); }

  enter(caveId) {
    const cv = this.cave(caveId);
    const [ex, ey] = cv.entryTile;
    this.g.router.transition('ENTER_CAVE', caveId, [(ex + 0.5) * TILE, (ey + 0.5) * TILE], 'WALK');
    if (!this.s.world.caveVisits[caveId]) this.s.world.caveVisits[caveId] = { visits: 0 };
    this.s.world.caveVisits[caveId].visits++;
    this.g.bus.emit('cave.entered', { caveId, name: cv.name });
    return { ok: true };
  }
  exit() {
    const caveId = this.g.world.sceneId; const cv = this.cave(caveId); if (!cv) return { ok: false };
    const [ax, ay] = this.g.terrain.localToAtlas('MAIN', ...cv.returnToWorld.worldTileLocal);
    const g = this.g.terrain.overworld;
    const spot = this.g.pathfinder.nearestTile(g, ax, ay + 1, (x, y) => this.g.terrain.passable(g, x, y, 'WALK'), 6) || [ax, ay];
    this.g.router.transition('EXIT_CAVE', 'OVERWORLD', [(spot[0] + 0.5) * TILE, (spot[1] + 0.5) * TILE], 'WALK');
    this.g.bus.emit('cave.exited', { caveId });
    return { ok: true };
  }
  exitTile(caveId) { return this.cave(caveId).returnTile; }

  /** Interactables inside caves: exit, crates, gated side discoveries. */
  interactables(caveId, tx, ty, range) {
    const cv = this.cave(caveId); const out = [];
    const [rx, ry] = cv.returnTile; const [ex, ey] = cv.entryTile;
    for (const [x, y] of [[rx, ry], [ex, ey]]) {
      const d = Math.hypot(x + 0.5 - tx, y + 0.5 - ty);
      if (d <= range + 0.6) { out.push({ kind: 'cave_exit', id: caveId, d, label: 'Mağaradan çık', tile: [x, y] }); break; }
    }
    for (const o of cv.objects) {
      if (o.type === 'resource') continue;
      const d = Math.hypot(o.tile[0] + 0.5 - tx, o.tile[1] + 0.5 - ty);
      if (d > range + 0.3) continue;
      const opened = this.s.story.caveChests[`${caveId}:${o.id}`];
      if (opened) continue;
      out.push({ kind: 'cave_obj', id: `${caveId}:${o.id}`, d, label: `Aç: ${o.type === 'chest' ? 'Eski sandık' : 'Gizli cep'}`, tile: o.tile });
    }
    for (const gd of cv.gatedSideDiscoveries || []) {
      const d = Math.hypot(gd.tile[0] + 0.5 - tx, gd.tile[1] + 0.5 - ty);
      if (d > range + 0.3 || this.s.story.caveChests[`${caveId}:${gd.id}`]) continue;
      out.push({ kind: 'cave_gated', id: `${caveId}:${gd.id}`, d, label: `İncele (${this.c.itemName(gd.toolRequired)})`, tile: gd.tile });
    }
    return out;
  }

  openObject(key) {
    const [caveId, objId] = key.split(':');
    const cv = this.cave(caveId);
    const o = cv.objects.find((x) => x.id === objId) || (cv.gatedSideDiscoveries || []).find((x) => x.id === objId);
    if (!o) return { ok: false };
    if (o.toolRequired && !this.g.inventory.hasItem(o.toolRequired)) { this.g.bus.emit('ui.error', { text: `Gerekli: ${this.c.itemName(o.toolRequired)}` }); return { ok: false }; }
    for (const req of o.requires || []) if (req.startsWith('TOOL_') && !this.g.inventory.hasItem(req)) { this.g.bus.emit('ui.error', { text: `Gerekli: ${this.c.itemName(req)}` }); return { ok: false }; }
    const claimKey = o.claimKey || `${key}:claim`;
    return this.g.store.transaction(`CAVEOBJ:${key}`, (tx) => {
      this.g.store.claim(tx, claimKey);
      tx.set(this.s.story.caveChests, key, true);
      const poolId = o.lootPoolId || (caveId === 'CAVE_COPPER' ? 'LP_MINING_COMMON' : caveId === 'CAVE_BATS' ? 'LP_MOUNTAIN_COMMON' : 'LP_RARE_SALVAGE');
      const h = hmacSha256(String(this.s.world.worldSeed), `${key}:${this.c.db.LootTableDB.meta.version}`);
      const dv = new DataView(h.buffer);
      const rng = new Sfc32([dv.getUint32(0), dv.getUint32(4), dv.getUint32(8), dv.getUint32(12) | 1]);
      const pool = this.c.lootPools.get(poolId);
      const avail = pool.entries.slice(); const items = {};
      for (let i = 0; i < 2 && avail.length; i++) { const e = rng.weighted(avail); avail.splice(avail.indexOf(e), 1); items[e.itemId] = rng.int(e.min, e.max); }
      for (const [id, n] of Object.entries(items)) this.g.giveOrDrop(tx, id, n);
      tx.emit('cave.loot', { key, items });
    });
  }
}
