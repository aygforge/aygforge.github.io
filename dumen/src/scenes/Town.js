// Kasaba: ev, evin yanında ilan panosu, iskeleye halatla bağlı sallanan tekne, tekneye konmuş Martı, dükkânlar, Liman Sokağı.
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
  const TV = D.ImageView(IMG_W, IMG_H);
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
    gull: [920, 860, 280, 160],          // denizdeki kayık + martı
    tarcov: [1160, 400, 120, 150],
    // Komplo 2. bölüm inceleme noktaları
    lamp: [1570, 395, 110, 85],
    cloud: [1435, 0, 115, 85],
    facade: [1260, 120, 150, 210]
  };
  // Denizde hafifçe dalgalanan kayık (kullanıcı görseli assets/town_boat.webp, 700×354) ve üstündeki martı
  const BOAT = { x: 1060, y: 935, w: 270 };            // merkez (görsel koordinatı) ve genişlik
  const GULL_ON_BOAT = [455, 215];                    // kayık görselinde martının durduğu arka oturak
  const GULL_AT = [835, 662];                         // kayık görseli yoksa: iskele yanındaki kayık
  const GULL_SCALE = () => (D.Assets.get('town_boat') ? (D.NPCArt.sprite('marti') ? 0.68 : 0.55) : 0.42);
  const boatPose = (t) => ({ dy: Math.sin(t * 1.4) * 6, rot: Math.sin(t * 1.1 + 0.6) * 0.035, dx: Math.sin(t * 0.45) * 5 });
  const gullPoint = (t) => {
    if (!D.Assets.get('town_boat')) return GULL_AT;
    const p = boatPose(t), k = BOAT.w / 700, lx = (GULL_ON_BOAT[0] - 350) * k, ly = (GULL_ON_BOAT[1] - 177) * k;
    return [BOAT.x + p.dx + lx * Math.cos(p.rot) - ly * Math.sin(p.rot), BOAT.y + p.dy + lx * Math.sin(p.rot) + ly * Math.cos(p.rot)];
  };
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
      this.hot('street', '← Liman Sokağı', () => D.SM.go('street'), st('zip') || st('kropi') || st('factory') || (D.Quests.activeInspectSpots(s, 'street').length ? '?' : null), { aria: 'Liman Sokağı', lblLeft: true });
      this.hot('home', 'Evim', () => D.SM.go('home'), boardReady ? '✓' : null);
      this.hot('market', 'Market', () => D.SM.go('market'), st('kaya'));
      this.hot('restaurant', 'Restoran (kapalı)', () => D.Scenes.restaurantClosed(), null, { aria: 'Restoran' });
      this.hot('scrapPile', 'Hurdacı Hasan', () => D.SM.go('hasan'), null, { noLabel: true, aria: 'Hurdacı Hasan (hurda yığını)' });
      this.hot('scrapShed', 'Hurdacı Hasan', () => D.SM.go('hasan'), st('hasan'));
      this.hot('belediye', 'Belediye', () => D.SM.go('belediye'), st('baskan'));
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
      const g = gullPoint(this.t || 0), hp = D.NPCArt.headPoint('marti', g[0], g[1], GULL_SCALE()), [x, y] = TV.pt(hp[0], hp[1] - 6);
      D.UI.gullSpeech(this.root, x, y, lines[k % lines.length], null, { w: 440 });
      if (force) D.Audio.sfx('gull');
    },
    update(dt) { this.nextGull -= dt; if (this.nextGull <= 0) { this.nextGull = 13 + Math.random() * 8; if (!D.UI.modalOpen()) this.gull(false); } },
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
      // Denizdeki kayık hafifçe dalgalanır; martı üstünde (görev vermez, replik söyler)
      const bimg = D.Assets.get('town_boat');
      if (bimg) {
        const p = boatPose(t), k = BOAT.w / 700, bh = 354 * k;
        // su halkaları
        c.save(); c.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const q = (t * 0.3 + i / 3) % 1; c.strokeStyle = `rgba(255,255,255,${0.5 * (1 - q)})`; c.lineWidth = 3; c.beginPath(); c.ellipse(BOAT.x + p.dx, BOAT.y + bh * 0.36 + p.dy * 0.5, BOAT.w * (0.48 + q * 0.18), 16 + q * 12, 0, 0.15, Math.PI - 0.15); c.stroke(); }
        c.restore();
        c.save(); c.translate(BOAT.x + p.dx, BOAT.y + p.dy); c.rotate(p.rot);
        c.drawImage(bimg, -BOAT.w / 2, -bh / 2, BOAT.w, bh);
        c.restore();
        // gövdenin alt kısmına su rengi bir şerit: kayık suya oturur
        c.save(); c.globalAlpha = 0.35; c.fillStyle = '#5fb6b8'; c.beginPath(); c.ellipse(BOAT.x + p.dx, BOAT.y + bh * 0.42 + p.dy, BOAT.w * 0.45, 14, 0, 0, Math.PI * 2); c.fill(); c.restore();
      }
      const g = gullPoint(t);
      D.NPCArt.draw(c, 'marti', g[0], g[1], GULL_SCALE(), t);
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
