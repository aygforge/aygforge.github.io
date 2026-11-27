// ui/SceneArt.js — procedural, detailed scene backdrops (temporary art in the final art direction).
// Each backdrop is painted once per (kind, height) into an offscreen canvas and cached as an object URL,
// so scenes never redraw art per frame. No text that needs localisation is painted (only the brand mark).
// Replaceable later: AssetManager can register real scene art under the same logical ids (scene:<kind>).
const cache = new Map();
const R = 2; // texels per logical px
const OUT = '#14203a';

function mk(w, h) { const c = document.createElement('canvas'); c.width = w * R; c.height = h * R; const g = c.getContext('2d'); g.scale(R, R); g.lineJoin = 'round'; g.lineCap = 'round'; return [c, g]; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fillStroke(g, fill, lw = 2, stroke = OUT) { g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
// seeded so backdrops are stable between sessions (cosmetic only)
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** Cardboard box in 3/4 view. */
function box(g, x, y, w, h, col = '#d9a066', tape = true) {
  const d = Math.min(w, h) * 0.32, top = shade(col, 1.15), side = shade(col, 0.78);
  g.beginPath(); g.moveTo(x, y + d); g.lineTo(x + d, y); g.lineTo(x + w + d, y); g.lineTo(x + w, y + d); g.closePath(); fillStroke(g, top, 1.6);
  g.beginPath(); g.moveTo(x + w, y + d); g.lineTo(x + w + d, y); g.lineTo(x + w + d, y + h); g.lineTo(x + w, y + h + d); g.closePath(); fillStroke(g, side, 1.6);
  rr(g, x, y + d, w, h, 1.5); fillStroke(g, col, 1.6);
  if (tape) { g.fillStyle = 'rgba(255,240,200,.55)'; g.fillRect(x + w * 0.42, y + d, w * 0.16, h * 0.35); }
  g.strokeStyle = 'rgba(20,32,58,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w * 0.15, y + d + h * 0.7); g.lineTo(x + w * 0.45, y + d + h * 0.7); g.stroke();
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = n >> 8 & 255, b = n & 255;
  r = Math.min(255, Math.round(r * k)); gg = Math.min(255, Math.round(gg * k)); b = Math.min(255, Math.round(b * k));
  return '#' + ((1 << 24) | (r << 16) | (gg << 8) | b).toString(16).slice(1);
}
function boxStack(g, x, y, rand, cols = ['#d9a066', '#e5533d', '#5aa9e6', '#3fbf9b', '#f2c14e']) {
  const n = 2 + Math.floor(rand() * 3); let cy = y;
  for (let i = 0; i < n; i++) { const w = 22 + rand() * 14, h = 14 + rand() * 8; box(g, x + (rand() - 0.5) * 8, cy - h, w, h, cols[Math.floor(rand() * cols.length)]); cy -= h + 2; }
}
/** Wall screen with a chart / map / bars. */
function screen(g, x, y, w, h, kind, rand) {
  rr(g, x - 3, y - 3, w + 6, h + 6, 4); fillStroke(g, '#3a4a66', 2);
  rr(g, x, y, w, h, 2); const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#123a5c'); gr.addColorStop(1, '#0b2440'); g.fillStyle = gr; g.fill();
  g.save(); rr(g, x, y, w, h, 2); g.clip();
  g.strokeStyle = 'rgba(95,211,255,.18)'; g.lineWidth = 0.6;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x, y + h * i / 6); g.lineTo(x + w, y + h * i / 6); g.stroke(); }
  if (kind === 'chart') {
    g.strokeStyle = '#6ee06a'; g.lineWidth = 1.6; g.beginPath();
    for (let i = 0; i <= 8; i++) { const px = x + 4 + (w - 8) * i / 8, py = y + h * (0.75 - 0.5 * (i / 8) + (rand() - 0.5) * 0.25); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    g.strokeStyle = '#ff8a4c'; g.beginPath(); for (let i = 0; i <= 8; i++) { const px = x + 4 + (w - 8) * i / 8, py = y + h * (0.4 + (rand() - 0.5) * 0.4); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
  } else if (kind === 'bars') {
    for (let i = 0; i < 6; i++) { const bh = h * (0.2 + rand() * 0.6); g.fillStyle = i % 2 ? '#5fd3ff' : '#ffd166'; g.fillRect(x + 5 + i * (w - 10) / 6, y + h - 4 - bh, (w - 10) / 6 - 3, bh); }
  } else if (kind === 'map') {
    g.fillStyle = 'rgba(95,211,255,.28)';
    for (let i = 0; i < 5; i++) { g.beginPath(); const cx = x + w * (0.15 + rand() * 0.7), cy = y + h * (0.2 + rand() * 0.6); g.ellipse(cx, cy, w * (0.08 + rand() * 0.12), h * (0.08 + rand() * 0.15), rand(), 0, 6.3); g.fill(); }
    ['#ef5350', '#6ee06a', '#ffd166'].forEach(c => { const px = x + w * (0.2 + rand() * 0.6), py = y + h * (0.25 + rand() * 0.5); g.fillStyle = c; g.beginPath(); g.arc(px, py - 3, 2.6, 0, 6.3); g.fill(); g.beginPath(); g.moveTo(px - 2, py - 2); g.lineTo(px + 2, py - 2); g.lineTo(px, py + 2); g.fill(); });
  } else if (kind === 'pulse') {
    g.strokeStyle = '#5fd3ff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + h / 2);
    g.lineTo(x + w * 0.3, y + h / 2); g.lineTo(x + w * 0.38, y + h * 0.2); g.lineTo(x + w * 0.46, y + h * 0.8); g.lineTo(x + w * 0.54, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
  }
  g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.5, y); g.lineTo(x + w * 0.25, y + h); g.lineTo(x, y + h); g.fill();
  g.restore();
}
function terminal(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  rr(g, 0, 18, 30, 36, 4); fillStroke(g, '#5d7090', 2);
  g.beginPath(); g.moveTo(-2, 20); g.lineTo(4, 0); g.lineTo(28, 0); g.lineTo(32, 20); g.closePath(); fillStroke(g, '#7d8fb0', 2);
  rr(g, 7, 3, 18, 13, 2); fillStroke(g, '#123a5c', 1.5);
  g.fillStyle = '#5fd3ff'; g.fillRect(10, 7, 9, 2); g.fillRect(10, 11, 12, 2);
  rr(g, 4, 24, 22, 8, 2); fillStroke(g, '#3a4a66', 1.5);
  g.fillStyle = '#ffd166'; g.fillRect(8, 38, 4, 4); g.fillStyle = '#ef5350'; g.fillRect(15, 38, 4, 4);
  g.restore();
}
function banner(g, x, y, w, h, light) {
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 3, y + 3, w, h);
  rr(g, x, y, w, h, 3); fillStroke(g, light ? '#2c4a7a' : '#1f3558', 2);
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 2, y + 2, w - 4, h * 0.35);
  // brand mark (proper name, not localised)
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 italic ${Math.round(h * 0.42)}px system-ui, sans-serif`;
  g.lineWidth = 3; g.strokeStyle = OUT; g.strokeText('DELIVEROGUE', x + w / 2, y + h * 0.42);
  const gt = g.createLinearGradient(0, y, 0, y + h * 0.6); gt.addColorStop(0, '#e7f2ff'); gt.addColorStop(1, '#9fc0e8'); g.fillStyle = gt; g.fillText('DELIVEROGUE', x + w / 2, y + h * 0.42);
  g.fillStyle = '#5fd3ff'; g.fillRect(x + w * 0.3, y + h * 0.76, w * 0.4, 2);
}
function floorPerspective(g, w, h, y0, col1, col2, line) {
  const gr = g.createLinearGradient(0, y0, 0, h); gr.addColorStop(0, col1); gr.addColorStop(1, col2); g.fillStyle = gr; g.fillRect(0, y0, w, h - y0);
  g.strokeStyle = line; g.lineWidth = 1;
  const vx = w / 2;
  for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(vx + i * 18, y0); g.lineTo(vx + i * 80, h); g.stroke(); }
  for (let k = 0; k < 9; k++) { const t = k / 8, yy = y0 + (h - y0) * t * t; g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); }
}
function lightCone(g, x, y, w, h, col) {
  const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(w, h)); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(x - w, y - 4, w * 2, h);
}
function vignette(g, w, h, a = 0.55) {
  const gr = g.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h * 0.5, h * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(5,10,25,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

const PAINT = {
  /** Logistics operations room (MetaHub / RunSummary). */
  ops(g, w, h, rand) {
    const wallH = h * 0.42;
    let gr = g.createLinearGradient(0, 0, 0, wallH); gr.addColorStop(0, '#24365a'); gr.addColorStop(1, '#31476f'); g.fillStyle = gr; g.fillRect(0, 0, w, wallH);
    // wall panels
    g.strokeStyle = 'rgba(10,20,40,.45)'; g.lineWidth = 1.5; for (let x = 0; x < w; x += 45) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, wallH); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.04)'; for (let x = 4; x < w; x += 45) g.fillRect(x, 0, 6, wallH);
    banner(g, 10, h * 0.07, 96, 34, false); banner(g, 132, h * 0.045, 96, 36, true); banner(g, 254, h * 0.07, 96, 34, false);
    screen(g, 14, h * 0.16, 78, 52, 'chart', rand); screen(g, 104, h * 0.15, 30, 22, 'pulse', rand); screen(g, 104, h * 0.205, 30, 20, 'bars', rand);
    screen(g, 146, h * 0.14, 70, 44, 'bars', rand); screen(g, 230, h * 0.15, 40, 30, 'map', rand); screen(g, 280, h * 0.16, 66, 48, 'chart', rand);
    // floor
    floorPerspective(g, w, h, wallH, '#3d5478', '#24364f', 'rgba(20,32,58,.35)');
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, wallH, w, 6);
    // glowing floor ring
    g.save(); g.translate(w / 2, h * 0.56); g.scale(1, 0.32);
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 120 - i * 14, 0, 6.3); g.strokeStyle = `rgba(95,211,255,${0.35 - i * 0.1})`; g.lineWidth = 6 - i * 1.5; g.stroke(); }
    g.restore();
    // floor arrows
    g.fillStyle = 'rgba(242,165,65,.75)';
    [[70, 0.47, 1], [290, 0.47, -1], [55, 0.66, 1], [305, 0.66, -1]].forEach(([x, t, d]) => { const y = h * t; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14 * d, y - 6); g.lineTo(x + 14 * d, y - 2); g.lineTo(x + 24 * d, y - 2); g.lineTo(x + 24 * d, y + 2); g.lineTo(x + 14 * d, y + 2); g.lineTo(x + 14 * d, y + 6); g.closePath(); g.fill(); });
    // props
    terminal(g, 40, wallH - 30, 1.1); terminal(g, 286, wallH + h * 0.12, 1.2); terminal(g, 18, wallH + h * 0.18, 1.1);
    boxStack(g, 4, wallH + 30, rand); boxStack(g, 312, wallH + 20, rand); boxStack(g, 6, h * 0.78, rand); boxStack(g, 318, h * 0.8, rand);
    box(g, 268, wallH + 6, 26, 18, '#d9a066'); box(g, 96, wallH + 2, 22, 16, '#5aa9e6');
    vignette(g, w, h, 0.5);
  },
  /** Run preparation room: map table + world screens. */
  prep(g, w, h, rand) {
    const wallH = h * 0.36;
    let gr = g.createLinearGradient(0, 0, 0, wallH); gr.addColorStop(0, '#1e2f4f'); gr.addColorStop(1, '#2d4469'); g.fillStyle = gr; g.fillRect(0, 0, w, wallH);
    g.strokeStyle = 'rgba(10,20,40,.4)'; g.lineWidth = 1.5; for (let x = 20; x < w; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, wallH); g.stroke(); }
    screen(g, 18, h * 0.07, 92, 60, 'map', rand); screen(g, 128, h * 0.05, 104, 70, 'map', rand); screen(g, 250, h * 0.08, 90, 56, 'map', rand);
    // ceiling lights
    for (let i = 0; i < 3; i++) { rr(g, 40 + i * 120, 4, 60, 6, 3); g.fillStyle = '#e7f6ff'; g.fill(); lightCone(g, 70 + i * 120, 10, 70, 70, 'rgba(160,220,255,.16)'); }
    floorPerspective(g, w, h, wallH, '#34496b', '#1b2a42', 'rgba(15,25,45,.35)');
    // shelves right
    rr(g, 300, wallH - 50, 50, 110, 3); fillStroke(g, '#3a4a66', 2);
    for (let k = 0; k < 4; k++) { g.fillStyle = '#26344d'; g.fillRect(304, wallH - 44 + k * 26, 42, 20); g.fillStyle = ['#5fd3ff', '#ffd166', '#6ee06a', '#ef5350'][k]; g.fillRect(308, wallH - 40 + k * 26, 6, 12); g.fillRect(318, wallH - 38 + k * 26, 6, 10); }
    terminal(g, 8, wallH - 6, 1.15); boxStack(g, 264, wallH + 22, rand);
    vignette(g, w, h, 0.6);
  },
  /** Garage workshop (light, warm). */
  workshop(g, w, h, rand) {
    const wallH = h * 0.5;
    let gr = g.createLinearGradient(0, 0, 0, wallH); gr.addColorStop(0, '#d9d3c7'); gr.addColorStop(1, '#c9c1b2'); g.fillStyle = gr; g.fillRect(0, 0, w, wallH);
    g.strokeStyle = 'rgba(90,75,55,.18)'; g.lineWidth = 1; for (let y = 10; y < wallH; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    // pegboard with tools
    rr(g, 96, h * 0.14, 120, 70, 4); fillStroke(g, '#b9a27f', 2, '#5a4632');
    g.fillStyle = 'rgba(70,55,40,.35)'; for (let x = 104; x < 212; x += 9) for (let y = h * 0.14 + 7; y < h * 0.14 + 66; y += 9) g.fillRect(x, y, 1.6, 1.6);
    const wrench = (x, y, s, a) => { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.beginPath(); g.moveTo(-2, 0); g.lineTo(-2, 30); g.lineTo(2, 30); g.lineTo(2, 0); fillStroke(g, '#8e99a8', 1.5, '#3b4250'); g.beginPath(); g.arc(0, -3, 6, 0, 6.3); fillStroke(g, '#8e99a8', 1.5, '#3b4250'); g.fillStyle = '#b9a27f'; g.fillRect(-2.5, -9, 5, 6); g.restore(); };
    wrench(118, h * 0.17, 1, 0); wrench(136, h * 0.17, 0.9, 0); wrench(152, h * 0.17, 0.8, 0);
    g.beginPath(); g.moveTo(170, h * 0.16); g.lineTo(200, h * 0.16); g.lineTo(196, h * 0.2); g.lineTo(174, h * 0.2); fillStroke(g, '#e5533d', 1.5, '#5a2a20');
    g.fillStyle = '#3b4250'; g.fillRect(182, h * 0.2, 6, 24);
    // shelf with boxes & cans
    rr(g, 238, h * 0.2, 110, 6, 2); fillStroke(g, '#8a6a44', 1.5, '#4a3622'); rr(g, 238, h * 0.32, 110, 6, 2); fillStroke(g, '#8a6a44', 1.5, '#4a3622');
    box(g, 246, h * 0.2 - 20, 22, 16, '#d9a066'); box(g, 280, h * 0.2 - 16, 18, 12, '#e5533d');
    for (let i = 0; i < 4; i++) { rr(g, 300 + i * 11, h * 0.32 - 16, 9, 16, 2); fillStroke(g, ['#5aa9e6', '#3fbf9b', '#f2c14e', '#e5533d'][i], 1.2, '#3b4250'); }
    box(g, 250, h * 0.32 - 14, 30, 12, '#5aa9e6');
    // lamp
    lightCone(g, 180, h * 0.02, 160, h * 0.5, 'rgba(255,240,200,.32)');
    // floor
    gr = g.createLinearGradient(0, wallH, 0, h); gr.addColorStop(0, '#bdb6aa'); gr.addColorStop(1, '#9d968b'); g.fillStyle = gr; g.fillRect(0, wallH, w, h - wallH);
    g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, wallH, w, 5);
    g.strokeStyle = 'rgba(80,70,60,.18)'; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(w / 2 + i * 30, wallH); g.lineTo(w / 2 + i * 110, h); g.stroke(); }
    // oil stains + scattered tools
    g.fillStyle = 'rgba(60,50,40,.18)'; [[60, 0.86, 26], [290, 0.72, 18], [120, 0.66, 12]].forEach(([x, t, r]) => { g.beginPath(); g.ellipse(x, h * t, r, r * 0.35, 0, 0, 6.3); g.fill(); });
    wrench(318, h * 0.6, 1.1, 1.2); wrench(330, h * 0.64, 1, 1.5);
    // tire stack left
    for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(26, wallH - 6 - i * 14, 22, 8, 0, 0, 6.3); fillStroke(g, '#2f333b', 2, '#14161c'); g.beginPath(); g.ellipse(26, wallH - 8 - i * 14, 10, 3.5, 0, 0, 6.3); g.fillStyle = '#4a4f59'; g.fill(); }
    vignette(g, w, h, 0.3);
  },
  /** Settings control room. */
  control(g, w, h, rand) {
    let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2945'); gr.addColorStop(1, '#0f1a2e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(95,211,255,.07)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    screen(g, 12, h * 0.06, 70, 44, 'pulse', rand); screen(g, 278, h * 0.06, 70, 44, 'bars', rand);
    for (let i = 0; i < 14; i++) { g.fillStyle = ['#5fd3ff', '#ffd166', '#6ee06a', '#ef5350'][i % 4]; g.globalAlpha = 0.5; g.beginPath(); g.arc(20 + rand() * 320, h * (0.85 + rand() * 0.12), 1.5, 0, 6.3); g.fill(); }
    g.globalAlpha = 1; vignette(g, w, h, 0.5);
  },
  /** Main menu city dusk layer (drawn over the live animated canvas world). */
  city(g, w, h, rand) {
    let gr = g.createLinearGradient(0, 0, 0, h * 0.45); gr.addColorStop(0, '#1b2a55'); gr.addColorStop(0.6, '#3b3f7a'); gr.addColorStop(1, '#c86b5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.45);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + rand() * 0.6) + ')'; g.fillRect(rand() * w, rand() * h * 0.25, 1.2, 1.2); }
    const layer = (base, col, win, hmin, hmax) => {
      let x = -10; while (x < w + 10) {
        const bw = 26 + rand() * 34, bh = hmin + rand() * (hmax - hmin), y = base - bh;
        g.fillStyle = col; g.fillRect(x, y, bw, bh + 2); g.strokeStyle = OUT; g.lineWidth = 1.5; g.strokeRect(x, y, bw, bh + 2);
        for (let wy = y + 6; wy < base - 6; wy += 9) for (let wx = x + 4; wx < x + bw - 6; wx += 8) if (rand() < win) { g.fillStyle = rand() < 0.5 ? '#ffd98a' : '#ffb35c'; g.fillRect(wx, wy, 4, 5); }
        x += bw + 2;
      }
    };
    layer(h * 0.45, '#2a2f5c', 0.25, 50, 120); layer(h * 0.46, '#1f2446', 0.4, 30, 80);
    g.fillStyle = '#151a33'; g.fillRect(0, h * 0.46, w, 4);
  },
};

/** Returns an object URL / data URL for a backdrop of `kind` at logical size 360 × h. */
export function backdrop(kind, h) {
  h = Math.round(h); const key = kind + ':' + h;
  let u = cache.get(key); if (u) return u;
  const [c, g] = mk(360, h); const paint = PAINT[kind] || PAINT.ops;
  paint(g, 360, h, rng(kind.length * 977 + 13));
  u = c.toDataURL('image/png'); cache.set(key, u); return u;
}
export const BACKDROPS = Object.keys(PAINT);
