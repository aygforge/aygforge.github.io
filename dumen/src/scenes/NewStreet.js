// Yeni Sokak: üç kanonik giriş — Zıpırleone'nin Mekanı, Geri Dönüşüm Fabrikası, Tekne Atölyesi.
(function (D) {
  'use strict';
  const { h } = D.UI;
  D.SM.register('street', {
    music: 'town',
    enter() { this.build(); },
    build() {
      D.UI.clear(this.root);
      const s = D.Game.state;
      D.HUD.set('interior', { back: () => D.SM.go('town'), backLabel: '← Kasaba' });
      const ox = (D.UI.view.W - 1920) / 2, oy = (D.UI.view.H - 1080) / 2;
      const hot = (x, y, w, hh, label, fn, alert) => {
        const b = h('button', { class: 'hot', type: 'button', style: { left: x + ox + 'px', top: y + oy + 'px', width: w + 'px', height: hh + 'px' } }, h('span', { class: 'lbl' }, label), alert ? h('span', { class: 'alert' }, alert) : null);
        b.addEventListener('click', () => { if (!D.Input.blocked()) { D.Audio.sfx('click'); fn(); } });
        this.root.append(b);
      };
      hot(100, 300, 560, 460, 'Zıpırleone\'nin Mekanı', () => D.SM.go('zip'), D.Quests.npcHasStory(s, 'zip') ? '!' : null);
      hot(720, 300, 520, 460, 'Geri Dönüşüm Fabrikası', () => D.SM.go('factory'));
      hot(1290, 290, 520, 470, 'Tekne Atölyesi', () => D.SM.go('boatyard'), D.boatLevel(s.boat.level + 1) && s.wallet.CUR_COIN >= D.boatLevel(s.boat.level + 1).cost ? '↑' : null);
      for (const sp of D.Quests.activeInspectSpots(s, 'street')) {
        hot(540, 560, 200, 200, sp.label, async () => { const r = D.Game.act('inspect', { spot: sp.spot }); if (r.ok) { await D.UI.dialog(D.DialogueDB[r.dlg]); this.build(); } }, '?');
      }
    },
    render(c, W, H, t) {
      D.SM.drawStatic(c, 'street:' + D.SceneArt.skyTone().top, (cc, w, hh) => D.SceneArt.streetStatic(cc, w, hh));
      D.SceneArt.streetAnim(c, W, H, t, D.Game.state, { crates: D.Quests.activeInspectSpots(D.Game.state, 'street').length > 0 || !D.Game.state.flags.tarcovLeft && !!D.Game.state.quests.T1 });
    }
  });
})(globalThis.DUMEN);
