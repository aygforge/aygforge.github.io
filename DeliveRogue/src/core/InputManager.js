// core/InputManager.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { Audio } from './AudioManager.js';
import { View } from './state.js';

/* ============================ Input =========================== */
/** Fixed virtual joystick on the left side (drag the knob; pointer events, multi-touch safe) + keyboard (WASD / arrows). */
export const Input = (() => {
  const joy = { active: false, id: null, bx: 0, by: 0, kx: 0, ky: 0, dx: 0, dy: 0 };
  const keys = {};
  let enabled = false, toLogical = null;
  const R = 50; // joystick radius (logical px)
  /** Fixed joystick centre: bottom-left of the play frame (above the safe area). */
  function center() { return { x: R + 26, y: View.h - R - 58 }; }
  function onDown(e) {
    Audio.init();
    if (!enabled || joy.active) return;
    const p = toLogical(e.clientX, e.clientY), c = center();
    if (Math.hypot(p.x - c.x, p.y - c.y) > R * 1.7) return; // only touches on/near the stick grab it
    joy.active = true; joy.id = e.pointerId; joy.bx = c.x; joy.by = c.y; joy.kx = p.x; joy.ky = p.y; joy.dx = joy.dy = 0;
    try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault(); onMove(e);
  }
  function onMove(e) {
    if (!joy.active || e.pointerId !== joy.id) return;
    const p = toLogical(e.clientX, e.clientY);
    const c = center(); joy.bx = c.x; joy.by = c.y; // base never moves
    const dx = p.x - joy.bx, dy = p.y - joy.by;
    joy.kx = p.x; joy.ky = p.y;
    const m = Math.hypot(dx, dy) / R; const dead = 0.12;
    if (m < dead) { joy.dx = joy.dy = 0; } else { const a = Math.atan2(dy, dx), mag = Math.min(1, (m - dead) / (1 - dead) * 1.15); joy.dx = Math.cos(a) * mag; joy.dy = Math.sin(a) * mag; }
    e.preventDefault();
  }
  function onUp(e) { if (joy.active && e.pointerId === joy.id) release(); }
  function release() { joy.active = false; joy.id = null; joy.dx = joy.dy = 0; }
  function reset() { release(); for (const k in keys) keys[k] = false; }
  function attach(el, conv) {
    toLogical = conv;
    el.addEventListener('pointerdown', onDown, { passive: false });
    el.addEventListener('pointermove', onMove, { passive: false });
    el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp); el.addEventListener('lostpointercapture', onUp);
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase(); keys[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === 'escape' && Input.onEscape) Input.onEscape();
      Audio.init();
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', reset);
  }
  /** Returns movement vector with length <= 1. */
  function vec() {
    if (!enabled) return { x: 0, y: 0 };
    let x = 0, y = 0;
    if (keys.a || keys.arrowleft) x -= 1; if (keys.d || keys.arrowright) x += 1;
    if (keys.w || keys.arrowup) y -= 1; if (keys.s || keys.arrowdown) y += 1;
    if (x || y) { const m = Math.hypot(x, y); return { x: x / m, y: y / m }; }
    return { x: joy.dx, y: joy.dy };
  }
  return { attach, vec, reset, joy, R, center, onEscape: null, set enabled(v) { enabled = v; if (!v) release(); }, get enabled() { return enabled; } };
})();
