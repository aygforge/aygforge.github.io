// Zıpırleone'nin Mekanı: ilişki, hikâye, Miyav cüzdanı, Kara Pazar Çarkı (1 ücretsiz + 2 ödüllü reklam), kara pazar, Don'un işleri, Arka Oda.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  const P = () => D.Panels;
  const tabs = (self, list) => h('div', { class: 'tabs' }, list.map(([id, label]) => { const b = h('button', { class: 'tab' + (self.tab === id ? ' on' : ''), type: 'button' }, label); b.addEventListener('click', () => { self.tab = id; self.build(); }); return b; }));

  // ---------- ÇARK ----------
  D.Scenes.openWheel = (onDone) => {
    const draw = (c, rot) => {
      const segs = D.WheelDB.segments, n = segs.length, R = 300;
      c.clearRect(0, 0, 700, 700);
      c.save(); c.translate(350, 350); c.rotate(rot);
      segs.forEach((g, i) => { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, (i / n) * 6.283, ((i + 1) / n) * 6.283); c.closePath(); D.Art.fs(c, g.color, 4); c.save(); c.rotate(((i + 0.5) / n) * 6.283); D.Art.signText(c, g.label, R * 0.6, 0, 22, '#fff', '#2a1a10'); c.restore(); });
      D.Art.circle(c, 0, 0, 40); D.Art.fs(c, '#f0c040', 5); c.restore();
      c.beginPath(); c.moveTo(330, 30); c.lineTo(370, 30); c.lineTo(350, 70); c.closePath(); D.Art.fs(c, '#e0453d', 4);
    };
    let rot = 0, spinning = false;
    const cv = D.UI.canvas(700, 700, (c) => draw(c, 0));
    const ctx = cv.getContext('2d');
    const animateTo = (idx, cb) => {
      spinning = true;
      const n = D.WheelDB.segments.length;
      const target = -((idx + 0.5) / n) * 6.283 - Math.PI / 2 + 6.283 * 6;
      const start = rot % 6.283, t0 = performance.now(), dur = D.Game.settings.reducedMotion ? 300 : 3200;
      let lastTick = 0;
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        rot = start + (target - start) * e;
        const dpr = cv.width / 700; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(ctx, rot);
        const seg = Math.floor(rot / (6.283 / n)); if (seg !== lastTick) { lastTick = seg; D.Audio.sfx('wheel'); }
        if (k < 1) requestAnimationFrame(step); else { spinning = false; cb(); }
      };
      step();
    };
    const info = h('div', { class: 'col small' });
    const m = D.UI.modal({
      title: 'Kara Pazar Çarkı', width: 1600, scroll: false,
      body: (b) => {
        const side = h('div', { class: 'col grow' });
        const refresh = () => {
          const s = D.Game.state; const dk = D.Clock.dayKey(s); const w = s.wheel.dayKey === dk ? s.wheel : { freeUsed: false, rewardedUsed: 0 };
          D.UI.clear(side);
          side.append(h('div', null, 'Günde 1 ücretsiz + 2 ödüllü reklamlı çevirme. Gün: ' + dk),
            btn('Ücretsiz Çevir (' + (w.freeUsed ? 0 : 1) + '/1)', () => {
              if (spinning) return;
              const r = D.Game.act('spinWheel', { kind: 'free' });
              if (!r.ok) { D.UI.toast(r.message, 'bad'); return; }
              refresh(); // hak hemen düşer; ödül işlem içinde kesinleşti, animasyon sadece gösterim
              animateTo(r.index, () => { D.Panels.rewardsModal('Çark: ' + D.WheelDB.segments[r.index].label, r.rewards); });
            }, { cls: 'green big', disabled: w.freeUsed }));
          const adOk = D.Ads.isAvailable();
          const adBtn = btn('Reklamla Çevir (' + (2 - w.rewardedUsed) + '/2)', async () => {
            if (spinning) return;
            const ad = await D.Ads.showRewarded();
            if (!ad.ok) { D.UI.toast(ad.reason, 'bad'); return; }
            const r = D.Game.act('spinWheel', { kind: 'ad', token: ad.token });
            if (!r.ok) { D.UI.toast(r.message, 'bad'); return; }
            refresh(); animateTo(r.index, () => D.Panels.rewardsModal('Çark: ' + D.WheelDB.segments[r.index].label, r.rewards));
          }, { cls: 'purple', disabled: !adOk || w.rewardedUsed >= 2 });
          side.append(adBtn, h('div', { class: 'tiny ' + (adOk ? 'ok' : 'muted') }, D.Ads.statusText() + '. Reklam başarısız/iptal olursa hak tüketilmez; gerçek ödül onayı gelmeden hak verilmez.'));
          if (D.Game.debug) side.append(btn('DEBUG: Emülatör çevirme (ödül YOK)', () => { if (spinning) return; const idx = Math.floor(Math.random() * D.WheelDB.segments.length); animateTo(idx, () => D.UI.toast('Emülatör sonucu: ' + D.WheelDB.segments[idx].label + ' — kayda hiçbir ödül yazılmadı.', 'gold', 4000)); }, { cls: 'small debug-only' }));
          side.append(h('div', { class: 'hr' }), h('div', { class: 'tiny' }, 'Olasılıklar: ' + D.WheelDB.segments.map((g) => g.label + ' %' + (g.w / D.sum(D.WheelDB.segments, (x) => x.w) * 100).toFixed(1)).join(' · ')));
        };
        refresh();
        b.append(h('div', { class: 'row' }, cv, side), info);
      },
      onClose: onDone
    });
    return m;
  };

  D.SM.register('zip', {
    music: 'shop',
    enter() { this.tab = 'don'; this.build(); },
    build() {
      D.UI.clear(this.root);
      const s = D.Game.state;
      D.HUD.set('interior', { back: () => D.SM.go('street'), backLabel: '← Yeni Sokak' });
      const p = h('div', { class: 'panel shop-layout' });
      p.append(h('h2', null, 'Zıpırleone\'nin Mekanı', h('span', { class: 'grow' }), btn('Konuş', () => D.Scenes.talk('zip'), { cls: 'small' + (D.Quests.npcHasStory(s, 'zip') ? ' yellow' : '') })));
      p.append(tabs(this, [['don', 'Don'], ['wheel', 'Çark'], ['bm', 'Kara Pazar'], ['jobs', 'Don\'un İşleri'], ['door', 'Arka Kapı']]));
      const body = h('div', { class: 'scroll grow col' });
      const rel = s.npc.rel.zip || 0;
      if (this.tab === 'don') {
        body.append(h('div', { class: 'row' }, D.UI.portrait('zip', 170), h('div', { class: 'col grow' },
          h('div', null, 'İlişki: ', h('b', null, rel + '/100')), h('div', { class: 'prog' }, h('i', { style: { width: rel + '%', background: '#ff8ab8' } })),
          h('div', null, 'Miyav cüzdanı: ', h('b', null, D.fmt(s.wallet.CUR_MIYAV) + ' Miyav')))));
        body.append(h('h3', null, 'Miyav hareketleri'), h('div', { class: 'tiny' }, s.miyavLog.slice(-8).reverse().map((e) => h('div', null, (e.n > 0 ? '+' : '') + e.n + ' · ' + e.reason))), s.miyavLog.length ? null : h('div', { class: 'tiny muted' }, 'Henüz yok.'));
        body.append(h('h3', null, 'Hikâyeler'));
        for (const ch of D.QuestDB.story.filter((c) => c.chain !== 'komplo')) {
          const r = s.quests[ch.id]; const stt = r ? r.state : 'LOCKED';
          const step = r && stt !== 'COMPLETED' ? D.Quests.currentStep(s, ch.id) : null;
          body.append(h('div', { class: 'card' + (stt === 'LOCKED' ? ' dis' : '') }, h('div', { class: 'col grow' }, h('div', { class: 'ttl' }, D.CHAIN_TR[ch.chain] + ' ' + ch.no + ': ' + ch.title), h('div', { class: 'meta' }, stt === 'COMPLETED' ? 'Tamamlandı' : stt === 'LOCKED' ? 'Kilitli — ' + ch.unlock.map(D.Quests.condText).join(', ') : step ? 'Sıradaki: ' + step.text : ''))));
        }
      } else if (this.tab === 'wheel') {
        if (!s.flags.wheelUnlocked) body.append(h('div', { class: 'muted' }, 'Arka duvarda örtülü bir şey var. Don: "Henüz değil. Önce şu kısa boylu köpek bir gitsin." (Tarçov hikâyesinin 5. bölümü "Çark Döner" ile açılır.)'));
        else body.append(h('div', null, 'Tamamen yasal Kara Pazar Çarkı.'), btn('Çarkı Aç', () => D.Scenes.openWheel(() => this.build()), { cls: 'green big' }));
      } else if (this.tab === 'bm') {
        body.append(h('div', { class: 'small' }, 'Kara pazar Miyav ile çalışır. Parçalar Tekne Atölyesi\'nde tekneye takılır.'));
        const Z = D.ShopDB.zipirleone;
        for (const id of Z.parts) {
          const ib = D.ItemBalanceDB[id]; const has = s.boat.installed.includes(id) || D.Inv.owns(s, id);
          body.append(P().itemCard(id, { meta: ib.mech + ' (kaynak fiyatı: ' + ib.miyavPrice + ' Miyav)', right: [has ? h('span', { class: 'ok' }, s.boat.installed.includes(id) ? 'Takılı' : 'Sende') : btn(ib.miyavPrice + ' Miyav', () => D.UI.act('buyMiyav', { shop: 'zip', id }, () => this.build(), D.itemName(id) + ' alındı'), { cls: 'pink small', disabled: s.wallet.CUR_MIYAV < ib.miyavPrice })] }));
        }
        for (const id of Z.specials.concat(Z.baits.map((b) => b.id))) {
          const price = Z.specials.includes(id) ? D.ItemBalanceDB[id].miyavPrice : Z.baits.find((b) => b.id === id).miyav;
          body.append(P().itemCard(id, { meta: (D.ItemBalanceDB[id].mech || D.ItemBalanceDB[id].role) + ' · sende ×' + D.Inv.count(s, id), dis: !s.flags.wheelUnlocked, right: [s.flags.wheelUnlocked ? btn(price + ' Miyav', () => D.UI.act('buyMiyav', { shop: 'zip', id }, () => this.build(), D.itemName(id) + ' alındı'), { cls: 'pink small', disabled: s.wallet.CUR_MIYAV < price }) : h('span', { class: 'muted small' }, 'Çark açılınca')] }));
        }
      } else if (this.tab === 'jobs') {
        const j = s.donJobs.current;
        if (!s.flags.wheelUnlocked) body.append(h('div', { class: 'muted' }, 'Don yeni yüzlere iş vermez. (Tarçov hikâyesini bitir.)'));
        else if (!j) {
          const wait = Math.max(0, s.donJobs.nextAt - s.clock.playTime);
          body.append(h('div', null, 'Don\'un "tamamen yasal" balık işleri: Miyav ve biraz coin kazandırır. Tamamlanan iş: ' + s.donJobs.done), btn(wait > 0 ? 'Don meşgul (' + D.fmtTime(wait) + ')' : 'İş İste', () => D.UI.act('donJobNew', {}, () => this.build()), { cls: 'green', disabled: wait > 0 }));
        } else {
          const flt = { region: j.region, rarityMin: j.rarityMin };
          const have = s.inv.fish.filter((f) => !f.locked && !f.questProtected && D.Quests.fishMatch(f, flt)).length;
          body.append(h('div', { class: 'card' }, h('div', { class: 'col grow' }, h('div', { class: 'ttl' }, j.n + ' × ' + D.Quests.filterText(flt)), h('div', { class: 'meta' }, 'Ödül: ' + j.miyav + ' Miyav + ' + j.coin + ' coin · sende uygun: ' + have)), btn('Teslim Et', () => D.UI.act('donJobDeliver', {}, () => { D.Audio.sfx('coin'); this.build(); }, (r) => '+' + r.miyav + ' Miyav, +' + r.coin + ' coin'), { cls: 'green', disabled: have < j.n })));
        }
      } else if (this.tab === 'door') {
        if (s.flags.secretVenue) body.append(h('div', null, 'Kapı aralık. İçeriden caz ve balık şiiri sesi geliyor.'), btn('Arka Oda\'ya Gir', () => D.SM.go('venue'), { cls: 'green big' }));
        else body.append(h('div', { class: 'muted' }, 'Kilitli, ağır bir kapı. Don: "O kapının arkası aileye mahsus." (Don Zıpırleone\'nin orta oyun hikâyesi — 5. bölüm "Kapının Arkasındaki Mekan" — ile açılır. Bu bir balıkçılık bölgesi değildir.)'));
      }
      p.append(body);
      this.root.append(p);
    },
    render(c, W, H, t) { D.SceneArt.interior(c, W, H, t, 'zip', D.Game.state); }
  });

  // ---------- ARKA ODA (gizli mekan) ----------
  D.SM.register('venue', {
    music: 'YK',
    enter() { this.tab = 'poem'; this.build(); },
    build() {
      D.UI.clear(this.root);
      const s = D.Game.state;
      if (!s.flags.secretVenue) { D.SM.go('zip'); return; }
      D.HUD.set('interior', { back: () => D.SM.go('zip'), backLabel: '← Mekan' });
      const p = h('div', { class: 'panel shop-layout' }, h('h2', null, 'Arka Oda'));
      p.append(tabs(this, [['poem', 'Şiir Gecesi'], ['wall', 'Hatıra Duvarı'], ['shop', 'Arka Oda Butiği'], ['ward', 'Gardırop']]));
      const body = h('div', { class: 'scroll grow col' });
      if (this.tab === 'poem') {
        const done = !!s.tx.once['poem:' + D.Clock.dayKey(s)];
        body.append(h('div', null, 'Her gece Don, "Eksik Defter"den bir balık şiiri okur. Dinleyene 5 Miyav (günde bir kez).'),
          btn(done ? 'Bu geceki şiir dinlendi' : 'Şiiri Dinle', async () => { const r = D.Game.act('poemNight', {}); if (!r.ok) { D.UI.toast(r.message, 'bad'); return; } await D.UI.dialog(D.DialogueDB.poem[r.poem]); D.UI.toast('+5 Miyav', 'good'); this.build(); }, { cls: 'green big', disabled: done }));
      } else if (this.tab === 'wall') {
        body.append(h('div', { class: 'small' }, 'Kasabada yaşadığın hikâyelerin hatıraları.'));
        const done = D.QuestDB.story.filter((c) => s.quests[c.id] && s.quests[c.id].state === 'COMPLETED');
        for (const ch of done) body.append(h('div', { class: 'card' }, h('div', { class: 'col' }, h('div', { class: 'ttl' }, D.CHAIN_TR[ch.chain] + ' — ' + ch.title), h('div', { class: 'meta' }, ch.summary))));
        body.append(h('div', { class: 'tiny muted' }, done.length + ' / ' + D.QuestDB.story.length + ' hatıra'));
      } else if (this.tab === 'shop') {
        for (const c of D.ShopDB.secretVenue.cosmetics) { const cs = D.CosmeticDB[c.id]; const own = s.cosmetics.owned.includes(c.id); body.append(h('div', { class: 'card' }, D.UI.itemIcon(c.id, 90), h('div', { class: 'grow' }, h('div', { class: 'ttl' }, cs.name), h('div', { class: 'meta' }, 'Kozmetik (' + cs.slot + ')')), own ? h('span', { class: 'ok' }, 'Sende') : btn(c.miyav + ' Miyav', () => D.UI.act('buyMiyav', { shop: 'venue', id: c.id }, () => this.build(), cs.name + ' alındı'), { cls: 'pink small', disabled: s.wallet.CUR_MIYAV < c.miyav }))); }
        for (const x of D.ShopDB.secretVenue.specials) body.append(P().itemCard(x.id, { meta: D.ItemBalanceDB[x.id].mech + ' · sende ×' + D.Inv.count(s, x.id), right: [btn(x.miyav + ' Miyav', () => D.UI.act('buyMiyav', { shop: 'venue', id: x.id }, () => this.build(), D.itemName(x.id) + ' alındı'), { cls: 'pink small', disabled: s.wallet.CUR_MIYAV < x.miyav })] }));
      } else {
        const owned = s.cosmetics.owned;
        if (!owned.length) body.append(h('div', { class: 'muted' }, 'Henüz kozmetik yok.'));
        for (const id of owned) { const cs = D.CosmeticDB[id]; const on = s.cosmetics.equipped[cs.slot] === id; body.append(h('div', { class: 'card' + (on ? ' sel' : '') }, D.UI.itemIcon(id, 90), h('div', { class: 'grow' }, h('div', { class: 'ttl' }, cs.name), h('div', { class: 'meta' }, cs.slot)), btn(on ? 'Çıkar' : 'Kullan', () => D.UI.act('equip', { slot: 'cosmetic', id }, () => this.build()), { cls: 'small' }))); }
      }
      p.append(body); this.root.append(p);
    },
    render(c, W, H, t) { D.SceneArt.interior(c, W, H, t, 'venue', D.Game.state); }
  });
})(globalThis.DUMEN);
