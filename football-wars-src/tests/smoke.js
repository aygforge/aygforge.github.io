const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-aygforge-github-io/191a4712-9ac7-5807-a3c4-be4d74e74dc3/scratchpad/shots';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const logs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => logs.push('pageerror: ' + e.message));
  p.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) logs.push('EXTERNAL REQUEST: ' + r.url()); });
  await p.goto('file://' + path.resolve(__dirname, '../../football-wars-v2.html'));
  await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const A = window.FW_APP;
    const s = q => A.search(q, {}).slice(0, 3).map(t => t.id);
    return {
      checks: A.dataChecks().map(c => c.k + '=' + c.v + (c.ok ? ' OK' : ' FAIL')),
      fener: s('Fenerbahçe'), fenerbahce: s('fenerbahce'), FB: s('FB'), barca: s('barca'), almanya: s('almanya'), turkey: s('turkey'), besiktas: s('besiktas'), atletico: s('atletico'), gs: s('GS'),
      clubsInTur: A.search('', { type: 'club', league: 'TUR_SUPER' }).length, allN: A.search('', {}).length,
      fmt: document.getElementById('fmtChip').textContent, db: document.getElementById('dbChip').textContent,
      startDisabled: document.getElementById('btnStart').disabled, reason: document.getElementById('startReason').textContent,
      self: A.validate({ id: 'X', type: 'club', league_id: 'a' }, { id: 'X', type: 'club', league_id: 'a' }, 'domestic_league', false)
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await p.screenshot({ path: OUT + '/ui.png' });
  console.log('LOGS', logs);
  await b.close();
})();
