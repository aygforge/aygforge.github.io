// Canvas2D world renderer: cached 16×16-tile terrain chunks with transitions, animated water overlay,
// deterministic decor, y-sorted entities (nodes, builds, POIs, animals, avatar layers), roof fade inside houses,
// canopy fade over player, weather, day/night + light sources, cave darkness, fx, sea/radio finale views.
import { TILE, T } from '../world/TerrainSystem.js';
import { fastHash } from '../core/util.js';
import { HOUSES } from '../systems/BuildSystem.js';

const CH = 16;
const TERRAIN_NAMES = ['OCEAN_DEEP', 'OCEAN_SHALLOW', 'BEACH_SAND', 'MEADOW', 'GROVE', 'FOREST_FLOOR', 'SWAMP_SOIL', 'ROCKY_GROUND', 'MOUNTAIN_SOIL', 'SETTLEMENT_GROUND', 'LAGOON_SOIL', 'WETLAND_WADE', 'RIVER_DEEP', 'RIVER_FORD', 'DIRT_TRAIL', 'CLIFF_WALL', 'TIDAL_SANDBAR', 'REED_PATCH', 'SEA_REEF', 'RIVER_BANK'];
const CAVE_TILE_TERRAIN = ['CLIFF_WALL', 'MOUNTAIN_SOIL', 'DIRT_TRAIL', 'OCEAN_SHALLOW', 'OCEAN_DEEP', 'ROCKY_GROUND', 'SWAMP_SOIL'];
const WATER_CODES = new Set([T.OCEAN_DEEP, T.OCEAN_SHALLOW, T.RIVER_DEEP, T.WETLAND_WADE, T.SEA_REEF]);
const HELD = { AXE: 'axe', PICK: 'pickaxe', SPEAR: 'spear', BOW: 'bow', ROD: 'fishing_rod', ADV: 'fishing_rod', KNIFE: 'knife', MACHETE: 'machete', TORCH: 'torch', LAMP: 'torch', SHOVEL: 'hammer', CROWBAR: 'hammer', KIT: 'hammer' };
const CLIP_FPS = { idle: 4, walk: 10, run: 14, chop: 10, mine: 10, gather: 8, spear: 10, bow: 8, eat: 8, fish_cast: 10, fish_idle: 4, fish_reel: 10, swim: 8, hurt: 10, sleep: 2, build: 10 };
const LIGHTS = { BUILD_CAMPFIRE: 120, BUILD_LAMP_POST: 110, BUILD_KILN: 70, BUILD_SMELTER: 80 };

