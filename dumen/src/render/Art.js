// Ortak çizim yardımcıları: elle çizilmiş his veren kalın kontur, ahşap/halat/dalga/bulut, renk araçları, sprite önbelleği.
(function (D) {
  'use strict';
  const OL = '#2a1a10';
  const Art = { OL };

  Art.hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  Art.rgb = (r, g, b, a) => (a == null ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`);
  Art.shade = (h, amt) => { const [r, g, b] = Art.hex(h); const f = (c) => (amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)); return Art.rgb(f(r), f(g), f(b)); };
  Art.alpha = (h, a) => { const [r, g, b] = Art.hex(h); return Art.rgb(r, g, b, a); };
  Art.mix = (h1, h2, t) => { const a = Art.hex(h1), b = Art.hex(h2); return Art.rgb(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); };

  Art.rr = (c, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  };
  Art.fs = (c, fill, lw, stroke) => {
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (lw) { c.lineWidth = lw; c.strokeStyle = stroke || OL; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  };
  Art.ellipse = (c, x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); };
  Art.circle = (c, x, y, r) => { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); };
  Art.lg = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(Array.isArray(s) ? s[0] : i / (stops.length - 1), Array.isArray(s) ? s[1] : s)); return g; };
  Art.rg = (c, x, y, r0, r1, stops) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((s, i) => g.addColorStop(Array.isArray(s) ? s[0] : i / (stops.length - 1), Array.isArray(s) ? s[1] : s)); return g; };
  // Deterministik süs rastgeleliği
  Art.rand = (seed) => { const r = new D.RNG(seed); return () => r.float(); };
  // Elle çizilmiş titrek poligon
  Art.wobblyPoly = (c, pts, seed, amp) => {
    const r = Art.rand(seed || 7); amp = amp == null ? 2 : amp;
    c.beginPath();
    pts.forEach(([x, y], i) => { const jx = (r() - 0.5) * amp, jy = (r() - 0.5) * amp; if (i === 0) c.moveTo(x + jx, y + jy); else c.lineTo(x + jx, y + jy); });
    c.closePath();
  };
  Art.planks = (c, x, y, w, h, color, n, vertical) => {
    Art.rr(c, x, y, w, h, 4); Art.fs(c, color, 4);
    c.save(); Art.rr(c, x, y, w, h, 4); c.clip();
    c.strokeStyle = Art.shade(color, -0.35); c.lineWidth = 2.5;
    const r = Art.rand(Math.floor(x * 13 + y * 7));
    for (let i = 1; i < n; i++) {
      c.beginPath();
      if (vertical) { const px = x + (w / n) * i; c.moveTo(px, y); c.lineTo(px + (r() - 0.5) * 3, y + h); }
      else { const py = y + (h / n) * i; c.moveTo(x, py); c.lineTo(x + w, py + (r() - 0.5) * 3); }
      c.stroke();
    }
    // budaklar
    c.fillStyle = Art.shade(color, -0.25);
    for (let i = 0; i < n; i++) { Art.ellipse(c, x + r() * w, y + r() * h, 4 + r() * 4, 2 + r() * 2); c.fill(); }
    c.restore();
  };
  Art.rope = (c, x1, y1, x2, y2, sag, color) => {
    c.save();
    c.lineCap = 'round';
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag;
    c.strokeStyle = OL; c.lineWidth = 8;
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
    c.strokeStyle = color || '#d8b47a'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
    c.strokeStyle = Art.shade(color || '#d8b47a', -0.35); c.lineWidth = 1.6; c.setLineDash([5, 6]);
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
    c.restore();
  };
  Art.cloud = (c, x, y, s, color) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath();
    c.arc(0, 0, 40, Math.PI * 0.5, Math.PI * 1.5); c.arc(40, -30, 45, Math.PI, Math.PI * 1.85);
    c.arc(100, -20, 40, Math.PI * 1.2, Math.PI * 0.1); c.arc(110, 10, 30, Math.PI * 1.6, Math.PI * 0.5); c.closePath();
    Art.fs(c, color || '#fffaf0', 4, Art.alpha('#2a1a10', 0.35));
    c.restore();
  };
  Art.waves = (c, x0, x1, y, amp, len, phase, fill, stroke, bottom) => {
    c.beginPath(); c.moveTo(x0, bottom);
    c.lineTo(x0, y);
    for (let x = x0; x <= x1 + len; x += 12) c.lineTo(x, y + Math.sin((x / len) * Math.PI * 2 + phase) * amp + Math.sin((x / (len * 0.43)) + phase * 1.7) * amp * 0.3);
    c.lineTo(x1 + len, bottom); c.closePath();
    c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 3; c.stroke(); }
  };
  Art.sparkles = (c, list, t, color) => {
    c.fillStyle = color;
    for (const [x, y, ph, s] of list) {
      const a = 0.5 + 0.5 * Math.sin(t * 3 + ph);
      c.globalAlpha = a; c.beginPath();
      c.moveTo(x, y - s); c.lineTo(x + s * 0.3, y); c.lineTo(x, y + s); c.lineTo(x - s * 0.3, y); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y + s * 0.3); c.lineTo(x + s, y); c.lineTo(x, y - s * 0.3); c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
  };
  // Tabela yazısı (canvas içinde)
  Art.signText = (c, txt, x, y, size, color, stroke, font) => {
    c.save();
    c.font = `${font || 800} ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (stroke) { c.lineWidth = size * 0.18; c.strokeStyle = stroke; c.lineJoin = 'round'; c.strokeText(txt, x, y); }
    c.fillStyle = color; c.fillText(txt, x, y);
    c.restore();
  };
  Art.window = (c, x, y, w, h, lit, frame) => {
    Art.rr(c, x, y, w, h, 6); Art.fs(c, lit ? Art.lg(c, x, y, x, y + h, ['#fff4c2', '#ffc861']) : Art.lg(c, x, y, x, y + h, ['#9fd0e8', '#4f87a8']), 4);
    c.strokeStyle = frame || '#f6efe0'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x + w / 2, y + 3); c.lineTo(x + w / 2, y + h - 3); c.moveTo(x + 3, y + h / 2); c.lineTo(x + w - 3, y + h / 2); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(x + 6, y + 6); c.lineTo(x + w * 0.35, y + 6); c.lineTo(x + 6, y + h * 0.4); c.fill();
  };
  Art.shadow = (c, x, y, rx, ry, a) => { Art.ellipse(c, x, y, rx, ry); c.fillStyle = `rgba(20,10,5,${a == null ? 0.25 : a})`; c.fill(); };

  // Offscreen önbellek
  const cache = new Map();
  Art.makeCanvas = (w, h) => {
    if (typeof OffscreenCanvas !== 'undefined') { try { return new OffscreenCanvas(Math.ceil(w), Math.ceil(h)); } catch (e) { /* geri dön */ } }
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h); return cv;
  };
  Art.cached = (key, w, h, draw) => {
    let e = cache.get(key);
    if (!e) {
      const cv = Art.makeCanvas(w, h); const cx = cv.getContext('2d');
      draw(cx, w, h);
      e = cv; cache.set(key, e);
      if (cache.size > 400) cache.delete(cache.keys().next().value);
    }
    return e;
  };
  Art.clearCache = (prefix) => { for (const k of [...cache.keys()]) if (!prefix || k.startsWith(prefix)) cache.delete(k); };
  D.Art = Art;
})(globalThis.DUMEN);
