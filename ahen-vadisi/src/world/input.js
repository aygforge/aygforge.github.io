// InputController: sanal joystick (en yüksek öncelik) + klavye, tek hareket vektöründe birleşir.
export const joy = { x: 0, y: 0, active: false };

export class InputController {
  constructor(scene) {
    this.scene = scene;
    const kb = scene.input.keyboard;
    this.keys = kb ? kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') : null;
  }
  vector() {
    if (joy.active && Math.hypot(joy.x, joy.y) > 0.18) return { x: joy.x, y: joy.y };
    if (!this.keys) return { x: 0, y: 0 };
    const k = this.keys;
    const x = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const y = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (!x && !y) return { x: 0, y: 0 };
    const n = Math.hypot(x, y);
    return { x: x / n, y: y / n };
  }
}
