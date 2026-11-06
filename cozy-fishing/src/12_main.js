/* =====================================================================
   12_main.js : Renderer döngüsü, InputManager, ölçekleme/letterbox, görünürlük, tam ekran, açılış, QA paneli
   ===================================================================== */
const cvs = $('screen'); const sctx = cvs.getContext('2d');
const [BUF, G] = mkCanvas(LW, LH);
let SCALE = 1;
function safeInsets() {
  const p = document.getElementById('safeprobe'); if (!p) return { t: 0, r: 0, b: 0, l: 0 };
  const cs = getComputedStyle(p); return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
}
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight; const ins = safeInsets();
  const portrait = vh > vw * 1.08 && Math.min(vw, vh) < 900;
  document.body.classList.toggle('portrait', portrait); Game.portrait = portrait;
  const aw = Math.max(100, vw - ins.l - ins.r), ah = Math.max(100, vh - ins.t - ins.b);
  SCALE = Math.min(aw / LW, ah / LH); const W = Math.floor(LW * SCALE), H = Math.floor(LH * SCALE);
  const fr = $('frame'); fr.style.width = W + 'px'; fr.style.height = H + 'px'; fr.style.left = Math.round(ins.l + (aw - W) / 2) + 'px'; fr.style.top = Math.round(ins.t + (ah - H) / 2) + 'px';
  fr.style.setProperty('--u', SCALE.toFixed(4));
  const dpr = Math.min(3, window.devicePixelRatio || 1); cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
  sctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 120));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

/* ---- döngü ---- */
let lastTs = performance.now(), lastPhase = null;
function frame(ts) {
  let dt = (ts - lastTs) / 1000; lastTs = ts; if (!(dt > 0)) dt = 0; dt = Math.min(dt, 0.05);
  const paused = Game.paused || Game.portrait || document.hidden;
  try {
    if (!paused && Game.scene) { Game.t += dt; Game.scene.update(dt); }
    G.setTransform(1, 0, 0, 1, 0, 0); G.globalAlpha = 1; G.imageSmoothingEnabled = false; G.fillStyle = '#100c18'; G.fillRect(0, 0, LW, LH);
    if (Game.scene) Game.scene.render(G, paused ? 0 : dt);
    if (Game.fade > 0) { G.globalAlpha = Game.fade; G.fillStyle = '#100c18'; G.fillRect(0, 0, LW, LH); G.globalAlpha = 1; Game.fade = Math.max(0, Game.fade - dt * 3.5); }
    sctx.imageSmoothingEnabled = false; sctx.drawImage(BUF, 0, 0, cvs.width, cvs.height);
  } catch (e) { console.error(e); if (!Game._errShown) { Game._errShown = true; UI.toastNow('Bir çizim hatası oluştu: ' + e.message, 'warn'); } }
  UI.pump();
  if (Fishing.phase !== lastPhase) { lastPhase = Fishing.phase; UI.fishBarUpdate(); }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Game.paused = true; Fishing.holding = false; if (S) Save.now(); Sound.suspend(true); }
  else { Game.paused = false; lastTs = performance.now(); Sound.suspend(false); }
});
window.addEventListener('pagehide', () => { if (S) Save.now(); });
window.addEventListener('blur', () => { Fishing.holding = false; if (Fishing.phase === 'CHARGING') Fishing.cancel(); });

