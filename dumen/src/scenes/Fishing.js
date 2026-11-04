// Tek balıkçılık sahnesi + RegionDB (bölge başına kopya kod yok).
// FishingState: READY → CASTING → WAITING → SELECT → FIGHT | TREASURE | (çöp/parıltı) → RESULT → READY
(function (D) {
  'use strict';
  const { h, btn } = D.UI;
  // Su altı paneli: çerçeveli görsel varsa dış dikdörtgen FRAME, oyun alanı = çerçevenin iç penceresi.
  // Görsel yoksa eski prosedürel panel (iç pencere = PANEL).
  const PANEL = { y: 130, w: 840, h: 620 };
  const FRAME = { y: 84, w: 860, h: 718 };
  const REEL = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'], UNREEL = ['RB1', 'RB2', 'RB3', 'RB4', 'RB5'];
  const REEL_FPS = 14, UNREEL_FPS = 12;

  D.SM.register('fishing', {
    music: (p) => p.region,
    enter(p) {
      this.region = p.region;
      this.state = 'READY';
      this.enc = null; this.sim = null; this.bar = null; this.reel = false; this.tele = null; this.banner = null; this.bannerT = 0; this.teleT = 0;
      this.useKacak = false; this.sfxT = 0; this.castT = 0; this.selectT = 0;
      this._keys = [D.bus.on('key', (e) => this.onKey(e, true)), D.bus.on('keyup', (e) => this.onKey(e, false)), D.bus.on('releaseAll', () => { this.reel = false; })];
      this.build();
    },
    exit() {
      for (const off of this._keys) off();
      const s = D.Game.state;
      if (s.pendingCast) D.Game.act('resolveCast', { castId: s.pendingCast.castId, outcome: 'abandon' });
    },
    px() { return this.pr().x; },
    // çerçeve dış dikdörtgeni (görsel paneller için)
    frame() { return { x: D.UI.view.W - FRAME.w - 26 - (D.UI.view.safeR || 0), y: FRAME.y, w: FRAME.w, h: FRAME.h }; },
    // oyun alanı (iç pencere): siluetler, balık, kanca burada
    pr() {
      if (D.RegionArt.hasPanel(this.region)) { const f = this.frame(); return D.RegionArt.panelInner(this.region, f.x, f.y, f.w, f.h); }
      return { x: D.UI.view.W - PANEL.w - 40, y: PANEL.y, w: PANEL.w, h: PANEL.h };
    },
    L() { return D.Loadout.compute(D.Game.state, this.region); },
    onKey(e, down) {
      if (this.state === 'FIGHT') {
        if (e.code === 'Space') { this.reel = down; e.preventDefault && e.preventDefault(); }
        if (down && (e.code === 'Enter' || e.code === 'KeyE')) this.doPull();
      } else if (this.state === 'TREASURE' && down && e.code === 'Space') this.stopBar();
      else if (this.state === 'READY' && down && e.code === 'Space' && !D.UI.modalOpen()) this.cast();
      else if (this.state === 'SELECT' && down && /^Digit[1-4]$/.test(e.code)) { const i = +e.code.slice(5) - 1; if (this.enc.candidates[i]) this.pick(i); }
    },
    setState(st) { this.state = st; this.build(); },
    build() {
      D.UI.clear(this.root);
      D.HUD.set('wallet', { inv: this.state === 'READY', onInvClose: () => { if (this.state === 'READY' && D.SM.cur === this) this.build(); } });
      const s = D.Game.state; const R = D.RegionDB[this.region];
      const L = this.L();
      this.root.append(h('div', { class: 'row', style: { position: 'absolute', left: 'calc(20px + var(--safeL))', top: 'calc(var(--hudH) + 20px)', gap: '10px' } },
        h('span', { class: 'chip', style: { fontSize: '.8em' } }, R.order + '. ' + R.name),
        R.env ? h('span', { class: 'chip ' + (L.envActive || L.decoys || L.fog || L.unsignaled ? 'no' : 'ok'), style: { fontSize: '.62em', maxWidth: '760px', whiteSpace: 'normal' } }, (L.envActive || L.decoys || L.fog || L.unsignaled ? 'Çevre: ' : 'Çevreye karşı korumalısın: ') + R.env.text) : null));
      if (this.state === 'READY') this.buildReady(s, L);
      else if (this.state === 'SELECT') this.buildSelect(s);
      else if (this.state === 'FIGHT') this.buildFight(s);
      else if (this.state === 'TREASURE') this.buildTreasure();
      else if (this.state === 'CASTING' || this.state === 'WAITING') this.root.append(h('div', { class: 'banner' }, this.state === 'CASTING' ? 'Olta atıldı…' : (this.enc && this.enc.suspicious ? this.enc.suspicious : 'Bekle… sular kıpırdıyor.')));
    },
    buildReady(s, L) {
      const bait = s.equip.bait; const baitN = bait ? s.inv.items[bait] || 0 : 0;
      const full = D.Inv.fishFull(s);
      const kac = s.equip.specials.includes('SPC_25') && (s.inv.items.SPC_25 || 0) > 0;
      const eq = h('div', { class: 'meters', style: { gridTemplateColumns: 'auto 1fr', minWidth: '980px' } },
        h('span', null, 'Olta'), h('div', { class: 'row' }, h('span', { class: 'grow' }, D.itemName(s.equip.rod) + ' · ' + D.itemName(s.equip.line) + ' · ' + D.itemName(s.equip.hook) + ' · ' + D.itemName(s.equip.float)), btn('Değiştir', () => D.Scenes.loadout(() => this.build()), { cls: 'small' })),
        h('span', null, 'Yem'), h('div', { class: 'row' }, h('span', { class: 'grow' }, bait ? D.itemName(bait) + ' ×' + baitN + (baitN ? '' : ' (kalmadı)') : 'Yemsiz (yem olmadan da av olur)'), btn('Seç', () => D.Scenes.loadout(() => this.build(), 'bait'), { cls: 'small' })),
        h('span', null, 'Özel'), h('div', { class: 'row' }, h('span', { class: 'grow small' }, L.specialsEquipped.length ? L.specialsEquipped.map((id) => D.itemName(id)).join(', ') : 'Takılı özel eşya yok (' + D.Inv.specialSlots(s) + ' yuva)'), btn('Tak', () => D.Scenes.loadout(() => this.build(), 'special'), { cls: 'small' })),
        h('span', null, ''), h('div', { class: 'tiny muted' }, 'Yem atış başına 1 adet tüketilir (sonuçtan bağımsız). ' + (full ? 'AMBAR DOLU — kasabada sat ya da Envanter\'den balık bırak.' : 'Ambar ' + s.inv.fish.length + '/' + D.Inv.capacity(s) + '.')));
      if (kac) { const t = h('label', { class: 'toggle small' }, Object.assign(h('input', { type: 'checkbox' }), { checked: this.useKacak, onchange: (e) => { this.useKacak = e.target.checked; } }), 'Kaçak Yem kullan (' + s.inv.items.SPC_25 + ')'); eq.append(h('span', null, ''), t); }
      const ctrl = h('div', { class: 'ctrl' },
        h('div', { class: 'col' }, btn('Haritaya Dön', () => D.SM.go('map', { sel: this.region }), { cls: 'wood' }), btn('Kasabaya Dön', () => D.SM.go('town'), { cls: 'wood' })),
        btn('Oltayı At', () => this.cast(), { cls: 'green big', disabled: full }));
      this.root.append(h('div', { class: 'fish-hud' }, eq, ctrl));
    },
    cast() {
      if (this.state !== 'READY') return;
      const s = D.Game.state;
      const r = D.Game.act('beginCast', { regionCode: this.region, useBait: !!s.equip.bait && (s.inv.items[s.equip.bait] || 0) > 0, useKacak: this.useKacak });
      if (!r.ok) { D.UI.toast(r.message, 'bad'); return; }
      this.useKacak = false;
      this.enc = r.encounter; this.castId = r.castId; this.castT = 0;
      D.Audio.sfx('cast');
      this.setState('CASTING');
    },
    buildSelect(s) {
      this.root.append(h('div', { class: 'banner', style: { left: '26%', top: 'calc(var(--hudH) + 104px)', maxWidth: '900px' } }, 'Bir hedef seç! Siluete dokun.' + (this.enc.candidates.length > 1 ? ' (Büyük siluet = büyük/nadir av olabilir)' : '')));
      // Su altı panelinin tamamı dokunma alanı: basıldığı anda (pointerdown) en yakın siluet seçilir.
      // Hareketli küçük düğmeler yerine tek alan → parmak kayınca da kaçırmaz, yanlış/boş dokunuş ölü ekran yaratmaz.
      const P = this.pr();
      const zone = h('div', { class: 'sil-zone', role: 'button', 'aria-label': 'Hedef seç (siluete dokun)', style: { position: 'absolute', left: P.x + 'px', top: P.y + 'px', width: P.w + 'px', height: P.h + 'px', touchAction: 'none', cursor: 'pointer' } });
      zone.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (this.state !== 'SELECT') return;
        const v = D.UI.view;
        const x = (e.clientX - v.offX) / v.scale, y = (e.clientY - v.offY) / v.scale;
        this.pick(this.nearestSil(x, y));
      });
      this.root.append(zone);
      this.silBtns = null;
      const pc = s.pendingCast;
      const sock = s.equip.specials.includes('SPC_14') && (s.inv.items.SPC_14 || 0) > 0 && s.trip && s.trip.firstCastId === this.castId && !s.trip.rerollUsed;
      if (sock) this.root.append(h('div', { style: { position: 'absolute', left: 'calc(30px + var(--safeL))', bottom: '40px' } }, btn('Şanslı Çorap: Yeniden Seç', () => {
        const r = D.Game.act('rerollCast', { castId: this.castId });
        if (r.ok) { this.enc = Object.assign({}, this.enc, r.encounter); this.selectT = 0; D.UI.toast('Siluetler yeniden zarlandı!', 'gold'); this.build(); } else D.UI.toast(r.message, 'bad');
      }, { cls: 'purple' })));
      void pc;
    },
    nearestSil(x, y) {
      let best = 0, bd = Infinity;
      this.enc.candidates.forEach((c, i) => { const [sx, sy] = this.silPos(i, this.t); const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = i; } });
      return best;
    },
    silPos(i, t) {
      const c = this.enc.candidates[i], P = this.pr();
      const lane = P.y + P.h * 0.23 + c.lane * (P.h * 0.5);
      const x = P.x + P.w * 0.19 + ((Math.sin(t * c.speed * 0.6 + c.phase) + 1) / 2) * (P.w * 0.62);
      return [x, lane + Math.sin(t * 2 + c.phase) * 14, Math.cos(t * c.speed * 0.6 + c.phase) < 0];
    },
    pick(i) {
      if (this.state !== 'SELECT') return;
      const c = this.enc.candidates[i]; this.pickIdx = i;
      D.Audio.sfx('bite'); D.Audio.vibrate(30);
      if (c.type === 'fish') {
        this.sim = new D.FightSim({ fishId: c.fishId, size: c.size, L: this.L(), seed: D.RNG.hashStr(D.Game.state.seed + ':fight:' + this.castId), hircin: c.hircin });
        this.banner = null; this.tele = null;
        this.setState('FIGHT');
      } else if (c.type === 'chest') {
        this.bar = new D.TreasureBar(D.RNG.hashStr(D.Game.state.seed + ':bar:' + this.castId), c.chestId, this.L());
        this.setState('TREASURE');
      } else if (c.type === 'trash') this.finish({ outcome: 'trash' });
      else this.finish({ outcome: 'decoy' });
    },
    buildFight(s) {
      const sim = this.sim;
      const meter = (cls) => { const m = h('div', { class: 'meter ' + cls }, h('i')); return m; };
      this.mInat = meter('inat'); this.mTen = meter('tension'); this.mDist = meter('dist');
      this.mDist.append(h('span', { class: 'mark', style: { left: (sim.pullDist / sim.maxDist) * 100 + '%' } }));
      this.lInat = h('span', null, ''); this.lTen = h('span', null, ''); this.lDist = h('span', null, '');
      const meters = h('div', { class: 'meters' }, h('span', null, 'İnat'), this.mInat, this.lInat, h('span', null, 'Gerilim'), this.mTen, this.lTen, h('span', null, 'Mesafe'), this.mDist, this.lDist);
      // SAR: kullanıcının makara kareleri — basılıyken sarma (F1→F6 döngü), bırakınca bırakma (RB1→RB5 bir kez)
      const A = D.Assets, reelArt = REEL.every((f) => A.get('reel_' + f)) && UNREEL.every((f) => A.get('reel_' + f));
      const reelB = reelArt
        ? h('button', { class: 'btn reel art', type: 'button', 'aria-label': 'Sar (basılı tut)' }, this.reelImg = h('img', { src: A.get('reel_RB5').src, alt: '', draggable: 'false' }), h('span', { class: 'cap' }, 'SAR'))
        : h('button', { class: 'btn reel', type: 'button', 'aria-label': 'Sar (basılı tut)' }, 'SAR');
      if (!reelArt) this.reelImg = null;
      this.reelB = reelB; this.reelAnim = { mode: 'idle', t: 0, frame: 'RB5' };
      this.holdH = D.Input.hold(reelB, (on) => { this.reel = on; });
      this.pullB = A.get('btn_cek')
        ? btn(null, () => this.doPull(), { cls: 'pull art', aria: 'Çek', icon: h('img', { src: A.get('btn_cek').src, alt: '', draggable: 'false' }) })
        : btn('ÇEK', () => this.doPull(), { cls: 'pull', aria: 'Çek' });
      const specials = h('div', { class: 'col' });
      const L = sim.L;
      for (const id of L.actives) {
        const ib = D.ItemBalanceDB[id];
        if (id === 'SPC_14') continue;
        if (ib.kind === 'charge') { const b = btn(D.itemName(id), () => { if (sim.useCharge(id)) { b.disabled = true; D.Audio.sfx('quest'); } else D.UI.toast('Şu an kullanılamaz.', 'bad'); }, { cls: 'purple small', icon: D.UI.itemIcon(id, 50) }); specials.append(b); }
        if (ib.kind === 'consumable' && id !== 'SPC_25') {
          const n = s.inv.items[id] || 0;
          const b = btn(D.itemName(id) + ' ×' + n, () => {
            const r = D.Game.act('useConsumable', { castId: this.castId, id });
            if (!r.ok) { D.UI.toast(r.message, 'bad'); return; }
            sim.applyConsumable(id); b.disabled = true; D.Audio.sfx('quest');
          }, { cls: 'pink small', disabled: n <= 0, icon: D.UI.itemIcon(id, 50) });
          specials.append(b);
        }
      }
      this.teleEl = h('div', { class: 'tele', style: { display: 'none', left: '26%' } });
      this.bannerEl = h('div', { class: 'banner', style: { display: 'none', left: '26%', top: 'calc(var(--hudH) + 104px)', maxWidth: '900px' } });
      this.root.append(this.teleEl, this.bannerEl, h('div', { class: 'fish-hud' }, meters, specials, h('div', { class: 'ctrl' }, this.pullB, reelB)));
      this.fightUI();
    },
    fightUI() {
      const sim = this.sim; if (!sim || !this.mInat) return;
      const sn = sim.snapshot();
      this.mInat.firstChild.style.width = (sn.inat * 100).toFixed(1) + '%';
      this.mTen.firstChild.style.width = '0'; this.mTen.firstChild.style.left = (sn.tension * 100).toFixed(1) + '%'; this.mTen.firstChild.style.width = '8px';
      this.mDist.firstChild.style.width = Math.min(100, (sn.dist / sn.maxDist) * 100).toFixed(1) + '%';
      this.lInat.textContent = Math.round(sn.inat * 100) + '%' + (sn.phase === 'son' ? ' Son Çırpınış' : sim.boss ? ' Evre ' + sn.phase : '');
      this.lTen.textContent = sn.red ? 'KIRMIZI ' + Math.round(sn.redFrac * 100) + '%' : sn.tension >= 0.6 ? 'Sarı' : 'Yeşil';
      this.lTen.style.color = sn.red ? '#b8301f' : sn.tension >= 0.6 ? '#b07a10' : '#2f8a3f';
      this.lDist.textContent = sn.dist.toFixed(1) + ' m' + (sn.fleeing ? ' KAÇIYOR' : '');
      this.mTen.classList.toggle('warn', sn.warn || sn.redFrac > 0.5);
      this.pullB.classList.toggle('ready', sn.canPull);
    },
    doPull() {
      if (this.state !== 'FIGHT' || !this.sim) return;
      const r = this.sim.pull();
      if (r === 'penalty') D.Audio.sfx('alarm');
    },
    buildTreasure() {
      const bar = this.bar;
      const el = h('div', { class: 'treasure-bar' },
        h('div', { class: 'y', style: { left: ((bar.center - bar.yellow / 2) * 100) + '%', width: bar.yellow * 100 + '%' } }),
        h('div', { class: 'g', style: { left: ((bar.center - bar.green / 2) * 100) + '%', width: bar.green * 100 + '%' } }));
      this.barM = h('div', { class: 'm' }); el.append(this.barM);
      const zone = h('div', { style: { position: 'absolute', inset: '0', touchAction: 'none' } });
      const tapBtn = h('button', { class: 'btn yellow big', type: 'button', style: { position: 'absolute', left: '50%', top: '600px', transform: 'translateX(-50%)', minWidth: '520px', minHeight: '180px', fontSize: '1.4em', touchAction: 'none' } }, 'DOKUN!');
      this.root.append(zone, h('div', { class: 'banner' }, 'Hazine! İşaretçi YEŞİL\'deyken DOKUN\'a bas (sarı da geçerli).'), el, tapBtn);
      // Yalnız bu andan sonraki YENİ basışlar sayılır; önceki sahneden kalan basılı parmak otomatik açmaz.
      // Dinleyici sahne kökünde: DOKUN düğmesi, bar ve boş alan — hepsi aynı anda (pointerdown) algılanır.
      const since = performance.now() + 120;
      this.unTap = D.Input.freshTap(this.root, since, () => { tapBtn.classList.add('pressed'); this.stopBar(); });
    },
    stopBar() {
      if (this.state !== 'TREASURE' || !this.bar || this.bar.done) return;
      const q = this.bar.stop();
      if (this.unTap) this.unTap();
      D.Audio.sfx(q === 'red' ? 'fail' : 'chest');
      setTimeout(() => this.finish({ outcome: 'chest', quality: q }), 350);
    },
    finish(o) {
      if (this.state === 'RESULT') return;
      const prev = this.state; this.state = 'RESULT';
      if (this.holdH) { this.holdH.dispose(); this.holdH = null; }
      this.reel = false;
      const payload = { castId: this.castId, index: this.pickIdx, outcome: o.outcome, quality: o.quality, everRed: o.everRed };
      if (o.outcome === 'abandon') payload.index = 0;
      const r = D.Game.act('resolveCast', payload);
      void prev;
      if (!r.ok) { D.UI.toast(r.message, 'bad'); this.setState('READY'); return; }
      this.showResult(r);
    },
    showResult(r) {
      const s = D.Game.state;
      D.UI.clear(this.root);
      const again = () => { this.enc = null; this.sim = null; this.bar = null; this.setState('READY'); };
      const actions = [{ label: 'Haritaya Dön', cls: 'wood', fn: () => { D.SM.go('map', { sel: this.region }); } }, { label: 'Kasabaya Dön', cls: 'wood', fn: () => { D.SM.go('town'); } }, { label: 'Tekrar At', cls: 'green', fn: () => { again(); } }];
      let title, body;
      // Martı yorumu: portre + kullanıcının konuşma balonu (modal içinde, akışta)
      // Kompakt: balon (320 px) + kuyruğun ucunda küçük Martı portresi
      const gull = (ok) => { const L2 = D.IdleLines[ok ? 'marti_success' : 'marti_fail']; const w = 320, bh = Math.round(w * 644 / 900), pr = 88;
        const pt = D.UI.portrait('marti', pr); pt.style.position = 'absolute'; pt.style.left = Math.round(w * 0.705 - 14) + 'px'; pt.style.top = (bh - 34) + 'px';
        return h('div', { class: 'gull-say', style: { position: 'relative', width: (w + pr) + 'px', height: (bh - 34 + pr) + 'px', flex: '0 0 auto' } }, D.UI.gullBubble(L2[(s.stats.casts) % L2.length], { inline: true, w, fs: 0.8 }), pt); };
      if (r.kind === 'fish' && r.outcome === 'caught') {
        const f = r.fish, b = D.FishBalanceDB[f.fishId], src = D.FishDBSource.FishDB[f.fishId];
        const leg = b.rarity === 'legendary' || b.rarity === 'boss';
        D.Audio.sfx(leg ? 'legendary' : 'catch'); D.Audio.vibrate(leg ? [60, 40, 120] : 50);
        title = leg ? (b.rarity === 'boss' ? '☠ BOSS YAKALANDI! ☠' : '♛ EFSANEVİ AV! ♛') : 'Yakalandı!';
        const art = D.UI.canvas(560, 340, (c) => { if (leg) { c.fillStyle = D.Art.rg(c, 280, 170, 20, 300, [b.rarity === 'boss' ? 'rgba(255,80,100,0.5)' : 'rgba(255,210,80,0.55)', 'rgba(0,0,0,0)']); c.fillRect(0, 0, 560, 340); } D.FishArt.draw(c, f.fishId, 280, 170, b.shape === 'kraken' ? 330 : 380, { t: 0.6 }); });
        const value = D.Econ.fishValue(s, s.inv.fish.find((x) => x.instanceId === f.instanceId) || f);
        body = h('div', { class: 'row' }, art, h('div', { class: 'col grow' },
          h('div', { class: 'b', style: { fontSize: '1.3em' } }, src.name),
          h('div', { class: 'row wrap' }, D.UI.rarityBadge(b.rarity), h('span', { class: 'chip' }, D.BEHAVIOR_TR[b.behavior]), r.isNew ? h('span', { class: 'chip', style: { background: '#f2c42a' } }, 'Yeni keşif!') : null, r.isRecord ? h('span', { class: 'chip', style: { background: '#4fb36b', color: '#fff' } }, 'Kişisel rekor!') : null),
          h('div', null, f.size + ' cm · ' + D.Econ.sizeLabel(f.fishId, f.size)),
          h('div', null, 'Rüstem\'de şimdi: ', h('b', null, D.fmt(value) + ' coin'), h('span', { class: 'small muted' }, ' (temel tahmin ' + D.fmt(r.estimate) + ')')),
          h('div', { class: 'small' }, b.collectionText),
          r.questLines.length ? h('div', { class: 'ok small' }, r.questLines.join(' · ')) : null,
          ...(r.events || []).map((ev) => h('div', { class: 'ok small' }, ev.text)),
          gull(true)));
      } else if (r.kind === 'fish') {
        D.Audio.sfx(r.outcome === 'snap' ? 'snap' : 'fail');
        title = { escape: 'Balık kaçtı', snap: 'İp koptu', early: 'Erken çektin' }[r.outcome];
        const known = !!s.collection[r.fishId];
        const tip = { escape: 'Mesafe kaçış sınırını aştı. Uzun süre gevşek bırakma; balık uzaklaşınca kısa kısa sar.', snap: 'Gerilim kırmızıda uzun kaldı. Kırmızıya girince hemen bırak — kısa bir düzeltme süren var.', early: 'Çek için İnat düşük, mesafe yakın ve gerilim kırmızı dışında olmalı. Yeşile dönen ÇEK düğmesini bekle.' }[r.outcome];
        body = h('div', { class: 'col' }, h('div', { class: 'row' }, D.UI.canvas(300, 200, (c) => D.FishArt.draw(c, r.fishId, 150, 100, 220, { sil: !known })), h('div', { class: 'col grow' }, h('div', { class: 'b' }, known ? D.FishDBSource.FishDB[r.fishId].name : '??? (henüz keşfedilmedi)'), h('div', null, tip))), gull(false), h('div', { class: 'tiny muted' }, 'Ganimet yok; envanterden bir şey kaybolmadı.'));
      } else if (r.kind === 'chest') {
        if (r.outcome === 'chestFail') { title = 'Sandık dibe battı'; body = h('div', { class: 'col' }, h('div', { class: 'row' }, D.UI.itemIcon(r.chestId, 180), h('div', null, 'İşaretçi kırmızıda durdu. Bir dahaki sefere yeşili bekle!')), gull(false)); D.Audio.sfx('fail'); }
        else { title = r.quality === 'green' ? 'Hazine! (Altın kalite)' : 'Hazine yakalandı!'; D.Audio.sfx('chest'); body = h('div', { class: 'col' }, h('div', { class: 'row' }, D.UI.itemIcon(r.chestId, 200), h('div', { class: 'col grow' }, h('div', { class: 'b' }, D.itemName(r.chestId)), h('div', null, 'Sandık envantere eklendi. Balık tutarken açılmaz — Envanter → Sandık sekmesinden aç.'), r.quality === 'green' ? h('div', { class: 'ok' }, '✦ Yeşil bölge: açılışta +1 ödül ve coin ×1.25') : null, ...(r.events || []).map((ev) => h('div', { class: 'ok small' }, ev.text)))), gull(true)); }
      } else if (r.kind === 'trash') {
        const t = D.TrashDB[r.trashId];
        title = 'Çöp çıktı: ' + t.name; D.Audio.sfx('splash');
        body = h('div', { class: 'col' }, h('div', { class: 'row' }, D.UI.itemIcon(r.trashId, 160), h('div', { class: 'col grow' }, h('i', null, '“' + t.quip + '”'), h('div', { class: 'small' }, 'Geri Dönüşüm Fabrikası\'nda ayrıştır: ' + t.out.map((o) => D.itemName(o.id) + ' ×' + o.n).join(', ') + ' + ' + D.FactoryDB.trashScrapEach + ' Scrap'))));
      } else if (r.kind === 'decoy') { title = 'Sadece bir parıltıydı'; body = h('div', null, 'Karanlık sular göz yanılması yaptı. (Yakamoz Fısıldayan Olta, Yakamoz Misina veya Neon Şamandıra gerçek siluetleri ayırt eder.)'); }
      else { title = 'Balıklar ilgisini kaybetti'; body = h('div', null, 'Kimse ısırmadı. Bir dahaki sefere siluete daha hızlı dokun.'); }
      if (D.Inv.fishFull(D.Game.state)) actions.pop();
      D.UI.modal({ title, width: 1500, closable: false, body: (b) => b.append(body), actions });
    },
    // SAR makara animasyonu (kare sırası kullanıcının dosyalarındaki gibi)
    animReel(dt) {
      const ra = this.reelAnim; if (!ra || !this.reelImg) return;
      const on = this.reel && this.state === 'FIGHT';
      if (this.reelB) this.reelB.classList.toggle('on', on);
      if (on && ra.mode !== 'reel') { ra.mode = 'reel'; ra.t = 0; }
      else if (!on && ra.mode === 'reel') { ra.mode = 'release'; ra.t = 0; }
      ra.t += dt;
      let f = ra.frame;
      if (ra.mode === 'reel') f = REEL[Math.floor(ra.t * REEL_FPS) % REEL.length];
      else if (ra.mode === 'release') { const i = Math.floor(ra.t * UNREEL_FPS); if (i >= UNREEL.length) { ra.mode = 'idle'; f = UNREEL[UNREEL.length - 1]; } else f = UNREEL[i]; }
      if (f !== ra.frame) { ra.frame = f; const im = D.Assets.get('reel_' + f); if (im) this.reelImg.src = im.src; }
    },
    update(dt) {
      const t = this.t;
      this.animReel(dt);
      if (this.state === 'CASTING') { this.castT += dt; if (this.castT > 0.9) { D.Audio.sfx('splash'); this.waitT = 0; this.setState('WAITING'); } }
      else if (this.state === 'WAITING') { this.waitT += dt; if (this.waitT >= this.enc.wait) { D.Audio.sfx('bite'); D.Audio.vibrate(25); this.selectT = 0; this.setState('SELECT'); } }
      else if (this.state === 'SELECT') {
        this.selectT += dt;
        if (this.selectT > 12) this.finish({ outcome: 'abandon' });
      } else if (this.state === 'FIGHT' && this.sim) {
        this.sim.advance(dt, { reel: this.reel });
        for (const ev of this.sim.drain()) this.onSimEvent(ev);
        this.sfxT -= dt;
        if (this.reel && this.sfxT <= 0) { D.Audio.sfx('reel'); this.sfxT = 0.09; }
        if (this.sim.inRed && this.sfxT <= 0) { D.Audio.sfx('alarm'); this.sfxT = 0.3; }
        if (this.teleT > 0) { this.teleT -= dt; if (this.teleT <= 0 && this.teleEl) this.teleEl.style.display = 'none'; }
        if (this.bannerT > 0) { this.bannerT -= dt; if (this.bannerT <= 0 && this.bannerEl) this.bannerEl.style.display = 'none'; }
        this.fightUI();
        if (this.sim.result) { const res = this.sim.result; setTimeout(() => this.finish({ outcome: res.outcome, everRed: res.everRed }), 450); this.state = 'ENDING'; if (this.holdH) { this.holdH.dispose(); this.holdH = null; } }
      } else if (this.state === 'TREASURE' && this.bar) {
        this.bar.update(dt); if (this.barM) this.barM.style.left = (this.bar.pos * 100) + '%';
        if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) D.Audio.sfx('tick');
      }
    },
    onSimEvent(ev) {
      if (ev.type === 'tele') { if (this.teleEl) { this.teleEl.textContent = '⚠ ' + ev.text; this.teleEl.style.display = ''; } this.teleT = 1.1; D.Audio.sfx('bite'); }
      else if (['son', 'phase', 'mistake', 'earlyWarn', 'saved', 'special', 'reveal', 'hircin', 'flee', 'blocked', 'slip'].includes(ev.type)) {
        if (this.bannerEl) { this.bannerEl.textContent = ev.text; this.bannerEl.style.display = ''; } this.bannerT = ev.type === 'earlyWarn' || ev.type === 'reveal' ? 3 : 1.8;
        if (ev.type === 'mistake') { D.Audio.sfx('alarm'); D.Audio.vibrate(40); }
        if (ev.type === 'phase') D.Audio.sfx('upgrade');
      }
    },
    // ---------- çizim ----------
    render(c, W, H, t) {
      const s = D.Game.state; const RA = D.RegionArt;
      let WY = RA.WATER_Y;
      if (RA.hasImage(this.region)) WY = RA.backdropImage(c, this.region, W, H, t);
      else RA.backdrop(c, this.region, W, H, t, t * 14);
      const bx = Math.min(470, W * 0.22), by = WY + 12;
      const lvl = s.boat.level;
      const sn = this.sim && this.state !== 'READY' ? this.sim.snapshot() : null;
      const reeling = this.reel && this.state === 'FIGHT';
      const bend = sn ? sn.tension : 0;
      let tip;
      if (D.BoatArt.hasRegion(this.region)) tip = D.BoatArt.drawRegion(c, this.region, bx, WY + 6, 0.62, t, bend, { flag: s.cosmetics.equipped.flag });
      else {
        D.BoatArt.draw(c, lvl, bx, by, 0.75, t, { player: true, reel: reeling, flag: s.cosmetics.equipped.flag, paint: s.cosmetics.equipped.paint, hat: s.cosmetics.equipped.hat, night: this.region === 'YK' });
        tip = D.BoatArt.drawRod(c, lvl, bx, by + Math.sin(t * 1.3) * 0, 0.75, t, bend);
      }
      // misina
      const entryX = Math.min(820, this.frame().x - 60);
      if (this.state !== 'READY') {
        let ex = entryX, ey = WY + 4;
        if (this.state === 'CASTING') { const k = Math.min(1, this.castT / 0.9); ex = tip[0] + (entryX - tip[0]) * k; ey = tip[1] + (WY - tip[1]) * k - Math.sin(k * Math.PI) * 220; }
        const sag = sn ? (1 - sn.tension) * 60 : 40;
        c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo((tip[0] + ex) / 2, Math.max(tip[1], ey) - 20 + sag, ex, ey);
        c.lineWidth = 2.5; c.strokeStyle = sn && sn.red ? '#ff3a2a' : 'rgba(255,255,255,0.9)'; c.stroke();
        if (this.state === 'WAITING' || this.state === 'SELECT' || this.state === 'CASTING') {
          const bob = this.state === 'SELECT' ? Math.sin(t * 18) * 5 : Math.sin(t * 3) * 3;
          D.ItemArt.draw(c, s.equip.float, ex, ey - 10 + bob, 46);
          c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; D.Art.ellipse(c, ex, ey + 8, 26 + Math.sin(t * 3) * 4, 6); c.stroke();
        }
      }
      // su altı paneli
      const P = this.pr(), px = P.x, py = P.y, pw = P.w, ph = P.h;
      if (RA.hasPanel(this.region)) { const f = this.frame(); RA.panelImage(c, this.region, f.x, f.y, f.w, f.h, t); }
      else RA.under(c, this.region, px, py, pw, ph, t);
      c.save(); if (RA.hasPanel(this.region)) { c.beginPath(); c.rect(px, py, pw, ph); } else D.Art.rr(c, px, py, pw, ph, 24); c.clip();
      const L = this.state === 'SELECT' || this.state === 'WAITING' ? this._L || (this._L = this.L()) : null;
      if (this.state === 'READY') { this._L = null; D.Art.signText(c, 'Su altı görüşü', px + pw / 2, py + 50, 34, 'rgba(255,255,255,0.55)'); }
      // hook / misina
      const hookX = px + pw * 0.14, hookY = py + ph * 0.36;
      if (this.state === 'WAITING' || this.state === 'SELECT') {
        c.beginPath(); c.moveTo(hookX, py); c.lineTo(hookX, hookY); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke();
        D.ItemArt.draw(c, s.equip.hook, hookX, hookY + 18, 50);
        if (s.equip.bait) D.ItemArt.draw(c, s.equip.bait, hookX + 4, hookY + 50, 34);
      }
      if (this.state === 'SELECT' && this.enc) {
        this.enc.candidates.forEach((cand, i) => {
          const [x, y, flip] = this.silPos(i, this.t);
          const flick = (L && (L.decoys || L.fog)) ? 0.55 + 0.45 * Math.abs(Math.sin(t * 2.3 + i)) : 0.92;
          c.save(); c.globalAlpha = flick;
          if (cand.type === 'fish') {
            const b = D.FishBalanceDB[cand.fishId];
            const len = D.clamp(80 + Math.log(cand.size) * 26 + (D.rarityRank(b.rarity) >= 4 ? 40 : 0), 90, 260);
            const spr = D.FishArt.sprite(cand.fishId, true, 220);
            c.translate(x, y); if (flip) c.scale(-1, 1); c.rotate(Math.sin(t * 4 + i) * 0.06);
            const k = len / 220; c.drawImage(spr, -spr.width * k / 2, -spr.height * k / 2, spr.width * k, spr.height * k);
            if (L && L.rarityHint) { c.globalAlpha = 1; c.lineWidth = 6; c.strokeStyle = D.RARITY_COLOR[b.rarity]; D.Art.ellipse(c, 0, 0, len * 0.6, len * 0.36); c.stroke(); }
          } else if (cand.type === 'chest') { c.translate(x, y); c.fillStyle = '#0b1824'; D.Art.rr(c, -50, -30, 100, 60, 10); c.fill(); D.Art.sparkles(c, [[30, -30, 0, 10]], t * 2, '#ffe08a'); }
          else if (cand.type === 'trash') { c.translate(x, y); c.fillStyle = '#0b1824'; D.Art.wobblyPoly(c, [[-40, 10], [-20, -30], [30, -24], [44, 14], [0, 30]], i + 5, 8); c.fill(); }
          else { c.translate(x, y); D.Art.sparkles(c, [[0, 0, 0, 22], [-30, 14, 2, 10], [26, -10, 4, 12]], t * 2, '#c8f0ff'); }
          c.restore();
        });
      }
      if ((this.state === 'FIGHT' || this.state === 'ENDING') && this.sim) {
        const sim = this.sim; const f = sim.snapshot();
        const fx = px + pw * 0.17 + D.clamp(f.dist / f.maxDist, 0, 1) * (pw * 0.69);
        this._depth = D.lerp(this._depth || 0, f.active === 'dip' || f.active === 'deepdive' ? ph * 0.22 : f.active === 'dart' ? -ph * 0.06 : 0, 0.05);
        const fy = py + ph * 0.46 + this._depth + Math.sin(t * (f.active === 'frenzy' ? 30 : 4)) * (f.active === 'frenzy' ? 8 : 10);
        // çek bölgesi + kaçış sınırı
        const pullX = px + pw * 0.17 + (sim.pullDist / f.maxDist) * (pw * 0.69);
        c.fillStyle = 'rgba(80,220,120,0.18)'; c.fillRect(px, py, pullX - px, ph);
        c.setLineDash([14, 10]); c.lineWidth = 4; c.strokeStyle = 'rgba(255,90,80,0.8)'; c.beginPath(); c.moveTo(px + pw * 0.86, py); c.lineTo(px + pw * 0.86, py + ph); c.stroke(); c.setLineDash([]);
        D.Art.signText(c, 'kaçış', px + pw * 0.86, py + 30, 26, '#ff8a80');
        // misina balığa
        c.beginPath(); c.moveTo(hookX, py); c.quadraticCurveTo((hookX + fx) / 2, py + (1 - f.tension) * ph * 0.32 + 60, fx - 40, fy); c.lineWidth = 3; c.strokeStyle = f.red ? '#ff3a2a' : 'rgba(255,255,255,0.85)'; c.stroke();
        const b = D.FishBalanceDB[sim.fishId];
        const len = D.clamp(180 + Math.log(sim.sizeT * 10 + 2) * 40 + (sim.boss ? 160 : D.rarityRank(b.rarity) >= 4 ? 60 : 0), 200, Math.min(470, pw * 0.68));
        const known = !!D.Game.state.collection[sim.fishId];
        D.FishArt.draw(c, sim.fishId, fx + len * 0.3, fy, len, { t, flip: true, rot: Math.sin(t * 5) * 0.08 + (f.active === 'dart' ? -0.15 : 0), sil: false && !known });
        const nx = this.sim.queue[0];
        if (f.active || (nx && !nx.hidden && this.sim.teleShown === nx)) { D.Art.signText(c, '!', fx + len * 0.3, fy - len * 0.42, 70, f.active ? '#ff5a3a' : '#ffe08a', '#2a1a10'); }
        if (f.ink) { c.fillStyle = 'rgba(10,0,20,0.55)'; c.fillRect(px, py, pw, ph); D.Art.signText(c, 'Mürekkep! Uyarılar görünmüyor', px + pw / 2, py + ph - 40, 30, '#e8d8ff'); }
        if (f.fleeing) D.Art.signText(c, 'GEVŞEK! Balık kaçıyor', px + pw / 2, py + 70, 34, '#ffe08a', '#2a1a10');
      }
      c.restore();
    }
  });
})(globalThis.DUMEN);
