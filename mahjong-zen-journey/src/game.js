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
    return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(r).padStart(2, '0')}`;
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
        b.setAttribute('aria-label', a ? 'Exit fullscreen' : 'Enter fullscreen');
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
        this.toast('Achievement: ' + a.name, { cls: 'ach', icon: 'trophy', ms: 3200 });
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
      this.open(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="actions row"><button class="btn" data-m="no">Cancel</button><button class="btn ${opts && opts.danger ? 'danger' : 'primary'}" data-m="yes">${esc(okLabel)}</button></div>`, {
        actions: { no: () => { this.close(); if (opts && opts.onCancel) opts.onCancel(); }, yes: () => { this.closeNow(); onOk(); } }
      });
    }
    fullscreenHelp(afterFailure) {
      const app = this.app;
      const iframe = app.fs.inIframe;
      let text;
      if (isIOS() && !app.fs.supported) text = 'Safari on iPhone does not allow web pages to hide the browser bars. The game already fills all of the available screen. For the most space, use Share → Add to Home Screen, or open the game in its own tab.';
      else if (iframe) text = 'The page hosting this game does not allow fullscreen. The game is using all the space it was given. You can open it in its own browser tab instead.';
      else text = afterFailure ? 'Your browser declined the fullscreen request. The game keeps using all of the visible screen.' : 'This browser does not support fullscreen mode. The game keeps using all of the visible screen.';
      this.open(`<h2>Fullscreen unavailable</h2><p>${esc(text)}</p><div class="actions">${iframe ? '<button class="btn primary" data-m="tab"><span data-icon="external"></span>Open in new tab</button>' : ''}<button class="btn" data-m="ok">OK</button></div>`, {
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
      if (!this.save.persistent) setTimeout(() => this.ui.toast('Storage is unavailable here — export your save to keep progress.', { ms: 4200 }), 600);
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
      $('#menu-play-label').textContent = started ? (d.current ? 'Continue' : 'Play Level ' + n) : 'Play';
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
        html += `<button class="${cls}" data-act="world" data-world="${w}" aria-label="${esc(W.name)}${ws.unlocked ? '' : ' (locked)'}">
          <div class="world-thumb" style='background-image:${A.worldBackgroundURL(w)}'><span class="wn">${w + 1}</span></div>
          <div class="world-info"><h3>${esc(W.name)}</h3><p>${ws.unlocked ? esc(W.sub) : 'Complete ' + esc(A.WORLDS[Math.max(0, w - 1)].name) + ' to unlock'}</p>
          <div class="world-meta"><span>${ws.cleared}/25 levels</span><span><span class="star-ico">${icon('star')}</span>${ws.stars}/75</span><span class="muted">Lv ${w * 25 + 1}–${w * 25 + 25}</span></div></div>
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
        this.ui.toast('Complete ' + A.WORLDS[w - 1].name + ' to unlock ' + A.WORLDS[w].name + '.', { icon: 'lock' });
        return;
      }
      this.mapWorld = w;
      this.setWorld(w);
      const ws = P.worldStats(d, w);
      $('#levels-title').textContent = A.WORLDS[w].name;
      $('#levels-sub').textContent = `World ${w + 1} · ${ws.cleared}/25 cleared · ${ws.stars}/75 ★`;
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
        html += `<button class="${cls}" data-act="level" data-level="${n}" ${unlocked ? '' : 'disabled'} aria-label="Level ${n}${unlocked ? ', ' + st + ' stars' : ', locked'}">` +
          (fin ? `<div><div class="ft">FINAL CHALLENGE</div><b>${n}</b></div><div><div class="lstars">${unlocked ? stars : ''}</div><div class="fam">${esc(fam)}</div></div>${unlocked ? '' : `<span class="lk">${icon('lock')}</span>`}`
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
      if (!P.isUnlocked(d, n)) { this.ui.toast('Level ' + n + ' is locked.', { icon: 'lock' }); return; }
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
      $('#hud-level').textContent = 'Level ' + n;
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
          if (!this._blockedTipShown && this.levelNo <= 3) { this._blockedTipShown = true; this.coach('That tile is blocked. A tile is free when nothing lies on it and its left or right side is open.', 4200); }
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
      if (!h) { this.ui.toast('No matching pairs are free — try Shuffle or Undo.', { icon: 'info' }); return; }
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
      if (!e) { this.ui.toast('Nothing to undo yet.'); return; }
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
      this.ui.toast(undone.length ? `Rewound ${undone.length} move${undone.length > 1 ? 's' : ''} to a solvable board.` : 'This board is already solvable.', { icon: 'undo' });
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
        this.ui.toast('Level restarted', { icon: 'restart', ms: 1400 });
      };
      if (force || s.moves === 0 || s.won) { this.ui.closeNow(); go(); }
      else this.ui.confirm('Restart level?', 'Your moves on this board will be cleared. The layout stays the same.', 'Restart', go);
    }

    // ---------------------------------------------------------- modals
    openPause() {
      if (!this.session || this.session.won) return;
      const s = this.session;
      this.ui.open(`<h2>Paused</h2><p>Level ${s.levelNo} · ${esc(Core.levelMeta(s.levelNo).worldName)}</p>
        <div class="win-stats"><div><b>${s.remaining}</b><small>Tiles left</small></div><div><b>${s.moves}</b><small>Moves</small></div><div><b>${fmtTime(s.elapsed)}</b><small>Time</small></div></div>
        <div class="actions"><button class="btn primary big" data-m="resume"><span data-icon="play"></span>Resume</button>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="restart"><span data-icon="restart"></span>Restart</button><button class="btn" data-m="settings"><span data-icon="settings"></span>Settings</button></div>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="map"><span data-icon="map"></span>Level Map</button><button class="btn" data-m="menu">Main Menu</button></div></div>`, {
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
      this.ui.open(`<h2>No more matches</h2><p>There are no free pairs left on the board. Undo a few moves, or shuffle the remaining tiles into a new solvable arrangement.</p>
        <div class="actions"><button class="btn primary" data-m="undo"><span data-icon="undo"></span>Undo last move</button>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="shuffle"><span data-icon="shuffle"></span>Shuffle</button><button class="btn" data-m="restart"><span data-icon="restart"></span>Restart</button></div></div>`, {
        dismissable: false,
        actions: { undo: () => { this.ui.closeNow(); this.doUndo(); }, shuffle: () => { this.ui.closeNow(); this.doShuffle(); }, restart: () => { this.ui.closeNow(); this.doRestart(true); } }
      });
    }
    showShuffleImpossible() {
      this.ui.open(`<h2>Shuffle can't help</h2><p>The remaining tiles are stacked so that no deal could clear them (for example a tile lying directly on its only partner). Rewind to the last board that can still be cleared, or restart the level.</p>
        <div class="actions"><button class="btn primary" data-m="rewind"><span data-icon="undo"></span>Rewind to solvable board</button><button class="btn" data-m="restart"><span data-icon="restart"></span>Restart level</button><button class="btn" data-m="cancel">Cancel</button></div>`, {
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
      const title = meta.isFinal ? 'World Complete!' : 'Level Complete';
      const help = s.hints + s.shuffles ? `<p style="font-size:13px">${s.hints} hint${s.hints === 1 ? '' : 's'} · ${s.shuffles} shuffle${s.shuffles === 1 ? '' : 's'} used — clear it with no help for 3 stars.</p>` : '';
      const nextWorld = meta.isFinal ? `<p>${esc(A.WORLDS[meta.world + 1].name)} is now open.</p>` : '';
      const el = this.ui.open(`${meta.isFinal ? `<div class="final-banner">${esc(meta.worldName)} · Final Challenge</div>` : ''}<h2>${title}</h2>
        <div class="win-stars"><span>${icon('star')}</span><span>${icon('star')}</span><span>${icon('star')}</span></div>
        ${result.newBest && !result.firstClear ? '<div><span class="badge-new">NEW BEST</span></div>' : ''}
        <div class="win-stats"><div><b>${s.moves}</b><small>Moves</small></div><div><b>${fmtTime(s.elapsed)}</b><small>Time</small></div><div><b>${fmtTime(best)}</b><small>Best</small></div></div>
        ${help}${nextWorld}
        <div class="actions"><button class="btn primary big" data-m="next"><span data-icon="play"></span>Next Level</button>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="replay"><span data-icon="restart"></span>Replay</button><button class="btn" data-m="map"><span data-icon="map"></span>Level Map</button></div></div>`, {
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
      const el = this.ui.open(`<div class="final-banner">Dragon's Crown · Level 500</div><h2>Journey Complete!</h2>
        <div class="win-stars"><span>${icon('star')}</span><span>${icon('star')}</span><span>${icon('star')}</span></div>
        <p>You have reached the summit of the Zen Journey. Every one of the 20 worlds has opened to you.</p>
        <div class="win-stats"><div><b>${cleared}</b><small>Levels</small></div><div><b>${total}</b><small>of 1500 ★</small></div><div><b>${fmtTime(d.stats.playTimeMs)}</b><small>Played</small></div></div>
        <p style="font-size:13px">${total < 1500 ? 'Replay any level to collect the remaining stars.' : 'Every star collected — a true Mahjong master.'}</p>
        <div class="actions"><button class="btn primary big" data-m="map"><span data-icon="map"></span>World Map</button>
        <div class="actions row" style="margin-top:0"><button class="btn" data-m="replay"><span data-icon="restart"></span>Replay</button><button class="btn" data-m="menu">Main Menu</button></div></div>`, {
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
      el.innerHTML = `<div class="wi-num">World ${w + 1} of ${Core.WORLD_COUNT}</div><h2>${esc(W.name)}</h2><div class="wi-line"></div><p>${esc(W.sub)}</p><div class="wi-tap">Tap to begin</div>`;
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
      const sw = (key, on) => `<button class="switch" role="switch" aria-checked="${on}" data-m="toggle" data-key="${key}" aria-label="${key}"></button>`;
      const fsLabel = this.fs.active ? 'Exit fullscreen' : 'Enter fullscreen';
      const el = this.ui.open(`<div class="modal-head"><h2>Settings</h2><button class="icon-btn" data-m="close" aria-label="Close" data-icon="close"></button></div>
        <div class="settings-list">
          <div class="set-row"><span class="ico">${icon('music')}</span><span class="lbl">Music<small>Calm generative ambience</small></span>${sw('music', st.music)}</div>
          <div class="set-row"><span class="ico">${icon('sound')}</span><span class="lbl">Sound effects</span>${sw('sfx', st.sfx)}</div>
          <div class="set-row"><span class="ico">${icon('sound')}</span><span class="lbl">Volume</span><input type="range" min="0" max="100" step="1" value="${Math.round(st.volume * 100)}" aria-label="Volume" data-vol></div>
          <div class="set-row"><span class="ico">${icon('star')}</span><span class="lbl">Ambient effects<small>Falling petals, mist, particles</small></span>${sw('effects', st.effects)}</div>
          <div class="set-row"><span class="ico">${icon('fsEnter')}</span><span class="lbl">Fullscreen</span><button class="btn small" data-m="fs">${fsLabel}</button></div>
        </div>
        <div class="set-section">Your progress</div>
        <div class="btn-grid"><button class="btn" data-m="export"><span data-icon="download"></span>Export Save</button><button class="btn" data-m="import"><span data-icon="upload"></span>Import Save</button></div>
        <div class="btn-grid" style="grid-template-columns:1fr"><button class="btn danger" data-m="reset"><span data-icon="trash"></span>Reset Progress</button></div>
        <p class="storage-note">Progress is saved automatically on this device (${this.save.status.idb ? 'IndexedDB' : ''}${this.save.status.idb && this.save.status.ls ? ' + ' : ''}${this.save.status.ls ? 'localStorage' : ''}${this.save.persistent ? '' : 'storage unavailable — export to keep it'}). Private browsing or clearing site data erases it, so export a backup now and then.</p>
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
          fs: (b) => { this.fs.toggle(); setTimeout(() => { b.textContent = this.fs.active ? 'Exit fullscreen' : 'Enter fullscreen'; }, 400); },
          export: () => this.exportSave(),
          import: () => this.importSave(),
          reset: () => this.ui.confirm('Reset all progress?', 'Every level, star, statistic and achievement will be erased. This cannot be undone. Consider exporting your save first.', 'Reset everything', () => this.resetProgress(), { danger: true, onCancel: () => this.openSettings(onClose) })
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
      const el = this.ui.open(`<h2>Save exported</h2><p>${downloaded ? 'A JSON save file has been downloaded.' : 'Your browser blocked the download.'} If no file appeared (some embedded players block downloads), copy the text below and keep it somewhere safe.</p>
        <textarea class="io" readonly>${esc(json)}</textarea>
        <div class="actions row"><button class="btn" data-m="copy">Copy text</button><button class="btn primary" data-m="ok">Done</button></div>`, {
        actions: {
          ok: () => this.openSettings(),
          copy: () => {
            const ta = $('textarea', el);
            ta.select();
            const ok = () => this.ui.toast('Save copied to clipboard');
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(ok, () => { try { document.execCommand('copy'); ok(); } catch (e) { /* noop */ } });
            else { try { document.execCommand('copy'); ok(); } catch (e) { /* noop */ } }
          }
        }
      });
    }
    importSave() {
      const el = this.ui.open(`<h2>Import save</h2><p>Choose a Mahjong: Zen Journey save file (.json), or paste the save text.</p>
        <input type="file" accept=".json,application/json" data-file hidden>
        <div class="actions"><button class="btn primary" data-m="pick"><span data-icon="upload"></span>Choose file</button></div>
        <textarea class="io" placeholder="…or paste save text here" data-paste></textarea>
        <div class="actions row"><button class="btn" data-m="cancel">Cancel</button><button class="btn" data-m="paste">Import text</button></div>`, {
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
        rd.onerror = () => this.ui.toast('Could not read the file.');
        rd.readAsText(f);
      });
    }
    _importText(text) {
      let data;
      try { data = this.save.parseImport(text); }
      catch (e) { this.ui.open(`<h2>Import failed</h2><p>${esc(e.message)}</p><div class="actions"><button class="btn primary" data-m="ok">OK</button></div>`, { actions: { ok: () => this.importSave() } }); return; }
      const cleared = P.levelsCleared(data), stars = P.totalStars(data);
      this.ui.confirm('Replace progress?', `The imported save has ${cleared} cleared level${cleared === 1 ? '' : 's'} and ${stars} stars. It will replace the progress on this device.`, 'Import', () => {
        this.save.replace(data).then(() => {});
        this.session = null;
        this.applySettings();
        this.showMenu();
        this.ui.toast('Save imported successfully', { icon: 'check' });
      });
    }
    resetProgress() {
      this.save.reset();
      this.session = null;
      this.applySettings();
      this.showMenu();
      this.ui.toast('Progress has been reset', { icon: 'trash' });
    }
    openStats() {
      const d = this.save.data, st = d.stats;
      const three = d.progress.stars.filter((v) => v === 3).length;
      const ach = Object.keys(d.achievements).length;
      const item = (v, l) => `<div><b>${v}</b><small>${l}</small></div>`;
      this.ui.open(`<div class="modal-head"><h2>Statistics</h2><button class="icon-btn" data-m="close" aria-label="Close" data-icon="close"></button></div>
        <div class="stats-grid">${item(P.levelsCleared(d) + ' / 500', 'Levels cleared')}${item(P.totalStars(d) + ' / 1500', 'Stars')}${item(three, 'Three-star levels')}${item(d.progress.unlocked, 'Furthest level')}
        ${item(st.matches.toLocaleString(), 'Matches made')}${item(fmtTime(st.playTimeMs), 'Time played')}${item(st.wins, 'Levels won')}${item(st.bestStreak3, 'Best 3★ streak')}
        ${item(st.hints, 'Hints used')}${item(st.shuffles, 'Shuffles used')}${item(st.undos, 'Undos')}${item(ach + ' / ' + P.ACHIEVEMENTS.length, 'Achievements')}
        ${item(st.families.filter((v) => v > 0).length + ' / 20', 'Layouts explored')}${item(Core.WORLD_COUNT - Array.from({ length: 20 }, (_, w) => P.worldStats(d, w).complete).filter((x) => !x).length + ' / 20', 'Worlds complete')}</div>`, {
        actions: { close: () => this.ui.close() }
      });
    }
    openAchievements() {
      const d = this.save.data;
      const rows = P.ACHIEVEMENTS.map((a) => `<div class="ach ${d.achievements[a.id] ? 'on' : ''}"><span class="medal">${icon(d.achievements[a.id] ? 'trophy' : 'lock')}</span><div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div></div>`).join('');
      this.ui.open(`<div class="modal-head"><h2>Achievements</h2><button class="icon-btn" data-m="close" aria-label="Close" data-icon="close"></button></div>
        <p>${Object.keys(d.achievements).length} of ${P.ACHIEVEMENTS.length} unlocked</p><div class="ach-list">${rows}</div>`, { actions: { close: () => this.ui.close() } });
    }

    // ---------------------------------------------------------- tutorial coach
    coach(text, ms, opts) {
      const box = $('#coach');
      clearTimeout(this.coachTimer);
      box.innerHTML = `<div class="coach-card"><span class="hand">${opts && opts.img ? opts.img : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5a1.5 1.5 0 0 1 3 0v5M12 10V8.5a1.5 1.5 0 0 1 3 0V11M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a5 5 0 0 1-4.3-2.5L4 14a1.5 1.5 0 0 1 2.6-1.5L9 15"/></svg>'}</span><span>${esc(text)}</span><button class="x" aria-label="Dismiss">${icon('close')}</button></div>`;
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
        1: ['t1', 'Tap two matching tiles to clear them. The glowing pair is a good start!'],
        2: ['t2', 'Dimmed tiles are blocked: something lies on top, or both sides are covered. Clear their neighbours first.'],
        3: ['t3', 'Stuck? Hint shows a free matching pair. Clearing a level without help earns 3 stars.', '#btn-hint'],
        4: ['t4', 'Changed your mind? Undo takes moves back as often as you like — it never costs stars.', '#btn-undo'],
        5: ['t5', 'Shuffle re-deals the remaining tiles into a new arrangement that can still be cleared.', '#btn-shuffle']
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
        this.coach('Flower tiles match any other Flower, and Season tiles match any other Season.', 9000, { img });
        this.markTip('bonus');
      }
    }
    coachAfterMatch() {
      const step = this.coachStep;
      if (!step) return;
      if (step === 't1') {
        this.markTip('t1');
        this.coach('Wonderful! A tile is free when nothing covers it and its left or right side is open. Clear every pair to win.', 6000);
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
        if (res.status !== 'solved') { this.ui.toast('No solution found from here (' + res.status + ')'); return false; }
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
