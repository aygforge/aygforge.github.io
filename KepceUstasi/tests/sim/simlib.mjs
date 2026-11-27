// Headless simulation helpers: the real RunController + real Matter.js pot, no rendering.
//
// Tap policies (Alpha 0.3; also used to re-measure Alpha 0.2 on the same seeds):
//  - random  : taps at a uniformly random moment within one swing period
//  - bad     : taps while the ladle is at the edge of its swing
//  - perfect / good / average : "pot readers". At each swing they look at the pot, pick the visibly richest spot
//    (oil load under a ladle-wide window, at 9 candidate positions) and tap when the ladle passes it, with a
//    Gaussian timing error of 0 / 4 / 8 fixed steps (0 / 67 / 133 ms).
// Card policies: random | first | dmg | control | sustain (deliberate builds, see BUILDS).
import { RunController, PHASE } from '../../src/systems/RunController.js';
import { Rng } from '../../src/core/rng.js';
import { permStats } from '../../src/systems/Progression.js';
import { defaultSave } from '../../src/systems/SaveService.js';
import { STEP_MS } from '../../src/systems/PotPhysics.js';

const SIGMA = { perfect: 0, good: 4, average: 8 };
const LOAD = { normal: 1, big: 2, cold: 1 };

export const BUILDS = {
  dmg: ['double_shot', 'critical_fry', 'power_shot', 'heavy_oil', 'explosive_oil', 'piercing_oil', 'first_bite', 'last_drop', 'deep_ladle', 'wide_ladle'],
  control: ['oil_knockback', 'cold_oil', 'slow_swing', 'explosive_oil', 'pot_shuffle', 'salt_shield', 'wide_ladle', 'double_shot'],
  sustain: ['thick_apron', 'tasty_heal', 'spiked_apron', 'salt_shield', 'first_aid', 'stable_rim', 'deep_ladle', 'double_shot'],
};

function gauss(r) {
  return Math.sqrt(-2 * Math.log(1 - r.next())) * Math.cos(2 * Math.PI * r.next());
}

// The spot a player would aim for: most oil (in load units) under a ladle-wide window.
export function readPot(ctl) {
  const { amp, centerX } = ctl.ladle;
  const r = ctl.ladle.params.radius;
  let best = centerX;
  let bestV = -1;
  for (let i = 0; i <= 8; i++) {
    const x = centerX - amp + (2 * amp * i) / 8;
    let v = 0;
    for (const b of ctl.pot.balls.values()) if (Math.abs(b.position.x - x) < r * 0.9) v += LOAD[b.oilType] || 1;
    v -= Math.abs(x - centerX) * 0.001; // tie -> nearer the middle
    if (v > bestV) {
      bestV = v;
      best = x;
    }
  }
  return { x: best, density: bestV };
}

// first fixed step >= minStep at which the swing passes x
export function crossingStep(ctl, x, minStep = 10) {
  const T = (ctl.ladle.params.period * 1000) / STEP_MS;
  const a = Math.asin(Math.max(-1, Math.min(1, (x - ctl.ladle.centerX) / ctl.ladle.amp)));
  const c = [];
  for (let k = 0; k < 3; k++) c.push((a / (2 * Math.PI) + k) * T, (0.5 - a / (2 * Math.PI) + k) * T);
  return Math.round(c.filter((t) => t >= minStep).sort((p, q) => p - q)[0]);
}

function pickCard(offer, pickPolicy, rng) {
  if (pickPolicy === 'random') return rng.pick(offer);
  if (BUILDS[pickPolicy]) {
    for (const id of BUILDS[pickPolicy]) if (offer.includes(id)) return id;
    return rng.pick(offer);
  }
  return offer[0];
}

export function simulateRun({ chapterId = 'menemen', seed = 1, save = defaultSave(), policy = 'random', maxSteps = 200000, snapshotAt = null, pickPolicy = 'first' } = {}) {
  const tapRng = new Rng(seed * 7919 + 13);
  const ctl = new RunController({ chapterId, perm: permStats(save), seed, runId: `sim-${seed}`, autoAck: true });
  const log = { results: 0, checkpoints: [], phases: {}, errors: [], swingSteps: 0 };
  let tapAt = null;
  let result = null;
  let wantShuffle = false;
  let shuffledThisSwing = false;
  ctl.on((e) => {
    if (e.kind === 'swing') {
      const T = Math.round((e.params.period * 1000) / STEP_MS);
      if (policy === 'random') tapAt = tapRng.int(4, T);
      else if (policy in SIGMA) {
        // a reader with the Tencereyi Karıştır card shakes the pot when no spot is worth a full ladle
        wantShuffle = !!ctl.run.abilities.pot_shuffle && ctl.canShuffle && readPot(ctl).density < e.params.capacity * 0.75;
        tapAt = null; // decided after a possible shuffle settles
      } else tapAt = typeof policy === 'number' ? policy : null;
    }
    if (e.kind === 'skillChoice') log.pendingPick = pickCard(e.offer, pickPolicy, tapRng);
    if (e.kind === 'checkpoint') log.checkpoints.push(e.snapshot);
    if (e.kind === 'result') {
      log.results++;
      result = e;
    }
  });
  ctl.start();
  let steps = 0;
  let swingSteps = 0;
  while (!ctl.finished && steps < maxSteps) {
    if (ctl.phase === PHASE.SKILL_CHOICE && log.pendingPick) {
      const id = log.pendingPick;
      log.pendingPick = null;
      if (!ctl.chooseSkill(id)) log.errors.push('chooseSkill failed ' + id);
      continue;
    }
    if (ctl.phase === PHASE.SWING_WAIT) {
      swingSteps++;
      log.swingSteps++;
      if (wantShuffle && swingSteps === 2) {
        wantShuffle = false;
        if (ctl.shufflePot && ctl.shufflePot()) {
          tapAt = null;
          shuffledThisSwing = true;
        }
      }
      if (policy in SIGMA && tapAt == null && swingSteps >= 2) {
        // read the pot once the balls have settled enough (after a shuffle wait ~40 steps)
        const wait = shuffledThisSwing && swingSteps < 40 ? null : 1;
        if (wait) {
          const target = readPot(ctl);
          tapAt = Math.max(swingSteps + 1, Math.round(crossingStep(ctl, target.x, swingSteps + 8) + gauss(tapRng) * SIGMA[policy]));
        }
      }
      let want;
      if (policy === 'bad') want = Math.abs(ctl.pot.ladlePose.x - ctl.ladle.centerX) > ctl.ladle.amp - 12 || swingSteps > 300;
      else want = tapAt != null && swingSteps >= tapAt;
      if (want) {
        ctl.tap();
        swingSteps = 0;
        tapAt = null;
        shuffledThisSwing = false;
      }
    }
    ctl.update(STEP_MS + 0.0001);
    steps++;
    if (snapshotAt && log.checkpoints.length >= snapshotAt) break;
  }
  return { ctl, result, steps, log, run: ctl.run };
}
