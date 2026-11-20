// Seeded batch for balance reports: one chapter × one policy × one upgrade profile.
// Usage: node tests/sim/batch.mjs <chapterId> <policy random|good|bad> <runs> [profile none|upg] [seedBase]
// Prints one JSON line. Seeds are deterministic: seedBase + i.
import { simulateRun } from './simlib.mjs';
import { defaultSave } from '../../src/systems/SaveService.js';
import { CHAPTERS } from '../../src/data/content.js';

// Optional balance override for parameter search (does not touch the game files):
// BALANCE='{"menemen":{"hpScale":1.5,...},"fries":{...}}'
if (process.env.BALANCE) {
  const o = JSON.parse(process.env.BALANCE);
  for (const c of CHAPTERS) if (o[c.id] && c.balance) Object.assign(c.balance, o[c.id]);
}

const [chapterId = 'menemen', policy = 'random', nArg = '100', profile = 'none', seedArg = '10000', pick = 'random'] = process.argv.slice(2);
const N = Number(nArg);
const save = defaultSave();
if (profile === 'upg') Object.assign(save.upgrades, { capacity: 2, width: 2, toughness: 2, mastery: 2 });
const t0 = Date.now();
const acc = { wins: 0, stars: [0, 0, 0, 0], hpLost: 0, turns: 0, loads: [], estSec: 0, picks: {}, failures: 0, waveReached: [0, 0, 0, 0, 0, 0, 0, 0], escaped: 0, shots: 0, bossTurns: [], crits: 0, capped: 0, nan: 0, doubleResult: 0, loadHist: new Array(13).fill(0), ineffective: {}, picked: {}, shuffles: 0 };
for (let i = 0; i < N; i++) {
  let r;
  try {
    r = simulateRun({ chapterId, seed: Number(seedArg) + i, policy, pickPolicy: pick, save, maxSteps: 200000 });
  } catch (e) {
    acc.failures++;
    continue;
  }
  if (!r.ctl.finished || r.log.results !== 1 || /NaN|Infinity/.test(JSON.stringify(r.run))) acc.failures++;
  if (/NaN|Infinity/.test(JSON.stringify(r.run))) acc.nan++;
  if (r.log.results > 1) acc.doubleResult++;
  for (const l of r.run.stats.loads) acc.loadHist[Math.min(12, l)]++;
  acc.shuffles += r.run.stats.shuffles || 0;
  // a picked card that never produced its effect in the whole run (Alpha 0.3 tracks run.stats.procs)
  if (r.run.stats.procs) {
    for (const id of Object.keys(r.run.abilities)) {
      acc.picked[id] = (acc.picked[id] || 0) + 1;
      if (!r.run.stats.procs[id]) acc.ineffective[id] = (acc.ineffective[id] || 0) + 1;
    }
  }
  const run = r.run;
  if (r.result?.victory) acc.wins++;
  acc.stars[r.result?.stars || 0]++;
  acc.hpLost += run.stats.hpLost;
  acc.turns += run.turn;
  acc.loads.push(...run.stats.loads);
  acc.escaped += run.stats.escaped;
  acc.shots += run.stats.shots;
  acc.waveReached[Math.min(7, run.wave)]++;
  if (r.result?.victory && run.stats.bossStartTurn != null) acc.bossTurns.push(run.turn - run.stats.bossStartTurn);
  acc.crits += run.stats.crits || 0;
  acc.capped += run.stats.cappedEvents || 0;
  // time estimate at 1x animation: fixed-step simulation time + ~1.1 s/turn of battle animation + 0.15 s per shot
  acc.estSec += r.steps / 60 + run.turn * 1.1 + run.stats.shots * 0.15;
  for (const [id, n] of Object.entries(run.abilities)) acc.picks[id] = (acc.picks[id] || 0) + n;
}
const avg = (x) => +(x / Math.max(1, N)).toFixed(2);
console.log(
  JSON.stringify({
    chapterId, policy, profile, runs: N, failures: acc.failures,
    winRate: +(acc.wins / N).toFixed(3), stars: acc.stars,
    avgHpLost: avg(acc.hpLost), avgTurns: avg(acc.turns),
    avgLoad: +(acc.loads.reduce((a, b) => a + b, 0) / Math.max(1, acc.loads.length)).toFixed(2),
    avgEscaped: avg(acc.escaped), avgShots: avg(acc.shots),
    avgMinutes: +(acc.estSec / N / 60).toFixed(2), lostAtWave: acc.waveReached, picks: acc.picks,
    avgBossTurns: acc.bossTurns.length ? +(acc.bossTurns.reduce((a, b) => a + b, 0) / acc.bossTurns.length).toFixed(2) : null,
    avgCrits: avg(acc.crits), cappedEvents: acc.capped, nan: acc.nan, doubleResult: acc.doubleResult,
    loadHist: acc.loadHist, pick, shuffles: acc.shuffles, picked: acc.picked, ineffective: acc.ineffective,
    balance: CHAPTERS.find((c) => c.id === chapterId).balance || null,
    seconds: +((Date.now() - t0) / 1000).toFixed(1),
  }),
);
