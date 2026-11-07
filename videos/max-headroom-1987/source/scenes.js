// ===== programs (drawn into the 360x270 screen buffer) =====
function drawProgram(c, name, t, o) {
  if (name === 'news') return progNews(c, t, o);
  if (name === 'scifi') return progSciFi(c, t, o);
  if (name === 'pirate') return progPirate(c, t, o);
}
function progNews(c, t, o) {
  c.fillStyle = '#41679a'; c.fillRect(0, 0, SW, SH);
  P(c, 'rectangle', [-5, -5, SW + 10, SH + 10], { fill: '#4b74a8', hfill: '#35598a', gap: 4, sw: 0, stroke: 'none', seed: 1, fw: 1 });
  // skyline backdrop panel
  const b = [[10, 70, 30], [42, 50, 26], [70, 95, 22], [95, 30, 30], [128, 80, 20], [230, 60, 26], [258, 22, 22], [282, 75, 30], [314, 45, 34]];
  for (let i = 0; i < b.length; i++) { const [x, y, w] = b[i]; P(c, 'rectangle', [x, y, w, 170 - y], { fill: '#24365e', sw: 0.8, stroke: '#1a2645', gap: 3, seed: 20 + i, r: 0.7 }); }
  for (let i = 0; i < 40; i++) { const x = 14 + hash(i) * 330, y = 40 + hash(i * 3) * 110; if (hash(i * 7) > 0.4) { c.fillStyle = 'rgba(255,220,130,0.7)'; c.fillRect(x, y, 3, 3); } }
  // emblem (no letters)
  P(c, 'circle', [312, 40, 40], { fill: '#e9a84c', sw: 1.4, gap: 3, seed: 5 });
  P(c, 'circle', [312, 40, 22], { fill: '#f6e3b0', sw: 1, gap: 2, seed: 6 });
  // anchor
  const talk = Math.abs(Math.sin(t * 11)) * (0.5 + 0.5 * Math.abs(Math.sin(t * 3.3)));
  c.save(); c.translate(178, 0); c.rotate(0.02 * Math.sin(t * 1.3));
  P(c, 'polygon', [[-95, 270], [-80, 175], [-36, 152], [36, 152], [80, 175], [95, 270]], { fill: '#2f3d5f', sw: 1.5, gap: 3, seed: 7 });
  P(c, 'polygon', [[-24, 152], [24, 152], [0, 205]], { fill: '#f4f1ea', sw: 1.2, gap: 2, seed: 8 });
  P(c, 'polygon', [[-6, 156], [6, 156], [4, 200], [0, 208], [-4, 200]], { fill: '#b8443f', sw: 1, gap: 2, seed: 9 });
  P(c, 'rectangle', [-12, 128, 24, 28], { fill: '#e8b98f', sw: 1, gap: 3, seed: 10 });
  P(c, 'ellipse', [0, 104, 66, 78], { fill: '#f0c49a', sw: 1.5, gap: 3, seed: 11 });
  P(c, 'path', ['M-33,96 Q-36,58 0,60 Q36,58 33,96 Q30,74 0,74 Q-22,74 -33,96 Z'], { fill: '#5b3a24', sw: 1.2, gap: 2, seed: 12 });
  c.fillStyle = INK; c.fillRect(-15, 100, 5, 4); c.fillRect(10, 100, 5, 4);
  P(c, 'ellipse', [0, 124, 16, 3 + talk * 8], { fill: '#7a2b2b', sw: 1, seed: 13, hatch: false });
  c.restore();
  // desk
  P(c, 'polygon', [[-5, 220], [SW + 5, 220], [SW + 5, 275], [-5, 275]], { fill: '#7b5236', sw: 1.6, gap: 3, seed: 14 });
  P(c, 'rectangle', [120, 210, 50, 10], { fill: '#fbf7ef', sw: 0.9, seed: 15, hatch: false });
  // lower third bar (no lettering)
  P(c, 'rectangle', [0, 236, 250, 22], { fill: '#c9483f', sw: 1, gap: 3, seed: 16, stroke: '#5a1d1a' });
  P(c, 'rectangle', [0, 236, 34, 22], { fill: '#f1d16a', sw: 1, gap: 3, seed: 17, hatch: false });
}
function progSciFi(c, t, o) {
  c.fillStyle = '#123536'; c.fillRect(0, 0, SW, SH);
  const vx = 180, vy = 128;
  // corridor walls
  P(c, 'polygon', [[0, 0], [vx - 50, vy - 40], [vx - 50, vy + 40], [0, SH]], { fill: '#2b5a58', sw: 1.2, gap: 4, seed: 30 });
  P(c, 'polygon', [[SW, 0], [vx + 50, vy - 40], [vx + 50, vy + 40], [SW, SH]], { fill: '#2b5a58', sw: 1.2, gap: 4, seed: 31 });
  P(c, 'polygon', [[0, 0], [SW, 0], [vx + 50, vy - 40], [vx - 50, vy - 40]], { fill: '#1b4241', sw: 1.2, gap: 5, seed: 32 });
  P(c, 'polygon', [[0, SH], [SW, SH], [vx + 50, vy + 40], [vx - 50, vy + 40]], { fill: '#26302f', sw: 1.2, gap: 5, seed: 33 });
  // roundels on walls (generic retro)
  for (let k = 0; k < 3; k++) {
    const f = [0.18, 0.45, 0.68][k]; const rr = 34 * (1 - f) + 6;
    for (const s of [-1, 1]) {
      const x = vx + s * (lerp(180, 50, f) - 0) * 0.92 - s * 8, y = vy + lerp(-20, 0, f);
      P(c, 'ellipse', [x, y, rr * 0.7, rr], { fill: '#d6e9de', sw: 1, gap: 2.5, seed: 40 + k * 2 + (s > 0), r: 0.6 });
      glow(c, x, y, rr, 'rgba(160,255,220,0.5)', 0.25);
    }
  }
  // time-tunnel spiral at vanishing point
  c.save(); c.translate(vx, vy); c.rotate(t * 1.6);
  for (let i = 0; i < 7; i++) { c.strokeStyle = i % 2 ? 'rgba(120,230,240,0.85)' : 'rgba(220,120,200,0.8)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 6 + i * 6, i, i + 4.2); c.stroke(); }
  c.restore(); glow(c, vx, vy, 60, 'rgba(140,240,255,0.9)', 0.5 + 0.2 * Math.sin(t * 5));
  // walking silhouette in long coat
  const s = 0.62 + 0.08 * Math.sin(t * 0.6); const bob = Math.abs(Math.sin(t * 4)) * 3;
  c.save(); c.translate(vx + 30, vy + 60 - bob); c.scale(s, s);
  P(c, 'polygon', [[-18, -60], [18, -60], [26, 30], [-26, 30]], { fill: '#0d1414', sw: 1, gap: 2, seed: 50, stroke: '#061010' });
  P(c, 'circle', [0, -72, 22], { fill: '#0d1414', sw: 1, seed: 51, stroke: '#061010' });
  P(c, 'ellipse', [0, -82, 34, 8], { fill: '#0d1414', sw: 1, seed: 52, stroke: '#061010' });
  c.restore();
}
// masked intruder (parody design: shiny artificial mask, swoop hair, shades, suit, corrugated backdrop)
function progPirate(c, t, o = {}) {
  c.save(); c.translate(180, 135);
  const ang = 0.38 * Math.sin(t * 0.9) + 0.14 * Math.sin(t * 2.3);
  c.rotate(ang); const sw = 24, off = (t * 46) % (sw * 2);
  for (let x = -460 + off, i = 0; x < 460; x += sw, i++) {
    c.fillStyle = i % 2 ? '#a9bcc4' : '#3b4560'; c.fillRect(x, -460, sw + 1, 920);
    if (i % 2) { c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(x + 4, -460, 3, 920); c.fillStyle = 'rgba(30,30,60,0.35)'; c.fillRect(x + sw - 5, -460, 4, 920); }
  }
  c.restore();
  const g = c.createLinearGradient(0, 0, SW, SH); g.addColorStop(0, 'rgba(111,201,207,0.25)'); g.addColorStop(1, 'rgba(196,106,158,0.3)');
  c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  const perf = o.perf || 0;
  c.save(); c.translate(180 + (o.dx || 0), 285);
  c.rotate(0.075 * Math.sin(t * 3.2) + perf * 0.06 * Math.sin(t * 5.3));
  // arms / hands (performance)
  const hand = (side, ph) => {
    const k = Math.floor(t * 1.7 + ph), f = ss(0, 1, (t * 1.7 + ph) - k);
    const tx = (a) => lerp(hash(a * 3.3 + side) * 2 - 1, hash((a + 1) * 3.3 + side) * 2 - 1, f);
    const hx = side * (95 + 40 * tx(k)) + 20 * Math.sin(t * 7 + ph), hy = -130 - 70 * Math.abs(tx(k + 9)) + 18 * Math.sin(t * 9 + side);
    P(c, 'line', [side * 85, -95, hx, hy], { sw: 15, stroke: '#2b2d42', seed: 60 + side, r: 0.8 });
    c.save(); c.translate(hx, hy); c.rotate(Math.sin(t * 8 + ph) * 0.6 + side * 0.4);
    P(c, 'ellipse', [0, 0, 26, 30], { fill: '#e7d3bf', sw: 1.3, gap: 2, seed: 62 + side });
    for (let fi = 0; fi < 4; fi++) { const a = -1.2 + fi * 0.45 + 0.25 * Math.sin(t * 12 + fi); P(c, 'line', [Math.cos(a) * 10, -Math.abs(Math.sin(a)) * 10 - 4, Math.cos(a) * 20, -Math.abs(Math.sin(a)) * 20 - 8], { sw: 5, stroke: '#cdb59d', seed: 70 + fi + side * 5, r: 0.6 }); }
    c.restore();
  };
  if (perf > 0) { hand(-1, 0.3); }
  P(c, 'polygon', [[-125, 0], [-108, -98], [-46, -126], [46, -126], [108, -98], [125, 0]], { fill: '#2b2d42', sw: 1.8, gap: 3, seed: 80, stroke: '#14142a' });
  P(c, 'polygon', [[-30, -125], [30, -125], [0, -48]], { fill: '#eff1f0', sw: 1.3, gap: 2.5, seed: 81 });
  P(c, 'polygon', [[-34, -125], [-6, -56], [-52, -92]], { fill: '#41455f', sw: 1.2, gap: 2.5, seed: 82 });
  P(c, 'polygon', [[34, -125], [6, -56], [52, -92]], { fill: '#41455f', sw: 1.2, gap: 2.5, seed: 83 });
  P(c, 'polygon', [[-5, -120], [5, -120], [4, -62], [0, -55], [-4, -62]], { fill: '#2a1f35', sw: 1, gap: 2, seed: 84 });
  if (perf > 0) { hand(1, 1.7); }
  pirateHead(c, t, o, perf);
  c.restore();
  c.restore();
}

function pirateHead(c, t, o = {}, perf = 0) {
  const turn = o.turn || 0;
  c.save(); if (!o.noPos) c.translate(0, -152 + 4 * Math.sin(t * 5.1)); c.rotate(0.13 * Math.sin(t * 2.1 + 1) + turn * 0.25 + perf * 0.15 * Math.sin(t * 3.7));
  c.scale(1 - Math.abs(turn) * 0.22, 1);
  if (!o.maskOnly) P(c, 'rectangle', [-17, -8, 34, 28], { fill: '#d8c3ad', sw: 1.2, gap: 3, seed: 90 });
  P(c, 'ellipse', [-60, -26, 14, 26], { fill: '#e6d3be', sw: 1.2, seed: 91, hatch: false });
  P(c, 'ellipse', [60, -26, 14, 26], { fill: '#e6d3be', sw: 1.2, seed: 92, hatch: false });
  // face mask, angular
  P(c, 'polygon', [[-57, -52], [-50, 8], [-27, 36], [27, 36], [50, 8], [57, -52], [40, -74], [-40, -74]], { fill: '#f3e5d4', hfill: '#e0cbb5', sw: 2, gap: 3, seed: 93, stroke: '#3a2d40' });
  // exaggerated hair swoop
  P(c, 'path', ['M-66,-38 Q-78,-118 -8,-124 Q66,-130 74,-72 Q80,-44 64,-34 Q50,-86 -6,-82 Q-50,-80 -66,-38 Z'], { fill: '#d8c08c', hfill: '#b99a5c', sw: 1.8, gap: 2.5, seed: 94, stroke: '#4a3a24' });
  c.strokeStyle = 'rgba(255,250,220,0.8)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-40, -100); c.quadraticCurveTo(0, -116, 44, -96); c.stroke();
  // shine (artificial plastic look)
  c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-44, -10); c.quadraticCurveTo(-46, 10, -34, 22); c.stroke();
  c.beginPath(); c.moveTo(-20, -66); c.lineTo(18, -68); c.stroke();
  c.beginPath(); c.moveTo(40, -2); c.lineTo(36, 14); c.stroke();
  // shades
  P(c, 'path', ['M-50,-44 L-6,-44 L-9,-24 Q-28,-16 -46,-26 Z'], { fill: '#0d0d16', sw: 1.6, seed: 95, gap: 1.5 });
  P(c, 'path', ['M50,-44 L6,-44 L9,-24 Q28,-16 46,-26 Z'], { fill: '#0d0d16', sw: 1.6, seed: 96, gap: 1.5 });
  P(c, 'line', [-6, -42, 6, -42], { sw: 2.5, seed: 97 });
  c.fillStyle = 'rgba(160,240,255,0.85)'; c.fillRect(-40, -40, 10, 3); c.fillRect(16, -40, 10, 3);
  // strange grin
  const g2 = 1 + 0.15 * Math.sin(t * 6) + perf * 0.3 * Math.abs(Math.sin(t * 9));
  P(c, 'path', [`M-34,2 Q0,${22 + 10 * g2} 34,2 Q0,${10 + 2 * g2} -34,2 Z`], { fill: '#fbfbf6', sw: 1.6, seed: 98, hatch: false, stroke: '#3a2d40' });
  for (let i = -3; i <= 3; i++) P(c, 'line', [i * 8, 6 + Math.abs(i) * -0.6, i * 8, 14 + (3 - Math.abs(i)) * 2 * g2], { sw: 0.9, seed: 99 + i, r: 0.4 });
  c.restore();
}

