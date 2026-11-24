/* ---- v3 ---- */
/* FOOTBALL WARS V3 — Ultimate Battle Experience (cosmetic battle layer; studio cover/tournament tools removed for ARCADE REBORN).
 * FWStatsV3 (MVP), FWVisualV3 (special VFX, finale spotlight, streak tags, momentum bar, MVP card),
 * FWCoverV3 (social cover PNG), FWTournamentV3 (fantasy brackets). Nothing here touches the battle
 * engine state, RNG or event hash: everything is derived from real events / alive units and drawn as a
 * pure function of (simT, outT), so the live view and the exported video show the same frames. */
(function (root) {
'use strict';
const E = root.FWEngine, S = root.FWSprites, F = root.FWFont;
const LW = 360, LH = 640;
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
const ease = t => { t = cl(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
const SPECIAL_IDS = () => Object.keys(E.SPECIAL_NAMES);
const TXT = {
  en: { streak: n => n >= 5 ? n + ' KO STREAK' : n + ' KO', mvp: 'BATTLE MVP', kos: 'KOS', ast: 'AST', sav: 'SAVES', lts: 'LAST TEAM STANDING', who: 'WHO SURVIVES?', winner: 'WINNER', surv: 'SURVIVORS', mom: 'MOMENTUM', fantasy: 'FANTASY SIMULATION BRACKET', champion: 'CHAMPION' },
  tr: { streak: n => n >= 5 ? n + ' KO SERİSİ' : n + ' KO', mvp: 'SAVAŞIN MVP’Sİ', kos: 'KO', ast: 'ASİST', sav: 'KURTARIŞ', lts: 'SON AYAKTA KALAN KAZANIR', who: 'KİM AYAKTA KALACAK?', winner: 'KAZANAN', surv: 'AYAKTA', mom: 'MOMENTUM', fantasy: 'KURGUSAL TURNUVA', champion: 'ŞAMPİYON' }
};

// ======================= MVP (transparent, real fields only) =======================
const MVP_W = { kills: 3, assists: 1, saves: 2 };
function mvp(w) {
  const saves = {};
  for (const e of w.events) if (e.type === E.EV.SAVE && e.a >= 0) saves[e.a] = (saves[e.a] || 0) + 1;
  const num = {}; const cnt = [0, 0];
  for (const u of w.units) num[u.id] = ++cnt[u.side];            // simulation shirt number #1..#100 per side
  const rows = w.units.map(u => ({ id: u.id, side: u.side, role: u.role, no: num[u.id], kills: u.kills, assists: u.assists, saves: saves[u.id] || 0, alive: u.alive }));
  for (const r of rows) r.score = r.kills * MVP_W.kills + r.assists * MVP_W.assists + r.saves * MVP_W.saves;
  // deterministic tie-break: score, kills, assists, saves, survived, lower id
  const cmp = (a, b) => b.score - a.score || b.kills - a.kills || b.assists - a.assists || b.saves - a.saves || (b.alive - a.alive) || a.id - b.id;
  const sorted = rows.slice().sort(cmp);
  const overall = sorted[0];
  const winnerMvp = w.winner >= 0 ? sorted.find(r => r.side === w.winner) : null;
  return { overall, winnerMvp, weights: MVP_W, top: sorted.slice(0, 5) };
}

// ======================= special attack VFX (12 identities) =======================
function createVisual(o) {
  // o: {world, tc (team colours), lang, fxLevel, atlases}
  const w = o.world; const fires = []; let scan = 0; const angCache = {};
  const fcv = document.createElement('canvas'); fcv.width = LW; fcv.height = LH; const fg = fcv.getContext('2d');
  function collect() {
    for (; scan < w.events.length; scan++) { const e = w.events[scan]; if (e.type === E.EV.SPECIAL_FIRE) fires.push({ e, idx: scan }); }
    // cache geometry of specials while their objects are alive (deterministic: constant over the special's life)
    for (const f of fires) {
      if (angCache[f.idx]) continue;
      const id = SPECIAL_IDS()[f.e.c];
      const a = w.specials.find(s => s.caster === f.e.b && s.id === id && s.fired);
      if (a) angCache[f.idx] = { ang: a.ang, chain: a.data && a.data.chain ? a.data.chain.slice() : null, r: a.r, len: a.len };
    }
  }
  function px(g, x, y, s, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), s, s); }
  function drawSpecials(g, T) {
    collect();
    const DUR = 0.65; const live = [];
    for (let i = fires.length - 1; i >= 0 && live.length < 4; i--) { const age = T - fires[i].e.t; if (age >= 0 && age <= DUR) live.push(fires[i]); else if (age > 2) break; }
    const lvl = o.fxLevel == null ? 1 : o.fxLevel;
    for (const f of live) {
      const e = f.e, k = cl((T - e.t) / DUR, 0, 1), a = 1 - k, side = e.a, col = o.tc[side];
      const id = SPECIAL_IDS()[e.c], geo = angCache[f.idx] || {}, cx = e.x, cy = e.y;
      const fwd = side === 0 ? -Math.PI / 2 : Math.PI / 2, ang = geo.ang != null ? geo.ang : fwd;
      const caster = w.units[e.b];
      g.save(); g.globalAlpha = a;
      switch (id) {
        case 'pressing_storm': { // striped pressure wave
          const r = (geo.r || 30) * (0.6 + 0.6 * k);
          g.strokeStyle = col; g.lineWidth = 1; g.setLineDash([2, 2]);
          for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(cx, cy, r * (1 - j * 0.35), 0, 6.283); g.stroke(); }
          g.setLineDash([]); g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.clip();
          g.fillStyle = col; g.globalAlpha = a * 0.5; for (let x = -r; x < r; x += 6) g.fillRect(cx + x + (k * 12 % 6), cy - r, 2, r * 2);
          break; }
        case 'high_line_interception': { // cut arcs along the line
          g.strokeStyle = '#7df9ff'; g.lineWidth = 1;
          for (let j = 0; j < 7; j++) { const x = E.ARENA.x0 + 20 + j * 46 + (j % 2) * 6; g.beginPath(); g.arc(x, cy, 6 + 6 * k, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(x + 3, cy, 6 + 6 * k, Math.PI - 0.9, Math.PI + 0.9); g.stroke(); }
          px(g, E.ARENA.x0 + k * (E.ARENA.x1 - E.ARENA.x0), cy - 1, 3, '#ffffff');
          break; }
        case 'one_two_combo': { // linked pass line with travelling glow
          const ch = (geo.chain || [e.b]).map(id2 => w.units[id2]).filter(Boolean);
          if (ch.length > 1) { g.strokeStyle = '#9ff6ff'; g.lineWidth = 1; g.beginPath(); ch.forEach((u, i) => i ? g.lineTo(u.x, u.y - 6) : g.moveTo(u.x, u.y - 6)); g.stroke();
            const seg = Math.min(ch.length - 2, Math.floor(k * (ch.length - 1))), kk = k * (ch.length - 1) - seg, u1 = ch[seg], u2 = ch[seg + 1];
            px(g, u1.x + (u2.x - u1.x) * kk - 1, u1.y - 7 + (u2.y - u1.y) * kk, 3, '#ffffff'); }
          break; }
        case 'precision_through_ball': { // glittering precise line
          const L = (geo.len || 200);
          for (let j = 0; j < 22; j++) { const d = (j / 22) * L * Math.min(1, k * 1.6); const x = cx + Math.cos(ang) * d, y = cy - 3 + Math.sin(ang) * d; if (((j + Math.floor(k * 20)) % 3) === 0) px(g, x, y, 2, '#fff6b0'); else px(g, x, y, 1, col); }
          break; }
        case 'counter_burst': case 'quick_transition': { // speed streaks
          const n = lvl === 0 ? 6 : 12;
          for (let j = 0; j < n; j++) { const off = ((j * 37) % 70) - 35, sx = cx + off + Math.cos(ang) * (k * 50), sy = cy + ((j * 53) % 50) - 25 + Math.sin(ang) * (k * 50);
            g.fillStyle = j % 2 ? '#ffffff' : col; g.fillRect(Math.round(sx - Math.cos(ang) * 8), Math.round(sy - Math.sin(ang) * 8), Math.max(1, Math.round(Math.abs(Math.cos(ang)) * 8)) || 1, Math.max(1, Math.round(Math.abs(Math.sin(ang)) * 8)) || 1); }
          if (id === 'quick_transition') { g.fillStyle = col; for (let j = 0; j < 3; j++) { const yy = cy + Math.sin(fwd) * (8 + j * 7 + k * 10); g.fillRect(cx - 5, yy, 11, 1); g.fillRect(cx - 3, yy + Math.sign(Math.sin(fwd)), 7, 1); } }
          break; }
        case 'iron_wall': { // stylised shield wall
          const nx = Math.cos(fwd + Math.PI / 2), ny = Math.sin(fwd + Math.PI / 2), fy = Math.sin(fwd) * 12;
          g.strokeStyle = '#8fc1ff'; g.fillStyle = 'rgba(120,170,255,0.25)';
          for (let j = -3; j <= 3; j++) { const x = (caster ? caster.x : cx) + nx * j * 9, y = (caster ? caster.y : cy) - 8 + ny * j * 9 + fy; g.fillRect(x - 4, y - 5, 8, 10); g.strokeRect(x - 3.5, y - 4.5, 7, 9); }
          break; }
        case 'last_line_save': { // save arc in front of the goal
          const gy = side === 0 ? E.ARENA.y1 - 18 : E.ARENA.y0 + 18;
          g.strokeStyle = '#9dffb0'; g.lineWidth = 2; g.beginPath(); g.arc(180, gy, 40 + 20 * k, side === 0 ? Math.PI * 1.1 : 0.1 * Math.PI, side === 0 ? Math.PI * 1.9 : 0.9 * Math.PI); g.stroke();
          g.lineWidth = 1; g.strokeStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy - 4, 10 + 30 * k, 0, 6.283); g.stroke();
          break; }
        case 'shoulder_charge': { // impact ring + push lines (cosmetic)
          const ex = (caster ? caster.x : cx) + Math.cos(ang) * 40, ey = (caster ? caster.y : cy) + Math.sin(ang) * 40;
          g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(ex, ey - 4, 6 + 18 * k, 0, 6.283); g.stroke();
          g.fillStyle = '#ffffff'; for (let j = -2; j <= 2; j++) { const aa = ang + j * 0.25; g.fillRect(Math.round(ex + Math.cos(aa) * (14 + 14 * k)), Math.round(ey - 4 + Math.sin(aa) * (14 + 14 * k)), 2, 2); }
          break; }
        case 'stamina_surge': { // pulse rings
          for (let j = 0; j < 2; j++) { const kk = (k * 1.6 + j * 0.5) % 1; g.globalAlpha = a * (1 - kk); g.strokeStyle = '#7dff9a'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy, 20 + 70 * kk, (20 + 70 * kk) * 0.55, 0, 0, 6.283); g.stroke(); }
          break; }
        case 'cross_fire': { // crossing ball traces
          for (let j = 0; j < 2; j++) { const s2 = j ? 1 : -1; for (let q = 0; q < 10; q++) { const d = q / 10, x = cx + s2 * 60 * (1 - d) * (1 - k * 0.6), y = cy - 40 * (1 - d) * (1 - k * 0.6); px(g, x, y, q > 7 ? 2 : 1, q % 2 ? '#fff27a' : col); } }
          g.strokeStyle = '#fff27a'; g.beginPath(); g.moveTo(cx - 5, cy - 5); g.lineTo(cx + 5, cy + 5); g.moveTo(cx + 5, cy - 5); g.lineTo(cx - 5, cy + 5); g.stroke();
          break; }
        case 'flank_overload': { // parallel lanes on both flanks
          const dir = Math.sign(Math.sin(fwd));
          for (const x of [E.ARENA.x0 + 16, E.ARENA.x1 - 16]) for (let j = 0; j < 4; j++) { const y = E.MIDY + dir * (((k * 160) + j * 40) % 160 - 80); g.fillStyle = j % 2 ? col : '#ffffff'; g.fillRect(x - 6 + j * 4, Math.round(y), 1, 10); }
          break; }
        default: g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, 10 + 30 * k, 0, 6.283); g.stroke();
      }
      g.restore();
    }
  }
  // ---- finale: spotlight on real duelists / the last hope ----
  function drawFinale(g, T, obs) {
    if (!obs || (!obs.duel && !obs.hope)) return;
    if (w.phase === 'ended' && T > w.endT + 0.45) return;
    const duel = obs.duel && T >= obs.duel.t ? obs.duel : null;
    const hope = !duel && obs.hope && T >= obs.hope.t ? obs.hope : null;
    if (!duel && !hope) return;
    const t0 = duel ? duel.t : hope.t, k = ease((T - t0) / 0.5);
    const ids = duel ? duel.ids : [hope.id];
    fg.globalCompositeOperation = 'source-over'; fg.clearRect(0, 0, LW, LH);
    fg.fillStyle = `rgba(4,5,12,${(duel ? 0.5 : 0.28) * k})`; fg.fillRect(0, 0, LW, LH);
    fg.globalCompositeOperation = 'destination-out';
    for (const id of ids) { const u = w.units[id]; const gr = fg.createRadialGradient(u.x, u.y - 6, 4, u.x, u.y - 6, 30); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); fg.fillStyle = gr; fg.fillRect(u.x - 32, u.y - 38, 64, 64); }
    fg.globalCompositeOperation = 'source-over';
    g.drawImage(fcv, 0, 0);
    if (duel) { // pixel final lights sweeping from the stands onto the duelists
      const u1 = w.units[ids[0]], u2 = w.units[ids[1]], mx = (u1.x + u2.x) / 2, my = (u1.y + u2.y) / 2;
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const [sx, c] of [[30, o.tc[0]], [330, o.tc[1]]]) { g.globalAlpha = 0.18 * k * (0.75 + 0.25 * Math.sin(T * 6 + sx)); g.fillStyle = c; g.beginPath(); g.moveTo(sx - 4, 96); g.lineTo(sx + 4, 96); g.lineTo(mx + 22, my); g.lineTo(mx - 22, my); g.closePath(); g.fill(); }
      g.restore();
    }
  }
  // ---- KO streak tags (output time; anchored to the real unit) ----
  function drawTags(g, T, outT, obs, toOut) {
    if (!obs || !obs.tags.length) return;
    const L = TXT[o.lang] || TXT.en;
    let cur = null, age = 0;
    for (const tg of obs.tags) { const ag = outT - toOut(tg.t); if (ag >= 0 && ag < 0.95) { cur = tg; age = ag; } }
    if (!cur || T < cur.t) return;
    const u = w.units[cur.unit]; const x = u.alive ? u.x : cur.x, y = (u.alive ? u.y : cur.y) - 30 - Math.round(age * 6);
    const txt = L.streak(cur.n), col = o.tc[cur.side], tw = F.measure(txt, true);
    const xx = Math.round(cl(x, tw / 2 + 6, LW - tw / 2 - 6)), yy = Math.round(cl(y, 108, 600)), aa = cl(Math.min(age / 0.08, (0.95 - age) / 0.2), 0, 1);
    g.globalAlpha = aa * 0.85; g.fillStyle = '#080a14'; g.fillRect(xx - tw / 2 - 4, yy - 2, tw + 8, 11); g.globalAlpha = aa; g.fillStyle = col; g.fillRect(xx - tw / 2 - 4, yy + 8, tw + 8, 1); g.globalAlpha = 1;
    F.draw(g, txt, xx, yy, { bold: true, color: '#ffffff', color2: col, align: 'center', alpha: aa });
  }
  // ---- momentum bar (inside the fixed HUD) ----
  function drawMomentum(g, a, obs) {
    if (!obs || a <= 0) return;
    const L = TXT[o.lang] || TXT.en;
    g.globalAlpha = a;
    F.draw(g, L.mom, 12, 93, { color: '#8f99c2', outline: null, shadow: null });
    const x0 = 72, x1 = 348, cx = (x0 + x1) / 2, hw = (x1 - x0) / 2, m = cl(obs.mom, -1, 1);
    g.fillStyle = '#1b2240'; g.fillRect(x0, 95, x1 - x0, 3);
    const len = Math.round(Math.abs(m) * hw);
    g.fillStyle = m >= 0 ? o.tc[0] : o.tc[1];
    if (m >= 0) g.fillRect(cx - len, 95, len, 3); else g.fillRect(cx, 95, len, 3);
    g.fillStyle = '#ffffff'; g.fillRect(cx, 93, 1, 7);
    g.globalAlpha = 1;
  }
  // ---- compact MVP card (outro, below the winner panel) ----
  function drawMvp(g, T, names) {
    if (w.phase !== 'ended') return;
    const p0 = T - w.endT - 0.45 - 1.0; if (p0 < 0) return;
    const M = mvp(w).overall; if (!M) return;
    const L = TXT[o.lang] || TXT.en, a = ease(p0 / 0.3), col = o.tc[M.side], u = w.units[M.id];
    const y0 = 382 + Math.round((1 - a) * 12);
    g.globalAlpha = a * 0.82; g.fillStyle = '#080a14'; g.fillRect(40, y0, 280, 50); g.globalAlpha = a; g.fillStyle = col; g.fillRect(40, y0, 280, 2); g.fillRect(40, y0 + 48, 280, 2); g.globalAlpha = 1;
    const at = o.atlases[M.side];
    if (at) { const row = S.rowIndex(u.ri, u.variant, false, false), f = 19 + (Math.floor(T * 4) & 1); g.globalAlpha = a; g.drawImage(at.canvas, f * S.CW, row * S.CH, S.CW, S.CH, 46, y0 + 6, 40, 40); g.globalAlpha = 1; }
    const role = (E.ROLE_NAMES[M.role] || {})[o.lang === 'tr' ? 'tr' : 'en'] || M.role;
    F.draw(g, L.mvp, 94, y0 + 7, { color: '#ffe14d', bold: true, alpha: a });
    const mline = F.upper(names[M.side]) + ' #' + M.no + ' • ' + F.upper(role); const msc = F.measure(mline) > 220 ? F.upper(names[M.side]) + ' #' + M.no : mline;
    F.draw(g, msc, 94, y0 + 19, { color: col, alpha: a });
    F.draw(g, `${M.kills} ${L.kos} • ${M.assists} ${L.ast} • ${M.saves} ${L.sav}`, 94, y0 + 31, { color: '#ffffff', alpha: a });
  }
  return { drawSpecials, drawFinale, drawTags, drawMomentum, drawMvp };
}

root.FWStatsV3 = { mvp, MVP_W };
root.FWVisualV3 = { createVisual, TXT };
})(typeof window !== 'undefined' ? window : globalThis);
