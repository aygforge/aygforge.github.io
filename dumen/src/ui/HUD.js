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
    // Envanter: kasaba/iç mekânda her zaman; diğer sahnelerde yalnız sahne izin verirse (opts.inv)
    // Sol üstteki görsel HUD'un alt kenarı (mantıksal px): sol üstte açılan paneller bunun altından başlar
    bottom() {
      if (!D.Assets.get('hud_bar') || typeof getComputedStyle === 'undefined') return 120;
      const st = document.getElementById('stage'); const fs = st ? parseFloat(getComputedStyle(st).fontSize) || 34 : 34;
      return Math.round(fs * 5 + 26);
    },
    invAllowed() { return HUD.mode === 'town' || HUD.mode === 'interior' || !!HUD.opts.inv; },
    openInv() { if (!HUD.invAllowed() || D.Input.blocked() || D.UI.modalOpen()) return; D.Audio.sfx('click'); D.Scenes.openInventory(null, HUD.opts.onInvClose); },
    invBtnText() { return HUD.invAllowed() ? D.UI.btn('Envanter', () => HUD.openInv(), { cls: 'small' }) : null; },
    // Plakaya sığan kısa sayı: 9.999'a kadar tam, sonra 12,3B / 1,2M
    short(n) {
      n = Math.max(0, Math.round(n));
      if (n < 10000) return D.fmt(n);
      if (n < 1e6) return (n < 1e5 ? (Math.floor(n / 100) / 10).toFixed(1).replace('.', ',').replace(',0', '') : Math.floor(n / 1000)) + 'B';
      return (Math.floor(n / 1e5) / 10).toFixed(1).replace('.', ',').replace(',0', '') + 'M';
    },
    // Kullanıcı çizimi HUD: tahta bar + 4 yuva (Miyav, Hurda, Coin, Çanta). Değerler ikonların alt plakasına yazılır.
    // Koordinatlar bar görselinin (900×246) birimindedir; yuvalar % ile yerleştirilir → --fs/arayüz boyutuyla ölçeklenir.
    BAR: { w: 900, h: 246, holes: [[172, 137.5], [359, 137.5], [541, 137.5], [728, 137.5]], icon: 178,
      // ikon görseli 320 genişlik; daire merkezi (160,160); plaka iç alanı [x0,y0,x1,y1]
      slots: [
        { id: 'CUR_MIYAV', img: 'hud_miyav', ih: 368, plate: [102, 300, 220, 359], label: 'Miyav' },
        { id: 'CUR_SCRAP', img: 'hud_scrap', ih: 359, plate: [95, 300, 230, 345], label: 'Hurda' },
        { id: 'CUR_COIN', img: 'hud_coin', ih: 345, plate: [93, 286, 228, 332], label: 'Coin' },
        { bag: true, img: 'hud_bag', ih: 326, cy: 163, label: 'Envanter' }] },
    bar(s) {
      const A = D.Assets;
      if (!A.get('hud_bar') || HUD.BAR.slots.some((sl) => !A.get(sl.img))) return null;
      const B = HUD.BAR, pc = (v, of) => (v / of * 100) + '%';
      const bar = h('div', { class: 'hudbar' }, h('img', { class: 'hudbar-bg', src: A.get('hud_bar').src, alt: '', draggable: 'false' }));
      B.slots.forEach((sl, i) => {
        const k = B.icon / 320, [cx, cy] = B.holes[i];
        const left = cx - 160 * k, top = cy - (sl.cy || 160) * k, w = 320 * k, hh = sl.ih * k;
        const box = { left: pc(left, B.w), top: pc(top, B.h), width: pc(w, B.w), height: pc(hh, B.h) };
        const img = h('img', { src: A.get(sl.img).src, alt: '', draggable: 'false' });
        if (sl.bag) {
          const on = HUD.invAllowed();
          const b = h('button', { class: 'hslot bag' + (on ? '' : ' off'), type: 'button', 'aria-label': 'Envanter', title: on ? 'Envanter' : 'Envanter balık tutarken açılmaz', style: box }, img);
          if (!on) b.setAttribute('aria-disabled', 'true');
          b.addEventListener('click', (e) => { e.stopPropagation(); HUD.openInv(); });
          bar.append(b);
        } else {
          const v = s.wallet[sl.id] || 0, txt = HUD.short(v), p = sl.plate;
          const val = h('span', { class: 'hval l' + Math.min(6, txt.length), style: { left: pc(p[0], 320), top: pc(p[1], sl.ih), width: pc(p[2] - p[0], 320), height: pc(p[3] - p[1], sl.ih) } }, txt);
          bar.append(h('div', { class: 'hslot', role: 'img', 'aria-label': sl.label + ': ' + D.fmt(v), title: sl.label + ': ' + D.fmt(v), style: box }, img, val));
        }
      });
      return h('div', { class: 'hud-left' }, bar,
        h('div', { class: 'hud-chips' }, h('span', { class: 'chip' }, 'Tekne Sv.' + s.boat.level), h('span', { class: 'chip' }, 'Ambar ' + s.inv.fish.length + '/' + D.Inv.capacity(s))));
    },
    render() {
      const root = document.getElementById('hud');
      D.UI.clear(root);
      const s = D.Game.state;
      if (HUD.mode === 'none' || !s) return;
      const wallet = HUD.bar(s) || h('div', { class: 'wallet' },
        D.UI.walletChip('CUR_COIN', s.wallet.CUR_COIN), D.UI.walletChip('CUR_SCRAP', s.wallet.CUR_SCRAP), D.UI.walletChip('CUR_MIYAV', s.wallet.CUR_MIYAV),
        h('span', { class: 'chip' }, 'Tekne Sv.' + s.boat.level), h('span', { class: 'chip' }, 'Ambar ' + s.inv.fish.length + '/' + D.Inv.capacity(s)), HUD.invBtnText());
      const btns = h('div', { class: 'hud-btns' });
      if (HUD.opts.back) btns.append(D.UI.btn(HUD.opts.backLabel || 'Geri', HUD.opts.back, { cls: 'wood' }));
      if (HUD.mode === 'town' || HUD.mode === 'interior') {
        const nb = HUD.notebookBadge(s), cb = HUD.collectionBadge(s);
        const bNb = D.UI.btn('Not Defteri', () => D.Scenes.openJournal(), {}); if (nb) bNb.append(h('span', { class: 'badge' }, nb));
        const bCol = D.UI.btn('Defter', () => D.Scenes.openFishpedia(), {}); if (cb) bCol.append(h('span', { class: 'badge' }, cb));
        btns.append(bNb, bCol, D.UI.btn('⚙', () => D.Scenes.openSettings(), { cls: 'round', aria: 'Ayarlar' }));
      }
      root.append(h('div', { class: 'hud-top' }, wallet, btns));
    }
  };
  D.bus.on('state', () => HUD.render());
  D.HUD = HUD;
})(globalThis.DUMEN);
