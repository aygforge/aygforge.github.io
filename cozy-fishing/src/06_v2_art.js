/* =====================================================================
   06_v2_art.js : v2 piksel varlıkları — ev akvaryum köşesi, akvaryum tankları, rekor çerçeveleri,
   ustalık rozetleri, bölge posterleri, tekne süsleri, yeni menü ikonları, kutlama
   ===================================================================== */
Object.assign(HOME_SPOTS, {
  records: { x: 664, w: 40, name: 'Kişisel Av Rekorları', icon: 'records' },
  aq_small: { x: 706, w: 44, name: 'Küçük Akvaryum', icon: 'aquarium' },
  aq_medium: { x: 800, w: 70, name: 'Orta Akvaryum', icon: 'aquarium' },
  aq_large: { x: 900, w: 90, name: 'Büyük Akvaryum', icon: 'aquarium' }
});
const AQ_POS = { small: { x: 686, y: 222, w: 40, h: 26 }, medium: { x: 762, y: 196, w: 76, h: 40 }, large: { x: 852, y: 188, w: 98, h: 76 } };
const REC_FRAMES = [[668, 62], [722, 62], [776, 62], [830, 62], [884, 62]];
function homeCorner(pb, season) {
  pb.rect(644, 40, 4, 232, '#8a6a42'); pb.rect(646, 40, 1, 232, '#c8a878');
  // rekor duvarı
  pb.rect(660, 54, 284, 60, '#7a5228'); pb.rect(662, 56, 280, 56, '#9a6a36'); for (let x = 662; x < 942; x += 14) pb.vline(x, 56, 111, '#8a5e30');
  drawText(pb, 'REKOR DUVARI', 760, 46, '#5a3a1e');
  // küçük masa
  pb.rect(678, 248, 56, 4, '#8a5a2a'); pb.rect(682, 252, 4, 20, '#6a4420'); pb.rect(726, 252, 4, 20, '#6a4420');
  // dolap
  pb.rect(752, 236, 96, 36, '#8a5a2a'); pb.rect(756, 240, 42, 28, '#a8743e'); pb.rect(802, 240, 42, 28, '#a8743e'); pb.set(796, 254, '#e8c050'); pb.set(804, 254, '#e8c050');
  // büyük akvaryum ayağı
  pb.rect(846, 264, 110, 8, '#5a3a1e'); pb.rect(850, 266, 102, 2, '#7a5228');
  // köşe halısı ve saksı
  pb.ellipse(800, 300, 120, 14, '#4a7a5a', (x, y) => ((x + y) % 8 < 2) ? '#5a8a6a' : '#4a7a5a');
  pb.rect(940, 250, 12, 22, '#c8643a'); pb.ellipse(946, 244, 8, 8, '#4a8a3a');
}
/* akvaryum çizimi — ev görünümü (küçük ölçek) ya da panel (büyük ölçek) */
const AQ_SWIM = {};
function aqSwimmers(tid, tank, w, h, sc) {
  const key = tid + ':' + JSON.stringify(tank.fish) + ':' + w + 'x' + h + ':' + sc; let a = AQ_SWIM[key]; if (a) return a;
  a = []; let k = 0; for (const f in tank.fish) for (let i = 0; i < tank.fish[f]; i++) { const r = mulberry(hash32(tid, f, i)); a.push({ f, x: r() * w, y: h * (0.15 + r() * 0.6), v: (6 + r() * 10) * sc * (r() < 0.5 ? -1 : 1), ph: r() * 6, k: k++ }); }
  for (const kk in AQ_SWIM) if (kk.startsWith(tid + ':')) delete AQ_SWIM[kk];
  AQ_SWIM[key] = a; return a;
}
function drawTank(g, tid, x, y, w, h, tank, t, sc, dt) {
  const bgc = tank.bg === 'ocean' ? ['#2a6aa8', '#123a6a'] : ['#8ad0e8', '#3a8ab8'];
  g.fillStyle = '#c8e8f0'; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = '#2a3a4a'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
  for (let j = 0; j < h; j++) { const k = j / h; g.fillStyle = k < 0.5 ? bgc[0] : (j % 2 ? bgc[1] : bgc[0]); if (k > 0.5 && ((j + Math.floor(x)) % 3)) g.fillStyle = bgc[1]; g.fillRect(x, y + j, w, 1); }
  if (tank.bg === 'ocean') { g.fillStyle = 'rgba(255,255,255,0.15)'; for (let i = 0; i < 4; i++) g.fillRect(x + (i * 23 + Math.round(t * 4)) % w, y + 2, 1, h - 6); }
  const sand = Math.max(3, Math.round(h * 0.14));
  g.fillStyle = '#e8d8a0'; g.fillRect(x, y + h - sand, w, sand); g.fillStyle = '#c8b880'; for (let i = 0; i < w; i += 4) g.fillRect(x + i, y + h - sand + ((i / 4) % 2), 2, 1);
  const d = tank.decor;
  if (d === 'plants' || d === 'coral' || d === 'rocks') for (let i = 0; i < Math.max(2, Math.floor(w / 14)); i++) {
    const px = x + 4 + Math.floor((i + 0.5) * (w - 8) / Math.max(2, Math.floor(w / 14))); const base = y + h - sand;
    if (d === 'plants') { const ph = Math.min(h * 0.6, 8 + (i % 3) * 5 * sc); for (let k = 0; k < ph; k++) { g.fillStyle = k % 3 ? '#3a9a4a' : '#5ab85a'; g.fillRect(Math.round(px + Math.sin(k * 0.3 + t * 1.5 + i) * 1.5 * sc), base - k, Math.max(1, sc), 1); } }
    if (d === 'rocks') { g.fillStyle = '#8a8a8a'; g.fillRect(px - 3 * sc, base - 4 * sc, 7 * sc, 4 * sc); g.fillStyle = '#a8a8a8'; g.fillRect(px - 2 * sc, base - 5 * sc, 4 * sc, 2 * sc); }
    if (d === 'coral') { const cs = ['#f26a8a', '#f2a030', '#c87af0']; g.fillStyle = cs[i % 3]; for (let k = 0; k < 6 * sc; k++) { g.fillRect(px, base - k, sc, 1); if (k % (2 * sc) === 0) g.fillRect(px + (k % 4 ? sc : -sc), base - k - sc, sc, sc); } }
  }
  const sw = aqSwimmers(tid, tank, w, h - sand, sc);
  g.save(); g.beginPath(); g.rect(x, y, w, h - sand + 2); g.clip();
  for (const s of sw) {
    if (dt) { s.x += s.v * dt; if (s.x < 0) { s.x = 0; s.v = Math.abs(s.v); } if (s.x > w) { s.x = w; s.v = -Math.abs(s.v); } }
    const spr = s.v > 0 ? fishSprR(s.f) : fishSprite(s.f); const fsc = sc >= 2 ? 1 : 0.5; const fw = Math.max(6, Math.round(spr.width * fsc)), fh = Math.max(3, Math.round(spr.height * fsc));
    g.drawImage(spr, Math.round(x + s.x - fw / 2), Math.round(y + s.y + Math.sin(t * 1.3 + s.ph) * 2 * sc - fh / 2), fw, fh);
  }
  g.restore();
  for (let i = 0; i < 3; i++) { const by = (t * 10 * sc + i * 17) % (h - sand); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x + 4 + i * Math.floor(w / 3), y + h - sand - by, Math.max(1, sc - 1), Math.max(1, sc - 1)); }
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 2, y + 2, 2, Math.round(h * 0.4));
  g.fillStyle = '#2a3a4a'; g.fillRect(x - 2, y - 4, w + 4, 2);
}
function drawRecordFrame(g, x, y, rec) {
  g.fillStyle = '#c8922a'; g.fillRect(x, y, 48, 44); g.fillStyle = '#f2c230'; g.fillRect(x + 1, y + 1, 46, 1); g.fillStyle = '#2a3a4a'; g.fillRect(x + 3, y + 3, 42, 30);
  if (rec) { const sp = fishSprite(rec.fid); const k = Math.min(1, 38 / sp.width, 26 / sp.height); const w = Math.max(4, Math.round(sp.width * k)), h = Math.max(3, Math.round(sp.height * k)); g.drawImage(sp, Math.round(x + 24 - w / 2), Math.round(y + 18 - h / 2), w, h); const lab = fmtKg(rec.kg) + 'KG'; drawText(g, lab, Math.round(x + 24 - textWidth(lab) / 2), y + 36, '#3a2414'); }
  else { drawText(g, 'BOŞ', x + 17, y + 16, '#8a94a0'); }
}
/* ikonlar */
const BADGE_COL = { b: ['#d8864a', '#a85a2a'], s: ['#c8d0d8', '#8a94a0'], g: ['#f2c230', '#c8922a'] };
for (const t of ['b', 's', 'g']) ic('badge_' + t, p => { const [a, b] = BADGE_COL[t]; p.poly([[8, 1], [14, 4], [14, 10], [8, 15], [2, 10], [2, 4]], a); p.poly([[8, 3], [12, 5], [12, 9], [8, 13], [4, 9], [4, 5]], b); p.poly([[5, 8], [7, 6], [10, 6], [12, 8], [10, 10], [7, 10]], light(a, .3)); p.set(6, 7, '#1a1426'); });
for (const r of REGIONS) ic('decor_poster_' + r.id, p => { const pal = REGION_PAL[r.id]; p.rect(1, 1, 14, 14, '#8a5a2a'); p.rect(2, 2, 12, 12, pal.sky[1]); p.rect(2, 9, 12, 5, pal.sea[0]); p.rect(2, 8, 12, 1, pal.land); const fid = r.fish_ids[0]; p.poly([[4, 11], [7, 10], [10, 10], [12, 11], [10, 12], [7, 12]], pal.sea[2]); p.poly([[12, 11], [14, 9], [14, 13]], pal.sea[2]); p.rect(3, 3, 3, 2, '#fff8e0'); });
ic('aquarium', p => { p.rect(1, 3, 14, 11, '#2a3a4a'); p.rect(2, 4, 12, 9, '#7ac8e8'); p.rect(2, 11, 12, 2, '#e8d8a0'); p.poly([[5, 8], [8, 6], [10, 8], [8, 9]], '#f2a030'); p.set(11, 7, '#ffffff'); p.rect(4, 9, 1, 2, '#3a9a4a'); p.rect(0, 14, 16, 2, '#8a5a2a'); });
ic('journal', p => { p.rect(2, 1, 12, 14, '#6a4a2a'); p.rect(3, 2, 10, 12, '#f2e8c8'); p.rect(3, 2, 2, 12, '#c84a3a'); p.poly([[7, 7], [10, 6], [12, 7], [10, 8]], '#4f86c6'); p.rect(6, 10, 6, 1, '#a89878'); p.rect(6, 12, 4, 1, '#a89878'); });
ic('plan', p => { p.rect(1, 2, 14, 12, '#9a6a36'); p.rect(2, 3, 12, 10, '#e8d8a8'); p.line(3, 11, 7, 6, '#c4473f'); p.line(7, 6, 10, 9, '#c4473f'); p.line(10, 9, 13, 4, '#c4473f'); p.set(13, 4, '#2a2226'); p.rect(3, 4, 2, 2, '#3a6a9a'); });
ic('trade', p => { p.rect(2, 9, 12, 2, '#8a94a0'); p.line(8, 2, 8, 9, '#8a94a0'); p.poly([[1, 8], [5, 8], [3, 4]], '#e8b83a'); p.poly([[11, 8], [15, 8], [13, 4]], '#e8b83a'); p.line(3, 4, 13, 4, '#5a6470'); p.rect(5, 12, 6, 3, '#5a3a1e'); });
ic('finance', p => { p.rect(2, 13, 12, 1, '#5a4a3a'); for (let i = 0; i < 5; i++) p.rect(3 + i * 2.4, 12 - [3, 6, 4, 8, 10][i], 2, [3, 6, 4, 8, 10][i], i === 4 ? '#5fc46a' : '#4f86c6'); p.line(2, 9, 13, 2, '#e8b83a'); });
ic('people', p => { p.ellipse(5, 5, 2.5, 2.5, '#e8c8a8'); p.ellipse(11, 5, 2.5, 2.5, '#c89870'); p.rect(2, 9, 6, 6, '#4f86c6'); p.rect(8, 9, 6, 6, '#c4473f'); });
ic('fleet', p => { ICONS.boat.fn(p); });
ic('camera', p => { p.rect(1, 4, 14, 10, '#3a3a42'); p.rect(5, 2, 6, 2, '#3a3a42'); p.ellipse(8, 9, 3.5, 3.5, '#8ac8e8'); p.ellipse(8, 9, 1.6, 1.6, '#1a1426'); p.set(7, 8, '#ffffff'); p.rect(12, 5, 2, 1, '#f2c230'); });
ic('records', p => { p.rect(1, 2, 14, 12, '#c8922a'); p.rect(2, 3, 12, 10, '#2a3a4a'); p.poly([[3, 8], [6, 6], [10, 6], [12, 8], [10, 10], [6, 10]], '#8fb2c8'); p.poly([[12, 8], [14, 6], [14, 10]], '#8fb2c8'); p.set(5, 7, '#1a1426'); });
ic('gearset', p => { ICONS.rod_light.fn(p); p.rect(9, 9, 6, 6, '#3f9a86'); drawText(p, '3', 10, 10, '#ffffff'); });
ic('title', p => { p.poly([[2, 12], [3, 4], [6, 8], [8, 2], [10, 8], [13, 4], [14, 12]], '#f2c230'); p.rect(2, 12, 12, 2, '#c8922a'); p.set(8, 6, '#c4473f'); });
for (const r of REGIONS) ic('orn_' + r.id, p => ornamentPB(p, r.id, 1, 1));
/* tekne süsü: bölgeye özgü amblem (pirinç çapa, zeytin dalı, kabuk, flama, fener, çiçek, marlin) */
function ornamentPB(p, rid, ox, oy) {
  const P = (x, y, c) => p.set(ox + x, oy + y, c);
  switch (rid) {
    case 'sakin_liman': for (const [x, y] of [[6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [4, 3], [5, 3], [7, 3], [8, 3], [3, 7], [4, 8], [5, 9], [7, 9], [8, 8], [9, 7], [6, 9]]) P(x, y, '#e8b830'); P(6, 0, '#f6d468'); break;
    case 'yesil_koy': for (let i = 0; i < 6; i++) { P(2 + i * 2, 8 - Math.round(Math.sin(i / 5 * Math.PI) * 5), '#5a8a3a'); P(3 + i * 2, 7 - Math.round(Math.sin(i / 5 * Math.PI) * 5), '#7ab04a'); } P(7, 4, '#4a3a5a'); P(9, 5, '#4a3a5a'); break;
    case 'kayalik_adalar': for (let y = 2; y < 10; y++) for (let x = 6 - (y >> 1); x <= 6 + (y >> 1); x++) P(x, y, (x - 6) % 2 ? '#f2c8b0' : '#e8a890'); break;
    case 'serin_akintilar': for (let y = 0; y < 10; y++) P(2, y, '#5a6470'); for (let y = 0; y < 5; y++) for (let x = 3; x < 12 - y * 1.6; x++) P(x, y, y % 2 ? '#4f86c6' : '#f4f0e4'); break;
    case 'sisli_kuzey': P(6, 0, '#3a3a42'); for (let y = 1; y < 3; y++) for (let x = 4; x < 9; x++) P(x, y, '#3a3a42'); for (let y = 3; y < 8; y++) for (let x = 4; x < 9; x++) P(x, y, y % 2 ? '#f6d838' : '#fff4a0'); for (let x = 3; x < 10; x++) P(x, 8, '#3a3a42'); break;
    case 'gunes_adalari': { const cs = ['#f26a8a', '#f2d030', '#f4f0f8', '#c87af0', '#f2a030']; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI; P(6 + Math.round(Math.cos(a) * 5), 2 + Math.round(Math.sin(a) * 5), cs[i % 5]); } break; }
    case 'derin_mavi': for (let x = 0; x < 12; x++) P(x, 5, '#e8b830'); for (let x = 3; x < 10; x++) { P(x, 4, '#e8b830'); P(x, 6, '#c8922a'); } P(5, 2, '#e8b830'); P(6, 3, '#e8b830'); P(11, 3, '#e8b830'); P(11, 7, '#e8b830'); P(4, 4, '#1a1426'); break;
  }
}
/* şampiyonluk kutlaması (konfeti + havai fişek) — yalnızca görsel */
const CONFETTI = Array.from({ length: 90 }, (_, i) => ({ x: (i * 53) % 640, y: -((i * 37) % 200), v: 40 + (i % 7) * 12, c: ['#e8483a', '#f2c230', '#4f86c6', '#5fc46a', '#c87af0', '#ffffff'][i % 6], w: i % 3 }));
function drawCelebration(g, t) {
  if (Game.celebrate == null) return; const k = t - Game.celebrate; if (k > 4.5 || k < 0) { if (k > 4.5) Game.celebrate = null; return; }
  for (const c of CONFETTI) { const y = (c.y + k * c.v) % 380; g.fillStyle = c.c; g.fillRect(Math.round(c.x + Math.sin(k * 3 + c.x) * 6), Math.round(y), c.w ? 2 : 1, c.w === 2 ? 1 : 2); }
  for (let f = 0; f < 3; f++) { const fk = (k - f * 0.9); if (fk < 0 || fk > 1.4) continue; const cx = 160 + f * 160, cy = 80 + (f % 2) * 30; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const r = fk * 40; g.fillStyle = ['#ffe070', '#ff8a7a', '#8ac8ff'][f]; g.globalAlpha = Math.max(0, 1 - fk / 1.4); g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r + fk * fk * 10), 2, 2); } g.globalAlpha = 1; }
  if (k < 3) { const s = 'ŞAMPİYON!'; drawText(g, s, Math.round(320 - textWidth(s, 3) / 2), 40, (Math.floor(k * 6) % 2) ? '#ffe070' : '#ffffff', 3, '#1a1426'); }
}
