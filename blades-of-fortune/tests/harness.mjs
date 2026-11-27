// Node test düzeneği: gerçek çekirdek + Event Director + World, sahte 2D tuval bağlamıyla çalışır.
const noop = () => {};
function fakeCtx() {
  const grad = { addColorStop: noop };
  return new Proxy({}, {
    get(t, k) { if (k in t) return t[k]; if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => grad; if (k === 'measureText') return () => ({ width: 10 }); if (k === 'canvas') return { width: 427, height: 240 }; return noop; },
    set(t, k, v) { t[k] = v; return true; },
  });
}
globalThis.OffscreenCanvas = class { constructor(w, h) { this.width = w; this.height = h; } getContext() { return fakeCtx(); } };
export const fakeCanvas = () => ({ width: 427, height: 240, getContext: () => fakeCtx() });

const { Game } = await import('../src/core/game.js');
const { memoryStorage } = await import('../src/engine/save.js');
const { World } = await import('../src/render/world.js');
const { Director, PH } = await import('../src/engine/director.js');
export { Game, memoryStorage, World, Director, PH };

export function makeEnv(storage = memoryStorage()) {
  const game = new Game(storage), world = new World(fakeCanvas());
  const log = { say: 0, float: 0, outcome: 0, combat: 0, docked: 0, ended: 0, banner: 0, sfx: 0 };
  const director = new Director(world, game, {
    say: () => log.say++, float: () => log.float++, banner: () => log.banner++, sfx: () => log.sfx++,
    showOutcome: () => log.outcome++, showCombat: () => log.combat++, hideCombat: noop, onDocked: () => log.docked++, onEnded: () => log.ended++,
  });
  return { game, world, director, log, storage };
}
// Simüle edilmiş zaman: director + world birlikte ilerler
export function tick(env, sec, until = null, step = 1 / 30) {
  for (let t = 0; t < sec; t += step) {
    env.director.update(step); env.world.update(step);
    if (until && until()) return true;
  }
  return until ? until() : true;
}
