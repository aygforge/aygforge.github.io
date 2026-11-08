// Main island + 3 islets + caves in one coordinate service: player movement (walk/sprint/swim/dive/raft),
// tap-to-approach A* (joystick cancels), node/buildings/POI spatial queries, interaction targeting.
import { TILE, T } from '../world/TerrainSystem.js';
import { EntityIndex, generateNodeDefs } from '../world/EntityIndex.js';
import { facingFromVec, clamp } from '../core/util.js';

export const INTERACT_RANGE = 1.7; // tiles

export class WorldScene {
  constructor(game) {
    this.g = game;
    this.terrain = game.terrain; this.pf = game.pathfinder;
    this.index = new EntityIndex();
    this.nodeDefs = generateNodeDefs(game.content, this.terrain, game.store.state.world.worldSeed);
    this.nodeById = new Map(this.nodeDefs.map((n) => [n.id, n]));
    this.nodeTile = new Map();
    this.path = null; this.pathTarget = null;
    this.animals = [];
    this.fx = [];
    this.indexNodes();
    this.applyNodeSolids();
    this.ensureCriticalConnectivity();
  }
  get s() { return this.g.store.state; }
  get p() { return this.g.store.state.player; }
  get sceneId() { return this.s.player.sceneId; }
  get grid() { return this.terrain.grid(this.sceneId); }

