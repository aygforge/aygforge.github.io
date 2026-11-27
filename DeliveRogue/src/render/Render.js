// render/Render.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { Art } from '../core/Art.js';
import { Input } from '../core/InputManager.js';
import { Save } from '../core/SaveManager.js';
import { T } from '../core/i18n.js';
import { G, View } from '../core/state.js';
import { TAU, TILE, VIEW_W, clamp, fmtTime, lerp } from '../core/util.js';
import { CHAPTERS } from '../data/chapters.js';
import { MapBuilder } from '../systems/MapBuilder.js';
import { Nav } from '../systems/Nav.js';

/* =========================== Render ===========================
   Canvas renderer. World uses camera transform (world coords),
   HUD is drawn in screen space on top. Art comes only from Art.*.
   ============================================================== */
export const Render = (() => {
  let cv, ctx, menuWorld = null;
  function init(canvas) { cv = canvas; ctx = cv.getContext('2d', { alpha: false }); }
  function font(px, w = 800) { return `${w} ${px}px ui-rounded,"SF Pro Rounded","Segoe UI",Roboto,Arial,sans-serif`; }
  function txt(s, x, y, size, color, align = 'center', stroke = 'rgba(20,10,5,.85)', lw = 3) {
    ctx.font = font(size); ctx.textAlign = align; ctx.textBaseline = 'middle';
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function base() { const S = View.scale * View.dpr; ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = true; }

  /* -------------------- world -------------------- */
  function drawMap(w, camY) {
    const ch = MapBuilder.CH_ROWS * TILE, k0 = Math.max(0, Math.floor(camY / ch)), k1 = Math.floor((camY + View.h) / ch);
    for (let k = k0; k <= k1; k++) { if (k * MapBuilder.CH_ROWS >= w.rows) break; const c = MapBuilder.chunk(w, k); ctx.drawImage(c, 0, k * ch, VIEW_W, c.height / Art.R); }
  }
  function steamPh(h, s) { const t = h.t; if (t < s.idle) return ['idle', t / s.idle]; if (t < s.idle + s.warn) return ['warn', (t - s.idle) / s.warn]; if (t < s.idle + s.warn + s.active) return ['active', (t - s.idle - s.warn) / s.active]; return ['cool', 0]; }
  function drawHazardsUnder(t) {
    const s = G.run.ch.steam, live = G.run.picked;
    for (const j of G.jets) {
      const [ph, k] = live ? steamPh(j, s) : ['idle', 0];
      if (ph === 'warn') {
        const a = 0.35 + 0.35 * Math.sin(t * 30);
        ctx.fillStyle = `rgba(229,83,61,${0.12 + k * 0.18})`; ctx.fillRect(j.x0, j.y - 10, j.x1 - j.x0, 20);
        ctx.strokeStyle = `rgba(255,90,60,${a + 0.3})`; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 30 * j.dir;
        ctx.strokeRect(j.x0 + 1, j.y - 10, j.x1 - j.x0 - 2, 20); ctx.setLineDash([]);
        txt('!', (j.x0 + j.x1) / 2, j.y, 13, '#ffd166');
      }
    }
    for (const g of G.grates) {
      const [ph, k] = live ? steamPh(g, s) : ['idle', 0];
      if (ph === 'warn') {
        ctx.fillStyle = `rgba(229,83,61,${0.12 + k * 0.2})`; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(255,90,60,${0.5 + 0.4 * Math.sin(t * 30)})`; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    for (const z of G.zones) {
      if (z.t < z.warn) {
        const k = z.t / z.warn;
        ctx.fillStyle = `rgba(255,120,40,${0.12 + k * 0.25})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * k, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(255,90,40,${0.6 + 0.4 * Math.sin(t * 28)})`; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.stroke();
        txt('!', z.x, z.y, 12, '#ffd166');
      }
    }
    for (const pd of G.puddles) {
      const a = Math.min(1, pd.t / 0.6) * 0.85;
      ctx.fillStyle = `rgba(243,225,196,${a * 0.75})`; ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a * 0.6})`; ctx.beginPath(); ctx.ellipse(pd.x - 5, pd.y - 3, pd.r * 0.35, pd.r * 0.18, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(160,102,58,${a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.7, 0, 0, TAU); ctx.stroke();
    }
    for (const l of G.lobs) { ctx.strokeStyle = 'rgba(255,240,210,.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(l.tx, l.ty, 16, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  }
  /** Steam plumes are depth-sorted with entities so courier/enemies in front of a plume are not "inside" it. */
  function steamItems(list, t) {
    const s = G.run.ch.steam; if (!G.run.picked) return;
    for (const j of G.jets) {
      const [ph, k] = steamPh(j, s); if (ph !== 'active' && ph !== 'cool') continue;
      list.push({ y: j.y + 8, draw: () => {
        const fade = ph === 'cool' ? 0.35 : Math.min(1, k * 5) * (1 - Math.max(0, k - 0.85) * 4), len = j.x1 - j.x0;
        for (let i = 0; i < 9; i++) {
          const u = ((i / 9) + t * 1.6 * (j.dir > 0 ? 1 : -1) % 1 + 1) % 1, x = j.x0 + u * len, wob = Math.sin(t * 9 + i * 1.7) * 3;
          ctx.fillStyle = `rgba(255,255,255,${0.42 * fade})`; ctx.beginPath(); ctx.ellipse(x, j.y + wob, 16, 9 + Math.sin(i + t * 6) * 2, 0, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = `rgba(255,255,255,${0.25 * fade})`; ctx.fillRect(j.x0, j.y - 8, len, 16);
      } });
    }
    for (const g of G.grates) {
      const [ph, k] = steamPh(g, s); if (ph !== 'active') continue;
      list.push({ y: g.y + 6, draw: () => {
        const fade = Math.min(1, k * 5) * (1 - Math.max(0, k - 0.85) * 4);
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 2, r = g.r * 0.55; ctx.fillStyle = `rgba(255,255,255,${0.38 * fade})`; ctx.beginPath(); ctx.arc(g.x + Math.cos(a) * r * 0.6, g.y - 6 + Math.sin(a) * r * 0.5 - (t * 20 + i * 5) % 14, r * 0.75, 0, TAU); ctx.fill(); }
      } });
    }
    for (const z of G.zones) {
      if (z.t < z.warn) continue; const k = (z.t - z.warn) / z.act, fade = 1 - k * 0.7;
      list.push({ y: z.y + 6, draw: () => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 3; ctx.fillStyle = `rgba(255,245,235,${0.45 * fade})`; ctx.beginPath(); ctx.arc(z.x + Math.cos(a) * 12, z.y - 8 + Math.sin(a) * 8 - k * 10, 14, 0, TAU); ctx.fill(); } } });
    }
  }
  function drawStations(t) {
    const w = G.world, run = G.run;
    // drop zone glow + label
    const d = w.drop, pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(95,211,180,${(run.picked ? 0.18 : 0.06) + pulse * 0.12})`; ctx.fillRect(d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0);
    txt('TESLİMAT', d.cx, d.cy - 1, 15, '#fff1dc', 'center', 'rgba(20,60,50,.9)', 4);
    // pickup
    const pk = w.pickup;
    if (!run.picked) { ctx.strokeStyle = `rgba(255,209,102,${0.5 + pulse * 0.5})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(pk.x, pk.y + 6, 24 + pulse * 4, 10 + pulse * 2, 0, 0, TAU); ctx.stroke(); }
  }
  function stationSprites(list) {
    const w = G.world, run = G.run;
    list.push({ y: w.pickup.y - 6, draw: () => Art.draw(ctx, Art.pickup(!run.picked), w.pickup.x, w.pickup.y - 6) });
    for (const h of w.heals) list.push({ y: h.y, draw: () => { Art.draw(ctx, Art.healSt(h.used), h.x, h.y + 6); if (!h.used) { ctx.strokeStyle = `rgba(95,211,180,${0.4 + 0.3 * Math.sin(G.t * 5)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(h.x, h.y + 7, 16, 6, 0, 0, TAU); ctx.stroke(); } } });
    const cp = w.checkpoint;
    if (cp) list.push({ y: cp.y - 30, draw: () => Art.draw(ctx, Art.checkSign(), cp.x + 64, cp.y - 8) });
    for (const c of G.carts) list.push({ y: c.y, draw: () => Art.draw(ctx, Art.cart(), c.x, c.y + 6) });
    const d = w.drop, cx = d.x1 - 16, cy = d.y0 + 16, happy = run.ended && run.success;
    list.push({ y: cy, draw: () => { Art.draw(ctx, Art.customer(Math.floor(G.t * (happy ? 8 : 2.5)) % 2, happy), cx, cy - (happy ? Math.abs(Math.sin(G.t * 9)) * 6 : 0)); if (happy && Math.floor(G.t * 3) % 2) txt('♥', cx + 9, cy - 34, 12, '#ff6b8a', 'center', null); } });
  }
  function drawCheckGate(t) {
    const cp = G.world.checkpoint; if (!cp || cp.used) return;
    ctx.strokeStyle = `rgba(95,211,180,${0.6 + 0.3 * Math.sin(t * 5)})`; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 20;
    ctx.beginPath(); ctx.moveTo(2 * TILE, cp.y); ctx.lineTo(13 * TILE, cp.y); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawTelegraphs(t) {
    const p = G.player;
    for (const e of G.enemies) {
      if (e.dead) continue;
      if ((e.ai === 'bruiser' || e.ai === 'knight') && e.state === 'windup') {
        const k = 1 - e.t / e.d.windup, r = e.ai === 'knight' ? 28 : 24;
        ctx.fillStyle = `rgba(229,83,61,${0.15 + k * 0.3})`; ctx.beginPath(); ctx.arc(e.lx, e.ly, r * (0.4 + k * 0.6), 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,80,50,.85)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(e.lx, e.ly, r, 0, TAU); ctx.stroke();
      } else if (e.ai === 'jugger' && e.state === 'slam') {
        const k = 1 - e.t / 0.8; ctx.fillStyle = `rgba(255,140,40,${0.12 + k * 0.3})`; ctx.beginPath(); ctx.arc(e.lx, e.ly, 40 * (0.3 + 0.7 * k), 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,120,40,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.lx, e.ly, 40, 0, TAU); ctx.stroke();
      } else if (e.ai === 'knight' && e.state === 'aim') {
        const a = 0.35 + 0.35 * Math.sin(t * 35), L = e.lane || 200;
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(e.ly, e.lx));
        ctx.fillStyle = `rgba(229,83,61,${a})`; ctx.fillRect(0, -12, L, 24);
        ctx.strokeStyle = 'rgba(255,90,60,.95)'; ctx.lineWidth = 2; ctx.strokeRect(0, -12, L, 24);
        ctx.fillStyle = 'rgba(255,220,160,.9)'; for (let x = 20; x < L - 10; x += 26) { ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x + 9, 0); ctx.lineTo(x, 6); ctx.fill(); }
        ctx.restore();
      } else if (e.ai === 'runner' && e.state === 'windup') {
        ctx.strokeStyle = 'rgba(255,90,60,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y - 6); ctx.lineTo(e.x + e.lx * 30, e.y - 6 + e.ly * 30); ctx.stroke();
      } else if (e.ai === 'mimic' && (e.state === 'alert' || e.state === 'leap')) {
        const tx = e.state === 'alert' ? p.x : e.lx, ty = e.state === 'alert' ? p.y : e.ly;
        ctx.strokeStyle = 'rgba(255,90,60,.9)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(tx, ty, 18, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(229,83,61,.18)'; ctx.beginPath(); ctx.arc(tx, ty, 18, 0, TAU); ctx.fill();
      }
    }
  }
  function enemyVariant(e) {
    const s = e.state;
    if (e.ai === 'mimic') return s === 'dormant' ? 'x' : (s === 'alert' || s === 'windup') ? 'w' : 'n';
    if (e.ai === 'bruiser') return s === 'windup' ? 'w' : s === 'recover' ? 'x' : 'n';
    if (e.ai === 'knight') return (s === 'aim' || s === 'windup') ? 'w' : s === 'charge' ? 'c' : 'n';
    if (e.ai === 'jugger') return (s === 'windup' || s === 'slam') ? 'w' : 'n';
    if (e.ai === 'caster' || e.ai === 'imp' || e.ai === 'runner') return (s === 'windup' || s === 'charge3') ? 'w' : 'n';
    return 'n';
  }
  function drawEnemy(e, t) {
    const moving = e.active && ['chase', 'return', 'strike'].includes(e.state) || e.state === 'return';
    let f = (moving || e.ai === 'swarm' || e.ai === 'tank') ? Math.floor(e.anim) % 4 : 0;
    if (e.ai === 'mimic' && e.state === 'dormant') f = (Math.floor(G.t * 0.7 + e.idx) % 5 === 0) ? 1 : 0;
    const v = enemyVariant(e), spr = Art.enemy(e.sh, f, v);
    let x = e.x, y = e.y;
    if (e.state === 'alert' || (e.state === 'windup' && e.ai !== 'caster')) x += Math.sin(t * 60) * 1.2;
    if (e.state === 'stunned') x += Math.sin(t * 40) * 0.8;
    if (e.jz > 0) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, 8, 3, 0, 0, TAU); ctx.fill(); }
    if (e.dead) { const k = Math.max(0, e.deadT / 0.35); ctx.globalAlpha = k; Art.draw(ctx, spr, x, y + (1 - k) * 4, e.face < 0, true, 0.6 + k * 0.4); ctx.globalAlpha = 1; return; }
    if (e.slowT > 0) { ctx.fillStyle = 'rgba(160,220,255,.45)'; ctx.beginPath(); ctx.ellipse(x, y, e.half + 5, 4, 0, 0, TAU); ctx.fill(); }
    Art.draw(ctx, spr, x, y - e.jz, e.face < 0, e.flash > 0);
    if (e.slowT > 0) { ctx.fillStyle = 'rgba(170,225,255,.35)'; ctx.fillRect(x - e.half - 2, y - e.d.h * 0.8, (e.half + 2) * 2, e.d.h * 0.75); }
    if (e.burn && Math.sin(t * 20 + e.idx) > 0) { ctx.fillStyle = 'rgba(255,123,58,.5)'; ctx.beginPath(); ctx.arc(x, y - e.d.h * 0.5, 3, 0, TAU); ctx.fill(); }
    if (e.state === 'alert') txt('!', x, y - e.d.h - 6, 16, '#ff5a3c');
    if (e.state === 'stunned') for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3; txt('✦', x + Math.cos(a) * 12, y - e.d.h - 2 + Math.sin(a) * 4, 9, '#ffd166', 'center', null); }
    if (e.state === 'charge3') { ctx.strokeStyle = `rgba(255,150,60,${0.5 + 0.4 * Math.sin(t * 30)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 7 * (e.face < 0 ? -1 : 1), y - e.d.h + 2, 8, 0, TAU); ctx.stroke(); }
    // health bar
    if (e.d.elite || (e.hp < e.maxHp && e.state !== 'dormant')) {
      const bw = e.d.elite ? 40 : 20, bx = x - bw / 2, by = y - e.d.h - (e.d.elite ? 12 : 6);
      ctx.fillStyle = 'rgba(20,10,5,.8)'; ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
      ctx.fillStyle = e.d.elite ? '#ffb347' : '#e5533d'; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 3);
      if (e.d.elite) txt(T('elite'), x, by - 6, 8, '#ffd166');
    }
  }
  function drawPlayer(t) {
    const p = G.player, run = G.run;
    const dir = p.dir === 3 ? 2 : p.dir, flip = p.dir === 3;
    const f = p.moving ? [1, 0, 3, 0][Math.floor(p.walkT) % 4] : 0;
    const pct = p.pkgHp / p.pkgMax, dmg = !run.picked ? 0 : pct < 0.34 ? 2 : pct < 0.67 ? 1 : 0;
    const skin = Save.data.cosmetics.selected;
    const spr = Art.courier(skin, dir, f, run.picked, dmg, p.shootT > 0);
    let y = p.y, rot = 0, alpha = 1;
    if (run.state === 'ending' || run.state === 'done') {
      if (run.success) y -= Math.abs(Math.sin(G.t * 9)) * 8; else { rot = Math.min(1.3, (1.5 - run.endT) * 2); alpha = Math.max(0.35, run.endT / 1.5); }
    }
    if (p.inv > 0 && Math.floor(t * 18) % 2 === 0) alpha *= 0.45;
    if (p.slowed) { ctx.fillStyle = 'rgba(243,225,196,.6)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 14, 4, 0, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = alpha;
    if (rot) { ctx.save(); ctx.translate(p.x, y - 14); ctx.rotate(rot); Art.draw(ctx, spr, 0, 14, flip, p.flash > 0); ctx.restore(); }
    else Art.draw(ctx, spr, p.x, y, flip, p.flash > 0);
    ctx.globalAlpha = 1;
    if (p.shield) { ctx.strokeStyle = `rgba(159,216,255,${0.55 + 0.25 * Math.sin(t * 6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y - 16, 22, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(159,216,255,.12)'; ctx.fill(); }
    if (p.pkgFlash > 0 && run.picked) { ctx.strokeStyle = `rgba(255,179,71,${p.pkgFlash * 2.5})`; ctx.lineWidth = 2.5; ctx.strokeRect(p.x - 13, p.y - 34, 26, 22); }
    if (p.shortcut && Math.floor(t * 10) % 2) { ctx.fillStyle = 'rgba(95,211,180,.5)'; ctx.fillRect(p.x - 12, p.y + 3, 24, 1.5); }
  }
  function drawArrow(t) {
    const p = G.player, run = G.run, w = G.world; if (run.state !== 'play') return;
    const tx = run.picked ? w.drop.cx : w.pickup.x, ty = run.picked ? w.drop.cy : w.pickup.y;
    const a = Math.atan2(ty - (p.y - 14), tx - p.x), r = 31 + Math.sin(t * 6) * 2;
    ctx.save(); ctx.translate(p.x + Math.cos(a) * r, p.y - 14 + Math.sin(a) * r); ctx.rotate(a);
    ctx.fillStyle = run.picked ? '#ffd166' : '#5fd3b4'; ctx.strokeStyle = 'rgba(20,10,5,.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -6); ctx.lineTo(-1, 0); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function drawProjectiles(t) {
    for (const b of G.proj) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a + t * 12);
      ctx.fillStyle = b.dmg >= G.player.dmg * 0.95 ? '#ffd166' : '#ffe9a8'; ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 0.8;
      ctx.fillRect(-4.5, -3, 9, 6); ctx.strokeRect(-4.5, -3, 9, 6); ctx.fillStyle = '#2a5f8a'; ctx.fillRect(-4.5, -1.6, 9, 1.4);
      ctx.restore();
      const m = G.run.mods.elem; if (m) { ctx.fillStyle = { electric: 'rgba(255,225,77,.5)', frozen: 'rgba(160,220,255,.5)', burn: 'rgba(255,123,58,.5)', toxic: 'rgba(125,220,74,.5)' }[m]; ctx.beginPath(); ctx.arc(b.x - b.vx * 0.015, b.y - b.vy * 0.015, 3.2, 0, TAU); ctx.fill(); }
    }
    for (const b of G.eproj) {
      ctx.fillStyle = b.big ? 'rgba(255,140,60,.35)' : 'rgba(255,120,60,.25)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5b2a0e'; ctx.strokeStyle = '#ff9a52'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,230,200,.8)'; ctx.beginPath(); ctx.arc(b.x - 1, b.y - 1, b.r * 0.35, 0, TAU); ctx.fill();
    }
    for (const l of G.lobs) { ctx.fillStyle = '#f3e1c4'; ctx.strokeStyle = '#a0663a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(l.x, l.y, 4.5, 0, TAU); ctx.fill(); ctx.stroke(); }
    for (const b of G.bolts) {
      ctx.strokeStyle = `rgba(255,240,120,${b.life / 0.18})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x1, b.y1);
      for (let i = 1; i < 5; i++) { const k = i / 5; ctx.lineTo(lerp(b.x1, b.x2, k) + (Math.random() - 0.5) * 8, lerp(b.y1, b.y2, k) + (Math.random() - 0.5) * 8); }
      ctx.lineTo(b.x2, b.y2); ctx.stroke();
    }
  }
  function drawParticles() {
    for (const q of G.parts) {
      const a = Math.max(0, q.life / q.max);
      if (q.kind === 'ring') { ctx.strokeStyle = q.color; ctx.globalAlpha = a; ctx.lineWidth = 2.5 * a + 0.5; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1.15 - a * 0.7), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; continue; }
      if (q.kind === 'steam') { ctx.fillStyle = q.color; ctx.globalAlpha = a * 0.8; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1.6 - a * 0.6), 0, TAU); ctx.fill(); ctx.globalAlpha = 1; continue; }
      ctx.globalAlpha = Math.min(1, a * 1.5); ctx.fillStyle = q.color;
      if (q.kind === 'sq') ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); else { ctx.beginPath(); ctx.arc(q.x, q.y, q.size / 2 + 0.3, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    for (const f of G.floats) {
      const a = Math.min(1, f.life / f.max * 2); ctx.globalAlpha = a;
      if (f.icon === 'pkg') { ctx.fillStyle = '#d9a36a'; ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1; ctx.fillRect(f.x - 15, f.y - 5, 9, 8); ctx.strokeRect(f.x - 15, f.y - 5, 9, 8); ctx.fillStyle = '#a8723c'; ctx.fillRect(f.x - 11, f.y - 5, 1, 8); }
      txt(f.text, f.x, f.y, f.size, f.color); ctx.globalAlpha = 1;
    }
  }
  function drawWorld() {
    const run = G.run, w = G.world, t = G.t, cam = G.cam;
    base(); ctx.fillStyle = '#1b120d'; ctx.fillRect(0, 0, View.w, View.h);
    const camY = cam.y;
    ctx.save(); ctx.translate(cam.ox, -camY + cam.oy);
    drawMap(w, camY);
    drawStations(t); drawCheckGate(t); drawHazardsUnder(t); drawTelegraphs(t);
    const list = []; stationSprites(list);
    const top = camY - 80, bot = camY + View.h + 80;
    for (const e of G.enemies) if (e.y > top && e.y < bot) list.push({ y: e.y, draw: () => drawEnemy(e, t) });
    list.push({ y: G.player.y, draw: () => drawPlayer(t) }); steamItems(list, t);
    list.sort((a, b) => a.y - b.y); for (const it of list) it.draw();
    drawProjectiles(t); drawParticles(); drawArrow(t);
    ctx.restore();
    drawJoystick(); drawHUD(t);
    if (run.state === 'ending') drawEndBanner(t);
    // low-HP vignette
    const p = G.player; if (p.hp / p.maxHp < 0.3 && run.state === 'play') { const g = ctx.createRadialGradient(View.w / 2, View.h / 2, View.h * 0.3, View.w / 2, View.h / 2, View.h * 0.75); g.addColorStop(0, 'rgba(229,83,61,0)'); g.addColorStop(1, `rgba(229,83,61,${0.22 + 0.1 * Math.sin(t * 6)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, View.w, View.h); }
  }
  /** Fixed joystick bottom-left: base ring + draggable knob (always visible while playing). */
  function drawJoystick() {
    const j = Input.joy, run = G.run; if (run.state !== 'play') return;
    const c = Input.center(), R = Input.R;
    let kx = c.x, ky = c.y;
    if (j.active) { const dx = j.kx - c.x, dy = j.ky - c.y, d = Math.hypot(dx, dy), k = d > R ? R / d : 1; kx = c.x + dx * k; ky = c.y + dy * k; }
    ctx.fillStyle = j.active ? 'rgba(27,18,13,.55)' : 'rgba(27,18,13,.38)'; ctx.beginPath(); ctx.arc(c.x, c.y, R + 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = j.active ? 'rgba(242,165,65,.85)' : 'rgba(255,241,220,.45)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,241,220,.45)';
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.save(); ctx.translate(c.x + Math.cos(a) * (R - 11), c.y + Math.sin(a) * (R - 11)); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -5); ctx.lineTo(-3, 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
    const g = ctx.createRadialGradient(kx - 5, ky - 6, 2, kx, ky, 22); g.addColorStop(0, '#ffd38a'); g.addColorStop(1, j.active ? '#e98a2f' : '#b5762f');
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(kx, ky + 3, 21, 0, TAU); ctx.fill();
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(kx, ky, 21, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,241,220,.9)'; ctx.lineWidth = 2; ctx.stroke();
    if (!j.active && (!run.picked || run.time < 5)) txt('SÜRÜKLE', c.x, c.y + R + 16, 9, 'rgba(255,241,220,.7)', 'center', null);
  }
  /* -------------------- HUD -------------------- */
  function bar(x, y, w, h, frac, c1, c2, label, flash) {
    rrect(x, y, w, h, h / 2); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill();
    if (frac > 0) { rrect(x + 1.5, y + 1.5, Math.max(h - 3, (w - 3) * frac), h - 3, (h - 3) / 2); const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fill(); }
    rrect(x, y, w, h, h / 2); ctx.strokeStyle = flash ? '#fff' : 'rgba(255,241,220,.35)'; ctx.lineWidth = flash ? 2 : 1; ctx.stroke();
    txt(label, x + w / 2, y + h / 2 + 0.5, 9.5, '#fff', 'center', 'rgba(0,0,0,.75)', 2.5);
  }
  function heart(x, y, s, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x, y - s * 0.1, x - s * 0.6, y - s * 0.1, x - s * 0.6, y + s * 0.25); ctx.bezierCurveTo(x - s * 0.6, y + s * 0.55, x, y + s * 0.75, x, y + s * 0.95); ctx.bezierCurveTo(x, y + s * 0.75, x + s * 0.6, y + s * 0.55, x + s * 0.6, y + s * 0.25); ctx.bezierCurveTo(x + s * 0.6, y - s * 0.1, x, y - s * 0.1, x, y + s * 0.35); ctx.fill(); }
  function drawHUD(t) {
    const run = G.run, p = G.player, ch = run.ch;
    rrect(6, 6, 302, 60, 14); ctx.fillStyle = 'rgba(27,18,13,.88)'; ctx.fill(); ctx.strokeStyle = '#5a3a26'; ctx.lineWidth = 2; ctx.stroke();
    // chapter badge
    ctx.fillStyle = '#f2a541'; ctx.beginPath(); ctx.arc(26, 24, 13, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff1dc'; ctx.lineWidth = 1.5; ctx.stroke();
    txt('B' + ch.n, 26, 24.5, 11, '#2a160b', 'center', null);
    ctx.font = font(9); let nm = ch.name; while (ctx.measureText(nm).width > 78 && nm.length > 3) nm = nm.slice(0, -2) + '…';
    txt(nm, 44, 18, 9, '#e9d3b4', 'left', null); txt(T('pkgShort_' + ch.pkg), 44, 30, 8.5, run.pkg.color, 'left', null);
    // timer
    const rem = ch.timer - run.time, frac = rem / ch.timer, urgent = run.picked && frac < 0.25;
    const tx = 182, sc = urgent ? 1 + 0.08 * Math.sin(t * 10) : 1;
    ctx.save(); ctx.translate(tx, 24); ctx.scale(sc, sc);
    if (!run.picked) { txt('⏱ ' + fmtTime(ch.timer), 0, -2, 16, '#b59a7c'); txt(T('timerWaits'), 0, 11, 7.5, '#5fd3b4', 'center', null); }
    else txt((urgent ? '! ' : '⏱ ') + fmtTime(Math.ceil(rem)), 0, 1, urgent ? 19 : 17, urgent ? '#ff6b5a' : (run.time <= ch.fast ? '#fff1dc' : '#ffd166'));
    ctx.restore();
    if (run.picked) { const fx = 182 - 30, fw = 60; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(fx, 34, fw, 2); ctx.fillStyle = run.time <= ch.fast ? '#ffd166' : '#6b5040'; ctx.fillRect(fx, 34, fw * clamp(1 - run.time / ch.fast, 0, 1), 2); }
    // bars
    heart(16, 41, 11, '#e5533d');
    bar(25, 40, 128, 15, p.hp / p.maxHp, '#ff8a73', '#c43d2a', `${T('hp')} ${Math.ceil(p.hp)}/${p.maxHp}`, p.flash > 0);
    Art.draw(ctx, Art.pkgIcon(ch.pkg, 16), 168, 47.5);
    if (run.picked) bar(177, 40, 124, 15, p.pkgHp / p.pkgMax, '#ffd38a', run.pkg.color, `${T('pkgHp')} ${Math.ceil(p.pkgHp)}/${p.pkgMax}`, p.pkgFlash > 0);
    else bar(177, 40, 124, 15, 0, '#888', '#666', T('waitOrder'), false);
    // skills row
    let sx = 10; const sy = 72; const counts = {};
    run.skills.forEach(id => counts[id] = (counts[id] || 0) + 1);
    Object.keys(counts).forEach(id => {
      ctx.globalAlpha = 0.95; Art.draw(ctx, Art.skillIcon(id), sx + 9, sy + 9, false, false, 18 / 48); ctx.globalAlpha = 1;
      if (counts[id] > 1) txt('x' + counts[id], sx + 16, sy + 16, 7.5, '#fff');
      sx += 21;
    });
    if (run.mods.shield) { ctx.strokeStyle = p.shield ? '#9fd8ff' : 'rgba(159,216,255,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx + 9, sy + 9, 7, 0, TAU); ctx.stroke(); if (!p.shield) { ctx.beginPath(); ctx.moveTo(sx + 9, sy + 9); ctx.arc(sx + 9, sy + 9, 7, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p.shieldCd / 8)); ctx.fillStyle = 'rgba(159,216,255,.35)'; ctx.fill(); } }
    // distance to target
    const w = G.world, fld = run.picked ? w.dropField : w.pickField, dd = Math.max(0, Nav.fieldAt(fld, p.x, p.y));
    txt((run.picked ? '▲ ' : '◆ ') + Math.round(dd * 2.4) + T('m'), View.w - 12, sy + 9, 11, run.picked ? '#ffd166' : '#5fd3b4', 'right');
    if (run.mods.lastMinute && run.picked && frac < 0.3) txt('LAST MINUTE!', View.w - 12, sy + 24, 8.5, '#5fd3b4', 'right');
  }
  function drawEndBanner(t) {
    const run = G.run, k = clamp((run.success ? 1.7 : 1.5) - run.endT, 0, 1), sc = 0.6 + Math.min(1, k * 3) * 0.4;
    ctx.fillStyle = `rgba(10,6,4,${k * 0.45})`; ctx.fillRect(0, 0, View.w, View.h);
    ctx.save(); ctx.translate(View.w / 2, View.h * 0.42); ctx.scale(sc, sc);
    if (run.success) { txt(T('delivered'), 0, 0, 30, '#ffd166', 'center', '#4a2a14', 6); }
    else { txt(T('failed'), 0, 0, 24, '#ff8a73', 'center', '#3a0f08', 6); txt(T('fail_' + run.reason), 0, 30, 13, '#fff1dc'); }
    ctx.restore();
  }

  /* -------------------- menu background -------------------- */
  function drawMenuBg(t) {
    base();
    if (!menuWorld) { try { menuWorld = MapBuilder.build(CHAPTERS[11]); } catch (e) { menuWorld = null; } }
    ctx.fillStyle = '#1b120d'; ctx.fillRect(0, 0, View.w, View.h);
    if (menuWorld) {
      const span = Math.max(1, menuWorld.h - View.h), y = span - ((t * 26) % span);
      ctx.save(); ctx.translate(0, -y); drawMap(menuWorld, y); ctx.restore();
      const spr = Art.courier(Save.data.cosmetics.selected, 1, [1, 0, 3, 0][Math.floor(t * 8) % 4], true, 0, false);
      Art.draw(ctx, spr, View.w / 2, View.h * 0.76, false, false, 2.0);
      if (Math.random() < 0.12) G.parts.push({ x: Math.random() * View.w, y: View.h + 10, vx: 0, vy: -30 - Math.random() * 40, life: 3, max: 3, size: 3 + Math.random() * 4, color: 'rgba(255,255,255,.16)', grav: 0, kind: 'steam', drag: 0.2 });
    }
    for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.life -= 1 / 60; q.y += q.vy / 60; if (q.life <= 0) G.parts.splice(i, 1); }
    const g = ctx.createLinearGradient(0, 0, 0, View.h); g.addColorStop(0, 'rgba(20,12,8,.78)'); g.addColorStop(0.45, 'rgba(20,12,8,.45)'); g.addColorStop(1, 'rgba(20,12,8,.88)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, View.w, View.h);
    drawParticles();
  }
  function frame(inGame) { if (inGame && G.run && G.world) drawWorld(); else drawMenuBg(G.t); }
  return { init, frame };
})();
