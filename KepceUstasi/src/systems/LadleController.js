// LadleController — salınım, tek dokunuşla iniş, kapanma, kaldırma ve fiziksel yakalama sonucu.
// Bütün hareketler sabit adım sayısına bağlıdır (animasyon hızı / FPS sonucu değiştirmez).
import { LADLE, OILS } from '../data/content.js';
import { POT_GEOM, STEP_MS, floorY } from './PotPhysics.js';

const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
// Lift: short strong acceleration (pushes balls into the bowl) then a long gentle deceleration that stays
// below gravity, so caught balls are not thrown out of the ladle at the top of the lift.
const liftCurve = (u) => (u < 0.2 ? 5 * u * u : 0.2 + 2 * (u - 0.2) - 1.25 * (u - 0.2) * (u - 0.2));

export class LadleController {
  constructor(pot) {
    this.pot = pot;
    this.openAngle = (LADLE.openAngleDeg * Math.PI) / 180;
    this.hoverY = 4;
    this.params = null;
    this.phase = 'idle';
    this.t = 0;
    this.swingStep = 0;
  }

  // radius (px), rimLift (sin of lip angle), capacity (load units), period (s)
  configure({ radius, rimLift, capacity, period }) {
    const changed = !this.params || this.params.radius !== radius || this.params.rimLift !== rimLift;
    this.params = { radius, rimLift, capacity, period };
    if (changed) {
      this.pot.buildLadle(radius, rimLift);
      this.pot.setLadlePose(this.centerX, this.hoverY, this.openAngle, false);
    }
    const halfOpen = radius * 0.98 + 10;
    this.amp = Math.max(20, Math.min((POT_GEOM.W * LADLE.swingWidthRatio) / 2, POT_GEOM.W / 2 - halfOpen - 4));
  }

  get centerX() {
    return POT_GEOM.W / 2;
  }

  // Lowest pivot height at which the CLOSED bowl stays above the curved floor at this x.
  dropYAt(x) {
    const R = this.params.radius + this.pot.ladleShape.thick;
    let best = Infinity;
    for (let i = 0; i <= 16; i++) {
      const th = (Math.PI * i) / 16; // lower semicircle
      const px = x + R * Math.cos(th);
      best = Math.min(best, floorY(px) - R * Math.sin(th));
    }
    return best - 3;
  }

  // Lifted pose: bowl bottom clearly above the pile so spilled balls fall back into the pot.
  get liftY() {
    return Math.min(this.hoverY, POT_GEOM.D - 190 - this.params.radius);
  }

  swingX(step) {
    const t = (step * STEP_MS) / 1000;
    return this.centerX + this.amp * Math.sin((2 * Math.PI * t) / this.params.period);
  }

  startSwing() {
    this.phase = 'swing';
    this.swingStep = 0;
  }

  // Advances exactly one fixed step. Returns a phase change string when a sub-phase finishes.
  step() {
    const p = this.pot;
    let target;
    let event = null;
    switch (this.phase) {
      case 'swing': {
        this.swingStep++;
        target = { x: this.swingX(this.swingStep), y: this.hoverY, open: this.openAngle };
        break;
      }
      case 'drop': {
        this.t++;
        const k = easeOut(Math.min(1, this.t / LADLE.dropSteps));
        target = { x: this.dropX, y: this.hoverY + (this.dropYv - this.hoverY) * k, open: this.openAngle };
        if (this.t >= LADLE.dropSteps) {
          this.phase = 'close';
          this.t = 0;
          event = 'CLAW_CAPTURE';
        }
        break;
      }
      case 'close': {
        this.t++;
        const k = Math.min(1, this.t / LADLE.closeSteps);
        target = { x: this.dropX, y: this.dropYv, open: this.openAngle * (1 - k) };
        if (this.t >= LADLE.closeSteps) {
          this.phase = 'lift';
          this.t = 0;
          event = 'CLAW_LIFT';
        }
        break;
      }
      case 'lift': {
        this.t++;
        const k = liftCurve(Math.min(1, this.t / LADLE.liftSteps));
        const sway = Math.sin((this.t / LADLE.liftSteps) * Math.PI * 2) * 3;
        target = { x: this.dropX + sway, y: this.dropYv + (this.liftY - this.dropYv) * k, open: 0 };
        if (this.t >= LADLE.liftSteps) {
          this.phase = 'hold';
          this.t = 0;
        }
        break;
      }
      case 'hold': {
        this.t++;
        target = { x: this.dropX, y: this.liftY, open: 0 };
        if (this.t >= LADLE.holdSteps) {
          this.phase = 'caught';
          event = 'CAUGHT';
        }
        break;
      }
      case 'return': {
        this.t++;
        const k = easeInOut(Math.min(1, this.t / LADLE.returnSteps));
        target = {
          x: this.dropX + (this.swingX(0) - this.dropX) * k,
          y: this.liftY + (this.hoverY - this.liftY) * k,
          open: this.openAngle * k,
        };
        if (this.t >= LADLE.returnSteps) {
          this.phase = 'idle';
          event = 'RETURNED';
        }
        break;
      }
      default:
        target = null;
    }
    p.step(target);
    return event;
  }

  // Single tap: drop from the CURRENT x. Caller guarantees this is accepted only once per swing.
  drop() {
    if (this.phase !== 'swing') return false;
    this.dropX = this.pot.ladlePose.x;
    this.dropYv = this.dropYAt(this.dropX);
    this.phase = 'drop';
    this.t = 0;
    return true;
  }

  // Physical capture result. Balls are checked geometrically in the closed bowl; the capacity limit spills
  // the top-most balls back into the pot (they physically fall). Nothing is random here.
  resolveCatch() {
    const inBowl = this.pot.ballsInLadle();
    // deepest first (largest y) – the bottom of the bowl is filled first
    inBowl.sort((a, b) => b.position.y - a.position.y || a.ballId - b.ballId);
    const cap = this.params.capacity;
    let load = 0;
    const caught = [];
    const spilled = [];
    for (const b of inBowl) {
      const l = OILS[b.oilType].load;
      if (load + l <= cap) {
        load += l;
        caught.push(b);
      } else {
        spilled.push(b);
      }
    }
    const px = this.pot.ladlePose.x;
    const out = {
      caught: caught.map((b) => ({ id: b.ballId, type: b.oilType, x: b.position.x, y: b.position.y })),
      spilled: spilled.map((b) => ({ id: b.ballId, type: b.oilType })),
      load,
      capacity: cap,
    };
    for (const b of spilled) this.pot.spill(b, b.position.x >= px ? 1 : -1);
    for (const b of caught) this.pot.removeBall(b);
    this.phase = 'return';
    this.t = 0;
    return out;
  }
}
