// Typed action/event publication. Systems emit completed events; UI and audio subscribe.
export class EventBus {
  constructor() { this.handlers = new Map(); this.log = []; this.keepLog = false; }
  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(fn);
    return () => this.handlers.get(type)?.delete(fn);
  }
  emit(type, payload = {}) {
    if (this.keepLog) this.log.push({ type, payload });
    const hs = this.handlers.get(type);
    if (hs) for (const h of [...hs]) { try { h(payload, type); } catch (e) { console.error('[EventBus]', type, e); } }
    const all = this.handlers.get('*');
    if (all) for (const h of [...all]) { try { h(payload, type); } catch (e) { console.error('[EventBus*]', type, e); } }
  }
}
