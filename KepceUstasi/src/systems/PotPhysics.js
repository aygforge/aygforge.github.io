// PotPhysics — gerçek çarpışmalı yağ topçuğu tenceresi (Matter.js, sabit timestep).
// Bu modül Phaser'dan bağımsızdır; Node test ortamında da aynı kod çalışır.
import Matter from 'matter-js';
import { OILS, POT } from '../data/content.js';

const { Engine, Bodies, Body, Composite } = Matter;

export const POT_GEOM = {
  W: 444, // inner width (px, logical game units)
  D: 230, // depth from rim (y=0) to floor (y=D)
  wall: 18,
  bowl: 120, // how much higher the floor is at the walls than in the middle
  flat: 0.18, // fraction of the half-width that is flat in the middle before the sides rise
  // Alpha 0.3 floor features (0 = Alpha 0.2 shape). A low central ridge splits the oil into side pools.
  ridge: 0, // ridge height in the centre (px)
  ridgeWidth: 60, // gaussian sigma of the ridge (px)
  // Alpha 0.3: two low ridges split side pools from the centre pool (multiple clusters)
  ridges: [{ x: -72, h: 26, w: 12 }, { x: 72, h: 26, w: 12 }], // extra low ridges [{ x: offset from centre (px), h: height (px), w: gaussian sigma (px) }]
  floorSegments: 48, // collider segments along the floor (more = sharper ridges)
  pourClump: true, // refill pours new oil around one seeded point per refill
  pourSpread: 34, // px half-width of a pour clump
};

export const STEP_MS = 1000 / 60;

// Pot floor profile (y grows downward). Flat-ish middle, rising curved sides.
export function floorY(x) {
  const { W, D } = POT_GEOM;
  const u = Math.abs((x - W / 2) / (W / 2)); // 0 centre .. 1 wall
  const { bowl: rise, flat, ridge, ridgeWidth } = POT_GEOM;
  const ridgeY = ridge ? ridge * Math.exp(-((x - W / 2) ** 2) / (2 * ridgeWidth * ridgeWidth)) : 0;
  let extra = 0;
  for (const r of POT_GEOM.ridges) extra += r.h * Math.exp(-((x - W / 2 - r.x) ** 2) / (2 * r.w * r.w));
  return D - rise * Math.pow(Math.max(0, (u - flat) / (1 - flat)), 1.6) - ridgeY - extra;
}
export const SUBSTEPS = 3;

const CAT_BALL = 0x0001;
const CAT_WALL = 0x0002;
const CAT_LADLE = 0x0004;
const CAT_GHOST = 0x0008; // spilled ball: ignores the ladle until it settles

const BALL_FILTER = { category: CAT_BALL, mask: CAT_BALL | CAT_WALL | CAT_LADLE | CAT_GHOST };
const GHOST_FILTER = { category: CAT_GHOST, mask: CAT_BALL | CAT_WALL | CAT_GHOST };

export class PotPhysics {
  constructor(rng) {
    this.rng = rng;
    this.engine = Engine.create({ enableSleeping: false });
    this.engine.gravity.y = 1;
    this.engine.positionIterations = 10;
    this.engine.velocityIterations = 8;
    this.world = this.engine.world;
    this.balls = new Map(); // id -> body
    this.nextBallId = 1;
    this.pendingAdds = []; // queued types that could not be placed yet
    this.ladleParts = [];
    this.ladleShape = null;
    this.stepCount = 0;
    this._buildWalls();
  }

  _buildWalls() {
    const { W, D, wall } = POT_GEOM;
    const opts = { isStatic: true, friction: 0.05, frictionStatic: 0.1, restitution: 0.05, collisionFilter: { category: CAT_WALL, mask: 0xffff } };
    const h = D + 600;
    this.walls = [
      Bodies.rectangle(-wall / 2, D - h / 2, wall, h, opts),
      Bodies.rectangle(W + wall / 2, D - h / 2, wall, h, opts),
    ];
    // Rounded pot bottom: a polyline following floorY(x). Balls roll toward the middle, so WHERE the ladle
    // drops (timing) physically changes how many balls are under it.
    const N = POT_GEOM.floorSegments;
    for (let i = 0; i < N; i++) {
      const x0 = (W * i) / N;
      const x1 = (W * (i + 1)) / N;
      const y0 = floorY(x0);
      const y1 = floorY(x1);
      const len = Math.hypot(x1 - x0, y1 - y0) + 6;
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const cx = (x0 + x1) / 2 - Math.sin(ang) * (-wall / 2);
      const cy = (y0 + y1) / 2 + Math.cos(ang) * (wall / 2);
      this.walls.push(Bodies.rectangle(cx, cy, len, wall, { ...opts, angle: ang }));
    }
    Composite.add(this.world, this.walls);
  }

