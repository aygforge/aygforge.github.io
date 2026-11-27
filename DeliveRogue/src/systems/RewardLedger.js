// systems/RewardLedger.js — single authority for one-time rewards (Save System 2.0).
// Every one-time coin reward has a unique grant key (run:<seq>, quest:<id>, ms:<id>, boss:<EP>, legacySkin:<id>);
// a key that exists can never pay again — across reloads, RunSummary re-entry or repeated callbacks. Runs are
// additionally guarded by a monotonic settled-run sequence (high-water mark), so key pruning can never reopen
// an old run reward.
import { Save } from '../core/SaveManager.js';

export const RewardLedger = {
  has: key => Save.data.ledger.grants[key] != null,
  /** Pay `coins` once under `key`. Returns false (and pays nothing) when the key already exists. */
  grant(key, coins) {
    const s = Save.data, L = s.ledger; if (L.grants[key] != null) return false;
    coins = Math.max(0, Math.floor(coins)); L.grants[key] = coins; s.coins += coins;
    L.log.push({ k: key, a: coins, t: Date.now() }); if (L.log.length > 60) L.log.splice(0, L.log.length - 60);
    return true;
  },
  /** Record a reward that is paid as part of another grant (e.g. boss first clear inside the run grant). */
  mark(key, coins) { const L = Save.data.ledger; if (L.grants[key] != null) return false; L.grants[key] = Math.floor(coins); return true; },
  /** Accept a run settlement exactly once (sequence must be above the high-water mark). */
  claimRun(seq) { const L = Save.data.ledger; if (seq == null) return true; if (!(seq > L.runSeq)) return false; L.runSeq = seq; return true; },
};
