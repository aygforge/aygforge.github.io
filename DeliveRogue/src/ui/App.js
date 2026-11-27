// ui/App.js — UI composition root: registers the 8 scenes, mounts persistent chrome + overlays,
// routes navigation / back, and applies presentation settings (reduced motion, graphics quality).
// UI never mutates gameplay stats directly; it calls systems (Progression, Game) and re-reads state.
import { SceneManager } from '../core/SceneManager.js';
import { Save } from '../core/SaveManager.js';
import { Audio } from '../core/AudioManager.js';
import { Main } from '../core/GameEngine.js';
import { View, G } from '../core/state.js';
import { Game } from '../core/DistrictRuntimeCore.js';
import { Chrome } from './Chrome.js';
import { T } from '../core/i18n.js';
import { Overlays } from './Overlays.js';
import { Boot } from '../scenes/Boot.js';
import { MainMenu } from '../scenes/MainMenu.js';
import { Garage } from '../scenes/Garage.js';
import { MetaHub } from '../scenes/MetaHub.js';
import { RunPrep } from '../scenes/RunPrep.js';
import { FightScene } from '../scenes/FightScene.js';
import { RunSummary } from '../scenes/RunSummary.js';
import { Settings } from '../scenes/Settings.js';

/** Legacy screen names (Phase 01 UI) -> scene ids, kept for debug tooling compatibility. */
const LEGACY = { menu: 'MainMenu', prep: 'RunPrep', garage: 'Garage', meta: 'MetaHub', settings: 'Settings', game: 'FightScene', summary: 'RunSummary' };

export const App = {
  state: { prepChapter: null },
  init() {
    const $ = id => document.getElementById(id), ui = $('ui');
    Overlays.init($('modal'), $('toasts'));
    Save.onError = () => App.saveFailedToast();
    Chrome.init($('topbar'), $('navbar'), id => { Audio.init(); Audio.play('click'); App.go(id); });
    SceneManager.register(Boot, MainMenu, Garage, MetaHub, RunPrep, FightScene, RunSummary, Settings);
    SceneManager.init($('scenes'), $('xlock'), {
      reducedMotion: () => App.reduced(),
      onSceneChange: next => { Chrome.show(next); Main.scene = next.engine || next.id; ui.dataset.scene = next.id; },
    });
    $('pauseBtn').addEventListener('click', e => { e.stopPropagation(); Audio.init(); Audio.play('click'); App.togglePause(); });
    // Hardware / browser back is routed through the scene graph (never leaves an active run by accident).
    try {
      history.replaceState({ dr: 0 }, ''); history.pushState({ dr: 1 }, '');
      window.addEventListener('popstate', () => { App.back(); history.pushState({ dr: 1 }, ''); });
    } catch (e) { /* history unavailable (file://, sandbox) */ }
    SceneManager.go('Boot', { onDone: () => { App.applyMotion(); App.applyGraphics(); Audio.apply(); App.go('MainMenu', {}, { kind: 'boot' }); } });
  },
  go(id, params = {}, opt = {}) { return SceneManager.go(LEGACY[id] || id, params, opt); },
  back() {
    if (Overlays.back()) return true;
    return SceneManager.back();
  },
  toast: t => Overlays.toast(t),
  /** A save write failed: the last valid save is untouched and the change was rolled back. */
  saveFailedToast() { const now = performance.now(); if (App._sft == null || now - App._sft > 2500) { App._sft = now; Overlays.toast(T('s_saveFail')); } },
  refreshChrome() { if (Chrome.visible) Chrome.refresh(); },
  reduced() { try { return !!Save.data.settings.reducedMotion; } catch (e) { return false; } },
  applyMotion() { document.getElementById('ui').classList.toggle('reduced', App.reduced()); },
  applyGraphics() { View.low = !!Save.data.settings.lowGfx || !!Main.autoLow; if (Main.resize) Main.resize(); },
  togglePause() { if (SceneManager.current === 'FightScene') FightScene.togglePause(); },
  showPause() { if (SceneManager.current === 'FightScene') FightScene.showPause(); },
  closeModal() { Overlays.close(); },
  update(dt) { SceneManager.update(dt); Chrome.update(dt, App.reduced()); },
  get modalKind() { return Overlays.kind; },
  get current() { return SceneManager.current; },
  get scenes() { return SceneManager; },
  get run() { return G.run; },
  quitRun() { if (G.run && !G.run.ended) Game.quit(); },
};
