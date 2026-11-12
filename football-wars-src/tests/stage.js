// renders specific timeline moments of a battle straight to PNG (for visual inspection)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = '/tmp/claude-0/-home-user-aygforge-github-io/191a4712-9ac7-5807-a3c4-be4d74e74dc3/scratchpad/shots';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  const logs = []; p.on('pageerror', e => logs.push(e.message)); p.on('console', m => { if (m.type() === 'error') logs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../../football-wars.html'));
  await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready);
  const a = process.argv[2] || 'TUR_GALATASARAY', bb = process.argv[3] || 'TUR_FENERBAHCE', times = (process.argv[4] || '0.2,0.75,1.3,1.8,2.3,8,20').split(',').map(Number);
  const res = await p.evaluate(async ({ a, bb, times }) => {
    const A = window.FW_APP; A.setMode('custom_exhibition'); document.getElementById('mixed').click(); A.choose('A', a); A.choose('B', bb);
    const DB = window.FW_MASTER_DB; const all = [...DB.clubs, ...DB.national_teams]; const ta = all.find(t => t.id === a), tb = all.find(t => t.id === bb);
    const S = FWSprites, E = FWEngine, R = FWRender;
    const kits = S.makeKits(ta, tb); const atl = [S.buildAtlas(ta, kits[0]), S.buildAtlas(tb, kits[1])];
    const thumbs = [...document.querySelectorAll('#cardA img.logo, #cardB img.logo')].map(i => i.src);
    const mkLogo = (src) => new Promise(r => { const im = new Image(); im.onload = () => { const s = document.createElement('canvas'); s.width = s.height = 26; s.getContext('2d').drawImage(im, 0, 0, 26, 26); const bg = document.createElement('canvas'); bg.width = bg.height = 96; bg.getContext('2d').drawImage(im, 0, 0, 96, 96); r({ small: s, big: bg }); }; im.src = src; });
    const logos = [await mkLogo(thumbs[0]), await mkLogo(thumbs[1])];
    const w = E.createWorld({ seed: 4242, teamA: ta, teamB: tb, cfg: window.FW_ENGINE_CONFIG, duration: 'standard', fxLevel: 1 });
    const rr = R.createRenderer({ world: w, teams: [ta, tb], kits, atlases: atl, logos, lang: 'tr', labels: true, modeLabel: 'SÜPER LİG', fictional: false });
    const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920; const ctx = cv.getContext('2d');
    const out = [];
    for (const T of times) { E.advanceTo(w, T); rr.render(ctx, T, 1080, 1920); out.push([T, cv.toDataURL('image/png')]); }
    // run to end and capture outro
    while (w.phase !== 'ended') E.step(w);
    for (const dt of [0.2, 1.2, 2.6]) { const T = w.endT + dt; E.advanceTo(w, T); rr.render(ctx, T, 1080, 1920); out.push(['end+' + dt, cv.toDataURL('image/png')]); }
    // atlas dump
    out.push(['atlasA', atl[0].canvas.toDataURL()]);
    return { out, endT: w.endT, winner: w.winner };
  }, { a, bb, times });
  for (const [t, d] of res.out) fs.writeFileSync(`${OUT}/f_${t}.png`, Buffer.from(d.split(',')[1], 'base64'));
  console.log('endT', res.endT, 'winner', res.winner, 'errors', logs);
  await b.close();
})();
