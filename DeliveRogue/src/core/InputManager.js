// core/InputManager.js — gameplay input (Phase 03).
// Left: fixed 360° analog joystick (drag the knob). Right: FIRE button — tap fires once if the cooldown is
// ready, hold repeats at the attack interval, release stops. Joystick and fire track independent pointerIds
// (multi-touch); pointer capture + pointerup/cancel/lostpointercapture/blur/visibility clear their state.
// Keyboard: WASD / arrows move, Space fires (tap + hold), ESC = back/pause. Left-handed mode mirrors sides.
// Size / opacity come from Settings (joySize, fireSize, ctrlOpacity, leftHanded).
import { Audio } from './AudioManager.js';
import { Save } from './SaveManager.js';
import { View } from './state.js';
import { VIEW_W } from './util.js';

export const Input = (() => {
  const joy = { active: false, id: null, bx: 0, by: 0, kx: 0, ky: 0, dx: 0, dy: 0 };
  const fire = { active: false, id: null, tap: false, key: false };
  const keys = {};
  let enabled = false, toLogical = null;
  const JOY_R = 50, FIRE_R = 36;
  const S = () => { try { return Save.data.settings; } catch (e) { return {}; } };
  const joyR = () => JOY_R * (S().joySize || 1);
  const fireR = () => FIRE_R * (S().fireSize || 1);
  /** Joystick centre: bottom-left (bottom-right in left-handed mode), above the safe area. */
  function center() { const r = joyR(); return { x: S().leftHanded ? VIEW_W - r - 26 : r + 26, y: View.h - r - 58 }; }
  function fireCenter() { const r = fireR(); return { x: S().leftHanded ? r + 30 : VIEW_W - r - 30, y: View.h - r - 66 }; }
  function onDown(e) {
    Audio.init();
    if (!enabled) return;
    const p = toLogical(e.clientX, e.clientY), c = center(), f = fireCenter();
    const dJoy = Math.hypot(p.x - c.x, p.y - c.y), dFire = Math.hypot(p.x - f.x, p.y - f.y);
    if (!fire.active && dFire <= fireR() * 1.45 && (dFire < dJoy || joy.active)) {
      fire.active = true; fire.id = e.pointerId; fire.tap = true;
      try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault(); return;
    }
    if (!joy.active && dJoy <= joyR() * 1.7) {
      joy.active = true; joy.id = e.pointerId; joy.bx = c.x; joy.by = c.y; joy.kx = p.x; joy.ky = p.y; joy.dx = joy.dy = 0;
      try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault(); onMove(e);
    }
  }
  function onMove(e) {
    if (!joy.active || e.pointerId !== joy.id) return;
    const p = toLogical(e.clientX, e.clientY), c = center(), R = joyR();
    joy.bx = c.x; joy.by = c.y;
    const dx = p.x - joy.bx, dy = p.y - joy.by;
    joy.kx = p.x; joy.ky = p.y;
    const m = Math.hypot(dx, dy) / R; const dead = 0.12;
    if (m < dead) { joy.dx = joy.dy = 0; } else { const a = Math.atan2(dy, dx), mag = Math.min(1, (m - dead) / (1 - dead) * 1.15); joy.dx = Math.cos(a) * mag; joy.dy = Math.sin(a) * mag; }
    e.preventDefault();
  }
  function onUp(e) {
    if (joy.active && e.pointerId === joy.id) releaseJoy();
    if (fire.active && e.pointerId === fire.id) releaseFire();
  }
  function releaseJoy() { joy.active = false; joy.id = null; joy.dx = joy.dy = 0; }
  function releaseFire() { fire.active = false; fire.id = null; fire.tap = false; }
  function release() { releaseJoy(); releaseFire(); fire.key = false; }
  function reset() { release(); for (const k in keys) keys[k] = false; }
  function attach(el, conv) {
    toLogical = conv;
    el.addEventListener('pointerdown', onDown, { passive: false });
    el.addEventListener('pointermove', onMove, { passive: false });
    el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp); el.addEventListener('lostpointercapture', onUp);
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase(); keys[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === ' ' && enabled && !e.repeat) { fire.key = true; fire.tap = true; }
      if (k === 'escape' && Input.onEscape) Input.onEscape();
      Audio.init();
    });
    window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys[k] = false; if (k === ' ') fire.key = false; });
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
  /** One queued tap (consumed). Taps while the cooldown is not ready are dropped by the weapon. */
  function takeFireTap() { const t = enabled && fire.tap; fire.tap = false; return t; }
  function fireHeld() { return enabled && (fire.active || fire.key); }
  return {
    attach, vec, reset, joy, fire, center, fireCenter, takeFireTap, fireHeld, onEscape: null,
    get R() { return joyR(); }, get FR() { return fireR(); }, get opacity() { return S().ctrlOpacity || 1; },
    set enabled(v) { enabled = v; if (!v) release(); }, get enabled() { return enabled; },
  };
})();
