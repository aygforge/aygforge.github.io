// AppState — uygulama genelindeki tek kayıt nesnesi ve kalıcı yazım noktası.
import { SaveService } from '../systems/SaveService.js';
import { audio } from '../platform/AudioService.js';
import { lifecycle } from '../platform/Lifecycle.js';

class AppState {
  constructor() {
    this.saveService = new SaveService();
    this.save = this.saveService.load();
    this.notice = this.saveService.notice;
    // A snapshot whose reward was already granted must never be resumed.
    if (this.save.activeRun && this.save.claimedRuns.includes(this.save.activeRun.runId)) {
      this.save.activeRun = null;
      this.persist();
    }
    lifecycle.vibration = this.save.settings.vibration;
    const p = new URLSearchParams(location.search);
    this.dev = p.has('dev') || p.has('test');
    this.forcedSeed = p.has('seed') ? Number(p.get('seed')) >>> 0 : null;
  }
  persist() {
    return this.saveService.save(this.save);
  }
  setSetting(k, v) {
    this.save.settings[k] = v;
    lifecycle.vibration = this.save.settings.vibration;
    audio.apply(this.save.settings);
    this.persist();
  }
  resetAll() {
    this.save = this.saveService.reset();
    this.persist();
  }
}

export const app = new AppState();
