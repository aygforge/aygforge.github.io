// ===== core engine: pencil drawing helpers, paper, CRT pipeline =====
const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const INK = '#2a2450';         // dark navy / purple outline
const NAVY = '#1d1f45';
const CYAN = '#6fc9cf', MAG = '#c46a9e', AGREEN = '#7fc77a', CREAM = '#f2e8d5';
let T = 0, FR = 0, BOIL = 0;

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
function mul32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rcOf(c) { return c.canvas._rc || (c.canvas._rc = rough.canvas(c.canvas)); }

// pencil shape: translucent crayon base + hachure strokes + wobbly outline
function P(c, kind, args, o = {}) {
  const rc = rcOf(c);
  if ((kind === 'polygon' || kind === 'linearPath' || kind === 'curve') && typeof args[0][0] === 'number') args = [args];
  const seed = ((o.seed || 1) * 7919 + (o.still ? 0 : BOIL) * 131 + 17) % 2147483646 + 1;
  const r = o.r ?? 1.2;
  const base = { roughness: r, bowing: o.bow ?? 1, seed, strokeWidth: o.sw ?? 3, stroke: o.stroke ?? INK, preserveVertices: false };
  const A = o.alpha ?? 1;
  if (o.fill) {
    c.save(); c.globalAlpha = (o.solid ?? 0.62) * A;
    rc[kind](...args, { ...base, stroke: 'none', fill: o.fill, fillStyle: 'solid', roughness: r * 0.45 });
    c.restore();
    if (o.hatch !== false) {
      c.save(); c.globalAlpha = A * (o.hatchA ?? 0.85);
      rc[kind](...args, { ...base, stroke: 'none', fill: o.hfill || o.fill, fillStyle: o.fs || 'hachure', hachureGap: o.gap ?? 6, hachureAngle: o.angle ?? -41, fillWeight: o.fw ?? 1.7 });
      c.restore();
    }
  }
  if (o.stroke !== 'none') { c.save(); c.globalAlpha = A * (o.strokeA ?? 1); rc[kind](...args, { ...base }); c.restore(); }
}
function rrPath(x, y, w, h, r) {
  return `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
}
function rrClip(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); c.clip(); }
function glow(c, x, y, r, col, a) {
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
// scribbly pencil line (non-rough, faster) for many small strokes
function pencilLine(c, pts, col, w, a = 1) {
  c.save(); c.strokeStyle = col; c.lineWidth = w; c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); c.restore();
}

// ---------- layer cache (static art per boil frame) ----------
const LAYERS = new Map();
function layer(key, fn, w = W, h = H) {
  const k = key + '|' + BOIL;
  let cv = LAYERS.get(k);
  if (!cv) { cv = mk(w, h); const c = cv.getContext('2d'); fn(c); LAYERS.set(k, cv); }
  return cv;
}

// ---------- paper ----------
let PAPER, GRAIN, BAND;
function buildPaper() {
  const rnd = mul32(42);
  PAPER = mk(W, H); let c = PAPER.getContext('2d');
  c.fillStyle = CREAM; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { // blotches
    const x = rnd() * W, y = rnd() * H, r = 80 + rnd() * 300;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rnd() > .5 ? 'rgba(200,170,120,0.07)' : 'rgba(255,250,235,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  const id = c.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
  c.putImageData(id, 0, 0);
  for (let i = 0; i < 900; i++) { // fibers
    const x = rnd() * W, y = rnd() * H, a = rnd() * Math.PI, l = 6 + rnd() * 18;
    c.strokeStyle = rnd() > .5 ? 'rgba(120,90,60,0.06)' : 'rgba(255,255,255,0.12)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  // grain for multiply over everything
  GRAIN = mk(W + 40, H + 40); c = GRAIN.getContext('2d');
  const gd = c.createImageData(W + 40, H + 40); const g2 = gd.data;
  for (let i = 0; i < g2.length; i += 4) { const v = 225 + rnd() * 30 + (rnd() > 0.985 ? -40 : 0); g2[i] = v; g2[i + 1] = v - 2; g2[i + 2] = v - 8; g2[i + 3] = 255; }
  c.putImageData(gd, 0, 0);
  // caption band with fade
  BAND = mk(W, 560); c = BAND.getContext('2d');
  c.drawImage(PAPER, 0, 0, W, 560, 0, 0, W, 560);
  c.globalCompositeOperation = 'destination-in';
  const lg = c.createLinearGradient(0, 0, 0, 560); lg.addColorStop(0, '#000'); lg.addColorStop(410 / 560, '#000'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = lg; c.fillRect(0, 0, W, 560);
}

// ---------- CRT screen pipeline ----------
const SW = 360, SH = 270;
const PROG = mk(SW, SH), PCX = PROG.getContext('2d');
const FX = mk(SW, SH), FCX = FX.getContext('2d');
const TR = mk(SW, SH), TRX = TR.getContext('2d');
const TC = mk(SW, SH), TCX = TC.getContext('2d');
const TMP = mk(SW, SH), TMX = TMP.getContext('2d');
let STATICS = [];
function buildStatic() {
  const rnd = mul32(7);
  for (let k = 0; k < 10; k++) {
    const cv = mk(180, 135), c = cv.getContext('2d'); const id = c.createImageData(180, 135), d = id.data;
    for (let y = 0; y < 135; y++) {
      const band = rnd() > 0.93 ? 60 : 0; const rowb = (rnd() - 0.5) * 40;
      for (let x = 0; x < 180; x++) { const i = (y * 180 + x) * 4; const v = clamp(rnd() * 255 + band + rowb, 0, 255); d[i] = v; d[i + 1] = v; d[i + 2] = v + 6; d[i + 3] = 255; }
    }
    c.putImageData(id, 0, 0); STATICS.push(cv);
  }
}
let SCAN;
function buildScan() { SCAN = mk(8, 8); const c = SCAN.getContext('2d'); c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(0, 0, 8, 2); c.fillStyle = 'rgba(255,255,255,0.03)'; c.fillRect(0, 4, 8, 1); }

function staticFrame(k = 0) { return STATICS[(FR * 3 + k * 7) % STATICS.length]; }

// program renderer is defined in scenes.js: drawProgram(c, name, t, opts)
function screen(name, t, fx = {}, popts = {}) {
  PCX.save(); PCX.setTransform(1, 0, 0, 1, 0, 0); PCX.fillStyle = '#111'; PCX.fillRect(0, 0, SW, SH);
  if (name !== 'static' && name !== 'off') drawProgram(PCX, name, t, popts);
  PCX.restore();
  return applyFX(PROG, fx);
}
function applyFX(src, fx) {
  const d = FCX; d.save(); d.setTransform(1, 0, 0, 1, 0, 0); d.globalAlpha = 1; d.globalCompositeOperation = 'source-over';
  d.fillStyle = '#000'; d.fillRect(0, 0, SW, SH);
  const roll = ((fx.roll || 0) % SH + SH) % SH;
  const strip = 3, tear = fx.tear || 0, bend = fx.bend || 0;
  const seg = 5 + Math.floor(hash(FR * 0.71) * 18);
  for (let y = 0; y < SH; y += strip) {
    let off = 0;
    if (bend) off += bend * (Math.sin(y * 0.03 + T * 7) * 26 + (y / SH) * 40);
    if (tear) {
      const n = hash(Math.floor(y / seg) * 3.1 + FR * 0.37);
      if (n > 0.72) off += (n - 0.72) * tear * 380 * (hash(y * 0.11 + FR) > 0.5 ? 1 : -1);
      else off += tear * 4 * (hash(y * 1.3 + FR) - 0.5);
    }
    if (fx.wobble) off += fx.wobble * Math.sin(y * 0.08 + T * 3) * 3;
    const sy = (y + roll) % SH;
    d.drawImage(src, 0, sy, SW, strip, off, y, SW, strip);
    if (off > 0) d.drawImage(src, SW - off, sy, off, strip, 0, y, off, strip);
  }
  if (fx.roll) { // vertical hold bar
    const by = (SH - roll) % SH; d.fillStyle = '#000'; d.fillRect(0, by - 10, SW, 16);
    d.fillStyle = 'rgba(255,255,255,0.15)'; d.fillRect(0, by + 6, SW, 2);
  }
  if (fx.rgb) { // channel separation
    TRX.globalCompositeOperation = 'source-over'; TRX.drawImage(FX, 0, 0); TRX.globalCompositeOperation = 'multiply'; TRX.fillStyle = '#ff0000'; TRX.fillRect(0, 0, SW, SH);
    TCX.globalCompositeOperation = 'source-over'; TCX.drawImage(FX, 0, 0); TCX.globalCompositeOperation = 'multiply'; TCX.fillStyle = '#00ffff'; TCX.fillRect(0, 0, SW, SH);
    d.fillStyle = '#000'; d.fillRect(0, 0, SW, SH); d.globalCompositeOperation = 'lighter';
    const dx = fx.rgb; d.drawImage(TR, dx, 0); d.drawImage(TC, -dx, 0); d.globalCompositeOperation = 'source-over';
  }
  if (fx.ghost) { d.globalCompositeOperation = 'screen'; d.globalAlpha = fx.ghost * 0.4; d.drawImage(FX, 7, 0); d.drawImage(FX, -4, 1); d.globalAlpha = 1; d.globalCompositeOperation = 'source-over'; }
  if (fx.bleed) {
    for (let i = 0; i < 3; i++) { const y = hash(FR * 0.13 + i) * SH, h = 4 + hash(i + FR) * 14; d.globalAlpha = fx.bleed * 0.35; d.fillStyle = i % 2 ? MAG : CYAN; d.globalCompositeOperation = 'screen'; d.fillRect(0, y, SW, h); }
    d.globalAlpha = 1; d.globalCompositeOperation = 'source-over';
  }
  if (fx.noise) { d.globalAlpha = fx.noise * 0.35; d.globalCompositeOperation = 'overlay'; d.imageSmoothingEnabled = false; d.drawImage(staticFrame(1), 0, 0, SW, SH); d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1;
    for (let i = 0; i < 4; i++) if (hash(FR * 1.7 + i) < fx.noise) { d.fillStyle = 'rgba(255,255,255,0.55)'; d.fillRect(hash(i * 3 + FR) * SW, hash(i * 5 + FR * 2) * SH, 20 + hash(i + FR) * 90, 1.5); }
  }
  if (fx.staticA) { d.globalAlpha = clamp(fx.staticA); d.imageSmoothingEnabled = false; d.drawImage(staticFrame(0), 0, 0, SW, SH); d.globalAlpha = 1; d.imageSmoothingEnabled = true; }
  if (fx.corner) {
    TMX.globalCompositeOperation = 'source-over'; TMX.clearRect(0, 0, SW, SH); TMX.imageSmoothingEnabled = false; TMX.drawImage(staticFrame(2), 0, 0, SW, SH);
    TMX.globalCompositeOperation = 'destination-out';
    const g = TMX.createRadialGradient(SW / 2, SH / 2, 40, SW / 2, SH / 2, 230 - fx.corner * 70); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.75, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    TMX.fillStyle = g; TMX.fillRect(0, 0, SW, SH);
    d.globalAlpha = clamp(fx.corner); d.drawImage(TMP, 0, 0); d.globalAlpha = 1;
  }
  if (fx.bright) { d.fillStyle = `rgba(255,255,255,${fx.bright})`; d.fillRect(0, 0, SW, SH); }
  if (fx.dark) { d.fillStyle = `rgba(0,0,0,${fx.dark})`; d.fillRect(0, 0, SW, SH); }
  d.restore();
  return FX;
}
// blit a processed screen into a rect with CRT glass treatment
function blitScreen(c, img, x, y, w, h, r = 30, o = {}) {
  c.save(); rrClip(c, x, y, w, h, r);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.drawImage(img, x - w * 0.02, y - h * 0.02, w * 1.04, h * 1.04);
  // scanlines
  c.save(); c.translate(0, (T * 30) % 8); c.fillStyle = c.createPattern(SCAN, 'repeat'); c.fillRect(x, y - 8, w, h + 16); c.restore();
  // rolling brighter band
  const by = y + ((T * 0.35) % 1) * h; const lg = c.createLinearGradient(0, by - 60, 0, by + 60);
  lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.06)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(x, by - 60, w, 120);
  // vignette inner
  const rg = c.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = rg; c.fillRect(x, y, w, h);
  // glass streak
  c.globalAlpha = 0.16; c.strokeStyle = '#fff'; c.lineWidth = w * 0.03; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + w * 0.1, y + h * 0.28); c.quadraticCurveTo(x + w * 0.14, y + h * 0.1, x + w * 0.32, y + h * 0.07); c.stroke();
  c.lineWidth = w * 0.012; c.beginPath(); c.moveTo(x + w * 0.1, y + h * 0.4); c.lineTo(x + w * 0.1, y + h * 0.34); c.stroke();
  c.restore();
}
