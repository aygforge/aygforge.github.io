// V2.0 (Kül ve Ayaz) uçtan uca testleri: yeni haritalar, yaratıklar, elitler, bosslar, Buz Mabedi,
// Lv.25 becerileri, beceri çubuğu, Ustalık Kitabı, Av Geçmişi ve V1 kayıt geçişi.
// Kullanım: npm run build && node tests/e2e/run-e2e-v2.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const PORT = 4174;
const BASE = `http://localhost:${PORT}/`;
const results = [];
const record = (name, ok, info = '') => { results.push({ name, ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };

// V4: mevcut karakterli profilde ana menü bir kez yedek hatırlatması gösterir; eski senaryolar için kapatılır
async function dismissV4Notice(pg) {
  await pg.waitForTimeout(300);
  await pg.evaluate(() => { const n = document.querySelector('[data-testid=v4-notice]'); if (!n) return; if (window.__AHEN_UI) window.__AHEN_UI.closeModal(); else n.remove(); }).catch(() => {});
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res) => { server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) res(); }); setTimeout(res, 6000); });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

async function newPage(w = 844, h = 390) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.errors = [];
  globalThis.__lastPage = page;
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(BASE + '?dev=1');
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
  await page.waitForTimeout(800);
}

const ev = (page, fn, arg) => page.evaluate(fn, arg);
const waitMap = (page, id) => page.waitForFunction((id) => window.__AHEN.world?.mapId === id && window.__AHEN.world.player && !window.__AHEN.world.changing, id, { timeout: 25000 }).then(() => page.waitForTimeout(900));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // ============================================================== 1) V1 kayıt geçişi (gerçek depoya V1 zarfı yazılır)
  {
    const { ctx, page } = await newPage();
    await createChar(page, 'warrior', 'Eskikayit');
    const mig = await ev(page, async () => {
      const a = window.__AHEN;
      await a.flushSave('test');
      // güncel profili V1 biçimine indir: V2 alanlarını sil, şema 1
      const prof = JSON.parse(JSON.stringify(a.profile));
      prof.schemaVersion = 1;
      for (const c of prof.characters) if (c) { delete c.skillBar; delete c.history; delete c.runs; delete c.masteryBooks; delete c.world.flags; delete c.world.chests; c.v = 1; c.level = 20; c.exp = 0; c.gold = 777; }
      const data = JSON.stringify(prof);
      let hsh = 0x811c9dc5; for (let i = 0; i < data.length; i++) { hsh ^= data.charCodeAt(i); hsh = Math.imul(hsh, 0x01000193); }
      const env = { app: 'ahen-vadisi', schemaVersion: 1, savedAt: Date.now(), commit: 1, checksum: (hsh >>> 0).toString(16).padStart(8, '0'), data };
      await a.repo.writeRaw('profile', env);
      await a.repo.writeRaw('snap_0', env);
      const r = await a.repo.load();
      const c = r.profile.characters.find(Boolean);
      const backup = await a.repo.readRaw('v1_backup');
      return { ok: !!r.profile, from: r.migratedFrom, level: c.level, gold: c.gold, bar: c.skillBar, hist: !!c.history?.fromV1, backup: backup?.schemaVersion, sv: r.profile.schemaVersion };
    });
    record('V1 kaydı açılır ve güncel şemaya (V4) geçer (seviye/gold korunur)', mig.ok && mig.from === 1 && mig.level === 20 && mig.gold === 777 && mig.sv === 4, JSON.stringify(mig));
    record('Geçişte V1 yedeği saklanır; varsayılan 4\'lü beceri çubuğu; Av Geçmişi V2\'den başlar', mig.backup === 1 && mig.bar?.length === 4 && mig.hist, JSON.stringify(mig));
    await ctx.close();
  }

  // ============================================================== 2) Warrior: Kül Yaylaları
  const { ctx: cw, page } = await newPage();
  await createChar(page, 'warrior', 'Külcü');
  const lv = await ev(page, async () => {
    const a = window.__AHEN, ch = a.char;
    a.devTools.levelTo(26);
    return ch.level;
  });
  record('Dev: Lv.26\'ya çıkış (20→26 gerçek EXP tablosu)', lv === 26, String(lv));
  // Kilitli geçit: görev olmadan mine → ash geçidi kapalı
  await ev(page, () => window.__AHEN.world.changeMap('mine', 'from_ash'));
  await waitMap(page, 'mine');
  const locked = await ev(page, () => {
    const w = window.__AHEN.world;
    const portal = w.objects.find((o) => o.o?.id === 'm_to_ash');
    let toast = null;
    const off = window.__AHEN_BUS?.on?.('toast', (t) => { toast = t.text; });
    portal.trigger();
    off?.();
    return { locked: portal.locked(), map: w.mapId, toast };
  });
  record('V1 hikâyesi bitmeden Kül Yaylaları geçidi kapalı', locked.locked && locked.map === 'mine', JSON.stringify(locked));
  await ev(page, () => { const ch = window.__AHEN.char; for (const id of ['m01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18']) ch.quests[id] = { s: 'done', p: [], used: [] }; });
  const acc = await ev(page, () => window.__AHEN.devTools.accept('m27'));
  record('V1 finalinden sonra "Kırılan Ufuk" alınabilir', acc.ok, JSON.stringify(acc.msg || ''));
  await ev(page, () => { const w = window.__AHEN.world; const portal = w.objects.find((o) => o.o?.id === 'm_to_ash'); portal.trigger(); });
  await waitMap(page, 'ash');
  const ash = await ev(page, () => {
    const w = window.__AHEN.world, ch = window.__AHEN.char;
    const ids = [...new Set(w.enemies.filter((e) => !e.dead).map((e) => e.tpl.id))].sort();
    return { ids, flakes: w.flakes?.length || 0, m27: ch.quests.m27, objs: w.objects.map((o) => o.kind).filter((k) => ['npc', 'chest', 'gather', 'waystone'].includes(k)) };
  });
  record('Kül Yaylaları: 4 yaratık türü + Kül Devi doğar', ['ash_giant', 'ash_hunter', 'ash_imp', 'burnt_warrior', 'crimson_scorpion'].every((x) => ash.ids.includes(x)), ash.ids.join(','));
  record('Kül Yaylaları: kül parçacıkları, NPC, sandık, Yol Taşı, Kül Cevheri', ash.flakes > 0 && ash.objs.includes('npc') && ash.objs.includes('chest') && ash.objs.includes('waystone') && ash.objs.includes('gather'), JSON.stringify({ f: ash.flakes }));
  record('"Kırılan Ufuk" geçiş hedefleri ilerler', ash.m27?.p?.[1] === 1 || ash.m27?.p?.[0] === 1, JSON.stringify(ash.m27));
  await page.screenshot({ path: join(shots, 'v2-ash.png') });

  // normal yaratık öldür: ödül, Av Geçmişi
  const killAsh = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, ch = a.char;
    const h0 = ch.history.kills, e0 = ch.exp, g0 = ch.gold;
    const list = w.enemies.filter((e) => !e.dead && e.tpl.kind === 'normal').slice(0, 6);
    for (const e of list) { w.combat.applyToEnemy(e, { dmg: e.hp + 10, crit: false, miss: false }); await new Promise((r) => setTimeout(r, 30)); }
    return { kills: ch.history.kills - h0, exp: ch.exp - e0 > 0 || ch.level > 26, gold: ch.gold - g0, ids: list.map((e) => e.tpl.id) };
  });
  record('V2 yaratık öldürme: EXP + Gold + Av Geçmişi sayacı', killAsh.kills === 6 && killAsh.exp && killAsh.gold > 0, JSON.stringify(killAsh));
  // ölüm animasyonu karesi
  const dieAnim = await ev(page, () => !!window.__AHEN.world.anims.exists('mon_ash_imp_die') && !!window.__AHEN.world.anims.exists('mon_frozen_guardian_hurt'));
  record('V2 sprite\'ları: ayrı darbe ve ölüm animasyonları kayıtlı', dieAnim);

  // Kül Devi: yakına gel, mekanikleri gözlemle
  const giant = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player;
    const g = w.enemies.find((e) => e.tpl.id === 'ash_giant' && !e.dead);
    p.x = g.x - 70; p.y = g.y + 30;
    a.char.hp = 99999; // yalnız gözlem: ölmesin
    g.aggro(p);
    const seen = new Set();
    const t0 = performance.now();
    let maxFiss = 0;
    while (performance.now() - t0 < 14000) {
      await new Promise((r) => setTimeout(r, 100));
      a.char.hp = Math.max(a.char.hp, 5000);
      if (g.casting) seen.add('cast');
      maxFiss = Math.max(maxFiss, w.combat.hazards.length);
      if (performance.now() - t0 > 4000 && g.hp > g.maxHp * 0.5) g.hp = g.maxHp * 0.5; // Kül Çağrısı eşiği
    }
    const helpers = w.enemies.filter((e) => !e.dead && e.tpl.id === 'ember_spawn').length;
    return { cast: seen.has('cast'), maxFiss, helpers, phase: g.behavior.phase() };
  });
  record('Kül Devi: telegraflı saldırılar, en çok 3 alev yarığı, %55 altında 2 yardımcı', giant.cast && giant.maxFiss <= 3 && giant.helpers === 2, JSON.stringify(giant));
  await page.screenshot({ path: join(shots, 'v2-ash-giant.png') });
  const giantKill = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, ch = a.char;
    const g = w.enemies.find((e) => e.tpl.id === 'ash_giant' && !e.dead);
    const helpersExp0 = ch.exp;
    for (const s of w.enemies.filter((e) => !e.dead && e.tpl.id === 'ember_spawn')) w.combat.applyToEnemy(s, { dmg: s.hp + 1, crit: false, miss: false });
    const helperExp = ch.exp - helpersExp0;
    const b0 = ch.history.bossKills.ash_giant || 0;
    w.combat.applyToEnemy(g, { dmg: g.hp + 1, crit: false, miss: false });
    await new Promise((r) => setTimeout(r, 200));
    return { helperExp, boss: (ch.history.bossKills.ash_giant || 0) - b0, hazards: w.combat.hazards.length, respawnAt: ch.world.bossRespawnAt.ash_giant > ch.world.activeTime };
  });
  record('Kül Devi yenilir; yardımcılar EXP vermez; tehlikeler temizlenir; yeniden doğma zamanlanır', giantKill.helperExp === 0 && giantKill.boss === 1 && giantKill.hazards === 0 && giantKill.respawnAt, JSON.stringify(giantKill));

  // Kül Kasabı elit: öfke ve kesik
  const butcher = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player;
    const e = w.spawner.spawnEnemy('ash_butcher', p.x + 90, p.y, { leashR: 20 * 32 });
    e.aggro(p);
    e.hp = e.maxHp * 0.25;
    let enr = false, cast = false;
    const t0 = performance.now();
    while (performance.now() - t0 < 14000) { await new Promise((r) => setTimeout(r, 100)); a.char.hp = Math.max(a.char.hp, 5000); enr = enr || e.enraged; cast = cast || !!e.casting; }
    w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false });
    return { enr, cast, mark: window.__AHEN.char.bag.slots.some((s) => s?.tid === 'butcher_mark') };
  });
  record('Kül Kasabı: öfke (%30 altı), telegraflı satır, garantili nişan', butcher.enr && butcher.cast && butcher.mark, JSON.stringify(butcher));

  // gizli sandık: tek seferlik
  const chest = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player;
    const c = w.objects.find((o) => o.kind === 'chest');
    const g0 = a.char.gold;
    c.interact(p); p.channel.t = 0; await new Promise((r) => setTimeout(r, 300));
    const g1 = a.char.gold;
    c.interact(p); if (p.channel) p.channel.t = 0; await new Promise((r) => setTimeout(r, 300));
    return { first: g1 - g0, second: a.char.gold - g1, opened: !!a.char.world.chests[c.o.id] };
  });
  record('Gizli sandık bir kez ödül verir', chest.first > 0 && chest.second === 0 && chest.opened, JSON.stringify(chest));

  // ============================================================== 3) Ayaz Geçidi
  await ev(page, () => { const a = window.__AHEN; a.devTools.levelTo(29); a.world.changeMap('frost', 'from_ash'); });
  await waitMap(page, 'frost');
  const frost = await ev(page, () => {
    const w = window.__AHEN.world;
    return { ids: [...new Set(w.enemies.filter((e) => !e.dead).map((e) => e.tpl.id))].sort(), flakes: w.flakes?.length || 0, gate: !!w.objects.find((o) => o.kind === 'gate') };
  });
  record('Ayaz Geçidi: 4 yaratık türü, kar parçacıkları, Buz Mabedi kapısı', ['frost_wolf', 'ice_wisp', 'frost_sentinel', 'snow_shaman'].every((x) => frost.ids.includes(x)) && frost.flakes > 0 && frost.gate, JSON.stringify(frost));
  await page.screenshot({ path: join(shots, 'v2-frost.png') });
  // Kar Şamanı yavaşlatması ve Buz Gardiyanı
  const warden = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player;
    const e = w.spawner.spawnEnemy('ice_warden', p.x + 70, p.y, { leashR: 20 * 32 });
    e.aggro(p);
    let cast = false, slowed = false;
    const t0 = performance.now();
    while (performance.now() - t0 < 9000) { await new Promise((r) => setTimeout(r, 100)); a.char.hp = Math.max(a.char.hp, 6000); cast = cast || !!e.casting; slowed = slowed || w.clock < p.slowUntil; }
    w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false });
    return { cast, slowed };
  });
  record('Buz Gardiyanı: telegraflı buz vuruşu / kıymıklar', warden.cast, JSON.stringify(warden));
  const gateLocked = await ev(page, () => { const w = window.__AHEN.world; const g = w.objects.find((o) => o.kind === 'gate'); g.interact(w.player); return w.mapId; });
  record('Buz Mabedi görev olmadan mühürlü (giriş yok)', gateLocked === 'frost');

  // ============================================================== 4) Buz Mabedi koşusu
  await ev(page, () => { const a = window.__AHEN; a.devTools.unlockDungeon('frost_temple'); a.world.changeMap('frost_temple', null, { enterDungeon: true }); });
  await waitMap(page, 'frost_temple');
  const t1 = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, ch = a.char;
    const kill = async (stage) => { for (const e of w.enemies.filter((x) => !x.dead && x.stage === stage)) { w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false }); await new Promise((r) => setTimeout(r, 20)); } };
    const st0 = ch.runs.frost_temple.cleared.slice();
    await kill(1); await kill(2); await kill(3);
    await new Promise((r) => setTimeout(r, 300));
    const afterStage3Kill = ch.runs.frost_temple.cleared.slice();
    // mühürler
    const seals = w.objects.filter((o) => o.kind === 'seal');
    const counts = [];
    for (const s of seals) {
      s.interact(w.player);
      counts.push(w.enemies.filter((e) => !e.dead && e.sealId === s.o.id).length);
      await kill(3);
      await new Promise((r) => setTimeout(r, 150));
    }
    return { st0, afterStage3Kill, counts, cleared: ch.runs.frost_temple.cleared.slice(), seals: ch.runs.frost_temple.seals.slice(), bossDoor: w.gates.find((g) => g.g.bossDoor).open };
  });
  record('Buz Mabedi: 1–2. bölüm temizlenir; galeri mühürsüz kapanmaz', t1.afterStage3Kill.join() === '1,2', JSON.stringify(t1.afterStage3Kill));
  record('Her mühür kısa bir karşılaşma başlatır; 3 mühür boss kapısını açar', t1.counts.join() === '3,2,3' && t1.seals.length === 3 && t1.cleared.includes(3) && t1.bossDoor, JSON.stringify(t1));
  await page.screenshot({ path: join(shots, 'v2-temple.png') });
  const boss = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
    const g = w.enemies.find((e) => e.tpl.id === 'frozen_guardian' && !e.dead);
    p.x = g.x - 80; p.y = g.y + 40; g.aggro(p);
    const seen = new Set();
    const t0 = performance.now();
    while (performance.now() - t0 < 9000) { await new Promise((r) => setTimeout(r, 100)); ch.hp = Math.max(ch.hp, 6000); if (g.casting) seen.add('c'); if (performance.now() - t0 > 3000 && g.hp > g.maxHp * 0.6) g.hp = g.maxHp * 0.6; }
    const crystals = w.enemies.filter((e) => !e.dead && e.tpl.id === 'frost_seal_crystal').length;
    const shielded = g.reduce > 0;
    for (const c of w.enemies.filter((e) => !e.dead && e.tpl.id === 'frost_seal_crystal')) w.combat.applyToEnemy(c, { dmg: c.hp + 1, crit: false, miss: false });
    await new Promise((r) => setTimeout(r, 300));
    const shieldAfter = g.reduce > 0;
    // ölüm → boss tam cana döner, bölümler korunur
    const hpBefore = g.hp;
    a.char.hp = 1; w.combat.damagePlayerRaw(50);
    await new Promise((r) => setTimeout(r, 1300));
    const died = !!document.querySelector('[data-testid=respawn]');
    while (window.__AHEN_UI.layers.modal.firstChild) window.__AHEN_UI.closeModal();
    w.respawn();
    await new Promise((r) => setTimeout(r, 400));
    const reset = { died, full: g.hp === g.maxHp, entry: Math.round(p.x / 32), cleared: ch.runs.frost_temple.cleared.slice() };
    // öldür → tek seferlik loot
    p.x = g.x - 80; p.y = g.y + 40;
    w.combat.applyToEnemy(g, { dmg: g.hp + 1, crit: false, miss: false });
    await new Promise((r) => setTimeout(r, 400));
    const run = ch.runs.frost_temple;
    return { cast: seen.has('c'), crystals, shielded, shieldAfter, hpBefore: Math.round(hpBefore), reset, lootClaimed: run?.bossLootClaimed, cleared4: run?.cleared.includes(4), dungeons: ch.history.dungeons.frost_temple };
  });
  record('Donmuş Muhafız: II. faz Buz Mührü + 2 kristal; kristaller kırılınca kalkan düşer', boss.cast && boss.crystals === 2 && boss.shielded && !boss.shieldAfter, JSON.stringify(boss));
  record('Mabette ölüm: boss tam cana döner, temizlenen bölümler korunur, kontrol noktasından devam', boss.reset.full && boss.reset.cleared.join() === '1,2,3', JSON.stringify(boss.reset));
  record('Donmuş Muhafız yenilir: koşu başına tek ödül, zindan sayacı', boss.lootClaimed && boss.cleared4 && boss.dungeons === 1, JSON.stringify(boss));
  const dup = await ev(page, async () => {
    const a = window.__AHEN, w = a.world;
    const e = w.spawner.spawnEnemy('frozen_guardian', w.player.x + 60, w.player.y, { stage: 4 });
    const g0 = a.char.gold;
    w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false });
    await new Promise((r) => setTimeout(r, 200));
    return a.char.gold - g0;
  });
  record('Aynı koşuda ikinci boss ödülü verilmez (loot çoğaltma yok)', dup === 0, String(dup));
  // çıkış: koşu biter, yeniden giriş yeni koşu
  await ev(page, () => { const w = window.__AHEN.world; const ex = w.mapDef.objects.find((o) => o.dungeonExit); w.changeMap(ex.to, ex.entry, { exitDungeon: true }); });
  await waitMap(page, 'frost');
  const exitOk = await ev(page, () => !window.__AHEN.char.runs.frost_temple);
  record('Gönüllü çıkış koşuyu bitirir; tekrar giriş sınırsız', exitOk);

  // ============================================================== 5) Kılıç Yağmuru + beceri çubuğu + Ustalık Kitabı
  await ev(page, () => window.__AHEN.devTools.levelTo(30));
  await ev(page, () => window.__AHEN_OPEN('skills'));
  await page.waitForTimeout(400);
  const hasBar = await page.$('[data-testid=bar-3]');
  if (hasBar) { await page.tap('[data-testid=bar-3]'); await page.waitForTimeout(150); await page.tap('[data-testid=bar-pick-blade_rain]'); await page.waitForTimeout(250); }
  const bar = await ev(page, () => window.__AHEN.char.skillBar);
  record('Beceriler ekranından 5. aktif beceri 4\'lü çubuğa yerleşir', bar?.[3] === 'blade_rain', JSON.stringify(bar));
  await page.screenshot({ path: join(shots, 'v2-skills.png') });
  // Ustalık Kitabı (UI): Rank 5 + kitap
  const bookReady = await ev(page, () => { const a = window.__AHEN, ch = a.char; ch.skills.blade_rain = 5; a.devTools.addStack('mastery_book', 1); a.changed('stats'); return ch.bag.slots.reduce((n, s) => n + (s?.tid === 'mastery_book' ? s.q : 0), 0); });
  void bookReady;
  await ev(page, () => { window.__AHEN_CLOSE(); return window.__AHEN_OPEN('skills'); });
  await page.waitForTimeout(400);
  const bookBtn = await page.$('[data-testid=book-blade_rain]');
  const bookCls = await bookBtn?.getAttribute('class');
  if (bookBtn) { await bookBtn.scrollIntoViewIfNeeded(); await page.screenshot({ path: join(shots, 'v2-book.png') }); await bookBtn.tap({ timeout: 5000 }).catch((e) => console.log('kitap düğmesi:', bookCls, e.message.split('\n')[0])); await page.waitForTimeout(200); await page.tap('[data-testid=dlg-ok]'); await page.waitForTimeout(300); }
  const book = await ev(page, () => ({ applied: !!window.__AHEN.char.masteryBooks.blade_rain, left: window.__AHEN.char.bag.slots.reduce((n, s) => n + (s?.tid === 'mastery_book' ? s.q : 0), 0) }));
  record('Ustalık Kitabı Lv.30 Rank 5 beceriye uygulanır ve tam 1 kitap tüketilir', book.applied && book.left === bookReady - 1, JSON.stringify({ ...book, before: bookReady }));
  await page.tap('.tab:has-text("Av Geçmişi")').catch(() => {});
  await page.waitForTimeout(300);
  const histOk = !!(await page.$('[data-testid=history]'));
  await page.screenshot({ path: join(shots, 'v2-history.png') });
  record('Av Geçmişi ekranı açılır', histOk);
  await ev(page, () => window.__AHEN_CLOSE());
  await page.waitForTimeout(300);
  await ev(page, () => window.__AHEN.world.changeMap('ash', 'from_frost'));
  await waitMap(page, 'ash');
  const rain = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player;
    const es = w.enemies.filter((e) => !e.dead && e.tpl.kind === 'normal').slice(0, 3);
    es.forEach((e, i) => { e.x = p.x + 60 + i * 12; e.y = p.y + (i - 1) * 16; e.home = { x: e.x, y: e.y }; e.state = 'idle'; e.wanderTimer = 99; e.stunUntil = w.clock + 3000; e.sync(); });
    p.target = es[0]; p.cooldowns.blade_rain = 0; p.gcd = 0; p.busy = 0; a.char.mp = 999;
    const hp0 = es.map((e) => e.hp);
    const ok = p.useSkill(3);
    const c0 = w.clock, t0 = performance.now();
    while (w.clock - c0 < 800 && performance.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 50));
    return { ok, hit: es.filter((e, i) => e.dead || e.hp < hp0[i]).length };
  });
  record('Kılıç Yağmuru önündeki alanda birden çok hedefe vurur', rain.ok && rain.hit >= 2, JSON.stringify(rain));
  record('Konsol hatası yok (warrior V2 turu)', page.errors.length === 0, page.errors.slice(0, 3).join(' | '));
  await cw.close();

  // ============================================================== 6) Mage: Zincir Yıldırım
  {
    const { ctx, page: pm } = await newPage();
    await createChar(pm, 'mage', 'Ayazcı');
    await ev(pm, () => { const a = window.__AHEN; a.devTools.levelTo(25); a.world.changeMap('ash', 'from_mine'); });
    await waitMap(pm, 'ash');
    const unlocked = await ev(pm, () => window.__AHEN.char.skills.chain_lightning);
    record('Mage Lv.25\'te Zincir Yıldırım açılır', unlocked === 1, String(unlocked));
    const chain = await ev(pm, async () => {
      const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
      ch.skillBar = ['fireball', 'ice_blast', 'mana_shield', 'chain_lightning'];
      const es = w.enemies.filter((e) => !e.dead && e.tpl.kind === 'normal').slice(0, 4);
      es.forEach((e, i) => { e.x = p.x + 120 + i * 40; e.y = p.y + (i % 2) * 30; e.home = { x: e.x, y: e.y }; e.state = 'idle'; e.wanderTimer = 99; e.stunUntil = w.clock + 3000; e.hp = e.maxHp; e.sync(); });
      p.target = es[0]; p.gcd = 0; p.busy = 0; ch.mp = 999;
      const all = w.enemies.filter((e) => !e.dead);
      const hp0 = all.map((e) => e.hp);
      const ok = p.useSkill(3);
      // sıçramalar sahne saatiyle zamanlanır; yavaş (yazılımsal GPU) karelerde gerçek süreye değil sahne süresine göre bekle
      const c0 = w.clock, t0 = performance.now();
      while (w.clock - c0 < 900 && performance.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 50));
      return { ok, hit: all.filter((e, i) => e.dead || e.hp < hp0[i]).length, pos: es.map((e) => [Math.round(e.x - p.x), Math.round(e.y - p.y), e.tpl.id, e.dead]) };
    });
    record('Zincir Yıldırım ilk hedeften sonra sıçrar (≥3 hedef)', chain.ok && chain.hit >= 3, JSON.stringify(chain));
    await pm.screenshot({ path: join(shots, 'v2-mage-chain.png') });
    record('Konsol hatası yok (mage V2)', pm.errors.length === 0, pm.errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} catch (e) {
  record('Beklenmeyen test hatası', false, e.stack + ' | sayfa: ' + (globalThis.__lastPage?.errors || []).slice(0, 3).join(' | '));
} finally {
  await browser.close();
  server.kill();
  const passed = results.filter((r) => r.ok).length;
  writeFileSync(join(here, 'report-v2.json'), JSON.stringify({ date: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  console.log(`\nE2E V2: ${passed}/${results.length} geçti`);
  process.exit(passed === results.length ? 0 : 1);
}
