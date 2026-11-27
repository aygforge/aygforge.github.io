// tests/unit/_storage.mjs — in-memory localStorage for node unit tests (import first). `failWrites` simulates quota errors.
const m = new Map();
globalThis.localStorage = {
  failWrites: false,
  getItem: k => (m.has(k) ? m.get(k) : null),
  setItem(k, v) { if (this.failWrites) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; } m.set(k, String(v)); },
  removeItem: k => { m.delete(k); }, clear: () => m.clear(), key: i => [...m.keys()][i] ?? null, get length() { return m.size; },
};
