/* =========================================================================
   Renderer (art): procedural gladiators (arena + portrait from the same
   definition), crests, region symbols, icons, facility illustrations.
   ========================================================================= */

const Art = {
  SKIN: ['#f0cfae', '#e1b38c', '#c88e64', '#a66c45', '#7b4a2d', '#54321f'],
  HAIR: ['#1c1511', '#3a2517', '#6a4224', '#8b3c1c', '#c6a05a', '#a39f98'],
  PLUME: ['#b3261e', '#e3c15f', '#2d5f8e', '#ece6da', '#2b7a4f'],
  METAL: [
    { m: '#8f8a82', l: '#c9c4ba', d: '#57534d' },   // iron (default / common)
    { m: '#a3a7ab', l: '#e1e4e6', d: '#5f6367' },   // steel (quality)
    { m: '#8aa0b8', l: '#d4e1ee', d: '#4c5d70' },   // blued steel (masterwork)
    { m: '#9c8ab4', l: '#ddd2ea', d: '#5c4c70' },   // rare alloy
    { m: '#c9a43c', l: '#f6e39a', d: '#7d6218' }    // gilded (legendary)
  ],
  BRONZE: { m: '#b07a3a', l: '#e2b56f', d: '#6b4520' },
  shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
  },
  kitOf(g, colors) {
    const it = slot => { const i = S && g.eq ? S.items[g.eq[slot]] : null; return i || null; };
    const w = it('w'), a = it('a'), x = it('x');
    const club = S && g.club >= 0 ? S.clubs[g.club] : null;
    const cols = colors || (club ? [club.crest.c1, club.crest.c2] : ['#6b5a45', '#a8956f']);
    return {
      c1: cols[0], c2: cols[1],
      wq: w ? w.q : 0, wt: w ? w.t : null,
      aq: a ? a.q : -1, at: a ? a.t : null,
      xq: x ? x.q : 0, xt: x ? x.t : null
    };
  },

  // ------------------------------------------------------------ arena figure
  limb(ctx, x1, y1, x2, y2, w, col, out) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = out; ctx.lineWidth = w + 2.2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  },
  ik(hx, hy, fx, fy, L, face) {
    // two-bone IK, knee bends forward
    let dx = fx - hx, dy = fy - hy;
    let d = Math.sqrt(dx * dx + dy * dy);
    const max = L * 2 - 0.01;
    if (d > max) { fx = hx + dx / d * max; fy = hy + dy / d * max; dx = fx - hx; dy = fy - hy; d = max; }
    const a = Math.atan2(dy, dx);
    const b = Math.acos(clamp(d / (2 * L), -1, 1));
    const ang = a - b * face;
    return { kx: hx + Math.cos(ang) * L, ky: hy + Math.sin(ang) * L, fx, fy };
  },
  armPts(sx, sy, up, fore, L1, L2) {
    const ex = sx + Math.sin(up) * L1, ey = sy + Math.cos(up) * L1;
    const hx = ex + Math.sin(fore) * L2, hy = ey + Math.cos(fore) * L2;
    return { ex, ey, hx, hy };
  },
  // draws a figure with feet at (0,0), height ~100 units, facing +x. pose: see Battle.pose
  figure(ctx, look, cls, kit, P) {
    const skin = this.SKIN[look.sk] || this.SKIN[2];
    const skinD = this.shade(skin, -0.32), skinL = this.shade(skin, 0.15);
    const out = 'rgba(25,16,10,0.85)';
    const bw = look.bw || 1;
    const met = this.METAL[clamp(kit.wq, 0, 4)];
    const amet = this.METAL[clamp(kit.xq, 0, 4)];
    ctx.save();
    if (P.fall > 0) { ctx.rotate(-P.fall * 1.45); ctx.translate(-P.fall * 8, 0); }
    const crouch = P.crouch || 0;
    const hipX = P.hipX || 0, hipY = -47 + crouch * 9 + (P.bob || 0);
    const lean = P.lean || 0;
    const neckX = hipX + Math.sin(lean) * 29, neckY = hipY - Math.cos(lean) * 29;
    const headX = neckX + Math.sin(lean + (P.head || 0)) * 9, headY = neckY - Math.cos(lean + (P.head || 0)) * 9;
    const shF = { x: neckX + 2.5 * bw, y: neckY + 3 }, shB = { x: neckX - 3.5 * bw, y: neckY + 2.5 };
    const legW = 7.2 * bw, armW = 5.6 * bw;
    const legF = this.ik(hipX + 2, hipY, P.footF.x, P.footF.y, 24.5, 1);
    const legB = this.ik(hipX - 2, hipY, P.footB.x, P.footB.y, 24.5, 1);
    const aB = this.armPts(shB.x, shB.y, P.armB[0], P.armB[1], 15.5, 14.5);
    const aF = this.armPts(shF.x, shF.y, P.armF[0], P.armF[1], 15.5, 14.5);
    const dark = this.shade(skin, -0.18);

    // --- far arm + main weapon
    this.limb(ctx, shB.x, shB.y, aB.ex, aB.ey, armW, dark, out);
    this.limb(ctx, aB.ex, aB.ey, aB.hx, aB.hy, armW * 0.92, dark, out);
    if (cls === 'murmillo' || cls === 'secutor' || cls === 'thraex' || cls === 'hoplomachus') this.manica(ctx, aB, armW, amet);
    if (cls === 'dimachaerus') this.wraps(ctx, aB.ex, aB.ey, aB.hx, aB.hy, armW, '#b59a73');
    this.weapon(ctx, cls, aB.hx, aB.hy, P.wB, met, kit, false);

    // --- legs (far, then near)
    const legCol = this.shade(skin, -0.12);
    const drawLeg = (L, hx, near) => {
      this.limb(ctx, hx, hipY, L.kx, L.ky, legW, near ? skin : legCol, out);
      this.limb(ctx, L.kx, L.ky, L.fx, L.fy - 1.5, legW * 0.86, near ? skin : legCol, out);
      // greaves / wraps by class
      const greave = near ? (cls !== 'retiarius') : (cls === 'thraex' || cls === 'hoplomachus' || cls === 'dimachaerus');
      if (cls === 'thraex' || cls === 'hoplomachus') this.wraps(ctx, hx, hipY + 2, L.kx, L.ky, legW, '#d8cdb5');
      if (cls === 'retiarius' && near) this.wraps(ctx, L.kx, L.ky, L.fx, L.fy - 2, legW * 0.8, '#b59a73');
      if (greave) this.greave(ctx, L.kx, L.ky, L.fx, L.fy - 2, legW, cls === 'thraex' || cls === 'hoplomachus' ? amet : this.BRONZE);
      // sandal
      ctx.fillStyle = '#4a3020';
      ctx.beginPath(); ctx.ellipse(L.fx + 3, L.fy - 1, 5.5, 2.3, 0, 0, Math.PI * 2); ctx.fill();
    };
    drawLeg(legB, hipX - 2, false);
    drawLeg(legF, hipX + 2, true);

    // --- torso
    ctx.save();
    ctx.translate(hipX, hipY); ctx.rotate(lean);
    const tw = 11 * bw, ww = 8 * bw;
    const grad = ctx.createLinearGradient(-tw, 0, tw, 0);
    grad.addColorStop(0, skinD); grad.addColorStop(0.55, skin); grad.addColorStop(1, skinL);
    ctx.fillStyle = grad; ctx.strokeStyle = out; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-ww, 0); ctx.quadraticCurveTo(-tw - 1, -16, -tw + 1, -28);
    ctx.quadraticCurveTo(0, -31.5, tw - 1, -28); ctx.quadraticCurveTo(tw + 1, -16, ww, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // musculature
    ctx.strokeStyle = this.shade(skin, -0.3); ctx.lineWidth = 0.8; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(-1, -26); ctx.quadraticCurveTo(4, -19, tw - 2, -22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1, -16); ctx.lineTo(1, -4); ctx.moveTo(-2, -12); ctx.lineTo(5, -12); ctx.moveTo(-2, -7); ctx.lineTo(5, -7); ctx.stroke();
    ctx.globalAlpha = 1;
    // body armour (armour slot) or class garment
    this.bodyArmour(ctx, cls, kit, tw, ww);
    // belt + loincloth (subligaculum) in club colours
    ctx.fillStyle = kit.c1; ctx.strokeStyle = out; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-ww - 1.5, -1); ctx.lineTo(ww + 1.5, -1); ctx.lineTo(ww + 0.5, 9); ctx.lineTo(3, 12); ctx.lineTo(-ww - 0.5, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = cls === 'murmillo' || cls === 'secutor' ? this.BRONZE.m : kit.c2;
    ctx.fillRect(-ww - 2, -4.5, ww * 2 + 4, 5);
    ctx.strokeRect(-ww - 2, -4.5, ww * 2 + 4, 5);
    if (cls === 'murmillo' || cls === 'secutor') { ctx.fillStyle = this.BRONZE.l; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 5, -2, 1, 0, 7); ctx.fill(); } }
    ctx.restore();

    // --- head
    this.headSide(ctx, headX, headY, lean + (P.head || 0), look, cls, kit, amet);

    // --- near arm + off-hand gear
    const nearCol = skin;
    if (cls === 'retiarius') this.galerus(ctx, shF.x, shF.y, lean, amet);
    this.limb(ctx, shF.x, shF.y, aF.ex, aF.ey, armW, nearCol, out);
    this.limb(ctx, aF.ex, aF.ey, aF.hx, aF.hy, armW * 0.92, nearCol, out);
    if (cls === 'retiarius') this.manica(ctx, aF, armW, amet);
    if (cls === 'dimachaerus') this.wraps(ctx, aF.ex, aF.ey, aF.hx, aF.hy, armW, '#b59a73');
    this.offhand(ctx, cls, aF, P, kit, amet, met);
    ctx.restore();
    // hit flash overlay is done by caller via composite
  },
  wraps(ctx, x1, y1, x2, y2, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.1;
    const n = 4;
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1), x = lerp(x1, x2, t), y = lerp(y1, y2, t);
      const ang = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * w * 0.55, y - Math.sin(ang) * w * 0.55 - 0.8); ctx.lineTo(x + Math.cos(ang) * w * 0.55, y + Math.sin(ang) * w * 0.55 + 0.8); ctx.stroke();
    }
  },
  manica(ctx, a, w, M) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = M.d; ctx.lineWidth = w + 2.6;
    ctx.beginPath(); ctx.moveTo(a.ex, a.ey); ctx.lineTo(a.hx, a.hy); ctx.stroke();
    ctx.strokeStyle = M.m; ctx.lineWidth = w + 0.6;
    ctx.beginPath(); ctx.moveTo(a.ex, a.ey); ctx.lineTo(a.hx, a.hy); ctx.stroke();
    ctx.strokeStyle = M.l; ctx.lineWidth = 0.9;
    for (let i = 1; i < 4; i++) {
      const t = i / 4, x = lerp(a.ex, a.hx, t), y = lerp(a.ey, a.hy, t);
      const ang = Math.atan2(a.hy - a.ey, a.hx - a.ex) + Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * w * 0.6, y - Math.sin(ang) * w * 0.6); ctx.lineTo(x + Math.cos(ang) * w * 0.6, y + Math.sin(ang) * w * 0.6); ctx.stroke();
    }
  },
  greave(ctx, x1, y1, x2, y2, w, M) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = M.d; ctx.lineWidth = w + 1.8;
    ctx.beginPath(); ctx.moveTo(lerp(x1, x2, 0.1), lerp(y1, y2, 0.1)); ctx.lineTo(lerp(x1, x2, 0.85), lerp(y1, y2, 0.85)); ctx.stroke();
    ctx.strokeStyle = M.m; ctx.lineWidth = w * 0.95;
    ctx.beginPath(); ctx.moveTo(lerp(x1, x2, 0.1), lerp(y1, y2, 0.1)); ctx.lineTo(lerp(x1, x2, 0.85), lerp(y1, y2, 0.85)); ctx.stroke();
    ctx.strokeStyle = M.l; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lerp(x1, x2, 0.15) + 1.5, lerp(y1, y2, 0.15)); ctx.lineTo(lerp(x1, x2, 0.8) + 1.5, lerp(y1, y2, 0.8)); ctx.stroke();
  },
  galerus(ctx, x, y, lean, M) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
    ctx.fillStyle = M.m; ctx.strokeStyle = M.d; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(-2, -9); ctx.quadraticCurveTo(4, -12, 7, -7); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = M.l; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(1, 3); ctx.stroke();
    ctx.restore();
  },
  bodyArmour(ctx, cls, kit, tw, ww) {
    const at = kit.at;
    if (!at) {
      if (cls === 'dimachaerus') { // leather cross-strap
        ctx.strokeStyle = '#5a3b22'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(-tw + 2, -27); ctx.lineTo(ww, -3); ctx.stroke();
      }
      if (cls === 'hoplomachus') { // quilted tunic top
        ctx.fillStyle = 'rgba(225,214,190,0.9)';
        ctx.beginPath(); ctx.moveTo(-ww, 0); ctx.lineTo(-tw + 1, -14); ctx.lineTo(tw - 1, -14); ctx.lineTo(ww, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(120,100,70,0.6)'; ctx.lineWidth = 0.7;
        for (let i = -8; i <= 8; i += 3) { ctx.beginPath(); ctx.moveTo(i, -13); ctx.lineTo(i * 0.8, -1); ctx.stroke(); }
      }
      return;
    }
    const M = this.METAL[clamp(kit.aq, 0, 4)];
    if (at === 'leather') {
      ctx.fillStyle = '#6b4526'; ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-ww, -2); ctx.lineTo(-tw + 1, -22); ctx.lineTo(tw - 1, -22); ctx.lineTo(ww, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = kit.aq >= 2 ? M.l : '#8a6440'; ctx.beginPath(); ctx.moveTo(-ww, -12); ctx.lineTo(ww, -12); ctx.stroke();
    } else if (at === 'scale') {
      ctx.fillStyle = M.m; ctx.strokeStyle = M.d; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-ww, -2); ctx.lineTo(-tw + 0.5, -25); ctx.quadraticCurveTo(0, -28, tw - 0.5, -25); ctx.lineTo(ww, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = M.l; ctx.lineWidth = 0.6;
      for (let r = -24; r < -3; r += 3.2) for (let c = -tw + 3; c < tw - 2; c += 3.2) { ctx.beginPath(); ctx.arc(c + ((r | 0) % 2 ? 1.6 : 0), r, 1.5, 0, Math.PI); ctx.stroke(); }
    } else if (at === 'heavy') {
      const B = kit.aq >= 3 ? M : this.BRONZE;
      const g = ctx.createLinearGradient(-tw, 0, tw, 0); g.addColorStop(0, B.d); g.addColorStop(0.5, B.m); g.addColorStop(1, B.l);
      ctx.fillStyle = g; ctx.strokeStyle = B.d; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-ww - 0.5, -1); ctx.lineTo(-tw, -26); ctx.quadraticCurveTo(0, -30, tw, -26); ctx.lineTo(ww + 0.5, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = B.d; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-1, -26); ctx.quadraticCurveTo(4, -18, tw - 2, -21); ctx.moveTo(1, -15); ctx.lineTo(1, -3); ctx.stroke();
    } else if (at === 'galerus') {
      ctx.strokeStyle = M.m; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tw - 1, -27); ctx.lineTo(-ww + 1, -2); ctx.stroke();
    }
  },
  weapon(ctx, cls, x, y, ang, M, kit) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-ang + Math.PI);
    // local: blade along -y (up) from grip
    const gold = kit.wq >= 4;
    const blade = (len, wid, curve) => {
      const g = ctx.createLinearGradient(-wid, 0, wid, 0); g.addColorStop(0, M.d); g.addColorStop(0.5, M.l); g.addColorStop(1, M.m);
      ctx.fillStyle = g; ctx.strokeStyle = 'rgba(20,15,10,0.8)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-wid, -3);
      if (curve) { ctx.quadraticCurveTo(-wid - curve, -len * 0.6, curve * 1.6, -len); ctx.quadraticCurveTo(wid - curve * 0.6, -len * 0.55, wid, -3); }
      else { ctx.lineTo(-wid * 0.8, -len + 3); ctx.lineTo(0, -len); ctx.lineTo(wid * 0.8, -len + 3); ctx.lineTo(wid, -3); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = gold ? '#e7c55a' : '#6b4a2a'; ctx.fillRect(-1.2, -1, 2.4, 6);
      ctx.fillStyle = gold ? '#f3dc8a' : M.m; ctx.fillRect(-wid - 2, -4, wid * 2 + 4, 2.2);
    };
    const shaft = (len, headLen, tri) => {
      ctx.strokeStyle = '#5c3d22'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -len); ctx.stroke();
      ctx.strokeStyle = '#7e5733'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0.6, 13); ctx.lineTo(0.6, -len); ctx.stroke();
      ctx.fillStyle = M.l; ctx.strokeStyle = M.d; ctx.lineWidth = 0.9;
      if (tri) {
        ctx.beginPath();
        ctx.moveTo(-6, -len); ctx.lineTo(6, -len); ctx.lineTo(6, -len - 2); ctx.lineTo(-6, -len - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        for (const px of [-5.5, 0, 5.5]) { ctx.beginPath(); ctx.moveTo(px - 1.1, -len - 2); ctx.lineTo(px, -len - headLen); ctx.lineTo(px + 1.1, -len - 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      } else {
        ctx.beginPath(); ctx.moveTo(-2.6, -len); ctx.lineTo(0, -len - headLen); ctx.lineTo(2.6, -len); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    };
    switch (cls) {
      case 'murmillo': blade(kit.wt === 'spatha' ? 24 : 19, 2.4); break;
      case 'secutor': blade(kit.wt === 'spatha' ? 25 : 20, 2.4); break;
      case 'thraex': blade(21, 2.1, 5); break;
      case 'dimachaerus': blade(20, 2.0); break;
      case 'retiarius': shaft(46, 9, true); break;
      case 'hoplomachus': shaft(52, 10, false); break;
    }
    ctx.restore();
  },
  offhand(ctx, cls, a, P, kit, amet, met) {
    const x = a.hx, y = a.hy;
    const c1 = kit.c1, c2 = kit.c2;
    const rim = kit.xq >= 1 ? amet.m : this.BRONZE.m;
    if (cls === 'murmillo' || cls === 'secutor') {
      const h = cls === 'murmillo' ? 44 : 40, w = cls === 'murmillo' ? 19 : 16;
      ctx.save(); ctx.translate(x + 2, y - 6); ctx.rotate((P.shieldTilt || 0));
      ctx.fillStyle = this.shade(c1, -0.35);
      const shape = () => {
        ctx.beginPath();
        if (cls === 'murmillo') { ctx.moveTo(-w / 2, -h / 2); ctx.quadraticCurveTo(0, -h / 2 - 3, w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.quadraticCurveTo(0, h / 2 + 3, -w / 2, h / 2); ctx.closePath(); }
        else ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      };
      ctx.save(); ctx.translate(-2.5, 0); shape(); ctx.fill(); ctx.restore();
      const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, this.shade(c1, -0.2)); g.addColorStop(0.6, c1); g.addColorStop(1, this.shade(c1, 0.15));
      ctx.fillStyle = g; ctx.strokeStyle = rim; ctx.lineWidth = 2.2; shape(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = c2; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, -h / 2 + 4); ctx.lineTo(0, h / 2 - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w / 2 + 3, -h / 4); ctx.lineTo(w / 2 - 3, -h / 4); ctx.moveTo(-w / 2 + 3, h / 4); ctx.lineTo(w / 2 - 3, h / 4); ctx.stroke();
      ctx.fillStyle = rim; ctx.strokeStyle = this.BRONZE.d; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 3.6, 0, 7); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if (cls === 'thraex') {
      ctx.save(); ctx.translate(x + 2, y - 3); ctx.rotate(P.shieldTilt || 0);
      ctx.fillStyle = c1; ctx.strokeStyle = rim; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(-8, -9, 16, 18); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = c2; ctx.lineWidth = 1.2; ctx.strokeRect(-5, -6, 10, 12);
      ctx.restore();
    } else if (cls === 'hoplomachus') {
      ctx.save(); ctx.translate(x + 2, y - 3);
      const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 10); g.addColorStop(0, this.shade(c1, 0.25)); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.strokeStyle = rim; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = c2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, 7); ctx.stroke();
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(0, 0, 2, 0, 7); ctx.fill();
      ctx.restore();
    } else if (cls === 'dimachaerus') {
      this.weapon(ctx, cls, x, y, P.wF, met, kit);
    } else if (cls === 'retiarius') {
      if (!P.noNet) {
        ctx.save(); ctx.translate(x, y);
        ctx.strokeStyle = 'rgba(214,200,160,0.95)'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) { ctx.moveTo(-5 + i * 2.5, 0); ctx.quadraticCurveTo(-7 + i * 3.5, 9, -8 + i * 4, 17); }
        for (let j = 1; j <= 4; j++) { ctx.moveTo(-5 - j * 0.8, j * 4); ctx.lineTo(5 + j * 0.8, j * 4); }
        ctx.stroke();
        ctx.fillStyle = '#7a6a50'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-8 + i * 4, 17, 1, 0, 7); ctx.fill(); }
        ctx.restore();
      }
    }
  },
  helmCol(kit, amet) { return kit.xt === 'galea' ? amet : this.BRONZE; },
  headSide(ctx, x, y, rot, look, cls, kit, amet) {
    const skin = this.SKIN[look.sk] || this.SKIN[2];
    const hair = this.HAIR[look.hc] || this.HAIR[0];
    const out = 'rgba(25,16,10,0.85)';
    const H = this.helmCol(kit, amet);
    const plume = kit.c1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const jw = look.jw || 1;
    // neck
    ctx.fillStyle = this.shade(skin, -0.15); ctx.fillRect(-3, 4, 6, 6);
    // head shape
    ctx.fillStyle = skin; ctx.strokeStyle = out; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.ellipse(0.5, 0, 6.6, 7.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, 5); ctx.quadraticCurveTo(4 * jw, 9.5 * jw, 6.8, 3); ctx.lineTo(7.2, 0); ctx.closePath(); ctx.fill();
    // nose / face profile
    ctx.beginPath(); ctx.moveTo(6.4, -1.5); ctx.lineTo(8.6 + look.ns * 0.5, 1.6); ctx.lineTo(6.6, 2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a120c'; ctx.beginPath(); ctx.arc(4.3, -1.2, 0.95, 0, 7); ctx.fill();
    ctx.strokeStyle = this.shade(hair, -0.1); ctx.lineWidth = 1 + (look.br || 0) * 0.8; ctx.beginPath(); ctx.moveTo(2.8, -3.2); ctx.lineTo(6.2, -3.3); ctx.stroke();
    // ear
    ctx.fillStyle = this.shade(skin, -0.12); ctx.beginPath(); ctx.ellipse(-1.2, 0.5, 1.6, 2.4, 0, 0, 7); ctx.fill();
    // beard
    if (look.bd >= 2) {
      ctx.fillStyle = hair; ctx.globalAlpha = look.bd === 2 ? 0.75 : 0.95;
      ctx.beginPath(); ctx.moveTo(-1.5, 2.5); ctx.quadraticCurveTo(1, 9 + look.bd, 6.4, 5 + (look.bd === 3 ? 2 : 0)); ctx.lineTo(7, 3); ctx.lineTo(4, 3.8); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (look.bd === 1) { ctx.fillStyle = 'rgba(40,28,20,0.25)'; ctx.beginPath(); ctx.ellipse(3, 4.5, 4.5, 3, 0.2, 0, 7); ctx.fill(); }
    if (look.bd === 4 || look.bd === 5) { ctx.fillStyle = hair; ctx.fillRect(4.5, 3, 3, 1.2); if (look.bd === 5) ctx.fillRect(5, 5, 2, 2.5); }
    const helm = cls === 'murmillo' || cls === 'thraex' || cls === 'secutor' || cls === 'hoplomachus';
    if (!helm) {
      // hair (retiarius & dimachaerus fight bare-headed)
      this.hairSide(ctx, look, hair);
      if (cls === 'dimachaerus') { ctx.strokeStyle = kit.c1; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-6, -3.5); ctx.lineTo(6.6, -4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, -3.5); ctx.lineTo(-9, 1); ctx.stroke(); }
    } else this.helmSide(ctx, cls, H, plume, kit);
    ctx.restore();
  },
  hairSide(ctx, look, hair) {
    ctx.fillStyle = hair;
    switch (look.hs) {
      case 0: break;
      case 1: ctx.beginPath(); ctx.ellipse(0, -3.5, 6.8, 4.8, 0, Math.PI, 0); ctx.fill(); break;
      case 2: for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-5 + i * 2.2, -5.5 + Math.sin(i) * 0.8, 2.3, 0, 7); ctx.fill(); } break;
      case 3: ctx.beginPath(); ctx.ellipse(0, -3.5, 7, 5, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(-7, -1, 2.2, 2.2, 0, 0, 7); ctx.fill(); ctx.fillRect(-9, -1, 2.5, 6); break;
      case 4: ctx.fillRect(-4, -11, 8, 5); ctx.beginPath(); ctx.ellipse(0, -6, 4, 2, 0, 0, 7); ctx.fill(); break;
      case 5: ctx.beginPath(); ctx.ellipse(-0.5, -3, 7.3, 5.6, 0, Math.PI * 0.95, Math.PI * 0.05 + 2 * Math.PI); ctx.fill(); ctx.fillRect(-7.5, -3, 3.5, 7); break;
      case 6: ctx.beginPath(); ctx.ellipse(0, -5.5, 5, 2.6, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.arc(-2, -9, 2.4, 0, 7); ctx.fill(); break;
    }
  },
  helmSide(ctx, cls, H, plume, kit) {
    const out = 'rgba(25,16,10,0.85)';
    const g = ctx.createLinearGradient(-8, -10, 8, 6); g.addColorStop(0, H.l); g.addColorStop(0.5, H.m); g.addColorStop(1, H.d);
    ctx.fillStyle = g; ctx.strokeStyle = out; ctx.lineWidth = 1.1;
    if (cls === 'secutor') {
      // smooth egg helmet, small fin, eye holes
      ctx.beginPath(); ctx.moveTo(-7.5, 6); ctx.quadraticCurveTo(-9, -10, 0, -10.5); ctx.quadraticCurveTo(9.5, -9, 9.2, 1); ctx.quadraticCurveTo(9, 6.5, 4, 8); ctx.lineTo(-7.5, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = H.d; ctx.beginPath(); ctx.moveTo(-6, -9); ctx.quadraticCurveTo(1, -16, 6, -9.5); ctx.quadraticCurveTo(0, -11, -6, -9); ctx.fill();
      ctx.fillStyle = '#120c08'; ctx.beginPath(); ctx.arc(5.2, -1.4, 1.3, 0, 7); ctx.fill();
      ctx.strokeStyle = H.l; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(1, -2, 6, -2.4, -1.2); ctx.stroke();
      return;
    }
    // dome
    ctx.beginPath(); ctx.ellipse(0.3, -2, 7.4, 7.6, 0, Math.PI * 1.02, Math.PI * 2.02); ctx.lineTo(7.8, 2); ctx.lineTo(-7.2, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    // brim
    ctx.fillStyle = H.m; ctx.beginPath(); ctx.ellipse(0, 2.2, 10.5, 1.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // visor grille over the face
    ctx.strokeStyle = H.d; ctx.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(3 + i * 1.3, -4); ctx.lineTo(3.3 + i * 1.3, 4); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(2.6, -1.5); ctx.lineTo(8.2, -1.5); ctx.moveTo(2.6, 1.5); ctx.lineTo(8, 1.5); ctx.stroke();
    if (cls === 'murmillo') {
      ctx.fillStyle = plume; ctx.strokeStyle = out;
      ctx.beginPath(); ctx.moveTo(-7, -4); ctx.quadraticCurveTo(-4, -19, 6, -15); ctx.quadraticCurveTo(3, -11, 4, -7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = this.shade(plume, -0.3); ctx.lineWidth = 0.6;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-5 + i * 2, -6); ctx.lineTo(-4 + i * 2.2, -14 + i * 0.5); ctx.stroke(); }
    } else if (cls === 'thraex') {
      ctx.fillStyle = H.m; ctx.strokeStyle = out;
      ctx.beginPath(); ctx.moveTo(-5, -8); ctx.quadraticCurveTo(-2, -16, 6, -14); ctx.quadraticCurveTo(10, -12, 8, -9); ctx.quadraticCurveTo(5, -12, 1, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = plume; ctx.beginPath(); ctx.moveTo(-6, -7); ctx.quadraticCurveTo(-13, -12, -12, -4); ctx.quadraticCurveTo(-9, -6, -6, -5); ctx.fill();
    } else if (cls === 'hoplomachus') {
      ctx.fillStyle = plume; ctx.strokeStyle = out; ctx.lineWidth = 0.8;
      for (const dx of [-3, 2]) { ctx.beginPath(); ctx.moveTo(dx, -8); ctx.quadraticCurveTo(dx - 3, -20, dx + 1, -24); ctx.quadraticCurveTo(dx + 2, -16, dx + 1.2, -8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
  },

  // ------------------------------------------------------------ portrait (same look/kit definition, larger)
  portraitCache: new Map(),
  portraitKey(g, kit) { const L = g.look; return [g.id, g.cls, L.sk, L.hs, L.hc, L.bd, kit.c1, kit.c2, kit.aq, kit.xq, kit.at, kit.xt, g.age > 33 ? 1 : 0, g.temp ? 1 : 0].join('|'); },
  portraitURL(g, size = 96, colors) {
    const kit = this.kitOf(g, colors);
    const key = this.portraitKey(g, kit) + '|' + size;
    let url = this.portraitCache.get(key);
    if (url) return url;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    this.drawPortrait(ctx, g, size, kit);
    url = c.toDataURL('image/png');
    if (this.portraitCache.size > 500) this.portraitCache.delete(this.portraitCache.keys().next().value);
    this.portraitCache.set(key, url);
    return url;
  },
  drawPortrait(ctx, g, size, kit) {
    const look = g.look, cls = g.cls;
    const reg = REGION_BY_ID[g.reg] || REGIONS[0];
    const s = size / 100;
    ctx.save(); ctx.scale(s, s);
    // background
    const bg = ctx.createRadialGradient(50, 40, 10, 50, 50, 75);
    bg.addColorStop(0, this.shade(reg.pal.c, -0.05)); bg.addColorStop(1, this.shade(reg.pal.a, -0.35));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 100, 100);
    ctx.globalAlpha = 0.12; ctx.fillStyle = reg.pal.b;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(10 + i * 18, 100, 16, Math.PI, 0); ctx.fill(); }
    ctx.globalAlpha = 1;
    const skin = this.SKIN[look.sk] || this.SKIN[2], skinD = this.shade(skin, -0.3), skinL = this.shade(skin, 0.14);
    const hair = this.HAIR[look.hc] || this.HAIR[0];
    const out = 'rgba(28,18,12,0.9)';
    const bw = look.bw || 1, jw = look.jw || 1;
    const amet = this.METAL[clamp(kit.xq, 0, 4)];
    const H = this.helmCol(kit, amet);
    // shoulders & chest
    const sg = ctx.createLinearGradient(0, 70, 100, 70); sg.addColorStop(0, skinD); sg.addColorStop(0.5, skin); sg.addColorStop(1, skinL);
    ctx.fillStyle = sg; ctx.strokeStyle = out; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(50 - 44 * bw, 104); ctx.quadraticCurveTo(50 - 42 * bw, 74, 50 - 14, 70); ctx.lineTo(50 + 14, 70); ctx.quadraticCurveTo(50 + 42 * bw, 74, 50 + 44 * bw, 104); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = this.shade(skin, -0.35); ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(50, 84); ctx.quadraticCurveTo(38, 92, 26, 88); ctx.moveTo(50, 84); ctx.quadraticCurveTo(62, 92, 74, 88); ctx.stroke(); ctx.globalAlpha = 1;
    // class shoulder gear / armour
    if (kit.at === 'heavy' || kit.at === 'scale') {
      const M = kit.at === 'heavy' && kit.aq < 3 ? this.BRONZE : this.METAL[clamp(kit.aq, 0, 4)];
      ctx.fillStyle = M.m; ctx.strokeStyle = M.d; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(22, 104); ctx.quadraticCurveTo(26, 82, 38, 78); ctx.lineTo(62, 78); ctx.quadraticCurveTo(74, 82, 78, 104); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (kit.at === 'scale') { ctx.strokeStyle = M.l; ctx.lineWidth = 0.8; for (let r = 82; r < 104; r += 4) for (let c = 28; c < 74; c += 4) { ctx.beginPath(); ctx.arc(c + (r % 8 ? 2 : 0), r, 2, 0, Math.PI); ctx.stroke(); } }
    } else if (kit.at === 'leather') {
      ctx.fillStyle = '#6b4526'; ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(26, 104); ctx.lineTo(34, 80); ctx.lineTo(66, 80); ctx.lineTo(74, 104); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (cls === 'retiarius') {
      ctx.fillStyle = amet.m; ctx.strokeStyle = amet.d; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(62, 104); ctx.lineTo(66, 70); ctx.quadraticCurveTo(80, 60, 90, 70); ctx.lineTo(94, 104); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = amet.l; ctx.beginPath(); ctx.moveTo(72, 70); ctx.lineTo(74, 100); ctx.stroke();
    }
    if (cls === 'dimachaerus' && !kit.at) { ctx.strokeStyle = '#5a3b22'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(24, 82); ctx.lineTo(66, 104); ctx.stroke(); }
    if (cls === 'murmillo' || cls === 'secutor' || cls === 'thraex' || cls === 'hoplomachus') {
      // manica on the sword arm (viewer's left)
      ctx.fillStyle = amet.m; ctx.strokeStyle = amet.d; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(4, 104); ctx.quadraticCurveTo(6, 82, 20, 76); ctx.lineTo(28, 84); ctx.quadraticCurveTo(18, 92, 18, 104); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = amet.l; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(7 + i * 1.5, 100 - i * 6); ctx.lineTo(20 + i * 1.5, 98 - i * 6); ctx.stroke(); }
    }
    // neck
    ctx.fillStyle = this.shade(skin, -0.12); ctx.beginPath(); ctx.moveTo(41, 72); ctx.lineTo(42, 58); ctx.lineTo(58, 58); ctx.lineTo(59, 72); ctx.closePath(); ctx.fill();
    // head
    const fg = ctx.createLinearGradient(30, 0, 72, 0); fg.addColorStop(0, skinD); fg.addColorStop(0.45, skin); fg.addColorStop(1, skinL);
    ctx.fillStyle = fg; ctx.strokeStyle = out; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(33, 38); ctx.quadraticCurveTo(33, 14, 50, 13); ctx.quadraticCurveTo(68, 14, 67, 38);
    ctx.quadraticCurveTo(67, 52 + 4 * (jw - 1), 58 + 4 * (jw - 1), 61); ctx.quadraticCurveTo(50, 67, 42 - 4 * (jw - 1), 61);
    ctx.quadraticCurveTo(33, 52 + 4 * (jw - 1), 33, 38); ctx.closePath(); ctx.fill(); ctx.stroke();
    // ears
    ctx.fillStyle = this.shade(skin, -0.1);
    ctx.beginPath(); ctx.ellipse(32.5, 40, 3, 5.5, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(67.5, 40, 3, 5.5, 0, 0, 7); ctx.fill(); ctx.stroke();
    // eyes
    const ey = 37, gap = 8 + (look.ey - 1) * 0.8;
    for (const sx of [-1, 1]) {
      ctx.fillStyle = '#f2ece0'; ctx.beginPath(); ctx.ellipse(50 + sx * gap, ey, 3.8, 2.2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = ['#3b2a1a', '#4a6a7a', '#5a4a2a'][look.ey % 3]; ctx.beginPath(); ctx.arc(50 + sx * gap + 0.6, ey, 1.7, 0, 7); ctx.fill();
      ctx.fillStyle = '#100a06'; ctx.beginPath(); ctx.arc(50 + sx * gap + 0.6, ey, 0.8, 0, 7); ctx.fill();
      ctx.strokeStyle = out; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(50 + sx * gap, ey, 3.8, 2.2, 0, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = this.shade(hair, -0.05); ctx.lineWidth = 1.6 + (look.br || 0) * 1.6;
      ctx.beginPath(); ctx.moveTo(50 + sx * (gap - 4.5), ey - 4.6 - (look.br || 0) * 0.4); ctx.lineTo(50 + sx * (gap + 4.2), ey - 5.2 + (look.br || 0) * 0.8); ctx.stroke();
    }
    // nose
    ctx.strokeStyle = this.shade(skin, -0.4); ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (look.ns === 0) { ctx.moveTo(50, 39); ctx.lineTo(52, 47); ctx.lineTo(48.5, 48); }
    else if (look.ns === 1) { ctx.moveTo(50, 38); ctx.quadraticCurveTo(54.5, 45, 51, 49); ctx.lineTo(47.5, 48.5); }
    else { ctx.moveTo(49.5, 38); ctx.lineTo(51.5, 44); ctx.quadraticCurveTo(55, 48, 50, 49.5); ctx.quadraticCurveTo(46, 49, 46.5, 47.5); }
    ctx.stroke();
    // mouth
    ctx.strokeStyle = this.shade(skin, -0.45); ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(45, 54); ctx.quadraticCurveTo(50, 55.5, 55, 54); ctx.stroke();
    // scar
    if (look.sc) { ctx.strokeStyle = 'rgba(150,70,60,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(58, 30); ctx.lineTo(62, 44); ctx.moveTo(57.5, 34); ctx.lineTo(61, 33); ctx.moveTo(59, 39); ctx.lineTo(62.5, 38); ctx.stroke(); }
    // beard
    ctx.fillStyle = hair;
    if (look.bd === 1) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(35, 45); ctx.quadraticCurveTo(50, 72, 65, 45); ctx.quadraticCurveTo(60, 60, 50, 62); ctx.quadraticCurveTo(40, 60, 35, 45); ctx.fill(); ctx.globalAlpha = 1; }
    if (look.bd === 2 || look.bd === 3) {
      ctx.globalAlpha = look.bd === 2 ? 0.85 : 1;
      ctx.beginPath(); ctx.moveTo(34, 42); ctx.quadraticCurveTo(35, 58 + (look.bd === 3 ? 6 : 0), 50, 66 + (look.bd === 3 ? 6 : 0)); ctx.quadraticCurveTo(65, 58 + (look.bd === 3 ? 6 : 0), 66, 42);
      ctx.quadraticCurveTo(62, 52, 57, 52); ctx.quadraticCurveTo(50, 50, 43, 52); ctx.quadraticCurveTo(38, 52, 34, 42); ctx.fill();
      ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(50, 54.5, 4.5, 1.6, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = this.shade(skin, -0.45); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(46, 54.5); ctx.quadraticCurveTo(50, 55.8, 54, 54.5); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = hair;
    }
    if (look.bd === 4 || look.bd === 5 || look.bd === 3 || look.bd === 2) { ctx.beginPath(); ctx.moveTo(43, 52.5); ctx.quadraticCurveTo(50, 49.5, 57, 52.5); ctx.quadraticCurveTo(50, 51.5, 43, 52.5); ctx.lineWidth = 2.6; ctx.strokeStyle = hair; ctx.stroke(); }
    if (look.bd === 5) { ctx.beginPath(); ctx.moveTo(46, 57); ctx.quadraticCurveTo(50, 66, 54, 57); ctx.fill(); }
    // hair / helmet
    const helm = cls === 'murmillo' || cls === 'thraex' || cls === 'secutor' || cls === 'hoplomachus';
    if (!helm) {
      this.hairFront(ctx, look, hair, out);
      if (cls === 'dimachaerus') { ctx.fillStyle = kit.c1; ctx.strokeStyle = out; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(33, 27); ctx.quadraticCurveTo(50, 22, 67, 27); ctx.lineTo(67, 31); ctx.quadraticCurveTo(50, 26, 33, 31); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    } else this.helmFront(ctx, cls, H, kit.c1, out);
    // portrait frame
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, 97, 97);
    ctx.restore();
  },
  hairFront(ctx, look, hair, out) {
    ctx.fillStyle = hair; ctx.strokeStyle = this.shade(hair, -0.3); ctx.lineWidth = 1;
    switch (look.hs) {
      case 0: ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.ellipse(50, 22, 15, 7, 0, Math.PI, 0); ctx.fill(); ctx.globalAlpha = 1; break;
      case 1: ctx.beginPath(); ctx.moveTo(33, 33); ctx.quadraticCurveTo(32, 12, 50, 11); ctx.quadraticCurveTo(68, 12, 67, 33); ctx.quadraticCurveTo(62, 22, 50, 22); ctx.quadraticCurveTo(38, 22, 33, 33); ctx.fill(); break;
      case 2: for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(34 + i * 4, 18 + Math.abs(i - 4) * 1.6, 4.6, 0, 7); ctx.fill(); ctx.stroke(); } break;
      case 3: ctx.beginPath(); ctx.moveTo(32, 46); ctx.quadraticCurveTo(29, 10, 50, 10); ctx.quadraticCurveTo(71, 10, 68, 46); ctx.quadraticCurveTo(66, 26, 50, 22); ctx.quadraticCurveTo(36, 24, 32, 46); ctx.fill(); break;
      case 4: ctx.beginPath(); ctx.moveTo(44, 26); ctx.quadraticCurveTo(44, 4, 50, 3); ctx.quadraticCurveTo(56, 4, 56, 26); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 5: ctx.beginPath(); ctx.moveTo(31, 52); ctx.quadraticCurveTo(26, 12, 50, 10); ctx.quadraticCurveTo(74, 12, 69, 52); ctx.quadraticCurveTo(68, 30, 60, 24); ctx.quadraticCurveTo(48, 28, 40, 23); ctx.quadraticCurveTo(33, 30, 31, 52); ctx.fill(); break;
      case 6: ctx.beginPath(); ctx.ellipse(50, 20, 14, 7, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.arc(50, 9, 5, 0, 7); ctx.fill(); ctx.stroke(); break;
    }
  },
  helmFront(ctx, cls, H, plume, out) {
    const g = ctx.createLinearGradient(28, 0, 72, 0); g.addColorStop(0, H.d); g.addColorStop(0.45, H.m); g.addColorStop(0.75, H.l); g.addColorStop(1, H.m);
    ctx.fillStyle = g; ctx.strokeStyle = out; ctx.lineWidth = 1.4;
    if (cls === 'secutor') {
      ctx.beginPath(); ctx.moveTo(30, 56); ctx.quadraticCurveTo(26, 6, 50, 5); ctx.quadraticCurveTo(74, 6, 70, 56); ctx.lineTo(62, 58); ctx.lineTo(62, 30); ctx.quadraticCurveTo(50, 26, 38, 30); ctx.lineTo(38, 58); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = H.d; ctx.beginPath(); ctx.moveTo(47, 6); ctx.quadraticCurveTo(50, -2, 53, 6); ctx.lineTo(52, 20); ctx.lineTo(48, 20); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = H.l; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(50, 30, 18, -2.6, -0.5); ctx.stroke();
      return;
    }
    // dome above brow
    ctx.beginPath(); ctx.moveTo(30, 30); ctx.quadraticCurveTo(28, 6, 50, 5); ctx.quadraticCurveTo(72, 6, 70, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    // brim
    ctx.fillStyle = H.m; ctx.beginPath(); ctx.ellipse(50, 30, 27, 4.2, 0, 0, 7); ctx.fill(); ctx.stroke();
    // cheek guards
    ctx.fillStyle = H.m;
    ctx.beginPath(); ctx.moveTo(32, 31); ctx.lineTo(31, 50); ctx.quadraticCurveTo(35, 54, 38, 52); ctx.lineTo(38, 32); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(68, 31); ctx.lineTo(69, 50); ctx.quadraticCurveTo(65, 54, 62, 52); ctx.lineTo(62, 32); ctx.closePath(); ctx.fill(); ctx.stroke();
    // open visor grille (thin) so the face stays visible
    ctx.strokeStyle = 'rgba(60,45,30,0.55)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(38, 34); ctx.lineTo(62, 34); ctx.moveTo(38, 44); ctx.lineTo(62, 44); ctx.stroke();
    if (cls === 'murmillo') {
      ctx.fillStyle = plume; ctx.strokeStyle = out;
      ctx.beginPath(); ctx.moveTo(42, 9); ctx.quadraticCurveTo(46, -10, 72, -4); ctx.quadraticCurveTo(64, 2, 60, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = this.shade(plume, -0.3); ctx.lineWidth = 0.8;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(45 + i * 2.6, 9); ctx.lineTo(48 + i * 3.5, -4 + i * 0.6); ctx.stroke(); }
    } else if (cls === 'thraex') {
      ctx.fillStyle = H.m; ctx.strokeStyle = out;
      ctx.beginPath(); ctx.moveTo(44, 8); ctx.quadraticCurveTo(46, -6, 60, -6); ctx.quadraticCurveTo(70, -5, 68, 4); ctx.quadraticCurveTo(62, -1, 56, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = plume; for (const dx of [32, 66]) { ctx.beginPath(); ctx.moveTo(dx, 22); ctx.quadraticCurveTo(dx + (dx < 50 ? -6 : 6), 4, dx + (dx < 50 ? -2 : 2), -2); ctx.quadraticCurveTo(dx + (dx < 50 ? 2 : -2), 10, dx, 22); ctx.fill(); }
    } else if (cls === 'hoplomachus') {
      ctx.fillStyle = plume; ctx.strokeStyle = out; ctx.lineWidth = 1;
      for (const dx of [40, 60]) { ctx.beginPath(); ctx.moveTo(dx - 2, 10); ctx.quadraticCurveTo(dx - 7, -12, dx, -16); ctx.quadraticCurveTo(dx + 4, -4, dx + 2, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
  },

  // ------------------------------------------------------------ crests & symbols (SVG)
  symbolPath(sy, col, light) {
    const c = col, l = light;
    switch (sy) {
      case 0: return `<g fill="${c}" stroke="${l}" stroke-width="1.5"><path transform="rotate(45 50 52)" d="M47 18h6v44h-6z M40 62h20v5H40z M47 67h6v12h-6z"/><path transform="rotate(-45 50 52)" d="M47 18h6v44h-6z M40 62h20v5H40z M47 67h6v12h-6z"/></g>`;
      case 1: return `<g fill="${c}" stroke="${l}" stroke-width="1.5"><path d="M48 30h4v54h-4z"/><path d="M50 14 L58 34 L50 30 L42 34 Z"/><path d="M42 74h16v4H42z"/></g>`;
      case 2: return `<g fill="${c}" stroke="${l}" stroke-width="1.6"><path d="M30 64 Q28 26 52 24 Q74 26 72 52 L66 54 L66 64 Z"/><path d="M40 20 Q52 6 70 16 Q60 18 56 26 Z"/><path d="M50 40h16v4H50z M50 48h14v3H50z" fill="${l}"/></g>`;
      case 3: return `<g fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"><path d="M38 80 Q22 56 36 26"/><path d="M62 80 Q78 56 64 26"/></g><g fill="${c}">${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${32 - i * 0.6}" cy="${72 - i * 10}" rx="6" ry="3" transform="rotate(-40 ${32 - i * 0.6} ${72 - i * 10})"/><ellipse cx="${68 + i * 0.6}" cy="${72 - i * 10}" rx="6" ry="3" transform="rotate(40 ${68 + i * 0.6} ${72 - i * 10})"/>`).join('')}</g>`;
      case 4: return `<g fill="${c}" stroke="${l}" stroke-width="1.2"><circle cx="50" cy="52" r="14"/>${[...Array(12)].map((_, i) => `<path transform="rotate(${i * 30} 50 52)" d="M48 30 L50 20 L52 30 Z"/>`).join('')}</g>`;
      case 5: return `<g fill="${c}" stroke="${l}" stroke-width="1.5"><path d="M18 76 L40 36 L52 54 L62 40 L82 76 Z"/><path d="M40 36 L46 47 L36 47 Z" fill="${l}"/></g>`;
      case 6: return `<g fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"><path d="M20 44 q10 -10 20 0 t20 0 t20 0"/><path d="M20 58 q10 -10 20 0 t20 0 t20 0"/><path d="M20 72 q10 -10 20 0 t20 0 t20 0"/></g>`;
      case 7: return `<g fill="${c}" stroke="${l}" stroke-width="1.5"><path d="M34 80 V36 H38 V30 H44 V36 H48 V30 H52 V36 H56 V30 H62 V36 H66 V80 Z"/><path d="M46 80 V66 Q50 60 54 66 V80 Z" fill="${l}"/></g>`;
      case 8: return `<g fill="${c}" stroke="${l}" stroke-width="1.5"><path d="M38 44 Q50 38 62 44 L60 70 Q50 80 40 70 Z"/><path d="M38 46 Q22 44 20 28 Q30 38 40 40 Z"/><path d="M62 46 Q78 44 80 28 Q70 38 60 40 Z"/><circle cx="45" cy="54" r="2" fill="${l}"/><circle cx="55" cy="54" r="2" fill="${l}"/></g>`;
      case 9: return `<g fill="${c}" stroke="${l}" stroke-width="1.2"><path d="M50 60 Q36 30 14 30 Q24 40 22 46 Q30 46 32 52 Q40 52 50 60 Z"/><path d="M50 60 Q64 30 86 30 Q76 40 78 46 Q70 46 68 52 Q60 52 50 60 Z"/><circle cx="50" cy="62" r="6"/></g>`;
      case 10: return `<g fill="${c}" stroke="${l}" stroke-width="1.5"><path d="M50 22 L57 44 L80 44 L61 57 L68 80 L50 66 L32 80 L39 57 L20 44 L43 44 Z"/></g>`;
      case 11: return `<g fill="${c}" stroke="${l}" stroke-width="1.5"><g transform="rotate(35 50 52)"><path d="M48 22h4v60h-4z"/><path d="M52 24 Q68 28 66 44 Q60 38 52 40 Z"/></g><g transform="rotate(-35 50 52)"><path d="M48 22h4v60h-4z"/><path d="M48 24 Q32 28 34 44 Q40 38 48 40 Z"/></g></g>`;
    }
    return '';
  },
  shapePath(sh) {
    switch (sh) {
      case 0: return 'M10 8 H90 V45 C90 72 70 88 50 97 C30 88 10 72 10 45 Z';
      case 1: return 'M50 6 A45 45 0 1 1 49.9 6 Z';
      case 2: return 'M14 6 Q50 0 86 6 V94 Q50 100 14 94 Z';
      case 3: return 'M50 4 C80 4 86 30 86 50 C86 72 78 96 50 96 C22 96 14 72 14 50 C14 30 20 4 50 4 Z';
      case 4: return 'M12 4 H88 V78 L50 97 L12 78 Z';
      case 5: return 'M50 12 A38 38 0 1 1 49.9 12 Z';
      case 6: return 'M50 3 L90 32 L50 97 L10 32 Z';
      case 7: return 'M50 4 L90 27 V73 L50 96 L10 73 V27 Z';
    }
    return '';
  },
  crestSVG(crest, size = 40) {
    if (!crest) return '';
    const c1 = crest.c1, c2 = crest.c2;
    const dark = this.shade(c1, -0.45);
    const p = this.shapePath(crest.sh);
    const id = 'cl' + Math.abs(hashStr(JSON.stringify(crest))) % 1e8;
    const div = (crest.sh + crest.sy) % 3;
    const division = div === 0 ? `<rect x="0" y="0" width="50" height="100" fill="${this.shade(c1, -0.15)}"/>` : div === 1 ? `<path d="M0 100 L100 0 L100 100 Z" fill="${this.shade(c1, -0.15)}"/>` : `<rect x="0" y="62" width="100" height="40" fill="${this.shade(c1, -0.15)}"/>`;
    const laurel = crest.sh === 5 ? `<g fill="#c9a43c">${[...Array(10)].map((_, i) => { const a = -Math.PI * 0.85 + i * 0.19; const x = 50 + Math.cos(a) * 45, y = 52 + Math.sin(a) * 45; const b = Math.PI - a; return `<ellipse cx="${x.toFixed(1)}" cy="${(y).toFixed(1)}" rx="6" ry="2.6" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/><ellipse cx="${(100 - x).toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="2.6" transform="rotate(${(-a * 180 / Math.PI - 90).toFixed(0)} ${(100 - x).toFixed(1)} ${y.toFixed(1)})"/>`; }).join('')}</g>` : '';
    return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="${id}"><path d="${p}"/></clipPath></defs>${laurel}<path d="${p}" fill="${c1}"/><g clip-path="url(#${id})">${division}</g><path d="${p}" fill="none" stroke="${dark}" stroke-width="5"/><path d="${p}" fill="none" stroke="${c2}" stroke-width="2" transform="translate(50 50) scale(0.86) translate(-50 -50)"/>${this.symbolPath(crest.sy, c2, dark)}</svg>`;
  },
  regionSVG(regId, size = 28) {
    const r = REGION_BY_ID[regId]; if (!r) return '';
    const sy = { laurel: 3, mountain: 5, sun: 4, wave: 6, axes: 11 }[r.sym];
    return `<svg class="regsym" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="${r.pal.a}" stroke="${r.pal.b}" stroke-width="5"/>${this.symbolPath(sy, r.pal.b, this.shade(r.pal.a, -0.4))}</svg>`;
  },

  // ------------------------------------------------------------ icons (24x24 stroke icons)
  ICONS: {
    hub: '<path d="M3 10 L12 4 L21 10"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 20h18"/>',
    squad: '<path d="M6 20v-7a6 6 0 0 1 12 0v7"/><path d="M6 14h12"/><path d="M10 14v4M14 14v4"/><path d="M9 7 Q12 2 17 5"/>',
    match: '<path d="M5 19 L17 7M15 5l4 4"/><path d="M19 19 L7 7M9 5L5 9"/><path d="M4 16l4 4M20 16l-4 4"/>',
    transfer: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    leagues: '<path d="M4 20V10h4v10M10 20V5h4v15M16 20v-7h4v7"/>',
    cups: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 20h8M10 17h4"/>',
    facilities: '<path d="M3 20h18M5 20V9l7-5 7 5v11"/><path d="M9 20v-6h6v6"/>',
    equipment: '<path d="M4 15h16l-2 4H6z"/><path d="M8 15V9h8v6"/><path d="M12 9V4"/><path d="M9 4h6"/>',
    sponsors: '<circle cx="12" cy="10" r="6"/><path d="M9 15l-2 6 5-3 5 3-2-6"/><path d="M12 7v6M9.5 10h5"/>',
    finance: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
    history: '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7"/><path d="M6 4a2 2 0 0 0-2 2v2h4"/><path d="M9 9h7M9 13h7M9 17h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    next: '<path d="M5 6l6 6-6 6M12 6l6 6-6 6"/>',
    full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    sound: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    injury: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 9.5h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"/>',
    eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
    sword: '<path d="M14 4h6v6L9 21l-3-3z"/><path d="M5 15l4 4"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    play: '<path d="M7 4l12 8-12 8z"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M7 9h7M7 12h7M7 15h5"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>'
  },
  icon(name, size = 20, cls = '') {
    return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${this.ICONS[name] || ''}</svg>`;
  },
  facilitySVG(fid, lv) {
    const L = lv || 1;
    const stone = '#b9ab8f', dark = '#5a4a36', bronze = '#b07a3a';
    const bg = `<rect width="120" height="70" rx="6" fill="#2a1f17"/><rect y="52" width="120" height="18" fill="#6b5a40"/>`;
    let g = '';
    if (fid === 'train') {
      for (let i = 0; i < Math.min(5, L + 1); i++) g += `<rect x="${14 + i * 20}" y="24" width="6" height="30" fill="#7a5530" stroke="${dark}"/><path d="M${10 + i * 20} 30h14" stroke="#9a7040" stroke-width="3"/>`;
      g += `<path d="M86 50 L104 20" stroke="#c9c4ba" stroke-width="3"/><path d="M82 46l8 4" stroke="${bronze}" stroke-width="3"/>`;
    } else if (fid === 'med') {
      g += `<rect x="28" y="${40 - L * 3}" width="64" height="${14 + L * 3}" fill="${stone}" stroke="${dark}"/><path d="M28 ${40 - L * 3} L60 ${22 - L * 3} L92 ${40 - L * 3}" fill="#9e2a22" stroke="${dark}"/>`;
      g += `<path d="M56 ${44 - L}h8M60 ${40 - L}v8" stroke="#efe6d6" stroke-width="3"/>`;
      for (let i = 0; i < L; i++) g += `<ellipse cx="${18 + i * 5}" cy="50" rx="3" ry="2" fill="#5f9e57"/>`;
    } else if (fid === 'scout') {
      g += `<rect x="50" y="${50 - 8 * L}" width="16" height="${8 * L + 4}" fill="${stone}" stroke="${dark}"/><path d="M47 ${50 - 8 * L}h22l-3 -6h-16z" fill="${dark}"/>`;
      g += `<circle cx="90" cy="24" r="10" fill="none" stroke="#d4ad52" stroke-width="2"/><path d="M90 16 L93 24 L90 32 L87 24 Z" fill="#d4ad52"/>`;
      for (let i = 0; i < L; i++) g += `<circle cx="${14 + i * 7}" cy="20" r="2.2" fill="#d4ad52"/>`;
    } else if (fid === 'arena') {
      const rows = L + 1;
      for (let r = 0; r < rows; r++) g += `<path d="M${14 - r * 2} ${52 - r * 7} Q60 ${38 - r * 9} ${106 + r * 2} ${52 - r * 7}" fill="none" stroke="${r % 2 ? stone : '#d8cbb0'}" stroke-width="5"/>`;
      g += `<ellipse cx="60" cy="56" rx="34" ry="7" fill="#d9c39a"/>`;
      for (let i = 0; i < L * 2; i++) g += `<path d="M${22 + i * 9} ${30 - L * 3}v-8" stroke="#9e2a22" stroke-width="1.5"/><path d="M${22 + i * 9} ${22 - L * 3}l5 2-5 2" fill="#d4ad52"/>`;
    }
    return `<svg viewBox="0 0 120 70" class="facart" aria-hidden="true">${bg}${g}</svg>`;
  },
  clsSVG(cls, size = 18) {
    // tiny class glyph
    const p = {
      murmillo: '<path d="M7 3h10v18H7z" /><path d="M12 6v12"/>',
      retiarius: '<path d="M12 21V6M8 3v5h8V3M12 3v5"/>',
      thraex: '<path d="M6 19 Q8 9 18 5"/><path d="M5 16l4 4"/>',
      secutor: '<ellipse cx="12" cy="12" rx="6" ry="9"/><circle cx="12" cy="12" r="1.5"/>',
      dimachaerus: '<path d="M5 19L15 5M19 19L9 5"/>',
      hoplomachus: '<circle cx="9" cy="14" r="5"/><path d="M14 20L20 3"/>'
    }[cls] || '';
    return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }
};
