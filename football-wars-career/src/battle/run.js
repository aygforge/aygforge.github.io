// Headless match execution (used by Quick Simulate, Auto Coach verification, world simulation workers and replays).
import E from './engine.js';
import { matchOptions } from './adapter.js';

export const MAX_SIM_T = 80;
// job: {seed, home: snapshot, away: snapshot, coach:[policy|null, policy|null], commands:[...]}
export function runMatch(job, o = {}) {
  const opts = matchOptions(job.home, job.away, job.seed, { headless: true, noLog: !o.keepLog, fxLevel: 0, coach: job.coach, commands: job.commands });
  const w = E.createWorld(opts);
  while (w.phase !== 'ended' && w.t < MAX_SIM_T) E.step(w);
  const s = E.careerSummary(w);
  if (o.keepWorld) s.world = w;
  return s;
}
export function createLiveWorld(job, fxLevel) {
  return E.createWorld(matchOptions(job.home, job.away, job.seed, { headless: false, noLog: false, fxLevel: fxLevel == null ? 1 : fxLevel, coach: job.coach, commands: job.commands }));
}
export { E };