// ===== world props =====
function drawTV(c, cx, cy, w, img, o = {}) {
  const h = w * (o.kind === 'console' ? 0.78 : 0.8);
  const x = cx - w / 2, y = cy - h / 2, k = o.kind || 'classic', sd = o.seed || 300;
  const sx = x + w * 0.065, sy = y + h * 0.1, sw = w * 0.66, sh = sw * 0.75;
  if (k === 'classic') {
    // antenna
    P(c, 'line', [cx - w * 0.05, y + 4, cx - w * 0.28, y - h * 0.42], { sw: w * 0.008, seed: sd + 1 });
    P(c, 'line', [cx + w * 0.05, y + 4, cx + w * 0.22, y - h * 0.45], { sw: w * 0.008, seed: sd + 2 });
    P(c, 'circle', [cx - w * 0.28, y - h * 0.42, w * 0.025], { fill: '#bfc4c8', sw: 2, seed: sd + 3, hatch: false });
    P(c, 'circle', [cx + w * 0.22, y - h * 0.45, w * 0.025], { fill: '#bfc4c8', sw: 2, seed: sd + 4, hatch: false });
    P(c, 'ellipse', [cx, y + 2, w * 0.2, w * 0.06], { fill: '#4a4a55', sw: 2, seed: sd + 5 });
    // legs
    P(c, 'line', [x + w * 0.15, y + h, x + w * 0.1, y + h + w * 0.13], { sw: w * 0.012, seed: sd + 6 });
    P(c, 'line', [x + w * 0.85, y + h, x + w * 0.9, y + h + w * 0.13], { sw: w * 0.012, seed: sd + 7 });
  }
  const bodyCol = o.body || (k === 'console' ? '#8a5a34' : '#6e5440');
  P(c, 'path', [rrPath(x, y, w, h, w * 0.06)], { fill: bodyCol, hfill: o.body2 || '#5a3e2a', sw: Math.max(2.5, w * 0.006), gap: Math.max(5, w * 0.008), seed: sd + 8, angle: -20 });
  if (k === 'console') { for (let i = 1; i < 6; i++) P(c, 'line', [x + w * 0.04, y + h * (0.1 + i * 0.15), x + w * 0.04 + w * 0.02, y + h * (0.1 + i * 0.15)], { sw: 1.5, seed: sd + 40 + i, stroke: '#3c2414', alpha: 0.6 }); }
  // bezel
  P(c, 'path', [rrPath(sx - w * 0.025, sy - w * 0.025, sw + w * 0.05, sh + w * 0.05, w * 0.05)], { fill: '#2b2a33', sw: 2.5, gap: 4, seed: sd + 9 });
  if (img) blitScreen(c, img, sx, sy, sw, sh, w * 0.045);
  else { c.save(); rrClip(c, sx, sy, sw, sh, w * 0.045); c.fillStyle = '#20232c'; c.fillRect(sx, sy, sw, sh); c.restore(); }
  P(c, 'path', [rrPath(sx, sy, sw, sh, w * 0.045)], { sw: Math.max(2.5, w * 0.005), seed: sd + 10 });
  // control panel
  const px = x + w * 0.76, pw = w * 0.19;
  P(c, 'rectangle', [px, sy, pw, sh], { fill: '#3a302c', sw: 2.2, gap: 5, seed: sd + 11 });
  P(c, 'circle', [px + pw / 2, sy + sh * 0.2, pw * 0.62], { fill: '#d8d2c4', sw: 2.2, seed: sd + 12, gap: 4 });
  P(c, 'line', [px + pw / 2, sy + sh * 0.2, px + pw / 2 + Math.cos(o.dial || 1) * pw * 0.26, sy + sh * 0.2 + Math.sin(o.dial || 1) * pw * 0.26], { sw: 3, seed: sd + 13 });
  P(c, 'circle', [px + pw / 2, sy + sh * 0.47, pw * 0.42], { fill: '#d8d2c4', sw: 2, seed: sd + 14, gap: 4 });
  for (let i = 0; i < 5; i++) P(c, 'line', [px + pw * 0.15, sy + sh * (0.64 + i * 0.07), px + pw * 0.85, sy + sh * (0.64 + i * 0.07)], { sw: 2, seed: sd + 15 + i });
  c.save(); c.globalAlpha = 0.6 + 0.4 * Math.sin(T * 3); c.fillStyle = o.led || '#ff5a4a'; c.beginPath(); c.arc(px + pw / 2, sy + sh * 0.97, w * 0.007, 0, 7); c.fill(); c.restore();
  return { sx, sy, sw, sh, x, y, w, h };
}
function screenGlow(c, r, col, a) { glow(c, r.sx + r.sw / 2, r.sy + r.sh / 2, r.sw * 1.1, col, a * (0.85 + 0.15 * Math.sin(T * 23) * hash(FR))); }

