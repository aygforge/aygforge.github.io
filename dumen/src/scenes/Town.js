// Kasaba: ev, evin yanında ilan panosu, iskeleye halatla bağlı sallanan tekne, tekneye konmuş Martı, dükkânlar, Yeni Sokak.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;

  // ---- Ortak: NPC konuşma akışı (hikâye adımı → diyalog; teslim adımı → teslim düğmesi; yoksa rutin replik) ----
  D.Scenes.talk = async (npc) => {
    const s0 = D.Game.state;
    const deliver = D.Quests.deliverStepFor(s0, npc);
    if (deliver) return D.Scenes.deliverPrompt(npc, deliver);
    const r = D.Game.act('talk', { npc });
    if (!r.ok) { D.UI.toast(r.message, 'bad'); return; }
    const vars = { fishCaught: D.Game.state.stats.fishCaught, playMin: Math.max(1, Math.round(D.Game.state.clock.playTime / 60)) };
    if (r.dlg) {
      await D.UI.dialog(D.DialogueDB[r.dlg], { vars });
      for (const ev of r.events || []) if (ev.type === 'storyDone') D.Panels.rewardsModal(ev.text, [], h('div', null, ev.rewards.join(' · ')));
      const nx = D.Quests.deliverStepFor(D.Game.state, npc);
      if (nx) D.Scenes.deliverPrompt(npc, nx);
    } else {
      await D.UI.dialog([[npc, r.idle]]);
    }
    D.SM.rebuild();
  };
  D.Scenes.deliverPrompt = (npc, x) => {
    const s = D.Game.state; const ready = D.Quests.deliverReady(s, x.ch, x.st);
    D.UI.modal({
      title: x.ch.title, width: 1200,
      body: (b) => {
        b.append(h('p', null, x.st.text));
        if (x.st.n) b.append(h('div', { class: ready.okFish ? 'ok' : 'no' }, (ready.okFish ? '✓ ' : '✗ ') + x.st.n + ' × ' + (D.Quests.filterText(x.st.filter) || 'balık') + (ready.fish.length ? ' — seçilecek: ' + ready.fish.map((f) => D.FishDBSource.FishDB[f.fishId].name).join(', ') : '')));
        if (x.st.miyav) b.append(h('div', { class: ready.okM ? 'ok' : 'no' }, (ready.okM ? '✓ ' : '✗ ') + x.st.miyav + ' Miyav (sende ' + s.wallet.CUR_MIYAV + ')'));
        if (x.st.coin) b.append(h('div', { class: ready.okC ? 'ok' : 'no' }, (ready.okC ? '✓ ' : '✗ ') + D.fmt(x.st.coin) + ' coin (sende ' + D.fmt(s.wallet.CUR_COIN) + ')'));
        if (!ready.ok) b.append(h('p', { class: 'small muted' }, 'Korumada (kilitli) balıklar teslim edilmez. Görev için uygun balıklar yakalanınca otomatik ayrılır.'));
      },
      actions: [{ label: 'Sonra' }, {
        label: 'Teslim Et', cls: 'green', fn: (m) => {
          const r = D.Game.act('storyDeliver', { npc });
          if (!r.ok) { D.UI.toast(r.message, 'bad'); return true; }
          m.close();
          D.UI.dialog(D.DialogueDB[r.dlg]).then(() => {
            for (const ev of r.events || []) if (ev.type === 'storyDone') D.Panels.rewardsModal(ev.text, [], h('div', null, ev.rewards.join(' · ')));
            D.SM.rebuild();
          });
          return true;
        }
      }]
    });
  };
  // Oyun olayları → bildirimler (yalnız başarılı işlemlerden gelir)
  D.bus.on('gameEvent', (ev) => {
    if (ev.type === 'region') { D.UI.toast(ev.text, 'gold', 4000); D.Audio.sfx('upgrade'); }
    if (ev.type === 'story') D.UI.toast(ev.text, 'gold', 3500);
  });

  // ---- Kasaba ana görünümü: kullanıcının sağladığı illüstrasyon (assets/town_main.webp, 2000×1103) ----
  // Tüm dokunma alanları görselin piksel koordinatlarında tanımlıdır; ekrana aynı dönüşümle taşınır.
  const IMG_W = 2000, IMG_H = 1103;
  const TV = {
    fit(W, H) {
      const kW = W / IMG_W, kH = H / IMG_H;
      // Geniş ekran: yükseklik en fazla %12 kırpılır, kalan yanlar kenar uzatmasıyla doldurulur.
      // Dar/yüksek ekran: genişlik en fazla %5 kırpılır, alt kısım deniz uzatmasıyla doldurulur.
      const k = kW > kH ? Math.min(kW, kH * 1.12) : Math.min(kH, kW * 1.05);
      const ox = (W - IMG_W * k) / 2, hh = IMG_H * k;
      const oy = hh >= H ? (H - hh) / 2 : 0;
      return { k, ox, oy };
    },
    rect(r) { const v = D.UI.view, f = TV.fit(v.W, v.H); return { left: f.ox + r[0] * f.k, top: f.oy + r[1] * f.k, width: r[2] * f.k, height: r[3] * f.k }; },
    pt(x, y) { const v = D.UI.view, f = TV.fit(v.W, v.H); return [f.ox + x * f.k, f.oy + y * f.k]; },
    drawStatic(c, W, H, img) {
      const { k, ox, oy } = TV.fit(W, H);
      const w = IMG_W * k, hh = IMG_H * k;
      c.fillStyle = '#4fa9b4'; c.fillRect(0, 0, W, H);
      if (ox > 0) { // yan uzatma (kenar şeritleri gerilir, hafif gölgelenir)
        c.drawImage(img, 0, 0, 18, IMG_H, 0, oy, ox + 1, hh);
        c.drawImage(img, IMG_W - 18, 0, 18, IMG_H, ox + w - 1, oy, ox + 1, hh);
        c.fillStyle = 'rgba(20,30,40,0.18)'; c.fillRect(0, 0, ox, H); c.fillRect(ox + w, 0, ox + 1, H);
      }
      if (oy + hh < H) c.drawImage(img, 0, IMG_H - 60, IMG_W, 60, Math.min(0, ox), oy + hh - 1, Math.max(W, w), H - (oy + hh) + 1); // alt: deniz uzatması
      c.drawImage(img, ox, oy, w, hh);
    }
  };
  D.TownView = TV;
  // Görsel koordinatlarında alanlar [x, y, w, h]
  const AREA = {
    street: [-60, 40, 132, 560],
    home: [55, 165, 275, 335],
    market: [445, 130, 300, 360],
    restaurant: [760, 85, 360, 440],
    scrapPile: [820, 0, 440, 90],
    scrapShed: [1050, 90, 215, 275],
    belediye: [1255, 0, 450, 360],
    komplo: [1355, 400, 310, 345],
    rustem: [1705, 390, 290, 280],
    pier: [415, 545, 470, 420],
    boatL: [0, 705, 150, 130],
    gull: [790, 600, 110, 90],
    tarcov: [1160, 400, 120, 150],
    // Komplo 2. bölüm inceleme noktaları
    lamp: [1570, 395, 110, 85],
    cloud: [1435, 0, 115, 85],
    facade: [1260, 120, 150, 210]
  };
  const GULL_AT = [835, 662];
  const TARCOV_AT = [1220, 540];

  D.SM.register('town', {
    music: 'town',
    enter(p) {
      this.build();
      this.nextGull = 4;
      if (p && p.intro) setTimeout(() => D.UI.dialog([['marti', 'Hoş geldin, balıkçı. Bu tekne artık benim de. Kira ödemiyorum.'], ['marti', 'İskeleye ya da tekneye dokun, Balığa Çık. Rüstem Aga\'ya sat, evinin kapısındaki panodan sipariş al. Ben? Ben sadece burada oturuyorum.']]), 500);
    },
    hot(key, label, fn, alert, opts) {
      opts = opts || {};
      const r = TV.rect(AREA[key]);
      if (r.left < 0) { r.width += r.left; r.left = 0; } // ekran dışına taşan kısım kırpılır (etiket görünür kalsın)
      const b = h('button', { class: 'hot' + (opts.cls ? ' ' + opts.cls : ''), type: 'button', 'aria-label': opts.aria || label, style: { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' } },
        label && !opts.noLabel ? h('span', { class: 'lbl' + (opts.lblLeft ? ' left' : '') }, label) : null, alert ? h('span', { class: 'alert' + (alert === '✓' ? ' green' : '') }, alert) : null);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (D.Input.blocked()) return; D.Audio.sfx('click'); fn(); });
      this.root.append(b); return b;
    },
    build() {
      D.UI.clear(this.root);
      const s = D.Game.state;
      D.HUD.set('town', { back: () => { D.Game.saveNow(); D.SM.go('menu'); }, backLabel: 'Menü' });
      const st = (npc) => (D.Quests.npcHasStory(s, npc) ? '!' : null);
      const boardReady = Object.values(s.orders).some((o) => D.Quests.orderState(s, o) === 'COMPLETABLE');
      // Sıra önemli: sonra eklenen üstte kalır.
      this.hot('street', '← Diğer Sokak', () => D.SM.go('street'), st('zip') || st('kropi') || st('factory') || (D.Quests.activeInspectSpots(s, 'street').length ? '?' : null), { aria: 'Diğer Sokak', lblLeft: true });
      this.hot('home', 'Evim', () => D.SM.go('home'), boardReady ? '✓' : null);
      this.hot('market', 'Market', () => D.SM.go('market'));
      this.hot('restaurant', 'Restoran (kapalı)', () => D.Scenes.restaurantClosed(), null, { aria: 'Restoran' });
      this.hot('scrapPile', 'Hurdacı Hasan', () => D.SM.go('hasan'), null, { noLabel: true, aria: 'Hurdacı Hasan (hurda yığını)' });
      this.hot('scrapShed', 'Hurdacı Hasan', () => D.SM.go('hasan'), st('hasan'));
      this.hot('belediye', 'Belediye', () => D.SM.go('belediye'), st('kaya') || (D.HUD.collectionBadge(s) ? '✓' : null));
      this.hot('komplo', 'Komplo Teorisyeni', () => D.SM.go('komplo'), st('komplo'), { aria: 'Komplo Teorisyeni\'nin Evi' });
      this.hot('rustem', 'Rüstem Aga', () => D.SM.go('rustem'), st('rustem'), { aria: 'Balık Pazarı' });
      this.hot('boatL', 'Balığa Çık', () => D.SM.go('map'), null, { noLabel: true, aria: 'Kayık — Balığa Çık' });
      this.hot('pier', 'İskele — Balığa Çık', () => D.SM.go('map'), null, { aria: 'Tekne — Balığa Çık' });
      this.hot('gull', null, () => this.gull(true), null, { aria: 'Martı' });
      if (this.tarcovHere(s)) this.hot('tarcov', 'Müfettiş Tarçov', () => D.Scenes.talk('tarcov'), st('tarcov'));
      for (const sp of D.Quests.activeInspectSpots(s, 'town')) {
        if (!AREA[sp.spot]) continue;
        this.hot(sp.spot, sp.label, async () => { const res = D.Game.act('inspect', { spot: sp.spot }); if (res.ok) { await D.UI.dialog(D.DialogueDB[res.dlg]); D.SM.rebuild(); } }, '?');
      }
      this.root.append(h('div', { style: { position: 'absolute', right: 'calc(40px + var(--safeR))', bottom: '40px' } }, btn('Balığa Çık', () => D.SM.go('map'), { cls: 'green big' })));
    },
    tarcovHere(s) { const r1 = s.quests.T1; return r1 && !s.flags.tarcovLeft; },
    gull(force) {
      const lines = D.IdleLines.marti;
      const k = (D.Game.state.npc.talk.marti_ambient || 0);
      D.Game.state.npc.talk.marti_ambient = k + 1; // yalnız süs sayacı (ekonomi dışı)
      const [x, y] = TV.pt(GULL_AT[0], GULL_AT[1]);
      D.UI.speech(this.root, Math.max(20, x - 60), Math.max(110, y - 200), lines[k % lines.length]);
      if (force) D.Audio.sfx('gull');
    },
    update(dt) { this.nextGull -= dt; if (this.nextGull <= 0) { this.nextGull = 16 + Math.random() * 10; if (!D.UI.modalOpen()) this.gull(false); } },
    render(c, W, H, t) {
      const s = D.Game.state;
      const img = D.Assets.get('town');
      if (!img) { // görsel yoksa prosedürel kasabaya geri düş
        D.SM.drawStatic(c, 'town:' + D.SceneArt.skyTone().top, (cc, w, hh) => D.SceneArt.townStatic(cc, w, hh, s));
        D.SceneArt.townAnim(c, W, H, t, s, { offers: s.board.offers.length, completable: false });
        return;
      }
      D.SM.drawStatic(c, 'town-img', (cc, w, hh) => TV.drawStatic(cc, w, hh, img));
      const { k, ox, oy } = TV.fit(W, H);
      c.save(); c.translate(ox, oy); c.scale(k, k);
      // denizde hafif hareketli köpük çizgileri (görselin üzerinde, düşük opaklık)
      c.lineCap = 'round';
      for (let i = 0; i < 16; i++) {
        const baseX = (i * 241) % 2000, y = 880 + ((i * 53) % 210);
        const x = baseX + Math.sin(t * 0.5 + i) * 26;
        const a = 0.18 + 0.18 * Math.sin(t * 1.3 + i * 1.7);
        c.strokeStyle = `rgba(255,255,255,${Math.max(0, a)})`; c.lineWidth = 3;
        c.beginPath(); c.moveTo(x - 34, y); c.quadraticCurveTo(x, y - 7, x + 34, y); c.stroke();
      }
      // kıyıda parıltılar
      D.Art.sparkles(c, [[1120, 840, 0, 6], [1480, 900, 2, 5], [300, 930, 4, 5], [1750, 960, 1, 6]], t, 'rgba(255,255,255,0.75)');
      // Martı: iskele yanındaki kayığa konmuş (görev vermez)
      D.NPCArt.draw(c, 'marti', GULL_AT[0], GULL_AT[1], 0.42, t);
      if (this.tarcovHere(s)) D.NPCArt.draw(c, 'tarcov', TARCOV_AT[0], TARCOV_AT[1], 0.55, t);
      c.restore();
    }
  });

  // Restoran: şimdilik kapalı (ileride güncellemeyle açılacak)
  D.Scenes.restaurantClosed = () => {
    D.UI.modal({
      title: 'Restoran', width: 1100,
      body: (b) => {
        b.append(h('div', { class: 'row' },
          D.UI.canvas(260, 200, (c) => { c.save(); c.translate(130, 100); c.rotate(-0.06); D.Art.rr(c, -110, -60, 220, 120, 14); D.Art.fs(c, '#f5e2b8', 6); D.Art.signText(c, 'KAPALI', 0, -12, 46, '#c9302c'); D.Art.signText(c, 'Tadilatta', 0, 32, 26, '#5a2a10'); c.restore(); }),
          h('div', { class: 'col grow' }, h('div', { class: 'b' }, 'Mutfak şimdilik kapalı.'), h('div', null, 'Restoran ileride bir güncellemeyle açılacak. Kapıdaki not: "Balıkları Rüstem Aga\'dan alıyoruz, merak etmeyin."'),
            h('div', { class: 'small muted' }, 'Martı: "Ben menüyü zaten ezbere biliyorum. Simit, simit, bir de simit."'))));
      },
      actions: [{ label: 'Tamam' }]
    });
  };
})(globalThis.DUMEN);
