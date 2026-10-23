// V4.0 (Gökyarık Genişlemesi) uçtan uca testleri: 5 yuva ve 4 sınıf oluşturma, Okçu okları (duvar engeli),
// Ölü Çağıran Ruh Mermisi ve iskelet kuralları (yalnız seçili hedef, AFK yok, tek ödül, harita değişimi/ölüm),
// Kara Taht → Gökyarık Ovası → Yıldız Mezarı geçişleri, V4 yaratık/elit yetenekleri, Fırtına Tiranı fazları,
// Gökyarık Mabedi (5 bölüm, yanıltıcı düğüm, çok dalgalı mühür), Göğün Mahkûmu fazları ve sıfırlanma,
// mobil HUD, Kayıt Güvenliği bölümü ve V4 yedek hatırlatması.
// Kullanım: npm run build && node tests/e2e/run-e2e-v4.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const PKG = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const PORT = 4176;
const BASE = `http://localhost:${PORT}/`;
const results = [];
const record = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };

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
  return { ctx, page };
}

async function closeModals(page) {
  await page.evaluate(() => { const u = window.__AHEN_UI; while (u?.layers?.modal?.firstChild) u.closeModal(); });
}

async function createChar(page, cls, name, slot = null) {
  await closeModals(page);
  await page.tap('[data-testid=menu-play]');
  await page.waitForTimeout(250);
  if (slot !== null) await page.tap(`[data-testid=slot-${slot}]`);
  if (!await page.$('[data-testid=create-char]')) {
    for (let i = 0; i < 5; i++) { await page.tap(`[data-testid=slot-${i}]`); if (await page.$('[data-testid=create-char]')) break; }
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
const DONE_V3 = ['m01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18',
  'm27', 'm28', 'm29', 'm30', 'm31', 'm32', 'm33', 'm34', 'm35', 'm36', 'm37', 'm38', 'm39', 'm40', 'm41', 'm42', 'm43', 'm44', 'm45', 'm46', 'c10', 'c20'];

// tarayıcı içi yardımcılar (her sayfada bir kez tanımlanır)
const HELPERS = () => {
  window.__T = {
    sleepGame: async (ms, maxReal = 20000) => { const w = window.__AHEN.world, c0 = w.clock, t0 = performance.now(); while (w.clock - c0 < ms && performance.now() - t0 < maxReal) await new Promise((r) => setTimeout(r, 50)); },
    kill: (e) => window.__AHEN.world.combat.applyToEnemy(e, { dmg: e.hp + 10, crit: false, miss: false }),
    finishChannel: () => { const p = window.__AHEN.world.player, c = p.channel; if (c) { p.channel = null; c.done(); } return !!c; },
    toasts: [],
  };
  window.__AHEN_BUS.on('toast', (t) => window.__T.toasts.push(t.text));
};


// Lv.50'de sınıfın 7 aktif becerisinin hepsi: kullanılır (true); hasar becerileri hedefe hasar verir
const ALL_SKILLS = async (cls) => {
  const A = window.__AHEN, w = A.world, p = w.player, T = window.__T, ch = A.char;
  A.devTools.levelTo(50);
  await T.sleepGame(300);
  const { CLASS_SKILLS, SKILLS } = window.__AHEN_DATA || {};
  const ids = window.__AHEN_SKILLS[cls];
  const e = w.spawner.spawnEnemy('gray_wolf', p.x + 3 * 32, p.y, { leashR: 9999 });
  e.stunUntil = w.clock + 120000; e.hp = e.maxHp = 2000000;
  p.selectTarget(e);
  const out = {};
  for (const id of ids) {
    ch.skillBar = [id, ...ch.skillBar.filter((x) => x !== id)].slice(0, 4);
    p.cooldowns = {}; p.gcd = 0; p.busy = 0; ch.mp = 99999; ch.hp = ch.maxHp || ch.hp;
    const hp0 = e.hp;
    const ok = p.useSkill(0);
    await T.sleepGame(1400);
    out[id] = { ok, dmg: Math.round(hp0 - e.hp) };
  }
  w.spawner.despawn(e);
  void CLASS_SKILLS; void SKILLS;
  return out;
};

try {
  // ============================================================== 1) 5 yuva, 4 sınıf, Okçu
  const { ctx: c1, page } = await newPage();
  await page.tap('[data-testid=menu-play]');
  await page.waitForTimeout(300);
  const slots = await page.$$('[data-testid^=slot-]');
  await page.tap('[data-testid=create-char]');
  await page.waitForTimeout(200);
  const classes = await ev(page, () => [...document.querySelectorAll('[data-testid^=class-]')].map((x) => x.dataset.testid.slice(6)));
  await page.screenshot({ path: join(shots, 'v4-create.png') });
  record('Ana menü: 5 karakter yuvası; oluşturma ekranında 4 sınıf', slots.length === 5 && ['warrior', 'mage', 'archer', 'necromancer'].every((c) => classes.includes(c)), JSON.stringify({ slots: slots.length, classes }));
  await page.reload();
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  await createChar(page, 'archer', 'Okcu', 0);
  await ev(page, HELPERS);
  const a1 = await ev(page, () => { const A = window.__AHEN, st = A.stats(); return { hp: st.maxHp, mp: st.maxMp, range: st.attackRange, iv: st.attackInterval, bar: A.char.skillBar.slice(), eq: Object.values(A.char.equipment).filter(Boolean).map((e) => e.tid) }; });
  // saldırı aralığı: temel 1,25 sn; DEX saldırı hızı bonusu biraz kısaltır
  record('Okçu Lv.1: HP 130, MP 67, menzil 7, saldırı ≤1,25 sn (temel 1,25 + DEX hızı); yay + başlangıç zırhı; İsabetli Ok çubukta', a1.hp === 130 && a1.mp === 67 && a1.range === 7 && a1.iv <= 1.25 && a1.iv > 1.15 && a1.eq.includes('Y01') && a1.bar.includes('aimed_shot'), JSON.stringify(a1));
  await ev(page, () => window.__AHEN.world.changeMap('forest', 'from_village'));
  await waitMap(page, 'forest');
  const arch = await ev(page, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T;
    const rat = w.spawner.spawnEnemy('meadow_rat', p.x + 5 * 32, p.y, { leashR: 9999 });
    rat.stunUntil = w.clock + 60000;
    const k0 = A.char.history.kills, mp0 = A.char.mp;
    let maxProj = 0;
    p.selectTarget(rat);
    const c0 = w.clock, t0 = performance.now();
    while (!rat.dead && w.clock - c0 < 9000 && performance.now() - t0 < 25000) { await new Promise((r) => setTimeout(r, 50)); maxProj = Math.max(maxProj, w.projectiles.filter((x) => x.alive && x.s?.texture?.key === 'fx_arrow').length); }
    const dist = Math.round(Math.hypot(rat.x - p.x, rat.y - p.y) / 32);
    // duvar: oyuncu ile hedef arasında opak karo varsa ok duvarda kalır
    let wall = null;
    const g = w.grid;
    outer: for (let y = 6; y < w.mapDef.h - 6; y++) for (let x = 6; x < w.mapDef.w - 8; x++) {
      if (!g.opaque(x, y) && g.opaque(x + 2, y) && !g.opaque(x + 4, y) && !g.isSolid?.(x, y) && !g.blockedAt((x + 0.5) * 32, (y + 0.5) * 32) && !g.blockedAt((x + 4.5) * 32, (y + 0.5) * 32)) { wall = { x, y }; break outer; }
    }
    let blocked = null;
    if (wall) {
      p.selectTarget(null); p.target = null;
      p.x = (wall.x + 0.5) * 32; p.y = (wall.y + 0.5) * 32;
      const tgt = w.spawner.spawnEnemy('meadow_rat', (wall.x + 4.5) * 32, (wall.y + 0.5) * 32, { leashR: 9999 });
      tgt.stunUntil = w.clock + 60000;
      let hit = false;
      w.combat.projectile(p, tgt, 'arrow', 680, () => { hit = true; }, { blockable: true });
      await T.sleepGame(1500);
      blocked = { hit, hp: tgt.hp === tgt.maxHp, alive: w.projectiles.filter((x) => x.alive && x.s?.texture?.key === 'fx_arrow').length };
      w.spawner.despawn(tgt);
    }
    return { killed: rat.dead, kills: A.char.history.kills - k0, maxProj, dist, mpSame: A.char.mp >= mp0 - 0.01, wall, blocked };
  });
  record('Okçu normal saldırısı görünür ok mermisiyle uzaktan öldürür (MP harcamaz)', arch.killed && arch.kills === 1 && arch.maxProj >= 1 && arch.dist >= 3 && arch.mpSame, JSON.stringify(arch));
  record('Ok duvara çarpar: arada opak karo varsa hedef hasar almaz', arch.wall && arch.blocked && !arch.blocked.hit && arch.blocked.hp && arch.blocked.alive === 0, JSON.stringify(arch.blocked));
  await page.screenshot({ path: join(shots, 'v4-archer.png') });
  const askill = await ev(page, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T;
    A.devTools.levelTo(15);
    // duvar testinden açık alana dön (hedef duvarın arkasında kalmasın)
    const en = w.mapDef.entries.from_village; p.x = (en.x + 0.5) * 32; p.y = (en.y + 0.5) * 32;
    await T.sleepGame(300);
    const e = w.spawner.spawnEnemy('gray_wolf', p.x + 3 * 32, p.y, { leashR: 9999 });
    e.stunUntil = w.clock + 60000; e.hp = e.maxHp = 5000;
    p.selectTarget(e);
    A.char.skillBar = ['aimed_shot', 'multi_shot', 'agile_step', 'piercing_arrow'];
    const out = {};
    for (let i = 0; i < 4; i++) {
      A.char.mp = 999; p.gcd = 0; p.busy = 0;
      const hp0 = e.hp;
      out[A.char.skillBar[i]] = p.useSkill(i);
      await T.sleepGame(700);
      out[A.char.skillBar[i] + '_dmg'] = hp0 - e.hp;
      if (e.dead) break;
    }
    w.spawner.despawn(e);
    return out;
  });
  record('Okçu becerileri (Lv.15): İsabetli Ok, Çoklu Atış, Çevik Adım, Delici Ok kullanılır ve hasar verir', askill.aimed_shot && askill.multi_shot && askill.agile_step && askill.piercing_arrow && askill.aimed_shot_dmg > 0 && askill.piercing_arrow_dmg > 0, JSON.stringify(askill));
  await ev(page, (sk) => { window.__AHEN_SKILLS = sk; }, { archer: ['aimed_shot', 'multi_shot', 'agile_step', 'piercing_arrow', 'arrow_rain', 'hunter_mark', 'eagle_storm'] });
  const aall = await ev(page, ALL_SKILLS, 'archer');
  record('Okçu Lv.50: 7 aktif becerinin hepsi kullanılır; hasar becerileri hasar verir (Ok Yağmuru, Kartal Fırtınası dahil)',
    Object.values(aall).every((x) => x.ok) && ['aimed_shot', 'multi_shot', 'piercing_arrow', 'arrow_rain', 'eagle_storm'].every((k) => aall[k].dmg > 0), JSON.stringify(aall));
  record('Konsol hatası yok (Okçu)', page.errors.length === 0, page.errors.slice(0, 3).join(' | '));

  // ============================================================== 2) Ölü Çağıran ve iskelet kuralları
  await ev(page, () => window.__AHEN.flushSave('t'));
  await page.reload();
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  await createChar(page, 'necromancer', 'Olucagiran', 1);
  await ev(page, HELPERS);
  const n1 = await ev(page, () => { const st = window.__AHEN.stats(); return { hp: st.maxHp, mp: st.maxMp, range: st.attackRange, iv: st.attackInterval }; });
  record('Ölü Çağıran Lv.1: HP 115, MP 162, menzil 6, saldırı ≤1,6 sn (temel 1,6 + DEX hızı)', n1.hp === 115 && n1.mp === 162 && n1.range === 6 && n1.iv <= 1.6 && n1.iv > 1.5, JSON.stringify(n1));
  await ev(page, () => window.__AHEN.world.changeMap('forest', 'from_village'));
  await waitMap(page, 'forest');
  const sk = await ev(page, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T, ch = A.char;
    // Ruh Mermisi MP harcamaz
    const r0 = w.spawner.spawnEnemy('meadow_rat', p.x + 4 * 32, p.y, { leashR: 9999 }); r0.stunUntil = w.clock + 60000;
    const mp0 = ch.mp; p.selectTarget(r0);
    await T.sleepGame(4000);
    const soul = { killed: r0.dead, mpSame: ch.mp >= mp0 - 0.01 };
    if (!r0.dead) w.spawner.despawn(r0);
    p.selectTarget(null); p.target = null;
    A.devTools.levelTo(12);
    await T.sleepGame(300);
    const slot = ch.skillBar.indexOf('summon_skeleton');
    ch.mp = 999; p.gcd = 0; p.busy = 0;
    const ok = p.useSkill(slot);
    await T.sleepGame(900);
    const alive1 = w.minions.alive.length;
    // AFK yok: hedef seçilmeden iskelet yakındaki yaratığa saldırmaz
    const a = w.spawner.spawnEnemy('meadow_rat', p.x + 2.5 * 32, p.y, { leashR: 9999 });
    const b = w.spawner.spawnEnemy('meadow_rat', p.x - 2.5 * 32, p.y + 32, { leashR: 9999 });
    for (const e of [a, b]) { e.stunUntil = w.clock + 60000; e.hp = e.maxHp = 400; }
    const hits = [];
    const orig = w.combat.minionHit.bind(w.combat);
    w.combat.minionHit = (t, m) => { hits.push(t.uid); return orig(t, m); };
    await T.sleepGame(3000);
    const afk = { a: a.hp === a.maxHp, b: b.hp === b.maxHp, hits: hits.length };
    // yalnız seçili hedef; oyuncunun kendi saldırısı kapalıyken iskelet öldürür → tek öldürme, tek ödül
    const origPN = w.combat.playerNormalHit; w.combat.playerNormalHit = () => {};
    p.selectTarget(a);
    a.hp = 30;
    A.devTools.accept('g01n');
    const k0 = ch.history.kills, g0 = ch.gold;
    await T.sleepGame(5000);
    w.combat.playerNormalHit = origPN;
    const only = { aDead: a.dead, bFull: b.hp === b.maxHp, onlyA: hits.every((u) => u === a.uid), kills: ch.history.kills - k0, gold: ch.gold - g0 };
    w.combat.minionHit = orig;
    w.spawner.despawn(b);
    // en çok 2 iskelet
    for (let i = 0; i < 4; i++) w.minions.summonTemp(10);
    const max2 = w.minions.alive.length;
    for (const m of w.minions.alive.filter((m) => m.temp)) m.vanish(true);
    await T.sleepGame(300);
    w.minions.persist();
    return { soul, ok, alive1, afk, only, max2, saved: JSON.parse(JSON.stringify(ch.minion)) };
  });
  record('Ruh Mermisi MP harcamadan öldürür', sk.soul.killed && sk.soul.mpSame, JSON.stringify(sk.soul));
  record('İskelet Çağır (Lv.12) bir iskelet çağırır; hedef seçilmeden saldırmaz (AFK farm yok)', sk.ok && sk.alive1 === 1 && sk.afk.a && sk.afk.b && sk.afk.hits === 0, JSON.stringify(sk));
  record('İskelet yalnız seçili hedefe saldırır; iskeletin öldürdüğü yaratık tek öldürme / tek ödül sayılır', sk.only.aDead && sk.only.bFull && sk.only.onlyA && sk.only.kills === 1 && sk.only.gold > 0, JSON.stringify(sk.only));
  record('Aynı anda en çok 2 iskelet; kayıtta yalnız güvenli durum ({ana iskelet, can oranı})', sk.max2 === 2 && sk.saved && sk.saved.main === true && Object.keys(sk.saved).sort().join() === 'hpPct,main', JSON.stringify(sk));
  await ev(page, () => window.__AHEN.world.changeMap('village', 'from_forest'));
  await waitMap(page, 'village');
  const sk2 = await ev(page, async () => {
    const A = window.__AHEN, w = A.world, T = window.__T, ch = A.char;
    await T.sleepGame(1500);
    const afterMap = w.minions.alive.length;
    await A.flushSave('t');
    // ölüm: iskeletler dağılır, ölümden sonra kendiliğinden geri gelmez
    ch.hp = 1; w.combat.damagePlayerRaw(50);
    await new Promise((r) => setTimeout(r, 1300));
    const dead = { alive: w.minions.alive.length, saved: ch.minion };
    while (window.__AHEN_UI.layers.modal.firstChild) window.__AHEN_UI.closeModal();
    w.respawn();
    await T.sleepGame(800);
    return { afterMap, dead, afterRespawn: w.minions.alive.length };
  });
  record('Harita değişiminde iskelet çoğalmaz (1); ölümde dağılır ve kendiliğinden geri gelmez', sk2.afterMap === 1 && sk2.dead.alive === 0 && !sk2.dead.saved && sk2.afterRespawn === 0, JSON.stringify(sk2));
  // kapat-aç: iskelet bir kez geri gelir
  await ev(page, async () => { const A = window.__AHEN, w = A.world, p = w.player; A.char.mp = 999; p.gcd = 0; p.busy = 0; p.useSkill(A.char.skillBar.indexOf('summon_skeleton')); await window.__T.sleepGame(800); w.minions.persist(); await A.flushSave('t'); });
  await page.reload();
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  await closeModals(page);
  await page.tap('[data-testid=menu-play]'); await page.waitForTimeout(300);
  await page.tap('[data-testid=slot-1]'); await page.waitForTimeout(200);
  await page.tap('[data-testid=enter-world]');
  await page.waitForFunction(() => window.__AHEN?.world?.player && !window.__AHEN.world.changing, null, { timeout: 25000 });
  await page.waitForTimeout(1500);
  const sk3 = await ev(page, () => ({ alive: window.__AHEN.world.minions.alive.length, cls: window.__AHEN.char.cls }));
  record('Kapat-aç: kayıtlı iskelet bir kez geri gelir (çoğalmaz)', sk3.alive === 1 && sk3.cls === 'necromancer', JSON.stringify(sk3));
  await page.screenshot({ path: join(shots, 'v4-necro.png') });
  if (!await ev(page, () => !!window.__T)) await ev(page, HELPERS);   // kapat-aç sonrası yardımcılar yeniden kurulur
  await ev(page, (sk) => { window.__AHEN_SKILLS = sk; }, { necromancer: ['soul_arrow', 'summon_skeleton', 'curse_seal', 'life_drain', 'bone_burst', 'army_of_dead', 'soul_apocalypse'] });
  const nall = await ev(page, ALL_SKILLS, 'necromancer');
  const nmin = await ev(page, () => window.__AHEN.world.minions.alive.length);
  record('Ölü Çağıran Lv.50: 7 aktif becerinin hepsi kullanılır; hasar becerileri hasar verir; Ölüler Ordusu sonrası en çok 2 iskelet',
    Object.values(nall).every((x) => x.ok) && ['soul_arrow', 'life_drain', 'bone_burst', 'soul_apocalypse'].every((k) => nall[k].dmg > 0) && nmin <= 2, JSON.stringify({ nall, nmin }));
  record('Konsol hatası yok (Ölü Çağıran)', page.errors.length === 0, page.errors.slice(0, 3).join(' | '));
  await c1.close();

  // ============================================================== 3) Kara Taht → Gökyarık Ovası, yaratıklar, elit, Fırtına Tiranı
  const { ctx: c2, page: pw } = await newPage();
  await createChar(pw, 'warrior', 'Gokyarikci');
  await ev(pw, HELPERS);
  await ev(pw, (done) => { const a = window.__AHEN; a.devTools.levelTo(40); for (const id of done) a.char.quests[id] = { s: 'done', p: [], used: [] }; a.char.mastery = true; a.char.mastery2 = true; a.char.world.flags.black_gate_open = true; a.world.changeMap('black_throne', 'from_dead'); }, DONE_V3);
  await waitMap(pw, 'black_throne');
  const gate = await ev(pw, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T;
    const pt = w.objects.find((o) => o.o?.id === 'bt_to_rift');
    const locked = pt.locked();
    pt.trigger();
    const acc = A.devTools.accept('m47');
    const q = w.objects.find((o) => o.o?.id === 'rift_gate');
    p.x = q.x; p.y = q.y + 20;
    q.interact(p);
    T.finishChannel();
    await T.sleepGame(200);
    return { locked, stayed: w.mapId === 'black_throne', acc: acc.ok, flag: !!A.char.world.flags.sky_rift_open, lockedAfter: pt.locked(), m47: A.char.quests.m47?.p?.[0] };
  });
  record('Kara Taht kuzey geçidi m47 olmadan kapalı; yarık incelenince bayrak açılır', gate.locked && gate.stayed && gate.acc && gate.flag && !gate.lockedAfter && gate.m47 === 1, JSON.stringify(gate));
  await ev(pw, () => window.__AHEN.world.objects.find((o) => o.o?.id === 'bt_to_rift').trigger());
  await waitMap(pw, 'sky_rift');
  const rift = await ev(pw, async () => {
    const A = window.__AHEN, w = A.world;
    await window.__T.sleepGame(600);
    const ids = [...new Set(w.enemies.filter((e) => !e.dead).map((e) => e.tpl.id))].sort();
    const npcs = w.objects.filter((o) => o.kind === 'npc').map((o) => o.npc.id);
    return { ids, npcs, flakes: w.flakes?.length || 0, chests: w.objects.filter((o) => o.kind === 'chest').length, gather: w.objects.filter((o) => o.kind === 'gather').length, ws: w.objects.some((o) => o.kind === 'waystone'), theme: w.mapDef.theme };
  });
  record('Gökyarık Ovası: 4 yaratık türü + Fırtına Tiranı; Atlas, yol taşı, 2 sandık, toplama düğümleri, fırtına parçacıkları',
    ['storm_hound', 'rift_wing', 'lightning_raider', 'thunder_golem', 'storm_tyrant'].every((x) => rift.ids.includes(x)) && rift.npcs.includes('atlas') && rift.ws && rift.chests === 2 && rift.gather >= 13 && rift.flakes > 0, JSON.stringify(rift));
  await pw.screenshot({ path: join(shots, 'v4-sky-rift.png') });
  const abil = await ev(pw, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T, ch = A.char;
    const out = {};
    for (const id of ['storm_hound', 'rift_wing', 'storm_executioner', 'void_warden', 'star_oracle']) {
      const dist = id === 'storm_hound' || id === 'rift_wing' || id === 'star_oracle' ? 4.5 : 2;
      const e = w.spawner.spawnEnemy(id, p.x + dist * 32, p.y, { leashR: 9999 });
      e.abilityCd = 0.2; e.aggro(p);
      let seen = false;
      const c0 = w.clock, t0 = performance.now();
      while (w.clock - c0 < 8000 && performance.now() - t0 < 25000) { await new Promise((r) => setTimeout(r, 50)); ch.hp = ch.maxHp || 99999; if (e.casting) { seen = true; break; } }
      out[id] = seen;
      w.spawner.despawn(e);
      await T.sleepGame(200);
    }
    return out;
  });
  record('V4 yetenekleri telegrafla başlar: Fırtına Sıçrayışı, Yarık Pençesi, Yıldız Düşüşü; Fırtına Celladı ve Hiçlik Muhafızı', Object.values(abil).every(Boolean), JSON.stringify(abil));
  const tyr = await ev(pw, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T, ch = A.char;
    A.devTools.levelTo(45);
    const g = w.enemies.find((e) => e.tpl.id === 'storm_tyrant' && !e.dead);
    p.x = g.x - 80; p.y = g.y + 40; g.aggro(p);
    let cast = false;
    const c0 = w.clock, t0 = performance.now();
    while (w.clock - c0 < 6000 && performance.now() - t0 < 20000) { await new Promise((r) => setTimeout(r, 100)); ch.hp = Math.max(ch.hp, 20000); if (g.casting) cast = true; }
    g.hp = g.maxHp * 0.59;
    await T.sleepGame(1200);
    const crystals = w.enemies.filter((e) => !e.dead && e.tpl.id === 'tyrant_crystal');
    const shield = g.reduce;
    for (const c of crystals) T.kill(c);
    await T.sleepGame(500);
    const crack = { reduce: g.reduce, def: g.def, base: g.tpl.def };
    g.hp = g.maxHp * 0.24;
    await T.sleepGame(1500);
    const fury = g.behavior.fury;
    const core0 = ch.bag.slots.reduce((n, s) => n + (s?.tid === 'tyrant_core' ? s.q : 0), 0);
    T.kill(g);
    await T.sleepGame(500);
    const core1 = ch.bag.slots.reduce((n, s) => n + (s?.tid === 'tyrant_core' ? s.q : 0), 0);
    return { cast, crystals: crystals.length, shield, crack, fury, core: core1 - core0, dead: g.dead, left: w.enemies.filter((e) => !e.dead && e.tpl.id === 'tyrant_crystal').length };
  });
  record('Fırtına Tiranı: telegraflı saldırılar; %60 altı Kristal Çağrısı (2 kristal, hasar azaltma)', tyr.cast && tyr.crystals === 2 && tyr.shield > 0.4, JSON.stringify(tyr));
  record('Kristaller kırılınca kalkan söner ve savunma düşer; %25 altı Son Gök Gürültüsü; garantili Tiran Çekirdeği', tyr.crack.reduce === 0 && tyr.crack.def < tyr.crack.base && tyr.fury && tyr.core >= 1 && tyr.dead && tyr.left === 0, JSON.stringify(tyr));
  record('Konsol hatası yok (Gökyarık turu)', pw.errors.length === 0, pw.errors.slice(0, 3).join(' | '));

  // ============================================================== 4) Yıldız Mezarı → Gökyarık Mabedi → Göğün Mahkûmu
  await ev(pw, () => { const a = window.__AHEN; a.devTools.levelTo(49); for (const id of ['m47', 'm48', 'm49', 'm50', 'm51', 'm52']) a.char.quests[id] = { s: 'done', p: [], used: [] }; });
  const veil = await ev(pw, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T;
    const pt = w.objects.find((o) => o.o?.id === 'sr_to_star');
    const locked = pt.locked();
    A.devTools.accept('m53');
    const q = w.objects.find((o) => o.o?.id === 'star_veil');
    p.x = q.x; p.y = q.y + 20; q.interact(p); T.finishChannel();
    await T.sleepGame(200);
    return { locked, open: !pt.locked(), flag: !!A.char.world.flags.star_grave_open };
  });
  record('Yıldız Mezarı geçidi m53 ile açılır', veil.locked && veil.open && veil.flag, JSON.stringify(veil));
  await ev(pw, () => window.__AHEN.world.objects.find((o) => o.o?.id === 'sr_to_star').trigger());
  await waitMap(pw, 'star_grave');
  const star = await ev(pw, async () => {
    const A = window.__AHEN, w = A.world, T = window.__T;
    await T.sleepGame(600);
    const ids = [...new Set(w.enemies.filter((e) => !e.dead).map((e) => e.tpl.id))].sort();
    const npcs = w.objects.filter((o) => o.kind === 'npc').map((o) => o.npc.id);
    const gate = w.objects.find((o) => o.kind === 'gate');
    T.toasts.length = 0; gate.interact(w.player);
    return { ids, npcs, m53: A.char.quests.m53?.p, gateMsg: T.toasts.slice(-1)[0], lenses: w.objects.filter((o) => o.o?.group === 'star_lens').length };
  });
  record('Yıldız Mezarı: 4 yaratık türü; Leyla ve Tufan; 3 gözlem merceği; m53 ulaşma hedefi tamamlanır',
    ['star_parasite', 'astral_hunter', 'void_armor', 'star_oracle'].every((x) => star.ids.includes(x)) && star.npcs.includes('leyla') && star.npcs.includes('tufan') && star.lenses === 3 && star.m53?.[1] === 1, JSON.stringify(star));
  record('Gökyarık Mabedi kapısı "Mabet Mühürleri" olmadan mühürlü', /mühürlü/i.test(star.gateMsg || ''), star.gateMsg);
  await pw.screenshot({ path: join(shots, 'v4-star-grave.png') });
  const seal = await ev(pw, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T;
    for (const id of ['m53', 'm54', 'm55']) A.char.quests[id] = { s: 'done', p: [], used: [] };
    A.devTools.accept('m56');
    const seals = w.objects.filter((o) => o.o?.group === 'sanctum_entry_seal').sort((a, b) => a.o.order - b.o.order);
    T.toasts.length = 0;
    p.x = seals[2].x; p.y = seals[2].y + 20; seals[2].interact(p);
    const wrong = T.toasts.slice(-1)[0];
    for (const s of seals) { p.x = s.x; p.y = s.y + 20; s.interact(p); T.finishChannel(); await T.sleepGame(100); }
    const gate = w.objects.find((o) => o.kind === 'gate');
    p.x = gate.x; p.y = gate.y + 30; gate.interact(p); T.finishChannel();
    await T.sleepGame(300);
    return { wrong, p: A.char.quests.m56?.p, unlocked: !!A.char.world.flags.unlocked_astral_sanctum };
  });
  record('Mabet giriş mühürleri sırayla: yanlış sırada ipucu verir; doğru sırada kapı açılır', /doğudan/i.test(seal.wrong || '') && seal.p?.[0] === 3 && seal.unlocked, JSON.stringify(seal));
  await ev(pw, () => { const w = window.__AHEN.world; w.changeMap('astral_sanctum', 'entrance', { enterDungeon: true }); });
  await waitMap(pw, 'astral_sanctum');
  const sanc = await ev(pw, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T, ch = A.char;
    await T.sleepGame(600);
    const run = () => ch.runs.astral_sanctum;
    const killStage = async (s) => { for (const e of w.enemies.filter((e) => !e.dead && e.stage === s)) T.kill(e); await T.sleepGame(400); };
    const useSeal = async (id) => { const o = w.objects.find((x) => x.o?.id === id); p.x = o.x; p.y = o.y + 24; o.interact(p); T.finishChannel(); await T.sleepGame(300); };
    const out = { stages0: Object.keys(w.mapDef.stages).length };
    // 1: kapı mührü + temizle
    await killStage(1);
    out.s1before = run().cleared.includes(1);
    await useSeal('gate_seal');
    out.s1 = run().cleared.includes(1);
    // 2: yanıltıcı düğüm zararsız ipucu, sonra iki gerçek düğüm
    await killStage(2);
    T.toasts.length = 0;
    await useSeal('node_x');
    out.decoy = { hint: T.toasts.slice(-1)[0], counted: run().seals.includes('node_x'), cleared: run().cleared.includes(2) };
    await useSeal('node_a'); await useSeal('node_b');
    out.s2 = run().cleared.includes(2);
    // 3: koridor savaşları
    await killStage(3);
    out.s3 = run().cleared.includes(3);
    // 4: üç mühür, her biri iki dalga
    await killStage(4);
    const waves = [];
    for (const id of ['sky_seal_a', 'sky_seal_b', 'sky_seal_c']) {
      await useSeal(id);
      const w1 = w.enemies.filter((e) => !e.dead && e.sealId === id).length;
      for (const e of w.enemies.filter((e) => !e.dead && e.sealId === id)) T.kill(e);
      await T.sleepGame(500);
      const w2 = w.enemies.filter((e) => !e.dead && e.sealId === id).length;
      const brokenAfter1 = run().seals.includes(id);
      for (const e of w.enemies.filter((e) => !e.dead && e.sealId === id)) T.kill(e);
      await T.sleepGame(500);
      waves.push({ id, w1, w2, brokenAfter1, broken: run().seals.includes(id) });
    }
    out.waves = waves;
    out.s4 = run().cleared.includes(4);
    return out;
  });
  record('Mabet 1–3: kapı mührü bölümü açar; koridor savaşları; kontrol noktaları', sanc.stages0 === 5 && !sanc.s1before && sanc.s1 && sanc.s2 && sanc.s3, JSON.stringify(sanc));
  record('Yanıltıcı enerji düğümü zararsız ipucu verir ve sayılmaz', /sönük|kabuk|çatlak/i.test(sanc.decoy.hint || '') && !sanc.decoy.counted && !sanc.decoy.cleared, JSON.stringify(sanc.decoy));
  record('Gök Mühürleri: her mühür iki savunma dalgası; ikinci dalga bitince kırılır; boss kapısı açılır', sanc.waves.every((x) => x.w1 > 0 && x.w2 > 0 && !x.brokenAfter1 && x.broken) && sanc.s4, JSON.stringify(sanc.waves));
  await pw.screenshot({ path: join(shots, 'v4-sanctum.png') });
  const pris = await ev(pw, async () => {
    const A = window.__AHEN, w = A.world, p = w.player, T = window.__T, ch = A.char;
    A.devTools.levelTo(50);
    const g = w.enemies.find((e) => e.tpl.id === 'sky_prisoner' && !e.dead);
    p.x = g.x - 80; p.y = g.y + 40; g.aggro(p);
    let cast = false;
    const c0 = w.clock, t0 = performance.now();
    while (w.clock - c0 < 6000 && performance.now() - t0 < 20000) { await new Promise((r) => setTimeout(r, 100)); ch.hp = Math.max(ch.hp, 20000); if (g.casting) cast = true; }
    g.hp = g.maxHp * 0.64;
    await T.sleepGame(1200);
    const seals = w.enemies.filter((e) => !e.dead && e.tpl.id === 'sky_seal');
    const shielded = g.reduce > 0.5;
    for (const s of seals) T.kill(s);
    await T.sleepGame(500);
    const shieldAfter = g.reduce;
    g.hp = g.maxHp * 0.29;
    let maxZones = 0;
    const c2 = w.clock, t2 = performance.now();
    while (w.clock - c2 < 8000 && performance.now() - t2 < 30000) { await new Promise((r) => setTimeout(r, 100)); ch.hp = Math.max(ch.hp, 20000); maxZones = Math.max(maxZones, w.combat.hazards.filter((h) => h.label === 'Yıldız Alanı').length); }
    const fury = g.behavior.fury;
    // ölüm: boss tam cana döner, kalkan sıfırlanır, bölümler korunur (kontrol noktası)
    ch.hp = 1; w.combat.damagePlayerRaw(50);
    await new Promise((r) => setTimeout(r, 1300));
    while (window.__AHEN_UI.layers.modal.firstChild) window.__AHEN_UI.closeModal();
    w.respawn();
    await T.sleepGame(500);
    const reset = { full: g.hp === g.maxHp, shield: g.reduce, cleared: ch.runs.astral_sanctum.cleared.slice(), x: Math.round(p.x / 32), y: Math.round(p.y / 32), seals: w.enemies.filter((e) => !e.dead && e.tpl.id === 'sky_seal').length };
    p.x = g.x - 80; p.y = g.y + 40;
    const chain0 = ch.bag.slots.reduce((n, s) => n + (s?.tid === 'prisoner_chain' ? s.q : 0), 0);
    T.kill(g);
    await T.sleepGame(500);
    const chain1 = ch.bag.slots.reduce((n, s) => n + (s?.tid === 'prisoner_chain' ? s.q : 0), 0);
    const run = ch.runs.astral_sanctum;
    const e2 = w.spawner.spawnEnemy('sky_prisoner', p.x + 60, p.y, { stage: 5 });
    const gold0 = ch.gold;
    T.kill(e2);
    await T.sleepGame(300);
    return { cast, seals: seals.length, shielded, shieldAfter, fury, maxZones, reset, chain: chain1 - chain0, claimed: run.bossLootClaimed, cleared5: run.cleared.includes(5), dupGold: ch.gold - gold0, hist: ch.history.dungeons?.astral_sanctum };
  });
  record('Göğün Mahkûmu I–II: telegraflı saldırılar; %65 altı kalkan + 2 Gök Mührü; mühürler kırılınca kalkan düşer', pris.cast && pris.seals === 2 && pris.shielded && pris.shieldAfter === 0, JSON.stringify(pris));
  record('Göğün Mahkûmu III (%30): Yıldızların Sonu, en çok 4 yıldız alanı', pris.fury && pris.maxZones <= 4, JSON.stringify(pris));
  record('Mabette ölüm: Mahkûm tam cana döner, kalkan/mühürler sıfırlanır, bölümler korunur (kontrol noktası)', pris.reset.full && pris.reset.shield === 0 && pris.reset.seals === 0 && pris.reset.cleared.join() === '1,2,3,4' && pris.reset.x > 60, JSON.stringify(pris.reset));
  record('Göğün Mahkûmu yenilir: garantili Mahkûmun Zinciri, koşu başına tek ödül', pris.chain >= 1 && pris.claimed && pris.cleared5 && pris.dupGold === 0, JSON.stringify(pris));
  record('Konsol hatası yok (Yıldız Mezarı / Mabet)', pw.errors.length === 0, pw.errors.slice(0, 3).join(' | '));
  await c2.close();

  // ============================================================== 5) Mobil arayüz, Kayıt Güvenliği, V4 hatırlatması
  {
    const { ctx, page: pm } = await newPage(640, 360);
    await createChar(pm, 'necromancer', 'Mobilci');
    await ev(pm, HELPERS);
    await ev(pm, async () => { const A = window.__AHEN, p = A.world.player; A.devTools.levelTo(12); await window.__T.sleepGame(300); A.char.mp = 999; p.gcd = 0; p.busy = 0; p.useSkill(A.char.skillBar.indexOf('summon_skeleton')); await window.__T.sleepGame(800); });
    const hud = await ev(pm, () => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
      return { minion: r('[data-testid=minion-hud]'), vw: innerWidth, vh: innerHeight, overflowX: document.documentElement.scrollWidth > innerWidth };
    });
    await pm.screenshot({ path: join(shots, 'v4-mobile-hud.png') });
    record('Mobil (640×360): iskelet HUD ekranda; yatay taşma yok', hud.minion && hud.minion.x >= 0 && hud.minion.x + hud.minion.w <= hud.vw && hud.minion.y + hud.minion.h <= hud.vh && !hud.overflowX, JSON.stringify(hud));
    await ev(pm, () => window.__AHEN_OPEN('settings'));
    await pm.waitForTimeout(500);
    const safety = await ev(pm, () => { const e = document.querySelector('[data-testid=save-safety]'); return e ? { text: e.textContent.slice(0, 400), buttons: e.querySelectorAll('button').length } : null; });
    await pm.screenshot({ path: join(shots, 'v4-save-safety.png') });
    record('Ayarlar → Kayıt Güvenliği: son kalıcı kayıt, teknoloji, dışa/içe aktarma ve önceki kayıtlar', safety && /IndexedDB|localStorage/i.test(safety.text) && /Son kalıcı kayıt|kalıcı/i.test(safety.text) && safety.buttons >= 4, JSON.stringify(safety));
    await ev(pm, () => window.__AHEN_CLOSE());
    // V4 yedek hatırlatması: bildirimi olmayan (eski) profil ana menüde bir kez görür
    await ev(pm, async () => { const A = window.__AHEN; delete A.profile.notices.v4backup; await A.flushSave('t'); });
    await pm.reload();
    await pm.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
    await pm.waitForTimeout(800);
    const n1 = !!await pm.$('[data-testid=v4-notice]');
    if (n1) await pm.tap('[data-testid=v4-later]');
    await pm.waitForTimeout(500);
    await ev(pm, () => window.__AHEN.flushSave('t'));
    await pm.reload();
    await pm.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
    await pm.waitForTimeout(800);
    const n2 = !!await pm.$('[data-testid=v4-notice]');
    record('V4 yedek hatırlatması bir kez gösterilir ("Daha sonra" sonrası tekrar çıkmaz)', n1 && !n2, JSON.stringify({ n1, n2 }));
    record('Konsol hatası yok (mobil)', pm.errors.length === 0, pm.errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ============================================================== 6) PWA önbelleği
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    const pg = await ctx.newPage();
    await pg.goto(BASE);
    await pg.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
    const sw = await pg.evaluate(async () => {
      const r = await navigator.serviceWorker.ready;
      const txt = await (await fetch('sw.js')).text();
      return { active: !!r.active, version: (txt.match(/oyun sürümü ([\d.]+)/) || [])[1] || null };
    });
    await pg.waitForTimeout(1500);
    await ctx.setOffline(true);
    await pg.reload();
    let offline = false;
    try { await pg.waitForSelector('[data-testid=menu-play]', { timeout: 30000 }); offline = true; } catch { /* */ }
    record(`PWA: servis işçisi etkin, ${PKG.version} sürümlü önbellek; çevrimdışı açılış`, sw.active && offline && sw.version === PKG.version, JSON.stringify({ ...sw, offline }));
    await ctx.close();
  }
} catch (e) {
  record('Beklenmeyen test hatası', false, e.stack + ' | sayfa: ' + (globalThis.__lastPage?.errors || []).slice(0, 3).join(' | '));
} finally {
  await browser.close();
  server.kill();
  const passed = results.filter((r) => r.ok).length;
  writeFileSync(join(here, 'report-v4.json'), JSON.stringify({ date: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  console.log(`\nE2E V4: ${passed}/${results.length} geçti`);
  process.exit(passed === results.length ? 0 : 1);
}
