// Dokunmatik sanal joystick — pointer capture ile çoklu dokunmada bağımsız çalışır
// (bir parmak hareket ederken diğer parmak beceri kullanabilir).
import { h } from './dom.js';
import { joy } from '../world/input.js';
import { sound } from '../audio/sound.js';

export function createJoystick(big = false) {
  const knob = h('div', { class: 'knob' });
  const el = h('div', { class: 'joy' + (big ? ' big' : ''), 'data-testid': 'joystick' }, knob);
  let id = null, cx = 0, cy = 0, R = 1;
  const set = (x, y) => {
    let dx = x - cx, dy = y - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = dx / d * R; dy = dy / d * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.x = dx / R; joy.y = dy / R;
  };
  const reset = () => {
    id = null; joy.active = false; joy.x = 0; joy.y = 0;
    knob.style.transform = '';
  };
  el.addEventListener('pointerdown', (e) => {
    if (id !== null) return;
    e.preventDefault();
    sound.init();
    id = e.pointerId;
    el.setPointerCapture(id);
    const r = el.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width * 0.36;
    joy.active = true;
    set(e.clientX, e.clientY);
  });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === id) { e.preventDefault(); set(e.clientX, e.clientY); } });
  const end = (e) => { if (e.pointerId === id) reset(); };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
  window.addEventListener('blur', reset);
  return el;
}
