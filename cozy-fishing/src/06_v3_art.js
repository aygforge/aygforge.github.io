/* =====================================================================
   06_v3_art.js : v3.0 piksel sanatı — mevcut üslupla aynı PB / Atlas / ic yardımcıları
   yöntem · gün ışığı · proje · filo · gözlem ikonları, 24 deniz canlısı, kasaba proje görselleri,
   yenilenmiş iskele / fener / seyir terası
   ===================================================================== */
/* ---------- ikonlar ---------- */
ic('m_float', p => { p.line(3, 1, 3, 9, '#8a6a4a'); p.rect(2, 9, 3, 2, '#2a2226'); p.rect(2, 4, 3, 3, '#e8483a'); p.rect(1, 5, 5, 1, '#e8483a'); p.rect(2, 7, 3, 2, '#f4f0e4'); p.rect(0, 12, 16, 2, '#4f86c6'); p.rect(0, 14, 16, 2, '#2e5a8a'); p.line(4, 1, 13, 6, '#c8d8e8'); p.line(13, 6, 14, 12, '#c8d8e8'); });
ic('m_bottom', p => { p.rect(0, 2, 16, 2, '#4f86c6'); p.rect(0, 4, 16, 9, '#2e5a8a'); p.rect(0, 13, 16, 3, '#c8b080'); p.line(3, 0, 9, 11, '#e8f0f8'); p.ellipse(9.5, 12, 2, 1.8, '#6a7078'); p.set(9, 11, '#c8ccd4'); p.set(5, 9, '#5fc46a'); p.set(4, 10, '#3a8a42'); p.set(13, 12, '#e8a040'); });
ic('m_spin', p => { p.poly([[2, 8], [6, 5], [12, 6], [14, 8], [12, 10], [6, 11]], '#c8d0d8'); p.rect(5, 7, 4, 2, '#f2c230'); p.set(11, 8, '#2a2226'); p.line(14, 9, 15, 12, '#8a8a92'); p.line(0, 8, 2, 8, '#e8f0f8'); p.set(3, 3, '#ffffff'); p.set(9, 2, '#ffffff'); p.set(13, 3, '#ffffff'); p.line(1, 13, 5, 13, '#8ac8ff'); p.line(8, 14, 13, 14, '#8ac8ff'); });
ic('dp_morning', p => { p.rect(0, 0, 16, 9, '#f2b8c0'); p.rect(0, 0, 16, 3, '#9aa6e0'); p.ellipse(8, 10, 5, 5, '#ffd06a'); p.rect(0, 10, 16, 6, '#3aa4bc'); p.rect(3, 11, 10, 1, '#ffe8a0'); p.rect(5, 13, 6, 1, '#ffe8a0'); });
ic('dp_day', p => { p.rect(0, 0, 16, 11, '#6fbce6'); p.ellipse(8, 6, 4, 4, '#ffe27a'); for (const [x, y] of [[8, 0], [8, 12], [2, 6], [14, 6], [3, 1], [13, 1], [3, 11], [13, 11]]) p.set(x, y, '#fff2c0'); p.rect(0, 12, 16, 4, '#3aa4bc'); });
ic('dp_evening', p => { p.rect(0, 0, 16, 4, '#4a3a7a'); p.rect(0, 4, 16, 3, '#d8648a'); p.rect(0, 7, 16, 4, '#ffa858'); p.ellipse(8, 11, 5, 4, '#ff7a3a'); p.rect(0, 11, 16, 5, '#3a5a8a'); p.rect(2, 12, 12, 1, '#ffb070'); p.rect(5, 14, 6, 1, '#ffb070'); });
ic('proj_pier', p => { p.rect(0, 9, 16, 3, '#c8925a'); p.rect(0, 9, 16, 1, '#e8b878'); for (const x of [1, 7, 13]) p.rect(x, 12, 2, 4, '#7a5228'); p.rect(3, 3, 1, 6, '#3a3a42'); p.rect(2, 1, 3, 3, '#f6e27a'); p.rect(8, 6, 6, 1, '#8a5a2a'); p.rect(8, 7, 1, 2, '#6a4628'); p.rect(13, 7, 1, 2, '#6a4628'); });
ic('proj_market', p => { for (let x = 0; x < 16; x++) p.rect(x, 2, 1, 4, Math.floor(x / 3) % 2 ? '#5fc46a' : '#f4f0e4'); p.rect(1, 6, 1, 8, '#7a5228'); p.rect(14, 6, 1, 8, '#7a5228'); p.rect(3, 10, 10, 4, '#a8743e'); p.rect(4, 9, 3, 1, '#9ab8d0'); p.rect(8, 9, 3, 1, '#c8d0d8'); p.rect(2, 14, 3, 2, '#f26a8a'); p.rect(11, 14, 3, 2, '#f2d030'); });
ic('proj_lighthouse', p => { for (let i = 0; i < 9; i++) { const w = Math.round(lerp(3, 2, i / 9)); p.rect(8 - w, 14 - i, w * 2, 1, Math.floor(i / 3) % 2 ? '#f4f0e4' : '#c4473f'); } p.rect(4, 14, 8, 2, '#9a948a'); p.rect(5, 3, 6, 2, '#3a3a42'); p.rect(6, 1, 4, 2, '#fff8c0'); p.line(10, 2, 15, 0, '#fff8c0'); p.line(10, 2, 15, 4, '#fff8c0'); });
ic('proj_terrace', p => { p.rect(1, 8, 14, 2, '#c8925a'); for (let x = 1; x < 15; x += 3) p.rect(x, 4, 1, 4, '#8a5a2a'); p.rect(1, 4, 14, 1, '#a8743e'); for (const x of [2, 13]) p.rect(x, 10, 1, 6, '#7a5228'); p.rect(10, 1, 1, 7, '#3a3a42'); p.rect(9, 1, 4, 2, '#5a6470'); p.rect(0, 14, 16, 2, '#3aa4bc'); });
ic('wild_book', p => { p.rect(2, 1, 12, 14, '#2e6a6a'); p.rect(3, 2, 10, 12, '#f2e8c8'); p.rect(3, 2, 2, 12, '#3a8a8a'); p.poly([[6, 9], [9, 6], [12, 9], [9, 10]], '#5a6a80'); p.set(11, 8, '#1a1426'); p.rect(7, 4, 4, 1, '#8ac8ff'); p.rect(6, 12, 6, 1, '#a89878'); });
ic('report', p => { p.rect(2, 1, 12, 14, '#f6eed8'); p.rect(2, 1, 12, 2, '#c4473f'); p.rect(4, 5, 8, 1, '#a89878'); p.rect(4, 7, 6, 1, '#a89878'); p.rect(4, 9, 7, 1, '#a89878'); p.poly([[4, 12], [7, 11], [10, 11], [12, 12], [10, 13], [7, 13]], '#4f86c6'); });
ic('route', p => { p.rect(0, 0, 16, 16, '#e8d8a8'); p.rect(1, 1, 14, 14, '#7ac8e8'); p.rect(1, 12, 4, 3, '#7aa85a'); for (const [x, y] of [[4, 11], [6, 9], [8, 8], [10, 6], [12, 4]]) p.set(x, y, '#c4473f'); p.rect(11, 2, 3, 3, '#7aa85a'); p.rect(6, 6, 2, 2, '#7aa85a'); p.set(7, 8, '#3a2414'); });
ic('crate', p => { p.rect(1, 5, 14, 10, '#a8743e'); p.rect(1, 5, 14, 1, '#c8925a'); p.rect(1, 9, 14, 1, '#7a5228'); for (const x of [1, 14]) p.rect(x, 5, 1, 10, '#7a5228'); p.poly([[3, 3], [6, 1], [9, 1], [11, 3], [9, 5], [6, 5]], '#9ab8d0'); p.set(9, 3, '#1a1426'); });
ic('guest', p => { p.ellipse(5, 5, 3, 3, '#e8b090'); p.rect(2, 9, 7, 6, '#4f86c6'); p.ellipse(11, 6, 3, 3, '#c89070'); p.rect(8, 10, 7, 5, '#e8483a'); p.rect(3, 2, 5, 2, '#5a3a1e'); p.rect(9, 3, 5, 1, '#2a2226'); });
ic('fleet_idle', p => { p.rect(0, 12, 16, 4, '#3aa4bc'); p.poly([[1, 9], [15, 9], [13, 13], [3, 13]], '#c8643a'); p.rect(6, 4, 4, 5, '#f4f0e4'); p.rect(7, 5, 2, 2, '#7ab0d8'); p.line(3, 2, 3, 9, '#5a3a1e'); p.rect(1, 12, 2, 1, '#5a3a1e'); });
ic('fleet_out', p => { p.rect(0, 12, 16, 4, '#2e5a8a'); p.poly([[3, 9], [15, 9], [13, 12], [5, 12]], '#c8643a'); p.rect(8, 5, 4, 4, '#f4f0e4'); for (let i = 0; i < 3; i++) p.rect(0, 10 + i, 3 - i, 1, '#e8f8ff'); p.line(11, 1, 14, 4, '#ffe070'); p.line(12, 4, 14, 4, '#ffe070'); p.line(14, 2, 14, 4, '#ffe070'); });
ic('fleet_back', p => { p.rect(0, 12, 16, 4, '#3aa4bc'); p.poly([[1, 9], [13, 9], [11, 12], [3, 12]], '#c8643a'); p.rect(4, 5, 4, 4, '#f4f0e4'); p.rect(9, 3, 6, 5, '#a8743e'); p.rect(10, 2, 4, 2, '#9ab8d0'); p.set(13, 1, '#5fc46a'); p.set(14, 0, '#5fc46a'); });
ic('jobs', p => { p.rect(1, 1, 14, 12, '#9a6a36'); p.rect(2, 2, 12, 10, '#e8d8a8'); p.rect(3, 3, 4, 5, '#f6eed8'); p.rect(9, 3, 4, 5, '#f6eed8'); p.rect(4, 4, 2, 2, '#c89070'); p.rect(10, 4, 2, 2, '#e8b090'); p.rect(3, 9, 10, 1, '#a89878'); p.rect(7, 13, 2, 3, '#6a4420'); p.set(5, 2, '#c4473f'); p.set(11, 2, '#c4473f'); });
ic('wild_badge', p => { p.poly([[8, 1], [14, 4], [14, 10], [8, 15], [2, 10], [2, 4]], '#2fa39a'); p.poly([[8, 3], [12, 5], [12, 9], [8, 13], [4, 9], [4, 5]], '#1e7a72'); p.poly([[5, 9], [8, 6], [11, 9], [8, 10]], '#c8e8ff'); p.set(10, 8, '#1a1426'); });
ic('decor_poster_wild', p => { p.rect(1, 1, 14, 14, '#2e5a5a'); p.rect(2, 2, 12, 12, '#a8d8e8'); p.rect(2, 9, 12, 5, '#3a8ab8'); p.poly([[4, 10], [7, 8], [10, 8], [12, 10], [10, 11], [7, 11]], '#5a6a80'); p.poly([[7, 8], [8, 6], [9, 8]], '#4a5a70'); p.line(3, 4, 6, 3, '#f4f4f0'); p.line(6, 3, 8, 4, '#f4f4f0'); p.set(12, 4, '#ffe070'); });
ic('quick', p => { p.ellipse(8, 8, 6, 6, '#5fc46a'); p.ellipse(8, 8, 4, 4, '#e2f2d8'); p.poly([[6, 5], [11, 8], [6, 11]], '#2f7a3a'); p.line(2, 3, 4, 1, '#ffe070'); p.line(14, 3, 12, 1, '#ffe070'); });

