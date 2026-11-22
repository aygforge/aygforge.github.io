#!/usr/bin/env node
/* tests/android-shell.js — Android kabuk mantığının SİMÜLASYON testi (gerçek cihaz/emülatör DEĞİL).
   dist/web masaüstü Chromium'da mobil öykünmeyle (dokunmatik, Pixel 7 yatay 915×412, DPR 2.625) açılır;
   window.Capacitor sahte bir yerel köprüyle (App/Filesystem/Share) taklit edilir. Böylece src/platform/android.js'in
   geri tuşu, yaşam döngüsü, ses odağı, dışa aktarma→paylaşım, güvenli alan ve dokunma davranışları sınanır.
   Önce: node tools/build/build.js     Kullanım: node tests/android-shell.js  →  reports/android_shell.json      */
'use strict';
const path = require('path'), fs = require('fs'); const { chromium, devices } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const MOCK = () => {
  window.__capCalls = []; const L = {};
  const mk = name => new Proxy({}, { get(_, m) {
    if (m === 'addListener') return (ev, cb) => { (L[name + ':' + ev] = L[name + ':' + ev] || []).push(cb); return Promise.resolve({ remove() { } }); };
    return (...a) => { window.__capCalls.push([name, m, a]); return Promise.resolve(name === 'Filesystem' && m === 'writeFile' ? { uri: 'file:///data/user/0/cache/' + a[0].path } : {}); };
  } });
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: { App: mk('App'), Filesystem: mk('Filesystem'), Share: mk('Share') } };
  window.__fire = (k, d) => (L[k] || []).forEach(cb => cb(d));
  try { localStorage.clear(); localStorage.setItem('cozyfishing_lang_v1', 'tr'); } catch (e) { }
};
(async () => {
  const server = require('../tools/serve-lib.js').start(path.join(ROOT, 'dist/web'), 0); const port = await server.ready;
  const b = await chromium.launch(); const out = { mode: 'SİMÜLASYON (masaüstü Chromium + sahte Capacitor köprüsü)', checks: {} };
  const ok = (k, v, info) => { out.checks[k] = { ok: !!v, info }; console.log((v ? '✔' : '✘') + ' ' + k + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
  const dev = devices['Pixel 7 landscape'] || { viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true };
  const ctx = await b.newContext(Object.assign({}, dev, { locale: 'tr-TR' })); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(MOCK);
  await p.goto(`http://localhost:${port}/index.html`);
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene && document.getElementById('boot').style.display === 'none', null, { timeout: 60000 });
  ok('açılış: AndroidShell yerel modda, ana menü', await p.evaluate(() => AndroidShell.native && document.documentElement.classList.contains('cap-android') && Game.sceneName === 'MainMenu'));
  // ölçekleme
  const sc = await p.evaluate(() => { const f = $('frame').getBoundingClientRect(); return { vw: innerWidth, vh: innerHeight, fw: f.width, fh: f.height, fx: f.left, cw: cvs.width, ch: cvs.height, dpr: devicePixelRatio, smooth: sctx.imageSmoothingEnabled }; });
  ok('ölçek: 16:9 korunur, ortalanır, canvas fiziksel piksel, yumuşatma kapalı', Math.abs(sc.fw / sc.fh - 16 / 9) < 0.01 && Math.abs(sc.fx - (sc.vw - sc.fw) / 2) <= 1 && sc.cw === Math.round(sc.fw * Math.min(3, sc.dpr)) && !sc.smooth, sc);
  // güvenli alan (kesik soldayken)
  const sa = await p.evaluate(async () => { document.documentElement.style.setProperty('--safe-area-inset-left', '48px'); await new Promise(r => setTimeout(r, 50)); const f = $('frame').getBoundingClientRect(); const r = { left: f.left, right: innerWidth - f.right, w: f.width }; document.documentElement.style.setProperty('--safe-area-inset-left', '0px'); await new Promise(r => setTimeout(r, 50)); return r; });
  ok('güvenli alan: --safe-area-inset-left 48px → oyun alanı kesikten uzak', sa.left >= 48, sa);
  // dokunma: ana menüdeki Ayarlar düğmesine dokun → panel; dil düğmesine dokun → dil değişir
  const tapSel = async sel => { const bb = await p.locator(sel).first().boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(350); };
  await p.evaluate(() => UI.openPanel('Settings')); await p.waitForTimeout(200);
  await tapSel('[data-a=setLang][data-v=en]');
  ok('dokunma: dil seçimi (EN) dokunuşla çalışır, tercih saklanır', await p.evaluate(() => I18N.lang === 'en' && localStorage.getItem('cozyfishing_lang_v1') === 'en'));
  await tapSel('[data-a=setLang][data-v=tr]'); await p.evaluate(() => UI.closePanel());
  // geri tuşu — ana menü
  const back = () => p.evaluate(() => { window.__fire('App:backButton', { canGoBack: false }); return AndroidShell.state.backLog.slice(-1)[0]; });
  await p.evaluate(() => { UI.closePanel(true); UI.closeModal(); go('MainMenu'); AndroidShell.state.lastBack = 0; });
  const r1 = await back(); const exitAfter1 = await p.evaluate(() => window.__capCalls.some(c => c[1] === 'exitApp'));
  const r2 = await back(); await p.waitForTimeout(150); const exitAfter2 = await p.evaluate(() => window.__capCalls.some(c => c[1] === 'exitApp'));
  ok('geri: ana menüde tek basış çıkmaz (uyarı), 2 sn içinde ikinci basış kaydedip çıkar', r1 === 'MainMenu:hint' && !exitAfter1 && r2 === 'MainMenu:exit' && exitAfter2, { r1, r2 });
  await p.evaluate(() => { window.__capCalls.length = 0; go('CharacterCreator', { look: {} }); });
  ok('geri: karakter oluşturmada ana menüye döner', (await back()) === 'CharacterCreator:toMenu' && await p.evaluate(() => Game.sceneName === 'MainMenu'));
  await p.evaluate(() => { beginNewGame({ name: 'Droid', body: 0, skin: 1, hair: 2, hairColor: 3, outfit: 'tisort', hat: 'klasik' }); go('Town', {}); });
  const t1 = await back(); const pOpen = await p.evaluate(() => UI.panel); const t2 = await back(); const pClosed = await p.evaluate(() => UI.panel);
  ok('geri: oyunda açık şey yoksa Menü paneli açılır, ikinci basış kapatır; uygulama kapanmaz', t1 === 'Town:menu' && pOpen === 'Menu' && t2 === 'Town:escape' && !pClosed && !(await p.evaluate(() => window.__capCalls.some(c => c[1] === 'exitApp'))), { t1, pOpen, t2 });
  await p.evaluate(() => UI.confirm({ title: 'x', text: 'y', onOk: () => { window.__okRan = true; } }));
  const m1 = await back(); ok('geri: açık onay penceresini (vazgeç gibi) kapatır, işlemi çalıştırmaz', m1 === 'Town:escape' && await p.evaluate(() => !UI.modal && !window.__okRan));
  await p.evaluate(() => UI.openPanel('Inventory')); const i1 = await back();
  ok('geri: açık paneli (envanter) kapatır', i1 === 'Town:escape' && await p.evaluate(() => !UI.panel));
  // yaşam döngüsü + kayıt + ses
  await p.touchscreen.tap(200, 200); await p.evaluate(() => Sound.start()); await p.waitForTimeout(300);
  const lc = await p.evaluate(async () => {
    S.cash = 424242; window.__fire('App:appStateChange', { isActive: false }); window.__fire('App:pause');
    await new Promise(r => setTimeout(r, 300));
    const saved = JSON.parse(localStorage.getItem('cozyfishing_save_v1') || '{}');
    const bg = { paused: Game.paused, audio: Sound.ctx && Sound.ctx.state, savedCash: saved.state && saved.state.cash, active: AndroidShell.state.active };
    const tBefore = Game.t; await new Promise(r => setTimeout(r, 2500));       // arka planda 2,5 sn
    const tBg = Game.t - tBefore;
    window.__fire('App:appStateChange', { isActive: true }); window.__fire('App:resume');
    await new Promise(r => setTimeout(r, 300));
    const t0 = Game.t; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const dt2 = Game.t - t0;
    return { bg, tAdvancedInBg: +tBg.toFixed(3), fg: { paused: Game.paused, audio: Sound.ctx && Sound.ctx.state }, twoFramesDt: +dt2.toFixed(3) };
  });
  ok('yaşam döngüsü: arka planda duraklar, kaydeder, ses askıya alınır; zaman ilerlemez', lc.bg.paused && lc.bg.savedCash === 424242 && lc.bg.audio === 'suspended' && lc.tAdvancedInBg === 0, lc);
  ok('yaşam döngüsü: dönüşte sürer, ses devam eder, zaman sıçraması yok (2 kare ≤ 0,1 sn)', !lc.fg.paused && lc.fg.audio === 'running' && lc.twoFramesDt <= 0.1, lc.fg);
  const af = await p.evaluate(async () => { window.dispatchEvent(new CustomEvent('cozfis:audiofocus', { detail: { gain: false } })); await new Promise(r => setTimeout(r, 200)); const a = Sound.ctx.state; window.dispatchEvent(new CustomEvent('cozfis:audiofocus', { detail: { gain: true } })); await new Promise(r => setTimeout(r, 200)); return [a, Sound.ctx.state]; });
  ok('ses odağı: arama/başka uygulama → ses askıda; geri gelince sürer', af[0] === 'suspended' && af[1] === 'running', af);
  // dışa aktarma → paylaşım
  const ex = await p.evaluate(async () => {
    window.__capCalls.length = 0; UI.A.download.call(UI, {}); await new Promise(r => setTimeout(r, 600));
    const w = window.__capCalls.find(c => c[0] === 'Filesystem' && c[1] === 'writeFile'), sh = window.__capCalls.find(c => c[0] === 'Share' && c[1] === 'share');
    if (!w) return { w: null };
    const txt = new TextDecoder().decode(Uint8Array.from(atob(w[2][0].data), c => c.charCodeAt(0))); const o = JSON.parse(txt);
    return { path: w[2][0].path, dir: w[2][0].directory, format: o.format, schema: o.schemaVersion, cash: o.state.cash, share: sh && sh[2][0], unpackOk: Save.unpack(txt).ok };
  });
  ok('dışa aktarma: kayıt dosyası önbelleğe yazılır ve Android paylaşım sayfası açılır (biçim cozyfishing-save, şema 5)', ex.format === 'cozyfishing-save' && ex.schema === 5 && ex.unpackOk && ex.cash === 424242 && ex.share && ex.share.files && ex.share.files[0].endsWith('.json'), ex);
  // içe aktarma: <input type=file> (Android'de dosya seçici) üzerinden dosya
  await p.evaluate(() => { UI.A.importOpen.call(UI, {}); });
  const saveTxt = await p.evaluate(() => { const o = JSON.parse(Save.pack(S)); return JSON.stringify(o); });
  await p.setInputFiles('#impFile', { name: 'cozyfishing_gun1.json', mimeType: 'application/json', buffer: Buffer.from(saveTxt) });
  await p.evaluate(() => UI.A.importGo.call(UI, {})); await p.waitForTimeout(300);
  ok('içe aktarma: dosya seçiciden gelen kayıt doğrulanır ve onay penceresi açılır', await p.evaluate(() => !!UI.modal && /data-a="mOk"/.test($('modal').innerHTML)));
  await p.evaluate(() => UI.closeModal());
  // mevcut 149 kabul testi Android kabuğu yüklüyken
  const qa = await p.evaluate(() => { const r = QA.runAll(); return { n: r.length, ok: r.filter(x => x.ok).length, bad: r.filter(x => !x.ok).map(x => x.name) }; });
  ok('149 kabul testi (Android kabuğu etkin)', qa.ok === qa.n && qa.n === 149, qa);
  ok('sayfa hatası yok', errs.length === 0, errs.slice(0, 5));
  out.pass = Object.values(out.checks).every(c => c.ok);
  fs.writeFileSync(path.join(ROOT, 'reports/android_shell.json'), JSON.stringify(out, null, 1));
  await b.close(); server.close(); process.exit(out.pass ? 0 : 2);
})().catch(e => { console.error(e); process.exit(1); });
