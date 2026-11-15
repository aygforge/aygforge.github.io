// Tides of Fortune — giriş noktası.
import { GameCore } from './core/GameCore.js';
import { browserStorage } from './core/SaveManager.js';
import { Renderer } from './rendering/Renderer.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { Stage } from './ui/Stage.js';
import { UI } from './ui/UI.js';
import { injectIconStyles } from './ui/IconStyles.js';
import { setTapSound } from './ui/dom.js';
import { tickVoyage } from './ui/screens/voyage.js';
import { T } from './data/strings.js';
import { HARBOR_BY_ID } from './data/harbors.js';
import { installDevHooks } from './dev.js';

function boot() {
  injectIconStyles();
  const core = new GameCore(browserStorage());
  const canvas = document.getElementById('scene');
  const renderer = new Renderer(canvas, core);
  const audio = new AudioEngine(core.settings);
  let ui = null;
  const stage = new Stage(document.getElementById('stage'), document.getElementById('rotate'), (W, H) => {
    renderer.resize(W, H);
    if (ui) ui.render();
  });
  ui = new UI({
    root: document.getElementById('ui'),
    overlay: document.getElementById('overlay'),
    bubbles: document.getElementById('bubbles'),
    core, renderer, audio, stage,
  });
  renderer.onFrame = () => tickVoyage(ui);
  renderer.world.ocean.onThunder = () => audio.thunder();
  setTapSound(() => audio.play('click'));
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', () => audio.suspend(document.hidden));
  // Kapatılmadan önce son durumu kaydet
  window.addEventListener('pagehide', () => core.persist());
  document.querySelector('#rotate h2').textContent = T.rotate;
  document.querySelector('#rotate p').textContent = T.rotateSub;

  ui.render();
  renderer.start();
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hide');
    setTimeout(() => loading.remove(), 600);
  }
  window.__tof = { core, ui, renderer, audio, stage, world: renderer.world, harborName: (id) => HARBOR_BY_ID[id]?.name || id };
  installDevHooks(window.__tof);

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.__TOF_SINGLE_FILE__) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

if (document.fonts && document.fonts.load) {
  Promise.race([
    Promise.all([document.fonts.load('24px Pixelify'), document.fonts.load('600 24px Pixelify'), document.fonts.load('24px Pixelify', 'ğşİı')]),
    new Promise((r) => setTimeout(r, 1500)),
  ]).finally(boot);
} else boot();
