// Parallel world simulation. Uses inline Web Workers when the browser allows them (also from file://),
// otherwise falls back to time-sliced execution on the main thread (UI stays responsive, progress visible).
import SimWorker from './sim.worker.js?worker&inline';
import { simJob } from '../career/sim.js';

let workers = null, mode = null, seq = 1;
export function poolMode() { return mode; }
function initWorkers() {
  if (workers !== null) return workers;
  try {
    const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));
    workers = []; for (let i = 0; i < n; i++) workers.push(new SimWorker());
    mode = 'workers×' + n;
  } catch (e) { workers = []; mode = 'main-thread'; }
  return workers;
}
// run(jobs, onProgress) -> Promise<{fid: result}>
export function runJobs(jobs, onProgress) {
  const ws = initWorkers();
  if (!ws.length) return runMain(jobs, onProgress);
  return new Promise((resolve) => {
    const out = {}; let next = 0, done = 0, failed = false; const chunk = 3;
    if (!jobs.length) { resolve(out); return; }
    const feed = w => { if (next >= jobs.length) return; const part = jobs.slice(next, next + chunk); next += chunk; w.postMessage({ id: seq++, jobs: part }); };
    const fallback = () => { if (failed) return; failed = true; ws.forEach(w => w.terminate()); workers = []; mode = 'main-thread'; runMain(jobs.filter(j => !out[j.fid]), onProgress, out, done, jobs.length).then(resolve); };
    ws.forEach(w => {
      w.onmessage = e => { if (failed) return; if (e.data.error) { console.warn('worker error', e.data.error); fallback(); return; } for (const [k, v] of e.data.out) out[k] = v; done += e.data.out.length; if (onProgress) onProgress(done, jobs.length); if (done >= jobs.length) resolve(out); else feed(w); };
      w.onerror = ev => { ev.preventDefault && ev.preventDefault(); fallback(); };
      feed(w);
    });
  });
}
function runMain(jobs, onProgress, out = {}, done0 = 0, total = jobs.length) {
  mode = mode || 'main-thread';
  return new Promise(resolve => {
    let i = 0;
    const tick = () => {
      const t0 = performance.now();
      while (i < jobs.length && performance.now() - t0 < 40) { out[jobs[i].fid] = simJob(jobs[i]); i++; }
      if (onProgress) onProgress(done0 + i, total);
      if (i < jobs.length) setTimeout(tick, 0); else resolve(out);
    };
    setTimeout(tick, 0);
  });
}