  get count() {
    return this.balls.size + this.pendingAdds.length;
  }

  bigRateFor(chapter, spiceBonus) {
    return Math.min(0.18, chapter.bigOilRate + (spiceBonus || 0));
  }

  // One seeded roll per new ball: big by chapter rate, else cold (only with Soğuk Sos), else normal.
  rollType(bigRate, coldRate = 0) {
    const u = this.rng.next();
    if (u < bigRate) return 'big';
    if (u < bigRate + coldRate) return 'cold';
    return 'normal';
  }

  _makeBall(type, x, y, id) {
    const r = OILS[type].radius;
    const b = Bodies.circle(x, y, r, {
      restitution: 0.12,
      friction: 0.02,
      frictionStatic: 0.05,
      frictionAir: 0.012,
      density: type === 'big' ? 0.0016 : 0.001,
      collisionFilter: { ...BALL_FILTER },
      slop: 0.02,
    });
    b.oilType = type;
    b.ballId = id ?? this.nextBallId++;
    if (id != null) this.nextBallId = Math.max(this.nextBallId, id + 1);
    b.ghostSteps = 0;
    this.balls.set(b.ballId, b);
    Composite.add(this.world, b);
    return b;
  }

  // Initial fill: random (seeded) composition, placed on a jittered lattice, then settled.
  fillInitial(n, bigRate) {
    const { W } = POT_GEOM;
    const types = [];
    for (let i = 0; i < n; i++) types.push(this.rollType(bigRate));
    let i = 0;
    const cols = 15;
    for (let row = 0; i < n; row++) {
      for (let c = 0; c < cols && i < n; c++, i++) {
        const x = 20 + (c + 0.5) * ((W - 40) / cols) + this.rng.range(-3, 3);
        const y = floorY(x) - 40 - row * 36 + this.rng.range(-3, 3);
        this._makeBall(types[i], x, y);
      }
    }
    this.settle(150);
  }

  // Can a ball of radius r be placed at (x,y) without overlapping existing colliders?
  _free(x, y, r) {
    const { W } = POT_GEOM;
    if (x - r < 2 || x + r > W - 2) return false;
    for (const b of this.balls.values()) {
      const rr = b.circleRadius + r + 1.5;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      if (dx * dx + dy * dy < rr * rr) return false;
    }
    for (const p of this.ladleParts) {
      if (Matter.Bounds.overlaps(p.bounds, { min: { x: x - r, y: y - r }, max: { x: x + r, y: y + r } })) return false;
    }
    return true;
  }

  // Try to place queued balls in the upper free zone of the pot. Never teleports existing balls.
  placePending(maxPerCall = 4) {
    let placed = 0;
    const { W } = POT_GEOM;
    const keep = [];
    for (const type of this.pendingAdds) {
      if (placed >= maxPerCall) {
        keep.push(type);
        continue;
      }
      const r = OILS[type].radius;
      let ok = false;
      // candidate rows from upper pot interior, seeded x order
      for (let attempt = 0; attempt < 24 && !ok; attempt++) {
        // Alpha 0.3: new oil pours in as a clump around this refill's seeded pour point (first attempts),
        // so the pot holds shifting clusters instead of an even rain. Falls back to anywhere free.
        const clump = this.pourX != null && attempt < 16;
        const x = clump
          ? Math.max(r + 6, Math.min(W - r - 6, this.pourX + this.rng.range(-POT_GEOM.pourSpread, POT_GEOM.pourSpread)))
          : this.rng.range(r + 6, W - r - 6);
        const y = 30 + (attempt % 4) * 26 + this.rng.range(-4, 4);
        if (this._free(x, y, r)) {
          const b = this._makeBall(type, x, y);
          Body.setVelocity(b, { x: this.rng.range(-0.6, 0.6), y: 0.5 });
          ok = true;
          placed++;
        }
      }
      if (!ok) keep.push(type);
    }
    this.pendingAdds = keep;
    return placed;
  }

