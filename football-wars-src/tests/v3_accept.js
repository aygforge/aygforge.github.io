// V3 acceptance in the real browser: B determinism (V3 on/off, V1 html vs V3 html), E MVP truth, F momentum live=export,
// G tournament (8/16/32, sources, duplicates, insufficient, mixed, simulate==engine, advance, persist, JSON, PNG), H cover, I render cost.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = '/tmp/claude-0/-home-user-aygforge-github-io/191a4712-9ac7-5807-a3c4-be4d74e74dc3/scratchpad/v3acc'; fs.mkdirSync(OUT, { recursive: true });
const V3 = 'file://' + path.resolve(__dirname, '../../football-wars-v3.html'), V1 = 'file://' + path.resolve(__dirname, '../../football-wars.html');
const pairs = [['TUR_GALATASARAY','TUR_FENERBAHCE'],['ESP_REAL_MADRID','ESP_FC_BARCELONA'],['ITA_INTER','ITA_JUVENTUS'],['NAT_TURKIYE','NAT_GERMANY'],['NAT_SPAIN','NAT_SAN_MARINO'],['ENG_ARSENAL','GRE_VOLOS_NFC']];
const seeds = [123456, 2024, 788276303];
(async () => {
  const b = await chromium.launch(); const errs = [];
  const sim = async (url, mode) => { const p = await b.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(url); await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready);
    const r = await p.evaluate(({ pairs, seeds, mode }) => { const all = [...FW_MASTER_DB.clubs, ...FW_MASTER_DB.national_teams]; const by = id => all.find(t => t.id === id); const out = [];
      for (const [a, b2] of pairs) for (const seed of seeds) { const w = FWEngine.createWorld({ seed, teamA: by(a), teamB: by(b2), cfg: FW_ENGINE_CONFIG, duration: 'standard', fxLevel: 1 });
        if (mode === 'v3on') w.observer = FWDirector.createObserver({ smartCam: true, intensity: 'cinematic', epicFinale: true, mvpStreaks: true });
        while (w.phase !== 'ended') FWEngine.step(w); FWEngine.advanceTo(w, w.endT + w.outroLen);
        const koOrder = w.events.filter(e => e.type === FWEngine.EV.KO).map(e => e.b).join(',');
        const extra = mode === 'v3on' ? JSON.stringify({ mvp: FWStatsV3.mvp(w).overall, tags: w.observer.state.tags, alerts: w.observer.state.alerts }) : '';
        out.push({ s: JSON.stringify(FWEngine.summary(w)), ko: koOrder, extra }); } return out; }, { pairs, seeds, mode });
    await p.close(); return r; };
  const v1 = await sim(V1, 'plain'), off = await sim(V3, 'plain'), on = await sim(V3, 'v3on'), on2 = await sim(V3, 'v3on');
  let eqV1 = 0, eqOn = 0, eqKo = 0, eqRepeat = 0;
  v1.forEach((x, i) => { if (x.s === off[i].s) eqV1++; if (off[i].s === on[i].s) eqOn++; if (x.ko === on[i].ko) eqKo++; if (on[i].extra === on2[i].extra) eqRepeat++; });
  console.log(`B: V1 html vs V3 html (V3 effects OFF): ${eqV1}/${v1.length} identical summaries; V3 OFF vs ON: ${eqOn}/${v1.length}; KO order V1 vs V3-ON: ${eqKo}/${v1.length}; repeat same seed -> same MVP/tags/alerts: ${eqRepeat}/${v1.length}`);
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } }); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(V3); await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready);
  // E + F
  const ef = await p.evaluate(() => { const all = [...FW_MASTER_DB.clubs, ...FW_MASTER_DB.national_teams]; const by = id => all.find(t => t.id === id); const res = { mvpBad: 0, mvpN: 0, momBad: 0, zeroKill: null };
    for (const [a, b2, seed] of [['NED_FC_GRONINGEN','NED_AJAX',154548470],['NAT_SPAIN','NAT_SAN_MARINO',2024],['TUR_GALATASARAY','TUR_FENERBAHCE',123456]]) {
      const mk = () => { const w = FWEngine.createWorld({ seed, teamA: by(a), teamB: by(b2), cfg: FW_ENGINE_CONFIG, duration: 'standard', fxLevel: 1 }); w.observer = FWDirector.createObserver({}); return w; };
      const w1 = mk(), w2 = mk(); const s1 = [], s2 = [];
      while (w1.phase !== 'ended') { FWEngine.step(w1); if (w1.tick % 30 === 0) s1.push(w1.observer.state.mom); }
      // "export" world advanced in uneven jumps (like a sped-up edit) must give identical momentum per tick
      let T = 0; while (w2.phase !== 'ended') { T += 0.037 + (w2.tick % 7) * 0.01; FWEngine.advanceTo(w2, T); }
      const w3 = mk(); while (w3.phase !== 'ended') { FWEngine.step(w3); if (w3.tick % 30 === 0) s2.push(w3.observer.state.mom); }
      if (JSON.stringify(s1) !== JSON.stringify(s2) || w2.observer.state.mom !== w1.observer.state.mom) res.momBad++;
      const M = FWStatsV3.mvp(w1); res.mvpN++;
      for (const r of M.top) { const kills = w1.events.filter(e => e.type === FWEngine.EV.KO && e.a === r.id).length, ast = w1.events.filter(e => e.type === FWEngine.EV.ASSIST && e.a === r.id).length, sv = w1.events.filter(e => e.type === FWEngine.EV.SAVE && e.a === r.id).length;
        if (kills !== r.kills || ast !== r.assists || sv !== r.saves || r.score !== kills * 3 + ast + sv * 2 || w1.units[r.id].role !== r.role) res.mvpBad++; }
      if (M.winnerMvp && M.winnerMvp.side !== w1.winner) res.mvpBad++;
    }
    // zero-kill world: MVP must still be a valid, deterministic unit (tie-break: survived, then lowest id)
    const z = FWEngine.createWorld({ seed: 5, teamA: by('NAT_SPAIN'), teamB: by('NAT_ITALY'), cfg: FW_ENGINE_CONFIG, duration: 'standard' }); z.winner = 0;
    const zm = FWStatsV3.mvp(z); res.zeroKill = { id: zm.overall.id, no: zm.overall.no, role: zm.overall.role, score: zm.overall.score, winnerSide: zm.winnerMvp.side };
    return res; });
  console.log('E/F:', JSON.stringify(ef));
  // G tournament
  const g = await p.evaluate(() => { const T = FWTournamentV3, DB = FW_MASTER_DB, out = {};
    const tryC = (spec) => { try { return T.createTournament(spec, DB); } catch (e) { return 'ERR: ' + e.message; } };
    out.sizes = [8, 16, 32].map(n => { const t = tryC({ size: n, seed: 99, source: { kind: 'clubs' } }); return typeof t === 'string' ? t : [n, t.teams.length, new Set(t.teams).size, t.rounds.length, T.roundName(t, 0)]; });
    out.national32 = (() => { const t = tryC({ size: 32, seed: 7, source: { kind: 'national' } }); return typeof t === 'string' ? t : t.teams.every(id => id.startsWith('NAT_')); })();
    out.leagueShort = tryC({ size: 16, seed: 1, source: { kind: 'league', league: 'SCO_PREM' } });
    out.leagueOk = (() => { const t = tryC({ size: 16, seed: 1, source: { kind: 'league', league: 'TUR_SUPER' } }); return typeof t === 'string' ? t : t.teams.every(id => id.startsWith('TUR_')); })();
    out.dup = tryC({ size: 8, seed: 1, source: { kind: 'manual' }, manual: ['TUR_GALATASARAY','TUR_GALATASARAY','TUR_FENERBAHCE','ESP_REAL_MADRID','ESP_FC_BARCELONA','ITA_INTER','ITA_JUVENTUS','ENG_ARSENAL'] });
    out.short = tryC({ size: 8, seed: 1, source: { kind: 'manual' }, manual: ['TUR_GALATASARAY','TUR_FENERBAHCE'] });
    const mixedList = ['TUR_GALATASARAY','TUR_FENERBAHCE','ESP_REAL_MADRID','ESP_FC_BARCELONA','ITA_INTER','ITA_JUVENTUS','NAT_GERMANY','NAT_SPAIN'];
    out.mixedNo = tryC({ size: 8, seed: 1, source: { kind: 'manual' }, manual: mixedList });
    out.mixedYes = typeof tryC({ size: 8, seed: 1, source: { kind: 'manual' }, manual: mixedList, mixed: true }) === 'object';
    const a1 = tryC({ size: 16, seed: 4242, source: { kind: 'clubs' } }), a2 = tryC({ size: 16, seed: 4242, source: { kind: 'clubs' } });
    out.deterministic = JSON.stringify(a1) === JSON.stringify(a2);
    // simulate whole 8-team bracket through the app (same engine) and cross-check each result with a fresh E.simulate
    const t8 = tryC({ size: 8, seed: 31337, source: { kind: 'national' }, duration: 'standard', name: 'Test Cup' }); window.FW_APP.setTour(t8);
    let mismatch = 0, played = 0;
    for (let ri = 0; ri < t8.rounds.length; ri++) for (let i = 0; i < t8.rounds[ri].length; i++) { window.FW_APP.tourSimulate(ri, i); const cur = window.FW_APP.tour(); const mt = cur.rounds[ri][i]; played++;
      const all = [...DB.clubs, ...DB.national_teams]; const by = id => all.find(t => t.id === id);
      const w = FWEngine.simulate({ seed: mt.seed, teamA: by(mt.a), teamB: by(mt.b), cfg: FW_ENGINE_CONFIG, duration: 'standard', fxLevel: 1 });
      if ((w.hash >>> 0).toString(16) !== mt.res.hash || w.teams[w.winner].team.id !== mt.res.winnerId || w.teams[w.winner].alive !== mt.res.survivors) mismatch++;
      if (ri + 1 < cur.rounds.length) { const nx = cur.rounds[ri + 1][i >> 1]; if ((i % 2 ? nx.b : nx.a) !== mt.res.winnerId) mismatch++; } }
    const fin = window.FW_APP.tour(); out.bracket8 = { played, mismatch, champion: fin.champion, championIsFinalWinner: fin.champion === fin.rounds[2][0].res.winnerId };
    try { T.record(fin, 0, 0, { winnerId: fin.rounds[0][0].a }); out.reRecord = 'allowed (BAD)'; } catch (e) { out.reRecord = 'rejected: ' + e.message; }
    out.stored = !!localStorage.getItem('fw_tournament_v3');
    const json = JSON.stringify(fin); try { T.validateTournament(JSON.parse(json), DB); out.jsonRoundtrip = true; } catch (e) { out.jsonRoundtrip = e.message; }
    try { const bad = JSON.parse(json); bad.teams[1] = bad.teams[0]; T.validateTournament(bad, DB); out.badImport = 'accepted (BAD)'; } catch (e) { out.badImport = 'rejected: ' + e.message; }
    try { T.validateTournament({ hello: 1 }, DB); out.junkImport = 'accepted (BAD)'; } catch (e) { out.junkImport = 'rejected: ' + e.message; }
    return out; });
  console.log('G:', JSON.stringify(g));
  // persistence across reload + bracket PNG + UI render
  await p.reload(); await p.waitForFunction(() => window.FW_APP && window.FW_APP.st.ready);
  await p.click('#btnTour'); await p.waitForTimeout(300);
  const restored = await p.evaluate(() => { const t = window.FW_APP.tour(); return t && { name: t.name, champion: t.champion, matches: document.querySelectorAll('#tourBody .tmatch').length, label: /Fantasy simulation bracket/.test(document.getElementById('tourBody').innerText) }; });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#tPng')]); const png = OUT + '/' + dl.suggestedFilename(); await dl.saveAs(png);
  await p.screenshot({ path: OUT + '/tour.png' });
  console.log('G2: restored after reload', JSON.stringify(restored), 'bracket PNG', path.basename(png), fs.statSync(png).size, 'bytes');
  await p.click('#modalTour [data-close]');
  // H cover (from a fast simulated match object) + I render cost
  const hi = await p.evaluate(async () => { const A = window.FW_APP; A.setMode('domestic_league'); A.choose('A', 'TUR_GALATASARAY'); A.choose('B', 'TUR_FENERBAHCE');
    const res = {};
    for (const flags of [{ tag: 'V2 look (V3 off)', set: { vfx: false, epic: false, mvp: false, momentum: false, crowd: false } }, { tag: 'V3 all on', set: {} }]) {
      const set = Object.assign(A.settings(), flags.set); const m = A.buildMatch(123456, set); const w = m.world;
      const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920; const ctx = cv.getContext('2d');
      let t0 = 0, n = 0, tsum = 0;
      for (let T = 2.3; T < 50; T += 1 / 6) { FWEngine.advanceTo(w, T); const a = performance.now(); m.renderer.render(ctx, T, 1080, 1920, T); tsum += performance.now() - a; n++; }
      res[flags.tag] = (tsum / n).toFixed(2) + ' ms/frame @1080x1920';
      while (w.phase !== 'ended') FWEngine.step(w); FWEngine.advanceTo(w, w.endT + w.outroLen);
      if (flags.tag === 'V3 all on') {
        for (const type of ['nospoiler', 'reveal']) { m.set = Object.assign({}, set, { cover: type }); const c = FWCoverV3.cover(m, { type, lang: 'en' }); res['cover_' + type] = [c.width, c.height, c.toDataURL('image/png')]; }
        const sq = FWCoverV3.cover(m, { type: 'nospoiler', lang: 'en', square: true }); res.square = [sq.width, sq.height];
        res.winner = m.teams[w.winner].name;
      }
      m.renderer.dispose();
    }
    return res; });
  for (const k of ['cover_nospoiler', 'cover_reveal']) { fs.writeFileSync(`${OUT}/${k}.png`, Buffer.from(hi[k][2].split(',')[1], 'base64')); hi[k] = hi[k].slice(0, 2); }
  console.log('H/I:', JSON.stringify(hi));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
