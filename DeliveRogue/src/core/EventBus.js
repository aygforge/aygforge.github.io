// core/EventBus.js — typed gameplay event bus (Phase 01 foundation).
// Keeps the legacy `on(name, fn)` / `emit(name, data)` API used by the migrated runtime
// ('pick', 'resume', 'end', 'discover') and adds a typed canonical event catalog with
// unique eventIds + run context for later idempotent listeners (quests, contracts, book...).

/** Canonical event types (Master Prompt §14 EventBus). Phase 01 emits the legacy ones only. */
export const EV = Object.freeze({
  PICKUP: 'PICKUP', SEGMENT_ENTER: 'SEGMENT_ENTER', ENEMY_ENCOUNTER: 'ENEMY_ENCOUNTER', ENEMY_DEFEATED: 'ENEMY_DEFEATED',
  BOSS_DEFEATED: 'BOSS_DEFEATED', DROP_COMPLETED: 'DROP_COMPLETED', RUN_SETTLED: 'RUN_SETTLED', SKILL_PICKED: 'SKILL_PICKED',
  EVOLUTION_UNLOCKED: 'EVOLUTION_UNLOCKED', STAR_EARNED: 'STAR_EARNED', MASTERY_EARNED: 'MASTERY_EARNED',
  GARAGE_UPGRADED: 'GARAGE_UPGRADED', REWARD_CLAIMED: 'REWARD_CLAIMED',
});
const KNOWN = new Set([...Object.values(EV), 'pick', 'resume', 'end', 'discover']);

export function createEventBus() {
  const h = {};
  let seq = 0;
  const bus = {
    on(n, f) { (h[n] = h[n] || []).push(f); return () => bus.off(n, f); },
    off(n, f) { const a = h[n]; if (!a) return; const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); },
    /** Legacy emit: payload passed through unchanged. Listener errors are isolated. */
    emit(n, d) {
      if (!KNOWN.has(n)) console.warn('[EventBus] unknown event', n);
      for (const f of (h[n] || []).slice()) { try { f(d); } catch (e) { console.error('[EventBus]', n, e); } }
    },
    /** Typed emit: wraps payload in an envelope with a unique eventId and run context. */
    emitTyped(type, ctx, payload) {
      const ev = { type, eventId: (ctx && ctx.runId ? ctx.runId : 'meta') + ':' + (++seq), runId: ctx && ctx.runId || null,
        mode: ctx && ctx.mode || 'campaign', episode: ctx && ctx.episode || null, chapter: ctx && ctx.chapter || null, payload };
      bus.emit(type, ev); return ev;
    },
    listenerCount(n) { return (h[n] || []).length; },
  };
  return bus;
}
