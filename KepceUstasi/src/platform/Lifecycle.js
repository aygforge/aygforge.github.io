// Lifecycle — arka plan/ön plan, Android geri tuşu (native: @capacitor/app backButton; tarayıcıda history), titreşim.
import { App } from '@capacitor/app';
export class Lifecycle {
  constructor() {
    this.handlers = { hidden: new Set(), back: new Set() };
    this.vibration = true;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.handlers.hidden.forEach((f) => f());
      });
      window.addEventListener('pagehide', () => this.handlers.hidden.forEach((f) => f()));
      window.addEventListener('blur', () => this.handlers.hidden.forEach((f) => f()));
      if (globalThis.Capacitor?.isNativePlatform?.()) {
        // Android: hardware back = pause / close menu (never exits mid-run); app pause = game pause + save
        App.addListener('backButton', () => this.handlers.back.forEach((f) => f())).catch(() => {});
        App.addListener('pause', () => this.handlers.hidden.forEach((f) => f())).catch(() => {});
      }
      // Browser stand-in for the Android back button: keep one history entry and treat "back" as pause/menu.
      try {
        history.pushState({ kepce: 1 }, '');
        window.addEventListener('popstate', () => {
          history.pushState({ kepce: 1 }, '');
          this.handlers.back.forEach((f) => f());
        });
      } catch {
        /* sandboxed */
      }
    }
  }
  on(kind, fn) {
    this.handlers[kind].add(fn);
    return () => this.handlers[kind].delete(fn);
  }
  vibrate(ms) {
    if (!this.vibration) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* not supported */
    }
  }
}

export const lifecycle = new Lifecycle();
