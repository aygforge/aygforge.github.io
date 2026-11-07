/* =====================================================================
   06_v4_art.js : v4.0 piksel sanatı (mevcut PB / Atlas / ic üslubu)
   ikonlar · 24 kıyı nesnesi · 7 trofe ödülü · hatıralar · kıyı ortamları · Birlik panosu · sahil patikası
   ===================================================================== */
ic('guild', p => { p.rect(1, 2, 14, 11, '#6a4420'); p.rect(2, 3, 12, 9, '#e8d8a8'); p.rect(3, 4, 4, 3, '#f6eed8'); p.rect(9, 4, 4, 3, '#f6eed8'); p.rect(3, 8, 10, 1, '#a89878'); p.rect(3, 10, 7, 1, '#a89878'); p.set(5, 3, '#c4473f'); p.set(11, 3, '#4f86c6'); p.rect(7, 13, 2, 3, '#6a4420'); p.poly([[6, 1], [8, 0], [10, 1], [8, 2]], '#e8b830'); });
ic('story', p => { p.rect(2, 2, 12, 12, '#8a5a2a'); p.rect(3, 3, 10, 10, '#f6eed8'); p.ellipse(8, 7, 3, 3, '#e8b090'); p.rect(5, 10, 6, 3, '#4f86c6'); p.rect(6, 4, 4, 1, '#5a3a1e'); p.set(13, 2, '#c4473f'); p.set(14, 1, '#c4473f'); });
ic('album', p => { p.rect(2, 1, 12, 14, '#a8643a'); p.rect(3, 2, 10, 12, '#f2e8c8'); p.rect(4, 3, 4, 4, '#7ab0d8'); p.rect(9, 3, 3, 4, '#c8e8b0'); p.rect(4, 8, 8, 4, '#f2c8b0'); p.rect(2, 1, 1, 14, '#7a4a28'); });
ic('shore', p => { p.rect(0, 0, 16, 7, '#9ad0f0'); p.rect(0, 7, 16, 3, '#3aa4bc'); p.rect(0, 10, 16, 6, '#f2dca0'); p.line(0, 10, 15, 10, '#ffffff'); p.poly([[4, 13], [6, 11], [8, 13]], '#f2a0b0'); p.ellipse(11, 13, 1.6, 1.2, '#5fc4b4'); });
ic('binoc', p => { p.ellipse(4.5, 9, 3.5, 3.5, '#2a2a32'); p.ellipse(11.5, 9, 3.5, 3.5, '#2a2a32'); p.ellipse(4.5, 9, 2, 2, '#7ac8e8'); p.ellipse(11.5, 9, 2, 2, '#7ac8e8'); p.rect(6, 6, 4, 3, '#4a4a52'); p.rect(3, 4, 3, 3, '#3a3a42'); p.rect(10, 4, 3, 3, '#3a3a42'); p.set(4, 8, '#ffffff'); p.set(11, 8, '#ffffff'); });
ic('trophy_t', p => { p.rect(5, 12, 6, 2, '#8a5a2a'); p.rect(4, 14, 8, 2, '#6a4420'); p.rect(7, 9, 2, 3, '#c8922a'); p.poly([[3, 2], [13, 2], [12, 7], [8, 10], [4, 7]], '#f2c230'); p.rect(1, 3, 2, 3, '#c8922a'); p.rect(13, 3, 2, 3, '#c8922a'); p.poly([[6, 5], [8, 4], [10, 5], [8, 6]], '#4f86c6'); p.set(5, 3, '#fff2a0'); });
ic('op_school', p => { p.rect(0, 9, 16, 7, '#3aa4bc'); for (const [x, y] of [[2, 6], [6, 4], [10, 6], [13, 3]]) { p.rect(x, y, 3, 1, '#c8d8e8'); p.set(x + 3, y, '#8aa8c8'); } p.line(1, 9, 4, 9, '#ffffff'); p.line(8, 9, 12, 9, '#ffffff'); });
ic('op_big', p => { p.rect(0, 0, 16, 4, '#9ad0f0'); p.rect(0, 4, 16, 12, '#2e6a9a'); p.ellipse(7, 10, 6, 2.5, '#0e1a2a'); p.poly([[12, 10], [15, 7], [15, 13]], '#0e1a2a'); p.set(3, 9, '#5a7a9a'); });
ic('op_bottom', p => { p.rect(0, 0, 16, 12, '#2e5a8a'); p.rect(0, 12, 16, 4, '#c8b080'); for (const [x, y] of [[4, 9], [5, 6], [9, 8], [10, 4], [12, 7], [7, 2]]) p.set(x, y, '#e8f8ff'); p.ellipse(8, 12, 4, 1.5, '#e0cc98'); });
ic('op_predator', p => { p.rect(0, 0, 16, 16, '#2e6a9a'); p.poly([[2, 8], [9, 5], [13, 8], [9, 11]], '#0e1a2a'); p.poly([[2, 8], [0, 5], [0, 11]], '#0e1a2a'); p.poly([[13, 8], [15, 7], [15, 9]], '#c8d0d8'); p.line(1, 3, 6, 3, '#c8e8ff'); p.line(4, 13, 9, 13, '#c8e8ff'); });
ic('tempo', p => { p.ellipse(8, 8, 7, 7, '#f2e8c8'); p.ellipse(8, 8, 6, 6, '#ffffff'); p.line(8, 8, 8, 3, '#2a2226'); p.line(8, 8, 12, 9, '#c4473f'); p.set(8, 8, '#2a2226'); for (const [x, y] of [[8, 2], [14, 8], [8, 14], [2, 8]]) p.set(x, y, '#5a3a1e'); });
ic('inspect', p => { p.ellipse(6, 6, 4.5, 4.5, '#5a3a1e'); p.ellipse(6, 6, 3, 3, '#c8e8ff'); p.set(5, 5, '#ffffff'); p.line(9, 9, 14, 14, '#5a3a1e'); p.line(10, 9, 14, 13, '#8a5a2a'); });
ic('charm_sinarit', p => { p.line(8, 0, 8, 4, '#c8a040'); p.poly([[8, 4], [12, 8], [8, 14], [4, 8]], '#e8643a'); p.poly([[8, 6], [10, 8], [8, 11], [6, 8]], '#f2a070'); p.set(7, 7, '#ffffff'); });
ic('bc_akinti', p => { p.rect(1, 4, 14, 8, '#2f8ab8'); for (let x = 1; x < 15; x++) { p.set(x, 6 + Math.round(Math.sin(x * 0.9)), '#8ad0f0'); p.set(x, 9 + Math.round(Math.sin(x * 0.9 + 1)), '#1e5c8a'); } });
ic('orn_tr_levrek', p => ornamentPB(p, 'tr_levrek', 1, 1));
ic('orn_tr_barrakuda', p => ornamentPB(p, 'tr_barrakuda', 1, 1));
/* trofe ödülleri (dekor ikonları) */
ic('decor_tr_zargana', p => { p.rect(2, 12, 12, 3, '#6a4420'); p.rect(3, 11, 10, 1, '#8a5a2a'); p.line(2, 7, 14, 4, '#5a8ab8'); p.line(2, 8, 14, 5, '#c8d8e8'); p.line(14, 4, 15, 3, '#5a8ab8'); p.set(4, 7, '#1a1426'); p.rect(7, 7, 2, 4, '#c8a040'); p.set(1, 7, '#2a5a8a'); });
ic('decor_tr_halibut', p => { p.rect(0, 1, 16, 14, '#5a3a1e'); p.rect(1, 2, 14, 12, '#3a5a6a'); p.ellipse(8, 8, 6, 3.5, '#8a7a5a', (x, y) => (ihash(x, y, 3) < 0.2) ? '#6a5a3a' : '#8a7a5a'); p.poly([[13, 8], [15, 5], [15, 11]], '#6a5a3a'); p.set(5, 7, '#1a1426'); p.set(6, 7, '#1a1426'); p.rect(1, 12, 14, 2, '#c8e0e8'); });
ic('decor_tr_yelken', p => { p.rect(4, 13, 8, 3, '#6a4420'); p.rect(7, 10, 2, 3, '#c8922a'); p.poly([[2, 2], [14, 2], [13, 7], [8, 10], [3, 7]], '#f2c230'); p.rect(0, 3, 2, 3, '#c8922a'); p.rect(14, 3, 2, 3, '#c8922a'); p.poly([[5, 6], [8, 2], [8, 6]], '#2e4a7a'); p.line(5, 6, 11, 6, '#2e4a7a'); p.set(4, 3, '#fff2a0'); });
/* hikâye ödülleri */
ic('decor_efe_foto', p => { p.rect(1, 1, 14, 14, '#8a5a2a'); p.rect(2, 2, 12, 12, '#e8d8b0'); p.rect(3, 3, 10, 10, '#b8a888'); p.ellipse(6, 7, 2, 2, '#7a6a52'); p.rect(4, 9, 4, 4, '#5a4a3a'); p.ellipse(10, 6, 2, 2, '#7a6a52'); p.rect(8, 8, 4, 5, '#4a3a2a'); p.rect(3, 11, 10, 2, '#8a9aa8'); });
ic('decor_elif_pano', p => { p.rect(1, 2, 14, 12, '#a8743e'); p.rect(2, 3, 12, 10, '#d8c090'); p.rect(3, 4, 5, 4, '#f6f0e0'); p.rect(9, 5, 4, 5, '#f6f0e0'); p.line(3, 7, 7, 5, '#4f86c6'); p.line(9, 9, 12, 6, '#3a8a5a'); p.set(5, 4, '#c4473f'); p.set(11, 5, '#c4473f'); p.rect(3, 10, 5, 2, '#f6f0e0'); });
ic('decor_deniz_sergisi', p => { p.rect(1, 9, 14, 6, '#8a5a2a'); p.rect(2, 10, 12, 4, '#a8743e'); p.poly([[3, 9], [5, 6], [7, 9]], '#f2a0b0'); p.ellipse(10, 8, 2, 1.5, '#5fc4b4'); p.rect(12, 7, 2, 2, '#c8d0d8'); p.rect(1, 3, 14, 1, '#d8d4c8'); p.poly([[6, 3], [8, 1], [10, 3]], '#e8b830'); });
ic('decor_bora_levha', p => { p.rect(1, 4, 14, 8, '#6a4420'); p.rect(2, 5, 12, 6, '#c8925a'); p.rect(3, 7, 10, 1, '#4a2e14'); p.rect(4, 9, 8, 1, '#4a2e14'); p.set(2, 5, '#e8b830'); p.set(13, 5, '#e8b830'); p.set(2, 10, '#e8b830'); p.set(13, 10, '#e8b830'); });
ic('decor_kabuk_sergisi', p => { p.rect(1, 10, 14, 5, '#7a4a28'); p.rect(2, 3, 12, 7, '#a8d8e8'); p.rect(1, 2, 14, 1, '#7a4a28'); p.poly([[3, 9], [5, 5], [7, 9]], '#f2a0b0'); p.poly([[8, 9], [10, 6], [12, 9]], '#f2dca0'); p.ellipse(6, 5, 1, 1, '#e8f0f8'); });
ic('decor_poster_shore', p => { p.rect(1, 1, 14, 14, '#c8925a'); p.rect(2, 2, 12, 12, '#9ad0f0'); p.rect(2, 8, 12, 2, '#3aa4bc'); p.rect(2, 10, 12, 4, '#f2dca0'); p.poly([[4, 13], [6, 11], [8, 13]], '#f2a0b0'); p.ellipse(11, 4, 2, 2, '#ffe27a'); });
/* hatıra albümü ikonları */
ic('al_efe_photo', p => ICONS.decor_efe_foto.fn(p));
ic('al_mert_trip', p => { p.ellipse(8, 8, 6, 6, '#c8a040'); p.ellipse(8, 8, 5, 5, '#f6eed8'); p.poly([[8, 4], [9, 8], [8, 12], [7, 8]], '#c4473f'); p.set(8, 8, '#2a2226'); p.rect(7, 1, 2, 2, '#c8a040'); });
ic('al_elif_drawings', p => ICONS.decor_elif_pano.fn(p));
ic('al_kerem_exhibit', p => ICONS.decor_deniz_sergisi.fn(p));
ic('al_bora_plate', p => ICONS.decor_bora_levha.fn(p));
const TROPHY_COL = { t_zargana: '#5a8ab8', t_levrek: '#8a96a4', t_sinarit: '#e8643a', t_akya: '#5a8a6a', t_halibut: '#8a7a5a', t_barrakuda: '#6a7a8a', t_yelken: '#2e4a7a' };
for (const id in TROPHY_COL) ic('tr_' + id, p => { const c = TROPHY_COL[id]; p.rect(4, 13, 8, 3, '#6a4420'); p.rect(7, 10, 2, 3, '#c8922a'); p.poly([[2, 2], [14, 2], [13, 7], [8, 10], [3, 7]], id === 't_yelken' ? '#f2c230' : '#d8dce4'); p.rect(0, 3, 2, 3, '#a8a8b0'); p.rect(14, 3, 2, 3, '#a8a8b0'); p.poly([[4, 5], [8, 3], [12, 5], [8, 7]], c); p.set(11, 5, '#1a1426'); p.set(4, 3, '#ffffff'); });
/* trofe süsleri: tekne bayrağı ve flama */
{
  const _orn = ornamentPB;
  ornamentPB = function (p, rid, ox, oy) {
    const P = (x, y, c) => p.set(ox + x, oy + y, c);
    if (rid === 'tr_levrek') { for (let y = 0; y < 11; y++) P(1, y, '#5a3a1e'); for (let y = 0; y < 6; y++) for (let x = 2; x < 13; x++) P(x, y, y === 0 || y === 5 ? '#2e4a7a' : '#e8ecf0'); for (let x = 4; x < 11; x++) P(x, 2 + (x % 3 === 0 ? 1 : 0), '#8a96a4'); P(10, 2, '#1a1426'); P(4, 3, '#5a6a7c'); return; }
    if (rid === 'tr_barrakuda') { for (let y = 0; y < 11; y++) P(1, y, '#5a3a1e'); for (let y = 0; y < 5; y++) for (let x = 2; x < 13 - y * 2; x++) P(x, y, ['#f26a8a', '#f2d030', '#2fa39a', '#f2d030', '#f26a8a'][y]); return; }
    return _orn(p, rid, ox, oy);
  };
}
/* ---------- 24 kıyı nesnesi (12×12, her biri özgün) ---------- */
const SH_ART = {
  midye: p => { p.ellipse(6, 6, 5, 3, '#3a2a4a', (x, y) => y < 5 ? '#5a4a7a' : '#2a1e3a'); p.line(2, 6, 10, 6, '#7a6a9a'); p.set(4, 4, '#a89ac8'); },
  tarak: p => { p.poly([[1, 6], [6, 1], [11, 6], [6, 10]], '#f2c8a0'); for (let i = 0; i < 5; i++) p.line(6, 10, 2 + i * 2, 4, '#d8946a'); p.rect(5, 10, 3, 2, '#e8b090'); },
  spiral: p => { p.ellipse(6, 6, 5, 5, '#e8d0a8'); for (let a = 0; a < 14; a++) { const r = 4.5 - a * 0.3; p.set(6 + Math.cos(a * 0.9) * r, 6 + Math.sin(a * 0.9) * r, '#a8743e'); } p.set(6, 6, '#7a4a28'); },
  istiridye: p => { p.ellipse(6, 6, 5, 4, '#8a8478', (x, y) => (y % 2) ? '#a8a294' : '#8a8478'); p.ellipse(6, 6, 3, 2, '#e8e0f0'); p.set(5, 5, '#ffffff'); },
  minare: p => { for (let i = 0; i < 9; i++) { const w = Math.max(1, Math.round((9 - i) / 3)); p.rect(6 - w, 10 - i, w * 2, 1, i % 2 ? '#c8a878' : '#e8d0a8'); } p.set(6, 1, '#a8743e'); },
  sedef: p => { p.ellipse(6, 6, 5, 4, '#e8e0f0', (x, y) => ['#f2c8e8', '#c8e8f2', '#e8f2c8', '#f2e8c8'][(x + y) % 4]); p.set(4, 4, '#ffffff'); p.set(5, 4, '#ffffff'); },
  cam_yesil: p => { p.poly([[2, 4], [6, 2], [10, 5], [8, 10], [3, 9]], '#5fb87a'); p.line(4, 4, 6, 3, '#c8f0d0'); },
  cam_mavi: p => { p.poly([[3, 3], [9, 2], [10, 8], [5, 10], [2, 7]], '#3a6ac8'); p.line(4, 4, 7, 3, '#a8c8f0'); },
  cam_beyaz: p => { p.ellipse(6, 6, 4.5, 3.5, '#eef2f4'); p.set(4, 5, '#ffffff'); p.ellipse(7, 7, 2, 1, '#d8e0e4'); },
  cam_amber: p => { p.poly([[2, 6], [5, 2], [10, 4], [9, 9], [4, 10]], '#d89030'); p.line(4, 5, 6, 3, '#f8d090'); },
  cam_turkuaz: p => { p.poly([[3, 2], [9, 4], [10, 9], [4, 9], [2, 5]], '#2fc8c0'); p.line(4, 4, 6, 4, '#c8fff8'); },
  cam_mor: p => { p.poly([[2, 5], [6, 2], [10, 6], [7, 10], [3, 9]], '#9a6ac8'); p.line(4, 5, 6, 3, '#e0c8f8'); },
  cakil: p => { p.ellipse(6, 7, 5, 3.5, '#8a8a90', (x, y) => y < 6 ? '#a8a8b0' : '#7a7a82'); },
  kuvars: p => { p.poly([[3, 10], [4, 4], [6, 1], [8, 4], [9, 10]], '#f0f4f8'); p.line(6, 1, 6, 10, '#d8e0e8'); p.set(5, 4, '#ffffff'); },
  bazalt: p => { p.poly([[2, 9], [3, 4], [7, 2], [10, 5], [9, 10]], '#2a2a32'); p.set(5, 5, '#4a4a52'); p.set(7, 7, '#3a3a42'); },
  benekli: p => { p.ellipse(6, 6, 5, 4, '#a89878'); for (const [x, y] of [[3, 5], [6, 4], [8, 7], [5, 8], [9, 5]]) p.set(x, y, '#f0e8d8'); },
  delikli: p => { p.ellipse(6, 6, 5, 5, '#9a948a'); for (let y = 5; y <= 7; y++) for (let x = 5; x <= 7; x++) if (Math.hypot(x - 6, y - 6) < 1.6) p.d[y * p.w + x] = 0; p.set(4, 3, '#b8b2a8'); },
  cizgili_tas: p => { p.ellipse(6, 6, 5, 4, '#c8846a'); for (let y = 3; y < 10; y += 2) p.hline(2, 10, y, y % 4 === 1 ? '#f2d8b0' : '#8a4a3a'); },
  dugme: p => { p.ellipse(6, 6, 5, 5, '#c8a040'); p.ellipse(6, 6, 4, 4, '#e8c860'); p.line(6, 3, 6, 9, '#8a6a20'); p.line(4, 7, 8, 7, '#8a6a20'); p.set(4, 8, '#8a6a20'); p.set(8, 8, '#8a6a20'); },
  seramik: p => { p.poly([[1, 4], [7, 2], [11, 6], [6, 10]], '#f4f0e8'); p.line(3, 5, 8, 4, '#4f6ac8'); p.line(5, 7, 9, 6, '#4f6ac8'); p.set(6, 5, '#4f6ac8'); },
  capa_sus: p => { p.line(6, 1, 6, 10, '#a8643a'); p.line(3, 3, 9, 3, '#a8643a'); p.ellipse(6, 1, 1, 1, '#a8643a'); p.line(2, 8, 6, 10, '#8a4a2a'); p.line(10, 8, 6, 10, '#8a4a2a'); p.set(7, 6, '#c8844a'); },
  jeton: p => { p.ellipse(6, 6, 5, 5, '#b8862a'); p.ellipse(6, 6, 4, 4, '#d8a840'); p.poly([[3, 7], [9, 7], [8, 9], [4, 9]], '#8a5a1a'); p.line(6, 3, 6, 7, '#8a5a1a'); },
  ahsap: p => { p.poly([[1, 6], [5, 3], [9, 4], [11, 6], [9, 8], [5, 9]], '#a8743e'); p.poly([[11, 6], [12, 4], [12, 8]], '#8a5a2a'); p.set(4, 5, '#2a2226'); p.line(6, 5, 8, 7, '#7a4a28'); },
  duduk: p => { p.rect(2, 5, 7, 3, '#c8ccd4'); p.rect(8, 4, 3, 5, '#a8acb4'); p.set(3, 5, '#ffffff'); p.rect(4, 4, 2, 1, '#2a2a32'); p.line(1, 6, 1, 9, '#8a8a92'); }
};
const shoreSprite = id => Atlas.get('sh:' + id, () => { const p = new PB(12, 12); SH_ART[id](p); p.outline(null, 0.45); return p; });
const shoreUrl = (id, sc, seen) => Atlas.url('shu:' + id + (seen ? '' : ':s'), () => { const p = new PB(12, 12); SH_ART[id](p); p.outline(null, 0.45); return seen ? p : p.silhouette('#5a5040'); }, sc || 3);
/* ---------- kıyı ortamları ---------- */
function genShore(env, season) {
  const pb = new PB(LW, LH); const r = mulberry(env === 'sand' ? 11 : env === 'rocks' ? 22 : 33);
  bandGradient(pb, 0, 0, LW, 120, [[0, '#7cc0e8'], [1, '#d8eef4']]);
  for (let x = 0; x < LW; x++) { const h = 112 + Math.round(fbm(x * 0.01, 9, 3) * 18); for (let y = h; y < 138; y++) pb.set(x, y, y < h + 2 ? '#8ab8a0' : '#6a9a80'); }
  bandGradient(pb, 0, 138, LW, 50, [[0, '#3aa4bc'], [1, '#2a8aa8']]);
  if (env === 'sand') { for (let y = 182; y < LH; y++) for (let x = 0; x < LW; x++) pb.set(x, y, ihash(x, y, 4) < 0.08 ? '#e8cc8a' : (y < 188 ? '#f4e4b0' : '#f2dca0')); for (let x = 0; x < LW; x++) pb.set(x, 182 + Math.round(Math.sin(x * 0.05) * 2), '#ffffff'); for (let i = 0; i < 4; i++) palm(pb, 30 + i * 190 + r() * 30, 202, 16, i % 2 ? 1 : -1); }
  if (env === 'rocks') { for (let y = 180; y < LH; y++) for (let x = 0; x < LW; x++) pb.set(x, y, ihash(x, y, 7) < 0.1 ? '#8a8478' : '#a8a294'); for (let i = 0; i < 10; i++) pb.ellipse(r() * LW, 190 + r() * 150, 4 + r() * 5, 1.5 + r() * 1.5, '#7a9a5a', (x, y) => ihash(x, y, 2) < 0.4 ? '#5a8a4a' : '#7a9a5a'); }
  if (env === 'tide') { for (let y = 180; y < LH; y++) for (let x = 0; x < LW; x++) pb.set(x, y, ihash(x, y, 5) < 0.12 ? '#9a948a' : '#b8b0a0'); }
  pb.outline(null, 0.1); return pb;
}
const shoreArt = (env, season) => Atlas.get('shore:' + env + season, () => genShore(env, season));
const SHORE_POS = {
  sand: [[90, 240], [190, 300], [280, 225], [360, 290], [450, 245], [540, 305], [600, 232]],
  rocks: [[90, 250], [190, 300], [300, 235], [400, 295], [500, 245], [590, 300]],
  tide: [[100, 270], [220, 300], [330, 255], [450, 300], [560, 265]]
};
const rockPB = v => { const p = new PB(42, 26); p.ellipse(21, 15, 19, 10, '#8a8478', (x, y) => y < 11 ? '#a8a294' : (ihash(x, y, v) < 0.2 ? '#7a7468' : '#8a8478')); p.ellipse(14 + v % 5, 9, 4, 2, '#6a8a4a'); p.outline(null, 0.4); return p; };
/* ---------- kasaba: Birlik panosu ve sahil patikası (kalıcı çizim) ---------- */
{
  const _dt = decorateTown;
  decorateTown = function (v, season, pm) {
    _dt(v, season, pm); const g = TOWN_GROUND; const c = v.main.getContext('2d');
    const gb = new PB(46, 64); gb.rect(4, 24, 3, 40, '#6a4420'); gb.rect(39, 24, 3, 40, '#6a4420'); gb.rect(0, 2, 46, 36, '#7a4a28'); gb.rect(2, 4, 42, 32, '#d8c090');
    gb.rect(0, 0, 46, 4, '#5a3a1e'); for (const [x, y, w, h, col] of [[5, 13, 10, 12, '#f6eed8'], [18, 11, 10, 14, '#fffaf0'], [31, 13, 10, 12, '#f2e2c0']]) { gb.rect(x, y, w, h, col); gb.rect(x + 2, y + 4, w - 4, 1, '#a89878'); gb.rect(x + 2, y + 7, w - 5, 1, '#a89878'); gb.set(x + w / 2, y, '#c4473f'); }
    drawText(gb, 'BİRLİK', 8, 5, '#3a2414');
    c.drawImage(gb.canvas(), 1603, g - 64);
    const bp = new PB(70, 90); for (let i = 0; i < 6; i++) { bp.rect(8 + i * 8, 52 + i * 6, 14, 3, '#a8743e'); bp.rect(8 + i * 8, 55 + i * 6, 14, 1, '#7a5228'); }
    bp.rect(6, 20, 2, 46, '#6a4420'); bp.rect(0, 12, 40, 12, '#5a3a1e'); bp.rect(1, 13, 38, 10, '#e8d8a8'); drawText(bp, 'SAHİL', 4, 15, '#2e5a8a'); bp.poly([[40, 12], [46, 18], [40, 24]], '#5a3a1e');
    c.drawImage(bp.canvas(), 2344, g - 66);
  };
}
