#!/usr/bin/env node
/* Duman testleri: çevrimdışı/ağ, file:// geri dönüşü, tek dosya sürümü, ses, karakter oluşturucu, dil değiştirme.
   Önce: node tools/build/build.js   Kullanım: node tests/smoke.js  →  reports/smoke.json                     */
'use strict';
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const server = require('../tools/serve-lib.js').start(ROOT, 0); const port = await server.ready;
  const b = await chromium.launch(); const out = {};
  const open = async (url, opts) => {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 844, height: 390 }, locale: 'tr-TR' }, opts || {})); const p = await ctx.newPage();
    const errs = [], reqs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('request', r => reqs.push(r.url()));
    await p.goto(url); await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene && document.getElementById('boot').style.display === 'none', null, { timeout: 60000 });
    return { ctx, p, errs, reqs };
  };
  // 1) http: ağ istekleri yalnız yerel; ses; karakter oluşturucu; canlı dil değişimi
  {
    const { ctx, p, errs, reqs } = await open(`http://localhost:${port}/index.html`);
    await p.mouse.click(400, 200);   // kullanıcı etkileşimi (ses bağlamı için)
    out.http = await p.evaluate(async () => {
      const r = {};
      Sound.start(); Sound.suspend(false); await new Promise(x => setTimeout(x, 200));
      try { ['click', 'cast', 'splash', 'catch', 'coin'].forEach(n => Sound.sfx(n)); r.sound = { ctx: !!Sound.ctx, state: Sound.ctx && Sound.ctx.state, started: Sound.started }; } catch (e) { r.sound = { error: e.message }; }
      go('CharacterCreator', { look: {} }); r.creatorScene = Game.sceneName; r.creatorButtons = document.querySelectorAll('#sceneui [data-a], #panel [data-a]').length;
      Game.scene.render(G, 0);
      beginNewGame({ name: 'Smoke', body: 1, skin: 4, hair: 6, hairColor: 7, outfit: 'tisort', hat: 'fener_beresi' }); go('Town', {}); Game.scene.render(G, 0);
      r.player = { hair: S.player.hair, hat: S.player.hat, sprite: personSprite(S.player, 'idle0').width + 'x' + personSprite(S.player, 'idle0').height, hand: handOf(S.player, 'hold') };
      const langs = []; for (const l of ['en', 'es', 'de', 'fr', 'pt-BR', 'tr']) { I18N.setLang(l, { noSave: true }); go('Town', {}); Game.scene.render(G, 0); UI.openPanel('Inventory'); langs.push(l + ':' + document.getElementById('panel').innerText.slice(0, 18).replace(/\s+/g, ' ')); UI.closePanel(true); }
      r.langs = langs; r.atlasHits = AssetManager.stats.hits; r.fallbacks = AssetManager.stats.fallbacks; r.photoDataUrl = cvs.toDataURL().length > 1000;
      return r;
    });
    out.http.remoteRequests = reqs.filter(u => !/^(http:\/\/(localhost|127\.0\.0\.1)|data:|blob:)/.test(u));
    out.http.requestCount = reqs.length; out.http.errors = errs; await ctx.close();
  }
  // 2) modüler sürüm file:// → canvas kirlenmesi algılanır, prosedürel moda düşer, hata yok
  {
    const { ctx, p, errs } = await open('file://' + path.join(ROOT, 'index.html'));
    out.fileModular = await p.evaluate(() => { beginNewGame({ name: 'F', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' }); go('Town', {}); Game.scene.render(G, 0); UI.openPanel('Encyclopedia'); const imgs = document.querySelectorAll('#panel img').length; UI.closePanel(true); return { assets: AssetManager.enabled, reason: AssetManager.reason, panelImgs: imgs, photo: cvs.toDataURL().length > 1000 }; });
    out.fileModular.errors = errs; await ctx.close();
  }
  // 3) tek dosya sürümü file:// → atlaslar data: URI'den yüklenir; 149 kabul testi
  {
    const f = path.join(ROOT, 'dist/CozFis_Standalone.html');
    if (fs.existsSync(f)) {
      const { ctx, p, errs } = await open('file://' + f);
      out.standalone = await p.evaluate(() => { const st = { assets: AssetManager.enabled, pages: AssetManager.stats.pages }; beginNewGame({ name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' }); const r = QA.runAll(); return Object.assign(st, { qa: r.filter(x => x.ok).length + '/' + r.length, bad: r.filter(x => !x.ok).map(x => x.name), hits: AssetManager.stats.hits }); });
      out.standalone.errors = errs; await ctx.close();
    } else out.standalone = 'dist yok — önce tools/build/build.js';
  }
  // 4) çevrimdışı tarayıcı bağlamı (ağ kapalı) + http önbelleği yok: yerel sunucu yine de erişilebilir, uzak istek yok
  {
    const { ctx, p, errs, reqs } = await open(`http://localhost:${port}/index.html`, { offline: false });
    await ctx.setOffline(true);
    out.offlineAfterLoad = await p.evaluate(() => { beginNewGame({ name: 'O', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' }); go('Town', {}); Game.scene.render(G, 0); S.cash = 1e6; Boats.buy('coastal_skiff'); S.boats.active = 'coastal_skiff'; go('BoatFishing', { rid: 'yesil_koy' }); Game.scene.render(G, 0); return { scene: Game.sceneName, assets: AssetManager.enabled }; });
    out.offlineAfterLoad.errors = errs; await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(ROOT, 'reports/smoke.json'), JSON.stringify(out, null, 1));
  await b.close(); server.close();
})();
