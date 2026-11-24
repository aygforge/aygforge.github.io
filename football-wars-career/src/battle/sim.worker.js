// Web Worker: runs world matches with the same deterministic engine as the main thread.
import { simJob } from '../career/sim.js';
self.onmessage = e => {
  const { id, jobs } = e.data;
  try { const out = jobs.map(j => [j.fid, simJob(j)]); self.postMessage({ id, out }); }
  catch (err) { self.postMessage({ id, error: String(err && err.message || err) }); }
};
