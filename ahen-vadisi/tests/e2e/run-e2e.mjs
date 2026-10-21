// Tarayıcı otomasyonu ile uçtan uca testler (Playwright + Chromium, mobil dokunmatik emülasyonu).
// Kullanım: npm run build && npm run test:e2e
// Not: Headless Chromium yazılımsal WebGL (SwiftShader) kullanır; FPS değerleri gerçek telefondan düşüktür.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shots = join(here, 'screens');
mkdirSync(shots, { recursive: true });
const PORT = 4173;
const BASE = `http://localhost:${PORT}/`;
const results = [];
const record = (name, ok, info = '') => { results.push({ name, ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res) => { server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) res(); }); setTimeout(res, 6000); });

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

async function newPage(w, h, dev = true) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(BASE + (dev ? '?dev=1' : ''));
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  return { ctx, page };
}

async function createChar(page, cls, name) {
  await page.tap('[data-testid=menu-play]');
  await page.waitForTimeout(250);
  const create = await page.$('[data-testid=create-char]');
  if (!create) { // ilk boş yuvayı seç
    for (let i = 0; i < 3; i++) {
      await page.tap(`[data-testid=slot-${i}]`);
      if (await page.$('[data-testid=create-char]')) break;
    }
  }
  await page.tap('[data-testid=create-char]');
  await page.tap(`[data-testid=class-${cls}]`);
  await page.fill('[data-testid=name-input]', name);
  await page.tap('[data-testid=create-confirm]');
  await page.waitForFunction(() => window.__AHEN?.world?.player, null, { timeout: 20000 });
  await page.waitForTimeout(800);
}

const ev = (page, fn, arg) => page.evaluate(fn, arg);
const waitMap = (page, id) => page.waitForFunction((id) => window.__AHEN.world?.mapId === id && window.__AHEN.world.player && !window.__AHEN.world.changing, id, { timeout: 20000 }).then(() => page.waitForTimeout(700));

// Yuvarlak aksiyon butonları (border-radius: 50%) daire olarak, diğerleri dikdörtgen olarak sınanır
function overlap(a, b) {
  const round = (x) => x.s === '.act' || x.s === '.joy';
  if (round(a) && round(b)) {
    const d = Math.hypot((a.left + a.right) / 2 - (b.left + b.right) / 2, (a.top + a.bottom) / 2 - (b.top + b.bottom) / 2);
    return d < (a.w + b.w) / 2 - 1;
  }
  return !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
}

