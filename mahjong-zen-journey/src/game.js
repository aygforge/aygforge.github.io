/*
 * Mahjong: Zen Journey — GameStateManager + UIManager.
 * Screen flow (splash → menu → world map → level select → game), modal
 * dialogs, tutorial coach marks, fullscreen control, timers and autosave.
 */
(function (root) {
  'use strict';
  const Core = root.MJCore, P = root.MJProgress, A = root.MJAssets, R = root.MJRender;
  const LEVELS = root.MJ_LEVELS;
  const DEBUG = /[?&]debug=1(&|$)/.test(root.location.search);
  const VERSION = '1.0.0';

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const icon = (n) => A.ICONS[n] || '';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function fillIcons(scope) { $$('[data-icon]', scope).forEach((el) => { if (!el.firstElementChild) el.innerHTML = icon(el.dataset.icon); }); }
  function fmtTime(ms) {
    const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return h ? `${h} sa ${String(m).padStart(2, '0')} dk` : `${m}:${String(r).padStart(2, '0')}`;
  }
  const levelCache = new Map();
  function getLevel(n) {
    let lv = levelCache.get(n);
    if (!lv) { lv = Core.decodeLevel(LEVELS[n - 1]); levelCache.set(n, lv); }
    return lv;
  }
  const isIOS = () => /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // ------------------------------------------------------------ fullscreen
  class FullscreenManager {
    constructor(app) {
      this.app = app;
      this.el = document.documentElement;
      this.failed = false;
      ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => this._changed()));
      ['fullscreenerror', 'webkitfullscreenerror'].forEach((ev) => document.addEventListener(ev, () => this._fail()));
      this.update();
    }
    get supported() {
      const d = document;
      return !!((d.fullscreenEnabled || d.webkitFullscreenEnabled) && (this.el.requestFullscreen || this.el.webkitRequestFullscreen));
    }
    get active() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
    get inIframe() { try { return root.self !== root.top; } catch (e) { return true; } }
    // Must run synchronously inside the click handler (user activation).
    toggle() {
      if (this.active) {
        try {
          const p = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen && document.webkitExitFullscreen();
          if (p && p.catch) p.catch(() => {});
        } catch (e) { /* already exited */ }
        return;
      }
      if (!this.supported || this.failed) { this.app.ui.fullscreenHelp(); return; }
      let p;
      try { p = this.el.requestFullscreen ? this.el.requestFullscreen({ navigationUI: 'hide' }) : this.el.webkitRequestFullscreen(); }
      catch (e) { this._fail(); return; }
      if (p && p.then) p.then(() => this._lockPortrait()).catch(() => this._fail());
    }
    _lockPortrait() {
      try { const o = root.screen && root.screen.orientation; if (o && o.lock) o.lock('portrait').catch(() => {}); } catch (e) { /* unsupported */ }
    }
    _fail() {
      if (this.active) return;
      this.failed = true; // never retry a request the browser has refused
      this.update();
      this.app.ui.fullscreenHelp(true);
    }
    _changed() {
      this.update();
      if (this.active) this._lockPortrait();
      this.app.onViewportChange();
      setTimeout(() => this.app.onViewportChange(), 300);
    }
    update() {
      const a = this.active;
      $$('[data-fs]').forEach((b) => {
        b.innerHTML = icon(a ? 'fsExit' : 'fsEnter');
        b.setAttribute('aria-label', a ? 'Tam ekrandan çık' : 'Tam ekrana geç');
        b.setAttribute('aria-pressed', a ? 'true' : 'false');
        b.dataset.state = a ? 'on' : 'off';
      });
    }
  }

  // ------------------------------------------------------------ UI manager
  class UIManager {
    constructor(app) { this.app = app; this.modal = null; this.modalStack = []; }
    toast(text, opts) {
      const box = $('#toasts');
      const el = document.createElement('div');
      el.className = 'toast' + (opts && opts.cls ? ' ' + opts.cls : '');
      el.innerHTML = (opts && opts.icon ? `<span class="t-ico">${icon(opts.icon)}</span>` : '') + `<span>${esc(text)}</span>`;
      box.appendChild(el);
      while (box.children.length > 3) box.firstChild.remove();
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, (opts && opts.ms) || 2400);
    }
    achievementToasts(list) {
      list.forEach((a, i) => setTimeout(() => {
        this.toast('Başarım: ' + a.name, { cls: 'ach', icon: 'trophy', ms: 3200 });
        this.app.audio.play('achievement');
      }, 400 + i * 900));
    }
    // Opens a modal. content: HTML string. Returns the modal element.
    open(html, opts) {
      opts = opts || {};
      this.closeNow();
      const back = document.createElement('div');
      back.className = 'modal-back';
      back.innerHTML = `<div class="modal ${opts.cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
      fillIcons(back);
      $('#modal-root').appendChild(back);
      if (opts.dismissable !== false) back.addEventListener('pointerdown', (e) => { if (e.target === back) this.close(); });
      this.modal = { back, opts };
      this.app.onModalChange();
      back.addEventListener('click', (e) => {
        const b = e.target.closest('[data-m]');
        if (!b || !opts.actions) return;
        const fn = opts.actions[b.dataset.m];
        if (fn) { this.app.audio.play('button'); fn(b, e); }
      });
      const first = back.querySelector('.btn.primary') || back.querySelector('button');
      if (first && !('ontouchstart' in root)) setTimeout(() => { try { first.focus({ preventScroll: true }); } catch (e) { /* noop */ } }, 50);
      return back.firstElementChild;
    }
    close() {
      if (!this.modal) return;
      const { back, opts } = this.modal;
      this.modal = null;
      back.classList.add('closing');
      setTimeout(() => back.remove(), 180);
      this.app.onModalChange();
      if (opts.onClose) opts.onClose();
    }
    closeNow() {
      if (!this.modal) return;
      this.modal.back.remove();
      this.modal = null;
      this.app.onModalChange();
    }
    get isOpen() { return !!this.modal; }
    confirm(title, text, okLabel, onOk, opts) {
      this.open(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="actions row"><button class="btn" data-m="no">Vazgeç</button><button class="btn ${opts && opts.danger ? 'danger' : 'primary'}" data-m="yes">${esc(okLabel)}</button></div>`, {
        actions: { no: () => { this.close(); if (opts && opts.onCancel) opts.onCancel(); }, yes: () => { this.closeNow(); onOk(); } }
      });
    }
    fullscreenHelp(afterFailure) {
      const app = this.app;
      const iframe = app.fs.inIframe;
      let text;
      if (isIOS() && !app.fs.supported) text = 'iPhone\'daki Safari, web sayfalarının tarayıcı çubuklarını gizlemesine izin vermiyor. Oyun zaten kullanılabilir ekranın tamamını dolduruyor. En geniş alan için Paylaş → Ana Ekrana Ekle\'yi kullanın ya da oyunu kendi sekmesinde açın.';
      else if (iframe) text = 'Bu oyunu barındıran sayfa tam ekrana izin vermiyor. Oyun kendisine verilen alanın tamamını kullanıyor. Bunun yerine oyunu ayrı bir tarayıcı sekmesinde açabilirsiniz.';
      else text = afterFailure ? 'Tarayıcınız tam ekran isteğini reddetti. Oyun görünen ekranın tamamını kullanmaya devam ediyor.' : 'Bu tarayıcı tam ekran modunu desteklemiyor. Oyun görünen ekranın tamamını kullanmaya devam ediyor.';
      this.open(`<h2>Tam ekran kullanılamıyor</h2><p>${esc(text)}</p><div class="actions">${iframe ? '<button class="btn primary" data-m="tab"><span data-icon="external"></span>Yeni sekmede aç</button>' : ''}<button class="btn" data-m="ok">Tamam</button></div>`, {
        actions: { ok: () => this.close(), tab: () => { root.open(root.location.href, '_blank', 'noopener'); this.close(); } }
      });
    }
  }

  // ------------------------------------------------------------ app
  class App {
    constructor() {
      this.save = new root.MJSave.SaveManager();
      this.audio = new root.MJAudio.AudioManager();
      this.ui = new UIManager(this);
      this.screen = 'splash';
      this.session = null;
      this.levelNo = 1;
      this.world = -1;
      this.mapWorld = 0;
      this.introOpen = false;
      this.lastTick = 0;
      this.coachTimer = 0;
      this.checkTimer = 0;
      this.winTimer = 0;
      this.autoplay = null;
      this.debug = DEBUG;
      this.version = VERSION;
    }

    async boot() {
      fillIcons(document);
      this.paintLogos();
      this.fs = new FullscreenManager(this);
      const minSplash = new Promise((r) => setTimeout(r, 1100));
      this.setWorld(0, true);
      await this.save.load();
      this.applySettings();
      this.renderer = new R.BoardRenderer($('#board'));
      this.renderer.effects = this.settings.effects;
      this.renderer.onZoomChange = (z) => { $('#zoom-reset').hidden = z <= 1.01; };
      this.input = new R.InputManager($('#board'), this.renderer, (i) => this.onTileTap(i));
      this.ambient = new R.Ambient($('#ambient'));
      this.ambient.setEnabled(this.settings.effects);
      this.celebration = new R.Celebration($('#celebrate'));
      this.bindEvents();
      this.onViewportChange();
      const ro = root.ResizeObserver ? new root.ResizeObserver(() => this.onViewportChange()) : null;
      if (ro) { ro.observe($('#board-wrap')); ro.observe($('#app')); }
      setInterval(() => this.tick(), 500);
      await minSplash;
      $('#app').classList.remove('booting');
      this.setWorld(Core.levelMeta(P.continueLevel(this.save.data)).world);
      this.showMenu();
      if (!this.save.persistent) setTimeout(() => this.ui.toast('Burada depolama kullanılamıyor — ilerlemeni korumak için kaydını dışa aktar.', { ms: 4200 }), 600);
      if (this.debug && root.MJDebug) root.MJDebug.install(this);
    }
    get settings() { return this.save.data.settings; }
    applySettings() {
      this.audio.applySettings(this.settings);
      if (this.ambient) this.ambient.setEnabled(this.settings.effects);
      if (this.renderer) this.renderer.effects = this.settings.effects;
    }
    paintLogos() {
      const t1 = A.tileDataURL(31, 64), t2 = A.tileDataURL(0, 64);
      const enso = '<svg class="enso" viewBox="0 0 140 120"><path d="M70 10 C 112 10 128 46 122 74 C 115 104 82 116 56 110 C 26 103 10 78 16 50 C 20 32 34 18 52 13" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="7" stroke-linecap="round"/><path d="M52 13 C 46 15 42 18 38 22" stroke="rgba(255,255,255,0.5)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
      $$('[data-logo-mark]').forEach((el) => { el.innerHTML = enso + `<img alt="" src="${t1}"><img alt="" src="${t2}">`; });
    }

    // ---------------------------------------------------------- world theme
    setWorld(w, instant) {
      if (w === this.world) return;
      this.world = w;
      const W = A.WORLDS[w];
      const url = A.worldBackgroundURL(w);
      const bg = $('#bg'), nx = $('#bg-next');
      if (instant || !bg.style.backgroundImage) { bg.style.backgroundImage = url; }
      else {
        nx.style.backgroundImage = url;
        nx.classList.add('show');
        clearTimeout(this._bgT);
        this._bgT = setTimeout(() => { bg.style.backgroundImage = url; nx.classList.remove('show'); }, 950);
      }
      $('#stage-bg').style.backgroundImage = url;
      const app = $('#app');
      app.style.setProperty('--accent', W.ui);
      app.style.setProperty('--accent-2', W.accent);
      app.classList.toggle('dark', !!W.dark);
      document.querySelector('meta[name=theme-color]').setAttribute('content', W.hill[2]);
      if (this.ambient) this.ambient.setType(W.particles);
      this.audio.setWorld(W.key);
    }

    // ---------------------------------------------------------- events
    bindEvents() {
      document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b || b.disabled) return;
        if (this.ui.isOpen && !b.closest('.modal')) return;
        this.action(b.dataset.act, b);
      });
      const unlock = () => this.audio.unlock();
      document.addEventListener('pointerdown', unlock, true);
      document.addEventListener('keydown', (e) => { unlock(); this.onKey(e); });
      document.addEventListener('visibilitychange', () => this.onVisibility());
      root.addEventListener('pagehide', () => { this.persistCurrent(); this.save.flush(); });
      root.addEventListener('resize', () => this.onViewportChange());
      root.addEventListener('orientationchange', () => setTimeout(() => this.onViewportChange(), 200));
      if (root.visualViewport) root.visualViewport.addEventListener('resize', () => this.onViewportChange());
      // overflow:hidden containers can still be scrolled by focus / scrollIntoView; keep them pinned
      for (const el of [document.getElementById('stage'), document.getElementById('app'), document.getElementById('modal-root'), document.body]) {
        el.addEventListener('scroll', () => { if (el.scrollTop || el.scrollLeft) { el.scrollTop = 0; el.scrollLeft = 0; } });
      }
      root.addEventListener('scroll', () => { if (root.scrollX || root.scrollY) root.scrollTo(0, 0); });
      $$('.screen').forEach((el) => el.addEventListener('scroll', () => { el.scrollTop = 0; el.scrollLeft = 0; }));
      this.rotateMQ = root.matchMedia('(orientation: landscape) and (max-height: 540px) and (hover: none)');
      // block browser gestures that fight the game (iOS pinch-zoom of the page, double-tap zoom)
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      document.addEventListener('dblclick', (e) => e.preventDefault());
      document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll, .modal, textarea')) e.preventDefault(); }, { passive: false });
    }
    onKey(e) {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === 'Escape') {
        if (this.ui.isOpen) { if (this.ui.modal.opts.dismissable !== false) this.ui.close(); }
        else if (this.screen === 'game') this.action('pause');
        else if (this.screen === 'levels') this.action('map');
        else if (this.screen === 'map') this.action('home');
        return;
      }
      if (this.screen !== 'game' || this.ui.isOpen) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); this.action('undo'); }
      else if (k === 'u') this.action('undo');
      else if (k === 'h') this.action('hint');
      else if (k === 's') this.action('shuffle');
      else if (k === 'p') this.action('pause');
      else if (k === 'f') this.action('fullscreen');
    }
    onVisibility() {
      const vis = !document.hidden;
      this.audio.setVisible(vis);
      if (this.ambient) this.ambient.setVisible(vis);
      if (this.renderer) this.renderer.setPaused(!vis);
      this.lastTick = performance.now();
      if (!vis) { this.persistCurrent(); this.save.flush(); }
    }
    onViewportChange() {
      if (!this.renderer) return;
      const wrap = $('#board-wrap');
      const r = wrap.getBoundingClientRect();
      if (r.width > 2 && r.height > 2 && (r.width !== this._bw || r.height !== this._bh)) {
        this._bw = r.width; this._bh = r.height;
        this.renderer.resize(r.width, r.height);
      }
      const ar = $('#app').getBoundingClientRect();
      if (this.ambient && (ar.width !== this._aw || ar.height !== this._ah)) {
        this._aw = ar.width; this._ah = ar.height;
        this.ambient.resize(ar.width, ar.height);
        this.ambient.setType(A.WORLDS[this.world].particles);
      }
    }
    onModalChange() {
      if (this.input) this.input.enabled = !this.ui.isOpen && !this.introOpen;
    }
    running() {
      return this.screen === 'game' && this.session && !this.session.won && !this.ui.isOpen && !this.introOpen &&
        !document.hidden && !(this.rotateMQ && this.rotateMQ.matches);
    }
    tick() {
      const t = performance.now();
      const dt = Math.min(2000, t - (this.lastTick || t));
      this.lastTick = t;
      if (this.running()) {
        this.session.elapsed += dt;
        this.save.data.stats.playTimeMs += dt;
        if ((this._tickN = (this._tickN || 0) + 1) % 10 === 0) this.persistCurrent();
      }
    }

    action(act, el) {
      if (act !== 'fullscreen') this.audio.play('button');
      switch (act) {
        case 'fullscreen': return this.fs.toggle();
        case 'continue': return this.startLevel(P.continueLevel(this.save.data), { resume: true });
        case 'map': return this.showMap();
        case 'home': return this.showMenu();
        case 'settings': return this.openSettings();
        case 'stats': return this.openStats();
        case 'achievements': return this.openAchievements();
        case 'leave': this.persistCurrent(); this.save.flush(); return this.showLevels(Core.levelMeta(this.levelNo).world);
        case 'hint': return this.doHint();
        case 'shuffle': return this.doShuffle();
        case 'undo': return this.doUndo();
        case 'restart': return this.doRestart();
        case 'pause': return this.openPause();
        case 'zoomreset': return this.renderer.resetZoom();
        case 'world': return this.showLevels(+el.dataset.world);
        case 'level': return this.startLevel(+el.dataset.level, { resume: true });
      }
    }

    // ---------------------------------------------------------- screens
    show(name) {
      this.screen = name;
      $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'scr-' + name));
      if (name !== 'game') { this.clearCoach(); this.stopAutoplay(); }
      this.onModalChange();
    }
    showMenu() {
      const d = this.save.data;
      const n = P.continueLevel(d);
      const m = Core.levelMeta(n);
      $('#menu-level').textContent = n;
      $('#menu-world').textContent = m.worldName;
      $('#menu-stars').textContent = P.totalStars(d);
      $('#menu-bar').style.width = (P.levelsCleared(d) / Core.LEVEL_COUNT * 100).toFixed(1) + '%';
      const started = P.levelsCleared(d) > 0 || d.current;
      $('#menu-play-label').textContent = started ? (d.current ? 'Devam Et' : n + '. Bölümü Oyna') : 'Oyna';
      this.setWorld(m.world);
      this.show('menu');
    }
    showMap() {
      const d = this.save.data;
      const list = $('#world-list');
      const cur = Core.levelMeta(P.continueLevel(d)).world;
      let html = '';
      for (let w = 0; w < Core.WORLD_COUNT; w++) {
        const W = A.WORLDS[w], ws = P.worldStats(d, w);
        const cls = ['world-card', ws.unlocked ? '' : 'locked', ws.complete ? 'complete' : '', w === cur ? 'current' : ''].join(' ');
        html += `<button class="${cls}" data-act="world" data-world="${w}" aria-label="${esc(W.name)}${ws.unlocked ? '' : ' (kilitli)'}">
          <div class="world-thumb" style='background-image:${A.worldBackgroundURL(w)}'><span class="wn">${w + 1}</span></div>
          <div class="world-info"><h3>${esc(W.name)}</h3><p>${ws.unlocked ? esc(W.sub) : 'Açmak için ' + esc(A.WORLDS[Math.max(0, w - 1)].name) + ' dünyasını tamamla'}</p>
          <div class="world-meta"><span>${ws.cleared}/25 bölüm</span><span><span class="star-ico">${icon('star')}</span>${ws.stars}/75</span><span class="muted">Bölüm ${w * 25 + 1}–${w * 25 + 25}</span></div></div>
          ${ws.unlocked ? '' : `<span class="world-lock">${icon('lock')}</span>`}
        </button>`;
      }
      list.innerHTML = html;
      this.setWorld(cur);
      this.show('map');
      const el = list.children[cur];
      if (el) requestAnimationFrame(() => { list.parentElement === null || (list.scrollTop = Math.max(0, el.offsetTop - 80)); });
    }
    showLevels(w) {
      const d = this.save.data;
      if (!P.worldUnlocked(d, w)) {
        this.ui.toast(A.WORLDS[w].name + ' dünyasını açmak için ' + A.WORLDS[w - 1].name + ' dünyasını tamamla.', { icon: 'lock' });
        return;
      }
      this.mapWorld = w;
      this.setWorld(w);
      const ws = P.worldStats(d, w);
      $('#levels-title').textContent = A.WORLDS[w].name;
      $('#levels-sub').textContent = `${w + 1}. Dünya · ${ws.cleared}/25 tamamlandı · ${ws.stars}/75 ★`;
      let html = '';
      const frontier = d.progress.unlocked;
      for (let i = 0; i < Core.WORLD_SIZE; i++) {
        const n = w * Core.WORLD_SIZE + i + 1;
        const unlocked = P.isUnlocked(d, n);
        const st = d.progress.stars[n - 1];
        const fin = i === Core.WORLD_SIZE - 1;
        const fam = Core.FAMILIES[getLevel(n).family];
        const stars = [1, 2, 3].map((k) => `<span class="${st >= k ? 'on' : ''}">${icon('star')}</span>`).join('');
        const cls = ['level-btn', unlocked ? '' : 'locked', fin ? 'final' : '', unlocked && n === frontier && !st ? 'next' : ''].join(' ');
        html += `<button class="${cls}" data-act="level" data-level="${n}" ${unlocked ? '' : 'disabled'} aria-label="Bölüm ${n}${unlocked ? ', ' + st + ' yıldız' : ', kilitli'}">` +
          (fin ? `<div><div class="ft">FİNAL MÜCADELESİ</div><b>${n}</b></div><div><div class="lstars">${unlocked ? stars : ''}</div><div class="fam">${esc(fam)}</div></div>${unlocked ? '' : `<span class="lk">${icon('lock')}</span>`}`
            : `<b>${n}</b>${unlocked ? `<div class="lstars">${stars}</div><div class="fam">${esc(fam)}</div>` : `<span class="lk">${icon('lock')}</span>`}`) + '</button>';
      }
      $('#level-grid').innerHTML = html;
      this.show('levels');
    }

    // ---------------------------------------------------------- level flow
    startLevel(n, opts) {
      opts = opts || {};
      const d = this.save.data;
      if (!(n >= 1 && n <= Core.LEVEL_COUNT)) return;
      if (!P.isUnlocked(d, n)) { this.ui.toast(n + '. bölüm kilitli.', { icon: 'lock' }); return; }
      const meta = Core.levelMeta(n);
      if (!opts.skipIntro && !d.seen.worlds.includes(meta.world)) {
        d.seen.worlds.push(meta.world);
        this.save.save();
        this.showWorldIntro(meta.world, () => this.startLevel(n, Object.assign({}, opts, { skipIntro: true })));
        return;
      }
      clearTimeout(this.winTimer);
      this.ui.closeNow();
      this.celebration.stop();
      // keep an unfinished game of another level? Only one current puzzle is stored.
      if (this.session && this.session.levelNo !== n) this.persistCurrent();
      const lv = getLevel(n);
      let s = null;
      if (opts.resume && d.current && d.current.lv === n) s = Core.GameSession.restore(n, lv, d.current);
      if (!s) s = new Core.GameSession(n, lv);
      this.session = s;
      this.levelNo = n;
      this.setWorld(meta.world);
      this.renderer.setSession(s);
      $('#hud-level').textContent = 'Bölüm ' + n;
      $('#hud-world').textContent = meta.worldName + ' · ' + Core.FAMILIES[lv.family];
      $('#hud-final').hidden = !meta.isFinal;
      $('#hud-warn').hidden = true;
      this.show('game');
      this.onViewportChange();
      this.renderer.fit();
      this.updateHUD();
      this.persistCurrent();
      this.startCoach();
    }
    persistCurrent() {
      const s = this.session;
      if (!s || s.won) return;
      if (s.moves === 0 && s.history.length === 0) {
        // an untouched board needs no resume data (another level's game is kept)
        if (this.save.data.current && this.save.data.current.lv === s.levelNo) { this.save.data.current = null; this.save.save(); }
        return;
      }
      this.save.data.current = s.serialize();
      this.save.save();
    }
    updateHUD() {
      const s = this.session;
      if (!s) return;
      $('#hud-tiles').textContent = s.remaining;
      $('#hud-pairs').textContent = s.availablePairs().length;
      $('#hud-bar').style.width = ((s.n - s.remaining) / s.n * 100).toFixed(1) + '%';
      $('#btn-undo').disabled = !s.history.length || s.won;
    }
    onTileTap(i) {
      const s = this.session;
      if (!s || s.won || this.ui.isOpen || this.introOpen || this.autoplayLock) return;
      const res = s.tap(i);
      this.handleTapResult(res);
    }
    handleTapResult(res) {
      const s = this.session, r = this.renderer;
      switch (res.type) {
        case 'select': this.audio.play('select'); r.invalidate(); break;
        case 'deselect': this.audio.play('deselect'); r.invalidate(); break;
        case 'blocked':
          this.audio.play('blocked'); r.shake(res.tile);
          if (!this._blockedTipShown && this.levelNo <= 3) { this._blockedTipShown = true; this.coach('Bu taş bloke. Bir taşın üstünde başka taş yoksa ve sol ya da sağ yanı açıksa taş serbesttir.', 4200); }
          break;
        case 'mismatch': this.audio.play('mismatch'); r.shake(res.prev); r.invalidate(); break;
        case 'match': {
          this.audio.play('match');
          r.removeTiles(res.a, res.b);
          if (res.revealed.length) r.flash(res.revealed);
          const ach = P.recordMatch(this.save.data);
          if (ach.length) this.ui.achievementToasts(ach);
          $('#hud-warn').hidden = true;
          this.updateHUD();
          this.coachAfterMatch();
          if (res.won) { this.onWin(); break; }
          this.persistCurrent();
          const ver = s.version;
          if (res.noMoves) setTimeout(() => { if (this.session === s && s.version === ver && !s.won) this.showNoMoves(); }, 650);
          else this.scheduleDeadEndCheck();
          break;
        }
      }
    }
    scheduleDeadEndCheck() {
      clearTimeout(this.checkTimer);
      const s = this.session, ver = s.version;
      this.checkTimer = setTimeout(() => {
        if (this.session !== s || s.version !== ver || s.won) return;
        const st = s.solvability(9000);
        $('#hud-warn').hidden = st !== 'unsolvable';
      }, 420);
    }
    doHint() {
      const s = this.session;
      if (!s || s.won) return;
      const h = s.useHint(25000);
      if (!h) { this.ui.toast('Serbest eşleşen çift yok — Karıştır veya Geri Al\'ı dene.', { icon: 'info' }); return; }
      this.renderer.showHint(h.pair[0], h.pair[1]);
      this.audio.play('hint');
      if (h.solvable === false) $('#hud-warn').hidden = false;
      this.save.data.stats.hints++;
      this.persistCurrent();
      this.coachDone('hint');
    }
    doShuffle() {
      const s = this.session;
      if (!s || s.won) return;
      const before = s.faces.slice();
      const res = s.shuffle();
      if (!res.ok) { this.showShuffleImpossible(); return; }
      this.renderer.clearHint();
      this.renderer.flip(res.changed, before);
      this.audio.play('shuffle');
      this.save.data.stats.shuffles++;
      $('#hud-warn').hidden = true;
      this.ui.closeNow();
      this.updateHUD();
      this.persistCurrent();
      this.coachDone('shuffle');
    }
    doUndo() {
      const s = this.session;
      if (!s || s.won) return;
      const before = s.faces.slice();
      const e = s.undo();
      if (!e) { this.ui.toast('Henüz geri alınacak hamle yok.'); return; }
      this.renderer.clearHint();
      if (e.t === 'm') this.renderer.restoreTiles([e.a, e.b]);
      else {
        const changed = [];
        for (let i = 0; i < s.n; i++) if (s.isPresent(i) && s.faces[i] !== before[i]) changed.push(i);
        this.renderer.flip(changed, before);
      }
      this.audio.play('undo');
      this.save.data.stats.undos++;
      this.ui.closeNow();
      this.updateHUD();
      this.persistCurrent();
      this.scheduleDeadEndCheck();
      this.coachDone('undo');
    }
    doRewind() {
      const s = this.session;
      const undone = s.rewindToSolvable(60000);
      const tiles = [];
      for (const e of undone) if (e.t === 'm') tiles.push(e.a, e.b);
      this.renderer.clearTransient();
      if (tiles.length) this.renderer.restoreTiles(tiles);
      this.save.data.stats.undos += undone.length;
      $('#hud-warn').hidden = true;
      this.updateHUD();
      this.persistCurrent();
      this.ui.toast(undone.length ? `Çözülebilir bir tahtaya dönmek için ${undone.length} hamle geri alındı.` : 'Bu tahta zaten çözülebilir.', { icon: 'undo' });
    }
    doRestart(force) {
      const s = this.session;
      if (!s) return;
      const go = () => {
        s.reset();
        this.renderer.setSession(s);
        $('#hud-warn').hidden = true;
        this.updateHUD();
        this.persistCurrent();
        this.ui.toast('Bölüm yeniden başlatıldı', { icon: 'restart', ms: 1400 });
      };
      if (force || s.moves === 0 || s.won) { this.ui.closeNow(); go(); }
      else this.ui.confirm('Bölüm yeniden başlatılsın mı?', 'Bu tahtadaki hamlelerin silinecek. Taş düzeni aynı kalır.', 'Yeniden Başlat', go);
    }

    // ---------------------------------------------------------- modals
    openPause() {
      if (!this.session || this.session.won) return;
      const s = this.session;
      this.ui.open(`<h2>Duraklatıldı</h2><p>Bölüm ${s.levelNo} · ${esc(Core.levelMeta(s.levelNo).worldName)}</p>
        <div class="win-stats"><div><b>${s.remaining}</b><small>Kalan taş</small></div><div><b>${s.moves}</b><small>Hamle</small></div><div><b>${fmtTime(s.elapsed)}</b><small>Süre</small></div></div>
        <div class="actions"><button class="btn primary big" data-m="resume"><span data-icon="play"></span>Devam Et</button>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="restart"><span data-icon="restart"></span>Baştan</button><button class="btn" data-m="settings"><span data-icon="settings"></span>Ayarlar</button></div>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="map"><span data-icon="map"></span>Bölüm Haritası</button><button class="btn" data-m="menu">Ana Menü</button></div></div>`, {
        actions: {
          resume: () => this.ui.close(),
          restart: () => this.doRestart(),
          settings: () => this.openSettings(() => this.openPause()),
          map: () => { this.ui.closeNow(); this.action('leave'); },
          menu: () => { this.ui.closeNow(); this.persistCurrent(); this.save.flush(); this.showMenu(); }
        }
      });
    }
    showNoMoves() {
      this.ui.open(`<h2>Eşleşme kalmadı</h2><p>Tahtada serbest çift kalmadı. Birkaç hamleyi geri al ya da kalan taşları çözülebilir yeni bir düzene karıştır.</p>
        <div class="actions"><button class="btn primary" data-m="undo"><span data-icon="undo"></span>Son hamleyi geri al</button>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="shuffle"><span data-icon="shuffle"></span>Karıştır</button><button class="btn" data-m="restart"><span data-icon="restart"></span>Baştan</button></div></div>`, {
        dismissable: false,
        actions: { undo: () => { this.ui.closeNow(); this.doUndo(); }, shuffle: () => { this.ui.closeNow(); this.doShuffle(); }, restart: () => { this.ui.closeNow(); this.doRestart(true); } }
      });
    }
    showShuffleImpossible() {
      this.ui.open(`<h2>Karıştırmak işe yaramaz</h2><p>Kalan taşlar hiçbir dağıtımla temizlenemeyecek biçimde üst üste duruyor (örneğin bir taş, tek eşinin hemen üstünde). Hâlâ temizlenebilen son tahtaya geri dön ya da bölümü yeniden başlat.</p>
        <div class="actions"><button class="btn primary" data-m="rewind"><span data-icon="undo"></span>Çözülebilir tahtaya dön</button><button class="btn" data-m="restart"><span data-icon="restart"></span>Bölümü yeniden başlat</button><button class="btn" data-m="cancel">Vazgeç</button></div>`, {
        actions: { rewind: () => { this.ui.closeNow(); this.doRewind(); }, restart: () => { this.ui.closeNow(); this.doRestart(true); }, cancel: () => this.ui.close() }
      });
    }
    onWin() {
      const s = this.session, n = s.levelNo;
      const meta = Core.levelMeta(n);
      clearTimeout(this.checkTimer);
      this.clearCoach();
      const result = P.recordWin(this.save.data, n, {
        stars: s.stars(), timeMs: s.elapsed, moves: s.moves, hints: s.hints, shuffles: s.shuffles, undos: s.undos,
        tiles: s.n, family: s.level.family
      });
      this.save.data.current = null;
      this.save.flush();
      this.updateHUD();
      this.winTimer = setTimeout(() => {
        if (this.session !== s) return;
        this.celebration.start(meta.isFinal || n === Core.LEVEL_COUNT);
        this.audio.play('win');
        if (n === Core.LEVEL_COUNT) this.showJourneyComplete(s, result);
        else this.showWin(s, result);
        if (result.achievements.length) this.ui.achievementToasts(result.achievements);
      }, 700);
    }
    showWin(s, result) {
      const n = s.levelNo, meta = Core.levelMeta(n);
      const best = this.save.data.progress.bestTime[n - 1];
      const title = meta.isFinal ? 'Dünya Tamamlandı!' : 'Bölüm Tamamlandı';
      const help = s.hints + s.shuffles ? `<p style="font-size:13px">${s.hints} ipucu · ${s.shuffles} karıştırma kullanıldı — 3 yıldız için yardımsız bitir.</p>` : '';
      const nextWorld = meta.isFinal ? `<p>${esc(A.WORLDS[meta.world + 1].name)} artık açık.</p>` : '';
      const el = this.ui.open(`${meta.isFinal ? `<div class="final-banner">${esc(meta.worldName)} · Final Mücadelesi</div>` : ''}<h2>${title}</h2>
        <div class="win-stars"><span>${icon('star')}</span><span>${icon('star')}</span><span>${icon('star')}</span></div>
        ${result.newBest && !result.firstClear ? '<div><span class="badge-new">YENİ REKOR</span></div>' : ''}
        <div class="win-stats"><div><b>${s.moves}</b><small>Hamle</small></div><div><b>${fmtTime(s.elapsed)}</b><small>Süre</small></div><div><b>${fmtTime(best)}</b><small>En iyi</small></div></div>
        ${help}${nextWorld}
        <div class="actions"><button class="btn primary big" data-m="next"><span data-icon="play"></span>Sonraki Bölüm</button>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="replay"><span data-icon="restart"></span>Tekrar Oyna</button><button class="btn" data-m="map"><span data-icon="map"></span>Bölüm Haritası</button></div></div>`, {
        dismissable: false,
        actions: {
          next: () => this.startLevel(n + 1, { resume: true }),
          replay: () => this.startLevel(n, { resume: false }),
          map: () => { this.ui.closeNow(); this.celebration.stop(); this.showLevels(Core.levelMeta(Math.min(n + 1, Core.LEVEL_COUNT)).world); }
        }
      });
      const spans = $$('.win-stars span', el);
      spans.forEach((sp, k) => setTimeout(() => {
        if (k < result.stars) { sp.classList.add('on'); this.audio.play('star'); } else sp.classList.add('off');
      }, 350 + k * 320));
    }
    showJourneyComplete(s, result) {
      const d = this.save.data;
      const total = P.totalStars(d), cleared = P.levelsCleared(d);
      const el = this.ui.open(`<div class="final-banner">${esc(A.WORLDS[Core.WORLD_COUNT - 1].name)} · Bölüm 500</div><h2>Yolculuk Tamamlandı!</h2>
        <div class="win-stars"><span>${icon('star')}</span><span>${icon('star')}</span><span>${icon('star')}</span></div>
        <p>Zen Yolculuğu'nun zirvesine ulaştın. 20 dünyanın her biri sana kapılarını açtı.</p>
        <div class="win-stats"><div><b>${cleared}</b><small>Bölüm</small></div><div><b>${total}</b><small>/ 1500 ★</small></div><div><b>${fmtTime(d.stats.playTimeMs)}</b><small>Oynama</small></div></div>
        <p style="font-size:13px">${total < 1500 ? 'Kalan yıldızları toplamak için istediğin bölümü tekrar oyna.' : 'Tüm yıldızlar toplandı — gerçek bir Mahjong ustası.'}</p>
        <div class="actions"><button class="btn primary big" data-m="map"><span data-icon="map"></span>Dünya Haritası</button>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="replay"><span data-icon="restart"></span>Tekrar Oyna</button><button class="btn" data-m="menu">Ana Menü</button></div></div>`, {
        dismissable: false, cls: 'journey-complete',
        actions: {
          map: () => { this.ui.closeNow(); this.celebration.stop(); this.showMap(); },
          replay: () => this.startLevel(s.levelNo, { resume: false }),
          menu: () => { this.ui.closeNow(); this.celebration.stop(); this.showMenu(); }
        }
      });
      $$('.win-stars span', el).forEach((sp, k) => setTimeout(() => { if (k < result.stars) { sp.classList.add('on'); this.audio.play('star'); } else sp.classList.add('off'); }, 350 + k * 320));
    }
    showWorldIntro(w, done) {
      const W = A.WORLDS[w];
      const el = $('#world-intro');
      this.setWorld(w);
      el.style.backgroundImage = A.worldBackgroundURL(w);
      el.innerHTML = `<div class="wi-num">Dünya ${w + 1} / ${Core.WORLD_COUNT}</div><h2>${esc(W.name)}</h2><div class="wi-line"></div><p>${esc(W.sub)}</p><div class="wi-tap">Başlamak için dokun</div>`;
      el.hidden = false;
      el.classList.remove('closing');
      el.classList.add('enter');
      this.introOpen = true;
      this.onModalChange();
      this.audio.play('world');
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        el.classList.add('closing');
        setTimeout(() => { el.hidden = true; el.classList.remove('closing', 'enter'); }, 480);
        this.introOpen = false;
        this.onModalChange();
        done();
      };
      const timer = setTimeout(finish, 3200);
      el.onclick = () => { if (Date.now() - t0 > 500) finish(); };
      const t0 = Date.now();
    }

    openSettings(onClose) {
      const st = this.settings;
      const sw = (key, on, label) => `<button class="switch" role="switch" aria-checked="${on}" data-m="toggle" data-key="${key}" aria-label="${label}"></button>`;
      const fsLabel = this.fs.active ? 'Tam ekrandan çık' : 'Tam ekrana geç';
      const el = this.ui.open(`<div class="modal-head"><h2>Ayarlar</h2><button class="icon-btn" data-m="close" aria-label="Kapat" data-icon="close"></button></div>
        <div class="settings-list">
          <div class="set-row"><span class="ico">${icon('music')}</span><span class="lbl">Müzik<small>Sakin, kendiliğinden oluşan ambiyans</small></span>${sw('music', st.music, 'Müzik')}</div>
          <div class="set-row"><span class="ico">${icon('sound')}</span><span class="lbl">Ses efektleri</span>${sw('sfx', st.sfx, 'Ses efektleri')}</div>
          <div class="set-row"><span class="ico">${icon('sound')}</span><span class="lbl">Ses düzeyi</span><input type="range" min="0" max="100" step="1" value="${Math.round(st.volume * 100)}" aria-label="Ses düzeyi" data-vol></div>
          <div class="set-row"><span class="ico">${icon('star')}</span><span class="lbl">Ortam efektleri<small>Düşen yapraklar, sis, parçacıklar</small></span>${sw('effects', st.effects, 'Ortam efektleri')}</div>
          <div class="set-row"><span class="ico">${icon('fsEnter')}</span><span class="lbl">Tam ekran</span><button class="btn small" data-m="fs">${fsLabel}</button></div>
        </div>
        <div class="set-section">İlerlemen</div>
        <div class="btn-grid"><button class="btn" data-m="export"><span data-icon="download"></span>Kaydı Dışa Aktar</button><button class="btn" data-m="import"><span data-icon="upload"></span>Kaydı İçe Aktar</button></div>
        <div class="btn-grid" style="grid-template-columns:1fr"><button class="btn danger" data-m="reset"><span data-icon="trash"></span>İlerlemeyi Sıfırla</button></div>
        <p class="storage-note">İlerleme bu cihaza otomatik olarak kaydedilir (${this.save.status.idb ? 'IndexedDB' : ''}${this.save.status.idb && this.save.status.ls ? ' + ' : ''}${this.save.status.ls ? 'localStorage' : ''}${this.save.persistent ? '' : 'depolama kullanılamıyor — korumak için dışa aktar'}). Gizli gezinme veya site verilerini temizlemek kaydı siler; ara sıra yedek almak için dışa aktar.</p>
        <p class="storage-note">Mahjong: Zen Journey v${VERSION}</p>`, {
        onClose,
        actions: {
          close: () => this.ui.close(),
          toggle: (b) => {
            const k = b.dataset.key;
            st[k] = !st[k];
            b.setAttribute('aria-checked', st[k]);
            this.audio.unlock();
            this.applySettings();
            this.save.save();
          },
          fs: (b) => { this.fs.toggle(); setTimeout(() => { b.textContent = this.fs.active ? 'Tam ekrandan çık' : 'Tam ekrana geç'; }, 400); },
          export: () => this.exportSave(),
          import: () => this.importSave(),
          reset: () => this.ui.confirm('Tüm ilerleme sıfırlansın mı?', 'Tüm bölümler, yıldızlar, istatistikler ve başarımlar silinecek. Bu işlem geri alınamaz. Önce kaydını dışa aktarmayı düşün.', 'Her şeyi sıfırla', () => this.resetProgress(), { danger: true, onCancel: () => this.openSettings(onClose) })
        }
      });
      const vol = $('[data-vol]', el);
      vol.addEventListener('input', () => { st.volume = vol.value / 100; this.applySettings(); });
      vol.addEventListener('change', () => { this.audio.unlock(); this.audio.play('match'); this.save.save(); });
    }
    exportSave() {
      this.persistCurrent();
      const json = this.save.exportJSON();
      let downloaded = false;
      try {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = this.save.exportFileName(); a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        downloaded = true;
      } catch (e) { downloaded = false; }
      const el = this.ui.open(`<h2>Kayıt dışa aktarıldı</h2><p>${downloaded ? 'Bir JSON kayıt dosyası indirildi.' : 'Tarayıcın indirmeyi engelledi.'} Dosya görünmediyse (bazı gömülü oynatıcılar indirmeleri engeller) aşağıdaki metni kopyalayıp güvenli bir yerde sakla.</p>
        <textarea class="io" readonly>${esc(json)}</textarea>
        <div class="actions row"><button class="btn" data-m="copy">Metni kopyala</button><button class="btn primary" data-m="ok">Bitti</button></div>`, {
        actions: {
          ok: () => this.openSettings(),
          copy: () => {
            const ta = $('textarea', el);
            ta.select();
            const ok = () => this.ui.toast('Kayıt panoya kopyalandı');
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(ok, () => { try { document.execCommand('copy'); ok(); } catch (e) { /* noop */ } });
            else { try { document.execCommand('copy'); ok(); } catch (e) { /* noop */ } }
          }
        }
      });
    }
    importSave() {
      const el = this.ui.open(`<h2>Kaydı içe aktar</h2><p>Bir Mahjong: Zen Journey kayıt dosyası (.json) seç ya da kayıt metnini yapıştır.</p>
        <input type="file" accept=".json,application/json" data-file hidden>
        <div class="actions"><button class="btn primary" data-m="pick"><span data-icon="upload"></span>Dosya seç</button></div>
        <textarea class="io" placeholder="…ya da kayıt metnini buraya yapıştır" data-paste></textarea>
        <div class="actions row"><button class="btn" data-m="cancel">Vazgeç</button><button class="btn" data-m="paste">Metni içe aktar</button></div>`, {
        actions: {
          cancel: () => this.openSettings(),
          pick: () => $('[data-file]', el).click(),
          paste: () => this._importText($('[data-paste]', el).value)
        }
      });
      $('[data-file]', el).addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = () => this._importText(String(rd.result));
        rd.onerror = () => this.ui.toast('Dosya okunamadı.');
        rd.readAsText(f);
      });
    }
    _importText(text) {
      let data;
      try { data = this.save.parseImport(text); }
      catch (e) { this.ui.open(`<h2>İçe aktarma başarısız</h2><p>${esc(e.message)}</p><div class="actions"><button class="btn primary" data-m="ok">Tamam</button></div>`, { actions: { ok: () => this.importSave() } }); return; }
      const cleared = P.levelsCleared(data), stars = P.totalStars(data);
      this.ui.confirm('İlerleme değiştirilsin mi?', `İçe aktarılan kayıtta ${cleared} tamamlanmış bölüm ve ${stars} yıldız var. Bu cihazdaki ilerlemenin yerini alacak.`, 'İçe aktar', () => {
        this.save.replace(data).then(() => {});
        this.session = null;
        this.applySettings();
        this.showMenu();
        this.ui.toast('Kayıt başarıyla içe aktarıldı', { icon: 'check' });
      });
    }
    resetProgress() {
      this.save.reset();
      this.session = null;
      this.applySettings();
      this.showMenu();
      this.ui.toast('İlerleme sıfırlandı', { icon: 'trash' });
    }
    openStats() {
      const d = this.save.data, st = d.stats;
      const three = d.progress.stars.filter((v) => v === 3).length;
      const ach = Object.keys(d.achievements).length;
      const item = (v, l) => `<div><b>${v}</b><small>${l}</small></div>`;
      this.ui.open(`<div class="modal-head"><h2>İstatistikler</h2><button class="icon-btn" data-m="close" aria-label="Kapat" data-icon="close"></button></div>
        <div class="stats-grid">${item(P.levelsCleared(d) + ' / 500', 'Tamamlanan bölüm')}${item(P.totalStars(d) + ' / 1500', 'Yıldız')}${item(three, 'Üç yıldızlı bölüm')}${item(d.progress.unlocked, 'En ileri bölüm')}
        ${item(st.matches.toLocaleString('tr-TR'), 'Yapılan eşleşme')}${item(fmtTime(st.playTimeMs), 'Oynama süresi')}${item(st.wins, 'Kazanılan bölüm')}${item(st.bestStreak3, 'En iyi 3★ serisi')}
        ${item(st.hints, 'Kullanılan ipucu')}${item(st.shuffles, 'Kullanılan karıştırma')}${item(st.undos, 'Geri alma')}${item(ach + ' / ' + P.ACHIEVEMENTS.length, 'Başarım')}
        ${item(st.families.filter((v) => v > 0).length + ' / 20', 'Keşfedilen yerleşim')}${item(Core.WORLD_COUNT - Array.from({ length: 20 }, (_, w) => P.worldStats(d, w).complete).filter((x) => !x).length + ' / 20', 'Tamamlanan dünya')}</div>`, {
        actions: { close: () => this.ui.close() }
      });
    }
    openAchievements() {
      const d = this.save.data;
      const rows = P.ACHIEVEMENTS.map((a) => `<div class="ach ${d.achievements[a.id] ? 'on' : ''}"><span class="medal">${icon(d.achievements[a.id] ? 'trophy' : 'lock')}</span><div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div></div>`).join('');
      this.ui.open(`<div class="modal-head"><h2>Başarımlar</h2><button class="icon-btn" data-m="close" aria-label="Kapat" data-icon="close"></button></div>
        <p>${P.ACHIEVEMENTS.length} başarımdan ${Object.keys(d.achievements).length} tanesi açıldı</p><div class="ach-list">${rows}</div>`, { actions: { close: () => this.ui.close() } });
    }

    // ---------------------------------------------------------- tutorial coach
    coach(text, ms, opts) {
      const box = $('#coach');
      clearTimeout(this.coachTimer);
      box.innerHTML = `<div class="coach-card"><span class="hand">${opts && opts.img ? opts.img : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5a1.5 1.5 0 0 1 3 0v5M12 10V8.5a1.5 1.5 0 0 1 3 0V11M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a5 5 0 0 1-4.3-2.5L4 14a1.5 1.5 0 0 1 2.6-1.5L9 15"/></svg>'}</span><span>${esc(text)}</span><button class="x" aria-label="Kapat">${icon('close')}</button></div>`;
      box.hidden = false;
      $('.x', box).onclick = () => this.clearCoach();
      $$('.tool.coach-target').forEach((b) => b.classList.remove('coach-target'));
      if (opts && opts.target) { const t = $(opts.target); if (t) t.classList.add('coach-target'); }
      if (ms) this.coachTimer = setTimeout(() => this.clearCoach(), ms);
      requestAnimationFrame(() => { if (!box.hidden) this.renderer.setInsetBottom(box.offsetHeight + 16); });
    }
    clearCoach() {
      clearTimeout(this.coachTimer);
      const box = $('#coach');
      if (box) { box.hidden = true; box.innerHTML = ''; }
      if (this.renderer) this.renderer.setInsetBottom(0);
      $$('.tool.coach-target').forEach((b) => b.classList.remove('coach-target'));
      this.coachStep = null;
    }
    tipSeen(id) { return !!this.save.data.seen.tips[id]; }
    markTip(id) { this.save.data.seen.tips[id] = true; this.save.save(); }
    startCoach() {
      this.clearCoach();
      const n = this.levelNo, s = this.session;
      this._blockedTipShown = this.tipSeen('blocked');
      if (s.moves > 0) return;
      const steps = {
        1: ['t1', 'Eşleşen iki taşa dokunarak onları kaldır. Parlayan çift iyi bir başlangıç!'],
        2: ['t2', 'Soluk taşlar bloke: üstlerinde taş var ya da iki yanları da kapalı. Önce çevrelerindeki taşları temizle.'],
        3: ['t3', 'Takıldın mı? İpucu serbest bir eşleşen çift gösterir. Bölümü yardımsız bitirmek 3 yıldız kazandırır.', '#btn-hint'],
        4: ['t4', 'Fikrini mi değiştirdin? Geri Al, hamleleri istediğin kadar geri alır — asla yıldız kaybettirmez.', '#btn-undo'],
        5: ['t5', 'Karıştır, kalan taşları hâlâ temizlenebilecek yeni bir düzene dağıtır.', '#btn-shuffle']
      };
      const st = steps[n];
      if (st && !this.tipSeen(st[0])) {
        this.coachStep = st[0];
        this.coach(st[1], 0, { target: st[2] });
        if (n === 1) {
          const h = s.findHint(8000);
          if (h) this.renderer.showHint(h.pair[0], h.pair[1]);
        }
        return;
      }
      const hasBonus = s.faces.some((f) => f >= 34);
      if (hasBonus && !this.tipSeen('bonus')) {
        const img = `<img alt="" src="${A.tileDataURL(34, 40)}" style="width:34px">`;
        this.coachStep = 'bonus';
        this.coach('Çiçek taşları herhangi bir Çiçek taşıyla, Mevsim taşları da herhangi bir Mevsim taşıyla eşleşir.', 9000, { img });
        this.markTip('bonus');
      }
    }
    coachAfterMatch() {
      const step = this.coachStep;
      if (!step) return;
      if (step === 't1') {
        this.markTip('t1');
        this.coach('Harika! Bir taşın üstü boşsa ve sol ya da sağ yanı açıksa taş serbesttir. Kazanmak için tüm çiftleri temizle.', 6000);
        this.coachStep = 'done';
      } else if (step === 't2') { this.markTip('t2'); this.clearCoach(); }
    }
    coachDone(kind) {
      const map = { hint: 't3', undo: 't4', shuffle: 't5' };
      if (this.coachStep && this.coachStep === map[kind]) { this.markTip(map[kind]); this.clearCoach(); }
    }

    // ---------------------------------------------------------- autoplay (debug + tests)
    playSolution(fromCurrent, delay) {
      const s = this.session;
      if (!s) return false;
      let pairs;
      if (fromCurrent) {
        const res = Core.solveExact(s.geom, s.faces, s.st.present, { budget: 400000 });
        if (res.status !== 'solved') { this.ui.toast('Buradan çözüm bulunamadı (' + res.status + ')'); return false; }
        pairs = res.moves;
      } else {
        s.reset();
        this.renderer.setSession(s);
        this.updateHUD();
        pairs = [];
        for (let i = 0; i + 1 < s.n; i += 2) pairs.push([i, i + 1]);
      }
      this.stopAutoplay();
      let k = 0;
      this.autoplayLock = true;
      const step = () => {
        if (this.session !== s || s.won || k >= pairs.length) { this.stopAutoplay(); return; }
        const [a, b] = pairs[k++];
        if (s.selected !== -1) s.tap(s.selected);
        this.handleTapResult(s.tap(a));
        this.handleTapResult(s.tap(b));
        this.autoplay = setTimeout(step, delay || 220);
      };
      step();
      return true;
    }
    stopAutoplay() { clearTimeout(this.autoplay); this.autoplay = null; this.autoplayLock = false; }
  }

  root.MJGame = { App, getLevel, fmtTime, VERSION, DEBUG };
  function start() {
    const app = new App();
    root.MJApp = app;
    app.boot().catch((e) => { console.error(e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}(typeof globalThis !== 'undefined' ? globalThis : this));
