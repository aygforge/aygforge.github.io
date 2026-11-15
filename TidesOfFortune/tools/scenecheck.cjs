// Sahne denetleyici: belirli eventleri zorla tetikler, her seçeneği oynatır, JS hatası / takılma arar,
// istenirse ekran görüntüsü alır. Kullanım:
//   node tools/scenecheck.cjs                       → tüm eventler, tüm seçenekler (hızlı, hata taraması)
//   node tools/scenecheck.cjs EVT_D_05 1 shots      → tek event, tek seçenek, ekran görüntüleri (docs/scenes/)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , onlyId, onlyOpt, shotsArg] = process.argv;
const SHOTS = shotsArg === 'shots';
const SPEED = SHOTS ? 1 : 6;
const OUT = path.resolve(__dirname, '../docs/scenes');
// DONE=dosya: daha önce geçen senaryoları atla (uzun taramayı bölmek için)
const DONE = new Set(process.env.DONE ? fs.readFileSync(process.env.DONE, 'utf8').split('\n').filter(Boolean) : []);
if (SHOTS) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: SHOTS ? 2 : 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../dist/TidesOfFortune.html') + `?hiz=${SPEED}`);
  await page.waitForTimeout(1200);
  const ids = await page.evaluate((only) => {
    const ev = window.__tof.core.constructor && window.__tofEvents;
    return only ? [only] : null;
  }, onlyId || null);
  let all = ids || (await page.evaluate(() => window.__tofAllEvents()));
  if (process.env.PREFIX) all = all.filter((id) => process.env.PREFIX.split(',').some((p) => id.startsWith(p)));
  // paralel çalıştırma: SHARD=i/n
  if (process.env.SHARD) { const [i, n] = process.env.SHARD.split('/').map(Number); all = all.filter((_, j) => j % n === i); }
  const report = [];
  for (const id of all) {
    const nOpts = await page.evaluate((id) => window.__tofEventInfo(id).options, id);
    const list = onlyOpt != null && onlyId ? [Number(onlyOpt)] : [...Array(nOpts).keys(), 'auto'];
    for (const k of list) {
      if (DONE.has(`${id} ${k === 'auto' ? 'auto' : 'o' + k}`)) continue;
      errors.length = 0;
      await page.goto('file://' + path.resolve(__dirname, '../dist/TidesOfFortune.html') + `?hiz=${SPEED}`);
      await page.waitForTimeout(700);
      const ok = await page.evaluate(({ id, k }) => window.__tofForceEvent(id, k), { id, k });
      if (!ok) { report.push(`${id} o${k}: atlandı (tetiklenemedi)`); continue; }
      const t0 = Date.now();
      let phase = '', shot = 0, chosen = false, done = false;
      while (Date.now() - t0 < 60000 / Math.min(SPEED, 3)) {
        const st = await page.evaluate(() => ({ d: window.__tof.ui.director.phase, res: !!window.__tof.core.host()?.current?.result, cur: !!window.__tof.core.host()?.current, id: window.__tof.core.host()?.current?.id, sid: window.__tof.ui.director.eventId, cine: !!document.querySelector('.cinematic') }));
        if (st.cine) { await page.evaluate(() => document.querySelector('.cinematic .cineBtn')?.click()); }
        if (SHOTS && Date.now() - t0 > shot * 1500) { await page.screenshot({ path: path.join(OUT, `${id}_${k}_${String(shot).padStart(2, '0')}.png`) }); shot++; }
        if (st.d === 'PLAYER_DECISION' && !chosen && st.id === id) {
          chosen = true;
          if (k === 'auto') { report.push(`${id} auto: karar ekranı (otomatik çözüm yok)`); done = true; break; }
          const r = await page.evaluate((k) => window.__tof.ui.director.choose('o' + k), k);
          if (!r.ok) { report.push(`${id} o${k}: seçilemedi (${r.reason})`); done = true; break; }
          phase = 'chosen';
        }
        if (st.d === 'OUTCOME_ANIMATION' && st.res && st.id === id) {
          // animasyonun bitmesini bekle: adımlar boşalınca
          const idle = await page.evaluate(() => { const d = window.__tof.ui.director; return !d.steps.length && d.stepDur < 0 && !d.after; });
          if (idle) {
            await page.evaluate(() => window.__tof.ui.director.continueAfter());
            phase = 'exit';
          }
        }
        if (phase === 'exit' && (st.d === 'NORMAL_SAILING' || st.d === 'RESUME_SAILING' || st.d === 'DOCKED' || st.d === 'IDLE')) { done = true; break; }
        await page.waitForTimeout(SHOTS ? 120 : 100);
      }
      const secs = ((Date.now() - t0) / 1000) * SPEED;
      if (!done) console.log('  durum:', JSON.stringify(await page.evaluate(() => { const d = window.__tof.ui.director; const cur = window.__tof.core.host()?.current; return { cur: window.__tof.core.host()?.current?.id, q: window.__tof.core.run?.voyage?.queue.map((x) => x.id).join(','), pos: window.__tof.core.run?.voyage?.pos, phase: d.phase, steps: d.steps.length, stepDur: d.stepDur, after: !!d.after, pending: cur?.result?.pending, runPhase: window.__tof.core.run?.phase }; })));
      report.push(`${id} ${k === 'auto' ? 'auto' : 'o' + k}: ${done ? 'ok' : 'TAKILDI'} ~${secs.toFixed(0)}s${errors.length ? ' HATA: ' + errors.slice(0, 2).join(' | ') : ''}`);
      console.log(report[report.length - 1]);
    }
  }
  await browser.close();
  const bad = report.filter((r) => /TAKILDI|HATA/.test(r));
  console.log(`\n${report.length} senaryo, ${bad.length} sorunlu`);
  process.exit(bad.length ? 1 : 0);
})();
