// core/GameEngine.js — migrated from DeliveRogue.html (Phase 01 Core Migration).
// Main loop, resize/high-DPI, visibility. Phase 01: variable dt replaced by a fixed 60 Hz tick.
import { Art } from './Art.js';
import { Audio } from './AudioManager.js';
import { Game } from './DistrictRuntimeCore.js';
import { Input } from './InputManager.js';
import { Save } from './SaveManager.js';
import { SceneManager } from './SceneManager.js';
import { SKILLS, EVOLUTIONS, SKILL_BY_ID } from '../data/skills.js';
import { PACKAGES, MYSTERY_POOL, FINAL_FORBIDDEN } from '../data/packages.js';
import { CONFIG } from '../data/config.js';
import { Bus, G, View } from './state.js';
import { VIEW_W, clamp } from './util.js';
import { CHAPTERS } from '../data/chapters.js';
import { ENEMY_DB } from '../data/enemies.js';
import { Render } from '../render/Render.js';
import { MapBuilder } from '../systems/MapBuilder.js';
import { Nav } from '../systems/Nav.js';
import { Progression } from '../systems/Progression.js';
import { SkillMgr } from '../systems/SkillMgr.js';
import { UI } from '../ui/UI.js';

/* ============================= Main =============================
   Scene controller, resize/high-DPI handling, visibility, main loop.
   ================================================================ */
export const Main = (() => {
  let cv, frameEl, uiEl, last = 0, perfAcc = 0, perfN = 0, perfT = 0;
  const M = { scene: 'Boot', autoLow: false };
  function resize() {
    const wrap = document.getElementById('wrap'), cs = getComputedStyle(wrap);
    const W = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), H = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const vh = clamp(VIEW_W * H / Math.max(1, W), 640, 800), scale = Math.min(W / VIEW_W, H / vh);
    View.h = Math.round(vh); View.scale = scale; View.dpr = Math.min(window.devicePixelRatio || 1, View.low ? 1 : 2);
    frameEl.style.width = (VIEW_W * scale) + 'px'; frameEl.style.height = (View.h * scale) + 'px';
    cv.width = Math.round(VIEW_W * scale * View.dpr); cv.height = Math.round(View.h * scale * View.dpr);
    uiEl.style.transform = `scale(${scale})`; uiEl.style.height = View.h + 'px'; uiEl.classList.toggle('compact', View.h < 700);
  }
  function toLogical(cx, cy) { const r = cv.getBoundingClientRect(); return { x: (cx - r.left) / r.width * VIEW_W, y: (cy - r.top) / r.height * View.h }; }
  // Fixed-step simulation (60 Hz) with bounded catch-up; rendering once per animation frame.
  const STEP = 1 / 60, MAX_STEPS = 4;
  let acc = 0;
  function loop(now) {
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 0; dt = Math.min(dt, 0.25); // ignore long tab suspensions / hitches
    // adaptive quality: drop to 1x DPR + fewer particles if frames are consistently slow
    if (!View.low && dt > 0) { perfAcc += dt; perfN++; perfT += dt; if (perfT > 3) { if (perfAcc / perfN > 1 / 38) { View.low = true; M.autoLow = true; resize(); } perfAcc = 0; perfN = 0; perfT = 0; } }
    Input.enabled = M.scene === 'game' && !!G.run && G.run.state === 'play' && !G.run.paused && !UI.modalKind;
    try {
      acc = Math.min(acc + dt, STEP * MAX_STEPS);
      while (acc >= STEP) {
        if (M.scene === 'game' && G.run) Game.update(STEP); else G.t += STEP;
        acc -= STEP;
      }
      UI.update(dt);
      // Canvas is drawn only for scenes that use it (union of outgoing + incoming during transitions);
      // hub scenes with their own painted backdrop skip the canvas entirely.
      const modes = SceneManager.canvasModes;
      if (modes.has('game') && G.run && G.world) Render.frame(true);
      else if (modes.has('menu')) Render.frame(false);
    } catch (err) { console.error(err); }
    requestAnimationFrame(loop);
  }
  function init() {
    cv = document.getElementById('cv'); frameEl = document.getElementById('frame'); uiEl = document.getElementById('ui');
    Render.init(cv); Input.attach(cv, toLogical); resize(); UI.init(); // Boot scene loads + validates the save
    window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { Input.reset(); if (M.scene === 'game' && G.run && G.run.state === 'play' && !G.run.paused && !UI.modalKind) { Game.pause(true); UI.showPause(); } Audio.suspend(); }
      else Audio.resume();
    });
    Input.onEscape = () => UI.back();
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('touchmove', e => { if (!e.target.closest('.scroll,.p-scroll')) e.preventDefault(); }, { passive: false });
    document.addEventListener('pointerdown', () => Audio.init(), { once: true });
    last = performance.now(); requestAnimationFrame(loop);
    if (import.meta.env?.DEV || /[?&]debug=1\b/.test(location.search)) window.__DR = { STEP, Scenes: SceneManager, Bus, Data: { SKILLS, EVOLUTIONS, SKILL_BY_ID, PACKAGES, MYSTERY_POOL, FINAL_FORBIDDEN, CONFIG }, Art, G, Game, Save, UI, Main: M, CHAPTERS, MapBuilder, Nav, SkillMgr, Progression, View, Input, ENEMY_DB };
  }
  M.init = init; M.resize = () => resize();
  return M;
})();
