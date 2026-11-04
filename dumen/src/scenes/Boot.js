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
      this.ok = false; this.assetsReady = false;
      D.Assets.load().then(() => { this.assetsReady = true; });
      this.ok = true;
    },
    // Yükleme ekranı: Martı'nın "loading_*" repliklerinden biri (okunabilsin diye en az ~1.6 sn)
    update() { if (this.ok && this.assetsReady && this.t > 1.6) { this.ok = false; D.SM.go('menu'); } },
    render(c, W, H, t) {
      c.fillStyle = '#10202e'; c.fillRect(0, 0, W, H);
      if (!this.line) { const L = D.IdleLines.marti_loading || []; this.line = L.length ? L[Math.floor(Math.random() * L.length)] : ''; }
      const dots = '.'.repeat(1 + Math.floor((t || 0) * 3) % 3);
      D.Art.signText(c, 'DÜMEN yükleniyor' + dots, W / 2, H * 0.2, 60, '#f6e7c8');
      if (!this.line) return;
      const bub = D.Assets.get('bubble'), gull = D.NPCArt.sprite('marti');
      const bw = 900, bh = 644, bx = W / 2 - bw / 2 - 120, by = H * 0.28;
      if (bub) c.drawImage(bub, bx, by, bw, bh); else { D.Art.rr(c, bx + 40, by + 40, bw - 80, bh - 200, 40); D.Art.fs(c, '#fffaf0', 6); }
      if (gull) D.NPCArt.draw(c, 'marti', bx + bw * 0.705 + 150, Math.min(H - 30, by + bh + 250), 1.5, t);
      // metni balonun iç alanına sar
      const tx = bx + bw * 0.12, tw = bw * 0.76, ty = by + bh * 0.13, th = bh * 0.57;
      let size = 50, lines;
      const wrap = (sz) => { c.font = '800 ' + sz + 'px "Nunito", "Trebuchet MS", "Segoe UI", system-ui, sans-serif'; const out = []; let cur = ''; for (const w of this.line.split(' ')) { const nx = cur ? cur + ' ' + w : w; if (c.measureText(nx).width > tw && cur) { out.push(cur); cur = w; } else cur = nx; } if (cur) out.push(cur); return out; };
      for (; size > 22; size -= 2) { lines = wrap(size); if (lines.length * size * 1.25 <= th) break; }
      c.fillStyle = '#3a2614'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const y0 = ty + th / 2 - (lines.length - 1) * size * 1.25 / 2;
      lines.forEach((ln, i) => c.fillText(ln, tx + tw / 2, y0 + i * size * 1.25));
    }
  });
})(globalThis.DUMEN);
