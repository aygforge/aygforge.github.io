// V2 visual + camera-bounds test: renders whole battles (every 1/15 s of output) and checks the camera view
// never leaves the 360x640 scene, HUD layer untouched; dumps frames around story alerts.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = '/tmp/claude-0/-home-user-aygforge-github-io/191a4712-9ac7-5807-a3c4-be4d74e74dc3/scratchpad/v2'; fs.mkdirSync(OUT, { recursive: true });
const cases = (process.env.CASES || 'domestic_league:TUR_GALATASARAY:TUR_FENERBAHCE:123456:cinematic,national_match:NAT_TURKIYE:NAT_GERMANY:31337:normal,national_match:NAT_SPAIN:NAT_SAN_MARINO:123456:low').split(',').map(x => x.split(':'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  const logs = []; p.on('pageerror', e => logs.push(e.message)); p.on('console', m => { if (m.type() === 'error') logs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../../football-wars-v4.html'));
  await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready);
  for (const [mode, a, bb, seed, cam] of cases) {
    const r = await p.evaluate(async ({ mode, a, bb, seed, cam, process_env_fb }) => {
      const A = window.FW_APP; A.setMode(mode); A.choose('A', a); A.choose('B', bb);
      const set = Object.assign(A.settings(), { camInt: cam, smartCam: true, story: true, style: 'cinematic' });
      // 1) live-like pass at natural time to get the plan
      const m = A.buildMatch(+seed, set); const w = m.world;
      while (w.phase !== 'ended') FWEngine.step(w);
      const plan = FWDirector.buildPlan(w, w.observer.state, { style: 'cinematic' });
      // 2) export-like pass along the edit
      const m2 = A.buildMatch(+seed, set); const ew = m2.world;
      const er = FWRender.createRenderer({ ...m2.rOpts, world: ew, toOut: plan.toOut });
      const cv = document.createElement('canvas'); cv.width = 360; cv.height = 640; const ctx = cv.getContext('2d');
      let bad = 0, frames = 0, zMax = 1, prevZ = 1, maxDz = 0, maxPan = 0, prevV = null; const shots = [];
      const fbT = (process_env_fb ? w.events.filter(e => e.type === FWEngine.EV.GOAL || e.type === FWEngine.EV.SAVE_GOAL || e.type === FWEngine.EV.SHOT_ON_GOAL).slice(0, 6).map(e => plan.toOut(e.t) + (e.type === FWEngine.EV.GOAL ? 0.3 : 0.05)) : []);
      const want = (process_env_fb ? fbT.concat([12, plan.outDur - 0.5]) : w.observer.state.alerts.map(x => plan.toOut(x.t) + 0.35).concat([0.8, 2.6, plan.toOut(w.endT) - 1, plan.outDur - 0.5]));
      for (let o = 0; o < plan.outDur; o += 1 / 15) {
        const s = plan.map(o); FWEngine.advanceTo(ew, s); er.render(ctx, s, 360, 640, o); frames++;
        const v = er.view(); if (v.sx < -1e-6 || v.sy < -1e-6 || v.sx + v.sw > 360 + 1e-6 || v.sy + v.sh > 640 + 1e-6 || v.z < 1) bad++;
        zMax = Math.max(zMax, v.z);
        if (prevV && s > 2.5 && ew.phase === 'battle') { maxDz = Math.max(maxDz, Math.abs(v.z - prevV.z)); maxPan = Math.max(maxPan, Math.hypot(v.sx - prevV.sx, v.sy - prevV.sy)); }
        prevV = v;
        for (const t of want) if (Math.abs(o - t) < 1 / 30) { const c2 = document.createElement('canvas'); c2.width = 720; c2.height = 1280; er.render(c2.getContext('2d'), s, 720, 1280, o); shots.push([o.toFixed(1), c2.toDataURL()]); }
      }
      return { football: w.fb ? FWEngine.fbSummary(w) : null, natural: w.endT + w.outroLen, out: plan.outDur, hl: plan.highlights, alerts: w.observer.state.alerts.map(x => x.type + '@' + x.t.toFixed(1)), clutch: w.observer.state.clutch, survivors: w.teams[w.winner].alive,
        sameHash: (ew.hash >>> 0) === (w.hash >>> 0), alertsSame: JSON.stringify(ew.observer.state.alerts) === JSON.stringify(w.observer.state.alerts), frames, bad, zMax, maxDz, maxPan, shots };
    }, { mode, a, bb, seed, cam, process_env_fb: !!process.env.FB });
    r.shots.forEach(([t, d], i) => fs.writeFileSync(`${OUT}/${a}_${i}_${t}.png`, Buffer.from(d.split(',')[1], 'base64')));
    delete r.shots; console.log(a, bb, seed, cam, JSON.stringify(r));
  }
  console.log('ERRORS', JSON.stringify(logs)); await b.close();
})();
