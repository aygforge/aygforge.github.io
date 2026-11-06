/* =====================================================================
   09_fishing.js : FishingController — açık durum makinesi
   READY → CHARGING → CAST_FLYING → WAITING → BITE_WINDOW → QUICK_PULL/REELING → CATCH_RESULT → READY
   yan yollar: NO_BITE, MISSED_BITE, LINE_BREAK, FISH_ESCAPED, STORAGE_DECISION
   ===================================================================== */
const REEL_SPEED = { 2: 30, 3: 18, 4: 11.5, 5: 9.4 };
const Fishing = {
  phase: 'READY', ctx: null, t: 0, power: 0, holding: false, band: null,
  bob: null, fx: [], rip: [], fishPos: null, msg: null, msgT: 0, autoQ: [], params: null, jump: null, lastOutcome: null,
  attach(ctx) {
    this.ctx = ctx; this.phase = 'READY'; this.t = 0; this.bob = null; this.fx = []; this.rip = []; this.fishPos = null; this.holding = false; this.jump = null;
    if (S.pendingCast) this.resolveInterrupted();
    if (S.pendingCatch) { this.phase = 'STORAGE_DECISION'; UI.showCatch(S.pendingCatch, true); }
  },
  detach() { this.ctx = null; this.holding = false; if (this.phase !== 'STORAGE_DECISION') this.phase = 'READY'; this.bob = null; this.fishPos = null; this.jump = null; },
  busy() { return !['READY'].includes(this.phase); },
  locked() { return ['CHARGING', 'CAST_FLYING', 'WAITING', 'BITE_WINDOW', 'QUICK_PULL', 'REELING', 'CATCH_RESULT', 'STORAGE_DECISION'].includes(this.phase); },
  say(m, d) { this.msg = m; this.msgT = d || 2.2; },
  canCast(atRelease) {
    if (!atRelease && this.phase !== 'READY') return { ok: false };
    const rod = rodOf();
    if (S.energy < rod.energy) return { ok: false, code: 'energy', msg: 'Enerjin yetmiyor (' + S.energy + '/' + rod.energy + '). Eve dönüp uyuyarak yeni güne başlayabilirsin.' };
    if (S.gear.bait !== 'basic' && !(S.baitStock[S.gear.bait] > 0)) return { ok: false, code: 'bait', msg: BAIT[S.gear.bait].name + ' bitti. Ücretsiz temel yeme geçebilirsin.' };
    if (this.ctx && this.ctx.moving && this.ctx.moving()) return { ok: false, code: 'moving', msg: 'Tekne hareket halindeyken olta atılamaz.' };
    if (this.ctx && this.ctx.atSpot && !this.ctx.atSpot()) return { ok: false, code: 'spot', msg: 'Bir av noktasında dur (şamandıralı alan).' };
    const sel = Selector.weights(this.ctx.spotId(), { rodPower: rod.power, bait: S.gear.bait });
    if (!sel.list.length) { const need = Math.min(...Object.keys(SPOTS[this.ctx.spotId()].weights).map(f => FISH[f].power)) - 1; return { ok: false, code: 'power', msg: 'Oltan bu noktadaki balıklar için çok zayıf. En az güç ' + need + ' olta gerekli.' }; }
    return { ok: true };
  },
  /* ---- giriş ---- */
  press() {
    switch (this.phase) {
      case 'READY': {
        const c = this.canCast(); if (!c.ok) { if (c.msg) { this.say(c.msg, 3); Sound.sfx('error'); if (c.code === 'bait') UI.offerBasicBait(); } return; }
        this.phase = 'CHARGING'; this.t = 0; this.power = 0; Sound.sfx('click'); break;
      }
      case 'BITE_WINDOW': this.hook(); break;
      case 'QUICK_PULL': case 'REELING': this.holding = true; break;
      case 'WAITING': this.say('Sabırlı ol… şamandıra dalınca dokun.', 1.4); break;
    }
  },
  release() {
    if (this.phase === 'CHARGING') this.releaseCast();
    this.holding = false;
  },
  cancel() {
    if (this.phase === 'CHARGING') { this.phase = 'READY'; S.stats.cancels++; this.say('Atış iptal edildi (ücretsiz).', 1.5); }
    this.holding = false;
  },
  giveUp() { if (this.phase === 'WAITING') this.finish('NO_BITE', 'Misinayı topladın.'); },
  releaseCast() {
    if (this.t < 0.15) { this.phase = 'READY'; S.stats.cancels++; this.say('Olta atmak için düğmeyi basılı tut ve bırak.', 2); return; }
    const pw = Math.round(this.power); const B = RC.cast_bands; const band = pw <= B.near[1] ? 'near' : pw <= B.mid[1] ? 'mid' : 'far';
    const spotId = this.ctx.spotId(), mode = this.ctx.mode;
    const r = Tx.run('cast', () => {
      const c = this.canCast(true); if (!c.ok) return { ok: false, msg: c.msg };
      const rod = rodOf(); S.energy -= rod.energy; const bait = S.gear.bait;
      if (bait !== 'basic') { S.baitStock[bait]--; S.stats.baitUsed++; if (S.baitStock[bait] <= 0) { S.gear.bait = 'basic'; Bus.toast(BAIT[bait].name + ' bitti; sonraki atışlar ücretsiz temel yemle.', 'warn', 'bait_basic'); } }
      S.stats.manualCasts++; S.today.casts++; S.stats.spotsVisited[spotId] = true; S.stats.regionsVisited[SPOTS[spotId].region_id] = true;
      S.pendingCast = { id: S.txSeq + 1, spotId, mode, band, bait, day: S.day };
      return { ok: true };
    });
    if (!r.ok) { this.phase = 'READY'; if (r.msg) this.say(r.msg, 2.5); return; }
    this.band = band; this.phase = 'CAST_FLYING'; this.t = 0;
    const tip = this.ctx.tip(); const dist = lerp(this.ctx.minCast, this.ctx.maxCast, pw / 100);
    this.bob = { x0: tip[0], y0: tip[1], x: tip[0], y: tip[1], tx: tip[0] + dist, ty: this.ctx.surf - 1, dip: 0 };
    Sound.sfx('cast');
  },
  hook() {
    const f = FISH[S.pendingCast.fish];
    Sound.sfx('hook'); if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) { }
    this.t = 0; this.progress = 0; this.tension = RC.tension_start; this.overT = 0; this.underT = 0; this.holding = true;
    this.surge = { st: 'none', t: 0, next: 1.6 + Math.random() * 2 };
    this.fishPos = { x: this.bob.tx, y: this.ctx.surf + 16, vx: 0 };
    if (f.power <= 1) { this.phase = 'QUICK_PULL'; return; }
    const rod = rodOf(), line = LINES.find(l => l.id === S.gear.line), reel = REELS.find(l => l.id === S.gear.reel), hook = HOOKS.find(l => l.id === S.gear.hook);
    const sz = S.pendingCast.size; const weak = f.power === rod.power + 1; const rid = SPOTS[S.pendingCast.spotId].region_id;
    const wx = S.world.weather[rid]; const ev = World.event(); const hull = this.ctx.mode === 'boat' && S.boats.active ? Boats.stats(S.boats.active).hull : 0;
    const comfort = SETTINGS.comfort ? 1.3 : 1;
    let gain = RC.tension_hold_gain_per_second * (weak ? 1.2 : 1) * (1 + 0.1 * (f.power - 2)) * (1 + 0.15 * sz.t * sz.t) / (1 + line.durability_bonus_pct / 100 * 0.6);
    if (ev && ev.effect === 'reel_tension_gain_multiplier' && ev.region === rid) gain *= ev.modifier;
    this.params = {
      gain, drop: RC.tension_release_drop_per_second,
      speed: REEL_SPEED[f.power] * (1 + reel.reel_speed_bonus_pct / 100) * (weak ? 0.8 : 1) / (1 + 0.12 * sz.t),
      breakT: RC.break_after_seconds * (1 + line.durability_bonus_pct / 100 * 0.5) * comfort,
      slackT: RC.slack_after_seconds * (1 + hook.slack_resistance_bonus_pct / 100) * comfort,
      wind: wx === 'wind' ? (hull >= 2 ? 0 : hull === 1 ? 3 : 6) : 0, power: f.power, weak
    };
    this.phase = 'REELING';
  },
  /* ---- güncelleme ---- */
  update(dt) {
    if (this.msgT > 0) this.msgT -= dt;
    this.fx = this.fx.filter(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; return p.t < p.life; });
    this.rip = this.rip.filter(r => { r.t += dt; return r.t < 1.2; });
    if (!this.ctx) return;
    this.t += dt;
    const b = this.bob;
    switch (this.phase) {
      case 'CHARGING': this.power = clamp(this.t / RC.charge_seconds * 100, 0, 100); break;
      case 'CAST_FLYING': {
        const T = 0.75, k = Math.min(1, this.t / T);
        b.x = lerp(b.x0, b.tx, k); b.y = lerp(b.y0, b.ty, k) - Math.sin(k * Math.PI) * (40 + (b.tx - b.x0) * 0.25);
        if (k >= 1) { b.x = b.tx; b.y = b.ty; this.splash(b.x, b.ty, 10); this.ripple(b.x); Sound.sfx('splash'); this.startWait(); }
        break;
      }
      case 'WAITING': {
        const pc = S.pendingCast;
        b.dip = Math.sin(this.t * 3) * 0.8;
        if (pc.bite && this.t > pc.wait - 1.6) { const k = clamp((this.t - (pc.wait - 1.6)) / 1.6, 0, 1); this.fishPos = { x: b.tx + lerp(70, 6, k), y: this.ctx.surf + 26 - k * 8, vx: -1 }; if (Math.random() < dt * 3) b.dip = 1.5; }
        if (Math.random() < dt * 0.6) this.ripple(b.x, 0.5);
        if (this.t >= pc.wait) {
          if (pc.bite) { this.phase = 'BITE_WINDOW'; this.t = 0; b.dip = 4; this.splash(b.x, this.ctx.surf, 14); this.ripple(b.x); Sound.sfx('bite'); if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch (e) { } }
          else this.finish('NO_BITE', 'Balık vurmadı. Bir dahaki atışta şansın açık olsun!');
        }
        break;
      }
      case 'BITE_WINDOW': {
        b.dip = 4 + Math.sin(this.t * 22) * 1.5;
        if (Math.random() < dt * 8) this.splash(b.x, this.ctx.surf, 2);
        if (this.t >= RC.reaction_window_sec * (SETTINGS.comfort ? 1.5 : 1)) this.finish('MISSED_BITE', 'Geç kaldın, balık yemi alıp gitti.');
        break;
      }
      case 'QUICK_PULL': {
        if (this.holding) { this.progress += 48 * dt; if (Math.random() < dt * 14) Sound.sfx('reel'); }
        const tip = this.ctx.tip(); const k = this.progress / 100;
        this.fishPos = { x: lerp(b.tx, tip[0] + 18, k), y: this.ctx.surf + 14 - k * 6 + Math.sin(this.t * 18) * 2, vx: -1 };
        if (this.progress >= 100) this.success();
        break;
      }
      case 'REELING': {
        const P = this.params; const sg = this.surge;
        if (P.power >= 3) {
          sg.t += dt;
          if (sg.st === 'none') { sg.next -= dt; if (sg.next <= 0) { sg.st = 'warn'; sg.t = 0; Sound.sfx('warn'); } }
          else if (sg.st === 'warn' && sg.t >= RC.surge_preview_sec) { sg.st = 'pull'; sg.t = 0; sg.dur = 0.55 + 0.12 * (P.power - 3) + Math.random() * 0.3; Sound.sfx('surge'); if (navigator.vibrate) try { navigator.vibrate(80); } catch (e) { } }
          else if (sg.st === 'pull' && sg.t >= sg.dur) { sg.st = 'none'; sg.next = (2.3 + Math.random() * 2.6) / Math.pow(P.power - 2, 0.35); }
        }
        if (sg.st === 'pull') { this.tension += (this.holding ? P.gain * 2.8 : 9) * dt; this.progress -= 6 * dt; if (Math.random() < dt * 10) this.splash(this.fishPos.x, this.ctx.surf, 3); }
        else if (this.holding) { this.tension += P.gain * dt; this.progress += P.speed * dt; if (Math.random() < dt * 12) Sound.sfx('reel'); }
        else this.tension -= P.drop * dt;
        if (P.wind) this.tension += Math.sin(this.t * 2.3) * P.wind * dt * 2;
        this.tension = clamp(this.tension, 0, 100); this.progress = clamp(this.progress, 0, 100);
        this.overT = this.tension > RC.break_threshold_above ? this.overT + dt : 0;
        this.underT = this.tension < RC.slack_threshold_below ? this.underT + dt : 0;
        const tip = this.ctx.tip(); const k = this.progress / 100;
        const away = sg.st === 'pull' ? 14 : 0;
        this.fishPos = { x: lerp(b.tx + 10, tip[0] + 22, k) + away + Math.sin(this.t * 7) * 3, y: this.ctx.surf + 22 + Math.sin(this.t * 5) * 4 - k * 8, vx: sg.st === 'pull' ? 1 : -1 };
        if (this.overT >= P.breakT) { this.finish('LINE_BREAK', 'Misina gerildi ve koptu! Ekipmanın sağlam, balık kaçtı.'); Sound.sfx('snap'); }
        else if (this.underT >= P.slackT) { this.finish('FISH_ESCAPED', 'Misina çok gevşek kaldı, balık kancadan kurtuldu.'); Sound.sfx('escape'); }
        else if (this.progress >= 100) this.success();
        break;
      }
      case 'CATCH_RESULT': {
        if (this.jump) { this.jump.t += dt; }
        break;
      }
      case 'OUTCOME': if (this.t > 1.0) { this.phase = 'READY'; this.bob = null; this.fishPos = null; } break;
    }
    if (this.phase === 'READY' && this.autoQ.length) { const a = this.autoQ.shift(); if (a) this.announceAuto(a); }
  },
  startWait() {
    const pc = S.pendingCast; const rid = SPOTS[pc.spotId].region_id; const ev = World.event();
    let bite = SPOTS[pc.spotId].base_bite_chance; if (ev && ev.effect === 'bite_chance_bonus' && ev.region === rid) bite += ev.modifier; bite = Math.min(0.95, bite);
    const r = Tx.run('castLand', () => {
      pc.wait = lerp(RC.wait_sec_range[0], RC.wait_sec_range[1], rand()); pc.bite = rand() < bite;
      if (pc.bite) { const sel = Selector.weights(pc.spotId, { rodPower: rodOf().power, bait: pc.bait, band: pc.band }); pc.fish = Selector.pick(sel.list); pc.size = Selector.rollSize(pc.fish); }
      return { ok: true };
    }, { noSave: false });
    this.phase = 'WAITING'; this.t = 0;
  },
  success() {
    const pc = S.pendingCast; const fid = pc.fish, size = pc.size; let res = null;
    Tx.run('catch', () => {
      const rec = Catch.record(fid, size, false);
      const where = Inv.place(Inv.manualOrder(), fid);
      res = { fid, size, rec, where };
      if (!where) S.pendingCatch = { fid, size, rec };
      S.pendingCast = null;
      res.autos = Auto.onCastComplete(pc.spotId, pc.mode);
      return { ok: true };
    });
    const tip = this.ctx.tip();
    this.jump = { t: 0, x0: this.fishPos.x, y0: this.fishPos.y, x1: tip[0] - 8, y1: tip[1] - 6, fid };
    this.splash(this.fishPos.x, this.ctx.surf, 18); this.ripple(this.fishPos.x);
    this.phase = res.where ? 'CATCH_RESULT' : 'STORAGE_DECISION'; this.t = 0; this.holding = false; this.lastOutcome = 'catch';
    Sound.sfx(res.rec.isRecord || res.rec.isNew ? 'record' : 'catch');
    this.queueAutos(res.autos);
    if (!QA.silent) setTimeout(() => UI.showCatch({ fid, size, rec: res.rec, where: res.where }, !res.where), 650);
    if (res.rec.isRecord) Bus.toast('Yeni kişisel rekor: ' + FISH[fid].name_tr + ' ' + size.cm + ' cm!', 'good', 'trophy');
  },
  finish(kind, text) {
    const pc = S.pendingCast; let autos = [];
    Tx.run('castEnd', () => {
      const m = { NO_BITE: 'noBite', MISSED_BITE: 'missed', LINE_BREAK: 'lineBreaks', FISH_ESCAPED: 'escapes' }[kind]; if (m) S.stats[m]++;
      S.pendingCast = null; if (pc) autos = Auto.onCastComplete(pc.spotId, pc.mode); return { ok: true };
    });
    this.lastOutcome = kind; this.say(text, 2.6); this.phase = 'OUTCOME'; this.t = 0; this.holding = false; this.fishPos = null;
    this.queueAutos(autos);
  },
  /* sonuç kartı kapandı */
  resultClosed() { if (this.phase === 'CATCH_RESULT') { this.phase = 'READY'; this.bob = null; this.fishPos = null; this.jump = null; } },
  resolveStorage(choice, key, idx) {
    const pc = S.pendingCatch; if (!pc) return { ok: false };
    const r = Tx.run('storageDecision', () => {
      if (choice === 'release') { S.stats.released++; S.today.released++; S.pendingCatch = null; return { ok: true }; }
      const a = Inv.arr(key); if (!a || !a[idx]) return { ok: false, msg: 'Seçilen yığın bulunamadı.' };
      const s = a.splice(idx, 1)[0]; S.stats.released += s.q; S.today.released += s.q;
      const where = Inv.place(Inv.manualOrder(), pc.fid); if (!where) throw new Error('yer açılmadı');
      S.pendingCatch = null; return { ok: true, where };
    });
    if (r.ok) { this.phase = 'READY'; this.bob = null; this.fishPos = null; this.jump = null; }
    return r;
  },
  resolveInterrupted() {
    const pc = S.pendingCast; let autos = [];
    Tx.run('castInterrupted', () => { S.stats.escapes++; S.pendingCast = null; autos = Auto.onCastComplete(pc.spotId, pc.mode); return { ok: true }; });
    Bus.toast('Yarıda kalan atış sonlandı: balık kaçtı (çift ödül oluşmaz).', 'info', 'release');
    this.queueAutos(autos);
  },
  queueAutos(ev) { for (const e of ev || []) { if (e.type === 'tick') continue; this.autoQ.push(e); if (this.ctx && this.ctx.onAuto) this.ctx.onAuto(e); } },
  announceAuto(e) {
    if (e.type === 'catch') { Bus.toast('Otomatik olta: ' + FISH[e.fid].name_tr + ' (' + e.size.cm + ' cm) → ' + (e.where === 'bag' ? 'çanta' : 'tekne deposu') + ' · Bugün ' + S.auto.dailyCaught + '/' + CORE.auto_daily_catch_cap, 'auto', 'auto1'); Sound.sfx('auto'); }
    else if (e.type === 'miss') Bus.toast('Otomatik olta denedi ama balık kaçtı (1 yem harcandı).', 'info', 'auto1');
    else if (e.type === 'paused') Bus.toast('Otomatik olta beklemede: ' + Auto.reasonTr[e.reason], 'warn', 'auto1');
  },
  splash(x, y, n) { for (let i = 0; i < n; i++) this.fx.push({ x, y, vx: (Math.random() - 0.5) * 70, vy: -40 - Math.random() * 70, t: 0, life: 0.5 + Math.random() * 0.4, c: Math.random() < 0.5 ? '#ffffff' : '#bfe8f8' }); },
  ripple(x, s) { this.rip.push({ x, t: 0, s: s || 1 }); },
  /* ---- çizim (dünya koordinatı; cam = kamera x) ---- */
  render(g, cam) {
    if (!this.ctx) return;
    const surf = this.ctx.surf; const tip = this.ctx.tip(); const LC = LINE_COL[Math.max(0, LINES.findIndex(l => l.id === S.gear.line))]; const lineC = mix(LC, '#ffffff', 0.25);
    for (const r of this.rip) { const k = r.t / 1.2, rx = 4 + k * 18 * r.s; g.globalAlpha = (1 - k) * 0.8; pxEllipse(g, Math.round(r.x - cam), surf + 1, rx, Math.max(1, rx * 0.22), '#e8f8ff'); }
    g.globalAlpha = 1;
    const b = this.bob;
    // misina
    if (b && ['CAST_FLYING', 'WAITING', 'BITE_WINDOW', 'OUTCOME'].includes(this.phase)) {
      const sag = this.phase === 'CAST_FLYING' ? 4 : 10; pxCurve(g, tip[0] - cam, tip[1], b.x - cam, b.y + (this.phase === 'CAST_FLYING' ? 0 : b.dip), sag, lineC);
    }
    if (this.fishPos && ['WAITING', 'BITE_WINDOW', 'QUICK_PULL', 'REELING'].includes(this.phase) && S.pendingCast && S.pendingCast.fish) {
      const sil = this.phase === 'WAITING' ? fishSil(S.pendingCast.fish) : fishSil(S.pendingCast.fish);
      const fp = this.fishPos; const flip = fp.vx > 0;
      g.globalAlpha = this.phase === 'WAITING' ? 0.45 : 0.75;
      g.drawImage(flip ? fishSilR(S.pendingCast.fish) : sil, Math.round(fp.x - cam - (flip ? sil.width - 4 : 4)), Math.round(fp.y - sil.height / 2));
      g.globalAlpha = 1;
      if (this.phase === 'QUICK_PULL' || this.phase === 'REELING') pxLine(g, tip[0] - cam, tip[1], fp.x - cam, fp.y, this.tension > 75 ? '#ffd8c8' : lineC);
    }
    if (b && ['CAST_FLYING', 'WAITING', 'BITE_WINDOW', 'OUTCOME'].includes(this.phase)) drawBobber(g, Math.round(b.x - cam), Math.round(b.y + (this.phase === 'CAST_FLYING' ? 0 : b.dip)), this.phase === 'BITE_WINDOW');
    if (this.phase === 'BITE_WINDOW' && b) { const k = 1 - this.t / (RC.reaction_window_sec * (SETTINGS.comfort ? 1.5 : 1)); drawBang(g, Math.round(b.x - cam), surf - 26, k); }
    // zıplayan balık
    if (this.jump && (this.phase === 'CATCH_RESULT' || this.phase === 'STORAGE_DECISION')) {
      const j = this.jump, k = Math.min(1, j.t / 0.6); const sp = fishSprite(j.fid);
      const x = lerp(j.x0, j.x1, k), y = lerp(j.y0, j.y1, k) - Math.sin(k * Math.PI) * 50;
      g.drawImage(sp, Math.round(x - cam - sp.width / 2), Math.round(y - sp.height / 2));
      if (k < 1) pxLine(g, tip[0] - cam, tip[1], x - cam, y, 'rgba(240,248,255,0.8)');
    }
    for (const p of this.fx) { g.fillStyle = p.c; g.fillRect(Math.round(p.x - cam), Math.round(p.y), 1, 1); }
  },
  /* ekran üstü pikselli göstergeler */
  renderHUD(g) {
    if (!this.ctx) return;
    if (this.phase === 'CHARGING') {
      const x = 586, y = 120, h = 120; g.fillStyle = '#2a1e1a'; g.fillRect(x - 2, y - 2, 18, h + 4); g.fillStyle = '#4a3a30'; g.fillRect(x, y, 14, h);
      const B = RC.cast_bands; const segs = [[B.near, '#5fb8e8'], [B.mid, '#5fc46a'], [B.far, '#f2c230']];
      for (const [r, c] of segs) { g.fillStyle = dark(c, 0.45); g.fillRect(x + 1, y + h - Math.round(r[1] / 100 * h), 12, Math.round((r[1] - r[0] + 1) / 100 * h)); }
      const ph = Math.round(this.power / 100 * h); const cur = this.power <= B.near[1] ? '#5fb8e8' : this.power <= B.mid[1] ? '#5fc46a' : '#f2c230';
      g.fillStyle = cur; g.fillRect(x + 1, y + h - ph, 12, ph); g.fillStyle = '#ffffff'; g.fillRect(x + 1, y + h - ph, 12, 1);
      drawText(g, 'U', x + 18, y + 6, '#f2c230', 1, '#000'); drawText(g, 'O', x + 18, y + 46, '#5fc46a', 1, '#000'); drawText(g, 'Y', x + 18, y + 96, '#5fb8e8', 1, '#000');
      const lbl = this.power <= B.near[1] ? 'YAKIN' : this.power <= B.mid[1] ? 'ORTA' : 'UZAK'; drawText(g, lbl + ' ' + Math.round(this.power) + '%', x - 30, y + h + 8, '#ffffff', 1, '#1a1426');
    }
    if (this.phase === 'REELING' || this.phase === 'QUICK_PULL') {
      const x0 = 170, y0 = 66, w = 300;
      g.fillStyle = 'rgba(20,14,26,0.75)'; g.fillRect(x0 - 6, y0 - 6, w + 12, this.phase === 'REELING' ? 44 : 24);
      // ilerleme
      g.fillStyle = '#3a3048'; g.fillRect(x0, y0, w, 6); g.fillStyle = '#5fc46a'; g.fillRect(x0, y0, Math.round(this.progress / 100 * w), 6);
      const sp = fishSil(S.pendingCast.fish); g.drawImage(Atlas.get('icon:fishI', () => iconPB('fishI')), x0 + w + 2, y0 - 5);
      drawText(g, this.phase === 'QUICK_PULL' ? 'SAR! (BASILI TUT)' : 'MESAFE', x0, y0 + 9, '#e8e0f0', 1);
      if (this.phase === 'REELING') {
        const ty = y0 + 20; const Z = [[0, RC.slack_threshold_below, '#3a78c8'], [RC.slack_threshold_below, RC.safe_band[0], '#8a7a4a'], [RC.safe_band[0], RC.safe_band[1], '#3f9a4a'], [RC.safe_band[1], RC.break_threshold_above, '#c8862a'], [RC.break_threshold_above, 100, '#c4473f']];
        for (const [a, b, c] of Z) { g.fillStyle = c; g.fillRect(x0 + Math.round(a / 100 * w), ty, Math.ceil((b - a) / 100 * w), 9); }
        for (let i = 0; i < w; i += 6) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x0 + i, ty, 1, 9); }
        const mx = x0 + Math.round(this.tension / 100 * w); g.fillStyle = '#ffffff'; g.fillRect(mx - 1, ty - 3, 3, 15); g.fillStyle = '#1a1426'; g.fillRect(mx, ty - 2, 1, 13);
        let lab = 'GERİLİM', col = '#e8e0f0';
        if (this.tension > RC.break_threshold_above) { lab = 'ÇOK GERGİN! BIRAK!'; col = (Math.floor(this.t * 8) % 2) ? '#ff8a7a' : '#ffffff'; }
        else if (this.tension < RC.slack_threshold_below) { lab = 'GEVŞEK! ÇEK!'; col = (Math.floor(this.t * 8) % 2) ? '#8ac8ff' : '#ffffff'; }
        else if (this.tension >= RC.safe_band[0] && this.tension <= RC.safe_band[1]) lab = 'İDEAL';
        drawText(g, lab, x0, ty + 13, col, 1);
        const dangerK = Math.max(this.overT / this.params.breakT, this.underT / this.params.slackT);
        if (dangerK > 0) { g.fillStyle = '#c4473f'; g.fillRect(x0 + w - 60, ty + 13, Math.round(60 * dangerK), 4); }
        if (this.surge.st === 'warn') drawText(g, '!! ANİ ÇEKİŞ GELİYOR !!', x0 + 70, y0 - 16, (Math.floor(this.t * 10) % 2) ? '#ffd040' : '#ffffff', 1, '#1a1426');
        if (this.surge.st === 'pull') drawText(g, 'BALIK KAÇIYOR – BIRAK!', x0 + 74, y0 - 16, '#ff8a7a', 1, '#1a1426');
      }
    }
    if (this.msgT > 0 && this.msg) {
      const words = this.msg.split(' '); const lines = []; let cur = '';
      for (const w of words) { if ((cur + ' ' + w).length > 52) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } lines.push(cur);
      const h = lines.length * 8 + 6; const y = (this.phase === 'REELING' || this.phase === 'QUICK_PULL') ? 116 : 70;
      g.fillStyle = 'rgba(20,14,26,0.72)'; g.fillRect(110, y, 420, h);
      lines.forEach((l, i) => drawText(g, l, 320 - textWidth(l) / 2, y + 4 + i * 8, '#fff6e0', 1));
    }
  }
};
/* ---- piksel çizim yardımcıları (canvas bağlamı) ---- */
function pxLine(g, x0, y0, x1, y1, c) { g.fillStyle = c; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let n = 0; n < 1500; n++) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
function pxCurve(g, x0, y0, x1, y1, sag, c) { const n = Math.max(8, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4)); let px = x0, py = y0; for (let i = 1; i <= n; i++) { const t = i / n; const x = lerp(x0, x1, t), y = lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag; pxLine(g, px, py, x, y, c); px = x; py = y; } }
function pxEllipse(g, cx, cy, rx, ry, c) { g.fillStyle = c; const n = Math.max(12, Math.ceil(rx * 2.5)); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1); } }
const bobberPB = () => { const p = new PB(5, 11); p.rect(2, 0, 1, 3, '#2a2226'); p.rect(1, 3, 3, 3, '#e8483a'); p.rect(0, 4, 5, 1, '#e8483a'); p.rect(1, 6, 3, 1, '#f4f4f0'); p.rect(0, 7, 5, 1, '#f4f4f0'); p.rect(1, 8, 3, 2, '#f4f4f0'); p.set(1, 3, '#ff8a7a'); p.rect(2, 10, 1, 1, '#2a2226'); return p; };
function drawBobber(g, x, y, bite) { const b = Atlas.get('bobber', bobberPB); g.drawImage(b, x - 2, y - 7); }
function drawBang(g, x, y, k) {
  const pulse = 1 + Math.sin(performance.now() / 60) * 0.15;
  g.fillStyle = '#1a1426'; g.fillRect(x - 6, y - 10, 13, 16); g.fillStyle = '#ffd040'; g.fillRect(x - 5, y - 9, 11, 14);
  g.fillStyle = '#c4473f'; g.fillRect(x - 1, y - 7, 3, 7); g.fillRect(x - 1, y + 1, 3, 2);
  g.fillStyle = '#ffffff'; g.fillRect(x - 8, y + 9, Math.round(17 * clamp(k, 0, 1)), 2);
  drawText(g, 'DOKUN!', x - 11, y - 18, pulse > 1.05 ? '#ffffff' : '#ffd040', 1, '#1a1426');
}
/* olta çizimi: el noktasından uca, gerilime göre bükülme */
function drawRod(g, hx, hy, pose, tension, rodId, flip) {
  const i = RODS.findIndex(r => r.id === rodId); const [c1, c2] = ROD_COL[Math.max(0, i)];
  let ang = -0.62, len = 30; if (pose === 'charge') ang = -2.3; if (pose === 'cast') ang = -0.25;
  const bend = (tension || 0) / 100;
  const tipX = hx + Math.cos(ang) * len + bend * 6, tipY = hy + Math.sin(ang) * len + bend * 14;
  const n = 14; let px = hx, py = hy;
  for (let k = 1; k <= n; k++) { const t = k / n; const x = lerp(hx, tipX, t), y = lerp(hy, tipY, t) - Math.sin(t * Math.PI) * (2 - bend * 6) + t * t * bend * 6; g.fillStyle = t < 0.3 ? c2 : c1; pxLine(g, px, py, x, y, t < 0.3 ? c2 : c1); px = x; py = y; }
  const rc = REEL_COL[Math.max(0, REELS.findIndex(r => r.id === S.gear.reel))]; g.fillStyle = dark(rc, 0.3); g.fillRect(Math.round(hx), Math.round(hy) + 1, 5, 4); g.fillStyle = rc; g.fillRect(Math.round(hx) + 1, Math.round(hy) + 1, 3, 3); g.fillStyle = '#e8ecf0'; g.fillRect(Math.round(hx) + 2, Math.round(hy) + 2, 1, 1);
  return [Math.round(px), Math.round(py)];
}
