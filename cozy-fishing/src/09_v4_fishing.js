/* =====================================================================
   09_v4_fishing.js : Akıcı Av (FlowFishing)
   Güç 1 otomatik kısa çekiş · güç 2 kısa mücadele · güç 3 mevcut tam mücadele · güç 4 en çok 2 özel hamle
   güç 5 üç aşama · trofe davranışları · Akıcı/Klasik bekleme · kompakt sonuç (setTimeout yok)
   Dip Oltası sahte/gerçek vuruş · Spin takip eden gölge · özel av fırsatları · trofe karşılaşması
   ===================================================================== */
const V4F = {
  autoPull: 110, speedMul: { 2: 1, 3: 1, 4: 0.72, 5: 0.46 },
  pools: { dart: ['side', 'run'], zigzag: ['side', 'side'], jumper: ['run', 'lift'], steady: ['lift', 'run'], diver: ['run', 'lift'] },
  dur: { run: 1.6, lift: 1.8, side: 1.5, jump: 1.3 },
  label: { run: 'KAÇIŞ! BIRAK', lift: 'KALDIRMA FIRSATI! BASILI TUT', side: 'YANA KAÇIŞ! TERS YÖNE YATIR', jump: 'SIÇRAMA! BIRAK' },
  warn: { run: 'ÖZEL HAMLE: UZUN KAÇIŞ GELİYOR', lift: 'ÖZEL HAMLE: BALIK YAVAŞLIYOR', side: 'ÖZEL HAMLE: YÖN DEĞİŞTİRİYOR', jump: 'ÖZEL HAMLE: SUDAN SIÇRAYACAK' },
  phases5: ['İLK DİRENÇ', 'KARŞI HAMLE', 'SON ÇEKİŞ']
};
/* titreşim ayarı (Ayarlar'dan kapatılabilir) */
if (navigator.vibrate) { const _vib = navigator.vibrate.bind(navigator); navigator.vibrate = p => (SETTINGS && SETTINGS.vibrate === false) ? false : _vib(p); }
/* Selector: fırsat çarpanı (ilgili türler ×mul, yeniden normalize) ve geçici boyut dağılımı */
{
  const _w = Selector.weights.bind(Selector);
  Selector.weights = function (spotId, o) {
    const r = _w(spotId, o); if (!o || o.auto || !o.boost || !o.boost.set) return r;
    for (const x of r.list) { x.fac.opp = o.boost.set.includes(x.id) ? o.boost.mul : 1; x.w *= x.fac.opp; }
    r.total = sum(r.list.map(x => x.w)); r.list.forEach(x => x.p = r.total > 0 ? x.w / r.total : 0); return r;
  };
  const _rs = Selector.rollSize.bind(Selector);
  Selector.rollSize = function (fid, dist) {
    if (!dist) return _rs(fid); const sd = K.size_distribution; const keep = [sd.normal.prob, sd.large.prob, sd.exceptional.prob];
    sd.normal.prob = dist[0]; sd.large.prob = dist[1]; sd.exceptional.prob = dist[2];
    try { return _rs(fid); } finally { sd.normal.prob = keep[0]; sd.large.prob = keep[1]; sd.exceptional.prob = keep[2]; }
  };
}
const BIG_DIST = [0.80, 0.16, 0.04];
Object.assign(Fishing, {
  resTok: 0, resQ: null,
  fakeActive() { const pc = S && S.pendingCast; return !!(pc && pc.method === 'bottom' && pc.fake && this.phase === 'WAITING' && this.t >= pc.fake.at && this.t < pc.fake.at + 0.5); },
  /* mücadele planı: güce göre özel hamle kuyruğu */
  plan4(f, pc) {
    const st = this.style; const pool = V4F.pools[st] || ['side', 'run']; const tro = pc.trophy ? TROPHY[pc.trophy] : null; const r = Math.random;
    const V = { power: f.power, queue: [], sm: null, dirN: 0, jumpN: 0, trophy: tro ? tro.id : null, phase: 0, t0: 0 };
    if (tro) { const n = tro.specials.length; tro.specials.forEach((ty, i) => V.queue.push({ type: ty, at: 14 + i * (70 / n) + (r() * 8 - 4), dir: r() < 0.5 ? -1 : 1 })); V.speed = tro.speed; V.jumps = tro.jumps || 0; }
    else if (f.power === 4) { const a = pool[Math.floor(r() * pool.length)], b = pool[Math.floor(r() * pool.length)]; V.queue.push({ type: a, at: 26 + r() * 10, dir: r() < 0.5 ? -1 : 1 }, { type: b, at: 58 + r() * 12, dir: r() < 0.5 ? -1 : 1 }); }
    else if (f.power >= 5) { const ord = (st === 'jumper' ? ['jump', 'run'] : r() < 0.5 ? ['run', 'side'] : ['side', 'lift']); V.queue.push({ type: ord[0], at: 38 + r() * 6, dir: r() < 0.5 ? -1 : 1 }, { type: ord[1], at: 55 + r() * 8, dir: r() < 0.5 ? -1 : 1 }); }
    return V;
  },
  smCorrect(sm) { if (sm.type === 'run' || sm.type === 'jump') return !this.holding; if (sm.type === 'lift') return this.holding; if (sm.type === 'side') return this.tilt === -sm.dir; return false; },
  /* özel hamleler ve güç 5 aşamaları (REELING sırasında) */
  v4Update(dt) {
    const V = this.v4; if (!V || this.phase !== 'REELING') return;
    if (V.power === 2 && !V.trophy) {
      if (this.dir && !V.dirN) { V.dirN = 1; V.dirEnd = this.t + 1.4; this.dirT = 1e9; }
      if (V.dirN && this.t > V.dirEnd) { this.dir = 0; this.dirT = 1e9; }
      if (this.jumpS && this.jumpS.st === 'air') V.jumpSeen = true; if (V.jumpSeen && this.jumpS && this.jumpS.st === 'none') this.jumpS.next = 1e9;
    }
    if (V.trophy && V.jumps === 0 && this.jumpS) this.jumpS.next = 1e9;
    /* sıçrama: zıplayan olmayan türlerde ve balık yorgunken de (v3'te havada takılıp kaçışa yol açıyordu) mevcut kurallarla tamamlanır */
    const js = this.jumpS; if (js && (this.style !== 'jumper' || this.tired > 0) && js.st !== 'none') { js.t += dt;
      if (js.st === 'warn' && js.t >= 0.5) { js.st = 'air'; js.t = 0; js.held = false; this.splash(this.fishPos.x, this.ctx.surf, 14); Sound.sfx('splash'); }
      else if (js.st === 'air') { if (this.holding) { js.held = true; this.tension += 34 * dt; } if (js.t >= 0.9) { js.st = 'none'; js.next = 1e9; this.splash(this.fishPos.x, this.ctx.surf, 18); if (!js.held) { this.progress += 9; this.stam -= 15; this.pop('USTA HAMLE! +İLERLEME', '#ffe070', 1.3); Sound.sfx('coin'); } else this.pop('ZIPLARKEN GEVŞETMELİYDİN', '#ffb0a0', 1.3); } } }
    if (V.power >= 5) { const ph = this.progress < 35 ? 0 : this.progress < 70 ? 1 : 2; if (ph !== V.phase) { V.phase = ph; this.pop(V4F.phases5[ph] + '!', '#ffe070', 1.3); } if (ph === 0 && this.holding) this.tension += this.params.gain * 0.15 * dt; if (ph === 2 && this.holding && !V.sm) this.progress += this.params.speed * 0.15 * dt; }
    if (!V.sm && V.queue.length && this.progress >= V.queue[0].at) {
      const q = V.queue.shift(); V.sm = { type: q.type, dir: q.dir, st: 'warn', t: 0, good: 0, tot: 0 }; this.surge.st = 'none'; this.surge.next = 99; Sound.sfx('warn'); if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) { }
    }
    const sm = V.sm; if (!sm) return; sm.t += dt;
    if (sm.st === 'warn') { if (sm.t >= 0.9) { sm.st = 'act'; sm.t = 0; if (sm.type === 'jump') { this.jumpS.st = 'warn'; this.jumpS.t = 0.5; } if (sm.type === 'run') Sound.sfx('surge'); } return; }
    sm.tot += dt; if (this.smCorrect(sm)) sm.good += dt;
    if (sm.type === 'side') { this.dir = sm.dir; this.dirT = 1e9; }
    if (sm.type === 'run' || sm.type === 'jump') { if (sm.type === 'run') this.progress -= 6 * dt; if (this.holding) this.tension += 30 * dt; else this.tension = Math.max(this.tension, 34); this.underT = 0; }
    if (sm.type === 'lift' && this.holding) { this.progress += this.params.speed * 0.6 * dt; }
    this.tension = Math.min(this.tension, RC.break_threshold_above - 1); this.overT = 0;
    if (sm.t >= V4F.dur[sm.type]) {
      const ok = sm.good / Math.max(0.01, sm.tot) >= 0.6;
      if (ok) { this.progress += 7; this.stam -= 12; this.pop('HARİKA HAMLE!', '#c8ffb0', 1.1); Sound.sfx('perfect'); this.burst(this.fishPos ? this.fishPos.x : 300, this.ctx.surf - 4, '#c8ffb0', 12); }
      else { this.progress = Math.max(0, this.progress - 5); this.tension = Math.min(this.tension + 14, RC.break_threshold_above - 1); this.pop('HAMLEYİ KAÇIRDIN', '#ffb0a0', 1.1); }
      V.smDone = (V.smDone || 0) + 1; V.sm = null; this.surge.next = 2.2 + Math.random() * 2; if (sm.type === 'side') { this.dir = 0; this.dirT = 1.5; }
    }
    this.progress = clamp(this.progress, 0, 100);
  }
});
{
  const F = Fishing;
  const _attach = F.attach.bind(F); F.attach = function (ctx) { this.resQ = null; this.v4 = null; _attach(ctx); };
  const _detach = F.detach.bind(F); F.detach = function () { this.resQ = null; this.v4 = null; _detach(); UI.hideCompact && UI.hideCompact(); };
  /* iniş: Akıcı/Klasik bekleme (aynı rastgele sayı sırası → tür olasılığı değişmez), trofe, fırsat, sahte vuruş */
  F.startWait = function () {
    const pc = S.pendingCast; let bite = this.biteChance(pc.spotId, pc.mode); const range = Tempo.wait(pc.tempo);
    Tx.run('castLand', () => {
      pc.wait = lerp(range[0], range[1], rand());
      const tro = Trophy.roll(pc); const op = pc.comp ? null : Opp.consume(pc, !!tro); if (op) pc.opp = op;
      const boost = op && op.matched && op.set ? { set: op.set, mul: Opp.MUL } : null; const dist = op && op.matched && op.type === 'big' ? BIG_DIST : null;
      if (tro) { pc.trophy = tro.id; pc.bite = true; pc.fish = tro.fid; pc.size = Trophy.size(tro); }
      else if (pc.method === 'spin') { pc.u = rand(); pc.biteBase = bite; pc.spin = { good: 0, bad: 0, lastCyc: -1 }; pc.resolveAt = Math.min(pc.wait - 0.2, Math.max(1.0, pc.wait - 1.7)); pc.boost = boost; pc.dist = dist; delete pc.bite; }
      else {
        pc.bite = rand() < bite;
        if (pc.bite) { const sel = Selector.weights(pc.spotId, { rodPower: rodOf().power, bait: pc.bait, band: pc.band, method: pc.method, daypart: pc.daypart, boost }); pc.fish = Selector.pick(sel.list); pc.size = Selector.rollSize(pc.fish, dist); }
      }
      if (pc.method === 'bottom' && !tro) { const room = pc.wait - 1.9; if (room > 0.6 && hr('fake', S.stats.manualCasts) < (S.day <= 3 ? 0.12 : 0.35)) pc.fake = { at: 0.6 + hr('fakeT', S.stats.manualCasts) * (room - 0.6) }; }
      return { ok: true };
    }, { noSave: false });
    this.phase = 'WAITING'; this.t = 0; this._nibT = 0;
    if (pc.trophy) { this.pop('TROFE İZİ: ' + upTR(TROPHY[pc.trophy].name) + '!', '#ffe070', 2); Sound.sfx('warn'); }
  };
  F.spinResolve = function () {
    const pc = S.pendingCast; if (!pc || pc.bite !== undefined) return;
    Tx.run('spinResolve', () => {
      const eff = this.spinEff(pc); let ch = pc.biteBase * (0.88 + 0.06 * eff); if (pc.bait === 'lure') ch *= 1.04;
      if (pc.opp && pc.opp.matched && pc.opp.type === 'predator' && eff >= 2) ch *= 1.08;
      ch = Math.min(0.95, ch); pc.spinEff = eff; pc.bite = pc.u < ch;
      if (pc.bite) { const sel = Selector.weights(pc.spotId, { rodPower: rodOf().power, bait: pc.bait, band: pc.band, method: eff >= 1 ? 'spin' : null, daypart: pc.daypart, boost: pc.boost }); pc.fish = Selector.pick(sel.list); pc.size = Selector.rollSize(pc.fish, pc.dist); }
      return { ok: true };
    });
  };
  /* tasma: güç 1 → otomatik kısa çekiş; diğerleri → güç planı */
  const _hook = F.hook.bind(F);
  F.hook = function () {
    const pc = S.pendingCast; const perfect = this.t <= 0.45; _hook(); if (perfect && !QA.silentGuild) Guild.ev('perfect', {});
    const f = FISH[pc.fish];
    if (this.phase === 'QUICK_PULL') { this.autoPull = true; this.holding = false; this.pops = (this.pops || []).filter(p => !/HIZLI SAR/.test(p.text)); this.pop('ÇEKİLİYOR!', '#c8ffb0', 0.8); }
    else { this.autoPull = false; this.v4 = this.plan4(f, pc); const mul = (V4F.speedMul[f.power] || 1) * (this.v4.speed || 1); this.params.speed *= mul; if (pc.trophy) this.pop('TROFE: ' + upTR(TROPHY[pc.trophy].name), '#ffe070', 1.6); }
  };
  const _rel = F.releaseCast.bind(F);
  F.releaseCast = function () { const before = S.pendingCast; _rel(); const pc = S.pendingCast; if (pc && pc !== before && this.phase === 'CAST_FLYING') { pc.tempo = Tempo.cur(); if (UI.hideCompact) UI.hideCompact(); } };
  const _press = F.press.bind(F);
  F.press = function () {
    if (UI.hideCompact) UI.hideCompact();
    const pc = S && S.pendingCast;
    if (this.phase === 'QUICK_PULL' && this.autoPull) return;
    if (this.phase === 'WAITING' && pc && pc.method === 'bottom') {
      if (pc.fake && this.t >= pc.fake.at && this.t < pc.fake.at + 0.75) { this.finish('MISSED_BITE', 'Sahte vuruştu! Kamış ucu yalnızca titredi; gerçek vuruşta derin bükülür.'); return; }
      this.say('Kamış ucunu izle: gerçek vuruşta derin bükülür.', 1.4); return;
    }
    return _press();
  };
  F.rodBend = (function (orig) { return function () { if (this.fakeActive()) return 24 + Math.sin(this.t * 30) * 10; return orig.call(this); }; })(F.rodBend);
  /* yakalama: kayıt + envanter (Tx), sonuç kuyruğu oyun zamanına bağlı (setTimeout yok) */
  F.success = function () {
    const pc = S.pendingCast; const fid = pc.fish, size = pc.size; let res = null;
    Tx.run('catch', () => {
      const rec = Catch.record(fid, size, false, { bait: pc.bait, spot: pc.spotId, rod: S.gear.rod });
      const where = Inv.place(Inv.manualOrder(), fid);
      res = { fid, size, rec, where, trophy: pc.trophy || null };
      if (!where) S.pendingCatch = { fid, size, rec, trophy: pc.trophy || null };
      S.pendingCast = null; if (pc.comp) Comp.onCast(pc.spotId, fid, size);
      if (pc.trophy) res.trophyFirst = Trophy.onCatch(pc.trophy, size);
      if (!pc.comp) { Guild.ev('catch', { method: pc.method || 'float', daypart: pc.daypart || 'day', power: FISH[fid].power }); if (S.guild && S.guild.gsReady) S.guild.gsReady = false; }
      res.autos = Auto.onCastComplete(pc.spotId, pc.mode);
      if (!pc.comp) Opp.roll(pc);
      return { ok: true };
    });
    if (!res) { this.phase = 'READY'; return; }
    const tip = this.ctx.tip();
    this.jump = { t: 0, x0: this.fishPos.x, y0: this.fishPos.y, x1: tip[0] - 8, y1: tip[1] - 6, fid };
    this.splash(this.fishPos.x, this.ctx.surf, 18); this.ripple(this.fishPos.x);
    this.phase = res.where ? 'CATCH_RESULT' : 'STORAGE_DECISION'; this.t = 0; this.holding = false; this.lastOutcome = 'catch'; this.v4 = null;
    Sound.sfx(res.rec.isRecord || res.rec.isNew || res.trophy ? 'record' : 'catch');
    this.queueAutos(res.autos);
    const c = { fid, size, rec: res.rec, where: res.where, trophy: res.trophy, trophyFirst: res.trophyFirst };
    const big = !res.where || res.rec.isNew || res.rec.isRecord || size.cls === 'exceptional' || !!res.trophy || Tempo.cur() === 'classic';
    this.resQ = { token: ++this.resTok, c, storage: !res.where, big, shown: false };
    if (res.rec.isRecord) Bus.toast('Yeni kişisel rekor: ' + FISH[fid].name_tr + ' ' + size.cm + ' cm!', 'good', 'trophy');
    if (res.trophyFirst) Bus.toast('TROFE: ' + TROPHY[res.trophy].name + ' · ödül: ' + TROPHY[res.trophy].reward.name, 'ach', 'trophy_t');
    if (!pc.comp && !QA.silent) { const rid = SPOTS[pc.spotId].region_id; Wildlife.trigger(rid, 'c' + S.stats.manualCasts + ':' + pc.spotId, 0.06); }
  };
  const _finish = F.finish.bind(F);
  F.finish = function (kind, text) {
    const pc = S.pendingCast; _finish(kind, text); this.v4 = null;
    if (pc && !pc.comp && ['NO_BITE', 'MISSED_BITE', 'LINE_BREAK', 'FISH_ESCAPED'].includes(kind)) { Tx.run('oppRoll', () => { Opp.roll(pc); return { ok: true }; }, { noSave: false }); }
  };
  const _up = F.update.bind(F);
  F.update = function (dt) {
    if (this.ctx && this.phase === 'QUICK_PULL' && this.autoPull) this.progress += V4F.autoPull * dt;
    _up(dt);
    if (!this.ctx) return;
    if (this.phase === 'REELING') this.v4Update(dt);
    const pc = S.pendingCast;
    if (pc && pc.method === 'bottom' && this.phase === 'WAITING' && pc.fake && !pc.fake.played && this.t >= pc.fake.at) { pc.fake.played = true; Sound.sfx('nibble'); }
    if (pc && pc.method === 'bottom' && this.phase === 'BITE_WINDOW' && !this._realVib) { this._realVib = true; if (navigator.vibrate) try { navigator.vibrate([90, 40, 90]); } catch (e) { } }
    if (this.phase !== 'BITE_WINDOW') this._realVib = false;
    /* sonuç kuyruğu: kısa çekiş animasyonundan sonra kompakt gösterge veya ayrıntılı kart */
    const q = this.resQ;
    if (q && !q.shown && (this.phase === 'CATCH_RESULT' || this.phase === 'STORAGE_DECISION') && this.t >= 0.62) {
      q.shown = true;
      if (QA.silent) { if (!q.big && this.phase === 'CATCH_RESULT') { this.phase = 'READY'; this.bob = null; this.fishPos = null; this.jump = null; } }
      else if (q.big) { if (!UI.modal) UI.showCatch(q.c, q.storage); }
      else { this.phase = 'READY'; this.bob = null; this.fishPos = null; this.jump = null; UI.showCompact(q.c); UI.fishBarUpdate(); }
    }
    if (q && q.shown && this.phase === 'READY') this.resQ = null;
  };
  /* çizim: spin takip gölgesi, fırsat animasyonları, sahte vuruş */
  const _render = F.render.bind(F);
  F.render = function (g, cam) {
    if (!this.ctx) return; const surf = this.ctx.surf;
    Opp.render(g, cam, this.ctx);
    _render(g, cam);
    const pc = S.pendingCast; const b = this.bob;
    if (pc && pc.method === 'spin' && b && this.phase === 'WAITING' && pc.u !== undefined) {
      const maxCh = Math.min(0.95, pc.biteBase * 1.06 * (pc.bait === 'lure' ? 1.04 : 1) * (pc.opp && pc.opp.matched && pc.opp.type === 'predator' ? 1.08 : 1));
      const interested = pc.u < maxCh; const after = pc.bite === false ? this.t - pc.resolveAt : -1;
      if (interested && (pc.bite === undefined || after >= 0 && after < 1.2)) {
        const good = pc.spin ? pc.spin.good : 0; const d = after >= 0 ? 14 + after * 70 : Math.max(10, 46 - good * 11 - this.t * 2); const lx = b.x + d * (after >= 0 ? 1 : 1);
        g.globalAlpha = after >= 0 ? Math.max(0, 0.5 - after * 0.4) : 0.45; const sp = Atlas.get('follower', followerPB); g.drawImage(sp, Math.round(lx - cam), Math.round(surf + 8 + Math.sin(this.t * 6) * 2)); g.globalAlpha = 1;
      }
    }
    /* Barrakuda trofesi: yemi takip eden iri gölge ile özel başlangıç */
    if (pc && pc.trophy === 't_barrakuda' && b && this.phase === 'WAITING') { const k = clamp(this.t / Math.max(0.5, pc.wait), 0, 1); const lx = b.x + lerp(120, 10, k) + Math.sin(this.t * 9) * 4; g.globalAlpha = 0.55; g.drawImage(Atlas.get('follower', followerPB), Math.round(lx - cam), Math.round(surf + 6 + Math.sin(this.t * 7) * 3), 40, 14); g.globalAlpha = 1; if (Math.floor(this.t * 8) % 2) { g.fillStyle = '#e8f8ff'; g.fillRect(Math.round(lx - cam + 42), surf + 12, 6, 1); } }
    if (this.fakeActive() && Math.floor(this.t * 14) % 2) { const tp = this.ctx.tip(); g.fillStyle = '#e8f0f8'; g.fillRect(Math.round(tp[0] - cam + 2), Math.round(tp[1] - 2), 1, 1); }
  };
  const _hud = F.renderHUD.bind(F);
  F.renderHUD = function (g) {
    _hud(g); if (!this.ctx) return; const V = this.v4; const pc = S.pendingCast;
    const box = (txt, y, col) => { const w = textWidth(txt); g.fillStyle = 'rgba(20,14,26,0.78)'; g.fillRect(320 - w / 2 - 6, y - 2, w + 12, 11); drawText(g, txt, Math.round(320 - w / 2), y, col); };
    if (this.phase === 'REELING' && V) {
      if (V.trophy) box('TROFE · ' + upTR(TROPHY[V.trophy].name), 40, '#ffe070');
      else if (V.power >= 5) box('GÜÇ 5 · ' + V4F.phases5[V.phase] + ' (' + (V.phase + 1) + '/3)', 40, '#ffd8a0');
      if (V.sm) { const fl = SETTINGS.reduced ? '#ffe070' : ((Math.floor(this.t * 8) % 2) ? '#ffe070' : '#ffffff'); if (V.sm.st === 'warn') box('!! ' + V4F.warn[V.sm.type] + ' !!', 176, fl); else box(V4F.label[V.sm.type] + ' ' + Math.max(0, Math.ceil((V4F.dur[V.sm.type] - V.sm.t) * 10) / 10).toFixed(1).replace('.', ','), 176, this.smCorrect(V.sm) ? '#8ef09a' : '#ffb0a0'); }
    }
    if (this.fakeActive()) box('UÇ TİTREDİ… (SAHTE OLABİLİR, BEKLE)', 110, '#e8f4ff');
    if (this.phase === 'BITE_WINDOW' && pc && pc.method === 'bottom') box('GERÇEK VURUŞ: KAMIŞ DERİN BÜKÜLDÜ!', 110, '#ffe070');
    const a = Opp.active(); if (a && this.ctx && SPOTS[this.ctx.spotId()].region_id === a.rid && ['READY', 'CHARGING', 'CAST_FLYING', 'WAITING'].includes(this.phase)) { const s = 'FIRSAT: ' + upTR(V4.oppTypes[a.type].name) + (a.type === 'school' || a.type === 'big' ? ' · ' + BAND_TR[a.band].toLocaleUpperCase('tr') : a.type === 'bottom' ? ' · DİP OLTASI' : ' · SPİN') + ' · ' + a.left + ' ATIŞ'; g.fillStyle = 'rgba(20,14,26,0.7)'; g.fillRect(6, 64, textWidth(s) + 8, 11); drawText(g, s, 10, 66, '#c8ffb0'); }
  };
}
const followerPB = () => { const p = new PB(16, 6); p.ellipse(8, 3, 6, 2.2, '#1d2a3e'); p.poly([[2, 3], [0, 0], [0, 6]], '#1d2a3e'); return p; };

