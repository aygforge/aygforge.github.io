/* =====================================================================
   05_art_ui.js : özgün piksel ikonlar, ahşap/kâğıt panel kenarlıkları, 4 tekne
   ===================================================================== */
const ICONS = {};
const ic = (name, fn, w, h) => { ICONS[name] = { fn, w: w || 16, h: h || 16 }; };
function iconPB(name) {
  const d = ICONS[name]; const pb = new PB(d ? d.w : 16, d ? d.h : 16);
  if (d) d.fn(pb); else { pb.rect(4, 4, 8, 8, '#c44'); }
  if (!d || !d.noOutline) pb.outline(null, 0.6);
  return pb;
}
const iconUrl = (name, sc) => Atlas.url('icon:' + name, () => iconPB(name), sc || 2);
const iconCanvas = name => Atlas.get('icon:' + name, () => iconPB(name));
function img(name, sc, cls) { return `<img class="pix ${cls || ''}" src="${iconUrl(name, sc || 2)}" alt="">`; }

/* --- genel --- */
ic('coin', p => { p.ellipse(8, 8, 6, 6, '#e8b83a'); p.ellipse(8, 8, 4.5, 4.5, '#f6d468'); p.rect(7, 5, 2, 6, '#c8922a'); p.rect(6, 6, 1, 1, '#fff2b0'); p.set(5, 4, '#fff8d8'); });
ic('energy', p => { p.poly([[9, 1], [3, 9], [7, 9], [6, 15], [13, 6], [9, 6], [11, 1]], '#f2c230'); p.line(9, 2, 5, 8, '#fff0a0'); });
ic('bag', p => { p.rect(3, 6, 10, 9, '#a8743e'); p.rect(4, 5, 8, 2, '#8a5a2a'); p.rect(6, 2, 4, 1, '#6a4420'); p.set(5, 3, '#6a4420'); p.set(10, 3, '#6a4420'); p.rect(4, 9, 8, 1, '#c89058'); p.rect(7, 9, 2, 3, '#e8c050'); p.rect(3, 14, 10, 1, '#7a4c22'); });
ic('chest', p => { p.rect(2, 6, 12, 8, '#9a6a36'); p.rect(2, 4, 12, 3, '#b07a40'); p.rect(2, 7, 12, 1, '#5a3a1a'); p.rect(7, 7, 2, 3, '#e8c050'); p.rect(2, 4, 1, 10, '#6a4420'); p.rect(13, 4, 1, 10, '#6a4420'); p.rect(3, 10, 10, 1, '#7a5228'); });
ic('boat', p => { p.poly([[1, 9], [15, 8], [13, 13], [3, 13]], '#3f9a86'); p.rect(2, 8, 13, 1, '#7a5228'); p.rect(7, 2, 1, 6, '#6a4420'); p.poly([[8, 2], [13, 7], [8, 7]], '#f4f0e4'); p.rect(3, 12, 10, 1, '#2c7466'); });
ic('map', p => { p.poly([[1, 3], [5, 2], [10, 4], [15, 3], [15, 13], [10, 14], [5, 12], [1, 13]], '#e8d8a8'); p.line(5, 2, 5, 12, '#c8b07a'); p.line(10, 4, 10, 14, '#c8b07a'); p.ellipse(7, 8, 2, 1.5, '#6a9a5a'); p.set(12, 7, '#c84a3a'); p.set(11, 8, '#c84a3a'); p.set(13, 8, '#c84a3a'); p.set(12, 9, '#c84a3a'); p.line(2, 10, 4, 6, '#5a8ac8'); });
ic('home', p => { p.poly([[8, 1], [15, 8], [1, 8]], '#c8643a'); p.rect(3, 8, 10, 7, '#f2ead8'); p.rect(7, 10, 3, 5, '#8a5a2a'); p.rect(4, 9, 2, 2, '#7ab0d8'); p.rect(11, 3, 2, 3, '#8a4a2a'); });
ic('book', p => { p.rect(2, 3, 12, 11, '#3a6a9a'); p.rect(3, 4, 10, 9, '#4f86c6'); p.rect(7, 3, 2, 11, '#2a4e74'); p.rect(4, 6, 2, 1, '#f2e8c8'); p.poly([[9, 8], [12, 7], [12, 10]], '#f2e8c8'); p.rect(2, 14, 12, 1, '#e8e0c8'); });
ic('trophy', p => { p.rect(4, 2, 8, 6, '#e8b83a'); p.rect(5, 3, 2, 3, '#fff0a0'); p.rect(2, 3, 2, 3, '#c8922a'); p.rect(12, 3, 2, 3, '#c8922a'); p.rect(7, 8, 2, 3, '#c8922a'); p.rect(5, 11, 6, 2, '#8a5a2a'); p.rect(4, 13, 8, 2, '#6a4420'); });
ic('chart', p => { p.rect(2, 13, 12, 1, '#5a4a3a'); p.rect(3, 9, 2, 4, '#4f86c6'); p.rect(6, 6, 2, 7, '#3f9a86'); p.rect(9, 8, 2, 5, '#e8b83a'); p.rect(12, 3, 2, 10, '#c4473f'); });
ic('gear', p => { p.ellipse(8, 8, 6, 6, '#8a94a0'); for (const [x, y] of [[7, 0], [7, 13], [0, 7], [13, 7], [2, 2], [11, 11], [2, 11], [11, 2]]) p.rect(x, y, 3, 3, '#8a94a0'); p.ellipse(8, 8, 2.2, 2.2, '#3a404a'); p.set(5, 5, '#c8d0d8'); });
ic('help', p => { p.ellipse(8, 8, 7, 7, '#4f86c6'); p.rect(6, 4, 4, 1, '#fff'); p.rect(10, 5, 1, 2, '#fff'); p.rect(8, 7, 2, 1, '#fff'); p.rect(7, 8, 2, 2, '#fff'); p.rect(7, 11, 2, 2, '#fff'); });
ic('star', p => { p.poly([[8, 1], [10, 6], [15, 6], [11, 9], [13, 15], [8, 11], [3, 15], [5, 9], [1, 6], [6, 6]], '#f2c230'); p.set(7, 4, '#fff6c0'); p.set(6, 7, '#fff6c0'); });
ic('starOff', p => { p.poly([[8, 1], [10, 6], [15, 6], [11, 9], [13, 15], [8, 11], [3, 15], [5, 9], [1, 6], [6, 6]], '#9a9490'); p.poly([[8, 4], [9, 7], [12, 7], [10, 9], [11, 12], [8, 10], [5, 12], [6, 9], [4, 7], [7, 7]], '#c8c0b8'); });
ic('lock', p => { p.rect(3, 7, 10, 8, '#c8922a'); p.rect(5, 2, 6, 2, '#8a94a0'); p.rect(4, 3, 2, 5, '#8a94a0'); p.rect(10, 3, 2, 5, '#8a94a0'); p.rect(7, 9, 2, 3, '#5a3a1a'); p.rect(4, 8, 2, 1, '#f2d468'); });
ic('check', p => { p.line(2, 8, 6, 12, '#3f9a4a'); p.line(3, 8, 6, 11, '#3f9a4a'); p.line(6, 12, 14, 3, '#3f9a4a'); p.line(6, 11, 13, 3, '#5fc46a'); });
ic('cross', p => { p.line(3, 3, 12, 12, '#c4473f'); p.line(4, 3, 13, 12, '#c4473f'); p.line(12, 3, 3, 12, '#c4473f'); p.line(13, 3, 4, 12, '#c4473f'); });
ic('sleep', p => { p.ellipse(7, 9, 6, 6, '#f2d468'); p.ellipse(10, 7, 5, 5.5, null); p.ellipse(10, 7, 5, 5.5, '#1a1426'); drawText(p, 'Z', 11, 2, '#e8e8ff'); }, 16, 16);
ICONS.sleep.fn = p => { p.ellipse(7, 9, 6, 6, '#f2d468'); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = x - 10, dy = y - 6; if (dx * dx + dy * dy < 22) p.d[y * 16 + x] = 0; } drawText(p, 'Z', 11, 2, '#c8d8ff'); };
ic('wardrobe', p => { p.rect(2, 1, 12, 14, '#9a6a36'); p.rect(3, 2, 5, 12, '#b07a40'); p.rect(8, 2, 5, 12, '#b07a40'); p.set(7, 8, '#e8c050'); p.set(9, 8, '#e8c050'); p.rect(2, 15, 2, 1, '#5a3a1a'); p.rect(12, 15, 2, 1, '#5a3a1a'); });
ic('decor', p => { p.rect(5, 9, 6, 6, '#c8643a'); p.rect(4, 8, 8, 2, '#a84a2a'); p.ellipse(6, 5, 3, 3, '#5fa84a'); p.ellipse(10, 4, 3, 3, '#4a8a3a'); p.set(6, 4, '#e86a8a'); p.set(10, 3, '#f2d030'); p.rect(8, 6, 1, 3, '#3a6a2a'); });
ic('fullscreen', p => { const c = '#f2ead8'; p.rect(1, 1, 5, 2, c); p.rect(1, 1, 2, 5, c); p.rect(10, 1, 5, 2, c); p.rect(13, 1, 2, 5, c); p.rect(1, 13, 5, 2, c); p.rect(1, 10, 2, 5, c); p.rect(10, 13, 5, 2, c); p.rect(13, 10, 2, 5, c); });
ic('sound', p => { p.rect(2, 6, 3, 4, '#f2ead8'); p.poly([[5, 6], [9, 2], [9, 14], [5, 10]], '#f2ead8'); p.line(11, 5, 12, 8, '#f2ead8'); p.line(12, 8, 11, 11, '#f2ead8'); p.line(13, 3, 15, 8, '#f2ead8'); p.line(15, 8, 13, 13, '#f2ead8'); });
ic('menu', p => { p.rect(2, 3, 12, 2, '#f2ead8'); p.rect(2, 7, 12, 2, '#f2ead8'); p.rect(2, 11, 12, 2, '#f2ead8'); });
ic('left', p => { p.poly([[11, 2], [3, 8], [11, 14]], '#f2ead8'); p.poly([[10, 4], [5, 8], [10, 12]], '#ffffff'); });
ic('right', p => { p.poly([[5, 2], [13, 8], [5, 14]], '#f2ead8'); p.poly([[6, 4], [11, 8], [6, 12]], '#ffffff'); });
ic('anchor', p => { p.ellipse(8, 3, 2, 2, '#c8d0d8'); p.rect(7, 4, 2, 10, '#c8d0d8'); p.rect(4, 6, 8, 2, '#c8d0d8'); p.line(2, 10, 6, 14, '#c8d0d8'); p.line(14, 10, 10, 14, '#c8d0d8'); p.rect(6, 13, 4, 1, '#c8d0d8'); });
ic('order', p => { p.rect(2, 2, 12, 12, '#9a6a36'); p.rect(3, 3, 5, 6, '#f6eed8'); p.rect(9, 4, 4, 5, '#f2e2c0'); p.rect(4, 10, 6, 3, '#f6eed8'); p.set(5, 3, '#c4473f'); p.set(11, 4, '#4f86c6'); p.set(7, 10, '#3f9a4a'); p.rect(4, 5, 3, 1, '#a89878'); p.rect(4, 7, 3, 1, '#a89878'); });
ic('market', p => { p.rect(1, 3, 14, 3, '#c4473f'); for (let x = 1; x < 15; x += 4) p.rect(x, 3, 2, 3, '#f4f0e4'); p.rect(2, 6, 1, 9, '#7a5228'); p.rect(13, 6, 1, 9, '#7a5228'); p.rect(3, 10, 10, 4, '#a8d8e8'); p.poly([[4, 10], [8, 9], [11, 10], [8, 11]], '#8fb2c8'); });
ic('shop', p => { p.line(3, 14, 12, 2, '#a8743e'); p.line(4, 14, 13, 2, '#8a5a2a'); p.ellipse(5, 11, 2, 2, '#8a94a0'); p.line(13, 2, 14, 10, '#d8d8e0'); p.line(14, 10, 12, 12, '#c8c8d0'); p.set(12, 11, '#c8c8d0'); });
ic('yard', p => { p.rect(7, 1, 2, 10, '#8a94a0'); p.rect(3, 5, 10, 2, '#8a94a0'); p.ellipse(8, 11, 4, 3, '#8a94a0'); p.ellipse(8, 11, 2, 1.5, '#3a404a'); p.rect(2, 13, 12, 2, '#9a6a36'); });
ic('exit', p => { p.rect(2, 2, 7, 12, '#9a6a36'); p.rect(3, 3, 5, 10, '#6a4420'); p.poly([[9, 8], [13, 4], [13, 12]], '#f2ead8'); p.rect(9, 7, 3, 2, '#f2ead8'); });
ic('fishI', p => { p.poly([[1, 8], [5, 4], [10, 4], [13, 7], [15, 4], [15, 12], [13, 9], [10, 12], [5, 12]], '#5f8fb8'); p.rect(4, 6, 6, 1, '#8fb8d8'); p.set(4, 7, '#1a1426'); p.rect(5, 10, 6, 1, '#d8e8f0'); });
ic('cast', p => { p.line(2, 14, 13, 2, '#a8743e'); p.line(3, 14, 14, 2, '#7a5228'); p.line(14, 2, 14, 12, '#e8e8f0'); p.rect(13, 12, 3, 3, '#c4473f'); p.rect(13, 12, 3, 1, '#f4f4f0'); });
ic('trash', p => { p.rect(4, 5, 8, 10, '#8a94a0'); p.rect(3, 3, 10, 2, '#a8b0b8'); p.rect(6, 2, 4, 1, '#a8b0b8'); p.rect(6, 7, 1, 6, '#5a6470'); p.rect(9, 7, 1, 6, '#5a6470'); });
ic('release', p => { p.poly([[1, 9], [5, 5], [10, 5], [13, 8], [15, 5], [15, 13], [13, 10], [10, 13], [5, 13]], '#7ab0d8'); p.set(4, 8, '#1a1426'); for (let x = 2; x < 15; x += 3) p.set(x, 2, '#c8e8ff'); p.set(8, 1, '#c8e8ff'); });
ic('swap', p => { p.poly([[2, 5], [6, 1], [6, 3], [13, 3], [13, 7], [6, 7], [6, 9]], '#4f86c6'); p.poly([[14, 11], [10, 7], [10, 9], [3, 9], [3, 13], [10, 13], [10, 15]], '#e8b83a'); });
ic('transfer', p => { p.poly([[14, 8], [9, 3], [9, 6], [2, 6], [2, 10], [9, 10], [9, 13]], '#3f9a86'); });
/* hava */
ic('sunny', p => { p.ellipse(8, 8, 4, 4, '#f6c838'); p.ellipse(7, 7, 2, 2, '#fff2a0'); for (const [x, y] of [[8, 0], [8, 14], [0, 8], [14, 8], [2, 2], [13, 2], [2, 13], [13, 13]]) p.rect(x, y, 2, 2, '#f2a830'); });
ic('cloudy', p => { p.ellipse(5, 10, 4, 3.5, '#d8dde4'); p.ellipse(9, 7, 5, 4.5, '#e8ecf0'); p.ellipse(12, 10, 3.5, 3, '#c8d0d8'); p.rect(3, 11, 11, 3, '#c8d0d8'); p.set(7, 4, '#ffffff'); });
ic('rain', p => { p.ellipse(6, 6, 4, 3.5, '#a8b4c4'); p.ellipse(10, 5, 4.5, 4, '#b8c4d0'); p.rect(3, 7, 11, 2, '#98a4b4'); for (const [x, y] of [[4, 11], [7, 12], [10, 11], [13, 12], [5, 14], [11, 14]]) { p.set(x, y, '#4f86d6'); p.set(x, y + 1, '#7ab0f0'); } });
ic('fog', p => { for (let i = 0; i < 4; i++) p.rect(1 + (i % 2) * 2, 3 + i * 3, 13 - (i % 2) * 2, 2, i % 2 ? '#c8d0d8' : '#e0e4ea'); });
ic('wind', p => { p.line(1, 5, 10, 5, '#c8e0ec'); p.line(10, 5, 12, 3, '#c8e0ec'); p.line(12, 3, 10, 2, '#c8e0ec'); p.line(1, 9, 13, 9, '#e8f2f8'); p.line(13, 9, 15, 11, '#e8f2f8'); p.line(15, 11, 13, 13, '#e8f2f8'); p.line(3, 12, 8, 12, '#c8e0ec'); });
ic('spring', p => { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; p.ellipse(8 + Math.cos(a) * 3.5, 7 + Math.sin(a) * 3.5, 2.5, 2.5, '#f2a0c0'); } p.ellipse(8, 7, 2, 2, '#f6d838'); p.rect(7, 11, 2, 5, '#4a8a3a'); });
ic('summer', p => { p.ellipse(8, 8, 5, 5, '#f6b830'); p.ellipse(7, 7, 3, 3, '#ffe070'); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; p.set(8 + Math.round(Math.cos(a) * 7), 8 + Math.round(Math.sin(a) * 7), '#f28a30'); } });
ic('autumn', p => { p.poly([[8, 1], [11, 5], [15, 5], [12, 9], [13, 14], [8, 11], [3, 14], [4, 9], [1, 5], [5, 5]], '#d8702a'); p.line(8, 4, 8, 15, '#8a4a1a'); p.set(6, 6, '#f2a040'); });
ic('winter', p => { const c = '#c8e8ff'; p.line(8, 1, 8, 15, c); p.line(1, 8, 15, 8, c); p.line(3, 3, 13, 13, c); p.line(13, 3, 3, 13, c); p.ellipse(8, 8, 2, 2, '#ffffff'); });
ic('event', p => { p.poly([[8, 1], [15, 14], [1, 14]], '#f2c230'); p.rect(7, 5, 2, 5, '#5a3a1a'); p.rect(7, 11, 2, 2, '#5a3a1a'); });
/* oltalar */
const ROD_COL = [['#c8a858', '#a88a3a'], ['#5f8a4a', '#466a36'], ['#d8d8d0', '#a8a8a0'], ['#2a2a30', '#505058'], ['#2a4a8a', '#e8b830']];
RODS.forEach((r, i) => ic('rod_' + r.id, p => { const [a, b] = ROD_COL[i]; p.line(2, 14, 14, 1, a); p.line(3, 14, 14, 2, b); if (i === 0) [4, 7, 10].forEach(t => p.set(t + 1, 14 - t, '#6a5a2a')); p.ellipse(5, 11, 2, 2, i >= 3 ? '#c8c8d0' : '#8a94a0'); p.rect(1, 13, 3, 2, i === 4 ? '#e8b830' : '#5a3a2a'); if (i === 4) p.set(9, 6, '#e8b830'); }));
const LINE_COL = ['#e8e8e0', '#a8d8e8', '#e8c870', '#6ad87a', '#f26a6a'];
LINES.forEach((l, i) => ic('line_' + l.id, p => { p.rect(3, 3, 10, 10, '#8a6a4a'); p.rect(4, 4, 8, 8, LINE_COL[i]); for (let y = 5; y < 12; y += 2) p.rect(4, y, 8, 1, dark(LINE_COL[i], 0.15)); p.rect(2, 2, 12, 2, '#6a4a2a'); p.rect(2, 12, 12, 2, '#6a4a2a'); if (i >= 2) p.set(12, 7, '#ffffff'); }));
const REEL_COL = ['#8a94a0', '#5f8fb8', '#3f9a86', '#c4473f', '#e8b83a'];
REELS.forEach((r, i) => ic('reel_' + r.id, p => { p.ellipse(7, 8, 6, 6, REEL_COL[i]); p.ellipse(7, 8, 4, 4, dark(REEL_COL[i], 0.3)); p.ellipse(7, 8, 1.5, 1.5, '#e8e8e8'); p.rect(12, 7, 3, 2, '#5a5a62'); p.rect(14, 5, 1, 6, '#3a3a42'); p.rect(4, 2, 6, 1, light(REEL_COL[i], 0.4)); }));
const HOOK_COL = ['#a8b0b8', '#d8e0e8', '#e8c050', '#5fb8e8'];
HOOKS.forEach((h, i) => ic('hook_' + h.id, p => { const c = HOOK_COL[i]; p.rect(8, 1, 2, 9, c); p.ellipse(8.5, 1.5, 1.6, 1.6, null); p.set(8, 0, c); p.set(9, 0, c); p.line(8, 10, 5, 13, c); p.line(9, 11, 6, 14, c); p.line(6, 14, 3, 12, c); p.line(3, 12, 3, 9, c); p.set(4, 9, c); if (i >= 1) p.set(2, 8, '#ffffff'); if (i >= 2) { p.rect(7, 4, 4, 1, dark(c, 0.3)); } }));
/* yemler */
ic('bait_basic', p => { p.ellipse(8, 9, 5, 4, '#e8d0a0'); p.ellipse(7, 8, 3, 2, '#f6e6c0'); p.set(10, 11, '#c8a870'); p.set(5, 10, '#c8a870'); });
ic('bait_worm', p => { const pts = [[2, 11], [4, 9], [6, 10], [8, 12], [10, 11], [12, 8], [13, 5]]; for (let i = 0; i < pts.length - 1; i++) { p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#d87a8a'); p.line(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, '#b85a6a'); } p.set(13, 4, '#e898a8'); });
ic('bait_shrimp', p => { for (let i = 0; i < 6; i++) p.ellipse(4 + i * 1.6, 9 - Math.sin(i / 5 * Math.PI) * 4, 2.2, 2.2, i % 2 ? '#f29a7a' : '#e8806a'); p.set(13, 10, '#1a1426'); p.line(13, 7, 15, 2, '#e8806a'); p.line(3, 11, 1, 14, '#e8806a'); p.line(2, 10, 1, 12, '#f2a88a'); });
ic('bait_fish', p => { p.poly([[2, 5], [12, 4], [14, 8], [12, 12], [2, 11]], '#c8d0d8'); p.rect(2, 5, 10, 2, '#5f8fb8'); p.poly([[2, 5], [4, 8], [2, 11]], '#e87a7a'); p.rect(5, 9, 6, 1, '#f0f0f0'); });
ic('bait_lure', p => { p.poly([[3, 6], [10, 3], [14, 6], [10, 10], [3, 9]], '#c8d0e0'); p.poly([[3, 6], [10, 3], [12, 5], [3, 7]], '#e8f0ff'); p.rect(4, 8, 6, 1, '#8a94a8'); p.set(12, 6, '#c4473f'); p.line(3, 10, 2, 14, '#a8b0b8'); p.line(2, 14, 4, 13, '#a8b0b8'); });
ic('bait_deep', p => { p.ellipse(8, 7, 4, 5, '#7a3ac8'); p.ellipse(7, 6, 2, 2, '#a86af0'); p.line(5, 11, 3, 15, '#c87af0'); p.line(8, 12, 8, 15, '#c87af0'); p.line(11, 11, 13, 15, '#c87af0'); p.set(9, 5, '#f2f2f2'); });
ic('bagUp', p => { ICONS.bag.fn(p); p.rect(11, 0, 5, 5, '#3f9a4a'); p.rect(13, 1, 1, 3, '#fff'); p.rect(12, 2, 3, 1, '#fff'); });
ic('chestUp', p => { ICONS.chest.fn(p); p.rect(11, 0, 5, 5, '#3f9a4a'); p.rect(13, 1, 1, 3, '#fff'); p.rect(12, 2, 3, 1, '#fff'); });
/* otomasyon ve tekne parçaları */
ic('auto1', p => { p.rect(5, 10, 6, 5, '#5a6470'); p.rect(6, 11, 4, 2, '#8a94a0'); p.line(8, 10, 14, 1, '#a8743e'); p.line(14, 1, 14, 9, '#e8e8f0'); p.set(14, 9, '#c4473f'); p.ellipse(7, 12, 1, 1, '#e8b830'); });
ic('auto2', p => { ICONS.auto1.fn(p); drawText(p, '2', 1, 2, '#f2f2f2'); });
ic('auto3', p => { ICONS.auto1.fn(p); drawText(p, '3', 1, 2, '#f2f2f2'); });
ic('auto_reel', p => { p.ellipse(8, 8, 6, 6, '#3f9a86'); p.ellipse(8, 8, 3.5, 3.5, '#2c7466'); p.line(8, 8, 12, 4, '#e8e8e8'); p.rect(2, 13, 12, 2, '#5a6470'); p.set(13, 3, '#f2c230'); });
ic('sensing', p => { p.rect(5, 6, 6, 8, '#5a6470'); p.ellipse(8, 5, 3, 3, '#4f86c6'); p.set(7, 4, '#c8e8ff'); for (let r = 4; r <= 6; r += 2) { p.set(8 - r, 3, '#f2c230'); p.set(8 + r, 3, '#f2c230'); p.set(8 - r + 1, 1, '#f2c230'); p.set(8 + r - 1, 1, '#f2c230'); } });
ic('deep_sea_gear', p => { p.ellipse(8, 8, 6, 6, '#2a3a6a'); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; p.rect(7 + Math.round(Math.cos(a) * 6), 7 + Math.round(Math.sin(a) * 6), 2, 2, '#4a5a8a'); } p.ellipse(8, 8, 2.5, 2.5, '#e8b830'); p.set(7, 7, '#fff0a0'); });
ic('upg_motor', p => { p.rect(4, 2, 8, 7, '#c4473f'); p.rect(5, 3, 6, 2, '#e86a5a'); p.rect(7, 9, 2, 4, '#5a6470'); p.rect(4, 13, 8, 2, '#8a94a0'); p.rect(3, 13, 1, 2, '#8a94a0'); });
ic('upg_storage', p => { p.rect(2, 5, 12, 9, '#4f86c6'); p.rect(2, 5, 12, 2, '#3a6a9a'); p.rect(3, 8, 10, 1, '#a8d8e8'); p.poly([[5, 10], [9, 9], [11, 10], [9, 12]], '#c8d0d8'); });
ic('upg_navigation', p => { p.ellipse(8, 8, 6, 6, '#e8d8a8'); p.ellipse(8, 8, 4.5, 4.5, '#f6eed8'); p.poly([[8, 3], [10, 8], [8, 13], [6, 8]], '#c4473f'); p.poly([[8, 8], [10, 8], [8, 13], [6, 8]], '#4f86c6'); p.ellipse(8, 8, 1, 1, '#2a2226'); });
ic('upg_hull', p => { p.poly([[1, 6], [15, 5], [13, 13], [3, 13]], '#9a6a36'); for (let y = 7; y < 13; y += 2) p.rect(2, y, 12, 1, '#7a5228'); p.rect(1, 5, 14, 1, '#e8c050'); p.set(4, 9, '#c8c8d0'); p.set(11, 9, '#c8c8d0'); });
ic('paint', p => { p.rect(3, 6, 8, 9, '#8a94a0'); p.rect(3, 6, 8, 3, '#3f9a86'); p.line(9, 1, 14, 6, '#a8743e'); p.rect(12, 6, 3, 4, '#3f9a86'); });
ic('nameplate', p => { p.rect(1, 4, 14, 8, '#7a5228'); p.rect(2, 5, 12, 6, '#f2ead8'); drawText(p, 'AB', 4, 6, '#2a2226'); });
/* müşteri logoları */
ic('cust_bahar', p => { p.ellipse(8, 8, 7, 7, '#c8423a'); p.ellipse(8, 8, 5, 5, '#f2ead8'); p.rect(5, 6, 1, 5, '#8a94a0'); p.rect(4, 5, 3, 1, '#8a94a0'); p.rect(10, 5, 2, 6, '#8a94a0'); });
ic('cust_nihat', p => { p.rect(1, 6, 14, 8, '#6a8aa8'); p.rect(1, 3, 14, 3, '#f2ead8'); for (let x = 1; x < 15; x += 3) p.rect(x, 3, 1, 3, '#c4473f'); p.poly([[4, 10], [9, 8], [12, 10], [9, 12]], '#c8d0d8'); });
ic('cust_sunset_hotel', p => { p.rect(0, 9, 16, 7, '#4f86c6'); p.ellipse(8, 9, 5, 5, '#f2a030'); p.rect(0, 10, 16, 6, '#3a6aa2'); p.rect(3, 11, 10, 1, '#f2c870'); p.rect(5, 13, 6, 1, '#f2c870'); });
ic('cust_seafood_restaurant', p => { p.poly([[2, 12], [6, 4], [10, 4], [14, 12]], '#e8806a'); p.line(4, 4, 1, 1, '#e8806a'); p.line(12, 4, 15, 1, '#e8806a'); p.set(6, 7, '#1a1426'); p.set(10, 7, '#1a1426'); p.rect(4, 12, 8, 2, '#c8604a'); });
ic('cust_north_fishery', p => { p.poly([[1, 13], [6, 3], [11, 13]], '#c8d8e8'); p.poly([[7, 13], [12, 5], [15, 13]], '#a8b8c8'); p.rect(5, 3, 2, 2, '#ffffff'); p.rect(0, 13, 16, 2, '#2a4a6a'); });
ic('cust_island_cuisine', p => { p.rect(7, 5, 2, 10, '#8a5a2a'); p.poly([[8, 5], [1, 7], [4, 3]], '#3f9a4a'); p.poly([[8, 5], [15, 7], [12, 3]], '#3f9a4a'); p.poly([[8, 5], [5, 1], [11, 1]], '#5fb85a'); p.ellipse(9, 7, 1.5, 1.5, '#8a5a2a'); p.rect(2, 14, 12, 2, '#f2d898'); });
ic('cust_cooperative', p => { ICONS.anchor.fn(p); p.ellipse(8, 8, 7, 7, null); });
ICONS.cust_cooperative.fn = p => { p.ellipse(8, 8, 7, 7, '#2a3a66'); p.ellipse(8, 3.5, 1.6, 1.6, '#e8c050'); p.rect(7, 4, 2, 9, '#e8c050'); p.rect(5, 6, 6, 1, '#e8c050'); p.line(3, 10, 6, 13, '#e8c050'); p.line(13, 10, 10, 13, '#e8c050'); };
/* dekor ikonları */
const DECOR_ICON = {
  tablo_deniz: p => { p.rect(1, 2, 14, 11, '#8a5a2a'); p.rect(2, 3, 12, 9, '#7ab0d8'); p.rect(2, 8, 12, 4, '#3a6aa2'); p.ellipse(11, 5, 1.5, 1.5, '#f6d838'); p.poly([[4, 8], [7, 5], [9, 8]], '#f4f0e4'); },
  cerceve_balik: p => { p.rect(1, 3, 14, 10, '#c8922a'); p.rect(2, 4, 12, 8, '#2a3a4a'); p.poly([[3, 8], [6, 6], [10, 6], [12, 8], [10, 10], [6, 10]], '#8fb2c8'); p.poly([[12, 8], [14, 6], [14, 10]], '#8fb2c8'); p.set(5, 7, '#1a1426'); },
  altin_olta: p => { p.rect(1, 2, 14, 12, '#5a3a1a'); p.line(3, 12, 12, 3, '#f2c230'); p.line(4, 12, 13, 3, '#c8922a'); p.ellipse(5, 10, 1.5, 1.5, '#f6d468'); },
  dumen: p => { p.ellipse(8, 8, 6, 6, '#8a5a2a'); p.ellipse(8, 8, 4, 4, null); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = x - 8, dy = y - 8; if (dx * dx + dy * dy < 14) p.d[y * 16 + x] = 0; } p.ellipse(8, 8, 1.5, 1.5, '#c8922a'); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; p.line(8, 8, 8 + Math.cos(a) * 7.5, 8 + Math.sin(a) * 7.5, '#a8743e'); } },
  takvim: p => { p.rect(2, 2, 12, 12, '#f6eed8'); p.rect(2, 2, 12, 3, '#c4473f'); p.rect(4, 7, 3, 2, '#f2a0c0'); p.rect(9, 7, 3, 2, '#f6b830'); p.rect(4, 10, 3, 2, '#d8702a'); p.rect(9, 10, 3, 2, '#a8d8f8'); },
  fener_maket: p => { p.poly([[6, 14], [7, 4], [9, 4], [10, 14]], '#f4f0e4'); p.rect(6, 8, 4, 2, '#c4473f'); p.rect(6, 12, 4, 2, '#c4473f'); p.rect(6, 2, 4, 2, '#f6d838'); p.rect(7, 1, 2, 1, '#2a2a30'); p.rect(4, 14, 8, 2, '#8a5a2a'); },
  sise_gemi: p => { p.ellipse(8, 9, 7, 4, '#a8d8c8'); p.rect(14, 8, 2, 3, '#a8743e'); p.poly([[4, 10], [11, 10], [10, 12], [5, 12]], '#8a5a2a'); p.rect(7, 5, 1, 5, '#6a4420'); p.poly([[8, 5], [11, 9], [8, 9]], '#f4f0e4'); },
  kitaplar: p => { const cs = ['#c4473f', '#4f86c6', '#3f9a86', '#e8b83a', '#8a5aa8']; cs.forEach((c, i) => p.rect(2 + i * 2.5, 3 + (i % 2), 2, 12 - (i % 2), c)); p.rect(1, 15, 14, 1, '#5a3a1a'); },
  cicek: p => { p.rect(5, 10, 6, 6, '#a8d8e8'); p.line(8, 10, 6, 5, '#4a8a3a'); p.line(8, 10, 10, 4, '#4a8a3a'); p.ellipse(6, 4, 2, 2, '#f2a0c0'); p.ellipse(10, 3, 2, 2, '#f6d838'); p.ellipse(8, 6, 1.5, 1.5, '#c8a0f0'); },
  cay_seti: p => { p.ellipse(6, 10, 4, 4, '#f4f0e4'); p.rect(2, 7, 8, 1, '#c4473f'); p.line(10, 9, 13, 7, '#f4f0e4'); p.rect(11, 12, 4, 3, '#e8c8a0'); p.rect(11, 12, 4, 1, '#c8642a'); p.set(6, 5, '#d8d8e0'); },
  pusula: p => { ICONS.upg_navigation.fn(p); },
  saksi: p => { p.poly([[4, 10], [12, 10], [11, 15], [5, 15]], '#c8643a'); for (let i = 0; i < 6; i++) p.ellipse(4 + i * 1.6, 6 + (i % 2) * 2, 2, 2, i % 2 ? '#4a8a3a' : '#5fb85a'); },
  kabuklar: p => { p.poly([[2, 13], [5, 6], [8, 13]], '#f2c8b0'); p.line(5, 7, 4, 12, '#d8a890'); p.line(5, 7, 6, 12, '#d8a890'); p.ellipse(11, 11, 3, 3, '#f6e2c8'); p.line(11, 11, 13, 9, '#c8a888'); p.set(9, 14, '#f0a0a0'); p.set(14, 14, '#e8d0a0'); },
  mercan_parca: p => { p.ellipse(8, 9, 6, 6, '#5fb8a8'); p.ellipse(6, 7, 2.5, 2.5, '#a8f0e0'); p.rect(4, 3, 8, 1, '#8a6a3a'); p.line(2, 6, 4, 3, '#8a6a3a'); p.line(14, 6, 12, 3, '#8a6a3a'); },
  rekor_pano: p => { p.rect(1, 1, 14, 14, '#9a6a36'); p.rect(2, 2, 12, 12, '#d8c8a0'); p.poly([[3, 8], [7, 6], [11, 6], [13, 8], [11, 10], [7, 10]], '#4f86c6'); p.rect(4, 12, 8, 1, '#c4473f'); drawText(p, '1', 7, 2, '#c4473f'); },
  harita_pano: p => { p.rect(1, 1, 14, 14, '#9a6a36'); p.rect(2, 2, 12, 12, '#e8d8a8'); p.ellipse(6, 7, 3, 2, '#6a9a5a'); p.ellipse(11, 10, 2, 2, '#6a9a5a'); for (const [x, y] of [[5, 5], [9, 9], [12, 4], [4, 11]]) p.set(x, y, '#c4473f'); },
  kartpostal: p => { p.rect(1, 2, 9, 7, '#f6eed8'); p.rect(2, 3, 7, 3, '#7ab0d8'); p.rect(6, 7, 9, 7, '#f2e2c0'); p.rect(7, 8, 4, 3, '#f2a030'); p.rect(12, 8, 2, 2, '#c4473f'); },
  ahsap_saat: p => { p.rect(5, 1, 6, 14, '#8a5a2a'); p.ellipse(8, 5, 2.6, 2.6, '#f6eed8'); p.line(8, 5, 8, 3, '#2a2226'); p.line(8, 5, 9, 6, '#2a2226'); p.rect(7, 9, 2, 4, '#e8c050'); p.ellipse(8, 13, 1.5, 1.5, '#e8c050'); },
  gemi_maketi: p => { p.poly([[2, 11], [14, 11], [12, 14], [4, 14]], '#8a5a2a'); p.rect(8, 2, 1, 9, '#5a3a1e'); p.poly([[9, 2], [14, 9], [9, 9]], '#f4f0e4'); p.poly([[7, 3], [3, 9], [7, 9]], '#e8e0d0'); p.rect(8, 1, 3, 1, '#c4473f'); p.rect(1, 14, 14, 1, '#5a3a1e'); },
  gaz_lambasi: p => { p.rect(5, 12, 6, 3, '#c8922a'); p.ellipse(8, 8, 3.5, 4, '#f6e27a'); p.ellipse(8, 8, 1.5, 2, '#fff8c0'); p.rect(6, 3, 4, 2, '#8a94a0'); p.rect(7, 1, 2, 2, '#5a6470'); },
  ruzgar_cani: p => { p.rect(3, 1, 10, 2, '#8a5a2a'); for (let i = 0; i < 4; i++) { p.vline(4 + i * 2.6, 3, 6 + i * 2, '#a8b0b8'); p.rect(3 + i * 2.6, 6 + i * 2, 3, 3, ['#7ab0d8', '#f2d030', '#e86a8a', '#5fc46a'][i]); } },
  balik_posteri: p => { p.rect(1, 1, 14, 14, '#f6eed8'); p.rect(1, 1, 14, 1, '#c4473f'); for (let i = 0; i < 3; i++) { p.poly([[3, 4 + i * 4], [7, 3 + i * 4], [10, 4 + i * 4], [12, 3 + i * 4], [12, 6 + i * 4], [10, 5 + i * 4], [7, 6 + i * 4]], ['#4f86c6', '#d6707a', '#e6c64a'][i]); } },
  sampiyon_flama: p => { p.rect(2, 1, 12, 1, '#5a3a1e'); p.poly([[3, 2], [13, 2], [13, 9], [8, 14], [3, 9]], '#c4473f'); p.poly([[5, 4], [11, 4], [11, 8], [8, 11], [5, 8]], '#e8b830'); p.rect(7, 5, 2, 3, '#fff0a0'); }
};
for (const k in DECOR_ICON) ic('decor_' + k, DECOR_ICON[k]);
ic('swatch', p => { });
BOAT_COLORS.forEach(bc => ic('bc_' + bc.id, p => { p.poly([[1, 6], [15, 5], [13, 12], [3, 12]], bc.c[0]); p.rect(2, 5, 13, 1, '#7a5228'); p.rect(3, 11, 10, 1, bc.c[1]); p.rect(3, 7, 10, 1, bc.c[2]); }));
EVENTS.forEach(e => { if (!ICONS['ev_' + e.id]) ic('ev_' + e.id, ICONS.event.fn); });


