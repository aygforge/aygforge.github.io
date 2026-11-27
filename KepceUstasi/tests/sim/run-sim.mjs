// Seeded batch simulation (QA 13 / A18): N full runs with the real controller + real physics.
// Checks: no exception, no stuck wave (step budget), no NaN, no negative HP/tips, result exactly once.
// Usage: node tests/sim/run-sim.mjs [runs=100] [policy=random|good|bad]
import { simulateRun } from './simlib.mjs';
import { applyRunResult } from '../../src/systems/Progression.js';
import { defaultSave } from '../../src/systems/SaveService.js';
import { CHAPTERS } from '../../src/data/content.js';

const N = Number(process.argv[2] || 100);
const policyName = process.argv[3] || 'random';
const policies = { random: 'random', good: 'good', bad: 'bad' };
const t0 = Date.now();
const rows = [];
let failures = 0;
const save = defaultSave();
for (let i = 1; i <= N; i++) {
  const chapterId = i % 2 ? 'menemen' : 'fries';
  let r;
  try {
    r = simulateRun({ chapterId, seed: 1000 + i, policy: policies[policyName], pickPolicy: 'random', maxSteps: 120000 });
  } catch (err) {
    failures++;
    rows.push({ i, chapterId, error: String(err && err.stack) });
    continue;
  }
  const run = r.run;
  const problems = [];
  if (!r.ctl.finished) problems.push('STUCK (step budget exhausted)');
  if (r.log.results !== 1) problems.push(`results=${r.log.results}`);
  const nums = JSON.stringify(run).match(/NaN|Infinity/);
  if (nums) problems.push('NaN/Infinity in state');
  if (run.chef.hp < 0) problems.push('negative chef hp');
  if (run.enemies.some((e) => e.hp < 0 || e.shield < 0)) problems.push('negative enemy hp');
  const killIds = run.enemies.filter((e) => e.dead).map((e) => e.id);
  if (new Set(killIds).size !== killIds.length) problems.push('duplicate kill');
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (r.result) {
    const out = applyRunResult(save, chapter, run, r.result);
    if (out.duplicate) problems.push('duplicate runId');
    if (save.tips < 0 || !Number.isFinite(save.tips)) problems.push('bad tips');
  }
  if (problems.length) failures++;
  const loads = run.stats.loads;
  rows.push({
    i,
    chapterId,
    victory: r.result?.victory,
    stars: r.result?.stars,
    wave: run.wave,
    turns: run.turn,
    hpLost: run.stats.hpLost,
    avgLoad: +(loads.reduce((a, b) => a + b, 0) / Math.max(1, loads.length)).toFixed(2),
    zeroCatches: run.stats.catches.filter((x) => x === 0).length,
    problems,
  });
}
const ok = rows.filter((r) => !r.error);
const wins = ok.filter((r) => r.victory).length;
const by = (ch) => ok.filter((r) => r.chapterId === ch);
const avg = (a, k) => (a.reduce((s, r) => s + r[k], 0) / Math.max(1, a.length)).toFixed(2);
const summary = {
  runs: N,
  policy: policyName,
  failures,
  wins,
  winRate: +(wins / Math.max(1, ok.length)).toFixed(3),
  avgLoad: avg(ok, 'avgLoad'),
  avgTurns: { menemen: avg(by('menemen'), 'turns'), fries: avg(by('fries'), 'turns') },
  avgHpLost: { menemen: avg(by('menemen'), 'hpLost'), fries: avg(by('fries'), 'hpLost') },
  stars: [0, 1, 2, 3].map((s) => ok.filter((r) => (r.stars || 0) === s).length),
  totalTipsAfterAllRuns: save.tips,
  seconds: ((Date.now() - t0) / 1000).toFixed(1),
};
for (const r of rows) if (r.error || r.problems?.length) console.log('PROBLEM', JSON.stringify(r));
console.log(JSON.stringify(summary, null, 2));
process.exit(failures ? 1 : 0);
