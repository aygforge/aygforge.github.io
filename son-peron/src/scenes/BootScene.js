import Phaser from 'phaser';
// Varlıkları yükler; eksik kare varsa geliştirici uyarısı verir (teslimde eksik olmamalı).
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const base = './assets/';
    this.load.atlas('atlas', base + 'atlas.png', base + 'atlas.json'); this.load.json('atlasData', base + 'atlas.json');
    for (const s of ['spring', 'summer', 'autumn', 'winter']) this.load.image('tiles_' + s, base + `tiles_${s}.png`);
    this.load.on('loaderror', (f) => { console.error('[Asset] yüklenemedi:', f.key); this.registry.get('app').assetErrors.push(f.key); });
  }
  create() { this.registry.get('app').onAssetsReady(this.cache.json.get('atlasData')); }
}
