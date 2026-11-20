// Detect horizontal text overflow in UI for each language at phone-landscape size.
// usage: node overflow.js file.html [w h] [shotsDir]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const file = process.argv[2]; const W = +(process.argv[3] || 740), H = +(process.argv[4] || 360); const shots = process.argv[5];
  const b = await chromium.launch();
  const report = {};
  for (const lang of ['tr', 'en', 'es', 'de', 'fr', 'pt-BR']) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(l => { try { localStorage.clear(); localStorage.setItem('cozyfishing_lang_v1', l); } catch (e) { } }, lang);
    await p.goto('file://' + require('path').resolve(file)); await p.waitForTimeout(900);
    const views = ['mainmenu', 'cc', 'town', 'P:Menu', 'P:Inventory', 'P:Settings', 'P:Help', 'P:Encyclopedia', 'P:Achievements', 'P:Statistics', 'P:Orders', 'P:TackleShop', 'P:Boatyard', 'P:FishMarket', 'P:Journal', 'P:Guild', 'P:Stories', 'P:Square', 'P:Trade', 'P:Finance', 'P:People', 'P:Wardrobe', 'P:Bakery', 'P:Teahouse', 'P:Boutique', 'P:HomeGoods', 'P:Records', 'P:Aquarium', 'P:Trophies', 'P:Projects', 'scene:PierFishing', 'scene:Home', 'scene:SeaMap', 'scene:EndDay'];
    const res = {};
    for (const v of views) {
      const r = await p.evaluate(v => {
        try {
          if (v === 'cc') go('CharacterCreator', { look: {} });
          if (v === 'town') { beginNewGame({ name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' }); S.cash = 500000; QA.act('boats', {}); QA.act('rod5', {}); QA.act('bait', {}); QA.act('autos', {}); QA.act('fish42', {}); for (const f of FISH_LIST.slice(0, 8)) Inv.add('bag', f.id, 2); S.day = 14; World.startDay(); go('Town', { at: 'home' }); document.getElementById('toasts').innerHTML = ''; }
          if (v.startsWith('P:')) { UI.closePanel(true); UI.openPanel(v.slice(2), v === 'P:Dialog' ? { npc: 'efe' } : {}); }
          if (v.startsWith('scene:')) { UI.closePanel(true); const n = v.slice(6); if (n === 'EndDay') { const rep = World.sleep(); go('EndDay', { rep }); } else go(n, {}); document.getElementById('toasts').innerHTML = ''; }
        } catch (e) { return { err: e.message }; }
        const bad = [];
        document.querySelectorAll('#frame button, #frame .chip, #frame .btn, #frame .tab, #frame h2, #frame h3, #frame h4, #frame .kv span, #frame .kv b, #frame .lbl, #frame .tile span').forEach(el => {
          const cs = getComputedStyle(el); if (cs.display === 'none' || el.offsetParent === null) return;
          if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible' || el.getBoundingClientRect().right > window.innerWidth + 1) bad.push((el.className || el.tagName) + ': ' + el.textContent.trim().slice(0, 50) + ' [' + el.scrollWidth + '>' + el.clientWidth + ']');
        });
        return { bad: bad.slice(0, 12) };
      }, v);
      if (shots && (v === 'town' || v.startsWith('scene:') || ['P:Menu', 'P:Settings', 'mainmenu', 'P:Inventory', 'P:Encyclopedia', 'P:Orders'].includes(v))) { await p.waitForTimeout(150); await p.screenshot({ path: `${shots}/${lang}_${v.replace(':', '_')}.png` }); }
      if (r.err || r.bad.length) res[v] = r;
    }
    report[lang] = { errs, res };
    await p.close();
  }
  console.log(JSON.stringify(report, null, 1));
  await b.close();
})();
