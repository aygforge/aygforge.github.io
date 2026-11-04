// Harita (kullanıcı illüstrasyonu: assets/world_map.webp, 2000×1116). 8 kanonik bölge; sahte 9. bölge yok.
// Kilitli bölgeye basınca eksik koşul gösterilir, yanlışlıkla girilmez. Bilgi kartı seçili bölgenin karşı tarafında açılır.
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  const V = D.ImageView(2000, 1116);
  D.MapView = V;
  // [x, y, w, h] — sıra önemli: sonra eklenen üstte (çakışmada volkan bataklığın, girdap çevresinin üstünde)
  const AREA = {
    YK: [0, 0, 640, 480],
    TB: [650, 0, 690, 320],
    BKM: [1300, 0, 700, 450],
    EL: [0, 490, 640, 626],
    PSK: [660, 740, 520, 376],
    TS: [1180, 620, 820, 496],
    KKD: [1530, 450, 470, 340],
    BG: [680, 330, 600, 400]
  };
  const CENTER = { EL: [330, 760], TS: [1460, 900], PSK: [900, 900], YK: [300, 260], TB: [1000, 170], BKM: [1640, 250], KKD: [1800, 640], BG: [990, 545] };
  D.SM.register('map', {
    music: 'town',
    enter(p) { this.sel = (p && p.sel) || (D.Game.state.trip && D.Game.state.trip.regionCode) || 'EL'; this.build(); },
    build() {
      D.UI.clear(this.root);
      const s = D.Game.state;
      D.HUD.set('interior', { back: () => D.SM.go('town'), backLabel: 'Kasabaya Dön' });
      for (const code of ['YK', 'TB', 'BKM', 'EL', 'PSK', 'TS', 'KKD', 'BG']) {
        const r = V.rect(AREA[code]);
        const R = D.RegionDB[code]; const open = s.unlockedRegions.includes(code);
        const [cx, cy] = V.pt(CENTER[code][0], CENTER[code][1]);
        const b = h('button', { class: 'hot', type: 'button', 'aria-label': R.name, style: { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' } });
        b.addEventListener('click', () => { if (D.Input.blocked()) return; this.sel = code; this.cardHidden = false; D.Audio.sfx('click'); this.build(); });
        this.root.append(b);
        // bölge adı etiketi bölge merkezinin altında (dokunmayı engellemez)
        this.root.append(h('div', { class: 'map-lbl' + (open ? '' : ' locked') + (code === this.sel ? ' sel' : ''), style: { left: cx + 'px', top: (cy + 70) + 'px' } }, R.order + '. ' + R.name + (open ? '' : ' (kilitli)')));
      }
      const R = D.RegionDB[this.sel];
      const unlocked = s.unlockedRegions.includes(this.sel);
      const col = D.Quests.regionCollection(s, this.sel);
      const chestNames = [...new Set(R.chestPool.map((c) => D.itemName(c.id)))].join(', ');
      const miss = D.Actions.regionUnlockText(s, this.sel);
      // Kart dört köşeden, en az bölgeyi (özellikle seçili bölgeyi) kapatan köşede açılır; ✕ ile gizlenebilir.
      const vw = D.UI.view.W, vh = D.UI.view.H, cardW = 700, cardH = 560;
      const corners = [
        { x0: 30, y0: 120, css: { left: 'calc(30px + var(--safeL))', top: '120px' } },
        { x0: vw - 30 - cardW, y0: 120, css: { right: 'calc(30px + var(--safeR))', top: '120px' } },
        { x0: 30, y0: vh - 30 - cardH, css: { left: 'calc(30px + var(--safeL))', bottom: '30px' } },
        { x0: vw - 30 - cardW, y0: vh - 30 - cardH, css: { right: 'calc(30px + var(--safeR))', bottom: '30px' } }
      ];
      const cover = (cn) => D.sum(D.REGION_ORDER, (code) => { const [px, py] = V.pt(CENTER[code][0], CENTER[code][1] + 40); const hit = px > cn.x0 - 40 && px < cn.x0 + cardW + 40 && py > cn.y0 - 30 && py < cn.y0 + cardH + 30; return hit ? (code === this.sel ? 10 : 1) : 0; });
      let best = corners[0], bc = Infinity; for (const cn of corners) { const v = cover(cn); if (v < bc) { bc = v; best = cn; } }
      const side = best.css;
      if (this.cardHidden) return;
      const panel = h('div', { class: 'panel map-card', style: Object.assign({ width: '700px', maxHeight: 'calc(100% - 160px)' }, side) },
        h('h2', null, R.order + '. ' + R.name, h('span', { class: 'grow' }), btn('✕', () => { this.cardHidden = true; this.build(); }, { cls: 'small round', aria: 'Kartı gizle' })),
        h('div', { class: 'scroll grow col' },
          D.Assets.get('region_' + this.sel) ? h('div', { class: 'map-prev' + (unlocked ? '' : ' locked') },
            h('img', { class: 'bg', src: D.Assets.get('region_' + this.sel).src, alt: R.name + ' görünümü' }),
            D.Assets.get('panel_' + this.sel) ? h('img', { class: 'pn', src: D.Assets.get('panel_' + this.sel).src, alt: R.name + ' su altı' }) : null) : null,
          h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, R.role), h('span', { class: 'chip' }, 'Tehlike ' + R.danger + '/8'), h('span', { class: unlocked ? 'chip ok' : 'chip no' }, unlocked ? 'Açık' : 'Kilitli')),
          h('div', { class: 'small' }, R.biome),
          h('div', { class: 'kv' },
            h('b', null, 'Keşif'), h('span', null, col.got + ' / ' + col.total + ' tür (%' + col.pct + ')'),
            h('b', null, 'Sandıklar'), h('span', null, chestNames),
            h('b', null, 'Önerilen'), h('span', null, R.recommended),
            h('b', null, 'Çevre'), h('span', null, R.env ? R.env.text : R.envText),
            h('b', null, 'Açılış'), h('span', null, R.unlockText)),
          h('div', { class: 'prog' }, h('i', { style: { width: col.pct + '%' } })),
          unlocked ? null : h('div', { class: 'no small' }, 'Eksik: ' + miss.join(' · '))),
        h('div', { class: 'row', style: { marginTop: '14px' } },
          btn('Yola Çık', () => {
            const r = D.Game.act('beginTrip', { regionCode: this.sel });
            if (!r.ok) { D.UI.toast(r.message, 'bad'); return; }
            D.SM.go('fishing', { region: this.sel });
          }, { cls: 'green big grow', disabled: !unlocked })));
      this.root.append(panel);
    },
    render(c, W, H, t) {
      const s = D.Game.state;
      const img = D.Assets.get('map');
      if (!img) { D.SM.drawStatic(c, 'map', (cc, w, hh) => D.SceneArt.mapStatic(cc, w, hh)); return; }
      D.SM.drawStatic(c, 'map-img', (cc, w, hh) => V.drawStatic(cc, w, hh, img));
      c.save(); V.apply(c, W, H);
      for (const code of D.REGION_ORDER) {
        const [x, y] = CENTER[code];
        const [, , aw, ah] = AREA[code];
        if (!s.unlockedRegions.includes(code)) { // kilitli: yumuşak karartma + asma kilit
          c.fillStyle = D.Art.rg(c, x, y, 20, Math.max(aw, ah) * 0.55, ['rgba(10,15,30,0.55)', 'rgba(10,15,30,0)']);
          c.fillRect(x - aw, y - ah, aw * 2, ah * 2);
          D.RegionArt.padlock(c, x, y, 1.4);
        }
        if (code === this.sel) {
          D.Art.ellipse(c, x, y, Math.min(aw, 520) * 0.42, Math.min(ah, 380) * 0.36); c.lineWidth = 9; c.strokeStyle = '#f2c42a'; c.setLineDash([22, 14]); c.lineDashOffset = -t * 40; c.stroke(); c.setLineDash([]);
        }
      }
      // teknemiz: son seferin bölgesinde
      const cur = (s.trip && s.trip.regionCode) || 'EL'; const [bx, by] = CENTER[cur];
      D.BoatArt.draw(c, s.boat.level, bx + 90, by - 50 + Math.sin(t * 2) * 5, 0.32, t);
      c.restore();
    }
  });
})(globalThis.DUMEN);
