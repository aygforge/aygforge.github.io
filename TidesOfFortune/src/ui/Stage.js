// 1280×720 referans koordinat sistemi; 16:9 – 20:9 ekranlarda genişlik uzar, 4:3'te yükseklik uzar.
// Sahne CSS transform ile ölçeklenir; çentik/güvenli alan boşlukları mantıksal pikselle uygulanır.

export class Stage {
  constructor(stageEl, rotateEl, onResize) {
    this.el = stageEl;
    this.rotateEl = rotateEl;
    this.onResize = onResize;
    this.W = 1280;
    this.H = 720;
    this.scale = 1;
    this.probe = document.createElement('div');
    this.probe.style.cssText = 'position:fixed;inset:0;pointer-events:none;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(this.probe);
    const relayout = () => this.layout();
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', () => setTimeout(relayout, 120));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', relayout);
    this.layout();
  }

  layout() {
    const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const portrait = vh > vw * 1.05;
    this.rotateEl.classList.toggle('show', portrait);
    const aspect = portrait ? vh / vw : vw / vh;
    let W, H;
    if (aspect >= 16 / 9) {
      H = 720;
      W = Math.min(1680, Math.round(720 * aspect));
    } else {
      W = 1280;
      H = Math.min(960, Math.round(1280 / aspect));
    }
    const scale = portrait ? Math.min(vh / W, vw / H) : Math.min(vw / W, vh / H);
    this.W = W;
    this.H = H;
    this.scale = scale;
    const s = this.el.style;
    s.width = W + 'px';
    s.height = H + 'px';
    s.transform = `translate(-50%, -50%) scale(${scale})`;
    const cs = getComputedStyle(this.probe);
    const px = (v) => (parseFloat(v) || 0) / scale;
    s.setProperty('--safe-l', px(cs.paddingLeft) + 'px');
    s.setProperty('--safe-r', px(cs.paddingRight) + 'px');
    s.setProperty('--safe-t', px(cs.paddingTop) + 'px');
    s.setProperty('--safe-b', px(cs.paddingBottom) + 'px');
    if (this.onResize) this.onResize(W, H);
  }

  /** Ekran koordinatını mantıksal koordinata çevirir */
  toLogical(clientX, clientY) {
    const r = this.el.getBoundingClientRect();
    return { x: (clientX - r.left) / this.scale, y: (clientY - r.top) / this.scale };
  }
}

export function toggleFullscreen() {
  const d = document;
  const el = d.documentElement;
  if (!d.fullscreenElement && !d.webkitFullscreenElement) {
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) {
      const p = req.call(el, { navigationUI: 'hide' });
      if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch { /* */ } }).catch(() => {});
    }
  } else {
    const ex = d.exitFullscreen || d.webkitExitFullscreen;
    if (ex) ex.call(d);
  }
}