function skyline(c, x0, yb, scale, col, lit, seed) {
  const bs = [[0, 210, 70], [72, 300, 60], [135, 420, 54, 'ant2'], [192, 260, 50], [246, 360, 64, 'ant1'], [313, 180, 60], [376, 250, 46], [425, 320, 58], [486, 200, 70], [560, 280, 52], [615, 170, 70], [688, 230, 60], [752, 150, 80], [835, 260, 56], [894, 190, 70], [967, 120, 90]];
  c.save(); c.translate(x0, yb); c.scale(scale, scale);
  for (let i = 0; i < bs.length; i++) {
    const [bx, bh, bw, ant] = bs[i];
    if (ant === 'ant2') { P(c, 'line', [bx + 14, -bh, bx + 14, -bh - 70], { sw: 3, seed: seed + i * 3, stroke: col }); P(c, 'line', [bx + 40, -bh, bx + 40, -bh - 70], { sw: 3, seed: seed + i * 3 + 1, stroke: col }); }
    if (ant === 'ant1') { P(c, 'line', [bx + 32, -bh, bx + 32, -bh - 60], { sw: 3, seed: seed + i * 3, stroke: col }); }
    const pts = ant === 'ant1' ? [[bx, 0], [bx + 6, -bh], [bx + bw - 6, -bh], [bx + bw, 0]] : [[bx, 0], [bx, -bh], [bx + bw, -bh], [bx + bw, 0]];
    P(c, 'polygon', [pts], { fill: col, sw: 2, stroke: '#0e0f26', gap: 4, seed: seed + i * 3 + 2, solid: 0.9 });
    if (lit) for (let j = 0; j < bh / 22; j++) for (let k = 0; k < bw / 16 - 1; k++) { const hh = hash(i * 91 + j * 7 + k * 3 + seed); if (hh > 0.62) { c.fillStyle = hh > 0.9 ? 'rgba(255,200,120,0.9)' : 'rgba(250,220,150,0.55)'; c.fillRect(bx + 8 + k * 16, -bh + 14 + j * 22, 6, 8); } }
  }
  c.restore();
}
function tower(c, x, yb, h, col, seed, light = true) {
  const w = h * 0.16;
  P(c, 'polygon', [[[x - w, yb], [x, yb - h], [x + w, yb]]], { sw: 2.5, stroke: col, seed, r: 0.9 });
  for (let i = 1; i < 8; i++) { const f = i / 8, y = yb - h * f, hw = w * (1 - f); P(c, 'line', [x - hw, y, x + hw, y], { sw: 1.6, stroke: col, seed: seed + i, r: 0.6 }); if (i < 7) { const y2 = yb - h * (i + 1) / 8, hw2 = w * (1 - (i + 1) / 8); P(c, 'line', [x - hw, y, x + hw2, y2], { sw: 1.2, stroke: col, seed: seed + 20 + i, r: 0.6 }); } }
  if (light) { const on = Math.sin(T * 4) > 0; if (on) glow(c, x, yb - h - 4, 30, 'rgba(255,60,60,1)', 0.8); c.fillStyle = on ? '#ff5050' : '#702020'; c.beginPath(); c.arc(x, yb - h - 4, 6, 0, 7); c.fill(); }
}
function signalArcs(c, x, y, n, col, a, t, dir = 0) {
  for (let i = 0; i < n; i++) { const r = 30 + ((i * 40 + t * 60) % (n * 40)); c.save(); c.globalAlpha = a * (1 - r / (n * 40 + 30)); c.strokeStyle = col; c.lineWidth = 4; c.setLineDash([10, 9]); c.beginPath(); c.arc(x, y, r, dir - 0.9, dir + 0.9); c.stroke(); c.beginPath(); c.arc(x, y, r, dir + Math.PI - 0.9, dir + Math.PI + 0.9); c.stroke(); c.restore(); }
}
function navyWash(c, x, y, w, h, col = '#262a58', seed = 500, gap = 5) {
  P(c, 'rectangle', [x, y, w, h], { fill: col, hfill: '#1a1c40', solid: 0.92, gap, sw: 0, stroke: 'none', seed, fw: 2.2, r: 1.6 });
}
function clockFace(c, x, y, r, minA, hrA, o = {}) {
  P(c, 'circle', [x, y, r * 2.24], { fill: '#6b4a32', sw: 3, seed: 600, gap: 5 });
  P(c, 'circle', [x, y, r * 2], { fill: '#f3ecd9', sw: 3, seed: 601, gap: 7, hfill: '#e3d7bd' });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P(c, 'line', [x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, x + Math.cos(a) * r * (i % 3 ? 0.9 : 0.95), y + Math.sin(a) * r * (i % 3 ? 0.9 : 0.95)], { sw: i % 3 ? 2 : 4, seed: 610 + i, r: 0.5 }); }
  P(c, 'line', [x, y, x + Math.cos(hrA) * r * 0.5, y + Math.sin(hrA) * r * 0.5], { sw: r * 0.07, seed: 630, r: 0.5 });
  P(c, 'line', [x, y, x + Math.cos(minA) * r * 0.78, y + Math.sin(minA) * r * 0.78], { sw: r * 0.045, seed: 631, r: 0.5 });
  if (o.sec !== undefined) P(c, 'line', [x, y, x + Math.cos(o.sec) * r * 0.85, y + Math.sin(o.sec) * r * 0.85], { sw: 2, stroke: '#b8443f', seed: 632, r: 0.3 });
  P(c, 'circle', [x, y, r * 0.1], { fill: INK, sw: 2, seed: 633, hatch: false });
}
function viewer(c, x, y, s, rim, lean = 0, seed = 700) {
  c.save(); c.translate(x, y); c.rotate(lean); c.scale(s, s);
  P(c, 'path', ['M-170,120 Q-175,-60 -120,-80 L120,-80 Q175,-60 170,120 Z'], { fill: '#3a2f4a', hfill: '#2b2238', sw: 3, seed, gap: 6 });
  P(c, 'path', ['M-90,120 Q-100,10 -40,-10 Q0,-20 40,-10 Q100,10 90,120 Z'], { fill: '#181833', sw: 2.5, seed: seed + 1, gap: 4 });
  P(c, 'ellipse', [0, -60, 92, 108], { fill: '#181833', sw: 2.5, seed: seed + 2, gap: 4 });
  c.save(); c.strokeStyle = rim; c.globalAlpha = 0.55; c.lineWidth = 5; c.beginPath(); c.ellipse(0, -60, 44, 52, 0, -2.6, -0.5); c.stroke(); c.restore();
  c.restore();
}
function folder(c, x, y, w, open, rot, o = {}) {
  const h = w * 0.72; c.save(); c.translate(x, y); c.rotate(rot);
  P(c, 'path', [`M${-w / 2},${-h / 2} L${-w / 2 + w * 0.3},${-h / 2} L${-w / 2 + w * 0.36},${-h / 2 - w * 0.06} L${-w / 2 + w * 0.6},${-h / 2 - w * 0.06} L${-w / 2 + w * 0.64},${-h / 2} L${w / 2},${-h / 2} L${w / 2},${h / 2} L${-w / 2},${h / 2} Z`], { fill: '#d9b878', hfill: '#c49d55', sw: 3, seed: 800, gap: 7 });
  if (o.inside) o.inside(c, w, h);
  // cover (scaleY collapses as opens)
  const cy = 1 - open;
  if (cy > 0.02) {
    c.save(); c.translate(0, h / 2); c.scale(1, cy); c.translate(0, -h / 2);
    P(c, 'rectangle', [-w / 2, -h / 2 + 6, w, h - 6], { fill: '#e6c88c', hfill: '#d1ad66', sw: 3, seed: 801, gap: 8 });
    P(c, 'circle', [0, -h * 0.05, w * 0.22], { sw: 3, seed: 802, stroke: '#6b4a2a' });
    P(c, 'polygon', [[[0, -h * 0.05 - w * 0.07], [w * 0.02, -h * 0.05 - w * 0.02], [w * 0.07, -h * 0.05 - w * 0.02], [w * 0.03, -h * 0.05 + w * 0.01], [w * 0.045, -h * 0.05 + w * 0.06], [0, -h * 0.05 + w * 0.03], [-w * 0.045, -h * 0.05 + w * 0.06], [-w * 0.03, -h * 0.05 + w * 0.01], [-w * 0.07, -h * 0.05 - w * 0.02], [-w * 0.02, -h * 0.05 - w * 0.02]]], { fill: '#6b4a2a', sw: 2, seed: 803, gap: 3, stroke: '#6b4a2a' });
    for (let i = 0; i < 3; i++) P(c, 'line', [-w * 0.3, h * (0.2 + i * 0.08), w * 0.3 - i * 30, h * (0.2 + i * 0.08)], { sw: 2.5, seed: 804 + i, stroke: '#7a5a3a', alpha: 0.7 });
    if (o.stamp) { c.save(); c.translate(w * 0.22, h * 0.18); c.rotate(-0.25); const s = o.stamp; c.scale(1 + (1 - s) * 0.6, 1 + (1 - s) * 0.6); c.globalAlpha = clamp(s * 1.4);
      P(c, 'circle', [0, 0, w * 0.3], { sw: 6, stroke: '#b8312f', seed: 810, r: 1.6 }); P(c, 'circle', [0, 0, w * 0.24], { sw: 3, stroke: '#b8312f', seed: 811, r: 1.4 });
      c.font = `700 ${w * 0.2}px Kalam`; c.fillStyle = '#b8312f'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, w * 0.01); c.restore(); }
    c.restore();
  }
  c.restore();
}
function vhsTape(c, x, y, w, rot, seed = 900) {
  const h = w * 0.56; c.save(); c.translate(x, y); c.rotate(rot);
  P(c, 'rectangle', [-w / 2, -h / 2, w, h], { fill: '#22212b', sw: 3, seed, gap: 4 });
  P(c, 'rectangle', [-w * 0.4, -h * 0.42, w * 0.8, h * 0.3], { fill: '#efe6d0', sw: 2, seed: seed + 1, gap: 6 });
  for (let i = 0; i < 2; i++) P(c, 'line', [-w * 0.34, -h * 0.34 + i * h * 0.12, w * 0.2 - i * w * 0.15, -h * 0.34 + i * h * 0.12], { sw: 2, seed: seed + 2 + i, stroke: '#8a8070' });
  P(c, 'rectangle', [-w * 0.3, h * 0.0, w * 0.6, h * 0.3], { fill: '#4a4855', sw: 2, seed: seed + 4, gap: 5 });
  P(c, 'circle', [-w * 0.17, h * 0.15, h * 0.22], { fill: '#efe6d0', sw: 2, seed: seed + 5, hatch: false });
  P(c, 'circle', [w * 0.17, h * 0.15, h * 0.22], { fill: '#efe6d0', sw: 2, seed: seed + 6, hatch: false });
  c.restore();
}
function person(c, x, y, s, shirt, armA, seed, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  P(c, 'path', ['M-60,140 Q-64,20 -30,0 L30,0 Q64,20 60,140 Z'], { fill: shirt, sw: 3, seed, gap: 5 });
  P(c, 'circle', [0, -40, 76], { fill: '#e6b98e', sw: 3, seed: seed + 1, gap: 5 });
  P(c, 'path', [o.hair || 'M-38,-46 Q-40,-86 0,-84 Q40,-86 38,-46 Q20,-66 0,-64 Q-24,-66 -38,-46 Z'], { fill: o.hairC || '#4a2f1c', sw: 2, seed: seed + 2, gap: 3 });
  if (o.headset) { P(c, 'arc', [0, -44, 86, 86, Math.PI, Math.PI * 2, false], { sw: 4, seed: seed + 3 }); P(c, 'circle', [-40, -40, 18], { fill: '#333', sw: 2, seed: seed + 4, hatch: false }); }
  const ax = Math.cos(armA) * 110, ay = Math.sin(armA) * 110;
  P(c, 'line', [40, 20, 40 + ax, 20 + ay], { sw: 18, stroke: shirt, seed: seed + 5, r: 0.7 });
  P(c, 'line', [40, 20, 40 + ax, 20 + ay], { sw: 3, seed: seed + 6, r: 0.9, alpha: 0.6 });
  P(c, 'circle', [40 + ax, 20 + ay, 26], { fill: '#e6b98e', sw: 2, seed: seed + 7, hatch: false });
  c.restore();
}

