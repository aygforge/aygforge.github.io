// Parti (Faz 1) uçtan uca: gerçek oyun + gerçek @supabase/realtime-js istemcisi, sahte Supabase REST ve sahte Realtime
// (Phoenix vsn 2.0.0) sunucusu (Playwright ağ ve WebSocket yönlendirmesi; dış ağa çıkılmaz).
// İki oyuncu: davet → kabul, birbirini haritada görme ve hareket, mini harita, parti çerçevesi, sohbet ve konuşma balonu,
// bölge değiştirme bildirimi, "bölgesine git", keşfedilmemiş bölge kuralı, lideri takip, sayfa yenilemede partiye dönüş,
// ayrılma, mesaj bütçesi (boşta neredeyse sıfır), konsol hatası yok.
// Kullanım: npm run build && node tests/e2e/run-e2e-party.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFakeSupabase } from '../fake-supabase.mjs';
import { createPhoenixServer } from '../fake-realtime.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const PORT = 4178;
const BASE = `http://localhost:${PORT}/`;
const PROJECT = 'https://testproje.supabase.co';
const KEY = 'sb_publishable_testanahtar123';
const results = [];
const record = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };

const fake = createFakeSupabase();
const rt = createPhoenixServer();
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res) => { server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) res(); }); setTimeout(res, 6000); });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

