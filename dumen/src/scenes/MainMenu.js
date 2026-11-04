// Ana menü: Devam Et / Yeni Oyun / Ayarlar / Tam Ekran. Yeni Oyun mevcut kaydı ikinci onaysız silmez.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  D.SM.register('menu', {
    activeTime: false, music: 'menu',
    enter() { this.nextSay = 1.5; this.build(); },
    build() {
      D.UI.clear(this.root);
      const has = D.Save.hasSave();
      const startNew = () => { D.Game.newGame(); D.SM.go('town', { intro: true }); };
      const col = h('div', { class: 'col', style: { position: 'absolute', right: 'calc(140px + var(--safeR))', top: '360px', width: '640px', gap: '24px' } },
        btn('Devam Et', () => {
          const r = D.Game.loadSaved();
          if (!r.state) { D.UI.toast(r.error || 'Kayıt bulunamadı.', 'bad'); return; }
          if (r.warning) D.UI.toast(r.warning, 'bad', 4000);
          D.SM.go('town');
        }, { cls: 'green big block', disabled: !has }),
        btn('Yeni Oyun', () => {
          if (!has) return startNew();
          D.UI.confirm('Yeni oyun?', 'Mevcut kaydın silinecek. Bu geri alınamaz (önce Ayarlar → Dışa Aktar ile yedekleyebilirsin).', () => {
            D.UI.confirm('Emin misin?', 'Son onay: eski kayıt silinsin ve yeni oyun başlasın mı?', () => { D.Save.wipe(); startNew(); }, { yesLabel: 'Evet, sil ve başla', cls: 'red' });
          }, { yesLabel: 'Devam', cls: 'yellow' });
        }, { cls: 'primary big block' }),
        btn('Ayarlar', () => D.Scenes.openSettings(), { cls: 'big block' }),
        btn(D.UI.fullscreen.active() ? 'Tam Ekrandan Çık' : 'Tam Ekran', () => D.UI.fullscreen.toggle(), { cls: 'wood big block' }));
      this.root.append(col, h('div', { class: 'tiny', style: { position: 'absolute', left: 'calc(30px + var(--safeL))', bottom: '20px', color: '#fff6df' } }, 'DÜMEN v' + D.VERSION + ' · 88 balık · 102 eşya · 8 bölge' + (D.Game.debug ? ' · DEBUG' : '')));
      // Martı (sol alt): ana menü replikleri; dokununca sıradaki
      const gp = this.gullPos(), gw = 300;
      const gb = h('button', { class: 'hot', type: 'button', 'aria-label': 'Martı', style: { left: (gp[0] - gw / 2) + 'px', top: (gp[1] - 280) + 'px', width: gw + 'px', height: '280px' } });
      gb.addEventListener('click', (e) => { e.stopPropagation(); if (D.Input.blocked()) return; D.Audio.sfx('gull'); this.say(); });
      this.root.append(gb);
      if (!this._fsl) { this._fsl = () => this.build(); document.addEventListener('fullscreenchange', this._fsl); document.addEventListener('webkitfullscreenchange', this._fsl); }
    },
    gullPos() { const W = D.UI.view.W; return [820 + (W - 1920) / 2, D.UI.view.H - 40]; },
    say() {
      const L = D.IdleLines.marti_menu || []; if (!L.length) return;
      this.li = ((this.li == null ? Math.floor(Math.random() * L.length) : this.li + 1)) % L.length;
      const gp = this.gullPos(), hp = D.NPCArt.headPoint('marti', gp[0], gp[1], 1.6);
      D.UI.gullSpeech(this.root, hp[0], hp[1] - 6, L[this.li], null, { w: 540 });
      this.nextSay = 10;
    },
    update(dt) { if (this.nextSay == null) this.nextSay = 1.5; this.nextSay -= dt; if (this.nextSay <= 0 && !D.UI.modalOpen()) this.say(); },
    exit() { if (this._fsl) { document.removeEventListener('fullscreenchange', this._fsl); document.removeEventListener('webkitfullscreenchange', this._fsl); } },
    render(c, W, H, t) { D.SceneArt.menu(c, W, H, t); if (D.NPCArt.sprite('marti')) { const gp = this.gullPos(); D.NPCArt.draw(c, 'marti', gp[0], gp[1], 1.6, t); } D.SceneArt.logo(c, 680 + (W - 1920) / 2, 250, 1.05, t); D.Art.signText(c, 'Sıcak, absürt bir balıkçı kasabası', 690 + (W - 1920) / 2, 380, 40, '#fff6df', '#2a1a10'); }
  });
})(globalThis.DUMEN);
