// Android (Capacitor) katmanı. Web/tek dosya sürümünde hiçbir şey yapmaz.
//
// Kayıt güvenliği: oyunun kayıt biçimi ve anahtarları (tof.meta / tof.run / tof.settings ve .bak yedekleri)
// DEĞİŞMEZ; birincil depo yine WebView localStorage'dır. Ek olarak her yazım, Android'in kalıcı
// SharedPreferences deposuna (Capacitor Preferences) yansıtılır. localStorage boş bulunursa (ör. WebView
// verisi silinmiş ya da ileride sunucu adresi/şeması değişmiş) kayıtlar oradan geri yüklenir.
//
// Not: Bu kapalı test sürümü hiçbir satın alma/hak (entitlement) bilgisi yazmaz. Tam oyuna ücretsiz erişim
// yalnızca bu derlemenin bir özelliğidir; kayıtta "satın alındı" anlamına gelen hiçbir alan yoktur.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';

export const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

const SAVE_PREFIX = 'tof.';
const SAVE_KEYS = ['tof.meta', 'tof.meta.bak', 'tof.run', 'tof.run.bak', 'tof.settings', 'tof.settings.bak'];

/**
 * Kayıt deposunu hazırlar. Web'de verilen depoyu aynen döndürür.
 * Android'de: eksik anahtarları kalıcı yedekten geri yükler, sonra yazımları yedeğe yansıtan bir sarmalayıcı döndürür.
 */
export async function prepareStorage(base, { native = isNative(), prefs = Preferences, delay = 1200 } = {}) {
  if (!native || !base || base._map) return base; // bellek deposu (localStorage yok) ise dokunma
  const Preferences = prefs; // testlerde sahte depo verilebilir
  try {
    // Yalnız localStorage tamamen kaybolmuşsa (kalıcı ilerleme kaydı da yoksa) yedekten geri yükle.
    // Kısmi eksik (ör. bitmiş seferin silinmiş kaydı) geri getirilmez: yedeğe henüz yansımamış bir silme,
    // biten seferi diriltmesin.
    const wiped = base.getItem('tof.meta') == null && base.getItem('tof.meta.bak') == null;
    for (const key of wiped ? SAVE_KEYS : []) {
      if (base.getItem(key) != null) continue;
      const { value } = await Preferences.get({ key });
      if (value != null) base.setItem(key, value);
    }
  } catch { /* yedek okunamazsa oyun localStorage ile devam eder */ }
  const pending = new Map();
  let timer = null;
  const flush = () => {
    timer = null;
    const items = [...pending.entries()];
    pending.clear();
    return Promise.all(items.map(([key, value]) => (value == null ? Preferences.remove({ key }) : Preferences.set({ key, value })).catch(() => {})));
  };
  const queue = (key, value) => {
    if (!key.startsWith(SAVE_PREFIX)) return;
    pending.set(key, value);
    if (!timer) timer = setTimeout(flush, delay);
  };
  return {
    getItem: (k) => base.getItem(k),
    setItem: (k, v) => { base.setItem(k, v); queue(k, String(v)); },
    removeItem: (k) => { base.removeItem(k); queue(k, null); },
    flushNative: () => { if (timer) clearTimeout(timer); return flush(); },
  };
}

/** Android sistem olayları: geri tuşu, arka plana alma */
export function installNative({ core, ui, storage }) {
  if (!isNative()) return;
  document.documentElement.classList.add('native');
  const saveNow = () => {
    try { core.persist(); } catch { /* */ }
    try { core.saveSettings?.(); } catch { /* */ }
    storage?.flushNative?.();
  };
  App.addListener('pause', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
  // Geri tuşu: önce açık pencere, sonra harita / alt ekran; en sonda uygulamayı kapatmadan arka plana al
  App.addListener('backButton', () => {
    const cine = document.querySelector('.cinematic');
    if (cine) { cine.click(); return; }
    const top = ui.modals[ui.modals.length - 1];
    if (top && top._close) { top._close(); return; }
    if (ui.sub.mapOpen) { ui.sub.mapOpen = false; ui.render(); return; }
    if (['upgrades', 'codex', 'settings'].includes(ui.view)) { ui.go(core.run && !core.run.ended ? 'game' : 'menu'); return; }
    saveNow();
    App.minimizeApp().catch(() => {});
  });
}
