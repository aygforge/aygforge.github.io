// ---------- core helpers ----------
const W = 1080, H = 1920, FPS = 30;
const VIEW = { l: 34, t: 474, r: 1046, b: 1836 };
const VX = 540, VY = (VIEW.t + VIEW.b) / 2; // 1155
let BOIL = 0, T = 0;

const C = {
  paper: '#F2EADB', ink: '#24204A', inkSoft: '#3A3466', purple: '#2E2347',
  sky0: '#0C1230', sky1: '#18204A', sky2: '#2C2D5A', sky3: '#463F6E',
  raf: '#6F7F93', raf2: '#8C99AA', rafD: '#4B566A',
  green: '#4F5B3E', greenL: '#66704F', greenD: '#353D2B', belly: '#1E1F27',
  snow: '#EEF1F3', snowS: '#C6D2DE', snowB: '#A9B9CB',
  pine: '#1F3A32', pineL: '#2E4E42', pineD: '#142820',
  fire0: '#C9402A', fire1: '#EE7A2B', fire2: '#F6B445', fire3: '#FDE7A0',
  jacket: '#6E4B30', jacketL: '#87603F', collar: '#E8DABA', helmet: '#4E3423', helmetL: '#664530',
  skin: '#E6BE98', skinS: '#CF9E7A', trousers: '#56637A', boot: '#2A2220',
  gray: '#6E725F', grayL: '#858A74', grayD: '#4E5244', cap: '#5D6150',
  glass: '#9FB4C6', metal: '#7D848C', metalD: '#3A3F46', pack: '#8E8865', strap: '#B9AE86',
  wood: '#6A4E36', woodL: '#80613F', woodD: '#4A3626', blanket: '#8A8780', blanketD: '#6E6B66',
  moon: '#F1E6C6',
};

function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function hash2(x, y) { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); }
function noise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; }
function snoise(x) { return noise(x) * 2 - 1; }
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
const easeIn = t => { t = clamp(t); return t * t * t; };
const prog = (t, a, b) => clamp((t - a) / (b - a));
const win = (t, a, b, f = 0.3) => ease(prog(t, a, a + f)) * (1 - ease(prog(t, b - f, b)));
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function jv(id, i, amp) { return (hash(id * 7.13 + i * 1.917 + BOIL * 3.71) - 0.5) * 2 * amp; }

// smooth closed/open path through jittered points
function rpath(pts, closed = true, amp = 1.5, id = 0, poly = false) {
  const p = new Path2D(); const n = pts.length;
  const q = pts.map((pt, i) => [pt[0] + jv(id, i, amp), pt[1] + jv(id + 50.3, i, amp)]);
  if (poly || n < 3) {
    p.moveTo(q[0][0], q[0][1]); for (let i = 1; i < n; i++) p.lineTo(q[i][0], q[i][1]);
    if (closed) p.closePath(); return p;
  }
  if (closed) {
    p.moveTo((q[n - 1][0] + q[0][0]) / 2, (q[n - 1][1] + q[0][1]) / 2);
    for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n]; p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    p.closePath();
  } else {
    p.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < n - 1; i++) { const a = q[i], b = q[i + 1]; p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    p.lineTo(q[n - 1][0], q[n - 1][1]);
  }
  return p;
}

const PATS = new WeakMap();
let HATCH_D, HATCH_L, HATCH_X;
function pats(ctx) {
  let p = PATS.get(ctx);
  if (!p) { p = { d: ctx.createPattern(HATCH_D, 'repeat'), l: ctx.createPattern(HATCH_L, 'repeat'), x: ctx.createPattern(HATCH_X, 'repeat') }; PATS.set(ctx, p); }
  return p;
}