/* kupalar (yarışma) */
const CUP_COL = { 1: ['#f2c230', '#fff0a0', '#c8922a'], 2: ['#c8d0d8', '#ffffff', '#8a94a0'], 3: ['#d8864a', '#f8c098', '#a85a2a'] };
[1, 2, 3].forEach(k => ic('cup_' + k, p => { const [a, b, c] = CUP_COL[k]; p.poly([[3, 2], [13, 2], [12, 7], [9, 9], [7, 9], [4, 7]], a); p.rect(5, 3, 2, 4, b); p.rect(1, 3, 2, 3, c); p.rect(13, 3, 2, 3, c); p.rect(7, 9, 2, 3, c); p.rect(5, 12, 6, 1, c); p.rect(4, 13, 8, 2, '#5a3a1e'); drawText(p, String(k), 7, 4, dark(a, .5)); }));
/* yeni dükkânlar */
ic('bakery', p => { p.ellipse(8, 9, 6.5, 4.5, '#d8a050'); p.ellipse(8, 9, 2.6, 1.8, null); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = (x - 8) / 2.4, dy = (y - 9) / 1.6; if (dx * dx + dy * dy < 1) p.d[y * 16 + x] = 0; } for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; p.set(8 + Math.round(Math.cos(a) * 5), 9 + Math.round(Math.sin(a) * 3.4), '#f6eed8'); } });
ic('boutique', p => { p.rect(7, 1, 2, 2, '#8a94a0'); p.line(8, 3, 2, 8, '#8a94a0'); p.line(8, 3, 14, 8, '#8a94a0'); p.rect(2, 8, 12, 1, '#8a94a0'); p.poly([[4, 9], [12, 9], [13, 15], [3, 15]], '#c85a9a'); p.rect(4, 10, 8, 1, '#e88aba'); });
ic('homegoods', p => { p.rect(3, 7, 10, 2, '#a8743e'); p.rect(3, 9, 2, 6, '#7a5228'); p.rect(11, 9, 2, 6, '#7a5228'); p.rect(3, 2, 2, 6, '#7a5228'); p.rect(3, 2, 7, 2, '#a8743e'); });
ic('square', p => { p.line(1, 3, 15, 3, '#5a3a1e'); ['#e8483a', '#f2c230', '#4f86c6', '#5fc46a', '#c87af0'].forEach((c, i) => p.poly([[2 + i * 3, 3], [4 + i * 3, 3], [3 + i * 3, 6]], c)); p.rect(4, 9, 8, 6, '#c8b89a'); p.rect(5, 8, 6, 1, '#a89878'); p.rect(7, 6, 2, 3, '#7ab0d8'); p.set(8, 5, '#c8e8ff'); });
ic('teahouse', p => { p.poly([[5, 5], [11, 5], [10, 13], [6, 13]], '#f4f0e4'); p.poly([[6, 7], [10, 7], [9.6, 12], [6.4, 12]], '#c8402a'); p.rect(4, 13, 8, 2, '#c8922a'); p.rect(6, 4, 4, 1, '#e8e0d0'); p.set(7, 2, '#d8d8e0'); p.set(9, 1, '#d8d8e0'); p.set(8, 3, '#d8d8e0'); });
ic('snack_simit', p => { ICONS.bakery.fn(p); });
ic('snack_pogaca', p => { p.ellipse(8, 9, 6, 4.5, '#e8b860', (x, y) => y < 7 ? '#f6d890' : '#e8b860'); p.set(6, 7, '#5a3a1e'); p.set(9, 6, '#5a3a1e'); p.set(11, 8, '#5a3a1e'); });
ic('snack_borek', p => { p.poly([[2, 12], [8, 3], [14, 12]], '#e8b860'); p.line(5, 9, 11, 9, '#c8902a'); p.line(6, 7, 10, 7, '#c8902a'); p.rect(4, 10, 8, 1, '#4a8a3a'); });
ic('festival', p => { ICONS.square.fn(p); });
ic('tilt', p => { p.line(2, 14, 13, 2, '#a8743e'); p.poly([[10, 1], [15, 1], [15, 6]], '#f2c230'); });
/* ---------- UI kenarlık (9-dilim) görselleri ---------- */
function frameSkin(kind) {
  const pb = new PB(24, 24);
  if (kind === 'wood') {
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const pl = Math.floor(y / 4); pb.set(x, y, (y % 4 === 0) ? '#6a4628' : (ihash(x, pl, 3) < 0.08 ? '#8a5e36' : (pl % 2 ? '#a8743e' : '#9e6c38'))); }
    for (let i = 0; i < 24; i++) { pb.set(i, 0, '#3a2414'); pb.set(i, 23, '#3a2414'); pb.set(0, i, '#3a2414'); pb.set(23, i, '#3a2414'); pb.set(i, 1, '#c8925a'); pb.set(1, i, '#c8925a'); pb.set(i, 22, '#5a3a1e'); pb.set(22, i, '#5a3a1e'); }
    for (const [x, y] of [[3, 3], [20, 3], [3, 20], [20, 20]]) { pb.set(x, y, '#e8d8a0'); pb.set(x + 1, y + 1, '#6a5a3a'); }
  } else if (kind === 'paper') {
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) pb.set(x, y, ihash(x, y, 1) < 0.06 ? '#eadcb8' : '#f6ecd2');
    for (let i = 0; i < 24; i++) { pb.set(i, 0, '#8a6a42'); pb.set(i, 23, '#8a6a42'); pb.set(0, i, '#8a6a42'); pb.set(23, i, '#8a6a42'); pb.set(i, 1, '#fffaf0'); pb.set(1, i, '#fffaf0'); pb.set(i, 22, '#d8c49a'); pb.set(22, i, '#d8c49a'); }
    pb.set(0, 0, null); pb.d[0] = 0; pb.d[23] = 0; pb.d[23 * 24] = 0; pb.d[23 * 24 + 23] = 0;
  } else if (kind === 'btn' || kind === 'btnP' || kind === 'btnG' || kind === 'btnR' || kind === 'btnB') {
    const base = { btn: '#c89a5e', btnP: '#a87a46', btnG: '#5aa86a', btnR: '#c8604a', btnB: '#4f86c6' }[kind];
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) pb.set(x, y, y < 3 && kind !== 'btnP' ? light(base, 0.25) : (y > 19 ? dark(base, 0.25) : base));
    for (let i = 0; i < 24; i++) { pb.set(i, 0, '#3a2414'); pb.set(i, 23, '#3a2414'); pb.set(0, i, '#3a2414'); pb.set(23, i, '#3a2414'); }
    pb.d[0] = 0; pb.d[23] = 0; pb.d[23 * 24] = 0; pb.d[23 * 24 + 23] = 0;
  } else if (kind === 'slot') {
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) pb.set(x, y, '#e4d4ae');
    for (let i = 0; i < 24; i++) { pb.set(i, 0, '#8a6a42'); pb.set(0, i, '#8a6a42'); pb.set(i, 1, '#c8b48a'); pb.set(1, i, '#c8b48a'); pb.set(i, 23, '#fff6e0'); pb.set(23, i, '#fff6e0'); }
  } else if (kind === 'dark') {
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) pb.set(x, y, '#2a2238e6');
    for (let i = 0; i < 24; i++) { pb.set(i, 0, '#120c1a'); pb.set(i, 23, '#120c1a'); pb.set(0, i, '#120c1a'); pb.set(23, i, '#120c1a'); pb.set(i, 1, '#4a3e5e'); pb.set(1, i, '#4a3e5e'); }
    pb.d[0] = 0; pb.d[23] = 0; pb.d[23 * 24] = 0; pb.d[23 * 24 + 23] = 0;
  }
  return pb;
}
function installSkins() {
  const kinds = ['wood', 'paper', 'btn', 'btnP', 'btnG', 'btnR', 'btnB', 'slot', 'dark'];
  let css = '';
  for (const k of kinds) { const u = Atlas.url('skin:' + k, () => frameSkin(k), 1); css += `--skin-${k}:url(${u});`; }
  const st = document.createElement('style'); st.textContent = `:root{${css}}`; document.head.appendChild(st);
}