export class WorldRenderer {
  constructor(canvas, game, atlas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.g = game; this.atlas = atlas;
    this.chunks = new Map(); this.decor = new Map(); this.time = 0; this.scale = 2; this.quality = 'HIGH';
    this.dark = document.createElement('canvas'); this.rain = [];
    this.anchors = null;
  }
  setAnchors(a) { this.anchors = a; }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(this.cv.clientWidth * dpr), h = Math.floor(this.cv.clientHeight * dpr);
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    this.scale = Math.max(1, Math.round(h / 400));
    this.ctx.imageSmoothingEnabled = false;
  }
  invalidate() { this.chunks.clear(); this.decor.clear(); }

  // ---------- terrain chunks ----------
  chunk(scene, cx, cy) {
    const key = `${scene}:${cx}:${cy}`; let c = this.chunks.get(key); if (c) return c;
    if (this.chunks.size > 80) { const k = this.chunks.keys().next().value; this.chunks.delete(k); }
    const g = this.g.terrain.grid(scene);
    c = document.createElement('canvas'); c.width = CH * TILE; c.height = CH * TILE;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CH; tx++) {
      const wx = cx * CH + tx, wy = cy * CH + ty; if (!g.inb(wx, wy)) continue;
      const code = g.tiles[g.i(wx, wy)];
      const name = g.isCave ? CAVE_TILE_TERRAIN[code] : TERRAIN_NAMES[code];
      const v = fastHash(wx, wy, 7) % 4;
      this.atlas.draw(x, `terrain/${name}/${v}`, tx * TILE, ty * TILE, { ax: 0, ay: 0 });
      if (g.isCave && code === 0) { x.fillStyle = 'rgba(10,12,16,0.55)'; x.fillRect(tx * TILE, ty * TILE, TILE, TILE); }
      if (g.isCave && code === 2) { x.fillStyle = 'rgba(165,120,78,0.85)'; x.fillRect(tx * TILE, ty * TILE + 4, TILE, TILE - 8); }
      if (!g.isCave) this.transitions(x, g, wx, wy, code, tx * TILE, ty * TILE);
    }
    this.chunks.set(key, c); return c;
  }
  transitions(x, g, wx, wy, code, px, py) {
    const isW = (c) => WATER_CODES.has(c);
    const nb = (dx, dy) => g.tileAt(wx + dx, wy + dy);
    const mask = (pred) => (pred(nb(0, -1)) ? 1 : 0) | (pred(nb(1, 0)) ? 2 : 0) | (pred(nb(0, 1)) ? 4 : 0) | (pred(nb(-1, 0)) ? 8 : 0);
    if (!isW(code) && code !== T.CLIFF_WALL) { const m = mask((c) => c === T.OCEAN_SHALLOW || c === T.OCEAN_DEEP || c === T.SEA_REEF); if (m) this.atlas.draw(x, `terrain/transition/shore/${m}`, px, py, { ax: 0, ay: 0 }); }
    if (!isW(code) && code !== T.CLIFF_WALL) { const m = mask((c) => c === T.RIVER_DEEP || c === T.WETLAND_WADE); if (m) this.atlas.draw(x, `terrain/transition/river_bank/${m}`, px, py, { ax: 0, ay: 0 }); }
    if (code !== T.CLIFF_WALL) { const m = mask((c) => c === T.CLIFF_WALL); if (m) this.atlas.draw(x, `terrain/transition/cliff/${m}`, px, py, { ax: 0, ay: 0 }); }
    if (code !== T.DIRT_TRAIL && !isW(code) && g.road[g.i(wx, wy)] === 0) { const m = mask((c) => c === T.DIRT_TRAIL); if (m) this.atlas.draw(x, `terrain/transition/path/${m}`, px, py, { ax: 0, ay: 0 }); }
  }
  /** deterministic non-colliding decor per chunk */
  decorFor(scene, cx, cy) {
    const key = `${scene}:${cx}:${cy}`; let d = this.decor.get(key); if (d) return d;
    d = []; const g = this.g.terrain.grid(scene);
    for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CH; tx++) {
      const wx = cx * CH + tx, wy = cy * CH + ty; if (!g.inb(wx, wy)) continue;
      const i = g.i(wx, wy); const code = g.tiles[i]; const h = fastHash(wx, wy, 99) % 1000;
      if (g.road[i] || g.solid[i] || g.occupied?.[i] || this.g.world.nodeAtTile(wx, wy, scene)) continue;
      let id = null;
      if (g.isCave) { if (code === 0 && h < 40 && g.tileAt(wx, wy + 1) !== 0) id = `foliage/cave_stalactite/${h % 3}`; else if (code === 6 && h < 50) id = `foliage/moss/${h % 3}`; }
      else if (code === T.BEACH_SAND && h < 12) id = `foliage/palm/${h % 3}`;
      else if (code === T.GROVE && h < 30) id = h < 12 ? `foliage/palm/${h % 3}` : h < 22 ? `foliage/bamboo_cluster/${h % 3}` : `foliage/flower_bush/${h % 3}`;
      else if (code === T.FOREST_FLOOR && h < 34) id = h < 14 ? `foliage/broadleaf/${h % 3}` : h < 22 ? `foliage/vine/${h % 3}` : h < 28 ? `foliage/fallen_log/${h % 3}` : `foliage/moss/${h % 3}`;
      else if (code === T.MEADOW && h < 18) id = h < 9 ? `foliage/flower_bush/${h % 3}` : `foliage/reeds/${h % 3}`;
      else if ((code === T.SWAMP_SOIL || code === T.WETLAND_WADE) && h < 30) id = h < 12 ? `foliage/mangrove/${h % 3}` : `foliage/reeds/${h % 3}`;
      else if (code === T.REED_PATCH && h < 140) id = `foliage/reeds/${h % 3}`;
      else if (code === T.SEA_REEF && h < 90) id = `foliage/reef_coral/${h % 3}`;
      else if ((code === T.ROCKY_GROUND || code === T.MOUNTAIN_SOIL) && h < 20 && g.tileAt(wx, wy - 1) === T.CLIFF_WALL) id = `foliage/cliff_grass/${h % 3}`;
      else if (code === T.LAGOON_SOIL && h < 10) id = `foliage/palm/${h % 3}`;
      if (id) { const big = id.includes('broadleaf') || id.includes('palm') || id.includes('mangrove'); d.push({ id, x: (wx + 0.5) * TILE, y: (wy + 1) * TILE - 2, flat: id.includes('moss') || id.includes('reef') || id.includes('fallen'), tall: big }); }
    }
    this.decor.set(key, d); return d;
  }

  // ---------- frame ----------
  render(alpha, interp) {
    const g = this.g; const ctx = this.ctx; this.resize(); this.time += 1 / 60;
    if (g.finale.active) return this.renderFinale();
    const s = this.scale; const W = this.cv.width / s, H = this.cv.height / s;
    const p = g.state.player; const [px, py] = interp || p.positionPx;
    const grid = g.world.grid; const scene = g.world.sceneId;
    let camX = Math.round(px - W / 2), camY = Math.round(py - H / 2 - 12);
    camX = Math.max(0, Math.min(grid.w * TILE - W, camX)); camY = Math.max(0, Math.min(grid.h * TILE - H, camY));
    this.cam = { x: camX, y: camY, W, H, s };
    ctx.setTransform(s, 0, 0, s, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = grid.isCave ? '#0d0f12' : '#237c9f'; ctx.fillRect(0, 0, W, H);
    const cx0 = Math.floor(camX / (CH * TILE)), cy0 = Math.floor(camY / (CH * TILE)), cx1 = Math.floor((camX + W) / (CH * TILE)), cy1 = Math.floor((camY + H) / (CH * TILE));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cy < 0 || cx * CH >= grid.w || cy * CH >= grid.h) continue;
      ctx.drawImage(this.chunk(scene, cx, cy), cx * CH * TILE - camX, cy * CH * TILE - camY);
    }
    this.waterOverlay(grid, camX, camY, W, H);
    // collect drawables
    const list = []; const tx0 = Math.floor(camX / TILE) - 3, ty0 = Math.floor(camY / TILE) - 3, tx1 = Math.ceil((camX + W) / TILE) + 3, ty1 = Math.ceil((camY + H) / TILE) + 5;
    for (let cy = Math.floor(ty0 / CH); cy <= Math.floor(ty1 / CH); cy++) for (let cx = Math.floor(tx0 / CH); cx <= Math.floor(tx1 / CH); cx++) {
      if (cx < 0 || cy < 0 || cx * CH >= grid.w || cy * CH >= grid.h) continue;
      if (this.quality === 'LOW') continue;
      for (const d of this.decorFor(scene, cx, cy)) list.push({ y: d.flat ? d.y - 40 : d.y, draw: () => this.drawDecor(d, px, py) });
    }
    const ptile = g.world.playerTile();
    for (const ref of g.world.index.query(scene, tx0, ty0, tx1, ty1)) {
      const n = g.world.nodeById.get(ref.id); const ready = g.world.nodeReady(n);
      list.push({ y: (n.tile[1] + 1) * TILE - 1, draw: () => this.drawNode(n, ready, px, py) });
    }
    const house = g.build.houseAt(ptile[0], ptile[1]);
    for (const b of Object.values(g.state.buildingState.byId)) {
      if (b.sceneId !== scene || b.tile[0] > tx1 || b.tile[1] > ty1 || b.tile[0] + b.w < tx0 || b.tile[1] + b.h < ty0) continue;
      if (b.buildId === 'BUILD_RAFT' && b.stage === 'complete') continue;
      const flat = ['BUILD_PATH', 'BUILD_RUG', 'BUILD_BRIDGE', 'BUILD_PIER', 'BUILD_PLANTER'].includes(b.buildId);
      if (HOUSES.has(b.buildId) && b.stage === 'complete') {
        const inside = house === b;
        list.push({ y: (b.tile[1] + 0.4) * TILE, draw: () => this.drawHouse(b, inside, 'back') });
        list.push({ y: (b.tile[1] + b.h) * TILE, draw: () => this.drawHouse(b, inside, 'front') });
      } else list.push({ y: flat ? (b.tile[1]) * TILE - 40 : (b.tile[1] + b.h) * TILE, draw: () => this.drawBuild(b) });
    }
    for (const poi of g.exploration.poisInScene(scene)) {
      if (poi.ax < tx0 - 3 || poi.ax > tx1 + 3 || poi.ay < ty0 || poi.ay > ty1 + 3) continue;
      list.push({ y: (poi.ay + 1) * TILE, draw: () => this.atlas.draw(ctx, `poi/${poi.id}/${g.exploration.visualState(poi.id)}`, (poi.ax + 0.5) * TILE - camX, (poi.ay + 1.2) * TILE - camY, { alpha: 1 }) });
    }
    for (const a of g.world.animals) list.push({ y: a.y + (a.flying ? 30 : 0), draw: () => this.drawAnimal(a) });
    for (const bag of Object.values(g.state.world.dropBags || {})) if (bag.sceneId === scene) list.push({ y: (bag.tile[1] + 1) * TILE, draw: () => this.atlas.draw(ctx, 'icon/EQ_BAG_SMALL', (bag.tile[0] + 0.5) * TILE - camX, (bag.tile[1] + 1) * TILE - camY) });
    for (const r of Object.values(g.state.vehicles.raftsById)) {
      if (r.sceneId !== scene) continue;
      const moving = p.mode === 'RAFT' && g.state.vehicles.activeVehicleId === r.buildUid;
      const dir = moving ? p.facing : 'right'; const f = Math.floor(this.time * 5) % 8;
      list.push({ y: r.atlasPx[1] + 18, draw: () => this.atlas.draw(ctx, `boat/BUILD_RAFT/${dir}/${f}`, (moving ? px : r.atlasPx[0]) - camX, (moving ? py : r.atlasPx[1]) + 30 - camY, { scale: 0.5 }) });
    }
    if (scene === 'OVERWORLD' && g.escape.rescueAvailable()) { const [rx, ry] = g.escape.rescueBoatPx(); list.push({ y: ry, draw: () => { this.atlas.draw(ctx, `boat/BUILD_ESCAPE_BOAT/left/${Math.floor(this.time * 4) % 8}`, rx - camX, ry - camY, { scale: 0.75 }); this.atlas.draw(ctx, 'ui/warning', rx - camX, ry - 110 - camY, { scale: 0.5 }); } }); }
    if (scene === 'OVERWORLD') for (const [k] of Object.entries(g.state.waterInfrastructure.byBuildUid)) void k;
    // player
    if (p.mode !== 'RAFT') list.push({ y: py, draw: () => this.drawPlayer(px - camX, py - camY) });
    else list.push({ y: py + 20, draw: () => this.drawPlayer(px - camX, py - camY - 6, true) });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) d.draw();
    // placement ghost
    if (g.ui?.placement) this.drawPlacement(g.ui.placement);
    // path preview
    if (g.world.path && this.quality !== 'LOW') { ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (const [x, y] of g.world.path) ctx.fillRect((x + 0.5) * TILE - camX - 1, (y + 0.5) * TILE - camY - 1, 3, 3); }
    // target highlight
    const tgt = g.ui?.currentTarget;
    if (tgt) { ctx.strokeStyle = 'rgba(255,240,150,0.9)'; ctx.lineWidth = 1; const pulse = 2 + Math.sin(this.time * 6); ctx.strokeRect(tgt.tile[0] * TILE - camX - pulse, tgt.tile[1] * TILE - camY - pulse, TILE + pulse * 2, TILE + pulse * 2); }
    for (const f of g.world.fx) { const fr = Math.min(5, Math.floor((f.t / f.life) * 6)); this.atlas.draw(ctx, `${f.id}/${fr}`, f.x - camX, f.y - camY, { ay: 0.75 }); }
    this.weather(W, H);
    this.lighting(W, H, camX, camY, px, py);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  waterOverlay(grid, camX, camY, W, H) {
    if (this.quality === 'LOW') return;
    const ctx = this.ctx; const f = Math.floor(this.time * 6) % 6;
    const tx0 = Math.floor(camX / TILE), ty0 = Math.floor(camY / TILE);
    for (let ty = ty0; ty <= ty0 + H / TILE + 1; ty++) for (let tx = tx0; tx <= tx0 + W / TILE + 1; tx++) {
      if (!grid.inb(tx, ty)) continue; const code = grid.tiles[grid.i(tx, ty)];
      let id = null;
      if (grid.isCave) { if (code === 4 || code === 3) id = 'terrain/water/river/'; }
      else if (code === T.OCEAN_DEEP) { if ((tx + ty) % 2) id = 'terrain/water/deep_water/'; }
      else if (code === T.OCEAN_SHALLOW || code === T.SEA_REEF) id = 'terrain/water/shallow_water/';
      else if (code === T.RIVER_DEEP || code === T.WETLAND_WADE) id = 'terrain/water/river/';
      if (id) this.atlas.draw(ctx, id + ((f + tx + ty) % 6), tx * TILE - camX, ty * TILE - camY, { ax: 0, ay: 0 });
      if (!grid.isCave && code === T.OCEAN_SHALLOW && !WATER_CODES.has(grid.tileAt(tx, ty - 1)) && grid.tileAt(tx, ty - 1) !== T.CLIFF_WALL) this.atlas.draw(ctx, 'terrain/water/shore_foam/' + f, tx * TILE - camX, ty * TILE - camY, { ax: 0, ay: 0 });
    }
  }

  drawDecor(d, px, py) {
    const { x: cx, y: cy } = this.cam; let alpha = 1;
    if (d.tall && Math.abs(d.x - px) < 40 && py < d.y && py > d.y - 110) alpha = 0.45; // canopy fade over player
    this.atlas.draw(this.ctx, d.id, d.x - cx, d.y - cy, { alpha });
  }
  drawNode(n, ready, px, py) {
    const { x: cx, y: cy } = this.cam; const ctx = this.ctx;
    const x = (n.tile[0] + 0.5) * TILE - cx, y = (n.tile[1] + 1) * TILE - cy;
    const sid = `resource/${n.itemId}/${ready ? 'ready' : 'depleted'}`;
    if (this.atlas.has(sid)) {
      let alpha = 1; if (ready && (n.kind === 'TREE' || n.kind === 'PALM') && Math.abs(x + cx - px) < 30 && py < y + cy && py > y + cy - 64) alpha = 0.5;
      this.atlas.draw(ctx, sid, x, y + 6, { alpha });
    } else if (ready) {
      ctx.fillStyle = 'rgba(30,40,30,0.28)'; ctx.beginPath(); ctx.ellipse(x, y - 6, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
      this.atlas.draw(ctx, `icon/${n.itemId}`, x, y - 4, { scale: 0.75 });
      if (this.quality !== 'LOW' && Math.floor(this.time * 2 + n.tile[0]) % 5 === 0) { ctx.fillStyle = 'rgba(255,255,220,0.8)'; ctx.fillRect(x + 7, y - 26, 2, 2); }
    }
  }
  drawBuild(b) {
    const { x: cx, y: cy } = this.cam; const ctx = this.ctx; const g = this.g;
    const x = (b.tile[0] + b.w / 2) * TILE - cx, y = (b.tile[1] + b.h) * TILE - cy;
    if (b.stage === 'site') {
      const frac = b.stages.length ? b.stageIndex / b.stages.length : 0;
      const stageSprite = frac >= 0.5 ? `build/${b.buildId}/frame` : frac > 0 ? `build/${b.buildId}/foundation` : null;
      if (stageSprite && this.atlas.has(stageSprite)) this.atlas.draw(ctx, stageSprite, x, y);
      this.atlas.draw(ctx, `build/${b.buildId}/ghost`, x, y, { alpha: 0.85 });
      ctx.fillStyle = 'rgba(20,30,30,0.6)'; ctx.fillRect(x - 16, y + 2, 32, 4); ctx.fillStyle = '#f2d054'; ctx.fillRect(x - 16, y + 2, 32 * frac, 4);
      return;
    }
    let dy = 0;
    if (b.buildId === 'BUILD_ESCAPE_BOAT' || b.buildId === 'BUILD_PIER') dy = Math.round(Math.sin(this.time * 2) * 1);
    this.atlas.draw(ctx, `build/${b.buildId}/complete`, x, y + dy);
    const q = g.state.productionState.queuesByStation[b.uid];
    const active = q && q.entries.some((e) => !e.completed);
    const fx = `build/${b.buildId}/active_fx`;
    if ((active || b.buildId === 'BUILD_CAMPFIRE') && this.atlas.has(fx) && this.quality !== 'LOW') this.atlas.draw(ctx, fx, x, y + dy, { alpha: 0.75 + 0.25 * Math.sin(this.time * 9) });
    if (q && q.entries.some((e) => e.completed && !e.claimed)) this.atlas.draw(ctx, 'ui/success', x, y - b.h * TILE - 8, { scale: 0.4 });
    if (b.upgrades?.length) { ctx.fillStyle = '#e7c15a'; ctx.fillRect(x - 3, y - 6, 6, 3); }
    const plot = g.state.productionState.cropPlotsById[b.uid];
    if (plot?.cropId) {
      const st = g.farm.stage(plot); this.atlas.draw(ctx, `crop/${plot.cropId}/${st}`, x, y + 4, { scale: 0.62 });
      const wet = plot.wateredDay === g.state.clock.dayIndex || g.climate.state().plantRainWatered;
      this.atlas.draw(ctx, `crop/shared/${wet ? 'wet' : 'dry'}`, x, y + 2, { scale: 0.9, alpha: 0.7 });
      if (plot.fertilized) this.atlas.draw(ctx, 'crop/shared/fertilized', x, y, { scale: 0.6 });
    }
    const trap = g.state.productionState.trapsById[b.uid];
    if (trap?.storedCatch?.length) this.atlas.draw(ctx, 'ui/success', x, y - 40, { scale: 0.35 });
  }
  drawHouse(b, inside, part) {
    const { x: cx, y: cy } = this.cam; const ctx = this.ctx;
    const x = (b.tile[0] + b.w / 2) * TILE - cx, y = (b.tile[1] + b.h) * TILE - cy;
    if (part === 'back') { if (inside) { this.atlas.draw(ctx, `build/${b.buildId}/interior_floor`, x, y); this.atlas.draw(ctx, `build/${b.buildId}/interior_wall`, x, y); } return; }
    if (!inside) this.atlas.draw(ctx, `build/${b.buildId}/complete`, x, y);
    else { this.atlas.draw(ctx, `build/${b.buildId}/roof`, x, y, { alpha: 0.12 }); } // roof fades to ~0 when inside (insideRoofOpacityOnEnter)
  }
  drawAnimal(a) {
    const { x: cx, y: cy } = this.cam;
    const sp = a.speciesId; const anim = a.anim || 'idle';
    const valid = this.atlas.has(`animal/${sp}/${anim}/${a.dir}/0`) ? anim : (a.fish || sp.startsWith('MARINE_') ? 'swim' : 'idle');
    let n = 0; while (this.atlas.has(`animal/${sp}/${valid}/${a.dir}/${n}`)) n++;
    const f = Math.floor((a.animT || 0) * 8) % Math.max(1, n);
    const underwater = a.fish || sp.startsWith('MARINE_');
    this.atlas.draw(this.ctx, `animal/${sp}/${valid}/${a.dir}/${f}`, a.x - cx, a.y - cy + (a.fish ? 8 : sp.startsWith('MARINE') ? 24 : 8) - (a.flying ? 14 : 0), { alpha: underwater ? 0.75 : 1 });
    if (a.pet) { this.ctx.fillStyle = '#ffd04a'; this.ctx.fillRect(a.x - cx - 2, a.y - cy - 40, 4, 4); }
  }

  playerClip() {
    const p = this.g.state.player; const w = this.g.world;
    if (p.mode === 'SLEEP') return 'sleep';
    if (p.hurtT > 0) return 'hurt';
    if (p.mode === 'SWIM' || p.mode === 'DIVE') return 'swim';
    if (this.g.fishing.session) { const ph = this.g.fishing.session.phase; return ph === 'FIGHT' ? 'fish_reel' : this.g.fishing.session.t < 0.6 ? 'fish_cast' : 'fish_idle'; }
    if (p.attackAnim) return p.attackAnim.kind === 'bow' ? 'bow' : 'spear';
    if (p.action) return p.action.anim === 'eat' ? 'eat' : p.action.anim;
    if (p.eatT > 0) return 'eat';
    if (w.moving) return w.sprintingNow ? 'run' : 'walk';
    return 'idle';
  }
  drawPlayer(sx, sy, onRaft = false) {
    const ctx = this.ctx; const p = this.g.state.player; const app = p.appearance;
    let clip = this.playerClip(); const dir = clip === 'sleep' ? 'down' : p.facing;
    let n = 0; while (this.atlas.has(`avatar/${app.body}/${clip}/${dir}/${n}`)) n++;
    if (!n) { clip = 'idle'; n = 4; }
    const f = Math.floor(this.time * (CLIP_FPS[clip] || 8)) % n;
    const body = this.atlas.avatarFrame(app, clip, dir, f);
    const an = this.anchors?.anchors?.[`${app.body}/${clip}/${dir}/${f}`] || { head: [16, 9], rightHand: [22, 27], leftHand: [10, 27], backpack: [16, 24], toolAngle: 0 };
    const ox = Math.round(sx - 16), oy = Math.round(sy - 45);
    const bagIt = p.equipment.backpack ? this.g.inventory.item(p.equipment.backpack) : null;
    const bagKind = bagIt ? (bagIt.itemId === 'EQ_BAG_SMALL' ? 'small_bag' : bagIt.itemId === 'EQ_BAG_LARGE' ? 'medium_bag' : 'large_bag') : null;
    const heldIt = this.heldItem(clip);
    const order = { down: ['shadow', 'backpack', 'body', 'hair', 'held'], up: ['held', 'body', 'backpack', 'hair'], left: ['held', 'body', 'hair', 'backpack'], right: ['backpack', 'body', 'hair', 'held'] }[dir];
    if (p.mode === 'DIVE') ctx.globalAlpha = 0.6;
    for (const layer of order) {
      if (layer === 'shadow' && !onRaft && p.mode === 'WALK') { /* shadow included in body frame */ }
      if (layer === 'body') ctx.drawImage(body, ox, oy);
      if (layer === 'hair' && clip !== 'sleep') { const h = this.atlas.hairFrame(app, dir); ctx.drawImage(h, ox + an.head[0] - 16, oy + an.head[1] - 12); }
      if (layer === 'backpack' && bagKind && clip !== 'sleep' && clip !== 'swim') this.atlas.draw(ctx, `avatar/bag/${bagKind}/${dir}`, ox + an.backpack[0], oy + an.backpack[1] + 10);
      if (layer === 'held' && heldIt && clip !== 'sleep' && clip !== 'swim') {
        const [hx, hy] = dir === 'left' ? an.leftHand : an.rightHand;
        ctx.save(); ctx.translate(ox + hx, oy + hy);
        const ang = (an.toolAngle || 0) * (dir === 'left' ? -1 : 1);
        ctx.rotate(ang); this.atlas.draw(ctx, `avatar/held/${heldIt}/${dir}`, dir === 'left' ? 8 : -8, 8, { ax: 0, ay: 1 }); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
  heldItem(clip) {
    const inv = this.g.inventory; const p = this.g.state.player;
    if (clip === 'chop') return 'axe'; if (clip === 'mine') return 'pickaxe'; if (clip === 'build') return 'hammer';
    if (clip.startsWith('fish')) return 'fishing_rod'; if (clip === 'bow') return 'bow'; if (clip === 'spear') return 'spear';
    const mh = p.equipment.main_hand ? inv.item(p.equipment.main_hand) : null;
    if (!mh) return null;
    for (const [k, v] of Object.entries(HELD)) if (mh.itemId.includes(k)) return v;
    return null;
  }

  drawPlacement(pl) {
    const { x: cx, y: cy } = this.cam; const ctx = this.ctx;
    const [w, h] = this.g.build.footprint(pl.buildId);
    ctx.fillStyle = pl.valid ? 'rgba(80,220,120,0.28)' : 'rgba(230,70,60,0.35)';
    ctx.fillRect(pl.tile[0] * TILE - cx, pl.tile[1] * TILE - cy, w * TILE, h * TILE);
    ctx.strokeStyle = pl.valid ? '#5cdc7a' : '#e84a3a'; ctx.strokeRect(pl.tile[0] * TILE - cx + 0.5, pl.tile[1] * TILE - cy + 0.5, w * TILE - 1, h * TILE - 1);
    this.atlas.draw(ctx, `build/${pl.buildId}/ghost`, (pl.tile[0] + w / 2) * TILE - cx, (pl.tile[1] + h) * TILE - cy, { alpha: 0.9 });
  }

  weather(W, H) {
    const g = this.g; const ctx = this.ctx;
    if (g.world.grid.isCave || !g.climate.isRaining()) { this.rain.length = 0; return; }
    const w = g.climate.weather(); const dens = { LIGHT_RAIN: 40, RAIN: 80, HEAVY_RAIN: 130, STORM: 160 }[w] || 0;
    const target = this.quality === 'LOW' ? dens / 3 : dens;
    while (this.rain.length < target) this.rain.push({ x: Math.random() * W, y: Math.random() * H, v: 260 + Math.random() * 120 });
    this.rain.length = Math.min(this.rain.length, target);
    ctx.strokeStyle = 'rgba(200,230,245,0.55)'; ctx.lineWidth = 1; ctx.beginPath();
    const wind = w === 'STORM' ? 70 : 25;
    for (const r of this.rain) { r.y += r.v / 60; r.x += wind / 60; if (r.y > H) { r.y = -8; r.x = Math.random() * W; } if (r.x > W) r.x -= W; ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - wind * 0.04, r.y - 7); }
    ctx.stroke();
    ctx.fillStyle = `rgba(40,60,80,${w === 'STORM' ? 0.28 : w === 'HEAVY_RAIN' ? 0.18 : 0.08})`; ctx.fillRect(0, 0, W, H);
    if (w === 'STORM' && this.quality !== 'LOW' && Math.sin(this.time * 0.9) > 0.995) { ctx.fillStyle = 'rgba(255,255,230,0.55)'; ctx.fillRect(0, 0, W, H); }
  }

  lighting(W, H, camX, camY, px, py) {
    const g = this.g; const cave = g.world.grid.isCave;
    let dark = cave ? 0.86 : g.clock.darkness();
    if (dark < 0.05) return;
    const d = this.dark; if (d.width !== Math.ceil(W) || d.height !== Math.ceil(H)) { d.width = Math.ceil(W); d.height = Math.ceil(H); }
    const x = d.getContext('2d'); x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, d.width, d.height);
    x.fillStyle = cave ? `rgba(5,6,10,${dark})` : `rgba(14,26,58,${dark})`; x.fillRect(0, 0, d.width, d.height);
    x.globalCompositeOperation = 'destination-out';
    const hole = (sx, sy, r, k = 1) => { const gr = x.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(sx - r, sy - r, r * 2, r * 2); };
    const inv = g.inventory;
    const lamp = inv.hasItem('TOOL_PORTABLE_LAMP') ? 150 : inv.hasItem('TOOL_TORCH') ? (cave ? 120 : 90) : cave ? 46 : 52;
    hole(px - camX, py - camY - 16, lamp + Math.sin(this.time * 7) * 2);
    if (!cave) for (const b of Object.values(g.state.buildingState.byId)) { const r = LIGHTS[b.buildId]; if (r && b.stage === 'complete' && b.sceneId === g.world.sceneId) hole((b.tile[0] + b.w / 2) * TILE - camX, (b.tile[1] + b.h / 2) * TILE - camY, r + Math.sin(this.time * 8 + b.tile[0]) * 3); }
    if (!cave && g.escape.stationBuilt() && g.world.sceneId === 'OVERWORLD') { const poi = g.exploration.byId.get('POI_LIGHTHOUSE'); hole((poi.ax + 0.5) * TILE - camX, (poi.ay - 2) * TILE - camY, 160, 0.9); }
    this.ctx.drawImage(d, 0, 0);
    if (!cave && dark > 0.3) { // warm glow on fires
      this.ctx.globalCompositeOperation = 'lighter';
      for (const b of Object.values(g.state.buildingState.byId)) if (LIGHTS[b.buildId] && b.stage === 'complete') { const sx = (b.tile[0] + b.w / 2) * TILE - camX, sy = (b.tile[1] + b.h / 2) * TILE - camY; const gr = this.ctx.createRadialGradient(sx, sy, 0, sx, sy, 50); gr.addColorStop(0, 'rgba(255,150,60,0.25)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); this.ctx.fillStyle = gr; this.ctx.fillRect(sx - 50, sy - 50, 100, 100); }
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  // ---------- finales ----------
  renderFinale() {
    const ctx = this.ctx; const a = this.g.finale.active; this.resize();
    const s = this.scale; const W = this.cv.width / s, H = this.cv.height / s;
    ctx.setTransform(s, 0, 0, s, 0, 0); ctx.imageSmoothingEnabled = false;
    if (a.kind === 'RADIO') {
      const k = Math.min(1, W / 512);
      const scene = a.segment === 'DEPARTURE' ? 'radio_rescue' : a.segment === 'BOARDING' ? 'radio_rescue' : 'radio_signal';
      ctx.fillStyle = '#0d1a2a'; ctx.fillRect(0, 0, W, H);
      this.atlas.draw(ctx, `scene/${scene}/backdrop`, W / 2, H * 0.85, { scale: Math.max(k, H / 300) });
      this.atlas.draw(ctx, `scene/${scene}/foreground`, W / 2 + (a.segment === 'DEPARTURE' ? -a.segT * 30 : 0), H * 0.85, { scale: Math.max(k, H / 300) });
      if (a.done) this.atlas.draw(ctx, `scene/${scene}/title_art`, W / 2, H * 0.6, { scale: 0.8 });
      ctx.setTransform(1, 0, 0, 1, 0, 0); return;
    }
    // sea: scrolling ocean with reef gates
    ctx.fillStyle = '#237c9f'; ctx.fillRect(0, 0, W, H);
    const lanes = 5; const laneW = W / (lanes + 1);
    const speed = 60; const t = a.segT;
    for (let i = 0; i < 40; i++) { const y = ((i * 37 + t * speed * 1.6) % (H + 20)) - 10; ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect((i * 97) % W, y, 14, 1); }
    if (a.segment === 'BOAT_CASTOFF') { ctx.fillStyle = '#e2bf7d'; ctx.fillRect(0, H - 30 + t * 3, W, 80); }
    if (a.segment === 'BOAT_REEF') {
      const lead = this.g.finale.clueLead();
      for (const gt of a.gates) {
        const dy = (t - gt.t) * speed * 1.6; const y = H * 0.72 + dy; if (y < -40 || y > H + 40) continue;
        for (let l = 0; l < lanes; l++) {
          const x = laneW * (l + 1);
          if (l === gt.gap) { if (gt.t - t < lead + 6) { this.atlas.draw(ctx, 'ui/compass', x - 22, y, { scale: 0.4 }); this.atlas.draw(ctx, 'ui/compass', x + 22, y, { scale: 0.4 }); } continue; }
          this.atlas.draw(ctx, 'foliage/reef_coral/' + (l % 3), x, y + 14, { scale: 0.8 }); ctx.fillStyle = '#5d6168'; ctx.beginPath(); ctx.ellipse(x, y + 4, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (a.segment === 'BOAT_OPEN_SEA') { ctx.fillStyle = '#ffd04a'; ctx.fillRect(W / 2 - 3, 20 + Math.max(0, 40 - a.segT * 4), 6, 18); }
    const bx = W / 2 + a.x * (W / 2 - laneW); const by = H * 0.72;
    this.atlas.draw(ctx, `boat/BUILD_ESCAPE_BOAT/up/${Math.floor(this.time * 6) % 8}`, bx, by + 50, { scale: 0.55 });
    // hull bar
    ctx.fillStyle = 'rgba(10,20,30,0.6)'; ctx.fillRect(10, 10, 104, 10); ctx.fillStyle = a.hull > 50 ? '#5cdc7a' : '#e84a3a'; ctx.fillRect(12, 12, Math.max(0, 100 * a.hull / a.maxHull), 6);
    if (a.done && a.result) this.atlas.draw(ctx, 'scene/sea_success/title_art', W / 2, H * 0.6, { scale: 0.8 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  screenToTile(clientX, clientY) {
    const r = this.cv.getBoundingClientRect(); const dpr = this.cv.width / r.width;
    const x = (clientX - r.left) * dpr / this.scale + this.cam.x, y = (clientY - r.top) * dpr / this.scale + this.cam.y;
    return [Math.floor(x / TILE), Math.floor(y / TILE)];
  }
}
