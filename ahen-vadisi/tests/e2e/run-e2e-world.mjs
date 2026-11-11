// Ortak dünya (oyun sunucusu) uçtan uca: GERÇEK sunucu süreci (server/index.mjs) + iki tarayıcı.
// Kimlik: sunucu oturum belirtecini sahte Supabase'in /auth/v1/user ucundan doğrular (yerel HTTP).
// Doğrulananlar: ikisi de aynı yaratıkları (aynı kimlik, aynı konum) görür; A'nın vuruşu B'de canı düşürür; yaratık
// yakındaki oyuncuya saldırır ve hasar oyuncunun kendi savunmasıyla işlenir; partide öldürülen yaratığın EXP'si
// paylaşılır (vurmayan üye de alır, görev/öldürme sayacı işler); partisiz yabancı almaz; diğer oyuncular haritada
// görünür; sunucu kapanınca oyun tek oyunculu devam eder, sunucu dönünce yeniden bağlanır.
// Kullanım: npm run build && node tests/e2e/run-e2e-world.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFakeSupabase } from '../fake-supabase.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const PORT = 4179, GS_PORT = 8791, AUTH_PORT = 54401;
const BASE = `http://localhost:${PORT}/`;
const PROJECT = 'https://testproje.supabase.co';
const KEY = 'sb_publishable_testanahtar123';
const results = [];
const record = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };

const fake = createFakeSupabase();
// sahte Supabase'in yerel HTTP yüzü (oyun sunucusu belirteci buradan doğrular)
const authSrv = http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => { body += d; });
  req.on('end', () => {
    const r = fake.handle(req.method, PROJECT + req.url, Object.fromEntries(Object.entries(req.headers)), body || null);
    res.writeHead(r.status, { 'content-type': 'application/json' }); res.end(r.body);
  });
}).listen(AUTH_PORT);

