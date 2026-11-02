// 88 balığın veriyle yönetilen prosedürel illüstrasyonu: gövde ailesi + desen + aksesuar + renk.
// Yerel koordinat: balık boyu 200 birim (kuyruk -100, burun +100), sağa bakar.
(function (D) {
  'use strict';
  const A = D.Art; const OL = A.OL;
  const SIL = '#0b1824';
  let P = (c) => c; // renk filtresi (silüet modunda koyulaştırır)
  let SILMODE = false;
  const pf = (col) => (SILMODE ? SIL : col);
  const stroke = (c, lw) => { c.lineWidth = lw || 4; c.strokeStyle = SILMODE ? 'rgba(160,220,255,0.35)' : OL; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const fill = (c, col) => { c.fillStyle = pf(col); c.fill(); };
  const fs = (c, col, lw) => { fill(c, col); stroke(c, lw); };

  // ------------------- GÖVDELER -------------------
  const S = {};
  S.fish = {
    body(c, h) { h = h || 0.42; c.beginPath(); c.moveTo(96, 2); c.bezierCurveTo(84, -h * 120, -30, -h * 128, -68, -10); c.lineTo(-100, -46); c.quadraticCurveTo(-86, 0, -100, 46); c.lineTo(-68, 10); c.bezierCurveTo(-30, h * 118, 82, h * 112, 96, 2); c.closePath(); },
    under(c, col, h) { h = h || 0.42; c.beginPath(); c.moveTo(-46, -h * 92); c.quadraticCurveTo(-44, -h * 168, -10, -h * 160); c.quadraticCurveTo(10, -h * 130, 34, -h * 108); c.closePath(); fs(c, A.shade(col, -0.2), 3.5); },
    over(c, col, h) { h = h || 0.42; A.ellipse(c, 18, h * 40, 20, 9, 0.5); fs(c, A.shade(col, -0.15), 3); },
    anchors(h) { h = h || 0.42; return { eye: [58, -h * 32], mouth: [95, 4], top: [12, -h * 112], tail: [-92, 0], belly: [10, h * 100], chin: [78, h * 38], back: [-30, -h * 95], R: 100 }; }
  };
  S.round = {
    body(c) { c.beginPath(); c.arc(8, 0, 70, 0, Math.PI * 2); c.moveTo(-58, -6); c.lineTo(-96, -34); c.quadraticCurveTo(-84, 0, -96, 34); c.lineTo(-58, 6); },
    under(c, col) { c.beginPath(); c.moveTo(-10, -66); c.quadraticCurveTo(10, -100, 34, -62); fs(c, A.shade(col, -0.2), 3.5); },
    over(c, col) { A.ellipse(c, 20, 30, 16, 8, 0.6); fs(c, A.shade(col, -0.15), 3); },
    anchors() { return { eye: [40, -18], mouth: [76, 10], top: [8, -72], tail: [-90, 0], belly: [8, 70], chin: [60, 40], back: [-30, -60], R: 80 }; }
  };
  S.flat = {
    body(c) { A.ellipse(c, 0, 0, 92, 26); c.moveTo(-86, -4); c.lineTo(-104, -22); c.lineTo(-104, 22); c.lineTo(-86, 4); },
    under(c, col) { A.ellipse(c, 0, 8, 80, 16); fs(c, A.shade(col, -0.18), 3); },
    over(c, col) { c.beginPath(); c.ellipse(0, -2, 70, 12, 0, Math.PI, 0); c.strokeStyle = SILMODE ? SIL : A.shade(col, 0.4); c.lineWidth = 4; c.stroke(); },
    anchors() { return { eye: [58, -6], mouth: [90, 4], top: [0, -26], tail: [-98, 0], belly: [0, 26], chin: [70, 14], back: [-30, -22], R: 95 }; }
  };
  S.long = {
    body(c, t) {
      c.beginPath(); const pts = [];
      for (let i = 0; i <= 20; i++) { const x = -100 + i * 10; pts.push([x, Math.sin(i * 0.6 + (t || 0) * 4) * 10 * (1 - i / 24)]); }
      const th = (i) => 6 + 16 * Math.sin((i / 20) * Math.PI * 0.95 + 0.1);
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i <= 20; i++) c.lineTo(pts[i][0], pts[i][1] - th(i));
      c.quadraticCurveTo(110, pts[20][1], pts[20][0], pts[20][1] + th(20));
      for (let i = 20; i >= 0; i--) c.lineTo(pts[i][0], pts[i][1] + th(i));
      c.closePath();
    },
    under() {}, over() {},
    anchors() { return { eye: [84, -8], mouth: [102, 2], top: [60, -22], tail: [-96, 0], belly: [40, 20], chin: [90, 10], back: [0, -20], R: 100 }; }
  };
  S.serpent = {
    body(c, t) {
      c.beginPath(); const w = (x) => Math.sin(x * 0.045 + (t || 0) * 3) * 14;
      c.moveTo(-100, w(-100));
      for (let x = -100; x <= 60; x += 8) c.lineTo(x, w(x) - (10 + (x + 100) * 0.12));
      c.bezierCurveTo(80, -50, 108, -30, 104, 0); c.bezierCurveTo(100, 22, 80, 30, 60, w(60) + 26);
      for (let x = 60; x >= -100; x -= 8) c.lineTo(x, w(x) + (10 + (x + 100) * 0.12));
      c.closePath();
    },
    under() {}, over() {},
    anchors() { return { eye: [78, -20], mouth: [104, 4], top: [70, -40], tail: [-96, 0], belly: [20, 28], chin: [90, 16], back: [-20, -28], R: 104 }; }
  };
  S.crab = {
    body(c) { A.ellipse(c, 0, 12, 66, 40); },
    under(c, col, h, t) {
      c.lineWidth = 7; c.strokeStyle = SILMODE ? SIL : OL; c.lineCap = 'round';
      for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) { const k = Math.sin((t || 0) * 8 + i) * 4; c.beginPath(); c.moveTo(sx * (30 + i * 12), 36); c.lineTo(sx * (55 + i * 14), 62 + k); c.lineTo(sx * (60 + i * 14), 78 + k); c.stroke(); }
      for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 50, 0); c.quadraticCurveTo(sx * 80, -30, sx * 88, -40); c.lineWidth = 10; c.stroke(); A.ellipse(c, sx * 92, -52, 22, 16, sx * 0.4); fs(c, col, 4); c.beginPath(); c.moveTo(sx * 92, -52); c.lineTo(sx * 112, -66); stroke(c, 4); }
      for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 14, -20); c.lineTo(sx * 18, -46); stroke(c, 5); }
    },
    over() {},
    anchors() { return { eye: [18, -50], eye2: [-18, -50], mouth: [0, 30], top: [0, -54], tail: [-60, 10], belly: [0, 50], chin: [20, 30], back: [-30, -10], R: 90, noFlipEye: true }; }
  };
  S.frog = {
    body(c) { c.beginPath(); c.moveTo(-60, 20); c.bezierCurveTo(-70, -30, 40, -50, 70, -10); c.bezierCurveTo(90, 10, 60, 45, 0, 45); c.bezierCurveTo(-40, 45, -60, 40, -60, 20); c.closePath(); },
    under(c, col) { c.beginPath(); c.moveTo(-50, 30); c.quadraticCurveTo(-100, 40, -90, 60); c.quadraticCurveTo(-60, 60, -30, 45); fs(c, A.shade(col, -0.15), 4); c.beginPath(); c.moveTo(30, 40); c.quadraticCurveTo(40, 70, 60, 62); fs(c, A.shade(col, -0.15), 4); },
    over(c, col) { for (const ex of [20, 52]) { A.circle(c, ex, -38, 17); fs(c, col, 4); } c.beginPath(); c.moveTo(40, 12); c.quadraticCurveTo(62, 22, 80, 4); stroke(c, 3); },
    anchors() { return { eye: [52, -40], eye2: [20, -42], mouth: [70, 10], top: [36, -56], tail: [-70, 20], belly: [0, 45], chin: [60, 26], back: [-20, -24], R: 80, bigEyes: true }; }
  };
  S.leech = {
    body(c, t) { c.beginPath(); const y = (x) => Math.sin(x * 0.03 + (t || 0) * 3) * 12; c.moveTo(-90, y(-90)); for (let x = -90; x <= 90; x += 10) c.lineTo(x, y(x) - 18); c.arc(90, y(90), 18, -Math.PI / 2, Math.PI / 2); for (let x = 90; x >= -90; x -= 10) c.lineTo(x, y(x) + 18); c.arc(-90, y(-90), 18, Math.PI / 2, Math.PI * 1.5); c.closePath(); },
    under() {}, over(c, col) { c.strokeStyle = SILMODE ? SIL : A.shade(col, -0.3); c.lineWidth = 2.5; for (let x = -70; x < 90; x += 20) { c.beginPath(); c.moveTo(x, -14); c.lineTo(x, 14); c.stroke(); } },
    anchors() { return { eye: [86, -6], mouth: [104, 4], top: [70, -22], tail: [-100, 0], belly: [0, 20], chin: [90, 10], back: [0, -18], R: 100 }; }
  };
  S.octo = {
    body(c) { c.beginPath(); c.moveTo(-40, 20); c.bezierCurveTo(-60, -80, 80, -90, 76, -10); c.bezierCurveTo(74, 20, 40, 30, 20, 26); c.closePath(); },
    under(c, col, h, t) {
      for (let i = 0; i < 6; i++) {
        const bx = -30 + i * 14, w = Math.sin((t || 0) * 3 + i) * 10;
        c.beginPath(); c.moveTo(bx, 18); c.bezierCurveTo(bx - 20, 50 + w, bx - 60 - i * 6, 40 - w, bx - 80 - i * 4, 60 + w * 1.5);
        c.lineWidth = 14 - i; c.strokeStyle = SILMODE ? SIL : OL; c.stroke(); c.lineWidth = 9 - i; c.strokeStyle = pf(A.shade(col, -0.1)); c.stroke();
      }
    },
    over(c, col) { if (SILMODE) return; c.fillStyle = A.shade(col, 0.25); for (const [x, y, r] of [[0, -40, 8], [30, -55, 6], [50, -30, 7]]) { A.circle(c, x, y, r); c.fill(); } },
    anchors() { return { eye: [48, -18], mouth: [70, 6], top: [18, -72], tail: [-90, 40], belly: [10, 30], chin: [60, 14], back: [-20, -50], R: 90 }; }
  };
  S.dolphin = {
    body(c) { c.beginPath(); c.moveTo(104, 6); c.lineTo(86, -2); c.bezierCurveTo(60, -40, -40, -44, -74, -6); c.lineTo(-100, -30); c.lineTo(-92, 0); c.lineTo(-100, 30); c.lineTo(-74, 6); c.bezierCurveTo(-40, 36, 60, 34, 86, 10); c.closePath(); },
    under(c, col) { c.beginPath(); c.moveTo(-10, -34); c.quadraticCurveTo(-4, -76, -40, -64); c.lineTo(-34, -32); fs(c, A.shade(col, -0.15), 3.5); },
    over(c, col) { A.ellipse(c, 20, 18, 18, 7, 0.5); fs(c, A.shade(col, -0.15), 3); },
    anchors() { return { eye: [62, -12], mouth: [100, 8], top: [-20, -66], tail: [-92, 0], belly: [0, 32], chin: [80, 14], back: [-40, -30], R: 104 }; }
  };
  S.can = {
    body(c) { A.rr(c, -60, -42, 130, 84, 16); c.moveTo(-60, -10); c.lineTo(-98, -36); c.lineTo(-98, 36); c.lineTo(-60, 10); },
    under() {},
    over(c, col, h) { c.save(); A.rr(c, -60, -42, 130, 84, 16); c.clip(); c.fillStyle = pf(h); c.fillRect(-60, -16, 130, 32); c.restore(); c.strokeStyle = SILMODE ? SIL : A.shade(col, -0.3); c.lineWidth = 3; for (const y of [-34, 34]) { c.beginPath(); c.moveTo(-56, y); c.lineTo(66, y); c.stroke(); } },
    anchors() { return { eye: [46, -26], mouth: [60, 22], top: [10, -44], tail: [-94, 0], belly: [0, 42], chin: [50, 30], back: [-30, -40], R: 90 }; }
  };
  S.usb = {
    body(c) { A.rr(c, -60, -30, 120, 60, 10); c.moveTo(-60, -8); c.lineTo(-96, -30); c.lineTo(-96, 30); c.lineTo(-60, 8); },
    under() {},
    over(c) { A.rr(c, 60, -20, 36, 40, 3); fs(c, '#c9ccd0', 4); if (!SILMODE) { c.fillStyle = '#5a5f66'; c.fillRect(70, -12, 8, 8); c.fillRect(82, -12, 8, 8); } },
    anchors() { return { eye: [30, -10], mouth: [50, 14], top: [0, -32], tail: [-92, 0], belly: [0, 30], chin: [40, 20], back: [-30, -28], R: 96 }; }
  };
  S.seahorse = {
    body(c) { c.beginPath(); c.moveTo(20, -70); c.bezierCurveTo(60, -80, 70, -50, 50, -40); c.lineTo(86, -34); c.lineTo(84, -22); c.lineTo(46, -24); c.bezierCurveTo(30, -10, 50, 30, 20, 50); c.bezierCurveTo(0, 70, -30, 60, -20, 40); c.bezierCurveTo(-10, 30, 0, 40, 4, 30); c.bezierCurveTo(-20, 0, -10, -60, 20, -70); c.closePath(); },
    under(c, col) { c.beginPath(); c.moveTo(-6, -30); c.lineTo(-30, -20); c.lineTo(-10, -4); fs(c, A.shade(col, -0.2), 3); },
    over(c, col) { if (SILMODE) return; c.strokeStyle = A.shade(col, -0.25); c.lineWidth = 2; for (let y = -50; y < 40; y += 12) { c.beginPath(); c.moveTo(0, y); c.lineTo(30, y + 4); c.stroke(); } },
    anchors() { return { eye: [40, -54], mouth: [86, -28], top: [30, -78], tail: [-20, 50], belly: [20, 20], chin: [60, -24], back: [0, -40], R: 90 }; }
  };
  S.whale = {
    body(c) { c.beginPath(); c.moveTo(100, 10); c.bezierCurveTo(100, -60, -10, -66, -70, -14); c.lineTo(-104, -36); c.lineTo(-92, 0); c.lineTo(-104, 30); c.lineTo(-70, 14); c.bezierCurveTo(-20, 56, 90, 60, 100, 10); c.closePath(); },
    under(c, col) { c.beginPath(); c.moveTo(20, 40); c.quadraticCurveTo(10, 70, -16, 70); c.quadraticCurveTo(-6, 50, 0, 40); fs(c, A.shade(col, -0.15), 3.5); },
    over(c, col, h) { c.save(); S.whale.body(c); c.clip(); c.fillStyle = pf(h); A.ellipse(c, 40, 46, 70, 24); c.fill(); c.restore(); c.beginPath(); c.moveTo(60, 22); c.quadraticCurveTo(84, 26, 98, 16); stroke(c, 3); },
    anchors() { return { eye: [70, -10], mouth: [98, 16], top: [30, -56], tail: [-96, 0], belly: [30, 50], chin: [80, 30], back: [-20, -44], R: 104 }; }
  };
  S.seal = {
    body(c) { c.beginPath(); c.moveTo(100, -4); c.bezierCurveTo(100, -40, 30, -46, -40, -20); c.bezierCurveTo(-80, -8, -96, 0, -100, -20); c.lineTo(-96, 14); c.bezierCurveTo(-60, 30, 40, 40, 90, 20); c.closePath(); },
    under(c, col) { c.beginPath(); c.moveTo(30, 26); c.quadraticCurveTo(20, 56, 0, 54); c.lineTo(10, 24); fs(c, A.shade(col, -0.15), 3.5); },
    over(c) { if (SILMODE) return; c.strokeStyle = OL; c.lineWidth = 2; for (const a of [-0.2, 0, 0.2]) { c.beginPath(); c.moveTo(94, 4); c.lineTo(114, 4 + a * 30); c.stroke(); } A.circle(c, 100, -2, 5); c.fillStyle = OL; c.fill(); },
    anchors() { return { eye: [76, -18], mouth: [98, 8], top: [40, -40], tail: [-96, -4], belly: [20, 34], chin: [80, 16], back: [-20, -24], R: 104 }; }
  };
  S.penguin = {
    body(c) { A.ellipse(c, 0, 0, 92, 40, 0); },
    under(c) { c.beginPath(); c.moveTo(-20, 30); c.quadraticCurveTo(-40, 64, -64, 60); c.lineTo(-30, 30); fs(c, '#1d222b', 3.5); },
    over(c, col, h) { c.save(); A.ellipse(c, 0, 0, 92, 40); c.clip(); c.fillStyle = pf(h); A.ellipse(c, 10, 22, 80, 26); c.fill(); c.restore(); c.beginPath(); c.moveTo(88, -6); c.lineTo(112, 0); c.lineTo(88, 6); fs(c, '#f0a020', 3); },
    anchors() { return { eye: [66, -12], mouth: [100, 0], top: [20, -40], tail: [-92, 0], belly: [10, 40], chin: [80, 12], back: [-30, -34], R: 104 }; }
  };
  S.mammoth = {
    body(c) { c.beginPath(); c.moveTo(70, -30); c.bezierCurveTo(60, -80, -80, -80, -90, -10); c.bezierCurveTo(-96, 30, -40, 50, 10, 46); c.bezierCurveTo(60, 44, 84, 20, 70, -30); c.closePath(); },
    under(c, col, h, t) { for (const lx of [-60, -20, 20]) { const k = Math.sin((t || 0) * 5 + lx) * 8; A.rr(c, lx, 30 + k * 0.3, 22, 36, 8); fs(c, A.shade(col, -0.15), 4); } },
    over(c, col, h, t) { c.beginPath(); c.moveTo(70, -10); c.bezierCurveTo(100, 0, 104, 40, 90 + Math.sin((t || 0) * 3) * 6, 60); stroke(c, 16); c.strokeStyle = pf(col); c.lineWidth = 10; c.stroke(); c.beginPath(); c.moveTo(66, 10); c.bezierCurveTo(90, 30, 110, 10, 112, -6); c.lineWidth = 9; c.strokeStyle = SILMODE ? SIL : OL; c.stroke(); c.lineWidth = 6; c.strokeStyle = pf('#f5efe0'); c.stroke(); },
    anchors() { return { eye: [50, -30], mouth: [80, 4], top: [0, -72], tail: [-92, 0], belly: [0, 46], chin: [70, 10], back: [-40, -56], R: 100 }; }
  };
  S.turtle = {
    body(c) { c.beginPath(); c.moveTo(-70, 10); c.bezierCurveTo(-70, -70, 60, -70, 60, 10); c.closePath(); },
    under(c, col, h, t) { const k = Math.sin((t || 0) * 4) * 8; for (const [x, y, r] of [[-50, 20, 0.6], [40, 20, -0.6]]) { A.ellipse(c, x, y + k, 30, 12, r); fs(c, A.shade(h, 0), 4); } A.ellipse(c, 80, -4, 26, 20); fs(c, h, 4); A.rr(c, -72, 4, 136, 16, 8); fs(c, A.shade(h, -0.2), 4); },
    over(c, col) { if (SILMODE) return; c.strokeStyle = A.shade(col, -0.35); c.lineWidth = 3; for (const [x, y] of [[-30, -30], [10, -40], [-10, -10], [30, -12]]) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; c.lineTo(x + Math.cos(a) * 15, y + Math.sin(a) * 13); } c.closePath(); c.stroke(); } },
    anchors() { return { eye: [88, -10], mouth: [104, 2], top: [0, -60], tail: [-80, 10], belly: [0, 22], chin: [96, 6], back: [-30, -40], R: 104 }; }
  };
  S.shark = {
    body(c) { c.beginPath(); c.moveTo(104, 4); c.bezierCurveTo(80, -36, -30, -40, -70, -8); c.lineTo(-100, -50); c.quadraticCurveTo(-90, 0, -96, 30); c.lineTo(-70, 8); c.bezierCurveTo(-30, 34, 70, 34, 104, 4); c.closePath(); },
    under(c, col) { c.beginPath(); c.moveTo(-6, -34); c.lineTo(-30, -84); c.lineTo(-40, -30); fs(c, A.shade(col, -0.15), 3.5); c.beginPath(); c.moveTo(20, 24); c.lineTo(0, 58); c.lineTo(-10, 22); fs(c, A.shade(col, -0.15), 3.5); },
    over(c, col, h) { c.save(); S.shark.body(c); c.clip(); c.fillStyle = pf(h); A.ellipse(c, 30, 30, 80, 16); c.fill(); c.restore(); if (!SILMODE) { c.strokeStyle = OL; c.lineWidth = 2.5; for (const x of [40, 48, 56]) { c.beginPath(); c.moveTo(x, -8); c.quadraticCurveTo(x - 4, 2, x, 12); c.stroke(); } c.beginPath(); c.moveTo(76, 12); c.lineTo(100, 8); c.stroke(); c.fillStyle = '#fff'; for (let x = 80; x < 100; x += 5) { c.beginPath(); c.moveTo(x, 11); c.lineTo(x + 2.5, 16); c.lineTo(x + 5, 10.5); c.fill(); } } },
    anchors() { return { eye: [72, -10], mouth: [100, 8], top: [-30, -84], tail: [-96, 0], belly: [20, 30], chin: [86, 14], back: [-20, -30], R: 104 }; }
  };
  S.shrimp = {
    body(c) { c.beginPath(); c.moveTo(80, -10); c.bezierCurveTo(60, -60, -60, -50, -70, 10); c.bezierCurveTo(-60, 30, -40, 20, -30, 10); c.bezierCurveTo(-20, -20, 50, -20, 60, 20); c.closePath(); },
    under(c, col) { c.beginPath(); c.moveTo(-70, 10); c.lineTo(-96, 24); c.lineTo(-80, 40); c.lineTo(-62, 26); fs(c, A.shade(col, -0.1), 3); for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-10 + i * 14, 6); c.lineTo(-14 + i * 14, 26); stroke(c, 3); } },
    over(c, col) { c.beginPath(); c.moveTo(80, -10); c.quadraticCurveTo(110, -60, 120, -70); stroke(c, 2.5); c.beginPath(); c.moveTo(80, -10); c.quadraticCurveTo(116, -36, 126, -40); stroke(c, 2.5); if (!SILMODE) { c.strokeStyle = A.shade(col, -0.25); c.lineWidth = 2; for (let x = -40; x < 60; x += 16) { c.beginPath(); c.arc(x, -6, 24, -2.2, -1.2); c.stroke(); } } },
    anchors() { return { eye: [66, -20], mouth: [84, -4], top: [10, -44], tail: [-86, 26], belly: [10, 10], chin: [70, 6], back: [-30, -30], R: 100 }; }
  };
  S.lobster = {
    body(c) { c.beginPath(); c.moveTo(70, -6); c.bezierCurveTo(70, -36, -40, -34, -70, -6); c.lineTo(-100, -24); c.lineTo(-100, 24); c.lineTo(-70, 6); c.bezierCurveTo(-40, 34, 70, 30, 70, -6); c.closePath(); },
    under(c, col, h, t) { const k = Math.sin((t || 0) * 5) * 0.15; for (const sy of [-1, 1]) { c.beginPath(); c.moveTo(56, sy * 14); c.quadraticCurveTo(80, sy * 40, 96, sy * 30); stroke(c, 8); A.ellipse(c, 104, sy * 34, 18, 11, sy * (0.3 + k)); fs(c, col, 4); } },
    over(c, col) { c.beginPath(); c.moveTo(70, -10); c.quadraticCurveTo(110, -70, 130, -60); stroke(c, 2.5); if (!SILMODE) { c.strokeStyle = A.shade(col, -0.3); c.lineWidth = 2.5; for (let x = -50; x < 40; x += 18) { c.beginPath(); c.moveTo(x, -26); c.lineTo(x, 26); c.stroke(); } } },
    anchors() { return { eye: [56, -22], mouth: [72, 0], top: [0, -32], tail: [-96, 0], belly: [0, 28], chin: [64, 10], back: [-30, -26], R: 110 }; }
  };
  S.ghost = {
    body(c, t) { const w = Math.sin((t || 0) * 3) * 6; c.beginPath(); c.moveTo(80, 10); c.bezierCurveTo(90, -70, -20, -70, -30, -10); c.bezierCurveTo(-50, 10, -70, -10 + w, -100, 10 + w); c.bezierCurveTo(-70, 30, -60, 20, -40, 36 - w); c.bezierCurveTo(-20, 50, 0, 30, 20, 46 + w); c.bezierCurveTo(40, 56, 60, 30, 80, 10); c.closePath(); },
    under() {}, over() {},
    anchors() { return { eye: [50, -20], eye2: [20, -22], mouth: [40, 4], top: [30, -60], tail: [-96, 10], belly: [20, 40], chin: [60, 16], back: [-10, -40], R: 96, ghostEyes: true }; }
  };
  S.ray = {
    body(c, t) { const w = Math.sin((t || 0) * 3) * 10; c.beginPath(); c.moveTo(90, 0); c.quadraticCurveTo(10, -70 - w, -40, -60 - w); c.quadraticCurveTo(-30, 0, -40, 60 + w); c.quadraticCurveTo(10, 70 + w, 90, 0); c.closePath(); },
    under(c) { c.beginPath(); c.moveTo(-36, 0); c.quadraticCurveTo(-80, 10, -110, 0); stroke(c, 5); },
    over() {},
    anchors() { return { eye: [50, -12], eye2: [50, 12], mouth: [80, 0], top: [0, -54], tail: [-100, 0], belly: [0, 54], chin: [70, 6], back: [-10, -30], R: 100 }; }
  };
  S.phoenix = {
    body(c) { S.fish.body(c, 0.36); },
    under(c, col, h, t) {
      const f = Math.sin((t || 0) * 8) * 6;
      for (const [y0, dir] of [[-20, -1], [10, 1]]) {
        c.beginPath(); c.moveTo(10, y0); c.bezierCurveTo(-20, y0 + dir * (60 + f), -60, y0 + dir * (70 + f), -70, y0 + dir * (40 + f)); c.bezierCurveTo(-40, y0 + dir * 40, -30, y0 + dir * 20, 10, y0);
        fs(c, SILMODE ? SIL : A.lg(c, 0, y0, 0, y0 + dir * 70, ['#ffd04a', '#ff6a2a', '#c9302c']), 3.5);
      }
    },
    over(c) { S.fish.over(c, '#ff6a2a', 0.36); },
    anchors() { return S.fish.anchors(0.36); }
  };
  S.kraken = {
    body(c) { c.beginPath(); c.moveTo(-10, 40); c.bezierCurveTo(-60, -90, 110, -110, 100, 0); c.bezierCurveTo(98, 40, 50, 50, 30, 46); c.closePath(); },
    under(c, col, h, t) {
      for (let i = 0; i < 8; i++) {
        const bx = -10 + i * 13, w = Math.sin((t || 0) * 2 + i * 0.9) * 16;
        c.beginPath(); c.moveTo(bx, 36);
        c.bezierCurveTo(bx - 30, 80 + w, bx - 80 - i * 6, 60 - w, bx - 110 - i * 3, 90 + w * 1.4);
        c.lineWidth = 24 - i * 1.5; c.strokeStyle = SILMODE ? SIL : OL; c.stroke();
        c.lineWidth = 17 - i * 1.5; c.strokeStyle = pf(i % 2 ? col : A.shade(col, -0.12)); c.stroke();
        if (!SILMODE) { c.fillStyle = h; for (let k = 1; k < 4; k++) { const tt = k / 4; const px = bx + (bx - 110 - i * 3 - bx) * tt, py = 36 + (90 - 36) * tt + w * tt; A.circle(c, px, py + 4, 3.5 - i * 0.2); c.fill(); } }
      }
    },
    over(c, col, h, t) {
      if (SILMODE) return;
      c.fillStyle = A.shade(col, 0.25);
      for (const [x, y, r] of [[20, -50, 9], [50, -66, 7], [70, -36, 8], [0, -20, 6]]) { A.circle(c, x, y, r); c.fill(); }
      const g = 0.6 + 0.4 * Math.sin((t || 0) * 3);
      A.circle(c, 70, -10, 18); c.fillStyle = A.rg(c, 70, -10, 2, 18, ['#fff6a0', '#ffb020', '#c94a0a']); c.fill(); stroke(c, 4);
      c.fillStyle = '#1a0510'; A.ellipse(c, 70, -10, 4, 14 * g); c.fill();
    },
    anchors() { return { eye: [70, -10], mouth: [96, 20], top: [40, -86], tail: [-100, 80], belly: [30, 46], chin: [86, 30], back: [0, -60], R: 120, noEye: true }; }
  };

  // ------------------- DESENLER -------------------
  const PAT = {
    plain() {},
    stripes(c, a, b) { c.fillStyle = A.alpha(b, 0.55); for (let x = -100; x < 110; x += 26) { c.beginPath(); c.moveTo(x, -120); c.lineTo(x + 12, -120); c.lineTo(x + 2, 120); c.lineTo(x - 10, 120); c.fill(); } },
    bands(c, a, b) { c.fillStyle = b; for (const x of [-46, 10, 62]) { c.fillRect(x, -120, 16, 240); } c.strokeStyle = OL; c.lineWidth = 3; for (const x of [-46, 10, 62]) { c.strokeRect(x, -120, 16, 240); } },
    spots(c, a, b, r) { c.fillStyle = A.alpha(b, 0.65); for (let i = 0; i < 14; i++) { A.circle(c, -80 + r() * 170, -60 + r() * 120, 4 + r() * 7); c.fill(); } },
    scales(c, a) { c.strokeStyle = A.alpha(A.shade(a, -0.4), 0.55); c.lineWidth = 2; for (let y = -60; y < 70; y += 14) for (let x = -70 + (y % 28 ? 7 : 0); x < 90; x += 14) { c.beginPath(); c.arc(x, y, 8, 0.2, Math.PI - 0.2); c.stroke(); } },
    camo(c, a, b, r) { for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? A.alpha(b, 0.7) : A.alpha(A.shade(a, 0.25), 0.6); A.ellipse(c, -80 + r() * 170, -50 + r() * 100, 12 + r() * 18, 8 + r() * 10, r() * 3); c.fill(); } },
    glow(c, a, b) { c.fillStyle = A.rg(c, 20, 0, 5, 90, [A.alpha(b, 0), A.alpha('#eaff8a', 0.55)]); c.fillRect(-110, -110, 220, 220); },
    neon(c, a, b) { c.strokeStyle = b; c.lineWidth = 5; c.shadowColor = b; c.shadowBlur = 10; for (let y = -30; y <= 30; y += 20) { c.beginPath(); c.moveTo(-80, y); c.quadraticCurveTo(0, y - 12, 90, y); c.stroke(); } c.shadowBlur = 0; },
    mirror(c, a, b) { for (let y = -80; y < 80; y += 14) for (let x = -80; x < 90; x += 14) { c.fillStyle = (x + y) % 28 === 0 ? '#ffffff' : (x * 7 + y) % 3 === 0 ? b : A.shade(a, -0.2); c.fillRect(x, y, 12, 12); } },
    stars(c, a, b, r) { const list = []; for (let i = 0; i < 12; i++) list.push([-80 + r() * 170, -50 + r() * 100, r() * 6, 5 + r() * 4]); A.sparkles(c, list, 0, b); },
    ghost(c, a, b) { c.fillStyle = A.alpha(b, 0.35); c.fillRect(-110, -110, 220, 220); },
    fur(c, a) { c.strokeStyle = A.alpha(A.shade(a, -0.35), 0.6); c.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = -90 + (i * 37) % 180, y = -60 + ((i * 53) % 120); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y + 9); c.stroke(); } },
    plates(c, a, b) { c.strokeStyle = A.shade(a, -0.4); c.lineWidth = 2.5; for (let x = -60; x < 90; x += 30) { c.beginPath(); c.moveTo(x, -60); c.lineTo(x, 60); c.stroke(); } c.fillStyle = A.shade(a, 0.3); for (let x = -55; x < 90; x += 30) for (const y of [-20, 15]) { A.circle(c, x, y, 2.5); c.fill(); } },
    bolts(c) { c.fillStyle = '#c9ccd0'; c.strokeStyle = OL; c.lineWidth = 2; for (const [x, y] of [[-40, -20], [0, 20], [30, -25], [60, 10]]) { A.circle(c, x, y, 6); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.stroke(); } },
    oil(c, a, b) { c.fillStyle = A.lg(c, -100, -60, 100, 60, [A.alpha('#5fd3ff', 0.35), A.alpha(b, 0.45), A.alpha('#ffd04a', 0.3), A.alpha('#3cff6c', 0.3)]); c.fillRect(-110, -110, 220, 220); },
    rim(c, a, b) { c.strokeStyle = b; c.lineWidth = 6; A.ellipse(c, 0, 0, 88, 22); c.stroke(); },
    flames(c) { for (let x = -90; x < 90; x += 22) { c.beginPath(); c.moveTo(x, 60); c.quadraticCurveTo(x + 4, 10, x + 11, -10); c.quadraticCurveTo(x + 16, 20, x + 22, 60); c.fillStyle = 'rgba(255,208,74,0.55)'; c.fill(); } },
    crispy(c, a) { c.fillStyle = A.alpha(A.shade(a, -0.4), 0.45); for (let i = 0; i < 30; i++) { A.circle(c, -80 + (i * 41) % 170, -50 + (i * 29) % 100, 3); c.fill(); } },
    cracks(c) { c.strokeStyle = '#ff6a2a'; c.lineWidth = 3; c.shadowColor = '#ff6a2a'; c.shadowBlur = 8; for (const p of [[[-60, -20], [-40, 0], [-50, 20]], [[0, -30], [10, -5], [-5, 15], [10, 30]], [[40, -10], [60, 5]]]) { c.beginPath(); p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); } c.shadowBlur = 0; },
    lava(c) { c.strokeStyle = '#ff6a2a'; c.lineWidth = 4; for (const p of [[[-50, -40], [-20, -30], [0, -50]], [[-30, -10], [10, -20], [40, -5]]]) { c.beginPath(); p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); } },
    glass(c) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(-40, -50); c.lineTo(-10, -55); c.lineTo(-50, -10); c.fill(); c.fillStyle = 'rgba(160,140,255,0.3)'; c.beginPath(); c.moveTo(20, -40); c.lineTo(40, -44); c.lineTo(0, 0); c.fill(); },
    map(c) { c.strokeStyle = '#7a3a1a'; c.lineWidth = 2.5; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(-40, 20); c.quadraticCurveTo(0, -40, 40, 0); c.stroke(); c.setLineDash([]); c.lineWidth = 4; c.beginPath(); c.moveTo(34, -6); c.lineTo(46, 6); c.moveTo(46, -6); c.lineTo(34, 6); c.stroke(); },
    split(c, a, b) { c.fillStyle = b; c.fillRect(-110, 0, 220, 110); },
    glitch(c, a, b, r) { for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? A.alpha(b, 0.8) : A.alpha('#ffffff', 0.5); c.fillRect(-90 + r() * 170, -50 + r() * 100, 10 + r() * 30, 4 + r() * 6); } },
    ice(c) { c.fillStyle = 'rgba(255,255,255,0.45)'; for (const [x, y] of [[-40, -20], [10, -30], [40, 10]]) { c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + 8, y); c.lineTo(x, y + 14); c.lineTo(x - 8, y); c.fill(); } }
  };

  // ------------------- AKSESUARLAR -------------------
  const ACC = {};
  const hat = (c, x, y, w, h, col, brim) => { A.rr(c, x - w / 2, y - h, w, h, 6); fs(c, col, 3.5); if (brim) { A.rr(c, x - w / 2 - brim, y - 6, w + brim * 2, 8, 4); fs(c, A.shade(col, -0.15), 3.5); } };
  ACC.badge = (c, a) => { A.rr(c, a.belly[0] - 2, a.belly[1] - 40, 24, 18, 3); fs(c, '#ffffff', 2.5); if (!SILMODE) { c.fillStyle = '#3d8fe0'; c.fillRect(a.belly[0] + 1, a.belly[1] - 37, 18, 5); } };
  ACC.cap = (c, a) => { const [x, y] = a.top; c.beginPath(); c.arc(x + 20, y + 10, 26, Math.PI, 0); fs(c, '#3d8fe0', 3.5); c.beginPath(); c.moveTo(x + 40, y + 8); c.lineTo(x + 66, y + 12); c.lineTo(x + 44, y + 16); fs(c, '#2a6ab0', 3); };
  ACC.tie = (c, a) => { const [x, y] = a.chin; c.beginPath(); c.moveTo(x - 6, y - 4); c.lineTo(x + 6, y - 4); c.lineTo(x + 3, y + 4); c.lineTo(x + 8, y + 30); c.lineTo(x, y + 38); c.lineTo(x - 8, y + 30); c.lineTo(x - 3, y + 4); c.closePath(); fs(c, '#c9302c', 3); };
  ACC.glasses = (c, a) => { const [x, y] = a.eye; c.lineWidth = 3.5; c.strokeStyle = SILMODE ? SIL : OL; A.circle(c, x, y, 13); c.stroke(); A.circle(c, x + 28, y + 2, 11); c.stroke(); c.beginPath(); c.moveTo(x + 13, y); c.lineTo(x + 17, y); c.stroke(); };
  ACC.greenglasses = (c, a) => { const [x, y] = a.eye; A.rr(c, x - 16, y - 8, 46, 16, 5); fs(c, SILMODE ? SIL : '#1a3a1a', 3); if (!SILMODE) { c.fillStyle = '#3cff6c'; c.font = 'bold 9px monospace'; c.fillText('101', x - 12, y + 4); } };
  ACC.nightcap = (c, a) => { const [x, y] = a.top; c.beginPath(); c.moveTo(x - 20, y + 10); c.quadraticCurveTo(x + 10, y - 50, x - 50, y - 40); c.quadraticCurveTo(x + 20, y - 20, x + 34, y + 10); c.closePath(); fs(c, '#6f9bd1', 3.5); A.circle(c, x - 52, y - 40, 9); fs(c, '#ffffff', 3); };
  ACC.mustache = (c, a) => { const [x, y] = a.mouth; c.beginPath(); c.moveTo(x - 6, y - 6); c.quadraticCurveTo(x - 20, y + 6, x - 34, y - 2); c.quadraticCurveTo(x - 20, y - 14, x - 6, y - 6); fs(c, '#3a2a1a', 2.5); };
  ACC.bigmustache = (c, a) => { const [x, y] = a.mouth; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x - 4, y - 4); c.bezierCurveTo(x - 20, y + d * 30 - 4, x - 46, y + d * 20, x - 54, y + d * 30); c.bezierCurveTo(x - 40, y + d * 8, x - 24, y - 2, x - 4, y - 4); fs(c, '#e8e0d0', 3); } };
  ACC.angry = (c, a) => { for (const e of [a.eye, a.eye2].filter(Boolean)) { c.beginPath(); c.moveTo(e[0] - 12, e[1] - 18); c.lineTo(e[0] + 10, e[1] - 10); stroke(c, 5); } };
  ACC.clownnose = (c, a) => { A.circle(c, a.mouth[0] - 2, a.mouth[1] - 6, 9); fs(c, '#e0453d', 3); };
  ACC.tea = (c, a) => { const [x, y] = a.top; c.beginPath(); c.moveTo(x - 12, y - 4); c.lineTo(x - 8, y - 44); c.quadraticCurveTo(x, y - 30, x + 8, y - 44); c.lineTo(x + 12, y - 4); c.closePath(); fs(c, SILMODE ? SIL : 'rgba(255,240,220,0.8)', 3); if (!SILMODE) { c.fillStyle = '#b8401a'; c.fillRect(x - 9, y - 30, 18, 24); } };
  ACC.wings = (c, a, t) => { const f = Math.sin((t || 0) * 10) * 10; const [x, y] = a.back; c.beginPath(); c.moveTo(x + 20, y + 10); c.quadraticCurveTo(x - 10, y - 60 - f, x - 50, y - 50 - f); c.quadraticCurveTo(x - 30, y - 20, x - 10, y + 10); fs(c, '#ffffff', 3.5); };
  ACC.simit = (c, a) => { const [x, y] = a.mouth; A.circle(c, x + 10, y + 6, 14); fs(c, '#c98a3a', 3); A.circle(c, x + 10, y + 6, 5); c.fillStyle = SILMODE ? 'rgba(0,0,0,0)' : '#f0d8a0'; c.fill(); };
  ACC.curlers = (c, a) => { const [x, y] = a.top; for (const dx of [-20, 0, 20]) { A.rr(c, x + dx - 7, y - 16, 14, 16, 4); fs(c, '#ff8ab8', 3); } };
  ACC.earrings = (c, a) => { const [x, y] = a.eye; A.circle(c, x - 18, y + 24, 6); fs(c, '#f0c040', 2.5); };
  ACC.whiskers = (c, a) => { const [x, y] = a.mouth; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x + 10, y + d * 20, x - 10, y + d * 40); stroke(c, 3); } };
  ACC.fly = (c, a, t) => { const [x, y] = a.mouth; const k = Math.sin((t || 0) * 20) * 4; A.circle(c, x + 30, y - 30 + k, 5); fs(c, '#2a2a2a', 2); A.ellipse(c, x + 26, y - 38 + k, 6, 3, 0.5); fill(c, 'rgba(255,255,255,0.7)'); };
  ACC.leaf = (c, a) => { const [x, y] = a.top; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 30, y - 40, x + 6, y - 50); c.quadraticCurveTo(x + 20, y - 20, x, y); fs(c, '#5fb050', 3); };
  ACC.sleepy = (c, a) => { if (SILMODE) return; c.fillStyle = OL; c.font = 'bold 20px sans-serif'; c.fillText('z', a.top[0] + 30, a.top[1] - 10); c.font = 'bold 14px sans-serif'; c.fillText('z', a.top[0] + 44, a.top[1] - 24); };
  ACC.headband = (c, a) => { const [x, y] = a.eye; A.rr(c, x - 40, y - 26, 70, 9, 3); fs(c, '#c9302c', 3); c.beginPath(); c.moveTo(x - 40, y - 22); c.lineTo(x - 64, y - 30); c.lineTo(x - 60, y - 14); fs(c, '#c9302c', 3); };
  ACC.raincloud = (c, a) => { const [x, y] = a.top; c.save(); c.translate(x - 20, y - 40); c.scale(0.4, 0.4); c.beginPath(); c.arc(0, 0, 40, Math.PI * 0.5, Math.PI * 1.5); c.arc(50, -20, 45, Math.PI, 0); c.arc(100, 0, 40, Math.PI * 1.5, Math.PI * 0.5); c.closePath(); fs(c, '#8a8ea0', 6); c.restore(); if (!SILMODE) { c.strokeStyle = '#5fb0e0'; c.lineWidth = 2; for (const dx of [-10, 6, 22]) { c.beginPath(); c.moveTo(x + dx, y - 26); c.lineTo(x + dx - 3, y - 14); c.stroke(); } } };
  ACC.zen = (c, a) => { if (SILMODE) return; c.strokeStyle = 'rgba(255,220,120,0.8)'; c.lineWidth = 3; A.ellipse(c, a.top[0], a.top[1] - 16, 26, 7); c.stroke(); };
  ACC.humps = (c, a) => { for (const x of [-60, -20]) { c.beginPath(); c.arc(x, -10, 18, Math.PI, 0); fs(c, '#2e5e46', 3.5); } };
  ACC.witchhat = (c, a) => { const [x, y] = a.top; c.beginPath(); c.moveTo(x - 30, y + 6); c.lineTo(x + 6, y - 66); c.lineTo(x + 34, y + 6); c.closePath(); fs(c, '#2a1a3a', 3.5); A.rr(c, x - 44, y, 90, 10, 5); fs(c, '#2a1a3a', 3.5); if (!SILMODE) { c.fillStyle = '#9fd36a'; c.fillRect(x - 22, y - 8, 46, 6); } };
  ACC.bolt = (c, a) => { const [x, y] = a.top; c.beginPath(); c.moveTo(x - 6, y + 4); c.lineTo(x - 6, y - 20); c.lineTo(x + 6, y - 20); c.lineTo(x + 6, y + 4); fs(c, '#c9ccd0', 3); A.rr(c, x - 12, y - 28, 24, 10, 2); fs(c, '#9aa7b2', 3); };
  ACC.label = (c, a) => { if (SILMODE) return; c.fillStyle = '#fff'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillText('TON', 4, 6); c.textAlign = 'left'; };
  ACC.wifi = (c, a) => { const [x, y] = a.top; c.lineWidth = 4; c.strokeStyle = SILMODE ? SIL : '#3d8fe0'; for (const r of [10, 20, 30]) { c.beginPath(); c.arc(x, y - 4, r, Math.PI * 1.2, Math.PI * 1.8); c.stroke(); } A.circle(c, x, y - 4, 4); fill(c, '#3d8fe0'); };
  ACC.smoke = (c, a, t) => { if (SILMODE) return; const [x, y] = a.tail; for (let i = 0; i < 4; i++) { const k = ((t || 0) * 0.8 + i * 0.25) % 1; A.circle(c, x - 10 - k * 40, y - k * 30, 8 + k * 14); c.fillStyle = `rgba(90,90,100,${0.5 * (1 - k)})`; c.fill(); } };
  ACC.glow = (c, a, t) => { if (SILMODE) return; c.globalCompositeOperation = 'lighter'; c.fillStyle = A.rg(c, 0, 0, 10, 120, ['rgba(180,255,120,0.25)', 'rgba(180,255,120,0)']); c.fillRect(-130, -130, 260, 260); c.globalCompositeOperation = 'source-over'; };
  ACC.antenna = (c, a, t) => { const [x, y] = a.top; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y - 34); stroke(c, 3.5); A.circle(c, x + 6, y - 38, 6); fill(c, Math.sin((t || 0) * 6) > 0 ? '#e0453d' : '#5fd3ff'); stroke(c, 2.5); };
  ACC.visor = (c, a) => { const [x, y] = a.eye; A.rr(c, x - 20, y - 8, 46, 16, 8); fs(c, SILMODE ? SIL : '#e0453d', 3); if (!SILMODE) { c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x - 12, y - 5, 18, 3); } };
  ACC.hood = (c, a) => { const [x, y] = a.eye; c.beginPath(); c.arc(x - 6, y + 4, 34, Math.PI * 0.9, Math.PI * 2.05); fs(c, '#2d2d2d', 3.5); };
  ACC.teeth = (c, a) => { if (SILMODE) return; const [x, y] = a.mouth; c.fillStyle = '#fff'; c.strokeStyle = OL; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x - 30 + i * 7, y); c.lineTo(x - 27 + i * 7, y + 8); c.lineTo(x - 24 + i * 7, y); c.closePath(); c.fill(); c.stroke(); } };
  ACC.goldteeth = (c, a) => { if (SILMODE) return; const [x, y] = a.mouth; c.fillStyle = '#f0c040'; c.strokeStyle = OL; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x - 30 + i * 7, y); c.lineTo(x - 27 + i * 7, y + 9); c.lineTo(x - 24 + i * 7, y); c.closePath(); c.fill(); c.stroke(); } };
  ACC.sparkle = (c, a, t) => { if (SILMODE) return; A.sparkles(c, [[a.top[0] + 30, a.top[1] - 10, 0, 9], [a.tail[0] + 20, a.tail[1] - 30, 2, 7], [a.belly[0], a.belly[1] + 10, 4, 6]], t || 0, '#ffffff'); };
  ACC.lure = (c, a, t) => { const [x, y] = a.top; c.beginPath(); c.moveTo(x + 10, y + 6); c.quadraticCurveTo(x + 50, y - 40, x + 70, y - 10); stroke(c, 3); A.circle(c, x + 70, y - 6, 9); fill(c, SILMODE ? '#ffd36b' : '#ffd36b'); if (!SILMODE) { c.fillStyle = A.rg(c, x + 70, y - 6, 2, 30, ['rgba(255,240,150,0.6)', 'rgba(255,240,150,0)']); A.circle(c, x + 70, y - 6, 30); c.fill(); } };
  ACC.phone = (c, a) => { const [x, y] = a.chin; A.rr(c, x - 4, y - 6, 16, 26, 3); fs(c, '#1a1a22', 2.5); };
  ACC.sign = (c, a) => { const [x, y] = a.back; A.rr(c, x - 10, y - 36, 64, 22, 4); fs(c, SILMODE ? SIL : '#2a1a3a', 3); if (!SILMODE) { c.fillStyle = '#ff5a8a'; c.font = 'bold 10px sans-serif'; c.fillText('24 SAAT', x - 3, y - 21); } };
  ACC.fangs = (c, a) => { const [x, y] = a.mouth; c.fillStyle = SILMODE ? SIL : '#fff'; for (const dx of [-14, -4]) { c.beginPath(); c.moveTo(x + dx, y); c.lineTo(x + dx + 4, y + 12); c.lineTo(x + dx + 8, y); c.fill(); } };
  ACC.cape = (c, a, t) => { const [x, y] = a.back; const w = Math.sin((t || 0) * 4) * 6; c.beginPath(); c.moveTo(x + 30, y); c.quadraticCurveTo(x - 30, y - 30 + w, x - 70, y + 20 + w); c.quadraticCurveTo(x - 20, y + 10, x + 30, y + 20); fs(c, '#1a0a14', 3); };
  ACC.camera = (c, a) => { const [x, y] = a.top; A.rr(c, x - 16, y - 24, 32, 22, 4); fs(c, '#2a2a30', 3); A.circle(c, x, y - 13, 7); fs(c, '#5a5f66', 2.5); };
  ACC.laser = (c, a, t) => { const [x, y] = a.eye; if (!SILMODE && Math.sin((t || 0) * 3) > 0.3) { c.strokeStyle = 'rgba(255,40,40,0.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 140, y + 20); c.stroke(); } };
  ACC.moon = (c, a) => { const [x, y] = a.top; c.beginPath(); c.arc(x, y - 22, 16, 0, Math.PI * 2); fill(c, '#fff6c8'); stroke(c, 3); c.beginPath(); c.arc(x + 8, y - 26, 14, 0, Math.PI * 2); fill(c, SILMODE ? SIL : '#c9d6ff'); };
  ACC.scarf = (c, a, t) => { const [x, y] = a.chin; const w = Math.sin((t || 0) * 5) * 6; A.rr(c, x - 30, y - 18, 22, 46, 8); fs(c, '#c9302c', 3); c.beginPath(); c.moveTo(x - 24, y + 20); c.lineTo(x - 60, y + 40 + w); c.lineTo(x - 50, y + 50 + w); c.lineTo(x - 16, y + 26); fs(c, '#c9302c', 3); };
  ACC.sneeze = (c, a) => { if (SILMODE) return; c.fillStyle = 'rgba(180,220,255,0.7)'; for (const [dx, dy] of [[20, -4], [32, 6], [26, 14]]) { A.circle(c, a.mouth[0] + dx, a.mouth[1] + dy, 4); c.fill(); } };
  ACC.blank = () => {};
  ACC.mug = (c, a) => { const [x, y] = a.chin; A.rr(c, x + 6, y - 10, 24, 26, 4); fs(c, '#ffffff', 3); if (!SILMODE) { c.fillStyle = '#5a3a2a'; c.fillRect(x + 9, y - 7, 18, 6); } };
  ACC.steam = (c, a, t) => { if (SILMODE) return; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const k = Math.sin((t || 0) * 3 + i) * 5; c.beginPath(); c.moveTo(a.top[0] - 10 + i * 12, a.top[1] - 6); c.quadraticCurveTo(a.top[0] - 4 + i * 12 + k, a.top[1] - 22, a.top[0] - 10 + i * 12, a.top[1] - 38); c.stroke(); } };
  ACC.icecrown = (c, a) => { const [x, y] = a.top; c.beginPath(); for (let i = 0; i <= 6; i++) c.lineTo(x - 30 + i * 10, y - (i % 2 ? 30 : 6)); c.lineTo(x + 30, y + 4); c.lineTo(x - 30, y + 4); c.closePath(); fs(c, '#cfefff', 3); };
  ACC.flamecrown = (c, a, t) => { const [x, y] = a.top; const k = Math.sin((t || 0) * 8) * 4; c.beginPath(); c.moveTo(x - 26, y + 4); c.quadraticCurveTo(x - 20, y - 30 - k, x - 8, y - 14); c.quadraticCurveTo(x, y - 46 + k, x + 8, y - 14); c.quadraticCurveTo(x + 20, y - 30 - k, x + 26, y + 4); c.closePath(); fs(c, SILMODE ? SIL : A.lg(c, 0, y - 40, 0, y, ['#ffd04a', '#ff6a2a']), 3); };
  ACC.eyepatch = (c, a) => { const [x, y] = a.eye; c.beginPath(); c.moveTo(x - 30, y - 22); c.lineTo(x + 26, y + 16); stroke(c, 3); A.ellipse(c, x, y, 12, 10); fs(c, '#111', 2.5); };
  ACC.skull = (c, a) => { const [x, y] = a.back; A.circle(c, x, y + 20, 14); fs(c, '#f5efe0', 3); if (!SILMODE) { c.fillStyle = OL; A.circle(c, x - 5, y + 18, 3); c.fill(); A.circle(c, x + 5, y + 18, 3); c.fill(); } };
  ACC.hooktail = (c, a) => { const [x, y] = a.tail; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 18, y); c.arc(x - 18, y + 14, 14, -Math.PI / 2, Math.PI * 0.8, true); c.lineWidth = 8; c.strokeStyle = SILMODE ? SIL : OL; c.stroke(); c.lineWidth = 5; c.strokeStyle = pf('#c9ccd0'); c.stroke(); };
  ACC.chest = (c, a) => { const [x, y] = a.top; A.rr(c, x - 30, y - 30, 60, 34, 6); fs(c, '#8a5a2a', 3.5); c.fillStyle = pf('#f0c040'); c.fillRect(x - 30, y - 18, 60, 6); c.fillRect(x - 4, y - 24, 8, 12); };
  ACC.sword = (c, a) => { const [x, y] = a.belly; c.beginPath(); c.moveTo(x - 50, y - 10); c.lineTo(x + 20, y - 26); stroke(c, 6); c.beginPath(); c.moveTo(x - 50, y - 10); c.lineTo(x + 20, y - 26); c.strokeStyle = pf('#d9dde6'); c.lineWidth = 3; c.stroke(); A.rr(c, x + 16, y - 34, 8, 18, 2); fs(c, '#f0c040', 2.5); };
  ACC.nosesword = (c, a) => { const [x, y] = a.mouth; c.beginPath(); c.moveTo(x - 4, y - 6); c.lineTo(x + 56, y - 4); c.lineTo(x - 4, y + 4); fs(c, '#c9d6e0', 3); };
  ACC.curse = (c, a, t) => { if (SILMODE) return; c.strokeStyle = 'rgba(125,255,200,0.6)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const r = 70 + i * 12 + Math.sin((t || 0) * 3 + i) * 4; c.beginPath(); c.arc(0, 0, r, i, i + 1.2); c.stroke(); } };
  ACC.bandana = (c, a) => { const [x, y] = a.top; c.beginPath(); c.arc(x, y + 14, 26, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); fs(c, '#c9302c', 3); if (!SILMODE) { c.fillStyle = '#fff'; for (const dx of [-12, 0, 12]) { A.circle(c, x + dx, y + 2, 2.5); c.fill(); } } };
  ACC.captain = (c, a) => { const [x, y] = a.top; hat(c, x, y + 4, 56, 24, '#1a1a22', 8); if (!SILMODE) { c.fillStyle = '#f0c040'; A.circle(c, x, y - 8, 5); c.fill(); } };
  ACC.pepper = (c, a) => { const [x, y] = a.top; c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x - 20, y - 30, x + 4, y - 44); c.quadraticCurveTo(x + 10, y - 20, x + 6, y); fs(c, '#e0302a', 3); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y + 8); stroke(c, 4); };
  ACC.towel = (c, a) => { const [x, y] = a.top; c.beginPath(); c.moveTo(x - 30, y + 10); c.quadraticCurveTo(x, y - 30, x + 30, y + 10); c.lineTo(x + 20, y + 14); c.quadraticCurveTo(x, y - 10, x - 20, y + 14); c.closePath(); fs(c, '#ffffff', 3); if (!SILMODE) { c.strokeStyle = '#3d8fe0'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 20, y + 2); c.quadraticCurveTo(x, y - 16, x + 20, y + 2); c.stroke(); } };
  ACC.coaleyes = (c, a, t) => { if (SILMODE) return; const [x, y] = a.eye; c.fillStyle = A.rg(c, x, y, 1, 18, ['#ffd04a', 'rgba(255,90,20,0)']); A.circle(c, x, y, 18); c.fill(); };
  ACC.dragonwings = (c, a, t) => { const f = Math.sin((t || 0) * 9) * 8; const [x, y] = a.back; c.beginPath(); c.moveTo(x + 20, y + 10); c.lineTo(x - 10, y - 60 - f); c.lineTo(x - 20, y - 30 - f); c.lineTo(x - 40, y - 50 - f); c.lineTo(x - 30, y - 10); c.lineTo(x - 10, y + 10); fs(c, '#8a1a1a', 3.5); };
  ACC.ember = (c, a, t) => { if (SILMODE) return; for (let i = 0; i < 5; i++) { const k = ((t || 0) * 0.6 + i * 0.2) % 1; A.circle(c, -40 + i * 25, -40 - k * 60, 3 * (1 - k) + 1); c.fillStyle = `rgba(255,140,40,${1 - k})`; c.fill(); } };
  ACC.magnet = (c, a) => { const [x, y] = a.top; c.beginPath(); c.arc(x, y - 10, 16, Math.PI, 0); c.lineWidth = 12; c.strokeStyle = SILMODE ? SIL : OL; c.stroke(); c.lineWidth = 8; c.strokeStyle = pf('#e0453d'); c.stroke(); if (!SILMODE) { c.fillStyle = '#d9dde6'; c.fillRect(x - 20, y - 12, 8, 8); c.fillRect(x + 12, y - 12, 8, 8); } };
  ACC.sparks = (c, a, t) => { if (SILMODE) return; c.strokeStyle = '#f2f25a'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { if (Math.sin((t || 0) * 12 + i * 2) < 0) continue; const x = -60 + i * 40, y = -26; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y - 12); c.lineTo(x - 2, y - 14); c.lineTo(x + 6, y - 28); c.stroke(); } };
  ACC.clock = (c, a, t) => { const [x, y] = a.back; A.circle(c, x, y + 6, 16); fs(c, '#f5efe0', 3); if (!SILMODE) { c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x + Math.cos((t || 0)) * 10, y + 6 + Math.sin((t || 0)) * 10); stroke(c, 2.5); c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x, y - 4); stroke(c, 2.5); } };
  ACC.compass = (c, a, t) => { const [x, y] = [a.belly[0], a.belly[1] - 50]; A.circle(c, x, y, 18); fs(c, '#f5efe0', 3); if (!SILMODE) { const r = (t || 0) * 5; c.save(); c.translate(x, y); c.rotate(r); c.beginPath(); c.moveTo(0, -14); c.lineTo(4, 0); c.lineTo(0, 14); c.lineTo(-4, 0); c.closePath(); c.fillStyle = '#e0453d'; c.fill(); c.restore(); } };
  ACC.twohead = (c, a) => { c.save(); c.translate(0, -26); c.scale(0.55, 0.55); c.beginPath(); c.moveTo(190, 10); c.bezierCurveTo(170, -30, 120, -40, 90, -20); c.bezierCurveTo(110, 10, 150, 30, 190, 10); fs(c, '#5a6a7a', 6); if (!SILMODE) { A.circle(c, 160, -8, 6); c.fillStyle = OL; c.fill(); } c.restore(); };
  ACC.twin = (c, a) => { if (SILMODE) return; c.strokeStyle = 'rgba(255,79,179,0.8)'; c.lineWidth = 3; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(-100, 0); c.lineTo(110, 0); c.stroke(); c.setLineDash([]); };
  ACC.catears = (c, a) => { const [x, y] = a.top; for (const dx of [-16, 16]) { c.beginPath(); c.moveTo(x + dx - 12, y + 8); c.lineTo(x + dx, y - 22); c.lineTo(x + dx + 12, y + 8); fs(c, '#8a8aa0', 3); } };
  ACC.box = (c, a) => { if (SILMODE) return; c.save(); c.globalAlpha = 0.5; A.rr(c, -110, -60, 80, 60, 4); c.fillStyle = '#c9a06a'; c.fill(); c.strokeStyle = OL; c.lineWidth = 3; c.stroke(); c.fillStyle = OL; c.font = 'bold 22px sans-serif'; c.fillText('?', -78, -22); c.restore(); };
  ACC.bubbles = (c, a, t) => { if (SILMODE) return; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2.5; for (let i = 0; i < 4; i++) { const k = ((t || 0) * 0.5 + i * 0.25) % 1; A.circle(c, a.top[0] + Math.sin(i + k * 5) * 10, a.top[1] - 10 - k * 60, 4 + i * 2); c.stroke(); } };
  ACC.error = (c, a) => { const [x, y] = a.top; A.rr(c, x - 34, y - 30, 68, 24, 4); fs(c, SILMODE ? SIL : '#ffffff', 3); if (!SILMODE) { c.fillStyle = '#e0453d'; c.font = 'bold 15px monospace'; c.textAlign = 'center'; c.fillText('404', x, y - 12); c.textAlign = 'left'; } };
  ACC.monocle = (c, a) => { const [x, y] = a.eye; A.circle(c, x, y, 14); stroke(c, 3.5); c.beginPath(); c.moveTo(x, y + 14); c.quadraticCurveTo(x - 10, y + 40, x - 4, y + 56); stroke(c, 2); };
  ACC.headphones = (c, a) => { const [x, y] = a.eye; c.beginPath(); c.arc(x - 16, y, 34, Math.PI * 1.1, Math.PI * 1.9); stroke(c, 7); A.rr(c, x - 50, y - 6, 16, 26, 6); fs(c, '#5ff5e0', 3); };

  // ------------------- ANA ÇİZİM -------------------
  function drawEye(c, x, y, r, sleepy, bigEyes, blank) {
    if (SILMODE) { A.circle(c, x, y, r * 0.5); c.fillStyle = 'rgba(160,220,255,0.55)'; c.fill(); return; }
    A.circle(c, x, y, r); A.fs(c, '#ffffff', 3);
    if (sleepy) { c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); A.fs(c, null, 3); return; }
    if (blank) { A.circle(c, x, y, r * 0.2); c.fillStyle = OL; c.fill(); return; }
    A.circle(c, x + r * 0.25, y + r * 0.05, r * (bigEyes ? 0.55 : 0.5)); c.fillStyle = OL; c.fill();
    A.circle(c, x + r * 0.4, y - r * 0.2, r * 0.18); c.fillStyle = '#fff'; c.fill();
  }

  function drawLocal(c, b, t, opts) {
    const shape = S[b.shape] || S.fish;
    const [c1, c2] = b.colors;
    const h = shape === S.fish ? (b.behavior === 'heavy' ? 0.48 : b.behavior === 'runner' ? 0.36 : 0.42) : undefined;
    const r = A.rand(D.RNG.hashStr(b.id));
    const a = shape.anchors(h);
    // aura (efsanevi/boss)
    if (!SILMODE && (b.rarity === 'legendary' || b.rarity === 'boss') && !opts.noAura) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = A.rg(c, 0, 0, 30, 150, [b.rarity === 'boss' ? 'rgba(255,60,90,0.32)' : 'rgba(255,200,60,0.3)', 'rgba(0,0,0,0)']);
      c.fillRect(-170, -170, 340, 340); c.restore();
    }
    // arkadaki aksesuarlar
    for (const k of b.acc) if (['wings', 'dragonwings', 'cape', 'humps', 'curse', 'box', 'glow'].includes(k)) ACC[k](c, a, t);
    shape.under(c, c1, b.shape === 'can' || b.shape === 'whale' || b.shape === 'penguin' || b.shape === 'shark' || b.shape === 'turtle' || b.shape === 'kraken' ? c2 : h, t);
    // gövde
    shape.body(c, h !== undefined ? h : t);
    c.fillStyle = SILMODE ? SIL : A.lg(c, 0, -80, 0, 80, [A.shade(c1, 0.18), c1, A.shade(c1, -0.22)]);
    c.fill();
    if (!SILMODE) {
      c.save(); shape.body(c, h !== undefined ? h : t); c.clip();
      (PAT[b.pattern] || PAT.plain)(c, c1, c2, r);
      // üst parlama
      c.fillStyle = 'rgba(255,255,255,0.18)'; A.ellipse(c, 10, -a.R * 0.35, a.R * 0.7, a.R * 0.14); c.fill();
      c.restore();
    }
    shape.body(c, h !== undefined ? h : t); stroke(c, 4.5);
    shape.over(c, c1, b.shape === 'can' || b.shape === 'whale' || b.shape === 'penguin' || b.shape === 'shark' ? c2 : h, t);
    // göz(ler)
    if (!a.noEye) {
      const sleepy = b.acc.includes('sleepy');
      const eyeR = a.bigEyes ? 13 : b.shape === 'whale' ? 7 : 10;
      if (a.ghostEyes) { for (const e of [a.eye, a.eye2]) { A.ellipse(c, e[0], e[1], 7, 11); c.fillStyle = SILMODE ? 'rgba(160,220,255,0.55)' : OL; c.fill(); } }
      else { drawEye(c, a.eye[0], a.eye[1], eyeR, sleepy, a.bigEyes, b.acc.includes('blank')); if (a.eye2) drawEye(c, a.eye2[0], a.eye2[1], eyeR, sleepy, a.bigEyes, b.acc.includes('blank')); }
    }
    // ağız (gülümseme)
    if (!SILMODE && !['crab', 'ghost', 'kraken', 'usb', 'can', 'frog'].includes(b.shape)) { c.beginPath(); c.moveTo(a.mouth[0] - 14, a.mouth[1] + 2); c.quadraticCurveTo(a.mouth[0] - 6, a.mouth[1] + 9, a.mouth[0] - 1, a.mouth[1] + 1); A.fs(c, null, 3); }
    if (!SILMODE && (b.shape === 'can' || b.shape === 'usb')) { c.beginPath(); c.arc(a.mouth[0] - 8, a.mouth[1] - 4, 8, 0.2, Math.PI - 0.2); A.fs(c, null, 3); }
    // öndeki aksesuarlar
    for (const k of b.acc) if (!['wings', 'dragonwings', 'cape', 'humps', 'curse', 'box', 'glow'].includes(k) && ACC[k]) ACC[k](c, a, t);
  }

  const FishArt = {
    SHAPES: S, PATTERNS: PAT, ACCESSORIES: ACC,
    // len: ekranda balığın boyu (px)
    draw(c, fishId, x, y, len, opts) {
      opts = opts || {};
      const b = D.FishBalanceDB[fishId];
      c.save();
      c.translate(x, y);
      const k = len / 200;
      c.scale(opts.flip ? -k : k, k);
      if (opts.rot) c.rotate(opts.rot);
      if (opts.alpha != null) c.globalAlpha = opts.alpha;
      SILMODE = !!opts.sil;
      try { drawLocal(c, b, opts.t || 0, opts); } finally { SILMODE = false; }
      c.restore();
    },
    // Önbellekli sprite (silüet / küçük ikon) — sabit poz
    sprite(fishId, sil, px) {
      px = px || 220;
      return A.cached('fish:' + fishId + ':' + (sil ? 1 : 0) + ':' + px, px * 1.6, px * 1.3, (cx, w, h) => FishArt.draw(cx, fishId, w / 2, h / 2, px, { sil, t: 0.4 }));
    }
  };
  D.FishArt = FishArt;
})(globalThis.DUMEN);
