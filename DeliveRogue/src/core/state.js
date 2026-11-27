// core/state.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { VIEW_W } from './util.js';
import { createEventBus } from './EventBus.js';

/* ============================ Game ============================
   Run state, player controller, weapon/projectiles, combat, enemy AI,
   hazards, package & delivery logic. All mutable gameplay state lives in G.
   ============================================================== */
export const View = { w: VIEW_W, h: 640, scale: 1, dpr: 1, low: false };
/** Shared event bus (legacy API + typed events, see EventBus.js). */
export const Bus = createEventBus();

export const G = {
  run: null, world: null, player: null, enemies: [], proj: [], eproj: [], lobs: [], puddles: [], zones: [],
  jets: [], grates: [], carts: [], parts: [], floats: [], bolts: [], cam: { y: 0, shake: 0, ox: 0, oy: 0 },
  enemyField: null, navT: 0, t: 0,
};
