// Sahne çıkışı denetimi: olay bitip "Devam" denildikten sonra sahne nesnelerinin nasıl ayrıldığını ölçer.
//  - pop: ekranda görünen bir sahne nesnesinin tek karede yok olması (kayarak/solarak değil)
//  - sıra (denizde serbest duran şamandıra/yüzen tahta/balık vb. hariç): büyük nesneler (gemi, sandal, sal...) ekrandan çıktıktan sonra hâlâ ortada kalan
//    güvertedeki yabancı NPC'ler, ipler/kancalar/küçük nesneler (saniye olarak)
// Kullanım: node tools/exitaudit.cjs [EVENT_ID] [seçenek]   (PREFIX=, SHARD=i/n desteklenir)
const { chromium } = require('playwright');
const path = require('path');
const [, , onlyId, onlyOpt] = process.argv;
const SPEED = Number(process.env.SPEED || 4);
const FREE = ['raceBuoy', 'swimmer', 'timber', 'barrel', 'bottle', 'iceBit', 'iceFloes', 'jumpFish', 'gull', 'birds', 'fishSchool', 'tinyFish', 'shoal'];
const BIG = ['ship', 'boat', 'rowboat', 'raft', 'tentBoat', 'wreck', 'fort', 'cave', 'island', 'lighthouseIsle', 'workshopIsle', 'treasureIsle'];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const URL = 'file://' + path.resolve(process.env.HTML || path.join(__dirname, '../dist/TidesOfFortune.html')) + `?hiz=${SPEED}`;
  await page.goto(URL); await page.waitForTimeout(1000);
  let all = onlyId ? [onlyId] : await page.evaluate(() => window.__tofAllEvents());
  if (process.env.PREFIX) all = all.filter((id) => process.env.PREFIX.split(',').some((p) => id.startsWith(p)));
  if (process.env.SHARD) { const [i, n] = process.env.SHARD.split('/').map(Number); all = all.filter((_, j) => j % n === i); }
  const rows = [];
  for (const id of all) {
    const nOpts = await page.evaluate((id) => window.__tofEventInfo(id).options, id);
    const list = onlyOpt != null ? [Number(onlyOpt)] : [...Array(nOpts).keys()];
    for (const k of list) {
      errors.length = 0;
      await page.goto(URL); await page.waitForTimeout(600);
      const ok = await page.evaluate(({ id, k }) => window.__tofForceEvent(id, k), { id, k });
      if (!ok) continue;
      await page.evaluate(({ BIG, FREE }) => {
        const A = (window.__aud = { on: false, pops: [], bigGoneAt: null, lingerTemps: 0, lingerSmall: {}, t: 0, done: false });
        let prev = new Map();
        const f = (now) => {
          const { world: w, ui } = window.__tof; const d = ui.director;
          if (A.on && !A.done) {
            const dt = A.last ? (now - A.last) / 1000 : 0; A.t += dt;
            const W = w.W, H = w.H; const cur = new Map();
            for (const e of w.entities) {
              if (e.persist || e.local || e.screen || (e.layer || 0) >= 3 || e.kind === 'wave') continue;
              const s = w.toScreen(e.x, e.y, W, H);
              const vis = (e.alpha ?? 1) > 0.05 && s.x > -40 && s.x < W + 40 && s.y > -40 && s.y < H + 40;
              if (vis) cur.set(e, { id: e.id, kind: e.kind, a: e.alpha ?? 1 });
            }
            for (const [e, p] of prev) if (!cur.has(e) && !w.entities.includes(e) && p.a > 0.3) A.pops.push(`${p.kind}#${p.id}@${d.phase}`);
            const isBig = (k) => BIG.includes(k) || /boat|ship|raft|wreck|isle|island/i.test(k || '');
            const bigVis = [...cur.values()].some((p) => isBig(p.kind));
            const anyBigEver = A.sawBig || bigVis; A.sawBig = anyBigEver;
            if (anyBigEver && !bigVis && A.bigGoneAt == null) A.bigGoneAt = A.t;
            if (A.bigGoneAt != null) {
              if (w.deck.temp.length) A.lingerTemps += dt;
              for (const p of cur.values()) if (!isBig(p.kind) && !FREE.includes(p.kind)) A.lingerSmall[p.kind] = (A.lingerSmall[p.kind] || 0) + dt;
            }
            prev = cur;
            if (A.t > 0.5 && /APPROACH|INTRO|DECISION/.test(d.phase)) A.done = true; // sonraki olay başladı
            if (d.phase === 'NORMAL_SAILING' && A.t > 1) { A.sailT = (A.sailT || 0) + dt; if (A.sailT > 2.5) A.done = true; }
          }
          A.last = now; requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }, { BIG, FREE });
      const t0 = Date.now(); let chosen = false, exiting = false;
      while (Date.now() - t0 < 40000) {
        const st = await page.evaluate(() => ({ d: window.__tof.ui.director.phase, res: !!window.__tof.core.host()?.current?.result, id: window.__tof.core.host()?.current?.id, cine: !!document.querySelector('.cinematic'), done: window.__aud.done, rp: window.__tof.core.run?.phase }));
        if (st.cine) await page.evaluate(() => document.querySelector('.cinematic .cineBtn')?.click());
        if (st.d === 'PLAYER_DECISION' && !chosen && st.id === id) { chosen = true; const r = await page.evaluate((k) => window.__tof.ui.director.choose('o' + k), k); if (!r.ok) break; }
        if (st.d === 'OUTCOME_ANIMATION' && st.res && !exiting) {
          const idle = await page.evaluate(() => { const d = window.__tof.ui.director; return !d.steps.length && d.stepDur < 0 && !d.after; });
          if (idle) { await page.evaluate(() => { window.__aud.on = true; window.__tof.ui.director.continueAfter(); }); exiting = true; }
        }
        if (exiting && (st.done || st.rp !== 'voyage')) break;
        await page.waitForTimeout(80);
      }
      const A = await page.evaluate(() => window.__aud);
      const small = Object.entries(A.lingerSmall).filter(([, s]) => s > 0.25).map(([k2, s]) => `${k2}:${s.toFixed(1)}s`);
      const row = { sc: `${id} o${k}`, pops: A.pops, temps: +A.lingerTemps.toFixed(1), small, err: errors.slice(0, 1) };
      rows.push(row);
      const bad = row.pops.length || row.temps > 0.2 || small.length || row.err.length;
      console.log(`${bad ? 'SORUN' : 'ok   '} ${row.sc}${row.pops.length ? ' pop=' + row.pops.join(',') : ''}${row.temps > 0.2 ? ' güvertedeKaldı=' + row.temps + 's' : ''}${small.length ? ' geride=' + small.join(',') : ''}${row.err.length ? ' HATA ' + row.err[0] : ''}`);
    }
  }
  await browser.close();
  const bad = rows.filter((r) => r.pops.length || r.temps > 0.2 || r.small.length || r.err.length);
  console.log(`\n${rows.length} senaryo, ${bad.length} sorunlu`);
})();