/* ---- giriş ---- */
const Input = {
  ptr: null,
  toLogical(e) { const r = cvs.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * LW, (e.clientY - r.top) / r.height * LH]; },
  init() {
    cvs.addEventListener('pointerdown', e => {
      e.preventDefault(); Sound.start(); if (UI.modalOpen()) return;
      const [x, y] = this.toLogical(e);
      if (['BITE_WINDOW', 'REELING', 'QUICK_PULL'].includes(Fishing.phase) && Fishing.ctx) { this.ptr = e.pointerId; Fishing.press(); try { cvs.setPointerCapture(e.pointerId); } catch (x2) { } return; }
      const sc = Game.scene; if (!sc || !sc.tap) return;
      if (Game.sceneName === 'Town') sc.tap(x + sc.cam, y); else sc.tap(x, y);
    }, { passive: false });
    const up = e => { if (this.ptr === e.pointerId) { this.ptr = null; Fishing.release(); } };
    cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up); cvs.addEventListener('lostpointercapture', up);
    document.addEventListener('contextmenu', e => { if (e.target.closest('#frame')) e.preventDefault(); });
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', e => { if (!e.target.closest('.scroll') && !e.target.closest('textarea')) e.preventDefault(); }, { passive: false });
    const keyMove = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 };
    window.addEventListener('keydown', e => {
      if (e.target.matches && e.target.matches('input,textarea')) return;
      Sound.start();
      if (e.code === 'F3' || (e.code === 'Backquote' && e.shiftKey)) { e.preventDefault(); QA.enable(); UI.openPanel('Debug'); return; }
      if (e.code === 'Escape') { if (UI.modal) UI.closeModal(); else if (UI.panel) UI.closePanel(); else if (Fishing.phase === 'CHARGING') Fishing.cancel(); return; }
      if (UI.modalOpen()) return;
      if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && Fishing.ctx) { Fishing.press(); UI.fishBarUpdate(); } return; }
      if (keyMove[e.code] != null && !e.repeat) { const sc = Game.scene; if (Game.sceneName === 'PierFishing') sc.switchSpot(keyMove[e.code]); else if (sc && sc.input) sc.input(keyMove[e.code]); return; }
      if ((e.code === 'KeyE' || e.code === 'Enter') && !e.repeat) { if (Game.sceneName === 'Town') Game.scene.interact(); else if (Game.sceneName === 'Home' && Game.scene.near) Game.scene.act(Game.scene.near); }
      if (e.code === 'KeyI' && S && Game.sceneName !== 'MainMenu') UI.openPanel('Inventory');
      if (e.code === 'Digit1' && Game.sceneName === 'BoatFishing') Game.scene.goSpot(0);
      if (e.code === 'Digit2' && Game.sceneName === 'BoatFishing') Game.scene.goSpot(1);
      if (e.code === 'Digit3' && Game.sceneName === 'BoatFishing') Game.scene.goSpot(2);
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'Space') { if (Fishing.ctx) { Fishing.release(); UI.fishBarUpdate(); } }
      if (keyMove[e.code] != null) { const sc = Game.scene; if (sc && sc.input) sc.input(0); }
    });
  }
};
/* ---- tam ekran ---- */
async function toggleFullscreen() {
  const d = document, el = d.documentElement; const isFs = d.fullscreenElement || d.webkitFullscreenElement;
  try {
    if (!isFs) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen; if (!req) throw new Error('yok');
      await req.call(el); try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) { }
    } else { const ex = d.exitFullscreen || d.webkitExitFullscreen; if (ex) await ex.call(d); }
  } catch (e) {
    UI.confirm({ title: 'Tam ekran açılamadı', icon: 'fullscreen', text: 'Bu tarayıcı ya da gömülü sayfa tam ekrana izin vermiyor. iPhone/iPad Safari\'de Paylaş → "Ana Ekrana Ekle" ile tam ekran oynayabilir ya da telefonu yatay tutarak devam edebilirsin. Masaüstünde F11 de kullanılabilir.', ok: 'Tamam', cancel: 'Kapat' });
  }
  setTimeout(resize, 200);
}
/* ---- açılış / akış ---- */
async function boot() {
  SETTINGS = Save.settings();
  UI.init(); Input.init(); resize();
  await Save.init();
  const res = await Save.loadBest();
  UI._hasSave = !!res.state; UI._saveErr = res.error ? ('Kayıt yüklenemedi: ' + res.error + ' Kayıt silinmedi.') : null; UI._rawSave = res.raw || null;
  if (res.state) S = res.state;
  go('MainMenu');
  requestAnimationFrame(frame);
  if (/[?&]debug=1/.test(location.search)) QA.enable();
  $('boot').style.display = 'none';
}
function startFromSave() { if (!S) return; startFromState(); }
function startFromState() {
  if (!S.world.weather || !Object.keys(S.world.weather).length) World.startDay();
  if (!S.today) S.today = newToday(S);
  Boats.updateUnlocked(); Ach.check(); Cosmetics.check();
  for (const k in UI.npcLines) delete UI.npcLines[k];
  const sc = S.scene;
  if (sc === 'BoatFishing' && S.boats.active && S.regionId) go('BoatFishing', { rid: S.regionId });
  else if (sc === 'PierFishing') go('PierFishing', {});
  else if (sc === 'Home') go('Home', {});
  else go('Town', {});
}
function beginNewGame(look) {
  Save.keepPrevious();
  S = newState({ name: look.name, body: look.body, skin: look.skin, hair: look.hair, hairColor: look.hairColor, outfit: look.outfit, hat: look.hat });
  World.startDay(); S.scene = 'Town'; Save.now(); Save.backup(); UI._hasSave = true; UI._saveErr = null;
  for (const k in UI.npcLines) delete UI.npcLines[k];
  go('Town', { at: 'home' });
  UI.toastNow('Hoş geldin ' + S.player.name + '! Sakin Liman\'da ilk günün. Efe seni iskelede bekliyor.', 'good', 'sunny');
}
function checkSaveAndMenu() { UI._hasSave = !!S; go('MainMenu'); }

/* =====================================================================
   QA / Debug paneli — F3 veya ?debug=1. Testler kum havuzunda çalışır; gerçek kaydı bozmaz.
   ===================================================================== */
