// node-postgres adapter for the command layer: db.tx(fn) runs fn(q) inside BEGIN/COMMIT.
import pg from 'pg';

export function createPgDb(connectionString) {
  const pool = new pg.Pool({ connectionString, max: 10 });
  return {
    pool,
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        // serialize queries on this transaction's connection (Promise.all safe)
        let chain = Promise.resolve();
        const q = (sql, params = []) => {
          const p = chain.then(() => client.query(sql, params)).then((r) => r.rows);
          chain = p.catch(() => {});
          return p;
        };
        const out = await fn(q);
        await client.query('commit');
        return out;
      } catch (e) {
        try { await client.query('rollback'); } catch { /* ignore */ }
        throw e;
      } finally {
        client.release();
      }
    },
    async query(sql, params = []) { return (await pool.query(sql, params)).rows; },
    async end() { await pool.end(); },
  };
}