/* ---------- özel av fırsatı animasyonları (dünya koordinatı) ---------- */
Opp.render = function (g, cam, ctx) {
  const a = this.active(); if (!a || !ctx || SPOTS[ctx.spotId()].region_id !== a.rid) return; const surf = ctx.surf; const tip = ctx.tip(); const t = Game.t;
  const bandMid = { near: 17, mid: 53, far: 85 }[a.band] / 100; const wx = tip[0] + lerp(ctx.minCast, ctx.maxCast, bandMid) - cam;
  if (a.type === 'school') { for (let i = 0; i < 7; i++) { const ph = (t * 1.3 + i * 0.37) % 1; const x = wx - 28 + i * 9 + Math.sin(t + i) * 3; if (ph < 0.35) { const k = ph / 0.35; g.fillStyle = '#c8d8e8'; g.fillRect(Math.round(x), Math.round(surf - 2 - Math.sin(k * Math.PI) * 7), 3, 1); g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + 1), Math.round(surf - 1), 1, 1); } } g.globalAlpha = 0.6; for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; pxEllipse(g, Math.round(wx - 10 + i * 10), surf + 1, 3 + k * 10, 1 + k * 2, '#e8f8ff'); } g.globalAlpha = 1; }
  if (a.type === 'big') { g.globalAlpha = 0.28; g.fillStyle = '#0e1a2a'; const x = wx + Math.sin(t * 0.4) * 30; g.beginPath(); g.ellipse(Math.round(x), surf + 30, 34, 9, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(x + 32, surf + 30); g.lineTo(x + 46, surf + 22); g.lineTo(x + 46, surf + 38); g.fill(); g.globalAlpha = 1; }
  if (a.type === 'bottom') { for (let i = 0; i < 10; i++) { const k = (t * 0.6 + i * 0.13) % 1; g.fillStyle = 'rgba(232,248,255,0.7)'; g.fillRect(Math.round(wx - 20 + (i * 17) % 40 + Math.sin(t * 3 + i) * 2), Math.round(LH - 12 - k * (LH - surf - 20)), 1, 1); } g.globalAlpha = 0.25; g.fillStyle = '#c8b080'; g.beginPath(); g.ellipse(Math.round(wx), LH - 10, 26 + Math.sin(t) * 4, 6, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
  if (a.type === 'predator') { g.globalAlpha = 0.35; const x = wx + Math.sin(t * 2.6) * 50; g.drawImage(Atlas.get('follower', followerPB), Math.round(x), surf + 14, 24, 9); g.fillStyle = '#e8f8ff'; g.fillRect(Math.round(x - 6 * Math.sign(Math.cos(t * 2.6))), surf + 18, 4, 1); g.globalAlpha = 1; }
};
