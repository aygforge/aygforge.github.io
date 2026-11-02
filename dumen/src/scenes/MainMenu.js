// Ana menü: Devam Et / Yeni Oyun / Ayarlar / Tam Ekran. Yeni Oyun mevcut kaydı ikinci onaysız silmez.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  D.SM.register('menu', {
    activeTime: false, music: 'menu',
    enter() { this.build(); },
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
      if (!this._fsl) { this._fsl = () => this.build(); document.addEventListener('fullscreenchange', this._fsl); document.addEventListener('webkitfullscreenchange', this._fsl); }
    },
    exit() { if (this._fsl) { document.removeEventListener('fullscreenchange', this._fsl); document.removeEventListener('webkitfullscreenchange', this._fsl); } },
    render(c, W, H, t) { D.SceneArt.menu(c, W, H, t); D.SceneArt.logo(c, 680 + (W - 1920) / 2, 250, 1.05, t); D.Art.signText(c, 'Sıcak, absürt bir balıkçı kasabası', 690 + (W - 1920) / 2, 380, 40, '#fff6df', '#2a1a10'); }
  });
})(globalThis.DUMEN);
