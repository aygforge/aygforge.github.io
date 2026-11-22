#!/usr/bin/env node
/* Kayıt uyumluluğu (aynı köken): A = özgün tek dosya (reference/…v1.html), B = modüler sürüm.
   1) A'da kayıt (IndexedDB 'cozyfishing' + localStorage 'cozyfishing_save_v1') → B açılışında aynen yüklenir
   2) B'de kayıt → A'da geri açılır (geri dönüş uyumu)   3) anahtarlar/şema değişmedi   4) sessiz sıfırlama yok */
'use strict';
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const server = require('../tools/serve-lib.js').start(ROOT, 0); const port = await server.ready;
  const A = `http://localhost:${port}/reference/CozFis_Multilanguage_v1.html`, B = `http://localhost:${port}/index.html`;
  const b = await chromium.launch(); const ctx = await b.newContext({ locale: 'tr-TR' }); const out = {};
  const open = async url => { const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(url); await p.waitForFunction(() => typeof Game !== 'undefined' && Game.scene && UI._hasSave !== undefined, null, { timeout: 60000 }); await p.waitForTimeout(300); p._errs = errs; return p; };
  const storage = p => p.evaluate(async () => ({ ls: Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])), idb: await Save.idbGet('main') }));
  // 1) A'da oyun kur ve kaydet
  let p = await open(A);
  const made = await p.evaluate(() => {
    beginNewGame({ name: 'Eski Kayıt', body: 1, skin: 3, hair: 4, hairColor: 5, outfit: 'tisort', hat: 'kaptan' });
    S.cash = 98765; S.day = 23; Inv.add('bag', 'levrek', 2); Inv.add('bag', 'kefal', 5); S.cash += 1e6; Boats.buy('coastal_skiff'); S.cash -= 1e6;
    Save.now(); return { day: S.day, cash: S.cash, boats: S.boats.owned, rev: S.revision, bag: JSON.stringify(S.bag), name: S.player.name };
  });
  await p.waitForTimeout(400); await p.close();
  // A kapandıktan sonra (pagehide kaydı dahil) depoyu oyun dışı nötr bir sayfadan oku
  const raw = async () => { const q = await ctx.newPage(); await q.goto(`http://localhost:${port}/assets/sprites.json`); const r = await q.evaluate(() => new Promise(res => { const ls = Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])); const rq = indexedDB.open('cozyfishing', 1); rq.onsuccess = () => { const t = rq.result.transaction('saves', 'readonly').objectStore('saves').get('main'); t.onsuccess = () => { res({ ls, idb: t.result || null }); rq.result.close(); }; }; })); await q.close(); return r; };
  const stA = await raw();
  // B açılışı: kayıt bulunmalı, hiçbir şey silinmemeli
  p = await open(B);
  const stB0 = await storage(p); out.lsKeysAfterBoot = Object.keys(stB0.ls);
  const loaded = await p.evaluate(() => ({ hasSave: UI._hasSave, err: UI._saveErr, day: S && S.day, cash: S && S.cash, boats: S && S.boats.owned, bag: S && JSON.stringify(S.bag), name: S && S.player.name, keys: [Save.DBN, Save.ST, Save.LS, Save.LSB, Save.LSP, Save.SET], schema: SCHEMA, format: JSON.parse(Save.pack(S)).format, assets: AssetManager.enabled }));
  out.A_to_B = { made, loaded, sameState: made.day === loaded.day && made.cash === loaded.cash && made.bag === loaded.bag && made.name === loaded.name && JSON.stringify(made.boats) === JSON.stringify(loaded.boats),
    storageUntouchedOnBoot: JSON.stringify(stA.ls['cozyfishing_save_v1']) === JSON.stringify(stB0.ls['cozyfishing_save_v1']) && stA.idb === stB0.idb, errors: p._errs };
  // B'de devam et, oyna, kaydet
  const cont = await p.evaluate(() => { startFromSave(); const sc = Game.sceneName; S.cash += 111; S.day += 1; Save.now(); return { scene: sc, day: S.day, cash: S.cash }; });
  await p.waitForTimeout(400); await p.close();
  // 2) A geri açar
  p = await open(A);
  const back = await p.evaluate(() => ({ hasSave: UI._hasSave, err: UI._saveErr, day: S && S.day, cash: S && S.cash }));
  out.B_to_A = { cont, back, ok: back.hasSave && back.day === cont.day && back.cash === cont.cash, errors: p._errs };
  await p.close();
  out.pass = out.A_to_B.sameState && out.A_to_B.storageUntouchedOnBoot && out.B_to_A.ok && loaded.format === 'cozyfishing-save' && loaded.keys.join() === 'cozyfishing,saves,cozyfishing_save_v1,cozyfishing_backup_v1,cozyfishing_prev_v1,cozyfishing_settings_v1';
  console.log(JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(ROOT, 'reports/save_compat.json'), JSON.stringify(out, null, 1));
  await b.close(); server.close(); process.exit(out.pass ? 0 : 2);
})();
