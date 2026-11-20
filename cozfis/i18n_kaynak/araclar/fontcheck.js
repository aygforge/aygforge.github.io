// Static bitmap-font coverage check over all locale strings + live canvas text capture
const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(file));
  await p.waitForTimeout(1000);
  const res = await p.evaluate(() => {
    const out = {};
    for (const l of I18N.LANGS) {
      I18N.setLang(l.code, { noSave: true });
      const bad = {}; let n = 0;
      for (const [k, v] of Object.entries(LOCALE_DATA[l.code])) {
        const txt = String(v).replace(/<[^>]*>/g, ' ').replace(/\{[^}]*\}/g, ' ').replace(/&[a-z]+;/g, ' ');
        for (const ch of I18N.upper(txt)) {
          if (/\s/.test(ch)) continue;
          const nn = fontNorm(ch);
          if (nn.trim() === '') { bad[ch] = (bad[ch] || 0) + 1; n++; }
        }
      }
      // canvas capture: render scenes
      const drawn = new Set(); const dt0 = drawText;
      drawText = function (g, s) { drawn.add(String(s)); return dt0.apply(this, arguments); };
      try {
        if (!S) beginNewGame({ name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' });
        const [c, x] = mkCanvas(640, 360);
        for (const sc of ['MainMenu', 'Town', 'Home', 'PierFishing', 'SeaMap']) { try { go(sc, sc === 'Town' ? { at: 'home' } : {}); Game.scene.render && Game.scene.render(x); } catch (e) { out.err = (out.err || '') + sc + ':' + e.message + ' '; } }
      } finally { drawText = dt0; }
      const canvasBad = [...drawn].filter(s => [...I18N.upper(s)].some(ch => !/\s/.test(ch) && fontNorm(ch).trim() === ''));
      out[l.code] = { unsupportedChars: bad, count: n, canvasStrings: [...drawn].slice(0, 40), canvasBad };
    }
    I18N.setLang('tr', { noSave: true });
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  console.log('errors', errs);
  await b.close();
})();
