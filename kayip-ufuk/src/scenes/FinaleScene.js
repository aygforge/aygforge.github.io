// Sea finale (castoff → reef gates with chart clues → open sea) and radio rescue finale (short, wordless).
import { Sfc32 } from '../core/RngStreams.js';
import { clamp } from '../core/util.js';

export const LANES = 5;
export class FinaleScene {
  constructor(game) { this.g = game; this.active = null; }

  startSea({ hullBonus = 0, charts = 2, captain = false }) {
    const seed = this.g.store.state.world.worldSeed;
    const rng = new Sfc32([seed, 0x5eaf00d, 0xbeef, 7]);
    const gates = [];
    let t = 8;
    for (let i = 0; i < 12; i++) { gates.push({ t, gap: rng.int(0, LANES - 1), gap2: captain ? -1 : -1, hit: false, passed: false }); t += 6.5; }
    this.active = { kind: 'SEA', segment: 'BOAT_CASTOFF', t: 0, segT: 0, x: 0, hull: 100 * (1 + hullBonus), maxHull: 100 * (1 + hullBonus), gates, charts, captain, reefLen: t + 2, steer: 0, done: false, result: null };
    this.g.store.state.player.mode = 'INTERACT';
    this.g.bus.emit('finale.start', { kind: 'SEA' });
    this.g.audio?.play('snd_sea_finale');
  }
  startRadio() {
    this.active = { kind: 'RADIO', segment: 'RESCUE_APPROACH', t: 0, segT: 0, done: false, result: null };
    this.g.bus.emit('finale.start', { kind: 'RADIO' });
    this.g.audio?.play('snd_radio_finale');
  }
  steer(x) { if (this.active) this.active.steer = clamp(x, -1, 1); }

  tick(dt) {
    const a = this.active; if (!a || a.done) return;
    a.t += dt; a.segT += dt;
    if (a.kind === 'RADIO') {
      if (a.segT > 4 && a.segment === 'RESCUE_APPROACH') { a.segment = 'BOARDING'; a.segT = 0; }
      else if (a.segT > 4 && a.segment === 'BOARDING') { a.segment = 'DEPARTURE'; a.segT = 0; }
      else if (a.segT > 5 && a.segment === 'DEPARTURE') this.finish(true);
      return;
    }
    a.x = clamp(a.x + a.steer * dt * 2.2, -1, 1);
    if (a.segment === 'BOAT_CASTOFF' && a.segT >= 30 * this.g.finaleSpeed) { a.segment = 'BOAT_REEF'; a.segT = 0; }
    else if (a.segment === 'BOAT_REEF') {
      const lane = Math.round((a.x + 1) / 2 * (LANES - 1));
      a.lane = lane;
      for (const gt of a.gates) {
        if (!gt.passed && a.segT >= gt.t) {
          gt.passed = true;
          if (lane !== gt.gap) { gt.hit = true; a.hull -= 34; this.g.bus.emit('finale.hit', { hull: a.hull }); }
        }
      }
      if (a.hull <= 0) return this.finish(false);
      if (a.segT >= a.reefLen) { a.segment = 'BOAT_OPEN_SEA'; a.segT = 0; }
    } else if (a.segment === 'BOAT_OPEN_SEA' && a.segT >= 25 * this.g.finaleSpeed) this.finish(true);
  }
  /** chart clue: buoys visible ahead (more charts → earlier warning) */
  clueLead() { const a = this.active; return a ? 2 + (a.charts >= 3 ? 2 : 0) : 0; }

  finish(success) {
    const a = this.active; a.done = true; a.result = success;
    if (a.kind === 'SEA') {
      if (success) { const r = this.g.escape.complete('ESCAPE_SAIL'); a.stats = r.stats; this.g.bus.emit('ending', { routeId: 'ESCAPE_SAIL', stats: r.stats }); }
      else { this.g.escape.onSeaFail(); this.g.bus.emit('finale.failed', {}); this.active = null; }
    } else {
      const r = this.g.escape.complete('ESCAPE_RADIO'); a.stats = r.stats; this.g.bus.emit('ending', { routeId: 'ESCAPE_RADIO', stats: r.stats });
    }
  }
  close() { this.active = null; }
}