/* ---------- 24 deniz canlısı (her biri özgün çizim) ---------- */
const W_ART = {
  gumus_marti: f => { const p = new PB(15, 8); const w = '#f4f4f0', g = '#b8c0c8', k = '#2a2a30'; p.rect(5, 3, 5, 2, w); p.rect(10, 2, 2, 2, w); p.set(12, 3, '#e8c030'); p.set(11, 2, k); p.set(4, 4, '#2a2a30'); if (f) { p.line(1, 0, 5, 3, g); p.line(13, 0, 9, 3, g); p.set(1, 0, k); p.set(13, 0, k); } else { p.line(1, 7, 5, 4, g); p.line(13, 7, 9, 4, g); } p.outline(null, 0.4); return p; },
  karabatak: f => { const p = new PB(16, 9); const k = '#1e2228', g = '#3a4450'; p.ellipse(7, 5, 5, 2, k); p.rect(11, 3, 3, 2, k); p.set(14, 4, '#e8a040'); p.set(15, 4, '#c88020'); p.set(12, 3, '#5fc46a'); p.rect(1, 5, 2, 1, k); if (f) { p.poly([[4, 4], [7, 0], [9, 4]], g); } else { p.poly([[4, 5], [7, 9], [9, 5]], g); } p.outline(null, 0.3); return p; },
  kiyi_yengeci: f => { const p = new PB(12, 8); const c = '#5a8a3a', d = '#3a6a2a'; p.ellipse(6, 4, 4, 2.5, c, (x, y) => y > 4 ? d : c); p.set(4, 2, '#1a1426'); p.set(8, 2, '#1a1426'); p.set(4, 1, d); p.set(8, 1, d); for (let i = 0; i < 3; i++) { p.set(1 + (f ? 0 : 1), 5 + i, d); p.set(10 - (f ? 0 : 1), 5 + i, d); } p.rect(0, 2, 2, 2, '#7aa84a'); p.rect(10, 2, 2, 2, '#7aa84a'); p.outline(null, 0.4); return p; },
  gri_balikcil: f => { const p = new PB(12, 22); const g = '#8a96a4', w = '#e8ecf0', k = '#2a2a30'; p.ellipse(5, 9, 3.5, 4, g, (x, y) => y < 8 ? w : g); p.rect(5, 2, 2, 6, w); p.rect(5, 1, 3, 2, w); p.rect(8, 2, 3 + (f ? 1 : 0), 1, '#e8b030'); p.set(6, 1, k); p.rect(3, 1, 3, 1, k); p.rect(4, 13, 1, 9, '#c8a040'); p.rect(6, 13, 1, 9, '#c8a040'); p.rect(1, 8, 2, 4, '#6a7684'); p.outline(null, 0.35); return p; },
  caretta: f => { const p = new PB(20, 10); const sh = '#8a5a2a', s2 = '#6a4020', sk = '#c8a070'; p.ellipse(9, 5, 7, 4, sh, (x, y) => ((x + y) % 4 === 0) ? s2 : sh); p.ellipse(17, 5, 2.6, 2.2, sk); p.set(18, 4, '#1a1426'); p.poly([[11, 7], [15, 9], [13, 9]], sk); p.poly([[6, 7], [3, 9], [5, 9]], sk); if (f) { p.poly([[11, 2], [15, 0], [13, 3]], sk); } p.outline(null, 0.4); return p; },
  ay_denizanasi: f => { const p = new PB(14, 14); p.ellipse(7, 4, 6, 3.5 + (f ? 0.5 : 0), '#dce6ff', (x, y) => y > 4 ? '#c4d0f0' : '#e8eeff'); for (const [x, y] of [[4, 3], [9, 3], [6, 2], [8, 5]]) p.set(x, y, '#c87af0'); for (let i = 0; i < 4; i++) for (let y = 7; y < 13; y++) p.set(3 + i * 3 + ((y + (f ? 1 : 0)) % 2), y, '#c4d0f0'); return p; },
  deniz_ati: f => { const p = new PB(9, 16); const c = '#e8a040', d = '#c87a20'; p.rect(3, 1, 3, 3, c); p.rect(6, 2, 2, 1, c); p.set(4, 2, '#1a1426'); p.rect(3, 4, 3, 6, c); p.rect(2, 5, 1, 4, d); p.set(6, 6, '#f2d070'); p.rect(4, 10, 2, 2, c); p.set(5, 12, d); p.set(4, 13, d); p.set(3, 14, d); p.set(3, 13, d); p.rect(2, 0, 1, 2, d); if (f) p.set(7, 7, '#f2d070'); p.outline(null, 0.4); return p; },
  akdeniz_foku: f => { const p = new PB(14, 11); const c = '#6a6460', l = '#8a847e'; p.ellipse(7, 6, 5, 5, c, (x, y) => y > 6 ? l : c); p.set(5, 4, '#1a1426'); p.set(9, 4, '#1a1426'); p.rect(6, 6, 3, 1, '#2a2226'); p.set(4, 7, '#c8c0b8'); p.set(10, 7, '#c8c0b8'); if (f) { p.set(3, 6, '#c8c0b8'); p.set(11, 6, '#c8c0b8'); } p.outline(null, 0.4); return p; },
  deniz_yildizi: f => { const p = new PB(13, 13); const c = '#e8643a', d = '#c84a2a'; for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2 - Math.PI / 2 + (f ? 0.06 : 0); for (let r = 0; r < 6; r++) { const x = 6.5 + Math.cos(an) * r, y = 6.5 + Math.sin(an) * r; p.set(x, y, r % 2 ? d : c); if (r < 4) { p.set(x + 1, y, c); p.set(x, y + 1, c); } } } p.set(6, 6, '#f2a070'); p.outline(null, 0.4); return p; },
  ahtapot: f => { const p = new PB(16, 14); const c = '#c8643a', d = '#a04a2a'; p.ellipse(8, 4, 5, 4, c, (x, y) => (ihash(x, y, 5) < 0.2) ? d : c); p.set(6, 4, '#f4f0e4'); p.set(10, 4, '#f4f0e4'); p.set(6, 5, '#1a1426'); p.set(10, 5, '#1a1426'); for (let i = 0; i < 6; i++) for (let y = 7; y < 13; y++) p.set(3 + i * 2 + Math.round(Math.sin(y * 0.8 + i + (f ? 1 : 0)) * 1), y, y > 10 ? d : c); p.outline(null, 0.4); return p; },
  afalina: f => { const p = new PB(22, 9); const c = '#6a7a8c', l = '#c8d0dc'; p.ellipse(10, 5, 9, 3, c, (x, y) => y > 5 ? l : c); p.rect(19, 5, 3, 1, c); p.poly([[9, 2], [12, -1], [12, 3]], '#5a6a7c'); p.poly([[1, 5], [-1, 2], [3, 4]], '#5a6a7c'); p.poly([[1, 5], [-1, 8], [3, 6]], '#5a6a7c'); p.set(17, 4, '#1a1426'); if (f) p.set(18, 7, l); p.outline(null, 0.4); return p; },
  sumsuk: f => { const p = new PB(18, 9); const w = '#f8f8f4', k = '#2a2a30', y = '#f2d890'; p.ellipse(8, 5, 5, 2, w); p.rect(12, 3, 3, 3, y); p.rect(15, 4, 3, 1, '#a8b0c0'); p.set(13, 4, k); p.poly([[1, 5], [3, 4], [3, 6]], w); if (f) { p.line(2, 0, 7, 4, w); p.line(14, 0, 10, 4, w); p.rect(2, 0, 2, 1, k); p.rect(13, 0, 2, 1, k); } else { p.line(3, 8, 7, 5, w); p.line(13, 8, 10, 5, w); p.rect(3, 8, 2, 1, k); p.rect(12, 8, 2, 1, k); } p.outline(null, 0.35); return p; },
  pusula_denizanasi: f => { const p = new PB(14, 15); p.ellipse(7, 4, 6, 4, '#f2e0c8', (x, y) => (Math.abs(Math.atan2(y - 4, x - 7) * 3) % 1 < 0.25) ? '#a8643a' : '#f2e0c8'); p.set(7, 2, '#a8643a'); for (let i = 0; i < 5; i++) for (let y = 8; y < 14; y++) p.set(3 + i * 2 + ((y + (f ? 1 : 0) + i) % 2), y, '#c88a5a'); return p; },
  liman_foku: f => { const p = new PB(14, 11); const c = '#8a8070', d = '#6a6050'; p.ellipse(7, 6, 5, 5, c, (x, y) => (ihash(x, y, 7) < 0.18) ? d : c); p.set(5, 4, '#1a1426'); p.set(9, 4, '#1a1426'); p.set(7, 6, '#2a2226'); for (const [x, y] of [[4, 7], [10, 7], [3, 6], [11, 6]]) p.set(x, y, '#e8e0d0'); if (f) p.set(7, 8, '#c86a6a'); p.outline(null, 0.4); return p; },
  puffin: f => { const p = new PB(12, 9); const k = '#1e2228', w = '#f4f4f0'; p.ellipse(5, 5, 4, 2.5, k, (x, y) => y > 5 ? w : k); p.rect(8, 2, 3, 3, w); p.set(9, 3, k); p.rect(11, 3, 1, 2, '#e8643a'); p.set(10, 4, '#f2c230'); p.set(12, 4, '#e8643a'); if (f) { p.line(2, 0, 5, 4, k); p.line(8, 0, 6, 4, k); } else { p.line(2, 8, 5, 5, k); p.line(8, 8, 6, 5, k); } p.rect(10, 6, 2, 1, '#c0c0c8'); p.outline(null, 0.35); return p; },
  orka: f => { const p = new PB(26, 14); const k = '#16181e', w = '#f4f4f0'; p.ellipse(13, 10, 11, 3.5, k, (x, y) => (y > 10 && x > 6 && x < 20) ? w : k); p.poly([[10, 7], [13, -1 + (f ? 1 : 0)], [15, 7]], k); p.ellipse(19, 8, 2, 1, w); p.outline(null, 0.3); return p; },
  fulmar: f => { const p = new PB(16, 8); const w = '#f0f0ec', g = '#a8b0b8', k = '#2a2a30'; p.ellipse(7, 4, 4, 1.8, w); p.rect(10, 3, 3, 2, w); p.rect(13, 3, 2, 1, '#c8c080'); p.set(11, 3, k); if (f) { p.line(0, 1, 6, 3, g); p.line(15, 1, 9, 3, g); } else { p.line(0, 4, 6, 4, g); p.line(15, 4, 9, 4, g); } p.outline(null, 0.35); return p; },
  ucan_balik_suru: f => { const p = new PB(16, 7); const b = '#4a7ac8', l = '#c8d8f0'; p.ellipse(8, 4, 5, 1.6, b, (x, y) => y > 4 ? l : b); p.poly([[6, 3], [9, 3], [12, 0 + (f ? 1 : 0)], [4, 0 + (f ? 1 : 0)]], '#c8dcffd8'); p.poly([[3, 4], [0, 2], [0, 6]], b); p.set(12, 3, '#1a1426'); p.outline(null, 0.35); return p; },
  manta: f => { const p = new PB(24, 12); const k = '#2a3444', w = '#e8ecf0'; p.poly([[0, 6 - (f ? 3 : 0)], [8, 4], [12, 3], [16, 4], [24, 6 - (f ? 3 : 0)], [16, 8], [12, 9], [8, 8]], k); p.rect(10, 9, 4, 1, w); p.rect(11, 10, 1, 2, k); p.set(9, 3, k); p.set(15, 3, k); p.outline(null, 0.3); return p; },
  yesil_kaplumbaga: f => { const p = new PB(20, 10); const sh = '#4a7a4a', s2 = '#8aa86a', sk = '#9ab878'; p.ellipse(9, 5, 7, 4, sh, (x, y) => ((Math.floor(x / 3) + Math.floor(y / 2)) % 2) ? s2 : sh); p.ellipse(17, 5, 2.4, 2, sk); p.set(18, 4, '#1a1426'); p.poly([[11, 7], [16, 9], [13, 9]], sk); p.poly([[6, 7], [2, 9], [4, 9]], sk); if (f) p.poly([[11, 2], [16, 0], [13, 3]], sk); p.outline(null, 0.4); return p; },
  firkateyn: f => { const p = new PB(22, 9); const k = '#1e1e26', r = '#e8483a'; p.ellipse(11, 5, 4, 1.6, k); p.rect(15, 4, 3, 2, k); p.rect(18, 5, 3, 1, '#8a8a92'); p.ellipse(15, 6, 1.4, 1.4, r); p.poly([[4, 5], [1, 3], [1, 7]], k); if (f) { p.poly([[8, 4], [2, 0], [12, 4]], k); p.poly([[14, 4], [20, 0], [11, 4]], k); } else { p.poly([[8, 5], [0, 6], [12, 5]], k); p.poly([[14, 5], [22, 6], [11, 5]], k); } p.outline(null, 0.3); return p; },
  kambur_balina: f => { const p = new PB(30, 16); const k = '#2a3444', l = '#5a6a7c'; p.ellipse(15, 13, 13, 4, k, (x, y) => y < 11 ? l : k); p.poly([[20, 10], [22, 7], [23, 10]], k); if (f) for (let i = 0; i < 8; i++) { p.set(8 + Math.round(Math.sin(i) * 2), 8 - i, '#f0f8ffe6'); p.set(10 + Math.round(Math.cos(i) * 2), 8 - i, '#f0f8ffcc'); } return p; },
  donen_yunus: f => { const p = new PB(20, 8); const c = '#5a6478', l = '#d0d4dc', m = '#8a92a4'; p.ellipse(9, 4, 8, 2.4, c, (x, y) => y > 4 ? l : (y === 4 ? m : c)); p.rect(17, 4, 3, 1, c); p.poly([[8, 2], [10, -1], [11, 2]], '#4a5468'); p.poly([[1, 4], [-1, 1], [3, 3]], '#4a5468'); p.poly([[1, 4], [-1, 7], [3, 5]], '#4a5468'); p.set(15, 3, '#1a1426'); if (f) p.set(12, 6, '#ffffff'); p.outline(null, 0.4); return p; },
  ay_baligi: f => { const p = new PB(18, 18); const c = '#8a96a4', l = '#c8d0d8'; p.ellipse(9, 10, 7, 6.5, c, (x, y) => (ihash(x, y, 9) < 0.15) ? l : c); p.poly([[8, 4], [9, 0 + (f ? 1 : 0)], [11, 4]], '#6a7684'); p.poly([[8, 16], [9, 18], [11, 16]], '#6a7684'); p.set(13, 8, '#1a1426'); p.rect(15, 10, 1, 2, '#5a6470'); p.outline(null, 0.35); return p; }
};
const wildSprite = (id, f) => Atlas.get('wild:' + id + ':' + (f ? 1 : 0), () => W_ART[id](f ? 1 : 0));
const wildSpriteR = (id, f) => Atlas.get('wildR:' + id + ':' + (f ? 1 : 0), () => W_ART[id](f ? 1 : 0).flipX());
const wildUrl = (id, sc, seen) => Atlas.url('wildu:' + id + (seen ? '' : ':sil'), () => { const pb = W_ART[id](0); return seen ? pb : pb.silhouette('#3a4658'); }, sc || 2);

