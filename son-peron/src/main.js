// Uygulama girişi: Phaser + DOM arayüz + simülasyon + kayıt + ses bağlanır.
import Phaser from 'phaser';
import C from './data/index.js';
import { Sim, newState } from './systems/sim.js';
import { serialize, parse } from './systems/save.js';
import BootScene from './scenes/BootScene.js';
import WorldScene from './scenes/WorldScene.js';
import { UI } from './ui/ui.js';
import { Audio } from './audio/audio.js';
import * as Store from './ui/storage.js';
import { Bot } from './dev/bot.js';

class App {
  constructor() {
    this.C = C; this.settings = { zoom: 1, textSize: 15, vol: {}, ...Store.getSettings() }; this.userZoom = this.settings.zoom; this.speed = 1; this.assetErrors = []; this.sim = null; this.frozen = false;
    this.audio = new Audio(this.settings); this.ui = new UI(this);
    this.game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', backgroundColor: '#1b1413', pixelArt: true, roundPixels: true, scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight }, scene: [BootScene, WorldScene], fps: { target: 60 } });
    this.game.registry.set('app', this);
    window.addEventListener('pointerdown', () => this.audio.unlock(), { once: false });
    window.addEventListener('beforeunload', () => { if (this.sim) this.save('auto'); });
  }
  async onAssetsReady(atlas) { this.atlas = atlas.frames; this.ui.setAtlas(atlas.frames); this.hasSave = !!(await Store.get('auto')) || !!(await Store.get('manual')); this.ui.open('menu'); }
  get world() { return this.game.scene.getScene('World'); }
  startSim(state) {
    this.sim = new Sim(C, state); this.sim.fx.length = 0;
    if (this.game.scene.isActive('World')) this.world.setSim(this.sim); else this.game.scene.start('World');
    this.ui.close(true); this.ui.showHud(true);
  }
  newGame(opts) { this.startSim(newState(C, { ...opts, seed: (Date.now() & 0x7fffffff) || 1 })); this.ui.toast('Peronova\'ya hoş geldin! Görev listesi sol üstte; sarı ok yolu gösterir.', 'good'); }
  async save(slot = 'manual') { if (!this.sim) return false; await Store.put(slot, serialize(this.sim)); this.hasSave = true; return true; }
  async continueGame() { const a = await Store.get('auto'), m = await Store.get('manual'); const pa = a ? parse(a) : null, pm = m ? parse(m) : null; const best = [pa, pm].filter((p) => p?.ok).sort((x, y) => (y.savedAt || 0) - (x.savedAt || 0))[0]; if (!best) { this.ui.toast((pa || pm)?.error || 'Kayıt bulunamadı', 'error'); return false; } this.startSim(best.state); this.ui.toast('Kayıt yüklendi.', 'good'); return true; }
  importText(text) { const p = parse(text); if (!p.ok) { this.ui.toast(p.error, 'error'); return false; } this.startSim(p.state); this.ui.toast('Kayıt içe aktarıldı.', 'good'); return true; }
  exportSave() { const blob = new Blob([serialize(this.sim)], { type: 'application/json;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `son-peron-gun${this.sim.s.day}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  toMenu() { this.save('auto'); this.game.scene.stop('World'); this.sim = null; this.ui.showHud(false); this.ui.open('menu'); }
  setZoom(z) { this.userZoom = Math.max(0.75, Math.min(1.5, z)); const base = window.innerHeight >= 1300 ? 2 : 1; this.world?.cameras?.main?.setZoom(this.userZoom * base); this.settings.zoom = this.userZoom; Store.setSettings(this.settings); }
  saveSettings() { this.settings.vol = this.audio.vol; Store.setSettings(this.settings); document.getElementById('ui').style.setProperty('--fs', this.settings.textSize + 'px'); }
  onMorning() { this.save('auto'); }
  // Uyku: kararma → gün sonu işlemleri → rapor → otomatik kayıt
  doSleep(force) {
    const chk = this.sim.daysys.sleepCheck(this.sim); if (chk && !force) { this.ui.open('sleep', { confirm: chk }); return; }
    this.ui.close(true); this.frozen = true; this.sleeping = true; this.ui.fade(true);
    setTimeout(() => { const r = this.sim.daysys.sleep(this.sim, true); this.sleeping = false; this.frozen = false; this.ui.fade(false); if (r.ok) { this.save('auto'); this.ui.open('report', { report: r.report }); } }, 700);
  }
  // Geliştirici/e2e: botu gerçek sahne üzerinde hızlandırılmış çalıştır
  makeBot() { return new Bot(this.sim); }
}
window.__app = new App();
