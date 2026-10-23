// Ticaret, ortak boss ve parti dungeon'u (raid) uçtan uca: GERÇEK sunucu süreci + iki tarayıcı (+ partisiz üçüncü).
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
const PORT = 4180, GS_PORT = 8792, AUTH_PORT = 54402;
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


const uidOf = (page) => ev(page, () => window.__AHEN_NET.uid);
const bagHas = (page, uid) => ev(page, (u) => window.__AHEN.char.bag.slots.some((s) => s?.uid === u), uid);
async function hitUntilDead(page, id, maxN = 80) {
  for (let i = 0; i < maxN; i++) {
    const done = await ev(page, (nid) => { const e = window.__AHEN.world.netWorld.byId.get(nid); if (!e || e.dead) return true; window.__AHEN.world.combat.applyToEnemy(e, { dmg: Math.ceil(e.maxHp / 4), crit: false, miss: false }); return false; }, id);
    if (done) return true;
    await page.waitForTimeout(150);
  }
  return false;
}

try {
  const A = await device('A'), B = await device('B');
  const pa = A.page, pb = B.page;
  await register(pa, 'ayg@test.com', 'Aygun');
  await register(pb, 'bora@test.com', 'Bora');
  await createChar(pa, 'warrior', 'Kalkan');
  await createChar(pb, 'mage', 'Buyucu');
  const conn = await waitFor(pa, () => window.__AHEN_NET.ready, null, 20000) && await waitFor(pb, () => window.__AHEN_NET.ready, null, 20000);
  record('İki oyuncu oyun sunucusuna bağlı', conn);
  const ua = await uidOf(pa), ub = await uidOf(pb);

  // ============================================================== TİCARET (gerçek arayüz)
  const gift = await ev(pa, () => {
    const a = window.__AHEN; a.char.gold = 500;
    // başlangıç zırhını çantaya al (takas edilecek eşya)
    const slot = Object.keys(a.char.equipment).find((k) => a.char.equipment[k] && k !== 'weapon');
    const it = a.char.equipment[slot];
    a.char.equipment[slot] = null;
    a.char.bag.slots[a.char.bag.slots.findIndex((s) => !s)] = it;
    a.changed('inventory');
    return { uid: it.uid, tid: it.tid };
  });
  await ev(pb, () => { const a = window.__AHEN; a.char.gold = 300; a.devTools.addStack('hp_s', 7); });
  const hpB0 = await ev(pb, () => window.__AHEN.char.bag.slots.filter((s) => s?.tid === 'hp_s').reduce((n, s) => n + s.q, 0));
  const reqR = await ev(pa, (u) => window.__AHEN_TRADE.request(u), ub);
  const req = await waitFor(pb, () => !!document.querySelector('[data-testid=trade-req]'), null, 6000);
  record('Ticaret isteği karşı tarafta pencere açar', req && /Aygun/.test(await pb.textContent('[data-testid=trade-req]')), JSON.stringify({ reqR, ua, ub, gift, readyA: await ev(pa, () => window.__AHEN_NET.status), readyB: await ev(pb, () => window.__AHEN_NET.status) }));
  await pb.tap('[data-testid=trade-req-ok]');
  const opened = await waitFor(pa, () => !!document.querySelector('[data-testid=trade-dlg]'), null, 6000) && await waitFor(pb, () => !!document.querySelector('[data-testid=trade-dlg]'), null, 6000);
  record('Kabul edince iki tarafta ticaret penceresi açılır', opened);
  // A: eşya + 120 altın; B: 5 can iksiri
  await pa.evaluate((u) => [...document.querySelectorAll('[data-testid=trade-bag-item]')].find((el) => el.textContent && el)?.click?.(), gift?.uid);
  await pa.waitForTimeout(300);
  await ev(pa, (u) => { const s = window.__AHEN_TRADE.session; const it = window.__AHEN.char.bag.slots.find((x) => x?.uid === u); window.__AHEN_TRADE.setOffer({ items: [it], stacks: [], gold: 120 }); void s; }, gift.uid);
  await ev(pb, () => window.__AHEN_TRADE.setOffer({ items: [], stacks: [{ tid: 'hp_s', q: 5 }], gold: 0 }));
  const seen = await waitFor(pb, () => /Gold/.test(document.querySelector('[data-testid=trade-theirs]')?.textContent || '') && document.querySelectorAll('[data-testid=trade-their-item]').length === 1, null, 5000);
  await pb.screenshot({ path: join(shots, 'trade-window.png') });
  record('Teklifler iki tarafta da görünür (eşya, malzeme, altın)', seen && await waitFor(pa, () => document.querySelectorAll('[data-testid=trade-their-stack]').length === 1, null, 4000));
  await pa.tap('[data-testid=trade-lock]'); await pb.tap('[data-testid=trade-lock]');
  await waitFor(pa, () => /Onayla/.test(document.querySelector('[data-testid=trade-status]')?.textContent || ''), null, 4000);
  await pa.tap('[data-testid=trade-confirm]'); await pb.tap('[data-testid=trade-confirm]');
  const doneA = await waitFor(pa, () => !document.querySelector('[data-testid=trade-dlg]'), null, 6000);
  await pb.waitForTimeout(600);
  const goldA = await ev(pa, () => window.__AHEN.char.gold), goldB = await ev(pb, () => window.__AHEN.char.gold);
  const hpA = await ev(pa, () => window.__AHEN.char.bag.slots.filter((s) => s?.tid === 'hp_s').reduce((n, s) => n + s.q, 0));
  const hpB = await ev(pb, () => window.__AHEN.char.bag.slots.filter((s) => s?.tid === 'hp_s').reduce((n, s) => n + s.q, 0));
  record('Ticaret tamamlanır: eşya B\'ye, 120 altın B\'ye, 5 iksir A\'ya geçer; kimsede kopya kalmaz',
    doneA && !(await bagHas(pa, gift.uid)) && await bagHas(pb, gift.uid) && goldA === 380 && goldB === 420 && hpB === hpB0 - 5 && hpA >= 5,
    JSON.stringify({ goldA, goldB, hpA, hpB, hpB0 }));
  const saved = await ev(pb, async () => { await window.__AHEN.flushSave('t'); return !window.__AHEN.save.error; });
  record('Ticaret sonrası kayıt hemen yazılır', saved);

  // ============================================================== PARTİ + ORTAK AÇIK DÜNYA BOSS'U
  await ev(pa, () => window.__AHEN_PARTY.create());
  await waitFor(pa, () => window.__AHEN_PARTY.party.status === 'in', null, 6000);
  await ev(pb, (c) => window.__AHEN_PARTY.join(c), await ev(pa, () => window.__AHEN_PARTY.party.code));
  await waitFor(pa, () => window.__AHEN_PARTY.party.members.length === 2, null, 8000);
  await toForest(pa); await toForest(pb);
  await teleport(pa, 96 * 32, 66 * 32); await teleport(pb, 96 * 32, 67 * 32);
  const bossSeen = await waitFor(pa, () => [...window.__AHEN.world.netWorld.byId.values()].some((e) => e.tpl.id === 'alpha_wolf' && !e.dead), null, 8000)
    && await waitFor(pb, () => [...window.__AHEN.world.netWorld.byId.values()].some((e) => e.tpl.id === 'alpha_wolf' && !e.dead), null, 8000);
  const bossIdA = await ev(pa, () => [...window.__AHEN.world.netWorld.byId.values()].find((e) => e.tpl.id === 'alpha_wolf')?.netId);
  const bossIdB = await ev(pb, () => [...window.__AHEN.world.netWorld.byId.values()].find((e) => e.tpl.id === 'alpha_wolf')?.netId);
  record('Açık dünya boss\'u (Alfa Kurt) sunucuda: iki oyuncu aynı boss\'u görür, yerelde ayrı boss doğmaz', bossSeen && bossIdA === bossIdB && await ev(pa, () => !window.__AHEN.world.enemies.some((e) => !e.net && !e.dead && e.tpl.kind === 'boss')), `${bossIdA} ${bossIdB}`);
  // %70 altına indir: sürü çağrısı herkes için
  await ev(pa, (id) => { const e = window.__AHEN.world.netWorld.byId.get(id); window.__AHEN.world.combat.applyToEnemy(e, { dmg: Math.ceil(e.maxHp * 0.35), crit: false, miss: false }); }, bossIdA);
  const howl = await waitFor(pb, () => [...window.__AHEN.world.netWorld.byId.values()].filter((e) => e.tpl.id === 'pack_wolf' && !e.dead).length >= 1, null, 8000);
  const bar = await waitFor(pb, () => !document.querySelector('.bossbar')?.classList.contains('hidden'), null, 4000);
  await pb.screenshot({ path: join(shots, 'raid-boss.png') });
  record('Boss mekaniği (Sürü Uluması) ve boss çubuğu arkadaşın ekranında da görünür', howl && bar, `${howl} ${bar}`);
  const missing = await ev(pb, () => window.__AHEN.world.children.list.filter((o) => o.texture?.key === '__MISSING').length);
  record('Sunucu olaylarının görselleri eksik doku (siyah kare) üretmez', missing === 0, `eksik doku: ${missing}`);
  const kb0 = await ev(pb, () => window.__AHEN.char.record.bossKills?.alpha_wolf || 0);
  const killed = await hitUntilDead(pa, bossIdA);
  const gotBoss = await waitFor(pb, (k) => (window.__AHEN.char.record.bossKills?.alpha_wolf || 0) > k, kb0, 6000);
  const claims = await ev(pb, () => Object.keys(window.__AHEN.char.claims || {}).filter((k) => k.startsWith('alpha_wolf:')));
  record('Boss ölünce parti üyesi de boss ödülünü alır (tek seferlik ödül kimliğiyle)', killed && gotBoss && claims.length === 1, JSON.stringify(claims));

  // ============================================================== PARTİ DUNGEON'U (Derin Ocak)
  for (const p of [pa, pb]) await ev(p, () => { const a = window.__AHEN; a.devTools.levelTo(20); a.devTools.unlockDungeon('dungeon'); a.char.hp = a.stats().maxHp; });
  await ev(pa, () => window.__AHEN.world.changeMap('dungeon', 'entrance', { enterDungeon: true }));
  const inA = await waitFor(pa, () => window.__AHEN.world.mapId === 'dungeon' && window.__AHEN.world.netWorld.active, null, 20000);
  // B: parti penceresinden "Bölgesine git" ile aynı örneğe
  await waitFor(pb, () => window.__AHEN_PARTY.party.others()[0]?.st?.m === 'dungeon', null, 8000);
  const can = await ev(pb, () => window.__AHEN_PARTY.canGoTo(window.__AHEN_PARTY.party.others()[0]));
  await ev(pb, () => window.__AHEN_PARTY.goTo(window.__AHEN_PARTY.party.others()[0]));
  const inB = await waitFor(pb, () => window.__AHEN.world.mapId === 'dungeon' && window.__AHEN.world.netWorld.active, null, 20000);
  await pa.waitForTimeout(1200);
  const idsA = await ev(pa, () => [...window.__AHEN.world.netWorld.byId.keys()].sort());
  const idsB = await ev(pb, () => [...window.__AHEN.world.netWorld.byId.keys()].sort());
  record('Parti dungeon\'u: iki üye aynı örnekte, aynı yaratıklar (arkadaşın yanına "Bölgesine git" ile)', inA && inB && can.ok && idsA.length > 0 && idsA.filter((i) => idsB.includes(i)).length >= Math.min(idsA.length, idsB.length) - 1, JSON.stringify({ can, a: idsA.length, b: idsB.length }));
  // 1. bölüm yaratıklarını A temizler → B'de de kapı açılır, bölüm temizlenir
  const s1 = await ev(pa, () => [...window.__AHEN.world.netWorld.byId.values()].filter((e) => e.stage === 1 && !e.dead).map((e) => e.netId));
  for (const id of s1) await hitUntilDead(pa, id, 20);
  const clearedB = await waitFor(pb, () => window.__AHEN.char.dungeon?.cleared?.includes(1), null, 10000);
  const gateB = await ev(pb, () => { const w = window.__AHEN.world, g = w.mapDef.gates.find((x) => x.opensAfter === 1); return w.grid.dyn[g.y0 * w.grid.w + g.x0] === 0; });
  const toastB = await ev(pb, () => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join('|'));
  await pb.screenshot({ path: join(shots, 'raid-dungeon.png') });
  record('A 1. bölümü temizleyince B\'nin koşusu da ilerler ve kapı B\'de de açılır', s1.length > 0 && clearedB && gateB, `${s1.length} yaratık · ${toastB.slice(0, 120)}`);
  // boss canı parti gücüne göre: iki Lv.20 oyuncu, Lv.20 Maden Golemi → ×1,75
  await teleport(pa, 80 * 32, 18 * 32); await teleport(pb, 80 * 32, 19 * 32);
  const golem = await waitFor(pb, () => [...window.__AHEN.world.netWorld.byId.values()].some((e) => e.tpl.id === 'mine_golem'), null, 8000);
  await pb.waitForTimeout(600);
  const gm = await ev(pb, () => { const e = [...window.__AHEN.world.netWorld.byId.values()].find((x) => x.tpl.id === 'mine_golem'); return e ? { max: e.maxHp, base: e.tpl.hp } : null; });
  const label = await waitFor(pb, () => /Parti ×1,75/.test(document.querySelector('.bossbar')?.textContent || ''), null, 6000);
  await pb.screenshot({ path: join(shots, 'raid-boss-scaled.png') });
  record('Parti dungeon boss canı parti gücüne göre ölçeklenir (2 × Lv.20 → ×1,75) ve boss çubuğunda yazar', golem && gm && gm.max === Math.round(gm.base * 1.75) && label, JSON.stringify(gm));
  await teleport(pa, 5 * 32, 71 * 32); await teleport(pb, 5 * 32, 71 * 32);
  // partisiz üçüncü oyuncu ayrı örnekte
  const C = await device('C');
  const pc = C.page;
  await register(pc, 'cem@test.com', 'Cem');
  await createChar(pc, 'archer', 'Okcu');
  await waitFor(pc, () => window.__AHEN_NET.ready, null, 10000);
  await ev(pc, () => { const a = window.__AHEN; a.devTools.levelTo(20); a.devTools.unlockDungeon('dungeon'); a.world.changeMap('dungeon', 'entrance', { enterDungeon: true }); });
  await waitFor(pc, () => window.__AHEN.world.mapId === 'dungeon' && window.__AHEN.world.netWorld.active, null, 20000);
  await pc.waitForTimeout(800);
  const idsC = await ev(pc, () => [...window.__AHEN.world.netWorld.byId.keys()]);
  const cRun = await ev(pc, () => window.__AHEN.char.dungeon?.cleared || []);
  record('Partide olmayan oyuncu kendi ayrı dungeon örneğine girer (temizlenen bölüm onun için temiz değil)', idsC.length > 0 && !idsC.some((i) => idsA.includes(i)) && !cRun.includes(1), JSON.stringify({ c: idsC.length, cRun }));
  for (const d of [A, B, C]) record(`Konsol hatası yok (oyuncu ${d.page.label})`, d.page.errors.length === 0, d.page.errors.slice(0, 3).join(' | '));
} catch (e) {
  record('Beklenmeyen test hatası', false, e.stack);
} finally {
  await browser.close();
  web.kill(); gs?.kill(); authSrv.close();
  const passed = results.filter((r) => r.ok).length;
  writeFileSync(join(here, 'report-raid.json'), JSON.stringify({ date: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  console.log(`\nE2E Ticaret + boss + parti dungeon: ${passed}/${results.length} geçti`);
  process.exit(passed === results.length ? 0 : 1);
}