/* ---------- gün ışığı paletleri ---------- */
const DP_SKY = { morning: ['#7c86cc', '#f2a8b8', '#ffd890'], evening: ['#3e3478', '#d8648a', '#ffa858'] };
const DP_SEA = { morning: ['#f0a888', 0.16], evening: ['#c8587a', 0.24] };
const DP_GRADE = { morning: 'rgba(255,190,150,0.10)', evening: 'rgba(255,120,70,0.13)' };
const dpSun = dp => Atlas.get('dpsun:' + dp, () => { const pb = new PB(34, 34); const [a, b, c] = dp === 'morning' ? ['#ffe4b0', '#ffc870', '#fff0d0'] : ['#ffb070', '#ff7a3a', '#ffd0a0']; pb.ellipse(17, 17, 16, 16, a); pb.ellipse(17, 17, 12, 12, b); pb.ellipse(15, 15, 5, 5, c); return pb; });
const dpCloud = (v, wx, dp) => Atlas.get('dpcloud:' + v + wx + dp, () => { const base = wx === 'rain' ? ['#9a8aa0', '#7a6a88'] : dp === 'morning' ? ['#ffe0e4', '#f2b8c4'] : ['#ffc8b0', '#d8889a']; return cloudPB(v, base[0], base[1]); });
const DP_PAL_CACHE = new Map();
function dpPal(pal, dp) {
  const k = pal.sea.join() + dp; let v = DP_PAL_CACHE.get(k); if (v) return v;
  v = Object.assign({}, pal, { sea: pal.sea.map(c => mix(c, DP_SEA[dp][0], DP_SEA[dp][1])) }); DP_PAL_CACHE.set(k, v); return v;
}

