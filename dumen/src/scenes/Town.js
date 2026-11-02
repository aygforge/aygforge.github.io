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

  const MARTI_X = 260;
  D.SM.register('town', {
    music: 'town',
    enter(p) {
      this.build();
      this.nextGull = 4;
      if (p && p.intro) setTimeout(() => D.UI.dialog([['marti', 'Hoş geldin, balıkçı. Bu tekne artık benim de. Kira ödemiyorum.'], ['marti', 'Evinin önündeki tekneye dokun, Balığa Çık. Rüstem\'e sat, panodan sipariş al. Ben? Ben sadece burada oturuyorum.']]), 500);
    },
    hot(x, y, w, hh, label, fn, alert) {
      const ox = (D.UI.view.W - 1920) / 2, oy = (D.UI.view.H - 1080) / 2;
      const b = h('button', { class: 'hot', type: 'button', 'aria-label': label, style: { left: x + ox + 'px', top: y + oy + 'px', width: w + 'px', height: hh + 'px' } }, label ? h('span', { class: 'lbl' }, label) : null, alert ? h('span', { class: 'alert' + (alert === '✓' ? ' green' : '') }, alert) : null);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (D.Input.blocked()) return; D.Audio.sfx('click'); fn(); });
      this.root.append(b); return b;
    },
    build() {
      D.UI.clear(this.root);
      const s = D.Game.state;
      D.HUD.set('town', { back: () => { D.Game.saveNow(); D.SM.go('menu'); }, backLabel: 'Menü' });
      const st = (npc) => (D.Quests.npcHasStory(s, npc) ? '!' : null);
      const boardReady = Object.values(s.orders).some((o) => D.Quests.orderState(s, o) === 'COMPLETABLE');
      this.hot(90, 330, 280, 410, 'Evim', () => D.Scenes.openInventory());
      this.hot(380, 500, 170, 240, 'İlan Panosu', () => D.Scenes.openJournal('board'), boardReady ? '✓' : (s.board.offers.length ? null : null));
      this.hot(570, 450, 310, 290, 'Balık Pazarı', () => D.SM.go('rustem'), st('rustem'));
      this.hot(900, 450, 260, 290, 'Market', () => D.SM.go('market'));
      this.hot(1170, 460, 280, 280, 'Hurdacı Hasan', () => D.SM.go('hasan'), st('hasan'));
      this.hot(1460, 420, 230, 320, 'Denizin Defteri', () => D.SM.go('kaya'), st('kaya') || (D.HUD.collectionBadge(s) ? '✓' : null));
      this.hot(1700, 380, 220, 360, 'Yeni Sokak', () => D.SM.go('street'), st('zip') || (D.Quests.activeInspectSpots(s, 'street').length ? '?' : null));
      this.hot(90, 830, 470, 210, 'Tekne — Balığa Çık', () => D.SM.go('map'));
      this.hot(MARTI_X - 70, 820, 140, 110, null, () => this.gull(true));
      // NPC'ler
      this.hot(830, 600, 140, 200, 'Komplo Teorisyeni', () => D.Scenes.talk('komplo'), st('komplo'));
      if (this.tarcovHere(s)) this.hot(420, 620, 120, 180, 'Müfettiş Tarçov', () => D.Scenes.talk('tarcov'), st('tarcov'));
      // İnceleme noktaları (Komplo 2. bölüm)
      const spots = { lamp: [520, 590, 100, 200], cloud: [1160, 140, 200, 120], facade: [1160, 470, 120, 140] };
      for (const sp of D.Quests.activeInspectSpots(s, 'town')) {
        const r = spots[sp.spot]; if (!r) continue;
        this.hot(r[0], r[1], r[2], r[3], sp.label, async () => { const res = D.Game.act('inspect', { spot: sp.spot }); if (res.ok) { await D.UI.dialog(D.DialogueDB[res.dlg]); D.SM.rebuild(); } }, '?');
      }
      this.root.append(h('div', { style: { position: 'absolute', right: 'calc(40px + var(--safeR))', bottom: '40px' } }, btn('Balığa Çık', () => D.SM.go('map'), { cls: 'green big' })));
    },
    tarcovHere(s) { const r1 = s.quests.T1; return r1 && !s.flags.tarcovLeft; },
    gull(force) {
      const lines = D.IdleLines.marti;
      const k = (D.Game.state.npc.talk.marti_ambient || 0);
      D.Game.state.npc.talk.marti_ambient = k + 1; // yalnız süs sayacı (ekonomi dışı)
      const ox = (D.UI.view.W - 1920) / 2, oy = (D.UI.view.H - 1080) / 2;
      D.UI.speech(this.root, MARTI_X - 40 + ox, 690 + oy, lines[k % lines.length]);
      if (force) D.Audio.sfx('gull');
    },
    update(dt) { this.nextGull -= dt; if (this.nextGull <= 0) { this.nextGull = 16 + Math.random() * 10; if (!D.UI.modalOpen()) this.gull(false); } },
    render(c, W, H, t) {
      const s = D.Game.state;
      D.SM.drawStatic(c, 'town:' + D.SceneArt.skyTone().top, (cc, w, hh) => D.SceneArt.townStatic(cc, w, hh, s));
      const completable = Object.values(s.orders).some((o) => D.Quests.orderState(s, o) === 'COMPLETABLE');
      D.SceneArt.townAnim(c, W, H, t, s, { offers: s.board.offers.length, completable });
      const ox = (W - 1920) / 2, oy = (H - 1080) / 2;
      c.save(); c.translate(ox, oy);
      D.NPCArt.draw(c, 'komplo', 900, 795, 0.72, t);
      if (this.tarcovHere(s)) D.NPCArt.draw(c, 'tarcov', 480, 798, 0.8, t);
      c.restore();
    }
  });
})(globalThis.DUMEN);
