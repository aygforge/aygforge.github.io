// Single authoritative game state with atomic, idempotent transactions (undo log on failure).
import { deepClone } from './util.js';

export class TxError extends Error {
  constructor(code, detail, data) { super(detail || code); this.code = code; this.data = data; }
}

class Tx {
  constructor(store, id) { this.store = store; this.id = id; this.undo = []; this.events = []; }
  set(obj, key, val) {
    const had = Object.prototype.hasOwnProperty.call(obj, key); const old = obj[key];
    this.undo.push(() => { if (had) obj[key] = old; else delete obj[key]; });
    obj[key] = val;
  }
  del(obj, key) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) return;
    const old = obj[key];
    this.undo.push(() => { obj[key] = old; });
    delete obj[key];
  }
  push(arr, v) { arr.push(v); this.undo.push(() => { const i = arr.lastIndexOf(v); if (i >= 0) arr.splice(i, 1); }); }
  add(obj, key, delta) { this.set(obj, key, (obj[key] || 0) + delta); }
  emit(type, payload) { this.events.push([type, payload]); }
  fail(code, detail, data) { throw new TxError(code, detail, data); }
}

export class StateStore {
  constructor(state, bus) {
    this.state = state; this.bus = bus;
    this.inTx = null;
    this.revisionDirty = 0;
  }

  /** Run fn atomically. txId (optional) makes it idempotent: same id never commits twice. */
  transaction(txId, fn) {
    const ledger = this.state.transactionLedger;
    if (txId && ledger.committed[txId]) return { ok: false, code: 'DUPLICATE_TX', duplicate: true };
    if (this.inTx) {
      // nested: share outer transaction
      return { ok: true, value: fn(this.inTx) };
    }
    const tx = new Tx(this, txId);
    this.inTx = tx;
    try {
      const value = fn(tx);
      if (txId) {
        ledger.committed[txId] = this.state.clock.gameElapsedSeconds | 0;
        ledger.order.push(txId);
        if (ledger.order.length > 3000) {
          // rolling window; claimKeys are kept separately forever
          const drop = ledger.order.splice(0, ledger.order.length - 3000);
          for (const d of drop) delete ledger.committed[d];
        }
      }
      this.inTx = null;
      this.revisionDirty++;
      for (const [t, p] of tx.events) this.bus?.emit(t, p);
      return { ok: true, value };
    } catch (e) {
      for (let i = tx.undo.length - 1; i >= 0; i--) tx.undo[i]();
      this.inTx = null;
      if (e instanceof TxError) return { ok: false, code: e.code, detail: e.message, data: e.data };
      throw e;
    }
  }

  /** Permanent claim keys (unique POI rewards, blueprints, story specials). */
  hasClaim(key) { return !!this.state.transactionLedger.claimKeys[key]; }
  claim(tx, key) {
    if (this.hasClaim(key)) tx.fail('ALREADY_CLAIMED', key);
    tx.set(this.state.transactionLedger.claimKeys, key, this.state.clock.gameElapsedSeconds | 0);
  }

  nextUid(prefix) {
    const s = this.state;
    s.uidCounter = (s.uidCounter || 0) + 1;
    return `${prefix}_${s.world.worldSeed.toString(36)}_${s.uidCounter.toString(36)}`;
  }

  snapshot() { return deepClone(this.state); }
}
