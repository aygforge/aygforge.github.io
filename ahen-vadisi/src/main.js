// Ahen Vadisi — giriş noktası
import Phaser from 'phaser';
import './ui/styles.css';
import { app } from './core/app.js';
import { bus } from './core/events.js';
import { ui } from './ui/ui.js';
import { h } from './ui/dom.js';
import { BootScene } from './scenes/BootScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { showMainMenu } from './ui/menu.js';
import { createHud } from './ui/hud.js';
import { bindPanelEvents, openPanel } from './ui/panels/index.js';
import { requestFullscreen } from './ui/screen.js';
import { respawnEntry } from './systems/dungeon.js';
import { MAPS } from './data/maps/index.js';
import { sound } from './audio/sound.js';
import { devEnabled, mountDevButton } from './dev/devpanel.js';

let hud = null;

async function start() {
  const root = document.getElementById('ui');
  ui.init(root);
  bindPanelEvents();
  // yükleme ekranı
  const bar = h('i');
  const loading = h('div', { class: 'screen', id: 'loading' }, h('div', { class: 'logo' }, 'AHEN VADİSİ'), h('div', { class: 'bar' }, bar), h('div', { class: 'small muted', id: 'loading-text' }, 'Dünya çiziliyor…'));
  ui.layers.top.appendChild(loading);
  bus.on('bootProgress', (p) => { bar.style.width = `${Math.round(p * 100)}%`; });

  app.dev = devEnabled();
  try {
    await app.loadProfile();
  } catch (e) {
    console.error(e);
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0e0c14',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    input: { activePointers: 4, touch: { capture: true } },
    disableContextMenu: true,
    fps: { target: 60, smoothStep: true },
    render: { powerPreference: 'high-performance', batchSize: 4096 },
    scene: [BootScene, WorldScene],
    banner: false,
    audio: { noAudio: true },
  });
  app.game = game;

  await new Promise((res) => bus.on('bootReady', res));
  loading.remove();
  showMainMenu(enterWorld);
  bindGlobalKeys();
  bindLifecycle();
  app.startPeriodicSave();
  bus.on('exitToMenu', exitToMenu);
  bus.on('profileReplaced', () => { exitToMenu(true); });
  bus.on('hudRebuild', () => { if (hud) { hud.destroy(); hud = createHud(); ui.layers.hud.appendChild(hud.el); } });
}

function enterWorld(slot) {
  app.selectCharacter(slot);
  const ch = app.char;
  if (app.settings.fullscreen) requestFullscreen();
  sound.init();
  // istemsiz kapanmadan sonra dungeon kontrol noktasından devam
  let mapId = ch.world.map, entry = null;
  if (mapId === 'dungeon') {
    if (ch.dungeon && ch.world.dungeonUnlocked) entry = respawnEntry(ch);
    else { mapId = 'mine'; entry = 'from_dungeon'; }
  }
  if (!MAPS[mapId]) { mapId = 'village'; entry = 'start'; }
  ui.layers.screen.innerHTML = '';
  hud = createHud();
  ui.layers.hud.appendChild(hud.el);
  if (app.dev) mountDevButton();
  const sm = app.game.scene;
  if (sm.isActive('world') || sm.isPaused('world')) sm.stop('world');
  sm.start('world', { mapId, entry });
  if (!ch.world.tutorialDone) {
    ch.world.tutorialDone = true;
    setTimeout(() => {
      bus.emit('toast', { text: 'Köy Muhtarı\'na dokun ve ilk görevini al!', kind: 'level' });
      bus.emit('toast', { text: 'Sol alttaki joystick ile yürü; düşmana dokunarak saldır.', kind: 'info' });
    }, 1200);
  }
}

async function exitToMenu(skipSave = false) {
  ui.closePanel(true);
  while (ui.layers.modal.firstChild) ui.closeModal();
  if (!skipSave && app.char) await app.flushSave('exit');
  const sm = app.game.scene;
  if (sm.isActive('world') || sm.isPaused('world')) sm.stop('world');
  app.world = null;
  app.char = null;
  if (hud) { hud.destroy(); hud = null; }
  ui.layers.top.innerHTML = '';
  showMainMenu(enterWorld);
}

function bindGlobalKeys() {
  window.addEventListener('keydown', (e) => {
    if (!app.world || e.target.tagName === 'INPUT') return;
    const p = app.world.player;
    const k = e.key.toLowerCase();
    if (ui.isOpen()) { if (k === 'escape') { ui.closeModal(); ui.closePanel(); } return; }
    if (['1', '2', '3', '4'].includes(k)) p.useSkill(+k - 1);
    else if (k === 'q') p.usePotion('hp');
    else if (k === 'e') p.usePotion('mp');
    else if (k === 'tab') { e.preventDefault(); app.world.cycleTarget(); }
    else if (k === ' ') { e.preventDefault(); app.world.attackNearest(); }
    else if (k === 'r') { app.world.autoAttack = !app.world.autoAttack; app.setSettings({ autoAttack: app.world.autoAttack }); }
    else if (k === 'i') openPanel('inventory');
    else if (k === 'c') openPanel('character');
    else if (k === 'k') openPanel('skills');
    else if (k === 'j') openPanel('quests');
    else if (k === 'm') openPanel('map');
    else if (k === 'escape') openPanel('settings');
  });
}

function bindLifecycle() {
  // Arka plana geçince kaydet ve duraklat (beforeunload tek güvence değil)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (app.char) app.flushSave('hidden');
      sound.suspend();
      if (app.world && !app.world.scene.isPaused()) { app.world.scene.pause(); app._autoPaused = true; }
    } else {
      sound.resume();
      if (app._autoPaused && app.world && !ui.isOpen()) app.world.scene.resume();
      app._autoPaused = false;
    }
  });
  window.addEventListener('pagehide', () => { if (app.char) app.flushSave('pagehide'); });
  // dikey ekrana dönünce oyunu duraklat
  const mq = window.matchMedia('(orientation: portrait)');
  const onOri = () => {
    if (!app.world) return;
    if (mq.matches) { if (!app.world.scene.isPaused()) { app.world.scene.pause(); app._oriPaused = true; } }
    else if (app._oriPaused && !ui.isOpen()) { app.world.scene.resume(); app._oriPaused = false; }
  };
  mq.addEventListener?.('change', onOri);
  // iOS: çift dokunma yakınlaştırmasını ve hareket hareketlerini engelle
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', (e) => { if (!e.target.closest?.('.scroll')) e.preventDefault(); }, { passive: false });
}

// PWA servis işçisi (HTTPS veya localhost)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW kaydı başarısız', e));
  });
}

start();
