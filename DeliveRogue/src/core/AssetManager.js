// core/AssetManager.js — logical asset IDs -> source (procedural or file) with fallback.
// Phase 01: every gameplay visual is still the procedural Art registry (behaviour preservation).
// External PNG/atlas files declared in docs/AssetManifest.json can be attached later through
// `AssetManager.loadImage(id, url, meta)`; on success it calls Art.register(), on failure the
// procedural fallback stays active and the id is reported as missing.
import { Art } from './Art.js';

const status = new Map(); // id -> 'procedural' | 'real' | 'missing'

export const AssetManager = {
  /** Mark procedural assets that exist in the Art registry/cache. */
  markProcedural(ids) { ids.forEach(id => { if (!status.has(id)) status.set(id, 'procedural'); }); },
  /** Load a real bitmap for a logical id. Never throws; resolves to true/false. */
  loadImage(id, url, { w, h, ax, ay }) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => { Art.register(id, img, w, h, ax ?? w / 2, ay ?? h); status.set(id, 'real'); res(true); };
      img.onerror = () => { status.set(id, 'missing'); console.warn('[AssetManager] missing asset', id, url); res(false); };
      img.src = url;
    });
  },
  get: id => Art.get(id),
  report() { const r = { procedural: [], real: [], missing: [] }; for (const [id, s] of status) r[s].push(id); return r; },
};
