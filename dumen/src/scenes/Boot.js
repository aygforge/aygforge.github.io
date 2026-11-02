// Boot: veri doğrulama → hata ekranı ya da ana menü. Kayıt sessizce sıfırlanmaz.
(function (D) {
  'use strict';
  const { h } = D.UI;
  D.SM.register('boot', {
    activeTime: false,
    enter() {
      const r = D.Validate.run();
      D.dataReport = r;
      if (!r.ok) {
        this.root.append(h('div', { class: 'panel', style: { left: '200px', right: '200px', top: '120px', bottom: '120px' } },
          h('h2', null, 'Veri doğrulama hatası'), h('p', null, 'Oyun verilerinde tutarsızlık bulundu; güvenli biçimde durduruldu. Kaydın değiştirilmedi.'),
          h('div', { class: 'scroll small grow' }, r.errors.map((e) => h('div', null, '• ' + e)))));
        return;
      }
      this.ok = true;
    },
    update() { if (this.ok && this.t > 0.2) { this.ok = false; D.SM.go('menu'); } },
    render(c, W, H) { c.fillStyle = '#10202e'; c.fillRect(0, 0, W, H); D.Art.signText(c, 'DÜMEN yükleniyor…', W / 2, H / 2, 60, '#f6e7c8'); }
  });
})(globalThis.DUMEN);
