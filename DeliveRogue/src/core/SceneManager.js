// core/SceneManager.js — 8 independent scenes, one active scene, explicit lifecycle.
//
// Scene contract (src/scenes/*.js):
//   { id, hub, navIndex, backdrop, canvas: 'menu'|'game'|null, engine?: 'game',
//     enter(ctx, params), exit(ctx), update?(dt, ctx), back?(ctx) -> bool, refresh?(ctx) }
// Every scene owns its own root <section>. `ctx` scopes listeners / timers / intervals to the scene and
// disposes them on exit, so no RAF, listener or timer outlives its scene. Only the active scene gets
// update(). During a transition the input layer is locked and further navigation requests are ignored
// (single target, rapid taps debounced). Incoming scene is mounted before the outgoing one is removed,
// so there is never a black frame or two interactive scenes.
const DUR = { hub: 280, back: 300, boot: 700, launch: 500, result: 600, fade: 260 };

export const SceneManager = (() => {
  const scenes = {}, listeners = [];
  let layer = null, blocker = null, active = null, activeCtx = null, activeId = null, prevCanvas = null;
  let transitioning = false, lastNav = -Infinity, reduced = () => false, hooks = { onSceneChange: () => {} };

  function register(...list) { list.forEach(s => { scenes[s.id] = s; }); }
  function init(layerEl, blockerEl, opts = {}) { layer = layerEl; blocker = blockerEl; if (opts.reducedMotion) reduced = opts.reducedMotion; if (opts.onSceneChange) hooks.onSceneChange = opts.onSceneChange; }

  function makeCtx(id, root) {
    const offs = [], timers = new Set(), ivs = new Set();
    let disposed = false;
    const ctx = {
      id, root, params: {},
      get alive() { return !disposed; },
      on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); offs.push(() => target.removeEventListener(ev, fn, opt)); },
      timeout(fn, ms) { const t = setTimeout(() => { timers.delete(t); if (!disposed) fn(); }, ms); timers.add(t); return t; },
      interval(fn, ms) { const t = setInterval(() => { if (!disposed) fn(); }, ms); ivs.add(t); return t; },
      dispose() { disposed = true; offs.splice(0).forEach(f => f()); timers.forEach(clearTimeout); ivs.forEach(clearInterval); timers.clear(); ivs.clear(); },
    };
    return ctx;
  }
  function kindFor(prev, next, opt) {
    if (opt.kind) return opt.kind;
    if (!prev) return 'boot';
    if (next.id === 'FightScene') return 'launch';
    if (next.id === 'RunSummary') return 'result';
    if (prev.hub && next.hub) return (next.navIndex ?? 0) >= (prev.navIndex ?? 0) ? 'hub' : 'back';
    return 'fade';
  }
  function setBlock(v) { if (blocker) blocker.classList.toggle('on', v); }

  /** Navigate. Returns false when ignored (in transition, same scene, debounce, unknown id). */
  function go(id, params = {}, opt = {}) {
    const next = scenes[id];
    if (!next) { console.error('[SceneManager] unknown scene', id); return false; }
    if (transitioning) return false;
    if (id === activeId && !opt.force) return false;
    const now = performance.now();
    if (!opt.force && now - lastNav < 180) return false;
    lastNav = now;
    const prev = active, prevCtx = activeCtx, prevRoot = prevCtx && prevCtx.root;
    const kind = kindFor(prev, next, opt);
    const dur = reduced() ? 0 : DUR[kind] || DUR.fade;

    const root = document.createElement('section');
    root.className = 'scene scene-' + id; root.dataset.scene = id;
    layer.appendChild(root);
    const ctx = makeCtx(id, root); ctx.params = params;
    transitioning = true; setBlock(true);
    prevCanvas = prev ? prev.canvas : null;
    active = next; activeCtx = ctx; activeId = id;
    try { next.enter(ctx, params); } catch (e) { console.error('[SceneManager] enter failed', id, e); }
    hooks.onSceneChange(next, prev);
    listeners.forEach(f => f(id, prev && prev.id));

    const finish = () => {
      if (prev) { try { prev.exit && prev.exit(prevCtx); } catch (e) { console.error('[SceneManager] exit failed', prev.id, e); } prevCtx.dispose(); prevRoot.remove(); }
      root.classList.remove('t-in', 't-' + kind); prevCanvas = null;
      transitioning = false; setBlock(false);
    };
    if (dur <= 0) { finish(); return true; }
    root.style.setProperty('--t', dur + 'ms'); root.classList.add('t-in', 't-' + kind);
    if (prevRoot) { prevRoot.style.setProperty('--t', dur + 'ms'); prevRoot.classList.add('t-out', 't-' + kind); }
    setTimeout(finish, dur + 20);
    return true;
  }
  /** Hardware/ESC back: scene may consume it (sub-view / pause). Otherwise hub -> MainMenu. */
  function back() {
    if (transitioning || !active) return false;
    if (active.back && active.back(activeCtx)) return true;
    if (active.hub && activeId !== 'MainMenu') return go('MainMenu');
    return false;
  }
  function update(dt) { if (active && active.update) active.update(dt, activeCtx); }
  function refresh() { if (active && active.refresh) active.refresh(activeCtx); }
  return {
    register, init, go, back, update, refresh,
    onChange(f) { listeners.push(f); },
    get current() { return activeId; }, get scene() { return active; }, get ctx() { return activeCtx; },
    get transitioning() { return transitioning; }, get ids() { return Object.keys(scenes); },
    /** Canvas usage of visible scenes (union of outgoing + incoming during a transition). */
    get canvasModes() { const s = new Set(); if (active && active.canvas) s.add(active.canvas); if (transitioning && prevCanvas) s.add(prevCanvas); return s; },
    DUR,
  };
})();
