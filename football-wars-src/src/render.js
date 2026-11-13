/* FOOTBALL WARS — frame renderer. Everything (intro, HUD, battle, outro) is drawn on canvas,
 * at a 360x640 logical pixel-art resolution, then nearest-neighbour upscaled to the output size. */
(function (root) {
'use strict';
const E = root.FWEngine, S = root.FWSprites, F = root.FWFont;
const LW = 360, LH = 640;
const C = S.color;

const TXT = {
  tr: { goals: 'GOL', goal: 'GOOOL!', scores: 'GOL ATTI', fight: 'SAVAŞ!', lts: 'SON AYAKTA KALAN KAZANIR', winner: 'KAZANAN!', surv: n => n + ' KİŞİ AYAKTA', zone: 'ALAN DARALIYOR',
    storm: 'SON DAKİKA FIRTINASI', sudden: 'ANİ ÖLÜM', left: 'KALAN', fictional: 'KURGUSAL EŞLEŞME', time: 'SÜRE', ready: 'TAKIMLARINI SEÇ', battle: 'BATTLE' },
  en: { goals: 'GOALS', goal: 'GOOOAL!', scores: 'SCORES', fight: 'FIGHT!', lts: 'LAST TEAM STANDING', winner: 'WINNER!', surv: n => n + (n === 1 ? ' SURVIVOR' : ' SURVIVORS'), zone: 'ZONE CLOSING',
    storm: 'OVERTIME STORM', sudden: 'SUDDEN DEATH', left: 'LEFT', fictional: 'FICTIONAL MATCH-UP', time: 'TIME', ready: 'PICK YOUR TEAMS', battle: 'BATTLE' }
};
function ease(t) { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3); }
function easeBack(t) { t = Math.max(0, Math.min(1, t)); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
function h01(n) { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
function mmss(s) { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- field ----------
function buildField(kits, frame, seed) {
  const cv = mk(LW, LH), g = cv.getContext('2d');
  const r = new E.Rng(seed ^ 0xA5A5);
  // stands background
  g.fillStyle = '#0d1322'; g.fillRect(0, 0, LW, LH);
  const crowdCols = [kits[0].p, kits[0].s, kits[1].p, kits[1].s, '#d8d8d8', '#39405a', '#ffd166'];
  const crowd = (y0, y1, side) => {
    for (let y = y0; y < y1; y += 3) for (let x = 1; x < LW; x += 3) {
      if (r.next() < 0.18) continue;
      const leftBias = x < LW / 2 ? 0 : 2;
      const pick = r.next() < 0.7 ? crowdCols[leftBias + (r.next() < 0.6 ? 0 : 1)] : crowdCols[4 + r.int(3)];
      const bob = (frame && ((x * 7 + y) % 5 === 0)) ? -1 : 0;
      g.fillStyle = C.bright(pick, -0.25); g.fillRect(x, y + bob + 1, 2, 1);
      g.fillStyle = r.next() < 0.5 ? '#e7b48d' : '#8d5a3b'; g.fillRect(x, y + bob, 2, 1);
    }
    void side;
  };
  crowd(2, 90, 0); crowd(622, LH, 1);
  // stand rails
  g.fillStyle = '#1a2440'; g.fillRect(0, 90, LW, 4); g.fillRect(0, 618, LW, 3);
  g.fillStyle = '#28365e'; g.fillRect(0, 90, LW, 1);
  // pitch with stripes + dither
  const px0 = 8, px1 = 352, py0 = 94, py1 = 618;
  for (let y = py0; y < py1; y++) {
    const band = Math.floor((y - py0) / 26) % 2;
    g.fillStyle = band ? '#3f8f3a' : '#47993f'; g.fillRect(px0, y, px1 - px0, 1);
  }
  for (let i = 0; i < 2600; i++) { const x = px0 + r.int(px1 - px0), y = py0 + r.int(py1 - py0); g.fillStyle = r.next() < 0.5 ? 'rgba(20,60,20,0.35)' : 'rgba(150,210,110,0.25)'; g.fillRect(x, y, 1, 1); }
  // side boards
  g.fillStyle = '#121a2e'; g.fillRect(0, 94, px0, py1 - py0); g.fillRect(px1, 94, LW - px1, py1 - py0);
  for (let y = 100; y < 612; y += 16) { g.fillStyle = (Math.floor(y / 16) % 2) ? kits[0].p : kits[1].p; g.globalAlpha = 0.55; g.fillRect(2, y, 3, 10); g.fillRect(LW - 5, y, 3, 10); g.globalAlpha = 1; }
  // lines
  const L = '#e9f6e2'; g.fillStyle = L;
  const A = E.ARENA, x0 = A.x0 + 2, x1 = A.x1 - 2, y0 = A.y0 - 2, y1 = A.y1 + 2, my = Math.round(E.MIDY);
  g.fillRect(x0, y0, x1 - x0 + 1, 1); g.fillRect(x0, y1, x1 - x0 + 1, 1); g.fillRect(x0, y0, 1, y1 - y0); g.fillRect(x1, y0, 1, y1 - y0 + 1);
  g.fillRect(x0, my, x1 - x0, 1);
  const circ = (cx, cy, rad, from, to) => { for (let a = 0; a < 720; a++) { const t = a / 720 * Math.PI * 2; if (from != null && (t < from || t > to)) continue; g.fillRect(Math.round(cx + Math.cos(t) * rad), Math.round(cy + Math.sin(t) * rad), 1, 1); } };
  circ(180, my, 34); g.fillRect(179, my - 1, 3, 3);
  const box = (top) => {
    const yy = top ? y0 : y1, d = top ? 1 : -1;
    const bw = 82, bh = 46, sw = 40, sh = 16;
    g.fillRect(180 - bw, yy + d * bh, bw * 2, 1); g.fillRect(180 - bw, top ? yy : yy - bh, 1, bh); g.fillRect(180 + bw, top ? yy : yy - bh, 1, bh);
    g.fillRect(180 - sw, yy + d * sh, sw * 2, 1); g.fillRect(180 - sw, top ? yy : yy - sh, 1, sh); g.fillRect(180 + sw, top ? yy : yy - sh, 1, sh);
    g.fillRect(179, yy + d * 32, 2, 2);
    if (top) circ(180, yy + 32, 22, Math.PI * 0.2, Math.PI * 0.8); else circ(180, yy - 32, 22, Math.PI * 1.2, Math.PI * 1.8);
  };
  box(true); box(false);
  // goals
  const goal = (top) => {
    const GL = E.GOAL, gw = GL.x1 - GL.x0;
    const gy = top ? GL.yTop - GL.depth - 1 : GL.yBot + 1;
    g.fillStyle = 'rgba(10,14,24,0.85)'; g.fillRect(GL.x0, gy, gw, GL.depth);
    g.fillStyle = 'rgba(230,240,255,0.55)';
    for (let x = GL.x0 + 1; x < GL.x1; x += 3) g.fillRect(x, gy, 1, GL.depth);
    for (let y = gy + 1; y < gy + GL.depth; y += 3) g.fillRect(GL.x0, y, gw, 1);
    g.fillStyle = '#ffffff'; g.fillRect(GL.x0 - 1, gy, 1, GL.depth + 1); g.fillRect(GL.x1, gy, 1, GL.depth + 1); g.fillRect(GL.x0 - 1, top ? gy + GL.depth : gy, gw + 2, 1);
  };
  goal(true); goal(false);
  // corner flags
  [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y], i) => { g.fillStyle = '#fff'; g.fillRect(x, y - 5, 1, 5); g.fillStyle = i % 2 ? kits[1].p : kits[0].p; g.fillRect(x + (i % 2 ? -3 : 1), y - 5, 3, 2); });
  return cv;
}

function ballSprite(core, rim) {
  const c = mk(5, 5), g = c.getContext('2d');
  g.fillStyle = '#0b0d16'; g.fillRect(1, 0, 3, 5); g.fillRect(0, 1, 5, 3);
  g.fillStyle = core; g.fillRect(1, 1, 3, 3); g.fillStyle = rim; g.fillRect(2, 2, 1, 1);
  return c;
}
const glowCache = new Map();
function glow(col) {
  let c = glowCache.get(col); if (c) return c;
  c = mk(64, 64); const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); const rgb = C.hex(col);
  gr.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`); gr.addColorStop(0.4, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35)`); gr.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowCache.set(col, c); return c;
}

