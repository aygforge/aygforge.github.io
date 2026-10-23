// Çevrimiçi test katmanı uçtan uca: gerçek oyun arayüzü + sahte Supabase (Playwright ağ yönlendirmesi; dış ağa çıkılmaz).
// İki "cihaz" (ayrı tarayıcı bağlamı = ayrı depolama): sunucu ayarı, gizli anahtar reddi, kayıt/giriş, bulut kaydı,
// başka cihazda buluttan yükleme, "bulut ileride" koruması, otomatik bulut kaydı, liderlik, hata bildirimi, bağlantı kopması.
// Kullanım: npm run build && node tests/e2e/run-e2e-online.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFakeSupabase } from '../fake-supabase.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const PORT = 4177;
const BASE = `http://localhost:${PORT}/`;
const PROJECT = 'https://testproje.supabase.co';
const KEY = 'sb_publishable_testanahtar123';
const results = [];
const record = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };

const fake = createFakeSupabase();
let offline = false;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res) => { server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) res(); }); setTimeout(res, 6000); });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

async function device(name, w = 844, h = 390) {
  // servis işçisi kapalı: her istek bu testin yönlendirmesinden geçer. Oyunla gelen online.json (gerçek proje) yerine
  // boş ayar verilir — test hiçbir zaman gerçek sunucuya istek atmaz.
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, serviceWorkers: 'block' });
  await ctx.route('**/online.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"url":"","anonKey":""}' }));
  await ctx.route('**/*.supabase.co/**', (route) => (route.request().url().startsWith(PROJECT) ? route.fallback() : route.abort('blockedbyclient')));
  await ctx.route(`${PROJECT}/**`, async (route) => {
    const req = route.request();
    if (offline) return route.abort('internetdisconnected');
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    const r = fake.handle(req.method(), req.url(), await req.allHeaders(), req.postData());
    return route.fulfill({ status: r.status, body: r.body, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  // bağlantı kopması testinde tarayıcının kendi "kaynak yüklenemedi" satırları beklenen ağ hatasıdır
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED|net::ERR/.test(m.text())) page.errors.push(m.text()); });
  await page.goto(BASE + '?dev=1');
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  page.label = name;
  return { ctx, page };
}

const ev = (page, fn, arg) => page.evaluate(fn, arg);
const toasts = (page) => page.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent));
const closeModals = (page) => page.evaluate(() => { const u = window.__AHEN_UI; while (u?.layers?.modal?.firstChild) u.closeModal(); });
async function waitFor(page, fn, arg, ms = 10000) { return page.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false); }

async function setServer(page, url, key) {
  await page.tap('[data-testid=online-server]');
  await page.fill('[data-testid=online-url]', url);
  await page.fill('[data-testid=online-key]', key);
  await page.tap('[data-testid=online-server-ok]');
  await page.waitForTimeout(300);
}
async function auth(page, mode, email, pass, nick) {
  await page.tap(`[data-testid=online-${mode}]`);
  await page.fill('[data-testid=online-email]', email);
  await page.fill('[data-testid=online-pass]', pass);
  if (nick) await page.fill('[data-testid=online-nick]', nick);
  await page.tap('[data-testid=online-submit]');
  // pencere kapanana (başarı) ya da hata mesajı çıkana kadar bekle
  await waitFor(page, () => !document.querySelector('[data-testid=online-auth]') || !!document.querySelector('[data-testid=online-auth-msg]')?.textContent, null, 10000);
  await page.waitForTimeout(400);
}
async function createChar(page, cls, name) {
  await closeModals(page);
  await page.tap('[data-testid=menu-play]'); await page.waitForTimeout(250);
  for (let i = 0; i < 5; i++) { await page.tap(`[data-testid=slot-${i}]`); if (await page.$('[data-testid=create-char]')) break; }
  await page.tap('[data-testid=create-char]'); await page.tap(`[data-testid=class-${cls}]`);
  await page.fill('[data-testid=name-input]', name); await page.tap('[data-testid=create-confirm]');
  await page.waitForFunction(() => window.__AHEN?.world?.player, null, { timeout: 20000 }); await page.waitForTimeout(800);
}
const openSettings = async (page) => { await ev(page, () => window.__AHEN_OPEN('settings')); await page.waitForTimeout(500); };

