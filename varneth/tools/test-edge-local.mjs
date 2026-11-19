// Runs the REAL Edge Function code under Deno against a local PostgreSQL, with a tiny stub
// of the Supabase Auth /user endpoint. Usage: node tools/test-edge-local.mjs <path-to-deno>
import http from 'node:http';
import { spawn } from 'node:child_process';
const DENO = process.argv[2] || 'deno';
const DB = process.env.EDGE_DB_URL || 'postgres://postgres:postgres@localhost:5432/varneth_edge';
const users = { tokA: '11111111-1111-4111-8111-111111111111', tokB: '22222222-2222-4222-8222-222222222222' };
const auth = http.createServer((req, res) => {
  const tok = (req.headers.authorization || '').replace('Bearer ', '');
  res.setHeader('content-type', 'application/json');
  if (req.url.startsWith('/auth/v1/user') && users[tok]) return res.end(JSON.stringify({ id: users[tok], aud: 'authenticated', role: 'authenticated', email: tok + '@x.y' }));
  res.statusCode = 401; res.end(JSON.stringify({ msg: 'invalid JWT' }));
}).listen(54329);
const fn = spawn(DENO, ['run', '-A', '--no-prompt', '--config', 'supabase/functions/game/deno.json', 'supabase/functions/game/index.ts'], { env: { ...process.env, SUPABASE_URL: 'http://localhost:54329', SUPABASE_ANON_KEY: 'anon', SUPABASE_DB_URL: DB }, stdio: 'pipe' });
let ready = false;
const watch = (d) => { if (String(d).includes('Listening')) ready = true; };
fn.stderr.on('data', (d) => { watch(d); if (!String(d).includes('Download')) process.stderr.write('[deno] ' + d); });
fn.stdout.on('data', watch);
for (let i = 0; i < 300 && !ready; i++) await new Promise((r) => setTimeout(r, 200));
let k = 0;
const call = async (tok, name, args = {}) => {
  const r = await fetch('http://localhost:8000', { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify({ name, args, idem: 'edge-' + Date.now() + '-' + ++k }) });
  return r.json();
};
const results = [];
const check = (label, cond) => { results.push([label, !!cond]); console.log(cond ? 'PASS' : 'FAIL', label); };
try {
  check('function started', ready);
  check('rejects invalid JWT', (await call('nope', 'bootstrap')).error?.code === 'UNAUTHENTICATED');
  check('create profile A', (await call('tokA', 'create_profile', { displayName: 'EdgeA' })).ok);
  check('create profile B', (await call('tokB', 'create_profile', { displayName: 'EdgeB' })).ok);
  const c = await call('tokA', 'create_character', { slot: 1, name: 'Kenar', cls: 'ranger' });
  check('create character', c.ok);
  const s = await call('tokA', 'farm_start', { characterId: c.data.characterId, kind: 'farm', target: 'abandoned_road' });
  check('farm_start returns snapshot', s.ok && s.data.session.snapshot.p);
  await new Promise((r) => setTimeout(r, 3000));
  const hb = await call('tokA', 'farm_heartbeat', { sessionId: s.data.session.id });
  check('heartbeat settles server-time ticks (~60)', hb.ok && hb.data.settlement.toTick >= 50 && hb.data.settlement.toTick < 120);
  check('unknown command rejected', (await call('tokA', 'grant_gold', {})).error?.code === 'UNKNOWN_COMMAND');
  const boot = await call('tokB', 'bootstrap');
  check('bootstrap B (bigint/jsonb parsing)', boot.ok && boot.data.gold === 150 && typeof boot.data.gold === 'number');
} finally {
  fn.kill(); auth.close();
}
const failed = results.filter((r) => !r[1]).length;
console.log(`${results.length - failed}/${results.length} edge checks passed`);
process.exit(failed ? 1 : 0);