/* ---------- yenilenmiş fener ---------- */
function lighthouseV3(pb, x, y, h, glow) {
  pb.rect(x - 9, y - 4, 18, 6, '#8a8478'); for (let i = 0; i < 18; i += 4) pb.rect(x - 9 + i, y - 4 + (i % 8 ? 0 : 3), 3, 2, '#a8a294'); pb.rect(x - 9, y - 5, 18, 1, '#c8c2b4');
  for (let i = 0; i < h; i++) { const w = Math.round(lerp(6, 3, i / h)); const band = Math.floor(i / 6) % 2; pb.rect(x - w, y - 5 - i, w * 2, 1, band ? '#fbf8f0' : '#d8383a'); pb.set(x - w, y - 5 - i, band ? '#d8d4c8' : '#a82a2c'); pb.set(x + w - 1, y - 5 - i, band ? '#ffffff' : '#f05050'); }
  const ty = y - 5 - h; pb.rect(x - 6, ty - 2, 12, 2, '#2a2a32'); for (let i = -5; i <= 5; i += 2) pb.set(x + i, ty - 3, '#5a5a62'); pb.rect(x - 4, ty - 8, 8, 6, '#fff8c0'); pb.rect(x - 1, ty - 8, 2, 6, '#ffffff'); pb.rect(x - 4, ty - 10, 8, 2, '#2a2a32'); pb.rect(x - 2, ty - 12, 4, 2, '#3a3a42'); pb.set(x, ty - 13, '#c8a040');
  if (glow) for (let a = 0; a < 24; a++) { const an = a / 24 * Math.PI * 2; for (let r = 7; r < 10; r++) if ((a + r) % 2) pb.set(x + Math.cos(an) * r, ty - 5 + Math.sin(an) * r * 0.8, r === 7 ? '#fff4b0' : '#ffeaa0'); }
}
/* ---------- iskele sahnesi süslemeleri ---------- */
function decoratePier(pb, i, season, pm) {
  if (pm[0] === '1' && i === 1) {
    const S0 = PIER_SURF;
    for (let x = 0; x < 190; x++) { for (let y = S0 - 32; y < S0 - 24; y++) pb.set(x, y, (x % 14 === 0) ? '#8a6038' : (y === S0 - 32 ? '#e8b878' : (y > S0 - 27 ? '#b8844a' : '#c8945a'))); pb.set(x, S0 - 33, '#6a4426'); }
    for (const lx of [24, 148]) { pb.rect(lx, S0 - 58, 2, 26, '#3a3a42'); pb.rect(lx - 2, S0 - 64, 6, 6, '#3a3a42'); pb.rect(lx - 1, S0 - 63, 4, 4, '#ffe890'); pb.set(lx, S0 - 62, '#ffffff'); }
    pb.rect(96, S0 - 40, 26, 2, '#8a5a2a'); pb.rect(96, S0 - 47, 26, 2, '#a8743e'); for (const bx of [98, 118]) pb.rect(bx, S0 - 45, 2, 12, '#6a4628');
    pb.ellipse(178, S0 - 44, 5, 5, '#e8483a', (x, y) => (Math.abs(x - 178) < 2 || Math.abs(y - (S0 - 44)) < 2) ? '#f4f0e4' : '#e8483a'); for (let y = S0 - 46; y <= S0 - 42; y++) for (let x = 176; x <= 180; x++) if (Math.hypot(x - 178, y - (S0 - 44)) < 2.2) pb.d[y * pb.w + x] = 0;
    for (let x = 4; x < 190; x += 30) { pb.rect(x, S0 - 24, 6, 3, '#8a6038'); }
  }
  if (pm[2] === '1' && i === 2) { const S0 = PIER_SURF; for (let y = S0 - 104; y < S0 - 30; y++) for (let x = 66; x < 96; x++) pb.d[y * pb.w + x] = 0; lighthouseV3(pb, 80, S0 - 25, 62, true); }
}
/* ---------- kasaba proje görselleri (townArt önbelleği proje maskesiyle anahtarlanır) ---------- */
function decorateTown(v, season, pm) {
  const g = TOWN_GROUND; const put = (cv, pb, x, y) => { const c = pb.canvas(); cv.getContext('2d').drawImage(c, x, y); };
  const main = v.main, mid = v.mid;
  if (pm[0] === '1') { /* İskele Yenilemesi */
    const x0 = TOWN_WATER_X - 40, x1 = TOWN_W - 30, pb = new PB(x1 - x0, 48);
    for (let x = 0; x < x1 - x0; x++) { pb.set(x, 40, '#6a4426'); for (let y = 41; y < 48; y++) pb.set(x, y, (x % 16 === 0) ? '#8a6038' : (y === 41 ? '#f0c088' : (y > 45 ? '#b8844a' : '#d0a064'))); }
    for (const lx of [90, 250, 410]) { pb.rect(lx, 12, 2, 29, '#3a3a42'); pb.rect(lx - 3, 5, 8, 7, '#3a3a42'); pb.rect(lx - 2, 6, 6, 5, '#ffe890'); pb.set(lx, 7, '#ffffff'); pb.rect(lx - 4, 4, 10, 1, '#2a2a32'); }
    for (const bx of [150, 330]) { pb.rect(bx, 31, 28, 2, '#8a5a2a'); pb.rect(bx, 24, 28, 2, '#a8743e'); pb.rect(bx + 2, 26, 2, 15, '#6a4628'); pb.rect(bx + 24, 26, 2, 15, '#6a4628'); pb.rect(bx + 2, 33, 2, 8, '#6a4628'); pb.rect(bx + 24, 33, 2, 8, '#6a4628'); }
    for (let x = 92; x < 410; x++) { const k = ((x - 90) % 160) / 160; pb.set(x, 18 + Math.round(Math.sin(k * Math.PI) * 6), '#c8b080'); }
    pb.ellipse(52, 30, 6, 6, '#e8483a', (x, y) => (Math.abs(x - 52) < 2 || Math.abs(y - 30) < 2) ? '#f4f0e4' : '#e8483a'); for (let y = 28; y < 33; y++) for (let x = 50; x < 55; x++) if (Math.hypot(x - 52, y - 30) < 2.5) pb.d[y * pb.w + x] = 0;
    pb.rect(230, 34, 10, 7, '#a8743e'); pb.rect(230, 34, 10, 1, '#c8925a'); pb.rect(232, 32, 6, 2, '#9ab8d0'); pb.rect(470, 36, 7, 5, '#3a6a9a'); pb.rect(469, 35, 9, 1, '#5a8aba');
    put(main, pb, x0, g - 44);
  }
  if (pm[1] === '1') { /* Balık Pazarı Düzenlemesi */
    const x0 = 596, pb = new PB(300, 160);
    for (let x = 34; x < 270; x++) { const yy = 14 + Math.round(Math.sin((x - 34) / 236 * Math.PI) * 6); pb.set(x, yy, '#5a3a1e'); if ((x - 34) % 10 === 0) { const c = ['#5fc46a', '#f2c230', '#4f86c6', '#f26a8a'][((x - 34) / 10) % 4]; for (let k = 0; k < 5; k++) pb.rect(x - 2 + Math.ceil(k / 2), yy + 1 + k, 5 - k, 1, c); } }
    for (let x = 44; x < 260; x++) for (let y = 104; y < 112; y++) pb.set(x, y, Math.floor((x - 44) / 8) % 2 ? '#3f9a4a' : '#f4f0e4');
    for (let x = 44; x < 260; x++) pb.set(x, 112 + Math.round(Math.abs(Math.sin((x - 44) * Math.PI / 8)) * 2), Math.floor((x - 44) / 8) % 2 ? '#2f7a3a' : '#d8d4c8');
    for (const [fx, cols] of [[50, ['#f26a8a', '#f2d030']], [150, ['#c87af0', '#f4f0f8']], [236, ['#f2a030', '#f26a8a']]]) { pb.rect(fx, 148, 18, 8, '#a8643a'); pb.rect(fx, 148, 18, 1, '#c8844a'); for (let i = 0; i < 6; i++) { pb.set(fx + 2 + i * 3, 145, cols[i % 2]); pb.set(fx + 3 + i * 3, 144, cols[(i + 1) % 2]); pb.set(fx + 2 + i * 3, 146, '#3a8a3a'); pb.set(fx + 3 + i * 3, 147, '#3a8a3a'); } }
    for (const [cx, cy] of [[4, 140], [16, 140], [10, 128], [272, 140], [284, 140]]) { pb.rect(cx, cy, 12, 12, '#a8743e'); pb.rect(cx, cy, 12, 1, '#c8925a'); pb.rect(cx, cy + 6, 12, 1, '#7a5228'); pb.rect(cx, cy, 1, 12, '#7a5228'); pb.rect(cx + 11, cy, 1, 12, '#7a5228'); pb.rect(cx + 2, cy - 2, 8, 2, '#c8e8f0'); pb.set(cx + 4, cy - 3, '#9ab8d0'); pb.set(cx + 7, cy - 3, '#c8d0d8'); }
    put(main, pb, x0, g - 158);
  }
  if (pm[2] === '1') { /* Liman Feneri Yenilemesi (mevcut fener yerinde yenilenir) */
    const pb = new PB(40, 80); lighthouseV3(pb, 20, 74, 46, true); const lx = v.MW - 60; const c = mid.getContext('2d'); c.clearRect(lx - 7, 250 - 58, 14, 60); put(mid, pb, lx - 20, 250 - 74 + 4);
  }
  if (pm[3] === '1') { /* Deniz Seyir Terası (iskele ucunda) */
    const x0 = 2836, pb = new PB(122, 70);
    for (let x = 4; x < 118; x++) { pb.set(x, 34, '#6a4426'); for (let y = 35; y < 40; y++) pb.set(x, y, (x % 12 === 0) ? '#8a6038' : (y === 35 ? '#f0c088' : '#c8945a')); }
    for (const px of [8, 58, 110]) { pb.rect(px, 40, 4, 26, '#6a4628'); pb.rect(px + 1, 40, 1, 26, '#8a6038'); }
    for (let x = 4; x < 118; x++) pb.set(x, 22, '#8a5a2a'); for (let x = 4; x < 118; x += 5) pb.rect(x, 22, 1, 13, '#a8743e');
    for (let i = 0; i < 6; i++) pb.rect(118 - i * 3, 40 + i * 4, 4, 2, '#a8743e');
    for (const bx of [16, 66]) { pb.rect(bx, 29, 22, 2, '#8a5a2a'); pb.rect(bx, 23, 22, 2, '#a8743e'); pb.rect(bx + 1, 25, 2, 10, '#6a4628'); pb.rect(bx + 19, 25, 2, 10, '#6a4628'); }
    pb.rect(98, 16, 2, 19, '#3a3a42'); pb.rect(96, 12, 10, 4, '#5a6470'); pb.rect(104, 11, 4, 6, '#3a4450'); pb.set(107, 13, '#8ac8ff');
    pb.rect(48, 0, 1, 22, '#5a3a1e'); for (let y = 1; y < 8; y++) pb.rect(49, y, 10 - Math.abs(4 - y), 1, y % 2 ? '#2fa39a' : '#f4f0e4');
    pb.rect(4, 26, 8, 8, '#a8643a'); pb.set(6, 24, '#f26a8a'); pb.set(8, 23, '#f2d030'); pb.set(10, 24, '#f26a8a'); pb.rect(6, 25, 4, 1, '#3a8a3a');
    put(main, pb, x0, g - 56);
  }
}
/* proje açılış efekti */
function drawProjectFx(g) {
  const fx = Game.projectFx; if (!fx) return; const k = Game.t - fx.t; if (k > 4) { Game.projectFx = null; return; }
  for (const c of CONFETTI) { const y = (c.y + k * c.v) % 380; g.fillStyle = c.c; g.fillRect(Math.round(c.x + Math.sin(k * 3 + c.x) * 6), Math.round(y), c.w ? 2 : 1, 2); }
  const s = 'KASABA YENİLENDİ!'; const s2 = upTR(PROJ[fx.id].name);
  g.fillStyle = 'rgba(20,14,26,0.7)'; g.fillRect(320 - 130, 62, 260, 40);
  drawText(g, s, Math.round(320 - textWidth(s, 2) / 2), 68, (Math.floor(k * 6) % 2) ? '#ffe070' : '#ffffff', 2, '#1a1426');
  drawText(g, s2, Math.round(320 - textWidth(s2) / 2), 88, '#c8ffb0', 1, '#1a1426');
}