try {
  // ============================================================== Cihaz A: sunucu ayarı, kayıt, bulut kaydı
  const A = await device('A');
  const pa = A.page;
  await pa.tap('[data-testid=menu-online]');
  await pa.waitForTimeout(300);
  const st0 = await pa.textContent('[data-testid=online-status]');
  await pa.screenshot({ path: join(shots, 'online-menu-unset.png') });
  record('Sunucu ayarı yokken Çevrimiçi penceresi açılır ve durumu söyler (oyun çevrimdışı çalışır)', /ayarlanmadı/.test(st0), st0);
  // gizli anahtar reddi
  const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  await pa.tap('[data-testid=online-server]');
  await pa.fill('[data-testid=online-url]', PROJECT);
  await pa.fill('[data-testid=online-key]', `${b64u({ alg: 'HS256' })}.${b64u({ role: 'service_role' })}.x`);
  await pa.tap('[data-testid=online-server-ok]');
  await pa.waitForTimeout(200);
  const secretMsg = await ev(pa, () => document.querySelector('.dlg .warn')?.textContent || '');
  record('Gizli (service_role) anahtar reddedilir', /GİZLİ/.test(secretMsg), secretMsg);
  await closeModals(pa);
  await pa.tap('[data-testid=menu-online]'); await pa.waitForTimeout(200);
  await setServer(pa, PROJECT, KEY);
  const st1 = await pa.textContent('[data-testid=online-status]');
  record('Sunucu ayarlanınca giriş/kayıt düğmeleri görünür', /Giriş yapılmadı/.test(st1) && !!await pa.$('[data-testid=online-register]'), st1);
  await auth(pa, 'register', 'ayg@test.com', 'sifre123', 'Aygun');
  const st2 = await pa.textContent('[data-testid=online-status]');
  const regDiag = await ev(pa, () => ({ msg: document.querySelector('[data-testid=online-auth-msg]')?.textContent || null, open: !!document.querySelector('[data-testid=online-auth]'), sw: !!navigator.serviceWorker?.controller }));
  record('Kayıt ol: hesap + takma ad oluşur, oturum açılır', /Aygun/.test(st2) && fake.db.users.length === 1 && fake.db.players[0]?.nickname === 'Aygun', st2 + ' ' + JSON.stringify({ ...regDiag, log: fake.log.slice(0, 6) }));
  await pa.screenshot({ path: join(shots, 'online-menu-loggedin.png') });
  await closeModals(pa);
  await createChar(pa, 'necromancer', 'Bulutcu');
  await ev(pa, async () => { const a = window.__AHEN; a.devTools.levelTo(8); a.char.gold = 4321; await a.flushSave('t'); });
  await openSettings(pa);
  await pa.tap('[data-testid=online-upload]');
  await pa.waitForTimeout(1500);
  const up = fake.db.cloud_saves.length === 1;
  const lb = fake.db.leaderboard.find((r) => r.char_name === 'Bulutcu');
  record('Buluta kaydet: kayıt kodu ve karakter özeti buluta yazılır; liderlik satırı oluşur', up && fake.db.cloud_saves[0].summary[0]?.level === 8 && fake.db.cloud_saves[0].code.startsWith('AHV1') && lb?.level === 8 && lb?.nickname === 'Aygun', JSON.stringify({ sum: fake.db.cloud_saves[0]?.summary, lb }));
  await pa.screenshot({ path: join(shots, 'online-settings.png') });
  await ev(pa, () => window.__AHEN_CLOSE());

  // ============================================================== Cihaz B: aynı hesapla giriş, buluttan yükleme
  const B = await device('B');
  const pb = B.page;
  await pb.tap('[data-testid=menu-online]'); await pb.waitForTimeout(200);
  await setServer(pb, PROJECT, KEY);
  await auth(pb, 'login', 'ayg@test.com', 'yanlis1', null);
  const wrong = await pb.textContent('[data-testid=online-auth-msg]').catch(() => '');
  record('Yanlış şifre anlaşılır mesaj verir', /yanlış/.test(wrong), wrong);
  await closeModals(pb);
  await pb.tap('[data-testid=menu-online]'); await pb.waitForTimeout(200);
  await auth(pb, 'login', 'ayg@test.com', 'sifre123', null);
  const offered = await waitFor(pb, () => !!document.querySelector('[data-testid=online-compare]'), null, 6000);
  const cmp = offered ? await pb.textContent('[data-testid=online-compare]') : '';
  record('Boş cihazda girişte buluttaki kayıt karşılaştırmayla önerilir', offered && /Bulutcu Lv\.8/.test(cmp) && /karakter yok/.test(cmp), cmp.slice(0, 160));
  await pb.screenshot({ path: join(shots, 'online-restore-compare.png') });
  if (offered) {
    await pb.tap('[data-testid=online-restore-next]'); await pb.waitForTimeout(200);
    await pb.tap('[data-testid=dlg-ok]'); await pb.waitForTimeout(1200);
  }
  const restored = await ev(pb, () => { const c = window.__AHEN.profile.characters.find(Boolean); return c ? { name: c.name, level: c.level, gold: c.gold, cls: c.cls } : null; });
  const rescue = await ev(pb, async () => (await window.__AHEN.repo.candidates()).some((x) => /rescue_.*_before_cloud/.test(x.key || x.id || '')));
  record('Buluttan yükle: karakter seviye, gold ve sınıfıyla bu cihaza gelir; önceki profilin kurtarma kopyası saklanır', restored?.name === 'Bulutcu' && restored.level === 8 && restored.gold === 4321 && restored.cls === 'necromancer', JSON.stringify({ restored, rescue }));
  // yüklenen kayıt kalıcı: yeniden aç
  await pb.reload(); await pb.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  const persisted = await ev(pb, () => window.__AHEN.profile.characters.find(Boolean)?.name || null);
  const stillIn = await ev(pb, () => !!localStorage.getItem('ahen_online_session'));
  record('Yüklenen kayıt kalıcıdır ve oturum sayfa yenilemede sürer', persisted === 'Bulutcu' && stillIn, JSON.stringify({ persisted, stillIn }));

  // ============================================================== Cihaz C: "bulut ileride" koruması
  const C = await device('C');
  const pc = C.page;
  await pc.tap('[data-testid=menu-online]'); await pc.waitForTimeout(200);
  await setServer(pc, PROJECT, KEY);
  await auth(pc, 'login', 'ayg@test.com', 'sifre123', null);
  await closeModals(pc);    // yükleme önerisini reddet
  await createChar(pc, 'warrior', 'Yenici');
  await ev(pc, () => window.__AHEN.flushSave('t'));
  await openSettings(pc);
  await pc.tap('[data-testid=online-upload]');
  const warned = await waitFor(pc, () => [...document.querySelectorAll('.dlg h3')].some((x) => /daha ileride/.test(x.textContent)), null, 6000);
  const warnText = warned ? await ev(pc, () => [...document.querySelectorAll('.dlg p')].map((p) => p.textContent).join(' ')) : '';
  await pc.screenshot({ path: join(shots, 'online-behind-warning.png') });
  if (warned) await pc.tap('[data-testid=dlg-cancel]');
  await pc.waitForTimeout(400);
  record('Bulutta bu cihazda olmayan karakter varken yükleme durur ve sorulur; vazgeçilince bulut değişmez',
    warned && /Bulutcu Lv\.8 \(bu cihazda yok\)/.test(warnText) && fake.db.cloud_saves[0].summary.length === 1 && fake.db.cloud_saves[0].summary[0].name === 'Bulutcu', warnText.slice(0, 160));
  // otomatik yükleme de aynı nedenle durur (sessiz + tek uyarı)
  await ev(pc, async () => { const a = window.__AHEN; a.char.gold += 1; await a.flushSave('t'); });
  await pc.waitForTimeout(1200);
  record('Otomatik bulut kaydı da buluttaki ilerlemeyi ezmez', fake.db.cloud_saves[0].summary[0].name === 'Bulutcu' && fake.db.cloud_saves[0].summary.length === 1, JSON.stringify(fake.db.cloud_saves[0].summary));
  await ev(pc, () => window.__AHEN_CLOSE());

  // ============================================================== Cihaz A: otomatik bulut kaydı (seviye atlayınca, 3 dk sınırı test için sıfırlanır)
  const lv0 = fake.db.cloud_saves[0].summary[0].level;
  await ev(pa, async () => {
    const a = window.__AHEN;
    a.devTools.levelTo(10);
    await a.flushSave('t');
  });
  await pa.waitForTimeout(800);
  const lvNoAuto = fake.db.cloud_saves[0].summary[0].level;
  record('Otomatik bulut kaydı 3 dakikadan sık yapılmaz (az önce elle kaydedildi)', lvNoAuto === lv0, `${lv0} → ${lvNoAuto}`);
  // 3 dakika geçmiş gibi: bir sonraki yerel kayıttan sonra bulut kendiliğinden güncellenir
  await ev(pa, async () => { window.__AHEN_ONLINE.lastUploadAt = 0; window.__AHEN.char.gold += 1; await window.__AHEN.flushSave('t'); });
  let autoOk = false;
  for (let i = 0; i < 40 && !autoOk; i++) { await pa.waitForTimeout(250); autoOk = fake.db.cloud_saves[0].summary[0].level === 10 && fake.db.leaderboard.find((r) => r.char_name === 'Bulutcu')?.level === 10; }
  const lbAuto = fake.db.leaderboard.find((r) => r.char_name === 'Bulutcu')?.level;
  record('Süre dolunca otomatik bulut kaydı yapılır (Lv.10 buluta ve liderliğe yansır)', autoOk && lbAuto === 10, JSON.stringify({ cloud: fake.db.cloud_saves[0].summary[0].level, lbAuto }));

  // ============================================================== liderlik, hata bildirimi, bağlantı kopması, çıkış
  await openSettings(pa);
  await pa.tap('[data-testid=online-board]');
  const boardOk = await waitFor(pa, () => document.querySelectorAll('[data-testid=board-row]').length > 0, null, 6000);
  const board = boardOk ? await pa.textContent('[data-testid=online-board-list]') : '';
  await pa.screenshot({ path: join(shots, 'online-leaderboard.png') });
  record('Liderlik tablosu açılır: karakter, sınıf, takma ad, seviye', /Bulutcu/.test(board) && /Ölü Çağıran/.test(board) && /Aygun/.test(board) && /Lv\.10/.test(board), board.slice(0, 160));
  await closeModals(pa);
  await openSettings(pa);
  await pa.tap('[data-testid=online-feedback]');
  await pa.fill('[data-testid=online-feedback-text]', 'Mabet kapısında takıldım, test bildirimi');
  await pa.tap('[data-testid=online-feedback-send]');
  await pa.waitForTimeout(800);
  const fb = fake.db.feedback[0];
  record('Hata/öneri bildirimi sürüm, harita, sınıf ve seviyeyle gönderilir', fb?.message?.includes('Mabet') && fb.context?.version && fb.context?.cls === 'necromancer' && fb.context?.level === 10 && fb.user_id, JSON.stringify(fb?.context));
  // bağlantı kopması: oyun çalışmaya devam eder, yerel kayıt sürer, anlaşılır uyarı
  offline = true;
  await openSettings(pa);
  await pa.tap('[data-testid=online-upload]');
  await pa.waitForTimeout(1500);
  const offToasts = (await toasts(pa)).join(' | ');
  const localOk = await ev(pa, async () => { const a = window.__AHEN; a.char.gold += 5; await a.flushSave('t'); return !a.save.error && a.save.persistent; });
  record('Bağlantı yokken bulut işlemi anlaşılır uyarı verir; yerel kayıt ve oyun etkilenmez', /ulaşılamadı/.test(offToasts) && localOk, offToasts.slice(0, 160));
  offline = false;
  await openSettings(pa);
  await pa.tap('[data-testid=online-logout]');
  await pa.waitForTimeout(500);
  const st3 = await pa.textContent('[data-testid=online-status]');
  record('Çıkış yap: oturum kapanır, yerel karakterler yerinde kalır', /Giriş yapılmadı/.test(st3) && await ev(pa, () => window.__AHEN.profile.characters.filter(Boolean).length === 1), st3);
  // mobil boyut: ana menü penceresi ekrana sığar
  const M = await device('M', 640, 360);
  await M.page.tap('[data-testid=menu-online]'); await M.page.waitForTimeout(300);
  const fit = await ev(M.page, () => { const b = document.querySelector('[data-testid=online-box]').getBoundingClientRect(); return { r: Math.round(b.right), w: innerWidth, overflowX: document.documentElement.scrollWidth > innerWidth }; });
  await M.page.screenshot({ path: join(shots, 'online-mobile.png') });
  record('Mobil (640×360): Çevrimiçi penceresi taşmaz', fit.r <= fit.w && !fit.overflowX, JSON.stringify(fit));
  for (const d of [A, B, C, M]) record(`Konsol hatası yok (cihaz ${d.page.label})`, d.page.errors.length === 0, d.page.errors.slice(0, 3).join(' | '));
} catch (e) {
  record('Beklenmeyen test hatası', false, e.stack);
} finally {
  await browser.close();
  server.kill();
  const passed = results.filter((r) => r.ok).length;
  writeFileSync(join(here, 'report-online.json'), JSON.stringify({ date: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  console.log(`\nE2E Çevrimiçi: ${passed}/${results.length} geçti`);
  process.exit(passed === results.length ? 0 : 1);
}
