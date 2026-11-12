// Acceptance A in the real browser: V1 html vs V2 html (observer attached) -> identical battle summaries.
const { chromium } = require('playwright'); const path = require('path');
const pairs = [['TUR_GALATASARAY','TUR_FENERBAHCE'],['ESP_REAL_MADRID','ESP_FC_BARCELONA'],['NAT_TURKIYE','NAT_GERMANY'],['NAT_SPAIN','NAT_SAN_MARINO']];
const seeds = [123456, 2024, 777, 99991, 31337];
const run = async (b, file, v2) => { const p = await b.newPage(); await p.goto('file://' + path.resolve(__dirname, '../..', file)); await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready);
  const r = await p.evaluate(({ pairs, seeds, v2 }) => { const all = [...FW_MASTER_DB.clubs, ...FW_MASTER_DB.national_teams]; const by = id => all.find(t => t.id === id); const out = [];
    for (const [a, b] of pairs) for (const seed of seeds) for (const duration of ['standard', 'long']) { const w = FWEngine.createWorld({ seed, teamA: by(a), teamB: by(b), cfg: FW_ENGINE_CONFIG, duration, fxLevel: 1 });
      if (v2) w.observer = FWDirector.createObserver({ smartCam: true, intensity: 'cinematic' });
      while (w.phase !== 'ended') FWEngine.step(w); FWEngine.advanceTo(w, w.endT + w.outroLen); out.push(JSON.stringify(FWEngine.summary(w))); } return out; }, { pairs, seeds, v2 });
  await p.close(); return r; };
(async () => { const b = await chromium.launch(); const v1 = await run(b, 'football-wars.html', false), v2 = await run(b, 'football-wars-v2.html', true);
  let same = 0; v1.forEach((x, i) => { if (x === v2[i]) same++; else console.log('DIFF', x, v2[i]); });
  const S = v1.map(x => JSON.parse(x)); console.log(`browser V1 vs V2: ${same}/${v1.length} identical (winner, survivors, endT, hash, events, rules)`);
  console.log('battle seconds range', Math.min(...S.map(s => s.battleSeconds)), '-', Math.max(...S.map(s => s.battleSeconds)), '| survivors range', Math.min(...S.map(s => s.survivors)), '-', Math.max(...S.map(s => s.survivors)));
  await b.close(); })();
