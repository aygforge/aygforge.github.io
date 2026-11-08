// Atlas page loading (24 PNG pages), spriteId → rect lookup, missing-asset reporting, avatar composition
// (skin recolor + tinted outfit/hair masks) cached once per appearance.
export const SKIN_TONES = [['#f1c8a4', '#d9a886', '#b9876a'], ['#d9a27b', '#bf8962', '#9c6a4c'], ['#a96f4b', '#8e5a3b', '#71452c'], ['#6e4430', '#5a3626', '#43271b']];
export const HAIR_COLORS = ['#2a2420', '#6a3e22', '#c8913a', '#b8452a', '#d8d4c8'];
export const OUTFITS = [['#3d7ab8', '#2a5a8a'], ['#c8643c', '#8a3e22'], ['#4f9a5a', '#2f6a3a']];
const SKIN_RAMP = ['#f1c8a4', '#d9a886', '#b9876a'];

const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export class SpriteAtlas {
  constructor(index, basePath = '', native = {}) {
    this.index = index; this.base = basePath; this.native = native || {}; this.pages = []; this.missing = new Set(); this.avatarCache = new Map();
  }
  async load(onProgress) {
    let done = 0;
    this.pages = await Promise.all(this.index.pages.map((p) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => { done++; onProgress?.(done / this.index.pages.length); res(img); };
      img.onerror = () => rej(new Error('Atlas yüklenemedi: ' + p));
      img.src = this.base + p;
    })));
  }
  has(id) { return !!this.index.sprites[id]; }
  rect(id) { return this.index.sprites[id]; }
  /** draw sprite with anchor: ax,ay fraction of size (0.5,1 = bottom center) */
  draw(ctx, id, x, y, { ax = 0.5, ay = 1, alpha = 1, flip = false, scale = 1 } = {}) {
    const r = this.index.sprites[id];
    if (!r) { if (!this.missing.has(id)) { this.missing.add(id); console.error('[SpriteAtlas] missing sprite', id); } return false; }
    const [pi, sx, sy, w, h] = r;
    const k = scale * (this.native[id]?.scale || 1); // imported x1 art is drawn at its native integer scale
    const dw = w * k, dh = h * k;
    const dx = Math.round(x - dw * ax), dy = Math.round(y - dh * ay);
    if (alpha !== 1) ctx.globalAlpha = alpha;
    if (flip) { ctx.save(); ctx.translate(dx + dw, dy); ctx.scale(-1, 1); ctx.drawImage(this.pages[pi], sx, sy, w, h, 0, 0, dw, dh); ctx.restore(); }
    else ctx.drawImage(this.pages[pi], sx, sy, w, h, dx, dy, dw, dh);
    if (alpha !== 1) ctx.globalAlpha = 1;
    return true;
  }
  /** CSS background for DOM icons */
  css(id, size) {
    const r = this.index.sprites[id]; if (!r) return '';
    let [pi, x, y, w, h] = r;
    const bb = this.native[id]?.bbox; // crop DOM icons to the art's bounding box (x1 imports sit small inside big rects)
    if (bb) { const side = Math.max(bb[2] - bb[0], bb[3] - bb[1]); x += Math.round((bb[0] + bb[2] - side) / 2); y += Math.round((bb[1] + bb[3] - side) / 2); w = side; h = side; }
    const k = size / Math.max(w, h);
    return `background-image:url(${this.base}${this.index.pages[pi]});background-size:${1024 * k}px ${1024 * k}px;background-position:${-x * k}px ${-y * k}px;`;
  }
  /** true when the sprite was imported from the farm asset pack at x1 (renderer then skips legacy down-scaling). */
  isNative(id) { return (this.native[id]?.scale || 1) > 1; }
  /** Extract sprite to its own canvas (for compositing). */
  extract(id) {
    const r = this.index.sprites[id]; if (!r) return null;
    const [pi, x, y, w, h] = r; const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(this.pages[pi], x, y, w, h, 0, 0, w, h); return c;
  }

  /** Composite avatar frame for an appearance; cached once per (appearance,pose). */
  avatarFrame(app, clip, dir, frame) {
    const key = `${app.body}|${app.skin}|${app.hair}|${app.hairColor}|${app.outfit}|${clip}|${dir}|${frame}`;
    let c = this.avatarCache.get(key); if (c) return c;
    if (this.avatarCache.size > 900) this.avatarCache.clear();
    const bodyId = `avatar/${app.body}/${clip}/${dir}/${frame}`;
    const body = this.extract(bodyId) || this.extract(`avatar/${app.body}/idle/down/0`);
    const ctx = body.getContext('2d'); const img = ctx.getImageData(0, 0, body.width, body.height);
    const tone = SKIN_TONES[app.skin].map(hexRgb); const ramp = SKIN_RAMP.map(hexRgb);
    for (let i = 0; i < img.data.length; i += 4) {
      if (!img.data[i + 3]) continue;
      for (let k = 0; k < 3; k++) if (img.data[i] === ramp[k][0] && img.data[i + 1] === ramp[k][1] && img.data[i + 2] === ramp[k][2]) { img.data[i] = tone[k][0]; img.data[i + 1] = tone[k][1]; img.data[i + 2] = tone[k][2]; break; }
    }
    ctx.putImageData(img, 0, 0);
    const mask = this.extract(`avatar/clothing_mask/${clip}/${dir}/${frame}`);
    // the clothing mask is shared by both bodies: clip it to the body's own pixels (never paint outside the silhouette)
    if (mask) { ctx.globalCompositeOperation = 'source-atop'; ctx.drawImage(this.tint(mask, OUTFITS[app.outfit][0]), 0, 0); ctx.globalCompositeOperation = 'source-over'; }
    this.avatarCache.set(key, body);
    return body;
  }
  hairFrame(app, dir) {
    const key = `hair|${app.hair}|${app.hairColor}|${dir}`;
    let c = this.avatarCache.get(key); if (c) return c;
    const h = this.extract(`avatar/hair/${app.hair}/${dir}`); c = this.tint(h, HAIR_COLORS[app.hairColor]);
    this.avatarCache.set(key, c); return c;
  }
  /** grayscale-mask tint: color × luminance, keeps dark outline */
  tint(canvas, color) {
    const [r, g, b] = hexRgb(color); const ctx = canvas.getContext('2d'); const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
      if (!img.data[i + 3]) continue; const R = img.data[i], G = img.data[i + 1], B = img.data[i + 2];
      if (R === G && G === B) { const l = R / 200; img.data[i] = Math.min(255, r * l); img.data[i + 1] = Math.min(255, g * l); img.data[i + 2] = Math.min(255, b * l); }
    }
    ctx.putImageData(img, 0, 0); return canvas;
  }
}
