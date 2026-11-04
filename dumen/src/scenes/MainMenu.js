// Ana menü (kullanıcı görselleri: assets/menu/): DÜMEN tabelası, tahta düğmeler (Devam Et / Yeni Oyun / Kayıtlı Oyun / Ayarlar / Çıkış),
// sağda varil ve üstünde Martı (main_menu replikleri). Arka plan: kasaba illüstrasyonu, okunabilirlik için hafif karartılmış.
// Yeni Oyun mevcut kaydı ikinci onaysız silmez. Görseller yoksa metin düğmelere geri düşer.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  const A = () => D.Assets;
  const BTN = { w: 700, h: 305 };

  D.SM.register('menu', {
    activeTime: false, music: 'menu',
    enter() { this.nextSay = 1.5; this.build(); },
    art() { return ['menu_logo', 'menu_btn_continue', 'menu_btn_new', 'menu_btn_saves', 'menu_btn_settings', 'menu_btn_exit'].every((k) => A().get(k)); },
    // Tahta tabela düğmesi (görsel + erişilebilir etiket)
    sign(key, label, fn, opts) {
      opts = opts || {};
      const w = opts.w || 440, b = h('button', { class: 'btn menu-sign' + (opts.disabled ? ' off' : ''), type: 'button', 'aria-label': label, style: { width: w + 'px', height: Math.round(w * BTN.h / BTN.w) + 'px' } },
        h('img', { src: A().get(key).src, alt: '', draggable: 'false' }));
      if (opts.disabled) { b.disabled = true; b.title = opts.title || ''; }
      b.addEventListener('click', (e) => { e.stopPropagation(); if (b.disabled || D.Input.blocked()) return; D.Audio.sfx('click'); fn(); });
      return b;
    },
    actions() {
      const has = D.Save.hasSave();
      const startNew = () => { D.Game.newGame(); D.SM.go('town', { intro: true }); };
      return {
        has,
        cont: () => {
          const r = D.Game.loadSaved();
          if (!r.state) { D.UI.toast(r.error || 'Kayıt bulunamadı.', 'bad'); return; }
          if (r.warning) D.UI.toast(r.warning, 'bad', 4000);
          D.SM.go('town');
        },
        newGame: () => {
          if (!has) return startNew();
          D.UI.confirm('Yeni oyun?', 'Mevcut kaydın silinecek. Bu geri alınamaz (önce Kayıtlı Oyun → Dışa Aktar ile yedekleyebilirsin).', () => {
            D.UI.confirm('Emin misin?', 'Son onay: eski kayıt silinsin ve yeni oyun başlasın mı?', () => { D.Save.wipe(); startNew(); }, { yesLabel: 'Evet, sil ve başla', cls: 'red' });
          }, { yesLabel: 'Devam', cls: 'yellow' });
        },
        saves: () => this.openSaves(),
        settings: () => D.Scenes.openSettings(),
        exit: () => this.exitGame()
      };
    },
    build() {
      D.UI.clear(this.root);
      const a = this.actions(), v = D.UI.view, cx = this.cx();
      if (this.art()) {
        const logoW = 760, logo = h('img', { class: 'menu-logo', src: A().get('menu_logo').src, alt: 'DÜMEN', draggable: 'false', style: { left: (cx - logoW / 2) + 'px', top: '18px', width: logoW + 'px' } });
        const row1 = h('div', { class: 'menu-row', style: { left: cx + 'px', top: '490px' } },
          this.sign('menu_btn_continue', 'Devam Et', a.cont, { w: 460, disabled: !a.has, title: 'Kayıt yok' }),
          this.sign('menu_btn_new', 'Yeni Oyun', a.newGame, { w: 460 }));
        const row2 = h('div', { class: 'menu-row', style: { left: cx + 'px', top: '720px' } },
          this.sign('menu_btn_saves', 'Kayıtlı Oyun', a.saves, { w: 370 }),
          this.sign('menu_btn_settings', 'Ayarlar', a.settings, { w: 370 }),
          this.sign('menu_btn_exit', 'Çıkış', a.exit, { w: 370 }));
        this.root.append(logo, row1, row2);
      } else {
        this.root.append(h('div', { class: 'col', style: { position: 'absolute', right: 'calc(140px + var(--safeR))', top: '360px', width: '640px', gap: '24px' } },
          btn('Devam Et', a.cont, { cls: 'green big block', disabled: !a.has }), btn('Yeni Oyun', a.newGame, { cls: 'primary big block' }),
          btn('Kayıtlı Oyun', a.saves, { cls: 'big block' }), btn('Ayarlar', a.settings, { cls: 'big block' }), btn('Çıkış', a.exit, { cls: 'wood big block' })));
      }
      // Tam ekran (mobilde gerekli): küçük yuvarlak düğme
      this.root.append(h('div', { style: { position: 'absolute', left: 'calc(24px + var(--safeL))', top: '20px' } },
        btn(D.UI.fullscreen.active() ? '⤡' : '⛶', () => D.UI.fullscreen.toggle(), { cls: 'round wood', aria: D.UI.fullscreen.active() ? 'Tam Ekrandan Çık' : 'Tam Ekran', title: 'Tam Ekran' })));
      // Varil + Martı (sağ): dokununca sıradaki replik
      const g = this.gullBox();
      const gb = h('button', { class: 'hot', type: 'button', 'aria-label': 'Martı', style: { left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: (g.h + 120) + 'px' } });
      gb.addEventListener('click', (e) => { e.stopPropagation(); if (D.Input.blocked()) return; D.Audio.sfx('gull'); this.say(); });
      this.root.append(gb, h('div', { class: 'tiny', style: { position: 'absolute', left: 'calc(30px + var(--safeL))', bottom: '20px', color: '#fff6df', textShadow: '0 2px 3px #000' } }, 'DÜMEN v' + D.VERSION + ' · 88 balık · 102 eşya · 8 bölge' + (D.Game.debug ? ' · DEBUG' : '')));
      void v;
      if (!this._fsl) { this._fsl = () => this.build(); document.addEventListener('fullscreenchange', this._fsl); document.addEventListener('webkitfullscreenchange', this._fsl); }
    },
    // Logo ve düğmelerin ortası: varile yer bırakmak için sahnenin sol-orta kısmı
    cx() { const W = D.UI.view.W; return Math.round(W / 2 - 230); },
    // Varil sağ altta; Martı varilin üstünde
    barrelBox() { const W = D.UI.view.W, H = D.UI.view.H, bw = 330, bh = bw * 568 / 520; return { x: W - bw - 70 - (D.UI.view.safeR || 0), y: H - bh - 30, w: bw, h: bh }; },
    gullBox() { const b = this.barrelBox(), gw = 260, gh = gw * 594 / 460; return { x: b.x + b.w / 2 - gw / 2 + 6, y: b.y - gh + 34, w: gw, h: gh }; },
    say() {
      const L = D.IdleLines.marti_menu || []; if (!L.length) return;
      this.li = ((this.li == null ? Math.floor(Math.random() * L.length) : this.li + 1)) % L.length;
      const g = this.gullBox();
      D.UI.gullSpeech(this.root, g.x + g.w * 0.42, g.y + g.h * 0.06, L[this.li], null, { w: 560 });
      this.nextSay = 10;
    },
    update(dt) { if (this.nextSay == null) this.nextSay = 1.5; this.nextSay -= dt; if (this.nextSay <= 0 && !D.UI.modalOpen()) this.say(); },
    // Kayıtlı Oyun: kayıt özeti + devam / dışa aktar / içe aktar
    openSaves() {
      const r = D.Save.load(), s = r.state;
      D.UI.modal({
        title: 'Kayıtlı Oyun', width: 1100,
        body: (b) => {
          if (s) {
            const species = Object.keys(s.collection || {}).length, mins = Math.round((s.clock && s.clock.playTime || 0) / 60);
            b.append(h('div', { class: 'card' }, D.UI.portrait('marti', 120), h('div', { class: 'col grow' },
              h('div', { class: 'ttl' }, 'Kayıt 1 · Tekne Sv.' + s.boat.level),
              h('div', { class: 'kv' },
                h('b', null, 'Son kayıt'), h('span', null, s.savedAt ? new Date(s.savedAt).toLocaleString('tr-TR') : '—'),
                h('b', null, 'Oynama süresi'), h('span', null, (mins >= 60 ? Math.floor(mins / 60) + ' sa ' : '') + (mins % 60) + ' dk'),
                h('b', null, 'Cüzdan'), h('span', null, D.fmt(s.wallet.CUR_COIN) + ' coin · ' + D.fmt(s.wallet.CUR_SCRAP) + ' hurda · ' + D.fmt(s.wallet.CUR_MIYAV) + ' miyav'),
                h('b', null, 'Bölgeler'), h('span', null, s.unlockedRegions.length + ' / 8'),
                h('b', null, 'Denizin Defteri'), h('span', null, species + ' / 88 tür')))));
            if (r.warning) b.append(h('div', { class: 'small no' }, r.warning));
          } else b.append(h('div', { class: 'muted' }, r.error || 'Henüz kayıtlı oyun yok. Yeni Oyun ile başla ya da dışa aktarılmış bir kaydı içe aktar.'));
          const file = h('input', { type: 'file', accept: '.json,application/json' });
          file.addEventListener('change', () => {
            const f = file.files[0]; if (!f) return; const rd = new FileReader();
            rd.onload = () => { try { const ns = D.Save.importText(String(rd.result)); D.UI.confirm('İçe aktar?', s ? 'Mevcut kayıt bu kayıtla değiştirilecek (eski kayıt yedeklenir).' : 'Bu kayıt yüklensin mi?', () => { D.Game.state = ns; D.Game.saveNow(); D.UI.closeAll(); D.SM.go('town'); D.UI.toast('Kayıt yüklendi', 'good'); }); } catch (e) { D.UI.toast('Geçersiz kayıt: ' + e.message, 'bad', 4000); } };
            rd.readAsText(f);
          });
          file.style.display = 'none';
          b.append(h('h3', null, 'Dosyadan içe aktar'), h('div', { class: 'row' }, btn('Kayıt Dosyası Seç…', () => file.click(), { cls: 'wood' }), h('span', { class: 'small muted' }, 'Dışa aktarılmış .json kayıt dosyası')), file);
        },
        actions: [
          ...(s ? [{ label: 'Bu Kayıtla Devam Et', cls: 'green', fn: () => { D.UI.closeAll(); this.actions().cont(); } },
            { label: 'Dışa Aktar', fn: () => { const txt = D.Save.exportText(s); const a = h('a', { href: URL.createObjectURL(new Blob([txt], { type: 'application/json' })), download: 'dumen-kayit-' + new Date().toISOString().slice(0, 10) + '.json' }); document.body.append(a); a.click(); a.remove(); D.UI.toast('Kayıt dosyası indirildi', 'good'); return true; } }] : []),
          { label: 'Kapat' }]
      });
    },
    // Çıkış: tarayıcı oyunu sekmeyi kapatmaya her zaman izin vermez; önce kaydet, tam ekrandan çık, sonra dene.
    exitGame() {
      D.UI.confirm('Çıkış', 'Oyundan çıkılsın mı? İlerlemen kayıtlı.', async () => {
        if (D.Game.state) D.Game.saveNow();
        try { if (D.UI.fullscreen.active()) await D.UI.fullscreen.toggle(); } catch (e) { /* yok */ }
        try { window.close(); } catch (e) { /* yok */ }
        setTimeout(() => { if (!window.closed) D.UI.toast('Tarayıcı bu sekmeyi kapatmaya izin vermedi. Sekmeyi kapatabilirsin; ilerlemen kayıtlı.', 'gold', 5000); }, 300);
      }, { yesLabel: 'Çık', cls: 'red' });
    },
    exit() { if (this._fsl) { document.removeEventListener('fullscreenchange', this._fsl); document.removeEventListener('webkitfullscreenchange', this._fsl); this._fsl = null; } },
    render(c, W, H, t) {
      const town = A().get('town');
      if (town && this.art()) {
        D.SM.drawStatic(c, 'menu-bg', (cc, w, hh) => {
          D.TownView.drawStatic(cc, w, hh, town);
          const g = cc.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, 'rgba(16,32,46,0.55)'); g.addColorStop(0.55, 'rgba(16,32,46,0.25)'); g.addColorStop(1, 'rgba(16,32,46,0.5)');
          cc.fillStyle = g; cc.fillRect(0, 0, w, hh);
        });
      } else { D.SceneArt.menu(c, W, H, t); D.SceneArt.logo(c, 680 + (W - 1920) / 2, 250, 1.05, t); D.Art.signText(c, 'Sıcak, absürt bir balıkçı kasabası', 690 + (W - 1920) / 2, 380, 40, '#fff6df', '#2a1a10'); }
      const bar = A().get('menu_barrel'), gull = A().get('menu_gull');
      if (bar) { const b = this.barrelBox(); D.Art.shadow(c, b.x + b.w / 2, b.y + b.h - 6, b.w * 0.45, 16, 0.35); c.drawImage(bar, b.x, b.y, b.w, b.h); }
      if (gull) { const g = this.gullBox(), bob = Math.sin(t * 1.7) * 2, br = 1 + Math.sin(t * 2.1) * 0.01; c.save(); c.translate(g.x + g.w / 2, g.y + g.h + bob); c.scale(1, br); c.drawImage(gull, -g.w / 2, -g.h, g.w, g.h); c.restore(); }
    }
  });
})(globalThis.DUMEN);
