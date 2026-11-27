// Blades of Fortune — giriş noktası.
import { Game } from './core/game.js';
import { World, W, H } from './render/world.js';
import { Director, PH } from './engine/director.js';
import { Audio } from './engine/audio.js';
import { UI } from './ui/ui.js';
import { ITEMS } from './data/items.js';

const ARMOR_LOOK = {
  A_LIGHT_1: { body: '#8a6a4a', legs: '#4a3a2a', cape: '#7a2a2a' },
  A_LIGHT_2: { body: '#6a4a2a', legs: '#3a2a1a', cape: '#3a5a2a', hat: 'hood', hatCol: '#4a3a22' },
  A_LIGHT_3: { body: '#2a2a3a', legs: '#1a1a24', cape: '#1a1a2a', hat: 'hood', hatCol: '#22222e' },
  A_MED_1: { body: '#8a8a98', legs: '#4a4a5a', cape: '#7a2a2a', tabard: '#7a2a2a' },
  A_MED_2: { body: '#7a8a7a', legs: '#4a4a3a', cape: '#3a4a6a', tabard: '#3a4a6a', hat: 'helm', hatCol: '#8a9a8a' },
  A_HEAVY_1: { body: '#b8b8c8', legs: '#7a7a8a', cape: '#8a2a2a', hat: 'helmFull', hatCol: '#c8c8d8', big: 1 },
  A_HEAVY_2: { body: '#d8d8e0', legs: '#8a8a9a', cape: '#2a4a9a', tabard: '#2a4a9a', hat: 'helmFull', hatCol: '#e8e8f0', helm: 'gold', big: 1 },
};
const WEAPON_PROP = { sword: 'sword', axe: 'axe', spear: 'spear' };
const ACC_COL = { X_WOLF: '#f0ead8', X_RING: '#4ac88a', X_HOLY: '#f2e080', X_BROOCH: '#f2c14e', X_LOCKET: '#ff6a8a', X_EYE: '#9a6aff' };

function boot() {
  const stage = document.getElementById('stage'), canvas = document.getElementById('scene');
  canvas.width = W; canvas.height = H;
  const game = new Game();
  const world = new World(canvas);
  const audio = new Audio(game.G.settings);
  let ui = null;
  const director = new Director(world, game, {
    onPhase: (p) => ui && ui.onPhase(p),
    say: (at, text, dur, think) => ui && ui.say(at, text, dur, think),
    float: (at, text, col) => ui && ui.float(at, text, col),
    banner: (text) => ui && ui.banner(text),
    sfx: (n) => audio.play(n),
    sync: () => ui && ui.renderHud(),
    showOutcome: (res, ev) => ui && ui.showOutcome(res, ev),
    showCombat: (cb) => ui && ui.showCombat(cb),
    hideCombat: () => ui && ui.hideCombat(),
    onDocked: (town) => ui && ui.onDocked(town),
    onEnded: () => ui && ui.showSummary(),
    onVoyage: () => ui && ui.renderHud(),
    onProgress: () => { const now = performance.now(); if (ui && now - (ui._lp || 0) > 500) { ui._lp = now; ui.renderHud(); } },
  });
  director.setFast(!!game.G.settings.fast);
  ui = new UI({ game, director, world, audio, stage });
  window.__bof = { game, world, director, ui, audio, PH };

  // sahne ölçekleme (1280×720 mantıksal)
  const fit = () => {
    const vw = window.innerWidth, vh = window.innerHeight, s = Math.min(vw / 1280, vh / 720);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    document.getElementById('rotate').classList.toggle('show', vh > vw * 1.1 && vw < 900);
  };
  window.addEventListener('resize', fit); fit();
  document.addEventListener('visibilitychange', () => { if (document.hidden) { game.persist(); audio.suspend(true); } else audio.suspend(false); });
  window.addEventListener('pagehide', () => game.persist());
  document.addEventListener('pointerdown', () => audio.unlock(), { once: false });

  const heroLook = () => {
    const r = game.run; if (!r) { world.heroLook = {}; world.heroProp = 'sword'; return; }
    const a = r.equip.armor, wp = ITEMS[r.equip.weapon];
    world.heroLook = { ...(ARMOR_LOOK[a] || { body: '#7a5a3a', legs: '#4a3a2a', cape: '#6a2a2a' }), hair: '#5a3a1a' };
    world.heroProp = world.hero.cursedBlade ? 'swordDark' : r.equip.weapon === 'W_SWORD_3' ? 'greatsword' : WEAPON_PROP[wp ? wp.fam : 'sword'];
    world.heroAcc = ACC_COL[r.equip.acc] || null;
    world.heroArmorW = a && ITEMS[a] ? ITEMS[a].weight : 'light';
  };

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    heroLook();
    director.update(dt);
    world.update(dt * director.ff);
    world.render();
    ui.frame();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // açılış
  const ld = document.getElementById('loading'); if (ld) { ld.classList.add('hide'); setTimeout(() => ld.remove(), 600); }
  if (game.run && !game.run.ended) ui.showMenu(); else if (game.run && game.run.ended) ui.showSummary(); else ui.showMenu();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
