// Harita: 8 kanonik bölge (sahte 9. bölge yok). Kilitli bölgeye basınca eksik koşul gösterilir, yanlışlıkla girilmez.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  D.SM.register('map', {
    music: 'town',
    enter(p) { this.sel = (p && p.sel) || (D.Game.state.trip && D.Game.state.trip.regionCode) || 'EL'; this.build(); },
    build() {
      D.UI.clear(this.root);
      const s = D.Game.state;
      D.HUD.set('interior', { back: () => D.SM.go('town'), backLabel: 'Kasabaya Dön' });
      const ox = (D.UI.view.W - 1920) / 2, oy = (D.UI.view.H - 1080) / 2;
      for (const code of D.REGION_ORDER) {
        const [x, y] = D.SceneArt.MAP_POS[code];
        const b = h('button', { class: 'hot', type: 'button', style: { left: x - 120 + ox + 'px', top: y - 70 + oy + 'px', width: '240px', height: '170px' } }, h('span', { class: 'lbl' }, D.RegionDB[code].order + '. ' + D.RegionDB[code].name));
        b.addEventListener('click', () => { if (D.Input.blocked()) return; this.sel = code; D.Audio.sfx('click'); this.build(); });
        this.root.append(b);
      }
      const R = D.RegionDB[this.sel];
      const unlocked = s.unlockedRegions.includes(this.sel);
      const col = D.Quests.regionCollection(s, this.sel);
      const chestNames = [...new Set(R.chestPool.map((c) => D.itemName(c.id)))].join(', ');
      const miss = D.Actions.regionUnlockText(s, this.sel);
      const panel = h('div', { class: 'panel', style: { right: 'calc(40px + var(--safeR))', top: '130px', width: '760px', bottom: '40px' } },
        h('h2', null, R.order + '. ' + R.name),
        h('div', { class: 'scroll grow col' },
          h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, R.role), h('span', { class: 'chip' }, 'Tehlike ' + '▲'.repeat(Math.ceil(R.danger / 2)) + ' (' + R.danger + '/8)'), h('span', { class: unlocked ? 'chip ok' : 'chip no' }, unlocked ? 'Açık' : 'Kilitli')),
          h('div', null, R.biome),
          h('div', { class: 'kv' },
            h('b', null, 'Keşif'), h('span', null, col.got + ' / ' + col.total + ' tür (%' + col.pct + ')'),
            h('b', null, 'Sandıklar'), h('span', null, chestNames),
            h('b', null, 'Önerilen'), h('span', null, R.recommended),
            h('b', null, 'Çevre'), h('span', null, R.env ? R.env.text : R.envText),
            h('b', null, 'Açılış'), h('span', null, R.unlockText)),
          h('div', { class: 'prog' }, h('i', { style: { width: col.pct + '%' } })),
          unlocked ? null : h('div', { class: 'no' }, 'Eksik: ' + miss.join(' · '))),
        h('div', { class: 'row', style: { marginTop: '16px' } },
          btn('Yola Çık', () => {
            const r = D.Game.act('beginTrip', { regionCode: this.sel });
            if (!r.ok) { D.UI.toast(r.message, 'bad'); return; }
            D.SM.go('fishing', { region: this.sel });
          }, { cls: 'green big grow', disabled: !unlocked })));
      this.root.append(panel);
    },
    render(c, W, H, t) {
      const s = D.Game.state;
      D.SM.drawStatic(c, 'map', (cc, w, hh) => D.SceneArt.mapStatic(cc, w, hh));
      const ox = (W - 1920) / 2, oy = (H - 1080) / 2;
      c.save(); c.translate(ox, oy);
      for (const code of D.REGION_ORDER) {
        const [x, y] = D.SceneArt.MAP_POS[code];
        const locked = !s.unlockedRegions.includes(code);
        if (code === this.sel) { D.Art.ellipse(c, x, y + 14, 140, 92); c.lineWidth = 8; c.strokeStyle = '#f2c42a'; c.setLineDash([16, 10]); c.lineDashOffset = -t * 30; c.stroke(); c.setLineDash([]); }
        D.SceneArt.regionIcon(c, code, x, y, 0.9, t, locked);
      }
      // tekne konumu
      const cur = (s.trip && s.trip.regionCode) || 'EL'; const [bx, by] = D.SceneArt.MAP_POS[cur];
      D.BoatArt.draw(c, s.boat.level, bx + 70, by - 40 + Math.sin(t * 2) * 4, 0.2, t);
      c.restore();
    }
  });
})(globalThis.DUMEN);
