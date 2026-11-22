'use strict';
/* =====================================================================
   android.js : Capacitor / Android WebView uyum katmanı (Faz 3)
   Web'de (tarayıcı, file://, tek dosya) HİÇBİR ŞEY yapmaz: window.Capacitor yerel Android değilse hemen çıkar.
   Oyun mantığı, ekonomi, zamanlama ve kayıt biçimi değişmez; yalnızca platform olayları mevcut koda bağlanır:
     • Geri tuşu / geri hareketi → oyunun kendi Escape davranışı (foto → pencere → panel → atış iptali);
       oyunda açık bir şey yoksa mevcut Menü paneli; ana menüde 2 sn içinde ikinci basış → kaydet + çık;
       karakter oluşturmada mevcut "toMenu" eylemi. Uygulama hiçbir zaman tek basışta kapanmaz.
     • Yaşam döngüsü (appStateChange/pause/resume) → web'deki visibilitychange ile aynı işlem:
       duraklat, kaydet, sesi askıya al; dönüşte lastTs sıfırlanır (zaman sıçraması / hızlanma yok).
     • Ses odağı (arama, başka uygulama) → MainActivity 'cozfis:audiofocus' olayı → ses askıya alınır/sürdürülür.
     • İndirme (<a download> + Blob: kayıt dışa aktarma, bozuk kayıt, fotoğraf) → Filesystem (önbellek) + Android
       paylaşım sayfası. Kayıt içe aktarma mevcut <input type=file> ile Android dosya seçicisinden yapılır.
     • Güvenli alan: Capacitor SystemBars'ın enjekte ettiği --safe-area-inset-* değişkenleri #safeprobe'a eklenir
       (oyunun mevcut ölçekleme kodu bunları okur). Kesik/kamera deliği HUD'u kesmez.
   ===================================================================== */
const AndroidShell = (() => {
  const C = window.Capacitor;
  const native = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform() && C.getPlatform && C.getPlatform() === 'android');
  const state = { native, active: true, lastBack: 0, backLog: [], shares: 0, focus: true, errors: [] };
  if (!native) return { native, state };
  const P = n => (C.Plugins && C.Plugins[n]) || null;
  const App = P('App');
  document.documentElement.classList.add('cap-android');

  /* ---- güvenli alan ---- */
  const css = document.createElement('style');
  const side = s => `max(env(safe-area-inset-${s}, 0px), var(--safe-area-inset-${s}, 0px))`;
  css.textContent = `#safeprobe{padding:${side('top')} ${side('right')} ${side('bottom')} ${side('left')}}`;
  document.head.appendChild(css);
  const reflow = () => { try { if (typeof resize === 'function') resize(); } catch (e) { } };
  new MutationObserver(reflow).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

  /* ---- yaşam döngüsü ---- */
  function toBackground(why) {
    if (!state.active) return; state.active = false; state.backgroundedAt = performance.now(); state.lastEvent = 'bg:' + why;
    Game.paused = true; Fishing.holding = false;
    try { if (S) Save.now(); } catch (e) { state.errors.push('save ' + e.message); }
    Sound.suspend(true);
  }
  function toForeground(why) {
    if (state.active) return; state.active = true; state.lastEvent = 'fg:' + why;
    Game.paused = !!Game.photo; lastTs = performance.now();          // 12_main.js döngüsü: dt sıfırdan başlar
    if (state.focus) Sound.suspend(false);
    reflow();
  }
  if (App) {
    App.addListener('appStateChange', s => (s && s.isActive) ? toForeground('state') : toBackground('state'));
    App.addListener('pause', () => toBackground('pause'));
    App.addListener('resume', () => toForeground('resume'));
  }
  window.addEventListener('cozfis:audiofocus', e => {
    state.focus = !!(e.detail && e.detail.gain);
    if (!state.focus) Sound.suspend(true); else if (state.active) Sound.suspend(false);
  });

  /* ---- geri tuşu ---- */
  const esc = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
  function onBack() {
    let r; const sc0 = Game.sceneName;
    if (Game.photo || UI.modal || UI.panel || Fishing.phase === 'CHARGING') { esc(); r = 'escape'; }
    else if (Game.sceneName === 'MainMenu') {
      const now = Date.now();
      if (now - state.lastBack < 2000) { try { if (S) Save.now(); } catch (e) { } r = 'exit'; setTimeout(() => App && App.exitApp(), 60); }
      else { state.lastBack = now; UI.toastNow(_t('android.back_again_exit')); r = 'hint'; }
    }
    else if (Game.sceneName === 'CharacterCreator') { UI.act('toMenu', {}); r = 'toMenu'; }
    else if (Game.sceneName === 'EndDay') r = 'ignored';
    else { UI.openPanel('Menu'); r = 'menu'; }
    state.backLog.push(sc0 + ':' + r); if (state.backLog.length > 20) state.backLog.shift();
    return r;
  }
  if (App) App.addListener('backButton', onBack);

  /* ---- dosya indirme → paylaşım ---- */
  const blobs = new Map();
  const _cou = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (o) { const u = _cou(o); if (o instanceof Blob) { blobs.set(u, o); setTimeout(() => blobs.delete(u), 120000); } return u; };
  const _click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    const b = this.download && blobs.get(this.href);
    if (b) { shareBlob(b, this.download); return; }
    return _click.call(this);
  };
  async function shareBlob(blob, name) {
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
      const FS = P('Filesystem'), SH = P('Share');
      const w = await FS.writeFile({ path: 'exports/' + name.replace(/[^\w.\-]+/g, '_'), data: b64, directory: 'CACHE', recursive: true });
      state.shares++; state.lastShare = { name, uri: w.uri, bytes: blob.size };
      await SH.share({ title: name, files: [w.uri], dialogTitle: _t('android.share_title') });
    } catch (e) {
      const m = String((e && e.message) || e);
      if (/cancel/i.test(m)) return;                                   // kullanıcı paylaşım sayfasını kapattı
      state.errors.push('share ' + m); UI.toastNow(_t('android.share_failed', [esc2(m)]), 'warn');
    }
  }
  const esc2 = s => String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

  return { native, state, onBack, toBackground, toForeground, shareBlob };
})();
