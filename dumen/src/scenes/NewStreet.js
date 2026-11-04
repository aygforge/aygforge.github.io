// Liman Sokağı (kullanıcı illüstrasyonu: assets/street_main.webp, 2000×848).
// Üç kanonik giriş: Zıpırleone'nin Mekanı (Café), Geri Dönüşüm Fabrikası, Tekne Atölyesi. Ara sokak kasabaya döner.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  const V = D.ImageView(2000, 848);
  D.StreetView = V;
  const AREA = {
    factoryA: [30, 60, 520, 320],
    factoryB: [550, 90, 225, 270],
    cafe: [775, 215, 215, 250],
    alley: [1025, 130, 125, 330],
    boatyard: [1225, 30, 520, 410],
    boatStand: [1790, 400, 210, 150],
    docks: [0, 455, 1240, 270],
    boats: [1255, 450, 300, 240],
    tekir: [645, 315, 115, 150],
    zip_crates: [215, 375, 280, 80]
  };
  const TEKIR_AT = [700, 462];
  D.SM.register('street', {
    music: 'town',
    enter() { this.build(); },
    hot(key, label, fn, alert, opts) {
      opts = opts || {};
      const r = V.rect(AREA[key]);
      const b = h('button', { class: 'hot', type: 'button', 'aria-label': opts.aria || label, style: { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' } },
        label && !opts.noLabel ? h('span', { class: 'lbl' }, label) : null, alert ? h('span', { class: 'alert' }, alert) : null);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (D.Input.blocked()) return; D.Audio.sfx('click'); fn(); });
      this.root.append(b); return b;
    },
    build() {
      D.UI.clear(this.root);
      const s = D.Game.state;
      D.HUD.set('interior', { back: () => D.SM.go('town'), backLabel: '← Kasaba' });
      const st = (npc) => (D.Quests.npcHasStory(s, npc) ? '!' : null);
      const nx = D.boatLevel(s.boat.level + 1);
      this.hot('docks', 'İskele — Balığa Çık', () => D.SM.go('map'), null, { aria: 'Liman iskelesi — Balığa Çık' });
      this.hot('boats', 'Balığa Çık', () => D.SM.go('map'), null, { noLabel: true, aria: 'Tekneler — Balığa Çık' });
      this.hot('factoryA', 'Geri Dönüşüm Fabrikası', () => D.SM.go('factory'), null, { aria: 'Geri Dönüşüm Fabrikası' });
      this.hot('factoryB', 'Fabrika', () => D.SM.go('factory'), null, { noLabel: true, aria: 'Fabrika (arka bina)' });
      this.hot('cafe', 'Zıpırleone\'nin Mekanı', () => D.SM.go('zip'), st('zip'), { aria: 'Zıpırleone\'nin Mekanı' });
      this.hot('alley', '← Kasaba', () => D.SM.go('town'), null, { aria: 'Ara sokak — Kasabaya dön' });
      this.hot('boatyard', 'Tekne Atölyesi', () => D.SM.go('boatyard'), nx && s.wallet.CUR_COIN >= nx.cost ? '↑' : null, { aria: 'Tekne Atölyesi' });
      this.hot('boatStand', 'Tekne Atölyesi', () => D.SM.go('boatyard'), null, { noLabel: true, aria: 'Tekne Atölyesi (kızak)' });
      this.hot('tekir', 'Tekir', () => D.Scenes.talk('tekir'), null, { aria: 'Tekir', noLabel: true });
      for (const sp of D.Quests.activeInspectSpots(s, 'street')) {
        if (!AREA[sp.spot]) continue;
        this.hot(sp.spot, sp.label, async () => { const r = D.Game.act('inspect', { spot: sp.spot }); if (r.ok) { await D.UI.dialog(D.DialogueDB[r.dlg]); this.build(); } }, '?');
      }
      this.root.append(h('div', { style: { position: 'absolute', right: 'calc(40px + var(--safeR))', bottom: '40px' } }, btn('Balığa Çık', () => D.SM.go('map'), { cls: 'green big' })));
    },
    render(c, W, H, t) {
      const img = D.Assets.get('street');
      if (!img) { // görsel yoksa prosedürel sokak
        D.SM.drawStatic(c, 'street:' + D.SceneArt.skyTone().top, (cc, w, hh) => D.SceneArt.streetStatic(cc, w, hh));
        D.SceneArt.streetAnim(c, W, H, t, D.Game.state, { crates: false });
        return;
      }
      D.SM.drawStatic(c, 'street-img', (cc, w, hh) => V.drawStatic(cc, w, hh, img));
      c.save(); V.apply(c, W, H);
      // su köpükleri
      c.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const x = (i * 173) % 2000 + Math.sin(t * 0.6 + i) * 22, y = 720 + ((i * 41) % 120);
        const a = 0.16 + 0.16 * Math.sin(t * 1.2 + i * 1.9);
        c.strokeStyle = `rgba(255,255,255,${Math.max(0, a)})`; c.lineWidth = 3;
        c.beginPath(); c.moveTo(x - 30, y); c.quadraticCurveTo(x, y - 6, x + 30, y); c.stroke();
      }
      // bacalardan ek duman
      for (const [sx, sy] of [[222, 70], [622, 105], [728, 100]]) for (let k = 0; k < 3; k++) {
        const q = (t * 0.12 + k / 3 + sx * 0.001) % 1;
        D.Art.circle(c, sx + q * 60, sy - q * 70, 10 + q * 22); c.fillStyle = `rgba(245,245,240,${0.35 * (1 - q)})`; c.fill();
      }
      D.NPCArt.draw(c, 'tekir', TEKIR_AT[0], TEKIR_AT[1], 0.5, t);
      c.restore();
    }
  });
})(globalThis.DUMEN);
