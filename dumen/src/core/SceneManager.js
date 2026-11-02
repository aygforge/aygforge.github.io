// Sahne yöneticisi + ana döngü. Sahne örneği değişse de GameState korunur.
(function (D) {
  'use strict';
  const SM = {
    defs: {}, cur: null, name: null, t: 0, last: 0, acc: 0, ctx: null, prev: null, params: null, frame: 0,
    register(name, def) { SM.defs[name] = def; },
    go(name, params) {
      const def = SM.defs[name]; if (!def) throw new Error('Sahne yok: ' + name);
      D.Input.releaseAll(); D.UI.closeAll(); D.Input.block(300);
      const fade = document.getElementById('fade');
      const reduce = D.Game.settings && D.Game.settings.reducedMotion;
      const swap = () => {
        if (SM.cur && SM.cur.exit) SM.cur.exit();
        const ui = document.getElementById('ui'); D.UI.clear(ui);
        SM.prev = SM.name; SM.name = name; SM.params = params || {};
        const sc = Object.create(def); sc.root = D.UI.h('div', { class: 'scene-root', style: { position: 'absolute', inset: '0' } }); ui.append(sc.root);
        sc.t = 0; SM.cur = sc;
        D.Game.active = def.activeTime !== false;
        D.HUD.set('none');
        if (sc.enter) sc.enter(SM.params);
        if (def.music) D.Audio.music(typeof def.music === 'function' ? def.music(SM.params) : def.music);
        fade.classList.remove('on');
      };
      if (reduce || !SM.name) swap(); else { fade.classList.add('on'); setTimeout(swap, 170); }
    },
    rebuild() { if (SM.cur && SM.cur.build) SM.cur.build(); },
    staticLayer(key, draw) {
      const v = D.UI.view; const k = v.scale * v.dpr;
      return D.Art.cached('scene:' + key + ':' + v.W + 'x' + v.H + ':' + k.toFixed(3), v.W * k, v.H * k, (c) => { c.scale(k, k); draw(c, v.W, v.H); });
    },
    drawStatic(c, key, draw) { const v = D.UI.view; c.drawImage(SM.staticLayer(key, draw), 0, 0, v.W, v.H); },
    loop(ts) {
      requestAnimationFrame(SM.loop);
      if (document.hidden) { SM.last = ts; return; }
      let dt = SM.last ? (ts - SM.last) / 1000 : 0.016; SM.last = ts;
      dt = Math.min(dt, 0.1);
      const low = D.Game.settings && D.Game.settings.lowPower;
      SM.acc += dt; if (low && SM.acc < 1 / 31) return;
      dt = SM.acc; SM.acc = 0;
      SM.t += dt;
      if (!D.UI.modalOpen() || (SM.cur && SM.cur.tickInModal)) D.Game.tick(dt);
      const sc = SM.cur; if (!sc) return;
      sc.t += dt;
      try { if (sc.update) sc.update(dt); } catch (e) { console.error('update', e); }
      const v = D.UI.view, c = SM.ctx;
      c.setTransform(v.scale * v.dpr, 0, 0, v.scale * v.dpr, 0, 0);
      try { if (sc.render) sc.render(c, v.W, v.H, SM.t); } catch (e) { console.error('render', e); }
    },
    start() {
      SM.ctx = document.getElementById('cv').getContext('2d');
      requestAnimationFrame(SM.loop);
    }
  };
  D.SM = SM;
  D.Scenes = D.Scenes || {};
})(globalThis.DUMEN);