try {
  // ------------------------------------------------------------------ 1) Mobil arayüz: 16:9, 19.5:9, 20:9
  for (const [w, h, label] of [[640, 360, '16:9'], [780, 360, '19.5:9'], [800, 360, '20:9'], [844, 390, '19.5:9 (iPhone 14)'], [915, 412, '20:9 (Android)']]) {
    const { ctx, page } = await newPage(w, h);
    await createChar(page, 'warrior', `Ui${w}`);
    const boxes = await page.evaluate(() => {
      const q = (s) => [...document.querySelectorAll(s)].filter((e) => e.offsetParent !== null).map((e) => { const r = e.getBoundingClientRect(); return { s, left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height }; });
      return [...q('.joy'), ...q('.act'), ...q('.ibtn'), ...q('.mm'), ...q('.hud-tl .vit'), ...q('.tracker')];
    });
    const off = boxes.filter((b) => b.left < 0 || b.top < 0 || b.right > w + 0.5 || b.bottom > h + 0.5);
    const small = boxes.filter((b) => (b.s === '.act' || b.s === '.ibtn') && Math.min(b.w, b.h) < 44);
    const interactive = boxes.filter((b) => ['.joy', '.act', '.ibtn', '.mm'].includes(b.s));
    const overlaps = [];
    for (let i = 0; i < interactive.length; i++) for (let j = i + 1; j < interactive.length; j++) if (overlap(interactive[i], interactive[j])) overlaps.push(`${interactive[i].s}×${interactive[j].s}`);
    await page.screenshot({ path: join(shots, `hud-${w}x${h}.png`) });
    record(`HUD ${label} ${w}×${h}: ekran içinde`, off.length === 0, off.map((o) => o.s).join(','));
    record(`HUD ${label} ${w}×${h}: dokunma hedefleri ≥44px`, small.length === 0, small.map((o) => `${o.s} ${o.w}`).join(','));
    record(`HUD ${label} ${w}×${h}: buton çakışması yok`, overlaps.length === 0, overlaps.join(', '));
    // panel açılıp ekrana sığıyor mu
    await page.tap('[data-testid=btn-inventory]');
    await page.waitForTimeout(300);
    const pan = await page.evaluate(() => { const r = document.querySelector('.panel').getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; });
    await page.screenshot({ path: join(shots, `inventory-${w}x${h}.png`) });
    record(`Envanter paneli ${w}×${h} ekrana sığar`, pan.l >= 0 && pan.t >= 0 && pan.r <= w && pan.b <= h);
    record(`Konsol hatası yok (${w}×${h})`, page.errors.length === 0, page.errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ------------------------------------------------------------------ 2) Dikey ekran uyarısı
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    const vis = await page.evaluate(() => getComputedStyle(document.getElementById('rotate')).display !== 'none');
    await page.screenshot({ path: join(shots, 'portrait.png') });
    record('Dikey ekranda "telefonu yatay çevir" ekranı', vis);
    await ctx.close();
  }

  // ------------------------------------------------------------------ 3) Kontrol: dokun → yaklaş → saldır; joystick yaklaşmayı anında keser
  const { ctx: c3, page } = await newPage(844, 390);
  await createChar(page, 'warrior', 'Kontrolcü');
  await ev(page, () => window.__AHEN.world.changeMap('forest', 'from_village'));
  await waitMap(page, 'forest');
  // en yakın sıçanın yakınına konumlan ve onu ekranda bul
  const ratScreen = await ev(page, () => {
    const w = window.__AHEN.world;
    const rats = w.enemies.filter((e) => !e.dead && e.tpl.id === 'meadow_rat');
    const r = rats[0];
    w.player.x = r.x - 150; w.player.y = r.y;
    for (const o of rats.slice(1)) { o.x += 400; o.home.x += 400; }
    r.state = 'idle';
    return true;
  });
  await page.waitForTimeout(600);
  const pos = await ev(page, () => {
    const w = window.__AHEN.world, cam = w.cameras.main;
    const r = w.enemies.filter((e) => !e.dead && e.tpl.id === 'meadow_rat').sort((a, b) => Math.hypot(a.x - w.player.x, a.y - w.player.y) - Math.hypot(b.x - w.player.x, b.y - w.player.y))[0];
    window.__T = r;
    return { x: (r.x - cam.worldView.x) * cam.zoom, y: (r.y - r.height / 2 - cam.worldView.y) * cam.zoom };
  });
  void ratScreen;
  await page.touchscreen.tap(pos.x, pos.y);
  await page.waitForTimeout(150);
  const afterTap = await ev(page, () => ({ target: window.__AHEN.world.player.target === window.__T, approaching: window.__AHEN.world.player.approaching }));
  record('Düşmana dokun → hedef seçilir ve yaklaşma başlar', afterTap.target && afterTap.approaching, JSON.stringify(afterTap));
  // joystick sürükle
  const joy = await page.$('[data-testid=joystick]');
  const jb = await joy.boundingBox();
  const cdp = await c3.newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 7 }] });
  await touch('touchStart', jb.x + jb.width / 2, jb.y + jb.height / 2);
  await touch('touchMove', jb.x + jb.width / 2 - 40, jb.y + jb.height / 2);
  // bir sonraki birkaç karede yaklaşma iptal edilmiş olmalı
  const cancelFrames = await ev(page, async () => {
    for (let f = 0; f < 6; f++) {
      await new Promise((r) => requestAnimationFrame(r));
      if (!window.__AHEN.world.player.approaching) return f + 1;
    }
    return -1;
  });
  record('Joystick hareketi otomatik yaklaşmayı keser (≤ 2 kare)', cancelFrames > 0 && cancelFrames <= 2, `${cancelFrames}. karede`);
  await page.waitForTimeout(400);
  await touch('touchEnd', 0, 0);
  await page.waitForTimeout(800);
  const afterRelease = await ev(page, () => ({ approaching: window.__AHEN.world.player.approaching, target: window.__AHEN.world.player.target === window.__T }));
  record('Joystick bırakılınca yaklaşma kendiliğinden başlamaz; hedef korunur', !afterRelease.approaching && afterRelease.target, JSON.stringify(afterRelease));
  // tekrar dokun → yaklaş → otomatik saldırı ile öldür
  // sıçan dolaşıp HUD'un (joystick bölgesi vb.) altına girmiş olabilir: oyuncunun yanına, açık alana al
  const pos2 = await ev(page, async () => {
    const w = window.__AHEN.world, cam = w.cameras.main, r = window.__T, p = w.player;
    for (const [dx, dy] of [[64, 0], [-64, 0], [0, -64], [0, 64], [64, -64]]) if (!w.grid.blockedAt(p.x + dx, p.y + dy)) { r.x = p.x + dx; r.y = p.y + dy; break; }
    r.state = 'idle'; r.wanderGoal = null; r.wanderTimer = 99; r.sync?.();
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    return { x: (r.x - cam.worldView.x) * cam.zoom, y: (r.y - r.height / 2 - cam.worldView.y) * cam.zoom };
  });
  await page.touchscreen.tap(pos2.x, pos2.y);
  const killed = await ev(page, async () => {
    const t0 = performance.now();
    while (performance.now() - t0 < 12000) { if (window.__T.dead) return (performance.now() - t0) / 1000; await new Promise((r) => setTimeout(r, 100)); }
    return -1;
  });
  record('Menzile girince normal saldırı otomatik sürer ve hedef ölür', killed > 0, `${killed.toFixed?.(1)} sn`);
  const afterKill = await ev(page, () => ({ target: window.__AHEN.world.player.target, approaching: window.__AHEN.world.player.approaching, kills: window.__AHEN.char.record.kills, exp: window.__AHEN.char.exp, gold: window.__AHEN.char.gold }));
  record('Hedef ölünce yeni hedef otomatik seçilmez', afterKill.target === null && !afterKill.approaching, JSON.stringify(afterKill));
  // duvar arkası: görüş hattı
  const losOk = await ev(page, () => {
    const g = window.__AHEN.world.grid;
    // açık alanda görüş var, katı kütle içinden yok
    let blocked = null;
    for (let y = 5; y < g.h - 5 && !blocked; y++) for (let x = 5; x < g.w - 5; x++) if (g.opaque(x, y) && !g.opaque(x - 2, y) && !g.opaque(x + 2, y)) { blocked = [x, y]; break; }
    const [x, y] = blocked;
    return !g.los((x - 2) * 32 + 16, y * 32 + 16, (x + 2) * 32 + 16, y * 32 + 16);
  });
  record('Engelden görüş hattı geçmez (duvar arkasından saldırı yok)', losOk);
  // erişilemeyen hedef: sonsuz koşma yok
  const unreachable = await ev(page, async () => {
    const w = window.__AHEN.world, p = w.player;
    const fake = { x: 2 * 32, y: 2 * 32, radius: 10, height: 30, dead: false, kind: 'enemy', drawBar() {}, };
    p.target = fake; p.startApproach();
    const t0 = performance.now();
    while (performance.now() - t0 < 14000) { if (!p.approaching) return (performance.now() - t0) / 1000; await new Promise((r) => setTimeout(r, 100)); }
    return -1;
  });
  record('Erişilemeyen hedefe sonsuz koşma yok (uyarı + kilit çözülür)', unreachable > 0, `${unreachable.toFixed?.(1)} sn içinde durdu`);
  await page.screenshot({ path: join(shots, 'forest-control.png') });

  // zehirle ölüm (zehir tiki öldürünce oyun döngüsü hata vermemeli) ve yeniden doğma
  const errs0 = page.errors.length;
  const poisonDeath = await ev(page, async () => {
    const a = window.__AHEN, p = a.world.player;
    p.clearTarget();
    a.char.hp = 3; p.poison = { dmg: 10, left: 3, tick: 0.05 };
    const t0 = performance.now();
    while (performance.now() - t0 < 3000 && !p.dead) await new Promise((r) => setTimeout(r, 50));
    return { dead: p.dead, poison: p.poison };
  });
  await page.waitForSelector('[data-testid=respawn]', { timeout: 5000 });
  await page.tap('[data-testid=respawn]');
  await page.waitForTimeout(600);
  const revived = await ev(page, () => !window.__AHEN.world.player.dead && window.__AHEN.char.hp > 0);
  record('Zehirle ölüm hatasız; yeniden doğma çalışır', poisonDeath.dead && poisonDeath.poison === null && revived && page.errors.length === errs0, JSON.stringify({ ...poisonDeath, revived, errors: page.errors.slice(errs0) }));

  // görev yön okları: aktif görevin hedefine giden yol üzerinde oklar
  const guide = await ev(page, async () => {
    const a = window.__AHEN;
    for (const id of ['m01', 'm02']) a.char.quests[id] = { s: 'done', p: [], used: [] };
    a.char.quests.m03 = { s: 'active', p: [0], used: [] }; a.char.tracked = 'm03'; a.changed('quest');
    await new Promise((r) => setTimeout(r, 1200));
    const w = a.world;
    return { goal: w.guideGoal, arrows: w.guideArrows.filter((x) => x.visible).length, path: w.guidePath?.length || 0 };
  });
  record('Görev yön okları hedefe giden yol üzerinde görünür', !!guide.goal && guide.arrows >= 3 && guide.path > 0, JSON.stringify(guide));

  // joystick: halkanın dışındaki çevre bölgeye dokunmak da yürütür
  {
    const jz = await (await page.$('[data-testid=joystick]')).boundingBox();
    const cdp2 = await c3.newCDPSession(page);
    const x0 = await ev(page, () => window.__AHEN.world.player.x);
    const tx = jz.x + jz.width + 30, ty = jz.y + jz.height / 2;
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tx, y: ty, id: 9 }] });
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: tx + 8, y: ty, id: 9 }] });
    await page.waitForTimeout(600);
    const x1 = await ev(page, () => window.__AHEN.world.player.x);
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    record('Joystick halkasının çevresine dokunmak da yürütür', x1 - x0 > 20, `${Math.round(x1 - x0)} px sağa`);
  }

  // stat puanı: 0'ın altına inmez, onaylanınca kaydedilir
  {
    await ev(page, () => { const a = window.__AHEN; a.char.level = Math.max(a.char.level, 4); a.changed('level'); });
    await page.tap('[data-testid=btn-character]').catch(() => {});
    await page.waitForSelector('[data-testid=stat-str]', { timeout: 5000 });
    const fit = await ev(page, () => ['str', 'dex', 'int', 'vit', 'confirm'].every((k) => {
      const el = document.querySelector(`[data-testid=stat-${k}]`), r = el.getBoundingClientRect(), box = el.closest('.box').getBoundingClientRect();
      return r.top >= box.top && r.bottom <= Math.min(box.bottom, innerHeight);
    }));
    record('Karakter panelinde 4 stat ve Onayla kaydırmadan ekrana sığar', fit);
    const free0 = await ev(page, () => window.__AHEN.char.level * 3 - 3 - Object.values(window.__AHEN.char.alloc).reduce((a, b) => a + b, 0));
    const str0 = await ev(page, () => window.__AHEN.char.alloc.str);
    for (let i = 0; i < free0 + 4; i++) await page.tap('[data-testid=stat-str]', { force: true }).catch(() => {});
    const shown = await ev(page, () => document.querySelector('[data-panel] b.gold')?.textContent);
    await page.tap('[data-testid=stat-confirm]');
    await page.waitForTimeout(300);
    const after = await ev(page, () => ({ str: window.__AHEN.char.alloc.str }));
    await page.tap('.xbtn').catch(() => {});
    await page.waitForTimeout(300);
    record('Stat puanı 0\'ın altına inmez; onaylanınca kaydedilir', shown === '0' && after.str === str0 + free0, JSON.stringify({ free0, str0, shown, ...after }));
  }

  // harita geçişi: okun tam üstü değil, geçidin yanından da geçilir
  {
    await ev(page, () => { const w = window.__AHEN.world; w.player.clearTarget(); w.player.x = 2 * 32 + 16; w.player.y = 46 * 32 + 16; });
    let crossed = true;
    try { await waitMap(page, 'village'); } catch { crossed = false; }
    record('Geçit okunun 2 tile yanından harita geçişi olur', crossed);

    // tüccar: cüzdan her zaman görünür, satın alma onay ister
    await ev(page, () => { const a = window.__AHEN; a.char.gold = 5000; a.world.objects.find((o) => o.kind === 'npc' && o.npc.id === 'mira').interact(); });
    await page.waitForSelector('[data-testid=svc-shop]', { timeout: 5000 });
    await page.tap('[data-testid=svc-shop]');
    await page.waitForTimeout(300);
    const wallet = await ev(page, () => { const r = document.querySelector('[data-testid=wallet-gold]').getBoundingClientRect(); return { text: document.querySelector('[data-testid=wallet-gold]').textContent, inView: r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth }; });
    const g0 = await ev(page, () => window.__AHEN.char.gold);
    await page.tap('[data-testid^=buyeq-]');
    await page.waitForSelector('[data-testid=dlg-ok]', { timeout: 3000 });
    const gAsk = await ev(page, () => window.__AHEN.char.gold);
    await page.tap('[data-testid=dlg-cancel]');
    await page.waitForTimeout(200);
    const gCancel = await ev(page, () => window.__AHEN.char.gold);
    await page.tap('[data-testid^=buyeq-]');
    await page.waitForSelector('[data-testid=dlg-ok]', { timeout: 3000 });
    await page.tap('[data-testid=dlg-ok]');
    await page.waitForTimeout(300);
    const gBuy = await ev(page, () => window.__AHEN.char.gold);
    const wallet2 = await ev(page, () => document.querySelector('[data-testid=wallet-gold]').textContent);
    record('Tüccar: cüzdan (gold) başlıkta görünür', wallet.inView && wallet.text === '5.000', JSON.stringify(wallet));
    record('Satın alma onay ister; Vazgeç ile gold değişmez, onayla düşer', g0 === 5000 && gAsk === 5000 && gCancel === 5000 && gBuy < 5000 && wallet2 !== '5.000', JSON.stringify({ g0, gAsk, gCancel, gBuy, wallet2 }));
    await page.tap('.xbtn').catch(() => {});
    await page.waitForTimeout(300);

    // aktif saldırı: oto kapalıyken kukla kendiliğinden vurulmaz; kılıca basış vurur
    await page.tap('[data-testid=btn-auto]');
    await page.waitForTimeout(200);
    const atk = await ev(page, async () => {
      const w = window.__AHEN.world, d = w.enemies.find((e) => e.tpl.kind === 'dummy' && !e.dead);
      w.player.clearTarget(); w.player.x = d.x - 40; w.player.y = d.y; w.player.selectTarget(d);
      const h0 = d.hp;
      await new Promise((r) => setTimeout(r, 1500));
      window.__DD = d;
      return { auto: w.autoAttack, h0, idle: d.hp };
    });
    await page.tap('[data-testid=btn-attack]');
    await page.waitForTimeout(1200);
    const hit = await ev(page, () => window.__DD.hp);
    record('Oto saldırı (kırmızı OTO) kapalıyken hedef kendiliğinden vurulmaz', atk.auto === false && atk.idle === atk.h0, JSON.stringify(atk));
    record('Büyük kılıç aktif saldırı: basınca en yakın hedefe vurur', hit < atk.idle, `${atk.idle} → ${hit}`);
    await page.tap('[data-testid=btn-auto]');
    await page.waitForTimeout(200);
    await ev(page, () => window.__AHEN.world.changeMap('forest', 'from_village'));
    await waitMap(page, 'forest');
  }

  // ------------------------------------------------------------------ 4) Kayıt: kapat-aç
  const before = await ev(page, async () => {
    const a = window.__AHEN;
    a.char.gold = 777; a.char.quests.m01 = { s: 'active', p: [2], used: [] };
    await a.flushSave('test');
    return { name: a.char.name, level: a.char.level, gold: a.char.gold, map: a.world.mapId, kills: a.char.record.kills, bag: a.char.bag.slots.filter(Boolean).length, x: Math.floor(a.world.player.x / 32) };
  });
  await page.reload();
  await page.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
  const after = await ev(page, () => { const c = window.__AHEN.profile.characters.find((x) => x?.name === 'Kontrolcü'); return { name: c.name, level: c.level, gold: c.gold, map: c.world.map, kills: c.record.kills, bag: c.bag.slots.filter(Boolean).length, q: c.quests.m01?.p[0], x: c.world.x }; });
  record('Kapat-aç: karakter, gold, görev, harita, envanter korunur', after.gold === 777 && after.map === 'forest' && after.kills === before.kills && after.q === 2 && after.bag === before.bag, JSON.stringify(after));
  // aynı karakterle dünyaya geri dön
  await page.tap('[data-testid=menu-play]');
  await page.waitForTimeout(200);
  const slotIdx = await ev(page, () => window.__AHEN.profile.characters.findIndex((x) => x?.name === 'Kontrolcü'));
  await page.tap(`[data-testid=slot-${slotIdx}]`);
  await page.tap('[data-testid=enter-world]');
  await waitMap(page, 'forest');
  record('Kayıttan dünyaya dönüş (aynı harita)', true);

  // ------------------------------------------------------------------ 5) Performans: yoğunluk ve boss
  const perf = async (label) => ev(page, async (label) => {
    const loop = window.__AHEN.game.loop;
    const frames = [];
    let last = performance.now();
    const t0 = last, s0 = window.__AHEN.world.steps;
    while (performance.now() - t0 < 4000) { await new Promise((r) => requestAnimationFrame(r)); const n = performance.now(); frames.push(n - last); last = n; const a = window.__AHEN; a.char.hp = a.stats().maxHp; }
    const avg = 1000 / (frames.reduce((a, b) => a + b, 0) / frames.length);
    const mem = performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null;
    const stepFps = (window.__AHEN.world.steps - s0) / ((performance.now() - t0) / 1000);
    return { label, fps: +avg.toFixed(1), stepFps: +stepFps.toFixed(1), phaserFps: +loop.actualFps.toFixed(1), memMB: mem && +mem.toFixed(1), enemies: window.__AHEN.world.enemies.filter((e) => !e.dead).length };
  }, label);
  const p1 = await perf('orman normal');
  await ev(page, () => { const w = window.__AHEN.world, p = w.player; for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2; const x = p.x + Math.cos(a) * 160, y = p.y + Math.sin(a) * 120; if (!w.grid.blockedAt(x, y)) w.spawner.spawnEnemy('gray_wolf', x, y); } });
  const p2 = await perf('orman +30 kurt (saldırgan)');
  await ev(page, () => { const a = window.__AHEN; a.setSettings({ lowPerf: true }); });
  const p3 = await perf('düşük performans modu (30 FPS sınırı)');
  await ev(page, () => { const a = window.__AHEN; a.setSettings({ lowPerf: false }); });
  for (const r of [p1, p2]) record(`Performans: ${r.label}`, r.stepFps > 10, `oyun adımı ${r.stepFps}/sn · ekran ${r.fps} FPS · ${r.enemies} yaratık · bellek ${r.memMB} MB (SwiftShader yazılım GPU)`);
  record(`Performans: ${p3.label}`, p3.stepFps <= 32 && p3.stepFps > 10, `oyun adımı ${p3.stepFps}/sn (sınır 30) · ekran ${p3.fps} FPS`);
  results.perf = [p1, p2, p3];

  // ------------------------------------------------------------------ 6) Dungeon: Golem, tek loot, tekrar giriş
  await ev(page, () => { const a = window.__AHEN; for (const e of a.world.enemies) if (!e.dead) a.world.spawner.despawn(e); a.char.world.dungeonUnlocked = true; a.char.level = 20; a.changed('level'); a.world.changeMap('dungeon', null, { enterDungeon: true }); });
  await waitMap(page, 'dungeon');
  const run1 = await ev(page, () => window.__AHEN.char.dungeon.runId);
  const pg = await perf('dungeon');
  record(`Performans: ${pg.label}`, pg.stepFps > 10, `oyun adımı ${pg.stepFps}/sn · ekran ${pg.fps} FPS · ${pg.enemies} yaratık`);
  await ev(page, async () => {
    const a = window.__AHEN, w = a.world;
    const g = w.enemies.find((e) => e.tpl.id === 'mine_golem');
    w.player.x = g.x - 140; w.player.y = g.y + 40;
    g.aggro(w.player);
    window.__tgSeen = false;
    const t0 = performance.now();
    while (performance.now() - t0 < 9000) {
      await new Promise((r) => setTimeout(r, 100));
      a.char.hp = a.stats().maxHp;
      if (w.children.list.some((o) => o.texture?.key?.startsWith('tg_'))) window.__tgSeen = true;
    }
  });
  await page.screenshot({ path: join(shots, 'golem-fight.png') });
  const telegraphSeen = await ev(page, () => window.__tgSeen);
  record('Golem büyük saldırıyı telegrafla işaretler', telegraphSeen);
  const golemRes = await ev(page, () => {
    const a = window.__AHEN, w = a.world;
    const g = w.enemies.find((e) => e.tpl.id === 'mine_golem');
    const gold0 = a.char.gold, claims0 = Object.keys(a.char.claims).length;
    g.hp = 1;
    w.combat.applyToEnemy(g, { dmg: 5, crit: false, miss: false });
    const gold1 = a.char.gold, claims1 = Object.keys(a.char.claims).length;
    // aynı koşuda ikinci boss ölümü (ör. hile/çift olay) loot vermez
    const g2 = w.spawner.spawnEnemy('mine_golem', g.x, g.y, { stage: 4 });
    g2.hp = 1;
    w.combat.applyToEnemy(g2, { dmg: 5, crit: false, miss: false });
    return { dead: g.dead, goldGained: gold1 - gold0, claims: claims1 - claims0, secondGold: a.char.gold - gold1, cleared: a.char.dungeon.cleared, lootClaimed: a.char.dungeon.bossLootClaimed };
  });
  record('Maden Golemi yenilebilir; bölüm 4 temizlenir', golemRes.dead && golemRes.cleared.includes(4), JSON.stringify(golemRes));
  record('Tek boss ölümünden birden fazla loot kazanılamaz', golemRes.goldGained > 0 && golemRes.secondGold === 0 && golemRes.claims === 1);
  await ev(page, () => window.__AHEN.world.changeMap('mine', 'from_dungeon', { exitDungeon: true }));
  await waitMap(page, 'mine');
  await ev(page, () => window.__AHEN.world.changeMap('dungeon', null, { enterDungeon: true }));
  await waitMap(page, 'dungeon');
  const run2 = await ev(page, () => ({ runId: window.__AHEN.char.dungeon.runId, golem: window.__AHEN.world.enemies.some((e) => e.tpl.id === 'mine_golem' && !e.dead), cleared: window.__AHEN.char.dungeon.cleared }));
  record('Gönüllü çıkış koşuyu bitirir; tekrar giriş yeni koşu ve Golem', run2.runId !== run1 && run2.golem && run2.cleared.length === 0, JSON.stringify(run2));
  record('Konsol hatası yok (kontrol/dungeon akışı)', page.errors.length === 0, page.errors.slice(0, 3).join(' | '));
  await c3.close();

  // ------------------------------------------------------------------ 6b) PWA: servis işçisi ile çevrimdışı açılış
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    const pg = await ctx.newPage();
    await pg.goto(BASE);
    await pg.waitForSelector('[data-testid=menu-play]', { timeout: 40000 });
    const swOk = await pg.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
    await pg.waitForTimeout(1500);
    await ctx.setOffline(true);
    await pg.reload();
    let offlineOk = false;
    try { await pg.waitForSelector('[data-testid=menu-play]', { timeout: 30000 }); offlineOk = true; } catch { /* */ }
    record('PWA: servis işçisi etkin', swOk);
    record('PWA: çevrimdışı yeniden açılış', offlineOk);
    const man = await pg.evaluate(() => document.querySelector('link[rel=manifest]')?.href);
    record('PWA: manifest bağlı', !!man, man);
    await ctx.close();
  }

  // ------------------------------------------------------------------ 7) Mage: uzak menzil, MP'siz normal saldırı
  {
    const { ctx, page: pm } = await newPage(844, 390);
    await createChar(pm, 'mage', 'Büyücü Test');
    await ev(pm, () => window.__AHEN.world.changeMap('forest', 'from_village'));
    await waitMap(pm, 'forest');
    const res = await ev(pm, async () => {
      const a = window.__AHEN, w = a.world, p = w.player;
      const r = w.enemies.filter((e) => !e.dead && e.tpl.id === 'meadow_rat')[0];
      p.x = r.x - 150; p.y = r.y; r.state = 'idle';
      await new Promise((rr) => setTimeout(rr, 300));
      const mp0 = a.char.mp;
      p.selectTarget(r);
      const t0 = performance.now();
      let maxDist = 0;
      while (!r.dead && performance.now() - t0 < 12000) { await new Promise((rr) => setTimeout(rr, 100)); if (p.attackTimer > 0) maxDist = Math.max(maxDist, Math.hypot(r.x - p.x, r.y - p.y)); }
      return { dead: r.dead, mpUsed: mp0 - a.char.mp, attackDistTiles: +(maxDist / 32).toFixed(1) };
    });
    record('Mage uzaktan saldırır ve normal büyü MP harcamaz', res.dead && res.attackDistTiles > 3 && res.mpUsed <= 0, JSON.stringify(res));
    await pm.screenshot({ path: join(shots, 'mage-forest.png') });
    record('Konsol hatası yok (mage)', pm.errors.length === 0, pm.errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
} catch (e) {
  record('Beklenmeyen test hatası', false, e.stack);
} finally {
  await browser.close();
  server.kill();
  const passed = results.filter((r) => r.ok).length;
  writeFileSync(join(here, 'report.json'), JSON.stringify({ date: new Date().toISOString(), passed, total: results.length, results, perf: results.perf }, null, 2));
  console.log(`\nE2E: ${passed}/${results.length} geçti`);
  process.exit(passed === results.length ? 0 : 1);
}
