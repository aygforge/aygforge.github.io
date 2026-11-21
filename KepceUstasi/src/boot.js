// Ortak oyun açılışı (main.js ve main.artifact.js tarafından kullanılır).
import Phaser from 'phaser';
import { GAME_W, gameHeightFor } from './config/layout.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { app } from './game/AppState.js';

export async function bootGame({ registerServiceWorker = false } = {}) {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('20px "Pixelify Sans"', 'Kepçe Ustası ğüşıöçİĞÜŞÖÇ'),
        document.fonts.load('bold 20px "Pixelify Sans"', 'Kepçe Ustası ğüşıöçİĞÜŞÖÇ'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fall back to monospace */
  }
  const frame = document.getElementById('frame');
  const H = gameHeightFor(frame.clientWidth, frame.clientHeight);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: H,
    backgroundColor: '#1e1a26',
    pixelArt: true,
    roundPixels: true,
    disableContextMenu: true,
    input: { activePointers: 2, touch: { capture: true } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { target: 60, forceSetTimeOut: false },
    audio: { disableWebAudio: false },
    scene: [BootScene, MenuScene, GameScene],
  });
  document.getElementById('boot')?.remove();
  if (app.dev) window.__KEPCE__ = { game, app };
  if (registerServiceWorker && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const reg = () => navigator.serviceWorker.register('./sw.js').catch(() => {});
    if (document.readyState === 'complete') reg();
    else window.addEventListener('load', reg);
  }
  return game;
}