// ===== room layers =====
function livingRoom(c, opt = {}) { // dark 1987 living room
  navyWash(c, -20, -20, W + 40, H + 40, '#2a2d5c', 501, 5);
  // window with skyline
  const wx = 70, wy = 560, ww = 330, wh = 380;
  P(c, 'rectangle', [wx, wy, ww, wh], { fill: '#141838', sw: 4, seed: 510, gap: 4 });
  c.save(); c.beginPath(); c.rect(wx + 6, wy + 6, ww - 12, wh - 12); c.clip();
  for (let i = 0; i < 24; i++) { c.fillStyle = 'rgba(255,255,230,0.7)'; c.fillRect(wx + hash(i * 3.1) * ww, wy + hash(i * 1.7) * wh * 0.5, 2, 2); }
  skyline(c, wx - 20, wy + wh, 0.38, '#2b2f63', true, 520);
  c.restore();
  P(c, 'line', [wx + ww / 2, wy, wx + ww / 2, wy + wh], { sw: 5, seed: 511 }); P(c, 'line', [wx, wy + wh / 2, wx + ww, wy + wh / 2], { sw: 5, seed: 512 });
  P(c, 'rectangle', [wx - 30, wy - 30, 60, wh + 80], { fill: '#5b3d58', sw: 3, seed: 513, gap: 6 });
  P(c, 'rectangle', [wx + ww - 30, wy - 30, 60, wh + 80], { fill: '#5b3d58', sw: 3, seed: 514, gap: 6 });
  // floor
  P(c, 'rectangle', [-20, 1560, W + 40, 400], { fill: '#3b2e3e', hfill: '#2a2030', sw: 3, seed: 515, gap: 6, angle: 10 });
  P(c, 'ellipse', [560, 1700, 900, 180], { fill: '#6a3f52', sw: 3, seed: 516, gap: 6, alpha: 0.8 });
  // lamp
  P(c, 'line', [930, 1000, 930, 1560], { sw: 5, seed: 517 });
  P(c, 'polygon', [[[870, 1000], [990, 1000], [960, 900], [900, 900]]], { fill: '#d9a35a', sw: 3, seed: 518, gap: 5 });
  P(c, 'ellipse', [930, 1565, 120, 26], { fill: '#2a2030', sw: 3, seed: 519 });
  if (opt.clock) clockFace(c, 230, 1080, 95, opt.minA ?? -1.2, opt.hrA ?? 0.4);
  // tv stand
  
}
function room2(c) { // second household: faded magenta wallpaper
  P(c, 'rectangle', [-20, -20, W + 40, H + 40], { fill: '#8e5a7c', hfill: '#6a3d5c', solid: 0.92, gap: 6, sw: 0, stroke: 'none', seed: 540, fw: 2, r: 1.5 });
  for (let i = 0; i < 9; i++) P(c, 'line', [i * 130 + 30, 400, i * 130 + 30, 1560], { sw: 10, stroke: '#a77395', seed: 541 + i, alpha: 0.5, r: 1.5 });
  // framed picture
  P(c, 'rectangle', [90, 600, 200, 160], { fill: '#d9c89a', sw: 4, seed: 552, gap: 6 }); P(c, 'polygon', [[[110, 740], [170, 650], [220, 720], [250, 680], [272, 740]]], { fill: '#6a8a6a', sw: 2, seed: 553, gap: 4 });
  // floor
  P(c, 'rectangle', [-20, 1560, W + 40, 400], { fill: '#4e3a2c', hfill: '#3a2a20', sw: 3, seed: 554, gap: 6, angle: 20 });
  // plant
  P(c, 'polygon', [[[110, 1560], [200, 1560], [185, 1440], [125, 1440]]], { fill: '#b56a3c', sw: 3, seed: 555, gap: 5 });
  for (let i = 0; i < 6; i++) { const a = -2.6 + i * 0.4; P(c, 'ellipse', [155 + Math.cos(a) * 80, 1400 + Math.sin(a) * 90, 40, 110], { fill: AGREEN, hfill: '#4f8a4c', sw: 2.5, seed: 556 + i, gap: 4 }); }
  // floor lamp
  P(c, 'line', [960, 900, 960, 1560], { sw: 5, seed: 563 }); P(c, 'polygon', [[[900, 900], [1020, 900], [990, 800], [930, 800]]], { fill: '#e7c26a', sw: 3, seed: 564, gap: 5 });
}