  // Hybrid refill (GDD §7): remaining balls stay; add = min(36-remain, max(6, 24-remain)).
  static refillAmount(remain) {
    const r = Math.max(0, Math.min(POT.maxCount, remain));
    const add = Math.max(0, Math.min(POT.maxCount - r, Math.max(POT.minAdd, POT.minTarget - r)));
    return { remain: r, add, next: r + add };
  }

  refill(bigRate, coldRate = 0) {
    const { remain, add } = PotPhysics.refillAmount(this.count);
    for (let i = 0; i < add; i++) this.pendingAdds.push(this.rollType(bigRate, coldRate));
    this.pourX = POT_GEOM.pourClump ? this.rng.range(70, POT_GEOM.W - 70) : null;
    // gentle stir: small impulses to existing balls (no teleport)
    for (const b of this.balls.values()) {
      Body.setVelocity(b, { x: b.velocity.x + this.rng.range(-1.2, 1.2), y: b.velocity.y - this.rng.range(0, 1.6) });
    }
    this.placePending(6);
    return { remain, add };
  }

  // Tencereyi Karıştır: strong physical impulse to every ball. Ids/types are untouched, nothing is spawned
  // or removed, no teleport. Deterministic (seeded).
  // Alpha 0.3: the stir throws every ball up and toward the middle pool (still pure physics; balls land wherever
  // the collisions take them). Alpha 0.2 threw them randomly sideways, which mostly scattered the oil.
  shuffle() {
    const cx = POT_GEOM.W / 2;
    for (const b of this.balls.values()) {
      const vx = Math.max(-5, Math.min(5, (cx - b.position.x) * 0.035)) + this.rng.range(-1.2, 1.2);
      Body.setVelocity(b, { x: vx, y: -this.rng.range(7, 11) });
    }
  }

  settle(steps) {
    for (let i = 0; i < steps; i++) this.step();
  }

  // One fixed 1/60 s step. If a ladle target pose is given, the ladle is interpolated across the substeps
  // so that moving colliders never jump further than a few pixels per physics update.
  step(targetPose) {
    const from = this.ladlePose;
    for (let s = 0; s < SUBSTEPS; s++) {
      if (targetPose && from && this.ladleParts.length) {
        const k = (s + 1) / SUBSTEPS;
        this.setLadlePose(
          from.x + (targetPose.x - from.x) * k,
          from.y + (targetPose.y - from.y) * k,
          from.open + (targetPose.open - from.open) * k,
          true,
        );
      }
      Engine.update(this.engine, STEP_MS / SUBSTEPS);
    }
    this.stepCount++;
    for (const b of this.balls.values()) {
      if (b.ghostSteps > 0) {
        b.ghostSteps--;
        if (b.ghostSteps === 0) b.collisionFilter = { ...BALL_FILTER };
      }
      // safety: a ball must never escape the pot (numerical tunnelling guard, no randomness)
      if (b.position.y > floorY(b.position.x) + 30 || b.position.x < -30 || b.position.x > POT_GEOM.W + 30) {
        Body.setPosition(b, { x: Math.min(POT_GEOM.W - 20, Math.max(20, b.position.x)), y: 20 });
        Body.setVelocity(b, { x: 0, y: 0 });
      }
    }
    if (this.pendingAdds.length && this.stepCount % 8 === 0) this.placePending(2);
  }

