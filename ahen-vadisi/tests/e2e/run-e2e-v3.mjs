// V3.0 (Kayıp Krallığın Mirası) uçtan uca testleri: V2 kayıt geçişi, Ölü Krallık / Kara Taht geçişleri, yeni yaratıklar,
// elitler, Mezar Komutanı, refakat ve savunma görevleri, Karanlık Mahzen (mekanizmalar, mühürler, Kayıp Kral fazları),
// Lv.35 becerileri, kullanım eşyaları, görev günlüğü, kapat-aç ve PWA önbelleği.
// Kullanım: npm run build && node tests/e2e/run-e2e-v3.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const PORT = 4175;
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

async function newPage(w = 844, h = 390) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  // oyunla gelen online.json gerçek test sunucusunu gösterir: bu testler dışarı çıkmasın (boş yanıt)
  await ctx.route("**/*.supabase.co/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
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
const DONE_V2 = ['m01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18',
  'm27', 'm28', 'm29', 'm30', 'm31', 'm32', 'm33', 'm34', 'm35', 'm36', 'c10', 'c20'];

try {
  // ============================================================== 1) V2 kayıt geçişi (gerçek depoya şema 2 zarfı)
  {
    const { ctx, page } = await newPage();
    await createChar(page, 'warrior', 'Eskisavasci');
    const mig = await ev(page, async () => {
      const a = window.__AHEN;
      a.devTools.levelTo(30);
      await a.flushSave('test');
      const prof = JSON.parse(JSON.stringify(a.profile));
      prof.schemaVersion = 2;
      for (const c of prof.characters) if (c) {
        delete c.tracking; delete c.mastery2; delete c.effects; delete c.statResets;
        c.v = 2; c.gold = 4321; c.quests.m36 = { s: 'done', p: [1], used: [] }; c.quests.s11 = { s: 'active', p: [3], used: [] };
      }
      const data = JSON.stringify(prof);
      let hsh = 0x811c9dc5; for (let i = 0; i < data.length; i++) { hsh ^= data.charCodeAt(i); hsh = Math.imul(hsh, 0x01000193); }
      const env = { app: 'ahen-vadisi', schemaVersion: 2, savedAt: Date.now(), commit: 1, checksum: (hsh >>> 0).toString(16).padStart(8, '0'), data };
      await a.repo.writeRaw('profile', env);
      await a.repo.writeRaw('snap_0', env);
      const r = await a.repo.load();
      const c = r.profile.characters.find(Boolean);
      const backup = await a.repo.readRaw('v2_backup');
      return { from: r.migratedFrom, sv: r.profile.schemaVersion, level: c.level, gold: c.gold, m36: c.quests.m36?.s, s11: c.quests.s11?.p?.[0], m37: c.quests.m37 || null, tracking: c.tracking, mastery2: c.mastery2, backup: backup?.schemaVersion };
    });
    record('V2 kaydı (Lv.30) güncel şemaya (V4) geçer: seviye, gold, görevler korunur; yeni görevler yapılmamış', mig.from === 2 && mig.sv === 4 && mig.level === 30 && mig.gold === 4321 && mig.m36 === 'done' && mig.s11 === 3 && mig.m37 === null, JSON.stringify(mig));
    record('Geçişte v2_backup saklanır; V3 alanları eklenir (takip listesi, Ustalık II)', mig.backup === 2 && Array.isArray(mig.tracking) && mig.mastery2 === false, JSON.stringify(mig));
    await ctx.close();
  }

  // ============================================================== 2) Warrior: Ayaz → Ölü Krallık
  const { ctx: cw, page } = await newPage();
  await createChar(page, 'warrior', 'Krallikci');
  await ev(page, (done) => { const a = window.__AHEN; a.devTools.levelTo(30); for (const id of done) a.char.quests[id] = { s: 'done', p: [], used: [] }; a.char.mastery = true; a.world.changeMap('frost', 'from_ash'); }, DONE_V2);
  await waitMap(page, 'frost');
  const lockedDead = await ev(page, () => { const w = window.__AHEN.world; const pt = w.objects.find((o) => o.o?.id === 'fr_to_dead'); pt.trigger(); return { locked: pt.locked(), map: w.mapId }; });
  record('Ölü Krallık yolu "Mührün Ardındaki Yol" alınmadan kapalı', lockedDead.locked && lockedDead.map === 'frost', JSON.stringify(lockedDead));
  const acc37 = await ev(page, () => window.__AHEN.devTools.accept('m37'));
  record('Donmuş Muhafız sonrası m37 Arşivci Kaya\'dan alınır', acc37.ok, JSON.stringify(acc37));
  await ev(page, () => { const w = window.__AHEN.world; w.objects.find((o) => o.o?.id === 'fr_to_dead').trigger(); });
  await waitMap(page, 'dead_kingdom');
  const dead = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, ch = a.char;
    await new Promise((r) => setTimeout(r, 600));
    const ids = [...new Set(w.enemies.filter((e) => !e.dead).map((e) => e.tpl.id))].sort();
    const npcs = w.objects.filter((o) => o.kind === 'npc').map((o) => o.npc.id);
    return { ids, npcs, flakes: w.flakes?.length || 0, m37: ch.quests.m37, theme: w.mapDef.theme, chests: w.objects.filter((o) => o.kind === 'chest').length, gather: w.objects.filter((o) => o.kind === 'gather').length };
  });
  record('Ölü Krallık: 4 yaratık türü + Mezar Komutanı doğar', ['shroud_crawler', 'bone_archer', 'cursed_guard', 'grave_mage', 'grave_commander'].every((x) => dead.ids.includes(x)), dead.ids.join(','));
  record('Ölü Krallık: Seher ve Hamit, sis parçacıkları, 2 gizli sandık, toplama düğümleri', dead.npcs.includes('seher') && dead.npcs.includes('hamit') && dead.flakes > 0 && dead.chests === 2 && dead.gather > 10, JSON.stringify({ npcs: dead.npcs, f: dead.flakes, g: dead.gather }));
  record('m37 ulaşma hedefi tamamlanır', dead.m37?.p?.[0] === 1, JSON.stringify(dead.m37));
  await page.screenshot({ path: join(shots, 'v3-dead-kingdom.png') });

  // 30→31 geçişi: gerçek öldürme EXP'siyle
  const lvl = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, ch = a.char;
    ch.exp = 64880 - 400;   // 30→31 eşiğinin hemen altı (belge: 64.880 EXP); gerçek öldürme EXP'si eşiği geçirir
    const e0 = ch.exp, g0 = ch.gold, h0 = ch.history.kills;
    const list = w.enemies.filter((e) => !e.dead && e.tpl.kind === 'normal').slice(0, 30);
    let k = 0;
    for (const e of list) { if (ch.level > 30) break; w.combat.applyToEnemy(e, { dmg: e.hp + 10, crit: false, miss: false }); k++; await new Promise((r) => setTimeout(r, 25)); }
    return { level: ch.level, kills: ch.history.kills - h0, gold: ch.gold - g0, exp0: e0, k };
  });
  record('V3 yaratık öldürme EXP/gold verir; 30→31 seviye geçişi', lvl.level === 31 && lvl.gold > 0 && lvl.kills === lvl.k, JSON.stringify(lvl));

  // Mezar Büyücüsü laneti (normal yetenek, telegraflı)
  const curse = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player;
    const e = w.spawner.spawnEnemy('grave_mage', p.x + 120, p.y, { leashR: 30 * 32 });
    e.aggro(p); e.abilityCd = 0.2;
    let cast = false, cursed = false;
    const c0 = w.clock, t0 = performance.now();
    while (w.clock - c0 < 6000 && performance.now() - t0 < 20000) { await new Promise((r) => setTimeout(r, 80)); a.char.hp = Math.max(a.char.hp, 3000); cast = cast || !!e.casting; cursed = cursed || !!p.buffs.curse; if (cursed) break; }
    w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false });
    return { cast, cursed };
  });
  record('Mezar Büyücüsü: telegraflı Mezar Laneti (alınan hasar artışı)', curse.cast, JSON.stringify(curse));

  // Kefen Avcısı elit: atılma/tırpan, öfke ve garantili damga
  const hunter = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player;
    const e = w.spawner.spawnEnemy('shroud_hunter', p.x + 160, p.y, { leashR: 30 * 32 });
    e.aggro(p); e.hp = e.maxHp * 0.28; e.abilityCd = 0.3;
    let enr = false, cast = false;
    const c0 = w.clock, t0 = performance.now();
    while (w.clock - c0 < 7000 && performance.now() - t0 < 20000) { await new Promise((r) => setTimeout(r, 80)); a.char.hp = Math.max(a.char.hp, 6000); enr = enr || e.enraged; cast = cast || !!e.casting; }
    w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false });
    await new Promise((r) => setTimeout(r, 200));
    return { enr, cast, brand: a.char.bag.slots.some((s) => s?.tid === 'hunter_brand') };
  });
  record('Kefen Avcısı: öfke (%30 altı), telegraflı yetenek, garantili Avcı Damgası', hunter.enr && hunter.cast && hunter.brand, JSON.stringify(hunter));

  // Mezar Komutanı: Kemik Çağrısı, Lanetli Bayrak, Son Nöbet; çağrılar ödül vermez
  const cmd = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
    const g = w.enemies.find((e) => e.tpl.id === 'grave_commander' && !e.dead);
    p.x = g.x - 80; p.y = g.y + 40; g.aggro(p);
    let cast = false;
    const c0 = w.clock, t0 = performance.now();
    while (w.clock - c0 < 9000 && performance.now() - t0 < 25000) {
      await new Promise((r) => setTimeout(r, 100)); ch.hp = Math.max(ch.hp, 8000); cast = cast || !!g.casting;
      if (w.clock - c0 > 2500 && g.hp > g.maxHp * 0.6) g.hp = g.maxHp * 0.6;
    }
    const soldiers = w.enemies.filter((e) => !e.dead && e.tpl.id === 'bone_soldier');
    const banner = w.enemies.filter((e) => !e.dead && e.tpl.id === 'cursed_banner').length;
    const exp0 = ch.exp, lv0 = ch.level;
    for (const s of [...soldiers, ...w.enemies.filter((e) => !e.dead && e.tpl.id === 'cursed_banner')]) w.combat.applyToEnemy(s, { dmg: s.hp + 1, crit: false, miss: false });
    const summonExp = ch.exp - exp0 + (ch.level - lv0) * 1e9;
    g.hp = g.maxHp * 0.2;
    const c1 = w.clock, t1 = performance.now();
    while (!g.behavior.fury && w.clock - c1 < 1500 && performance.now() - t1 < 8000) await new Promise((r) => setTimeout(r, 80));
    const fury = g.behavior.fury;
    const k0 = ch.history.bossKills.grave_commander || 0;
    w.combat.applyToEnemy(g, { dmg: g.hp + 1, crit: false, miss: false });
    await new Promise((r) => setTimeout(r, 300));
    return { cast, soldiers: soldiers.length, banner, summonExp, fury, kill: (ch.history.bossKills.grave_commander || 0) - k0, crest: ch.bag.slots.some((s) => s?.tid === 'commander_crest'), hazards: w.combat.hazards.length };
  });
  record('Mezar Komutanı: telegraflı saldırılar, %70 altında 2 Kemik Asker, %80 altında Lanetli Bayrak', cmd.cast && cmd.soldiers === 2 && cmd.banner === 1, JSON.stringify(cmd));
  record('Komutan çağrıları EXP vermez; Son Nöbet (%25); yenilince garantili Komutan Arması', cmd.summonExp === 0 && cmd.fury && cmd.kill === 1 && cmd.crest && cmd.hazards === 0, JSON.stringify(cmd));
  await page.screenshot({ path: join(shots, 'v3-commander.png') });

  // Siyah Kapı: m42 — arma tüketilir, bayrak açılır, portal açılır
  await ev(page, () => { const ch = window.__AHEN.char; window.__AHEN.devTools.levelTo(35); for (const id of ['m37', 'm38', 'm39', 'm40', 'm41']) ch.quests[id] = { s: 'done', p: [], used: [] }; });
  const acc42 = await ev(page, () => window.__AHEN.devTools.accept('m42'));
  const gate = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
    const portal = w.objects.find((o) => o.o?.id === 'dk_to_throne');
    const before = portal.locked();
    const lock = w.objects.find((o) => o.o?.id === 'black_lock');
    p.x = lock.x; p.y = lock.y + 30;
    const crest0 = ch.bag.slots.reduce((n, s) => n + (s?.tid === 'commander_crest' ? s.q : 0), 0);
    lock.interact(p);
    if (p.channel) p.channel.t = 0;
    await new Promise((r) => setTimeout(r, 400));
    const crest1 = ch.bag.slots.reduce((n, s) => n + (s?.tid === 'commander_crest' ? s.q : 0), 0);
    return { before, after: portal.locked(), flag: !!ch.world.flags.black_gate_open, used: crest0 - crest1, p0: ch.quests.m42.p[0] };
  });
  record('Siyah Kapı: Komutan Arması ile açılır (1 arma tüketilir), Kara Taht geçidi açılır', acc42.ok && gate.before && !gate.after && gate.flag && gate.used === 1 && gate.p0 === 1, JSON.stringify({ acc42, gate }));
  await ev(page, () => window.__AHEN.world.objects.find((o) => o.o?.id === 'dk_to_throne').trigger());
  await waitMap(page, 'black_throne');
  const throne = await ev(page, async () => {
    const w = window.__AHEN.world, ch = window.__AHEN.char;
    await new Promise((r) => setTimeout(r, 600));
    return { ids: [...new Set(w.enemies.filter((e) => !e.dead).map((e) => e.tpl.id))].sort(), npcs: w.objects.filter((o) => o.kind === 'npc').map((o) => o.npc.id), m42: ch.quests.m42.p, ready: ch.quests.m42 && window.__AHEN.char.quests.m42.p.every((x) => x >= 1), gate: !!w.objects.find((o) => o.kind === 'gate') };
  });
  record('Kara Taht: 4 yaratık türü, Eren ve Veysel, Karanlık Mahzen kapısı', ['obsidian_sentinel', 'shadow_hunter', 'throne_executioner', 'void_priest'].every((x) => throne.ids.includes(x)) && throne.npcs.includes('eren') && throne.npcs.includes('veysel') && throne.gate, JSON.stringify(throne));
  record('m42 iki hedefi de tamamlandı (kapı + Kara Taht\'a geçiş)', throne.ready, JSON.stringify(throne.m42));
  await page.screenshot({ path: join(shots, 'v3-black-throne.png') });

  // Refakat: Kapının Son Nöbeti — yalnız oyuncu yakınken ilerler, takılmaz, pusular ödül vermez
  await ev(page, () => { const ch = window.__AHEN.char; window.__AHEN.devTools.levelTo(36); ch.quests.m42 = { s: 'done', p: [], used: [] }; });
  const acc40 = await ev(page, () => window.__AHEN.devTools.accept('s40'));
  const esc = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
    const o = w.objects.find((x) => x.kind === 'escort' && x.o.id === 'last_guard');
    // oyuncu uzaktayken başlat: ilerlememeli
    p.x = o.x + 12 * 32; p.y = o.y;
    o.begin();
    const sx = o.x, sy = o.y;
    const c0 = w.clock;
    while (w.clock - c0 < 1500) await new Promise((r) => setTimeout(r, 80));
    const movedFar = Math.hypot(o.x - sx, o.y - sy);
    // yakında kal, pusuları temizle
    const exp0 = ch.exp; let ambush = 0;
    const t0 = performance.now();
    while (o.running && performance.now() - t0 < 120000) {
      p.x = o.x - 40; p.y = o.y + 20; ch.hp = Math.max(ch.hp, 8000);
      for (const e of w.enemies.filter((x) => !x.dead && x.questSpawn)) { ambush++; w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false }); }
      await new Promise((r) => setTimeout(r, 120));
    }
    return { movedFar: Math.round(movedFar), done: ch.quests.s40?.p?.[0], ambushExp: ch.exp - exp0, ambush, atEnd: o.atEnd };
  });
  record('Refakat: oyuncu uzaktayken ilerlemez; yakında kalınca hedefe takılmadan ulaşır', acc40.ok && esc.movedFar < 8 && esc.done === 1 && esc.atEnd, JSON.stringify(esc));
  record('Refakat pusu yaratıkları EXP vermez', esc.ambush > 0 && esc.ambushExp === 0, JSON.stringify(esc));

  // Savunma: Kanlı Yemin — başarısızlık yeniden denenebilir; başarı tek sefer sayılır
  await ev(page, () => { const ch = window.__AHEN.char; window.__AHEN.devTools.levelTo(37); ch.quests.m43 = { s: 'done', p: [], used: [] }; });
  const acc44 = await ev(page, () => window.__AHEN.devTools.accept('m44'));
  const def = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
    ch.quests.m44.p[0] = 3; ch.quests.m44.used = ['rs_west', 'rs_south', 'rs_east'];   // üç mühür onarıldı
    const south = w.objects.find((x) => x.kind === 'defense' && x.o.id === 'def_rs_south');
    p.x = south.x; p.y = south.y + 40;
    south.begin();
    await new Promise((r) => setTimeout(r, 300));
    south.takeHit(999999);
    const failed = !south.running && ch.quests.m44.p[2] === 0 && south.available;
    const west = w.objects.find((x) => x.kind === 'defense' && x.o.id === 'def_rs_west');
    p.x = west.x; p.y = west.y + 40;
    const exp0 = ch.exp;
    west.begin();
    const t0 = performance.now();
    let waves = 0;
    while (west.running && performance.now() - t0 < 60000) {
      ch.hp = Math.max(ch.hp, 8000); p.x = west.x; p.y = west.y + 40;
      const al = w.enemies.filter((x) => !x.dead && x.questSpawn);
      if (al.length) waves = Math.max(waves, west.waveNo);
      for (const e of al) w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false });
      await new Promise((r) => setTimeout(r, 150));
    }
    return { failed, done: ch.quests.m44.p[1], waves, exp: ch.exp - exp0, again: west.available };
  });
  record('Savunma: korunan nesne düşerse görev başarısız, yeniden denenebilir', acc44.ok && def.failed, JSON.stringify(def));
  record('Savunma: dalgalar temizlenince hedef tamamlanır; dalgalar EXP vermez; tekrar başlatılamaz', def.done === 1 && def.waves === 2 && def.exp === 0 && !def.again, JSON.stringify(def));

  // Lv.35 becerisi: Sarsılmaz Öfke + çubuğa yerleştirme (UI)
  await ev(page, () => window.__AHEN_OPEN('skills'));
  await page.waitForTimeout(400);
  if (await page.$('[data-testid=bar-2]')) { await page.tap('[data-testid=bar-2]'); await page.waitForTimeout(150); await page.tap('[data-testid=bar-pick-iron_fury]'); await page.waitForTimeout(250); }
  await page.screenshot({ path: join(shots, 'v3-skills.png') });
  await ev(page, () => window.__AHEN_CLOSE());
  const fury = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
    p.cooldowns.iron_fury = 0; p.gcd = 0; p.busy = 0; ch.mp = 999; p.lastHurtAt = -1e9;
    const ok = p.useSkill(ch.skillBar.indexOf('iron_fury'));
    await new Promise((r) => setTimeout(r, 300));
    const bs = p.buffState();
    return { bar: ch.skillBar, ok, fury: !!p.buffs.fury, red: bs.furyReduce, mult: p.dmgBuffMult('phys') };
  });
  record('Sarsılmaz Öfke: 6. beceri 4\'lü çubuğa yerleşir; +%15 fiziksel hasar, −%10 alınan hasar', fury.bar.includes('iron_fury') && fury.bar.length === 4 && fury.ok && fury.fury && Math.abs(fury.red - 0.1) < 1e-9 && Math.abs(fury.mult - 1.15) < 1e-9, JSON.stringify(fury));

  // ============================================================== 3) Karanlık Mahzen
  await ev(page, () => { const a = window.__AHEN; a.devTools.levelTo(39); a.devTools.unlockDungeon('dark_crypt'); a.world.changeMap('dark_crypt', null, { enterDungeon: true }); });
  await waitMap(page, 'dark_crypt');
  const crypt = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, ch = a.char, p = w.player;
    const run = () => ch.runs.dark_crypt;
    const kill = async (stage) => { for (const e of w.enemies.filter((x) => !x.dead && x.stage === stage)) { w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false }); await new Promise((r) => setTimeout(r, 15)); } };
    await kill(1); await kill(2);
    await new Promise((r) => setTimeout(r, 300));
    const afterKill2 = run().cleared.slice();   // mekanizmalar etkinleşmeden 2. bölüm kapanmaz
    const levers = w.objects.filter((o) => o.kind === 'seal' && o.lever);
    for (const l of levers) { p.x = l.x; p.y = l.y + 30; l.interact(p); if (p.channel) p.channel.t = 0; await new Promise((r) => setTimeout(r, 350)); }
    const afterLevers = run().cleared.slice();
    await kill(3);
    await new Promise((r) => setTimeout(r, 200));
    const afterKill3 = run().cleared.slice();
    const seals = w.objects.filter((o) => o.kind === 'seal' && !o.lever);
    const counts = [];
    for (const s of seals) { s.interact(p); counts.push(w.enemies.filter((e) => !e.dead && e.sealId === s.o.id).length); await kill(3); await new Promise((r) => setTimeout(r, 200)); }
    return { afterKill2, levers: levers.length, afterLevers, afterKill3, counts, cleared: run().cleared.slice(), bossDoor: w.gates.find((g) => g.g.bossDoor).open };
  });
  record('Karanlık Mahzen: 1. bölüm temizlenir; 2. bölüm iki kapı mekanizması olmadan açılmaz', crypt.afterKill2.join() === '1' && crypt.levers === 2 && crypt.afterLevers.join() === '1,2', JSON.stringify(crypt));
  record('Kraliyet Mühürleri: her mühür savunma karşılaşması başlatır; üçü kırılınca taht kapısı açılır', crypt.afterKill3.join() === '1,2' && crypt.counts.join() === '3,2,3' && crypt.cleared.includes(3) && crypt.bossDoor, JSON.stringify(crypt));
  await page.screenshot({ path: join(shots, 'v3-crypt.png') });
  const king = await ev(page, async () => {
    const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
    const g = w.enemies.find((e) => e.tpl.id === 'lost_king' && !e.dead);
    p.x = g.x - 80; p.y = g.y + 40; g.aggro(p);
    const seen = new Set();
    const c0 = w.clock, t0 = performance.now();
    while (w.clock - c0 < 6000 && performance.now() - t0 < 20000) { await new Promise((r) => setTimeout(r, 100)); ch.hp = Math.max(ch.hp, 9000); if (g.casting) seen.add('c'); }
    g.hp = g.maxHp * 0.6;
    const c1 = w.clock, t1 = performance.now();
    while (w.clock - c1 < 1500 && performance.now() - t1 < 8000) await new Promise((r) => setTimeout(r, 100));
    const seals = w.enemies.filter((e) => !e.dead && e.tpl.id === 'king_seal');
    const shielded = g.reduce > 0.5;
    for (const s of seals) w.combat.applyToEnemy(s, { dmg: s.hp + 1, crit: false, miss: false });
    await new Promise((r) => setTimeout(r, 400));
    const shieldAfter = g.reduce > 0;
    g.hp = g.maxHp * 0.25;
    let ring = false, maxZones = 0;
    const c2 = w.clock, t2 = performance.now();
    while (w.clock - c2 < 9000 && performance.now() - t2 < 30000) {
      await new Promise((r) => setTimeout(r, 100)); ch.hp = Math.max(ch.hp, 9000);
      ring = ring || (g.behavior.fury && !!g.casting);
      maxZones = Math.max(maxZones, w.combat.hazards.filter((h) => h.label === 'Karanlık Alan' || h.label === null).length);
    }
    const fury = g.behavior.fury;
    // ölüm: boss tam cana döner, bölümler korunur, kontrol noktası
    ch.hp = 1; w.combat.damagePlayerRaw(50);
    await new Promise((r) => setTimeout(r, 1300));
    while (window.__AHEN_UI.layers.modal.firstChild) window.__AHEN_UI.closeModal();
    w.respawn();
    await new Promise((r) => setTimeout(r, 500));
    const reset = { full: g.hp === g.maxHp, shield: g.reduce, cleared: ch.runs.dark_crypt.cleared.slice(), x: Math.round(p.x / 32), y: Math.round(p.y / 32) };
    p.x = g.x - 80; p.y = g.y + 40;
    const shard0 = ch.bag.slots.reduce((n, s) => n + (s?.tid === 'crown_shard' ? s.q : 0), 0);
    w.combat.applyToEnemy(g, { dmg: g.hp + 1, crit: false, miss: false });
    await new Promise((r) => setTimeout(r, 400));
    const shard1 = ch.bag.slots.reduce((n, s) => n + (s?.tid === 'crown_shard' ? s.q : 0), 0);
    const run = ch.runs.dark_crypt;
    return { cast: seen.has('c'), seals: seals.length, shielded, shieldAfter, fury, ring, maxZones, reset, shards: shard1 - shard0, claimed: run?.bossLootClaimed, cleared4: run?.cleared.includes(4), hist: ch.history.dungeons.dark_crypt };
  });
  record('Kayıp Kral I–II: telegraflı saldırılar; %65 altında Kırık Taç kalkanı + 2 kadim mühür; mühürler kırılınca kalkan düşer', king.cast && king.seals === 2 && king.shielded && !king.shieldAfter, JSON.stringify(king));
  record('Kayıp Kral III (%30): Son Hüküm — hızlanır, güvenli boşluklu halka, en çok 4 karanlık alan', king.fury && king.ring && king.maxZones <= 4, JSON.stringify(king));
  record('Mahzende ölüm: Kral tam cana döner, kalkan sıfırlanır, bölümler korunur (kontrol noktası)', king.reset.full && king.reset.shield === 0 && king.reset.cleared.join() === '1,2,3' && king.reset.x > 55, JSON.stringify(king.reset));
  record('Kayıp Kral yenilir: garantili Kırık Taç Parçası, koşu başına tek ödül, zindan sayacı', king.shards >= 1 && king.claimed && king.cleared4 && king.hist === 1, JSON.stringify(king));
  const dupKing = await ev(page, async () => {
    const a = window.__AHEN, w = a.world;
    const e = w.spawner.spawnEnemy('lost_king', w.player.x + 60, w.player.y, { stage: 4 });
    const g0 = a.char.gold;
    w.combat.applyToEnemy(e, { dmg: e.hp + 1, crit: false, miss: false });
    await new Promise((r) => setTimeout(r, 200));
    return a.char.gold - g0;
  });
  record('Aynı koşuda ikinci Kral ödülü verilmez', dupKing === 0, String(dupKing));
  record('Konsol hatası yok (warrior V3 turu)', page.errors.length === 0, page.errors.slice(0, 3).join(' | '));

  // Kapat-aç: V3 alanları kalıcı
  const before = await ev(page, async () => { const a = window.__AHEN; a.char.tracking = ['s40']; a.char.mastery2 = true; await a.flushSave('test'); return { name: a.char.name, flag: a.char.world.flags.black_gate_open, lv: a.char.level }; });
  await page.reload();
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  await dismissV4Notice(page);
  const after = await ev(page, (name) => { const c = window.__AHEN.profile.characters.find((x) => x?.name === name); return { lv: c.level, flag: c.world.flags.black_gate_open, m2: c.mastery2, tr: c.tracking, s40: c.quests.s40?.s, bar: c.skillBar }; }, before.name);
  record('Kapat-aç: seviye, bayraklar, görevler, takip listesi, Ustalık II, beceri çubuğu korunur', after.lv === before.lv && after.flag && after.m2 && after.tr?.[0] === 's40' && after.bar.includes('iron_fury'), JSON.stringify(after));
  await cw.close();

  // ============================================================== 4) Mage: Donmuş Zaman, kullanım eşyaları, görev günlüğü
  {
    const { ctx, page: pm } = await newPage();
    await createChar(pm, 'mage', 'Zamanci');
    await ev(pm, (done) => { const a = window.__AHEN; a.devTools.levelTo(35); for (const id of done) a.char.quests[id] = { s: 'done', p: [], used: [] }; a.char.quests.m37 = { s: 'done', p: [1], used: [] }; a.world.changeMap('dead_kingdom', 'from_frost'); }, DONE_V2);
    await waitMap(pm, 'dead_kingdom');
    const tf = await ev(pm, async () => {
      const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
      ch.skillBar = ['fireball', 'ice_blast', 'mana_shield', 'time_freeze'];
      const n = w.spawner.spawnEnemy('shroud_crawler', p.x + 50, p.y, { leashR: 9999 });
      const b = w.spawner.spawnEnemy('grave_commander', p.x - 60, p.y + 10, { leashR: 9999 });
      for (const e of [n, b]) { e.stunUntil = w.clock + 5000; }
      p.gcd = 0; p.busy = 0; ch.mp = 999;
      const ok = p.useSkill(3);
      const c0 = w.clock, t0 = performance.now();
      while (w.clock - c0 < 500 && performance.now() - t0 < 6000) await new Promise((r) => setTimeout(r, 50));
      const r = { ok, normal: n.slowPct, normalHit: n.hp < n.maxHp, boss: b.slowPct, bossDur: Math.round((b.slowUntil - w.clock) / 100) / 10, unlocked: ch.skills.time_freeze };
      w.spawner.despawn(n); w.spawner.despawn(b);
      return r;
    });
    record('Donmuş Zaman (Lv.35): hasar + normal %55 yavaşlatma; bossta kısa ve zayıf (%20)', tf.unlocked === 1 && tf.ok && tf.normalHit && tf.normal === 0.55 && tf.boss === 0.2 && tf.bossDur <= 1.3, JSON.stringify(tf));

    const use = await ev(pm, async () => {
      const a = window.__AHEN, w = a.world, p = w.player, ch = a.char;
      const cnt = (id) => ch.bag.slots.reduce((n, s) => n + (s?.tid === id ? s.q : 0), 0);
      for (const id of ['cleansing_salve', 'return_scroll', 'camp_ration', 'miner_lamp', 'scout_compass']) a.devTools.addStack(id, 2);
      // Temizleyici Merhem: zehri giderir (savaşta da), 1 adet tüketilir
      p.poison = { dmg: 5, left: 5, tick: 1 }; p.lastHurtAt = w.clock;
      const s0 = cnt('cleansing_salve');
      const r1 = p.useUsable('cleansing_salve');
      const salve = { ok: r1.ok, poison: !!p.poison, used: s0 - cnt('cleansing_salve') };
      // Dönüş Parşömeni: savaşta reddedilir ve tükenmez
      p.lastHurtAt = w.clock;
      const r0 = cnt('return_scroll');
      const r2 = p.useUsable('return_scroll');
      const scrollCombat = { ok: r2.ok, used: r0 - cnt('return_scroll') };
      // savaş dışı: Kamp Erzağı, Maden Lambası
      for (const e of w.enemies.filter((e) => !e.dead && (e.state === 'chase' || e.state === 'attack'))) e.startReturn();
      p.lastHurtAt = -1e9; p.lastCombatAt = -1e9;
      await new Promise((r) => setTimeout(r, 200));
      ch.hp = 10;
      const r3 = p.useUsable('camp_ration');
      const r4 = p.useUsable('miner_lamp');
      return { salve, scrollCombat, ration: r3.ok && !!p.buffs.ration, lamp: r4.ok && ch.effects.lampUntil > ch.world.activeTime, rationLeft: cnt('camp_ration'), lampLeft: cnt('miner_lamp') };
    });
    record('Kullanım eşyaları: Merhem zehri giderir (1 tüketilir); Parşömen savaşta reddedilir (tükenmez)', use.salve.ok && !use.salve.poison && use.salve.used === 1 && !use.scrollCombat.ok && use.scrollCombat.used === 0, JSON.stringify(use));
    record('Kamp Erzağı ve Maden Lambası savaş dışında çalışır ve tam 1 adet tüketilir', use.ration && use.lamp && use.rationLeft === 1 && use.lampLeft === 1, JSON.stringify(use));
    // Dönüş Parşömeni (UI): seyahat penceresi → ücretsiz yolculuk, parşömen seçimde tükenir
    await ev(pm, () => { const a = window.__AHEN; a.char.world.waystones.push('ws_village'); a.world.player.lastHurtAt = -1e9; a.world.player.lastCombatAt = -1e9; a.world.player.useUsable('return_scroll'); });
    await pm.waitForTimeout(400);
    const btns = await pm.$$('.dlg .btn.green:not(.dis)');
    const g0 = await ev(pm, () => window.__AHEN.char.gold);
    if (btns.length) await btns[0].tap();
    await pm.waitForTimeout(500);
    await pm.waitForFunction(() => !window.__AHEN.world.changing && window.__AHEN.world.mapId !== 'dead_kingdom', null, { timeout: 20000 }).catch(() => {});
    const trav = await ev(pm, () => ({ map: window.__AHEN.world.mapId, scrolls: window.__AHEN.char.bag.slots.reduce((n, s) => n + (s?.tid === 'return_scroll' ? s.q : 0), 0), gold: window.__AHEN.char.gold }));
    record('Dönüş Parşömeni: keşfedilmiş Yol Taşı\'na ücretsiz döner, 1 parşömen tükenir', trav.map !== 'dead_kingdom' && trav.scrolls === 1 && trav.gold === g0, JSON.stringify(trav));

    // Görev günlüğü: kategori + bölge filtresi + 3 takip, HUD'da 3 görev
    await ev(pm, () => { const a = window.__AHEN; for (const id of ['s37', 's39']) a.devTools.accept(id); a.char.quests.m38 = undefined; delete a.char.quests.m38; a.devTools.accept('m38'); });
    await ev(pm, () => window.__AHEN_OPEN('quests'));
    await pm.waitForTimeout(400);
    await pm.tap('[data-testid=jcat-side]'); await pm.waitForTimeout(200);
    await pm.selectOption('[data-testid=jregion]', 'dead'); await pm.waitForTimeout(250);
    const jr = await ev(pm, () => [...document.querySelectorAll('[data-testid^=jq-]')].map((x) => x.dataset.testid.slice(3)));
    await pm.screenshot({ path: join(shots, 'v3-journal.png') });
    if (await pm.$('[data-testid=jq-m38]')) { /* ana görev ayrı sekmede */ }
    await pm.tap('[data-testid=jcat-main]'); await pm.waitForTimeout(200);
    await pm.selectOption('[data-testid=jregion]', 'all'); await pm.waitForTimeout(200);
    if (await pm.$('[data-testid=jq-m38]')) { await pm.tap('[data-testid=jq-m38]'); await pm.waitForTimeout(150); const tb = await pm.$('[data-testid=track-m38]'); const tx = await tb?.textContent(); if (tx && tx.includes('☆')) await tb.tap(); await pm.waitForTimeout(200); }
    const trk = await ev(pm, () => window.__AHEN.char.tracking.slice());
    await ev(pm, () => window.__AHEN_CLOSE());
    await pm.waitForTimeout(500);
    const hud = await ev(pm, () => [...document.querySelectorAll('.tracker .qn')].map((x) => x.textContent));
    await pm.screenshot({ path: join(shots, 'v3-hud-tracker.png') });
    record('Görev günlüğü: Yan + Ölü Krallık filtresi yalnız o bölgenin yan görevlerini listeler', jr.includes('s37') && jr.includes('s39') && !jr.includes('m38') && jr.every((id) => !id.startsWith('s1') || id === 's37' || id === 's39'), JSON.stringify(jr));
    record('En çok 3 görev takip edilir ve HUD\'da gösterilir', trk.length === 3 && hud.length === 3, JSON.stringify({ trk, hud }));
    record('Konsol hatası yok (mage V3)', pm.errors.length === 0, pm.errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ============================================================== 5) PWA önbelleği: yeni sürüm ve V3 varlıkları
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    // oyunla gelen online.json gerçek test sunucusunu gösterir: bu testler dışarı çıkmasın (boş yanıt)
    await ctx.route("**/*.supabase.co/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    const pg = await ctx.newPage();
    await pg.goto(BASE);
    await pg.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
    await dismissV4Notice(pg);
    const sw = await pg.evaluate(async () => {
      const r = await navigator.serviceWorker.ready;
      const txt = await (await fetch('sw.js')).text();
      return { active: !!r.active, version: (txt.match(/oyun sürümü ([\d.]+)/) || [])[1] || null, cache: (txt.match(/CACHE = '([^']+)'/) || [])[1], assets: (txt.match(/\.js"/g) || []).length };
    });
    await pg.waitForTimeout(1500);
    await ctx.setOffline(true);
    await pg.reload();
    let offline = false;
    try { await pg.waitForSelector('[data-testid=menu-play]', { timeout: 30000 }); offline = true; } catch { /* */ }
    // V4: sürüm package.json'dan okunur (önbellek her sürümde yenilenir)
    const PKGV = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
    record(`PWA: servis işçisi etkin, ${PKGV} sürümlü önbellek; çevrimdışı açılış`, sw.active && offline && sw.assets > 0 && sw.version === PKGV, JSON.stringify({ ...sw, offline }));
    await ctx.close();
  }
} catch (e) {
  record('Beklenmeyen test hatası', false, e.stack + ' | sayfa: ' + (globalThis.__lastPage?.errors || []).slice(0, 3).join(' | '));
} finally {
  await browser.close();
  server.kill();
  const passed = results.filter((r) => r.ok).length;
  writeFileSync(join(here, 'report-v3.json'), JSON.stringify({ date: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  console.log(`\nE2E V3: ${passed}/${results.length} geçti`);
  process.exit(passed === results.length ? 0 : 1);
}
