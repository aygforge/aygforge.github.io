const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = '/tmp/claude-0/-home-user-aygforge-github-io/191a4712-9ac7-5807-a3c4-be4d74e74dc3/scratchpad/ui'; fs.mkdirSync(OUT, { recursive: true });
const URL_ = 'file://' + path.resolve(__dirname, '../../football-wars.html');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const logs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') logs.push(m.text()); }); p.on('pageerror', e => logs.push(e.message));
  await p.goto(URL_);
  await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready && window.FW_APP.st.caps);
  // logo upload (generate a PNG in-page, feed it through the real file input)
  const png = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#123'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#f5c518'; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.fill(); g.fillStyle = '#123'; g.font = 'bold 50px sans-serif'; g.fillText('UL', 30, 82); return c.toDataURL().split(',')[1]; });
  fs.writeFileSync(OUT + '/test_logo.png', Buffer.from(png, 'base64'));
  await p.click('#cardA [data-up]');
  await p.setInputFiles('#logoFile', OUT + '/test_logo.png');
  await p.waitForFunction(() => document.querySelector('#cardA .badge') && document.querySelector('#cardA .badge').textContent === 'YOUR LOGO', null, { timeout: 10000 });
  console.log('logo upload ok');
  // 60 fps, short battle, 720p
  await p.click('#adv summary');
  await p.click('#resSeg label:has(input[value="720"])'); await p.click('#fpsSeg label:has(input[value="60"])'); await p.click('#durSeg label:has(input[value="short"])');
  await p.fill('#seed', '2024');
  await p.click('#btnStart');
  await p.waitForFunction(() => ['done', 'error'].includes(window.FW_APP.st.phase), null, { timeout: 600000 });
  await p.waitForTimeout(1000);
  const r = await p.evaluate(() => ({ phase: window.FW_APP.st.phase, ex: window.FW_APP.DIAG.lastExport, live: window.FW_APP.DIAG.lastLive, a: document.getElementById('liveA').textContent, b: document.getElementById('liveB').textContent, badge: document.getElementById('stateBadge').textContent }));
  console.log(JSON.stringify(r));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnDownload')]); const f = OUT + '/' + dl.suggestedFilename(); await dl.saveAs(f); console.log('saved', f);
  await p.locator('.stage').screenshot({ path: OUT + '/stage_done.png' });
  // diagnostics + self test
  await p.click('#btnDiag'); await p.click('#btnSelfTest'); await p.waitForFunction(() => /different seed/.test(document.getElementById('selfTest').textContent), null, { timeout: 60000 });
  console.log('SELFTEST', await p.evaluate(() => document.getElementById('selfTest').innerText));
  await p.screenshot({ path: OUT + '/diag.png', fullPage: false });
  await p.click('#modalDiag [data-close]'); await p.click('#btnAbout'); await p.screenshot({ path: OUT + '/about.png' }); await p.click('#modalAbout [data-close]');
  // mobile
  const m = await b.newContext({ ...require('playwright').devices['Pixel 7'] }); const mp = await m.newPage();
  mp.on('pageerror', e => logs.push('mobile: ' + e.message));
  await mp.goto(URL_); await mp.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready); await mp.waitForTimeout(800);
  const mres = await mp.evaluate(() => ({ res: document.querySelector('input[name=res]:checked').value, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log('mobile', JSON.stringify(mres));
  await mp.screenshot({ path: OUT + '/mobile.png' });
  console.log('ERRORS', JSON.stringify(logs));
  await b.close();
})().catch(e => { console.error('UI FAILED', e); process.exit(1); });
