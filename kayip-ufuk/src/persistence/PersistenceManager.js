// Autosave every 60 s of play, critical-event checkpoints, serialized writes (no partial state),
// lease heartbeat, visibility pause checkpoint. Writes are queued so an ending during a pending autosave
// commits exactly one consistent revision.
export class PersistenceManager {
  constructor(game, repo) {
    this.g = game; this.repo = repo; this.t = 0; this.queue = Promise.resolve(); this.dirty = 0; this.lastStatus = 'idle';
    this.readOnly = false; this.hb = 0;
  }
  markDirty() { this.dirty++; }
  tick(dt) {
    this.t += dt; this.hb += dt;
    if (this.t >= 60) { this.t = 0; this.checkpoint('autosave'); }
    if (this.hb >= 5) { this.hb = 0; this.repo.heartbeat().then((ok) => { if (!ok && !this.readOnly) { this.readOnly = true; this.g.bus.emit('save.readonly', {}); } }).catch(() => {}); }
  }
  /** Snapshot immediately (immutable copy of this tick) and enqueue the write. */
  checkpoint(reason) {
    if (this.readOnly || this.suspended) return this.queue;
    const snap = this.g.snapshot();
    this.queue = this.queue.then(async () => {
      try {
        this.lastStatus = 'saving';
        const r = await this.repo.save(snap, reason);
        this.g.state.revision = r.revision; this.lastStatus = 'saved'; this.lastSavedAt = Date.now();
        this.g.bus.emit('save.done', { reason, revision: r.revision });
      } catch (e) {
        this.lastStatus = 'error';
        if (String(e.message).includes('LEASE')) { this.readOnly = true; this.g.bus.emit('save.readonly', {}); }
        this.g.bus.emit('save.failed', { reason, error: String(e.message || e) });
      }
    });
    return this.queue;
  }
  flush() { return this.queue; }
}