// ===== captions =====
const CAPS = [
  [0.0, '1987’de biri iki televizyon kanalının yayınını ele geçirdi… ve kim olduğu hâlâ bulunamadı.'],
  [7.78, '22 Kasım gecesi Chicago’daki WGN kanalının haber yayını aniden kesildi.'],
  [14.14, 'Ekranda Max Headroom maskesi takmış gizemli bir adam belirdi.'],
  [18.81, 'Ancak kanal çalışanları yaklaşık 30 saniye içinde yayını geri almayı başardı.'],
  [24.21, 'Olayın bittiği düşünüldü.'],
  [26.08, 'Ama yaklaşık iki saat sonra bu kez başka bir Chicago kanalı olan WTTW’nun yayını kesildi.'],
  [33.43, 'Doctor Who yayınlanırken aynı maskeli kişi yeniden ekrana çıktı.'],
  [38.40, 'Bu kez korsan yayın yaklaşık 90 saniye sürdü.'],
  [42.35, 'Maskeli kişi garip hareketler yaptı, anlaşılması zor şeyler söyledi ve yayın aniden normale döndü.'],
  [50.37, 'Olayı Federal İletişim Komisyonu bile soruşturdu.'],
  [53.89, 'Ancak yayını kimin ele geçirdiği ve bunu tam olarak nasıl yaptığı hiçbir zaman kesin olarak bulunamadı.'],
  [61.06, 'Neredeyse kırk yıl sonra bile Max Headroom yayın korsanlığı televizyon tarihinin en garip çözülememiş olaylarından biri olarak kaldı.'],
  [70.28, null],
];
const LAYOUT = new Map();
function layoutText(c, text, maxW, maxH, font) {
  const key = text + font; if (LAYOUT.has(key)) return LAYOUT.get(key);
  for (let s = 80; s >= 34; s -= 2) {
    c.font = font.replace('%', s); const words = text.split(' '); const lines = []; let cur = '';
    for (const wd of words) { const tst = cur ? cur + ' ' + wd : wd; if (c.measureText(tst).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = tst; }
    lines.push(cur); const lh = s * 1.18;
    if (lines.length * lh <= maxH && lines.length <= 5) { const r = { s, lines, lh }; LAYOUT.set(key, r); return r; }
  }
}
function drawCaption(c, gt) {
  c.drawImage(BAND, 0, 0);
  // pencil rule under band
  P(c, 'linearPath', [[[50, 452], [300, 448], [560, 454], [800, 449], [1030, 453]]], { sw: 2.5, alpha: 0.35, seed: 990, r: 1.5 });
  let idx = -1; for (let i = 0; i < CAPS.length; i++) if (gt >= CAPS[i][0]) idx = i;
  if (idx < 0) return;
  const st = CAPS[idx][0], nx = idx + 1 < CAPS.length ? CAPS[idx + 1][0] : 999;
  const fadeOut = 1 - ss(nx - 0.16, nx, gt);
  if (CAPS[idx][1] === null) return finalCaption(c, gt - st);
  const L = layoutText(c, CAPS[idx][1], 960, 370, '700 %px Kalam');
  const top = 238 - (L.lines.length * L.lh) / 2;
  c.save(); c.font = `700 ${L.s}px Kalam`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = NAVY;
  for (let i = 0; i < L.lines.length; i++) {
    const p = ss(0, 0.22, gt - st - i * 0.07) * fadeOut; if (p <= 0) continue;
    const y = top + L.lh * (i + 0.5); const lw = c.measureText(L.lines[i]).width;
    c.save(); c.beginPath(); c.rect(540 - lw / 2 - 20, y - L.lh, (lw + 40) * ss(0, 0.22, gt - st - i * 0.07), L.lh * 2); c.clip();
    c.globalAlpha = fadeOut; c.fillText(L.lines[i], 540 + (i % 2 ? 1 : -1) * Math.sin(T * 2 + i) * 0.8, y + Math.sin(T * 1.7 + i) * 0.8); c.restore();
  }
  c.restore();
}
function finalCaption(c, lt) {
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  const p1 = ss(0, 0.3, lt), p2 = ss(1.82, 2.2, lt);
  c.font = '400 92px Caveat'; c.fillStyle = '#5d6290';
  let w1 = c.measureText('İnanması güç ama').width;
  c.save(); c.beginPath(); c.rect(540 - w1 / 2 - 20, 90, (w1 + 40) * p1, 140); c.clip(); c.fillText('İnanması güç ama', 540, 165); c.restore();
  c.font = '700 96px Kalam'; c.fillStyle = '#121436';
  const w2 = c.measureText('bu gerçekten yaşandı.').width;
  c.save(); c.beginPath(); c.rect(540 - w2 / 2 - 20, 240, (w2 + 40) * p2, 150); c.clip();
  const sc = 1 + 0.04 * (1 - p2); c.translate(540, 315); c.scale(sc, sc); c.fillText('bu gerçekten yaşandı.', 0, 0); c.fillText('bu gerçekten yaşandı.', 1.2, 0.6); c.restore();
  if (p2 > 0) P(c, 'linearPath', [[[540 - w2 / 2, 382], [540 - w2 / 2 + w2 * p2 * 0.5, 378], [540 - w2 / 2 + w2 * p2, 384]]], { sw: 5, stroke: '#121436', seed: 995, r: 1, alpha: 0.85 });
  c.restore();
}
function watermark(c, gt) {
  const fin = ss(70.3, 71.3, gt);
  c.save(); c.textAlign = 'right'; c.textBaseline = 'middle';
  const fs = lerp(32, 42, fin); c.font = `700 ${fs}px Kalam`;
  const tw = c.measureText('@bugercektenyasandi').width;
  c.globalAlpha = lerp(0.8, 0.95, fin); c.fillStyle = 'rgba(242,232,213,0.82)';
  c.beginPath(); c.roundRect(1040 - tw - 22, 1858 - fs * 0.75, tw + 40, fs * 1.5, fs * 0.75); c.fill();
  c.fillStyle = NAVY; c.fillText('@bugercektenyasandi', 1040, 1860); c.restore();
}
