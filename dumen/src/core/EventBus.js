(function (D) {
  'use strict';
  class EventBus {
    constructor() { this.h = new Map(); }
    on(ev, fn) { if (!this.h.has(ev)) this.h.set(ev, new Set()); this.h.get(ev).add(fn); return () => this.off(ev, fn); }
    off(ev, fn) { const s = this.h.get(ev); if (s) s.delete(fn); }
    emit(ev, data) {
      const s = this.h.get(ev); if (!s) return;
      for (const fn of [...s]) { try { fn(data); } catch (e) { console.error('[EventBus]', ev, e); } }
    }
  }
  D.EventBus = EventBus;
  D.bus = new EventBus();
})(globalThis.DUMEN);
