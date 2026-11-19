// Client-side farm session: runs the SAME deterministic simulation as the server purely for
// presentation, and re-synchronises to the server's authoritative snapshot on every heartbeat.
// Rewards are only ever taken from the server settlement.
import { restore, step } from '../../shared/combat/sim.js';
import { BALANCE } from '../../shared/data/balance.js';

const TICK = BALANCE.TICK_MS;

export class FarmController {
  constructor(api, hooks) {
    this.api = api;
    this.hooks = hooks; // onEvents(events), onSettlement(s), onEnded(info), onError(e), onSession(s)
    this.session = null;
    this.sim = null;
    this.timer = null;
    this.busy = false;
    this.stats = { since: 0, xp: 0, gold: 0, kills: 0 };
  }

  get active() { return !!this.session; }

  begin(session) {
    this.session = session;
    this.sim = restore(session.snapshot);
    this.base = { tick: session.tick, at: performance.now() };
    this.stats = { since: performance.now(), xp: 0, gold: 0, kills: 0, items: 0 };
    clearInterval(this.timer);
    this.timer = setInterval(() => this.heartbeat(), BALANCE.HEARTBEAT_S * 1000);
    this.hooks.onSession?.(session);
  }

  targetTick() {
    return this.base.tick + Math.floor((performance.now() - this.base.at) / TICK);
  }

  // called every animation frame by the scene
  update() {
    if (!this.sim) return;
    const target = this.targetTick();
    let behind = target - this.sim.t;
    if (behind > 400) { // tab was hidden: catch up silently
      while (this.sim.t < target - 20 && this.sim.status === 'running') { step(this.sim); this.sim.ev.length = 0; }
      behind = target - this.sim.t;
    }
    let n = 0;
    const evs = [];
    while (this.sim.t < target && n < 40 && this.sim.status === 'running') {
      step(this.sim);
      for (const e of this.sim.ev) evs.push(e);
      this.sim.ev.length = 0;
      n++;
    }
    if (evs.length) this.hooks.onEvents?.(evs, this.sim);
    if (this.sim.status !== 'running' && !this.finishing) {
      this.finishing = true;
      setTimeout(() => this.heartbeat(true), 600);
    }
  }

  async heartbeat(force = false) {
    if (!this.session || this.busy) return;
    this.busy = true;
    const sid = this.session.id;
    try {
      const r = await this.api.call('farm_heartbeat', { sessionId: sid });
      if (!this.session || this.session.id !== sid) return;
      if (r.settlement) this.applySettlement(r.settlement);
      if (r.session) this.resync(r.session);
      else this.ended(r.settlement?.ended || { status: 'stopped', reason: r.expired ? 'expired' : 'server' });
      if (r.gold != null) this.hooks.onGold?.(r.gold);
    } catch (e) {
      if (e.code === 'SESSION_ENDED') this.ended({ status: 'stopped', reason: 'replaced' });
      else this.hooks.onError?.(e);
    } finally {
      this.busy = false;
      if (force && this.session && this.sim?.status !== 'running') this.finishing = false;
    }
  }

  applySettlement(s) {
    this.stats.xp += s.xp || 0;
    this.stats.gold += s.gold || 0;
    this.stats.kills += s.kills || 0;
    this.stats.items += (s.items || []).length;
    this.hooks.onSettlement?.(s);
  }

  resync(session) {
    const local = this.targetTick();
    const sim = restore(session.snapshot);
    this.base = { tick: session.tick, at: performance.now() };
    // the server is authoritative: adopt its state, then fast-forward to where the screen already is
    const ahead = Math.max(0, Math.min(local - session.tick, 200));
    for (let i = 0; i < ahead && sim.status === 'running'; i++) { step(sim); sim.ev.length = 0; }
    this.base.tick = sim.t;
    this.sim = sim;
    this.session = { ...this.session, ...session };
    this.finishing = false;
  }

  ended(info) {
    clearInterval(this.timer);
    const s = this.session;
    this.session = null;
    this.finishing = false;
    this.hooks.onEnded?.(info, s);
    this.sim = null;
  }

  async stop() {
    if (!this.session) return null;
    const sid = this.session.id;
    clearInterval(this.timer);
    try {
      const r = await this.api.call('farm_stop', { sessionId: sid });
      if (r.settlement) this.applySettlement(r.settlement);
      this.ended({ status: 'stopped', reason: 'player' });
      return r;
    } catch (e) {
      this.ended({ status: 'stopped', reason: 'error' });
      throw e;
    }
  }

  rates() {
    const h = Math.max(1 / 60, (performance.now() - this.stats.since) / 3600000);
    return { xpH: Math.round(this.stats.xp / h), goldH: Math.round(this.stats.gold / h), kills: this.stats.kills, items: this.stats.items };
  }
}