async function device(name, w = 844, h = 390) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, serviceWorkers: 'block' });
  await ctx.route('**/online.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: PROJECT, anonKey: KEY }) }));
  await ctx.route('**/*.supabase.co/**', (route) => (route.request().url().startsWith(PROJECT) ? route.fallback() : route.abort('blockedbyclient')));
  await ctx.route(`${PROJECT}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    const r = fake.handle(req.method(), req.url(), await req.allHeaders(), req.postData());
    return route.fulfill({ status: r.status, body: r.body, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
  });
  const wsUrls = [];
  await ctx.routeWebSocket(/\/realtime\/v1\/websocket/, (ws) => { wsUrls.push(ws.url()); rt.accept(ws); });
  const page = await ctx.newPage();
  page.errors = []; page.wsUrls = wsUrls;
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(BASE + '?dev=1');
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  page.label = name;
  return { ctx, page };
}

const ev = (page, fn, arg) => page.evaluate(fn, arg);
const closeModals = (page) => page.evaluate(() => { const u = window.__AHEN_UI; while (u?.layers?.modal?.firstChild) u.closeModal(); });
async function waitFor(page, fn, arg, ms = 10000) { return page.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false); }
const toasts = (page) => page.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' | '));

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
  await closeModals(page);
  await page.tap('[data-testid=menu-play]'); await page.waitForTimeout(250);
  for (let i = 0; i < 5; i++) { await page.tap(`[data-testid=slot-${i}]`); if (await page.$('[data-testid=create-char]')) break; }
  await page.tap('[data-testid=create-char]'); await page.tap(`[data-testid=class-${cls}]`);
  await page.fill('[data-testid=name-input]', name); await page.tap('[data-testid=create-confirm]');
  await page.waitForFunction(() => window.__AHEN?.world?.player, null, { timeout: 20000 }); await page.waitForTimeout(800);
  await closeModals(page);
}
const ghosts = (page) => ev(page, () => [...(window.__AHEN.world?.remote?.ghosts.values() || [])].map((g) => ({ x: Math.round(g.x), y: Math.round(g.y), label: g.label.text, bubble: g.bubble?.text || null })));
const me = (page) => ev(page, () => { const p = window.__AHEN.world.player; return { x: Math.round(p.x), y: Math.round(p.y), map: window.__AHEN.world.mapId }; });
// oyuncuyu yürüyormuş gibi kaydır (gerçek hareket: konum + hareket bayrağı her karede)
async function walk(page, dx, dy, ms = 1500) {
  await ev(page, ({ dx, dy, ms }) => new Promise((res) => {
    const w = window.__AHEN.world, p = w.player, x0 = p.x, y0 = p.y, t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      const nx = x0 + dx * k, ny = y0 + dy * k;
      if (!w.grid.blockedAt(nx, ny)) { p.x = nx; p.y = ny; }
      p.moving = k < 1;
      if (k < 1) requestAnimationFrame(step); else res();
    };
    step();
  }), { dx, dy, ms });
}

try {
  // ============================================================== iki oyuncu, aynı köyde
  const A = await device('A'), B = await device('B');
  const pa = A.page, pb = B.page;
  await register(pa, 'ayg@test.com', 'Aygun');
  await register(pb, 'bora@test.com', 'Bora');
  const wsBefore = pa.wsUrls.length + pb.wsUrls.length;
  record('Oyuna girmeden anlık bağlantı açılmaz', wsBefore === 0, `ws=${wsBefore}`);
  await createChar(pa, 'warrior', 'Kalkan');
  await createChar(pb, 'mage', 'Buyucu');
  const lobbyOk = await waitFor(pa, () => window.__AHEN_PARTY.lobby?.ch?.ok, null, 8000) && await waitFor(pb, () => window.__AHEN_PARTY.lobby?.ch?.ok, null, 8000);
  record('Giriş yapmış oyuncu oyuna girince davet kanalına bağlanır (gerçek realtime-js istemcisi, vsn 2.0.0)', lobbyOk && /vsn=2\.0\.0/.test(pa.wsUrls[0] || '') && /apikey=sb_publishable/.test(pa.wsUrls[0] || ''), pa.wsUrls[0]);
  const partyBtn = await ev(pa, () => !document.querySelector('[data-testid=hud-party]').classList.contains('hidden'));
  record('HUD\'da Parti düğmesi görünür', partyBtn);

  // ============================================================== A partiyi kurar ve B'yi davet eder
  await ev(pa, () => window.__AHEN_ONLINE.presenceTick()); await ev(pb, () => window.__AHEN_ONLINE.presenceTick());
  await pa.tap('[data-testid=hud-party]');
  await pa.tap('[data-testid=party-create]');
  const created = await waitFor(pa, () => /^[A-Z2-9]{6}$/.test(document.querySelector('[data-testid=party-code-show]')?.textContent || '') && window.__AHEN_PARTY.party.status === 'in', null, 8000);
  const code = await ev(pa, () => window.__AHEN_PARTY.party.code);
  await pa.screenshot({ path: join(shots, 'party-created.png') });
  record('Parti kur: 6 karakterli kod, durum "bağlı"', created, code);
  await waitFor(pa, () => document.querySelectorAll('[data-testid=party-invite]').length > 0, null, 6000);
  await pa.tap('[data-testid=party-invite]');
  const invited = await waitFor(pb, () => !!document.querySelector('[data-testid=invite-dlg]'), null, 8000);
  const invText = invited ? await pb.textContent('[data-testid=invite-dlg]') : '';
  await pb.screenshot({ path: join(shots, 'party-invite.png') });
  record('Davet yalnız hedef oyuncuya ulaşır ve pencere açılır', invited && /Aygun/.test(invText), invText.slice(0, 80));
  await pb.tap('[data-testid=invite-accept]');
  const joined = await waitFor(pa, () => window.__AHEN_PARTY.party.members.length === 2, null, 8000) && await waitFor(pb, () => window.__AHEN_PARTY.party.members.length === 2, null, 8000);
  const leader = await ev(pb, () => window.__AHEN_PARTY.party.members.find((m) => m.leader)?.nick);
  record('Kabul edince ikisi aynı partide; lider partiyi kuran (Aygun)', joined && leader === 'Aygun' && await ev(pb, () => window.__AHEN_PARTY.party.code) === code, `lider=${leader}`);
  const replyToast = await waitFor(pa, () => /Bora partiye katılıyor|Bora partiye katıldı/.test([...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' ')), null, 4000);
  record('Davet eden "katılıyor/katıldı" bildirimi alır', replyToast, await toasts(pa));
  await closeModals(pa);

  // ============================================================== haritada birbirini görme
  const seen = await waitFor(pa, () => window.__AHEN.world.remote.ghosts.size === 1, null, 8000) && await waitFor(pb, () => window.__AHEN.world.remote.ghosts.size === 1, null, 8000);
  const ga = await ghosts(pa), mb = await me(pb);
  record('Aynı haritada arkadaş görünür: ad + seviye etiketi, doğru konumda', seen && /Bora · Lv\.1/.test(ga[0]?.label) && Math.hypot(ga[0].x - mb.x, ga[0].y - mb.y) < 6, JSON.stringify({ ga, mb }));
  const s0 = rt.stats.broadcasts;
  await walk(pb, 160, 0, 2000);
  await pa.waitForTimeout(900);
  const s1 = rt.stats.broadcasts;
  const ga2 = await ghosts(pa), mb2 = await me(pb);
  record('Arkadaş yürüyünce görüntüsü yumuşakça takip eder ve durduğu yere varır', Math.hypot(ga2[0].x - mb2.x, ga2[0].y - mb2.y) < 6 && mb2.x - mb.x > 100, JSON.stringify({ ga2, mb2 }));
  record('Mesaj bütçesi: 2 sn yürüyüş ≈ 5–8 konum mesajı (en sık 0,4 sn\'de bir)', s1 - s0 >= 3 && s1 - s0 <= 9, `${s1 - s0} yayın`);
  await pa.waitForTimeout(4000);
  const s2 = rt.stats.broadcasts;
  record('Boşta duran iki oyuncu 4 sn içinde neredeyse hiç mesaj göndermez', s2 - s1 <= 1, `${s2 - s1} yayın`);
  const mm = await ev(pa, () => window.__AHEN.world.remote.markers(32).length);
  const frame = await ev(pa, () => document.querySelector('[data-testid=hud-party-frame]')?.textContent || '');
  await pa.screenshot({ path: join(shots, 'party-together.png') });
  record('Mini haritada arkadaş işareti; sol üstte parti çerçevesi (ad, seviye, can)', mm === 1 && /Bora/.test(frame) && /Lv\.1/.test(frame), frame);

  // ============================================================== sohbet
  await pb.tap('[data-testid=hud-chat]');
  await pb.fill('[data-testid=party-chat-input]', 'Ormanda buluşalım!');
  await pb.tap('[data-testid=party-chat-send]');
  const chatOk = await waitFor(pa, () => /Bora: Ormanda buluşalım!/.test(document.querySelector('[data-testid=hud-chat-log]')?.textContent || ''), null, 5000);
  const bub = (await ghosts(pa))[0]?.bubble;
  await pa.screenshot({ path: join(shots, 'party-chat.png') });
  record('Parti sohbeti: mesaj arkadaşın ekranında altta ve konuşma balonu olarak görünür', chatOk && bub === 'Ormanda buluşalım!', String(bub));
  const ownLog = await ev(pb, () => document.querySelector('[data-testid=party-chat]')?.textContent || '');
  record('Gönderenin sohbet penceresinde kendi mesajı', /Ormanda buluşalım!/.test(ownLog), ownLog.slice(0, 80));
  await closeModals(pb);

  // ============================================================== bölge değiştirme ve "bölgesine git"
  await ev(pa, () => { const w = window.__AHEN.char.world.waystones; for (const id of ['ws_forest']) if (!w.includes(id)) w.push(id); });
  await ev(pb, () => { const w = window.__AHEN.char.world.waystones; for (const id of ['ws_forest', 'ws_mine']) if (!w.includes(id)) w.push(id); });
  await ev(pb, () => window.__AHEN.world.travelTo('forest'));
  await waitFor(pb, () => window.__AHEN.world.mapId === 'forest' && window.__AHEN.world.player && !window.__AHEN.world.changing, null, 15000);
  const mapToast = await waitFor(pa, () => /Bora → Fısıldayan Orman/.test([...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' ')), null, 6000);
  const goneGhost = await waitFor(pa, () => window.__AHEN.world.remote.ghosts.size === 0, null, 4000);
  const frame2 = await ev(pa, () => document.querySelector('[data-testid=hud-party-frame]')?.textContent || '');
  record('Arkadaş bölge değiştirince bildirim; görüntüsü bu haritadan kalkar; çerçevede bölge adı', mapToast && goneGhost && /Fısıldayan Orman/.test(frame2), frame2);
  await pa.tap('[data-testid=hud-party]');
  await waitFor(pa, () => document.querySelector('[data-testid=party-goto]')?.textContent === 'Bölgesine git', null, 4000);
  await pa.screenshot({ path: join(shots, 'party-dialog.png') });
  await pa.tap('[data-testid=party-goto]');
  const arrived = await waitFor(pa, () => window.__AHEN.world.mapId === 'forest' && !window.__AHEN.world.changing && window.__AHEN.world.remote?.ghosts.size === 1, null, 15000);
  const ma = await me(pa), mb3 = await me(pb);
  record('"Bölgesine git": aynı bölgeye, arkadaşın yanına geçer ve onu yine görür', arrived && ma.map === 'forest' && Math.hypot(ma.x - mb3.x, ma.y - mb3.y) < 80, JSON.stringify({ ma, mb3 }));
  // keşfedilmemiş bölge
  await ev(pb, () => window.__AHEN.world.travelTo('mine'));
  await waitFor(pb, () => window.__AHEN.world.mapId === 'mine' && !window.__AHEN.world.changing, null, 15000);
  await waitFor(pa, () => window.__AHEN_PARTY.party.others()[0]?.st?.m === 'mine', null, 6000);
  const gate = await ev(pa, () => window.__AHEN_PARTY.canGoTo(window.__AHEN_PARTY.party.others()[0]));
  record('Keşfedilmemiş bölgeye (Yol Taşı bulunmamış) arkadaşın yanına gidilemez; neden söylenir', !gate.ok && /keşfedilmedi/.test(gate.msg), gate.msg);

  // ============================================================== lideri takip
  await ev(pb, () => window.__AHEN.world.travelTo('forest'));
  await waitFor(pb, () => window.__AHEN.world.mapId === 'forest' && !window.__AHEN.world.changing, null, 15000);
  await ev(pb, () => window.__AHEN_PARTY.setFollow(true));
  await ev(pa, () => window.__AHEN.world.travelTo('village'));
  const followed = await waitFor(pb, () => window.__AHEN.world.mapId === 'village' && !window.__AHEN.world.changing, null, 15000);
  const fa = await me(pa), fb = await me(pb);
  record('"Lideri takip et" açıkken lider bölge değiştirince üye de peşinden gelir', followed && Math.hypot(fa.x - fb.x, fa.y - fb.y) < 80, JSON.stringify({ fa, fb }));
  await ev(pb, () => window.__AHEN_PARTY.setFollow(false));

  // ============================================================== sayfa yenilemede partiye dönüş
  await ev(pb, () => window.__AHEN.flushSave('t'));
  await pb.reload(); await pb.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  await pb.waitForTimeout(500); await closeModals(pb);
  const dropped = await waitFor(pa, () => window.__AHEN_PARTY.party.members.length === 1, null, 8000);
  await pb.tap('[data-testid=menu-play]'); await pb.waitForTimeout(250);
  await pb.tap('[data-testid=slot-0]'); await pb.tap('[data-testid=enter-world]');
  await pb.waitForFunction(() => window.__AHEN?.world?.player, null, { timeout: 20000 });
  const back = await waitFor(pb, () => window.__AHEN_PARTY.party?.code && window.__AHEN_PARTY.party.members.length === 2, null, 10000);
  const backSeen = await waitFor(pa, () => window.__AHEN.world.remote.ghosts.size === 1, null, 8000);
  record('Sayfa yenilenince üye listeden düşer; oyuna dönünce aynı partiye kendiliğinden katılır ve yine görünür', dropped && back && backSeen && await ev(pb, () => window.__AHEN_PARTY.party.code) === code, `dropped=${dropped} back=${back} seen=${backSeen}`);

  // ============================================================== ayrılma ve çıkış
  await closeModals(pb);
  await pb.tap('[data-testid=hud-party]');
  await pb.tap('[data-testid=party-leave]');
  const left = await waitFor(pa, () => window.__AHEN_PARTY.party.members.length === 1 && window.__AHEN.world.remote.ghosts.size === 0, null, 6000);
  const leftToast = /Bora partiden ayrıldı/.test(await toasts(pa));
  record('Partiden ayrılan arkadaş listeden ve haritadan kalkar; bildirim', left && leftToast, await toasts(pa));
  const noRejoin = await ev(pb, () => !localStorage.getItem('ahen_party'));
  record('Ayrılınca parti kodu unutulur (yenilemede geri katılmaz)', noRejoin);
  await closeModals(pb);
  // mobil: parti penceresi taşmaz
  await pa.setViewportSize({ width: 640, height: 360 });
  await closeModals(pa);
  await pa.tap('[data-testid=hud-party]'); await pa.waitForTimeout(300);
  const fit = await ev(pa, () => { const b = document.querySelector('[data-testid=party-dlg]').getBoundingClientRect(); return { r: Math.round(b.right), b: Math.round(b.bottom), w: innerWidth, h: innerHeight }; });
  await pa.screenshot({ path: join(shots, 'party-mobile.png') });
  record('Mobil (640×360): parti penceresi ekrana sığar', fit.r <= fit.w && fit.b <= fit.h, JSON.stringify(fit));
  record('Sahte Realtime: istemci ikili (binary) yayın biçimini kullandı (gerçek sunucuyla aynı yol)', rt.stats.binary > 0, JSON.stringify(rt.stats));
  for (const d of [A, B]) record(`Konsol hatası yok (oyuncu ${d.page.label})`, d.page.errors.length === 0, d.page.errors.slice(0, 3).join(' | '));
} catch (e) {
  record('Beklenmeyen test hatası', false, e.stack);
} finally {
  await browser.close();
  server.kill();
  const passed = results.filter((r) => r.ok).length;
  writeFileSync(join(here, 'report-party.json'), JSON.stringify({ date: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  console.log(`\nE2E Parti: ${passed}/${results.length} geçti`);
  process.exit(passed === results.length ? 0 : 1);
}
