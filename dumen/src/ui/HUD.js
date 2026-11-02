// Ortak ekonomik HUD: cüzdan her sahnede aynı state'ten okunur (Hurdacı/Market HUD'ında sayı görünmeme hatasına karşı).
(function (D) {
  'use strict';
  const { h } = D.UI;
  const HUD = {
    mode: 'none', opts: {},
    set(mode, opts) { HUD.mode = mode; HUD.opts = opts || {}; HUD.render(); },
    notebookBadge(s) {
      let n = D.QuestDB.main.filter((q) => D.Quests.mainState(s, q) === 'COMPLETABLE').length;
      n += Object.values(s.orders).filter((o) => D.Quests.orderState(s, o) === 'COMPLETABLE').length;
      n += s.daily.list.filter((d) => !d.claimed && d.prog >= D.dailyTplById[d.tpl].spec.n).length;
      return n;
    },
    collectionBadge(s) {
      let n = 0;
      for (const reg of D.REGION_ORDER) { const rc = D.Quests.regionCollection(s, reg); for (const p of D.QuestDB.collection.thresholds) if (rc.pct >= p && !s.collectionRewards[reg + ':' + p]) n++; }
      return n;
    },
    render() {
      const root = document.getElementById('hud');
      D.UI.clear(root);
      const s = D.Game.state;
      if (HUD.mode === 'none' || !s) return;
      const wallet = h('div', { class: 'wallet' },
        D.UI.walletChip('CUR_COIN', s.wallet.CUR_COIN), D.UI.walletChip('CUR_SCRAP', s.wallet.CUR_SCRAP), D.UI.walletChip('CUR_MIYAV', s.wallet.CUR_MIYAV),
        h('span', { class: 'chip' }, 'Tekne Sv.' + s.boat.level), h('span', { class: 'chip' }, 'Ambar ' + s.inv.fish.length + '/' + D.Inv.capacity(s)));
      const btns = h('div', { class: 'hud-btns' });
      if (HUD.opts.back) btns.append(D.UI.btn(HUD.opts.backLabel || 'Geri', HUD.opts.back, { cls: 'wood' }));
      if (HUD.mode === 'town' || HUD.mode === 'interior') {
        const nb = HUD.notebookBadge(s), cb = HUD.collectionBadge(s);
        const bInv = D.UI.btn('Envanter', () => D.Scenes.openInventory(), { cls: '' });
        const bNb = D.UI.btn('Not Defteri', () => D.Scenes.openJournal(), {}); if (nb) bNb.append(h('span', { class: 'badge' }, nb));
        const bCol = D.UI.btn('Defter', () => D.Scenes.openFishpedia(), {}); if (cb) bCol.append(h('span', { class: 'badge' }, cb));
        btns.append(bInv, bNb, bCol, D.UI.btn('⚙', () => D.Scenes.openSettings(), { cls: 'round', aria: 'Ayarlar' }));
      }
      root.append(h('div', { class: 'hud-top' }, wallet, btns));
    }
  };
  D.bus.on('state', () => HUD.render());
  D.HUD = HUD;
})(globalThis.DUMEN);
