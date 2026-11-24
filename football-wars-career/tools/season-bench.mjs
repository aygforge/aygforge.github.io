// Real-engine world season: every one of the 3127 matches is a full 100v100 Football Fusion battle.
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
if (!isMainThread) {
  const { simJob } = await import('../src/career/sim.js');
  parentPort.on('message', jobs => parentPort.postMessage(jobs.map(j => [j.fid, simJob(j)])));
} else {
  const { newCareerState } = await import('../src/career/world.js');
  const { setupSeason, startWeek, endWeek, worldJobs, playerFixtures, applyResult } = await import('../src/career/season.js');
  const { playerJob, simJob } = await import('../src/career/sim.js');
  const { DEFAULT_FORMATION } = await import('../src/data/balance.js');
  const { avgStandardQ } = await import('../src/career/economy.js');
  const seasons = +process.argv[2] || 1, NW = Math.max(1, (+process.argv[3] || os.cpus().length));
  const S = newCareerState(2026, { name: 'Bench FC', short: 'BEN', city: 'Bench', stadium: 'Bench Park', primary: '#ff0055', secondary: '#fff', pattern: 'plain', crest: 'shield' }, DEFAULT_FORMATION, 1);
  setupSeason(S);
  const workers = Array.from({ length: NW }, () => new Worker(fileURLToPath(import.meta.url)));
  const runPool = jobs => new Promise(res => {
    const out = {}; let next = 0, done = 0; const chunk = 4;
    if (!jobs.length) return res(out);
    const feed = w => { if (next >= jobs.length) return; const part = jobs.slice(next, next + chunk); next += chunk; w.postMessage(part); };
    workers.forEach(w => { w.removeAllListeners('message'); w.on('message', arr => { for (const [k, v] of arr) out[k] = v; done += arr.length; if (done === jobs.length) res(out); else feed(w); }); feed(w); });
  });
  const t0 = Date.now(); let matches = 0, tb = { alive: 0, hp: 0, coin: 0 }, bt = 0, goals = 0, weekMax = 0;
  for (let s = 0; s < seasons; s++) {
    for (let i = 0; i < 39; i++) {
      const tw = Date.now();
      startWeek(S);
      for (const f of playerFixtures(S)) { const r = simJob(playerJob(S, f, 'auto')); applyResult(S, f, r); matches++; }
      const jobs = worldJobs(S); const res = await runPool(jobs); Object.assign(S.lock.results, res);
      for (const r of Object.values(res)) { matches++; bt += r.battleT; goals += r.football.goals[0] + r.football.goals[1]; if (r.tiebreak) tb[r.tiebreak] = (tb[r.tiebreak] || 0) + 1; }
      const e = endWeek(S); if (!e.ok) throw new Error(e.reason);
      weekMax = Math.max(weekMax, Date.now() - tw);
    }
    const P = S.clubs.PLAYER; const h = S.history.seasons.at(-1);
    console.log(`season ${h.season}: player D${h.div} pos ${h.pos} (${h.W}-${h.L}) move=${h.move} budget=${P.budget} | D1 champ ${h.d1}`);
  }
  const sec = (Date.now() - t0) / 1000;
  const divQ = d => (S.divisions[d].reduce((n, id) => n + avgStandardQ(S.clubs[id]), 0) / 20).toFixed(1);
  console.log(JSON.stringify({ seasons, workers: NW, matches, seconds: sec, msPerMatchWall: +(sec * 1000 / matches).toFixed(1), slowestWeekSec: weekMax / 1000, avgBattleSec: +(bt / matches).toFixed(1), avgGoals: +(goals / matches).toFixed(2), timeLimitDecisions: tb,
    divQuality: Array.from({ length: 10 }, (_, i) => divQ(i + 1)).join(' / '), stars: Object.keys(S.stars).length, aiBudgetMin: Math.min(...Object.values(S.clubs).map(c => c.budget)), aiBudgetMedian: Object.values(S.clubs).map(c => c.budget).sort((a, b) => a - b)[100] }));
  workers.forEach(w => w.terminate());
}
