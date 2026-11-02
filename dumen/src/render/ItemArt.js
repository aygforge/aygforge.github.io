// 102 ItemDB kaydı + kozmetik + çöp için prosedürel ikonlar. Yerel alan: 100×100, merkez (0,0).
(function (D) {
  'use strict';
  const A = D.Art, OL = A.OL;
  const fs = (c, f, lw) => A.fs(c, f, lw == null ? 3.5 : lw);
  const I = {};
  const jar = (c, col, label) => { A.rr(c, -24, -22, 48, 54, 10); fs(c, A.alpha('#e8f4ff', 0.85)); A.rr(c, -20, -6, 40, 34, 8); fs(c, col, 2.5); A.rr(c, -26, -34, 52, 14, 4); fs(c, '#a8743a'); if (label) { A.rr(c, -14, 2, 28, 14, 3); fs(c, '#fff6e0', 2); } };
  I.rod = (c, col) => { c.beginPath(); c.moveTo(-36, 38); c.lineTo(34, -38); c.lineWidth = 9; c.strokeStyle = OL; c.stroke(); c.lineWidth = 5; c.strokeStyle = col; c.stroke(); A.circle(c, -14, 18, 12); fs(c, '#c9ccd0'); A.circle(c, -14, 18, 4); fs(c, OL, 0); c.beginPath(); c.moveTo(34, -38); c.quadraticCurveTo(44, 0, 30, 30); c.lineWidth = 1.6; c.strokeStyle = '#555'; c.stroke(); c.beginPath(); c.arc(30, 34, 5, Math.PI, Math.PI * 2.5); c.lineWidth = 2.5; c.stroke(); };
  I.line = (c, col) => { A.rr(c, -26, -30, 52, 60, 6); fs(c, '#6a4a2a'); A.rr(c, -20, -24, 40, 48, 4); fs(c, col, 2.5); c.strokeStyle = A.shade(col, -0.3); c.lineWidth = 1.5; for (let y = -20; y < 22; y += 5) { c.beginPath(); c.moveTo(-18, y); c.lineTo(18, y + 2); c.stroke(); } };
  I.hook = (c, col) => { c.beginPath(); c.moveTo(0, -36); c.lineTo(0, 14); c.arc(-14, 14, 14, 0, Math.PI * 0.95); c.lineWidth = 9; c.strokeStyle = OL; c.stroke(); c.lineWidth = 5; c.strokeStyle = col; c.stroke(); c.beginPath(); c.moveTo(-28, 16); c.lineTo(-32, 4); c.lineTo(-24, 8); fs(c, col, 2.5); A.circle(c, 0, -38, 6); c.lineWidth = 3; c.strokeStyle = OL; c.stroke(); };
  I.float = (c, col) => { c.beginPath(); c.moveTo(0, -40); c.lineTo(0, -22); c.lineWidth = 4; c.strokeStyle = OL; c.stroke(); A.ellipse(c, 0, 4, 22, 28); fs(c, '#fff'); c.save(); A.ellipse(c, 0, 4, 22, 28); c.clip(); c.fillStyle = col; c.fillRect(-30, -30, 60, 30); c.restore(); A.ellipse(c, 0, 4, 22, 28); fs(c, null); c.beginPath(); c.moveTo(0, 32); c.lineTo(0, 44); c.stroke(); };
  I.bait = (c, col) => jar(c, col, true);
  I.chest = (c, col, id) => {
    const C = D.ChestDB[id]; const th = C ? C.theme : 'karton';
    const body = th === 'karton' ? '#b08a5a' : th === 'teneke' ? '#9aa7b2' : th === 'buz' ? '#bfe6f8' : th === 'lava' ? '#5a1a12' : th === 'bermuda' ? '#2a5a6a' : th === 'sifreli' ? '#2a2f3a' : th === 'tarcov' ? '#1a1a1a' : th === 'yakamoz' ? '#3a2a6a' : th === 'kilitli' ? '#5a4a3a' : '#7a4a2a';
    A.rr(c, -36, -10, 72, 42, 6); fs(c, body); c.beginPath(); c.moveTo(-36, -10); c.quadraticCurveTo(0, -42, 36, -10); c.closePath(); fs(c, A.shade(body, 0.15));
    const trim = th === 'lava' ? '#ff6a2a' : th === 'yakamoz' ? '#c48cff' : th === 'buz' ? '#ffffff' : th === 'bermuda' ? '#5ff5e0' : '#f0c040';
    c.fillStyle = trim; c.fillRect(-36, -2, 72, 6); c.strokeStyle = OL; c.lineWidth = 2.5; c.strokeRect(-36, -2, 72, 6);
    A.rr(c, -8, -6, 16, 18, 3); fs(c, trim, 2.5);
    if (th === 'sifreli') { A.circle(c, 0, 18, 8); fs(c, '#c9ccd0', 2.5); }
    if (th === 'tarcov') { A.circle(c, 18, 16, 9); fs(c, '#e0453d', 2.5); A.signText(c, 'T', 18, 17, 10, '#fff'); }
    if (th === 'karton') { c.strokeStyle = 'rgba(60,40,20,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-26, 26); c.lineTo(-10, 14); c.stroke(); }
    if (th === 'lava') { c.fillStyle = '#ff9a3c'; for (const x of [-24, 24]) { A.circle(c, x, 20, 4); c.fill(); } }
  };
  I.key = (c, col) => { A.circle(c, -18, 0, 16); fs(c, col); A.circle(c, -18, 0, 6); fs(c, '#1a1a1a', 2); A.rr(c, -4, -5, 44, 10, 3); fs(c, col); c.fillStyle = col; A.rr(c, 26, 4, 7, 12, 2); fs(c, col, 2.5); A.rr(c, 14, 4, 7, 9, 2); fs(c, col, 2.5); };
  I.bmpart = (c, col, id) => { A.rr(c, -34, -26, 68, 56, 8); fs(c, '#2a1a24'); c.strokeStyle = '#c9302c'; c.lineWidth = 3; c.strokeRect(-28, -20, 56, 44); c.fillStyle = '#ff8ab8'; for (const [x, y, r] of [[0, 6, 9], [-10, -6, 4], [-3, -10, 4], [5, -10, 4], [12, -6, 4]]) { A.circle(c, x, y, r); c.fill(); } A.signText(c, id.slice(3), 22, 18, 12, '#fff', OL); };
  I.coin = (c) => { A.circle(c, 0, 0, 30); fs(c, '#f0c040'); A.circle(c, 0, 0, 22); fs(c, '#ffd86a', 2.5); A.signText(c, 'D', 0, 2, 26, '#c98a1a'); };
  I.scrapcur = (c) => { c.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 30 : 22; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); fs(c, '#9aa7b2'); A.circle(c, 0, 0, 9); fs(c, '#5a5f66', 2.5); };
  I.miyav = (c) => { A.circle(c, 0, 0, 30); fs(c, '#ff8ab8'); c.fillStyle = '#fff'; A.circle(c, 0, 8, 10); c.fill(); for (const [x, y] of [[-12, -6], [-4, -12], [4, -12], [12, -6]]) { A.circle(c, x, y, 4.5); c.fill(); } };
  I.permit = (c) => { A.rr(c, -30, -36, 60, 72, 4); fs(c, '#f5efe0'); c.strokeStyle = '#8a7a5a'; c.lineWidth = 2; for (let y = -24; y < 10; y += 8) { c.beginPath(); c.moveTo(-20, y); c.lineTo(20, y); c.stroke(); } A.circle(c, 12, 22, 11); fs(c, '#c9302c', 2.5); A.signText(c, '✓', 12, 23, 13, '#fff'); };
  // materyaller
  const MAT = {
    scrapmetal: (c) => { A.wobblyPoly(c, [[-30, 10], [-20, -24], [10, -30], [30, -6], [20, 26], [-14, 28]], 3, 4); fs(c, '#8a8f94'); c.strokeStyle = '#5a5f66'; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, -10); c.lineTo(12, 12); c.stroke(); },
    plate: (c) => { A.rr(c, -32, -22, 64, 44, 4); fs(c, '#c26b2d'); c.fillStyle = '#8a4a1a'; for (const [x, y] of [[-24, -14], [24, -14], [-24, 14], [24, 14]]) { A.circle(c, x, y, 3.5); c.fill(); } c.fillStyle = 'rgba(90,40,10,0.4)'; A.ellipse(c, 6, 4, 14, 8); c.fill(); },
    bolts: (c) => { for (const [x, y] of [[-14, 6], [14, 0]]) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; c.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); } c.closePath(); fs(c, '#9aa7b2'); A.circle(c, x, y, 5); fs(c, '#5a5f66', 2); } },
    spring: (c) => { c.beginPath(); for (let i = 0; i <= 60; i++) { const y = -30 + i; c.lineTo(Math.sin(i * 0.6) * 18, y); } c.lineWidth = 7; c.strokeStyle = OL; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#b8c0c8'; c.stroke(); },
    gears: (c) => { const g = (x, y, r, col) => { c.beginPath(); for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2, rr = i % 2 ? r : r * 0.78; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); fs(c, col); A.circle(c, x, y, r * 0.3); fs(c, OL, 0); }; g(-10, 4, 24, '#d9a05a'); g(20, -16, 14, '#c98a3a'); },
    motor: (c) => { A.rr(c, -30, -20, 50, 40, 6); fs(c, '#5a5f66'); A.rr(c, 20, -8, 14, 16, 3); fs(c, '#8a8f94'); c.strokeStyle = '#8a8f94'; c.lineWidth = 3; for (let x = -24; x < 16; x += 8) { c.beginPath(); c.moveTo(x, -16); c.lineTo(x, 16); c.stroke(); } },
    propeller: (c) => { for (let i = 0; i < 3; i++) { c.save(); c.rotate((i / 3) * Math.PI * 2); A.ellipse(c, 0, -18, 10, 20); fs(c, i === 2 ? A.shade('#e8c94a', -0.3) : '#e8c94a'); c.restore(); } A.circle(c, 0, 0, 7); fs(c, '#5a5f66'); c.beginPath(); c.moveTo(4, 22); c.lineTo(14, 34); c.lineWidth = 3; c.strokeStyle = OL; c.stroke(); },
    plastic: (c) => { A.wobblyPoly(c, [[-28, -10], [0, -30], [28, -14], [20, 24], [-18, 26]], 5, 3); fs(c, A.alpha('#5fb0e0', 0.85)); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -12); c.lineTo(8, 10); c.stroke(); },
    cable: (c) => { c.beginPath(); c.moveTo(-34, 20); c.bezierCurveTo(-10, -40, 10, 40, 34, -20); c.lineWidth = 9; c.strokeStyle = OL; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#e0453d'; c.stroke(); c.beginPath(); c.moveTo(-34, 26); c.bezierCurveTo(-10, -30, 10, 50, 34, -12); c.lineWidth = 9; c.strokeStyle = OL; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#3d8fe0'; c.stroke(); },
    crystal: (c) => { c.beginPath(); c.moveTo(0, -36); c.lineTo(18, -6); c.lineTo(10, 30); c.lineTo(-12, 30); c.lineTo(-20, -6); c.closePath(); fs(c, '#9fe2ff'); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.moveTo(0, -36); c.lineTo(-6, 0); c.lineTo(-20, -6); c.fill(); },
    lavacore: (c) => { A.circle(c, 0, 0, 26); fs(c, '#3a1a12'); c.fillStyle = A.rg(c, 0, 0, 2, 20, ['#ffe08a', '#ff6a2a', 'rgba(255,60,20,0)']); A.circle(c, 0, 0, 20); c.fill(); },
    pearl: (c) => { A.ellipse(c, 0, 14, 34, 12); fs(c, '#6a5a8a'); A.circle(c, 0, 0, 18); fs(c, A.rg(c, -6, -6, 2, 20, ['#ffffff', '#e8e0ff', '#b8a8e8'])); },
    goldscale: (c) => { c.beginPath(); c.moveTo(0, -30); c.quadraticCurveTo(30, -10, 0, 32); c.quadraticCurveTo(-30, -10, 0, -30); fs(c, '#f0c040'); c.strokeStyle = '#c98a1a'; c.lineWidth = 2; for (const y of [-10, 4, 16]) { c.beginPath(); c.arc(0, y - 14, 14, 0.4, Math.PI - 0.4); c.stroke(); } },
    magnet: (c) => { c.beginPath(); c.arc(0, -4, 22, Math.PI, 0); c.lineTo(22, 24); c.lineTo(10, 24); c.lineTo(10, -4); c.arc(0, -4, 10, 0, Math.PI, true); c.lineTo(-10, 24); c.lineTo(-22, 24); c.closePath(); fs(c, '#c94a4a'); c.fillStyle = '#d9dde6'; c.fillRect(-22, 14, 12, 10); c.fillRect(10, 14, 12, 10); },
    tooth: (c) => { c.beginPath(); c.moveTo(-20, -24); c.quadraticCurveTo(0, -34, 20, -24); c.quadraticCurveTo(10, 10, 2, 34); c.quadraticCurveTo(-8, 10, -20, -24); fs(c, '#e8f5ff'); c.strokeStyle = '#9fe2ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -18); c.lineTo(2, 20); c.stroke(); },
    seed: (c) => { A.ellipse(c, 0, 4, 18, 26, 0.3); fs(c, '#c9302c'); c.beginPath(); c.moveTo(4, -22); c.quadraticCurveTo(20, -40, 26, -28); c.quadraticCurveTo(14, -24, 4, -22); fs(c, '#5fb050', 2.5); },
    rustcore: (c) => { A.circle(c, 0, 0, 26); fs(c, '#8a5a2a'); c.fillStyle = '#c26b2d'; for (const [x, y] of [[-8, -8], [10, 4], [-4, 12]]) { A.circle(c, x, y, 6); c.fill(); } A.circle(c, 0, 0, 8); fs(c, '#3cff6c', 2); },
    whisper: (c) => { A.ellipse(c, 0, 2, 24, 28); fs(c, '#6a4aa8'); c.strokeStyle = '#e8d8ff'; c.lineWidth = 2.5; for (const r of [6, 12, 18]) { c.beginPath(); c.arc(-30, 2, r + 20, -0.4, 0.4); c.stroke(); } }
  };
  // 25 özel eşya ikonları
  const SPC = {
    '01': (c) => { A.rr(c, -22, -12, 40, 36, 8); fs(c, '#fff'); c.beginPath(); c.arc(20, 6, 9, -1.2, 1.2); c.lineWidth = 4; c.strokeStyle = OL; c.stroke(); A.ellipse(c, -2, -10, 18, 4); fs(c, '#e8c94a', 2); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; A.ellipse(c, -2 + Math.cos(a) * 6, 6 + Math.sin(a) * 6, 4, 2.5, a); fs(c, '#fff', 1.5); } A.circle(c, -2, 6, 3); fs(c, '#f0c040', 1); },
    '02': (c) => { A.rr(c, -22, -14, 40, 40, 8); fs(c, '#c9302c'); c.beginPath(); c.arc(20, 6, 9, -1.2, 1.2); c.lineWidth = 4; c.strokeStyle = OL; c.stroke(); A.ellipse(c, -2, -12, 18, 5); fs(c, '#5a3a2a', 2); A.circle(c, -8, -16, 5); fs(c, '#fff', 2); A.circle(c, 4, -17, 4); fs(c, '#ffe0f0', 2); },
    '03': (c) => { for (let i = 0; i < 4; i++) { A.ellipse(c, 0, 18 - i * 9, 28, 8); fs(c, ['#e0453d', '#3d8fe0', '#f0c040', '#4fb36b'][i], 2.5); } },
    '04': (c) => { A.circle(c, 0, 4, 28); fs(c, '#f5efe0'); c.beginPath(); c.arc(0, 4, 22, Math.PI, Math.PI * 1.45); c.lineWidth = 6; c.strokeStyle = '#4fb36b'; c.stroke(); c.beginPath(); c.arc(0, 4, 22, Math.PI * 1.45, Math.PI * 1.75); c.strokeStyle = '#f0c040'; c.stroke(); c.beginPath(); c.arc(0, 4, 22, Math.PI * 1.75, Math.PI * 2); c.strokeStyle = '#e0453d'; c.stroke(); c.beginPath(); c.moveTo(0, 4); c.lineTo(14, -12); c.lineWidth = 3; c.strokeStyle = OL; c.stroke(); },
    '05': (c) => { c.beginPath(); c.arc(0, 6, 26, Math.PI, 0); fs(c, '#3d8fe0'); A.rr(c, 0, 2, 40, 8, 4); fs(c, '#2a6ab0'); A.signText(c, 'D', -2, -6, 18, '#fff'); },
    '06': (c) => { for (const x of [-16, 16]) { A.circle(c, x, 0, 14); c.fillStyle = 'rgba(200,230,255,0.6)'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#8a5a2a'; c.stroke(); } c.beginPath(); c.moveTo(-2, 0); c.lineTo(2, 0); c.stroke(); c.beginPath(); c.moveTo(-30, 0); c.quadraticCurveTo(-40, 20, -28, 30); c.stroke(); },
    '07': (c) => { c.save(); c.rotate(-0.6); A.rr(c, -30, -11, 60, 22, 11); fs(c, '#fff'); c.save(); A.rr(c, -30, -11, 60, 22, 11); c.clip(); c.fillStyle = '#e0453d'; c.fillRect(0, -12, 32, 24); c.restore(); A.rr(c, -30, -11, 60, 22, 11); fs(c, null); c.restore(); },
    '08': (c) => { A.rr(c, -16, -30, 32, 62, 8); fs(c, '#4fb36b'); A.rr(c, -12, -36, 24, 10, 3); fs(c, '#c9ccd0'); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-6, -46); c.quadraticCurveTo(0, -54, -4, -62); c.stroke(); },
    '09': (c) => { c.beginPath(); c.moveTo(-20, 30); c.lineTo(-24, -6); for (let i = 0; i < 4; i++) { c.lineTo(-20 + i * 11, -30 + (i % 3) * 4); c.lineTo(-14 + i * 11, -6); } c.lineTo(22, 6); c.lineTo(30, -4); c.lineTo(32, 10); c.lineTo(20, 30); c.closePath(); fs(c, '#a86a3a'); },
    '10': (c) => { c.beginPath(); c.arc(0, 0, 28, Math.PI * 0.5, Math.PI * 1.5); c.lineTo(0, 0); c.closePath(); fs(c, '#d9a05a'); c.fillStyle = '#8a5a2a'; for (const [x, y] of [[-14, -10], [-10, 8], [-20, 2]]) { A.circle(c, x, y, 2.5); c.fill(); } },
    '11': (c) => { c.beginPath(); c.moveTo(-30, 0); c.lineTo(20, -10); c.lineTo(30, 0); c.lineTo(20, 10); c.closePath(); fs(c, '#f0c040'); c.beginPath(); c.arc(-6, -24, 12, 0, 6.28); c.lineWidth = 3; c.strokeStyle = '#fff6a0'; c.stroke(); },
    '12': (c) => { A.rr(c, -26, -30, 52, 60, 4); fs(c, '#4fb36b'); A.rr(c, -26, -30, 10, 60, 3); fs(c, '#2f7a4a'); A.signText(c, '☘', 6, 0, 26, '#f0c040'); },
    '13': (c) => { for (const d of [-1, 1]) { c.beginPath(); c.moveTo(0, 10); c.bezierCurveTo(d * 10, -30, d * 40, -30, d * 36, 0); c.bezierCurveTo(d * 30, 10, d * 20, 20, 0, 10); fs(c, '#ffffff'); } A.circle(c, 0, -26, 10); c.lineWidth = 3; c.strokeStyle = '#f0c040'; c.stroke(); },
    '14': (c) => { c.beginPath(); c.moveTo(-10, -30); c.lineTo(10, -30); c.lineTo(10, 10); c.lineTo(28, 14); c.quadraticCurveTo(34, 30, 20, 32); c.lineTo(-10, 28); c.closePath(); fs(c, '#e0453d'); c.fillStyle = '#fff'; c.fillRect(-10, -20, 20, 6); c.fillRect(-10, -6, 20, 6); },
    '15': (c) => { A.circle(c, 0, 0, 28); fs(c, '#c9a04a'); A.circle(c, 0, 0, 22); fs(c, '#f5efe0', 2.5); c.beginPath(); c.moveTo(0, -18); c.lineTo(5, 0); c.lineTo(0, 18); c.lineTo(-5, 0); c.closePath(); fs(c, '#e0453d', 2); c.beginPath(); c.moveTo(-14, -22); c.lineTo(-2, -6); c.lineTo(-8, 10); c.lineWidth = 2; c.strokeStyle = OL; c.stroke(); },
    '16': (c) => { A.circle(c, 0, 0, 26); fs(c, '#3d8fe0'); A.circle(c, 0, 0, 10); fs(c, '#d9dde6', 2.5); A.signText(c, 'G', 0, 1, 12, OL); c.beginPath(); c.moveTo(20, 16); c.quadraticCurveTo(34, 30, 24, 40); c.lineWidth = 2; c.strokeStyle = '#eee'; c.stroke(); },
    '17': (c) => { A.circle(c, 0, 6, 26); fs(c, '#f0c040'); A.circle(c, 0, 6, 20); fs(c, '#fffaf0', 2); c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -8); c.moveTo(0, 6); c.lineTo(10, 10); c.lineWidth = 3; c.strokeStyle = OL; c.stroke(); A.circle(c, 0, -24, 5); c.stroke(); c.beginPath(); c.moveTo(-26, -20); c.quadraticCurveTo(-40, -36, -30, -40); c.stroke(); },
    '18': (c) => { A.rr(c, -22, -5, 44, 10, 3); fs(c, '#8a8f94'); for (const x of [-30, 22]) { A.rr(c, x, -20, 8, 40, 3); fs(c, '#2a2a2a'); A.rr(c, x + (x < 0 ? 8 : -6), -14, 6, 28, 2); fs(c, '#3a3a3a'); } },
    '19': (c) => { A.rr(c, -30, 6, 60, 22, 6); fs(c, '#5a5f66'); A.ellipse(c, 0, 6, 22, 10); fs(c, '#a81a1a'); A.ellipse(c, 0, 0, 22, 10); fs(c, '#e0453d'); c.fillStyle = 'rgba(255,255,255,0.5)'; A.ellipse(c, -6, -2, 8, 3); c.fill(); },
    '20': (c) => { A.rr(c, -14, -16, 28, 48, 6); fs(c, '#5fd3a8'); A.rr(c, -8, -30, 16, 14, 3); fs(c, '#fff'); c.fillStyle = 'rgba(180,240,255,0.7)'; for (const [x, y] of [[16, -30], [24, -24], [20, -36], [28, -32]]) { A.circle(c, x, y, 3); c.fill(); } A.signText(c, 'Zz', 0, 8, 11, '#fff'); },
    '21': (c) => { A.circle(c, 0, -6, 24); fs(c, '#5fb0e0'); for (let i = 0; i < 3; i++) { c.save(); c.translate(0, -6); c.rotate((i / 3) * 6.28 + 0.4); A.ellipse(c, 0, -11, 6, 11); fs(c, '#fff', 2); c.restore(); } A.rr(c, -4, 16, 8, 20, 3); fs(c, '#5a5f66'); },
    '22': (c) => { A.rr(c, -16, -32, 32, 64, 8); fs(c, '#2a2a30'); const cols = ['#e0453d', '#4fb36b', '#f0c040', '#3d8fe0']; for (let i = 0; i < 6; i++) { A.circle(c, -6 + (i % 2) * 12, -16 + Math.floor(i / 2) * 12, 4); fs(c, cols[i % 4], 1.5); } },
    '23': (c) => { A.rr(c, -30, -24, 60, 48, 6); fs(c, A.alpha('#e8f4ff', 0.9)); c.strokeStyle = '#8ab8d8'; c.lineWidth = 2; for (let y = -14; y <= 14; y += 14) for (let x = -18; x <= 18; x += 12) { A.circle(c, x, y, 5); c.stroke(); } },
    '24': (c) => { A.rr(c, -16, -30, 32, 60, 6); fs(c, '#2a2a30'); c.beginPath(); c.moveTo(4, -18); c.lineTo(-6, 2); c.lineTo(2, 2); c.lineTo(-4, 20); c.lineTo(8, -2); c.lineTo(0, -2); c.closePath(); fs(c, '#f2f25a', 2); },
    '25': (c) => { c.beginPath(); c.moveTo(-30, 10); c.quadraticCurveTo(-34, -20, 0, -20); c.quadraticCurveTo(34, -20, 30, 10); c.quadraticCurveTo(0, 30, -30, 10); fs(c, '#a33a2a'); c.fillStyle = '#e8d0c0'; for (const [x, y] of [[-14, -4], [4, -8], [16, 2], [-4, 6]]) { A.circle(c, x, y, 3.5); c.fill(); } A.rr(c, -12, -30, 24, 10, 3); fs(c, '#1a1a1a'); A.signText(c, '!', 0, -25, 9, '#ffd04a'); }
  };

  const ItemArt = {
    draw(c, id, x, y, size) {
      const ib = D.ItemBalanceDB[id]; if (!ib) return;
      c.save(); c.translate(x, y); c.scale(size / 100, size / 100);
      const icon = ib.icon;
      if (icon && icon.startsWith('spc_')) SPC[icon.slice(4)](c);
      else if (MAT[icon]) MAT[icon](c);
      else if (I[icon]) I[icon](c, ib.color || '#888', id);
      c.restore();
    },
    drawCosmetic(c, id, x, y, size) {
      const cos = D.CosmeticDB[id];
      c.save(); c.translate(x, y); c.scale(size / 100, size / 100);
      if (cos.slot === 'flag') { c.beginPath(); c.moveTo(-26, -34); c.lineTo(-26, 36); c.lineWidth = 5; c.strokeStyle = OL; c.stroke(); c.beginPath(); c.moveTo(-24, -32); c.quadraticCurveTo(0, -40, 30, -28); c.lineTo(30, 4); c.quadraticCurveTo(0, -6, -24, 2); c.closePath(); fs(c, cos.value.color); A.signText(c, { gull: '〰', skull: '☠', paw: '❀', star: '★', wheel: '☸' }[cos.value.mark] || '', 4, -14, 18, cos.value.color === '#ffffff' ? '#3d8fe0' : '#fff'); }
      else if (cos.slot === 'paint') { A.rr(c, -22, -10, 44, 40, 6); fs(c, '#c9ccd0'); A.ellipse(c, 0, -10, 22, 8); fs(c, cos.value.color); c.beginPath(); c.moveTo(16, -10); c.quadraticCurveTo(30, -40, 0, -36); c.lineWidth = 3; c.strokeStyle = OL; c.stroke(); }
      else { const k = cos.value.kind; if (k === 'fez') { c.beginPath(); c.moveTo(-20, 20); c.lineTo(-14, -20); c.lineTo(14, -20); c.lineTo(20, 20); c.closePath(); fs(c, '#c9302c'); c.beginPath(); c.moveTo(0, -20); c.quadraticCurveTo(20, -14, 18, 10); c.lineWidth = 3; c.strokeStyle = '#1a1a1a'; c.stroke(); } else if (k === 'foil') { A.wobblyPoly(c, [[-26, 20], [0, -30], [26, 20]], 11, 5); fs(c, '#d9dde6'); } else { A.rr(c, -26, -14, 52, 26, 8); fs(c, '#fff'); A.rr(c, -32, 8, 64, 10, 5); fs(c, '#1a1a22'); A.circle(c, 0, -2, 6); fs(c, '#f0c040', 2); } }
      c.restore();
    },
    drawTrash(c, id, x, y, size) {
      c.save(); c.translate(x, y); c.scale(size / 100, size / 100);
      const r = A.rand(D.RNG.hashStr(id));
      const col = ['#8a8f94', '#5fb0e0', '#c26b2d', '#e8c94a', '#6a5a4a', '#e0453d'][Math.floor(r() * 6)];
      if (id === 'T_DUCK') { A.ellipse(c, 0, 10, 28, 18); fs(c, '#f2d14a'); A.circle(c, 16, -12, 13); fs(c, '#f2d14a'); c.beginPath(); c.moveTo(26, -12); c.lineTo(38, -8); c.lineTo(26, -4); fs(c, '#f0a020', 2); A.circle(c, 18, -15, 2.5); fs(c, OL, 0); }
      else if (id === 'T_BOOT' || id === 'T_SLIPPER') { c.beginPath(); c.moveTo(-14, -30); c.lineTo(8, -30); c.lineTo(8, 10); c.lineTo(30, 16); c.lineTo(30, 30); c.lineTo(-14, 30); c.closePath(); fs(c, id === 'T_BOOT' ? '#2a2a30' : '#3d8fe0'); }
      else if (id === 'T_BOTTLE') { A.rr(c, -12, -20, 24, 50, 8); fs(c, A.alpha('#5fd3a8', 0.8)); A.rr(c, -6, -34, 12, 16, 3); fs(c, '#8a5a2a'); A.rr(c, -6, -6, 12, 22, 2); fs(c, '#f5efe0', 2); }
      else if (id === 'T_PIXELS') { for (let i = 0; i < 9; i++) { c.fillStyle = ['#ff4fb3', '#3fd2c7', '#ffffff'][i % 3]; c.fillRect(-24 + (i % 3) * 16, -24 + Math.floor(i / 3) * 16, 14, 14); } }
      else if (id === 'T_KEYRING') { A.circle(c, -10, -10, 14); c.lineWidth = 4; c.strokeStyle = '#a86a3a'; c.stroke(); c.save(); c.translate(8, 10); c.scale(0.5, 0.5); I.key(c, '#a86a3a'); c.restore(); }
      else { A.wobblyPoly(c, [[-26, -10], [-10, -28], [18, -24], [28, 4], [10, 26], [-20, 22]], D.RNG.hashStr(id) % 99, 6); fs(c, col); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-10, -8); c.lineTo(12, 10); c.stroke(); }
      c.restore();
    }
  };
  D.ItemArt = ItemArt;
})(globalThis.DUMEN);
