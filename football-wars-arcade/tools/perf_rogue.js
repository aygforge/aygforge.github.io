// Frame-time probe in the preinstalled Chromium (software rendering, no GPU): the biggest wave (Boss W5, 100 vs survivors).
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto('file://' + path.join(__dirname, '../FootballWars_Roguelite_Reborn.html')); await p.waitForTimeout(300);
  const r = await p.evaluate(async () => {
    const R = FWRogue, s = FWArcadeUI.st.save; s.highest = 199; for (let l = 1; l < 200; l++) s.completed[l] = { medal: 'clear' };
    for (const k in s.training) s.training[k] = 90; s.leaders = FWLeaders.LEADERS.map(l => l.id); s.cards = FWCards.CARDS.map(c => c.id);
    R.Run.start(s, 200); const run = s.run; run.draft.left = 0; run.draft.offer = null; run.phase = 'ready'; run.wave = 4;
    const snap = R.Run.beginWave(s); FWArcadeUI.liveWave(snap, null);
    await new Promise(res => setTimeout(res, 3500)); // intro + kick-off
    const B = FWArcadeUI.st.battle, t0 = B.w.tick, f0 = performance.now(); let frames = 0, worst = 0, last = performance.now();
    await new Promise(res => { const tick = () => { const n = performance.now(); worst = Math.max(worst, n - last); last = n; frames++; if (n - f0 < 5000) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
    const secs = (performance.now() - f0) / 1000;
    return { units: B.w.units.length, alive: [B.w.teams[0].alive, B.w.teams[1].alive], fps: +(frames / secs).toFixed(1), simRate: +((B.w.tick - t0) / 60 / secs).toFixed(2), worstFrameMs: Math.round(worst) };
  });
  console.log('perf (Boss W5, 393×852, software rendering):', JSON.stringify(r));
  await b.close();
})();
