// Raft: board on adjacent water (atomic vehicle+mode), sail any navigable water, land on valid foot tile,
// storms block new departures, raft position persisted in vehicles.raftsById.
import { TILE } from '../world/TerrainSystem.js';

export class SeaVehicleSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  rafts() { return this.s.vehicles.raftsById; }

  registerRaft(tx, b) {
    const px = [(b.tile[0] + b.w / 2) * TILE, (b.tile[1] + b.h / 2) * TILE];
    tx.set(this.rafts(), b.uid, { buildUid: b.uid, sceneId: 'OVERWORLD', atlasPx: px, rotation: 0, durability: 100, anchored: true, passengerId: null });
  }
  raftNear() {
    const [px, py] = this.s.player.positionPx;
    for (const [id, r] of Object.entries(this.rafts())) if (r.sceneId === this.g.world.sceneId && Math.hypot(r.atlasPx[0] - px, r.atlasPx[1] - py) < TILE * 2.6) return id;
    return null;
  }

  /** BOARD_VEHICLE */
  board(raftId) {
    const r = this.rafts()[raftId]; if (!r) return { ok: false };
    if (!this.g.climate.launchAllowed() && this.g.climate.weather() === 'STORM') { this.g.bus.emit('ui.error', { text: 'Fırtınada denize açılamazsın' }); return { ok: false, code: 'STORM' }; }
    const res = this.g.store.transaction(null, (tx) => {
      tx.set(r, 'anchored', false); tx.set(r, 'passengerId', 'player');
      tx.set(this.s.vehicles, 'activeVehicleId', raftId);
      tx.set(this.s.player, 'mode', 'RAFT');
      tx.set(this.s.player, 'positionPx', [...r.atlasPx]);
      tx.emit('vehicle.boarded', { raftId });
    });
    if (res.ok) { this.g.world.path = null; this.g.persistence?.checkpoint('board'); }
    return res;
  }

  /** Landing tile next to raft (walkable foot tile). */
  landingSpot() {
    const g = this.g.world.grid; const [tx, ty] = this.g.world.playerTile();
    return this.g.pathfinder.nearestTile(g, tx, ty, (x, y) => this.g.terrain.passable(g, x, y, 'WALK') && !this.g.terrain.needsSwim(g, x, y), 2);
  }
  disembark() {
    const spot = this.landingSpot(); if (!spot) { this.g.bus.emit('ui.error', { text: 'Yanaşacak kara yok' }); return { ok: false }; }
    const id = this.s.vehicles.activeVehicleId; const r = this.rafts()[id];
    const res = this.g.store.transaction(null, (tx) => {
      tx.set(r, 'atlasPx', [...this.s.player.positionPx]); tx.set(r, 'anchored', true); tx.set(r, 'passengerId', null);
      tx.set(this.s.vehicles, 'activeVehicleId', null);
      tx.set(this.s.player, 'mode', 'WALK');
      tx.set(this.s.player, 'positionPx', [(spot[0] + 0.5) * TILE, (spot[1] + 0.5) * TILE]);
      tx.set(this.s.vehicles.landingRecovery, 'lastSafeLandingTile', spot);
      tx.set(this.s.vehicles.landingRecovery, 'lastSafeLandingIslandId', this.g.terrain.islandAt(spot[0], spot[1]));
      tx.emit('vehicle.landed', { islandId: this.g.terrain.islandAt(spot[0], spot[1]) });
    });
    if (res.ok) this.g.persistence?.checkpoint('land');
    return res;
  }
  forceDisembark() {
    const id = this.s.vehicles.activeVehicleId; const r = this.rafts()[id];
    if (r) { r.anchored = true; r.passengerId = null; r.atlasPx = [...this.s.player.positionPx]; }
    this.s.vehicles.activeVehicleId = null; this.s.player.mode = 'WALK';
  }
  /** keep raft entity glued to player while sailing */
  tick() {
    const id = this.s.vehicles.activeVehicleId;
    if (id && this.s.player.mode === 'RAFT') { const r = this.rafts()[id]; if (r) r.atlasPx = [...this.s.player.positionPx]; }
  }
  /** After load: vehicle mode and position must match (SaveSchema invariant). */
  validateAfterLoad() {
    const p = this.s.player; const id = this.s.vehicles.activeVehicleId;
    if (p.mode === 'RAFT') {
      const r = id && this.rafts()[id];
      const g = this.g.terrain.overworld; const tx = Math.floor(p.positionPx[0] / TILE), ty = Math.floor(p.positionPx[1] / TILE);
      if (!r || !this.g.terrain.passable(g, tx, ty, 'RAFT')) {
        const lr = this.s.vehicles.landingRecovery;
        if (r) { r.anchored = true; r.passengerId = null; }
        this.s.vehicles.activeVehicleId = null; p.mode = 'WALK';
        if (lr.lastSafeLandingTile) p.positionPx = [(lr.lastSafeLandingTile[0] + 0.5) * TILE, (lr.lastSafeLandingTile[1] + 0.5) * TILE];
      } else r.atlasPx = [...p.positionPx];
    }
  }
}
