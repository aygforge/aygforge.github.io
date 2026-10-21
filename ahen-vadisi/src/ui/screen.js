// Tam ekran ve yatay yön kilidi (desteklenmiyorsa sessizce geri düşer; dikeyde uyarı ekranı CSS ile gösterilir)
export async function requestFullscreen() {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
  } catch { /* desteklenmiyor (ör. iPhone Safari) */ }
  try { await screen.orientation?.lock?.('landscape'); } catch { /* yön kilidi yok */ }
}

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