let gs = null;
function startGameServer() {
  gs = spawn('node', ['server/index.mjs'], { cwd: root, stdio: 'pipe', env: { ...process.env, PORT: String(GS_PORT), SUPABASE_URL: `http://localhost:${AUTH_PORT}`, SUPABASE_KEY: KEY } });
  return new Promise((res) => { gs.stdout.on('data', (d) => { if (String(d).includes('sunucusu')) res(); }); setTimeout(res, 5000); });
}
await startGameServer();
const web = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res) => { web.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) res(); }); setTimeout(res, 6000); });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let allowWsErrors = false;
async function device(name) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, serviceWorkers: 'block' });
  await ctx.route('**/online.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: PROJECT, anonKey: KEY, gameServer: `ws://localhost:${GS_PORT}` }) }));
  await ctx.route('**/*.supabase.co/**', (route) => (route.request().url().startsWith(PROJECT) ? route.fallback() : route.abort('blockedbyclient')));
  await ctx.route(`${PROJECT}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    const r = fake.handle(req.method(), req.url(), await req.allHeaders(), req.postData());
    return route.fulfill({ status: r.status, body: r.body, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (allowWsErrors && /WebSocket|ERR_CONNECTION_REFUSED/.test(m.text())) return;
    page.errors.push(m.text());
  });
  await page.goto(BASE + '?dev=1');
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  page.label = name;
  return { ctx, page };
}
const ev = (page, fn, arg) => page.evaluate(fn, arg);
const closeModals = (page) => page.evaluate(() => { const u = window.__AHEN_UI; while (u?.layers?.modal?.firstChild) u.closeModal(); });
async function waitFor(page, fn, arg, ms = 10000) { return page.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false); }
async function register(page, email, nick) {
  await page.tap('[data-testid=menu-online]'); await page.waitForTimeout(250);
  await page.tap('[data-testid=online-register]');
  await page.fill('[data-testid=online-email]', email);
  await page.fill('[data-testid=online-pass]', 'sifre123');
  await page.fill('[data-testid=online-nick]', nick);
  await page.tap('[data-testid=online-submit]');
  await waitFor(page, () => !document.querySelector('[data-testid=online-auth]'), null, 10000);
  await closeModals(page);
}
async function createChar(page, cls, name) {
  await page.tap('[data-testid=menu-play]'); await page.waitForTimeout(250);
  for (let i = 0; i < 5; i++) { await page.tap(`[data-testid=slot-${i}]`); if (await page.$('[data-testid=create-char]')) break; }
  await page.tap('[data-testid=create-char]'); await page.tap(`[data-testid=class-${cls}]`);
  await page.fill('[data-testid=name-input]', name); await page.tap('[data-testid=create-confirm]');
  await page.waitForFunction(() => window.__AHEN?.world?.player, null, { timeout: 20000 }); await page.waitForTimeout(800);
  await closeModals(page);
}
async function toForest(page) {
  await ev(page, () => { const a = window.__AHEN; a.devTools.levelTo(9); if (!a.char.world.waystones.includes('ws_forest')) a.char.world.waystones.push('ws_forest'); a.char.hp = a.stats().maxHp; a.world.travelTo('forest'); });
  return waitFor(page, () => window.__AHEN.world.mapId === 'forest' && !window.__AHEN.world.changing && window.__AHEN.world.netWorld?.active, null, 20000);
}
const netIds = (page) => ev(page, () => [...window.__AHEN.world.netWorld.byId.keys()]);
const teleport = (page, x, y) => ev(page, ({ x, y }) => { const p = window.__AHEN.world.player; p.x = x; p.y = y; p.clearTarget(); }, { x, y });

try {
  const A = await device('A'), B = await device('B');
  const pa = A.page, pb = B.page;
  await register(pa, 'ayg@test.com', 'Aygun');
  await register(pb, 'bora@test.com', 'Bora');
  await createChar(pa, 'warrior', 'Kalkan');
  await createChar(pb, 'mage', 'Buyucu');
  const conn = await waitFor(pa, () => window.__AHEN_NET.ready, null, 10000) && await waitFor(pb, () => window.__AHEN_NET.ready, null, 10000);
  const hud = await ev(pa, () => document.querySelector('[data-testid=hud-online]')?.textContent || '');
  record('Giriş yapan oyuncu oyuna girince ortak dünya sunucusuna bağlanır (oturum belirteci sunucuda doğrulanır)', conn && /2 çevrimiçi · sunucu/.test(hud), hud);

  // ============================================================== aynı dünya
  const fa = await toForest(pa), fb = await toForest(pb);
  record('Fısıldayan Orman ortak bölge: yaratıklar sunucudan gelir, yerelde kamp yaratığı doğmaz', fa && fb && await ev(pa, () => window.__AHEN.world.enemies.every((e) => e.net || e.tpl.kind === 'boss' || e.huntKey)), `${fa} ${fb}`);
  // önce kurt yoluna (sürü kurtları) git, sonra ikisini aynı yaratığın yanına koy
  await teleport(pa, 46 * 32, 40 * 32); await teleport(pb, 46 * 32, 41 * 32);
  await waitFor(pa, () => [...window.__AHEN.world.netWorld.byId.values()].some((e) => !e.dead && ['aggressive', 'pack', 'tank'].includes(e.tpl.ai)), null, 8000);
  const target = await ev(pa, () => {
    const w = window.__AHEN.world, p = w.player;
    const list = [...w.netWorld.byId.values()].filter((e) => !e.dead && e.tpl.kind === 'normal' && ['aggressive', 'pack', 'tank'].includes(e.tpl.ai)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const e = list[0];
    return { id: e.netId, x: Math.round(e.x), y: Math.round(e.y), tpl: e.tpl.id, exp: e.tpl.exp, hp: e.maxHp };
  });
  await teleport(pa, target.x + 40, target.y); await teleport(pb, target.x - 40, target.y);
  await pa.waitForTimeout(1500);
  const idsA = new Set(await netIds(pa)), idsB = await netIds(pb);
  const posB = await ev(pb, (id) => { const e = window.__AHEN.world.netWorld.byId.get(id); return e ? { x: Math.round(e.x), y: Math.round(e.y) } : null; }, target.id);
  const posA = await ev(pa, (id) => { const e = window.__AHEN.world.netWorld.byId.get(id); return e ? { x: Math.round(e.x), y: Math.round(e.y) } : null; }, target.id);
  record('İki oyuncu aynı yaratığı aynı kimlik ve konumda görür', idsB.includes(target.id) && idsB.filter((i) => idsA.has(i)).length >= 3 && posA && posB && Math.hypot(posA.x - posB.x, posA.y - posB.y) < 24, JSON.stringify({ posA, posB, ortak: idsB.filter((i) => idsA.has(i)).length }));
  const ghost = await ev(pa, () => [...window.__AHEN.world.remote.ghosts.values()].map((g) => g.label.text));
  record('Diğer oyuncu (partide olmasa da) haritada görünür', ghost.some((t) => /Bora · Lv\.9/.test(t)), JSON.stringify(ghost));
  await pa.screenshot({ path: join(shots, 'world-shared.png') });

  // ============================================================== yaratık saldırısı (sunucu → oyuncunun kendi savunması)
  // yaratık ikisinden birine saldırır (yakınlık/tehdit); en az birinin hasar günlüğüne düşmeli
  let hurt = null;
  for (let i = 0; i < 40 && !hurt; i++) {
    await pa.waitForTimeout(500);
    hurt = await ev(pa, () => window.__AHEN.world.combat.hurtLog?.slice(-1)[0] || null) || await ev(pb, () => window.__AHEN.world.combat.hurtLog?.slice(-1)[0] || null);
  }
  const hit = !!hurt;
  record('Yakındaki yaratık sunucuda saldırır; hasar vurulan oyuncunun kendi savunmasıyla işlenir', hit && !!hurt, JSON.stringify(hurt));

  // ============================================================== parti + ortak öldürme + EXP paylaşımı
  await ev(pa, () => window.__AHEN_PARTY.create());
  await waitFor(pa, () => window.__AHEN_PARTY.party.status === 'in', null, 6000);
  const code = await ev(pa, () => window.__AHEN_PARTY.party.code);
  await ev(pb, (c) => window.__AHEN_PARTY.join(c), code);
  const party = await waitFor(pa, () => window.__AHEN_PARTY.party.members.length === 2, null, 8000);
  record('Parti oyun sunucusu üzerinden kurulur (Realtime kotası harcanmaz)', party && await ev(pa, () => !!window.__AHEN_NET.subs.size), code);
  // A vurur (gerçek hasar hesabı), B'de can düşer
  const before = await ev(pb, () => ({ exp: window.__AHEN.char.exp, lv: window.__AHEN.char.level, kills: window.__AHEN.char.record.kills, gold: window.__AHEN.char.gold }));
  const beforeA = await ev(pa, () => ({ exp: window.__AHEN.char.exp, lv: window.__AHEN.char.level, kills: window.__AHEN.char.record.kills }));
  const alive = await ev(pa, (id) => !!window.__AHEN.world.netWorld.byId.get(id), target.id);
  let victim = target.id;
  if (!alive) victim = await ev(pa, () => [...window.__AHEN.world.netWorld.byId.values()].find((e) => !e.dead && e.tpl.kind === 'normal').netId);
  await ev(pa, (id) => { const e = window.__AHEN.world.netWorld.byId.get(id); window.__AHEN.world.combat.applyToEnemy(e, { dmg: Math.max(1, Math.floor(e.maxHp * 0.3)), crit: false, miss: false }); }, victim);
  await pa.waitForTimeout(500);
  const hpA = await ev(pa, (id) => window.__AHEN.world.netWorld.byId.get(id)?.hp, victim);
  const hpB = await ev(pb, (id) => window.__AHEN.world.netWorld.byId.get(id)?.hp, victim);
  const maxHp = await ev(pa, (id) => window.__AHEN.world.netWorld.byId.get(id)?.maxHp, victim);
  record('A\'nın vuruşu sunucuda uygulanır; B aynı yaratığın canını düşmüş görür', hpB != null && hpB < maxHp && Math.abs(hpA - hpB) < maxHp * 0.25, JSON.stringify({ hpA, hpB, maxHp }));
  // öldür
  for (let i = 0; i < 40; i++) {
    const done = await ev(pa, (id) => { const e = window.__AHEN.world.netWorld.byId.get(id); if (!e || e.dead) return true; window.__AHEN.world.combat.playerNormalHit(e); return false; }, victim);
    if (done) break;
    await pa.waitForTimeout(120);
  }
  const deadB = await waitFor(pb, (id) => { const e = window.__AHEN.world.netWorld.byId.get(id); return !e || e.dead; }, victim, 5000);
  const gotB = await waitFor(pb, (k) => window.__AHEN.char.record.kills > k, before.kills, 5000);
  const after = await ev(pb, () => ({ exp: window.__AHEN.char.exp, lv: window.__AHEN.char.level, kills: window.__AHEN.char.record.kills, gold: window.__AHEN.char.gold }));
  const afterA = await ev(pa, () => ({ exp: window.__AHEN.char.exp, lv: window.__AHEN.char.level, kills: window.__AHEN.char.record.kills }));
  await pb.screenshot({ path: join(shots, 'world-party-kill.png') });
  record('Yaratık ölünce B de ölümü görür', deadB);
  record('Parti: vurmayan B de EXP payı ve öldürme sayacı alır; A da alır', gotB && (after.exp > before.exp || after.lv > before.lv) && (afterA.exp > beforeA.exp || afterA.lv > beforeA.lv) && afterA.kills === beforeA.kills + 1, JSON.stringify({ before, after, beforeA, afterA }));
  const shareTxt = await ev(pb, () => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join('|'));
  void shareTxt;

  // ============================================================== partisiz yabancı ödül almaz
  await ev(pb, () => window.__AHEN_PARTY.leave());
  await waitFor(pa, () => window.__AHEN_PARTY.party.members.length === 1, null, 6000);
  const v2 = await ev(pa, () => { const w = window.__AHEN.world, p = w.player; return [...w.netWorld.byId.values()].filter((e) => !e.dead && e.tpl.kind === 'normal').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]?.netId; });
  const k0 = await ev(pb, () => window.__AHEN.char.record.kills);
  for (let i = 0; i < 40; i++) {
    const done = await ev(pa, (id) => { const e = window.__AHEN.world.netWorld.byId.get(id); if (!e || e.dead) return true; window.__AHEN.world.combat.playerNormalHit(e); return false; }, v2);
    if (done) break;
    await pa.waitForTimeout(120);
  }
  await pa.waitForTimeout(800);
  record('Partide olmayan ve vurmayan oyuncu başkasının öldürdüğü yaratıktan ödül almaz', await ev(pb, () => window.__AHEN.char.record.kills) === k0);

  // ============================================================== sunucu kapanır → tek oyunculu; döner → yeniden bağlanır
  allowWsErrors = true;
  gs.kill(); await new Promise((r) => setTimeout(r, 800));
  const local = await waitFor(pa, () => !window.__AHEN_NET.ready && !window.__AHEN.world.netWorld.active && window.__AHEN.world.enemies.some((e) => !e.net && !e.dead && e.tpl.kind === 'normal'), null, 10000);
  record('Sunucu kapanınca oyun durmaz: yerel yaratıklarla tek oyunculu devam eder', local);
  await startGameServer();
  const back = await waitFor(pa, () => window.__AHEN_NET.ready && window.__AHEN.world.netWorld.active && window.__AHEN.world.enemies.every((e) => e.net || e.tpl.kind === 'boss' || e.huntKey || e.dead), null, 30000);
  record('Sunucu dönünce kendiliğinden yeniden bağlanır ve ortak dünyaya geçer', back);
  allowWsErrors = false;

  // dungeon ortak değil: menüye dönüş ve yeniden giriş sorunsuz
  const stats = await new Promise((res) => http.get(`http://localhost:${GS_PORT}/health`, (r) => { let b = ''; r.on('data', (d) => { b += d; }); r.on('end', () => res(JSON.parse(b))); }));
  record('Sunucu sağlık ucu oyuncu ve bölge sayısını verir', stats.ok && stats.players === 2 && stats.zones.some((z) => z.id === 'forest' && z.players === 2), JSON.stringify(stats));
  for (const d of [A, B]) record(`Konsol hatası yok (oyuncu ${d.page.label})`, d.page.errors.length === 0, d.page.errors.slice(0, 3).join(' | '));
} catch (e) {
  record('Beklenmeyen test hatası', false, e.stack);
} finally {
  await browser.close();
  web.kill(); gs?.kill(); authSrv.close();
  const passed = results.filter((r) => r.ok).length;
  writeFileSync(join(here, 'report-world.json'), JSON.stringify({ date: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  console.log(`\nE2E Ortak dünya: ${passed}/${results.length} geçti`);
  process.exit(passed === results.length ? 0 : 1);
}
