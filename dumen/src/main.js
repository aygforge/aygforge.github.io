// Giriş noktası.
(function (D) {
  'use strict';
  const params = new URLSearchParams(location.search);
  D.Game.init({ debug: params.get('debug') === '1' });
  D.Input.init();
  D.UI.layout();
  D.Scenes.applySettings();
  window.addEventListener('resize', () => { D.UI.layout(); D.SM.rebuild(); });
  window.addEventListener('orientationchange', () => setTimeout(() => { D.UI.layout(); D.SM.rebuild(); }, 200));
  // İlk kullanıcı etkileşiminde ses aç (autoplay yok)
  const unlock = () => { D.Audio.unlock(); };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { D.Audio.suspend(); if (D.Game.state) D.Game.saveNow(); }
    else D.Audio.resume();
  });
  window.addEventListener('pagehide', () => { if (D.Game.state) D.Game.saveNow(); });
  // Sistem geri tuşu / Esc: en üstteki modalı kapat
  window.addEventListener('keydown', (e) => { if (e.code === 'Escape') D.UI.closeTop(); });
  D.bus.on('saveFail', () => D.UI.toast('Kayıt yazılamadı — tarayıcı depolaması kapalı olabilir. Ayarlar → Dışa Aktar ile yedek al.', 'bad', 5000));
  if (D.Game.debug) { globalThis.DUMEN_DEBUG = D; }
  D.SM.start();
  D.SM.go('boot');
})(globalThis.DUMEN);
