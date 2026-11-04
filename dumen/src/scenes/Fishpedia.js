// Denizin Defteri / Fishpedia: 8 bölge sekmesi, solda liste, sağda detay. Görülmeyen balık = ??? + silüet (spoiler yok).
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  D.Scenes.openFishpedia = (region) => {
    let reg = region || 'EL', sel = null;
    D.UI.modal({
      title: 'Denizin Defteri', width: D.UI.view.W - 120, height: D.UI.view.H - 100, scroll: false,
      body: (b) => {
        const render = () => {
          D.UI.clear(b);
          const s = D.Game.state;
          const tot = D.Quests.totalCollection(s);
          b.append(h('div', { class: 'row' }, h('div', { class: 'tabs grow' }, D.REGION_ORDER.map((code) => { const rc = D.Quests.regionCollection(s, code); const t = h('button', { class: 'tab' + (reg === code ? ' on' : ''), type: 'button' }, D.RegionDB[code].name + ' ', h('span', { class: 'cnt' }, rc.got + '/' + rc.total)); t.addEventListener('click', () => { reg = code; sel = null; render(); }); return t; })), h('span', { class: 'chip', style: { fontSize: '.8em' } }, 'Toplam ' + tot.got + '/' + tot.total)));
          const ids = D.RegionDB[reg].fishIds;
          sel = sel || ids[0];
          const left = h('div', { class: 'scroll', style: { width: '700px', flex: '0 0 auto' } });
          const grid = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(3, 1fr)' } });
          for (const id of ids) {
            const col = s.collection[id]; const bb = D.FishBalanceDB[id];
            const card = h('div', { class: 'card' + (id === sel ? ' sel' : ''), style: { flexDirection: 'column', gap: '4px', padding: '8px', cursor: 'pointer' } }, D.UI.fishIcon(id, 170, !col), h('div', { class: 'tiny b center' }, col ? D.FishDBSource.FishDB[id].name : '???'), col ? D.UI.rarityBadge(bb.rarity) : (bb.rarity === 'legendary' || bb.rarity === 'boss' ? h('span', { class: 'tiny muted' }, 'büyük bir gölge…') : null));
            card.addEventListener('click', () => { sel = id; render(); });
            grid.append(card);
          }
          left.append(grid);
          const col = s.collection[sel]; const bb = D.FishBalanceDB[sel]; const src = D.FishDBSource.FishDB[sel];
          const right = h('div', { class: 'col grow scroll', style: { paddingLeft: '20px' } });
          const art = D.UI.canvas(760, 380, (c) => { if (col && (bb.rarity === 'legendary' || bb.rarity === 'boss')) { c.fillStyle = D.Art.rg(c, 380, 190, 20, 340, ['rgba(255,210,80,0.45)', 'rgba(0,0,0,0)']); c.fillRect(0, 0, 760, 380); } D.FishArt.draw(c, sel, 380, 190, bb.shape === 'kraken' ? 380 : 460, { sil: !col, t: 0.6 }); });
          right.append(art);
          if (col) {
            right.append(h('div', { class: 'b', style: { fontSize: '1.3em' } }, src.name), h('div', { class: 'row wrap' }, D.UI.rarityBadge(bb.rarity), h('span', { class: 'chip' }, D.BEHAVIOR_TR[bb.behavior]), h('span', { class: 'chip' }, src.region), bb.rarityDerived ? h('span', { class: 'tiny muted' }, 'nadirlik: bu sürümün denge kararı') : h('span', { class: 'tiny ok' }, 'nadirlik: kaynakta teyitli')),
              h('div', null, bb.collectionText),
              h('div', { class: 'kv' }, h('b', null, 'Yakalanma'), h('span', null, col.count + ' kez'), h('b', null, 'En büyük'), h('span', null, col.maxSize + ' cm (' + D.Econ.sizeLabel(sel, col.maxSize) + ')'), h('b', null, 'En yüksek değer'), h('span', null, D.fmt(col.maxValue) + ' coin'), h('b', null, 'Boy aralığı'), h('span', null, bb.sizeMin + '–' + bb.sizeMax + ' cm'), h('b', null, 'ID'), h('span', null, sel)),
              h('div', { class: 'row', style: { alignItems: 'flex-start' } }, D.UI.portrait('kaya', 110), h('div', { class: 'small' }, h('b', null, 'Kaya Usta: '), D.QuestDB.kayaComments[bb.behavior])));
          } else right.append(h('div', { class: 'b', style: { fontSize: '1.3em' } }, '???'), h('div', { class: 'muted' }, 'Henüz yakalanmadı. Kaya Usta: "Bu gölgeyi tanımıyorum. Yakala da tanışalım."'), h('div', { class: 'small' }, 'Bölge: ' + src.region));
          const rc = D.Quests.regionCollection(s, reg);
          right.append(h('div', { class: 'hr' }), h('div', { class: 'row wrap' }, h('span', { class: 'small b' }, D.RegionDB[reg].name + ' %' + rc.pct + ' ödülleri:'), D.QuestDB.collection.thresholds.map((pct) => { const done = s.collectionRewards[reg + ':' + pct]; return btn('%' + pct + (done ? ' ✓' : ''), () => D.UI.act('claimCollection', { region: reg, pct }, (r) => { D.Panels.rewardsModal(D.RegionDB[reg].name + ' %' + pct, r.rewards); render(); }), { cls: 'small ' + (!done && rc.pct >= pct ? 'green' : ''), disabled: done || rc.pct < pct }); })));
          { const tc = D.Quests.totalCollection(s); right.append(h('div', { class: 'row wrap' }, h('span', { class: 'small b' }, '88/88 (' + tc.got + '/' + tc.total + '): Altın Dümen Bayrağı + 10.000 coin'), btn(s.collectionRewards.ALL ? 'Alındı ✓' : 'Al', () => D.UI.act('claimCollection', { region: 'ALL', pct: 100 }, (r) => { D.Panels.rewardsModal('Denizin Defteri tamamlandı!', r.rewards); render(); }), { cls: 'small green', disabled: !!s.collectionRewards.ALL || tc.got < tc.total }))); }
          b.append(h('div', { class: 'row grow', style: { alignItems: 'stretch', minHeight: 0 } }, left, right));
        };
        render();
      }
    });
  };
})(globalThis.DUMEN);
