// Render many panels/scene UIs to strings for comparison.
// usage: node snap.js file.html lang out.json [switchFrom]
//  switchFrom: boot in that language then switch live to `lang`
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [file, lang, out, from, late] = process.argv.slice(2);
  const L = c => c === 'pt' ? 'pt-BR' : c;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.addInitScript(l => {
    try { localStorage.clear(); localStorage.setItem('cozyfishing_lang_v1', l); } catch (e) { }
    let s = 12345; Math.random = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const D0 = 1767225600000; Date.now = () => D0;
  }, L(from || lang));
  await p.goto('file://' + require('path').resolve(file));
  await p.waitForTimeout(1200);
  const res = await p.evaluate(async ({ lang, from, late }) => {
    const out = {};
    const grab = (k) => { out[k] = ['hud', 'objective', 'sceneui', 'bottom', 'panel', 'modal', 'toasts'].map(id => document.getElementById(id).innerHTML).join('\n<<>>\n'); };
    grab('mainmenu');
    if (from && !late && typeof I18N !== 'undefined') I18N.setLang(lang);
    grab('mainmenu2');
    UI.openPanel('Settings'); grab('settings_menu'); UI.closePanel(true);
    go('CharacterCreator', { look: {} }); grab('cc');
    beginNewGame({ name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' });
    document.getElementById('toasts').innerHTML = '';
    grab('town');
    // rich state
    S.cash = 500000; QA.act('boats', {}); QA.act('rod5', {}); QA.act('bait', {}); QA.act('autos', {}); QA.act('fish42', {});
    for (const f of FISH_LIST.slice(0, 12)) Inv.add('bag', f.id, 2);
    S.day = 14; World.startDay(); Guild.ensure && Guild.ensure(); S.stats.manualCatches = 5; try { Stories.check(); } catch (e) { }
    try { for (let i = 0; i < 3; i++) { const rep = World.sleep(); } } catch (e) { out._simerr = String(e); }
    try { const ctx = { mode: 'pier', surf: 236, minCast: 40, maxCast: 300, spotId: () => 'liman_iskele', tip: () => [200, 200], moving: () => false }; for (let i = 0; i < 6; i++) { Fishing.attach(ctx); Fishing.press(); Fishing.t = 0.6; Fishing.power = 50; Fishing.releaseCast(); Fishing.finish('NO_BITE', ''); Fishing.phase = 'READY'; Fishing.detach(); } } catch (e) { out._simerr2 = String(e); }
    if (late) I18N.setLang(lang);
    UI.refresh(); document.getElementById('toasts').innerHTML = '';
    const panels = Object.keys(UI.P).filter(k => k !== 'Debug');
    const args = { Dialog: [{ npc: 'efe' }, { npc: 'zeynep' }, { npc: 'fatma' }, { npc: 'hasan' }, { npc: 'ali' }], Encyclopedia: [{}, { id: 'sardalya' }] };
    for (const k of panels) {
      for (const a of (args[k] || [{}])) {
        try { const r = UI.P[k].call(UI, a); out['P.' + k + JSON.stringify(a)] = r ? (r.title + '\n' + r.html) : ''; } catch (e) { out['P.' + k + JSON.stringify(a)] = 'ERR ' + e.message; }
      }
    }
    // tabs
    for (const [tk, vals] of Object.entries({ jr: ['guide', 'today', 'missing', 'fav', 'trophy', 'shore', 'wild', 'log'], st: ['stories', 'album'] })) for (const v of vals) { UI.tab[tk] = v; for (const k of ['Journal', 'Stories']) try { const r = UI.P[k].call(UI, {}); out['T.' + k + '.' + v] = r.html; } catch (e) { } }
    for (const sc of ['Town', 'Home', 'PierFishing', 'SeaMap']) { try { go(sc, sc === 'Town' ? { at: 'home' } : {}); document.getElementById('toasts').innerHTML = ''; grab('scene.' + sc); } catch (e) { out['scene.' + sc] = 'ERR ' + e.message; } }
    try { const rep = World.sleep(); go('EndDay', { rep }); grab('scene.EndDay'); } catch (e) { out['scene.EndDay'] = 'ERR ' + e.message; }
    out.tables = JSON.stringify({ seasons: SEASON_TR, wx: WEATHER_TR, hair: HAIR_STYLES, fish: FISH_LIST.slice(0, 5).map(f => [f.name_tr, f.encyclopedia_tr]), reg: REGIONS.map(r => r.name), ach: ACHS.slice(0, 5).map(a => [a.name, a.condition_tr, a.category]), tut: TUT.map(x => x.t), reward: Object.values(ACH_REWARD).filter(Boolean).map(r => r.name) });
    out._missing = typeof I18N !== 'undefined' ? I18N.missingReport() : [];
    return out;
  }, { lang: L(lang), from: from ? L(from) : null, late: !!late });
  res._errors = errs;
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log('snap', Object.keys(res).length, 'errors', errs.length, errs.slice(0, 5));
  await b.close();
})();
