import Phaser from 'phaser';
import './styles/main.css';
import { BootScene, BattleScene } from './game/BattleScene.js';
import { App, DEFAULT_SETTINGS } from './ui/app.js';
import { initIcons } from './ui/icons.js';
import { setLang } from './localization/i18n.js';
import { h } from './ui/dom.js';

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem('varneth.settings') || '{}')) }; } catch { return { ...DEFAULT_SETTINGS }; }
}

async function boot() {
  const ui = document.getElementById('ui');
  const bar = h('div', { class: 'bar' }, h('i', { style: { width: '0%' } }));
  const loading = h('div', { class: 'loading' }, h('img', { class: 'logo', src: 'assets/ui/logo.png', alt: 'VARNETH' }), h('div', { class: 'subtitle' }, 'The world breaks. The hunt continues.'), bar, h('div', { class: 'small muted', id: 'load-msg' }, 'Varlıklar yükleniyor…'));
  ui.append(loading);
  const manifest = await (await fetch('assets/manifest.json')).json();
  await initIcons(manifest);
  const settings = loadSettings();
  setLang(settings.lang);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 640,
    height: 360,
    backgroundColor: '#0d0a12',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { target: 60 },
    scene: [BootScene, BattleScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set('manifest', manifest);
        g.registry.set('settings', settings);
        g.registry.set('onProgress', (v) => { bar.firstChild.style.width = Math.round(v * 100) + '%'; });
        g.registry.set('onSceneReady', async (scene) => {
          loading.remove();
          const app = new App(ui, scene, manifest, g.registry);
          window.__varneth = app; // debug handle (no privileges: all commands are server-validated)
          await app.start();
        });
      },
    },
  });
  window.addEventListener('error', (e) => console.error('[varneth]', e.message));
  return game;
}

boot();
