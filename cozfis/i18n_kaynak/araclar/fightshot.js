// Screenshot fishing HUD during a fight in each language.
const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2], dir = process.argv[3];
  const b = await chromium.launch();
  for (const lang of ['tr', 'en', 'es', 'de', 'fr', 'pt-BR']) {
    const p = await b.newPage({ viewport: { width: 740, height: 360 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(l => { try { localStorage.clear(); localStorage.setItem('cozyfishing_lang_v1', l); } catch (e) { } }, lang);
    await p.goto('file://' + require('path').resolve(file)); await p.waitForTimeout(800);
    await p.evaluate(() => {
      beginNewGame({ name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' });
      QA.act('rod5', {}); go('PierFishing', {}); document.getElementById('toasts').innerHTML = '';
      const sc = Game.scene;
      S.pendingCast = { id: 1, spotId: S.spotId, mode: 'pier', band: 'mid', bait: 'basic', fish: 'lufer', size: { cm: 60, kg: 3, t: 0.6, cls: 'normal' }, bite: true, wait: 2, method: 'float', daypart: 'day', tempo: 'classic' };
      Fishing.bob = { x0: 200, y0: 200, x: 400, y: 214, tx: 400, ty: 214, dip: 0 }; Fishing.phase = 'BITE_WINDOW'; Fishing.t = 0.6; Fishing.hook();
      for (let i = 0; i < 90; i++) { Fishing.holding = i % 20 < 12; Fishing.update(1 / 60); }
      Game.paused = true;
    });
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${dir}/fight_${lang}.png` });
    console.log(lang, errs);
    await p.close();
  }
  await b.close();
})();
