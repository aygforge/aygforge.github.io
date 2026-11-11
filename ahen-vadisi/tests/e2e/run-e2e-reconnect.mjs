// 4.5.4: günlerce açılmayan oyunda çevrimiçi bağlantının kendiliğinden toparlanması (gerçek sunucu süreci + tarayıcı).
// - geçersiz/süresi dolmuş erişim belirteci → yenilenip yeniden bağlanılır (eskiden "bağlanıyor"da takılıyordu);
// - Supabase geçici kesintisi → oturum silinmez, dönünce bağlanılır;
// - gerçekten geçersiz oturum → giriş yapılmamış duruma düşülür.
// Kullanım: npm run build && node tests/e2e/run-e2e-reconnect.mjs
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
const PORT = 4187, GS_PORT = 8793, AUTH_PORT = 54403;
const BASE = `http://localhost:${PORT}/`;
const PROJECT = 'https://testproje.supabase.co';
const KEY = 'sb_publishable_testanahtar123';
const results = [];
const record = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };

const fake = createFakeSupabase();
// sahte Supabase'in yerel HTTP yüzü (oyun sunucusu belirteci buradan doğrular)
let supaDown = false;
const authSrv = http.createServer((req, res) => {
  if (supaDown) { res.writeHead(503, { 'content-type': 'application/json' }); res.end('{}'); return; }
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
const web = spawn(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res) => { web.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) res(); }); setTimeout(res, 6000); });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let allowWsErrors = false;
async function device(name) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, serviceWorkers: 'block' });
  await ctx.route('**/online.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: PROJECT, anonKey: KEY, gameServer: `ws://localhost:${GS_PORT}` }) }));
  await ctx.route('**/*.supabase.co/**', (route) => (route.request().url().startsWith(PROJECT) ? route.fallback() : route.abort('blockedbyclient')));
  await ctx.route(`${PROJECT}/**`, async (route) => {
    const req = route.request();
    if (supaDown && req.method() !== 'OPTIONS') return route.fulfill({ status: 503, body: '{}', headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    const r = fake.handle(req.method(), req.url(), await req.allHeaders(), req.postData());
    return route.fulfill({ status: r.status, body: r.body, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (allowWsErrors && /WebSocket|ERR_CONNECTION_REFUSED|status of (400|503)/.test(m.text())) return;
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

const net = (page) => ev(page, () => ({ ready: window.__AHEN_NET.ready, status: window.__AHEN_NET.status, err: window.__AHEN_NET.err, fatal: window.__AHEN_NET.fatal, loggedIn: !!window.__AHEN_ONLINE?.loggedIn ?? null }));
// bağlantıyı koparır ve kopmanın oyuna işlemesini bekler (yoksa "ready" bir an daha doğru görünür)
const dropConnection = async (page) => {
  await ev(page, () => window.__AHEN_NET.ws?.close());
  return waitFor(page, () => !window.__AHEN_NET.ready, null, 5000);
};

try {
  const A = await device('A');
  const pa = A.page;
  await register(pa, 'ayg@test.com', 'Aygun');
  await createChar(pa, 'warrior', 'Kalkan');
  record('Başlangıç: oyuna girince sunucuya bağlanır', await waitFor(pa, () => window.__AHEN_NET.ready, null, 10000));

  // 1) "Günler sonra": erişim belirteci sunucuda geçersiz ama istemci saatine göre süresi dolmamış görünüyor.
  //    4.5.3'te sunucu "Oturum doğrulanamadı" deyip bağlantıyı açık bırakıyor, oyun hiç yeniden denemiyordu.
  // (sunucu doğrulanmış belirteci 5 dk önbellekte tutar: önbellekte olmayan yeni bir belirteç alınır, sonra geçersizleşir)
  await ev(pa, async () => { const api = window.__AHEN_ONLINE.api; api.session.expires_at = 0; await api.ensureFresh(); });
  fake.expireAll();
  allowWsErrors = true;
  const dropped1 = await dropConnection(pa);
  const back1 = await waitFor(pa, () => window.__AHEN_NET.ready, null, 20000);
  record('Geçersiz belirteç: oyun belirteci yeniler ve kendiliğinden yeniden bağlanır', dropped1 && back1, JSON.stringify(await net(pa)));

  // 2) Supabase geçici olarak yanıt vermiyor (ör. uykudaki ücretsiz proje): oturum silinmez, oyun denemeyi sürdürür
  // (sunucu doğrulanmış belirteci 5 dk önbellekte tutar: önce yeni, önbellekte olmayan bir belirteç alınır)
  await ev(pa, async () => { const api = window.__AHEN_ONLINE.api; api.session.expires_at = 0; await api.ensureFresh(); });
  supaDown = true;
  await dropConnection(pa);
  await pa.waitForTimeout(6000);
  const mid = await net(pa);
  const logged = await ev(pa, () => !!JSON.parse(localStorage.getItem('ahen_online_session') || 'null')?.refresh_token);
  record('Supabase kesintisinde oturum korunur, hata kalıcı sayılmaz', logged && !mid.ready && !mid.fatal, JSON.stringify(mid));
  supaDown = false;
  const back2 = await waitFor(pa, () => window.__AHEN_NET.ready, null, 45000);
  record('Supabase dönünce oyun kendiliğinden bağlanır', back2, JSON.stringify(await net(pa)));

  // 3) Oturum gerçekten geçersiz (yenileme belirteci reddedildi): oyun takılmaz, giriş yapılmamış duruma düşer
  await ev(pa, () => { const api = window.__AHEN_ONLINE.api; api.session.refresh_token = 'gecersiz'; api.session.expires_at = 0; });
  await dropConnection(pa);
  const out = await waitFor(pa, () => !JSON.parse(localStorage.getItem('ahen_online_session') || 'null'), null, 20000);
  record('Reddedilen oturumda oyuncudan yeniden giriş istenir (sonsuz "bağlanıyor" yok)', out, JSON.stringify(await net(pa)));
  record('Sayfa hatası yok', pa.errors.length === 0, pa.errors.join(' | '));
  await A.ctx.close();
} catch (e) {
  record('Beklenmeyen hata', false, e.stack || String(e));
} finally {
  await browser.close();
  gs?.kill(); web.kill(); authSrv.close();
}
const fail = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fail}/${results.length} kontrol geçti`);
process.exit(fail ? 1 : 0);
