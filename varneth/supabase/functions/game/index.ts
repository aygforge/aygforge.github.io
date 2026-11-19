// Supabase Edge Function: the authoritative VARNETH command endpoint.
// - Verifies the caller's Supabase Auth JWT (publishable key + user token).
// - Executes the shared command layer inside a real PostgreSQL transaction using the
//   function's private DB connection (SUPABASE_DB_URL is provided by Supabase; never
//   exposed to the browser).
// Deploy: npm run build:edge && supabase functions deploy game
import postgres from 'npm:postgres@3.4.5';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createGameServer } from './_shared/server/commands.js';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 4, prepare: false });
const db = {
  tx<T>(fn: (q: (text: string, params?: unknown[]) => Promise<any[]>) => Promise<T>): Promise<T> {
    return sql.begin(async (tx: any) => {
      let chain: Promise<unknown> = Promise.resolve();
      const q = (text: string, params: unknown[] = []) => {
        const p = chain.then(() => tx.unsafe(text, params as any[])).then((r: any) => Array.from(r));
        chain = p.catch(() => {});
        return p;
      };
      return fn(q);
    }) as Promise<T>;
  },
};
const game = createGameServer(db);
const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { ...CORS, 'content-type': 'application/json' } });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error } = await sb.auth.getUser();
    if (error || !user) return json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Oturum gerekli.' } });
    const body = await req.json();
    const data = await game.exec(user.id, String(body.name), body.args ?? {}, body.idem ?? null);
    return json({ ok: true, data });
  } catch (e: any) {
    const known = e?.code && !/^[0-9A-Z]{5}$/.test(e.code);
    if (!known) console.error(e);
    return json({ ok: false, error: { code: known ? e.code : 'SERVER_ERROR', message: known ? e.message : 'Sunucu hatası' } });
  }
});
