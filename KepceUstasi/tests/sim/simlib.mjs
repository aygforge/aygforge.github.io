// Headless simulation helpers: the real RunController + real Matter.js pot, no rendering.
import { RunController, PHASE } from '../../src/systems/RunController.js';
import { Rng } from '../../src/core/rng.js';
import { permStats } from '../../src/systems/Progression.js';
import { defaultSave } from '../../src/systems/SaveService.js';
import { STEP_MS } from '../../src/systems/PotPhysics.js';

export function simulateRun({ chapterId = 'menemen', seed = 1, save = defaultSave(), policy = 'random', maxSteps = 200000, snapshotAt = null, pickPolicy = 'first' } = {}) {
  const tapRng = new Rng(seed * 7919 + 13);
  const ctl = new RunController({ chapterId, perm: permStats(save), seed, runId: `sim-${seed}`, autoAck: true });
  const log = { results: 0, checkpoints: [], phases: {}, errors: [] };
  let tapAt = null;
  let result = null;
  ctl.on((e) => {
    if (e.kind === 'swing') tapAt = policy === 'random' ? tapRng.int(4, 115) : typeof policy === 'number' ? policy : null;
    if (e.kind === 'skillChoice') {
      const id = pickPolicy === 'random' ? tapRng.pick(e.offer) : e.offer[0];
      queueMicrotask(() => {});
      log.pendingPick = id;
    }
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
      const lx = ctl.pot.ladlePose.x;
      const cx = ctl.ladle.centerX;
      const want =
        policy === 'good' ? Math.abs(lx - cx) < 14 + tapRng.next() * 12 || swingSteps > 300
        : policy === 'bad' ? Math.abs(lx - cx) > ctl.ladle.amp - 12 || swingSteps > 300
        : swingSteps >= tapAt;
      if (want) {
        ctl.tap();
        swingSteps = 0;
      }
    }
    ctl.update(STEP_MS + 0.0001);
    steps++;
    if (snapshotAt && log.checkpoints.length >= snapshotAt) break;
  }
  return { ctl, result, steps, log, run: ctl.run };
}
