// Kasaba, Liman Sokağı, iç mekânlar, harita ve ana menü sahne çizimleri.
// Kompozisyon 1920×1080 güvenli alanda; geniş/yüksek ekranlarda gökyüzü/deniz/zemin kenarlara uzatılır.
(function (D) {
  'use strict';
  const A = D.Art, OL = A.OL;
  const fs = (c, f, lw) => A.fs(c, f, lw == null ? 4 : lw);
  const SA = {};

  // Günün saatine göre gökyüzü tonu (yerel saat) — yalnız atmosfer.
  SA.skyTone = () => {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    if (h >= 6 && h < 17) return { top: '#8fd3f5', bot: '#fff0c8', sun: '#fff3b0', night: false };
    if (h >= 17 && h < 20) return { top: '#f59a6a', bot: '#ffe0a0', sun: '#ffb060', night: false };
    if (h >= 20 || h < 5) return { top: '#1d2a5a', bot: '#6a5a8a', sun: '#f5f0d0', night: true };
    return { top: '#b8a8e0', bot: '#ffd8b0', sun: '#ffe0a0', night: false };
  };

  function roofTiles(c, x, y, w, h, col) {
    c.beginPath(); c.moveTo(x - 20, y); c.lineTo(x + w / 2, y - h); c.lineTo(x + w + 20, y); c.closePath(); fs(c, col, 5);
    c.save(); c.clip(); c.strokeStyle = A.shade(col, -0.3); c.lineWidth = 2.5;
    for (let yy = y - h + 12; yy < y; yy += 14) { c.beginPath(); c.moveTo(x - 30, yy); c.lineTo(x + w + 30, yy); c.stroke(); for (let xx = x - 20 + ((yy / 14) % 2) * 12; xx < x + w + 20; xx += 24) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + 14); c.stroke(); } }
    c.restore();
  }
  function door(c, x, y, w, h, col) { A.rr(c, x, y - h, w, h, 10); fs(c, col); A.circle(c, x + w - 12, y - h / 2, 4); fs(c, '#f0c040', 2); c.strokeStyle = A.shade(col, -0.3); c.lineWidth = 2.5; c.strokeRect(x + 8, y - h + 10, w - 16, h / 2 - 16); }
  function signBoard(c, x, y, w, h, txt, bg, fg, size) { A.rr(c, x - w / 2, y - h / 2, w, h, 8); fs(c, bg || '#f5e2b8', 4.5); A.signText(c, txt, x, y + 2, size || h * 0.5, fg || '#5a2a10'); }

  // ---------------- KASABA ----------------
  SA.townStatic = (c, W, H, state) => {
    const ox = (W - 1920) / 2, oy = (H - 1080) / 2;
    const sky = SA.skyTone();
    c.fillStyle = A.lg(c, 0, 0, 0, 640 + oy, [sky.top, sky.bot]); c.fillRect(0, 0, W, H);
    c.save(); c.translate(ox, oy);
    // güneş/ay
    A.circle(c, 1500, 150, 70); c.fillStyle = A.rg(c, 1500, 150, 10, 160, [sky.sun, A.alpha(sky.sun.length === 7 ? sky.sun : '#fff3b0', 0)]); c.fill(); A.circle(c, 1500, 150, 58); c.fillStyle = sky.sun; c.fill();
    if (sky.night) { const r = A.rand(5); c.fillStyle = '#fff'; for (let i = 0; i < 80; i++) { A.circle(c, r() * 1920 - ox, r() * 380, r() * 2 + 0.5); c.fill(); } }
    // uzak tepeler + deniz feneri
    c.beginPath(); c.moveTo(-ox - 10, 560); for (let x = -ox; x <= 1920 + ox + 40; x += 40) c.lineTo(x, 470 + Math.sin(x * 0.006) * 40 + Math.sin(x * 0.017) * 18); c.lineTo(1920 + ox + 40, 700); c.lineTo(-ox - 10, 700); c.closePath(); fs(c, sky.night ? '#3a4a5a' : '#8cc08a', 0);
    c.beginPath(); c.moveTo(-ox - 10, 600); for (let x = -ox; x <= 1920 + ox + 40; x += 40) c.lineTo(x, 540 + Math.sin(x * 0.009 + 2) * 30); c.lineTo(1920 + ox + 40, 700); c.lineTo(-ox - 10, 700); c.closePath(); fs(c, sky.night ? '#2e3e4a' : '#6aa86a', 0);
    A.rr(c, 1760, 330, 44, 180, 6); fs(c, '#f5efe0'); c.fillStyle = '#e0453d'; c.fillRect(1760, 370, 44, 22); c.fillRect(1760, 430, 44, 22); c.strokeStyle = OL; c.lineWidth = 4; c.strokeRect(1760, 330, 44, 180); A.rr(c, 1750, 300, 64, 34, 6); fs(c, '#ffe08a'); c.beginPath(); c.moveTo(1748, 300); c.lineTo(1782, 270); c.lineTo(1816, 300); c.closePath(); fs(c, '#c9302c');
    // zemin / rıhtım
    c.fillStyle = A.lg(c, 0, 690, 0, 800, ['#d8c09a', '#c0a47a']); c.fillRect(-ox, 690, W, 110);
    c.strokeStyle = 'rgba(90,60,30,0.25)'; c.lineWidth = 2; for (let x = -ox; x < 1920 + ox; x += 46) { c.beginPath(); c.moveTo(x, 700); c.lineTo(x - 20, 790); c.stroke(); }
    // EV
    A.rr(c, 90, 460, 280, 280, 8); fs(c, '#6fb0d8'); roofTiles(c, 90, 460, 280, 130, '#c9483a');
    A.rr(c, 300, 330, 34, 80, 4); fs(c, '#8a5a3a');
    A.window(c, 120, 520, 70, 70, sky.night); A.window(c, 270, 520, 70, 70, sky.night); door(c, 200, 740, 64, 130, '#8a4a2a');
    A.rr(c, 110, 610, 90, 22, 6); fs(c, '#8a5a3a', 3); c.fillStyle = '#e0453d'; for (const x of [124, 146, 168, 190]) { A.circle(c, x, 606, 9); c.fill(); }
    signBoard(c, 230, 425, 150, 40, 'EVİM', '#f5e2b8', '#5a2a10', 22);
    // İLAN PANOSU (evin yanı)
    A.rr(c, 398, 560, 14, 180, 3); fs(c, '#6a4a2a'); A.rr(c, 518, 560, 14, 180, 3); fs(c, '#6a4a2a');
    A.planks(c, 380, 520, 170, 150, '#b07a4a', 4, true);
    signBoard(c, 465, 520, 160, 34, 'İLAN PANOSU', '#f2d14a', '#5a2a10', 18);
    // BALIK PAZARI (Rüstem)
    A.planks(c, 580, 560, 300, 180, '#b88a5a', 5, false);
    c.beginPath(); c.moveTo(560, 560); c.lineTo(900, 560); c.lineTo(880, 500); c.lineTo(580, 500); c.closePath(); fs(c, '#ffffff');
    c.save(); c.clip(); c.fillStyle = '#3d6fb0'; for (let x = 560; x < 900; x += 40) { c.beginPath(); c.moveTo(x, 560); c.lineTo(x + 20, 560); c.lineTo(x + 20 + 4, 500); c.lineTo(x + 4, 500); c.fill(); } c.restore();
    c.beginPath(); c.moveTo(560, 560); c.lineTo(900, 560); c.lineTo(880, 500); c.lineTo(580, 500); c.closePath(); fs(c, null);
    for (let x = 570; x < 900; x += 34) { c.beginPath(); c.arc(x + 17, 560, 17, 0, Math.PI); fs(c, x % 68 < 34 ? '#3d6fb0' : '#fff', 3); }
    A.rr(c, 600, 640, 260, 70, 6); fs(c, '#d9eef8'); c.fillStyle = '#ffffff'; for (let x = 610; x < 850; x += 20) { A.circle(c, x, 650, 8); c.fill(); }
    ['EL_02', 'EL_03', 'TS_01', 'EL_05'].forEach((id, i) => D.FishArt.draw(c, id, 640 + i * 62, 660, 54, { t: 0.2, noAura: true }));
    signBoard(c, 730, 470, 230, 46, 'BALIK PAZARI', '#3d6fb0', '#ffffff', 24);
    // MARKET
    A.rr(c, 910, 470, 250, 270, 8); fs(c, '#f2c84a'); A.rr(c, 896, 450, 278, 30, 8); fs(c, '#c98a1a');
    A.rr(c, 940, 560, 190, 100, 6); fs(c, A.lg(c, 0, 560, 0, 660, ['#d9f0ff', '#8ec8e8']));
    for (let i = 0; i < 5; i++) D.ItemArt.draw(c, 'BAIT_0' + (i + 1), 965 + i * 36, 640, 36);
    D.ItemArt.draw(c, 'ROD_02', 1000, 595, 46); D.ItemArt.draw(c, 'ROD_05', 1070, 595, 46);
    door(c, 1060, 740, 60, 70, '#3d8fe0');
    signBoard(c, 1035, 510, 190, 46, 'MARKET', '#e0453d', '#ffffff', 26);
    // HURDACI HASAN
    c.beginPath(); c.moveTo(1180, 740); c.lineTo(1180, 520); c.lineTo(1310, 470); c.lineTo(1440, 520); c.lineTo(1440, 740); c.closePath(); fs(c, '#8a949e');
    c.save(); c.clip(); c.strokeStyle = 'rgba(40,40,50,0.35)'; c.lineWidth = 3; for (let x = 1180; x < 1440; x += 16) { c.beginPath(); c.moveTo(x, 460); c.lineTo(x, 740); c.stroke(); } c.fillStyle = 'rgba(194,107,45,0.45)'; A.ellipse(c, 1230, 690, 30, 40); c.fill(); A.ellipse(c, 1400, 560, 26, 18); c.fill(); c.restore();
    c.beginPath(); c.moveTo(1180, 740); c.lineTo(1180, 520); c.lineTo(1310, 470); c.lineTo(1440, 520); c.lineTo(1440, 740); fs(c, null);
    A.rr(c, 1250, 620, 120, 120, 6); fs(c, '#3a3a3a'); c.strokeStyle = '#5a5f66'; c.lineWidth = 3; for (let y = 632; y < 740; y += 14) { c.beginPath(); c.moveTo(1252, y); c.lineTo(1368, y); c.stroke(); }
    // hurda yığını
    for (const [x, y, r, col] of [[1460, 720, 24, '#2a2a2a'], [1170, 726, 20, '#c26b2d'], [1450, 690, 16, '#9aa7b2']]) { A.circle(c, x, y, r); fs(c, col); A.circle(c, x, y, r * 0.45); fs(c, A.shade(col, 0.3), 3); }
    signBoard(c, 1310, 560, 210, 42, 'HURDACI HASAN', '#5a5f66', '#f2d14a', 20);
    c.save(); c.translate(1310, 505); c.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.lineTo(Math.cos(a) * (i % 2 ? 26 : 20), Math.sin(a) * (i % 2 ? 26 : 20)); } c.closePath(); fs(c, '#d9a05a', 3); A.circle(c, 0, 0, 7); fs(c, '#5a5f66', 2); c.restore();
    // DENİZİN DEFTERİ (Kaya Usta)
    A.rr(c, 1470, 500, 210, 240, 8); fs(c, '#c8b8a0'); c.save(); A.rr(c, 1470, 500, 210, 240, 8); c.clip(); c.strokeStyle = 'rgba(80,60,40,0.3)'; c.lineWidth = 2; for (let y = 520; y < 740; y += 24) for (let x = 1470 + ((y / 24) % 2) * 20; x < 1680; x += 40) { c.strokeRect(x, y, 40, 24); } c.restore();
    roofTiles(c, 1470, 500, 210, 80, '#2a5a8a');
    A.window(c, 1494, 560, 60, 60, sky.night); door(c, 1580, 740, 70, 120, '#2a5a8a');
    c.save(); c.translate(1575, 470); A.rr(c, -50, -30, 100, 60, 6); fs(c, '#f5efe0'); c.fillStyle = '#2a5a8a'; c.fillRect(-3, -30, 6, 60); c.restore();
    signBoard(c, 1575, 655, 190, 40, 'DENİZİN DEFTERİ', '#2a5a8a', '#ffffff', 19);
    // YENİ SOKAK girişi
    A.rr(c, 1700, 470, 40, 270, 6); fs(c, '#d8a070'); A.rr(c, 1880, 470, 40, 270, 6); fs(c, '#d8a070');
    c.beginPath(); c.moveTo(1700, 480); c.quadraticCurveTo(1810, 380, 1920, 480); c.lineTo(1920, 500); c.quadraticCurveTo(1810, 410, 1700, 500); c.closePath(); fs(c, '#c9483a');
    c.fillStyle = A.lg(c, 0, 500, 0, 740, ['#7a5a8a', '#3a2a4a']); c.fillRect(1740, 500, 140, 240);
    c.fillStyle = 'rgba(255,220,150,0.25)'; for (let i = 0; i < 5; i++) { A.ellipse(c, 1810, 540 + i * 44, 50 - i * 6, 10); c.fill(); }
    c.save(); c.translate(1810, 600); A.rr(c, -70, -24, 140, 48, 8); fs(c, '#2a6a5a'); A.signText(c, 'YENİ SOKAK →', 0, 2, 20, '#ffffff'); c.restore();
    // rıhtım duvarı ve iskele
    c.fillStyle = A.lg(c, 0, 780, 0, 830, ['#9a8a7a', '#6a5a4a']); c.fillRect(-ox, 790, W, 30);
    c.strokeStyle = 'rgba(40,30,20,0.4)'; c.lineWidth = 2; for (let x = -ox; x < 1920 + ox; x += 60) c.strokeRect(x, 790, 60, 30);
    A.planks(c, 170, 800, 330, 70, '#a8743a', 7, true);
    for (const x of [180, 300, 420, 490]) { A.rr(c, x, 860, 16, 90, 4); fs(c, '#6a4a2a'); }
    A.rr(c, 440, 790, 30, 34, 8); fs(c, '#3a3a3a'); A.rr(c, 434, 784, 42, 12, 4); fs(c, '#5a5f66'); // baba (halat bağı)
    c.restore();
  };

  SA.townAnim = (c, W, H, t, state, info) => {
    const ox = (W - 1920) / 2, oy = (H - 1080) / 2;
    const sky = SA.skyTone();
    c.save(); c.translate(ox, oy);
    // bulutlar (biri hiç hareket etmez — Komplo teorisi)
    for (let i = 0; i < 4; i++) { const x = ((t * (8 + i * 3) + i * 600) % (2400 + ox * 2)) - 300 - ox; A.cloud(c, x, 110 + i * 55, 0.8 + i * 0.15, sky.night ? '#8a90b0' : '#fffaf0'); }
    A.cloud(c, 1180, 210, 0.7, sky.night ? '#9aa0c0' : '#fffdf5');
    // baca dumanı
    for (let i = 0; i < 5; i++) { const k = (t * 0.25 + i / 5) % 1; A.circle(c, 318 + Math.sin(k * 6) * 10 + k * 30, 320 - k * 140, 14 + k * 20); c.fillStyle = `rgba(240,240,240,${0.55 * (1 - k)})`; c.fill(); }
    // eğri lamba (inceleme noktası)
    c.save(); c.translate(566, 790); c.rotate(-0.14); A.rr(c, -6, -190, 12, 190, 4); fs(c, '#2a3a4a'); A.rr(c, -22, -214, 44, 30, 8); fs(c, sky.night ? '#ffe08a' : '#f5efe0'); c.restore();
    A.shadow(c, 566, 792, 8, 4, 0.3); c.fillStyle = 'rgba(20,10,5,0.22)'; c.fillRect(562, 792 - 190, 0, 0); c.save(); c.globalAlpha = 0.22; c.fillStyle = '#000'; c.fillRect(564, 600, 8, 190); c.restore();
    // pano kağıtları (teklif sayısı)
    const n = info.offers || 0;
    for (let i = 0; i < n; i++) { const x = 398 + (i % 2) * 74, y = 552 + Math.floor(i / 2) * 58; c.save(); c.translate(x + 30, y + 22); c.rotate(Math.sin(i * 3 + t * 0.6) * 0.04 + (i % 2 ? 0.05 : -0.04)); A.rr(c, -30, -22, 60, 46, 2); fs(c, '#fffaf0', 3); c.fillStyle = '#c9302c'; A.circle(c, 0, -18, 4); c.fill(); c.strokeStyle = '#8a7a5a'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-22, -6 + k * 9); c.lineTo(22, -6 + k * 9); c.stroke(); } c.restore(); }
    if (info.completable) { c.fillStyle = '#4fb36b'; A.circle(c, 540, 520, 16); c.fill(); A.signText(c, '!', 540, 521, 22, '#fff'); }
    // deniz
    c.restore();
    c.save();
    const seaTop = 830 + oy;
    c.fillStyle = A.lg(c, 0, seaTop, 0, H, [sky.night ? '#1d3a6a' : '#3aa6cf', sky.night ? '#0a1a3a' : '#1a6a92']); c.fillRect(0, seaTop, W, H - seaTop);
    A.waves(c, 0, W, seaTop + 6, 6, 160, t * 1.4, sky.night ? '#2a4a7a' : '#5ec0e0', null, H);
    A.waves(c, 0, W, seaTop + 60, 8, 220, -t * 1.1, sky.night ? '#1d3a6a' : '#3aa6cf', null, H);
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 3; for (let i = 0; i < 18; i++) { const x = ((i * 157 + t * 30) % (W + 200)) - 100, y = seaTop + 40 + (i * 37) % (H - seaTop - 40); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 18, y - 6, x + 36, y); c.stroke(); }
    c.restore();
    c.save(); c.translate(ox, oy);
    for (const x of [180, 300, 420, 490]) { A.rr(c, x, 860, 16, 90, 4); fs(c, '#6a4a2a', 3); }
    // tekne (halatla bağlı, dalgayla sallanır)
    const bx = 300, by = 935 + Math.sin(t * 1.3) * 6, lvl = state.boat.level;
    A.ellipse(c, bx, by + 30, 190, 14); c.fillStyle = 'rgba(10,40,70,0.3)'; c.fill();
    D.BoatArt.draw(c, lvl, bx, by, 0.58, t, { flag: state.cosmetics.equipped.flag, paint: state.cosmetics.equipped.paint, night: sky.night });
    const half = D.boatLevel(lvl).visual.len / 2 * 0.58;
    const bowX = bx + half + 10, bowY = by - 20;
    const sag = 18 + Math.max(0, 30 - Math.hypot(455 - bowX, 800 - bowY) * 0.1) + Math.sin(t * 1.3) * 8;
    A.rope(c, 455, 796, bowX, bowY, sag);
    // martı teknede
    D.NPCArt.draw(c, 'marti', bx - 40, by - 40 - Math.sin(t * 1.3) * 2, 0.7, t);
    c.restore();
  };

  // ---------------- YENİ SOKAK ----------------
  SA.streetStatic = (c, W, H) => {
    const ox = (W - 1920) / 2, oy = (H - 1080) / 2;
    const sky = SA.skyTone();
    c.fillStyle = A.lg(c, 0, 0, 0, 500 + oy, [sky.night ? '#1d2a5a' : '#c8a8e0', sky.night ? '#5a4a7a' : '#ffe0c0']); c.fillRect(0, 0, W, H);
    c.save(); c.translate(ox, oy);
    // arnavut kaldırımı
    c.fillStyle = A.lg(c, 0, 760, 0, 1080, ['#a89a8a', '#7a6a5a']); c.fillRect(-ox, 760, W, 400);
    const r = A.rand(9); for (let y = 770; y < 1080 + oy; y += 26) for (let x = -ox + ((y / 26) % 2) * 22; x < 1920 + ox; x += 44) { A.rr(c, x + r() * 4, y, 40, 22, 9); c.fillStyle = A.mix('#b8aa98', '#8a7a68', r()); c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(40,30,20,0.35)'; c.stroke(); }
    // ZIPIRLEONE'NİN MEKANI
    A.rr(c, 100, 330, 560, 430, 10); fs(c, '#5a1a2a'); c.save(); A.rr(c, 100, 330, 560, 430, 10); c.clip(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 3; for (let x = 100; x < 660; x += 28) { c.beginPath(); c.moveTo(x, 330); c.lineTo(x, 760); c.stroke(); } c.restore();
    A.rr(c, 86, 310, 588, 34, 8); fs(c, '#2a0a14');
    A.rr(c, 300, 560, 160, 200, 12); fs(c, '#1a0a10'); A.rr(c, 360, 600, 40, 14, 4); fs(c, '#f0c040', 3);
    for (const x of [140, 500]) { A.window(c, x, 420, 110, 90, true, '#2a0a14'); c.fillStyle = 'rgba(160,20,40,0.5)'; c.fillRect(x + 4, 424, 102, 82); }
    // kadife ip
    for (const x of [260, 500]) { A.rr(c, x, 680, 12, 80, 4); fs(c, '#f0c040', 3); A.circle(c, x + 6, 678, 9); fs(c, '#f0c040', 3); }
    c.beginPath(); c.moveTo(266, 700); c.quadraticCurveTo(380, 760, 506, 700); c.lineWidth = 10; c.strokeStyle = OL; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#c9302c'; c.stroke();
    // FABRİKA
    A.rr(c, 720, 300, 520, 460, 8); fs(c, '#a8543a'); c.save(); A.rr(c, 720, 300, 520, 460, 8); c.clip(); c.strokeStyle = 'rgba(60,20,10,0.3)'; c.lineWidth = 2; for (let y = 300; y < 760; y += 20) for (let x = 720 + ((y / 20) % 2) * 20; x < 1240; x += 40) c.strokeRect(x, y, 40, 20); c.restore();
    for (const x of [770, 1120]) { A.rr(c, x, 170, 60, 140, 4); fs(c, '#8a3a2a'); c.fillStyle = '#e8e0d0'; c.fillRect(x, 190, 60, 14); c.strokeStyle = OL; c.strokeRect(x, 190, 60, 14); }
    A.rr(c, 800, 600, 200, 160, 8); fs(c, '#4a5a4a'); A.rr(c, 1040, 600, 150, 160, 8); fs(c, '#3a3a3a');
    c.save(); c.translate(980, 440); c.fillStyle = '#4fb36b'; for (let i = 0; i < 3; i++) { c.save(); c.rotate((i / 3) * Math.PI * 2); c.beginPath(); c.moveTo(-14, -60); c.lineTo(30, -60); c.lineTo(46, -36); c.lineTo(30, -36); c.lineTo(20, -50); c.lineTo(-6, -50); c.closePath(); A.fs(c, '#4fb36b', 4); c.restore(); } c.restore();
    // TEKNE ATÖLYESİ
    c.beginPath(); c.moveTo(1290, 760); c.lineTo(1290, 400); c.lineTo(1550, 290); c.lineTo(1810, 400); c.lineTo(1810, 760); c.closePath(); A.fs(c, '#b8865a', 5);
    c.save(); c.clip(); c.strokeStyle = 'rgba(80,50,20,0.4)'; c.lineWidth = 3; for (let x = 1290; x < 1810; x += 26) { c.beginPath(); c.moveTo(x, 280); c.lineTo(x, 760); c.stroke(); } c.restore();
    A.rr(c, 1360, 470, 380, 290, 10); fs(c, '#3a2a1a');
    c.restore();
  };
  SA.streetAnim = (c, W, H, t, state, info) => {
    const ox = (W - 1920) / 2, oy = (H - 1080) / 2;
    c.save(); c.translate(ox, oy);
    // neon tabela
    const on = Math.sin(t * 7) > -0.85;
    c.save(); c.shadowColor = '#ff4f8a'; c.shadowBlur = on ? 18 : 0;
    A.signText(c, 'Zıpırleone\'nin Mekanı', 380, 286, 34, on ? '#ff8ab8' : '#7a3a5a', '#2a0a14');
    c.restore();
    c.save(); c.translate(380, 230); c.fillStyle = on ? '#ff8ab8' : '#7a3a5a'; c.beginPath(); c.moveTo(-26, 10); c.lineTo(-30, -24); c.lineTo(-12, -10); c.lineTo(12, -10); c.lineTo(30, -24); c.lineTo(26, 10); c.quadraticCurveTo(0, 30, -26, 10); c.fill(); c.restore();
    // baca dumanı (fabrika)
    for (const x0 of [800, 1150]) for (let i = 0; i < 5; i++) { const k = (t * 0.2 + i / 5 + x0 * 0.001) % 1; A.circle(c, x0 + Math.sin(k * 5) * 12 + k * 40, 170 - k * 150, 18 + k * 26); c.fillStyle = `rgba(200,200,200,${0.5 * (1 - k)})`; c.fill(); }
    // fabrika bandı
    c.fillStyle = '#2a2a2a'; c.fillRect(806, 690, 188, 14); for (let i = 0; i < 6; i++) { const x = 806 + ((t * 40 + i * 32) % 188); D.ItemArt.drawTrash(c, ['T_LID', 'T_SOCK', 'T_BAG'][i % 3], x, 676, 26); }
    A.signText(c, 'GERİ DÖNÜŞÜM FABRİKASI', 980, 340, 28, '#fff', OL);
    // atölye içindeki tekne
    D.BoatArt.draw(c, state.boat.level, 1550, 690, 0.55, t, { still: true, flag: state.cosmetics.equipped.flag, paint: state.cosmetics.equipped.paint });
    for (const x of [1440, 1660]) { A.rr(c, x, 700, 16, 60, 3); A.fs(c, '#6a4a2a', 3); }
    A.signText(c, 'TEKNE ATÖLYESİ', 1550, 420, 30, '#fff', OL);
    c.save(); c.translate(1550, 360); c.beginPath(); c.moveTo(0, -30); c.lineTo(0, 30); c.moveTo(-24, 14); c.quadraticCurveTo(0, 44, 24, 14); c.moveTo(-14, -16); c.lineTo(14, -16); c.lineWidth = 9; c.strokeStyle = OL; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#d9dde6'; c.stroke(); A.circle(c, 0, -36, 8); A.fs(c, '#d9dde6', 4); c.restore();
    // şüpheli sandıklar (T1)
    if (info.crates) for (let i = 0; i < 3; i++) { const x = 560 + (i % 2) * 70, y = 760 - (i === 2 ? 64 : 0) - 64; A.rr(c, x - (i === 2 ? -35 : 0), y, 64, 64, 4); A.fs(c, '#8a6a4a', 4); A.signText(c, 'BALIK DEĞİLDİR', x + 32 + (i === 2 ? 35 : 0), y + 32, 8, '#2a1a10'); }
    c.restore();
  };

  // ---------------- İÇ MEKÂN ----------------
  // ---- Kullanıcı çizimi iç mekân arka planları ----
  // side: bilgi panelinin yeri (önemli öğe görünür kalsın). npcs: {id, fx, fy (ayak), h (görsel yüksekliği oranı)}.
  // occ: karakterin önüne yeniden çizilen ön plan parçası (tezgâh vb.). hots: görsel üzerindeki dokunma alanları.
  const BGL = {
    home: { side: 'right', npcs: [], hots: [{ key: 'board', f: [0.09, 0.08, 0.32, 0.54], label: 'İlan Panosu', fn: () => D.Scenes.openJournal('board') }] },
    belediye: { side: 'left', npcs: [{ id: 'baskan', fx: 0.66, fy: 0.99, h: 0.62 }, { id: 'kaya', fx: 0.9, fy: 1.0, h: 0.66 }], hots: [{ key: 'aquarium', f: [0.53, 0.04, 0.25, 0.5], label: 'Akvaryum — Denizin Defteri', fn: () => D.Scenes.openFishpedia() }] },
    rustem: { side: 'left', npcs: [{ id: 'rustem', fx: 0.6, fy: 0.84, h: 0.5 }], occ: [[0.37, 0.6, 0.37, 0.36]] },
    market: { side: 'right', npcs: [{ id: 'market', fx: 0.3, fy: 0.97, h: 0.58 }] },
    hasan: { side: 'right', npcs: [{ id: 'hasan', fx: 0.28, fy: 0.95, h: 0.62 }] },
    factory: { side: 'right', npcs: [{ id: 'factory', fx: 0.27, fy: 0.98, h: 0.66 }] },
    boatyard: { side: 'right', npcs: [{ id: 'kropi', fx: 0.24, fy: 0.97, h: 0.62 }] },
    zip: { side: 'left', npcs: [{ id: 'tekir', fx: 0.58, fy: 0.99, h: 0.42 }, { id: 'zip', fx: 0.76, fy: 0.93, h: 0.52 }], hots: [] },
    komplo: { side: 'right', npcs: [{ id: 'komplo', fx: 0.2, fy: 0.95, h: 0.44 }] }
  };
  SA.BG_LAYOUT = BGL;
  SA.bgImage = (kind) => (D.Assets ? D.Assets.get('bg_' + kind) : null);
  SA.bgFit = (kind, W, H) => {
    const img = SA.bgImage(kind); if (!img) return null;
    const k = Math.max(W / img.width, H / img.height);
    return { k, ox: (W - img.width * k) / 2, oy: (H - img.height * k) / 2, iw: img.width, ih: img.height, img };
  };
  SA.bgRect = (kind, f) => {
    const v = D.UI.view, F = SA.bgFit(kind, v.W, v.H); if (!F) return null;
    return { left: F.ox + f[0] * F.iw * F.k, top: F.oy + f[1] * F.ih * F.k, width: f[2] * F.iw * F.k, height: f[3] * F.ih * F.k };
  };
  SA.interior = (c, W, H, t, kind, state) => {
    const F = SA.bgFit(kind, W, H);
    if (F) {
      D.SM.drawStatic(c, 'bg-' + kind, (cc, w, hh) => { const G = SA.bgFit(kind, w, hh); cc.drawImage(G.img, G.ox, G.oy, G.iw * G.k, G.ih * G.k); });
      const L = BGL[kind] || {};
      for (const n of L.npcs || []) {
        const x = F.ox + n.fx * F.iw * F.k, y = F.oy + n.fy * F.ih * F.k;
        D.NPCArt.draw(c, n.id, x, y, (n.h * F.ih * F.k) / 280, t, n.id === 'player' ? { hat: state.cosmetics.equipped.hat } : null);
      }
      for (const o of L.occ || []) c.drawImage(F.img, o[0] * F.iw, o[1] * F.ih, o[2] * F.iw, o[3] * F.ih, F.ox + o[0] * F.iw * F.k, F.oy + o[1] * F.ih * F.k, o[2] * F.iw * F.k, o[3] * F.ih * F.k);
      return;
    }
    const ox = (W - 1920) / 2, oy = (H - 1080) / 2;
    const P = {
      rustem: { wall: '#7ab8d8', wall2: '#5a98b8', floor: '#c8a878' },
      market: { wall: '#f5e0a0', wall2: '#e8c870', floor: '#b8a088' },
      hasan: { wall: '#6a6f74', wall2: '#5a5f64', floor: '#4a4038' },
      factory: { wall: '#7a8a7a', wall2: '#5a6a5a', floor: '#3a3a3a' },
      boatyard: { wall: '#c8a070', wall2: '#a88050', floor: '#7a6040' },
      zip: { wall: '#4a1020', wall2: '#3a0a18', floor: '#2a1a14' },
      venue: { wall: '#1a2a3a', wall2: '#12202e', floor: '#3a2a1a' },
      kaya: { wall: '#d8c8a8', wall2: '#c0b090', floor: '#8a6a4a' },
      home: { wall: '#c8925a', wall2: '#a8743a', floor: '#7a5a3a' },
      belediye: { wall: '#eee6d6', wall2: '#d8ccb4', floor: '#9a8a7a' },
      komplo: { wall: '#5a5a44', wall2: '#3e3e2e', floor: '#4a3a2a' }
    }[kind];
    c.fillStyle = A.lg(c, 0, 0, 0, H * 0.75, [P.wall, P.wall2]); c.fillRect(0, 0, W, H);
    c.fillStyle = A.lg(c, 0, H * 0.74, 0, H, [P.floor, A.shade(P.floor, -0.3)]); c.fillRect(0, H * 0.74, W, H);
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 3; for (let x = -ox; x < W; x += 90) { c.beginPath(); c.moveTo(x, H * 0.74); c.lineTo(x - 60, H); c.stroke(); }
    c.fillStyle = A.shade(P.wall2, -0.25); c.fillRect(0, H * 0.72, W, 14);
    c.save(); c.translate(ox, oy);
    const draw = SA.decor[kind]; if (draw) draw(c, t, state);
    c.restore();
  };
  SA.decor = {
    rustem(c, t) {
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(200 + i * 220, 0); c.lineTo(200 + i * 220, 90); c.lineWidth = 3; c.strokeStyle = OL; c.stroke(); c.beginPath(); c.arc(200 + i * 220, 110, 30, Math.PI, 0); A.fs(c, '#f2d14a', 4); c.fillStyle = A.rg(c, 200 + i * 220, 120, 4, 140, ['rgba(255,240,180,0.35)', 'rgba(255,240,180,0)']); A.circle(c, 200 + i * 220, 120, 140); c.fill(); }
      A.planks(c, 60, 640, 740, 180, '#9a6a3a', 6, false);
      A.rr(c, 90, 600, 680, 60, 8); A.fs(c, '#d9eef8', 4); c.fillStyle = '#fff'; for (let x = 100; x < 760; x += 18) { A.circle(c, x, 610, 7); c.fill(); }
      ['EL_01', 'EL_02', 'EL_03', 'EL_04', 'TS_01', 'EL_05'].forEach((id, i) => D.FishArt.draw(c, id, 150 + i * 105, 620, 80, { t: 0.2, noAura: true }));
      D.NPCArt.draw(c, 'rustem', 420, 610, 1.4, t);
      A.rr(c, 640, 430, 80, 120, 6); A.fs(c, '#c9ccd0', 4); A.circle(c, 680, 470, 26); A.fs(c, '#fff', 3); // terazi
      A.signText(c, 'RÜSTEM AGA\'NIN BALIK PAZARI', 430, 300, 42, '#fff', OL);
    },
    market(c, t) {
      for (let r = 0; r < 3; r++) { A.rr(c, 60, 200 + r * 150, 760, 18, 4); A.fs(c, '#8a5a3a', 4); for (let i = 0; i < 9; i++) D.ItemArt.draw(c, 'BAIT_' + D.pad2(((i + r * 5) % 14) + 1), 100 + i * 82, 172 + r * 150, 62); }
      for (let i = 0; i < 5; i++) D.ItemArt.draw(c, 'ROD_0' + (i + 1), 120 + i * 120, 720, 120);
      D.NPCArt.draw(c, 'market', 760, 830, 1.1, t);
      A.signText(c, 'MARKET', 440, 110, 60, '#e0453d', '#fff');
    },
    hasan(c, t) {
      for (const [x, y, r, sp] of [[180, 220, 70, 0.5], [300, 160, 46, -0.8], [110, 120, 36, 1.1]]) { c.save(); c.translate(x, y); c.rotate(t * sp); c.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; c.lineTo(Math.cos(a) * (i % 2 ? r : r * 0.8), Math.sin(a) * (i % 2 ? r : r * 0.8)); } c.closePath(); A.fs(c, '#9a7a4a', 4); A.circle(c, 0, 0, r * 0.3); A.fs(c, '#5a5f66', 3); c.restore(); }
      A.rr(c, 480, 600, 220, 60, 8); A.fs(c, '#3a3a3a', 4); A.rr(c, 540, 660, 100, 140, 6); A.fs(c, '#2a2a2a', 4); // örs
      if (Math.sin(t * 4) > 0.6) for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 4) * 0.25; c.strokeStyle = '#ffd04a'; c.lineWidth = 3; c.beginPath(); c.moveTo(590, 598); c.lineTo(590 + Math.cos(a) * 60, 598 + Math.sin(a) * 60); c.stroke(); }
      for (const [x, y, col] of [[100, 760, '#2a2a2a'], [170, 740, '#c26b2d'], [760, 760, '#5a5f66']]) { A.circle(c, x, y, 50); A.fs(c, col, 4); }
      D.NPCArt.draw(c, 'hasan', 360, 830, 1.35, t);
      A.signText(c, 'HURDACI HASAN', 520, 120, 52, '#f2d14a', OL);
    },
    factory(c, t) {
      c.fillStyle = '#2a2a2a'; c.fillRect(0, 620, 880, 30);
      for (let i = 0; i < 10; i++) { const x = (t * 70 + i * 90) % 900; D.ItemArt.drawTrash(c, ['T_LID', 'T_SOCK', 'T_BAG', 'T_GEAR', 'T_BOTTLE'][i % 5], x, 596, 48); }
      for (let i = 0; i < 6; i++) { A.circle(c, 30 + i * 160, 635, 14); A.fs(c, '#5a5f66', 3); }
      A.rr(c, 560, 260, 300, 340, 10); A.fs(c, '#5a6a5a', 4); A.rr(c, 600, 300, 220, 120, 8); A.fs(c, '#1a2a1a', 4);
      c.fillStyle = '#3cff6c'; c.font = 'bold 26px monospace'; c.fillText('BAYAT→%', 620, 350); c.fillText('ÇÖP→MAT', 620, 390);
      for (let i = 0; i < 4; i++) { const k = (t * 0.4 + i / 4) % 1; A.circle(c, 700 + Math.sin(k * 6) * 12, 250 - k * 200, 20 + k * 20); c.fillStyle = `rgba(230,230,230,${0.5 * (1 - k)})`; c.fill(); }
      D.NPCArt.draw(c, 'factory', 330, 830, 1.3, t);
      A.signText(c, 'GERİ DÖNÜŞÜM FABRİKASI', 440, 110, 46, '#fff', OL);
    },
    boatyard(c, t, s) {
      c.fillStyle = A.lg(c, 0, 640, 0, 900, ['#3aa6cf', '#1a6a92']); c.fillRect(0, 700, 900, 400);
      A.waves(c, 0, 900, 702, 5, 140, t, '#5ec0e0', null, 1080);
      D.BoatArt.draw(c, s.boat.level, 470, 760, 0.95, t, { flag: s.cosmetics.equipped.flag, paint: s.cosmetics.equipped.paint });
      for (const x of [60, 820]) { A.rr(c, x, 200, 30, 540, 4); A.fs(c, '#6a4a2a', 4); }
      c.beginPath(); c.moveTo(75, 220); c.lineTo(835, 220); c.lineWidth = 8; c.strokeStyle = OL; c.stroke();
      D.NPCArt.draw(c, 'kropi', 140, 1000, 1.25, t);
      A.signText(c, 'TEKNE ATÖLYESİ', 450, 110, 52, '#fff', OL);
    },
    zip(c, t, s) {
      for (const x of [0, 820]) { c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 60, 400, x + 20, 800); c.lineTo(x + 100, 800); c.quadraticCurveTo(x + 140, 400, x + 100, 0); c.closePath(); A.fs(c, '#8a1a2a', 4); }
      D.NPCArt.draw(c, 'zip', 460, 700, 1.35, t); // Don masanın arkasında, koltuğunda
      A.rr(c, 200, 560, 520, 90, 10); A.fs(c, '#3a1a10', 4); A.rr(c, 230, 650, 460, 200, 6); A.fs(c, '#2a100a', 4);
      c.fillStyle = A.rg(c, 460, 380, 20, 420, ['rgba(255,200,120,0.28)', 'rgba(0,0,0,0)']); c.fillRect(0, 0, 920, 900);
      D.NPCArt.draw(c, 'tekir', 790, 880, 1.0, t); // sağ kol
      if (s.flags.wheelUnlocked) { c.save(); c.translate(760, 280); c.rotate(t * 0.1); for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 90, (i / 12) * 6.283, ((i + 1) / 12) * 6.283); c.closePath(); A.fs(c, D.WheelDB.segments[i].color, 2.5); } A.circle(c, 0, 0, 14); A.fs(c, '#f0c040', 3); c.restore(); }
      A.signText(c, 'Zıpırleone\'nin Mekanı', 460, 110, 48, '#ff8ab8', '#2a0a14');
    },
    venue(c, t) {
      for (let i = 0; i < 7; i++) { c.save(); c.translate(130 + i * 110, 0); c.fillStyle = 'rgba(240,192,64,0.25)'; c.beginPath(); c.moveTo(-40, 0); c.lineTo(0, 160); c.lineTo(40, 0); c.fill(); c.restore(); }
      A.rr(c, 90, 230, 300, 280, 10); A.fs(c, '#5a3a1a', 4); A.rr(c, 110, 250, 260, 160, 80); A.fs(c, A.lg(c, 0, 250, 0, 410, ['#ff8ab8', '#b07cff', '#5ff5e0']), 4); // jukebox
      for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i / 4) % 1; A.signText(c, '♪', 250 + Math.sin(k * 6 + i) * 60, 230 - k * 160, 30, `rgba(255,220,140,${1 - k})`); }
      A.rr(c, 500, 200, 340, 260, 6); A.fs(c, '#2a1a10', 4); for (let i = 0; i < 6; i++) { A.rr(c, 520 + (i % 3) * 106, 220 + Math.floor(i / 3) * 120, 90, 100, 4); A.fs(c, '#f5efe0', 3); }
      A.signText(c, 'HATIRA DUVARI', 670, 180, 26, '#f0c040', OL);
      D.NPCArt.draw(c, 'zip', 640, 860, 1.1, t);
      A.signText(c, 'ARKA ODA', 460, 100, 56, '#f0c040', '#1a0a00');
    },
    home(c, t, s) {
      A.planks(c, 30, 40, 860, 740, '#b98a5a', 10, true);
      // pencere: deniz manzarası
      A.rr(c, 90, 140, 260, 200, 10); A.fs(c, A.lg(c, 0, 140, 0, 340, ['#8fd3f5', '#3aa6cf']), 5);
      A.waves(c, 92, 348, 270, 4, 60, t * 1.5, '#5ec0e0', null, 338);
      c.strokeStyle = '#f6efe0'; c.lineWidth = 6; c.beginPath(); c.moveTo(220, 142); c.lineTo(220, 338); c.moveTo(92, 240); c.lineTo(348, 240); c.stroke();
      A.rr(c, 70, 330, 300, 24, 6); A.fs(c, '#8a5a3a', 4);
      // yatak
      A.rr(c, 60, 610, 380, 140, 24); A.fs(c, '#3d6fb0', 5); A.rr(c, 70, 590, 110, 60, 20); A.fs(c, '#fff6df', 4);
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 4; for (let x = 200; x < 430; x += 40) { c.beginPath(); c.moveTo(x, 616); c.lineTo(x, 744); c.stroke(); }
      // kapının yanındaki ilan panosu
      A.rr(c, 560, 230, 16, 360, 4); A.fs(c, '#6a4a2a', 3); A.rr(c, 824, 230, 16, 360, 4); A.fs(c, '#6a4a2a', 3);
      A.planks(c, 540, 200, 320, 250, '#a8743a', 5, true);
      A.rr(c, 600, 172, 200, 46, 10); A.fs(c, '#f2d14a', 4); A.signText(c, 'İLAN PANOSU', 700, 196, 24, '#5a2a10');
      const n = s ? s.board.offers.length : 3;
      for (let i = 0; i < n; i++) { const x = 566 + (i % 2) * 142, y = 236 + Math.floor(i / 2) * 104; c.save(); c.translate(x + 60, y + 44); c.rotate(i % 2 ? 0.04 : -0.05); A.rr(c, -58, -42, 116, 88, 3); A.fs(c, '#fffaf0', 3); c.fillStyle = '#c9302c'; A.circle(c, 0, -36, 6); c.fill(); c.strokeStyle = '#8a7a5a'; c.lineWidth = 3; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-44, -16 + k * 16); c.lineTo(44, -16 + k * 16); c.stroke(); } c.restore(); }
      // olta duvara yaslı + kilim
      D.ItemArt.draw(c, (s && s.equip.rod) || 'ROD_01', 470, 520, 220);
      A.ellipse(c, 560, 900, 260, 60); A.fs(c, '#c9483a', 5); A.ellipse(c, 560, 900, 200, 40); c.strokeStyle = '#f2d14a'; c.lineWidth = 5; c.stroke();
      D.NPCArt.draw(c, 'player', 640, 950, 1.5, t, { hat: s && s.cosmetics.equipped.hat });
    },
    belediye(c, t) {
      for (const x of [40, 820]) { A.rr(c, x, 60, 70, 720, 10); A.fs(c, '#fbf6ec', 5); c.strokeStyle = '#d8ccb4'; c.lineWidth = 4; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + k * 17, 80); c.lineTo(x + k * 17, 760); c.stroke(); } A.rr(c, x - 12, 40, 94, 30, 6); A.fs(c, '#eee6d6', 4); }
      // duvar saati: hep 10:10 (Komplo bunu da not etti)
      A.circle(c, 460, 150, 70); A.fs(c, '#fffaf0', 6); c.lineWidth = 6; c.strokeStyle = A.OL; c.beginPath(); c.moveTo(460, 150); c.lineTo(460 - 38, 150 - 26); c.moveTo(460, 150); c.lineTo(460 + 38, 150 - 26); c.stroke();
      A.rr(c, 230, 250, 460, 70, 10); A.fs(c, '#2a5a8a', 5); A.signText(c, 'DÜMEN BELEDİYESİ', 460, 287, 40, '#fff');
      // dosya dolapları
      for (let i = 0; i < 2; i++) { A.rr(c, 150 + i * 560, 380, 110, 300, 8); A.fs(c, '#8a949e', 5); for (let k = 0; k < 4; k++) { A.rr(c, 162 + i * 560, 392 + k * 72, 86, 58, 4); A.fs(c, '#a8b0b8', 3); A.rr(c, 190 + i * 560, 414 + k * 72, 30, 10, 3); A.fs(c, '#5a5f66', 2); } }
      D.NPCArt.draw(c, 'baskan', 460, 760, 1.25, t);
      // masa (Başkan'ın önünde)
      A.rr(c, 230, 640, 460, 70, 10); A.fs(c, '#8a5a3a', 5); A.rr(c, 250, 710, 420, 180, 8); A.fs(c, '#6a4a2a', 5);
      A.rr(c, 300, 600, 160, 50, 6); A.fs(c, '#2a5a8a', 4); A.rr(c, 306, 606, 148, 38, 4); A.fs(c, '#f5efe0', 2);
      A.rr(c, 560, 596, 30, 44, 6); A.fs(c, '#c9302c', 4); A.rr(c, 548, 636, 54, 14, 4); A.fs(c, '#5a3a2a', 3); // mühür
      A.signText(c, 'Tersane İzinleri · Denizin Defteri Arşivi', 460, 830, 26, '#f5e2b8');
      D.NPCArt.draw(c, 'kaya', 770, 1000, 1.0, t); // Kaya Usta: arşivin başında
    },
    komplo(c, t) {
      A.rr(c, 70, 120, 600, 380, 10); A.fs(c, '#c8955a', 6);
      const pins = [[140, 190], [300, 170], [500, 210], [610, 330], [420, 400], [200, 420], [350, 300]];
      c.strokeStyle = '#d0302a'; c.lineWidth = 3; c.beginPath(); pins.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.lineTo(140, 190); c.moveTo(300, 170); c.lineTo(420, 400); c.stroke();
      pins.forEach(([x, y], i) => { A.rr(c, x - 44, y - 30, 88, 64, 3); A.fs(c, '#fffaf0', 3); D.FishArt.draw(c, ['EL_03', 'TS_02', 'PSK_08', 'YK_05', 'BG_12', 'BKM_08', 'EL_09'][i], x, y + 2, 60, { t: 0.3, noAura: true }); c.fillStyle = '#d0302a'; A.circle(c, x, y - 28, 6); c.fill(); });
      A.signText(c, 'BALIKLAR NORMAL DEĞİL', 370, 470, 30, '#2a1a10');
      // monitör
      A.rr(c, 700, 360, 190, 140, 10); A.fs(c, '#2a2a2a', 5); A.rr(c, 714, 374, 162, 104, 6); A.fs(c, '#0a1a0a', 3);
      c.fillStyle = Math.sin(t * 4) > 0 ? '#3cff6c' : '#2aaa4a'; c.font = 'bold 22px monospace'; c.fillText('VERİTABANI', 724, 408); c.fillText('EL_03 ?!', 724, 440); c.fillText('> izle_', 724, 468);
      A.rr(c, 770, 500, 50, 40, 4); A.fs(c, '#3a3a3a', 4);
      // antenler, folyo
      for (const [x, h2] of [[740, 200], [840, 260]]) { c.beginPath(); c.moveTo(x, 360); c.lineTo(x + 10, 360 - h2); c.lineWidth = 6; c.strokeStyle = A.OL; c.stroke(); for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x - 20 + k * 2, 360 - h2 + 20 + k * 22); c.lineTo(x + 40 - k * 2, 360 - h2 + 14 + k * 22); c.lineWidth = 4; c.stroke(); } }
      A.wobblyPoly(c, [[80, 560], [260, 540], [300, 640], [90, 660]], 4, 10); A.fs(c, '#d9dde6', 4);
      D.NPCArt.draw(c, 'komplo', 520, 980, 1.25, t);
    },
    kaya(c, t) {
      for (let r = 0; r < 4; r++) { A.rr(c, 40, 150 + r * 130, 820, 16, 4); A.fs(c, '#6a4a2a', 4); for (let i = 0; i < 22; i++) { const h = 70 + ((i * 37 + r * 11) % 30); A.rr(c, 50 + i * 36, 150 + r * 130 - h, 30, h, 3); A.fs(c, ['#2a5a8a', '#8a2a2a', '#4a7a3a', '#c98a1a', '#5a3a6a'][(i + r) % 5], 2.5); } }
      D.NPCArt.draw(c, 'kaya', 200, 980, 1.2, t);
    }
  };

  // ---------------- HARİTA ----------------
  SA.MAP_POS = { EL: [370, 840], TS: [190, 610], PSK: [430, 420], YK: [730, 230], TB: [990, 410], BKM: [760, 600], KKD: [950, 800], BG: [700, 950] };
  SA.mapStatic = (c, W, H) => {
    const ox = (W - 1920) / 2, oy = (H - 1080) / 2;
    c.fillStyle = '#2a5a78'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(ox, oy);
    A.rr(c, 40, 30, 1840, 1020, 26); c.fillStyle = A.rg(c, 960, 540, 200, 1100, ['#f5e6c0', '#d8bf8a']); c.fill(); A.fs(c, null, 6);
    c.save(); A.rr(c, 40, 30, 1840, 1020, 26); c.clip();
    c.strokeStyle = 'rgba(90,60,30,0.12)'; c.lineWidth = 2; for (let x = 40; x < 1880; x += 80) { c.beginPath(); c.moveTo(x, 30); c.lineTo(x, 1050); c.stroke(); } for (let y = 30; y < 1050; y += 80) { c.beginPath(); c.moveTo(40, y); c.lineTo(1880, y); c.stroke(); }
    c.fillStyle = 'rgba(70,140,180,0.15)'; for (let i = 0; i < 30; i++) { c.beginPath(); c.arc((i * 271) % 1800 + 60, (i * 173) % 980 + 40, 40 + (i % 5) * 16, 0, Math.PI * 2); c.fill(); }
    // kasaba
    A.rr(c, 60, 860, 180, 160, 20); A.fs(c, '#c8b07a', 4); for (let i = 0; i < 4; i++) { A.rr(c, 80 + i * 38, 900 - (i % 2) * 18, 30, 40 + (i % 2) * 18, 3); A.fs(c, ['#6fb0d8', '#f2c84a', '#8a949e', '#c9483a'][i], 3); }
    A.signText(c, 'DÜMEN', 150, 1000, 26, '#5a2a10');
    // rota
    c.setLineDash([14, 12]); c.lineWidth = 6; c.strokeStyle = 'rgba(140,40,20,0.6)'; c.beginPath(); c.moveTo(200, 880);
    for (const code of D.REGION_ORDER) { const [x, y] = SA.MAP_POS[code]; c.lineTo(x, y); } c.stroke(); c.setLineDash([]);
    // pusula gülü
    c.save(); c.translate(1010, 150); c.scale(0.7, 0.7); for (let i = 0; i < 8; i++) { c.save(); c.rotate((i / 8) * Math.PI * 2); c.beginPath(); c.moveTo(0, -(i % 2 ? 50 : 90)); c.lineTo(12, 0); c.lineTo(-12, 0); c.closePath(); A.fs(c, i % 2 ? '#8a6a3a' : '#c9302c', 3); c.restore(); } A.signText(c, 'K', 0, -108, 26, '#5a2a10'); c.restore();
    c.restore();
    c.restore();
  };
  SA.regionIcon = (c, code, x, y, s, t, locked) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    const R = D.RegionDB[code]; const pal = R.palette;
    A.ellipse(c, 0, 20, 110, 70); A.fs(c, locked ? '#b8a888' : pal.sea[0], 5);
    c.save(); A.ellipse(c, 0, 20, 110, 70); c.clip();
    if (!locked) {
      const k = { EL: () => { A.planks(c, -60, 0, 120, 26, '#a8743a', 4, true); D.BoatArt.draw(c, 1, 30, 40, 0.18, t); },
        TS: () => { for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-80 + i * 20, 60); c.quadraticCurveTo(-76 + i * 20, 10, -82 + i * 20 + Math.sin(t + i) * 6, -20); c.lineWidth = 5; c.strokeStyle = '#4a7a3a'; c.stroke(); } },
        PSK: () => { A.rr(c, -60, -40, 50, 70, 4); A.fs(c, '#8a5a3a', 3); A.rr(c, -50, -70, 14, 34, 2); A.fs(c, '#5a5f66', 3); A.rr(c, 10, -10, 70, 14, 7); A.fs(c, '#9aa7b2', 3); },
        YK: () => { A.circle(c, 40, -20, 22); A.fs(c, '#fff6c8', 3); A.sparkles(c, [[-40, 20, 0, 8], [-10, 40, 2, 6], [20, 30, 4, 7], [-60, 0, 1, 6]], t, '#e0c8ff'); },
        TB: () => { for (const [ix, h] of [[-40, 70], [10, 50], [50, 80]]) { c.beginPath(); c.moveTo(ix - 30, 40); c.lineTo(ix, 40 - h); c.lineTo(ix + 30, 40); c.closePath(); A.fs(c, '#e8f8ff', 3); } },
        BKM: () => { c.save(); c.rotate(-0.3); A.rr(c, -50, 0, 100, 30, 8); A.fs(c, '#5a3a2a', 3); A.rr(c, -6, -70, 8, 74, 2); A.fs(c, '#3a2a1a', 3); c.beginPath(); c.moveTo(2, -66); c.lineTo(40, -50); c.lineTo(2, -30); A.fs(c, '#c8c0a8', 3); c.restore(); },
        KKD: () => { c.beginPath(); c.moveTo(-60, 50); c.lineTo(-10, -50); c.lineTo(10, -50); c.lineTo(60, 50); c.closePath(); A.fs(c, '#4a2a2a', 3); c.beginPath(); c.moveTo(-10, -50); c.lineTo(0, -30); c.lineTo(10, -50); A.fs(c, '#ff6a2a', 2); for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; A.circle(c, Math.sin(k * 5) * 10, -60 - k * 50, 10 + k * 12); c.fillStyle = `rgba(200,200,200,${0.6 * (1 - k)})`; c.fill(); } },
        BG: () => { for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(0, 20, 16 + i * 14, t * (1 + i * 0.3), t * (1 + i * 0.3) + 4); c.lineWidth = 5; c.strokeStyle = i % 2 ? '#5ff5e0' : '#b07cff'; c.stroke(); } } }[code];
      k();
    } else { D.RegionArt.padlock(c, 0, 24, 1.3); }
    c.restore();
    A.ellipse(c, 0, 20, 110, 70); A.fs(c, null, 5);
    c.restore();
  };

  // ---------------- ANA MENÜ ----------------
  SA.menu = (c, W, H, t) => {
    c.fillStyle = A.lg(c, 0, 0, 0, H * 0.6, ['#3a2a6a', '#f59a6a', '#ffe0a0']); c.fillRect(0, 0, W, H);
    A.circle(c, W * 0.7, H * 0.52, 110); c.fillStyle = '#ffd070'; c.fill();
    const sea = H * 0.6;
    c.fillStyle = A.lg(c, 0, sea, 0, H, ['#e07a5a', '#3a4a8a', '#1a2a5a']); c.fillRect(0, sea, W, H - sea);
    for (let i = 0; i < 5; i++) A.waves(c, 0, W, sea + 10 + i * 70, 6 + i * 2, 200 + i * 40, t * (0.8 + i * 0.2) * (i % 2 ? -1 : 1), A.alpha(i % 2 ? '#3a4a8a' : '#5a5aa0', 0.7), null, H);
    c.fillStyle = 'rgba(255,220,140,0.5)'; for (let i = 0; i < 12; i++) { A.ellipse(c, W * 0.7 + Math.sin(t + i) * 20, sea + 20 + i * 26, 90 - i * 6, 4); c.fill(); }
    D.BoatArt.draw(c, 3, W * 0.3, sea + 70 + Math.sin(t * 1.2) * 6, 0.9, t, { player: true });
    D.NPCArt.draw(c, 'marti', W * 0.3 - 60, sea + 30 + Math.sin(t * 1.2) * 6, 0.9, t);
    for (let i = 0; i < 3; i++) { const x = ((t * 40 + i * 500) % (W + 200)) - 100, y = 120 + i * 60 + Math.sin(t * 2 + i) * 10; c.beginPath(); c.moveTo(x - 20, y); c.quadraticCurveTo(x - 10, y - 12, x, y); c.quadraticCurveTo(x + 10, y - 12, x + 20, y); c.lineWidth = 4; c.strokeStyle = '#2a1a3a'; c.stroke(); }
  };
  SA.logo = (c, x, y, s, t) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.save(); c.translate(-250, -10); c.rotate(t * 0.3);
    for (let i = 0; i < 8; i++) { c.save(); c.rotate((i / 8) * Math.PI * 2); A.rr(c, -7, -96, 14, 40, 6); A.fs(c, '#a8743a', 4); A.circle(c, 0, -98, 12); A.fs(c, '#c98a4a', 4); c.restore(); }
    A.circle(c, 0, 0, 62); c.lineWidth = 22; c.strokeStyle = OL; c.stroke(); c.lineWidth = 15; c.strokeStyle = '#c98a4a'; c.stroke(); A.circle(c, 0, 0, 16); A.fs(c, '#f0c040', 4);
    c.restore();
    c.font = '900 150px "Trebuchet MS", "Segoe UI", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 26; c.strokeStyle = OL; c.lineJoin = 'round'; c.strokeText('DÜMEN', 80, 0);
    c.fillStyle = A.lg(c, 0, -70, 0, 70, ['#fff3c0', '#f0c040', '#e07a2a']); c.fillText('DÜMEN', 80, 0);
    c.restore();
  };
  D.SceneArt = SA;
})(globalThis.DUMEN);
