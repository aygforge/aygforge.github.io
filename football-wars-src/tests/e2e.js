// Full end-to-end: file:// -> pick teams -> click start -> live battle -> automatic export -> download -> verify.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-aygforge-github-io/191a4712-9ac7-5807-a3c4-be4d74e74dc3/scratchpad/e2e';
fs.mkdirSync(OUT, { recursive: true });
const CAPS = (process.env.CAPS || '').split(',');
const matches = (process.env.MATCHES || 'domestic_league:TUR_GALATASARAY:TUR_FENERBAHCE:123456').split(',').map(s => s.split(':'));
const RES = process.env.RES || '1080';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--expose-gc'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => logs.push('pageerror: ' + e.message));
  p.on('request', r => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) logs.push('EXTERNAL: ' + u); });
  await p.goto('file://' + path.resolve(__dirname, '../../football-wars-v3.html'));
  await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready && window.FW_APP.st.caps, null, { timeout: 60000 });
  await p.click('#adv summary');
  await p.click(`#resSeg label:has(input[value="${RES}"])`);
  const results = [];
  for (let mi = 0; mi < matches.length; mi++) {
    const [mode, a, bb, seed] = matches[mi];
    const capMode = CAPS[mi] || '';
    await p.evaluate((cm) => { const c = window.FW_APP.st.caps; window.__origCaps = window.__origCaps || JSON.parse(JSON.stringify(c));
      const o = JSON.parse(JSON.stringify(window.__origCaps)); Object.assign(c, o);
      if (cm === 'noh264' || cm === 'nowc' || cm === 'webmonly') for (const k in c.h264) c.h264[k] = null;
      if (cm === 'nowc' || cm === 'webmonly') for (const k in c.vp) c.vp[k] = null;
      if (cm === 'webmonly' || cm === 'vponly') c.mrMp4 = null; if (cm === 'vponly') for (const k in c.h264) c.h264[k] = null; }, capMode);
    if (mode === 'custom_exhibition') await p.evaluate(() => { const m = document.getElementById('mixed'); if (!m.checked) m.click(); });
    await p.evaluate(({ mode, a, bb }) => { const A = window.FW_APP; A.setMode(mode); A.choose('A', a); A.choose('B', bb); }, { mode, a, bb });
    await p.fill('#seed', seed || '');
    let SET = JSON.parse(process.env.SET || '{}'); if (Array.isArray(SET)) SET = SET[mi] || {};
    await p.evaluate((S) => { const r = (n, v) => { const el = document.querySelector(`input[name=${n}][value=${v}]`); if (el) { el.checked = true; el.dispatchEvent(new Event('change')); } };
      if (S.style) r('vstyle', S.style); if (S.cam) r('camint', S.cam);
      if (S.smartCam != null) { const c = document.getElementById('optSmartCam'); c.checked = S.smartCam; c.dispatchEvent(new Event('change')); }
      if (S.checks) for (const [id, v] of Object.entries(S.checks)) { const c = document.getElementById(id); if (c.checked !== v) { c.checked = v; c.dispatchEvent(new Event('change')); } }
      if (S.res) { const el = document.querySelector(`input[name=res][value="${S.res}"]`); el.checked = true; el.dispatchEvent(new Event('change')); }
      if (S.story != null) { const c = document.getElementById('optStory'); c.checked = S.story; c.dispatchEvent(new Event('change')); } }, SET);
    const t0 = Date.now();
    const why = await p.evaluate(() => [document.getElementById('startReason').textContent, document.getElementById('btnStart').disabled, window.FW_APP.st.phase, window.FW_APP.st.a && window.FW_APP.st.a.id, window.FW_APP.st.b && window.FW_APP.st.b.id]);
    if (why[1]) console.log('START DISABLED', JSON.stringify(why));
    await p.click('#btnStart', { timeout: 15000 });
    await p.waitForFunction(() => window.FW_APP.st.phase === 'live', null, { timeout: 20000 });
    await p.waitForTimeout(5200);
    await p.screenshot({ path: `${OUT}/${a}_live.png` });
    await p.waitForFunction(() => window.FW_APP.st.phase === 'encoding' || window.FW_APP.st.phase === 'done' || window.FW_APP.st.phase === 'error', null, { timeout: 180000 });
    const tLive = (Date.now() - t0) / 1000;
    await p.waitForFunction(() => window.FW_APP.st.phase === 'done' || window.FW_APP.st.phase === 'error', null, { timeout: 900000 });
    const tAll = (Date.now() - t0) / 1000;
    await p.waitForTimeout(1500);
    const info = await p.evaluate(() => ({
      phase: window.FW_APP.st.phase, lastLive: window.FW_APP.DIAG.lastLive, lastExport: window.FW_APP.DIAG.lastExport,
      msgs: [...document.querySelectorAll('#statusMsgs .msg')].map(e => e.className.replace('msg', '').trim() + ': ' + e.textContent),
      videoInfo: document.getElementById('videoInfo').innerText, dl: document.getElementById('btnDownload').textContent,
      href: document.getElementById('btnDownload').getAttribute('href'), name: document.getElementById('btnDownload').getAttribute('download'),
      res: document.getElementById('resKv').innerText, vdur: document.getElementById('resVideo').duration, vErr: document.getElementById('resVideo').error && document.getElementById('resVideo').error.code,
      urls: window.FW_APP.DIAG.urls.size, encOpen: window.FW_APP.DIAG.encoderOpen
    }));
    await p.screenshot({ path: `${OUT}/${a}_done.png`, fullPage: true });
    let file = null;
    if (info.phase === 'done') {
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnDownload')]);
      file = `${OUT}/${dl.suggestedFilename()}`; await dl.saveAs(file);
    }
    // play the preview for a moment to prove the in-page player works
    const play = await p.evaluate(async () => { const v = document.getElementById('resVideo'); v.muted = true; try { await v.play(); await new Promise(r => setTimeout(r, 1200)); const t = v.currentTime; v.pause(); return { ok: true, t }; } catch (e) { return { ok: false, e: e.message }; } });
    const heap = await p.evaluate(async () => { if (window.gc) { gc(); await new Promise(r => setTimeout(r, 300)); gc(); } return performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null; });
    info.heapMB = heap;
    results.push({ mode, a, b: bb, seed, tLive, tAll, info, file, play });
    console.log(JSON.stringify({ capMode, path: info.lastExport && info.lastExport.path, a, b: bb, seed, tLive: tLive.toFixed(1), tAll: tAll.toFixed(1), phase: info.phase, file: file && path.basename(file), play: play.ok, size: info.lastExport && info.lastExport.size, style: info.lastExport && info.lastExport.style, natural: info.lastExport && +info.lastExport.natural.toFixed(2), edited: info.lastExport && +info.lastExport.edited.toFixed(2), endOut: info.lastExport && +info.lastExport.endOut.toFixed(3), hl: info.lastExport && info.lastExport.highlights, alerts: info.lastExport && info.lastExport.alerts.join(','), alertsSame: info.lastExport && info.lastExport.alertsSame, editInfo: await p.evaluate(() => document.getElementById('editInfo').innerText), verified: info.lastExport && info.lastExport.verified, hash: info.lastLive && info.lastLive.hash.toString(16), winner: info.lastLive && info.lastLive.winner, endT: info.lastLive && info.lastLive.endT.toFixed(3), start: info.lastLive && info.lastLive.start, vdur: info.vdur, urls: info.urls, encOpen: info.encOpen, heapMB: info.heapMB, cover: await p.evaluate(() => window.FW_APP.DIAG.lastCover), msgs: info.msgs.filter(m => !m.startsWith('ok: Preview')) }));
  }
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
  console.log('LOGS', JSON.stringify(logs));
  await b.close();
})().catch(e => { console.error('E2E FAILED', e); process.exit(1); });
