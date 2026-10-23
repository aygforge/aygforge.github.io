// Kayıt sağlamlığı uçtan uca testleri (3.0.1): gerçek tarayıcıda IndexedDB + localStorage ile
// onarım, IndexedDB kaybında aynadan dönüş, kayıp karakter kurtarma, daha yeni sürüm kaydının korunması, yedek kodu.
// Kullanım: npm run build && node tests/e2e/run-e2e-save.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const PORT = 4176;
const BASE = `http://localhost:${PORT}/`;
const results = [];
const record = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };

// V4: mevcut karakterli profilde ana menü bir kez yedek hatırlatması gösterir; eski senaryolar için kapatılır
async function dismissV4Notice(pg) {
  await pg.waitForTimeout(300);
  await pg.evaluate(() => { const n = document.querySelector('[data-testid=v4-notice]'); if (!n) return; if (window.__AHEN_UI) window.__AHEN_UI.closeModal(); else n.remove(); }).catch(() => {});
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res) => { server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) res(); }); setTimeout(res, 6000); });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  await page.goto(BASE + '?dev=1');
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  await dismissV4Notice(page);
  return { ctx, page };
}
const reload = async (page) => { await page.reload(); await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 }); await page.waitForTimeout(400); await dismissV4Notice(page); };

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
const dialogText = (page) => ev(page, () => [...document.querySelectorAll('.overlay .dlg')].map((d) => d.textContent).join(' | '));
// sayfa içinde zarf üretimi (serialize.wrap ile aynı biçim)
const WRAP = `(prof, sv) => { const data = JSON.stringify(prof); let h = 0x811c9dc5; for (let i = 0; i < data.length; i++) { h ^= data.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return { app: 'ahen-vadisi', schemaVersion: sv, savedAt: Date.now(), commit: (prof.commit || 0) + 1, checksum: (h >>> 0).toString(16).padStart(8, '0'), data }; }`;