// draw a hand-drawn filled + inked shape
function shape(ctx, pts, o = {}) {
  const id = o.id ?? 0, amp = o.amp ?? 1.4, closed = o.closed ?? true;
  const p = rpath(pts, closed, amp, id, o.poly);
  if (o.fill && closed) {
    ctx.fillStyle = o.fill; ctx.fill(p);
    const h = o.hatch ?? 0.22;
    if (h > 0) { ctx.save(); ctx.globalAlpha *= h; ctx.fillStyle = pats(ctx).d; ctx.fill(p); ctx.restore(); }
    if (o.light) { ctx.save(); ctx.globalAlpha *= o.light; ctx.fillStyle = pats(ctx).l; ctx.fill(p); ctx.restore(); }
  }
  if (o.ink !== null) {
    ctx.save();
    ctx.strokeStyle = o.ink || C.ink; ctx.lineWidth = o.lw ?? 3.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalAlpha *= (o.inkA ?? 0.92); ctx.stroke(p);
    if (o.sketch !== false) {
      const p2 = rpath(pts, closed, amp * 1.8 + 0.6, id + 999, o.poly);
      ctx.lineWidth = (o.lw ?? 3.5) * 0.45; ctx.globalAlpha *= 0.5; ctx.stroke(p2);
    }
    ctx.restore();
  }
  return p;
}
function ell(cx, cy, rx, ry, n = 18, rot = 0, a0 = 0, a1 = Math.PI * 2) {
  const pts = []; const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const m = full ? n : n + 1;
  for (let i = 0; i < m; i++) {
    const a = a0 + (a1 - a0) * i / n; const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return pts;
}
function line(ctx, pts, o = {}) { return shape(ctx, pts, Object.assign({ closed: false }, o)); }
function circleFill(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fill(); }
function glow(ctx, x, y, r, col, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

// camera: world point (cx,cy) to view centre, zoom z, rotation r
function cam(ctx, cx, cy, z = 1, r = 0) { ctx.translate(VX, VY); ctx.rotate(r); ctx.scale(z, z); ctx.translate(-cx, -cy); }

// ---------- textures ----------
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
let PAPER, TOOTH, GRAIN, MASKS = [];
function buildTextures() {
  // hatch patterns
  const mk = (col, n, len, ang, wmin, wmax, seed) => {
    const c = makeCanvas(240, 240), x = c.getContext('2d'); const r = mulberry(seed);
    x.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const cx = r() * 240, cy = r() * 240, l = len * (0.5 + r()), a = ang + (r() - 0.5) * 0.25;
      x.strokeStyle = col.replace('A', (0.15 + r() * 0.5).toFixed(2)); x.lineWidth = wmin + r() * (wmax - wmin);
      for (const ox of [-240, 0, 240]) for (const oy of [-240, 0, 240]) {
        x.beginPath(); x.moveTo(cx + ox - Math.cos(a) * l / 2, cy + oy - Math.sin(a) * l / 2);
        x.lineTo(cx + ox + Math.cos(a) * l / 2, cy + oy + Math.sin(a) * l / 2); x.stroke();
      }
    }
    return c;
  };
  HATCH_D = mk('rgba(15,10,40,A)', 260, 26, -1.0, 0.8, 2.0, 11);
  HATCH_L = mk('rgba(255,250,235,A)', 220, 24, -1.0, 0.8, 1.8, 23);
  HATCH_X = mk('rgba(15,10,40,A)', 200, 22, 0.7, 0.7, 1.6, 37);

  // paper
  PAPER = makeCanvas(W, H); { const x = PAPER.getContext('2d'); const id = x.createImageData(W, H); const d = id.data; const r = mulberry(5);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = (j * W + i) * 4;
      const m = (noise2(i / 210, j / 210) - 0.5) * 14 + (noise2(i / 37 + 50, j / 37) - 0.5) * 7 + (r() - 0.5) * 9 + (noise2(i / 3.2, j / 1.4) - 0.5) * 6;
      d[k] = 243 + m; d[k + 1] = 235 + m; d[k + 2] = 220 + m * 1.05; d[k + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    // light vignette
    const g = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(120,90,50,0)'); g.addColorStop(1, 'rgba(120,90,50,0.10)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // fibres
    x.lineWidth = 0.8; for (let i = 0; i < 900; i++) { const px = r() * W, py = r() * H, a = r() * 6.28, l = 4 + r() * 14; x.strokeStyle = `rgba(110,85,55,${0.05 + r() * 0.07})`; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + r() * 3, py + Math.sin(a) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  }
  // tooth (alpha, for destination-out on pigment)
  TOOTH = makeCanvas(W, H); { const x = TOOTH.getContext('2d'); const id = x.createImageData(W, H); const d = id.data; const r = mulberry(9);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = (j * W + i) * 4;
      const v = 0.5 * noise2(i / 2.3 + j / 6.5, j / 2.3) + 0.3 * r() + 0.2 * noise2((i + j) / 9, (i - j) / 1.8);
      const a = clamp((v - 0.6) / 0.28) * 0.34;
      d[k] = 255; d[k + 1] = 255; d[k + 2] = 255; d[k + 3] = a * 255;
    }
    x.putImageData(id, 0, 0);
  }
  // grain for multiply over everything
  GRAIN = makeCanvas(W, H); { const x = GRAIN.getContext('2d'); const id = x.createImageData(W, H); const d = id.data; const r = mulberry(13);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = (j * W + i) * 4; const v = 255 - (noise2(i / 1.6, j / 4) * 16 + r() * 10 + noise2(i / 90, j / 90) * 12);
      d[k] = v; d[k + 1] = v - 2; d[k + 2] = v - 6; d[k + 3] = 255;
    }
    x.putImageData(id, 0, 0);
  }
  // window masks (rough edges)
  for (let v = 0; v < 3; v++) {
    const m = makeCanvas(W, H), x = m.getContext('2d'); x.fillStyle = '#fff';
    x.fill(windowPath(v * 17 + 3, 3.2)); MASKS.push(m);
    // erode edge with tooth for crayon edge
    x.globalCompositeOperation = 'destination-out'; x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 9; x.stroke(windowPath(v * 17 + 3, 3.2));
  }
}
function windowPath(seed, amp) {
  const pts = []; const { l, t, r, b } = VIEW; const step = 34;
  for (let x = l; x < r; x += step) pts.push([x, t]);
  for (let y = t; y < b; y += step) pts.push([r, y]);
  for (let x = r; x > l; x -= step) pts.push([x, b]);
  for (let y = b; y > t; y -= step) pts.push([l, y]);
  const old = BOIL; BOIL = seed; const p = rpath(pts, true, amp, seed, true); BOIL = old; return p;
}
