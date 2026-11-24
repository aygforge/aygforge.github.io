const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(process.argv[2]); await p.waitForSelector('[data-act="new"]');
await p.click('[data-act="new"][data-v="1"]'); await p.fill('#cName', 'Season Runners'); await p.fill('#cShort', 'SRN'); await p.fill('#cCity', 'Runham');
await p.click('[data-act="createNext"]'); await p.click('[data-act="createGo"]'); await p.waitForSelector('.topbar'); await p.click('[data-act="tutSkip"]');
await p.evaluate(() => { window.__renders = 0; new MutationObserver(() => window.__renders++).observe(document.getElementById('app'), { childList: true }); });
const t0 = Date.now(); let matches = 0;
for (let guard = 0; guard < 120; guard++) {
  const sub = await p.evaluate(() => document.querySelector('.topbar .sub') && document.querySelector('.topbar .sub').textContent);
  if (/Season 2/.test(sub || '')) break;
  await p.evaluate(() => document.querySelector('nav.main [data-v="dashboard"]').click());
  await p.waitForSelector('[data-act="nextweek"]', { timeout: 30000 });
  const hasPrep = await p.evaluate(() => { const e = document.querySelector('[data-act="prep"]'); if (e) e.click(); return !!e; });
  if (hasPrep) {
    await p.waitForSelector('[data-act="kick"][data-v="quick"]');
    const r0 = await p.evaluate(() => window.__renders); await p.waitForTimeout(400); const r1 = await p.evaluate(() => window.__renders);
    if (r1 - r0 > 2) console.log('RENDER STORM on prep', r1 - r0, await p.evaluate(() => window.__FWC.view));
    const st = await p.evaluate(() => ({ view: window.__FWC.view, busy: window.__FWC.busy, has: !!document.querySelector('[data-act="kick"][data-v="quick"]'), sub: document.querySelector('.topbar .sub').textContent }));
    if (!st.has) { console.log('NOQUICK', JSON.stringify(st)); await p.screenshot({ path: 'shots/noquick.png' }); break; }
    await p.evaluate(() => document.querySelector('[data-act="kick"][data-v="quick"]').click());
    await p.waitForFunction(() => window.__FWC.view === 'report', null, { timeout: 60000 }); matches++; continue; }
  const before = sub; const ok = await p.evaluate(() => { const b = document.querySelector('[data-act="nextweek"]'); if (b) b.click(); return !!b; });
  if (!ok) { await p.screenshot({ path: 'shots/stuck.png' }); console.log('STUCK', sub, (await p.evaluate(() => document.querySelector('main').innerText)).slice(0, 600)); break; }
  await p.waitForFunction(b => { const s = document.querySelector('.topbar .sub'); return s && s.textContent !== b; }, before, { timeout: 180000 });
}
await p.waitForTimeout(500); await p.screenshot({ path: 'shots/season-end.png' });
const st = await p.evaluate(() => { const S = window.__FWC.S; return { season: S.season, week: S.week, hist: S.history.seasons, div: S.clubs.PLAYER.division, budget: S.clubs.PLAYER.budget, divs: Object.values(S.divisions).map(d => d.length), fixtures: Object.keys(S.fixtures).length }; });
await p.click('[data-act="nav"][data-v="history"]'); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/history.png' });
console.log(JSON.stringify({ errs, minutes: ((Date.now() - t0) / 60000).toFixed(1), matches, ...st }, null, 1)); await b.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
