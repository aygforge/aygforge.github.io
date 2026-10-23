// Oyuncunun bildirdiği hataların uçtan uca regresyon testleri (gerçek tarayıcı, tek oyunculu).
// 4.5.2: "Madenin Kalbi" görevi almadan önce Maden Golemi yenilince Derin Ocak'a dönüşte golem doğmuyor, görev takılıyordu
//        (bitmiş koşu devam ettiriliyordu). Kullanım: npm run build && node tests/e2e/run-e2e-bugs.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const PORT = 4181;
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
  // oyunla gelen online.json gerçek test sunucusunu gösterir: bu testler dışarı çıkmasın (boş yanıt)
  await ctx.route("**/*.supabase.co/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
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
const golem = (page) => ev(page, () => { const g = window.__AHEN.world.enemies.find((e) => e.tpl.id === 'mine_golem' && !e.dead); return g ? { hp: g.hp, max: g.maxHp } : null; });

try {
  const { ctx, page } = await newPage();
  await createChar(page, 'archer', 'Golemci');
  // oyuncunun durumu: Derin Ocak açık, golem önceden yenilmiş ve koşu "bitmiş" halde kalmış (eski kayıtlarda finished yok),
  // "Madenin Kalbi" (m17) sonradan alınmış
  await ev(page, () => {
    const a = window.__AHEN;
    a.devTools.levelTo(20);
    a.devTools.unlockDungeon('dungeon');
    a.char.dungeon = { runId: 'eski_kosu', cleared: [1, 2, 3, 4], bossLootClaimed: true, bossKilled: true, startedAt: Date.now() - 1e6 };
    a.char.quests.m17 = { s: 'active', p: [0] };
    if (!a.char.world.waystones.includes('ws_mine')) a.char.world.waystones.push('ws_mine');
    a.world.travelTo('mine');
  });
  await page.waitForFunction(() => window.__AHEN.world.mapId === 'mine' && !window.__AHEN.world.changing, null, { timeout: 20000 });
  await page.waitForTimeout(500);
  // Derin Ocak kapısıyla etkileşim (gerçek kapı nesnesi)
  await ev(page, () => { const w = window.__AHEN.world; const g = w.objects.find((o) => o.kind === 'gate' && o.dId === 'dungeon'); g.interact(w.player); });
  await page.waitForTimeout(300);
  const dlg = await dialogText(page);
  record('Bitmiş koşuyla kapıya gelince "devam et" değil "yeni koşu" sorulur', /Yeni bir koşu başlat/.test(dlg) && !/Kaldığın koşuya devam/.test(dlg), dlg.slice(0, 120));
  await page.tap('[data-testid=dlg-ok]');
  await page.waitForFunction(() => window.__AHEN.world.mapId === 'dungeon' && !window.__AHEN.world.changing, null, { timeout: 20000 });
  await page.waitForTimeout(800);
  const run = await ev(page, () => ({ id: window.__AHEN.char.dungeon.runId, cleared: window.__AHEN.char.dungeon.cleared, bossKilled: window.__AHEN.char.dungeon.bossKilled }));
  const g1 = await golem(page);
  await page.screenshot({ path: join(shots, 'bug-golem-new-run.png') });
  record('Yeni koşu başlar ve Maden Golemi doğar', run.id !== 'eski_kosu' && run.cleared.length === 0 && !run.bossKilled && !!g1, JSON.stringify({ run, g1 }));
  // golemi yen → görev hedefi işler
  await ev(page, () => {
    const a = window.__AHEN, w = a.world;
    a.char.dungeon.cleared = [1, 2, 3];   // önceki bölümler temizlenmiş say (test kısaltması)
    const g = w.enemies.find((e) => e.tpl.id === 'mine_golem' && !e.dead);
    w.combat.killEnemy(g);
  });
  await page.waitForTimeout(800);
  const q = await ev(page, () => window.__AHEN.char.quests.m17);
  record('"Madenin Kalbi" görevi golem yenilince tamamlanır (takılmaz)', q.p[0] === 1, JSON.stringify(q));
  const done = await ev(page, () => ({ complete: window.__AHEN.char.dungeon.cleared.includes(4), finished: !!window.__AHEN.char.dungeon.finished }));
  record('Boss bölümü temizlenince koşu "bitti" olarak işaretlenir', done.complete && done.finished, JSON.stringify(done));
  // dungeon çubuğunda "Yeni koşu": aynı dungeon'da baştan başlar, golem yeniden doğar
  const btn = await page.waitForSelector('[data-testid=dungeon-new-run]', { timeout: 6000 }).then(() => true).catch(() => false);
  await page.screenshot({ path: join(shots, 'bug-dungeon-complete.png') });
  if (btn) {
    await page.tap('[data-testid=dungeon-new-run]');
    await page.tap('[data-testid=dlg-ok]');
    await page.waitForFunction(() => window.__AHEN.world.mapId === 'dungeon' && !window.__AHEN.world.changing && window.__AHEN.char.dungeon && !window.__AHEN.char.dungeon.cleared.length, null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(800);
  }
  const g2 = await golem(page);
  const run2 = await ev(page, () => ({ cleared: window.__AHEN.char.dungeon?.cleared, claimed: window.__AHEN.char.dungeon?.bossLootClaimed }));
  record('Bitmiş koşuda "Yeni koşu" düğmesi dungeon\'ı baştan başlatır; golem yeniden doğar', btn && !!g2 && run2.cleared.length === 0 && !run2.claimed, JSON.stringify({ btn, g2, run2 }));
  record('Sayfa hatası yok', page.errors.length === 0, page.errors.slice(0, 3).join(' | '));
  await ctx.close();
} catch (e) {
  record('Beklenmeyen hata', false, e.stack || String(e));
} finally {
  await browser.close();
  server.kill();
}
const fail = results.filter((r) => !r.ok);
console.log(`\nE2E hata regresyonu: ${results.length - fail.length}/${results.length} geçti`);
process.exit(fail.length ? 1 : 0);
