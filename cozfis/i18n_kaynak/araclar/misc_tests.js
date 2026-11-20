// Language detection, persistence, state invariance on switch, old-save compatibility.
const { chromium } = require('playwright');
(async () => {
  const [orig, build] = process.argv.slice(2).map(f => 'file://' + require('path').resolve(f));
  const b = await chromium.launch();
  const out = {};
  // 1) detection by browser locale (no stored pref)
  for (const loc of ['tr-TR', 'en-US', 'es-MX', 'de-AT', 'fr-CA', 'pt-PT', 'pt-BR', 'ja-JP', 'it-IT']) {
    const ctx = await b.newContext({ locale: loc }); const p = await ctx.newPage();
    await p.goto(build); await p.waitForTimeout(500);
    out['detect_' + loc] = await p.evaluate(() => [I18N.lang, document.documentElement.lang, document.title, document.getElementById('rotate').innerText.slice(0, 40)]);
    await ctx.close();
  }
  // 2) stored preference wins over browser locale; persists after reload
  {
    const ctx = await b.newContext({ locale: 'de-DE' }); const p = await ctx.newPage();
    await p.goto(build); await p.waitForTimeout(500);
    await p.evaluate(() => { UI.openPanel('Settings'); document.querySelector('[data-a=setLang][data-v=fr]').click(); });
    await p.waitForTimeout(300);
    const after = await p.evaluate(() => [I18N.lang, localStorage.getItem('cozyfishing_lang_v1'), document.querySelector('#panel h3, #panel .title, #panel')?.innerText.slice(0, 60)]);
    await p.reload(); await p.waitForTimeout(500);
    const reloaded = await p.evaluate(() => [I18N.lang, document.querySelector('#sceneui')?.innerText.slice(0, 60)]);
    out.pref = { after, reloaded };
    await ctx.close();
  }
  // 3) switching language does not touch game state; save format unchanged
  {
    const ctx = await b.newContext({ locale: 'tr-TR' }); const p = await ctx.newPage();
    await p.goto(build); await p.waitForTimeout(500);
    out.invariance = await p.evaluate(() => {
      beginNewGame({ name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' });
      S.cash = 12345; Inv.add('bag', 'kefal', 3); S.energy = 77;
      const snap = JSON.stringify(S); const res = [];
      for (const l of ['en', 'es', 'de', 'fr', 'pt-BR', 'tr']) { I18N.setLang(l); UI.openPanel('Inventory'); UI.closePanel(true); res.push(JSON.stringify(S) === snap); }
      const packed = JSON.parse(Save.pack(S));
      return { unchanged: res, format: packed.format, keys: [Save.DBN, Save.LS, Save.SET], cash: S.cash, energy: S.energy };
    });
    await ctx.close();
  }
  // 4) old save (created by original game) loads in new build
  {
    const ctx = await b.newContext({ locale: 'tr-TR' }); const p = await ctx.newPage();
    await p.goto(orig); await p.waitForTimeout(600);
    const raw = await p.evaluate(() => { beginNewGame({ name: 'Eski', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' }); S.cash = 4321; Inv.add('bag', 'levrek', 2); S.day = 9; return Save.pack(S); });
    await ctx.close();
    const ctx2 = await b.newContext({ locale: 'en-US' }); const p2 = await ctx2.newPage();
    const errs = []; p2.on('pageerror', e => errs.push(e.message));
    await p2.goto(build); await p2.waitForTimeout(600);
    out.oldsave = await p2.evaluate(raw => { const u = Save.unpack(raw); if (!u.ok) return u; S = u.state; startFromState(); return { ok: true, day: S.day, cash: S.cash, bag: S.bag, name: S.player.name, lang: I18N.lang, hud: document.getElementById('hud').innerText.slice(0, 60) }; }, raw);
    out.oldsave.errs = errs;
    // and localStorage-based: put the raw save in the old key, reload
    await p2.evaluate(raw => { localStorage.setItem('cozyfishing_save_v1', raw); }, raw);
    await ctx2.close();
  }
  // 5) validation report
  {
    const p = await b.newPage(); await p.goto(build); await p.waitForTimeout(500);
    out.validate = await p.evaluate(() => { const r = I18N.validate(); return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { total: v.total, missing: v.missing, extra: v.extra, placeholderMismatch: v.placeholderMismatch, phKeys: v.phKeys }])); });
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
