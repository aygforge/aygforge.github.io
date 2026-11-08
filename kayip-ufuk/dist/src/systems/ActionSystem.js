// Timed player actions (gather/chop/mine/build/eat). One at a time; movement cancels; completion runs once.
export class ActionSystem {
  constructor(game) { this.g = game; this.seq = 0; }
  get p() { return this.g.store.state.player; }
  start(type, seconds, onComplete, { anim = 'gather', label = '', data = {} } = {}) {
    if (this.p.action) return false;
    this.seq++;
    this.p.action = { id: this.seq, type, t: 0, total: Math.max(0.2, seconds), anim, label, data };
    this.cb = onComplete;
    this.g.bus.emit('action.started', { type, label, seconds });
    return true;
  }
  cancel(reason = 'cancel') {
    if (!this.p.action) return;
    const a = this.p.action; this.p.action = null; this.cb = null;
    this.g.bus.emit('action.cancelled', { type: a.type, reason });
  }
  tick(dt) {
    const a = this.p.action; if (!a) return;
    a.t += dt;
    if (a.data.hitEvery && Math.floor((a.t - dt) / a.data.hitEvery) < Math.floor(a.t / a.data.hitEvery)) this.g.bus.emit('action.hit', { type: a.type, data: a.data });
    if (a.t >= a.total) {
      const cb = this.cb; this.p.action = null; this.cb = null;
      try { cb && cb(); } finally { this.g.bus.emit('action.completed', { type: a.type }); }
    }
  }
  get busy() { return !!this.p.action; }
}