/* ---------- TEKNELER ---------- */
/* boatParts(id, cfg) => {back, front, w, h, deck, stand, mounts[], motor:[x,y], water} */
function boatParts(id, cfg) {
  const col = (BOAT_COLORS.find(c => c.id === cfg.color) || BOAT_COLORS[0]).c;
  const [HC, HD, HL] = col;
  const WOOD = '#a8743e', WOODD = '#7a5228', WOODL = '#c8925a', WHITE = '#f4f0e4', WHD = '#c8c4b8', STEEL = '#8a94a0', STD = '#5a6470', GLASS = '#8ac8e8', GLD = '#4a7a9a';
  const T = { coastal_skiff: [84, 52], motorboat: [116, 74], cabin: [140, 98], offshore: [176, 126] }[id];
  const [W, H] = T; const back = new PB(W, H), front = new PB(W, H);
  const hullPoly = (pts, deck) => {
    let minY = 1e9, maxY = -1e9; pts.forEach(p => { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    front.poly(pts, HC, (x, y) => {
      const t = (y - minY) / (maxY - minY);
      let c = t < 0.12 ? HL : (t > 0.78 ? HD : HC);
      if ((y - minY) % 4 === 3 && t > 0.15 && t < 0.78) c = mix(c, HD, 0.5);
      if (t > 0.86) c = cfg.hull >= 1 ? '#8a2e2a' : '#a8463a';
      if (dith(x, y, (t - 0.7) / 0.1) && t > 0.7 && t < 0.8) c = HD;
      return c;
    });
    return { minY, maxY };
  };
  const gunwale = (x0, x1, y, rise) => { for (let x = x0; x <= x1; x++) { const yy = y - Math.round(rise(x)); front.set(x, yy, WOODD); front.set(x, yy + 1, WOOD); front.set(x, yy + 2, cfg.hull >= 2 ? '#e8c050' : WHITE); } };
  const window = (pb, x, y, w, h) => { pb.rect(x - 1, y - 1, w + 2, h + 2, WHD); pb.rect(x, y, w, h, GLASS); pb.rect(x, y + h - 2, w, 2, GLD); pb.set(x + 1, y + 1, '#e8f8ff'); pb.set(x + 2, y + 1, '#e8f8ff'); };
  const outboard = (pb, x, y, big, twin) => {
    const n = twin ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const ox = x - k * 7; const w = big ? 9 : 6, h = big ? 12 : 8;
      pb.rect(ox - w, y - h, w, h, big ? '#c4473f' : '#4a5462'); pb.rect(ox - w + 1, y - h + 1, w - 2, 2, big ? '#e86a5a' : '#6a7482');
      pb.rect(ox - w + 1, y - 2, w - 2, 1, '#2a2a30');
      pb.rect(ox - Math.ceil(w / 2) - 1, y, 2, big ? 12 : 9, STD); pb.rect(ox - Math.ceil(w / 2) - 3, y + (big ? 10 : 7), 6, 2, STEEL);
    }
  };
  let res = {};
  if (id === 'coastal_skiff') {
    const deck = 32;
    // iç taraf (arka katman)
    back.rect(10, deck - 1, 58, 5, '#7a5a3a'); back.rect(30, deck - 3, 12, 2, WOOD); back.rect(52, deck - 3, 10, 2, WOOD);
    if (cfg.storage >= 9) { back.rect(44, deck - 7, 8, 6, '#4f86c6'); back.rect(44, deck - 7, 8, 1, '#3a6a9a'); back.set(46, deck - 5, '#a8d8e8'); }
    if (cfg.storage >= 12) { back.rect(53, deck - 6, 7, 5, '#3f9a86'); back.rect(53, deck - 6, 7, 1, '#2c7466'); }
    if (cfg.nav >= 1) { back.rect(62, deck - 12, 1, 10, STD); back.rect(60, deck - 15, 5, 4, '#2a2a30'); back.rect(61, deck - 14, 3, 2, '#5fd88a'); }
    if (cfg.nav >= 2) { back.vline(66, deck - 26, deck - 3, '#2a2a30'); back.set(66, deck - 27, '#f2c230'); }
    outboard(back, 10, deck - 1, cfg.motor >= 2, false);
    hullPoly([[6, deck], [70, deck - 2], [80, deck - 8], [74, deck + 10], [62, deck + 15], [16, deck + 15], [8, deck + 9]]);
    gunwale(6, 76, deck, x => x > 68 ? (x - 68) * 0.75 : 0);
    if (cfg.hull >= 1) for (let x = 14; x < 66; x += 12) { front.rect(x, deck + 3, 3, 5, '#2a2a30'); front.set(x + 1, deck + 4, '#5a5a62'); }
    res = { deck, stand: [26, deck + 3], mounts: [[14, deck - 2]], motor: [4, deck + 12], water: deck + 9 };
  } else if (id === 'motorboat') {
    const deck = 48;
    back.rect(8, deck - 1, 92, 5, '#6a5a4a');
    // tekerlek evi
    back.rect(56, deck - 26, 28, 26, WHITE); back.rect(56, deck - 26, 2, 26, WHD); back.rect(54, deck - 29, 33, 4, HC); back.rect(54, deck - 29, 33, 1, HL);
    window(back, 61, deck - 22, 7, 7); window(back, 72, deck - 22, 8, 7); back.rect(62, deck - 11, 6, 11, WOOD); back.set(66, deck - 6, '#e8c050');
    back.rect(68, deck - 44, 1, 16, STD); back.poly([[69, deck - 44], [78, deck - 41], [69, deck - 38]], '#c4473f');
    if (cfg.motor >= 3) { back.rect(57, deck - 36, 3, 8, '#3a3a42'); back.rect(61, deck - 34, 3, 6, '#3a3a42'); } else back.rect(58, deck - 34, 3, 6, '#3a3a42');
    if (cfg.nav >= 1) { back.rect(76, deck - 33, 8, 2, '#2a2a30'); back.rect(79, deck - 36, 2, 3, STD); back.rect(74, deck - 37, 12, 1, '#2a2a30'); }
    if (cfg.storage >= 16) { back.rect(24, deck - 6, 10, 5, '#4f86c6'); back.rect(24, deck - 6, 10, 1, '#3a6a9a'); }
    if (cfg.storage >= 20) { back.rect(36, deck - 6, 10, 5, '#3f9a86'); back.rect(36, deck - 6, 10, 1, '#2c7466'); back.rect(29, deck - 10, 10, 4, '#e8b83a'); }
    back.rect(4, deck - 6, 4, 6, STD); back.rect(3, deck - 8, 6, 2, '#3a3a42');
    hullPoly([[4, deck], [96, deck - 4], [112, deck - 12], [104, deck + 14], [88, deck + 22], [16, deck + 22], [6, deck + 14]]);
    gunwale(4, 108, deck, x => x > 96 ? (x - 96) * 0.6 : 0);
    for (let x = 22; x < 92; x += 16) { front.ellipse(x, deck + 6, 1.6, 1.6, WHD); front.set(x, deck + 6, GLD); }
    if (cfg.hull >= 1) for (let x = 20; x < 96; x += 18) { front.ellipse(x + 4, deck + 9, 2.5, 3, '#2a2a30'); front.ellipse(x + 4, deck + 9, 1, 1.4, '#5a5a62'); }
    res = { deck, stand: [30, deck + 3], mounts: [[10, deck - 2], [46, deck - 2]], motor: [3, deck + 16], water: deck + 14 };
  } else if (id === 'cabin') {
    const deck = 68;
    back.rect(8, deck - 1, 116, 5, '#6a5a4a');
    back.rect(60, deck - 30, 50, 30, WHITE); back.rect(60, deck - 30, 2, 30, WHD); back.rect(57, deck - 33, 56, 4, HC); back.rect(57, deck - 33, 56, 1, HL);
    window(back, 66, deck - 25, 9, 8); window(back, 79, deck - 25, 9, 8); window(back, 92, deck - 25, 12, 8); back.rect(64, deck - 14, 7, 14, WOOD); back.set(69, deck - 7, '#e8c050');
    // köprü üst kat
    back.rect(70, deck - 46, 32, 13, WHITE); back.rect(68, deck - 48, 36, 3, HC); window(back, 76, deck - 43, 7, 5); window(back, 87, deck - 43, 10, 5);
    back.rect(84, deck - 64, 1, 16, STD); back.rect(80, deck - 60, 9, 1, STD); back.poly([[85, deck - 64], [93, deck - 61], [85, deck - 58]], '#3f9a86');
    if (cfg.motor >= 4) { back.rect(72, deck - 56, 3, 8, '#3a3a42'); back.rect(76, deck - 55, 3, 7, '#3a3a42'); } else back.rect(73, deck - 54, 3, 6, '#3a3a42');
    if (cfg.nav >= 2) { back.rect(94, deck - 56, 10, 3, '#f4f0e4'); back.rect(98, deck - 53, 2, 5, STD); back.set(104, deck - 55, '#c4473f'); }
    back.rect(98, deck - 50, 1, 2, '#2a2a30');
    if (cfg.storage >= 23) { back.rect(24, deck - 6, 12, 5, '#4f86c6'); back.rect(24, deck - 6, 12, 1, '#3a6a9a'); }
    if (cfg.storage >= 28) { back.rect(38, deck - 6, 12, 5, '#3f9a86'); back.rect(31, deck - 10, 12, 4, '#e8b83a'); }
    // korkuluk
    for (let x = 6; x < 58; x += 6) back.vline(x, deck - 6, deck - 1, STEEL); back.hline(6, 58, deck - 6, STEEL);
    back.ellipse(115, deck - 18, 4, 4, '#f4f0e4'); back.ellipse(115, deck - 18, 2, 2, null); back.rect(113, deck - 22, 1, 2, '#c4473f'); back.rect(117, deck - 15, 1, 2, '#c4473f');
    back.ellipse(115, deck - 18, 1.5, 1.5, WHITE);
    hullPoly([[4, deck], [118, deck - 4], [136, deck - 14], [128, deck + 18], [108, deck + 28], [18, deck + 28], [6, deck + 18]]);
    gunwale(4, 132, deck, x => x > 118 ? (x - 118) * 0.6 : 0);
    for (let x = 30; x < 112; x += 14) { front.ellipse(x, deck + 8, 2, 2, WHD); front.ellipse(x, deck + 8, 1, 1, GLD); }
    if (cfg.hull >= 1) for (let x = 24; x < 116; x += 20) { front.ellipse(x, deck + 11, 2.5, 3, '#2a2a30'); front.ellipse(x, deck + 11, 1, 1.4, '#5a5a62'); }
    outboard(back, 8, deck, cfg.motor >= 4, false);
    res = { deck, stand: [34, deck + 3], mounts: [[12, deck - 2], [50, deck - 2]], motor: [3, deck + 20], water: deck + 18 };
  } else {
    const deck = 93;
    back.rect(10, deck - 1, 148, 5, '#5a5a5a');
    back.rect(66, deck - 30, 62, 30, WHITE); back.rect(66, deck - 30, 2, 30, WHD); back.rect(62, deck - 33, 70, 4, HC); back.rect(62, deck - 33, 70, 1, HL);
    window(back, 74, deck - 25, 12, 8); window(back, 90, deck - 25, 14, 8); window(back, 108, deck - 25, 14, 8); back.rect(70, deck - 15, 7, 15, '#3a3a42');
    // flybridge
    back.rect(78, deck - 44, 40, 11, WHITE); back.rect(76, deck - 46, 44, 3, HC); window(back, 84, deck - 41, 26, 4);
    // tuna kulesi
    back.line(84, deck - 46, 90, deck - 76, STEEL); back.line(112, deck - 46, 106, deck - 76, STEEL); back.hline(88, 108, deck - 76, STEEL); back.hline(87, 109, deck - 62, STEEL); back.rect(88, deck - 78, 21, 2, HC);
    // outrigger
    back.line(96, deck - 76, 40, deck - 92, '#c8c8d0'); back.line(100, deck - 76, 150, deck - 92, '#c8c8d0');
    if (cfg.nav >= 2) { back.ellipse(118, deck - 52, 5, 3, '#f4f0e4'); back.rect(117, deck - 49, 2, 3, STD); }
    back.rect(122, deck - 50, 1, 4, '#2a2a30'); back.rect(124, deck - 51, 1, 5, '#2a2a30');
    if (cfg.storage >= 30) { back.rect(30, deck - 6, 14, 5, '#4f86c6'); back.rect(30, deck - 6, 14, 1, '#3a6a9a'); }
    if (cfg.storage >= 36) { back.rect(46, deck - 6, 14, 5, '#3f9a86'); back.rect(37, deck - 10, 14, 4, '#e8b83a'); }
    for (let x = 8; x < 64; x += 6) back.vline(x, deck - 6, deck - 1, STEEL); back.hline(8, 64, deck - 6, STEEL);
    outboard(back, 12, deck, true, cfg.motor >= 5);
    hullPoly([[6, deck], [146, deck - 6], [172, deck - 18], [160, deck + 20], [134, deck + 32], [22, deck + 32], [8, deck + 22]]);
    gunwale(6, 168, deck, x => x > 146 ? (x - 146) * 0.55 : 0);
    front.hline(20, 150, deck + 10, cfg.hull >= 2 ? '#e8c050' : WHITE); front.hline(24, 146, deck + 11, cfg.hull >= 1 ? HL : HC);
    for (let x = 40; x < 140; x += 14) { front.ellipse(x, deck + 6, 2, 2, WHD); front.ellipse(x, deck + 6, 1, 1, GLD); }
    if (cfg.hull >= 1) for (let x = 30; x < 140; x += 22) { front.ellipse(x, deck + 15, 2.5, 3, '#2a2a30'); front.ellipse(x, deck + 15, 1, 1.4, '#5a5a62'); }
    res = { deck, stand: [44, deck + 3], mounts: [[14, deck - 2], [36, deck - 2], [58, deck - 2]], motor: [2, deck + 24], water: deck + 22 };
  }
  // isim levhası
  const name = (cfg.name || '').slice(0, 12);
  if (name) {
    const tw = textWidth(name) + 4; const px = { coastal_skiff: 52, motorboat: 80, cabin: 100, offshore: 128 }[id] - tw / 2, py = res.deck + 4;
    front.rect(px - 1, py - 1, tw + 2, 8, '#5a3a1e'); front.rect(px, py, tw, 6, '#f6eed8'); drawText(front, name, px + 2, py + 1, '#2a2226');
  }
  back.outline(null, 0.55); front.outline(null, 0.55);
  return Object.assign(res, { back, front, w: W, h: H });
}
function boatCfgOf(id) {
  const b = S.boats.byId[id]; const info = Boats.stats(id);
  return { color: b ? b.color : 'sea_green', name: b ? b.name : '', motor: info.motor, hull: info.hull, nav: info.nav, storage: info.storage };
}
function boatSprite(id, cfg) {
  cfg = cfg || boatCfgOf(id);
  const key = 'boat:' + id + ':' + JSON.stringify(cfg);
  let v = Atlas.cache.get(key); if (v) return v;
  const p = boatParts(id, cfg); v = Object.assign({}, p, { back: p.back.canvas(), front: p.front.canvas() }); Atlas.cache.set(key, v); return v;
}
