// 4.5.3: iPhone'da tam ekran ve dar ekran düzeni.
// - Oyun sunucusu derlenmiş oyunu da sunar (ana ekrana eklenecek kalıcı adres): /health, /, MIME, önbellek, klasör dışı.
// - iPhone Safari yatay (itch.io çerçevesi boyutu) ekranda menü sekmeleri sığar, Ayarlar sekmesi görünür ve dokunulabilir.
// - iPhone'da "Tam ekrana geç" → Ana Ekrana Ekle anlatımı; itch.io gibi başka adreste oyunun kendi adresine bağlantı.
// Kullanım: npm run build && node tests/e2e/run-e2e-screen.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const SPORT = 4185, PPORT = 4186;
const HOME = `http://localhost:${SPORT}/`;
const PREVIEW = `http://localhost:${PPORT}/`;
const results = [];
const record = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

const gs = spawn('node', ['server/index.mjs'], { cwd: root, stdio: 'pipe', env: { ...process.env, PORT: String(SPORT), DEV_AUTH: '1', SUPABASE_URL: 'http://127.0.0.1:9', SUPABASE_KEY: 'x' } });
gs.stderr.on('data', (d) => process.stderr.write(d));
await new Promise((res) => { gs.stdout.on('data', (d) => { if (String(d).includes('web oyunu')) res(); }); setTimeout(res, 6000); });
const pv = spawn('npx', ['vite', 'preview', '--port', String(PPORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res) => { pv.stdout.on('data', (d) => { if (String(d).includes(String(PPORT))) res(); }); setTimeout(res, 6000); });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

async function dismissV4Notice(pg) {
  await pg.waitForTimeout(300);
  await pg.evaluate(() => { const n = document.querySelector('[data-testid=v4-notice]'); if (!n) return; if (window.__AHEN_UI) window.__AHEN_UI.closeModal(); else n.remove(); }).catch(() => {});
}
async function newPage(base, { w = 734, h = 330, ua = IPHONE_UA, gameServer = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: ua, serviceWorkers: 'block' });
  await ctx.route('**/*.supabase.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.route('**/ahen-vadisi-sunucu.onrender.com/**', (r) => r.abort());
  // oyunun kendi adresinde açılış: online.json'daki sunucu = sayfanın adresi (Render'daki gibi)
  if (gameServer) await ctx.route('**/online.json', async (r) => { const res = await r.fetch(); const j = await res.json(); r.fulfill({ response: res, json: { ...j, gameServer } }); });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  await page.goto(base + '?dev=1');
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  await dismissV4Notice(page);
  return { ctx, page };
}
async function createChar(page, cls, name) {
  await page.tap('[data-testid=menu-play]');
  await page.waitForTimeout(250);
  if (!await page.$('[data-testid=create-char]')) {
    for (let i = 0; i < 3; i++) { await page.tap(`[data-testid=slot-${i}]`); if (await page.$('[data-testid=create-char]')) break; }
  }
  await page.tap('[data-testid=create-char]');
  await page.tap(`[data-testid=class-${cls}]`);
  await page.fill('[data-testid=name-input]', name);
  await page.tap('[data-testid=create-confirm]');
  await page.waitForFunction(() => window.__AHEN?.world?.player, null, { timeout: 20000 });
  await page.waitForTimeout(600);
}
const ev = (page, fn, arg) => page.evaluate(fn, arg);
const tabFit = (page) => ev(page, () => {
  const bar = document.querySelector('.panel .tabs');
  const set = document.querySelector('[data-testid=tab-settings]');
  const r = set?.getBoundingClientRect(), b = bar?.getBoundingClientRect();
  return { fits: !!bar && bar.scrollWidth <= bar.clientWidth + 1, cls: bar?.className, settingsVisible: !!r && r.right <= b.right + 1 && r.left >= b.left - 1 && r.right <= innerWidth, labels: [...document.querySelectorAll('.panel .tab .lbl')].filter((l) => getComputedStyle(l).display !== 'none').map((l) => l.textContent) };
});

try {
  // ---------------------------------------------------------------- sunucu oyunu sunar
  const health = await fetch(HOME + 'health').then((r) => r.json());
  record('Sunucu /health: sürüm ve web oyunu açık', health.ok && health.version === '4.5.3' && health.web === true, JSON.stringify(health).slice(0, 120));
  const idx = await fetch(HOME);
  const idxText = await idx.text();
  record('Sunucu kök adreste oyunun sayfasını verir', idx.ok && /text\/html/.test(idx.headers.get('content-type')) && idxText.includes('Ahen Vadisi') && idx.headers.get('cache-control') === 'no-cache');
  const man = await fetch(HOME + 'manifest.webmanifest');
  const manJson = await man.json().catch(() => null);
  record('Manifest doğru türde ve tam ekran (fullscreen) ilan eder', /manifest\+json/.test(man.headers.get('content-type')) && manJson?.display === 'fullscreen');
  const asset = idxText.match(/assets\/index-[\w-]+\.js/)?.[0];
  const ar = await fetch(HOME + asset);
  record('Özetli dosyalar uzun süre önbelleğe alınır', ar.ok && /javascript/.test(ar.headers.get('content-type')) && /immutable/.test(ar.headers.get('cache-control') || ''), asset);
  const trav = await Promise.all(['..%2Fpackage.json', '%2e%2e/%2e%2e/package.json', 'assets/../../server/index.mjs', 'yok.js'].map((p) => fetch(HOME + p).then((r) => r.status)));
  record('Klasör dışı ve olmayan dosyalar 404', trav.every((s) => s === 404), trav.join(','));
  const sw = await fetch(HOME + 'sw.js').then((r) => r.text());
  record('Servis işçisi yavaş ağda 5 sn sonra önbellekteki sayfayla açar', sw.includes('setTimeout(ok, 5000)'));

  // ---------------------------------------------------------------- iPhone, oyunun kendi adresi
  {
    const { ctx, page } = await newPage(HOME, { gameServer: `ws://localhost:${SPORT}` });
    record('Oyun sunucu adresinden açılır (hata yok)', page.errors.length === 0, page.errors.join(' | '));
    await createChar(page, 'warrior', 'Tamekran');
    await page.tap('[data-testid=btn-more]');
    await page.waitForSelector('.panel .tabs');
    await page.waitForTimeout(300);
    const f = await tabFit(page);
    record('iPhone yatay (734×330): menü sekmelerinin hepsi sığar, Ayarlar görünür', f.fits && f.settingsVisible && /compact/.test(f.cls), JSON.stringify(f));
    record('Dar ekranda seçili sekmenin adı yazılı kalır', f.labels.length >= 1 && f.labels.length < 7, f.labels.join(','));
    await page.screenshot({ path: join(shots, 'iphone-tabs.png') });
    await page.tap('[data-testid=tab-settings]');
    await page.waitForSelector('[data-testid=set-fullscreen]');
    await page.locator('[data-testid=set-fullscreen]').scrollIntoViewIfNeeded();
    await page.tap('[data-testid=set-fullscreen]');
    await page.waitForSelector('[data-testid=fullscreen-help]', { timeout: 4000 }).catch(() => {});
    const help = await ev(page, () => document.querySelector('[data-testid=fullscreen-help]')?.textContent || '');
    record('iPhone\'da Tam ekrana geç → Ana Ekrana Ekle anlatımı açılır', /Ana Ekrana Ekle/.test(help) && /Apple/.test(help), help.slice(0, 90));
    record('Oyunun kendi adresindeyken "kendi adresinde aç" bağlantısı gösterilmez', !(await page.$('[data-testid=fs-open-home]')));
    const fits = await ev(page, () => { const d = document.querySelector('[data-testid=fullscreen-help]').getBoundingClientRect(); return d.top >= 0 && d.bottom <= innerHeight + 1; });
    record('Anlatım penceresi ekrana sığar (kaydırılabilir)', fits);
    await page.screenshot({ path: join(shots, 'iphone-fullscreen-help.png') });
    // daha da dar (eski küçük iPhone + Safari çubukları)
    await page.evaluate(() => window.__AHEN_UI?.closeModal());
    await page.setViewportSize({ width: 560, height: 300 });
    await page.waitForTimeout(400);
    const f2 = await tabFit(page);
    record('560×300\'de sekmeler yine sığar (gerekirse hepsi simge)', f2.fits && f2.settingsVisible, JSON.stringify(f2));
    await ctx.close();
  }

  // ---------------------------------------------------------------- iPhone, başka adres (itch.io gibi)
  {
    const { ctx, page } = await newPage(PREVIEW);
    await page.tap('text=Ayarlar ve Yedek');
    await page.waitForSelector('[data-testid=menu-fullscreen]');
    await page.tap('[data-testid=menu-fullscreen]');
    await page.waitForSelector('[data-testid=fullscreen-help]', { timeout: 4000 }).catch(() => {});
    const href = await ev(page, () => document.querySelector('[data-testid=fs-open-home]')?.getAttribute('href'));
    record('Başka adreste (itch.io) oyunun kalıcı adresine bağlantı verilir', href === 'https://ahen-vadisi-sunucu.onrender.com/', String(href));
    await page.screenshot({ path: join(shots, 'iphone-fullscreen-help-itch.png') });
    await ctx.close();
  }

  // ---------------------------------------------------------------- geniş ekran: değişiklik yok
  {
    const { ctx, page } = await newPage(PREVIEW, { w: 1280, h: 720, ua: undefined });
    await createChar(page, 'mage', 'Genisekran');
    await page.tap('[data-testid=btn-character]');
    await page.waitForSelector('.panel .tabs');
    await page.waitForTimeout(300);
    const f = await tabFit(page);
    record('1280×720: sekmeler tam adlarıyla görünür', f.fits && f.labels.length === 7 && !/compact/.test(f.cls), JSON.stringify(f));
    await ctx.close();
  }
} catch (e) {
  record('Beklenmeyen hata', false, e.stack || String(e));
} finally {
  await browser.close();
  gs.kill(); pv.kill();
}
const fail = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fail}/${results.length} kontrol geçti`);
process.exit(fail ? 1 : 0);
