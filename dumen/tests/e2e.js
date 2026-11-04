// Gerçek tarayıcı uçtan uca testi (Playwright + Chromium). Kullanım: node tests/e2e.js [çıktı klasörü]
// Gerçek pointer olaylarıyla: yeni oyun → kasaba → harita → atış → siluet → SAR (basılı) / ÇEK → sonuç → satış,
// çift tıklama koruması, hazinede önceden basılı parmak sızıntısı, modal arka plan engeli, kayıt kalıcılığı, mobil boyutlar.
'use strict';
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.log('Playwright yok; e2e atlandı.'); process.exit(0); }
const OUT = process.argv[2] || path.join(__dirname, '..', 'tests', 'screens');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('  ✗ ' + n); } };

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: false });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const center = async (sel) => { const b = await page.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const tap = async (sel) => { const [x, y] = await center(sel); await page.mouse.click(x, y); await page.waitForTimeout(250); };
  await page.goto(URL); await page.waitForTimeout(900);
  await ev(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(900);
  ok(await page.locator('button[aria-label="Devam Et"]').isDisabled(), 'Kayıt yokken Devam Et pasif');
  await tap('button[aria-label="Yeni Oyun"]'); await page.waitForTimeout(1300);
  // intro diyaloğu geç
  for (let i = 0; i < 6 && await ev(() => DUMEN.UI.modalOpen()); i++) { await page.mouse.click(640, 600); await page.waitForTimeout(350); }
  ok(await ev(() => DUMEN.SM.name) === 'town', 'Kasaba sahnesi');
  await page.screenshot({ path: path.join(OUT, '01_town.png') });
  await tap('.hot[aria-label="Tekne — Balığa Çık"]'); await page.waitForTimeout(500);
  ok(await ev(() => DUMEN.SM.name) === 'map', 'Tekneye dokun → harita');
  // kilitli bölge girişi engeli
  await tap('.hot[aria-label="Bermuda Girdabı"]');
  ok(await page.locator('button:has-text("Yola Çık")').isDisabled(), 'Kilitli bölgede Yola Çık pasif');
  await tap('.map-card button[aria-label="Kartı gizle"]'); await tap('.map-lbl:has-text("Eski Liman")'); await tap('button:has-text("Yola Çık")'); await page.waitForTimeout(500);
  ok(await ev(() => DUMEN.SM.name) === 'fishing', 'Balıkçılık sahnesi');
  let caught = 0;
  for (let round = 0; round < 6 && caught < 2; round++) {
    await tap('button:has-text("Oltayı At")');
    await page.waitForFunction(() => DUMEN.SM.cur.state === 'SELECT', null, { timeout: 12000 });
    const kinds = await ev(() => DUMEN.SM.cur.enc.candidates.map((c) => c.type));
    let idx = kinds.indexOf('fish'); if (idx < 0) idx = 0;
    const [sx, sy] = await ev((i) => { const c = DUMEN.SM.cur, v = DUMEN.UI.view; const [x, y] = c.silPos(i, c.t + 0.02); return [v.offX + x * v.scale, v.offY + y * v.scale]; }, idx);
    await page.mouse.click(sx, sy); await page.waitForTimeout(150);
    const st = await ev(() => DUMEN.SM.cur.state);
    if (st === 'FIGHT') {
      if (round === 0) await page.screenshot({ path: path.join(OUT, '02_fight.png') });
      const [rx, ry] = await center('.btn.reel');
      let down = false;
      for (let i = 0; i < 1200; i++) {
        const s = await ev(() => { const c = DUMEN.SM.cur; return c.sim ? Object.assign(c.sim.snapshot(), { st: c.state }) : { st: c.state }; });
        if (s.st !== 'FIGHT') break;
        if (s.canPull) { if (down) { await page.mouse.up(); down = false; } await tap('.btn.pull'); break; }
        const want = s.tension < 0.45 ? true : s.tension > 0.75 ? false : down;
        if (want !== down) { if (want) { await page.mouse.move(rx, ry); await page.mouse.down(); } else await page.mouse.up(); down = want; }
        await page.waitForTimeout(40);
      }
      if (down) await page.mouse.up();
    } else if (st === 'TREASURE') {
      // önceden basılı parmak: basılıyken hazine açılmamalı
      await page.waitForTimeout(200);
      ok(await ev(() => !DUMEN.SM.cur.bar.done), 'Hazine barı kendiliğinden durmaz');
      await tap('button:has-text("DOKUN")');
      ok(await ev(() => !!DUMEN.SM.cur.bar.done || DUMEN.SM.cur.state === 'RESULT'), 'Hazine DOKUN düğmesiyle durur');
    }
    await page.waitForFunction(() => DUMEN.UI.modalOpen(), null, { timeout: 15000 });
    const title = await page.locator('.modal h2').first().textContent();
    if (/Yakalandı|EFSANEV|BOSS/.test(title)) caught++;
    if (round === 0) await page.screenshot({ path: path.join(OUT, '03_result.png') });
    await tap('.modal button:has-text("Tekrar At")');
    await page.waitForTimeout(300);
  }
  ok(caught >= 1, 'Gerçek pointer ile SAR/ÇEK kullanılarak balık yakalandı (' + caught + ')');
  const fishN = await ev(() => DUMEN.Game.state.inv.fish.length);
  ok(fishN === caught, 'Envanterdeki balık sayısı yakalananla aynı (' + fishN + ')');
  // Kasabaya → Rüstem → çift tıklama ile toplu satış tek işlem
  await tap('button:has-text("Kasabaya Dön")'); await page.waitForTimeout(600);
  await tap('.hot[aria-label="Balık Pazarı"]'); await page.waitForTimeout(600);
  const before = await ev(() => DUMEN.Game.state.wallet.CUR_COIN);
  const expect = await ev(() => { const s = DUMEN.Game.state; return DUMEN.sum(s.inv.fish.filter((f) => DUMEN.Econ.sellableAtRustem(s, f)), (f) => DUMEN.Econ.fishValue(s, f)); });
  const [sx, sy] = await center('button:has-text("Tüm Satılabilirleri Sat")');
  await page.mouse.dblclick(sx, sy); await page.waitForTimeout(400);
  const after = await ev(() => DUMEN.Game.state.wallet.CUR_COIN);
  ok(after - before === expect, 'Çift tıklama tek satış: +' + (after - before) + ' (beklenen ' + expect + ')');
  await page.screenshot({ path: path.join(OUT, '04_rustem.png') });
  // modal açıkken arka plan tıklanamaz
  await tap('button[aria-label="Envanter"]'); await page.waitForTimeout(300);
  await page.mouse.click(200, 400); await page.waitForTimeout(200);
  ok(await ev(() => DUMEN.SM.name) === 'rustem', 'Modal arka plan tıklamasını engeller');
  await ev(() => DUMEN.UI.closeAll());
  // kayıt kalıcılığı
  await ev(() => DUMEN.Game.saveNow());
  const snap = await ev(() => JSON.stringify({ c: DUMEN.Game.state.wallet, col: Object.keys(DUMEN.Game.state.collection).length }));
  await page.reload(); await page.waitForTimeout(900);
  ok(!(await page.locator('button[aria-label="Devam Et"]').isDisabled()), 'Kayıt varken Devam Et aktif');
  await tap('button[aria-label="Devam Et"]'); await page.waitForTimeout(900);
  ok(await ev(() => JSON.stringify({ c: DUMEN.Game.state.wallet, col: Object.keys(DUMEN.Game.state.collection).length })) === snap, 'Yeniden açılışta cüzdan ve koleksiyon korunur');
  // mobil boyutlar
  for (const [w, h, name] of [[844, 390, '05_phone_19.5x9'], [915, 412, '06_phone_20x9'], [1024, 768, '07_tablet_4x3']]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
    const v = await ev(() => DUMEN.UI.view);
    const tapPx = await ev(() => { const b = document.querySelector('.btn'); return b ? b.getBoundingClientRect().height : 0; });
    ok(tapPx >= 44, name + ': dokunma hedefi ≥44px (' + tapPx.toFixed(0) + ')');
    ok(v.W >= 1920 && v.H >= 1080, name + ': mantıksal alan ' + v.W + '×' + v.H);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(400);
  ok(await ev(() => document.body.classList.contains('portrait')), 'Dikey telefonda "yatay çevir" katmanı');
  await page.screenshot({ path: path.join(OUT, '08_portrait.png') });
  ok(errors.length === 0, 'Konsol/sayfa hatası yok: ' + errors.slice(0, 3).join(' | '));
  console.log(pass + ' geçti, ' + fail + ' başarısız');
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
