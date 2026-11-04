// NPC karakter çizimleri (tam boy, ayak (0,0), boy ≈ 260 birim). Her biri ayrı silüet/kıyafet/jest + idle animasyon.
(function (D) {
  'use strict';
  const A = D.Art, OL = A.OL;
  const fs = (c, f, lw) => A.fs(c, f, lw == null ? 4 : lw);
  const blink = (t, seed) => ((t + seed) % 3.7) < 0.12;

  function eyes(c, x, y, gap, t, seed, o) {
    o = o || {};
    for (const dx of [-gap / 2, gap / 2]) {
      if (blink(t, seed) || o.closed) { c.beginPath(); c.moveTo(x + dx - 6, y); c.quadraticCurveTo(x + dx, y + 3, x + dx + 6, y); fs(c, null, 3); continue; }
      if (o.swirl) { c.beginPath(); for (let i = 0; i < 18; i++) { const a = i * 0.7, r = i * 0.45; c.lineTo(x + dx + Math.cos(a + t * 4) * r, y + Math.sin(a + t * 4) * r); } c.lineWidth = 2.5; c.strokeStyle = OL; c.stroke(); continue; }
      A.ellipse(c, x + dx, y, 7, o.half ? 4 : 8); fs(c, '#fff', 3);
      A.circle(c, x + dx + 1.5, y + (o.half ? 1 : 1), o.half ? 2.6 : 3.4); c.fillStyle = OL; c.fill();
      if (o.half) { c.beginPath(); c.moveTo(x + dx - 8, y - 2); c.lineTo(x + dx + 8, y - 3); fs(c, null, 3.5); }
    }
  }
  function legs(c, col, shoe, t, wide) {
    const w = wide || 14;
    for (const sx of [-1, 1]) { A.rr(c, sx * w - 10, -86, 20, 80, 8); fs(c, col); A.rr(c, sx * w - 14, -12, 30, 14, 6); fs(c, shoe || '#3a2a1a'); }
  }
  function torso(c, col, w, h, y0) { A.rr(c, -w / 2, y0 - h, w, h, 22); fs(c, col); }
  function arm(c, x, y, ang, len, col, hand) {
    c.save(); c.translate(x, y); c.rotate(ang);
    A.rr(c, -10, 0, 20, len, 10); fs(c, col);
    A.circle(c, 0, len + 4, 10); fs(c, hand || '#f0c39a');
    c.restore();
  }
  function head(c, x, y, r, skin) { A.circle(c, x, y, r); fs(c, skin); }

  const N = {};
  N.rustem = (c, t) => {
    const b = Math.sin(t * 2) * 2;
    legs(c, '#3a4a6a', '#2a1a10', t);
    arm(c, -40, -168 + b, 0.25 + Math.sin(t * 1.4) * 0.05, 64, '#ffffff');
    torso(c, '#ffffff', 84, 100, -78 + b);
    c.save(); A.rr(c, -42, -178 + b, 84, 100, 22); c.clip(); c.fillStyle = '#3d6fb0'; for (let y = -178; y < -78; y += 16) c.fillRect(-42, y + b, 84, 7); c.restore();
    A.rr(c, -32, -150 + b, 64, 80, 10); fs(c, '#f5efe0', 3.5); // önlük
    A.rr(c, -12, -136 + b, 24, 18, 4); fs(c, '#e8e0d0', 2.5);
    // kolunda balık
    c.save(); c.translate(48, -110 + b); c.rotate(-0.4 + Math.sin(t * 2) * 0.05); D.FishArt.draw(c, 'EL_02', 20, 0, 60, { t, noAura: true }); c.restore();
    arm(c, 40, -168 + b, -0.6, 56, '#ffffff');
    head(c, 0, -206 + b, 34, '#e0a878');
    A.ellipse(c, -30, -204 + b, 6, 10); fs(c, '#e0a878', 3);
    eyes(c, 2, -214 + b, 24, t, 0.3);
    c.beginPath(); c.moveTo(-22, -196 + b); c.quadraticCurveTo(-8, -184 + b, 2, -194 + b); c.quadraticCurveTo(12, -184 + b, 26, -196 + b); c.quadraticCurveTo(14, -200 + b, 2, -198 + b); c.quadraticCurveTo(-10, -200 + b, -22, -196 + b); fs(c, '#2a1a10', 2.5);
    A.circle(c, 4, -202 + b, 5); fs(c, '#d08860', 2.5);
    // kasket
    c.beginPath(); c.moveTo(-36, -222 + b); c.quadraticCurveTo(0, -262 + b, 36, -222 + b); c.closePath(); fs(c, '#2a4a7a'); A.rr(c, -6, -228 + b, 52, 9, 4); fs(c, '#1a3a6a');
  };
  N.hasan = (c, t) => {
    const b = Math.sin(t * 2.2) * 2;
    legs(c, '#e07a2a', '#2a1a10', t, 16);
    torso(c, '#e07a2a', 94, 104, -78 + b);
    A.rr(c, -26, -164 + b, 52, 34, 6); fs(c, '#c8661a', 3); // cep
    c.fillStyle = '#9aa7b2'; A.circle(c, -30, -170 + b, 5); c.fill(); A.circle(c, 30, -170 + b, 5); c.fill();
    arm(c, -46, -170 + b, 0.2, 66, '#e07a2a', '#e8b890');
    arm(c, 46, -170 + b, -0.9 + Math.sin(t * 3) * 0.15, 60, '#e07a2a', '#e8b890');
    // İngiliz anahtarı
    c.save(); c.translate(46 + Math.sin(-0.9) * -60, -170 + b + 60 * Math.cos(-0.9)); c.rotate(-0.4 + Math.sin(t * 3) * 0.15); A.rr(c, -5, -46, 10, 46, 3); fs(c, '#9aa7b2', 3); c.beginPath(); c.arc(0, -52, 12, 0.6, Math.PI * 2 - 0.6 + Math.PI); fs(c, '#9aa7b2', 3); c.restore();
    head(c, 0, -212 + b, 36, '#e8b890');
    c.fillStyle = 'rgba(60,40,30,0.35)'; c.beginPath(); c.arc(0, -206 + b, 32, 0.2, Math.PI - 0.2); c.fill(); // sakal gölgesi
    eyes(c, 0, -216 + b, 26, t, 1.1);
    c.beginPath(); c.moveTo(-10, -196 + b); c.quadraticCurveTo(0, -190 + b, 10, -196 + b); fs(c, null, 3);
    // kaynak gözlüğü alnında
    A.rr(c, -36, -246 + b, 72, 12, 6); fs(c, '#3a3a3a', 3); for (const x of [-16, 16]) { A.circle(c, x, -240 + b, 11); fs(c, '#5fd3a8', 3); c.fillStyle = 'rgba(255,255,255,0.5)'; A.circle(c, x - 3, -243 + b, 3); c.fill(); }
    c.beginPath(); c.arc(0, -228 + b, 34, Math.PI * 1.15, Math.PI * 1.85); c.lineWidth = 10; c.strokeStyle = '#5a4a3a'; c.stroke();
  };
  N.zip = (c, t) => {
    const b = Math.sin(t * 1.6) * 2;
    // kuyruk
    c.beginPath(); c.moveTo(30, -40); c.bezierCurveTo(90, -40, 90 + Math.sin(t * 2) * 14, -120, 60, -140); c.lineWidth = 18; c.strokeStyle = OL; c.stroke(); c.lineWidth = 12; c.strokeStyle = '#8a8f9a'; c.stroke();
    legs(c, '#2a2a34', '#111', t);
    torso(c, '#2a2a34', 96, 106, -80 + b);
    c.save(); A.rr(c, -48, -186 + b, 96, 106, 22); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; for (let x = -44; x < 48; x += 10) { c.beginPath(); c.moveTo(x, -190); c.lineTo(x, -70); c.stroke(); } c.restore();
    c.beginPath(); c.moveTo(-18, -186 + b); c.lineTo(0, -140 + b); c.lineTo(18, -186 + b); c.closePath(); fs(c, '#ffffff', 3);
    c.beginPath(); c.moveTo(-5, -178 + b); c.lineTo(5, -178 + b); c.lineTo(8, -146 + b); c.lineTo(0, -138 + b); c.lineTo(-8, -146 + b); c.closePath(); fs(c, '#c9302c', 2.5);
    A.circle(c, 28, -168 + b, 8); fs(c, '#e0453d', 2.5); // yaka gülü
    arm(c, -48, -176 + b, 0.3, 64, '#2a2a34', '#8a8f9a');
    arm(c, 48, -176 + b, -0.5, 54, '#2a2a34', '#8a8f9a');
    // kedi kafası
    for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 14, -250 + b); c.lineTo(sx * 34, -280 + b); c.lineTo(sx * 40, -236 + b); fs(c, '#8a8f9a'); }
    A.ellipse(c, 0, -222 + b, 44, 38); fs(c, '#8a8f9a');
    c.fillStyle = '#6a6f7a'; for (const dx of [-14, 0, 14]) { c.fillRect(dx - 3, -258 + b, 6, 14); }
    A.ellipse(c, 0, -206 + b, 22, 14); fs(c, '#d9dde6', 3);
    eyes(c, 0, -228 + b, 30, t, 2, { half: true });
    c.beginPath(); c.moveTo(-5, -212 + b); c.lineTo(5, -212 + b); c.lineTo(0, -206 + b); c.closePath(); fs(c, '#ff8ab8', 2.5);
    c.lineWidth = 2; c.strokeStyle = OL; for (const sx of [-1, 1]) for (const k of [-4, 4]) { c.beginPath(); c.moveTo(sx * 18, -206 + b + k); c.lineTo(sx * 48, -210 + b + k * 2); c.stroke(); }
    // balık kılçığı puro
    c.beginPath(); c.moveTo(10, -200 + b); c.lineTo(40, -194 + b); c.lineWidth = 3; c.stroke(); for (let x = 16; x < 40; x += 6) { c.beginPath(); c.moveTo(x, -201 + b); c.lineTo(x + 2, -192 + b); c.stroke(); }
    // fötr
    A.ellipse(c, 0, -254 + b, 58, 10); fs(c, '#1a1a1a'); c.beginPath(); c.moveTo(-34, -254 + b); c.quadraticCurveTo(-34, -296 + b, 0, -292 + b); c.quadraticCurveTo(34, -296 + b, 34, -254 + b); c.closePath(); fs(c, '#1a1a1a'); c.fillStyle = '#c9302c'; c.fillRect(-34, -266 + b, 68, 8);
  };
  N.tarcov = (c, t) => {
    const b = Math.sin(t * 3) * 1.5;
    // kısa boylu köpek — trençkot
    legs(c, '#1a1a1a', '#1a1a1a', t, 12);
    c.beginPath(); c.moveTo(-36, -40); c.lineTo(-30, -140 + b); c.lineTo(30, -140 + b); c.lineTo(36, -40); c.closePath(); fs(c, '#c9a46a');
    c.beginPath(); c.moveTo(0, -140 + b); c.lineTo(0, -44); c.lineWidth = 2.5; c.strokeStyle = OL; c.stroke();
    A.rr(c, -36, -96, 72, 8, 3); fs(c, '#8a6a3a', 2.5);
    // rozet
    c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 6 : 13; c.lineTo(-14 + Math.cos(a) * r, -122 + b + Math.sin(a) * r); } c.closePath(); fs(c, '#f0c040', 2.5);
    arm(c, -32, -134 + b, 0.2, 44, '#c9a46a', '#ffffff');
    arm(c, 32, -134 + b, -1.0, 40, '#c9a46a', '#ffffff');
    A.rr(c, 50, -138 + b, 22, 28, 3); fs(c, '#f5efe0', 2.5); // not defteri
    // köpek kafası: siyah-beyaz
    A.ellipse(c, 0, -170 + b, 36, 32); fs(c, '#ffffff');
    c.save(); A.ellipse(c, 0, -170 + b, 36, 32); c.clip(); c.fillStyle = '#1a1a1a'; A.ellipse(c, -18, -180 + b, 20, 22); c.fill(); c.restore(); A.ellipse(c, 0, -170 + b, 36, 32); fs(c, null);
    for (const sx of [-1, 1]) { A.ellipse(c, sx * 38, -168 + b, 12, 24, sx * 0.3); fs(c, sx < 0 ? '#1a1a1a' : '#1a1a1a'); }
    A.ellipse(c, 0, -156 + b, 18, 12); fs(c, '#f5efe0', 3); A.ellipse(c, 0, -162 + b, 8, 6); fs(c, '#1a1a1a', 2);
    eyes(c, 0, -178 + b, 26, t, 0.7);
    c.beginPath(); c.moveTo(-8, -150 + b); c.quadraticCurveTo(0, -146 + b, 8, -150 + b); fs(c, null, 2.5);
    // polis şapkası
    A.rr(c, -34, -214 + b, 68, 20, 6); fs(c, '#1a2a4a'); A.rr(c, -38, -198 + b, 76, 8, 4); fs(c, '#0a1a3a'); c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 3.5 : 7; c.lineTo(Math.cos(a) * r, -205 + b + Math.sin(a) * r); } c.closePath(); fs(c, '#f0c040', 1.5);
  };
  N.komplo = (c, t) => {
    const b = Math.sin(t * 4) * 2.5;
    legs(c, '#4a4a3a', '#5a3a2a', t, 12);
    torso(c, '#5a7a3a', 80, 108, -78 + b);
    c.fillStyle = '#e0453d'; A.circle(c, -18, -150 + b, 6); c.fill(); c.fillStyle = '#f0c040'; A.circle(c, 14, -130 + b, 5); c.fill(); c.fillStyle = '#3d8fe0'; A.circle(c, -10, -112 + b, 5); c.fill();
    arm(c, -40, -176 + b, 0.15, 64, '#5a7a3a', '#f0c8a0');
    arm(c, 40, -176 + b, -1.4 + Math.sin(t * 5) * 0.25, 60, '#5a7a3a', '#f0c8a0');
    // elinde kağıt
    c.save(); c.translate(98, -196 + b + Math.sin(t * 5) * 6); c.rotate(0.2); A.rr(c, -14, -20, 30, 40, 2); fs(c, '#fffaf0', 2.5); c.strokeStyle = '#e0453d'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 9, 0, 6.28); c.moveTo(-8, 8); c.lineTo(8, -8); c.stroke(); c.restore();
    head(c, 0, -210 + b, 32, '#f0c8a0');
    // dağınık saç
    c.fillStyle = '#6a4a2a'; for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; c.beginPath(); c.moveTo(Math.cos(a) * 26, -210 + b + Math.sin(a) * 26); c.lineTo(Math.cos(a) * 46, -214 + b + Math.sin(a) * 40); c.lineTo(Math.cos(a + 0.3) * 26, -210 + b + Math.sin(a + 0.3) * 26); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke(); }
    eyes(c, 0, -212 + b, 24, t, 0.2, { swirl: true });
    c.beginPath(); c.moveTo(-10, -194 + b); c.lineTo(10, -192 + b); fs(c, null, 3);
    // folyo şapka
    c.beginPath(); c.moveTo(-34, -228 + b); c.lineTo(-8, -282 + b); c.lineTo(6, -270 + b); c.lineTo(34, -228 + b); c.closePath(); fs(c, '#d9dde6'); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-20, -240 + b); c.lineTo(-6, -268 + b); c.stroke();
  };
  N.kaya = (c, t) => {
    const b = Math.sin(t * 1.5) * 1.5;
    legs(c, '#5a4a3a', '#2a1a10', t);
    torso(c, '#e8dcc0', 86, 106, -78 + b);
    A.rr(c, -36, -184 + b, 72, 96, 14); fs(c, '#8a5a3a', 3.5); // yelek
    c.save(); c.translate(0, -120 + b); c.rotate(-0.05); A.rr(c, -36, -22, 72, 48, 4); fs(c, '#2a5a8a'); A.rr(c, -32, -18, 64, 40, 3); fs(c, '#f5efe0', 2); c.fillStyle = '#2a5a8a'; c.fillRect(-2, -18, 4, 40); c.restore();
    arm(c, -42, -176 + b, 0.5, 52, '#e8dcc0'); arm(c, 42, -176 + b, -0.5, 52, '#e8dcc0');
    head(c, 0, -212 + b, 32, '#f0c8a0');
    c.beginPath(); c.moveTo(-30, -208 + b); c.quadraticCurveTo(-34, -160 + b, 0, -150 + b); c.quadraticCurveTo(34, -160 + b, 30, -208 + b); c.quadraticCurveTo(0, -194 + b, -30, -208 + b); fs(c, '#f5f5f5', 3);
    for (const x of [-11, 11]) { A.circle(c, x, -216 + b, 9); c.lineWidth = 3; c.strokeStyle = OL; c.stroke(); }
    eyes(c, 0, -216 + b, 22, t, 1.7);
    A.ellipse(c, 0, -242 + b, 34, 10); fs(c, '#6a3a2a'); A.circle(c, 0, -252 + b, 4); fs(c, '#6a3a2a', 2);
  };
  N.kropi = (c, t) => {
    const b = Math.sin(t * 2.4) * 2;
    legs(c, '#3a4a6a', '#3a2a1a', t, 15);
    torso(c, '#c9302c', 90, 104, -78 + b);
    c.save(); A.rr(c, -45, -182 + b, 90, 104, 22); c.clip(); c.strokeStyle = 'rgba(30,10,10,0.45)'; c.lineWidth = 4; for (let x = -45; x < 45; x += 18) { c.beginPath(); c.moveTo(x, -190); c.lineTo(x, -70); c.stroke(); } for (let y = -180; y < -70; y += 18) { c.beginPath(); c.moveTo(-45, y + b); c.lineTo(45, y + b); c.stroke(); } c.restore();
    A.rr(c, -30, -150 + b, 60, 70, 8); fs(c, '#3a4a6a', 3.5); // tulum
    arm(c, -45, -174 + b, 0.3, 60, '#c9302c', '#d8a070');
    arm(c, 45, -174 + b, -1.2 + Math.sin(t * 4) * 0.3, 56, '#c9302c', '#d8a070');
    c.save(); c.translate(98, -190 + b); c.rotate(-0.6 + Math.sin(t * 4) * 0.3); A.rr(c, -4, -8, 8, 46, 3); fs(c, '#8a5a3a', 3); A.rr(c, -16, -18, 32, 14, 3); fs(c, '#5a5f66', 3); c.restore();
    head(c, 0, -210 + b, 32, '#d8a070');
    eyes(c, 0, -212 + b, 24, t, 2.4);
    c.beginPath(); c.moveTo(-10, -196 + b); c.quadraticCurveTo(0, -188 + b, 10, -196 + b); fs(c, null, 3);
    c.fillStyle = '#e8a08a'; A.circle(c, -18, -200 + b, 5); c.fill(); A.circle(c, 18, -200 + b, 5); c.fill();
    c.beginPath(); c.arc(0, -226 + b, 36, Math.PI, 0); c.closePath(); fs(c, '#f2d14a'); A.rr(c, -42, -230 + b, 84, 9, 4); fs(c, '#e8c02a');
  };
  N.marti = (c, t) => {
    const b = Math.sin(t * 3) * 2; const look = Math.sin(t * 0.7) > 0.6 ? -1 : 1;
    c.beginPath(); c.moveTo(-6, 0); c.lineTo(-6, -24); c.moveTo(8, 0); c.lineTo(8, -24); c.lineWidth = 4; c.strokeStyle = '#f0a020'; c.stroke();
    A.ellipse(c, 0, -46 + b, 34, 24); fs(c, '#ffffff');
    c.beginPath(); c.moveTo(-20, -56 + b); c.quadraticCurveTo(-50, -50 + b, -58, -34 + b); c.quadraticCurveTo(-30, -36 + b, -10, -40 + b); fs(c, '#b8c0c8');
    c.save(); c.translate(18, -76 + b); c.scale(look, 1);
    A.circle(c, 0, 0, 18); fs(c, '#ffffff');
    c.beginPath(); c.moveTo(14, -2); c.lineTo(40, 2); c.lineTo(14, 8); c.closePath(); fs(c, '#f0c040', 3); A.circle(c, 32, 4, 2.5); c.fillStyle = '#e0453d'; c.fill();
    A.circle(c, 6, -5, 3.5); c.fillStyle = OL; c.fill(); c.beginPath(); c.moveTo(0, -12); c.lineTo(12, -9); A.fs(c, null, 3);
    c.restore();
  };
  N.factory = (c, t) => {
    const b = Math.sin(t * 2) * 2;
    legs(c, '#3a5a3a', '#2a2a2a', t);
    torso(c, '#5fb050', 86, 104, -78 + b); c.fillStyle = '#f2d14a'; c.fillRect(-43, -140 + b, 86, 10); c.fillRect(-43, -110 + b, 86, 10);
    arm(c, -43, -174 + b, 0.3, 60, '#5fb050', '#3a3a3a'); arm(c, 43, -174 + b, -0.3, 60, '#5fb050', '#3a3a3a');
    head(c, 0, -210 + b, 32, '#c8946a'); eyes(c, 0, -214 + b, 24, t, 0.9);
    A.rr(c, -22, -204 + b, 44, 20, 8); fs(c, '#e8e8e0', 3); // maske
    c.beginPath(); c.arc(0, -224 + b, 36, Math.PI, 0); c.closePath(); fs(c, '#ff9a3c');
  };
  N.market = (c, t) => {
    const b = Math.sin(t * 2) * 2;
    legs(c, '#2a2a3a', '#2a1a10', t);
    torso(c, '#3d8fe0', 84, 100, -78 + b); A.rr(c, -26, -160 + b, 52, 80, 8); fs(c, '#f2d14a', 3); A.signText(c, 'M', 0, -130 + b, 22, '#3d8fe0');
    arm(c, -42, -170 + b, 0.3, 60, '#3d8fe0', '#e8b890'); arm(c, 42, -170 + b, -0.3, 60, '#3d8fe0', '#e8b890');
    head(c, 0, -206 + b, 32, '#e8b890'); eyes(c, 0, -210 + b, 24, t, 1.4);
    c.beginPath(); c.moveTo(-10, -192 + b); c.quadraticCurveTo(0, -184 + b, 10, -192 + b); fs(c, null, 3);
    c.beginPath(); c.arc(0, -222 + b, 34, Math.PI, 0); c.closePath(); fs(c, '#3d8fe0'); A.rr(c, 0, -226 + b, 44, 8, 4); fs(c, '#2a6ab0');
  };
  N.player = (c, t, o) => {
    o = o || {};
    const b = Math.sin(t * 2) * 1.5;
    torso(c, '#f2c42a', 70, 80, -10 + b);
    arm(c, 30, -80 + b, -1.4 + (o.reel ? Math.sin(t * 20) * 0.2 : 0), 50, '#f2c42a', '#f0c8a0');
    head(c, 0, -112 + b, 26, '#f0c8a0'); eyes(c, 6, -114 + b, 18, t, 0.5);
    c.beginPath(); c.moveTo(-2, -100 + b); c.quadraticCurveTo(6, -94 + b, 14, -100 + b); fs(c, null, 2.5);
    const hat = o.hat && D.CosmeticDB[o.hat] ? D.CosmeticDB[o.hat].value.kind : null;
    if (hat === 'captain') { A.rr(c, -28, -150 + b, 56, 22, 8); fs(c, '#fff'); A.rr(c, -32, -132 + b, 64, 8, 4); fs(c, '#1a1a22'); A.circle(c, 0, -140 + b, 5); fs(c, '#f0c040', 2); }
    else if (hat === 'fez') { c.beginPath(); c.moveTo(-18, -130 + b); c.lineTo(-12, -162 + b); c.lineTo(12, -162 + b); c.lineTo(18, -130 + b); c.closePath(); fs(c, '#c9302c'); }
    else if (hat === 'foil') { c.beginPath(); c.moveTo(-26, -128 + b); c.lineTo(0, -172 + b); c.lineTo(26, -128 + b); c.closePath(); fs(c, '#d9dde6'); }
    else { c.beginPath(); c.moveTo(-34, -128 + b); c.quadraticCurveTo(0, -170 + b, 34, -128 + b); c.lineTo(44, -122 + b); c.lineTo(-40, -122 + b); c.closePath(); fs(c, '#f2c42a'); }
  };

  // Kullanıcı çizimi karakter görselleri. fx/fy: baş merkezi (görsel genişlik/yükseklik oranı),
  // hr: portre yarıçapı (görsel yüksekliği oranı), hm: tam boy yükseklik çarpanı (oturan/küçük karakterler).
  const SPR = {
    market: { fx: 0.51, fy: 0.18, hr: 0.17, hm: 1.0 },
    baskan: { fx: 0.43, fy: 0.19, hr: 0.17, hm: 1.0 },
    factory: { fx: 0.46, fy: 0.10, hr: 0.11, hm: 1.05 },
    hasan: { fx: 0.48, fy: 0.16, hr: 0.14, hm: 1.05 },
    kaya: { fx: 0.42, fy: 0.12, hr: 0.11, hm: 1.05 },
    kropi: { fx: 0.43, fy: 0.09, hr: 0.10, hm: 1.05 },
    rustem: { fx: 0.52, fy: 0.19, hr: 0.20, hm: 1.0 },
    tekir: { fx: 0.30, fy: 0.19, hr: 0.18, hm: 0.82 },
    zip: { fx: 0.29, fy: 0.24, hr: 0.21, hm: 0.95 }
  };
  const sprite = (id) => (SPR[id] && D.Assets ? D.Assets.get('char_' + id) : null);
  const NPCArt = {
    has: (id) => !!N[id] || !!SPR[id],
    sprite,
    draw(c, id, x, y, scale, t, opts) {
      const img = sprite(id);
      if (img) {
        const sp = SPR[id];
        c.save(); c.translate(x, y); c.scale(scale, scale);
        A.shadow(c, 0, 0, 60, 12, 0.22);
        const hh = 280 * sp.hm, ww = hh * img.width / img.height;
        const br = 1 + Math.sin((t || 0) * 2 + x * 0.01) * 0.008; // nefes alma
        c.translate(0, 0); c.scale(1, br);
        c.drawImage(img, -ww / 2, -hh, ww, hh);
        c.restore();
        return;
      }
      if (!N[id]) return;
      c.save(); c.translate(x, y); c.scale(scale, scale);
      A.shadow(c, 0, 0, id === 'marti' ? 30 : 50, 10, 0.22);
      N[id](c, t || 0, opts);
      c.restore();
    },
    // Portre: baş+gövde üst kısmı bir dairenin içinde
    portrait(c, id, cx, cy, r, t, bg) {
      const img = sprite(id);
      if (img) {
        const sp = SPR[id];
        c.save(); A.circle(c, cx, cy, r); c.fillStyle = bg || '#f6e7c8'; c.fill(); c.clip();
        const s2 = r / (sp.hr * img.height);
        const px = sp.fx * img.width, py = (sp.fy + sp.hr * 0.35) * img.height;
        c.drawImage(img, cx - px * s2, cy - py * s2, img.width * s2, img.height * s2);
        c.restore(); A.circle(c, cx, cy, r); A.fs(c, null, 5);
        return;
      }
      c.save();
      A.circle(c, cx, cy, r); c.fillStyle = bg || '#f6e7c8'; c.fill(); c.clip();
      const hy = id === 'marti' ? 66 : id === 'tarcov' ? 172 : id === 'zip' ? 236 : id === 'player' ? 116 : 214;
      const k = id === 'marti' ? r / 40 : r / 62;
      N[id] && (c.translate(cx, cy + hy * k + r * 0.12), c.scale(k, k), N[id](c, t || 0));
      c.restore();
      A.circle(c, cx, cy, r); A.fs(c, null, 5);
    }
  };
  D.NPCArt = NPCArt;
})(globalThis.DUMEN);
