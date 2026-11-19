// Runtime-agnostic helpers for the trusted command layer (Node, Deno edge function, browser sandbox).
export class GameError extends Error {
  constructor(code, message, extra) {
    super(message || code);
    this.code = code;
    this.extra = extra;
  }
}

export const J = (v) => JSON.stringify(v ?? null);
export const ACCOUNT_SCOPE = '00000000-0000-0000-0000-000000000000';

export function uuid() {
  return globalThis.crypto.randomUUID();
}

export function secureSeed() {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0] >>> 1; // 31-bit positive
}

export function num(v) {
  if (v === null || v === undefined) return 0;
  return typeof v === 'bigint' ? Number(v) : Number(v);
}

export function isoWeek(ms) {
  const d = new Date(ms);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((t - y0) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}

export function utcDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

const RETRY = new Set(['40001', '40P01']);
// Wrap db.tx with retries on serialization failures / deadlocks.
export async function withTx(db, fn, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await db.tx(fn);
    } catch (e) {
      last = e;
      if (!RETRY.has(e.code)) throw e;
      await new Promise((r) => setTimeout(r, 10 + Math.random() * 40 * (i + 1)));
    }
  }
  throw last;
}
