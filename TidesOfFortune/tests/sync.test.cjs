// Tarayıcı regresyon testi: node tests/sync.test.cjs [html] [run sayısı]
// Gerçek seyir akışında sahne/olay uyuşmazlığı taraması.
// Her karşılaşmada: YAKLAŞMA başlarken sahnenin kurulduğu olay (director.eventId) ile KARAR anındaki aktif olay karşılaştırılır.
// Senaryolar: (a) şanslı olay etkisi (buffs.lucky) açık, (b) kuyruktaki bir hayvan/tayfa olayının koşulu yaklaşmadan önce bozulur.
const { chromium } = require('playwright'); const path = require('path');
const file = process.argv[2] || path.resolve(__dirname, '../dist/TidesOfFortune.html'); const N = Number(process.argv[3] || 8);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 915, height: 412 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const out = { encounters: 0, mismatch: [], errs };
  for (let i = 0; i < N; i++) {
    await p.goto('file://' + path.resolve(file) + '?hiz=6'); await p.waitForTimeout(500);
    await p.evaluate((i) => {
      const { core, ui } = window.__tof; core.meta.tutorialDone = true;
      core.newRun('MISM' + i);
      let g = 0; while (core.run.phase === 'arrival' && g++ < 10) { const a = core.run.arrival; if (a.current && !a.current.result) core.choose('o0'); else core.arrivalNext(); }
      core.run.gold = 900;
      core.depart(0);
      const v = core.run.voyage;
      // (a) şanslı olay: sıradaki normal girdi tetiklenince başka bir şans olayıyla değişecek
      if (i % 2 === 0) { core.run.buffs.lucky = true; v.queue[0] = { id: 'EVT_F_08', src: 'normal' }; }
      // (b) geçersizleşen girdi: Tarçın olayı kuyrukta ama Tarçın gemide değil
      else { core.run.pets = []; v.queue.splice(0, 0, { id: 'EVT_PET_TARCIN_NOSE', src: 'pet' }); }
      ui.view = 'game'; ui.sceneKey = null; ui.render();
      window.__mm = { log: [], approachId: null };
    }, i);
    const t0 = Date.now(); let lastPhase = '';
    while (Date.now() - t0 < 45000) {
      const st = await p.evaluate(() => { const d = window.__tof.ui.director; const cur = window.__tof.core.host()?.current; return { ph: d.phase, eid: d.eventId, cid: cur?.id || null, res: !!cur?.result, runPh: window.__tof.core.run?.phase }; });
      if (st.ph === 'ENCOUNTER_APPROACH' && lastPhase !== 'ENCOUNTER_APPROACH') await p.evaluate((eid) => { window.__mm.approachId = eid; }, st.eid);
      if (st.ph === 'PLAYER_DECISION' && lastPhase !== 'PLAYER_DECISION') {
        out.encounters++;
        const a = await p.evaluate(() => window.__mm.approachId);
        if (a !== st.cid || st.eid !== st.cid) out.mismatch.push({ seed: 'MISM' + i, yaklasmaSahnesi: a, kararOlayi: st.cid });
        await p.evaluate(() => { const d = window.__tof.ui.director; for (const k of ['o0', 'o1', 'o2', 'o3', 'o4']) { const r = d.choose(k); if (r && r.ok) break; } });
      }
      if (st.ph === 'OUTCOME_ANIMATION' && st.res) { const idle = await p.evaluate(() => { const d = window.__tof.ui.director; return !d.steps.length && d.stepDur < 0 && !d.after; }); if (idle) await p.evaluate(() => window.__tof.ui.director.continueAfter()); }
      if (st.runPh === 'harbor' || st.runPh === 'arrival') break;
      lastPhase = st.ph;
      await p.waitForTimeout(80);
    }
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
  const ok = out.encounters > 0 && !out.mismatch.length && !errs.length;
  console.log(ok ? `GEÇTİ: ${out.encounters} karşılaşmada sahne = olay` : 'KALDI');
  process.exit(ok ? 0 : 1);
})();
