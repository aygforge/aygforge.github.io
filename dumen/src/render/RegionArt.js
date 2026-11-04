// 8 bölgenin ayrı görsel kimliği: gökyüzü, 3 katmanlı parallax (uzak/orta/yakın), yerel dekor, parçacıklar ve su altı paneli.
// Renk filtresi değil: her bölge kendi siluet ve obje setini çizer.
(function (D) {
  'use strict';
  const A = D.Art, OL = A.OL;
  const fs = (c, f, lw) => A.fs(c, f, lw == null ? 4 : lw);
  const RA = {};
  const WATER_Y = 560;

  function ridge(c, W, y, amp, freq, col, phase, bottom) {
    c.beginPath(); c.moveTo(-10, bottom); for (let x = -10; x <= W + 20; x += 20) c.lineTo(x, y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.7 + phase * 1.3) * amp * 0.35); c.lineTo(W + 20, bottom); c.closePath(); c.fillStyle = col; c.fill();
  }
  const loopX = (x, W) => ((x % (W + 400)) + W + 400) % (W + 400) - 200;

  const LAYERS = {
    EL: {
      far(c, W, t, s) { ridge(c, W, 430, 18, 0.004, '#9cc8a0', s * 0.1, WATER_Y); for (let i = 0; i < 8; i++) { const x = loopX(i * 260 - s * 0.15, W); A.rr(c, x, 400 - (i % 3) * 20, 60, 60 + (i % 3) * 20, 4); c.fillStyle = ['#e8a0a0', '#f2d08a', '#a0c8e8'][i % 3]; c.fill(); c.beginPath(); c.moveTo(x - 6, 400 - (i % 3) * 20); c.lineTo(x + 30, 372 - (i % 3) * 20); c.lineTo(x + 66, 400 - (i % 3) * 20); c.fillStyle = '#c9483a'; c.fill(); } },
      mid(c, W, t, s) { for (let i = 0; i < 6; i++) { const x = loopX(i * 360 - s * 0.5, W); A.rr(c, x, 470, 18, 110, 4); fs(c, '#6a4a2a'); } A.planks(c, loopX(-s * 0.5, W) - 40, 468, 520, 26, '#a8743a', 8, true); },
      near(c, W, t, s) { for (let i = 0; i < 3; i++) { const x = loopX(i * 700 + 300 - s, W), y = WATER_Y + 26 + Math.sin(t * 2 + i) * 5; A.ellipse(c, x, y, 24, 18); fs(c, i % 2 ? '#e0453d' : '#f5efe0'); c.fillStyle = i % 2 ? '#fff' : '#e0453d'; c.fillRect(x - 24, y - 4, 48, 8); } for (let i = 0; i < 2; i++) { const x = loopX(i * 900 + t * 40, W), y = 150 + i * 70 + Math.sin(t * 2 + i) * 14; c.beginPath(); c.moveTo(x - 22, y); c.quadraticCurveTo(x - 10, y - 14, x, y); c.quadraticCurveTo(x + 10, y - 14, x + 22, y); c.lineWidth = 4; c.strokeStyle = OL; c.stroke(); } }
    },
    TS: {
      far(c, W, t, s) { ridge(c, W, 420, 14, 0.003, '#a8c098', s * 0.1, WATER_Y); for (let i = 0; i < 10; i++) { const x = loopX(i * 210 - s * 0.15, W); A.ellipse(c, x, 430, 60, 40); c.fillStyle = '#8aa878'; c.fill(); } },
      mid(c, W, t, s) { for (let i = 0; i < 40; i++) { const x = loopX(i * 52 - s * 0.5, W); c.beginPath(); c.moveTo(x, WATER_Y + 10); c.quadraticCurveTo(x + 4, 470, x - 6 + Math.sin(t + i) * 6, 400 + (i % 4) * 16); c.lineWidth = 6; c.strokeStyle = '#4a6a3a'; c.stroke(); if (i % 3 === 0) { A.ellipse(c, x - 6 + Math.sin(t + i) * 6, 396 + (i % 4) * 16, 6, 18); fs(c, '#7a5a3a', 2.5); } } },
      near(c, W, t, s) { for (let i = 0; i < 4; i++) { const x = loopX(i * 500 + 100 - s, W), y = WATER_Y + 20; A.ellipse(c, x, y, 50, 12); fs(c, '#5a9a4a', 3); if (i % 2 === 0) { const hop = Math.max(0, Math.sin(t * 1.5 + i)) * 30; c.save(); c.translate(x, y - 8 - hop); c.scale(0.25, 0.25); D.FishArt.draw(c, 'TS_08', 0, 0, 200, { t, noAura: true }); c.restore(); } } c.fillStyle = 'rgba(240,248,230,0.35)'; for (let i = 0; i < 3; i++) { A.ellipse(c, loopX(i * 800 + t * 20, W), 480 + i * 30, 400, 26); c.fill(); } }
    },
    PSK: {
      far(c, W, t, s) { for (let i = 0; i < 7; i++) { const x = loopX(i * 300 - s * 0.15, W); A.rr(c, x, 300, 160, 260, 2); c.fillStyle = '#7a6a5a'; c.fill(); A.rr(c, x + 20, 200, 30, 110, 2); c.fill(); for (let k = 0; k < 4; k++) { const q = (t * 0.2 + k / 4) % 1; A.circle(c, x + 35 + q * 30, 190 - q * 120, 14 + q * 20); c.fillStyle = `rgba(110,100,90,${0.5 * (1 - q)})`; c.fill(); } c.fillStyle = '#7a6a5a'; } },
      mid(c, W, t, s) { for (let i = 0; i < 5; i++) { const x = loopX(i * 420 - s * 0.5, W); A.rr(c, x, 420, 200, 30, 15); fs(c, '#8a5a3a'); A.rr(c, x + 160, 420, 30, 140, 15); fs(c, '#8a5a3a'); c.fillStyle = 'rgba(120,200,80,0.7)'; c.fillRect(x + 168, 560, 14, 6 + Math.sin(t * 3 + i) * 4); } },
      near(c, W, t, s) { for (let i = 0; i < 3; i++) { const x = loopX(i * 640 + 200 - s, W), y = WATER_Y + 20 + Math.sin(t * 2 + i) * 4; c.save(); c.translate(x, y); c.rotate(1.4); A.rr(c, -30, -22, 60, 44, 8); fs(c, i % 2 ? '#3a5a8a' : '#c26b2d'); c.restore(); } c.fillStyle = 'rgba(200,120,60,0.25)'; for (let i = 0; i < 4; i++) { A.ellipse(c, loopX(i * 500 - s * 0.8, W), WATER_Y + 40, 120, 10); c.fill(); } }
    },
    YK: {
      far(c, W, t, s) { const r = A.rand(3); c.fillStyle = '#fff'; for (let i = 0; i < 120; i++) { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t + i)); A.circle(c, r() * W, r() * 380, r() * 2 + 0.4); c.fill(); } c.globalAlpha = 1; A.circle(c, W * 0.78, 140, 60); c.fillStyle = '#fff6c8'; c.fill(); A.circle(c, W * 0.78 + 20, 128, 54); c.fillStyle = '#1f1a50'; c.fill(); ridge(c, W, 470, 30, 0.004, '#1a1a40', s * 0.1, WATER_Y); },
      mid(c, W, t, s) { for (let i = 0; i < 6; i++) { const x = loopX(i * 340 - s * 0.5, W); c.beginPath(); c.moveTo(x - 80, WATER_Y); c.quadraticCurveTo(x, 440, x + 80, WATER_Y); fs(c, '#2a2460', 3); A.sparkles(c, [[x - 20, 480, i, 5], [x + 20, 500, i + 2, 4]], t, '#c48cff'); } },
      near(c, W, t, s) { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const x = loopX(i * 53 - s * 0.9 + Math.sin(t + i) * 10, W), y = WATER_Y + 6 + (i % 5) * 6; A.circle(c, x, y, 2 + (i % 3)); c.fillStyle = `rgba(190,140,255,${0.4 + 0.4 * Math.sin(t * 3 + i)})`; c.fill(); } c.globalCompositeOperation = 'source-over'; }
    },
    TB: {
      far(c, W, t, s) { for (let i = 0; i < 6; i++) { const x = loopX(i * 380 - s * 0.15, W); c.beginPath(); c.moveTo(x - 140, WATER_Y); c.lineTo(x - 60, 300 + (i % 3) * 40); c.lineTo(x, 340); c.lineTo(x + 60, 280 + (i % 2) * 60); c.lineTo(x + 140, WATER_Y); c.closePath(); fs(c, '#eaf6ff', 3); c.fillStyle = 'rgba(140,190,230,0.5)'; c.beginPath(); c.moveTo(x, 340); c.lineTo(x + 60, 280 + (i % 2) * 60); c.lineTo(x + 140, WATER_Y); c.lineTo(x + 20, WATER_Y); c.fill(); } },
      mid(c, W, t, s) { for (let i = 0; i < 7; i++) { const x = loopX(i * 300 - s * 0.5, W), y = WATER_Y - 6 + Math.sin(t + i) * 3; A.wobblyPoly(c, [[x - 60, y + 10], [x - 40, y - 14], [x + 30, y - 18], [x + 64, y + 10]], i, 4); fs(c, '#f5fbff', 3); } if (Math.floor(t * 0.5) % 4 === 0) { const x = loopX(1200 - s * 0.5, W); c.save(); c.translate(x, WATER_Y - 20); c.scale(0.3, 0.3); D.FishArt.draw(c, 'TB_05', 0, 0, 200, { t, noAura: true }); c.restore(); } },
      near(c, W, t) { c.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 70; i++) { const x = (i * 97 + t * (40 + (i % 5) * 10)) % W, y = (i * 61 + t * (60 + (i % 4) * 15)) % 800; A.circle(c, x, y, 1.5 + (i % 3)); c.fill(); } }
    },
    BKM: {
      far(c, W, t, s) { ridge(c, W, 460, 20, 0.003, '#5a7a72', s * 0.1, WATER_Y); for (let i = 0; i < 4; i++) { const x = loopX(i * 520 - s * 0.15, W); c.save(); c.translate(x, WATER_Y); c.rotate(-0.15 + i * 0.1); A.rr(c, -6, -220, 10, 220, 2); c.fillStyle = '#3a4a46'; c.fill(); c.beginPath(); c.moveTo(4, -210); c.lineTo(70, -150 + Math.sin(t + i) * 8); c.lineTo(4, -110); c.fillStyle = 'rgba(200,210,190,0.5)'; c.fill(); c.restore(); } },
      mid(c, W, t, s) { for (let i = 0; i < 3; i++) { const x = loopX(i * 700 - s * 0.5, W); c.save(); c.translate(x, WATER_Y + 10); c.rotate(0.25); A.rr(c, -160, -60, 320, 70, 26); fs(c, '#4a3a2a'); for (let k = 0; k < 4; k++) { A.circle(c, -110 + k * 70, -30, 12); fs(c, '#1a1a1a', 3); } A.rr(c, -10, -200, 14, 150, 3); fs(c, '#3a2a1a'); c.restore(); } },
      near(c, W, t, s) { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const x = loopX(i * 330 + Math.sin(t * 0.7 + i) * 40 - s * 0.7, W), y = 420 + Math.sin(t * 1.3 + i * 2) * 40; c.fillStyle = A.rg(c, x, y, 2, 30, ['rgba(125,255,200,0.7)', 'rgba(125,255,200,0)']); A.circle(c, x, y, 30); c.fill(); } c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(200,230,220,0.22)'; for (let i = 0; i < 3; i++) { A.ellipse(c, loopX(i * 700 + t * 15, W), 500 + i * 20, 420, 30); c.fill(); } }
    },
    KKD: {
      far(c, W, t, s) { const x = loopX(W * 0.65 - s * 0.1, W); c.beginPath(); c.moveTo(x - 360, WATER_Y); c.lineTo(x - 60, 220); c.lineTo(x + 60, 220); c.lineTo(x + 360, WATER_Y); c.closePath(); fs(c, '#3a1a14', 4); c.beginPath(); c.moveTo(x - 60, 220); c.lineTo(x - 30, 300); c.lineTo(x, 250); c.lineTo(x + 30, 320); c.lineTo(x + 60, 220); c.fillStyle = '#ff6a2a'; c.fill(); c.fillStyle = A.rg(c, x, 210, 10, 220, ['rgba(255,140,40,0.55)', 'rgba(255,140,40,0)']); A.circle(c, x, 210, 220); c.fill(); for (let k = 0; k < 6; k++) { const q = (t * 0.15 + k / 6) % 1; A.circle(c, x + Math.sin(q * 4 + k) * 30, 200 - q * 200, 30 + q * 50); c.fillStyle = `rgba(80,60,60,${0.55 * (1 - q)})`; c.fill(); } },
      mid(c, W, t, s) { for (let i = 0; i < 6; i++) { const x = loopX(i * 340 - s * 0.5, W); A.wobblyPoly(c, [[x - 70, WATER_Y], [x - 40, 500], [x + 30, 490], [x + 70, WATER_Y]], i + 3, 6); fs(c, '#2a1a1a'); for (let k = 0; k < 3; k++) { const q = (t * 0.6 + k / 3 + i * 0.2) % 1; A.circle(c, x + Math.sin(q * 6) * 8, 486 - q * 100, 10 + q * 18); c.fillStyle = `rgba(255,255,255,${0.4 * (1 - q)})`; c.fill(); } } },
      near(c, W, t) { for (let i = 0; i < 30; i++) { const x = (i * 131 + t * 30) % W, y = 700 - ((i * 47 + t * (50 + i % 4 * 20)) % 700); A.circle(c, x, y, 2 + (i % 3)); c.fillStyle = `rgba(255,${120 + (i % 5) * 20},40,0.8)`; c.fill(); } }
    },
    BG: {
      far(c, W, t, s) { c.save(); c.translate(W * 0.5, 300); for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(0, 0, 60 + i * 50, t * (0.3 + i * 0.05), t * (0.3 + i * 0.05) + 3.6); c.lineWidth = 10; c.strokeStyle = i % 2 ? 'rgba(95,245,224,0.4)' : 'rgba(176,124,255,0.4)'; c.stroke(); } c.restore(); for (let i = 0; i < 6; i++) { const x = loopX(i * 330 + t * 10, W), y = 120 + (i % 3) * 80 + Math.sin(t + i) * 20; c.save(); c.translate(x, y); c.rotate(t * 0.5 + i); c.beginPath(); c.moveTo(0, -24); c.lineTo(20, 10); c.lineTo(-20, 10); c.closePath(); fs(c, i % 2 ? '#5ff5e0' : '#ff4fb3', 3); c.restore(); } },
      mid(c, W, t, s) { if (Math.sin(t * 0.9) > 0.97) { c.fillStyle = 'rgba(220,240,255,0.35)'; c.fillRect(0, 0, W, WATER_Y); c.beginPath(); const x = W * 0.3 + Math.sin(t) * 200; c.moveTo(x, 0); c.lineTo(x + 20, 120); c.lineTo(x - 10, 140); c.lineTo(x + 30, 280); c.lineWidth = 6; c.strokeStyle = '#e8f8ff'; c.stroke(); } for (let i = 0; i < 3; i++) { const x = loopX(i * 700 - s * 0.5, W); c.save(); c.translate(x, 480 + Math.sin(t + i) * 30); c.rotate(Math.sin(t * 0.5 + i) * 0.4); A.rr(c, -40, -26, 80, 52, 6); c.fillStyle = 'rgba(40,20,80,0.7)'; c.fill(); A.signText(c, '?', 0, 2, 30, '#5ff5e0'); c.restore(); } },
      near(c, W, t, s) { for (let i = 0; i < 8; i++) { const x = loopX(i * 260 - s, W), y = WATER_Y + 8; c.beginPath(); c.arc(x, y, 30 + Math.sin(t * 3 + i) * 6, 0, Math.PI, true); c.lineWidth = 3; c.strokeStyle = 'rgba(95,245,224,0.6)'; c.stroke(); } }
    }
  };

  RA.WATER_Y = WATER_Y;
  RA.backdrop = (c, code, W, H, t, scroll) => {
    const R = D.RegionDB[code], p = R.palette;
    c.fillStyle = A.lg(c, 0, 0, 0, WATER_Y, [p.sky[0], p.sky[1]]); c.fillRect(0, 0, W, WATER_Y);
    const L = LAYERS[code];
    L.far(c, W, t, scroll);
    L.mid(c, W, t, scroll);
    // su yüzeyi + derinlik
    c.fillStyle = A.lg(c, 0, WATER_Y, 0, H, [p.sea[0], p.sea[1]]); c.fillRect(0, WATER_Y, W, H - WATER_Y);
    A.waves(c, 0, W, WATER_Y, 5, 170, t * 1.3 + scroll * 0.01, A.shade(p.sea[0], 0.15), A.alpha('#ffffff', 0.4), WATER_Y + 40);
    c.fillStyle = A.alpha('#ffffff', 0.12); for (let i = 0; i < 10; i++) { const x = loopX(i * 230 - scroll * 0.9, W); A.ellipse(c, x, WATER_Y + 60 + (i % 4) * 50, 60, 4); c.fill(); }
    L.near(c, W, t, scroll);
  };
  RA.under = (c, code, x, y, w, h, t) => {
    const R = D.RegionDB[code], p = R.palette;
    c.save(); A.rr(c, x, y, w, h, 24); c.clip();
    c.fillStyle = A.lg(c, 0, y, 0, y + h, [p.deep[0], p.deep[1]]); c.fillRect(x, y, w, h);
    // ışık hüzmeleri
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const bx = x + w * (0.15 + i * 0.25) + Math.sin(t * 0.4 + i) * 30; c.beginPath(); c.moveTo(bx - 30, y); c.lineTo(bx + 30, y); c.lineTo(bx + 90, y + h); c.lineTo(bx - 10, y + h); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.05)'; c.fill(); }
    c.globalCompositeOperation = 'source-over';
    // dip dekoru (bölgeye özel)
    const by = y + h;
    const r = A.rand(D.RNG.hashStr(code));
    c.fillStyle = A.shade(p.deep[1], 0.18); c.beginPath(); c.moveTo(x, by); for (let k = 0; k <= 20; k++) c.lineTo(x + (w / 20) * k, by - 40 - Math.sin(k * 1.3) * 16); c.lineTo(x + w, by); c.fill();
    const deco = {
      EL: () => { for (let i = 0; i < 6; i++) { const sx = x + 60 + i * (w / 6); c.beginPath(); c.moveTo(sx, by - 30); c.quadraticCurveTo(sx + Math.sin(t + i) * 20, by - 120, sx + 10, by - 160 - (i % 3) * 30); c.lineWidth = 8; c.strokeStyle = '#3a8a4a'; c.stroke(); } A.rr(c, x + w * 0.7, by - 90, 60, 50, 6); fs(c, '#8a6a4a'); },
      TS: () => { for (let i = 0; i < 14; i++) { const sx = x + 20 + i * (w / 14); c.beginPath(); c.moveTo(sx, by - 20); c.quadraticCurveTo(sx + Math.sin(t * 0.8 + i) * 24, by - 160, sx + 4, by - 240); c.lineWidth = 5; c.strokeStyle = '#4a7a3a'; c.stroke(); } },
      PSK: () => { for (let i = 0; i < 4; i++) { A.rr(c, x + 40 + i * (w / 4), by - 80 - (i % 2) * 30, 80, 24, 12); fs(c, '#6a4a2a'); } D.ItemArt.drawTrash(c, 'T_GEARBOX', x + w * 0.5, by - 60, 70); D.ItemArt.drawTrash(c, 'T_CAN', x + w * 0.8, by - 50, 50); },
      YK: () => { for (let i = 0; i < 8; i++) { const sx = x + 40 + r() * (w - 80); c.fillStyle = A.rg(c, sx, by - 60, 2, 40, ['rgba(200,150,255,0.8)', 'rgba(200,150,255,0)']); A.circle(c, sx, by - 60 - r() * 60, 40); c.fill(); } for (let i = 0; i < 5; i++) { const sx = x + 50 + i * (w / 5); c.beginPath(); c.moveTo(sx, by - 30); for (let k = 0; k < 5; k++) c.lineTo(sx + (k % 2 ? 14 : -14), by - 50 - k * 22); c.lineWidth = 6; c.strokeStyle = '#ff6ac8'; c.stroke(); } },
      TB: () => { for (let i = 0; i < 5; i++) { const sx = x + 30 + i * (w / 5); c.beginPath(); c.moveTo(sx, y); c.lineTo(sx + 30, y + 80 + (i % 3) * 40); c.lineTo(sx + 60, y); c.closePath(); fs(c, 'rgba(230,248,255,0.85)', 3); } for (let i = 0; i < 4; i++) { const sx = x + 40 + i * (w / 4); c.beginPath(); c.moveTo(sx, by - 30); c.lineTo(sx + 16, by - 90); c.lineTo(sx + 32, by - 30); fs(c, '#cfefff', 3); } },
      BKM: () => { c.save(); c.translate(x + w * 0.55, by - 70); c.rotate(-0.2); A.rr(c, -200, -60, 400, 100, 30); fs(c, '#3a2a1a'); for (let k = 0; k < 5; k++) { A.circle(c, -150 + k * 70, -20, 14); fs(c, '#0a0a0a', 3); } c.restore(); D.ItemArt.draw(c, 'CHEST_03', x + w * 0.2, by - 50, 70); for (let i = 0; i < 3; i++) { c.fillStyle = A.rg(c, x + 100 + i * 220, by - 140, 2, 30, ['rgba(125,255,200,0.6)', 'rgba(0,0,0,0)']); A.circle(c, x + 100 + i * 220 + Math.sin(t + i) * 10, by - 140, 30); c.fill(); } },
      KKD: () => { for (let i = 0; i < 4; i++) { const sx = x + 60 + i * (w / 4); A.wobblyPoly(c, [[sx - 40, by - 20], [sx - 20, by - 80], [sx + 20, by - 80], [sx + 40, by - 20]], i, 5); fs(c, '#2a1a1a'); c.fillStyle = '#ff6a2a'; c.fillRect(sx - 8, by - 82, 16, 6); for (let k = 0; k < 4; k++) { const q = (t * 0.8 + k / 4 + i * 0.3) % 1; A.circle(c, sx + Math.sin(q * 6) * 8, by - 90 - q * (h - 120), 5 + q * 6); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; c.stroke(); } } },
      BG: () => { c.save(); c.translate(x + w / 2, y + h * 0.6); for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(0, 0, 40 + i * 50, -t * (0.4 + i * 0.1), -t * (0.4 + i * 0.1) + 4.4); c.lineWidth = 6; c.strokeStyle = i % 2 ? 'rgba(95,245,224,0.3)' : 'rgba(255,79,179,0.25)'; c.stroke(); } c.restore(); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#ff4fb3' : '#5ff5e0'; c.globalAlpha = 0.5; c.fillRect(x + r() * w, y + r() * h, 10 + r() * 30, 4); } c.globalAlpha = 1; }
    }[code];
    deco();
    // kabarcıklar
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const q = (t * (0.08 + (i % 4) * 0.02) + i / 14) % 1; A.circle(c, x + ((i * 97) % w) + Math.sin(q * 8 + i) * 8, by - q * h, 3 + (i % 3) * 2); c.stroke(); }
    c.restore();
    // çerçeve: ahşap + halat
    A.rr(c, x, y, w, h, 24); c.lineWidth = 16; c.strokeStyle = OL; c.stroke(); c.lineWidth = 10; c.strokeStyle = '#a8743a'; c.stroke();
    c.setLineDash([10, 10]); c.lineWidth = 3; c.strokeStyle = '#d8b47a'; A.rr(c, x, y, w, h, 24); c.stroke(); c.setLineDash([]);
  };
  // ---- Kullanıcı görselleri ----
  // Bölge arka planı: görseldeki su çizgisi (y oranı) ve teknenin oturacağı su seviyesi (görsel y oranı).
  // Tekne su çizgisinin biraz altına, ön plandaki suya oturur.
  const BG_VIEW = D.ImageView(1920, 1072);
  RA.BG_INFO = {
    EL: { boat: 0.56 }, TS: { boat: 0.6 }, PSK: { boat: 0.52 }, YK: { boat: 0.53 },
    TB: { boat: 0.5 }, BKM: { boat: 0.54 }, KKD: { boat: 0.48 }, BG: { boat: 0.55 }
  };
  // Panel görselinin iç penceresi (çerçeve hariç su alanı), görsel boyutuna oranla [sol, üst, sağ, alt] boşluk.
  RA.PANEL_INSET = { EL: [0.105, 0.115, 0.105, 0.135], TS: [0.105, 0.11, 0.105, 0.125], PSK: [0.095, 0.11, 0.1, 0.13], YK: [0.11, 0.14, 0.105, 0.12],
    TB: [0.105, 0.12, 0.105, 0.125], BKM: [0.105, 0.115, 0.105, 0.12], KKD: [0.1, 0.12, 0.1, 0.125], BG: [0.105, 0.115, 0.105, 0.12] };
  RA.hasImage = (code) => !!D.Assets.get('region_' + code);
  RA.hasPanel = (code) => !!D.Assets.get('panel_' + code);
  // Arka planı çizer, teknenin oturacağı su seviyesini (sahne y) döndürür.
  RA.backdropImage = (c, code, W, H, t) => {
    const img = D.Assets.get('region_' + code);
    D.SM.drawStatic(c, 'region-' + code, (cc, w, hh) => BG_VIEW.drawStatic(cc, w, hh, img));
    const wy = BG_VIEW.pt(0, RA.BG_INFO[code].boat * 1072)[1];
    // hafif su yansımaları (resmin üzerine, yalnız su seviyesinin altında)
    c.save(); c.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const x = ((i * 241) % (W + 200)) - 100 + Math.sin(t * 0.5 + i) * 26, y = wy + 30 + ((i * 53) % Math.max(60, H - wy - 60));
      const a = 0.1 + 0.1 * Math.sin(t * 1.1 + i * 1.7);
      if (a <= 0) continue;
      c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x - 34, y); c.quadraticCurveTo(x, y - 6, x + 34, y); c.stroke();
    }
    c.restore();
    return wy;
  };
  // Çerçeveli su altı paneli: dış dikdörtgene çizer, iç pencereyi döndürür.
  RA.panelInner = (code, x, y, w, h) => { const k = RA.PANEL_INSET[code] || [0.105, 0.12, 0.105, 0.125]; return { x: x + w * k[0], y: y + h * k[1], w: w * (1 - k[0] - k[2]), h: h * (1 - k[1] - k[3]) }; };
  RA.panelImage = (c, code, x, y, w, h, t) => {
    const img = D.Assets.get('panel_' + code);
    c.drawImage(img, x, y, w, h);
    const r = RA.panelInner(code, x, y, w, h);
    // kabarcıklar (iç pencerede)
    c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, r.h); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const q = (t * (0.07 + (i % 4) * 0.02) + i / 12) % 1; A.circle(c, r.x + ((i * 97) % r.w) + Math.sin(q * 8 + i) * 8, r.y + r.h - q * r.h, 3 + (i % 3) * 2); c.stroke(); }
    c.restore();
    return r;
  };
  // Haritada kilitli bölge için çizilmiş asma kilit
  RA.padlock = (c, x, y, s) => { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.arc(0, -14, 16, Math.PI, 0); c.lineWidth = 8; c.strokeStyle = OL; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#c9ccd0'; c.stroke(); A.rr(c, -22, -14, 44, 36, 6); fs(c, '#f0c040'); A.circle(c, 0, 0, 5); fs(c, OL, 0); c.restore(); };
  D.RegionArt = RA;
})(globalThis.DUMEN);
