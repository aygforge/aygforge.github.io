// Boot: tüm procedural dokuları üretir ve kaydeder, sonra arayüze "hazır" bildirir.
import Phaser from 'phaser';
import { registerAll } from './textures.js';
import { bus } from '../core/events.js';
import { preloadSpritePacks, registerSpritePacks } from '../art/spriteRuntime.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  preload() {
    // hazır sprite paketleri; eksik dosya oyunu durdurmaz (procedural çizime geri dönülür)
    this.load.on('loaderror', (f) => console.warn('[Ahen] sprite yüklenemedi:', f.key));
    preloadSpritePacks(this);
  }
  create() {
    registerSpritePacks(this);
    // DOM yükleme ekranının boyanması için bir kare bekle
    setTimeout(() => {
      const ms = registerAll(this, (p) => bus.emit('bootProgress', p));
      console.info(`[Ahen] dokular üretildi: ${ms.toFixed(0)} ms`);
      bus.emit('bootReady', this.game);
    }, 30);
  }
}
