// Finds (in the real browser engine) battles that end in a real 1v1 duel, with last-hope only, and with multi-KO final ticks.
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '../../football-wars-v3.html')); await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready);
  const r = await p.evaluate(() => { const all = [...FW_MASTER_DB.clubs, ...FW_MASTER_DB.national_teams]; const rng = new FWEngine.Rng(77); const out = { duel: [], hopeOnly: [], multi: [], n: 0 };
    for (let i = 0; i < 220 && (out.duel.length < 3 || out.multi.length < 2); i++) { const a = all[rng.int(all.length)], b = all[rng.int(all.length)]; if (a === b) continue; const seed = rng.int(999999999) + 1;
      const w = FWEngine.createWorld({ seed, teamA: a, teamB: b, cfg: FW_ENGINE_CONFIG, duration: 'standard', fxLevel: 1 }); w.observer = FWDirector.createObserver({}); while (w.phase !== 'ended') FWEngine.step(w); out.n++;
      const st = w.observer.state, rec = [a.id, b.id, seed, w.teams[w.winner].alive];
      const lastKOs = w.events.filter(e => e.type === FWEngine.EV.KO && e.k === w.endTick).length;
      if (st.duel) out.duel.push(rec); else if (st.hope && out.hopeOnly.length < 2) out.hopeOnly.push(rec);
      if (lastKOs > 1) out.multi.push(rec.concat([lastKOs, !!st.duel])); }
    return out; });
  console.log(JSON.stringify(r)); await b.close(); })();