  // ---------- nodes ----------
  indexNodes() {
    this.index.clear(); this.nodeTile.clear();
    for (const n of this.nodeDefs) { this.index.add(n.sceneId, n.tile[0], n.tile[1], { type: 'node', id: n.id }); this.nodeTile.set(`${n.sceneId}:${n.tile[0]}:${n.tile[1]}`, n); }
  }
  nodeAtTile(x, y, scene = 'OVERWORLD') { return this.nodeTile.get(`${scene}:${x}:${y}`) || null; }
  nodeState(id) { return this.s.productionState.resourceNodesById[id]; }
  nodeReady(n) { const st = this.nodeState(n.id); return !st || !st.depleted; }
  applyNodeSolids() {
    for (const n of this.nodeDefs) {
      if (!n.solid || n.nonSolidOverride) continue;
      const g = this.terrain.grid(n.sceneId);
      if (n._solidApplied) continue;
      g.solid[g.i(n.tile[0], n.tile[1])]++; n._solidApplied = true;
    }
  }
  /** RISK_01: trees/rocks must never cut off mandatory POIs, landings, cave entrances. */
  ensureCriticalConnectivity() {
    const g = this.terrain.overworld; const c = this.g.content;
    const targets = [];
    for (const a of c.db.CollisionNavDB.poiApproachAnchors) targets.push([a.islandId, a.footApproachTile]);
    for (const [k, v] of Object.entries(c.db.WorldMap.mainBiomeGeneration.sites)) targets.push(['MAIN', v, k]);
    for (const cv of c.db.CaveDB.caves) targets.push(['MAIN', cv.returnToWorld.worldTileLocal]);
    for (const r of c.db.NavigationDB.seaRoutes) targets.push(['MAIN', r.departureDock.shoreFootTileLocal]);
    const starts = { MAIN: [122, 220], ...c.db.NavigationDB.satelliteDockLandings };
    let fixed = 0;
    for (const [isl, tl] of targets) {
      const s = this.terrain.localToAtlas(isl, ...starts[isl]);
      const t = this.terrain.localToAtlas(isl, ...tl);
      const path = this.pf.findPath(g, s, t, { adjacentOk: true, radius: 2 });
      if (path) continue;
      // path ignoring node solids, then clear blockers on it
      for (const n of this.nodeDefs) if (n._solidApplied && n.sceneId === 'OVERWORLD') g.solid[g.i(n.tile[0], n.tile[1])]--;
      const p2 = this.pf.findPath(g, s, t, { adjacentOk: true, radius: 2 });
      for (const n of this.nodeDefs) if (n._solidApplied && n.sceneId === 'OVERWORLD') g.solid[g.i(n.tile[0], n.tile[1])]++;
      if (!p2) continue;
      for (const [x, y] of p2) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const n = this.nodeAtTile(x + dx, y + dy);
          if (n && n._solidApplied) { g.solid[g.i(n.tile[0], n.tile[1])]--; n._solidApplied = false; n.nonSolidOverride = true; fixed++; }
        }
      }
    }
    this.connectivityFixes = fixed;
  }

  // ---------- coordinates ----------
  playerTile() { const [x, y] = this.p.positionPx; return [Math.floor(x / TILE), Math.floor(y / TILE)]; }
  islandId() { if (this.sceneId !== 'OVERWORLD') return null; const [x, y] = this.playerTile(); return this.terrain.islandAt(x, y); }
  regionId() { const [x, y] = this.playerTile(); return this.terrain.regionAt(this.sceneId, x, y); }
  logicalScene() {
    if (this.sceneId.startsWith('CAVE_')) return 'SC_CAVE_MINES';
    if (this.p.mode === 'RAFT') return 'SC_OCEAN_ROUTE';
    const isl = this.islandId();
    if (isl && isl !== 'MAIN') return 'SC_ISLETS';
    if (!isl) return 'SC_OCEAN_ROUTE';
    return 'SC_WORLD_MAIN';
  }
  playerDistToRect(b) {
    const [px, py] = this.p.positionPx; const tx = px / TILE, ty = py / TILE;
    const dx = Math.max(b.tile[0] - tx, 0, tx - (b.tile[0] + b.w)); const dy = Math.max(b.tile[1] - ty, 0, ty - (b.tile[1] + b.h));
    return Math.hypot(dx, dy);
  }
  distToTile(x, y) { const [px, py] = this.p.positionPx; return Math.hypot(px / TILE - (x + 0.5), py / TILE - (y + 0.5)); }

  // ---------- movement ----------
  /** input: {x,y,sprint} normalized joystick/keys. Returns true if moved. */
  movePlayer(input, dt) {
    const p = this.p; const g = this.grid;
    if (p.mode === 'SLEEP') return false;
    let { x: ix, y: iy } = input;
    const manual = Math.hypot(ix, iy) > 0.15;
    if (manual && this.path) { this.path = null; this.pathTarget = null; this.g.bus.emit('path.cancelled', {}); }
    if (!manual && this.path) {
      const [nx, ny] = this.path[0];
      const tx = (nx + 0.5) * TILE, ty = (ny + 0.5) * TILE;
      const dx = tx - p.positionPx[0], dy = ty - p.positionPx[1];
      const d = Math.hypot(dx, dy);
      if (d < 3) { this.path.shift(); if (!this.path.length) { this.path = null; this.onArrive(); } return true; }
      ix = dx / d; iy = dy / d;
    }
    const mag = Math.hypot(ix, iy);
    if (mag < 0.15) { this.moving = false; return false; }
    if (mag > 1) { ix /= mag; iy /= mag; }
    if (p.action) this.g.actions.cancel('moved');
    const modes = this.g.content.db.TerrainDB.movementModes;
    let speed;
    const sprintWanted = !!input.sprint && p.mode === 'WALK';
    let sprinting = false;
    if (p.mode === 'RAFT') speed = modes.RAFT.basePxPerSec * this.g.climate.boatSpeedMul();
    else if (p.mode === 'SWIM') speed = modes.SWIM.basePxPerSec;
    else if (p.mode === 'DIVE') speed = modes.DIVE.basePxPerSec;
    else {
      sprinting = sprintWanted && (p.sprintLatched ? p.stamina > 0 : p.stamina >= modes.SPRINT.minimumStaminaToStart);
      speed = sprinting ? modes.SPRINT.basePxPerSec : modes.WALK.basePxPerSec;
      const [tx, ty] = this.playerTile();
      let mul = this.terrain.speedMul(g, tx, ty);
      if (mul < 1 && this.g.inventory.equipped('feet')?.itemId === 'EQ_LEATHER_BOOTS' && [T.SWAMP_SOIL, T.WETLAND_WADE].includes(g.tileAt(tx, ty))) mul = Math.min(1, mul + 0.2);
      if (g.road[g.i(tx, ty)] && !g.isCave) mul = Math.max(mul, 1.1);
      speed *= mul * this.g.climate.moveSpeedMul();
    }
    p.sprintLatched = sprinting;
    let mode = p.mode === 'RAFT' ? 'RAFT' : (p.mode === 'SWIM' || p.mode === 'DIVE') ? 'SWIM' : 'WALK';
    const before = [...p.positionPx];
    // safety net: a walker whose foot box already overlaps water (tide change, old save, shoreline edge case) moves with
    // swim collision for this step so it can always step free instead of being locked in place
    if (mode === 'WALK' && !g.isCave && !this.pf.boxFree(g, before[0], before[1], 'WALK', null) && this.pf.boxFree(g, before[0], before[1], 'SWIM', null)) mode = 'SWIM';
    let [nx, ny] = this.pf.move(g, p.positionPx[0], p.positionPx[1], ix * speed * dt, iy * speed * dt, mode);
    // walking into swimmable water switches to SWIM (shallow ocean / deep river / wetland)
    if (mode === 'WALK' && nx === before[0] && ny === before[1]) {
      const tx = Math.floor((before[0] + ix * 12) / TILE), ty = Math.floor((before[1] + iy * 12) / TILE);
      if (this.terrain.needsSwim(g, tx, ty) && this.terrain.passable(g, tx, ty, 'SWIM') && this.canSwimTo(tx, ty)) {
        p.mode = 'SWIM'; this.g.bus.emit('mode.changed', { mode: 'SWIM' });
        [nx, ny] = this.pf.move(g, before[0], before[1], ix * speed * dt, iy * speed * dt, 'SWIM');
      }
    }
    if (mode === 'SWIM') {
      const tx = Math.floor(nx / TILE), ty = Math.floor(ny / TILE);
      if (!this.canSwimTo(tx, ty)) { nx = before[0]; ny = before[1]; this.g.bus.emit('ui.toast', { text: 'Akıntı çok güçlü — açık denize sal ile çık', key: 'current' }); }
      else if (!this.terrain.needsSwim(g, tx, ty) && this.terrain.passable(g, tx, ty, 'WALK') && this.pf.boxFree(g, nx, ny, 'WALK', null)) {
        // leave the water only when the whole foot box stands on walkable ground (else WALK collision would lock the player)
        if (p.mode !== 'WALK') { p.mode = 'WALK'; p.oxygen = 100; this.g.bus.emit('mode.changed', { mode: 'WALK' }); }
      }
    }
    p.positionPx[0] = nx; p.positionPx[1] = ny;
    const moved = Math.hypot(nx - before[0], ny - before[1]);
    this.moving = moved > 0.01;
    this.sprintingNow = sprinting && this.moving;
    p.facing = facingFromVec(ix, iy, p.facing);
    if (this.moving) this.g.exploration?.onPlayerMoved();
    if (this.path && !this.moving) this.stuckFrames = (this.stuckFrames || 0) + 1; else this.stuckFrames = 0;
    if (this.stuckFrames > 20) { this.path = null; this.g.bus.emit('ui.toast', { text: 'Yol kapalı — elle yönlendir' }); }
    return this.moving;
  }

  canSwimTo(tx, ty) {
    if (this.sceneId !== 'OVERWORLD') return true;
    const g = this.grid; if (!g.inb(tx, ty)) return false;
    return g.coastDist[g.i(tx, ty)] <= 7;
  }

  /** Tap-to-approach: A* to a tile adjacent to target. */
  approach(tile, onArrive = null, radius = 0) {
    const g = this.grid; const start = this.playerTile();
    const mode = this.p.mode === 'RAFT' ? 'RAFT' : this.p.mode === 'SWIM' ? 'SWIM' : 'WALK';
    const path = this.pf.findPath(g, start, tile, { mode, adjacentOk: true, maxNodes: 40000, radius });
    if (!path) { this.g.bus.emit('ui.toast', { text: 'Oraya yürüyerek ulaşılamıyor' }); this.g.audio?.play('snd_ui_error'); return false; }
    path.shift();
    this.path = path.length ? path : null; this.pathTarget = tile; this.onArriveCb = onArrive;
    if (!this.path) this.onArrive();
    return true;
  }
  onArrive() { const cb = this.onArriveCb; this.onArriveCb = null; if (cb) cb(); }

  teleport(sceneId, px, py, mode = 'WALK') {
    const p = this.p; p.sceneId = sceneId; p.positionPx = [px, py]; p.mode = mode; this.path = null;
    this.animals = this.animals.filter((a) => a.pet);
    this.g.bus.emit('scene.changed', { sceneId });
  }

  // ---------- interaction targeting ----------
  /** All interactables near the player (sorted by distance, facing preference). */
  interactables(range = INTERACT_RANGE) {
    const [px, py] = this.p.positionPx; const scene = this.sceneId;
    const tx = px / TILE, ty = py / TILE;
    const out = [];
    const r = Math.ceil(range) + 4;
    for (const ref of this.index.query(scene, tx - r, ty - r, tx + r, ty + r)) {
      if (ref.type === 'node') {
        const n = this.nodeById.get(ref.id); if (!this.nodeReady(n)) continue;
        const d = Math.hypot(n.tile[0] + 0.5 - tx, n.tile[1] + 0.5 - ty);
        if (d <= range + 0.3) out.push({ kind: 'node', id: n.id, d, label: this.g.resources.label(n), tile: n.tile });
      }
    }
    for (const b of Object.values(this.s.buildingState.byId)) {
      if (b.sceneId !== scene) continue;
      const d = this.playerDistToRect(b);
      if (d <= range) out.push({ kind: 'build', id: b.uid, d, label: this.g.interactLabelForBuild(b), tile: b.tile });
    }
    for (const poi of this.g.exploration.poisInScene(scene)) {
      const d = Math.hypot(poi.ax + 0.5 - tx, poi.ay + 0.5 - ty);
      const rr = Math.max(range, poi.radius);
      if (d <= rr) out.push({ kind: 'poi', id: poi.id, d, label: this.g.exploration.label(poi.id), tile: [poi.ax, poi.ay] });
    }
    for (const a of this.animals) {
      const d = Math.hypot(a.x / TILE - tx, a.y / TILE - ty);
      if (d <= range + 1.2) out.push({ kind: 'animal', id: a.id, d, label: this.g.wildlife.label(a), tile: [Math.floor(a.x / TILE), Math.floor(a.y / TILE)] });
    }
    for (const bag of Object.values(this.s.world.dropBags || {})) {
      if (bag.sceneId !== scene) continue;
      const d = Math.hypot(bag.tile[0] + 0.5 - tx, bag.tile[1] + 0.5 - ty);
      if (d <= range) out.push({ kind: 'bag', id: bag.id, d, label: 'Düşen çanta', tile: bag.tile });
    }
    if (scene === 'OVERWORLD') for (const f of Object.values(this.s.world.flotsam || {})) {
      const d = Math.hypot(f.tile[0] + 0.5 - tx, f.tile[1] + 0.5 - ty);
      if (d <= range + 0.3) out.push({ kind: 'flotsam', id: f.id, d, label: 'Kıyıya vuran enkazı topla', tile: f.tile });
    }
    const extra = this.g.extraInteractables(scene, tx, ty, range);
    out.push(...extra);
    // facing bias
    const fv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.p.facing];
    for (const o of out) {
      const vx = o.tile[0] + 0.5 - tx, vy = o.tile[1] + 0.5 - ty; const len = Math.hypot(vx, vy) || 1;
      o.score = o.d - 0.4 * ((vx * fv[0] + vy * fv[1]) / len);
    }
    out.sort((a, b) => a.score - b.score);
    return out;
  }

  // water source next to player (fresh river shore, sea)
  waterNearby() {
    const g = this.grid; const [tx, ty] = this.playerTile();
    let fresh = false, sea = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const code = g.tileAt(tx + dx, ty + dy);
      if (g.isCave) { if (code === 3 || code === 4) fresh = true; continue; }
      if ([T.RIVER_DEEP, T.RIVER_FORD, T.WETLAND_WADE, T.RIVER_BANK].includes(code)) fresh = true;
      if ([T.OCEAN_SHALLOW, T.OCEAN_DEEP, T.SEA_REEF].includes(code)) sea = true;
    }
    return { fresh, sea };
  }

  onBuildingsChanged() { this.g.bus.emit('world.buildings', {}); }

  tryOpenWinch(tx, b) {
    const gate = this.g.content.db.CollisionNavDB.gates.find((gg) => gg.id === 'GATE_CLIMB');
    const [gx, gy] = this.terrain.localToAtlas('MAIN', ...gate.tileMainLocal);
    if (Math.hypot(b.tile[0] - gx, b.tile[1] - gy) <= 8) this.g.exploration.openShortcut(tx, 'GATE_CLIMB');
  }

  spawnFx(id, x, y, life = 0.6) { if (this.fx.length < 40) this.fx.push({ id, x, y, t: 0, life }); }
  tickFx(dt) { for (const f of this.fx) f.t += dt; this.fx = this.fx.filter((f) => f.t < f.life); }

  clampToGrid() { const g = this.grid; const p = this.p; p.positionPx[0] = clamp(p.positionPx[0], 16, g.w * TILE - 16); p.positionPx[1] = clamp(p.positionPx[1], 16, g.h * TILE - 16); }
}
