// Boot: tüm procedural dokuları üretir ve kaydeder, sonra arayüze "hazır" bildirir.
import Phaser from 'phaser';
import { registerAll } from './textures.js';
import { bus } from '../core/events.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  create() {
    // DOM yükleme ekranının boyanması için bir kare bekle
    setTimeout(() => {
      const ms = registerAll(this, (p) => bus.emit('bootProgress', p));
      console.info(`[Ahen] dokular üretildi: ${ms.toFixed(0)} ms`);
      bus.emit('bootReady', this.game);
    }, 30);
  }
}
