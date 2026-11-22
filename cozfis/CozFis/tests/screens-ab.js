#!/usr/bin/env node
/* Ekran düzeyinde A/B karşılaştırması: A = özgün tek dosya, B = modüler + atlas.
   Aynı durum, aynı Game.t, tohumlu Math.random, sabit Date.now; döngü (requestAnimationFrame) durdurulur ve
   tek kare elle çizilir. Sayfanın tamamı (canvas + HTML arayüz) ekran görüntüsü alınıp piksel piksel karşılaştırılır.
   Kullanım: node tests/screens-ab.js [--langs tr,en,...] [--save tr]   →  reports/screens/, reports/screens_ab.json  */
'use strict';
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const LANGS = arg('langs', 'tr,en,es,de,fr,pt-BR').split(','), SAVE = arg('save', 'tr').split(',');
const SCREENS = ['mainmenu', 'creator', 'town', 'pier', 'fishing', 'boat', 'seamap', 'inventory', 'encyclopedia', 'home_decor', 'settings'];

const setup = (name) => {
  const look = { name: 'QA', body: 0, skin: 1, hair: 3, hairColor: 2, outfit: 'tisort', hat: 'klasik' };
  const game = () => { beginNewGame(look); S.cash = 54321; Inv.add('bag', 'kefal', 3); Inv.add('bag', 'levrek', 1); };
  switch (name) {
    case 'mainmenu': go('MainMenu'); break;
    case 'creator': go('CharacterCreator', { look: {} }); break;
    case 'town': game(); go('Town', {}); break;
    case 'pier': game(); go('PierFishing', {}); break;
    case 'fishing': {
      game(); QA.act('rod5', {}); go('PierFishing', {});
      S.pendingCast = { id: 1, spotId: S.spotId, mode: 'pier', band: 'mid', bait: 'basic', fish: 'lufer', size: { cm: 60, kg: 3, t: 0.6, cls: 'normal' }, bite: true, wait: 2, method: 'float', daypart: 'day', tempo: 'classic' };
      Fishing.bob = { x0: 200, y0: 200, x: 400, y: 214, tx: 400, ty: 214, dip: 0 }; Fishing.phase = 'BITE_WINDOW'; Fishing.t = 0.6; Fishing.hook();
      for (let i = 0; i < 90; i++) { Fishing.holding = i % 20 < 12; Fishing.update(1 / 60); } UI.fishBarUpdate(); break;
    }
    case 'boat': game(); S.cash = 1e6; Boats.buy('coastal_skiff'); S.boats.active = 'coastal_skiff'; S.regionId = 'sakin_liman'; go('BoatFishing', { rid: 'sakin_liman' }); break;
    case 'seamap': game(); S.cash = 1e6; Boats.buy('coastal_skiff'); S.boats.active = 'coastal_skiff'; go('SeaMap', {}); break;
    case 'inventory': game(); go('Town', {}); UI.openPanel('Inventory'); break;
    case 'encyclopedia': game(); go('Town', {}); UI.openPanel('Encyclopedia'); break;
    case 'home_decor': game(); go('Home', {}); UI.openPanel('Decor'); break;
    case 'settings': game(); go('Town', {}); UI.openPanel('Settings'); break;
  }
  document.getElementById('toasts').innerHTML = '';
  Game.paused = true; Game.fade = 0; Game.t = 2.25; window.__seed(777);
  G.setTransform(1, 0, 0, 1, 0, 0); G.globalAlpha = 1; G.imageSmoothingEnabled = false; G.fillStyle = '#100c18'; G.fillRect(0, 0, LW, LH);
  Game.scene.render(G, 0); sctx.imageSmoothingEnabled = false; sctx.drawImage(BUF, 0, 0, cvs.width, cvs.height); UI.pump();
  /* HTML bildirimleri (toast) CSS animasyonuyla zamana bağlı girer; karşılaştırmada ikisinde de kaldırılır */
  document.getElementById('toasts').innerHTML = ''; const st = document.createElement('style'); st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'; document.head.appendChild(st);
  return Game.sceneName;
};

async function shot(browser, url, lang, name, waitAll) {
  const p = await browser.newPage({ viewport: { width: 844, height: 390 }, locale: lang });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(l => {
    try { localStorage.clear(); localStorage.setItem('cozyfishing_lang_v1', l); } catch (e) { }
    let s = 12345; window.__seed = n => { s = n >>> 0; }; Math.random = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    const T = 1767225600000; Date.now = () => T; window.requestAnimationFrame = () => 0;
  }, lang);
  await p.goto(url);
  await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene && document.getElementById('boot').style.display === 'none', null, { timeout: 60000 });
  if (waitAll) await p.waitForFunction(() => AssetManager.ready && AssetManager.stats.pages === Object.keys(AssetManager.manifest.pages).length, null, { timeout: 60000 });
  const scene = await p.evaluate(setup, name);
  await p.evaluate(() => document.fonts && document.fonts.ready); await p.waitForTimeout(150);
  const buf = await p.screenshot(); await p.close(); return { buf, scene, errs };
}
(async () => {
  const server = require('../tools/serve-lib.js').start(ROOT, 0); const port = await server.ready;
  const A = `http://localhost:${port}/reference/CozFis_Multilanguage_v1.html`, B = `http://localhost:${port}/index.html?assets=all`;
  const browser = await chromium.launch(); const cmp = await browser.newPage();
  await cmp.goto(`http://localhost:${port}/assets/sprites.json`);
  const dir = path.join(ROOT, 'reports/screens'); fs.mkdirSync(dir, { recursive: true });
  const res = {};
  for (const lang of LANGS) for (const name of SCREENS) {
    const a = await shot(browser, A, lang, name, false), b = await shot(browser, B, lang, name, true);
    const d = await cmp.evaluate(async ([x, y]) => {
      const load = u => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + u; });
      const [ia, ib] = await Promise.all([load(x), load(y)]); const W = ia.width, H = ia.height;
      const g = (im) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const t = c.getContext('2d'); t.drawImage(im, 0, 0); return t.getImageData(0, 0, W, H).data; };
      const A = g(ia), B = g(ib); let n = 0; for (let i = 0; i < A.length; i += 4) if (A[i] !== B[i] || A[i + 1] !== B[i + 1] || A[i + 2] !== B[i + 2] || A[i + 3] !== B[i + 3]) n++;
      return { w: W, h: H, diffPixels: n, sizeMatch: ia.width === ib.width && ia.height === ib.height };
    }, [a.buf.toString('base64'), b.buf.toString('base64')]);
    res[lang + '/' + name] = Object.assign(d, { scene: b.scene, errsA: a.errs, errsB: b.errs });
    if (SAVE.includes(lang)) { fs.writeFileSync(path.join(dir, `${lang}_${name}_A.png`), a.buf); fs.writeFileSync(path.join(dir, `${lang}_${name}_B.png`), b.buf); }
    console.log(lang, name.padEnd(13), 'fark pikseli:', d.diffPixels, a.errs.concat(b.errs).length ? a.errs.concat(b.errs) : '');
  }
  fs.writeFileSync(path.join(ROOT, 'reports/screens_ab.json'), JSON.stringify(res, null, 1));
  await browser.close(); server.close();
  process.exit(Object.values(res).every(r => r.diffPixels === 0) ? 0 : 2);
})();
