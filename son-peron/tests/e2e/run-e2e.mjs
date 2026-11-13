// Gerçek tarayıcı (Chromium/Playwright) uçtan uca testi: `npm run build` sonrası `npm run test:e2e`.
// Menü tıklamaları, klavye ile hareket/etkileşim, panel-duraklatma, yerleştirme modu, kayıt/yükleme ve
// botun gerçek sahne üzerinde oynadığı Gün 1→3 akışı doğrulanır; ekran görüntüleri tests/e2e/shots altına yazılır.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { preview } from 'vite';
const { chromium } = createRequire(import.meta.url)('playwright');

const results = []; const errs = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? 'GEÇTİ ' : 'KALDI '} ${name}${info ? ' — ' + info : ''}`); };
fs.mkdirSync('tests/e2e/shots', { recursive: true });
const server = await preview({ preview: { port: 4173, strictPort: true }, logLevel: 'error' });
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, acceptDownloads: true }); const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error' && !/GL Driver|favicon/.test(m.text())) errs.push(m.text()); }); page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
const shot = (n) => page.screenshot({ path: `tests/e2e/shots/${n}.png` });
const st = (fn, arg) => page.evaluate(fn, arg);
const core = () => { const s = window.__app.sim.s; return JSON.stringify([s.day, s.gold, s.paidCustomers, s.reputation, s.furniture, s.depot, s.player.inv, s.player.name, s.player.look, s.batches, s.quests, s.tx, s.flags, s.deliveries, s.crate, s.nodes]); };
try {
  await page.goto('http://localhost:4173/'); await page.waitForSelector('#modal.on .title', { timeout: 20000 });
  check('Ana menü açılır (Türkçe başlık)', (await page.textContent('.subtitle')) === 'Miras Lokantası'); await shot('01-menu');
  check('Eksik asset yok', await st(() => window.__app.assetErrors.length === 0 && Object.keys(window.__app.atlas).length > 500));
  await page.click('[data-a=new]'); await page.fill('input[data-in=name]', 'Çağla Şığ'); await page.click('[data-a=look][data-v="hair:3"]'); await page.click('[data-a=look][data-v="outfit:2"]'); await shot('02-karakter');
  await page.click('[data-a=go]'); await page.waitForFunction(() => window.__app.sim && window.__app.world?.sceneId); await page.waitForTimeout(2000);
  check('Yeni oyun: isim (UTF-8) ve görünüm aktarılır', await st(() => { const p = window.__app.sim.s.player; return p.name === 'Çağla Şığ' && p.look.hair === 3 && p.look.outfit === 2; })); await shot('03-baslangic');
  // Klavye ile hareket
  const p0 = await st(() => ({ ...window.__app.sim.s.player })); await page.keyboard.down('d'); await page.waitForTimeout(700); await page.keyboard.up('d'); await page.keyboard.down('Shift'); await page.keyboard.down('s'); await page.waitForTimeout(700); await page.keyboard.up('s'); await page.keyboard.up('Shift');
  const p1 = await st(() => ({ ...window.__app.sim.s.player })); check('WASD/Shift ile hareket', p1.x > p0.x + 0.4 && p1.y > p0.y + 0.4, `(${p0.x.toFixed(1)},${p0.y.toFixed(1)})→(${p1.x.toFixed(1)},${p1.y.toFixed(1)})`);
  // Panel açıkken saat durur
  const m0 = await st(() => window.__app.sim.s.minute); await page.keyboard.press('Tab'); await page.waitForTimeout(700); const m1 = await st(() => window.__app.sim.s.minute); const open = await st(() => window.__app.ui.panel); await page.waitForTimeout(600); const m2 = await st(() => window.__app.sim.s.minute);
  check('Tab envanteri açar ve oyun saati durur', open === 'inventory' && m2 === m1 && m1 >= m0, `dakika ${m1.toFixed(2)} sabit`); await shot('04-envanter'); await page.keyboard.press('Escape');
  await page.waitForTimeout(500); const m3 = await st(() => window.__app.sim.s.minute); check('Panel kapanınca saat aynı yerden devam eder', m3 > m2 && m3 - m2 < 1.2);
  // E ile mektup (oyuncuyu mektup masasının yanına al)
  await st(() => { const p = window.__app.sim.s.player; p.x = 12.5; p.y = 9.5; p.dir = 'right'; }); await page.waitForTimeout(150); await page.keyboard.press('e'); await page.waitForTimeout(250);
  check('E ile miras mektubu okunur, görev ilerler', await st(() => window.__app.ui.panel === 'letter' && window.__app.sim.s.quests.done.includes('story_01'))); await shot('05-mektup'); await page.click('[data-a=_close]');
  // Bot gerçek sahne üzerinde 1. günü oynar (aynı oyuncu API'si)
  await st(() => { const a = window.__app; window.__bot = a.makeBot(); const b = window.__bot; b.use(b.furn('old_chest'), 'restaurant_interior'); b.gather('tree', 2); }); await page.waitForTimeout(500); await shot('06-orman');
  await st(() => { const b = window.__bot; b.gather('tree', 1); b.gather('rock', 2); b.use((t) => t.kind === 'door', 'restaurant_interior'); b.use(b.furn('workbench')); const sim = window.__app.sim; sim.build.craft(sim, 'simple_table'); sim.build.craft(sim, 'wooden_chair'); sim.build.craft(sim, 'wooden_chair'); });
  // Yerleştirme modu: B, alt bardan seç, R ile döndür, tıkla
  await page.waitForTimeout(300); await page.keyboard.press('b'); await page.waitForTimeout(200); await page.click('#placebar .slot'); await page.keyboard.press('r'); await page.keyboard.press('r'); await page.keyboard.press('r'); await page.keyboard.press('r');
  const cell = async (x, y) => st(([x, y]) => { const c = window.__app.world.cameras.main; return { x: (x * 32 + 16 - c.worldView.x) * c.zoom, y: (y * 32 + 16 - c.worldView.y) * c.zoom }; }, [x, y]).catch(() => null);
  const toScreen = (x, y) => page.evaluate(([x, y]) => { const c = window.__app.world.cameras.main; return { x: (x * 32 + 16 - c.worldView.x) * c.zoom, y: (y * 32 + 16 - c.worldView.y) * c.zoom }; }, [x, y]); void cell;
  await st(() => { const p = window.__app.sim.s.player; p.x = 22.5; p.y = 25.5; }); await page.waitForTimeout(1200);
  let pt = await toScreen(18, 22); await page.mouse.move(pt.x, pt.y); await page.waitForTimeout(200); await shot('07-yerlestirme'); await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(150);
  check('B modu: masa fareyle yerleştirilir', await st(() => window.__app.sim.s.furniture.some((f) => f.type === 'simple_table' && f.x === 18 && f.y === 22)));
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  await st(() => { const b = window.__bot; b.placeItem('wooden_chair', 17, 22, 3); b.placeItem('wooden_chair', 20, 22, 1); b.use(b.furn('starter_stove')); b.toScene('railway_outdoors'); b.go(68, 47); });
  await page.waitForTimeout(400); await page.keyboard.press('e'); await page.waitForTimeout(300); check('Posta kutusu E ile katalog açar', await st(() => window.__app.ui.panel === 'mail'));
  await page.click('[data-a=tut]'); await shot('08-posta'); await page.click('[data-a=order]'); await page.waitForTimeout(200);
  check('İlk sipariş 44 G: 100 → 56 G', await st(() => window.__app.sim.s.gold === 56));
  await st(() => { const b = window.__bot; b.toScene('restaurant_interior'); b.go(9, 7); }); await page.waitForTimeout(300); await page.keyboard.press('e'); await page.waitForTimeout(300); await shot('09-uyku'); await page.click('[data-a=sleep]');
  await page.waitForFunction(() => window.__app.ui.panel === 'report', null, { timeout: 8000 }); await shot('10-rapor');
  check('Yatak: gün biter, rapor açılır, 2. gün 06:00', await st(() => window.__app.sim.s.day === 2 && window.__app.sim.s.minute === 360 && window.__app.sim.s.quests.done.includes('story_03'))); await page.click('[data-a=_close]');
  // 2. gün
  await st(() => { const b = window.__bot; b.use((t) => t.kind === 'obj' && t.id === 'crate', 'railway_outdoors'); b.toScene('restaurant_interior'); const sim = window.__app.sim; const stv = sim.s.furniture.find((f) => f.type === 'starter_stove'); b.go(stv.x, stv.y + 1); });
  await page.waitForTimeout(300); await page.keyboard.press('e'); await page.waitForTimeout(300); check('Ocak E ile tarif paneli açar', await st(() => window.__app.ui.panel === 'cook')); await shot('11-tarifler');
  await page.click('[data-a=cook][data-v=vegetable_soup]'); await page.waitForTimeout(1200); await shot('12-pisiyor');
  check('Çorba pişiyor (malzeme bir kez düştü)', await st(() => { const sim = window.__app.sim; return !!sim.s.furniture.find((f) => f.cook) && sim.inv.count(sim, 'potato') === 2; }));
  await st(() => { window.__app.speed = 12; }); await page.waitForFunction(() => window.__app.sim.s.furniture.some((f) => f.cook?.phase === 'done'), null, { timeout: 20000 }); await st(() => { window.__app.speed = 1; });
  await st(() => { const b = window.__bot; b.potToBar(); b.stockDrinks(); b.use((t) => t.kind === 'door'); });
  check('Bar stoğu menüyü oluşturur; tabela AÇIK', await st(() => { const sim = window.__app.sim; const m = sim.kitchen.menu(sim); return sim.s.open && m.vegetable_soup.available === 4 && m.bottled_juice.available === 3; }));
  // Treni perondan izle
  await st(() => { const b = window.__bot; b.toScene('railway_outdoors'); b.go(30, 50); window.__app.speed = 10; }); await page.waitForFunction(() => window.__app.sim.s.minute >= 536, null, { timeout: 30000 }); await st(() => { window.__app.speed = 1; }); await page.waitForTimeout(300); await shot('13-tren-yaklasiyor');
  await st(() => { window.__app.speed = 6; }); await page.waitForFunction(() => window.__app.sim.s.minute >= 541.5, null, { timeout: 30000 }); await st(() => { window.__app.speed = 1; }); await page.waitForTimeout(300); await shot('14-tren-peronda');
  check('09:00 treni peronda; iki tutorial yolcusu fiziksel olarak indi', await st(() => { const s = window.__app.sim.s; return s.trains[0].phase === 'stopped' && s.groups.filter((g) => g.tutorial).length === 2 && s.customers.every((c) => c.scene === 'railway_outdoors'); }));
  await st(() => { const b = window.__bot; b.toScene('restaurant_interior'); b.go(20, 30); window.__app.speed = 8; }); await page.waitForFunction(() => window.__app.sim.s.groups.some((g) => g.state === 'ENTRY_QUEUE'), null, { timeout: 40000 }); await st(() => { window.__app.speed = 1; }); await page.waitForTimeout(400); await shot('15-kapida');
  // Karşılama panelini gerçek tuşla aç
  await st(() => { const sim = window.__app.sim; const g = sim.s.groups.find((x) => x.state === 'ENTRY_QUEUE'); const c = sim.service.members(sim, g)[0]; const p = sim.s.player; p.x = c.x; p.y = c.y + 1; p.dir = 'up'; }); await page.waitForTimeout(150); await page.keyboard.press('e'); await page.waitForTimeout(300);
  check('Kapıdaki müşteriye E: masa seçim paneli', await st(() => window.__app.ui.panel === 'seat')); await shot('16-masa-sec'); await page.keyboard.press('1'); await page.waitForTimeout(200);
  check('Masa seçilince grup masaya yürür', await st(() => window.__app.sim.s.groups.some((g) => g.state === 'WALK_TO_SEAT' || g.state === 'ORDER_READY')));
  // Kalan servis bot ile, gerçek zamanlı çizim sürerken
  for (let i = 0; i < 400; i++) { const done = await st(() => { const a = window.__app, b = window.__bot; if (a.sim.s.flags.tutorialDone) return true; if (!b.serviceStep()) b.tick(1); return false; }); if (i === 6) { await page.waitForTimeout(250); await shot('17-servis'); } if (done) break; }
  await page.waitForTimeout(300); await shot('18-tutorial-bitti');
  check('2. gün tutorial: 2 müşteri servis+ödeme+temizlik tamam', await st(() => { const s = window.__app.sim.s; return s.flags.tutorialDone && s.paidCustomers === 2 && s.quests.story.id === 'story_05'; }));
  // Kaydet → sayfayı yenile → Devam
  await page.keyboard.press('Escape'); await page.waitForTimeout(200); await shot('19-duraklat'); await page.click('[data-a=save]'); await page.waitForTimeout(400);
  const before = await st(core); const minBefore = await st(() => window.__app.sim.s.minute); await page.reload(); await page.waitForSelector('#modal.on .title'); await page.click('[data-a=cont]'); await page.waitForFunction(() => window.__app.sim && window.__app.world?.sceneId, null, { timeout: 15000 });
  const after = await st(core); const minAfter = await st(() => window.__app.sim.s.minute); check('Kaydet → kapat → Devam: aynı durumla devam (IndexedDB)', before === after && minAfter >= minBefore && minAfter - minBefore < 3, `${before.length} bayt, saat ${minBefore.toFixed(1)}→${minAfter.toFixed(1)}`);
  // Dışa aktar / içe aktar
  await page.keyboard.press('Escape'); await page.waitForTimeout(200); const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-a=exp]')]); const file = await dl.path(); const text = fs.readFileSync(file, 'utf8');
  check('JSON dışa aktarım dosyası üretilir', JSON.parse(text).magic === 'son-peron-save' && text.includes('Çağla Şığ'));
  check('Bozuk kayıt içe aktarımı güvenli hata verir', await st(() => window.__app.importText('{bozuk') === false && !!window.__app.sim));
  check('JSON içe aktarım çalışır', await st((t) => window.__app.importText(t) === true && window.__app.sim.s.player.name === 'Çağla Şığ', text));
  // Günün kalanı + 3. gün (bot, hızlandırılmış) ve diğer sahneler
  await page.waitForTimeout(300); await st(() => { window.__bot = window.__app.makeBot(); window.__bot.playDay(); }); await page.waitForTimeout(400);
  check('3. gün sabahı: serbest sandbox, günlük görevler', await st(() => { const s = window.__app.sim.s; return s.day === 3 && s.quests.daily.length === 2; })); await shot('20-gun3');
  await st(() => { const b = window.__bot; b.toScene('town_square'); b.go(20, 18); window.__app.sim.s.minute = 600; }); await page.waitForTimeout(700); await shot('21-kasaba');
  await st(() => { const a = window.__app, b = window.__bot; a.sim.s.stage = 2; b.toScene('riverbank'); b.go(24, 19); }); await page.waitForTimeout(700); await shot('22-dere');
  await st(() => { const a = window.__app, b = window.__bot; a.sim.s.stage = 1; b.toScene('railway_outdoors'); b.go(72, 41); a.sim.s.day = 90; a.sim.s.weather = 'snow'; a.sim.s.minute = 1270; }); await page.waitForTimeout(900); await shot('23-kis-gece');
  await page.keyboard.press('j'); await page.waitForTimeout(200); await shot('24-gorevler'); await page.keyboard.press('Escape');
  // Bütün paneller gerçek veriyle açılıp çizilir
  await st(() => { const a = window.__app, b = window.__bot; a.sim.s.day = 3; a.sim.s.weather = 'clear'; a.sim.s.minute = 700; b.toScene('restaurant_interior'); b.go(27, 24); });
  const bad = await st(() => { const a = window.__app, sim = a.sim, bad = []; const f = (t) => sim.s.furniture.find((x) => x.type === t).id;
    const list = [['inventory'], ['depot'], ['mail'], ['cook', { inst: f('starter_stove') }], ['craft'], ['bar', { inst: f('bar_counter') }], ['talk', { npc: 'Feriha' }], ['shop', { shop: 'Feriha' }], ['shop', { shop: 'Rıza' }], ['shop', { shop: 'Şirin' }], ['timetable'], ['guestbook'], ['quests'], ['map'], ['manage', { tab: 'projects' }], ['manage', { tab: 'staff' }], ['manage', { tab: 'stats' }], ['projects'], ['sleep'], ['letter'], ['cleaning'], ['wardrobe'], ['settings'], ['help'], ['pause'], ['fishing']];
    for (const [n, args] of list) { try { a.ui.open(n, args || {}); const html = document.querySelector('#modal .panel')?.innerHTML || ''; if (html.length < 80 || /undefined|NaN|\[object/.test(html.replace(/<[^>]*>/g, ' '))) bad.push(n + ':içerik'); if (document.querySelector('#modal [title^="eksik asset"]')) bad.push(n + ':eksik ikon'); a.ui.close(true); } catch (e) { bad.push(n + ':' + e.message); } } return bad; });
  check('26 panelin tamamı hatasız ve eksik ikonsuz çizilir', bad.length === 0, bad.join(', '));
  await st(() => window.__app.ui.open('craft')); await page.waitForTimeout(200); await shot('25-uretim'); await st(() => window.__app.ui.open('manage', { tab: 'projects' })); await page.waitForTimeout(200); await shot('26-restorasyon'); await st(() => window.__app.ui.close(true));
  // 12 gün hızlandırılmış gelişim (bot) — gerçek sahne çizimi sürerken; sonra personelli, genişlemiş lokanta
  for (let d = 0; d < 12; d++) { await st(() => window.__bot.playDay({ morning: (b) => b.progress() })); await page.waitForTimeout(120); }
  await st(() => { const a = window.__app, b = window.__bot; b.kitchenStep(); b.use((t) => t.kind === 'door'); a.sim.s.minute = 895; a.speed = 6; b.go(22, 26); }); await page.waitForFunction(() => window.__app.sim.s.groups.some((g) => g.state === 'ENTRY_QUEUE'), null, { timeout: 60000 });
  for (let i = 0; i < 25; i++) await st(() => { const b = window.__bot; if (!b.serviceStep()) b.tick(1); }); await st(() => { window.__app.speed = 1; }); await page.waitForTimeout(500); await shot('27-gun15-salon');
  check('15. gün: lokanta büyüdü (aşama ≥2), stok bütünlüğü korunuyor', await st(() => { const sim = window.__app.sim; return sim.s.stage >= 2 && sim.s.day === 15 && sim.kitchen.integrity(sim).length === 0 && sim.s.gold >= 0; }), await st(() => { const s = window.__app.sim.s; return `aşama ${s.stage}, ${s.paidCustomers} müşteri, ${s.gold} G, personel ${s.staff.roster.length}`; }));
  await st(() => { const a = window.__app; a.sim.s.minute = 1262; a.world.setPlacing(false); window.__bot.toScene('railway_outdoors'); window.__bot.go(40, 50); }); await page.waitForTimeout(900); await shot('28-gece-tren');
  check('Tarayıcı konsolunda hata yok', errs.length === 0, errs.slice(0, 5).join(' | '));
} catch (e) { check('E2E akışı istisnasız tamamlandı', false, e.message.split('\n')[0]); await shot('99-hata').catch(() => {}); if (errs.length) console.log('Konsol:', errs.slice(0, 6)); }
await browser.close(); await server.close();
const failed = results.filter((r) => !r.ok); fs.writeFileSync('tests/e2e/last-results.json', JSON.stringify(results, null, 1));
console.log(`\nE2E: ${results.length - failed.length}/${results.length} geçti`); process.exit(failed.length ? 1 : 0);