function createRenderer(o) {
  // o: {world, teams:[A,B], kits, atlases, logos:[{small,big}], lang, labels, modeLabel, fictional}
  const w = o.world;
  const worldCv = mk(LW, LH), wg = worldCv.getContext('2d');
  const hudCv = mk(LW, LH), hg = hudCv.getContext('2d');
  wg.imageSmoothingEnabled = false; hg.imageSmoothingEnabled = false;
  const fields = [buildField(o.kits, 0, w.seed), buildField(o.kits, 1, w.seed)];
  const rings = [S.baseRing(o.kits[0], o.hc), S.baseRing(o.kits[1], o.hc)];
  const balls = { white: ballSprite('#ffffff', '#20232e'), pass: ballSprite('#9ff6ff', '#2bd1ff'), power: ballSprite('#ffd166', '#ff6b1a'), cross: ballSprite('#fff27a', '#ff3d6e') };
  const tc = [C.vivid(o.teams[0].visual.primary_color), C.vivid(o.teams[1].visual.primary_color)];
  const tcL = tc.map(c => C.lum(c) < 0.12 ? C.bright(c, 0.45) : c);
  const L = TXT[o.lang] || TXT.en;
  // V3 cosmetic layer (null => exact V2 drawing)
  const v3 = o.v3 || {};
  const V3 = root.FWVisualV3 && (v3.vfx || v3.finale || v3.mvp || v3.momentum) ? root.FWVisualV3.createVisual({ world: w, tc: tcL, lang: o.lang, fxLevel: o.fxLevel, atlases: o.atlases }) : null;
  const obsS = () => w.observer && w.observer.state;
  let curOut = 0;
  const names = o.teams.map(t => o.lang === 'tr' ? (t.display_name_tr || t.name) : t.name);
  const shorts = o.teams.map(t => S.shortName(t, 98, o.lang));
  let lastCrowd = -1;
  const sorted = w.units.slice();

  function drawUnits(g, t) {
    sorted.sort((a, b) => (a.alive === b.alive ? a.y - b.y : (a.alive ? 1 : -1)));
    // bases
    for (const u of sorted) if (u.alive) g.drawImage(rings[u.side], Math.round(u.x) - 6, Math.round(u.y) - 3);
    for (const u of sorted) {
      if (!u.alive && u.deadT > 1.5) continue;
      const at = o.atlases[u.side];
      const f = S.frameFor(u, t);
      const lying = f === 9 || f === 10 || f >= 16 && f <= 18 || f >= 21;
      const row = S.rowIndex(u.ri, u.variant, lying ? false : u.back, u.face < 0);
      const dx = Math.round(u.x) - S.FOOT_X, dy = Math.round(u.y) - S.FOOT_Y;
      let alpha = 1;
      if (!u.alive) alpha = cl(1 - (u.deadT - 0.7) / 0.8, 0, 1);
      if (u.invulnT > 0 && (w.tick & 4)) alpha *= 0.55;
      if (alpha < 1) g.globalAlpha = alpha;
      if (f === 11 && u.flash > 0.06) g.drawImage(at.flash, 0, row * S.CH, S.CW, S.CH, dx, dy, S.CW, S.CH);
      else g.drawImage(at.canvas, f * S.CW, row * S.CH, S.CW, S.CH, dx, dy, S.CW, S.CH);
      if (alpha < 1) g.globalAlpha = 1;
      if (!u.alive) continue;
      const x = Math.round(u.x), y = Math.round(u.y);
      // role / status overlays
      if (u.role === 'captain') { const b = (w.tick >> 4) & 1; g.fillStyle = '#0b0d16'; g.fillRect(x - 3, y - 24 - b, 7, 4); g.fillStyle = '#ffe14d'; g.fillRect(x - 2, y - 23 - b, 5, 1); g.fillRect(x - 1, y - 22 - b, 3, 1); g.fillRect(x - 2, y - 24 - b, 1, 1); g.fillRect(x, y - 24 - b, 1, 1); g.fillRect(x + 2, y - 24 - b, 1, 1); }
      if (u.role === 'support') { const p = 0.25 + 0.2 * Math.sin(u.animT * 5); g.globalAlpha = p; g.strokeStyle = '#8ffcff'; g.beginPath(); g.ellipse(x + 0.5, y - 0.5, 8, 3, 0, 0, 6.283); g.stroke(); g.globalAlpha = 1; }
      if (u.shieldT > 0) { g.globalAlpha = 0.5; g.strokeStyle = '#7fb8ff'; g.strokeRect(x - 6.5, y - 17.5, 13, 18); g.globalAlpha = 1; }
      if (u.stun > 0) { const a = u.animT * 9; g.fillStyle = '#ffe14d'; g.fillRect(x + Math.round(Math.cos(a) * 4), y - 20 + Math.round(Math.sin(a) * 1.5), 1, 1); g.fillRect(x + Math.round(Math.cos(a + 3.14) * 4), y - 20 + Math.round(Math.sin(a + 3.14) * 1.5), 1, 1); }
      if (u.hasteT > 0 && (Math.abs(u.mvx) + Math.abs(u.mvy) > 10)) { g.fillStyle = 'rgba(255,255,255,0.55)'; const sx = -Math.sign(u.mvx || 1); g.fillRect(x + sx * 7, y - 10, 3, 1); g.fillRect(x + sx * 8, y - 7, 3, 1); }
      if (u.hp < u.maxHp && w.t - u.hitT < 1.4) {
        const fr = cl(u.hp / u.maxHp, 0, 1);
        g.fillStyle = 'rgba(11,13,22,0.8)'; g.fillRect(x - 4, y - 20, 8, 2);
        g.fillStyle = fr > 0.5 ? '#7dff9a' : fr > 0.25 ? '#ffb020' : '#ff3d4d'; g.fillRect(x - 4, y - 20, Math.max(1, Math.round(8 * fr)), 1);
      }
    }
  }
  function drawTelegraphs(g) {
    for (const a of w.specials) {
      const col = tcL[a.side], c = w.units[a.caster];
      const k = cl(a.t / a.tele, 0, 1), pulse = 0.5 + 0.5 * Math.sin(a.t * 30);
      g.save();
      if (!a.fired) {
        g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1;
        if (a.shape === 'circle') {
          g.globalAlpha = 0.12 + 0.2 * k; g.beginPath(); g.arc(a.x, a.y, a.r * k, 0, 6.283); g.fill();
          g.globalAlpha = 0.6 + 0.4 * pulse; g.setLineDash([3, 2]); g.beginPath(); g.arc(a.x, a.y, a.r, 0, 6.283); g.stroke();
        } else if (a.shape === 'cone') {
          g.globalAlpha = 0.15 + 0.25 * k; g.beginPath(); g.moveTo(c.x, c.y); g.arc(c.x, c.y, a.len, a.ang - a.r, a.ang + a.r); g.closePath(); g.fill();
          g.globalAlpha = 0.8 * pulse; g.stroke();
        } else if (a.shape === 'line') {
          g.globalAlpha = 0.25 + 0.4 * pulse; g.lineWidth = 3; g.setLineDash([5, 3]); g.beginPath(); g.moveTo(c.x, c.y - 3); g.lineTo(c.x + Math.cos(a.ang) * a.len, c.y - 3 + Math.sin(a.ang) * a.len); g.stroke();
        } else if (a.shape === 'hline') {
          g.globalAlpha = 0.3 + 0.4 * pulse; g.fillRect(E.ARENA.x0, Math.round(a.y), E.ARENA.x1 - E.ARENA.x0, 2);
        } else if (a.shape === 'link') {
          g.globalAlpha = 0.7; g.setLineDash([2, 2]); g.beginPath();
          a.data.chain.forEach((id, i) => { const u = w.units[id]; if (i) g.lineTo(u.x, u.y - 6); else g.moveTo(u.x, u.y - 6); }); g.stroke();
        } else if (a.shape === 'arrows') {
          g.globalAlpha = 0.5 + 0.5 * pulse; const d = a.side === 0 ? -1 : 1;
          for (let i = 0; i < 3; i++) { const yy = c.y + d * (10 + i * 7 + k * 6); g.fillRect(c.x - 4, yy, 9, 1); g.fillRect(c.x - 2, yy + d, 5, 1); }
        }
        if (a.shape === 'circle' || a.r > 60) { g.globalAlpha = 0.5 * pulse; g.strokeStyle = '#fff'; g.setLineDash([]); g.beginPath(); g.arc(c.x, c.y - 6, 10 + 6 * k, 0, 6.283); g.stroke(); }
      } else {
        const kk = cl((a.t - a.tele) / Math.max(0.2, a.hold), 0, 1);
        g.globalAlpha = 0.6 * (1 - kk); g.strokeStyle = '#fff'; g.lineWidth = 2;
        const rr = (a.shape === 'circle' ? a.r : 30) * (1 + kk * 0.8);
        g.beginPath(); g.arc(a.shape === 'circle' ? a.x : c.x, a.shape === 'circle' ? a.y : c.y, rr, 0, 6.283); g.stroke();
      }
      g.restore();
    }
  }
  function drawProj(g) {
    for (const p of w.proj) {
      if (!p.on) continue;
      let col = '#ffffff', spr = balls.white;
      if (p.kind === E.PK.PASS || p.kind === E.PK.COMBO) { col = '#7df9ff'; spr = balls.pass; }
      else if (p.kind === E.PK.POWER || p.kind === E.PK.PIERCE) { col = '#ff9a3d'; spr = balls.power; }
      else if (p.kind === E.PK.CROSS) { col = '#fff27a'; spr = balls.cross; }
      else if (p.kind === E.PK.CURVE) col = tcL[p.side];
      // trail
      for (let i = 0; i < p.trN; i++) {
        const idx = (p.trI - 1 - i + 10) % 5; const tx = p.tr[idx * 2], ty = p.tr[idx * 2 + 1];
        g.globalAlpha = 0.55 * (1 - i / 5); g.fillStyle = col; const s = i < 2 ? 2 : 1; g.fillRect(Math.round(tx) - (s >> 1), Math.round(ty) - (s >> 1), s, s);
      }
      g.globalAlpha = 1;
      if (p.z > 0) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(Math.round(p.x) - 1, Math.round(p.y) + 1, 3, 1); }
      if (p.kind === E.PK.PASS || p.kind === E.PK.COMBO || p.kind === E.PK.POWER || p.kind === E.PK.PIERCE) {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(glow(col), Math.round(p.x) - 6, Math.round(p.y - p.z) - 6, 12, 12); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      }
      g.drawImage(spr, Math.round(p.x) - 2, Math.round(p.y - p.z) - 2);
    }
  }
  function drawParts(g) {
    for (const p of w.parts) {
      const a = cl(p.life / p.max, 0, 1);
      if (p.type === 'ring') { g.globalAlpha = a * 0.8; g.strokeStyle = p.color; g.lineWidth = 1; g.beginPath(); g.arc(p.x, p.y, Math.max(1, (1 - a) * p.vx * 0.3 + 2), 0, 6.283); g.stroke(); continue; }
      g.globalAlpha = p.type === 'dust' ? a * 0.6 : Math.min(1, a * 1.5);
      g.fillStyle = p.color;
      if (p.type === 'confetti') { const fl = (Math.floor(p.life * 12) & 1); g.fillRect(Math.round(p.x), Math.round(p.y), fl ? 2 : 1, fl ? 1 : 2); }
      else if (p.type === 'heal') { const x = Math.round(p.x), y = Math.round(p.y - 8 * (1 - a)); g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); }
      else g.fillRect(Math.round(p.x), Math.round(p.y - p.z), p.size, p.size);
    }
    g.globalAlpha = 1;
  }
  function drawTexts(g) {
    for (const t of w.texts) { if (!o.labels && t.text !== 'CRIT') continue; F.draw(g, t.text, Math.round(t.x), Math.round(t.y), { color: t.color, align: 'center', alpha: cl(t.life / t.max * 1.6, 0, 1) }); }
    if (o.labels) for (const b of w.banners) {
      if (!b.key.startsWith('special:')) continue;
      const age = w.t - b.t0; if (age > b.dur) continue;
      const id = b.key.slice(8), nm = (E.SPECIAL_NAMES[id] || {})[o.lang] || id;
      const yy = Math.round(cl(b.y - 26 - age * 6, 110, 600)), xx = Math.round(cl(b.x, 70, 290));
      F.draw(g, nm, xx, yy, { color: tcL[b.side], align: 'center', alpha: cl((b.dur - age) * 3, 0, 1) });
    }
  }
  function drawZone(g) {
    const z = w.zone; if (!z.active) return;
    g.fillStyle = 'rgba(40,0,10,0.45)';
    g.fillRect(0, 0, LW, z.y0); g.fillRect(0, z.y1, LW, LH - z.y1); g.fillRect(0, z.y0, z.x0, z.y1 - z.y0); g.fillRect(z.x1, z.y0, LW - z.x1, z.y1 - z.y0);
    const on = (w.tick >> 3) & 1; g.fillStyle = on ? '#ff4d6d' : '#ff9a3d';
    for (let x = Math.round(z.x0); x < z.x1; x += 6) { g.fillRect(x, Math.round(z.y0), 3, 1); g.fillRect(x, Math.round(z.y1), 3, 1); }
    for (let y = Math.round(z.y0); y < z.y1; y += 6) { g.fillRect(Math.round(z.x0), y, 1, 3); g.fillRect(Math.round(z.x1), y, 1, 3); }
  }
  function drawWorld(T) {
    const g = wg;
    const crowdF = w.phase === 'ended' ? ((w.tick >> 3) & 1) : ((w.tick >> 5) & 1);
    g.drawImage(fields[crowdF], 0, 0); lastCrowd = crowdF;
    if (w.storm && !w.sudden) { g.fillStyle = `rgba(255,40,70,${0.06 + 0.05 * Math.sin(w.t * 8)})`; g.fillRect(0, 0, LW, LH); }
    drawZone(g);
    drawTelegraphs(g);
    if (V3 && v3.vfx) V3.drawSpecials(g, T);
    drawUnits(g, T);
    drawProj(g);
    if (w.fb) drawMatchBall(g);
    drawParts(g);
    if (V3 && v3.finale) V3.drawFinale(g, T, obsS());
    drawTexts(g);
    if (V3 && v3.mvp) V3.drawTags(g, T, curOut, obsS(), o.toOut || (x => x));
    if (w.flash > 0) { g.fillStyle = `rgba(255,255,255,${cl(w.flash, 0, 1) * 0.45})`; g.fillRect(0, 0, LW, LH); }
  }

  // ---------- HUD ----------
  function hudPanel(g, a) {
    if (a <= 0) return;
    g.globalAlpha = a;
    g.fillStyle = 'rgba(8,10,20,0.82)'; g.fillRect(6, 44, LW - 12, V3 && v3.momentum ? 58 : 48);
    g.fillStyle = tc[0]; g.fillRect(6, 44, 150, 2); g.fillStyle = tc[1]; g.fillRect(LW - 156, 44, 150, 2);
    g.fillStyle = '#ffe14d'; g.fillRect(156, 44, 48, 2);
    for (let s = 0; s < 2; s++) {
      const T = w.teams[s], lg = o.logos[s].small;
      const lx = s === 0 ? 10 : LW - 10 - lg.width;
      g.drawImage(lg, lx, 50);
      const nx = s === 0 ? 42 : LW - 42;
      F.draw(g, shorts[s], nx, 50, { color: '#ffffff', align: s === 0 ? 'left' : 'right' });
      const cnt = String(T.alive);
      F.draw(g, cnt, nx, 61, { scale: 3, bold: true, color: tcL[s], color2: C.bright(tcL[s], -0.2), align: s === 0 ? 'left' : 'right' });
      // alive bar
      const fr = T.alive / 100, bx = s === 0 ? 10 : LW - 150, bw = 140;
      g.fillStyle = '#20263a'; g.fillRect(bx, 86, bw, 3);
      g.fillStyle = tcL[s]; const fw = Math.round(bw * fr); g.fillRect(s === 0 ? bx : bx + bw - fw, 86, fw, 3);
    }
    const bt = w.phase === 'battle' ? w.battleT : w.phase === 'ended' ? w.endT - E.TL.battleStart : 0;
    F.draw(g, 'VS', 180, 49, { color: '#ffe14d', align: 'center', bold: true });
    F.draw(g, mmss(bt), 180, 59, { scale: 2, color: '#ffffff', align: 'center' });
    if (w.fb) F.draw(g, L.goals + ' ' + w.fb.goals[0] + '-' + w.fb.goals[1], 180, 77, { color: '#ffffff', align: 'center' });
    else F.draw(g, L.left + ' ' + (w.teams[0].alive + w.teams[1].alive), 180, 77, { color: '#9aa4c4', align: 'center' });
    g.globalAlpha = 1;
  }
  function brand(g, a) {
    if (a <= 0) return;
    F.draw(g, 'FOOTBALL WARS', 180, 20, { color: '#ffffff', color2: '#ffe14d', align: 'center', bold: true, alpha: a });
    F.draw(g, o.modeLabel, 180, 32, { color: '#c9d1ff', align: 'center', alpha: a * 0.9 });
  }
  function bigCenter(g, text, y, scale, col, a, col2) { F.draw(g, text, 180, y, { scale, bold: true, color: col, color2: col2 || C.bright(col, -0.25), align: 'center', alpha: a }); }

  function drawIntro(g, T) {
    // 0-0.35 burst / zoom ; 0.35-1.05 logos + VS ; 1.05-1.7 100v100 + logos to HUD ; 1.55-2.2 countdown ; 2.2+ FIGHT
    const dim = T < 0.3 ? 0.15 + T : T < 1.05 ? 0.5 : cl(0.5 - (T - 1.05) * 0.9, 0, 0.5);
    if (dim > 0) { g.fillStyle = `rgba(5,6,14,${dim})`; g.fillRect(0, 0, LW, LH); }
    // side flares + streaming pixels
    if (T < 1.4) {
      const fa = T < 0.35 ? ease(T / 0.35) : cl(1 - (T - 0.35) / 1.05, 0, 1);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.85 * fa; g.drawImage(glow(tcL[0]), -120, 120, 260, 360); g.drawImage(glow(tcL[1]), LW - 140, 140, 260, 360);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 70; i++) {
        const s = i & 1, sp = 260 + h01(i * 3) * 380, y = 110 + h01(i * 7 + 1) * 420, t0 = h01(i * 11 + 2) * 0.5;
        const tt = T - t0; if (tt < 0 || tt > 1.2) continue;
        const x = s === 0 ? -10 + tt * sp : LW + 10 - tt * sp; if (x < -10 || x > LW + 10) continue;
        const col = i % 3 === 0 ? '#ffffff' : (s ? (i % 2 ? tcL[1] : o.kits[1].s) : (i % 2 ? tcL[0] : o.kits[0].s));
        g.fillStyle = col; g.globalAlpha = 0.9 * cl(1.2 - tt, 0, 1); g.fillRect(Math.round(x), Math.round(y), 2, 2);
        g.globalAlpha *= 0.4; g.fillRect(Math.round(x - (s ? -1 : 1) * 8), Math.round(y), 6, 1);
      }
      g.globalAlpha = 1;
    }
    // logos sliding in, VS slam, names, then flying to HUD corners
    if (T >= 0.35 && T < 1.45) {
      const kIn = easeBack((T - 0.35) / 0.35);
      const kOut = ease((T - 1.05) / 0.4);
      for (let s = 0; s < 2; s++) {
        const lg = o.logos[s].big;
        const cxIn = s === 0 ? -80 + (98 + 80) * kIn : LW + 80 - (80 + 98) * kIn;
        const cyIn = 236;
        const hudCx = s === 0 ? 10 + 13 : LW - 10 - 13, hudCy = 63;
        const cx = cxIn + (hudCx - cxIn) * kOut, cy = cyIn + (hudCy - cyIn) * kOut;
        const sc = (1.3 - 0.25 * kIn) * (1 - kOut) + (26 / lg.width) * kOut;
        const sz = Math.round(lg.width * sc);
        if (kOut < 0.6) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 * (1 - kOut); g.drawImage(glow(tcL[s]), cx - sz, cy - sz, sz * 2, sz * 2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
        g.drawImage(lg, Math.round(cx - sz / 2), Math.round(cy - sz / 2), sz, sz);
        if (T > 0.5 && kOut < 0.3) {
          const na = cl((T - 0.5) / 0.15, 0, 1) * (1 - kOut / 0.3);
          const ny = 300 + Math.round((1 - cl((T - 0.5) / 0.15, 0, 1)) * 8);
          const sc2 = F.fitScale(names[s], 158, 2);
          const tw = F.measure(names[s]) * sc2;
          const px = s === 0 ? 92 : LW - 92;
          g.globalAlpha = na; g.fillStyle = 'rgba(8,10,20,0.85)'; g.fillRect(Math.round(px - tw / 2 - 5), ny - 4, tw + 10, 7 * sc2 + 8);
          g.fillStyle = tcL[s]; g.fillRect(Math.round(px - tw / 2 - 5), ny - 4, tw + 10, 2); g.fillRect(Math.round(px - tw / 2 - 5), ny + 7 * sc2 + 2, tw + 10, 2);
          g.globalAlpha = 1;
          F.draw(g, names[s], px, ny, { scale: sc2, color: '#ffffff', align: 'center', alpha: na });
        }
      }
      // VS slam at 0.62
      if (T > 0.6 && T < 1.15) {
        const k = ease((T - 0.6) / 0.12), sc = Math.round(10 - 4 * k);
        const a = T < 1.0 ? 1 : cl(1 - (T - 1.0) / 0.15, 0, 1);
        const sh = T < 0.85 ? Math.round(Math.sin(T * 120) * 3 * (0.85 - T) * 4) : 0;
        g.save(); g.translate(sh, 0);
        bigCenter(g, 'VS', 236 - 3.5 * sc, sc, '#ffe14d', a, '#ff8a1a');
        g.restore();
        if (T > 0.68 && T < 1.0) {
          const kk = (T - 0.68) / 0.32;
          g.strokeStyle = '#fff'; g.globalAlpha = 1 - kk; g.lineWidth = 2;
          for (let i = 0; i < 12; i++) { const an = i / 12 * 6.283, r0 = 20 + kk * 60, r1 = r0 + 14; g.beginPath(); g.moveTo(180 + Math.cos(an) * r0, 236 + Math.sin(an) * r0); g.lineTo(180 + Math.cos(an) * r1, 236 + Math.sin(an) * r1); g.stroke(); }
          g.globalAlpha = 1;
        }
      }
      if (T > 0.68 && T < 0.95) { g.fillStyle = `rgba(255,255,255,${0.85 * (1 - (T - 0.68) / 0.27)})`; g.fillRect(0, 0, LW, LH); }
    }
    // 100 VS 100 • last team standing
    if (T >= 1.05 && T < 1.62) {
      const k = ease((T - 1.05) / 0.2), a = T < 1.45 ? 1 : cl(1 - (T - 1.45) / 0.17, 0, 1);
      const x1 = -200 + (180 + 200) * k, x2 = LW + 200 - (LW + 200 - 180) * k;
      F.draw(g, '100 VS 100', Math.round(x1), 250, { scale: 5, bold: true, color: '#ffffff', color2: '#ffe14d', align: 'center', alpha: a });
      const sc = F.fitScale(L.lts, 330, 2, true);
      F.draw(g, L.lts, Math.round(x2), 300, { scale: sc, bold: true, color: '#7df9ff', align: 'center', alpha: a });
    }
    // countdown 3-2-1
    const cd = [[1.55, '3'], [1.75, '2'], [1.95, '1']];
    for (const [t0, n] of cd) {
      if (T >= t0 && T < t0 + 0.2) {
        const k = (T - t0) / 0.2; const sc = Math.round(12 - 4 * ease(k * 2));
        bigCenter(g, n, 300 - 3.5 * sc, sc, '#ffffff', 1 - Math.max(0, k - 0.7) / 0.3, '#ffe14d');
      }
    }
  }
  function drawBanners(g, T) {
    // FIGHT
    if (T >= E.TL.battleStart && T < E.TL.battleStart + 0.55) {
      const k = (T - E.TL.battleStart) / 0.55; const sc = Math.round(9 - 2 * ease(k * 2.5));
      const fs = F.fitScale(L.fight, 340, sc, true);
      bigCenter(g, L.fight, 296 - 3.5 * fs, fs, '#ffffff', 1 - Math.max(0, k - 0.6) / 0.4, '#ff4d6d');
      if (k < 0.3) { g.fillStyle = `rgba(255,255,255,${0.5 * (1 - k / 0.3)})`; g.fillRect(0, 0, LW, LH); }
    }
    for (const b of w.banners) {
      const age = w.t - b.t0; if (age < 0 || age > b.dur || b.key.startsWith('special:') || b.key === 'fight') continue;
      const a = cl(Math.min(age / 0.12, (b.dur - age) / 0.3), 0, 1);
      const pop = Math.round(1 - ease(age / 0.2));
      if (b.key === 'final15') {
        g.globalAlpha = 0.35 * a; g.fillStyle = '#ff2050'; g.fillRect(0, 270, LW, 60); g.globalAlpha = 1;
        bigCenter(g, 'FINAL CLASH', 284 - pop * 2, 4 + pop, '#ffe14d', a, '#ff6b1a');
      } else {
        const txt = b.key === 'zone' ? L.zone : b.key === 'storm' ? L.storm : b.key === 'sudden' ? L.sudden : '';
        if (!txt) continue;
        const sc = F.fitScale(txt, 330, 3, true);
        g.globalAlpha = 0.5 * a; g.fillStyle = '#12050a'; g.fillRect(0, 286, LW, 34); g.globalAlpha = 1;
        bigCenter(g, txt, 292, sc, b.color || '#ff4d6d', a);
      }
    }
    // vignette pulse during final 5
    if (w.final5 >= 0 && w.phase !== 'ended') {
      const p = 0.18 + 0.1 * Math.sin(w.t * 9);
      g.fillStyle = `rgba(255,30,60,${p})`; g.fillRect(0, 100, 4, 520); g.fillRect(LW - 4, 100, 4, 520); g.fillRect(0, 100, LW, 3); g.fillRect(0, 617, LW, 3);
    }
  }
  function drawOutro(g, T) {
    const since = T - w.endT; if (since < 0) return;
    const win = w.winner, lose = 1 - win;
    const p0 = since - 0.45; if (p0 < 0) return;
    const k = ease(p0 / 0.45);
    g.fillStyle = `rgba(5,6,14,${0.45 * k})`; g.fillRect(0, 0, LW, LH);
    const cy = 204;
    // light rays
    g.save(); g.translate(180, cy); g.rotate(since * 0.5);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.globalAlpha = 0.18 * k; g.fillStyle = i % 2 ? tcL[win] : '#ffffff'; g.beginPath(); g.moveTo(0, 0); g.lineTo(220, -24); g.lineTo(220, 24); g.closePath(); g.fill(); }
    g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.8 * k; g.drawImage(glow(tcL[win]), 180 - 90, cy - 90, 180, 180); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // panel frame
    const pa = ease((p0 - 0.05) / 0.3);
    if (pa > 0) {
      g.globalAlpha = pa; g.fillStyle = 'rgba(8,10,20,0.66)'; g.fillRect(24, 104, LW - 48, 270);
      g.fillStyle = tcL[win]; g.fillRect(24, 104, LW - 48, 3); g.fillRect(24, 371, LW - 48, 3);
      g.fillStyle = '#ffe14d'; g.fillRect(24, 104, 3, 270); g.fillRect(LW - 27, 104, 3, 270); g.globalAlpha = 1;
    }
    // WINNER text bounce
    const wk = easeBack((p0 - 0.1) / 0.35);
    if (p0 > 0.1) { const sc = F.fitScale(L.winner, 300, 5, true); const bob = Math.round(Math.sin(since * 6) * 1.5); bigCenter(g, L.winner, 118 + bob - Math.round((1 - wk) * 30), sc, '#ffe14d', cl(wk, 0, 1), '#ff8a1a'); }
    // logo
    const lg = o.logos[win].big; const lk = easeBack((p0 - 0.05) / 0.4);
    if (p0 > 0.05) { const sz = Math.round(84 * cl(lk, 0, 1.2)); g.drawImage(lg, Math.round(180 - sz / 2), Math.round(cy - sz / 2), sz, sz); }
    const fade = (t0) => cl((p0 - t0) / 0.25, 0, 1);
    if (p0 > 0.3) {
      const sc = F.fitScale(names[win], 300, 3, true);
      F.draw(g, names[win], 180, 256, { scale: sc, bold: true, color: '#ffffff', align: 'center', alpha: fade(0.3) });
      g.globalAlpha = fade(0.3); g.fillStyle = tcL[win]; const tw = F.measure(names[win], true) * sc; g.fillRect(Math.round(180 - tw / 2), 256 + 7 * sc + 3, tw, 2); g.globalAlpha = 1;
    }
    if (p0 > 0.5) { const n = w.teams[win].alive; F.draw(g, L.surv(n), 180, 292, { scale: 2, bold: true, color: tcL[win], align: 'center', alpha: fade(0.5) }); }
    const obsS = w.observer && w.observer.state, clutch = o.story && obsS && obsS.clutch && root.FWDirector;
    if (clutch && p0 > 0.6) F.draw(g, (root.FWDirector.ALERT_TXT[o.lang] || root.FWDirector.ALERT_TXT.en).CLUTCH, 180, 308, { bold: true, color: '#ffe14d', align: 'center', alpha: fade(0.6) });
    if (p0 > 0.65) F.draw(g, 'VS ' + names[lose] + ' • 0' + (w.fb ? '  |  ' + L.goals + ' ' + w.fb.goals[win] + '-' + w.fb.goals[lose] : ''), 180, clutch ? 322 : 318, { color: '#9aa4c4', align: 'center', alpha: fade(0.65) });
    if (p0 > 0.8) {
      F.draw(g, 'FOOTBALL WARS • ' + L.battle + ' #' + w.seed, 180, 338, { color: '#ffffff', align: 'center', alpha: fade(0.8) });
      F.draw(g, L.time + ' ' + mmss(w.endT - E.TL.battleStart) + ' • ' + (o.fictional ? L.fictional : o.modeLabel), 180, 352, { color: '#c9d1ff', align: 'center', alpha: fade(0.8) });
    }
  }

  // ---------- V4: the real match ball (separate from battle projectiles) ----------
  const ballSpr = (() => { const c = mk(9, 9), q = c.getContext('2d');
    q.fillStyle = '#ffd23f'; q.fillRect(2, 0, 5, 9); q.fillRect(0, 2, 9, 5); q.fillRect(1, 1, 7, 7);               // gold rim
    q.fillStyle = '#0b0d16'; q.fillRect(2, 1, 5, 7); q.fillRect(1, 2, 7, 5);
    q.fillStyle = '#ffffff'; q.fillRect(2, 2, 5, 5); q.fillRect(3, 1, 3, 1); q.fillRect(3, 7, 3, 1); q.fillRect(1, 3, 1, 3); q.fillRect(7, 3, 1, 3);
    q.fillStyle = '#20232e'; q.fillRect(4, 3, 1, 2); q.fillRect(3, 4, 3, 1); q.fillRect(2, 2, 1, 1); q.fillRect(6, 6, 1, 1); q.fillRect(6, 2, 1, 1); q.fillRect(2, 6, 1, 1);
    return c; })();
  const goalEvs = []; let goalScan = 0;
  function goalsSoFar() { for (; goalScan < w.events.length; goalScan++) if (w.events[goalScan].type === E.EV.GOAL) goalEvs.push(w.events[goalScan]); return goalEvs; }
  function drawMatchBall(g) {
    const b = w.fb.ball; if (b.state === 'DEAD') return;
    const moving = Math.abs(b.vx) + Math.abs(b.vy) > 5;
    let z = 0;
    if (b.state === 'CONTROLLED') { const o = w.units[b.owner]; z = o && (Math.abs(o.mvx) + Math.abs(o.mvy) > 4) ? Math.abs(Math.sin(w.tick * 0.35)) * 1.5 : 0; }
    else if (b.state === 'PASSING') z = 1 + Math.sin(Math.min(1, b.flight / 0.6) * Math.PI) * 3;
    const x = Math.round(b.x), y = Math.round(b.y);
    if (b.state === 'SHOOTING' || (b.state === 'PASSING' && moving)) { // short motion trail
      const sp = Math.hypot(b.vx, b.vy) || 1; for (let k = 1; k <= 3; k++) { g.globalAlpha = 0.45 - k * 0.12; g.fillStyle = b.state === 'SHOOTING' ? '#ffd23f' : '#ffffff'; g.fillRect(Math.round(b.x - b.vx / sp * k * 4) - 1, Math.round(b.y - z - b.vy / sp * k * 4) - 1, 3, 3); }
      g.globalAlpha = 1;
    }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - 3, y + 2, 7, 2);
    g.drawImage(ballSpr, x - 4, Math.round(y - 4 - z));
    if (b.state === 'CONTROLLED') { const o = w.units[b.owner]; if (o) { const ox = Math.round(o.x), oy = Math.round(o.y) - 30; g.fillStyle = '#0b0d16'; g.fillRect(ox - 3, oy - 1, 7, 4); g.fillStyle = tcL[o.side]; g.fillRect(ox - 2, oy, 5, 1); g.fillRect(ox - 1, oy + 1, 3, 1); g.fillRect(ox, oy + 2, 1, 1); } }
    // net ripple right after a real goal
    const ge = goalsSoFar(); const last = ge[ge.length - 1];
    if (last && w.t - last.t < 0.9) {
      const top = last.b === 0, GL = E.GOAL, gy = top ? GL.yTop - GL.depth - 1 : GL.yBot + 1, k = (w.t - last.t) / 0.9;
      g.fillStyle = '#ffffff'; g.globalAlpha = 1 - k;
      for (let xx = GL.x0 + 1; xx < GL.x1; xx += 3) { const off = Math.round(Math.sin(xx * 0.5 + w.t * 30) * 2 * (1 - k)); g.fillRect(xx, gy + off + (top ? 1 : 2), 1, GL.depth - 2); }
      g.globalAlpha = 1;
    }
  }
  // GOOOAL! overlay (output time, ~1.1 s, never hides the whole battle) + logo lower-third
  function drawGoal(g, T, outT) {
    if (!w.fb || T < E.TL.battleStart) return false;
    const toOut = o.toOut || (x => x); const ge = goalsSoFar(); let cur = null, age = 0;
    for (const e of ge) { const ag = outT - toOut(e.t); if (ag >= 0 && ag < 1.1) { cur = e; age = ag; } }
    if (!cur || (w.phase === 'ended' && T > w.endT + 0.3)) return false;
    const s = cur.b, col = tcL[s], a = cl(Math.min(age / 0.08, (1.1 - age) / 0.25), 0, 1), pop = Math.round((1 - ease(age / 0.15)) * 2);
    const sc = F.fitScale(L.goal, 330, 5, true) + pop;
    F.draw(g, L.goal, 180, 190 - pop * 3, { scale: Math.min(6, sc), bold: true, color: '#ffffff', color2: col, align: 'center', alpha: a });
    const line = F.upper(shorts[s]) + ' ' + L.scores + ' • ' + w.fb.goals[0] + '-' + w.fb.goals[1];
    const tw = F.measure(line, true), bw = tw + 44, x0 = Math.round(180 - bw / 2), y0 = 448;
    g.globalAlpha = a * 0.88; g.fillStyle = '#080a14'; g.fillRect(x0, y0, bw, 22); g.globalAlpha = a; g.fillStyle = col; g.fillRect(x0, y0, bw, 2); g.fillRect(x0, y0 + 20, bw, 2);
    g.drawImage(o.logos[s].small, x0 + 4, y0 - 2); g.globalAlpha = 1;
    F.draw(g, line, x0 + 36, y0 + 8, { bold: true, color: '#ffffff', alpha: a });
    return true;
  }
  // ---------- V2: Battle Story alerts (real events from the observer), shown in OUTPUT time ----------
  const D = root.FWDirector;
  function drawAlerts(g, T, outT) {
    const obs = w.observer && w.observer.state; if (!o.story || !obs || !obs.alerts.length || !D) return;
    if (T < E.TL.battleStart || (w.phase === 'ended' && T > w.endT + 0.3)) return;
    const toOut = o.toOut || (x => x), dur = D.ALERT_CFG.showSec;
    let cur = null, age = 0;
    for (const a of obs.alerts) { const ag = outT - toOut(a.t); if (ag >= 0 && ag < dur) { cur = a; age = ag; } }
    if (!cur) return;
    const TX = D.ALERT_TXT[o.lang] || D.ALERT_TXT.en;
    const txt = TX[cur.type] || cur.type;
    const col = cur.side >= 0 ? tcL[cur.side] : '#ffe14d';
    const sub = cur.side >= 0 ? F.upper(shorts[cur.side]) : '';
    const sc = F.fitScale(txt, 300, 2, true);
    const tw = F.measure(txt, true) * sc, sw2 = sub ? F.measure(sub) : 0;
    const bw = Math.max(tw, sw2) + 18, bh = sub ? 7 * sc + 17 : 7 * sc + 9;
    const slide = Math.round((1 - ease(age / 0.12)) * -40), a = cl(Math.min(age / 0.08, (dur - age) / 0.2), 0, 1);
    const x0 = Math.round(180 - bw / 2) + slide, y0 = V3 && v3.momentum ? 106 : 100;
    g.globalAlpha = a * 0.88; g.fillStyle = '#080a14'; g.fillRect(x0, y0, bw, bh);
    g.globalAlpha = a; g.fillStyle = col; g.fillRect(x0, y0, 3, bh); g.fillRect(x0 + bw - 3, y0, 3, bh); g.fillRect(x0, y0, bw, 1); g.fillRect(x0, y0 + bh - 1, bw, 1);
    g.globalAlpha = 1;
    F.draw(g, txt, 180 + slide, y0 + 4, { scale: sc, bold: true, color: '#ffffff', color2: cur.side >= 0 ? C.bright(col, 0.2) : '#ffe14d', align: 'center', alpha: a });
    if (sub) F.draw(g, sub, 180 + slide, y0 + 7 * sc + 7, { color: col, align: 'center', alpha: a });
  }

  function render(out, T, OW, OH, outT) {
    if (outT == null) outT = T;
    curOut = outT;
    // world layer
    drawWorld(T);
    // HUD/overlay layer
    const g = hg; g.clearRect(0, 0, LW, LH);
    const hudA = T < 1.05 ? 0 : T < 1.45 ? (T - 1.05) / 0.4 : (w.phase === 'ended' ? cl(1 - (T - w.endT - 0.45) / 0.4, 0.35, 1) : 1);
    brand(g, T < 0.35 ? ease(T / 0.35) : 1);
    hudPanel(g, hudA);
    if (V3 && v3.momentum) V3.drawMomentum(g, hudA, obsS());
    if (T < E.TL.battleStart + 0.1) drawIntro(g, T);
    drawBanners(g, T);
    if (!drawGoal(g, T, outT)) drawAlerts(g, T, outT); // never two big messages at once
    if (w.phase === 'ended') drawOutro(g, T);
    if (V3 && v3.mvp && w.phase === 'ended') V3.drawMvp(g, T, o.teams.map(t => S.shortName(t, 110, o.lang)));
    // compose (only the world layer follows the camera; the HUD never moves)
    out.imageSmoothingEnabled = false;
    let z = w.cam.z, cx = w.cam.x, cy = w.cam.y;
    if (T < 0.35) { z = 1.7 - 0.7 * ease(T / 0.35); cx = 180; cy = E.MIDY; }
    let ox = 0, oy = 0;
    if (w.shake > 0) { ox = Math.round(Math.sin(w.tick * 1.7) * w.shake * 1.2); oy = Math.round(Math.cos(w.tick * 2.3) * w.shake); }
    // never sample outside the 360x640 scene: a shake gets a matching tiny zoom margin
    z = Math.max(1, z, LW / (LW - 2 * Math.abs(ox) - 0.001), LH / (LH - 2 * Math.abs(oy) - 0.001));
    const sw = LW / z, sh = LH / z;
    const sx = cl(cl(cx - sw / 2, Math.abs(ox), LW - sw - Math.abs(ox)) + ox, 0, LW - sw);
    const sy = cl(cl(cy - sh / 2, Math.abs(oy), LH - sh - Math.abs(oy)) + oy, 0, LH - sh);
    out.fillStyle = '#0d1322'; out.fillRect(0, 0, OW, OH);
    out.drawImage(worldCv, sx, sy, sw, sh, 0, 0, OW, OH);
    out.drawImage(hudCv, 0, 0, LW, LH, 0, 0, OW, OH);
    lastView = { sx, sy, sw, sh, z };
  }
  let lastView = null;
  return { render, worldCv, hudCv, view: () => lastView, dispose() { worldCv.width = hudCv.width = 1; fields.forEach(f => f.width = 1); } };
}
root.FWRender = { createRenderer, TXT, LW, LH, mmss, buildField };
})(typeof window !== 'undefined' ? window : globalThis);
