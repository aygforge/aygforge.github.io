// Left virtual joystick, context buttons (Eylem/Koş/Saldır), keyboard (WASD/arrows, Shift, E/Space, F),
// tap-to-approach on the world canvas (joystick cancels auto path). All pointer events stay in the HUD.
export class TouchController {
  constructor(root, canvas) {
    this.root = root; this.canvas = canvas;
    this.vec = { x: 0, y: 0 }; this.keys = new Set(); this.sprintHeld = false; this.reelHeld = false;
    this.handlers = {};
    this.joy = root.querySelector('#joy'); this.knob = root.querySelector('#joy-knob');
    this.joyPointer = null; this.joyCenter = [0, 0];
    this.bindJoystick(); this.bindKeys();
  }
  on(evt, fn) { this.handlers[evt] = fn; }
  emit(evt, ...a) { this.handlers[evt]?.(...a); }

  bindJoystick() {
    const zone = this.root.querySelector('#joy-zone');
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault(); this.joyPointer = e.pointerId; zone.setPointerCapture(e.pointerId);
      const r = zone.getBoundingClientRect(); this.joyCenter = [e.clientX, e.clientY];
      this.joy.style.left = `${e.clientX - r.left}px`; this.joy.style.top = `${e.clientY - r.top}px`; this.joy.classList.add('active');
      this.emit('joystart');
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joyPointer) return;
      const R = 46; let dx = e.clientX - this.joyCenter[0], dy = e.clientY - this.joyCenter[1];
      const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.vec = { x: dx / R, y: dy / R };
    });
    const end = (e) => { if (e.pointerId !== this.joyPointer) return; this.joyPointer = null; this.vec = { x: 0, y: 0 }; this.knob.style.transform = ''; this.joy.classList.remove('active'); };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  }

  bindKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      this.keys.add(e.code);
      const map = { KeyE: 'interact', Space: 'interact', KeyF: 'attack', KeyI: 'inventory', Tab: 'inventory', KeyC: 'craft', KeyB: 'build', KeyM: 'map', KeyJ: 'journal', Escape: 'escape', KeyP: 'pets', KeyR: 'reel_down', KeyQ: 'quick' };
      for (let i = 1; i <= 6; i++) map['Digit' + i] = 'slot' + i;
      if (map[e.code]) { if (['Space', 'Tab'].includes(e.code)) e.preventDefault(); if (!e.repeat) this.emit(map[e.code]); }
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); if (e.code === 'KeyR' || e.code === 'Space') this.emit('reel_up'); });
    window.addEventListener('blur', () => this.keys.clear());
  }

  /** Normalized input for this frame: keyboard and joystick produce equivalent normalized vectors. */
  sample() {
    let x = this.vec.x, y = this.vec.y;
    const k = this.keys;
    const kx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    const ky = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
    if (kx || ky) { const l = Math.hypot(kx, ky); x = kx / l; y = ky / l; }
    return { x, y, sprint: this.sprintHeld || k.has('ShiftLeft') || k.has('ShiftRight') };
  }
}
