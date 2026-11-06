/* =====================================================================
   09_v3_fishing.js : FishingController v3 eklentileri
   Şamandıra (değişmeden) · Dip Oltası (kamış ucu) · Spin (sınırlı yem hareketleri)
   Hızlı tekrar atışı · gün ışığı / yöntem çarpanları · doğa gözlemi tetikleyicisi
   ===================================================================== */
const SPIN_CYC = 1.3, SPIN_WIN = 0.62, SPIN_MAX = 3;
Object.assign(Fishing, {
  twitchT: 0,
  /* atılan yemin yöntemi (atış sürerken değişmez) */
  castMethod() { const pc = S && S.pendingCast; return pc && pc.method ? pc.method : Methods.cur(); },
  depth() { return this.ctx && this.ctx.mode === 'boat' ? 72 : 52; },
  /* kamış bükülmesi: mevcut gerilim + dip oltasında uç hareketi + spin çekişi */
  rodBend() {
    if (this.phase === 'REELING') return this.tension; if (this.phase === 'QUICK_PULL') return 40;
    const pc = S && S.pendingCast; const m = pc && pc.method;
    if (m === 'bottom') {
      if (this.phase === 'BITE_WINDOW') return 58 + Math.sin(this.t * 26) * 18;
      if (this.phase === 'WAITING' && pc.bite && this.t > pc.wait - 1.6) return 12 + Math.sin(this.t * 34) * 9;
      if (this.phase === 'WAITING') return 3 + Math.sin(this.t * 2.2) * 2;
    }
    if (m === 'spin' && this.twitchT > 0) return 28;
    return 0;
  },
  /* spin: yem durduğunda kısa dokunuş. Yalnızca pencere içindeki ilk dokunuş sayılır, en çok 3; sık dokunmak avantaj sağlamaz */
  spinWindow() { return ((this.t % SPIN_CYC) / SPIN_CYC) >= SPIN_WIN; },
  twitch() {
    const pc = S.pendingCast; if (!pc || !pc.spin) return; const sp = pc.spin;
    if (pc.bite !== undefined) { this.say('Bir şey yaklaşıyor… şimdi sabırla bekle.', 1.2); return; }
    const cyc = Math.floor(this.t / SPIN_CYC);
    if (this.spinWindow() && sp.lastCyc !== cyc && sp.good < SPIN_MAX) { sp.good++; sp.lastCyc = cyc; this.pop('YEM OYNADI ' + sp.good + '/' + SPIN_MAX, '#c8ffb0', 0.9); Sound.sfx('twitch'); }
    else if (sp.good >= SPIN_MAX && this.spinWindow()) this.pop('YETERLİ HAREKET – BEKLE', '#e8f4ff', 0.9);
    else { sp.bad++; this.pop('ÇOK SIK! YEMİN DURMASINI BEKLE', '#ffb0a0', 0.9); Sound.sfx('twitch'); }
    this.twitchT = 0.2; const tip = this.ctx.tip(); if (this.bob) { this.bob.tx = Math.max(tip[0] + 40, this.bob.tx - 9); this.bob.x = this.bob.tx; this.ripple(this.bob.x, 0.5); }
  },
  spinEff(pc) { const sp = pc.spin || { good: 0, bad: 0 }; return Math.max(0, Math.min(SPIN_MAX, sp.good) - Math.floor(sp.bad / 2)); },
  spinResolve() {
    const pc = S.pendingCast; if (!pc || pc.bite !== undefined) return;
    Tx.run('spinResolve', () => {
      const eff = this.spinEff(pc); let ch = pc.biteBase * (0.88 + 0.06 * eff); if (pc.bait === 'lure') ch *= 1.04; ch = Math.min(0.95, ch);
      pc.spinEff = eff; pc.bite = pc.u < ch;
      if (pc.bite) { const sel = Selector.weights(pc.spotId, { rodPower: rodOf().power, bait: pc.bait, band: pc.band, method: eff >= 1 ? 'spin' : null, daypart: pc.daypart }); pc.fish = Selector.pick(sel.list); pc.size = Selector.rollSize(pc.fish); }
      return { ok: true };
    });
  },
  /* hızlı tekrar: yalnızca atış hazırlığını kısaltır; tek dokunuş = tek atış; enerji/yem aynen */
  quickCast() {
    if (this.phase !== 'READY' || !this.ctx) return { ok: false };
    if (!S.lastCast) { this.say('Önce bir kez normal atış yap.', 1.6); return { ok: false }; }
    const now = performance.now(); if (this._qcAt && now - this._qcAt < 500) return { ok: false }; this._qcAt = now;
    const c = this.canCast(); if (!c.ok) { if (c.msg) { this.say(c.msg, 3); Sound.sfx('error'); if (c.code === 'bait') UI.offerBasicBait(); } return { ok: false, msg: c.msg }; }
    const keys = Inv.manualOrder(); if (!keys.some(k => Inv.hasRoomAny(k) || (Inv.arr(k) || []).some(s => s.q < STACK))) { this.say('Çanta ve tekne deposu dolu; önce yer aç.', 2.5); Sound.sfx('error'); return { ok: false, msg: 'depo' }; }
    this.phase = 'CHARGING'; this.t = 1; this.power = clamp(S.lastCast.power, 0, 100); this.releaseCast();
    return { ok: this.phase === 'CAST_FLYING' };
  }
});
{
  const F = Fishing;
  const _attach = F.attach.bind(F); F.attach = function (ctx) { this.twitchT = 0; _attach(ctx); };
  const _press = F.press.bind(F);
  F.press = function () {
    const pc = S && S.pendingCast;
    if (this.phase === 'WAITING' && pc && pc.method === 'spin') { this.twitch(); return; }
    if (this.phase === 'WAITING' && pc && pc.method === 'bottom') { this.say('Kamış ucunu izle; belirgin bükülünce çek.', 1.4); return; }
    return _press();
  };
  const _rel = F.releaseCast.bind(F);
  F.releaseCast = function () {
    const pw = Math.round(this.power); const before = S.pendingCast;
    _rel();
    const pc = S.pendingCast;
    if (this.phase === 'CAST_FLYING' && pc && pc !== before) { pc.method = Methods.cur(); pc.daypart = Dayparts.cur(); S.lastCast = { power: pw, method: pc.method }; Save.soon(); }
  };
  /* iniş: mevcut vurma hesabı + iskele yenilemesi bonusu; spin kararı hareketlerden sonra verilir */
  F.biteChance = function (spotId, mode) {
    const rid = SPOTS[spotId].region_id; const ev = World.event();
    let bite = SPOTS[spotId].base_bite_chance; if (ev && ev.effect === 'bite_chance_bonus' && ev.region === rid) bite += ev.modifier;
    if (Projects.done('pier') && mode === 'pier' && rid === 'sakin_liman') bite *= 1.05;
    return Math.min(0.95, bite);
  };
  F.startWait = function () {
    const pc = S.pendingCast; const bite = this.biteChance(pc.spotId, pc.mode);
    Tx.run('castLand', () => {
      pc.wait = lerp(RC.wait_sec_range[0], RC.wait_sec_range[1], rand());
      if (pc.method === 'spin') { pc.u = rand(); pc.biteBase = bite; pc.spin = { good: 0, bad: 0, lastCyc: -1 }; pc.resolveAt = Math.min(pc.wait - 0.2, Math.max(1.2, pc.wait - 1.7)); delete pc.bite; }
      else {
        pc.bite = rand() < bite;
        if (pc.bite) { const sel = Selector.weights(pc.spotId, { rodPower: rodOf().power, bait: pc.bait, band: pc.band, method: pc.method, daypart: pc.daypart }); pc.fish = Selector.pick(sel.list); pc.size = Selector.rollSize(pc.fish); }
      }
      return { ok: true };
    }, { noSave: false });
    this.phase = 'WAITING'; this.t = 0; this._nibT = 0;
  };
  const _up = F.update.bind(F);
  F.update = function (dt) {
    const pc = S && S.pendingCast;
    if (this.ctx && this.phase === 'WAITING' && pc && pc.method === 'spin' && pc.bite === undefined && this.t + dt >= pc.resolveAt) this.spinResolve();
    if (this.twitchT > 0) this.twitchT -= dt;
    const ph0 = this.phase;
    _up(dt);
    if (!this.ctx || !pc) return;
    if (pc.method === 'bottom') {
      if (this.phase === 'WAITING' && pc.bite && this.t > pc.wait - 1.6) { this._nibT -= dt; if (this._nibT <= 0) { this._nibT = 0.45 + Math.random() * 0.3; Sound.sfx('nibble'); } }
      if (ph0 === 'WAITING' && this.phase === 'BITE_WINDOW') { Sound.sfx('rodtip'); this.pop('KAMIŞ UCU BÜKÜLDÜ!', '#ffe070', 1.0); }
      if (this.fishPos && ['WAITING', 'BITE_WINDOW'].includes(this.phase)) this.fishPos.y += this.depth() * 0.75;
    }
  };
  /* doğa gözlemi: tamamlanan geçerli atış bağlamına bağlı, deterministik ve günlük sınırlı */
  const wildAfter = pc => { if (!pc || pc.comp || QA.silent) return; const rid = SPOTS[pc.spotId].region_id; Wildlife.trigger(rid, 'c' + S.stats.manualCasts + ':' + pc.spotId, 0.06); };
  const _succ = F.success.bind(F); F.success = function () { const pc = S.pendingCast; _succ(); wildAfter(pc); };
  const _fin = F.finish.bind(F); F.finish = function (k, t) { const pc = S.pendingCast; _fin(k, t); if (pc && (k === 'NO_BITE' || k === 'MISSED_BITE' || k === 'LINE_BREAK' || k === 'FISH_ESCAPED')) wildAfter(pc); };
  /* çizim: dip (kurşun + kamış ucu) ve spin (sahte yem); şamandıra yöntemi aynen */
  const _render = F.render.bind(F);
  F.render = function (g, cam) {
    if (!this.ctx) return;
    const pc = S.pendingCast; const m = pc && pc.method; const b = this.bob;
    const custom = b && (m === 'bottom' || m === 'spin') && ['CAST_FLYING', 'WAITING', 'BITE_WINDOW', 'OUTCOME'].includes(this.phase);
    if (!custom) return _render(g, cam);
    this.bob = null; try { _render(g, cam); } finally { this.bob = b; }
    const surf = this.ctx.surf, tip = this.ctx.tip(); const LC = LINE_COL[Math.max(0, LINES.findIndex(l => l.id === S.gear.line))]; const lineC = mix(LC, '#ffffff', 0.25);
    let lx = b.x, ly = b.y;
    if (this.phase !== 'CAST_FLYING') {
      if (m === 'bottom') { const k = this.phase === 'WAITING' ? Math.min(1, this.t / 0.9) : 1; ly = surf + this.depth() * k; }
      else { ly = surf + 6 + (this.spinWindow() ? 2 : Math.sin(this.t * 5) * 1.5) - (this.twitchT > 0 ? 4 : 0); }
    }
    pxCurve(g, tip[0] - cam, tip[1], lx - cam, ly, this.phase === 'CAST_FLYING' ? 4 : (m === 'bottom' ? 2 : 6), lineC);
    if (m === 'bottom') g.drawImage(Atlas.get('sinker', sinkerPB), Math.round(lx - cam - 2), Math.round(ly - 3));
    else { const sp = Atlas.get('lure' + (Math.floor(Game.t * 6) % 2), () => lurePB(Math.floor(Game.t * 6) % 2)); g.drawImage(sp, Math.round(lx - cam - 4), Math.round(ly - 2)); if (this.twitchT > 0) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(lx - cam + 5), Math.round(ly - 3), 1, 1); g.fillRect(Math.round(lx - cam - 6), Math.round(ly + 1), 1, 1); } }
    if (this.phase === 'BITE_WINDOW') { const k = 1 - this.t / this.biteWin(); drawBang(g, Math.round((m === 'bottom' ? tip[0] - cam + 10 : lx - cam)), Math.round(m === 'bottom' ? tip[1] - 22 : surf - 26), k); }
    if (m === 'bottom' && this.phase === 'WAITING' && pc.bite && this.t > pc.wait - 1.6 && Math.floor(this.t * 12) % 2) { g.fillStyle = '#ffe070'; g.fillRect(Math.round(tip[0] - cam + 3), Math.round(tip[1] - 3), 1, 1); g.fillRect(Math.round(tip[0] - cam - 3), Math.round(tip[1] - 2), 1, 1); }
  };
  const _hud = F.renderHUD.bind(F);
  F.renderHUD = function (g) {
    _hud(g); if (!this.ctx) return;
    const pc = S.pendingCast;
    if (this.phase === 'WAITING' && pc && pc.method === 'spin') {
      const sp = pc.spin || { good: 0 }; let lab, col = '#e8f4ff';
      if (pc.bite !== undefined) lab = 'SABRET…'; else if (this.spinWindow()) { lab = 'YEM DURDU – DOKUN!'; col = (Math.floor(this.t * 8) % 2) ? '#ffe070' : '#ffffff'; } else lab = 'YEM BATIYOR…';
      const txt = lab + '  HAREKET ' + Math.min(sp.good, SPIN_MAX) + '/' + SPIN_MAX; g.fillStyle = 'rgba(20,14,26,0.7)'; g.fillRect(320 - textWidth(txt) / 2 - 6, 96, textWidth(txt) + 12, 12); drawText(g, txt, Math.round(320 - textWidth(txt) / 2), 99, col);
    }
    if (pc && pc.method === 'bottom' && (this.phase === 'WAITING' || this.phase === 'BITE_WINDOW')) {
      const nib = this.phase === 'WAITING' && pc.bite && this.t > pc.wait - 1.6; const txt = this.phase === 'BITE_WINDOW' ? 'KAMIŞ UCU BÜKÜLDÜ – ÇEK!' : nib ? 'UÇ SALLANIYOR…' : 'KAMIŞ UCUNU İZLE';
      const col = this.phase === 'BITE_WINDOW' ? ((Math.floor(this.t * 10) % 2) ? '#ffe070' : '#ffffff') : '#e8f4ff';
      g.fillStyle = 'rgba(20,14,26,0.7)'; g.fillRect(320 - textWidth(txt) / 2 - 6, 96, textWidth(txt) + 12, 12); drawText(g, txt, Math.round(320 - textWidth(txt) / 2), 99, col);
    }
  };
}
const sinkerPB = () => { const p = new PB(5, 6); p.rect(1, 0, 3, 1, '#c8ccd4'); p.ellipse(2.5, 3.5, 2.2, 2.2, '#6a7078', (x, y) => y < 3 ? '#9aa0a8' : '#5a6068'); p.set(1, 2, '#e8ecf0'); return p; };
const lurePB = f => { const p = new PB(9, 5); p.poly([[0, 2], [3, 0], [7, 1], [8, 2], [7, 3], [3, 4]], f ? '#dfe6ec' : '#c8d0d8'); p.rect(2, 1, 3, 1, f ? '#ffffff' : '#f2c230'); p.set(6, 2, '#2a2226'); p.set(8, 3, '#8a8a92'); p.set(8, 4, '#8a8a92'); return p; };
