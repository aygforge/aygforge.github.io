// systems/Fx.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { Save } from '../core/SaveManager.js';
import { G, View } from '../core/state.js';
import { TAU } from '../core/util.js';

/* ----------------------------- FX ----------------------------- */
export const Fx = {
  cap() { return View.low ? 110 : 220; },
  part(o) { if (G.parts.length >= Fx.cap()) G.parts.shift(); G.parts.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 2, color: '#fff', grav: 0, kind: 'circ', drag: 2 }, o)); },
  burst(x, y, color, n = 8, spd = 80, size = 2, life = 0.45) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = spd * (0.4 + Math.random() * 0.8); Fx.part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.6), max: life, size: size * (0.6 + Math.random() * 0.8), color, kind: Math.random() < 0.5 ? 'sq' : 'circ' }); } },
  steam(x, y, n = 3, spread = 10) { for (let i = 0; i < n; i++) Fx.part({ x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 30, life: 0.7, max: 0.7, size: 4 + Math.random() * 4, color: 'rgba(255,255,255,0.55)', kind: 'steam', drag: 1 }); },
  ring(x, y, color, r = 30, life = 0.45) { Fx.part({ x, y, life, max: life, size: r, color, kind: 'ring' }); },
  text(x, y, text, color = '#fff', size = 10, life = 0.8, icon = null) { if (G.floats.length > 40) G.floats.shift(); G.floats.push({ x: x + (Math.random() - 0.5) * 8, y, text: String(text), color, size, life, max: life, icon }); },
  bolt(x1, y1, x2, y2) { G.bolts.push({ x1, y1, x2, y2, life: 0.18 }); },
  shake(a) { if (Save.data.settings.shake) G.cam.shake = Math.max(G.cam.shake, a); },
};
