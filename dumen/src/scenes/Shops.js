// Dükkân iç mekânları: Rüstem (satış), Market, Hurdacı Hasan (craft), Geri Dönüşüm Fabrikası, Tekne Atölyesi, Denizin Defteri (Kaya Usta).
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  const P = () => D.Panels;

  // Arka plan görselindeki dokunma alanları (+ o sahnedeki aktif hikâye inceleme noktaları)
  D.Scenes.addBgHots = (root, kind) => {
    const L = D.SceneArt.BG_LAYOUT[kind]; if (!L || !D.SceneArt.bgImage(kind)) return;
    const list = (L.hots || []).slice();
    const INSPECT = { zip_crates: [0.83, 0.42, 0.15, 0.5] };
    for (const sp of D.Quests.activeInspectSpots(D.Game.state, kind)) if (INSPECT[sp.spot]) list.push({ key: sp.spot, f: INSPECT[sp.spot], label: sp.label, alert: '?', fn: async () => { const r = D.Game.act('inspect', { spot: sp.spot }); if (r.ok) { await D.UI.dialog(D.DialogueDB[r.dlg]); D.SM.rebuild(); } } });
    for (const hs of list) {
      const r = D.SceneArt.bgRect(kind, hs.f); if (!r) continue;
      const b = h('button', { class: 'hot', type: 'button', 'aria-label': hs.label, style: { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' } }, h('span', { class: 'lbl' }, hs.label), hs.alert ? h('span', { class: 'alert' }, hs.alert) : null);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (D.Input.blocked()) return; D.Audio.sfx('click'); hs.fn(); });
      root.append(b);
    }
  };
  function shopScene(name, cfg) {
    D.SM.register(name, {
      music: 'shop',
      enter() { this.tab = cfg.defaultTab || null; this.sel = new Set(); this.build(); },
      build() {
        D.UI.clear(this.root);
        D.HUD.set('interior', { back: () => D.SM.go(cfg.back || 'town'), backLabel: cfg.back === 'street' ? '← Liman Sokağı' : '← Kasaba' });
        const L = D.SceneArt.bgImage(cfg.kind) ? D.SceneArt.BG_LAYOUT[cfg.kind] : null;
        D.Scenes.addBgHots(this.root, cfg.kind);
        const panel = h('div', { class: 'panel shop-layout' + (L && L.side === 'left' ? ' left' : '') });
        const talkBtn = (npc, label) => btn(label, () => D.Scenes.talk(npc), { cls: 'small' + (D.Quests.npcHasStory(D.Game.state, npc) ? ' yellow' : '') });
        const head = h('h2', null, cfg.title, h('span', { class: 'grow' }),
          cfg.npc2 ? talkBtn(cfg.npc2, D.NPCDB[cfg.npc2].name) : null,
          cfg.npc ? talkBtn(cfg.npc, cfg.npc2 ? D.NPCDB[cfg.npc].name : 'Konuş') : null);
        panel.append(head);
        cfg.panel.call(this, panel, D.Game.state);
        this.root.append(panel);
      },
      render(c, W, H, t) { D.SceneArt.interior(c, W, H, t, cfg.kind, D.Game.state); }
    });
  }
  const tabs = (self, list) => h('div', { class: 'tabs' }, list.map(([id, label]) => { const b = h('button', { class: 'tab' + (self.tab === id ? ' on' : ''), type: 'button' }, label); b.addEventListener('click', () => { self.tab = id; self.sel = new Set(); self.build(); }); return b; }));
  const need = (have, n, label) => h('span', { class: have >= n ? 'ok' : 'no' }, label + ' ' + D.fmt(have) + '/' + D.fmt(n));

  // ---------------- RÜSTEM ----------------
  shopScene('rustem', {
    kind: 'rustem', npc: 'rustem', title: 'Rüstem Aga\'nın Balık Pazarı',
    panel(p, s) {
      const fish = s.inv.fish.slice().sort((a, b) => D.Econ.fishValue(s, b) - D.Econ.fishValue(s, a));
      const sellable = fish.filter((f) => D.Econ.sellableAtRustem(s, f));
      for (const id of [...this.sel]) if (!sellable.some((f) => f.instanceId === id)) this.sel.delete(id);
      const selTotal = D.sum(sellable.filter((f) => this.sel.has(f.instanceId)), (f) => D.Econ.fishValue(s, f));
      const allTotal = D.sum(sellable, (f) => D.Econ.fishValue(s, f));
      const stale = fish.filter((f) => D.Econ.freshness(s, f) === 'STALE').length;
      p.append(h('div', { class: 'small' }, 'Taze balık tam fiyat, Normal ×' + D.EconomyConfig.freshness.NORMAL.mult + '. Bayat balık almam — Geri Dönüşüm Fabrikası\'na götür. Görevdeki ya da koruduğun balıklar satılmaz. Tazelik yalnız aktif oyun süresiyle azalır.'),
        stale ? h('div', { class: 'no small' }, stale + ' bayat balık var → Liman Sokağı\'ndaki fabrika değerlendirir.') : null);
      const list = h('div', { class: 'list scroll grow' });
      if (!fish.length) list.append(h('div', { class: 'muted center', style: { padding: '40px' } }, 'Ambarın boş. Balığa çık!'));
      for (const f of fish) {
        const ok = D.Econ.sellableAtRustem(s, f);
        const v = D.Econ.fishValue(s, f);
        const why = f.questProtected ? 'Görevde' : f.locked ? 'Korumada' : D.Econ.freshness(s, f) === 'STALE' ? 'Bayat' : null;
        list.append(P().fishRow(f, { sel: this.sel.has(f.instanceId), dis: !ok, onclick: ok ? () => { this.sel.has(f.instanceId) ? this.sel.delete(f.instanceId) : this.sel.add(f.instanceId); this.build(); } : null, right: [h('div', { class: 'price' }, why ? h('span', { class: 'no' }, why) : D.fmt(v) + ' c')] }));
      }
      p.append(list, h('div', { class: 'row wrap', style: { marginTop: '14px' } },
        btn('Seçileni Sat (' + this.sel.size + ' · ' + D.fmt(selTotal) + ' c)', () => D.UI.act('sellFish', { ids: [...this.sel] }, (r) => { this.sel.clear(); D.Audio.sfx('coin'); this.build(); }, (r) => r.count + ' balık satıldı: +' + D.fmt(r.coins) + ' coin'), { cls: 'green', disabled: !this.sel.size }),
        btn('Tüm Satılabilirleri Sat (' + sellable.length + ' · ' + D.fmt(allTotal) + ' c)', () => D.UI.act('sellFish', { all: true }, () => { this.sel.clear(); D.Audio.sfx('coin'); this.build(); }, (r) => r.count + ' balık satıldı: +' + D.fmt(r.coins) + ' coin'), { cls: 'primary', disabled: !sellable.length }),
        btn('Hepsini Seç', () => { sellable.forEach((f) => this.sel.add(f.instanceId)); this.build(); }, { cls: 'small', disabled: !sellable.length })));
    }
  });

  // ---------------- MARKET ----------------
  shopScene('market', {
    kind: 'market', npc: 'market', title: 'Market', defaultTab: 'rods',
    panel(p, s) {
      p.append(tabs(this, [['rods', 'Oltalar'], ['gear', 'Misina · Kanca · Şamandıra'], ['baits', 'Yemler'], ['specials', 'Özel'], ['mats', 'Malzeme']]));
      const list = h('div', { class: 'list scroll grow' });
      const M = D.ShopDB.market;
      const ids = this.tab === 'rods' ? M.rods : this.tab === 'gear' ? M.gear : this.tab === 'baits' ? M.baits : this.tab === 'specials' ? M.specials : M.materials.map((m) => m.id);
      if (this.tab === 'rods') list.append(h('div', { class: 'small muted' }, 'Tahta Olta başlangıçta sende. Buzkıran, Kızıl Isırgan, Pas Yiyen ve Yakamoz Fısıldayan yalnız Hurdacı Hasan\'da üretilir.'));
      for (const id of ids) {
        const ib = D.ItemBalanceDB[id];
        const gear = ['rod', 'line', 'hook', 'float'].includes(ib.category);
        const owned = gear && D.Inv.owns(s, id);
        const lock = D.Actions.unlockOk(s, ib);
        const price = this.tab === 'mats' ? M.materials.find((m) => m.id === id).price : ib.price;
        const right = [];
        if (owned) right.push(h('span', { class: 'ok' }, 'Sahipsin'));
        else if (lock) right.push(h('span', { class: 'no small', style: { maxWidth: '260px', whiteSpace: 'normal' } }, lock));
        else {
          right.push(h('span', { class: 'price' }, D.fmt(price) + ' c'));
          const buy = (q) => D.UI.act('buyItem', { itemId: id, qty: q }, () => { D.Audio.sfx('coin'); this.build(); }, (r) => D.itemName(id) + (r.qty > 1 ? ' ×' + r.qty : '') + ' alındı (−' + D.fmt(r.cost) + ' c)');
          right.push(btn('Al', () => buy(1), { cls: 'green small', disabled: s.wallet.CUR_COIN < price }));
          if (!gear) right.push(btn('×5', () => buy(5), { cls: 'green small', disabled: s.wallet.CUR_COIN < price * 5 }));
        }
        list.append(P().itemCard(id, { meta: (ib.role || ib.mech || '') + (gear ? '' : ' · sende ×' + D.Inv.count(s, id)), right, dis: !!lock }));
      }
      p.append(list);
    }
  });

  // ---------------- HURDACI HASAN ----------------
  shopScene('hasan', {
    kind: 'hasan', npc: 'hasan', title: 'Hurdacı Hasan', defaultTab: 'rod',
    panel(p, s) {
      p.append(tabs(this, [['rod', 'Özel Oltalar'], ['gear', 'Ekipman'], ['special', 'Özel İşler'], ['key', 'Anahtarlar'], ['convert', 'Dönüşüm']]));
      const list = h('div', { class: 'list scroll grow' });
      if (this.tab === 'convert') list.append(h('div', { class: 'small muted' }, 'Hurda Metal (malzeme) ile Scrap (para birimi) ayrı kalemlerdir. Eritme tarifi Hurda Metal\'i Scrap\'e çevirir. Diğer tarifler kötü şansta ara malzeme üretmeni sağlar.'));
      for (const r of Object.values(D.RecipeDB).filter((x) => x.group === this.tab)) {
        const lock = D.Actions.recipeLock(s, r);
        const outId = r.out[0] ? r.out[0].id : 'CUR_SCRAP';
        const reqs = h('div', { class: 'row wrap small', style: { gap: '10px' } },
          r.coin ? need(s.wallet.CUR_COIN, r.coin, 'Coin') : null, r.scrap ? need(s.wallet.CUR_SCRAP, r.scrap, 'Scrap') : null,
          r.materials.map((m) => need(s.inv.items[m.id] || 0, m.n, D.itemName(m.id))));
        const can = !lock && s.wallet.CUR_COIN >= r.coin && s.wallet.CUR_SCRAP >= r.scrap && r.materials.every((m) => (s.inv.items[m.id] || 0) >= m.n);
        const title = r.out.length ? r.out.map((o) => D.itemName(o.id) + (o.n > 1 ? ' ×' + o.n : '')).join(', ') : '+' + r.scrapOut + ' Scrap';
        const card = h('div', { class: 'card' + (lock ? ' dis' : '') }, D.UI.itemIcon(outId, 100),
          h('div', { class: 'col grow', style: { gap: '4px' } }, h('div', { class: 'ttl' }, title), reqs, lock ? h('div', { class: 'no small' }, lock) : null, r.hint ? h('div', { class: 'tiny muted' }, r.hint) : null, r.oneTime ? h('div', { class: 'tiny muted' }, 'Tek seferlik üretim') : null),
          btn('Üret', () => D.UI.act('craft', { recipeId: r.id }, () => { D.Audio.sfx('craft'); this.build(); }, () => title + ' üretildi!'), { cls: 'green', disabled: !can }),
          r.out[0] ? btn('i', () => P().itemDetail(outId), { cls: 'small round' }) : null);
        list.append(card);
      }
      p.append(list);
    }
  });

  // ---------------- GERİ DÖNÜŞÜM FABRİKASI ----------------
  shopScene('factory', {
    kind: 'factory', npc: 'factory', title: 'Geri Dönüşüm Fabrikası', back: 'street', defaultTab: 'fish',
    panel(p, s) {
      p.append(tabs(this, [['fish', 'Balık Değerlendir'], ['trash', 'Çöp Ayrıştır (' + D.sum(Object.values(s.inv.trash)) + ')']]));
      if (this.tab === 'fish') {
        const fish = s.inv.fish.filter((f) => !f.locked && !f.questProtected).sort((a, b) => D.Econ.fishAge(s, b) - D.Econ.fishAge(s, a));
        for (const id of [...this.sel]) if (!fish.some((f) => f.instanceId === id)) this.sel.delete(id);
        const selF = fish.filter((f) => this.sel.has(f.instanceId));
        const coins = D.sum(selF, (f) => D.Econ.fishValue(s, f, 'factory'));
        const mats = {}; selF.forEach((f) => D.Econ.factoryOutput(f).forEach((o) => { mats[o.id] = (mats[o.id] || 0) + o.n; }));
        p.append(h('div', { class: 'small' }, 'Bayat veya istemediğin balıkları düşük coin\'e ya da bölgesine göre materyale çevir (Nadir+ balıklar özel materyal de verir). Fabrika her zaman Rüstem\'in taze fiyatından az öder.'));
        const list = h('div', { class: 'list scroll grow' });
        if (!fish.length) list.append(h('div', { class: 'muted center' }, 'İşlenecek balık yok.'));
        for (const f of fish) list.append(P().fishRow(f, { sel: this.sel.has(f.instanceId), onclick: () => { this.sel.has(f.instanceId) ? this.sel.delete(f.instanceId) : this.sel.add(f.instanceId); this.build(); }, right: [h('div', { class: 'col tiny', style: { textAlign: 'right' } }, h('span', { class: 'price' }, D.fmt(D.Econ.fishValue(s, f, 'factory')) + ' c'), h('span', null, D.Econ.factoryOutput(f).map((o) => D.itemName(o.id)).join(' + ')))] }));
        p.append(list, h('div', { class: 'small' }, 'Seçim: ' + selF.length + ' balık → ' + D.fmt(coins) + ' coin YA DA ' + (Object.entries(mats).map(([id, n]) => D.itemName(id) + ' ×' + n).join(', ') || '—')),
          h('div', { class: 'row wrap', style: { marginTop: '10px' } },
            btn('Coin\'e Çevir', () => D.UI.act('recycleFish', { ids: [...this.sel], mode: 'coin' }, () => { this.sel.clear(); D.Audio.sfx('coin'); this.build(); }, (r) => '+' + D.fmt(r.coins) + ' coin'), { cls: 'yellow', disabled: !selF.length }),
            btn('Materyale Çevir', () => D.UI.act('recycleFish', { ids: [...this.sel], mode: 'material' }, () => { this.sel.clear(); D.Audio.sfx('craft'); this.build(); }, (r) => 'Materyal: ' + Object.entries(r.mats).map(([id, n]) => D.itemName(id) + ' ×' + n).join(', ')), { cls: 'green', disabled: !selF.length }),
            btn('Bayatları Seç', () => { fish.filter((f) => D.Econ.freshness(s, f) === 'STALE').forEach((f) => this.sel.add(f.instanceId)); this.build(); }, { cls: 'small' })));
      } else {
        const list = h('div', { class: 'list scroll grow' });
        const entries = Object.entries(s.inv.trash).filter(([, n]) => n > 0);
        if (!entries.length) list.append(h('div', { class: 'muted center', style: { padding: '30px' } }, 'Çöp torban boş. Denizden çıkan çöpleri buraya getir.'));
        for (const [id, n] of entries) { const t = D.TrashDB[id]; list.append(h('div', { class: 'card' }, D.UI.itemIcon(id, 90), h('div', { class: 'col grow' }, h('div', { class: 'ttl' }, t.name + ' ×' + n), h('div', { class: 'meta' }, '→ ' + t.out.map((o) => D.itemName(o.id) + ' ×' + o.n * n).join(', ') + ' + ' + D.FactoryDB.trashScrapEach * n + ' Scrap' + (t.coin ? ' + ' + t.coin * n + ' coin' : ''))))); }
        p.append(list, h('div', { class: 'tiny muted' }, 'Çöpler ItemDB eşyası değildir; ayrı TrashDB kataloğundandır.'), btn('Tümünü Ayrıştır', () => D.UI.act('recycleTrash', {}, () => { D.Audio.sfx('craft'); this.build(); }, (r) => r.n + ' çöp ayrıştırıldı: ' + Object.entries(r.mats).map(([id, k]) => D.itemName(id) + ' ×' + k).join(', ') + ', +' + r.scrap + ' Scrap'), { cls: 'green', disabled: !entries.length }));
      }
    }
  });

  // ---------------- TEKNE ATÖLYESİ ----------------
  shopScene('boatyard', {
    kind: 'boatyard', npc: 'kropi', title: 'Tekne Atölyesi', back: 'street', defaultTab: 'up',
    panel(p, s) {
      p.append(tabs(this, [['up', 'Yükseltme'], ['bm', 'Kara Pazar Parçaları'], ['cos', 'Görünüm']]));
      const body = h('div', { class: 'scroll grow col' });
      if (this.tab === 'up') {
        const cur = D.boatLevel(s.boat.level), nx = D.boatLevel(s.boat.level + 1);
        body.append(h('div', { class: 'row' }, D.UI.canvas(300, 170, (c) => D.BoatArt.draw(c, cur.level, 150, 140, 0.48, 0.5, { still: true, flag: s.cosmetics.equipped.flag, paint: s.cosmetics.equipped.paint })), h('div', { class: 'small grow' }, 'Mevcut: ', h('b', null, 'Sv.' + cur.level + ' ' + cur.name), ' — ' + cur.desc)));
        const prog = h('div', { class: 'row small' }, 'Tekne ilerlemesi: ' + s.boat.level + '/10', h('div', { class: 'prog grow' }, h('i', { style: { width: s.boat.level * 10 + '%' } })));
        body.append(prog);
        if (nx) {
          const st = (k, f) => { const a = cur.stats[k], b = nx.stats[k]; return h('div', null, f(a) + ' → ', h('b', { class: b !== a ? 'ok' : '' }, f(b))); };
          const tolTR = { rust: 'pas', cold: 'soğuk', heat: 'sıcaklık' };
          const prev = D.UI.canvas(560, 300, (c) => { D.BoatArt.draw(c, nx.level, 280, 240, 0.85, 0.5, { still: true }); });
          body.append(h('h3', null, 'Sıradaki: Sv.' + nx.level + ' ' + nx.name + ' (' + nx.band + ')'),
            h('div', { class: 'row' }, prev, h('div', { class: 'col grow small' }, h('div', null, nx.desc),
              st('capacity', (v) => 'Ambar ' + v), st('specialSlots', (v) => 'Özel yuva ' + v), st('treasure', (v) => 'Hazine +' + Math.round(v * 1000) / 10 + '%'), st('rareMult', (v) => 'Nadir ×' + v), st('waitMult', (v) => 'Bekleme ×' + v),
              h('div', null, 'Çevre dayanımı: ' + (nx.stats.tolerance.map((x) => tolTR[x]).join(', ') || '—')),
              nx.unlocks.length ? h('div', { class: 'ok' }, 'Açar: ' + nx.unlocks.map((r) => D.RegionDB[r].name).join(', ') + (nx.unlocks.includes('BG') ? ' (+ Bermuda koordinatları gerekli)' : '')) : null)),
            h('div', { class: 'row wrap small' }, need(s.wallet.CUR_COIN, nx.cost, 'Coin'), nx.materials.map((m) => need(s.inv.items[m.id] || 0, m.n, D.itemName(m.id))), nx.permit ? need(D.Inv.count(s, 'TCK_BOATYARD_PERMIT'), 1, 'Tersane İzni') : null));
          const can = s.wallet.CUR_COIN >= nx.cost && nx.materials.every((m) => (s.inv.items[m.id] || 0) >= m.n) && (!nx.permit || D.Inv.owns(s, 'TCK_BOATYARD_PERMIT'));
          body.append(btn('Sv.' + nx.level + '\'e Yükselt', () => D.UI.act('upgradeBoat', {}, (r) => { D.Audio.sfx('upgrade'); this.build(); }, (r) => 'Tekne Seviye ' + r.level + '!'), { cls: 'green big', disabled: !can }));
          const miss = nx.materials.filter((m) => (s.inv.items[m.id] || 0) < m.n);
          if (miss.length) body.append(h('div', { class: 'tiny muted' }, 'Kaynaklar: ' + miss.map((m) => D.itemName(m.id) + ' ← ' + P().sources(m.id).slice(0, 3).join(', ')).join(' | ')));
        } else body.append(h('div', { class: 'ok' }, 'Tekne en üst seviyede: Altın Dümen!'));
        const PM = D.ShopDB.boatyard.permit;
        body.append(h('div', { class: 'hr' }), P().itemCard('TCK_BOATYARD_PERMIT', { meta: D.ItemBalanceDB.TCK_BOATYARD_PERMIT.mech, right: [D.Inv.owns(s, PM.id) ? h('span', { class: 'ok' }, 'Sende') : btn('Al (' + D.fmt(PM.coin) + ' c + Cıvata ×5)', () => D.UI.act('buyPermit', {}, () => this.build(), 'Tersane İzni alındı!'), { cls: 'green small', disabled: s.boat.level < PM.requiresBoat || s.wallet.CUR_COIN < PM.coin || (s.inv.items.MAT_03 || 0) < 5 })] }));
      } else if (this.tab === 'bm') {
        body.append(h('div', { class: 'small' }, 'Zıpırleone\'den Miyav ile alınan kara pazar parçaları burada tekneye takılır. Takılan parça kalıcıdır.'));
        for (const id of D.ShopDB.zipirleone.parts) {
          const ib = D.ItemBalanceDB[id]; const inst = s.boat.installed.includes(id); const have = D.Inv.count(s, id) > 0;
          body.append(P().itemCard(id, { meta: ib.mech, right: [inst ? h('span', { class: 'ok' }, 'Takılı') : have ? btn('Tak', () => D.UI.act('installBM', { id }, () => { D.Audio.sfx('craft'); this.build(); }, D.itemName(id) + ' takıldı!'), { cls: 'green small' }) : h('span', { class: 'muted small' }, 'Zıpırleone: ' + ib.miyavPrice + ' Miyav')] }));
        }
      } else {
        body.append(h('div', { class: 'small' }, 'Sahip olduğun boya ve bayraklar teknende hem kasabada hem balık sahnesinde görünür.'));
        const owned = s.cosmetics.owned.filter((id) => ['flag', 'paint'].includes(D.CosmeticDB[id].slot));
        if (!owned.length) body.append(h('div', { class: 'muted' }, 'Henüz kozmetik yok (çark, sandıklar, koleksiyon ödülleri).'));
        for (const id of owned) { const cs = D.CosmeticDB[id]; const on = s.cosmetics.equipped[cs.slot] === id; body.append(h('div', { class: 'card' + (on ? ' sel' : '') }, D.UI.itemIcon(id, 90), h('div', { class: 'grow' }, h('div', { class: 'ttl' }, cs.name), h('div', { class: 'meta' }, cs.source)), btn(on ? 'Çıkar' : 'Kullan', () => D.UI.act('equip', { slot: 'cosmetic', id }, () => this.build()), { cls: 'small' }))); }
      }
      p.append(body);
    }
  });

  // ---------------- BELEDİYE BİNASI (Denizin Defteri arşivi — Kaya Usta, Tersane İzni, duyurular) ----------------
  function archivePanel(p, s) {
    const t = D.Quests.totalCollection(s);
    p.append(h('div', null, 'Kaya Usta belediyenin arşivinde her balığı kaydeder. Toplam: ', h('b', null, t.got + ' / ' + t.total)), h('div', { class: 'prog' }, h('i', { style: { width: (t.got / t.total) * 100 + '%' } })));
    const list = h('div', { class: 'list scroll grow' });
    for (const reg of D.REGION_ORDER) {
      const rc = D.Quests.regionCollection(s, reg);
      list.append(h('div', { class: 'card' }, h('div', { class: 'col grow' }, h('div', { class: 'ttl' }, D.RegionDB[reg].name + ' — ' + rc.got + '/' + rc.total + ' (%' + rc.pct + ')'),
        h('div', { class: 'row wrap' }, D.QuestDB.collection.thresholds.map((pct) => { const key = reg + ':' + pct; const done = s.collectionRewards[key]; return btn('%' + pct + (done ? ' ✓' : ''), () => D.UI.act('claimCollection', { region: reg, pct }, (r) => { P().rewardsModal(D.RegionDB[reg].name + ' %' + pct + ' ödülü', r.rewards); this.build(); }), { cls: 'small ' + (done ? '' : rc.pct >= pct ? 'green' : ''), disabled: done || rc.pct < pct }); })))));
    }
    list.append(h('div', { class: 'card' }, h('div', { class: 'grow ttl' }, '88/88: Altın Dümen Bayrağı + 10.000 coin'), btn(s.collectionRewards.ALL ? 'Alındı ✓' : 'Al', () => D.UI.act('claimCollection', { region: 'ALL', pct: 100 }, (r) => { P().rewardsModal('Denizin Defteri tamamlandı!', r.rewards); this.build(); }), { cls: 'green small', disabled: !!s.collectionRewards.ALL || t.got < t.total })));
    p.append(list, btn('Denizin Defteri\'ni Aç', () => D.Scenes.openFishpedia(), { cls: 'primary big' }));
  }
  const belediye = {
    kind: 'belediye', npc: 'baskan', npc2: 'kaya', title: 'Belediye Binası', defaultTab: 'arsiv',
    panel(p, s) {
      p.append(tabs(this, [['arsiv', 'Denizin Defteri Arşivi'], ['izin', 'Tersane İzni'], ['duyuru', 'Duyurular']]));
      if (this.tab === 'arsiv') return archivePanel.call(this, p, s);
      const body = h('div', { class: 'scroll grow col' });
      if (this.tab === 'izin') {
        const PM = D.ShopDB.boatyard.permit;
        body.append(h('div', { class: 'small' }, 'Tekne Sv.6 ve üstü tersane işleri için belediye izni gerekir. Tekne Sv.' + PM.requiresBoat + ' olduktan sonra alınabilir; bir kez alınır, tüketilmez. (Tekne Atölyesi\'nden de alınabilir.)'),
          P().itemCard('TCK_BOATYARD_PERMIT', { meta: D.ItemBalanceDB.TCK_BOATYARD_PERMIT.mech, right: [D.Inv.owns(s, PM.id) ? h('span', { class: 'ok' }, 'Sende') : btn('Al (' + D.fmt(PM.coin) + ' c + Cıvata ×5)', () => D.UI.act('buyPermit', {}, () => this.build(), 'Tersane İzni alındı!'), { cls: 'green small', disabled: s.boat.level < PM.requiresBoat || s.wallet.CUR_COIN < PM.coin || (s.inv.items.MAT_03 || 0) < 5 })] }),
          h('div', { class: 'row wrap small' }, need(s.boat.level, PM.requiresBoat, 'Tekne Sv.'), need(s.wallet.CUR_COIN, PM.coin, 'Coin'), need(s.inv.items.MAT_03 || 0, 5, D.itemName('MAT_03'))));
      } else {
        body.append(h('div', { class: 'small' }, 'Belediye panosu: denize açılma izinleri ve bölge durumları.'));
        for (const code of D.REGION_ORDER) {
          const R = D.RegionDB[code]; const open = s.unlockedRegions.includes(code);
          body.append(h('div', { class: 'card' + (open ? '' : ' dis') }, h('div', { class: 'col grow' }, h('div', { class: 'ttl' }, R.order + '. ' + R.name + ' ', h('span', { class: 'chip ' + (open ? 'ok' : 'no') }, open ? 'Açık' : 'Kapalı')), h('div', { class: 'meta' }, open ? (R.env ? R.env.text : R.envText) : R.unlockText))));
        }
      }
      p.append(body);
    }
  };
  shopScene('belediye', belediye);
  shopScene('kaya', belediye); // eski kayıtlar/bağlantılar için takma ad

  // ---------------- EVİM (kapının yanındaki ilan panosu) ----------------
  shopScene('home', {
    kind: 'home', title: 'Evim',
    panel(p, s) {
      const offers = s.board.offers.length;
      const ready = Object.values(s.orders).filter((o) => D.Quests.orderState(s, o) === 'COMPLETABLE').length;
      const big = (label, fn, cls, sub) => h('div', { class: 'card' }, h('div', { class: 'col grow' }, h('div', { class: 'ttl' }, label), sub ? h('div', { class: 'meta' }, sub) : null), btn('Aç', fn, { cls: cls || 'primary' }));
      p.append(h('div', { class: 'small' }, 'Küçük ama huzurlu. Kapının hemen yanında kasabanın ilan panosu asılı.'),
        h('div', { class: 'list scroll grow' },
          big('İlan Panosu', () => D.Scenes.openJournal('board'), 'green', offers + ' ilan asılı' + (ready ? ' · ' + ready + ' sipariş teslime hazır' : '')),
          big('Not Defteri', () => D.Scenes.openJournal('notes'), '', 'Kabul edilen siparişler, ana görevler, hikâyeler, günlükler'),
          big('Envanter', () => D.Scenes.openInventory(), '', 'Balık ' + s.inv.fish.length + '/' + D.Inv.capacity(s) + ' · Sandık ' + s.inv.chests.length),
          big('Ekipman', () => D.Scenes.loadout(() => this.build()), '', D.itemName(s.equip.rod) + (s.equip.bait ? ' · ' + D.itemName(s.equip.bait) : '')),
          big('Denizin Defteri', () => D.Scenes.openFishpedia(), '', D.Quests.totalCollection(s).got + ' / 88 tür'),
          big('Ayarlar ve Kayıt', () => D.Scenes.openSettings(), 'wood', 'Son kayıt: ' + new Date(s.savedAt).toLocaleTimeString('tr-TR'))));
    }
  });

  // ---------------- KOMPLO TEORİSYENİ'NİN EVİ (sahil) ----------------
  shopScene('komplo', {
    kind: 'komplo', npc: 'komplo', title: 'Komplo Teorisyeni\'nin Evi',
    panel(p, s) {
      const body = h('div', { class: 'scroll grow col' });
      body.append(h('div', { class: 'row' }, D.UI.portrait('komplo', 150), h('i', { class: 'grow' }, '“' + D.IdleLines.komplo[(s.npc.talk.komplo || 0) % D.IdleLines.komplo.length] + '”')));
      body.append(h('h3', null, 'Teoriler (hikâye)'));
      for (const ch of D.QuestDB.story.filter((c) => c.chain === 'komplo')) {
        const r = s.quests[ch.id]; const stt = r ? r.state : 'LOCKED';
        const step = r && stt !== 'COMPLETED' ? D.Quests.currentStep(s, ch.id) : null;
        body.append(h('div', { class: 'card' + (stt === 'LOCKED' ? ' dis' : '') }, h('div', { class: 'col grow' }, h('div', { class: 'ttl' }, ch.no + '. ' + ch.title), h('div', { class: 'meta' }, stt === 'COMPLETED' ? 'Tamamlandı' : stt === 'LOCKED' ? 'Kilitli — ' + ch.unlock.map(D.Quests.condText).join(', ') : step ? 'Sıradaki: ' + step.text : ''))));
      }
      p.append(body);
    }
  });
})(globalThis.DUMEN);