try {
  const { ctx, page } = await newPage();
  await createChar(page, 'warrior', 'Kalici');
  await ev(page, async () => { const a = window.__AHEN; a.devTools.levelTo(22); a.char.gold = 31337; await a.flushSave('test'); });
  // ikinci karakter
  await reload(page);
  await createChar(page, 'mage', 'Ikinci');
  await ev(page, async () => { const a = window.__AHEN; a.devTools.levelTo(12); await a.flushSave('test'); });
  const base = await ev(page, () => window.__AHEN.profile.characters.filter(Boolean).map((c) => `${c.name}:${c.level}:${c.gold}`));
  record('Hazırlık: iki karakter kaydedildi', base.length === 2, base.join(', '));
  const mirror = await ev(page, () => !!localStorage.getItem('ahen-vadisi:mirror'));
  record('Her kayıt localStorage aynasına da yazılır', mirror);

  // ---------------------------------------------------------------- 1) doğrulamayı geçemeyen ana kayıt → onarılır
  await reload(page);
  await ev(page, async (WRAP) => {
    const wrap = eval(WRAP);
    const a = window.__AHEN;
    const prof = JSON.parse(JSON.stringify(a.profile));
    prof.characters[0].bag.slots[1] = { uid: 'bozuk', tid: 'ESKI_SILINMIS_ESYA', r: 'R', p: 0, d: 100, b: [] };
    const env = wrap(prof, 3);
    await a.repo.writeRaw('profile', env);
    localStorage.setItem('ahen-vadisi:mirror', JSON.stringify(env));
  }, WRAP);
  await reload(page);
  const rep = await ev(page, () => ({ li: { repaired: window.__AHEN.loadInfo.repaired, source: window.__AHEN.loadInfo.source }, chars: window.__AHEN.profile.characters.filter(Boolean).map((c) => `${c.name}:${c.level}:${c.gold}`) }));
  const repDlg = await dialogText(page);
  record('Bozuk eşyalı kayıt: profil sıfırlanmaz, onarılarak açılır; karakterler aynen durur', rep.li.repaired && rep.chars.join() === base.join(), JSON.stringify(rep));
  record('Oyuncuya "Kayıt onarıldı" bildirimi gösterilir', /Kayıt onarıldı/.test(repDlg), repDlg.slice(0, 120));
  await page.screenshot({ path: join(shots, 'save-repaired.png') });
  const rescue = await ev(page, async () => (await window.__AHEN.repo.keys()).filter((k) => k.startsWith('rescue_')));
  record('Onarılmadan önceki ham kopya kurtarma anahtarında saklanır', rescue.some((k) => k.includes('repair')), rescue.join(', '));
  await ev(page, () => window.__AHEN.flushSave('test'));

  // ---------------------------------------------------------------- 2) IndexedDB tamamen silinirse aynadan döner
  await ev(page, () => new Promise((res) => { window.__AHEN.repo.db.close(); const r = indexedDB.deleteDatabase('ahen-vadisi'); r.onsuccess = r.onerror = r.onblocked = () => res(); }));
  await reload(page);
  const fromMirror = await ev(page, () => ({ src: window.__AHEN.loadInfo.source, chars: window.__AHEN.profile.characters.filter(Boolean).map((c) => `${c.name}:${c.level}:${c.gold}`) }));
  record('IndexedDB silindi → karakterler localStorage aynasından geri gelir', fromMirror.src === 'mirror' && fromMirror.chars.join() === base.join(), JSON.stringify(fromMirror));
  await ev(page, () => window.__AHEN.flushSave('test'));

  // ---------------------------------------------------------------- 3) karakteri eksik yeni kayıt → kurtarma penceresi
  await reload(page);
  await ev(page, async (WRAP) => {
    const wrap = eval(WRAP);
    const a = window.__AHEN;
    await a.repo.save(a.profile, { forceSnapshot: true });   // eski (tam) kayıt snap/hist'e geçsin
    const prof = JSON.parse(JSON.stringify(a.profile));
    prof.characters[1] = null;                                // ikinci karakter "kayboldu" (silme değil)
    const env = wrap(prof, 3); env.savedAt += 1000;
    await a.repo.writeRaw('profile', env);
    localStorage.setItem('ahen-vadisi:mirror', JSON.stringify(env));
  }, WRAP);
  await reload(page);
  const recDlg = await dialogText(page);
  record('Eksik karakter fark edilir: "Kayıp karakter bulundu" penceresi açılır', /Kayıp karakter bulundu/.test(recDlg) && /Ikinci/.test(recDlg), recDlg.slice(0, 160));
  await page.screenshot({ path: join(shots, 'save-recovery.png') });
  await page.locator('.overlay .dlg button', { hasText: 'Geri yükle' }).first().tap();
  await page.waitForTimeout(500);
  const afterRec = await ev(page, async () => {
    const a = window.__AHEN;
    const env = await a.repo.readRaw('profile');
    return { chars: a.profile.characters.filter(Boolean).map((c) => `${c.name}:${c.level}:${c.gold}`), saved: JSON.parse(env.data).characters.filter(Boolean).length };
  });
  record('"Geri yükle" karakteri profile geri koyar ve kaydeder', afterRec.chars.length === 2 && afterRec.chars.includes(base[1]) && afterRec.saved === 2, JSON.stringify(afterRec));
  await page.tap('[data-testid=recovery-close]');

  // ---------------------------------------------------------------- 4) bilinçli silme kurtarma penceresi açtırmaz
  await reload(page);
  await page.tap('[data-testid=menu-play]');
  await page.waitForTimeout(250);
  await page.tap('[data-testid=slot-1]');
  const delBtn = page.locator('button', { hasText: 'Sil' }).first();
  let deletedOk = false;
  if (await delBtn.count()) {
    await delBtn.tap();
    await page.waitForTimeout(200);
    const inp = await page.$('.overlay input');
    if (inp) await inp.fill('Ikinci');
    await page.locator('.overlay button', { hasText: 'Sil' }).tap();
    await page.waitForTimeout(500);
    deletedOk = await ev(page, () => window.__AHEN.profile.characters.filter(Boolean).length === 1 && window.__AHEN.profile.deletedChars.length === 1);
  }
  await reload(page);
  const afterDel = await dialogText(page);
  record('Bilinçli silinen karakter "kayıp" sayılmaz (kurtarma penceresi açılmaz)', deletedOk && !/Kayıp karakter bulundu/.test(afterDel), `silindi=${deletedOk} ${afterDel.slice(0, 80)}`);
  const lost = await ev(page, async () => { const all = await window.__AHEN.repo.candidates(); return window.__AHEN.repo._recoverable(all, window.__AHEN.profile).length; });
  record('Silinen karakter kurtarma listesine de girmez', lost === 0, `kurtarılabilir=${lost}`);

  // ---------------------------------------------------------------- 5) yedek kodu: kopyala → her şeyi sil → yapıştır
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const before = await ev(page, () => window.__AHEN.profile.characters.filter(Boolean).map((c) => `${c.name}:${c.level}:${c.gold}`));
  await page.locator('button', { hasText: 'Ayarlar ve Yedek' }).tap();
  await page.tap('[data-testid=copy-code]');   // V4: Kayıt Güvenliği bölümü (ana menü ayarlarında)
  await page.waitForSelector('[data-testid=code-output]');
  const code = await page.$eval('[data-testid=code-output]', (t) => t.value);
  record('Yedek kodu üretilir', /^AHV1g?:/.test(code), `${code.length} karakter`);
  await page.screenshot({ path: join(shots, 'save-code.png') });
  await ev(page, () => new Promise((res) => { localStorage.clear(); window.__AHEN.repo.db.close(); const r = indexedDB.deleteDatabase('ahen-vadisi'); r.onsuccess = r.onerror = r.onblocked = () => res(); }));
  await reload(page);
  const wiped = await ev(page, () => window.__AHEN.profile.characters.filter(Boolean).length);
  await page.locator('button', { hasText: 'Ayarlar ve Yedek' }).tap();
  await page.tap('[data-testid=paste-code]');
  await page.fill('[data-testid=code-input]', code);
  await page.tap('[data-testid=code-ok]');
  await page.waitForTimeout(300);
  await page.tap('[data-testid=dlg-ok]');
  await page.waitForTimeout(800);
  const restored = await ev(page, async () => { const r = await window.__AHEN.repo.readRaw('profile'); return JSON.parse(r.data).characters.filter(Boolean).map((c) => `${c.name}:${c.level}:${c.gold}`); });
  record('Tarayıcı verisi tamamen silinse de yedek kodu ile her şey geri gelir', wiped === 0 && restored.join() === before.join(), `silindikten sonra ${wiped} karakter; geri: ${restored.join(', ')}`);

  // ---------------------------------------------------------------- 6) daha yeni sürüm kaydı eski sürümde ezilmez
  await reload(page);
  await ev(page, async (WRAP) => {
    const wrap = eval(WRAP);
    const a = window.__AHEN;
    const env = wrap(JSON.parse(JSON.stringify(a.profile)), 99);
    await a.repo.writeRaw('profile', env);
    localStorage.setItem('ahen-vadisi:mirror', JSON.stringify(env));
  }, WRAP);
  await reload(page);
  const newerDlg = await dialogText(page);
  await ev(page, () => window.__AHEN.flushSave('test'));
  const kept = await ev(page, async () => ({ ro: window.__AHEN.repo.readOnly, sv: (await window.__AHEN.repo.readRaw('profile')).schemaVersion, mir: JSON.parse(localStorage.getItem('ahen-vadisi:mirror')).schemaVersion }));
  record('Eski önbellekli sürüm, yeni sürüm kaydını açınca uyarır ve kaydın üzerine yazmaz', /yeni sürümü var/.test(newerDlg) && kept.ro && kept.sv === 99 && kept.mir === 99, JSON.stringify(kept));
  await page.screenshot({ path: join(shots, 'save-newer.png') });

  record('Sayfa hatası yok', page.errors.length === 0, page.errors.slice(0, 3).join(' | '));
  await ctx.close();
} catch (e) {
  record('Beklenmeyen hata', false, e.stack || String(e));
} finally {
  await browser.close();
  server.kill();
}
const fail = results.filter((r) => !r.ok);
console.log(`\n${results.length - fail.length}/${results.length} kayıt kontrolü geçti`);
process.exit(fail.length ? 1 : 0);