const QA = {
  on: false, results: null,
  enable() { if (this.on) return; this.on = true; const b = document.createElement('button'); b.className = 'dbgbtn'; b.textContent = 'QA'; b.onclick = () => UI.openPanel('Debug'); $('frame').appendChild(b); },
  panelHtml() {
    const B = (k, n, extra) => `<button class="btn sm" data-a="dbg" data-k="${k}" ${extra || ''}>${n}</button>`;
    let h = `<p class="dim small">Bu panel normal oyuncuya görünmez. Hile düğmeleri kayda "debug kullanıldı" işareti koyar; ilerleme için gerekmez.</p>`;
    if (S && Game.sceneName !== 'MainMenu') h += `<h4>Oyun denetimleri</h4><div class="btns left">${B('cash1k', '+1.000 para')}${B('cash10k', '+10.000')}${B('cash100k', '+100.000')}${B('energy', 'Enerji 100')}${B('sleep', 'Günü bitir (+1)')}${B('season', '+28 gün')}${B('boats', 'Tüm tekneler + yükseltmeler')}${B('rod5', 'Tüm ekipman')}${B('bait', '+50 her yem')}${B('autos', 'Tüm otomasyon')}${B('fish42', '42 türü keşfet')}${B('wx', 'Havayı değiştir')}${B('event', 'Olay değiştir')}</div>
      <h4>Bölgeye ışınlan</h4><div class="btns left">${REGIONS.map(r => B('tp', r.name, `data-r="${r.id}"`)).join('')}</div>
      <h4>Tür olasılıkları (mevcut nokta: ${esc(S.spotId)})</h4>${this.probTable()}`;
    h += `<h4>Kabul testleri</h4><div class="btns left">${B('tests', 'Tüm testleri çalıştır')}</div>`;
    if (this.results) h += `<div class="qa">${this.results.map(r => `<div class="${r.ok ? 'ok' : 'bad'}">${r.ok ? '✓' : '✗'} ${esc(r.name)} <span class="dim">${esc(r.info || '')}</span></div>`).join('')}</div><p><b>${this.results.filter(r => r.ok).length}/${this.results.length}</b> geçti.</p>`;
    return h;
  },
  probTable() {
    const sel = Selector.weights(S.spotId, { rodPower: rodOf().power, bait: S.gear.bait, band: 'mid' });
    return `<table class="qt"><tr><th>Tür</th><th>Taban</th><th>Yem</th><th>Mevsim</th><th>Hava</th><th>Mesafe(orta)</th><th>Olay</th><th>P</th></tr>${sel.list.map(x => `<tr><td>${esc(FISH[x.id].name_tr)}</td><td>${x.base}</td><td>${x.fac.bait}</td><td>${x.fac.season}</td><td>${x.fac.weather}</td><td>${x.fac.band}</td><td>${x.fac.event}</td><td>${(x.p * 100).toFixed(1)}%</td></tr>`).join('')}<tr><td>Toplam</td><td>${sel.baseTotal}</td><td colspan="5"></td><td>${(sum(sel.list.map(x => x.p)) * 100).toFixed(1)}%</td></tr></table>`;
  },
  act(k, d) {
    if (k === 'tests') { this.results = this.runAll(); UI.renderPanel(true); return; }
    S.flags.debugUsed = true;
    switch (k) {
      case 'cash1k': S.cash += 1000; break; case 'cash10k': S.cash += 10000; break; case 'cash100k': S.cash += 100000; break;
      case 'energy': S.energy = 100; break;
      case 'sleep': { const rep = World.sleep(); if (rep) { UI.closePanel(true); go('EndDay', { rep }); return; } break; }
      case 'season': for (let i = 0; i < 28; i++) { S.stats.daysCompleted++; S.day++; World.startDay(); } break;
      case 'boats': for (const b of BOATS) { if (!Boats.owned(b.id)) { S.boats.owned.push(b.id); S.boats.byId[b.id] = { ups: {}, storage: [], color: 'sea_green', name: '' }; } for (const u of BOAT_INFO[b.id].ups) S.boats.byId[b.id].ups[u.key] = true; } if (!S.boats.active) S.boats.active = 'coastal_skiff'; Boats.updateUnlocked(); break;
      case 'rod5': for (const kind in GEAR) for (const it of GEAR[kind]) if (!S.gear.owned[kind].includes(it.id)) S.gear.owned[kind].push(it.id); S.gear.rod = 'professional'; S.gear.line = 'pro'; S.gear.reel = 'professional'; S.gear.hook = 'pro'; S.bagLevel = INVC.bag.length - 1; break;
      case 'bait': PAID_BAITS.forEach(b => S.baitStock[b] += 50); break;
      case 'autos': for (const a of AUTOS) { if (a.type === 'device') { if (!S.auto.devices[a.id]) S.auto.devices[a.id] = { boat: null, counter: 0 }; } else S.auto.globals[a.id] = true; } if (S.boats.active) for (const dv of Auto.DEV) if (!S.auto.devices[dv].boat && Auto.slotsFree(S.boats.active) > 0) S.auto.devices[dv].boat = S.boats.active; break;
      case 'fish42': for (const f of FISH_LIST) { if (!S.ency[f.id] || !S.ency[f.id].caught) S.ency[f.id] = { caught: 1, maxLen: f.size_game_range.length_cm[0], maxKg: f.size_game_range.weight_kg[0], firstDay: S.day }; } break;
      case 'wx': { const ty = CFG.weather.types; for (const r of REGIONS) S.world.weather[r.id] = ty[(ty.indexOf(S.world.weather[r.id]) + 1) % ty.length]; Sound.setScene(Sound.mode, S.world.weather.sakin_liman); break; }
      case 'event': { const ids = [null].concat(EVENTS.map(e => e.id)); S.world.eventId = ids[(ids.indexOf(S.world.eventId) + 1) % ids.length]; break; }
      case 'tp': { const rid = d.r; if (rid === 'sakin_liman') { UI.closePanel(true); go('PierFishing', { spot: 1 }); return; } if (!S.boats.active) { S.boats.owned.push('offshore'); S.boats.byId.offshore = { ups: {}, storage: [], color: 'sea_green', name: '' }; S.boats.active = 'offshore'; } S.world.unlocked[rid] = true; S.regionId = rid; S.spotId = REGION[rid].spot_ids[0]; UI.closePanel(true); go('BoatFishing', { rid }); return; }
    }
    Ach.check(); Cosmetics.check(); Save.now(); UI.refresh();
  },
  /* ---------- otomatik kabul testleri (kum havuzu) ---------- */
  runAll() {
    const real = S, realSusp = Save.suspended, realCtx = Fishing.ctx, realPhase = Fishing.phase, realQ = Fishing.autoQ.slice();
    Save.suspended = true; this.silent = true; const out = [];
    const T = (name, fn) => { try { const r = fn(); out.push({ name, ok: r === true || (r && r.ok), info: r && r.info ? r.info : (r === true ? '' : JSON.stringify(r)) }); } catch (e) { out.push({ name, ok: false, info: 'HATA ' + e.message }); } };
    const fresh = () => { S = newState({ name: 'Test' }); World.startDay(); return S; };
    const ctx = { mode: 'pier', surf: 236, minCast: 40, maxCast: 300, spotId: () => 'liman_iskele', tip: () => [200, 200], moving: () => false };
    const castOnce = () => { Fishing.attach(ctx); Fishing.press(); if (Fishing.phase !== 'CHARGING') return false; Fishing.t = 0.6; Fishing.power = 50; Fishing.releaseCast(); if (Fishing.phase !== 'CAST_FLYING') return false; Fishing.finish('NO_BITE', ''); Fishing.phase = 'READY'; return true; };
    try {
      T('1. Yeni oyun: gün 1, 100 para, 100 enerji, 6 yuva, tekne yok', () => { fresh(); return S.day === 1 && S.cash === 100 && S.energy === 100 && Inv.cap('bag') === 6 && S.boats.owned.length === 0 && S.gear.rod === 'old_bamboo' && Inv.cap('chest') === 10; });
      T('2a. Eski Bambu: 12 geçerli atış, 4 enerji kalır, 13. engellenir', () => { fresh(); let n = 0; while (castOnce() && n < 30) n++; return { ok: n === 12 && S.energy === 4, info: n + ' atış, kalan ' + S.energy }; });
      T('2b. Profesyonel olta: 20 atış', () => { fresh(); S.gear.owned.rod.push('professional'); S.gear.rod = 'professional'; let n = 0; while (castOnce() && n < 30) n++; return { ok: n === 20 && S.energy === 0, info: n + ' atış' }; });
      T('3a. Atış iptali ücretsiz ve otomasyon sayacını ilerletmez', () => { fresh(); Fishing.attach(ctx); Fishing.press(); Fishing.t = 0.5; Fishing.cancel(); return S.energy === 100 && S.stats.manualCasts === 0; });
      T('3b. Başarısız geçerli atış enerji+yem harcar, balık eklemez', () => { fresh(); S.baitStock.worm = 10; S.gear.bait = 'worm'; castOnce(); return { ok: S.energy === 92 && S.baitStock.worm === 9 && Inv.total('bag') === 0, info: 'enerji ' + S.energy + ' yem ' + S.baitStock.worm }; });
      T('4a. FishDB: 42 tür, 7 bölge, 21 nokta; her nokta toplamı 100', () => { const bad = SPOT_LIST.filter(s => sum(Object.values(s.weights)) !== 100); return { ok: FISH_LIST.length === 42 && REGIONS.length === 7 && SPOT_LIST.length === 21 && !bad.length && SPOT_LIST.every(s => Object.keys(s.weights).every(f => FISH[f])), info: bad.map(b => b.id).join(',') }; });
      T('4b. Tüm çarpanlardan sonra olasılıklar 1\'e normalize', () => { fresh(); let worst = 0; for (const sp of SPOT_LIST) for (const b of BAITS) for (const band of ['near', 'mid', 'far']) for (const wx of CFG.weather.types) { S.world.weather[sp.region_id] = wx; const w = Selector.weights(sp.id, { rodPower: 5, bait: b.id, band }); worst = Math.max(worst, Math.abs(sum(w.list.map(x => x.p)) - 1)); } return { ok: worst < 1e-9, info: 'max sapma ' + worst }; });
      T('4c. Olta gücü filtresi: güç ≤ olta+1; boşsa atış engellenir (enerji harcanmaz)', () => { fresh(); const w = Selector.weights('adalar_derin', { rodPower: 1 }); const ok1 = w.list.every(x => FISH[x.id].power <= 2) && w.list.length > 0; const w2 = Selector.weights('derin_cukur', { rodPower: 1 }); const c2 = Object.assign({}, ctx, { spotId: () => 'derin_cukur' }); Fishing.attach(c2); Fishing.press(); return { ok: ok1 && w2.list.length === 0 && Fishing.phase === 'READY' && S.energy === 100, info: 'liste ' + w.list.length }; });
      T('4d. Mevsim hiçbir türü sıfırlamaz', () => { fresh(); for (let d = 1; d <= 112; d += 28) { S.day = d; for (const sp of SPOT_LIST) { const w = Selector.weights(sp.id, { rodPower: 5, bait: 'basic' }); if (w.list.length !== Object.keys(sp.weights).length || w.list.some(x => !(x.p > 0))) return false; } } return true; });
      T('5a. Mücadele: sürekli çekmek misinayı koparır', () => { fresh(); S.gear.owned.rod.push('light'); S.gear.rod = 'light'; return this.simFight('levrek', () => true) === 'LINE_BREAK'; });
      T('5b. Mücadele: hiç çekmemek balığı kaçırır', () => { fresh(); return this.simFight('levrek', () => false) === 'FISH_ESCAPED'; });
      T('5c. Mücadele: gerilimi 30–75 aralığında tutmak başarı getirir + ansiklopedi', () => { fresh(); S.gear.owned.rod.push('light'); S.gear.rod = 'light'; const r = this.simFight('levrek', () => Fishing.tension < 60); return { ok: r === 'CATCH_RESULT' && S.ency.levrek && S.ency.levrek.caught === 1 && Inv.count(['bag'], 'levrek') === 1, info: r }; });
      T('5d. Rekor: daha büyük boy kişisel rekoru günceller', () => { fresh(); Catch.record('kefal', { cm: 30, kg: 1, t: 0.2 }, false); const r = Catch.record('kefal', { cm: 40, kg: 1.4, t: 0.4 }, false); return r.isRecord && S.stats.records === 1 && S.ency.kefal.maxLen === 40; });
      T('5e. 42 türün sprite\'ı birbirinden farklı', () => { const set = new Set(FISH_LIST.map(f => fishSprite(f.id).toDataURL())); return { ok: set.size === 42, info: set.size + ' benzersiz' }; });
      T('5f. Boy satış fiyatını değiştirmez', () => { fresh(); Inv.add('bag', 'kefal', 2); const r = Market.sell('kefal', 2, ['bag']); return r.income === 2 * FISH.kefal.base_price; });
      T('6a. 11 aynı balık = 10+1 yığın', () => { fresh(); Inv.add('bag', 'sardalya', 11); return S.bag.length === 2 && S.bag[0].q === 10 && S.bag[1].q === 1; });
      T('6b. Kapasite asla aşılmaz; dolu depoda yerleştirme null', () => { fresh(); const n = Inv.add('bag', 'istavrit', 999); const p = Inv.place(['bag'], 'kefal'); return n === 60 && S.bag.length === 6 && p === null && !Inv.validate().length; });
      T('6c. Çanta dolu → manuel av tekne deposuna gider', () => { fresh(); S.boats.owned.push('coastal_skiff'); S.boats.byId.coastal_skiff = { ups: {}, storage: [], color: 'sea_green', name: '' }; S.boats.active = 'coastal_skiff'; Inv.add('bag', 'istavrit', 60); return Inv.place(Inv.manualOrder(), 'kefal') === 'boat:coastal_skiff'; });
      T('7. İlan 100 istiyor, 3 teslim → delivered 3, kalan 97, para +3×fiyat; tekrar satılabilir; süre bitişi cezasız', () => {
        fresh(); S.orders = [{ id: 'oT', customerId: 'bahar', fishId: 'levrek', requestedTotal: 100, delivered: 0, unitPrice: 57, bonus: 0.2, createdDay: 1, expiresAtDayExclusive: 3, future: false, tag: null }];
        Inv.add('bag', 'levrek', 3); const c0 = S.cash; const r = Orders.deliver('oT', 3, ['bag']); const o = S.orders[0];
        const ok1 = r.ok && o.delivered === 3 && Orders.remaining(o) === 97 && S.cash === c0 + 171; Inv.add('bag', 'levrek', 2); const r2 = Orders.deliver('oT', 5, ['bag']); const ok2 = r2.ok && o.delivered === 5;
        const cash = S.cash; S.day = 3; Orders.refresh(3, null); return { ok: ok1 && ok2 && !S.orders.find(x => x.id === 'oT') && S.cash === cash, info: 'teslim ' + o.delivered };
      });
      T('7b. İlan süresi: gün 10\'da 2 günlük ilan gün 10–11 aktif, gün 12 düşer', () => { fresh(); S.day = 10; S.orders = [{ id: 'oX', customerId: 'nihat', fishId: 'kefal', requestedTotal: 5, delivered: 0, unitPrice: 24, bonus: .1, createdDay: 10, expiresAtDayExclusive: 12, tag: null }]; const a10 = Orders.active().length; S.day = 11; const a11 = Orders.active().length; S.day = 12; const a12 = Orders.active().filter(o => o.id === 'oX').length; return a10 === 1 && a11 === 1 && a12 === 0; });
      T('8a. Favori tür toplu satışta korunur', () => { fresh(); Inv.add('bag', 'sardalya', 5); Inv.add('bag', 'kefal', 2); S.favorites.sardalya = true; Market.sellAll(['bag'], false); return Inv.count(['bag'], 'sardalya') === 5 && Inv.count(['bag'], 'kefal') === 0; });
      T('8b. Halde daha iyi ilan uyarısı', () => { fresh(); S.orders = [{ id: 'oY', customerId: 'bahar', fishId: 'kefal', requestedTotal: 10, delivered: 0, unitPrice: 26, bonus: .2, createdDay: 1, expiresAtDayExclusive: 3, tag: null }]; const b = Market.betterOffer('kefal'); return !!b && b.unitPrice === 26 && !Market.betterOffer('sardalya'); });
      T('9a. 4 tekne fiyatı 105.200, gövde yükseltmeleri 84.810, ana yatırım 277.650', () => { const b = sum(BOATS.map(x => x.price)); const u = sum(BOATS.map(x => sum(Object.values(x.upgrades)))); const rods = sum(RODS.map(r => r.price)), lmh = sum(LINES.map(r => r.price)) + sum(REELS.map(r => r.price)) + sum(HOOKS.map(r => r.price)), bag = sum(INVC.bag.map(x => x[2])), aut = sum(AUTOS.map(a => a.price)), ch = sum(INVC.home_chest.map(x => x[2])); const tot = b + u + rods + lmh + bag + aut + ch; return { ok: b === 105200 && u === 84810 && tot === 277650, info: [b, u, tot].join(' / ') }; });
      T('9b. Satın alınan tekneler, tüm basamaklar ve bölge kilitleri işlevsel', () => {
        fresh(); S.cash = 1e7; const steps = []; Boats.buy('coastal_skiff'); steps.push(Boats.reach('yesil_koy', 'coastal_skiff').ok && !Boats.reach('kayalik_adalar', 'coastal_skiff').ok);
        Boats.buyUpgrade('coastal_skiff', 'storage_12'); steps.push(!S.boats.byId.coastal_skiff.ups.storage_12); Boats.buyUpgrade('coastal_skiff', 'storage_9'); Boats.buyUpgrade('coastal_skiff', 'storage_12'); steps.push(Boats.stats('coastal_skiff').storage === 12);
        Boats.buyUpgrade('coastal_skiff', 'motor_II'); steps.push(Boats.reach('kayalik_adalar', 'coastal_skiff').ok && !Boats.reach('serin_akintilar', 'coastal_skiff').ok);
        Boats.buy('motorboat'); steps.push(Boats.reach('serin_akintilar', 'motorboat').ok && !Boats.reach('sisli_kuzey', 'motorboat').ok); Boats.buyUpgrade('motorboat', 'motor_III'); Boats.buyUpgrade('motorboat', 'navigation_I'); steps.push(Boats.reach('sisli_kuzey', 'motorboat').ok);
        Boats.buy('cabin'); steps.push(Boats.reach('sisli_kuzey', 'cabin').ok && !Boats.reach('gunes_adalari', 'cabin').ok); Boats.buyUpgrade('cabin', 'motor_IV'); steps.push(Boats.reach('gunes_adalari', 'cabin').ok);
        Boats.buy('offshore'); steps.push(Boats.reach('gunes_adalari', 'offshore').ok && !Boats.reach('derin_mavi', 'offshore').ok); Boats.buyUpgrade('offshore', 'motor_V'); steps.push(!Boats.reach('derin_mavi', 'offshore').ok); Boats.buyUpgrade('offshore', 'navigation_II'); steps.push(Boats.reach('derin_mavi', 'offshore').ok);
        for (const b of BOATS) for (const u of BOAT_INFO[b.id].ups) { Boats.buyUpgrade(b.id, u.key); }
        steps.push(BOATS.every(b => Boats.stats(b.id).storage === b.max_storage)); steps.push(Object.keys(S.world.unlocked).length === 7); steps.push(REGIONS.every(r => r.spot_ids.length === 3 && r.spot_ids.every(s => SPOTS[s] && SPOTS[s].region_id === r.id)));
        return { ok: steps.every(Boolean), info: steps.map(x => x ? 1 : 0).join('') };
      });
      T('9c. Yer değiştirme tür havuzunu gerçekten değiştirir', () => { fresh(); const a = Selector.weights('koy_giris', { rodPower: 5 }).list.map(x => x.id + x.p.toFixed(3)).join(); const b = Selector.weights('koy_derin', { rodPower: 5 }).list.map(x => x.id + x.p.toFixed(3)).join(); return a !== b; });
      T('10. Otomatik cihaz aktarımı kopyalanmaz; global yükseltmeler', () => {
        fresh(); S.cash = 1e6; Boats.buy('coastal_skiff'); Boats.buy('motorboat'); Auto.buy('auto1'); const m1 = S.auto.devices.auto1.boat === 'coastal_skiff';
        Auto.mount('auto1', 'motorboat'); const m2 = Auto.mountedOn('coastal_skiff').length === 0 && Auto.mountedOn('motorboat').length === 1;
        const e0 = Auto.every(), s0 = Auto.success(); Auto.buy('auto2'); const e1 = Auto.every(); Auto.buy('auto_reel'); const e2 = Auto.every(), s2 = Auto.success(); Auto.buy('sensing'); const s3 = Auto.success();
        Auto.mount('auto2', 'coastal_skiff'); const r = Auto.mount('auto3', 'coastal_skiff'); const full = !r.ok;
        return { ok: m1 && m2 && e0 === 4 && s0 === 0.55 && e1 === 4 && e2 === 3 && s2 === 0.65 && s3 === 0.75 && full, info: [m1, m2, e0, s0, e2, s2, s3].join(',') };
      });
      T('11a. Otomatik günlük ortak sınır 6; tekne değişimi sıfırlamaz', () => {
        fresh(); S.cash = 1e6; Boats.buy('coastal_skiff'); Auto.buy('auto1'); Auto.buy('auto_reel'); Auto.buy('sensing'); S.baitStock.worm = 500; S.gear.bait = 'worm'; S.bagLevel = 4;
        for (let i = 0; i < 200; i++) Auto.onCastComplete('liman_iskele', 'boat');
        const c1 = S.auto.dailyCaught; Boats.buy('motorboat'); S.boats.active = 'motorboat'; Auto.mount('auto1', 'motorboat'); for (let i = 0; i < 50; i++) Auto.onCastComplete('liman_iskele', 'boat');
        const pier = (() => { const b = S.auto.total; Auto.onCastComplete('liman_iskele', 'pier'); return S.auto.total === b; })();
        return { ok: c1 === 6 && S.auto.dailyCaught === 6 && S.auto.total === 6 && pier, info: c1 + '/' + S.auto.dailyCaught };
      });
      T('11b. Güç 5 asla otomatik; güç 4 yalnızca Açık Deniz + Derin Deniz Dişlisi', () => {
        fresh(); S.auto.globals.auto_reel = true; const cab = Selector.weights('derin_cukur', { auto: true, maxPower: Auto.maxPower('cabin') }).list.length; S.auto.globals.deep_sea_gear = true;
        const cab2 = Auto.maxPower('cabin'); const off = Selector.weights('derin_cukur', { auto: true, maxPower: Auto.maxPower('offshore') }).list; return { ok: cab === 0 && cab2 === 3 && off.length === 3 && off.every(x => FISH[x.id].power === 4), info: off.map(x => x.id).join(',') };
      });
      T('11c. Ücretsiz temel yem otomatikte kullanılmaz; depo doluysa yem harcanmaz', () => {
        fresh(); S.cash = 1e6; Boats.buy('coastal_skiff'); Auto.buy('auto1'); S.gear.bait = 'basic'; for (let i = 0; i < 8; i++) Auto.onCastComplete('liman_iskele', 'boat'); const noBait = S.auto.attempts === 0 && S.auto.devices.auto1.paused === 'bait';
        S.baitStock.worm = 5; Inv.add('bag', 'istavrit', 60); Inv.add('boat:coastal_skiff', 'istavrit', 60); for (let i = 0; i < 8; i++) Auto.onCastComplete('liman_iskele', 'boat'); return { ok: noBait && S.baitStock.worm === 5 && S.auto.devices.auto1.paused === 'full', info: S.auto.devices.auto1.paused };
      });
      T('12. Gün geçişi: enerji 100, hava/ilan/olay güncellenir; 28 gün mevsim, 112 gün yıl', () => {
        fresh(); S.energy = 4; S.auto.dailyCaught = 6; World.sleep(); const a = S.day === 2 && S.energy === 100 && S.auto.dailyCaught === 0 && Object.keys(S.world.weather).length === 7 && Orders.active().filter(o => !o.tag).length === Orders.slots();
        S.day = 28; World.sleep(); const b = World.season() === 'summer' && World.seasonDay() === 1; S.day = 112; World.sleep(); const c = S.day === 113 && World.season() === 'spring' && World.year() === 2;
        let ev = 0; for (let d = 200; d < 700; d++) { if (World.rollEvent(d)) ev++; } return { ok: a && b && c && ev > 150 && ev < 250, info: 'olay oranı ' + (ev / 500).toFixed(2) };
      });
      T('12b. Hava deterministik: aynı gün tekrar hesap aynı', () => { fresh(); const w1 = World.weatherFor('yesil_koy', 5), w2 = World.weatherFor('yesil_koy', 5); return w1 === w2; });
      T('13a. 36 başarımın her biri koşul izler ve açılabilir', () => {
        fresh(); const miss = ACHS.filter(a => !ACH_DEF[a.id]); if (miss.length) return { ok: false, info: miss.map(a => a.id).join() };
        Object.assign(S.stats, { manualCatches: 1000, autoCatches: 0, fishSoldMarket: 1, ordersDelivered: 500, daysCompleted: 100, gearBought: 1, power4: 1, power5: 1, trips: 1, totalSales: 100000, records: 10 });
        REGIONS.forEach(r => S.stats.regionsVisited[r.id] = true); SPOT_LIST.forEach(s => S.stats.spotsVisited[s.id] = true); SEASONS.forEach(s => S.world.seasonsSeen[s] = true); CUSTOMERS.forEach(c => { S.stats.buyers[c.id] = true; S.customers[c.id] = { delivered: 400 }; });
        FISH_LIST.forEach(f => S.ency[f.id] = { caught: 1, maxLen: 1, maxKg: 1 }); BOATS.forEach(b => { S.boats.owned.push(b.id); S.boats.byId[b.id] = { ups: {}, storage: [], color: 'sea_green', name: '' }; }); S.boats.byId.offshore.ups.motor_V = true; S.auto.total = 100;
        S.home.decor = { wall: 'tablo_deniz', shelf: 'fener_maket', table: 'cicek', window: null, board: null };
        Ach.check(); const n = Object.keys(S.ach).length; return { ok: n === 36, info: n + '/36' };
      });
      T('13b. 5 NPC × 15 = 75 diyalog; tüm tetikleyiciler tanımlı', () => { let n = 0, bad = []; for (const npc in CFG.npc_dialogues) for (const d of CFG.npc_dialogues[npc]) { n++; if (!NPC_TRIG[d.trigger] && !CFG.weather.types.includes(d.trigger) && !d.trigger.startsWith('day_generic') && d.trigger !== 'generic_after') bad.push(d.trigger); } fresh(); const l = NPCDialog.line('zeynep'); return { ok: n === 75 && !bad.length && Object.keys(CFG.npc_dialogues).length === 5 && l.trigger === 'first_meet', info: n + ' ' + bad.join() }; });
      T('13c. 7 müşterinin ilanı üretilebilir; en fazla 1 gelecek bölge ilanı', () => { fresh(); REGIONS.forEach(r => S.world.unlocked[r.id] = true); const ok = CUSTOMERS.every(c => { const o = Orders.gen(S.day, { customerId: c.id }); return o.customerId === c.id && o.unitPrice >= Math.floor(FISH[o.fishId].base_price * 1.1) && o.bonus <= 0.4; }); fresh(); let maxF = 0; for (let d = 1; d < 60; d++) { S.day = d; Orders.refresh(d, null); maxF = Math.max(maxF, S.orders.filter(o => o.future).length); } return { ok: ok && maxF <= 1, info: 'gelecek ilan ' + maxF }; });
      T('14. Kayıt paketle/aç: para, balık, gün, kıyafet, tekne, ilan, ilişki, rekor, sayaç korunur; bozuk kayıt reddedilir', () => {
        fresh(); S.cash = 1234; S.day = 7; S.player.outfit = 'ekose'; Inv.add('bag', 'kefal', 3); S.boats.owned.push('coastal_skiff'); S.boats.byId.coastal_skiff = { ups: { motor_II: true }, storage: [{ f: 'levrek', q: 2 }], color: 'navy', name: 'MARTI' }; S.boats.active = 'coastal_skiff'; S.customers.bahar = { delivered: 60 }; S.ency.kefal = { caught: 3, maxLen: 44, maxKg: 1.2 }; S.auto.devices.auto1 = { boat: 'coastal_skiff', counter: 2 };
        const j = Save.pack(S); const u = Save.unpack(j); const st = u.state; const ok = u.ok && st.cash === 1234 && st.day === 7 && st.player.outfit === 'ekose' && st.bag[0].q === 3 && st.boats.byId.coastal_skiff.name === 'MARTI' && st.customers.bahar.delivered === 60 && st.ency.kefal.maxLen === 44 && st.auto.devices.auto1.counter === 2 && st.orders.length === S.orders.length;
        const bad = Save.unpack(j.replace('"cash":1234', '"cash":99999')); const bad2 = Save.unpack('{oops'); return { ok: ok && !bad.ok && !bad2.ok, info: bad.msg };
      });
      T('14b. Atomik işlem: çift dokunmada çifte para yok', () => { fresh(); Inv.add('bag', 'kefal', 1); const c = S.cash; Market.sell('kefal', 1, ['bag']); Market.sell('kefal', 1, ['bag']); return S.cash === c + FISH.kefal.base_price; });
      T('15. Ölçekleme: 640×360 oranı korunur', () => { const fr = $('frame'); const w = parseFloat(fr.style.width), h = parseFloat(fr.style.height); return { ok: Math.abs(w / h - 16 / 9) < 0.02, info: w + '×' + h }; });
      T('17. Dış kaynak yok (ağ isteği / uzak URL kullanılmıyor)', () => { const re = new RegExp(['\\bfet' + 'ch\\(', 'XMLHttp' + 'Request', 'htt' + 'ps?:/' + '/', 'Web' + 'Socket', 'import' + 'Scripts'].join('|')); const src = [...document.scripts].map(s => s.textContent).join('\n') + [...document.styleSheets].map(s => { try { return [...s.cssRules].map(r => r.cssText).join(''); } catch (e) { return ''; } }).join(''); return { ok: !re.test(src.replace(/url\(data:[^)]*\)/g, '')) && ![...document.querySelectorAll('[src]')].some(e => !/^(data:|blob:|$)/.test(e.getAttribute('src'))), info: src.length + ' karakter tarandı' }; });
    } finally {
      S = real; Save.suspended = realSusp; this.silent = false; Fishing.autoQ = realQ; Bus.take(); Tx.busy = false;
      if (realCtx) { Fishing.ctx = realCtx; Fishing.phase = realPhase === 'READY' ? 'READY' : 'READY'; } else Fishing.detach();
    }
    return out;
  },
  simFight(fid, holdFn) {
    const ctx = { mode: 'pier', surf: 236, minCast: 40, maxCast: 300, spotId: () => 'koy_derin', tip: () => [200, 200], moving: () => false };
    Fishing.attach(ctx); S.pendingCast = { id: 1, spotId: 'koy_derin', mode: 'pier', band: 'far', bait: 'basic', fish: fid, size: { cm: 40, kg: 1, t: 0.3, cls: 'normal' }, bite: true, wait: 2 };
    Fishing.bob = { x0: 200, y0: 200, x: 400, y: 236, tx: 400, ty: 236, dip: 0 }; Fishing.phase = 'BITE_WINDOW'; Fishing.hook();
    Fishing.surge.next = 1e9; let n = 0;
    while ((Fishing.phase === 'REELING' || Fishing.phase === 'QUICK_PULL') && n++ < 20000) { Fishing.holding = holdFn(); Fishing.update(1 / 60); }
    const ph = Fishing.phase; Fishing.detach(); return ph === 'OUTCOME' ? Fishing.lastOutcome : ph;
  }
};
boot();
