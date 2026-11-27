// core/Art.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { drawGlyph } from './SkillGlyphs.js';
import { COLS, TAU, TILE, VIEW_W } from './util.js';
import { COSMETICS } from '../data/cosmetics.js';
import { ENEMY_DB, ENEMY_SHORT } from '../data/enemies.js';
import { PACKAGES } from '../data/packages.js';
import { SKILL_BY_ID } from '../data/skills.js';

/* ============================= Art ============================
   Procedural asset generator + asset registry.
   Every sprite is drawn once into an offscreen canvas and cached by key.
   To replace procedural art with real sprite sheets later, call
   Art.register(key, image, w, h, ax, ay) — gameplay code only ever asks
   Art.get(key) for {img, w, h, ax, ay} and never draws characters itself.
   ============================================================== */
export const Art = (() => {
  const R = 2;                 // texture resolution (texels per logical px)
  const cache = new Map(), registry = new Map();
  const OUT = '#24140c';
  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w * R); c.height = Math.ceil(h * R); const g = c.getContext('2d'); g.scale(R, R); g.lineJoin = 'round'; g.lineCap = 'round'; return [c, g]; }
  function sprite(key, w, h, ax, ay, draw) {
    if (registry.has(key)) return registry.get(key);
    let s = cache.get(key); if (s) return s;
    const [c, g] = mk(w, h); draw(g); s = { img: c, w, h, ax, ay, flash: null }; cache.set(key, s); return s;
  }
  function flashOf(s) {
    if (s.flash) return s.flash;
    const c = document.createElement('canvas'); c.width = s.img.width; c.height = s.img.height; const g = c.getContext('2d');
    g.drawImage(s.img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
    s.flash = c; return c;
  }
  function register(key, img, w, h, ax, ay) { registry.set(key, { img, w, h, ax, ay, flash: null }); }
  /** Draw a sprite anchored at world/screen position (x,y). */
  function draw(ctx, s, x, y, flip = false, flash = false, scale = 1) {
    const img = flash ? flashOf(s) : s.img;
    if (!flip && scale === 1) { ctx.drawImage(img, x - s.ax, y - s.ay, s.w, s.h); return; }
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -scale : scale, scale); ctx.drawImage(img, -s.ax, -s.ay, s.w, s.h); ctx.restore();
  }
  /* ---------- tiny vector toolkit ---------- */
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function ell(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); }
  function fs(g, fill, stroke = OUT, lw = 1) { if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
  function shadow(g, x, y, rx, ry) { g.fillStyle = 'rgba(0,0,0,.28)'; ell(g, x, y, rx, ry); g.fill(); }
  function line(g, x1, y1, x2, y2, c, w = 1) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  function dot(g, x, y, r, c) { g.fillStyle = c; ell(g, x, y, r, r); g.fill(); }

  /* ---------------------- Courier (motor scooter rider) ---------------------- */
  /** dir: 0 down, 1 up, 2 side(left; right is mirrored). f: 0 idle, 1-3 riding. dmg: 0..2 delivery-box damage. */
  function courier(skinId, dir, f, carry, dmg, shoot) {
    const key = `moto_${skinId}_${dir}_${f}_${carry ? 1 : 0}_${dmg}_${shoot ? 1 : 0}`;
    return sprite(key, 42, 46, 21, 41, g => {
      const sk = (COSMETICS.find(c => c.id === skinId) || COSMETICS[0]).c;
      const mo = sk.moto || '#3b82c4', mo2 = sk.moto2 || '#24578a';
      const skin = '#f1c27d', tire = '#22202a', chrome = '#c6ccd3', bob = (f === 1 || f === 3) ? -0.6 : 0, spin = f * Math.PI / 4;
      g.translate(1, 1);
      const wheelSide = (x, y) => { dot(g, x, y, 4.6, tire); dot(g, x, y, 2.2, chrome); g.strokeStyle = '#6b7078'; g.lineWidth = 0.8; for (let k = 0; k < 2; k++) { const a = spin + k * Math.PI / 2; g.beginPath(); g.moveTo(x - Math.cos(a) * 3.6, y - Math.sin(a) * 3.6); g.lineTo(x + Math.cos(a) * 3.6, y + Math.sin(a) * 3.6); g.stroke(); } };
      const box = (x, y, w, h) => { // delivery top box on the rear rack
        rr(g, x, y, w, h, 2); fs(g, sk.bag);
        g.fillStyle = sk.bag2; g.fillRect(x + 0.5, y + h - 2.5, w - 1, 2);
        if (carry) { g.fillStyle = sk.trim; g.fillRect(x + 0.5, y + 1.6, w - 1, 1.4); g.fillStyle = '#d9a36a'; g.fillRect(x + w / 2 - 1.2, y, 2.4, h - 2.5); }
        else { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 1.5, y + 0.8, w - 3, 2); }
        g.font = 'bold 5px sans-serif'; g.fillStyle = sk.trim; g.textAlign = 'center'; g.fillText('D', x + w / 2 + (carry ? 3.2 : 0), y + h / 2 + 2);
        if (dmg >= 1) { line(g, x + 2, y + 3, x + 4.5, y + 6, '#3a2010', 0.8); line(g, x + w - 2, y + 4, x + w - 4, y + 7.5, '#3a2010', 0.8); }
        if (dmg >= 2) { g.fillStyle = 'rgba(70,40,15,.45)'; ell(g, x + w * 0.65, y + h * 0.6, 2.6, 1.8); g.fill(); line(g, x + 1, y + 1, x + w - 1, y + h - 1, '#e9e2c0', 1.4); line(g, x + w - 1, y + 1, x + 1, y + h - 1, '#e9e2c0', 1.4); }
      };
      const helmet = (x, y, face) => {
        ell(g, x, y, 6.2, 6); fs(g, sk.helmet);
        if (face === 'front') { ell(g, x, y + 2, 4, 3.2); fs(g, skin, null); dot(g, x - 1.6, y + 2, 0.85, '#2a1a12'); dot(g, x + 1.6, y + 2, 0.85, '#2a1a12'); rr(g, x - 5, y - 1.8, 10, 2, 1); fs(g, '#2b3a4a', null); g.fillStyle = sk.helmet2; g.fillRect(x - 1, y - 6, 2, 4); }
        else if (face === 'left') { ell(g, x - 3, y + 2, 2.8, 3.2); fs(g, skin, null); dot(g, x - 3.8, y + 1.6, 0.8, '#2a1a12'); rr(g, x - 6.5, y - 1.6, 5, 1.8, 0.8); fs(g, '#2b3a4a', null); g.strokeStyle = sk.helmet2; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 5, Math.PI * 1.05, Math.PI * 1.65); g.stroke(); }
        else { g.fillStyle = sk.helmet2; g.fillRect(x - 1, y - 6, 2, 11.5); }
        ell(g, x, y, 6.2, 6); fs(g, null);
      };
      if (dir === 2) {
        // ----- side view, facing left -----
        shadow(g, 20, 39, 16, 3);
        wheelSide(30, 35); wheelSide(9, 35);
        rr(g, 22, 25, 13, 9, 4); fs(g, mo);                          // rear cowl
        g.fillStyle = mo2; g.fillRect(23, 31, 11, 2);
        rr(g, 11, 30, 14, 3.5, 1.5); fs(g, mo2);                     // floor deck
        g.beginPath(); g.moveTo(8, 33); g.lineTo(11, 20); g.lineTo(15, 20); g.lineTo(14, 33); g.closePath(); fs(g, mo); // leg shield
        rr(g, 5, 23, 5, 4, 1.5); fs(g, '#ffe680');                   // headlight
        line(g, 12, 21, 11, 15, '#4b5058', 1.6); line(g, 8.5, 15, 14, 15, '#2b2f3a', 2);   // stem + handlebar
        rr(g, 21, 22.5, 12, 3.4, 1.5); fs(g, '#2b2f3a');             // seat
        g.fillStyle = '#4b5058'; g.fillRect(31, 22, 6, 1.5);         // rack
        box(29, 11, 10, 11);
        g.fillStyle = 'rgba(200,200,200,.6)'; g.fillRect(34, 32.5, 4, 1.6);
        g.translate(0, bob);
        rr(g, 15.5, 25.5, 9, 3.6, 1.6); fs(g, sk.pants);              // thigh
        rr(g, 14, 25.5, 3.5, 6, 1.4); fs(g, sk.pants); g.fillStyle = '#2a2230'; g.fillRect(12.5, 30, 5, 1.8);
        rr(g, 18.5, 13, 9, 11, 3); fs(g, sk.jacket); g.fillStyle = sk.trim; g.fillRect(19, 19.5, 8, 1.4);
        if (shoot) { rr(g, 7, 15, 13, 3.2, 1.5); fs(g, sk.jacket2); rr(g, 3, 14, 4.6, 3.8, 0.8); fs(g, '#2b2f3a'); g.fillStyle = '#7cf5c0'; g.fillRect(3.8, 14.8, 2.2, 1.4); dot(g, 2, 16, 2.4, 'rgba(255,230,120,.9)'); }
        else { rr(g, 11, 15, 10, 3, 1.4); fs(g, sk.jacket2); dot(g, 11.5, 16.4, 1.5, skin); }
        helmet(22, 8.5, 'left');
      } else if (dir === 0) {
        // ----- front view, riding towards the camera -----
        shadow(g, 20, 39, 10, 3.5);
        box(13, 3 + bob, 14, 7);                                     // top box peeking behind the rider
        rr(g, 17.5, 31, 5, 9, 2); fs(g, tire); g.fillStyle = '#6b7078'; g.fillRect(19, 31 + (f % 2) * 3, 2, 2);  // front tyre
        g.beginPath(); g.moveTo(13, 22); g.lineTo(27, 22); g.lineTo(25, 34); g.lineTo(15, 34); g.closePath(); fs(g, mo); // leg shield
        g.fillStyle = mo2; g.fillRect(15.5, 31, 9, 2); rr(g, 16.5, 32, 7, 3, 1.5); fs(g, mo2);
        dot(g, 20, 25.5, 2.6, '#ffe680'); g.strokeStyle = OUT; g.lineWidth = 0.8; g.beginPath(); g.arc(20, 25.5, 2.6, 0, TAU); g.stroke();
        g.translate(0, bob);
        rr(g, 14, 10, 12, 11, 3.5); fs(g, sk.jacket); g.fillStyle = sk.trim; g.fillRect(14.5, 16.5, 11, 1.4); line(g, 20, 10.5, 20, 20.5, sk.jacket2, 1);
        rr(g, 15, 21, 4, 5, 1.4); fs(g, sk.pants); rr(g, 21, 21, 4, 5, 1.4); fs(g, sk.pants);
        line(g, 7, 19.5, 33, 19.5, '#2b2f3a', 2.2);                 // handlebar
        dot(g, 6.5, 16, 1.6, chrome); dot(g, 33.5, 16, 1.6, chrome); line(g, 7.5, 17, 9, 19, '#4b5058', 0.8); line(g, 32.5, 17, 31, 19, '#4b5058', 0.8);
        rr(g, 10, 13, 4, 6.5, 1.5); fs(g, sk.jacket2); rr(g, 26, 13, 4, 6.5, 1.5); fs(g, sk.jacket2);
        if (shoot) { rr(g, 27.5, 19.5, 5, 3.6, 0.8); fs(g, '#2b2f3a'); g.fillStyle = '#7cf5c0'; g.fillRect(28.4, 20.2, 2.4, 1.4); dot(g, 30, 25, 2.4, 'rgba(255,230,120,.9)'); }
        helmet(20, 6.5, 'front');
      } else {
        // ----- back view, riding away -----
        shadow(g, 20, 39, 10, 3.5);
        rr(g, 17.5, 31, 5, 9, 2); fs(g, tire);
        rr(g, 13.5, 24, 13, 10, 4); fs(g, mo); g.fillStyle = mo2; g.fillRect(14, 30, 12, 2);
        rr(g, 17, 29.5, 6, 2.4, 1); fs(g, '#e5533d');                // tail light
        line(g, 7, 13.5, 33, 13.5, '#2b2f3a', 2);
        dot(g, 6.5, 11, 1.6, chrome); dot(g, 33.5, 11, 1.6, chrome);
        g.translate(0, bob);
        rr(g, 14, 9, 12, 11, 3.5); fs(g, sk.jacket); g.fillStyle = sk.trim; g.fillRect(14.5, 15, 11, 1.4);
        rr(g, 10, 10, 4, 5.5, 1.5); fs(g, sk.jacket2); rr(g, 26, 10, 4, 5.5, 1.5); fs(g, sk.jacket2);
        box(12.5, 17, 15, 11);
        if (shoot) dot(g, 30, 7, 2.2, 'rgba(255,230,120,.9)');
        helmet(20, 5.5, 'back');
      }
    });
  }

  /* ---------------------- Enemies ---------------------- */
  const E = {};
  // Bean Bandit — masked coffee bean with stir-stick dagger
  E.BB = (g, f, v) => {
    shadow(g, 11, 22, 7, 2.5);
    const b = f % 2 ? -1 : 0, st = f === 1 ? 1.5 : f === 3 ? -1.5 : 0;
    g.fillStyle = '#2a1608'; g.fillRect(7.5 + st, 18, 2.5, 4); g.fillRect(12 - st, 18, 2.5, 4);
    ell(g, 11, 12 + b, 7.5, 8.2); fs(g, '#6b3b1f');
    g.strokeStyle = '#8f5530'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(11, 5 + b); g.bezierCurveTo(8, 10 + b, 14, 14 + b, 11, 20 + b); g.stroke();
    g.fillStyle = '#16100c'; g.fillRect(3.8, 9 + b, 14.4, 4); g.fillRect(17, 9.5 + b, 3, 1.4);
    dot(g, 8.2, 11 + b, 1.4, v === 'w' ? '#ff5a3c' : '#fff'); dot(g, 13.8, 11 + b, 1.4, v === 'w' ? '#ff5a3c' : '#fff');
    dot(g, 8.4, 11.2 + b, 0.6, '#16100c'); dot(g, 14, 11.2 + b, 0.6, '#16100c');
    line(g, 6, 8 + b, 9.5, 9 + b, '#16100c', 1); line(g, 16, 8 + b, 12.5, 9 + b, '#16100c', 1);
    const ky = v === 'w' ? 4 : 13;
    line(g, 18, 15 + b, 20, ky + b, '#c9d1d9', 1.6); line(g, 17, 15.5 + b, 19.5, 15.5 + b, '#5a3a22', 1.4);
  };
  // Sugar Sprite — winged sugar cube
  E.SS = (g, f) => {
    shadow(g, 8, 16.5, 5, 1.8);
    const b = Math.sin(f / 4 * TAU) * 1.2, wf = f % 2 ? 1 : 0;
    g.fillStyle = 'rgba(200,230,255,.85)'; ell(g, 3, 6 + b - wf, 3.2, 2 + wf); g.fill(); ell(g, 13, 6 + b - wf, 3.2, 2 + wf); g.fill();
    rr(g, 3, 4 + b, 10, 10, 2.2); fs(g, '#fffaf2');
    g.fillStyle = '#e6dccb'; g.fillRect(3.6, 11.5 + b, 8.8, 2);
    dot(g, 6, 8.5 + b, 1, '#3a2418'); dot(g, 10, 8.5 + b, 1, '#3a2418');
    g.fillStyle = 'rgba(255,120,160,.6)'; g.fillRect(4.4, 10 + b, 1.6, 1); g.fillRect(10, 10 + b, 1.6, 1);
    g.fillStyle = '#fff'; g.fillRect(5, 5 + b, 1, 1); g.fillRect(11, 12 + b, 1, 1);
    dot(g, 14, 2 + b, 0.7, '#ffe680');
  };
  // Latte Imp — foamy imp with heart latte art
  E.LI = (g, f, v) => {
    shadow(g, 11, 22, 7, 2.5);
    const b = f % 2 ? -1 : 0, st = f === 1 ? 1 : f === 3 ? -1 : 0;
    g.fillStyle = '#7a4a2c'; g.fillRect(8 + st, 18, 2.5, 4); g.fillRect(12 - st, 18, 2.5, 4);
    g.fillStyle = '#7a4a2c'; g.beginPath(); g.moveTo(6, 7 + b); g.lineTo(4.5, 2 + b); g.lineTo(8, 5.5 + b); g.fill(); g.beginPath(); g.moveTo(16, 7 + b); g.lineTo(17.5, 2 + b); g.lineTo(14, 5.5 + b); g.fill();
    ell(g, 11, 13 + b, 7.5, 7.5); fs(g, '#e9cfa6');
    [[6.5, 7], [9, 5.5], [12.5, 5.3], [15.5, 7]].forEach(([x, y]) => { ell(g, x, y + b, 2.6, 2.4); fs(g, '#fffaf0', null); });
    ell(g, 11, 15.5 + b, 3.6, 3); fs(g, '#a0663a', null);
    g.fillStyle = '#fff6e6'; g.beginPath(); g.arc(10.1, 15 + b, 1.1, 0, TAU); g.arc(11.9, 15 + b, 1.1, 0, TAU); g.fill(); g.beginPath(); g.moveTo(9, 15.3 + b); g.lineTo(13, 15.3 + b); g.lineTo(11, 17.6 + b); g.fill();
    dot(g, 8.5, 10.5 + b, 1.1, '#2a1a12'); dot(g, 13.5, 10.5 + b, 1.1, '#2a1a12');
    g.strokeStyle = '#2a1a12'; g.lineWidth = 0.8; g.beginPath(); g.arc(11, 11.5 + b, 1.6, 0.2, Math.PI - 0.2); g.stroke();
    const hx = v === 'w' ? 19 : 18.5, hy = v === 'w' ? 6 : 13;
    rr(g, hx - 2, hy + b, 4, 4, 1); fs(g, '#f3efe6');
    if (v === 'w') dot(g, hx, hy - 1 + b, 2, '#e9cfa6');
  };
  // Barista Goblin — green goblin with portafilter club
  E.BG = (g, f, v) => {
    shadow(g, 13, 26, 9, 3);
    const b = f % 2 ? -1 : 0, st = f === 1 ? 1.5 : f === 3 ? -1.5 : 0;
    g.fillStyle = '#3d6b2a'; g.fillRect(8.5 + st, 21, 3.5, 5); g.fillRect(14 - st, 21, 3.5, 5);
    rr(g, 6, 12 + b, 14, 11, 4); fs(g, '#6fae4c');
    rr(g, 8, 14 + b, 10, 9, 2); fs(g, '#f3ead8');
    g.fillStyle = '#c9b48e'; g.fillRect(11, 16 + b, 4, 3);
    g.fillStyle = '#6fae4c'; g.beginPath(); g.moveTo(5, 7 + b); g.lineTo(0.5, 4 + b); g.lineTo(5.5, 10 + b); g.fill(); g.beginPath(); g.moveTo(21, 7 + b); g.lineTo(25.5, 4 + b); g.lineTo(20.5, 10 + b); g.fill();
    ell(g, 13, 8 + b, 7.5, 6.2); fs(g, '#7cbf57');
    rr(g, 7, 1 + b, 12, 4.2, 2); fs(g, '#6b4026');
    dot(g, 10, 8.5 + b, 1.3, v === 'w' ? '#ff4d2e' : '#ffe680'); dot(g, 16, 8.5 + b, 1.3, v === 'w' ? '#ff4d2e' : '#ffe680');
    g.fillStyle = '#fff'; g.fillRect(10.5, 11.5 + b, 1.4, 1.6); g.fillRect(14.2, 11.5 + b, 1.4, 1.6);
    if (v === 'w') { line(g, 21, 14 + b, 22, 2, '#2b2f3a', 2.4); ell(g, 22, 1.5, 4.5, 3); fs(g, '#9aa3ad'); }
    else if (v === 'x') { line(g, 20, 18 + b, 25, 24, '#2b2f3a', 2.4); ell(g, 25, 25, 4.5, 2.6); fs(g, '#9aa3ad'); }
    else { line(g, 20, 17 + b, 24, 10 + b, '#2b2f3a', 2.4); ell(g, 24.2, 8.5 + b, 3.8, 2.8); fs(g, '#9aa3ad'); }
    rr(g, 3, 14 + b, 3.4, 6, 1.4); fs(g, '#6fae4c');
  };
  // Drip Cultist — hooded robe, pour-over staff
  E.DC = (g, f, v) => {
    shadow(g, 11, 26, 7.5, 2.6);
    const b = f % 2 ? -0.8 : 0;
    g.beginPath(); g.moveTo(4, 26); g.lineTo(6, 11 + b); g.quadraticCurveTo(11, 2 + b, 16, 11 + b); g.lineTo(18, 26); g.closePath(); fs(g, '#5a3524');
    g.fillStyle = '#3e2418'; g.beginPath(); g.moveTo(7, 26); g.lineTo(9, 15 + b); g.lineTo(13, 15 + b); g.lineTo(15, 26); g.fill();
    ell(g, 11, 10 + b, 4.4, 4); fs(g, '#1a0f0a', null);
    const ec = v === 'w' ? '#ff7b3a' : '#ffb347';
    dot(g, 9.4, 10 + b, 1, ec); dot(g, 12.6, 10 + b, 1, ec);
    g.fillStyle = '#d9a36a'; g.fillRect(6, 18 + b, 10, 1.6);
    line(g, 18.5, 26, 18.5, 6 + b, '#8a5a2e', 1.6);
    g.beginPath(); g.moveTo(14.5, 3 + b); g.lineTo(22.5, 3 + b); g.lineTo(18.5, 9 + b); g.closePath(); fs(g, '#f3efe6');
    dot(g, 18.5, 11 + b + (f % 2) * 1.5, 0.9, '#6b3b1f');
    if (v === 'w') { g.fillStyle = 'rgba(255,150,60,.45)'; ell(g, 18.5, 5 + b, 6, 6); g.fill(); }
  };
  // Mug Mimic — dormant mug ('x') / awake toothy mug
  E.MM = (g, f, v) => {
    shadow(g, 10, 18.5, 7, 2.2);
    if (v === 'x') {
      ell(g, 10, 17, 8, 2.4); fs(g, '#d8d0c2');
      rr(g, 4.5, 7, 10, 10, 2); fs(g, '#f1ebdf'); ell(g, 9.5, 7.5, 5, 1.6); fs(g, '#5b3214', null);
      g.strokeStyle = OUT; g.lineWidth = 1; g.beginPath(); g.arc(15.5, 12, 2.6, -Math.PI / 2, Math.PI / 2); g.stroke();
      g.fillStyle = '#c9a07a'; g.fillRect(6, 12, 7, 1.2);
      if (f % 4 === 1) { dot(g, 7.5, 10.5, 0.7, '#2a1a12'); dot(g, 11.5, 10.5, 0.7, '#2a1a12'); }
      return;
    }
    const b = f % 2 ? -1.2 : 0, st = f === 1 ? 1 : f === 3 ? -1 : 0;
    g.fillStyle = '#c9b8a0'; g.fillRect(6 + st, 15, 2, 4); g.fillRect(12 - st, 15, 2, 4);
    rr(g, 3.5, 4 + b, 13, 12, 2.5); fs(g, '#f1ebdf');
    g.strokeStyle = OUT; g.lineWidth = 1.1; g.beginPath(); g.arc(17, 10 + b, 3, -Math.PI / 2, Math.PI / 2); g.stroke();
    rr(g, 5.5, 9 + b, 9, 5, 1.5); fs(g, '#5a1e1e', null);
    g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(6 + i * 2.2, 9 + b); g.lineTo(7.1 + i * 2.2, 11 + b); g.lineTo(8.2 + i * 2.2, 9 + b); g.fill(); }
    g.fillStyle = '#e65a6a'; g.fillRect(8, 12.4 + b, 4, 1.4);
    dot(g, 7.5, 6.6 + b, 1.2, v === 'w' ? '#ff4d2e' : '#2a1a12'); dot(g, 12.5, 6.6 + b, 1.2, v === 'w' ? '#ff4d2e' : '#2a1a12');
  };
  // Cream Drifter — giant whipped cream blob
  E.CD = (g, f) => {
    shadow(g, 20, 31.5, 15, 3.5);
    const sq = Math.sin(f / 4 * TAU) * 1.2;
    ell(g, 20, 24, 16 + sq, 8 - sq * 0.4); fs(g, '#fffaf0');
    ell(g, 20, 17, 12.5 - sq * 0.5, 7.5); fs(g, '#fffaf0');
    ell(g, 20, 10.5, 8.5, 5.5 + sq * 0.3); fs(g, '#fffaf0');
    g.beginPath(); g.moveTo(15, 8); g.quadraticCurveTo(20, -1, 24, 7); fs(g, '#fffaf0');
    g.strokeStyle = '#e3d6bf'; g.lineWidth = 1; [[20, 24, 12], [20, 17, 9], [20, 10.5, 5.5]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y + 2, r, 0.3, Math.PI - 0.3); g.stroke(); });
    dot(g, 22.5, 3, 2.6, '#d7263d'); line(g, 22.5, 1, 25, -1.5, '#3d6b2a', 0.8);
    dot(g, 15.5, 18, 1.6, '#2a1a12'); dot(g, 24.5, 18, 1.6, '#2a1a12'); dot(g, 16, 17.4, 0.5, '#fff'); dot(g, 25, 17.4, 0.5, '#fff');
    g.fillStyle = 'rgba(255,160,170,.5)'; ell(g, 13, 20.5, 2, 1); g.fill(); ell(g, 27, 20.5, 2, 1); g.fill();
    g.fillStyle = '#fffaf0'; ell(g, 7, 29.5 + sq * 0.5, 2.4, 2.4); g.fill(); ell(g, 33, 29.5 - sq * 0.5, 2.4, 2.4); g.fill();
  };
  // Grinder Knight — armored knight with burr-grinder helmet
  E.GK = (g, f, v) => {
    shadow(g, 18, 39, 13, 4);
    const b = f % 2 ? -1 : 0, st = f === 1 ? 2 : f === 3 ? -2 : 0, lean = v === 'w' ? 2 : 0;
    g.fillStyle = '#5b636e'; rr(g, 11 + st, 30, 5, 9, 1.5); fs(g, '#7d8691'); rr(g, 20 - st, 30, 5, 9, 1.5); fs(g, '#7d8691');
    g.translate(lean, 0);
    rr(g, 8, 17 + b, 20, 15, 5); fs(g, '#9aa3ad');
    g.fillStyle = '#c6ccd3'; g.fillRect(10, 19 + b, 16, 2); g.fillStyle = '#6b4026'; g.fillRect(9, 27 + b, 18, 2.5);
    dot(g, 18, 24 + b, 2.2, '#6b3b1f');
    rr(g, 10, 6 + b, 16, 13, 3); fs(g, '#7d8691');
    g.fillStyle = v === 'w' || v === 'c' ? '#ff3b2e' : '#ffb347'; g.fillRect(12.5, 11.5 + b, 11, 2.2);
    rr(g, 11, -0.5 + b, 14, 7.5, 2); fs(g, 'rgba(190,225,240,.95)');
    g.fillStyle = '#6b3b1f'; [[14, 4], [17, 3], [20, 4.5], [22, 3], [15.5, 5.5], [19, 5.8]].forEach(([x, y]) => { ell(g, x, y + b, 1.3, 0.9); g.fill(); });
    rr(g, 10, -2 + b, 16, 2.6, 1); fs(g, '#4b5058');
    line(g, 26, 9 + b, 31, 7 + b, '#4b5058', 1.6); dot(g, 31.5, 7 + b, 1.6, '#c27a3a');
    ell(g, 6, 24 + b, 6, 7.5); fs(g, '#8a5a2e'); dot(g, 6, 24 + b, 2.2, '#c6ccd3');
    if (v === 'w' || v === 'c') { line(g, 28, 22 + b, 34, 14 + b, '#c6ccd3', 2.5); }
    else { line(g, 28, 24 + b, 33, 32, '#c6ccd3', 2.5); }
    rr(g, 26, 20 + b, 5, 5, 1.5); fs(g, '#7d8691');
  };
  // Steam Jugger — armored copper boiler beast
  E.SJ = (g, f, v) => {
    shadow(g, 23, 43, 17, 4.5);
    const b = f % 2 ? -1 : 0, st = f === 1 ? 2 : f === 3 ? -2 : 0, hot = v === 'w';
    rr(g, 11 + st, 34, 8, 9, 2); fs(g, '#5b636e'); rr(g, 27 - st, 34, 8, 9, 2); fs(g, '#5b636e');
    rr(g, 7, 9 + b, 32, 28, 9); fs(g, hot ? '#d9783a' : '#c27a3a');
    g.fillStyle = '#9a5a26'; g.fillRect(8, 18 + b, 30, 2.5); g.fillRect(8, 28 + b, 30, 2.5);
    g.fillStyle = '#ffd9a0'; [[10, 13], [36, 13], [10, 33], [36, 33], [23, 11]].forEach(([x, y]) => g.fillRect(x - 0.8, y - 0.8 + b, 1.6, 1.6));
    ell(g, 23, 22 + b, 7.5, 7.5); fs(g, '#f6f0e4'); g.strokeStyle = '#4b5058'; g.lineWidth = 2; g.stroke();
    line(g, 23, 22 + b, hot ? 27.5 : 19, hot ? 17 + b : 18 + b, '#d7263d', 1.4); dot(g, 23, 22 + b, 1.2, '#2a1a12');
    rr(g, 15, 3 + b, 5, 7, 1.5); fs(g, '#8a8f96'); rr(g, 26, 2 + b, 5, 8, 1.5); fs(g, '#8a8f96');
    rr(g, 0, 17 + b, 8, 5, 2); fs(g, '#8a8f96'); rr(g, 38, 17 + b, 8, 5, 2); fs(g, '#8a8f96');
    rr(g, -0.5, 21 + b, 6, 8, 2); fs(g, '#5b636e'); rr(g, 40.5, 21 + b, 6, 8, 2); fs(g, '#5b636e');
    if (hot) { g.strokeStyle = 'rgba(255,90,40,.9)'; g.lineWidth = 1.2; rr(g, 7, 9 + b, 32, 28, 9); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, 17.5, 1 + b - (f % 2), 2.5, 2); g.fill(); ell(g, 28.5, 0 + b - ((f + 1) % 2), 2.5, 2); g.fill();
  };
  /* Latte Art Dragon (boss, 84×78): latte cup body with foam wings, caramel dragon head, latte-art heart. */
  E.LD = (g, f, v) => {
    const fl = [0, 2, 3, 2][f % 4], rage = v === 'p3' ? 2 : v === 'p2' ? 1 : 0;
    shadow(g, 42, 74, 30, 5);
    // wings
    [-1, 1].forEach(sd => {
      g.save(); g.translate(42 + sd * 18, 34); g.scale(sd, 1);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(18, -26 - fl, 36, -20 - fl); g.lineTo(30, -10); g.lineTo(38, -4 + fl * 0.3); g.lineTo(28, 2); g.lineTo(32, 10); g.quadraticCurveTo(14, 8, 0, 12); g.closePath();
      fs(g, rage === 2 ? '#e9c8a8' : '#f3e1c4'); g.strokeStyle = 'rgba(160,102,58,.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(4, 2); g.lineTo(30, -16 - fl * 0.6); g.moveTo(4, 6); g.lineTo(28, 2); g.stroke();
      g.restore();
    });
    // tail
    g.beginPath(); g.moveTo(60, 60); g.quadraticCurveTo(80, 62, 76, 46); g.quadraticCurveTo(74, 40, 80, 38); g.lineWidth = 6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 3.5; g.strokeStyle = '#d9a066'; g.stroke();
    // saucer + cup
    ell(g, 42, 68, 30, 7); fs(g, '#e8e2d6'); ell(g, 42, 67, 22, 4.5); fs(g, '#d6cfc1', null);
    g.beginPath(); g.moveTo(18, 40); g.lineTo(66, 40); g.quadraticCurveTo(64, 66, 42, 67); g.quadraticCurveTo(20, 66, 18, 40); g.closePath(); fs(g, '#fff6ea');
    g.beginPath(); g.arc(68, 50, 7, -1.3, 1.3); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 3; g.strokeStyle = '#fff6ea'; g.stroke();
    ell(g, 42, 41, 24, 5.5); fs(g, '#a8693c');
    g.fillStyle = '#fff1dc'; g.beginPath(); g.moveTo(42, 45); g.bezierCurveTo(34, 40, 36, 35, 41, 38); g.bezierCurveTo(42, 36, 44, 36, 43, 38); g.bezierCurveTo(48, 35, 50, 40, 42, 45); g.fill();
    g.fillStyle = rage ? '#ffb38a' : '#ffd166'; g.fillRect(22, 52, 40, 3);
    // neck + head
    g.beginPath(); g.moveTo(34, 40); g.quadraticCurveTo(30, 26, 38, 18); g.lineTo(48, 18); g.quadraticCurveTo(54, 28, 50, 40); g.closePath(); fs(g, '#d9a066');
    rr(g, 26, 6 - (f % 2), 34, 20, 9); fs(g, '#d9a066');
    rr(g, 46, 12 - (f % 2), 18, 11, 5); fs(g, '#c58b52');
    dot(g, 60, 16 - (f % 2), 1.4, OUT);
    // horns
    [[30, 7], [42, 5]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y - 9); g.lineTo(x + 4, y - 1); g.closePath(); fs(g, '#fff1dc'); });
    // eyes
    const eye = rage === 2 ? '#ff4b2b' : rage === 1 ? '#ff9a3c' : '#ffd23f';
    ell(g, 42, 13 - (f % 2), 4.2, 3.6); fs(g, eye); dot(g, 43, 13 - (f % 2), 1.6, OUT);
    // steam puffs from nostrils
    g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, 68, 10 - fl, 3 + fl * 0.4, 2.4); g.fill(); ell(g, 72, 6 - fl, 2.2, 1.8); g.fill();
  };
  function enemy(short, f, v = 'n') {
    const d = ENEMY_DB[ENEMY_SHORT[short]];
    const pad = 4, w = d.w + pad * 2, h = d.h + pad * 2;
    return sprite(`en_${short}_${v}_${f}`, w, h, w / 2, h - pad - 1, g => { g.translate(pad, pad); E[short](g, f, v); });
  }

  /* ---------------------- Props ---------------------- */
  const cart = () => sprite('cart', 44, 26, 22, 21, g => {
    shadow(g, 22, 22, 19, 3.5);
    rr(g, 3, 6, 38, 13, 3); fs(g, '#b8c0c8');
    g.fillStyle = '#e8ecef'; g.fillRect(5, 7.5, 34, 3);
    for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#2a2a2a' : '#ffd166'; g.fillRect(4 + i * 5.3, 16, 5.3, 2.5); }
    [[10, 6], [17, 5.5], [24, 6], [31, 5.5]].forEach(([x, y]) => { ell(g, x, y, 2.6, 2); fs(g, '#f3efe6'); ell(g, x, y - 0.4, 1.6, 0.9); fs(g, '#6b3b1f', null); });
    dot(g, 7, 21, 2.4, '#2b2f3a'); dot(g, 37, 21, 2.4, '#2b2f3a');
    line(g, 41, 9, 43, 4, '#4b5058', 1.6);
  });
  const pickup = (full) => sprite('pickup_' + (full ? 1 : 0), 40, 40, 20, 30, g => {
    shadow(g, 20, 31, 16, 4);
    rr(g, 3, 14, 34, 16, 3); fs(g, '#8a5a3a'); g.fillStyle = '#a8703f'; g.fillRect(4, 15, 32, 4);
    g.fillStyle = '#5e3a26'; g.fillRect(4, 25, 32, 4);
    rr(g, 11, 2, 18, 9, 2); fs(g, '#e2553f'); g.fillStyle = '#fff1dc'; g.font = 'bold 6px sans-serif'; g.textAlign = 'center'; g.fillText('SİPARİŞ', 20, 8.6);
    line(g, 14, 11, 14, 14, OUT, 1); line(g, 26, 11, 26, 14, OUT, 1);
    if (full) { rr(g, 14, 9.5, 12, 9, 1.5); fs(g, '#d9a36a'); line(g, 20, 9.5, 20, 18.5, '#a8723c', 1.4); rr(g, 17, 7, 6, 3, 1); fs(g, null); }
    else { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(14, 15, 12, 2); }
  });
  const healSt = (used) => sprite('heal_' + (used ? 1 : 0), 30, 34, 15, 28, g => {
    shadow(g, 15, 28, 11, 3);
    rr(g, 4, 14, 22, 14, 3); fs(g, used ? '#4a4a4a' : '#3f7d5a');
    rr(g, 9, 2, 12, 15, 3); fs(g, used ? '#8a8a8a' : '#e8f5ec');
    g.fillStyle = used ? '#666' : '#2fbf71'; g.fillRect(13.6, 5, 2.8, 9); g.fillRect(10.5, 8.1, 9, 2.8);
    rr(g, 10, 0, 10, 3, 1); fs(g, '#5b636e');
  });
  const customer = (f, happy) => sprite('cust_' + f + (happy ? 'h' : ''), 22, 30, 11, 27, g => {
    shadow(g, 11, 27, 7, 2.4);
    g.fillStyle = '#3b3f58'; g.fillRect(7.5, 20, 3, 7); g.fillRect(11.5, 20, 3, 7);
    rr(g, 6, 12, 10, 10, 3); fs(g, '#5aa9e6');
    const wave = f ? -3 : 0;
    rr(g, 15, happy ? 4 : 7 + wave, 3, 8, 1.4); fs(g, '#5aa9e6'); dot(g, 16.5, (happy ? 4 : 7 + wave), 1.6, '#f1c27d');
    rr(g, 4, 13, 3, 7, 1.4); fs(g, '#5aa9e6');
    ell(g, 11, 8, 5, 5); fs(g, '#f1c27d');
    g.fillStyle = '#5a3524'; g.beginPath(); g.arc(11, 6.5, 5.2, Math.PI, TAU); g.fill();
    dot(g, 9.3, 8.6, 0.7, '#2a1a12'); dot(g, 12.7, 8.6, 0.7, '#2a1a12');
    g.strokeStyle = '#2a1a12'; g.lineWidth = 0.7; g.beginPath(); g.arc(11, 9.6, happy ? 1.8 : 1.2, 0.2, Math.PI - 0.2); g.stroke();
  });
  const checkSign = () => sprite('cpsign', 36, 40, 18, 36, g => {
    shadow(g, 18, 36, 12, 3);
    line(g, 6, 36, 6, 10, '#5b636e', 2); line(g, 30, 36, 30, 10, '#5b636e', 2);
    rr(g, 2, 2, 32, 14, 3); fs(g, '#2fbf71'); g.fillStyle = '#fff'; g.font = 'bold 6px sans-serif'; g.textAlign = 'center'; g.fillText('KAHVE', 18, 8.4); g.fillText('MOLASI', 18, 14);
    ell(g, 18, 24, 6, 5); fs(g, '#f3efe6'); ell(g, 18, 22.5, 4, 1.6); fs(g, '#6b3b1f', null);
  });

  /* ---------------------- Icons (UI) ---------------------- */
  const CATC = { attack: ['#ff8a73', '#a83526'], elemental: ['#b78cff', '#5a3d99'], defense: ['#5aa9e6', '#2a5f8a'], movement: ['#5fd3b4', '#25876c'], economy: ['#ffd166', '#b8860b'] };
  function cardShape(g, x, y, w, h, c1 = '#ffd166', c2 = '#2a5f8a') { rr(g, x, y, w, h, 2); fs(g, c1, OUT, 1.2); g.fillStyle = c2; g.fillRect(x + 1, y + h * 0.3, w - 2, h * 0.18); g.fillStyle = '#fff'; g.fillRect(x + w * 0.15, y + h * 0.65, w * 0.3, h * 0.12); }
  const ICON = {
    double_order: g => { cardShape(g, 10, 16, 20, 14); cardShape(g, 18, 22, 20, 14); },
    rapid_payment: g => { cardShape(g, 18, 17, 20, 14); [20, 25, 30].forEach(y => line(g, 6, y, 15, y, '#fff', 2)); },
    piercing_card: g => { cardShape(g, 14, 16, 20, 14); line(g, 6, 24, 42, 24, '#fff', 2.5); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(42, 24); g.lineTo(36, 19); g.lineTo(36, 29); g.fill(); },
    ricochet: g => { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 36); g.lineTo(20, 14); g.lineTo(30, 30); g.lineTo(40, 12); g.stroke(); dot(g, 20, 14, 3, '#ffd166'); dot(g, 30, 30, 3, '#ffd166'); },
    critical_receipt: g => { rr(g, 13, 8, 20, 30, 2); fs(g, '#fff8e8'); [14, 19, 24].forEach(y => line(g, 16, y, 30, y, '#c9b48e', 1.5)); star(g, 23, 30, 7, '#ffd166'); },
    diagonal_delivery: g => { [[-0.7, '#fff'], [0, '#ffd166'], [0.7, '#fff']].forEach(([a, c]) => { g.save(); g.translate(24, 38); g.rotate(a); line(g, 0, 0, 0, -26, c, 3); g.fillStyle = c; g.beginPath(); g.moveTo(0, -30); g.lineTo(-5, -23); g.lineTo(5, -23); g.fill(); g.restore(); }); },
    electric_card: g => { g.beginPath(); g.moveTo(27, 5); g.lineTo(13, 27); g.lineTo(23, 27); g.lineTo(19, 43); g.lineTo(35, 19); g.lineTo(25, 19); g.closePath(); fs(g, '#ffe14d', OUT, 1.5); },
    frozen_payment: g => { for (let i = 0; i < 3; i++) { g.save(); g.translate(24, 24); g.rotate(i * Math.PI / 3); line(g, 0, -16, 0, 16, '#e8f8ff', 3); line(g, -4, -12, 0, -8, '#e8f8ff', 2); line(g, 4, -12, 0, -8, '#e8f8ff', 2); line(g, -4, 12, 0, 8, '#e8f8ff', 2); line(g, 4, 12, 0, 8, '#e8f8ff', 2); g.restore(); } },
    burning_receipt: g => { g.beginPath(); g.moveTo(24, 6); g.quadraticCurveTo(38, 22, 34, 32); g.quadraticCurveTo(30, 42, 24, 42); g.quadraticCurveTo(14, 42, 13, 32); g.quadraticCurveTo(12, 24, 19, 18); g.quadraticCurveTo(19, 26, 24, 26); g.quadraticCurveTo(20, 16, 24, 6); fs(g, '#ff7b3a', OUT, 1.5); ell(g, 24, 34, 5, 6); fs(g, '#ffe14d', null); },
    toxic_payment: g => { g.beginPath(); g.moveTo(24, 6); g.quadraticCurveTo(38, 26, 34, 34); g.quadraticCurveTo(30, 42, 24, 42); g.quadraticCurveTo(18, 42, 14, 34); g.quadraticCurveTo(10, 26, 24, 6); fs(g, '#7ddc4a', OUT, 1.5); dot(g, 20, 30, 3, '#c4f59a'); dot(g, 28, 34, 2, '#c4f59a'); },
    reinforced_helmet: g => { ell(g, 22, 26, 14, 12); fs(g, '#f4c542', OUT, 1.5); g.fillStyle = '#2b3a4a'; g.fillRect(9, 26, 26, 4); g.fillStyle = '#fff'; g.fillRect(34, 8, 4, 12); g.fillRect(30, 12, 12, 4); },
    emergency_shield: g => { g.beginPath(); g.moveTo(24, 6); g.lineTo(39, 12); g.quadraticCurveTo(38, 32, 24, 42); g.quadraticCurveTo(10, 32, 9, 12); g.closePath(); fs(g, '#cfe8ff', OUT, 1.5); g.fillStyle = '#5aa9e6'; g.fillRect(22, 14, 4, 20); g.fillRect(15, 21, 18, 4); },
    cashback: g => { ell(g, 24, 24, 13, 13); fs(g, '#ffcc33', OUT, 1.5); g.fillStyle = '#8a5a0b'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.fillText('₺', 24, 30); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.arc(24, 24, 18, -2.6, -0.6); g.stroke(); },
    protective_packaging: g => { rr(g, 10, 14, 28, 24, 2); fs(g, '#d9a36a', OUT, 1.5); line(g, 24, 14, 24, 38, '#a8723c', 2); for (let x = 0; x < 3; x++) for (let y = 0; y < 2; y++) dot(g, 15 + x * 9, 22 + y * 9, 2.4, 'rgba(255,255,255,.7)'); },
    heat_resistant_bag: g => { rr(g, 11, 16, 26, 22, 3); fs(g, '#f08a2c', OUT, 1.5); [16, 24, 32].forEach(x => { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 13); g.quadraticCurveTo(x - 3, 9, x, 5); g.stroke(); }); line(g, 9, 6, 39, 40, '#e5533d', 3); },
    express_courier: g => { dot(g, 14, 32, 6, '#2b2f3a'); dot(g, 34, 32, 6, '#2b2f3a'); rr(g, 12, 20, 22, 8, 3); fs(g, '#e2553f'); line(g, 32, 20, 36, 10, '#2b2f3a', 2.5); [14, 19].forEach(y => line(g, 2, y, 10, y, '#fff', 2)); },
    emergency_brake: g => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8; g.lineTo(24 + Math.cos(a) * 16, 24 + Math.sin(a) * 16); } g.closePath(); fs(g, '#e5533d', OUT, 1.5); g.fillStyle = '#fff'; g.fillRect(14, 21, 20, 6); },
    last_minute: g => { g.beginPath(); g.moveTo(13, 8); g.lineTo(35, 8); g.lineTo(24, 24); g.lineTo(35, 40); g.lineTo(13, 40); g.lineTo(24, 24); g.closePath(); fs(g, '#fff8e8', OUT, 1.5); g.fillStyle = '#f2a541'; g.beginPath(); g.moveTo(18, 38); g.lineTo(30, 38); g.lineTo(24, 30); g.fill(); line(g, 11, 8, 37, 8, OUT, 3); line(g, 11, 40, 37, 40, OUT, 3); },
    shortcut_expert: g => { g.strokeStyle = '#fff'; g.lineWidth = 3; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(10, 40); g.quadraticCurveTo(10, 20, 30, 18); g.stroke(); g.setLineDash([]); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(38, 17); g.lineTo(29, 11); g.lineTo(29, 24); g.fill(); dot(g, 10, 40, 3, '#ffd166'); },
    perfect_balance: g => { line(g, 24, 8, 24, 38, '#fff', 2.5); line(g, 10, 16, 38, 16, '#fff', 2.5); g.beginPath(); g.arc(12, 26, 6, 0, Math.PI); fs(g, '#ffd166', OUT, 1.2); g.beginPath(); g.arc(36, 26, 6, 0, Math.PI); fs(g, '#ffd166', OUT, 1.2); line(g, 12, 16, 7, 26, '#fff', 1); line(g, 12, 16, 17, 26, '#fff', 1); line(g, 36, 16, 31, 26, '#fff', 1); line(g, 36, 16, 41, 26, '#fff', 1); rr(g, 16, 38, 16, 4, 1); fs(g, '#fff', null); },
  };
  function star(g, x, y, r, c) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rr2 = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } g.closePath(); fs(g, c, OUT, 1); }
  function skillIcon(id) {
    const sk = SKILL_BY_ID[id];
    return sprite('ic_' + id, 48, 48, 24, 24, g => {
      const [c1, c2] = CATC[sk.cat]; const gr = g.createLinearGradient(0, 0, 0, 48); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      rr(g, 1, 1, 46, 46, 10); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, 4, 4, 40, 18, 7); g.fill();
      (ICON[id] || (gg => drawGlyph(gg, id)))(g);
    });
  }
  const GICON = {
    motor: g => { dot(g, 14, 34, 7, '#2b2f3a'); dot(g, 36, 34, 7, '#2b2f3a'); dot(g, 14, 34, 3, '#9aa3ad'); dot(g, 36, 34, 3, '#9aa3ad'); rr(g, 12, 20, 26, 10, 4); fs(g, '#e2553f'); rr(g, 20, 14, 12, 6, 2); fs(g, '#2b2f3a'); line(g, 36, 20, 40, 10, '#2b2f3a', 3); },
    helmet: g => { ell(g, 25, 26, 15, 14); fs(g, '#f4c542'); g.fillStyle = '#2b3a4a'; rr(g, 10, 24, 30, 7, 3); g.fill(); g.fillStyle = '#c9952a'; g.fillRect(23, 12, 4, 10); },
    jacket: g => { g.beginPath(); g.moveTo(14, 10); g.lineTo(20, 8); g.lineTo(25, 13); g.lineTo(30, 8); g.lineTo(36, 10); g.lineTo(42, 22); g.lineTo(36, 24); g.lineTo(36, 42); g.lineTo(14, 42); g.lineTo(14, 24); g.lineTo(8, 22); g.closePath(); fs(g, '#e2553f'); g.fillStyle = '#fff1dc'; g.fillRect(14, 30, 22, 3); line(g, 25, 13, 25, 42, '#a83526', 1.5); },
    pos: g => { rr(g, 13, 8, 24, 34, 4); fs(g, '#2b2f3a'); rr(g, 16, 11, 18, 11, 2); fs(g, '#7cf5c0', null); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { rr(g, 17 + i * 6, 25 + j * 5, 4, 3, 1); fs(g, '#9aa3ad', null); } cardShape(g, 30, 4, 14, 10); },
  };
  GICON.bag = g => { rr(g, 11, 14, 28, 26, 5); fs(g, '#f08a2c'); rr(g, 17, 8, 16, 8, 3); fs(g, '#b5601a'); g.fillStyle = '#fff1dc'; g.fillRect(11, 24, 28, 3); dot(g, 25, 33, 3, '#fff1dc'); };
  GICON.tires = g => { dot(g, 25, 25, 17, '#2b2f3a'); dot(g, 25, 25, 9, '#9aa3ad'); dot(g, 25, 25, 4, '#2b2f3a'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.fillStyle = '#4a4f59'; g.fillRect(25 + Math.cos(a) * 14 - 2, 25 + Math.sin(a) * 14 - 2, 4, 4); } };
  GICON.brakes = g => { dot(g, 25, 25, 16, '#9aa3ad'); dot(g, 25, 25, 6, '#5d6570'); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; dot(g, 25 + Math.cos(a) * 11, 25 + Math.sin(a) * 11, 2, '#5d6570'); } g.beginPath(); g.arc(25, 25, 19, -2.4, -0.7); g.lineWidth = 6; g.strokeStyle = '#e2553f'; g.stroke(); };
  GICON.battery = g => { rr(g, 10, 14, 30, 24, 4); fs(g, '#3b82c4'); rr(g, 14, 9, 7, 5, 1.5); fs(g, '#2b2f3a'); rr(g, 29, 9, 7, 5, 1.5); fs(g, '#2b2f3a'); g.beginPath(); g.moveTo(27, 17); g.lineTo(19, 27); g.lineTo(25, 27); g.lineTo(22, 35); g.lineTo(31, 24); g.lineTo(25, 24); g.closePath(); fs(g, '#ffd166'); };
  function garageIcon(id) { return sprite('gi_' + id, 50, 50, 25, 25, g => { GICON[id](g); }); }
  function pkgIcon(id, size = 18) {
    const p = PACKAGES[id];
    return sprite('pk_' + id + size, size, size, size / 2, size / 2, g => {
      const s = size / 18; g.scale(s, s);
      rr(g, 2, 4, 14, 12, 2); fs(g, '#d9a36a'); g.fillStyle = p.color; g.fillRect(2.5, 4.5, 13, 3.4); line(g, 9, 4, 9, 16, '#a8723c', 1);
      g.fillStyle = '#fff'; g.font = 'bold 7px sans-serif'; g.textAlign = 'center'; g.fillText(p.icon, 9, 14.5);
    });
  }
  /** Convert a cached sprite to a data URL for DOM <img> use. */
  const urlCache = new Map();
  function url(s) { let u = urlCache.get(s); if (!u) { u = s.img.toDataURL(); urlCache.set(s, u); } return u; }
  function portrait(short) {
    return sprite('por_' + short, 56, 56, 28, 28, g => {
      const s = enemy(short, 0, 'n'), d = ENEMY_DB[ENEMY_SHORT[short]]; const sc = Math.min(46 / d.w, 46 / d.h, 2.2);
      g.drawImage(s.img, 28 - s.ax * sc, 52 - s.ay * sc, s.w * sc, s.h * sc);
    });
  }
  function courierPortrait(skinId) { return sprite('cp2_' + skinId, 64, 72, 32, 36, g => { const s = courier(skinId, 2, 0, true, 0, false), k = 1.5; g.drawImage(s.img, 32 - s.ax * k, 68 - s.ay * k, s.w * k, s.h * k); }); }

  /* ---------------------- Map tiles ---------------------- */
  // Tile codes (shared with MapBuilder)
  const TT = { FLOOR: 0, WALL: 1, COUNTER: 2, MACHINE: 3, TABLE: 4, BOX: 5, PLANT: 6, VENT: 7, SPILL: 8, SAFE: 9, GRATE: 10, DROP: 11 };
  const FLOORS = [['#d8b48a', '#cba277', '#bf966b'], ['#c99a6b', '#b8895c', '#a87b50'], ['#d6b893', '#c6a27a', '#b38c64']];
  function tileHash(c, r, k = 0) { let h = (c * 73856093) ^ (r * 19349663) ^ (k * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function drawFloor(g, x, y, c, r, style) {
    const [a, b, d] = FLOORS[style % FLOORS.length];
    if (style % 3 === 1) { // wood planks
      g.fillStyle = a; g.fillRect(x, y, TILE, TILE);
      for (let i = 0; i < 3; i++) { g.fillStyle = (i + r) % 2 ? a : b; g.fillRect(x, y + i * 8, TILE, 8); g.fillStyle = d; g.fillRect(x, y + i * 8 + 7.4, TILE, 0.6); const off = ((r * 3 + i) * 7 + c * 24) % 24; g.fillRect(x + (off % 24), y + i * 8, 0.6, 8); }
    } else { // checker tiles
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = ((i + j + c + r) % 2) ? a : b; g.fillRect(x + i * 12, y + j * 12, 12, 12); }
      g.fillStyle = 'rgba(90,60,40,.18)'; g.fillRect(x, y, TILE, 0.6); g.fillRect(x, y, 0.6, TILE); g.fillRect(x + 12, y, 0.4, TILE); g.fillRect(x, y + 12, TILE, 0.4);
    }
    const h = tileHash(c, r, 1);
    if (h < 0.12) { g.fillStyle = 'rgba(80,45,20,.35)'; ell(g, x + 6 + h * 80, y + 8 + h * 40, 1.6, 1); g.fill(); ell(g, x + 9 + h * 70, y + 15, 1.3, 0.9); g.fill(); }
    else if (h > 0.94) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 4, y + 16, 8, 1); }
  }
  /** Render rows [r0, r1) of the world grid into an offscreen chunk canvas. */
  function renderChunk(world, r0, r1) {
    const [cv, g] = mk(VIEW_W, (r1 - r0) * TILE);
    g.translate(0, -r0 * TILE);
    const at = (c, r) => (c < 0 || c >= COLS || r < 0 || r >= world.rows) ? TT.WALL : world.tile[r * COLS + c];
    const solidish = t => t >= TT.WALL && t <= TT.VENT;
    const wallLike = t => t === TT.WALL || t === TT.VENT;
    for (let r = Math.max(0, r0 - 1); r < Math.min(world.rows, r1 + 1); r++) for (let c = 0; c < COLS; c++) {
      const t = at(c, r), x = c * TILE, y = r * TILE, style = world.rowStyle[r] || 0;
      if (!wallLike(t)) {
        drawFloor(g, x, y, c, r, style);
        if (t === TT.SAFE) {
          g.fillStyle = '#5f7d4f'; g.fillRect(x, y, TILE, TILE);
          g.fillStyle = '#6e8f5c'; g.beginPath(); g.moveTo(x + 12, y + 4); g.lineTo(x + 20, y + 12); g.lineTo(x + 12, y + 20); g.lineTo(x + 4, y + 12); g.fill();
          g.fillStyle = '#e9c46a';
          if (at(c, r - 1) !== TT.SAFE) g.fillRect(x, y + 1, TILE, 2); if (at(c, r + 1) !== TT.SAFE) g.fillRect(x, y + TILE - 3, TILE, 2);
          if (at(c - 1, r) !== TT.SAFE) g.fillRect(x + 1, y, 2, TILE); if (at(c + 1, r) !== TT.SAFE) g.fillRect(x + TILE - 3, y, 2, TILE);
        } else if (t === TT.DROP) {
          g.fillStyle = '#2f6f5e'; g.fillRect(x, y, TILE, TILE);
          g.save(); g.beginPath(); g.rect(x, y, TILE, TILE); g.clip(); g.fillStyle = '#3d8c77'; for (let i = -24; i < 24; i += 8) { g.beginPath(); g.moveTo(x + i, y + TILE); g.lineTo(x + i + 4, y + TILE); g.lineTo(x + i + 28, y); g.lineTo(x + i + 24, y); g.fill(); } g.restore();
          g.fillStyle = '#ffd166';
          if (at(c, r - 1) !== TT.DROP) g.fillRect(x, y, TILE, 2.5); if (at(c, r + 1) !== TT.DROP) g.fillRect(x, y + TILE - 2.5, TILE, 2.5);
          if (at(c - 1, r) !== TT.DROP) g.fillRect(x, y, 2.5, TILE); if (at(c + 1, r) !== TT.DROP) g.fillRect(x + TILE - 2.5, y, 2.5, TILE);
        } else if (t === TT.GRATE) {
          rr(g, x + 3, y + 3, 18, 18, 2); fs(g, '#3a3532', '#1e1a18', 1);
          g.fillStyle = '#5b5550'; for (let i = 0; i < 4; i++) g.fillRect(x + 5, y + 5.5 + i * 4, 14, 1.6);
          g.fillStyle = 'rgba(160,80,30,.35)'; g.fillRect(x + 4, y + 16, 5, 3);
        }
      } else {
        // wall: top face + front face if open below
        g.fillStyle = '#3a2419'; g.fillRect(x, y, TILE, TILE);
        g.fillStyle = '#2c1b12'; for (let i = 0; i < 3; i++) { g.fillRect(x, y + i * 8 + 7, TILE, 1); g.fillRect(x + ((i % 2) ? 12 : 0) + 6, y + i * 8, 1, 8); }
        const below = at(c, r + 1);
        if (!wallLike(below)) {
          const fh = 10, fy = y + TILE - fh;
          g.fillStyle = '#7a4a32'; g.fillRect(x, fy, TILE, fh); g.fillStyle = '#9a6448'; g.fillRect(x, fy, TILE, 1.5);
          g.fillStyle = '#5e3624'; g.fillRect(x, fy + 5, TILE, 0.8); g.fillRect(x + (c % 2 ? 6 : 16), fy + 1.5, 0.8, 3.5); g.fillRect(x + (c % 2 ? 14 : 4), fy + 5.8, 0.8, 4);
          const hh = tileHash(c, r, 7);
          if (t === TT.WALL && hh < 0.18 && c > 1 && c < 13) { rr(g, x + 4, fy - 6, 16, 9, 1); fs(g, '#2b2420', '#1a1410'); g.fillStyle = '#fff1dc'; g.fillRect(x + 6, fy - 4, 8, 1); g.fillRect(x + 6, fy - 2, 11, 1); g.fillRect(x + 6, fy, 6, 1); }
          else if (t === TT.WALL && hh > 0.85) { g.fillStyle = '#5e3a26'; g.fillRect(x + 2, fy - 2, 20, 2); [5, 11, 17].forEach((px, i) => { rr(g, x + px - 2, fy - 7, 4, 5, 1); fs(g, ['#e9c46a', '#c27a3a', '#9fd3c7'][i], '#1a1410', 0.6); }); }
        }
        if (t === TT.VENT) {
          const dir = world.ventDir[r * COLS + c] || 1; const vx = dir > 0 ? x + TILE - 7 : x;
          rr(g, vx, y + 4, 7, 16, 1.5); fs(g, '#8a8f96', '#2b2f3a');
          g.fillStyle = '#2b2f3a'; for (let i = 0; i < 4; i++) g.fillRect(vx + 1.2, y + 6.5 + i * 3.4, 4.6, 1.6);
          g.fillStyle = '#e5533d'; g.fillRect(dir > 0 ? x + 3 : x + TILE - 6, y + 10, 3, 3);
        }
        // edge shading so wall borders are crisp
        g.fillStyle = 'rgba(0,0,0,.25)';
        if (!wallLike(at(c - 1, r))) g.fillRect(x, y, 1.5, TILE); if (!wallLike(at(c + 1, r))) g.fillRect(x + TILE - 1.5, y, 1.5, TILE);
        g.fillStyle = 'rgba(255,220,180,.12)'; if (!wallLike(at(c, r - 1))) g.fillRect(x, y, TILE, 1.5);
      }
    }
    // coffee spills: merged puddle regions with rounded outer corners + gloss
    for (let r = Math.max(0, r0 - 1); r < Math.min(world.rows, r1 + 1); r++) for (let c = 0; c < COLS; c++) {
      if (at(c, r) !== TT.SPILL) continue; const x = c * TILE, y = r * TILE, h = tileHash(c, r, 3);
      const L = at(c - 1, r) === TT.SPILL, Rr = at(c + 1, r) === TT.SPILL, U = at(c, r - 1) === TT.SPILL, Dn = at(c, r + 1) === TT.SPILL;
      const x0 = x + (L ? 0 : 3), x1 = x + TILE - (Rr ? 0 : 3), y0 = y + (U ? 0 : 3), y1 = y + TILE - (Dn ? 0 : 3);
      const rad = (a1, a2) => (!a1 && !a2) ? 8 : 0, tl = rad(L, U), tr = rad(Rr, U), br = rad(Rr, Dn), bl = rad(L, Dn);
      g.beginPath(); g.moveTo(x0 + tl, y0); g.lineTo(x1 - tr, y0); g.arcTo(x1, y0, x1, y0 + tr, tr); g.lineTo(x1, y1 - br); g.arcTo(x1, y1, x1 - br, y1, br);
      g.lineTo(x0 + bl, y1); g.arcTo(x0, y1, x0, y1 - bl, bl); g.lineTo(x0, y0 + tl); g.arcTo(x0, y0, x0 + tl, y0, tl); g.closePath();
      g.fillStyle = 'rgba(96,52,18,.88)'; g.fill();
      g.fillStyle = 'rgba(140,82,36,.55)'; if (!U) g.fillRect(x0 + tl, y0 + 1, x1 - x0 - tl - tr, 1.4); if (!L) g.fillRect(x0 + 1, y0 + tl, 1.4, y1 - y0 - tl - bl);
      g.fillStyle = 'rgba(255,240,220,.28)'; ell(g, x + 8 + h * 8, y + 8 + h * 4, 3.5, 1.4); g.fill(); if (h > 0.5) { ell(g, x + 16, y + 16, 1.6, 0.8); g.fill(); }
    }
    // floor ambient occlusion next to solids
    for (let r = Math.max(0, r0); r < Math.min(world.rows, r1); r++) for (let c = 0; c < COLS; c++) {
      const t = at(c, r); if (solidish(t)) continue; const x = c * TILE, y = r * TILE;
      g.fillStyle = 'rgba(30,15,5,.22)';
      if (solidish(at(c - 1, r))) g.fillRect(x, y, 4, TILE); if (solidish(at(c + 1, r))) g.fillRect(x + TILE - 4, y, 4, TILE);
      if (solidish(at(c, r - 1))) g.fillRect(x, y, TILE, 5);
    }
    // furniture (drawn last so it overlaps floor detail)
    for (let r = Math.max(0, r0 - 1); r < Math.min(world.rows, r1 + 1); r++) for (let c = 0; c < COLS; c++) {
      const t = at(c, r), x = c * TILE, y = r * TILE, h = tileHash(c, r, 5);
      if (t === TT.COUNTER || t === TT.MACHINE) {
        const below = at(c, r + 1), openBelow = !(below === TT.COUNTER || below === TT.MACHINE);
        g.fillStyle = '#a8703f'; g.fillRect(x, y, TILE, TILE);
        g.fillStyle = '#c48a52'; g.fillRect(x, y, TILE, 2.5);
        if (at(c - 1, r) !== TT.COUNTER && at(c - 1, r) !== TT.MACHINE) { g.fillStyle = '#7a4a2c'; g.fillRect(x, y, 2, TILE); }
        if (at(c + 1, r) !== TT.COUNTER && at(c + 1, r) !== TT.MACHINE) { g.fillStyle = '#7a4a2c'; g.fillRect(x + TILE - 2, y, 2, TILE); }
        g.fillStyle = 'rgba(80,45,20,.25)'; g.fillRect(x, y + 8, TILE, 0.6); g.fillRect(x, y + 13, TILE, 0.6);
        if (openBelow) { g.fillStyle = '#6b4026'; g.fillRect(x, y + TILE - 8, TILE, 8); g.fillStyle = '#4e2e1b'; g.fillRect(x, y + TILE - 1.5, TILE, 1.5); g.fillRect(x + 11.5, y + TILE - 8, 1, 6.5); }
        if (t === TT.MACHINE) {
          const mv = tileHash(c, r, 9);
          if (mv < 0.5) { // espresso machine
            rr(g, x + 2, y - 6, 20, 16, 2.5); fs(g, '#c3cbd3', '#2b2f3a');
            g.fillStyle = '#8a8f96'; g.fillRect(x + 3, y - 5.5, 18, 2.5);
            ell(g, x + 8, y - 7, 2, 1.3); fs(g, '#f3efe6', '#2b2f3a', 0.5); ell(g, x + 14, y - 7, 2, 1.3); fs(g, '#f3efe6', '#2b2f3a', 0.5);
            g.fillStyle = '#9aa3ad'; g.fillRect(x + 4, y + 0.5, 16, 6);
            g.fillStyle = '#2b2f3a'; g.fillRect(x + 9.5, y + 2, 5, 2.6); line(g, x + 14, y + 3.3, x + 21.5, y + 5, '#1a1410', 1.8);
            g.fillStyle = '#4b5058'; g.fillRect(x + 4.5, y + 7.5, 15, 2);
            dot(g, x + 5.6, y - 1.6, 1, '#e5533d'); line(g, x + 19, y - 2, x + 19.5, y + 5, '#6b7078', 1);
          } else if (mv < 0.78) { // coffee grinder
            rr(g, x + 6, y + 1, 12, 9, 2); fs(g, '#2b2f3a'); rr(g, x + 7.5, y - 5, 9, 7, 1.5); fs(g, '#4b5058');
            g.beginPath(); g.moveTo(x + 6, y - 13); g.lineTo(x + 18, y - 13); g.lineTo(x + 15, y - 5); g.lineTo(x + 9, y - 5); g.closePath(); fs(g, 'rgba(205,232,242,.95)', '#2b2f3a', 0.8);
            g.fillStyle = '#5b3214'; [[9, -9], [12, -8], [14.5, -10], [11, -11], [13, -6.5]].forEach(([dx, dy]) => { ell(g, x + dx, y + dy, 1.3, 0.9); g.fill(); });
            ell(g, x + 12, y + 7, 2.4, 1.6); fs(g, '#f3efe6', '#2b2f3a', 0.5);
          } else { // pastry display case
            rr(g, x + 1.5, y - 4, 21, 14, 2); fs(g, 'rgba(214,236,250,.7)', '#6b7078', 1);
            g.fillStyle = '#e8ecef'; g.fillRect(x + 2, y + 3, 20, 1);
            ell(g, x + 6.5, y + 0.5, 3, 1.8); fs(g, '#d9a36a', '#8a5a2e', 0.5); ell(g, x + 13, y + 0.5, 2.6, 2); fs(g, '#f7a1b5', '#a8506a', 0.5); dot(g, x + 13, y + 0.5, 0.8, '#fff');
            ell(g, x + 18.5, y + 0.5, 2.4, 2); fs(g, '#7a4a2c', '#3a2010', 0.5); ell(g, x + 9, y + 6.5, 3, 1.6); fs(g, '#e9c46a', '#8a5a2e', 0.5); ell(g, x + 16, y + 6.5, 3, 1.6); fs(g, '#c27a3a', '#6b3b1f', 0.5);
          }
        } else if (h < 0.3) { ell(g, x + 8 + h * 20, y + 6, 3, 2.3); fs(g, '#f3efe6', OUT, 0.7); ell(g, x + 8 + h * 20, y + 5.6, 1.8, 1); fs(g, '#6b3b1f', null); }
        else if (h > 0.82) { rr(g, x + 5, y + 2, 14, 9, 2); fs(g, '#2b2f3a'); g.fillStyle = '#7cf5c0'; g.fillRect(x + 7, y + 3.5, 6, 3); }
        else if (h > 0.65) { ell(g, x + 12, y + 7, 7, 4); fs(g, 'rgba(220,240,255,.55)', '#8a8f96', 0.7); dot(g, x + 10, y + 7.5, 2, '#d9a36a'); dot(g, x + 14, y + 7.5, 2, '#c27a3a'); }
      } else if (t === TT.TABLE) {
        [[12, 1.5], [12, 22.5], [1.5, 12], [22.5, 12]].forEach(([dx, dy]) => { dot(g, x + dx, y + dy, 3.4, '#7a4a2c'); g.strokeStyle = OUT; g.lineWidth = 0.7; g.beginPath(); g.arc(x + dx, y + dy, 3.4, 0, TAU); g.stroke(); });
        ell(g, x + 12, y + 13.5, 10, 8); fs(g, 'rgba(0,0,0,.25)', null);
        ell(g, x + 12, y + 12, 10, 9); fs(g, '#a87148', OUT, 1);
        ell(g, x + 12, y + 11, 7.5, 6); fs(g, '#b98352', null);
        ell(g, x + 9 + h * 6, y + 10, 2.6, 2); fs(g, '#f3efe6', OUT, 0.6); ell(g, x + 9 + h * 6, y + 9.7, 1.6, 1); fs(g, '#6b3b1f', null);
        if (h > 0.5) { rr(g, x + 13, y + 12, 5, 4, 1); fs(g, '#e9c46a', OUT, 0.5); }
      } else if (t === TT.BOX) {
        if (h < 0.5) { rr(g, x + 2, y + 1, 20, 20, 2); fs(g, '#b98552'); g.fillStyle = '#8a5a2e'; g.fillRect(x + 3, y + 7, 18, 1.2); g.fillRect(x + 3, y + 14, 18, 1.2); line(g, x + 3, y + 2, x + 21, y + 20, '#8a5a2e', 1.2); g.fillStyle = '#7a4a2c'; g.fillRect(x + 2, y + 18, 20, 4); }
        else { ell(g, x + 12, y + 13, 10, 9.5); fs(g, '#c9a878'); g.fillStyle = '#8a6a44'; g.font = 'bold 6px sans-serif'; g.textAlign = 'center'; g.fillText('KAHVE', x + 12, y + 14); ell(g, x + 12, y + 4.5, 4, 2.4); fs(g, '#b3925f'); }
      } else if (t === TT.PLANT) {
        ell(g, x + 12, y + 20, 8, 3); fs(g, 'rgba(0,0,0,.25)', null);
        rr(g, x + 6, y + 11, 12, 10, 2); fs(g, '#c0643a'); g.fillStyle = '#9a4a28'; g.fillRect(x + 6.5, y + 11.5, 11, 2.5);
        [[12, 5, 6, '#4c8a3e'], [7, 8, 4.5, '#5fa04a'], [17, 8, 4.5, '#5fa04a'], [12, 3, 3.5, '#76b85c']].forEach(([dx, dy, rad, col]) => { ell(g, x + dx, y + dy, rad, rad * 0.85); fs(g, col, OUT, 0.8); });
      }
    }
    // start mark
    if (world.start) { const sx = world.start.x, sy = world.start.y; if (sy >= r0 * TILE - TILE && sy <= r1 * TILE + TILE) { g.strokeStyle = 'rgba(255,241,220,.5)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.arc(sx, sy, 13, 0, TAU); g.stroke(); g.setLineDash([]); } }
    return cv;
  }
  return { R, sprite, register, get: k => registry.get(k) || cache.get(k), draw, flashOf, courier, enemy, cart, pickup, healSt, checkSign, customer, skillIcon, garageIcon, pkgIcon, url, portrait, courierPortrait, renderChunk, TT, rr, ell, star };
})();
export const TT = Art.TT;
