// Envanter: Balık / Sandık / Yem / Materyal / Özel Eşya / Kozmetik (+ Ekipman, Anahtar & Belgeler). 102 ItemDB kaydının tamamı erişilebilir.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  const P = () => D.Panels;
  const IDS = (cat) => Object.keys(D.ItemDBSource.ItemDB).filter((id) => D.ItemDBSource.ItemDB[id].category === cat);

  // Ekipman/yem/özel eşya seçici (balıkçılık sahnesinden de açılır)
  D.Scenes.loadout = (onClose, focus) => {
    let tab = focus || 'rod';
    const m = D.UI.modal({
      title: 'Ekipman', width: Math.min(1700, D.UI.view.W - 160), height: D.UI.view.H - 140,
      body: (b) => {
        const render = () => {
          D.UI.clear(b);
          const s = D.Game.state;
          const tabsEl = h('div', { class: 'tabs' }, [['rod', 'Olta'], ['line', 'Misina'], ['hook', 'Kanca'], ['float', 'Şamandıra'], ['bait', 'Yem'], ['special', 'Özel Eşya (' + s.equip.specials.length + '/' + D.Inv.specialSlots(s) + ')']].map(([id, l]) => { const t = h('button', { class: 'tab' + (tab === id ? ' on' : ''), type: 'button' }, l); t.addEventListener('click', () => { tab = id; render(); }); return t; }));
          b.append(tabsEl);
          const list = h('div', { class: 'list' });
          if (tab === 'bait') {
            list.append(h('div', { class: 'card' + (!s.equip.bait ? ' sel' : '') }, h('div', { class: 'grow ttl' }, 'Yemsiz'), btn(!s.equip.bait ? 'Seçili' : 'Seç', () => D.UI.act('equip', { slot: 'bait', id: null }, render), { cls: 'small', disabled: !s.equip.bait })));
            for (const id of IDS('bait')) { const n = s.inv.items[id] || 0; list.append(P().itemCard(id, { sel: s.equip.bait === id, dis: !n, meta: D.ItemBalanceDB[id].role + ' · ×' + n, right: [btn(s.equip.bait === id ? 'Seçili' : 'Seç', () => D.UI.act('equip', { slot: 'bait', id }, render), { cls: 'small green', disabled: !n || s.equip.bait === id })] })); }
          } else if (tab === 'special') {
            list.append(h('div', { class: 'small muted' }, 'Takılı özel eşyalar her avda uygulanır. Pasif ve şarjlı eşyalar tükenmez; tüketilen eşyalar mücadelede düğmeyle kullanılır (1 adet düşer). Yuva: tekne seviyesi + Kimseye Söyleme Çekirdeği.'));
            for (const id of IDS('special')) {
              const n = s.inv.items[id] || 0; const on = s.equip.specials.includes(id); const ib = D.ItemBalanceDB[id];
              list.append(P().itemCard(id, { sel: on, dis: !n, meta: '“' + D.ItemDBSource.ItemDB[id].effect + '” · ' + { passive: 'Pasif', charge: 'Şarjlı', consumable: 'Tüketilir' }[ib.kind] + ' · ×' + n, right: [btn(on ? 'Çıkar' : 'Tak', () => D.UI.act('equip', { slot: 'special', id }, render), { cls: 'small ' + (on ? 'red' : 'green'), disabled: !n && !on })] }));
            }
          } else {
            for (const id of IDS(tab)) {
              const own = s.owned[tab].includes(id); const on = s.equip[tab] === id;
              const st = P().gearStats(id).map(([k, v]) => k + ' ' + v).join(' · ');
              list.append(P().itemCard(id, { sel: on, dis: !own, meta: (D.ItemBalanceDB[id].role || '') + (st ? ' — ' + st : '') + (own ? '' : ' · Nereden: ' + P().sources(id).join(', ')), right: [own ? btn(on ? 'Takılı' : 'Tak', () => D.UI.act('equip', { slot: tab, id }, render), { cls: 'small green', disabled: on }) : h('span', { class: 'no small' }, 'Sahip değilsin')] }));
            }
          }
          b.append(list);
        };
        render();
      },
      onClose
    });
    return m;
  };

  D.Scenes.openInventory = (tab, onClose) => {
    const st = { tab: tab || 'fish', q: '', region: '', rarity: '', fresh: '', sort: 'new', showAll: true };
    const m = D.UI.modal({
      title: 'Envanter', width: D.UI.view.W - 120, height: D.UI.view.H - 110, scroll: false, onClose,
      body: (b) => {
        const render = () => {
          D.UI.clear(b);
          const s = D.Game.state;
          const cnt = { fish: s.inv.fish.length, chest: s.inv.chests.length, bait: D.sum(IDS('bait'), (id) => s.inv.items[id] || 0), material: D.sum(IDS('material'), (id) => s.inv.items[id] || 0) + D.sum(Object.values(s.inv.trash)), special: D.sum(IDS('special'), (id) => s.inv.items[id] || 0), cosmetic: s.cosmetics.owned.length };
          const T = [['fish', 'Balık'], ['chest', 'Sandık'], ['bait', 'Yem'], ['material', 'Materyal'], ['special', 'Özel Eşya'], ['cosmetic', 'Kozmetik'], ['gear', 'Ekipman'], ['docs', 'Anahtar & Belgeler']];
          b.append(h('div', { class: 'tabs' }, T.map(([id, l]) => { const t = h('button', { class: 'tab' + (st.tab === id ? ' on' : ''), type: 'button' }, l, cnt[id] != null ? h('span', { class: 'cnt' }, ' ' + cnt[id]) : null); t.addEventListener('click', () => { st.tab = id; render(); }); return t; })));
          const list = h('div', { class: 'list scroll grow' });
          const wrap = h('div', { class: 'col grow', style: { minHeight: 0 } });
          if (st.tab === 'fish') {
            const bar = h('div', { class: 'row wrap', style: { gap: '10px', marginBottom: '8px' } });
            const search = h('input', { type: 'search', placeholder: 'Ara…', value: st.q }); search.addEventListener('input', () => { st.q = search.value; renderFish(); });
            const sel = (key, opts) => { const e = h('select', null, opts.map(([v, l]) => h('option', { value: v, selected: st[key] === v ? 'selected' : null }, l))); e.addEventListener('change', () => { st[key] = e.value; renderFish(); }); return e; };
            bar.append(search, sel('region', [['', 'Tüm bölgeler']].concat(D.REGION_ORDER.map((r) => [r, D.RegionDB[r].name]))), sel('rarity', [['', 'Tüm nadirlik']].concat(D.RARITIES.map((r) => [r, D.RARITY_TR[r]]))), sel('fresh', [['', 'Tüm tazelik'], ['FRESH', 'Taze'], ['NORMAL', 'Normal'], ['STALE', 'Bayat'], ['prot', 'Korunan/Görev']]), sel('sort', [['new', 'En yeni'], ['value', 'Değer'], ['size', 'Boy'], ['rarity', 'Nadirlik']]),
              h('span', { class: 'chip' }, 'Ambar ' + s.inv.fish.length + '/' + D.Inv.capacity(s)));
            wrap.append(bar, list);
            const renderFish = () => {
              D.UI.clear(list);
              const s2 = D.Game.state;
              let fish = s2.inv.fish.filter((f) => {
                const name = D.FishDBSource.FishDB[f.fishId].name.toLocaleLowerCase('tr');
                if (st.q && !name.includes(st.q.toLocaleLowerCase('tr'))) return false;
                if (st.region && f.regionCode !== st.region) return false;
                if (st.rarity && D.FishBalanceDB[f.fishId].rarity !== st.rarity) return false;
                if (st.fresh === 'prot') return f.locked || f.questProtected;
                if (st.fresh && D.Econ.freshness(s2, f) !== st.fresh) return false;
                return true;
              });
              const so = { new: (a, b2) => b2.caughtPlay - a.caughtPlay, value: (a, b2) => D.Econ.fishValue(s2, b2, 'estimate') - D.Econ.fishValue(s2, a, 'estimate'), size: (a, b2) => D.Econ.sizeT(b2.fishId, b2.size) - D.Econ.sizeT(a.fishId, a.size), rarity: (a, b2) => D.rarityRank(D.FishBalanceDB[b2.fishId].rarity) - D.rarityRank(D.FishBalanceDB[a.fishId].rarity) }[st.sort];
              fish.sort(so);
              if (!fish.length) list.append(h('div', { class: 'muted center', style: { padding: '40px' } }, s2.inv.fish.length ? 'Filtreye uyan balık yok.' : 'Ambarın boş (0 balık · 0 coin değerinde).'));
              for (const f of fish) list.append(P().fishRow(f, { right: [h('div', { class: 'price' }, D.Econ.freshness(s2, f) === 'STALE' ? h('span', { class: 'no' }, 'Bayat') : D.fmt(D.Econ.fishValue(s2, f)) + ' c'),
                btn(f.locked ? 'Korumayı Kaldır' : 'Koru', () => D.UI.act('lockFish', { id: f.instanceId, locked: !f.locked }, renderFish), { cls: 'small' }),
                btn('Bırak', () => D.UI.confirm('Denize bırak?', D.FishDBSource.FishDB[f.fishId].name + ' denize bırakılacak (coin yok).', () => D.UI.act('releaseFish', { id: f.instanceId }, renderFish, 'Balık denize bırakıldı.')), { cls: 'small red', disabled: !!f.questProtected })] }));
            };
            renderFish();
          } else if (st.tab === 'chest') {
            wrap.append(h('div', { class: 'small muted' }, 'Sandıklar balık tutarken açılmaz; burada seçip açarsın. Kilitli sandıklar için ilgili anahtar gerekir.'), list);
            if (!s.inv.chests.length) list.append(h('div', { class: 'muted center', style: { padding: '30px' } }, 'Sandık yok. Hazine siluetlerine dokun!'));
            for (const c of s.inv.chests) {
              const C = D.ChestDB[c.chestId];
              list.append(P().itemCard(c.chestId, { meta: (c.quality === 'gold' ? '✦ Altın kalite · ' : '') + (C.key ? 'Anahtar: ' + D.itemName(C.key) + ' (sende ' + (s.inv.items[C.key] || 0) + ')' : C.req ? C.req.text : 'Anahtar gerekmez'), right: [btn('Aç…', () => P().chestPanel(c, render), { cls: 'green small' })] }));
            }
            list.append(h('h3', null, 'Sandık kataloğu'), h('div', { class: 'three' }, IDS('chest').map((id) => P().itemCard(id, { meta: '×' + D.Inv.count(D.Game.state, id), dis: !D.Inv.count(D.Game.state, id) }))));
          } else if (st.tab === 'bait' || st.tab === 'special') {
            wrap.append(list);
            for (const id of IDS(st.tab)) {
              const n = s.inv.items[id] || 0;
              const right = st.tab === 'bait' ? [btn(s.equip.bait === id ? 'Seçili' : 'Seç', () => D.UI.act('equip', { slot: 'bait', id }, render), { cls: 'small green', disabled: !n || s.equip.bait === id })] : [btn(s.equip.specials.includes(id) ? 'Çıkar' : 'Tak', () => D.UI.act('equip', { slot: 'special', id }, render), { cls: 'small', disabled: !n && !s.equip.specials.includes(id) })];
              list.append(P().itemCard(id, { dis: !n, meta: (st.tab === 'special' ? '“' + D.ItemDBSource.ItemDB[id].effect + '”' : D.ItemBalanceDB[id].role) + ' · ×' + n, right }));
            }
          } else if (st.tab === 'material') {
            wrap.append(list);
            list.append(h('div', { class: 'two' }, IDS('material').map((id) => P().itemCard(id, { dis: !(s.inv.items[id] || 0), meta: '×' + (s.inv.items[id] || 0) + ' · ' + D.ItemBalanceDB[id].sources }))));
            list.append(h('h3', null, 'Çöp torbası (TrashDB — fabrikada ayrıştırılır)'));
            const tr = Object.entries(s.inv.trash).filter(([, n]) => n > 0);
            if (!tr.length) list.append(h('div', { class: 'muted small' }, 'Boş.'));
            list.append(h('div', { class: 'three' }, tr.map(([id, n]) => h('div', { class: 'card' }, D.UI.itemIcon(id, 80), h('div', { class: 'grow' }, h('div', { class: 'ttl' }, D.TrashDB[id].name), h('div', { class: 'meta' }, '×' + n))))));
          } else if (st.tab === 'cosmetic') {
            wrap.append(list);
            for (const [id, cs] of Object.entries(D.CosmeticDB)) { const own = s.cosmetics.owned.includes(id); const on = s.cosmetics.equipped[cs.slot] === id; list.append(h('div', { class: 'card' + (on ? ' sel' : '') + (own ? '' : ' dis') }, D.UI.itemIcon(id, 90), h('div', { class: 'grow' }, h('div', { class: 'ttl' }, cs.name), h('div', { class: 'meta' }, { flag: 'Bayrak', paint: 'Boya', hat: 'Şapka' }[cs.slot] + ' · ' + (own ? 'Sende' : 'Nereden: ' + cs.source))), own ? btn(on ? 'Çıkar' : 'Kullan', () => D.UI.act('equip', { slot: 'cosmetic', id }, render), { cls: 'small' }) : null)); }
          } else if (st.tab === 'gear') {
            wrap.append(h('div', { class: 'row' }, btn('Ekipmanı Düzenle', () => D.Scenes.loadout(render), { cls: 'primary' })), list);
            for (const cat of ['rod', 'line', 'hook', 'float']) {
              list.append(h('h3', null, D.CATEGORY_TR[cat]));
              list.append(h('div', { class: 'two' }, IDS(cat).map((id) => P().itemCard(id, { sel: s.equip[cat] === id, dis: !s.owned[cat].includes(id), meta: s.equip[cat] === id ? 'Takılı' : s.owned[cat].includes(id) ? 'Sahipsin' : 'Nereden: ' + P().sources(id).join(', ') }))));
            }
          } else if (st.tab === 'docs') {
            wrap.append(list);
            list.append(h('h3', null, 'Anahtarlar'), h('div', { class: 'two' }, IDS('key').map((id) => P().itemCard(id, { dis: !(s.inv.items[id] || 0), meta: 'Açar: ' + D.itemName(D.KeyRules[id].opens) + ' · ×' + (s.inv.items[id] || 0) }))));
            list.append(h('h3', null, 'Kara Pazar Parçaları'), h('div', { class: 'two' }, IDS('black_market_part').map((id) => P().itemCard(id, { dis: !D.Inv.owns(s, id) && !s.boat.installed.includes(id), meta: s.boat.installed.includes(id) ? 'Tekneye takılı' : '×' + D.Inv.count(s, id) + ' · ' + D.ItemBalanceDB[id].mech }))));
            list.append(h('h3', null, 'İzin'), P().itemCard('TCK_BOATYARD_PERMIT', { dis: !D.Inv.owns(s, 'TCK_BOATYARD_PERMIT'), meta: D.ItemBalanceDB.TCK_BOATYARD_PERMIT.mech }));
            list.append(h('h3', null, 'Para Birimleri'), h('div', { class: 'three' }, IDS('currency').map((id) => P().itemCard(id, { meta: D.fmt(s.wallet[id]) }))));
          }
          b.append(wrap);
        };
        render();
      }
    });
    return m;
  };
})(globalThis.DUMEN);