  // ---------- Ladle geometry ----------
  // Two hinged halves of a perforated kitchen ladle (kevgir). Each half is an arc of static segments.
  buildLadle(radius, rimLift) {
    for (const p of this.ladleParts) Composite.remove(this.world, p);
    this.ladleParts = [];
    const lip = Math.asin(Math.min(0.9, rimLift)); // lip angle above the hinge line
    const segs = 9;
    const thick = 10;
    const halves = [];
    for (const side of [-1, 1]) {
      const parts = [];
      // left: theta from 90° (bottom) to 180°+lip; right mirrored
      const t0 = Math.PI / 2;
      const t1 = side < 0 ? Math.PI + lip : -lip;
      for (let i = 0; i < segs; i++) {
        const a0 = t0 + ((t1 - t0) * i) / segs;
        const a1 = t0 + ((t1 - t0) * (i + 1)) / segs;
        const p0 = { x: radius * Math.cos(a0), y: radius * Math.sin(a0) };
        const p1 = { x: radius * Math.cos(a1), y: radius * Math.sin(a1) };
        const len = Math.hypot(p1.x - p0.x, p1.y - p0.y) + 4;
        // segment centre pushed outward by half thickness so the inner surface is the arc
        const am = (a0 + a1) / 2;
        const local = {
          x: ((p0.x + p1.x) / 2) + Math.cos(am) * (thick / 2),
          y: ((p0.y + p1.y) / 2) + Math.sin(am) * (thick / 2),
          ang: Math.atan2(p1.y - p0.y, p1.x - p0.x),
        };
        const body = Bodies.rectangle(0, 0, len, thick, {
          isStatic: true,
          friction: 0.5,
          frictionStatic: 0.8,
          restitution: 0.02,
          collisionFilter: { category: CAT_LADLE, mask: CAT_BALL },
        });
        body.local = local;
        body.side = side;
        parts.push(body);
      }
      halves.push(parts);
    }
    this.ladleParts = halves.flat();
    Composite.add(this.world, this.ladleParts);
    this.ladleShape = { radius, lip, rimH: radius * Math.sin(lip), thick };
  }

  // Pose: hinge (pivot) position and opening angle (0 = closed bowl).
  setLadlePose(px, py, open, updateVelocity = true) {
    this.ladlePose = { x: px, y: py, open };
    for (const b of this.ladleParts) {
      const a = b.side < 0 ? open : -open;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const lx = b.local.x * c - b.local.y * s;
      const ly = b.local.x * s + b.local.y * c;
      Body.setPosition(b, { x: px + lx, y: py + ly }, updateVelocity);
      Body.setAngle(b, b.local.ang + a, updateVelocity);
    }
  }

  // Balls physically resting in the closed ladle bowl (geometry test on real body positions).
  ballsInLadle() {
    const { x: px, y: py } = this.ladlePose;
    const { radius, rimH, lip } = this.ladleShape;
    const res = [];
    for (const b of this.balls.values()) {
      if (b.collisionFilter.category === CAT_GHOST) continue;
      const lx = b.position.x - px;
      const ly = b.position.y - py;
      const d = Math.hypot(lx, ly);
      const r = b.circleRadius;
      const inBowl = ly >= -rimH && d <= radius;
      const onTop = Math.abs(lx) < radius * Math.cos(lip) && ly >= -(rimH + 2.4 * r) && ly < 0 && Math.abs(b.velocity.y) < 2.5;
      if (inBowl || onTop) res.push(b);
    }
    return res;
  }

  // Release a ball from the ladle so it physically falls back into the pot.
  spill(b, dir) {
    b.collisionFilter = { ...GHOST_FILTER };
    b.ghostSteps = 70;
    Body.setVelocity(b, { x: dir * 2.4, y: -2.2 });
  }

  removeBall(b) {
    Composite.remove(this.world, b);
    this.balls.delete(b.ballId);
  }

  // ---------- snapshot ----------
  serialize() {
    return {
      nextBallId: this.nextBallId,
      pending: this.pendingAdds.slice(),
      balls: [...this.balls.values()].map((b) => ({
        id: b.ballId,
        t: b.oilType,
        x: +b.position.x.toFixed(3),
        y: +b.position.y.toFixed(3),
        vx: +b.velocity.x.toFixed(4),
        vy: +b.velocity.y.toFixed(4),
      })),
    };
  }

  restore(data) {
    for (const b of this.balls.values()) Composite.remove(this.world, b);
    this.balls.clear();
    for (const s of data.balls) {
      const b = this._makeBall(s.t, s.x, s.y, s.id);
      Body.setVelocity(b, { x: s.vx, y: s.vy });
    }
    this.pendingAdds = data.pending.slice();
    this.nextBallId = Math.max(this.nextBallId, data.nextBallId);
  }

  countByType() {
    const c = { normal: 0, big: 0, cold: 0 };
    for (const b of this.balls.values()) c[b.oilType]++;
    return c;
  }
}
