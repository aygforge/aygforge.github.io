// Tam ekran ve yatay yön kilidi (desteklenmiyorsa sessizce geri düşer; dikeyde uyarı ekranı CSS ile gösterilir)
// iPhone Safari web sayfalarına tam ekran izni vermez (yalnız iPad/masaüstü). Orada tek yol oyunu
// "Ana Ekrana Ekle" ile uygulama gibi açmaktır: bkz. panels/fullscreen.js.
export function fullscreenSupported() {
  const el = document.documentElement;
  if (/iPhone|iPod/.test(navigator.userAgent)) return false;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen) && document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false;
}

export function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

// true: tam ekrana geçildi (ya da zaten tam ekran / ana ekran uygulaması)
export async function requestFullscreen() {
  const el = document.documentElement;
  let ok = isFullscreen() || isStandalone();
  try {
    if (!ok && fullscreenSupported()) {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else await el.webkitRequestFullscreen();
      // eski Safari'de webkit çağrısı söz (promise) döndürmez: geçişi kısa bir süre bekle
      for (let i = 0; i < 5 && !isFullscreen(); i++) await new Promise((r) => setTimeout(r, 80));
      ok = isFullscreen();
    }
  } catch { /* izin verilmedi (ör. iframe'de allowfullscreen yok) */ }
  try { await screen.orientation?.lock?.('landscape'); } catch { /* yön kilidi yok */ }
  return ok;
}

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.matchMedia?.('(display-mode: fullscreen)').matches || window.navigator.standalone === true;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function inFrame() {
  try { return window.self !== window.top; } catch { return true; }
}
